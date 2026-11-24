# Plan: AP® Statistics, Distribution areas

## Tool and page
`statistics/tools/distribution-areas.html`; scripts `statistics/assets/tools/distribution-areas.js`,
`statistics/assets/tools/math/distribution-areas.js` (`ApStatMath.distributionAreas`, through `ApStatDist`),
`distribution-areas.css`; data `statistics/assets/tool-data/distribution-areas.json`. **Premium.** Rollout row 81,
group G, wave 13, marked restyle (control on the picture; Normal and Binomial are two lessons).

## The one idea (two tabs)
1. **Normal:** a probability is the share of the area under the curve beyond, below or between boundaries, in the
   context's units.
2. **Binomial:** a probability is the sum of the bars for the counts the event's words include ("at most 3" includes
   3; "fewer than 3" does not).

## Research
- Seeing Theory "Probability distributions" (https://seeing-theory.brown.edu/probability-distributions/index.html):
  drag parameters, shaded areas. Take: the shading as the answer, large.
- Art of Stat "Normal distribution" and "Binomial distribution" apps (https://artofstat.com/web-apps): boundaries
  typed or dragged, area shown. Take: the boundary in the context's units with z under it.
- StatKey "Theoretical distributions" (https://www.lock5stat.com/StatKey): two tails, between. Take: the three region
  choices as one quiet toggle.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Normal: contexts heights of adult women, phone battery life, scores on a state test | tab 1 picker |
| The curve in its context's units with z under it | kept |
| One or two boundary handles to drag or arrow keys (cue "Drag the boundary") | main control (`K.handle` on the axis) |
| Region: less than, between, greater than; shaded with its probability | quiet three way toggle on the picture |
| 68 95 99.7 rule overlay | quiet "68 95 99.7" button: snaps the boundaries to ±1, 2, 3 SD in turn (preset cases that each show something) |
| Details: the study, μ and σ, a boundary from an area (inverse normal), every number | "?"; inverse normal also in Test yourself (its kind) |
| Binomial: free throws (n = 10), guessing on a quiz (n = 20), defective chargers (n = 50) | tab 2 picker |
| Event in words: at most, fewer than, exactly, at least, more than | tab 2: the words as a quiet five way toggle; the boundary count k is the main control |
| The normal shape with mean np and SD √(np(1 − p)) drawn over the bars "for comparison only" | **removed from Explore** pending the author (see Science); logged |
| Why: the work as the exam wants it | "?" |
| Test yourself: drill on `distributionAreas.generate`, 4 kinds (normal, inverse, binomial, empirical); record ids `distribution-areas:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** a crowd of adult women standing in a line ordered by height forms the bell (a histogram of
  silhouettes, the smooth curve over their heads); the boundary is a doorway frame at a height on the axis; the
  women shorter than the door are lit (the shaded share). Battery life and test scores swap the silhouettes for
  phones and score sheets.
- **Tab 2 picture:** ten free throws: bars are stacks of basketballs for each count k; the counts the words include
  are lit; the boundary is a marker post between bars ("at most 3" puts it after 3).
- **Main control:** the doorway (tab 1); the marker post (tab 2).
- **Animates:** the door slides; silhouettes light or dim one by one; the shaded share's number counts; bars light.
- **Cause line:** tab 1 "door at 170 cm → z = 1.08 → 0.860 shorter"; tab 2 "at most 3 → bars 0 to 3 → P = 0.009".
- **Outside:** 2 tabs, purpose line, picker, Show me how, cause line: 3 controls, about 20 words.

## Science to verify
Normal areas from z (ApStatDist against R `pnorm`), inverse normal; the empirical rule 68, 95, 99.7 as approximate;
binomial P(X = k) = C(n, k)pᵏ(1 − p)ⁿ⁻ᵏ and cumulative sums; the words at most, fewer than, exactly, at least, more
than (CED revised 2026-27; OpenStax Introductory Statistics 2e §4.3 and §6.1, 6.2). **The normal approximation to the
binomial is not in the revised course** (`docs/apstat-authoring-guide.md` exclusions, needs-author `ced-text`); the
old overlay "for comparison only" invites it: remove it from Explore and add a line to `docs/apstat-needs-author.md`
asking whether it may appear at all (do not guess). Check the cause line's numbers against the context's μ and σ.

## Reuse
`ApStatTools.studioKit2`, `"kit2": true` in `statistics/data/pages.json`; `K.handle`, `K.tap`, `K.tabs`, `K.cause`.
`build-apstat --check`.

## Risks reviewers will likely block on
- Silhouettes forming a bell must match the normal density (counts per bin from the model), or the picture misstates
  the shape.
- Two boundaries (between) close together on a phone: knobs never overlap; one cannot pass the other.
- Binomial with n = 50: 51 stacks at 360 px; group the far tail into a single labelled stack only if its probability
  is under the shown precision, said in "?".
- Removing the overlay is a decision for the owner log.
