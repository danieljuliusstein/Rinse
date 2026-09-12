#!/usr/bin/env bash
# Load server/campaign-mail/.env and push production secrets to Fly.
# Does not print secret values. Avoids `source` so passwords with !/$ stay intact.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v fly >/dev/null 2>&1; then
  echo "fly CLI not found. Install: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example and fill secrets first."
  exit 1
fi

get_env() {
  local key="$1"
  local line
  line=$(grep -E "^${key}=" .env | tail -n1 || true)
  if [[ -z "$line" ]]; then
    echo ""
    return
  fi
  local val="${line#*=}"
  # Strip surrounding quotes
  if [[ "$val" == \"*\" && "$val" == *\" ]]; then
    val="${val:1:${#val}-2}"
  elif [[ "$val" == \'*\' && "$val" == *\' ]]; then
    val="${val:1:${#val}-2}"
  fi
  printf '%s' "$val"
}

PB_URL=$(get_env PB_URL)
PB_ADMIN_EMAIL=$(get_env PB_ADMIN_EMAIL)
PB_ADMIN_PASSWORD=$(get_env PB_ADMIN_PASSWORD)
RESEND_API_KEY=$(get_env RESEND_API_KEY)
RESEND_FROM=$(get_env RESEND_FROM)
RESEND_WEBHOOK_SECRET=$(get_env RESEND_WEBHOOK_SECRET)
CORS_ORIGIN=$(get_env CORS_ORIGIN)
CORS_ORIGIN="${CORS_ORIGIN:-https://desk.rinsehq.com}"

missing=0
for name in PB_URL PB_ADMIN_EMAIL PB_ADMIN_PASSWORD RESEND_API_KEY RESEND_FROM RESEND_WEBHOOK_SECRET; do
  if [[ -z "${!name}" ]]; then
    echo "Missing $name in .env"
    missing=1
  fi
done
if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

# Production: Desk only (drop localhost from CORS on Fly)
if [[ "$CORS_ORIGIN" == *"localhost"* ]]; then
  CORS_ORIGIN="https://desk.rinsehq.com"
  echo "Using production CORS_ORIGIN=https://desk.rinsehq.com"
fi

echo "Setting Fly secrets on rinse-campaign-mail (values hidden)…"
fly secrets set \
  PB_URL="$PB_URL" \
  PB_ADMIN_EMAIL="$PB_ADMIN_EMAIL" \
  PB_ADMIN_PASSWORD="$PB_ADMIN_PASSWORD" \
  RESEND_API_KEY="$RESEND_API_KEY" \
  RESEND_FROM="$RESEND_FROM" \
  RESEND_WEBHOOK_SECRET="$RESEND_WEBHOOK_SECRET" \
  CORS_ORIGIN="$CORS_ORIGIN" \
  -a rinse-campaign-mail

echo "Done. Confirm: fly secrets list -a rinse-campaign-mail"
