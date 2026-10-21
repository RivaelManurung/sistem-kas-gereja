# Sistem Kas & Persembahan Gereja — Desain

Tanggal: 2026-10-21
Status: draf, menunggu persetujuan

Penanda keputusan:
- **[user]** — diputuskan oleh pemilik proyek dalam diskusi.
- **[keputusan Claude]** — dipilih oleh perancang sebagai default yang masuk akal; boleh dikoreksi.

## 1. Maksud & alasan

Gereja mengelola uang jemaat dari banyak sumber: kolekte tiap ibadah, persembahan
syukur, perpuluhan, dana pembangunan, sampai acara seperti Natal, Paskah, retreat,
atau bazar. Hari ini proses itu biasanya manual (dihitung tangan, dicatat di buku
atau Excel, dilaporkan lewat warta), sehingga:

- jumlah total rawan salah hitung,
- tidak jelas siapa yang mengubah angka dan kapan,
- jemaat sulit melihat ke mana uangnya pergi.

Sistem ini ada supaya **setiap rupiah tercatat, dihitung oleh sistem, tidak bisa
diubah diam-diam, dan dilaporkan secara transparan ke jemaat** — tanpa membuat
admin gereja harus memanggil programmer setiap kali ada jenis persembahan, jadwal
ibadah, atau acara baru.

## 2. Tujuan

1. Petugas memasukkan data mentah; **semua total dihitung oleh sistem** [user].
2. **Semuanya bisa dikonfigurasi lewat Pengaturan**, tidak ada yang di-hardcode di
   backend: jadwal & jumlah ibadah, jenis pemasukan/pengeluaran, acara, kolom isian
   tambahan, aturan perhitungan/pembagian [user].
3. **Acara gereja** bisa dibuat sendiri dengan pemasukan, pengeluaran, kolom isian,
   dan laporannya sendiri [user].
4. Kontrol ganda: tidak ada satu orang yang bisa mencatat uang masuk sendirian
   [keputusan Claude].
5. Laporan transparan untuk jemaat + laporan rinci untuk majelis & pemeriksa
   [keputusan Claude, dari kebiasaan umum gereja].

## 3. Bukan tujuan (versi pertama)

- Banyak gereja dalam satu instalasi (multi-tenant). Satu instalasi = satu gereja
  [keputusan Claude — lihat §12].
- Integrasi payment gateway / QRIS otomatis. Transfer & QRIS dicatat manual
  sebagai pemasukan non-tunai.
- Akuntansi formal penuh (neraca, standar ISAK 35), penggajian, inventaris aset.
- Aplikasi mobile native. Web responsif sudah cukup dipakai dari HP.

## 4. Anti-tujuan (gagal walau "jalan")

- Angka yang sudah dikunci bisa diubah tanpa jejak.
- Persembahan per orang (perpuluhan, amplop bernama) tampil di halaman publik.
- Admin harus mengubah kode untuk menambah jenis persembahan, ibadah, atau acara.
- Total di laporan berbeda dari jumlah rincian transaksinya.

## 5. Teknologi [user]

- **Laravel 12** (PHP 8.2+), **React + shadcn/ui** (Tailwind v4), disatukan lewat
  **Inertia** [keputusan Claude — sama seperti proyek Portal & SistemBookingKlinik].
- Database: MySQL/MariaDB atau PostgreSQL [keputusan Claude: PostgreSQL].
- Peran & izin: `spatie/laravel-permission`; jejak audit: tabel audit sendiri
  atau `spatie/laravel-activitylog` [keputusan Claude].
- PDF laporan/warta: `barryvdh/laravel-dompdf` atau sejenis [diserahkan ke builder].
- Lokasi proyek: `/home/rivael/Documents/Free/Laravel/SistemKasGereja`.
- Bahasa: kode & komentar Inggris; semua teks yang dilihat pengguna Bahasa Indonesia.

## 6. Model data

### 6.1 Prinsip: EAV hibrida [user minta EAV; bentuk hibrida = keputusan Claude]

- **Inti keuangan memakai kolom bertipe tetap**: nominal, tanggal, dana, kategori,
  status, siapa yang mengonfirmasi. Nominal disimpan sebagai **bigint rupiah**
  (tanpa sen) — tidak pernah float, tidak pernah teks.
