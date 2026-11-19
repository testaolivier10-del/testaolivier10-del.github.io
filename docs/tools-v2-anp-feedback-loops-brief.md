# Tools v2: A&P Feedback loops (brief and build notes)

Status file for the v2 rebuild of `anatomy-physiology/tools/feedback-loops.html` (Feedback loop builder; rank 9 in
`docs/tools-v2-rollout.md`, free, group F "step and flow builders"). Standard: `docs/tools-v2-standard.md`; process:
`docs/tools-v2-builder-brief.md`; worked A&P examples: `docs/tools-v2-anp-graphs-brief.md`,
`docs/tools-v2-anp-pathways-brief.md`. Branch `claude/tools-v2-anp-feedback-loops`, from `claude/tools-v2-all`. NOT
merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`.

## What the old tool teaches (from `claude/tools-v2-all`)
49 loops (`anatomy-physiology/data/tools/feedback-loops.json`, 44 negative, 5 positive), each with two modes (decisions
85, 92, 95 to 98 in `docs/anp-spec.md`):
- **Watch it work:** the loop's variable on a gauge with its set point, the seven parts on a ring, a drawn place in the
  body (`loop-scenes.js`, 18 drawings), a Stimulus button, drag the gauge marker, "Cut a part".
- **Test yourself:** put seven cards in the seven slots (distractors among them), classify the loop as negative or
  positive, predict what happens when one named part fails. Items `feedback-loops:<loop>:<slot>`,
  `feedback-loops:<loop>:kind`, `feedback-loops:<loop>:failure`; a finished loop sends `anp-loop-complete`.
The rollout line: "49 loops; six boxes, a gauge and a scene compete; the Stimulus button repeats the drag" (rework).

## The one main idea
**Homeostasis by negative feedback: a change is sensed, sent to a control center that compares it with the set
point, and an effector's response pushes the variable back toward the set point. Positive feedback is the other
idea: the response makes the change bigger, until an event outside the loop ends it.**

The student pushes the variable away from normal on a drawn body and watches each of the seven parts act in place,
in order, while the value is drawn as it changes (a thermometer or meter on the body, and a monitor trace of the value
against time with the set point and the normal range).

| Tab | Loops (data ids) | What is drawn | What the student pushes | What acts |
|---|---|---|---|---|
| 1 Temperature | `temperature-hot`, `temperature-cold` | a standing person; a magnified patch of skin (sweat gland, skin arteriole, nerve ending, a skeletal muscle under it); the brain with the temperature center (hypothalamus) | the thermometer, up or down (35.5 to 38.5 °C) | too warm: skin arterioles widen, sweat glands release sweat, heat leaves; too cold: arterioles narrow, skeletal muscle shivers, heat is kept and made |
| 2 Glucose | `glucose-high-insulin`, `glucose-low-glucagon` | a person's trunk in a window: pancreas with an islet magnified (beta and alpha cells), liver, skeletal muscle, fat; one blood vessel joins them, glucose drawn in it | the glucose meter, up or down (55 to 160 mg/dL) | high: beta cells release insulin, liver, muscle and fat take glucose in and store it; low: alpha cells release glucagon, the liver breaks glycogen down and releases glucose |
| 3 Childbirth (positive) | `dv-labor-oxytocin` (and `childbirth`) | a pregnant body in profile with the uterus cut open (fetus head down, cervix), the nerve up the spinal cord, the head with the hypothalamus and posterior pituitary, one vessel to the uterus | the baby's head, pushed down onto the cervix | stretch sensors fire, the hypothalamus releases oxytocin from the posterior pituitary, the myometrium contracts harder, the head stretches the cervix more; each turn stronger, until birth removes the stretch |

## Research (rule 10)
Seen means the page was opened and read here; "text only" means only a description or worksheet could be read.

| Source | How it works | What we took |
|---|---|---|
| ExploreLearning Gizmo "Human Homeostasis" (student worksheet seen; the Gizmo itself not run) | Sliders for exercise, sweat level, clothing and a shivering option; air and body thermometers; a body temperature graph and a table, with Play / Pause | The thermometer and the temperature against time trace; ours does not make the student set the sweating (the loop does it, which is the idea) |
| Temperature Control (neurophysiology.itch.io, page seen) | Two buttons move the hypothalamic set point (fever); the core temperature line lags toward the set point; status cards glow for heat made or lost | The lag and the set point line on a trace; the set point shift stays in Test yourself (`fever-set-point`) |
| Homeostasis Investigation (sciencesimulations.com, page seen) | Environment, activity and clothing pickers, a figure that turns pale or red with vessel narrowing or widening, a core temperature readout, no graph | The skin colour following the skin vessels; ours draws the vessel itself in a magnified patch of skin |
| NetLogo Blood Sugar Regulation (model page seen; not run) | Liver and pancreas patches, glucose, insulin and glucagon as dots, EAT button, sensitivity sliders, a plot of the three counts | Glucose, insulin and glucagon as drawn molecules moving between real organs; one plotted value |
| Ferguson reflex (Wikipedia, seen) and the course notes `labor-birth` | Cervical stretch, afferent nerves to the hypothalamus, oxytocin from the posterior pituitary, myometrium contracts, repeats until delivery | The chain and its ending, drawn on one body |

What ours does better: one body, every part of the loop drawn where it is and acting as the signal reaches it, the
value drawn as it changes, and the student's push is the stimulus. Not found anywhere: one screen that shows all seven
parts of a homeostatic loop acting in place, and positive feedback beside it as its own tab.

## The design
- **Main control:** the value itself, a knob on the thermometer, the glucose meter, or the baby's head (`K.handle`).
  Drag it off the set point (or press on the scale); on release the loop runs. Keys: arrows step, Page Up / Down ten
  steps, Home and End the ends; the run starts on the key's change.
- **A run** is a pure function of time since release (`run.t`): the stimulus, the sensor fires, the signal travels the
  afferent nerve (a pulse along the drawn nerve), the control center compares the value with the set point, the
  command travels the efferent nerve or the hormone travels the blood, the effector acts, and the response moves the
  value back (negative) with a small overshoot that stays inside the normal range; the effectors ease off as the
  value returns. Positive: each turn the contraction is harder and the stretch bigger; the turns come closer together;
  at full stretch the baby is born and the loop stops. A new push during a run starts a new run from the shown value.
- **The value is drawn:** the thermometer or meter column on the body, and a monitor in the picture with the trace
  against time, the set point line and the normal band. A small "before" tick stays where the push began.
- **Under the picture:** one line of seven dots (the seven parts, coloured by afferent and efferent) with "Part n of 7"
  and that part's name and short text from the bank (reviewed words), then the cause line (`K.cause`).
- **Labels** 1 to 3 words on the picture, shown when the signal reaches the part, placed clear of each other.
- **Colours, one per idea:** afferent orange (`--anp-aff`), efferent sky blue (`--anp-eff`), the control center
  purple, heat red, cold blue, sweat light blue, glucose gold, insulin teal, glucagon orange red, oxytocin pink.
- **Childbirth** is irreversible: after birth the value falls to zero and the knob is gone; "Start over" (always there)
  brings a new pregnancy with a short cross fade.

## Explore against Test yourself
- **Explore:** the three screens above. Nothing graded or asked.
- **Test yourself:** all 49 loops, unchanged, with the old two modes as a small switch at the top of the panel ("Watch
  it work" with the gauge, ring, scene and "Cut a part"; "Build it": slots, classify, failure), the loop dropdown, the
  list (All loops), the finished card. Every item id and record is unchanged.
- Deep links: `?id=<loop>` opens Test yourself on that loop (Watch it work, as before), `?mode=test` on the build,
  `?chapter=` and `?topic=` open the matching Explore tab when one exists (homeostasis-feedback, skin-functions and
  energy-balance-thermoregulation: Temperature; pancreas-glucose: Glucose; labor-birth: Childbirth), else Test
  yourself on the filtered list as before. New: `#explore/<tab>`.

