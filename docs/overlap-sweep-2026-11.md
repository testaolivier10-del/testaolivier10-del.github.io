# Overlap sweep (2026-11)

Owner ask: go across the whole site and fix every formatting overlap (text on text, text through a box's border,
text clipped or spilling out, anything wider than the screen), at phone (390x844) and desktop (1280x900).

## How it was checked
`scripts/check-overlap.mjs` (Playwright, see its header). One page of every page type in all 13 courses (home,
Progress, practice, review, exams, flashcards, learn, path, tools hub and every tool, glossary, videos, frq,
justify, cram, teachers, plus sampled notes, lessons, units, unit sheets, unit tests, frq, chapters, concepts and
mechanisms pages) and every top level and teach/ page. Two states: first visit, and after a short practice set with
Premium stubbed on (the practice question, its feedback and the session summary are scanned too). Both widths.
Fixed and sticky chrome, deliberate overlays (coach marks), hidden and screen reader text, SVG figures
(`check-legibility.mjs` covers them), MathML and scrolling boxes are skipped. Text inside its own card that sits over
another box (a card pulled up over the band) is settled by hit testing: only text the other box covers is reported.

Runs: `node scripts/check-overlap.mjs` (about 13 minutes, CONC=6 faster); `SAMPLE=5` adds five pages per folder.

## Findings and fixes
1. Progress band (owner's example): the status line ran into the level chip's border (`.d5-lvl-row` had a
   negative top margin). Fixed upstream the same day by the Progress cleanup, which took the chip out of the band.
2. Previous/next topic links under every notes topic (all courses, both widths): the "Next topic" title did not
   shrink, so the two titles were drawn over each other. `assets/course/book.css`: `.rt-nav a b{max-width:100%}`,
   so each title ends in an ellipsis inside its half.
3. FRQ pages with a wide data table on a phone (Env Sci El Niño 68 px, Chem amines 4 px, any FRQ with a wide
   table): the stimulus card was stretched past the screen because grid items keep their min-content width.
   `assets/course/reading.css`: `article[class$="-frq"] > *{min-width:0}` so the table scrolls in its own wrapper,
   and the caption stays put and wraps to the visible width (`container-type` on the wrapper, sticky caption).
4. Chem particle diagrams tool: each chip's count sat on the chip's top border. `chem/assets/tools/chem-tools.css`
   moves it inside the chip.
5. Ochem arrow pusher and resonance tools on a desktop: the Enlarge button covered the Clear button.
   The phone rule that keeps the editor bar clear of it now applies at every width (`ochem/assets/tools.css`).
6. Unit pages (AP courses, phone): two digit topic numbers ("8.10") ran into the topic title; the big number sat in
   book.css's 30 px track. `assets/course/r3-reading.css` gives it a 56 px track.
7. Lessons on a phone: a long one word title ("Compartmentalization") at 40 px pushed the page 40 px sideways, and
   the hero's kicker line ("Chapter 17 · Carboxylic acids & derivatives") did not wrap. `r3-reading.css`: smaller
   title on phones (28 to 40 px), long words break, the kicker wraps.
8. A&P core concepts page with progress: the "N% mastery" line was drawn over the gap and the next card.
   `anatomy-physiology/assets/anp.css` stacks card and line in the cell (the generator's markup is unchanged).
9. Env Sci, Macro and Psychology practice feedback: the shared answer chip rules in `assets/course/study.css` listed
   only the other courses' marks, so these three showed two chips per checked option ("Correct" and "Your answer,
   correct") and squeezed their own chip to a sliver with the words spilling out. Added `.env-mark`, `.mac-mark`,
   `.psy-mark` to those lists.

## Explained, not changed
- NREMT flowcharts: the answer tabs straddle the top edge of their arm on purpose (tab on a folder).
- Wide notes figures leave the text column on desktop on purpose (`.notes-figure--wide`).
- Text in a scrolling table past the wrapper's edge is reachable by scrolling.

Before/after screenshots were saved outside the repo (/home/claude/overlap-shots/, nine pairs).

## Result
Final run: 1,700 renders (both widths, both states, five pages per sampled folder), nothing flagged. The
`assets/course` weight budget went from 57.0 to 57.2 KB (measured 57.1) for fix 9. `scripts/ci-local.sh` passes.
