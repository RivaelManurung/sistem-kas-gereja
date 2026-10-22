# syntax=docker/dockerfile:1

# Frontend assets. ziggy-js is a type-only import, so vendor/ is not needed here.
FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM serversideup/php:8.4-fpm-nginx AS app

USER root
# gd: dompdf renders the church logo and stamp; intl: locale-aware formatting.
RUN install-php-extensions gd intl bcmath
USER www-data

WORKDIR /var/www/html
COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts --no-autoloader

COPY --chown=www-data:www-data . .
COPY --chown=www-data:www-data --from=assets /app/public/build ./public/build
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative \
    && php artisan package:discover --ansi

ENV PHP_OPCACHE_ENABLE=1 \
    AUTORUN_ENABLED=true \
    LOG_CHANNEL=stderr
