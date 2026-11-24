# Tools v2: AP® Chemistry Q vs K (brief and build notes)

Status file for the v2 rebuild of `chem/tools/q-vs-k.html` (Premium; rollout row 107, group P, wave 12). Plan:
`docs/tools-v2-plans/chem-q-vs-k.md`. Standard: `docs/tools-v2-standard.md`. Branch `claude/tools-v2-chem-q-vs-k`, cut
from `claude/tools-v2-all`. NOT merged: an independent review comes first; decisions made for the owner are also one
line each in `docs/tools-v2-owner-log.md`. Patterns reused from ICE tables and Buffers (canvas of particles over a still
SVG scene, height driven layout, counts from what is drawn, the `placed` drill part); the three stay separate tools.

## The one idea (rule 11)
**Compare Q with K to see which way a reaction runs: Q < K forward, Q > K back, Q = K no net change.** One screen, one
main control (the tray). It is not ICE tables (how far) or Equilibrium and kinetics (rates, temperature).

## Research (rule 10): what exists and what we took
Seen means the page itself was opened and read; text only means only a description could be read.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| PhET Reversible Reactions (text only: its page lists temperature, barrier height, concentration against time) | Particles react back and forth over a barrier; graphs of amounts against time | Watching amounts settle | No Q or K on screen; nothing you add by hand | Particles you add by hand, the reaction drawn event by event |
| AACT "Predicting Shifts in Equilibrium: Q vs K" (seen) | 15 questions: calculate Q from given concentrations, then predict the shift | Q first, then the direction | Numbers only, no picture | Already ours: Test yourself (Q, comparison, direction, justification) |
| AACT "Le Chatelier's Principle: Particulate View" and "Equilibrium: Particulate View" (seen; paper activities) | Students draw particle boxes for N₂ + 3H₂ ⇌ 2NH₃ after adding or removing a gas or changing the vessel size, and say Q vs K and the shift | Counting Q from particles; volume changes Q, only temperature changes K | Paper only, no feedback | The same moves (add, remove, squeeze) on a drawn vessel, Q counted from the drawn particles |
| LabXchange "Equilibrium and Le Châtelier's Principle" (seen, text) | A button adds 0.002 M of A at time T; a slider scrubs time; Qr shown | The disturbance and the return | One fixed action; K not shown beside Q | Q beside K on one dial, after any action |
| ChemCollective "Comparing Q to K to determine shift" (seen, its info page only) | A tutorial with hints | Hints | Not a model | Hints stay in Test yourself |

What ours does better: the student does the disturbing (drags three B in, takes AB out, pushes the piston), sees Q jump
on a dial with K as a notch, sees the arrow under the equation turn, and then watches the reaction run that way one
event at a time until Q is back at K. Every number is read off the drawn particles and the drawn piston.

## The design (Explore)
- **Scene:** the course's lab wall and bench. A glass cylinder with a piston stands on a foot (a hot plate glowing for
  CaCO₃, 800 °C). A side port with a stopcock on its right wall; a dial at its left (narrow: top left) on a cable to a
  probe low on the wall: log scale K ÷ 4 to K × 4, K a green notch, the needle Q in vermillion. A plate on the wall
  (narrow: across the top): the equation, an arrow under the ⇌ (blue, pointing the way it runs, thicker the farther Q
  is from K; a thin green two headed arrow at no net change), K, and the scale ("1 particle = 0.050 mol" or "1 CO₂ =
  0.020 atm at 1.00 L"). A tray of three cups on the bench (narrow: under the cylinder), each drawing what one press adds
  and named under it.
- **Main control:** the tray. Drag a cup into the cylinder (or tap it, or Enter on it): three particles of a gas, or one
  lump of a solid, fly to the port and go in one by one. Tap or drag a particle in the cylinder (or Delete on a cup):
  three of its kind leave through the port. A quiet piston knob sets the volume, 0.50 to 1.50 L in steps of 0.25.
- **What happens:** Q jumps (needle, arrow, cause line). A third of a second after the last change, the reaction runs one
  event at a time, the next starting as the last forms: A and B meet and join, AB splits, a CO₂ goes into a CaO lump which
  turns to CaCO₃, a CO₂ comes out of a CaCO₃ lump which turns to CaO (each with a short glow). It stops at the whole counts
  nearest K: when one more event would take Q farther from K than it is.
- **Numbers from the picture:** a particle counts once it is drawn inside the glass (in or out through the port); an
  event's products count from its middle (t = 0.475), its reactants until then; Q uses the volume the piston is drawn at
  (it glides 0.36 s; the tag says the drawn volume).
- **Cause line:** "added 3 B → Q 1.82 → < K 2.5 → runs forward"; settled "Q 2.57 → ≈ K 2.5 → no net change"; when whole
  particles stop it short of 20% "Q 1.33 → < K 2.5 → 1 more AB overshoots", or "no CaCO₃ left", "the cylinder is full";
  a solid: "added CaCO₃ (solid) → Q stays 0.220 → solids are not in Q". Takeaway after it settles: "The reaction always
  runs toward Q = K." (a solid: "A pure solid is left out of Q, so adding or removing it changes nothing.").
- **Two reactions** (quiet tabs "A + B ⇌ AB", "CaCO₃ ⇌ CaO + CO₂"; on a phone "A + B", "CaCO₃"): A + B ⇌ AB, K<sub>c</sub> =
  2.5, 8 of each at 1.00 L (Q = K exactly); CaCO₃(s) ⇌ CaO(s) + CO₂(g), K<sub>p</sub> = 0.22 at 800 °C, 11 CO₂ over 8
  CaCO₃ and 5 CaO lumps. Same cylinder size for both.
- **Cue:** "Drag B into the cylinder", over the tray on a wide screen, under it on a narrow one, once per device. Show me
  how: three callouts (a cup, the dial, the piston knob).
- **"?":** Q and K (the comparison is the justification; Le Chatelier only the prediction), counting Q from this picture
  with a live line of each concentration or pressure, the volume (A + B) or the solids (CaCO₃), why Q lands near K and not
  on it, the dial and the arrow, the constants and sources, then the drill's rules.
- **Reduced motion:** a short cross fade to where it settles.

### What is on screen in Explore (counted at 1440, opening state)
Outside the picture: 2 tabs, the purpose line (9 words: "See which way a reaction runs: compare Q with K."), "Show me
how", the cause line ("Start:" and 3 pills), "Start over" once something changed. On the picture: the cylinder (24
particles), the piston and its knob with the volume tag, the port, the dial ("K", "Q", "low", "high"; no "low" and "high"
on a phone), the plate (equation, arrow, K line, scale line), the tray (3 cups, 3 names). No side panel.

