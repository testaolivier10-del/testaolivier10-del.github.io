# Plan: AP® Statistics, Design randomizer

## Tool and page
`statistics/tools/design-randomizer.html`; scripts `statistics/assets/tools/design-randomizer.js`,
`statistics/assets/tools/math/design-randomizer.js` (`ApStatMath.designRandomizer`), `design-randomizer.css`; data
`statistics/assets/tool-data/design-randomizer.json`. **Premium.** Rollout row 100, group P, wave 15, marked restyle
(button driven by nature; a good scene; four designs on chips in the panel).

## The one idea
Random assignment balances the groups, so the estimate centres on the true effect; blocks and pairs make it more
precise; letting someone choose the groups biases it.

## Research
- Rossman/Chance "Randomizing subjects" applet (https://www.rossmanchance.com/applets/index2021.html): random
  assignment balances a lurking variable, shown over many runs. Take: the lurking variable's balance made visible.
- Art of Stat "Random assignment" (https://artofstat.com/web-apps): treatment labels dealt to units. Take: labels
  dealt one by one.
- StatKey "Randomization test for a difference in means"
  (https://www.lock5stat.com/StatKey): a dotplot of differences. Take: the row of estimates.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Scenes: tomato seedlings on a greenhouse bench (one row by the window); volunteers in a memory study (younger and older) | scene picker beside "Show me how" |
| Designs: completely randomized, blocked, matched pairs, no random assignment (chips in the panel) | main control: design cards on the picture (`K.tap`) |
| Randomize (cue "Randomize and run"): units get their treatment marker in the order chance picks; the experiment runs (plants grow, volunteers show scores) | "Randomize and run", on the picture |
| The estimate (mean A − mean B) lands on a dotplot, one row per design, against the true effect | kept |
| "Run 100" fills a row | "Run 100" (secondary) |
| Blinding (memory study; an unblinded run shifts the estimate by the placebo effect) | a quiet "blind" switch on the memory scene (on by default, as today) |
| Colours: A second series, B first, estimates third | kept |
| Test yourself: drill, 5 kinds (design, variables, scope, procedure, confound); record ids `design-randomizer:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** the greenhouse bench with real seedlings in pots, the window row brighter; markers (A, B tags) are
  dealt onto pots by a hand, one by one; then time passes and the plants grow to their heights. The memory study shows
  volunteers at desks, younger and older seated apart, cards dealt to them.
- **Main control:** tap a design card, then Randomize and run.
- **Animates:** tags dealt in chance order; plants grow; the estimate drops into its design's row; Run 100 streams
  dots.
- **Cause line:** "completely randomized → window pots split by chance → estimate 2.1 cm → true 2.0"; "you choose →
  A gets the window row → estimate 4.3 cm: biased".
- **Takeaway:** "Random assignment centres on the truth; blocking on the window narrows it."
- **Outside:** purpose line, scene picker, Show me how, cause line, Run 100: 3 controls, about 20 words.

## Science to verify
Completely randomized, randomized block and matched pairs designs; confounding; blinding and the placebo effect;
scope of inference (random assignment allows cause and effect; random sampling allows generalizing) (CED revised
2026-27 collecting data unit; OpenStax Introductory Statistics 2e §1.4). Explanatory and response variables and
experimental units named in the scene's words. Check the cause line's numbers against the model's built in effect.

## Reuse
`ApStatTools.studioKit2`, `"kit2": true` in `statistics/data/pages.json`; `K.tap`, `K.cause`, `K.player` (Run 100).
`build-apstat --check`.

## Risks reviewers will likely block on
- Growing plants and dealt tags at CPU x4 with Run 100 (skip the per unit animation for the 99 fast runs, say so).
- Tags on small pots at 360 px: tags readable at 11 px, one letter each.
- The design cards must show which design is in use on the scene itself (blocks drawn as a divider), not only on the
  card.
