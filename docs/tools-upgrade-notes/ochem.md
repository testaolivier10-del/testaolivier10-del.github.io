# U-Ochem notes (tools upgrade, Phase 2)

Branch `claude/tools-upgrades-ochem`. All eight Ochem tools touched; every existing mode, quiz (`tool-quiz.js`),
URL param and handoff kept. New tests: `scripts/test/ochem-tools-upgrade.test.mjs` (10). New styles live in
`ochem/assets/tools.css` (each block headed by its tool). No new runtime files; `sw.js` untouched.
Mid-interaction screenshots: scratchpad `after/ochem/` (`rp-*`, `ab-*`, `sp-*`, `rr-*`, `v3-*`, `cf-*`, `res-*`, `ap-*`).

## Per tool

**Reaction Predictor** (flagship 8). Job: predict SN1/SN2/E1/E2 from substrate, reagent, solvent and heat, and
see which factor decided it.
- Now: the substrate is drawn (alpha carbon and leaving group ringed, beta-H count read off the drawing) with the
  reagent beside it; conditions are chips and two toggles; a four-corner meter (substitution top, elimination
  bottom; cation-first left, concerted right) shows each pathway's share, the factors pulling on it and the
  blocked ones struck through with the reason, and a puck sits at the weighted centre. Explore mode moves at
  once and says what the last change did ("Reagent moved E2 from 65% to 100%"). The mechanism arrows for the
  winner are drawn on the substrate (SN2 backside, E2 three arrows with the chosen beta H, SN1/E1 step 1).
  The product is drawn. Predict first keeps commit-then-reveal (the corners are the answer buttons); `?mode=predict`.
- Engine: `say()` now carries per-pathway votes mirroring each "argues for" line, and `out.blocked`. Verdicts,
  mixtures and products unchanged. `OchemBuilder.parseRing` added (ring + substituents, no global mutation).
- Owner check: the meter at 390px and its reading order; the "Draw your own" path still classifies and draws.

**Acid/Base Comparator.** Job: rank acids by measured pKa and say which ARIO factor explains each gap.
- Now: every acid is drawn (mol-builder parse; HCl/H₂O hydrogen-first labels). Rank four: four drawn cards,
  drag (or tap-swap, or arrow buttons) into order, "Put them on the pKa line": pins slide to the measured
  values and each neighboring gap is explained by `analyse()` (or flagged where the rules disagree).
  Which proton: the molecule is drawn and each candidate proton's atom is a tap target; chips remain.
- Fixed: `?mode=rank|site` links were reset by the first render; site select had no name.

**Spectroscopy Lab.** Job: connect each signal to the hydrogens that make it.
- Now: the NMR panel draws the molecule beside the spectrum; tap a signal and its atoms light up with
  shift, integration, multiplicity and the why; tap an atom and its signal lights up (styrene's =CH₂ cycles
  its two signals). Tabulated compounds use a per-signal atom map (tested against integrations);
  predicted ones use `keys` now returned by `spectra-predict.js`.
- Fixed: `?c=` links always opened ethanol; IR svg was role=img around focusable peaks (now named group).

**Reagent Roadmap.** Job: get from one group to another, reagent by reagent.
- New Synthesis puzzle mode: start A and target B on the map, a bench of reagent tiles (every reagent that
  still leads to B, up to two that work but go elsewhere, three that do nothing here). Each tap applies the
  step: the map badge and route trail animate, a card says what happened and how many steps remain, a dead
  end is flagged at once, a decoy says which group it is for. Undo, New, `?m=puzzle&pz=a.b`. Judged by the
  route engine from the current pattern set (`routes()` takes `opts.set`). Test plays all 360 puzzles.

**3D Molecule Viewer.** Job: see a molecule's real shape and name it.
- New Predict shape mode: random molecule at a random angle, labels, lone pairs and readout hidden, central
  atom ringed; name the shape (and the angle where the model is the textbook value), Check restores
  everything with the measured angle and the electron-group count. Formamide left out of the pool (its N is
  drawn delocalized).
- axe fix: `#v3Svg` is `role="group"` with a name (it holds focusable atoms). On phones the model now comes
  before the molecule list.

**Conformation Lab.** Job: see why one chair beats the other.
- Now: tap any substituent on either chair and the ring flips (animated pucker inversion, rebuilt from the
  same geometry; reduced motion jumps). A strain meter draws each chair's A-value terms as stacked segments.
  "Find the stable chair": random 1-2 substituent ring, numbers hidden, flip until the left chair is better,
  commit. Phones get both chairs side by side above the presets. Newman half unchanged.

