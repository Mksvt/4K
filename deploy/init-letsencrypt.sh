#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-209.38.244.219.sslip.io}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
RSA_KEY_SIZE=4096
STAGING=${STAGING:-0}

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose (v2) is required" >&2
  exit 1
fi

# Ensure volumes exist (compose will create them)
docker compose up -d nginx || true

echo "Creating dummy certificate for ${DOMAIN}..."
docker compose run --rm --entrypoint \
  "/bin/sh -c \"mkdir -p /etc/letsencrypt/live/${DOMAIN} && \
  openssl req -x509 -nodes -newkey rsa:${RSA_KEY_SIZE} -days 1 \
    -keyout '/etc/letsencrypt/live/${DOMAIN}/privkey.pem' \
    -out '/etc/letsencrypt/live/${DOMAIN}/fullchain.pem' \
    -subj '/CN=localhost'\"" certbot

docker compose up -d nginx

echo "Deleting dummy certificate for ${DOMAIN}..."
docker compose run --rm --entrypoint \
  "/bin/sh -c \"rm -Rf /etc/letsencrypt/live/${DOMAIN} && rm -Rf /etc/letsencrypt/archive/${DOMAIN} && rm -f /etc/letsencrypt/renewal/${DOMAIN}.conf\"" certbot

echo "Requesting Let's Encrypt certificate for ${DOMAIN}..."
if [ "${STAGING}" != "0" ]; then
  STAGING_ARG="--staging"
else
  STAGING_ARG=""
fi

docker compose run --rm --entrypoint \
  "/bin/sh -c \"certbot certonly --webroot -w /var/www/certbot \
    ${STAGING_ARG} \
    --email ${EMAIL} --agree-tos --no-eff-email \
    -d ${DOMAIN}\"" certbot

echo "Reloading nginx..."
docker compose exec nginx nginx -s reload

echo "Done. HTTPS should be available at https://${DOMAIN}"