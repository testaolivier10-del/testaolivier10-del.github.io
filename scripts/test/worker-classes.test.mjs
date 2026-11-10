/* Teacher-class integrations in the Worker (worker/src/class-*.js, docs/teacher-classes.md stream C):
   reminder emails, the stop link, family report links, quote requests, the teacher's AI first pass on free
   responses, Google Classroom and LTI 1.3. Everything outside the Worker is faked: Supabase (auth, a small
   PostgREST and the 2026-11d and 2026-11f functions, modelled on the SQL that was run against PGlite), Resend, Google,
   an LMS with its own RSA key, and the Anthropic API. No test reaches a real service. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import worker from '../../worker/src/index.js';
import { clsSign, clsVerify, clsEncrypt, clsDecrypt, clsLine } from '../../worker/src/class-common.js';
import { reminderEmail, quoteFields } from '../../worker/src/class-mail.js';
import { gcCourseWork, cleanGrades, gcAnnouncement, GC_SCOPES } from '../../worker/src/class-google.js';
import { ltiVerifyJwt, ltiClaimProblem, ltiScoresUrl, ltiCanvasConfig, ltiConcerns } from '../../worker/src/class-lti.js';
import { CLASS_FRQ_PASSED_MODELS } from '../../worker/src/class-frq.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const API = 'https://api.levlprep.com';
const SITE = 'https://levlprep.com';
const T = '11111111-1111-4111-8111-111111111111';   // teacher
const S1 = '22222222-2222-4222-8222-222222222222';  // student
const S2 = '33333333-3333-4333-8333-333333333333';  // student, stopped reminders
const S3 = '44444444-4444-4444-8444-444444444444';  // not in the class
const X = '55555555-5555-4555-8555-555555555555';   // another teacher
const C = '66666666-6666-4666-8666-666666666666';
const A1 = '77777777-7777-4777-8777-777777777777';  // required practice
const AF = '88888888-8888-4888-8888-888888888888';  // frq
const AO = '99999999-9999-4999-8999-999999999999';  // optional
const CO = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';   // co-teacher of C
const USERS = { tok_t: { id: T, email: 'teacher@school.org' }, tok_s1: { id: S1, email: 's1@school.org' }, tok_x: { id: X, email: 'x@school.org' }, tok_co: { id: CO, email: 'co@school.org' } };

/* ------------------------------------------------------------ a tiny PostgREST */

function filters(search) {
  const out = [];
  for (const [k, v] of new URLSearchParams(search)) {
    if (['select', 'limit', 'on_conflict', 'order'].includes(k)) continue;
    const i = v.indexOf('.');
    out.push({ col: k, op: v.slice(0, i), val: v.slice(i + 1) });
  }
  return out;
}
function match(row, fs) {
  return fs.every(({ col, op, val }) => {
    const r = row[col];
    if (op === 'eq') return String(r) === val;
    if (op === 'lt') return Date.parse(r) < Date.parse(val);
    if (op === 'gt') return Date.parse(r) > Date.parse(val);
    if (op === 'is') return val === 'null' ? r == null : true;
    throw new Error(`op ${op}`);
  });
}
const PK = {
  class_oauth: ['teacher_id', 'provider'], class_ext_links: ['class_id', 'provider', 'external_id'],
  class_ext_assignments: ['assignment_id', 'provider', 'external_id'], class_ext_members: ['class_id', 'student_id', 'provider'],
  lti_platforms: ['issuer', 'client_id'], lti_nonces: ['nonce'], class_report_links: ['token_hash'],
};

function world(opts = {}) {
  const db = {
    classes: [{ id: C, teacher_id: T, name: 'Bio P3', course: 'apbio', code: 'K7QM4D', archived: false }],
    class_members: [{ class_id: C, student_id: S1, name: 'Sam Lee' }, { class_id: C, student_id: S2, name: 'Ana Ruiz' }],
    class_assignments: [
      { id: A1, class_id: C, kind: 'practice', title: 'Cell size practice', spec: { topics: ['cell-size'] }, due_at: '2026-11-10T23:59:00Z', required: true, students: null },
      { id: AF, class_id: C, kind: 'frq', title: 'Agar FRQ', spec: { frq: 'frq-agar-shape' }, due_at: null, required: true, students: null },
      { id: AO, class_id: C, kind: 'practice', title: 'Optional', spec: {}, due_at: null, required: false, students: null },
    ],
    teacher_profiles: [{ user_id: T, display_name: 'Ms. Rivera' }, { user_id: CO, display_name: 'Mr. Okafor' }],
    class_coteachers: [{ class_id: C, user_id: CO }],
    class_oauth: [], class_ext_links: [], class_ext_assignments: [], class_ext_members: [], lti_platforms: [], lti_nonces: [],
    // auth.identities as Supabase keeps them: S1 signed in with Google (sub g1), S2 with an emailed code.
    identities: [{ user_id: S1, provider: 'google', provider_id: 'g1', identity_data: { sub: 'g1' } }, { user_id: S2, provider: 'email', provider_id: S2, identity_data: {} }],
    class_report_links: [], class_quote_requests: [], class_frq_work: [{ assignment_id: AF, student_id: S1, answers: opts.frqAnswers || { a: 'Shape has no effect on the percentage of the block that turns clear.' } }],
  };
  const st = { mails: [], rpc: [], optout: new Set([S2]), mailTaken: [], google: [], lms: [], claude: 0, gradeTaken: 0, givenBack: 0, ...opts.state };
  const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(typeof url === 'string' ? url : url.url);
    const method = (init.method || 'GET').toUpperCase();
    const body = init.body;
    if (u.host === 'db.test' && u.pathname === '/auth/v1/user') {
      const who = USERS[(init.headers.Authorization || '').replace('Bearer ', '')];
      return who ? json(who) : json({}, 401);
    }
    if (u.host === 'db.test' && u.pathname.startsWith('/rest/v1/rpc/')) {
      const name = u.pathname.slice('/rest/v1/rpc/'.length);
      const a = JSON.parse(body || '{}');
      st.rpc.push({ name, a });
      if (name === 'class_member_emails') {
        return json(db.class_members.filter((m) => m.class_id === a.p_class).map((m) => ({ id: m.student_id, name: m.name, email: `${m.student_id === S1 ? 's1' : 's2'}@school.org`, optout: st.optout.has(m.student_id) })));
      }
      if (name === 'class_google_matches') {
        // As the SQL: members of the class whose Google identity (provider_id or sub) is one of p_users.
        const want = new Set(a.p_users || []);
        if (!want.size || want.size > 2000) return json([]);
        return json(db.class_members.filter((m) => m.class_id === a.p_class).flatMap((m) => {
          const i = db.identities.find((x) => x.user_id === m.student_id && x.provider === 'google' && (want.has(x.provider_id) || want.has(x.identity_data.sub)));
          return i ? [{ id: m.student_id, name: m.name, google: want.has(i.provider_id) ? i.provider_id : i.identity_data.sub }] : [];
        }));
      }
      if (name === 'class_announce_take') {
        const l = db.class_ext_links.find((x) => x.class_id === a.p_class && x.provider === 'google');
        if (!l || (l.announced_at && Date.parse(l.announced_at) > Date.now() - 10 * 60 * 1000)) return json(false);
        l.announced_at = new Date().toISOString();
        return json(true);
      }
      if (name === 'class_mail_take') {
        if (opts.mailLimit != null && st.mailTaken.length >= opts.mailLimit) return json(false);
        st.mailTaken.push(a); return json(true);
      }
      if (name === 'class_email_stop') { st.optout.add(a.p_student); return json(true); }
      if (name === 'class_email_stop_addr') { st.optout.add(a.p_hash); return json(true); }
      if (name === 'class_purge') return new Response(null, { status: 204 });
      if (name === 'class_report_get') {
        const l = db.class_report_links.find((r) => r.token_hash === a.p_hash && Date.parse(r.expires_at) > Date.now());
        return json(l ? { student: 'Sam Lee', class: { name: 'Bio P3', course: 'apbio' }, assignments: [], summary: null } : null);
      }
      if (name === 'frq_grade_take') { st.gradeTaken++; return json(st.gradeTaken > (opts.gradeCap ?? 99) ? -1 : 5); }
      if (name === 'frq_grade_give_back') { st.givenBack++; return json(null); }
      if (name === 'count_frq_grade') return new Response(null, { status: 204 });
      return json({ message: 'no rpc' }, 404);
    }
    if (u.host === 'db.test' && u.pathname.startsWith('/rest/v1/')) {
      const table = u.pathname.slice('/rest/v1/'.length);
      const rows = db[table];
      if (!rows) return json({ message: `no table ${table}` }, 404);
      const fs = filters(u.search);
      if (method === 'GET') {
        const lim = Number(new URLSearchParams(u.search).get('limit')) || 1e9;
        return json(rows.filter((r) => match(r, fs)).slice(0, lim));
      }
      if (method === 'PATCH') { const patch = JSON.parse(body); rows.filter((r) => match(r, fs)).forEach((r) => Object.assign(r, patch)); return new Response(null, { status: 204 }); }
      if (method === 'DELETE') { db[table] = rows.filter((r) => !match(r, fs)); return new Response(null, { status: 204 }); }
      if (method === 'POST') {
        const merge = /merge-duplicates/.test((init.headers && init.headers.Prefer) || '');
        for (const r of [].concat(JSON.parse(body))) {
          const key = PK[table];
          const i = key ? rows.findIndex((x) => key.every((k) => x[k] === r[k])) : -1;
          if (i >= 0 && !merge) return json({ message: 'duplicate' }, 409);
          if (i >= 0) rows[i] = { ...rows[i], ...r }; else rows.push({ created_at: new Date().toISOString(), id: r.id || crypto.randomUUID(), ...r });
        }
        return new Response(null, { status: 201 });
      }
    }
    if (u.host === 'api.resend.com') { st.mails.push(JSON.parse(body)); return json({ id: 'm1' }); }
    if (opts.fetch) { const r = await opts.fetch(u, method, body, init, st); if (r) return r; }
    if (u.host === 'levlprep.com' && u.pathname === '/bio/assets/frq/frq-agar-shape.json') return new Response(readFileSync('bio/assets/frq/frq-agar-shape.json', 'utf8'), { status: 200 });
    return json({ error: `unexpected ${u.href}` }, 599);
  };
  const env = {
    SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_KEY: 'svc', CLASS_SECRET: 's'.repeat(40), RESEND_API_KEY: 're_test',
    ...opts.env,
  };
  return { db, st, env };
}

