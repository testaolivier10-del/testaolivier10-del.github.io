/* Owns the <title> and og:title of every ochem lesson page, and nothing else
   about them.

   WHY THESE TWO LINES ARE GENERATED AND THE REST OF THE PAGE IS NOT
   -----------------------------------------------------------------
   A lesson page is hand-authored — its steps, its prose, its description and
   its structured data are written for that lesson and belong to it. Its title
   is not: it is the topic's name and its chapter's name, both of which already
   live in ochem/assets/curriculum.js, retyped into the page. Retyped facts
   drift, and these had, in the way retyped facts always do — quietly, and in
   a place nobody reads.

   Two things went wrong while they were retyped.

   The first is that a lesson and its notes page shipped identical titles. The
   curriculum has one name per topic and both pages used it the same way, so
   "pKa — Acids & Bases | Organic Chemistry" was the title of
   ochem/lessons/pka.html AND of ochem/notes/pka.html — 121 pairs of pages,
   each pair offering a search engine one title for two URLs. The engine
   resolves that by picking one and discounting the other, and which one it
   drops is not ours to choose. build-notes-pages.mjs now ends every notes
   title in a word a lesson title never contains; this file is the other half
   of that agreement.

   The second is capitalisation. The curriculum says "Nucleophilic acyl
   substitution" and the lesson page said "Nucleophilic Acyl Substitution";
   the curriculum says "Substrate & solvent effects" and the page said
   "Substrate & Solvent Effects". Nobody decided that, and the rail, the
   breadcrumb and the title of the same page disagreed about the name of the
   thing the reader was looking at. Generating the title from the curriculum
   settles it in the curriculum's favour, which is the copy a reader sees
   most.

   Length is handled the same way build-notes-pages.mjs handles it, with the
   same reasoning and the same ceiling: keep the chapter name while it fits,
   drop it when it doesn't, never let "Organic Chemistry" fall off the end.

     node scripts/build-lesson-meta.mjs            rewrite
     node scripts/build-lesson-meta.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

const TITLE_MAX = 60;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The ceiling is on what a reader sees, so it is measured on the decoded
   string: "Acids &amp; Bases" is fifteen characters in the result list and
   nineteen in the file. */
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

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

function titleFor(topic, mod) {
  /* The last candidate is the topic's name on its own. Two topics are named
     at a length where even " — Organic Chemistry" pushes them over, and for
     those the subject is better carried by the breadcrumb, the URL and the
     structured data than by three words a reader never sees because the
     result list cut them off. */
  const candidates = [
    `${topic.title} — ${mod.title} | Organic Chemistry`,
    `${topic.title} — Organic Chemistry Lesson`,
    `${topic.title} — Organic Chemistry`,
    topic.title,
  ];
  return candidates.find((c) => decode(c).length <= TITLE_MAX) ?? candidates[candidates.length - 1];
}

const modules = loadModules();
const stale = [];
let written = 0;
let seen = 0;

for (const mod of modules) {
  for (const topic of mod.topics) {
    /* A notes-only topic has no lesson file yet. That is a state the
       curriculum declares deliberately (notesOnly), not a missing file, so it
       is skipped rather than reported. build-notes-pages.mjs is the one that
       fails on a topic with no prose. */
    const file = join(ROOT, 'ochem', 'lessons', `${topic.id}.html`);
    if (!existsSync(file)) continue;
    seen++;

    const current = readFileSync(file, 'utf8');
    const title = esc(titleFor(topic, mod));

    let next = current.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
    next = next.replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${title}$2`);

    if (next === current) continue;
    if (check) { stale.push(topic.id); continue; }
    writeFileSync(file, next);
    written++;
  }
}

/* A title the generator itself cannot bring under the ceiling is a topic name
   long enough that no template helps — it needs a shorter name in the
   curriculum, which is an editorial decision, not one to make here. Report it
   rather than shipping a title that gets cut off. */
const over = [];
for (const mod of modules) {
  for (const topic of mod.topics) {
    const t = titleFor(topic, mod);
    if (decode(t).length > TITLE_MAX) over.push(`${topic.id} (${decode(t).length}): ${t}`);
  }
}
if (over.length) {
  console.error(`FAIL: ${over.length} lesson title(s) cannot fit in ${TITLE_MAX} characters:`);
  for (const o of over) console.error(`  ${o}`);
  console.error('Shorten the topic title in ochem/assets/curriculum.js.');
  process.exit(1);
}

if (check) {
  if (stale.length) {
    console.error(`FAIL: ${stale.length} lesson title(s) are stale: ${stale.slice(0, 8).join(', ')}${stale.length > 8 ? ', …' : ''}`);
    console.error('Run: node scripts/build-lesson-meta.mjs');
    process.exit(1);
  }
  console.log(`OK — all ${seen} lesson titles match the curriculum.`);
} else {
  console.log(`Rewrote ${written} of ${seen} lesson titles.`);
}
