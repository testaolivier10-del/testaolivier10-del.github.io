# Plan: AP® Biology, Cell cycle checkpoints (tools v2)

**Tool and page:** `bio/tools/cell-cycle-checkpoints.html`; `bio/assets/tools/cell-cycle-checkpoints.js` (403
lines), data `bio/data/tools/cell-cycle-checkpoints.json` (growth factor and DNA damage ranges; mutations `p53`,
`rb`, `cycd`, `ras`; drug `spindle`; 9 outputs; 5 series). Premium. Rollout row 87, group P, wave 11, size rework.

**The one idea:** checkpoints stop damaged cells from dividing; break one and damaged cells divide. Two tabs:
"Damage" (DNA damage and the G1/S, G2/M and spindle checkpoints, p53) and "Growth signals" (growth factor, Ras,
cyclin D and Rb decide whether a cell leaves G1).

## Research
- [HHMI BioInteractive, The Eukaryotic Cell Cycle and Cancer (LabXchange)](https://www.labxchange.org/library/items/lb:LabXchange:befc2181:lx_simulation:1):
  tap a checkpoint, see what passes and what a mutation does; take the cycle ring with gates.
- [Ohio State, cell cycle regulation and cancer](https://cwis-clse.asc.ohio-state.edu/r687/cell_cycle_regulation_and_cancer):
  proto oncogene vs tumor suppressor framing; take the two kinds of broken switch.
- PhET (group row) for instant response; no PhET cell cycle sim exists (known). Builder: open the first two.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Tap a checkpoint on the ring | Damage tab: main control (tap a gate to break or mend it) |
| DNA damage slider | Damage tab: quiet handle on a UV lamp over the dish |
| Growth factor slider | Growth signals tab: main control (a dropper of growth factor over the dish) |
| Mutations p53, Rb, cyclin D, Ras; spindle drug; All working | Damage tab: p53 and spindle drug as quiet taps; Growth tab: Ras, cyclin D, Rb as quiet taps; "All working" is Start over |
| Graphs: over time, against growth factor, DNA content histogram; Output to plot | "?" (all three graphs with the model table), log it; the dish shows the counts |
| Read the dish at slider | Time bar (K.scrub) with Watch it |
| Run one trial, Run a series, Clear runs | "?" (series table), log it |
| Find the broken checkpoint mode (Check, Next dish; ids `cell-cycle-checkpoints:find-<id>:a`; `#find`) | Test yourself "Find the broken checkpoint", same ids |
| Questions (5 ids `cell-cycle-checkpoints:dish:1..5`), stimulus `cc-s1`, mini FRQ | Test yourself, unchanged |

## Design
- **Picture:** a culture dish seen through a microscope eyepiece (round field, soft vignette). Cells drawn as cells:
  G1 small, S with a replicating nucleus, G2 larger, M with condensed chromosomes and a spindle, damaged cells with a
  red broken DNA mark, dying cells blebbing. Over the field, the cell cycle drawn as a ring with three gates
  (G1/S, G2/M, spindle) as small barriers that close on damaged cells.
- **Main control (Damage):** tap a gate. A working gate holds damaged cells (they queue at it, then repair or die);
  a broken gate lets them through and damaged cells divide on the field (their daughters inherit the red mark).
- **Growth signals tab:** drag the dropper: more growth factor sends more G1 cells past the restriction point; a
  Ras or cyclin D tap makes cells pass with no factor at all; Rb broken does the same.
- **Animates:** cells move round the ring as dots matched one to one to the cells on the field; divisions split a
  cell in two; deaths fade with blebs.
- **Cause line:** "p53 broken → G1 gate open → damaged cells copy their DNA → 18 damaged divisions".
- **Takeaway:** "A broken checkpoint lets damage pass to daughter cells: a step toward cancer."
- **Outside the picture:** 2 tabs, purpose line, Show me how, time bar, cause line. Under 30 words.

## Science to verify
- p53 arrests at G1/S (and G2/M) and triggers apoptosis; Rb holds E2F until cyclin D CDK4/6 phosphorylates it; Ras
  as a proto oncogene (gain of function), p53 and Rb tumor suppressors (loss) (NCBI Bookshelf: Alberts, Weinberg
  "The Biology of Cancer"; CED 4.7).
- Spindle (metaphase) checkpoint waits for kinetochore attachment; a spindle drug arrests in M.
- Phase durations in the model (hours) plausible for cultured human cells (about 24 h cycle).
- Trap: no "the cell decides"; mechanisms only. No OpenStax.

## Reuse
`ApBioTools.studioKit2` (parts Find the broken checkpoint, Questions). Kit: `K.tabs`, `K.tap`, `K.drag`, `K.scrub`,
`K.player`, `K.cue`, `K.cause`. Not the first AP® Biology tool on kit2.

## Risks reviewers will likely block on
- The ring dots and the field cells must be the same cells (counts agree every frame).
- Gate labels (G1/S, G2/M, spindle) at 11 px or more and clear of the ring dots at 360 px.
- Irreversible: a dead cell does not come back when a gate is mended (rule from the builder brief).
- Perf: cap the dish at about 80 cells; split cells reuse elements.
