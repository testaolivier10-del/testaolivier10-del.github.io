# Tools v2: AP® Biology Water potential (brief and build notes)

Status file for the v2 rebuild of `bio/tools/water-potential.html` (rank 5 in `docs/tools-v2-rollout.md`, the
second AP® Biology tool on the kit). Standard: `docs/tools-v2-standard.md`. Builder's brief:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-water-potential`, from `claude/tools-v2-all`. NOT merged:
the independent review comes next. Decisions made for the owner are also in `docs/tools-v2-owner-log.md`.

## The one main idea
**Water potential is a number you add up: solute potential plus pressure potential. Water moves from the higher
total to the lower total.** CED 2.8 (2025 framework, `docs/apbio-ced-map.json`): "Water potential combines pressure
potential and solute potential; water moves from higher to lower water potential", ψ = ψp + ψs, ψs = −iCRT.

Osmosis (`docs/tools-v2-osmosis-brief.md`) teaches which way water moves and what that does to a cell, with no
numbers on the picture. This tool is the other screen: the same kind of cell, but the student sets the parts and
reads the two totals. It has no tonicity words, no red blood cell and no "what happens to the cell next".

## Research (rule 10): what exists and what we took
Nothing below could be opened as a live screen: this container's network lets a browser reach only a short list of
hosts, and each of these pages was refused (tried in Chromium, 2026-11-18). Everything was read as text through
the fetch tool, so the column "how it works" is what the page's own text says, and nothing is claimed about the
look of a screen.

| Source | Seen as | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|---|
| College Board, AP® Biology lab manual, Investigation 4 (Diffusion and Osmosis) | text (PDF) | The course's own account: ψ = ψp + ψs, ψs = −iCRT, bars, R = 0.0831, an open beaker has ψp = 0, pure water has ψ = 0; a cell in pure water gains water until "enough positive turgor pressure builds up to oppose the more negative solute potential", and then ψ of the cell = 0 | It is the source the exam uses | A reading, nothing to do | The science check, and the tool's two extremes: full pressure brings the cell's total to 0, and in pure water that is "no net movement" |
| OpenStax Biology for AP® Courses, 23.5 (the U tube figure) | text | Solute added to one arm lowers ψs and water moves to it; pressure on one arm raises ψp and water moves away from it | The two parts are shown as two things you could do with your hands | A still figure; megapascals, not the bars of the formula sheet | The interaction itself: one handle for solute, one for pressure, and water answering both |
| dmccreary, osmosis simulator | text (its own documentation) | Two concentration sliders, a temperature slider, an animal or plant toggle, an "Equilibrate" button; a "stage rail" lists concentrations, then ψs, then ψ cell, ψ external and Δψ; a turgor gauge in plant mode | The numbers are live; plant mode has pressure | Four or five controls and a rail of numbers beside the picture; pressure is a gauge the student cannot set; a button before anything settles | Live numbers. Not taken: the rail (ours are attached to the two places they belong to) |
| simpledecisionmaker, water potential calculator | text | A form: solute type, i, molarity, temperature, ψp, optional second compartment; outputs total ψ and a component breakdown, with an arrow and a banner for direction | Every part of the sum is named | A calculator: type numbers, read numbers, no scene | The breakdown as a written sum (solute, pressure, total), one for each side |
| publicsofttools, osmosis simulator | text (its guide) | Two concentration sliders across a membrane, a Start button, an "osmotic pressure mode" where pressure is applied to the high solute side | Pressure as something applied | The guide does not say that any ψ number is shown | Confirms the gap: pressure you can set, with the sum shown, is rare |
| showmeclass (AP Bio osmosis and water potential), LabXchange (Transpiration and Water Potential), lvm-biology | text (summaries only) | Not described by the text that came back | (not inspected) | (not inspected) | Nothing |
| The Biology Corner, Investigation: Osmosis and Water Potential (LibreTexts) | text | Potato cores, the zero crossing on the mass graph, ψ = −iCRT at that molarity | The classic lab | No pressure potential worked with numbers | It is our "no mass change" practice problem, kept |
| PhET | from the Osmosis brief (2025) | No osmosis or water potential simulation exists | | | The PhET rules already in the standard |

What ours can do better than all of them: both parts are handles on the picture, the sum is written where it
belongs (on the cell and on the solution), the comparison is said in words on the totals ("higher", "lower",
"equal"), and the water arrows follow that instant.

