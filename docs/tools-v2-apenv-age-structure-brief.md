# Tools v2: AP® Environmental Science Age structure (brief and build notes)

Status: built 2026-11-24; review round 1 BLOCK (two "?" texts), fixed with every should fix the same day; waiting for
the recheck. NOT merged.

Status file for the v2 rebuild of `environmental-science/tools/age-structure.html` (Premium; rollout row 65, group P,
wave 10). Plan: `docs/tools-v2-plans/apenv-age-structure.md`. Standard: `docs/tools-v2-standard.md`. Branch
`claude/tools-v2-apenv-age-structure`, cut from `claude/tools-v2-all`. Same course and kit adapter as the flagship
(Water pollution) and APES Energy flow; decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`. Twin of AP® Human Geography Population lab (owner: they stay separate): this tool is
fertility and its future; the HuG tool walks the demographic transition through time.

## The one idea (rule 11)
**Fertility sets the base of the pyramid, and the base becomes the future population.** One screen, no tabs, one main
control (the children per woman, dragged on the mother). CED 3.6, 3.7, 3.8.

## Research (rule 10): what exists and what we took
Seen means the page itself was opened and read; text only means only a description could be read.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| Our World in Data, Population simulation tool (seen, its page; the app itself did not render as text) | Pick a country; set fertility, life expectancy and migration at 2030, 2050 and 2100; cohort component projection from UN WPP 2024 to 2100; population total and age structure | Fertility as the main control, the future drawn, real UN data | Three settings at three dates is a lot for a student; no replacement mark | Fertility as the one control; the future shape drawn; life expectancy as the second |
| Annenberg Learner, Demographics lab (seen, its help page) | Birth and death schedules by age (raise or lower 5% or 50%, shift by 5 years), Step 5 years or Run to 2050; growth rate; a blue and pink pyramid | Says plainly that lifetime births depend on survival, so mortality changes them; growth shown as a number | Dialogs of age rates; no replacement level named | Survival in the fertility arithmetic (replacement rises with child deaths); growth as one number; men and women as two colours |
| CPC population pyramids simulator (text only: its landing page; the app is a link) | Real pyramids of 90 countries, 1780 to 2011, in percent; names the dependants (under 15 and over 65) and momentum ("filling up" as a baby boom moves up) | Real data; percent view; momentum shown as a cohort moving up | Not a what-if tool | Percent of all people at one scale; the momentum idea (the climb up the rows); dependants in "?" |

What ours does better: the student does it (drags a mother along a track; her children stand beside her, a part of a
child for a fraction) and sees the base answer first and the rows above follow, with replacement marked where this
life expectancy puts it (2.1 only when few children die). The rows are made of people, so the shape is literally the
population.

## Science (checked 2026-11-24)
- UN World Population Prospects 2024, Key Messages (opened): replacement level is "the level required for a population
  to maintain a constant size in the long run without migration", about 2.1; global fertility 2.3 births per woman and
  life expectancy 73.3 years in 2024; more than half of all countries are below 2.1; momentum "will account for 79 per
  cent of the population increase through 2054". "?" uses the 79% with its source and year.
- Replacement above 2.1 where mortality is high: Espenshade, Guzman and Westoff (2003), Population Research and Policy
  Review (the journal page was blocked in this session; its press release was read: higher mortality and skewed sex
  ratios raise it). The tool computes it from its own life table (2.1 at a life expectancy near 80, 2.4 at 60, 4.0 at
  30), so it never states a number it does not draw.
- Growth = (CBR − CDR) / 10 in percent and the rule of 70: the course's recipes. In the model, CBR − CDR equals the
  stable growth rate exactly.
- Pyramid shapes: expansive, stable (also called stationary), constrictive, as the drills name them.
- No real country is named in Explore. The stage table in "?" is the drills' typical values (unchanged).
- Contested or simplified points are in `docs/apenv-needs-author.md` ("Age structure tool, Explore v2").

## The model (Explore)
`ApEnvMath.ageStructure.stable(tfr, e0)` and `lifeTable(e0)` in `environmental-science/assets/tools/math/age-structure.js`
(two new functions; the drills' `pyramid()` and everything else unchanged):
- Life table: a Siler style hazard (child deaths falling fast with age, a background, an adult hazard doubling about
  every 8 years). The child hazard is set so deaths before 5 follow a West model like level (38% at e0 30, 22% at 45,
  9.5% at 60, 3% at 72, 0.9% at 80), then the adult level is solved so the life expectancy at birth is exactly the one
  set (teaching model; recalibrated in review round 1).
- Women live e0 + 2.5 years, men e0 − 2.5; 105 boys per 100 girls; births by the mother's age peak in her twenties
  (the drills' schedule).
- Growth r from Lotka's equation; the shares are those of the stable population (no migration); CBR from births over
  people and CDR = CBR − 1000 r.
- Why not the drills' `pyramid()`: its survival curve does not have the life expectancy it is given (e0 80 came out
  near 71) and its growth uses 2.1 at every life expectancy. Switching the drills to the new model fails their
  validator (the drills' shares are fitted to real countries, which are not at their stable shape), so the drills keep
  theirs, and "?" and the About text say Explore shows the long-run shape.

## The design (Explore)
- **Scene:** sky (two pale clouds) over a paved town square; on wide screens a lamp and a planter at each end of the
  square, clear of the track. The pyramid stands on the square: 19 rows (0–4 to 90+; the drills' open 80+ is split into 80–84, 85–89 and 90+ here),
  males left in blue, females right
  in vermillion, each row a bar filled with small people side by side from the age spine outward (an SVG pattern
  anchored at the spine, so the last person is cut where the share ends). One fixed scale: 11% of all people at each
  end (the widest band anywhere in the ranges is 10.5%, the base at 7 children), with faint 5% and 10% grid lines and
  their ticks.
- **Main control:** the children per woman track on the square (1 to 7, step 0.1, ticks and numbers, caption
  "children per woman"). The mother stands on it at the rate with her knob at her feet (the kit's knob, `K.handle`);
  her children stand to her left, one per slot, the last cut at her position (a fraction is a part of a child). Drag
  her, her children, the track or the knob; arrows, Page keys, Home and End. The knob's tag says the rate ("5.0").
- **Replacement:** a dark mark on the track and "replacement 2.4" under it, at the TFR that gives zero growth for the
  life expectancy drawn (it moves when life expectancy changes; it is a mark, never a control).
- **Quiet control:** the life expectancy knob in the top right corner (30 to 85 years), with its label "Life expectancy
  60 years".
- **One number on the picture:** the growth pill in the top left: "Grows 2.6% a year" (green, an up arrow), "Shrinks
  0.8% a year" (rose, down), "About steady" (under 0.05%).
- **What happens:** the knob moves at once; the base row eases to the new rate first and each row above follows a little
  later (time constants from 0.05 s at the base to 0.5 s at the top), so the change climbs the pyramid as those children
  would grow up. Every row is drawn at the model's value for the rate it holds that frame, between the old and the new
  rate (never a value the model does not have). Life expectancy eases in tenths of a year. Reduced motion: the new
  pyramid at once with a 0.2 s cross fade.
- **Cause line (from what is drawn):** "5.0 children per woman → expansive → grows 2.6% a year → doubles in 27 years"
  (the rate the base holds, the shape word from the drawn rows by the drills' rule, the growth from the base row's model,
  70 / growth). Shrinking: "→ shrinks 0.8% a year → halves in 88 years"; steady: "→ about steady".
- **Takeaway:** after a drag that ends on the other side of replacement, once the pyramid settles: "Above replacement
  the population grows; below it, it shrinks." (two rows at 360 px, the cause line's height) Until the next
  change.
- **Cue:** "Drag the mother", left of her knob, once per device. Show me how: three callouts (the mother's knob, the
  pyramid, the life expectancy knob).
- **"?":** what the pyramid is (the long-run shape, no migration; real countries rarely sit at it), a live "Now:" line
  (rate, life expectancy, CBR and CDR), growth = (CBR − CDR) / 10 and the rule of 70 with the drawn numbers,
  replacement and why it is higher where many children die (with the live value), the three shapes, population momentum
  (UN WPP 2024, 79%), the dependency shares and ratio (live), the four stages table (moved from the stage chips), stage 5,
  the rows now (% each side), how it is drawn.

### What is on screen in Explore (counted at 1440, opening state)
Outside the picture: the purpose line (7 words: "How fertility today shapes a population's future"), "Show me how",
the cause line (4 pills, 14 words). About 22 words, no other control.
On the picture: the pyramid (19 rows of people, 19 age labels, or every other one when rows are short, "Males",
"Females", 4 grid ticks), the growth pill, the
life expectancy label and knob, the square with the mother, 5 children, the track with 7 ticks, its numbers, the
replacement mark and label, the caption and the knob's tag. No side panel.

## Explore against Test yourself
- Explore: free play, nothing graded, no goal.
- Test yourself: unchanged in content, grading and records (`T.drill` over `A.generate`): growth rate and doubling
  year, TFR from age rates, read a pyramid, the demographic transition stage, young and old shares; 12 contexts
  (`rate-young`, `rate-mid`, `tfr-high`, `tfr-low`, `tfr-near`, `shape-young`, `shape-even`, `shape-old`, `stage-1` to
  `stage-4`); partTopics `stage`, `cause`; ids `age-structure:<context>:<step>`; `?seed=` and `#quiz` open it; its
  figures (the old pyramid and the transition chart) as before.

