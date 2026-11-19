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
  and `.css`): the course's rendered body (BodyParts3D) in a setting for its station (review round 1): a padded mat
  on a tiled skills lab floor (bleeding, BVM, the two splints), a sports hall floor (cardiac arrest), the roadside
  with its kerb and lane line (supine spinal), a lawn with the fallen ladder (trauma), a car's interior (seated
  spinal) and a room with a window and an armchair (oxygen, medical), each with a soft light and shadows; a patient
  on their back lies across the stage on a wide screen (head left) so the body fills it; a seated patient sits (the
  lower legs drawn from the knee, in front of the cushion, feet on the floor); on the spinal stations the arms lie at
  the sides; trauma stays head up (its findings are laid out around an upright body). Beside the patient (below it on a
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
- (Before review round 1; the round's own results are under "Review round 1".) Sweep
  `scripts/tools-v2/nremt-skillsheets-sweep.mjs` (one width per process), runs: 360 5862, 390 5862,
  430 5862, 600 5860, 768 5740, 820 5740, 1024 6080, 1280 6040, 1440 5999, 1920 6039 checks passed, 0 failed.
  Frames (390, 1440): 67 passed, 2 failed, both performance: with the CPU throttled x4, taps gave median 16.7 ms and
  p95 100 to 183 ms at 390, median 33 ms and p95 283 ms at 1440 (earlier runs from 66 to 400 ms median at 1440).
  The machine's load average was 9 to 11 on 2 cores with software rendering; a trace shows the time in raster and
  the software compositor, not in script (a tap's script is about 4 ms). Done for it: items on their own svg, the
  camera moves as a transform with the view box set once at the end, words fitted per frame without layout reads,
  the pool's turbulence filter replaced by drawn edges, the pool and pallor updated in visible steps, faded items
  hidden. To recheck on a quiet machine.
- `node --test scripts/test/nremt-station-patient.test.mjs` (17) and the NREMT and kit tests (116) pass; check-site
  and check-weight pass; check-tool-use, run on a local copy listing this page, reports tool-open, tool-touch,
  tool-mode, tool-use with frame v2 and nothing under automation.
- `node --test scripts/test/nremt-station-patient.test.mjs` passes (17).

## Review round 1 (2026-11-19): BLOCK, fixed the same day
Review: `/home/claude/review-nremt-skillsheets/REVIEW.md`. The medicine was confirmed unchanged; nothing here changes
a step, a critical criterion, an order rule or an examiner cue. First `claude/tools-v2-all` was merged in (main after
PR #228; its `scripts/check-tool-use.mjs` kept).

Must fix, done:
1. **"!" only on a step that was done.** `liveKeys()` now maps each live mark to the step done out of turn: through
   vomit to the ventilation that was done; "not reopened" to the OPA; shock care first to the first of position,
   oxygen or blanket done before the tourniquet; no gloves to the first touch step done (before the gloves, if any).
   A mark whose step is not done gets no row. The sweep asserts it in every out of order state at every width and
   in seven named cases (390 and 1440).
2. **No blank band during camera moves.** While the camera moves, each svg shows the union of the start and end
   boxes, sized at the start's scale and placed where that puts it, so whatever slides into view is painted (the
   reviewer's second option; `overflow: visible` was tried first and made every frame paint the whole 6500 unit
   floor, three times slower). The frames run checks every frame of a move covers the picture.
3. **Board alongside**: the same long board that later goes under the patient (280 units, about 16 in) lies on the
   road beside them, opaque, with its shadow, clear of the arm (the arms now lie at the sides).
4. **Seated "Move to board"**: worded as said out loud ("Move to board, said out loud: pivot to a board"; on the
   picture "Said: pivot onto a long board"); nothing claims a move that is not drawn.
5. **Phones, BVM**: once the bag is out to squeeze, a non lying picture frames the bag and the chest (`camFor`).
6. **Phones, first screen**: stacked, the picture height is capped (260 to 600 px, measured from the sheet) so the
   clipboard's head and its first two rows, and the cue, are on the first screen (390x844, 768x900 and every
   stacked width in the sweep). The sweep's "largest thing" check on stacked layouts now compares the picture with
   the part of the clipboard on the first screen.
7. **Visuals raised toward the flagship** (rule 12, owner's standing rule):
   - Each station has a setting (`def.scene`, `room()`): skills lab mat (bleeding, BVM, splints), sports hall floor
     (cardiac arrest), the roadside with kerb, gutter and lane lines (supine spinal), a lawn with the fallen ladder
     (trauma), a car's interior with windows, pillars and carpet (seated spinal), a room with a window, skirting and
     an armchair (oxygen, medical). A soft pool of light over the patient and shadows under the mat, seat and board.
     The room draws on its own svg (`svg0`) so changes on the patient never repaint it.
   - Seated patients sit (`def.seat`, `pose()`): the lower legs, cut just above the knee, are drawn in front of the
     cushion (a touch wider, foreshortened), feet on the floor; the seat has a lit top and a darker front face.
   - Supine and seated arms lie at the sides (`def.arms`, turned in at the shoulder); every point on a moved part
     goes through `posePt()` (the pulse checks at the hands and feet).
   - The log roll is animated (`rollBoard()`): the body rolls away (narrows), the board slides in from beside them,
     they roll back; taking it back reverses it. The words wait for it (`busy()`); reduced motion gets the end state.

Should fix, done: wording "OPA after breaths", "Splint before the check" (and "Collar before the check" on the spinal
sheets; it is right whether the check was late or never done), "before the bleed was stopped"; the AED camera frames
the head and chest (chest and AED focus boxes); trauma's "Back: nothing" is inside the picture at 1440 (upper focus
taller); "?" says Explore has no station timer (the bleed's clock runs there). Also fixed: on a wide stage the
tourniquet's "Tap the thigh" box stretched to the full picture height (two rules disagreed).

Checks after the round:
- Sweep, one width per process: 360 5892, 390 5892, 430 5892, 600 5904, 768 5784, 820 5784, 1024 6122, 1280 6092,
  1440 6092, 1920 6092 passed, 0 failed.
- Frames run (390, 1440): 143 passed, 2 failed, both performance under a load average of 10 to 14 on 2 cores (other
  sessions running): 1440 median 100 ms. Measured earlier the same afternoon at a load of 6 with the reviewer's own
  script, back to back with the flagship: bleeding median 17 to 33 ms, p95 233 ms; supine median 17 ms, p95 117 ms;
  the flagship median 50 ms, p95 100 to 133 ms. The bleed's tails are still above the flagship's; recheck on a quiet
  machine.
- NREMT and kit tests 71 passed; check-site and check-weight pass; no conflict markers.

## What I am not happy with
- Performance under CPU x4 here is over budget (above); it needs a measurement on a quiet machine or a real phone.
- The rendered figure is one mannequin body for every patient (an existing limit, `docs/nremt-needs-author.md`,
  "Female figure"); a seated patient is that figure posed (round 1), not a seated render, and the log roll is the
  body narrowing as seen from above, not a 3D roll.
- The trauma station stays upright, so on a wide screen the mat shows as a band with floor either side.
- Long stations (trauma 16 steps) make the phone page long: the sheet sits under the picture and a tap there
  scrolls the picture back into view.