## The design
- **The picture:** a plant cell standing in an open beaker of solution on a bench, drawn across the whole stage.
  The cell is on the left (wall, membrane, cytoplasm with chloroplasts and a nucleus, a large vacuole holding the
  cell sap's solute); the solution is everywhere around it, with its solute as particles at the same density rule
  inside and outside.
- **Two written sums on the picture,** one for the cell and one for the solution, in the idea's colours:
  solute (amber, negative), pressure (green, positive), a rule, the total ψ (blue, in bar) with one word under it:
  higher, lower or equal.
- **Main control:** "Pressure in the cell", one knob on the bench under the picture, 0 to 9.8 bar in steps of
  0.1 (drag, tap the track, arrow keys, Home, End). The wall bows out and pushes in harder as it rises.
- **Second control (same idea, so it stays on the screen; calm, no pulse):** "Solute outside", a knob on the
  beaker's right wall, 0 to 1.0 M sucrose in steps of 0.05 M. Particles fill the solution as it rises.
- **Instant response:** the numbers, the two words, the water arrows across the wall (wider for a bigger
  difference) and the cause line all follow the knob, with no Play.
- **Opens** on pressure 2.0 bar and 0.20 M outside: cell −9.8 + 2.0 = −7.8, outside −4.9, water moving in. A drag
  to 4.9 bar finds "equal".
- **Cue:** "Drag the pressure" at the knob, once per device, gone at the first touch. "Show me how" opens only
  from its link and from "?".
- **Cause line** (`K.cause`), three pills: "Cell ψ −7.8 → lower than −4.9 outside → water moves in";
  "... → equal to −4.9 outside → no net water movement"; "... → higher than −4.9 outside → water moves out".
- **Compare:** the setting before the change stays as a tick on that control's track ("before").
- **One colour per idea, everywhere:** solute amber, pressure and the wall's push green, water and the total ψ
  blue. Every value is also written.
- **Extremes:** pressure 9.8 bar brings the cell's total to 0.0 (the wall fully bowed); with 0 M outside both
  totals are 0.0 and nothing moves (the lab manual's turgid cell in pure water). 1.0 M outside crowds the beaker
  and pulls water out of any cell.
- **Every change is seen:** the wall bows and relaxes, the push arrows grow, particles fade in and out, the
  water arrows shrink to nothing, turn and grow; numbers count with the picture, and the words change only when the
  drawn arrows do. Reduced motion: the result at once with a short cross fade.

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or asked.
- **Test yourself:** the old Practice mode, unchanged in content, grading and record ids
  (`water-potential:<context>:<part>`): seeded problems with new numbers and the three worked problems, one part
  at a time with the method hint, slips and "Show the answer", then the worked solution. The same picture shows
  the problem's cell and beaker; the sums fill in with what the student types and, after the last part, the true
  values, the words and the arrows. `?seed=` and `#practice` open it as before.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Practice mode (new numbers, the worked set of three) | Test yourself, unchanged |
| The shared ψ scale with two level lines | "?" ("The two totals on one scale"); on the picture the comparison is the word on each total |
| Four readouts (cell ψs, cell ψ, beaker ψ, direction) | On the picture (the two sums, the arrows) |
| ψs = −iCRT worked with the numbers | "?" ("This setting") |
| Beaker solute: sucrose or NaCl (i = 2) | Out of Explore. In the practice problems (NaCl, CaCl₂, glucose) and explained in "?" |
| Temperature slider | Out of Explore (fixed at 22 °C). In the practice problems and "?" |
| Cell sap concentration slider (was under Details) | Out of Explore (fixed at 0.40 M). Varied in the practice problems |
| "Try this" goals (plasmolysis, no net movement, NaCl) | "?" ("Things to try"), reworded for the two controls; plasmolysis is Osmosis's picture |
| The cell shrinking from its wall when water leaves at ψp = 0 | Osmosis shows it. This picture is the moment the cell goes in |
| The solute key (sucrose hexagon, Na⁺ and Cl⁻ dots) | Gone: particles are drawn at i × C, said in "?" |
| The live sentence under the figure | The cause line |
| "See it in the osmosis simulator" | "?" |

## Accuracy
- ψs = −iCRT with R = 0.0831 L·bar/(mol·K) and T = °C + 273 (`ApBioMath.psiS`), ψ = ψs + ψp, an open beaker has
  ψp = 0, water moves from higher (less negative) to lower ψ, equal ψ means no net movement (water still crosses
  both ways). Checked against the lab manual and OpenStax (above).
- Explore rounds each ψs to 0.1 bar before adding (0.40 M at 22 °C is −9.81, shown and used as −9.8), so every
  sum on the picture is exact and "equal" can be reached by hand. The practice problems keep 0.01 bar.
- The cell's solute potential is held at −9.8 bar while pressure changes. A real cell's sap is diluted a little
  as it fills; textbooks hold ψs fixed for a walled cell (its volume changes by a few percent). Logged in
  `docs/apbio-needs-author.md` (water-potential-explore-fixed-sap).
- Pressure stops at 9.8 bar: pressure can balance the solute but cannot lift a cell's ψ above 0, the value of
  pure water (the old tool capped it the same way).
- The picture is the moment the cell goes into the solution. What happens next (pressure rising or falling until
  the totals meet, plasmolysis) is Osmosis's screen; "?" says so.


## Decisions made for the owner
One line each in `docs/tools-v2-owner-log.md` (2026-11-18, "AP Bio Water potential"): the two controls on the
picture; Practice becomes Test yourself unchanged; the ψ scale, NaCl, temperature and the cell sap slider leave
Explore for "?" and the practice problems; ψs rounded to 0.1 bar in Explore; the cell's ψs held fixed and pressure
capped at 9.8 bar; no plasmolysis drawn here (Osmosis's screen); "Try this" and the solute key moved or gone.

## On screen in Explore (counted)
Purpose line and "Show me how" (2); the picture: beaker, cell, solute particles, two written sums with a word
under each total, the water arrows with one pill (4 labelled things); two knobs with their value tags and names
(main: "Pressure in the cell", quiet: "Solute outside"); the cause line (3 pills). No side panel. "?" holds the
worked setting, the two totals on one scale, things to try and the link to Osmosis.

## Build status (2026-11-18)
- A first builder stopped on a usage limit; its last work (four drawing layers so a pressure drag does not redraw
  the particles, the wide width layout, the sweep test) was committed as found.
- Sweep (`scripts/tools-v2/water-potential-sweep.mjs`): 320 states, 2824 checks, 0 failures at the ten widths
  (25 landmark settings, the first visit, two practice problems before and after). The sweep now waits for the
  counting numbers to land (at most 3 s; slowest seen 1.2 s in headless Chromium at 820 px) before it compares
  them with the knob. The cell is at least 12.1% of the stage (600 px) and up to 26.9% (1920 px).
- Hand checks (Playwright, 390, 768, 1440, light and dark): opening state, pointer drag with frames during the
  change (arrows always agree with the numbers shown), keyboard (End, Home, arrows by 0.1), pure water at full
  pressure gives "no net water movement", Test yourself wrong and right answers, real touch drag at the scrolled
  end of a phone page (knob moves, page does not scroll), reduced motion (numbers land at once with a 240 ms cross
  fade), no console errors: 114 checks, 0 failures.
- `scripts/check-tool-use.mjs` is not edited (its samples are fixed on the collecting branch); a local copy of its
  list with Water potential and Osmosis added reports frame v2 for both.
- Course checks: 72 AP Bio unit tests, content check, map check, `build-apbio --check` all pass.
- Not happy with: the dashed "no net flow" mark is the same as Osmosis's (kept for consistency, a reviewer may
  still read it as ghost arrows); at 600 to 820 px the cell is a smaller share of the stage (12 to 16%) because
  the two sums sit above it.

## Review round 1 (2026-11-18, `/home/claude/review-water-potential/REVIEW.md`: BLOCK, 2 must fix, 5 should fix)
Rebased onto `claude/tools-v2-all` first (its `check-tool-use.mjs` and the kit's phone cause line height taken as
they are; the earlier edit to `check-tool-use.mjs` dropped).

Must fix:
1. **The word pill sat on the total.** The card's foot is now deep enough that the hanging pill's top stays 6 px
   under the total's glyphs at every width (`ch` in `geo`). The sweep no longer skips a sum and its own word: the
   word must keep 4 px from every text in its sum.
2. **Result before the arrows in Test yourself on a phone.** The words are empty while `view.reveal` is 0, and the
   cause line keeps its place but stays unseen (`holdCause`) until the first frame that draws the arrows. The sweep
   watches every change from each Check to the end and fails on a word or a seen cause line before `.wp2-flowg`;
   frames every 50 ms at 390 agree (`shots/390-ty-reveal-f3.png`: true numbers, no words, no arrows).

Should fix:
- **No net movement is a thin two headed arrow** (a head at each end: water crosses both ways at the same rate) in
  place of the three dashed lines. The same change in Osmosis (`both()` in `osmosis.js`, `.os2-eq` and `.os2-eq-h`;
  seen in its Test yourself runs at 1440, 390 and 768 dark; its unit tests and tool check pass, nothing else there
  changed).
- **The cell between phone and desktop.** From 521 to 1023 px the stage is taller (`min(86vw, 600px)` in Explore,
  `min(72vw, 500px)` in Test yourself) and under the sums the cell may widen to `hh * 1.9`, capped so the water
  arrows and their pill still fit before the solute knob. Smallest cell share now 15.0% at 600 (was 12.1), 22.1% at
  768 (16.5), 23.5% at 820 (15.4).
- **One wording:** "no net movement" in the pill and in the cause line ("?" and the screen reader keep full sentences).
  On a phone the pill wraps to two lines ("no net / movement") where one line would run onto the cell; the sweep now
  also keeps the flow pill off the cell. The layout's lane for that pill is measured from its real width.
- **"bar" on the first cause pill** ("Cell ψ −7.8 bar"); still two rows at 360.
- **Owner log:** one line that the typed ψ level lines of the old practice are no longer drawn.
- Counting numbers: left as they are (the reviewer found them acceptable).
- The sweep polls with plain evaluations (Playwright's `waitForFunction` hit the page's CSP under load once).

Checks after the round: sweep 320 states, 2846 checks, 0 failures (one width per process); hand checks 116, 0
failures (390, 768, 1440, light and dark, pointer and touch drag, keyboard, reduced motion, the phone reveal
frames, Test yourself right and wrong); 72 AP Bio unit tests, content, map and `build-apbio --check`, check-weight,
check-site, `build-apcalc --check`, `build-apmacro --check`.
