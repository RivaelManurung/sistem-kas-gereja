# Deploy ke Coolify

Aplikasi ini sudah memakai Docker: satu image berisi PHP 8.4 dan server web (FrankenPHP/Caddy),
asetnya dibangun otomatis saat build. Ada dua cara memakainya di Coolify.

## Cara 1: Docker Compose (paling mudah, database ikut dibuat)

1. Coolify, **New Resource**, pilih repository GitHub proyek ini.
2. **Build Pack**: `Docker Compose`, lokasi file `docker-compose.yml`.
3. Isi **Environment Variables**:

| Variabel | Isi |
|---|---|
| `APP_KEY` | hasil `php artisan key:generate --show` di laptop (awalan `base64:`) |
| `APP_URL` | alamat akhir, misalnya `https://kas.gereja.id` (wajib sama dengan domain) |
| `ADMIN_EMAIL` | email admin pertama |
| `ADMIN_PASSWORD` | password admin pertama, minimal 10 karakter |
| `ADMIN_NAME` | nama admin (opsional) |
| `SERVICE_PASSWORD_POSTGRES` | password database (Coolify bisa membuatkan otomatis) |

4. Di tab **Domains** untuk service `app`, isi domain Anda dan port `80`.
5. **Deploy**. Pertama kali jalan, aplikasi menunggu database siap, menjalankan migrasi,
   membuat peran dan hak akses, lalu membuat akun admin dari `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

Volume `app-storage` menyimpan semua berkas unggahan (dokumen jemaat, foto, tanda tangan, logo).
Volume `db-data` menyimpan database. Keduanya bertahan saat redeploy.

## Cara 2: Dockerfile + database Coolify

1. Buat resource **PostgreSQL** di Coolify, catat host, nama database, user, dan password.
2. Buat resource aplikasi dari repository, **Build Pack**: `Dockerfile`, port `80`.
3. Isi variabel yang sama seperti di atas, ditambah:
   `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT=5432`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`,
   `APP_ENV=production`, `SESSION_SECURE_COOKIE=true`.
4. Di **Persistent Storage** tambahkan volume yang dipasang ke `/app/storage/app`.

## Setelah berjalan

- Buka domain, masuk dengan akun admin, lalu atur nama, logo, dan data gereja di **Pengaturan**.
- Data contoh (jemaat dan transaksi) **tidak** ikut. Untuk mencoba dengan data contoh di server uji:
  `php artisan db:seed --class=DemoDataSeeder` lewat terminal Coolify. Jangan dilakukan di server
  yang dipakai untuk data asli.
- `APP_DEMO_LOGIN` harus tetap `false` di server asli.
- Update: push ke GitHub, lalu **Redeploy**. Migrasi berjalan otomatis (`RUN_MIGRATIONS=false`
  untuk mematikannya).
- Cadangan: pakai fitur backup database Coolify, dan cadangkan volume `app-storage`.

## Catatan teknis

- Aplikasi berada di belakang proxy Coolify, jadi `trustProxies` aktif agar HTTPS dan domain terbaca benar.
- Log dikirim ke `stderr`, bisa dilihat di tab Logs Coolify.
- Health check memakai `/up`.
- Tidak ada queue worker atau scheduler yang diperlukan saat ini.
