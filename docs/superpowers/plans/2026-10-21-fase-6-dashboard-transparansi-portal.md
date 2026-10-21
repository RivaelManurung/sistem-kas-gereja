# Fase 6 — Dashboard, Transparansi & Portal Jemaat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun Dashboard Keuangan Internal dengan widget metrik saldo & alert aksi operasional, Halaman Publik Transparansi tanpa login dengan privasi data ketat (hanya agregat per kategori `is_public` & pos dana), Portal Jemaat terotentikasi untuk histori persembahan pribadi dengan proteksi IDOR penuh dan bukti kontribusi tahunan, pengujian invarian sistem lintas fase (spec §11), serta dokumentasi arsitektur dan alur kerja di README.md.

**Architecture:**
- **Dashboard Internal** (`/dashboard`, `DashboardController`): Menyajikan saldo berjalan per dana dan rekening kas, tren bulanan arus kas masuk vs keluar (6-12 bulan terakhir), serta widget alert yang memerlukan aksi operasional: berita acara yang menunggu konfirmasi/verifikasi, pengeluaran kas yang menunggu persetujuan (dengan tanda peringatan khusus bila melebihi ambang batas persetujuan majelis), dan sesi ibadah yang belum dibuatkan berita acara hitung.
- **Halaman Transparansi Publik** (`/transparansi`, `TransparencyController`): Halaman publik tanpa login yang dapat diaktifkan/dinonaktifkan melalui `ChurchSetting.public_page_enabled`. Menerapkan aturan privasi ketat: HANYA menampilkan total agregat per kategori kas publik (`is_public = true`) dan total saldo per pos dana. Tidak pernah membocorkan nama jemaat, nama penerima dana/toko (payee), nomor rekening perorangan, atau nominal transaksi perorangan.
- **Portal Jemaat** (`/portal`, `MemberPortalController`): Area terproteksi untuk pengguna yang terhubung dengan data jemaat (`members`). Menampilkan riwayat persembahan atas nama sendiri secara eksklusif dengan proteksi IDOR yang kuat (tidak dapat mengakses atau melihat ID donasi jemaat lain), ringkasan tahunan, serta halaman bukti setoran tahunan / receipt yang siap dicetak.
- **Pengujian Invarian Sistem** (spec §11, `tests/Feature/Invariants/SystemInvariantsTest.php`): Menguji ketetapan invarian sistem: buku besar append-only tidak bisa diubah/dihapus, endpoint transparansi tidak pernah membocorkan identitas/detail perorangan, dan proteksi IDOR portal jemaat tidak bisa ditembus.
- **Dokumentasi Sistem** (`README.md`): Panduan lengkap dalam bahasa Indonesia mencakup arsitektur, konfigurasi PostgreSQL & env, matriks hak akses 7 peran pengguna, dan diagram alur transaksi dari hitung sampai transparansi.

**Tech Stack:** Laravel 12, Inertia 2, React 19, TypeScript, Tailwind 4, shadcn/ui, PostgreSQL, Pest.

**Spec:** `docs/superpowers/specs/2026-10-21-sistem-kas-gereja-design.md` §10, §11, §12

---

## Global Constraints

- Nominal uang: **bigint rupiah**, tidak pernah float, tidak pernah teks.
- Buku besar **append-only**; tabel `ledger_entries` tidak bisa di-UPDATE atau di-DELETE.
- Halaman publik transparansi **TIDAK PERNAH** memuat nama jemaat, nama pihak ketiga/toko, detail persembahan individual, atau catatan internal.
- Portal jemaat memiliki batas akses isolasi ketat: jemaat A **TIDAK BISA** melihat atau mencetak data jemaat B dalam kondisi apa pun (IDOR protected).
- Desain UI mengikuti panduan `DESIGN.md`: tipografi Inter, angka `tabular-nums`, format mata uang Indonesia `formatRupiah`, badge status seragam, dan skema warna semantik.
- TDD ketat: tulis test Pest dulu -> verifikasi gagal -> implementasi -> verifikasi lulus.
- Batasan fase: **JANGAN** membuat laporan periode PDF dengan tanda tangan elektronik dan pembekuan hash (itu lingkup Fase 5).

## Review Focus

1. **Dashboard Data Accuracy**: Saldo dana & rekening dihitung langsung dari entri buku besar (`LedgerEntry::getBalance()` / `LedgerEntry::getAccountBalance()`). Widget alert menampilkan item yang memerlukan tindakan pengguna secara akurat (status draft, confirmed, pending expense, uncounted sessions).
2. **Strict Privacy on Transparency**: Memverifikasi bahwa payload JSON Inertia pada rute `/transparansi` sama sekali tidak menyertakan kolom identitas pribadi (donor_name, payee, member details, per-transaction notes).
3. **IDOR & Boundary Checks**: Memverifikasi bahwa jemaat hanya bisa mengakses persembahan miliknya (`donations.member_id = auth->member->id`) dan upaya mengakses persembahan jemaat lain menghasilkan respons 403 Forbidden.
4. **Append-Only Invariant Enforcement**: Percobaan update/delete terhadap `LedgerEntry` selalu melempar `LogicException` dan gagal di database.
5. **TypeScript & Static Analysis**: Tidak ada error TypeScript (`tsc --noEmit`), build Vite sukses, dan seluruh test suite Pest hijau.

