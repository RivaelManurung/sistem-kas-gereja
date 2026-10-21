# Fase 1 — Fondasi, Master Data & EAV Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplikasi yang bisa dipakai admin gereja untuk login, mengatur pengguna & peran, mengisi pengaturan gereja, mengelola Rekening/Dana/Kategori, mendefinisikan kolom isian tambahan (EAV) sendiri, dan mengelola data Jemaat — semuanya tercatat di jejak audit.

**Architecture:** Satu aplikasi Laravel 12 + Inertia + React 19 (TypeScript) dari `laravel/react-starter-kit`, UI shadcn. Inti keuangan memakai kolom bertipe tetap; kolom tambahan memakai EAV bertipe (`attribute_definitions` + `attribute_values`) yang di-render sebagai form dinamis dan divalidasi dari definisi yang sama di server. Otorisasi lewat spatie/laravel-permission + Policy.

**Tech Stack:** PHP 8.2+, Laravel 12, Inertia, React 19, TypeScript, Tailwind 4, shadcn/ui, PostgreSQL, Pest, spatie/laravel-permission.

**Spec:** `docs/superpowers/specs/2026-10-21-sistem-kas-gereja-design.md`

## Global Constraints

- Proyek di `/home/rivael/Documents/Free/Laravel/SistemKasGereja`.
- Teks yang dilihat pengguna: Bahasa Indonesia. Kode & komentar: Bahasa Inggris.
- Nominal uang: **bigint rupiah**, tidak pernah float, tidak pernah teks.
- Nilai EAV disimpan di kolom bertipe (`value_text`, `value_number` decimal(20,4), `value_date`, `value_bool`, `value_option`, `value_file`).
- Peran (nama persis): `admin`, `bendahara`, `penghitung`, `majelis`, `panitia`, `pemeriksa`, `jemaat`.
- Registrasi publik mati; akun dibuat admin.
- Tidak ada hard-delete untuk master data (Rekening, Dana, Kategori, definisi atribut): hanya `is_active = false`.
- Setiap perubahan pada model ber-trait `Audited` menulis `audit_logs`; `audit_logs` tidak bisa di-update/di-delete lewat aplikasi.
- Satu gereja per instalasi (tanpa `church_id`).
- Test: Pest, `php artisan test`; DB test PostgreSQL `kas_gereja_test`. Target cakupan 80%.

## Review Focus

1. **Penghitung/jemaat membuka halaman pengaturan, master, atau atribut** harus 403 — test di Task 2 (`non_admin_cannot_access_admin_routes` dataset semua rute admin).
2. **Pecahan uang nol, negatif, desimal, atau duplikat** di pengaturan harus ditolak dengan pesan Indonesia — test di Task 4.
3. **Field EAV angka diisi `"abc"`, `"1.000"` (format Indonesia), atau `"1500.50"`** — `"abc"` ditolak, `"1500.50"` tersimpan persis `1500.5000`, `"1.000"` ditolak (bukan diam-diam jadi 1) — test di Task 7.
4. **Definisi atribut dinonaktifkan padahal sudah punya nilai** — nilai lama tetap ada & terbaca, field tidak muncul di form baru dan tidak lagi wajib — test di Task 7.
5. **Input `attributes` berisi key yang tidak didefinisikan atau milik entitas lain** harus diabaikan/ditolak, tidak tersimpan — test di Task 7.

---

### Task 1: Scaffold proyek

**Files:**
- Create: skeleton starter kit di root proyek (root sudah berisi `docs/`)
- Modify: `.env`, `.env.example`, `phpunit.xml`, rute/konfigurasi registrasi starter kit
- Test: `tests/Feature/Auth/RegistrationDisabledTest.php`

**Interfaces:**
- Produces: aplikasi jalan via `composer run dev`; login di `/login`; DB `kas_gereja` & `kas_gereja_test`; repo git.

- [ ] **Step 1: Buat proyek di folder sementara lalu gabungkan**

```bash
cd /home/rivael/Documents/Free/Laravel
composer create-project laravel/react-starter-kit kas-tmp
rsync -a kas-tmp/ SistemKasGereja/ && rm -rf kas-tmp
cd SistemKasGereja && git init && git add . && git commit -m "chore: scaffold laravel react starter kit"
```

- [ ] **Step 2: Konfigurasi**

