/* Builds the NREMT flashcard deck, nremt/assets/flashcards.json, for
   nremt/flashcards.html.

   Like the ochem deck (scripts/build-flashcards.mjs), most of it is READ OUT
   OF PAGES THE COURSE ALREADY HAS, so a definition corrected on the glossary
   or a number corrected on a reference card corrects its flashcard too:
     - every glossary term (nremt/data/glossary.json, the glossary page's source),
     - every mnemonic card (nremt/mnemonics.html),
     - the rows of two reference tables (nremt/reference-cards.html),
   plus the authored key-fact cards in scripts/lib/nremt-flashcard-sources.mjs,
   which also says which of the six NREMT domains each card belongs to.

   WHAT IT CHECKS (any failure stops the build)
     - every glossary term and every mnemonic is filed under a domain, and
       every name filed there still exists in its source;
     - each reference table is found by its header row;
     - every fact names a real domain and a study-notes section that exists;
     - ids are unique and every card has a front and a back.

     node scripts/build-nremt-flashcards.mjs            rebuild
     node scripts/build-nremt-flashcards.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slug as glossSlug } from './lib/glossary.mjs';
import { DOMAINS, GLOSSARY_DOMAIN, MNEMONIC_DOMAIN, REFERENCE_TABLES, FACTS } from './lib/nremt-flashcard-sources.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const NREMT = join(ROOT, 'nremt');
const OUT = join(NREMT, 'assets', 'flashcards.json');
const check = process.argv.includes('--check');

const errors = [];
const fail = (m) => errors.push(m);
const DOMAIN_KEYS = new Set(DOMAINS.map((d) => d.key));

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', minus: '−',
  deg: '°', rarr: '→', larr: '←', times: '×', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', ge: '≥', le: '≤' };
function toText(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&([a-zA-Z]+);/g, (m, e) => (e in ENTITIES ? ENTITIES[e] : m))
    .replace(/\s+/g, ' ')
    .trim();
}
function slug(text) {
  return text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}
const read = (f) => readFileSync(join(NREMT, f), 'utf8');

const cards = [];
const ids = new Set();
function push(card, where) {
  if (ids.has(card.id)) return fail(`${where}: duplicate card id ${card.id}`);
  if (!DOMAIN_KEYS.has(card.d)) return fail(`${where}: unknown domain "${card.d}"`);
  if (!card.q) return fail(`${where}: empty front`);
  if (!card.a.length || card.a.some(([, v]) => !v)) return fail(`${where}: empty back`);
  for (const s of [card.q, card.ask || '', ...card.a.flat()]) {
    // Text is escaped when it is drawn, so < and > are fine; a tag or an
    // entity means a page's markup leaked through toText().
    if (/<\/?[a-z][^>]*>|&[a-z]+;|&#\d+;/i.test(s)) fail(`${where}: markup left in card text: ${s.slice(0, 60)}`);
  }
  ids.add(card.id);
  cards.push(card);
}

// One domain per name, and no name filed twice.
function domainIndex(map, what) {
  const out = new Map();
  for (const [d, names] of Object.entries(map)) {
    if (!DOMAIN_KEYS.has(d)) fail(`${what}: unknown domain "${d}"`);
    for (const n of names) {
      if (out.has(n)) fail(`${what}: "${n}" is filed under both ${out.get(n)} and ${d}`);
      out.set(n, d);
    }
  }
  return out;
}

/* ---- 1. glossary --------------------------------------------------------- */
// The source the glossary page is generated from (scripts/build-nremt-glossary.mjs).
const glossSrc = JSON.parse(readFileSync(join(ROOT, 'nremt', 'data', 'glossary.json'), 'utf8'));
const glossDomain = domainIndex(GLOSSARY_DOMAIN, 'GLOSSARY_DOMAIN');
const glossSeen = new Set();
for (const { term, def } of glossSrc) {
  glossSeen.add(term);
  const d = glossDomain.get(term);
  if (!d) { fail(`glossary term "${term}" is not filed under a domain in GLOSSARY_DOMAIN`); continue; }
  push({ id: 'gl:' + slug(term), d, src: 'glossary', ask: 'Define the term', q: term, a: [['', def]],
    ref: ['glossary.html#t-' + glossSlug(term), 'Glossary'] }, `glossary "${term}"`);
}
if (glossSeen.size < 100) fail(`nremt/data/glossary.json: found only ${glossSeen.size} terms — has it changed shape?`);
for (const n of glossDomain.keys()) if (!glossSeen.has(n)) fail(`GLOSSARY_DOMAIN lists "${n}", which nremt/data/glossary.json no longer has`);

