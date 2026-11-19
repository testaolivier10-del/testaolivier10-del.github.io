# Tools v2: NREMT Skill sheets (brief and build notes)

Status file for the v2 rebuild of `nremt/skillsheets.html` (free; row 22 in `docs/tools-v2-rollout.md`, group N,
"scenario simulators"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-nremt-skillsheets`, built on `claude/tools-v2-all`. NOT merged: an independent review comes first.
Decisions made for the owner are also in `docs/tools-v2-owner-log.md`; open medical points in
`docs/nremt-needs-author.md` ("Skill sheets, tools v2"). The third NREMT tool on the v2 kit; it uses the NREMT adapter
(`nremt/assets/nremt-kit2.js`) unchanged.

## The one main idea
**A skill station is a fixed list of actions, done on the patient in the sheet's order, and a few of them (the
critical ones) fail the station on their own.** The old tool landed on ten station cards and a timed checklist; the
patient appeared only once a run started, and only one step at a time. Now the patient and the station's sheet sit
side by side from the first second: tap a step on the sheet and it happens on the patient.

## Research (rule 10)
| Source | Seen how | How it works | What we took |
|---|---|---|---|
| Full Code Medical Simulation (app; product pages and reviews) | Only as text (search results and store pages; the app cannot run here) | A patient on screen, live findings, an action tray, then a debrief of what was missed and when | The patient as the picture and the actions as the control; the debrief stays in the run (Test yourself) |
| Body Interact | Only as text | A virtual patient whose state changes with each action; scored scenarios | Each action changes the patient visibly; scoring kept out of Explore |
| National Registry EMT psychomotor sheets (E201 to E217) | Not openable from this machine this session (the proxy refused content.nremt.org; WebFetch needed approval nobody gave). The step lists were checked against those PDFs on 2026-11-10 (`docs/nremt-needs-author.md`, "Pass 2 checks") and are reused unchanged | A numbered list of scored actions, each worth points, and a separate list of critical criteria | The sheet drawn as the sheet: numbered rows in the sheet's order, the critical ones tagged |
| Common skills checklist apps and printed program checklists | Only as text (search) | A tick list per station, sometimes timed | The tick list is the control, but each tick does something to a patient |
| The old LevlPrep page (origin/claude/tools-v2-all, opened and read in full) | Opened, used, read | Ten station cards, a timed run with a stopwatch, critical criteria lamps, a patient per station that shows each tick, a result with numbered misses; a reading guide | Everything, unchanged, as Test yourself; the patient scripts reused for Explore |

What ours does that none of them do: the paper sheet itself is the control, so the student learns the sheet's order
by doing it, and an order mistake shows on the body the moment it happens (bare hands on the wound, vomit pushed
into the lungs, a splint on a limb nobody held).

## The design
- **Picture** (the patient from `nremt/assets/station-patient.js`, the clipboard from `nremt/assets/skill-explore.js`
  and `.css`): the course's rendered body (BodyParts3D) on a padded mat on a tiled skills lab floor; a patient on
  their back lies across the stage on a wide screen (head left) so the body fills it; a seated patient (seated
  spinal, oxygen, medical) sits against a seat back (a car seat with a headrest for the seated spinal station);
  trauma stays head up (its findings are laid out around an upright body). Beside the patient (below it on a
  phone), the station's skill sheet on a wooden clipboard with a metal clip: the code and name, the time limit with
  a stopwatch, Start over, the examiner's words, and the steps.
- **Main control, on the picture:** the sheet's steps, one row each: number, a drawn icon of what the step uses
  (gloves, gauze, tourniquet, mask, bag, splint, cravat, collar, board, vest, AED, pads), a 1 to 3 word name and a
  red "Critical" tag (on a phone, and in two columns, the number ring is red instead and the head says
  "Critical" once). A tap does the step: the item comes onto the patient (it settles down from slightly larger, as
  if put on from above), the camera moves to it, then on to the next step. A second tap takes it back off. Any order
  is allowed. The keyboard walks the rows with the arrows and does a step with Enter.
- **Secondary, on the picture:** the station picker (the kit's one dropdown, top left, grouped: bleeding and shock,
  airway and breathing, cardiac arrest, splinting, spinal, assessment); on bleeding control, a tap on the thigh places
  the tourniquet (the old placement rules: over the knee, on or below the wound does not stop the bleed); on BVM, the
  bag to squeeze appears once ventilating starts and the cause line gives the rate.
- **Out of order** is shown, not scored: when the order itself is a problem (station-patient's own order rules:
  touching before gloves, a splint before the limb is held, ventilating through vomit, a shock before clear, the head
  strapped before the torso), a red "!" lands on the patient where it matters, the row gets a "!" and the cause line
  names it: [Breaths through vomit] → [vomit into the lungs] → [Critical criterion]. A step simply not done
  yet is never marked in Explore.
- **Cause line** (`K.cause`): [the step] → [what it did to the patient] → [Critical step | Scored step]; it changes
  about 0.4 s after the tap, once the item is on the patient. At the start: [The patient] → [the case]. When every
  step is done in order: the takeaway "All N steps in the sheet's order. In the room, say each one out loud."
- **One colour per idea:** the step (course teal: number, check, first pill), what happens to the patient (warm
  brown: second pill, the examiner's label), critical (red: the tags, the third pill, the "!" marks).
- **Purpose line:** "Do each step on the patient, in the sheet's order." One cue on the first visit: "Tap a step on the
  sheet" beside the first row. "Show me how" opens a three step tour (the sheet, the patient, the critical tags).
- **The clock in Explore** is the bleed's: the blood pool spreads and the gauze soaks only while Explore is on screen;
  it stops when Explore hides. There is no station timer in Explore.
- **Test yourself** is the old run, moved in whole: pick a station, the stopwatch against the station's limit
  (editable), the phases one at a time in the side panel, the critical criteria lamps (two light by themselves), the
  patient for every tick, Finish, then the result with the numbered misses on the patient, Run it again. New: leaving
  it mid run pauses the clock and the patient, and coming back resumes (the paused time does not count). The patient
  lies across a wide stage there too.
- **"?"**: what you are looking at, out of order, the examiner, the tourniquet and the bag, the clock; the current
  station's "What varies by program" notes; the old reading guide in full (the scoring guide, the official sheets
  table with links to the Registry PDFs, every station's card, verify against the source); the figure credit and the
  disclaimer.

On screen in Explore at 1440 (counted): the station picker; the purpose line and "Show me how"; the picture (the
patient on the mat, the clipboard with its head of 3 items: name, limit, Start over; the steps, 7 to 16 rows); the
cause line. Outside the picture: 1 control (the picker) plus the link.

## Deep links
- `#station-<name>` (Search and old links): Explore on that station (it used to start the run). `#run-<name>` starts
  that station's run in Test yourself. `#test` opens Test yourself. Picking a station writes `#station-<name>`.

## What the old tool did and where it is now (nothing dropped)
| Old | Now |
|---|---|
| Ten station cards to pick from, phases, limit, code | Explore's picker (grouped) and the clipboard head; the run's own picker, unchanged, in Test yourself |
| Timed run, editable limit, stopwatch ring, critical lamps, skip and out of order badges, phase stepper, result | Test yourself, unchanged (plus pause and resume) |
| The patient per station, tourniquet placement, bag squeeze, numbered misses | Explore (the same scripts, live) and Test yourself (unchanged) |
| Reading guide: scoring guide, verbalization cheat sheet, official sheets table, every station's card | "?" |
| Station notes ("What varies by program") and the figure credit (Why tab in the run) | Still in the run's Explanation; also in "?" for the station shown |
| The first run hint "Pick a station to run" | Replaced by Explore's cue; the run's picker says "Pick a station to start" itself |

## Decisions made for the owner
(Also one line each in `docs/tools-v2-owner-log.md`.)
1. Explore is the patient with the sheet on a clipboard; the timed run with critical criteria is Test yourself,
   unchanged. The run has no right or wrong answers to quiz, so Test yourself has one part ("Run a station").
2. The tool's name in the bar is "Skill sheets" (it was "Station run"), as on the tools page.
3. `#station-<name>` now opens Explore on that station instead of starting a run; `#run-<name>` starts a run.
4. A patient on their back lies across a wide stage (head left); seated patients and the trauma patient stay upright.
5. Step names on the sheet are 1 to 3 word paraphrases of the Registry wording (the full wording is each row's
   accessible name and hover title, and is on the run's checklist).
6. In Explore only order problems are marked on the patient; steps not done yet are not (that is the run's result).
7. On a phone, the assessment stations write only the newest finding on the patient (the others keep their dot), and
   the clipboard shows only real examiner cues there.
8. On a phone and in two columns, "Critical" is a red number ring plus one "Critical" key on the sheet's head.
9. Leaving the run mid way pauses its clock (it used to keep running).

## Accuracy
No step, criterion, order rule or medical sentence was added or changed: every step, which are critical, the order
rules, the examiner cues and the findings come from station-patient.js (checked against the Registry PDFs on
2026-11-10). New words are only the 1 to 3 word step names, the short effects on the cause line and the short order
pills (`STEP`, `LIVE`, `TQ` in skill-explore.js); each restates the station's own `did`, `cue` or miss text. One
change of position, not content: the bleeding station's "no gloves" mark moved beside the wound (it covered the
tourniquet's time tag). Open points for a person: `docs/nremt-needs-author.md`, "Skill sheets, tools v2".

## Checks (2026-11-19)
- Sweep `scripts/tools-v2/nremt-skillsheets-sweep.mjs`: ten widths, light and dark, every station at half, all and
  out of order; frames at 390 and 1440; reduced motion; deep links; Test yourself pause and result; perf at CPU x4.
  Results in the handover report.
- `node --test scripts/test/nremt-station-patient.test.mjs` passes (17).

## What I am not happy with
- The rendered figure is one mannequin body for every patient (an existing limit, `docs/nremt-needs-author.md`,
  "Female figure"); a seated patient is the same standing figure in front of a seat.
- The trauma station stays upright, so on a wide screen the mat shows as a band with floor either side.
- Long stations (trauma 16 steps) make the phone page long: the sheet sits under the picture and a tap there
  scrolls the picture back into view.