function post(path, body, token = 'tok_t', origin = SITE) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  return new Request(API + path, { method: 'POST', headers, body: JSON.stringify(body || {}) });
}
async function call(w, path, body, token, origin) {
  const res = await worker.fetch(post(path, body, token, origin), w.env, {});
  return { status: res.status, body: await res.json() };
}

/* ------------------------------------------------------------ shared pieces */

test('signed tokens: kind, expiry and tampering; encryption round trip under the secret only', async () => {
  const env = { CLASS_SECRET: 'k'.repeat(40) };
  const t = await clsSign(env, 'gstate', { u: T }, 60);
  assert.deepEqual(await clsVerify(env, 'gstate', t), { u: T });
  assert.equal(await clsVerify(env, 'stop', t), null, 'a token for one purpose is refused for another');
  assert.equal(await clsVerify(env, 'gstate', t, Date.now() + 61000), null, 'expired');
  assert.equal(await clsVerify(env, 'gstate', t.slice(0, -2) + (t.endsWith('AA') ? 'BB' : 'AA')), null, 'tampered');
  assert.equal(await clsVerify({ CLASS_SECRET: 'z'.repeat(40) }, 'gstate', t), null, 'other secret');
  const blob = await clsEncrypt(env, '1//refresh-token');
  assert.ok(!blob.includes('refresh'));
  assert.equal(await clsDecrypt(env, blob), '1//refresh-token');
  assert.equal(await clsDecrypt({ CLASS_SECRET: 'z'.repeat(40) }, blob), null);
  assert.equal(clsLine('see https://evil.example/x now\nplease', 100), 'see now please', 'no links, one line');
});

/* ------------------------------------------------------------ reminders */

test('reminders: the site only, a session, the class owner, members only; no addresses go back to the page', async () => {
  const w = world();
  assert.equal((await call(w, '/class/remind', { class: C, students: [S1] }, 'tok_t', null)).status, 403, 'no Origin');
  assert.equal((await call(w, '/class/remind', { class: C, students: [S1] }, null)).status, 401);
  assert.equal((await call(w, '/class/remind', { class: C, students: [S1] }, 'tok_x')).status, 404, 'not their class');
  const r = await call(w, '/class/remind', { class: C, assignment: A1, students: [S1, S2, S3], note: 'You can do it! https://spam.example', tz: 'America/Chicago' });
  assert.equal(r.status, 200);
  assert.equal(r.body.sent, 1);
  assert.deepEqual(r.body.skipped.map((s) => s.why).sort(), ['not-in-class', 'stopped']);
  assert.doesNotMatch(JSON.stringify(r.body), /@/, 'the teacher never sees an address');
  assert.equal(w.st.mails.length, 1);
  const m = w.st.mails[0];
  assert.deepEqual(m.to, ['s1@school.org']);
  assert.equal(m.html, undefined, 'plain text only');
  assert.match(m.subject, /Ms\. Rivera: Cell size practice/);
  assert.match(m.text, /Hi Sam,/);
  assert.match(m.text, /"You can do it!"/);
  assert.doesNotMatch(m.text, /spam\.example/, 'a teacher note cannot carry a link');
  assert.match(m.text, new RegExp(`${SITE}/bio/\\?ref=class-remind`));
  assert.match(m.text, /never sends these on its own/);
  assert.match(m.headers['List-Unsubscribe'], /\/class\/email\/stop\?s=/);
  assert.equal(w.st.mailTaken[0].p_kind, 'remind');
});