- **EAV dipakai untuk bagian yang memang berbeda tiap gereja**: kolom tambahan pada
  jemaat, acara, kategori, sesi ibadah, dan transaksi.
- EAV-nya **bertipe**: nilai disimpan di kolom sesuai tipenya
  (`value_text`, `value_number` decimal, `value_date`, `value_bool`, `value_option`),
  bukan satu kolom teks untuk semuanya.

Tabel EAV:
- `attribute_definitions` — `entity_type` (jemaat/acara/kategori/sesi/transaksi),
  `key`, `label`, `data_type` (text/number/date/bool/select/file), `options` (json
  untuk select), `is_required`, `is_public`, `sort_order`, `scope_acara_id`
  (nullable: atribut khusus satu acara).
- `attribute_values` — `definition_id`, `entity_type`, `entity_id`, kolom nilai
  bertipe. Unik per (definition, entity).

Form di React dibangun dinamis dari `attribute_definitions`; validasi backend juga
dibangun dari definisi yang sama (tipe, wajib, opsi).

### 6.2 Entitas inti

| Entitas | Isi penting |
|---|---|
| `church_settings` | profil gereja, logo, zona waktu, pecahan uang yang dipakai, jumlah minimal penghitung, ambang persetujuan pengeluaran, kategori mana yang tampil publik |
| `accounts` (Rekening/Lokasi Uang) | Kas Tunai, Kas Kecil, Bank A, dll. Dibuat admin [keputusan Claude]. Setiap entri buku besar punya **dana dan rekening**; setor tunai ke bank = transfer antar-rekening di buku besar. |
| `funds` (Dana) | Kas Umum, Dana Pembangunan, Diakonia, dll. Dibuat admin. Setiap acara otomatis punya dana sendiri. |
| `categories` | jenis pemasukan & pengeluaran, `direction` (masuk/keluar), dana tujuan default, boleh atas nama atau tidak, aktif/nonaktif. Dibuat admin. |
| `service_schedules` | template ibadah berulang: nama, hari, jam, kategori yang dihitung di ibadah ini |
| `service_sessions` | satu kejadian ibadah (tanggal + jadwal), dibuat otomatis dari template atau manual (ibadah khusus) |
| `events` (Acara) | nama, tanggal mulai–selesai, dana sendiri, kategori sendiri, atribut EAV sendiri, status (perencanaan/berjalan/selesai/ditutup) |
| `members` (Jemaat) | data dasar + atribut EAV; opsional terhubung ke akun login |
| `count_sheets` (Berita Acara Hitung) | per sesi ibadah atau per acara; berisi baris hitung; status draf → dikonfirmasi → diverifikasi → dikunci |
| `count_lines` | kategori, jenis (tunai/non-tunai), untuk tunai: jumlah lembar per pecahan; untuk non-tunai: nominal + bukti |
| `donations` (Persembahan atas nama) | `member_id` (nullable untuk NN), kategori, nominal, terhubung ke `count_sheet`. Amplop bernama dicatat sebagai rincian di dalam count sheet; jumlah rincian atas nama ≤ total kategori itu (sisanya dianggap tanpa nama) [keputusan Claude]. Tanda terima opsional. |
| `count_confirmations` | user + waktu; harus ≥ N orang berbeda (N dari pengaturan, default 2) |
| `expenses` (Pengeluaran) | kategori, dana, nominal, foto nota (wajib), pengaju, status pengajuan → disetujui/ditolak → dibayar |
| `allocation_rules` | aturan pembagian (lihat §7.3), berversi dengan tanggal berlaku |
| `ledger_entries` | buku besar **append-only**: tanggal, dana, rekening, kategori, nominal, arah, sumber (polymorphic: count_sheet/expense/allocation/correction), `reverses_id` untuk koreksi |
| `bank_deposits` | setoran ke bank, dicocokkan dengan count sheet |
| `audit_logs` | siapa, kapan, apa, nilai lama → baru |

## 7. Perhitungan (semua oleh sistem) [user]

