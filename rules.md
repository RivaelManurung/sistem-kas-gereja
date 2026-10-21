# Aturan Wajib — Kas Gereja

Aturan ini berlaku untuk siapa pun yang mengubah kode, manusia maupun agen AI.
Arah visual ada di [DESIGN.md](DESIGN.md); dokumen ini berisi hal yang **tidak
boleh dilanggar**. Kalau sebuah aturan perlu dilanggar, tulis alasannya di PR.

## 1. Komponen: wajib shadcn/ui

- Semua elemen UI memakai komponen di `resources/js/components/ui` (shadcn/ui):
  `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Tabs`, `Card`,
  `Table`, `Badge`, `Dialog`, `AlertDialog`, `DropdownMenu`, `Popover`,
  `Tooltip`, `DatePicker`, `MoneyInput`.
- Komponen belum ada? Tambahkan lewat `npx shadcn@latest add <nama>`, jangan
  membuat versi sendiri.
- Dilarang: `<select>`, `<input type="date">`, checkbox/radio bawaan browser,
  `alert()`, `confirm()`, tombol atau input dengan styling buatan sendiri.
- Komponen aplikasi yang sudah ada dipakai ulang, bukan ditiru:
  `PageHeader`, `BackButton`, `StatusBadge`, `DetailCard`, `DefinitionList`,
  `StatTiles`, `RowActions`, `ConfirmDialog`, `EmptyState`, `ImageField`,
  `InputError`.

## 2. Halaman harus seragam

- Setiap halaman: `AppLayout` + breadcrumbs, lalu wrapper
  `<div className="space-y-6 p-4 md:p-6 lg:p-8">`.
- Judul halaman **selalu** lewat `PageHeader` (judul, deskripsi singkat, aksi di
  kanan). Jangan menulis `<h1>` sendiri.
- Breadcrumb dimulai dari halaman daftar induknya, misalnya
  `Rekening › Kas Tunai`. Jangan menambah nama grup sidebar seperti
  "Master Data", "Administrasi", atau "Pengaturan".
- Halaman baru wajib dicek berdampingan dengan halaman sejenis yang sudah ada:
  jarak tepi, header, tombol, tab, dan badge harus terlihat sama.

## 3. Tombol kembali

- Semua halaman **detail** dan **form** (tambah/ubah) memakai
  `<PageHeader back={...} />`. Jangan membuat tombol "Kembali" sendiri.
- Tujuan kembali sama dengan tombol "Batal": form tambah ke halaman daftar, form
  ubah ke halaman detail, halaman detail ke halaman daftar.
- Halaman dengan header khusus (misalnya detail jemaat atau acara) memakai
  `<BackButton href={...} />` di atas header.

## 4. Form

- Form panjang dibagi per seksi dengan `Card` (judul + deskripsi).
- Tombol di kanan bawah dengan urutan **Batal** (`variant="outline"`) lalu aksi
  utama. Label aksi spesifik: "Tambah Rekening", "Simpan Perubahan", bukan
  sekadar "Simpan" atau "Submit".
- Setiap field yang divalidasi server punya `<InputError>` di bawahnya.
- **Setiap field yang wajib di server harus ikut dikirim form**, termasuk field
  tersembunyi seperti `event_id` atau `service_session_id`. Cocokkan isi
  `useForm` dengan aturan di FormRequest-nya.
- Tombol submit memakai `disabled={processing}`.

## 5. Tanggal dan uang

- Input tanggal memakai `DatePicker`. Nilai `value` **selalu** format ISO
  `YYYY-MM-DD`, misalnya `value={data.date}`. Jangan mengirim
  `formatDate(...)` ke `value`, karena kolom akan terus tampil kosong.
- `formatDate`, `formatDateTime`, dan `formatRupiah` hanya untuk tampilan.
- Input uang memakai `MoneyInput`; nominal ditampilkan dengan `tabular-nums`.

## 6. Tab, status, dan warna

- Semua tab memakai `Tabs` dari shadcn. Tab aktif berwarna biru `primary`. Tab
  berbentuk link, seperti di Pengaturan Akun, meniru gaya yang sama.
- Status memakai `StatusBadge`. Teks badge harus terbaca di tema terang dan
  gelap (jangan teks putih di latar terang).
- Warna lewat token (`primary`, `income`, `expense`, `warning`, `info`,
  `muted`), bukan kode warna langsung.

## 7. Loading dan umpan balik

- Loading untuk aksi simpan, ubah, hapus, setujui, dan tolak sudah global
  (`resources/js/lib/pending-actions.ts`): tombol yang diklik menampilkan
  spinner, muncul label "Sedang memproses…", dan error validasi tampil sebagai
  pesan merah. Jangan membuat spinner manual per tombol.
- Aksi yang tidak bisa dibatalkan (hapus, kunci, setujui, tutup periode, sahkan
  laporan) wajib konfirmasi lewat `ConfirmDialog`/`AlertDialog` yang
  menjelaskan akibatnya.
- Pesan sukses/gagal dari server dikirim lewat flash `success`/`error`.

## 8. Data dan aturan bisnis

- Satu pengaturan hanya punya satu tempat. Contoh: transparansi publik hanya di
  `/admin/transparansi`; logo sekaligus menjadi favicon.
- Aturan keunikan (misalnya urutan penanda tangan) ditegakkan di server dengan
  validasi, dan di UI pilihan yang sudah dipakai ditampilkan *disabled*.
- Uang disimpan sebagai integer/decimal, tidak pernah float.
- Perubahan data penting memakai model Eloquent (bukan bulk `update()`), supaya
  jejak audit tercatat.

## 9. Bahasa dan komentar

- Semua teks yang dilihat pengguna dalam Bahasa Indonesia.
- Kode dan komentar dalam Bahasa Inggris. Komentar hanya menjelaskan *mengapa*,
  bukan *apa*.

## 10. Sebelum menyatakan selesai

1. `npx tsc --noEmit` lulus.
2. `npx eslint <file yang diubah>`: tidak ada error baru.
3. `php artisan test` lulus (memakai database `kas_gereja_test`, bukan data asli).
4. Tambah atau perbarui tes untuk perilaku baru.
5. `npm run build`, lalu cek halaman yang berubah di browser.
6. Jangan membuat data uji di database aplikasi yang sedang dipakai.

## 11. Git dan deploy

- Commit memakai format `<type>: <deskripsi>` (feat, fix, refactor, docs, test,
  chore).
- Jangan pernah commit `.env`, kunci, atau file rahasia lain.
- Kode yang berjalan ada di VPS `~/project/SistemKasGereja` (dilayani Caddy di
  port 8080). Setelah mengubah frontend, jalankan `npm run build` agar
  perubahan tampil.
