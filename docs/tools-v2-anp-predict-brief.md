# Tools v2: A&P Predict the change (brief and build notes)

Status file for the v2 rebuild of `anatomy-physiology/tools/predict.html` (Predict the change; rank 8 in
`docs/tools-v2-rollout.md`, Premium, group F "step and flow builders"). Standard: `docs/tools-v2-standard.md`; process:
`docs/tools-v2-builder-brief.md`; worked A&P examples: `docs/tools-v2-anp-graphs-brief.md`,
`docs/tools-v2-anp-pathways-brief.md`, `docs/tools-v2-anp-lab-practical-brief.md` (and their reviews). Branch
`claude/tools-v2-anp-predict`, cut from `claude/tools-v2-all`. NOT merged: an independent review comes first. Decisions
made for the owner are also one line each in `docs/tools-v2-owner-log.md`.

## What the old tool teaches (from `claude/tools-v2-all`)
377 prediction scenarios (`anatomy-physiology/data/tools/predict.json`, spec 8.2): a perturbation, a set of variables,
the student calls each up, down or no change, presses Run it, and the chain plays on dials (and on a figure for some,
decisions 85, 94 to 98); items `predict:<scenario>:<variable>[-<stage>]`, four levels, a setup screen, a summary and a
finished card. The rollout lists it as "no free play: the landing is a graded prediction; 2,308 words in the stage area".

## The one main idea
**A change in the body spreads through a mechanism, one cause after another, and some things do not change.** The
student makes the change on a drawn body system with one knob and watches it travel: each link moves after the one
before it, its label gains an arrow as it moves, the cause line names the chain in order as far as it has reached, and
once everything settles a takeaway says what changed and what stayed the same. A "same" label (grey) on each screen
teaches the "no change" call the bank asks for (spec 9: at least 20% of predict keys are "no change").

| Tab | Body system drawn | The knob (on the picture) | The chain (each link drawn) | Same |
|---|---|---|---|---|
| 1 Arteriole | artery with a cut end, the arteriole with its smooth muscle bands, three capillaries in a tissue of cells and fibers, a venule, two pressure gauges | the arteriole's wall: drag in to squeeze, out to widen (radius 0.5 to 1.3 of usual) | radius, resistance (×1/r⁴), blood flow (through the arteriole and the capillary bed, px-vessel-model; speed = flow / width) | pressure in, pressure out (gauges) |
| 2 Breathing | a person with the chest opened (lungs, diaphragm, airway), a magnified alveolus over a capillary with red cells, CO₂ molecules in air and plasma, H⁺ ions | a rail under the person: 8 to 24 breaths a minute (each breath the same size) | breathing, blood CO₂ (PCO₂ = 40 × 12 / rate), H⁺ (acute buffering), pH, O₂ saturation (a little); each breath out carries CO₂ in proportion to PCO₂ | breath size |
| 3 Kidney | brain with pituitary, the vessel to the kidney, kidney, ureter, bladder; the collecting duct magnified in the medulla (principal cells, aquaporins in the membrane or waiting in vesicles, water drops leaving, a capillary with ADH) | a rail by the pituitary: ADH none to very high | ADH, aquaporins (inserted), water back, urine volume (600 mOsm a day ÷ concentration), urine concentration (50 to 1,200 mOsm/L; drawn as the urine's colour, pale at the top where fluid comes in) | fluid in (about 100 mOsm/L) |
| 4 Heart | a frontal section of the heart beating at 70 a minute, the venae cavae, the aorta with each beat's ejected blood, a sarcomere magnified from the left ventricle's wall | the inferior vena cava: less, usual or more blood back (filling 90 to 160 mL) | venous return, filling (EDV), stretch (sarcomere length), stroke volume (Frank-Starling curve), output (× 70) | heart rate |

The four were picked from the bank's own scenarios (`tube-narrows`, `one-organ-constricts`, `arterioles-dilate`,
`coronary-narrowing`; `hyperventilation`, `breath-hold`, `opioid-overdose`, `fab-anxiety`; `ur-adh-blocked`, `fab-siadh`,
`fab-lost-hiker`; `venous-return-up`, `afterload-l4`, `sympathetic-surge`): one physics chain, one chemistry chain, one
hormone chain and one organ chain, each a level 1 or 2 bank item, each with a real "no change". Every number and
direction agrees with those scenarios' reviewed keys and explanations.

