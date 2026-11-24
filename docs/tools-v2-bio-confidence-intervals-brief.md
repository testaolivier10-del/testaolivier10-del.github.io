# Tools v2: AP® Biology Confidence intervals and error bars (brief and build notes)

Status file for the v2 rebuild of `bio/tools/confidence-intervals.html` (rollout row 38, group G, wave 4, free).
Plan: `docs/tools-v2-plans/bio-confidence-intervals.md`. Standard: `docs/tools-v2-standard.md`; builder rules:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-bio-confidence-intervals`, cut from `claude/tools-v2-all`.
NOT merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`.

## The one main idea
**Each bar's error bar is the mean ± 2 SE (SE = SD ÷ √n, the course's 95% confidence interval). When the two error
bars overlap, the difference may be chance; when they are apart, it is unlikely to be chance. More plants make the
bars shorter, so a small real difference can show.** CED skill `stats-confidence-intervals`; the course notes'
wording (`bio/data/notes/stats-confidence-intervals.html`): "No overlap ... the difference is unlikely to be due to
chance"; "Overlap: the data do not show a difference ... not evidence that the means are equal".

## Research (rule 10)
"Seen" means the page's text was fetched and read here; none of the interactives could be operated.

| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, seen and used) | Two bars with ±2 SE error bars; sliders for each group's mean, SD and n plus "both" sliders; drag a bar top (mean) or a whisker (SD); New sample; the overlap or gap band; a verdict and a readout of SE and CI; three goals | All of it: the bars, the band, New sample, the goals (Challenges); see "What moved" |
| GraphPad, "what you can conclude when error bars overlap" (seen) | SE bars: overlap means not significant, no overlap means nothing; 95% CI bars: no overlap with similar n means p well below 0.05, overlap means nothing for sure | The "may" and "likely" wording; the similar sample size caveat in "?" |
| Krzywinski and Altman, Nature Methods 2013, "Error bars" (seen) | SEM = SD ÷ √n; more samples, shorter SE and CI bars; 95% CI bars can overlap up to about half an arm and still differ at p 0.05; a CI is about 2 SE only for larger n | "More plants, shorter bar" as the quiet control; the nuance in "?" (and the exact t multipliers 2.78, 2.26, 2.09) |
| Seeing Theory, frequentist inference (Brown; seen as text) | Pick a population, n and the level; Start sampling draws one interval after another | New sample: chance alone moves the means |
| Magnusson, "Interpreting confidence intervals" (rpsychologist; seen as text) | Interval after interval around a true mean, tallies of hits and misses | Same idea; ours keeps one sample on screen and makes the population the student's own setting |
| StatKey (Lock5; only the menu could be read) | Bootstrap CI for a difference in means | Known only by name; nothing taken |

What ours does that none of these do: the data are drawn as the real thing (every seedling at its height against a
measuring board), the student grows or shrinks a whole tray by hand and watches its bar and error bar move on the
clipboard in the same frame, and adding plants makes new seedlings sprout one by one while each error bar steps
shorter as each plant is counted.

## The design
- **Picture:** a lab bench. Left (top on narrow stages): two black seedling trays of bean seedlings in soil,
  "Full light" under a bright grow lamp and "Shade" under the same lamp behind a shade cloth; a measuring board behind
  them with a line every 5 cm and a cm scale (0 to 30). Every plant is drawn at its height: a stem from the soil to
  its tip, two cotyledons low on the stem and two heart shaped first leaves at the tip, drooping so the tip is the
  top (shade plants paler and thinner). A line across each tray at the tray's mean, in its colour. Right (below on
  narrow stages): a clipboard graph "Mean height ± 2 SE": two bars from 0 cm in the trays' colours, each with its
  error bar (± 2 SE) and its "±3.6" above, "n = 5" under each name, and the region where the two error bars overlap
  tinted purple ("overlap"), or the gap between them tinted green ("gap"), or a thin slate line when they just touch.
