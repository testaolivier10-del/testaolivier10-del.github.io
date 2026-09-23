/* A byte budget for the pages that matter.

   This site has argued carefully about weight before. Splitting the question
   bank in two took the first question on screen from 4467 ms to 2394 ms on a
   throttled connection; the two typefaces were pulled off Google's CDN to save
   a third-party round trip before first paint. Those were real decisions with
   measured results, and nothing defended them afterwards. The next commit that
   adds a 300 KB script to the shared header undoes the font work and nobody
   notices, because a page that got slower still looks exactly the same.

   So: what a page costs on arrival, against a number written down.

   WHAT IS COUNTED
   ---------------
   The HTML plus every same-origin stylesheet, script and font it references,
   gzipped, because that is what crosses the wire. Scripts count even though
   every one of them is deferred — deferred means "does not block the parser",
   not "free": it is still downloaded during load and still has to arrive
   before anything on the page responds.

   Not counted: images, which are decorative or lazy; and anything fetched
   later by JavaScript, which is a different budget and often a deliberate one.
   The 2.3 MB question bank is fetched after paint precisely so that it is not
   in this number, and folding it in here would erase the distinction that work
   was for.

   THREE BUCKETS, NOT ONE NUMBER
   -----------------------------
   Every page loads the same shell: theme.css, the two typefaces, account.js,
   site-chrome.js and the rest of /assets/. That is most of a first visit and
   nothing at all on every visit after, since it is one cache entry for the
   whole site. Counted into all twelve page budgets it would put every page
   within a few KB of every other — exactly the resolution at which a
   page-specific regression disappears. So:

     site      /assets/**             shared by every page, both courses
     course    <course>/assets/**     shared by every page of one course
     page      the HTML, plus whatever is neither of those

   Each shell is budgeted once. Each page is budgeted on its own bytes, which
   is the number that actually moves when somebody adds something to it.

   THE NUMBERS ARE A RATCHET
   -------------------------
   Same rule as the answer-tell check in check-site.mjs: lower a budget when a
   page gets lighter, never raise one to make a build pass. Raising one is a
   decision to make the site slower — fine occasionally, and worth a sentence
   in the commit message saying why.

     node scripts/check-weight.mjs            report everything, pass or fail
     node scripts/check-weight.mjs --check    exit non-zero if over (CI)
*/
import { readFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');

/* Measured, then rounded up by roughly a tenth. Not round numbers on purpose:
   a budget picked for looking tidy has slack built into it that nobody knows
   is there, and the first regression spends it silently.

   About 130 KB of the site shell is the two typefaces, which are woff2 and so
   already compressed — gzip does nothing to them and they are the floor this
   number cannot go below without dropping a weight or a character set. The
   rest, ~95 KB, is theme.css and the shared modules, and that is the part any
   commit can move. */
const SHELL_BUDGETS = [
  ['site', 240],
  ['nremt', 7],
  /* 92 -> 96. This is a first-paint cost on EVERY ochem page, so it is worth
     saying what moved rather than just moving the number: the course went from
     64 topics to 83 across four new chapters, and three shared files grew with
     it — concepts.js (64 concepts to 84), curriculum.js (one entry per topic)
     and lesson-concepts.js (one entry per lesson). That is the shell doing its
     job rather than a regression.

     96 -> 108 across five chapters, and the growth is still proportional:
     the course went from 83 topics to 108, so concepts.js (84 -> 110),
     curriculum.js and lesson-concepts.js each gained twenty-five entries.
     About 1.4 KB gzipped per chapter, which is what a chapter of course map
     costs and is the number to check against the next time this is raised.
     Phase 3 is finished at this point, so the next raise should be treated
     as a question rather than a formality.

     108 -> 112, asked as a question rather than taken. Phase 4 deepens four
     existing chapters by two sections each, so this is eight topics, not a
     chapter — and it costs about the same 1.4 KB gzipped per pair that a
     chapter of course map cost above, because the per-topic content is the
     same three entries. The measured overrun at 112 topics was 0.8 KB, so 4
     KB covers the remaining three pairs with room to spare and this should
     be the last raise of Phase 4.

     112 -> 116, and the paragraph above was wrong. It predicted 4 KB would
     cover three more pairs; two pairs used it up and the third went 1.4 KB
     over. The error was in the per-pair figure, not the arithmetic: a pair
     costs closer to 1.8 KB than 1.4, because these eight concepts carry
     longer `teach` strings than the Phase 3 ones did — they are corrections
     to ideas the course already taught, so each has to say what the earlier
     statement got wrong as well as what is true. That is content doing its
     job, but it means per-topic cost is not the constant the earlier note
     assumed, and a future estimate should be measured rather than
     extrapolated.

     This is the last raise in the phase because the phase is finished at 116
     topics, not because the headroom is comfortable. The next chapter that
     lands should take the teach-string saving instead: moving those strings
     to a fetched file roughly halves concepts.js, at the cost of one request
     on the pages that actually surface a teach block, and it is worth more
     now than when it was first noted because the strings have grown.

     116 -> 102, DOWN, because the teach-string saving above was taken. The
     118 `teach` strings now live in ochem/assets/concept-teach.json and are
     fetched by session-runner.js on the two pages that render one, so
     concepts.js went from 113 KB to 54 KB on disk and the shell measured
     92.8 KB gzipped afterwards. The budget is a ratchet, so it follows the
     measurement down: 102 is that number plus the same tenth of headroom
     every other budget here carries. The next chapter costs what it costs
     without the prose — nearer 1 KB gzipped than the 1.8 measured above.

     The remaining obvious saving, if one is ever needed, is that
     ochem/index.html loads lesson-concepts.js for one call in ochem-home.js;
     splitting that call out would take 4.4 KB off the home page, though not
     off this number, since the lessons still load the file. */
  /* 102 -> 103, and this one is small enough to be worth stating plainly
     rather than absorbing. Practice questions can now carry a structure
     drawn above the stem, and the machinery for that lands in two shared
     files: a `register` hook in molecules.js so a second record file can
     join the same lookup table, and the .q-molecule sizing rules in
     ochem.css. Together they measured 0.5 KB gzipped, which put the shell
     0.1 KB over a budget that had 0.4 KB of headroom. The records
     themselves are NOT here — they are in question-molecules.js, which only
     practice.html and review.html load and which has its own line in the
     data budgets below. So this raise buys the hook, not the content, and
     the content cannot come back to this number later. */
  /* 103 -> 104 for the flashcard deck, and only for the part of it that has
     to be on every ochem page: the sync merge for its schedule and the XP rule
     in ochem-xp.js. The merge cannot live on the deck page alone — an account
     push replaces the whole 'ochem' bucket with what the current page
     registered, so a key only the deck page knew about would be deleted from
     the account by the next sync from any lesson. Measured 103.2 KB after the
     comments were cut down; the deck itself (page script, scheduler, cards)
     is on flashcards.html's own lines below, not here. */
  /* 104 -> 105 for two tetrahedral intermediates in molecules.js. The
     acyl-substitution and Claisen mechanism pages drew their collapse step
     on the starting materials, because no intermediate existed to draw it
     on; a student was asked to eject a leaving group from a molecule that
     had no bond to it. The records live in the shared library because the
     mechanism pages look molecules up there. Measured 104.5 KB. */
  ['ochem', 105],
  /* The A&P course runtime (anp-core, questions, nav, glossary tooltips,
     anp.css) plus whichever app or tool script the page loads. Measured
     37.3 KB at the Phase 1 pilot. */
  ['anatomy-physiology', 42],
];

/* One entry per page whose weight is worth defending, which is not the same as
   every page. These are the doors people come in through and the pages they
   spend time on; a budget on all 180 would be 180 numbers nobody maintains. */
const BUDGETS = [
  // The front doors. A first-time visitor's whole impression of whether this
  // site is fast is formed on one of these three.
  ['index.html', 6],
  ['nremt/index.html', 9],
  /* 10 -> 11. The home page lists every chapter's topics, so it grows by a
     line of markup each time the course gains a section; the generated list
     crossed 10 KB gzipped when the reactivity chapter gained its energy-
     diagrams section. Nothing on the page got heavier per topic — there are
     simply more topics — and the saving noted above (splitting the one
     lesson-concepts.js call out of ochem-home.js, worth about 4.4 KB) is
     still available if this ever needs to come back down. */
  ['ochem/index.html', 11],

  // The busiest page on the site, and the one the bank split was for.
  ['nremt/practice.html', 38],

  // Long reading pages. study-notes.html was forty chapters of prose in one
  // file — 172 KB gzipped, every reader downloading forty chapters to read
  // one — and the note here said the fix was to move CHAPTERS into a fetched
  // JSON file rather than raise the budget again. That is now done: the page
  // is an 18 KB shell and the chapters are 144 KB of JSON fetched alongside
  // it, budgeted under DATA_BUDGETS below. First paint no longer waits on
  // thirty-nine chapters nobody asked for.
  ['nremt/study-notes.html', 20],
  ['nremt/glossary.html', 10],

  // Added when the scenario set went from eight cases to twenty-five and the
  // page went from 73 KB to 168 KB raw. Measured at 46.5 KB gzipped and
  // budgeted at 50. Like study-notes.html, every case is inline and a reader
  // who opens one downloads all twenty-five; if this number needs to move
  // again, move the data out of the page instead.
  ['nremt/scenario-sim.html', 50],
  // learn.html is a shell whose only real weight is the static table of
  // contents generated into it for readers without JavaScript — one line per
  // section. It crossed 3.0 KB when the IUPAC Nomenclature chapter added four
  // sections, so the budget follows the book: this is the contents list doing
  // its job, not the page getting heavier per section. If it needs moving
  // again for any reason OTHER than new sections, find out why first.
  // Raised to 5 KB when the self-study pass added four sections (energy
  // diagrams, carbocations, cis/trans & E/Z, prochirality): 121 lines now.
  ['ochem/learn.html', 5],

  // One textbook section, standing in for the other 120. They became real
  // pages when the ochem prose was made readable without JavaScript
  // (scripts/build-notes-pages.mjs); hybridization.html is the largest of
  // them, so a budget here defends the worst case rather than a typical one.
  // The median section is 5.9 KB.
  //
  // Raised from 18 to 19. Two things, of which only one is a decision. The
  // page had already drifted from the 17.0 KB this budget was set against to
  // 17.9 as its prose grew, which nothing flagged because it was still under.
  // The decision is the remaining 0.36 KB: every notes page now carries a
  // LearningResource and a BreadcrumbList, which is what the lesson pages have
  // always had and what made the written half of the course legible to a
  // search engine as something other than undifferentiated HTML. That is worth
  // a third of a kilobyte on the largest of them. If this needs moving again,
  // check whether the prose grew before assuming the structured data did.
  ['ochem/notes/hybridization.html', 19],

  // Search. Both build a large index at runtime; this is the shell, not the
  // corpus, for the same reason as practice.html above.
  ['nremt/search.html', 6],
  ['ochem/search.html', 8],

  // One lesson and one mechanism, standing in for the 68 pages built on the
  // same engine. If these grow, they all did.
  ['ochem/lessons/pka.html', 6],
  // e2.html sat at 10232 bytes and the ceiling is 10240, so the empty
  // <div class="course-nav"></div> every course page now ships — 30 bytes
  // raw, 8 gzipped — landed exactly on it. That div is the second chrome row
  // reserving its own height instead of being inserted by script and pushing
  // the page down 47px; on this page's own measurements it takes the layout
  // shift from 0.44 to 0.37, and on the tool pages from 0.85 to 0.10. Eight
  // bytes for that is the right trade. Raised to 11 to leave the page the
  // headroom it had before, not to let it grow.
  ['ochem/mechanisms/e2.html', 11],

  // The flashcard deck. Its styles are inline, since no other page draws a
  // card; its scripts (flashcards-page.js, flashcard-scheduler.js) sit in
  // ochem/assets/ and so are measured in the ochem shell when reached from
  // here, which is why the shell's largest measurement still comes from a
  // lesson rather than from this page.
  ['ochem/flashcards.html', 5],
  ['anatomy-physiology/index.html', 5],
  ['anatomy-physiology/lessons/heart-chambers-valves.html', 10],
  ['anatomy-physiology/notes/cardiac-cycle.html', 19],
  ['anatomy-physiology/tools/predict.html', 3],
  ['anatomy-physiology/tools/lab-practical.html', 3],
  ['anatomy-physiology/exams.html', 3],

  // The privacy policy: the page that has to load well for somebody who has
  // not decided yet whether to trust the site.
  //
  // Raised from 10 when study reminders were added. This page carries the
  // switch for them and the prose explaining exactly what is stored, and both
  // of those belong here rather than anywhere else — the cost is a page that
  // tells the truth at greater length, which is the one thing this page is for.
  ['privacy.html', 12],
];

/* Files fetched at RUNTIME by JavaScript, which the reference walk above
   cannot see: nothing links to them with href or src, so they were invisible
   to this check and could grow without limit. That was already true of the
   question banks; splitting the study notes out of their page made it true of
   the largest single body of prose on the site as well.

   These are not first-paint costs — every one of them is fetched after the
   page is usable, which is the entire point of moving them out. The budget is
   here so that "it is fetched separately" does not quietly become "it is
   unbounded". Measured, then rounded up by roughly a tenth, same as above. */
const DATA_BUDGETS = [
  // The forty chapters, fetched by study-notes.html.
  ['nremt/assets/study-notes.json', 158],
  // What practice.html waits on before it can ask anything.
  ['nremt/assets/questions-core.json', 320],
  // And what it fetches straight afterwards, without blocking.
  ['nremt/assets/explanations.json', 444],
  // The assistant's teaching index for each course.
  ['nremt/assets/tutor-bank.json', 528],
  /* The ochem index grows with the course itself — it is generated from the
     notes and the question bank — so it moves every time a chapter lands.
     Unlike practice-bank.json above, this one is genuinely not a first-paint
     cost: it is fetched only when a reader opens the assistant. Budgeted with
     this file's usual ~10% headroom rather than held to the measured value,
     so a chapter does not fail the build for the index doing its job. */
/* 200 -> 212 for Phase 4's eight sections, on the same reasoning as above:
     fetched only when a reader opens the assistant, and budgeted with this
     file's usual headroom so a pair of sections does not fail the build.

     212 -> 264 for the self-study rewrite, and the reason is the same one
     written against practice-bank-why.json below: this index is built from
     the `why` field of every bank question, so rewriting recall items into
     application ones grows it for exactly the reason it should. Chapter 4
     alone took it from 211 to 224 KB. The alternative was to shorten worked
     solutions to fit a number, which is the budget doing harm to the
     teaching. Nothing blocks on this file — it is fetched only when a reader
     opens the assistant — so its cost is bytes on an idle connection. 264
     covers the chapters still to be rewritten at the measured ~13 KB each
     for the four largest, and it is still a ceiling: lower it when the
     rewrite finishes and the real number is known.

     264 -> 268 for the chapter 18 (Synthesis & Retrosynthesis) review pass.
     The ceiling had been sitting at exactly 264.0 measured, so the five
     definition-recall retrosynthesis items rewritten into disconnection,
     polarity and step-order reasoning items — plus the corrected
     anti-Markovnikov-halide rationale, which has to say why the peroxide
     effect is bromide-only — pushed it 1.1 KB over. That is the growth this
     budget's own note says it exists to allow rather than to shorten away.
     Set to 300 rather than 268 so the last four chapters of the pass do not
     each need their own bump; lower it once the pass is over.

     300 -> 314 for the three banks the self-study pass left open: 90 recall
     items in Oxidation & Reduction and Spectroscopy replaced by worked
     application and data-to-structure items, and the 100 one-line
     explanations in the enolate sections rewritten to say why the key is
     right and why each tempting distractor is wrong. A one-line explanation
     was under this index's 80-character floor and never reached it; the
     rewritten ones do, which is the point. Measured 312.9 KB; about 1 KB of
     headroom, not a round number, so the next pass still has to argue for
     its own bytes.

     314 -> 315 for the accuracy review: about 90 bank items corrected
     where they taught something wrong (a reversed mechanism, a misnamed
     structure, a pKa off by ten units). A correction usually says why the
     old claim fails, so it runs a sentence longer. Measured 314.1 KB. */
  ['ochem/assets/tutor-bank.json', 315],
  /* Ochem's question bank, now split in two (scripts/build-ochem-bank.mjs).

     The core is what practice.html and review.html WAIT on before their first
     screen, so every kilobyte of it is first-paint latency on those two pages.
     It had climbed 268 -> 280 -> 292 KB as three chapters landed, which is why
     the split happened; it is 168 KB now and has six more chapters of room.

     The explanations are fetched straight afterwards and block nothing —
     nothing reads one until somebody has already answered something — so that
     half is budgeted as ordinary background data.

     practice-bank.json itself is the SOURCE the two are generated from. It is
     no longer fetched by anything at runtime, so it has no budget: adding one
     would be budgeting a file no reader downloads. */
/* 204 -> 216 and 148 -> 156 for Phase 4. Each pair of sections adds 60
     questions, about 4 KB of core and 2 KB of explanations, so this covers
     the phase. The core half is first-paint latency on practice.html and
     review.html, which is why it is tracked to the kilobyte rather than
     rounded up generously. */
  /* 216 -> 220. The 216 figure was set for Phase 4 at "about 4 KB of core per
     pair of sections", and the self-study rewrite has overrun it: replacing a
     recall stem ("What is the 1,4-addition product?") with an application one
     ("HBr adds to 2-methylpenta-1,3-diene at -80 C. Major product?") costs
     roughly 60 characters of stem and options per item, and it is the stem and
     the options that live in this half. The file was already 0.3 KB over at the
     start of the conjugation pass, before a line of it was edited. 4 KB covers
     the chapter that pushed it over plus the ones queued behind it; the
     explanations half keeps its own, separate budget. This one is first-paint
     latency on practice.html, so it stays tracked to the kilobyte. */
  /* 220 -> 240 during the self-study pass: chapter 13 landed at 219.9 KB and
     ten chapters of stem rewrites are still queued behind it. Budgets are for
     catching accidental bloat (a duplicated bank, an embedded image), not for
     making an editor shorten an exam-style stem; the actual growth rate is
     ~1.5 KB per chapter, so 240 KB covers the rest of the pass with room to
     spare and is still under half of what the explanations half weighs.
     240 -> 250 when four sections (120 questions) and the `molecule` field
     on 78 drawn-structure questions landed: 240.0 KB exactly. */
  ['ochem/assets/practice-bank-core.json', 250],
  /* 156 -> 200 for the explanations, and this one is a decision rather than
     a formality. The self-study pass rewrites recall questions into
     application ones, and an application question's explanation is a
     worked solution, two or three sentences longer than "the suffix is
     -ol". The first chapter to hit the ceiling (chapter 2) had thirty
     explanations shortened to fit, which is the budget doing harm: this
     file is fetched after paint and never blocks a question, so its cost is
     bytes on an idle connection, and a trimmed explanation is a worse
     lesson for a student who just got something wrong. 200 covers the
     twenty-one chapters still to be rewritten at the measured 1.7 KB per
     chapter. The core file's budget is untouched; that one is first-paint. */
  /* 200 -> 230 during the self-study pass, for the reason given for the core
     half above: chapter 16 landed exactly on the line with six chapters of
     worked-solution explanations still queued. This file loads after first
     paint, so the cost of the extra 30 KB is a later tooltip, not a slower
     page. */
  /* 230 -> 239 for the same three banks as the tutor index above: 100
     one-line enolate explanations rewritten into full ones, and 90 recall
     items replaced by application items whose explanations are worked
     solutions. Measured 237.6 KB. Still fetched after paint and blocking
     nothing, so the cost is a later explanation, not a slower page. */
  ['ochem/assets/practice-bank-why.json', 239],
  /* The structures drawn above practice-bank stems. This one is here for an
     unusual reason: it is a <script src>, not a fetched file, so the
     reference walk above WOULD see it — except that the only two pages
     loading it, ochem/practice.html and ochem/review.html, are not in the
     page list, so nothing was measuring it at all. Without this line a file
     that grows by one record per question could grow without limit.

     Measured at 8.4 KB gzipped for 47 records — about 180 bytes each, most
     of it coordinates — so 10 covers roughly another nine before anyone has
     to think about it. The right thing to do
     when it gets there is to split the records by chapter and fetch them,
     not to raise this: unlike the banks above, every byte of this file is
     downloaded before the first question on two pages that already wait on
     240 KB of bank. */
  ['ochem/assets/question-molecules.js', 10],
  /* The flashcard deck, generated from the notes' tables by
     scripts/build-flashcards.mjs. Fetched by flashcards.html after it paints,
     alongside concept-teach.json. Measured at 25.3 KB for 526 cards — about
     50 bytes a card, most of it the repeated question and table heading. If a
     chapter's worth of tables pushes it over, factoring those per-table
     strings out of each card is the saving, not a bigger number. */
  ['ochem/assets/flashcards.json', 28],
  /* The A&P question bank, split like ochem's (core waited on, explanations
     fetched after) and the glossary behind the hover definitions. Measured at
     the Phase 1 pilot (49 topics): 105.3, 159.7 and 40.8 KB. They grow with
     every chapter, so each new chapter raises these with its measured size. */
  ['anatomy-physiology/assets/bank-core.json', 120],
  ['anatomy-physiology/assets/bank-why.json', 180],
  /* 46 -> 52: the glossary carries every written definition, published or
     not, so an early page can show a hover for a later term (spec section 7).
     It grows as each chapter is written; measured 47.3 KB with respiratory
     drafted. Each chapter raises it by its measured size. */
  ['anatomy-physiology/assets/glossary.json', 52],
  /* The Reagent Roadmap's graph: every group, reagent and reaction the tool
     routes over. Same situation as question-molecules.js — a <script src>
     on a page with no line of its own above, so nothing was measuring it —
     and the same shape of growth: it gets one entry longer every time the
     course teaches another interconversion. Measured at 19.3 KB gzipped for
     28 groups, 66 reagents and 137 reactions; 22 is that plus the usual
     tenth. If a new chapter pushes it over, that is a chapter's worth of
     reactions and worth a sentence in the commit, not a reason to trim the
     notes on the ones already here. */
  ['ochem/assets/tools/reagent-roadmap-data.js', 22],
];

const REF_RE = /(?:href|src)="([^"]+)"/g;
const CSS_URL_RE = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;

