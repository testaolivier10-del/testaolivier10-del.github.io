/* Cross-device sync must stay a per-key, version-checked merge.

   Audit 2026-10, Fix-first 5 and the account.js row of "Payments, security
   and data": push() replaced each whole namespace of the user_progress row
   with this browser's copy (a blind upsert), and a pull ran only on a fresh
   sign-in, so two signed-in devices erased each other's progress.
   scripts/test/account-sync.test.mjs holds the behaviour; this keeps the
   shapes that caused it out of the source:

     - no .upsert( anywhere in the sync code: a write must name the version
       it read (update ... eq('updated_at', ...), or insert for a new row);
     - no whole-bucket assignment (merged[ns] = mine[ns] and the like): the
       row is reconciled key by key;
     - the signed-in page load still starts a sync (the pull on every load). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function ({ ROOT, fail }) {
  const file = 'assets/account.js';
  const src = readFileSync(join(ROOT, file), 'utf8')
    // Comments may describe the old shape; only code counts.
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');

  if (/\.upsert\s*\(/.test(src)) {
    fail(`${file}: user_progress is written with .upsert(), which overwrites whatever another device wrote. Use the conditional update in writeRow().`);
  }
  if (!/\.eq\(\s*'updated_at'/.test(src)) {
    fail(`${file}: the sync write no longer checks updated_at, so a stale device can overwrite a newer row.`);
  }
  if (/\[\s*ns\s*\]\s*=\s*\w+\s*\[\s*ns\s*\]\s*;/.test(src)) {
    fail(`${file}: a namespace bucket is assigned whole from one side; sync must reconcile key by key (reconcile()).`);
  }
  if (!/startSyncTimer\(\s*'load'\s*\)/.test(src)) {
    fail(`${file}: a signed-in page load no longer syncs; progress from another device would only arrive on a fresh sign-in.`);
  }
}
