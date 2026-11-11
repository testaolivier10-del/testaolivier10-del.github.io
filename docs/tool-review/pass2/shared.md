# Shared Tool Studio fixes (tool review pass 3, 2026-11-11)

Three problems the fresh-eyes judges found on about 100 tools (`judge-b.md` and `judge-c.md`, "problems that
repeat") came from the shared Tool Studio. They are fixed at the source, for every course.

## What changed

1. **The first-run hint never covers anything.** `s.hint()` in `assets/course/tool-studio.js` no longer floats a
   dark bubble over the page. It puts one quiet line (tap icon, short text in the course colour) IN THE LAYOUT:
   - target in the dock: right under the target's row (it climbs out of chip rows, labels and flex rows first);
   - target on the stage (an svg handle, the picture): under the caption line in the dock;
   - target in a sticky band at the foot of a phone (the primary slider band, the action row), or a stage target
     whose caption that band covers: at the top of that band.
   "Start here:" is dropped from the text (the icon says it). The line goes after the first action; a drag keeps
   it until the finger lifts (nothing jumps under the finger) and a finger that only scrolls the page does not
   count. It stays once per tool per device (same `levl_hint_*` keys), and `aria-describedby` still ties it to the
   target while it shows. A target the tool redraws (an svg handle) is found again by its tag and first class.
   The shells' `hintSlot` (hug, mac, mic, psy) no longer open a reserved gap; the trainers' own slot copies
   (env climate, dose and water; hug borders, city, diffusion, scale, frq coach; psych article, brain, development,
   evidence, neuron, sensation, social influence; mic graph studio) are collapsed by one shared rule
   (`[class*="tipslot"][aria-hidden="true"]{display:none}`), so their gaps are gone without touching each tool.
2. **The ring stays inside its own control.** `.ls-halo` is drawn exactly on the target's box with inset shadows
   only (a 2px ring and a faint inner glow), so it can never reach a neighbor's label or value. A control's
   wrapper (label, slider, value) rings only its slider or field, which frees "Price at A", "$14", "8 people" and
   the like. It is clipped to the stage and stops at a sticky band's top edge. The pulse is an opacity pulse;
   reduced motion (`is-static` and the media query) shows it still. Course colour (`--cink`) in light and dark.
3. **Chip overflow.** Any row of more than five short, in-flow chips in the stage or dock shows the first four,
   the one that is on, and a "More (n)" chip; More opens the rest in place (focus moves to the first revealed
   chip) and becomes "Fewer". Chips are only hidden (`.ls-chip-off`), never moved or removed, so listeners, ids
   and state stay; a chip that becomes selected while folded shows; the open or folded choice is kept per row
   across redraws. More has `aria-expanded`, `aria-controls` and an `aria-label` ("Show 6 more options"). If
   folding would hide fewer than two chips, the row stays whole. A MutationObserver and the studio's click/change
   listeners keep it right when a tool rebuilds a row. `s.chips()` re-runs it on demand.

Files: `assets/course/tool-studio.js` and `.css`; `hintSlot` in `human-geography/assets/tools/hug-tools.js`,
`macroeconomics/assets/tools/mac-tools.js`, `microeconomics/assets/tools/mic-tools.js`,
`psychology/assets/tools/psy-tools.js`; the hint assertions in `scripts/test/{apenv,aphug,apmacro,apmicro,appsych}-plot.test.mjs`;
`docs/tools-calm.md`. Macro's and Micro's builds are unchanged (`build-apmacro --check` and `build-apmicro --check` pass).

## Opted out (every chip stays visible)

Automatic, everywhere: quiz modes (Test yourself, Practice, Predict, Questions and the rest of the studio's quiz
list, so no answer choice or drill answer set is ever folded); anything in `[data-ls-answer]`; a stepper or form;
tab lists, radio groups, listboxes and menus (their keys need every item); positioned figure hotspots; long cards.
A tool can opt a row out with `data-ls-allchips`. Named in `NOCHIPS` in tool-studio.js:

| Tool | Row | Why |
|---|---|---|
| A&P Pathways | `.pw-bank` | the steps the student puts in order: hiding one hides part of the answer |
| A&P Lab practical | `.lp-fig` | label boxes on the figure are the questions |
| AP Chem Units and sig figs | `.us-tray` | the quantities are the problem's material |
| AP Chem Particle diagrams | `.pb-palette` | the particles to build the answer from |
| AP Psych Evidence builder | `.eb-chips`, `.eb-parts` | choosing among the claims is the task; part tabs are the FRQ's structure |
| AP Psych Article studio | `.as-parts` | parts A to F of the FRQ |
| AP Psych Stats lab | `.sl-marks` | a z scale from -3 to 3: folding it would show only the negative half |
| AP Stats Probability trees | `.pt-qs` | folding hides the conditional probabilities, the idea of the tool |
| NREMT Skill sheets, Scenario simulator | `.run-pick`, `.picker-grid` | station and call cards, not chips |

Left whole by the rules, not by name: Bio Simpson diversity (6 species with the 5th on: folding would hide one) and
Ochem Spectroscopy (its 6 molecule chips are in Predict, a quiz mode).

## Proof: every tool, opening screen, before and after

Script: `/home/claude/scratch/p3-shared/measure.mjs` (Playwright, port 8871, 145 tools in 15 courses, 1280x800 and
390x844, Premium unlocked, a fresh device so every hint shows). Per tool it measures the hint's box against every
drawn text run, control and stage picture (counted only where the item is what is drawn at that point), the
ring's painted extent (box plus outer shadow) against its target and its neighbors, and the chip rows. Before =
the same script on the branch without these changes. Data: `before/m.json`, `after/m-final.json`; screenshots
in `before/shots`, `after/shots` there.

| Measure (tools) | Desktop before | Desktop after | Phone before | Phone after |
|---|---|---|---|---|
| Hint showing on the opening screen | 123 | 140 | 106 | 106 |
| Hint floating over the page | 123 | 0 | 106 | 0 |
| Hint covers text | 44 | 0 | 41 | 0 |
| Hint covers a control | 3 | 0 | 10 | 0 |
| Hint covers the picture | 28 | 0 | 48 | 0 |
| Hint covers anything | 60 | 0 | 74 | 0 |
| Hint longer than one line | 18 | 4 | 14 | 0 |
| Ring reaches past its control | 126 of 127 | 0 of 139 | 107 of 107 | 0 of 118 |
| Ring paints over another label or control | 111 | 6 | 93 | 7 |
| Rows showing 6 or more chips | 36 | 11 (all opted out) | 12 | 7 (all opted out) |
| Rows folded behind More | 0 | 29 | 0 | 30 |
| Controls showing, all tools | 2101 | 2049 | 1692 | 1651 |
| Page errors / sideways scroll | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

More hints show after (140 against 123) because a hint whose target the tool redraws used to vanish; it now
follows the new target. The 6 and 7 "ring over another item" left are items drawn INSIDE the target's own box (the
Enlarge button on a figure that is the target, a value tag on a handle, a count badge on a particle chip); the
ring never leaves the box. The 4 two-line hints are long texts written by the tools (Function lab, Feedback loop
builder, Macro graph studio, Sinusoid builder); trimming them is each course's call. Three or four hints sit under a
phone's sticky band at landing because their target is below the fold too (Age structure, Graph builder, Reagent
roadmap, Design drills on desktop); they appear with the target when the page scrolls. Folded rows, biggest
first: NREMT flowcharts (11 to 4 + More), Precalc function lab (10), Calc BC series lab (9), Ochem conformations (9),
Macro graph studio (8), Ochem reaction predictor (8 and 11). Dark mode with reduced motion (15 tools, both sizes):
nothing covered, no ring spill, no pulse.

Also checked by hand in a browser: a slider drag keeps the line until release, then it and the ring go and stay
gone after a reload; More opened by keyboard moves focus to the first revealed chip, `aria-expanded` follows;
picking a chip that was folded and pressing Fewer keeps it visible. I looked at 40 screenshots across all 15
courses (light and dark, desktop and phone).

## Checks
`bash scripts/ci-local.sh`: every build `--check`, content check and test passes; `check-site` and `check-weight`
pass (a British spelling in a new comment was fixed and check-site re-run clean).
