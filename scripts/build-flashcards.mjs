/* Builds the ochem flashcard deck, ochem/assets/flashcards.json, out of what
   the course has already written.

   WHY GENERATED
   -------------
   A flashcard deck typed out by hand is a second copy of the course, and a
   second copy drifts: the notes get a pKa corrected or an IR range tightened
   and the card goes on teaching the old number. So the reference cards here
   are READ OUT OF THE NOTES — out of the tables each section already prints —
   by the rules in scripts/lib/flashcard-sources.mjs, which says which tables
   become cards and how each row is asked. The few cards no table can supply
   (named reactions the notes explain in prose) are authored in that same file.

   The deck has a third source that is NOT in this output: one card per
   concept, built in the browser from concepts.js and concept-teach.json, the
   same two files Practice teaches from. See ochem/assets/flashcards-page.js.

   WHAT IT CHECKS
   --------------
   Every rule has to find its table (by its header row, not by position), every
   row has to have a unique key, every topic has to exist in curriculum.js and
   have a notes file. Any of those failing stops the build — a table that was
   restructured should be looked at, not turned silently into nonsense cards.

     node scripts/build-flashcards.mjs            rebuild
     node scripts/build-flashcards.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { TABLES, AUTHORED } from './lib/flashcard-sources.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const OUT = join(ROOT, 'ochem', 'assets', 'flashcards.json');
const NOTES = join(ROOT, 'ochem', 'notes');

const errors = [];
const fail = (msg) => errors.push(msg);

/* ---- the curriculum, for topic validation -------------------------------- */
const sandbox = { window: {}, localStorage: { getItem: () => null, setItem() {} } };
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(ROOT, 'ochem', 'assets', 'curriculum.js'), 'utf8'), sandbox);
const TOPICS = new Set();
for (const m of sandbox.window.OchemCurriculum.MODULES) for (const t of m.topics) TOPICS.add(t.id);

function checkTopic(topic, where) {
  if (!TOPICS.has(topic)) fail(`${where}: topic "${topic}" is not in curriculum.js`);
  else if (!existsSync(join(NOTES, topic + '.html'))) fail(`${where}: ochem/notes/${topic}.html does not exist`);
}

/* ---- HTML helpers --------------------------------------------------------- */

// Cells keep the little markup chemistry needs (subscripts, superscripts,
// emphasis) and lose everything else. A cross-reference link keeps its text:
// on a card it would point somewhere mid-review, and the card already links
// to its section.
const KEEP = /^(sub|sup|b|i|em|strong)$/i;
function cleanHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (m, tag) => (KEEP.test(tag) ? m.replace(/\s[^>]*>/, '>') : ''))
    .replace(/\s+/g, ' ')
    .trim();
}

// A table cell sometimes points into the prose around it — "(next section)",
// "see below". On a card there is no below, so those pointers are cut from
// the card, and a cell that was nothing but a pointer is dropped from the
// answer. Ids are slugged from the cleaned text, so changing these patterns
// can change a key cell's id — check the diff of flashcards.json if you do.
function forCard(html) {
  return html
    .replace(/\s*<i>\((?:next section|later this chapter|see below|see above)\)<\/i>/gi, '')
    .replace(/\s*\((?:next section|later this chapter|see below|see above)\)/gi, '')
    .replace(/\bsee (?:below|above),\s*/gi, '')
    .trim();
}
const POINTER_ONLY = /^(?:see (?:below|above))\.?$/i;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ', ndash: '–', mdash: '—', minus: '−',
  deg: '°', rarr: '→', prime: '′', alpha: 'α', beta: 'β', gamma: 'γ', lambda: 'λ', Dagger: '‡', equiv: '≡',
  middot: '·', sup3: '³', asymp: '≈', times: '×' };
function toText(html) {
  return cleanHtml(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&([a-zA-Z]+\d*);/g, (m, e) => (e in ENTITIES ? ENTITIES[e] : m))
    .replace(/\s+/g, ' ')
    .trim();
}

