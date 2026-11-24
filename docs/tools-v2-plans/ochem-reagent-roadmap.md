# Plan: Organic Chemistry, Reagent Roadmap (tools v2)

## Tool and page
- Page `ochem/tools/reagent-roadmap.html` (registry slug `reagent-roadmap`). Scripts
  `ochem/assets/tools/reagent-roadmap.js` (1,680 lines, 96 KB; engine `window.OchemRoadmapEngine`),
  `reagent-roadmap-data.js` (82 KB: 28 group nodes, 66 reagents, 122 reactions), `synthesis-data.js` (molecules per
  group, shared with the Synthesis Trainer).
- **Premium**. Rollout row 69, group F (step and flow builders), size rework (233 words in the panel; the route
  picture cannot be touched). Unchanged on `claude/tools-v2-all`.

## The one idea
A reagent is a road from one functional group to another; a synthesis is a chain of roads. Two tabs:
1. **One step**: from a group, every road out, and what each reagent makes.
2. **A route**: pick a start and a target, the shortest chain lights and the molecule travels it.

## Research
- [Iverson roadmaps (UT Austin, CH 310M)](https://iverson.cm.utexas.edu/courses/310M/MainPagesSp06/Roadmaps.html):
  the classic "roadmap" of the course, groups as nodes and reagents on arrows. Take: the student fills the map in.
- [Compound Interest, organic reaction map](https://www.compoundchem.com/2014/02/17/organic-chemistry-reaction-map/):
  the whole map on one sheet, colour per group family. Take: one colour per family, used everywhere.
- [Synthetic Map, a graphic organizer (J. Chem. Educ., PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11466318/):
  routes as paths on a network. Take: a route is a lit path, not a list. Brilliant (group F row) for one step per
  screen. Seen as text only; the builder opens them.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Mode Route: start and target selects (28 groups in bands), "Keep the skeleton" setting, routes ranked, each route's steps with reagents, notes ("only works through"), Show on map, molecule strip | Explore tab 2 (start and target by tapping nodes; the selects stay as a quiet search in "?"); "Keep the skeleton" a quiet switch on tab 2; step notes in the cause line; full step cards in "?" for the shown route |
| Mode Reagent: search or pick a reagent, every reaction it does | Explore tab 1: tapping a reagent pill on any road lights every road that reagent drives; the search moves to "?" |
| Mode Groups: what a group becomes, what makes it, what does not work | Explore tab 1 (tap a node: roads out and in); "does not work" lines go to "?" for that group |
| Mode Synthesis puzzle (tray, undo, play) and its drills (`askReagent`, `askProduct`) | Test yourself parts "Puzzle", "Name the reagent", "Name the product" |
| Check yourself quiz | last Test yourself part |
| `OchemToolState` keys `m`, `f`, `t`, `c`, `r`, `g`, `pz` | `?f=&t=` opens tab 2 on that route (`c=1` with the skeleton switch off); `?g=` tab 1 on that group; `?r=` tab 1 with that reagent lit; `?m=puzzle&pz=` the puzzle part |

## Design
- **Picture:** a transit map across the full stage. Each group is a station drawn as its real example molecule
  (propan-2-ol drawn as a skeletal structure in its station disc, from `synthesis-data.js`), families in one colour
  each (alcohols, carbonyls, alkenes and alkynes, halides, others). Roads are curved lines with a small reagent pill.
- **Tab 1 main control:** tap a station. Its roads out brighten in the family colour, the rest fade; a flask token
  sits on the station. Tap a road: the flask slides along it and the drawn molecule morphs into the product (atoms
  change in place: OH to C=O); the reagent pill reads in full beside the road.
- **Tab 2 main control:** tap a start, then a target. The shortest route lights, the flask travels it one road at
  a time (a scrub bar on the route, `K.progress`), each intermediate drawn at its station. Quiet secondary: "Keep the
  skeleton" switch and "Next route" when more than one ties.
- **Cause line:** "PCC → stops at the aldehyde → 2 steps: dehydrate, then hydroborate".
- **Takeaway:** "Routes are roads you already know, in an order."
- **Phone:** a camera frames the current station and its neighbours (as flowcharts frames the patient); the whole
  map from 1024 px.
- **Outside the picture:** two tabs, purpose line, cause line, the route scrub on tab 2. About 25 words.

## Science to verify
- Every road shown in Explore (and the shortest routes it offers) against Klein (ch. 7 to 13, 19 to 21) and
  Clayden: regiochemistry (Markovnikov vs hydroboration, Zaitsev vs bulky base Hofmann), PCC and DMP stop at the
  aldehyde, Jones goes to the acid, 3° alcohols do not oxidize, radical bromination needs a 3° C–H for selectivity.
- The substitution pattern rule (tert-butyl alcohol to an alkene with no H on one carbon cannot become an alkyne)
  and the skeleton rule; run the roadmap tests that hold routes to known chemistry in node (`scripts/test/tool-content.test.mjs`, `ochem-tools-upgrade.test.mjs`, `synthesis-trainer.test.mjs`).
- The example molecule at each station is real and named correctly (IUPAC).

## Reuse
- `OchemRoadmapEngine` unchanged (routes, through, patterns); the existing `mapHtml` layout data (`LAYOUT.tall`
  and wide) as the station positions; `molSvg` and `fragSvg` for the station molecules.
- `OchemStudioKit.kit2` with parts; `K.tap`, `K.progress`, `K.cue`, `K.cause`, `K.tabs`.
- `K.steps` (planned in the group F row) does not exist in the kit yet: only add it if a second tool needs it
  (Synthesis Trainer may), as a small additive change on `claude/tools-v2-all`.

## Risks reviewers will likely block on
- 28 stations with molecules on a phone: unreadable unless framed; text 11 px or more; no station label overlap.
- Reagent pills on curves colliding at hubs (alcohol, alkene): show pills only for lit roads.
- The flask and molecule morph out of step with the pill and cause line (rule 14).
- Heavy SVG with 122 roads: draw roads once, change only classes; perf at CPU x4 on a full route play.
- Weight: data files are already 105 KB; Explore must not copy them.
