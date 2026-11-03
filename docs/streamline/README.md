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
