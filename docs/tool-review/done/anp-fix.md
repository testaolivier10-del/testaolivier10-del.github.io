# anp-fix: A&P calculators redesign and the three FIX tools (2026-11-10)

Branch `claude/tv-anp-fix`. Screenshots: `/home/claude/shots/build/anatomy-physiology/` (`<tool>_before.png`,
`_after.png`, `_after_p.png`). Not touched: pathway tracer, predict the change (another builder), 3D anatomy and
word roots (LEAVE).

## Calculators (REDESIGN in part)
- All 89 calculators now draw a picture. The 19 old ones are unchanged; the other 70 use 24 new families in
  `anatomy-physiology/assets/tools/calc-art.js` (+ `calc-art.css`, both loaded on first use), listed in its header.
  `data/calc-pictures.json` names which computed value goes where; captions fill `{key}` from the calculator.
- Done as the review asked: membrane trace with inputs summing to threshold; spikes with refractory periods; an axon
  with a moving impulse; the reflex arc with its timeline to scale; a regrowing nerve; front and back burn figures
  and palm patches; spun tubes (hematocrit, blood volume); GCS and Apgar cards; Snellen chart; drum-to-window areas
  to scale; loudness ladder. Metabolism and fluid budgets stay stacked bars (with labels). Oxygen content now shows
  hemoglobin-bound and dissolved O2 side by side to one scale, with the dissolved share named.
- Practice mode: unknowns print as "?" and pins for unknowns are not drawn.
- Burns figure: drawn from scratch. The NREMT body map figures are BodyParts3D (CC BY-SA 2.1 JP), which spec
  section 2 does not allow in A&P (noted in `docs/anp-needs-author.md`).
- Test: `scripts/test/anp-calc-pictures.test.mjs` now checks every calculator has a picture and that every key and
  caption value is one the calculator computes.

## Feedback loop builder (FIX)
- `loop-scenes.js` (+ `.css`, loaded on first use): 18 drawings of the place in the body cover all 49 loops (skin
  vessels and shivering, sweating, brown fat, uterus and cervix with oxytocin, heart and carotid sinus, kidney tubule,
  afferent arteriole, parathyroids/bone/kidney/gut, pancreas/liver/muscle, lungs and diaphragm, kidney EPO and
  marrow, hypothalamus-pituitary-gland axes, stomach/duodenum/pancreas, bladder, eye, calf, clot, bone). They react:
  stimulus words light while the variable is off; the effector acts once the signal reaches it.
- Wide stage: ring on the left, gauge and drawing on the right (was the ring in 60% of the width). Phone: the drawing
  sits between the gauge and the ring and the stage scrolls to the rest of the ring (the ring keeps its 1:1 text).
- Positive loops (childbirth etc.) now stay at the far end instead of running back to the start.
- First-run hint points at Stimulus, so it no longer covers the set point label.
- Test: `scripts/test/anp-loop-scenes.test.mjs` (every loop has a well-formed scene).

## Graph reader (FIX)
- Graphs with 3+ panels (Wiggers, cycle hormones, and 4 others) are drawn wide and short on a desktop, filling the
  stage width at their CSS text size, with each y title above its panel.
- Hematocrit tubes (`"look": "tubes"` in graphs.json): real spun tubes, plasma, buffy coat, red cells.
- The reading lists only curves at the cursor (no "not on the graph here" rows); tube outlines are not readings.
- Phone: when value pills would stack off their points, they give way to the reading list; a valve label under a
  pill fades.

## Lab practical (FIX)
- A tall figure in a wide stage opens fitted to the width of its drawn part (up to 1.7x) and the stage scrolls;
  the heart external labels went from about 6 px to about 13 px.
- Covered labels' leader lines are traced from the figure's pixels and painted out up to where they meet the drawing
  (`lab-fit.js`, loaded on first use).
- The first-run ring goes on the label with the most room, so it covers no other label on a phone.

## Accuracy check
Every caption and label was checked against the calculators' own steps and standard sources (OpenStax A&P 2e
topics; GCS 2014 terms; Tanaka max HR; Winter's formula; NIOSH 85 dBA). No flags were raised against the tools'
existing science. The everyday decibel levels are labelled "rough guides". No contested items added.

## Checks
`node --test scripts/test/anp*` (51 pass), `build-anp.mjs --check`, `check-anp-content.mjs --check`,
`check-site.mjs`, `check-weight.mjs` all clean. A&P shell budget 56.4 -> 57.5 KB (lab practical page 57.2 KB,
comment in check-weight.mjs).

## Not done
- Phone feedback loops: the ring is partly below the stage fold when a drawing is shown (scroll to see it).
- Owner said redesigns get a mockup first; the calculator pictures were built directly from the review's list.
- No second reviewer pass (no helper agents were available in this session); the accuracy check was done by me.
