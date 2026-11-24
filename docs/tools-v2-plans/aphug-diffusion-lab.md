# AP® Human Geography, Diffusion lab: tools v2 plan

**Tool and page:** `human-geography/tools/diffusion-lab.html`; scripts `assets/tools/diffusion-lab.js`,
`math/diffusion-lab.js`, `diffusion-lab.css`; base map `figures/base/country-a.json` (fetched by the tool); data
`data/tools/diffusion-lab.json`; test `scripts/test/aphug-tool-diffusion-lab.test.mjs`. **Premium.** Rollout row
130, group P, wave 22.

**The one idea:** how something spreads, and why people move, depends on who carries it and what is in the way. Two
tabs, one idea each:
1. Diffusion: a trait spreads from its hearth by relocation, contagious, hierarchical or stimulus diffusion (CED
   3.5).
2. Migration: push factors, pull factors and what lies on the way decide where people go (2.10, 2.11, 2.12).

**Research:**
- [NKU LEAPS lab module](https://nku.edu/~longa/modules/leaps/lab.html) (summary only): classroom labs on
  diffusion on maps. Take nothing claimed beyond the idea of steps on a map.
- [Visualizing diffusion on networks (MIT CSAIL)](https://people.csail.mit.edu/ddeford/diff_force.html): a spread
  that hops along links vs creeping to neighbors. Take: hierarchical spread drawn as hops between big nodes,
  contagious as a wave to neighbors.
- The old tool itself (the visuals review said "Leave. The animation is the idea."): take its step by step
  animation, and make it respond to a drag instead of Play only.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Two parts, Diffusion and Migration | Explore: two tabs |
| "Type of diffusion" picker (relocation, contagious, hierarchical, stimulus, mixed) | Tab 1: tap a carrier on the picture (main) |
| Play and the Step slider (1 to 4) | Tab 1: the time bar (drag, instant) and Play |
| Migration ideas (push and pull, intervening obstacle, intervening opportunity, step migration, chain migration, Ravenstein) | Tab 2: push, pull, obstacle and opportunity on one journey; step and chain as two quiet taps on the route; Ravenstein's laws in "?" and Test yourself (logged) |
| Drills diffusion, mixed, migration, kinds, ravenstein; contexts `diffusion`, `kinds`, `migration`, `ravenstein`; partTopic `law` | Test yourself, unchanged; ids `diffusion-lab:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Diffusion: Country A drawn as a country, its cities sized by population, roads between them; a hearth city with a
  new trait (a dish, a song, a phone) glowing in one color. Four carriers drawn beside the map: a family with a
  moving truck (relocation), two neighbors talking over a fence (contagious), a plane between big cities
  (hierarchical), a changed recipe card (stimulus). Tap a carrier: the whole spread is computed; drag the time bar:
  places adopt in that pattern (a wave out to neighbors; hops to the biggest cities first, then down; a far city
  lighting while the hearth area stays dark for relocation; a changed color for stimulus). Cause line:
  "Hierarchical: big cities first → then smaller ones → skips the countryside". Takeaway: "Contagious creeps;
  hierarchical jumps."
- Migration: one family's journey across Country A from a dry farming province to a coastal city. Push factors
  drawn at home (failed crops, few jobs), pull at the city (factories, a university). Drag the family along the
  road: an obstacle (a mountain pass, a border checkpoint) slows them; an intervening opportunity (a mid sized town
  with jobs) can stop them there; the step tap makes them pause in a town first; the chain tap shows relatives
  already in the city. Cause line: "Push: drought → pull: jobs → stopped by an intervening opportunity".
Outside the picture: tabs, purpose line, Show me how, time bar and Play (tab 1), cause line: about 25 words, 4
controls.

**Science to verify:** CED 3.5 definitions (relocation; expansion as contagious, hierarchical, stimulus; reverse
hierarchical only if the CED names it); Ravenstein's laws (1885, 1889) as the course words them; intervening
obstacles (Lee 1966) and intervening opportunity (Stouffer 1940); forced vs voluntary migration, refugee, asylum
seeker and internally displaced person exactly as CED 2.11 defines them; never "illegal" for people (accuracy
risks section 2); Country A invented.

**Reuse:** `ApHugTools.kit2` (added by the first HuG kit2 tool); kit `K.tabs`, `K.tap`, `K.progress` and
`K.player`, `K.handle` along the road, `K.cause`. Country A base drawn inline from `country-a.json` (see the
scale lab plan); `K.spots` on `hug-map.js` (the wave 22 piece) for tapping a province or city to name it.

**Risks reviewers will likely block on:** the map as an `<img>` cannot light cities one by one (inline SVG paths,
labels as kit HTML); city labels colliding with carriers and roads at 360 (Country A has eight provinces: label
codes, names on tap); the spread animation must follow the drawn time bar on reversals; the family on the road
must not overlap its own labels; migration content tone (neutral, no blame).
