# Plan: AP® Chemistry, ICE tables (tools v2)

**Tool and page:** `chem/tools/ice-table-drills.html`; `chem/assets/tools/ice-table-drills.js` (259 lines) and
`.css`, data `chem/data/tools/ice-table-drills.json` (contexts `hydrogen-iodide`, `dinitrogen-tetroxide`,
`nitrosyl-chloride`, `water-gas-shift`, `phosphorus-pentachloride`, `ammonia-synthesis`; types find K, perfect
square, small K and the 5% check). Free. Rollout row 72, group P, wave 12, size rework. Must not be the Q vs K
screen: here the idea is how far (x), not which way.

**The one idea:** a reaction runs forward by x until Q reaches K; the ICE table is that change written down. One
screen.

## Research
- PhET Reversible Reactions (known, group row): particles convert until the counts stop changing; take the
  particle box beside numbers.
- Khan Academy ICE table exercises (known, group C row): one row at a time with forgiving input; take the row by
  row Test yourself.
- ChemCollective equilibrium virtual labs (known, `chemcollective.org`): concentrations read from a real flask.
  Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| x slider ("x, the extent of reaction") | Explore: main control, a K.handle on the flask's progress (drag the reaction forward or back) |
| Reaction picker (6) | Explore: two quiet chips (HI, N₂O₄); four more in Test yourself, log it |
| ICE table (I, C, E rows) | Explore: drawn on a notebook page beside the flask; C and E rows fill from x |
| Bars initial (faint) vs at this x | Picture: the particles themselves; bars to "?" |
| Q vs K chart | Explore: one Q gauge on the flask that meets the K mark at equilibrium |
| Solve for x | Test yourself |
| Small K and the 5% check, Perfect square, Find K types | Test yourself (and "?" for the 5% rule), log it |
| New numbers; drill ids `ice-table-drills:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a sealed flask of gas (H₂, violet I₂, HI drawn with atoms) on the left; on the right a notebook page
  with the ICE table handwritten, its three rows and the species columns. Under the flask a Q gauge (log scale) with
  K marked as a fixed notch.
- **Main control:** drag the progress handle: every step of x converts the right number of molecules in the flask
  (2 HI form where one H₂ and one I₂ meet), the C row writes "−x, −x, +2x" with x's value, the E row updates, and the
  Q needle moves. Past equilibrium the handle still moves (Explore is free), Q overshoots K and the cause line says
  the reverse reaction would bring it back.
- **Animates:** molecules break and join in place; the violet tint fades with I₂; numbers in the table count up.
- **Cause line:** "x 0.040 M → Q 21 → below K 54 → still runs forward".
- **Takeaway:** "At equilibrium Q = K: that is the x the ICE table solves for."
- **Outside the picture:** purpose line, Show me how, 2 chips, cause line, Start over.

## Science to verify
- Each reaction's K at its stated temperature (HI 54 near 700 K; N₂O₄ Kc; water gas shift; PCl₅; NH₃) against CRC
  or NIST (the json carries values; recompute Q from the drawn counts).
- Stoichiometric change signs and coefficients; the 5% approximation rule as the course states it.
- Trap: K for the gas phase stated as Kc or Kp consistently; units not given for K (AP® convention). No OpenStax.

## Reuse
`ApChemTools.studioKit2` (Problems part); `window.ApChemBeaker` in `qk` readout mode for the flask and gauge. Kit:
`K.handle`, `K.tap`, `K.cue`, `K.cause`. Coordinate visuals with the Q vs K and Equilibrium and kinetics plans so
the three flasks look like one family yet each screen teaches its own idea.

## Risks reviewers will likely block on
- Drawn molecule counts must match the E row (proportions rule) at each x, with a per particle scale said once.
- Table numbers and column heads 4 px apart at 360 px; the table may go under the flask on phones.
- Subscripts and charges in pills must not break at 360 px.
- Old "table, beaker and chart compete": the Q gauge must be small and on the flask.
