# Builder T4 self-review: diffusion-lab, borders-lab, city-lab (2026-11-09)

Brief: `docs/aphug-briefs/t4.md` and `tools-common.md`. This file stands in for the three `tools-<slug>.md` reports.
Nothing committed (the lead commits). Scratch build: `APHUG_PUBLISHED=geo-skills,unit-1,...,unit-6 node
scripts/build-aphug.mjs --out /tmp/hug-t4`.

## Files written (only these)

For each slug: `human-geography/assets/tools/<slug>.js` (page), `.css`, `math/<slug>.js` (model, replaces the stub),
`human-geography/data/tools/<slug>.json`, `scripts/lib/aphug-tool-checks/<slug>.mjs`,
`scripts/test/aphug-tool-<slug>.test.mjs`, `assets/covers/tools/aphug/<slug>.svg`, and three entries appended to
`assets/covers/tools/aphug/index.json`. `pages.json` (and its fixture copy) unchanged: Phase 0 already registered
the three tools, Premium, on the Tool Studio.

## What each trainer does

**Diffusion lab** (topic `diffusion-types`; contexts also `migration-causes`, `forced-voluntary-migration`,
`women-population-change`). Explore: Country A with a fixed network of 36 places (capital, 4 cities, 9 towns, 22
villages), drawn at page pixel size. Diffusion: relocation, contagious, hierarchical, stimulus and a real mix, with
Play and a Step slider (steps shaded dark to light; changed versions are diamonds; relocation arrows animate).
Migration: push and pull, intervening obstacle, intervening opportunity, step, chain, Ravenstein, each as a 3-step
animated sequence. Drills: `diffusion` (hearth letter, type, relocation or expansion, a real case), `mixed`,
`migration` (three numbered factors on the map: push, pull, obstacle or opportunity, then the cause), `kinds`
(forced or voluntary, then refugee, asylum seeker, IDP, step, chain, guest worker, transhumance, rural-to-urban),
`ravenstein` (invented survey: a percent or net flow with ApHugCalc, then the law).

