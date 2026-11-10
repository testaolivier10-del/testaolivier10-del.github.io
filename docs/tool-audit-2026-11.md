# Tool audit, second pass (2026-11-10)

The hands-on audit of October (`docs/tool-audit-2026-10.md`) for the courses built after it. Same bar, the
NREMT body map: it just works, is very interactive, gives good information, is good at its job and is
interesting; simple on landing with extra information revealed progressively; professional illustration
quality; easy to see and use on a phone; opens full screen as just the tool. Scores are 1 to 5 against that
bar. One section per course group; each helper edits only its own sections.

## AP Psychology

Ten tools in `psychology/tools/`. Tested in headless Chrome at 390x844 and 1280x800 with Premium unlocked
locally (a cached pass for a stubbed signed-in user), every Explore tab, every control, and Test yourself with
wrong answers on purpose, Show the answer and New problem. Console errors, failed requests and sideways scroll
were recorded at every step.

Mechanical result, before and after: no console errors, no failed requests and no sideways scroll on any tool
at either width.

### Ratings and fixes

| Tool | Score | What was fixed |
|---|---|---|
| Neuron | 4.5 | Nothing needed. The model answer for the drug examples was checked (ropinirole, haloperidol, cocaine). |
| Brain map | 4.5 | Split brain, callosum intact: the caption read "The both hands find the key." |
| Sensation and perception | 4.5 | The trial tally read "1 misses" (and "1 hits", "1 false alarms"). |
| Conditioning lab | 4 | Science: after a short extinction a rest showed FEWER drops, under a caption saying the response "came back". A rest now gives back 45% of what extinction took away, the recovered level is the ceiling for the next rest (so each recovery is smaller) and two rests in a row count once. When very little had faded the caption says so instead of claiming recovery. The "rest" label ran through the graph's title. Phone drill "Reading a conditioning record": the three legend names ran into each other and the trial numbers were crowded; the graph is now drawn at the size it is shown, with a short third name. |
| Stats lab | 4 | At 2 SD the headline said "about 3%" beside "0.15 + 2.35 = 2.5%" (and 98% beside 97.5%); exact halves are now shown as they are. Phone: the correlation slider sat under the fold with no handle on the picture; it is the pinned control on that tab. |
| Memory lab | 4 | Phone: the box for typing recalled words sat at the very foot of the screen, half hidden; it is the pinned control while recalling. "No review: about 20% kept on day 30 (no review: 20%)" said the same thing twice. |
| Social influence | 4 | Phone, Groups: the pool chart's column names ran together ("alonewatchedalonewatched"); "alone" and "watched" now sit on different lines. Phone, Obedience: "protests through the wall" ran off the right edge. Desktop: "8 people" wrapped under itself beside the slider. Phone: the first slider sat under the fold; it is the pinned control on Conformity. |
| Development | 3.5 | Phone: the studio shortened the stage to keep "Play a life" on screen, which cut off the fourth timeline lane, the age axis, the third strange-situation panel (the one that matters) and the parenting scene on every lens. The Play row now sits in the dock's flow, the stage keeps its full height on every lens, and the age slider is the pinned control. Parenting: the dot sat on its own quadrant's name ("Aut●ritative"); the name moves clear of it. |
| Article analysis studio | 4 | Nothing needed. |
| Evidence builder | 4 | Nothing needed. |

Shared, in the course's tool framework (`psy-tools.js`):

- A first-run tip that was waiting for its control to scroll into view appeared in the middle of the task when
  the student had already tapped that control half hidden (memory lab: "Start here: study ten words" during
  recall). The wait now ends at the first tap, key press or input inside the tool; scrolling does not end it.
- A finished drill said "The worked solution is under Why." The button is called Explanation.

Facts checked and left alone: Asch (under 1%, 3%, 13%, 33%, about 32%, about 6% with a partner), Milgram
(65%, 62.5%, 40%, 30%, 22.5%, 47.5%, 10%; 40 men per condition), Darley and Latane (85%, 62%, 31%), Michaels and
colleagues (71 to 80%, 36 to 25%), Latane, Williams and Harkins (82%, 74%), the 68-95-99.7 bands, Weber's law
(8% for brightness), signal detection, the serial position curves, proactive and retroactive interference, the
four attachment patterns, the four parenting styles, split-brain outcomes and the reinforcement schedules.

