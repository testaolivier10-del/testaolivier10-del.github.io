# U-Bio-skills: notes

Branch `claude/tools-upgrades-bio-skills`. Nine AP® Biology skills/drill tools. Every tool keeps its graded
steps, problem codes (`?seed=`), worked sets, item ids and recording; the new visuals sit on top.

## Shared

- `bio/assets/tools/bio-skill-stage.js` (new, ~2 KB gz): pointer drag that survives SVG redraws, arrow-key
  handling, focus-keeping redraw, the Explore card, readout, and the "Try this" goal checklist.
  `scripts/build-apbio.mjs` loads it on skill and drill pages (not simulators). Not added to `sw.js`
  (per-tool scripts are not precached).
- **Engine (`bio-tools.js`): no changes.** Everything uses the Phase 1 `stage(host, state)` slot.
- `bio-tool-math.js`, additive only: `chiPdf(x, df)` (χ² density, drawing only) and `apportion(fracs, total)`
  (largest-remainder rounding to whole individuals). Unit tests in `scripts/test/apbio-tools.test.mjs`.
- CSS: one block in `bio-tools.css` between `Skills tools … begin/end` markers.

## Per tool

| Tool | Job (one line) | What changed | Owner should check |
|---|---|---|---|
| Chi-square | Decide whether counts depart from a ratio by more than chance | Explore: drag observed bars (or −/+, keys); each (o−e)²/e stacks into a meter on the χ² axis over the df's curve with the p = 0.05 line and 5% tail; verdict flips live; "Chance sample" draws from the null (tally shows ~5% false alarms); "Double the sample". Practice stage draws typed expected counts, df curve, critical value and χ², then the true ones. | Chance-sample tally wording ("type I error") |
| Hardy-Weinberg | Go between allele and genotype frequencies | Explore: Punnett square split at p (cell areas p², pq, q²) beside 100 individuals by genotype shape; drag the corner or slider; goals incl. "16% recessive". Practice: counted individuals (recessive mode: affected vs "can't tell"), square split at typed p or 1 − q. | Shapes: circle AA, dotted circle Aa, square aa |
| Descriptive stats | Summarize a data set and its uncertainty | Explore: dot plot, drag dots; mean (solid) vs median (dashed), ±1 SD band, ±1 SE bracket; add/remove dots to see SE vs n. Practice draws typed mean/median/SD/SE. | Caption "about two thirds within ±1 SD" (normal-data rule of thumb) |
| Rates | Read a rate as a slope | Explore: generated catalase run (course generator, seed 2024); tap two points for a slope triangle with Δy, Δt, rate; up to 3 compared. Practice: typed rates drawn as slopes; percent-change problems show start/end bars and a ghost bar at start × (1 + %/100). | |
| Simpson | Measure diversity from counts | Explore: quadrat of organism icons (color + shape per species), −/+ per species, "Even it out (same N)", D meter where each species' (n/N)² is a block. Practice: the problem's community, typed D marked on the meter. | |
| Confidence intervals | Turn mean, SD, n into a 95% CI and read overlap | Explore: n and SD sliders (both groups, or each group under a disclosure), error bars resize, overlap/gap band and verdict. Practice: typed interval ends as brackets; off-scale values get a red triangle. | |
| Water potential | Find ψ and the direction water moves | Stage only (no explore, per decision 3): cell and beaker on one ψ scale, water surfaces at typed ψ, arrow from the picked direction; true levels after Check; link to the osmosis simulator. | |
| Graph builder | Build a full-credit graph | Grid first: the grid leads the builder (sticky beside the steps on wide screens), is drawn as a faint placeholder before a scale exists, and redraws with each axis, label and scale choice; the data table sits under it. Free plot mode: tap to add or remove sketch points, unchecked, not recorded. | The data card was merged into the builder card |
| Design drills | Design and argue from an experiment | Null hypothesis: word tiles (tap or drag) fill a 3-slot sentence. CER: highlighter pens tag sentences. Both set the same graded radios (under "Answer as a list instead"), so grading/recording are unchanged. Other drills unchanged. | Lower priority; variables/controls/predict drills still radios |

## Verification

- 390 and 1280 px, light and dark; student-run Playwright scripts per tool (`scratchpad/pw/bsk-*.mjs`).
- axe on all nine pages, light and dark, after an answer: no serious/critical issues.
- `build-apbio --check`, `check-apbio-content`, `check-site`, `check-weight --check` (bio/assets 44.8 of 50 KB;
  tool scripts load per page and are not in that bucket), `apbio-tools` tests: pass.
- Failing before and after this branch (not mine): `anp-tool-kit.test.mjs` 58 and 59 (body map labels).

## For accuracy review

- `ApBioMath.chiPdf`: χ² density from the textbook formula, with exact Γ(k/2). Tests check closed forms for df 1-4
  and that the area right of every formula-sheet critical value (df 2-8) is 0.05 (and 0.01). Drawing only;
  grading still uses `CHI_CRIT`.
- Chi-square explore text: "about 1 in 20 chance samples cross the line when the null is true" (p = 0.05);
  "doubling every count doubles χ²" (follows from Σ(o − e)²/e with o and e both doubled).
- Hardy-Weinberg explore: "2pq is largest (0.5) at p = 0.5"; "most copies of a rare allele are in carriers".
- Descriptive stats caption: "about two thirds of values within ±1 SD" (holds for roughly normal data; stated
  as "about").
- Confidence intervals explore: "to halve the error bar you need four times the n" (SE = SD/√n).
- Water potential: the picture puts ψ = 0 at the top and draws water moving from the higher to the lower
  surface; pressure potential "raises the cell's surface" (ψ = ψs + ψp).
- No new numbers in any problem, answer key or tolerance.
