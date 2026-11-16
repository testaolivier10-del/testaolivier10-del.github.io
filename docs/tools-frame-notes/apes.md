# AP® Environmental Science tools in the standard frame (F5a, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`. All 12 tools share `environmental-science/assets/tools/env-tools.js`
(`ApEnvTools`), so the frame is switched on there once and each tool adds only its own task and scenario picker.
Nothing a tool did before was removed. AP® Psychology uses the same pattern: `docs/tools-frame-notes/psychology.md`.

## What the course framework now does (every tool)
| Before (calm frame) | Now (standard frame) |
|---|---|
| Bar: back, name, "?" (Explanation), "…" | `mount({ std: true, lede })`: name and the page's one line (hero lede), Explore / Test yourself in the bar, Ask the tutor, Share (copies the link, with `?seed=` in Test yourself), "?" opens the second tab (numbers, settings, About), "…" menu unchanged |
| "Start here" cue, hidden in the dock by CSS since pass 3 | the task's "what to do" line (`studioPane` reads it before the dock moves; `o.task.todo` overrides) |
| No task line | `studioPane({ task: { title } })`: the Explore task title per tool (below); kicker "Explore". On a phone the kicker and the "what to do" line step aside (the first-run hint on the pinned band says the same) |
| Test yourself: kind of problem behind "More options" in Details | one dropdown on the stage ("Any kind" + the kinds), Test yourself only (`drill` via `studioDrill.picker`) |
| Test yourself: problem title hidden, problem text as caption | task: kicker "Test yourself", the problem's title, "Answer one step at a time, then Check." (one step: "Answer, then Check."); the caption keeps the problem text |
| Per step: "Show a hint" opens the method; a wrong try opens it and adds "Show the answer" under the feedback | the shared hint ladder (`s.hints`): Hint (the same method text) instant; a wrong try opens it and counts as the attempt, then "Show the answer" sits under Check. Same content, same order, same gate |
| Worked solution placeholder in Why ("appears here once…") | Why stays empty, so Explanation hides until the problem ends |
| Problem end: worked solution opened by itself in the sheet; result, New problem, Report, Keep going in the dock | finished card: "n of m steps right the first time", the solution's last line as the takeaway, New problem, then Worked solution (Why, with Keep going and its glossary terms under it), See your steps (closes the card: the steps as answered, New problem and Report a problem are there), Read the lesson. `autoSolution: false` so the sheet no longer opens over the card |
| Scenario chips or a select in the dock or in Details | `stagePick(s, select or chip row, { label, when })`: one dropdown on the stage; the tool's own control stays in the page, hidden, and the pick drives it (its handlers run unchanged); the dropdown follows the control's view (hidden with its group) |

Kept as they were: the stage pictures and pills, every slider and the pinned primary band on a phone, view
switches of 2 to 4 (segmented, allowed by the spec), the Setup rows (they open the settings in the "?" sheet),
explain() reasoning in Explanation, Numbers tables, About, Enlarge, the try card on the stage, problem codes
and links (`?seed=`), recording to mastery and the review queue, keyboard on the pictures, the Premium lock
(checked: the lock card under the std bar; modes and Share hidden while locked).

## Per tool (Explore task title; what moved; judgment)
- **Age structure** (Premium): "How births and deaths shape a population." Stages 1 to 4 stay a segmented row
  (4 choices); fertility slider pinned; life expectancy in settings. Test yourself: no kinds (one drill).
- **Air pollution** (Premium): "See how smog builds over a day, and how acid rain forms." Smog day / Acid rain,
  Inversion, bedrock chips unchanged. 5 kinds in the stage dropdown.
- **Calculation studio**: "Cancel units to set up a calculation." The scenario chips (Power plant and the rest)
  are now the stage dropdown. Tiles, chain, start number unchanged.
- **Climate change** (Premium): "See how gases trap heat and how CFCs thin the ozone layer." Four views stay;
  the year and CFC presets stay behind the Presets row (they are one-shot presets, not a lasting scenario, so a
  dropdown that keeps showing the last one picked would mislead).
- **Cycles**: "Follow an element as it moves through its cycle." Four cycle chips stay (4 choices); People row
  unchanged. 6 kinds in the dropdown.
- **Dose and response** (Premium): "Read a dose-response curve." Views and the three chemicals stay segmented.
- **Earth and climate** (Premium): "See what drives seasons, winds, rain shadows and El Niño." Four scene chips
  stay.
- **Energy chain** (Premium): "Follow energy from a power source to your home." The power source select is the
  stage dropdown (Energy flow view only); the first-run hint points at it.
- **Energy flow**: "Follow energy up a food chain." The ecosystem chips (moved to Details in pass 3) are the
  stage dropdown; the Setup row is now "Settings: Efficiency, respiration, scale".
- **Population growth** (Premium): "Watch a population grow toward what its habitat can hold." The three growth
  models (in Details since pass 3) are the stage dropdown in the Growth view; todo rewritten to point at it.
- **Soil texture** (Premium): "Name a soil from its sand, silt and clay." Example soils stay in settings (presets).
- **Water pollution** (Premium): "Follow nutrient pollution from a field to a dead zone." Unchanged otherwise.

## Fixed along the way
- The "Start here" cue was looked up after the dock had moved, so it never reached Why (and was hidden in the
  dock): its text now shows as the task's "what to do" line.
- The wrong-try note said "Use the method above", which no longer sat above: now "Use the hint" / "the method".

## New copy for an accuracy check
- The 12 Explore task titles above; the population growth todo ("Press Play. Then pick Exponential or Overshoot
  from the menu over the graph and compare the curves."); "Settings: Efficiency, respiration, scale".
- Takeaways are the problem's own last solution line (authored), with a leading "Right." or part label removed.

## Questions for the owner (nothing removed)
1. The Explore views (Greenhouse / Ozone / Ocean pH / Sea level, Seasons / Winds / ...) stay as a segmented row
   in the panel, not bar modes: the bar keeps Explore / Test yourself. Fine?
2. The hidden original scenario controls stay in the page (the dropdown drives them). Fine to delete later?

## Accuracy check (F6b, 2026-11-16)
Checked the 12 task titles, the population growth todo, "Settings: Efficiency, respiration, scale" and every drill
type's finished card takeaway (generated per context and type) against the tools and `docs/apenv-authoring-guide.md`.
- Correct as written: all 12 task titles (climate keeps the greenhouse effect and ozone depletion apart), the todo, the
  settings line.
- Takeaways: new own lines (`TAKE` in env-tools.js) where the last line read oddly alone:
  - air-pollution reduce (began "It causes acid rain."): the pollutant, its fix and "Acid rain: yes." or "Acid rain:
    no, that comes from SO₂ and NOx."; pct: "Percent change = (new − old) ÷ old × 100; a negative result is a
    decrease."
  - calculation-studio pct-change and doubling (began "Readers want the brackets", "Readers take the point off"):
    the formula with the habit; convert and emissions (a bare "= 984.1 L/day."): the unit-cancelling rule.
  - energy-chain chain, fuel ("The other 55% leaves the plant as waste heat."), heatrate.
  - energy-flow tenpct ("The other 99.9% left the chain"), reverse and efficiency (a bare "= 16%."), web.
  - population-growth project and logistic (began "This J-curve", "This S-curve").
  - earth-climate shadow (began "Its water fell"); soil-texture percolation ("A slow rate: more silt and clay.").
  - Kept: every other type (age structure, cycles, dose-response, climate, soil, water pollution and the rest).
