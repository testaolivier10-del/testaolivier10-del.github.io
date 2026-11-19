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
</content>
</invoke>
<invoke name="Bash">
<parameter name="command">cd /home/claude/wt-viewer-3d && git add docs/tools-v2-viewer-3d-brief.md && git commit -qm "Tools v2 viewer-3d: design brief

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011LrYU6oPHBYNE4ERGyPxWg" && git push -q -u origin claude/tools-v2-viewer-3d 2>&1 | tail -1