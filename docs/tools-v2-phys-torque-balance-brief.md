# Tools v2: AP® Physics 1 Torque balance (brief and build notes)

Status file for the v2 rebuild of `physics/tools/torque-balance.html` (Premium; rollout row 75, group P, wave 17).
The first AP® Physics 1 tool on the kit, so it adds the physics adapter. Standard: `docs/tools-v2-standard.md`; plan:
`docs/tools-v2-plans/phys-torque-balance.md`. Branch `claude/tools-v2-phys-torque-balance`, cut from
`claude/tools-v2-all`. NOT merged: an independent review comes first. Decisions made for the owner are also one line
each in `docs/tools-v2-owner-log.md`.

## The physics adapter (`ApPhysTools.studioKit2`)
- `physics/assets/tools/phys-tools.js`: `modes(app, { ..., studio: { kit2(pane, s) -> { stage, ref, about } } })`
  hands the stage, the "?" reference and the About text to the frame on the chemistry adapter's pattern
  (`ApChemTools.studioKit2`: the tool builds its own stage with the kit). Test yourself stays on the shared drill
  (`ApPhysTools.drill`, arranged by `studioDrill`), as `ApCalcTools.studioKit2` does, so its grading, records
  (`torque-balance:<context>:<step>`), `?seed=` and `#quiz` are untouched. With kit2 every visit lands on Explore
  (no "last mode" memory; a link still opens Test yourself). Without `kit2` nothing changes for the other ten tools.
- `scripts/build-apphys.mjs`: a tool with `"kit2": true` in `physics/data/pages.json` loads `tool-kit2.css` and
  `tool-kit2.js` after `tool-studio.*` (as `build-apchem.mjs`). Only `torque-balance` has it; the other ten generated
  pages are byte-identical (`build-apphys.mjs --check`).
- The tool still fetches the kit itself when a cached old page lacks it (as Units and significant figures does).

## Research (rule 10): what exists and what we took
Seen means the page itself was opened and read; text only means only a description or a guide could be read.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| PhET Balancing Act (page seen; its teacher guide PDF read, the HTML5 sim itself not run here) | Drag bricks onto a plank; supports hold it; remove them and it tips at once; distance marks; a level indicator; Game screen | Supports you remove, the instant tip, marks to read distance | Students pile many objects on (an Intro screen was added for that); no torque shown, only forces; the plank's pivot sits above its centre so balanced means level | The supports (here they rise while you move something and drop when you let go, so there is no Remove supports step); the instant tip; the marks; few masses (a tray of three, at most four on the stick) |
| The Physics Classroom, Balance Beam interactive (teacher notes read) | Drag masses onto a beam to balance unequal masses | Minimal directions, find the rule yourself | Text says nothing of torque numbers | Explore without instructions; the takeaway names the rule once it has been seen |
| The Physics Classroom, Torque Balancer (teacher notes read) | Place weights to balance problems; stars | Mass and distance together | A quiz | The quiz kind stays in Test yourself ("Where to hang a mass") |
| The Physics Classroom, Getting a Handle on Torque (notes read) | Which way does the stick turn, from force and distance | Direction as clockwise / counterclockwise | Text says nothing of the angle | ↺ / ↻ only, no right hand rule (the CED boundary) |

What ours does better: the torque is drawn, not only the forces: two curl arrows around the fulcrum, one per sense,
made of one piece per mass and sized by its torque, change at once while you drag; the distance from the fulcrum is
measured on the stick for the mass you move; the cause line says it in numbers; and letting go shows the result
with α = τ / I from the real model. The angle and the inertia ideas each get their own picture.

