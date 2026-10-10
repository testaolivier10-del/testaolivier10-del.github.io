# U-AnP-rest notes (tools upgrade Phase 2)

Graphs, Pathways, Calculators, Lab practical and Word roots (A&P). One line each: what changed, the tool's job,
what the owner should check. Accuracy list at the end.

## Graphs (anatomy-physiology/assets/tools/graphs.js, graphs.css)
- **Job:** read a physiology graph and predict how it moves when something changes.
- **Changed:** each graph now has Explore and Quiz tabs. Explore: drag on the chart (or the slider under it, keyboard
  arrows) to move a cursor along x; every curve is read live at that point with its region (`steep middle`,
  `ejection`). "What if…" chips come from the graph's own shift questions: tapping one slides the base curve into the
  shifted one (0.7 s, reduced motion = end state), fades the old curve, parks the cursor where the change is largest,
  and shows the change (`more CO2, H+, heat: 53% −22`) plus the question's explanation. Quiz = the existing questions,
  same ids and scoring; shift questions whose options are plain directions (12 of 114) become "Place the shifted
  curve": drag a dashed copy (or arrow buttons / arrow keys) and it glides to the real curve after the answer. The
  option buttons stay for every question. `#<graph>/explore` deep link; `#<graph>/<question>` unchanged. A graph
  not yet tried opens in Explore, otherwise in Quiz.
- **Owner check:** the What-if chip labels are the overlay series labels (e.g. "Adapted", "Active"); a few are terse.

## Pathways (pathways.js, pathways.css, data/pathway-traces.json, build-anp.mjs publishedTool)
- **Job:** know the order things happen in, and where in the body each step is.
- **Changed:** five pathways now play on the real OpenStax figure, above the drills: blood through the heart and body
  (Fig 19.4), the conduction system (19.18), CSF flow (13.18), the food route (23.2), the nephron's blood supply
  (25.10). **Watch**: a token (drop of blood that turns from blue to orange in the lung capillaries, an impulse, a drop
  of CSF, a bite of food) travels step to step leaving its path, with each step's text and why. **Trace it**: the token
  waits and the student taps where it goes next (the structure, or its printed label, which are keyboard buttons); a
  wrong tap names what was tapped ("That is the Aorta", "step 13: later in the pathway") and rings the real next spot
  with a dashed line to it. New scored item `pathways:<id>:trace` (right = no wrong taps), via AnpCore.toolResult so
  misses reach Review; Review's link opens the pathway. Order / Missing / Error drills and the after-answer diagram
  are unchanged; pathways without a matching figure keep exactly the old view.
