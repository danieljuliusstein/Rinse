#!/usr/bin/env bash
set -euo pipefail

PB_VERSION="${PB_VERSION:-0.39.1}"
PB_PORT="${PB_PORT:-8090}"
PB_ADMIN_EMAIL="${PB_ADMIN_EMAIL:-feature-admin@example.test}"
PB_ADMIN_PASSWORD="${PB_ADMIN_PASSWORD:-FeatureVerification2026!aA1}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PB_DIR="${PB_DIR:-$ROOT_DIR/.feature-pb}"
PB_BINARY="$PB_DIR/pocketbase"
PB_DATA="$PB_DIR/data"
PB_LOG="${PB_LOG:-$PB_DIR/pocketbase.log}"

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) PB_PLATFORM="darwin_arm64" ;;
  Darwin-x86_64) PB_PLATFORM="darwin_amd64" ;;
  Linux-x86_64) PB_PLATFORM="linux_amd64" ;;
  Linux-aarch64|Linux-arm64) PB_PLATFORM="linux_arm64" ;;
  *) echo "Unsupported platform: $(uname -s)-$(uname -m)" >&2; exit 1 ;;
esac

mkdir -p "$PB_DATA"
if [[ ! -x "$PB_BINARY" ]]; then
  archive="$PB_DIR/pocketbase.zip"
  curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${PB_PLATFORM}.zip" -o "$archive"
  unzip -oq "$archive" -d "$PB_DIR"
  chmod +x "$PB_BINARY"
fi

"$PB_BINARY" superuser create "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" \
  --dir="$PB_DATA" --hooksDir="$ROOT_DIR/pocketbase/pb_hooks" \
  --migrationsDir="$ROOT_DIR/pocketbase/pb_migrations" >/dev/null 2>&1 || true

"$PB_BINARY" serve --http="127.0.0.1:${PB_PORT}" --dir="$PB_DATA" \
  --hooksDir="$ROOT_DIR/pocketbase/pb_hooks" \
  --migrationsDir="$ROOT_DIR/pocketbase/pb_migrations" >"$PB_LOG" 2>&1 &
PB_PID=$!
cleanup() {
  kill "$PB_PID" 2>/dev/null || true
}
trap cleanup EXIT

for attempt in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PB_PORT}/api/health" >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS "http://127.0.0.1:${PB_PORT}/api/health" >/dev/null

cd "$ROOT_DIR"
FEATURE_PB_URL="http://127.0.0.1:${PB_PORT}" \
PB_URL="http://127.0.0.1:${PB_PORT}" \
NEXT_PUBLIC_PB_URL="http://127.0.0.1:${PB_PORT}" \
PB_ADMIN_EMAIL="$PB_ADMIN_EMAIL" \
PB_ADMIN_PASSWORD="$PB_ADMIN_PASSWORD" \
npm run verify:features:integration