function isLocal(ref) {
  return ref && !/^(?:[a-z]+:)?\/\//i.test(ref) && !ref.startsWith('data:') &&
         !ref.startsWith('#') && !ref.startsWith('mailto:');
}

function resolveRef(fromFile, ref) {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return null;
  return clean.startsWith('/') ? join(ROOT, clean) : resolve(dirname(fromFile), clean);
}

function read(path) {
  try { return statSync(path).isFile() ? readFileSync(path) : null; } catch { return null; }
}

/* Which bucket an asset belongs to, from where it lives. */
function bucketOf(relPath) {
  const parts = relPath.split(sep);
  if (parts[0] === 'assets') return 'site';
  if (parts.length > 1 && parts[1] === 'assets') return parts[0];
  return 'page';
}

/* Gzipped as one blob per bucket rather than per file. That is not quite what
   the wire does — each response is compressed on its own — but summing
   separately compressed files overstates the total for a site whose files
   share this much vocabulary, and what this is for is a line that cannot drift
   without somebody noticing, not a waterfall. */
function gz(buffers) {
  if (!buffers.length) return 0;
  return gzipSync(Buffer.concat(buffers), { level: 9 }).length;
}

function weigh(pageRel) {
  const file = join(ROOT, pageRel);
  if (!existsSync(file)) return { error: 'missing' };

  const html = readFileSync(file, 'utf8');
  const seen = new Set();
  const buckets = { page: [Buffer.from(html)] };
  const parts = [];

  const take = (path) => {
    if (!path || seen.has(path)) return null;
    seen.add(path);
    const buf = read(path);
    if (!buf) return null;
    const rel = relative(ROOT, path);
    const bucket = bucketOf(rel);
    (buckets[bucket] = buckets[bucket] || []).push(buf);
    parts.push({ path: rel, raw: buf.length, bucket });
    return buf;
  };

  for (const m of html.matchAll(REF_RE)) {
    const ref = m[1];
    if (!isLocal(ref) || !/\.(css|js)$/i.test(ref)) continue;
    const path = resolveRef(file, ref);
    const buf = take(path);
    if (!buf || !/\.css$/i.test(ref)) continue;

    // One level into a stylesheet, which is how assets/fonts/fonts.css pulls
    // in the woff2 files that are most of the weight it is responsible for.
    for (const u of buf.toString('utf8').matchAll(CSS_URL_RE)) {
      if (!isLocal(u[1]) || !/\.(woff2?|ttf|otf)$/i.test(u[1])) continue;
      take(resolveRef(path, u[1]));
    }
  }

  const sizes = {};
  for (const [name, bufs] of Object.entries(buckets)) sizes[name] = gz(bufs) / 1024;
  return { sizes, parts: parts.sort((a, b) => b.raw - a.raw) };
}