- **Data:** `data/pathway-traces.json` (points placed by eye on each figure in image pixels, checked against an
  overlay; label ids per step; `jump` for the blood route's move between the heart inset and the body drawing).
  The build copies it into `assets/tool-data/pathways.json` as `p.trace` with figure size, AVIF srcset, credit and
  label boxes (later-concept labels covered, decision 30). Test: `scripts/test/anp-pathway-traces.test.mjs`.
- **Not traced, and why:** air route (15 steps; figures stop at the main bronchi or start at terminal bronchioles),
  filtrate through the nephron (25.10 labels only the capsule, PCT and loop), urine route, fetal shunts (heart
  chambers unlabeled in 20.44), sound, vision. Each could be added later with a better figure or a two-figure trace.
- **Owner check:** the step points on the five figures (screenshots `p4-*.png`); conduction's "Atria depolarize" is
  placed on the right atrium label, and the AV delay step shares the AV node point (the trace passes through it).

## Calculators (calculators.js, calculators.css, data/calc-pictures.json)
- **Job:** see what each formula does to the body as the numbers change, then work it by hand.
- **Changed:** 19 calculators across 5 picture families get a live picture above the inputs, and every input gets a
  slider beside its number box (both stay in sync; typing still works; presets move both). Families: **tube** (flow,
  radius rule, organ flow, TPR): a vessel with in/out pressure gauges, its width following the radius (or resistance,
  as r ∝ R^-1/4), dots moving at flow ÷ area, a dashed outline of the normal width; **wave** (MAP, pulse pressure):
  two schematic arterial beats between DBP and SBP with SBP, DBP, MAP lines and the plain average dashed; **balance**
  (capillary NFP, glomerular NFP): pressures as arrows out above / in below and the net arrow; **pump** (SV/EF: a
  ventricle beating between EDV and ESV; cardiac output: a heart beating at HR filling a one-minute jug); **stack**
  (lung capacities, ventilation dead space, FEV1/FVC, filtration fraction, clearance vs GFR, glucose load vs Tm, body
  water compartments, O2 content, meal energy): parts of a whole on one scale. Numbers in every picture are the
  calculator's own computed values (test: `scripts/test/anp-calc-pictures.test.mjs`). Practice mode is unchanged and
  shows the picture with the worked solution after an answer. An invalid input dims the picture.
- **Also fixed:** the calculators page scrolled sideways on phones (the picker's long title widened the grid);
  `.calc` now has a `minmax(0,1fr)` column.
- **Not given a picture (70):** unit conversions, counts and scores (GCS, Apgar, Punnett, etc.) where a picture would
  add nothing; A-a gradient and Fick were in the brief but the data has no such calculators.
- **Owner check:** the arterial wave shape is drawn schematically (labelled so in its caption).

## Lab practical and Word roots (lab-practical.js, word-roots.js, tool-kit.js/.css)
- **Jobs:** lab practical: name and find structures on real figures. Word roots: decode a term from its parts.
- **Changed:** a "See it in 3D" button beside the structure's name, for the 55 lab label names (and the word-root
  terms) that are exact body map Browse-by-name labels or listed aliases (`AnpToolKit.body3d`, same rule as the
  P1 strip, no synonyms). It appears in Explore and Study info, in quiz feedback, and in the timed practical's
  review; the Keep going strip no longer repeats it there. Only 2 word-root terms match (diaphragm, clavicle):
  word roots are mostly prefixes/suffixes and non-structure terms. Nothing else in either tool changed.
- **Also fixed:** `scripts/test/anp-tool-kit.test.mjs` read the body map labels from `nremt/body-map.html`, but
  P1-NREMT moved them to `nremt/assets/body-viewer.js`; the test now reads the module (and falls back to the page).

## For accuracy review
1. **Graph readings (Explore):** values between data points are read off the same monotone cubic the chart draws
   (Fritsch–Carlson), never outside the neighbouring points (tested). A "What if" condition swaps the base curve for
   the question's existing overlay curve; the 0.7 s slide between them is animation only, and the readout shows only
   the two data curves' values. No new curves or numbers.
2. **Place-the-curve:** an option counts as a direction only when its text starts with one (left/right/up/down/no
   change); 12 questions qualify. Check that "up/down" and "left/right" in those 12 option texts mean the curve's
   movement on the chart's own axes (e.g. audiogram's y axis is reversed: "moves down" = worse hearing, and a
   downward drag on screen means down on that chart, which is right).
3. **Pathway trace points** (data/pathway-traces.json) are where each step happens on the OpenStax drawing, placed by
   eye: worth a look on blood-flow (pulmonary arteries placed on the left pulmonary arteries; the systemic loop on
   the upper-body capillaries and veins), conduction ("Atria depolarize" on the right atrium) and CSF (the
   median-aperture point stands for "median and lateral apertures"). Blood token color follows each step's existing
   `blood` field (deoxygenated blue, oxygenated orange, exchange purple).
4. **Calculator pictures:** tube width from resistance uses r = (R0/R)^(1/4) (Poiseuille, other factors equal) and
   particle speed = flow / r², relative to the defaults; the arterial wave is schematic (stated in its caption);
   the cardiac-output jug fills at 10x speed (stated). Every number shown is the calculator's own (tested).

## Accuracy review
Independent review 2026-10-09 (spec decision 87). Sources: OpenStax Anatomy and Physiology 2e (Fig 19.4, 19.18, 13.18,
23.2, 25.10; 20.2 Poiseuille and blood flow; 20.2 MAP; 22.4 and 15.4 audiometry conventions), the graph data itself.
1. **Graph readings (Explore):** values are read from the drawn curve (tests pass). **Correct.** But the "What if"
   readout pairs each overlay with a base curve by shape when the panel has several curves, and 14 overlays were paired
   with the wrong one, so the curve that "slides" and the readout's change were against the wrong line: audiogram fluid
   vs age 70 (should be the healthy ear: +30 dB, not +20), pneumothorax vs alveolar, albuterol vs normal (should be
   patient A), demyelination vs the 120 m/s axon (should be 50 m/s), hypnogram cut vs a REM bar, new-antigen IgG vs IgM,
   lactase tablets / antibiotics vs the lactase-persistent curve (should be low lactase), GFR blocked / sympathetic vs
   the dashed comparison line, SGLT2 excreted vs reabsorbed, low-urea vs the shared segment, second stretch vs skeletal
   muscle, and the new K+ equilibrium line read as a change in membrane potential. **Fixed:** these overlays carry
   `"from"` (graphs.js honours it strictly; `"none"` = a new line, read on its own row); test added in
   scripts/test/anp-graphs.test.mjs. Single-curve panels pair correctly.