### Still open

- **Controls under the fold on a phone.** The studio pins one control per tool. These tabs still need a scroll
  to reach their controls, and the top of the picture scrolls away while they are used: conditioning lab
  (Schedules, Consequences; the Classical buttons are half visible on purpose, see `conditioning-lab.css`),
  development (Attachment, Parenting), memory lab (Forgetting), sensation (Perceive's eleven cue chips),
  social influence (Obedience, Bystanders, Groups). A fix needs the studio to pin a
  control per tab; that is a shared-file change, not made here.
- Stats lab drill "Two tests, two z scores": on a phone the second curve is below the fold of the short drill
  stage (it scrolls inside the stage).
- Conditioning drill "Which schedule?": the four small records need a scroll inside the stage on a phone.
- Social influence, Groups scene: a head covers part of "blindfolded, headphones on". Stats lab at z = -2:
  the handle sits on "13.5%". Brain map, split brain, right field: the pathway crosses "corpus callosum (cut)".
- Milgram's telephone condition is 22.5% here (9 of 40, Milgram 1974); some textbooks print 20.5%. Logged in
  `docs/appsych-needs-author.md` with the conditioning model change, for the accuracy reviewer.

### Rebuild candidates

- **Development (3.5).** Weak: four lenses that share little (a lifespan timeline, three strange-situation
  panels, a parenting grid, an aging graph), and the one a student lands on is a dense four-lane chart with a
  small scene above it; on a phone it only just fits. Proposal: make it one life you move through. The scene
  takes the stage, the age handle runs along its foot, and one lane at a time (Piaget, Erikson, attachment and
  peers, body) is chosen with a chip and shown as a single band under the scene, with the other three a tap
  away. Attachment becomes the scene at 12 to 18 months (press "Parent leaves", "Parent returns", pick the
  pattern), parenting the scene at 15 years (drag the dot, the two people react), and the aging graph the
  scene from 60 on, so every concept is met at the age it belongs to instead of in four separate tabs.
- **Social influence (4, but uneven).** Weak: Conformity is a real experiment you can change; Obedience,
  Bystanders and Groups are chip pickers over a bar chart, and on a phone the chips are under the fold.
  Proposal: give each of the three the same shape as Conformity. One scene, one control on the stage itself
  (drag the experimenter away from the teacher and the learner closer; add bystanders to the hallway one tap
  at a time; add an audience to the pool table), with the classic result drawn as the bar that grows or
  shrinks as you do it, and the chart of all conditions kept under Details.

## AP Macroeconomics

Eight tools in `macroeconomics/tools/`, tested the same way. Every Graph Studio scenario (62 across eight
graphs) and every shock in the AD-AS lab, the forex lab, the reserves lab and the policy chain was run and its
outcome read against `docs/apmacro-authoring-guide.md`: every curve shifts the right way, self-adjustment
works through nominal wages and SRAS, ample-reserves actions use administered rates, and the foreign exchange
axes are the right way up. No wrong economics was found.

Mechanical result, before and after: no console errors, no failed requests and no sideways scroll on any tool
at either width.

### Ratings and fixes

| Tool | Score | What was fixed |
|---|---|---|
| Graph studio | 4.5 | Phone: the view switch cut "Foreign exchange" to "Foreign excha...". |
| Forex lab | 4.5 | Phone: "What changes?", the one control that starts everything, sat under the fold; it is the pinned control. |
| Policy chain | 4.5 | Nothing needed. |
| AD-AS lab | 4.5 | "Recessionary gap" and "Inflationary gap" were printed over the shifted curve's own name (AD2) for every AD shock; the label now takes the first free side of its bracket and has a halo so a line behind it does not strike through it. |
| Reserves lab | 4 | Phone: the action buttons were under the fold on landing and only stuck to the screen after the first press; the row is the action row from the start, so the stage fits it on load. Sell bonds with ample reserves: E2's label sat on "IORB rate". Phone drills: the graph was drawn taller than the short drill stage, cutting off its horizontal axis and curve names, and "Start over" sat under the Enlarge button. Wording: "a ample reserves tool", "Interest rates: rises". |
| Multiplier lab | 3.5 | In light mode the tax bars and the cash deposit bar drew black and the gap meter's "too far" and "wrong way" fill lost its color (the color tokens were set on a box the studio moves the figure out of). "$10,000" was cut off at the left of the money chart and the top number sat on the axis name. Bars that go down: the total's number sat on "Total" and "$0" sat on "0". Phone, money tab: M1/M2 and i1/i2 on the small money market graph were printed on top of each other, the long axis name was cut off, and a signed amount broke after its minus sign. Phone drills: the chart's column names were cut off and the Enlarge button sat on "Total". |
| PPC and trade | 4 | Phone: the Robots slider sat under the fold, with the curve scrolled away once reached; it is the pinned control on the PPC tab. |
| Indicators lab | 3.5 | Nothing changed. See below. |

Shared, in the course's tool framework (`mac-tools.js`): the same waiting first-run tip fix as psychology.

### Still open

- **Indicators lab, Jobs, on a phone.** The eight event buttons are under the fold, and with the page scrolled
  far enough to press the lower ones only the four rate tiles are left on screen: the dots that move are gone.
  No single control to pin. This is the main reason it is a rebuild candidate.
- Controls under the fold on a phone, other tabs: multiplier lab (the MPC row is half visible, the amount
  slider under it), PPC and trade (Trade tab), indicators lab (Prices: the year slider is half visible).
- Policy chain drill with a graph: the first link's card is cut by the short drill stage on a phone (it
  scrolls). Multiplier drill "Close the output gap" with a small gap: LRAS and SRAS names touch on the small graph.
