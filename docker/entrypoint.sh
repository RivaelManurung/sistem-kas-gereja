#!/bin/sh
set -e
cd /app

# Wait for the database so the first deploy does not crash while Postgres is still starting.
# A plain connection check is used because `migrate:status` fails on a brand-new, empty database.
db_ready() {
    php -r '
        try {
            new PDO(sprintf("pgsql:host=%s;port=%s;dbname=%s", getenv("DB_HOST"), getenv("DB_PORT") ?: "5432", getenv("DB_DATABASE")), getenv("DB_USERNAME"), getenv("DB_PASSWORD"), [PDO::ATTR_TIMEOUT => 3]);
        } catch (Throwable $e) {
            fwrite(STDERR, $e->getMessage() . PHP_EOL);
            exit(1);
        }
    '
}

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    tries=0
    until db_ready; do
        tries=$((tries + 1))
        if [ "$tries" -ge 40 ]; then
            echo "Database is not reachable after 40 attempts, giving up." >&2
            exit 1
        fi
        echo "Waiting for database ($tries/40)..."
        sleep 3
    done
fi

php artisan package:discover --ansi >/dev/null
php artisan storage:link --force >/dev/null 2>&1 || true

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    php artisan migrate --force
    # Roles and permissions are safe to re-run: existing ones are never overwritten.
    php artisan db:seed --class=RolePermissionSeeder --force
fi

# Creates the first admin once, from ADMIN_EMAIL / ADMIN_PASSWORD. Skipped when that user already exists.
if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
    php artisan app:create-admin
fi

php artisan config:cache
php artisan view:cache
php artisan event:cache

exec frankenphp run --config /etc/caddy/Caddyfile --adapter caddyfile