test('reminders: the SQL limit is honoured, too many students refused, unset Resend says so', async () => {
  const w = world({ mailLimit: 0 });
  const r = await call(w, '/class/remind', { class: C, students: [S1] });
  assert.equal(r.body.sent, 0);
  assert.equal(r.body.skipped[0].why, 'limit');
  assert.equal(w.st.mails.length, 0);
  const many = Array.from({ length: 61 }, (_, i) => `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, '0')}`);
  assert.equal((await call(world(), '/class/remind', { class: C, students: many })).status, 400);
  assert.equal((await call(world({ env: { RESEND_API_KEY: '' } }), '/class/remind', { class: C, students: [S1] })).status, 503);
});

test('reminder text: due in the future, past due, no assignment', () => {
  const base = { student: 'Sam Lee', teacher: 'Ms. Rivera', className: 'Bio P3', course: 'apbio', link: 'L', stop: 'S', tz: 'UTC', now: Date.parse('2026-11-05T00:00:00Z') };
  assert.match(reminderEmail({ ...base, assignment: { title: 'X', due_at: '2026-11-10T12:00:00Z' } }).text, /It is due Tuesday, November 10\./);
  assert.match(reminderEmail({ ...base, assignment: { title: 'X', due_at: '2026-11-01T12:00:00Z' } }).text, /It was due Sunday, November 1, and it still counts/);
  assert.match(reminderEmail(base).text, /about your work in Bio P3 \(AP® Biology\)/);
});

test('stop link: GET only asks, POST stops, a forged link is refused', async () => {
  const w = world();
  const tok = await clsSign(w.env, 'stop', { u: S1 }, null);
  const get = await worker.fetch(new Request(`${API}/class/email/stop?s=${encodeURIComponent(tok)}`), w.env, {});
  assert.equal(get.status, 200);
  assert.match(await get.text(), /<form method="post"/);
  assert.equal(w.st.optout.has(S1), false, 'a mail scanner following the link changes nothing');
  const postRes = await worker.fetch(new Request(`${API}/class/email/stop?s=${encodeURIComponent(tok)}`, { method: 'POST' }), w.env, {});
  assert.equal(postRes.status, 200);
  assert.ok(w.st.optout.has(S1));
  assert.match(postRes.headers.get('Content-Security-Policy'), /default-src 'none'/);
  const forged = await clsSign({ CLASS_SECRET: 'q'.repeat(40) }, 'stop', { u: S1 }, null);
  assert.equal((await worker.fetch(new Request(`${API}/class/email/stop?s=${encodeURIComponent(forged)}`, { method: 'POST' }), w.env, {})).status, 400);
});

/* ------------------------------------------------------------ family report links */

test('report links: teacher or the student, stored as a hash, read with the token, revocable', async () => {
  const w = world();
  assert.equal((await call(w, '/class/report-link', { class: C, student: S1 }, 'tok_x')).status, 404, 'another teacher');
  assert.equal((await call(w, '/class/report-link', { class: C, student: S3 })).status, 404, 'not a member');
  const r = await call(w, '/class/report-link', { class: C, student: S1, days: 90 });
  assert.equal(r.status, 200);
  assert.equal(r.body.days, 30, 'capped at 30 days');
  const token = r.body.url.split('#t=')[1];
  assert.ok(r.body.url.startsWith(`${SITE}/teach/report.html#t=`), 'the token is in the fragment');
  assert.equal(w.db.class_report_links.length, 1);
  assert.notEqual(w.db.class_report_links[0].token_hash, token, 'only a hash is stored');
  assert.match(w.db.class_report_links[0].token_hash, /^[0-9a-f]{64}$/);
  const own = await call(w, '/class/report-link', { class: C, student: S1 }, 'tok_s1');
  assert.equal(own.status, 200, 'a student can share their own');
  const read = await call(w, '/class/report', { t: token }, null);
  assert.equal(read.status, 200);
  assert.equal(read.body.student, 'Sam Lee');
  assert.equal((await call(w, '/class/report', { t: 'x'.repeat(30) }, null)).status, 404);
  assert.equal((await call(w, '/class/report-link/revoke', { class: C, student: S1 })).status, 200);
  assert.equal(w.db.class_report_links.length, 0);
  assert.equal((await call(w, '/class/report', { t: token }, null)).status, 404);
});

/* ------------------------------------------------------------ quotes */

test('quote requests: the receipt goes to the signed-in account only, never to a typed address', async () => {
  const w = world();
  const r = await call(w, '/class/quote', { name: 'Dana', school: 'Lincoln evil.example', students: 5, email: 'victim@elsewhere.org', notes: 'see https://x.example and spam.com' });
  assert.equal(r.status, 200);
  assert.ok(w.st.mails.every((m) => !m.to.includes('victim@elsewhere.org')), 'nobody typed in is emailed');
  assert.deepEqual(w.st.mails.map((m) => m.to[0]), ['hello@levlprep.com', 'teacher@school.org']);
  assert.equal(w.st.mails[0].reply_to, 'teacher@school.org');
  assert.doesNotMatch(w.st.mails[0].text + w.st.mails[0].subject, /evil\.example|x\.example|spam\.com/);
});

test('quote requests: signed in, stored, owner emailed with reply-to, a receipt, limited per day', async () => {
  const w = world();
  assert.equal((await call(w, '/class/quote', { name: 'A', school: 'B', students: 30 }, null)).status, 401);
  assert.equal((await call(w, '/class/quote', { name: 'A', school: 'B' })).status, 400, 'needs a student count');
  const r = await call(w, '/class/quote', { kind: 'po', name: 'Dana Fox', school: 'Lincoln High', students: '120', po_number: 'PO-7', notes: 'Line 1\nLine 2', bogus: 'x' });
  assert.equal(r.status, 200);
  assert.equal(w.db.class_quote_requests.length, 1);
  assert.equal(w.db.class_quote_requests[0].data.bogus, undefined, 'only known fields');
  const [owner, receipt] = w.st.mails;
  assert.deepEqual(owner.to, ['hello@levlprep.com']);
  assert.equal(owner.reply_to, 'teacher@school.org');
  assert.match(owner.subject, /Purchase order request: Lincoln High \(120 students\)/);
  assert.match(owner.text, /Polar invoices paid orders only/);
  assert.deepEqual(receipt.to, ['teacher@school.org']);
  assert.match(receipt.text, /Nothing has been charged/);
  await call(w, '/class/quote', { name: 'A', school: 'B', students: 3 });
  await call(w, '/class/quote', { name: 'A', school: 'B', students: 3 });
  assert.equal((await call(w, '/class/quote', { name: 'A', school: 'B', students: 3 })).status, 429);
  assert.equal(quoteFields({ notes: 'a\u0000b' }).notes, 'a b');
  assert.equal(quoteFields({ notes: 'Call me\nor see evil.example/pay or bit.ly/x' }).notes, 'Call me\nor see or');
  assert.equal(quoteFields({ email: 'not an email' }).email, undefined);
});

/* ------------------------------------------------------------ teacher FRQ first pass */

