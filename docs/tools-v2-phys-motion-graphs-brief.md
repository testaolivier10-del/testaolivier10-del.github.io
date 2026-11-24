# Tools v2: AP® Physics 1 Motion graphs (brief and build notes)

Status file for the v2 rebuild of `physics/tools/motion-graphs.html` (free; rollout row 91, group P, wave 21, size
restyle). Standard: `docs/tools-v2-standard.md`; plan: `docs/tools-v2-plans/phys-motion-graphs.md`. Branch
`claude/tools-v2-phys-motion-graphs`, cut from `claude/tools-v2-all`. NOT merged: an independent review comes first.
Decisions made for the owner are also one line each in `docs/tools-v2-owner-log.md`.

## Files
- `physics/assets/tools/motion-graphs.js` (rewritten Explore, Match the graph; the drill and its figures unchanged)
  and `.css` (the old Explore rules gone; the Test yourself figure rules kept). Model
  `physics/assets/tools/math/motion-graphs.js` unchanged.
- `physics/data/pages.json`: `"kit2": true` on motion-graphs (the build adds the kit's two files to the page).
- `physics/data/tools/motion-graphs.json`: only the intro and one "How it works" line reworded for the new names
  (Drive it, Match the graph); targets and contexts unchanged.
- `physics/assets/tools/phys-tools.js` (shared, small): the drill gets a `task` step kind (a step the tool grades
  itself: `check(api) -> { blank, ok, note }`, `reveal(api)`) and contexts with `only: true` (offered only when
  their kind is picked, never in "Any kind", so every `?seed=` link opens the same problem as before). No other
  trainer uses either; their pages are byte-identical.
- Sweep: `scripts/tools-v2/phys-motion-graphs-sweep.mjs` (`--frames`, `--perf`).

## Research (rule 10): what exists and what we took
Seen means the page itself was opened and read; text only means only a description could be read.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| PhET The Moving Man (sim pages and a teacher activity read, text only; the sim not run here) | Drag the man; position, velocity and acceleration plot live; or set x, v or a and let it run; playback | The student moves the thing and sees three graphs at once | The man has no velocity or acceleration arrows tied to the graphs' colours; three tabs split the quantities | Drive with the hand and three stacked graphs on one time axis; "Set v and a" as the second way to move it |
| Vernier Graph Matching (experiment page read; Go Direct Motion Detector manual read for its range) | Walk in front of a real motion detector; match a position or velocity graph | The real detector and its sonar pulse; matching as a challenge | A real detector reads 0.15 m to 3.5 m (Go Direct, cart channel), so a 10 m run is not real | The detector drawn at the track's end, pinging while it measures; Match the graph in Test yourself; the range said in "?" and logged |
| Desmos graph matching activities (known, text only) | Match a described motion to a graph | Matching is a quiz | Not a drive | Matching kept as a quiz (Test yourself) |

What ours does better: the slope relations are drawn, not only named. At the time cursor the line touching the x
graph is drawn in v's colour (its slope is v), the line touching the v graph in a's colour (its slope is a), and
the area under v from 0 is shaded in x's colour (it is Δx); the cart carries v and a arrows in those colours, and
the cause line reads them off the drawn frame.

## Two ways to move one cart (one idea: three views of one motion; the slope of each is the next)
1. **Drive it** (opens here). Purpose: "Drive the cart and watch its three graphs draw." A dynamics cart on an
   aluminium track with a metre tape (−5 m to +5 m) on a lab bench; a motion detector at the left end. Under it,
   three stacked graphs (position x, velocity v, acceleration a) on one time axis (0 to 10 s). The landing shows an
   example run already drawn (named "Example run", the cursor at 10 s). Main control: drag the cart (its knob or
   the cart itself), or hold the left or right arrow key (Shift is slow). The first touch starts a 10 s recording:
   the example's traces fade, the detector pings, the traces draw live. v and a are measured from the recorded
   positions (least squares slopes over ±0.2 s and ±0.4 s, positions every 0.05 s, said in "?"). After the run the
   takeaway: "Where x-t is steepest, v is biggest; where v-t is flat, a is zero." Drag along the graphs (the kit's
   scrub, knob above the x graph, or its arrow keys) and the cart goes back to that moment; Replay plays the run
   again. Cause line: "at 4.2 s: v +1.2 m/s + a −0.4 m/s² → slowing down" (speeding up, slowing down, steady to the
   left or right, at rest, turning around; "Example, at 10.0 s:" on the example).
2. **Set v and a**. Purpose: "Set v and a and see the motion they make." The same scene. Main control: the tip of
   the cart's velocity arrow (v₀, −3 to 3 m/s) and of its acceleration arrow (a, −2 to 2 m/s²), 0.1 steps. Every
   change redraws the whole exact run and its three graphs at once; letting go runs it in real time (the cursor
   sweeps, the cart rolls, its arrows show v and a at each moment), then after a beat the cart fades back to its
   start. While it runs, the acceleration arrow's tip rides with the cart: changing a then starts a new straight
   piece on v-t from that moment (as the old tool did). Quiet control: drag the cart to choose its start (−3 to
   3 m, 0.5 steps). "turns" names the top or bottom of the x graph where v crosses zero; "end stop" where the cart
   reaches an end. Run replays; Stop stops. Cause line: "v₀ +1.5 m/s + a −0.3 m/s² → slows down → turns at 5.0 s"
   (speeds up, speeds up from rest, steady, stays at rest; "end stop at 4.9 s"; after a change mid run,
   "a +0.9 m/s² from 1.4 s" and the result for that piece).

One colour per idea, everywhere: x blue, v vermillion, a green (the physics series colours `--phys-s1` to `s3`,
dark variants in dark mode): the traces, the arrows, the cursor's dots, the tangents, the area, the panel names
and the cause line's pills.

## What is on screen in Explore (1440, landing)
Outside the picture: 2 tabs, the purpose line (8 words), "Show me how", the cause line (3 pills and a lead, or the
takeaway), Replay (or Run), Start over. No side panel.
On the picture, Drive it: the track with its 11 tape numbers, the detector, the cart and its knob, the position
pointer, the v arrow and "v", "a = 0" (or the a arrow and "a"), 3 graph panels (each named, 3 numbers), the time
axis (11 numbers and "t (s)"), 3 traces, the cursor with 3 dots, 2 tangents with "slope = v" and "slope = a", the
area under v with "area = Δx", "turns", "Example run", the scrub's knob; the cue on a first visit. Set v and a: the
same without the example and the scrub, with the 2 tip knobs and the quiet cart knob.

## Explore against Test yourself (what moved; nothing dropped)
| Old tool | Where it is now |
|---|---|
| Drive modes Drag, Set v and a, Match | Tabs "Drive it" and "Set v and a"; Match is Test yourself "Match the graph (drive the cart)" |
| Drag the cart; hold the arrow keys | Drive it, the main control (same keys; Shift slow) |
| Example run (a toggle) | The landing shows the example already drawn; Replay plays it; it fades when you drive |
| Starting velocity, acceleration sliders | The tips of the cart's v and a arrows (Set v and a) |
| Change a while it runs (a new segment) | Kept: the a tip rides with the cart during the run |
| Start position slider (−4.5 to 4.5 m, in More) | The cart itself in Set v and a (quiet), −3 to 3 m so the longest arrows fit on the picture |
| ▶ Run / ❚❚ Pause, Start over | Run (Stop while it runs), Start over; Drive it has Replay |
| Tap or arrow along the graphs (time cursor) | The kit's scrub on the graphs (Drive it); the Set run sweeps the cursor itself |
| Cursor readout: slopes, areas, Δx, Δv with numbers | Drawn at the cursor (tangents, area); every number in "?" "At the time cursor" |
| Readings table (x, v, a, cursor), pills | The cause line and the "?" table |
| Match: three graphs with the target on one | Match the graph shows the scene and only the target's graph (a phone's stage has room for one) |
| Match: target, New target, score, best, where furthest off, record per run | Test yourself "Match the graph": a target picked per problem (New problem), Check scores it (80% or more is a match), best kept (`apphys_mg_best_<id>`), where furthest off, recorded once per problem as `motion-graphs:match:<target>` (the first Check), Show the answer drives the target |
| Seven drills, ids `motion-graphs:<ctx>:<step>`, `?seed=`, `#quiz` | Unchanged (Match is never dealt by "Any kind") |
| Bumper stop note, measured-data note | "?" |

