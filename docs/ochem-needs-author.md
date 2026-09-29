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

## Enolate Chemistry (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### enolate-grading: a sort row that courses may grade differently
- **Status:** open.
- **Where:** `enolate-regiochemistry`, lesson sort step.
- **The row:** "LDA in slight excess, then warmed before the halide" is graded kinetic. With no
  proton carrier in the flask (House's equilibration work), a lithium enolate keeps its
  regiochemistry on warming. Many courses grade any "warmed" condition as thermodynamic. Keep the
  row, reword it, or drop it?

### enolate-conventions: explanations the pages grade by
- **Status:** pending review.
- **Where:** `alpha-hydrogens`, `aldol`, `michael-robinson`, `enolate-regiochemistry`, `claisen`.
- **Positions taken:**
  - 1,2- against 1,4-addition is taught with hard/soft (HSAB) and LUMO coefficients, as on the
    Gilman page. HSAB alone is debated. Amines add 1,4 largely because their 1,2-addition is
    reversible, and simple lithium enolates often add 1,2.
  - C- against O-alkylation of an enolate is hedged with "usually", with the soft/hard account.
  - Enolates are drawn with the charge on O in most mechanisms and as the C carbanion in some
    figures (Dieckmann, ring-closing aldol). Both are common.
  - Acid-catalyzed aldol dehydration is taught through the enol; the carbocation route is
    mentioned as an alternative. Which one is graded?
  - Acid α-halogenation: the more substituted enol is more stable and also forms faster. (The old
    "enols equilibrate" reason contradicted the page's own slow step.) "Base tends to halogenate
    the less substituted carbon" is hedged.
  - A(1,3) strain is given as the reason a ketone's enamine forms toward the less substituted side.
  - The Claisen's two-α-H rule is stated for alkoxide conditions. Very strong bases can condense
    esters with only one α-H; the page does not mention it.
  - The bridgehead C=C of the bridged Wieland–Miescher closure is "too strained to form". Such
    alkenes are known but very strained. Confirm the wording.
  - "Acetone + NaOH + heat → mesityl oxide" is kept as the graded answer. In practice it is slow
    and equilibrium-limited, and mesityl oxide is usually made with acid.

### enolate-numbers: values that vary by source or are unverified
- **Status:** pending review.
- **Where:** `alpha-hydrogens`, `ester-syntheses`, `aldol`, `enolate-regiochemistry`.
- **Notes:**
  - Acetone's keto : enol ratio is about 10⁸ (pK_E ≈ 8.3), up from the old page's 10⁶. "A few
    parts per billion" enol is a value in water, not neat acetone; the Alkynes notes use the same
    wording.
  - Pentane-2,4-dione "about 80% enol" depends on solvent (neat about 76–81%).
  - The pKa values (malonate about 13, acetoacetate about 11, ester about 25) are water-scale
    teaching values. DMSO values differ (malonate about 16).
  - The ~90:10 thermodynamic enolate ratio depends on metal and solvent.
  - "A few percent diacetone alcohol at equilibrium" is kept from the old page, unverified.
  - Pentan-3-one polybromination (C2 twice, then C4) is the expected pattern, not measured ratios.

### enolate-scope: things the pages leave out on purpose
- **Status:** pending review.
- **Notes:**
  - Favorskii rearrangement is not taught. The α-halo ketone E2 uses pyridine and heat, and says
    hydroxide is avoided.
  - Krapcho decarboxylation, and α-keto acids losing CO₂ by other routes (enzymes, oxidation).
  - With tert-butyl bromide the page draws E2 by the malonate anion, an idealization. Secondary
    halides do alkylate malonate in useful yield.
  - Lithium enolate + Br₂ can still give some dibromination.
  - The asymmetric proline (Hajos–Parrish) version of the Wieland–Miescher synthesis.
  - A pyrrolidine enamine with CH₃I gives significant N-methylation; no example uses it.

## Reactivity (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### reactivity-conventions: rules and conventions the pages grade by
- **Status:** pending review.
- **Where:** `energy-diagrams`, `carbocations`, `nucleophiles`, `electrophiles`, `leaving-groups`.
- **Positions taken:**
  - Rate-determining step: the pages teach the largest climb from the reactants, or from any
    valley, up to a later peak (the energetic span), and give "the step with the highest
    transition state" as the usual course shortcut, with when it holds. Is the deep-well case
    (TS1 15, intermediate −10, TS2 8) right for this level? In that case step 2 sets how fast
    product forms, while how fast the reactant is used up is set by TS1; the page says so.
  - CH₃O–CH₂⁺ is taught as more stable than a tertiary alkyl cation (the graded convention;
    solution data support it, gas-phase values are close). If a course calls such a cation
    primary, the page's definition of degree needs a heteroatom clause.
  - "1° benzylic ≈ 3°" and "1° allylic ≈ 2°" are teaching approximations.
  - Shifts between equally stable cations do happen; the page teaches the graded rule and states
    the exception. The ring expansion is drawn in two steps, with a note that the shift happens
    as the leaving group departs.
  - SN1 racemization is described as equal amounts of each enantiomer; ion pairing can give some
    excess inversion.
  - Aprotic halide order F⁻ > Cl⁻ > Br⁻ > I⁻ is the graded order; measured orders in some aprotic
    solvents are closer or mixed. The protic order is credited to polarizability plus solvation.
  - tert-Butoxide as a stronger base than hydroxide is the solution-phase convention (it reverses
    in the gas phase).
  - Tosylate and iodide are taught as one top tier of leaving groups, with the order depending on
    the reaction.
  - Sulfonyl groups are drawn with two S=O bonds; the charge-separated S⁺–O⁻ form is not shown.
  - PBr₃ is drawn through R–O⁺(H)–PBr₂ with neutral HO–PBr₂ leaving; SOCl₂ step 1 as a direct
    displacement at sulfur, with retention (SNi) left to the Alcohols chapter. Make the Alcohols
    page's drawings match when that chapter is rewritten.
  - Hyperconjugation is given as a cause of the staggered preference; this is contested.
  - "Resonance usually wins over induction" is a rule of thumb; the halogen-on-a-ring exception is
    named and left to Aromatic Chemistry.

### reactivity-numbers: values that vary by source or were removed
- **Status:** pending review.
- **Where:** `radical-halogenation`, `energy-diagrams`, `carbocations`, `nucleophiles`, `leaving-groups`.
- **Notes:**
  - Bromination 1600 : 80 : 1 is measured near 125 °C and chlorination 5 : 1 at 25 °C. At 125 °C,
    1600 : 1 implies a gap of about 5.8 kcal/mol, a little more than the 5 the page says the
    barrier nearly inherits. The page says bromination is run hot and gives the ratio as "in the
    hundreds to thousands" where it estimates it.
  - The per-hydrogen radical rates are approximate and depend on temperature.
  - The second bromine landing next to the first is explained by the first bromine stabilizing
    the neighbouring radical (a bridged radical). The result is established; the explanation is
    debated.
  - The solvolysis ratio methyl → 3° is "a million or more, depending on the solvent".
  - TsOH pKa is kept at −2.8; sources run from about −2.8 to −6.5.
  - CH₃Br (about 70) and CH₃Cl (about 84 kcal/mol) bond energies should be checked by a person.
  - A "three orders of magnitude" acetone-versus-methanol rate gain could not be verified and was
    removed; an author may add a sourced number.
  - The bromine-versus-chlorine worked example appears on both radical-halogenation and
    energy-diagrams. Decide which page keeps the full version.

## Biomolecules (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### biomolecules-conventions: explanations and classifications the pages grade by
- **Status:** pending review.
- **Where:** `carbohydrates`, `amino-acids`, `peptides-proteins`, `lipids`, `nucleic-acids`.
- **Positions taken:**
  - Carbohydrates: fructose passes Tollens' because base turns it into an aldose through an
    enediol (taught in the lesson before the final question). Some sources say the α-hydroxy
    ketone or the enediol reduces the reagent directly; the page does not say so. A short
    anomeric-effect paragraph is included: keep it at this level? "Mutarotation shows the open
    chain" is kept as the argument.
  - Amino acids: side-chain classes differ between books (glycine, cysteine, tyrosine,
    tryptophan). The page teaches the usual four classes with "such as" examples and says books
    differ.
  - Peptides: the hydrophobic effect is called the largest single force in folding (the standard
    teaching view; some literature disputes it). Cooked egg white is explained as unfolded chains
    tangling; real egg white also forms new disulfide cross-links. "The amide is the least
    reactive acyl derivative"; several texts put the carboxylate below it. Trypsin is said to
    skip Lys/Arg followed by proline. Where "polypeptide" ends and "protein" begins is loose.
  - Nucleic acids: base stacking is taught as the larger contribution to duplex stability, with
    hydrogen bonds choosing the partner. The 2′-O⁻ attack in RNA cleavage is drawn as one step;
    the page does not say whether it is concerted or passes through a five-coordinate
    intermediate. Acid cleavage of the N-glycosidic bond is hedged as mainly for adenine and
    guanine. How much rare tautomers contribute to real point mutations is left open.
  - Lipids: sources disagree on which end of isoprene is the "head"; the page describes the link
    structurally. The cis kink is about 30°, while a flat skeletal drawing shows 60°; the page
    states both. Clotting is credited to the related thromboxanes. The trans-fat sentence is in
    the past tense and does not mention trans fats from ruminants.

### biomolecules-numbers: values that vary by source
- **Status:** pending review.
- **Notes:**
  - Histidine's side chain (pKa about 6) is a few percent protonated at pH 7.4; pI about 7.6.
  - Edman degradation is kept at "roughly thirty residues"; many sources give 30–50.

## Stereochemistry (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### stereo-terms: what "stereocenter" and related words mean here
- **Status:** pending review.
- **Where:** `stereocenters`, `cis-trans-ez`, `prochirality`, `diastereomers`, `rs-configuration`.
- **Positions taken:**
  - "Stereocenter" means a single tetrahedral atom with four different groups (a chirality
    center). C1 and C4 of 4-methylcyclohexan-1-ol are called stereogenic in the wider IUPAC sense
    (swapping two groups gives a stereoisomer) but not stereocenters. The cis-trans-ez page says a
    stereogenic double bond is not a stereocenter, on the same definition. An IUPAC aside on
    stereogenic centers could be added.
  - cis-trans-ez: the distractor "cis-3-methylpent-2-ene" is marked wrong, but it is defensible
    under the convention that reads cis/trans along the main chain.
  - Prochirality: "prochiral" is taught in the center sense. The pitfall mentions the
    whole-molecule usage; the flat-carbon (Re/Si face) sense is taught without the word.
  - Diastereomers: erythro/threo use the classic Fischer definition (erythro → anti in the
    zigzag). Heathcock's aldol usage runs the other way and is not mentioned. Anomers are drawn as
    flat wedge/hash rings, not Haworth projections, which come later in Biomolecules.
  - R/S: Rules 1, 2 and 3 are numbered as most courses do, not as IUPAC 2013 does. The
    "nothing attached" wording leaves out phantom atoms. The walk explores the highest-ranked
    branch first (the hierarchical digraph); some courses compare a whole sphere at once. Both
    give the same answers on every example here. "SN1 gives a racemic mixture" is an
    idealization, and the Enantiomers page gives the real range.
  - Wedge drawings: the stereo drill draws three plain bonds and one wedge or hash, while the
    other pages draw two plain bonds, a wedge and a hash (the only style molecular-geometry
    shows). Should molecular-geometry mention the first?
  - Nitrogen inversion: ordinary amines are called non-separable. Amines with the nitrogen locked
    at a ring bridgehead (Tröger's base) are named as the exception.

### stereo-numbers: values and examples that need a source
- **Status:** pending review.
- **Notes:**
  - Enantiomers: (S)-alanine is +14.5° in 6 M HCl (some sources say 5–6 M) and only about
    +2 to +3° in water. Which diastereomeric salt is less soluble in the ibuprofen resolution is
    not named (believed to be (S,S), unverified). The three-site receptor is a simplified
    teaching model. Chiral chromatography is called the more common route "in the lab" only.
  - Meso: the meso-tartaric acid melting point is not given, because references disagree
    (about 140, 146–148 or 165 °C, depending on hydrate). The page says the chiral pair melts
    at about 170 °C and the meso form melts lower.
  - Chirality: the naproxen (R) toxicity claim was removed as weakly sourced; restore it if a
    source is found. Limonene odors vary by source. Plain 1,1′-binaphthyl racemizing at room
    temperature was kept and needs a source.
  - Prochirality: alcohol dehydrogenase removing ethanol's pro-R hydrogen was kept from the old
    page (a standard example, not re-verified here).

## Carboxylic Acids & Derivatives (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### carboxylic-conventions: drawings and wording the pages grade by
- **Status:** pending review.
- **Where:** `carboxylic-acids`, `esters-amides`, `acyl-substitution`, `acyl-chlorides-anhydrides`,
  `nitriles`, `baeyer-villiger`.
- **Positions taken:**
  - Split between two pages: Esters & amides defines the families, gives a first look at
    add-then-expel, and owns the reactivity ladder, amide resonance and the saponification
    drawing. Nucleophilic acyl substitution covers the mechanism in depth (which group leaves,
    Fischer, acid hydrolysis, ¹⁸O) and links back for the rest.
  - Acid catalysis: mechanisms draw the working acid as CH₃OH₂⁺, with H₂SO₄ named as the
    reagent. Please confirm the form the course grades (H⁺, H₃O⁺ or ROH₂⁺). HSO₄⁻ is present, so
    the warning says only that no strong base forms, not that no anion exists. "Not SN1" is
    qualified to the reactions of this chapter, since acylium pathways exist. The ¹⁸O hydrolysis
    panel ignores exchange between the acid's two oxygens. The ~90 kcal/mol π-bond argument for
    why the C=O re-forms is a teaching heuristic.
  - Direct acid-catalyzed conversion of an amide to an ester is not mentioned; the dependable
    route goes through the acid.
  - SOCl₂: the OH oxygen is drawn attacking sulfur (some courses draw the carbonyl oxygen; both
    reach the same intermediate).
  - Pyridine is described as used in excess, often as the solvent. A one-equivalent claim was
    removed, since the amine is the stronger base.
  - Acidity of acids against alcohols: lesson step 2 credits resonance. The inductive and
    electrostatic view (Siggel/Thomas, Wiberg) is given beside it in the notes.
  - Amide resonance: the classic picture with about 40% C–N double-bond character is taught; the
    Wiberg critique is not shown. "Chlorine donates weakly" leads with 3p–2p overlap; "Cl more
    electronegative than N" holds on the Pauling scale only, and the sentence was removed.
  - LiAlH₄ with an amide: the oxygen leaves bound to aluminum, via an iminium ion. The
    carbonyl-reduction notes still use the shorter "the oxygen leaves" and should be aligned.
  - Nitriles: the hydride intermediates are called "aluminum-bound imines", and the Grignard
    intermediate an "imine anion" (drawn N⁻ with MgBr⁺). Please confirm the naming split.
  - Baeyer–Villiger: taught as protonation, then addition, then deprotonation, with the
    uncatalyzed one-step drawing in a pitfall box (the mechanism in aprotic solvent is debated).
    Migratory-aptitude order differs slightly between texts. "Protect the alkene" has no general
    method at this level.
  - Decarboxylation: the proton-transfer arrow starts from the C=O π bond, not from an oxygen
    lone pair with a fourth arrow.
  - Names: "isopropyl butanoate" is kept beside the IUPAC "propan-2-yl butanoate".

### carboxylic-numbers: values that need a source
- **Status:** pending review.
- **Notes:**
  - Acetic acid: vapor molecular weight near the boiling point (the page says "well above 60").
    The C–OH bond length (the page says only "shorter than an alcohol's 143 pm"). Water's pKa is
    15.7 across the course (some sources use 14.0). TFA and DCA pKa values vary by source.
  - Amine N–H pKa kept at 38 to match the course (methylamine is nearer 40). CH₃CN α-C–H pKa
    "about 25" (31.3 in DMSO).
  - Amides: "N-protonation about seven pKa units worse" and "reactivity spans about 10¹³" are
    kept from the old page and unverified. "DMAP speeds acylation by thousands of times"
    (usually quoted as about 10⁴). The neutral acid is ranked "just above an ester" (texts
    differ).
  - Tertiary halide with cyanide, by solvent, is kept from the old page and unverified. A
    DIBAL-H temperature claim was removed; restore it only with a source.

### carboxylic-moved: facts cut under the taught-before rule, for later pages
- **Status:** to place.
- **Notes:** Electrophilic cyanation of electron-rich arenes (BrCN/AlCl₃, NCTS), aryl amide
  dehydration, SNAr with cyanide and Pd-catalyzed cyanation belong on the aromatic and
  cross-coupling pages. For the IR page: the nitrile 2250 cm⁻¹ band, the anhydride's two C=O
  bands, the acid dimer at 1710 against the free acid at 1760, and the dilution effect. For the
  ¹H NMR page: DMF's two methyl signals merging on warming (restricted C–N rotation). The
  Dakin-type formate exception for aromatic aldehydes was cut from Baeyer–Villiger; restore it
  as a marked preview if wanted.

## Alkenes & Alkynes (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### alkenes-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `alkene-structure`, `addition-reactions`, `markovnikov`, `alkene-oxidation`,
  `hydrogenation`, `alkynes`.
- **Positions taken:**
  - Order across pages: Addition reactions derives and names Markovnikov's rule from carbocation
    stability; the Markovnikov page builds on it. Hydrogenation, which comes first in the course,
    teaches Lindlar and Na/NH₃ alkyne reduction; Alkynes recaps and links back.
  - Na/NH₃: the vinyl radical flips fast and sits mostly trans; the vinyl anion flips slowly and
    keeps that shape until protonated. Both pages use the same two sentences. Some texts credit
    the radical anion instead.
  - Alkene stability is taught through hyperconjugation, with the sp²–sp³ bond-strength view
    beside it; how much each contributes is debated. The hyperconjugation prose says the C–H
    pair "spreads slightly over the double bond" (strictly, into π*, which is not taught yet).
  - Bredt's rule: "cannot be isolated". Anti-Bredt alkenes have been generated and trapped
    briefly (Garg, 2024); the page does not mention this. The "orbitals at right angles" figure
    is an idealization.
  - Hydroboration regiochemistry: sterics, charge and B–H polarity are taught as agreeing (courses
    weight them differently). The stereochemistry of radical HBr addition to
    1-methylcyclohexene is deliberately not stated.
  - Radical HBr: the chain wins only when both propagation steps are fast; with HCl and HI the
    ionic addition competes and wins. Bond strengths (C–Br ≈ 70, H–Br ≈ 87 kcal/mol) are rounded
    averages.
  - Epoxidation: drawn as the spiro butterfly transition state.
  - Ozonolysis: a terminal =CH₂ with O₃, then H₂O₂, is taught as going on to CO₂ (some courses stop
    at formic acid). Hot KMnO₄ is written "hot, concentrated KMnO₄", with no acid or base named.
  - HX + 3-methylbut-1-ene is "a mixture of both chlorides" (the ratio is contested). Lesson step 7
    of Addition reactions says "some" 2-methylbutan-2-ol.
  - Alkynes: one cold equivalent of X₂ "stops" at the dihaloalkene (in practice it often gives
    mixtures). NaNH₂ with heat can also isomerize an internal alkyne toward the terminal one
    (not mentioned). "Not KOH in ethanol" is a course convention (fused KOH near 200 °C works).
  - Names: but-1-ene / but-2-yne style here; the E1 and Bonding pages still use 1-butene style.
    (E)-… is written where IUPAC 2013 gives (3E)-…. Cis/trans is used only when each alkene
    carbon carries one H.
  - The alkynes lesson registers one molecule (`alkynes-propyne-amide`) at runtime; it could move
    into molecules.js.

### alkenes-numbers: values that need a source
- **Status:** pending review.
- **Notes:** The share of trans product from 1,2-dimethylcyclohexene over Pd is not given ("a real
  share"). The cis-but-2-ene dipole is "small" (0.33 D in older texts, 0.25 D in the CRC). The
  alkyne deprotonation equilibrium of about 10¹³ assumes NH₃ pKa 38 (the course value). The C≡C
  bond energy of about 200 kcal/mol is an average (ethyne itself is nearer 230).

## Conjugation (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### conjugation-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `conjugated-systems`, `diene-addition`, `kinetic-thermodynamic`, `diels-alder`, `uv-vis`.
- **Positions taken:**
  - Order across pages: Diene addition gives the diene facts (ratios, the warming experiment,
    why each product wins) and points ahead; Kinetic vs thermodynamic control owns the general
    definitions. Enolates and sulfonation appear there only as a marked preview.
  - E2 is described in the page's own terms: the Hofmann alkene is the kinetic product, E2 is
    always under kinetic control, and heating never switches it. Some courses avoid these
    words for reactions that cannot reverse.
  - Why 1,2-addition is faster: the charge argument is graded; the ion-pair proximity effect is
    mentioned beside it. Br₂ with buta-1,3-diene is drawn as a bromonium opening to an allylic
    cation (the real intermediate may be a lopsided bromonium, with some direct SN2′ 1,4-attack);
    the Br₂ cold/warm trend is given without numbers (literature roughly 54:46 at −15 °C to
    10:90 at 60 °C). The penta-1,3-diene "same product either way" is true of constitution only.
  - Butadiene's short C2–C3 bond: conjugation is the graded reading; the page says sp²
    hybridization also contributes and the split is debated. ψ₁ is said to have "no node between
    the carbons". The s-cis cost of 12 kJ/mol is for the skewed minimum.
  - Diels–Alder: endo selectivity is taught with a hedge (secondary orbital interaction is the
    usual explanation; the contributions are debated). Regiochemistry uses the resonance and
    partial-charge model, not orbital coefficients; "the 1,3 product is never the main one" is a
    generalization with exceptions. Three pericyclic classes are named (some texts give five).
    Names kept for course consistency: propenal and propenenitrile (IUPAC prop-2-enal,
    prop-2-enenitrile); "cis" rather than a rel-(1R,2S) descriptor.
  - UV-Vis: the course grades the Woodward–Fieser acyclic diene base as 217 nm and names 214 once.
    The dye question keys "orange" for a broad band at 420–490 nm.

### conjugation-numbers: values that need a source
- **Status:** pending review.
- **Notes:** (E,E)-hexa-2,4-diene about 227 nm; cyclohexa-1,3-diene about 256 nm; cholesta-3,5-diene
  about 235 nm (against a 234 nm prediction). Butadiene's delocalization energy is kept at
  15 kJ/mol to match the hydrogenation page (gas-phase data give about 17). Allene's heat of
  hydrogenation is given as 298 kJ/mol (NIST about 295).

## Aromatic Follow-Through (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### aromatic-ft-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `nucleophilic-aromatic`, `benzylic-reactivity`, `phenols`, `birch-reduction`,
  `diazonium-chemistry`.
- **Positions taken:**
  - Nucleophilic aromatic substitution: benzyne formation is drawn in two steps (some courses
    draw it as one concerted step). 3-Methoxybenzyne's selectivity is explained by inductive
    carbanion stability, with one sentence on aryne distortion. The SNAr halide order
    F > Cl > Br > I is "usually given"; Cl, Br and I are often close. In the methylamine example
    the Meisenheimer complex may lose H⁺ before F⁻ leaves; both orders give the same product,
    and the page shows F⁻ leaving first. Fluorobenzene is said to barely react with NaNH₂ and
    to need a stronger base such as an organolithium (Roberts, JACS 1956; not checked against
    the paper here).
  - Benzylic reactivity: the hydrogenolysis rationale ("the fragment is stabilized by the ring")
    simplifies the Pd surface mechanism. "A primary benzylic cation is about as stable as a
    tertiary one" depends on the measure used. Toluene nitration gives more ortho than para
    (about 58 : 38); the worked example says both form and the para isomer is separated.
  - Phenols: the Kolbe–Schmitt mechanism is debated, so the page states only the C–C bond that
    forms. Benzoquinone's color is described with HOMO–LUMO wording (strictly an n→π*
    band). Phenol to benzoquinone with dichromate is low-yielding; Fremy's salt is named. The
    Dow process (NaOH, 350 °C) is said to run "at least partly through benzyne"; ¹⁴C labeling
    shows part benzyne, part direct displacement.
  - Birch reduction: protonation at the central carbon is taught as the observed rate
    preference (simple Hückel theory gives equal charge at C2 and C4; many texts credit C4 with
    slightly more). The first protonation site of a donor ring (ortho or meta for anisole) is
    debated and not stated. Methyl benzoate is the ester example, with t-BuOH at −78 °C, since
    excess Na and EtOH can reduce the ester itself (Bouveault–Blanc).
  - Diazonium chemistry: the KI reaction is described as "iodide starts the radical steps
    itself" (sources vary). Primary and secondary aryl amines often couple on nitrogen to give
    triazenes, so the page couples only N,N-dimethylaniline. Ipso coupling that displaces COOH
    or SO₃H is not mentioned. The aryl-cation sentence is limited to "of the reactions in this
    course"; aryl cations also form by photolysis of aryl halides and in other rare ways.
  - Names kept as accepted rather than 2013 IUPAC preferred: cumene/isopropylbenzene,
    1,4-dihydroxybenzene, p-benzoquinone, 4-(phenylazo)phenol, 3,5-dibromotoluene,
    2- and 4-chlorotoluene, 3-bromoanisole, 4-nitrotoluene.

### aromatic-ft-numbers: values that need a source
- **Status:** pending review.
- **Notes:** benzylic C–H bond dissociation energies of about 90 kcal/mol (toluene) and 87
  (ethylbenzene), against 101 (primary) and 96 (tertiary); literature for ethylbenzene is about
  85–87. Carbonic acid pKa is given as 6.4 (the apparent value; the true value is about 3.6).
  Water's pKa follows the course convention of 15.7. Diazo-coupling pH windows (phenols 8–10,
  amines 4–7) and "decomposes above about 5 °C" are kept.

## Polymers (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### polymers-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `polymer-basics`, `addition-polymers`, `condensation-polymers`, `polymer-properties`,
  `polymer-design`.
- **Positions taken:**
  - Ownership across pages: What a polymer is owns the two classifications (atom count, and
    chain-growth against step-growth), conversion p and 1/(1−p), caprolactam, thermoplastic and
    thermoset, and why head-to-tail addition wins. The later pages recap and link.
  - Polyethylene's repeat unit is drawn the course way, –[CH₂–CH₂]–n, with IUPAC's –[CH₂]–n
    beside it. Degree of polymerization means monomer units per chain (what 1/(1−p) counts); for
    an AA + BB polyester the bracket n is half that. The 99% row reads "borderline: a weak,
    brittle solid". Alkyds are no longer named; glyptal is kept as a coating resin.
  - Caprolactam: the base-started route is chain-growth; the water-started industrial route is
    step-growth (water first opens some rings to 6-aminohexanoic acid).
  - The vinyl chloride radical is described by its position (on the carbon carrying Cl, next to
    its lone pairs), not as "secondary". The page's R/S pitfall explains why polypropylene's
    methyl-bearing carbons get no labels. Natural rubber is made by enzymes in the tree and only
    has the 1,4-addition structure.
  - The random-copolymer rule (one Tg, between the homopolymers') and a SAN against polystyrene
    Tg comparison were removed as unsourced or untaught; either could return to Structure and
    properties with a source.
  - The vulcanization mechanism (radical or polar, and the role of accelerators) is contested, so
    the pages say only where the sulfur bridges attach. The Tg/Tm rule of thumb is said to fit
    PET and nylon 6,6, with polyethylene falling below it. A loaded rubber band contracts on
    heating only when well stretched (thermoelastic inversion near 10%).
  - The nylon 6 against nylon 6,6 melting-point reason (hydrogen-bond registry in a flat sheet) is
    taught as "one reason usually given". The urethane mechanism is drawn stepwise; many sources
    treat it as concerted or alcohol-assisted.
  - Polymer design treats epoxy as amine-cured (so "neither ester nor amide"); anhydride-cured
    epoxies contain esters. A clear PET bottle is still partly crystalline, with crystallites too
    small to scatter light. Pyrolysis is said not to be recycling back to monomers.

### polymers-numbers: values and claims that need a source
- **Status:** pending review.
- **Notes:** HDPE Tg is kept at −120 °C (literature ranges from about −130 to −20 °C). Atactic
  polypropylene Tg about −15 °C. Butyl rubber isoprene "one or two percent" (typical grades
  about 0.5–2.5 mol%). Nylon 6,T melting point about 370 °C, kept from the original page. "Most
  recycled PET goes the mechanical route" and "PLA shows almost no measurable breakdown in
  seawater after more than a year" are uncited.

## Alkanes & Conformations (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### alkanes-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `newman`, `cyclohexanes`, `axial-equatorial`, `ring-flips`, `conformational-analysis`.
- **Positions taken:**
  - Order across pages: Cyclohexanes owns the conformer path (chair → half-chair → twist-boat →
    boat and back); Axial/equatorial treats the two chairs of one compound as conformations by the
    Newman test and never reasons from a flip; Ring flips owns the flip; Conformational analysis
    owns disubstituted rings, including the 1,2 "one must be axial" cases.
  - Chair drawings: C1 is the headrest (far right, tipped up) and C4 the footrest. A flipped chair
    keeps both ends and swaps the middle carbons in pairs, so it shows the same molecule's other
    chair. A plain top-to-bottom reflection draws the mirror-image molecule; the already-published
    `cis-trans-ez` ring-flip figures use it (their up/down and axial/equatorial readings are still
    right) and should be redrawn.
  - The ethane barrier is explained both ways (repulsion and hyperconjugation), and no question
    grades the cause. The σ* orbital is drawn without claiming which lobe is larger.
  - The Boltzmann distribution is named without a formula; confirm that level suits chapter 5.
  - Conformer energies come from additive interaction costs. For 2,3-dimethylbutane this gives
    1.8 against 2.7 kcal/mol, while experiment puts anti and gauche close; the final says "adding
    up the interaction costs gives".
  - The half-chair is taught as the transition state between a chair and a twist-boat;
    computation puts the true transition state between a half-chair and an envelope. A chair with
    tert-butyl axial likely twists; the pages treat it as a chair.
  - The claim that β-glucose's all-equatorial chair is one reason glucose is widespread was removed
    as unverified.

### alkanes-numbers: values that need a source
- **Status:** pending review.
- **Notes:** ring strain from the page's own subtraction: 27.6, 26.3, 6.5, 0.1, 6.4 kcal/mol for
  C3–C7 and 10 for cyclooctane (another common set is 27.5 / 26.3 / 6.2 / 0 / 6.2); the epoxides
  pages and the cyclohexanes questions now use this set. Boat 6.5 (sources 6.4–7.1), half-chair
  10.8 (10–11), twist-boat 5.5. Syn butane drawn at about 5 (sources 4.5–6). A-values: OH 0.9
  (0.6–1.0 by solvent), F 0.25 (0.15–0.38), tert-butyl 4.9 (quoted >4.5 or 4.7–4.9). Syn-pentane
  3.7, kept from the original page. Ring-flip NMR coalescence about −90 °C (sources −60 to −100).

## Synthesis & Retrosynthesis (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### synthesis-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `retrosynthesis`, `carbon-carbon-bonds`, `functional-group-interconversion`,
  `protecting-groups`, `multistep-synthesis`.
- **Positions taken:**
  - Retrosynthesis teaches C–C retrons; C–X cuts (ethers, esters) get one line, where many
    courses teach them first. Retron carbons are counted from the carbon that carries the group,
    not by IUPAC locants. A carbonyl piece is treated as both its synthon (the δ+ carbon) and the
    compound you order. The Michael retron uses pentane-2,4-dione + methyl vinyl ketone, matching
    the Michael and Robinson chapter. For a β-hydroxy carbonyl the aldol cut is graded over a
    Grignard cut.
  - The oxidation ladder places most groups by counting bonds to O, N or halogen; alkenes and
    alkynes are placed by what water turns them into (a teaching convention; some courses use
    per-carbon oxidation numbers). C–C bond formers (Wittig, NaCN, acetylide) are marked as outside
    the ladder bookkeeping. Radical HBr then substitution sets only relative configuration and
    gives a racemic product.
  - Protecting groups: the course has a Grignard-safe mask only for an O–H (silyl ether); for an
    N–H or CO₂H the pages say to reorder the route. A carbamate still has an N–H. The Grignard page
    also mentions a sacrificial extra equivalent, which this chapter does not grade; the wording
    of the two pages could be brought closer. TBS and an acetal are taught as "take the TBS off
    first" rather than as orthogonal. Slow Cbz losses in TFA and the partial cyclic hemiketal of
    6-hydroxy-6-phenylhexan-2-one are not mentioned.
  - Carbon–carbon bonds: the cuprate addition is drawn with polar curved arrows (the mechanism
    goes through Cu(III)); cyanide on a tertiary halide is simplified to "gives the alkene"; the
    endo Diels–Alder adduct is "usually" the major product. Close relatives (enolate alkylation,
    Grignard + epoxide, cuprate) are a paragraph, not table rows, so the flashcard deck is
    unchanged.
  - Multistep synthesis: 1-bromopropane in Friedel–Crafts alkylation is taught as giving mostly
    isopropylbenzene through a free primary cation that shifts a hydride (the course convention;
    the ratio depends on conditions and the halide–AlCl₃ complex is what rearranges). Anti
    addition of Br₂ is limited to simple alkenes. Wolff–Kishner is written H₂NNH₂, KOH, heat; Pt is
    kept as the catalyst in the dimethylcyclohexene figure. Acetone's self-aldol equilibrium
    favors acetone.

## Drawing Molecules & Moving Electrons (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### drawing-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `skeletal-structures`, `curved-arrows`, `resonance`.
- **Positions taken:**
  - Skeletal structures uses condensed formulas instead of IUPAC names, since naming comes later,
    but it still names pentane, cyclohexane and benzene as plain words. Confirm that is allowed.
    The zigzag is "drawn at 120°, about 109.5° in the molecule" (a real alkane C–C–C angle is
    nearer 112°). A hydrogen on O or N is always drawn "because it matters to how the molecule
    behaves"; the page no longer calls it acidic, since acidity comes later. "A C–H on a chain
    rarely does either" is true only in comparison with O–H and N–H. Benzene's circle is justified
    by the measured fact that its six C–C bonds are identical, with the reason left to Resonance.
  - Curved arrows: a + marks a missing electron, not a missing pair; only a carbocation (or H⁺ or
    BF₃) is short of electrons, while NH₄⁺ and H₃O⁺ have full octets. An electron-poor site is
    either an atom short of electrons or the δ+ end of a polar bond. Formal charge
    (`formal-charge`) still describes electron-poor more narrowly ("a + together with fewer than
    eight electrons") and should be brought in line in the Foundations wording pass.
  - Resonance: the allyl cation is described only as more stable than a similar cation that
    cannot spread its charge (about 15 kcal/mol in the gas phase, recalled, not checked); courses
    differ on ranking it with secondary or tertiary cations, and the page makes no such
    comparison. Resonance is called part of aromatic stability, not its definition. Benzene is
    counted as two Kekulé plus three Dewar structures, naphthalene as three Kekulé structures.
    The amide rotation barrier is given as about 18 kcal/mol (real amides range about 15–21).
    The edge-on enol figure draws only oxygen's p-orbital lone pair.

## Amines (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### amines-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `amine-structure`, `amine-reactions`, `amine-synthesis`, `hofmann-elimination`.
- **Positions taken:**
  - The amide pKaH is "about 0" on every page (literature about −0.5); the imine pKaH was removed
    as unverified (simple imines are often quoted near 7).
  - Nucleophilicity is taught as NH₃ < RNH₂ < R₂NH, with R₃N slower (a course convention; real
    values depend on sterics and solvent).
  - Reductive amination: the pages give no pH number, only "mildly acidic solution" (Borch's data
    put iminium selectivity nearer pH 6–7). Over-alkylation is explained by rates: the first
    condensation is fast, the second (by the more crowded secondary amine) slower, and the
    reduction is not undone; dialkylation remains a side reaction, worst with ammonia or small
    aldehydes. Azide is taught as working on primary and secondary halides.
  - Hofmann rearrangement: the water step is drawn on the neutral isocyanate and carbamic acid
    (under NaOH the species is really the carbamate anion). Phthalimide pKa 8.3 is unverified.
  - Hofmann elimination: the rule is explained by sterics first, with the E1cb-like acidity
    argument agreeing (the origin is debated). Cope elimination "tends to give" the less
    substituted alkene, with no ratio. Exhaustive methylation of piperidine is given as ending in
    penta-1,4-diene; the historical product is often given as penta-1,3-diene, by isomerization.
    The names sec-butyl and 1-phenylprop-1-ene are kept (older forms).
  - The pages use "N-nitrosamine"; the diazonium figure was changed to match.

## Organometallics (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### organometallics-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `organometallic-bonding`, `grignard-reagents`, `gilman-reagents`,
  `organolithium-reagents`, `cross-coupling`.
- **Positions taken:**
  - Course order puts Protecting groups after this chapter. So the organometallic-bonding worked
    example accepts 2.0 equivalents of Grignard reagent with a free OH (with a caveat that it wastes
    reagent), and Grignard reagents teaches the TBS silyl ether in place (TBSCl with imidazole on,
    TBAF off).
  - Grignard reagents says "reorder, then protect"; Protecting groups says protection is the answer
    a question expects. One framing should be chosen. Both pages also say extra Grignard reagent
    with a free OH gives yields that are "often poor and hard to repeat", which may be overstated.
  - The R–R (Wurtz-type) by-product formed while a Grignard reagent is made was cut from
    organometallic-bonding: the wording implied the slow SN2 the section rules out, and the real
    route is radical, at the magnesium surface. Add it back with that mechanism if wanted.
  - The reactivity table orders Zn before Cu by electronegativity and calls the order "rough at the
    gentle end"; in practice cuprates are often more reactive than organozinc reagents.
  - Grignard reagents uses a two-ether, 8-electron picture of RMgX; the Schlenk equilibrium,
    aggregates, hydrocarbon solvents with donor additives and Weinreb chelate stability on warming
    are not mentioned.
  - Gilman reagents explains 1,4-addition by hard/soft (the Cu(III) path is a marked aside);
    "cooling does not switch a Grignard to 1,4" is a teaching rule for simple enones. The PCC
    (Babler–Dauben) transposition was removed from the worked example because the course never
    teaches it.
  - Organolithium reagents: the diisopropyl ketone case (iPrMgBr reduces or enolizes, iPrLi adds)
    is classic but not checked against a source; "smaller and more reactive" simplifies (RLi is
    aggregated). LDA is called a lithium amide, not an organolithium.
  - Cross-coupling teaches the halide order I > OTf > Br >> Cl, with a note that Br ≈ OTf (or Br
    faster) with many ligands; the audit suggested I > Br ≈ OTf. The Suzuki base is taught by the
    borate route, with the Pd–OH route shown in a fact box. Turnover is given as about 50 at
    2 mol %.

## Acids & Bases (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### acids-bases-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `bronsted`, `conjugate`, `pka`, `acidity-factors`, `lewis-acids`, plus one line on
  `nucleophiles` and the shared `molecules.js` and `interactive-bank.js`.
- **Positions taken:**
  - Water is pKa 15.7 and hydronium −1.7 (the course convention), with a note on every page that
    many sources give 14.0 and 0 because of how the solvent water is counted. The pka page's
    "ethanol + hydroxide, neither side clearly favored (K about 0.5)" depends on this: with 14 the
    left side is clearly favored.
  - Values that vary by source are kept as the course has them: HCl about −7, NH₃ 38 (sources
    35–41), diisopropylamine 36, the HI/HF gap about 13 units.
  - Brønsted acids/bases teaches pKa far enough (building on Resonance) to grade which side an
    equilibrium favors; the pKa page then covers Ka, the scale, how far and which base to choose.
    Acetic acid + NH₃ is "about 3 × 10⁴ to one" on every page.
  - Conjugate acids/bases defines "weak base" by chloride, so acetate is called a "moderate
    base". General chemistry usually calls acetate a weak base.
  - Factors affecting acidity grades resonance as the reason carboxylic acids beat alcohols (the
    inductive view is shown beside it), and atom size/polarizability as the main reason HX
    acidity rises down a group (bond strength second).
  - In 4-hydroxybutan-2-one the hydroxyl oxygen is taught as more basic than the C=O oxygen
    (conjugate acids about −2 against −7). The interactive item that keyed the C=O oxygen as the
    site protonated by strong acid was removed, and the molecule's hover notes were changed to
    match; gas-phase data and the acid-catalysis convention point the other way, so the author
    should pick one answer for the whole site.
  - Lewis acids/bases gives both conventions on whether HCl counts as a Lewis acid (nothing graded
    depends on it), draws the TiCl₄–acetone adduct as a simple 1:1 five-coordinate complex (real
    ones are often 1:2 or dimeric), and separates "acid/base" from "nucleophile/electrophile" as
    how far versus how fast, a simplification. The Nucleophiles page now says the line between
    "base" and "nucleophile" is not strict (an alkene taking the H of HBr is called a nucleophile).

## Spectroscopy (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### spectroscopy-conventions: explanations and values the pages grade by
- **Status:** pending review.
- **Where:** `ir`, `h-nmr`, `c-nmr`, `mass-spec`.
- **Positions taken:**
  - IR: an ester's C=O sits above a ketone's because oxygen's σ pull slightly outweighs its
    donation (the usual course explanation, a simplification). Ring strain raising C=O is
    explained by rehybridization; some texts credit coupling with the ring bonds. The ring
    angles in the figure are flat-polygon corners; measured angles (about 116°, 109°, 93°) are
    unverified. C–D at 2100–2200 and primary amide N–H near 3350/3180 should be checked against
    a reference.
  - ¹H NMR: alcohol O–H is given as 2–5 ppm (some tables give about 0.5–5); cis/trans J as
    6–12 and 12–18 Hz (other tables 6–14 and 11–18); the para-disubstituted ring is described as
    "two 2H signals that each look like a doublet" without naming AA′BB′. C–H next to oxygen is
    3.3–4.5 and next to a halogen 2.2–4.5 (CH₃I 2.2 to CH₃F 4.3). Splitting that row gave the
    halogen row a new flashcard.
  - ¹³C NMR: "quaternary" is used in the loose NMR sense (a carbon with no hydrogens), with the
    strict meaning beside it. The alkyne carbon's shift is explained with the textbook
    circulating-π picture. 3,3-Dimethylbutan-2-one shifts (214/44/26/25) match SDBS.
  - Mass spectrometry: the ion at 91 is taught as largely tropylium without claiming whether
    the rearrangement happens before or after the hydrogen is lost (gas-phase studies favor
    before). The McLafferty figure uses six single-barbed arrows; some courses grade a
    three-arrow shorthand. The common-losses row for CO (28) now names phenols. Spectrum bar
    heights are illustrative, not NIST values.

## Alcohols, Ethers & Related Chemistry (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### alcohols-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `alcohol-reactions`, `ether-chemistry`, `epoxides`, plus the shared `molecules.js`
  and the click-button styling fixed in `aldehydes-ketones` and `markovnikov`.
- **Positions taken:**
  - SOCl₂ without pyridine (SNi) is drawn as delivery of the chlorine to the same face. Current
    evidence points to an intimate ion pair, and clean retention depends on the solvent.
  - A secondary alcohol with HX is graded as SN1 with the stereocenter largely racemized; the
    evidence is a mix of SN1 and SN2.
  - The PBr₃ worked example uses 3,3-dimethylbutan-2-ol (matching the Carbocations page) and says
    PBr₃ avoids a free cation, which is why the skeleton is kept. On this crowded secondary carbon
    some rearrangement may still happen in practice; the author may prefer 3-methylbutan-2-ol.
  - Ether cleavage: a secondary carbon paired with a methyl or primary carbon is taught as losing
    to SN2 at the smaller carbon; SN1/SN2 mixtures are mentioned only when both carbons are
    secondary. The 18-crown-6 cavity is given as about 2.7 Å (sources quote about 2.6–3.2 Å).
  - Epoxides keep the usual heading "base-catalyzed" although the nucleophile is used up
    ("base-promoted"). Acid opening between a primary and a secondary carbon is taught as a weak
    preference where mixtures can form.

## Aromatic Chemistry (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### aromatic-conventions: explanations and values the pages grade by
- **Status:** pending review.
- **Where:** `aromaticity`, `eas`, `directing-effects`, plus `ochem/mechanisms/eas.html`.
- **Positions taken:**
  - Aromaticity: benzene's extra stability is taught as 36 kcal/mol (the heats-of-hydrogenation
    value; other estimates exist). Cyclobutadiene is "first observed trapped in frozen argon a
    few degrees above absolute zero" (usually cited at about 8 K) and is drawn with the simple
    square-diradical model, not the rectangular singlet. The COT tub figure uses an idealized
    geometry. Chlorophyll is called a porphyrin; strictly it is a chlorin.
  - EAS: sulfonation is taught with SO₃ as the electrophile, with HSO₃⁺ named as the convention
    some books use. Friedel–Crafts alkylation with a primary halide is drawn as the usual primary
    cation and hydride shift, with the stricter AlCl₃-complex account beside it (propylbenzene as
    the minor product from direct attack). The first step is rate-determining in "nearly every"
    EAS reaction; the isotope-effect exceptions are not named.
  - Directing effects: the m-xylene nitration split (about 86:14 for C4:C2 from memory) is given
    without a number; the toluene (25×) and chlorobenzene (30×) relative nitration rates are the
    classic values but were not checked against a source; no rate factor is given for phenol or
    aniline bromination. Much of the para product in aniline nitration is put down to free
    aniline, with the anilinium ion giving mostly meta and some para (Ridd's work). The strength
    ranking of –OR, –CN and –SO₃H in the table is a course convention. Cl₂/FeCl₃ on
    acetophenone is taught as ring chlorination (in practice α-chlorination competes). Some
    compounds use common rather than preferred IUPAC names (3-chloroacetophenone,
    4-methylanisole, m-bromonitrobenzene).

## Oxidation & Reduction (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### redox-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `oxidation-states`, `alcohol-oxidation`, `carbonyl-reduction`, plus wording on
  `aldehyde-oxidation`, `cross-coupling` and `nucleophilic-addition`.
- **Positions taken:**
  - Oxidation levels: "rung" is used for the count of bonds to O, N or halogen and is tied to the
    "oxidation level" named in Functional group priority; "oxidation state" is the signed number.
    C–I is scored +1 by convention, though iodine is only slightly more electronegative than
    carbon. PCC is given as Cr(VI) → Cr(III). Cross-coupling now calls its metal count the same
    bookkeeping as the carbon count.
  - Oxidizing alcohols: in the chromate-ester step, water is drawn removing the hydrogen (to match
    Oxidizing an aldehyde); some sources show an oxygen on chromium doing it. DMP is called
    "nearly neutral", though it releases acetic acid and is often buffered. Distilling the
    aldehyde out of a Jones oxidation is not mentioned as a way to stop early. Tertiary alcohols
    are taught as "not oxidized"; in strong acid they may dehydrate instead.
  - Reducing carbonyls: DIBAL-H is explained by the Al-bound tetrahedral intermediate holding
    together at −78 °C (some texts say only "bulky, less reactive"). NaBH₄ with a carboxylic acid
    is simplified to "not reduced" (it gives H₂ and acyloxyborohydrides). The Clemmensen
    mechanism is described as not well understood and is not drawn with arrows.

## Substitution & Elimination (Phase 2)

Each item below is pending review. The page teaches the stated position, and a person should
confirm it.

### subst-elim-conventions: explanations and wording the pages grade by
- **Status:** pending review.
- **Where:** `sn2`, `sn1`, `e2`, `e1`, `substrate-effects` (notes pages), the SN2, SN1, E2 and E1
  mechanism pages, and the Substrate & solvent effects lesson.
- **Positions taken:**
  - SN2: a vinyl or aryl halide is taught as unreactive because the backside path lies in the plane
    of the molecule and runs into the rest of it, and an sp² carbon cannot invert (the older "screened
    by the π electrons" reason was dropped).
  - SN1: the product is graded "racemic, or largely racemic", with the split given as about 55:45 to
    70:30 toward inversion (ion pairs). The common-ion effect is taught as a general test, though its
    size depends on the cation. The tertiary/methyl rate gap is "a million or more" (larger in formic
    acid).
  - E2: stereospecific examples use phenyl-style names rather than IUPAC 2013 benzene-parent names.
    "The same geometric logic governs anti additions" is kept from the old page and is loose.
  - E1: a β-deuterium leaves E1's rate "almost unchanged" (matching E2); with many deuteriums
    (fully deuterated tert-butyl) the rate falls about 2.4-fold. The departing leaving group is still
    listed as a possible base.
  - Heat favoring elimination is taught with product (and transition-state) particle counts and
    entropy, the convention courses grade; strictly the selectivity is kinetic (activation entropy).
  - Substrate & solvent effects: DBU is described as used mainly as a base for elimination (measured
    nucleophilicity is high); azide in acetone is a textbook convention (NaN₃ dissolves poorly in
    pure acetone); the azide-in-water product mix is qualitative; the stereochemistry of secondary
    tosylate solvolysis is not stated; the 3° "SN1 (slow)" cell with a strong nucleophile differs
    between published charts; a claim that a protic solvent pushes secondary SN2/E2 toward E2 was
    removed as unverified.
