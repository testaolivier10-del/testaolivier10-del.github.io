# Unit 2 review, part A (topics 2.1-2.5 and two FRQs)

Branch `claude/apbio-review-u2a` from `claude/apbio-beta`, 2026-10-03. Independent accuracy check
against OpenStax *Biology 2e* (4.1, 4.2, 5.1-5.4 fetched and compared) and `docs/apbio-ced-map.json`.
Scope: `cell-structure-function`, `cell-size`, `plasma-membrane`, `membrane-permeability`,
`membrane-transport` (lesson, notes, questions, glossary, figures, SVGs) and `frq-root-potassium`,
`frq-agar-shape`.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| cell-size | stimulus `cell-size-s1` | 2 cm cube depth 0.41 cm does not give the listed pink volume 1.73 cm³ (that needs 0.40; 0.41 gives 1.64), so item 2's key (78%) contradicted the table | Depth set to 0.40 ± 0.04, matching the notes' worked example |
| membrane-permeability | `bio-membrane-permeability-5` why | "10 billion times" slower than CO₂; 10⁻¹ ÷ 10⁻¹⁰ = 10⁹ | "about a billion times (10⁹)" |
| membrane-permeability | `bio-membrane-permeability-4` option 1 why | Garbled ("water's neighbors urea and glycerol") | Reworded with the molar masses |
| membrane-permeability | lesson hook | Said the protein was found in 1992; it was found in the late 1980s and tested in oocytes in 1992 | Timeline corrected |
| membrane-transport | stimulus `membrane-transport-s2`, notes | Cyanide-treated yeast "make no ATP", but yeast on sugar still make ATP by fermentation | Yeast grown on a fuel they can use only through mitochondria (not sugar) |
| plasma-membrane | `bio-plasma-membrane-9` | Strain "cannot make unsaturated fatty acids" yet grows at 37 °C (real such mutants cannot grow without added fatty acids) | Strain cannot change its fatty acid mix (stays at 45%); option whys adjusted |
| plasma-membrane | notes intro | "Stack about a thousand to match a red blood cell" is OpenStax 5.1's own comparison | Replaced with an original statement (needs an electron microscope) |
| cell-size | notes intro | 10-30 µm cells, "about 40" across a period (0.4-1.2 mm) | "roughly 15 to 40" |
| cell-structure-function | `bio/figures/cell-secretory-path.svg` | Step-4 "fusing" vesicle drawn ~50 px from the membrane | Vesicle now sits on the membrane; arrow retargeted |
| FRQ | `frq-root-potassium` | Part d calculates the K⁺ "concentration inside" from uptake alone, ignoring K⁺ already in the roots; sample said "can only be active transport" | Stimulus: seedlings grown without K⁺; sample also cites the nitrogen (ATP) result |

## Checked and fine

- All numeric keys and tolerances recomputed (22 + 20 + 20 + 20 + 20 items): e.g. 3/46 = 6.5% → 7,
  54/20 = 2.7, −44.1%, 9.6 × 0.5 = 4.8, 0.36/3 = 0.12, 10⁷, 29.6 mL, 3/r = 0.6, slab SA 40 cm².
- Every single/multi key, distractor and per-option why; practice tags plausible against the
  CED-map skill list; multi items within the half/two-thirds rules.
- Stimulus data: pulse-chase sums ≤ 100% at each time; Schmidt-Nielsen-type O₂ values; Frye-Edidin
  and Preston/Agre designs; penicillin/sucrose protoplast result; LDL 4 °C/37 °C pattern.
- Glossary entries for all five topics; the cube, fluid-mosaic, membrane-crossing and
  transport-mode SVGs (labels and values match).
- FRQs: points sum (9 and 4), every rubric line gradeable, samples earn every point.
  `frq-root-potassium` graphSpec (line, time vs K⁺, ±2 SE bars, two series) fits its part b.
  `frq-agar-shape` is an "investigation" FRQ and has no graphSpec (none needed); its SA:V values
  (3, 3.5, 5.25 per cm) are right.
- Originality: 7-word shingle comparison with the fetched OpenStax sections found no shared runs
  beyond stock phrases; no released-exam wording recognized. Trademark: no "AP" in these files.

## Left for a person (`docs/apbio-needs-author.md`, Contested science)

- **ion-accumulation-active**: K⁺ held 10-100× above the outside can be reached passively via the
  membrane potential; the course (like the exam) infers active transport from the concentration
  gradient alone (2.5 items 14-15, notes, `frq-root-potassium` d).
- **cholesterol-cold**: `bio-plasma-membrane-5` keys the textbook fluidity-buffer prediction.
- **aquaporin-gases**: `bio-membrane-permeability-18` keys CO₂ unaffected by aquaporin block.
