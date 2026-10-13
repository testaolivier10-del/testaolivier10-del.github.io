# Phone pass: AP® Chemistry and Anatomy & Physiology trainers, 2026-10-13

Rules: `docs/tools-phone-pass.md`. Checked with Playwright at 360×740, 390×844, 740×360 and 1280×800 (light; dark
and the Enlarge view at 360 px on a sample), measuring every rendered on-picture text (font size × the svg's screen
scale × any CSS `scale`). "Labels" below are axis numbers, box and part names, captions in the picture; "atoms" are
the element symbols printed inside particle spheres, counted separately. Problems are seeded the same way before
and after, so the numbers compare like with like.

Scratch copies: `build-apchem.mjs --check` and `build-anp.mjs --check` pass, so the committed `chem/` and
`anatomy-physiology/` trees are exactly what the generators write (`build-anp.mjs` has no `--out`); the tool js/css
are hand-written assets the generators do not touch. The pages were served from the working tree; "before" served
`git show HEAD:` for the tool files. Premium was stubbed open in the test server only.
Screenshots (scratch, not committed): `/tmp/claude-0/-home-claude-testaolivier10-del-github-io/1e00213e-3bb5-50fc-a8ac-0b1f2469eb3d/scratchpad/chem-anp/shots/before/`
and `.../after/`, named `<tool>[-quiz|-<graph or calculator>]_<size>[_dark|_big].png`, with `report.json` (numbers).

Edits only in these tools' own files. Shared course files touched: none (no Tool Studio, no course runtime).
Within the chem tool library, `chem-tools.js` gained two helpers the six trainers use (`fitBox`, `watchBox`, below)
and `chem-tools.css` a phone section; `live-beaker.js` (used only by these trainers) got a phone crop. Graded
behaviour, ids, problem codes, recording, item data and A&P science text are unchanged. Validators and tests:
`check-apchem-content --check` 0 failing, `check-anp-content --check` 0 failing, `node --test
scripts/test/anp-*.test.mjs scripts/test/apchem-*.test.mjs` 133/133, `check-weight --check` passes. No console
errors, no sideways page scroll at any size. Desktop (1280) numbers are unchanged for every tool.

## AP® Chemistry: shared pieces

- **Charts drawn at the phone's size.** `ApChemTools.fitBox(host, w, h)` returns the box a chart is drawn in, in CSS
  px divided by the Enlarge zoom, on a phone (`.ls-root.ls-phone`) and the old `w × h` elsewhere;
  `watchBox(host, redraw)` redraws when that box changes (rotation, Enlarge, zoom). Used by the titration curve,
  the buffer graph and both ICE bar charts. Phone chart text: ticks 12.5 px, axis titles 13 px.
- **Live beaker** (`live-beaker.js`): on a phone the beaker/gas jar viewBox is cropped to the glass (260×256 of
  300×280) and particles grow to what their cell holds without touching (cap 1.25, was 1.05); the picture rechecks
  itself once it lands on a phone stage. The flask view is unchanged. The beaker's printed graduations and the
  flask's "particle view" caption (6-9 px on a phone, decoration) are hidden on a phone and come back in Enlarge.
- **Q/K gauge** under a beaker: ÷100/×100 12.5 px (10.5), Q and K 13.5 px (11), and the gauge ends 56 px short of
  the right edge, so ×100 no longer sits under the Enlarge button.
- **Atom symbols** inside spheres are 18% larger on a phone (CSS `scale`; they stay inside every sphere).
- **Pictures to pick** (`.cd-pics`): two to a row at the full column width (160×109 px, were 128×84 thumbnails);
  the radio sits over the picture's corner so the picture gets the width. When the choice is on the stage, the
  picture it is compared with keeps 150 px and the stage scrolls.
- **Phone on its side**: stacked parts go side by side (titration and buffer: graph left, flask/beaker right, so
  the axis titles are clear of Enlarge; ICE: bars | mixture; Q vs K: vessel | gauge).

## Titration curve reader (`titration-curve-reader.js`)

- The known small chart: explore curve labels 6.2 → 12.5 px at 360 (7.2 → 12.5 at 390, 3.8 → 12.3 on its side);
  test-yourself curve 7.2 → 12.5 px. The chart's viewBox follows its box (`geom()`); tapping the curve maps
  through the drawn size. Under 140 px of plot height the pH axis is labelled every 4 instead of 2.
