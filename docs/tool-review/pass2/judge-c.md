# Fresh-eyes judge c: Physics 1, Calculus AB, Calculus BC, Precalculus, Statistics (2026-11-11)

Opened every tool cold on branch claude/tool-fixes at 1280x800 and 390x844 (own server, port 8863; shots in
/home/claude/scratch/judge-c/). Counts are for the opening screen: P = main pictures or panels, L = text labels on
the picture (axis ticks not counted), N = live numbers, C = controls showing (Explore/Test tabs, header and
fullscreen not counted), W = rough words outside buttons. Standard: P 1, L 5 to 7, N 2, C about 4, W about 40.
A clean graph with one clear action passes even when it is a plain graph.

## Patterns seen in many tools (fix once, everywhere)
- The "Drag / Press" coach bubble sits on top of things a student needs: it hides the explanation text in
  Precalculus regression lab, the "Which test" label in chi-square, "Change the probability" in probability trees,
  "Secant slopes as h" in tangent tracer, "Angle" in Polar lab, the first rate bar in rate of change, and on the
  phone it covers the picture itself in function lab, unit circle and related rates. Place it beside the target,
  never over text or the hero.
- The pulsing halo on the first slider covers the label of the next control (scaling drills "Mass of the bob",
  exp-log "Rate m", curve analyzer). Shrink the halo or add space.
- The same number is printed two or three times on one screen (torque: net torque 3 times; scaling drills: T x 1
  3 times; energy bars: h twice; accumulation: -1.10 twice; Taylor: error and bound in chip and text). Keep it in
  one place.
- Long rows of example chips (6 to 14) are the main reason control counts are 10 to 17. Put examples in one
  select or behind the existing "..." row, keep 3 or 4 visible.

## AP Physics 1
| Tool | Verdict | P / L / N / C / W | Problem and fix |
|---|---|---|---|
| Oscillator lab | FAIL | 4 / 15+ / 3 / 11 / 25 | Desktop opens on a dashboard: spring, energy bars and three stacked x, v, a graphs before anything moves. Open on spring plus x-t only (as the phone already does with x-t / v-t / a-t chips); show v-t, a-t and energy bars on tap. T appears twice (chip and text). |
| Collision lab | TOUCH UP | 3 / 12 / 2 / 6 / 25 | Momentum and KE bar charts both show before Crash, and a third panel (Force on B) joins after: 4 panels. Show p bars first, KE and force panel after the crash. Bumper slider shows a bare "1.00" with no meaning; A's velocity arrow becomes a stray orange dash when v is small. |
| Energy bar charts | PASS | 1 / 8 / 2 / 5 / 15 | Scene and bars read as one picture; Play is obvious. Nit: h = 4.00 m printed twice (top and on ramp). |
| Fluids tank | TOUCH UP | 2 / 6 / 2 / 9 / 20 | Two selects, four object chips and two action buttons (9 controls). Force diagram sits in an empty box far right of the tank, so the eye crosses the screen. Objects into one select; draw the force arrows on the block or right beside the tank. Phone: "cm" scale label hidden under the coach. |
| Free-body diagrams | PASS | 1 / 6 / 1 / 5 / 20 | Clear book, table, arrows, tip-to-tail inset. Phone has empty space above the scene; fine. |
| Lab design | TOUCH UP | 2 / 5 / 2 / 9 / 30 | Graph select and Best-fit line show before any reading exists. Reveal them after 3 readings. Phone: "x = ..." readout is tiny. |
| Motion graphs | TOUCH UP | 4 / 10 / 2 / 5 / 45 | The instruction is said four times ("Grab the cart", "Drag the cart along the track", "Drag the cart" on the track, "your own run draws here"). Keep one. The faint example run with 6 annotations competes with the student's run; show it on tap. |
| Projectile lab | TOUCH UP | 1 / 6 / 3 / 6 / 10 | Three readouts (t, vx, vy), vx has no unit. A dashed box at the origin reads as a stray shape. Keep t and one speed, add units. |
| Rotation lab | TOUCH UP | 1 / 8 / 4 / 10 / 15 | Three gray energy bars and their legend show at 0.00 m/s before Race. Reveal at Race. Object toggles (4) can go behind Settings. |
| Scaling drills | TOUCH UP | 2 / 9 / 3 / 7 / 25 | "T x 1" printed three times; slider halo covers "Mass of the bob". Phone: big blank band between pendulums and controls. |
| Torque balance | PASS | 1 / 7 / 2 / 6 / 15 | Real meter stick and masses, one clear drag. Nit: net torque shown three times (chip, text, bars). |

