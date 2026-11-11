# AP Calculus AB: second pass, simple and clear (2026-11-11)

Builder math1 (pass 2), branch `claude/tv2-math1`. Shots in `/home/claude/shots/pass2/calculus/`. Counts as in
`physics.md` (L labels on the picture without axis ticks, N live numbers, C control groups, W words, P panels).
The owner's line held: where the graph is the concept it stays; the work was on repeats and panels on landing.

| Tool | The idea | Best way to show it | Verdict | Before (L/N/C/W/P) | After | What changed | Moved behind a tap or in time |
|---|---|---|---|---|---|---|---|
| Accumulation | g(x) is the signed area so far; g' = f | f with the area filling above g drawing itself; drag x | LEAVE | 5/3/4/34/2 | same | Two graphs on one x axis are one picture (FTC). | |
| Area and volume | A volume is a sum of slices | Region with a draggable slice; Revolve sweeps it | LEAVE | 3/2/3/19/1 | same | First pass already opens flat and sweeps. | |
| Curve analyzer | f' and f'' signs decide every feature of f | Stacked f, f', f'' with one cursor and sign strips | SIMPLIFY | 10/3/3/32/1 | 7/3/3/29/1 | Legend drops f, f', f'' (each panel names its curve); keeps critical point and inflection. | |
| Limit explorer | A limit is where both sides head | Zoom with tracers from both sides, the table gaining rows | LEAVE | 6/2/3/53/2 | same | The table and checklist are the closing-in itself; the checklist already waits ("zoom in") until the zoom decides. | |
| Motion lab | Sign of v, v and a together, area under v | Car above x, v, a with speeding up and slowing down tinted | SIMPLIFY | 12/4/4/41/1 | 9/4/4/38/1 | Legend drops x, v, a (each graph names itself); keeps the shading and turn marks. | |
| Related rates | Rates in one scene move together | The illustrated scene with given and caused rate arrows; drag or Play | SIMPLIFY | 9/8/4/54/3 | 6/2/4/36/1 | Landing is the scene alone. The table under it repeated the two rate pills and the scene's lengths: kept for screen readers, every number in Details. The watched-rate graph appears once the student drags or presses Play. | Table: Details ("Every number"). Graph: on action, and in Details |
| Riemann sums | Strips add to the area; the sum kind decides over or under | Strips with shaded slivers; pick a sum, drag n | SIMPLIFY | 2/2/4/19/1 | same | The first-visit bubble sat on top of the caption on desktop; it now points at n ("Drag n: more strips"). | |
| Rule drills | See the structure of f, then build f' | The rule tree, f' above it | SIMPLIFY | 12/0/3/111/3 | 12/0/3/111/1 | The tree is the one picture: the graphs of f and f' left the stage (they stay in Details, "f and f'"), so a wide stage no longer splits; the tree draws 1.3 times larger when it still fits across. Word count is mostly the example chips' math. | Graph of f and f': Details |
| Slope fields | A solution follows the field everywhere | Field with a draggable start point | LEAVE | 2/1/3/26/1 | same | Already one picture, one action. | |
| Tangent tracer | The tangent is the limit of secants | f with P, Q and the secant above f'; slide h | SIMPLIFY | 6/3/4/83/2 | 6/1/4/78/2 | The f'(a) chip no longer gives the limit before the student acts; h shows only beside its slider; the secant-slope table starts closed at every width. | f'(a): after the first action. Table: one tap |

Counts: 4 LEAVE, 6 SIMPLIFY, 0 CHANGE.

## Graphics quality
Plots share the course look (calc-plot); related rates scenes (ladder, cone, shadow, ripple, balloon) and the motion
lab car are real drawings. Nothing decorative found. Rule drills on a wide stage looked like a small tree in a large
empty card; it is now drawn larger.

## Not simplified, and why
- Curve analyzer and motion lab keep three readout pills (f, f', f'' / x, v, a). One cursor reads three linked
  graphs; the sign of each at the same instant is the lesson (v and a share a sign means speeding up).
- Limit explorer keeps the table beside the graph: the rows appearing at each power of ten are the "closing in".
- Tangent tracer keeps the f' panel under f: the slope point and Trace f' need it; it is one picture on one x axis.
- Accumulation keeps f above g (cause and effect: the area above, its total below).
- Related rates: the caption still states the watched rate as a sentence ("slides down at 0.833 ft/s"); it is the
  meaning of the pill's signed number, so it stays.

## Checks
`build-apcalc.mjs --check` (AB byte-identical), content and map checks, `node --test` for apcalc, `check-site`,
`check-weight`: clean (pass 2 run, 2026-11-11).
