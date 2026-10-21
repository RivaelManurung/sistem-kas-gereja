# Fase 5 — Laporan & Pengesahan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementasi sistem Laporan Keuangan Periodik (`FinancialReportService`) lengkap dengan Saldo Awal, Pemasukan, Pengeluaran, Pemindahan Antar-Dana, dan Saldo Akhir (per Dana & Rekening), invariant saldo strictly continuous, ekspor PDF A4 resmi dengan kop surat gereja, warta jemaat mingguan 1-halaman siap cetak, tanda tangan digital per user (upload/canvas), susunan penanda tangan yang diatur admin, alur pengesahan multi-penandatangan, pembekuan laporan (snapshot JSON + PDF permanen + checksum SHA256), dan halaman publik verifikasi keaslian via kode/QR.

**Architecture:**
- **FinancialReportService**:
  - Perhitungan periode fleksibel: harian, mingguan, bulanan, triwulan, semester, tahunan, atau rentang tanggal bebas (`from` & `to`).
  - Bagian laporan: Saldo Awal (sebelum tanggal `from`, per dana & rekening), Pemasukan (per kategori & dana), Pengeluaran (per kategori & dana), Pemindahan Antar-Dana (per dana), dan Saldo Akhir (pada tanggal `to`, per dana & rekening).
  - Invariant ketat: `Saldo Akhir periode T === Saldo Awal periode T+1` (dihitung konsisten dari buku besar append-only).
  - Penanganan koreksi/reversal: entri pembalik otomatis memperhitungkan nilai neto pada kategori & periode bersangkutan.
- **Signatures & Stamp**:
  - `ChurchSetting.stamp_path`: gambar stempel gereja (PNG transparan), disimpan di storage disk `local` privat.
  - `User.signature_path`: tanda tangan pengguna via upload PNG atau goresan canvas drawing, disimpan di disk `local` privat. Hanya pengguna bersangkutan yang dapat mengunggah/menggambar TTD-nya.
  - `ReportSignatory`: konfigurasi urutan penanda tangan (mis. 1: Dibuat oleh Bendahara, 2: Diperiksa oleh Pemeriksa, 3: Disetujui oleh Ketua Majelis).
- **Report Approval & Freezing (`FrozenReport` & `ReportApproval`)**:
  - Pembuatan draft laporan dengan snapshot data JSON awal.
  - Alur persetujuan: setiap penanda tangan menyetujui dari akun terautentikasinya sendiri (anti-impersonation).
  - TTD orang tersebut hanya ditempel setelah ia menyetujui.
  - Saat seluruh penanda tangan telah menyetujui, stempel gereja diterapkan dan laporan **DIBEKUKAN (`frozen`)**:
    - Data snapshot JSON disimpan permanen.
    - File PDF resmi digenerate dan disimpan di storage permanen.
    - Checksum SHA-256 dihitung dari konten PDF.
    - Diberikan kode verifikasi unik (dan URL `/verify-report/{code}`).
    - Perubahan buku besar setelahnya tidak akan mengubah laporan yang sudah dibekukan.
- **Warta Jemaat Mingguan**:
  - Tata letak 1-halaman ringkas persembahan per ibadah & kategori untuk warta mingguan gereja, siap cetak.
- **Halaman Publik Verifikasi Keaslian**:
  - Endpoint publik `/verify-report/{code}` tanpa login.
  - Memverifikasi status keabsahan dokumen, cap waktu pengesahan, rincian penanda tangan, dan checksum hash SHA-256.

**Tech Stack:** Laravel 12, Inertia 2, React 19, TypeScript, Tailwind 4, shadcn/ui, PostgreSQL, Dompdf (`barryvdh/laravel-dompdf`), Pest.

**Spec:** `docs/superpowers/specs/2026-10-21-sistem-kas-gereja-design.md` §10, §10.1, §10.2; `docs/WORKFLOW.md` §5 (Fase 5).

---

## Global Constraints