---

### Task 1: Rencana Implementasi Fase 6
- [x] Tulis dokumen rencana ke `docs/superpowers/plans/2026-10-21-fase-6-dashboard-transparansi-portal.md`.
- [x] Commit rencana implementasi.

---

### Task 2: Dashboard Internal (`/dashboard`)

**Files:**
- Create:
  - `app/Http/Controllers/DashboardController.php`
  - `tests/Feature/Dashboard/DashboardMetricsTest.php`
- Modify:
  - `routes/web.php` (update rute `/dashboard` ke `DashboardController@index`)
  - `resources/js/pages/dashboard.tsx`
  - `app/Models/User.php` (tambahkan relasi `member()`)

**Interfaces:**
- Produces:
  - Props Inertia `dashboard`:
    - `fundBalances`: array of `{ id, code, name, balance }`
    - `accountBalances`: array of `{ id, code, name, type, balance }`
    - `monthlyTrend`: array of `{ month: string, label: string, income: number, expense: number, net: number }`
    - `summary`: `{ totalBalance: number, thisMonthIncome: number, thisMonthExpense: number }`
    - `alerts`:
      - `waitingConfirmationCountSheets`: list of count sheets status `draft` dengan info sesi/acara, tanggal, total, jumlah konfirmasi
      - `waitingVerificationCountSheets`: list of count sheets status `confirmed`
      - `waitingApprovalExpenses`: list of expenses status `pending` dengan properti `is_above_threshold`, payee, nominal, pos dana
      - `uncountedSessions`: list of service sessions yang belum memiliki berita acara
  - UI `resources/js/pages/dashboard.tsx` dengan kartu ringkasan saldo, alert banner untuk item yang memerlukan aksi, tabel saldo dana & rekening, dan visualisasi tren pemasukan vs pengeluaran bulanan.

- [x] **Step 1: Tulis test fitur untuk Dashboard** di `tests/Feature/Dashboard/DashboardMetricsTest.php`
  - Test metrik saldo per dana dan rekening cocok dengan buku besar.
  - Test kalkulasi tren bulanan pemasukan dan pengeluaran.
  - Test alert berita acara menunggu konfirmasi dan verifikasi.
  - Test alert pengeluaran kas menunggu persetujuan (dan penandaan badge melebihi ambang batas).
  - Test alert sesi ibadah yang belum dihitung.
- [x] **Step 2: Jalankan test — pastikan FAIL**.
- [x] **Step 3: Implementasi `DashboardController` dan update rute**.
- [x] **Step 4: Implementasi UI `resources/js/pages/dashboard.tsx`** dengan gaya shadcn/ui dan `DESIGN.md`.
- [x] **Step 5: Jalankan test — pastikan PASS**.
- [x] **Step 6: Commit** `feat(dashboard): internal dashboard with balances, trends and action alerts`.

---

### Task 3: Halaman Transparansi Publik (`/transparansi`)

**Files:**
- Create:
  - `app/Http/Controllers/TransparencyController.php`
  - `resources/js/pages/transparency/index.tsx`
  - `tests/Feature/Transparency/PublicTransparencyTest.php`
- Modify:
  - `routes/web.php` (rute publik `/transparansi`)

**Interfaces:**
- Produces:
  - Rute publik tanpa otentikasi `/transparansi`.
  - Pengecekan toggle `ChurchSetting.public_page_enabled`. Jika dinonaktifkan, kembalikan 404 (Not Found).
  - Sanitasi ketat: agregasi HANYA dari kategori publik (`categories.is_public = true`) dan pos dana umum. Tidak ada tabel donatur atau data perorangan.
  - Props Inertia:
    - `churchName`: nama gereja dari pengaturan
    - `fundBalances`: array of `{ name, balance }`
    - `incomeByCategory`: array of `{ name, amount }`
    - `expenseByCategory`: array of `{ name, amount }`
    - `monthlyTrend`: array of `{ month, income, expense }`
    - `summary`: `{ totalBalance, totalIncome, totalExpense }`
  - UI `resources/js/pages/transparency/index.tsx` dengan desain bersih berstandar laporan publik.

- [x] **Step 1: Tulis test fitur untuk Halaman Transparansi** di `tests/Feature/Transparency/PublicTransparencyTest.php`
  - Test akses publik tanpa perlu login jika `public_page_enabled` aktif.
  - Test respons 404 jika `public_page_enabled` nonaktif.
  - Test kalkulasi agregat pemasukan & pengeluaran kategori publik.
  - Test bahwa kategori non-publik (`is_public = false`) dikecualikan dari agregat publik.
  - Test sanitasi data: pastikan respon tidak membocorkan nama jemaat, persembahan per orang, atau payee.
