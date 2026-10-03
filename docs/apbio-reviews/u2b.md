# AP® Biology accuracy review u2b (2026-10-03)

Branch `claude/apbio-review-u2b` from `claude/apbio-beta`. Topics: facilitated-diffusion (2.6),
tonicity-osmoregulation (2.7), transport-mechanisms (2.8), cell-compartmentalization (2.9),
compartment-origins (2.10). FRQs: frq-onion-plasmolysis, frq-endosymbiosis-model.
Checked against OpenStax Biology 2e 4.3, 4.4, 5.2, 5.3, 5.4, 23.1 and `docs/apbio-ced-map.json`.

## Changes

| Topic | Item | Was wrong | Fix |
|---|---|---|---|
| transport-mechanisms | bio-transport-mechanisms-16 (predict) | Variable "O₂ diffusing across the cell membrane" keyed "no change" after ATP synthesis is poisoned. Net O₂ entry depends on the cell using O₂; a respiratory poison collapses the O₂ gradient, so "no change" is arguably wrong (moderate). | Variable replaced by a small nonpolar test molecule the cell does not use, held at a fixed concentration outside: still "no change", now unambiguous. |
| transport-mechanisms | notes | "Plant cells, fungi and bacteria" use an ATP-driven proton pump to push H⁺ out. Most bacteria build their H⁺ gradient by electron transport, not ATP (minor). | "Plant cells and fungi". |
| transport-mechanisms | notes | "After a meal, the glucose level in the gut can be lower than inside these cells" read as a general claim (minor). | "As absorption goes on, the glucose left in the gut can fall below the level inside these cells". |
| transport-mechanisms | bio-transport-mechanisms-12 | Practice 2.A (visual) on an item with no visual (minor). | 1.B. |
| facilitated-diffusion | bio-facilitated-diffusion-16 | Practice 2.A on a text-only ordering item (minor). | 1.A. |
| facilitated-diffusion | bio-facilitated-diffusion-20, why for the "carry K⁺ when closed" option | Said the muscle ligand-gated channel "stays specific to its own ion"; the acetylcholine receptor passes both Na⁺ and K⁺ (minor). | "a gate does not change which ions the channel admits when it opens". |
| compartment-origins | lesson chain step 1 | Host stated as having "a nucleus and internal membranes", contrary to the endosymbiosis-host decision (minor). | "An ancestral host cell wrapped its membrane…". |
| compartment-origins | lesson chain step 5, notes table and evidence list | Mitochondrial ribosomes called "70 S"; human ones are about 55 S (moderate: false for human cells as written). | "Bacteria-like ribosomes"; notes say they are built like bacterial 70 S ribosomes and that sizes vary. |
| compartment-origins | notes, Common mistakes | Listed "two membranes because the bacterium had two" as a mistake; that view is current research (moderate). | Bullet replaced ("Mitochondria make all their own proteins"); one hedging sentence added to the double-membrane evidence; contested entry added. |
| compartment-origins | bio-compartment-origins-4 (why on the two-membranes option), bio-compartment-origins-6 (stem, why) | The host origin of the outer membrane stated as fact (minor). | Framed as "in the engulfing model" / "according to the model". The keys are unchanged. |
| frq-endosymbiosis-model | part a prompt, part b sample | Same outer-membrane point; sample said mitochondria have "70 S ribosomes" (minor). | Prompt says "According to the model"; sample says "small ribosomes built like the bacterium's 70 S ribosomes". Rubric unchanged (students saying 70 S still earn the point). |

Added to `docs/apbio-needs-author.md` (Contested science): **organelle-outer-membrane**, **mitoribosome-size**.

## Checked and fine

- Every numeric key recomputed: FD-3 (16%), FD-7 (12.1), FD-15 (100), TO-3 (2.60 g), TO-6 (−6 bars),
  TM-5 (25 mM), TM-7 (100×), TM-14 (0.67), CC-3 (8.3), CC-7 (4.6), CO-5 (85%); the tolerances accept honest rounding only.
  Worked examples (16%, 0.35 mol/L crossing, −5 vs −6 bars, 0.67 ATP, 8.3×, streptomycin) are correct.
- Chart and table data agree with the conclusions drawn: the glucose and X curves, the ouabain table, the potato and
  sweet potato zero crossings (0.35 and 0.50 mol/L) and error-bar overlap claims, the water-potential cells
  (A −5, B −6, C −2), the glucose-ratio time course, the sucrose and pH table, the enzyme pH curves, and the membrane
  table (both columns sum to 100%; the values match published EM estimates).
- Every key, distractor and per-option explanation in all 100 items; select-all and predict keys; order items.
- FRQs: every rubric point is gradeable, the samples earn every point, and the points sum to 4. The onion half-point
  (about 0.4 vs 0.5 mol/L) and the 35-point difference are right.
- All five figures were rendered and checked: the arrows, labels and gradient directions are correct.
- Originality: a 6-word shingle comparison with the OpenStax sections finds only stock phrases. There is no close
  paraphrase, and no CED or released-exam wording was found.
- Trademark: "AP®" is not used in these files.

## Left for a human

- transport-mechanisms-s1 replaces Na⁺ with K⁺. High outside K⁺ also depolarizes the cell, so the swap is not a
  single-variable change, which bears on the key of TM-4. Labs use choline or N-methyl-D-glucamine. The items stay
  consistent as written; consider switching to choline.
- The osmosis "bound water" picture (lesson chain step 1) is already logged as **osmosis-mechanism**.