- Multiplier lab drills say "The Federal Reserve buys ..."; the reserves lab says both "the Federal Reserve"
  and "the central bank". The invented-countries rule lets dollars stand but says graded content never has a
  real central bank do something. Logged in `docs/apmacro-needs-author.md`; not changed here.

### Rebuild candidates

- **Indicators lab (3.5).** Weak: four unrelated mini tools behind tabs (a GDP sorter you press "Next" through,
  two year sliders over charts, a labor force dot grid), none of which the student does anything to except
  press a button, and the best of them (Jobs) does not work on a phone. Proposal: one economy you run. The
  stage is the dot grid of 100 people beside a GDP bar; each event is a card dealt onto the stage ("a factory
  automates", "a family buys a used car", "prices rise 10%") that the student drops where it belongs (a
  bucket of C, I, G, NX or "not counted"; a group of people; nominal or real) before the numbers move, so
  classifying is the interaction instead of the caption. Rates, CPI and real GDP update in a strip under the
  stage and the formulas stay in Details.
- **Multiplier lab (3.5).** Weak: the picture is a bar chart with a number strip, the three tabs are three
  different tools (rounds of spending, closing a gap, money creation), and the money tab squeezes a bar chart,
  a balance sheet and a graph onto one phone screen. Proposal: show the rounds as money moving. A dollar of
  new spending drops into the first household, the saved share falls out into a "saved" jar and the rest
  flows on to the next, round by round, with the running total filling a bar beside it; MPC is a slider on
  the split itself. "Close a gap" reuses it against the AD-AS graph (the total has to reach the gap), and money
  creation is the same flow with banks and a reserve jar, moved to the reserves lab's limited-reserves side
  where the balance sheet already belongs.

### Notes for the merge

- `sw.js` was not touched; bump its cache once at merge (tool scripts and stylesheets changed, no new files).
- Checks run on the finished work: `build-appsych`, `build-apmacro`, `check-appsych-content`, `check-appsych-map`,
  `check-apmacro-content`, `check-apmacro-map` (all with `--check`), `check-site.mjs`, `check-legibility.mjs` on
  the 18 tool pages, and the unit tests `appsych-*`, `apmacro-*`, `service-worker`, `cross-course` (326 pass).
  The whole-site browser checks (`check-console`, `check-a11y`) were not run; the audit harness recorded no
  console error on any of the 18 pages.