- **Main control, on the picture:** the knob at the right end of the Shade tray's mean line ("mean 16.0 cm").
  Dragging it grows or shrinks every shade plant together (the spread kept). Keys: arrows 0.1 cm, Shift or Page
  1 cm, Home and End the ends (the mean stays where every plant fits between 0.8 and 29.7 cm).
- **Quiet controls:** a small knob on the tallest shade plant ("SD 4.0 cm"): drag it up and every plant moves away
  from the mean (the SD, 1.0 to 4.5 cm). Under the picture: "5 | 10 | 20 plants each" (new plants sprout one by one,
  extra ones shrink back into the soil; each tray keeps its mean and SD, so only n changes), "New sample" (new plants
  from the same two populations grow to new heights: chance alone moves the means), "Start over". New plants sprout in groups of about five; each group keeps the tray's mean and SD exactly, so as each group is counted only n changes; fewer plants keep the subset whose mean and SD are already closest.
- **Opens** on 5 plants a tray, means 10.0 and 16.0 cm, SD 4.0 cm each: ±3.6, overlap 1.2 cm, "may be chance".
  10 plants: ±2.5, 1.0 cm apart. 20 plants: ±1.8, 2.4 cm apart.
- **Cause line** (`K.cause`): "means 6.0 cm apart → bars overlap by 1.2 cm → may be chance"; "→ bars 1.0 cm apart →
  unlikely to be chance"; "→ bars just touch → unlikely to be chance" (touching is still no overlap). The overlap is worked out from the numbers as
  shown (each mean and each ± to 0.1 cm), so it always adds up.
- **Takeaways** (when the change settles, Explore only): 5 to 20 plants "Four times the plants, half the bar: SE = SD
  ÷ √n."; more plants turning overlap into a gap "More plants made the bars shorter, so the real difference shows.";
  New sample at 5 "With 5 plants a tray, chance alone moves the means a lot." and at 20 "... a new sample moves the
  means much less."; more spread turning a gap into overlap "More spread, longer bars: the same difference is harder to see."
- **Every change is animated:** a key press or Start over grows or shrinks the plants (240 to 520 ms); more plants
  sprout from the soil one after another and the others slide over; fewer plants shrink back into the soil and fade
  while the rest slide; New sample grows each plant to its new height in a wave; the leaves resize with the spacing.
  A drag moves the plants with the finger. Reduced motion: the result at once with a 260 ms cross fade.
- **Every number is read from the plants as drawn:** a plant counts once it has finished sprouting and stops
  counting as it starts to leave; the mean lines, bars, error bars, ± labels, n, the tags, the knobs, the tint and the
  cause line all come from the counted plants' drawn heights in that frame. So while plants sprout, n ticks up and
  each error bar steps shorter as each plant joins.
- **Cue:** "Drag the shade plants" beside the mean knob, once per device. "Show me how" (three pointers: the knob, the
  clipboard, the plant count) from the purpose line and from "?".
