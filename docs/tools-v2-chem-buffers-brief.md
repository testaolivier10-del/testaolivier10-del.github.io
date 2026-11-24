# Tools v2: AP® Chemistry Buffers (brief and build notes)

Status file for the v2 rebuild of `chem/tools/buffer-drills.html` (Premium; rollout row 105, group P, wave 12). Plan:
`docs/tools-v2-plans/chem-buffer-drills.md`. Standard: `docs/tools-v2-standard.md`. Branch `claude/tools-v2-chem-buffers`,
cut from `claude/tools-v2-all`. NOT merged: an independent review comes first; decisions made for the owner are also
one line each in `docs/tools-v2-owner-log.md`. Closest integrated tool: ICE tables (`docs/tools-v2-chem-ice-tables-brief.md`),
whose patterns this reuses (canvas of molecules over a still SVG scene, height-driven layout, cells a full atom apart,
counts from what is drawn, the `placed` drill part). The two stay separate tools, one idea each.

## The one idea (rule 11)
**A buffer soaks up added acid or base because its weak acid and conjugate base trade places; plain water cannot.** It
holds its pH until one of its two forms runs out. One screen, one main control (tap a dropper). It is not the Titration
curve reader (a whole curve, equivalence) or ICE tables (how far a reaction runs).

## Research (rule 10): what exists and what we took
Seen means the page itself was opened and read; text only means only a description could be read.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| PhET pH Scale (text only: its page; the sim did not render as text) | Test liquids, a dropper and a meter; a particle view of H₃O⁺ and OH⁻ counts; log or linear scale | The meter answers at once; particles counted | No buffer; no conjugate pair | The meter beside the beaker; particles you can count |
| Northwestern CCL NetLogo Buffer model (seen, its info page) | HA, A⁻, H₃O⁺, OH⁻ and water as coloured dots; ADD-ACID and ADD-BASE buttons; pH from Henderson-Hasselbalch | Shows which particles react with which; suggests small amounts | Dots by colour only; HH everywhere (wrong near exhaustion); water as dots of no scale | Which particle takes the drop, drawn where they meet; exact pH near exhaustion; water not drawn (stated) |
| dmccreary buffer visualizer (seen, its page) | A buffer beaker and a pure water beaker under one pH scale; sliders for [HA], [A⁻], pKa; an Add button for strong acid or base; ΔpH for each | The side by side comparison with water | No amount per addition, no volume, no capacity edge; pH only from HH | The two beakers side by side, one drop into each; honest amounts (1.0 mmol), the added volume, capacity |
| Purdue "Evaluating buffer effectiveness" lab (seen) | Real titration of 50 mL of buffer with 0.20 M HCl and NaOH in small steps, pH logged; compare with the start and the half-equivalence point | Small measured additions; within 1 pH unit; half-equivalence named | A wet lab: no particles | Small fixed additions in mmol; the half-equivalence link in "?"; the pKa ± 1 band |
| ChemCollective acid-base labs (text only: the activity list) | Virtual stockroom labs: design a buffer at a target pH | Real reagents and amounts | No particle view | mmol as the unit; the target-ratio problems stay in Test yourself |
| Concord Consortium molecular workbench (not opened: not found by the searches) | | | | |

What ours does better: the student does it (taps a dropper) and sees both answers at once: in the buffer the drop's
OH⁻ meets a CH₃COOH and an H⁺ hops across (the two particles drawn larger while it does), it leaves as water, and the
buffer meter barely moves; in the water the same OH⁻ just stays, and its meter jumps. When a form runs out the next
drop stays in the buffer too and its meter jumps the same way. Every number is read off the drawn particles.

