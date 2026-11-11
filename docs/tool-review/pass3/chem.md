# AP Chemistry: cleanup round, pass 3 (2026-11-11, builder c4)

Judge file: `docs/tool-review/pass2/judge-b.md`. Lead's list: "chem: ICE table and jar are small in a mostly empty
stage". Not mine (shared work): the first-run hint covering cells, the halo, the dock "More" overflow.

New: a chem tool can have its own stylesheet. `scripts/build-apchem.mjs` links `chem/assets/tools/<slug>.css`
after `chem-tools.css` when the file exists (buffer drills, equilibrium and kinetics, ICE table drills use it), so
these fixes stay out of the shared shell.

Shots: `/home/claude/shots/pass3/chem/<tool>_before_d.png`, `_after_d.png`, `_after_p.png`.

| Tool | What the judge said | What I did | Now |
|---|---|---|---|
| Buffer drills | TOUCH UP: HA and A- letters about 7 px; pH plot empty until the first add. | The whole buffer curve is drawn faint under the plot, so it opens with the shape the taps will trace (solid line over it). A two-item key under the beaker (HA with the acid's name, A- with the base's) drawn from the beaker's own particles. The beaker gets the wider column on the stage and fewer empty slots (36 to 27; at most 26 particles ever show), so particles are about 30% larger on desktop. | PASS on desktop. Phone: particles larger and named by the key, but still small (20 particles in a 200 px beaker; fewer particles would change the 1 particle = 1 tenth model, so not done). |
| Equilibrium and kinetics | TOUCH UP: Q bar, 3 chart tabs, slider, 2 steppers, catalyst and Challenge all show; plot is two flat stubs. | Dock is now the temperature slider and the two amount steppers, plus a Setup row "More: Catalyst, challenge, graphs". Catalyst, Challenge me and the graph chooser (Concentrations, Collision energies, Rates) are in Details at the top; picking one closes the sheet so the change is seen. A running challenge's question still appears in the dock. The graph opens with 6 s of the equilibrium record (`sim.warm`, flat lines over time, the amounts the vessel holds), so it reads as lines, not stubs; the graph now takes the full right column. | PASS (controls showing 4: slider, 2 steppers, Setup row). |
| ICE table drills | TOUCH UP: phone jar tiny; bar chart toggle and words over budget. Lead: table and jar small in a mostly empty stage. | Wide stage: jar gets the larger column (1 : 1.3) and full height, table type up (row letters 24 px, numbers 21 px). Phone: table rows packed (row names to one letter, padding trimmed) and the empty gauge row collapses until x moves, so the jar is about 35% larger. Dock line trimmed to "Move x to react some of the I row." | PASS. |
| Particle diagrams | PASS. | Nothing. | PASS. |
| Periodic trends and PES | TOUCH UP: hint covers K, Ca, Sc, Rb (not mine); Compare plus 4 property buttons plus 3 tabs. | Compare two elements moved into Details (first item); the Setup row reads "Whole table, compare two". While a comparison runs its Cancel or Done button sits in the dock under the trend buttons; tapping Compare closes the sheet. | PASS for the controls (4 trend buttons plus the Setup row). The hint placement is the shared builder's. |
| Q vs K | PASS (optional: larger letters on phone). | Nothing (optional). | PASS. |
| Titration curve reader | PASS. | Nothing. | PASS. |
| Units and sig figs | PASS. | Nothing. | PASS. |

Accuracy: no fact, answer or scoring changed. The buffer ghost curve is `ApChemMath.bufferState` over the same
range the taps can reach; the warm start logs the vessel's own equilibrium amounts (Q = K at the start).

Checks: `build-apchem.mjs --check`, `check-apchem-content.mjs`, `check-apchem-map.mjs`, `node --test
scripts/test/apchem*` all clean.