**Resonance Explorer.** Job: find every resonance form and see where the charge really is.
- New "Where the charge sits" overlay: halo per atom sized by its average formal charge over the forms found
  so far, labelled as a fraction (phenoxide: −2/3 O, −1/3 C after three forms); it spreads as forms are added.

**Arrow Pusher.** Job: draw the arrows that turn a start into a product.
- New Mechanism challenge source: seven mechanisms (SN2, acid-base, SN1 step 1, C=O protonation, aldol
  addition, acyl substitution and Claisen in two steps). Target drawn; check each step; correct when the
  product matches the mechanism's structure atom for atom (any equivalent arrow set counts); wrong checks say
  what the arrows did, one move not in the step and where something is missing; one-arrow hints. `?chal=`.

## Checks

build-tool-pages, ochem figures, notes pages, crumbs, curriculum `--check`: OK. check-site: OK. check-weight:
within budgets (ochem shell 111.4/112, no change: tool scripts are page-only). `node --test`: all pass except
`anp-tool-kit.test.mjs` (2 tests read `GROUP_CONTENT` from `nremt/body-map.html`, which P1 moved into
`body-viewer.js`; not touched here). check-a11y: no serious/critical. Own axe pass over all eight tools in
their new modes, light and dark: clean. check-console: 1207 of 1207 pages clean.

## For accuracy review

No pKa, A-value, chemical shift, or reaction outcome was added or changed; these are newly relied on or newly
drawn:
1. Reaction Predictor votes (`say()` in `reaction-predictor.js`): each existing "argues for" string as weights
   (1, 0.5 for "mildly"/"either", 0.25 for room temperature). Blocked reasons: methyl (no SN1/E1/E2), 1° (no
   SN1/E1), neopentyl (all four slow/blocked), 3° (no SN2), benzylic (no E1/E2, no beta H on ring side).
2. Drawn products: substitution = nucleophile atom on the alpha carbon (H₂O/EtOH solvolysis drawn as the
   neutral alcohol/ether after proton loss; NH₃ as the amine); alkenes = the existing Zaitsev/Hofmann choices.
   E2 arrows (`scene()`) take the beta H from the least substituted beta carbon with a bulky base and the
   most substituted otherwise, matching the Hofmann/Zaitsev product the tool names.
3. Spectroscopy per-signal atom maps (`NMR_ATOMS`): e.g. benzaldehyde 7.55 (3H) = meta + para, 7.87 = ortho;
   phenol 6.88 (3H) = ortho + para, 7.24 = meta; nitrobenzene/benzoic meta/para/ortho as labelled; hexyne
   1.45 (4H) = C4 + C5; cyclohexanone 1.72 = C4, 1.86 = C3/C5, 2.33 = C2/C6. All follow the existing labels.
4. Conformations A-values (kcal/mol, existing table, pinned by test): Me 1.70, Et 1.75, iPr 2.15, tBu 4.90,
   Ph 2.80, OH 0.87, OMe 0.75, F 0.15, Cl 0.43, Br 0.38; extra 1,3-diaxial term 1.6 (existing). The challenge
   explains with "the larger A-value goes equatorial".
5. 3D viewer angles asked: CH₄ 109.5, NH₃/CH₃⁻/H₃O⁺ 107 (only NH₃ asked), H₂O 104.5, BF₃/ethene/formaldehyde/
   CH₃⁺ 120, ethyne/CO₂/acetonitrile 180, PCl₅ and SF₆ smallest 90; dimethyl ether shape only (model 111°).
6. Resonance overlay: plain average of formal charges over found forms (on-screen caveat that major forms
   weigh more). Test: charge conserved for nine species; acetate O −1/2 each.
7. Arrow-pusher challenge answers (arrow sets in `CHALLENGES`): standard textbook arrows; acyl substitution and
   Claisen as addition then collapse (tetrahedral intermediate shown between).
8. Acid/base ranking explanations reuse `analyse()`; sets are drawn at least 1 pKa unit apart.

Also logged in `docs/ochem-needs-author.md` ("Tools upgrade (2026-10, U-Ochem)").

## Left / weaker than planned

- Reaction Predictor: mechanism arrows are drawn for step 1 only on SN1/E1 (the cation's second step is
  described, not drawn); "Draw your own" substrates get arrows but no drawn product (unchanged policy).
- Arrow Pusher challenge: seven fixed mechanisms; no free-form "any start" challenge.
- Conformations: no drag gesture to flip (tap is the flip); drag stays rotate.
- Quizzes (tool-quiz.js) unchanged; the new modes keep their own score line rather than feeding Review.
