# Deploy ke Coolify

## Alur otomatis

```
git push ke main
  └─ GitHub Actions (.github/workflows/deploy.yml)
       1. tests   : php artisan test pada Postgres 16 (gagal = berhenti)
       2. image   : build Dockerfile → ghcr.io/rivaelmanurung/sistem-kas-gereja:latest
                    dan :sha-<commit> (untuk rollback)
       3. deploy  : POST ke webhook Coolify → Coolify menarik :latest dan
                    mengganti container (migrasi berjalan otomatis saat start)
```

VPS tidak pernah membangun kode; ia hanya menarik image jadi. Build di VPS
(RAM 1,9 GB) berisiko kehabisan memori.

## Isi image

- `serversideup/php:8.4-fpm-nginx`, port 8080, ekstensi tambahan gd, intl, bcmath.
- `AUTORUN_ENABLED=true`: setiap container start menjalankan
  `migrate --force`, `storage:link`, dan cache config/route/view.
- Tidak ada worker antrian atau scheduler karena aplikasi belum memakainya.
  Kalau nanti ada `ShouldQueue` atau jadwal di `routes/console.php`, tambahkan
  container kedua dengan image yang sama dan perintah `queue:work` /
  `schedule:work`.

## Setelan di Coolify (sekali saja)

1. **Registry**: di server, login GHCR sebagai root agar Coolify bisa menarik
   image privat:
   `echo <PAT read:packages> | sudo docker login ghcr.io -u RivaelManurung --password-stdin`
2. **Database**: resource PostgreSQL 16 di project "Kas Gereja", backup
   terjadwal harian aktif.
3. **Aplikasi**: resource *Docker Image* `ghcr.io/rivaelmanurung/sistem-kas-gereja:latest`,
   port 8080, domain `https://kasgereja.vandev.my.id`, persistent storage
   `/var/www/html/storage/app`.
4. **Environment** aplikasi (wajib):

   | Variabel | Nilai |
   |---|---|
   | `APP_KEY` | kunci yang sama dengan server lama (agar data terenkripsi tetap terbaca) |
   | `APP_ENV` / `APP_DEBUG` | `production` / `false` |
   | `APP_URL` | `https://kasgereja.vandev.my.id` |
   | `APP_TIMEZONE` / `APP_LOCALE` | `Asia/Jakarta` / `id` |
   | `APP_DEMO_LOGIN` | `false` kecuali sengaja dibuka untuk demo |
   | `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | dari resource PostgreSQL Coolify |
   | `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION` | `database` |

5. **Webhook**: buat API token Coolify (izin *deploy*), lalu simpan di GitHub
   repo → Settings → Secrets and variables → Actions:
   - `COOLIFY_WEBHOOK`: URL "Deploy Webhook" dari tab Webhooks aplikasi
   - `COOLIFY_TOKEN`: API token tadi

   Tanpa kedua secret ini workflow tetap membangun image, tapi melewati deploy.

## Rollback

Di Coolify ganti tag image dari `latest` ke `sha-<commit lama>` lalu Redeploy.
Migrasi yang sudah jalan tidak ikut dibalik; untuk itu pulihkan backup database.

## Akses dashboard Coolify

Port 8000 ditutup dari internet. Buka lewat tunnel SSH:

```
ssh -L 8000:localhost:8000 ubuntu@43.129.41.241
```

lalu buka `http://localhost:8000`.
