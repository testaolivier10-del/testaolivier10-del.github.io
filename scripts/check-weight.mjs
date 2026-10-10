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
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
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
  /* 249 -> 253 for cross-device sync (audit 2026-10, Fix-first 5). A sync
     used to replace whole namespaces and pull only on sign-in, so two signed-in
     devices erased each other's progress. account.js now carries a per-key
     three-way merge, conditional writes with retry, pull on load and focus,
     and failure reporting; the merge rules moved there from
     progress-backup.js (-0.8 KB) so a restore and a sync share one copy.
     Measured 252.0 KB. */
  /* +1 (so 253 -> 254 after the merge) for the October 2026 security audit: premium.js now checks
     the signed-in user before trusting a cached pass and reports failed
     refreshes, and site-chrome.js shows the service worker's new-version
     toast (together about 1.1 KB gzipped, after trimming their comments). */
  /* 254 -> 254.5 for the free-vs-Premium pass (audit 2026-10, W2): the purchase
     dialog now shows Pass-or-extend's conditions next to the price instead of
     behind a link, and links the pricing page (about 0.15 KB gzipped). */
  /* 254.5 -> 260 for the UX and accessibility pass (audit 2026-10, W7). On
     every page: one shared header for course and site pages with the phone
     menu and 44px targets, the "/" search overlay, the More sheet's inert
     handling, footers lifted out of main, the tutor's dialog semantics,
     right/wrong marks, dark-mode scrims and contrast, reserved space against
     layout shift, two elevation tokens (site-chrome.js, theme.css, tutor.js,
     motion.js, account.js, about 4.7 KB gzipped). Measured 259.2 KB.
     260 -> 260.5 for the follow-up: the one breadcrumb component and the
     written monospace/arrow rule with its --disclose token. Measured 260.1 KB. */
  /* 260.5 -> 279 is a change of ruler, not of weight (audit 2026-10, W8). The
     shell now also counts the scripts site-chrome.js mounts on every page
     (motion, reminders, announcer, analytics and the assistant's button),
     16.6 KB that were always downloaded and never measured. In the same pass
     two every-page downloads left: the assistant itself (assets/tutor.js,
     23 KB) now loads on the first reach for its button, and the Supabase SDK
     (about 45 KB from jsDelivr, never counted here) loads only for a stored
     session or the sign-in dialog. Measured the old way, the shell would be
     about 298 KB plus the SDK; it is 277.2 KB. account.js grew 0.6 KB for the
     lazy SDK and the plain-fetch page counter. */
  /* 279 -> 280 for the engagement pass (2026-10, docs/engagement-plan.md):
     the share button and streak toast in motion.js, LevlLazy/LevlNextStep in
     site-chrome.js (share, milestones, next-step and cross-course themselves
     load on demand, outside the shell), the ?ref= capture in analytics.js and
     the end-screen styles in theme.css. About 2.1 KB, 0.3 KB of it won back by
     trimming comments. Measured 279.9 KB. */
  /* 280 -> 281 for registering AP® Biology (docs/apbio-spec.md, 0.5): the
     fourth course in every generated course list, premium.js's fixed-date
     pass and per-course on-sale switch, and the URL-safe course key.
     Measured 281.4 KB with the engagement pass. */
  /* 282 -> 283 for registering AP® Chemistry (docs/apchem-spec.md, Phase 0):
     the fifth course in every generated course list, its premium.js entry and
     the theme tint. Measured 281.9 KB (from 281.4). */
  ['site', 283],
  /* The shared course layer, assets/course/ (docs/course-shell.md): base.css
     on every course page, plus the glossary popups (glossary-tip.js) on every
     reading page and the glossary page's script and styles there. Counted on
     its own because only course pages load it. Measured 10.5 KB with the
     glossary work (W-A). 14 -> 17 once book.css, study.css/js and hub.css/js
     joined it (W-B, W-C, W-D), each replacing four per-course copies; the
     /assets every-page ruler stayed under its old 282. Measured 16.0 KB. */
  ['assets/course', 17],
  /* 7 -> 11 for the NREMT flashcard deck: its page script,
     nremt/assets/flashcards-page.js (5.3 KB gzipped), loads only on
     flashcards.html but is counted here like every script in nremt/assets —
     the same place ochem's deck script is counted. No other NREMT page got
     heavier. */
  /* 11 -> 11.4: the flashcard deck's shared deck card and by-topic list (W-C). */
  /* 11.4 -> 16.5 (tools upgrade, U-NREMT-cases): the scenario simulator's live
     patient, nremt/assets/scenario-monitor.js (monitor, traces, tap-to-assess
     body; ~5 KB gzipped), loads only on scenario-sim.html, which makes that
     page the largest measure of this shell. The other new tool scripts
     (flow-build, formulary-cards, vitals-check, mnemonic-check) load only on
     their own pages and are smaller. */
  /* 16.5 -> 21 (visual polish 2026-10): the scenario sim's patient is the body
     map's own model rendered flat (body-figures.js loader 0.8 KB, scenario-monitor.js
     +2.2 KB; figure data and images fetched on demand), plus illustrated tool visuals
     drawn inline (bedside monitor traces, drug icons, age pictograms, phonocardiogram,
     about +1 KB). Re-measured after merging both. */
  ['nremt', 21],
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
  /* 105 -> 106 for the readability pass, which is the one thing here that
     grows by chapter. Every rewritten lesson gains steps (8 became 10 to 14,
     because a term is now taught in its own step before a question uses it),
     and lesson-concepts.js maps each graded step to its concepts, so the map
     grows with the lessons. Stale comments were already cut from that file
     once to stay under 105; it measured 105.0 KB with ¹H NMR mapped and two
     Spectroscopy lessons still to come. Five chapters remain after this one,
     at roughly 0.1 KB each. If it needs to move again before the pass ends,
     take the saving noted above (lesson-concepts.js out of ochem/index.html)
     or move the map to a fetched file, rather than raising again. */
  /* 108 -> 110.5 (audit 2026-10, W7): keyboard access for every hand-drawn
     clickable atom (ochem-nav.js), hit areas on practice atoms, the phone
     lesson rail and reserved card space (ochem.css), rail labels from step
     titles (step-back.js). Measured 109.9 KB. */
  /* 110.5 -> 111: shared classes in session-runner.js and the free line (W-C). */
  /* 111 -> 112: atomic masses in periodic-table.js (also loaded by AP Chemistry). */
  /* 112 -> 113 (visual polish): molecules.js places lone pairs between bonds,
     draws swept arrowheads on the curve tangent and trims bonds to the label
     for the textbook-style tool structures. Measured 112.5 KB. */
  ['ochem', 113],
  /* The A&P course runtime (anp-core, questions, nav, glossary tooltips,
     anp.css) plus whichever app or tool script the page loads. Measured
     37.3 KB at the Phase 1 pilot. 44 -> 46 (audit 2026-10): the lazy bank
     (index first, chapters on demand, explanations after the answer) adds
     about 1.5 KB to the exams page's scripts and saves up to 4 MB of bank
     fetches on Practice, Review and Exams. */
  /* 46 -> 46.5 (audit 2026-10, W8): anp-questions.js wraps a figure
     question's image in <picture> with its AVIF copies (0.2 KB gzipped), which
     saves a phone roughly 60% of each figure's bytes. */
  /* 46.5 -> 47.5 (tools upgrade P1-A&P, 2026-10): every tool page loads the
     shared tools/tool-kit.js and .css (item picker, Keep going strip, body
     map label list), about 4 KB gzipped; the lab practical page, the
     heaviest, measured 46.8 KB. */
  /* 47.5 -> 48 (visual polish 2026-10): the 3D button's body icon and the shared illustration code; measured 47.7 KB. */
  /* 48 -> 49.5 (simplify pass 2026-10): the shared first-step line, segmented mode switch and Why? / More options disclosures in tool-kit.js/.css; lab practical measured 49.3 KB. */
  ['anatomy-physiology', 49.5],
  /* AP® Biology (bio/, a fork of the A&P runtime): bio-core, questions, nav,
     glossary tooltips, bio.css, the generated curriculum, plus the app script
     a page loads (exams.js, the largest, with pages.css and frq-kit.js).
     Measured 45.5 KB on the exams page before any unit was published;
     A&P's 46.5 is the reference. */
  ['bio', 50],
  /* AP® Chemistry (chem/, a fork of the AP® Biology runtime, with the
     numeric grader for units and significant figures). Bio's 50 is the
     reference. Raised 50 -> 52 at publish (2026-10-06): with all nine units
     and the math chapter out, the generated chem-curriculum.js lists every
     topic as live and the exams page's shell measured 50.2 KB; the extra is
     course data, not code. */
  ['chem', 52],
];

