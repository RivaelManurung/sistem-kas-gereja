# Fase 2 — Buku Besar, Penghitungan & Alokasi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sistem buku besar append-only dengan pencatatan rekening dan dana, alur penghitungan kolekte/persembahan (ibadah & penerimaan umum) dengan pecahan uang, konfirmasi ganda oleh N saksi, verifikasi bendahara, aturan alokasi berversi, persembahan atas nama, setoran bank, serta pencegahan submit ganda.

**Architecture:**
- `ledger_entries` sebagai single source of truth append-only; koreksi dilakukan melalui entri pembalik (`reverses_id`).
- Penghitungan kolekte (`count_sheets`, `count_lines`) ramah mobile: input lembar per pecahan, total dihitung ulang di server.
- Alur bertahap: Draft -> Confirmed (>= N penghitung berbeda) -> Verified (Bendahara) -> Locked (Buku Besar).
- Aturan alokasi berversi (`allocation_rules`, `allocation_rule_items`) membagi persembahan ke pos dana sesuai persentase pada tanggal transaksi. Sisa pembulatan ke dana pertama.
- Persembahan atas nama (`donations`) terhubung ke jemaat dan count sheet.
- Setoran bank memindahkan saldo antar-rekening (Kas Tunai -> Bank) di buku besar.

**Tech Stack:** Laravel 12, Inertia 2, React 19, TypeScript, Tailwind 4, shadcn/ui, PostgreSQL, Pest.

**Spec:** `docs/superpowers/specs/2026-10-21-sistem-kas-gereja-design.md` §7, §8.1–8.4, §8.10

---

## Global Constraints

- Nominal uang: **bigint rupiah**, tidak pernah float, tidak pernah teks.
- Buku besar **append-only**; tabel `ledger_entries` dilindungi trigger PostgreSQL dari UPDATE dan DELETE.
- Semua total dihitung ulang di server (`CountCalculationService`).
- Setiap entri buku besar wajib memiliki `account_id` dan `fund_id`.
- Teks pengguna: Bahasa Indonesia. Kode & komentar: Bahasa Inggris.
- TDD ketat: tulis test Pest dulu -> gagal -> implementasi -> lulus.
- Mobile-friendly untuk form hitung (`inputMode="numeric"`, tombol lembar cepat).

## Review Focus

1. **Integritas Buku Besar**: Percobaan update/delete pada `ledger_entries` melempar exception di DB dan model. Koreksi harus menghasilkan entri pembalik.
2. **Kalkulasi & Pembulatan Alokasi**: Alokasi 100% terbagi tepat, sisa pembulatan rupiah masuk ke dana pertama. Aturan lama tidak berubah saat aturan baru dibuat.
3. **Idempotensi & Anti Submit Ganda**: Token idempotensi mencegah duplikasi pembuatan berita acara dan penguncian buku besar.
4. **Validasi Konfirmasi N-Orang**: Mengedit berita acara membatalkan konfirmasi yang sudah masuk. User yang sama tidak bisa konfirmasi dua kali.
5. **Persembahan Atas Nama**: Total persembahan atas nama tidak boleh melebihi subtotal kategori pada berita acara tersebut.

---

### Task 1: Buku Besar Append-Only (`LedgerEntry`)

**Files:**
- Create:
  - `database/migrations/2026_10_21_130000_create_ledger_entries_table.php`
  - `app/Models/LedgerEntry.php`
  - `app/Services/LedgerService.php`
- Modify:
  - `app/Providers/AppServiceProvider.php` (morph map `ledger_entry`)
- Test:
  - `tests/Feature/Ledger/LedgerEntryTest.php`

**Interfaces:**
- Produces:
  - Table `ledger_entries`:
    - `id`
    - `entry_date` date
    - `account_id` fk `accounts`
    - `fund_id` fk `funds`
    - `category_id` nullable fk `categories`
    - `amount` bigint (> 0)
    - `direction` string ('in'|'out')
    - `description` text nullable
    - `source_type` string nullable (polymorphic)
    - `source_id` bigint nullable (polymorphic)
    - `reverses_id` nullable fk `ledger_entries`
    - `idempotency_key` nullable string unique
    - `created_at` timestamp useCurrent
  - DB trigger PostgreSQL `ledger_entries_block_mutation`: UPDATE dan DELETE dilarang.
  - `LedgerService::record(...)`: mencatat entri buku besar.
  - `LedgerService::reverse(LedgerEntry $entry, string $reason)`: mencatat pembalik.
  - `LedgerEntry::getBalance(int $fundId, ?int $accountId = null): int`: hitung saldo agregat.

