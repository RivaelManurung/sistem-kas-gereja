# Workflow Pembangunan — Sistem Kas & Persembahan Gereja

Runbook untuk agen AI (Claude Code, Codex, Cursor, dll.) yang melanjutkan atau
menjalankan ulang pembangunan aplikasi ini sampai selesai. Baca seluruh file ini
sebelum mulai. Bisa dijalankan oleh **satu agen berurutan** atau oleh
**orkestrator + beberapa agen paralel** (lihat §4).

## 1. Baca dulu

| File | Isi |
|---|---|
| `docs/superpowers/specs/2026-10-21-sistem-kas-gereja-design.md` | Spesifikasi — sumber kebenaran |
| `docs/superpowers/plans/2026-10-21-roadmap.md` | Pembagian fase & bagian spec per fase |
| `docs/superpowers/plans/2026-10-21-fase-1-fondasi.md` | Rencana rinci Fase 1 — **format & penamaan acuan** untuk fase lain |
| `DESIGN.md` | Arah desain UI — wajib diikuti untuk setiap halaman |
| `docs/superpowers/plans/2026-10-21-fase-N-*.md` | Rencana fase N (dibuat oleh agen fase itu) |

## 2. Lingkungan

- Root proyek: `SistemKasGereja/` (repo git, branch `main`, remote `origin`).
- Laravel 12 + Inertia 2 + React 19 (TypeScript) + shadcn/ui + Tailwind 4, test Pest, PostgreSQL.
- `.env`: `DB_CONNECTION=pgsql`, `DB_DATABASE=kas_gereja`, user `postgres`/`postgres` @ `127.0.0.1:5432`, `APP_LOCALE=id`, `APP_TIMEZONE=Asia/Jakarta`.
- `phpunit.xml`: DB test `kas_gereja_test`.
- Perintah: `php artisan test`, `npm run build`, `npx tsc --noEmit`, `composer run dev`.

## 3. Aturan wajib (berlaku untuk semua langkah)

1. Baca spec dan kode yang sudah ada sebelum menulis. Pakai nama dari rencana Fase 1: enum `Role`/`Permission`, trait `Audited`, `HasCustomAttributes`, `AttributeRules`, komponen `DynamicFields`, `ChurchSetting::current()`, model `Account`/`Fund`/`Category`/`Member`.
2. **TDD**: tulis test Pest dulu → jalankan, harus gagal → implementasi → jalankan, harus lulus. Jangan pernah mengklaim test lulus tanpa menjalankannya.
3. Kode & komentar Bahasa Inggris; semua teks yang dilihat pengguna Bahasa Indonesia. Komentar hanya untuk *kenapa*, seperlunya.
4. Uang: **bigint rupiah**, tidak pernah float/teks. Buku besar **append-only**; koreksi = entri pembalik. Data terkunci tidak bisa berubah. Total selalu dihitung ulang di server.
5. Jangan jalankan perintah destruktif pada DB dev `kas_gereja` (tidak ada `migrate:fresh` di sana). Test memakai `RefreshDatabase` di DB test.
6. **Jangan pernah `git push`** atau perintah force. Commit per task, format conventional commit, diakhiri baris:
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (atau atribusi agen Anda sendiri).
7. Setiap halaman mengikuti `DESIGN.md`: pola page header, sidebar berkelompok sesuai izin, tabel dengan nominal rata kanan `tabular-nums`, badge status seragam, form per Card, AlertDialog untuk aksi tak terbalik, empty state, Skeleton, toast sonner, form hitung mobile-first, dark mode. Hanya komponen shadcn/ui (`npx shadcn@latest add <nama>`). Komponen bersama di `resources/js/components/app/` (`PageHeader`, `DataTable`, `StatusBadge`, `MoneyText`, `StatCard`, `EmptyState`) — buat bila belum ada, jangan duplikasi.
8. **Definisi selesai** setiap langkah: `php artisan test` hijau, `npm run build` sukses, `npx tsc --noEmit` bersih. Kalau ada yang tidak bisa diselesaikan, tulis jujur di laporan.

## 4. Urutan & ketergantungan

```
Fase 1 ──► Fase 2 ──┬─► Fase 3 ─┐                ┌─► Fase 5 ─┐
                    └─► Fase 4 ─┴─► Merge 3+4 ──┴─► Fase 6 ─┴─► Merge 5+6 ──► UI Polish ──► Review (3 lensa, paralel) ──► Fix
```

- **Agen tunggal**: kerjakan berurutan 1, 2, 3, 4, 5, 6 langsung di `main`; lewati langkah worktree & merge.
- **Paralel**: Fase 3 ∥ 4 dan Fase 5 ∥ 6 masing-masing di git worktree + branch sendiri (§6), lalu digabung oleh agen merge.

## 5. Cara menjalankan setiap fase (2–6)

Untuk fase N:
1. Baca bagian spec untuk fase N di roadmap, dan kode saat ini.
2. Tulis rencana rinci ke `docs/superpowers/plans/2026-10-21-fase-N-<slug>.md` dengan format sama seperti rencana Fase 1 (header, Global Constraints, Review Focus, task dengan Files/Interfaces/langkah test). Proporsional. Commit.
3. Kerjakan setiap task di rencana itu dengan TDD, commit per task.
4. Kirim laporan (§10).