### 7.1 Hitung kolekte per pecahan
Petugas mengisi **jumlah lembar/keping per pecahan** (pecahan diatur di pengaturan:
100.000, 50.000, …, 500, 100). Sistem menghitung subtotal per baris, total per
kategori, total per sesi. Total **selalu dihitung ulang di server**; angka dari
browser hanya untuk tampilan.

### 7.2 Non-tunai & penerimaan di luar ibadah
Transfer/QRIS dicatat sebagai baris non-tunai dengan nominal dan bukti (foto/ref).
Penerimaan yang tidak terjadi saat ibadah (mis. perpuluhan transfer hari Rabu)
dicatat di count sheet jenis **"Penerimaan Umum"** per tanggal, yang mengikuti
alur konfirmasi & kunci yang sama [keputusan Claude].

### 7.3 Aturan pembagian (alokasi)
Contoh: "10% kolekte disisihkan untuk sinode", "persembahan pembangunan 100% ke
Dana Pembangunan". Admin membuat aturan: kategori sumber → daftar (dana tujuan,
persentase); total persentase harus 100%. Saat count sheet dikunci, sistem
membuat `ledger_entries` per dana sesuai aturan yang **berlaku pada tanggal
transaksi**. Sisa pembulatan masuk ke dana pertama/utama. Mengubah aturan tidak
mengubah transaksi lama (aturan berversi).

> Catatan: tafsiran "perhitungan bisa diatur" = aturan pembagian ini adalah tebakan
> perancang yang belum dikonfirmasi — lihat §12.

### 7.4 Saldo & rekap
Saldo per dana = jumlah `ledger_entries`. Rekap mingguan/bulanan/tahunan, per
kategori, per dana, per acara — semuanya agregasi SQL dari buku besar.

## 8. Alur & aturan integritas

1. **Ibadah**: sesi dibuat otomatis dari jadwal. Penghitung membuka sesi, mengisi
   count sheet dari HP.
2. **Konfirmasi ganda**: count sheet baru sah setelah ≥ N penghitung berbeda
   mengonfirmasi. Berlaku untuk **semua jalur pemasukan** (ibadah, acara,
   penerimaan umum); N bisa diatur terpisah per jenis sumber, minimal 1 orang
   pengisi + verifikasi bendahara [keputusan Claude]. Mengubah isi setelah ada konfirmasi membatalkan semua konfirmasi.
3. **Verifikasi bendahara**: dicocokkan dengan setoran bank; selisih harus diberi
   keterangan.
4. **Kunci**: setelah diverifikasi, data dikunci dan masuk buku besar. Data
   terkunci tidak bisa di-edit atau dihapus — **koreksi = entri pembalik + entri
   baru**, keduanya tercatat dengan alasan.
5. **Pengeluaran**: diajukan dengan foto nota → disetujui oleh peran yang berwenang
   (di atas ambang nominal tertentu butuh persetujuan majelis) → dibayar → masuk
   buku besar. Pengaju tidak boleh menyetujui pengajuannya sendiri.
6. **Tutup periode**: bulan yang sudah dilaporkan bisa ditutup; transaksi baru di
   periode tertutup ditolak, koreksi masuk periode berjalan.
7. **Saldo negatif**: pengeluaran melebihi saldo dana ditolak secara default;
   bisa diizinkan lewat pengaturan [keputusan Claude].
8. **Pindah dana manual** (mis. Kas Umum menutup kekurangan Diakonia): boleh,
   lewat pengajuan + persetujuan seperti pengeluaran [keputusan Claude].
9. **Saldo awal**: dimasukkan sebagai entri buku besar di periode pembuka yang
   langsung ditutup. Impor data historis dari Excel **bukan** bagian versi pertama.
10. Pengiriman ganda dicegah (idempotency key per submit, unique constraint
   sesi+jadwal).

## 9. Peran (izin bisa diatur admin) [keputusan Claude]

| Peran | Bisa |
|---|---|
| Admin | pengaturan, master data, pengguna |
| Bendahara | verifikasi, kunci, setoran, bayar pengeluaran, laporan |
| Penghitung | mengisi & mengonfirmasi count sheet sesi yang ditugaskan |
| Majelis/Ketua | menyetujui pengeluaran, melihat laporan |
| Panitia Acara | mengisi pemasukan/pengeluaran acara tertentu saja |
| Pemeriksa | baca saja semua data + jejak audit |
| Jemaat | melihat riwayat persembahan atas namanya sendiri |

