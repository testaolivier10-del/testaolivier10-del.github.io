# Streamline pass (status file, owner 2026-11-02)

Olivier: the site "feels too busy"; go one page at a time, in a draft he comments on.

- Draft artifact (private): https://claude.ai/artifact/TuDdD3z7Wpa9xqMTWC52vj
  Every distinct page layout, frozen exactly as the local build renders it (87 pages; the nine AP® courses share
  one layout, AP® Biology stands in for all). An "All pages" button on each page switches between them.
- Branch `claude/streamline-preview`: only the homepage differs from main so far.
- How to refresh the draft: serve the repo (`python3 -m http.server 8765`), run
  `python3 docs/streamline/freeze_all.py.txt [page paths...]` (edit its S/OUT paths first), publish the output
  folder to the artifact URL above (index.html is the page; other pages and assets go in `files`, at most 255 per
  publish). It inlines each stylesheet's source text (not cssRules, which drop var() shorthands) and swaps
  canvases for screenshots.

## Homepage decisions (from Olivier's comments)
- Removed "How every course works" (repeated the hero and the sample question).
- Hero less wordy: pill "12 courses · 19,207 questions · free to start" (count from the banks, in the hero-facts
  markers), one line "NREMT, Organic Chemistry, A&P and nine AP® Exams, taught in order.", founder line shortened,
  sample question pill is just the course name, no "try one, it's free".
- Facts strip removed (clutter).
- Questions: heading on top, two independent columns (price and terms; how it is made), "Who makes LevlPrep?"
  names Olivier, email line at the end.

## Premium and Search (owner comments 2026-11-02)
- Premium hero: no pill, no paragraph, one button; ticket line "every pass, until <date>".
- Premium "How a pass works" removed; "The rules" became "Questions before you buy" (two columns, short answers,
  "What stays free?" first, which keeps the free sentence the premium-copy site rule needs).
- Search: "Private by design" box, the footer privacy line and the "Try heart SN2..." hints removed; the
  privacy point is one line on privacy.html.

## NREMT comments, applied to every course (owner 2026-11-02: "can probably mostly be applied to all courses")
- Course homes (`scripts/lib/r3-home.mjs`, all 12): hero is name, hand line, one sentence, two buttons (no deck line,
  hero link, pills, founder); level card hidden (top bar level badge carries the level; the hidden card keeps the
  home scripts' ids); "How this course works" and the notes card removed; newest video and top three tools in one
  "Watch and try" row; contents sub is its first sentence; no "try one, it's free"; Questions full width, two
  columns; founder line in "Who makes LevlPrep?".
- Practice (all engines): the weakest-topics option says "Missed questions wait in Review".
- NREMT exams: facts strip and "How the exam is built" removed (`build-r3-inner.mjs` writes the markers empty);
  the adaptive explanation is a fine-print details `#catHow` in the footer, opened by the results link.
- Tools hubs: no featured tool (NREMT Body Map, A&P Lab Practical are the first cards).
- Search: no course list line.

## Search and tools (owner 2026-11-03)
- Course search (`assets/course/hub.js`, every course): box says "Search the entire course"; no passage counts line,
  no "Runs in your browser" note; the status line only shows the result count (and indexing or offline notes).
- Tool frame (`assets/course/tool-studio.js`, every tool): "Why?" became "Explanation"; the sheet shows one thing
  with a title (no tab strip); Data & settings or About always has its own dock button. Lab practical credits moved
  to About; AP® graph builder data table moved to Data & settings.
- Process note: before finishing, re-read every comment thread; reply to each one marked awaiting a reply.

## Round of 2026-11-03 morning
- Course homes: "Video lessons" (up to 3) and "Tools" (3) are separate rows again.
- Dashboards (`assets/course/dash.css`): the first section starts below the band (the label overlapped it).
- AP® unit sheets (one sheet per lesson, owner follow-up): `assets/course/sheet-view.js`/`.css`, loaded by `site-chrome.js` `mountSheetView()` on
  `main.*-sheet` pages, list the lessons; each opens alone full screen (prev, next, Print that lesson, Close).
- AP® free-response lists (`*/assets/pages/frq.js`): grouped by type, plain rows (title, first unit); band hand
  line "the written part of the exam" and a one-line lede (`apPageR3` in `scripts/lib/r3-tools.mjs`).
- Tool cards (`toolCard` in r3-tools.mjs and hub.js): no topic or skill label; only `.cx-tool-count` stays.
