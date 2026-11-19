# Tools v2: AP® Chemistry Units and significant figures (brief and build notes)

Status file for the v2 rebuild of `chem/tools/units-sig-figs.html` (free; rank 10 in `docs/tools-v2-rollout.md`,
group C "calculators and drills"). The first AP® Chemistry tool on the kit. Standard: `docs/tools-v2-standard.md`.
Branch `claude/tools-v2-units-sig-figs`, built on `claude/tools-v2-all`. NOT merged: an independent review comes
first; decisions made for the owner are also one line each in `docs/tools-v2-owner-log.md`.

## Two ideas, so two tabs (rule 11)
1. **Units cancel.** A conversion factor is a fraction worth 1; put the unit you have on the bottom of the next
   factor and it cancels. The amount never changes, only its number and unit.
2. **Significant figures.** An instrument's marks decide how many digits are real: every digit read from the marks,
   plus one estimated digit, and no more.
They are different ideas (a unit chain against reading a scale), so each has its own tab. The old Explore had only
the first, as a setup puzzle with a goal; the second was not shown anywhere as a picture.

## Research (rule 10): what exists and what we took
Seen means the page itself was opened and read; summary only means only a description could be read.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| dmccreary "dimensional analysis practice" (seen) | A problem, a tray of factor tiles, tap one to add it to a chain; cancelled units turn green with a strike; Check, Undo, a score | Tiles from a tray into a chain; the strike shows cancelling | It is a quiz (levels, a score, Check); no picture of the thing measured; nothing about significant figures | The tray and the chain; the strike. Ours has no goal or score in Explore, a real object (the flask), each unit in its own colour, a flip, and the significant figures of the result |
| AACT, "A student-centered web-based approach to teaching unit conversions" (article seen; the Flash tutorial it describes is gone) | Drag parts of factors into place; "Correct!" / "Try Again!" after every move | Immediate feedback | The author: students think units "disappear"; the site never says why they cancel; Flash only | The reason is said in "?" ("a unit on top and the same unit on the bottom divide out, as 5 ÷ 5 = 1") and the flask stays the same water while the tag changes |
| Physics Classroom, Precision and Uncertainty, and its Concept Builder on significant digits (seen) | Read a cylinder's markings, then add one estimated digit; digital readouts: write every digit | The rule in one line | Static pictures; a multiple choice per picture | The rule ("certain digits plus one estimated digit") is the picture's two brackets |
| ChemTeam, Measuring underlies significant figures (seen) | Rulers, thermometers, cylinders: estimate one digit past the smallest division | 30.0 mL vs 4.28 mL: finer marks, more digits | Text only | The comparison of two instruments with the same water |
| AACT Measuring volume simulation (summary only) | Ten cylinder pictures; report the reading and the uncertainty | Different cylinders, different marks | Behind membership; a quiz | Nothing beyond the idea of comparing instruments |
| Virtual Science Teachers, Reading a graduated cylinder (Articulate page; text only) | Type the reading; five rounds; a score | Read the bottom of the meniscus | A quiz | "Bottom of the meniscus" in "?" and the meniscus drawn and magnified |
| PhET (searched) | No unit conversion or measurement reading simulation | | | The PhET rules already in the standard |
| UW–Madison gen chem, Reading a graduated cylinder (seen by the reviewer; text only) | Separate pages for cylinders with different marks, each read to one uncertain digit | Compares cylinders, never a beaker | Text only | Review round 1: the coarse vessel is a second graduated cylinder, not a beaker |

What ours does better: in tab 1 the unit you see cancel is the unit that goes away on the flask's tag, live, with no
goal to reach; in tab 2 the water is dragged and a magnifier shows exactly which marks it sits between, with the
digits split into "from the marks" and "estimated" and the same water poured, as a real pour, into a second
graduated cylinder with coarser marks.

