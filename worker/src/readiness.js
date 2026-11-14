/* Readiness accuracy (docs/progress-profile.md).

   GET  /qdiff?course=nremt   { v: 1, q: { <qid>: [n, right] } } for questions with 20+ answers: the readiness
                              model's live difficulty. Anonymous tallies; cached at the edge for 6 hours.
   POST /outcome              { course, result, predicted, lo, hi, band, answers, days }: the optional "how did
                              your exam go?" answer, stored with no user, browser id or IP (exam_outcomes). */
import { sb } from './store.js';

const COURSE = /^[a-z]{2,12}$/;
const RESULTS = new Set(['pass', 'fail', 'later', '1', '2', '3', '4', '5']);
function num(v, lo, hi){ const n = Number(v); return v === null || v === undefined || v === '' || !Number.isFinite(n) ? null : Math.max(lo, Math.min(hi, n)); }

export async function qdiffRoute(request, env, headers, ctx){
  const url = new URL(request.url), course = url.searchParams.get('course') || '';
  if (!COURSE.test(course)) return new Response(JSON.stringify({ error: 'Unknown course' }), { status: 400, headers: { 'Content-Type': 'application/json', ...headers } });
  const cache = typeof caches !== 'undefined' ? caches.default : null, key = new Request('https://cache.levlprep/qdiff/' + course);
  if (cache) { const hit = await cache.match(key); if (hit) return new Response(hit.body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=21600', ...headers } }); }
  let q = {};
  try {
    const r = await sb(env, 'rpc/question_difficulty', { method: 'POST', body: JSON.stringify({ p_course: course }) });
    if (r.ok) for (const row of await r.json()) q[row.qid] = [Number(row.n), Number(row.correct)];
  } catch (e) { q = {}; }
  const body = JSON.stringify({ v: 1, q });
  if (cache) { const put = cache.put(key, new Response(body, { headers: { 'Cache-Control': 'public, max-age=21600' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put; }
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=21600', ...headers } });
}

export async function outcomeRoute(request, env){
  let b;
  try { b = await request.json(); } catch (e) { return { status: 400, body: { error: 'Bad request' } }; }
  if (!b || !COURSE.test(String(b.course || '')) || !RESULTS.has(String(b.result || ''))) return { status: 400, body: { error: 'Bad request' } };
  const row = {
    course: String(b.course), result: String(b.result),
    predicted: num(b.predicted, 0, 100), lo: num(b.lo, 0, 100), hi: num(b.hi, 0, 100),
    band: num(b.band, 1, 5) === null ? null : Math.round(num(b.band, 1, 5)),
    answers: Math.round(num(b.answers, 0, 1e6) || 0), days: num(b.days, 0, 400) === null ? null : Math.round(num(b.days, 0, 400))
  };
  const r = await sb(env, 'exam_outcomes', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  return r.ok ? { status: 200, body: { ok: true } } : { status: 502, body: { error: 'Not saved' } };
}
