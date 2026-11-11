# Anatomy & Physiology: pass 3 cleanup (2026-11-11)

Brief: `docs/tool-review/CLEANUP.md`. Judge: `docs/tool-review/pass2/judge-a.md` (A&P: 2 PASS, 6 TOUCH UP) plus the
lead's list. Branch `claude/tv3-c2`. Shots: `/home/claude/shots/pass3/anatomy-physiology/<tool>_before_d.png`,
`_after_d.png`, `_after_p.png` (plus `predict_body-figure_before_d.png` / `_after_d.png` for the leader lines).
Every tool below was reopened cold at 1280x800 and 390x844 and the judge's five checks re-run. Anatomy 3D and word
roots passed the judge and were not touched.

| Tool | What the judge (or lead) said | What I did | Now |
|---|---|---|---|
| Feedback loops | Six empty boxes read as a blank form; skin vessel is a red horseshoe like a magnet. Lead: about 14 labels, get to about 7 | Stimulus box is "ready" (filled tint, full strength), the six other parts dimmed (0.3) until the signal reaches them, then they stay until Reset. Gone from landing: "lower"/"higher", "At the set point" (the state line speaks only off the set point), "acts on the variable" (appears once the response acts), "heat lost from the skin" (appears with the stimulus). Skin scene: the arteriole is a tube rising from the fat and running under the surface, labelled "arteriole"; it narrows (cold) or widens (heat) as before; its action line sits under it | PASS. Landing labels: 7 part names (6 dimmed) + variable + set point + "arteriole" = 10 drawn, 4 at full strength. The seven names stay: they are the framework (pass 2 pushback) |
| Calculators | Flow said twice (tube and a Flow card); 3 sliders plus 3 number boxes | A result the picture prints with its name or unit ("Flow 40.0 mL/min") is not repeated in the card; a result with a band keeps its card. Checked on all 63 pictured calculators: 25 hide one or more rows, each hidden value is printed in the picture (word-boundary match, so "0 %" never matches "50 %"). Number boxes beside a slider read as the slider's value (dashed underline, tap to type) | PASS: one picture, the answer once, 3 sliders |
| Graph reader | After "pH falls to 7.1" the "7.4: 40" label sits under the "39.8 nmol/L" pill; the marker line runs through "normal blood pH" | A marked point's label tries right, left, then below its point, clear of every value pill and cursor dot, else steps back faint; when the cursor sits on the marked point the label waits (the pill reads the same place, so 40 and 39.8 never sit together). A region's name the cursor line crosses slides to the side with more room. The caption no longer says "dashed curve" when a condition only marks a point | PASS |
| Lab practical | Both heart views with about 30 labels at once; phone labels about 6 px | A figure printing two or three views one above the other (blank band right across it, at least 3 labels each side, no label across the cut; found in 21 figures) shows one view at a time in Explore and Study, fitted to the stage and cropped to its labels' columns, with "Upper view / Lower view" above it. Tapping a label in another view switches to it. Off-view labels are inert (no focus, no tap). Quiz and timed stations keep the whole figure. Heart: 14 labels per screen, text about 15 px on a desktop, about 8 px on the phone (was 6) | PASS on desktop; phone TOUCH UP remains: printed text is about 8 px; the tapped label's name shows large in the dock and + zooms (not opening at 150%: that cut both label columns) |
| Pathway tracer | Wide figure small in the top left, stage empty; phone step chips below the fold | A wide figure (width at least 1.5 x height) fills the stage width; the numbered list goes under it in rows of three (1 2 3 / 4 5 6). Tall figures unchanged | PASS on desktop. Phone: chips are in the dock and visible; the slots sit under the figure and its credit (unchanged) |
| Predict | Gauge names cut off; long scenario lead; half the stage empty without a figure. Lead: run narration overlaps "Show the chain" | Dial names show whole (no ellipsis, up to three or four lines). Without a figure and outside a run, dials are larger and share the stage (four sit two by two). "Show the chain" hides the run's step feed while the diagram is open (the two told the same chain side by side); Hide brings it back. Scenario text unchanged: it already clamps to two lines with More, and its words are the question | PASS |
| Body figure (scene plates, lab figures) | Lead: leftover leader lines to hidden labels | The eraser (lab-fit.js) now follows each line straight on past where white thins (it used to stop there), re-aiming along the line's own centre, over crossing strokes (never painted: 5 steps either side of any other stroke within 7 px are left) and round one bend or fork, which counts only if it ends on the drawing's colour. Audit of all 71 covered lab stations, old vs new pixel by pixel: 17 figures gain erased line, none on a drawing. It also found the old flood erasing outlines that pass a label's side (elbow skin beside "Tendon of triceps muscle", the gland figure's "Tubular" bracket, a thigh edge in body regions, the large intestine's edge): such upright runs are no longer erased | Better, not finished: on OpenStax 19.4 the heart inset is clean and about half the body lines are gone; forked lines that run close together for 40 px or more keep pieces. A full fix needs per-figure line data (see below) |

## Accuracy check (A&P science)

No pin, place, label, answer, explanation, item id or scoring rule changed. The only new anatomy is the skin
arteriole: checked against OpenStax A&P 2e 5.3, Functions of the Integumentary System (read in the Oregon State
open copy of 2e, the OpenStax page did not load here): in heat "arterioles in the dermis dilate so that excess heat
carried by the blood can dissipate through the skin"; in cold "the arterioles serving the superficial dermis constrict
to minimize heat loss"; and 5.1 (the dermis carries the skin's vessels, reached through the hypodermis). The tube rises through the hypodermis and runs in the dermis under the epidermis; it narrows for cold and
widens for heat, as the loop text says. The lab practical view split crops, it moves nothing: each label stays on its
own printed spot. Calculator rows are hidden only when the picture prints the same value.

## Checks

All clean on the final commit: `node scripts/build-anp.mjs --check` (162 topics, 447 files), `node
scripts/check-anp-content.mjs --check` (0 failing, tools 0 failing), `node scripts/check-anp-map.mjs`, `node --test
scripts/test/anp-*.test.mjs` (55 pass), `node scripts/check-site.mjs` (OK), `node scripts/check-weight.mjs` (all 620
within range). The A&P shell budget went 57.5 -> 58 KB (Predict, the heaviest page, measures 57.7 KB): the lab
practical's view code and styles were moved into `lab-fit.js` (loaded on first use) to keep the rest out of it.

## For the lead

- The first-run hint bubble still covers parts of every tool on the phone (shared fix, not mine).
- Leader lines on OpenStax 19.4 (and similar line-art figures with forked leaders): the automatic eraser reaches
  about half. A clean result needs the leader lines stored per scene (a list of segments in `data/scenes.json`,
  painted by `scene.js`), which means a build change; not done here.
- Lab practical on a phone: views help, but printed labels stay small; a "names on tap" overlay would be the next step.