### What moved (nothing dropped)
| From the old tool | Where it is now |
|---|---|
| TFR slider (1.0 to 7.0, step 0.1) in the panel | Explore: the mother on the children per woman track (same range and step) |
| Life expectancy slider (30 to 85) behind "life expectancy" | Explore: the quiet knob in the top right corner (same range) |
| Stage chips 1 to 4 | Test yourself (the stage drills, unchanged) and "?" (the stage table with every value and the why); not in Explore because the transition through time is the HuG Population lab's screen |
| The transition chart beside the pyramid (birth and death rate curves, the shaded gap, a marker) | Test yourself's stage figures (unchanged); "?" gives this setting's CBR and CDR and the growth formula with them |
| Under 15 and 65+ brackets with their shares | "?" (the shares and the dependency ratio, live) |
| Growth rate, doubling time | The growth pill on the picture and the cause line |
| Tap a bar (or arrows) to read a band | "?" (every row's % for both sexes, live) |
| Numbers & settings table (ages 15 to 64, CBR, CDR, growth, doubling, the bars) | "?" |
| The "Start here: try stage 3" hint | The one cue, "Drag the mother" |
| Drill types, contexts, ids, `?seed=`, `#quiz`, the Premium card when locked | Unchanged |

## What was built
- `environmental-science/assets/tools/age-structure.js`: a new Explore (`explore()`), the drill (`quiz`, `doneLine`,
  `figure`, `pyrSvg`, `transSvg`) unchanged; test hooks `window.__age` (read only, plus `set` for sweeps).
- `environmental-science/assets/tools/math/age-structure.js`: `lifeTable()` and `stable()` added and exported.
- `environmental-science/assets/tools/age-structure.css`: the `agv-` styles appended (the drill's `ap-` styles kept).
- `environmental-science/data/pages.json`: `"kit2": true`; `data/tools/age-structure.json`: the About text says what
  Explore draws. Rebuilt with `build-apenv`.
- No change to the kit, the APES adapter, any other tool or `scripts/check-tool-use.mjs`.
- Sweep, frames and perf: `scripts/tools-v2/apenv-age-structure-sweep.mjs` (`--frames`, `--perf`, `--shots`, `--height`).

## Checks run (2026-11-24)
- `node --test scripts/test/apenv-*.test.mjs`: 187 pass (one new model test: each life table has exactly its life
  expectancy, no growth at replacement, replacement falls as life expectancy rises, CBR − CDR = growth, the three
  shapes, every band under the 11% scale, deaths before 5 near 38% at 30 years). The build test's fixture copy of `pages.json` carries the new `"kit2"`.
  `check-apenv-content` (0 failing), `build-apenv --check`, `build-apcalc --check`, `build-apmacro --check`,
  `check-site` (no broken references), `check-weight --check` (all 626 budgets within range).
- `check-tool-use` with a local, uncommitted copy of its list plus this tool: tool-open, tool-touch(explore),
  tool-mode(quiz), tool-use; nothing sent under automation. The script itself is unchanged.
- Sweep, one width per process at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920, light and dark (the dark run
  asserts the page is dark), each at its screen height: 10 runs of 36 states and 1088 checks, 0 failures (13 states
  per theme: the opening state, replacement, both ends of both controls, the four stage presets, three between; the
  first visit cue; a real drag across replacement and its takeaway; a drag that grabs the mother herself; the screen fit
  before and after; Test yourself). Checked: clipping, 4 px between every text and from the knob's tag, no text under
  11 px, the knobs and the tag cover no text, the pyramid the largest object, every row's width against the model at the
  fixed scale, the pill, replacement mark and label, cause line, children and mother against what is drawn, the scene
  the same size in every state, at least three shapes shown, phone cause line at most two rows and one height (the
  takeaway too), no sideways scroll, no console errors. The phone widths were run again after the last change (the
  track moved left on phones).
- Frames (`--frames`) at 390 and 1440, mouse and real touch (CDP touch events, also at the scrolled end of the page):
  a slow drag 5 to 1, a fast drag 1 to 7, a reversal mid change, Home, End and Page keys, the life knob both ways: about
  1,000 to 2,000 frames per width, 0 problems (every row drawn at the model's value for the rate it holds, between the
  rates the run passed through; on one way changes no row above leads the base; the pill, cause line, replacement and
  aria-valuetext read what is drawn; at rest every row is the target). Leaving for Test yourself mid change stops the
  loop and Explore comes back right; reduced motion shows the result at once with the cross fade.
- Perf (`--perf`, CPU x4, the flagship in the same run, machine load about 2.5 on 2 cores): 390 px, the mother end to
  end and back median 16.7 ms, p95 33.4; life expectancy end to end median 16.7, p95 33.3; flagship median 33.4, p95
  83.3. 1440 px: mother median 16.7, p95 33.4; life expectancy median 16.7, p95 50.1 (at the limit); flagship median
  50.0, p95 100.0. One rect per row and side (a pattern fill), the model memoised per thousandth of a rate, whole year
  life tables warmed after load and tenths mixed from them.
- Behaviour (Playwright): keys move the knob and the live region says the new chain; Show me how opens the three
  callouts; "?" shows the live numbers; `?seed=` opens the same drill twice; a wrong answer in Test yourself gets its
  feedback; no page errors. Without Premium the page shows the Premium card and no stage (unchanged).
- Preview: `node scripts/tool-preview.mjs environmental-science/tools/age-structure.html
  /mnt/user-data/outputs/apenv-age-v2/index.html`; shots in `/mnt/user-data/outputs/apenv-age-v2/shots/` (every sweep
  state at 390, 768 and 1440 light, three in dark, the first visit, the takeaway, the full screen, Test yourself;
  `mid-*-a/b/c` are 180 ms, 430 ms and settled after a jump from 5 to 1.5 children and 60 to 80 years).

## Review round 1 (2026-11-24): BLOCK, fixed
Review: `/home/claude/review-apenv-age/REVIEW.md`. The model and the build held.
- M1: under the "?" stage table, a line says its rates are today's for a country in that stage and Explore shows where
  the same settings lead (stage 4's settle into a shrinking population). Stage 1's pair (6 children at 32 years cannot
  give 0.2% growth) is in `docs/apenv-needs-author.md`.
- M2: "?" says that where many children die (life expectancy under about 45) the shape alone does not tell growth.
- S1: a press on the mother keeps the spot under the finger (`grabOff`); the sweep presses her without moving.
- S2: she stands further right of her rate (0.32 of her height plus 3 px) and the children are drawn in front of her,
  so a part of a child shows.
- S3: a row within half a pixel of its target snaps there; time constants 0.045 s at the base to 0.25 s at the top, so
  a change settles in about a second and the takeaway follows promptly.
- S4: the mother and the children's cut follow the base row's eased rate (the knob stays instant), so key jumps and
  taps walk her there; the sweep's agreement check reads her position from that rate.
- S5: Explore's top band is split into 80–84, 85–89 and 90+ (19 rows; 85+ alone still reached 12.8%), the scale is 11%
  (about 36% wider), grid lines at 5% and 10%.
- S6: child deaths follow a West model like level (`Q5`): 38% before 5 at 30 years; replacement 4.0 at 30, 2.4 at 60,
  2.1 at 80. Every text with the old values is updated.
- S7: the first visit cue sits left of the mother at head height, clear of the replacement mark (now checked by the
  sweep), the numbers and the age labels; it overlaps the heads of the children beside her until the first touch.
- S8 and nits: performance re-timed below; Japan about 11% under 15 in the needs-author note; the drills' pyramid says
  "Males" and "Females" (text only).
- Fix round checks: see the end of this file.

## What I am not happy with
- The pyramid now uses an 11% scale (19 rows); at the opening state it is still about two thirds of the stage width,
  less on a phone.
- Explore's stable shape and the drills' fitted pyramids differ for low fertility countries (Explore ages more); "?"
  and the About text say so, and it is in `docs/apenv-needs-author.md`.
- The life expectancy drag at 1440 sits at the p95 limit under load (50.1 ms); the mother drag is well inside.
- The lamps and planters on wide screens are plain; the square could carry more life without reading as data.

## Fix round checks (review round 1, 2026-11-24)
- Sweep at 360, 390, 1024 and 1440, light and dark: 38 states and 1090 checks each, 0 failures (new: a press on the mother
  without moving keeps the rate; the cue clear of the replacement mark; mother and children read from the base row's
  rate). 390 was run again after the last change (rows snap only once the row below has), 0 failures.
- Frames at 390 and 1440, mouse and touch: 0 problems, and a change now settles in about a third of the frames it took
  before (for example the fast drag 1 to 7 at 390: 46 frames, was 159).
- Perf (CPU x4, machine load about 4 on 2 cores, the flagship in the same run): 390 px mother median 16.7 ms, p95 33.4;
  life expectancy 16.7, 33.4; flagship 33.4, 83.3. 1440 px mother 16.7, 50.0; life expectancy 16.7, 33.4; flagship
  49.9, 99.9.
- `node --test scripts/test/apenv-*.test.mjs` 187 pass (the model test now checks deaths before 5 near 38% at 30 years,
  replacement about 4.0, 2.4 and 2.1, 19 rows and the 11% scale), `check-apenv-content`, `build-apenv --check`,
  `build-apcalc --check`, `build-apmacro --check`, `check-site`, `check-weight --check`: all clean.
