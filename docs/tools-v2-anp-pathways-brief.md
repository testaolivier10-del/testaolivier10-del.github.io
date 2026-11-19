# Tools v2: A&P Pathway tracer (brief and build notes)

Status file for the v2 rebuild of `anatomy-physiology/tools/pathways.html` (Pathway tracer; rank 6 in
`docs/tools-v2-rollout.md`, Premium, group F "step and flow builders"). Standard: `docs/tools-v2-standard.md`; process:
`docs/tools-v2-builder-brief.md`; worked A&P example: `docs/tools-v2-anp-graphs-brief.md`. Branch
`claude/tools-v2-anp-pathways`, from `claude/tools-v2-all`. NOT merged: an independent review comes first. Decisions
made for the owner are also one line each in `docs/tools-v2-owner-log.md`.

## What the old tool teaches (from `claude/tools-v2-all`)
208 pathways (`anatomy-physiology/data/tools/pathways.json`), each in three graded drills: put the steps in order,
find the missing step, spot the error (items `pathways:<id>:order|missing|error`). Five pathways also play on an
OpenStax figure (Watch, and Trace it, scored as `pathways:<id>:trace`), and every pathway is drawn as a generated step
map or on a scene figure (decisions 92, 94 to 98). The rollout lists it as "no free play: all three modes are graded;
1,186 words in the stage area".

## The one main idea
**A physiological pathway is a chain of causes through real body parts.** The student carries the thing that travels
along the drawn body route; each step happens in place as it arrives; after one full run a part can be broken, and the
next run shows what fails downstream.

| Tab | Pathway (data id) | What is drawn | What travels | What can break |
|---|---|---|---|---|
| 1 Heart | `blood-flow` (13 steps, a cycle) | lungs with alveoli, the four chambers and four valves, the great vessels, body tissue with cells | one blood cell (blue, turns red in the lung capillaries, blue again in the body) | "Stop air": no fresh air in the alveoli; blood still flows but picks up no new O2, the body cells get less |
| 2 Reflex arc | `reflex-arc-knee` (7) | a seated person's thigh and lower leg, quadriceps with a muscle spindle, patella and ligament, reflex hammer; the lumbar cord in cross section (magnified from the backbone), dorsal root ganglion, both roots | the signal (orange on the sensory neuron, blue on the motor neuron) | cut the dorsal root, or the ventral root: the signal stops at the cut, no kick |
| 3 Hormones | `hpa-axis` (7) | the hypothalamus, stalk with portal veins and pituitary, magnified from a standing person's head; liver, kidneys and adrenal glands in a window; one blood vessel joins them | the signal: stress (orange), CRH (teal), ACTH (purple), cortisol (amber) | damage the pituitary (no ACTH, no cortisol, CRH builds up) or the adrenal cortex (no cortisol, ACTH builds up) |
| 4 Synapse | `synaptic-transmission` (9) | axon terminal with vesicles, Ca2+ channels and a reuptake transporter; the cleft; the postsynaptic cell with receptor proteins, two neighbouring terminals, the trigger zone and its threshold bar | the signal: action potential, Ca2+, neurotransmitter, Na+ and the EPSP | block the Ca2+ channels (nothing released) or the receptor proteins (transmitter cannot bind, no EPSP) |

The four were picked to cover the four kinds of chain the bank holds: flow through organs, a nerve arc, a hormone
cascade with feedback, and a cellular chain. They are the textbook pathways spec 8.4 names first.

## Research (rule 10)
Seen means the page was opened and read here; "text only" means only a description or search result could be read.

