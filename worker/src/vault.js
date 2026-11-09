/* The Premium vault (docs/premium-vault.md). The deploy keeps every Premium
   lesson page off the public site and ships the original here, as this
   Worker's own static assets (binding VAULT, run_worker_first, so no request
   reaches them except through this code). The public page is a stub
   (assets/vault.js) that asks:

     GET /vault?p=bio/lessons/biotechnology.html   Authorization: Bearer <Supabase session>

   200 with the page when the signed-in user holds a live pass for that page's
   course, by the same rule the site uses (my_premium(), run as the user, so
   the rule exists once, in SQL). 401 without a valid session, 403 without a
   pass, 404 for a path that is not in the vault. Never cached outside the
   reader's own browser. */
import { sessionUser } from './premium.js';

const CACHE_MS = 2 * 60 * 1000;
const sessions = new Map();     // token -> { at, user, courses }
let vaultIndex = null;          // path -> course, from the deploy's _index.json

export function vaultPath(raw) {
  const p = String(raw || '').replace(/^\/+/, '');
  if (!p || p.length > 200 || !/^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\.html$/.test(p)) return null;
  return p;
}

async function loadIndex(env) {
  if (vaultIndex) return vaultIndex;
  const r = await env.VAULT.fetch(new Request('https://vault.internal/_index.json'));
  if (!r.ok) throw new Error('vault index missing: ' + r.status);
  vaultIndex = await r.json();
  return vaultIndex;
}

async function coursesFor(env, token) {
  const hit = sessions.get(token);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;
  const user = await sessionUser(env, token);
  let courses = null;
  if (user) {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/my_premium`, {
      method: 'POST',
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) throw new Error('my_premium ' + r.status);
    const rows = await r.json();
    courses = new Set((Array.isArray(rows) ? rows : []).filter((x) => x && x.course && Date.parse(x.expires_at) > Date.now()).map((x) => x.course));
  }
  const out = { at: Date.now(), user, courses };
  if (sessions.size > 500) sessions.clear();
  sessions.set(token, out);
  return out;
}

/* Returns a Response. headers: the CORS headers index.js computed. */
export async function vaultRoute(request, env, headers, limit) {
  const base = { ...headers, 'Cache-Control': 'private, no-store', Vary: 'Origin, Authorization' };
  const json = (body, status) => new Response(JSON.stringify(body), { status, headers: { ...base, 'Content-Type': 'application/json' } });
  if (!env.VAULT) return json({ error: 'Vault not deployed' }, 503);

  const p = vaultPath(new URL(request.url).searchParams.get('p'));
  if (!p) return json({ error: 'Bad path' }, 400);
  let index;
  try { index = await loadIndex(env); } catch (err) { console.log('vault', String(err)); return json({ error: 'Vault unavailable' }, 503); }
  const course = index[p];
  if (!course) return json({ error: 'Not in the vault' }, 404);

  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Sign in first.', course }, 401);
  let who;
  try { who = await coursesFor(env, token); } catch (err) { console.log('vault', String(err)); return json({ error: 'Could not check your pass. Try again.' }, 503); }
  if (!who.user) return json({ error: 'Sign in again.', course }, 401);
  // Per account, so one pass cannot be used to pull the whole vault in a minute.
  if (limit && (await limit(`vault:${who.user.id}`))) return json({ error: 'Too many pages at once. Wait a minute.' }, 429);
  if (!who.courses.has(course)) return json({ error: 'This lesson is part of Premium.', course }, 403);

  const page = await env.VAULT.fetch(new Request('https://vault.internal/' + p));
  if (!page.ok) return json({ error: 'Not in the vault' }, 404);
  return new Response(page.body, { status: 200, headers: { ...base, 'Content-Type': 'text/html; charset=utf-8' } });
}