## AP Precalculus

Hands-on pass, 2026-11-10, same bar and method as `docs/tool-audit-2026-10.md`: all ten tools in `precalculus/tools/`
driven in headless Chromium at 390x844 and 1280x800 with Premium unlocked locally. Explore: every button, chip,
slider (ends and three points between), sheet and setting pressed, with a check after each for console errors,
sideways scroll, and labels that overlap or leave the picture. Test yourself: 20 seeded problems per tool on a phone
(4 on a desktop), each answered wrong twice, then Show the answer, then again from the start typing the shown answers
back. Values on screen and about 60 quiz problems were recomputed by hand.

Mechanical result: no console errors, no failed requests and no sideways scroll on any page at load. Every shown
answer is accepted when typed back; exact forms (`-sqrt(2)/2`, `pi/4`) are accepted too. One problem type could not
be finished (polynomials and rationals, below). No wrong math found in a value or a graph; one wrong explanation
sentence (polar graphs).

| Tool | Rating | Fixed |
|---|---|---|
| Exponential and log lab | 4 | A negative rate read "+−2" on the graph. "E passes L" sat on top of the step labels on a tall scale. A decaying E had its name off the left edge. |
| Function lab | 4 | Nothing to fix. Ten parent functions, draggable key points, Play the steps. |
| Polar graphs | 4 | The r against θ graph of the circle had no numbers on its r-axis except 0. The worked solution said tan⁻¹(y/x) "points into Quadrant IV" for a point that is in Quadrant IV; it now says the angle is negative and 2π is added. |
| Polynomials and rationals | 4 | **Dead end:** a rational function whose numerator has the higher degree (for example (−3x³ + 5)/(2x² + 1), about 1 problem in 20) threw an error when its asymptote step was answered, and the problem could not be finished. Slant asymptote label sat on the "x = 1" label and the end arrow, and read "1/2x" (now "(1/2)x"). "yours" ran off the right edge. |
| Rate of change | 4 | The number under a negative bar landed on the row of changes ("▼ 9.8 −14.7"). |
| Regression lab | 4 | Phone quiz: the scatter plot was drawn for a slot 150px taller than it gets, so its numbers were 7px. |
| Sinusoid builder | 3.5 | "t = 0" sat on the axis numbers. On a phone the thermometer bulb overlapped the graph. With the midline slid below the window, the amplitude, period and shift labels were drawn over the axis numbers. |
| Symbolic steps | 3 | "yours" ran off the right edge. See rebuild candidates. |
| Unit circle | 4 | Phone: at 3π/2 the point's label and name sat on the readout; at π/2 the label was cut off at the top; "tan θ" and "slope" overlapped; "x = 1" was cut off (both widths); P's name sat on "y" and "π/2" near the top; "sin θ" ran across the circle. Desktop: "(−1, 0)" ran off the left edge. Quiz: the point's label ran off the picture on both sides. |
| Vectors and matrices | 3.5 | Quiz: a path that reaches y = −30 put a number every 10px and a grid line every 5px. See rebuild candidates. |

Left as they are (shared code, or a change of look that needs sign-off):
- After a wrong answer on a phone, the feedback is under the sticky Check button until the student scrolls
  (`pcalc-tools.js` and the studio; the AB tools do the same).
- The first-visit coach bubble covers the picture next to the handle it points at (function lab, unit circle).
- Vectors and matrices: while the matrix animates, the two image labels and the area number crowd the unit square.
- Sinusoid builder at 390px: data points, the three handles and four labels share a 340px graph, so some overlap
  is always there.

### Rebuild candidates

- **Symbolic steps (3).** Weak: it is the only tool with nothing to touch. Explore is two text boxes and a graph of two
  curves that mostly lie on top of each other; Test yourself is typing only. It checks rewrites correctly and its
  domain strip ("equal on part") is a good idea, but it does not teach the steps its name promises. Proposal: make it
  a step builder. The student starts from an equation or expression and picks the next move from a short row of
  rule cards (power rule, combine logs, take ln of both sides, double angle, isolate the trig function). Each move
  rewrites the line, adds it to a visible chain, and shades on a number line where the new line still equals the
  first one, so losing a domain (ln(x²) to 2 ln x) is seen as it happens. Free typing and the current equality check
  stay as the last view.
