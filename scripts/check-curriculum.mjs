/* The curriculum's honesty check.

   TWO THINGS CAN GO QUIETLY WRONG in ochem/assets/curriculum.js, and both of
   them mislead a student rather than breaking a page — which is exactly the
   class of bug nothing else here would catch.

   1. A DEAD TOPIC. A topic whose `href` is null renders as a locked card with
      nothing behind it. That is defensible for a topic nobody has written
      yet; it is not defensible for one whose notes are already sitting in
      ochem/notes/, and it is actively harmful near the start of the course —
      "Skeletal structures" was locked while every later section was drawn in
      that notation. So: a topic must either point at an interactive lesson,
      or point at its own notes page AND be flagged `notesOnly: true`, which
      is what puts the "coming soon" label on every surface that lists it.
      A bare `href: null` is the failure.

   2. A LESSON THAT NAMES THE WRONG CHAPTER. Each lesson's eyebrow carries
      "Module N · Chapter title", typed in by hand, so inserting a module
      anywhere but the end silently invalidates every number below it.

   3. A MASTERY FIGURE THAT OVERSTATES THE COURSE. A topic with no interactive
      lesson can never be scored, so if such topics are left out of the
      mastery denominator the course can report 100% mastered while a section
      of it has never been measured at all. This check answers that by
      simulation rather than by reading the code: it fills in a perfect score
      for every lesson that exists and asserts the headline number still
      cannot reach 100 while any topic is untracked — and that it does reach
      100 once none are. So the guarantee holds however the averaging is
      rewritten later, and it lifts by itself when the last lesson ships.

     node scripts/check-curriculum.mjs            report
     node scripts/check-curriculum.mjs --check    exit non-zero on a failure (CI)
*/
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CURRICULUM = join(ROOT, 'ochem', 'assets', 'curriculum.js');

/* curriculum.js is a browser script, so it runs in a sandbox rather than
   being imported — the same approach build-notes-pages.mjs and the unit tests
   take. The fake localStorage is a plain object, which is what lets the
   mastery simulation below write progress and read the result back. */
function loadCurriculum(progress) {
  const store = { ochem_progress: JSON.stringify(progress || {}) };
  const sandbox = {
    window: {},
    document: {},
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(CURRICULUM, 'utf8'), sandbox);
  const C = sandbox.window.OchemCurriculum;
  if (!C || !Array.isArray(C.MODULES)) throw new Error('curriculum.js did not yield OchemCurriculum.MODULES');
  return C;
}

const failures = [];
const fail = (msg) => failures.push(msg);

const C = loadCurriculum();
const topics = C.MODULES.flatMap((m) => m.topics.map((t) => ({ mod: m, t })));

for (const fn of ['hasLesson', 'masteryCoverage', 'untrackedTopics', 'NOTES_ONLY_LABEL']) {
  if (C[fn] === undefined) fail(`curriculum.js no longer exports ${fn} — this check depends on it.`);
}
if (failures.length) {
  failures.forEach((f) => console.error(`FAIL: ${f}`));
  process.exit(1);
}

/* ---- 1. no topic is a dead end ---------------------------------------- */

for (const { mod, t } of topics) {
  const where = `${mod.id}/${t.id}`;
  if (!t.href) {
    fail(`${where} has href: null. Point it at its notes page with notesOnly: true `
       + `(which labels it "${C.NOTES_ONLY_LABEL}"), or at its interactive lesson.`);
    continue;
  }
  const target = join(ROOT, 'ochem', t.href);
  if (!existsSync(target)) fail(`${where} points at ochem/${t.href}, which does not exist.`);

  /* Where the href points decides what it IS, so the flag cannot be dropped
     without the check noticing. Without this, deleting `notesOnly` from a
     topic whose href is a notes page would silently promote that page to an
     interactive lesson: it would start being counted as tracked, the "coming
     soon" label would vanish, and the mastery ceiling would go back up to
     100 — the exact overstatement this file exists to prevent, arrived at by
     removing a line rather than adding one. */
  const pointsAtNotes = t.href.startsWith('notes/');
  const pointsAtLesson = t.href.startsWith('lessons/') || t.href.startsWith('mechanisms/');
  if (!pointsAtNotes && !pointsAtLesson) {
    fail(`${where} points at ochem/${t.href}, which is neither a notes page nor a lesson.`);
  }
  if (pointsAtNotes && !t.notesOnly) {
    fail(`${where} points at a notes page but is not flagged notesOnly: true, so it is being `
       + `counted as an interactive lesson a student can be scored in. Add the flag, or point `
       + `it at the lesson.`);
  }
  if (pointsAtLesson && t.notesOnly) {
    fail(`${where} is flagged notesOnly but points at the lesson ${t.href}. Drop the flag.`);
  }

  // Every topic has written notes; a notes-only topic must point at its own.
  const notes = join(ROOT, 'ochem', 'notes', `${t.id}.html`);
  if (!existsSync(notes)) fail(`${where} has no notes page at ochem/notes/${t.id}.html.`);

  if (!C.hasLesson(t)) {
    if (!t.notesOnly) {
      fail(`${where} has no interactive lesson but is not flagged notesOnly: true, `
         + `so nothing tells a reader the lesson is still coming.`);
    }
    if (t.href !== `notes/${t.id}.html`) {
      fail(`${where} is notes-only, so its href should be notes/${t.id}.html, not ${t.href}.`);
    }
    // The label has to actually reach the reader, not just exist as a string.
    const page = existsSync(notes) ? readFileSync(notes, 'utf8') : '';
    if (!page.includes(C.NOTES_ONLY_LABEL)) {
      fail(`${where} is notes-only but ochem/notes/${t.id}.html does not carry the `
         + `"${C.NOTES_ONLY_LABEL}" label. Run: node scripts/build-notes-pages.mjs`);
    }
  } else if (t.notesOnly) {
    fail(`${where} is flagged notesOnly but its href (${t.href}) is not its notes page.`);
  }
}