// Stable, readable ids. Bond orders and charges are spelled out first so that
// C=C, C≡C and C–C, or HO⁻ and HO, cannot collapse to the same slug.
function slug(text) {
  return text
    .replace(/≡/g, ' triple ').replace(/=/g, ' double ')
    .replace(/[⁺+]/g, ' plus ').replace(/[⁻−]/g, ' minus ')
    .replace(/°/g, ' deg ').replace(/→/g, ' to ').replace(/&/g, ' and ')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/* ---- reading tables out of the notes ------------------------------------- */

const noteCache = new Map();
function tablesIn(topic) {
  if (noteCache.has(topic)) return noteCache.get(topic);
  const file = join(NOTES, topic + '.html');
  const html = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const out = [];
  for (const m of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)) {
    const rows = [...m[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
      .map((r) => [...r[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1]));
    // The heading a table sits under is the one line of context a card can
    // carry back to the section: "from: The carbonyl region in detail".
    const heads = [...html.slice(0, m.index).matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g)];
    out.push({ rows, under: heads.length ? toText(heads[heads.length - 1][1]) : '' });
  }
  noteCache.set(topic, out);
  return out;
}

function findTable(spec) {
  const want = spec.head.join(' | ');
  const matches = tablesIn(spec.topic).filter((t) => t.rows.length && t.rows[0].map(toText).join(' | ') === want);
  return matches[spec.nth || 0] || null;
}

/* ---- cards ----------------------------------------------------------------- */

const cards = [];
const ids = new Set();
const perTable = [];
const usedTables = new Map();   // topic -> Set of table objects used

function push(card, where) {
  if (ids.has(card.id)) { fail(`${where}: duplicate card id ${card.id} — make the key column(s) unique`); return; }
  if (!card.q || !toText(card.q)) { fail(`${where}: card ${card.id} has an empty front`); return; }
  if (!card.a.length || card.a.every(([, v]) => !toText(v))) { fail(`${where}: card ${card.id} has an empty back`); return; }
  ids.add(card.id);
  cards.push(card);
}

for (const spec of TABLES) {
  const where = `table ${spec.id} (notes/${spec.topic}.html)`;
  checkTopic(spec.topic, where);
  const table = findTable(spec);
  if (!table) {
    fail(`${where}: no table with header "${spec.head.join(' | ')}"${spec.nth ? ` (#${spec.nth + 1})` : ''}. ` +
         'Update the rule in scripts/lib/flashcard-sources.mjs to match the notes.');
    continue;
  }
  if (!usedTables.has(spec.topic)) usedTables.set(spec.topic, new Set());
  usedTables.get(spec.topic).add(table);

  const header = table.rows[0].map(toText);
  const body = table.rows.slice(1).filter((r) => r.some((c) => toText(c)));
  const before = cards.length;
  const base = { topic: spec.topic, src: 'table', from: table.under };

  if (header[0] === '') {
    // A comparison: each row is one attribute of the things in the columns.
    const things = header.slice(1);
    for (const row of body) {
      const label = cleanHtml(row[0]);
      push({
        id: `t:${spec.id}:${slug(toText(forCard(row[0])))}`, ...base, kind: 'compare',
        ask: spec.ask || things.join(' vs '),
        q: forCard(label),
        a: things.map((t, i) => [t, forCard(cleanHtml(row[i + 1] || ''))]).filter(([, v]) => !POINTER_ONLY.test(toText(v))),
      }, where);
    }
  } else {
    const keyCols = Array.isArray(spec.key) ? spec.key : [spec.key || 0];
    const groups = spec.pairs
      ? body.flatMap((r) => [r.slice(0, 2), r.slice(2, 4)]).filter((r) => r.length === 2 && toText(r[0]))
      : body;
    const head = spec.pairs ? header.slice(0, 2) : header;
    for (const row of groups) {
      const keyText = keyCols.map((i) => toText(forCard(row[i] || ''))).join(' ');
      const q = spec.front
        ? spec.front(keyCols.map((i) => cleanHtml(row[i] || '')))
        : keyCols.map((i) => forCard(cleanHtml(row[i] || ''))).join(spec.sep || ' · ');
      push({
        id: `t:${spec.id}:${slug(keyText)}`, ...base, kind: 'lookup',
        ask: spec.ask,
        q,
        a: head.map((h, i) => [(spec.labels && spec.labels[i]) || h, forCard(cleanHtml(row[i] || ''))])
          .filter((_, i) => !keyCols.includes(i))
          .filter(([, v]) => !POINTER_ONLY.test(toText(v))),
      }, where);
    }
  }
  perTable.push([spec.id, cards.length - before]);
}

for (const c of AUTHORED) {
  const where = `authored card ${c.id}`;
  checkTopic(c.topic, where);
  push({ id: `a:${c.id}`, topic: c.topic, src: 'authored', kind: 'lookup', ask: c.ask, q: c.q, a: c.a }, where);
}

// Tables in the notes that no rule reads. Not a failure — plenty of tables are
// not card-shaped — but worth seeing when a chapter adds one.
const unused = [];
for (const f of readdirSync(NOTES).filter((f) => f.endsWith('.html')).sort()) {
  const topic = f.replace(/\.html$/, '');
  const used = usedTables.get(topic) || new Set();
  tablesIn(topic).forEach((t, i) => { if (!used.has(t)) unused.push(`${topic}#${i + 1} (${t.rows[0] ? t.rows[0].map(toText).join(' | ') : ''})`); });
}

if (errors.length) {
  for (const e of errors) console.error('FAIL: ' + e);
  process.exit(1);
}

// One card per line, so a changed value shows up in a diff as one line.
const text = '{"v":1,"cards":[\n' + cards.map((c) => JSON.stringify(c)).join(',\n') + '\n]}\n';

const tableCards = cards.filter((c) => c.src === 'table').length;
const authoredCards = cards.length - tableCards;
const summary = `${cards.length} cards: ${tableCards} from ${perTable.length} notes tables, ${authoredCards} authored ` +
  '(plus one per concept, assembled in the browser)';

if (check) {
  if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== text) {
    console.error('FAIL: ochem/assets/flashcards.json is stale. Run: node scripts/build-flashcards.mjs');
    process.exit(1);
  }
  console.log(`ochem/assets/flashcards.json is up to date — ${summary}.`);
} else {
  writeFileSync(OUT, text);
  console.log(`Wrote ochem/assets/flashcards.json — ${summary}.`);
  if (process.argv.includes('--verbose')) {
    for (const [id, n] of perTable) console.log(`  ${String(n).padStart(3)}  ${id}`);
    if (unused.length) console.log(`\nNotes tables no rule reads (${unused.length}):\n  ` + unused.join('\n  '));
  }
}
