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

// Tried in order until one answers. A single hard-coded model is a time bomb:
// this shipped on @cf/meta/llama-3.1-8b-instruct, which the docs still list but
// the platform had deprecated months earlier, and the assistant fell back to
// quoting notes for every question with nothing on the page saying why.
// A deprecated model fails immediately and costs no inference, so the chain is
// only ever walked when something is genuinely wrong.
const MODELS = [
  '@cf/zai-org/glm-4.7-flash',
  '@cf/google/gemma-4-26b-a4b-it',
  '@cf/nvidia/nemotron-3-120b-a12b',
];

// Only these origins may call the Worker. Without this, anyone could point
// their own site at your endpoint and spend your daily allowance.
const ALLOWED_ORIGINS = [
  'https://testaolivier10-del.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

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

// Where the two courses differ: a wrong ochem explanation costs an exercise.
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
};

function systemPrompt(course){
  return SHARED_RULES + (COURSE_RULES[course] || COURSE_RULES.nremt);
}

// Workers AI models do not agree on where the text goes: some return
// {response}, some nest it under result, some use the OpenAI shape, and some
// return the content as an array of parts. Reading only `response` made a
// working model look like a broken one — the call succeeded and the answer was
// thrown away as "Empty response".
function extractText(result) {
  if (!result) return '';
  if (typeof result === 'string') return result.trim();

  const candidates = [
    result.response,
    result.result?.response,
    result.output_text,
    result.choices?.[0]?.message?.content,
    result.choices?.[0]?.text,
    result.message?.content,
    result.text,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (Array.isArray(candidate)) {
      const joined = candidate
        .map((part) => (typeof part === 'string' ? part : part?.text || part?.content || ''))
        .join('')
        .trim();
      if (joined) return joined;
    }
  }
  return '';
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405, origin);
    }
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, origin);
    }

    // Per-visitor throttle, so one person (or one script) can't drain the
    // day's free allowance in a minute.
    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) {
        return json({ error: 'Rate limited. The site will answer from its own material instead.' }, 429, origin);
      }
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, origin);
    }

    const question = String(payload?.question || '').trim().slice(0, 500);
    const context = Array.isArray(payload?.context) ? payload.context.slice(0, 6) : [];
    const history = Array.isArray(payload?.history) ? payload.history.slice(-4) : [];
    const course = payload?.course === 'ochem' ? 'ochem' : 'nremt';

    if (!question) return json({ error: 'Missing question' }, 400, origin);

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
        if (answer) return json({ answer, model }, 200, origin);
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
    // course's own material rather than pretend to have answered.
    return json({ error: 'Model unavailable', detail: String(lastError).slice(0, 200) }, 502, origin);
  },
};
