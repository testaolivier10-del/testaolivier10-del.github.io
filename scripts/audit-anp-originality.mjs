/* A&P originality audit (local; CI does not have the reference text).

   Spec section 2: the course is written originally; it never paraphrases a
   textbook. This finds any run of words the course shares with OpenStax
   Anatomy and Physiology 2e, the reference most likely to leak in. It
   compares every sentence of our lessons, notes, questions and glossary with
   the OpenStax section pages saved locally, word by word, and reports each
   shared run of MIN_RUN or more words.

     ANP_OPENSTAX_PAGES=<dir of saved section .html pages> node scripts/audit-anp-originality.mjs
     ... --topic <id>     one topic
     ... --min <n>        shortest run to report (default 9)

   A shared run is not proof of copying: short technical phrases ("the left
   atrioventricular valve, also called the mitral valve") recur in every book.
   Each hit is read by a person, and rewritten when it reads as borrowed. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA = join(ROOT, 'anatomy-physiology', 'data');
const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const only = opt('--topic');
const MIN_RUN = Number(opt('--min') || 9);
const PAGES = process.env.ANP_OPENSTAX_PAGES;
if (!PAGES || !existsSync(PAGES)) {
  console.error('Set ANP_OPENSTAX_PAGES to a folder of saved OpenStax A&P 2e section pages.');
  process.exit(1);
}

const strip = (html) => html
  .replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ');
const words = (text) => text.toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) || [];

// Index every MIN_RUN-word shingle of the reference text.
const shingles = new Map();
for (const f of readdirSync(PAGES).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(PAGES, f), 'utf8');
  const main = html.match(/<main[\s\S]*<\/main>/i)?.[0] || html;
  const w = words(strip(main));
  for (let i = 0; i + MIN_RUN <= w.length; i++) {
    const k = w.slice(i, i + MIN_RUN).join(' ');
    if (!shingles.has(k)) shingles.set(k, f.replace(/\.html$/, ''));
  }
}

// Every string in a JSON value, for lessons, questions and glossary files.
function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

function topicText(id) {
  const parts = [];
  for (const [dir, ext] of [['lessons', 'json'], ['questions', 'json'], ['glossary', 'json'], ['notes', 'html']]) {
    const p = join(DATA, dir, `${id}.${ext}`);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, 'utf8');
    parts.push(...(ext === 'json' ? strings(JSON.parse(raw)).map(strip) : [strip(raw)]));
  }
  return parts;
}

const topics = only ? [only] : [...new Set(['lessons', 'notes', 'questions']
  .flatMap((d) => existsSync(join(DATA, d)) ? readdirSync(join(DATA, d)) : [])
  .map((f) => f.replace(/\.(json|html)$/, '')))].sort();

let hits = 0;
for (const id of topics) {
  const found = [];
  for (const text of topicText(id)) {
    const w = words(text);
    let i = 0;
    while (i + MIN_RUN <= w.length) {
      const src = shingles.get(w.slice(i, i + MIN_RUN).join(' '));
      if (!src) { i++; continue; }
      // Extend the run as far as it keeps matching.
      let j = i + MIN_RUN;
      while (j < w.length && shingles.has(w.slice(j - MIN_RUN + 1, j + 1).join(' '))) j++;
      found.push({ run: w.slice(i, j).join(' '), n: j - i, src });
      i = j;
    }
  }
  if (found.length) {
    console.log(`${id}: ${found.length} shared run(s)`);
    for (const f of found.sort((a, b) => b.n - a.n)) console.log(`  ${f.n} words [${f.src}]: "${f.run}"`);
    hits += found.length;
  }
}
console.log(`Originality: ${topics.length} topics, ${hits} shared run(s) of ${MIN_RUN}+ words.`);
