# Phone pass: AP® Physics 1 group B (torque-balance, rotation-lab, oscillator-lab, fluids-tank, lab-design), 2026-10-13

Rules: `docs/tools-phone-pass.md`. Checked with Playwright at 360×740, 390×844, 740×360 and 1280×800, light and dark,
every Explore scene, every drill kind at 360 px, and the Enlarge view, measuring rendered on-picture text (font size ×
the svg's screen scale) and drag hit areas. Screenshots (scratch, not committed):
`/tmp/claude-0/-home-claude-testaolivier10-del-github-io/1e00213e-3bb5-50fc-a8ac-0b1f2469eb3d/scratchpad/physb/before/`
and `.../physb/after/`, named `<tool>-<state>-<size>-<theme>.png` (`q-<kind>` = a drill kind, `enlarge` = Enlarge).

Found in several tools: the phone label sizes set as `font-size="…"` attributes never applied, because the
text's class sets `font-size` in CSS and CSS beats a presentation attribute. They are now inline styles (or a
`.ls-phone` CSS rule). Phone detection inside a drawing uses the same media query as `.ls-phone`.

Only the tools' own js/css changed; no math files, ids, recording or graded behaviour. All five tool tests pass,
`check-apphys-content` 0 failing. Desktop at 1280 px: pixel-identical for torque-balance, rotation-lab and fluids-tank;
oscillator-lab's cart label is 19 instead of 16 units (its scene is narrow on desktop too); lab-design differs only by
its random apparatus seed.

## torque-balance

- Metre stick at 360 px: numbers 5.9 → 12.4 px, mass labels 7.1 → 12.4 px (the existing phone zoom now applies;
  numbers 12 × zoom instead of 10). Kept horizontal (the physics needs it level); the phone crop to the stick stays.
- Lever-arm label 12 px, placed 40% along the arm on phones so it no longer runs into the pull's F_A label;
  F_A label 8.3 → 13 px.
- Torque bars: the clockwise value and the net line sat under Enlarge; the panel keeps clear of it now.
- Drag targets on phones: masses ≥ 48 px wide, the pull's tip 45 px, and the small "where the pull acts" handle gets
  an invisible 45 px hit circle (same drag).
- Inertia race (phone frame): wider crop, so the "drop 0.80 m" label and the right column's "0.00 J" are no longer
  cut off; A/B, J and K/K_rot labels 12-13 px.
- Drill drawings (520 wide, 0.68 scale): 8.1 → 12-13.5 px for every kind (masses drawn 1.5× on phones);
  "where?" box widened; the race labels shortened to "A: sliders …" (they ran together); a long lever's
  "F = 40 N" was clipped on desktop too, the frame now widens to fit the arrow and label.

## rotation-lab

- Rolling race: "Sphere" was cut off at the left at 360 px; lane, finish, angle and h labels 16 px.
  Bars' last value moved out from under Enlarge; legend 13 px.
- Phone on its side: the race used the desktop frame under the bars (7.7 px); the bars now sit beside the ramp
  (as in the other scenes), labels 12.4 px, "finish" no longer clipped.
- Orbit: Earth, closest/farthest, v and F_g 9.6 → 12.8 px; the K/U/E inset labels now get their intended 17 units.
- Spinning stool: dumbbell hit circles 31 → 46 px.
- Drill drawings: 8.1 → 12.2 px; the race ramp starts further in so "Sphere" fits.
- Left: legend subscripts (trans, rot) render about 11.7 px.

## oscillator-lab

- Graphs (the known weak spot): the x-t/v-t/a-t graph was 68 px tall beside a column of tabs, text 6.5 px. On phones
  it now spans the stage and its viewBox is its CSS width (one unit per px, rebuilt on resize and in Enlarge), 124 px
  tall, ticks 12 px, name 14 px at the left of the zero line (clear of the tick numbers). Tabs sit in a row under it,
  left of Enlarge, 36 px tall. Phone on its side: tabs in a column left of a 100 px graph, kept clear of Enlarge.
- Scene labels 12 px+ (spring 19 units, hanging spring 21; its frame widened so "unstretched", "equilibrium" and
  "mg/k = …" are no longer cut off; mass label 8 → 12 px). On its side the hanging spring uses a wider frame with
  30-unit labels and drops the planet line (it is in the dock).
- Energy bars 84 px wide on phones, K/U labels 15 px, E 13 px. Hanging-spring drag area 47 px tall.
- Drill: x-t graph ticks were 6.8 px (the 12 set as an attribute never applied) → 12.2 px.
- Left: desktop explore graphs stay 9.8 px (unchanged); the cart scene in the portrait Enlarge view is 11.8 px at 100%.

## fluids-tank

- Spring scale: "Graph" showed the free-body diagram and the plot stacked, both tiny (6.7 px). On phones the switch
  is Tank / Forces / Graph ("Forces" only in that scene) and each figure gets the whole stage: plot 13 px, FBD 22 px.
  The scale's dial numbers 8.1 → 12.5 px.
- Scene labels 14 px (12.3 px+ rendered); the tank's cm scale "30" and the stands were under Enlarge (scene keeps
  40 px clear); pressure's "P_atm = 100 kPa" was clipped at the right (three lines on phones).
- Plots (pressure, hole, Bernoulli bars) 10.7-11.2 → 12.3 px+. FBD force values 9.6 → 12.8 px, value line spacing
  now relative to the font; the float FBD note kept clear of Enlarge.
- Phone on its side: scene and graph were side by side with the panel about 150 px wide (FBD 3.3 px); it now uses the
  Tank / Graph switch, wider frames where height-limited, larger labels: 12-15 px.
- Drill figures 12.3 px+; the rise's "1.5 m" no longer clipped.

## lab-design

- Graph (known weak spot): ticks 10.1 → 12.3 px, axis names 11.4 → 13.2 px. Bench labels 11.4 → 12.8 px.
- Phone on its side: bench and graph were side by side at about 7.5 px; it now uses the Bench / Graph switch with
  larger labels (12.2 px+).
- Drill bench: drawn full width on phones (was capped at 240 px tall, 10.5 px labels) → 12.8 px.
- Data table (known weak spot): already readable, 14 px in the Data & settings sheet, 320 px wide, no horizontal
  scroll; unchanged.
- Left: desktop bench label 11.7 px (unchanged); spring bench's "0: no load" crosses the stand post (as before).
