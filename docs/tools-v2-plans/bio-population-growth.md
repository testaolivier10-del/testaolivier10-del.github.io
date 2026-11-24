# Plan: AP® Biology, Population growth (tools v2)

**Tool and page:** `bio/tools/population-growth.html`; `bio/assets/tools/population-growth.js` (396 lines), data
`bio/data/tools/population-growth.json` (defaults N₀ 10, r 0.5, K 500, Δt 0.1, 30 years; events Flood year 15
removes 50%, Hard frost year 22 removes 25%; K change to 250 at year 20). Premium. Rollout row 39, group P, wave 11,
size rework. Must not be the same screen as APES population growth (merge table note; that tool is another
planner's).

**The one idea:** growth slows as the population nears what the habitat can hold (K). Two tabs: "Logistic"
(exponential vs logistic, K as the ceiling) and "Fastest at half K" (dN/dt is largest at N = K/2).

## Research
- [HHMI BioInteractive, Lionfish Invasion: density dependent population dynamics](https://media.hhmi.org/biointeractive/click/lionfish-invasion/about.html):
  real population counts beside the model; take "a real animal in a real place".
- [HHMI Population Dynamics (LabXchange)](https://www.labxchange.org/library/items/lb:LabXchange:23adbfa8:lx_simulation:1):
  r and K sliders with exponential and logistic side by side; take the two curves on one axis.
- PhET Natural Selection (known, group row): rabbits on a field that fill it and run out of food; take the scene
  idea (animals and food visibly drawn). Builder: open all three.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Model exponential or logistic | Tab 1: both curves; the scene follows logistic, a faint exponential line on the graph |
| Sliders r max, K, N₀, run length, Δt | Tab 1: K is the main handle (the meadow's fence); r a quiet chip (litter size); N₀, run length, Δt to "?" settings (⋯), log it |
| Play the years, Read the population at year | Time bar under the scene (K.scrub) with Watch it |
| Events (Flood, Hard frost, share removed) and K change at year | Tab 1: one quiet tap "Hard winter" on the meadow (removes a share, animated); K change by dragging the fence mid run. Exact year sliders to Test yourself setups, log it |
| Second graph: per capita rate vs N, dN/dt vs N | Tab 2 main graph (dN/dt vs N); per capita vs N to "?" |
| Run one trial, Run a series of r, Clear runs, model log (`#pg-model-log`) | "?" (the model table and log), log it |
| Questions (5 ids `population-growth:growth:1..5`), stimulus `pg-s1`, mini FRQ | Test yourself, unchanged; `#questions`, `#frq` |

## Design
- **Picture:** a fenced meadow at the edge of a wood with rabbits drawn as rabbits (one drawn rabbit per 10, the
  scale said once on a pill), grass that thins and browns as N nears K, burrows. The fence encloses the meadow; its
  post is the K handle. Under the scene the N against time graph with K as a solid thin line (no dashes: they read as
  ghosts) named "K, what the meadow holds".
- **Main control:** drag the fence post: the meadow grows or shrinks, grass is added or lost, and the curve redraws
  at once with its new ceiling; rabbits on the screen are the population at the time bar's year.
- **Tab 2:** the same meadow; drag the time bar; newborn rabbits per year show as small rabbits hopping in, most at
  half full; the dN/dt vs N hump is drawn with its peak named "fastest at K/2".
- **Animates:** rabbits hop in and fade out (one element each), grass thins, the fence slides.
- **Cause line:** "N 420 of K 500 → little grass each → births barely beat deaths → growth slows".
- **Takeaway:** "Near K each rabbit has less food, so the population levels off."
- **Outside the picture:** 2 tabs, purpose line, Show me how, time bar and Watch it, cause line, 1 quiet chip.

## Science to verify
- dN/dt = r_max N (K − N) / K and dN/dt = r_max N (AP® Biology Equations and Formulas sheet); the discrete Δt
  steps match the continuous curve closely at Δt 0.1 (check the old model).
- Peak of dN/dt at N = K/2 (follows from the logistic equation).
- "Hard winter" as density independent; grass loss as density dependent (CED 8.4). Real rabbit r and K are not
  claimed; "?" says teaching model.
- No OpenStax.

## Reuse
`ApBioTools.studioKit2` (questions part). Kit: `K.tabs`, `K.drag` or `K.handle` (fence), `K.scrub`, `K.player`,
`K.tap`, `K.cue`, `K.cause`. Not the first AP® Biology tool on kit2. Coordinate with the APES population growth plan
so the two scenes differ (meadow rabbits here; the APES one should keep its own setting).

## Risks reviewers will likely block on
- Rabbit count drawn must equal N / scale at every frame, including a fast fence drag (rabbits added or removed
  visibly, never popping).
- K line label, curve end label and axis numbers 4 px apart at 360 px.
- Perf: up to 100 rabbit elements hopping; reuse elements, no per frame DOM rebuild; check x4 throttle.
- A shrinking fence with rabbits outside it: they must leave or die visibly, never sit outside.
