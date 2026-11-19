# Tools v2: AP® Biology Design drills (brief and build notes)

Status file for the v2 rebuild of `bio/tools/design-drills.html` ("Experimental design and argumentation", free,
rank 13 in `docs/tools-v2-rollout.md`, group R). Standard: `docs/tools-v2-standard.md`; builder brief:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-design-drills`, from `claude/tools-v2-all`. NOT merged:
the independent review comes first.

Owner decision for this group (rollout question 4, given in the build request 2026-11-18): tools that are mostly
practice stay tools, but Explore must be real free play that shows an idea. Before, the tool had no free play at
all: it landed on a graded drill (rollout row 13: "No free play: a drill with Check on landing").

## The one main idea
**A difference between groups can only be credited to the one thing you changed, and only once you have enough
of each group to see past chance.** CED science practice 3 (3.B hypotheses, 3.C variables and controls) and 4/5
(error bars, ±2 SE). The course notes say it in their words: "list what differs between the groups. There should
be one thing on that list" (`design-variables`), "A confounding variable is a second difference between groups
that could also change the result" (`design-controls`), "If the difference between two groups is no bigger than
the variation inside each group, the data do not show an effect" (`design-variables`), and non overlapping ±2 SE
bars "suggest a real difference" (`stats-confidence-intervals`).

These are two ideas (validity and replication), so two tabs, each with one control:
1. **Fair test**: what differs between the groups (independent variable, controlled variables, control group,
   confound).
2. **Sample size**: how many plants per group (replication, variation, ±2 SE error bars).

The argumentation drills (null hypothesis, claim evidence reasoning, prediction and mechanism) are writing skills
with no free play; they stay drills in Test yourself (logged).

## Research (rule 10): what exists and what we took
"Seen" means the page or a text copy of it was read; "summary only" means only a description could be read, and
nothing is claimed about its screen beyond that.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| ExploreLearning Gizmo, Growing Plants (student sheet as text, seen; the Gizmo itself not opened) | Three pots; per pot a seed, light on or off, a water slider, fertilizer or compost; Play to day 50; height and mass graphs on a Data tab | Plants on a bench, the student sets the conditions; "hold water, soil and seed constant while light changes" | Three pots, one plant each: no replication; nothing tells the student a comparison is unfair; results only after Play, on another tab | Plants in pots under lamps as the picture; conditions set on the picture. Improve: two groups of several plants, the result that instant, and the picture marks every difference |
| dmccreary, Confidence interval visualization (page seen) | Sample size slider, Draw sample stacks one interval per click, a true mean line | Bigger samples visibly give narrower intervals; repeated samples show the spread | Fish numbers in the abstract, no experiment; no comparison of two groups | "New plants" redraws the same experiment so a student sees small samples jump; the sample size control |
| iwant2study (Open Source Physics Singapore), Light intensity and plant growth (summary only) | Paired exploration, then a claim evidence reasoning debrief | (not inspected) | (not inspected) | Nothing beyond the confirmation that a plant growth bench is the usual picture |
| Course notes `design-variables`, `design-controls`, `stats-confidence-intervals` (seen) | Worked examples: one change at a time, the two glasses, the fan in one cabinet, paper strips repeated, ±2 SE bars | The exact wording students are tested on | Text only | Every word on the picture and the cause line uses the notes' terms |

What ours does better: the confound is drawn (a second ring on the bench) the moment it appears, the plants
grow to the new result at once, and the cause line says in a few words whether the difference can be credited.

Science check: fertilizer raises the growth of bean seedlings, a water shortage lowers it, and a warmer bench
(25 °C against 20 °C) raises it (OpenStax Biology for AP® Courses 31.2 on nutrients, 30.5 and 30.6 on water and
growth; temperature within the bean's range). Light was left out of the Explore model on purpose: under strong
shade seedlings grow TALLER (etiolation), so "less light, shorter" would be a simplification a student could see
fail. The sizes of the effects are invented and said to be (in "?"). Error bars are ±2 SE, the course's
convention (about a 95% confidence interval); non overlapping bars mean the difference is unlikely to be chance,
overlapping bars mean the data do not show one (never "prove").

## The design

### Tab 1, Fair test
- **The picture** (the full stage): a lab bench in a greenhouse room. Left, the control group; right, the test
  group. Each group is a tray of 6 potted bean plants under the same grow light, with its water jug, its plant food
  bottle and a heat mat under the tray (its switch box in front). A ruler stands behind each group. After 3 weeks the plants stand at their heights; a line
  across each group marks the mean ("18 cm"), and a bracket between the groups gives the difference ("+6 cm").
- **The main control, on the picture:** the three things the test group gets, tappable on its side: the
  water jug, the plant food bottle, the heat mat's switch box. Each tap switches it between "same as the control" and
  "different" (Same water / Less water, No plant food / Plant food, Same warmth / Warmer). "Plant food" is the fertilizer
  ("?" says so): the plain word fits under the bottle at 360 px. One control never moves
  another.
- **Instant result:** the plants grow or shrink to the new result (a 650 ms tween; leaves droop with less water);
  the means and the bracket follow the plants as drawn, every frame.
- **What differs, drawn:** every item that differs between the groups gets an amber ring on BOTH sides and the
  word "differs" on the test side. One ring: a fair test. Two or three: a confound.
- **Opens** on a fair test of fertilizer (the only difference): test plants 6 cm taller.
- **Cue:** "Tap the water" on the test group's water jug, once per device.
- **Cause line** (`K.cause`), set when the plants settle (the first pill changes at once):
  "Only plant food differs → Test 6 cm taller → Plant food made the difference";
  "Plant food and water differ → Test 1 cm taller → Can't tell which did it";
  "Nothing differs → same height → nothing is tested".
- **Under the picture:** Start over (a link).

### Tab 2, Sample size
- **The picture:** the same bench, a fair test of plant food only (rings on the bottles, as tab 1 draws it).
  Plants vary by chance (SD 3 cm; the true difference is 6 cm). Each group shows its plants, its mean line and its
  ±2 SE error bar beside the ruler; the bracket gives the difference of the means.
- **The main control, on the picture:** one knob on the bench's front edge, "Plants per group", 1 to 12. Its value
  rides on it ("4 plants"). Adding a plant brings a pot in and the plant grows; removing one takes it away.
- **Secondary, quiet:** "New plants" under the picture: the same experiment with a new batch of seeds (the plants
  shrink back into the soil and regrow). With 1 or 2 plants each, the result jumps around and can even reverse;
  with 10 it hardly moves.
- **Labels wait for the picture:** while any plant grows from the soil, the means, bars and bracket fade out and
  the cause line says "Growing"; they come back when every plant has finished.
- **Cause line:** "1 plant each → No spread to measure → Can't tell"; "3 plants each → Bars overlap → Could be
  chance"; "7 plants each → Bars apart → Unlikely to be chance". It opens on 3 plants (the first batch is fixed: one
  plant each shows the control TALLER, 3 to 5 overlap, 7 and up are apart; later batches are random).
- **Cue:** "Drag for more plants" at the knob, once per device.

### What is on screen in Explore (counted at 1440 and 390, opening state)
Outside the picture: 2 tabs, the purpose line (7 words), "Show me how", the cause line (3 pills, 12 words), Start
over (tab 1) or New plants (tab 2). That is 4 controls and about 25 words. No side panel, no graph, no readout cards.
On the picture, tab 1: 2 group names ("Control group", "Test group"), 2 means, 1 difference, 3 item labels on the
test side, the "differs" marks (1 to 3), the ruler numbers, the cue (first visit). Tab 2: the same group names,
means and difference, the knob with its value, 2 error bars, the fertilizer label with its ring.

### Explore against Test yourself
- **Explore:** the two tabs above. Nothing locked, graded or asked.
- **Test yourself:** one part, "Experiment drills": every one of the 16 experiments and every drill as before,
  with the same record ids (`design-drills:<scenario>:<row>`, `design-drills:<scenario>-<cer|predict>:a`), the
  same feedback and the same shuffles. The experiment's own drawn setup and its chart are the part's own picture
  (The setup / The results), the drills go one at a time in the side panel, the Experiment dropdown is on the
  stage, the finished card comes when every drill is checked. The "Drills" filter (one kind of drill only) is in
  "?", as it was in Details.

### What moved (nothing dropped silently)
| From today's tool | Where it is now |
|---|---|
| The landing drill (variables, with the drawn setup and its tappable parts) | Test yourself, unchanged |
| Experiment picker, drill stepper, finished card, setup / results switch, "Read the setup" | Test yourself, unchanged |
| "Drills" filter (in Details) | "?" (Practice one kind of drill); a pick opens Test yourself |
| "What each drill checks" and the intro | About (the ⋯ menu) |
| Null hypothesis, CER, prediction and mechanism | Test yourself only (no Explore screen: writing skills) |

## Decisions made for the owner (also one line each in `docs/tools-v2-owner-log.md`)
1. Explore is a new drawn plant bench with two tabs (Fair test, Sample size); the drills are Test yourself.
2. Plant food (fertilizer) is the variable tested; light is the same over both groups and cannot be changed (etiolation makes
   "less light, shorter" untrue in deep shade).
3. The confounds on offer are water and warmth; effect sizes are invented (+6 cm fertilizer, −5 cm less water,
   +3 cm warmer, 18 cm base after 3 weeks, SD 3 cm), stated in "?".
4. Error bars are ±2 SE, and the verdict is read from the bars as drawn (apart or overlapping), the course's rule.
5. Null hypothesis, CER and prediction have no Explore screen.
6. The Drills filter moved from Details to "?".
7. The kit adapter gained one option, a part's own picture (`stage` on a part), used by the drills part.
8. Hub blurb reworded for the new Explore; title, description and URL unchanged.

## Build notes
- `bio/assets/tools/design-drills.js` (Explore at the top; the drills code below it unchanged except where it
  hands its stage and dock to the adapter) and `bio/assets/tools/design-drills.css` (new, kit2 pages only).
- `bio/assets/tools/bio-tools.js`: `studioKit2` takes `stage` on a part (that part's own picture in Test yourself,
  in place of the Explore stage). No other tool passes it, so nothing else changes.
- `bio/data/pages.json`: `"kit2": true` and the blurb.
- Sweep: `scripts/tools-v2/design-drills-sweep.mjs`.

## Checks run (2026-11-18)
- `node --test scripts/test/apbio-*.test.mjs` (74 pass), `check-apbio-content --check`, `build-apbio --check`,
  `check-site`, `check-weight --check`, `build-apcalc --check`, `build-apmacro --check`; `check-tool-use` with a local
  copy of its list: Design drills reports frame v2 (tool-open, tool-touch, tool-mode, tool-use; nothing under
  automation). `check-tool-use.mjs` itself unchanged.
- Sweep (`node scripts/tools-v2/design-drills-sweep.mjs --width W`, one width per process, light and dark): 8 Fair
  test states and 7 Sample size states plus Test yourself at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920:
  **32408 passed, 0 failed** (nothing clipped, no two labels or numbers within 4 px, the bench the largest thing,
  tap targets 44 px, the cause line two rows and one height on phones, drawn means equal the model, pills equal the
  drawn means and difference, error bars equal the drawn mean ± 2 SE, the verdict matches the bars drawn).
  `--frames`: frame by frame at 390 and 1440 through taps, three fast taps, a tab switch, fast drags up and down and
  New plants (611 + 610 frames, 389 each with a change running): every number is the one for the plants drawn, no
  result word while plants change, Sample size hides its numbers while plants come or go. Reduced motion: the result
  at once with a 0.22 s fade. 10 passed.
- Playwright (`/tmp`, not kept) at 390 (real touch tap, CDP touch drag of the knob), 768 and 1440 (mouse), light and
  dark: **139 passed, 0 failed**: opening, mid change words, water, keyboard Enter on warmth, aria-pressed, Start
  over and New plants bring the bench into view after scrolling down, Show me how, Sample size drag, Home and End
  keys with aria-valuetext, a wrong then a right variables drill (scores, record ids `design-drills:<scenario>:iv`
  and `:dv` stored), Experiment 2 of 16, The results view, Explore kept after Test yourself, `#drills`, free (no
  lock), no console errors.