/* ---- 2. mnemonics -------------------------------------------------------- */
const mnHtml = read('mnemonics.html');
const mnDomain = new Map(Object.entries(MNEMONIC_DOMAIN));
const mnSeen = new Set();
for (const block of mnHtml.split(/<div class="card"[^>]*>/).slice(1)) {
  const h2 = block.match(/<h2>([\s\S]*?)<\/h2>/);
  if (!h2) continue;
  const title = toText(h2[1]);
  mnSeen.add(title);
  const d = mnDomain.get(title);
  if (!d) { fail(`mnemonic "${title}" is not filed under a domain in MNEMONIC_DOMAIN`); continue; }
  const usedFor = [...block.matchAll(/<div class="used-for">([\s\S]*?)<\/div>/g)].map((x) => toText(x[1]));
  const rows = [...block.matchAll(/<div class="row">([\s\S]*?)<\/div>/g)].map((r) => {
    const letter = r[1].match(/<span class="letter">([\s\S]*?)<\/span>/);
    const body = r[1].replace(/<span class="letter">[\s\S]*?<\/span>/, '');
    return [letter ? toText(letter[1]) : '', toText(body)];
  });
  if (!rows.length) { fail(`mnemonic "${title}": no rows found`); continue; }
  if (usedFor[1]) rows.push(['Note', usedFor[1]]);
  push({ id: 'mn:' + slug(title), d, src: 'mnemonic', ask: usedFor[0] || 'What does it stand for?', q: title, a: rows,
    ref: ['mnemonics.html', 'Mnemonics'] }, `mnemonic "${title}"`);
}
for (const n of mnDomain.keys()) if (!mnSeen.has(n)) fail(`MNEMONIC_DOMAIN lists "${n}", which mnemonics.html no longer has`);

/* ---- 3. reference tables ------------------------------------------------- */
const refHtml = read('reference-cards.html');
const refTables = [...refHtml.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)].map((t) =>
  [...t[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => toText(c[1]))));
for (const spec of REFERENCE_TABLES) {
  const t = refTables.find((rows) => rows.length && rows[0].join(' | ') === spec.head.join(' | '));
  if (!t) { fail(`reference table ${spec.id}: no table on reference-cards.html with header "${spec.head.join(' | ')}"`); continue; }
  for (const row of t.slice(1)) {
    push({ id: `rf:${spec.id}:${slug(row[0])}`, d: spec.domain, src: 'reference', ask: spec.ask, q: spec.front(row[0]),
      a: spec.head.slice(1).map((h, i) => [h, row[i + 1] || '']), ref: ['reference-cards.html', 'Reference cards'] },
    `reference ${spec.id} row "${row[0]}"`);
  }
}

/* ---- 4. authored facts --------------------------------------------------- */
const notes = JSON.parse(read('assets/study-notes.json'));
const SECTION = new Map();
for (const ch of notes.chapters) for (const s of ch.sections) SECTION.set(s.id, s.title);
for (const f of FACTS) {
  const where = `fact ${f.id}`;
  if (!/^[a-z0-9-]+$/.test(f.id || '')) { fail(`${where}: id must be lowercase letters, digits and dashes`); continue; }
  if (!SECTION.has(f.n)) { fail(`${where}: study-notes section "${f.n}" does not exist`); continue; }
  const a = typeof f.a === 'string' ? [['', f.a]] : f.a;
  push({ id: 'f:' + f.id, d: f.d, src: 'fact', ask: '', q: f.q, a, ref: ['study-notes.html#' + f.n, SECTION.get(f.n)] }, where);
}

if (errors.length) {
  for (const e of errors) console.error('FAIL: ' + e);
  process.exit(1);
}

// Domain order, then source order within it, so the deck deals related cards together.
const order = new Map(DOMAINS.map((d, i) => [d.key, i]));
const srcOrder = { mnemonic: 0, reference: 1, fact: 2, glossary: 3 };
const sorted = cards.map((c, i) => [c, i])
  .sort((x, y) => order.get(x[0].d) - order.get(y[0].d) || srcOrder[x[0].src] - srcOrder[y[0].src] || x[1] - y[1])
  .map(([c]) => c);

const text = '{"v":1,"domains":' + JSON.stringify(DOMAINS) + ',"cards":[\n' + sorted.map((c) => JSON.stringify(c)).join(',\n') + '\n]}\n';

const by = DOMAINS.map((d) => `${d.label} ${cards.filter((c) => c.d === d.key).length}`).join(', ');
const bySrc = ['glossary', 'mnemonic', 'reference', 'fact'].map((s) => `${cards.filter((c) => c.src === s).length} ${s}`).join(', ');
const summary = `${cards.length} cards (${bySrc}) — ${by}`;

if (check) {
  if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== text) {
    console.error('FAIL: nremt/assets/flashcards.json is stale. Run: node scripts/build-nremt-flashcards.mjs');
    process.exit(1);
  }
  console.log(`nremt/assets/flashcards.json is up to date — ${summary}.`);
} else {
  writeFileSync(OUT, text);
  console.log(`Wrote nremt/assets/flashcards.json — ${summary}.`);
}