const F = JSON.parse(readFileSync('bio/assets/frq/frq-agar-shape.json', 'utf8'));
function claudeOk(answers) {
  const grade = { parts: F.parts.map((p) => ({ label: p.label, points: p.rubric.map(() => ({ earned: p.label === 'a', quote: p.label === 'a' ? answers.a.slice(0, 30) : '', reason: 'r' })) })), summary: 'ok' };
  return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(grade) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }), { status: 200 });
}

test('FRQ first pass: off unless FRQ_GRADER is on, a passed model and the key; the teacher\'s own class only', async () => {
  const anth = (u, m, b, i, st) => { if (u.host === 'api.anthropic.com') { st.claude++; return claudeOk({ a: 'Shape has no effect on the percentage of the block that turns clear.' }); } return null; };
  const on = { FRQ_GRADER: 'on', ANTHROPIC_API_KEY: 'k', __gradeCache: null };
  assert.equal((await call(world({ fetch: anth }), '/class/frq/ai', { class: C, assignment: AF, student: S1 })).status, 404, 'off by default');
  assert.equal((await call(world({ fetch: anth, env: { ...on, FRQ_GRADER: 'owner' } }), '/class/frq/ai', { class: C, assignment: AF, student: S1 })).status, 404, 'owner mode: not the owner');
  assert.equal((await call(world({ fetch: anth, env: { ...on, FRQ_GRADER_MODEL: 'claude-sonnet-5-5' } }), '/class/frq/ai', { class: C, assignment: AF, student: S1 })).status, 404, 'a model that has not passed the launch rule');
  assert.deepEqual(CLASS_FRQ_PASSED_MODELS, ['claude-haiku-5-5']);
  assert.match(readFileSync('docs/frq-grader.md', 'utf8'), /\| claude-haiku-5-5 \| [^|]+\| [^|]+\| [^|]+\| [^|]+\| [^|]+\| [^|]+\| \*\*PASS/, 'the passed list matches the Results table');
  const w = world({ fetch: anth, env: on });
  assert.equal((await call(w, '/class/frq/ai', { class: C, assignment: AF, student: S1 }, 'tok_x')).status, 404, 'another teacher');
  assert.equal((await call(w, '/class/frq/ai', { class: C, assignment: A1, student: S1 })).status, 404, 'not a free response');
  assert.equal((await call(w, '/class/frq/ai', { class: C, assignment: AF, student: S2 })).status, 404, 'nothing sent yet');
  const r = await call(w, '/class/frq/ai', { class: C, assignment: AF, student: S1 });
  assert.equal(r.status, 200);
  assert.equal(r.body.parts.length, F.parts.length);
  assert.equal(r.body.parts[0].points[0].earned, true);
  assert.equal(w.st.claude, 1);
  assert.equal(w.st.gradeTaken, 1);
  assert.equal(w.db.class_frq_work[0].score, undefined, 'a suggestion only: nothing is saved');
});

test('FRQ first pass: Claude down gives the count back; the daily cap answers 429', async () => {
  const down = (u) => (u.host === 'api.anthropic.com' ? new Response('{"error":{"type":"overloaded_error"}}', { status: 529 }) : null);
  const w = world({ fetch: down, env: { FRQ_GRADER: 'on', ANTHROPIC_API_KEY: 'k', __gradeCache: null } });
  const r = await call(w, '/class/frq/ai', { class: C, assignment: AF, student: S1 });
  assert.equal(r.status, 503);
  assert.equal(w.st.givenBack, 1);
  const capped = world({ gradeCap: 0, env: { FRQ_GRADER: 'on', ANTHROPIC_API_KEY: 'k', __gradeCache: null } });
  assert.equal((await call(capped, '/class/frq/ai', { class: C, assignment: AF, student: S1 })).status, 429);
});

/* ------------------------------------------------------------ Google Classroom */

const G_ON = { CLASS_GOOGLE: 'on', GOOGLE_CLIENT_ID: 'gid', GOOGLE_CLIENT_SECRET: 'gsecret' };
function googleFake(opts = {}) {
  return async (u, method, body, init, st) => {
    if (u.host === 'oauth2.googleapis.com' && u.pathname === '/token') {
      const p = new URLSearchParams(body);
      st.google.push({ token: p.get('grant_type') });
      if (p.get('grant_type') === 'authorization_code') {
        return new Response(JSON.stringify({ access_token: 'at', refresh_token: opts.noRefresh ? undefined : '1//rt', id_token: `x.${Buffer.from(JSON.stringify({ email: 'teacher@school.org' })).toString('base64url')}.y`, scope: opts.scope || 'openid email https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.coursework.students https://www.googleapis.com/auth/classroom.announcements' }), { status: 200 });
      }
      assert.equal(p.get('refresh_token'), '1//rt', 'the stored token decrypts to the one Google gave');
      return new Response(JSON.stringify({ access_token: 'at', expires_in: 3600 }), { status: 200 });
    }
    if (u.host === 'classroom.googleapis.com') {
      st.google.push({ method, path: u.pathname, search: u.search, body: body ? JSON.parse(body) : null });
      assert.equal(init.headers.Authorization, 'Bearer at');
      if (u.pathname === '/v1/courses') return new Response(JSON.stringify({ courses: [{ id: '501', name: 'AP Bio 3rd' }] }), { status: 200 });
      if (u.pathname === '/v1/courses/501') return new Response(JSON.stringify({ id: '501', name: 'AP Bio 3rd' }), { status: 200 });
      if (u.pathname === '/v1/courses/501/students') {
        return new Response(JSON.stringify({ students: [
          // Without classroom.profile.emails Classroom sends no emailAddress.
          { userId: 'g1', profile: { name: { fullName: 'Sam Lee', givenName: 'Sam' } } },
          { userId: 'g9', profile: { name: { fullName: 'Ana Ruiz', givenName: 'Ana' } } },
        ] }), { status: 200 });
      }
      if (u.pathname === '/v1/courses/501/announcements' && method === 'POST') {
        return opts.announceFails ? new Response('{}', { status: 500 }) : new Response(JSON.stringify({ id: 'an1', alternateLink: 'https://classroom.google.com/c/a' }), { status: 200 });
      }
      if (u.pathname === '/v1/courses/501/courseWork' && method === 'POST') return new Response(JSON.stringify({ id: '9001', alternateLink: 'https://classroom.google.com/c/x' }), { status: 200 });
      if (u.pathname === '/v1/courses/501/courseWork/9001/studentSubmissions' && method === 'GET') return new Response(JSON.stringify({ studentSubmissions: [{ id: 'sub1', userId: 'g1' }] }), { status: 200 });
      if (u.pathname === '/v1/courses/501/courseWork/9001/studentSubmissions/sub1' && method === 'PATCH') return new Response('{}', { status: 200 });
    }
    return null;
  };
}

