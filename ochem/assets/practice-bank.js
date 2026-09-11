/* Ochem practice question bank — a plain object keyed by topic id (matching
   OchemCurriculum's topic ids in curriculum.js) -> an array of question
   objects: { q, options, correct, why }. `correct` is the index into
   `options`. `why` is shown after answering, right or wrong.

   This is a separate bank from each lesson's own inline MCQ steps: lessons
   teach a concept step-by-step the first time through; practice mixes
   already-covered topics together for retrieval practice. Practice results
   are tracked in their own localStorage key (see practice-page.js) rather
   than feeding OchemCurriculum's lesson progress — doing practice questions
   must never change a lesson's in-progress run or its bestScore, only the
   act of finishing a lesson run should do that. */
(function(){
  window.OchemPracticeBank = {
    'atomic-structure': [
      { q: 'An atom’s valence electrons are found in which shell?', options: ['The innermost (core) shell', 'The outermost occupied shell', 'The nucleus', 'Whichever shell has the most electrons'], correct: 1, why: 'Valence electrons are the outermost shell’s electrons — the ones involved in bonding.' },
      { q: 'Carbon (atomic number 6) has how many valence electrons?', options: ['2', '4', '6', '8'], correct: 1, why: 'Carbon’s configuration is 1s² 2s² 2p² — the 2nd shell holds 4 electrons, all valence.' }
    ],
    'orbitals': [
      { q: 'Which orbital shape is dumbbell-shaped with two lobes?', options: ['s', 'p', 'd', 'f'], correct: 1, why: 'p orbitals have two lobes on either side of the nucleus along one axis; s orbitals are spherical.' },
      { q: 'How many electrons can a single orbital hold at most?', options: ['1', '2', '3', '6'], correct: 1, why: 'The Pauli exclusion principle allows at most 2 electrons per orbital, and they must have opposite spins.' }
    ],
    'hybridization': [
      { q: 'A carbon with one double bond and two single bonds (3 total attachments, trigonal planar) is hybridized as:', options: ['sp', 'sp²', 'sp³', 'sp³d'], correct: 1, why: 'Three regions of electron density (trigonal planar) come from mixing one s and two p orbitals — sp².' },
      { q: 'An sp carbon (like in a triple bond) has a bond angle of about:', options: ['109.5°', '120°', '180°', '90°'], correct: 2, why: 'sp hybridization gives 2 regions of electron density arranged linearly, 180° apart.' }
    ],
    'bonding': [
      { q: 'How many total bonds (σ + π) does a triple bond have?', options: ['1', '2', '3', '4'], correct: 2, why: 'A triple bond is 1 sigma bond plus 2 pi bonds — 3 total.' },
      { q: 'Why can’t you freely rotate around a C=C double bond?', options: ['The sigma bond is too short', 'The pi bond’s sideways p-orbital overlap would break on twisting', 'Carbon atoms repel each other', 'Double bonds have no sigma component'], correct: 1, why: 'Twisting misaligns the parallel p orbitals that form the pi bond, breaking that overlap — sigma bonds alone allow free rotation.' }
    ],
    'electronegativity': [
      { q: 'Across a period (left to right), electronegativity generally:', options: ['Increases', 'Decreases', 'Stays the same', 'Is random'], correct: 0, why: 'Nuclear charge increases across a period while shielding stays roughly constant, pulling electrons in more tightly.' },
      { q: 'Which element is the most electronegative?', options: ['Oxygen', 'Nitrogen', 'Fluorine', 'Chlorine'], correct: 2, why: 'Fluorine is the most electronegative element on the periodic table.' }
    ],
    'formal-charge': [
      { q: 'Formal charge = (valence electrons) − (nonbonding electrons) − ?', options: ['Total electrons in the molecule', 'Half the bonding electrons', 'The atom’s atomic number', 'The number of lone pairs × 2'], correct: 1, why: 'Formal charge = valence e⁻ − nonbonding e⁻ − ½(bonding e⁻), since each atom "owns" half of each shared bond.' },
      { q: 'A nitrogen with 4 bonds and no lone pairs has a formal charge of:', options: ['−1', '0', '+1', '+2'], correct: 2, why: 'N normally has 5 valence e⁻; with 4 bonds (8 shared e⁻, 4 "owned") and 0 lone pairs: 5 − 0 − 4 = +1.' }
    ],
    'lewis-structures': [
      { q: 'What is the first step in drawing a Lewis structure?', options: ['Add lone pairs to satisfy the octet', 'Count total valence electrons', 'Pick the central atom', 'Calculate formal charges'], correct: 1, why: 'You need the total valence electron count before you can distribute bonds and lone pairs correctly.' },
      { q: 'In a good Lewis structure, the central atom is usually:', options: ['The most electronegative atom', 'The least electronegative (non-hydrogen) atom', 'Always carbon', 'Whichever atom is listed first'], correct: 1, why: 'Less electronegative atoms tend to form more bonds and sit centrally; hydrogen can never be central (only 1 bond).' }
    ],
    'molecular-geometry': [
      { q: 'A central atom with 4 bonding pairs and 0 lone pairs has what geometry?', options: ['Trigonal planar', 'Tetrahedral', 'Bent', 'Linear'], correct: 1, why: '4 electron domains with no lone pairs arrange tetrahedrally (VSEPR) — 109.5° angles.' },
      { q: 'Why does water (2 bonding pairs, 2 lone pairs) have a bent shape instead of linear?', options: ['Oxygen is too small', 'Lone pairs take up space and push the bonding pairs together', 'Hydrogen atoms repel each other more than electrons do', 'Water has no lone pairs'], correct: 1, why: 'VSEPR counts lone pairs as occupying space — with 4 total domains around O, the electron geometry is tetrahedral, but the molecular shape (just the atoms) comes out bent.' }
    ],
    'bond-polarity': [
      { q: 'A bond is considered polar covalent when the electronegativity difference is roughly:', options: ['0', '0.4–1.7', '>2.0 (ionic)', 'Negative'], correct: 1, why: 'Small/zero difference = nonpolar covalent; moderate difference (~0.4–1.7) = polar covalent; large difference = ionic.' },
      { q: 'In a C–O bond, which atom carries the partial negative charge?', options: ['Carbon', 'Oxygen', 'Neither — it’s nonpolar', 'Whichever atom is larger'], correct: 1, why: 'Oxygen is more electronegative than carbon, so it pulls the shared electron density toward itself, becoming δ⁻.' }
    ],
    'resonance': [
      { q: 'Resonance structures differ only in the position of:', options: ['Atoms', 'Electrons (lone pairs and pi bonds)', 'The molecular formula', 'The net charge of the molecule'], correct: 1, why: 'Resonance structures show the same atoms in the same positions — only electron placement (lone pairs/pi bonds) differs.' },
      { q: 'The real structure of a resonance-stabilized species is:', options: ['Whichever single structure is drawn first', 'An average (hybrid) of all valid resonance structures', 'Constantly flipping between structures over time', 'Undefined'], correct: 1, why: 'The actual molecule is a single resonance hybrid — a weighted average of the contributing structures, not an equilibrium between them.' }
    ],
    'curved-arrows': [
      { q: 'A curved arrow in a mechanism always starts at:', options: ['A positive charge', 'A source of electrons (lone pair or bond)', 'The product', 'An atom with no electrons'], correct: 1, why: 'Curved arrows track electron movement — they start where electrons already are (a lone pair or an existing bond).' },
      { q: 'Where does a curved arrow’s head point?', options: ['Where the electrons are leaving from', 'Where the electrons are going to', 'Always at a hydrogen', 'It’s arbitrary'], correct: 1, why: 'The arrowhead marks the destination of the moving electron pair — a new bond or a new lone pair.' }
    ],
    'nucleophiles': [
      { q: 'A nucleophile is best described as:', options: ['Electron-poor, seeking electrons', 'Electron-rich, donating electrons', 'Always negatively charged', 'Always a strong acid'], correct: 1, why: 'Nucleophiles ("nucleus-loving") are electron-rich species that donate an electron pair to form a new bond.' },
      { q: 'Which factor generally makes a species a better nucleophile in a polar aprotic solvent?', options: ['Larger atomic size down a group (more polarizable)', 'Smaller atomic size', 'Being neutral instead of negatively charged', 'Higher electronegativity'], correct: 0, why: 'Larger, more polarizable atoms (like I⁻ vs F⁻) donate electron density more easily, making them better nucleophiles especially in aprotic solvents.' }
    ],
    'electrophiles': [
      { q: 'An electrophile is best described as:', options: ['Electron-rich, donating electrons', 'Electron-poor, seeking electrons', 'Always a base', 'A leaving group'], correct: 1, why: 'Electrophiles ("electron-loving") are electron-poor and accept an electron pair to form a new bond.' },
      { q: 'A carbonyl carbon (C=O) is a good electrophile because:', options: ['Oxygen pulls electron density away, leaving the carbon partially positive', 'Carbon is more electronegative than oxygen', 'It has a full negative charge', 'Carbonyl carbons have no bonds available'], correct: 0, why: 'Oxygen’s electronegativity polarizes the C=O bond, giving carbon a δ+ that nucleophiles attack.' }
    ],
    'leaving-groups': [
      { q: 'A good leaving group is generally one that is:', options: ['A strong base', 'Stable once it departs with the electron pair (weak base)', 'Always positively charged', 'Unable to hold a negative charge'], correct: 1, why: 'Good leaving groups are stable as the departed anion/molecule — i.e., weak bases, since weak bases are comfortable holding the extra electron density.' },
      { q: 'Which of these is typically the best leaving group?', options: ['OH⁻', 'I⁻', 'NH₂⁻', 'CH₃⁻'], correct: 1, why: 'Iodide is a large, very weak base — very stable once it leaves — making it an excellent leaving group, unlike OH⁻, NH₂⁻, or CH₃⁻ which are strong bases.' }
    ],
    'electron-rich-poor': [
      { q: 'An electron-rich atom in a mechanism tends to act as a(n):', options: ['Electrophile', 'Nucleophile', 'Leaving group', 'Spectator'], correct: 1, why: 'Electron-rich atoms have extra electron density to donate, making them nucleophilic.' },
      { q: 'Why is the carbon of C=O electron-poor while the oxygen is electron-rich?', options: ['Oxygen is larger', 'Oxygen’s higher electronegativity pulls shared electron density toward itself', 'Carbon has more protons', 'There is no difference — they’re equal'], correct: 1, why: 'The electronegativity difference polarizes the pi bond, making O δ− (electron-rich) and C δ+ (electron-poor).' }
    ],
    'bronsted': [
      { q: 'A Brønsted-Lowry acid is defined as a species that:', options: ['Accepts a proton (H⁺)', 'Donates a proton (H⁺)', 'Accepts an electron pair', 'Donates an electron pair'], correct: 1, why: 'Brønsted-Lowry acids are proton donors; bases are proton acceptors.' },
      { q: 'When an acid donates a proton, what is left behind called?', options: ['Its conjugate acid', 'Its conjugate base', 'A free radical', 'A Lewis acid'], correct: 1, why: 'After losing H⁺, the acid becomes its conjugate base (one less proton, one more negative/less positive charge).' }
    ],
    'lewis-acids': [
      { q: 'A Lewis acid is defined as a species that:', options: ['Donates an electron pair', 'Accepts an electron pair', 'Donates a proton', 'Is always a metal'], correct: 1, why: 'Lewis acids are electron pair acceptors — a broader definition than Brønsted acids, which must involve a proton.' },
      { q: 'Which of these is a classic Lewis acid even though it has no protons to donate?', options: ['BF₃', 'NH₃', 'H₂O', 'CH₄'], correct: 0, why: 'BF₃ has an empty p orbital on boron and readily accepts an electron pair, making it a Lewis acid despite having no acidic protons.' }
    ],
    'pka': [
      { q: 'A lower pKa indicates:', options: ['A weaker acid', 'A stronger acid', 'A stronger base', 'No relationship to acid strength'], correct: 1, why: 'pKa and acid strength are inversely related — lower pKa means the acid dissociates more, so it’s stronger.' },
      { q: 'If an acid has a pKa of 5 and a base’s conjugate acid has a pKa of 10, which side does the acid-base equilibrium favor?', options: ['The side with the weaker acid', 'The side with the stronger acid', 'It is always 50/50', 'Cannot be determined from pKa alone'], correct: 0, why: 'Proton transfer equilibria favor forming the weaker acid (higher pKa) — the reaction runs toward the more stable, less acidic species.' }
    ],
    'conjugate': [
      { q: 'The conjugate base of an acid has:', options: ['One more proton than the acid', 'One fewer proton than the acid', 'The same number of protons', 'An extra electron pair donated externally'], correct: 1, why: 'Losing H⁺ from an acid gives its conjugate base — exactly one fewer proton.' },
      { q: 'A strong acid has a conjugate base that is:', options: ['Also strong', 'Weak (stable, unreactive)', 'Always negatively charged', 'Irrelevant to acid strength'], correct: 1, why: 'Strong acids give up protons easily because their conjugate base is very stable (weak) once formed.' }
    ],
    'acidity-factors': [
      { q: 'Which factor makes an O–H more acidic: resonance stabilization of the conjugate base, or destabilization of the conjugate base?', options: ['Resonance stabilization increases acidity', 'Resonance destabilization increases acidity', 'Resonance has no effect on acidity', 'Only inductive effects matter'], correct: 0, why: 'A more stable (resonance-delocalized) conjugate base means the acid gives up its proton more readily — higher acidity.' },
      { q: 'Across a period, as electronegativity of the atom bearing the negative charge increases, acidity of the H attached to it:', options: ['Decreases', 'Increases', 'Stays constant', 'Becomes unpredictable'], correct: 1, why: 'More electronegative atoms stabilize the extra negative charge of the conjugate base better, increasing acidity (e.g., HF > CH₄ in acidity trend logic, comparing across a period).' }
    ],
    'newman': [
      { q: 'In a Newman projection, the front atom’s bonds are drawn from:', options: ['A circle', 'A single point (the center dot)', 'Three separate dots', 'The back atom'], correct: 1, why: 'The front atom is represented as a point with three lines radiating out; the back atom is the circle behind it.' },
      { q: 'Which conformation about a C–C single bond is generally lowest in energy?', options: ['Fully eclipsed', 'Gauche', 'Anti (staggered, 180°)', 'Syn-eclipsed'], correct: 2, why: 'Anti-staggered puts substituents as far apart as possible, minimizing steric and torsional strain.' }
    ],
    'cyclohexanes': [
      { q: 'Why is the chair conformation of cyclohexane the most stable?', options: ['It has the most eclipsing interactions', 'All bond angles are close to 109.5° with no ring strain and staggered bonds', 'It is perfectly flat', 'It has fewer hydrogens'], correct: 1, why: 'The chair avoids angle strain (near-tetrahedral angles) and torsional strain (fully staggered), unlike boat or planar forms.' },
      { q: 'The boat conformation of cyclohexane is higher in energy than the chair mainly due to:', options: ['Angle strain', 'Torsional strain and flagpole steric interactions', 'Too few hydrogens', 'Ionic repulsion'], correct: 1, why: 'The boat has eclipsing interactions along its sides and a steric clash between the two "flagpole" hydrogens.' }
    ],
    'axial-equatorial': [
      { q: 'In a cyclohexane chair, equatorial substituents point:', options: ['Straight up and down, alternating', 'Roughly outward, around the "equator" of the ring', 'Into the center of the ring', 'Only on odd-numbered carbons'], correct: 1, why: 'Equatorial positions point outward around the ring’s perimeter, avoiding the 1,3-diaxial interactions that axial groups face.' },
      { q: 'A bulky substituent on cyclohexane is most stable in which position?', options: ['Axial', 'Equatorial', 'It never matters', 'Both are always equal in energy'], correct: 1, why: 'Equatorial placement avoids steric clashes (1,3-diaxial interactions) with other axial substituents, so bulky groups prefer equatorial.' }
    ],
    'ring-flips': [
      { q: 'During a cyclohexane ring flip, axial substituents become:', options: ['Axial again', 'Equatorial', 'Eliminated from the molecule', 'Double bonds'], correct: 1, why: 'A ring flip interconverts the two chair forms — every axial position becomes equatorial and vice versa.' },
      { q: 'After a ring flip, does the molecule’s relative stereochemistry (cis/trans) change?', options: ['Yes, cis becomes trans', 'No, only axial/equatorial labels change, not cis/trans', 'Only for disubstituted rings', 'Ring flips create new stereocenters'], correct: 1, why: 'Ring flips are conformational changes, not bond-breaking — cis/trans relationships (configuration) are preserved; only which substituents are axial vs. equatorial changes.' }
    ],
    'conformational-analysis': [
      { q: 'For a disubstituted cyclohexane, the most stable chair conformation is generally the one with:', options: ['The most groups axial', 'The most groups (especially the largest) equatorial', 'A flat ring', 'Random — conformation doesn’t affect stability'], correct: 1, why: 'Placing bulky groups equatorial minimizes 1,3-diaxial strain, giving the lowest-energy conformation.' },
      { q: 'A tert-butyl group on cyclohexane is almost always found in the equatorial position because:', options: ['It is too small to matter', 'Its large size makes the axial 1,3-diaxial strain prohibitively high', 'Tert-butyl cannot be axial by rule', 'It prefers to eclipse other groups'], correct: 1, why: 'tert-Butyl is so bulky that the axial conformer is dramatically higher in energy — essentially locking it equatorial.' }
    ],
    'chirality': [
      { q: 'A chiral molecule is one that:', options: ['Has a plane of symmetry', 'Is non-superimposable on its mirror image', 'Contains no carbon', 'Has no functional groups'], correct: 1, why: 'Chirality means the molecule and its mirror image are distinct, non-superimposable objects — like left and right hands.' },
      { q: 'A molecule with an internal plane of symmetry is generally:', options: ['Chiral', 'Achiral', 'Always a stereocenter', 'Impossible to draw'], correct: 1, why: 'An internal mirror plane (plane of symmetry) means the molecule is superimposable on its mirror image — achiral.' }
    ],
    'stereocenters': [
      { q: 'A carbon stereocenter has:', options: ['Two identical substituents', 'Four different substituents', 'No substituents', 'A double bond to each neighbor'], correct: 1, why: 'A stereocenter (typically a carbon) must have four different groups attached for swapping two to create a distinct stereoisomer.' },
      { q: 'How many stereoisomers can arise from a molecule with n independent stereocenters (maximum, ignoring symmetry)?', options: ['n', '2n', '2ⁿ', 'n²'], correct: 2, why: 'Each stereocenter independently can be R or S, giving up to 2ⁿ possible stereoisomers.' }
    ],
    'enantiomers': [
      { q: 'Enantiomers are stereoisomers that are:', options: ['Non-mirror-image stereoisomers', 'Exact mirror images of each other, non-superimposable', 'Identical molecules', 'Structural (constitutional) isomers'], correct: 1, why: 'Enantiomers are mirror images of one another that cannot be superimposed — differing at every stereocenter.' },
      { q: 'Enantiomers have identical physical properties except for their interaction with:', options: ['Heat', 'Plane-polarized light (optical activity) and chiral environments', 'Water', 'Gravity'], correct: 1, why: 'Enantiomers rotate plane-polarized light in opposite directions and behave differently only in chiral environments (e.g., with enzymes).' }
    ],
    'diastereomers': [
      { q: 'Diastereomers are stereoisomers that:', options: ['Are mirror images of each other', 'Are not mirror images but differ at one or more (not all) stereocenters', 'Have different molecular formulas', 'Are identical compounds'], correct: 1, why: 'Diastereomers differ in configuration at some, but not all, stereocenters, so they are not mirror images.' },
      { q: 'Unlike enantiomers, diastereomers generally have:', options: ['Identical physical properties', 'Different physical properties (melting point, boiling point, etc.)', 'No stereocenters', 'The same optical rotation'], correct: 1, why: 'Diastereomers are genuinely different compounds with different shapes, so their physical properties differ, unlike enantiomers.' }
    ],
    'meso': [
      { q: 'A meso compound contains stereocenters but is overall:', options: ['Chiral', 'Achiral, due to an internal plane of symmetry', 'Always optically active', 'Impossible to exist'], correct: 1, why: 'A meso compound has stereocenters, but an internal mirror plane makes the whole molecule superimposable on its mirror image — achiral, optically inactive.' },
      { q: 'Meso compounds commonly arise in molecules with:', options: ['Only one stereocenter', 'Two (or more) stereocenters with an internal symmetry relating them', 'No stereocenters at all', 'Only double bonds'], correct: 1, why: 'A classic meso case is a molecule with two stereocenters bearing the same substituents arranged symmetrically (e.g., meso-tartaric acid).' }
    ],
    'rs-configuration': [
      { q: 'To assign R/S, you rank the four substituents on a stereocenter by:', options: ['Molecular weight of the whole substituent', 'Atomic number of the directly attached atom (CIP priority)', 'Alphabetical order', 'Size only'], correct: 1, why: 'CIP priority ranks by atomic number at the first point of difference, moving outward if there’s a tie.' },
      { q: 'If, with the lowest priority group pointing away from you, 1→2→3 priority traces clockwise, the configuration is:', options: ['S', 'R', 'Meso', 'Undetermined'], correct: 1, why: 'Clockwise with the lowest priority group pointing away = R (rectus); counterclockwise = S (sinister).' }
    ],
    'fischer': [
      { q: 'In a Fischer projection, horizontal lines represent bonds that point:', options: ['Into the page (away from viewer)', 'Out of the page (toward viewer)', 'In the plane of the page', 'There is no 3D meaning'], correct: 1, why: 'By convention, horizontal bonds in a Fischer projection come toward the viewer; vertical bonds go back into the page.' },
      { q: 'Swapping any two groups in a Fischer projection (a single swap) produces the:', options: ['Same molecule', 'Enantiomer', 'A diastereomer only', 'A structural isomer'], correct: 1, why: 'One swap inverts configuration at that center, generating the enantiomer (for a single stereocenter) or flipping that one center’s configuration in a larger molecule.' }
    ],
    'sn2': [
      { q: 'SN2 reactions proceed through what kind of mechanism?', options: ['Stepwise, via a carbocation intermediate', 'A single concerted step with backside attack', 'Radical chain mechanism', 'No mechanism — it’s instantaneous'], correct: 1, why: 'SN2 ("substitution, nucleophilic, bimolecular") happens in one step: the nucleophile attacks from the backside as the leaving group departs.' },
      { q: 'SN2 reactions proceed fastest at which type of carbon?', options: ['Tertiary', 'Secondary', 'Methyl or primary', 'Aromatic'], correct: 2, why: 'Backside attack requires open space behind the leaving group — methyl/primary carbons have the least steric hindrance.' }
    ],
    'sn1': [
      { q: 'SN1 reactions proceed through what kind of mechanism?', options: ['A single concerted step', 'A stepwise mechanism via a carbocation intermediate', 'Requires no leaving group', 'Only occurs with strong nucleophiles'], correct: 1, why: 'SN1 ("unimolecular") has two steps: ionization to form a carbocation, then nucleophilic attack on that cation.' },
      { q: 'SN1 reactions are favored at which type of carbon?', options: ['Methyl', 'Primary', 'Tertiary (stabilizes the carbocation)', 'None — carbon type doesn’t matter'], correct: 2, why: 'Tertiary carbocations are the most stable (hyperconjugation/inductive effects from 3 alkyl groups), so SN1 favors tertiary substrates.' }
    ],
    'e1': [
      { q: 'E1 elimination shares its first step with which substitution mechanism?', options: ['SN2', 'SN1 (carbocation formation)', 'Neither', 'E2'], correct: 1, why: 'E1 and SN1 both begin by ionizing the leaving group to form a carbocation; E1 then loses a proton instead of being attacked by a nucleophile.' },
      { q: 'In E1, which alkene product is usually favored?', options: ['The least substituted (Hofmann) alkene', 'The most substituted (Zaitsev/more stable) alkene', 'Only terminal alkenes', 'No preference exists'], correct: 1, why: 'E1 goes through a carbocation and loses a proton to give the most stable (most substituted) alkene — the Zaitsev product.' }
    ],
    'e2': [
      { q: 'E2 elimination occurs in how many mechanistic steps?', options: ['One concerted step', 'Two steps', 'Three steps', 'It has no defined number of steps'], correct: 0, why: 'E2 ("bimolecular elimination") is concerted: base removes a proton as the leaving group departs, all in one step.' },
      { q: 'E2 requires the leaving group and the departing H to be in what relationship for the best geometry?', options: ['Gauche (60°)', 'Eclipsed (0°)', 'Anti-periplanar (180°)', 'Any orientation works equally well'], correct: 2, why: 'Anti-periplanar alignment lets the breaking C–H bond’s electrons align with the empty orbital forming as the leaving group departs — the best orbital overlap.' }
    ],
    'substrate-effects': [
      { q: 'A strong, bulky base (like tert-butoxide) with a secondary substrate tends to favor:', options: ['SN2', 'SN1', 'E2', 'No reaction'], correct: 2, why: 'Bulky strong bases have trouble doing backside attack (poor SN2) but easily deprotonate, favoring E2.' },
      { q: 'Polar protic solvents (like water or alcohols) favor which mechanism type by stabilizing cationic intermediates?', options: ['SN2/E2 (concerted mechanisms)', 'SN1/E1 (carbocation mechanisms)', 'Neither — solvent never matters', 'Only radical mechanisms'], correct: 1, why: 'Polar protic solvents solvate (stabilize) carbocations and leaving groups well, favoring the ionization step in SN1/E1.' }
    ],
    'alkene-structure': [
      { q: 'The carbons of a simple alkene C=C are hybridized as:', options: ['sp', 'sp²', 'sp³', 'sp³d'], correct: 1, why: 'Each alkene carbon has 3 regions of electron density (2 sigma bonds + 1 pi bond counted as part of the double bond group) — sp², trigonal planar, ~120°.' },
      { q: 'Degree of unsaturation counts how many rings and π bonds are in a molecule. One ring plus one double bond equals a degree of unsaturation of:', options: ['1', '2', '3', '0'], correct: 1, why: 'Each ring and each pi bond (in a double bond or triple bond counts twice) contributes one degree of unsaturation — 1 ring + 1 double bond = 2.' }
    ],
    'addition-reactions': [
      { q: 'In an addition reaction across a C=C double bond, the pi bond is:', options: ['Unaffected', 'Broken, and two new sigma bonds form', 'Strengthened', 'Converted into a lone pair'], correct: 1, why: 'Addition reactions break the reactive pi bond and add two new groups, one to each former alkene carbon.' },
      { q: 'Which step typically starts an electrophilic addition to an alkene?', options: ['The alkene acts as an electrophile', 'The alkene’s pi electrons act as a nucleophile, attacking an electrophile', 'A leaving group departs first', 'A proton is removed from the alkene'], correct: 1, why: 'Alkenes are electron-rich at the pi bond and act as nucleophiles toward an incoming electrophile, forming a carbocation (or similar) intermediate.' }
    ],
    'markovnikov': [
      { q: 'Markovnikov addition places the new H (or nucleophile, depending on convention) on the carbon that is:', options: ['Already most substituted', 'Already least substituted (more H’s), so the new group ends up on the more substituted carbon', 'Always terminal', 'Chosen randomly'], correct: 1, why: 'Markovnikov’s rule: the electrophile (often H⁺) adds to the carbon with more hydrogens already, placing the nucleophile on the more substituted (more stable-cation) carbon.' },
      { q: 'Anti-Markovnikov addition (e.g., via radical HBr addition) places Br on the:', options: ['More substituted carbon', 'Less substituted (terminal) carbon', 'Same carbon as in Markovnikov addition', 'Neither carbon — Br leaves'], correct: 1, why: 'Radical mechanisms form the more stable radical at the more substituted carbon, so Br ends up on the less substituted carbon — opposite of the ionic Markovnikov outcome.' }
    ],
    'alkynes': [
      { q: 'A terminal alkyne’s C–H is unusually acidic (pKa ~25) because:', options: ['sp carbons hold electron density closer to the nucleus (more s-character), stabilizing the resulting anion', 'Triple bonds are weak', 'There is no acidity difference from alkanes', 'Alkynes are basic, not acidic'], correct: 0, why: 'sp hybrid orbitals have 50% s-character (vs. 25% for sp³), holding the lone pair closer to the nucleus and stabilizing the conjugate base — more s-character, more acidic.' },
      { q: 'How many pi bonds are in a carbon-carbon triple bond?', options: ['0', '1', '2', '3'], correct: 2, why: 'A triple bond is 1 sigma bond plus 2 pi bonds.' }
    ],
    'alcohol-reactions': [
      { q: 'Why can’t OH⁻ typically leave directly from an alcohol in a substitution reaction?', options: ['OH⁻ is too small', 'OH⁻ is a strong base and therefore a poor leaving group', 'Alcohols have no oxygen', 'Alcohols are never reactive'], correct: 1, why: 'Hydroxide is a strong base (poor leaving group); alcohols are typically first protonated (or converted to a better leaving group like a tosylate) before substitution/elimination.' },
      { q: 'Protonating an alcohol with strong acid converts –OH into:', options: ['–O⁻, an even worse leaving group', '–OH₂⁺, which leaves as neutral water — a good leaving group', 'A carbonyl group', 'A halide'], correct: 1, why: 'Protonation turns the leaving group into neutral H₂O, which is a much weaker base (and thus a far better leaving group) than OH⁻.' }
    ],
    'ether-chemistry': [
      { q: 'Why are ethers generally unreactive under basic conditions?', options: ['The C–O bond is too strong to ever break', 'There is no good leaving group (RO⁻ is a strong base) until acid activates it', 'Ethers have no oxygen', 'Ethers react only with other ethers'], correct: 1, why: 'Like alcohols, ethers need protonation (acidic conditions) to turn the alkoxide oxygen into a viable leaving group (neutral alcohol) before cleavage.' },
      { q: 'Strong acid cleavage of an ether (e.g., with HI) proceeds through what kind of mechanism for a secondary/tertiary carbon?', options: ['SN2 only', 'SN1, via a carbocation', 'E2 only', 'No mechanism is possible'], correct: 1, why: 'Protonated ethers at secondary/tertiary centers tend to cleave via SN1 (carbocation pathway), while primary centers favor SN2.' }
    ],
    'epoxides': [
      { q: 'Epoxides are much more reactive than regular ethers because:', options: ['They have extra oxygen atoms', 'The three-membered ring has significant ring strain, which is relieved on opening', 'They contain a double bond', 'They are always negatively charged'], correct: 1, why: 'The ~60° bond angles in the three-membered ring are far from ideal, so opening the ring relieves substantial strain, driving reactivity.' },
      { q: 'Under basic conditions, a nucleophile opens an epoxide by attacking:', options: ['The more substituted carbon (SN1-like)', 'The less substituted carbon (SN2-like, backside attack)', 'The oxygen atom', 'Neither carbon'], correct: 1, why: 'Basic/neutral conditions favor an SN2-like mechanism — backside attack at the less hindered carbon.' }
    ],
    'aldehydes-ketones': [
      { q: 'The carbonyl carbon in aldehydes and ketones is hybridized as:', options: ['sp', 'sp²', 'sp³', 'sp³d²'], correct: 1, why: 'The carbonyl carbon has 3 regions of electron density (trigonal planar) — sp², just like an alkene carbon.' },
      { q: 'Ketones are generally less reactive toward nucleophilic addition than aldehydes because:', options: ['Ketones have no carbonyl group', 'The two alkyl groups on a ketone are bulkier and more electron-donating than an aldehyde’s H', 'Aldehydes have no carbonyl oxygen', 'Ketones are always aromatic'], correct: 1, why: 'Extra alkyl groups add steric bulk (hindering attack) and donate electron density (reducing the carbonyl’s electrophilicity) compared to aldehydes.' }
    ],
    'nucleophilic-addition': [
      { q: 'In nucleophilic addition to a carbonyl, the nucleophile attacks:', options: ['The oxygen', 'The electrophilic carbonyl carbon', 'A hydrogen atom', 'The alkyl substituents'], correct: 1, why: 'The carbonyl carbon is δ+ due to oxygen’s electronegativity, making it the site of nucleophilic attack.' },
      { q: 'What happens to the C=O pi bond during nucleophilic addition?', options: ['It strengthens', 'It breaks, pushing electrons onto the oxygen as an alkoxide', 'It becomes a new sigma bond to the nucleophile without changing oxygen', 'Nothing changes'], correct: 1, why: 'The nucleophile forms a new bond to carbon while the C=O pi electrons shift entirely onto oxygen, giving a tetrahedral alkoxide intermediate.' }
    ],
    'acetals': [
      { q: 'An acetal forms from a carbonyl reacting with how many equivalents of alcohol (under acid catalysis)?', options: ['Zero', 'One, giving a hemiacetal only', 'Two, giving a full acetal (two ether-like oxygens)', 'Three'], correct: 2, why: 'The first alcohol gives a hemiacetal; a second equivalent (after loss of water) gives the full acetal with two OR groups on the former carbonyl carbon.' },
      { q: 'Acetals are stable under basic conditions but revert back to the carbonyl under:', options: ['Any conditions', 'Aqueous acid', 'Strong base only', 'They never revert'], correct: 1, why: 'Acetal formation/hydrolysis is acid-catalyzed and reversible — acetals are stable to base, making them useful as protecting groups, but hydrolyze back to the carbonyl in aqueous acid.' }
    ],
    'carboxylic-acids': [
      { q: 'Carboxylic acids are much more acidic than alcohols mainly because their conjugate base (carboxylate) is stabilized by:', options: ['Induction only', 'Resonance delocalization of the negative charge over two oxygens', 'Hydrogen bonding only', 'Nothing — they are equally acidic'], correct: 1, why: 'The carboxylate anion spreads its negative charge equally over two equivalent oxygens via resonance, which is far more stabilizing than an alkoxide’s localized charge.' },
      { q: 'Typical pKa range for carboxylic acids is around:', options: ['−10 to −5', '4–5', '16–18', '40–50'], correct: 1, why: 'Most simple carboxylic acids have pKa values around 4–5, far more acidic than alcohols (pKa ~16–18).' }
    ],
    'esters-amides': [
      { q: 'Which is generally more reactive toward hydrolysis: esters or amides?', options: ['Amides, because nitrogen is a poor leaving group', 'Esters, because the alkoxide leaving group is less resonance-stabilized into the carbonyl than an amide’s nitrogen', 'They are equally reactive', 'Neither reacts with water'], correct: 1, why: 'Amide resonance delocalizes nitrogen’s lone pair strongly into the carbonyl, making amides far less electrophilic and far more hydrolytically stable than esters.' },
      { q: 'The carbonyl stretch in IR for amides appears at a lower wavenumber than esters mainly because:', options: ['Amides have a weaker, more single-bond-like C=O due to resonance with nitrogen', 'Amides contain no oxygen', 'Nitrogen is heavier than oxygen', 'There is no real difference'], correct: 0, why: 'Nitrogen’s lone pair donates into the carbonyl more than an ester oxygen does, giving the amide C=O more single-bond character and a lower, weaker stretching frequency.' }
    ],
    'acyl-substitution': [
      { q: 'Nucleophilic acyl substitution differs from nucleophilic addition (at aldehydes/ketones) because:', options: ['No nucleophile is involved', 'The tetrahedral intermediate collapses, kicking out a leaving group and reforming the C=O', 'The carbonyl is destroyed permanently', 'It only happens with alkenes'], correct: 1, why: 'Acyl substitution goes through a tetrahedral intermediate (addition step) that then expels a leaving group, regenerating the carbonyl — net substitution rather than simple addition.' },
      { q: 'Generally, which is the better leaving group in acyl substitution: chloride (from an acyl chloride) or amide nitrogen (from an amide)?', options: ['Amide nitrogen', 'Chloride', 'They are equal', 'Neither can leave'], correct: 1, why: 'Chloride is a much weaker base than an amine/amide nitrogen, making acyl chlorides far more reactive electrophiles than amides in acyl substitution.' }
    ],
    'alpha-hydrogens': [
      { q: 'Alpha hydrogens (on the carbon next to a carbonyl) are unusually acidic because the resulting carbanion is stabilized by:', options: ['Induction from a distant halogen', 'Resonance delocalization into the adjacent carbonyl (forming an enolate)', 'Hyperconjugation only', 'They are not actually acidic'], correct: 1, why: 'Removing an alpha H gives a carbanion that resonance-delocalizes onto the carbonyl oxygen, forming a stabilized enolate — this is why alpha H’s (pKa ~20) are far more acidic than typical C–H bonds (pKa ~50).' },
      { q: 'An enolate has its negative charge delocalized primarily between which two atoms?', options: ['Two carbons', 'The alpha carbon and the carbonyl oxygen', 'The carbonyl carbon and a distant hydrogen', 'Nitrogen and oxygen'], correct: 1, why: 'The enolate resonance structures place negative charge either on the alpha carbon (carbanion form) or the oxygen (enolate form, more stable).' }
    ],
    'aldol': [
      { q: 'An aldol reaction forms a bond between:', options: ['Two carbonyl oxygens', 'An enolate’s alpha carbon and another carbonyl’s electrophilic carbon', 'Two leaving groups', 'A nucleophile and a leaving group only'], correct: 1, why: 'The aldol reaction is an enolate (nucleophile, from one carbonyl’s alpha carbon) attacking the electrophilic carbonyl carbon of a second molecule, forming a new C–C bond and a beta-hydroxy carbonyl.' },
      { q: 'Heating an aldol product (a beta-hydroxy carbonyl) typically leads to:', options: ['No further reaction', 'Dehydration (E1cb-like loss of water) to form an α,β-unsaturated carbonyl', 'Reduction to an alcohol', 'Formation of a new ring every time'], correct: 1, why: 'Base- or acid-promoted loss of water from the beta-hydroxy group, conjugated with the carbonyl, gives the thermodynamically favorable α,β-unsaturated (enone) product.' }
    ],
    'claisen': [
      { q: 'A Claisen condensation is essentially an aldol-type reaction between two:', options: ['Alcohols', 'Esters, where the enolate of one attacks the carbonyl of another', 'Alkenes', 'Amines'], correct: 1, why: 'Claisen condensation is the ester analog of the aldol: an ester enolate attacks a second ester’s carbonyl carbon, and the tetrahedral intermediate expels an alkoxide (acyl substitution) rather than just forming an alcohol.' },
      { q: 'Unlike the aldol reaction, the Claisen condensation product loses a leaving group because:', options: ['Esters undergo acyl substitution, not simple addition, due to their alkoxy leaving group', 'There is no leaving group present', 'Claisen reactions never form a tetrahedral intermediate', 'Esters cannot form enolates'], correct: 0, why: 'Because the electrophile is an ester (with an OR leaving group attached), the tetrahedral intermediate collapses by expelling alkoxide, giving a β-ketoester rather than a β-hydroxy product.' }
    ],
    'amine-structure': [
      { q: 'Amines are basic because the nitrogen has:', options: ['A positive charge', 'A lone pair available to accept a proton (or donate to a Lewis acid)', 'No lone pairs', 'Four bonds already'], correct: 1, why: 'Neutral amine nitrogen has one lone pair not involved in bonding, which it can donate to a proton (Brønsted base) or any electrophile (Lewis base).' },
      { q: 'Why are amides far less basic than amines, even though both contain nitrogen?', options: ['Amides have no nitrogen lone pair available — it is delocalized into the carbonyl by resonance', 'Amides are positively charged', 'Amide nitrogen has no lone pair at all', 'There is no difference in basicity'], correct: 0, why: 'Amide resonance pulls the nitrogen lone pair into conjugation with the carbonyl, making it far less available to accept a proton than a typical amine’s lone pair.' }
    ],
    'amine-reactions': [
      { q: 'Amines commonly act as nucleophiles toward carbonyls, forming which product after loss of water (with aldehydes/ketones)?', options: ['An ester', 'An imine (C=N)', 'An alcohol only', 'A carboxylic acid'], correct: 1, why: 'A primary amine adds to a carbonyl, and after proton transfers and loss of water, the resulting C=N double bond is an imine.' },
      { q: 'When a primary amine reacts with an acyl chloride or ester, the product (after loss of the leaving group) is a(n):', options: ['Alcohol', 'Amide', 'Alkene', 'Ether'], correct: 1, why: 'This is nucleophilic acyl substitution — the amine nitrogen ends up bonded to the carbonyl carbon, and the leaving group departs, giving an amide.' }
    ],
    'aromaticity': [
      { q: 'For a ring system to be aromatic, it must be cyclic, planar, fully conjugated, and have how many pi electrons (by Hückel’s rule)?', options: ['4n', '4n+2', 'Exactly 6, always', 'An odd number only'], correct: 1, why: 'Hückel’s rule requires 4n+2 pi electrons (n = 0, 1, 2...) in a cyclic, planar, fully conjugated system — benzene’s 6 pi electrons fits n=1.' },
      { q: 'Cyclobutadiene (4 pi electrons) is anti-aromatic rather than aromatic because:', options: ['It has 4n pi electrons, which destabilizes the ring relative to an open-chain analog', 'It has no pi electrons', 'It is not cyclic', 'It is not planar ever'], correct: 0, why: '4 pi electrons fits the 4n pattern (n=1), which Hückel’s rule predicts is destabilizing (anti-aromatic) rather than stabilizing.' }
    ],
    'eas': [
      { q: 'Electrophilic aromatic substitution (EAS) begins with the aromatic ring acting as a:', options: ['Electrophile, attacking an external nucleophile', 'Nucleophile, with its pi electrons attacking an electrophile', 'Leaving group', 'Spectator that does not react'], correct: 1, why: 'The electron-rich aromatic pi system attacks an electrophile, forming a resonance-stabilized cationic intermediate (arenium ion/Wheland intermediate), then loses a proton to restore aromaticity.' },
      { q: 'Why does EAS restore aromaticity at the end rather than simply adding across one double bond (like a normal alkene addition)?', options: ['Aromatic rings cannot undergo addition at all', 'Losing a proton from the cationic intermediate regenerates the highly stable aromatic ring rather than leaving a non-aromatic addition product', 'The electrophile leaves instead', 'There is no mechanistic reason'], correct: 1, why: 'The strong stabilization of the aromatic system makes substitution (proton loss, keeping the ring intact) thermodynamically favored over addition, which would destroy aromaticity.' }
    ],
    'directing-effects': [
      { q: 'An electron-donating group like –OCH₃ on benzene directs further EAS substitution to the:', options: ['Meta position', 'Ortho and para positions', 'Ipso position only', 'It blocks all further substitution'], correct: 1, why: 'Strong electron donors (via resonance) stabilize the arenium intermediate best when the positive charge lands ortho or para to the substituent, directing new substitution there.' },
      { q: 'A nitro group (–NO₂) is an EAS deactivator and directs incoming electrophiles to the:', options: ['Ortho/para positions', 'Meta position', 'Ipso position', 'Every position equally'], correct: 1, why: 'Strong electron-withdrawing groups destabilize the arenium intermediate least when the positive charge is meta (avoiding direct resonance overlap with the withdrawing group), so meta substitution dominates.' }
    ],
    'ir': [
      { q: 'Infrared (IR) spectroscopy primarily tells you about a molecule’s:', options: ['Exact molecular weight', 'Functional groups, based on characteristic bond vibration frequencies', 'Stereochemistry at each center', 'The number of carbons'], correct: 1, why: 'Different bonds (O–H, C=O, C≡N, etc.) vibrate at characteristic frequencies, so IR is mainly used to identify functional groups.' },
      { q: 'A broad absorption around 3200–3550 cm⁻¹ is most characteristic of:', options: ['A C=O stretch', 'An O–H stretch (alcohol or acid)', 'A C≡C stretch', 'An aromatic C–H stretch'], correct: 1, why: 'O–H stretches are broad due to hydrogen bonding and appear in the 3200–3550 cm⁻¹ range, distinct from the sharp, strong C=O stretch around 1700 cm⁻¹.' }
    ],
    'h-nmr': [
      { q: '¹H NMR chemical shift (in ppm) tells you mainly about a hydrogen’s:', options: ['Mass', 'Electronic environment (shielding/deshielding by nearby groups)', 'Exact bond angle', 'Isotope'], correct: 1, why: 'Electron-withdrawing groups nearby deshield a proton, shifting its signal downfield (higher ppm); shielded protons appear upfield.' },
      { q: 'The n+1 rule in ¹H NMR predicts that a proton with n chemically equivalent neighboring protons will show how many peaks (splitting)?', options: ['n', 'n+1', 'n×2', '2n'], correct: 1, why: 'Spin-spin coupling with n equivalent neighbors splits a signal into n+1 peaks (e.g., 3 neighboring H’s give a quartet).' }
    ],
    'c-nmr': [
      { q: '¹³C NMR typically shows each chemically distinct carbon as:', options: ['A large multiplet split by neighboring carbons', 'A single peak (carbons are rarely coupled to each other at natural abundance)', 'No signal at all', 'The same peak as all other carbons'], correct: 1, why: '¹³C is only ~1.1% natural abundance, so two ¹³C atoms are rarely adjacent — carbon-carbon coupling is negligible, giving simple, usually unsplit peaks (with standard decoupling).' },
      { q: 'A carbonyl carbon in ¹³C NMR typically appears:', options: ['Far upfield, near 0–30 ppm', 'Far downfield, around 160–220 ppm', 'At exactly 77 ppm always', 'It gives no signal'], correct: 1, why: 'Carbonyl carbons are strongly deshielded by the adjacent electronegative, pi-bonded oxygen, pushing their signal far downfield (160–220 ppm).' }
    ],
    'mass-spec': [
      { q: 'In mass spectrometry, the molecular ion peak (M+) corresponds to:', options: ['A random fragment', 'The intact molecule after losing one electron', 'Only the smallest fragment', 'The solvent peak'], correct: 1, why: 'The molecular ion forms when the neutral molecule loses an electron in the ionization source, giving a radical cation at the molecule’s full mass.' },
      { q: 'A mass spec fragmentation pattern showing loss of 15 mass units from the molecular ion is most consistent with loss of:', options: ['A water molecule (18)', 'A methyl radical (CH₃, 15)', 'A chlorine atom (35)', 'A proton (1)'], correct: 1, why: 'A mass loss of 15 corresponds to CH₃ (methyl, 12+3=15), a very common fragmentation for molecules with a methyl group attached to a stabilizing center.' }
    ]
  };
})();
