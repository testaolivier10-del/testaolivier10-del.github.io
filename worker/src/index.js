/**
 * LevlPrep Ask — optional AI backend.
 *
 * The site answers questions on its own, in the browser, with no server at all.
 * This Worker is the optional upgrade: it takes the passages the browser already
 * retrieved and has a model write a direct answer from them.
 *
 * It runs on Cloudflare Workers AI, which has a free daily allowance on a free
 * account. There is no API key in the browser — the model is reached through
 * the platform binding, so nothing sensitive ships to the client. When the free
 * allowance is used up the request fails and the site silently falls back to its
 * own answers, so the page never breaks and the bill never starts.
 *
 * Deploy: see ../README.md
 */

import { runReminders, reminderText } from './reminders.js';
import { runEmailReminders, unsubscribe } from './email.js';
import { umamiProxy } from './umami.js';
import { MODELS, extractText } from './ai.js';
import { gradeRoute } from './frq-grade.js';
import { premiumCheckout, premiumWebhook, premiumRefund, premiumGuarantee, runPassEnding, reconcilePolar, bearerToken, sessionUser } from './premium.js';

// Only these origins may call the Worker. Without this, anyone could point
// their own site at your endpoint and spend your daily allowance.
const ALLOWED_ORIGINS = [
  'https://levlprep.com',
  'https://www.levlprep.com',
];
// A local copy of the site, only on a Worker that says so (a dev deploy with
// ALLOW_LOCALHOST = "true"). Production never trusts localhost: any page
// someone serves on their own machine would otherwise count as the site.
const DEV_ORIGINS = ['http://localhost:8000', 'http://127.0.0.1:8000'];

export function allowedOrigins(env) {
  return env && String(env.ALLOW_LOCALHOST) === 'true' ? ALLOWED_ORIGINS.concat(DEV_ORIGINS) : ALLOWED_ORIGINS;
}

/* The per-IP throttle (wrangler.toml, RATE_LIMITER), bucketed per route so a
   busy assistant does not lock somebody out of unsubscribing. True when this
   request is over the limit. No binding (a dashboard paste) means no limit,
   which is why deploys go through wrangler (.github/workflows/deploy-worker.yml). */
async function throttled(env, request, bucket) {
  if (!env.RATE_LIMITER) return false;
  const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
  const { success } = await env.RATE_LIMITER.limit({ key: `${bucket}:${ip}` });
  return !success;
}

/* The assistant answers signed-in students only: a Supabase session the
   Worker can verify, which needs no setup beyond what Premium already uses.
   The Origin header alone was the gate, and any script can send one.
   (Turnstile was the other option; it needs a site key and a secret the
   owner would have to create first.) Verified tokens are remembered for a
   few minutes per Worker instance, so a conversation is not one auth call
   per question. */
const SESSION_TTL_MS = 5 * 60 * 1000;
const sessionCache = new Map();
async function signedIn(env, request) {
  const token = bearerToken(request);
  if (!token) return false;
  const hit = sessionCache.get(token);
  if (hit && hit > Date.now()) return true;
  const user = await sessionUser(env, token);
  if (!user) return false;
  if (sessionCache.size > 500) sessionCache.clear();
  sessionCache.set(token, Date.now() + SESSION_TTL_MS);
  return true;
}

// The model may teach — rephrase, analogize, connect topics — but it may not
// invent the facts it teaches from. The passages are the floor, not the
// ceiling: it can go beyond them to explain, and must say so when it does.
const SHARED_RULES = [
  'You are the study assistant built into LevlPrep. You are given reference passages drawn from the course the student is currently studying.',
  '',
  'How to answer:',
  '1. When the passages cover the question, answer from them and stay consistent with them. They are the course\'s own material and the student is being tested on that version.',
  '2. You MAY go beyond the passages to teach: rephrase an idea more simply, give an analogy, compare two concepts, or connect this topic to a related one. That is often exactly what is being asked for.',
  '3. When you go beyond the passages for something factual, say so briefly — "this isn\'t in your notes, but..." — so the student knows which part came from their course.',
  '4. If you genuinely do not know, say so. Never invent a fact to fill the gap.',
  '5. Answer in 2-5 short sentences, or a short bullet list for steps and criteria. Plain text; **bold** for emphasis is fine. Write to a student, not to a colleague.',
].join('\n');