// ---- measure ---------------------------------------------------------------

const rows = [];
const shellSizes = {};
const shellParts = {};
let failures = 0;

for (const [pageRel, budgetKb] of BUDGETS) {
  const res = weigh(pageRel);
  if (res.error) {
    console.error(`FAIL: ${pageRel} is in the budget list but does not exist. Remove it or fix the path.`);
    failures++;
    continue;
  }
  const kb = res.sizes.page || 0;
  rows.push({ pageRel, kb, budgetKb, over: kb > budgetKb, parts: res.parts.filter((p) => p.bucket === 'page') });

  // A shell is the same bytes wherever it is reached from, so the largest
  // measurement of it is the whole of it — a page that loads only half the
  // ochem shell should not make the ochem shell look smaller than it is.
  for (const [name, size] of Object.entries(res.sizes)) {
    if (name === 'page') continue;
    if (!(name in shellSizes) || size > shellSizes[name]) {
      shellSizes[name] = size;
      shellParts[name] = res.parts.filter((p) => p.bucket === name);
    }
  }
}

const dataRows = [];
for (const [rel, budgetKb] of DATA_BUDGETS) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`FAIL: ${rel} is in the data budget list but does not exist. Remove it or fix the path.`);
    failures++;
    continue;
  }
  const kb = gzipSync(readFileSync(abs), { level: 9 }).length / 1024;
  dataRows.push({ rel, kb, budgetKb, over: kb > budgetKb });
}

