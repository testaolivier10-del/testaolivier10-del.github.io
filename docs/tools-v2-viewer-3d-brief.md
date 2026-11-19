# Tools v2: Organic Chemistry 3D Molecule Viewer (brief and build notes)

Status file for the v2 rebuild of `ochem/tools/viewer-3d.html` (rank 19 in `docs/tools-v2-rollout.md`, rollout
group X, the explorers). Standard: `docs/tools-v2-standard.md`; builder brief: `docs/tools-v2-builder-brief.md`.
Branch `claude/tools-v2-viewer-3d`, cut from `claude/tools-v2-all`. NOT merged: an independent reviewer runs first.

## The one main idea, per screen
1. **Shape.** Every electron group on an atom (a bond, a double or triple bond counted once, or a lone pair)
   pushes the others as far away as it can. The number of groups sets how they spread; the shape is named from the
   atoms only, so lone pairs make it pyramidal or bent, and they squeeze the bond angle below the ideal (107° in
   ammonia, 104.5° in water).
2. **Handedness.** A carbon with four different groups has a handedness a flat drawing hides. Turn the lowest
   priority group (H) to the back and read 1 → 2 → 3: clockwise is R, counterclockwise is S. Its mirror image reads
   the other way, so it is a different molecule.

Two tabs because they are two ideas (rule 11). The old tool had one screen with every molecule and a readout panel;
the stereocenter was one molecule in the list with a note.

## Research (rule 10): what exists and what we took
"Seen" means the page's text was read through a fetch tool; no screen was watched or driven, so nothing is claimed
about how any of them feels in the hand.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| PhET Molecule Shapes and Molecule Shapes: Basics (teacher guide seen) | Build around a central atom: add bonds and lone pairs, rotate, show or hide bond angles and the shape's name; a Real Molecules screen | The count of groups is the control; angles and the name on the model | The Basics angles are the ideal ones, not measured; electron and molecular geometry names are easy to mix | Lone pairs drawn as big lobes, the angle drawn on the model, the shape named from the atoms with the lone pairs visibly there |
| MolView (help text seen) | Drag to rotate, wheel or pinch to zoom, Model > Reset, four representations, Jmol menu measures distance and angle | Turning is the whole interface; Reset always there | Measuring is hidden in a menu (two clicks per angle); no teaching | Drag anywhere turns, pinch or Ctrl and wheel zoom, a Reset view button; the angle is measured and drawn without a menu; styles behind "?" |
| ChemTube3D (NCERT slides about it seen) | Pick a molecule, a Jmol model opens with the bond angle shown; Controls menu with Spin | The angle is on the model (H–N–H 106.7°) | Navigation by hover menus; no reason given for the number | The angle on the model, measured from the same coordinates |
| Sydney iChem VSEPR tables (page seen) | Shapes sorted by bonds and lone pairs, each with a "View in 3D" link | The sorting by bonds plus lone pairs is the right key | A table, not a model; lone pairs never drawn; two entries look wrong | The cause line is that key: "3 bonds + 1 lone pair → 4 groups" |
| Complete Anatomy (rollout group X model; not inspected for this job) | Tap a part, a short card on the picture | | | `K.spots`: tap an atom, its card on the picture |

What ours does that none of them do: the tapped atom's own electron groups light up (its bonds blue, its lone pairs
as amber lobes), the angle is drawn on it and measured, and one coloured line gives the reason; and on the second
tab a live mirror reflects whatever you do, so R on one side and S on the other are read at the same moment.

