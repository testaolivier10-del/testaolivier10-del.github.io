# Tools v2: Organic Chemistry Arrow Pusher (brief and build notes)

Status file for the v2 rebuild of `ochem/tools/arrow-pusher.html` (free; rank 18 in `docs/tools-v2-rollout.md`, group B
"builders and drawers"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-arrow-pusher`, cut from `claude/tools-v2-all` (with Resonance v2 merged). NOT merged: an independent
reviewer runs first. The owner showed this tool's old screen as the example of "way too much going on".

## The one main idea (one screen)
**In a mechanism, curved arrows move electron pairs, and those moves make and break real bonds, one step at a time.**
A nucleophile's lone pair becomes a new bond to the electrophile; a bond's pair leaves with the leaving group; a proton
moves from one base to another. Atoms and bonds actually change, intermediates appear, species split and join.

Different from Resonance (atoms never move, no σ bond changes, the forms blend): here σ bonds break and form and the
pieces move. The same board and the same drag, so the two tools feel the same.

## Research (rule 10): what exists and what we took
"Read" means the page's text was fetched and read; none of the apps was run in a browser for this job.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| Mechanisms (Alchemie), App Store text and Scott, "Is the pen mightier than the app" (Strathclyde, 2021, read) | Drag electron pairs from a bond or atom to another; bonds form as they land; feasibility feedback in real time | With the app students tried several mechanistic steps and used the feedback; on paper they considered one path and drew arrows without the chemistry | Some clicked through to the answer; both groups struggled when the hydrogens an acid–base step needs were not drawn | Drag the pair itself; instant, chemical feedback on the molecule; every hydrogen a step moves is drawn as a ball; Test yourself checks a whole step, so clicking through does not work |
| OrgChem101 "Mastering the Arrows" (uOttawa; Flynn et al., Chem. Educ. Res. Pract. 2020, read) | Videos that pause, a drawing tool for arrows and products, practice with instant feedback, "mapping" (number and highlight atoms and electrons) | Instant feedback was the most praised part; drawing products improved most | "The draw the arrow tool was hard to use"; long arrows hard to read | A forgiving drag (snaps to the nearest target that makes sense, a target almost under the finger is taken as meant); the product is drawn for the student from the arrows, step by step, which is the mapping done for them |
| Oxford "Interactive organic mechanisms" (curly arrow tutorial, read; Flash, not runnable) | SN1, SN2, E1, E2 with quizzes | A short fixed set of core mechanisms | Flash, gone | A short curated Explore set of core mechanisms |
| Resonance v2 on this branch (built and reviewed here; run) | Drag a lone pair or π bond on a ball and stick molecule; held push at ten electrons; spring back with the reason; forms row | Passed review; the drag, held state and spring back test well | Atoms never move (right for resonance, wrong here) | The whole board, shared (`ochem/assets/push-board.js`), with σ bonds as sources, pieces that move, a steps row in place of the forms row |
| Marvin JS and ChemDoodle electron flow arrows (read for Resonance) | Arrow from a source to an atom or bond midpoint, drawn as an automatic curve | Snap to atom or bond midpoint; the student never shapes the curve | No teaching feedback | Kept from Resonance |
| The old LevlPrep Arrow Pusher (run) | Three modes (Ready-made, Build, Challenge), 18 molecules in chips, tap source then tap target, a product pane beside, notes, a bookkeeping table, a mechanism strip | chem-core applies arrows by valence rules, so it can say why an arrow cannot happen; the challenges check by structure | 29 controls on one screen; the product beside the drawing instead of the molecule changing; nothing moves | The engine, its reasons, the 7 challenges and their checking, the 18 molecules and nudges, the quiz, all ids |

What ours does that none of the above do: the student's own arrows change the molecule in place (bonds break and form,
pieces drift apart or come together, charges move), and the row underneath shows where that step sits in the whole
mechanism.

## The design (Explore, one screen)
- **The board, the biggest thing:** the current structure as a ball and stick model on a lit wall (shared with
  Resonance): movable electrons violet (each lone pair two dots in a glow, each π bond a violet second stick), σ bonds
  grey sticks that can be grabbed too, a charge as a red or blue glow with a badge.
- **The main control is the molecule.** Grab a lone pair, a π bond or a σ bond and drag it to where its electrons go:
  the pair rides the finger, the curved arrow is drawn behind it, the nearest atom or bond that makes sense lights. On
  release the electrons fly along the arrow, the bonds and charges change, then the pieces move: a group that broke
  away drifts off, a new bond pulls its partner in. Tap then tap and the keys work too (as in Resonance).
- **Concerted steps:** a first push that leaves an atom past its octet (hydroxide onto the carbon of bromoethane: C at
  10 e⁻; a base onto a proton: H at 4 e⁻) is held: the arrow stays, the atom gets an amber ring and "10 e⁻", the cause
  line says "C: 10 e⁻ → a bond to C must break". The second push completes the step.
- **A push that cannot happen** springs back along a red arrow with the reason in a few words ("C has no lone pair",
  "Not connected", "One bond used twice"). A legal push that rarely happens is made, with a note pill ("1° C⁺: rarely
  forms", "O⁻ leaving: poor").
- **The steps row** on the tray: the mechanism's states as small line drawings (start, intermediate, product), an arrow
  between cards, the one shown framed in violet. A tap plays the textbook arrows to that state.
- **Names on the picture:** at the start the roles (Nucleophile, Electrophile, Leaving group; Base and Acidic H for the
  proton transfer), after a step each species by its formula (C₂H₆O, Br⁻), the count on an atom that is over.
- **Cause line:** "Move a pair → a bond forms or breaks" at the start; after a step the moves and what they made ("New
  O–C bond → C–Br breaks → Ethanol + Br⁻"); a takeaway when the mechanism's last state is reached ("SN2 is one step: a
  bond forms as the old one breaks.").
- **On the picture, quiet:** the mechanism picker and Undo. Purpose line: "Push electrons: bonds break and form, step
  by step." First visit cue: "Drag this lone pair" at hydroxide (shorter words on a narrow picture).
- **One colour per idea:** electrons and arrows violet; negative red, positive blue; an atom past its octet amber; a
  product green; a start grey; an intermediate violet.

### Five mechanisms in Explore (curated)
SN2 (bromoethane + hydroxide, one concerted step), Proton transfer (acetic acid + hydroxide), SN1 ionization
(2-bromopropane), HBr addition (propene + HBr: protonation to the secondary carbocation, then bromide), Acyl
substitution (acetyl chloride + methoxide: tetrahedral intermediate, then chloride leaves). Together: nucleophile to
electrophile, a leaving group leaving, a proton transfer, a π bond as the nucleophile, two step mechanisms with an
intermediate. Opens on SN2.

### What is on screen in Explore (counted; Playwright, opening, 1440 and 390)
Outside the picture: the purpose line (8 words), "Show me how", the cause line (2 pills, 6 words). One control outside
the picture. On the picture: the picker, Undo, the board (one focusable control), one button per state card (2 for
SN2), 6 names (3 roles, "Mechanism steps", "start", "product"), the cue on a first visit. No side panel, no readout
cards. The old screen: 29 controls.

### Explore against Test yourself
- **Explore:** free play as above on the five mechanisms. Nothing graded.
- **Test yourself**, one dropdown "What to practice":
  1. **Draw each step** (the old Mechanism challenge): the 7 challenges with the same ids (`sn2`, `acid-base`, `sn1`,
     `protonate`, `aldol`, `acyl`, `claisen`) in the picker on the stage. The student drags the step's arrows (they stay
     drawn on the unchanged structure, as on paper; only an arrow that cannot start or go where it goes springs back),
     then Check step. Right: the electrons move, the pieces move, the card is revealed. Wrong: the same checking and
     words as before ("Your arrows: … Not part of this step: … Still needed: something to happen at …"), unwanted
     arrows red. The same hint ladder and Show one arrow after a wrong check, the step marker, Show the target, Start
     over, the finished card (Next challenge, Try it again, Full explanation arrow by arrow, Check yourself, the lesson).
  2. **Any molecule** (the old Ready-made and Build your own): the 18 molecules in their four groups with their nudges
     ("Need a nudge?"), pushed freely; every real step kept in the row ("Your steps", tap a card to go back), the old
     notes in the panel (What you drew, Looks right, Worth a second look, Legal, but). Build your own (from "?") loads
     here as "Yours".
  3. **Check yourself: 6 questions**: the page's quiz, `OchemToolQuiz` slug `arrow-pusher`, the same generator and ids
     (`<molecule>:fc:<atom>`, `<molecule>:ec:<atom>`).
- Links keep working: `?start=<id>` (an Explore mechanism opens Explore; any other of the 18, e.g. `e2-butane` from the
  Reaction Predictor, opens Any molecule on it), `?chal=<id>` opens Draw each step, `?build=` loads the builder and Any
  molecule. `#chal`, `#any`, `#check` open Test yourself there.

### What moved
| From the old tool | Where it is now |
|---|---|
| Three modes (Ready-made, Build your own, Mechanism challenge) | Explore (5 mechanisms); Test yourself: Draw each step, Any molecule; Build your own in "?" |
| 18 molecules in chip groups | Any molecule's picker (same groups, ids, nudges) |
| Tap source, tap target on the molecule editor | Drag the electrons on the board (tap then tap and keys kept) |
| "What that produces" pane beside the drawing | The molecule itself changes; species named on the board |
| "Use this as the next step" and the mechanism strip | Steps happen as they land; the row (Your steps) goes back to any step |
| What happened notes, Legal but, commentary | Any molecule's panel; short pills in the cause line |
| Electron bookkeeping table | "?", Formal charges on the board (live) |
| Need a nudge? | Any molecule, the hint button |
| See it in 3D | "?", a link under the mechanism |
| Challenge: Check, hints, Show one arrow, Show target structure, step marker, finished card | Draw each step, same |
| Send to another tool | "?", Build your own, and the … menu |
| Check yourself | Test yourself part 3 |

## Decisions made for the owner
Each is also one line in `docs/tools-v2-owner-log.md`.
1. One screen in Explore; five curated mechanisms; the 18 molecules move to Test yourself, Any molecule.
2. The board, drag, snapping, held push and spring back are Resonance's, shared (`push-board.js`, `push-board.css`).
3. σ bonds can be grabbed (they are what breaks in a mechanism).
4. A first push that overfills an atom is held until the push that makes room.
5. Atoms move after a step (pieces translate; a sketch, no angles); SN2 inversion is not drawn and "?" says so.
6. A steps row (start, intermediate, product) replaces the product pane; a tap plays the textbook arrows.
7. In Draw each step the arrows are drawn and then checked together (Check), as before; no live product.
8. HBr is drawn beside the CH₂ end, so the textbook arrow is Markovnikov; grabbing the π bond at its other end attacks
   with that end (and gets the "1° C⁺" note).
9. Role names on the start (Nucleophile, Electrophile, Leaving group; Base and Acidic H for the proton transfer).
10. Takeaway sentences shortened to two lines on a phone; the full sentence is in "?".
11. Hydroxide in the SN2 molecule drawn a little closer and higher (room for the cue on a phone).
12. On a narrow card, species are stacked in the small drawing.

## Accuracy (checked 2026-11-18; ochem content always gets a check)
- **Engine unchanged:** chem-core applies the arrows (valence rules); the 7 challenges and their checking unchanged
  (unit tested as before); the quiz unchanged.
- **Explore paths:** every step of every mechanism applies with no error, changes the structure, keeps every atom within
  its octet (except the carbocations the steps are about), and its first arrow alone is held where the step is
  concerted (unit tests "arrow pusher v2").
- **Names:** Bromoethane + HO⁻ → Ethanol + Br⁻; Acetic acid + HO⁻ → Acetate + water; 2-Bromopropane → Carbocation + Br⁻
  (secondary); Propene + HBr → Carbocation + Br⁻ → 2-Bromopropane; Acetyl chloride + CH₃O⁻ → Tetrahedral intermediate →
  Methyl acetate + Cl⁻. Checked.
- **Markovnikov:** the textbook arrow gives the secondary cation (unit tested); the other end gives a primary cation,
  flagged.
- **Words checked:** "C: 10 e⁻ → a bond to C must break", "H: 4 e⁻", "SN2 is one step: a bond forms as the old one
  breaks", "A pair takes the H; the old bond's pair stays behind", "SN1 starts with the leaving group going on its
  own", "The + lands on the more substituted C; Br⁻ bonds there", "Add, then eliminate: C=O opens, then closes and Cl⁻
  leaves". No dashes as punctuation in the tool's copy; the engine's sentences are shown with them replaced.
- Not to scale and said so in "?": ball sizes, positions after a step (no bond angles, no inversion).
- Open points: `docs/ochem-needs-author.md`, "Arrow Pusher, tools v2".

## What was built
- `ochem/assets/push-board.js` and `ochem/assets/tools/push-board.css` (new, shared): the board's drawing, arrows,
  motion, drag, snapping, spring back, the small drawings, the colours. Resonance now uses them (its own drawing code
  removed; its sweep passes unchanged at 390 and 1440). `draw()` gained `pieces` (rigid groups that slide) and σ bond
  sources; `css: ['push-board']` in the registry makes the page builder link the shared stylesheet.
- `ochem/assets/tools/arrow-pusher.js` (rewritten; the bank, the challenges, their checking, plausibility and the quiz
  are the old code), `ochem/assets/tools/arrow-pusher.css` (new), the page (inline styles and the molecule editor
  script gone), `kit2: true` in the registry. `window.OchemArrowModel` (paths, outcome, completion, relax, words) and
  `window.OchemArrowChallenge` (as before).
- `ochem/assets/tools.css`: the old arrow pusher rules removed (about 70).
- `scripts/tools-v2/arrow-pusher-sweep.mjs`; unit tests in `scripts/test/tool-content.test.mjs` (4 new; `push-board.js`
  added to its core files).

## Checks run (2026-11-18)
- Sweep, one width per process at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920: 67 or 68 states and about 800
  checks per width, **0 failures** (the last run after the last change). Smallest board share 5.7% (600) to 10%.
- Unit tests (tool-content 45, ochem-tools-upgrade, ochem-url-compat, tool-use, ochem-premium, question-ids,
  synthesis-trainer: 110 pass), `build-tool-pages --check`, `check-site`, `check-weight --check`.
- Playwright: mouse and real touch (CDP) drags at 390 and 1440, light and dark, the held push, the step, replays of
  every mechanism, every challenge right and wrong, Any molecule, reduced motion (the sweep), no console errors.
  Performance, CPU x4, a full drag, a held push, a step and a two step replay: median 16.7 ms, p95 50 ms at 390 and
  1440 (machine load average about 9 from other sessions).
- Resonance's sweep after the shared board: 0 failures at 390 and 1440.

## What I am not happy with
- **Wide two molecule scenes are small on a 360 px phone** (Claisen, aldol: two species side by side; the board is
  limited by width). Readable and draggable, but small. Turning the scene a quarter turn on a phone is in the code
  (`V()`) but only when it gains 30%, which these do not.
- Positions after a step are translations of pieces: a bond angle can look odd (OH on the left of the carbon after
  SN2, no inversion).
- p95 frame time sits at the 50 ms bar under load; spikes are the first targets judged at the start of a drag
  (completion search) and the redraw at the end of a step.
- No real phone, no screen reader pass, no real students.