test('Google: off without the flag and secrets; consent URL with a signed state; callback stores the token encrypted', async () => {
  assert.equal((await call(world(), '/class/google/start', { class: C })).status, 404);
  assert.deepEqual((await call(world({ env: G_ON }), '/class/google/status', { class: C })).body.on, true);
  assert.deepEqual((await call(world(), '/class/google/status', { class: C })).body, { on: false });
  const w = world({ env: G_ON, fetch: googleFake() });
  assert.equal((await call(w, '/class/google/start', { class: C }, 'tok_x')).status, 404, 'not their class');
  const r = await call(w, '/class/google/start', { class: C });
  const url = new URL(r.body.url);
  assert.equal(url.host, 'accounts.google.com');
  assert.equal(url.searchParams.get('redirect_uri'), `${API}/class/google/callback`);
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.match(url.searchParams.get('scope'), /classroom\.coursework\.students/);
  assert.doesNotMatch(url.searchParams.get('scope'), /classroom\.courses(?!\.readonly)\b|drive|gmail|profile\.emails/, 'narrow scopes only');
  assert.deepEqual(url.searchParams.get('scope').split(' '), GC_SCOPES);
  assert.deepEqual(GC_SCOPES, ['openid', 'email', ...['classroom.courses.readonly', 'classroom.rosters.readonly', 'classroom.coursework.students', 'classroom.announcements'].map((x) => `https://www.googleapis.com/auth/${x}`)], 'exactly the non-sensitive scopes in the Google project');
  const bad = await worker.fetch(new Request(`${API}/class/google/callback?code=c&state=forged.sig`), w.env, {});
  assert.equal(bad.status, 400);
  const cb = await worker.fetch(new Request(`${API}/class/google/callback?code=c&state=${encodeURIComponent(url.searchParams.get('state'))}`), w.env, {});
  assert.equal(cb.status, 302);
  const loc = new URL(cb.headers.get('Location'));
  assert.equal(loc.origin + loc.pathname, `${SITE}/teach/`);
  assert.equal(loc.hash, '#settings');
  assert.equal(loc.searchParams.get('google'), 'finish');
  assert.equal(w.db.class_oauth.length, 0, 'nothing stored until the teacher\'s own page claims it');
  const gp = loc.searchParams.get('gp');
  assert.doesNotMatch(gp, /1\/\/rt/, 'the token travels encrypted');
  assert.equal((await call(w, '/class/google/finish', { gp }, 'tok_x')).status, 403, 'another account cannot claim it (login CSRF)');
  assert.equal(w.db.class_oauth.length, 0);
  assert.equal((await call(w, '/class/google/finish', { gp })).status, 200);
  assert.equal(w.db.class_oauth.length, 1);
  assert.equal(w.db.class_oauth[0].teacher_id, T);
  assert.ok(!w.db.class_oauth[0].refresh_enc.includes('1//rt'), 'the refresh token is never stored in the clear');
  assert.equal(w.db.class_oauth[0].account_email, 'teacher@school.org');
  const short = world({ env: G_ON, fetch: googleFake({ scope: 'openid email' }) });
  const st = await clsSign(short.env, 'gstate', { u: T, c: C }, 600);
  const cb2 = await worker.fetch(new Request(`${API}/class/google/callback?code=c&state=${encodeURIComponent(st)}`), short.env, {});
  assert.match(cb2.headers.get('Location'), /google=scopes/, 'unticked boxes are caught');
  assert.equal(short.db.class_oauth.length, 0);
});

async function connected() {
  const w = world({ env: G_ON, fetch: googleFake() });
  w.db.class_oauth.push({ teacher_id: T, provider: 'google', refresh_enc: await clsEncrypt(w.env, '1//rt'), account_email: 'teacher@school.org' });
  return w;
}

test('Google: link a course, match the roster by Google sign-in id (never by name or email), post the join link', async () => {
  const w = await connected();
  assert.equal((await call(w, '/class/google/roster', { class: C })).status, 409, 'link first');
  assert.equal((await call(w, '/class/google/announce', { class: C })).status, 409, 'link first');
  assert.deepEqual((await call(w, '/class/google/courses', {})).body.courses, [{ id: '501', name: 'AP Bio 3rd', section: '' }]);
  assert.equal((await call(w, '/class/google/link', { class: C, course: '501' })).status, 200);
  const r = await call(w, '/class/google/roster', { class: C });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.matched, [{ student: S1, name: 'Sam Lee', classroom: 'Sam Lee' }]);
  // g9 has the same name as member S2, but S2 did not sign in with that Google account: no match by name.
  assert.deepEqual(r.body.missing, [{ user: 'g9', name: 'Ana Ruiz' }]);
  assert.deepEqual(r.body.notInClassroom, [{ student: S2, name: 'Ana Ruiz' }]);
  assert.deepEqual(r.body.counts, { classroom: 2, matched: 1, missing: 1 });
  assert.equal(r.body.join, `${SITE}/join.html?c=K7QM4D`);
  assert.doesNotMatch(JSON.stringify(r.body), /@|identit|provider_id/, 'no address or identity goes back to the page');
  const q = w.st.rpc.find((x) => x.name === 'class_google_matches');
  assert.deepEqual(q.a, { p_class: C, p_users: ['g1', 'g9'] });
  assert.ok(!w.st.rpc.some((x) => x.name === 'class_member_emails'), 'the roster never looks up emails');
  assert.deepEqual(w.db.class_ext_members.map((m) => [m.student_id, m.external_user]), [[S1, 'g1']]);
  assert.equal((await call(w, '/class/google/invite', { class: C, users: ['g9'] })).status, 404, 'no invite emails any more');
  // The sub in identity_data matches too (older identities).
  w.db.identities.push({ user_id: S2, provider: 'google', provider_id: 'other', identity_data: { sub: 'g9' } });
  const r2 = await call(w, '/class/google/roster', { class: C });
  assert.equal(r2.body.matched.length, 2);
  assert.deepEqual(r2.body.missing, []);

  const an = await call(w, '/class/google/announce', { class: C });
  assert.equal(an.status, 200);
  assert.equal(an.body.posted, true);
  assert.equal(an.body.join, `${SITE}/join.html?c=K7QM4D`);
  const made = w.st.google.find((g) => g.method === 'POST' && g.path === '/v1/courses/501/announcements');
  assert.match(made.body.text, /^Bio P3 on LevlPrep \(AP® Biology\)\nJoin: https:\/\/levlprep\.com\/join\.html\?c=K7QM4D\n/);
  assert.match(made.body.text, /sign in with Google/);
  assert.equal(made.body.text.split('\n').length, 3, 'name, link and one line of instructions');
  assert.equal(made.body.materials[0].link.url, `${SITE}/join.html?c=K7QM4D`);
  assert.equal(made.body.state, 'PUBLISHED');
  assert.equal(w.st.mails.length, 0, 'no email is sent');
  assert.equal(w.st.mailTaken.length, 0, 'no invite rows are written');
  const again = await call(w, '/class/google/announce', { class: C });
  assert.equal(again.status, 429, 'once per 10 minutes per class');
  assert.equal(again.body.join, `${SITE}/join.html?c=K7QM4D`, 'the copy fallback still gets the link');
  assert.equal(w.st.google.filter((g) => g.path === '/v1/courses/501/announcements').length, 1);
  w.db.class_ext_links[0].announced_at = new Date(Date.now() - 11 * 60 * 1000).toISOString();
  assert.equal((await call(w, '/class/google/announce', { class: C })).status, 200, 'allowed again after 10 minutes');
  assert.equal((await call(w, '/class/google/announce', { class: C }, 'tok_x')).status, 404, 'not their class');
  assert.equal((await call(w, '/class/google/announce', { class: C }, 'tok_co')).status, 404, 'co-teachers cannot post');
  assert.match(gcAnnouncement({}, { name: 'Chem P1', course: 'apchem', code: 'AB12CD34' }).text, /join\.html\?c=AB12CD34/);
});

