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

## Next (in this order unless the owner says otherwise)

1. Human Geography, rest: borders lab (towns are dots in a beige box: put it on Country A's land with the river as
   the border), scale lab (show the four scales as one zoom: where Country A sits in the world), model studio.
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
