# Database backups

Status file for the nightly backup (owner decisions 2026-11-08: back up the database; make it need nothing from him).

## How it works

- **The copy** runs in the Cloudflare Worker (`worker/src/backup.js`), which already holds the Supabase service key,
  so no database password, link or GitHub secret is needed. Every table in `public` plus the sign-in accounts
  (`auth/v1/admin/users`) is copied as JSON into the private KV namespace `levlprep-backups`
  (id `03af2c257b6f414abc9b89e2b3da2510`, binding `BACKUPS` in `worker/wrangler.toml`), 1,000 rows per key, each key
  kept 35 days. Table list from PostgREST's own schema, so a new table is included automatically.
- **Steps:** the free Workers plan allows 50 outbound requests per run, so the copy runs on its own cron
  (`*/20 10-12 * * *`, every 20 minutes 10:00 to 12:40 UTC) and each step continues from `db/<day>/state`.
- **Checked as it goes:** each page against PostgREST's row count (`Content-Range`); a short page is an error, and the
  day is only marked complete (`db/<day>/manifest.json`, `db/latest`) once every table and the accounts are in. If it is
  still not complete at the last step, one email goes to hello@levlprep.com (Resend).
- **Weekly proof:** `.github/workflows/db-backup.yml` (Mondays) downloads the newest complete day and checks every page
  parses and every count matches (`scripts/backup/check.mjs`). It fails, and GitHub emails, if the newest complete
  backup is more than two days old.
- **Not encrypted separately.** The copies sit in the owner's own Cloudflare account, which already holds the Worker's
  database key, so a second key would add a password to lose without protecting against anything new. KV is
  encrypted at rest by Cloudflare.

Tests: `scripts/test/worker-backup.test.mjs`.

## Restoring

Claude can do this with the Cloudflare token (or `wrangler login`):

```sh
NS=03af2c257b6f414abc9b89e2b3da2510
npx wrangler kv key get db/latest --namespace-id $NS --remote                 # newest complete day
npx wrangler kv key get db/<day>/manifest.json --namespace-id $NS --remote    # tables, rows, pages
npx wrangler kv key get db/<day>/t/<table>/0.json --namespace-id $NS --remote > rows.json
```

Put rows back through PostgREST with the service key (`POST /rest/v1/<table>` with
`Prefer: resolution=merge-duplicates`), one table at a time, after a fresh backup of the current state. Auth users
come back through the Supabase admin API; passwords are not part of the export (sign-in is passwordless anyway).

## History

- 2026-11-08: first version used `pg_dump` from a GitHub Action, which needed the owner to paste a database link and
  a passphrase as secrets. Replaced the same day by the Worker copy above, which needs nothing from him.