`.env`: `DB_CONNECTION=pgsql`, `DB_DATABASE=kas_gereja`, `APP_LOCALE=id`, `APP_TIMEZONE=Asia/Jakarta`, `APP_NAME="Kas Gereja"`. `phpunit.xml`: `DB_CONNECTION=pgsql`, `DB_DATABASE=kas_gereja_test`. `createdb kas_gereja && createdb kas_gereja_test && php artisan migrate`. Pasang terjemahan validasi Indonesia (`lang/id/validation.php`).

- [ ] **Step 3: Tulis test gagal**

```php
it('does not expose registration', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register', ['name' => 'x', 'email' => 'x@x.id', 'password' => 'password', 'password_confirmation' => 'password'])->assertNotFound();
});
```

- [ ] **Step 4: Jalankan — FAIL** (`php artisan test --filter=RegistrationDisabled`, rute register masih ada)
- [ ] **Step 5: Matikan registrasi** (hapus rute register + halaman `auth/register`, hapus link di halaman login)
- [ ] **Step 6: Jalankan — PASS**, lalu `php artisan test` seluruhnya hijau
- [ ] **Step 7: Commit** `chore: configure postgres, locale id, disable registration`

---

### Task 2: Peran, izin, dan manajemen pengguna

**Files:**
- Create: `app/Enums/Role.php`, `app/Enums/Permission.php`, `database/seeders/RolePermissionSeeder.php`, `app/Http/Controllers/Admin/UserController.php`, `app/Http/Requests/Admin/UserRequest.php`, `app/Policies/UserPolicy.php`, `resources/js/pages/admin/users/{index,form}.tsx`
- Modify: `routes/web.php`, `database/seeders/DatabaseSeeder.php`, `app/Models/User.php` (trait `HasRoles`)
- Test: `tests/Feature/Admin/UserManagementTest.php`, `tests/Feature/Admin/AdminAccessTest.php`

**Interfaces:**
- Produces:
  - `enum Role: string` — `Admin='admin'`, `Bendahara='bendahara'`, `Penghitung='penghitung'`, `Majelis='majelis'`, `Panitia='panitia'`, `Pemeriksa='pemeriksa'`, `Jemaat='jemaat'`; `label(): string` (Indonesia).
  - `enum Permission: string` (Fase 1) — `SettingsManage='settings.manage'`, `MasterManage='master.manage'`, `UsersManage='users.manage'`, `AuditView='audit.view'`. Admin punya semua; Pemeriksa punya `audit.view`.
  - Rute admin di prefix `/admin`, nama `admin.*`, middleware `auth` + `permission:<...>`.
  - Helper test `actingAsRole(Role $role): User` di `tests/Pest.php`.

- [ ] **Step 1: Tulis test gagal**
  - `admin_can_create_user_with_roles`: POST `admin.users.store` dengan `name,email,password,roles=['bendahara','penghitung']` → user ada, `hasRole('bendahara')` true.
  - `user_cannot_remove_own_admin_role`: admin update dirinya tanpa `admin` → error validasi `roles`.
  - `non_admin_cannot_access_admin_routes` dengan dataset `[Role::Penghitung, Role::Jemaat, Role::Bendahara]` × rute GET `admin.users.index`, `admin.settings.edit`, `admin.accounts.index`, `admin.funds.index`, `admin.categories.index`, `admin.attributes.index` → 403. (Rute yang belum ada ditambahkan ke dataset oleh task pemiliknya.)
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi** enum, seeder (idempoten, `firstOrCreate`), controller CRUD (tanpa hapus: `is_active` pada user + blok login bila nonaktif), policy, halaman shadcn (tabel + form, multi-select peran).
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit** `feat: roles, permissions and user management`

---

### Task 3: Jejak audit

**Files:**
- Create: migration `create_audit_logs_table`, `app/Models/AuditLog.php`, `app/Models/Concerns/Audited.php`, `app/Http/Controllers/Admin/AuditLogController.php`, `resources/js/pages/admin/audit/index.tsx`
- Test: `tests/Feature/AuditTrailTest.php`

**Interfaces:**
- Produces:
  - Tabel `audit_logs`: `id, user_id nullable, auditable_type, auditable_id, event (string), old_values jsonb, new_values jsonb, ip_address nullable, created_at` (tanpa `updated_at`). Index `(auditable_type, auditable_id)`.
  - `AuditLog::record(Model $subject, string $event, array $old = [], array $new = []): AuditLog`
  - Trait `Audited` — hook `created`/`updated`/`deleted` model memanggil `AuditLog::record` dengan hanya atribut yang berubah (`getChanges()` vs `getOriginal()`), mengecualikan `updated_at`, `created_at`, `password`, `remember_token`.
  - Rute `admin.audit.index` (izin `audit.view`), filter tipe & rentang tanggal, paginasi 25.