- **Vectors and matrices (3.5).** Weak: three small tools (motion, vectors, matrices) share one screen and none gets
  room; the matrix view is a grid with small labels; settings are two taps away; and it is all "beyond the exam",
  so it should earn its place by being interesting. Proposal: one object for all three views. A draggable shape (a
  flag or a letter F) on the plane; in Matrices the student drags the two column vectors and the shape transforms
  live with the determinant shown as its area; in Vectors the same handles add and scale; in Motion the shape rides
  the path with its velocity components. Presets (rotate, reflect, shear, squash to a line) as chips on the first
  screen.
- **Sinusoid builder scenes (3.5, partial).** The tool itself is good; the four scene pictures (wheel, tide, spring,
  thermometer) are line drawings below the illustration bar and are 150px tall on a phone. Proposal: keep the
  graph and handles, redraw the four scenes to the standard of the course covers and give the scene and the graph
  one shared vertical scale on a phone too, so the seat's height reads straight across to the curve.

## AP Calculus BC

Same pass, same day, for the six BC-only tools in `calculus-bc/tools/` (the AB tools BC reuses were audited in
October). Nothing shared with AP Calculus AB was edited: `node scripts/build-apcalc.mjs --check` passes unchanged.

Mechanical result: no console errors, no failed requests and no sideways scroll. Every shown answer is accepted when
typed back, including interval answers ("(-8, 2)"). No wrong math found: Euler tables, logistic values, parts
pictures, polar areas and slopes, partial sums and both error bounds were recomputed.

| Tool | Rating | Fixed |
|---|---|---|
| Euler and logistic | 4 | On the rate parabola "L" sat on the axis number and "max" was cut off at the top with a large starting value. |
| Integration methods | 3.5 | With a small upper bound the three area labels were stacked on each other and "area =" covered the y label. Axis numbers such as 0.75 were set to the right of the axis, mixed with 0.5 and 1 on the left. The worked solution wrote "1 ln\|x\|". See rebuild candidates. |
| Parametric motion | 4 | The slope read "−1883.65" one slider step from a vertical tangent (now "near vertical"). Axis numbers on the edge of the plane were cut in half. Phone: the two labels of the speed graph sat on the curve; a quiz step with four long choices shrank the path's numbers to 8px. |
| Polar lab | 4 | **Phone, Between two:** the area formula ran off the edge, so the value could not be read. The panel name sat on the r curves. A quiz step with long choices shrank the figure's numbers to 7px. |
| Series lab | 4 | At the center of a power series the sum label and the partial sum label were printed on top of each other. |
| Taylor lab | 4.5 | The "c" under the center sat on the axis number. |

Left as they are:
- `calc-plot.js` (shared with AB) sets an axis number that does not fit left of the axis to its right, so one axis can
  have numbers on both sides (series lab at x = 3.2: 0.08, 0.06). Worked around inside integration methods only.
- The same phone feedback and coach bubble points as precalculus.
- Polar lab quiz: the line "x = 1" and the tangent's slope label can coincide after the last step.

### Rebuild candidates

- **Integration methods (3.5).** Weak: three scenes of uneven value. Parts has a real idea (the uv rectangle split
  into ∫u dv and ∫v du). Partial fractions is a static graph of the function and its two pieces with one slider that
  reads values. Improper plots area against b with no numbers on the b-axis. None of them lets the student make the
  choice the method is about, and Test yourself is typed. Proposal: build each scene around its decision. Parts:
  the student drags the two factors of the integrand into "u" and "dv" slots; a good choice shows the rectangle
  and a simpler ∫v du, a poor one shows ∫v du getting worse. Partial fractions: sliders for A and B with the sum
  drawn against the target until the curves lock together, then cover-up shown as the shortcut. Improper: drag b
  on a readable scale while the area fills toward its limit, or runs away, side by side for 1/x² and 1/x.
