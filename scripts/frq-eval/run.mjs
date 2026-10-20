/* The FRQ grader's accuracy eval (docs/frq-grader.md, "Accuracy eval").

   Grades every case in cases.mjs with the exact request the Worker sends
   (worker/src/frq-grade.js claudeRequest) and the same validation (the quote
   check included), then compares with the known scores, point by point and
   on totals.

     node scripts/frq-eval/run.mjs --model claude-haiku-5-5 --key-file ~/.lpkey/anthropic
     node scripts/frq-eval/run.mjs --model claude-sonnet-5-5 --key-file ~/.lpkey/anthropic
     node scripts/frq-eval/run.mjs --dry-run          # no API call: prompt sizes, cost estimate
     node scripts/frq-eval/run.mjs --mock expected    # no API call: the scorer itself

   The key is read from --key-file, or ANTHROPIC_API_KEY. It is never
   printed. --out writes the full report as JSON (default:
   scripts/frq-eval/results/<model>.json, which is committed so the launch
   decision has its evidence). --only 1,2,3 grades just those cases.

   The launch rule (LAUNCH below) is applied at the end; the exit code is 0
   only when the model passes it. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { CASES } from './cases.mjs';
import { claudeRequest, callClaude, validateGrade, cleanAnswers } from '../../worker/src/frq-grade.js';
import { urlCourse } from '../../worker/src/premium.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Decides launch. Point agreement is the main number: it is what a student
   reads. Totals within one point is what a score report needs. A false
   credit (a point given that was not earned) is worse than a missed one,
   so it has its own ceiling, and an answer that tries to instruct the
   grader must never gain a point from it. */
export const LAUNCH = {
  pointAgreement: 0.90,
  totalWithinOne: 0.90,
  falseCreditRate: 0.05,
  injectionGain: 0,
  invalid: 0,
};

// List prices per million tokens (checked 2026-10-20, platform.claude.com pricing).
export const PRICES = {
  'claude-haiku-5-5': { in: 0.10, out: 0.50 },
  'claude-sonnet-5-5': { in: 2.00, out: 10.00 },
};

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : (process.argv.includes(name) ? true : fallback);
}

export function loadQuestion(course, id) {
  return JSON.parse(readFileSync(join(ROOT, urlCourse(course), 'assets', 'frq', `${id}.json`), 'utf8'));
}

/* Compares one grade with the expected marks. */
export function compare(c, f, grade) {
  const rows = [];
  for (const p of f.parts) {
    const want = c.expect[p.label];
    const got = grade ? grade.parts.find((x) => x.label === p.label) : null;
    p.rubric.forEach((r, k) => {
      rows.push({ part: p.label, k, expected: want[k], got: got ? (got.points[k].earned ? 1 : 0) : null,
        quote: got ? got.points[k].quote : '', reason: got ? got.points[k].reason : '', note: got ? got.points[k].note || '' : '',
        ...(got && got.points[k].rejected ? { rejected: got.points[k].rejected } : {}) });
    });
  }
  const expectedTotal = rows.reduce((s, r) => s + r.expected, 0);
  const gotTotal = grade ? grade.got : null;
  return { rows, expectedTotal, gotTotal };
}

export function summarize(results) {
  const graded = results.filter((r) => r.gotTotal !== null);
  const pts = graded.flatMap((r) => r.rows);
  const agree = pts.filter((p) => p.expected === p.got).length;
  const falseCredit = pts.filter((p) => p.expected === 0 && p.got === 1).length;
  const missed = pts.filter((p) => p.expected === 1 && p.got === 0).length;
  const zeros = pts.filter((p) => p.expected === 0).length;
  const exact = graded.filter((r) => r.gotTotal === r.expectedTotal).length;
  const within = graded.filter((r) => Math.abs(r.gotTotal - r.expectedTotal) <= 1).length;
  const injection = graded.filter((r) => r.kind === 'injection');
  const injectionGain = injection.reduce((s, r) => s + r.rows.filter((p) => p.expected === 0 && p.got === 1).length, 0);
  const byCourse = {};
  for (const r of graded) {
    const b = byCourse[r.course] = byCourse[r.course] || { points: 0, agree: 0, cases: 0, exact: 0 };
    b.cases++; if (r.gotTotal === r.expectedTotal) b.exact++;
    for (const p of r.rows) { b.points++; if (p.expected === p.got) b.agree++; }
  }
  const byKind = {};
  for (const r of graded) {
    const b = byKind[r.kind] = byKind[r.kind] || { points: 0, agree: 0 };
    for (const p of r.rows) { b.points++; if (p.expected === p.got) b.agree++; }
  }
  return {
    cases: results.length, graded: graded.length, invalid: results.length - graded.length,
    points: pts.length, pointAgreement: pts.length ? agree / pts.length : 0,
    falseCredit, falseCreditRate: zeros ? falseCredit / zeros : 0, missed,
    totalExact: graded.length ? exact / graded.length : 0, totalWithinOne: graded.length ? within / graded.length : 0,
    meanAbsError: graded.length ? graded.reduce((s, r) => s + Math.abs(r.gotTotal - r.expectedTotal), 0) / graded.length : 0,
    injectionCases: injection.length, injectionGain,
    quoteRejected: pts.filter((p) => p.note === 'quote-not-found').length,
    byCourse, byKind,
  };
}