- Frame times (`scripts/tools-v2/design-drills-perf.mjs`, CPU x4) on a 2 core container at load 7 to 10 (other
  builds running): 390 within target (median 16.7 ms, p95 33.4 ms for taps and the full drag); 1440 median 16.7 ms,
  p95 66.7 ms for taps and the drag. The page's own work is about 2.5 ms a frame at x4 (trace); what was fixed on
  the way: three svg layers (still room, plants and numbers, front), no reordering of plants, pots redrawn only when
  their size changes, sizes from the layout without reading the page, the words once a frame, text written only
  when it changes.
- Preview: `/mnt/user-data/outputs/design-drills-v2/index.html`; shots (`sweep-*`, `v-*`, including mid change,
  mid drag, regrow and New plants frames) in `/mnt/user-data/outputs/design-drills-v2/shots/`.

## Not done, and what I am not happy with
- The p95 frame time at 1440 under x4 throttling measured 66.7 ms on a loaded 2 core machine; the reviewer should
  measure on a quiet one.
- Test yourself keeps the experiments' own setup drawings from the 2026-11 review (icon level, smaller than the
  bench); bringing them to flagship level is 16 drawings of its own.
- On phones with 10 to 12 plants a group the plants are thin (leaves 7 px); they stay countable.
- The kit's tap look (dashed outline and hand badge) sits on the bench's front; the badges sit on the box's top edge
  so they do not cover the jug, bottle and switch.
- No real phone, no screen reader pass, no real students.
