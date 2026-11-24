# Tools v2: AP® Statistics Interval capture (brief and build notes)

Status file for the v2 rebuild of `statistics/tools/ci-capture.html` (rollout row 53, group G, wave 15, Premium).
Plan: `docs/tools-v2-plans/stat-ci-capture.md`. Standard: `docs/tools-v2-standard.md`; builder rules:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-stat-ci-capture`, cut from `claude/tools-v2-all`.
NOT merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`. The first AP® Statistics tool on the kit: it adds the course adapter
`ApStatTools.studioKit2` (spec decision 19).

## The one main idea
**About C% of intervals built this way capture the true value; a higher level gives wider intervals that miss less
often.** AP wording (`docs/apstat-authoring-guide.md`): "we are 95% confident" means the method captures the true
value in about 95% of samples; never "a 95% chance the true value is in this interval".

## Research (rule 10)
"Seen" means the page's text was fetched and read here; none of the interactives could be operated (Java or a
client app).

| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, read and used) | 100 intervals against a line at the true value, capture green, miss vermillion and crossed; level buttons, an n slider; the running rate; tap a row to read its parts | All of it (see "What moved") |
| Rossman/Chance applet index (seen as text; the applet page itself not reached) | "Simulating Confidence Intervals for Population Parameter" | Known by name: one row per interval and a running rate (the plan) |
| Online Statistics Education, CI simulation instructions (seen) | 100 samples of 10, 15 or 20 from N(50, 10); 95% and 99% intervals for the same samples, misses coloured; cumulative counts | The same samples rebuilt at another level; the normal mean 50 setting |
| Seeing Theory, frequentist inference (seen as text) | Distribution, n, level; Start sampling draws one interval after another (from Magnusson's) | Each interval arriving, not appearing |
| Magnusson, rpsychologist CI (seen as text) | Intervals stack under a population line; "μ included / missed" tallies; a coverage plot near 95% | The tallies as the header counts; coverage beside the level |
| Reinhold, Albany proportion CI applet (seen) | 100 samples at a time, 95% and 99% intervals, misses red; suggested runs n = 30 with p = 0.1 vs 0.5 | Small n and a rare trait show coverage below the level |
| SERC/CAUSE activity on a CI applet (seen) | Students run 1,000+ intervals and see coverage settle | "Build 100 more" and the rate over all intervals |

What ours does that none of these do: the population is drawn (a crowd, or people standing at their values), each
sample is scooped from it and flies down into its interval, and the rate plot is against the level (with the same
samples), so "rate follows level" is a line the dots fall on.

## The design
- **Picture:** three parts. The population (top left; top on phones): a crowd on a schoolyard for a proportion, the
  "yes" people in blue and exactly p of the crowd; for a mean, people standing at their values on a floor scale, so
  the crowd has the population's shape (normal or skewed right), μ marked. The board of rings (the biggest part):
  100 rows, each a ring with two end posts at its interval's real ends, the orange dot at its statistic, against a
  blue peg at the true value; green rings hold the peg, vermillion ones miss it (thicker, with a cross on the peg's
  side). An axis with the statistic's values and the peg's label at its foot. The rate plot: the capture rate of
  every interval so far at the drawn level, against the line rate = level, with the levels already tried as small
  hollow dots.
- **Main control:** Build 100 intervals (under the picture), then the level knob in the board's header (80 to 99%,
  any whole percent). A drag moves the rings with the finger; a key press tweens them (320 ms).
- **Quiet:** the sample size knob under the crowd (the old n lists; a change throws 100 new intervals), the
  population picker beside "Show me how", Start over.
- **Animates:** each sample is scooped (the first two of the first build slowly, with an orange lasso in the crowd),
  flies down as an orange bundle, lands as the dot and grows its ring out to its posts; the 100 take about 1.3 s
  (2.5 s the first time). A level change stretches every ring from its centre, flips flash; a change of n drops the
  rings and throws new ones; a population change cross fades. Reduced motion: the result at once with a 260 ms
  cross fade.