- **One colour per idea:** Full light amber, Shade blue (trays' lines, bars, names, tags), overlap purple, gap green,
  touch and the means' difference slate. The practice figure in Test yourself uses the same overlap and gap colours.

### What is on screen in Explore (counted at 1440, opening)
Outside the picture: the purpose line (7 words), "Show me how", the cause line (3 pills, 12 words), the plant count
(3 buttons and "plants each"), New sample, Start over. No side panel. Controls: 2 knobs on the picture, 3 count
buttons, New sample, Start over, Show me how.
On the picture: 2 tray names, the board's numbers (5 to 30 and "cm"; 10, 20, 30 on phones), "mean 10.0 cm",
"mean 16.0 cm" (the knob's tag), "SD 4.0 cm", the clipboard title, its 6 tick numbers and "cm", 2 bar names, 2 "n =",
2 "±", the band's word, and on a first visit the cue.

### Explore against Test yourself
- **Explore:** as above. Nothing locked, graded or asked.
- **Test yourself**, one dropdown on the stage ("What to practice"):
  1. **Problems** (the old Practice: new numbers or the three worked problems, the same parts, grading and record ids
     `confidence-intervals:<cid>:<part>`; `#practice` and `?seed=` open it). Its figure keeps its height on a phone,
     its words are at least 11 px, the overlap and gap colours are Explore's, the typed brackets are solid.
  2. **Challenges** (the old three goals and one new), on the Explore picture from its opening: add plants until the
     bars stop overlapping; spread the shade plants until they overlap again; halve a bar starting from 5 (5 to 20);
     with 5 plants, press New sample until chance alone flips the verdict. `#goals` opens it.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Bars of the means with ±2 SE error bars, the overlap or gap band | The clipboard, read from the drawn plants |
| Drag a bar's top (either group's mean) | Drag the Shade tray's mean knob; the Full light tray is the fixed reference (its mean moves only with New sample) |
| Drag a whisker to set that group's SD | Drag the tallest shade plant (the Shade SD); Full light keeps SD 4.0 cm |
| "n, samples per group (both)" slider, 2 to 40 | "5 / 10 / 20 plants each" (both trays) |
| "SD in each group (both)" slider | The shade plants' spread knob (one tray) |
| "Set each group separately" (mean, SD and n sliders per group) | Problems: each problem sets its own means, SDs and unequal n; "?" says so |
| New sample (means jump about by chance) | New sample, kept: new plants grow from the same populations |
| The verdict sentence and the SE and CI readout | The cause line; "?" works out this picture (n, mean, SD, SE = SD ÷ √n, mean ± 2 SE) |
| The step sentence ("SE = SD / √n = ...", "n is 4 times bigger ...") | "?" (worked out), the takeaways, the "halve a bar" challenge |
| The three goals | Challenges (and a fourth: chance flips the verdict) |
| Practice (5 contexts, 3 worked problems) | Problems, unchanged; the bean light context is the one drawn in Explore |
| The formulas and the overlap rule | "?" (the old text, plus the strict version and the beans) |

## Decisions made for the owner (also in the owner log)
1. Explore is two trays of bean seedlings (full light and shade) with a clipboard graph, not bars with sliders.
2. Only the Shade tray's mean is dragged; Full light is the fixed reference.
3. The SD is a quiet knob on the tallest shade plant (Shade only); Full light keeps SD 4.0 cm.
4. n is a "5 / 10 / 20 plants each" choice for both trays (was a 2 to 40 slider); 5 to 20 shows a bar halving.
5. Changing n keeps each tray's mean and SD exactly (only n changes); New sample shows chance.
6. Per group mean, SD and n sliders are left to Problems (each problem sets its own).
7. The overlap amount is worked out from the shown numbers (to 0.1 cm), so the cause line adds up.
8. "Just touch" (an overlap of 0.0 cm as shown) counts as no overlap: "unlikely to be chance" (review round 1).
9. Bars start at 0 cm (an honest bar graph); the clipboard's axis is fixed at 0 to 25 cm.
10. The shade plants open taller (16.0 vs 10.0 cm): seedlings in shade stretch toward the light; said in "?".
11. A fourth challenge: with 5 plants, chance alone flips the verdict.
12. The practice figure takes Explore's colours (overlap purple, gap green); its brackets are solid; its words 11 px.
13. Blurb reworded; the page title, description and URL unchanged; "?" keeps the old reference and adds a worked
    table, the strict rule and the beans.

## Accuracy
- SE = s ÷ √n with s the sample SD (n − 1); 95% CI ≈ mean ± 2 SE (the course and the exam use 2; the exact t
  multipliers 2.78, 2.26 and 2.09 for 5, 10 and 20 are in "?", `ci-two-se` already open in needs-author).
- The overlap rule in the course's words, never "proves": overlap "may be chance" (the data do not show a difference),
  apart "unlikely to be chance". "?" adds GraphPad's similar n caveat and Krzywinski and Altman's point that 95% CI
  bars may overlap a little and still differ at p < 0.05 (`ci-overlap` and `ci-overlap-rule` already open).
- Heights are invented (said in "?"). Sample means and SDs are kept to 0.1 cm at rest: New sample draws plants from
  N(mean, SD) and rescales them to their own mean and SD rounded to 0.1 cm. Logged as `ci-explore-beans` in
  `docs/apbio-needs-author.md`, with the "just touch" wording, the opening and the shade taller convention.

## What was built
- `bio/assets/tools/confidence-intervals.js` (rewritten; the practice figure kept), `bio/assets/tools/confidence-intervals.css`
  (new, this page only), `bio/data/tools/confidence-intervals.json` (`explore`; contexts and problems unchanged),
  `bio/data/pages.json` (`"kit2": true`, the blurb). The adapter `ApBioTools.studioKit2` is used as it is (a practice
  part and a docked Challenges part, as rates).
- `scripts/tools-v2/bio-confidence-intervals-sweep.mjs`: ten widths, one process each, light and dark; `--frames`;
  `--perf`; `--shots`.

## Checks run (2026-11-23)
See the bottom of this file ("Final run").

### Final run (2026-11-23)
- `node --test scripts/test/apbio-*.test.mjs` (74 pass), `check-apbio-content` (0 failing), `build-apbio --check`,
  `check-site` (no broken references), `check-weight --check` (623 budgets within range); `scripts/check-tool-use.mjs`
  with a local copy of its list: the page sends tool-open, tool-touch (explore), tool-mode (quiz), tool-use, nothing
  under automation.
- Sweep, one process per width, light and dark: **800 passed, 0 failed** (81 a width at 360 to 600, 79 at 768 to 1920:
  14 landmark states, the first visit with its cue, Challenges and Problems; at 360 to 600 also the shade mean at
  every 0.5 cm from 4 to 20 cm at 5 and at 20 plants). Each state checks clipping, 4 px between labels (and from the
  error bars' ends), text and leaves at least 11 px and 8 px, knobs 44 px and 30 px apart, sideways scroll, the phone
  cause line, and that every number agrees with the plants as drawn.
- Frames: **47 passed, 0 failed** (1,260 frames at 390 and 1,337 at 1440, every one agreeing): a real drag of the
  mean out and back past the other tray, keys, the SD drag, 5 to 20 and back, a change on top of one still playing,
  New sample at 20 and 5, a drag while plants sprout, Start over, leaving to Test yourself mid change and back, a real
  touch drag at 390 (the mean moves, the page does not scroll), reduced motion (at once, with the cross fade).
- Challenges run by hand: all four meet with their sentences; Problems unchanged.
- Perf, CPU x4, the same hour as the flagship (load 5.4 on the machine): the mean drag at 20 plants median 16.7 ms,
  p95 16.8 ms at 390 and 33.4 ms at 1440; the spread drag p95 16.8 ms at both; 5 to 20 plants sprouting p95 33 ms at
  390 and 50 ms at 1440. The flagship's fertilizer drag in the same run: median 33.4 ms, p95 83 ms at 390 and 317 ms
  at 1440.
- Preview: `/mnt/user-data/outputs/bio-confidence-intervals-v2/index.html`; shots in `shots/` (sweep states at 390,
  768 and 1440 light and dark, Challenges and Problems, mid animation `mid-*-sprout`, `mid-*-sample`,
  `mid-*-startover`).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students; the independent review is still to come.
- At 20 plants on a phone each tray is a dense row of small seedlings (leaves 8 px); still drawn plants, not dots.
- While plants sprout, the leaves of every plant resize toward the new spacing at the same time; mid change the
  plants look thin for about half a second.
- The clipboard's bars start at 0 cm (honest), so a small gap at 10 plants is only a few pixels on a phone; the
  cause line carries the number.
- The sprouting change at 1440 under CPU x4 reached p95 50 ms (the budget's edge) on a loaded machine.
- The overlap tint sits between the two error bars only, so on narrow clipboards it is a short strip.

## Review round 1 (2026-11-23): BLOCK, fixed
`/home/claude/review-bio-ci/REVIEW.md`. Statistics, frame agreement, perf, touch, Test yourself and nothing dropped
confirmed. Merged `claude/tools-v2-all` first (three append conflicts in the status docs, both sides kept).
Must fix:
1. **Just touching bars** now read "bars just touch → unlikely to be chance" (touching is no overlap; p about 0.01 to
   0.02); the "?" bullet, the live line, owner log line 8 and `ci-explore-beans` say so.
2. **Only n changes:** new plants sprout in groups (about five each, sharing one clock so a group is counted on one
   frame) whose values have mean 0 and Σz² equal to their size, so the tray's mean and SD stay exact as each group
   joins; fewer plants keep the subset (every subset tried) whose mean and SD are closest, then restandardize by a
   hair. The frames run checks 5 to 20, 20 to 5, 5 to 10, 10 to 20, 20 to 10 and 10 to 5, from the opening and after
   New sample: each tray's drawn mean and SD within 0.1 cm on every frame and the verdict changing at most once.
3. **Phones:** the clipboard is taller and its plot uses more of the paper; the tint runs between the two bars'
   centres, over the bars and under the error bars; the band's word sits on the band only when the band is the
   word's height plus 8 px, else just over or under it; each ± sits beside its top cap on the outer side.
4. **The cue** sits on the empty board above the tallest shade plant, pointing down at the knob; the SD tag waits
   until it goes. The sweep fails a cue over any plant's top, a mean line or a label.
Should fix: S1 the opening kept (the 10 plant gap stays 1.0 cm), the live "?" line says "by the course's rule" and
points to the strict note; S2 leaves never under 11 px and resize over the whole sprouting; S3 "so" dropped from the
spoken cause line; S4 "moves the means much less"; S5 the SD tag says "(max)" at its cap; S6 the brief's name in the
data fixed.
Checks after the fixes (speed rule, fix round): sweep at 360 and 390 (81 each), 1024 and 1440 (79 each), light and
dark, **320 passed, 0 failed**; frames **65 passed, 0 failed** (1,152 frames at 390 and 1,315 at 1440, plus the
eighteen "only n changes" runs); AP Bio tests 74 pass, content check 0 failing, `build-apbio --check`, `check-site`.
The cue stops short of the clipboard on wide stages, so it never covers a tick number.

## Recheck 1 (2026-11-23): BLOCK on one item, fixed
1. **R1, the cue on phones pointed at the spread knob.** The cue's anchor is now the mean knob's x; the kit keeps the
   arrow there while it slides the bubble inside the picture, and on wide stages the tool slides it further left so
   it stays clear of the clipboard. The sweep now fails the first visit unless the arrow is above the mean knob and
   within 12 px of it across.
2. **Should fix, 10 to 5 after New sample.** When the best kept subset is more than 0.02 cm off, the change runs in
   two steps: first every plant moves, all still counted, the kept ones to their final heights and the others among
   themselves, the whole tray rescaled every frame so its mean and SD stay exact; then the others leave. The frames
   run checks 10 to 5 after New sample four times (and 20 to 10, 20 to 5, 5 to 20, 10 to 20): every frame within
   0.1 cm, at most one verdict change.
Integration round checks: sweep at all ten widths, one process each, light and dark, **800 passed, 0 failed**;
frames **75 passed, 0 failed** (1,097 frames at 390 and 1,169 at 1440, plus 28 "only n changes" runs); AP Bio tests
74 pass, content check 0 failing, `build-apbio --check`, `check-site`.