- [ ] **Step 1: Tulis test gagal**
  - `records_update_with_old_and_new_values`: model audited diubah `name` A→B → satu log `event='updated'`, `old_values=['name'=>'A']`, `new_values=['name'=>'B']`, `user_id` = user login.
  - `audit_log_cannot_be_updated_or_deleted`: `$log->update([...])` dan `$log->delete()` melempar `LogicException`.
  - `pemeriksa_can_view_audit_page` 200; `penghitung` 403.
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi** (override `save()` saat `exists` dan `delete()` di `AuditLog` → `LogicException`). Pasang `Audited` di `User` (field peran dicatat lewat event `roles_synced` dari controller Task 2).
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit** `feat: append-only audit trail`

---

### Task 4: Pengaturan gereja

**Files:**
- Create: migration `create_church_settings_table`, `app/Models/ChurchSetting.php`, `app/Http/Controllers/Admin/ChurchSettingController.php`, `app/Http/Requests/Admin/ChurchSettingRequest.php`, `resources/js/pages/admin/settings/edit.tsx`, `resources/js/lib/money.ts`
- Test: `tests/Feature/Admin/ChurchSettingTest.php`, `resources/js/lib/money.test.ts` (bila Vitest tersedia di starter kit; kalau tidak, cukup test PHP)

**Interfaces:**
- Produces:
  - Tabel satu baris `church_settings`: `name, address, city, phone, email, timezone (default 'Asia/Jakarta'), logo_path nullable, stamp_path nullable, denominations jsonb (int[]), min_confirmations_service int default 2, min_confirmations_event int default 2, min_confirmations_general int default 2, expense_approval_threshold bigint default 0, allow_negative_balance bool default false, public_page_enabled bool default false`. (`stamp_path` dipakai Fase 5; disimpan di disk `local`, bukan `public`.)
  - `ChurchSetting::current(): ChurchSetting` — mengembalikan baris tunggal, membuatnya dengan default bila belum ada.
  - Default `denominations`: `[100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100]`.
  - Rute `admin.settings.edit|update` (izin `settings.manage`); model `Audited`.
  - `formatRupiah(value: number): string` → `"Rp 1.500.000"` (`Intl.NumberFormat('id-ID')`).

- [ ] **Step 1: Tulis test gagal**
  - `current_creates_defaults_once`: dua panggilan `current()` → satu baris, `denominations` = default di atas.
  - `rejects_invalid_denominations` dataset: `[[0]]`, `[[-500]]`, `[[1000, 1000]]`, `[[1500.5]]`, `[[]]` → error `denominations` / `denominations.*`.
  - `stores_denominations_sorted_desc`: kirim `[500, 100000, 1000]` → tersimpan `[100000, 1000, 500]`.
  - `rejects_min_confirmations_below_one` → error.
  - `settings_update_is_audited` → ada `audit_logs` untuk `ChurchSetting`.
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi** (rules: `denominations` `required|array|min:1`, `denominations.*` `integer|min:1|distinct`; `min_confirmations_*` `integer|min:1|max:10`; `expense_approval_threshold` `integer|min:0`). Upload logo: `image|mimes:png,jpg,webp|max:2048`. Halaman: tab Profil / Penghitungan / Keuangan / Publik.
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit** `feat: church settings`

---

### Task 5: Rekening & Dana

**Files:**
- Create: migrations `create_accounts_table`, `create_funds_table`; `app/Enums/AccountType.php`; `app/Models/{Account,Fund}.php`; `app/Http/Controllers/Admin/{AccountController,FundController}.php`; requests; `resources/js/pages/admin/{accounts,funds}/{index,form}.tsx`; `database/seeders/MasterDataSeeder.php`
- Test: `tests/Feature/Admin/AccountFundTest.php`