- Enlarge: the curve re-lays out to the full screen (checked).
- Left: particles in the flask's magnifier are 6.6 px symbols at 360 (4.7 before). Thirty-two particles in a
  ~200 px lens on a stage shared with the curve cannot reach 12 px; the counts are in Details ("Particles in the
  flask") and Enlarge shows them at 8-14 px.

## Buffer drills (`buffer-drills.js`)

- Explore graph labels 7.4 → 12.5 px (360), 4.5 → 12.5 (on its side); beaker atoms 6.2 → 9.4 px.
- Capacity drill (two beakers): one above the other when upright, each twice the size; one-beaker drills fill the
  stage width. The note under the beaker and the graph's key keep clear of Enlarge.
- Left: the "H" in HA is the smallest symbol (≈9-10 px at 360, 7.1 in a capacity drill's two beakers).

## ICE table drills (`ice-table-drills.js`)

- Explore bars: labels 10.2 → 12.5 px (360), 5.8 → 12.5 (on its side); the mixture gets more of the height.
- Drill: the live bars were ~170 px wide beside the mixture (5.4 px labels); upright they now sit full width over
  the mixture under the table (12.5 px ticks, 13.5 px species), side by side on its side (12.5 px). Subscripts in
  the table header 11.7 → 12.6 px.
- Left: the gas-jar particles are 8.7 px symbols at 360 (5.0 before), 8.1 on its side.

## Q vs K (`q-vs-k.js`, via the shared pieces)

- Vessel atoms 10.6 → 16 px (360), 5.1 → 11.4 (on its side); gauge labels 10.5 → 12.5 px and clear of Enlarge.
  Test yourself is text on the stage (no change needed).

## Particle diagrams (`particle-diagrams.js`)

- Build: upright, the before and after boxes are drawn 300×160 (were 300×190) so the stacked boxes fill the width;
  atoms 6.7 → 11 px (360), labels 10.8 → 16.8. Both boxes end 48 px short of the stage's right edge, so a
  particle added to the after box never lands under Enlarge. "Empty: add particles" 17 px.
- Pick the picture: options 160 px wide (above); atoms 4.3 → 11.1 px (360).
- Left: on its side the two boxes share 434 px (atoms 7 px, the empty-box note 10.7 px); Enlarge.

## Units and significant figures (`units-sig-figs.js`)

- Text stage (question, cancelling fraction, chips) already at 13-22 px; no picture. No change.

## Anatomy & Physiology

### Feedback loop builder (`feedback-loops.js/.css`)

- The known tiny loop text: on a phone the ring is drawn 344×316 (was 340×416) with shorter, wider boxes, a
  smaller icon and larger text. Box labels 7.8 → 12.2 px, box text 8.9 → 12.6 px at 360 (9.3 → 14.4 at 390).
  The bottom-right box (efferent pathway) is 18 units narrower and the ring sits left, so nothing is under
  Enlarge. Gauge words 13.5-14.5 px. On its side the gauge and the ring sit side by side (ring 4 → 7.6 px).
- The finished-loop figure (Classify, Done) uses the same phone ring at full width. Loop content unchanged.
- Left: on its side (7.6 px) the ring is still small; Enlarge fills the screen with it.

### Graph reader (`graphs.js/.css`)

- On a phone the chart is drawn about the stage's size (`phoneShape`: 330 wide upright, 440 wide on its side,
  panels sharing the height, each keeping 16 px between tick labels). Single-panel graphs 9.2 → 12.3 px (360);
  the Wiggers diagram (4 panels) 2.9 → 11.1 px; audiogram 9.2 → 12.3. Each y-axis title sits level above its
  panel on a phone (rotated, it ran past short panels). Turning the phone redraws the chart.
- The reading card under the chart: right end clear of Enlarge, at most 112 px tall (scrolls, keyboard-focusable)
  so five-series graphs keep room for the chart.
- Fixed: a 4 px sideways page scroll at 360/390 (the "What if" row's negative margin; now matches the dock's
  12 px padding).
- Left: four-panel graphs on a phone on its side are 7 px (176 px of height for four panels); Enlarge.

### Worked-example calculators (`calculators.js/.css`)

- Picture text on a phone: words 12.5 px, ticks 13 px, values 13-15 px, value pills 12.5 px (wider pills), in-bar
  labels 12.5 px. 10.3 → 12.2 px at 360 for the tube/pump/balance pictures, pulse pressure 9.3 → 12.2, lung
  capacities 8.3 → 11.7 (rows 46 units tall on a phone; the picture shares the stage with up to four answer cards).
- A bar segment whose name fits only at the old size keeps it there (ERV 1,200 in lung capacities, 10.3 px)
  rather than dropping to the number alone.
- The tube's in/out gauge words were cut off at both screen edges on a phone; there they now read inward.
- The answer cards end above the Enlarge button (bottom margin; on its side, a right inset).

### Predict the change (`predict.css`)

- Upright: gauges two to a row (were three, names cut to "Strength of lifting her left..") with 100×60 dials,
  names 14 px over up to three lines, status 12.5 px; dial arrows 8.6 → 13.1 px. On its side: three to a row,
  dial arrows 10 → 12 px.

### Word root builder (`word-roots.js/.css`)

- The word fills the stage width (34 px at 360; the longest word sets its own size, `--wr-len`, so
  "afterhyperpolarization" stays on one line), parts 24 px, PREFIX/ROOT/SUFFIX tags 10.5 → 12 px.

### Virtual lab practical (`lab-practical.css`)

- The figure already fills the stage; its credit line 11 → 12 px and clear of Enlarge.
- Left: the figures' printed labels are part of the OpenStax images (about 8-9 px at 360). Tapping one names it in
  the caption, and the tool's own +/− zoom or Enlarge shows them larger. Label hit areas are 41×24 px (box plus
  its existing padding): above the 24 px minimum, below 44, because neighbouring labels sit closer than that;
  enlarging them would make taps land on the wrong label.

### Pathway tracer

- HTML cards at 15 px with 44 px arrows; nothing under Enlarge. No change.

## Not done / for later

- A&P drills inside Predict, Pathways and Lab practical were checked at their first screen only (they are text or
  photos, no drawn labels).
- The titration flask's magnifier and the gas jar remain the smallest pictures (particle symbols 6.6 and 8.7 px at
  360). A larger fix is a different phone layout for them (for example the magnifier alone, the flask as a small
  inset), which changes the picture rather than its size; worth an owner look before doing.
