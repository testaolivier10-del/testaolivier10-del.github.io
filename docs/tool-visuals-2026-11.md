# Tool visuals (2026-11): status file

Owner brief (2026-11-10): "make the visuals a lot better for every single tool". What he means, in his words:
graphs "don't need anything crazy"; the problem is tools like the Human Geography scale lab, where "idk what's
going on, it's just like blocks". "A plain graph is just boring to begin with for tools. Tools should be focused
around visualizing difficult concepts." Scope: all tools, all courses.

So the test for every tool's picture: can a student tell what they are looking at in two seconds, and does the
picture show the concept itself (not blocks, dots in a box or a bare chart standing in for it)? Plot styling is
not the job. A quick graph polish (graph paper, heavier curves) was tried on the macro graphs and dropped.

## Done

| Course | What changed | Where |
|---|---|---|
| AP Human Geography | Country A, the invented country behind the scale lab, map reader, diffusion lab and 24 built map figures, is drawn as a country: wandering borders, a coast with sea and shallows, neighbors' land, three rivers, a lake, hills and forest marks on reference maps. Same eight provinces, ids, names and label centers. Every border is still straight segments (point tests unchanged); the outer border only moved outward; authored points checked (the four that changed are isoline ends). | `scripts/aphug-country-a.mjs` (used by `build-aphug-basemaps.mjs --invented`), `base.scenery` drawn by `hug-map.js`, `diffusion-lab.js` draws the base when it arrives |

## The question to ask of every tool (owner, 2026-11-10, second message)

"Think about what a tool is meant to do and is it portraying it in the best way, or is it confusing, or not doing
its job entirely, or not showing what it should be." Not everything needs changing: change a tool only where the
answer is no. He also offered a second opinion from ChatGPT or Gemini in his browser (needs his computer on with
Chrome open; it was not reachable on 2026-11-10).

For each tool, write down: (1) the one idea a student should leave with, (2) what the picture shows at the moment
it opens and after each control, (3) whether the picture IS that idea or only sits beside a caption that states it,
(4) verdict: leave, fix, or redesign (redesigns get a mockup first).

## Purpose review: AP Human Geography (2026-11-10, every scene opened)

| Tool | The idea | Verdict |
|---|---|---|
| Map reader | One data set looks different on six map types | Leave. Does its job. |
| Diffusion lab | How a trait spreads: step by step outward, or jumping between big places | Leave. The animation is the idea. |
| Population lab | The pyramid's shape follows from birth and death rates | Leave. |
| FRQ coach | What each task verb demands | Leave. A writing tool; the question is the right picture. |
| City lab | Rings come from bid rent; central places; rank-size | Leave (small: ring colors could carry land-use marks). |
| Scale lab | The same data tell a different story as the units get smaller | Redesign. Four separate maps with nothing joining them; the world and Country A are not connected. Should be one zoom in which a single average splits apart, with a locator showing where you are. Map scale tab is fine. |
| Borders lab | Why a border is where it is; what pulls a state together or apart | Fix. Boundary types: towns are dots in a box, so nothing shows why the line runs there (needs the land: river, hills, where each people lives). Forces: still the old straight-edged blocks with bare arrows. State shapes: one blob with no capital, no distances, nothing to show why the shape matters. Sea zones and real cases are fine. |
| Model Studio | What each of 21 models looks like and where its parts go | Redesign in part. Five models are blank numbered boxes that show nothing of the model: Rostow, epidemiological transition, world system, gravity, rank-size. Every model is drawn in a quarter of the stage with the rest empty. The maps and curves (Hoyt, galactic, least cost, Malthus, DTM, boundaries) are right and stay. |

## Second opinion (Gemini, in the owner's browser, 2026-11-10) and what was taken from it

Asked to push back on the three verdicts above. Taken: (1) scale of analysis is a change of units, not a camera
move, so no continuous zoom and no locator inset: the same outline breaks into smaller units in place, with a
lowest-to-highest bar; (2) forces should be shown on real geography (a rail hub tying regions to the capital, a
mountain range cutting one off), not arrows on an outline; (3) state shapes need the capital and the reach from it
to the far edge. Its pictures for the five blank models: Rostow as a rising staircase with the mix of farm, factory
and service work changing; epidemiological transition as two lines (infectious falling, degenerative rising) over
the stages; world system as core, semi-periphery and periphery rings with raw materials flowing in and finished
goods out (rings, not a world map, since which country is which is contested); gravity as two city circles joined
by a band whose width is the interaction (change size and distance); rank-size as city bars against the 1/n curve
with a primate city switch.

Built from it: scale lab, scale of analysis. A line above the map shows every unit's value from 0 to 100% with the
span filled in (one dot at the global and national scales, "the spread inside it is hidden"); switching between
scales on the same outline (global and regional, national and local) fades one into the other in place.
`scale-lab.js` (rangeHtml, the ghost image), `scale-lab.css`.

## Next (in this order unless the owner says otherwise)

1. Human Geography, from the purpose review above: Model Studio's five blank models and stage size (mockups
   first), then the borders lab's three scenes. The scale lab is done.
2. Every other course, one at a time. From the 2026-11-10 screenshots (all 145 tools, phone and desktop), the
   pictures that are blocks, boxes or bare charts: macro indicators lab and multiplier lab; bio Hardy-Weinberg;
   chem ICE table and particle diagrams; physics collision lab and rotation lab; A&P pathways, predict, feedback
   loops, calculators; ochem reagent roadmap and reaction predictor; NREMT flowcharts and skill sheets. Psychology,
   precalculus, calculus BC, microeconomics and half of statistics were screenshotted but not yet judged.
3. Rebuild candidates already written up in `docs/tool-audit-2026-11.md` fit here.

## How to look at every tool

A static server at the repo root, Playwright (`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`) with
`serviceWorkers: 'block'` and `assets/premium.js` served with `has()` returning true, at 1280x800 and 390x844.

## Rules carried over

Mockups before a redesign and the live tool must match what he approved; no functions removed; simple on landing;
readable at 390 px; the body map is the bar. Merging needs his words.