| Source | How it works | What we took |
|---|---|---|
| Brilliant, "How Brilliant teaches" (seen, brilliant.org/resources) | Learners make decisions instead of watching ("moving a point"), concrete manipulable objects first, feedback "while the reasoning is still fresh" | The student moves the thing; each step answers at once in the picture; the break is a question asked by doing ("what fails?") |
| PBS NOVA, Map of the Human Heart (guide page seen; the interactive itself not run) | A six step "Step Thru Animation" of blood through the heart, blue and red, plus 12 labeled parts | The order and colours; ours is driven by the student, has every valve and both circuits, and names each step as it happens |
| Brilliant app (text only: reviews and app store descriptions) | One small interaction per screen, instant feedback | One control per screen |
| Interactive 3D heart (mccullough.com heart-simulation-v2, seen in the graphs rebuild) | A rotating heart with three phases and a rate slider | Nothing tied to a route; confirms the gap |
| Case Western NeuroWiki, A Simple Reflex Loop (seen) | The knee jerk as hammer, spindle, Ia fiber through the dorsal root, one synapse, motor neuron, quadriceps; reciprocal inhibition of the hamstrings | The five parts in order; reciprocal inhibition is named in "?" (not drawn). It puts the synapse in the dorsal horn; the course (and Purves, Kandel) put the motor neuron in the ventral horn, which is drawn |
| Reflex arc revision pages (Seneca, Pearson; text only from search) | Static diagrams; "what if the sensory neuron is cut" is asked in words | The cut becomes an action |

What ours does better: the route is the real anatomy, the student's finger is the thing travelling, every step is
seen happening in place, and a break shows what fails, all on one screen, with the steps named in order beside it.
Not found: any tool where a student breaks a step of a body pathway and sends it again.

## The design
- **Main control (every tab):** the knob on the route (`K.handle`): it rides the drawn route (vessels, nerves, the
  stalk, the cleft); a press on the route away from the knob sends the token there (seen travelling) and keeps
  dragging. Keys: arrows step to the next or previous step, Home, End.
- **What travels is drawn under the knob** as a coloured halo (the blood cell's colour follows its oxygen), with a
  faint trail behind it in the colour of each part of the trip.
- **Every step happens in place:** valves swing, ventricles squeeze, gas moves between alveoli and blood and between
  blood and cells, the hammer taps and swings away, the spindle stretches and its ending lights, the synapse lights,
  the quadriceps shortens and the leg kicks, glands light and release their hormone, glucose leaves the liver, brakes
  appear, Ca2+ enters, vesicles fuse, transmitter crosses and binds, Na+ enters, the EPSP spreads, the threshold bar
  fills and the trigger zone fires, the cleft clears. The picture is a pure function of the shown position, which
  chases the knob (tau 110 ms), so a jump tweens through every step on the way.
- **Steps reached, beside the picture** (the rail): numbered, each named with the pathway's own step label (the
  reviewed data) once the token reaches it; the current one highlighted; failing steps struck through in red. On a
  phone and tablet it is a row of dots with "Step 3 of 7" and the current name.
- **Cause line** (`K.cause`, "Step n:") from the drawn state; "What fails:" after a break; the takeaway at the end of a
  run, with "Now break a part."
- **Breaking a part (secondary, after one full run on that tab, then remembered):** one or two small red buttons on
  the picture ("Cut", "Damage", "Block", "Stop air"), pulsing three times the first time. A break cannot be undone by
  dragging back: "Start over" (always there, top right) brings an intact picture with a short cross fade. If the
  token had already passed the break, a new one starts at step 1 (what already happened is not undone; said in "?").