- **Every number is read from the rings as drawn:** a ring counts once it has grown to its posts; its colour is its
  drawn ends against the drawn peg; the header counts, the cause line, the level label (the drawn width's level), the
  rate dot and its value all come from those rings in that frame.
- **Cause line:** "95% level → 96 of 100 capture p → about 95% in the long run"; after a level change "80% level →
  narrower → 82 of 100 capture p"; a picked row "p̂ = 0.420 → ± 0.0967 → captures p". The third pill is the
  method's long run rate (exact for a proportion and a normal mean, simulated for the skewed one): "about" within 2
  points of the level, otherwise "below" or "above".
- **Takeaways** (once each): "Over many samples, about 95% of 95% intervals capture the true value."; "A higher level
  makes every interval wider, so more of them capture p."; "A lower level makes every interval narrower, so more of
  them miss p."; "Larger samples, narrower intervals; about the same share still capture p."; when the method falls
  short: "In the long run fewer than 95% of these capture p: see ? for why."
- **Cue:** "Start here" beside Build (right of it when the button starts its row, left of it when it ends one),
  once per device. "Show me how" (three steps: Build, the level knob, tap a row) from the purpose line and "?".
- **Height:** below 1000 px the scene's height is what is left of the screen under the head and above the cause line
  and Build, so the picture, Build and the cause line show together (390 × 844, 768 × 1024); on a desktop the frame
  gives the stage its height (1024 × 768, 1280 × 800 checked).
- **Colours:** population and true value blue, sample and statistic orange, capture green, miss vermillion, the
  level the course ink (as the old tool and the sampling machine).

### What is on screen in Explore (counted at 1440, after one build)
Outside the picture: the purpose line (7 words), the population picker, "Show me how", the cause line (3 pills,
about 12 words), Build 100 more, Start over. On the picture: the crowd's title, "Sample size n = 50", the two counts,
"Level 95%", the axis numbers and its name, the peg's label, the rate plot's title, its value and count, its tick
numbers and "rate = level". Controls: 2 knobs on the picture, the rows (tap or arrows), Build, Start over, the
picker, Show me how.

### Explore against Test yourself
- **Explore:** as above; nothing graded.
- **Test yourself:** unchanged: the step drill (four kinds: interval for a proportion, for a mean, a claim, what the
  level means) with its figure, first tries recorded as `ci-capture:<context>:<step>`; `?seed=` and `#quiz` open it.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| 100 intervals against the true value, capture green, miss vermillion and crossed | The board of rings, kept |
| Build 100 intervals (and again, up to 20,000) | Build 100 intervals / Build 100 more, kept |
| Level buttons 80, 90, 95, 99 | The level knob, 80 to 99 (every whole percent) |
| Sample size slider (the same n lists) | The quiet knob under the crowd |
| Population radio buttons (two proportions, two means) | The population picker |
| True proportion slider | "?" More settings (a change starts over with a new crowd) |
| Use z* instead of t* for a mean | "?" More settings |
| The running rate over all intervals | The rate plot at each level tried, and its value "95.4% of 500" |
| Tap or arrow to a row, its parts | Kept; the parts in the cause line, step by step in "?" |
| The critical values table | "?" (with each level's long run rate) |
| The "why" text, conditions notes, "Say it right" | "?" |
| The landing with 20 intervals drawn | The crowd and an empty board with the cue (owner log) |
| Test yourself drill | Unchanged |

## Decisions made for the owner (also in the owner log)
1. The population is drawn (a crowd or people at their values); each sample is scooped and flies into its ring.
2. Rings with end posts against a blue peg; colours and the cross kept.
3. The level buttons became a knob (80 to 99), shown after the first build.
4. n is a quiet knob; a change throws 100 new intervals.
5. The rate plot is against the level (with the levels tried), not against the number of intervals.
6. The cause line's third pill states the method's long run rate ("about", "below"), exact or simulated.
7. True p and z* moved behind "?".
8. The picked row's parts and the critical values table moved behind "?" (parts also in the cause line).
9. The landing shows no intervals, with the cue at Build.
10. The takeaway is shortened to fit two phone rows.
11. The AP Statistics adapter `ApStatTools.studioKit2`; `"kit2": true` for this page only.

## Accuracy
- One proportion z interval p̂ ± z*√(p̂(1 − p̂)/n) and the t interval x̄ ± t* s/√n with df n − 1: the model's
  `intervals()` (tested equal to ApStatDist's `ci1prop` and `ci1mean`).
- Long run rates: a proportion's is the exact sum over x = 0..n of the binomial probability of the x whose interval
  holds p; a normal mean's is the level (t*) or 2 P(T ≤ z*) − 1 with df n − 1 (z*); the skewed mean's (gamma with
  shape 2, μ 30, σ 20) is simulated, 200,000 samples per n (`scripts/tools-v2/stat-ci-capture-cover.mjs`, data
  `explore.skewCover`). Examples: rare trait p = 0.08, n = 50, 95%: 91.2%; skewed n = 5, 95%: 91.6%; walk p = 0.40,
  n = 50, 95%: 94.1%.
- Never "a 95% chance the interval holds the value": "?" says so in "Say it right"; the takeaway and the long run
  pill describe the method. Open points: `docs/apstat-needs-author.md` "Interval capture v2".

## What was built
- `statistics/assets/tools/ci-capture.js` (Explore rewritten; Test yourself unchanged), `ci-capture.css` (v2 rules
  appended, the drill figure's kept), `statistics/data/tools/ci-capture.json` (`explore`: purpose, crowd words,
  `skewCover`), `statistics/data/pages.json` (`"kit2": true`), `scripts/build-apstat.mjs` (kit2 links),
  `statistics/assets/tools/stat-tools.js` (`studioKit2`), the build test's fixture `pages.json`.
- `scripts/tools-v2/stat-ci-capture-sweep.mjs` (ten widths, one process each, light and dark; `--frames`; `--perf`;
  `--shots`), `scripts/tools-v2/stat-ci-capture-cover.mjs` (the skewed long run table).

## Checks run
See "Final run" below.
