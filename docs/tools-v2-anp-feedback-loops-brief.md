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
