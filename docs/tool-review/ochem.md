# Organic Chemistry: tool purpose review (2026-11-10)

Opened in Chromium at 1280x800 and 390x844, Premium on. Screenshots: `/home/claude/shots/review/ochem/<tool>/` and `ochem/phone/`.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Acid/base comparator | The stronger acid has the more stable conjugate base | FIX | It only shows the acids and then a pKa. The conjugate base, and why its charge is stable, is never drawn. |
| Arrow pusher | Arrows move electron pairs; the octet decides what is legal | LEAVE | Drawing an arrow and getting "C ends up with 10 electrons" teaches. Small: the E2 scene has no base. |
| Conformation lab | Energy follows the dihedral angle; bulky groups go equatorial | LEAVE | The Newman projection, slider and energy curve are right. Small: chairs show strain as a bar, not the 1,3-diaxial clash. |
| Reaction predictor | Substrate, reagent and conditions decide SN1, SN2, E1 or E2 | LEAVE | Mechanism arrows are drawn on the molecule. Small: the product drawing is tiny. Two accuracy flags below. |
| Reagent roadmap | Which reagent turns which group into which | REDESIGN in part | A grid of text blocks; Whole map and Groups are tangles of arrows with labels about 6 px; clipped on a phone. |
| Resonance explorer | Push arrows to find every form; the real molecule is the hybrid | FIX | The hybrid is never drawn. Compare two draws the structures small. |
| Spectroscopy lab | Each peak is a bond or a set of hydrogens | FIX | The NMR spectrum is squeezed into a bottom corner. IR has no molecule, so a peak never lights its bond. Ethanol's O–H is drawn too narrow. |
| Synthesis trainer | Plan a route forward and backward | LEAVE | Start and target molecules with steps; it does its job. |
| 3D molecule viewer | VSEPR shape and bond angle in 3D | LEAVE | Small: lone pairs are two tiny dots, which hardly show why NH3 is pyramidal. |

## Notes

**Acid/base comparator (FIX).** Compare two shows acetic acid and phenol, you tap, and the card turns green with
pKa 4.76 vs 10. The idea is conjugate base stability, so after the answer each card should lose its H+ and show its
conjugate base: acetate with the negative charge shared over both oxygens (resonance arrows or a charge map),
phenoxide with the charge spread into the ring, the inductive pull of Cl or NO2 shown with arrows. Rank four: the
four molecules are drawn very small (HCl and H2S are tiny text; trifluoroacetic acid is cramped).

**Resonance explorer (FIX).** Finding forms works well (arrows, then the form drops into the "Forms found" panel). When
all forms are found, draw the resonance hybrid: dashed partial bonds and δ charges (acetate: both C–O equal, δ− on
each O; allyl cation: δ+ on both ends). The Charge map panel says its numbers appear "once you have called it" but
shows no picture. Compare two: each structure is about a quarter of its large card.

**Spectroscopy lab (FIX).**
- ¹H NMR (ethanol, ethyl acetate): the spectrum fills only the bottom third of its panel, with peak labels about 5 px; the top two thirds are empty (`spectroscopy/02_nmr_etoac.png`). Fit it to the panel.
- IR: only the spectrum is shown. Draw the molecule beside it and light the bond when a peak is tapped (O–H, C=O, C–O), as NMR already does for hydrogens.
- Accuracy flag: ethanol's O–H band is drawn as a V-shaped dip of moderate width. An alcohol O–H band is broad and rounded (about 3200 to 3550 cm-1), and that shape is the thing students learn to spot. Carboxylic acid O–H should be broader still.
- Phone: the IR plot is fine; there is a large empty area under it.

**Reagent roadmap (REDESIGN in part).** Route mode is understandable (start A, target B, numbered steps, with
reagents listed under the map), but the map is made of grey name blocks, the reagents are not on the arrows, and the
labels are small. Whole map and Groups draw dozens of crossing arrows over 6 px labels. On a phone the map is clipped
on the right (Ether and Amine are off screen). What it should show: each group as a small structure fragment
(R–OH, C=C, R–CHO), the reagent written on each arrow of the route, and the route played on one molecule changing
step by step (the synthesis trainer already draws molecules). For Groups, show only the arrows into or out of the
picked group, fanned around it, each labeled.

**Reaction predictor (LEAVE, small).** The product sketch in the green box is about 8 px text; draw it the size of the
substrate. Accuracy flags for `docs/ochem-needs-author.md`: (1) 2-bromobutane + H2O, heat is called "mostly E1, about
70%, some SN1". Secondary bromide solvolysis in water usually gives mostly the alcohol, and heat raises elimination,
so the split is arguable. (2) Neopentyl bromide + H2O, heat is "No reaction". It is very slow, but under SN1 conditions
it can ionize with a methyl shift; "no reaction" may be better worded as "very slow; rearranges if forced".

**Arrow pusher (LEAVE, small).** The E2 preset is 2-bromobutane with no base, deliberately ("two arrows if no base is
drawn"), but E2 is defined by the base taking the proton. Draw ethoxide in that scene. SN2 is drawn flat, so the
backside approach (opposite Br) and the inversion cannot be seen; the reaction predictor has the same gap. Build mode
kept the previous scene's molecules on the canvas until a new one was built.

**Conformation lab (LEAVE, small).** In Cyclohexane chairs the axial and equatorial bonds are colored and the energy
split is right (methyl A value 1.70, 94.6%). Highlighting the two axial hydrogens the axial group bumps into would make
the reason visible, not just the bar. In Find the stable chair the tBu ball covers an H label. Trans-1,2-dimethyl
diequatorial ignores the gauche methyl interaction (about 0.9 kcal/mol); that is fine for A values, but a note would help.

**3D molecule viewer (LEAVE, small).** Lone pairs (ammonia, water) are two small grey dots beside the atom. Showing
them as a lobe taking a corner of the tetrahedron would make "trigonal pyramidal, 107°" follow from the picture.