- [ ] **Step 1: Tulis test gagal `tests/Feature/Ledger/LedgerEntryTest.php`**
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi migrasi, model, trigger, dan service**
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit `feat: append-only ledger entries and service`**

---

### Task 2: Jadwal & Sesi Ibadah

**Files:**
- Create:
  - `database/migrations/2026_10_21_131000_create_service_schedules_table.php`
  - `database/migrations/2026_10_21_131100_create_service_sessions_table.php`
  - `app/Models/ServiceSchedule.php`, `app/Models/ServiceSession.php`
  - `app/Http/Controllers/Admin/ServiceScheduleController.php`
  - `app/Http/Controllers/ServiceSessionController.php`
  - `app/Http/Requests/Admin/ServiceScheduleRequest.php`
  - `resources/js/pages/admin/schedules/{index,form}.tsx`
  - `resources/js/pages/sessions/{index,create}.tsx`
- Test:
  - `tests/Feature/Services/ServiceSessionTest.php`

**Interfaces:**
- Produces:
  - `service_schedules`: `id, name, day_of_week int (0-6), time string, default_category_ids jsonb, is_active, timestamps`.
  - `service_sessions`: `id, service_schedule_id nullable fk, date date, name string, notes nullable, is_completed bool default false, timestamps`. Unique `(service_schedule_id, date)`.
  - Endpoint membuat sesi ibadah dari jadwal atau manual (ibadah insidental).

- [ ] **Step 1: Tulis test gagal `tests/Feature/Services/ServiceSessionTest.php`**
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi model, migrasi, controller, dan tampilan**
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit `feat: service schedules and sessions`**

---

### Task 3: Berita Acara Hitung & Form Mobile-First

**Files:**
- Create:
  - `database/migrations/2026_10_21_132000_create_count_sheets_table.php`
  - `database/migrations/2026_10_21_132100_create_count_lines_table.php`
  - `app/Enums/CountSheetStatus.php`, `app/Enums/CountSheetType.php`
  - `app/Models/CountSheet.php`, `app/Models/CountLine.php`
  - `app/Services/CountCalculationService.php`
  - `app/Http/Controllers/CountSheetController.php`
  - `app/Http/Requests/CountSheetRequest.php`
  - `resources/js/pages/counting/{index,show,create,form}.tsx`
- Test:
  - `tests/Feature/Counting/CountSheetCalculationTest.php`

**Interfaces:**
- Produces:
  - `count_sheets`: `id, type ('service'|'general'|'event'), service_session_id nullable fk, date date, status ('draft'|'confirmed'|'verified'|'locked'), account_id fk accounts, total_amount bigint default 0, notes nullable, created_by fk users, idempotency_key nullable, timestamps`.
  - `count_lines`: `id, count_sheet_id fk, category_id fk, is_cash bool, denomination_counts jsonb (pecahan => lembar), amount bigint, reference_number nullable, proof_path nullable, timestamps`.
  - `CountCalculationService`: menghitung ulang subtotal baris dan total count sheet dari lembar pecahan secara server-side.
  - UI Mobile-First: input angka keypad besar, kartu pecahan uang, subtotal otomatis update live.

- [ ] **Step 1: Tulis test gagal `tests/Feature/Counting/CountSheetCalculationTest.php`**
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi migrasi, model, service kalkulasi, controller, dan view**
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit `feat: mobile-first count sheets and calculation service`**

---

### Task 4: Persembahan Atas Nama (`donations`)

**Files:**
- Create:
  - `database/migrations/2026_10_21_133000_create_donations_table.php`
  - `app/Models/Donation.php`
  - `app/Http/Controllers/DonationController.php`
  - `app/Http/Requests/DonationRequest.php`
  - `resources/js/pages/donations/index.tsx`
- Test:
  - `tests/Feature/Counting/NamedDonationsTest.php`

**Interfaces:**
- Produces:
  - `donations`: `id, count_sheet_id nullable fk, member_id nullable fk, donor_name nullable, category_id fk, amount bigint, notes nullable, receipt_number string unique, timestamps`.
  - Validasi: kategori harus memiliki `allows_named = true`.
  - Total persembahan atas nama pada kategori di count sheet tidak boleh melebihi subtotal kategori pada count sheet tersebut.

- [ ] **Step 1: Tulis test gagal `tests/Feature/Counting/NamedDonationsTest.php`**
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi model, controller, dan validasi**
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit `feat: named donations linked to members and count sheets`**

---