**Borders lab** (topic `defining-boundaries`; also `boundary-functions`, `devolution-factors`). Explore: an invented
borderland with a timeline (Play the years: towns appear, the border is drawn before or after; consequent follows a
language divide, superimposed cuts the Ardic people's land, geometric along 41°N, relict turns dashed with old
customs posts); state shapes (labeled as an older classification the current CED does not list); forces (tap
scenes: arrows in and out of Country A, regions pulled away shaded); sea zones (a ship slider through the UNCLOS
zones, 12 / 24 / 200 nautical miles); four real boundaries, each on its region base map through ApHugMap with the
border note (49th parallel, the former inner German border, Saharan colonial lines, Punjab 1947), dated and
"often classed as". No disputed place is marked or keyed. Drills: `boundary` (antecedent or subsequent from the
years, then the other type it also fits, then working or relict), `shape`, `forces` (centripetal or centrifugal,
then the devolution factor or the CED outcome), `sea` (the zones as a `stages` model item with authored slips, a
ship's rights at a distance, the EEZ overlap 400 - D).

**City lab** (topic `von-thunen`; also `city-structure`, `city-size-distribution`). Explore: bid-rent lines
(ApHugPlot) beside the rings they make (transport cost, price of milk, refrigerated trucks, a river; farm or city);
the seven CED city models with numbered zones and a key, side by side (stacked and scrollable on a phone; regional
models unnamed); central places on a hexagonal lattice by good (range, threshold); rank-size against a primate city.
Drills: `rings` (von Thünen rings model item with slips, then a change), `bidrent` (two bids with ApHugCalc, then
who gets the land), `models` (description to model, its limit; the concentric zones also as a model item),
`central` (people within range, open or not, highest-order good), `ranksize` (largest / rank, then the pattern).

## What was tested

- Validators: 300 seeds per context and type (diffusion 1,500 problems, borders 1,200, city 1,800), every key
  recomputed independently: the diffusion type is classified from the picture alone; boundary types from the
  story's years and clue words; zones from the 12/24/200 limits copied in the validator; bids, overlaps,
  percents and rank-size with plain arithmetic; every model step checked by ApHugModel and graded right. Also: the
  network inside Country A and 28 px apart, every listed hearth reads as its kind, von Thünen's order from the bid
  lines, refrigeration widens dairy, the real-case maps pass `ApHugMap.check`, no em dash, no Lee/Zelinsky,
  Griffin-Ford, McGee or de Blij, every case labeled invented. All three report 0 problems.
- `node --test scripts/test/aphug-tool-{diffusion,borders,city}-lab.test.mjs`: 12 pass (registration, pages.json and
  fixture, the sweep, model invariants, planted mistakes caught). `check-aphug-content.mjs --check`: no tool lines.
- Browser (Playwright, port 8824): screenshots at 360 and 1280, light and dark, of every Explore scene and drills.
  An automated sweep measured every SVG text and tag box: 40 drill seeds per tool at 360 and 1280, and 44 Explore
  states; crowding found and fixed (tags, letters at the edge, timeline years, ring numbers on a phone now callouts,
  plot labels). Final run: 0 overlaps except a 1 px overhang of a shared plot's top tick. No console errors.

## Requests for the lead (shared files; worked around locally)

1. **`tools/hug-tools.js` drill(), model steps crash.** `ApHugModel.mount(..., { onChange: function(){ if(!done)
   fb.innerHTML = ''; } })` runs before `var fb = el.querySelector('.cd-fb')`, and `mount()` calls `onChange` while
   it paints, so every model step throws (TypeError) and the Tool Studio layout is lost. Fix: move the `var fb = ...`
   line above `var mctl = ...`, or guard `if(!done && fb)`. Workaround: borders-lab.js and city-lab.js wrap
   `ApHugModel.mount` to hold `onChange` until it returns (marked; remove after the fix). T1's Model Studio will
   hit the same bug.
2. **Tool pages do not load `hug-map.js`.** In `scripts/build-aphug.mjs` `toolShell`, add `'hug-map.js'` to
   `extra` (before `hug-questions.js`). Workaround: borders-lab.js loads `../assets/hug-map.js` on demand.
3. **Model item in the Tool Studio dock.** `hug.css` switches `.hug-model-grid` to two columns at viewport
   `min-width:640px`, but the dock is narrow at every width, so slot names and pieces cramp. Suggest in
   `hug-tools.css`: `.ls-root .hug-model-grid{grid-template-columns:minmax(0,1fr)}` and
   `.ls-root .hug-model-art{max-width:220px}`. Workaround: the same rules in borders-lab.css and city-lab.css.
4. **`tools/hug-tool-math.js` diagnose()**: the sign slip says "Below the mean, a z score is negative." (a
   Statistics leftover). Suggest: "The size is right but the sign is wrong."
5. **`tools/hug-plot.js` at phone widths**: x tick labels touch the x-axis title, the 0 ticks of both axes overlap
   at the origin, and a two-series bar chart's in-picture legend overlaps the axis title and runs past the edge.
   Workaround: city-lab drops `xLabel` under 420 px (says it in the legend) and draws its own rank-size chart.

## Open points (for the accuracy pass, Phase 4)

- State shapes are not in the current CED; kept because the spec and brief list them, labeled as an older
  classification in Explore and every drill. Owner to confirm.
- Real cases (borders-lab `REAL`): wording and dates of the 49th parallel (1818, 1846), the inner German border
  (relict since 1990), Saharan colonial lines (the 1899 Anglo-French agreement as an example) and Punjab 1947
  ("told to follow, with other factors, where Muslim-majority areas met others"). Diffusion real cases: pizza
  (Italian immigrants, late 1800s to early 1900s), fashion (hierarchical), disease (contagious), potato or paneer
  burgers in India (stimulus).
- Ravenstein's laws are worded as usually taught (five of them); the women/men law is phrased from his 1885 paper.
- Southeast Asian model: the textbook "alien commercial zone" is written "Merchant minority commercial zone".
- All bid-rent, range and threshold, survey and city numbers are invented and labeled so.