## Three ideas, three tabs (rule 11)
1. **Balance** (opens here). Purpose: "See how mass and distance make a torque." A wooden meter stick (numbers every
   10 cm) on a knife edge on a lab stand, on a bench; a 200 g mass at the 30 cm mark and a 100 g mass at the 80 cm
   mark, so the landing picture already rests on its left support. Main control: drag a mass (its knob or the mass
   itself) along the stick, 1 cm steps, never within 4 cm of another hook. While you move it the two supports come up
   and hold the stick level (animated, 0.3 s) and the curl arrows and numbers change at once. Let go: once the
   supports are all the way up they drop, and the stick turns with α = τ<sub>net</sub>/I (the model's integrator,
   lever arms shrinking as cos θ) until it rests on a support, or stays level when the torques are equal. Quiet
   controls: the fulcrum (a small knob on the stand's base, 25 to 75 cm), "Hold level" (keeps the supports up), the
   tray at the bench's end (tap 100, 200 or 500 g: it flies up to a free spot and hangs; drag a mass below the bench
   or press Delete and it flies back). Neighbours that would touch hang one below the other (strings of different
   length; the torque is the same, said in "?"); the stage keeps room for one row and is redrawn, with a cross
   fade, when masses hang in more. Off centre, the stick's own weight is a down arrow at its centre named "stick's
   weight". The thin dimension line on the stick measures the moved mass's
   distance from the fulcrum. Cause line: "100 g, 30 cm from fulcrum → ↺ 0.39 vs ↻ 0.29 N·m → left end down" ("fulcrum at 40 cm" first after the fulcrum moved) (held level,
   lifting level, turning ↺ / ↻, left end down, right end down, balanced). Takeaway after a balanced let go:
   "Twice the distance, half the mass: the same torque." (or the general sentence).