2. **Place-the-curve (12):** frank-starling sympathetic (up) and weak muscle (down), O2–Hb acid/CO2/heat (right) and
   fetal (left, P50 near 19), CO2 response with metabolic acid (up and left), protanomalous L (left toward M), audiogram
   fluid (down on its reversed axis = higher dB HL = worse; a downward drag on screen is down on that chart),
   urine volume 900 mOsm (up, 0.75 L = 900/1200), pH line at HCO3 12 (down about 0.3 = log 2), ADH after bleed (left
   and steeper), infected wound (right), calcium sensitizer (left). Each key matches the axes and its overlay data.
   **Correct.**
3. **Pathway traces:** all 41 points overlaid on the five figures sit on the structure their step names (checked
   visually). **Correct.** Blood token: blue (deoxygenated) through the pulmonary arteries, purple at the pulmonary
   capillaries, orange from the pulmonary veins on; same at the systemic capillaries; nephron blood stays oxygenated
   through the efferent arteriole. **Correct.** But Trace it marked a tap on another printed label of the same step
   wrong and called it "not on this pathway" (Right pulmonary arteries for "Pulmonary arteries", Pulmonary trunk, Right
   pulmonary veins, venae cavae, lower-body systemic vessels, Left atrium / Bachmann's bundle for "Atria depolarize",
   Lateral aperture for "Median and lateral apertures", lateral ventricle for the choroid plexus step). **Fixed:**
   `also` lists in pathway-traces.json count as right; the wording for other labels is now "not where the next step
   happens"; test added.
4. **Calculator pictures:** r = (R0/R)^(1/4) from R ∝ 1/r⁴ (Poiseuille). **Correct.** Speed = flow / r² **correct**,
   but the radius calculators compared it with the default flow input rather than the flow before the change, and the
   caption said "a narrow tube carries its smaller flow faster", which is false at a held pressure gradient (v ∝ ΔP·r²:
   half the radius gives a quarter of the speed). **Fixed:** baseline is the flow before the change; the caption states
   the computed speed ratio and when narrowing speeds or slows flow. Arterial wave labelled schematic; its drawn mean
   (about 40% of the pulse pressure above DBP) is not shown as a number; MAP ≈ DBP + PP/3 is the calculator's own.
   Jug at 10x speed stated. Balance arrows (Starling; glomerular NFP = GBHP − CHP − BCOP) and stacks add up (tested).
   **Correct.**
5. **3D links:** 55 lab names and 2 word-root terms map to body-map labels. Every one names the same structure, except
   os-1-12 (regional terms), where "Femur" means the thigh region and "Patella" the knee region (the lab accepts
   "thigh" / "kneecap" there), not the bones. **Fixed:** no 3D link for regional-term labels (Umbilicus on that figure loses its link too, a small cost). Others (Bladder → Urinary
   bladder, Ureter → Ureters, Testes → Testis, lungs → Lung, Pulmonary semilunar valve → Pulmonary valve, Dorsalis pedis
   artery) are the same structure. **Correct.**

## Bug pass (2026-10-10, simplify brief, all 7 A&P tools)
Every tool driven with Playwright at 390, 1280 and 1626 wide, light and dark: buttons, pickers and picker search,
tabs, sliders, drags, keyboard paths, next/previous, deep links (`?id=`, `?chapter=`, `?mode=`, `#` hashes, unknown
ids fall back to the default item), switching items mid-action, the Keep going strip, recording to Review, reload
persistence and console errors (none found on any page). Bugs found, each with its fix:

1. **Site header showed the page through it (all tools).** The two sticky chrome rows use the theme's 82%
   translucent `--header-bg`, so on a scrolled tool page the picker, loop title and figures read through the header
   as doubled text (owner's report on Feedback loops). Fix: on tool pages both rows are opaque (`tool-kit.css`).
2. **Sticky panels slid under the header (Graphs, Lab practical).** The graph column stuck at `top:12px` and the lab
   info card at a fixed `top:120px`, so at 1440+ the top of the chart (and on Graphs the 100% gridline) hid under the
   chrome. Fix: both stick at `var(--site-header-h) + 12px`, the measured chrome height.
3. **"Next graph" / "Next pathway" jumped around the course (Graphs, Pathways).** They followed the raw data file
   order while the picker lists course order, so 32 of 76 graphs and 22 of 208 pathways sent you to an unrelated
   chapter (pH scale -> Flow vs radius, skipping enzymes). Fix: Next follows the picker's order (inside `?chapter=`
   when set); checked equal for every item.
