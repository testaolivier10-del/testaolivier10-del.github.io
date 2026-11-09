/* Nightly database backup, run by the Worker itself (docs/backups.md). The Worker already holds
   the service key, so nothing extra has to be set up or stored anywhere: every table in the
   public schema, plus the sign-in accounts (auth users), is copied as JSON into the private KV
   namespace levlprep-backups, one key per page of 1,000 rows, kept 35 days.

   The free Workers plan allows 50 outbound requests per run, so the copy runs in steps on the
   backup cron (every 20 minutes from 10:00 to 12:40 UTC) and picks up where the last step
   stopped, from db/<day>/state. Each page is checked against PostgREST's own row count
   (Content-Range), so a copy that came back short is caught, not stored as complete. If the day's
   copy is still not complete on the last step, one email goes to the owner.

   Keys:  db/<day>/t/<table>/<page>.json   rows, as PostgREST returns them
          db/<day>/auth/<page>.json        auth users, as the admin API returns them
          db/<day>/manifest.json           every table's row count and pages, when complete
          db/latest                        the last complete day
   The restore check (.github/workflows/db-backup.yml) downloads the latest day weekly and
   proves every page parses and every count matches. */
import { timedFetch } from './store.js';

export const BACKUP_CRON = '*/20 10-12 * * *';
const PAGE = 1000;
const TTL = 35 * 24 * 3600;
const BUDGET = 40;                       // outbound requests per run, under the free plan's 50

export function backupDay(ms) { return new Date(ms).toISOString().slice(0, 10); }

/* "0-999/12691" -> { from: 0, to: 999, total: 12691 }; "* /0" (empty) -> total 0. */
export function contentRange(h) {
  const m = /^(?:(\d+)-(\d+)|\*)\/(\d+)$/.exec(String(h || '').trim());
  if (!m) return null;
  return { from: m[1] == null ? null : +m[1], to: m[2] == null ? null : +m[2], total: +m[3] };
}

function headers(env, extra) {
  return { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, ...extra };
}

async function listTables(env) {
  const r = await timedFetch(`${env.SUPABASE_URL}/rest/v1/`, { headers: headers(env, { Accept: 'application/openapi+json' }) });
  if (!r.ok) throw new Error('table list ' + r.status);
  const spec = await r.json();
  const names = Object.keys((spec && spec.definitions) || {}).filter((n) => /^[a-z0-9_]+$/.test(n)).sort();
  if (!names.length) throw new Error('table list empty');
  return names;
}

async function sendAlert(env, day, why) {
  if (!env.RESEND_API_KEY) return;
  await timedFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.REMINDER_FROM || 'LevlPrep <reminders@levlprep.com>',
      to: [env.BACKUP_ALERT_TO || 'hello@levlprep.com'],
      subject: `LevlPrep backup for ${day} did not finish`,
      text: `The nightly database backup for ${day} did not complete: ${why}\n\n` +
        'The previous days are still stored. Ask Claude to look at docs/backups.md and the Worker logs.',
    }),
  }).catch(() => {});
}

/* One step of the day's backup. now: ms. Returns a small summary for the log. */
export async function runBackup(env, now = Date.now()) {
  if (!env.BACKUPS || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return { skipped: 'not configured' };
  const day = backupDay(now);
  const stateKey = `db/${day}/state`;
  let state = await env.BACKUPS.get(stateKey, 'json');
  if (state && state.done) return { day, done: true };
  let used = 0;
  const put = (key, value) => env.BACKUPS.put(key, value, { expirationTtl: TTL });
  try {
    if (!state) { state = { day, tables: await listTables(env), i: 0, page: 0, auth: 0, authDone: false, results: {}, started: new Date(now).toISOString() }; used++; }
    while (used < BUDGET && state.i < state.tables.length) {
      const t = state.tables[state.i];
      const from = state.page * PAGE;
      const r = await timedFetch(`${env.SUPABASE_URL}/rest/v1/${t}?select=*`, {
        headers: headers(env, { Accept: 'application/json', Prefer: 'count=exact', 'Range-Unit': 'items', Range: `${from}-${from + PAGE - 1}` }),
      }, 30000);
      used++;
      if (r.status !== 200 && r.status !== 206) throw new Error(`${t} page ${state.page}: ${r.status}`);
      const cr = contentRange(r.headers.get('Content-Range'));
      if (!cr) throw new Error(`${t}: no row count`);
      const body = await r.arrayBuffer();
      await put(`db/${day}/t/${t}/${state.page}.json`, body);
      const res = state.results[t] || (state.results[t] = { rows: cr.total, pages: 0, bytes: 0 });
      res.rows = cr.total; res.pages = state.page + 1; res.bytes += body.byteLength;
      if (cr.total === 0 || cr.to == null || cr.to + 1 >= cr.total) { state.i++; state.page = 0; }
      else if (cr.to !== from + PAGE - 1) throw new Error(`${t}: page ${state.page} came back short (${cr.from}-${cr.to})`);
      else state.page++;
    }
    while (used < BUDGET && state.i >= state.tables.length && !state.authDone) {
      const p = state.auth + 1;
      const r = await timedFetch(`${env.SUPABASE_URL}/auth/v1/admin/users?page=${p}&per_page=${PAGE}`, { headers: headers(env) }, 30000);
      used++;
      if (!r.ok) throw new Error('auth users ' + r.status);
      const total = +(r.headers.get('x-total-count') || 0);
      const body = await r.arrayBuffer();
      await put(`db/${day}/auth/${state.auth}.json`, body);
      state.auth++;
      state.results['auth.users'] = { rows: total, pages: state.auth, bytes: ((state.results['auth.users'] || {}).bytes || 0) + body.byteLength };
      if (state.auth * PAGE >= total) state.authDone = true;
    }
    if (state.i >= state.tables.length && state.authDone) {
      state.done = true;
      state.finished = new Date(now).toISOString();
      const rows = Object.values(state.results).reduce((a, x) => a + x.rows, 0);
      await put(`db/${day}/manifest.json`, JSON.stringify({ day, finished: state.finished, tables: state.results }));
      await env.BACKUPS.put('db/latest', JSON.stringify({ day, tables: Object.keys(state.results).length, rows }));
    }
    delete state.lastError;
  } catch (err) {
    state = state || { day };
    state.lastError = String(err && err.message || err);
  }
  await put(stateKey, JSON.stringify(state));
  // The last step of the window (12:40 UTC) and still not complete: tell the owner once.
  const d = new Date(now);
  if (!state.done && d.getUTCHours() === 12 && d.getUTCMinutes() >= 40) await sendAlert(env, day, state.lastError || 'ran out of steps');
  return { day, done: !!state.done, table: state.i, of: (state.tables || []).length, used, error: state.lastError || null };
}
