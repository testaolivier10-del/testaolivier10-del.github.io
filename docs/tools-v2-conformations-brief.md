# Tools v2: Organic Chemistry Conformation Lab (brief and build notes)

Status file for the v2 rebuild of `ochem/tools/conformations.html` (rank 2 in `docs/tools-v2-rollout.md`, the second
most opened tool on the site, and the first tool on the kit through the ochem course layer). Standard:
`docs/tools-v2-standard.md`, plus the owner's rules of 2026-11-17 (visual standard, every change animated, picture
and words never disagree, nothing silently dropped). Branch `claude/tools-v2-conformations`. NOT merged: an
independent reviewer runs first.

## The one main idea, per screen
1. **Turn a bond.** Turning a C–C bond changes the molecule's strain energy: eclipsed shapes sit on the peaks
   (torsional strain), staggered shapes in the valleys, and big groups that crowd each other cost extra (steric
   strain), which is why gauche sits above anti and fully eclipsed is the top.
2. **Flip a chair.** A ring flip turns every axial position equatorial and back; a group that ends up axial bumps
   the two axial atoms on its side of the ring, so the chair that puts the big group equatorial wins.

They are two tabs because they are two ideas (standard rule 11). The old tool had them as two modes of one screen.

## Research (rule 10): what exists and what we took
"Seen" below means the page's text was read through a fetch tool, not that its screen was watched or driven; no
claim is made about how any of them looks or feels in the hand. The reviewer's own reading (round 1) added the
Wolfram and Liverpool rows.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| DoITPoMS (Cambridge), "Newman diagrams and conformation energy for butane" (seen) | Drag the Newman projection round, or drag a green dot along the energy graph; a torsion angle readout | The two things a student wants to grab both work, and they are the same value | Butane only; nothing names the shapes or says why the energy is what it is; a bare diagram and a bare plot | Grab the molecule itself; the dot on the curve is a second handle for the same value |
| Newcastle University chemmodels, cyclohexane ring flip (seen) | Click a point on an activation energy diagram to open a Jmol model; frame buttons play the flip; axial H red, equatorial H cyan | The real path (chair, half chair, twist boat, boat) and colour for axial against equatorial | Popups, a Java or slow JSmol viewer, frame buttons instead of the flip itself; no substituent strain, no "which chair wins" | Colour carries axial and equatorial; the flip goes through the real shapes, never a flat ring |
| Mistry, Singh and Ridley 2020, *J. Chem. Educ.* 97, 1157 (abstract seen) | Web tools that link dashed and wedged drawings to 3D models for Newman projections and chairs, with feedback | Students drew Newman projections and chairs more accurately after using them | It is a drawing checker, not an energy tool | The 3D model and the Newman projection are shown together, turning together |
| Reed College list: the "Chairs" app and a model kit video (page seen) | A game: draw the missing groups on the flipped ring; a 4 minute video with a plastic model | "Keeps you moving"; the plastic model is the clearest explanation | Paid app; a video is watching | The ring behaves like a model in the hand: push one end down, then the other comes up |
| Master Organic Chemistry and OpenStax (pages seen) | Text and figures | The numbers: half chair about 10 kcal/mol above the chair, twist boat 5.5, boat 6.5 to 7 | Static | Reference numbers behind "?" |
| Wolfram Demonstrations, "Conformational Analysis of Ethane, Butane and 2-Butanol" (reviewer's reading) | A 3D model, a Newman projection and an energy plot as three linked views of equal weight | The exam picture is not a thumbnail | | Round 1: the Newman inset went from 115 px to 190 px (72 to 120 on a phone) |
| Liverpool / ChemTube3D cyclohexane, Jmol (reviewer's reading) | Play and step through chair, boat, chair; spin the model at any frame | The view can always be turned, so nothing stays hidden | | Tab 2 has the same drag; tab 1's fixed view was re-aimed so no back group hides at a landmark (round 1) |
| MolView, ChemTube3D's own site, PhET, the Mechanisms app (not inspected for this job; no torsion drive or energy curve is known in MolView or PhET, and Mechanisms is an arrow pushing app) | | | | Only the PhET rules already in the standard |

What ours does that none of them do: the strain is drawn on the molecule (which bonds line up, which groups bump),
the shape is named on the picture, one coloured line says why, eight molecules compare on one fixed scale with the
previous hill left as a faint line, and the ring flip is a control you hold, with both chairs and their shares at
its two ends.

## The design
### Tab 1, Turn a bond
- **The picture:** a ball and stick model of the two carbons in a sawhorse view (front carbon on the left), on a
  bench with its shadow, and beside it the energy as a hill rising from the same bench, with a ball that rides it.
  The Newman projection of the same shape is a small inset that turns with the model.
- **Main control:** the model itself. Grab it anywhere, or the knob beside the back carbon's first group, and turn:
  the back carbon follows the pointer round its own axis. Keys on the same control: arrows 5°, Page Up and Page
  Down to the next landmark, Home 0°, End 180°. The ball on the hill is a second handle for the same value (drag
  anywhere on the hill), and the six landmark dots on the hill are marks that are buttons (tap one and the bond
  turns there, animated).
- **Instant response:** the ball rides the hill and its tag shows the energy; an amber plane joins every pair of
  bonds that line up (labelled "torsional strain" at a landmark); two big groups close to each other glow red, with
  a small burst when they collide (labelled "steric strain", or "groups repel" for halogens and OH); the shape's
  name and angle sit under the model ("Gauche 60°").
- **Cause line:** "Bonds eclipsed: torsional strain + CH₃ on CH₃: steric strain → 4.6 kcal/mol, highest";
  "Staggered + CH₃ groups close: steric strain → 0.9 kcal/mol"; "Staggered + CH₃ groups far apart → 0.0 kcal/mol,
  lowest"; between landmarks "Part way → 2.3 kcal/mol".
- **Molecule picker** on the picture (quiet): ethane, propane, butane; 1,2-dichloroethane, 1,2-dibromoethane,
  2-methylbutane; 1,2-difluoroethane and ethylene glycol under "Gauche wins". A new molecule never moves the angle:
  the hill morphs to the new curve and the old curve stays as a dashed "before" line. The energy scale is the same
  for every listed molecule, so the hills compare.
- **Opens** on butane, anti (180°): calm, and a turn either way costs energy.
- **Watch a full turn** (small, secondary): plays 0° to 360° and ends on a takeaway sentence.

### Tab 2, Flip a chair
- **The picture:** one cyclohexane ring as a ball and stick model, seen from the side like the textbook chair, on
  the bench. Axial bonds blue, equatorial bonds green; the bonds change colour as they swing. The two chairs stand
  small at the two ends of the flip control with the share of molecules in each.
- **Main control:** "Ring flip", a knob on the bench. Slide it and one end of the ring swings down (chair, half
  chair, boat), then the other end swings up (half chair, the other chair). Tapping the model, pressing Enter on
  it, or tapping either small chair plays the flip. Dragging the model turns the view (as before).
- **Instant response:** an axial group glows red against the two axial atoms on its side ("steric strain"); the
  group's two positions are named "axial" and "equatorial"; the state reads "CH₃ axial".
- **Cause line:** "CH₃ axial → steric strain 1.7 kcal/mol → 5.4% of molecules"; "CH₃ equatorial → no strain →
  94.6% of molecules"; on the way "Boat → high energy → gone in an instant".
- **Ring picker** on the picture: cyclohexane, methyl, tert-butyl, and the six dimethyl rings. A new ring never
  moves the flip.
- **Opens** on methylcyclohexane with the methyl equatorial.
- **Watch the flip** (small, secondary): plays to the other chair and ends on a takeaway sentence.

### One colour per idea, everywhere (picture, labels, cause line)
Torsional strain amber; crowding (steric strain) red; a relaxed shape and an equatorial bond green; an axial bond
blue; energy in the course colour (the hill, the ball, its tag, the energy pill).

### What is on screen in Explore (counted; Playwright, opening state)
Outside the picture, both tabs: 2 tabs, the purpose line (9 and 8 words), "Show me how", the cause line (3 pills at
the opening, 4 at the wordiest landmark), one small play button. That is 4 controls and about 30 words (34 counting
the tab numbers and arrows). No side panel, no readout cards, no slider outside the picture.
- Tab 1, on the picture: the model with 1 handle; the Newman inset and its caption (2 words); the shape's name
  and angle; the molecule picker; the hill with its two axis titles, the ball and its energy tag, and 7 landmark
  dots. Only while true: "torsional strain", "steric strain" (or "groups repel"), "hydrogen bond", the "before"
  line, the cue (first visit).
- Tab 2, on the picture: the ring; the "Ring flip" control and its name; the two small chairs with one number
  each; the state; "axial" and "equatorial" on one carbon; the ring picker. Only while true: "steric strain", the
  cue.

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or asked.
- **Test yourself:** one dropdown on the stage, "What to practice":
  1. **Where on the curve?** (the old "Predict first", same content and grading): a molecule at one of its six
     landmarks drawn as a full size Newman projection, the ball hidden; tap the peak or valley where it sits. Hint,
     Show the answer, green and red marks, Next one, the running count.
  2. **Find the stable chair** (the old challenge, same generator and grading): a random ring in a random chair,
     shares and strain hidden; flip until the chair shown is the better one, then "This chair is the stable one".
     The shares, the glow and the cause line come back with the verdict.
  3. **Check yourself: 6 questions** (the page's quiz, `OchemToolQuiz` with slug `conformations`, the same
     generator and the same record ids `a:…`, `m:…`, `t:…`). It sits in the side panel with the pictures left live.
- `#predict`, `#chair` and `#check` open Test yourself on that part. The menu's "Check yourself" goes there too.
- Links keep working: `tab`, `tor`, `f`, `b`, `deg` and `ring` are read and written as before.

### What moved
| From the old tool | Where it is now |
|---|---|
| Dihedral slider in the side panel | The model itself (and the same range input behind it for keys and screen readers) |
| Snap buttons Eclipsed, Gauche, Anti | The landmark dots on the hill (tap), Page Up and Page Down |
| The flat Newman projection as the main picture | The live inset; full size in "Where on the curve?" |
| Nine molecule chips, then one select in the side panel | One picker on the picture, grouped |
| "Make your own" molecule builder | "?", "Build your own molecule" (the picture follows every change) |
| The reading (name, kcal/mol, the sentence, the molecule's note, the note on how the curve is drawn) | The name and energy on the picture and the cause line; all of it in "?" ("This molecule", "How to read the picture") |
| "Predict first" inside Newman mode | Test yourself, part 1 |
| Two chairs side by side with a share under each | One ring you flip; both chairs small at the ends of the control, with their shares |
| Strain meter bars, "This chair" and "Flipped" | The red glow, the strain number in the cause line, the shares; the bars' terms are the table in "?" |
| "Flip the ring" button, tap a group to flip | The Ring flip control; tap the model or a small chair |
| Ring preset chips and "Clear all" | The ring picker ("Cyclohexane" is the cleared ring); "Clear all" is also in "?" |
| "Build your own: groups on C1 to C6" | "?", as before |
| "What it costs" panel (three numbers, the verdict, the term table, the position table) | "?", "This ring" |
| "Find the stable chair" inside chair mode | Test yourself, part 2 |
| Check yourself in the "?" sheet | Test yourself, part 3 |

## Decisions made for the owner
The owner does not review each tool, so every call that changed what the tool does is listed here.
1. **Two tabs, not one screen.** Chairs are a different idea from turning a bond.
2. **The main picture is a 3D model, not the Newman projection.** The visual standard asks for the real thing
   drawn as the real thing; a Newman projection is a diagram. It stays on screen as a live inset because it is what
   exams draw, and the drill shows it full size.
3. **Opens on butane at anti** (the old tool opened on ethane at 60°). A plain link with no molecule in it now
   shows butane.
4. **All eight molecules kept** in one picker on the picture. The standard prefers a few preset cases; dropping
   five would have been a silent removal, and one quiet picker costs one control.
5. **Both builders live behind "?".** The molecule builder used to open in the side panel. Extras start hidden.
6. **The energy scale is fixed** (0 to 6.5 kcal/mol) for the listed molecules so hills can be compared; a built
   molecule that goes higher stretches it.
7. **A shape has its name within 10° of its landmark** (the old tool used 4°). The energy tag still shows the
   exact value there, so "Gauche 67°" reads 1.0, not 0.9.
8. **After an answer in "Where on the curve?" the picture stays as asked until Next one.** The old tool gave the
   slider back after an answer.
9. **One ring instead of two.** The old tool drew both chairs the same size. The other chair is now a small
   picture at the end of the control.
10. **The flip can be stopped on the way** and shows a half chair and a boat. The old animation passed through a
    flat hexagon, which is not on the real path. The twist boat is left out of the picture and said so in "?".
11. **"The left chair is the stable one" became "This chair is the stable one"**, since there is one ring.
12. **Check yourself moved into Test yourself.** Same six questions, same ids, same records.
13. **The strain meter's bars are gone from the picture.** One number (the chair's strain) is in the cause line;
    the term by term table is in "?".
14. **No optional teaser** ("Can you ...?") was added. The screen is already full.
15. **Wording fixes while moving text:** anti is called the lowest shape only where the numbers say so (the old
    reading called anti "the global minimum" for 1,2-difluoroethane and ethylene glycol, where gauche is); halogens
    and OH "repel" rather than show "steric strain"; ethane's note now gives both explanations of the barrier, as
    the lessons do; 2-methylbutane's wells are counted ("2 pairs of big groups 60° apart") instead of being called
    gauche and anti; em dashes are out of the notes and the quiz explanations (question ids unchanged).
16. **A share below 0.01% reads "under 0.01%"** (two tert-butyl sized groups used to show "0.00%").
17. **The kit was not forked.** `K.head` and `K.cause` are taken byte for byte from the osmosis branch
    (`claude/tools-v2-osmosis`), so whichever merges second merges clean.

## Accuracy (checked 2026-11-17; ochem content always gets a check)
- **Energies and their order.** Unchanged data. Butane: anti 0, gauche 0.9, eclipsed (CH₃ over H) 3.6, fully
  eclipsed 4.6 kcal/mol, so anti < gauche < eclipsed < syn (unit tested). Ethane 3.0, propane 3.4. OpenStax and
  McMurry print 3.8 and 4.5 for butane's two eclipsed shapes (16 and 19 kJ/mol); Wade and Carey print about 3.6
  and 4.5 to 5. The preset keeps 3.6. See `docs/ochem-needs-author.md`, "conf-v2-butane-eclipsed".
- **Torsional against steric.** Eclipsed bonds: torsional strain. Two big groups 60° apart (gauche): steric
  strain. Fully eclipsed: both. CH₃ eclipsing H is called torsional only (McMurry: "mostly torsional strain").
  Nothing in Explore says what causes torsional strain; the ethane note behind "?" gives both accounts.
- **Where gauche wins.** 1,2-difluoroethane: no crowding is drawn at gauche and the line says "gauche effect";
  ethylene glycol: a dotted line and "hydrogen bond". Anti is never called lowest for either (unit tested).
- **The ring.** C–C stays 1.53 Å through the whole flip (unit tested to 0.012 Å); a flip swaps axial and
  equatorial at all twelve positions and keeps every group's face; axial positions alternate up and down; trans-1,2,
  cis-1,3 and trans-1,4 come out diequatorial from the geometry (all unit tested). The path is chair, half chair,
  boat, half chair, chair, with no flat ring; the real twist boat is left out and said so.
- **A-values and shares.** Unchanged table (Me 1.70, Et 1.75, iPr 2.15, tBu 4.90, Ph 2.80, OH 0.87, OMe 0.75,
  F 0.15, Cl 0.43, Br 0.38) and the flat 1.6 extra for two axial groups 1,3 to each other (open point
  "tools-review-13diaxial"). 1.70 kcal/mol gives 94.6 : 5.4 at 298 K.
- **Reference numbers new on the page:** half chair about 10 to 11 kcal/mol above the chair, boat about 7, twist
  boat about 5.5 (OpenStax Organic Chemistry 4.5; Master Organic Chemistry).
- Not to scale and said nowhere as fact: ball sizes (a group is one ball), the size of the glow, the timing of the
  flip.

## What was built
- `ochem/assets/tools/conformations.js` (rewritten; the torsion data, A-values, `chairEnergy` and the quiz
  generator are the old code), `ochem/assets/tools/conformations.css` (new), `ochem/tools/conformations.html`
  (its inline styles are gone; the kit and the stylesheet come from the builder).
- The ochem course layer's adapter: `OchemStudioKit.kit2(o)` in `ochem/assets/tool-shell.js` (stage, "?"
  reference, Test yourself parts with one picker, the page's quiz as the last part); `kit2: true` in
  `ochem/assets/tools-registry.js`; `scripts/build-tool-pages.mjs` writes the kit's two files and the tool's
  stylesheet into a `kit2` tool's page. No other ochem tool loads the kit or changes.
- `assets/course/tool-kit2.js` and `.css`: `K.head` and `K.cause`, identical to the osmosis branch.
- `ochem/assets/tools.css`: the old conformation rules removed (the Newman drawing's two colours stay).
- `window.OchemConformationModel` (the model with no page behind it) and two tests in
  `scripts/test/tool-content.test.mjs`.

## Checks run (2026-11-17)
`node --test scripts/test/*.test.mjs`, `build-tool-pages --check`, `check-site`, `check-weight --check`,
`build-apmacro --check`, `build-apcalc --check`. Playwright (Chromium, service workers blocked, local server) at
390x844, 768x1024 and 1440x900, light and dark: 238 assertions (opening state, mouse drag and touch drag on the
handle, landmark taps with a mid animation frame, keys, every molecule's words, the flip by keys, by a small chair
and by a tap, the pickers not moving the other control, the three Test yourself parts, Explore getting its state
back, links, no sideways scroll, no console errors), plus 25 more for reduced motion (every change lands at once;
the play buttons step), the tour, both builders, link restore, `#chair`, the menu's Check yourself, and the real
locked state (the gate, no stage). Preview and shots: `/mnt/user-data/outputs/conformations-v2/`.

## Side by side with the flagship, and what I am not happy with
- It is a drawn object with material and depth (shaded balls, sticks, a shadow on a bench), and the strain is drawn
  on it. It is still simpler than the lake: a molecule model and a hill, not a landscape. The hill is a styled
  graph; nothing was added to it that a student could misread.
- **Tab 2 on a desktop has open space** left and right of the ring above the two small chairs. The ring is as big
  as the stage's height allows.
- **In the sawhorse view a back group can sit behind a front atom** (butane at 120°: the back CH₃ is half hidden
  behind the front H it eclipses). That is what eclipsed means, and the Newman inset shows it clearly, but it is
  the weakest frame of tab 1.
- **Two ring carbons overlap a little in every side view of a chair** (the textbook view). The numbers on the
  carbons help; dragging the model turns it.
- The handle sits on the first back group and can cover part of a neighbouring ball at some angles.
- On a phone the scene is tall (680 px for tab 1): the model, then the hill, then the cause line below the fold.
- No real phone, no screen reader pass, no real students. The flagship was not moved onto `K.head` and `K.cause`.
- The shared quiz card (`tool-quiz.js`) still has an em dash in its own intro line; it belongs to every ochem tool
  and was left alone.

## Review round 1 (2026-11-17, `/home/claude/review-conf/REVIEW.md`: blocked on 8 must fix items; all done)
Where this section and the text above disagree, this section is the tool as it is now.

### Must fix
1. **Phone cue cut off.** The cue is made when it shows and points from the side with room (left of the knob when
   the knob is within 190 px of the right edge).
2. **"before: ..." text.** Gone. The dashed line of the molecule before stays.
3. **Newman inset legible.** 190 px on a desktop, 120 px on a phone (letters about 15 px and 9.5 px on screen). Near
   an eclipsed angle the back bonds are drawn up to 16° off their front partners and their labels pushed further
   out, so no two labels touch at any landmark (asserted for butane, 2-methylbutane and 1,2-dibromoethane).
4. **The flip follows the ring.** The glow's strength is now how axial the two bonds are (it fades and grows with
   the swing; biggest step between two 1% frames under 0.2). The ring is called a chair, with "axial",
   "equatorial", "steric strain" and the strain and share in the line, from either end to 13% of the way; from
   there to 87% every frame is "Half chair" or "Boat" with "high energy". No unnamed in between frames.
5. **Science: the gauche CH₃/CH₃ cost on neighbouring ring carbons.** `chairEnergy` adds 0.9 kcal/mol for two
   methyls on neighbouring carbons unless both are axial (OpenStax 4.8). trans-1,2-dimethyl: diequatorial 0.9
   ("Both equatorial → CH₃ groups gauche: 0.9 kcal/mol → 98.55% of molecules", with a faint glow on the two
   methyls), diaxial 3.4, gap 2.5 (OpenStax 2.7). cis-1,2: 2.6 in each chair (OpenStax 2.7), 50 : 50. Other
   neighbouring pairs are not costed: `docs/ochem-needs-author.md`, "conf-v2-vicinal". Re-verified: the Check
   yourself generator never reads `chairEnergy` (A-values and the torsion table only; 300 draws per kind in the
   unit test, one right answer each); the chair drill's winner is unchanged for every pattern (only Me/Me
   neighbours change, and cis-1,2-dimethyl is still skipped as a tie); its feedback no longer says "pays nothing"
   for trans-1,2-dimethyl. Share numbers that changed: trans-1,2 (was 99.68%, now 98.55%); cis-1,2 unchanged at 50.
6. **2-methylbutane counts its pairs.** "Staggered + 1 CH₃ pair close → 0.0 kcal/mol, lowest" (a plain pill, no
   strain word) at 180° and 300°; "Staggered + 2 CH₃ pairs close: steric strain → 0.9 kcal/mol" at 60°. The
   picture's "steric strain" label follows the same test.
7. **Nothing under the inset.** The model has its own region to the right of the inset (asserted: no ball of the
   model overlaps the inset at any landmark of three molecules).
8. **Phone stage 120 px shorter** (560 px; 520 for tab 2). The inset sits beside the model, not on its own row; the
   cause line is on screen at the opening of an 844 px phone.

### Should fix
- "highest" and "lowest" only where the number shown is the extreme (within 0.05 kcal/mol).
- The 0° dot from above 180°: the bond goes on round to 360° and the ball then wraps to the 0° end; a shape left at
  360° (the end of Watch a full turn, the right edge of the hill) is named "360°".
- **The view.** The model is now seen exactly side on to the bond (no elevation), which puts the hidden direction
  half way between two landmarks: at every landmark each back group is at least 30° off it, so none is hidden.
  The knob sits on the far side of its group from the front carbon, so it never lands on the front atoms.
- Molecule change: the cause line dims and the name is held back while the hill morphs, then both say the new
  molecule.
- Reduced motion: every change still lands at once, and the picture now cross fades in over 0.18 s. No still mark
  was added.
- The ring's focus box stops at the bench, clear of the state label.
- **Visual level.** Tab 1: the model stands on the bench with its shadow under it and fills its half of the stage
  beside the inset. Tab 2: the two end chairs are twice the size and stand on the bench at the ends of the control
  with the ring between them, so the three fill the width.
- Share numbers are in the interface face.
- **F is 0.25** (was 0.15), the value the lessons print. The unit test's reviewed table changed with it.
- CLAUDE.md's "11 rules" line is left for the osmosis branch, which changes that same line.

### Removed
The "before: ..." text; the "Ring flip" pill (the control has the two chairs at its ends; its accessible name
stays); the third in between pill ("gone in an instant"); the 360° landmark button (the tick stays).

### Decisions made for the owner in this round
18. Two methyls on neighbouring ring carbons cost 0.9 kcal/mol unless both are axial.
19. F's A-value is 0.25, as in the lessons.
20. The tab 1 view is exactly side on, and cannot be turned by the student (a second control was not added).
21. "Half chair" and "Boat" each name a stretch of the flip (13% to 37%, 37% to 63%), not one frame.
When `docs/tools-v2-owner-log.md` reaches main with the osmosis branch, decisions 1 to 21 go there as one line each.

### What is on screen now (Explore, opening)
Outside the picture: as before, with 2 pills on the way through a flip. Tab 1: picker, model and knob, inset and
caption, the name and angle on the bench, hill with 2 axis titles, ball and tag, 6 landmark dots. Tab 2: picker,
ring, the control, the two chairs with a share each, the state on the bench, "axial" and "equatorial".

### Checks run (this round)
Rebased on `origin/main` (osmosis, PR #225, was not merged yet; `tool-kit2.js` and `.css` are still byte for byte
the osmosis branch's). Unit tests, `build-tool-pages --check`, `check-site`, `check-weight --check`, the macro,
calculus and environmental science build checks. Playwright: the 238 and 25 assertions of the first build, plus 214
new ones, one block per must fix item (`/home/claude/conf-work/test3.mjs`). Preview and shots regenerated.

### Still not happy with
- Butane at 120° and 240°: the back CH₃ is in view but partly behind the front H it eclipses.
- Tab 1's model is limited by the width left beside the 190 px inset, so there is open wall above the inset.
- No still mark with reduced motion; no real phone, screen reader or students.

## Review recheck 1 (2026-11-17, "Recheck 1" in the review: the eight items closed; blocked on two new small ones)
- **A. A ring label under an end chair's box.** The selection box is now drawn in the picture (under every label),
  is narrower, and the ring keeps 96 px of room on each side for its own labels, which are also held between the
  two boxes. Asserted at the opening and for both chairs of four rings.
- **B. The stage jumped under the finger on a phone.** One appended rule in `assets/course/tool-kit2.css`: at phone
  width `K.cause` keeps the height of two rows of pills (70 px), for every v2 tool. Asserted with a real touch drag
  at the scrolled end of the page, on both tabs, at 844 and 640 px of screen: the chain goes between one row and
  two while the cause line's height, the page's height, the scroll and the stage's top stay the same. The phone
  stage is 8 px shorter (552) so the taller line is still on screen at the opening. The kit file now differs from
  the osmosis branch's by that one appended rule (a clean append unless osmosis also adds at the end).
- **Both gauche partners in view.** A ring with a group on C2 or C3 (the far side) is seen from a little higher
  (the view glides there with the ring's fade). Once the student has turned the view it is left alone.
- **The ring in "Find the stable chair".** On a desktop a drill's stage is kept to 500 px and the two end chairs are
  smaller there, so the ring is not at the foot of a tall empty wall.
- **Phone opening.** The shape's name moved to the picker's row, top right, where the cue never covers it.
- **Molecule change, re-tested.** Mid morph: the line is dimmed and still says the old molecule, no name and no
  strain label are drawn; after 0.42 s both say the new molecule (asserted).
- Decision 22 for the owner: the ring's default view depends on where its groups are.
- Checks: unit tests, `build-tool-pages --check`, `check-site`, `check-weight --check`, the environmental science
  build check (it loads the kit's stylesheet); Playwright 238 + 25 + 233. Preview and shots regenerated.

## Review recheck 2 (2026-11-17, "Recheck 2" in the review: three must fix items, two of them caused by recheck 1)
Fixes had been checked by spot shots, and each one broke another width. This round the check is a sweep, kept in
the repo: `node scripts/tools-v2/conformations-sweep.mjs` (its header lists what it asserts). Every molecule at
every landmark and four angles between, every ring in both chairs and at four points of the flip, and four rings of
the drill, at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920 px: **1380 states, 11054 checks, 0 failures**.
Smallest share of the stage the model takes, per width: 9.1, 11.5, 11.8, 8.4, 11.7, 10.9, 8.3, 8.7, 11.1, 16.2%.
The first run of the sweep found 372 failures at three widths, most of them not in the review.

### What the sweep made me change
- **Sizes come from what is drawn.** The ring is fitted from every ball it draws in both chairs and on the way
  between (`fitRing`), in the current view, and stood on the bench; the bond model is fitted per molecule from its
  own groups through a full turn, with the handle's size in px (`bondReach`, `bondFit`). Nothing is sized from a
  guessed constant any more, so nothing is clipped at any width (must fix 1; also a back group and the handle that
  ran off a phone's right edge at 240° to 300°, which nobody had reported).
- **Names are placed, not positioned** (`placer`): each takes the first of its candidate spots that is inside the
  picture and clear of every name, box (pickers, inset, end chairs, handle) and group's letters already there; one
  with no clear spot is left out. This replaces every hand tuned offset.
- **Layouts by stage width.** Tab 2: from 1100 px the two end chairs stand big beside the ring; below that they are
  small on the bench with the state on its own row under the control, so the ring keeps the stage (must fix 2: at
  768 the ring is the largest object again). Tab 1: from 1000 px model and hill side by side; below that the hill
  is under the model on tablets as well as phones (the tablet stage is 620 px tall for it).
- **The bond model is on a stand** (a base on the bench and a post to the front carbon), so it is not left hanging
  over its shadow when the back groups turn upward. Ethane is now drawn as big as its region allows (it was sized
  for groups it does not have); the model glides to its new size with the molecule change.
- **Cause line, two rows at 360 px** (must fix 3): "Eclipsed: torsional strain" + "CH₃ on CH₃: steric" (or
  "repel"), "strain 1.7 kcal/mol", "gauche: 0.9 kcal/mol", "almost no molecules" / "almost all molecules" at the
  extremes, mixed states over seven letters read "1 axial, 1 equatorial"; pills are a size smaller at 420 px and
  under. Screen readers still get the long form. Asserted in the sweep at every state, and by a real touch drag at
  the scrolled end of the page on both tabs at 390x844, 390x640 and 360x740 with trans-1,2-dimethyl.

### Should fix
- **The drill and Explore use the same gauche cost.** Any two groups on neighboring carbons now pay the flat 0.9
  kcal/mol unless both are axial (it was CH₃/CH₃ only), so no trans-1,2 diequatorial chair "costs 0.00". Unit
  test: for every ring the drill can draw (more than 500 that are not ties), the better chair is the one it was without the term. Logged as
  "conf-v2-vicinal" (decision 23 for the owner).
- Focus box: it is the ring's own fitted box now, and the names are placed outside it.
- "iPr" behind an H: a group's letters are drawn after the atoms just in front of it.
- Ring picker on a phone: wide enough for "trans-1,2-dimethyl".

### Checks
Unit tests, `build-tool-pages --check`, `check-site`, `check-weight --check`; the sweep; Playwright 238 + 25 + 240.
Preview and shots regenerated; contact sheets of the sweep looked at (`/mnt/user-data/outputs/conformations-v2/sweep/`).

### Not happy with
- At 1280 to 1440 px the ring between the two big end chairs has open wall above it (it is limited by the width
  left between them). The sweep's floor for "largest and at least 7% of the stage" passes; it is not the flagship.
- Below 1000 px tab 1's model has open wall to its right.
- A name with no clear spot is dropped (the cause line still says it); on a 360 px phone names can sit on hydrogens.

## Review recheck 3 (2026-11-18: layout passed; one science item) and the move to `claude/tools-v2-all`
- **Polar neighbors are not costed.** The flat 0.9 kcal/mol gauche cost applies only when at least one of the two
  neighboring groups is a carbon group (CH₃, Et, iPr, tBu, Ph). Two heteroatom groups (F, Cl, Br, OH, OMe) get no
  cost and no glow; the term table in "?" has one line for them ("two polar neighbors, not estimated here (dipoles
  and hydrogen bonds decide)", n/a); where that leaves a drill chair at 0.00 the feedback says "by A-values it
  costs nothing. The two polar neighbors are not estimated here." Unit tested: trans-1,2 F/F, OH/OH, Cl/Cl
  (diequatorial 0, diaxial the two A-values), CH₃/CH₃ and CH₃/OH (0.9), and the drill's winner for every ring it
  can draw. This replaces decision 23.
- **First visit cues** are placed by measurement: the first side of the handle where the whole bubble is inside
  the picture and covers no name, number, inset or end chair. The bench under the small end chairs is 16 px
  deeper so the cue has a clear row. The sweep now has a first visit state for both tabs at every width.
- **Small end chairs** (below 1100 px) carry no letters; the sweep checks letters stay on their ball.
- **Branch.** Nothing merges to main until every tool is done. This branch now sits on `claude/tools-v2-all`
  (osmosis and `docs/tools-v2-builder-brief.md` included) as one commit series; the kit is that branch's plus the
  one appended `K.cause` rule. Decisions are in `docs/tools-v2-owner-log.md` (23 lines).
- Sweep: 1400 states, 11094 checks, 0 failures.
