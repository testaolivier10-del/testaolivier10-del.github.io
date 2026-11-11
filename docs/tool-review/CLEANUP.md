# Cleanup round (pass 3): brief for builders, 2026-11-11

Three independent judges opened every tool cold after the simplicity pass: `docs/tool-review/pass2/judge-a.md`
(NREMT, A&P, bio, ochem), `judge-b.md` (chem, env, psych, geography, macro, micro), `judge-c.md` (physics,
calculus AB and BC, precalculus, statistics). Read `docs/tool-review/SIMPLIFY.md` first (the owner's words and the
standard), then your courses' rows in the judge file, your courses' `docs/tool-review/pass2/<course>.md`, and
`docs/tool-review/BUILD.md` (commit, check and no-push rules).

## Your job
Fix every FAIL and every TOUCH UP the judge lists for your courses, plus any item for your courses in "The lead's
list" below. For each: apply the judge's fix or a better one, then open the tool cold at 1280x800 and 390x844 and
re-run the judge's five checks from `docs/tool-review/JUDGE.md` yourself. A tool is done when it would PASS.

Both directions count. Too much (panels, labels, numbers, controls, words) fails. Too little fails too: an opening
screen that is an empty chart, or a picture whose parts have no names until tapped so a student cannot tell what
they are looking at. Aim for the calm middle: the picture is the idea, the few names a student needs are on it,
one action is obvious, everything else is one tap away. Numbers shown in two places must agree.

## Not yours (another builder is fixing these for every course; ignore those findings)
The first-run hint bubble covering things, the pulsing halo clipping a neighbor's label, and long rows of chips in
the dock (a shared "More" overflow is coming). Do NOT edit `assets/course/*`, or your course's shared tools shell
(`<course>/assets/tools/*-tools.js` and `*-tools.css` or the equivalent shared file every tool in the course
loads). If a fix truly needs the shared shell, write it in your done file for the lead instead of making it.

## The lead's list
- bio: energy flow bottom number hidden; signal transduction rows have no names until tapped and the "Glucose out"
  pill disagrees with the number in the picture; design drills about 164 words on the opening screen; population
  growth keeps the logistic graph after switching to Exponential.
- macro: indicators lab opens on empty columns (open with the first transaction placed); multiplier lab drills
  still use the old bars; reserves lab shows three graphs and a six link list after one press.
- psych: memory lab opens on a blank chart.
- A&P: feedback loops still about 14 labels (get to about 7); pathway tracer draws wide figures small; Predict's
  run narration overlaps "Show the chain"; leftover leader lines to hidden labels on the body figure.
- chem: ICE table and jar are small in a mostly empty stage. env: climate change puts ozone loss and the greenhouse
  effect on one picture with two sliders (two scenes).
- ochem: reagent roadmap opens on about 20 tiles with 52 labels, tiny on a phone, Reagent tab a wall of text;
  reaction predictor about 30 controls.
- NREMT: flowcharts opens on a whole 110 word chart and Build it shows 19 empty slots; sound trainer's "R" label
  overlaps the Front/Back toggle.
- geography: borders lab 13 controls and the hinted Play is below the fold on desktop.
- physics: oscillator lab opens with the spring, energy bars and three stacked graphs. calculus AB: curve analyzer
  three graphs, two sign strips, three numbers, six chips, clipped labels. precalculus: function lab 17 controls;
  regression lab 16 chips; sinusoid builder dense. statistics: chi-square lab and sampling lab dense; design
  randomizer's greenhouse small beside an empty plot with unreadable pot labels.

## Output
Before and after opening screens for every tool you touch in `/home/claude/shots/pass3/<course>/<tool>_before_d.png`,
`_after_d.png`, `_after_p.png`. `docs/tool-review/pass3/<course>.md`: one row per judged item (what the judge said,
what you did, PASS now or why not). Accuracy: change no fact, answer or scoring; A&P and ochem science gets a check.
Run the course build --check, checks, tests, check-site and check-weight until clean. Final reply under 12 lines.
