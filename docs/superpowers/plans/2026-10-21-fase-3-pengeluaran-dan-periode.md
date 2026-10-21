# Fase 3 — Pengeluaran, Periode Akuntansi & Pindah Dana Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementasi sistem pencatatan dan persetujuan pengeluaran kas (`expenses`) dengan bukti nota wajib, persetujuan berjenjang (multi-tier approval dengan ambang nominal majelis) dan larangan menyetujui pengajuan sendiri (anti self-approval), perlindungan saldo negatif (`allow_negative_balance`), pemindahan pos dana manual (`fund_transfers`), saldo awal, serta penutupan periode akuntansi (`accounting_periods`) yang secara ketat menolak transaksi baru pada periode tertutup.

**Architecture:**
- `expenses`: tabel pengeluaran dengan bukti nota fisik (`proof_path` wajib), status flow `pending -> approved -> paid` (atau `rejected`). Pencatatan buku besar keluar (`Direction::Out`) hanya terjadi saat pengeluaran dibayarkan (`paid`).
- **Multi-tier & Anti Self-Approval**:
  - `submitted_by` dilarang menyetujui pengeluarannya sendiri (`anti self-approval`).
  - Bila nominal > `ChurchSetting.expense_approval_threshold` (dan threshold > 0): persetujuan wajib oleh Majelis / Ketua (atau Admin). Bendahara tidak dapat menyetujui sendirian.
  - Bila nominal <= threshold atau threshold = 0: persetujuan dapat dilakukan oleh Bendahara, Majelis, atau Admin.
  - Pembayaran pengeluaran (`paid`) dilakukan oleh Bendahara atau Admin setelah status `approved`.
- **Negative Balance Protection**:
  - Pengecekan saldo pos dana (`LedgerEntry::getBalance($fundId)`) sebelum persetujuan dan sebelum pembayaran.
  - Bila saldo tidak mencukupi dan `ChurchSetting.allow_negative_balance` bernilai `false`, transaksi ditolak dengan pesan validasi yang jelas.
  - Pengecekan serupa berlaku pada pos dana asal (`from_fund_id`) saat persetujuan pindah dana manual.
- **Manual Fund Transfer (`fund_transfers`)**:
  - Pengajuan pemindahan dana antar-pos dana (`from_fund_id` ke `to_fund_id`).
  - Saat disetujui, sistem membukukan 2 entri buku besar otomatis: 1 entri OUT pada `from_fund_id` dan 1 entri IN pada `to_fund_id`.
- **Accounting Period & Period Close (`accounting_periods`)**:
  - Pengelolaan periode pembukuan dengan status buka/tutup (`is_closed`).
  - Saldo awal: dicatat sebagai entri buku besar masuk (`Direction::In`) dengan sumber periode pembuka.
  - Kunci Integritas Tutup Periode: setiap upaya penambahan transaksi baru (buku besar / pengeluaran / berita acara hitung / transfer) dengan tanggal pada periode tertutup akan ditolak secara mutlak (`DomainException` / `ValidationException`).
- **Frontend Inertia React**:
  - Halaman pengeluaran: `resources/js/pages/expenses/{index,create,show,approve}.tsx`
  - Halaman pindah dana: `resources/js/pages/transfers/{index,create}.tsx`
  - Halaman periode: `resources/js/pages/admin/periods/{index,form}.tsx`

**Tech Stack:** Laravel 12, Inertia 2, React 19, TypeScript, Tailwind 4, shadcn/ui, PostgreSQL, Pest.

**Spec:** `docs/superpowers/specs/2026-10-21-sistem-kas-gereja-design.md` §6.2, §8.5, §8.6, §8.7, §8.8, §8.9, §9; `docs/WORKFLOW.md` §5 (Fase 3).

---

## Global Constraints

- Nominal uang: **bigint rupiah** (`amount`), bilangan bulat positif, tanpa float/desimal.
- Pengeluaran wajib menyertakan bukti fisik / nota (`proof_path`).
- Integritas Buku Besar append-only tetap terjaga; hanya bertambah lewat `LedgerService::record`.
- Anti self-approval: Pengaju (`submitted_by` / `requested_by`) tidak boleh menyetujui pengajuannya sendiri.
- Tutup Periode: Tidak boleh ada transaksi baru yang masuk ke tanggal dalam periode yang sudah berstatus `is_closed = true`.
- Teks antarmuka pengguna: Bahasa Indonesia. Kode, migration, nama kolom, & komentar: Bahasa Inggris.
- Pengujian: Menghindari duplikasi lingkungan; tes dijalankan pada database `kas_gereja_test_f3`.

---

## Tasks