4. **Graph cursor collision code never ran (Graphs).** It measured a removed x-readout element (`tag` undefined,
   swallowed by try/catch), so a value pill could sit on a region name ("normal blood pH"). Fix: region names step up
   a line when a value pill overlaps them.
5. **Pathway drill tabs redrew the whole page (Pathways).** Clicking Missing step / Spot the error re-routed, which
   jumped the page to the top and reset the figure's Trace it run back to Watch. Fix: tabs swap the drill in place;
   the hash still updates (`#<id>/<variant>`), deep links and reload unchanged.
6. **Answered practice problem came back as new (Calculators).** After Check, switching to Calculate and back to
   Practice showed the same, already answered problem with an empty box; submitting it silently made a new problem
   and discarded the answer. Fix: an answered problem is replaced on return. The +/- sign button also re-rendered as
   "+" while the problem kept a negative sign; it now shows the stored sign.
7. **Changing a quiz setting re-asked an answered item (Lab practical).** Ticking "Multiple choice" after answering
   redrew the same item unanswered, so it could be scored (and recorded) a second time. Fix: after an answer the
   setting applies from the next item; a second submit of one item is ignored.
8. **A chain kept playing after leaving a scenario (Predict).** Picking another scenario (or End session) while
   "Run it" played left its timers running on the removed card, which then fired `anp-prediction` for the scenario
   you had left. Fix: the chain stops when its card is gone.
9. **Pending keyboard push fired after Reset or Cut (Feedback loops).** Arrow keys on the gauge schedule a run after
   0.7 s; Reset, a cut or a tab switch inside that window did not cancel it. Fix: `stop()` clears it.
10. **Empty Part bank search showed three empty headings (Word roots).** Fix: headings with no match hide, and an
    empty search says "No word part matches."

Checked and fine: picker search and Escape, loop/scenario/graph/pathway/calculator/image-set switching (no stale
state carried over: ring, gauges, ghost curves, overlays, player timers all reset), Watch/Test tabs, Cut a part on
every part, the timed practical (timer, no going back, results and review), Build / Decode scoring, reload restores
the hash item or the last calculator / mode, Review entries for every scored id, Keep going links on every tool.

## Simplify pass (2026-10-10, spec decision 88)
Landing pattern from the simplify brief, shared in `tool-kit.js` (`first`, `why`, `more`, `about`) and `tool-kit.css`
(`.kt-first`, `.kt-seg`, `.kt-why`, `.kt-more`, `.kt-about`). The opener sentence is `lede` in `data/pages.json`
(`blurb` still feeds the hub). What a new student sees first:
- **Feedback loops:** a loop on a gauge; "Drag the marker off the set point, or press Stimulus". Watch | Test yourself.
  "Cut a part" and the partner loop link sit in one disclosure; Test's long how-to is under "How it works".
- **Predict:** the scenario and its dials; "Call each one: up, down or no change. Then press Run it." Each variable's
  chain and why open under "Why?" after Run.
- **Graphs:** the graph; "Drag along the graph...". Explore | Quiz is one segmented control; the intro is under "About
  this graph", "Show phases and regions" under More options, each answer's explanation under "Why?".
- **Pathways:** the first drill; "Put the steps in order...". The three drills are one segmented control (Watch |
  Trace it is another on traced pathways); the intro is under "About this pathway", the summary under "Why it runs this
  way".
- **Calculators:** the live picture; "Drag a slider or type a number...". Calculate | Practice; formula and worked
  examples, and every step, behind disclosures.
- **Lab practical:** the figure; "Tap any label on the figure...". Explore | Study | Quiz (| Timed); quiz prompts are
  the first-step line; quiz settings and Study's reveal buttons are under More options.
- **Word roots:** the term; "Pick what each part means, starting with the last part." Decode | Build | Part bank; the
  topic filter and counts are under More options.
Checked at 390, 1280 and 1626, light and dark: no horizontal scroll, every segment and disclosure at least 40 px tall,
no console errors, every end-to-end flow from the bug pass rerun.