2. **Angle**. Purpose: "See why a slanted pull turns the stick less." The same stick, a 200 g mass at the 30 cm mark
   (↺ 0.39 N·m), and a spring scale hooked at the 10 cm mark pulled by a hand. Main control: drag the hand (the
   scale's top): its direction (15° to 165° from the stick, 5° steps) and its size (0.2 to 3.0 N, the spring
   stretches). The pull is one whole arrow from its point of application (no components, the guide's rule); its
   line of action is a thin grey line, and the lever arm a solid green line from the fulcrum, square to that line,
   labelled "lever arm 0.35 m"; it shortens as the pull slants. The scale's face reads the force; the angle between
   stick and pull is marked at the hook. Cause line: "1.5 N at 60° → lever arm 0.35 m → ↺ 0.39 vs ↻ 0.52 N·m → right
   end down". Takeaway after a balanced slanted let go: "A slanted pull has a shorter lever arm, so it needs more
   force." Extremes are real: at 15° even 3 N cannot balance it.
3. **Inertia**. Purpose: "See why mass farther out spins up slower." Two rotational inertia stands on a lab bench
   (a cross arm turning in a horizontal plane, seen from a little above, with two brass sliders; a string from the
   step pulley over a pulley at the bench's edge to a 200 g weight). Main control: drag B's slider along the arm
   (4 to 20 cm; the other slider moves with it); A's is quiet. Let go: both weights drop 0.80 m together, the arms
   spin, and each landing time appears over its weight when it is down. Grabbing a slider again winds the weights
   back up (animated). Cause line: "A 6 cm, B 18 cm out → I of B 5.4× → A lands 1.67 s sooner"; takeaway: "Same mass,
   farther out: more rotational inertia, so it spins up more slowly."

One colour per idea, everywhere (picture, numbers, cause line): counterclockwise blue, clockwise vermillion, the
lever arm green, the pull grey (the physics FBD colour for an applied force), rotational inertia purple, a balanced
result green. Physics series colours (`--phys-s1`, `--phys-s2`, `--phys-s3`), dark variants for dark mode.

## What is on screen in Explore (1440, landing of each tab)
Outside the picture: 3 tabs, the purpose line (8 or 9 words), "Show me how", the cause line (Balance 3 pills, Angle 4,
Inertia 3), "Start over". No side panel.
On the picture, Balance: the stick and its 9 numbers, 2 masses (1 word each), 2 knobs, 2 curl arrows with their 2
numbers, the dimension line and "30 cm", the stand, 2 supports, "Hold level", the tray (3 weights),
the fulcrum's quiet knob with its tag "fulcrum", the cue on a first visit. Angle: the stick, 1 mass, the scale with its reading, the hand
and its knob, the arrow, the angle, the line of action, the lever arm and its name, no curl arrows (both torques are in the
cause line; the lever arm starts at the fulcrum), "fulcrum", "Hold level". Inertia: 2 stands with "A" and "B", 2 weights ("200 g"), 2 knobs
with their tags ("6 cm", "18 cm"), and the landing times after a race.

## Explore against Test yourself (what moved; nothing dropped)
| Old tool | Where it is now |
|---|---|
| Drag a mass along the stick; arrow keys, Delete | Balance, the main control (same keys; Page Up / Down 10 cm) |
| + 100 g, + 200 g, + 500 g | Balance, the tray at the bench's end (tap); at most 4 masses on the stick |
| Remove every mass | "Start over" (puts the two starting masses back) and dragging a mass off |
| Hold level, Release | Automatic: the supports hold while you move something and drop when you let go; "Hold level" keeps them up |
| Fulcrum position (slider in Settings) | Balance and Angle: the quiet knob on the stand's base |
| Count the stick's own mass | "?" setting, as before (on by default) |
| The torque bars (↺, ↻, net) | The two curl arrows and their numbers; net and every torque in the "?" table |
| "Why?" text, the numbers table, I, α, support force | "?" (How it works, the torques table with I, α at let go and the support force) |
| Add a pull at an angle (F, where, angle sliders) | Angle tab: drag the hand (size and direction); where it acts is fixed at the 10 cm mark |
| Inertia race (wheel A and B sliders, Race, Reset) | Inertia tab: drag the sliders; the race starts when you let go; Start over |
| Energy columns K and K_rot per wheel | "?" (K and K_rot at the floor in the stands' table, and the energy sentence) |
| Live time pill, A/B times | The landing time over each weight; the gap in the cause line |
| Test yourself: five drills, ids, `?seed=`, `#quiz` | Unchanged |
| Last mode remembered | Not kept: every visit lands on Explore (the v2 rule); links still open Test yourself |

## Accuracy
- τ = r F sin θ about the fulcrum, counterclockwise positive, only ↺ / ↻ (the guide's exclusion: no right hand
  rule). The model (`physics/assets/tools/math/torque-balance.js`) is unchanged; the screen numbers come from
  `torques()` with the stick level (stated in "?": tilted, every weight's lever arm shrinks by the same cos θ, so the
  winning side never changes; the pull keeps its angle to the stick, as in the model).
- The let go: `tip()` (velocity Verlet on I θ'' = τ(θ)) with the support's height as the stop (10°). A stick is let
  go only once it is level, so a balanced stick always stays level (with the pivot on the stick's line a balanced
  stick is in neutral equilibrium: it would also stay at any tilt; the tool never leaves it askew).
- The inertia race: a = m g / (m + I / r²), I = I<sub>hub</sub> + 2 m d² (sliders as point masses), hand check:
  d = 6 cm, I = 0.0033 kg·m², a = 0.866 m/s², t = 1.36 s; d = 18 cm, I = 0.0177 kg·m², a = 0.174 m/s², t = 3.03 s
  (g = 9.8 m/s², from the model's `race.at`). The arm turns by θ = y / r (the string unwinds off the pulley).
- New wording checked: "?" lines on the level torques, string length, the supports, the CED's directions, g.
- Open points for a physics teacher: `docs/apphys-needs-author.md`, "torque-balance-v2".

## Checks run (2026-11-23, first build)
- Kept sweep `scripts/tools-v2/phys-torque-balance-sweep.mjs`, one width per process: 360, 390, 430, 600, 768, 820,
  1024, 1280, 1440, 1920, light and dark: 20 runs, 480 states, about 4,030 checks, 0 failures (first visit cue per
  tab; Balance landing, balanced, both ends down, four masses, crowded hooks hanging at three heights, fulcrum at 25
  and 75, held; Angle at 7 pulls from 15° to 165° and 0.2 to 3 N; Inertia ready, racing, done, rewinding; Test
  yourself). Asserts no clipping, 4 px between labels and numbers, no knob over a label, no text under 11 px, the
  stick (and the stands' arms) largest, the curl numbers, arrows and cause line equal to the torques recomputed from
  the drawn hooks, the result word matching the drawn tilt, the reading, angle and lever arm matching the drawn pull
  (the drawn lever arm's length too), phone cause line at most two rows with one height per tab, no sideways scroll,
  no console errors.
- Frames (`--frames`) at 1440 light, 390 light and 1024 dark: about 1,400 sampled frames each, 0 failures: let go to
  balance and to tip, a fast drag, a reversal mid turn, keyboard jumps, a mass flying in from the tray and back by
  Delete, a fulcrum drag, the Angle drag and let go, the race and a rewind mid race; on every frame the masses hang
  from the drawn stick, the curl numbers, arrows and cause line are those of the drawn masses, result words only once
  the picture shows them, landing times only over weights that are down; leaving for Test yourself mid race and mid
  turn stops everything and Explore comes back clean; reduced motion shows the end state at once.
- Perf (`--perf`), CPU x4, a full drag, same run as the flagship (Water pollution's sacks): 390 median 16.7 ms, p95
  16.8 ms (flagship 33.3 / 66.6); 1440 median 16.7, p95 16.8 (flagship 33.3 / 50.0).
- `node --test scripts/test/apphys-*.test.mjs` 159 pass; `check-apphys-content --check` 0 failing; `build-apphys
  --check` (only `torque-balance.html` differs from the collecting branch: the two kit lines); `check-site`;
  `check-weight --check` (626 budgets in range, none raised); `build-apcalc --check`, `build-apmacro --check`;
  `scripts/check-tool-use.mjs` run with a local copy of its list: torque balance reports frame v2 (one tool-open,
  tool-touch, tool-mode, tool-use; nothing under automation).
- Test yourself by `?seed=` at 390 and 1440: opens on the drill, a wrong answer opens "Show the answer", the next
  step follows; no console errors. The real locked state (premium.js not unlocked) shows the Premium card as before.
- Free body diagrams, Rotation lab, Collision lab and Motion graphs still load in the old frame, without the kit, with
  no console errors.
- Preview: `/mnt/user-data/outputs/phys-torque-balance-v2/index.html`; shots (landings, extremes, mid animation:
  lifting, turning, a mass flying, mid race) in `shots/`.

## Not happy with (for the reviewer)
- On a phone the Balance stage is tall: room is kept for masses hanging three deep (hooks 4 cm apart touch there), so
  the stand looks tall under the stick.
- The lever arm's name for a very short arm (a 15° pull) can sit a little away from its line, where it finds room.
- A far outward lean of the pull stops early on a narrow stage (the scale must stay in the picture); the physics is
  the same as leaning toward the fulcrum.
- The landing picture already rests on its left support (no motion until you touch it); a stick that starts level
  would hide the imbalance the cue invites you to fix.
- The wall behind is calm and plain; the flagship's scene is richer. Nothing was added that could be misread.

## Review round 1 (2026-11-24, `/home/claude/review-phys-torque/REVIEW.md`, BLOCK): what changed
- M1 the sweep sets `nremt_theme` (the page's key), so dark really runs; every dark run below is real dark mode.
- M2 Balance fits the screen: room for one hanging row (more only while masses hang one below another, redrawn with
  a cross fade); a desktop stage never grows (the stick shrinks); the stand is shorter with it. The sweep runs each
  width at a real screen height (1024 × 768, 1280 × 800, 1440 × 900, 1920 × 1080, phones 740 to 932) and asserts the
  cause line is on screen at 1000 px and wider.
- M3 the first pill: "100 g, 30 cm from fulcrum", "100 g on the fulcrum", "fulcrum at 40 cm" after a fulcrum move.
- M4 "stick's weight": a down arrow from the ⊕ with its name, placed clear of masses, the tilted stick, the curl
  arrows and the distance (a longer arrow when needed); the sweep asserts it whenever the fulcrum is off centre.
- M5 the lever arm's name sits beside its line (the sweep asserts within 24 px; 36 px when the arm lies along the
  tilted stick), clear of the line of action, the stick, the mass, the hand and the reading; the hand stays past the
  lever arm's foot (the string lengthens on a shallow pull); the Angle tab draws no curl arrows; a phone's pull stays
  25° or more from the stick.
- M6 the angle's number is on its arc's bisector, inside the arc (asserted); a wedge under 30° is too thin for it,
  so there it sits just past the arc's end beside the pull; a shallow pull's reading lifts off the tube.
- M5 detail: the hand (the knob) and the lever arm's foot both lie on the pull's line; the string is shortened, or on
  a shallow pull lengthened, to keep them apart, so the knob never covers the lever arm. On a desktop "Start over"
  sits in the picture's top right corner so the cause line keeps one row and stays on screen at 1024 × 768.
- The pull's reach, printed by the sweep: toward the fulcrum to 15° (25° on a phone); away from it as far as the
  scale stays in the picture: 90° (none) at 360 and 390, 60° at 1024, 40° at 1280, 45° at 1440.
- M7 Inertia: light metal ink for the arms, caps and strings in dark mode; no cupboard; arms take their length from
  the stage (about 0.23 of the bench's width); sliders, hub and caps scale with the arm.
- S2 "fulcrum" is the quiet knob's tag. S3 the outward lean is logged as it is (owner log). S4 the slider knobs sit
  20 px past their sliders along the arm; the cm tags hide while a race runs and after it. S5 dark curl arrows: the
  inactive pieces at 0.62. S6 the owner log rows are in the table (the merge from `claude/tools-v2-all` is in).