## Accuracy
- Slope of x-t = v, slope of v-t = a, area under v-t = Δx, area under a-t = Δv: drawn at the cursor and checked
  by the sweep on every state and frame (the tangents' pixel slopes equal the drawn v and a to 0.03; the area equals
  the drawn Δx to the pixel on exact runs, within 0.35 m on a hand drive).
- Right is +. Same signs of v and a: speeding up; opposite: slowing down (the CED's rule); a turn is where v
  crosses zero, the top or bottom of x-t. Set v and a is exact (x = x₀ + v₀t + ½at², v = v₀ + at, the model's
  `motion()`); turn time −v₀/a checked against the drawn x graph's extreme.
- The end stop stops the cart dead (v to 0 at once; the a spike is too narrow to draw), as the old tool did.
- Hand drives are measured, not exact: slightly bumpy and a little late, said in "?".
- Open points for a physics teacher: `docs/apphys-needs-author.md`, "motion-graphs-v2".

## Checks run (2026-11-24, first build)
Filled in below after the integration round.

## Not happy with (for the reviewer)
- At 1024 × 768 the three graphs are about 60 px tall each so the whole tool fits the screen; readable, but small.
- A hand drive's a graph is bumpy (it is measured, honestly); a jerky drag makes it swing past ±3 m/s² and off the
  panel.
- The cart is small next to the long track and the wide graphs (the track and the graphs are wider; the cart is
  the biggest thing on the track).
- The wall above the arrows is plain (room for the a tip's knob).
- A Match problem's link (`?seed=`) opens a problem of any kind, since a link carries no kind (the old Match had no
  link at all).