// One entry per course in assets/courses.js (scripts/check-courses.mjs checks);
// the assistant accepts exactly these course keys.
// Where the courses differ: a wrong ochem explanation costs an exercise.
// A wrong EMT protocol detail can cost someone their certification, or worse
// if they believe it on a real call.
const COURSE_RULES = {
  nremt: [
    '',
    'This student is preparing for the NREMT-EMT cognitive exam. Additional hard rules:',
    '- NEVER state a protocol step, drug dose, vital-sign threshold, or numeric criterion that is not in the passages. Analogies and plain-language explanation are encouraged; invented clinical specifics are not.',
    '- If asked for a number or a protocol the passages do not contain, say it is not in their material and tell them to check their local protocol — do not estimate it.',
    '- This is exam study material, not medical direction. For anything about a real patient, note that local protocol and medical direction govern real calls.',
    '- Never advise on a real, in-progress emergency. Tell them to call 911 / medical control.',
  ].join('\n'),
  ochem: [
    '',
    'This student is learning Organic Chemistry I. Additional guidance:',
    '- Analogies, alternative framings and worked reasoning are the point — use them freely.',
    '- Be careful with mechanism specifics: arrow direction, stereochemistry and regiochemistry must match the passages where the passages address them.',
    '- If a mechanism question goes beyond what the passages cover, reason it out but flag that you are reasoning rather than quoting their notes.',
  ].join('\n'),
  anp: [
    '',
    'This student is learning Anatomy & Physiology (college A&P I and II, or TEAS prep). Additional guidance:',
    '- Explain physiology as mechanism: name what causes each step. Never explain by purpose ("the body wants", "in order to").',
    '- Use the course\'s terms as the passages use them. Say "sensory receptor" or "receptor protein", never a bare "receptor".',
    '- Do not state a normal range, value or clinical threshold that is not in the passages; say it is not in their material instead.',
    '- This is study material, not medical advice. For anything about a real patient or symptoms, tell them to ask a clinician.',
  ].join('\n'),
  apbio: [
    '',
    'This student is a high-school student preparing for the AP® Biology exam. Additional guidance:',
    '- Explain at a high-school level, from the basics up, and as mechanism: name what causes each step. Never explain by purpose ("the cell wants", "in order to").',
    '- Use the course\'s terms as the passages use them. Do not state a number, rate or yield that is not in the passages; say it is not in their material instead.',
    '- Never reproduce or quote released AP® exam questions, AP Classroom items or College Board course text, and do not claim to know what will be on the exam.',
    '- For a free-response question, coach the reasoning (claim, evidence, reasoning; prediction with mechanism) rather than writing a finished answer to hand in.',
  ].join('\n'),
  apchem: [
    '',
    'This student is a high-school student preparing for the AP® Chemistry exam. Additional guidance:',
    '- Explain at a high-school level, from the basics up, at the particle level: name the particles, the forces and the cause. Never explain by purpose ("the atom wants a full octet").',
    '- Show calculations with units carried through every step and the answer rounded to the significant figures the data support. Say which logarithm (log or ln) an equation uses.',
    '- Justify with comparisons of both species, Coulomb\'s law, Q versus K, and particle-level entropy (dispersal of matter and energy), never "disorder" or "K changes with concentration".',
    '- Do not state a constant, value or reduction potential that is not in the passages or the official equations sheet; say it is not in their material instead.',
    '- Never reproduce or quote released AP® exam questions, AP Classroom items or College Board course text, and do not claim to know what will be on the exam.',
    '- For a free-response question, coach the reasoning (claim, evidence, reasoning) rather than writing a finished answer to hand in.',
  ].join('\n'),
  apphys: [
    '',
    'This student is a high-school student preparing for the AP® Physics 1 exam. Additional guidance:',
    '- Explain at a high-school level, from the basics up, as cause and effect: name the forces, the system and the interaction. Never explain by purpose ("the ball wants to fall").',
    '- Show calculations in SI units carried through every step, start from a named principle (Newton\'s second law, conservation of energy or momentum), and say which value of g you use (9.8 or 10 m/s²).',
    '- Free-body diagrams show only real forces, each from the object, labeled with its type and the object exerting it; never draw a net force, a "centripetal force" or a component as an extra force.',
    '- Justify conservation by its condition (zero net external force, torque or work), never "it is conserved because of conservation".',
    '- Do not state a constant or value that is not in the passages or the official equations sheet; say it is not in their material instead.',
    '- Never reproduce or quote released AP® exam questions, AP Classroom items or College Board course text, and do not claim to know what will be on the exam.',
    '- For a free-response question, coach the reasoning (claim, evidence, reasoning) rather than writing a finished answer to hand in.',
  ].join('\n'),
  apcalc: [
    '',
    'This student is a high-school student preparing for the AP® Calculus AB exam. Additional guidance:',
    '- Explain at a high-school level, from the basics up, and show each step of a derivative, an integral or a limit with the rule it uses (power, product, quotient, chain, substitution).',
    '- Write math so it reads plainly in text: f\'(x), x^2, sqrt(x), the integral from 0 to 2 of f(x) dx. Work in radians.',
    '- Justify with the named theorem and its hypotheses (continuity on the closed interval for the Intermediate and Extreme Value Theorems, also differentiability on the open interval for the Mean Value Theorem), and tie every sign argument to the function it is about (f\' changes sign, not "it changes sign").',
    '- A relative extremum needs a sign change of f\'; an absolute extremum needs the candidates test or a global argument. An antiderivative carries + C.',
    '- For calculator answers, give the setup and three decimal places. Do not state a value that is not in the passages; say it is not in their material instead.',
    '- Never reproduce or quote released AP® exam questions, AP Classroom items or College Board course text, and do not claim to know what will be on the exam.',
    '- For a free-response question, coach the reasoning rather than writing a finished answer to hand in.',
  ].join('\n'),
  apstat: [
    '',
    'This student is a high-school student preparing for the AP® Statistics exam (the revised course, first examined in May 2027). Additional guidance:',
    '- Explain at a high-school level, from the basics up; the course needs only first-year algebra. Show each calculation as the exam asks: the formula, the values substituted, then the answer.',
    '- Write math so it reads plainly in text, as Bluebook types it: p-hat, x-bar, mu, sqrt( ), H_0, H_a, and intervals as "from 0.41 to 0.53".',
    '- Every conclusion is in context and about the parameter ("the true proportion of all ..."): compare the p-value with alpha, say whether there is convincing evidence for H_a, never "accept H_0" or "prove". Interpret a confidence level as a long-run capture rate, never as the chance the parameter is in one interval.',
    '- Check conditions in words with numbers (random, 10% when sampling without replacement, large counts, normal or large sample). Two-sample t procedures are not pooled.',
    '- Do not teach the geometric distribution, combining random variables, chi-square goodness of fit, transformations or inference for slope as tested content: they were removed from the course. Do not state a value that is not in the passages; say it is not in their material instead.',
    '- Never reproduce or quote released AP® exam questions, AP Classroom items or College Board course text, and do not claim to know what will be on the exam.',
    '- For a free-response question, coach the reasoning rather than writing a finished answer to hand in.',
  ].join('\n'),
  apenv: [
    '',
    'This student is a high-school student preparing for the AP® Environmental Science exam (May 2027 format). Additional guidance:',
    '- Explain at a high-school level, from the basics up, and tie every idea to a real system: an ecosystem, a cycle, a population, an energy source, a pollutant.',
    '- Show each calculation as the exam asks, with no formula sheet: the setup with brackets and units, then the answer with its unit, e.g. (150 - 120) / 120 x 100 = 25%. Only a four-function or scientific calculator is allowed; do not rely on a graphing calculator.',
    '- Be specific, as the readers ask: a hypothesis is a statement with a direction (increase or decrease), never a question; a solution says how it works and fits the scenario; a cause-and-effect chain names every link. Never "affects" without a direction.',
    '- Keep commonly confused ideas apart: the greenhouse effect and ozone depletion, bioaccumulation and biomagnification, r- and K-selection and survivorship curves, sea ice and land ice.',
    '- Do not state a value that is not in the passages; say it is not in their material instead.',
    '- Never reproduce or quote released AP® exam questions, AP Classroom items or College Board course text, and do not claim to know what will be on the exam.',
    '- For a free-response question, coach the reasoning rather than writing a finished answer to hand in.',
  ].join('\n'),
};