## Research (rule 10)
Seen means the page was opened and read here; "text only" means only a description or search result could be read.

| Source | How it works | What we took |
|---|---|---|
| Virtual Labs (IIT), Basic Model of Blood Flow in Arteries (seen: ibe-amrt.vlabs.ac.in) | Poiseuille model: a radius slider and a pressure control in a side panel, blood cells moving in a drawn artery, a "flow speed" readout and a graph behind a button | Cells moving at a rate that follows the radius; we put the control on the vessel wall itself, drop the side panel and graph, and show resistance and flow as labels on the picture |
| PhysioEx 10, Exercise 5 Activity 1 "Effect of blood vessel radius on blood flow rate" (text only) | Two beakers joined by a tube; the student sets the radius, runs, and records flow in a table | The four-fold power of the radius as the thing to discover; ours shows it at once, no table |
| JSim / Physiome ventilation and CO₂ models (seen: model page only) | Equation models with no student interface on the page | Confirms there is no student tool for breathing rate to pH; our numbers use the alveolar ventilation relation and Henderson-Hasselbalch |
| HSC Science, Nephron Water Balance Explorer (text only: title on hscscience.pages.dev) | Not readable here | Nothing taken |
| The old Predict the change (decisions 85, 94 to 98) | Call each variable, press Run, dials swing | Kept whole in Test yourself; Explore gives the free play it lacked |
| Brilliant (seen in the pathway rebuild) | One manipulable object, the result while the reasoning is fresh | One knob per screen, the result spreading in place |

What ours does better: the change is made on the body part it acts on, every link is drawn and moves after its cause,
the chain is named in order as it spreads, and the thing that does not change is shown. Not found: any tool that lets a
student change one physiological variable and watch the cascade travel link by link through drawn anatomy.

## The design
- **Main control:** one `K.handle` knob per screen, on the picture (the arteriole's wall, a rail by the chest or the
  pituitary, the vena cava); a press anywhere along its path takes it there. Keys: arrows (5 steps for fine ranges),
  Page Up / Down, Home, End. A small "before" tick marks the usual value once the knob has moved away.
- **The spread:** the shown control chases the knob (130 ms) and every link chases what its cause shows now (taus 220
  to 650 ms), so a jump is seen moving down the chain. The picture, labels, numbers, the cause line and the takeaway
  are all read from those shown values (never from the target). Blood flows, breaths come and go and the heart beats
  continuously while Explore shows (they are really happening); the loop stops when Explore hides.
