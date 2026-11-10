# AP® Microeconomics, author E self-review (Units 5 and 6)

Date 2026-11-09. Brief `docs/apmicro-briefs/e.md`. Every topic and FRQ below passes
`node scripts/check-apmicro-content.mjs --topic <id>` with no failures or warnings; `check-apmicro-map.mjs` reports
"Nothing is used before it is taught"; my four FRQs pass `checkFrq`; the bank-wide test-wise and near-duplicate rules
show nothing for my items (checked against the whole bank as it stood). Scratch build with
`APMICRO_PUBLISHED=unit-5,unit-6 --out /tmp/mic-e/out` built all 9 topics (61 files).

## Topics (all complete: lesson, notes, questions, glossary, figures)

| Topic | Items | Graph | Numeric | Sets | In sets | Apply/analyze | Notes words |
|---|---|---|---|---|---|---|---|
| factor-markets (5.1) | 20 | 0 | 6 | 3 | 50% | 85% | 843 |
| factor-demand-supply (5.2) | 20 | 4 | 1 | 3 | 50% | 90% | 814 |
| competitive-factor-markets (5.3) | 20 | 5 | 5 | 2 | 40% | 90% | 890 |
| monopsony (5.4) | 21 | 7 | 4 | 3 | 48% | 95% | 843 |
| market-efficiency (6.1) | 20 | 5 | 4 | 3 | 45% | 85% | 827 |
| externalities (6.2) | 23 | 8 | 4 | 3 | 43% | 96% | 866 |
| public-goods (6.3) | 16 | 0 | 1 | 3 | 63% | 88% | 748 |
| intervention-structures (6.4) | 20 | 5 | 3 | 3 | 50% | 90% | 832 |
| inequality (6.5) | 19 | 4 | 2 | 3 | 53% | 89% | 816 |
| **Total** | **179** | **38** | **30** | **26** | | | |

Graph items cover label, shift with equilibrium, point, line and shade on the `labor`, `monopsony`, `sd-micro`,
`monopoly` (incl. `natural`), `externality` (all four types) and `lorenz` kinds; every shade item names the engine
region and states its edges. Every numeric key is an `ApMicroCalc` recipe with the reader-report slip as a mistake
(MRP = MR × P, MFC = wage, monopsony wage from MRP or MFC, rectangle instead of triangle, old quantity for tax
revenue, cumulative vs single share). 5.1 and 6.3 have no engine graph: 5.1's graph is the MRP schedule (a figure
and a data set) and 6.3 has none on the exam.

Figures: 13 SVGs, `scripts/apmicro-figures/author-e.mjs` (run it to regenerate; it also writes
`microeconomics/data/figures/<topic>.json`), drawn in the engine's coordinates and cost model so MC passes through
ATC's minimum. Rendered to PNG and checked for overlapping labels.

## FRQs (all pass checkFrq)

- `frq-labor-market-long` (10): side-by-side labor graph (labels, wage line, hire point: auto), wage taker,
  MRP calculation, hire decision with MRP vs MRC, product demand rise (DL shift, outcome: auto), the derived-demand
  chain with every link. Units 3 and 5.
- `frq-hiring-table-short` (5): MRP from a table, where diminishing returns begin, hire 3 and why, rent changes
  nothing.
- `frq-monopsony-short` (5): graph with labels and the hire point (wage on SL), shade the wage bill, minimum-wage
  hiring point, why MFC > W.
- `frq-externality-short` (5): labels and efficient point, market vs efficient quantity, shade DWL, \$3 corrective tax.

## Map edits (smallest Edits)

- Added concept `club-good` (taught in `public-goods`).
- Added 21 stimulus themes (9 to unit-5, 12 to unit-6) for the sets I wrote; each unit now has data, graph and text.

## Open points

- `docs/apmicro-needs-author.md` entry `unit-5-6-scope`: the MRP/price = 1 profit rule for inputs, "club good",
  and one Gini-area shading item (no Gini computed).
- Invented names were checked against the bank; five that other authors had already used (Dunmore, Wexmoor, Orrin,
  Garnet, Juniper) were renamed in my files.
- No runtime or generator change needed.