/* ---- 2. a lesson's eyebrow names the chapter it is actually in --------- */

/* Each lesson used to open with "Module N · Chapter title", typed into the
   page by hand. Insert a module anywhere but the end and every number after
   it was wrong — 47 of them were, the moment Nomenclature went in at
   position 3 — and nothing about that broke: the page rendered, the links
   worked, and a student read a chapter number that disagreed with the
   contents rail.

   So the number is gone from the source. The eyebrow now carries only the
   chapter's id and title, and ochem-nav.js prefixes "Chapter N" at runtime
   from the curriculum, which is the one place the position cannot go stale.
   What this check holds is the part that is still typed by hand: the id has
   to be the chapter the lesson actually belongs to, and the title has to be
   that chapter's title. A page that carries no eyebrow at all is not a
   failure (a page that has one with a number in it is — scripts/check-site.mjs
   fails on any hard-coded chapter number in reader-facing text). */
for (const { mod, t } of topics) {
  if (!C.hasLesson(t)) continue;
  const file = join(ROOT, 'ochem', t.href);
  if (!existsSync(file)) continue;
  const m = readFileSync(file, 'utf8').match(/class="eyebrow" data-chapter="([a-z0-9-]+)">([^<]*)</);
  if (!m) continue;
  // The title is compared with entities decoded, since the page writes
  // "Alkanes &amp; Conformations" for the curriculum's "Alkanes & Conformations".
  const shown = m[2].replace(/&amp;/g, '&').trim();
  if (m[1] !== mod.id) {
    fail(`${mod.id}/${t.id}: its eyebrow says data-chapter="${m[1]}" but the lesson is in "${mod.id}".`);
  }
  if (shown !== mod.title) {
    fail(`${mod.id}/${t.id}: its eyebrow says "${shown}" but the chapter is "${mod.title}".`);
  }
}

/* ---- 2b. every prerequisite is taught before the topic that needs it ---- */

/* dependsOn is what the "review this first" recommendation and the concept
   map are built from, so a prerequisite that sits LATER in the course is a
   recommendation to read ahead — and a sign that the chapter order and the
   dependency graph disagree. The proposed-order pass moved eleven lessons
   precisely to make this true everywhere; this keeps it true. */
{
  const seen = new Set();
  for (const { mod, t } of topics) {
    for (const dep of t.dependsOn || []) {
      if (!seen.has(dep)) {
        const known = topics.some(({ t: o }) => o.id === dep);
        fail(known
          ? `${mod.id}/${t.id} depends on ${dep}, which is taught AFTER it. Move one of them, or drop the dependency.`
          : `${mod.id}/${t.id} depends on ${dep}, which is not a topic in the curriculum.`);
      }
    }
    seen.add(t.id);
  }
}

/* ---- 3. mastery cannot reach 100% while a topic is untracked ----------- */

const coverage = C.masteryCoverage();
if (coverage.total !== topics.length) {
  fail(`masteryCoverage() counts ${coverage.total} topics but the curriculum has ${topics.length}.`);
}

/* The best a student could possibly do: every lesson that exists, completed
   with a perfect score. Anything short of 100 from here is the untracked
   topics, which is the point. */
const perfect = {};
for (const { t } of topics) {
  if (C.hasLesson(t)) perfect[t.id] = { step: 0, correct: 1, attempts: 1, completed: true, bestScore: 100 };
}
const best = loadCurriculum(perfect).overallMastery();

if (coverage.untracked > 0) {
  if (best === 100) {
    fail(`overall mastery reaches 100% with ${coverage.untracked} topic(s) untracked `
       + `(${C.untrackedTopics().map((t) => t.id).join(', ')}). An untracked topic must count `
       + `against the total, or the course reports mastery of something it never measured.`);
  }
  // A module containing an untracked topic must not read 100% either.
  for (const mod of C.MODULES) {
    if (!C.masteryCoverage(mod).untracked) continue;
    const pct = loadCurriculum(perfect).moduleMastery(mod);
    if (pct === 100) fail(`chapter "${mod.title}" reads 100% mastery while it contains an untracked topic.`);
  }
} else if (best !== 100) {
  /* Every topic is tracked, so a perfect run must read 100. Without this the
     check would pass forever by simply making mastery unreachable. */
  fail(`every topic is tracked, but a perfect run reports ${best}% rather than 100%.`);
}

/* ---- report ------------------------------------------------------------ */

if (failures.length) {
  failures.forEach((f) => console.error(`FAIL: ${f}`));
  process.exit(1);
}

const untracked = C.untrackedTopics().map((t) => t.id);
console.log(`OK — ${coverage.total} topics, ${coverage.tracked} with an interactive lesson.`);
console.log(untracked.length
  ? `     ${untracked.length} notes-only and labeled: ${untracked.join(', ')} `
    + `(a perfect run reads ${best}%, not 100%).`
  : '     every topic is tracked, and a perfect run reads 100%.');
