# Plan: AP® Chemistry, Equilibrium and kinetics (tools v2)

**Tool and page:** `chem/tools/equilibrium-kinetics.html`; `chem/assets/tools/equilibrium-kinetics.js` (591 lines)
and `.css`, data `chem/data/tools/equilibrium-kinetics.json` (reactions `n2o4` N₂O₄ ⇌ 2 NO₂, ΔH° +57.2 kJ/mol,
Kp 0.146 at 298 K; `hi` H₂ + I₂ ⇌ 2 HI; contexts `n2o4-stress`, `hi-stress`; part topics rate, cat, qk; sourced
thermodynamics in `sources`). Premium. Rollout row 58, group P, wave 12, size rework. Must not teach the Q vs K or
ICE table screens (merge table note).

**The one idea:** the rollout calls this two ideas, so two tabs. "Shift" (a stress moves the mixture until it is at
equilibrium again; temperature alone changes K). "Rate" (temperature and a catalyst change how many collisions have
enough energy; a catalyst speeds both ways and does not move the equilibrium).

## Research
- PhET Reversible Reactions and Reactants, Products and Leftovers (known, group row; `phet.colorado.edu`): molecules
  bouncing in a box, a temperature knob on the picture; take the knob on the box.
- The classic NO₂/N₂O₄ ice bath vs hot bath demonstration (for example the Royal Society of Chemistry "Education in
  Chemistry" demos, known): the brown colour is the readout; take colour as the visible result.
- PhET Gas Properties energy histogram (known): the Maxwell Boltzmann histogram fills live; take it for the Rate tab.
  Builder: open these (rule 10).

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Reaction picker (n2o4, hi) | Shift tab: two quiet chips (N₂O₄ opens: its colour shows); Rate tab: N₂O₄ |
| Temperature slider | Shift tab: main control, drag the bath thermometer (ice to hot); Rate tab: main control too |
| Volume of the vessel slider | Shift tab: quiet piston handle |
| +/− 3 molecules per species | Shift tab: quiet tap on a gas cylinder valve per species |
| Add a catalyst | Rate tab: quiet tap (a catalyst gauze into the flask) |
| Views: Concentrations graph, Rates graph, Collision energies | Shift: concentrations against time under the flask; Rate: the energy histogram under the flask; the rates graph to "?" |
| Speed of time (¼, normal, 4×, 16×), Pause | ⋯ menu (speed), the kit's time bar pause |
| Start over at equilibrium | Start over |
| Challenge me: predict, then run; Another challenge | Test yourself "Predict the shift" |
| Drill (contexts `n2o4-stress`, `hi-stress`, ids `equilibrium-kinetics:<ctx>:<step>`), `?seed=`, `#quiz` | Test yourself "Problems", unchanged |
| Sources (NBS tables, model notes) | "?" |

## Design
- **Picture:** a sealed glass flask of gas in a water bath on a lab stand; the gas tinted brown by the NO₂ it holds
  (the tint from the drawn NO₂ count), molecules drawn with atoms (ApChemMath particle templates); a thermometer in
  the bath with ice cubes at the cold end and a hot plate glow at the hot end.
- **Main control:** drag the thermometer. Shift tab: heat makes molecules move faster and N₂O₄ split; the flask
  browns; the concentration lines bend to the new plateau. Rate tab: the histogram's tail past Ea grows (shaded),
  collisions that react flash at the moment two molecules meet.
- **Animates:** molecules split and join where they are; the piston slides; added gas puffs in from the valve.
- **Cause line (Shift):** "hotter → forward reaction is endothermic → K rises → more NO₂ → browner".
- **Cause line (Rate):** "hotter → 3 × more collisions past Ea → faster both ways".
- **Takeaway:** "Only temperature changes K; adding gas or squeezing changes Q."
- **Outside the picture:** 2 tabs, purpose line, Show me how, cause line, the graph under the flask.

## Science to verify
- ΔH° and Kp of both reactions against the NBS/CRC values in `sources`, and the van 't Hoff dependence of K.
- Arrhenius k = A e^(−Ea/RT) with R 8.314 J/(mol·K) (equations sheet); the catalyst lowers Ea for both directions
  equally (CED 5.11, 7.x).
- Volume change: N₂O₄ ⇌ 2 NO₂ shifts left on compression; HI has equal moles and does not shift: a good check that the
  picture does nothing visible for HI.
- Trap: do not say a catalyst "shifts" equilibrium; Le Chatelier as a prediction, Q vs K as the reason (authoring
  guide CER). No OpenStax.

## Reuse
`ApChemTools.studioKit2` (exists since units and significant figures) with parts and `o.start` for `?seed=`/`#quiz`.
`window.ApChemBeaker` and `ApChemMath.particles` for drawn molecules. Kit: `K.tabs`, `K.drag`, `K.tap`, `K.cue`,
`K.cause`, `K.speed` (⋯). Second AP® Chemistry tool on kit2; first one with a time based model.

## Risks reviewers will likely block on
- The brown tint must follow the drawn NO₂ count every frame (picture vs number).
- Histogram labels (Ea, "enough energy") clear of the curve at 360 px.
- Molecules must stay inside the flask during a fast piston drag.
- Perf: 30 molecules with collisions at x4 throttle; one element per molecule.