- [x] **Step 2: Jalankan test — pastikan FAIL**.
- [x] **Step 3: Implementasi `TransparencyController` dan rute**.
- [x] **Step 4: Implementasi UI `resources/js/pages/transparency/index.tsx`**.
- [x] **Step 5: Jalankan test — pastikan PASS**.
- [x] **Step 6: Commit** `feat(transparency): public transparency page with strict privacy sanitization`.

---

### Task 4: Portal Jemaat (`/portal`)

**Files:**
- Create:
  - `app/Http/Controllers/MemberPortalController.php`
  - `resources/js/pages/portal/index.tsx`
  - `resources/js/pages/portal/statement.tsx`
  - `tests/Feature/Portal/MemberPortalTest.php`
- Modify:
  - `routes/web.php` (tambahkan rute `/portal`, `/portal/statement`, `/portal/receipt/{donation}`)
  - `resources/js/components/app-sidebar.tsx` (tambahkan link Portal Jemaat & Transparansi)

**Interfaces:**
- Produces:
  - Rute terotentikasi `/portal`, `/portal/statement`, `/portal/receipt/{donation}`.
  - Deteksi relasi jemaat: jika user terhubung dengan `Member`, tampilkan riwayat persembahan atas nama jemaat tersebut. Jika belum terhubung, tampilkan pesan informatif.
  - Proteksi IDOR ketat: jemaat tidak dapat melihat persembahan milik jemaat lain via index, statement, maupun receipt.
  - Cetak Bukti Setoran Tahunan (Annual Contribution Statement) dan kwitansi tunggal (Receipt) ramah cetak (`window.print()`).
  - Props Inertia:
    - `member`: `{ id, member_number, name, email, phone, address }`
    - `donations`: paginated list of `{ id, receipt_number, amount, payment_method, date, category_name }`
    - `summary`: `{ thisYearTotal, allTimeTotal, count, byCategory }`
    - `availableYears`: list tahun persembahan

- [x] **Step 1: Tulis test fitur untuk Portal Jemaat** di `tests/Feature/Portal/MemberPortalTest.php`
  - Test jemaat dapat login dan melihat riwayat persembahan atas nama sendiri.
  - Test jemaat tidak melihat persembahan milik jemaat lain di riwayat.
  - Test akses kwitansi tunggal `/portal/receipt/{donation}` hanya milik sendiri (IDOR check melempar 403).
  - Test laporan tahunan `/portal/statement?year=YYYY` hanya menghitung persembahan jemaat yang sedang login.
  - Test perilaku user tanpa profil jemaat terhubung.
- [x] **Step 2: Jalankan test — pastikan FAIL**.
- [x] **Step 3: Implementasi `MemberPortalController` dan rute**.
- [x] **Step 4: Implementasi UI `resources/js/pages/portal/index.tsx` & `statement.tsx`**.
- [x] **Step 5: Jalankan test — pastikan PASS**.
- [x] **Step 6: Commit** `feat(portal): member portal with strict idor protection and annual contribution statement`.

---

### Task 5: Invariant Tests Sistem Lintas Fase

**Files:**
- Create:
  - `tests/Feature/Invariants/SystemInvariantsTest.php`

**Interfaces:**
- Memvalidasi seluruh invarian kritis dari spec §11:
  - Invarian 1: Integritas Buku Besar Append-Only (larangan mutasi dan penghapusan).
  - Invarian 2: Privasi Data Transparansi Publik (zero leakage of personal/donor data).
  - Invarian 3: Batas Isolasi Data Jemaat (IDOR immunity).
  - Invarian 4: Konsistensi Saldo Buku Besar vs Total Kas.

- [x] **Step 1: Tulis tes invarian di `tests/Feature/Invariants/SystemInvariantsTest.php`**.
- [x] **Step 2: Jalankan test — pastikan PASS**.
- [x] **Step 3: Commit** `test(invariants): cross-phase financial and security invariant verification`.

---

### Task 6: Dokumentasi Sistem & Penyelesaian Fase 6

**Files:**
- Modify:
  - `README.md` (Panduan lengkap arsitektur, instalasi, matriks peran, dan alur kerja dalam Bahasa Indonesia)
  - `docs/WORKFLOW.md` (Update checklist progres Fase 6)

- [x] **Step 1: Tulis dokumentasi arsitektur, konfigurasi, peran & alur kerja di `README.md`**.
- [x] **Step 2: Update checklist di `docs/WORKFLOW.md`**.
- [x] **Step 3: Jalankan seluruh test suite (`php artisan test`) dan static typing (`./node_modules/.bin/tsc --noEmit`)**.
- [x] **Step 4: Commit** `docs: comprehensive system documentation, architecture, role matrix and workflows`.