## The design (Explore)
- **Scene:** the course's lab wall and bench. Two 100 mL beakers side by side: "Buffer" (CH₃COOH and CH₃COO⁻, or NH₄⁺
  and NH₃) and "Water". Particles drawn with their atoms (H white, C grey, O red, N blue), ions with a small charge sign
  (a minus where an H⁺ would join, a plus at the upper right). Above them a rack holding four droppers: HCl (vermillion
  bulb) and NaOH (blue bulb) over each beaker. A pH probe stands in each beaker, cabled to its meter: a box with the
  beaker's name, a digital reading and a 0 to 14 scale with a pointer; the buffer's scale carries a green pKa ± 1 band
  (the buffer range) and a "pKa" mark. Under the meter (beside it on wide screens) the counts: a small drawing of each
  particle and how many are drawn; the water's third line says "1 particle = 1 mmol".
- **Main control:** tap a dropper (either HCl or either NaOH; Enter or Space on the focused one). Both droppers of that
  kind squeeze and one drop (1.0 mL of 1.0 M, 1.0 mmol, one particle) falls into each beaker. Fast taps queue a third
  of a second apart; none is skipped.
- **What happens:** the drop falls in a tinted shell and ripples the surface. In the buffer the particle that takes it
  (CH₃COOH for OH⁻, CH₃COO⁻ for H₃O⁺; NH₄⁺ and NH₃ for ammonia; left over strong acid or base first) turns to face it,
  the two grow to up to 1.6 times their size, an H⁺ crosses with a glow, the water formed fades into the liquid and the
  converted particle goes back to its place. In water an ion that nothing takes moves to a free place as its shell fades.
  The liquid rises by the added millilitre.
- **Numbers from the picture:** each meter reads `ApChemMath.bufferMeter` of its beaker's drawn particles and volume; the
  counts, the pointer and the cause line follow. A swap counts when its H is drawn halfway across; an ion that stays
  counts when its drop has faded halfway; both happen 1025 ms after the tap, so the two beakers change on the same frame.
- **Capacity:** when a form is gone the buffer meter's header reads "Buffer used up" (vermillion frame, the zero count in
  vermillion), and once settled the takeaway: "A buffer holds its pH until one of its two forms runs out." Past it
  (3 more drops allowed) the drops stay in the buffer and its pH jumps like the water's. At the limit (n + 3 either way,
  20 drops in all) that dropper dims and does nothing.
- **Cause line:** "Start: 5 CH₃COOH = 5 CH₃COO⁻ → pH = pKa 4.74 + water 7.00"; "3 drops NaOH → 3 CH₃COOH → CH₃COO⁻ →
  pH 4.74 → 5.35 + water 7.00 → 12.46"; "5 drops NaOH → all CH₃COOH used → pH 4.74 → 8.86 + water ..."; "7 drops NaOH →
  2 OH⁻ left over → pH 4.74 → 12.27 + water ..."; "net 2 drops NaOH ..." and "HCl and NaOH cancel" when both were used.
  Colours: acid vermillion, base blue, the buffer bluish green, water ink. The "+" joins the water's line (read "and").
- **Settings:** two tabs (Acetic acid, Ammonia); a quiet chip "Each form: 5 mmol / 10 mmol" (capacity: the same ratio
  and pH, twice the drops). Start over once a drop has gone in.
- **Cue:** "Tap a dropper", below the buffer's NaOH tip, once per device. Show me how: three callouts (the NaOH dropper,
  the buffer's particles, the buffer meter).
- **"?":** the two beakers (amounts, the drop, what is not drawn and why), which particle takes the drop (both reactions,
  left over strong acid and base first), Henderson-Hasselbalch with this buffer's pKa and a live "Now:" line (the exam's
  method for what is drawn), pH = pKa at equal amounts and the half-equivalence point, capacity and the buffer range,
  what the meters read, a table of the pH after every drop for this buffer and water, the constants, then the drill's
  rules.
- **Reduced motion:** a short cross fade to the new state and the numbers at once.