- **Labels** 1 to 3 words on the picture, placed every frame clear of each other, the knob and the buttons (a ring
  search with a leader line when nothing beside the part is free). One strong label names what the token is now
  (for example "CRH", "Ca2+ in") or where it is (the heart's step names).
- **Colours, one per idea** (`pathways-explore.css`, from the course's visual language): afferent orange and efferent
  sky blue (`--anp-aff`, `--anp-eff`), oxygen poor blue and oxygen rich red, valves green, CRH teal, ACTH purple,
  cortisol amber, glucose gold, Ca2+ green, neurotransmitter pink, the electrical signal indigo, broken parts red.

### What is on screen in Explore (counted in the browser, 1440 x 900, at landing)
Outside the picture: 4 tabs, the purpose line, "Show me how", the rail and the cause line: 47 words on Heart (the rail
holds one name at landing), 39 to 40 on the others. 7 controls: 4 tabs, "Show me how", "Start over", the knob (plus
the break buttons after a full run). No side panel of information. On the picture: Heart 6 labels (Lungs, Body cells,
the four chambers; on a phone only the chamber the cell is in), Reflex 5 (Quadriceps, Spinal cord, Sensory neuron,
Motor neuron, Tap), Hormones 5 (Hypothalamus, Pituitary, Adrenal cortex, Liver, Stress), Synapse 5 (Axon terminal,
Ca2+ channel, Receptor proteins, Trigger zone, Action potential). First visit only: the cue at the knob ("Drag the
blood cell", "Drag the signal").

### Explore against Test yourself
- **Explore:** the four screens above. Nothing graded or asked.
- **Test yourself:** all 208 pathways and every drill, unchanged (ids, scoring, recording, hints, Keep going strip,
  the finished card), in the frame's Test yourself panel. The tool's own modes (Watch | Trace it | Drills, or Order |
  Missing step | Spot the error) are a small switch at the top of the panel (`subStudio()` in `pathways.js` stands in
  for the studio and puts every part in the quiz mode).
- Deep links: `#<pathway>` and `#<pathway>/<drill>` open Test yourself there; `#all` the list; `#<drawn
  pathway>/explore` opens its Explore tab (other pathways open Test yourself); `?topic=` and `?chapter=` open the
  matching Explore tab when one exists, else Test yourself on the pathway they chose before. New: `#explore/<tab>`.
  "?" in Explore has "Test yourself on this pathway".

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| The three drills for all 208 pathways | Test yourself, unchanged |
| Watch and Trace it on the five OpenStax figures | Test yourself, the same pathway's Watch / Trace it / Drills switch |
| The step map and scene pins after an answer, Play and the step arrows | Test yourself, unchanged |
| "About this pathway", topic, Next pathway, figure credit | Test yourself's Explanation and "?" as before; Explore's "?" has the pathway's intro and topic links |
| The pathway picker and the list (`#all`) | Test yourself only |
| The "Start here" hint in the dock | Not shown on a kit2 tool (one cue at a time, and the cue is in Explore) |

## Decisions made for the owner
(also in `docs/tools-v2-owner-log.md`)
1. Explore shows four drawn pathways (heart, reflex arc, stress hormones, synapse); the other 204 and every drill are
   in Test yourself (rollout questions 4 and 5, answered by the owner's decision in the task).
2. The student carries the thing along the route; nothing plays by itself (no Play in Explore).
3. Breaking a part comes after one full run on that tab (extras start hidden), is one tap, and is undone only by
   "Start over".
4. If a part is broken after the token passed it, a new token starts at step 1 (the knob moves; logged as an
   exception to "one control never moves another", because the old signal already happened).
5. The heart's break is "no fresh air in the lungs", not a blocked valve: a fully blocked valve is not survivable and
   would teach the wrong picture; no air is honest (the blood still flows, picks up no new O2).
6. The hypothalamus and pituitary are drawn magnified beside a standing person, joined by one vessel that stands for
   the circulation; the spinal cord is drawn magnified beside the thigh. Both say so in "?".
7. Two neighbouring terminals fire with the synapse so the EPSPs reach threshold (spatial summation); the blockers act
   on every synapse of the cell.
8. The steps reached are named with the pathway's own step labels from the bank (reviewed text), not new words.

## Accuracy
Every word on the pictures, the cause lines and "?" was checked against the course notes that teach it
(`anatomy-physiology/data/notes/`: blood-flow-heart, reflexes, adrenal-glands, hypothalamus-pituitary, synapses) and
the pathway's own reviewed steps. What the pictures add:
- Heart: valves open while the chamber behind fills and shut as the ventricle squeezes; blue and red are the course's
  convention ("no blood is blue"; returning blood is still about 75% loaded, so "less O2", not "no O2", with no fresh
  air).
- Reflex: spindle, sensory neuron with its cell body in the dorsal root ganglion, dorsal root, one synapse in the
  ventral horn (glutamate), motor neuron out the ventral root, acetylcholine at the junction, quadriceps; a cut root
  abolishes the knee jerk (notes, "A cut dorsal root ... or a cut ventral root ... can each abolish the same knee
  jerk").
- Hormones: CRH into the portal system, ACTH into the blood, zona fasciculata, cortisol raises glucose and brakes CRH and
  ACTH; Addison disease raises ACTH very high (notes). Pituitary damage raising CRH is physiology the notes do not
  state: in `docs/anp-needs-author.md`.
- Synapse: the notes' nine steps; calcium sets release ("remove calcium ... nothing is released"); receptor blockers
  (curare type); one EPSP far too small, spatial summation at the trigger zone.
Points for a person: `docs/anp-needs-author.md`, "Pathway tracer, tools v2 drawn routes".

## What was built
- `anatomy-physiology/assets/tools/pathways-explore.js` and `.css` (new): the engine (tabs, purpose line, the
  picture, `Route` for the route geometry and picking, `K.handle`, pooled labels placed every frame, the rail, the
  cause line, cue, tour, break buttons, Start over, "?") and the four screens. Static anatomy is drawn once per tab
  and size; each frame only sets attributes (transforms, positions, classes) on the parts that change.
- `anatomy-physiology/assets/tools/pathways.js`: with the kit on (`V2`), `subStudio()` turns the studio's modes into
  the inner switch and puts every part in Test yourself; `routeV2()` routes links; the hash is only rewritten while
  Test yourself shows. Without the kit it behaves as before.
- `anatomy-physiology/data/pages.json`: `"kit2": true` and the new script and stylesheet on the tool; only
  `tools/pathways.html` changed in the build. The A&P adapter (`AnpToolKit.kit2`) is used as it is: no change.
- Sweep test `scripts/tools-v2/anp-pathways-sweep.mjs`; frame test `scripts/tools-v2/anp-pathways-frames.mjs`.

## Checks run (2026-11-18)
`node --test scripts/test/anp-*.test.mjs` 55 pass; `check-anp-content --check` 0 failing; `build-anp --check` clean;
`check-site` OK; `check-weight --check` all 620 within budget; `build-apcalc --check` and `build-apmacro --check`
clean (no shared file changed); `check-tool-use` with a local copy of its list: pathways sends tool-open,
tool-touch(explore), tool-mode(quiz), tool-use as frame v2, and nothing under automation (the file itself is the
collecting branch's, unchanged).
Sweep (`anp-pathways-sweep.mjs`, one width per process): 63 states (every step of the four routes, the moments
between, the end, each break with the run stopped at it) at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920,
light and dark: 1,260 states, 0 failures (nothing clipped, labels 4 px clear of each other, the knob and the buttons,
the cue covering no label, tab and step names fitting, the picture the largest thing, the cause line at most two
rows on phones with one height up to 1,100 px, no sideways scroll, no console errors). Frame test
(`anp-pathways-frames.mjs`): every 0.01 of a step on all four screens and every break, 6,137 frames at 1440 and 5,931
at 360, 0 failures (words and labels never ahead of the picture). Performance, CPU throttled x4, a full drag of each
route: median 16.7 ms on every screen at 390 and 1440, p95 at most 33.4 ms (an unchanged attribute is never written
and the controls' boxes are measured only when they change, so a frame forces no layout).
Playwright at 360, 390, 768, 1024 and 1440, light and dark (25 to 26 checks each, all pass): opens on Explore with the
cue; a real mouse drag (desktop) and a real touch drag (phone, tablet; the page does not scroll) move the cell through
the right ventricle; the cue leaves; ArrowRight steps; End tweens (frame caught mid way); the takeaway and the break
button come at the end; breaking after the cell passed starts a new one; with no air two steps fail and are labeled;
leaving for Test yourself mid tween stops it and coming back keeps the place; reduced motion is at once with a cross
fade; Test yourself records `pathways:reflex-arc-knee:missing` as right and `pathways:hpa-axis:missing` as missed; the
real locked page shows the Premium card and no stage; no console errors. Deep links checked: `#all`, `#<id>`,
`#<id>/missing`, `#blood-flow/explore`, `#explore/synapse`, `?topic=synapses` (Explore), `?topic=cardiac-cycle`
(Test yourself).
Shots: `/mnt/user-data/outputs/anp-pathways-v2/shots/` (landing, mid drag, mid jump, breaks, every screen, Test
yourself, locked); sweep frames in `sweep/`; preview `/mnt/user-data/outputs/anp-pathways-v2/index.html`.

## Not done, and what I am not happy with
- No real phone, screen reader pass or real students; the independent review is next.
- On a phone the 4:3 picture is about 290 px tall with empty page below it; the heart shows only the chamber the
  cell is in (the four chamber labels from 768 up).
- The people (the seated leg, the standing figure) are simpler than the flagship's lake; the hormone figure's arms
  and the reflex torso are plain.
- The synapse's threshold bar has no label of its own (the strong "Threshold" label comes at step 8; "?" explains it).
- Test yourself is the old tool inside the new frame (its modes as a small switch), not redesigned.

## Review round 1 (2026-11-18)
The independent review (`/home/claude/review-anp-pathways/REVIEW.md`) blocked on eight must fix items and kept the idea,
the science (including the ventral horn synapse) and Test yourself. Merged `origin/claude/tools-v2-all` first
(`check-tool-use.mjs` is the collecting branch's; both sides of the docs tables kept).

Must fix, all done:
1. **No side column.** The step list is the one line under the picture at every width (dots, "Step n of N", the
   current step's name); its tour step is gone. The picture takes the stage: at 1440 x 900 it is 1,180 of 1,344 px
   (the height of the screen sets the rest); the sweep now fails a picture under 82% of the stage width (95% on phones).
2. **Phones.** Each screen has two compositions of the same drawn parts (`layouts` in `pathways-explore.js`): wide,
   2:1, for a stage of 900 px or more, and tall, 1:1, for phones and upright tablets (the picture is 382 x 382 at 390,
   was 382 x 287). The knob is a clear ring (54 px, open centre) and the token a coloured ring round it, so the valve,
   gland or synapse acting under it stays in sight.
3. **A broken run goes as far as the thing really goes.** Each break has its own stop after its last real step (dorsal
   root: at the ganglion; ventral root: the motor neuron has fired, the signal is in the axon; pituitary: CRH has
   reached it; adrenal: ACTH has arrived; Ca2+ block: the action potential is at the membrane; receptor block: the
   transmitter has crossed the cleft). A cut is drawn a knob's width further down the route. The frame test now
   checks every break at 360, 390 and 1440: the stop is never before the failing step's predecessor, the run says what
   fails, the last real step is drawn and the break is labeled.
4. **Heart after "Stop air".** The end of the run says "No fresh air: the heart still pumps, but the body gets less
   O2.", and the line at the last step is "No fresh air, heart still pumps, body cells got less O2".
5. **Hormones.** The strong label is what the token carries: Stress, CRH, ACTH, then Cortisol from the adrenal on
   (and "Cortisol brakes" at the brain); "Glucose up" stays on the liver.
6. **Knob never clipped.** Routes start and end inside the picture (the synapse's starts lower and ends on the axon
   inside the stage); the sweep checks the knob's ring against the picture's edges.
7. **Threshold.** The one word "Threshold" labels the red mark from the start; the bar is empty until the EPSPs add
   (step 8's words), reaches the mark exactly when "threshold reached" shows, and fills above it as the neuron fires.
8. **People.** The reflex figure is a seated person in profile cut to the lower back and leg: curved back, buttock on
   the seat, belly, shirt with folds, shorts, an arm with a hand resting on the thigh, the spine in a window. The
   hormone figure is a person cut at the hips: a face (eyes, brows, nose, mouth, ears, hair), neck, shirt with collar
   and folds, arms with hands, trousers.

Should fix, all done: the action potential runs along the terminal's membrane to the Ca2+ channel; the pulmonary
veins visibly enter the left atrium (tall: over the heart wall into it; wide: from the lung on the right into its right
side); "Atrium pressure above ventricle"; the tap's stretch is drawn in muscle colour and orange starts at the spindle;
the kick starts with step 7's words; the stalk runs into the posterior lobe and the portal veins down its front into
the anterior lobe; one vessel leaves the magnifier and joins the body's line once; the Damage and Block buttons sit
beside what they break; the docked vesicles are full; the zoom lines leave the vertebra at T12 to L1, where the L2 to
L4 cord segments lie ("?" says so). The "?" sentence explaining the threshold bar is removed.

Wide composition of the heart: the body's tissue on the left, the heart in the middle (enlarged), the lungs on the
right, so the pulmonary trunk runs to the right as it does and the pulmonary veins enter the left atrium from the
right (owner log).

Checks (round 1): `node --test scripts/test/anp-*.test.mjs` 55 pass; `check-anp-content --check` 0 failing; `build-anp
--check` clean; `check-site` OK; `check-weight --check` all within budget; `build-apcalc --check` and `build-apmacro
--check` clean; `check-tool-use` with a local copy of its list: pathways frame v2, nothing under automation (the file
itself is the collecting branch's). Sweep, one width per process, light and dark, ten widths: 65 states each (now also:
the knob's ring inside the picture, the picture at least 80% of the stage width on a desktop and 95% on a phone),
1,300 states, 0 failures. On a 1920 x 1080 screen the 2:1 picture is 81% of the stage: the screen's height sets it so
the cause line stays on screen. Frame test at 360, 390 and 1440: 6,199 frames each, 0 failures, including every break
(stops after its last real step, says what fails, draws the last real step, labels the break). Playwright at 390, 768
and 1440, light, and 390 and 1440, dark: 25 to 26 checks each, all pass. Performance with CPU x4: median 16.7 ms on
every screen; p95 33 to 100 ms, measured while the 2-core machine ran other jobs (load average about 10), so the p95
is not a clean number; the trail is now drawn once and revealed by its dash, so a frame rebuilds no path. Shots:
`/mnt/user-data/outputs/anp-pathways-v2/shots/` (`11-break-*` for every break at 390 and 1440); preview regenerated.


## Recheck 1 (2026-11-18)

Three must fix items and five should fix items from the reviewer's recheck, all fixed.

- **Wide heart vena cava (science).** On screens 1024 and wider the vena cava joined the bottom of the right ventricle,
  so the blood cell crossed the shut tricuspid valve backwards. It now runs outside the heart wall up into the right
  atrium, as the phone layout does. New frame check: the scene lists its four valves (`_valves()`), and at every frame
  the cell may only be within 10 units of a valve while that valve is open (the check sees the cell pass all four).
- **Synapse neighbours.** The two neighbouring terminals never lit because the CSS rule was `g.is-on > .pe-term2` and
  the class sits on the path. Now `.pe-term2.is-on`. New frame check: whenever the summed EPSPs show, both neighbour
  terminals are lit and drawn in a different fill from an unlit one (so all three synapses show).
- **Break buttons beside their part.** On phones the adrenal Damage button sat by the pituitary; it now sits below the
  kidneys by the adrenal cortex. The receptor Block button moved off the threshold bar and the calcium Block button moved
  left so the two never touch. New sweep check: each shown break button's nearest drawn target (`_targets()`) is the
  part it breaks, at every width.
- **Short laptop screens.** The sweep now runs 1366 x 768 and 1280 x 720. On a short wide screen the picture's view
  box widens (up to 400 units of background, `X0`) instead of the picture shrinking, so it stays at least 80% of the
  stage width; every world to screen mapping subtracts `X0`.
- **Upright iPad.** The square picture is held to `100vh - 360px`, so the cause line is on screen at 768 x 1024 (new
  sweep check at every width). Upright tablets now need 85% of the stage width for the picture, not 95%; phones keep 95%.
- **Phone reflex.** The leg is drawn a little smaller and the hammer pulls back less, so the foot and hammer stay inside
  the stage.
- **Hormones label.** "Glucose up" moved up and left, off the adrenal.
- **Wide heart lungs.** The lungs moved left so the second lung is no longer cut by the stage.

Checks rerun: sweep at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920, 1366 x 768 and 1280 x 720, light and dark,
one width per process: 0 failures. Frame test at 360, 390 and 1440: 6,199 frames each, 0 failures. Interactions at
1440, 390 and 1440 dark: all pass. A&P tests 55 pass; check-anp-content, build-anp, apcalc and apmacro `--check`,
check-site, check-weight all clean; check-tool-use (local copy of the list with this tool on frame v2) clean.
