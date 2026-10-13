# AP® Physics 1 authoring guide

Rules for writing AP® Physics 1 content, adapted from `docs/apchem-authoring-guide.md`. They come
from `docs/apphys-spec.md`; where this guide and the spec differ, the spec wins. File formats are
in `docs/apphys-architecture.md` ("Content formats"). The research behind the rules is in
`docs/apphys-research/framework.md` (section 8 lists where students lose points).

## Before you write a topic

1. Find the topic in `docs/apphys-dependency-map.json`: its id, CED number, focus practices and the
   concepts it owns (`concepts[].taughtIn`). Read its entry in `docs/apphys-ced-map.json` for what
   the framework expects and what it excludes, and write it in your own words.
2. You may use anything taught in this topic or an earlier one in course order, plus the map's
   `everydayWords`; nothing taught later, except inside a declared preview box
   (`<aside class="phys-preview" data-concept="…">`, backed by a `circularDependencies` entry).
   If the topic needs a term the map does not have, add the concept to the map first.
3. Write `physics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`,
   `glossary/<id>.json` (and `figures/<id>.json` with `physics/figures/<fig>.svg` for a new figure).
4. Run `node scripts/check-apphys-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-apphys-map.mjs --check`.

## Originality, sources and the trademark

- **Original items only.** Never reproduce, adapt or closely paraphrase released College Board
  questions, AP Classroom items, the CED's text or any textbook. Use the CED, the equations sheet
  and the Chief Reader Reports for scope and for the errors to target, never as item sources.
  Invent your own scenes, numbers and contexts.
- **No OpenStax.** No OpenStax text or figures, and never paste OpenStax into an AI tool. Figures
  are our own SVGs.
- Write the mark as **"AP®"**, with the ®, and only as an adjective before a capitalized noun:
  "the AP® Physics 1 exam". Never "AP" alone, never plural or possessive, never in a URL, id, file
  name or meta description. Prefer "the exam". The generator adds the disclaimer.

## Scope: what is NOT tested (exclusions)

Nothing below appears in an item, FRQ or as a required step. Notes may mention one in a
`going-further` aside, never as tested content. Units 1-2 are from the CED; Units 3-8 come from a
transcription and are to be verified (`docs/apphys-needs-author.md`, ced-exclusions).

- Quantitative analysis of **nonuniform acceleration** (qualitative graphs and words only).
- **Relative velocity in two dimensions** (one dimension only); non-inertial frames unless stated.
- **Center of mass** for more than five objects, unless highly symmetric.
- **Force components drawn on a free-body diagram** (an FBD shows whole forces only).
- Quantitative **tension in a rope with mass**; **forces at a distance other than gravity** (no
  electric or magnetic forces).
- **Banked curves that need friction**, quantitatively; **Kepler's first and second laws**.
- **Heat and thermal energy** quantitatively (mechanical energy only).
- **Variable-mass systems** (rockets, leaking carts).
- **Simultaneous equations** (no "find both final velocities" of an elastic collision);
  **two-dimensional momentum** beyond semiquantitative.
- **Vector directions of torque, angular velocity and angular momentum** (right-hand rule): only
  clockwise or counterclockwise; **rotation in more than one plane**.
- **Memorizing rotational inertia** of disks, rods, hoops, spheres (give it); computing I for more
  than five objects.
- **Rolling friction**; quantitative **rolling while slipping**.
- **Nonideal fluids**, partly filled pipes, viscosity, turbulence.
- **Waves, sound, circuits** (moved out of the course).

**In scope, and often skipped elsewhere:** Unit 8 fluids (buoyancy, continuity, Bernoulli), power
(3.5), rolling with v = rω (6.5), orbits with energy and angular momentum (6.6), SHM with
x = A cos(2πft) (7.3), center of mass (2.1).

## Units, g and significant figures

- **SI units everywhere**: m, kg, s, N, J, W, Pa, rad. Convert cm, g, km/h and minutes in the stem
  or as an explicit step. Write units with a middle dot and superscripts in prose (kg·m/s², m/s²);
  in `numeric.unit` any SI spelling works (`"m/s^2"`).
