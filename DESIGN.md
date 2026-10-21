# Arah Desain UI — Kas Gereja

Aturan wajib yang tidak boleh dilanggar ada di [rules.md](rules.md).

Tujuan: terasa seperti aplikasi keuangan profesional (rapi, tenang, bisa dipercaya),
bukan template admin generik. Semua halaman memakai komponen shadcn/ui di
`resources/js/components/ui`.

## Karakter
- Tenang & terpercaya: banyak ruang putih, sedikit warna, hierarki jelas.
- Angka adalah bintang utama: mudah dibaca, rata kanan, konsisten.
- Satu warna aksen; warna lain hanya untuk makna (status, naik/turun).

## Token
- Font: **Inter** (fallback system-ui). Angka uang & tabel: `tabular-nums`.
- Aksen: indigo/navy tua (`--primary` ≈ `oklch(0.42 0.12 265)`), dark mode
  menyesuaikan. Netral: zinc/slate.
- Semantik: pemasukan = emerald, pengeluaran = rose, menunggu = amber,
  terkunci/selesai = slate, info = sky. Jangan pakai merah/hijau tanpa ikon/label.
- Radius `0.5rem`; bayangan halus (`shadow-xs`/`shadow-sm`) saja; border 1px.
- Skala spasi 4px; padding halaman `p-4 md:p-6 lg:p-8`, jarak antar-seksi `gap-6`.
- Ikon: lucide-react, ukuran 16px di tombol/tabel, 20px di header.

## Pola wajib
- **Page header** tiap halaman: breadcrumb, judul (`text-2xl font-semibold
  tracking-tight`), deskripsi singkat abu-abu, aksi utama di kanan.
- **Sidebar** dikelompokkan: Ringkasan · Penerimaan (Ibadah, Berita Acara,
  Penerimaan Umum) · Pengeluaran · Acara · Laporan · Master Data · Pengaturan.
  Item hanya tampil sesuai izin peran.
- **Tabel data**: header sticky, baris zebra halus atau hover, kolom nominal rata
  kanan `tabular-nums`, filter + pencarian di atas, paginasi di bawah, aksi per
  baris lewat dropdown `⋯`. Mobile: tabel jadi kartu.
- **Format uang**: `Rp 1.500.000` lewat `formatRupiah`; negatif `−Rp 50.000`
  warna rose. Tanggal `21 Okt 2026`; tanggal-waktu `21 Okt 2026, 09.30`.
- **Status badge** konsisten untuk semua alur (draf, menunggu konfirmasi,
  dikonfirmasi, diverifikasi, terkunci, diajukan, disetujui, ditolak, dibayar,
  ditutup).
- **Kartu statistik** (dashboard): label kecil, angka besar, delta vs periode
  lalu dengan ikon panah, sparkline opsional.
- **Form**: label di atas, teks bantuan di bawah, error rose di bawah field,
  tombol simpan di kanan bawah (sticky di mobile). Form panjang dibagi Card per
  seksi. Konfirmasi via AlertDialog untuk aksi tak terbalik (kunci, setujui,
  tutup periode, sahkan laporan) — jelaskan akibatnya.
- **Empty state**: ikon, satu kalimat, tombol aksi pertama.
- **Loading**: Skeleton untuk memuat data, bukan spinner layar penuh. Aksi simpan/hapus
  memakai indikator global (lihat [rules.md](rules.md) §7).
- **Form hitung kolekte (HP)**: input besar (h-12), keypad numerik
  (`inputMode="numeric"`), baris pecahan dengan subtotal langsung, total besar
  sticky di bawah layar.
- **Halaman publik transparansi**: layout sendiri bergaya laporan tahunan —
  logo & nama gereja, ringkasan angka besar, grafik bersih, tabel per kategori,
  catatan "Data per orang tidak ditampilkan".
- **PDF laporan**: kop gereja (logo, nama, alamat), judul & periode, tabel rapi
  bergaris tipis, blok tanda tangan + stempel di bawah, nomor halaman, QR verifikasi.

## Aksesibilitas
Kontras AA, fokus terlihat (`ring`), target sentuh ≥ 40px, semua ikon-only punya
`aria-label`, dark mode berfungsi di semua halaman.