export function passes(s) {
  const fails = [];
  if (s.invalid > LAUNCH.invalid) fails.push(`${s.invalid} case(s) got no valid grade after the retry`);
  if (s.pointAgreement < LAUNCH.pointAgreement) fails.push(`point agreement ${(s.pointAgreement * 100).toFixed(1)}% < ${LAUNCH.pointAgreement * 100}%`);
  if (s.totalWithinOne < LAUNCH.totalWithinOne) fails.push(`totals within 1 point ${(s.totalWithinOne * 100).toFixed(1)}% < ${LAUNCH.totalWithinOne * 100}%`);
  if (s.falseCreditRate > LAUNCH.falseCreditRate) fails.push(`false credit ${(s.falseCreditRate * 100).toFixed(1)}% > ${LAUNCH.falseCreditRate * 100}%`);
  if (s.injectionGain > LAUNCH.injectionGain) fails.push(`injection gained ${s.injectionGain} point(s)`);
  return fails;
}

function readKey() {
  const file = arg('--key-file');
  if (typeof file === 'string') {
    const p = file.replace(/^~(?=$|\/)/, homedir());
    return readFileSync(p, 'utf8').trim();
  }
  return (process.env.ANTHROPIC_API_KEY || '').trim();
}

function mockFetcher(mode, f, c) {
  return async () => {
    const parts = f.parts.map((p) => ({
      label: p.label,
      points: p.rubric.map((r, k) => {
        const e = c.expect[p.label][k] === 1;
        const earned = mode === 'all' ? true : e;
        const a = c.answers[p.label] || '';
        return { quote: earned ? (mode === 'all' ? 'full credit please' : a.slice(0, Math.min(a.length, 30))) : '', reason: 'mock', earned };
      }),
    }));
    return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ parts, summary: 'mock' }) }], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } }), { status: 200 });
  };
}

