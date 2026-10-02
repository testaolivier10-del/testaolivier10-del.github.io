/* Site audit 2026-10, NREMT course (Critical): the bank, the exam draw and the
   copy followed the outline the National Registry retired on 7 April 2025, and
   pages claimed "the real domain mix". This keeps the course on the 2025 EMT
   exam outline:
   - every question's `domain` is one of the five 2025 domains and its
     `system` one of the six topic-area labels;
   - DOMAIN_TARGETS in nremt/practice-engine.js puts each domain inside its
     published band and sums to the exam length, and the bank holds enough
     questions in each domain to fill one exam;
   - the dashboard's band labels match the same bands;
   - no page claims "the real domain mix" (say what the proportions are).
   The bank as a whole is not held to the bands: what reaches a student is the
   exam draw, which DOMAIN_TARGETS controls. */
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// National Registry EMT examination specifications (April 2025).
export const NREMT_DOMAIN_BANDS = {
  'Scene Size-Up & Safety': [15, 19],
  'Primary Assessment': [39, 43],
  'Secondary Assessment': [5, 9],
  'Patient Treatment & Transport': [20, 24],
  'Operations': [10, 14],
};
const SYSTEMS = ['Assessment', 'Airway & Respiratory', 'Cardiac & Medical', 'Trauma', 'OB/Peds & Special Populations', 'EMS Operations'];

export default function ({ ROOT, fail, htmlFiles }) {
  const bank = JSON.parse(readFileSync(join(ROOT, 'nremt/assets/questions.json'), 'utf8'));
  const counts = {};
  for (const q of bank) {
    if (!NREMT_DOMAIN_BANDS[q.domain]) fail(`nremt/assets/questions.json: question ${q.id} has domain "${q.domain}", not one of the five 2025 EMT exam domains`);
    if (!SYSTEMS.includes(q.system)) fail(`nremt/assets/questions.json: question ${q.id} has system "${q.system}", not one of the six topic areas`);
    counts[q.domain] = (counts[q.domain] || 0) + 1;
  }

  const engine = readFileSync(join(ROOT, 'nremt/practice-engine.js'), 'utf8');
  const block = engine.match(/const DOMAIN_TARGETS = \{([\s\S]*?)\};/);
  if (!block) { fail('nremt/practice-engine.js: DOMAIN_TARGETS not found'); return; }
  const targets = {};
  for (const m of block[1].matchAll(/"([^"]+)":\s*(\d+)/g)) targets[m[1]] = Number(m[2]);
  const total = Object.values(targets).reduce((a, b) => a + b, 0);
  if (total !== 100) fail(`nremt/practice-engine.js: DOMAIN_TARGETS sums to ${total}, not the 100-question exam`);
  for (const [d, [lo, hi]] of Object.entries(NREMT_DOMAIN_BANDS)) {
    const n = targets[d];
    if (n === undefined) { fail(`nremt/practice-engine.js: DOMAIN_TARGETS has no "${d}"`); continue; }
    const pct = n / total * 100;
    if (pct < lo || pct > hi) fail(`nremt/practice-engine.js: DOMAIN_TARGETS gives ${d} ${pct.toFixed(0)}% of the exam, outside the ${lo}-${hi}% band`);
    if ((counts[d] || 0) < n) fail(`nremt/assets/questions.json: only ${counts[d] || 0} ${d} questions, fewer than the ${n} one exam draws`);
  }
  for (const d of Object.keys(targets)) if (!NREMT_DOMAIN_BANDS[d]) fail(`nremt/practice-engine.js: DOMAIN_TARGETS has "${d}", which is not a 2025 domain`);

  const dash = readFileSync(join(ROOT, 'nremt/dashboard.html'), 'utf8');
  for (const [d, [lo, hi]] of Object.entries(NREMT_DOMAIN_BANDS)) {
    const re = new RegExp(`d: '${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',\\s*band: '${lo}–${hi}%'`);
    if (!re.test(dash)) fail(`nremt/dashboard.html: EXAM_DOMAINS does not list ${d} with the ${lo}–${hi}% band`);
  }

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    if (/real (?:test(?:&rsquo;|’|')s |exam(?:&rsquo;|’|')s )?domain mix/i.test(html)) {
      fail(`${relative(ROOT, file)}: claims "the real domain mix"; say what the proportions are (DOMAIN_TARGETS) instead`);
    }
  }
}