**Interfaces:**
- Produces:
  - `enum AccountType: string` — `Cash='cash'` (Kas Tunai), `PettyCash='petty_cash'` (Kas Kecil), `Bank='bank'`.
  - `accounts`: `id, code unique, name, type, bank_name nullable, account_number nullable, is_active, timestamps`. `bank_name` & `account_number` wajib bila `type=bank`.
  - `funds`: `id, code unique, name, description nullable, is_active, timestamps`. (Kolom `event_id` ditambah di Fase 4.)
  - Scope `active()` di keduanya. Keduanya `Audited`.
  - Seeder default: Rekening `KAS` (Kas Tunai), `KK` (Kas Kecil); Dana `UMUM` (Kas Umum), `PEMB` (Dana Pembangunan), `DIAK` (Diakonia).
  - Rute resource `admin.accounts.*`, `admin.funds.*` tanpa `destroy`; aksi `toggle` untuk aktif/nonaktif.

- [ ] **Step 1: Tulis test gagal**
  - `bank_account_requires_bank_details` → error `bank_name`, `account_number`.
  - `code_must_be_unique_case_insensitive`: `umum` saat `UMUM` ada → error (simpan `code` uppercase).
  - `no_destroy_route_exists`: `DELETE /admin/funds/{id}` → 405.
  - `toggle_deactivates_and_is_audited`.
  - Tambah `admin.accounts.index`, `admin.funds.index` ke dataset 403 Task 2.
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi**
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit** `feat: accounts and funds master data`

---

### Task 6: Kategori pemasukan & pengeluaran

**Files:**
- Create: migration `create_categories_table`, `app/Enums/Direction.php`, `app/Models/Category.php`, `app/Http/Controllers/Admin/CategoryController.php`, request, `resources/js/pages/admin/categories/{index,form}.tsx`
- Modify: `database/seeders/MasterDataSeeder.php`
- Test: `tests/Feature/Admin/CategoryTest.php`

**Interfaces:**
- Consumes: `Fund` (Task 5).
- Produces:
  - `enum Direction: string` — `In='in'` (Pemasukan), `Out='out'` (Pengeluaran).
  - `categories`: `id, name, direction, default_fund_id fk funds restrict, allows_named bool default false, is_public bool default true, is_active, sort_order int default 0, timestamps`. Unik `(name, direction)`.
  - Seeder: Pemasukan — Kolekte (→UMUM), Persembahan Syukur (→UMUM, allows_named), Perpuluhan (→UMUM, allows_named), Persembahan Pembangunan (→PEMB), Diakonia (→DIAK). Pengeluaran — Listrik & Air, Honor, Diakonia, Operasional, Kegiatan Komisi (→UMUM, kecuali Diakonia →DIAK).
  - `default_fund_id` harus menunjuk dana aktif.
  - `is_public` hanya menentukan apakah **total** kategori tampil di halaman publik (Fase 6); data per orang tidak pernah tampil, apa pun nilainya.

- [ ] **Step 1: Tulis test gagal**
  - `rejects_inactive_default_fund`.
  - `same_name_allowed_across_directions`: "Diakonia" masuk & keluar boleh; duplikat di arah sama → error.
  - `allows_named_only_for_income`: `direction=out, allows_named=true` → error.
  - Tambah `admin.categories.index` ke dataset 403.
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi** (halaman indeks dengan tab Pemasukan/Pengeluaran, urutan via `sort_order`)
- [ ] **Step 4: Jalankan — PASS**
- [ ] **Step 5: Commit** `feat: income and expense categories`

---

### Task 7: Mesin EAV (backend)

**Files:**
- Create: migrations `create_attribute_definitions_table`, `create_attribute_values_table`; `app/Enums/{AttributeEntity,AttributeType}.php`; `app/Models/{AttributeDefinition,AttributeValue}.php`; `app/Models/Concerns/HasCustomAttributes.php`; `app/Support/Attributes/AttributeRules.php`; `app/Http/Controllers/Admin/AttributeDefinitionController.php`; request
- Modify: `app/Providers/AppServiceProvider.php` (morph map), `app/Models/Category.php` (pakai trait)
- Test: `tests/Unit/AttributeRulesTest.php`, `tests/Feature/CustomAttributesTest.php`, `tests/Feature/Admin/AttributeDefinitionTest.php`