## What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Watch it work for all 49 loops (gauge, ring, scene, Stimulus, Cut a part) | Test yourself, "Watch it work" on the inner switch, unchanged |
| Build, classify, predict a failure | Test yourself, "Build it", unchanged |
| The list, chapter filter and "Test yourself on all n in order" | Test yourself (the dropdown's "All loops") |
| "Cut a part" | Test yourself only (Explore teaches the intact loop; the failure question is the graded form) |
| The seven slots reference | "?" in Explore and in Test yourself |

## Decisions made for the owner
(also in `docs/tools-v2-owner-log.md`)
1. Explore shows three drawn loops (temperature both ways, glucose both ways, childbirth as positive feedback on its own
   tab); the other loops and every graded step are in Test yourself.
2. The knob is the variable: after the push the body moves it back, with a "before" tick where the push began (the
   loop is what moves it; no other control does).
3. "Cut a part" stays in Test yourself's Watch it work, not in Explore.
4. The run plays by itself after the push (the loop is automatic; that is the idea), about 7 s for a negative loop and
   about 12 s for childbirth.
5. The value is drawn twice, on the body (thermometer, glucose meter, the baby's head) and on a monitor trace against
   time with the set point and the normal range; the childbirth monitor draws the stretch and the contractions and has
   no set point line (positive feedback has none).
6. One glucose set point (88 mg/dL) for both directions; the temperature normal range is drawn 36.5 to 37.5 °C
   (`docs/anp-needs-author.md` fl-glucose-setpoint, fl-temp-range).
7. Test yourself's inner switch reads "Watch it work" and "Build it" ("Test yourself" twice would confuse).

### What is on screen in Explore (counted in the browser, 1440 x 900, at landing)
Outside the picture: 3 tabs, the purpose line, "Show me how", the line of seven dots ("Seven parts each lights as the
signal reaches it") and the cause line: 42 words on Temperature, 40 on Blood glucose, 36 on Childbirth. 6 controls: 3
tabs, "Show me how", "Start over", the knob. No side panel. On the picture at landing: 3 labels each (Temperature: the
value, Skin, Brain; Glucose: the value, Pancreatic islet, Pancreas; Childbirth: Cervix, Uterine muscle, Hypothalamus),
plus the scale's numbers and the monitor's own words. During a run a part's label appears when that part is drawn
acting (Nerve ending, Sensory nerve, Hypothalamus, Efferent nerve, Sweat gland and Arteriole widens or Muscle shivers
and Arteriole narrows, Heat lost or Heat kept, made; Beta or Alpha cells, No nerve: same cells, Insulin or Glucagon,
Liver, Muscle, Fat, Glucose stored or released; Stretch sensors, Spinal cord, Posterior pituitary, Oxytocin, Uterine
muscle, More stretch, Head passes, Baby born, No more stretch). First visit only: the cue at the knob ("Drag the
thermometer", "Drag the glucose level", "Push the head down").

## Accuracy
Every word on the pictures, the cause lines and "?" was checked against the course notes that teach it
(`anatomy-physiology/data/notes/`: homeostasis-feedback, pancreas-glucose, labor-birth) and the loops' own reviewed slot
texts, which name the parts on the line under the picture. What the pictures add:
- Temperature: warm (or cold) sensitive nerve endings in the skin fire; the signal goes to the hypothalamus, which
  compares the value with the 37 °C set point; nerves carry the command to the skin arterioles' smooth muscle and the
  sweat glands (too warm: arterioles widen, sweat is released and evaporates, heat leaves; the skin flushes) or to the
  arterioles and skeletal muscle (too cold: arterioles narrow, the skin pales, the muscle shivers and makes heat). The
  effectors work in proportion to how far off the value is, so they ease off as it returns; a small overshoot stays
  inside the normal range (the notes' "why the variable wobbles").
- Glucose: beta cells take glucose in and are their own sensor and control center (no nerve), release insulin into the
  islet's capillary; insulin reaches liver, muscle and fat, glucose moves into them, glycogen granules grow in liver
  and muscle and fat cells swell a little; as glucose falls, less insulin. Low glucose: alpha cells release glucagon,
  which acts on the liver only; liver glycogen shrinks and glucose leaves the liver. The number of glucose hexagons in
  the blood is the drawn level (8 at 88 mg/dL). The islet mixes beta and alpha cells, as in humans.
- Childbirth: the head stretches the cervix; stretch sensors fire; afferent nerves climb the spinal cord to the
  hypothalamus; its neurons release oxytocin from the posterior pituitary into the blood; the myometrium contracts
  harder (the uterine wall squeezes in, harder each turn) and pushes the head lower, so the stretch grows. Birth (an
  event outside the loop) removes the stretch and the loop ends; the empty uterus shrinks back. "?" says the loop
  strengthens contractions and does not start labor (the notes' "For your exam" point).
- A skeptical second pass by the builder (no helper agent was available in this session) looked for wrong mechanisms,
  wrong targets and misleading proportions; it changed the islet from a beta core with an alpha rim (the rodent
  pattern) to mixed cells, kept glucagon off muscle, and kept "the loop does not start labor". The independent review
  should repeat the science check. Points for a person: `docs/anp-needs-author.md`, "Feedback loops, tools v2 drawn
  loops" (fl-*).

## What was built
- `anatomy-physiology/assets/tools/feedback-loops-explore.js` and `.css` (new): the engine (tabs, purpose line, the
  picture with two compositions per screen, wide 2:1 and tall for phones and upright tablets, `K.handle` on the value,
  pooled labels placed every frame clear of each other, the knob, the monitor, the scale and Start over, the line of
  seven dots, the cause line, cue, tour, "?") and the three screens. A run is a pure function of time since release
  (`negState`, `posPlan` / `posState`); every frame only sets attributes on the parts that change, and label placement
  is skipped when nothing about the labels changed.
- `anatomy-physiology/assets/tools/feedback-loops.js`: with the kit on (`V2`), `subStudio()` turns the studio's modes
  into the inner switch and puts every part in Test yourself; `init()` routes links (`?id=`, `?mode=test`, `?topic=`,
  `?chapter=`, `#explore/<tab>`) and keeps the address in step. Without the kit it behaves as before. Bug fixed on the
  way: Watch it work drew its marker at NaN when a loop was opened after the body drawings had loaded.
- `anatomy-physiology/data/pages.json`: `"kit2": true` and the new script and stylesheet on the tool; only
  `tools/feedback-loops.html` changed in the build. The adapter (`AnpToolKit.kit2`) is used as it is: no change.
- Sweep test `scripts/tools-v2/anp-feedback-loops-sweep.mjs`; frame test `scripts/tools-v2/anp-feedback-loops-frames.mjs`.

## Checks run (2026-11-18)
`node --test scripts/test/anp-*.test.mjs` 55 pass; `check-anp-content --check` 0 failing (tools 0 failing);
`build-anp --check` clean; `check-site` OK; `check-weight --check` all 620 within budget; no shared file changed, so
`build-apcalc` and `build-apmacro` were not affected; `check-tool-use` with a local copy of its list: feedback-loops
sends tool-open, tool-touch(explore), tool-mode(quiz), tool-use as frame v2, and nothing under automation (the file
itself is the collecting branch's, unchanged).
Frame test: every run seeked every 0.02 s (temperature 38.4, 37.6, 35.9, 36.6, 38.5, 35.5 °C; glucose 150, 160, 110,
60, 55, 76 mg/dL; childbirth pushes 0.35, 0.2, 0.06) at 1440 and 390: 13,200 frames, 0 failures (value pill, column,
cause line numbers and monitor all read the drawn value; dot line and cause line name the same part; every part's
label only while it is drawn acting; overshoot inside the normal range; effectors off at the end; stretch climbs until
birth and falls only after it; glucose hexagons equal the level).
Sweep (one width per process): 63 states each (rest, a held push, every part of both directions, the end, every turn of
childbirth, birth and after) at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920, 1366 x 768 and 1280 x 720, light,
and 360, 390, 768, 1440 dark: 0 failures (nothing clipped, labels 4 px clear of each other, the knob, Start over, the
monitor and the scale's numbers; the knob clear of the scale's numbers; the monitor's words clear of each other; no
text under 11 px; the cue covering nothing; tabs fit; the picture the largest thing and at least 80% of the stage on a
desktop, 85% upright tablet, 95% phone; cause line at most two rows on phones, one height, on screen; no sideways scroll;
no console errors).
Playwright at 1440 and 390 (light and dark): opens on Explore with the cue; real mouse drag (1440) and real touch drag
(390, the page does not scroll) raise the value and the cue leaves; release starts the run and the parts light in
time; the run ends near the set point with the takeaway; a press on the scale takes that value; keys move the value and
start a run, with aria-valuetext the shown value; leaving for Test yourself or opening "?" mid run ends it and the
screen comes back clean; childbirth left mid run ends at birth with the knob gone, Start over brings a new pregnancy, and
a push after birth changes nothing; reduced motion gives the result at once with a cross fade; Test yourself records
`feedback-loops:glucose-high-insulin:<slot>` right, `:kind` wrong and `:failure` right, with the finished card; deep
links `?id=childbirth`, `?id=co2-high&mode=test`, `?topic=pancreas-glucose` (Explore, Glucose), `?topic=breathing-control`
(Test yourself), `#explore/childbirth`; the free page shows no lock; no console errors. Performance with CPU x4: a full
drag at 1440, median 16.7 ms and p95 50 ms; the machine's load average was 9 to 13 on 2 cores (other builders), so
the p95 is not a clean number.
Shots: `/mnt/user-data/outputs/anp-feedback-loops-v2/shots/` (landing with the cue, every part of temperature both
ways, glucose both ways and childbirth turn by turn to after birth, a real mid run frame, Test yourself; 1440 light and
dark, 768, 390 light and dark); preview `/mnt/user-data/outputs/anp-feedback-loops-v2/index.html`.

## Not done, and what I am not happy with
- No real phone, screen reader pass or real students; the independent review is next, and the science should get its
  own check there (no helper agent was available to me for a separate accuracy pass).
- The people are drawn at the pathway tracer's level, but the fetus is simple (a curled body and a head).
- On a phone the monitor is short: its middle tick number steps aside when there is no room.
- The temperature nerves run up the arm to the brain as one route (said in "?" and needs-author).
- Test yourself is the old tool inside the new frame (its two modes as a small switch), not redesigned.
