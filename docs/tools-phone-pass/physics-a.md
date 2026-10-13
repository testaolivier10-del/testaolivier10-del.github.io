# Phone pass: AP® Physics 1 group A (free-body-diagrams, motion-graphs, projectile-lab, energy-bar-charts, collision-lab, scaling-drills), 2026-10-13

Rules: `docs/tools-phone-pass.md`. Checked with Playwright on a scratch build (`build-apphys.mjs --out`, premium gate
removed in the scratch copy only) at 360×740, 390×844, 740×360 and 1280×800, light and dark, Explore, the drill
kinds that draw a figure, playing runs, and the Enlarge view. Rendered on-picture text was measured as font size ×
the svg's screen scale, together with label overlaps, clipping and horizontal scroll. Screenshots (scratch, not committed) are in
`/tmp/claude-0/-home-claude-testaolivier10-del-github-io/1e00213e-3bb5-50fc-a8ac-0b1f2469eb3d/scratchpad/phys-a/`:
`before/`, `beforeq/` (drills before), `after/`, `qa/`, `qa2/`, `qaf/` (drills after, by kind), `big/` (Enlarge),
`fbq-after/`, `cl-run/`, `eb-run/`, `eb-<Scene>/`, `sd-<relation>/`, `sd-bars/`; named `<tool>-<size>-<theme>.png`.

Only the six tools' own js/css changed. Math files, ids, recording and graded behaviour are unchanged. All six tool tests pass, and
`check-apphys-content` has 0 failing. No console errors. Desktop at 1280 px: Explore pixel-identical apart from animation
timing. The only desktop changes are in drill figures (collision force-time graph right margin 14 → 26, so "0.025" is no
longer cut. Projectile cart speed label moved up 6 units and the components "v" label put above the arrow, both
of which overlapped before) and an energy height label that now flips left instead of running off the right edge.

Two shared techniques: (1) a picture drawn at its box's own size on a phone (1 unit = 1 px), so text is its CSS
size; (2) for fixed-viewBox pictures, `--cl-k` / `--eb-k` = viewBox units per CSS px, set on each svg by the
script (phone only, clamped), multiplied into the `.ls-phone` font sizes in the tool's css.

## collision-lab

- **Switch revisited.** A portrait phone (stage ≥ 400 px tall) now shows the track, the p/K bars and the
  force-time graph together (`.cl-all`, the switch hidden). A phone on its side (stage 308 px) keeps the switch:
  the three pictures would each get ~80 px.
- Text at 360 px: track ticks 10 → 12.5, masses/CM 10.5 → 13, bar values 14, F-t ticks and axis names 12.5,
  impulse 14. Bars and F-t draw at their box height on phones. Track rows for v_A / v_B / CM are spaced 26 apart
  so the labels do not touch, and v arrows stop short of the right edge so "v_B" is not cut.
- Enlarge: the bottom picture keeps ~48 px clear at the right (bars "Total" and the last ms tick were under it).
  The phone F-t title reads "Force on B (impulse J = shaded area)" and the label "J = …", because the long label
  ran into the pulse.
- Redraws on resize/Enlarge (it did not before). Drills: carts figure text 9.2 → 13+; the bar builder shows the
  carts again over the chart on a tall phone, and its input row no longer sits under Enlarge (last "Total after"
  box was hidden).
- Left: in landscape the cart letters A/B inside the carts are 10 px (capped so they fit the cart body).

## free-body-diagrams

- Scene notes ("Tip to tail", "relaxed length", "From above", "Center of the curve") 11 → 13 px (12.5 landscape).
- Palette: two columns of 14 px chips on phones, so every force name fits on one line (was 12.5 px, three
  cramped columns with "Gravitational" at the edge).
- Each drawn arrow's tip gets an invisible 46 px touch target (was the 26 px handle).
- Left: the scene keeps its 400×300 drawing, so on a portrait phone it is letterboxed (about 180 px of empty
  stage) and small objects (elevator rider, Atwood masses) stay small. Cropping per scene would risk cutting the
  insets and drawn arrows; Enlarge is the way to zoom.

## motion-graphs

- Graph ticks 11.5 → 13 px, panel names 13.5, track numbers and "x (m) →" 12.5, ghost notes 12.5. The axis name
  has its own row under the track numbers on a phone (it covered "4").
- Bottom-right under Enlarge: the last time numbers are left out on phones and "t (s)" moves to the bottom left.
  On phones the panels no longer print the bottom number of the range, which collided with the next panel's top
  number. The "speeds up" note goes under the line when it would hit the panel name.
- Landscape: the graphs were cut off below the stage (min-height 200 px in a 250 px stage). They now take the room
  left under the track (~110 px), and panels under 44 px label only 0 and skip the notes.
- Drills: the graph is redrawn at its box's size on phones (both ways up), ticks 13 px (were 11.9 / 9.6). Every
  other y number is shown when the gridlines are closer than 18 units, and the right end stays clear of Enlarge.
  "Pick the a-t graph": each choice now spans its card (radio in the corner), 161 px wide at 360 (was 133), and the
  numbers are 12+ px (were 7.3).
- Left: in landscape the three panels are ~25 px each: legible but cramped. Enlarge does not add height there.

## projectile-lab

- Scene numbers, axis names and the scale bar text 11 → 12.5 px. The cliff-height handle (40×16) gets an
  invisible 48×44 touch target (same drag).
- Drill figures are redrawn at their box's size on phones (were a 520-unit drawing at 0.68: labels 8.5 px).
  Labels are now 13-13.5 px, and the components triangle is drawn larger (up to 130 px) so v, vx and vy stay apart.
- Left: the explore scene is width-limited (a 30 m flight across 352 px), so the cannon stays small; the readout
  pill's subscripts are 10.8 px (shared pill styling).

## energy-bar-charts

- Scene text with `--eb-k` (up to 4): ruler numbers 5.2 → 12.5 px, "h = …" 5.4 → 12.5, notes and arrow labels
  12.5-14. The readout lines are spaced to match. The ruler numbers every other meter in a very small scene, and the
  ramp's floor notes stay inside the ground band and the picture. The lift readout sits below the motor.
- Bars draw at their box height on phones (text at CSS size), "W" / "work in" no longer overlap, and the right end
  is clear of Enlarge. The scene gets a little more of a portrait stage.
- Dragging the skater maps through the screen matrix (the old maths was off by up to ~25 px when the scene was
  letterboxed on a phone). Redraws on resize/Enlarge.
- Landscape: the scene is ~88 px tall, so its v/h readout moves to the caption. Drills: the bar builder's
  text is 12.5 px or more (was 9.5), it shows the scene thumbnail and system again on a tall phone, and its input row is clear of Enlarge.
- Left: in landscape the scene is small (Skater's track ~170×88 px). The stage there also holds the scene
  switch and the system chips, and moving those is a bigger layout change.

## scaling-drills

- Picture text (captions, chips, tick and dimension labels) set to 17-17.5 units on phones: 10.3-11.7 → 12.2-13 px
  at 360 (the 480-unit drawing renders at 0.73). The second foot caption moves down into the letterbox so the
  two no longer overlap.
- Landscape: the picture keeps clear of Enlarge (the "After" caption was under it). In the Bars view, the
  Picture/Bars switch covered the first bar's "× 1" label, and it now sits in the pill row as in the Picture view.
- Enlarge: the Picture/Bars switch covered the zoom and Close buttons. It now sits under the zoom bar.
- Left: on a portrait phone the side-by-side drawing uses about half the stage height. Stacking Before over After
  would not enlarge it (the stage is height-limited at the same 0.73).