## 10. Laporan & transparansi

- **Dashboard internal**: saldo per dana, pemasukan vs pengeluaran, tren bulanan,
  count sheet yang belum dikonfirmasi/diverifikasi.
- **Laporan**: periode, per dana, per kategori, per acara; ekspor PDF & Excel.
- **Warta mingguan otomatis**: ringkasan penerimaan per ibadah & kategori minggu
  itu, siap cetak.
- **Halaman publik transparansi** (tanpa login, bisa dimatikan): total per kategori
  dan dana, pengeluaran per kategori, saldo, grafik. **Tidak pernah** menampilkan
  nama atau nominal per orang. Kategori yang tampil diatur di pengaturan.
- **Laporan acara**: pemasukan, pengeluaran, sisa dana acara setelah ditutup (sisa
  dipindah ke dana yang dipilih admin lewat entri alokasi).

### 10.1 Laporan per periode [user]
Periode bisa dipilih: harian, mingguan, bulanan, triwulan, semester, tahunan, atau
rentang tanggal bebas. Isi: saldo awal, pemasukan per kategori, pengeluaran per
kategori, pemindahan antar-dana, saldo akhir — per dana dan per rekening. Saldo
akhir satu periode = saldo awal periode berikutnya (dihitung dari buku besar).

### 10.2 Pengesahan: tanda tangan & stempel [user]
- **Upload stempel gereja** (gambar, PNG transparan) di pengaturan.
- **Tanda tangan elektronik per penanda tangan**: tiap pengguna bisa upload gambar
  TTD atau menggambar langsung di layar (canvas) [keputusan Claude: dua-duanya].
- **Susunan penanda tangan laporan diatur admin**: mis. "Dibuat oleh: Bendahara",
  "Diperiksa oleh: Pemeriksa", "Disetujui oleh: Ketua Majelis", plus kota & tanggal.
- **Alur pengesahan**: laporan periode dibuat → masing-masing penanda tangan
  menyetujui dari akunnya sendiri → TTD orang itu baru ditempel saat ia menyetujui;
  stempel ditempel saat semua sudah menyetujui. Tidak ada yang bisa menempel TTD
  orang lain.
- **Laporan yang sudah disahkan dibekukan**: isi disimpan sebagai snapshot + PDF +
  hash; perubahan data setelahnya (koreksi) tidak mengubah laporan itu, melainkan
  muncul di laporan periode berjalan. PDF memuat **kode/QR verifikasi** yang
  membuka halaman publik pengecekan keaslian.
- Gambar TTD & stempel disimpan di storage privat, tidak bisa diakses lewat URL
  publik; hanya dirender ke dalam PDF.
- **Bukan tujuan**: tanda tangan elektronik tersertifikasi (PSrE, mis. Privy/
  PERURI). TTD di sini berupa gambar + jejak persetujuan yang tercatat.

## 11. Pengujian

- Unit: kalkulasi pecahan, pembagian alokasi + pembulatan, validasi EAV dinamis.
- Integrasi: alur count sheet → konfirmasi → verifikasi → kunci → buku besar;
  koreksi pembalik; tutup periode; persetujuan pengeluaran.
- Invarian yang wajib diuji: total laporan = jumlah buku besar; data terkunci
  tidak bisa diubah; submit ganda tidak menggandakan; data per orang tidak muncul
  di endpoint publik; jemaat hanya melihat datanya sendiri.
- Target cakupan 80%.

## 12. Keputusan default (disetujui bersama dokumen)

1. **"Perhitungan bisa diatur"** = aturan pembagian persentase (§7.3).
2. **Satu gereja per instalasi** (tanpa multi-tenant).

## 13. Diserahkan ke builder

Struktur folder, nama tabel/kolom persis, library PDF/Excel, desain visual detail
(ikuti pola shadcn proyek Portal), urutan fase pengerjaan, seeding data contoh.