### Fase 1 — Fondasi
Jalankan seluruh `2026-10-21-fase-1-fondasi.md` (Task 1–9) di `main`. **Cek `git log` dulu** dan jangan ulangi task yang sudah di-commit.

### Fase 2 — Buku besar & penghitungan (di `main`)
Buku besar append-only + koreksi pembalik; setiap entri punya rekening + dana; jadwal & sesi ibadah; berita acara hitung per pecahan (count sheets/lines); konfirmasi N orang berbeda (dari `ChurchSetting`); verifikasi bendahara + setoran bank (pindah rekening); kunci → buku besar via aturan alokasi berversi (persentase, total 100%, sisa pembulatan ke dana pertama); Penerimaan Umum; persembahan atas nama (`donations`, `member_id`); anti submit ganda (idempotency key + unique constraint). Form hitung ramah HP: input lembar per pecahan, total tampil langsung tapi dihitung ulang di server.

### Fase 3 — Pengeluaran & periode (worktree `fase-3`)
Pengeluaran dengan foto nota wajib; alur pengajuan → persetujuan (di atas `expense_approval_threshold` butuh majelis) → dibayar → buku besar; pengaju tidak boleh menyetujui sendiri; tolak saldo negatif kecuali `allow_negative_balance`; pindah dana manual lewat pengajuan + persetujuan; saldo awal (periode pembuka yang langsung ditutup); tutup periode (transaksi baru di periode tertutup ditolak).
Batas: **jangan** membangun acara. Perubahan pada file bersama (`routes/web.php`, enum `Permission`, seeder, navigasi sidebar) minimal dan bersifat tambahan.

### Fase 4 — Acara (worktree `fase-4`)
Setiap acara otomatis punya dana sendiri (`funds.event_id`); kategori & atribut EAV ber-scope acara (FK `scope_event_id`); status perencanaan/berjalan/selesai/ditutup; peran panitia ber-scope per acara; pemasukan acara lewat berita acara hitung jenis acara (`min_confirmations_event`); penutupan acara + pemindahan sisa dana ke dana pilihan admin via entri alokasi; laporan acara (pemasukan, pengeluaran, sisa).
Batas: **jangan** membangun alur persetujuan pengeluaran. Pengeluaran acara dicatat lewat service minimal yang diberi nama jelas, supaya agen merge bisa menyatukannya dengan Fase 3.

### Merge 3+4 (di `main`)
`git merge --no-ff fase-3`, lalu `git merge --no-ff fase-4`; selesaikan konflik dengan mempertahankan kedua fitur. **Satukan pengeluaran acara dengan alur pengeluaran Fase 3** (lewat persetujuan yang sama, ber-scope dana acara) dan tambahkan test-nya. `composer install`, `npm install`, `php artisan migrate`, lalu cek definisi selesai. Commit. Hapus branch (`git branch -d`) dan worktree-nya (`git worktree remove`).

### Fase 5 — Laporan & pengesahan (worktree `fase-5`)
Laporan per periode (harian, mingguan, bulanan, triwulan, semester, tahunan, rentang bebas; saldo awal, pemasukan & pengeluaran per kategori, pindah dana, saldo akhir per dana & rekening; saldo akhir = saldo awal periode berikutnya); ekspor PDF (`barryvdh/laravel-dompdf`) & Excel; upload stempel (`ChurchSetting.stamp_path`, disk `local` privat); TTD per user (upload PNG atau gambar di canvas); susunan penanda tangan diatur admin; alur pengesahan (TTD ditempel hanya saat orangnya menyetujui dari akunnya sendiri, stempel saat semua sudah setuju); laporan yang disahkan dibekukan (snapshot JSON + PDF + hash sha256) dengan QR/kode verifikasi ke halaman publik cek keaslian; warta mingguan siap cetak. Spec §10, §10.1, §10.2.
Batas: **jangan** membangun dashboard, halaman publik transparansi, atau portal jemaat.

### Fase 6 — Dashboard, transparansi, portal jemaat (worktree `fase-6`)
Dashboard internal (saldo per dana, pemasukan vs pengeluaran, tren bulanan, berita acara yang belum dikonfirmasi/diverifikasi, pengeluaran yang menunggu persetujuan) dengan shadcn chart; halaman publik transparansi tanpa login (bisa dimatikan via `public_page_enabled`; hanya agregat per kategori `is_public` & dana; **tidak pernah** nama atau nominal per orang); portal jemaat (hanya riwayat atas nama sendiri); test invarian spec §11; bagian README berbahasa Indonesia tentang setup & peran.
Batas: **jangan** membangun laporan periode, PDF, atau tanda tangan.

### Merge 5+6 (di `main`)
Sama seperti Merge 3+4 untuk `fase-5` lalu `fase-6`. Tambahan: hubungkan navigasi supaya setiap fitur bisa dijangkau dari sidebar sesuai peran.

