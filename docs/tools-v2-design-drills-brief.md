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
  group. Each group is a tray of 6 potted bean plants under the same grow light, with its watering can and a heat
  mat under the tray. A ruler stands behind each group. After 3 weeks the plants stand at their heights; a line
  across each group marks the mean ("18 cm"), and a bracket between the groups gives the difference ("+6 cm").
- **The main control, on the picture:** the three things the test group gets, tappable on its side: the
  fertilizer bottle, the watering can, the heat mat. Each tap switches it between "same as the control" and
  "different" (Fertilizer / No fertilizer, Same water / Less water, Same warmth / Warmer). One control never moves
  another.
- **Instant result:** the plants grow or shrink to the new result (a 650 ms tween; leaves droop with less water);
  the means and the bracket follow the plants as drawn, every frame.
- **What differs, drawn:** every item that differs between the groups gets an amber ring on BOTH sides and the
  word "differs" on the test side. One ring: a fair test. Two or three: a confound.
- **Opens** on a fair test of fertilizer (the only difference): test plants 6 cm taller.
- **Cue:** "Tap the water" on the test group's watering can, once per device.
- **Cause line** (`K.cause`), set when the plants settle (the first pill changes at once):
  "Only fertilizer differs → test 6 cm taller → fertilizer made the difference";
  "Fertilizer and water differ → test 1 cm taller → can't tell which did it";
  "Nothing differs → same height → nothing is tested".
- **Under the picture:** Start over (a link).

### Tab 2, Sample size
- **The picture:** the same bench, a fair test of fertilizer only (rings on the fertilizer, as tab 1 draws it).
  Plants vary by chance (SD 3 cm; the true difference is 6 cm). Each group shows its plants, its mean line and its
  ±2 SE error bar beside the ruler; the bracket gives the difference of the means.
- **The main control, on the picture:** one knob on the bench's front edge, "Plants per group", 1 to 12. Its value
  rides on it ("4 plants"). Adding a plant brings a pot in and the plant grows; removing one takes it away.
- **Secondary, quiet:** "New plants" under the picture: the same experiment with a new batch of seeds (the plants
  shrink back into the soil and regrow). With 1 or 2 plants each, the result jumps around and can even reverse;
  with 10 it hardly moves.
- **Labels wait for the picture:** while any plant grows from the soil, the means, bars and bracket fade out and
  the cause line says "Growing"; they come back when every plant has finished.
- **Cause line:** "1 plant each → no spread to measure → can't tell"; "3 plants each → bars overlap → can't tell
  yet"; "8 plants each → bars apart → fertilizer made a real difference".
- **Cue:** "Drag for more plants" at the knob, once per device.

### What is on screen in Explore (counted at 1440 and 390, opening state)
Outside the picture: 2 tabs, the purpose line (6 words), "Show me how", the cause line (3 pills), Start over (tab 1)
or New plants (tab 2). That is 4 controls and about 20 words. No side panel, no graph, no readout cards.
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
2. Fertilizer is the variable tested; light is the same over both groups and cannot be changed (etiolation makes
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
