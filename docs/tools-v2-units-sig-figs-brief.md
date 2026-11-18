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

What ours does better: in tab 1 the unit you see cancel is the unit that goes away on the flask's tag, live, with no
goal to reach; in tab 2 the water is dragged and a magnifier shows exactly which marks it sits between, with the
digits split into "from the marks" and "estimated" and the same water poured into a coarser vessel.

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
  picture. Cards keep their places on the bench, so nothing shuffles under a finger.
- Words wait for the picture: while a change is moving, strikes that no longer hold go at once, the old result
  card and label fade, and the cause line keeps only the pairs that still cancel ("checking units" if none).
- Cause line: "mL cancels → g cancels → 13.9 mol"; a turned over card: "nothing cancels → 2.50 × 10⁵ mL²/L".
  Each unit has one colour on the cards, the label and the line (mL pink, L blue, g green, mol orange, molecules
  purple); a unit that does not simplify is grey.
- The result is written with the significant figures of the measured numbers (250. mL and 1.00 g/mL: 3), so
  "250. g", "13.9 mol", "8.35 × 10²⁴ molecules"; the reason is in "?".
- Cue: "Tap a card", above the first card, once per device.

### Tab 2 "Significant figures"
- Scene: the same wall and bench. A 50 mL graduated cylinder (marks every 1 mL, numbered every 10) stands in the
  middle with water; a magnifying glass on its meniscus shows the scale there, enlarged: the marks, their numbers,
  the curved surface and a vermillion line from its bottom to the scale, and the space between the two marks the
  water sits between shaded in blue. Beside it: the reading, big, "33.7 mL", with a blue bracket "from the marks"
  under 33 and a vermillion bracket "estimated" under 7, and a pill "3 significant figures".
- Main control: the water. A knob on the cylinder (drag, tap the track, arrow keys, Page Up/Down, Home, End) from
  2 to 48 mL in steps of 0.1 mL; dragging up or down inside the magnifier moves the water too (pointer only).
- Second control (quiet): the beaker standing small beside it. A tap pours the water into the beaker (0.9 s: the
  vessels pass each other, the cylinder drains and fades, the beaker fills; the reading and line wait). The beaker
  has marks every 10 mL, so the same water reads "34 mL", 2 significant figures, and "Graduated cylinder read
  33.7 mL" stays under the pill (desktop). Tap the cylinder to pour it back. Pouring never moves the water knob.
- Cause line: "marks every 1 mL → 33 from the marks → 7 estimated → 3 significant figures".
- Cue: "Drag the water" at the knob.

### What is on screen in Explore (counted in Playwright at 1440, opening state)
Outside the picture: 2 tabs, the purpose line (9 words), "Show me how", the cause line (1 pill at the opening of
tab 1, "Start: 250. mL of water"; 2 to 5 pills after; 4 pills in tab 2), "Clear the board" once a card is on the
board. About 18 words at the opening of tab 1 and 22 in tab 2. No side panel.
On the picture, tab 1: the flask and its label (2 words), 1 card on the board (2 words), 4 cards on the bench,
the cue (first visit). Tab 2: the cylinder and its numbers, the knob, the magnifier, the reading (3 digits and
"mL"), 2 bracket words, 1 pill, the names of the two vessels (1 and 2 words), the cue (first visit).

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
("1.8·10^-5"). Case still matters where it means something (mM is not MM). Unit tests in
`scripts/test/apchem-questions.test.mjs`. Explore has no typing.

## Accuracy
- Models (`chem/assets/tools/chem-tool-math.js`, pure): `units.chain` pairs units in chain order the way they
  are struck by hand, multiplies the values and keeps the fewest significant figures among measured numbers;
  `units.read` reads to one place finer than the marks; `units.sigText` writes a trailing decimal point when a
  last zero counts ("250.", "30."). Unit tests in `scripts/test/apchem-explore.test.mjs`.
- The validator (`scripts/lib/apchem-tool-checks/units-sig-figs.mjs`) checks every factor is a true equality
  (1000 mL per L; 1.00 g/mL; 18.02 g/mol = 2(1.008) + 16.00; 6.022 × 10²³ per mol), that the full chain gives
  molecules with 3 pairs cancelled and 3 significant figures, that a flipped factor cancels nothing, and that the
  cylinder always gives one more real digit than the beaker from 10.5 to 48 mL.
- Checked against the course's notes (`chem/data/notes/math-sig-figs.html`: "read the marks, then estimate one
  more digit"; exact numbers never limit) and Physics Classroom and ChemTeam (above). The density of water is
  0.997 g/mL at 25 °C; 1.00 g/mL is the usual three figure value (said in "?").
- Open points in `docs/apchem-needs-author.md`: whether a beaker should be read at all (many labs call its marks
  approximate), and the ± convention for a reading's uncertainty (half a division or a tenth), which the tool
  does not state.

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
- `scripts/check-weight.mjs`: the chem shell budget 52.8 → 53.2 KB (the forgiving units, 0.2 KB).
- `scripts/check-tool-use.mjs`: this tool added as a v2 tool (it reports frame v2).
- Sweep: `scripts/tools-v2/units-sig-figs-sweep.mjs`.

## Checks run (2026-11-18)
`node --test scripts/test/apchem-*.test.mjs` (99 pass), `check-apchem-content --check`, `build-apchem --check`,
`check-site`, `check-weight --check`, `build-apcalc --check`, `build-apmacro --check`, `check-tool-use` (this
tool: tool-open, tool-touch, tool-mode, tool-use with frame v2; the osmosis line of that check expects "old" and
fails on `claude/tools-v2-all` already, not changed here). Sweep at 10 widths: 170 states, 1158 checks, 0
failures. Playwright behaviour checks at 1440 light, 768 dark, 390 light and dark (85 pass): the card's flight,
no strike and no new words before it lands, the strike frame, the result, the turn (mid frame), keyboard placing
(focus stays on the card), keys, Home and End on the water, a pointer drag of the knob and inside the magnifier,
the pour (reading and line wait), reduced motion (result at once, pour at once), a real touch drag on a phone
with the page scrolled, Test yourself right and wrong answers graded and recorded with their ids, `?seed=`,
`#quiz`, `#setup-gas`, no console errors. Preview: `node scripts/tool-preview.mjs chem/tools/units-sig-figs.html
/mnt/user-data/outputs/units-sig-figs-v2/index.html` opens from disk.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no students.
- The board has empty space above and below one row of cards on a wide screen.
- The pour shows the vessels passing each other rather than a real pour stream.
- The magnifier is larger than the vessel (it is part of the water's control: the water can be dragged in it).
- The flagship and osmosis keep their own scene code; nothing was moved into the kit here (`K.setup`, the shared
  factor chain the rollout plan names for APES calculation studio, is not built: the chain is in this tool).
