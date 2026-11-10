# AP® Human Geography launch: running log

A restart picks up from the last line. Steps, as the AP® Macroeconomics launch (`docs/apmacro-reviews/launch.md`):
(1) the tools review's two open fixes, the exams review's author items and `scale-words`; (2) publish and register
live, every generator, site-wide wording, sources, changelog, social card, covers; (3) final identity; (4) Phase 0 and
needs-author `launch` leftovers; (5) SQL migration; (6) full CI with browser checks and a look at 360 and 1280, light
and dark; (7) spec, CLAUDE.md, needs-author, owner checklist. Branch `claude/aphug`; main is not merged in (the lead
merges main and opens the PR after AP® Microeconomics merges).

## 1. Fixes before publishing

- **Phone stage plots** (tools review, open): Model Studio's apply step drew its plot (Malthus, bid-rent,
  rank-size, Ravenstein, DTM rates) at 360 x 260 units, and a short phone stage capped the card at
  `(100cqh - 74px) * 1.5` (about 250 px), so the studio raised every word to 12 px (up to 1.6x) and the axis numbers
  and legend collided. Fixed in the course, not the shared studio: `model-studio.js` `fitPlot` draws the plot at
  the size it is shown (its width in px, at most 400 units, so on a wide screen the words grow with it; the height
  the stage has left under the picture, at least 140), and redraws on `resize` and `ls-stage`;
  `model-studio.css` lets a plot card keep the stage's width. `hug-plot.js`: the y-axis shows fewer ticks on a
  short plot (3 to 6, one per 26 px); bar category names sit a fixed 15 px under the axis (they were 7% of the
  range below it, so on a short plot they sat on the axis); a y label on the bottom edge rises above the axis when an
  x label is printed at the same corner (the Malthus "0" touched "1960" at 1280). Screens at 360 and 1280, light
  and dark: no collisions. `assets/course/tool-studio.js` not touched.
- **Sea zones** (borders-lab): the EEZ slot read "24 to 200 nautical miles". UNCLOS measures the EEZ from the
  baseline out to 200 and starts beyond the territorial sea, so it overlaps the contiguous zone. Slot now "12 to 200
  nautical miles (overlaps the contiguous zone out to 24)", the Explore key "12 to 200, overlapping the contiguous
  zone", the zones table "12 to 200 (overlaps the contiguous zone)", the EEZ rights line says how it is measured, and
  the territorial-sea slip says where the EEZ starts. Answers unchanged (they were right). The 4.5 lettered figure's
  bands (24 to 200) are distance bands, not zones, and its items say band C lies inside the EEZ: kept.
- **Exams review author items**: Country Z's pyramid (`frq-aging-pyramid-one`) now sums to 100.0% (0.1 added to 13
  bars a side; shortest at 0 to 4, widest at 50 to 59 and more women at 80+ still hold); `u1-describe-elevation`
  says "eastward toward the South Coast" in the context and the answer; `u2-legend-fertility` classes are "1.5 to
  under 2.1" and "2.1 to under 3.0" (no gap for 2.05).
- **`scale-words` settled**: keys say "local (subnational)"; notes may say a province or state is a subnational
  unit; nothing says "regional scale" for part of one country. Changed: notes `settlement-survey` (Midwest, Great
  Plains), `cultural-patterns` (Quebec), `centrifugal-centripetal` ("provincial scale"), `cities-worldwide` (US metros
  now the national scale), `second-agricultural-revolution` (inside Britain), `development-measures` (Kerala),
  `culture-intro` (Bali, twice), `urban-sustainability` (Portland: "the local scale of one metro area"); lesson
  summary `sustainability-challenges`; bank `world-economy-changes-18` (the scale slot's key and model answer for
  Spartanburg), `trade-world-economy-14`, `development-measures-3` and `-12`, `industrial-revolution-7` (explanations),
  `culture-intro-12` (stem: "this island-by-island pattern"); FRQ `frq-rail-boundary-one` A (no scale in the prompt).
  "Regional" stays for groups of countries (Schengen, Europe's cities, the Kurds, Koreans).