- **g: say which.** The equations sheet prints g = 9.8 m/s²; the CED accepts 10 m/s². Every item
  that needs g either **states the value in the stem** ("Use g = 9.8 m/s².") or carries
  **`numeric.gAlt`** with the key worked with the other value (then both are graded right). Notes
  use 9.8 in worked examples and say once per unit that 10 is accepted. Never mix the two in one
  solution.
- **Significant figures**: give `sigfigs` for every computed numeric answer, equal to the fewest
  significant figures in the data (usually 2 or 3). Exact counts use `decimals`. Round once, at
  the end; the tolerance accepts honest rounding of intermediate steps only (at most two units in
  the last digit). The exam itself does not grade sig figs harshly, but reporting a sensible
  number is a habit the readers reward; keep data at 2-3 figures so this never dominates.
- **`askUnit: true`** whenever choosing the unit is part of the skill (energy vs power, momentum vs
  impulse units, N vs kg); otherwise state the unit in the stem.
- **`mistakes`** for the slips readers report on that calculation, each with a one-line `why` that
  names the slip and the fix. The grader already catches sign errors, factors of 2, a missing
  square or square root, g = 9.8 vs 10, cm vs m, kilo/milli and degrees vs radians on its own; add
  mistakes for topic-specific ones (½m(Δv)² for ΔK, d instead of d sinθ for a height, the spring
  period formula for a pendulum).

## Free-body diagrams and force diagrams (conventions)

Every FBD in notes, items, FRQ samples and trainers follows these rules, and distractors are
built from breaking them:

- Draw the object as a **dot** (or a box with a dot at its center of mass). **Each force is an
  arrow starting on the object**: from the dot for an FBD; from the **point of application** for
  a force diagram in rotation (Unit 5).
- **Label every force with its type and agent**: "F_g, Earth on block", "F_N, ramp on block",
  "F_T, rope on crate", "f_k, floor on crate", "F_s, spring on cart", "F_b, water on block". Use
  `ApPhysScene.forceLabel(type, agent, on)` in tools.
- **Only real forces**: never a "net force", "centripetal force", "force of motion", velocity or
  momentum arrow on an FBD. A centripetal force is whatever real force (or sum) points to the
  center.
- **Whole forces, not components** (the CED boundary). Choose axes beside the diagram instead.
- **Relative lengths** match the situation: balanced forces equal, the larger force longer.
- The normal force is perpendicular to the surface; kinetic friction opposes sliding; tension
  pulls along the string.

## Level and voice

- High school, from scratch, for a student whose class moved too fast. Short sentences, active
  voice, "you". One idea per section; a concrete scene first, then the rule; define each term the
  first time.
- **Cause and effect, never purpose**: "the net force on the cart is zero, so its velocity stays
  constant", never "the ball wants to fall".
- **Name the system** before any conservation statement, and the condition that makes it hold.
- **Worked example before any calculation type** is asked, in `<div class="worked">`: start from a
  named principle, write the equation in symbols, substitute with units, answer with units and
  sensible figures. Two-column derivations (words beside math) as the readers recommend.
- Every lesson has a figure (our own SVG) and a numbered cause-and-effect chain.

## Questions

- Every item carries `unit`, `topic` and `practice` (`"2.B"`). **Practice 1 (Creating
  Representations) is free response only**; tag the MCQ skill the item actually exercises
  (mostly 2.A-2.D and 3.B-3.C).
- **Four options** for single-answer items; similar lengths (the key is the longest at most 40% of
  the time); no absolutes that give the answer away; no "all of the above".
- **Distractors are real misconceptions** (framework.md section 8), and each option's explanation
  names the misconception and why it fails, by content, never by letter or position: net force
  drawn as a force; normal force always equal to mg; heavier objects fall faster; a force needed
  to keep moving; momentum and kinetic energy both conserved in every collision; "centripetal
  force" as an extra force; the spring period formula for a pendulum; buoyant force depending on
  the object's density; pressure as force; ΔK = ½m(Δv)²; amplitude changing the period.
