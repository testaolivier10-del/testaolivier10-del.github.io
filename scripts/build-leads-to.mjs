/* Owns the "Builds on" and "Leads to" rows under every ochem lesson and
   mechanism page, and nothing else about them.

   WHY THESE ROWS ARE GENERATED
   ----------------------------
   Both rows are a restatement of one fact that already lives in
   ochem/assets/curriculum.js: each topic's `dependsOn`. "Builds on" is that
   list read forwards; "Leads to" is the same graph read backwards — every
   topic whose dependsOn names this one. ochem.css has said since the rows
   were introduced that they were "generated into the page from curriculum.js
   dependsOn". They were not. They were typed, one page at a time, and a
   retyped graph drifts the way a retyped title does (build-lesson-meta.mjs
   has that story):

   - Many "Leads to" rows listed PREREQUISITES mixed in with what follows.
     Carbohydrates "led to" Acetals, Lipids to Esters & amides and
     Hydrogenation, Grignard reagents to Nucleophilic addition, What a polymer
     is to Nucleophilic acyl substitution — every one a topic the page
     depends on. A student who followed one went backwards.
   - The rest had been written against an earlier graph and never updated as
     it grew. Resonance "led to" four topics; eleven depend on it. Nucleophilic
     addition "led to" four; thirteen do.
   - Nineteen lessons had no "Leads to" row at all, and fifty-three no "Builds
     on" row, including Lewis structures, which five topics depend on.
   - Three different link formats and two different separators, because each
     batch of pages copied whichever page was open at the time.

   So the rows are derived now, and the only way to change what a page says
   leads where is to change the curriculum — which is also what the course
   map, the "review this first" recommendation and the concept graph read.

   WHAT EACH ROW SAYS
   ------------------
   Builds on   the topic's dependsOn, in the order it is declared. The author
               of that list ordered it; there is no better order to impose.
   Leads to    the topics whose dependsOn include this one, in curriculum
               order — the order a student meets them.
   Next        ONLY when nothing depends on this topic: the next topic in the
               curriculum, so the page is not a dead end. It is labelled
               "Next", not "Leads to", on purpose. Twenty-six topics are leaves
               of the graph (UV-Vis, Mass spectrometry, Prochirality, …),
               and writing "Leads to" over whatever happens to follow them
               would be the same false claim this file exists to remove. The
               notes pages make the same "Previous / Next" walk in the same
               order (build-notes-pages.mjs), so the word already means this
               on the site. The last topic in the course gets no row.
   A topic with no dependsOn (Atomic structure) gets no "Builds on" row; an
   empty row would be a label pointing at nothing.

   The rows go directly after "Read", which stays first because it is the
   link check-site.mjs requires (the page's only static way to the prose).
   The "Lesson" and "Mechanism" rows that pair a mechanism page with its
   lesson are left alone: they are not derived from the graph.

   WHICH PAGES
   -----------
   Every page under ochem/lessons/ whose name is a topic id, and every page
   under ochem/mechanisms/. A mechanism page belongs to the topic whose
   written section it links to in its "Read" row (addition.html reads
   notes/addition-reactions.html, so it is Addition reactions); four of them
   (SN2, SN1, E2, E1) are that topic's href outright. A mechanism page and
   its lesson therefore always agree about where the topic sits.

   The notes pages under ochem/notes/ have no such rows — build-notes-pages.mjs
   already gives them Previous / Next in curriculum order — so they are not
   touched here.

   Links are written as "../" + the topic's href, because every page this
   touches is one directory below ochem/ and hrefs in curriculum.js are
   relative to ochem/. A topic taught on a mechanism page (SN2) is therefore
   linked there, not at a lessons/ path that does not exist.

     node scripts/build-leads-to.mjs            rewrite
     node scripts/build-leads-to.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function loadModules() {
  const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} }, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(
    readFileSync(join(ROOT, 'ochem', 'assets', 'curriculum.js'), 'utf8') +
    '\nthis.M = (typeof MODULES !== "undefined") ? MODULES : (window.OchemCurriculum && window.OchemCurriculum.MODULES);',
    sandbox,
  );
  if (!Array.isArray(sandbox.M)) throw new Error('curriculum.js did not yield a MODULES array');
  return sandbox.M;
}

const topics = loadModules().flatMap((m) => m.topics);
const byId = new Map(topics.map((t) => [t.id, t]));

/* A dependsOn entry that names no topic would render as a link to nothing.
   check-curriculum.mjs owns that rule; this only refuses to write through it. */
