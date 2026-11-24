# Plan: AP® Chemistry, Periodic trends and PES (tools v2)

**Tool and page:** `chem/tools/periodic-trends-pes.html`; `chem/assets/tools/periodic-trends-pes.js` (330 lines),
data `chem/data/tools/periodic-trends-pes.json` (118 elements, 18 ions, sources radius, ie, en, ea, conf, pes, ions;
contexts `radius`, `ionization`, `ionization-dips`, `electronegativity`, `ions`, `pes-identify`, `pes-compare`).
Free. Rollout row 64, group X, wave 12, size rework (313 words on the stage today).

**The one idea:** Coulomb's law (more protons pull harder, more shells sit farther) explains each trend. Two tabs:
"Trends" (tap an element: its atom drawn, size and pull) and "Spectrum" (a photoelectron spectrum is the atom's
shells read as peaks).

## Research
- [Ptable](https://ptable.com) (known, group row): tap an element, the property colours the table at once; take the
  colour map and the tap.
- [AACT, Introduction to PES](https://teachchemistry.org/classroom-resources/introduction-to-pes): peaks by
  subshell, height by electron count; take the peak labels.
- [PES spectrum visualizer (McCreary)](https://dmccreary.github.io/chemistry/sims/pes-spectrum-visualizer) and
  PhET Build an Atom (known): an atom drawn with shells that updates as protons are added. Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Periodic table, tap an element, arrow keys and Enter | Trends tab: main control (main groups drawn; full table behind "?") |
| Trend to show: atomic radius, ionization energy, electronegativity | Trends tab: three quiet chips; the table colours by the chosen trend |
| Views: Table, Across and down (bars), Spectrum | Trends: the table and the drawn atom; Across and down bars to "?"; Spectrum is tab 2 |
| Compare two elements | Trends tab: a second tap draws a second atom beside the first (no button) |
| Ions (radius of ions, 18 ions) | Trends tab: quiet "ion" tap on the drawn atom (adds or removes electrons, size changes); the ion list in "?" |
| Ionization energy dips | Trends tab: shown on the atom when N to O or Be to B is tapped (the paired electron or new subshell lit) |
| Identify from a spectrum, Compare two spectra | Test yourself parts |
| Drill (7 contexts, ids `periodic-trends-pes:<ctx>:<step>`), `?seed=`, `#quiz` | Test yourself "Problems", unchanged |
| Data sources | "?" |

## Design
- **Picture (Trends):** a compact main group periodic table along the top, cells tinted by the chosen trend; below
  it the tapped atom drawn large: nucleus with its protons as a glowing core sized by charge, shells as soft
  clouds, valence electrons as dots, and the effective pull as arrows from the core to the outer electrons whose
  thickness follows Zeff over r². A second tap draws a second atom at the same scale beside it.
- **Main control:** tap an element. The atom grows or shrinks from the previous one (animated), arrows thicken or
  thin.
- **Picture (Spectrum):** the same atom above its spectrum: each subshell's peak sits under its shell, height by
  electrons, position by binding energy (scale reversed as the exam draws it); tapping a peak lights its electrons.
- **Cause line:** "Na to Cl → 6 more protons, same shell → stronger pull → smaller atom, higher IE".
- **Takeaway:** "Across a period the pull grows; down a group the shells add distance."
- **Outside the picture:** 2 tabs, purpose line, Show me how, cause line, 3 trend chips. Under 30 words.

## Science to verify
- Radii (covalent or metallic, say which), first ionization energies, Pauling electronegativity from the data's
  sources (CRC, NIST); the IE dips at B and O and their explanations (CED 1.7, 1.8).
- PES binding energies of the elements drawn (NIST X ray photoelectron database or the course's own `pes` source);
  the axis direction as on the exam (binding energy decreasing to the right).
- Trap: "shielding" vs "effective nuclear charge" wording as the course uses it; no quantum numbers, no aufbau
  exceptions (CED exclusions in the authoring guide). Noble gas electronegativity left blank. No OpenStax.

## Reuse
`ApChemTools.studioKit2` (parts). Kit: `K.tabs`, `K.spots` (the table cells as named spots with "find it" for Test
yourself), `K.tap`, `K.cue`, `K.cause`. First AP® Chemistry tool on `K.spots`.

## Risks reviewers will likely block on
- The table at 360 px: main groups only (8 columns) so cells stay 40 px; symbols 11 px minimum.
- Atom sizes must be to scale with the radius data (measure in the sweep).
- 313 words today: count the landing; everything descriptive moves to "?".
- Colour by trend needs a non colour cue (the value on tap, darker means larger said in "?").
