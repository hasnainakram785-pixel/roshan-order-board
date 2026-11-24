#!/usr/bin/env bash
# Builds an upload-ready copy of the API for shared PHP hosting (no SSH, no Composer on the server).
# Run from the Laravel project root:   bash deploy/build_for_shared_hosting.sh
#
# Result:  deploy-build/htdocs/   <- upload the CONTENTS of this folder to the host's web root (htdocs)
#            index.php, .htaccess ...      public files (Laravel's /public)
#            laravel/                      app code, vendor, .env (blocked from the web by laravel/.htaccess)
#            board/                        optional copy of the front-end, same domain as the API
set -euo pipefail

[ -f artisan ] && [ -f deploy/.env.production.example ] || { echo "STOP: run this from the Laravel project root."; exit 1; }
command -v composer >/dev/null || { echo "STOP: composer not found."; exit 1; }
command -v php >/dev/null || { echo "STOP: php not found."; exit 1; }

OUT=deploy-build
rm -rf "$OUT"
mkdir -p "$OUT/htdocs/laravel"

echo "1/6 Copying the project..."
tar --exclude=./deploy-build --exclude=./.git --exclude=./node_modules --exclude=./vendor \
    --exclude=./.env --exclude=./tests --exclude=./.postman --exclude=./storage/logs/*.log \
    -cf - . | (cd "$OUT/htdocs/laravel" && tar xf -)
rm -f "$OUT/htdocs/laravel/bootstrap/cache/"*.php

echo "2/6 Installing production dependencies (takes a few minutes)..."
composer install --no-dev --optimize-autoloader --no-interaction --working-dir="$OUT/htdocs/laravel"

echo "3/6 Moving the public files to the web root..."
cp -R "$OUT/htdocs/laravel/public/." "$OUT/htdocs/"
rm -rf "$OUT/htdocs/laravel/public"
# index.php must now find the app inside ./laravel instead of ../
sed -i "s#__DIR__\.'/\.\./#__DIR__.'/laravel/#g" "$OUT/htdocs/index.php"
grep -q "/laravel/vendor/autoload.php" "$OUT/htdocs/index.php" || { echo "STOP: could not patch index.php"; exit 1; }

echo "4/6 Protecting the app folder and writing the production .env..."
printf '<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order deny,allow\n  Deny from all\n</IfModule>\n' > "$OUT/htdocs/laravel/.htaccess"
KEY="$(php artisan key:generate --show)"
sed "s#__FILLED_BY_BUILD_SCRIPT__#${KEY}#" deploy/.env.production.example > "$OUT/htdocs/laravel/.env"
mkdir -p "$OUT/htdocs/laravel/storage/framework/cache/data" "$OUT/htdocs/laravel/storage/framework/sessions" \
         "$OUT/htdocs/laravel/storage/framework/views" "$OUT/htdocs/laravel/storage/logs" "$OUT/htdocs/laravel/bootstrap/cache"

echo "5/6 Adding the board to the same domain (works even if the host blocks cross-site API calls)..."
if [ -d frontend ]; then
  mkdir -p "$OUT/htdocs/board"
  cp -R frontend/. "$OUT/htdocs/board/"
  cat > "$OUT/htdocs/board/config.js" <<'JS'
window.APP_CONFIG = { API_BASE_URL: "/api", POLL_INTERVAL_MS: 10000 };
JS
fi

echo "6/6 Done."
echo
echo "NEXT:"
echo "  a) Open $OUT/htdocs/laravel/.env and fill APP_URL, DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD, CORS_ALLOWED_ORIGINS."
echo "  b) In phpMyAdmin on the host, import deploy/schema.sql into your database."
echo "  c) Upload the CONTENTS of $OUT/htdocs/ into the host's htdocs folder (FTP, e.g. FileZilla)."
echo "  d) Test:  curl -i https://YOUR-API-HOST/api/orders   -> must print JSON, not an HTML page."