### Task 1: Model & Migrasi `Expense` + Enums
- [ ] Buat enum `App\Enums\ExpenseStatus` (`pending`, `approved`, `rejected`, `paid`).
- [ ] Buat migration `database/migrations/2026_10_21_140000_create_expenses_table.php` dengan kolom:
  - `id`
  - `expense_number` (string, unique, index)
  - `payee` (string)
  - `amount` (unsignedBigInteger)
  - `date` (date, index)
  - `account_id` (foreignId -> accounts)
  - `fund_id` (foreignId -> funds)
  - `category_id` (foreignId -> categories)
  - `description` (text, nullable)
  - `proof_path` (string)
  - `status` (string, index)
  - `submitted_by` (foreignId -> users)
  - `approved_by` (foreignId nullable -> users)
  - `approved_at` (timestamp nullable)
  - `paid_at` (timestamp nullable)
  - `notes` (text, nullable)
  - `timestamps`
- [ ] Buat model `App\Models\Expense` dengan cast, relasi (`account`, `fund`, `category`, `submitter`, `approver`), trait `Audited`, dan generator nomor nota `generateExpenseNumber()`.
- [ ] Daftarkan `'expense' => Expense::class` pada `AppServiceProvider::enforceMorphMap`.

### Task 2: Service & Logika Persetujuan Pengeluaran & Pembayaran
- [ ] Buat `App\Services\ExpenseService`:
  - `submit(array $data, User $user, UploadedFile $proof)`: validasi nota wajib, simpan file, generate expense_number, set status `pending`.
  - `approve(Expense $expense, User $user, ?string $notes = null)`:
    - Cek anti self-approval: jika `$expense->submitted_by === $user->id`, lempar 403 / exception.
    - Cek batas ambang kewenangan: jika `threshold > 0` dan `amount > threshold`, user harus memiliki role `Majelis` atau `Admin`.
    - Cek perlindungan saldo negatif pos dana (`LedgerEntry::getBalance($expense->fund_id)`).
    - Cek periode akuntansi tertutup pada `$expense->date`.
    - Update `status = approved`, `approved_by = $user->id`, `approved_at = now()`.
  - `reject(Expense $expense, User $user, string $notes)`:
    - Cek anti self-approval.
    - Update `status = rejected`, `notes = $notes`.
  - `pay(Expense $expense, User $user)`:
    - User harus Bendahara atau Admin.
    - Status harus `approved`.
    - Cek perlindungan saldo negatif pos dana.
    - Cek periode akuntansi tertutup pada tanggal transaksi.
    - Catat `LedgerEntry` arah `Out`, sumber `expense`, idempotency key `exp-{$expense->id}-out`.
    - Update `status = paid`, `paid_at = now()`.

### Task 3: Pindah Dana Manual (`FundTransfer`)
- [ ] Buat enum `App\Enums\FundTransferStatus` (`pending`, `approved`, `rejected`).
- [ ] Buat migration `database/migrations/2026_10_21_141000_create_fund_transfers_table.php`:
  - `id`
  - `from_fund_id` (foreignId -> funds)
  - `to_fund_id` (foreignId -> funds)
  - `account_id` (foreignId -> accounts)
  - `amount` (unsignedBigInteger)
  - `transfer_date` (date)
  - `reason` (text)
  - `status` (string, index)
  - `requested_by` (foreignId -> users)
  - `approved_by` (foreignId nullable -> users)
  - `approved_at` (timestamp nullable)
  - `notes` (text nullable)
  - `timestamps`
- [ ] Buat model `App\Models\FundTransfer` dan relasi ke `fromFund`, `toFund`, `account`, `requester`, `approver`.
- [ ] Daftarkan `'fund_transfer' => FundTransfer::class` di `AppServiceProvider`.
- [ ] Buat `App\Services\FundTransferService`:
  - Validasi pos dana asal != pos dana tujuan.
  - Persetujuan: anti self-approval (`requested_by !== $user->id`), pengecekan saldo negatif pada pos asal, pembukuan 2 entri buku besar (OUT dari `from_fund`, IN ke `to_fund`).

### Task 4: Periode Akuntansi, Saldo Awal, & Kunci Tutup Periode
- [ ] Buat migration `database/migrations/2026_10_21_142000_create_accounting_periods_table.php`:
  - `id`
  - `name` (string)
  - `start_date` (date)
  - `end_date` (date)
  - `is_closed` (boolean, default false)
  - `closed_at` (timestamp nullable)
  - `closed_by` (foreignId nullable -> users)
  - `timestamps`
