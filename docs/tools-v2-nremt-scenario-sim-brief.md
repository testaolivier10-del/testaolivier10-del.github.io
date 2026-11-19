# Tools v2: NREMT Scenario simulator (brief and build notes)

Status file for the v2 rebuild of `nremt/scenario-sim.html` (Premium; row 23 in `docs/tools-v2-rollout.md`, group N,
"scenario simulators"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-nremt-scenario-sim`, cut from `claude/tools-v2-all`. NOT merged: an independent review comes first.
Decisions made for the owner are also one line each in `docs/tools-v2-owner-log.md`; open medical points in
`docs/nremt-needs-author.md` ("Scenario simulator, tools v2 Explore"). Uses the NREMT adapter
(`nremt/assets/nremt-kit2.js`) unchanged.

## What the old tool does (origin/main = claude/tools-v2-all for these files)
25 branching EMT calls written in the page (`SCENARIOS`, 257 nodes). A list of call cards (six, then "All 25 calls,
by kind" with category chips); a call shows a monitor (`scenario-monitor.js`: ECG and pleth traces, HR, SpO2, NIBP,
RR with age flags, numbers only from each node's vitals line, a drift toward the worse node at ten time critical
forks), an anatomical body to examine (survey chips, front and back, skin, callouts from the case's words, the care
layer `scenario-care.js` draws tourniquet, mask, CPR hands, pads...), the situation and the choices in the side
panel, "What happened" after a costly choice, then the debrief: outcome, the path with "Go back to this decision",
the score card (`LevlCard`), each costly choice recorded for Review (`NremtToolResults`, id
`<scenario>:<node>`), Next call and Try again; analytics `scenario-start` and `scenario-finish`; `?scenario=<id>`
from Review starts that call; Premium (`NremtGates.canUse('scenarios')`, no free allowance).
The rollout's verdict: "Lands on a list of call cards with no picture."

## The one main idea
**Each choice on a call changes the patient.** Explore lands on a call already under way: the patient drawn where
the call happens, the monitor beside them, and the call card (a clipboard) with what you see and what you could do.
Pick an action and the care goes onto the patient, the monitor's numbers slide to what the case says happens next,
the skin, eyes, breathing and bleed follow the case's words; only then does the card turn to what happened, and the
line under the picture says what you did, what changed and whether the numbers got better or worse. The other branch
is one tap away (the numbered decisions on the card).

## Research (rule 10)
| Source | Seen how | How it works | What we took |
|---|---|---|---|
| Full Code Medical Simulation | Only as text (store listing and an independent review page, read for the flowcharts and skill sheets rebuilds; the app cannot run here) | A virtual patient, live findings, an action tray, a debrief of what was missed | The patient as the picture, the actions as the control, the debrief in the scored run |
| Body Interact | Only as text | A patient whose state and vitals change with each action; scored cases | Every action changes the patient visibly; the score stays out of Explore |
| NREMT clinical judgment items (case studies) | Only as text (the Registry's descriptions) | A case unfolds in phases; each answer is judged against the case | The case's own words decide what is drawn |
| The flagship and the two NREMT group N/F tools on this site (skill sheets, flowcharts) | Opened and read (flowcharts from its branch) | A drawn patient beside a clipboard; the item settles onto the patient; labels wait for the picture; a cause line | The same frame: patient + clipboard, gloved hands, labels kept off the face and the care, words after the picture |
| The old LevlPrep page | Opened, used, read in full | As above | Everything moved to Test yourself unchanged; the monitor, the care rules and the callout words reused in Explore |

What ours does that none of them do: every branch of every call can be walked back and tried again on the same drawn
patient, and the picture never claims a number or a sign the case does not state.

## The design
- **Picture** (`nremt/assets/scenario-explore.js`, `.css`): the course's rendered figure (BodyParts3D, `body-figs/`)
  for the patient's age and sex (adult, woman, child, toddler, infant; from the opening sentence), with clothes
  clipped to the body, a drawn face (eyes open, half closed or closed; lips; sweat) and hair. Lying patients are seen
  from above on their surface (road, gym floor, alley concrete, living room boards and rug, pool deck by the water,
  a car's back seat, bathroom tiles, a towel, bedroom carpet, kitchen tiles with the wet patch); sitting or standing
  patients are seen from the front, head to mid thigh, in their setting (store shelves, kitchen, backyard fence and
  lights, a house's siding, street by day and by night, bedroom, group home, parking lot with a car, the race with
  its barrier and mile 19 sign). On a wide stage a lying patient lies across the picture, head left; on a narrow one
  head up, framed head to below the knees. A sitting patient who needs compressions or the AED is drawn on the
  ground (the picture fades across).
- **The monitor** is the run's own `NremtSim.Monitor`, smaller, as a device on the scene (top right; a strip across
  the top on a phone): the ECG trace and HR, SpO2, NIBP, RR with the age flags.
- **The care** (`NremtSim.care.care`, the old tested rules over the choices taken, plus the case's own "You apply
  direct pressure"): tourniquet with windlass and TQ tag, gauze with a gloved hand pressing, oxygen mask with its
  bag, blow by, bag valve mask with a hand sealing it, compressions (two stacked gloves; a child one; an infant two
  thumbs) pumping at 109 a minute, AED pads with leads to the AED, epinephrine auto injector at the thigh, naloxone
  at the nose, glucose gel at the cheek, inhaler, collar, splint, blanket, cold packs. Each settles on from slightly
  larger; off, it fades. Sizes in centimetres scaled to the patient's length (an EMT's adult hand on an infant is
  large, as it is).
- **The signs** (`stateOf`): the newest step that speaks of a sign decides it, its last word wins, sentences about
  someone else (the mother says...) and, in a birth, about the baby are skipped. Pale, blue (only while the drawn
  SpO2, when given, is under 94), mottled, hot; sweat; hives; eyes; a limb wound that spurts (jets at the drawn heart
  rate), oozes under gauze or stops; a pool that grows with each step it bled and never shrinks. Breathing: a chest
  sheen at the drawn RR; none when the case says no breathing; the bag squeezes at an assisted rate the case gives.
- **Main control, on the picture:** the choices on the call card (A, B, C, D; 44 px at least). A tap: the chosen card
  turns teal, the others fade; the picture changes (about 1.1 s, the monitor's slide); then the card turns (What
  happened, Now), the words on the patient appear (the new care first, then the newest and worst findings; at most
  three, two on a phone; never on the face or the care) and the cause line completes.
- **Cause line:** [what you did, first words] → [the biggest change in the drawn numbers, "HR 118 → 110", or the
  newest finding] → [Better | Worse | No change] (from the reference ranges, never from the choice). At an ending
  [what you did] → [Good / Mixed / Poor outcome], then the takeaway "Poor outcome. Tap a number on the card to try
  another way." At the opening [Man, 28] → [the first finding].
- **One colour per idea:** what you did teal; what it did to the patient warm brown; better green; worse red.
- **Card head:** the call's name, Back (one decision), Start over; under it the numbered decisions so far (ringed
  green, red or grey by the numbers), each a tap back. "Time critical" tag at the case's ten waiting forks.
- **Purpose line:** "Pick what you do next. Watch the patient answer." One cue on the first visit: "Pick what you would
  do" beside the first choice. "Show me how": three steps (the choice, the patient, going back).
- **Test yourself** ("Run a call", one part): the old run, unchanged and scored, in its own stage: the list of calls,
  the monitor with its drift, the body to examine, the debrief with the path and "Go back", the score card, the
  Review records, Next call. New: leaving it mid call pauses its monitor and the hesitation clock (the time away does
  not count as hesitating).
- **"?":** what you are looking at, nothing invented, better or worse, the colours, going back, time critical and the
  scored run, the figure credit.

On screen in Explore at 1440 (counted, opening): the call picker; the purpose line and "Show me how"; the picture
(the patient in their setting, the monitor, 1 to 3 words on the patient, the who chip); the card (name, Back, Start
over, the situation, "What do you do?", 2 to 4 choices); the cause line (2 pills). Outside the picture: 1 control
(the picker) plus the link. The landing's text is the case's opening (about 50 words) and its choices.

## Deep links
`#call-<id>` opens Explore on that call (picking a call writes it). `?scenario=<id>` (Review's links) opens Test
yourself and starts that call's scored run, as before. `#test` and `#run` open Test yourself. No hash: Explore on s1.

## What the old tool did and where it is now (nothing dropped)
| Old | Now |
|---|---|
| Call list, six then all 25 by kind, category chips | Test yourself, unchanged; Explore's picker (grouped by the same kinds) |
| Monitor, flags, drift at time critical forks | Explore: the same monitor, no drift (a "Time critical" tag); Test yourself: unchanged, drift included |
| Body to examine (survey chips, front and back, skin, DCAP-BTLS lines, care drawn) | Test yourself, unchanged; in Explore the same callout words on the drawn patient and the same care rules, drawn |
| What happened, situation, choices | Explore's card; Test yourself unchanged |
| Debrief, path, go back to a decision, score card, Review records, Next call, Try again | Test yourself unchanged; Explore has its own going back (numbers on the card), Start over, Next call, no score and no records |
| `scenario-start` / `scenario-finish` events | Unchanged in the run; Explore sends the same events with `mode: 'explore'` |
| Premium gate | Both modes show the gate when locked (checked in the sweep) |
| `?scenario=<id>` | Starts that run in Test yourself |

## Decisions made for the owner
(Also one line each in `docs/tools-v2-owner-log.md`.)
1. Explore is a drawn call (patient, monitor, call card) with free going back; the scored run is Test yourself, unchanged.
2. Explore has no hesitation drift and records nothing; time critical forks carry a tag instead.
3. "Better / Worse / No change" is read from the drawn numbers against the reference ranges, not from the choice;
   a costly choice is explained by the case's own "What happened".
4. Sitting and standing patients are drawn from the front, head to mid thigh (the same picture whether they sit or
   stand); they are laid on the ground when compressions or the AED start.
5. Settings, clothes and hair are made up per call from the opening's place; the patients stay the course's figures.
6. Explore sends `scenario-start` / `scenario-finish` with `mode: 'explore'` (the run's events unchanged).
7. `#call-<id>` is new; `?scenario=<id>` still starts the scored run (now in Test yourself).
8. A short check-weight shell `nremt/scenario-explore` (36 KB) and the nremt shell 28.8 → 30.4, the page 62.2 → 62.7.

## Accuracy
No case text, number, choice, consequence, ending or care rule was changed. New words: the cause line's first words
of a choice (cut from the choice), the who chip, the item names (Tourniquet, Oxygen mask...), the bleed's three
words (Spurting bleed, Still bleeding, Bleeding stopped / Tourniquet holds) and "?". Drawing choices that need a person:
`docs/nremt-needs-author.md`, "Scenario simulator, tools v2 Explore".

## Checks (2026-11-19)
- Sweep `scripts/tools-v2/nremt-scenario-sim-sweep.mjs`, one width per process (every opening, each call walked to
  an ending by the first and by the last choice, light; openings and first-choice endings, dark): see the counts in
  the last section of this file's commit log and the report.
- `node --test scripts/test/nremt-*.test.mjs scripts/test/kit2-spots.test.mjs`: 72 passed (new: Explore's drawn state).
- check-site and check-weight pass; check-tool-use on a local copy listing this page reports tool-open,
  tool-touch(explore), tool-mode(quiz), tool-use, nothing under automation.

## What I am not happy with
- Posture: a few nodes put the patient face down or on their side (s21 prone restraint, recovery positions); the
  picture keeps them face up or upright (only compressions and the AED lay a seated patient down). The cause line and
  card say it; the picture does not.
- The figures are mannequins with drawn faces; the infant in his mother's arms (s12) lies on her lap with no arms drawn.
- Some steps have no numbers and no named finding, so the cause line has two pills (what you did, nothing more).
- The Explore file is large (about 31 KB gzipped JS) because 20 settings are drawn in code.