- Nominal uang: **bigint rupiah**, bilangan bulat positif, tanpa float/desimal.
- Buku besar append-only: integritas data terjaga; koreksi melalui pembalik.
- File stempel dan tanda tangan disimpan di storage privat (disk `local`), tidak boleh diekspos melalui URL publik langsung; hanya dirender ke dalam PDF (via base64 data URI).
- Anti-impersonation: pengguna hanya bisa menyetujui dan menempelkan tanda tangan dari akun mereka sendiri.
- Invariant Laporan: `Saldo Akhir (T) === Saldo Awal (T+1)`.
- Total Saldo Akhir per Dana strictly sama dengan Total Saldo Akhir per Rekening.
- Laporan yang disahkan berstatus `approved` / dibekukan tidak dapat diubah oleh transaksi masa depan.
- Teks UI berbahasa Indonesia, kode & komentar berbahasa Inggris.
- Batasan Fase: Tidak membangun dashboard internal, halaman publik transparansi umum, atau portal jemaat (itu bagian Fase 6).

---

## Tasks

- [x] ### Task 1: Model & Migrasi Pendukung Laporan & Pengesahan
  - Tambah kolom `signature_path` pada tabel `users`.
  - Buat tabel `report_signatories` (konfigurasi susunan penanda tangan oleh admin).
  - Buat tabel `frozen_reports` (snapshot laporan, status, PDF path, SHA256, kode verifikasi).
  - Buat tabel `report_approvals` (jejak persetujuan per penanda tangan).
  - Model `ReportSignatory`, `FrozenReport`, `ReportApproval`, serta update pada `User` dan `ChurchSetting`.

- [x] ### Task 2: Service Laporan Keuangan (`FinancialReportService`)
  - Kalkulasi periode: harian, mingguan, bulanan, triwulan, semester, tahunan, rentang bebas.
  - Kalkulasi seksi: Saldo Awal, Pemasukan per Kategori & Dana, Pengeluaran per Kategori & Dana, Pemindahan Antar-Dana, Saldo Akhir per Dana & Rekening.
  - Invariant arithmetic: Saldo Akhir period T = Saldo Awal period T+1.
  - Unit & Feature test: `tests/Feature/Reports/FinancialReportServiceTest.php`.

- [x] ### Task 3: Pengelolaan Stempel & Tanda Tangan
  - Endpoint upload stempel gereja di pengaturan gereja (`ChurchSetting.stamp_path`, private storage).
  - Endpoint upload gambar & gambar di canvas untuk tanda tangan pengguna (`User.signature_path`, private storage).
  - Endpoint admin untuk mengatur susunan penanda tangan (`/admin/signatures`).

- [x] ### Task 4: Alur Persetujuan & Pembekuan Laporan (`ReportApprovalService`)
  - Pembuatan laporan & inisiasi persetujuan (`pending_approval`).
  - Persetujuan mandiri per akun penanda tangan dengan verifikasi TTD.
  - Otomasi pembekuan (`frozen`) saat semua penanda tangan telah setuju: penempelan stempel gereja, penyimpanan snapshot JSON, penyimpanan file PDF permanen, kalkulasi hash SHA-256.
  - Feature test: `tests/Feature/Reports/ReportApprovalAndFreezeTest.php`.

- [x] ### Task 5: Ekspor PDF & Warta Jemaat Mingguan
  - Template Blade A4 resmi laporan keuangan dengan kop surat, tabel terstruktur, tanda tangan & stempel.
  - Template Blade warta mingguan 1-halaman ringkas siap cetak.
  - Service `PdfReportService` dengan base64 image rendering yang aman.

- [x] ### Task 6: Halaman Verifikasi Publik & Endpoint Laporan
  - Endpoint publik `/verify-report/{code}` dan controller verifikasi keaslian dokumen.
  - Endpoint unduh/preview PDF laporan resmi.
  - Feature test: `tests/Feature/Reports/ReportVerificationTest.php`.

- [x] ### Task 7: Frontend Inertia React
  - `resources/js/pages/reports/index.tsx`: filter periode, ringkasan live, daftar laporan resmi/terverifikasi.
  - `resources/js/pages/reports/show.tsx`: detail seksi laporan, progress pengesahan penanda tangan, aksi TTD.
  - `resources/js/pages/reports/bulletin.tsx`: tata letak 1-halaman warta jemaat mingguan siap cetak.
  - `resources/js/pages/reports/verify.tsx`: tampilan publik bukti keaslian & hash SHA256.
  - `resources/js/pages/admin/signatures/index.tsx`: manajemen susunan penanda tangan & stempel gereja.
  - Navigasi sidebar: menu Laporan Keuangan & Warta Mingguan.

- [x] ### Task 8: Verifikasi Menyeluruh
  - `php artisan test` semua lulus (204 tests, 832 assertions).
  - `./node_modules/.bin/tsc --noEmit` 0 error.
  - `npm run build` sukses.
