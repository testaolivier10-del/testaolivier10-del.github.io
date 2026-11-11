# AP Calculus AB: cleanup pass 3 (2026-11-11, builder c7)

Judge: `docs/tool-review/pass2/judge-c.md`. Shots: `/home/claude/shots/pass3/calculus/`. `node scripts/build-apcalc.mjs --check` is
byte-identical (only tool JS/CSS changed). No fact, answer or scoring changed, except one display bug fixed (below).

| Tool | Judge said | What I did | Now |
|---|---|---|---|
| Curve analyzer | FAIL: f, f', f'' with two sign strips, three numbers, six chips, clipped labels, strips drawn late | Opens on f and f' with the f' sign chart; a switch on every size (f only / f and f' / Add f'') brings f'' and its chart; two numbers (f, f'; f', f'' once f'' is added) and the caption only names what is on screen; three functions plus More; sign charts drawn whole on open (0.6 s sweep on a new function); the cursor starts clear of every label; an end label in the top left moves the panel name "f" to the right (Quartic "abs max") | PASS |
| Accumulation | PASS | No change | PASS |
| Area and volume | PASS | No change | PASS |
| Limit explorer | TOUCH UP: graph, table, checklist at once; 7 chips; "zoom in" three times; phone checklist about 10 px | Functions in one select; the table, checklist and Fill button appear at the first zoom (graph alone before); checklist "zoom in" became "…" (the caption says it); phone checklist 13 px | PASS |
| Motion lab | TOUCH UP: car plus x, v, a and three numbers | Opens on the car with x and v; switch (x only / x and v / Add a) on every size; two numbers for the graphs shown; phone graphs about twice as tall | PASS |
| Related rates | PASS (coach covers a label: shared hint) | No change | PASS |
| Riemann sums | PASS | No change | PASS |
| Rule drills | TOUCH UP: nine example chips; phone tree boxes tiny | Three examples plus More; phone tree boxes at least 100 px and share the width. Also fixed: the colored headline for (3x - 1)^5 dropped its parentheses ("3x - 1^5"); a sum raised to a power now keeps them | PASS |
| Slope fields | PASS | No change | PASS |
| Tangent tracer | TOUCH UP: f' panel opens empty with two unexplained dots | The f' graph joins when Tangent or Trace f' is pressed (or a traced stretch exists, or "show all" is on); f has the whole stage until then. Coach covering "Secant slopes": shared hint | PASS |