- **Labels:** 1 to 3 words plus a number or arrow ("Resistance ↑ ×16", "Blood pH 7.62 ↑", "Aquaporins ↑", "Stroke volume
  86 mL ↑"); "same" in grey for what did not change. Placed every frame clear of each other, the knob, its tag, the
  "before" tick, Start over and the cue (the pathway tracer's ring search).
- **Cause line** (`K.cause`): the chain as far as it has reached, in order and coloured per link; when everything has
  settled, the takeaway in its place (at most two rows at 360 px); at the usual value, how to start.
- **Colours, one per idea** (`predict-explore.css`): smooth muscle, resistance violet, blood red, air blue, CO₂ slate
  green, H⁺ magenta, pH indigo, O₂ red, ADH purple, aquaporins teal, water sky blue, urine amber, filling venous blue,
  stroke volume and output red, "same" grey.
- **Two compositions per screen**: wide 2:1 (stage 900 px or more) and tall (phones, upright tablets), each drawn for
  its shape; on a short wide screen the view box widens instead of the picture shrinking.
- **Reduced motion:** no loop; a change shows its settled result at once with a short cross fade.

### What is on screen in Explore (counted at 1440 x 900, landing)
Outside the picture: 4 tabs, the purpose line (7 to 9 words), "Show me how", the cause line (one sentence, 11 to 14
words). Controls: 4 tabs, "Show me how", Start over, the knob (7). No side panel. On the picture: Arteriole 5 labels,
Breathing 6, Kidney 6, Heart 6 (plus the knob's tag on three screens). First visit only: the cue at the knob.

### Explore against Test yourself
- **Explore:** the four screens above. Nothing graded or asked.
- **Test yourself:** all 377 scenarios unchanged (setup screen, sessions, Run it, the chain, "Show the chain", summary,
  finished card, every item id and record). `quizView()` in `predict.js` puts every part, caption, pill and card in
  the quiz mode.
- Deep links: `?id=` and `?level=` open Test yourself as before; `?topic=` or `?chapter=` open the matching Explore
  screen when there is one (Test yourself holds the same filtered session), else Test yourself; `#explore/<screen>`
  (new). "?" in Explore has "Test yourself on this", which starts a session of that screen's bank scenarios.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Landing on a graded session | Test yourself (the same session the old tool opened) |
| Every scenario, level, setup, Run it, dials, figure pins, Show the chain, summary | Test yourself, unchanged |
| "How it works" and the four levels in Why | Test yourself's Why, unchanged |
| The scenario picker | Test yourself only |

## Decisions made for the owner
(also in `docs/tools-v2-owner-log.md`)
1. Explore is four drawn body systems (arteriole, breathing, kidney, heart), each with one knob; the 377 scenarios stay
   in Test yourself (owner's decision in the task: Explore is real free play showing one idea).
2. Every screen has one "same" link drawn and labeled, so the "no change" call is taught by watching.
3. The chain spreads with a short lag per link (taus 0.2 to 0.65 s): a teaching pace, not the body's (CO₂ really
   settles over minutes; the kidney over hours). Said in "?".
4. Flow, breathing and the heartbeat animate continuously while Explore shows (they really happen); the loop stops when
   Explore hides and never runs with reduced motion.
5. Numbers come from simple honest models stated in "?" (Poiseuille with fixed end pressures; alveolar ventilation at a
   fixed breath size with acute buffering; 600 mOsm of solute a day; a flattening Starling curve at 70 beats a minute).
6. The takeaway is short (two rows at 360 px); the numbers are on the labels.

## Accuracy
Checked against the course notes that teach each chain (`gradients-flow`, `blood-pressure-flow`, `breathing-control`,
`co2-transport`, `acid-base-disorders`, `urine-concentration`, `cardiac-output`) and the reviewed keys and explanations
of the bank scenarios above:
- Arteriole: resistance ∝ 1/r⁴, flow = gradient / resistance with the end pressures held (one-organ-constricts: gradient
  "none"); half the radius gives ×16 and ×1/16 (tube-narrows). Cells are slowest in the wide capillary bed.
- Breathing: PCO₂ ∝ 1 / alveolar ventilation (40 mm Hg at 12 a minute); pH from Henderson-Hasselbalch with acute
  bicarbonate change (−2 per 10 mm Hg fall, +1 per 10 rise): 20 mm Hg gives 7.62, 60 gives 7.26 (hyperventilation:
  pco2 down, ph up; breath-hold: h up, ph down). Saturation from the alveolar gas equation and the Severinghaus curve:
  97.7% at 12 a minute, 98.8% at 24 (drawn "same", hyperventilation: saturation "none"), 94.9% at 8 (falls,
  opioid-overdose: po2 down).
- Kidney: ADH inserts aquaporins in the apical membrane of principal cells from vesicles (notes); fluid enters the
  collecting duct at about 100 mOsm/L whatever ADH does (ur-adh-blocked: tal "none"); urine 50 to 1,200 mOsm/L and
  volume = 600 mOsm ÷ concentration (the notes' own worked example).
- Heart: more venous return raises EDV, stretches the fibers, raises stroke volume (Frank-Starling) and cardiac output
  at an unchanged heart rate and contractility (venous-return-up).
Points for a person: `docs/anp-needs-author.md`, "Predict the change, tools v2 drawn chains".

## What was built
- `anatomy-physiology/assets/tools/predict-explore.js` and `.css` (new): the engine (tabs, purpose line, the picture,
  the chain of lags, `K.handle`, pooled labels placed every frame, the cause line and takeaway, cue, tour, Start over,
  "?") and the four screens. Static anatomy is drawn once per screen and layout; each frame sets only attributes that
  changed.
- `anatomy-physiology/assets/tools/predict.js`: with the kit on (`V2`), `quizView()` stands in for the studio and puts
  everything in Test yourself; `bootV2()` builds Explore and routes links. Without the kit it behaves as before.
- `anatomy-physiology/data/pages.json`: `"kit2": true` and the new script and stylesheet on the tool; only
  `tools/predict.html` changed in the build. The A&P adapter (`AnpToolKit.kit2`) is used unchanged.
- Tests: `scripts/tools-v2/anp-predict-sweep.mjs` (widths), `anp-predict-frames.mjs` (picture against words, every 16 ms
  of a change), `anp-predict-interact.mjs` (drag, touch, keys, reduced motion, modes, records, deep links, locked).

## Checks run (2026-11-19)
`node --test scripts/test/anp-*.test.mjs` 55 pass; `check-anp-content --check` 0 failing; `build-anp --check` clean;
`check-site` OK (it caught one British spelling, fixed); `check-weight --check`: see Review round 1 (Explore is its own
bucket); `build-apcalc --check` and `build-apmacro --check` clean (no shared file
changed); `check-tool-use` with a local copy of its list: predict sends tool-open, tool-touch(explore), tool-mode(quiz),
tool-use as frame v2, and nothing under automation (the file itself is the collecting branch's, unchanged).
Sweep (`anp-predict-sweep.mjs`, one width per process): 36 states (each screen at its usual value, both ends, points
between and four moments of a change still spreading) at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920, 1366 x
768 and 1280 x 720, light and dark: 912 checks, 0 failures (nothing clipped, labels, knob, tag, "before" tick and Start
over 4 px apart, no text under 11 px, label text inside its pill, the cue covering nothing, tab names fitting, the
picture the largest thing and 80% / 85% / 95% of the stage width, the cause line at most two rows on phones with one
height and on screen, no sideways scroll, no console errors). Frame test (`anp-predict-frames.mjs`): 16 jumps, every
16 ms until settled, 2,975 frames at 360, 390 and 1440, 0 failures (label arrows exactly when the link has moved, the
cause line in chain order and only as far as reached, the takeaway only once settled, drawn radius, CO₂, H⁺,
aquaporins and urine colour matching the shown numbers). Interactions (`anp-predict-interact.mjs`) at 1440 and 390,
light and dark, and 768: 28 checks each, all pass (lands on Explore with the cue; real mouse and real touch drag of the
wall, caught mid spread, the page does not scroll; the cue leaves; End and Home tween; ArrowUp steps; leaving for
Test yourself mid change stops the loop and coming back resumes it; Start over; every screen at both ends; "Test
yourself on this" opens that screen's scenarios; reduced motion at once with a cross fade and no loop; `?id=tube-narrows`
records right, right, wrong under `predict:tube-narrows:*`; `#explore/heart`, `?topic=urine-concentration`,
`?chapter=respiratory` open Explore there, `?topic=cardiac-cycle` and `?level=4` open Test yourself; the real locked page
shows the Premium card and no stage; no console errors).
Performance: see Review round 1.
Shots: `/mnt/user-data/outputs/anp-predict-v2/shots/` (landing, mid drag, narrowest, every screen at both ends, Test
yourself, answered, locked; 1440 and 390 light and dark, 768 light); preview `/mnt/user-data/outputs/anp-predict-v2/index.html`.

## Not done, and what I am not happy with
- The independent review is next; no real phone, screen reader pass or real students.
- The drawings are clean but plainer than the flagship: the heart is the pathway tracer's frontal section (flat top),
  the person on Breathing is simple, the smooth muscle bands read a little like hatching, the kidney panel on phones is
  small.
- Test yourself is the old tool inside the new frame, not redesigned.

## Review round 1 (2026-11-19)
The independent review (`/home/claude/review-anp-predict/REVIEW.md`) blocked on eight must fix items; the settled numbers,
Test yourself and the records were confirmed. Merged `origin/claude/tools-v2-all` first (its `check-tool-use.mjs`, both
sides of the docs tables; no conflict markers).

Must fix, all done:
1. **No false causes on a reversal.** Each link has a sign against its cause; a link's arrow shows only when it moves the
   way its cause's arrow implies, so labels and the cause line stop at the first link still pointing the old way until
   it turns (`state()`). The frame test now also checks every pill's arrow against how that value is really moving.
2. **Arteriole numbers from the drawn radius.** Resistance and flow follow the shown radius at once (no lag).
3. **Honest flow.** Between the gauges the blood passes the arteriole and the capillary bed; the arteriole is taken as half
   of that resistance at its usual size, so the drawn flow is 2 / (1 / r⁴ + 1) (about 1/8.5 at half the radius). The flow
   label and takeaway give no factor; "Resistance ×16" stays on the arteriole; "?" and px-vessel-model say so.
4. **One threshold.** `ctl.key` is half a step: the tag's word, the cause line, every arrow, the "same" labels and the live
   region all move off "usual" together; link thresholds are tiny so any step shows.
5. **O₂ saturation** carries its real arrow (one decimal); "Breath size same" is the breathing screen's held link.
6. **Weight.** `anatomy-physiology/assets/tools/predict-explore.*` is its own bucket (`anatomy-physiology/predict-explore`,
   34 KB, measured 32.8, 33.3 after recheck 1); the A&P shell is back to 69 KB (measured 68.8).
7. **Performance.** The moving things and the labels sit on their own composited layer; the red cells, the water drops and
   the urine drops are one path each; molecules no longer jitter; the ADH molecules move as one group; labels are placed
   only when a label, anchor or control box changed; the dark mode filter is gone. At rest the ambient motion is drawn
   on every third frame; every frame is drawn while a change spreads. CPU x4, this machine (load 5 to 6), against the
   course home in the same run (idle median 16.7, p95 17 to 33): at rest median 16.7 on all four screens at 1440 and 390
   (p95 17 to 33 at 1440, 17 to 83 at 390); full drags median 16.7 (one 16.8), p95 33 to 67 at 1440 and 67 to 83 at 390.
   The p95 on drags is still above 50 on some screens; the idle page's own maximum in the same runs reached 417 ms.
8. **Nothing covered.** The "before" word sits on a pill beside a vertical track (not on the vena cava or the wall); the
   sarcomere box is a keep-out for labels, larger on phones, with "Stretch" below it; the phone kidney panel is
   rearranged (kidney and bladder at the right, the ADH rail below the vessel, its tag beside the knob toward the
   middle), and the kidney and bladder are keep-outs.

Should fix, done: each beat's ejected blood runs the whole aorta with its length set by the stroke volume (86 mL about
half the aorta, 50 mL clearly shorter); the heart has a rounded silhouette with both auricles, the pulmonary trunk and
its branches, an interventricular groove and inlet valve leaflets that open while the ventricles fill and shut as they
squeeze; the smooth muscle is a sleeve of narrow rings; the kidney has a cortex, striped pyramids and a pelvis, the
bladder is a sac; the pressure gauges are keep-outs so their labels sit beside them; the wide arteriole is larger
(lumen 54, artery 68, capillary bed spread to 170) with no empty bands; the kidney "?" says fluid leaves the nephron loop
at about 100 mOsm/L, and px-adh-model asks about 12.5 L against the bank's 15 to 20 percent. The "Alveolus" label is
gone (room on phones).

Accuracy, rechecked for every change: the flow model (arteriole half the resistance between the gauges: flow 0.118 at
half the radius, 1.48 at 1.3); saturation 97.7, 98.8 and 94.9 percent at 12, 24 and 8 breaths a minute, now with arrows
(up when faster, down when slower), against `hyperventilation` ("barely changes", kept in "?") and `opioid-overdose`
(down); the valve leaflets open only in filling (the inlet valves shut during the squeeze); every arrow's sign is the
physiology the bank keys (radius down: resistance up, flow down; breathing up: CO₂ down, H⁺ down, pH up; ADH up:
aquaporins, water back up, urine volume down, concentration up; return up: filling, stretch, stroke volume, output up).

Checks: sweep at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920, 1366 x 768 and 1280 x 720, light and dark, one
width per process: 912 checks, 0 failures. Frame test at 360, 390 and 1440: 2,546 frames each, 0 failures (now including
the reversal check). Interactions at 1440 and 390 (light and dark) and 768: 28 each, all pass. A&P tests 55 pass;
check-anp-content, build-anp, build-apcalc and build-apmacro `--check` clean; check-site OK; check-weight all 623 within
budget; check-tool-use (local copy of the list) frame v2, nothing under automation. Shots regenerated in
`/mnt/user-data/outputs/anp-predict-v2/shots/`; preview regenerated.
