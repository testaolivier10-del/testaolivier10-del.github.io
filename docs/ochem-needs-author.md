# Ochem course: needs author

Items from the ochem readability and diagram pass (`docs/ochem-readability-audit.md`) that need a
human decision or review. Nothing here is guessed. Each item records its status, and once it's
settled, the decision and where it is applied.

Status values:
- **open**: waiting on a decision.
- **decided**: settled, with where the decision is applied.
- **pending review**: the course follows the stated position, but an organic chemistry
  instructor should confirm it.

The rule: teach the position best supported by current evidence and current IUPAC
recommendations. Where course exams commonly expect another convention, the page says so.

## Contested science and conventions

### iupac-2013-primary-check: preferred-name claims not read against the Blue Book
- **Status:** open.
- **Where:** `naming-substituents`, `naming-functional-groups`.
- **What the pages say:** *tert*-butyl is the preferred prefix when unsubstituted (P-29.6). Isopropyl
  is acceptable in general nomenclature when unsubstituted. *sec*-Butyl, isobutyl and neopentyl are no
  longer recommended. The acid-chloride prefix is carbonochloridoyl- (P-65.5). An anhydride has no
  simple prefix of its own (P-65.7). Formic acid, acetic acid, formaldehyde, acetaldehyde, benzoic acid,
  phenol and aniline are themselves the preferred names; for acetone, toluene and styrene the preferred
  names are propan-2-one, methylbenzene and ethenylbenzene.
- **Why open:** the writers and both audit stages agree, but none could open the IUPAC 2013 text itself
  (the IUPAC hosts are blocked from the build environment). The claims rest on reviewers' knowledge and
  on secondary sources. A person should check P-29.6, P-64, P-65.5, P-65.7 and P-66.6.1.
- **Decided (owner, 2026-09-24):** removing the unverified sentence was right; it stays logged here
  until someone checks P-65.
- **Removed rather than guessed:** a sentence saying a chain-end acyl chloride or ester is named with
  chloro-/alkoxy- plus oxo- in the preferred name (3-chloro-3-oxopropanoic acid). It matches the 2004
  provisional P-65.5 example but could not be confirmed, so it is not on the page. Add it back if P-65
  confirms it.

### two-conventions: classic course conventions against IUPAC 2013
- **Status:** decided.
- **Where:** `naming-parent-chain`, `naming-substituents`, `naming-rings-unsaturation`.
- **Position taken:** each page teaches the convention most courses and exams grade by, names it as
  such, and shows the 2013 alternative beside it:
  - The parent chain must contain a C=C or C≡C (2-ethylpent-1-ene). IUPAC 2013 lets length win first
    (3-methylidenehexane).
  - Ring against chain goes by carbon count, with a tie to the ring. IUPAC 2013 always makes the ring
    senior (octylcyclohexane rather than 1-cyclohexyloctane).
  - Complex substituents: classic numbering puts the attached carbon at C1 (1-methylpropyl). IUPAC 2013
    takes the longest chain with the attached carbon as low as possible (butan-2-yl). Both are shown.
  - Common prefixes (isopropyl, *sec*-butyl) are used alongside the systematic ones.
  - "3-methylcyclohex-1-ene" is written in full, and the page notes that the "1" is often dropped.
  - Xylene is used as an everyday name for dimethylbenzene. It is not a 2013 preferred name.
  - Ortho, meta and para are taught alongside 1,2-, 1,3- and 1,4-. IUPAC 2013 prefers the numbers.
- **Decided (owner, 2026-09-24):** keep the classic conventions as the primary teaching, with IUPAC
  2013 shown alongside, as the pages have it.

### stereo-before-stereochemistry: E/Z implied by a drawing
- **Status:** pending review.
- **Where:** `naming-parent-chain`.
- **Note:** but-2-ene is drawn as a zigzag, which is the E isomer, but named without E/Z, because
  stereochemistry comes later in the course. Accept this, or redraw it as a neutral straight line?

### ethyl-acetate-smell: "pear-drop smell"
- **Status:** decided.
- **Where:** `functional-groups`, group table.
- **Decided (owner, 2026-09-24):** cut it. The pear-drop smell is usually attributed to isoamyl acetate,
  not ethyl acetate. The table now reads "Ethyl acetate, a solvent in nail polish".

