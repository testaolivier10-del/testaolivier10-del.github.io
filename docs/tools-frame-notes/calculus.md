# AP Calculus AB and BC tools in the standard frame (F4, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`. Reference: `docs/tools-frame-notes/ochem.md`. AB and BC share the kit
`calculus/assets/tools/calc-tools.js` (BC pages load it with `window.ApCalcCourse`); AP Precalculus and AP Statistics
got the same changes in their own kits (`precalculus.md`, `statistics.md`). No page markup changed, so every course
build (`--check` for AB, BC, Precalc, Stats) is byte-identical.

## What the kit does for every tool (studioFrame, modes, studioPane, drill)
Every tool already had two real modes (Explore and Test yourself; rule drills "Rule picker", symbolic steps "Is it
the same?"): they stay, in the bar.

| Before (calm frame) | Now (standard frame) |
|---|---|
| Bar: title, course, tutor, "?" (Why), menu | Bar: title, the page's own one line lede, modes, tutor, Share, "?" (the second tab: numbers, settings, About), menu |
| "Start here" cue as the first line of Why | Explore's head: kicker Explore, the tool's question (`STD[slug].task`), the cue as the "what to do" line (it follows the tool when the tool rewrites its cue); the cue's own copy hides |
| Scenario select behind a "Setup" row (opened Details) | `stagePick`: one dropdown at the stage's top left ("n of N"); the select stays in More options, hidden, and still drives the tool (`choiceSelect.set` keeps it in step through `ls-sync`) |
| Scenario chips in the dock | `chipPick`: the same dropdown; the chips stay, hidden, and a pick clicks one |
| Drill: problem type behind More options | the problem type is the stage's dropdown in Test yourself |
| Drill head: problem text as caption | task: kicker Problem, the problem's title, "Answer one step at a time"; the problem text stays the caption (or on the stage) |
| Method shown after the 1st wrong try, Show the answer after the 2nd | hint ladder: Hint gives the method at once; Show the answer opens after one real wrong try. The targeted note for the slip and the picture of the student's answer stay in the step's feedback |
| Why held "the worked solution appears here..." | Why is empty (Explanation hidden) until the solution is in |
| End: caption "n of m right", the worked solution opened itself | finished card: n of m right, a takeaway (`STD[slug].takeaway`, per problem type where a tool mixes topics), New problem, Worked solution, Review your steps (gives the steps back), the lesson and notes links. The keep going strip, glossary terms and Report stay under Review your steps |

Nothing was removed. Explore controls (sliders, segmented sub views, Play, Start over, settings in More options)
stay where they were: each tool's sub views are real choices the student makes, not scenarios.

## Per tool (AB)
| Tool | Features | Where now | Judgment, fixes |
|---|---|---|---|
| Accumulation | graph of f picker, drag point / x slider, Build g / Not change, Sweep, g readouts, Why, numbers, drill (4 kinds) | picker on stage (Graph of f), rest as before | |
| Area and volume | region picker, slice drag, Area / Revolve / Cross sections, dx / dy, 3D view, numbers, drill | picker (Region) | |
| Curve analyzer | Curves / Optimize, function or scene chips (6), graphs shown, cursor slider, sign charts, drill (6 kinds) | chips are the stage dropdown (label follows Curves / Scene) | Bug: the f′ graph problem's "relative maximum" step showed the absolute maximum method; it now gets its own |
| Limit explorer | function select (7), zoom slider, Play, Fill the hole, tracers and table, drill | function is the stage dropdown | |
| Motion lab | Position / Velocity given, motion chips, x / v / a views, Play, time slider, drill | all motions in one grouped dropdown (Position given, Velocity given); the segment stays | |
| Related rates | scene chips (5), rate slider, Play, Start over, drill | scene dropdown | |
| Riemann sums | function / table / context picker, Left Right Midpoint Trapezoid, n, Add them one by one, every strip table, all four compared, drill | picker; rest unchanged | |
| Rule drills | typed function, example chips, rule tree, drill | unchanged layout | Examples stay chips: they fill the box, they are not a scenario |
| Slope fields | equation chips (6), drag the dot, Exact solution, Start over, density settings, drill | equation dropdown | |
| Tangent tracer | function select with Your own f, h slider and ruler, h → 0, Tangent, Trace f′, secant table, drill | function dropdown; caption drops its "Start here" sentence (the task says it) | Bug: Test yourself crashed (`METHOD` was defined after the drill started); moved up |

## Per tool (BC)
| Tool | Where now | Judgment, fixes |
|---|---|---|
| Euler and logistic | equation chips to dropdown; Euler / Logistic and Steps stay | |
| Integration methods | integral chips to dropdown; Parts / Partial fractions / Improper stay | Bug: the "drag the bound b ... rectangle uv" cue showed in every technique; each now has its own line |
| Parametric motion | path chips to dropdown; Velocity / Acceleration / Tangent stay | |
| Polar lab | curve chips (and their "Curve" disclosure) to dropdown, label follows One curve / Between two | |
| Series lab | series chips to dropdown; Number / Power series stays | cue said "open Why", now "open Explanation" |
| Taylor lab | function chips to dropdown; degree, band | |

## Shared layer
No change: the first-run hint line that showed in Test yourself is hidden by F3's shared fix (a target out of
sight hides its line).

## New copy for an accuracy check (in `STD` in calc-tools.js, plus)
- Explore questions: all `task` lines (questions, low risk).
- Takeaways: accumulation, area-volume, curve-analyzer (and optimize), limit-explorer, motion-lab (and dist / graph),
  related-rates, riemann-sums, rule-drills, slope-fields, tangent-tracer, euler-logistic, integration-methods,
  parametric-motion, polar-lab, series-lab, taylor-lab.
- Curve analyzer method for the relative maximum choice: "Look for the x-values where the graph of f′ crosses the
  axis from above to below: f′ changes from positive to negative there."
- Integration methods cues: partial fractions "Move x and watch the two simple fractions add up to the whole one.";
  improper "Move b toward the limit and watch whether the area settles to a number."

## Seen, not changed (questions)
1. Parametric motion "Slope of a parametric curve": the quiz plot's axes run to ±60, so the curve is a sliver.
2. Rule drills: after a wrong expression step the small yours vs right graph can be nearly empty.
3. On a phone the quiz figure is small (the shared quiz layout shrinks the stage to its content).
