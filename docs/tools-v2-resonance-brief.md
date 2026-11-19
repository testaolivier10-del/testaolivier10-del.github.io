# Tools v2: Organic Chemistry Resonance (brief and build notes)

Status file for the v2 rebuild of `ochem/tools/resonance.html` (free; rank 17 in `docs/tools-v2-rollout.md`, group B
"builders and drawers"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-resonance`, cut from `claude/tools-v2-all`. NOT merged: an independent reviewer runs first.

## The one main idea (one screen)
**Moving electrons turns one resonance form into another; the real molecule is the blend of them, closer to the
forms that are better.** A curved arrow starts at a lone pair or a π bond and ends one place over; the atoms never
move. Forms with full octets, fewer charges and a negative charge on the more electronegative atom count for more.

One screen, not tabs: the forms, their ranking and the hybrid are the same idea seen three ways, and each is a
consequence of the move the student makes (rule 11).

## Research (rule 10): what exists and what we took
"Read" below means the page's text was fetched and read, not that the program was opened and driven. None of the
apps below was run in a browser for this job.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| Mechanisms (Alchemie), App Store page and Fisher, Gerdon et al., NSF report on its usability study (read) | The student drags the electron pair itself with a finger; bonds form when it lands. No curved arrows on screen (a finger hides the arrowhead, so the motion is shown instead). A move that is not allowed snaps back with a sound; some wrong moves open a hint saying why. Goal card, Expert mode without hints | Immediate assessment of each move "best supported experimentation"; students tried several paths and used the feedback | Hints were missed when not prominent; students moved back and forth a lot; no arrows means the exam notation is never practised | Drag the pair itself; snap back on a wrong move with the reason on the picture and in the cause line, at once. We also draw the curved arrow behind the moving pair, because the arrow is what exams ask for |
| Marvin JS electron flow arrows (ChemAxon help pages, read) | Pick the arrow tool; start on a lone pair, a radical or a bond; end on an atom, a bond next to the source (the head snaps to the bond's midpoint) or a new bond. Atoms with electrons highlight on hover; a grey preview arrow follows the cursor; clicking the source makes its dots bigger to grab | The snap to a bond's midpoint and the live preview | Invalid arrows are simply not allowed, with no reason; a tool mode to pick first | The arrow head snaps to the nearest atom or bond midpoint, with that target lit; a preview arrow follows the finger; the sources are big targets. Unlike Marvin a wrong move is allowed and explained |
| ChemDoodle Web Components "Pusher" (docs, read) | An arrow is defined by a source (atom or bond), a target (atom or bond) and an electron count, and drawn as an automatic Bézier | The arrow shape is automatic; the user never shapes a curve | Programmatic; no teaching feedback | The arrow's curve is drawn for the student from its two ends (they never shape it) |
| Ketcher help (read) | Structure editor; a reaction arrow only. A wrong valence is underlined in red | Valence errors shown on the atom | No electron flow arrows at all | A problem is drawn on the atom (an amber ring and "10 e⁻"), not in a box |
| MolView FAQ (read) | 2D sketcher with an Electron Dots tool; mechanisms "not yet supported" | Lone pairs as dots you can see | No arrows, no resonance | Lone pairs are always drawn as dots |
| The old LevlPrep Resonance Explorer | Tap a lone pair or π bond, then tap where it goes; "Add it to the collection"; forms found as cards; ranking and the averaged charge in panels | The engine (`resonance-engine.js`) knows every form, so it can say "2 of 5" and explain a wrong move | A task (find the forms), not play; 26 controls; the hybrid hidden until every form is found | The engine, its reasons and its counts; tap then tap stays as a second way in |
| OrgChem101 "Mastering the Arrows" (not reached) | | | | |

What ours does that none of them do: the student pushes the electrons and sees, on the same picture, the new form,
where it ranks among all the forms, and the real molecule they blend into.

## The design (one screen)
- **The picture, three parts on one stage.** (1) **The board**, the biggest thing: the current form drawn as a ball
  and stick model on a lit wall (shaded balls with shadows, grey σ sticks), its movable electrons in violet (each
  lone pair two dots in a soft glow, each π bond a violet second stick), a charge as a red or blue glow with a badge.
  (2) **The real molecule** on a card beside it (under it on a phone): the same skeleton with a soft violet band
  along every bond that is double in some forms, a glow on every atom that carries charge in some forms (large where
  a major form puts it, small where only a minor one does) and the share written beside it (−½, −⅔ when every form
  is equal; δ− or δ+ otherwise). (3) **The forms row** on a tray along the bottom: every form of the species as a
  small line drawing, tagged major, minor or equal; minor forms drawn smaller; the one on the board framed in violet.
- **The main control is the molecule itself.** Grab a lone pair (or the atom holding it) or a π bond and drag it:
  the pair rides the finger, a curved arrow is drawn from where it was, and the nearest atom or bond that makes sense
  lights (forgiving: within reach the arrow lands on a target that gives a form; a target almost under the finger is
  taken as meant). On release the electrons glide into place, the bonds and charges change, the row frames the new
  form. Tap a pair then tap where it goes also works; keys too (arrows choose what to move, Enter, arrows choose
  where, Enter; Backspace undoes; Esc cancels).
- **Two arrow forms.** A first push that would give an atom ten electrons is held: the arrow stays, the atom gets an
  amber ring and "10 e⁻", the cause line says "move a π bond off C". The second push completes the form.
- **A push that is not resonance** (breaks or makes a σ bond, starts where there are no electrons, a bond not next
  to the source) springs back along a red arrow, and the cause line says why in a few words ("New bond to H → that
  is a reaction"). The engine's full sentence goes to screen readers and to "?" ("The last push that sprang back").
  A legal structure the engine does not count is drawn and named "negligible form".
- **Cause line** (colored pills, one color per idea): opening "Lone pair + π bond → one place over → a new form";
  after a push "2 pairs moved → − on CH₂ → minor: − on C, not O", "π bond moved → + on CH₂ → equal form",
  "2 pairs moved → − on O, + on N → minor: more charges"; held "C: 10 e⁻ → move a π bond off C". For species with
  three or more forms a takeaway when every one has been reached ("Every form reached. The real molecule blends them,
  mostly the major ones.").
- **On the picture, quiet:** the molecule picker (13 species in two groups, as before) and Undo. Tapping a form in
  the row plays the arrows that reach it from the board (the student watches the arrows they could have drawn).
- **One color per idea:** movable electrons and arrows violet; negative red, positive blue (an electrostatic map's
  colors); an atom without its octet amber; major or equal green; minor grey.
- **Opens** on acetate (the old default). Purpose line: "Push electrons: the forms blend into one real molecule."
- **First visit cue:** "Drag this lone pair" at the pair the first move starts from, placed where it covers no ball,
  name or control (shorter words on a narrow picture, or the π bond, if it must).

### What is on screen in Explore (counted; Playwright, opening, 1440 and 390)
Outside the picture: the purpose line (9 words), "Show me how", the cause line (4 pills, 10 words). One control
outside the picture. On the picture: the picker, Undo, the board (one focusable control), one button per form (2 for
acetate), 4 names ("Real molecule", "Resonance forms", "equal", "equal"), the cue on a first visit. No side panel,
no readout cards. The cause line is on screen at the opening of a 390 x 844 phone (bottom at 780 px).

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or counted.
- **Test yourself**, one dropdown "What to practice":
  1. **Find every form** (the old Find the forms): the board starts on the drawn structure, the row shows only the
     forms found ("?" for the rest), the side panel counts ("1 of 5 forms found. 4 left to find."), the same two
     hints and "Show me one I'm missing" after one real push (it now plays the arrows to the form it reveals), Start
     over, and the finished card ("All 5 forms of Phenoxide.", Next molecule). The real molecule appears on the
     picture when the row is full; until then the board has its room.
  2. **Which is more stabilized?** (the old Compare two): two pickers, "Call it first" (either species or About the
     same), then the rule that decides it with the old sentences, a small table (forms, equally good, charge roams
     over), Try another pair. On the picture both species are drawn; after the call each becomes its real molecule.
  3. **Check yourself: 6 questions**: the page's quiz, `OchemToolQuiz` slug `resonance`, the same generator and the
     same record ids (the species id). The picture stays live beside it.
- `#find`, `#compare`, `#check` open Test yourself there. Links keep working: `sp`, `mode=compare` with `a` and `b`,
  and `build` (a structure handed over from another tool opens "?" with the builder and loads it on the picture;
  it is decoded now, so the handoff actually loads, which the old page's `build()` call did not for encoded links).

### What moved
| From the old tool | Where it is now |
|---|---|
| Two modes, Find the forms / Compare two | Explore (one screen) and Test yourself parts 1 and 2 |
| Tap a lone pair or π bond, then tap where it goes, on the molecule editor | Drag the electrons (tap then tap and keys kept) |
| The verdict panel with the engine's long reason | The cause line (short); the long reason to screen readers and "?" |
| "Add it to the collection" | Gone: reaching a form counts it (Find every form) |
| Forms found as cards with rank and summary | The forms row (tag on each; the summary is each button's accessible name) |
| Progress bar and "2 of 5" | Find every form, side panel |
| Hints and "Show me one I'm missing" | Find every form, same words |
| "Where the charge sits" (plain average over the forms found) | The real molecule's marks on the picture (fractions only when every form is equal) |
| The hybrid, shown only after every form was found, and "Back to the board" | Always on the picture in Explore; in Find every form when the row is full |
| "Which one is the molecule really like?" and "Every form, rule by rule" | "?", "This species" (the table and the rule order) |
| Species chips and "Other species" | One picker on the picture, the same two groups |
| Build your own and the send row | "?", "Build your own" (loads onto the picture) |
| Compare's numbers (Forms, Equally good, Charge roams over) | Which is more stabilized?, a table after the call |
| Check yourself | Test yourself part 3 |
| The textbook count note (phenoxide and benzyl, 5 against 4) | "?" and the quiz's explanation, as before |

## Decisions made for the owner
Each is also one line in `docs/tools-v2-owner-log.md`.
1. One screen, no tabs: board, real molecule and forms row together.
2. Explore shows every form from the start; finding them unaided is Test yourself.
3. The student drags the electron pair; the arrow is drawn behind it; tap then tap and keys kept.
4. A first push that overfills an atom is held until the second push.
5. A push that is not resonance springs back with its reason.
6. "Add it to the collection" is gone.
7. Major, minor, equal; never percentages; minor forms drawn smaller.
8. The real molecule is always on the picture in Explore.
9. "Where the charge sits" (plain average) replaced by the real molecule's marks.
10. Benzyl cation: the two forms with the ring whole are major (engine tie broken).
11. Which is more stabilized? keeps its verdicts; one reason changes (benzyl against allyl cation).
12. The rule by rule table, rule order, count note and Build your own are in "?".
13. "revealed" and "given" tags dropped; the reveal plays the arrows.
14. Compare's numbers in a small table after the call.
15. A takeaway line for species with three or more forms.
16. Opens on acetate.

## Accuracy (checked 2026-11-18; ochem content always gets a check)
- **Counts and ranks: the engine, unchanged.** 2 forms for acetate, formate, the allyl ions, enolate, amide, nitro,
  benzene and ozone; 3 for carbonate and nitrate; 5 for phenoxide and the benzyl cation (the ring's own two Kekulé
  forms counted, said in "?"). Unit tested (`scripts/test/tool-content.test.mjs`, the existing count test and four
  new "resonance v2" tests).
- **Major and minor.** Enolate: − on O major, − on CH₂ minor (electronegativity). Amide: the neutral form major, the
  charge separated one minor (more charges). Phenoxide: the two O⁻ forms major, the three ring C⁻ forms minor.
  Benzyl cation: see `docs/ochem-needs-author.md` "res-v2-benzyl". Every other species: all forms equal.
- **The real molecule.** Shares printed only where every form is equal, so the average is exact: acetate and formate
  −½ on each O; nitro −½ on each O with N +1 in every form; carbonate −⅔ on each O; nitrate −⅔ on each O, N +1;
  ozone −½ on each end O, the middle O +1; the allyl ions ±½ on each end carbon. Unequal species get δ with a large
  or small glow. Partial bonds where the order differs between forms (acetate's two C–O; all six benzene ring
  bonds). Unit tested.
- **Moves.** Every form of every species is reachable by pushes the engine accepts (unit tested along the path the
  row plays); the hold for a ten electron atom is offered only when a completion exists within three arrows in all
  (benzene's other Kekulé form needs three); a lone pair onto a hydrogen is never held.
- **Which is more stabilized?** All 156 ordered pairs of species compared against the old judge: same winner every
  time; the reason differs only for benzyl against allyl cation (both directions).
- **Words checked:** "minor: − on C, not O" (enolate, phenoxide), "minor: more charges" (amide), "ring not aromatic"
  (benzyl ring forms), "C: 10 e⁻ → move a π bond off C", "Fewer than 8 on carbon is allowed in a cation, and costs"
  ("?"), "The atoms never move in resonance, and no σ bond breaks or forms". No dashes as punctuation in the tool's
  own copy; the engine's sentences are shown with their dashes replaced.
- Not to scale and said so in "?": ball sizes, the glow sizes (two sizes, major and minor), bond lengths.
- Open points for a person: `docs/ochem-needs-author.md`, "Resonance, tools v2" (res-v2-benzyl, res-v2-shares,
  res-v2-held, res-v2-negligible).

## What was built
- `ochem/assets/tools/resonance.js` (rewritten; the species list, the quiz generator, `stabilization`/`judge` and
  the hybrid's partial bond idea are the old code), `ochem/assets/tools/resonance.css` (new),
  `ochem/tools/resonance.html` (inline styles and the unused molecule editor script gone; the kit and stylesheet
  come from the builder), `kit2: true` and a new tagline in `ochem/assets/tools-registry.js`.
- `window.OchemResonanceModel` (rank, hybrid, paths, completion, judge; no page needed) and its tests.
- `ochem/assets/tools.css`: the old resonance rules removed (73 rules).
- The shared kit and the ochem adapter are unchanged.
- `scripts/tools-v2/resonance-sweep.mjs`: every form of every species, three held pushes, Find every form at its
  start and end, Which is more stabilized? before and after, and the first visit cue, at ten widths.

## Checks run (2026-11-18)
- Sweep, one width per process: 42 states and about 375 checks per width, 420 states and 3757 checks in all,
  **0 failures** (final run after the last change; the run before it caught a first visit cue left at its old spot
  after a resize at 768 to 1024, fixed by placing the cue again from the new drawing) at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920. Smallest share of the stage the board
  molecule takes: 4.5% (1920, a three atom species) to 14% (360); it is the largest object in every state. Contact
  sheets in `/mnt/user-data/outputs/resonance-v2/sweep/`.
- Unit tests (`tool-content`, `ochem-tools-upgrade`, `ochem-url-compat`, `tool-use`, `ochem-premium`,
  `question-ids`, `synthesis-trainer`: 106 pass), `build-tool-pages --check`, `check-site`, `check-weight --check`,
  `check-tool-use` with a local copy of its list (resonance reports frame v2: open, touch, mode, use).
- Playwright at 390 (real touch through CDP, at the scrolled end of the page: the stage does not move under the
  finger), 768 and 1440, light and dark: a forgiving drag 14 px off the bond is held, the second push lands, frames
  during the move, a bad push springs back with its reason, Undo, keys (pick, push, screen reader text), a tap on a
  form plays the arrows (frames at 150, 450, 800 ms), reduced motion (every sweep state is set with it), "?",
  the builder, Show me how, a handed over structure, all three Test yourself parts with right and wrong answers,
  no console errors. Performance with the CPU throttled x4, a full drag and a played form: median 16.7 ms, p95 17 to
  50 ms (the machine was loaded by other sessions; spikes were the first search of a species' arrows, now memoized
  and searched ahead while idle).
- Preview: `/mnt/user-data/outputs/resonance-v2/index.html`; shots (opening with cue, dragging, held, mid move,
  form 2, spring back, enolate mid arrows and minor, phenoxide, benzyl, the three Test yourself parts, at 390, 768
  and 1440, light and dark): `/mnt/user-data/outputs/resonance-v2/shots/`.

## Side by side with the flagship, and what I am not happy with
- It is a drawn object with material (shaded balls, shadows, glowing electrons and charges) on a lit wall, a card
  and a tray, and the moving electrons are the main event. It is still a molecule on a wall, not a landscape.
- **At 1920 and on wide tablets the board and the real molecule's card have open space** around small species
  (ozone, the allyl ions): the board molecule is capped so the balls do not grow cartoonish.
- **The forms row on a 360 px phone is small** (five forms of phenoxide at about 64 px each): readable as shapes,
  the letters about 8 px.
- **The held state draws the intermediate as it is** (the carbon with five bonds and its charge hidden), which is
  honest arithmetic for one arrow but is not a structure; the ring and "10 e⁻" say so.
- A target near two candidates prefers the one that gives a form, which is forgiving but can hide a deliberate wrong
  push aimed between them; a push almost on its target is always taken as meant.
- No real phone, no screen reader pass, no real students.

## Review round 1 (2026-11-18, `/home/claude/review-resonance/REVIEW.md`: blocked on 3 must fix items; all done)
Where this section and the text above disagree, this section is the tool as it is now. The branch first took in
`origin/claude/tools-v2-all` (a merge; its `check-tool-use.mjs` kept, both sides of the owner log and the status
table kept).

### Must fix
1. **Charges in the forms row.** A form's badge is placed in the widest gap between its atom's bonds, then in the next
   direction that is not along a bond and stays inside the card's drawing room (the card above its tag strip, 4 px
   clear of the tag); only if none fits is it clamped into that room. The phenoxide and benzyl para forms now show
   their charge; no badge leaves its card. The sweep checks every form card badge and letter: inside its card and at
   least 4 px clear of its tag.
2. **The forms row on phones.** The small drawings are drawn as on paper: ring carbons, and a CH₂ hanging off a ring
   (the benzyl carbon), are plain corners or line ends with no letters; letters only on heteroatoms and groups
   (O, N, CH₃). Each drawing is fitted to its card's width and height from its measured letters (fit, measure, fit
   again), not from a fixed margin. Letters 11 to 15 px, badges at least 7 px in radius (sign about 11 px), π lines
   stop short only of letters, so both Kekulé forms read at 360. The phone row is 150 px (its heading and tags a
   little smaller there), the phone stage 596 px; on wider stages the row is up to 180 px. The sweep asserts letters
   at least 11 px, badge radius at least 7 px and every π line at least 6 px long, at every width.
3. **Leaving mid replay.** Every played change carries a run token; a mode switch, a new species, Undo and a new
   replay bump it first, so a replay cut short stops: the board keeps the last form it fully reached and the rest of
   the chain never starts (the same guard is on the push animations). The sweep has a new check at every width, with
   motion on: phenoxide, tap form 5 (a two step path), switch to Test yourself, Find every form, after the replay
   would have ended: "1 of 5", the board on the drawn structure, nothing flying, no hidden card framed, no minor form
   named; back in Explore the board is on a settled form, nothing held, nothing flying.

### Should fix
- **Screen reader text in the held state** leaves out the charge of the atom at ten electrons, as the picture does
  ("a push held ... Charges: none"; no "(negative)" in atom names).
- **A drag back onto its own spot cancels**: a release within the grab radius of where the pair came from springs
  back and changes nothing.
- **Less empty space.** The real molecule's card is at most 560 px wide, so wide stages give the room to the board;
  the board's size cap grows with its height (up to 3.6 against 2.7); tablets in portrait get a taller stage
  (620 to 820 px, from the window's height). Smallest board share at 1920 went from 4.5% to 7.5%.
- **The real molecule on phones**: a taller card (162 px), a larger cap; ball sizes shrink with the drawing so balls
  never overlap, and a carbon or hydrogen ball too small for readable letters keeps only its colour (O and N keep a
  letter; the board above names every atom).
- Nit: the quiz explanation says "the picture", not "the picture above".

### Checks (this round)
- Sweep, one width per process at all ten widths: 43 states and 380 or 381 checks each, 0 failures (the four new
  form row checks and the replay check included; the wide widths were run again after the last row size change).
- Unit tests (`tool-content` 41 pass; with the ochem and tool files 95 pass), `build-tool-pages --check`,
  `check-site`, `check-weight --check`, `check-tool-use` with a local copy of its list (frame v2).
- Playwright at 390 (real touch) and 1440, light and dark: as in the first round, plus the drag-home cancel and the
  held state's screen reader text. Performance with CPU x4: median 16.7 ms; p95 16.8 ms on a quiet run, 50 to 83 ms on
  runs while the machine was loaded by other sessions (load average about 6); nothing per frame was added this round
  (the forms row is drawn only on a change of state).
- Preview and shots regenerated: `/mnt/user-data/outputs/resonance-v2/`.

### Not done
- Nits left: the "6 e⁻" tag in the negligible form can sit on a stick; the keyboard target wording "onto C top" for a
  push into the C–O bond; repeated atom names in phenoxide's board text.
- In a para minor form whose outward gap is below the card's room the badge sits inside the ring at that carbon.

## Review recheck 1 (2026-11-18: round 1 items passed; blocked on two)
1. **No rendered text under 11 px.** Badge signs (board, real molecule, forms row) and δ marks have an 11 px floor;
   the major, minor and equal pills are 11 px on phones; this tool's table headers (Which is more stabilized? and
   "?") are 11 px (`.rs2-dock .ttable th, .rs2-ref .ttable th`; the shared ochem style is unchanged). A ball's
   letters are drawn at 11 px or more when they fit across the ball, else the bare element symbol, else no letters
   (the ball keeps its colour; the board names the atoms where it can). The sweep now measures every rendered text in
   the tool (SVG text by its size on screen, HTML text by its computed size), Test yourself included: none under 11 px.
2. **"?" on a phone stops a replay.** When the sheet opens over the stage (a phone) while something is moving, the run
   token is bumped as on a mode change; the board keeps the last form it fully reached. On a desktop the stage stays
   in view and carries on. Sweep check at every phone width: phenoxide form 5 replay, "?" opened mid replay, at most
   two SVG changes in the next 600 ms, nothing flying, the board on a settled form.
- Checks: sweep one width per process, 0 failures at all ten widths (44 states and 384 checks per phone width, 43 and
  380 above); unit tests 95 pass; `build-tool-pages --check`, `check-site`, `check-weight --check`, `check-tool-use`
  (frame v2); preview and shots regenerated.

## Review recheck 2 (2026-11-18: PASS; one nit, fixed)

On a phone the real molecule lettered a CH₃ ball "C" (acetamide; benzyl cation's CH₂ too) while the board names it
CH₃. "CH₃" does not fit across that ball at 11 px (its ink spills past the ball), so a group (two or more H) too small
to letter now keeps only its colour, never a bare atom; a ring CH may still read C. The sweep checks that every real
molecule ball is lettered as the board does (or colour only); it fails on the old code; 360 and 390 pass (44 states,
397 checks, 0 failures).