test('Google: an announcement Google refuses does not use up the 10 minutes', async () => {
  const w = world({ env: G_ON, fetch: googleFake({ announceFails: true }) });
  w.db.class_oauth.push({ teacher_id: T, provider: 'google', refresh_enc: await clsEncrypt(w.env, '1//rt'), account_email: 'teacher@school.org' });
  await call(w, '/class/google/link', { class: C, course: '501' });
  const r = await call(w, '/class/google/announce', { class: C });
  assert.equal(r.status, 502);
  assert.equal(r.body.join, `${SITE}/join.html?c=K7QM4D`);
  assert.equal(w.db.class_ext_links[0].announced_at, null, 'the time is given back');
});

test('co-teachers: reminders, report links and scoring yes; Google and LMS grade passback no', async () => {
  const w = world({ env: { ...G_ON, CLASS_LTI: 'on', LTI_PRIVATE_KEY: JSON.stringify({ kty: 'RSA', d: 'x', kid: 'k', n: 'a', e: 'AQAB' }) } });
  const r = await call(w, '/class/remind', { class: C, students: [S1] }, 'tok_co');
  assert.equal(r.status, 200);
  assert.equal(r.body.sent, 1);
  assert.equal(w.st.mailTaken[0].p_teacher, CO);
  assert.equal((await call(w, '/class/report-link', { class: C, student: S1 }, 'tok_co')).status, 200);
  assert.equal((await call(w, '/class/google/start', { class: C }, 'tok_co')).status, 404);
  assert.equal((await call(w, '/class/google/grades', { class: C, assignment: A1, grades: [] }, 'tok_co')).status, 404);
  assert.equal((await call(w, '/lti/grades', { class: C, assignment: A1, grades: [] }, 'tok_co')).status, 404);
  assert.equal((await call(w, '/class/remind', { class: C, students: [S1] }, 'tok_x')).status, 404, 'a stranger still cannot');
});

test('Google: post coursework with the assignment link; grades for required work only, as Classroom points', async () => {
  const w = await connected();
  assert.equal((await call(w, '/class/google/post', { class: C, assignment: A1 })).status, 409, 'link first');
  await call(w, '/class/google/link', { class: C, course: '501' });
  const p = await call(w, '/class/google/post', { class: C, assignment: A1 });
  assert.equal(p.body.posted, true);
  const made = w.st.google.find((g) => g.method === 'POST' && g.path === '/v1/courses/501/courseWork');
  assert.equal(made.body.materials[0].link.url, `${SITE}/bio/?la=${A1}&ref=classroom`);
  assert.equal(made.body.maxPoints, 100);
  assert.deepEqual(made.body.dueDate, { year: 2026, month: 11, day: 10 });
  assert.equal((await call(w, '/class/google/post', { class: C, assignment: A1 })).body.already, true, 'posted once');
  assert.equal((await call(w, '/class/google/grades', { class: C, assignment: AO, grades: [{ student: S1, score: 1 }] })).status, 400, 'optional work');
  await call(w, '/class/google/roster', { class: C });
  const g = await call(w, '/class/google/grades', { class: C, assignment: A1, grades: [{ student: S1, score: 0.856 }, { student: S2, score: 0.5 }, { student: S3, score: 1 }, { student: S1, score: 7 }] });
  assert.equal(g.body.sent, 1);
  assert.deepEqual(g.body.skipped, [{ student: S2, why: 'not-matched' }]);
  const patch = w.st.google.find((x) => x.method === 'PATCH');
  assert.deepEqual(patch.body, { assignedGrade: 85.6, draftGrade: 85.6 });
  assert.match(patch.search, /updateMask=assignedGrade,draftGrade/);
  assert.equal(gcCourseWork({}, { course: 'apbio' }, { id: AO, title: 'Opt', required: false }).maxPoints, undefined, 'optional work is ungraded in Classroom');
  assert.equal(cleanGrades([{ student: S1, score: -1 }, { student: 'x', score: 1 }], [S1]).size, 0);
});

/* ------------------------------------------------------------ LTI 1.3 */