## AP Calculus AB
| Tool | Verdict | P / L / N / C / W | Problem and fix |
|---|---|---|---|
| Curve analyzer | FAIL | 3 graphs + 2 sign rows / 8 / 3 / 9 / 30 | f, f', f'' stacked with two sign strips, three live numbers and six function chips. Sign strips draw in late (at 1 s they stop at x = 1.6 on Cubic and 2.7 on Quartic, which looks wrong). "rel max" label is cut by its own marker ("el max"); Quartic "abs max" collides with the f label. Open on f with f' only; f'' and its strip on tap; 3 function chips plus "More". |
| Accumulation | PASS | 2 (linked) / 7 / 2 / 5 / 15 | f above, g below is the idea and reads as one. Nit: slope -1.10 shown in chip and on graph, label sits on the dashed tangent. |
| Area and volume | PASS | 1 / 3 / 2 / 5 / 10 | Clean region and slice. |
| Limit explorer | TOUCH UP | 3 (graph, table, checklist) / 12 / 4 / 11 / 35 | Graph, two-sided table and continuity checklist all open at once with 7 function chips. "Zoom in" is said three times. Show the table after the first zoom; functions into a select. Phone: checklist row text is about 10 px. |
| Motion lab | TOUCH UP | 4 / 8 / 4 / 7 / 35 | Car plus x, v, a graphs and three live numbers. Phone has x / v / a chips; desktop should open on x and v with a on tap. Phone graphs are about 60 px tall each. Shading (speeding up / slowing down) is correct. |
| Related rates | PASS | 1 / 4 / 2 / 9 / 30 | Ladder, wall, x and y read at a glance. Coach ring covers "x = 5.0 ft" until first drag. |
| Riemann sums | PASS | 1 / 3 / 2 / 7 / 20 | Model of the standard. |
| Rule drills | TOUCH UP | 1 / 6 boxes / 0 / 11 / 15 | Rule tree is the right picture. Nine example chips; keep 3. Phone: tree boxes shrink to tiny text ("Power rule" box is 60 px wide). |
| Slope fields | PASS | 1 / 3 / 1 / 9 / 20 | Clear field and drag point. |
| Tangent tracer | TOUCH UP | 2 / 6 / 1 / 6 / 35 | The f' panel opens empty with two unexplained dots; show it when "Trace f'" is pressed. Coach covers "Secant slopes as h". |

## AP Calculus BC
| Tool | Verdict | P / L / N / C / W | Problem and fix |
|---|---|---|---|
| Euler and logistic | PASS | 1 / 4 / 3 / 12 / 20 | Clear graph, one drag. Ten small buttons (5 equations, 5 step counts) is heavy but calm; steps could be a stepper. |
| Integration methods | TOUCH UP | 2 / 8 / 4 / 8 / 15 | The u, dv, du, v row above the graphs looks like dead buttons. Four numbers on the uv picture. Move the u/dv row into the explanation. |
| Parametric motion | TOUCH UP | 2 / 7 / 5 / 10 / 35 | Five numbers (speed, dy/dx, t, point, distance). Desktop chip reads "Accelerati..." (truncated). Keep speed and t; rest in Details. |
| Polar lab | TOUCH UP | 2 / 10 / 4 / 10 / 30 | Area formula box sits on the polar picture; four numbers; 4-item legend. Show the area box after Play; coach covers "Angle". |
| Series lab | TOUCH UP | 1 / 4 / 2 / 14 / 25 | Nine series chips. Phone: the explanation text is cut off mid-line ("0.0800 away" clipped behind the next control). |
| Taylor lab | TOUCH UP | 1 / 5 / 2 / 13 / 20 | Error band fills most of the graph on open; Band toggle and Center slider show at once. Default band lighter or off until asked; Center behind More. |

