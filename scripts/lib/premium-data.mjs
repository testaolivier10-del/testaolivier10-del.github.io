/* The free/Premium facts every generator and site rule quotes, read from the
   one place they are written (audit 2026-10, workstream W2).

   assets/premium.js owns the split: COURSES (names, passes, prices, free and
   Premium lists, free chapters), FOUNDING (the founding-member discount) and
   GUARANTEE (Pass-or-extend's conditions). This reads those three object
   literals out of the file and evaluates them, so a page that shows a price
   or says what is free is generated from the same data the purchase dialog
   uses, and cannot drift from it.

   The counts (question banks, ochem chapters and topics) are counted from the
   data, never typed. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const ORIGIN = 'https://levlprep.com';

/* The one sentence about what is free (owner's wording, 2026-10-02). Every
   page that sums up the split uses it; scripts/site-rules/free-claims.mjs
   rejects the older claims it replaced. */
export const FREE_SENTENCE = 'All notes and textbook pages are free forever; interactive lessons are free in the early chapters; Premium adds unlimited practice, exams, every lesson and analytics.';

function literal(src, name) {
  const start = src.indexOf(`var ${name} = `);
  if (start === -1) throw new Error(`assets/premium.js: no "var ${name} = "`);
  let i = src.indexOf('=', start) + 1;
  while (/\s/.test(src[i])) i++;
  const open = src[i];
  const close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) throw new Error(`assets/premium.js: ${name} is not an object literal`);
  let depth = 0, quote = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (quote) {
      if (c === '\\') { j++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '\'' || c === '"' || c === '`') { quote = c; continue; }
    if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (c === open) depth++;
    else if (c === close && --depth === 0) return src.slice(i, j + 1);
  }
  throw new Error(`assets/premium.js: ${name} never closes`);
}

let cached = null;
export function premiumData() {
  if (cached) return cached;
  const src = readFileSync(join(ROOT, 'assets', 'premium.js'), 'utf8');
  const out = {};
  for (const name of ['COURSES', 'FOUNDING', 'GUARANTEE']) {
    out[name] = vm.runInNewContext(`(${literal(src, name)})`);
  }
  cached = out;
  return out;
}

export function foundingPrice(price, founding = premiumData().FOUNDING) {
  return Math.round(price * (100 - founding.off)) / 100;
}

export function money(n) {
  return '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
}

/* "15 October 2026"-style dates, as the legal pages write them. */
export function longDate(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return `${d.getUTCDate()} ${d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
}

/* ---- counts ------------------------------------------------------------ */

let countsCache = null;
export function counts() {
  if (countsCache) return countsCache;
  const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
  const nremt = read('nremt/assets/questions.json').length;
  const ob = read('ochem/assets/practice-bank.json');
  const ochem = Object.values(ob).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
  const bankDir = join(ROOT, 'anatomy-physiology', 'assets', 'bank');
  let anp = 0;
  if (existsSync(bankDir)) {
    for (const f of readdirSync(bankDir)) {
      if (!f.endsWith('.json') || f.endsWith('-why.json') || f === 'index.json') continue;
      const d = read(join('anatomy-physiology', 'assets', 'bank', f));
      anp += Array.isArray(d) ? d.length : 0;
    }
  }
  // The ochem curriculum: chapters are MODULES, topics are those with a
  // lesson (check-site's section 8 counts them the same way).
  const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} }, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(ROOT, 'ochem', 'assets', 'curriculum.js'), 'utf8') +
    '\nthis.M = (typeof MODULES !== "undefined") ? MODULES : (window.OchemCurriculum && window.OchemCurriculum.MODULES);', sandbox);
  const modules = sandbox.M;
  const topics = modules.reduce((n, m) => n + m.topics.filter((t) => t.href && !t.notesOnly).length, 0);
  const mechanisms = readdirSync(join(ROOT, 'ochem', 'mechanisms')).filter((f) => f.endsWith('.html')).length;
  const toolsSrc = readFileSync(join(ROOT, 'ochem', 'assets', 'tools-registry.js'), 'utf8');
  const ochemTools = (toolsSrc.match(/\bslug:\s*'/g) || []).length;
  const anpMap = read('docs/anp-dependency-map.json');
  countsCache = {
    nremt, ochem, anp,
    ochemChapters: modules.length, ochemTopics: topics, ochemMechanisms: mechanisms, ochemTools,
    anpChapters: anpMap.chapters.length, anpTopics: anpMap.topics.length,
  };
  return countsCache;
}

export const fmt = (n) => n.toLocaleString('en-US');

/* ---- structured data ----------------------------------------------------- */

/* A page whose main content is Premium: Google's paywalled-content markup.
   `selector` is a class on the element that locks. */
export function lockedLd(selector) {
  return {
    isAccessibleForFree: false,
    hasPart: { '@type': 'WebPageElement', isAccessibleForFree: false, cssSelector: selector },
  };
}

/* A course: free to start, with the passes as offers. No "price: 0" anywhere:
   the free part is described by category, the passes by their real price. */
export function courseOffers(key) {
  const c = premiumData().COURSES[key];
  return c.passes.map((p) => ({
    '@type': 'Offer',
    name: `Premium, ${p.label}`,
    category: 'Partially Free',
    price: String(p.price),
    priceCurrency: 'USD',
    url: `${ORIGIN}/premium.html#${key}`,
  }));
}

/* Pass-or-extend's conditions, as premium.js's guaranteeText() writes them:
   the function is read out of the file and run here, so the dialog, the
   account page and premium.html cannot word them differently. */
export function guaranteeText() {
  const src = readFileSync(join(ROOT, 'assets', 'premium.js'), 'utf8');
  const start = src.indexOf('function guaranteeText()');
  if (start === -1) throw new Error('assets/premium.js: no guaranteeText()');
  const end = src.indexOf('\n  }\n', start);
  const fn = src.slice(start, end + 4);
  return vm.runInNewContext(`${fn}\nguaranteeText();`, { GUARANTEE: premiumData().GUARANTEE });
}
