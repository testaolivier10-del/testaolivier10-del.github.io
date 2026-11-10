# Scale lab (`scale-lab`): builder T2 report (2026-11-09)

Topic `scales-of-analysis` (contexts also `skills-scale`), free. Files: `human-geography/assets/tools/scale-lab.js`,
`.css`, `math/scale-lab.js` (`ApHugMath.scaleLab`), `human-geography/data/tools/scale-lab.json`,
`scripts/lib/aphug-tool-checks/scale-lab.mjs`, `scripts/test/aphug-tool-scale-lab.test.mjs`,
`assets/covers/tools/aphug/scale-lab.svg`. pages.json entry unchanged (already free, `studio: true`).

## What it does

- **Explore, Scale of analysis.** One invented data set ("share of people who walk to work or school") at four
  scales: global (world map, one value), regional (world shaded by the ten world regions), national (Country A as
  one unit, its value weighted by province populations with `ApHugCalc`) and local (Country A by province, values
  on the map). The national and local views share one outline: the 38% point (scale of the data, not of the map).
  Why: what the scale says and hides. Details: how the gap grows as units shrink, and the numbers. New data set
  draws fresh numbers (seeded), so no invented value looks like a fact.
- **Explore, Map scale.** Six ratios (1:5,000 to 1:100,000,000): a drawing of what a 10 cm map shows (streets,
  neighborhood, city, part of a country, Country A, the world), km per cm from `mapToGround`, large or small scale.
- **Test yourself** (five kinds): `identify` (six map cases on world, six region bases and Country A: the unit each
  value describes, then the scale; the slip "that is the map's size" is named), `across` (the gap a national
  figure hides, which question needs which scale), `chain` (five real, dated cross-scale cases: palm oil and Riau,
  Flint factory jobs, sea level and Miami Beach, Brasilia 1960, EU free movement and Poland 2004), `limit` (a
  source at the wrong scale: units too big, or too little ground), `mapscale` (cm to km with named slips: left in
  cm, in m, divided by 1,000; larger vs smaller scale).

## Checks

Validator sweeps 300 seeds per context and type; every key recomputed (scale from the map's own values, gap and
weighted mean, scale order and coverage rule, cm x denominator / 100,000); every drill map and 50 Explore data sets
pass `ApHugMap.check`; no value on a disputed place except on the regional map (`disputedOk`: a region's shade,
no position). Tests: 6 (data pass, seeds reproducible, the 38% point, slips, weighted mean, planted mistakes).
Screenshots 360 and 1280, light and dark: every scale, the ladder, three drill kinds, a wrong-answer feedback; no
console errors (only the sandbox's blocked external hosts).

## Accuracy notes

All numbers invented and labeled. Chain cases are settled and dated; the Flint and palm-oil links are written as
one reason ("some", "can"), not the only cause.