## The design
### Tab 1 "Units cancel" (opens here)
- Scene: a tiled lab wall, a whiteboard, a bench. An Erlenmeyer flask of water stands on the bench with a paper
  label (the amount in its current unit). The board starts with one card, "250. mL water". Four factor cards lie on
  the bench: 1 L / 1000 mL, 1.00 g / 1 mL (density of water), 1 mol / 18.02 g (molar mass), 6.022 × 10²³
  molecules / 1 mol.
- Main control: tap a card on the bench. It flies onto the board at the end of the chain (0.36 s). When it lands,
  every unit that now cancels is struck through, one after the other (0.2 s each), then the result card on the
  board, the flask's label and the cause line show what is left (a short pop on the label). A card on the board:
  tap turns it over (it narrows to an edge and opens upside down); its × takes it off. "Clear the board" under the
  picture. Cards keep their places on the bench, so nothing shuffles under a finger. A card's × shows once it has
  landed. A struck unit fades and gets a strike in its own colour, so the two halves of a pair match. On a board
  1440 px wide the cards grow (about 146 × 164) so the chain still fits one row and the board is not empty. A long
  unit on the result card or the tag breaks only after "·" or "/".
- Words wait for the picture: while a change is moving, strikes that no longer hold go at once, the old result
  card and label fade, and the cause line keeps only the pairs that still cancel ("checking units" if none).
- Cause line: "mL cancels → g cancels → 13.9 mol"; a turned over card: "nothing cancels → 2.50 × 10⁵ mL²/L".
  Each unit has one colour on the cards, the label and the line (mL pink, L blue, g green, mol orange, molecules
  purple); a unit that does not simplify is grey.
- The result is written with the significant figures of the measured numbers (250. mL and 1.00 g/mL: 3), so
  "250. g", "13.9 mol", "8.35 × 10²⁴ molecules"; the reason is in "?".
- Cue: "Tap a card", above the first card, once per device.

### Tab 2 "Significant figures"
- Scene: the same wall and bench. A 50 mL graduated cylinder, the "Fine cylinder" (marks every 1 mL, numbered every
  10), stands in the middle with water; a magnifying glass on its meniscus shows the scale there, enlarged: the marks, their numbers,
  the curved surface and a vermillion line from its bottom to the scale, and the space between the two marks the
  water sits between shaded in blue. Beside it: the reading, big, "33.7 mL", with a blue bracket "from the marks"
  under 33 and a vermillion bracket "estimated" under 7, and a pill "3 significant figures".
- Main control: the water. Drag up or down in the magnifier (pointer; a grip with up and down arrows sits on its
  rim), or the knob beside the cylinder (drag, tap the track, arrow keys, Page Up/Down, Home, End; the keyboard's
  way), from 2 to 48 mL in steps of 0.1 mL.