- [ ] Buat model `App\Models\AccountingPeriod` dengan helper `isDateClosed(string $date): bool`.
- [ ] Daftarkan `'accounting_period' => AccountingPeriod::class` di `AppServiceProvider`.
- [ ] Integrasikan pengecekan tutup periode:
  - Di `LedgerService::record()`: tolak pencatatan pada tanggal di dalam periode yang sudah ditutup.
  - Di `CountSheetRequest` & `CountSheetController`: tolak pengajuan/edit pada tanggal periode tertutup.
  - Di `ExpenseRequest`: tolak tanggal pengeluaran pada periode tertutup.
  - Di `FundTransferRequest`: tolak tanggal transfer pada periode tertutup.
- [ ] Saldo awal: fungsi untuk mencatat saldo awal ke buku besar (`Direction::In`, `source_type = 'accounting_period'`).

### Task 5: Controller & Routes
- [ ] Buat `ExpenseController`: index, create, store, show, approveView, approve, reject, pay.
- [ ] Buat `FundTransferController`: index, create, store, show, approve, reject.
- [ ] Buat `Admin\AccountingPeriodController`: index, create, store, close, storeOpeningBalance.
- [ ] Daftarkan rute di `routes/web.php` dan `routes/admin.php`.
- [ ] Perbarui `resources/js/components/app-sidebar.tsx` dengan link ke Pengeluaran, Pindah Dana, dan Periode Akuntansi.

### Task 6: Frontend Inertia React Pages
- [ ] `resources/js/pages/expenses/index.tsx`: Daftar pengeluaran, filter status, summary nominal, badge, tombol aksi.
- [ ] `resources/js/pages/expenses/create.tsx`: Form pengajuan pengeluaran dengan upload nota, preview gambar, input penerima, akun kas, pos dana, kategori, nominal, tanggal.
- [ ] `resources/js/pages/expenses/show.tsx`: Detail lengkap pengeluaran, visual nota/kuitansi, linimasa persetujuan, tombol aksi bayar/setujui/tolak.
- [ ] `resources/js/pages/expenses/approve.tsx`: Antarmuka persetujuan cepat pengeluaran menunggu persetujuan dengan indikasi ambang batas majelis.
- [ ] `resources/js/pages/transfers/index.tsx`: Daftar pengajuan pindah dana antar-pos beserta status dan aksi persetujuan.
- [ ] `resources/js/pages/transfers/create.tsx`: Form permohonan pindah dana antar-pos dana.
- [ ] `resources/js/pages/admin/periods/index.tsx`: Daftar periode akuntansi, status aktif/tutup, tombol tutup periode.
- [ ] `resources/js/pages/admin/periods/form.tsx`: Form pembuatan periode dan input saldo awal.

### Task 7: Pengujian Otomatis & Verifikasi
- [ ] Tulis `tests/Feature/Expenses/ExpenseApprovalTest.php`:
  - Pengajuan pengeluaran dengan upload nota wajib.
  - Penolakan bila nota tidak disertakan.
  - Larangan pengaju menyetujui pengajuannya sendiri (anti self-approval).
  - Ambang batas persetujuan: Bendahara tidak dapat menyetujui pengeluaran di atas ambang tanpa Majelis/Admin.
  - Majelis dapat menyetujui pengeluaran di atas ambang.
  - Pembayaran pengeluaran mencatat `LedgerEntry` keluar dengan parameter akurat.
- [ ] Tulis `tests/Feature/Expenses/NegativeBalanceTest.php`:
  - Penolakan persetujuan/pembayaran pengeluaran saat saldo pos dana kurang (default: `allow_negative_balance = false`).
  - Izin transaksi saat `allow_negative_balance = true`.
  - Penolakan pindah dana saat saldo pos dana asal tidak mencukupi.
- [ ] Tulis `tests/Feature/Expenses/FundTransferTest.php`:
  - Pengajuan pindah dana manual.
  - Penolakan transfer ke pos dana yang sama.
  - Persetujuan pindah dana mencatat 2 entri buku besar (1 OUT, 1 IN).
- [ ] Tulis `tests/Feature/Ledger/PeriodCloseTest.php`:
  - Pembuatan periode akuntansi dan pencatatan saldo awal.
  - Penutupan periode akuntansi (`is_closed = true`).
  - Penolakan transaksi buku besar baru pada tanggal di periode tertutup.
  - Penolakan pembuatan pengeluaran baru pada periode tertutup.
  - Penolakan penguncian berita acara hitung pada periode tertutup.
  - Transaksi pada periode terbuka tetap berjalan lancar.
- [ ] Jalankan `DB_DATABASE=kas_gereja_test_f3 php artisan test` (harus 100% pass).
- [ ] Jalankan `./node_modules/.bin/tsc --noEmit` (harus 0 errors).
- [ ] Commit rencana dan implementasi sesuai konvensi.