for (const t of topics) {
  for (const d of t.dependsOn || []) {
    if (!byId.has(d)) {
      console.error(`FAIL: ${t.id} dependsOn "${d}", which is not a topic in curriculum.js.`);
      process.exit(1);
    }
  }
}

const link = (t) => `<a href="../${t.href}">${esc(t.title)}</a>`;
const row = (label, list) =>
  `  <div class="lesson-links-row"><span class="lesson-links-label">${label}</span><span class="lesson-links-list">${list.map(link).join('')}</span></div>`;

function rowsFor(topic) {
  const out = [];
  const pre = (topic.dependsOn || []).map((id) => byId.get(id));
  if (pre.length) out.push(row('Builds on', pre));
  const post = topics.filter((t) => (t.dependsOn || []).includes(topic.id));
  if (post.length) {
    out.push(row('Leads to', post));
  } else {
    const next = topics[topics.indexOf(topic) + 1];
    if (next) out.push(row('Next', [next]));
  }
  return out;
}

const NAV_OPEN = '<nav class="lesson-links xshell" aria-label="Related lessons">';
const OWNED = new Set(['Builds on', 'Leads to', 'Next']);
const LABEL = /^\s*<div class="lesson-links-row"><span class="lesson-links-label">([^<]*)<\/span>/;

/* Rewrites the nav's rows: keeps every row this file does not own, in the
   order it had them, and puts the generated rows straight after "Read". */
function rewrite(html, topic, rel) {
  const a = html.indexOf(NAV_OPEN);
  if (a === -1) throw new Error(`${rel}: no .lesson-links nav to write into.`);
  const b = html.indexOf('</nav>', a);
  const inner = html.slice(a + NAV_OPEN.length, b);
  const lines = inner.split('\n').filter((l) => l.trim());
  for (const l of lines) {
    if (!LABEL.test(l)) throw new Error(`${rel}: unexpected line in the .lesson-links nav: ${l.trim().slice(0, 80)}`);
  }
  const kept = lines.filter((l) => !OWNED.has(l.match(LABEL)[1]));
  const readAt = kept.findIndex((l) => l.match(LABEL)[1] === 'Read');
  if (readAt === -1) throw new Error(`${rel}: the .lesson-links nav has no "Read" row.`);
  kept.splice(readAt + 1, 0, ...rowsFor(topic));
  return html.slice(0, a + NAV_OPEN.length) + '\n' + kept.join('\n') + '\n' + html.slice(b);
}

const pages = [];
for (const name of readdirSync(join(ROOT, 'ochem', 'lessons')).sort()) {
  if (!name.endsWith('.html')) continue;
  const topic = byId.get(name.slice(0, -5));
  /* A page under lessons/ that is not a topic is not part of the graph, so
     there is nothing to say about what it builds on. */
  if (topic) pages.push({ rel: `ochem/lessons/${name}`, topic });
}
for (const name of readdirSync(join(ROOT, 'ochem', 'mechanisms')).sort()) {
  if (!name.endsWith('.html')) continue;
  const rel = `ochem/mechanisms/${name}`;
  const html = readFileSync(join(ROOT, rel), 'utf8');
  const m = html.match(/<span class="lesson-links-label">Read<\/span><span class="lesson-links-list"><a href="\.\.\/notes\/([a-z0-9-]+)\.html"/);
  const topic = m && byId.get(m[1]);
  if (!topic) {
    console.error(`FAIL: ${rel} has no "Read" row naming a curriculum topic, so there is no way to tell which topic it belongs to.`);
    process.exit(1);
  }
  pages.push({ rel, topic });
}

const stale = [];
let written = 0;
for (const { rel, topic } of pages) {
  const file = join(ROOT, rel);
  const current = readFileSync(file, 'utf8');
  const next = rewrite(current, topic, rel);
  if (next === current) continue;
  if (check) { stale.push(rel); continue; }
  writeFileSync(file, next);
  written++;
}

if (check) {
  if (stale.length) {
    console.error(`FAIL: ${stale.length} page(s) have "Builds on" / "Leads to" rows that disagree with the curriculum: ${stale.slice(0, 8).join(', ')}${stale.length > 8 ? ', …' : ''}`);
    console.error('Run: node scripts/build-leads-to.mjs');
    process.exit(1);
  }
  console.log(`OK — the "Builds on" / "Leads to" rows on all ${pages.length} lesson and mechanism pages match the curriculum.`);
} else {
  console.log(`Rewrote the related-topic rows on ${written} of ${pages.length} lesson and mechanism pages.`);
}