## AP Precalculus
| Tool | Verdict | P / L / N / C / W | Problem and fix |
|---|---|---|---|
| Function lab | FAIL | 1 / 8 / 1 / 17 / 35 | Ten parent-function chips, a/b/h/k tabs, slider, two buttons. Picture has three colored dotted mapping lines plus five marker types and a 4-item legend. Phone: coach covers the graph. Parents into a select; one mapping line at a time. |
| Regression lab | FAIL | 2 / 5 / 1 / 16 / 40 | Seven data chips and seven model chips. The coach bubble sits on the explanation text on desktop, so the "why" is unreadable. Data into a select; models 3 visible plus More; move the coach. |
| Exp and log lab | TOUCH UP | 2 (graph + table) / 6 / 14 in table / 6 / 15 | Table belongs, but 7 columns with +3 / x1.5 under each is busy; highlight one column, rest dim. Phone table text about 9 px. Slider halo covers "Rate m". |
| Polar graphs | TOUCH UP | 2 (linked) / 12 / 2 / 9 / 20 | Good pairing. The curve has a doubled pink and green outline that reads as a rendering glitch; draw one stroke colored by segment. |
| Polynomials and rationals | TOUCH UP | 1 / 8 / 2 / 9 / 25 | No visible first action (no coach, three rows of similar controls: factor chips, Zero/Asymptote/Hole, multiplicity). Say "Tap a factor" and show the role row only after a tap. |
| Rate of change | TOUCH UP | 2 (linked) / 10 / 6 / 13 / 40 | Six context chips; coach covers the first rate bar (+14.7) on both sizes. Contexts into a select. |
| Sinusoid builder | TOUCH UP | 2 (linked) / 8 / 4 / 9 / 35 | Wheel plus graph is the right idea. Phone: "a =" and "y = 20" sit on the curve and period labels are tiny; desktop "a = 10" is half hidden by the curve. |
| Symbolic steps | PASS | 1 / 3 / 0 / 8 / 25 | Clear. Nit: legend has 5 items. |
| Unit circle | TOUCH UP | 2 (linked) / 10 / 3 / 5 / 25 | Desktop is good. Phone: circle is about 140 px and the coach covers it. Give the circle more height on the phone. |
| Vectors and matrices | TOUCH UP | 3 / 6 / 2 / 10 / 20 | Path plus x(t) and y(t) panels on open. Show x(t), y(t) on tap. Phone: the two small panels are cramped. |

## AP Statistics
| Tool | Verdict | P / L / N / C / W | Problem and fix |
|---|---|---|---|
| Chi-square lab | TOUCH UP | 2 / 20+ / 2 / 9 / 35 | Table with O and E in every cell is fine, but the colored strip along the x axis of the curve reads as random blocks; label it or drop it. Coach covers "Which test". |
| Interval capture | PASS | 1 / 3 / 1 / 7 / 45 | Clear. Explanation is long; trim to two sentences. |
| Data explorer | TOUCH UP | 3 (shared axis) / 8 / 2 / 5 / 20 | Stack is coherent, but the draggable orange dot is not marked as draggable (no ring, no coach). Histogram count "5" sits on the mean line. |
| Design randomizer | TOUCH UP | 2 / 8 / 1 / 8 / 30 | Opens with a small greenhouse and a large empty dot plot; "Estimates land here" overlaps the dashed line. Pot numbers and after-run plant values are unreadable (about 6 px) at 1280. Make the greenhouse the hero and grow the plot after the first run. |
| Distribution areas | PASS | 1 / 4 / 2 / 6 / 30 | Clear curve and boundary. |
| p-value explorer | PASS | 1 / 5 / 2 / 7 / 30 | Clear. |
| Probability trees | TOUCH UP | 1 / 14 / 1 / 12 / 45 | Tree is a strong picture. Six probability chips in a grid plus two simulate buttons; coach covers a label. Explanation 40+ words. |
| Regression lab | PASS | 2 (linked) / 4 / 2 / 6 / 20 | Scatter and residual plot read together. |
| Sampling distributions | TOUCH UP | 3 (the idea) / 6 / 3 / 12 / 30 | Three levels are the concept. Seven population chips; keep 3 plus More. |
| Sampling lab | TOUCH UP | 2 / 15 street names / 1 / 9 / 30 | Phone: neighborhood is about 220 px wide, "Hillside" and "Riverside" collide with street names, and after "Draw a sample" the page scrolls so the sampled houses are off screen; cause and effect not visible together. |

## Totals
Physics 1: PASS 3, TOUCH UP 7, FAIL 1. Calculus AB: PASS 5, TOUCH UP 4, FAIL 1. Calculus BC: PASS 1, TOUCH UP 5.
Precalculus: PASS 1, TOUCH UP 7, FAIL 2. Statistics: PASS 4, TOUCH UP 6.
Worst five: Oscillator lab, Curve analyzer, Function lab, Precalculus regression lab, Design randomizer.
No page errors in any tool. Nothing looked scientifically wrong.