- Second control (quiet): the "Coarse cylinder" standing small beside it, the same 50 mL cylinder with marks only
  every 10 mL. A tap pours the water into it, drawn as it really happens (2.6 s): the full cylinder is lifted clear
  of the empty one, which comes to stand under it at the same size (both hold 50 mL); it tilts toward it until the
  water reaches its spout, a stream runs from the spout while its level falls and the other's rises (the water in
  the tilted cylinder stays level, its area is the volume left), then it is set down small where the empty one
  stood and the full one takes the middle. The vessels never overlap (the pouring one's lowest point stays above
  the other's mouth). The same water reads "34 mL", 2 significant figures, and "Fine cylinder read 33.7 mL" stays
  under the pill (on phones in two short lines beside the small cylinder). Tap the fine cylinder to pour it back.
  Pouring never moves the water value.
- Cause line: "marks every 1 mL → 33 from the marks → 7 estimated → 3 significant figures". During a pour it names
  what is drawn: "lifting the fine cylinder", "pouring into the coarse cylinder" only while the stream is drawn,
  then "all the water in the coarse cylinder"; the reading words come back when it is set down.
- Cue: "Drag the water", hanging from the magnifier (on a phone from inside its lower part, which shows only
  water), in room kept for it above the reading, so it covers no number.

### What is on screen in Explore (counted in Playwright at 1440, opening state)
Outside the picture: 2 tabs, the purpose line (9 words), "Show me how", the cause line (1 pill at the opening of
tab 1, "Start: 250. mL of water"; 2 to 5 pills after; 4 pills in tab 2), "Clear the board" once a card is on the
board. About 18 words at the opening of tab 1 and 22 in tab 2. No side panel.
On the picture, tab 1: the flask and its label (2 words), 1 card on the board (2 words), 4 cards on the bench,
the cue (first visit). Tab 2: the cylinder and its numbers, the knob, the magnifier with its grip, the reading (3
digits and "mL"), 2 bracket words, 1 pill, the names of the two cylinders (2 words each), the cue (first visit).

### Explore against Test yourself
- Explore: free play, nothing graded, no goal.
- Test yourself, one dropdown "What to practice":
  - **Problems, graded** (the old Test yourself, unchanged in content, grading and records): "Any habit" and one
    entry per habit (Multiplying and dividing, Adding and subtracting, Gas law: kelvin and R, Which R?,
    Calorimetry: J, kJ and sign, pH: decimal places). Value, unit and significant figures graded by
    `ApChemQuestions`; recorded as `units-sig-figs:<context>:<kind>` as before; problem code and link; New
    problem, the finished card, Keep going. `?seed=` and `#quiz` open here.
  - **Set it up (not graded)** (the old Explore, moved): gas pressure, calorimetry, density, mass by difference;
    the live fraction with tappable quantities on the stage, the same choices by name in the side panel, the live
    line, New numbers. `#setup-gas` (and the other kinds) opens one.

### What moved (nothing dropped)
| From the old tool | Where it is now |
|---|---|
| Explore "Set it up" (four habits, the live fraction, tiles by name, the live line, New numbers) | Test yourself, "Set it up (not graded)" |
| "Answer one for credit" | The mode switch (Test yourself) |
| The habit picker of the quiz | The one dropdown, "Problems, graded" group |
| "The rules this drill checks" | "?" in both tabs |
| About text | About (reworded: it now names the two Explore ideas) |
| The old mode memory (opening on the quiz if last used) | Not kept: every visit lands on Explore (the v2 rule); links still open Test yourself |

## Forgiving input (rule 10)
Test yourself already read powers of ten in every common form. Added, for every AP® Chemistry numeric question
(`chem/assets/chem-questions.js`, `normUnit` and the number reader): "g/ml", "grams per mL", "kJ per mol", "KJ" and
"kj", "ATM", "Atm", "atmospheres", "atm.", "gm", "KPa", "kelvin", and a middle dot as the times sign
("1.8·10^-5"). Case still matters where it means something (mM is not MM; ML is megalitre, so only "ml" and
"Ml" read as mL). Unit tests in
`scripts/test/apchem-questions.test.mjs`. Explore has no typing.

## Accuracy
- Models (`chem/assets/tools/chem-tool-math.js`, pure): `units.chain` pairs units in chain order the way they
  are struck by hand, multiplies the values and keeps the fewest significant figures among measured numbers;
  `units.read` reads to one place finer than the marks; `units.sigText` writes a trailing decimal point when a
  last zero counts ("250.", "30."). Unit tests in `scripts/test/apchem-explore.test.mjs`.
- The validator (`scripts/lib/apchem-tool-checks/units-sig-figs.mjs`) checks every factor is a true equality
  (1000 mL per L; 1.00 g/mL; 18.02 g/mol = 2(1.008) + 16.00; 6.022 × 10²³ per mol), that the full chain gives
  molecules with 3 pairs cancelled and 3 significant figures, that a flipped factor cancels nothing, and that the
  fine cylinder always gives one more real digit than the coarse one from 10.5 to 48 mL.
- Checked against the course's notes (`chem/data/notes/math-sig-figs.html`: "read the marks, then estimate one
  more digit"; exact numbers never limit) and Physics Classroom and ChemTeam (above). The density of water is
  0.997 g/mL at 25 °C; 1.00 g/mL is the usual three figure value (said in "?").
- `docs/apchem-needs-author.md`, units-read-beaker: closed in review round 1 (no beaker is read; "?" says a
  beaker's marks are only approximate). Still open there: the ± convention for a reading's uncertainty (half a
  division or a tenth), which the tool does not state.

## What was built
- `chem/assets/tools/units-sig-figs.js` (rewritten) and `.css` (new, this page only); `explore` block, intro and
  about in `chem/data/tools/units-sig-figs.json` (contexts unchanged).
- **The chemistry adapter:** `ApChemTools.studioKit2` in `chem/assets/tools/chem-tools.js`, the same pattern as
  `ApBioTools.studioKit2`: `T.mount(slug, fn, { studio: { kit2: fn(ctx) } })`; the tool hands over its stage, "?",
  About and its Test yourself parts (each may have its own stage and side panel; parts may share them; grouped in
  the one dropdown); `o.start()` says where a link opens. Other chemistry tools do not reach it; their pages and
  scripts are unchanged (`mount` passes a third argument they ignore).
- **Build opt in:** `"kit2": true` on the tool in `chem/data/pages.json`; `scripts/build-apchem.mjs` then loads
  `tool-kit2.css` and `tool-kit2.js`. Only `chem/tools/units-sig-figs.html` changed among the pages.
- `scripts/check-weight.mjs`: the chem shell budget 52.8 → 53.2 KB (the forgiving units: measured 52.7 → 53.1 KB).
- `scripts/check-tool-use.mjs` is NOT changed (byte for byte the collecting branch's; its samples are fixed). That
  this tool reports frame v2 was checked with a local, uncommitted copy that adds the line
  `{ path: '/chem/tools/units-sig-figs.html', tool: 'apchem/units-sig-figs', frame: 'v2' }`; the line goes into
  the file when the tool is merged.
- Sweep: `scripts/tools-v2/units-sig-figs-sweep.mjs`.

## Checks run (2026-11-18, after review round 1)
`node --test scripts/test/apchem-*.test.mjs` (99 pass), `check-apchem-content --check`, `build-apchem --check`,
`check-site`, `check-weight --check` (chem shell 53.1 of 53.2 KB), `build-apcalc --check`, `build-apmacro --check`.
`check-tool-use` with a local uncommitted copy of its list plus this tool: tool-open, tool-touch(explore),
tool-mode(quiz), tool-use, nothing sent under automation (the committed file is the collecting branch's). Sweep,
one width per process at 10 widths: 330 states, 1648 checks, 0 failures (the cue against every text on the picture,
unit line breaks, 16 held pour frames per width: no overlap, on the stage, "pouring" only with the stream).
Playwright behaviour checks at 1440 light, 768 dark, 390 light and dark, each with and without reduced motion
(108 pass): the × waits for the card to land, the cue in tab 2 and gone after use, a pointer drag in the
magnifier (desktop) and a real CDP touch drag in it (phones), End, Home and arrow keys on the knob, the words wait
during the lift, no reading during the pour, the coarse reading after it, the water value unchanged by a pour, the
comparison line shown on every width, the pour back, reduced motion pours at once over a fading copy of the old
state, `?seed=` opens the problem, no console errors. Preview: `node scripts/tool-preview.mjs
chem/tools/units-sig-figs.html /mnt/user-data/outputs/units-sig-figs-v2/index.html` opens from disk; shots in
`/mnt/user-data/outputs/units-sig-figs-v2/shots/` (sweep states at 10 widths, `*-2-pour-*` and `*-pour-*` mid pour
frames both ways, first visit cues at 1440, 768 dark and 390).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no students.
- The magnifier is larger than the vessel (it is part of the water's control: the water can be dragged in it, and
  since review round 1 it carries the cue and a grip). On phones it is smaller than the cylinder.
- The coarse cylinder (50 mL marked every 10 mL) is a teaching picture; real 50 mL cylinders are marked every 1 mL.
  "?" says so in one sentence ("The coarse cylinder is a teaching picture: a real 50 mL cylinder is marked every
  1 mL.").
- The pour is drawn from a model of a tilted cylinder (level water, area as volume), not a fluid simulation; the
  stream is one curved stroke.
- The flagship and osmosis keep their own scene code; nothing was moved into the kit here (`K.setup`, the shared
  factor chain the rollout plan names for APES calculation studio, is not built: the chain is in this tool).

## Review round 1 (2026-11-18): BLOCK, fixed
Review: `/home/claude/review-units-sig-figs/REVIEW.md` (shots beside it). Branch rebased on `claude/tools-v2-all`.

Must fix:
1. `scripts/check-tool-use.mjs` is now byte for byte the collecting branch's; frame v2 was checked with a local,
   uncommitted copy (all four tools: tool-open, tool-touch, tool-mode, tool-use; nothing sent under automation).
   "What was built" says so.
2. The tab 2 cue hangs from the magnifier (desktop: from its lower rim; phone: from inside its lower part, which
   shows only water), in room kept above the reading (`CUE_ROOM`, and the reading moves down under it). The sweep's
   cue check now covers every text on the picture, the cylinder's scale numbers and the lens numbers included.
3. Decided for the owner: no beaker. The coarse vessel is a second 50 mL graduated cylinder marked every 10 mL,
   as the UW–Madison reading pages compare cylinders; `units-read-beaker` is closed in `docs/apchem-needs-author.md`
   and "?" says a beaker's marks are only approximate. The water moves as a real pour (`pourPlan`, `pourSvg`):
   both cylinders drawn the same size while it moves, the full one lifted so its lowest point stays above the
   other's mouth, tilted until the water reaches its spout, a stream while one level falls and the other rises,
   set down small. The cause line says "lifting the fine cylinder", "pouring into the coarse cylinder" only while
   the stream is drawn, then "all the water in the coarse cylinder". The sweep holds the pour at 16 frames per
   width and checks the outlines never overlap (separating axis test), stay on the stage, and that "pouring" is
   said exactly while the stream is drawn. Reduced motion: a cross fade (it now really fades from the old state).
4. Result card and tag units break only after "·" or "/" (`<wbr>`, `word-break: keep-all`), a step smaller when
   long; the sweep checks every line break of those units.

Should fix, all done: the cue and a grip relate the knob's job to the magnifier (the knob by the cylinder stays,
the keyboard's way); "Fine cylinder read 33.7 mL" shows on phones (two short lines beside the small cylinder);
the board at 1440 and up has bigger cards (146 × 164 at 1440, text scaled) and a taller board, still one row;
strikes are 3.5 px in the unit's own colour, the struck text faded in that colour; `ML` is no longer read as mL
(unit test added); the weight comment gives the measured 52.7 → 53.1 KB; the tap ring and the knob track are solid,
not dashed. Removed: the × on a card while it flies (it shows once the card lands). Also: the phone cause line
height override was dropped (the kit's own is used).

Decisions made for the owner (also in `docs/tools-v2-owner-log.md`): the coarse cylinder in place of the beaker;
the pour as drawn above (2.6 s); the cue on the magnifier with a grip; `ML` not an alias.

## Recheck 1 (2026-11-18): PASS, three polish items done
1. "?" says in one plain sentence that the coarse cylinder is a teaching picture (a real 50 mL cylinder is marked
   every 1 mL); mirrored under "Not done" above.
2. On a wide stage the pour is centred (`pourPlan` shifts the whole pour to the middle, still clamped to the
   stage); phones keep it where it was.
3. Reduced motion: the old picture fades out (0.15 s) before the new one fades in (0.15 s), so two readings never
   show together (`crossSvg`).
Checks: sweep at 390, 1440 and 1920 (one width per process), chem unit tests, content check, `build-apchem
--check`; preview regenerated.
