# Author E self-report: Unit 5 (2026-11-03)

## Topics done (7 of 7)

Each has a lesson, notes, questions, glossary and a figure; every check passes (`check-apmacro-content.mjs --topic`
clean for all seven, the full run reports 0 failing, bank and FRQ 0 failing).

| Topic | Items | In sets | Set kinds | Graph items | Numeric | Notes words |
|---|---|---|---|---|---|---|
| `policy-short-run` (5.1) | 17 | 12 | text, graph, data | 1 (adas) | 1 | 877 |
| `phillips-curve` (5.2) | 18 | 8 | data, text | 6 (phillips: label, 2 point, 3 shift) | 1 | 806 |
| `money-growth-inflation` (5.3) | 16 | 8 | data, text | 1 (adas, two shifts) | 5 | 765 |
| `deficits-debt` (5.4) | 15 | 7 | data, text | 0 (no graph in the topic) | 3 | 633 |
| `crowding-out` (5.5) | 16 | 8 | graph, text | 4 (lf: label, 3 shift+equilibrium) | 1 | 711 |
| `economic-growth` (5.6) | 16 | 7 | data, graph | 3 (ppc shift, ppc point, adas LRAS) | 2 | 714 |
| `growth-policy` (5.7) | 16 | 8 | text, data | 2 (adas AD, adas LRAS) | 1 | 634 |

114 items, 58 in sets; every topic at least 93% apply/analyze, one "Make it specific" chain per topic, key
longest at most 40% per topic. Every numeric key is an `ApMacroCalc` recipe with the reader-report slip as a
mistake (multiplying the gap, inverting M x V = P x Y, the sign of a deficit, adding a surplus to the debt).

## FRQs (4)

| Id | Type | Parts | Graph parts (auto points) |
|---|---|---|---|
| `frq-phillips-long` | long, 10 | A 3, B 1, C 3, D 2, E 1 | A adas (labels, shift, equilibrium), C phillips (labels, shift) |
| `frq-deficit-long` | long, 10 | A 3, B 1, C 3, D 2, E 1 | A adas (labels, shift, equilibrium), C lf (labels, shift, outcome) |
| `frq-phillips-short` | short, 5 | A 3, B 1, C 1 | A phillips (labels, point) |
| `frq-crowding-out-short` | short, 5 | A 3, B 1, C 1 | A lf (labels, shift, outcome) |

## Figures

Eight SVGs from `scripts/apmacro-figures/author-e.mjs` (run it to regenerate), registered in
`macroeconomics/data/figures/<topic>.json`: `policy-short-run-chains`, `phillips-curve-adas-link`,
`phillips-curve-supply-shock`, `money-growth-inflation-longrun`, `deficits-debt-flow` (invented numbers),
`crowding-out-lf`, `economic-growth-ppc-lras`, `growth-policy-channels`. No label masks.

## Map edits

`docs/apmacro-dependency-map.json`: unit-5 `tools.stimulusThemes` filled with the 15 sets written (data, graph and
text all present). No concept changes: the Phase 0 concepts covered every term taught. Ordering words avoided
rather than previewed (no "economic growth" before 5.6: crowding out speaks of "growth of potential output").

## Open points (needs-author, "Author E")

`e-lrpc-shift-srpc`, `e-phillips-long-run`, `e-crowding-out-curve`, `e-quantity-theory-scope`,
`e-growth-policy-scope`, `e-real-facts`, `e-frq-scenario`.

## Shared-file requests

- An FRQ-level text `scenario` field (generator FRQ page and `checkFrq`), so the scenario sits above the parts
  instead of opening part A (`e-frq-scenario`).
- A grader option for alternative graph keys (as `f-one-curve-keys`), so loanable funds prompts need not name the
  curve.