### Task 5: Konfirmasi Ganda & Verifikasi Bendahara

**Files:**
- Create:
  - `database/migrations/2026_10_21_134000_create_count_confirmations_table.php`
  - `app/Models/CountConfirmation.php`
  - `app/Http/Controllers/CountConfirmationController.php`
- Modify:
  - `app/Models/CountSheet.php`
  - `app/Http/Controllers/CountSheetController.php`
- Test:
  - `tests/Feature/Counting/MultiConfirmationTest.php`

**Interfaces:**
- Produces:
  - `count_confirmations`: `id, count_sheet_id fk, user_id fk, confirmed_at timestamp`. Unique `(count_sheet_id, user_id)`.
  - Syarat N konfirmasi berbeda dari `ChurchSetting` (`min_confirmations_service`, dll.).
  - Jika count sheet diubah saat sudah ada konfirmasi, seluruh konfirmasi dibatalkan dan status kembali ke `draft`.
  - Bendahara melakukan verifikasi: mengubah status dari `confirmed` ke `verified`.

- [ ] **Step 1: Tulis test gagal `tests/Feature/Counting/MultiConfirmationTest.php`**
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi konfirmasi, pembatalan saat edit, dan verifikasi bendahara**
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit `feat: multi-person confirmation and treasurer verification`**

---

### Task 6: Aturan Alokasi Berversi & Penguncian ke Buku Besar

**Files:**
- Create:
  - `database/migrations/2026_10_21_135000_create_allocation_rules_table.php`
  - `database/migrations/2026_10_21_135100_create_allocation_rule_items_table.php`
  - `app/Models/AllocationRule.php`, `app/Models/AllocationRuleItem.php`
  - `app/Services/AllocationService.php`
  - `app/Http/Controllers/Admin/AllocationRuleController.php`
  - `resources/js/pages/admin/allocations/{index,form}.tsx`
- Modify:
  - `app/Http/Controllers/CountSheetController.php` (aksi lock)
- Test:
  - `tests/Feature/Ledger/AllocationLockingTest.php`

**Interfaces:**
- Produces:
  - `allocation_rules`: `id, category_id fk, name string, valid_from date, is_active bool, timestamps`.
  - `allocation_rule_items`: `id, allocation_rule_id fk, fund_id fk, percentage decimal(5,2), sort_order int, timestamps`. Total percentage per rule = 100.00.
  - `AllocationService::apply(CountSheet $sheet)`:
    - Cari aturan berlaku pada `sheet->date`.
    - Jika ada: alokasikan nominal ke dana tujuan sesuai persentase, sisa pembulatan ke dana pertama.
    - Jika tidak ada aturan: 100% nominal ke `category->default_fund_id`.
    - Tulis ke `ledger_entries` dengan `source = count_sheet`.
  - Status `count_sheet` menjadi `locked`.

- [ ] **Step 1: Tulis test gagal `tests/Feature/Ledger/AllocationLockingTest.php`**
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi aturan alokasi, pembagian persentase, dan penguncian buku besar**
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit `feat: versioned allocation rules and ledger posting`**

---

### Task 7: Penerimaan Umum & Setoran Bank (Pindah Rekening)

**Files:**
- Create:
  - `database/migrations/2026_10_21_136000_create_bank_deposits_table.php`
  - `app/Models/BankDeposit.php`
  - `app/Http/Controllers/BankDepositController.php`
  - `app/Http/Requests/BankDepositRequest.php`
  - `resources/js/pages/deposits/{index,form}.tsx`
- Modify:
  - `app/Http/Controllers/CountSheetController.php` (tipe general)
  - `resources/js/components/app-sidebar.tsx` (navigasi Penerimaan & Master)
- Test:
  - `tests/Feature/Counting/BankDepositTest.php`

**Interfaces:**
- Produces:
  - `bank_deposits`: `id, deposit_date date, from_account_id fk accounts, to_account_id fk accounts (type=bank), amount bigint, reference_number nullable, proof_path nullable, notes nullable, status ('pending'|'completed'), created_by fk users, timestamps`.
  - Saat deposit selesai (`completed`), menulis 2 entri buku besar transfer rekening: OUT dari Kas Tunai, IN ke Bank.
  - Count sheet tipe `general`: penerimaan persembahan/transfer langsung di luar ibadah.

- [ ] **Step 1: Tulis test gagal `tests/Feature/Counting/BankDepositTest.php`**
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi setoran bank, penerimaan umum, dan navigasi sidebar**
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit `feat: general income and bank deposit transfer`**
