#!/usr/bin/env bash
# Nightly backup, run by .github/workflows/db-backup.yml (docs/backups.md).
# Prints only pass/fail lines: the repo may be public, so no data, counts or secrets.
set -euo pipefail
umask 077
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
day="$(date -u +%F)"

# Tables whose row counts must match between the live database and the restore.
TABLES="auth.users public.user_progress public.premium_passes public.premium_ledger public.classes public.class_members public.referral_codes public.referral_claims"

count_sql() {
  local q="select concat_ws(',',"
  local first=1
  for t in $TABLES; do
    [ $first = 1 ] || q="$q,"
    q="$q(select count(*) from $t)"
    first=0
  done
  echo "$q);"
}

echo "1/5 dump"
docker run --rm -v "$work:/w" -e DBURL="$SUPABASE_DB_URL" postgres:17 \
  sh -c 'pg_dump "$DBURL" --format=custom --no-owner --no-privileges --schema=public --schema=auth --file=/w/db.dump' \
  > /dev/null 2>"$work/dump.err" || { echo "::error::pg_dump failed (see docs/backups.md, Troubleshooting)"; sed -E 's#postgres(ql)?://[^ ]+#<url>#g' "$work/dump.err" | tail -5; exit 1; }
live_counts="$(docker run --rm -e DBURL="$SUPABASE_DB_URL" postgres:17 psql "$DBURL" -At -c "$(count_sql)")"

echo "2/5 restore test into a clean Postgres 17"
export PGPASSWORD=restoretest
R="postgresql://postgres:restoretest@127.0.0.1:5432/postgres"
docker run --rm --network host -e PGPASSWORD postgres:17 psql "$R" -q -v ON_ERROR_STOP=1 -c "
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create role supabase_auth_admin nologin; create role authenticator nologin;
  create schema extensions; create extension if not exists pgcrypto schema extensions;
  create extension if not exists \"uuid-ossp\" schema extensions;" > /dev/null
docker run --rm --network host -v "$work:/w" -e PGPASSWORD -e PGOPTIONS='-c check_function_bodies=off' postgres:17 \
  pg_restore --dbname="$R" --no-owner --no-privileges /w/db.dump > /dev/null 2>"$work/restore.err" || true
restored_counts="$(docker run --rm --network host -e PGPASSWORD postgres:17 psql "$R" -At -c "$(count_sql)" 2>/dev/null || echo failed)"
if [ "$live_counts" != "$restored_counts" ]; then
  echo "::error::Restore test failed: the restored copy does not match the live database"
  grep -E "^pg_restore: error" "$work/restore.err" | sed -E 's/VALUES.*//' | head -5 || true
  exit 1
fi
echo "    restore test passed (every checked table matches)"

echo "3/5 encrypt"
gpg --batch --yes --quiet --symmetric --cipher-algo AES256 --pinentry-mode loopback \
  --passphrase-fd 3 --output "$work/db.dump.gpg" "$work/db.dump" 3<<<"$BACKUP_PASSPHRASE"
size=$(stat -c %s "$work/db.dump.gpg")
if [ "$size" -gt 24000000 ]; then
  echo "::error::Backup is over KV's 25 MiB value limit; split it (docs/backups.md)"; exit 1
fi

echo "4/5 upload"
W="npx --yes wrangler@4.146.0"
$W kv key put "db/$day.dump.gpg" --path "$work/db.dump.gpg" --namespace-id "$KV_NAMESPACE_ID" --remote --ttl 3024000 > /dev/null
printf '{"day":"%s","bytes":%s,"restoreTest":"passed"}' "$day" "$size" > "$work/latest.json"
$W kv key put "db/latest" --path "$work/latest.json" --namespace-id "$KV_NAMESPACE_ID" --remote > /dev/null

echo "5/5 done: db/$day.dump.gpg stored, expires in 35 days"