## Foundations (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### foundations-conventions: drawing and labelling conventions the pages grade by
- **Status:** pending review.
- **Where:** `lewis-structures`, `molecular-geometry`, `hybridization`, `electronegativity`, `bond-polarity`, `formal-charge`.
- **Positions taken, each with the alternative shown or mentioned on the page:**
  - Hypervalent sulfur (H₂SO₄, sulfoxides, sulfones, SO₂) is drawn with S=O. The all-single-bond
    octet drawing (S⁺–O⁻), which bonding calculations favour, is shown beside it.
  - The single-bonded O of acids and esters, the enolate O and amide-like N are labelled sp² by the
    lone-pair-beside-π rule. The measured C–O–H angle (about 106°) sits closer to sp³, and the page
    does not quote that number because it could not be verified. The same rule would also label a
    vinyl or aryl halogen sp², which courses usually leave unlabelled.
  - The ΔEN bands are 0.5 and 1.7. Other books use 0.4/1.8 or 0.4/2.0. C–N (0.49), C–Br (0.41)
    and C–I (0.11) are still treated as polar, and the pages explain this by bond length.
  - Dipole arrows point toward δ−, the chemistry convention. The physics/IUPAC convention runs the
    other way, and the page says so.
  - Diazomethane: H₂C=N⁺=N⁻ is taught as the better structure, and the other contributor is
    mentioned.
  - cis-/trans-2-butene labels in Bonding; the (E)/(Z) names are left to Stereochemistry.
  - "Transition metals, groups 3 to 12": group 12 is not always counted, and the page says so.

### foundations-numbers: values that differ by source or rest on a simplified model
- **Status:** pending review.
- **Where:** `bonding`, `bond-polarity`, `orbitals`, `hybridization`.
- **Notes:**
  - The second π increment (53 kcal/mol) is smaller than the first (64), but no reason is given.
    The subtraction also mixes in the change to the σ bond.
  - The average bond energies come from tables built on atomization enthalpies. The page calls
    them averages of bond energies, which is the usual simplification at this level.
  - Some dipole moments differ slightly by source (CH₃Cl 1.87 vs 1.89 D). The older values are kept.
  - Hund's rule: the pages explain spreading out by repulsion, and do not state the same-spin
    (exchange) part.
  - The 4s/3d caveat (Fe [Ar] 3d⁶ 4s², but Fe²⁺ [Ar] 3d⁶) sits beside the graded Aufbau rule.
  - Aniline's N is "only partly flattened", with no cited angle. The methyl radical is "nearly
    flat".
  - NO's unpaired electron is drawn on N, as usual; in the real molecule it is spread over both
    atoms.

## Carbonyl Chemistry (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### carbonyl-conventions: drawing and naming conventions the pages grade by
- **Status:** pending review.
- **Where:** `aldehydes-ketones`, `nucleophilic-addition`, `acetals`, `imines-enamines`, `wittig-reaction`, `aldehyde-oxidation`.
- **Positions taken:**
  - Acid steps are drawn with H₃O⁺ adding a proton and water removing it, on every Carbonyl page.
    Courses also draw a bare H⁺ or H–A/A⁻.
  - The pages use butan-2-one, the IUPAC 2013 name. "Butanone" still appears on the IR, ¹³C NMR
    and mass-spectrometry pages; switch those when that chapter is rewritten?
  - "NaBH₄, CH₃OH" and "1. NaBH₄ 2. H₃O⁺" are accepted as the same reaction. The binding of the
    alkoxide to boron, and each BH₄⁻ delivering more than one hydride, are not mentioned. The
    hydride arrow starts on the B–H bond.
  - Protonated acetone is called an oxocarbenium ion. Acetal formation is described as "running
    the addition twice", a simplification.
  - Wittig: the page teaches direct [2+2] ring closure to the oxaphosphetane. The betaine is
    shown only as the older picture, and the page says to draw it if a course grades it.
  - Pinnick: chlorous acid (HClO₂) is the oxidant, drawn with full octets (H–O–Cl⁺–O⁻).
  - No mechanisms are given for Tollens', Fehling's/Benedict's or KMnO₄, because they are not
    settled at this level.

### carbonyl-contested: explanations and values that are debated or vary by source
- **Status:** pending review.
- **Where:** `imines-enamines`, `wittig-reaction`, `aldehyde-oxidation`.
- **Notes:**
  - Imines: the pH optimum (about 4–5) moves with the amine's basicity, and the figure is labelled
    a sketch. Benzophenone is the example of a carbonyl with no α-H; benzaldehyde is a common
    alternative.
  - Stork enamine alkylation: methyl halides are no longer listed as working well, because MeI can
    alkylate nitrogen. Allyl and benzyl halides may react at N first and then move to C by a
    3-aza-Cope shift; the page does not go into it.
  - Wittig E/Z selectivity: the page teaches reversibility for stabilized ylides, then notes the
    kinetic (transition-state) view of Vedejs and Aggarwal/Harvey under lithium-free conditions.
    Confirm the hedge wording.
  - The P=O bond energy "about 130–140 kcal/mol" is kept from the old page; literature values vary.
    "Most of the ylide's negative charge stays on carbon" is stated qualitatively.
  - The acyl radical's stabilization by its own C=O is kept in softened form; how to explain it is
    debated.
  - Open-chain glucose is "well under 0.1%", matching the Hydrates page. Literature values run
    about 0.002–0.02%.
  - The copper tests' failure with aromatic aldehydes is stated, not explained.
  - Outside Carbonyl: the Wittig row in the functional-group-interconversion notes still needs
    fixing. It is left for the Synthesis chapter.
