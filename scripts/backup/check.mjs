/* Proves the latest nightly backup (worker/src/backup.js) is whole: downloads every page of the
   last complete day from the KV namespace levlprep-backups, parses each one, and checks every
   table's row count against the manifest. Run weekly by .github/workflows/db-backup.yml with the
   Cloudflare token the Worker deploy already uses. Prints pass/fail only: no data, no counts. */
import { execFileSync } from 'node:child_process';

const NS = '03af2c257b6f414abc9b89e2b3da2510';
const W = ['--yes', 'wrangler@4.146.0'];
const kv = (...args) => execFileSync('npx', [...W, 'kv', ...args, '--namespace-id', NS, '--remote'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const get = (key) => kv('key', 'get', key);

function fail(msg) { console.log('::error::' + msg); process.exit(1); }

let latest;
try { latest = JSON.parse(get('db/latest')); } catch { fail('No complete backup found (db/latest is missing).'); }
const ageDays = (Date.now() - Date.parse(latest.day + 'T00:00:00Z')) / 864e5;
if (ageDays > 2.5) fail(`The newest complete backup is from ${latest.day}, more than two days ago.`);
const manifest = JSON.parse(get(`db/${latest.day}/manifest.json`));
let tables = 0;
for (const [name, info] of Object.entries(manifest.tables)) {
  let rows = 0;
  for (let p = 0; p < info.pages; p++) {
    const key = name === 'auth.users' ? `db/${latest.day}/auth/${p}.json` : `db/${latest.day}/t/${name}/${p}.json`;
    let page;
    try { page = JSON.parse(get(key)); } catch { fail(`A page of ${name} is missing or does not parse.`); }
    rows += Array.isArray(page) ? page.length : (page && Array.isArray(page.users) ? page.users.length : NaN);
  }
  if (rows !== info.rows) fail(`${name}: the stored rows do not match the count taken at backup time.`);
  tables++;
}
console.log(`Backup ${latest.day} checked: ${tables} tables, every page parses and every count matches.`);