const ISS = 'https://canvas.instructure.com';
const LMS_JWKS = 'https://sso.canvaslms.com/api/lti/security/jwks';
async function rsa() {
  const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  return { priv: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: await crypto.subtle.exportKey('jwk', kp.publicKey) };
}
const toolKey = await rsa();
const lmsKey = await rsa();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
async function lmsSign(payload, kid = 'lms1', key = lmsKey.priv) {
  const k = await crypto.subtle.importKey('jwk', key, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const head = b64({ alg: 'RS256', typ: 'JWT', kid });
  const body = b64(payload);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${Buffer.from(sig).toString('base64url')}`;
}
const L_ON = { CLASS_LTI: 'on', LTI_PRIVATE_KEY: JSON.stringify({ ...toolKey.priv, kid: 'tool1' }) };
function lmsFake() {
  return async (u, method, body, init, st) => {
    if (u.href === LMS_JWKS) return new Response(JSON.stringify({ keys: [{ ...lmsKey.pub, kid: 'lms1' }] }), { status: 200 });
    if (u.href === 'https://school.instructure.com/login/oauth2/token') {
      const p = new URLSearchParams(body);
      st.lms.push({ token: p.get('grant_type'), scope: p.get('scope'), assertion: p.get('client_assertion') });
      return new Response(JSON.stringify({ access_token: 'lms-at' }), { status: 200 });
    }
    if (u.href.startsWith('https://school.instructure.com/api/lti/courses/1/line_items/5/scores')) {
      st.lms.push({ score: JSON.parse(body), auth: init.headers.Authorization, type: init.headers['Content-Type'] });
      return new Response('{}', { status: 200 });
    }
    return null;
  };
}
async function ltiWorld(opts = {}) {
  const w = world({ env: L_ON, fetch: lmsFake() });
  const reg = await call(w, '/lti/platforms', { issuer: ISS, client_id: '10000000000123', deployment_id: '7:abc', auth_url: 'https://sso.canvaslms.com/api/lti/authorize_redirect', token_url: 'https://school.instructure.com/login/oauth2/token', jwks_url: LMS_JWKS, label: 'Lincoln Canvas' });
  assert.equal(reg.status, 200, JSON.stringify(reg.body));
  assert.equal(w.db.lti_platforms.length, 1, 'registered');
  assert.equal(w.db.lti_platforms[0].status, 'pending');
  const mail = w.st.mails.find((m) => /LMS registration to review/.test(m.subject));
  const link = mail.text.match(/(https:\/\/api\.levlprep\.com\/lti\/activate\?t=\S+)/)[1];
  if (opts.activate !== false) {
    assert.equal((await worker.fetch(new Request(link), w.env, {})).status, 200);
    assert.equal(w.db.lti_platforms[0].status, 'pending', 'GET only shows it');
    assert.equal((await worker.fetch(new Request(link, { method: 'POST' }), w.env, {})).status, 200);
    assert.equal(w.db.lti_platforms[0].status, 'active');
  }
  w.activationMail = mail;
  return w;
}
function claims(nonce, extra = {}) {
  const s = Math.floor(Date.now() / 1000);
  return {
    iss: ISS, aud: '10000000000123', sub: 'canvas-user-42', iat: s, exp: s + 300, nonce,
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': '7:abc',
    'https://purl.imsglobal.org/spec/lti/claim/context': { id: 'ctx-1', title: 'AP Bio' },
    'https://purl.imsglobal.org/spec/lti/claim/roles': ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
    ...extra,
  };
}
async function launch(w, extra) {
  const login = await worker.fetch(new Request(`${API}/lti/login?iss=${encodeURIComponent(ISS)}&client_id=10000000000123&login_hint=h&target_link_uri=${encodeURIComponent(`${API}/lti/launch`)}`), w.env, {});
  assert.equal(login.status, 302);
  const to = new URL(login.headers.get('Location'));
  const form = new FormData();
  form.set('state', to.searchParams.get('state'));
  form.set('id_token', await lmsSign(claims(to.searchParams.get('nonce'), extra)));
  return { res: await worker.fetch(new Request(`${API}/lti/launch`, { method: 'POST', body: form }), w.env, {}), form, to };
}

test('LTI: config and JWKS are public; registering needs a session and the flag; a key belongs to who registered it', async () => {
  assert.equal((await call(world(), '/lti/platforms', { issuer: ISS })).status, 404, 'off without the flag');
  const w = await ltiWorld();
  const jwks = await (await worker.fetch(new Request(`${API}/lti/jwks`), w.env, {})).json();
  assert.equal(jwks.keys[0].kid, 'tool1');
  assert.equal(jwks.keys[0].d, undefined, 'never the private half');
  const cfg = ltiCanvasConfig(w.env);
  assert.equal(cfg.oidc_initiation_url, `${API}/lti/login`);
  assert.equal(cfg.extensions[0].settings.placements[0].message_type, 'LtiDeepLinkingRequest');
  assert.equal((await call(w, '/lti/platforms', { issuer: 'http://insecure', client_id: 'a', auth_url: 'x', token_url: 'y', jwks_url: 'z' })).status, 400);
  const other = await call(w, '/lti/platforms', { issuer: ISS, client_id: '10000000000123', auth_url: 'https://a.example', token_url: 'https://b.example', jwks_url: 'https://c.example' }, 'tok_x');
  assert.equal(other.status, 409);
  assert.equal(w.db.lti_platforms[0].auth_url, 'https://sso.canvaslms.com/api/lti/authorize_redirect', 'unchanged');
});

test('LTI: login sends a signed state with the nonce; a good launch goes to the site with a ticket; replays and bad tokens fail', async () => {
  const w = await ltiWorld();
  const unknown = await worker.fetch(new Request(`${API}/lti/login?iss=https%3A%2F%2Fother.example`), w.env, {});
  assert.equal(unknown.status, 404);
  const { res, form, to } = await launch(w, {
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/custom': { la: A1, class: C },
    'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': { lineitem: 'https://school.instructure.com/api/lti/courses/1/line_items/5', scope: [] },
  });
  assert.equal(to.searchParams.get('response_mode'), 'form_post');
  assert.equal(to.searchParams.get('redirect_uri'), `${API}/lti/launch`);
  assert.equal(res.status, 303);
  assert.match(res.headers.get('Location'), new RegExp(`^${SITE}/teach/lti\\.html#go=`));
  const replay = await worker.fetch(new Request(`${API}/lti/launch`, { method: 'POST', body: form }), w.env, {});
  assert.equal(replay.status, 400, 'a nonce works once');
  const forged = new FormData();
  forged.set('state', to.searchParams.get('state'));
  forged.set('id_token', await lmsSign(claims('other'), 'lms1', toolKey.priv));
  assert.equal((await worker.fetch(new Request(`${API}/lti/launch`, { method: 'POST', body: forged }), w.env, {})).status, 400, 'signed by a key the LMS does not publish');
  const p = { issuer: ISS, client_id: '10000000000123', deployment_ids: ['7:abc'] };
  assert.equal(ltiClaimProblem(claims('n', { aud: 'someone-else' }), p, 'n'), 'audience');
  assert.equal(ltiClaimProblem(claims('n'), p, 'm'), 'nonce');
  assert.equal(ltiClaimProblem(claims('n', { exp: 1 }), p, 'n'), 'expired');
  assert.equal(ltiClaimProblem(claims('n', { 'https://purl.imsglobal.org/spec/lti/claim/deployment_id': '9:zzz' }), p, 'n'), 'deployment');
  assert.equal(ltiClaimProblem(claims('n'), p, 'n'), null);
});

test('LTI: deep linking needs a teacher who owns the class and returns a signed LtiDeepLinkingResponse', async () => {
  const w = await ltiWorld();
  const learner = await launch(w, { 'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest' });
  assert.equal(learner.res.status, 403, 'a learner cannot add work');
  const { res } = await launch(w, {
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingRequest',
    'https://purl.imsglobal.org/spec/lti/claim/roles': ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'],
    'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings': { deep_link_return_url: 'https://school.instructure.com/courses/1/deep_linking_response', data: 'opaque' },
  });
  const ticket = decodeURIComponent(res.headers.get('Location').split('#dl=')[1]);
  assert.equal((await call(w, '/lti/deeplink', { ticket, class: C, assignment: A1 }, 'tok_x')).status, 404, 'not their class');
  const dl = await call(w, '/lti/deeplink', { ticket, class: C, assignment: A1 });
  assert.equal(dl.status, 200);
  const page = await worker.fetch(new Request(dl.body.go), w.env, {});
  const html = await page.text();
  assert.match(html, /action="https:\/\/school\.instructure\.com\/courses\/1\/deep_linking_response"/);
  assert.match(page.headers.get('Content-Security-Policy'), /form-action https:\/\/school\.instructure\.com/);
  assert.match(page.headers.get('Content-Security-Policy'), /script-src 'sha256-/);
  const jwt = html.match(/name="JWT" value="([^"]+)"/)[1];
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [{ ...toolKey.pub, kid: 'tool1' }] }), { status: 200 });
  const c = await ltiVerifyJwt(jwt, 'https://tool.test/jwks');
  assert.ok(c, 'verifies against the tool\'s public key');
  assert.equal(c.aud, ISS);
  assert.equal(c.iss, '10000000000123');
  assert.equal(c['https://purl.imsglobal.org/spec/lti/claim/message_type'], 'LtiDeepLinkingResponse');
  assert.equal(c['https://purl.imsglobal.org/spec/lti-dl/claim/data'], 'opaque');
  const item = c['https://purl.imsglobal.org/spec/lti-dl/claim/content_items'][0];
  assert.deepEqual(item.custom, { la: A1, class: C });
  assert.equal(item.lineItem.scoreMaximum, 100);
  assert.equal(w.db.class_ext_links[0].external_id, 'ctx-1');
});

