# Ochem readability and diagram audit (Phase 0)

Date: 2026-09-24. Status: Phase 0 approved. **Phase 1 done** (functional groups and all four nomenclature
topics rewritten and audited; see `docs/ochem-phase1-report.md`) and approved. **Phase 2 in progress**, worst chapter
first. Published so far: Foundations (all ten topics, including functional groups from Phase 1).

## What this is

Every notes page (`ochem/notes/*.html`, 121) and every lesson page (`ochem/lessons/*.html`, 117)
was read in full against the standard below, by ten reviewers working chapter by chapter. The
mechanism walkthroughs (`ochem/mechanisms/`) were not in scope. SN2, SN1, E2 and E1 have notes pages
but no lesson page.

**The standard.** Short sentences, active voice. A concrete example comes before the general rule.
One idea per paragraph. Every term is defined in plain words at first use. Correct chemistry is
never thinned out to simplify; a diagram or example is added instead. Any paragraph that describes
a shape or a spatial relationship needs a diagram in the site's existing style, with real labels
on the figure. No wording from any textbook.

**How to read a finding.** `[H]` means a student would likely get lost or build a wrong picture.
`[M]` means it slows the reader noticeably. `[L]` means fix it while the page is open. The finding
types are CONFUSING, MISSING DIAGRAM and MISPLACED/WEAK FIGURE (a figure under the wrong heading,
unlabeled, or not showing what the text beside it describes). Page score = 3×H + 2×M + 1×L.
Chapters and the pages inside them are listed worst first.

Totals: 518 confusing, 506 missing-diagram and 76 misplaced/weak-figure findings
(121 H, 594 M, 405 L).

## Patterns across the course

- **Many lessons draw nothing.** 52 of the 117 lessons contain no drawing of any kind (no SVG,
  canvas, image or molecule renderer). They ask spatial questions (numbering direction, endo/exo,
  syn/anti, ring positions, mechanism arrows) in words only, often when the notes page already has
  the right figure. Many of the fixes are to reuse the notes figure in the lesson.
- **Notes figures sit under the wrong heading.** 75 pages have a misplaced or weak figure. The figure
  builder places each figure after an anchor string in the prose, and many anchors land one heading off. This is cheap to fix
  and makes a big difference to the reader.
- **Lessons test before they teach.** A lesson question often comes before the explain step that
  covers it (examples: Williamson, NaBH₄ vs LiAlH₄, ozonolysis, Lindlar, NBS, benzyne, acylation).
- **Rule first, example second.** The commonest CONFUSING finding. A list of rules comes before the
  first worked case.
- **Overloaded paragraphs.** One paragraph carries three to five ideas, often with a definition
  buried partway through.
- **Condensed formulas used as the only picture.** For example, the functional-group table, the
  nomenclature numbering examples, and the ester-synthesis and polymer repeat units.

## Proposed next steps (for the owner to approve)

- **Phase 1 scope:** the functional-groups notes and lesson (chapter 1), and all four nomenclature
  topics (chapter 3: naming-parent-chain, naming-substituents, naming-functional-groups,
  naming-rings-unsaturation), notes and lessons. That is 10 pages. Every finding listed for them
  below gets fixed, and every missing diagram gets drawn. They then go through the site's two-stage
  audit: a fresh reviewer checks the rewrite against the standard and the chemistry, a second fresh
  reviewer verifies, and every check runs.
- **Chemistry noticed in passing:** each chapter below ends with a list. These are reviewer
  observations, not verified facts. The plan is to verify each one in the verification stage when
  its chapter is rewritten, and to fix the confirmed ones there. Contested points go into a new
  `docs/ochem-needs-author.md`, the ochem counterpart of the A&P file, rather than being settled
  by guessing.
- **Phase 2 order:** the chapter table below, worst first, publishing each chapter as it passes.

## Chapters, worst first

| Rank | Chapter | Score | Worst pages |
|---|---|---|---|
| 1 | 1 Foundations | 163 | hybridization lesson (14), functional-groups notes (13), hybridization notes (12) |
| 2 | 3 IUPAC Nomenclature | 131 | naming-substituents lesson (19), naming-functional-groups lesson (19), naming-substituents notes (18) |
| 3 | 12 Carbonyl Chemistry | 116 | aldehydes-ketones notes (11), nucleophilic-addition notes (10), nucleophilic-addition lesson (10) |
| 4 | 16 Enolate Chemistry | 114 | michael-robinson notes (15), michael-robinson lesson (12), ester-syntheses notes (11) |
| 5 | 7 How Reactions Happen | 113 | carbocations lesson (15), radical-halogenation lesson (14), energy-diagrams lesson (13) |
| 6 | 22 Biomolecules | 109 | lipids notes (13), carbohydrates notes (12), carbohydrates lesson (12) |
| 7 | 6 Stereochemistry | 101 | cis-trans-ez lesson (12), diastereomers notes (9), prochirality lesson (9) |
| 8 | 14 Carboxylic Acids & Derivatives | 99 | acyl-chlorides-anhydrides notes (10), acyl-chlorides-anhydrides lesson (10), nitriles notes (10) |
| 9 | 9 Alkenes & Alkynes | 95 | alkene-oxidation lesson (14), alkene-structure notes (11), hydrogenation lesson (9) |
| 10 | 10 Conjugation & Pericyclic Reactions | 93 | diels-alder lesson (15), diels-alder notes (13), uv-vis notes (13) |
| 11 | 19 Aromatic Follow-Through | 87 | birch-reduction notes (14), nucleophilic-aromatic lesson (13), phenols notes (10) |
| 12 | 23 Polymers | 83 | addition-polymers notes (16), condensation-polymers notes (12), polymer-basics notes (11) |
| 13 | 5 Alkanes & Conformations | 76 | newman lesson (14), newman notes (12), axial-equatorial lesson (9) |
| 14 | 21 Synthesis & Retrosynthesis | 73 | retrosynthesis notes (12), retrosynthesis lesson (8), carbon-carbon-bonds lesson (8) |
| 15 | 2 Drawing Molecules & Moving Electrons | 71 | resonance notes (16), curved-arrows notes (15), skeletal-structures notes (13) |
| 16 | 18 Amines | 70 | amine-structure notes (13), amine-reactions notes (11), amine-structure lesson (9) |
| 17 | 15 Organometallics | 69 | organolithium-reagents notes (12), grignard-reagents notes (10), cross-coupling lesson (9) |
| 18 | 4 Acids & Bases | 63 | acidity-factors notes (18), acidity-factors lesson (13), lewis-acids notes (7) |
| 19 | 20 Spectroscopy | 56 | h-nmr notes (13), mass-spec notes (11), ir notes (8) |
| 20 | 11 Alcohols, Ethers & Related Chemistry | 55 | alcohol-reactions notes (11), ether-chemistry notes (10), epoxides notes (10) |
| 21 | 17 Aromatic Chemistry | 52 | directing-effects lesson (11), aromaticity notes (10), directing-effects notes (10) |
| 22 | 13 Oxidation & Reduction | 37 | carbonyl-reduction notes (12), oxidation-states notes (8), alcohol-oxidation notes (6) |
| 23 | 8 Substitution & Elimination | 30 | sn2 notes (10), sn1 notes (6), e2 notes (4) |

## The 25 worst pages

| Page | Chapter | Score |
|---|---|---|
| naming-substituents — lesson | 3 | 19 |
| naming-functional-groups — lesson | 3 | 19 |
| naming-substituents — notes | 3 | 18 |
| naming-rings-unsaturation — lesson | 3 | 18 |
| acidity-factors — notes | 4 | 18 |
| addition-polymers — notes | 23 | 16 |
| resonance — notes | 2 | 16 |
| naming-parent-chain — lesson | 3 | 15 |
| naming-rings-unsaturation — notes | 3 | 15 |
| michael-robinson — notes | 16 | 15 |
| carbocations — lesson | 7 | 15 |
| diels-alder — lesson | 10 | 15 |
| curved-arrows — notes | 2 | 15 |
| hybridization — lesson | 1 | 14 |
| naming-functional-groups — notes | 3 | 14 |
| radical-halogenation — lesson | 7 | 14 |
| alkene-oxidation — lesson | 9 | 14 |
| birch-reduction — notes | 19 | 14 |
| newman — lesson | 5 | 14 |
| functional-groups — notes | 1 | 13 |
| naming-parent-chain — notes | 3 | 13 |
| energy-diagrams — lesson | 7 | 13 |
| lipids — notes | 22 | 13 |
| diels-alder — notes | 10 | 13 |
| uv-vis — notes | 10 | 13 |

---

## Chapter 1 — Foundations (score 163)

### hybridization — lesson (score 14)
- [H][CONFUSING] step 3 "Three recipes, and the shortcut" — one step holds the sp² and sp recipes, leftover p orbitals, a pi-bond preview, the group-count shortcut and the amide exception. Each rule comes before its example.
- [H][MISSING DIAGRAM] step 2 "Mixing unequal orbitals into equal ones" — the four sp³ hybrids at 109.5° pointing to tetrahedron corners are described only in words. Needs the s + 3p → 4 sp³ picture on a tetrahedron.
- [H][MISSING DIAGRAM] step 3 "Three recipes" — sp² (three flat hybrids at 120° with a p orbital perpendicular to them) and sp (linear, with two perpendicular p orbitals) are text only. Needs the three-panel figure the notes already have.
- [M][MISSING DIAGRAM] step 1 "First, solve the paradox" — promoting a 2s electron into 2p has no orbital-box/energy diagram showing ground state → promoted state.
- [M][CONFUSING] step 7 "Hybridization predicts shape" — "s-character" is never defined in the lesson, and the ranking sp > sp² > sp³ for bond strength is given with no reason.
- [L][MISSING DIAGRAM] step 8 "Beyond 4 groups" — names trigonal bipyramidal and octahedral with no picture, and says "sp³d has been retired" without saying why.

### functional-groups — notes (score 13)
- [H][CONFUSING] The groups this course uses — a 19-row table where every structure is a condensed formula (nitrile, anhydride, nitro, 1°/2°/3° amines, phenol, thiol). The student has to build every shape in their head. Only the seven carbonyl groups are drawn anywhere.
- [H][MISSING DIAGRAM] First: reading the notation — benzene, C6H5– and –C6H4– are described in words ("flat six-carbon ring… three double bonds"), and so is where substituents sit on HOOC–C6H4–O–CO–CH3. Needs a ring drawing with one and with two substituents attached.
- [M][MISPLACED FIGURE] Why polarity tells you where a group will react — the tert-butyl alcohol vs tert-butylamine figure sits here, but it illustrates the previous section, "Primary, secondary, tertiary".
- [M][MISSING DIAGRAM] Primary, secondary, tertiary — CH3CH2OH / (CH3)2CHOH / (CH3)3COH (and the matching bromides) are given only as condensed formulas. Counting carbons on the carbon needs the branches drawn, with 1°/2°/3° labels.
- [M][MISPLACED FIGURE] What carries forward — the aspirin/acetaminophen/ibuprofen figure is here instead of under the worked examples. Ring positions (ortho in aspirin, para in the other two) are never stated.
- [L][CONFUSING] Why polarity…, "Here is the preview" paragraph — meta-commentary about what is and is not being taught delays the point.

### hybridization — notes (score 12)
- [H][CONFUSING] Shortcut section, "A labeled preview: the one place the shortcut fails" — one paragraph covers amide, aniline, pyrrole, ester and enolate, forward-references two chapters, and gives its rule only in the last sentence.
- [M][MISSING DIAGRAM] same paragraph — "a lone pair… moving into a p orbital and overlapping sideways" with the neighbouring π bond is never drawn. Needs amide N with its lone pair in a p orbital parallel to the C=O π.
- [M][MISSING DIAGRAM] Worked examples — counting groups (CH₃⁺, CH₃⁻, CH₃•) — shown only in words: the empty p perpendicular to a flat cation that can be attacked from either face, the pyramidal anion, and the nearly flat radical. The only figure covers CH₄/NH₃/H₂O.
- [M][MISSING DIAGRAM] Worked example — every atom in one molecule — acetonitrile, acetic acid and propenal are condensed formulas with atom-by-atom hybridization and claims like "linear" and "whole thing is flat". Needs each structure drawn with a hybridization label on every heavy atom.
- [L][CONFUSING] opening paragraph — lists five payoffs before any example.
- [L][CONFUSING] The shortcut you will actually use — the definition of "electron group" leans on "sigma bond", which is deferred to the next section.
- [L][MISSING DIAGRAM] Resolving the carbon paradox, 3rd para — the counterfactual "three bonds at 90° and one pointing in some fourth direction" is not shown next to the real tetrahedron.

### atomic-structure — notes (score 11)
- [H][CONFUSING] Ions: what "cation" and "carbocation" actually mean, 2nd para — one paragraph carries carbocation, carbanion, two forward references and the "carbon loses two, half-owner" argument, in very long multi-clause sentences. Its framing also conflicts with the lesson (see chemistry).
- [M][MISPLACED FIGURE] Ions — the sodium 2, 8, 1 paragraph comes after the carbocation figure, cut off from the cation definition it should illustrate. The general rule comes first and the concrete example comes last.
- [M][CONFUSING] Transfer or share, 3rd para — uses "electronegativity" three sections before it is defined, and the "not so short of a full shell" logic is muddled.
- [L][CONFUSING] opening paragraph — meta-commentary ("this chapter wearing a different hat") before any content.
- [L][CONFUSING] Isotopes and mass number, 2nd para — the kinetic isotope effect ("deeper vibrational well") is dropped in with no definitions and is a tangent.
- [L][CONFUSING] Shells and valence electrons, 2nd para — "p-block" and "d-block" are used before Orbitals defines them, plus an aside on IVA-style group numbers.
- [L][CONFUSING] Why valence electrons matter: the octet rule — the rule is stated before any atom is counted up to 8.

### bonding — notes (score 11)
- [M][MISPLACED FIGURE] Bond strength is not the same as reactivity — the cis/trans-2-butene figure sits here. The cis/trans paragraph it illustrates is at the end of "Bond length and strength".
- [M][MISSING DIAGRAM] Worked example — a C=C: propene — the claim that the CH₃ carbon, both alkene carbons and the three vinyl H are coplanar while the methyl H are not is in words only. Needs a perspective drawing of that plane.
- [M][MISSING DIAGRAM] Worked example — a C=O: propenal — "one continuous line of parallel p orbitals" across C=C–C=O is not drawn.
- [M][CONFUSING] Bond length and strength, "One word on what the Strength column measures" — one paragraph defines BDE, homolysis and heterolysis, then adds solvent effects and radical halogenation. That is several ideas, all off the section's point.
- [L][MISPLACED FIGURE] Bond length and strength — the "triple bond taken apart" figure opens this section. It belongs with the pi-bond section or the acetonitrile example.
- [L][MISSING DIAGRAM] Sigma bonds, 2nd para — sp³–s, sp³–sp³, sp²–sp² and sp–sp overlaps ("sp is shorter and fatter") are not drawn. The only sigma drawing is a generic one in the pi section.
- [L][CONFUSING] Common slip (triple bond) — one sentence nests an em-dash definition of "addition reaction" between "always… never" clauses.

### lewis-structures — notes (score 11)
- [H][MISSING DIAGRAM] Reading a condensed formula — the branches in (CH₃)₂CHOH and (CH₃)₃COH and the "awkward" CH₃COOCH₃ are explained only in words. Needs each condensed formula drawn beside its expanded structure.
- [M][MISPLACED FIGURE] The general-chemistry recipe… — the four-structure figure (ethanol, methylamine, acetic acid, methoxide) opens this section. It illustrates the valence-rule worked examples above it.
- [M][CONFUSING] Three real exceptions to the octet rule — the section mixes the three exceptions with "Four structures that are wrong". The wrong-structures figure comes before any text, and the text that explains it comes after a second figure.
- [M][CONFUSING] Expanded octets — two long paragraphs pile up the orbital count, the five-bond error, d-orbital history, atom size and ionic character.
- [L][MISSING DIAGRAM] Using formal charge as the tiebreaker — the losing CO₂ structure (one single and one triple bond, ±1) is described but not drawn.
- [L][CONFUSING] The method you will actually use — the four-step procedure and the "departure = charge" rule come before the first worked example.

### bonding — lesson (score 9)
- [H][MISSING DIAGRAM] step 1 "Sigma bonds hold; pi bonds lock" — head-on vs sideways overlap, p orbitals perpendicular to the axis, and why twisting breaks pi overlap are all words. Needs the sigma/pi overlap + rotation figure from the notes.
- [M][CONFUSING] step 1 — sigma, pi and bond-count notation all in one step.
- [M][WEAK FIGURE] step 2 "Click the line that blocks rotation" — the pi bond is drawn as a second stick "off to the side". That reinforces a wrong picture of pi as a separate off-axis line instead of density above and below the axis.
- [M][MISSING DIAGRAM] step 5 "Restricted rotation is why cis/trans exists" — no cis/trans pair is drawn.

### lewis-structures — lesson (score 9)
- [H][CONFUSING] step 1 "A recipe, not guesswork" — an octet recap, a five-part recipe and the formal-charge tiebreak, all before any example. The lesson teaches only the central-atom recipe, which the notes say fails for organic chains, so the student gets no method for CH₃CH₂OH.
- [M][CONFUSING] step 5 "The octet rule has real exceptions" — three exceptions, the period-2 orbital argument, d-orbital history and a definition of Lewis acid in one step.
- [M][MISSING DIAGRAM] step 5 — BF₃ with its empty orbital, PCl₅ and SF₆ are not drawn.
- [L][MISSING DIAGRAM] step 4 MCQ — the single/triple CO₂ alternative is compared in words only.
- [L][MISSING DIAGRAM] step 8 final — formaldehyde's connectivity is given in words only.

### functional-groups — lesson (score 9)
- [H][CONFUSING] step 2 "Seven groups share a C=O" — the carbonyl family, the ether/amine look-alikes and both degree-of-substitution rules are in one step.
- [H][MISSING DIAGRAM] step 2 — the seven carbonyl groups appear only as condensed formulas (RCOOR′ vs RCOR′). The notes' seven-panel carbonyl figure is not used.
- [M][CONFUSING] steps 8–9 (aspirin, acetaminophen) — "C6H4", "aromatic ring" and "phenol" are tested but never defined in the lesson.
- [L][MISSING DIAGRAM] step 4 tert-butylamine — the degree question has no structure drawn.

### formal-charge — notes (score 8)
- [M][CONFUSING] The formula — the formula and the bond-counting rules come before any worked example.
- [M][MISPLACED FIGURE] The built-in check — the nitromethane figure is here, one section after the nitromethane worked example it illustrates.
- [M][MISSING DIAGRAM] Why it matters: picking the right structure (diazomethane) — the two competing structures are written only as linear formulas. Needs both Lewis structures with lone pairs and charges drawn.
- [L][CONFUSING] Worked examples, nitromethane paragraph — one long paragraph holds the wrong structure, the octet argument, the arithmetic and the general lesson.
- [L][CONFUSING] Why it matters — the three ranking rules are listed before the diazomethane example.

### molecular-geometry — notes (score 8)
- [M][MISPLACED FIGURE] Drawing three dimensions on paper — the ethanol/acetic acid per-atom geometry figure opens this section. It belongs under "Reading geometry off an organic structure".
- [M][MISSING DIAGRAM] Reading geometry off an organic structure, 3rd para — the two open faces of a trigonal planar carbon (approach from above/below) vs a fully occupied tetrahedral carbon are not shown.
- [M][MISSING DIAGRAM] Beyond four groups — the axial and equatorial positions of the trigonal bipyramid and the octahedron are described in words only.
- [L][MISSING DIAGRAM] Reading geometry…, ethene paragraph — H–C–H 117° vs H–C=C 121° is not drawn.
- [L][CONFUSING] opening paragraph — forward references (enzyme mirror image, umbrella inversion) before any shape.

### orbitals — notes (score 7)
- [M][MISPLACED FIGURE] Why the periodic table has that stair-step shape — the energy-ladder figure (fill order, 4s below 3d) sits here. It illustrates the previous section, "Why the fill order is what it is".
- [L][MISSING DIAGRAM] Why the periodic table has that stair-step shape — no figure shows the s/p/d/f block layout this section describes (the lesson has one).
- [L][MISSING DIAGRAM] Why the fill order is what it is, 2nd para — penetration (an s electron spending time near the nucleus) is spatial and has no radial picture.
- [L][CONFUSING] Orbitals are the detailed picture of shells, 2nd para — "wavefunction", "antibonding" and "aromaticity" are used without definitions.
- [L][CONFUSING] What an orbital is — Pauli is stated as "same state" with no plain-words meaning of "state".
- [L][CONFUSING] stair-step section, "One immediate payoff" — the octet limit, the SF₆ exception and a tool plug share one paragraph.

### electronegativity — notes (score 7)
- [M][CONFUSING] What it is, 1st para — "ionization energy" and "electron affinity" are used as contrasts without definitions, plus a Pauling-scale parenthetical, all before any example.
- [M][MISSING DIAGRAM] Two traps, 1st para — CO₂'s opposed dipoles and CCl₄ cancelling "in three dimensions" have no figure on this page.
- [M][CONFUSING] The other way electronegativity shows up: induction, 2nd para — meta-commentary ("a labeled preview rather than a lesson"), with "pKa" and "resonance" undefined.
- [L][CONFUSING] induction, 1st para — the pKa drops (1.9, 1.6, 0.6) are quoted before the reader has seen the ladder.

### molecular-geometry — lesson (score 7)
- [H][WEAK FIGURE] steps 2, 3, 4, 9 (molSvg diagrams) — molSvg spaces groups evenly on a flat circle. CH₄ comes out as a flat plus sign at 90°, NH₃ as a flat T with the lone pair at 90°, and water bent at 90°, with atoms labeled "X" and "A". The drawings contradict the tetrahedral/pyramidal answers the steps teach.
- [M][MISSING DIAGRAM] step 7 "Beyond 4 groups" — axial vs equatorial and "seesaw" are words only.
- [L][CONFUSING] step 1 "Groups repel" — the rule and the hybridization link come before any example, and the shapes are described only in words.
- [L][MISSING DIAGRAM] step 8 "Lone pairs push harder" — the 109.5° → 107° → 104.5° compression is not shown.

### atomic-structure — lesson (score 6)
- [H][CONFUSING] step 8 "Ions: what cation and carbocation actually mean" — the step says a carbocation has six valence electrons, then says carbon "ends up one electron short… just like Na⁺". The notes say two short of an octet. A student builds a wrong or contradictory picture.
- [M][MISSING DIAGRAM] step 8 — carbocation (three bonds, empty orbital) vs carbanion (three bonds + lone pair) is words only. The notes' three-state figure is not used.
- [L][CONFUSING] step 7 "Atoms want a full outer shell" — the rule is stated with no atom counted to 8, and the step also defines the covalent bond.

### orbitals — lesson (score 6)
- [M][CONFUSING] step 3 "Why the fill order is 1s, 2s, 2p" — Aufbau/penetration, the 4s–3d crossover and Hund's rule in one step.
- [M][MISSING DIAGRAM] step 7 "Orbitals combine to make bonds" — describes one atom's orbital overlapping a neighbour's with no picture of the overlap.
- [L][CONFUSING] step 8 final — the feedback uses "degenerate", which the lesson never defines (it says "equal-energy").
- [L][CONFUSING] step 2 "periodic table is shaped" — an expanded-octet teaser with a forward reference interrupts the step about blocks.

### electronegativity — lesson (score 5)
- [M][CONFUSING] step 2 "It's not just which one wins" — Pauling values, three ΔEN bands and the ionic caveat stacked in one step.
- [M][CONFUSING] step 6 "The pull carries down the chain" — two unrelated ideas (induction; polar ≠ weak). It cites "the pKa ladder in the written section", which is not shown, and pKa is undefined.
- [L][MISSING DIAGRAM] step 1 — "increases up and to the right" has no periodic-table sketch (the notes have one).

### bond-polarity — lesson (score 5)
- [M][MISSING DIAGRAM] steps 3–4 (CO₂, water) and step 9 final (CCl₄) — cancelling vs adding dipole vectors in linear, bent and tetrahedral geometry is asked in words only. The only figure is a single C–O arrow.
- [L][CONFUSING] step 5 "Polarity is actually measurable" — the dipole-moment definition plus a recap of the ΔEN bands; two ideas.
- [L][MISSING DIAGRAM] step 6 — a hydrogen bond between a donor O–H and an acceptor lone pair on the next molecule is not drawn.
- [L][CONFUSING] step 8 "like dissolves like" — the rule is asserted without the reason, and its nonpolar example is weak (see chemistry).

### formal-charge — lesson (score 3)
- [M][CONFUSING] step 1 "Not every atom in a Lewis structure is neutral" — the formula comes before any example, and "Lewis structure" is used although that lesson comes after this one.
- [L][CONFUSING] step 6 "Formal charge tells you which structure is realistic" — "resonance structure" and "electrophile" are used undefined, with no example.

### bond-polarity — notes (score 2)
- [L][CONFUSING] Bond dipoles, 2nd para — the arrow convention plus organolithium/Grignard reactivity in one paragraph.
- [L][CONFUSING] Dipole moment: a measurable quantity — promises that "the next few paragraphs" explain water's solvent behaviour, but the payoff (hydrogen bonding) comes later and is never tied back.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- atomic-structure lesson step 8 — says the carbocation carbon "ends up one electron short and +1, just like Na⁺" right after saying it has six valence electrons. That is misleading: it is one short by formal-charge ownership but two short of an octet, and the notes say "two".
- atomic-structure notes, Transfer or share, 3rd para — says N, O and F are "not so short of a full shell that taking two or three whole electrons is cheap". F is one short and readily becomes F⁻, so the argument does not hold as written.
- orbitals notes, nitrogen paragraph — "The 2s pair… that is ammonia's lone pair". In NH₃ the lone pair is in an sp³-type hybrid (as the next section teaches), not a pure 2s orbital.
- hybridization notes, acetic acid example — calls the OH oxygen "nominally sp³", but the same page's rule (lone pair next to a π bond → sp²), applied to ester oxygens, makes it sp². This is internally inconsistent.
- lewis-structures notes, Expanded octets — "no exception anywhere in chemistry" to five bonds on carbon overclaims (CH₅⁺, hypercoordinate carbon). The safe claim is "never more than eight electrons".
- lewis-structures notes and lesson step 5 — list H₂SO₄, sulfoxides and sulfones as exceeding the octet while also endorsing the ionic (S⁺–O⁻) model, under which they do not. There is tension within one paragraph.
- formal-charge notes, diazomethane — "drawn that way on every reagent bottle". Diazomethane is not sold in bottles: it is made in situ, and TMS-diazomethane is the commercial reagent.
- functional-groups notes, "Two rows deserve a second look" — calls a nitro group drawn with a neutral four-bonded N "the five-bonded-carbon error in disguise". Per the Lewis page, that is the missing-charge error. The five-bond analogue is N with two double bonds.
- electronegativity lesson step 6 — says "move the chlorine three bonds away". The notes compare chloroacetic with 4-chlorobutanoic acid as "two bonds further". The counts disagree.
- bond-polarity lesson step 8 — gives CO₂ as a nonpolar substance water will not mix with. CO₂ is appreciably water-soluble (~1.5 g/L) and reacts with water, so it is a poor example.

## Chapter 3 — IUPAC Nomenclature (score 131)

