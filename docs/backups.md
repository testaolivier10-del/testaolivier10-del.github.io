# Database backups

Status file for the nightly backup (owner decision 2026-11-08). Workflow: `.github/workflows/db-backup.yml`;
script: `scripts/backup/run.sh`.

## Why

Supabase's free plan keeps no backup we can restore. Supabase itself tells free projects to export their
data and keep it off-site. Everything students build up (progress, passes, classes, invites) lives in one
database, so without this a bad migration or a wiped table would be permanent. Purchases could be rebuilt
from Polar, but nothing else could.

## What it does, every night at 10:17 UTC

1. `pg_dump` of the `public` and `auth` schemas (custom format) from the Session pooler.
2. Restores that dump into a clean Postgres 17 inside the job and checks that the row counts of the key
   tables (`auth.users`, `user_progress`, `premium_passes`, `premium_ledger`, `classes`, `class_members`,
   `referral_codes`, `referral_claims`) match the live database. A dump that does not restore fails the run.
3. Encrypts it with AES-256 (`gpg --symmetric`) using `BACKUP_PASSPHRASE`.
4. Stores it in the Cloudflare KV namespace `levlprep-backups` (id `03af2c257b6f414abc9b89e2b3da2510`) as
   `db/YYYY-MM-DD.dump.gpg`, expiring after 35 days, and writes `db/latest` (day, size, restore test result).

Why KV and not R2: R2 needs a payment method on file even on the free plan; KV does not. KV's free plan
allows 1 GB stored and 1,000 writes a day; this uses about 35 copies of a few MB and 2 writes a night.
A single KV value can be at most 25 MiB; the run fails loudly before that (the database was 18 MB
uncompressed on 2026-11-08, the dump far smaller).

The repo may be public, so the job prints only pass or fail lines: no data, no counts, no connection string.
GitHub emails the owner when a scheduled run fails.

## Owner setup (once)

In GitHub: repo Settings, Secrets and variables, Actions, New repository secret.

- `SUPABASE_DB_URL`: Supabase dashboard, Connect, Session pooler, copy the URI and put the database password
  in it. Use the Session pooler (IPv4); the direct `db.<ref>.supabase.co` address is IPv6 only and GitHub's
  runners cannot reach it.
- `BACKUP_PASSPHRASE`: a long random passphrase. Save the same one with the other LevlPrep keys: without it
  no backup can be opened, by anyone, including us.
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are already set for the Worker deploy. The token needs
  Workers KV Storage: Edit (the "Edit Cloudflare Workers" template has it).

Then Actions, Database backup, Run workflow, to make the first copy now.

## Restoring

```sh
npx wrangler kv key list --namespace-id 03af2c257b6f414abc9b89e2b3da2510 --remote --prefix db/
npx wrangler kv key get "db/2026-11-08.dump.gpg" --namespace-id 03af2c257b6f414abc9b89e2b3da2510 --remote > db.dump.gpg
gpg --decrypt --output db.dump db.dump.gpg          # asks for BACKUP_PASSPHRASE
pg_restore --list db.dump | less                    # see what is in it
```

To put back one table (the usual case), restore it into a scratch database first and copy the rows over;
never restore over the live database without a fresh backup of its current state. A full restore into a
new Supabase project: `pg_restore --dbname "<new project URL>" --no-owner --no-privileges --data-only
--schema=public db.dump` after running `scripts/sql/schema.sql` and the migrations there.

## Troubleshooting

- "Missing secrets": add the ones named (Owner setup above).
- "pg_dump failed": usually the wrong URL (direct instead of Session pooler) or a changed database password.
- "Restore test failed": the dump did not come back whole. The previous nights' copies are still there; look
  at the job's error lines and fix before trusting new copies.