function systemPrompt(course){
  return SHARED_RULES + (COURSE_RULES[course] || COURSE_RULES.nremt);
}

function corsHeaders(origin, env) {
  const allowed = allowedOrigins(env).includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    // Authorization: /premium/checkout carries the student's Supabase session.
    // x-umami-cache: the analytics tracker's own header (/api/send, src/umami.js).
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-umami-cache',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, origin, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env) },
  });
}

export default {
  /* The cron that delivers study reminders. Separate from fetch() entirely: it
     is not triggered by anybody's request and shares nothing with the AI path.
     See src/reminders.js for why the browser decides everything and this only
     delivers. */
  async scheduled(event, env, ctx) {
    // Both channels on the same tick, and independently: an email provider
    // that is down must not stop the push reminders, and vice versa.
    // Premium rides the same tick: the pass-ending email every time, and the
    // Polar reconciliation once an hour (the tick in the first quarter).
    const tasks = [
      runReminders(env).then((r) => console.log('push reminders', JSON.stringify(r))),
      runEmailReminders(env).then((r) => console.log('email reminders', JSON.stringify(r))),
      runPassEnding(env).then((r) => console.log('pass ending', JSON.stringify(r))),
    ];
    if (new Date(event?.scheduledTime || Date.now()).getUTCMinutes() < 15) {
      tasks.push(reconcilePolar(env).then((r) => console.log('premium reconcile', JSON.stringify(r))));
    }
    ctx.waitUntil(Promise.allSettled(tasks).then((results) => {
      results.forEach((r) => { if (r.status === 'rejected') console.log('reminder run failed', String(r.reason)); });
    }));
  },

  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const path = new URL(request.url).pathname;
    const reply = (body, status) => json(body, status, origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    /* The way out of the reminder emails, from the footer link and from the
       List-Unsubscribe header. It must work with nobody signed in on a
       device that has never seen this site, so it takes no Origin. A GET
       shows a confirmation; only the POST deletes (src/email.js says why). */
    if (path === '/api/unsubscribe' || path === '/reminders/unsubscribe') {
      if (await throttled(env, request, 'unsub')) {
        return new Response('Too many requests. Try again in a minute.', { status: 429, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' } });
      }
      return unsubscribe(request, env);
    }

    /* A service worker woken by a push asks what to say; the notification
       text is fetched at the moment it is shown rather than carried in the
       push, which is what lets the push itself be payload-less and skips the
       entire RFC 8291 encryption path. See src/push.js.

       Answered for any origin, because the caller is a service worker whose
       fetch carries no Origin header at all — and because it returns only what
       somebody already holding that endpoint could learn anyway. */
    if (path === '/reminders/text') {
      if (request.method !== 'GET') return reply({ error: 'GET only' }, 405);
      if (await throttled(env, request, 'text')) return reply({ error: 'Rate limited' }, 429);
      const res = await reminderText(request, env);
      const headers = new Headers(res.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(res.body, { status: res.status, headers });
    }

    /* Polar's webhook. No Origin (it is a server) and no rate limit (Polar
       retries, and a burst of real orders is the good kind); the signature
       check inside is the whole of its trust. See src/premium.js. */
    if (path === '/premium/webhook') {
      if (request.method !== 'POST') return reply({ error: 'POST only' }, 405);
      const r = await premiumWebhook(request, env);
      return reply(r.body, r.status);
    }

    /* Analytics, forwarded to Umami (src/umami.js says why and what is
       dropped). Before the throttle below on purpose: that one is shared with
       the assistant, and a student's page views must not spend its allowance.
       Still needs the site's Origin, which every browser sends on these. */
    if (path === '/api/send') {
      if (!allowedOrigins(env).includes(origin)) return reply({ error: 'Origin not allowed' }, 403);
      return umamiProxy(request, env, corsHeaders(origin, env));
    }

    if (request.method !== 'POST') {
      return reply({ error: 'POST only' }, 405);
    }
    // An allowed Origin is REQUIRED, not merely "not a wrong one". A browser
    // always sends Origin on a POST fetch, same-origin or cross-origin, so the
    // only callers this turns away are scripts (curl, a bot) — which used to
    // walk straight through by leaving the header off. A script can forge the
    // header, which is why the assistant also needs a session (below).
    if (!allowedOrigins(env).includes(origin)) {
      return reply({ error: 'Origin not allowed' }, 403);
    }

    // Per-visitor throttle, so one person (or one script) can't drain the
    // day's free allowance in a minute.
    if (await throttled(env, request, 'post')) {
      return reply({ error: 'Rate limited. The site will answer from its own material instead.' }, 429);
    }

    // Opening a checkout is a browser POST from the site like the assistant,
    // so it shares the Origin check and the throttle above, then leaves.
    if (path === '/premium/checkout') {
      const r = await premiumCheckout(request, env);
      return reply(r.body, r.status);
    }
    // A refund from the account page: same Origin check and throttle; the
    // rules that keep it from being abused are in premiumRefund().
    if (path === '/premium/refund') {
      const r = await premiumRefund(request, env);
      return reply(r.body, r.status);
    }

    /* The AI free-response grader (src/frq-grade.js, docs/frq-grader.md):
       signed-in Premium students only, checked inside, plus a daily cap.
       Same Origin check and throttle as everything above. */
    if (path === '/frq/grade') {
      const later = ctx && typeof ctx.waitUntil === 'function' ? (p) => ctx.waitUntil(p) : undefined;
      const r = await gradeRoute(request, env, { later });
      return reply(r.body, r.status);
    }

    // Pass-or-extend (NREMT); its rules are in premiumGuarantee().
    if (path === '/premium/guarantee') {
      const r = await premiumGuarantee(request, env);
      return reply(r.body, r.status);
    }

    // The assistant: signed-in students only (see signedIn above). The site
    // answers from its own material for everyone else.
    if (!(await signedIn(env, request))) {
      return reply({ error: 'Sign in to get AI answers.' }, 401);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return reply({ error: 'Invalid JSON' }, 400);
    }

    const question = String(payload?.question || '').trim().slice(0, 500);
    const context = Array.isArray(payload?.context) ? payload.context.slice(0, 6) : [];
    const history = Array.isArray(payload?.history) ? payload.history.slice(-4) : [];
    // Any course with its own rules; anything else is NREMT, the original.
    const course = typeof payload?.course === 'string' && Object.prototype.hasOwnProperty.call(COURSE_RULES, payload.course)
      ? payload.course : 'nremt';

    if (!question) return reply({ error: 'Missing question' }, 400);

    // An empty context is legitimate: the student asked something the course
    // doesn't cover. The model answers from general knowledge and is told to
    // label it as such, rather than passing it off as their material.
    const grounded = context.length > 0;
    const references = context
      .map((c, i) => {
        const page = String(c?.page || '').slice(0, 80);
        const heading = String(c?.heading || '').slice(0, 160);
        const text = String(c?.text || '').slice(0, 1200);
        return `[${i + 1}] ${page} — ${heading}\n${text}`;
      })
      .join('\n\n');

    const messages = [{ role: 'system', content: systemPrompt(course) }];
    for (const turn of history) {
      if (turn?.q) messages.push({ role: 'user', content: String(turn.q).slice(0, 300) });
      if (turn?.a) messages.push({ role: 'assistant', content: String(turn.a).slice(0, 600) });
    }
    messages.push({
      role: 'user',
      content: grounded
        ? `Reference passages from this student's course:\n\n${references}\n\n---\nStudent's question: ${question}\n\nAnswer from these passages, staying consistent with them. You may rephrase, give an analogy, or connect to a related idea; say so briefly if you go beyond what the passages state.`
        : `The course material has no passage covering this question.\n\n---\nStudent's question: ${question}\n\nAnswer from general knowledge, and open by making clear this is not covered in their course material. Keep it brief and do not invent course-specific details.`,
    });

    let lastError = null;
    for (const model of MODELS) {
      try {
        const result = await env.AI.run(model, { messages, max_tokens: 500, temperature: 0.2 });
        const answer = extractText(result);
        if (answer) return reply({ answer, model }, 200);
        // Name the keys that did come back, so an unfamiliar response shape is
        // a five-second fix instead of another round of guessing.
        const shape = result && typeof result === 'object' ? Object.keys(result).join(',') : typeof result;
        lastError = `${model} returned no text (fields: ${shape})`;
      } catch (err) {
        lastError = String(err);
        // Out of allowance is not a model problem — every model will refuse,
        // so stop rather than burning the remaining names on the same 429.
        if (/\b(3036|429)\b/.test(lastError)) break;
      }
    }
    // Every model failed: say so plainly and let the client fall back to the
    // course's own material rather than pretend to have answered. The reason
    // goes to the Worker's log, not to the browser: raw platform errors name
    // models, accounts and limits nobody outside needs to see.
    console.log('assistant: every model failed', String(lastError).slice(0, 300));
    return reply({ error: 'Model unavailable' }, 502);
  },
};