### naming-substituents — lesson (score 19)
- [H][MISSING DIAGRAM] step 1 "A branch is an alkane minus one hydrogen" — propyl, isopropyl, butyl, sec-butyl, isobutyl and tert-butyl are described only in words ("attaches at the end of a three-carbon chain that carries a methyl on its middle carbon"). The notes' alkyl gallery with attachment dots is the missing figure.
- [H][MISSING DIAGRAM] step 4 "In a heptane, numbering from the left gives {2, 4, 5} and from the right {3, 4, 6}" — numbering direction with no drawn chain. Needs the heptane numbered both ways.
- [H][MISSING DIAGRAM] step 6 "The rules apply in a fixed order…", last para — the (2-methylpropyl) branch numbered from its own attachment point is described in words only. Needs the branch with its own 1-2-3 numbers in a second color (the notes' substituent-worked-pair figure).
- [H][MISSING DIAGRAM] step 8 "A heptane carries an ethyl on C3 and a methyl on C5…" — the alphabetical tie-break on numbering direction is asked with no drawing. Needs 3-ethyl-5-methylheptane numbered from both ends.
- [M][CONFUSING] step 2 "Every substituent gets its own number…" — the title covers only one of three ideas (halogen/nitro/alkoxy prefixes, multiplying prefixes, the locant self-check). The step opens on halogens.
- [M][MISSING DIAGRAM] step 2 — "a pentane with two methyls both on C2" (2,2-dimethylpentane) is not drawn. The point that two groups share a carbon needs the picture.
- [M][CONFUSING] step 6 — combines the three-rule ordering with a separate new concept (complex substituents) in one explain step.
- [L][MISSING DIAGRAM] step 5 "A heptane carries chloro at C5, ethyl at C4 and methyl at C2" — no structure. The numbered heptane from the notes figure would anchor it.

### naming-functional-groups — lesson (score 19)
- [H][MISSING DIAGRAM] step 4 "A six-carbon chain has an OH that can be reached at C2 from one end, and a methyl… from the other" — the numbering-direction question has no drawing. Needs hexane numbered both ways, with the OH and methyl marked.
- [H][MISSING DIAGRAM] step 5 "The longest chain… is eight carbons, but it does not pass through the carbon bearing the –OH" — asked with no drawing. The notes have exactly this figure (parent-must-contain).
- [M][CONFUSING] step 1 "One group gets the suffix…" — the rule comes with no concrete molecule. "A molecule with three…" stays abstract throughout the step.
- [M][MISSING DIAGRAM] step 2 "The priority order, in three blocks" — the ten groups are listed by name with no fragment drawings. The notes' principal-group-fragments figure is not used, and the student is never shown what each group looks like.
- [M][CONFUSING] step 2, para 3 — the oxidation-level caveat plus a reactivity claim is packed into one paragraph. It is off the main point, and the claim is wrong (see chemistry below).
- [M][MISPLACED/WEAK FIGURE] step 3 "Which group takes the suffix?" — the "molecules" are text ("A molecule containing both a ketone and an alcohol"), not drawings, so the step never tests recognizing groups in a structure.
- [M][CONFUSING] step 6 "Some locants are not written…" — three unrelated ideas: implicit C1 locants, e-dropping spelling, and ten retained common names given with no structures.
- [M][MISSING DIAGRAM] step 7 "A five-carbon chain has a carboxylic acid at one end, a ketone at C3 and a bromine at C4" — no drawing. The notes' keto-acid figure exists.
- [L][CONFUSING] step 8 feedback — the garbled sentence "history running the other way — the suffix was borrowed from acetone — not a derivation" has two dashes stacked mid-clause.

### naming-substituents — notes (score 18)
- [H][MISSING DIAGRAM] The order in which the rules apply, "Worked example — the one time the alphabet numbers the chain" — 3-ethyl-5-methylheptane, numbered from both ends, is described in words only. This is the only tie-break case, and it is the one that most needs a picture.
- [M][CONFUSING] Alkyl groups, para 2 — seven groups run together as one dot-separated sentence of words ("isobutyl … is a three-chain with a methyl, attached at the end") before the figure. It also contains the typo "tert-butyl (tert-butyl, systematically …)".
- [L][MISSING DIAGRAM] Alkyl groups — neopentyl (2,2-dimethylpropyl) is in the text list but missing from the six-group gallery.
- [M][MISSING DIAGRAM] Halogens and other simple prefixes, para 2 — isopropyl bromide, tert-butyl chloride and ethyl iodide are converted to systematic names with no structures. Where the Br or Cl sits is the point.
- [M][MISSING DIAGRAM] Multiplying prefixes, para 1 — 2,2-dimethylpentane (two methyls on one carbon) is not drawn.
- [M][CONFUSING] The order in which the rules apply — the three ordered rules come before either worked example.
- [L][MISPLACED/WEAK FIGURE] The order in which the rules apply — the alphabetize-filing figure sits under the rule-order heading. It belongs to the previous "Alphabetical order" section.
- [M][MISPLACED/WEAK FIGURE] Complex substituents — the substituent-worked-pair figure, whose left half is the 5-chloro-4-ethyl-2-methylheptane worked example, sits under "Complex substituents", well after the three-substituent worked example it illustrates. That example has no drawing next to it.
- [M][CONFUSING] Complex substituents, para 1 — packs three ideas into one paragraph: complex-branch numbering, a contrasting rule for simple -yl names, and the purpose of the parentheses. The middle sentence is garbled (see chemistry).
- [L][MISSING DIAGRAM] Alphabetical order — 4-ethyl-2-methylhexane and 4-ethyl-2,2-dimethylhexane are given as names only. One drawn example would tie the locants to positions.

### naming-rings-unsaturation — lesson (score 18)
- [H][MISSING DIAGRAM] step 2 "Ring or chain: whichever has more carbons", para 2 — "a hexane row with a =CH₂ on C3 is 2-ethylpent-1-ene" is stated with no drawing. The chain choice and renumbering are exactly what the notes' alkene-parent-contains figure shows.
- [M][CONFUSING] step 2 — four ideas in one step: ring vs chain, principal group overrides, the multiple-bond parent rule, and phenyl vs benzyl.
- [M][MISSING DIAGRAM] step 2, para 3 — phenyl vs benzyl ("phenyl plus a CH₂") has no drawing. The notes figure exists.
- [H][MISSING DIAGRAM] step 5 "A six-carbon chain has an OH at one end and a double bond at the other…" — numbering direction in words only. Needs hex-5-en-1-ol numbered both ways.
- [H][MISSING DIAGRAM] step 6 "Two forward references you will need later" — cis/trans (same or opposite side of the C=C) and ortho/meta/para (ring positions) are both purely spatial and have no figures. The notes have both.
- [M][MISSING DIAGRAM] step 4 "A four-carbon chain has its double bond between C2 and C3" — but-2-ene vs but-1-ene is not drawn or numbered.
- [L][MISPLACED/WEAK FIGURE] step 3 ring interaction — after the click, the ring is not numbered to show the {1,3} set that the feedback describes.
- [L][CONFUSING] step 1 "A ring parent gets cyclo-…" — the ring-numbering rule comes with no example before the interaction.
- [L][MISSING DIAGRAM] step 7 "A benzene ring carries two substituents directly across" — no ring drawn. This matters less once step 6 has a figure.

### naming-parent-chain — lesson (score 15)
- [H][MISSING DIAGRAM] step 4 "Two different paths through a molecule are both seven carbons long…" — the tie-break (single ethyl vs two methyls) is asked with no drawing. Needs a skeleton with both seven-carbon paths traced.
- [H][MISSING DIAGRAM] step 5 "Numbered from one end the substituents fall at 2, 3 and 6…" — the lowest-locant set comparison has no numbered chain. The {2,7,8} vs {3,4,9} decane in the feedback is also undrawn.
- [H][MISSING DIAGRAM] step 8 "A structure is drawn as a straight row of four carbons with an ethyl group hanging off the second one" — the question is about a drawing that is not shown. The feedback's route count ("two, plus one, plus two") needs a traced and numbered structure. The notes' ethyl-branch figure exists.
- [M][MISSING DIAGRAM] step 1 "A name is not chosen…" — 2-methylbutan-1-ol is dissected into prefix, root and suffix with no numbered structure showing where the 2 and the 1 sit.
- [M][MISSING DIAGRAM] step 7 "A six-carbon chain carries one methyl group. Counting from the left it sits on C3; from the right, on C4" — numbering direction with no drawing.
- [L][CONFUSING] step 2 "Rule 1…" — the rule and its trap are stated before the interaction that shows them.
- [L][MISPLACED/WEAK FIGURE] step 3 interaction — after the parent is traced, the SVG does not number it, so "a methyl on the third carbon" in the feedback is not shown.

### naming-rings-unsaturation — notes (score 15)
- [H][MISSING DIAGRAM] Double and triple bonds, "Worked example — a chain alkene, an alkyne, and one of each" — four numbering-direction problems (4-methylpent-2-ene, 4-methylpent-1-yne, pent-1-en-4-yne, pent-3-en-1-yne) are given only as condensed formulas (CH₃–CH=CH–CH(CH₃)–CH₃ …). Each needs a skeletal chain numbered from both ends.
- [M][MISSING DIAGRAM] Rings: the parent gets cyclo-, paras 2-3 — ring numbering with two or more substituents, and cyclohex-2-en-1-ol (OH at C1, C=C at C2–C3), have no drawing.
- [M][MISSING DIAGRAM] Ring or chain: which one is the parent? — methylcyclohexane vs a cyclohexyl-octane vs pentylcyclopentane are not drawn. The carbon count between ring and chain is the whole argument.
- [M][MISSING DIAGRAM] Double and triple bonds, para 1 — but-2-ene vs but-1-ene and penta-1,3-diene locants are given as words, with no numbered chain showing that the locant is the lower carbon of the pair.
- [M][MISSING DIAGRAM] The parent chain must contain the double bond, para 4 — hex-5-en-1-ol vs hex-1-en-6-ol (numbering direction when an OH and a C=C compete) is not drawn.
- [M][MISPLACED/WEAK FIGURE] Cis, trans, E and Z — a forward reference — the ring-numbering-direction figure (methylcyclohexene numbered both ways) sits under the cis/trans heading. It belongs with the "ring, a chain and a double bond" worked example above it.
- [L][CONFUSING] The parent chain must contain the double bond — the 2013 IUPAC caveat appears in the figcaption and again, almost verbatim, in the next paragraph.
- [L][MISSING DIAGRAM] Rings, para 4 — cis- and trans-1,2-dimethylcyclohexane (same face vs opposite faces) are mentioned with no drawing.

### naming-functional-groups — notes (score 14)
- [H][MISSING DIAGRAM] The principal group takes the lowest locant, para 3 — 5-methylhexan-2-ol vs 2-methylhexan-5-ol (OH vs methyl competing for the low number) has no numbered structure. This is the page's central numbering rule.
- [M][MISPLACED/WEAK FIGURE] The common names that never went away — the parent-must-contain figure (3-(hydroxymethyl)hexane vs 2-ethylpentan-1-ol) sits under the common-names heading. The paragraph it illustrates ("the parent chain must contain the principal characteristic group") is a section earlier and has no figure next to it.
- [M][MISSING DIAGRAM] The suffix each one takes, para after table — ethyl ethanoate is dissected into "which chain is on which oxygen" with only CH₃COOCH₂CH₃. Needs the ester drawn with the acid chain and the alkyl labelled.
- [M][MISSING DIAGRAM] The principal group takes the lowest locant, para 5 — cyclohexanecarboxylic acid and cyclohexanecarbaldehyde (group carbon outside the ring) vs cyclohexanone and cyclohexanol (carbon in the ring) are not drawn, though the contrast is spatial.
- [M][CONFUSING] The priority order, para 4 ("It is worth being clear about what this order is and is not") — the oxidation-level count, a parenthetical preview and a reactivity claim are stacked into one long paragraph, and the reactivity claim is wrong.
- [M][MISSING DIAGRAM] The common names that never went away — ten retained names (toluene, styrene, aniline, phenol, acetone…) are listed with no structures.
- [L][CONFUSING] Reading a name back into a structure — the figcaption's trailing paragraph and the next paragraph say the same thing ("read it from the end").

### naming-parent-chain — notes (score 13)
- [H][MISSING DIAGRAM] When two chains tie, paras 1-2 — the tie-break (two seven-carbon chains, one with an ethyl, one with two methyls) has no drawing.
- [H][MISSING DIAGRAM] Rule 2: number the chain to give the lowest locants, para 2 — {2,3,6} vs {2,5,6} is argued with no numbered heptane showing the two directions.
- [M][MISPLACED/WEAK FIGURE] When two chains tie — the parent-chain-trace figure (2-propylpentane vs 4-methylheptane) sits under the tie heading. It shows a hidden longer chain, not a tie, so the tie gets no picture and the figure is far from Rule 1.
- [M][MISSING DIAGRAM] opening paragraphs — 2-methylbutan-1-ol is split into prefix, root and suffix with no numbered structure.
- [L][MISSING DIAGRAM] Rule 2, "Worked example — one molecule, in order" — the 3-methylhexane figure numbers only one direction. The "from the right it is on C4" alternative is not shown.
- [L][CONFUSING] Rule 1, para 1 — a parenthetical introduces the methyl/ethyl/propyl branch names in the middle of the definition of "continuous".
- [L][CONFUSING] What carries forward — dense forward rules (principal group outranks length, multiple bonds by convention) with no example, stated as asides.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- naming-functional-groups notes (The priority order, para 4) and lesson step 2 — claims that within the derivative block the priority order "runs in the same direction as reactivity". It does not: the page itself ranks acyl chloride below ester (and anhydride below acid), yet acyl chloride > anhydride > ester > amide in reactivity. "What carries forward" repeats the claim.
- naming-substituents notes, Complex substituents para 1 — "A simple systematic -yl name … gives the free valence the lowest locant available, which is why the isopropyl group is propan-2-yl and not propan-1-yl" is garbled. Propan-1-yl is a different group (propyl), not a misnumbering of isopropyl.
- naming-substituents notes (Halogens) and lesson step 2 — "nothing outranks them [halogens]" is false once a principal group or a C=C/C≡C is present. Both take the low locant first.
- naming-rings-unsaturation notes, Rings para 3 — "With two or more, the first-cited one is usually C1" is misleading. The lowest locant set decides first, and alphabetical order only breaks an exact tie.

## Chapter 12 — Carbonyl Chemistry (score 116)

### aldehydes-ketones — notes (score 11)
- [H][MISSING DIAGRAM] "Two sites, two kinds of reactivity" (Bürgi–Dunitz paragraph) — the ~107° approach, the π* lobe on carbon and the substituents folding back are pure geometry, and no figure shows the angle.
- [M][CONFUSING] "Two sites" — the first figure's caption says every mechanism starts "attacking this carbon perpendicular to that plane", while the prose two paragraphs later says the attack is "not straight down" but tilted to 107°. They contradict each other.
- [M][MISSING DIAGRAM] "Conjugation and the alpha carbon" — the enone resonance form with + on the β carbon, and the position of the α hydrogens, are given only in words.
- [L][MISPLACED/WEAK FIGURE] "Structure: a polarized, planar, sp² carbon" has no figure. The two-view formaldehyde figure showing planarity sits under the next heading.
- [L][MISSING DIAGRAM] "Structure" — the neutral and charge-separated resonance structures are described but never drawn.
- [L][CONFUSING] "Aldehydes are more reactive than ketones" — the caption, its continuation and the prose each restate "two effects point the same way".
- [L][CONFUSING] "Where they come from" — a dense chain of back/forward references to four other chapters.

### nucleophilic-addition — notes (score 10)
- [H][CONFUSING] "The universal mechanism", paragraph "Three species are worth naming" — one paragraph carries protonation, two resonance contributors, which one is attacked, the different arrow counts for each, a pointer to two figures, and proton bookkeeping.
- [M][CONFUSING] opening paragraphs — "One note on what is borrowed" is a full paragraph of meta-commentary before the mechanism.
- [M][MISSING DIAGRAM] "Grignard and organolithium addition" worked example (2-phenylbutan-2-ol) — it says "Draw it first" but draws nothing. The three disconnections are condensed formulas only.
- [L][CONFUSING] "Hydride reduction" — it says NaBH₄ in methanol gets its proton from the solvent, then insists on writing a separate H₃O⁺ step. That is a mixed message about what actually happens.
- [L][CONFUSING] "The universal mechanism" last paragraph — the protonate-or-collapse fork repeats the first figure and its caption.
- [L][CONFUSING] "Other additions worth knowing" — the Wittig sentence stacks add, eliminate, alkene, control and popularity into one clause chain.

### nucleophilic-addition — lesson (score 10)
- [H][CONFUSING] step 3 "Which reagent reduces esters and amides…" — no step introduces NaBH₄ or LiAlH₄ before this question tests their selectivity.
- [M][MISSING DIAGRAM] step 1 "Every nucleophilic addition follows the same two-step pattern" — the sp²→sp³ geometry change and the tetrahedral alkoxide are described. The only drawing is plain acetaldehyde.
- [M][MISSING DIAGRAM] step 6 "Amines add, then eliminate water" — C=N vs a C=C to "an adjacent carbon" is spatial and not drawn.
- [M][CONFUSING] step 6 — imine, enamine, a forward pattern and a meta aside share one step.
- [L][CONFUSING] step 4 "Grignard and organolithium reagents…" — long sentences with nested parentheticals.

### hydrates-cyanohydrins — notes (score 9)
- [M][MISPLACED/WEAK FIGURE] "Why the hydrate matters even when it is the minor species" — the percent-hydrate bar chart sits here, not in "Hydrates: addition of water" with the table it plots.
- [M][MISSING DIAGRAM] "Hydrates" (cyclopropanone paragraph) — the 60° ring angle vs 120° sp² vs 109.5° sp³ argument has no figure.
- [M][CONFUSING] "Cyanohydrins" (reagent paragraph) — the buffer, the pKa, why neither HCN nor CN⁻ works alone, and the catalytic cycle are all stacked in one paragraph.
- [M][CONFUSING] "Cyanohydrins" (retrosynthesis paragraph) — one sentence with nested dashes lists three other one-carbon extensions, all from other chapters.
- [L][CONFUSING] opening paragraph and "Why the hydrate matters" — a parenthetical aside, then forward references (Jones/PCC "next chapter", glucose) before the section's own point.

### acetals — notes (score 9)
- [M][MISSING DIAGRAM] "Driving it either way" — the cyclic acetal from ethylene glycol (1,3-dioxolane) is named but not drawn.
- [M][MISSING DIAGRAM] "Driving it either way" worked example ("using a protecting group") — the molecule exists only as "a ketone and an ester". No structures are shown through protect/react/deprotect.
- [M][MISSING DIAGRAM] "The exception that runs your metabolism" — glucose ring closure, the anomeric carbon, α/β anomers and the glycoside link are all spatial, and there is no figure.
- [L][MISSING DIAGRAM] "Step two: loss of water gives an oxocarbenium ion" — "the lone pair donates directly into the empty p orbital" is an orbital-overlap claim. The figures show only resonance forms.
- [L][CONFUSING] "Step one" — the hemiketal/ketal vocabulary paragraph interrupts the mechanism.
- [L][CONFUSING] "The exception that runs your metabolism" — in "The difference between the two is which anomer was used" the referent (starch vs cellulose) is unclear.

### imines-enamines — notes (score 9)
- [M][MISPLACED/WEAK FIGURE] "Why the pH has to be about 4.5" — the imine-or-enamine branch figure belongs under "Two amines, two endpoints" and duplicates the mechanism figure there. The pH section gets no figure of its own.
- [M][CONFUSING] "The enamine is a nucleophile at carbon" — the enolate table and the Stork paragraphs lean on LDA, lithium enolates and over-alkylation from a chapter several chapters ahead.
- [M][MISSING DIAGRAM] "The enamine is a nucleophile at carbon" (Michael paragraph) — 1,2 vs 1,4 addition on an α,β-unsaturated carbonyl is positional and not drawn.
- [M][CONFUSING] "Imines elsewhere" — one paragraph covers reductive amination, oximes, hydrazones, Wolff–Kishner, Clemmensen and Friedel–Crafts.
- [L][CONFUSING] "Two amines, two endpoints" — the benzophenone exception is tacked onto the end of the mechanism explanation.

### wittig-reaction — notes (score 9)
- [H][MISSING DIAGRAM] "Geometry, which is the one thing it does not fully control" — Z vs E products and cis- vs trans-oxaphosphetane are described in words only. It needs both oxaphosphetanes and the alkenes they give.
- [M][MISPLACED/WEAK FIGURE] "Geometry" — the figure here shows endocyclic vs exocyclic regiochemistry (Zaitsev vs Wittig), which belongs under "Why it beats an elimination". It invites confusing regiochemistry with E/Z.
- [M][MISSING DIAGRAM] "Why it beats an elimination" worked example ((3-methylbut-1-en-1-yl)benzene) — the disconnection, both assignments and the halides are condensed formulas only.
- [L][CONFUSING] "The reaction itself" — the betaine parenthetical breaks the one-motion mechanism description mid-stream.
- [L][MISSING DIAGRAM] "The phosphonate variant" — the phosphonate is given only as a condensed formula.

### wittig-reaction — lesson (score 9)
- [H][MISSING DIAGRAM] step 2 "Making the ylide: an S_N2, then a deprotonation" — the ylide, the [2+2] and the four-membered oxaphosphetane are described with no drawing, and the lesson has none anywhere.
- [M][CONFUSING] step 2 — the SN2, the deprotonation, the ylide definition, the halide limitation and the whole reaction are packed into one step.
- [M][MISSING DIAGRAM] step 5 "Cyclohexanone is treated with Ph₃P=CH₂" — exocyclic vs endocyclic alkene is not drawn.
- [M][MISSING DIAGRAM] step 6 "Connectivity is certain; geometry is not quite" — the cis/trans outcomes are not drawn.

### aldehyde-oxidation — lesson (score 9)
- [M][CONFUSING] step 1 "One hydrogen decides the whole section" — "How fast air alone does it tracks that same hydrogen: … access to it is what varies" is a tangled sentence, and the step also previews alcohol oxidation.
- [M][MISSING DIAGRAM] step 2 "The oxidant never touches the carbonyl" — the gem-diol's "O–H and C–H on the same carbon" is structural and not drawn.
- [M][CONFUSING] step 3 (Visualize, positive or negative) — Fehling's, Benedict's, hemiacetal opening, glycosidic bond and anomeric carbon are all tested before any step introduces them. The teaching arrives only in the answer text.
- [M][MISSING DIAGRAM] step 5 "Glucose is drawn as a ring…" — the hemiacetal ring opening to the aldehyde is not drawn.
- [L][CONFUSING] step 8 (final) — the feedback proposes an acid-hydrolysis follow-up with sucrose that does not fit a compound already testing positive.

### aldehyde-oxidation — notes (score 8)
- [M][MISPLACED/WEAK FIGURE] "Tollens' reagent and the silver mirror" — the aldehyde→hydrate→acid figure belongs under "What is actually oxidized is the hydrate".
- [M][MISSING DIAGRAM] "Why glucose tests positive and sucrose does not" — ring opening, the anomeric carbon and sucrose's glycosidic bond tying up both anomeric carbons are spatial and have no figure.
- [M][CONFUSING] "Why glucose tests positive and sucrose does not" — "free anomeric carbon", "glycosidic bond" and "enediol" are used without plain definitions or a link to where they are taught.
- [L][MISSING DIAGRAM] "The consequence on the shelf" — the three radical-chain steps are given as condensed formulas with no arrows.
- [L][CONFUSING] "Tollens' reagent" figure caption — it repeats the glucose argument two sections before the glucose section.

### hydrates-cyanohydrins — lesson (score 7)
- [M][CONFUSING] step 4 "Two chromium(VI) reagents the next chapter will formalize" — Jones and PCC are tested without being introduced. The explanation lives only in the feedback.
- [M][MISSING DIAGRAM] step 6 "The one in this set that builds a molecule" — the α-hydroxy acid vs β-amino alcohol labels (which the notes call "where this gets marked wrong") are neither drawn nor explained.
- [M][CONFUSING] step 6 — the cyanohydrin chemistry and the bisulfite purification share one step.
- [L][MISSING DIAGRAM] step 2 "Two causes, and a third once a ring is attached" — the small-ring strain reversal is stated without a picture.

### imines-enamines — lesson (score 7)
- [M][MISSING DIAGRAM] steps 1–2 "The first step is never in doubt" / "One hydrogen left, or none" — the carbinolamine, the iminium and "the α carbon on the other side of the C=N⁺" are never drawn, and the lesson has no structures.
- [M][MISSING DIAGRAM] step 6 "And now the reason the enamine matters" — the enamine's second resonance structure is described only.
- [M][CONFUSING] step 6 — the enolate preview, the enolate/enamine comparison and the Stork synthesis all share one step.
- [L][CONFUSING] step 4 "Why is imine formation run near pH 4.5" — the pH rationale is tested before it is taught (it appears only in the feedback).

### acetals — lesson (score 6)
- [M][MISSING DIAGRAM] steps 1–2 "A hemiacetal is one alcohol addition away…" / ordering task — the mechanism is never drawn. The ordering exercise is text-only.
- [M][MISSING DIAGRAM] step 4 "The oxocarbenium ion is a carbocation stabilized…" — the lone pair donating into the empty p orbital has no picture.
- [L][CONFUSING] step 4 — the forward reference to the Friedel–Crafts acylium ion assumes unknown material.
- [L][CONFUSING] step 6 "Acetals are protecting groups" — it closes on one very long sentence.

### aldehydes-ketones — lesson (score 3)
- [M][MISSING DIAGRAM] step 1 "A carbonyl is a heavily polarized, alkene-like pi bond" — the charge-separated resonance structure and the trigonal-planar geometry are described. The step 2 drawing is a bare C=O with no δ labels.
- [L][MISSING DIAGRAM] step 4 "Aldehydes are more reactive than ketones" — the one-H vs two-alkyl crowding is not drawn.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- aldehydes-ketones notes, first figure caption ("attacking this carbon perpendicular to that plane") — this contradicts the Bürgi–Dunitz ~107° trajectory stated in the same section.
- imines-enamines lesson, step 8 feedback ("a second alkylation is not slow, it is impossible") — this contradicts the notes ("a minor side reaction at most"). Proton transfer from the iminium to unreacted enamine does allow some dialkylation.
- imines-enamines notes, Michael paragraph ("a full enolate often adds 1,2 instead") — this is overgeneral, because stabilized enolates add 1,4 routinely.
- wittig-reaction notes and lesson step 6 — E-selectivity of stabilized ylides is attributed to reversible oxaphosphetane formation and equilibration. Current mechanistic work (Vedejs; Aggarwal/Harvey) favors kinetic control for both classes under Li-free conditions. This is contested; suggest an entry in needs-author rather than an unqualified claim.
- aldehyde-oxidation lesson, step 1 ("a crowded carbonyl slows the chain") — an unsupported claim about autoxidation rates.

## Chapter 16 — Enolate Chemistry (score 114)

### michael-robinson — notes (score 15)
- [H][MISSING DIAGRAM] Working backwards from a cyclohexenone / Worked example (2-methylcyclohexane-1,3-dione + MVK) — the Michael adduct, the choice between fused and bridged bicyclo[3.3.1] closure, the ring fusion, the angular methyl and where the C=C lands are all given only in words. Needs a figure: dione, then adduct with the –CH2CH2COCH3 arm on C2, then the six-atom loop closing onto the ring C=O, then the Wieland–Miescher ketone.
- [H][MISPLACED/WEAK FIGURE] The Michael reaction (robinson-mechanism figure) — the "Robinson annulation" is drawn with diethyl malonate as the donor. The malonate/MVK adduct has no second ketone for an aldol, so panels 4–5 (aldol, then dehydration to a cyclohexenone) are not a reaction that adduct can do. Use a ketone or 1,3-diketone donor (see Chemistry below).
- [M][CONFUSING] The Michael reaction, donor paragraph — one sentence defines "soft", brings in LUMO coefficients (LUMO is never defined) and chains four clauses to explain 1,4 selectivity.
- [M][MISPLACED/WEAK FIGURE] Why a doubly stabilized donor — the aldol/Claisen/Michael spacing figure sits under this heading, but it illustrates the "Recognize the product by counting" paragraphs above it.
- [M][CONFUSING] Worked example step 3 ("Choose the aldol partners") — one very long paragraph that counts two different six-atom loops and makes the bridgehead-alkene argument, all in prose.
- [M][MISSING DIAGRAM] Working backwards from a cyclohexenone — the three retro steps (rehydrate, break the α–carbinol bond, cut β to a carbonyl) are bond cuts described in words. A cyclohexenone with each cut marked is needed.
- [L][CONFUSING] opening paragraph — states the general rule (the nucleophile decides 1,2 vs 1,4) before any example.

### michael-robinson — lesson (score 12)
- [H][MISSING DIAGRAM] step 2 "This is the single most useful pattern" — the lesson says to count the carbons between the two oxygen-bearing carbons, but no structure is shown anywhere in it. The notes' condensation-spacing figure (aldol/Claisen/Michael, numbered) belongs here.
- [H][MISSING DIAGRAM] step 6 "The Robinson annulation is a Michael addition…" — the α′-carbon-to-far-carbonyl closure and the six- versus four-atom ring count are spatial and given only in words. Draw the 1,5-dicarbonyl with its atoms numbered and the forming bond marked.
- [M][CONFUSING] step 3 "Which reaction made each of these?" — the prompt says "count the gap between them", but each row gives only a class name ("A 1,5-dicarbonyl"). There is nothing to count, so the exercise is just matching names.
- [M][CONFUSING] step 1 "You have seen that an α,β-unsaturated carbonyl…" — "soft" is given as the reason for 1,4 addition but never defined in plain words.
- [M][CONFUSING] step 6 — "α′ carbon" is used without being defined, and one step carries three mechanism stages, the reason for MVK, and the ring-size argument.

### ester-syntheses — notes (score 11)
- [M][MISSING DIAGRAM] Malonic ester synthesis → a carboxylic acid — the whole sequence is given only in condensed formulas: malonate, then the alkylated diester, then the diacid, then the acid. Nothing shows which carbon gets R or which carboxyl leaves.
- [M][MISSING DIAGRAM] Malonic ester synthesis, 1,4-dibromobutane paragraph — the two alkylations closing a ring, and the count of ring atoms, are given only in words. Draw malonate, then the bromobutyl intermediate, then the cyclopentane diester.
- [M][CONFUSING] Malonic ester synthesis, "Reading it backwards" — the abstract bond-cutting instruction comes before the worked example that makes it concrete, and its sentences are long.
- [M][MISPLACED/WEAK FIGURE] Malonic ester synthesis — the pKa-scale figure sits under this heading but illustrates "Why two carbonyls".
- [M][CONFUSING] Acetoacetic ester synthesis → a methyl ketone — the section is rule-only. It has no worked example and no drawing of which acetoacetate carbons end up in R–CH2–CO–CH3.
- [L][CONFUSING] opening paragraphs — the general strategy and the term "activating group" come before any compound is named.

### claisen — lesson (score 9)
- [H][MISSING DIAGRAM] step 6 "Intramolecular Claisen (Dieckmann)" — ring closure is described with no substrate and no drawing. Show diethyl adipate numbered C1–C6, the C2 enolate attacking C6, and the five-membered β-ketoester.
- [M][CONFUSING] step 6 — the whole step is one ~70-word sentence giving a rule with no concrete example.
- [M][MISSING DIAGRAM] step 1 "The Claisen condensation starts identically…" — the β-ketoester product and the new C–C bond are described in words. The only drawing is the ethyl acetate starting material.
- [M][MISSING DIAGRAM] step 4 "A doubly-acidic proton" — "an alpha hydrogen flanked by two carbonyls" is not drawn. Show ethyl acetoacetate with the CH2 marked and the charge spread onto both oxygens.

### alpha-hydrogens — notes (score 8)
- [M][MISSING DIAGRAM] Two carbonyls do it again — the three contributors of the pentane-2,4-dione anion (charge on C, on the left O, on the right O) and the planar O–C–C–C–O system are described only in words.
- [M][CONFUSING] Worked example — find the alpha hydrogens — four structures are given only as condensed formulas (e.g. (CH3)3CCHO, CH3CO2CH2CH3). The student has to build each skeleton to see which carbons touch the C=O. Drawings with the α carbons marked are needed.
- [M][MISSING DIAGRAM] What enolates do, racemization paragraph — the stereocenter flattening to a planar sp² enolate, with the proton returning to either face, is spatial and has no figure.
- [L][MISPLACED/WEAK FIGURE] Why: delocalization into the carbonyl — two back-to-back figures draw the same enolate resonance pair with overlapping captions, before the prose explains it.
- [L][CONFUSING] The enol tautomer, "Both catalysts reach the enol…" — one paragraph carries the acid route, the base route and a general ordering rule. Only the base route is drawn.

### aldol — lesson (score 8)
- [M][MISSING DIAGRAM] step 1 "An enolate attacking a second carbonyl…" — where the new C–C bond forms and why the OH ends up on the β carbon are given in words. The only drawing is acetone. Show the enolate plus a second carbonyl giving a β-hydroxy carbonyl numbered C1–C3.
- [M][CONFUSING] step 1, second paragraph — one sentence stacks three mechanism steps plus the definition of the product.
- [M][MISSING DIAGRAM] step 4 "Heat drives dehydration" — which H leaves (α), which OH leaves (β) and where the new C=C forms are not drawn.
- [M][CONFUSING] step 6 "Crossed aldol reactions" — a single ~110-word box holds two strategies, a restatement of what LDA is, and a forward reference to Aromatic Chemistry.

### enolate-regiochemistry — lesson (score 8)
- [H][MISSING DIAGRAM] step 1 "Form the enolate is a question" — the two α carbons of 2-methylcyclohexanone and the positions of the two enolate C=C bonds are given only in words. The lesson has no drawing at all; the notes' kinetic/thermodynamic figure would fit here.
- [M][CONFUSING] step 6 "The same switch you already met" — two unrelated ideas share one step: the allylic-cation analogy (from a chapter not shown) and the enamine.
- [M][MISSING DIAGRAM] step 6 explain-box — where the enamine C=C forms, and why the substituted isomer twists the N lone pair out of line, is spatial and not drawn.
- [L][CONFUSING] step 3, row k3 explanation — says "the row below shows what goes wrong", but the row below is NaH. The row meant is the LDA-then-warm row, two rows further down.

### ester-syntheses — lesson (score 8)
- [H][MISSING DIAGRAM] step 2 "Same three steps; the starting material picks the product" — the lesson has no structure at all. Malonate, acetoacetate and their products appear only as condensed formulas, so which carbonyl is lost and where R lands has to be built mentally.
- [M][MISSING DIAGRAM] step 4 feedback "the geometry is the whole explanation" — the six-membered cyclic transition state is described in words. The notes' decarboxylation figure fits here.
- [M][CONFUSING] step 1 "A carbonyl put there to be thrown away" — an abstract three-step rule and the term "activating group" come before any compound is shown.
- [L][CONFUSING] step 7 wrongFeedback — tells the student to check which halide each target needs. The correct answer turns on how many acidic hydrogens there are, not on the halide type.

### enolate-regiochemistry — notes (score 7)
- [M][MISPLACED/WEAK FIGURE] The same switch, one step earlier — the figure repeats the 2-methylcyclohexanone kinetic/thermodynamic figure already shown above. The prose under this heading is about the allylic-cation (1,2 vs 1,4) analogy, which is not shown.
- [M][MISSING DIAGRAM] The third option: don't use an enolate — the enamine's C=C forming toward the less substituted side, and the allylic-strain twist of the N lone pair, are spatial and have no figure.
- [M][CONFUSING] The third option — the first paragraph is one long recap sentence. The second carries nucleophilicity, regiochemistry, the A(1,3)-strain argument and a three-way comparison.
- [L][MISSING DIAGRAM] Why the halide goes to carbon — C- versus O-alkylation products (ketone vs enol ether) are described only in words.

### aldol — notes (score 6)
- [M][MISSING DIAGRAM] Worked example — reading an enone backwards — the retro-aldol disconnection (put water back, cut the α–β bond) is done in condensed formulas only. Draw the target with the cut bond and the two partners.
- [L][MISPLACED/WEAK FIGURE] Aldol condensation: heat pushes further — the first figure re-draws the whole aldol addition, which is already drawn twice above. The section's own content, E1cb, has its own figure.
- [L][CONFUSING] Aldol condensation, E1cb paragraph — the mechanism, the expanded name and the leaving-group argument share one paragraph, and the name comes after the mechanism.
- [L][MISSING DIAGRAM] Crossed aldols and why they need control — the "four products" are listed only in words. A 2×2 grid would show them.
- [L][CONFUSING] Conjugate addition — "hard/soft" is defined only through examples, and the paragraph forward-references Michael, Robinson and ortho/para.

### claisen — notes (score 6)
- [M][CONFUSING] Why the final deprotonation drives everything, "A Claisen requires two alpha hydrogens" — the rule, the reasoning and an exam aside come first, and the concrete example (ethyl propanoate vs ethyl 2-methylpropanoate) comes last.
- [M][MISSING DIAGRAM] Worked example — cyclohexanone with diethyl carbonate — which ring carbon gets the CO2Et, and the product, are given only in words.
- [L][MISPLACED/WEAK FIGURE] Why the final deprotonation drives everything — the second figure re-draws the whole Claisen with generic R groups and duplicates the first figure. Only its last panel matches the heading.
- [L][CONFUSING] opening paragraph — meta-commentary ("a good final illustration…") before any example.

### alpha-halogenation — notes (score 6)
- [M][MISPLACED/WEAK FIGURE] The haloform reaction — the first figure (two columns: acid stops, base keeps going) sits under the haloform heading. It belongs under "Base: through the enolate, and it runs away".
- [M][MISSING DIAGRAM] Which α carbon takes the halogen? — which carbon of 2-methylcyclohexanone gets Br under acid versus base is given in words only.
- [L][CONFUSING] opening paragraph — gives the whole conclusion (acid stops after one, base runs away) before any example.
- [L][CONFUSING] Base: through the enolate, second paragraph — the "one substituent effect" contrast and a separate point (acid is catalytic, base is consumed) share one paragraph.

### alpha-hydrogens — lesson (score 5)
- [M][CONFUSING] step 1 "The carbon bonded directly to a carbonyl carbon…" — the definition and the resonance argument come before any concrete molecule, in long sentences. No drawing marks the α carbon.
- [M][MISSING DIAGRAM] step 3 "Enol and keto are tautomers" — the keto (C=O, C–H) and enol (C=C–OH) structures are described only in words. Draw acetone and its enol side by side with the moved H marked.
- [L][CONFUSING] step 5 explain-box — one long box stacks the equilibrium position, the bond-strength reason and the "reactivity always goes through the enol" claim.

### alpha-halogenation — lesson (score 5)
- [M][CONFUSING] step 1 "One substituent effect, read in two directions" — gives the abstract rule with no concrete substrate. Acetophenone does not appear until the interactive step.
- [M][MISSING DIAGRAM] final challenge feedback — the answer depends on where the methyl sits (on C2, not on the carbonyl). Draw 2-methylcyclohexanone next to a methyl ketone with the α carbons marked.
- [L][MISSING DIAGRAM] step 2 "Runaway halogenation, put to work" — the CX3 build-up and the tetrahedral collapse are words only. The notes' haloform figure could be reused.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- michael-robinson notes, robinson-mechanism figure — the donor is diethyl malonate. Its MVK adduct (EtO2C)2CH–CH2CH2COCH3 has no second ketone or aldehyde to take an aldol, so panels 4–5 (aldol, then dehydration to a cyclohexenone) cannot happen. Ring closure onto an ester would be a Claisen-type acylation giving a 1,3-dione, not a β-hydroxy ketone. A ketone or 1,3-diketone donor (cyclohexanone, 2-methylcyclohexane-1,3-dione) is the standard Robinson case.
- enolate-regiochemistry notes — internal contradiction. The prose says diisopropylamine (pKa ~36) is too weak an acid to shuttle protons, so a lithium enolate "keeps its regiochemistry". The caption of the second figure says "the amine the base generated shuttles it, which is what erodes a lithium enolate on warming". The lesson's rows k3/k6 lean on trace ketone instead. Pick one explanation.
- enolate-regiochemistry notes, Worked example Route B — NaOEt/EtOH then CH3I is presented as giving 2,2-dimethylcyclohexanone cleanly. In practice, alkylation under alkoxide/alcohol equilibrium gives mixtures, polyalkylation and aldol side products, and the product ratio need not mirror the enolate population. It is worth a hedge.
- alpha-hydrogens notes ("roughly 10⁶ to one") and lesson step 5 ("10⁶:1") — the measured keto/enol ratio for acetone is about 10⁸ (pK_E ≈ 8.3), so the figure is understated by about 100×. The notes figure's "99.9999%" has the same problem.
- claisen lesson, step 5 correctFeedback — "doubling the number of carbonyls roughly doubles the resonance stabilization" is not a meaningful or correct quantitative claim. The drop is about 9 pKa units, and it does not scale that way.
- ester-syntheses lesson, step 4 option and final feedback — they call the substituted malonic acid a "β-keto acid". The notes correctly call it a 1,3-diacid that shares the six-membered transition state.

## Chapter 7 — How Reactions Happen (score 113)

### carbocations — lesson (score 15)
- [H][MISSING DIAGRAM] step 1 "Three bonds, no lone pair, six electrons" — describes trigonal planar sp² carbon, empty p orbital above and below the plane, and flattening from sp³; the lesson has no figure at all. Needs the notes' carbocation-anatomy drawing (top view plus edge-on view with the empty p lobes).
- [H][MISSING DIAGRAM] step 6 "Resonance beats substitution — and two cations never form" — the vinyl and aryl argument is purely about orbital direction (empty p at right angles to the π; in-plane sp² hybrid against the ring's π cloud). Needs an orthogonal-orbital drawing; without it the step 7 phenyl-cation MCQ is guesswork.
- [H][MISSING DIAGRAM] step 8 "If a better cation is one move away" — teaches where the 1,2-shift arrow's tail goes (on the migrating bond) with no drawing of the arrow or of the before and after cations.
- [M][MISSING DIAGRAM] step 4 "Alkyl groups help: 3° > 2° > 1° > methyl" — hyperconjugation needs "a C–H bond parallel to the empty p orbital" to be seen; show the σ→p overlap picture.
- [M][CONFUSING] step 6 — one step carries three separate ideas (allylic/benzylic resonance, heteroatom lone-pair donation with oxocarbenium/iminium, and the vinyl/aryl exclusions). Split it.
- [L][MISSING DIAGRAM] step 2 "Two ways one appears" — which alkene carbon takes the proton and which becomes the cation is given only in words.
- [L][CONFUSING] step 9 final (neopentyl) — both the substrate and the answer are condensed formulas only ((CH₃)₃C–CH₂⁺ → (CH₃)₂C⁺–CH₂CH₃), so the student has to build the methyl shift in their head.

### radical-halogenation — lesson (score 14)
- [M][CONFUSING] step 1 "Alkanes are defined by what they will not do" — one step stacks alkane inertness, reaction conditions and the bromine-water aside, then introduces homolysis, radicals and fishhook arrows.
- [M][MISSING DIAGRAM] step 1 — homolysis versus heterolysis and the single-barbed fishhook arrow are described but never drawn; the lesson has no figure.
- [M][MISSING DIAGRAM] step 6 "The sluggish reagent is the selective one" — early/late transition states (Hammond) and the planar radical attacked on either face are both spatial and neither is drawn. Needs the two energy profiles and a planar radical with a p orbital.
- [M][CONFUSING] step 6 — three ideas in one step (Hammond selectivity, statistical H-counting correction, racemization at a planar radical).
- [M][CONFUSING] step 7 MCQ "allylic position ... NBS rather than Br₂" — allylic bromination, "allylic" and NBS are never taught in any explain step. The question tests material the lesson never covered.
- [M][MISSING DIAGRAM] step 8 final "2-Methylbutane, (CH₃)₂CHCH₂CH₃" — the student must sort 12 H into 1°/2°/3° sets from a condensed formula. The feedback also uses a 2° bromination rate (80) the lesson never gave. Needs a skeleton with the H sets marked.
- [L][CONFUSING] step 1 "Nothing in the first eight chapters attacks an alkane" — this is chapter 7, so the reference is wrong.
- [L][MISSING DIAGRAM] step 2 "Three stages" — initiation, propagation and termination are only in prose and list form; the notes' chain-cycle figure would anchor it.

### energy-diagrams — lesson (score 13)
- [H][MISSING DIAGRAM] step 1 "One picture, two axes, two heights" — the whole step describes a picture (axes, plateaus, peak, ΔG° against ΔG‡ measured from different places) and the lesson contains no diagram at all.
- [H][CONFUSING] step 6 MCQ "TS1 is 18 ... intermediate 14 ... TS2 is 22" — the lesson never taught how to pick the rate-determining step before asking. The keyed rule (highest TS wins when the intermediate reverts faster) directly contradicts the notes' rule ("biggest climb from the valley in front of it"), which is offered here as distractor A.
- [M][MISSING DIAGRAM] step 4 "A transition state is a peak. An intermediate is a valley." — counting humps and valleys, and the TS drawn in brackets with ‡, need a two-step profile and a drawn TS next to a drawn intermediate.
- [M][MISSING DIAGRAM] step 7 "Two ways to go faster" — catalyst lowering the peak with both plateaus unchanged, drawn on the same axes, is the standard figure and is absent.
- [M][MISSING DIAGRAM] step 9 "The Hammond postulate" — early versus late transition state is a statement about position along a curve; show the two profiles.
- [L][CONFUSING] step 1 — the closing enthalpy/ΔH aside is meta-commentary that delays the point in the first step.

### nucleophiles — notes (score 9)
- [M][CONFUSING] What makes one stronger — the "Charge" paragraph explains itself with "less distance to climb to reach the transition state". Transition state is not defined until the Energy diagrams section, which comes later in this chapter.
- [M][MISSING DIAGRAM] When a nucleophile has two ends: ambident nucleophiles — the enolate's charge "mostly on oxygen" but reactivity "mostly at carbon", and cyanide's two lone pairs, are given only in words. Needs the enolate's two resonance forms and ⁻:C≡N: with both lone pairs.
- [M][CONFUSING] When a nucleophile has two ends — the worked example "why the same reaction runs faster in acetone" sits under the ambident heading, but it is about solvent and belongs under "Solvent matters too".
- [L][MISPLACED/WEAK FIGURE] Two words worth pinning down: protic, and polarizable — the row/column trends figure opens a section whose prose defines protic/aprotic and polarizability, and it largely duplicates the solvent-cage figure one section later.
- [L][MISSING DIAGRAM] What makes one stronger, "Hybridization of the donating pair" — sp³ amine against sp² pyridine against sp nitrile nitrogen are named without structures or orbital pictures.
- [L][CONFUSING] What makes one stronger, "Electronegativity, running backwards" — "exactly the same physics read the other way round" is meta-commentary that explains nothing.

### radical-halogenation — notes (score 9)
- [M][MISSING DIAGRAM] Two corrections to the arithmetic, "the intermediate is flat" — planar radical, unpaired electron in a p orbital, halogen arriving on either face: no figure shows it.
- [M][MISSING DIAGRAM] Two corrections, worked example (propane, 2-methylpropane) — counting "six primary (the two end methyls)" and "nine primary and one tertiary" from condensed formulas. Needs skeletons with equivalent-H sets colored.
- [M][CONFUSING] Two corrections, "Counting the products in the first place" — the definition of equivalent hydrogens comes after the worked example that relied on it, and "swapping them leaves an identical molecule" is abstract with no picture.
- [M][MISSING DIAGRAM] Looking ahead: allylic bromination, "Worth noticing" — the double bond ending up in two places via two resonance forms of the allylic radical is spatial and undrawn.
- [L][MISSING DIAGRAM] Homolysis, and the arrow that moves one electron — no side-by-side of a double-barbed heterolysis and a fishhook homolysis; the only fishhooks appear two sections later in the full mechanism.

### electrophiles — notes (score 8)
- [M][CONFUSING] Ranking electrophiles — the section mixes two ideas: ranking between molecules (EWG/EDG rules) and scanning one molecule for sites (4-chlorobutan-2-one). The scan figure sits before the ranking prose, and the scan worked example comes after it.
- [M][MISSING DIAGRAM] Making an electrophile stronger — "protonating a carbonyl oxygen gives a cation whose resonance structures place a full positive charge on the carbon" needs those two resonance structures drawn.
- [M][MISSING DIAGRAM] Electrophilicity is relative — the α,β-unsaturated carbonyl, with alpha and beta carbons defined in words ("the far end of the double bond"), needs a labeled structure.
- [L][CONFUSING] The main families / Making an electrophile stronger — "C–OTs" and "tosylate" are used without saying what Ts is; the term is deferred to the next section.
- [L][CONFUSING] Ranking electrophiles, "Electron-donating neighbors" paragraph — carries three ideas (alkyl donation plus sterics, amide resonance, carboxylate).

### energy-diagrams — notes (score 7)
- [H][CONFUSING] Multi-step reactions: one hump per step, and Four mistakes, "Measuring a barrier from the wrong baseline" — the rule "the rate-determining step is the biggest climb, measured from the valley immediately before it" is wrong when the intermediate lies above the reactants and reverts faster than it proceeds. It contradicts the keyed answer of the page's own lesson (step 6). See Chemistry below.
- [M][MISSING DIAGRAM] Transition state or intermediate? — "drawn with dotted lines and partial charges ... in square brackets with a double dagger" describes a drawing the page never shows. Needs an actual bracketed TS next to an intermediate (for example, the SN2 TS against a carbocation).
- [L][CONFUSING] How fast and how far are different questions — the rule and the equation come first; the diamond example that makes it concrete arrives two paragraphs later.
- [L][CONFUSING] What the picture actually plots — the enthalpy-versus-free-energy paragraph is a meta aside in the middle of the first definitions.

### leaving-groups — notes (score 7)
- [M][CONFUSING] opening/Why spreading charge out matters — "tosylate" is used from the first section on (figure, table, alcohol activation) but never defined as p-toluenesulfonate (R–OTs = ROSO₂C₆H₄CH₃); the figure shows only "Ar".
- [M][CONFUSING] An alcohol has to be activated, worked example 1-butanol + HBr — the prose runs "Step 2 — water leaves readily" then "Step 3 — bromide attacks", which is two events, while the figure caption insists they are one concerted step and that drawing two invents a primary cation. The text teaches the error the caption warns against.
- [M][CONFUSING] Leaving as a neutral molecule — one paragraph stacks R–OH₂⁺, R–NH₃⁺, quaternary ammonium, the pKaH of ammonia and a forward reference to Hofmann elimination.
- [L][CONFUSING] Leaving as a neutral molecule — the "near-opposites of nucleophiles" paragraph and the "a mechanism that kicks out HO⁻ is wrong" paragraph sit under this heading but are about other things.

### carbocations — notes (score 6)
- [M][CONFUSING] Where they come from — a paragraph on both faces being equivalent and racemization is glued onto the π-protonation paragraph with no break; it belongs to the shape section.
- [M][MISSING DIAGRAM] Worked example 1 — a methyl shift, (CH₃)₃C–CH(OH)–CH₃ + HBr — C1/C2/C3 numbering and the shift are given in words and condensed formula; the nearby figure shows neopentyl, a different substrate. Needs this substrate numbered with the arrow and the product 2-bromo-2,3-dimethylbutane.
- [L][MISSING DIAGRAM] Where they come from, "A π bond is protonated" — which carbon takes H and which becomes the cation is not drawn.
- [L][CONFUSING] Worked example 2, "The honesty note" — repeats the ring-expansion caption almost word for word.

### electron-rich-poor — notes (score 6)
- [M][CONFUSING] Worked example — reading a molecule cold — calls the O-bearing carbon "mildly δ+" (text and figure), then says those same carbons are "polarized at least as strongly" as the Cl carbon. The two claims pull against each other.
- [M][CONFUSING] opening paragraph and both worked examples — lean on "leaving group" as already known ("everything so far ... leaving group"), but Leaving groups is the next section.
- [L][CONFUSING] Worked example — a molecule with a nucleophile and an electrophile in it — the long parenthetical on the four-membered ring (N, C4, C3, C2) against a five-membered homolog is ring geometry given in words, inside a step about something else.
- [L][CONFUSING] Induction versus resonance, aniline paragraph — "aniline" and ring donation are used with no structure and a forward reference.

### leaving-groups — lesson (score 6)
- [M][MISSING DIAGRAM] step 3 "Activating an alcohol" — elimination is defined in words ("strips the group off one carbon and an H off the carbon next door ... C=C"), and the two activation routes (R–OH₂⁺, R–OTs) are not drawn.
- [M][CONFUSING] step 3 — defines substitution and elimination, then activation, then both routes with pKa numbers, all in one step. The pKaH idea it uses is explained only later, in step 7. Ts is never defined.
- [L][CONFUSING] step 8 "No leaving group, no reaction" — says S and E are "the two you met in step 1"; they were introduced in step 3.
- [L][CONFUSING] step 4 halide click — asks for the best halide leaving group before the pKaH ordering (step 7) that justifies it.

### electron-rich-poor — lesson (score 5)
- [M][CONFUSING] step 4 "Two different ways electron density moves" — the resonance paragraph is one very long sentence that folds a definition of conjugation into itself behind nested dashes.
- [M][MISSING DIAGRAM] step 5 MCQ "H₂C=CH–CHO ... the β-carbon (the far end of the double bond)" — the β-carbon is located in words only; show the α/β-labeled structure and the resonance contributor with + on Cβ.
- [L][CONFUSING] step 7 final — the answer hinges on "chloride will leave", but leaving groups are not taught until the next lesson.

### nucleophiles — lesson (score 5)
- [M][CONFUSING] step 3 MCQ "Which factor makes a species a STRONGER nucleophile" — tests the charge and electronegativity trends, which no earlier step taught (step 1 only defines a nucleophile).
- [M][MISSING DIAGRAM] step 6 "Nucleophilicity and basicity are related" — tert-butoxide's methyls blocking a crowded carbon but not a proton is a steric picture; show hydroxide beside tert-butoxide.
- [L][MISSING DIAGRAM] step 4 "Two words the next question needs" — the hydrogen-bond cage around F⁻ against a loosely held I⁻ is described but not shown.

### electrophiles — lesson (score 3)
- [M][MISSING DIAGRAM] step 5 "Three more electrophile types" — Br₂ acquiring an induced dipole as it approaches the π cloud is spatial and undrawn (the notes have exactly this figure).
- [L][CONFUSING] step 5 — the carbocation is glossed as "a carbon that's already fully lost an electron pair", a roundabout and imprecise definition.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- energy-diagrams notes, "Multi-step reactions" plus "Four mistakes" plus the two-step figure caption — "the barrier for a step is measured from the valley immediately before it; the RDS is the biggest climb" fails whenever the intermediate lies above the reactants (energetic span: the rate is set by the highest TS relative to the lowest preceding state). The lesson's step 6 keys the correct answer (TS2) and lists the notes' rule as a wrong option. The two pages need reconciling.
- leaving-groups notes, Ranking the halides — "HF is a weak acid, meaning F⁻ is a reasonably strong base": with pKaH 3.2, F⁻ is a weak base, and the same page calls it "a middling base". The C–F bond strength is the real reason.
- electron-rich-poor notes, worked example 1 (and lesson final feedback) — claims the ether carbons are "at least as δ+" as the C–Cl carbon on electronegativity alone (3.44 against 3.16). Bond dipoles (C–Cl about 1.9 D, C–O about 1.3 D) do not support "at least as strongly". The argument survives without that claim.
- electrophiles lesson step 5 — "a carbon that's already fully lost an electron pair" is loose: the carbon lost a bonding pair to the leaving group.

## Chapter 22 — Biomolecules (score 109)

Note: none of the five Chapter 22 lessons has a single figure, inline SVG or molecule reference. Every lesson step that describes a shape relies on words alone.

### lipids — notes (score 13)
- [H][MISSING DIAGRAM] Fatty acids, and the kink that changes everything (shorthand paragraph) — Δ numbering (from COOH) and ω numbering (from CH3) are described only in words, and the text says mixing up the two directions is the commonest slip. Needs a numbered C18 skeleton (oleic or α-linolenic) with the Δ9 count from C1 and the ω-3 count from the CH3 end.
- [H][MISSING DIAGRAM] Steroids: the other kind of lipid — the fused 6-6-6-5 skeleton, ring letters A–D and C1→C17 numbering are given only in words. Needs a labeled steroid nucleus, ideally cholesterol.
- [M][MISPLACED/WEAK FIGURE] Triglycerides are triesters — the chain-packing figure (saturated, cis and trans chains with mp values) sits under the triglyceride heading. It belongs with the fatty-acid kink text above.
- [M][MISSING DIAGRAM] Two more families (terpenes) — "isoprene units joined head to tail" gets no drawing. Needs limonene or menthol with its two isoprene units outlined and head/tail marked.
- [M][CONFUSING] Two more families, and why fat is the storage molecule — one heading covers waxes, terpenes and energy density. The saponification worked example also sits here, two sections after the saponification text it supports.
- [L][MISSING DIAGRAM] Steroids (prostaglandins paragraph) — "a five-membered ring with two long side chains" has no structure.

### carbohydrates — notes (score 12)
- [H][MISSING DIAGRAM] Hemiacetal or acetal (maltose vs sucrose worked example) — the glycosidic connectivity (C1 to C4-OH in maltose; anomeric C1 to anomeric C2 in sucrose) is given only in words. Needs Haworth drawings of both, with the linking O and any free anomeric OH marked.
- [M][MISPLACED/WEAK FIGURE] The polysaccharides worth knowing — the anomeric-test figure (hemiacetal opens, acetal stays shut) sits under the polysaccharide heading. It belongs in "Hemiacetal or acetal".
- [M][MISSING DIAGRAM] Mutarotation paragraph — "β puts the anomeric OH equatorial … every substituent equatorial" has no chair drawing. Needs β-D-glucopyranose in its chair with equatorial groups labeled, plus the α ⇌ open chain ⇌ β equilibrium.
- [M][CONFUSING] Mutarotation paragraph — one paragraph holds the definition, the ring-opening mechanism, the equilibrium percentages, three rotation values and the conformational argument.
- [M][MISSING DIAGRAM] The polysaccharides worth knowing — α-1,4 (helix) vs β-1,4 (straight, stacking chain) is described but not drawn. Needs two linked glucose units for each linkage and a sketch of the resulting chain shape.
- [L][MISSING DIAGRAM] Three reactions (enediol paragraph) — the ketose → enediol → aldose shift of the carbonyl from C2 to C1 is given in words only.

### carbohydrates — lesson (score 12)
- [H][MISSING DIAGRAM] step 2 "The ring is a hemiacetal…" — the ring closure (C5-OH to C1), the Haworth conventions and α-down/β-up are all described in words, with no figure. Needs the Fischer→Haworth conversion with α/β marked.
- [M][CONFUSING] step 2 "The ring is a hemiacetal…" — the third paragraph stacks the anomeric carbon, anomers, the Haworth drawing rules, α/β, and an all-equatorial claim.
- [M][MISSING DIAGRAM] step 1 "A sugar is a polyhydroxy aldehyde…" — the D/L rule is read off a Fischer projection that is never shown.
- [M][MISSING DIAGRAM] step 3 "Which of these still reduce Tollens'…" — the feedback says "count the oxygens on the anomeric carbon", but the four cases are text only. Maltose, sucrose and the methyl glycoside have no structures.
- [M][MISSING DIAGRAM] step 6 "Glycosidic bonds, and why you can eat starch…" — α-1,4 vs β-1,4 and helix vs flat sheet are given in words only.
- [L][CONFUSING] step 6 "Glycosidic bonds…" — the protecting-group history aside delays the starch/cellulose point.

### peptides-proteins — lesson (score 12)
- [H][MISSING DIAGRAM] step 2 "One resonance structure explains everything odd…" — the six-atom planar unit, the partial C=N and "freedom lives at the α carbons" are described without a drawing.
- [H][CONFUSING] step 3 "Which of these follow from amide resonance?" — tells the student to "decide each one from the picture rather than from memory", but the lesson has no picture.
- [M][CONFUSING] step 1 "A peptide bond is an amide…" — five ideas in one step: amide, dipeptide/polypeptide/protein, termini, naming, and the 20ⁿ count.
- [M][MISSING DIAGRAM] step 1 "A peptide bond is an amide…" — which residue keeps the free NH2 and which keeps the free COOH in Gly-Ala vs Ala-Gly is given only in words.
- [M][MISSING DIAGRAM] step 6 "Four levels…" — the α-helix (i→i+4) and β-sheet hydrogen-bond patterns are not shown.

### lipids — lesson (score 12)
- [H][MISSING DIAGRAM] step 2 "The melting point is a packing problem." — straight, cis-bent (~30°) and trans chains are described only in words, and step 3 then says "draw the chain in your head". Needs the three-chain packing figure the notes already have.
- [H][CONFUSING] step 6 "One molecule, two personalities." — five ideas in one step: soap/micelle, phospholipid/bilayer, steroids, cholesterol in membranes, testosterone→estradiol.
- [H][MISSING DIAGRAM] step 6 "One molecule, two personalities." — the micelle, the bilayer, the fused four rings and A-ring aromatization are all spatial, and none is drawn.
- [M][CONFUSING] step 1 "Lipid is a solubility class…" — four ideas (solubility class, fatty acid, triglyceride, fat vs oil). Triglyceride connectivity is given in words only.
- [L][MISSING DIAGRAM] step 8 (final) "Partial hydrogenation…" — the stepwise, reversible H addition on the metal surface that scrambles cis/trans is described in words only.

### amino-acids — notes (score 11)
- [H][MISSING DIAGRAM] Stereochemistry: one carbon, one answer, two exceptions (CORN paragraph) — "H pointing toward you, read CO–R–N clockwise; turn it away and it reverses" is 3D viewing geometry. The adjacent figure shows only Fischer projections. Needs a wedge/dash L-alanine viewed H-forward, with the CO→R→N arrow.
- [M][CONFUSING] Stereochemistry (CORN paragraph) — one run-on sentence stacks the Fischer L/D rule, CORN, its viewing direction and a cysteine CIP aside.
- [M][MISPLACED/WEAK FIGURE] Stereochemistry — the zwitterion-ladder figure (glycine charge vs pH, electrophoresis direction) sits under the stereochemistry heading. It belongs under "The isoelectric point".
- [M][MISSING DIAGRAM] Grouping the twenty by side chain — the classes list names only. "Proline's side chain loops back to its own nitrogen" and the disulfide are given in words; needs representative side-chain structures, at least proline's ring.
- [L][CONFUSING] Stereochemistry — cysteine-is-R is explained three times (figure caption, "Cysteine is the exception…", "L and S are not synonyms…").
- [L][CONFUSING] Where amino acids come from in a flask — three multi-step syntheses (HVZ/NH3, Gabriel–malonic, Strecker) are packed into one paragraph with no scheme.

### nucleic-acids — notes (score 10)
- [M][CONFUSING] Three pieces, two names (ATP paragraph) — the polymerase mechanism ("3′ OH attacks the 5′ phosphorus") comes before primes and sugar numbering are introduced. It also breaks up the naming thread.
- [M][MISPLACED/WEAK FIGURE] The bases, in two families — the nucleotide-parts figure sits under the bases heading and repeats the earlier nucleotide-drawn figure. It belongs in "Three pieces".
- [M][MISSING DIAGRAM] Three pieces (2′-OH cleavage paragraph) — the 2′-alkoxide attacking its own backbone P, the five-membered ring and the 2′,3′-cyclic phosphate are described in words. Needs two linked ribonucleotides with arrows.
- [M][MISSING DIAGRAM] The bases, in two families (tautomer paragraph) — lactam vs lactim and "donors and acceptors in the wrong places" are not drawn. Needs e.g. thymine or guanine in both forms with donor/acceptor sites marked.
- [M][MISSING DIAGRAM] The backbone is a chain of phosphate diesters / antiparallel paragraph — the 3′–O–P–O–5′ link between two nucleotides and the antiparallel strands are never drawn, although the worked example depends on the direction.

### amino-acids — lesson (score 9)
- [M][MISSING DIAGRAM] step 1 "One carbon carries all four." — the α carbon's four groups and the L Fischer projection are given in words only.
- [M][CONFUSING] step 1 "One carbon carries all four." — definition, chirality, the L/Fischer rule and the cysteine R/S exception are all in one step.
- [M][CONFUSING] step 2 "The neutral molecule is a salt of itself." — zwitterion, the three charge states, the pI formula and the side-chain caveat are all in one step.
- [M][MISSING DIAGRAM] step 6 "The side chain is the whole variable." — the classes are names only. The proline ring and the S–S cross-link are described but not drawn.
- [L][CONFUSING] step 1 "One carbon carries all four." — the Fischer rule gives the carboxyl at the top and the amino group on the left but never says the side chain goes at the bottom.

### peptides-proteins — notes (score 9)
- [M][MISPLACED/WEAK FIGURE] Four levels of structure — the amide-planarity figure sits under the four-levels heading, after the peptide-bond resonance text it illustrates.
- [M][CONFUSING] Making a peptide on purpose — the flow breaks. The worked example and the 20ⁿ general count come in between, and then "Those four are the problem" refers back across them.
- [M][MISSING DIAGRAM] Hydrolysis, and how sequences are determined (Edman) — the PhNCS addition, the thiourea, the cyclization onto the first carbonyl and PTH release are all given in words. Needs a scheme.
- [L][CONFUSING] Hydrolysis (Edman) — "thiourea" and "phenylthiohydantoin" are used without a plain-words definition.
- [L][MISSING DIAGRAM] Why hydrophobic side chains end up inside — no sketch of a nonpolar core and polar surface.
- [L][MISSING DIAGRAM] Four levels / worked example — the disulfide "closing the peptide into a loop" is not drawn.

### nucleic-acids — lesson (score 9)
- [H][MISSING DIAGRAM] step 6 "The pairing rules are hydrogen-bond counting." — antiparallel strands, backbone outside and bases inside, and equal-width purine–pyrimidine rungs are all spatial, and none is drawn.
- [M][MISSING DIAGRAM] step 1 "Build it in order…" — the furanose with primed numbering, the base at C1′ and the phosphate at the 5′ OH are given in words only.
- [M][CONFUSING] step 1 "Build it in order…" — six ideas in one step: sugar, primes, purine/pyrimidine, nucleoside, N-glycoside mechanism, nucleotide.
- [M][CONFUSING] step 2 "The backbone is a chain of diesters…" — 3′/5′ connectivity (words only) and RNA's 2′-OH instability are two ideas in one step.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- amino-acids notes, "Grouping the twenty by side chain" — histidine is listed as "positively charged at physiological pH". With a side-chain pKa of about 6 it is mostly neutral at pH 7.4, which the lesson (step 6) correctly says.
- peptides-proteins notes, Edman paragraph — says the N-terminal residue "leaves as a phenylthiohydantoin". It is actually cleaved as the anilinothiazolinone, which is then converted to the PTH.
- nucleic-acids notes and lesson (step 6, step 7 feedback) — duplex stability is attributed entirely to H-bonds ("nothing but hydrogen bonds"), and GC melting is explained only by 3 vs 2 H-bonds. Base stacking is the larger stabilizing term and also tracks GC content.
- nucleic-acids notes, 2′-OH paragraph — "sits two atoms from the phosphorus" is off: C2′, C3′ and O3′ lie between the 2′-O and P. Lesson step 2 ("one carbon away from the phosphate") is similarly loose.
- lipids lesson step 6 — "estradiol is what you get when testosterone's A ring is aromatized". Aromatase also removes the C19 methyl; the text implies only a ring change.
- carbohydrates lesson step 2 — "β-D-glucopyranose puts every substituent equatorial, which is why glucose is the sugar life settled on" states a speculative evolutionary cause as fact.
- carbohydrates lesson step 3 case c3 — sucrose is given as "α-1,2". Strictly it is α1→β2; the fructose anomeric centre is β.

## Chapter 6 — Stereochemistry (score 101)

### cis-trans-ez — lesson (score 12)
- [M][MISSING DIAGRAM] step 1 "Something has to stop turning" — "the p orbital swings out of alignment" when a C=C is twisted is described with no orbital picture of the aligned and twisted p orbitals.
- [M][MISSING DIAGRAM] step 2 "On a ring: same face, or opposite faces" — the wedge/hash cis/trans reading on 1,2-, 1,3- and 1,4-rings has no ring drawn (the notes have two figures for this).
- [M][MISSING DIAGRAM] step 4 "On a double bond, cis and trans come with a condition attached" — cis/trans-but-2-ene ("both methyls below") and 3-methylpent-2-ene are given only as words and condensed formulas.
- [M][CONFUSING] step 6 "E/Z: rank each carbon on its own" — the procedure, CIP tie-breaking and multiple-bond duplication all come before any E/Z example. The explain box stacks two separate rules.
- [M][MISSING DIAGRAM] step 7 "CH₃–C(Br)=CH–CH₃ is drawn with its two methyl groups on opposite sides" — it says "is drawn", but no drawing is shown. The student has to build the geometry from a condensed formula.
- [L][MISSING DIAGRAM] step 3 "cis-1,4-dimethylcyclohexane is drawn in a chair" — refers to a chair that is not shown.
- [L][CONFUSING] step 9 "Cis/trans isomers are diastereomers, and they get counted" — three paragraphs mix the classification, the 2ⁿ⁺ᵐ rule, stability, packing and trans fats, dipoles and a preview.

### diastereomers — notes (score 9)
- [H][CONFUSING] Absolute and relative configuration, second paragraph — one paragraph brings in syn/anti, "one diastereomer as a racemate", erythro/threo defined on a Fischer projection (not yet taught) and the zig-zag caveat. The terms come before any example.
- [M][MISSING DIAGRAM] same section — syn against anti addition to a ring or C=C face and the resulting relative configuration are spatial, but nothing is drawn.
- [M][CONFUSING] The definition, second paragraph — 2² counting, C=C stereogenic units, rings and the general principle are stacked in one paragraph before any example.
- [L][CONFUSING] Cis/trans isomers are diastereomers, last paragraph "Two warnings about the words" — two unrelated forward-looking caveats in one paragraph, with no picture of the trisubstituted alkene.
- [L][MISSING DIAGRAM] Epimers and anomers — "the new stereocenter created when a sugar closes into a ring" (α/β) has no ring drawing; it is only a forward reference.

### prochirality — lesson (score 9)
- [H][MISSING DIAGRAM] step 6 "Naming them: pro-R and pro-S" — the promote-one-hydrogen rule is given with no drawing and no worked example. The notes have a figure for exactly this.
- [M][MISSING DIAGRAM] step 2 "Ethanol, worked all the way through" — "same four groups, opposite arrangement in space" for the two 1-deuterioethanols is not shown.
- [M][MISSING DIAGRAM] step 8 "Faces, and why flat carbons give mixtures" — the Re/Si faces and nucleophile attack from either face of a flat carbon are described with no figure (the notes have one).
- [L][CONFUSING] step 1 "One test, three possible answers" — the full procedure and three terms come before the ethanol example in step 2.
- [L][MISSING DIAGRAM] step 4 classify, methylcyclohexane row — the cis/trans-to-methyl reasoning for the C2 hydrogens appears only in words.

### chirality — notes (score 8)
- [H][CONFUSING] Chirality without a stereocenter, paragraph after the figure — one paragraph carries allenes, "cumulated", atropisomers, biphenyl blockers, binaphthyl "peri" hydrogens, racemization rates, BINOL/BINAP and DNA helices. Several terms ("peri", "racemize", "cumulated") are never defined.
- [M][CONFUSING] callout "Search for a plane of symmetry in the right conformation" — two opposite failure modes and the fix sit in one dense paragraph, with no conformational example drawn. The 2-chloropropane figure after it does not show a plane appearing or disappearing with rotation.
- [L][MISSING DIAGRAM] The symmetry shortcut, second paragraph — a center of symmetry is defined in words with no example.
- [L][CONFUSING] opening definition section, third paragraph — the optical-activity forward reference ("three sections from here") is meta-commentary that delays the hands example.
- [L][CONFUSING] Why this matters biologically — (S)/(R) labels on ibuprofen, naproxen and thalidomide are used two sections before R/S is taught.

### rs-configuration — lesson (score 7)
- [M][CONFUSING] step 9 "R/S is the label every downstream stereochemistry problem is built on" — "the (R,R)/(S,S)/meso analysis you just saw for tartaric acid" refers back to material that is not in this lesson and comes later in the chapter.
- [M][CONFUSING] step 6 "How is a C=O double bond treated for CIP priority purposes?" — duplication is quizzed without any earlier step teaching it.
- [M][MISSING DIAGRAM] step 1 "R/S is a precise name" — the four-step algorithm ("orient the lowest-priority group away") is given with no picture. The first drawing arrives only at the drill in step 8.
- [L][CONFUSING] step 7 "Working from a flat drawing?" — mentions Fischer projections, which are taught later, as a normal source of drawings.

### rs-configuration — notes (score 6)
- [M][CONFUSING] CIP priority rules, the paragraph beginning "Duplication is also what settles" — phenyl against vinyl, vinyl against tert-butyl and ring-closure duplicates are three ideas in one paragraph. The ring-closure rule has no example.
- [M][MISSING DIAGRAM] The flip trick, the "general fallback" paragraph — the "priority 4 in the plane of the page: swap it with the group pointing away" procedure is spatial and not drawn.
- [L][MISSING DIAGRAM] CIP priority rules — no figure shows phenyl (C,C,C) against vinyl (C,C,H) duplication. The only duplication figure is the aldehyde.
- [L][CONFUSING] R/S is not (+)/(−), first paragraph — D/L is described only as "compares to glyceraldehyde", with no plain-words mechanism for how the comparison is made.

### cis-trans-ez — notes (score 6)
- [M][MISSING DIAGRAM] Why these isomers exist at all — "a pi bond's overlap is side-by-side and dies the moment one end is twisted" has no p-orbital figure for the aligned and twisted states.
- [M][CONFUSING] What the geometry costs, physically — one paragraph carries stability, crystal packing and trans fats, the dichloroethene dipole and a heats-of-hydrogenation preview.
- [L][CONFUSING] E/Z: rank each carbon on its own — the procedure plus both CIP reminder paragraphs come before the first worked example.
- [L][CONFUSING] Worked example — two double bonds, the "Write the name" step — the IUPAC lower-locant-to-Z renumbering is packed into one long step.

### fischer — notes (score 6)
- [M][MISSING DIAGRAM] Why this convention exists — the "backbone curled like the inside of a barrel, chain bonds back, substituents forward" 3D origin is not drawn.
- [M][MISSING DIAGRAM] Worked example — assigning R/S in a Fischer projection — (R)-glyceraldehyde with OH on the right is traced only in prose. The only glyceraldehyde figure (top of page) has HO on the left, the other enantiomer.
- [L][WEAK FIGURE] Manipulating a Fischer projection safely — the list's second safe operation ("hold one group fixed and rotate the other three") is not among the figure's four panels.
- [L][MISSING DIAGRAM] D and L — the amino-acid rule (NH₂ left = L) has no Fischer drawing and does not say that COOH must be at the top.

### stereocenters — notes (score 5)
- [M][CONFUSING] The definition, "A note on vocabulary" paragraph — "stereogenic unit", the C=C case, the cis/trans origin and a scope note, all in one paragraph before any example.
- [L][CONFUSING] The definition — the rule comes before the butan-2-ol / propan-2-ol example.
- [L][WEAK FIGURE] Worked example — two similar-looking alcohols — the caption says "applied four times" but the figure shows three alcohols. The heading says two, and the prose uses propan-2-ol where the figure also has butan-1-ol.
- [L][CONFUSING] ring-carbon figure caption — mentions "CIP rule 2" before CIP is taught (next section).

### stereocenters — lesson (score 5)
- [M][CONFUSING] step 4 "A molecule has 3 stereocenters. What is the maximum number…" — the 2ⁿ rule is quizzed before any step introduces it.
- [M][MISSING DIAGRAM] step 5 "Two quick ways to rule a carbon out", ring paragraph — "trace both directions around the ring" has no ring drawing (the notes' 3- against 4-methylcyclohexanol figure would fit).
- [L][CONFUSING] step 2 "Click the carbon's four attached groups" — tells the student to click groups that are not interactive, then says the step has no wrong answer.

### meso — notes (score 4)
- [M][CONFUSING] Why meso compounds matter in reactions, last paragraph — the anti/syn × cis/trans general statement, the double-flip rule and a dihydroxylation cross-check are packed into one paragraph.
- [L][WEAK FIGURE] Meso compounds in rings, figure caption — ends "The flat hexagon drawing… shows that plane directly", but that figure has no flat hexagon.
- [L][CONFUSING] How to test for meso — relies on Fischer projections a section before they are taught. The caption admits it, but the reader still meets the notation cold.

### prochirality — notes (score 4)
- [M][CONFUSING] Prochiral centers, and the pro-R / pro-S labels, first paragraph — one paragraph gives the definition, the propane counterexample, "same as enantiotopic" and the already-chiral-molecule exception.
- [L][CONFUSING] The question, and the test that answers it, first paragraph — gives a symmetry definition, then calls it "almost useless at the bench". That is roundabout: the operational test should come first.
- [L][CONFUSING] Why this matters, Proton NMR paragraph — geminal coupling, n+1 and the 2-bromobutane spectrum are stacked into a preview paragraph.

### diastereomers — lesson (score 4)
- [M][MISSING DIAGRAM] steps 1 and 5 "Cis/trans isomers are diastereomers wearing a familiar name" — cis/trans-2-butene methyl placement and the dipole argument are words only.
- [L][WEAK FIGURE] step 1 — the chair diagram shows only cis-1,2-dimethylcyclohexane. The caption compares it with a trans isomer that is not drawn.
- [L][MISSING DIAGRAM] step 2 "A molecule has two stereocenters" — an abstract flip-center-1/center-2 exercise with no molecule to look at.

### fischer — lesson (score 4)
- [M][CONFUSING] step 4 "Which manipulation of a Fischer projection secretly converts it into its enantiomer?" — 180° rotation and "rotate three around a fixed one" are quizzed before any step teaches them.
- [L][MISSING DIAGRAM] step 1 "Horizontal means toward you" — the "curved backbone orientation" origin is mentioned with nothing to show it.
- [L][CONFUSING] step 5 "An even number of swaps" — the second paragraph jumps to per-center parity for multi-center molecules. It is dense and has no example.

### chirality — lesson (score 3)
- [M][MISSING DIAGRAM] steps 4 and 7 (plane-of-symmetry MCQ and final) — the internal mirror plane is the tested idea, but no step shows a molecule with a plane and one without.
- [L][WEAK FIGURE] step 1 — the CHFClBr diagram shows one molecule. The caption claims its mirror image cannot be rotated onto it, but the mirror image is not drawn.

### enantiomers — notes (score 3)
- [M][CONFUSING] callout "A racemate is not the same thing as an achiral compound" — racemate against achiral, melting-point differences, racemic compound against conglomerate and Pasteur, all in one long block.
- [L][CONFUSING] Why they behave differently in biology, second paragraph — relies on "diastereomeric" complexes before diastereomers are defined (next section).

### enantiomers — lesson (score 3)
- [M][WEAK FIGURE] step 1 "Enantiomers are the chirality relationship, applied to a specific pair" — the diagram shows one CHFClBr, not the mirror-image pair the step defines.
- [L][CONFUSING] step 5 "Specific rotation" — the formula, the polarimeter (not shown), racemic mixture and an SN1 forward reference in two paragraphs.

### meso — lesson (score 3)
- [M][WEAK FIGURE] step 1 "A molecule can have stereocenters and still be achiral" — the meso-tartaric-acid drawing (molecules.js) is the anti conformation. Its symmetry is an inversion center, so no mirror plane can be seen, while the text and caption promise an internal plane.
- [L][MISSING DIAGRAM] step 5 "The practical test: look for an internal mirror plane" — defers to Fischer projections "next lesson" and shows no plane test.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- diastereomers notes, Absolute and relative configuration — mixes up syn/anti as addition modes with syn/anti as relative-configuration descriptors. "Anti addition gives the anti diastereomer" is not general: anti addition to a Z-alkene gives the threo pair, which is syn in the zig-zag.
- diastereomers notes, Why this matters for reactions — "a reaction producing two enantiomers from achiral starting materials must produce them equally" needs "with achiral reagents, catalysts and environment". As written it contradicts asymmetric catalysis, and the enantiomers notes state the condition correctly.
- cis-trans-ez notes, What the geometry costs — says the E isomer is more stable "because the two higher-priority groups are held apart". Stability follows steric bulk, not CIP priority. The lesson (step 9) states this correctly, so the notes contradict it.
- chirality notes, The definition, third paragraph — "A chiral substance rotates the plane of polarized light" is true only of an enantioenriched sample. A racemate of a chiral substance shows zero rotation.
- chirality notes, Why this matters biologically — "(R)-naproxen is a liver toxin" is widely repeated but weakly sourced. Consider softening it or flagging it for author review.
- fischer notes, D and L — "NH₂ on the left is L" holds only with COOH at the top of the projection, and the page does not say so.
- diastereomers lesson, step 5 — trans-2-butene is said to have "little to none" net dipole. It is exactly zero by symmetry (the notes say zero).
- rs-configuration lesson, step 9 — claims the student "just saw" the tartaric acid (R,R)/(S,S)/meso analysis. That analysis is in the meso lesson, which comes later in the chapter.

## Chapter 14 — Carboxylic Acids & Derivatives (score 99)

### acyl-chlorides-anhydrides — notes (score 10)
- [H][CONFUSING] What an acid chloride then does, pyridine paragraph — one paragraph covers the sacrificial base, N-acylpyridinium, the relay mechanism, DMAP and pyridine basicity. It then ends with "What the sp² lone pair in the ring plane does explain…", which answers a claim the page never made.
- [M][MISSING DIAGRAM] same paragraph — the acyl-transfer relay (pyridine attacks, the N-acylpyridinium forms, the amine attacks it, pyridine leaves) is given in words only. The relay is the whole point of the paragraph.
- [M][CONFUSING] Why the acid itself is a poor acylating agent — the first sentence is a stacked multi-clause comparison of OH vs OR donation that lands "just above an ester". It then says that ranking does not matter in practice.
- [M][CONFUSING] Anhydrides, second paragraph — four ideas in one paragraph: aspirin, atom economy, naming, and mixed anhydrides.
- [L][MISSING DIAGRAM] Anhydrides — "two acyl groups sharing one oxygen" is given in words, and acetic anhydride appears only as (CH₃CO)₂O. There is no drawing of an anhydride or of which carbonyl is attacked.

### acyl-chlorides-anhydrides — lesson (score 10)
- [M][MISSING DIAGRAM] step 2 "Three reagents, and the by-products decide" — how SOCl₂ turns the OH into a chlorosulfite is given in words only. The notes have fig:chlorosulfite-self-destructs; the lesson has nothing.
- [M][MISSING DIAGRAM] step 6 "What an anhydride costs you" — the cyclic anhydride → amic acid → imide sequence (ring closing, ring opening at one carbonyl) is given in words only.
- [M][CONFUSING] step 4 feedback "Correct, and this is a favorite exam trap" — a long paragraph that adds the pyridine/acylpyridinium mechanism to the stoichiometry answer.
- [M][CONFUSING] final feedback "Correct, and it is the mirror image" — about eight sentences with at least five ideas: proton-transfer symmetry, carboxylate nucleophilicity, Et₃N sterics, the pyridine contrast, and catalysts.
- [L][CONFUSING] step 3 row c5 — a parenthetical preview of Friedel–Crafts and the acylium ion sits inside an answer explanation.
- [L][CONFUSING] step 7 feedback — the answer is buried under a Gilman/Grignard aside.

### nitriles — notes (score 10)
- [M][MISSING DIAGRAM] Structure first — the page describes sp hybridization, a linear R–C≡N, 180°, and the N lone pair in an sp orbital pointing outward, all with no figure. Needs a drawing of the linear unit with its two π bonds and the lone-pair orbital.
- [M][CONFUSING] Structure first, second paragraph — three ideas: dipole and boiling point, acetonitrile as a polar aprotic solvent, and α-C–H acidity.
- [M][CONFUSING] Where nitriles come from, SN2 bullet — a long digression on what 3° halides do instead (solvolysis vs E2 by solvent) buries the one-line point: use a primary substrate.
- [M][CONFUSING] paragraph "The Grignard route — RX → RMgX…" — it compares two routes, adds a cyanohydrin caveat, and points to "three bullets above". One paragraph, 3+ ideas.
- [L][CONFUSING] Sandmeyer bullet — "no electrophilic cyanide reagent" is stated twice, plus a preview aside.
- [L][MISSING DIAGRAM] Worked example "1-bromopropane to pentan-2-one" — the carbon count is tracked only in condensed formulas. A skeletal figure that labels where each carbon comes from would carry it.

### carboxylic-acids — notes (score 9)
- [M][MISSING DIAGRAM] Structure — the page describes an sp² trigonal-planar carboxyl carbon and OH lone-pair donation into the π system. The only drawing of that donation is much later, under "The carbonyl carbon: less electrophilic". Needs a planar carboxyl drawing here, with the donation shown.
- [M][CONFUSING] Substituent effects, diacid paragraph — a long multi-clause paragraph with nine pKa values, two opposite effects and a distance trend.
- [M][CONFUSING] The carbonyl carbon, "second obstacle" paragraph — a long parenthetical defining Grignard reagents, forward-referenced to the next chapter, interrupts the argument.
- [L][CONFUSING] Why the O–H is so acidic — "the Resonance factor from the ARIO framework" is used without saying what ARIO stands for or linking to it.
- [L][MISSING DIAGRAM] Substituent effects, aromatic acids — the para-nitro and para-methoxy positions are named but not drawn.
- [L][CONFUSING] The one way a carboxylic acid falls apart — one paragraph holds the mechanism, the enol, the β-position requirement and malonic acids. The figure rescues it.

### carboxylic-acids — lesson (score 9)
- [M][MISSING DIAGRAM] step 1 "A carboxylic acid is a carbonyl with a hydroxyl" — the OH lone pair donating into the C=O in the neutral acid is given in words only. There is no resonance drawing.
- [M][CONFUSING] step 1, second paragraph — a single long sentence carrying three consequences: charge spread, acidity, and carbonyl reactivity.
- [M][MISPLACED/WEAK FIGURE] step 2 interactive acetate SVG — three plain single lines to C, O, O. No CH₃, no C=O double bond, no negative charge, no second resonance structure. The task ("click both oxygens") is trivial because they are the only two oxygens.
- [M][CONFUSING] step 5 explain "The same resonance donation…" — very long sentences comparing induction and resonance across two lessons. Several ideas per sentence.
- [L][CONFUSING] steps 3 and 8 — the "ARIO factor" is used as the answer frame and is never expanded on this page.

### acyl-substitution — lesson (score 9)
- [H][MISSING DIAGRAM] step 1 "Substitution at a carbonyl is really addition, then elimination" — the core mechanism (attack, tetrahedral intermediate, collapse) is given only in words. The attached figure is a plain acetyl chloride structure with no arrows, and step 2 is text buttons. No curved-arrow drawing appears anywhere in the lesson.
- [M][MISSING DIAGRAM] step 4 "Worked example: turning an ester into an amide" — the tetrahedral intermediate with N, OR and O⁻ on one carbon is described in words only.
- [M][MISSING DIAGRAM] step 6 "Fischer esterification" — the two protonations (carbonyl O, then leaving OH) are described without the five-panel figure the notes have.
- [M][CONFUSING] step 6 — one paragraph carries both activations, the Alcohols-chapter callback, and "water — the conjugate base of H₃O⁺".

### acyl-substitution — notes (score 8)
- [M][CONFUSING] Why substitution instead of simple addition, second paragraph — a long energy argument (π bond ≈ 90 kcal/mol "budget" against the C–X cost) in multi-clause sentences. The one idea gets lost.
- [M][MISSING DIAGRAM] Worked example "ester to amide" — the zwitterionic tetrahedral intermediate (N⁺, O⁻) and the proton shuttle are described, and the text says "a full-credit mechanism does not" leave them out. No figure draws them.
- [M][MISSING DIAGRAM] Fischer esterification, ¹⁸O paragraph — the question of which C–O bond breaks (acyl–O or alkyl–O) is a connectivity question. Needs methyl benzoate with the ¹⁸O marked and the two candidate bonds highlighted.
- [L][MISSING DIAGRAM] Fischer section, amide-in-acid paragraph — N is protonated inside the tetrahedral intermediate so a neutral amine leaves. Given in words only.
- [L][CONFUSING] Addition, then elimination — the first figure's caption and the paragraph after it repeat the "why substitution" argument that the next h3 then makes a third time.

### baeyer-villiger — notes (score 8)
- [H][MISSING DIAGRAM] Worked example "2-methylcyclohexanone plus mCPBA" — ring numbering, which side the O inserts on (C1–C2, not C1–C6), the seven-membered lactone and retention at C2 are all given in words only. Needs the ketone and lactone drawn, with C1, C2 and C6 labelled and the inserted O highlighted.
- [M][MISSING DIAGRAM] Rings become lactones — ring expansion by one oxygen (cyclohexanone → seven-membered lactone) is not drawn.
- [M][MISPLACED/WEAK FIGURE] fig:which-migrates (acetophenone → phenyl acetate) sits under "Rings become lactones". It illustrates "Which group migrates".
- [L][CONFUSING] Which group migrates, aryl sentence — "bridged transition state" and "ipso carbon" are used without definition or a drawing.

### esters-amides — notes (score 7)
- [H][CONFUSING] The reactivity ladder, paragraph "Both rules point the same way…" — one paragraph runs from the ladder consequence, through IR frequencies and anhydride two-band coupling, to the acid dimer vs monomer bands in dilution. A student following the ladder loses the thread.
- [M][MISSING DIAGRAM] When the ring closes on itself — γ/δ lactone naming and ring size (a 4- or 5-hydroxy acid cyclizing) need a drawing, such as 4-hydroxybutanoic acid closing to γ-butyrolactone with α/β/γ labelled.
- [L][MISSING DIAGRAM] The reactivity ladder, "Chlorine is a poor donor" — the 3p–2p size-mismatch overlap is described but not drawn.
- [L][MISSING DIAGRAM] Amide resonance, basicity paragraph — why O-protonation keeps the C=N⁺ delocalization and N-protonation destroys it is argued in words only.

### baeyer-villiger — lesson (score 7)
- [H][MISSING DIAGRAM] step 2 "The migration, and what it preserves" — the Criegee intermediate, the 1,2-shift onto oxygen and retention are the whole reaction, and none of it is drawn in the lesson.
- [M][MISSING DIAGRAM] step 5 "Cyclohexanone is treated with mCPBA" — the ring expansion is explained in the feedback with no ring drawn.
- [L][CONFUSING] step 6 — titled "Two things worth checking" but lists three (alkene, methyl ketone, aldehyde).
- [L][CONFUSING] step 3 interactive — the ketones are condensed formulas with a "left/right group" choice. A student must build each structure mentally to see which group ends up on the inserted oxygen.

### esters-amides — lesson (score 6)
- [M][CONFUSING] step 1 "One core structure, four leaving groups" — the first paragraph is one very long sentence. The rule ("both properties move in the same direction") comes before any example.
- [M][MISSING DIAGRAM] step 4 "Esters: made reversibly, hydrolyzed irreversibly" — the saponification mechanism, including the final deprotonation, is given in words only.
- [L][CONFUSING] step 2 interactive — the four derivatives are given only as condensed formulas (RCOOCOR′, etc.).
- [L][CONFUSING] step 6 explain — long parenthetical cross-reference to the "Nucleophilic Addition lesson" inside the LiAlH₄ sentence.

### nitriles — lesson (score 6)
- [M][MISSING DIAGRAM] step 6 "Crippled, not rationed" — the "metalated imine anion" (which atom carries the metal, where the C=N is) is central and never drawn.
- [M][CONFUSING] step 3 row n6 "(CH₃)₃CBr + NaCN" — the graded answer is "Alkene", but the explanation says the outcome depends on a solvent the question never gives (a protic solvent gives the alcohol).
- [L][CONFUSING] step 2 explain-box — three ideas in one box: the Grignard-vs-cyanide comparison, O–H tolerance, and the "look at the substrate" maxim.
- [L][CONFUSING] final feedback — a long paragraph that adds a side argument about temperature.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- baeyer-villiger notes, Rings become lactones — "the only [ring expansion] that puts a heteroatom into the ring" ignores the Beckmann rearrangement (cyclohexanone oxime → caprolactam) and the Schmidt reaction.
- carboxylic-acids notes, "Why the O–H is so acidic" (and the lesson's ARIO feedback) — "no inductive argument is needed; delocalization accounts for essentially all of it" is contested. Several analyses (Siggel/Thomas, Wiberg) attribute a large share to the carbonyl's inductive/electrostatic effect. Flag it for author review rather than stating it as settled.
- acyl-chlorides-anhydrides notes (Anhydrides) and lesson row c6 / final — "acyl chloride + carboxylic acid, no base: essentially nothing happens" is overstated. On heating they do give the anhydride with loss of HCl.
- acyl-chlorides-anhydrides lesson final feedback — triethylamine is described as simply too bulky to react with acid chlorides. With an α-H acid chloride, Et₃N can form a ketene. Worth a qualifier.
- acyl-substitution lesson step 6 wrongFeedback — "Alcohols are perfectly good nucleophiles on their own" contradicts the step 6 explanation (the carbonyl must be protonated "for a neutral alcohol to attack at all").
- nitriles notes, last paragraph (and lesson step 2) — "an O–H or N–H does not touch [cyanide]". A carboxylic acid O–H (pKa ~5) would protonate cyanide (HCN pKa 9.2), so this holds for alcohols but not for acids.
- baeyer-villiger lesson step 6 — "a substrate carrying both will give the epoxide" is stated as absolute. Electron-poor alkenes and reactive ketones can reverse this, and the notes more carefully say "usually".

## Chapter 9 — Alkenes & Alkynes (score 95)

### alkene-oxidation — lesson (score 14)
- [H][MISSING DIAGRAM] step 2 "Two routes to a diol" — syn against anti diol (both O delivered to one face through the osmate ester; water attacking opposite the breaking C–O) is the core of the lesson, and the lesson has no figure. Needs the wedge/hash diol pair.
- [M][MISSING DIAGRAM] step 1 "Three degrees of oxidation" — "cis alkene gives cis-substituted epoxide" is spatial; no epoxide or butterfly TS is shown.
- [M][CONFUSING] step 2 — "the same kind of reagent-chosen stereocontrol as Lindlar against dissolving metal in the last lesson": the last lesson was addition-reactions/markovnikov, and Lindlar is taught in the next lesson (hydrogenation).
- [M][CONFUSING] step 3 interactive "What does each reagent do" — asks the student to classify "O₃, then Me₂S" before ozonolysis has been introduced; it is explained only in the answer feedback.
- [M][CONFUSING] step 4 MCQ "Ozonolysis with H₂O₂ workup instead of Me₂S" — reductive against oxidative workup is never taught in an explain step.
- [M][CONFUSING] step 5 MCQ "KMnO₄ appears twice in the summary table" — the lesson has no summary table (it is on the notes page).
- [L][MISSING DIAGRAM] step 6 worked example — rejoining propanal and propanone into 2-methylpent-2-ene is done in condensed formulas only.

### alkene-structure — notes (score 11)
- [H][MISSING DIAGRAM] Bridgehead alkenes and Bredt's rule — bridgeheads, "three separate chains pull in different directions", bicyclo[2.2.1]hept-1-ene against bicyclo[3.3.1]non-1-ene: all spatial, none drawn.
- [M][CONFUSING] Bridgehead alkenes — "bicyclo[2.2.1]" and "[3.3.1]" notation is used without saying what the bracketed numbers mean.
- [M][MISSING DIAGRAM] Where the double bond is — numbering direction in a chain (pent-2-ene not pent-3-ene) and around a ring (1-methylcyclohexene against 3-methylcyclohexene) is described only in words.
- [M][MISSING DIAGRAM] Rings: why small ones are always cis — "the chain has to loop the long way around and twist the pi system" needs cis- and trans-cyclooctene drawn.
- [L][CONFUSING] Where the double bond is, E/Z paragraph — the E/Z rule is restated with no drawn example (the only figure is cis/trans-2-butene).
- [L][CONFUSING] Degrees of unsaturation — the formula is given before any example; the C₄H₈ example follows the rule.

### hydrogenation — lesson (score 9)
- [H][MISSING DIAGRAM] step 1 "A surface reaction" — syn delivery from a metal surface, and a 1,2-disubstituted cyclohexene becoming cis, are spatial; the lesson has no figure (the notes' syn-on-surface figure is exactly what is needed).
- [M][CONFUSING] step 5 MCQ "cis alkene from an internal alkyne. Which conditions?" — asks about Lindlar and Na/NH₃ before step 6 teaches them, and before alkynes have been introduced in the course.
- [M][MISSING DIAGRAM] step 6 "One alkyne, two conditions, two geometries" — the trans outcome of Na/NH₃ via a trans vinyl anion needs drawing; so does the cis/trans pair.
- [L][CONFUSING] step 6 — also packs heats of hydrogenation and the conjugation energy of buta-1,3-diene into the same step.
- [L][MISSING DIAGRAM] step 4 MCQ "Hydrogenating 1,2-dimethylcyclohexene" — the substrate is named, not drawn.

### addition-reactions — notes (score 9)
- [H][MISSING DIAGRAM] Halogenation, the 2-butene paragraphs and worked example (a) — "Line the two methyls ... put the bromonium on top ... assign (2R,3R)" is a 3D derivation the page does not draw ("a worked drawing sits in Stereochemistry"). Needs cis- and trans-2-butene through the bromonium to (2R,3R)/(2S,3S) and meso products.
- [M][MISPLACED/WEAK FIGURE] Hydrohalogenation (HX addition) — the "bromonium ion in perspective" figure sits under the HX heading, before halogenation is introduced.
- [M][MISSING DIAGRAM] Worked example (b), 1-methylcyclohexene + Br₂/H₂O — ring halohydrin with OH on C1 trans to Br on C2 is undrawn; the halohydrin figure uses 2-methylpropene.
- [L][MISPLACED/WEAK FIGURE] Hydrohalogenation, rearrangement paragraph — the text works HCl giving 2-chloro-2-methylbutane, but the figure beside it runs HBr giving 2-bromo-2-methylbutane.
- [L][MISSING DIAGRAM] Oxymercuration–demercuration — the mercurinium bridge and the Markovnikov opening are only described; 3,3-dimethyl-1-butene is named without structure.

### alkynes — notes (score 9)
- [M][MISSING DIAGRAM] sp hybridization and linear geometry — "two p orbitals perpendicular to each other and to the sp axis form two separate pi bonds" needs the orbital picture; the only figure shows a line drawing of R–C≡C–H.
- [M][MISSING DIAGRAM] Making the triple bond: double dehydrohalogenation — vicinal against geminal dihalide, and the two eliminations through a vinyl halide, are given only in words.
- [M][MISSING DIAGRAM] Addition reactions, dissolving-metal bullet list — radical anion, vinyl radical, then trans vinyl anion: the geometry-setting intermediate is never drawn (the fork figure shows only the products).
- [L][MISSING DIAGRAM] Addition reactions, X₂ paragraph — "trans dihaloalkene" from anti addition is undrawn.
- [L][MISSING DIAGRAM] Addition reactions, HX paragraph — 1-butyne + 2 HBr → 2,2-dibromobutane (geminal, not vicinal) is stated but not drawn.
- [L][CONFUSING] Hydration and the enol — the Hg²⁺ bridging explanation comes after the tautomerization figure and repeats oxymercuration; the order is backwards.

### alkene-oxidation — notes (score 8)
- [M][MISSING DIAGRAM] Which diastereomer, exactly — the 2×2 table (meso against racemic butane-2,3-diol) is text only. Neither nearby figure shows butane-2,3-diol: both use generic R groups.
- [M][CONFUSING] Ozonolysis — "The workup then decides what those fragments are:" is followed by a mechanism paragraph and a large figure; the list the colon introduces comes only after both.
- [L][MISPLACED/WEAK FIGURE] The two diols — the diol-intermediates figure label reads "the Sₙ₂2 geometry" (typo), and the syn-anti-diol figure further down largely repeats it.
- [L][CONFUSING] Epoxidation — the peroxyacid sentence ("outer oxygen ... breaking the weak O–O bond hands the oxygen that leaves a whole carboxylate") is hard to parse, with no drawn RCO₃H before the figure.
- [L][MISSING DIAGRAM] Ozonolysis, cyclic-alkene paragraph — cyclohexene → hexanedial (one molecule, two C=O) is a ring-opening picture given in words.
- [L][MISSING DIAGRAM] Worked example — reading a cleavage backwards — rebuilt entirely in condensed formulas.

### addition-reactions — lesson (score 7)
- [H][MISSING DIAGRAM] step 4 "Halogenation (X₂) skips the free carbocation" — the bromonium bridge blocking one face and the backside attack giving anti addition are the whole point, and they are not drawn (the only lesson figure is propene + HBr).
- [M][CONFUSING] step 6 "Acid-catalyzed hydration" — the three-step mechanism is packed into one semicolon-joined sentence.
- [L][MISSING DIAGRAM] step 6 — no drawing of the three hydration steps or the oxonium ion.
- [L][CONFUSING] step 4 — both paragraphs are single long sentences with parentheticals.

### alkynes — lesson (score 7)
- [M][MISSING DIAGRAM] step 1 "A triple bond is one sigma bond plus two pi bonds" — the propyne diagram has no caption and shows no orbitals; the two perpendicular p-orbital pairs are the content of the step.
- [M][CONFUSING] step 6 "Two pi bonds mean addition can stop halfway" — stacks partial/full reduction, Lindlar, Hg²⁺ hydration, enols, tautomerization and hydroboration in one step.
- [M][MISSING DIAGRAM] step 6 — enol → ketone tautomerization, and which carbon gets the O, are given in words only.
- [L][CONFUSING] step 3 MCQ — tests the "Orbital factor from the ARIO framework", which the lesson never restates.

### alkene-structure — lesson (score 6)
- [M][CONFUSING] step 4 MCQ "C₅H₈ has how many degrees of unsaturation?" — degrees of unsaturation and its formula are never taught in the lesson; the formula appears only inside the answer options.
- [M][MISSING DIAGRAM] step 5 "More substituted alkenes are more stable" — "trans is more stable than cis because the bulky groups aren't crowded on the same side" with no cis/trans drawing; cis/trans is never shown anywhere in the lesson.
- [L][CONFUSING] step 5 — five heat-of-hydrogenation values packed into one sentence.
- [L][CONFUSING] step 7 "Why it matters" — ties alkene stability ranking to Markovnikov's rule, but Markovnikov rests on carbocation stability, not alkene stability.

### hydrogenation — notes (score 6)
- [M][MISPLACED/WEAK FIGURE] Heats of hydrogenation, as a measuring tool — the alkyne-three-ways figure (Lindlar/Na-NH₃/Pd) sits under the heats heading instead of under "Stopping an alkyne halfway".
- [M][MISSING DIAGRAM] Stopping an alkyne halfway, dissolving-metal bullet — the e⁻/H⁺/e⁻/H⁺ sequence and the trans vinyl anion that fixes the geometry are never drawn.
- [L][MISSING DIAGRAM] Worked example — 4-phenylbut-3-en-2-one — substrate and three products are condensed formulas only.
- [L][CONFUSING] Heats of hydrogenation table — given in kJ/mol while alkene-structure gives the same data in kcal/mol; the student has to reconcile 127 kJ against 30.3 kcal.

### markovnikov — lesson (score 6)
- [M][MISSING DIAGRAM] step 4 "Hydroboration-oxidation" — the four-center TS, syn addition and δ+ on the more substituted carbon are spatial; no figure (the notes have one).
- [M][MISSING DIAGRAM] step 8 final "1-methylcyclohexene ... OH on C2 of the ring" — ring numbering and positions in words only.
- [L][CONFUSING] step 4 — the first paragraph is one very long sentence carrying concerted, syn, regiochemistry and sterics.
- [L][CONFUSING] steps 6–7 — call hydroboration's regiochemistry "the boron sterics" and "steric/concerted", undoing step 4's point that it is electronic and steric together.

### markovnikov — notes (score 3)
- [M][MISSING DIAGRAM] Markovnikov's rule, restated mechanistically — the page opens on propene + HBr but never draws the two possible cations (1° against 2°) that the whole argument compares; the propene figure on the page is about hydration routes.
- [L][MISSING DIAGRAM] Markovnikov's rule, styrene paragraph — the benzylic cation from PhCH=CH₂ is described, not drawn.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- alkynes lesson step 6 — calls H₂, X₂ and HX all "electrophilic addition" and says double addition lands "on a fully saturated alkane". Only H₂ gives an alkane (and it is not electrophilic addition); 2 HX gives a geminal dihalide and 2 X₂ a tetrahalide.
- alkynes lesson step 8 "Draw it" — says "One arrow" for deprotonation by amide. A proton transfer needs two arrows (amide lone pair → H, C–H bond → C); the step shows only the second.
- alkene-oxidation lesson step 3 CASES — "OsO₄, then NMO": NMO is the co-oxidant present together with OsO₄, not a sequential second step (the notes correctly write OsO₄ / NMO, then NaHSO₃).
- alkene-oxidation notes, diol-intermediates figure — label typo "Sₙ₂2 geometry".
- alkene-structure lesson step 7 — "the stability ranking you just learned (more substituted = more stable) is the same logic behind Markovnikov's rule" conflates alkene stability with carbocation stability.

## Chapter 10 — Conjugation & Pericyclic Reactions (score 93)

### diels-alder — lesson (score 15)
- [H][MISSING DIAGRAM] step 6 "The endo rule, and running the reaction backwards" — the endo/exo stacking (substituent tucked under the diene vs pointing away) is given only in words. The lesson has no drawing at all.
- [H][CONFUSING] step 2 "Two requirements: the right shape, and the right electronics" — one step carries s-cis, HOMO/LUMO electronics, Lewis-acid catalysis, regiochemistry and dienophile examples, which is at least four ideas.
- [H][MISSING DIAGRAM] step 2 (regiochemistry paragraph) — the δ−/δ+ ends, "donor on C1 puts the negative end at C4" and the ortho/para ring positions are given only in words. It needs a polarized diene and dienophile, plus the two ring products with the positions numbered.
- [M][MISSING DIAGRAM] step 1 "Six electrons round a circle" — no drawing shows that C1 and C4 form the new σ bonds and the new π bond sits at C2–C3.
- [M][CONFUSING] step 6 — two unrelated ideas (endo selectivity and the retro-Diels–Alder) share one step.
- [L][MISSING DIAGRAM] step 3 (Visualize, which dienes can react) — the dienes are identified in words only ("a diene locked s-trans inside a fused ring system"), so the student has to picture the geometry being judged.
- [L][MISSING DIAGRAM] step 4 "Two ester groups are cis across the dienophile" — no drawing shows cis going in and cis on the ring coming out.

### diels-alder — notes (score 13)
- [H][MISSING DIAGRAM] "Stereochemistry, and why it is completely predictable" — the outward/inward substituents on the s-cis diene termini, and how outward+outward becomes cis on the ring, are never drawn. The endo/exo figure shows something different. It needs an s-cis (E,E) and (E,Z) diene with outside/inside groups mapped onto the product ring.
- [M][MISPLACED/WEAK FIGURE] "The diene must be able to reach s-cis" — the bond-accounting mechanism figure sits under this heading but illustrates "What it is". The s-cis section itself has no figure of a locked s-trans diene or of the inner-substituent clash it describes.
- [M][CONFUSING] "What it is", paragraph 2 ("That word cycloaddition puts it in a family") — it stacks the pericyclic definition, three reaction classes, the Cope and Claisen, and course scope into one paragraph.
- [M][CONFUSING] "Regiochemistry: which way round" — the three polarization rules are stated before any example. "Push the donor's electrons in" asks for resonance forms that are never drawn; the figure shows only δ labels.
- [M][CONFUSING] "Regiochemistry" worked example, paragraph "Regiochemistry is only half of that answer" — it uses endo and outward-substituent reasoning one section before endo is taught.
- [L][MISSING DIAGRAM] "Stereochemistry" worked example (dimethyl maleate/fumarate) — cis vs trans esters on the product ring are described but not drawn.
- [L][CONFUSING] "Electronics" — "A note on the names, in advance" is meta-commentary that interrupts the frontier-orbital argument.

### uv-vis — notes (score 13)
- [H][MISSING DIAGRAM] "Substituents shift λmax too" — the Woodward–Fieser table uses homoannular, heteroannular, exocyclic double bond and ring residue with no structures, so the student must build each shape mentally. It needs one drawn diene of each type with the increments marked.
- [M][CONFUSING] "Substituents shift λmax too" — "ring residue", "exocyclic" and "homoannular/heteroannular" are never defined in plain words (the parenthetical glosses are too thin to use).
- [M][MISSING DIAGRAM] "More conjugation, smaller gap, longer wavelength" — the argument leans on "the ladder drawn in the first section of this chapter", which is on another page. Nothing here shows the HOMO–LUMO gap narrowing.
- [M][MISSING DIAGRAM] "Not every band is a π → π* band" — "the lone pair points sideways, roughly perpendicular to the π*" is an orbital-overlap claim with no orbital picture.
- [M][MISPLACED/WEAK FIGURE] "Why conjugation eventually produces color" — both figures sit here. The spectrum trace (band shape, n→π* bump) belongs with "Not every band", and the λ-axis figure belongs beside the table in the previous section.
- [L][CONFUSING] "What the measurement is" — the gap→wavelength rule is stated in the abstract before any compound is named.
- [L][CONFUSING] "Beer–Lambert" — "worth remembering as a sentence rather than as a fact, because it is derived rather than memorized" is self-contradictory meta-commentary.

### conjugated-systems — notes (score 9)
- [M][MISPLACED/WEAK FIGURE] "s-cis and s-trans: a conformation, not a configuration" — the heats-of-hydrogenation bar chart sits under this heading instead of under "Conjugation is worth about 15 kJ/mol", which it illustrates.
- [M][MISSING DIAGRAM] "Isolated, conjugated, cumulated" — no figure shows the p-orbital row broken at an sp³ carbon, the continuous run, or allene's two perpendicular π systems. "Perpendicular" is the key idea and is only stated.
- [M][CONFUSING] "The orbital picture", paragraph 2 ("The rule generalizes exactly") — one paragraph holds n orbitals, node count, ladder spreading, rung spacing, the filling rule and odd/charged systems. The butadiene example comes only afterwards.
- [L][CONFUSING] opening paragraphs — "worth the two minutes" meta-commentary delays the point.
- [L][CONFUSING] "Isolated, conjugated, cumulated" paragraph "Conjugation is not limited to double bonds" — it stacks lone pairs, cations, radicals, anions and the resonance link with no example.
- [L][CONFUSING] "The orbital picture" — the "Two consequences" paragraph repeats the figure caption almost word for word.

### diene-addition — notes (score 9)
- [M][MISPLACED/WEAK FIGURE] "Why the 1,2-product forms faster" — the capture/ratio figure (products plus −80/40 °C ratios) belongs to the temperature section above. The heading's own argument (secondary vs primary contributor) appears only as a side label.
- [M][CONFUSING] "Why the 1,4-product is more stable" worked examples — "Assign kinetic and thermodynamic" uses terms this page never defines (they are defined in the next section).
- [M][MISSING DIAGRAM] "Why the 1,4-product is more stable" worked examples (isoprene, 2-methylpenta-1,3-diene) — the protonation choices, cation forms and both products are given only as condensed formulas and names. The switch from diene numbering to product numbering is not trackable without drawn, numbered structures.
- [L][CONFUSING] "One protonation, one intermediate, two ends" — after the figure the text re-explains C1 protonation and the resonance forms a second time, as a condensed-formula line.
- [L][CONFUSING] opening paragraphs — "the most surprising thing in this chapter and the reason the next section exists" is meta-commentary.
- [L][MISSING DIAGRAM] "The same split happens with other electrophiles" — the allylic rearrangement on solvolysis (halide and double bond both moving) is described only in words.

### conjugated-systems — lesson (score 8)
- [H][MISSING DIAGRAM] step 6 "The s-cis conformation is the one the next reactions need" — the s-cis/s-trans rotation, the C1-H/C4-H clash, and dienes locked s-cis and s-trans in rings are all described with no drawing.
- [M][CONFUSING] step 5 "What is the difference between s-cis and cis?" — this is tested before any step teaches s-cis, which is explained only in step 6.
- [M][MISSING DIAGRAM] step 1 "Two double bonds, three possible arrangements" — no drawing of the three arrangements. Allene's perpendicular π systems are stated only.
- [L][MISSING DIAGRAM] step 7 "Where does the positive charge sit in an allylic cation?" — the resonance forms and the node through C2 are described in feedback only.

### kinetic-thermodynamic — notes (score 8)
- [M][MISPLACED/WEAK FIGURE] "Where else this appears" — the diene-specific energy-well figure sits here instead of under "The diene case, read off the diagram".
- [M][CONFUSING] "Two different questions, two different answers" — kinetic and thermodynamic products are defined in the abstract before any example (the diene case comes two sections later). The barrier-vs-well point is also restated three times.
- [M][CONFUSING] "Where else this appears" (aromatic sulfonation) — the paragraph only says sulfonation is reversible. It never names two competing products, so it does not illustrate kinetic vs thermodynamic control.
- [L][MISSING DIAGRAM] "Where else this appears" (enolates) — which side of the ketone gives the more vs less substituted enolate is given only in words.
- [L][CONFUSING] opening paragraphs — meta-commentary about why the section exists.

### kinetic-thermodynamic — lesson (score 7)
- [M][MISSING DIAGRAM] steps 1–2 "Two different questions…" / "Reversibility is the switch" — hills, wells and "climb back out of either product well" are used with no energy diagram anywhere in the lesson.
- [M][CONFUSING] step 1 — the abstract definitions come first, and the concrete diene case appears only in step 3 (case k4) and step 7.
- [M][CONFUSING] step 5 "A question specifies a bulky base at −78 °C" — enolates and LDA are tested one step before step 6 introduces them.
- [L][CONFUSING] step 6 "The same switch, in three other places" — it uses endo (next lesson) and sulfonation with no definition.

### diene-addition — lesson (score 6)
- [M][CONFUSING] step 1 "One protonation, one intermediate, two ends" — it packs the why-C1 argument, the allylic cation and both resonance forms into one step, with a long embedded sentence. The resonance appears only as a condensed-formula line.
- [M][MISSING DIAGRAM] step 2 "The two products, and the temperature that picks between them" — where Br lands and where the double bond moves are described in words and names only. It needs both product structures with the C1–C4 numbering.
- [L][CONFUSING] step 2 — "thermodynamic control" is used without definition.
- [L][CONFUSING] step 8 (final) — the feedback tacks on a second, harder problem (2-methylpenta-1,3-diene) with no structures.

### uv-vis — lesson (score 5)
- [M][MISSING DIAGRAM] step 2 "More conjugation, smaller gap, longer wavelength" — the orbital-ladder argument has no diagram.
- [M][CONFUSING] step 6 "Beer–Lambert: wavelength says what…" — Beer–Lambert and the n→π* exception, two separate ideas, share one step.
- [L][CONFUSING] step 1 "The one thing UV-Vis measures well" — the gap→wavelength rule is stated before any example.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- kinetic-thermodynamic lesson, step 3 case k3 ("B is more stable, but the step forming it cannot reverse… → A") — as worded, only B's formation is irreversible. If A forms reversibly, B is a sink and everything eventually drains to B, so the answer A is wrong. The case should say neither product-forming step reverses.
- diels-alder notes, "What carries forward" — calling Diels–Alder "the first concerted reaction in this course that forms two bonds at once" is wrong. Hydroboration, mCPBA epoxidation and OsO₄ dihydroxylation come earlier, and the lesson's own final step cites hydroboration as concerted.
- diels-alder notes, regiochemistry figure — the "meta … never seen" label clashes with the prose ("a preference, not a law") and with lesson step 2 ("at most a minor product"). "Never" overstates it.
- diels-alder notes and lesson — the endo preference is attributed solely to a secondary orbital interaction. That is still debated in the literature (electrostatic and steric contributions are also argued); consider a hedge or an entry in needs-author.

## Chapter 19 — Aromatic Follow-Through (score 87)

### birch-reduction — notes (score 14)
- [H][CONFUSING] The conditions and the mechanism, "It is worth naming the intermediate" — one very long paragraph carries the radical vs anion intermediates, which carbons carry charge ("flanking… directly across"), the orbital-coefficient caveat, and the 1,4 count. The spatial core (which carbons) has no figure under this heading.
- [H][CONFUSING] Why you would want a 1,4-cyclohexadiene — one paragraph stacks selective functionalization, the enol-ether definition, the enamine analogy, the hydrolysis product, isomerization, the Robinson/Michael link, and naphthalene/tetrahydronaphthalene.
- [M][MISPLACED/WEAK FIGURE] The conditions and the mechanism — no figure here. The mechanism drawing (radical anion → cyclohexadienyl anion → 1,4-diene) is the top row of birch-products, placed under the next heading after the substituent table.
- [M][MISPLACED/WEAK FIGURE] Why you would want a 1,4-cyclohexadiene — the birch-where-charge figure (donor vs acceptor rule) sits here, not under "Substituents decide where the double bonds end up", which it explains.
- [M][MISSING DIAGRAM] Worked example 4-methylanisole — numbering (C1 OMe, C4 Me, sp³ at C3/C6) and the diene placement are given only in words. It needs the numbered product and the enone hydrolysis product.
- [L][CONFUSING] The conditions and the mechanism, alcohol paragraph — "far weaker an acid than those intermediates are basic, or it would simply consume the solvated electrons" is roundabout and hides the actual constraint.
- [L][CONFUSING] Substituents decide…, "The two rules are easy to swap" — the table rule comes before any example, and this paragraph carries two separate traps.

### nucleophilic-aromatic — lesson (score 13)
- [H][MISSING DIAGRAM] step 2 "S_NAr: add first, then eliminate" — the Meisenheimer complex, and the charge reaching ortho/para nitro oxygens but never meta, are described in words only. The lesson has no figures.
- [H][MISSING DIAGRAM] step 6 "Benzyne: eliminate first, then add" — "two sp² orbitals lying in the plane of the ring, pointing away from each other" is the key spatial idea, and it is not drawn.
- [M][CONFUSING] step 3 "Which mechanism, if either, can each substrate run?" — it asks students to identify benzyne cases before benzyne is taught (step 6).
- [M][MISSING DIAGRAM] step 3 sorter — the substrates are names only (1-chloro-2,4-dinitrobenzene, 1-chloro-3-nitrobenzene, 2-bromo-1,3-dimethylbenzene). The ortho/meta/para relationships the answers hinge on must be built mentally.
- [M][MISSING DIAGRAM] step 8 "para-Chlorotoluene is treated with NaNH₂" — the benzyne between C3–C4 and the attack at either end give m- vs p-toluidine, all in words.
- [L][CONFUSING] steps 2, 4, 5, 8 titles — the literal "S_NAr"/"S_N1" underscores render as raw text in titles, while the bodies use proper subscripts.

### phenols — notes (score 10)
- [M][MISPLACED/WEAK FIGURE] The ring is strongly activated — the pKa-scale figure (nitrophenols, bicarbonate cut) sits under the activation heading, not under the acidity/substituent sections it illustrates.
- [M][MISSING DIAGRAM] Substituents move it, "One warning about ortho" — the intramolecular O–H···O–N hydrogen bond in 2-nitrophenol is spatial and not drawn.
- [M][MISSING DIAGRAM] Reactions worth knowing, Kolbe–Schmitt — "the sodium ion bridges the phenoxide oxygen and the incoming CO₂" explains the ortho selectivity spatially, and no figure shows it.
- [M][CONFUSING] Reactions worth knowing, Oxidation to a quinone — one paragraph carries reagents, hydroquinone interconversion, cross-conjugation (undefined), HOMO–LUMO colour and ubiquinone. No quinone structure is drawn.
- [L][MISSING DIAGRAM] Reactions worth knowing, Reimer–Tiemann — dichlorocarbene formation and ortho-carbon attack are described in words only.
- [L][CONFUSING] The acidity…, "Two things that look like this section and are not" — two unrelated ideas (benzylic alcohol; phenol vs acid strength) in one paragraph.

### diazonium-chemistry — lesson (score 8)
- [M][CONFUSING] step 6 "Deleting a group is the most useful row on the menu" — it calls the removable amine "a blocking group, in the usual term" and likens it to a malonic ester's second carbonyl. The notes say explicitly that an amine cannot serve as a blocker, so the terms conflict.
- [M][CONFUSING] step 6 bullet list — an abstract three-step recipe ("Install the group you actually want, using the amine to direct it…") with no concrete example. The example only arrives in the final question.
- [M][MISSING DIAGRAM] step 7 "A diazonium salt is treated with phenol" — azo coupling is never taught before this question. Para coupling and the Ar–N=N–Ar′ product exist only in the feedback text, with no drawing.
- [M][MISSING DIAGRAM] step 8 "You need 1,3,5-tribromobenzene from benzene" — the 2,4,6-tribromoaniline → 1,3,5-tribromobenzene renumbering, and why the bromines end up meta to each other, is described in words only.

### birch-reduction — lesson (score 8)
- [H][MISSING DIAGRAM] step 2 "Electron, proton, electron, proton" — "the second protonation happens at the central carbon of the delocalized anion, and that lands the two double bonds 1,4" is the spatial heart of the lesson. It is undrawn, and "central carbon" is never located on a ring.
- [M][MISSING DIAGRAM] step 3 "Where does the substituted carbon end up?" — no product structures for anisole, benzoic acid, toluene or acetophenone. "On a double bond" vs "sp³" must be imagined.
- [M][MISSING DIAGRAM] step 6 "Why you would want a 1,4-cyclohexadiene" — anisole → enol ether → cyclohex-3-en-1-one → cyclohex-2-en-1-one, with double-bond positions, entirely in words.
- [L][CONFUSING] step 4 "Why does the Birch give the 1,4-diene…" — the feedback says protonation is fastest "where the carbanion's charge density is greatest". The notes say explicitly that the three carbons have equal coefficients and the middle one "is not the richest", so a student reading both gets contradictory reasons.

### diazonium-chemistry — notes (score 8)
- [M][MISSING DIAGRAM] Worked example 1,3,5-tribromobenzene — the positional argument (1,2,4 by direct bromination vs 2,4,6-tribromoaniline → 1,3,5) is in words. The hub-map figure only names the target.
- [M][MISSING DIAGRAM] Removing a group is a synthetic tool, sulfonic-acid paragraph — blocking para with SO₃H so the electrophile is forced ortho is spatial and undrawn. The idea also sits off-topic under a heading about removing NH₂.
- [M][CONFUSING] Azo coupling, "The pH is not optional" — one paragraph stacks the phenol pH window, diazotate formation, the aniline pH window with its anilinium reason, and the para/ortho/blocked regiochemistry.
- [L][MISPLACED/WEAK FIGURE] Azo coupling — the diazotize-and-couple figure's top row (aniline + NO⁺ → N-nitrosoamine → ArN₂⁺) belongs with "Three steps to the salt", which has no figure.
- [L][CONFUSING] The substitution menu, copper paragraph — the Cu(I)/Cu(II) single-electron mechanism vs aryl-cation pathways is packed into three sentences with no drawing.

### nucleophilic-aromatic — notes (score 7)
- [M][MISSING DIAGRAM] Route two, "Two products does not always mean two equal products" — 3-methoxybenzyne and why attack at the carbon further from OCH₃ leaves the charge next to O. This is regiochemistry by position, and no figure shows it.
- [M][MISSING DIAGRAM] Route two, "Benzyne's other use is as a dienophile" — the benzyne + furan bicyclic adduct is described only in words.
- [L][MISSING DIAGRAM] opening, second paragraph — "the backside of that carbon is behind the ring" is spatial and undrawn.
- [L][CONFUSING] Route one, "The withdrawing group must be ortho or para" — two ideas in one item: the position rule, and how many nitro groups are needed.
- [L][CONFUSING] Telling them apart, last paragraph "Read the substrate first" — it repeats trap 3 and the figure note almost verbatim.

### benzylic-reactivity — notes (score 7)
- [M][MISPLACED/WEAK FIGURE] Radical bromination, and the reagent that makes it selective — the side-chain-cut figure (hot KMnO₄ → benzoic acid) opens this heading. It belongs under "Oxidation: the whole side chain becomes a carboxyl".
- [M][MISSING DIAGRAM] Substitution at a benzylic position, stereochemistry paragraph — the planar benzylic cation attacked from both faces (racemic) vs backside inversion for (R)-1-phenylethyl bromide. Both are spatial, and neither is drawn.
- [L][MISSING DIAGRAM] opening, third paragraph — benzylic carbon vs ring carbon vs "two bonds out" are distinguished in words. The delocalization figure does not mark these three positions.
- [L][CONFUSING] Substitution at a benzylic position, SN2 paragraph — "the ring's π system stabilizes the transition state" is asserted with no plain explanation or picture of the overlap.
- [L][CONFUSING] Oxidation, final paragraph — "The ring itself survives…" repeats the point already made in the side-chain-cut figure note.

### benzylic-reactivity — lesson (score 6)
- [H][MISSING DIAGRAM] step 1 "One position, one reason, three intermediates" — spreading over "the benzylic carbon plus both ortho positions and the para one" is the whole lesson's idea, and there are no resonance structures. The lesson has no figures.
- [M][CONFUSING] step 5 "What does NBS with light do to ethylbenzene?" — NBS and radical benzylic bromination are never taught in an explain step before this question.
- [L][CONFUSING] step 7 explain-box — it stacks the retrosynthesis point, FC acylation + reduction and alkylation + oxidation in one long sentence.

### phenols — lesson (score 6)
- [H][MISSING DIAGRAM] step 1 "Move an OH onto a ring and it becomes a million times more acidic" — phenoxide charge "onto both ortho carbons and the para carbon" is the core idea, with no resonance drawing. The lesson has no figures.
- [M][MISSING DIAGRAM] step 3 "Place each one on the acidity scale" — 3- vs 4-nitrophenol hinges on para nitro taking the charge onto its own oxygens by resonance and meta not doing so. Nothing shows it.
- [L][MISSING DIAGRAM] step 6 "The same lone pair makes the ring very reactive" — the 2,4,6-tribromophenol substitution positions are named, not drawn.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- birch-reduction lesson step 4 feedback — "protonation happens fastest where the carbanion's charge density is greatest" contradicts the notes, which say correctly that the three charged carbons have equal NBMO coefficients and the central-carbon preference is kinetic, not charge-density.
- birch-reduction lesson step 3, acetophenone row — under Birch conditions an aryl ketone's C=O is itself reduced, so acetophenone is a poor example of clean ring reduction with an sp³ ipso carbon.
- diazonium-chemistry lesson step 6 — the H₃PO₂-removable amine is called "a blocking group, in the usual term". The notes, correctly, say an amine cannot be a blocker: it is a removable directing group. The malonic-ester comparison is also off.
- diazonium-chemistry notes, Substitution menu — Sandmeyer is described as "a chain, not an ionization". It is usually described as a Cu(I)/Cu(II) redox cycle (radical-nucleophilic substitution), not a radical chain. The wording is debatable.
- diazonium-chemistry notes — the opening says EAS reaches I "with an added oxidant", but the menu says I is a group EAS "cannot deliver at all". Internal inconsistency.
- diazonium-chemistry lesson, sorter row d1 — "the only route to an aryl nitrile" is overstated (Rosenmund–von Braun, Pd-catalysed cyanation).

## Chapter 23 — Polymers (score 83)

Note: none of the five Chapter 23 lessons has any figure or inline SVG either.

### addition-polymers — notes (score 16)
- [H][MISSING DIAGRAM] Dienes, and the polymer that keeps its double bond — the 1,4-addition numbering (radical at C1, delocalized to C4, C2=C3 retained) and cis (natural rubber) vs trans (gutta-percha) polyisoprene are described without a figure.
- [M][CONFUSING] The chain reaction, in three stages (Initiation bullet) — the AIBN clause is nested inside the peroxide sentence. "…AIBN, which breaks to two carbon radicals and N2, splits homolytically…" garbles which initiator does what.
- [M][MISSING DIAGRAM] Head-to-tail, and why (PVC worked example) — the chain is written in condensed formulas. The figure shows single addition steps but never a head-to-tail chain beside a head-to-head defect, which is what the exam question asks students to find.
- [M][CONFUSING] The polymers worth recognizing — the monomer table gives structures only as condensed formulas (MMA CH2=C(CH3)CO2CH3, isoprene), so the student must build each shape mentally.
- [M][CONFUSING] Dienes (copolymer paragraph) — uses Tg before it is defined (Tg is taught in polymer-properties) and stacks random, block, SAN, SBR and ABS in one paragraph.
- [M][MISSING DIAGRAM] Tacticity (Ziegler–Natta paragraph) — "Ti–C bond with an empty site beside it; alkene binds, then inserts" is a coordinate-then-insert geometry given in words only.
- [M][MISSING DIAGRAM] Branching, and the two polyethylenes (backbiting) — "curls round into a six-membered arrangement… leaves a butyl branch" has no structure. The packing-architecture figure shows only schematic branched lines.
- [L][CONFUSING] Tacticity (opening paragraph) — the parenthetical on why these are not CIP stereocenters interrupts the definition.

### condensation-polymers — notes (score 12)
- [H][MISSING DIAGRAM] Nylon 6, and why one number is not two — "every amide points the same way" (nylon 6) vs "amides run in opposing pairs, chains register whichever way round" (nylon 6,6) is a spatial argument with no figure. Needs two adjacent chains of each, with the H-bonds drawn.
- [M][CONFUSING] Nylon 6, and why one number is not two (first paragraph) — self-condensation, the industrial caprolactam route and a parenthetical on chain vs step character are stacked in one paragraph.
- [M][MISSING DIAGRAM] Nylon 6 (caprolactam) — "the seven-membered cyclic amide… ring opens onto the chain end" is given in words only.
- [M][MISPLACED/WEAK FIGURE] Kevlar, and what aromatic rings buy — the four-backbones figure writes the rings as "C₆H₄" text, so the para-substitution and straight chain the section argues from are not visible. Kevlar's interchain H-bonds are not drawn; only nylon's are.
- [M][MISPLACED/WEAK FIGURE] Polycarbonates and polyurethanes — the polycarbonate figure labels "the bent joint that stops it crystallizing", but the repeat unit is drawn as a straight line of text, so no bend is shown.
- [L][CONFUSING] opening paragraph — a forward reference to "one exception at the end of this section" delays the point.

### polymer-basics — notes (score 11)
- [M][CONFUSING] Two ways to build a chain (paragraph after the table) — two classification axes, ring-opening and caprolactam are all in one paragraph. The next paragraph then says "condensed out… so it was a step-growth", re-merging the two axes it just separated.
- [M][MISSING DIAGRAM] Two ways to build a chain — caprolactam ("seven-membered cyclic amide") and its ring-opening to nylon 6 are given in words only.
- [M][MISPLACED/WEAK FIGURE] Addition polymerization: one active end — the sites-decide figure (1/2/3 reactive sites → molecule/chain/network) sits under the addition heading. It belongs with the site-counting idea (intro or the three-bottles worked example).
- [M][MISSING DIAGRAM] Addition polymerization (regiochemistry paragraph) — "head-to-tail linking, with all the substituents on alternating carbons" is not shown. The monomer-to-repeat-unit figure shows a single repeat unit only.
- [L][MISPLACED/WEAK FIGURE] monomer-to-repeat-unit figure — the label refers to tacticity, which is not yet defined, and the condensation row sits under the addition heading.
- [L][CONFUSING] Addition polymerization (cationic bullet) — the butyl-rubber/vulcanization aside forward-references material two sections away.
- [L][CONFUSING] opening paragraphs — three definitions are given before any example.

### polymer-properties — notes (score 9)
- [M][MISSING DIAGRAM] Crystalline and amorphous regions — "stretches that lie neatly vs stretches that are tangled" is not drawn. Needs a fringed-micelle sketch with labeled crystalline and amorphous regions.
- [M][MISPLACED/WEAK FIGURE] Thermoplastic against thermoset — the tg-and-tm modulus figure sits under this heading. It belongs under "Two transition temperatures, not one".
- [M][CONFUSING] What lets chains pack — Tg is used in the table and in the fiber/plastic/elastomer paragraph before the next section defines it.
- [M][CONFUSING] What lets chains pack (table, last row) — the row states "bulky side groups → glassy" and then says "but see below, the cause is its atacticity", contradicting itself inside the table.
- [L][CONFUSING] Plasticizers — the elasticity-is-entropy paragraph is stranded at the end of the plasticizer section, away from the cross-link dial it explains.

### addition-polymers — lesson (score 8)
- [H][MISSING DIAGRAM] step 6 "Two structural dials…" — iso/syndio/atactic ("one side", "alternates", "random") is described without the wedge/dash zig-zag chains the notes have.
- [M][CONFUSING] step 6 "Two structural dials…" — tacticity, branching mechanism and LDPE/HDPE are all in one step.
- [M][MISSING DIAGRAM] step 2 "Head-to-tail, by the Markovnikov argument." — the alternating substituent placement is shown only as –[CH2–CHX]–n.
- [L][MISSING DIAGRAM] step 1 "A chain reaction…" — the initiation, propagation and termination stages have no fishhook-arrow drawing.

### polymer-properties — lesson (score 7)
- [M][MISSING DIAGRAM] step 1 "Neither a crystal nor a liquid." — crystalline vs amorphous regions are described only in words.
- [M][CONFUSING] step 2 "This is the fatty acid argument again." — uses Tg before step 4 defines it, and the step-3 sort ("floppy or stiff") depends on it.
- [M][MISSING DIAGRAM] step 6 "Cross-linking is a dial…" — S-bridges between chains and coiled vs stretched chains are not drawn.
- [L][CONFUSING] step 6 "Cross-linking is a dial…" — two ideas (the cross-link dial and entropy elasticity) in one step.

### polymer-basics — lesson (score 6)
- [M][MISSING DIAGRAM] step 2 "Two kinds, told apart by counting atoms." — the monomer → bracketed repeat unit (π bond opening; water leaving) is never drawn anywhere in the lesson.
- [M][CONFUSING] step 7 "Low-density and high-density polyethylene…" — asks about branching, which the lesson never introduced. The idea is taught only in the answer feedback.
- [L][CONFUSING] step 1 "No new reactions in this chapter." — vocabulary comes before any example, plus meta-commentary about the chapter.
- [L][MISSING DIAGRAM] step 3 "What will each of these give?" — chain vs network is not sketched.

### condensation-polymers — lesson (score 6)
- [M][MISSING DIAGRAM] step 1 "Acyl substitution, run repeatedly." — the PET and nylon 6,6 repeat units are never drawn; which atoms join is given only by monomer names.
- [M][CONFUSING] step 2 "A polyamide is a protein backbone…" — three ideas (β-sheet analogy, hydrolysis caveat, recyclability) in one step.
- [M][MISSING DIAGRAM] step 2 and step 5 "What makes Kevlar so strong?" — interchain amide H-bonding and the para-substituted straight chain are described without a figure.

### polymer-design — notes (score 6)
- [M][MISPLACED/WEAK FIGURE] Biodegradable by design — the backbone-decides figure (ester handle vs C–C backbone, recyclability) sits under the biodegradability heading. It illustrates "What happens at the end".
- [M][MISSING DIAGRAM] Biodegradable by design (PLA paragraph) — lactide, "the cyclic diester of two lactic acids", and its ring-opening are given in words only.
- [L][CONFUSING] Reading a polymer backwards (worked example step 5) — one long step stacks the property prediction, the 6T melting/decomposition caveat, 6T/6I copolymers and Kevlar solution spinning.
- [L][CONFUSING] Reading a polymer backwards — the cutting rules are stated before any example (the figure follows them).

### polymer-design — lesson (score 2)
- [M][MISSING DIAGRAM] step 1 "Reading a polymer backwards." — which bond to cut (acyl C–O not O–CH2; C(=O)–N not N–CH2) is given in words only. The notes have the disconnection figure.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- addition-polymers notes, Tacticity — "Radical polymerization gives atactic polymer" in the polypropylene context implies atactic PP is made radically. Propylene gives only oligomers radically (degradative allylic chain transfer). The lesson step 5 feedback says this; the notes do not.
- polymer-basics notes, Two ways to build a chain — "Caprolactam polymerizes at one active end, so it is chain-growth" is stated flatly. condensation-polymers notes correctly qualify that the industrial hydrolytic route has step-growth character. The two pages are inconsistent.
- polymer-design notes, backbone-decides figure caption ("Why PET is the most recycled plastic…"), and condensation-polymers notes, Polyesters ("the most recycled plastic there is") — both assert this flatly and tie it to ester chemistry. polymer-design lesson case 1 correctly says PET's recycling rate is mostly collection and mechanical reprocessing.
- addition-polymers notes, backbiting — "takes the hydrogen five carbons back" is ambiguous. Via the six-membered TS the H is on C5 counting the radical carbon as C1, which is four carbons back.

## Chapter 5 — Alkanes & Conformations (score 76)

### newman — lesson (score 14)
- [H][MISSING DIAGRAM] step 1 "A Newman projection is what you see looking straight down a bond" — the dot, the circle, the 120° spokes and the hidden bond are all described in words only. Needs the notes' "eye on the C–C axis" figure: a bond seen side-on, then end-on, with FRONT and BACK labelled.
- [H][MISSING DIAGRAM] step 5 "Butane has four named conformations" — anti, gauche, Me/H-eclipsed and totally eclipsed are only listed as bullets with angles. Needs the four labelled Newman projections, like the notes' "one rotation, four names" figure.
- [H][CONFUSING] step 6 "A real sample of butane isn't evenly split" — the whole box is one run-on sentence joined by five dashes. It stacks populations, collisions, Boltzmann, the 70/30 split and a chair preview.
- [M][WEAK FIGURE] step 2 "Click the staggered conformation of ethane" — the generated Newman SVGs have no H labels, no front/back labels and no aria-label. The feedback talks about "gray" and "black" lines, which the student has to work out alone.
- [M][MISSING DIAGRAM] step 7 final "Sight down the C2–C3 bond of 2,3-dimethylbutane" — the student has to count gauche pairs among four methyls with no drawing and no scaffold Newman to fill in.
- [L][CONFUSING] step 5 — calls the Me/Me eclipsed form "totally eclipsed" while the notes call it "syn", so the same conformer has two names across the pair.

### newman — notes (score 12)
- [H][MISSING DIAGRAM] Worked example — turning a structure into a Newman projection (2-methylbutane) — steps 3–5 place CH₃/CH₃/H and CH₃/H/H, rotate 60° and count gauche pairs, all in prose. No figure shows the 2-methylbutane Newman or its three staggered conformers.
- [M][CONFUSING] same worked example, step 4 "rotate the back carbon" — step 3 never says where the back methyl starts, so "turn it 60°… one CH₃/CH₃ eclipse" and "back methyl now next to the front carbon's hydrogen" cannot be followed.
- [M][CONFUSING] Staggered versus eclipsed, first paragraph — one paragraph defines the dihedral angle, staggered and eclipsed, then adds the offset drawing convention and its gotcha.
- [M][CONFUSING] Staggered versus eclipsed, the hyperconjugation callout — one paragraph carries torsional strain, the repulsion myth, how σ* arises, hyperconjugation and the 2.9 kcal / 1 kcal-per-pair numbers.
- [M][MISSING DIAGRAM] same callout — the filled C–H σ lined up with an empty C–H σ* on the next carbon (staggered) and the lost alignment (eclipsed) is pure orbital geometry, but no figure shows it. The ethane figure shows bonds only.
- [L][MISSING DIAGRAM] Butane: four named conformations, last paragraph — anti/gauche 1,2-dibromoethane (Br 180° from Br) is described but not drawn.

### axial-equatorial — lesson (score 9)
- [H][MISSING DIAGRAM] step 1 "Axial points up and down; equatorial points outward" — the up/down/up alternation from C1 to C3 is described with no chair drawing. The step 2 chair shows only four unlabeled bonds on purpose.
- [H][CONFUSING] step 3 "A 1,3-diaxial interaction is..." — the term is quizzed but never introduced in any earlier step, and no step shows it.
- [M][CONFUSING] step 4 "A large A-value (like tert-butyl's 4.9)" — "A-value" is quizzed before any step defines it. Step 5 assumes it too.
- [L][CONFUSING] step 5 "Real numbers: methyl vs. tert-butyl" — a long sentence with a parenthetical aside about ΔG = −RT ln K ("you will not need to run it") that delays the point.

### cyclohexanes — lesson (score 8)
- [H][MISSING DIAGRAM] step 5 "The chair hits two targets" — the ~111° angles and the staggered Newman down every ring bond are described with no chair and no Newman. The lesson never draws a chair at all.
- [M][CONFUSING] step 1 "Three separate kinds of strain" — three terms are defined in one paragraph before any ring is shown. That is rule before example.
- [M][WEAK FIGURE] step 2 "Click the most strained of these four rings" — the text says "Each button shows the ring", but the buttons are just names and numbers. No ring is drawn, so 60°/flat/puckered cannot be seen.
- [L][CONFUSING] step 6 — "anti-periplanar E2 elimination" is used without definition.

### ring-flips — notes (score 8)
- [H][MISSING DIAGRAM] Worked example — drawing the other chair — the five steps place axial-up Br on C1 and equatorial-up CH₃ on C2, then flip and re-read, all in prose. The only flip figure shows a single methyl on one carbon, not this two-substituent example.
- [M][CONFUSING] same worked example, "Why the methyl had to go on C2" — one paragraph carries C1/C2 alternation, the C1/C3 same-direction rule, an "impossible molecule" and the cis-1,3 diaxial/diequatorial consequence.
- [M][MISSING DIAGRAM] When the ring cannot flip — the trans-decalin argument (two equatorial fusion bonds becoming anti-diaxial, 180° apart, so the ring cannot close) is purely spatial and has no figure.
- [L][CONFUSING] The pathway, barrier callout — one long paragraph mixes the rate/barrier comparison, orders of magnitude, an inline NMR definition and low-temperature evidence.

### conformational-analysis — lesson (score 7)
- [H][MISSING DIAGRAM] step 5 "Cis or trans decides whether both groups can be equatorial" — the 1,2/1,4 trans versus 1,3 cis reversal is justified by "axial direction alternates" with no chair showing it. The second paragraph then adds both corrections and a worked number.
- [M][MISSING DIAGRAM] step 2 "cis-1-Isopropyl-3-methylcyclohexane. Which chair wins" — the answer depends on chair geometry, but no chair is drawn.
- [M][CONFUSING] same step — it hands over the conclusion ("on a 1,3 pair that puts them both equatorial") before step 5 teaches why, so the question tests reading, not reasoning.

### cyclohexanes — notes (score 7)
- [M][CONFUSING] Where the strain numbers come from, second paragraph — "Strain is compared per ring by total, but the comparison is only fair between compounds with the same formula" is muddled. It mixes up comparing strain with comparing raw heats of combustion, and puts two ideas in one paragraph.
- [M][MISSING DIAGRAM] The other conformations — the boat's eclipsed edges, the twist-boat's twist and the half-chair's four coplanar carbons are described. Only the chair and boat are drawn; the twist-boat and half-chair appear only as energy levels.
- [L][MISSING DIAGRAM] Small rings pay these costs differently — cyclopropane's "bent/banana bonds with density outside the internuclear line" is not drawn.
- [L][MISSING DIAGRAM] same section, "Past six carbons" — transannular H/H contacts across a medium ring are not shown.
- [L][CONFUSING] same section, cyclopentane paragraph — a parenthetical (108° planar against the ~104° in the figure) adds a second idea to the end of the paragraph.

### axial-equatorial — notes (score 4)
- [M][MISSING DIAGRAM] When axial wins anyway — trans-1,2 (ee/aa) against cis-1,2 (always a/e) is a chair-placement claim with no figure here. The cis chair in the cis/trans figure is one frame, not the comparison.
- [L][CONFUSING] Two positions per carbon, second paragraph — strict alternation, the axial/equatorial opposite tilt and the drawing rule are packed into one paragraph.
- [L][CONFUSING] When axial wins anyway, second paragraph — a forward-looking aside on the anomeric effect ("Nothing in this chapter depends on it") delays the point.

### conformational-analysis — notes (score 4)
- [M][MISSING DIAGRAM] Worked example — a 1,3 case, where the rule reverses — cis-1,3-dimethyl diequatorial against diaxial ("the two methyls stare straight at each other") is not drawn. The figures cover 1,2 and 1,4 only, and this is the case the pitfall callout warns about.
- [L][CONFUSING] opening paragraph — meta-commentary ("This section is where the chapter's parts come together…") delays the first concrete example.
- [L][CONFUSING] Multiple substituents: add the axial penalties — the procedure and both correction terms come before any worked example.

### ring-flips — lesson (score 3)
- [M][CONFUSING] step 4 "The pathway between the two chairs passes through which intermediate shape(s)?" — half-chair and twist-boat are quizzed without ever being introduced or drawn in the lesson.
- [L][CONFUSING] step 6 "Reactions can only happen in the chair that has the right geometry" — assumes E2 and the axial-leaving-group requirement, and the chapter link aside reads oddly ("which already depends on this material").

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- conformational-analysis notes, Multiple substituents (paragraph after the table) — calls both corrections "butane's gauche clash turning up on a ring". The 1,3-diaxial CH₃/CH₃ (3.7) is a syn-pentane interaction, not a single gauche clash.
- conformational-analysis lesson, step 2 — the "correct" option says diequatorial wins "by about 3.9 kcal/mol". By the notes' own method (worked 1,3 example, ≈5.4 for two methyls) the diaxial iPr/Me chair is well above 3.9. The feedback admits the extra clash, but the keyed number understates it.
- cyclohexanes notes, Where the strain numbers come from — ring strain as excess over 157.4 kcal/mol per CH₂ is exactly what makes different ring sizes comparable. The "only fair between same formula" caveat applies to raw heats of combustion, not to strain.

## Chapter 21 — Synthesis & Retrosynthesis (score 73)

### retrosynthesis — notes (score 12)
- [H][MISSING DIAGRAM] Where to cut (retron paragraph) — six retrons are named only in words: β-hydroxy carbonyl, α,β-unsaturated carbonyl, 1,3-dicarbonyl, 1,5-dicarbonyl, cyclohexene, and C–C to a carbinol carbon. The student must build each positional pattern mentally, and only the aldol retron is drawn. Needs one small numbered drawing per retron with the bond to cut marked.
- [M][CONFUSING] Where to cut (retron paragraph) — defines "retron" and lists six patterns in one paragraph, with no example molecule for any of them.
- [M][MISPLACED/WEAK FIGURE] three-disconnections figure — it sits under "Knowing when to stop", but it illustrates the 2-phenylbutan-2-ol worked example in the previous section.
- [M][MISSING DIAGRAM] Synthons and their synthetic equivalents, 1st paragraph — the "C–C bond of a secondary alcohol next to the carbinol carbon" disconnection is words only. "Carbinol carbon" is used without a plain-words definition.
- [M][MISSING DIAGRAM] Worked example "two disconnections, and which one to do first" (hexan-3-one) — three retro steps (FGI, then two acetylide cuts) are given only as condensed formulas. Needs the retro chain drawn with the FGI arrow and each cut bond marked.
- [L][CONFUSING] Where to cut, bullet 1 — "a C–C bond β to a carbonyl suggests an aldol" is ambiguous about which bond. It is the Cα–Cβ bond.

### retrosynthesis — lesson (score 8)
- [H][MISSING DIAGRAM] step 3 "Which disconnection does each pattern call for?" — a pattern-recognition sort where the patterns are words only ("an OH two carbons from a C=O", "1,3-dicarbonyl", "cyclohexene"). The lesson has no structures at all.
- [M][MISSING DIAGRAM] step 2 "Synthons are the idea" — "Cut the C–C bond next to the carbinol carbon of a secondary alcohol" has no drawing, and "carbinol" is undefined.
- [M][MISSING DIAGRAM] step 5 "Disconnecting 2-phenylbutan-2-ol at the ethyl group" — name only. The student must draw the molecule to see which bond is meant (the notes' three-cut figure is not reused).
- [L][CONFUSING] step 6 "Where to cut, and when to stop" — the last two paragraphs both state the same stopping rule.

### carbon-carbon-bonds — lesson (score 8)
- [H][MISSING DIAGRAM] step 6 "The two that build rings" — 1,4-/1,5-dicarbonyl to cyclopentenone/cyclohexenone and 1,6-/1,7-diester to Dieckmann rings are given only as numbers. Needs numbered open chains closing to labeled rings.
- [M][MISSING DIAGRAM] step 2 "Count the carbons before you plan anything" (explain-box) — the three attachment sites (carbonyl C, α, β) are spatial and undrawn. The notes' carbonyl-three-sites figure is not reused.
- [M][CONFUSING] step 6, second bullet — two reactions, two retrons and four numberings in one list item.
- [L][CONFUSING] step 1 "There are only about ten ways" — "Ten rather than eight" answers a question never asked, and the list shows seven bullets for ten reactions.

### functional-group-interconversion — notes (score 8)
- [M][CONFUSING] Two kinds of move, 3rd paragraph ("Put the other groups on that ladder") — at least five ideas: halide/ether level, why alkene is at alcohol level, the triangle, ketone-level members, acid-level members and nitrile reduction.
- [M][MISSING DIAGRAM] The moves worth knowing cold ("Read the table for the pairs") — syn vs anti diol, cis vs trans alkene and Markovnikov vs anti-Markovnikov are spatial outcomes. No figure shows any pair except the later propanol regiochemistry panel.
- [M][CONFUSING] Going around rather than through, anti-Markovnikov bullet — about 120 words in one item: the peroxide effect, bromide-only, the chloride/iodide detour, and the configuration/inversion caveat.
- [L][MISPLACED/WEAK FIGURE] fgi-two-axes figure — it sits under "The moves worth knowing cold" rather than beside the ladder explanation it draws. It also omits the ketone-level (alkyne, acetal, imine) and acid-level (nitrile) members that the text places.
- [L][MISSING DIAGRAM] Going around rather than through, "Alcohol to alkene at a specific position" — Zaitsev vs the chosen position is spatial and undrawn.

### multistep-synthesis — notes (score 8)
- [M][MISPLACED/WEAK FIGURE] order-sets-pattern figure (nitration/bromination both orders) — it sits under "Common failures", but it illustrates the "order of substitution sets the pattern" bullet in "Ordering rules that come up repeatedly".
- [M][MISSING DIAGRAM] Ordering rules ("Set stereochemistry with the bond-forming step") and the Common failures stereo bullet — syn dihydroxylation, anti Br₂ addition, one-face hydrogenation and relative vs absolute configuration are all undrawn.
- [M][MISSING DIAGRAM] Worked example "a full route, with the order doing the work" (1-bromo-4-propylbenzene) — no drawing of the route or of the primary-to-secondary cation shift that gives isopropyl.
- [L][CONFUSING] Ordering rules that come up repeatedly — seven rules are stated before any example. The examples arrive after all of them.
- [L][CONFUSING] Common failures, "Stereochemistry asserted rather than set" — about 130 words and three ideas in one bullet (why racemic, the four escapes, relative vs absolute).

### carbon-carbon-bonds — notes (score 7)
- [H][MISSING DIAGRAM] Two reactions that build rings (intramolecular aldol/Dieckmann bullet) — the 1,4/1,5-dicarbonyl and 1,6/1,7-diester relationships and the ring sizes they give are words only. Needs numbered chains shown closing to rings.
- [M][MISSING DIAGRAM] Two reactions that build rings (Diels–Alder bullet) — cis/trans retention of the dienophile, same-face bond formation and endo preference are spatial. The ten-panel figure shows only butadiene + ethene, with no stereocenters.
- [M][CONFUSING] Two reactions that build rings — each bullet is about 100 words carrying three or more ideas.

### protecting-groups — notes (score 7)
- [M][CONFUSING] The two protecting groups worth knowing, amine paragraph — carbamates (Boc/Cbz), their removal, peptide orthogonality and carboxylic-acid protection are all in one paragraph. "Hydrogenolysis" is undefined, and orthogonality is used a section before it is defined.
- [M][MISSING DIAGRAM] Worked example "a protecting group inside a longer route" — condensed formulas plus the name 2-(3-bromopropyl)-2-methyl-1,3-dioxolane. The student must build the protected bromide and the route mentally.
- [M][MISPLACED/WEAK FIGURE] orthogonal-grid figure note — the sentence "Even TBS only tolerates mild acid…" appears twice. Saying mild acid (AcOH/aq THF) is a standard TBS removal also undercuts the grid's claim that mild acid spares TBS.
- [L][MISSING DIAGRAM] The two protecting groups worth knowing (carbamate) — how the carbamate ties up the N lone pair is not drawn. The two-masks figure covers only the silyl ether and the acetal.

### functional-group-interconversion — lesson (score 6)
- [M][MISSING DIAGRAM] step 2 "Read the map for the pairs" — syn/anti diol and cis/trans alkene outcomes have no drawing. The lesson has no figures.
- [M][MISSING DIAGRAM] step 4 / step 9 (final) "propan-2-ol into propan-1-ol" / "OH moved from C2 to C1" — the positional change is never drawn. The notes' propene figure is not reused.
- [M][CONFUSING] step 6 "Going around rather than through", anti-Markovnikov bullet — one long sentence stacking bromide, chloride/iodide and configuration control.

### multistep-synthesis — lesson (score 6)
- [H][MISSING DIAGRAM] step 6 "A full route, with the stereochemistry set by step three" — trans alkene, anti addition via a bromonium opened from the back, and meso vs (3R,4R)/(3S,4S) are all spatial and undrawn.
- [M][MISSING DIAGRAM] step 2 "Ordering rules", aromatic bullet — "the group you attach first decides where the second lands" has no ring drawing. The notes' two-route figure is not reused.
- [L][CONFUSING] step 6, "Retro" sentence — three disconnections chained into one sentence.

### protecting-groups — lesson (score 3)
- [M][MISSING DIAGRAM] step 2 "Two protecting groups, and why they come off differently" — the silyl ether and cyclic acetal are described only in words. The lesson has no structures; the notes' two-masks figure is not reused.
- [L][CONFUSING] step 9 (final) feedback — long, and half-concedes that the two-equivalents option works, which blurs why it is marked wrong.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- functional-group-interconversion notes, "Sideways at one level" table — Wittig (ketone/aldehyde to alkene) is listed as a no-redox sideways move. By the page's own ladder, alkene sits at the alcohol level, so the carbonyl carbon moves down a rung. The Wittig is also a C–C bond formation, not an FGI.
- protecting-groups notes, orthogonal-grid note — it says mild acid spares TBS and then cites mild acid (AcOH/aq THF, HCl/MeOH) as a standard way to remove TBS. The two claims contradict each other, and the sentence is duplicated.
- retrosynthesis notes, hexan-3-one example, last paragraph — cutting the C–C bond next to the ketone gives enolate-alkylation fragments, not "aldol fragments". The target has no β-OH.
- carbon-carbon-bonds notes, Diels–Alder bullet — "the only reaction in this list that sets relative stereochemistry" is overstated. The aldol also creates two stereocenters with defined relative configuration, though it is poorly controlled at this level.

## Chapter 2 — Drawing Molecules & Moving Electrons (score 71)

### resonance — notes (score 16)
- [M][MISSING DIAGRAM] The requirement: conjugation, paras 4-5 ("Work the negative case" / "The same test catches the sp³ break") — the amine vs amide (CH₃CH₂–NH₂ vs CH₃–CO–NH₂) and allyl alcohol vs enol (CH₂=CH–CH₂–OH vs CH₂=CH–OH) pairs are given only as condensed formulas. The p-orbital figure is a generic C chain. Needs the two pairs drawn, with the lone pair and the adjacent π (or the sp³ gap) marked.
- [M][CONFUSING] The requirement: conjugation, para 2 — one sentence lists three arrangements and defines "carbocation" partway through. The definition of "conjugated" comes after it, and no example is given first.
- [M][CONFUSING] Ranking contributors — five ranking rules come before any pair of structures. The ranking figure and the enolate/protonated-carbonyl worked examples only come afterwards.
- [M][CONFUSING] Worked example — ranking the two forms of an enolate, "That is the first of the three moves below" (and "the third move below" in the protonated-carbonyl example) — both use the three moves before the page teaches them. "The three moves" section sits two sections later.
- [M][CONFUSING] What carries forward, last sentence — "The next section teaches the notation for getting from one structure to another" is stale. Curved arrows is the previous section, and the acetate example itself says "the previous section".
- [M][MISSING DIAGRAM] How much stabilization are we talking about? — the allyl cation and the amide C–N resonance that "locks it flat" (peptide planarity) have no drawing. Needs the amide's two contributors and the planar C(=O)–N unit.
- [L][CONFUSING] Legal first, then ranked — three validity tests with no invalid structure drawn (e.g. a five-bond carbon contributor next to a legal one).
- [L][MISSING DIAGRAM] Legal first, then ranked, last para — the benzene Kekulé/Dewar structures and naphthalene's three contributors are counted in words only.
- [L][CONFUSING] Ranking contributors, closing para ("This ranking explains one of the largest acidity differences") — a pKa/acidity idea tucked into the ranking section after the second worked example.
- [L][MISSING DIAGRAM] The three moves, final para — the keto vs enol tautomer (atoms move, ⇌ not ↔) has no drawing beside a true resonance pair.

### curved-arrows — notes (score 15)
- [M][CONFUSING] opening paragraphs — a glossary of four terms (nucleophile, electrophile, leaving group, SN2) and chapter pointers come before the first rule, then "Nothing on this page needs more than these sentences."
- [M][CONFUSING] The two rules, para 4 ("A head may point at two things") — one paragraph carries three ideas: head on an atom means a new bond or a new lone pair, head on a bond means a new π bond, and a full octet means a second arrow.
- [M][MISSING DIAGRAM] The two rules, para 4 — the text calls the C=O π bond collapsing onto its own oxygen "the single commonest arrow in the course", but the rules figure does not show it. Its "head on an atom" panel shows only new-bond formation.
- [M][MISSING DIAGRAM] Worked example 3 — deprotonation (HO⁻ + ethanol) — both arrows and the charge bookkeeping are in prose only. No figure draws them.
- [L][MISSING DIAGRAM] Worked example 2 — NH₃ + H–Cl — the two-arrow proton transfer that "every proton transfer" follows is not drawn. The pattern-3 panel uses HO⁻ + HCl, a different reaction.
- [L][MISPLACED/WEAK FIGURE] figure after Worked example 4 — the figcaption ends with a stray note, "Two arrows, fired at the same instant: hydroxide displaces bromide Without arrow 2…", which is missing its punctuation and repeats the caption.
- [M][CONFUSING] The four patterns — the figure and "Pattern 2 is the one to practice deliberately" come before the paragraph that introduces the four patterns and the numbered list that defines them.
- [M][MISSING DIAGRAM] Spotting invalid arrows — four checks with no drawn wrong arrows. Needs one bad arrow per check: tail on a +, a five-bond product, unbalanced charge, and a δ+→δ− arrow.
- [L][MISSING DIAGRAM] Arrows in resonance versus arrows in mechanism — no side-by-side drawing of an ↔ resonance pair and a → mechanism step using the same arrows.

### skeletal-structures — notes (score 13)
- [M][MISSING DIAGRAM] Charged atoms — the four cases (carbocation, carbanion, O⁻ with one line, N⁺ with four lines) are described in words only. Needs each drawn skeletally, with the hidden H and lone pairs filled in beside it.
- [M][MISSING DIAGRAM] Charged atoms, "Worked example — every atom of skeletal acetate" — the structure is described in words ("double-bonded O above it, O⁻ to the right") and never drawn, though the example is an atom-by-atom read of a drawing.
- [M][MISSING DIAGRAM] Reading one back, "Three more, in the same three steps" — the branched chain (vertex 1…4, branch tip) and methylcyclohexane are read vertex by vertex with no drawing. Only 2-methylbut-2-ene appears in the figure.
- [M][MISSING DIAGRAM] One molecule, several drawings — the text says a rotated, bent or reversed drawing is the same compound but shows no example. Needs one molecule drawn three ways.
- [M][MISSING DIAGRAM] Reading the condensed form, para 1 — CH₃CH(OH)CH₃, (CH₃)₂CH– and (CH₃)₃C– are decoded in prose. Needs each condensed formula paired with its skeletal drawing.
- [L][CONFUSING] Reading the condensed form, para 2 ("Two traps") — both traps are about reading skeletal drawings (O at a bend, H on OH) and sit under the condensed-formula heading. Neither is drawn.
- [L][CONFUSING] Four rules, rule 2 sub-paragraph — covers C=C, terminal CH₂, internal and terminal alkyne in one block. It ends with "the next section is nothing but C=C and C=O", but the next section is about charged atoms.
- [L][CONFUSING] opening paragraphs — two paragraphs of meta-commentary ("a notation nobody has explained yet") before the first rule.

### skeletal-structures — lesson (score 12)
- [H][CONFUSING] step 8 "A student expands a skeletal drawing…" — the stem describes two extra bonds (C written plus two new bonds plus the two original lines), which gives six bonds, not five. The correct option then says "one bond was double-counted". The arithmetic does not match, and the stem is one long multi-clause sentence.
- [H][MISSING DIAGRAM] step 6 "Reading one back, in a fixed order" — the pentan-2-ol worked read ("five-vertex zigzag with an OH on the second vertex") has no drawing, though the lesson already has a pentane SVG helper.
- [M][MISSING DIAGRAM] step 1 "Almost everything from here on…" — butan-1-ol "three ways" is described in words. The notes figure that shows it is not used.
- [M][MISSING DIAGRAM] step 5 "Butan-1-ol is drawn as a zigzag of four line segments ending in OH" — the question is about a drawing that is not shown.
- [L][CONFUSING] step 2 "Four rules…" — all four rules are stated before any structure is shown. The pentane interaction comes only after.
- [L][MISSING DIAGRAM] step 7 "A hexagon with nothing drawn inside or outside it" — the question asks about a drawing without showing the hexagon.

### curved-arrows — lesson (score 5)
- [M][CONFUSING] step 1 "A curved arrow always tracks an electron pair" — opens with a three-term glossary (including carbanion, used only in the final step) and then states the rules. The first example comes a step later.
- [M][MISSING DIAGRAM] step 5 "A different arrow for a different situation: fishhooks" — the one-barb vs two-barb difference is described with no drawing. The notes have the figure.
- [L][MISSING DIAGRAM] step 9 "A carbanion (CH₃⁻…) attacks a carbonyl carbon" — no drawing of the two partners. The feedback's second arrow is also only described.

### resonance — lesson (score 10)
- [M][CONFUSING] step 1 "The real molecule isn't 'flipping'…" — three ideas in one step (definition, the conjugation requirement, the hybrid). The title covers only the last one, and no example is given before the rules.
- [M][MISSING DIAGRAM] step 1 — "p orbitals can line up and overlap" and "adjacent" are spatial ideas with no orbital drawing. The notes' unbroken/broken p-orbital row figure would do.
- [M][CONFUSING] step 2 "Not all resonance structures are equal" — five ranking rules before the student has seen a single pair of contributors drawn. Acetate only appears in step 5.
- [M][MISSING DIAGRAM] step 3 "An enolate has two contributors: CH₂=CH–O⁻ and ⁻CH₂–CH=O" — condensed formulas only. Needs both contributors drawn with formal charges and the connecting arrows.
- [M][MISSING DIAGRAM] step 4 "Three drawings are offered as resonance structures of acetate" — the stem refers to three drawings that are not shown.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- skeletal-structures lesson, step 8 — the bond arithmetic in the stem (two extra bonds) does not give "five bonds" and does not match the "one bond double-counted" key.
- resonance notes, The three moves ("Pi bond broken onto one atom") — says the C⁺/O⁻ form "leaves carbon six electrons short". Carbon is left with six electrons (two short of an octet).
- resonance lesson, step 4 feedback — calls ⁻CH₂–COOH "a tautomer" of acetate. It is a constitutional isomer made by moving a proton. That is loosely defensible, but the notes reserve "tautomer" for keto/enol.

## Chapter 18 — Amines (score 70)

### amine-structure — notes (score 13)
- [H][MISSING DIAGRAM] Two nitrogen heterocycles worth contrasting — pyridine's lone pair "in an sp² orbital in the plane of the ring, pointing outward" vs pyrrole's lone pair as part of the sextet is given only in words. The ranking figure above repeats the claim as a text label and draws no orbitals. Needs a side-by-side orbital picture: pyridine's in-plane sp² lobe and pyrrole's p orbital in the π cloud.
- [M][CONFUSING] Two nitrogen heterocycles worth contrasting, pyridine paragraph — one paragraph carries three ideas: pyridine basicity, the sp³/sp²/sp series (amine, imine, nitrile) and aziridine s-character. Each needs its own paragraph.
- [M][MISSING DIAGRAM] When resonance makes a nitrogen more basic — amidine and guanidine appear only as condensed formulas (R–C(=NH)–NH₂, (H₂N)₂C=NH). The key point is the protonated cation sharing its charge over 2–3 N, and nothing draws it.
- [M][MISSING DIAGRAM] Worked example "which nitrogen takes the proton?" — procaine's structure is described only in words (diethylamino at the end of an ester chain, NH₂ on a ring conjugated to the ester). The student has to build the molecule mentally to follow Step 2.
- [M][MISSING DIAGRAM] Resonance donation, "One refinement" paragraph — O- vs N-protonation of an amide is argued in two long sentences. The O-protonated cation (charge shared over O and N, C–N π kept) is not drawn. The lone-pair-delocalization figure shows only the neutral amide.
- [L][MISPLACED/WEAK FIGURE] Resonance donation — two overview figures are stacked before any prose. The second (unmarked, 1048-wide) duplicates the first, and its caption and figure-note say the same thing twice. It also introduces pyridine before the section that teaches it.
- [L][MISSING DIAGRAM] Nitrogen's lone pair, third paragraph — the claim that diisopropylamine's isopropyl groups "shield the nitrogen from a carbon but not from a proton" is spatial, with no picture. The LDA aside adds a second idea.

### amine-reactions — notes (score 11)
- [M][CONFUSING] SN2 alkylation, "This is a genuine practical limitation" — one paragraph stacks exhaustive alkylation, the Gabriel synthesis and a forward reference to Hofmann elimination. Phthalimide is named but never defined or drawn.
- [M][CONFUSING] Reductive amination — the prose says it "solves the over-alkylation problem completely" and the figure says "nothing is left over to over-react with". The Route B worked example then says over-alkylation "is a real side reaction here too". A student gets two opposite messages.
- [M][CONFUSING] Acylation, "One practical detail" — one paragraph stacks HCl scavenging, Hünig's base, pyridine's nucleophilic catalysis via N-acylpyridinium, and DMAP. DMAP is used without definition and the acylpyridinium is not drawn.
- [M][MISSING DIAGRAM] Diazonium salts, "The sequence is worth running once" — NO⁺ formation, N-attack, N-nitrosoamine, "two tautomerizations" and loss of water are all in words. No figure on this page; the diagram exists only in diazonium-chemistry.
- [L][MISPLACED/WEAK FIGURE] Reductive amination — the runaway-vs-controlled figure opens this heading, before any reductive-amination text. Its alkylation half belongs with the SN2 alkylation section.
- [L][CONFUSING] Acylation, last paragraph — Boc, Cbz and "carbamates" are used with no plain definition.
- [L][CONFUSING] Diazonium salts, last two paragraphs — they repeat each other: the amine as placeholder, and aliphatic diazonium ions being useless (already said in the previous paragraph).

### amine-structure — lesson (score 9)
- [M][MISSING DIAGRAM] step 3 "Why is aniline (pKaH ≈ 4.6) roughly a million times…" — no step draws aniline's lone pair pushed into the ring (o/p resonance structures). The only drawing in the lesson is ethylamine.
- [M][MISSING DIAGRAM] step 4 "Amides take resonance delocalization to the extreme" — amide resonance (N lone pair into C=O, charge on O) is in words only. The step also leans on recall of "the Esters & Amides lesson".
- [M][CONFUSING] step 6 "Alkyl substitution's effect on basicity is real but small" — two very long, parenthesis-stacked sentences. The rule comes with no numbers: the gas-phase order and the aqueous pKaH 10.6/10.7/9.8 are not given as the example.
- [M][MISSING DIAGRAM] step 7 "Pyridine (an aromatic ring with a nitrogen whose lone pair sits in an sp² orbital…)" — the whole question turns on where the lone pair sits relative to the π system, and that is only described in the stem.
- [L][CONFUSING] step 1 "A nitrogen lone pair makes amines the most reliable organic base" — the rule comes first, in long sentences, with meta-commentary ("as this lesson shows"). The ethylamine drawing does not show the pyramidal shape or the lone pair "pointing away" that the text describes.

### hofmann-elimination — notes (score 9)
- [H][MISSING DIAGRAM] The same product, the other geometry: the Cope elimination — the text makes syn-periplanar geometry via "a flat five-membered ring", with the N-oxide oxygen reaching a same-side β-H, the defining contrast. No figure shows it. The only geometry figure is the anti Newman for Hofmann. Needs the amine oxide and its cyclic syn transition state.
- [M][CONFUSING] The Hofmann rule, second paragraph — "E1cb character" is used as the explanation, but E1cb is never defined in plain words (carbanion-like β-carbon, C–H breaking ahead of C–N).
- [M][CONFUSING] Worked example: 2-aminobutane, first paragraph — one paragraph stacks the SN2 at methyl, K₂CO₃ deprotonation between rounds, the "never at a hydrogen" aside and the N–H+1 counting rule.
- [L][MISSING DIAGRAM] The Hofmann rule, third paragraph — the conjugation exception, PhCH₂–CH(NH₂)–CH₃ → PhCH=CH–CH₃, is given only as condensed formulas. The student must build both β positions mentally.
- [L][CONFUSING] opening paragraph — back-references ("the previous section noted in passing…", "settles a question left open…") delay the point.

### hofmann-elimination — lesson (score 9)
- [H][MISSING DIAGRAM] step 2 "The product is the LESS substituted alkene" — the whole rule is spatial: bulky N⁺(CH₃)₃ shields the more-substituted β carbon. The lesson has no figure at all, and the rule comes before any concrete substrate.
- [M][MISSING DIAGRAM] step 1 "An amine cannot eliminate until you change the nitrogen" — "one step, anti-periplanar" with no Newman or E2 arrow drawing.
- [M][MISSING DIAGRAM] step 6 "Structure determination, before there was any other way" — ring opening then a second round to free N (the piperidine case) is in words only.
- [L][CONFUSING] step 2 explain-box — "E1cb character" is used as a label and never defined in plain words.
- [L][MISSING DIAGRAM] step 5 "Exhaustive methylation of 2-aminobutane…" — the feedback identifies C1/C3 β carbons and both alkenes in words, with no structure.

### amine-reactions — lesson (score 8)
- [M][CONFUSING] step 3 "Why does acylation (with an acid chloride) avoid the over-reaction…" — acylation is never taught in an explain step; its first appearance is this question.
- [M][MISSING DIAGRAM] step 4 "Reductive amination: the controlled way…" — the rule comes in two long sentences with no worked example and no drawing of carbonyl + amine → imine → amine.
- [M][CONFUSING] step 1 "Direct SN2 alkylation of an amine is hard to stop…" — one sentence stacks three em-dash clauses (product / better nucleophile because… / sitting in the same flask). There is no concrete amine + halide example.
- [M][CONFUSING] step 6 "Diazonium chemistry reaches the ring positions EAS could not" — one dense box packs formation, the leaving group, Sandmeyer, the directing-group strategy and a forward reference. Ar–N₂⁺ is never drawn.

### amine-synthesis — lesson (score 6)
- [M][MISSING DIAGRAM] step 2 "Three escapes, and what each costs" — Gabriel (phthalimide, imide, hydrazine release) is in words only. The student has no picture of why the imide N cannot react twice.
- [M][CONFUSING] step 3 "Does the carbon count change?" — the sorter tests the Hofmann rearrangement (taught later, in step 6) and the cyanide/LiAlH₄ route (never taught in the lesson) before either appears.
- [L][MISSING DIAGRAM] step 6 "Two more, and what they are for" — the alkyl migration C→N and the loss of the carbonyl carbon as CO₂ are in words only.
- [L][CONFUSING] step 1 explain-box — it packs the three-way classification of escapes and the quaternary-salt exception into one box.

### amine-synthesis — notes (score 5)
- [M][CONFUSING] The problem: alkylation cannot be stopped, "Two honest qualifications" — two separate caveats (tertiary amines are slower; excess ammonia helps) in long sentences, in one paragraph.
- [L][MISPLACED/WEAK FIGURE] Reductive amination — the six-route overview figure sits under this heading rather than at the chapter-level summary or table. Its note says "Read the right-hand column first", but the figure is a radial hub with no right-hand column.
- [L][CONFUSING] Losing a carbon on purpose — "Hofmann rearrangement" is introduced with no warning that it is unrelated to the Hofmann elimination in the next section.
- [L][CONFUSING] The problem, third paragraph — meta-commentary ("The reactions section flagged this and named…") delays the point.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- amine-structure notes, "Two nitrogen heterocycles" — "Same element, same ring size" is wrong. Pyridine is six-membered and pyrrole is five-membered.
- amine-structure notes — the amide basicity drop is "around ten orders of magnitude" in the amine-lone-pair figure note but "eleven" in the lone-pair-delocalization caption. Minor inconsistency.
- amine-reactions notes, Reductive amination — "solves the over-alkylation problem completely" is overstated, and the page's own Route B contradicts it.
- amine-synthesis notes, Worked example 2 Attempt C — cyclohexylamine + formaldehyde + NaBH₃CN "cleanly" gives the N-methyl amine. Formaldehyde reductive amination readily over-methylates to N,N-dimethyl (Eschweiler–Clarke behaviour), so "cleanly" is not true for that variant.

## Chapter 15 — Organometallics (score 69)

### organolithium-reagents — notes (score 12)
- [M][MISSING DIAGRAM] Where RLi succeeds, hindered-ketone paragraph — enolization at the α-H and reduction "by hydride transfer from its own β carbon" (a cyclic six-membered transfer) are described with no figure.
- [M][MISPLACED/WEAK FIGURE] fig:dianion-stops (ester intermediate vs carboxylate dianion) sits under "Deprotonation as the goal". It illustrates the carboxylic-acid-to-ketone case in the previous section.
- [M][CONFUSING] Lithium–halogen exchange paragraph — it opens with meta-commentary ("the only place the course has named it") and packs the definition, the equation, the sp² vs sp³ stability argument, the speed, and t-BuLi stoichiometry into one paragraph.
- [M][CONFUSING] Acetylides, "The substitution is worth dwelling on" — long multi-clause sentences mix E2, Wurtz-type homocoupling, counter-ion identity and the pKa comparison.
- [M][MISSING DIAGRAM] Worked example "cis-pent-2-ene from propyne", step 5 — Lindlar syn addition giving cis and Na/NH₃ giving trans are geometry claims with no drawing of either alkene.
- [L][CONFUSING] third opening paragraph — the bench-handling paragraph stacks pyrophoricity, titre ("titre" undefined) and −78 °C/solvent deprotonation.
- [L][MISSING DIAGRAM] LDA paragraph — "too hindered to attack the C=O" depends on the two isopropyl groups, and no structure of LDA or diisopropylamine is drawn.

### grignard-reagents — notes (score 10)
- [H][MISSING DIAGRAM] The ester problem, Weinreb amide paragraph — the five-membered Mg chelate between O⁻ and the N–OCH₃ oxygen is the entire explanation, and the only structure given is the condensed R–CO–N(CH₃)OCH₃. Needs the tetrahedral chelate drawn, with the ring atoms labelled.
- [M][CONFUSING] opening, second paragraph — one paragraph covers halide reactivity order, the C–F exception, aryl/vinyl scope with a THF caveat, and the "otherwise inert" rule.
- [M][CONFUSING] forward references — the fig:ester-adds-twice caption and the Weinreb paragraph both lean on "the carboxylate dianion in the next section", which the student has not met yet.
- [L][MISSING DIAGRAM] Why the solvent has to be ether — ether coordination to Mg (two ether molecules on the metal) is described but not drawn.
- [L][MISPLACED/WEAK FIGURE] fig:grignard-products (a summary of the 1°/2°/3° alcohol classes) sits under "The ester problem" rather than with the table under "What a Grignard attacks".
- [L][CONFUSING] The ester problem, acyl chloride sentences — "the ester argument does not transfer … it is still reactive enough" is roundabout, and its conclusion is hard to extract.

### cross-coupling — lesson (score 9)
- [H][MISSING DIAGRAM] step 2 "One cycle, three steps" — the catalytic cycle (Ar–Pd–X, Ar–Pd–R, what is bonded to Pd at each stage) is given only as a bullet list. The lesson has no cycle diagram.
- [M][MISSING DIAGRAM] step 3 row x4 (Heck) — syn migratory insertion "on the same face", β-hydride elimination and the trans product are spatial claims with nothing drawn.
- [M][CONFUSING] step 1 "The bond nobody could make" — one long paragraph with two nested asides: a definition of aryl halides with a chapter link, and a parenthetical about SNAr.
- [M][CONFUSING] step 7 MCQ "Which bond here should you cut" — "here" points to a target structure that is never shown.

### cross-coupling — notes (score 8)
- [M][CONFUSING] opening paragraph — a long paragraph with an inline definition, a chapter forward-reference and a parenthetical SNAr aside before the point arrives.
- [M][CONFUSING] One catalytic cycle — the three abstract steps (table, then prose) come before any concrete reaction. The Suzuki example that would anchor them appears two sections later.
- [M][MISSING DIAGRAM] Sonogashira paragraph — two interlocking cycles (Cu acetylide formation by the amine, then transmetalation to Pd) and "bound side-on to copper" are described in words only.
- [L][MISPLACED/WEAK FIGURE] fig:pd-cycle sits under "The named reactions, by what the partner is" rather than "One catalytic cycle, three steps", which is the section it draws.
- [L][CONFUSING] One catalytic cycle — "Ar–OTf" (triflate) is used without definition.

### grignard-reagents — lesson (score 7)
- [M][MISSING DIAGRAM] step 2 "One mechanism, and the electrophile picks the product" — epoxide opening "at the less hindered carbon" with the OH "two carbons further along" is a positional claim with no figure.
- [M][MISSING DIAGRAM] step 4 "Why can an ester not be stopped at the ketone" — the double addition is argued in words only. The notes' fig:ester-adds-twice is not used.
- [L][MISSING DIAGRAM] step 1 — ether lone pairs coordinating to Mg are described but not drawn.
- [L][CONFUSING] step 3 interactive — the substrates are given by name only (propanal, ethyl propanoate), so students must build the structures to count substituents.
- [L][CONFUSING] final feedback — a long paragraph that ends with a Barbier-reaction aside.

### organolithium-reagents — lesson (score 6)
- [M][MISSING DIAGRAM] step 2 "A carboxylic acid to a ketone" — the dianion ("two negative charges on the two oxygens of one carbon") is the whole argument and is not drawn.
- [M][MISSING DIAGRAM] step 6 "Acetylides" — sp-orbital stabilization, and Lindlar cis vs Na/NH₃ trans geometry, are stated with no drawing.
- [L][CONFUSING] step 1, second explain-box — "Which means less selectivity…" hangs off the bench-handling box before it. It reads as a fragment, and it previews content two sections ahead.
- [L][MISSING DIAGRAM] step 4 feedback — "two isopropyl groups on the nitrogen block the approach" is a steric claim with no LDA structure.

### gilman-reagents — lesson (score 6)
- [H][MISSING DIAGRAM] step 2 "An enone has two electrophilic carbons" — the resonance structures, the α/β positions, what "1,2" and "1,4" number, and the enolate are all given in words only. There is no drawing anywhere in the lesson.
- [M][CONFUSING] step 2 — "orbital coefficient" (and "LUMO coefficient" in step 4) is the deciding concept and is never defined in plain words.
- [L][MISSING DIAGRAM] step 6 "And it couples where nothing else will" — "the backside of that carbon is behind a π system" and "double-bond geometry is preserved" are spatial claims with no figure.

### gilman-reagents — notes (score 5)
- [M][MISPLACED/WEAK FIGURE] fig:twelve-fourteen (1,2 vs 1,4 on an enone) sits under "Two: coupling with alkyl halides". It belongs under "One: conjugate addition".
- [M][CONFUSING] One: conjugate addition — "1,2", "1,4" and "largest orbital coefficient" are used without saying which atoms are 1 to 4 or what an orbital coefficient is. The figure labels only α and β.
- [L][MISSING DIAGRAM] Two: coupling with alkyl halides — "coupling to vinyl halides with the double-bond geometry preserved" is not drawn (an E-vinyl bromide giving the E-alkene would show it).

### organometallic-bonding — notes (score 4)
- [L][CONFUSING] opening paragraphs — three short paragraphs of set-up before the one idea (the polarity flip) arrives.
- [L][MISPLACED/WEAK FIGURE] fig:polarity-flip sits under "The family, in order of reactivity" instead of "Bond a carbon to a metal and the polarity flips".
- [L][CONFUSING] The family, in order of reactivity — the heading promises reactivity order, but the table lists Grignard before the more reactive R–Li.
- [L][MISSING DIAGRAM] Worked example "count the equivalents" — 4-hydroxybutan-2-one appears only as HOCH₂CH₂COCH₃. The page's own trap note says the exam "hides the alcohol in a drawn structure", yet no structure is drawn here.

### organometallic-bonding — lesson (score 2)
- [L][MISSING DIAGRAM] step 2 "Bond carbon to a metal and the polarity inverts" — the δ+/δ− flip from C–Br to C–MgBr has no drawing. The notes' fig:polarity-flip would fit here.
- [L][CONFUSING] step 7 — 4-hydroxybutan-2-one is given by name only, so the student has to build the structure to see the OH and the ketone.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- gilman-reagents notes, worked example step 2 — "Oxidation cannot rescue it … PCC does nothing at all" to 1-methylcyclohex-2-en-1-ol. PCC does react with tertiary allylic alcohols (Babler–Dauben oxidative transposition to 3-methylcyclohex-2-enone). The lesson's final feedback says so correctly, so the notes and the lesson contradict each other.
- organometallic-bonding lesson, final question — the graded reason a Grignard and an alkyl halide do not couple is "E2 and side reactions outrun the substitution". The main reason is usually given as Grignards being poor SN2 nucleophiles toward alkyl halides (they are slow; any coupling is mostly Wurtz-type). The rejected option "Grignards are not nucleophilic enough for SN2" is arguably at least as correct. Worth author review.
- grignard-reagents notes and lesson step 1 — "the two lone pairs on the ether oxygen coordinate to it". Each ether oxygen donates one lone pair, and two ether molecules coordinate Mg. As written it suggests both lone pairs of one oxygen bind.
- cross-coupling notes, oxidative addition — the order "Ar–I > Ar–OTf > Ar–Br" is stated as fixed. The Br/OTf order depends on the ligand and conditions (I > Br ≈ OTf is more commonly quoted).
- cross-coupling notes, "Why the partners are aryl and vinyl" — it presents alkyl cross-coupling as simply failing. Modern ligand and Ni systems do couple sp³ partners. Fine for the course level, but "that … is why cross-coupling is an aryl and vinyl reaction" is stated absolutely.
- gilman-reagents notes, What carries forward — "coupling to vinyl and aryl halides where nothing else will" is contradicted by the very next section (Pd cross-coupling).

## Chapter 4 — Acids & Bases (score 63)

### acidity-factors — notes (score 18)
- [H][MISSING DIAGRAM] Worked example — finding the most acidic proton in a molecule — 4-hydroxybutan-2-one is given as CH₃–CO–CH₂–CH₂–OH and then walked site by site as "C1", "C3" and "C4" hydrogens with no numbered structure. Needs the skeletal molecule with C1–C4 numbered and each H type labelled with its pKa.
- [M][CONFUSING] The ARIO framework — four factor definitions come before any example.
- [M][CONFUSING] A — Atom, para 2 — one paragraph covers the size/polarizability argument, the bond-strength alternative, a meta aside about textbooks, and the reconciliation.
- [M][MISSING DIAGRAM] R — Resonance, para 4 — cyclopentadiene → the aromatic cyclopentadienyl anion (charge over five carbons, planar ring) is not drawn.
- [M][MISPLACED/WEAK FIGURE] R — Resonance, 1,3-diketone worked example — the diketone-enolate figure is inserted inside a <p>, mid-sentence ("the workhorse nucleophiles of [figure] Enolate Chemistry: …"). The sentence breaks around the figure.
- [L][MISPLACED/WEAK FIGURE] I — Induction — the induction-distance figure is also inserted inside a <p>, and the text after it repeats the figcaption's trailing point ("That distance dependence is the fingerprint…").
- [M][MISPLACED/WEAK FIGURE] Running the framework on a base, end — the R/I/O paired-anion figure (ethoxide/acetate, acetate/trichloroacetate, ethyl anion/acetylide) sits at the end of the base section, far from the R, I and O sections it illustrates.
- [M][CONFUSING] Running the framework on a base, last para — "Always compare the conjugate bases, not the acids" comes right after a paragraph telling the student to convert bases to their conjugate acids. It also clashes with the pKa page's "Compare acids, not bases".
- [L][CONFUSING] I — Induction table — the chloroacetic acid series is given as condensed formulas (ClCH₂COOH, Cl₂CHCOOH…) without a drawn anion showing where the Cl sits relative to the carboxylate.
- [L][MISSING DIAGRAM] O — Orbital, para 3 — pyridine's sp² lone pair vs an alkylamine's sp³ lone pair is argued without a drawing. It also calls the value "protonated pyridine (pKaH 5.2)", mixing pKa and pKaH.

### acidity-factors — lesson (score 13)
- [H][CONFUSING] step 10 "Draw the deprotonation of ethanol" — the lesson requires a single arrow (O–H bond → O) with no base, "exactly as for a carboxylic acid". The Brønsted notes and lesson say that drawing only that arrow "describes a molecule falling apart on its own".
- [H][MISSING DIAGRAM] step 4 "Induction: pulling on the charge from a distance" — 2-, 3- and 4-chlorobutanoic acid (the Cl moving along the chain) are given only as names. The chain positions are the whole point. The notes' induction-distance figure exists.
- [M][CONFUSING] step 1 "Four questions, in order…" — the ARIO list and its caveats come before any worked comparison. The acetate diagram is not tied to the text.
- [M][MISSING DIAGRAM] step 3 "Resonance: the same charge, spread over more atoms" — phenoxide delocalizing onto ring carbons and the 1,3-diketone anion are described with no drawing. Only acetate is shown.
- [M][MISSING DIAGRAM] step 8 "Orbital effects…" — "closer to the nucleus" for sp vs sp² vs sp³ lone pairs has no orbital or anion drawing.
- [L][CONFUSING] step 5 "Click the more acidic of these two carboxylic acids" — asks the student to "draw the two carboxylate anions in your head" from condensed formulas.

### lewis-acids — notes (score 7)
- [M][MISSING DIAGRAM] Worked example — BF₃ + NH₃ — the empty p orbital "perpendicular to its trigonal planar framework" and the change from trigonal planar to tetrahedral are described, but the figure draws neither the orbital nor the geometry change.
- [M][CONFUSING] Worked example — BF₃ + NH₃, last para — one paragraph covers the nucleophile/electrophile vocabulary preview, the SN2/carbonyl/EAS list, the history of the two vocabularies, and π bonds as Lewis bases.
- [L][MISSING DIAGRAM] The Lewis definition, para 3 — the TiCl₄ coordination expansion from four to five or six ligands on carbonyl binding is not drawn.
- [L][MISSING DIAGRAM] Worked example — BF₃ + NH₃, last para — ethene donating its π pair "above and below the internuclear axis" has no drawing.
- [L][MISSING DIAGRAM] Why this matters for mechanisms — AlCl₃ taking the Cl lone pair of an acyl chloride to form the acylium ion is not drawn.

### bronsted — notes (score 5)
- [M][CONFUSING] The acid is often a cation, last para — three unrelated traps (concentrated vs strong, arrow direction, electronegativity down a column) are packed into one paragraph.
- [L][CONFUSING] Worked example — sodium methoxide + acetic acid, closing para — repeats the nucleophile/electrophile/leaving-group preview already given after the HCl figure, then says "You do not need those words yet."
- [L][CONFUSING] Proton transfers are fast, para 3 — "Not every hydrogen is acidic" (C–H pKa ≈ 50) is a separate idea parked under the speed heading.
- [L][CONFUSING] Which side does the equilibrium favor? — the rule comes before any numbers. The "4 units ≈ 10⁴" guide has no worked pair.

### bronsted — lesson (score 5)
- [M][CONFUSING] step 4 "NH₄⁺ is called the ___ of NH₃" — "conjugate acid" is tested before the lesson defines it. It appears only in the step-2 feedback.
- [M][CONFUSING] step 5 "Every proton transfer is an equilibrium…" — "the stronger acid and stronger base end up as reactants; the weaker acid and weaker base end up as products" reads as if the stronger pair is produced or stays put. Say "the equilibrium lies on the side of the weaker pair".
- [L][CONFUSING] step 1 "Acids give up a proton…" — the definition and the Arrhenius aside come before any example.

### pka — notes (score 5)
- [M][CONFUSING] Predicting which side an equilibrium favors, para 2 — the Keq formula, two worked numbers and the ±10⁶ calibration are stacked in one paragraph.
- [M][MISSING DIAGRAM] The table worth memorizing the shape of — rows like "1,3-diketone α-H", "ketone α-H" and "terminal alkyne C–H" name a hydrogen the student must place mentally. Neither the table nor the ladder figure draws the structure with that H marked.
- [L][CONFUSING] Worked example — can hydroxide deprotonate a terminal alkyne? — "This is exactly why sodium amide … is the reagent specified for making acetylides" appears twice, in the text and again after the figure.

### lewis-acids — lesson (score 4)
- [M][MISSING DIAGRAM] step 4 "Ethene, CH₂=CH₂, has no lone pair anywhere…" — "the pi pair sits above and below the C=C axis" is spatial and not drawn.
- [L][CONFUSING] step 1 "Forget protons…" — the definition and a list of examples come before the BF₃ example.
- [L][CONFUSING] step 5 "Lewis acid-base language covers…", para 2 — "they accept electron density from an electrophile" reads as if the catalyst draws electrons from the product electrophile. It actually binds the substrate (e.g. the acyl chloride's Cl).

### conjugate — lesson (score 3)
- [M][CONFUSING] step 5 "This is the same idea as leaving-group ability, restated" — "Go back to the Leaving Groups lesson from How Reactions Happen" points backward to a chapter that comes after Acids & Bases in learn.html.
- [L][CONFUSING] step 1 "Conjugate pairs differ by exactly one proton" — the conjugate-pair definition and amphoterism (new term) share one step.

### conjugate — notes (score 2)
- [L][CONFUSING] opening paragraphs — meta-commentary about the next section and instructions on how to read pKa values come before the definition.
- [L][CONFUSING] One ranking, read in both directions — four bases (LDA, NaNH₂, NaH, BuLi) are matched to three parent acids (amine 38, H₂ 36, alkane 50), so the pairing is ambiguous.

### pka — lesson (score 1)
- [L][CONFUSING] step 2 "Click the strongest acid of these four" — asks the student to "reason from structure" about anion comfort before the Acidity Factors lesson has taught how.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- acidity-factors lesson, step 10 — one-arrow deprotonation with no base contradicts the two-arrow proton-transfer rule taught in bronsted (notes and lesson).
- acidity-factors lesson, step 5 — chloroacetic acid pKa is 2.87 here but 2.86 in the notes and the lesson's own step 4. Trivial, but inconsistent.
- acidity-factors notes, O — Orbital — "protonated pyridine (pKaH 5.2)" mixes pKa and pKaH. The pyridinium ion's pKa is 5.2, which is pyridine's pKaH.

## Chapter 20 — Spectroscopy (score 56)

### h-nmr — notes (score 13)
- [H][MISSING DIAGRAM] Chemical shift: where a signal appears ("Three entries deserve a note…") — magnetic anisotropy is pure geometry: where the induced field adds to or opposes the applied field, aromatic H on the outside of the ring current, ≡C–H on the axis of the alkyne cylinder. No figure shows it. Needs benzene and an alkyne with induced-field lines and the shielding/deshielding zones marked. The shift-scale figure shows only ranges.
- [M][CONFUSING] Chemical shift: same paragraph — about 180 words carrying five ideas: definition of anisotropy, aromatic ring current, alkene, the alkyne exception, and acid O–H acidity.
- [M][MISSING DIAGRAM] Integration: how many hydrogens (notes-fact) — the diastereotopic substitution test on the C3 hydrogens of 2-bromobutane is given only in words. Needs a drawing that replaces each H with a label and shows the two products as diastereomers.
- [M][CONFUSING] Integration (notes-fact) — one box carries three ideas: rotation equivalence, symmetry (p-xylene) and diastereotopic H. It also says they "split each other" before splitting has been taught.
- [M][CONFUSING] Splitting: which environments are adjacent — the n + 1 rule, the multiplicities and Pascal intensities come as bare rules. The first concrete molecule (ethanol) appears several paragraphs later.
- [L][MISSING DIAGRAM] Splitting ("J values carry their own structural information") — cis/trans alkene J and ortho/meta ring J are spatial. The tree figure shows styrene's vinyl J, but no ring shows which H are ortho or meta.
- [L][CONFUSING] What NMR measures — "upfield"/"downfield" are introduced without saying which side of the printed axis they mean. That only appears in the later figure.

### mass-spec — notes (score 11)
- [H][MISSING DIAGRAM] The McLafferty rearrangement — the molecule curling into a six-membered ring, the γ-H moving to O and the α–β bond breaking are all described in words only. Needs hexan-2-one with α/β/γ labeled, the 6-ring transition state with arrows, and the m/z 58 enol plus propene.
- [M][CONFUSING] The McLafferty rearrangement, 2nd paragraph — leans on "the odd-mass habit", which is never set up on the page. It also stacks the requirement, the even/odd argument, the example and other compound classes in one paragraph.
- [M][MISSING DIAGRAM] Alpha cleavage — which bonds of 2-butanone are "alpha" is given only as condensed text. The spectrum figure shows peaks, not the two cleavable bonds and the resulting acylium fragments (43 vs 57).
- [L][CONFUSING] Two quick reads — the nitrogen rule is stated and justified with no worked number (e.g. CH₃NH₂ = 31).
- [L][CONFUSING] Isotope patterns, 2nd paragraph — 3:1, 1:1, the 9:6:1 derivation, 1:2:1 and 3:4:1 are all packed in one paragraph. The figure covers only one-halogen cases.
- [L][MISSING DIAGRAM] Common losses (m/z 91) — the benzyl-to-tropylium seven-membered ring is described with no structure.
- [L][CONFUSING] The end of the chapter, and what it was for — meta-commentary, with an 80-word sentence that delays nothing useful.

### ir — notes (score 8)
- [M][CONFUSING] Worked example "running the four questions on a real peak list" — it applies "Question 1…4" before those four questions are introduced, in the later section "How to read a spectrum in thirty seconds".
- [M][CONFUSING] The carbonyl region in detail (paragraph after table) — four ideas in one paragraph with long sentences: the resonance ordering, conjugation, ring size, and the s/p-character argument.
- [L][MISSING DIAGRAM] The carbonyl region in detail — the ring-strain argument (squeezed C–C–C angle, more p character in ring bonds, more s in the exocyclic C=O) is angle and orbital geometry with no figure. Needs cyclohexanone, cyclopentanone and cyclobutanone with ring angles and wavenumbers.
- [L][MISSING DIAGRAM] The absorptions worth recognizing ("Two shapes are worth internalizing") — the broad alcohol O–H, the two N–H peaks of a 1° amine vs one for a 2° amine, and the sharp ≡C–H are described only in words. The spectrum figure shows only an acid O–H.
- [L][CONFUSING] What IR measures — "wavenumber" is bolded but never defined in plain words (1/λ, proportional to energy). The dipole-change caveat is squeezed into the same paragraph.
- [L][MISPLACED/WEAK FIGURE] Butanoic acid spectrum — it sits under "The carbonyl region in detail" after both worked examples. Its caption ("What all of the above actually looks like") belongs beside the absorption table and the O–H shape paragraph.

### ir — lesson (score 7)
- [H][CONFUSING] step 4 "The carbonyl stretch is the single most useful signal" — the 2nd paragraph is one sentence with a nested parenthetical about ester induction and the garbled phrase "more like a genuinely single C–O–N-conjugated system". It points to "Esters & Amides and Amine Structure lessons" by name, with no links.
- [M][CONFUSING] step 8 (final) "Compound A 1735 / Compound B 1680" — 1680 is where the notes place a conjugated ketone (acetophenone, 1685). The item asserts "amide" without ruling that out, which contradicts the notes' own worked example.
- [L][CONFUSING] step 1 "A bond is like a tiny spring" — wavenumber is never defined. "Hooke's law" appears in the step 3 feedback without being introduced.
- [L][CONFUSING] step 6 "The fingerprint region" — the whole step is one roughly 70-word sentence.

### h-nmr — lesson (score 6)
- [M][CONFUSING] step 2 "Rank these three hydrogen environments" — aromatic is ranked highest, but step 1 taught only electronegativity. "Ring current" first appears in the feedback and is never defined.
- [M][CONFUSING] step 4 "The n+1 rule" — the rule and Pascal pattern are stated before any example molecule. The step has no worked case.
- [L][MISSING DIAGRAM] step 4 "The n+1 rule" — no drawing of a split multiplet or of which neighbors count. The lesson's only figure is the ethanol structure on step 1.
- [L][CONFUSING] step 7 "2H at 2.3 t, 3H at 1.0 t" feedback — "a propyl group read from its two ends" implies the two triplets couple to each other. Each actually couples to the undetected middle CH₂.

### c-nmr — notes (score 4)
- [M][MISPLACED/WEAK FIGURE] Counting unique carbons (xylene example) — the text counts using ring numbers C1–C6 and, for p-xylene, two perpendicular mirror planes. The figure has no ring numbering and one mirror per ring, so it does not show what the text walks through.
- [L][MISSING DIAGRAM] Chemical shift ranges (alkyne paragraph) — shielding from the "cylindrically symmetric pi system" is spatial and not drawn.
- [L][CONFUSING] Chemical shift ranges (alkyne paragraph) — appeals to "the usual hybridization-versus-shift intuition", which this page never states.

### c-nmr — lesson (score 4)
- [M][MISPLACED/WEAK FIGURE] step 1 diagram (para-xylene) — it sits on the decoupling step. Step 4, which walks the p-xylene symmetry by C1–C6, has no figure.
- [L][CONFUSING] step 1 "Decoupling removes splitting" — the first paragraph is one roughly 80-word sentence with a nested parenthetical.
- [L][CONFUSING] step 6 "DEPT recovers hydrogen-count information" — says CH₃/CH₂/CH become "clearly distinguishable" but never gives the up/down rule. The chemistry is thinned to a claim.

### mass-spec — lesson (score 3)
- [M][CONFUSING] step 6 "Fragmentation patterns are a stability puzzle" — the whole step is one sentence stacking four fragmentation rules with parentheticals and three chapter back-references.
- [L][MISSING DIAGRAM] step 7 "Toluene … tropylium ion" — the seven-carbon delocalized ring cation is described with no structure.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- ir lesson, final question — 1680 cm⁻¹ is presented as clearly an amide, but a conjugated ketone sits at about 1685 (the notes' own acetophenone example). The key needs "no conjugation" or an N–H clue.
- h-nmr lesson, step 7 feedback — the 2.3 t and 1.0 t in a propyl chain are not coupled to each other. The wording suggests they are.
- c-nmr notes, xylene worked example — "nearly identical ¹H spectra" is overstated. p-Xylene's aromatic H is a 4H singlet, while o- and m-xylene give multiplets.
- mass-spec notes, "m/z 91 … near-proof of a benzylic CH₂" — toluene (benzylic CH₃) and any alkylbenzene with a benzylic carbon give 91.
- mass-spec lesson, step 7 stem — says loss of H from toluene's methyl forms tropylium directly. It forms the benzyl cation, which rearranges or equilibrates to tropylium. This is a simplification and should be flagged as one.

## Chapter 11 — Alcohols, Ethers & Related Chemistry (score 55)

### alcohol-reactions — notes (score 11)
- [M][MISSING DIAGRAM] "What each activation does to the stereocenter" worked example ((S)-butan-2-ol → (R)-2-bromobutane) — retention at tosylation, then the umbrella inversion, is described in words only. It needs wedge/dash structures at each stage.
- [M][MISSING DIAGRAM] "Dehydration: elimination of water" (POCl₃/pyridine paragraph) — "removes the β-hydrogen anti-periplanar to it" has no figure of the anti-periplanar arrangement.
- [M][CONFUSING] "Recall: the OH has to be activated first" — one paragraph stacks the pKa argument, both activation strategies and the tosylate stereochemistry, before any example.
- [L][MISPLACED/WEAK FIGURE] "Recall" and "Making a sulfonate ester" — two near-duplicate figures (two ways to activate, then three ways out) show largely the same thing a few lines apart.
- [L][CONFUSING] "Converting alcohols to halides" — the SNi retention caveat appears three times (caption, prose, paragraph). "Delivered to the same face" is never drawn.
- [L][MISSING DIAGRAM] "Dehydration" (3,3-dimethylbutan-2-ol → 2,3-dimethylbut-2-ene) — the shift-then-β-H-loss is in words only. The existing figure ends in the bromide, not the alkene.
- [L][CONFUSING] "Oxidation, in one line" worked example "one alcohol, four products" — the closing claim of "three different answers" to the configuration question does not match the four cases (see chemistry).
- [L][CONFUSING] "Making a sulfonate ester" — the opening and closing sentences are meta/forward-pointing ("that is the next subsection's business").

### ether-chemistry — notes (score 10)
- [M][CONFUSING] "Alkoxymercuration and other routes" — one paragraph carries the mercurinium ion, Markovnikov selectivity, anti addition, demercuration, no rearrangement and the tertiary-ether payoff.
- [M][MISSING DIAGRAM] "Alkoxymercuration and other routes" — the Hg bridge and opening from the opposite face at the more substituted carbon are described with no figure.
- [M][CONFUSING] "Ether cleavage" paragraph 2 — the SN2/SN1/secondary cases and a two-part memorization rule all come in one paragraph, before the worked example.
- [L][MISPLACED/WEAK FIGURE] "Williamson ether synthesis" — the figure splits the "Worked example — planning an unsymmetrical ether" label from its content, and it shows tert-butyl methyl ether (the previous paragraph), not the cyclohexyl ethyl ether in the example.
- [L][CONFUSING] "Why ethers are so unreactive" — a parenthetical aside previewing Grignard/LiAlH₄ interrupts the argument.
- [L][CONFUSING] opening paragraphs — "a good test of whether the last two modules have stuck" is meta-commentary.
- [L][MISSING DIAGRAM] "A safety note worth knowing" — the α-radical stabilized by an adjacent lone pair is described only. The paragraph also stacks four ideas.

### epoxides — notes (score 10)
- [M][MISSING DIAGRAM] "Ring strain makes epoxides reactive" — the 60° ring angles and the bent "banana" bonds bulging outside the triangle need a figure; the text is purely spatial.
- [M][MISSING DIAGRAM] "Making an epoxide" (halohydrin cyclization) — the anti alignment of O⁻ and Br needed for the intramolecular backside closure is not drawn.
- [M][CONFUSING] "Base-catalyzed opening" paragraph 1 — the nucleophile list embeds two forward references ("previewed here and taught in…") in one long sentence.
- [L][MISSING DIAGRAM] "Naming them" — oxirane numbering (O = 1, C2, C3) and the epoxy-prefix example are given only as names.
- [L][MISSING DIAGRAM] "Base-catalyzed opening" (cyclohexene oxide) — the trans-diaxial opening followed by a ring flip is not shown. The figure shows only the final wedge/hash diol.
- [L][CONFUSING] "Acid-catalyzed opening" paragraph 1 — "heterolyze" is used without definition.
- [L][CONFUSING] "Why this matters beyond the exam" — one paragraph covers DNA alkylation, arene oxides, anticancer drugs and the Sharpless epoxidation.

### epoxides — lesson (score 9)
- [M][MISSING DIAGRAM] step 2 (Visualize, "2,2-dimethyloxirane + NaOCH₃") — no structure is drawn. The two click targets are text boxes already labeled "less hindered"/"more hindered", which gives away the answer and shows no geometry.
- [M][CONFUSING] step 2 — base-catalyzed SN2 regiochemistry is tested before any explain step teaches it (step 1 covers only strain).
- [M][CONFUSING] step 4 "Acid flips the target carbon" — two very long sentences with three nested parentheticals.
- [M][MISSING DIAGRAM] step 4 / step 9 — the protonated epoxide, backside attack and anti product are never drawn, yet the final asks for the trans diol.
- [L][CONFUSING] step 8 (arrow step) "A nucleophile has attacked the less hindered carbon" — the wording implies a stepwise SN2 ("cannot keep five bonds"), and the step sits after the acid-catalysis steps.

### ether-chemistry — lesson (score 8)
- [H][CONFUSING] step 3 "The Williamson ether synthesis builds an ether by…" — no step teaches the Williamson synthesis before this MCQ tests it, and the which-half-is-the-alkoxide choice never appears.
- [M][CONFUSING] step 5 "Only strong acid can pry an ether apart" — two dense paragraphs carry pKa arithmetic, SN2/SN1/secondary rules and the excess-HX outcome.
- [M][MISSING DIAGRAM] step 5 — which carbon the halide attacks (backside at methyl vs capture of a tertiary cation) is not drawn.
- [L][CONFUSING] step 6 "Ether inertness is the whole reason…" — it largely repeats step 1.

### alcohol-reactions — lesson (score 7)
- [M][MISSING DIAGRAM] step 4 "Tosylation: a mild alternative that preserves stereochemistry" — the tosylate structure and the retained-then-inverted stereocenter are described only in words.
- [M][CONFUSING] step 4 — long multi-clause sentences stack retention, leaving-group ability and the SN2 set-up.
- [M][MISSING DIAGRAM] step 6 "Alcohol to alkyl halide" — the 1,2-methyl shift and where Br ends up are given only by compound names.
- [L][CONFUSING] step 6 — the HX route and the PBr₃/SOCl₂ route share one step.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- alcohol-reactions notes, "one alcohol, four products" worked example — it says there are "three different answers" to whether C2 keeps its configuration. The cases give inversion (PBr₃), inversion (SOCl₂/py), stereocenter destroyed (dehydration) and net inversion (TsCl then CN⁻), which is two answers.
- epoxides notes, "Naming them" and the worked example — "2-methyl-2,3-epoxybutane" breaks alphabetical order. The IUPAC form is 2,3-epoxy-2-methylbutane.
- epoxides notes, worked example "one epoxide, two products" — "Both products are anti" is not observable here. Each product (3-methoxy-2-methylbutan-2-ol, 3-methoxy-3-methylbutan-2-ol) has only one stereocenter.
- epoxides lesson, step 8 — the stepwise framing of a concerted SN2 ring opening (see above).

## Chapter 17 — Aromatic Chemistry (score 52)

### directing-effects — lesson (score 11)
- [H][MISPLACED/WEAK FIGURE] step 1 "Everything comes down to which resonance form…" — the text is about the arenium resonance forms for ortho, meta and para attack relative to a substituent. The only drawing is para-xylene, which shows none of that. The notes' three-panel figure (ortho/meta/para sigma complexes) belongs here.
- [M][CONFUSING] step 1 — roundabout phrasing ("that substituent sits right on top of one of those resonance forms"). The closing "on (or next to) the substituted carbon" blurs the very criterion being taught.
- [M][CONFUSING] step 4 "Halogens are the exception…" — long multi-clause sentences that stack induction, orbital size, an acid-chloride aside and a lesson cross-reference.
- [M][CONFUSING] step 6 "Meta directors avoid…" — a single long box with nested parentheticals, including one reaching back to the Resonance lesson's ranking rules.
- [M][MISSING DIAGRAM] step 6 — the ortho arenium of nitrobenzene (+ on the carbon bearing NO2) versus the meta arenium is described but not drawn.

### aromaticity — notes (score 10)
- [M][MISSING DIAGRAM] Worked example — the cyclopentadienyl pair, tropylium and cyclopropenyl paragraphs — neither cation is drawn: the seven- and three-membered rings, the empty p orbital and the 6/2 π count. The adjacent figure shows only the C5 species.
- [M][MISSING DIAGRAM] Antiaromatic — the tub shape of cyclooctatetraene, and how puckering breaks p-orbital overlap, is spatial and has no figure.
- [M][MISSING DIAGRAM] Beyond one ring — naphthalene's shared edge and [10]annulene's inward-pointing hydrogens forcing it out of plane are spatial and not drawn.
- [M][CONFUSING] Beyond one ring, first paragraph — fused systems, the caveat about Hückel's rule, annulene naming, [18]annulene and [10]annulene all sit in one paragraph.
- [L][MISSING DIAGRAM] Counting pi electrons correctly — furan's and thiophene's two lone pairs (one in the p orbital, one in the ring plane) are described in words. The figure covers only pyrrole and pyridine.
- [L][MISPLACED/WEAK FIGURE] Why 4n + 2 — the "four requirements" figure sits under this heading; it illustrates the section above.

### directing-effects — notes (score 10)
- [M][CONFUSING] Activators, aniline nitration paragraph — anilinium formation, isomer percentages, oxidation and the acetylation workaround all sit in one paragraph.
- [M][CONFUSING] Halogens, fluorine sentence — about 80 words that stack the orbital match, the rate ranking against I, Cl and Br, and para selectivity.
- [M][MISSING DIAGRAM] Worked example — o-nitroaniline — six steps whose point is positional (block para with SO3H, nitrate ortho to NHAc), with no intermediates drawn.
- [M][MISSING DIAGRAM] Worked example — order of operations, m-xylene sentence — C2 wedged between the two methyls versus C4/C6 needs a numbered ring.
- [L][MISSING DIAGRAM] Meta directors — the NO2 arenium with + on the carbon next to N⁺ is only gestured at in a caption ("the same drawing with NO₂…"). It is never drawn.
- [L][MISSING DIAGRAM] Ortho versus para — crowding at the ortho position next to tert-butyl, compared with methyl, is not shown.

### eas — lesson (score 8)
- [M][MISSING DIAGRAM] steps 1–2 "Aromatic stability is so valuable…" / four-stage ordering — the arenium ion (an sp³ carbon bearing E and H, with the charge spread over three carbons) is never drawn. The only drawing is benzene.
- [M][CONFUSING] step 4 "Five ways to generate a strong enough electrophile" — five reagent systems are packed into two dense paragraphs with long sentences.
- [M][CONFUSING] step 6 "Friedel-Crafts alkylation can rearrange" — a single ~130-word box covers rearrangement, acylium stabilization and the acylate-then-reduce strategy.
- [M][MISSING DIAGRAM] step 6 — the 1,2-hydride shift (primary to secondary propyl cation) and the acylium resonance form are described but not drawn.

### aromaticity — lesson (score 7)
- [M][CONFUSING] step 2 "Classify each ring" — the four rings are given only as verbal descriptions ("cyclic, 8 sp² carbons, planar, 8 pi electrons") that already hand over the criteria. There are no structures to analyze.
- [M][MISSING DIAGRAM] step 5 "Antiaromaticity" — the MO filling pattern (a Frost circle) and the COT tub shape are described in words only. The notes have a Frost figure that could be reused.
- [M][MISSING DIAGRAM] step 1 "Four requirements" — p orbitals lining up and planarity are the point, but the benzene drawing is skeletal and shows no p orbitals.
- [L][CONFUSING] step 5 — long sentences stack the MO pattern, half-filled degenerate pairs and the COT argument.

### eas — notes (score 6)
- [M][MISSING DIAGRAM] The limitations of Friedel–Crafts alkylation, Rearrangement — the 1,2-hydride shift from C2 to C1 (propyl to isopropyl cation) is described in words only.
- [M][MISSING DIAGRAM] The five reactions, and how each electrophile is made — the structures of the electrophiles (Br2·FeBr3 complex, HNO3 → NO2⁺ + H2O, the acylium ion) are described in words. The figure shows only the products.
- [L][CONFUSING] The five reactions, iodination sentences — two ideas (a more electrophilic iodine species, and suppressing HI) in one long sentence.
- [L][MISSING DIAGRAM] Limitations, acylation paragraph — the acylium resonance form (R–C≡O⁺) is not drawn.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- aromaticity lesson, steps 5–6 — COT's tub shape is attributed solely to avoiding antiaromaticity. The notes (correctly) say the tub also relieves angle strain and that COT "is not the cleanest proof". The lesson and notes disagree.
- aromaticity notes, Beyond one ring — "the ten electrons are not circulating in one loop" is misleading, because naphthalene sustains a peripheral ring current. "Electron-rich" is also listed as a reason for aromaticity, but it is not a criterion.
- directing-effects notes, Activators and the aniline figure caption — "activated on the order of 10⁵" and "aniline brominates about 10⁵ times faster than benzene" look strongly understated. Rate factors for bromination of phenol and aniline are many orders of magnitude larger. Worth checking against a source, or dropping the number.
- directing-effects notes, o-nitroaniline step 1 — "There is no way to put nitrogen on a ring directly" is wrong as worded, since nitration does exactly that. It should say there is no direct way to install NH2.
- eas notes, Sulfonation — "uniquely among these, sulfonation is reversible" overstates it. Friedel–Crafts alkylation is also reversible (dealkylation and transalkylation). Sulfonation is the one that is usefully reversible.

## Chapter 13 — Oxidation & Reduction (score 37)

### carbonyl-reduction — notes (score 12)
- [H][MISSING DIAGRAM] Reducing a ketone usually makes a racemic mixture — the text is all about two faces of a flat carbonyl, but the page has no figure of it. It points back to a Carbonyl Chemistry figure instead. Needs a figure of butan-2-one with H⁻ arriving from the top face and from the bottom face, giving (R)- and (S)-butan-2-ol side by side.
- [M][MISPLACED/WEAK FIGURE] Reduction to a methylene — the fig:hydride-once-twice figure (a ketone takes one hydride, an ester takes two) sits under the Clemmensen/Wolff–Kishner heading. It belongs under "Esters and acids take two hydrides", where the text it illustrates is.
- [M][MISSING DIAGRAM] Worked example "one molecule, three reagents" — ethyl 4-oxopentanoate appears only as a condensed formula (CH₃CO–CH₂CH₂–CO₂CH₂CH₃). Needs a skeletal drawing with the ketone and the ester marked, and the product of each of the three reagents drawn.
- [M][MISSING DIAGRAM] Reduction to a methylene, Wolff–Kishner paragraph — the steps after the hydrazone (N-deprotonation, C-protonation, second deprotonation, loss of N₂, carbanion protonation) are given in words only. The figure shows just the hydrazone and the net result, even though its caption says this mechanism "is the one asked about".
- [M][CONFUSING] Two reagents, very different appetites (paragraph after the table) — one paragraph carries three ideas: amide gives amine, alkenes are untouched, and acid chlorides are the NaBH₄ exception. The last point also adds a mechanism.
- [L][CONFUSING] opening figure caption — it cites textbooks ("the arrow Klein, Wade and Clayden all draw"). That meta-commentary delays the point about starting the arrow at the B–H bond.

### oxidation-states — notes (score 8)
- [M][CONFUSING] The working test, third paragraph — one paragraph packs HBr addition, hydration, oxymercuration, hydroboration, bromination, halohydrins, epoxidation, dihydroxylation and hydrogenation. The fig:redox-neutral caption then repeats the same list almost word for word.
- [M][CONFUSING] The carbon oxidation ladder, paragraph after the table — it stacks three ideas: alcohol and halide share a rung, the acyl derivatives share a rung, and the caveat that the number changes (+2 vs +3). The ladder caption repeats the caveat, so the reader sees it twice.
- [M][CONFUSING] Recognizing an oxidant or a reductant on sight — the first paragraph is one long sentence listing Cr(VI)/PCC/Jones, Mn(VII), Os(VIII), O₃, mCPBA and then the reductants. Jones, PCC and Clemmensen are used before this page defines them.
- [L][MISSING DIAGRAM] Worked example "counting on a real molecule" — the four bonds on the starred carbon of ethanol and acetaldehyde are listed in words and condensed formulas only. A small drawing of that carbon with each bond scored (0, −1, −1, +1) would carry the whole method.
- [L][CONFUSING] Selectivity is the whole subject — meta-commentary about the next two sections. It adds no content the reader can use on this page.

### alcohol-oxidation — notes (score 6)
- [M][MISSING DIAGRAM] Worked example "choosing a reagent by what must survive" — pentane-1,4-diol is given only as HO–CH₂CH₂CH₂–CH(OH)–CH₃. The argument depends on seeing which carbinol carbon is 1° and which is 2°. Needs a skeletal structure with the two carbinol carbons labelled and their H counts shown.
- [M][CONFUSING] fig:chromate-ester caption — one paragraph carries at least four ideas: H₂CrO₄ vs CrO₃, the PCC/PDC route, the E2-like step and why a 3° alcohol stops at step 2, and Cr(VI)→Cr(IV)→Cr(III).
- [L][MISPLACED/WEAK FIGURE] fig:chromium-water (the aldehyde → hydrate → acid figure) sits under "The reagents worth knowing". It illustrates the "Why water decides where a chromium oxidation stops" section just above.
- [L][CONFUSING] "Three traps" paragraph — three unrelated points in one paragraph: the alkene is untouched, a diol oxidizes at both ends, and the Jones colour test.

### oxidation-states — lesson (score 4)
- [M][CONFUSING] step 1 "A working test that beats counting electrons" — the rule is stated before any example. The third paragraph then crams in the same nine-reaction list as the notes.
- [M][CONFUSING] step 2 "The ladder, and why it organizes" — the final paragraph holds four ideas: two-electron steps, alcohol and halide on one rung, acyl derivatives on one rung, and the +2/+3 caveat.

### carbonyl-reduction — lesson (score 4)
- [M][MISSING DIAGRAM] step 1 "One mechanism, two appetites" — the hydride attack (H⁻ to carbon, π electrons onto O, alkoxide, protonation) is given in words only. The lesson has no drawing of it.
- [M][MISSING DIAGRAM] step 2 "Why an ester takes two hydrides" — the tetrahedral intermediate, its loss of alkoxide and the second hydride are given in words only. Needs the ketone-vs-ester figure from the notes (fig:hydride-once-twice) or an equivalent.

### alcohol-oxidation — lesson (score 3)
- [M][MISSING DIAGRAM] step 2 "Water decides where a chromium oxidation stops" — the hydrate ("OH and H on the same carbon") is the whole argument, but nothing draws aldehyde → gem-diol → acid.
- [L][CONFUSING] step 2 — "chromate ester" is named but not defined or shown.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- alcohol-oxidation notes, worked example "choosing a reagent", step 4 — it says to "take the secondary alcohol out of play" with TBSCl/imidazole. TBSCl silylates a primary alcohol faster than a secondary one, so this plan protects the wrong alcohol. Also, PCC on a 1,4-diol usually gives the γ-lactone (the 1,4-hydroxy-aldehyde cyclizes to a lactol, which is oxidized again), not the keto-aldehyde stated.
- alcohol-oxidation notes and lesson step 6 — "no oxidant tells two alcohols apart" and "none of these reagents distinguishes a primary alcohol from a secondary one". TEMPO/bleach-type oxidants do oxidize 1° selectively over 2°. Fine as a course-scope simplification, but it is stated as absolute.
- alcohol-oxidation notes, Three traps (3) — the green Cr(III) colour change is read as proof that a 1° or 2° alcohol was present. Aldehydes also reduce Jones reagent.
- carbonyl-reduction notes, "Why the difference" — "Hydride reagents are nucleophiles, not acids or bases in the working sense". LiAlH₄ acts as a base on a carboxylic acid (it deprotonates it first and gives off H₂), so this sentence is misleading.
- oxidation-states lesson, interactive case t1 — "oxidation twice over" suggests two oxidations. It is one two-electron oxidation, counted by two tallies.

## Chapter 8 — Substitution & Elimination (score 30)

### sn2 — notes (score 10)
- [H][MISSING DIAGRAM] Inversion of configuration, Worked examples 2 and 3 ((S)-2-bromobutane + ⁻SH; (S)-2-bromo-1-methoxypropane + ⁻CN) — both hinge on reading a 3D arrangement ("1→2→3 traces counterclockwise", "inverted but the letter stays"). Neither substrate nor product is drawn with wedges and dashes. Needs a before/after wedge drawing for each, with priorities numbered.
- [M][MISSING DIAGRAM] Inversion of configuration, ring paragraph (cis-1-bromo-4-methylcyclohexane → trans thiol) — cis/trans on a ring from backside attack, with no ring drawing.
- [L][MISPLACED/WEAK FIGURE] The two arrows — the SN2-against-SN1/E1 energy-profile figure sits under "The two arrows" and introduces SN1/E1 before either is taught.
- [L][MISPLACED/WEAK FIGURE] Backside attack / Inversion of configuration — two three-frame "umbrella" figures in a row show the same thing; one would do.
- [L][MISSING DIAGRAM] Steric effects, bridgehead sentence — "its backside points into the middle of the cage" needs a bicyclic drawing.
- [L][MISSING DIAGRAM] Steric effects, allylic/benzylic paragraph — the p orbital at the SN2 transition state overlapping the neighboring π is described, not shown.
- [L][CONFUSING] Rate law and solvent — the vinyl/aryl "sp² carbon is closed to SN2" paragraph sits under the solvent heading; it belongs with sterics.

### sn1 — notes (score 6)
- [M][MISSING DIAGRAM] The exceptions the ordering hides, allylic rearrangement (3-chlorobut-1-ene) — the two resonance forms and the two products (but-3-en-2-ol, but-2-en-1-ol) are given only as condensed formulas.
- [L][MISSING DIAGRAM] Worked example 2 (R)-3-bromo-3-methylhexane — the R and S alcohol products are never drawn; the generic tert-butyl attack figure does not show a stereocenter going racemic.
- [L][MISSING DIAGRAM] Two pieces of evidence, "The ion pair" — the leaving anion screening the face it left is spatial and undrawn.
- [L][CONFUSING] Worked example 2, closing line — "for the ion-pair reason in the box above" points to a box that does not exist; the ion pair is explained in a paragraph above and again, in full, a section later.
- [L][CONFUSING] Two pieces of evidence that the cation is real — the heading says two, then "Rearrangement is one. The other two..." — three are given.

### e2 — notes (score 4)
- [M][MISSING DIAGRAM] Zaitsev versus Hofmann — 2-bromo-2-methylbutane with its two kinds of β-H, and the two alkenes (2-methylbut-2-ene against 2-methylbut-1-ene), are never drawn on this page.
- [L][CONFUSING] Zaitsev versus Hofmann — the small-base and bulky-base rules are stated before the one example that grounds them.
- [L][MISSING DIAGRAM] Why geometry matters, syn-periplanar paragraph — the 0° eclipsed alternative is described but only the anti and gauche Newmans are drawn.

### e1 — notes (score 4)
- [M][MISSING DIAGRAM] Zaitsev's rule, "More substituted means one specific count" — mono/di/tri/tetrasubstituted are taught through four condensed formulas (CH₂=CH–CH₂CH₃ ... (CH₃)₂C=C(CH₃)₂) that the student must build mentally. Needs skeletal drawings with the counted groups marked.
- [M][CONFUSING] Where E1 actually shows up — one paragraph carries the dehydration mechanism, reversibility and hydration, then Le Châtelier and distillation, plus a forward reference.

### substrate-effects — lesson (score 4)
- [L][CONFUSING] step 2 "Substrate class rules mechanisms in or out" — the first sentence buries two exceptions (KOtBu E2 on primary; methyl has no β-H) in a long parenthetical.
- [L][CONFUSING] step 6 MCQ neopentyl — asks the student to count β-hydrogens, which no earlier step taught, from a condensed formula only.
- [L][MISSING DIAGRAM] step 7 "Bulky bases and heat" — "reach an exposed, peripheral beta-hydrogen" but not the crowded carbon is spatial; a tert-butoxide approach picture would anchor it.
- [L][CONFUSING] steps 4–5 — the solvent question (framework step 3) is tested, but no explain step says what protic and aprotic solvents do to each pathway.

### substrate-effects — notes (score 2)
- [L][MISSING DIAGRAM] Worked example 6 (neopentyl bromide) — "the only beta carbon is quaternary" is read off a condensed formula; a skeleton with α/β labeled would make it immediate.
- [L][CONFUSING] Step 2, DBU sentence — "an amidine ... two fused rings around the reacting nitrogen" describes a structure in words with no drawing.

#### Chemistry noticed in passing (not part of this pass; to verify before fixing)
- substrate-effects notes, DBU sentence — "almost useless as a nucleophile" is overstated; DBU does act as a nucleophile toward reactive electrophiles (acyl and some alkyl halides). "Weakly nucleophilic, used for elimination" is safer.
