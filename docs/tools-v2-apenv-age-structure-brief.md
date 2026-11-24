# Tools v2: AP® Environmental Science Age structure (brief and build notes)

Status: built 2026-11-24 (first build); waiting for the independent review. NOT merged.

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
  ratios raise it). The tool computes it from its own life table (2.1 at a life expectancy near 80, 2.4 at 60, 4.4 at
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
  every 7 years) whose level is solved so the life expectancy at birth is exactly the one set. Deaths before age 5:
  46% at e0 30, 17% at 55, 4% at 72, 0.3% at 85; close to the Coale and Demeny West tables (teaching model).
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
  square, clear of the track. The pyramid stands on the square: 17 rows (0–4 to 80+), males left in blue, females right
  in vermillion, each row a bar filled with small people side by side from the age spine outward (an SVG pattern
  anchored at the spine, so the last person is cut where the share ends). One fixed scale: 15% of all people at each
  end (the widest band anywhere in the ranges is 14.7%), with faint 5%, 10%, 15% grid lines and their ticks.
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
On the picture: the pyramid (17 rows of people, 17 age labels, "Males", "Females", 6 grid ticks), the growth pill, the
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
See the section filled in at the end of the build below.