**Interfaces:**
- Consumes: `Category` (Task 6) sebagai konsumen pertama.
- Produces:
  - `enum AttributeEntity: string` — `Member='member'`, `Event='event'`, `Category='category'`, `ServiceSession='service_session'`, `CountSheet='count_sheet'`, `Expense='expense'`. Nilai = alias morph map (`Relation::enforceMorphMap`), didaftarkan saat modelnya ada (Fase 1: `member`, `category`, `user`).
  - `enum AttributeType: string` — `Text='text'`, `Number='number'`, `Date='date'`, `Boolean='boolean'`, `Select='select'`, `File='file'`; `valueColumn(): string` → `value_text|value_number|value_date|value_bool|value_option|value_file`.
  - `attribute_definitions`: `id, entity_type, key, label, data_type, options jsonb nullable, is_required, is_public, is_active, sort_order, scope_event_id bigint nullable (FK ditambah di Fase 4), timestamps`. Unik `(entity_type, key, scope_event_id)` — pakai `NULLS NOT DISTINCT` (PostgreSQL 15+). `key` regex `^[a-z][a-z0-9_]{0,49}$`, tidak bisa diubah setelah dibuat; `data_type` tidak bisa diubah bila sudah ada nilai.
  - `attribute_values`: `id, attribute_definition_id fk restrict, entity_type, entity_id, value_text text, value_number decimal(20,4), value_date date, value_bool bool, value_option string, value_file string, timestamps`. Unik `(attribute_definition_id, entity_type, entity_id)`.
  - `AttributeRules::for(AttributeEntity $entity, ?int $scopeEventId = null): array` — rules Laravel dengan key `attributes.<key>` untuk definisi **aktif** (global + scope acara bila diberikan). Number: `numeric` + regex `^-?\d+(\.\d{1,4})?$`; Date: `date_format:Y-m-d`; Boolean: `boolean`; Select: `Rule::in(options)`; File: `file|mimes:pdf,jpg,jpeg,png,webp|max:5120`; `required` vs `nullable` dari `is_required`.
  - `AttributeRules::attributes(AttributeEntity $entity, ?int $scopeEventId = null): array` — nama field Indonesia (label) untuk pesan error.
  - Trait `HasCustomAttributes`:
    - `customAttributeValues(): MorphMany` (`entity_type`/`entity_id`)
    - `customAttributes(): array<string, mixed>` — `key => nilai bertipe` untuk **semua** definisi yang punya nilai (termasuk yang nonaktif)
    - `syncCustomAttributes(array $input, ?int $scopeEventId = null): void` — dalam transaksi DB; hanya key dari definisi aktif yang cocok entitas/scope; key lain diabaikan; nilai `null`/`''` menghapus nilai; file disimpan ke disk `local` `attributes/<entity>/<id>/`; tiap perubahan dicatat `AuditLog::record($model, 'attributes_synced', $old, $new)`.
  - Rute `admin.attributes.*` (izin `master.manage`), filter per `entity_type`; tanpa `destroy`, ada `toggle`.

- [ ] **Step 1: Tulis test gagal (unit `AttributeRulesTest`)**
  - `builds_required_number_rule`: definisi number wajib `jumlah_peserta` → `for(Member)` berisi `attributes.jumlah_peserta` dengan `required` dan `numeric`.
  - `excludes_inactive_definitions`.
  - `includes_event_scoped_only_when_scope_matches`: definisi scope 7 muncul untuk `for(Event, 7)`, tidak untuk `for(Event, 8)` atau `for(Event)`.
- [ ] **Step 2: Tulis test gagal (feature `CustomAttributesTest`, memakai `Category`)**
  - `stores_number_in_typed_column`: `"1500.50"` → `value_number` = `'1500.5000'`, kolom lain null.
  - `rejects_non_numeric_and_indonesian_thousands` dataset `['abc', '1.000', '1,5']` → error `attributes.<key>`.
  - `rejects_select_value_outside_options`.
  - `ignores_undefined_and_foreign_keys`: input `attributes.tidak_ada` dan key milik `member` → tidak tersimpan.
  - `inactive_definition_keeps_old_value`: isi nilai, nonaktifkan definisi → `customAttributes()` masih berisi nilai; `AttributeRules::for` tidak memuat key itu.
  - `empty_value_deletes_row`.
  - `sync_is_audited`.
- [ ] **Step 3: Tulis test gagal (admin `AttributeDefinitionTest`)**
  - `key_is_immutable` (update `key` diabaikan/ditolak), `data_type_locked_when_values_exist`, `select_requires_options` (min 1, unik), `duplicate_key_same_entity_rejected` (termasuk keduanya `scope_event_id` null).
  - Tambah `admin.attributes.index` ke dataset 403.