// ---- report ----------------------------------------------------------------

const pad = (s, n) => String(s).padEnd(n);
const line = (name, kb, budget) => {
  const head = budget - kb;
  return pad(name, 34) + pad(kb.toFixed(1) + ' KB', 10) + pad(budget + ' KB', 9) +
    (kb > budget ? `OVER by ${(-head).toFixed(1)} KB` : `${head.toFixed(1)} KB`);
};

console.log('Shared shells — downloaded once for the whole site, then cached.\n');
console.log(pad('shell', 34) + pad('gzipped', 10) + pad('budget', 9) + 'headroom');
console.log('-'.repeat(66));
const shellRows = [];
for (const [name, budget] of SHELL_BUDGETS) {
  const kb = shellSizes[name] || 0;
  if (!kb) continue;
  const over = kb > budget;
  if (over) failures++;
  shellRows.push({ name, kb, budget, over });
  console.log(line(name === 'site' ? '/assets (every page)' : `${name}/assets`, kb, budget));
}

console.log('\nPer page — the HTML and anything only this page loads.\n');
console.log(pad('page', 34) + pad('gzipped', 10) + pad('budget', 9) + 'headroom');
console.log('-'.repeat(66));
for (const r of rows) {
  if (r.over) failures++;
  console.log(line(r.pageRel, r.kb, r.budgetKb));
}

