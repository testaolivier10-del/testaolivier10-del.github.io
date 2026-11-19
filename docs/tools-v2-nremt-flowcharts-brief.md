# Tools v2: NREMT Protocol flowcharts (brief and build notes)

Status file for the v2 rebuild of `nremt/flowcharts.html` (free; rank 16 in `docs/tools-v2-rollout.md`, group F,
"step and flow builders", a "rework"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`.
Branch `claude/tools-v2-nremt-flowcharts`, built on `claude/tools-v2-all`. NOT merged: an independent review comes
first. Decisions made for the owner are also one line each in `docs/tools-v2-owner-log.md`; open medical points in
`docs/nremt-needs-author.md` ("Flowcharts, tools v2 Explore"). The third NREMT tool on the v2 kit; it uses the NREMT
adapter (`nremt/assets/nremt-kit2.js`) as it is (no adapter change was needed).

## What the old tool teaches (from `claude/tools-v2-all`)
Ten protocol charts written in the page's HTML (primary assessment, choking adult and child, choking infant,
anaphylaxis, stroke, spinal motion restriction, adult BLS and CPR, shock, START triage, SALT triage),
three modes: Read (one chart at a time, a part at a time with "Next part of the chart", "Why?" notes), Build it
(drag the shuffled steps into the chart; decoys from other protocols; record `build:<anchor>`) and Drill me ("which
step comes next?"; record `<anchor>:<step slug>`). The rollout's verdict: "The free mode is reading a text chart; the
doing is in Build it."

## The one main idea
**A protocol is a chain of decisions, and what you find on the patient picks each branch.** Explore puts a drawn
patient beside the protocol card: at each decision the picture shows the finding (blood spurting, snoring, no pulse,
"Shock advised" on the AED), the student picks the branch that fits, the action plays out on the patient, and the
chart grows one box at a time on the card. A wrong branch is drawn too: its consequence happens on the patient
(the pool of blood grows, the lips turn blue, minutes are lost), the arm stays on the chart struck in red, and the
student takes the other arm. By the end the student has built the chart by walking a call through it.

## Research (rule 10)
Seen means the page was opened and read here; "text only" means only a store listing or a description could be read
(no app can be run here).

| Source | Seen how | How it works | What we took |
|---|---|---|---|
| AHA 2025 Adult BLS algorithm for healthcare providers, accessible text version (cpr.heart.org, 2025-Accessible PDF) | Fetched and read | Ten boxes: scene safe; check responsiveness, shout for help, activate EMS, get the AED; breathing and pulse together, pulse within 10 s, three outcomes (normal breathing and pulse, pulse but abnormal breathing, no breathing or only gasping and no pulse); CPR 30:2; AED arrives; shockable or not; 1 shock then CPR at once for 2 minutes | The cardiac arrest call follows these boxes in this order, with the three way pulse and breathing fork exactly as AHA has it |
| MediCode (ACLS, PALS, BLS app; App Store listing) | Text only | "Interactive step by step walkthroughs take you through each algorithm one decision at a time", a restart button at any point | One decision at a time, Start over always there. Gap: the decision is a text button with no patient to look at |
| ACLS Simulator (Google Play listing) | Text only | Recognise rhythms, choose interventions, reassess, a score at the end | Choices driven by what the monitor shows (our AED screen). Not taken: the score (Explore is free play; Test yourself grades) |
| Full Code medical simulation (independent review page, iatrox.com) | Fetched (review based on product documentation) | A virtual encounter as "the unit of practice": gather findings, choose actions, a debrief | A call is the unit; the finding comes before the choice. The review could not say whether a delay changes the case; ours shows it |
| Brilliant (brilliant.org About page; the pathways rebuild saw its teaching page) | Fetched | "Visual and interactive", learning by trying problems | Each step is an action with a result in the picture at once |
| The old LevlPrep page (seen in the browser at 1440) | Opened | Read / Build it / Drill me on ten text charts | Every chart, drill and record unchanged in Test yourself; the chart shapes (action box, decision box with pointed ends, labeled arms) are the same on the drawn protocol card |

What ours does that none of them do: the decision is made by looking at a drawn patient, the chart is built on a
protocol card on the floor beside him as you go, and a wrong arm plays its real consequence on the patient instead
of just saying "wrong".

Science checked against the course notes (`nremt/assets/study-notes.json`: primary assessment, airway sounds
"snoring = tongue = reposition", jaw-thrust when the spine is in question, tourniquet 2 to 3 inches proximal and
never over a joint, shock care: supine, warm, oxygen if indicated, rapid transport; reassess every 5 minutes if
unstable; agonal gasps are not breathing; resume compressions at once after a shock), the AHA 2025 adult BLS
algorithm above, and the page's own charts. Open points are in `docs/nremt-needs-author.md`.

## The design
- **Picture** (`nremt/assets/flow-explore.js`, `.css`): the course's rendered body (`body-figs/`, BodyParts3D, the
  figure the mnemonics, body map and skill stations use) lying on his back, seen from above, on a drawn floor, and the
  **protocol card** (a clipboard with the chart drawn on it) on the floor beside him. On a wide stage the patient is
  on the left (head left) and the card on the right; on a phone the patient is on top and the card below. The
  patient is the largest thing at every width (sweep checked); the card is part of the scene, not a panel.
- **Two tabs, one call each** (the short curated set; each is a different protocol, so a tab each):
  1. **Primary assessment**, a man who fell from a ladder onto glass (garage floor): AVPU (his eyes open when the EMT
     speaks: Voice), severe bleeding (bright red blood spurting from the right thigh: tourniquet 2 to 3 inches above
     it, the spurting stops), airway (snoring: jaw thrust, since a fall puts the spine in question), breathing (the
     chest rises fully, 18 a minute: fine), shock (pale, sweaty, a fast weak radial pulse: keep him warm, a blanket
     is drawn over him), priority (altered, in shock: rapid exam and transport now, reassess every 5 minutes).
  2. **Cardiac arrest**, a man collapsed at home (living room floor): responsiveness (the EMT taps and shouts, nothing:
     call for help and the AED), breathing and pulse together within 10 seconds (two fingers on the carotid, a 10 s
     ring, one gasp: no pulse, gasping is not breathing; the three AHA outcomes are the three arms), CPR 30:2 (hands
     pump the centre of the chest, then two breaths with the bag and mask), the AED arrives and the pads go on (right
     upper chest, left side below the armpit), the AED's screen shows the rhythm and "Shock advised" (shock: everyone
     clear, the shock, compressions resume at once for 2 minutes).
- **Main control, on the picture:** the arm buttons hanging under the current decision box on the card (two to four
  answers, 44 px tall, real buttons: Tab, Enter, arrows move between them). They appear only once the picture has
  shown the finding. A right arm turns course teal with a check and its line runs down to the next box; a wrong arm
  turns red with a cross, its consequence (1 to 3 words) under it, and it stays.
- **Every change is animated:** the line draws, the box grows in, the action happens on the patient (the tourniquet
  tightens and the jets stop, the gloved hands lift the jaw and the snoring stops, the blanket slides over him, the
  hands pump, the pads go on, the shock flashes), the card slides up so the new box is in view. Reduced motion: a
  short cross fade and the end state at once (still hands with "30:2", a still pool).
- **Wrong arms never heal:** the extra blood lost stays on the floor, blue lips stay until the jaw thrust, and lost
  time is a small clock on the scene ("2 min lost") that only Start over clears.
- **Cause line** (`K.cause`), one colour per idea everywhere: what you see (blue, the finding labels on the patient),
  the answer (amber, the decision boxes and arm buttons), what it does (course teal, the action boxes) and a wrong
  arm's consequence (red). "Bright red, spurting → Yes, severe → tourniquet stops it". The last pill waits for the
  picture. At the end the takeaway replaces it.
- **Buttons under the picture:** "Start over" only (same tab, a clean patient and a blank card).
- **Cue:** "Look at him, then pick" beside the first arm buttons, once per device; "Show me how" from the purpose line
  and "?".
- **"?":** what you are looking at, the two calls step by step with the why of each step, what Explore leaves out
  (the other eight protocols, the second rhythm check, the detail of the rapid exam), the figure's credit, the course
  footer.

### Explore against Test yourself
- Explore: free play on the call; nothing graded, nothing recorded.
- Test yourself (one dropdown on the stage, "What to practice"): **Read a chart** (the old Read: all ten charts,
  the protocol dropdown, a part at a time, "Whole chart", "Why?" notes), **Build it** (the old board, unchanged:
  record `build:<anchor>`), **Drill me** (the old drill, unchanged: record `<anchor>:<step>`). Each is the old screen,
  moved in through `NremtStudio.kit2`, not copied; the chart HTML that `flow-build.js` and `flow-drill.js` read is
  unchanged.
- Deep links: `#flow-<chart>` opens Read on that chart (Review's "See the diagram" links); `#build-<chart>` opens
  Build it; `#drill` opens Drill me; `#test` opens Test yourself; `#call-primary` and `#call-arrest` open Explore on
  that call; no hash opens Explore. `?studio=0` keeps the old page.

### What moved (nothing dropped silently)
- Reading a chart (the old free view) is the first part of Test yourself, unchanged.
- The other eight protocols (choking adult and child, choking infant, anaphylaxis, stroke, spinal motion restriction,
  shock, START, SALT) are in Test yourself only (Read, Build it, Drill me). Candidates for later drawn calls: choking
  (back blows and thrusts on a drawn infant), START triage (a scene with several patients).
- The Read mode's legend of the three shapes and the chart's notes now sit in Read's own panel, as before.

### What is on screen in Explore (counted, opening, 1440 and 390)
2 tabs; 1 purpose line (8 words) and "Show me how"; 1 picture with: the patient on his floor, 1 patient chip, the
protocol card with its first box and the first decision box, 2 to 4 arm buttons (after the finding shows), 1 to 2
finding labels (1 to 3 words) and, while the EMT speaks, 1 speech bubble. Under the picture: 1 cause line (2 pills at
a decision, 3 after a pick, the takeaway at the end) and "Start over". The cue on the first visit only. No side panel,
no text block.

## Decisions made for the owner (also in the owner log)
1. Explore is a drawn call beside a drawn protocol card, two tabs (primary assessment, cardiac arrest); the other
   eight charts are Test yourself only.
2. Read, Build it and Drill me are the three Test yourself parts, unchanged; record ids unchanged.
3. Deep links: `#flow-...` opens Read, `#build-...` Build it, `#drill` Drill me, `#test` Test yourself, `#call-...`
   Explore on that call.
4. The cardiac arrest call uses AHA 2025's three way breathing and pulse fork; the page's chart (two arms) is unchanged.
5. In Explore's primary assessment the circulation fork is "Signs of shock?" (yes: keep him warm) instead of the
   chart's "bleeding still uncontrolled / perfusion adequate", because a patient whose bleeding is controlled can
   still be in shock (logged in `docs/nremt-needs-author.md`; the chart itself is unchanged).
6. Wrong arms show a consequence and stay struck; lost time is a clock on the scene that only Start over clears.
7. Made up patients.
8. `scripts/check-tool-use.mjs` uses this page as its NREMT old frame sample; not edited here (the lead moves the
   sample before integration).

## Build notes
- `nremt/assets/flow-explore.js` and `.css`: the two calls (`CALLS`: steps, arms, what each arm does), the floors
  (garage concrete with the fallen ladder and glass; a living room floor with a rug, a sofa and a spilled mug), the
  patient (`LevlBodyFigs` `body`, `adult-front`, fetched only when shown) with clothes clipped to his outline, a drawn
  face (eyes open or closed, mouth, blue lips, sweat), a pale and a gray overlay under the clothes, and everything an
  action or a consequence draws (wound and jets, pool of blood, tourniquet with its windlass, snoring arcs, gloved
  hands for the jaw thrust, the radial pulse, the shoulder tap, the carotid check and CPR, chest rise lines, blanket,
  bag and mask, pads and wires, the shock). The AED is drawn in stage px (its words read). The protocol card is HTML
  over the picture (a clipboard: nodes, arm buttons, connectors in its own svg that draw in, a view that pans to the
  newest box). A "camera" frames the part of him that matters on a narrow stage (the whole call on a wide one).
- What is drawn is a function of the call's `fx` state; a step changes `fx`, waits for the drawing, then names it
  (labels, the cause line's last pill). One timer owner (`run()`); `hidden()` finishes a running step at once, so
  Test yourself never shows half a step and nothing runs while Explore is hidden.
- `nremt/flowcharts.html`: loads the kit, the adapter, `body-figures.js` and the tool; its script keeps every old
  piece (chart decorations, the protocol select, a part at a time, Why?, short names, Build's picker and finished card,
  Drill's verdict pills) and hands Read, Build it and Drill me to `NremtStudio.kit2` as Test yourself parts. The chart
  HTML that `flow-build.js`, `flow-drill.js` and the tutor read is unchanged; `?studio=0` keeps the old page.
- `scripts/tools-v2/nremt-flowcharts-sweep.mjs`: the kept sweep (one process per width, then `--frames`).
- A one file preview needs the body figure inlined by hand (the shared `tool-preview.mjs` does not follow
  `LevlBodyFigs.load`); the preview in outputs was patched that way, the script was not changed.
- `scripts/check-tool-use.mjs` is not edited (its NREMT sample moved to Formulary on the collecting branch, merged
  here); a local copy listing this page reports frame v2: open, touch, mode, use; nothing under automation.

## Checks run (2026-11-19)
`node --test scripts/test/nremt-*.test.mjs` (71 pass), `check-site` (OK), `check-weight` (no NREMT budget moved: the
nremt shell still measures 28.6 of 28.8 KB on its largest page; the one failing line in this tree is an AP® Human
Geography map, not this branch), a local copy of `check-tool-use.mjs` listing this page (frame v2: open, touch, mode,
use; nothing under automation). Playwright at 390 (touch), 768 dark and 1440: 27 checks each (opening and cue, the
cue clear of arms and boxes, keyboard picks with arrows and Enter, leaving Explore mid step and coming back, Test
yourself Read, Drill a question with its verdict, a Build placement, back to Explore, deep links `#flow-...`,
`#build-...`, `#drill`, `#call-arrest`, a reduced motion run to the takeaway, no console errors); Test yourself opens
on the chart of the call just walked, and a glance at Explore keeps the chart the student was on.
Sweep (`node scripts/tools-v2/nremt-flowcharts-sweep.mjs`, one process per width): every decision with its arms
live, the state after one wrong arm at every decision, the end and Start over, both calls, light and dark, plus the
first visit with the cue: 360, 390, 430, 600: 1226 passed each; 768, 820, 1024, 1280, 1440, 1920: 1184 passed each;
0 failed. `--frames` (390 and 1440, every pick right and wrong, about 1900 frames): labels, live arms and the cause
line's last pill never run ahead of the drawing (it caught seven timing faults, all fixed; a step that names
something now waits until the drawings have finished fading, so it holds on a busy device); leaving mid step and
returning; reduced motion. After the last changes, 360, 768 and 1440 were run again (pass) and `--frames` passes
everything but the frame time limit, which fails only under load (below).
Preview: `/mnt/user-data/outputs/nremt-flowcharts-v2/index.html`; shots in `/mnt/user-data/outputs/nremt-flowcharts-v2/shots/`
(`sweep-*`, and `v-*` with mid change frames `v-*-mid`).

## Not done, and what I am not happy with
- Frame times with the CPU slowed x4: median 16.7 ms; p95 33 to 43 ms in quieter runs, but 50 to 100 ms while the
  shared machine was loaded (load average 12; idle frames then spiked to 300 ms too). The longest frames are the
  pick itself (the card is laid out again and measured). Worth a clean measurement on an idle machine.
- No independent medical review yet (points in `docs/nremt-needs-author.md`); no real phone, no screen reader pass.
- The gloved hands are simple shapes and large (adult hand size), so the carotid and wrist hands cover part of the
  neck and arm; the body is the same mannequin as the mnemonics patients.
- The arrest patient's face does not change colour much with the gray overlay; the jets of blood are thin strokes.
- Only Chromium.

## Review round 1 (2026-11-19, independent review BLOCK; fixed on this branch)
Merged `origin/claude/tools-v2-all` first (main after PR #228; both sides of the docs tables kept). Medicine and the
three choices (three way pulse fork, "Signs of shock?", AVPU before X) were confirmed.
Must fix:
1. Spurting blood: three thick, bright jets with a light edge arc out of the wound toward his feet, clear of the pool
   (the pool moved up beside the hip and lost its pale blob); drops at their ends; the label sits off the wound.
2. Gray and pale: the clothes are opaque (no multiply), shaded with a gradient across the body; the overlays tint the
   skin only, with a stronger tint on the face, and the lips turn blue as he grays.
3. Carotid: an adult size hand (about 0.8 of his head's length) with two fingers out, the fingertips in the groove
   beside the windpipe, the palm off the neck; the radial check uses the same hand.
4. Jaw thrust: two hands at his head, fingers hooked behind the angles of the jaw, thumbs on the cheekbones, and a
   small forward lift when they act.
5. On every stage of 600 px and wider the whole body is framed left of the card (or above it under 1100 px); the card
   sits beside him on wide stages from 1100 px.
Should fix: CPR is two stacked hands on the lower half of the breastbone with the EMT's forearms; "Rapid exam" shows
while the hand sweeps him (the hand stays); the first box reads "Scene safe, hold head still"; on a short phone
(360 x 740) the stage is shorter so the arms and the cue are above the fold (the sweep checks it); labels keep off
what they name (a keep out box per label: the wound and jets, the face, the hands, the pads); glass is drawn as
irregular slivers with a highlight; the struck arm's cross is inline and the arm name never wraps; the brief says ten
charts. Not taken: pads sliding on (they fade in).
Checks after round 1: NREMT tests 71 pass; check-site OK; check-weight all 623 budgets within range. Sweep, one
process per width: 360 1227 (with the 360 x 740 fold check), 390, 430, 600 1226 each, 768, 820, 1024, 1280, 1440,
1920 1184 each, 0 failed. `--frames` 86 passed, 0 failed (about 2300 frames); frame time with the CPU slowed x4:
median 16.7 ms, p95 16.8 ms at 390 and 33.4 ms at 1440 (load average 5).

## Recheck 1 (2026-11-19, BLOCK on two items; fixed)
1. Labels: one shared keep out list every label avoids (his face and every drawn glove, forearm, pad, the
   tourniquet, the wound, the jets and the mask, measured from the drawing), plus each label's own box; the sweep
   now fails any label on a drawn object.
2. CPR: two hands that can be counted at 390 (the bottom hand 13 px toward his head with its own forearm and cuff,
   the top hand's fingers laced over it).
Should fix done: the jets' light edge is dashed like the core and the jets bend; the Rapid exam label comes when the
sweep ends with its leader on the hand; the mask sits lower, off the eyes; the pulse fingers sit higher on the neck;
the first box reads "Scene safe, gloves, head still".
Checks: NREMT tests 71 pass. Sweep, one process per width: 360 1227; 390, 430, 600 1226 each; 768, 820, 1024, 1280,
1440 1184 each; 1920 1176; 0 failed. `--frames` 86 passed, 0 failed (p95 50 ms at both widths, CPU x4).

## Polish after recheck 2 (PASS): the gloves
Every gloved hand (carotid, radial, jaw thrust, CPR, shoulder tap, rapid exam) is redrawn as a nitrile glove: four
fingers and a thumb, knuckle creases, radial shading with a highlight down each finger, a rolled cuff, adult scale
against his head; same places, labels still clear of them (the shared keep out list includes every glove part). There
is no separate bleeding control hand (the tourniquet is drawn on its own). The CPR hands are offset a little more so
both cuffs and forearms count. Checks: NREMT tests 71 pass; sweep 360 1227, 390 1226, 1024 1184, 1440 1184, 0 failed;
`--frames` all layout and timing checks pass; frame time p95 66 to 133 ms at load average 9 to 10 (the earlier run at
load 5 gave 17 and 33 ms); a drop shadow on the gloves was removed to keep frames cheap.