- [ ] **Step 4: Jalankan — FAIL**
- [ ] **Step 5: Implementasi** sesuai Interfaces. Category controller memanggil `AttributeRules::for(AttributeEntity::Category)` di request dan `syncCustomAttributes` setelah simpan, di dalam satu transaksi.
- [ ] **Step 6: Jalankan — PASS**
- [ ] **Step 7: Commit** `feat: typed EAV engine for custom attributes`

---

### Task 8: Form dinamis (frontend) + halaman atribut

**Files:**
- Create: `resources/js/types/attributes.ts`, `resources/js/components/dynamic-fields.tsx`, `resources/js/pages/admin/attributes/{index,form}.tsx`
- Modify: `resources/js/pages/admin/categories/form.tsx`, `app/Http/Controllers/Admin/CategoryController.php` (kirim definisi + nilai sebagai props)
- Test: `tests/Feature/Admin/CategoryCustomFieldsPageTest.php`

**Interfaces:**
- Consumes: Task 7.
- Produces:
  - TS: `type AttributeType = 'text'|'number'|'date'|'boolean'|'select'|'file'`; `interface AttributeDefinition { id: number; key: string; label: string; data_type: AttributeType; options: string[] | null; is_required: boolean }`.
  - `<DynamicFields definitions={AttributeDefinition[]} values={Record<string, unknown>} errors={Record<string, string>} onChange={(key: string, value: unknown) => void} />` — komponen shadcn per tipe: Input, Input `type=number step=0.0001`, date picker, Switch, Select, input file; menampilkan error dari `errors['attributes.<key>']`; label bertanda `*` bila wajib.
  - Props Inertia untuk form entitas apa pun: `customFields: { definitions: AttributeDefinition[]; values: Record<string, unknown> }`.

- [ ] **Step 1: Tulis test gagal**
  - `category_form_receives_custom_field_definitions`: buat definisi aktif untuk `category` → GET `admin.categories.create` → `assertInertia` `customFields.definitions` berisi key itu; definisi nonaktif tidak ada.
  - `category_edit_receives_existing_values`.
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi** komponen + halaman definisi atribut (tabel per entitas, form dengan editor opsi untuk `select`, preview `DynamicFields`). Pasang di form kategori.
- [ ] **Step 4: Jalankan — PASS**; `npm run types` (atau `tsc --noEmit`) dan `npm run lint` bersih; `npm run build` sukses.
- [ ] **Step 5: Cek manual di browser**: buat atribut select "Komisi Penanggung Jawab" untuk kategori, buka form kategori, isi, simpan, edit ulang — nilai tampil.
- [ ] **Step 6: Commit** `feat: dynamic custom field form`

---

### Task 9: Data Jemaat

**Files:**
- Create: migration `create_members_table`, `app/Models/Member.php`, `app/Http/Controllers/Admin/MemberController.php`, request, policy, `resources/js/pages/admin/members/{index,form}.tsx`
- Modify: morph map (`member`), `app/Enums/Permission.php` (`MembersManage='members.manage'` → admin, bendahara)
- Test: `tests/Feature/Admin/MemberTest.php`

**Interfaces:**
- Consumes: Task 7–8 (`HasCustomAttributes`, `DynamicFields`).
- Produces:
  - `members`: `id, member_number unique nullable, name, gender nullable (enum 'L'|'P'), birth_date nullable, phone nullable, email nullable, address nullable, user_id nullable unique fk users nullOnDelete, is_active, timestamps`. `Audited`, `HasCustomAttributes`.
  - Rute `admin.members.*` (izin `members.manage`), pencarian nama/nomor (escape `%` `_`), paginasi 25, tanpa `destroy`.
  - `Member::forUser(User $user): ?Member` (dipakai portal jemaat Fase 6).

- [ ] **Step 1: Tulis test gagal**
  - `creates_member_with_custom_attributes`: definisi `member` wajib `sektor` (select `['Sektor 1','Sektor 2']`) → tanpa `sektor` error; dengan `Sektor 2` tersimpan.
  - `search_with_wildcards_is_literal`: cari `%` tidak mengembalikan semua jemaat.
  - `user_can_link_to_one_member_only`.
  - `penghitung_cannot_view_members` 403; `bendahara` 200.
- [ ] **Step 2: Jalankan — FAIL**
- [ ] **Step 3: Implementasi**
- [ ] **Step 4: Jalankan — PASS**; seluruh `php artisan test` hijau, cakupan `php artisan test --coverage --min=80`
- [ ] **Step 5: Commit** `feat: member records with custom attributes`