## Explore against Test yourself
- Explore: free play, nothing graded, no goal.
- Test yourself: the drill, unchanged in content, grading and records (`T.drill`): Q, the comparison, the direction and
  the justification, over all seven contexts (HI, NH₃, SO₃, CaCO₃, AgCl and the two particle boxes); "Show the mixture as"
  numbers or particle pictures; the Q against K bar with "yours"; ids `q-vs-k:<context>:<step>`; `?seed=` and `#quiz`
  open it.

### What moved (nothing dropped)
| From the old tool | Where it is now |
|---|---|
| + and − one particle per species (panel) | Explore: the tray (3 per press for a gas, 1 lump for a solid) and a tap on a particle (takes 3 out); Delete on a cup takes 3 out by keyboard |
| Let it react (a button) | Gone as a step: it reacts on its own a third of a second after each change |
| Volume of the vessel slider (0.5 to 2 L) | Explore: the piston knob, 0.50 to 1.50 L |
| Reaction picker (two particle reactions, random K per seed) | Explore: two tabs with fixed K (A + B ⇌ AB; CaCO₃ with its solids); the dimer A₂ ⇌ 2A and every numbers context stay in Test yourself |
| New mixture | Test yourself (every problem is a new mixture) |
| ApChemBeaker jar in `qk` mode with its Q pills and gauge | Explore: the drawn cylinder and the dial; the jar was used only by the old Explore (Test yourself draws its own box and bar); `live-beaker.js` still loads (the build's list is shared, left alone) |
| "Why?" with the concentrations line | "?": the live "Now:" concentrations or pressures and Q |
| Equilibrium amounts after Let it react (exact, non whole) | "?" says why the cylinder stops at whole counts near K |
| Drill types, ids, `?seed=`, `#quiz`, the Premium card when locked | Unchanged |
| The old mode memory | Not kept: every visit lands on Explore (the v2 rule); links still open Test yourself |

## Accuracy
- Data: `explore` in `chem/data/tools/q-vs-k.json`. Validator (`scripts/lib/apchem-tool-checks/q-vs-k.mjs`, run by
  `check-apchem-content`), without the page's code: the equations balance atom by atom, Kc goes with M and Kp with atm,
  only gases in Q, the start is exactly at K, Kp(CaCO₃) within 3% of both sources, adding a reactant gas runs forward and
  a product gas back (at least one whole event from the start), a solid runs nothing, squeezing runs toward fewer gas
  particles (A + B forward; CaCO₃ back) and something runs at both ends of the piston, and every settled state at every
  volume is within the caps and within 20% of K.
- Constants: A + B ⇌ AB is made up (as the exam's particle diagrams are); Kp(CaCO₃) = P(CO₂) = 0.22 atm at 800 °C: the
  classic table's 168 mm Hg (0.221 atm) and Baker 1962 (log P = 7.079 − 8308/T, 0.218 atm). Open for a person:
  `docs/apchem-needs-author.md` `qk-explore`.
- Q vs K direction rechecked: Q < K forward, Q > K back; Δn(gas) = −1 for A + B ⇌ AB, so Q scales with V (squeeze:
  forward); Kp = P(CO₂) for CaCO₃, so squeezing raises Q (back).
- No OpenStax; no released questions.

## What was built
- `chem/assets/tools/q-vs-k.js` (rewritten Explore; the drill unchanged) and `q-vs-k.css` (new).
- Build opt in: `"kit2": true` on the tool in `chem/data/pages.json`.
- No change to the chemistry adapter or the kit. `scripts/check-tool-use.mjs` is NOT changed.
- Sweep, frames and perf: `scripts/tools-v2/chem-q-vs-k-sweep.mjs` (`--frames`, `--perf`, `--shots`, `--height`).

## Checks run
See "Checks run (2026-11-24)" below (filled in by the build).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no students; no independent review yet.
- About one change in ten (from the simulation of random moves) runs no whole event: whole particles cannot shift by a
  fraction. The cause line says so ("1 more AB overshoots"), but a student may expect something to happen.
- The gas sits on a lightly jittered grid, so it can read as rows at a large volume.
- The right half of the wall is fairly bare between the plate and the tray at 1440 and 1920.
- Particles on a phone are small (an A atom about 14 px across at 390).
