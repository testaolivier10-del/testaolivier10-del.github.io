# Phone pass: AP® Calculus AB group B (related-rates, motion-lab, curve-analyzer, riemann-sums)

2026-10-13, per `docs/tools-phone-pass.md`. Checked at 360×740, 390×844, 740×360 and 1280×900, light and dark,
reduced motion, touch emulation, Enlarge view. Screenshots (scratch, not committed):
`<scratchpad>/rev-b/before/` (before), `after/`, `after2/`, `land/`, `final/` (after). Edits only in the four
tools' js/css/model files. Desktop is unchanged apart from the small layout fixes listed in
`docs/apcalc-reviews/tools-b.md`.

## Common change: drill figures sized for the phone

Before: every drill figure was an ApCalcPlot drawn at 600×360 (520×300 for Riemann) and shrunk to ~350 px, so
tick labels rendered at 6-8 px, with a third of the stage empty. Now each tool's `figSize()` draws the figure at
about the stage's own size on a phone (340 wide and as tall as the stage allows in portrait; 440 wide on a phone on
its side; smaller when a table or the problem text shares the stage), and `.ls-phone` sets the plot font to
12.5-13 px. Desktop sizes unchanged.

## related-rates

- Scene text is in a 420-unit viewBox drawn at ~350 px: under `.ls-phone` labels are 15.5 units (≥ 13 px) and the
  moment's values 17 units (≥ 14 px); landscape 16.5/18 and the readout table hides so the scene gets the full
  stage height (the rates stay in the pill, every number in "Graph & numbers").
- Ladder moved right so its y label is never clipped at the larger size.
- Drill legend ("Given … / Find …") in a band above the scene: no overlap with the balloon or the lamp.
- Drag handle: invisible 27-unit hit circle (≥ 44 px at 360).
- Readouts padded right so the Enlarge button no longer covers the rate column; compact one-line pill on any phone.

## motion-lab

- Stacked x/v/a: a "Graphs shown" switch in the dock on phones (x, v, a / x only / v only / a only). One graph
  gets the whole graph area. Portrait opens on all three (each about 90 px tall with 12 px ticks); a phone on its
  side opens on v alone (three graphs would be slivers there) until the student picks.
- Graph ticks, axis and road labels 12 px, panel names 13.5 px on phones; legend kept, 12 px, with room on the
  right and a minimum height so Enlarge sits beside it, not on the t axis.
- Road taller at phone width so both arrows fit; arrows clamp to the road with their letter on the free side.
- Graph area min-height reduced on phones so a phone on its side no longer clips the stage.

## curve-analyzer

- Same "Graphs shown" switch (All three / f only / f′ only / f″ only); a single graph keeps the sign charts that go
  with it (f: both; f′: the f′ chart; f″: the f″ chart). Landscape phones open on f with both charts.
- Ticks, feature labels, sign-chart text 12 px, panel names 14 px; legend shown again on phones (it was hidden)
  with Enlarge clearance; feature labels near a panel edge go beside the point.
- Optimize: scene text 15 units; the derivative graph's axis title moves left on phones (it was under Enlarge);
  can note no longer runs off the scene.

## riemann-sums

- Explore plot drawn at its real width (the 300 px floor made it shrink on phones), plot font 12.5 px, 40 px clear
  band under the plot for Enlarge.
- Water tank beside the plot: wider (112 px), only 0 / half / full marks shown on phones, 20.5-21 units (≥ 12 px).
- Drill figures sized as above, also under a table.

## Left

- Two shared issues (not mine to fix): the first-run hint tooltip covers the dock on phones; the studioAsk caption
  splits a question at a decimal point (see the review).
- related-rates scenes keep their fixed 420×290 shape, so portrait phones show empty space above and below the
  scene; the text rules are met, Enlarge gives the full screen.