- **At least 60% apply/analyze**, and at least 40% of a CED topic's items in **stimulus sets** of
  4-5 items sharing one table, graph, setup, model or **diagram**. Real-looking data with units on
  every column. Functional-dependence items ("if the length is 4 times as long, the period is...")
  in every unit.
- **Diagram stimuli** (`kind: "diagram"`): our own inline SVG with `role="img"` and an
  `aria-label` that says what the scene shows (20+ characters), plus a visible key when colors
  carry meaning. Forces drawn in a stimulus follow the FBD conventions above.
- Select-all: at most half of all options correct across the bank, never more than two thirds in
  one item, some with a single correct option. Predict: about a fifth "no change". No
  near-duplicates across topics.

## Justifications (claim, evidence, reasoning)

Every "explain" or "justify" answer is a claim, the evidence (a number, a graph feature, a
representation) and the reasoning from a named principle **with its condition**:

- **Conservation needs its condition**: "The net external force on the two-cart system is zero
  during the collision, so its momentum is constant", never "momentum is conserved because of
  conservation of momentum" (the check refuses this in a model answer).
- **Momentum vs energy**: a sticky collision conserves momentum, not kinetic energy; start from
  momentum.
- **Functional dependence**: derive the expression, then read the factor ("T ∝ √ℓ, so 4ℓ doubles
  T") and check it against the qualitative claim.
- **Graphs**: name what the slope or area means, with units; total mechanical energy is flat when
  it is conserved; plot against the quantity asked (position, not time).
- **Lab procedures** name what is measured, with which instrument (meterstick, stopwatch, spring
  scale, motion detector, force sensor, photogate), how many trials, and what to plot so the
  graph is a line and what its slope gives.
- **Fluids**: buoyant force and gravity are separate forces in opposite directions; buoyant force
  depends on the fluid's density and the displaced volume.

## FRQs: the four types and their rubrics

One rubric line per point, each with accepted wordings; a full-credit sample for every part; task
verbs in bold (Calculate, Derive, Draw, Sketch, Plot, Justify, Explain, Describe, Determine).

| Type | Points | Shape | Rubric points go to |
|---|---|---|---|
| `mr` Mathematical Routines | 10 | a sketched graph, a symbolic derivation from a named principle, a calculation, a claim with justification | the starting principle; correct substitution; the symbolic answer in given quantities; the graph's shape and key features; a justification that names the condition |
| `tbr` Translation Between Representations | 12 | (a) draw an FBD, energy bar chart or momentum representation (`drawSpec`, `space: "draw"`), (b) derive an equation consistent with it, (c) sketch a graph (`graphSpec`), (d) explain how the three agree | each force present, labeled, with correct direction and relative length, and no extras; bars that add up and match the situation; an equation term for each drawn force or bar; graph shape, intercepts and slope sign; the consistency argument naming a specific feature in each representation |
| `lab` Experimental Design and Analysis | 10 | (a) a procedure with measured quantities, instruments and a way to reduce uncertainty, (b) what to plot to get a line and how the slope gives the target, (c) plot given data (`graphSpec`): labels with units, linear scale, best-fit line, (d) use the slope | the measured quantities and instruments; repeated trials or a range of values; the linearizing choice; axes labeled with units; a straight best-fit line (not connect-the-dots); the slope used with units |
| `qqt` Qualitative/Quantitative Translation | 8 | (a) a qualitative claim without equations, (b) derive an expression from a named principle, (c) use the functional dependence to check (a) | the claim with a physical reason; the correct starting principle (the one the prompt names); the derived expression; the dependence read correctly and tied back to the claim |

A TBR question needs a `drawSpec` or a `graphSpec`; a LAB question needs a `graphSpec`. At least
one LAB FRQ per unit uses data the student plots. Full practice exams use one of each type, in
that order.

## Contested or uncertain science

Add it to `docs/apphys-needs-author.md` instead of guessing. Every unit gets an independent
accuracy check before it is published, with every numeric key recomputed by code.
