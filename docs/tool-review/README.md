# Tool purpose review: all 145 tools (2026-11-10)

Every scene of every tool was opened and used on desktop and phone. One file per course in this folder; Human
Geography is in `docs/tool-visuals-2026-11.md`. Brief the reviewers followed: `BRIEF.md`.

| Course | Leave | Fix | Redesign |
|---|---|---|---|
| NREMT | 4 | 4 | 0 |
| Anatomy & Physiology | 2 | 3 | 3 |
| Organic Chemistry | 5 | 3 | 1 |
| AP Biology | 9 | 8 | 2 |
| AP Chemistry | 4 | 4 | 0 |
| AP Physics 1 | 10 | 1 | 0 |
| AP Calculus AB | 6 | 4 | 0 |
| AP Calculus BC | 4 | 2 | 0 |
| AP Precalculus | 7 | 3 | 0 |
| AP Statistics | 8 | 2 | 0 |
| AP Environmental Science | 4 | 8 | 0 |
| AP Psychology | 6 | 4 | 0 |
| AP Macroeconomics | 3 | 3 | 2 |
| AP Microeconomics | 4 | 4 | 0 |
| AP Human Geography | 5 | 1 | 2 (scale lab done in PR #187) |
| **All** | **81** | **54** | **10** |

## Redesigns (the picture does not show the idea)
A&P pathway tracer, A&P predict the change, A&P calculators (70 of 89 have no picture), ochem reagent roadmap (in
part), bio design drills, bio signal transduction, macro indicators lab, macro multiplier lab, Human Geography
Model Studio (five blank models), Human Geography scale lab (done).

## Build order
1. Bugs and wrong pictures, no design question: blank stages (A&P missing step, bio operons mutant quiz), the
   selected chip losing its label on hover (`tool-studio.css` `.tchip:hover`), exp/log reflection leaving the plot,
   macro graph studio forex equilibrium, bio negative melting points drawn positive, env energy flow default and
   number format, physics pendulum labels cut off, BC series lab stopping at N = 40, AB curve analyzer flat edges.
2. Accuracy flags, each checked against a source before changing: NREMT labor scenario pin, ethanol O-H band, two
   reaction predictor outcomes, bio PKA and cAMP wording, env "Pave land" scope, env wind rotor losses.
3. Redesigns, mockup first, worst first: A&P (pathway tracer, predict the change, calculators), bio design drills
   and signal transduction, macro indicators and multiplier labs, Human Geography Model Studio, ochem roadmap.
4. The remaining fixes course by course (see each file).

Not fully tested: the two 3D tools (NREMT body map, A&P 3D anatomy) hang a headless browser after a tap; check by
hand. Bio tree-reading's Questions tab was not answered.

Corrected from the first thumbnail pass: physics collision lab and rotation lab are real drawn scenes (leave).

## Built (2026-11-10, branch `claude/tool-fixes`)

Owner: "Go ahead and do all of this." Every FIX and REDESIGN above was built, one builder per course in its own
worktree; what each changed, verified and left undone is in `done/<task>.md`. An independent A&P accuracy check
(`done/anp-accuracy-check.md`) found wrong pins on the new pathway and prediction figures; they were repaired
(`done/anp-pins.md`). The NREMT care drawings load on first use to keep the shell inside its weight budget
(`done/nremt-weight.md`).

### Left for the owner or a later round
- NREMT: the 8 new station step lists were written from memory of the NREMT skill sheets (re-read them against
  the sheets); AED pad placement shown for small children; the body figure is male in every case, the labor
  scenario included (`docs/nremt-needs-author.md`).
- A&P: 102 of 208 pathways and 189 of 377 predictions have no figure (19 predictions lost theirs in the pin repair: no right place on any figure) (molecular and method topics need new
  drawings); the 3D anatomy tool's body source is CC BY-SA, which the A&P spec does not allow
  (`docs/anp-needs-author.md`).
- Ochem: two reaction predictor outcomes are arguable (`docs/ochem-needs-author.md`). Env Sci: the cycles tool's
  "Pave land" numbers (`docs/apenv-needs-author.md`).
- Small: forces drill in the borders lab has no picture; multiplier lab drills use the old bars; a few phone
  layouts need a short scroll (bio design drills and signal cascade, A&P feedback loops); micro externality drill
  shades one area as a sliver (graph engine).