### UI Polish (di `main`)
Telusuri setiap halaman (admin, form hitung, pengeluaran, acara, laporan, dashboard, halaman publik, portal jemaat, halaman auth, template PDF) dan rapikan sesuai `DESIGN.md`: standarkan komponen bersama, spasi, tipografi Inter, token warna terang + gelap, layout mobile, empty/loading state, teks Indonesia. Jalankan aplikasi dan ambil screenshot halaman-halaman utama di 1440px & 390px, mode terang & gelap (Playwright), lalu perbaiki yang janggal. **Jangan mengubah logika bisnis.** Cek definisi selesai, lalu commit.

### Review (baca saja, 3 lensa — bisa paralel)
Laporkan hanya masalah nyata dengan bukti, file, dan baris; urutkan dari yang paling parah (CRITICAL/HIGH/MEDIUM/LOW).
- **Keuangan**: buku besar append-only, pembalik, penguncian, pembulatan alokasi, idempotensi submit ganda, race condition (row lock pada konfirmasi/kunci/setujui), tutup periode, saldo negatif, total laporan cocok dengan buku besar, snapshot laporan tidak berubah, tipe data uang.
- **Keamanan**: setiap rute punya auth + permission/policy; IDOR (panitia mengakses acara lain, jemaat mengakses data jemaat lain); file TTD/stempel tidak bisa diakses publik; user tidak bisa memakai TTD orang lain; halaman publik tidak membocorkan data per orang; mass assignment; validasi upload; escape wildcard LIKE; CSRF; rate limit di endpoint publik/verifikasi.
- **Frontend**: error TypeScript, halaman rusak, setiap fitur terjangkau dari navigasi sesuai peran, teks Indonesia, layout mobile form hitung, tipe `DynamicFields`, format rupiah, tampilan error.

### Fix (di `main`)
Untuk setiap temuan: pastikan dulu nyata → tulis test yang gagal → perbaiki. Wajib untuk CRITICAL & HIGH; MEDIUM bila murah. Catat setiap temuan sebagai `FIXED`, `NOT REAL`, atau `SKIPPED (alasan)`. Cek definisi selesai, lalu commit.

## 6. Setup worktree untuk fase paralel (N = 3, 4, 5, 6)

```bash
git worktree add ../kas-fase-N -b fase-N main      # orkestrator, atau agen di worktree-nya sendiri
cd ../kas-fase-N
cp ../SistemKasGereja/.env .env && sed -i 's/^DB_DATABASE=.*/DB_DATABASE=kas_gereja_fN/' .env
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -c "create database kas_gereja_fN" -c "create database kas_gereja_test_fN"
composer install --no-interaction && npm ci --no-audit --no-fund
DB_DATABASE=kas_gereja_test_fN php artisan test   # SELALU pakai DB test sendiri
```
Commit di branch `fase-N`; jangan merge ke `main` (itu tugas agen merge).

## 7. Cek posisi sebelum melanjutkan (resume)

1. `git log --oneline` dan `git status`: task terakhir yang di-commit = titik lanjut. File yang belum di-commit adalah sisa task yang terputus; periksa, pertahankan yang benar, lalu selesaikan.
2. `git branch` dan `git worktree list`: branch `fase-N` yang masih ada berarti fase paralel itu belum digabung.
3. `ls docs/superpowers/plans/`: fase yang sudah punya file rencana sudah dimulai.
4. Centang progres di §9.

## 8. Contoh prompt untuk agen

> You are continuing the build of this repo. Read `docs/WORKFLOW.md` fully, then the files in its §1. Determine the current position using §7. Execute the next step in §4 following §3 and §5 exactly. When done, update the checklist in §9 of `docs/WORKFLOW.md`, commit, and return the report in §10.

## 9. Progres

- [x] Scaffold, PostgreSQL, locale id, registrasi dimatikan (Fase 1 Task 1)
- [x] Fase 1 Task 2 — peran, izin, manajemen pengguna (`e8bf0b7`)
- [x] Fase 1 Task 3 — jejak audit (`9e55b6b`)
- [x] Fase 1 Task 4–9 — Pengaturan, Rekening, Dana, Kategori, EAV, Form Dinamis, Jemaat (`d605443`)
- [x] Fase 2 — Buku Besar, Sesi Ibadah, Berita Acara, Aturan Alokasi, Persembahan Atas Nama, Setoran Bank (`c302054`)
- [x] Fase 3
- [ ] Fase 4
- [ ] Merge 3+4
- [ ] Fase 5
- [ ] Fase 6
- [ ] Merge 5+6
- [ ] UI Polish
- [ ] Review
- [ ] Fix

## 10. Format laporan per langkah

```json
{
  "branch": "main | fase-N",
  "tasks_done": ["..."],
  "tests": "baris ringkasan terakhir dari php artisan test",
  "build_ok": true,
  "deviations": ["keputusan/penyimpangan dari spec atau rencana, dan apa pun yang belum selesai"],
  "plan_file": "docs/superpowers/plans/..."
}
```