### What is on screen in Explore (counted at 1440, opening state)
Outside the picture: 2 tabs, "Each form" and 2 chips, the purpose line (10 words: "See why a buffer holds its pH and
water does not."), "Show me how", the cause line ("Start:" and 3 pills), "Start over" once a drop is in. About 30 words.
On the picture: the rack with 4 droppers and their 4 labels (HCl, NaOH twice), 2 beakers (10 particles in the buffer
at the start), 2 probes and cables, 2 meters (name, "pH", the reading, 0 / 7 / 14, the buffer's pKa band and mark), the
counts (2 lines under the buffer, 2 lines and the scale line under the water). No side panel.

## Explore against Test yourself
- Explore: free play, nothing graded, no goal.
- Test yourself: the drill, unchanged in content, grading and records (`T.drill`): pH of a buffer, ratio for a target pH,
  adding strong acid or base, capacity, over all six buffers; ids `buffer-drills:<context>:<step>`; `?seed=` and `#quiz`
  open it; "Kind of problem" is its one dropdown; its beaker (the shared `ApChemBeaker`) as before, without atom letters
  on this page (they rendered under 11 px; its key names each species), as ICE tables.

### What moved (nothing dropped)
| From the old tool | Where it is now |
|---|---|
| + OH⁻ and + H₃O⁺ buttons in the panel | Explore: the NaOH and HCl droppers on the picture (each tap 1.0 mmol into both beakers) |
| mmol added readout | The cause line ("3 drops NaOH", one drop = 1 mmol on the picture) |
| Buffer picker (6 buffers) | Explore: 2 tabs (acetic acid, ammonia); all 6 in Test yourself |
| Amount of each form 5, 10, 20 mmol | Explore: a chip, 5 or 10 mmol; 20 mmol and the capacity comparison in Test yourself |
| The ApChemBeaker figure with its particle legend | Explore: the drawn beaker, the counts under its meter; the figure stays in Test yourself |
| pH readout | The buffer's pH meter |
| The pH against mmol added graph (with the faint whole curve and pure water dashed) | The two meters, side by side on every drop; "?" has the pH after every drop for this buffer and water as a table; a whole curve is the Titration curve reader's job |
| "Show the reasoning" (the exam's method, the exact pH when it differs, the water comparison) | "?": a live "Now:" line with the method for what is drawn; the water's pH is its meter |
| Tool Studio pills ("Buffered", "Nearly spent", "Capacity reached", "Past capacity") | "Nearly spent" (both forms there, the ratio outside 1 : 10 to 10 : 1): the pointer leaving the green pKa ± 1 band and the meter's exact pH; the others: the meter header "Buffer used up", the cause line ("all CH₃COOH used", "2 OH⁻ left over") and the takeaway |
| Tool Studio Details (numbers table, particles list) | The meters and the counts on the picture; "?" |
| Start over | Start over |
| Drill types, ids, `?seed=`, `#quiz` | Unchanged |
| The old mode memory (opening on Test yourself if last used) | Not kept: every visit lands on Explore (the v2 rule); links still open Test yourself |

## Accuracy
- Data: `explore` in `chem/data/tools/buffer-drills.json` (V0 100 mL, drop 1.0 mL of 1.0 M, amounts 5 and 10 mmol,
  extra 3, at most 20 drops; each buffer names its drill context). Validator (`scripts/lib/apchem-tool-checks/buffer-drills.mjs`,
  run by `check-apchem-content`): the Explore buffers match their drill contexts (Ka or Kb and names), one drop is one
  mmol, and at every drop either way past capacity (both amounts): the drawn counts give the same exact pH as the
  stoichiometry, the pH rises with every drop of base, equal amounts read pKa exactly, the meter uses
  Henderson-Hasselbalch only where both forms are there and within 0.01 of the exact pH there, the water pH is the
  strong acid or base pH, and one drop moves the buffer under 0.3 while water moves over 4. Two unit tests check the
  validator catches a wrong Ka and a drop that is not one particle.
- The meter: `ApChemMath.bufferMeter` (`chem-tool-math.js`, next to `bufferState`, which it calls for the exact pH).
- Constants: Ka(CH₃COOH) 1.8 × 10⁻⁵ and Kb(NH₃) 1.8 × 10⁻⁵ (the drill's values, unit8-values), Kw 1.0 × 10⁻¹⁴ at
  25 °C. Open for a person: `docs/apchem-needs-author.md` `buffer-explore` (HH in range versus the exact pH at equal
  amounts, the 1.0 mL "drop", the pKa ± 1 band).
- Logs are used, and the tool belongs to Unit 8 (after topic 5.3), as the authoring guide asks. No OpenStax; no released
  questions.

## What was built
- `chem/assets/tools/buffer-drills.js` (rewritten Explore; the drill unchanged) and `.css` (rewritten: the old sheet
  styled only the old explore arrangement; the quiz beaker's letters hidden).
- `ApChemMath.bufferMeter` in `chem/assets/tools/chem-tool-math.js` (one function and a water helper; nothing else in
  that file changed).
- Build opt in: `"kit2": true` on the tool in `chem/data/pages.json`; the page now loads the kit.
- No change to the chemistry adapter (`placed: true` from ICE tables is reused) or to the kit.
- `scripts/check-tool-use.mjs` is NOT changed (checked with a local copy, see Checks).
- Sweep, frames and perf: `scripts/tools-v2/chem-buffers-sweep.mjs` (`--frames`, `--perf`, `--shots`, `--height`).

## Checks run (2026-11-24)
- `node --test scripts/test/apchem-*.test.mjs` (99 pass, two new validator tests in `apchem-tools.test.mjs`),
  `check-apchem-content --check`, `build-apchem --check`, `check-site`, `check-weight --check` (all 626 budgets within
  range). No shared file changed outside AP® Chemistry, so `build-apcalc` and `build-apmacro` were not needed.
- `check-tool-use` with a local, uncommitted copy of its list plus this tool: tool-open, tool-touch(explore),
  tool-mode(quiz), tool-use; nothing sent under automation.
- Sweep, one width per process at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920, light and dark (the dark
  run asserts the page is dark), each at its screen height (844 up to 430, 960 at 600, 1024 at 768 and 820, 768 at 1024,
  800 at 1280, 900 at 1440, 1080 at 1920), plus 360 × 740: 11 runs of 34 states and 760 checks, 0 failures (13 states
  per theme over both buffers and amounts: start, 1 and 4 drops, a form used up and its takeaway, past capacity both
  ways, mixed, cancel; the first visit cue; a real click on a dropper; the screen fit before and after a drop; Test
  yourself). Checked: clipping, 4 px between every text, no text under 11 px, a beaker the largest object, atoms inside
  the liquid, no two particles touching, every meter, pointer, count, header, liquid level and the cause line against
  the drawn particles, tap targets act on the dropper drawn under them, phone cause line at most two rows and one
  height, beaker and particle size the same in every state, no sideways scroll, no console errors.
- Frames (`--frames`) at 390 and 1440: one click, 7 fast NaOH clicks past capacity, 6 fast HCl clicks onto the left over
  OH⁻, alternating clicks, the ammonia buffer past capacity with HCl: about 1300 frames each, 0 problems (every meter,
  count and the cause line equal the drawn particles; a swap counts exactly when its H is drawn halfway across, an ion
  that stays when its drop is half faded; every resting particle drawn bonded; the drop counts never leave the range
  tapped; nothing left moving). A tap past the limit changes nothing; leaving for Test yourself mid drop stops the stage
  with every tapped drop shown, and Explore comes back right; reduced motion shows the result at once. The check was
  shown to fail when the swap was made to count late (hu ≥ 0.8: 108 failures).
- Perf (`--perf`, CPU x4, eight NaOH clicks then eight HCl clicks at 10 mmol, the flagship in the same run, 10:27 UTC):
  390 px median 16.7 ms, p95 49.9 ms (an earlier run 33.3), flagship median 33.2, p95 50.0; 1440 px median 16.7, p95
  33.3, flagship median 33.3, p95 66.6. One canvas per beaker (its drop path and its glass only), repainted only while
  something in it moves, with the resting particles cached; the first build (one canvas across the stage) missed p95 at
  1440 (66.6).
- Behaviour (Playwright): a real touch tap on the NaOH dropper at 390 after scrolling to the end of the page (both
  beakers take it, the cue goes), Enter and Space on the focused HCl dropper, the live region says the current chain,
  Show me how opens the tour, "?" shows the live "Now:" line, Start over, Test yourself shows the drill and a wrong answer
  gets its feedback, back to Explore clean, `?seed=` opens the same problem twice, no page errors. Without Premium the
  page still shows the Premium card and nothing else (unchanged).
- Preview: `node scripts/tool-preview.mjs chem/tools/buffer-drills.html /mnt/user-data/outputs/chem-buffers-v2/index.html`
  (Premium unlocked in the preview only); shots in `/mnt/user-data/outputs/chem-buffers-v2/shots/` (every sweep state at
  10 widths, light and dark, the first visit, the takeaway, the full screen after a drop, Test yourself; `*-mid-*`
  frames of a NaOH drop, an HCl drop and a drop past capacity at fall, meet, swap and return, at 1440 light, 768 dark and
  390 light).

## Review round 1 (2026-11-24): BLOCK, fixed
Review: `/home/claude/review-chem-buffers/REVIEW.md`. The chemistry and the frame by frame agreement held.

Must fix:
1. **No repo paths in "?".** The two buffers' source lines (`explore.buffers[].ref`) now name only the value and its
   source ("the value the drill and Unit 8 use (CRC Handbook: 1.75 × 10⁻⁵)"); the needs-author pointer stays in this
   brief and in `explore.note`'s doc reference.
2. **Another buffer cross fades.** `pickBuffer` takes the old canvases' pictures first, lays out the new buffer, then
   fades the old pictures out over the new canvases (0.3 s), and the still scene (meters, counts, the pKa band) fades in
   (`.is-swap`, 0.32 s). The frames run checks both canvases fade and the scene's animation runs on a tab switch.

Should fix, all done: past capacity the chain stays at rest ("2 OH⁻ left over → pH ... + water ..."): the takeaway
follows only the drop that empties a form (the sweep checks the four past capacity states have no takeaway after 1.4 s);
Start over and the amount chip ease the meter pointers (the frames run checks the pointer is between its old and new
place 40 ms after Start over); the dropper hover is a faint solid outline and a 6% tint, only where a real pointer can
hover (`(hover: hover)`), never dashed; "Nearly spent" logged in "What moved" and the owner log; needs-author
`buffer-explore` point 1 now says "at 5 mmol of each (0.050 M)".

Checks (fix round): sweep at 360, 390, 1024 (×768) and 1440 (×900), light and dark: 4 runs of 34 states and 768 checks,
0 failures; frames at 390 (2141 checks) and 1440 (939 checks), 0 failures, the buffer switch fade and the Start over
pointer ease included; AP Chem tests (99 pass), content check, build `--check`, check-site, check-weight.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no students; no independent review yet.
- On a phone the particles are small (CH₃COOH about 25 px across at 390, an H atom about 5 px); the reacting pair is
  drawn larger while it swaps, and ions carry a charge sign, but CH₃COOH and CH₃COO⁻ still differ by one small H at rest.
- The water beaker looks empty until a drop goes in (water itself is not drawn; "?" says why).
- The "+" between the buffer's pH and the water's in the cause line is the kit's join; it reads "and" to a screen reader
  but is a little odd to the eye.
- The 1 mL "drop" is a squeeze, not a real drop (needs-author `buffer-explore`).
- Perf at 390 swings between 33 and 50 ms p95 on this loaded machine (load 2.2 on 2 cores); re-time on a quiet one.