/* One entry per page whose weight is worth defending, which is not the same as
   every page. These are the doors people come in through and the pages they
   spend time on; a budget on all 180 would be 180 numbers nobody maintains. */
const BUDGETS = [
  // The front doors. A first-time visitor's whole impression of whether this
  // site is fast is formed on one of these three.
  /* 6 -> 6.1, and ochem/index.html 11 -> 11.2, for the tighter CSP every page
     now carries (the two exact script files it may load, the one Worker
     host, form-action): about 100 more bytes of policy per page, on pages
     that were already within a few bytes of their budgets. */
  /* index.html 6.1 -> 6.6 and nremt/index.html 9 -> 9.1 (audit 2026-10, W2): the
     hub states what is free and the price from premium.js, and both pages'
     structured data now list each course's passes as offers instead of
     claiming the course is free. W7's one-sentence hero should give some back. */
  /* 6.6 -> 7.3 (audit 2026-10, W7): the hero's one-sentence lede and
     primary button, the returning student's Continue card drawn inline before
     first paint (a deferred script would push the page down), and a distinct
     line icon per course card. Measured 7.1 KB. */
  /* 7.3 -> 7.8 (audit 2026-10, W8): the three-question FAQ (affiliation,
     price, is it free), shown on the page and repeated as FAQPage data, plus
     the Organization's founder and contact. Measured 7.6 KB. */
  /* 7.8 -> 8.5 for AP® Biology once a unit is published: its hub card, its
     pass in the FAQ and the structured data's offers, and the College Board
     sentence (build-pricing.mjs). Measured 8.1 KB with Unit 1 published. */
  ['index.html', 8.5],
  /* +0.1 each here and on ochem/index.html (audit 2026-10, W7): every page
     preloads its one text face (Nunito, latin) so it is ready at first paint
     with font-display: optional, which removed the font-swap layout shift. */
  /* 9.2 -> 10.4 for the Start here / Review queue / Today's goal row every
     course home has (docs/course-shell.md, W-D): its first-visit markup and
     the script that fills it from the practice-engine records. Measured
     10.3 KB. */
  /* nremt/index.html 10.4 -> 10.6 (2026-10-08, trust plan): the founder line under the hero. */
  ['nremt/index.html', 10.6],
  /* 10 -> 11. The home page lists every chapter's topics, so it grows by a
     line of markup each time the course gains a section; the generated list
     crossed 10 KB gzipped when the reactivity chapter gained its energy-
     diagrams section. Nothing on the page got heavier per topic — there are
     simply more topics — and the saving noted above (splitting the one
     lesson-concepts.js call out of ochem-home.js, worth about 4.4 KB) is
     still available if this ever needs to come back down. */
  /* 11.3 -> 11.6 (audit 2026-10, W9): the reorder split two chapters out
     (IR & Mass Spectrometry; Organometallic Bonding & Grignard Reagents) and
     added two topics (cyclopropanation, electrocyclic and sigmatropic
     reactions), so the generated path gained two chapter nodes and two
     topic lines. Measured 11.5 KB. */
  ['ochem/index.html', 11.6],

  // The busiest page on the site, and the one the bank split was for.
  /* 40 -> 44 in the 2026-10 audit follow-up: the runner gained a check step
     with feedback after every untimed answer, a next step on the results
     page, drills by 2025 exam domain or by topic area, exam-domain stats and
     quota-capped length pickers (about 3.9 KB gzipped of engine). The bank
     itself, the page's real weight, is a separate fetch and got lighter.
     44 -> 45 in the W1 review: the "All domains" drill now splits its length
     by the exam weights, and the domain-tagging rule is written next to
     DOMAIN_TARGETS so later tagging stays consistent (about 0.2 KB). */
  /* 45 -> 45.2 for the engagement pass: the one-line share and next-step
     hooks on the results screen. Measured 45.1 KB. */
  // 45.2 -> 48: the shared step builder and "Your numbers" rail, with
  // nremt/practice-study.js mapping it onto the engine's controls (W-C).
  ['nremt/practice.html', 48],

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
  // 50 -> 51.5 (tools upgrade): the monitor and patient panel styles and the
  // call layout, inline in the page. The case data is unchanged.
  /* 51.5 -> 52 (visual polish 2026-10): the bedside monitor's styles; measured 51.6 KB. */
  ['nremt/scenario-sim.html', 52],
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
  //
  // Raised from 6 to 10 when the readability pass rewrote Acids & Bases. They
  // all did grow: the pass puts each lesson's diagrams inline as generated SVG
  // (a lesson that asks about a shape now draws it), and the median lesson went
  // from about 5 KB to 12 KB gzipped as each chapter was rewritten. pka.html,
  // rewritten last of the early chapters, went from 5.2 to 9.0 KB for the same
  // reason: three new figures and three new steps. The ceiling leaves it 1 KB,
  // the headroom it had before. If it moves again without new figures or
  // steps, find out why first.
  ['ochem/lessons/pka.html', 10],
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
  ['ochem/flashcards.html', 3],
  /* 5 -> 3 above: the deck's card styles moved out of the page into
     /assets/flashcards.css (1.9 KB gzipped, counted in the site shell) so the
     NREMT deck can share them; since the course shell (W-C) they are part of
     /assets/course/study.css with the other study-page styles. Its page carries only the deck-view panels
     ochem gets from ochem.css; the scheduler it shares is in ochem/assets. */
  ['nremt/flashcards.html', 3],
  // The glossary page is a shell plus every term's name (the definitions are
  // the JSON file below). Measured 8.3 KB at 502 terms.
  ['ochem/glossary.html', 10],
  /* 5 -> 7 for the redesigned A&P home (ochem's layout): the level card, the
     chapter path as a real list of 27 links with their snake placement, and
     one real bank question with its explanations, all in the markup so they
     read without JavaScript. Measured 6.4 KB; ochem's home is budgeted at 11. */
  ['anatomy-physiology/index.html', 7],
  /* 10 -> 10.6 (audit 2026-10, W7): the stepped view is in the markup and a
     tiny inline script opens the saved step before first paint, which took
     an A&P lesson's layout shift from 0.27-1.0 to under 0.1. Measured
     10.4 KB. */
  ['anatomy-physiology/lessons/heart-chambers-valves.html', 10.6],
  /* 19 -> 19.5 (audit 2026-10, W8): each figure's <picture> with its AVIF
     srcset (about 0.03 KB gzipped a figure) in exchange for AVIF images. */
  ['anatomy-physiology/notes/cardiac-cycle.html', 19.5],
  ['anatomy-physiology/tools/predict.html', 3],
  ['anatomy-physiology/tools/lab-practical.html', 3],
  ['anatomy-physiology/exams.html', 3],
  /* AP® Biology: the home, the app shells and, once a unit is published, its
     first lesson, notes page and unit sheet (BIO_PAGES below, from what the
     generator has written, so nothing here names a topic before it exists).
     The A&P numbers are the reference. */
  ['bio/index.html', 7],
  ['bio/practice.html', 3],
  ['bio/exams.html', 3],
  ['bio/frq.html', 3],
  /* 40 -> 30 (2026-10-03): the glossary page is now an index, as A&P's
     (spec decision 22, A&P decision 69): every term once, as a link, with
     the definitions drawn from glossary.json by bio-glossary-page.js. 15 KB
     with Units 1-4 (441 terms, about 23 bytes gzipped per term); the whole
     course should land near 25 KB. */
  ['bio/glossary.html', 30],
  /* 3 -> 5 (W-D, docs/course-shell.md): the hub was a placeholder shell; it
     now lists all 19 published tools as cards in the page itself, so it
     reads without JavaScript. Measured 4.4 KB. */
  ['bio/tools.html', 5],
  /* AP® Chemistry: as AP® Biology's (CHEM_PAGES below for the first lesson,
     notes page and unit sheet once a unit is published). */
  ['chem/index.html', 7],
  ['chem/practice.html', 3],
  ['chem/exams.html', 3],
  ['chem/frq.html', 3],
  ['chem/glossary.html', 30],
  ['chem/tools.html', 5],

  // The privacy policy: the page that has to load well for somebody who has
  // not decided yet whether to trust the site.
  //
  // Raised from 10 when study reminders were added. This page carries the
  // switch for them and the prose explaining exactly what is stored, and both
  // of those belong here rather than anywhere else — the cost is a page that
  // tells the truth at greater length, which is the one thing this page is for.
  // 15 -> 16: the "For schools" section (docs/apbio-spec.md decision 20).
  ['privacy.html', 16],
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
  /* The NREMT flashcard deck, generated by scripts/build-nremt-flashcards.mjs
     from the glossary, mnemonics, reference cards and authored key facts.
     Fetched by flashcards.html after it paints. Measured at 43.6 KB for 570
     cards — longer answers than ochem's table cells, about 76 bytes a card.
     If it grows past this, the repeated ref links and source labels per card
     are the saving. */
  ['nremt/assets/flashcards.json', 46],
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
     old claim fails, so it runs a sentence longer. Measured 314.1 KB.

     315 -> 317 for the prerequisite pass: about 200 questions reworded so
     they use only ideas taught by their topic, and five questions moved to
     the later topic that teaches them, each old slot refilled with a new
     question. Measured 315.8 KB.

     317 -> 328 for the site-review pass: about 110 one-line explanations
     expanded to real sentences and 81 true/false items rewritten as false
     statements, each explanation now stating the correct fact. Measured
     325.0 KB. */
  /* 328 -> 332 (audit 2026-10, W9): the two new topics' notes sections and
     their 40 questions with explanations. Measured 329.7 KB. */
  ['ochem/assets/tutor-bank.json', 332],
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
  /* 239 -> 241 for the prerequisite pass (see the tutor index above): five
     more questions, and explanations rewritten so they lean only on earlier
     topics. Measured 239.1 KB, still fetched after paint. */
  /* 241 -> 248 for the site-review pass (see the tutor index above): terse
     explanations expanded and 81 true/false items rewritten. Measured
     245.4 KB, still fetched after paint. */
  /* 248 -> 250 (audit 2026-10, W9): explanations for the 40 questions of
     the two new topics. Measured 248.9 KB, still fetched after paint. */
  ['ochem/assets/practice-bank-why.json', 250],
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
  /* ochem/exams.html's own two scripts. Same reason as above: the page loads
     the practice engines too, so like practice.html it is not in the page
     list (it would set the ochem shell's high mark at about 141 KB, which is
     the engines, not the shell), and nothing else would measure these.
     Measured 3.4 and 10.0 KB gzipped, about a tenth added. */
  ['ochem/assets/exam-core.js', 4],
  // 11 -> 12: the exam setup now carries the shared rail (W-C).
  ['ochem/assets/exams-page.js', 12],
  /* The flashcard deck, generated from the notes' tables by
     scripts/build-flashcards.mjs. Fetched by flashcards.html after it paints,
     alongside concept-teach.json. Measured at 25.3 KB for 526 cards — about
     50 bytes a card, most of it the repeated question and table heading. If a
     chapter's worth of tables pushes it over, factoring those per-table
     strings out of each card is the saving, not a bigger number. */
  ['ochem/assets/flashcards.json', 28],
  /* The ochem glossary (scripts/build-ochem-glossary.mjs): ~500 terms and
     definitions, fetched after load by the popups (assets/course/glossary-tip.js)
     and by the shared glossary page.
     Measured 45.4 KB at 502 terms. */
  ['ochem/assets/glossary.json', 48],
  /* The A&P question bank used to be two files for the whole course (core
     and explanations). They grew with every chapter (105/160 KB at the pilot,
     174/247 KB with 72 topics) and were heading past 400 KB, so the bank is
     now split by chapter under assets/bank/ and each chapter file has its own
     budget (see ANP_BANK_BUDGETS below). The glossary behind the hover
     definitions stays one file. */
  /* 46 -> 52: the glossary carries every written definition, published or
     not, so an early page can show a hover for a later term (spec section 7).
     It grows as each chapter is written; measured 47.3 KB with respiratory
     drafted. Each chapter raises it by its measured size. */
  /* 52 -> 64: respiratory and the nervous chapters drafted (56.8 KB). */
  /* 64 -> 76: special senses and autonomic drafted (66.7 KB). */
  /* 76 -> 96: endocrine and blood drafted (77.8 KB). Every written chapter
     adds its definitions, so this keeps rising until the course is written;
     it loads after paint for hovers and blocks nothing. */
  /* 96 -> 130: digestive, metabolism and urinary drafted (99.2 KB with
     about 130 of 162 topics written). 130 covers the whole course at the
     current rate of about 0.75 KB a topic; past that, split it by chapter
     like the bank. */
  /* 130 -> 150: muscular system published (118.4 KB); the five remaining
     A&P I chapters add about 0.75 KB a topic, about 138 KB for the whole
     course. It still loads after paint, only when a hover or a glossary-based
     tool needs it, and three tools (word roots, search, flashcards) read the
     whole file, so splitting it would cost more requests than it saves
     (decision 65). */
  /* 150 -> 190 (2026-10-06, cross-course consistency W-A): the file moved to
     the shared shape every course serves (scripts/lib/glossary.mjs) and now
     carries what the glossary page's HTML used to: each term's aliases (the
     filter searches them), its topic title and link ("Taught in") and its
     chapter (the chapter filter). The page itself went from 42.9 to 15.9 KB
     gzipped. Measured 180 KB for all 162 topics. */
  ['anatomy-physiology/assets/glossary.json', 190],
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
  // The shared course layer (docs/course-shell.md) is loaded by course pages
  // only, so it is its own shell rather than part of every page's.
  if (parts[0] === 'assets' && parts[1] === 'course') return 'assets/course';
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
    /* site-chrome.js mounts more scripts on every page it runs on (motion,
       reminders, the assistant's button, the announcer, analytics). Those are
       every-page downloads too, so they count here (site audit 2026-10, W8:
       the shell budget measured only the scripts named in the HTML, so the
       1,300-line tutor it used to mount on every page was never counted). */
    if (buf && /assets\/site-chrome\.js$/.test(ref)) {
      for (const m2 of buf.toString('utf8').matchAll(/\.src = '(\/assets\/[\w-]+\.js)'/g)) take(join(ROOT, m2[1]));
    }
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

/* The first published AP® Biology lesson, notes page and unit sheet, when
   there are any (bio/assets/notes-index.json, written by build-apbio.mjs).
   Budgets as A&P's lesson and notes pages; a unit sheet is a printable
   summary of one unit. */
{
  const idx = join(ROOT, 'bio', 'assets', 'notes-index.json');
  const first = existsSync(idx) ? JSON.parse(readFileSync(idx, 'utf8'))[0] : null;
  if (first) {
    const id = String(first.file).replace(/^.*[/]notes[/]/, '').replace(/\.html$/, '');
    // 10.6 -> 13: the first lesson carries three stimulus sets' check items and
    // its prerequisite questions in the page (12.5 KB with Unit 1 published).
    BUDGETS.push([`bio/lessons/${id}.html`, 13], [`bio/notes/${id}.html`, 19.5]);
    const sheets = join(ROOT, 'bio', 'unit-sheets');
    const sheet = existsSync(sheets) ? readdirSync(sheets).filter((f) => f.endsWith('.html')).sort()[0] : null;
    if (sheet) BUDGETS.push([`bio/unit-sheets/${sheet}`, 12]);
  }
}
/* The same for AP® Chemistry (chem/assets/notes-index.json, build-apchem.mjs). */
{
  const idx = join(ROOT, 'chem', 'assets', 'notes-index.json');
  const first = existsSync(idx) ? JSON.parse(readFileSync(idx, 'utf8'))[0] : null;
  if (first) {
    const id = String(first.file).replace(/^.*[/]notes[/]/, '').replace(/\.html$/, '');
    BUDGETS.push([`chem/lessons/${id}.html`, 13], [`chem/notes/${id}.html`, 19.5]);
    const sheets = join(ROOT, 'chem', 'unit-sheets');
    const sheet = existsSync(sheets) ? readdirSync(sheets).filter((f) => f.endsWith('.html')).sort()[0] : null;
    if (sheet) BUDGETS.push([`chem/unit-sheets/${sheet}`, 12]);
  }
}

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

/* Per-chapter A&P bank files (scripts/build-anp.mjs). The largest chapter,
   cardiovascular with 16 topics, measured 42.8 KB core and 59.2 KB
   explanations; the budgets leave room for a chapter that size plus a little.
   A bigger chapter should be split, not given a bigger number: a student
   practicing one chapter waits on its core file. */
const ANP_BANK_BUDGETS = { core: 48, why: 66 };
const ANP_BANK_DIR = join(ROOT, 'anatomy-physiology', 'assets', 'bank');
if (existsSync(ANP_BANK_DIR)) {
  for (const f of readdirSync(ANP_BANK_DIR).filter(f => f.endsWith('.json')).sort()) {
    DATA_BUDGETS.push([`anatomy-physiology/assets/bank/${f}`, f.endsWith('-why.json') ? ANP_BANK_BUDGETS.why : ANP_BANK_BUDGETS.core]);
  }
}
/* AP® Biology's bank: one pair of files per published unit (build-apbio.mjs)
   plus the lazy index. A unit is about the size of a large A&P chapter
   (6-12 topics of 15+ items, many with a stimulus panel), so the same
   budgets, and the same rule: split a unit rather than raise them. The
   glossary grows with published units, as A&P's did. */
const BIO_BANK_DIR = join(ROOT, 'bio', 'assets', 'bank');
if (existsSync(BIO_BANK_DIR)) {
  for (const f of readdirSync(BIO_BANK_DIR).filter(f => f.endsWith('.json')).sort()) {
    DATA_BUDGETS.push([`bio/assets/bank/${f}`, f === 'index.json' ? 8 : f.endsWith('-why.json') ? ANP_BANK_BUDGETS.why : ANP_BANK_BUDGETS.core]);
  }
}
DATA_BUDGETS.push(['bio/assets/glossary.json', 150], ['bio/assets/notes-index.json', 4], ['bio/assets/summaries.json', 40]);
/* AP® Chemistry's bank and data, on AP® Biology's budgets and rule. */
const CHEM_BANK_DIR = join(ROOT, 'chem', 'assets', 'bank');
if (existsSync(CHEM_BANK_DIR)) {
  for (const f of readdirSync(CHEM_BANK_DIR).filter(f => f.endsWith('.json')).sort()) {
    DATA_BUDGETS.push([`chem/assets/bank/${f}`, f === 'index.json' ? 8 : f.endsWith('-why.json') ? ANP_BANK_BUDGETS.why : ANP_BANK_BUDGETS.core]);
  }
}
DATA_BUDGETS.push(['chem/assets/glossary.json', 150], ['chem/assets/notes-index.json', 4], ['chem/assets/summaries.json', 40]);

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
  console.log(line(name === 'site' ? '/assets (every page)' : name.includes('/') ? `/${name} (course pages)` : `${name}/assets`, kb, budget));
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