console.log('\nFetched after the page is usable — data files no reference graph can see.\n');
console.log(pad('data file', 34) + pad('gzipped', 10) + pad('budget', 9) + 'headroom');
console.log('-'.repeat(66));
for (const r of dataRows) {
  if (r.over) failures++;
  console.log(line(r.rel, r.kb, r.budgetKb));
}

for (const r of dataRows.filter((x) => x.over)) {
  console.error(`\nFAIL: ${r.rel} is ${r.kb.toFixed(1)} KB gzipped, over its ${r.budgetKb} KB budget.`);
  console.error('      Nothing links to this file, so nothing else was measuring it.');
}

for (const r of shellRows.filter((x) => x.over)) {
  console.error(`\nFAIL: the ${r.name} shell is ${r.kb.toFixed(1)} KB gzipped, over its ${r.budget} KB budget.`);
  console.error('      This one is on the critical path of EVERY page it belongs to,');
  console.error('      so it is the most expensive place on the site to add weight.');
  for (const p of (shellParts[r.name] || []).slice(0, 6)) {
    console.error(`        ${(p.raw / 1024).toFixed(0).padStart(6)} KB raw  ${p.path}`);
  }
}

for (const r of rows.filter((x) => x.over)) {
  console.error(`\nFAIL: ${r.pageRel} is ${r.kb.toFixed(1)} KB gzipped of its own, over its ${r.budgetKb} KB budget.`);
  for (const p of r.parts.slice(0, 5)) {
    console.error(`        ${(p.raw / 1024).toFixed(0).padStart(6)} KB raw  ${p.path}`);
  }
}

if (failures) {
  console.error('\nMake it lighter, or raise the budget in scripts/check-weight.mjs and say');
  console.error('in the commit message why the site is allowed to be slower.');
}

// A budget with a lot of room left is a stale budget. Reported, never failed: a
// ratchet that tightened itself would fail the build for making things better.
const slack = [...shellRows, ...rows, ...dataRows]
  .filter((r) => !r.over)
  .map((r) => ({ name: r.name || r.pageRel || r.rel, kb: r.kb, budget: r.budget ?? r.budgetKb }))
  .filter((r) => r.budget - r.kb > r.budget * 0.3);
if (slack.length) {
  console.log('\nRoom to tighten — these budgets have drifted generous:');
  for (const r of slack) console.log(`  ${r.name}: ${r.kb.toFixed(1)} KB against a ${r.budget} KB budget`);
}

if (failures) {
  console.error(`\n${failures} budget(s) exceeded.`);
  if (check) process.exit(1);
} else {
  console.log(`\nAll ${shellRows.length + rows.length + dataRows.length} budgets are within range.`);
}
