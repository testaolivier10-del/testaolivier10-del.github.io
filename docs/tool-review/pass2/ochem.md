# Organic Chemistry: simplicity pass (pass 2, 2026-11-10)

Counts are from the opening screen at 1280x800 (and the busiest step named): labels on the picture, live numbers,
controls showing in the dock (a chip row counts as one control), words outside buttons. Screenshots:
`/home/claude/shots/pass2/ochem/` (`_land_d`, `_land_p` for every tool; `_before_d` for changed tools).

| Tool | The idea | Best way to show it | Verdict | Counts before -> after | What changed | Behind a tap now |
|---|---|---|---|---|---|---|
| Acid/base comparator | The stronger acid has the more stable conjugate base | Two drawn acids; after the call each loses H+ and shows where its charge spreads | SIMPLIFY | Compare two: card text 8 rows (formula, proton, base, pKa ?) -> 0 on landing, 1 per card (pKa) after the call; pKa said twice (caption and cards) -> once; stage words ~30 -> 2 names. Rank four: names on the pKa line before the check 4 -> 0 | Cards are name + picture; the pKa arrives with the answer; captions shorter (phone no longer cuts them); "Conjugate base (H+ gone)" | Formula, acidic proton and conjugate base of both acids: a table under the hint and under the reasoning (Why) |
| Arrow pusher | Arrows move electron pairs; the octet decides what is legal | One molecule, tap a lone pair or bond, then where it goes | LEAVE | 1 picture, about 10 atom labels, 1 live count, 4 controls | none | |
| Conformation lab | Energy follows the dihedral angle; bulky groups go equatorial | Newman projection read with its energy curve; two chairs with their shares | SIMPLIFY (chairs only) | Chairs: live numbers on the stage 6 -> 4 (each chair's kcal/mol repeated the strain bars) | Each chair shows its share only; the kcal/mol is on the strain bars | each chair's kcal/mol stays in the screen-reader text and in Why |
| Reaction predictor | Substrate, reagent and conditions decide SN1, SN2, E1 or E2 | The flask's two molecules over the 2x2 grid of paths; tap the one that wins | LEAVE | about 14 labels (atoms plus the grid's row and column names), 1 pill, 4 control groups | none (the grid's labels are what the student needs to answer) | |
| Reagent roadmap | Which reagent turns which group into which | Route: one molecule changing step by step, reagents on the arrows, the map as the overview | SIMPLIFY | Route map labels about 26 -> 16 (dimmed groups lose their formula), reagents shown twice (map pills and strip) -> once. Groups: 25 cards and 2 headings at once -> one direction (11 to 14 cards), arrows 25 -> 4; caption 30 -> 15 words. Reagent: lines per reaction card 6 to 7 -> 3; pills repeating the heading 2 -> 0 | Route reagents ride only the strip's arrows; zoomed map keeps the level names clear and shows whole levels (no half boxes); "On a benzene ring" on two lines. Groups: What it becomes / What makes it switch, one arrow per column | Groups: the other direction (one tap); Reagent: each reaction's example and notes ("Example and notes") |
| Resonance explorer | Push arrows to find every form; the real molecule is the hybrid | The molecule with arrows; the hybrid when every form is found | LEAVE (graphic fix) | unchanged: 1 picture, forms panel, 4 controls | δ− now red and δ+ blue on the hybrid and the charge map, matching the − and + badges (δ+ was red, δ− teal) | |
| Spectroscopy lab | Each peak is a bond or a set of hydrogens | The molecule above its spectrum; tap a band, its bond lights | SIMPLIFY (small) | Identify it caption 26 -> 19 words; fingerprint label 2 lines -> 1 on fixed-size charts (it ran into the axis on a phone) | as said | "illustrative pattern" stays in Explanation |
| Synthesis trainer | Plan a route forward and backward | Start and target molecules; pick the reagent for each step | LEAVE | 2 molecules, 4 reagent choices, 1 hint | none | |
| 3D molecule viewer | VSEPR shape and bond angle in 3D | One molecule to turn, the angle beside it | LEAVE | 1 picture, 1 live number, 4 controls | none | |

## Graphics quality
- Charge colors now agree across the course: red for negative, blue for positive (the charge badges, the conjugate
  base glow, the resonance hybrid and charge map). This is also the usual electrostatic-map convention.
- Reagent roadmap: the zoomed map no longer slides its level names under the first column or cuts a level in half.
- Acid/base Rank four: long molecules (3-chloropropanoic acid) are still drawn smaller than short ones, because each
  structure is fit to its card. A common scale would make every card small; left as is.
- Reaction predictor: the product sketch is still smaller than the substrate (review note on a LEAVE tool).

## Not simplified, and why
- Conformation lab keeps the Newman projection and the energy curve on one stage: the slider drives both, and the
  dot on the curve is the cause-and-effect.
- Spectroscopy Identify it keeps the IR and the NMR together: the task needs both spectra to answer.
- Reaction predictor keeps every substrate and reagent chip (two rows, each one control) and the grid labels.
- Reagent roadmap's Reagent mode stays a list with a long chip set: it is a lookup, and every reagent must stay one
  tap away. The conformation lab's nine torsion molecules stay one chip row for the same reason.

## Accuracy
No science changed in this pass. The charge colors were checked against the convention (red negative, blue
positive); the chair shares were recomputed (A value 1.70 kcal/mol gives 94.6% equatorial at 298 K). Nothing new for
`docs/ochem-needs-author.md`.

## Checks
`node --test scripts/test/ochem-*.test.mjs tool-content synthesis-trainer` (100 pass), `check-weight` (all within
budget), `check-site` (no ochem failure; the 2,425 "hard-coded chapter number" failures in other courses are unchanged).
