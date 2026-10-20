# Unit 1 and "Math you need" review (topics 1.1-1.11 and five math skills, two FRQs)

Branch `claude/apenv`, 2026-10-20. Independent accuracy check of author A's work (`docs/apenv-briefs/a.md`), to the
brief in `docs/apenv-briefs/review-common.md`. Scope: `intro-ecosystems`, `terrestrial-biomes`, `aquatic-biomes`,
`carbon-cycle`, `nitrogen-cycle`, `phosphorus-cycle`, `water-cycle`, `primary-productivity`, `trophic-levels`,
`energy-flow`, `food-webs`, `math-sci-notation`, `math-rates`, `math-units`, `math-percents`, `math-doubling`
(lesson, notes, questions, glossary; 233 items, 27 stimuli), the 16 figures from
`scripts/apenv-figures/unit-1-skills-math.mjs`, the 9 plot stimuli, and `frq-energy-flow-calc`,
`frq-primary-productivity-design`.

**CED.** WebFetch read the Unit 1 topic pages of the CED PDF (every learning objective and essential knowledge
statement for 1.1-1.11). No exclusion statements appear on the Unit 1 pages. The math chapter has no CED topic of its
own; its content was checked against the calculation types in `framework.md` section 7. Units 4-9 and the exam pages
were not read (as `ced-text`).

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| food-webs | `env-food-webs-12` (key changed) | "At which levels does the hawk feed?" keyed "Levels 3 and 4", but in the web grass → grasshopper → frog → snake → hawk puts the hawk at level 5 too | Options rewritten; key "Levels 3, 4 and 5"; distractor "Levels 3 and 4 only" with the frog chain as its explanation |
| carbon-cycle | `env-carbon-cycle-10`, `-11` (key form changed) | Unit was "billion metric tons", so the grader read the typed scale word as a factor: "10.8 billion metric tons" was marked wrong, and the authored mistakes (6.1, 7.9, 3.6) never matched | Keyed in metric tons (1.08 × 10¹⁰, 4.7 × 10⁹) with the recipe × 10⁹; stems ask for the scale word; a "dropped billion" mistake added. "10.8 billion metric tons", "1.08e10 t" now right |
| math-doubling | `env-math-doubling-7` (key form changed) | Unit "million": "24 million" was marked wrong; mistakes 12 and 48 never matched | Keyed 24,000,000 people (`askUnit: false`); stem asks to keep the scale word; mistakes 12 million, 48 million and "24" (scale dropped) |
| water-cycle | `env-water-cycle-10` | `rel: 0.01` marked the why's own rounded answer (2.4 × 10⁷; exact 2.363 × 10⁷) wrong | `rel: 0.02`; why shows the (1.7 / 100) setup and says both are accepted |
| math-units | `env-math-units-2` | `mustUse` "2" rejected the correct chain `... * 2000 W * 1 kW / 1000 W`; the authored "mistake" `2000 W / 1000` had the right value, so it could never trigger | `mustUse` 30 and 6; mistake replaced by the real slip (`* 2000 W`, watt-hours) |
| FRQ | `frq-energy-flow-calc` (keys changed) | Grassland GPP 25,000 and R 15,000 kcal/m²/yr are implausible (above any biome; the author's own table puts grassland GPP at 2,400). Authoring guide: invented data must be plausible | GPP 6,000, R 3,000. Keys: (a) 3,000 kcal/m²/yr, (b) 30 kcal/m²/yr, (c) 9 × 10⁷ kcal/yr; rubric, samples, checks and mistakes updated |
| intro-ecosystems | `env-intro-ecosystems-3`, notes worked example | Oxpeckers and zebras taught as clear mutualism; oxpeckers also feed on wound tissue and blood, and the relationship is debated (closer to parasitism in some studies) | Mycorrhizal fungus on pine roots (+/+), same key position; the notes' worked example uses it too |
| energy-flow | `env-energy-flow-6` option 2 why | "Even so" implied beef has more calories per kilogram than grain (dry grain about 3,500 kcal/kg, beef about 2,500) | Says calories per kg are not the reason; energy is lost to cattle respiration |
| energy-flow | `env-energy-flow-14` distractor | "Grazers eat just a tiny share of the grass" is partly true (uneaten plant matter is one reason less energy passes up), so a second defensible answer | "Energy is destroyed as grazers digest grass" (first-law trap) |
| phosphorus-cycle | `env-phosphorus-cycle-2` key | "It has no gas phase" | "no significant gas phase" (CED ERT-1.F.2 wording, as everywhere else in the topic) |
| math-sci-notation, math-rates | items sci-notation-3, -9; rates-1, -6, -8, -10 | Per-person answers keyed as plain kg, L, metric tons (content check warning) | Key unit kg/person, L/person, kg/student, metric tons/person; the plain unit still accepted |
| terrestrial-biomes | stimulus `terrestrial-biomes-s1` | Rendered: the two dual-axis legend entries overlapped, and the axis names touched | `width: 440`, series named "Temperature" and "Precipitation" (axis titles keep the units) |
| primary-productivity, water-cycle | stimuli `-s2`, `water-cycle-s1` | Rendered: the y-axis title ran into the tallest bar | y-range to 12 mg/L and 120% |
| food-webs | figure `food-webs-meadow` (generator) | Caption called the blue boxes "secondary consumers"; the snake and fox also feed at level 4 | "higher consumers"; figure regenerated (only this SVG changed) |
| aquatic-biomes notes | CED gap | ERT-1.C.2 (marine algae supply much of Earth's oxygen) and ERT-1.C.3 (fish distribution set by salinity, depth, turbidity, nutrients, temperature) not taught | One paragraph |
| primary-productivity notes | CED gap | ENG-1.A.5 (red light absorbed in the top meter, blue deeper; pigments for low light) not taught | One paragraph |
| terrestrial-biomes notes | CED gap | ERT-1.B.3 (uneven distribution of water and timber) not taught | One paragraph |
| food-webs notes | CED gap | ENG-1.D.2 (feedback loops in food webs) not taught | Section "Feedback in a food web" (lynx and hare, negative feedback; "positive feedback" left to 9.x as the map says) |
| nitrogen-cycle, trophic-levels, energy-flow notes | needs-author points | See below | "about doubled (or more)"; the wolf caution names the other factors; NPP named as the 10% base |

Changed keys: `env-food-webs-12` (Levels 3 and 4 → Levels 3, 4 and 5); `env-carbon-cycle-10` (10.8 billion
metric tons, now keyed as 1.08 × 10¹⁰ metric tons), `-11` (4.7 × 10⁹ metric tons); `env-math-doubling-7` (24 million,
now keyed as 24,000,000 people); `frq-energy-flow-calc` (a) 10,000 → 3,000 kcal/m²/yr, (b) 100 → 30 kcal/m²/yr,
(c) 3 × 10⁸ → 9 × 10⁷ kcal/yr. `env-intro-ecosystems-3` has a new scenario with the same key position. No item deleted, no
id changed.

## Numeric recheck

My own scratch script typed every expected value from the stems (not from the `from` recipes), then graded through
`env-calc.js`, `env-grade.js`, `env-expr.js` and `env-questions.js` in a vm as `apenv-questions.test.mjs` does: the
key with its unit and equivalent spellings (kcal/m2/yr, km3, people per km2, "2.5 million", 2.5e6, 1,250), every
authored mistake graded wrong and matched, the unit required, and for setups my own correct expressions accepted,
the bracket rule enforced and the authored wrong setups rejected. **65 keys (52 numeric, 10 setup, 3 FRQ checks).**
Before the fixes: 14 failures (above). After: 0, apart from one by design (`math-doubling-7` takes a bare people count).

Checked and fine: NPP 3,500 / 1,200; GPP 6,000; respiration share 57.9%; light and dark bottles 0.6, 1.5, 2.1
mg/L/day; 10% rule 200, 30, 50,000; efficiencies 11%, 9.1%, 8.75%, 0.0875%; biomass 6,000 g; precipitation 1,117 mm;
ratios 7.1, 7, 7.5; groundwater 2.36 × 10⁷ km³; per-capita 150 L, 500 kg, 60,000 L, 0.5 t, 400 kg, 3 kg; density
160/km²; 0.08 L/km; 360 kWh, $54, 2,000 kWh, 0.6 kWh, 4,320 kg CO2, $16.20, 94.75 L, 6 kWh; percent changes 25%,
-15%, 26%, -37.5%, -10%, 12.5%, 720,000 GWh; doubling 35 yr, 2052, 5%/day, 3,200, 2060, 2075, 360,000.

## Checked and fine

- Science against the CED Unit 1 statements and mainstream sources: biome climates (Whittaker-style chart), lake
  zones, salinity 35 ppt, DO falls with temperature, the five nitrogen steps and their microbes, nitrate leaching vs
  ammonium held by soil, phosphorus reservoirs and uplift, USGS water shares (96.5 / 1.7 / 1.7 / about 0.04%, with
  groundwater a little over half saline), NPP = GPP - R, the 10% rule with the first and second laws, pyramids
  (biomass can invert), arrows from food to eater. Every content trap in my scope taught right (savanna not a
  desert, "store carbon" not "CO2", watershed vs aquifer).
- Data: every stimulus `invented: true` or sourced (`water-cycle-s1`, USGS after Shiklomanov 1993); every plot drawn
  from the numbers its items state; all 16 figures and 9 plots rendered in Chromium at the page width and read.
- Written answers: every `specific` model is directional with its mechanism; FRQ design sample has IV, the measured
  DV, a directional hypothesis, the control with its purpose, a constant with why, and the plateau explained.
- Item quality: one defensible key per single item after the fixes; no near-duplicates; sets coherent (3-5 items).
  Select-all rule: my scope has 2 `multi` items (one already single-key); the bank has 13 of 52 single-key (25%),
  so none converted.
- Checks: `check-apenv-content --topic` ok for all 16 topics (no warnings left in scope); full run 0 failing
  (FRQs included); `check-apenv-map`: nothing used before it is taught; `node --test scripts/test/apenv-*.test.mjs`
  179/179. No em dashes in changed text.

## Needs-author (author A), resolved where a source settles it

- 10% rule from NPP: resolved by CED ENG-1.A.3 (NPP is the energy stored after respiration) and mainstream texts.
- "Roughly doubled" nitrogen fixation: resolved by Vitousek et al. 1997 ("doubled (or more)"); wording matched.
- Wolves and willows: kept with caution; NPS "The Big Scientific Debate: Trophic Cascades" calls it unsettled.
- math-doubling build timing: open, by design.

## Open (left for a person or the lead)

- Oxpecker swap: a teacher may prefer the classic oxpecker example; if kept anywhere, it needs a caution.
- Plot runtime (lead): `env-plot.js` spaces legend entries at min(170, plot width / n), so long `dual` names collide
  at 360 px (also reported by author C). Units with a scale word ("million tons") in
  `data/tools/air-pollution.json` may hit the same grader behavior as carbon-cycle-10 if they are ever graded.
- Grader (lead): `1500 W * 4 h / 1000 W/kW` parses as `(... / 1000 W) / kW` and is refused; correct by precedence,
  but students may type it. `1 kW / 1000 W` works.
