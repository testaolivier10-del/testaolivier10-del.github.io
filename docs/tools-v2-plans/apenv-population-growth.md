# AP® Environmental Science, Population growth: tools v2 plan

**Tool and page:** `environmental-science/tools/population-growth.html`; scripts `assets/tools/population-growth.js`,
`math/population-growth.js`, `population-growth.css`; data `data/tools/population-growth.json`; test
`scripts/test/apenv-tool-population-growth.test.mjs`. **Premium.** Rollout row 42, group P, wave 10. Twin of AP Bio
Population growth (owner: similar tools stay separate; this one keeps the APES angle: carrying capacity,
overshoot, survivorship, r and K).

**The one idea:** a population grows toward what its habitat can hold. Three tabs, one idea each:
1. Growth: with unlimited resources numbers explode (J); limits bend it toward K (S); a lag overshoots and crashes.
2. Survivorship: species differ in when their individuals die (Type I, II, III).
3. r and K: hit with a disaster, many fast breeders bounce back; few slow breeders recover slowly.
(Authoring guide trap: r and K selection and survivorship are related, never the same thing; they get separate
tabs for that reason.)

**Research:**
- [HHMI BioInteractive Population Dynamics on LabXchange](https://www.labxchange.org/library/items/lb:LabXchange:23adbfa8:lx_simulation:1):
  exponential and logistic models with r, K and N₀; graph only. Take: the three settings and their ranges.
- [OUP Living Graph, logistic growth](https://learninglink.oup.com/embed/access/content/krohne-2e-instructor-resources/krohne-2e-ke2-sims-logistic-population-growth_3):
  drag the curve's parameters. Take: K drawn as a line you can grab.
- [dmccreary population growth](https://dmccreary.github.io/ecology/sims/population-growth/): sliders beside a
  chart. Take only the check of the numbers; we draw the herd.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views Growth, Survivorship, r and K | Explore: three tabs |
| Growth model chips Exponential, Logistic, Overshoot | Tab 1: the fence (K) on the picture: fence off = exponential; fence on = logistic; the "delay" quiet tick on the fence = overshoot |
| Sliders r (0.05 to 0.6), K (500 to 4000 deer), deer released (20 to 400) | Tab 1: drag the fence line (K, main); r a quiet knob on a doe with fawns; N₀ in "?" (fixed at the default in Explore) |
| "Play 40 years" | Tab 1: time bar with Play ("Watch it happen") |
| Survivorship Type I, II, III | Tab 2: tap a species (elephants, songbirds, oysters drawn) |
| "Hit both with a flood" (r and K) | Tab 3: tap the river to flood; the time bar shows the recovery |
| Drills doubling, project, logistic, phase, survivorship, rk; 16 contexts (`island-deer`, `zebra-mussels`, `city`, `yeast`, `fish-pond`, `reindeer`, `kaibab`, `surv-*`, `rk-*`); partTopics `curve`, `link`, `rk`, `trait` | Test yourself, unchanged; ids `population-growth:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Growth: an island meadow with deer drawn as a herd (one deer per N/scale, the scale named "1 deer = 20"), grass
  that thins as they graze, the curve of numbers in a strip under the scene. Main control: drag the fence (how
  much meadow the island holds). Instant: the whole 40 year curve redraws, the scene shows year 40; drag the time
  bar to watch. With the delay tick on, the herd overshoots, the grass is eaten bare, then the herd crashes.
  Cause line: "K = 2,000 deer → growth slows as the meadow fills → levels at 2,000".
- Survivorship: 100 newborns of the chosen species walk along an age road; they drop out where the species loses
  them (most oysters at once, songbirds steadily, elephants late). The curve draws under them on a log axis named
  plainly.
- r and K: two habitats side by side, mice and elephants. Tap the river: both lose most; drag the time bar: mice
  rebound past their old numbers and swing, elephants creep back over decades.
Outside the picture: tabs, purpose line, Show me how, time bar and Play, cause line: about 28 words, 4 controls.

**Science to verify:** exponential dN/dt = rN and logistic rN(1 − N/K) with yearly steps (the model's own); the
overshoot's two year lag is a teaching model (say so in "?"); rule of 70 for doubling; St. Matthew Island reindeer
(29 released in 1944, about 6,000 in 1963, 42 after the crash; Klein 1968); the Kaibab deer story is disputed
(Caughley 1970): keep it only as "a classic, contested account" or move it to needs-author; survivorship types
(Pearl 1928; Deevey 1947); r and K traits as a continuum (the textbook simplification named in "?"). Trap from the
guide: r and K vs survivorship.

**Reuse:** APES kit2; `K.tabs`, `K.drag` (fence, r knob), `K.progress` and `K.player`, `K.tap` (species, flood),
`K.cause`. The APES Energy flow tool's animal art style. Not the first APES tool on kit2.

**Risks reviewers will likely block on:** the herd count not matching the number (assert drawn deer × scale equals
N within one deer, every frame); deer drawn outside the island; one control moving another (the fence must never
move r; the delay tick is a property of the fence, not a second slider that changes K); the log axis label
under 11 px on phones; overshoot frames where the grass recovers while the cause line still says "crash"; the flood
must not heal on a drag back (irreversible: a new run starts, shown).
