#!/bin/sh
set -eu
: "${PB_TEST_BINARY:?Set PB_TEST_BINARY to a PocketBase 0.39.1 binary}"
test_dir=$(mktemp -d /tmp/rinse-pricing-test.XXXXXX)
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cp -R "$repo_dir/pocketbase/pb_hooks" "$test_dir/hooks"
cp -R "$repo_dir/pocketbase/pb_migrations" "$test_dir/migrations"
"$PB_TEST_BINARY" migrate up --dir="$test_dir/data" --migrationsDir="$test_dir/migrations" > "$test_dir/migrations.log" 2>&1
"$PB_TEST_BINARY" superuser upsert test@rinse.test RinseLocalTestOnly123 --dir="$test_dir/data" > "$test_dir/auth.log" 2>&1
"$PB_TEST_BINARY" serve --http=127.0.0.1:8098 --dir="$test_dir/data" --hooksDir="$test_dir/hooks" --migrationsDir="$test_dir/migrations" > "$test_dir/server.log" 2>&1 &
pb_pid=$!
trap 'kill "$pb_pid" 2>/dev/null || true' EXIT INT TERM
count=0
until curl -fsS http://127.0.0.1:8098/api/health > /dev/null 2>&1; do
  count=$((count + 1)); [ "$count" -lt 30 ] || exit 1
  sleep .1
done
PB_TEST_URL=http://127.0.0.1:8098 node "$repo_dir/scripts/test-pricing-pocketbase.mjs" || { tail -40 "$test_dir/server.log"; exit 1; }
printf 'Test database and logs: %s\n' "$test_dir"
