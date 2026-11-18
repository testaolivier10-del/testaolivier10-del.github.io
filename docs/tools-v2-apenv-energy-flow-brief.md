# Tools v2: AP® Environmental Science Energy flow (brief and build notes)

Status file for the v2 rebuild of `environmental-science/tools/energy-flow.html` (rollout row 21, free, group P).
Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-apenv-energy-flow`, built on `claude/tools-v2-all`. NOT merged: an independent review comes first.
Decisions made for the owner are also in `docs/tools-v2-owner-log.md`.

## What this course asks for (CED 1.8 to 1.11 and the course's notes)
The APES notes (`notes/primary-productivity`, `energy-flow`, `trophic-levels`, `food-webs`, `meat-production`) stress
four things, and the exam tests them as calculations and as written chains:
1. NPP = GPP − respiration: only what the producers store is food for the levels above (1.8).
2. The 10% rule with numbers: count the feeding steps and multiply by 0.1 for each ("20,000 × 0.10 × 0.10"), and
   divide going down (1.10). The exam uses 10%; real transfers run from about 5% to 20%.
3. Consequences: few levels, rare top predators, and **eating lower on the food chain feeds more people** (1.10,
   and 5.7 on meat production).
4. A food web: remove one species and say which way each linked population goes, and why (1.11).

AP® Biology's Energy flow (a separate tool, owner decision) teaches the share passed on as a setting, on a
grassland drawn as counts of organisms. This tool keeps the exam's fixed 10% and teaches the APES moves instead:
counting steps, NPP, the people a field feeds, and the web. No screen of this tool repeats Biology's.

## Research (rule 10)
"Seen" means the page was opened and read as text.
| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| dmccreary, Energy pyramid (seen) | Stacked bars; sliders for producer energy (1,000 to 100,000 kcal) and efficiency (5 to 20%); energy, biomass, numbers dropdown; side panel of math | Real time redraw; % of the producers' energy on each bar | The 90% that leaves is never drawn; a side panel; bars, not living things | The % of the producers' energy on each level; the loss drawn as heat at each step |
| dmccreary, Food web builder (seen) | Click prey then predator to draw arrows; "Remove species" from a dropdown; broken links turn red, affected nodes flash, up and down arrows | Arrows from food to eater; up and down marks after a removal | A dropdown far from the web; nodes, not animals; no reason given | Tap the animal itself to remove it; its links fade; up, down and gone are drawn on the animals and the reason is the cause line |
| iwant2study, Food web ecosystem interactive (page seen, only a promotion) | "Add or remove organisms, see ripple effects" | (not inspected) | (not inspected) | Nothing claimed |
| Cassidy et al. 2013, "Redefining agricultural yields" (IOP abstract and ScienceDaily summary seen) | Data, not a tool: 36% of crop calories go to feed, 12% of feed calories come back as food; about 6 people fed per hectare now, about 10 if all crops fed people | Real numbers for "eat lower" | | The numbers in "?" for chapter 2; the model keeps the exam's 10% |
| The old LevlPrep tool (origin/main, used) | Four views (energy, biomass, numbers, food web), three ecosystems, GPP slider, More options (efficiency, respiration, scale), tap a level | Drawn organisms; the web's response model | 22 controls, the slider in a panel, log widths that hide the loss, four views | The model (`ApEnvMath.energyFlow`), the grassland chain and web, the organism art |

What ours does that none of the above do: the student moves the energy up the chain one feeding step at a time and
sees the 90% leave as heat at each step while the number drops a zero; drags a field's harvest toward cattle and
watches the people it feeds walk away; taps an animal out of the web and sees every linked animal answer.

## The design: three chapters, one idea each
Tabs (big, `K.tabs`): "1 10% rule", "2 Eat lower", "3 Food web". Each has a purpose line with "Show me how", the
picture with its one main control on it, a cause line (`K.cause`) and nothing else outside the picture.
One colour per idea, everywhere: energy gold, heat vermillion (Okabe-Ito), a removed species and "dies out" red;
"more" and "fewer" are marks with words, never colour alone.

### 1 "10% rule": count the steps (CED 1.8, 1.10)
- **Idea:** only about 10% of a level's energy reaches the next; 90% leaves as heat, so each step up drops a zero.
- **Picture:** a meadow under the sun, the energy pyramid built from it: grass at the base, then grasshoppers,
  frogs, snakes and a hawk, one tier each (tiers in equal steps, as the textbook draws it: "?" says the real top
  would be a sliver). The sun's energy pours into the grass.
- **Main control:** the energy knob on the pyramid's left edge, "Energy up", five stops (grass to hawk). Drag it
  up: a gold stream climbs one tier at a time; at every step passed, vermillion heat rises from the level below,
  drawn 9 times the gold that goes on (one measure per step), and the tier reached shows its kcal and its % of the
  grass's energy. Down: the stream recedes.
- **Quiet second control:** "Sunlight" beside the sun (GPP 10,000 to 30,000 kcal/m²/yr): the grass's own
  respiration (half of GPP) rises as heat; NPP is what is left. It never moves the energy knob.
- **Cause line:** "10,000 kcal in grass → × 0.1 per step, 2 steps → 100 kcal reach frogs". At the grass: "20,000
  kcal of sunlight → half used by the grass → 10,000 kcal stored (NPP)".
- **Opens** on the grass (GPP 20,000, NPP 10,000), cue "Drag the energy up".

### 2 "Eat lower": the people one field feeds (CED 1.10 consequence, 5.7)
- **Idea:** feeding grain to cattle first adds a step, so 90% of it is lost as the cattle's heat: the same field
  feeds about ten times fewer people.
- **Picture:** one hectare of corn under the sun; a feedlot; a village of people. Gold flows from the field to the
  people (grain) and to the cattle; from the cattle a thin gold stream (beef) and a big heat plume.
- **Main control:** the knob on the harvest, "To cattle", 0 to 100% of the corn in steps of 10%. People walk in or
  away as the number fed changes; cows come and go with the share.
- **Numbers:** a hectare of corn grows about 40 million kcal of grain a year (USDA: 177 bushels an acre in 2023, about
  3,600 kcal per kg); a person eats about 2,500 kcal a day, so the grain feeds about 44 people, and the beef from
  all of it about 4 (the 10% rule). "?" gives the real numbers: beef returns nearer 3%, all animal feed about 12%.
- **Cause line:** "60% of the corn to cattle → 90% of that lost as heat → 20 people fed (44 on grain alone)".

### 3 "Food web": take one species out (CED 1.11)
- **Idea:** every species is linked by what it eats and what eats it; removing one makes its prey increase, its
  predators decrease, and a consumer with no other food die out.
- **Picture:** the meadow web (grass, grasshoppers, rabbits, mice, frogs, snakes, foxes, hawks), each animal in its
  place, arrows from food to eater.
- **Main control:** tap an animal (or the grass) to take it out; tap it again to bring it back. Its arrows fade;
  each linked species shows "more", "fewer" or "dies out" with a drawn change (a second animal walks in, one walks
  away, a starving one fades). Indirect, less certain effects are lighter and marked "may".
- **Cause line:** "No frogs → grasshoppers more → snakes fewer (they still eat mice)".

### Explore against Test yourself
- **Explore:** the three chapters above, free play, nothing graded.
- **Test yourself:** the drills, unchanged (10% rule, energy the producers need, GPP and NPP, transfer efficiency,
  inverted pyramids, food web changes): same generator, grading, record ids, seeds and `?seed=` links.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Energy view, tap a level for where its energy went | Chapter 1: the knob climbs level by level and shows each level's energy, heat and share |
| GPP slider (2,000 to 40,000) | Chapter 1: the quiet "Sunlight" knob (10,000 to 30,000) |
| Respiration slider, efficiency slider (More options) | Fixed in Explore at 50% and 10% (the exam's rule); "?" gives the 5 to 20% range and what a change does |
| Biomass and numbers views, pond and forest ecosystems, log or to scale widths | "?" of chapter 1: the three pyramids of the three ecosystems as tables, with the inverted ones named; Test yourself keeps the inverted pyramid drills |
| Food web view (grassland, pond, forest) | Chapter 3 (grassland); the pond and forest webs stay in the Test yourself drills |
| The "Every level" table | "?" of chapter 1 |

## Decisions made for the owner
1. Three chapters (10% rule, Eat lower, Food web), each its own idea and control; the old four views and three
   ecosystems are not in Explore.
2. Explore fixes the exam's 10% and the grass's 50% respiration; Sunlight is the only second control.
3. Chapter 2 is new: one hectare of corn, people fed on grain against beef, with real yields and the 10% rule.
4. The pond and forest leave Explore (their pyramids are tables in "?"; their webs stay in the drills).
5. Tiers of the pyramid are drawn in equal steps (not to scale); the heat and the gold at each step are on one
   measure; "?" says the real top would be a sliver.