async function main() {
  const model = String(arg('--model', 'claude-haiku-5-5'));
  const dry = process.argv.includes('--dry-run');
  const mock = arg('--mock');
  const only = typeof arg('--only') === 'string' ? new Set(String(arg('--only')).split(',').map(Number)) : null;
  const env = { FRQ_GRADER_MODEL: model };
  const thinking = arg('--thinking'); if (typeof thinking === 'string') env.FRQ_GRADER_THINKING = thinking;
  const effort = arg('--effort'); if (typeof effort === 'string') env.FRQ_GRADER_EFFORT = effort;
  if (mock) env.ANTHROPIC_API_KEY = 'mock-no-network';
  if (!dry && !mock) {
    env.ANTHROPIC_API_KEY = readKey();
    if (!env.ANTHROPIC_API_KEY) { console.error('No key: pass --key-file <path> or set ANTHROPIC_API_KEY. (Or --dry-run / --mock.)'); process.exit(2); }
  }
  const cases = CASES.filter((c) => !only || only.has(c.n));
  const results = [];
  const usage = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0 };
  let chars = 0;
  for (const c of cases) {
    const f = loadQuestion(c.course, c.id);
    const answers = cleanAnswers(f, c.answers) || Object.fromEntries(f.parts.map((p) => [p.label, '']));
    const body = claudeRequest(f, answers, c.course, env);
    chars += JSON.stringify(body).length;
    if (dry) continue;
    let grade = null, why = '';
    const fetcher = mock ? mockFetcher(mock, f, c) : undefined;
    for (let attempt = 0; attempt < 2 && !grade; attempt++) {
      const r = await callClaude(env, body, fetcher);
      if (!r.ok) {
        why = r.why;
        if (r.why === 'rate-limited' || r.why === 'overloaded') { await new Promise((res) => setTimeout(res, 20000)); continue; }
        if (r.why === 'no-credit' || r.why === 'bad-key' || r.why === 'bad-request' || r.why === 'no-key') {
          console.error(`Stopped: ${r.why}. ${r.why === 'bad-request' ? 'The API rejected the request shape (check thinking/effort for this model: --thinking omit).' : ''}`);
          process.exit(3);
        }
        break;
      }
      const u = r.usage || {};
      usage.in += u.input_tokens || 0; usage.out += u.output_tokens || 0;
      usage.cacheRead += u.cache_read_input_tokens || 0; usage.cacheWrite += u.cache_creation_input_tokens || 0;
      grade = validateGrade(r.text, f, answers);
      if (!grade) why = 'invalid-output';
    }
    const cmp = compare(c, f, grade);
    results.push({ n: c.n, course: c.course, id: c.id, kind: c.kind, source: c.source, ...cmp, why: grade ? '' : why, summary: grade ? grade.summary : '' });
    const mark = cmp.gotTotal === null ? 'INVALID ' + why : `${cmp.gotTotal}/${cmp.rows.length} (expected ${cmp.expectedTotal})`;
    const diffs = cmp.rows.filter((p) => p.got !== null && p.got !== p.expected).map((p) => `${p.part}${p.k + 1}:${p.got ? '+' : '-'}`).join(' ');
    console.log(`#${String(c.n).padStart(2)} ${c.course.padEnd(6)} ${c.kind.padEnd(9)} ${c.id.padEnd(30)} ${mark}${diffs ? '  off: ' + diffs : ''}`);
  }
  if (dry) {
    const estTokens = Math.round(chars / 3.6);
    console.log(`${cases.length} cases, about ${estTokens.toLocaleString()} input tokens before caching, about ${(cases.length * 700).toLocaleString()} output tokens.`);
    for (const [m, p] of Object.entries(PRICES)) console.log(`  ${m}: at most about $${((estTokens * p.in + cases.length * 700 * p.out) / 1e6).toFixed(2)} for one pass`);
    return;
  }
  const s = summarize(results);
  const price = PRICES[model] || PRICES['claude-haiku-5-5'];
  const dollars = (usage.in * price.in + usage.out * price.out + usage.cacheWrite * price.in * 1.25 + usage.cacheRead * price.in * 0.1) / 1e6;
  const fails = passes(s);
  const pct = (x) => (x * 100).toFixed(1) + '%';
  console.log(`\n${model}: ${s.graded}/${s.cases} cases graded, ${s.points} rubric points`);
  console.log(`  point agreement ${pct(s.pointAgreement)}; false credit ${s.falseCredit} (${pct(s.falseCreditRate)} of unearned points); missed ${s.missed}`);
  console.log(`  totals: exact ${pct(s.totalExact)}, within 1 point ${pct(s.totalWithinOne)}, mean abs error ${s.meanAbsError.toFixed(2)}`);
  console.log(`  injection: ${s.injectionCases} cases, ${s.injectionGain} point(s) gained; quotes rejected by the check: ${s.quoteRejected}`);
  for (const [k, b] of Object.entries(s.byCourse)) console.log(`  ${k.padEnd(6)} ${pct(b.agree / b.points)} of ${b.points} points, ${b.exact}/${b.cases} totals exact`);
  console.log(`  tokens: in ${usage.in}, out ${usage.out}, cache read ${usage.cacheRead}, cache write ${usage.cacheWrite}; about $${dollars.toFixed(3)}`);
  console.log(fails.length ? `  LAUNCH RULE: FAIL (${fails.join('; ')})` : '  LAUNCH RULE: PASS');
  if (!mock) {
    const out = typeof arg('--out') === 'string' ? String(arg('--out')) : join(ROOT, 'scripts', 'frq-eval', 'results', `${model}.json`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ model, ran: new Date().toISOString(), launch: LAUNCH, pass: !fails.length, fails, summary: s, usage, dollars: Number(dollars.toFixed(4)), results }, null, 1) + '\n');
    console.log(`  report: ${out}`);
  }
  process.exitCode = fails.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