test('LTI: a student binds after signing in (or is sent to join), then AGS scores go to the line item', async () => {
  const w = await ltiWorld();
  const ags = { 'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest', 'https://purl.imsglobal.org/spec/lti/claim/custom': { la: A1, class: C }, 'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': { lineitem: 'https://school.instructure.com/api/lti/courses/1/line_items/5' } };
  const { res } = await launch(w, ags);
  const ticket = decodeURIComponent(res.headers.get('Location').split('#go=')[1]);
  assert.equal((await call(w, '/lti/bind', { ticket }, 'tok_s1')).status, 403, 'no LMS course linked to this class yet');
  w.db.class_ext_links.push({ class_id: C, provider: 'lti', platform_id: w.db.lti_platforms[0].id, external_id: 'ctx-1' });
  USERS.tok_new = { id: S3, email: 'new@school.org' };
  assert.deepEqual((await call(w, '/lti/bind', { ticket }, 'tok_new')).body, { join: 'K7QM4D' }, 'not a member yet: the join code');
  const b = await call(w, '/lti/bind', { ticket }, 'tok_s1');
  assert.equal(b.body.url, `${SITE}/bio/?la=${A1}&ref=lti`);
  assert.equal((await call(w, '/lti/bind', { ticket }, 'tok_t')).body.teacher, `${SITE}/teach/?c=${C}#a/${A1}`);
  assert.equal(w.db.class_ext_members[0].external_user, 'canvas-user-42');
  assert.equal(w.db.class_ext_assignments[0].external_id, 'https://school.instructure.com/api/lti/courses/1/line_items/5');
  assert.equal((await call(w, '/lti/grades', { class: C, assignment: AO, grades: [{ student: S1, score: 1 }] })).status, 400, 'optional work');
  const g = await call(w, '/lti/grades', { class: C, assignment: A1, grades: [{ student: S1, score: 0.9 }, { student: S2, score: 0.4 }] });
  assert.equal(g.body.sent, 1);
  assert.deepEqual(g.body.skipped, [{ student: S2, why: 'not-launched' }]);
  const tok = w.st.lms.find((x) => x.token);
  assert.equal(tok.token, 'client_credentials');
  assert.equal(tok.scope, 'https://purl.imsglobal.org/spec/lti-ags/scope/score');
  const score = w.st.lms.find((x) => x.score);
  assert.equal(score.auth, 'Bearer lms-at');
  assert.equal(score.type, 'application/vnd.ims.lis.v1.score+json');
  assert.deepEqual({ ...score.score, timestamp: 0 }, { userId: 'canvas-user-42', scoreGiven: 90, scoreMaximum: 100, activityProgress: 'Completed', gradingProgress: 'FullyGraded', timestamp: 0 });
  assert.equal(ltiScoresUrl('https://x.test/api/lti/courses/1/line_items/5?type=a'), 'https://x.test/api/lti/courses/1/line_items/5/scores?type=a');
  delete USERS.tok_new;
});

test('LTI trust: a pending platform does nothing; another LMS course or a foreign line item host gets nothing', async () => {
  const pending = await ltiWorld({ activate: false });
  const login = await worker.fetch(new Request(`${API}/lti/login?iss=${encodeURIComponent(ISS)}&client_id=10000000000123&login_hint=h`), pending.env, {});
  assert.equal(login.status, 404, 'not active until the owner activates it');
  assert.match(pending.activationMail.text, /All addresses are where this LMS publishes them/);
  assert.deepEqual(ltiConcerns({ issuer: 'https://lms.evil.example', auth_url: 'https://a.example', token_url: 'https://b.example', jwks_url: 'https://c.example' }).length, 1);
  assert.match(ltiConcerns({ issuer: ISS, auth_url: 'https://evil.example/a', token_url: 'https://school.instructure.com/t', jwks_url: LMS_JWKS }).join(' '), /Auth URL host evil\.example/);
  const forgedAct = await worker.fetch(new Request(`${API}/lti/activate?t=${encodeURIComponent(await clsSign({ CLASS_SECRET: 'q'.repeat(40) }, 'lti-act', { id: pending.db.lti_platforms[0].id, v: 'x' }, 600))}`, { method: 'POST' }), pending.env, {});
  assert.equal(forgedAct.status, 400);
  assert.equal(pending.db.lti_platforms[0].status, 'pending');

  const w = await ltiWorld();
  const pid = w.db.lti_platforms[0].id;
  w.db.class_ext_links.push({ class_id: C, provider: 'lti', platform_id: pid, external_id: 'ctx-1' });
  const other = await launch(w, {
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/context': { id: 'ctx-attacker', title: 'Not this class' },
    'https://purl.imsglobal.org/spec/lti/claim/custom': { la: A1, class: C },
    'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': { lineitem: 'https://school.instructure.com/api/lti/courses/9/line_items/1' },
  });
  const t1 = decodeURIComponent(other.res.headers.get('Location').split('#go=')[1]);
  assert.equal((await call(w, '/lti/bind', { ticket: t1 }, 'tok_s1')).status, 403, 'a launch from another LMS course cannot bind');
  assert.equal(w.db.class_ext_members.length, 0);
  const foreign = await launch(w, {
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/custom': { la: A1, class: C },
    'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': { lineitem: 'https://collector.evil.example/line_items/5' },
  });
  const t2 = decodeURIComponent(foreign.res.headers.get('Location').split('#go=')[1]);
  assert.equal((await call(w, '/lti/bind', { ticket: t2 }, 'tok_s1')).status, 200);
  assert.equal(w.db.class_ext_assignments.length, 0, 'a line item off the platform host is not kept');
  w.db.class_ext_assignments.push({ assignment_id: A1, provider: 'lti', platform_id: pid, external_id: 'https://collector.evil.example/line_items/5' });
  const g = await call(w, '/lti/grades', { class: C, assignment: A1, grades: [{ student: S1, score: 1 }] });
  assert.deepEqual(g.body.skipped, [{ student: S1, why: 'lms-not-trusted' }]);
  assert.ok(!w.st.lms.some((x) => x.score), 'no score was sent anywhere');
});

test('the hourly cron runs the class housekeeping', async () => {
  const w = world();
  const waits = [];
  await worker.scheduled({ scheduledTime: Date.parse('2026-11-04T10:05:00Z') }, w.env, { waitUntil: (p) => waits.push(p) });
  await Promise.all(waits);
  assert.ok(w.st.rpc.some((r) => r.name === 'class_purge'));
});

test('the flattened Worker bundle is in step and parses', () => {
  execFileSync('node', ['scripts/build-worker.mjs', '--check'], { stdio: 'pipe' });
});