## The design
### Tab 1, Shape
- **Picture:** a ball and stick model (shaded balls, sticks, a shadow on a bench) filling the stage. The tapped
  atom has a ring; its bonds are blue; its lone pairs are amber lobes with two electrons in each; the smallest bond
  angle at it is drawn as an arc with its measured value ("107°"); its label card names the shape ("Trigonal
  pyramidal").
- **Main control:** the molecule. Drag anywhere to turn it; tap an atom to read it. Keys: arrows turn it (the scene
  has focus), Tab reaches the atoms (`K.spots` pins; Enter picks, arrows move along them). Pinch or Ctrl and wheel
  zooms.
- **Quiet on the picture:** the Molecule picker (every molecule of the old list, in its groups), Reset view.
- **Cause line:** "3 bonds + 1 lone pair → 4 groups, sp³ → trigonal pyramidal 107°". An end atom: "1 bond → an end
  atom, no shape of its own". Formamide's N: "3 bonds + lone pair shared with C=O → 3 groups, sp² → trigonal planar".
- **Opens** on ammonia with N tapped (decision 3).

### Tab 2, Handedness
- **Picture:** CHFClBr (the old list's "A stereocenter") on the left or top, a mirror, and its reflection on the
  other side. Priority numbers 1 to 4 sit by each group on both. When the H points away (within 35° of straight
  back) a curved arrow runs 1 → 2 → 3 round the carbon on both and each gets its letter, R or S.
- **Main control:** drag anywhere turns the molecule; the reflection follows, as a mirror does.
- **Quiet on the picture:** "H to the back" (turns it there, animated), Reset view.
- **Cause line:** "H at the back + 1 → 2 → 3 clockwise → R | mirror image: S"; while the H is not at the back:
  "H not at the back → turn it away to read".

### One colour per idea, everywhere (picture, labels, cause line)
Bonds of the tapped atom blue; lone pairs amber; the shape and the angle in the course colour (violet); the reading
direction (the arrow, R or S) green.

### Explore against Test yourself
- **Explore:** free play. Nothing locked, graded or asked.
- **Test yourself:** one dropdown, "What to practice":
  1. **Name the shape** (the old "Predict shape", same pool, chips, grading and running count): the ringed atom on
     the same picture with letters, card, angle and cause line hidden; name the shape (and the angle where the old
     tool asked it), Check, then everything comes back. `#predict` opens it.
  2. **Check yourself: 6 questions** (the page's quiz, `OchemToolQuiz` slug `viewer-3d`, the same generator and
     record ids `<molecule>:shape` and `<molecule>:hyb`). `#check` opens it.
- **Links:** `mol`, `build`, `st`, `mode`, `rx`, `ry` are read and written as before; `tab=hand` opens tab 2.

### What moved
| From the old tool | Where it is now |
|---|---|
| Explore / Predict shape switch | Explore and Test yourself (part 1) |
| Picker panel (Ready-made, Other molecules) | The Molecule picker on the picture, grouped |
| Build your own (switch in the picker panel), its send row | "?", "Build your own molecule"; the picture follows every change |
| "What this atom is doing" panel (groups, bonds, lone pairs, hybridization, the shape note) | The card, the lit groups, the arc and the cause line; the full readout in "?", "This atom" |
| "Every angle, measured" table and the lone pair squeeze note | "?", "This atom" |
| The molecule's note | "?", "This molecule" |
| View options: ball and stick, space filling, wireframe; Atom labels; Lone pairs; Zoom | "?", "View"; zoom also by pinch or Ctrl and wheel |
| View presets Angled, Front, Top, Edge-on; Spin | "?", "View"; Reset view (Angled) on the picture |
| Idle rock after 2.6 s | Removed (decision 6) |
| Plain wheel zoom | Pinch, or Ctrl and wheel (decision 7) |
| The stereocenter as one molecule in the list | Still in the list; and tab 2 |

## Decisions made for the owner
1. **Two tabs** (Shape, Handedness): the stereocenter is a different idea from VSEPR.
2. **Lone pairs on the tapped atom only, drawn as lobes;** other atoms' lone pairs are off by default (a switch in
   "?" shows them all as dot pairs, as before). Eighteen dot pairs on SF₆'s fluorines hid the idea.
3. **Opens on ammonia, N tapped** (old: methane). A lone pair and a squeezed angle show at once.
4. **The smallest angle is drawn,** as the old Predict feedback used; every angle stays in "?".
5. **Styles, labels, lone pairs everywhere, presets, Spin and zoom moved to "?".** Extras start hidden.
6. **The idle rock is gone:** motion only while something is happening (rule 13). The cue says what to do.
7. **Plain wheel no longer zooms** (it trapped page scrolling); pinch or Ctrl and wheel does.
8. **Handedness is read only with H within 35° of straight back,** and shown on both the molecule and its mirror.
9. **No "R or S?" drill was added** to Test yourself; logged as a later addition.

## Accuracy (checked 2026-11-19; ochem content always gets a check)
- **The VSEPR table is unchanged** (`mol3d.js`); the library's coordinates changed in review round 1 (below). Unit tested: the cause line of every
  shape the table has (methane 109.5°, ammonia 107°, water 104.5°, BF₃ 120°, CO₂ and ethyne 180°, PCl₅ and SF₆ 90°,
  ethene 120°, the methyl cation flat and the anion pyramidal), a double or triple bond counted once, formamide's N
  "lone pair shared with C=O" (never "no lone pairs"), an end atom named as one, and the card naming every focus
  atom by the table's shape.
- **Handedness.** Priorities by atomic number (Br, Cl, F, H). The library's CHFClBr is (S) by the 3D rule
  ((v₁ × v₂) · v₃ < 0 is R with the lowest priority away); its mirror image is (R). The reading on screen is the turn
  of 1, 2, 3 as drawn; unit tested over 4000 turns with the H within 35° of the back: it always equals the 3D
  configuration, and the reflection (side or floor mirror) always reads the other letter. The sweep reads the letter
  again from the balls' positions on screen at every state.
- **Words that are new on the page,** checked: "a lone pair pushes like a bond (a little harder) but is not part of the
  shape's name"; "swapping any two groups is the only way" to turn one into the other; PCl₅'s 90° axial to equatorial
  and 120° equatorial; formamide's N flat because its pair is in a p orbital (resonance).
- **Fixed while moving text:** the old key said every listed molecule carried real angles; ethene, formaldehyde,
  hydronium, the methyl anion and methanol are idealized. "?" now says which are which.
- **Open, in `docs/ochem-needs-author.md`:** v3-v2-expanded-octet (sp³d, sp³d² labels, kept), v3-v2-ideal-angles,
  v3-v2-back.

## What was built
- `ochem/assets/tools/viewer-3d.js` (rewritten; the Predict pool, grading, verdict text and the Check yourself
  generator are the old code, ids unchanged), `ochem/assets/tools/viewer-3d.css` (new), `ochem/tools/viewer-3d.html`
  (inline styles gone; `kit2: true` in `ochem/assets/tools-registry.js`, the builder writes the kit and the stylesheet).
- Its own SVG painter: one element per ball, stick, lobe and arc, made once per molecule and moved per frame, depth
  sorted by re-appending only when the order changes. The molecule turns about the centre of its smallest enclosing
  ball and is fitted so no turn clips it. Each molecule opens in a searched view (`homeView`).
- `K.spots` names the atoms (pins invisible over the balls, keyboard stops; a tap is resolved on the front ball under
  the finger by the tool and handed to the kit; the card avoids balls, lobes, labels and controls).
- `window.OchemViewer3DModel` and two tests in `scripts/test/tool-content.test.mjs`; the sweep
  `scripts/tools-v2/viewer-3d-sweep.mjs`.
- Old viewer rules removed from `ochem/assets/tools.css` (`.v3-quiz`, `.v3-ls`).

## What is on screen in Explore (counted; Playwright, opening state)
Outside the picture: 2 tabs, the purpose line (8 words), "Show me how", the cause line (4 pills). That is 4 controls
and about 25 words. No side panel, no readout cards.
- Shape, on the picture: the molecule with its shadow; the tapped atom's glow, blue bonds, amber lobes, the arc and
  its angle; the card (1 to 3 words); the Molecule picker; Reset view. First visit only: the cue.
- Handedness, on the picture: the molecule, the mirror and the reflection; 8 priority numbers; 2 names ("Molecule",
  "Mirror image"); while the H is at the back, 2 arrows and 2 letters; "H to the back"; Reset view.

## Checks run (2026-11-19)
Unit tests, `build-tool-pages --check`, `check-site`, `check-weight --check`, `build-apcalc --check`,
`build-apmacro --check`, `check-tool-use` with a local copy of its list (the viewer reports open, touch, mode, use;
nothing under automation). Playwright (`/home/claude/v3-work/verify.mjs`, not in the repo) at 390, 768 and 1440,
light and dark: 190 assertions (opening words, mouse drag and a real touch drag, tap on the front atom, frames mid
change (line dimmed, no card, no angle), arrow keys, the pins by keyboard, the picker, Reset view animated, H to the
back reading S and R, the letters leaving on the same frame, Name the shape right and wrong and the count, leaving
mid change, Check yourself, reduced motion landing at once with a cross fade, links `mol`, `rx`, `ry`, `mode`,
`tab=hand`, `#check`, `build=`, no console errors), and a full drag with the CPU throttled x4: median 16.7 ms, p95
33.3 ms at 390 and 1440. The sweep: see below.

## The sweep
`node scripts/tools-v2/viewer-3d-sweep.mjs <width>` (one width per process): all 24 molecules in their opening view
and four turns, end atoms on four, the stereocenter at eight turns (H to the back included), three Name the shape
questions before and after Check, and a first visit on both tabs. 135 states and about 1605 checks per width; 0
failures at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920 (13,505 states' checks in all). Smallest share of
the stage the molecule takes, per width: 3.8, 3.5, 3.2, 4.6, 5.1, 5.3, 5.2, 4.1, 3.6, 3.9%. Shots:
`/mnt/user-data/outputs/viewer-3d-v2/sweep/`; review shots (mid change frames included) in `.../shots/`; preview
`/mnt/user-data/outputs/viewer-3d-v2/index.html`.

What the sweep changed: the card and the angle avoid every ball and lobe (they had read the previous frame's
positions); the angle's arc is the pair that faces the viewer and sits in front of its atom; an arc seen exactly edge
on behind its atom gets no number (water seen face on looks straight, which is the point of turning it); the first
visit cue keeps off the mirror image's balls; the Handedness layout is side by side or stacked, whichever gives each
molecule the bigger square.

## Side by side with the flagship, and what I am not happy with
- It is a drawn object with material and depth (lit balls, sticks, a shadow on a bench, glass for the mirror). It is
  not a landscape like the lake; a molecule is one object, so on a wide desktop the wall around it is open. The
  molecule is fitted to the ball that holds it at every turn, so small molecules (water, CO₂) take 3 to 4% of a
  desktop stage. A zoom (pinch, Ctrl and wheel) is there; the sweep's floor is 3.5% on desktops.
- On phones the Handedness molecules are small (about 120 px across): two molecules share a 360 px stage, and the H
  has no letter at that size (its number 4 names it).
- The angle arc goes behind its atom in some views, so its number is left off; the cause line still says it.
- Performance with the CPU throttled x4: p95 33 ms on a quiet machine, 50 to 67 ms when the shared machine was loaded
  (load average 10); median 16.7 ms throughout. The Handedness tab places 12 labels per frame.
- No real phone, screen reader pass or students. No independent review yet.

## Review round 1 (2026-11-19): BLOCK, fixed the same day
Review: `/home/claude/review-viewer-3d/REVIEW.md` (R/S and VSEPR confirmed right). Fixed by a new builder on the same
branch, after merging `claude/tools-v2-all`.

Must fix:
1. **Cyclopropane** read "tetrahedral 60°". An angle whose two ends are bonded to each other (a three membered ring)
   now reads "tetrahedral, the ring squeezes it to 60°"; the screen reader says "but the three membered ring squeezes
   the angle to 60°"; "?" says why (ring strain). The molecule opens with its ring facing you, so the 60° arc shows.
2. **Labels on balls, sticks and arrows.** `placeLab` now keeps 4 px off true circles: every ball (full radius, not
   0.8 of it), every stick (sampled along its drawn length), the angle's own arc and both reading arrows (head
   included), on both molecules. More candidate spots per label. The card keeps off full balls, sticks and the arc.
   The angle number shows only while at least 30% of its arc is in sight (PCl₅'s "90°" with no arc). The sweep now
   measures these on the real shapes (balls, `.v3-bo` lines, the arc and arrow paths), 2 px clear, and that all 8
   priority numbers show.
3. **A mouse drag selected text.** `user-select:none` on the scene, the labels, the controls and the pins, and
   `preventDefault` on a mouse pointerdown in the picture. The sweep drags across and off the picture and checks the
   selection is empty.
4. **Handedness on phones.** The H is never drawn under 13 px radius, so its letter shows at 11.7 px; the phone stage
   is 600 px tall (was 568) and the two stacked regions have less margin. Each molecule is about 125 px across at 360
   (was about 90 in the sweep's opening state; share of the stage 3.9% to 7.1%).
5. **Open wall on desktop.** The cap was not what bound (ammonia's scale was 116 px per Å against a 210 cap); the
   bounding ball already filled the region, but the region left out the band beside the picker and the buttons, the
   perspective inflated the ball by 25%, and the margin was 6 px. Now on a wide stage the region runs from the top
   edge to just above the bench, the eye is farther away (`persp()`, about 15%), and the cap is 320 (190 on phones).
   Ammonia at 1440 takes 7.7% of the stage (was 5.3%), 256 px tall of 602.
6. **Screen reader text in Name the shape** now says the question ("Name the shape: the ringed atom is Nitrogen in a
   molecule…") and the model is "The molecule to name" until Check; the full line comes back after Check. The sweep
   fails if the live text or the model's name holds the shape, the molecule's name, "lone pair" or "groups".
7. **Stray tool-call text** removed from this brief.

Should fix:
- **Angles.** Measured where a solid value exists, ideal (and labelled "ideal") elsewhere; chair and boat rebuilt
  exactly tetrahedral; see `docs/ochem-needs-author.md` v3-v2-ideal-angles for every value and source. "?" lists
  which are which, explains ethene's and formaldehyde's 117.4° and 116.5° (a double bond pushes harder) and says when
  an atom is drawn at the ideal angle. No Real and Model switch (rule 6).
- **Reduced motion:** changing the molecule now cross fades.
- **Reset view** has `aria-label` "Reset view" (its text is hidden on phones).
- **The picker** may be as wide as the screen less 112 px on phones, so "Phosphorus pentachloride" fits at 360.
- **The tapped atom's letter** is drawn again over its own lobes when a lobe is in front of it.
- **S and R** fade in after the reading arrows draw (340 ms); the cause line waits, dimmed, with them.
- **Test yourself on phones** keeps the question panel above the picture: that is the shared ochem dock layout
  (`studio.add('dock')` in `ochem/assets/tool-shell.js`), so it is logged, not changed.
- **Performance:** the controls' boxes were read every frame (a forced layout per frame), and the Handedness pins were
  placed every frame of a drag; both fixed (controls measured once per layout, pins placed when the drag ends). Paint
  cost at 1440 on Handedness fell from about 9.8 ms to about 2 ms unthrottled. With the CPU throttled x4 on a loaded
  machine (load average 9 to 11): median 16.7 ms everywhere; p95 33 to 50 ms on Shape, 33 to 50 ms on Handedness at
  390 and 50 to 83 ms at 1440 (was 117 to 150 under the same kind of load). Not measured on a quiet machine.

Checks after the round: unit tests, `build-tool-pages --check`, `check-site`, `check-weight --check`,
`build-apcalc --check`, `build-apmacro --check`; the ochem unit tests (71 pass). The sweep, with the new checks (true
shapes, text selection, Reset view's name, the drill's screen reader text), one width per process: 135 states and
about 1610 checks per width, 0 failures at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920 (16,095 checks).
Smallest share of the stage the molecule takes, per width: 7.1, 6.5, 5.9, 5.3, 6.2, 6.5, 6.5, 5.1, 5.5, 5.6% (was
3.8, 3.5, 3.2, 4.6, 5.1, 5.3, 5.2, 4.1, 3.6, 3.9%). Own frames at 390 and 1440, light and dark, reduced motion:
the letters wait for the arrows (opacity 0 while the arrow draws, the line dimmed), no text selected after a drag
across and off the picture, 0 rAF calls in Test yourself after leaving mid turn, no console errors.

Still not happy with: small molecules (water, CO₂) still leave open wall on a wide desktop, because the molecule is
fitted to the ball that holds it at every turn; Handedness at 1440 is the slowest case under load; the 60° label on
cyclopropane at 390 sits beside the ring's far edge (every ring angle is 60°, so it is not wrong).

## Recheck 1 (2026-11-19): BLOCK on two small items, fixed the same day
Merged `claude/tools-v2-all` again (it carries main's #228, the ochem tool frame cleanup) and `origin/main` (already
contained). The v2 viewer kept: #228's edits were to the old viewer's hidden picker chips and step line, which v2
does not have; its inline page styles stay removed and `ochem/assets/tools.css` is the collecting branch's, less the
old viewer rules. `scripts/check-tool-use.mjs` is as on `claude/tools-v2-all`.

Must fix:
1. **Formamide's carbon** was drawn at O=C–N 115.8° and N–C–H 125.0° and read "trigonal planar 116°" as measured. Now
   at the measured O=C–N 124.6°, N–C–H 112.5°, O=C–H 122.9° (Demaison et al.; Hirota et al.), so it reads
   "trigonal planar 112.5°"; the nitrogen stays at the ideal 120° and says so.
2. **The angle number near its arc.** Candidates first within 38 px of the arc's middle or quarter points, outward first;
   if none is clear, farther out with a short leader line from the pill to the nearest point of the arc. The sweep fails
   an angle more than 42 px from its arc without a leader (and a leader on one that is beside its arc).

Should fix: hydronium's sentence in "?" ("This atom"); dimethyl ether at 111.7°; angles are said as a whole number
only within 0.15° of one (0.35° had rounded 111.7° to 112°). The card's leader crossing an H ball is the shared kit's
card, so it is logged, not changed.

Checks: the sweep at all ten widths, one per process: 0 failures (135 states, about 1610 checks each; shares unchanged);
the ochem unit tests; `build-tool-pages --check`, `check-site`, `check-weight --check`.

## Recheck 2 (2026-11-19): BLOCK on two small items, fixed the same day
1. **The hydronium sentence** in "?" showed on dimethyl ether's neutral oxygen too and called hydronium's oxygen
   "positive". It now shows for hydronium's oxygen only, in the reviewer's wording (oxygen holds pairs closer than
   nitrogen; the hydrogens carry most of the charge); the ether's oxygen gets its own line (the methyl groups are bigger
   than hydrogens).
2. **The picker** may be 270 px wide above 640 px (was 230), so "Phosphorus pentachloride" fits (174 px of text in a
   210 px text box at 1024).

Should fix, done: dimethyl ether's note says "the same bent shape as water" (and gives 111.7° against 104.5°); the unused
formamide entry in `ANGLE_OK` is gone; a far angle number now takes the clear spot whose leader is shortest, with
penalties for each ball it crosses and for crossing or running within 18 px of the card's leader (`placeFar()`).

Checks: the sweep at all ten widths, one per process, 0 failures; the ochem unit tests.

