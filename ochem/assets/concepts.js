/* Ochem concept graph — the vocabulary the mastery engine, the diagnostic
   engine, and the question engine all speak.

   A *topic* (curriculum.js) is a lesson-sized chunk of the syllabus: "SN2",
   "E2", "Resonance". A *concept* is the much smaller thing a student
   actually gets right or wrong: "backside attack", "anti-periplanar
   geometry", "recognizing a leaving group". One topic spans many concepts,
   and — crucially — one concept spans many topics. Steric hindrance shows
   up in SN2, in E2, in nucleophilic addition to a ketone, and in
   axial/equatorial preference. That overlap is the whole point: it's what
   lets Practice say "you keep missing sterics" instead of "you're bad at
   SN2", and it's what makes a resonance question inside an acidity problem
   count as review of resonance.

   Each concept carries:
     id        stable key used in localStorage — never renamed casually.
     title     human label shown in feedback and the mastery map.
     family    grouping for the mastery map UI.
     teach     the 1-3 sentence micro-lesson shown right after a mistake
               that was diagnosed as this concept. Written to be read cold,
               mid-session, by someone who just got something wrong.
     hint      one short nudge, shown before the answer is revealed.
     topics    curriculum topic ids this concept shows up in. Used to tag
               the legacy per-topic question bank and to pick which lesson
               to link to for remediation.
     dependsOn concept ids that must be understood first. The recommender
               walks this: if you're failing anti-periplanar geometry and
               you're also shaky on chair conformations, it sends you to
               the prerequisite rather than drilling the symptom.

   Keep `topics` accurate — it's how ~1900 legacy questions get concept
   tags for free. Keep `teach` short — it's remediation, not a lesson. */
(function(){
  var CONCEPTS = [
    /* ---- Structure & bonding ---------------------------------------- */
    { id:'valence-electrons', title:'Valence electrons', family:'Structure & bonding',
      topics:['atomic-structure','orbitals','bonding','lewis-structures'],
      hint:'Count the outermost shell, not every electron in the atom.',
      teach:'Valence electrons are the outer-shell electrons — the only ones that bond. For main-group atoms the group number gives the count: C has 4, N has 5, O has 6, halogens have 7. Almost every structure question starts here.' },
    { id:'formal-charge-calc', title:'Formal charge', family:'Structure & bonding',
      topics:['formal-charge','lewis-structures','resonance','curved-arrows'], dependsOn:['valence-electrons'],
      hint:'Formal charge = valence electrons − (lone-pair electrons + number of bonds).',
      teach:'Formal charge = (group valence electrons) − (dots) − (sticks). Count lone-pair electrons individually and bonds as one each. An oxygen with 3 bonds and 1 lone pair is 6 − 2 − 3 = +1. Getting this wrong quietly wrecks resonance and arrow-pushing.' },
    { id:'lewis-structures-drawing', title:'Building Lewis structures', family:'Structure & bonding',
      topics:['lewis-structures','bonding','molecular-geometry','formal-charge'], dependsOn:['valence-electrons'],
      hint:'Total the valence electrons first, then place them — bonds before lone pairs.',
      teach:'Sum every atom\'s valence electrons (adjusting for overall charge), connect the skeleton, then hand out the remainder as lone pairs until each atom has an octet. If you run short, make a multiple bond — do not just leave an atom electron-deficient.' },
    { id:'hybridization-assignment', title:'Assigning hybridization', family:'Structure & bonding',
      topics:['hybridization','orbitals','molecular-geometry','alkene-structure','alkynes','aromaticity','aldehydes-ketones'],
      hint:'Count groups around the atom: bonds to atoms plus lone pairs. Ignore the extra bonds of a double bond.',
      teach:'Count *groups*, not bonds: attached atoms plus lone pairs. 4 groups = sp3, 3 = sp2, 2 = sp. A C=O carbon has 3 groups (two substituents + the oxygen), so it is sp2 and trigonal planar — the second bond of the C=O does not add a group.' },
    { id:'molecular-geometry-vsepr', title:'Molecular geometry', family:'Structure & bonding',
      topics:['molecular-geometry','hybridization','bond-polarity'], dependsOn:['hybridization-assignment'],
      hint:'Lone pairs take up space and push bond angles closed.',
      teach:'Geometry follows group count, but the *shape name* only counts atoms. Four groups is tetrahedral; swap one bond for a lone pair and it is trigonal pyramidal (NH3), swap two and it is bent (H2O). Lone pairs repel harder, so real angles come in under the ideal.' },
    { id:'electronegativity-trend', title:'Electronegativity trends', family:'Structure & bonding',
      topics:['electronegativity','bond-polarity','acidity-factors','nucleophiles','electrophiles','h-nmr'],
      hint:'Electronegativity rises going right across a period and falling up a group.',
      teach:'Electronegativity increases up and to the right: F > O > N ≈ Cl > C > H. It sets which end of a bond is δ− and which is δ+, which is how you find electrophiles, predict dipoles, and rank inductive acid strength.' },
    { id:'bond-polarity-dipoles', title:'Bond polarity & dipoles', family:'Structure & bonding',
      topics:['bond-polarity','electronegativity','molecular-geometry','ir'], dependsOn:['electronegativity-trend','molecular-geometry-vsepr'],
      hint:'A molecule can hold polar bonds and still have no net dipole if they cancel.',
      teach:'Bond dipoles are vectors: they add with geometry. CCl4 has four very polar bonds pointing at the corners of a tetrahedron, so they cancel and the molecule is nonpolar. Always check the shape before calling a molecule polar.' },

    /* ---- Electron flow ----------------------------------------------- */
    { id:'resonance-delocalization', title:'Resonance delocalization', family:'Electron flow',
      topics:['resonance','curved-arrows','acidity-factors','carboxylic-acids','aromaticity','directing-effects','alpha-hydrogens','conjugate'], dependsOn:['formal-charge-calc'],
      hint:'Resonance needs a p orbital next door — look for a lone pair or pi bond adjacent to the site.',
      teach:'Charge spread over more atoms is charge stabilized. Resonance only happens when the site is adjacent to a pi bond or a lone pair so the orbitals can overlap. Nothing moves but electrons — atoms stay put, and every structure keeps the same total charge.' },
    { id:'resonance-validity', title:'Legal vs. illegal resonance', family:'Electron flow',
      topics:['resonance','curved-arrows','aromaticity'], dependsOn:['resonance-delocalization','formal-charge-calc'],
      hint:'Never break a sigma bond, and never give a second-row atom more than eight electrons.',
      teach:'A resonance structure is only legal if you moved pi electrons or a lone pair, kept every atom in place, and never exceeded an octet on C, N, O or F. Breaking a single bond or expanding carbon past four bonds is not resonance — it is a different molecule.' },
    { id:'curved-arrow-direction', title:'Curved arrow direction', family:'Electron flow',
      topics:['curved-arrows','resonance','sn2','sn1','e1','e2','addition-reactions','nucleophilic-addition','acyl-substitution','eas'], dependsOn:['resonance-delocalization'],
      hint:'Arrows always start at electrons and end where the electrons land.',
      teach:'Arrow tails sit on an electron source — a lone pair, a pi bond, or a sigma bond that is breaking. Arrowheads point at the atom or bond receiving them. Arrows never start at a positive charge or at an empty orbital; electrons move toward electron-poor, not away.' },
    { id:'nucleophile-recognition', title:'Recognizing nucleophiles', family:'Electron flow',
      topics:['nucleophiles','electron-rich-poor','sn2','sn1','addition-reactions','nucleophilic-addition','amine-reactions','alkynes'], dependsOn:['electronegativity-trend'],
      hint:'Look for the electron-rich species: a negative charge, a lone pair, or a pi bond.',
      teach:'A nucleophile is whatever has electrons to give: an anion, a lone pair, or a pi bond. Anion beats neutral (HO− > H2O), and down a group nucleophilicity rises even as basicity falls (I− > Br− > Cl− in protic solvent) because big, polarizable atoms are less caged by solvent.' },
    { id:'electrophile-recognition', title:'Recognizing electrophiles', family:'Electron flow',
      topics:['electrophiles','electron-rich-poor','sn2','sn1','aldehydes-ketones','eas','addition-reactions'], dependsOn:['electronegativity-trend'],
      hint:'Find the atom that is electron-poor: δ+, formally positive, or short of an octet.',
      teach:'An electrophile is electron-poor — a full positive charge, an empty orbital, or a δ+ carbon made that way by an attached electronegative atom. In R–Br, the carbon is the electrophile, not the bromine; in C=O, the carbonyl carbon is, not the oxygen.' },
    { id:'leaving-group-ability', title:'Leaving group ability', family:'Electron flow',
      topics:['leaving-groups','sn2','sn1','e1','e2','alcohol-reactions','epoxides','esters-amides','acyl-substitution'], dependsOn:['pka-scale'],
      hint:'Good leaving groups are weak bases — check the pKa of their conjugate acid.',
      teach:'A leaving group leaves with the bonding electrons, so it has to be stable holding them — that is, a weak base. I− , Br− and TsO− are excellent; HO− , RO− and H2N− are terrible and must be protonated or converted to a tosylate first. Low conjugate-acid pKa means good leaving group.' },
    { id:'electron-rich-poor', title:'Electron-rich vs. electron-poor', family:'Electron flow',
      topics:['electron-rich-poor','nucleophiles','electrophiles','directing-effects','eas'], dependsOn:['electronegativity-trend','resonance-delocalization'],
      hint:'Map the charge distribution before you decide what attacks what.',
      teach:'Before any mechanism, label the molecule: which atoms carry excess electron density (lone pairs, pi bonds, negative charge) and which are starved (δ+, positive, empty orbital). Electrons always flow from rich to poor — that single arrow is most of organic chemistry.' },

    /* ---- Acids & bases ------------------------------------------------ */
    { id:'bronsted-identification', title:'Brønsted acids & bases', family:'Acids & bases',
      topics:['bronsted','conjugate','pka','amine-structure'],
      hint:'Follow the proton: the species that loses H+ is the acid.',
      teach:'A Brønsted acid donates a proton; the base accepts it. Identify the pair by tracking one H+ across the arrow — whatever loses it is the acid, and what is left behind is that acid\'s conjugate base.' },
    { id:'lewis-acid-base', title:'Lewis acids & bases', family:'Acids & bases',
      topics:['lewis-acids','nucleophiles','electrophiles','eas'], dependsOn:['electrophile-recognition'],
      hint:'Lewis acid = electron-pair acceptor. It does not need a proton at all.',
      teach:'The Lewis definition is about electron pairs, not protons: the base donates a pair, the acid accepts it into an empty orbital. AlCl3 and BF3 are Lewis acids with no acidic hydrogen at all. Every nucleophile is a Lewis base; every electrophile is a Lewis acid.' },
    { id:'pka-scale', title:'Reading the pKa scale', family:'Acids & bases',
      topics:['pka','conjugate','acidity-factors','leaving-groups','alpha-hydrogens','amine-structure'],
      hint:'Lower pKa means stronger acid — and each unit is a factor of ten.',
      teach:'pKa is logarithmic and inverted: lower pKa is a stronger acid. A pKa of 5 is a hundred times more acidic than 7. Reactions go from stronger acid to weaker acid, so a base only deprotonates something whose pKa is below its own conjugate acid\'s.' },
    { id:'conjugate-pairs', title:'Conjugate acid/base pairs', family:'Acids & bases',
      topics:['conjugate','bronsted','pka'], dependsOn:['bronsted-identification'],
      hint:'Conjugates differ by exactly one H and one unit of charge.',
      teach:'A conjugate pair differs by exactly one proton: NH3/NH4+, H2O/HO−. The stronger the acid, the weaker (more stable) its conjugate base — which is precisely why stable anions make good leaving groups.' },
    { id:'acidity-factors', title:'What makes an acid strong', family:'Acids & bases',
      topics:['acidity-factors','pka','carboxylic-acids','alkynes','alpha-hydrogens','amine-structure'], dependsOn:['resonance-delocalization','electronegativity-trend','pka-scale'],
      hint:'Judge the stability of the conjugate base, not the acid itself.',
      teach:'Acid strength is conjugate-base stability, in this priority: Atom (size then electronegativity — down a group wins), Resonance, Induction, Orbital (sp > sp2 > sp3). Compare the anions, not the neutral acids, and apply the factors in that order.' },
    { id:'basicity-vs-nucleophilicity', title:'Basicity vs. nucleophilicity', family:'Acids & bases',
      topics:['nucleophiles','sn2','e2','substrate-effects','alkynes'], dependsOn:['nucleophile-recognition','pka-scale'],
      hint:'Basicity attacks H; nucleophilicity attacks C. Size and hindrance separate them.',
      teach:'Basicity is thermodynamic (how hard it grabs a proton); nucleophilicity is kinetic (how fast it attacks carbon). Bulky strong bases like t-BuOK cannot reach carbon, so they eliminate rather than substitute — and that one distinction decides most SN2-vs-E2 questions.' },

    /* ---- Conformations ------------------------------------------------ */
    { id:'newman-reading', title:'Reading Newman projections', family:'Conformations',
      topics:['newman','conformational-analysis'],
      hint:'The front carbon\'s bonds meet at a point; the back carbon\'s come off a circle.',
      teach:'In a Newman projection you sight down one C–C bond. Lines meeting at the center belong to the front carbon; lines emerging from the circle belong to the rear one. Staggered (60° offset) is low energy, eclipsed (0°) is high.' },
    { id:'torsional-strain', title:'Torsional & steric strain', family:'Conformations',
      topics:['newman','conformational-analysis','cyclohexanes'], dependsOn:['newman-reading'],
      hint:'Eclipsing costs energy; two big groups eclipsing each other costs the most.',
      teach:'Torsional strain is the cost of eclipsing bonds; steric strain is the cost of crowding bulky groups. Anti (180°) is the global minimum, gauche (60°) is slightly worse, and fully eclipsed with the two largest groups aligned is the maximum.' },
    { id:'chair-axial-equatorial', title:'Axial vs. equatorial', family:'Conformations',
      topics:['cyclohexanes','axial-equatorial','ring-flips','conformational-analysis','epoxides'],
      hint:'Axial bonds point straight up or down; equatorial bonds fan out along the ring.',
      teach:'Axial bonds alternate up/down around the ring and point vertically; equatorial bonds splay outward. Big substituents prefer equatorial because axial groups suffer 1,3-diaxial clashes with the two axial hydrogens three carbons away.' },
    { id:'ring-flip-mechanics', title:'Ring flips', family:'Conformations',
      topics:['ring-flips','axial-equatorial','conformational-analysis'], dependsOn:['chair-axial-equatorial'],
      hint:'A flip swaps axial and equatorial — but never changes up to down.',
      teach:'Flipping a chair turns every axial bond equatorial and vice versa, while every substituent keeps its up-or-down face. That is why cis/trans relationships survive a flip and only the axial/equatorial labels change.' },
    { id:'steric-hindrance', title:'Steric hindrance', family:'Conformations',
      topics:['sn2','substrate-effects','nucleophiles','axial-equatorial','nucleophilic-addition','aldehydes-ketones','e2'], dependsOn:['torsional-strain'],
      hint:'Count the carbon groups crowding the reacting atom.',
      teach:'Bulk blocks approach. SN2 rate collapses as you go methyl > 1° > 2° >> 3° because the incoming nucleophile cannot reach the backside. The same crowding explains why ketones add nucleophiles more slowly than aldehydes, and why bulky bases eliminate instead of substituting.' },

    /* ---- Stereochemistry ---------------------------------------------- */
    { id:'chirality-recognition', title:'Recognizing chirality', family:'Stereochemistry',
      topics:['chirality','stereocenters','enantiomers','meso'],
      hint:'Chiral means non-superimposable on its mirror image. Check for an internal mirror plane.',
      teach:'A molecule is chiral if it cannot be superimposed on its mirror image. The practical test is symmetry: any internal mirror plane makes it achiral, no matter how many stereocenters it has — that is exactly what a meso compound is.' },
    { id:'stereocenter-identification', title:'Finding stereocenters', family:'Stereochemistry',
      topics:['stereocenters','chirality','rs-configuration','diastereomers','meso'], dependsOn:['chirality-recognition'],
      hint:'A stereocenter is a carbon with four *different* groups.',
      teach:'A stereocenter is an sp3 carbon carrying four different substituents. Trace whole branches, not just the first atom out — two branches that differ only three bonds away still count as different. CH2 and CH3 carbons never qualify.' },
    { id:'cip-priority', title:'CIP priority rules', family:'Stereochemistry',
      topics:['rs-configuration','fischer','enantiomers','diastereomers'], dependsOn:['stereocenter-identification'],
      hint:'Rank by atomic number at the first point of difference; duplicate atoms for double bonds.',
      teach:'Rank substituents by the atomic number of the first atom; on a tie, move outward to the first point of difference and compare the highest sets. A double bond counts as two bonds to a duplicated atom. Compare the first point of difference, not totals.' },
    { id:'rs-assignment', title:'Assigning R and S', family:'Stereochemistry',
      topics:['rs-configuration','fischer','enantiomers'], dependsOn:['cip-priority'],
      hint:'Put the lowest priority in back, then read 1→2→3. Reverse if it was pointing at you.',
      teach:'Rank the four groups, orient the lowest priority away from you, and read 1→2→3: clockwise is R, counterclockwise is S. If the lowest priority points toward you instead, read it as usual and then flip the answer.' },
    { id:'enantiomer-vs-diastereomer', title:'Enantiomers vs. diastereomers', family:'Stereochemistry',
      topics:['enantiomers','diastereomers','meso','fischer'], dependsOn:['rs-assignment'],
      hint:'Every stereocenter inverted = enantiomers. Some but not all = diastereomers.',
      teach:'Invert every stereocenter and you have the enantiomer — same physical properties, opposite optical rotation. Invert some but not all and you have diastereomers, which are different compounds with different melting points, and separable by ordinary means.' },
    { id:'meso-detection', title:'Meso compounds', family:'Stereochemistry',
      topics:['meso','diastereomers','chirality'], dependsOn:['enantiomer-vs-diastereomer','chirality-recognition'],
      hint:'Stereocenters present but an internal mirror plane — achiral anyway.',
      teach:'A meso compound has stereocenters but also an internal mirror plane, so the two halves cancel and the molecule is optically inactive. (2R,3S)-tartaric acid is meso; (2R,3R) is not. Always look for the plane before counting 2^n stereoisomers.' },
    { id:'fischer-reading', title:'Fischer projections', family:'Stereochemistry',
      topics:['fischer','rs-configuration','diastereomers'], dependsOn:['rs-assignment'],
      hint:'Horizontal bonds come toward you; vertical bonds go away.',
      teach:'In a Fischer projection the horizontal lines point at you and the vertical lines point back. Because the lowest priority usually sits vertical (pointing away), 1→2→3 can be read directly — but if it lands on a horizontal bond, reverse your answer.' },
    { id:'stereochemical-outcome', title:'Stereochemical outcome', family:'Stereochemistry',
      topics:['sn2','sn1','e2','addition-reactions','markovnikov','epoxides','substrate-effects'], dependsOn:['rs-assignment','backside-attack'],
      hint:'One-step backside attack inverts; a planar intermediate gives a mixture.',
      teach:'SN2 goes through a single backside attack, so configuration inverts cleanly. SN1 passes through a planar carbocation that either face can attack, so you get racemization (usually with slight inversion bias). The mechanism dictates the stereochemistry, not the other way round.' },

    /* ---- Substitution & elimination ------------------------------------ */
    { id:'substrate-class', title:'Substrate class (1°/2°/3°)', family:'Substitution & elimination',
      topics:['sn2','sn1','e1','e2','substrate-effects','alcohol-reactions'],
      hint:'Count carbons attached to the carbon bearing the leaving group.',
      teach:'Classify by the number of carbons on the carbon holding the leaving group: one is primary, two secondary, three tertiary. This single number decides almost everything — 1° favors SN2/E2, 3° favors SN1/E1, and 2° needs the nucleophile and conditions to break the tie.' },
    { id:'backside-attack', title:'Backside attack', family:'Substitution & elimination',
      topics:['sn2','substrate-effects','epoxides','ether-chemistry'], dependsOn:['steric-hindrance','nucleophile-recognition'],
      hint:'The nucleophile must approach 180° from the leaving group.',
      teach:'In SN2 the nucleophile comes in exactly opposite the leaving group — the only trajectory into the C–LG antibonding orbital. That geometric requirement is why a crowded tertiary carbon simply cannot react, and why the carbon inverts like an umbrella in the wind.' },
    { id:'carbocation-stability', title:'Carbocation stability', family:'Substitution & elimination',
      topics:['sn1','e1','markovnikov','alcohol-reactions','eas','mass-spec'], dependsOn:['resonance-delocalization'],
      hint:'More substituted is more stable; resonance beats everything.',
      teach:'Carbocations are stabilized by adjacent electron donation: 3° > 2° > 1° > methyl through hyperconjugation and induction, and any resonance (allylic, benzylic) outranks the whole series. The faster a substrate makes a stable cation, the more it favors SN1/E1.' },
    { id:'carbocation-rearrangement', title:'Carbocation rearrangements', family:'Substitution & elimination',
      topics:['sn1','e1','markovnikov','alcohol-reactions'], dependsOn:['carbocation-stability'],
      hint:'If a 1,2-shift would make a more stable cation, it happens.',
      teach:'Whenever a hydride or alkyl group on the neighboring carbon can shift to give a more stable cation, it will — a 2° cation next to a quaternary carbon becomes 3° instantly. Any mechanism with a free carbocation must be checked for this before you write the product.' },
    { id:'anti-periplanar-geometry', title:'Anti-periplanar geometry', family:'Substitution & elimination',
      topics:['e2','conformational-analysis','ring-flips','substrate-effects','axial-equatorial'], dependsOn:['chair-axial-equatorial','newman-reading'],
      hint:'The H and the leaving group must be 180° apart — on a ring, both axial.',
      teach:'E2 is concerted, so the breaking C–H and C–LG bonds must lie in one plane, 180° apart. On a cyclohexane that means both must be axial — if the leaving group can only sit equatorial, E2 simply cannot happen from that conformer, no matter how good the base is.' },
    { id:'zaitsev-hofmann', title:'Zaitsev vs. Hofmann', family:'Substitution & elimination',
      topics:['e1','e2','substrate-effects','alcohol-reactions'], dependsOn:['anti-periplanar-geometry','steric-hindrance'],
      hint:'Small base → most substituted alkene. Bulky base → least substituted.',
      teach:'Elimination normally gives the most substituted, most stable alkene (Zaitsev). A bulky base such as t-BuOK or LDA cannot reach the interior hydrogens, so it takes the accessible one and gives the less substituted Hofmann product instead.' },
    { id:'mechanism-selection', title:'Choosing SN1/SN2/E1/E2', family:'Substitution & elimination',
      topics:['substrate-effects','sn1','sn2','e1','e2','alcohol-reactions'], dependsOn:['substrate-class','basicity-vs-nucleophilicity','carbocation-stability','solvent-effects'],
      hint:'Substrate first, then the nucleophile/base strength, then the solvent.',
      teach:'Work in order. Substrate: 3° cannot do SN2, 1° cannot do SN1. Reagent: strong bulky base → E2; strong non-bulky nucleophile → SN2; weak neutral nucleophile (often the solvent) → SN1/E1. Solvent: polar aprotic pushes SN2, polar protic pushes SN1/E1.' },
    { id:'solvent-effects', title:'Solvent effects', family:'Substitution & elimination',
      topics:['substrate-effects','sn1','sn2','nucleophiles'], dependsOn:['nucleophile-recognition'],
      hint:'Protic solvents cage anions; aprotic solvents leave them bare and reactive.',
      teach:'Polar protic solvents (water, alcohols) hydrogen-bond to anions, caging the nucleophile and stabilizing carbocations — they favor SN1/E1. Polar aprotic solvents (DMSO, DMF, acetone) solvate only the cation, leaving the nucleophile naked and fast, which favors SN2.' },
    { id:'rate-law-kinetics', title:'Rate laws & kinetics', family:'Substitution & elimination',
      topics:['sn1','sn2','e1','e2','substrate-effects'], dependsOn:['mechanism-selection'],
      hint:'Only species in the rate-determining step appear in the rate law.',
      teach:'SN2 and E2 are one-step and bimolecular: rate = k[substrate][Nu or base]. SN1 and E1 have a slow first ionization, so rate = k[substrate] only — doubling the nucleophile changes nothing. The "1" and "2" are the molecularity of the slow step.' },

    /* ---- Alkenes & alkynes --------------------------------------------- */
    { id:'alkene-pi-nucleophile', title:'The alkene pi bond as nucleophile', family:'Alkenes & alkynes',
      topics:['alkene-structure','addition-reactions','markovnikov','eas'], dependsOn:['nucleophile-recognition','hybridization-assignment'],
      hint:'The pi bond is the electron source — it attacks, it is not attacked.',
      teach:'A pi bond is loosely held electron density sitting above and below the sigma framework, which makes an alkene a nucleophile. In electrophilic addition the alkene attacks the electrophile (H+ , Br+), never the other way around.' },
    { id:'markovnikov-regiochem', title:'Markovnikov regiochemistry', family:'Alkenes & alkynes',
      topics:['markovnikov','addition-reactions','alkynes','alcohol-reactions'], dependsOn:['carbocation-stability','alkene-pi-nucleophile'],
      hint:'The proton adds so as to leave the more stable carbocation behind.',
      teach:'Markovnikov is a consequence, not a rule to memorize: H+ adds to the carbon with more hydrogens because that leaves the positive charge on the more substituted, more stable carbon. Peroxides switch to a radical mechanism, giving the anti-Markovnikov product.' },
    { id:'addition-stereochem', title:'Syn vs. anti addition', family:'Alkenes & alkynes',
      topics:['addition-reactions','markovnikov','alkynes','epoxides'], dependsOn:['stereochemical-outcome'],
      hint:'A bridged intermediate forces anti; a concerted one-face delivery gives syn.',
      teach:'Bromination and halohydrin formation go through a bridged halonium, so the nucleophile must open it from the opposite face — anti addition. Hydrogenation and dihydroxylation deliver both new bonds from one face at once — syn addition.' },
    { id:'alkyne-acidity', title:'Terminal alkyne acidity', family:'Alkenes & alkynes',
      topics:['alkynes','acidity-factors','alpha-hydrogens'], dependsOn:['acidity-factors','hybridization-assignment'],
      hint:'sp carbon holds its lone pair closer to the nucleus — so it is more acidic.',
      teach:'A terminal alkyne C–H has pKa ≈ 25 because the resulting anion sits in an sp orbital with 50% s character, holding the electrons tight to the nucleus. That makes acetylides accessible with NaNH2 (but not NaOH) and turns them into powerful carbon nucleophiles for SN2.' },

    /* ---- Alcohols, ethers, epoxides ------------------------------------ */
    { id:'alcohol-activation', title:'Activating alcohols', family:'Alcohols & ethers',
      topics:['alcohol-reactions','ether-chemistry','leaving-groups'], dependsOn:['leaving-group-ability'],
      hint:'HO− is a terrible leaving group — protonate it or tosylate it first.',
      teach:'An alcohol will not do substitution directly, because hydroxide is far too basic to leave. Protonate it under acid (making H2O the leaving group), or convert it to a tosylate, or use SOCl2/PBr3. If your mechanism kicks out HO−, it is wrong.' },
    { id:'epoxide-opening-regiochem', title:'Epoxide opening', family:'Alcohols & ethers',
      topics:['epoxides','ether-chemistry','substrate-effects'], dependsOn:['backside-attack','carbocation-stability'],
      hint:'Basic conditions attack the less hindered carbon; acidic attack the more substituted one.',
      teach:'Ring strain makes an epoxide electrophilic on both carbons. Under basic/nucleophilic conditions the nucleophile takes the *less* hindered carbon (pure SN2 sterics). Under acid, the protonated epoxide has partial cation character, so attack shifts to the *more* substituted carbon. Either way the attack is anti.' },

    /* ---- Carbonyl chemistry -------------------------------------------- */
    { id:'carbonyl-electrophilicity', title:'Carbonyl electrophilicity', family:'Carbonyl chemistry',
      topics:['aldehydes-ketones','nucleophilic-addition','acetals','acyl-substitution','esters-amides'], dependsOn:['electrophile-recognition','resonance-delocalization'],
      hint:'The carbonyl carbon is δ+ — that is where nucleophiles attack.',
      teach:'Oxygen pulls the C=O electrons toward itself, leaving the carbon δ+ and open to attack. Aldehydes are more electrophilic than ketones (less steric bulk, less alkyl donation), and protonating the oxygen makes the carbon dramatically more electrophilic still.' },
    { id:'tetrahedral-intermediate', title:'The tetrahedral intermediate', family:'Carbonyl chemistry',
      topics:['nucleophilic-addition','acetals','acyl-substitution','esters-amides','aldol','claisen'], dependsOn:['carbonyl-electrophilicity','curved-arrow-direction'],
      hint:'The pi bond breaks up onto oxygen, giving an alkoxide — then it collapses back or not.',
      teach:'Nucleophilic attack on C=O pushes the pi electrons onto oxygen, making a tetrahedral alkoxide. With an aldehyde or ketone there is nothing to expel, so it just protonates (addition). With an ester or acyl chloride there is a leaving group, so the C=O reforms and kicks it out (substitution).' },
    { id:'acyl-reactivity-order', title:'Acyl substitution reactivity', family:'Carbonyl chemistry',
      topics:['acyl-substitution','esters-amides','carboxylic-acids'], dependsOn:['tetrahedral-intermediate','leaving-group-ability'],
      hint:'Reactivity tracks how good the leaving group is: Cl− > carboxylate > RO− > H2N−.',
      teach:'Acid chloride > anhydride > ester > amide, because the leaving group gets progressively more basic and the lone-pair donation into the C=O gets stronger. You can convert down that list freely, but never up without activating the carbonyl first.' },
    { id:'acetal-formation', title:'Acetals & hemiacetals', family:'Carbonyl chemistry',
      topics:['acetals','nucleophilic-addition','alcohol-reactions'], dependsOn:['tetrahedral-intermediate','alcohol-activation'],
      hint:'One alcohol gives a hemiacetal; a second, under acid, gives the acetal.',
      teach:'Adding one alcohol to a carbonyl gives a hemiacetal (OH + OR on one carbon). Under acid catalysis that OH leaves as water through an oxocarbenium, and a second alcohol adds to give the acetal (two OR groups). Acetals are stable to base — the standard carbonyl protecting group.' },

    /* ---- Enolate chemistry --------------------------------------------- */
    { id:'alpha-acidity', title:'Alpha hydrogen acidity', family:'Enolate chemistry',
      topics:['alpha-hydrogens','aldol','claisen','acidity-factors'], dependsOn:['resonance-delocalization','acidity-factors'],
      hint:'Only hydrogens on the carbon next to a carbonyl are acidic.',
      teach:'An alpha hydrogen (pKa ≈ 20) is acidic because the resulting carbanion is resonance-stabilized onto the carbonyl oxygen — the enolate. Hydrogens two carbons away are not acidic at all. Between two carbonyls the pKa drops to about 9.' },
    { id:'enolate-formation', title:'Forming enolates', family:'Enolate chemistry',
      topics:['alpha-hydrogens','aldol','claisen','amine-reactions'], dependsOn:['alpha-acidity','basicity-vs-nucleophilicity'],
      hint:'Match the base to the job: LDA for full deprotonation, alkoxide for catalytic amounts.',
      teach:'LDA is bulky and strong enough (conjugate acid pKa ≈ 36) to deprotonate the carbonyl completely and irreversibly at the kinetic position. An alkoxide only makes a small equilibrium amount — enough for aldol/Claisen, and matched to the ester so you do not scramble it.' },
    { id:'aldol-connectivity', title:'Aldol connectivity', family:'Enolate chemistry',
      topics:['aldol','alpha-hydrogens','nucleophilic-addition'], dependsOn:['enolate-formation','tetrahedral-intermediate'],
      hint:'The alpha carbon of one partner bonds to the carbonyl carbon of the other.',
      teach:'In an aldol, the enolate\'s alpha carbon attacks the other molecule\'s carbonyl carbon, giving a beta-hydroxy carbonyl. Heat or base then dehydrates it to the conjugated enone. To work backward, cut the C=C or the alpha–beta bond.' },
    { id:'claisen-connectivity', title:'Claisen connectivity', family:'Enolate chemistry',
      topics:['claisen','aldol','acyl-substitution'], dependsOn:['aldol-connectivity','acyl-reactivity-order'],
      hint:'Same attack as an aldol, but the ester expels an alkoxide, giving a beta-keto ester.',
      teach:'A Claisen is an aldol onto an ester: the tetrahedral intermediate collapses and expels RO−, so you get a beta-keto ester rather than a beta-hydroxy one. The driving force is the final deprotonation of the very acidic (pKa ≈ 11) product.' },

    /* ---- Amines -------------------------------------------------------- */
    { id:'amine-basicity', title:'Amine basicity', family:'Amines',
      topics:['amine-structure','amine-reactions','acidity-factors','esters-amides'], dependsOn:['acidity-factors','resonance-delocalization'],
      hint:'A lone pair tied up in resonance is not available to grab a proton.',
      teach:'Alkylamines are decent bases (conjugate acid pKa ≈ 10). Anilines are far weaker because the lone pair delocalizes into the ring, and amides are essentially non-basic because the lone pair is committed to the carbonyl. Availability of the lone pair is everything.' },

    /* ---- Aromatic chemistry -------------------------------------------- */
    { id:'huckel-aromaticity', title:'Aromaticity & Hückel\'s rule', family:'Aromatic chemistry',
      topics:['aromaticity','eas','directing-effects','h-nmr'], dependsOn:['resonance-delocalization','hybridization-assignment'],
      hint:'Cyclic, planar, fully conjugated, and 4n+2 pi electrons — all four.',
      teach:'All four conditions must hold: a ring, planar, a p orbital on every atom of the ring, and 4n+2 pi electrons. Count only pi electrons in the ring, plus any lone pair that occupies a ring p orbital. 4n electrons makes it antiaromatic and destabilized.' },
    { id:'eas-mechanism', title:'EAS mechanism', family:'Aromatic chemistry',
      topics:['eas','directing-effects','aromaticity'], dependsOn:['huckel-aromaticity','carbocation-stability'],
      hint:'Attack, then lose H+ to restore aromaticity — the ring is never permanently added to.',
      teach:'The ring attacks the electrophile to give a resonance-stabilized arenium cation, then a base removes the proton from that same carbon to restore aromaticity. The regenerating step is why EAS is substitution, not addition — aromatic stabilization is worth too much to give up.' },
    { id:'directing-effects', title:'Ortho/para vs. meta directors', family:'Aromatic chemistry',
      topics:['directing-effects','eas','esters-amides'], dependsOn:['eas-mechanism','resonance-delocalization'],
      hint:'Draw the arenium resonance structures and see which position gets the donation.',
      teach:'Donors (lone pair or alkyl) stabilize the arenium ion at the ortho and para positions and activate the ring; withdrawers (C=O, NO2, CF3) destabilize those positions, so substitution defaults to meta. Halogens are the exception — deactivating by induction but still ortho/para directing by resonance.' },

    /* ---- Spectroscopy --------------------------------------------------- */
    { id:'ir-functional-groups', title:'IR functional groups', family:'Spectroscopy',
      topics:['ir','bonding','aldehydes-ketones','carboxylic-acids','esters-amides'],
      hint:'Check three places: ~1700 (C=O), ~3300 broad (O–H), ~2250 (C≡N or C≡C).',
      teach:'IR answers one question well: which functional group is present. A sharp strong peak near 1700 cm⁻¹ is a carbonyl; a broad hump at 3200–3600 is O–H; a sharp spike near 2250 is a triple bond. Fingerprint-region detail is rarely what is being tested.' },
    { id:'nmr-shift-shielding', title:'NMR chemical shift', family:'Spectroscopy',
      topics:['h-nmr','c-nmr','electronegativity','aromaticity'], dependsOn:['electronegativity-trend'],
      hint:'Nearby electronegative atoms and pi systems push signals downfield.',
      teach:'Shift measures how deshielded a nucleus is. Electronegative neighbors strip electron density and move a signal downfield: alkane ~1, next to O ~3.5, vinyl ~5, aromatic ~7, aldehyde ~9.5, carboxylic acid ~11. Ring currents in aromatics deshield strongly.' },
    { id:'nmr-splitting-integration', title:'Splitting & integration', family:'Spectroscopy',
      topics:['h-nmr','c-nmr'], dependsOn:['nmr-shift-shielding'],
      hint:'n neighboring hydrogens give n+1 lines; integration gives the ratio of hydrogens.',
      teach:'Splitting counts *neighbors*, not the hydrogens on the carbon itself: n equivalent neighbors give n+1 peaks. Integration gives relative hydrogen counts, so a 3:2 pattern with a triplet and a quartet is the signature of an ethyl group.' },
    { id:'ms-fragmentation', title:'Mass spec fragmentation', family:'Spectroscopy',
      topics:['mass-spec','sn1'], dependsOn:['carbocation-stability'],
      hint:'Molecules fragment to give the most stable cation available.',
      teach:'The molecular ion breaks apart where it can produce a stable carbocation — tertiary, allylic, or benzylic. The M+2 peak matters: roughly equal M/M+2 means bromine, about a 3:1 ratio means chlorine.' }
  ];

  var BY_ID = {};
  CONCEPTS.forEach(function(c){ BY_ID[c.id] = c; });

  // Inverted index: topic id -> concept ids that show up in that topic. The
  // question engine uses this to tag the legacy per-topic bank, which has no
  // concept metadata of its own.
  var BY_TOPIC = {};
  CONCEPTS.forEach(function(c){
    (c.topics || []).forEach(function(t){
      (BY_TOPIC[t] = BY_TOPIC[t] || []).push(c.id);
    });
  });

  /* Keyword -> concept, scanned over question and answer text to sharpen the
     tag on legacy questions beyond "whatever concepts this topic covers".
     Order matters: the first pattern that hits wins, so the more specific
     phrases are listed first. This is deliberately conservative — a miss just
     falls back to the topic's default concept, which is still usable. */
  var KEYWORD_RULES = [
    [/anti-?periplanar|180.{0,12}apart|both axial/i, 'anti-periplanar-geometry'],
    [/backside|back side|inversion of configuration|umbrella/i, 'backside-attack'],
    [/steric|hinder|bulky|crowd/i, 'steric-hindrance'],
    [/zaitsev|hofmann|most substituted alkene|least substituted alkene/i, 'zaitsev-hofmann'],
    [/rearrang|hydride shift|methyl shift|1,2-shift/i, 'carbocation-rearrangement'],
    [/carbocation|carbenium|tertiary cation/i, 'carbocation-stability'],
    [/leaving group|tosylate|good.{0,12}leave/i, 'leaving-group-ability'],
    [/nucleophil/i, 'nucleophile-recognition'],
    [/electrophil/i, 'electrophile-recognition'],
    [/resonance|delocaliz|conjugat(ed|ion)/i, 'resonance-delocalization'],
    [/curved arrow|arrow.{0,14}(start|tail|head)|push.{0,10}electron/i, 'curved-arrow-direction'],
    [/formal charge/i, 'formal-charge-calc'],
    [/hybridi[sz]/i, 'hybridization-assignment'],
    [/electronegativ/i, 'electronegativity-trend'],
    [/pka|acid(ity)? strength|stronger acid/i, 'pka-scale'],
    [/conjugate (acid|base)/i, 'conjugate-pairs'],
    [/protic|aprotic|solvent/i, 'solvent-effects'],
    [/rate.{0,10}(law|determin)|bimolecular|unimolecular|first.order|second.order/i, 'rate-law-kinetics'],
    [/axial|equatorial|1,3-diaxial/i, 'chair-axial-equatorial'],
    [/ring flip/i, 'ring-flip-mechanics'],
    [/newman|staggered|eclipsed|gauche|anti conformer/i, 'newman-reading'],
    [/r\/s|assign.{0,10}(r|s) config|clockwise|counterclockwise/i, 'rs-assignment'],
    [/cip|priorit/i, 'cip-priority'],
    [/stereocenter|chiral(ity)? cent/i, 'stereocenter-identification'],
    [/meso/i, 'meso-detection'],
    [/enantiomer|diastereomer|racem/i, 'enantiomer-vs-diastereomer'],
    [/fischer/i, 'fischer-reading'],
    [/markovnikov/i, 'markovnikov-regiochem'],
    [/syn addition|anti addition|halonium|bridged/i, 'addition-stereochem'],
    [/tetrahedral intermediate|alkoxide intermediate/i, 'tetrahedral-intermediate'],
    [/acetal|hemiacetal/i, 'acetal-formation'],
    [/alpha (hydrogen|carbon|proton)|enolate|enol/i, 'alpha-acidity'],
    [/aldol/i, 'aldol-connectivity'],
    [/claisen/i, 'claisen-connectivity'],
    [/h(ü|u)ckel|4n ?\+ ?2|aromatic/i, 'huckel-aromaticity'],
    [/ortho|meta|para|directing/i, 'directing-effects'],
    [/splitting|n ?\+ ?1|integrat|multiplet|triplet|quartet/i, 'nmr-splitting-integration'],
    [/chemical shift|ppm|downfield|upfield|shield/i, 'nmr-shift-shielding'],
    [/wavenumber|cm-?1|cm⁻¹|stretch/i, 'ir-functional-groups'],
    [/fragment|molecular ion|m\+2/i, 'ms-fragmentation'],
    [/epoxide|oxirane/i, 'epoxide-opening-regiochem'],
    [/amine.{0,20}bas|basicity of/i, 'amine-basicity'],
    [/lewis acid|empty orbital|electron.pair acceptor/i, 'lewis-acid-base'],
    [/valence electron/i, 'valence-electrons'],
    [/lone pair|octet/i, 'lewis-structures-drawing'],
    [/geometry|tetrahedral|trigonal|bent|vsepr/i, 'molecular-geometry-vsepr'],
    [/dipole|polar(ity)?/i, 'bond-polarity-dipoles']
  ];

  /* Best-guess concept for a chunk of text, restricted to concepts that
     actually belong to this topic so a stray word like "resonance" inside a
     spectroscopy question cannot drag it into the wrong bucket. Returns null
     when nothing matches, and the caller falls back to the topic default. */
  function inferConcept(text, topicId){
    if(!text) return null;
    var allowed = topicId ? BY_TOPIC[topicId] : null;
    for(var i=0;i<KEYWORD_RULES.length;i++){
      if(KEYWORD_RULES[i][0].test(text)){
        var id = KEYWORD_RULES[i][1];
        if(!allowed || allowed.indexOf(id) !== -1) return id;
      }
    }
    return null;
  }

  /* The concept a topic is "mostly about". Declared explicitly rather than
     derived from BY_TOPIC order, because BY_TOPIC order is just the order
     concepts happen to appear in the array above — which would make the
     primary concept of SN2 "curved arrow direction" instead of "backside
     attack". This is the tag a legacy question falls back to when keyword
     inference finds nothing specific, so it needs to be the thing that topic
     is actually testing. */
  var TOPIC_PRIMARY = {
    'atomic-structure':'valence-electrons', 'orbitals':'valence-electrons',
    'hybridization':'hybridization-assignment', 'bonding':'lewis-structures-drawing',
    'electronegativity':'electronegativity-trend', 'formal-charge':'formal-charge-calc',
    'lewis-structures':'lewis-structures-drawing', 'molecular-geometry':'molecular-geometry-vsepr',
    'bond-polarity':'bond-polarity-dipoles',
    'resonance':'resonance-delocalization', 'curved-arrows':'curved-arrow-direction',
    'nucleophiles':'nucleophile-recognition', 'electrophiles':'electrophile-recognition',
    'leaving-groups':'leaving-group-ability', 'electron-rich-poor':'electron-rich-poor',
    'bronsted':'bronsted-identification', 'lewis-acids':'lewis-acid-base', 'pka':'pka-scale',
    'conjugate':'conjugate-pairs', 'acidity-factors':'acidity-factors',
    'newman':'newman-reading', 'cyclohexanes':'chair-axial-equatorial',
    'axial-equatorial':'chair-axial-equatorial', 'ring-flips':'ring-flip-mechanics',
    'conformational-analysis':'torsional-strain',
    'chirality':'chirality-recognition', 'stereocenters':'stereocenter-identification',
    'enantiomers':'enantiomer-vs-diastereomer', 'diastereomers':'enantiomer-vs-diastereomer',
    'meso':'meso-detection', 'rs-configuration':'rs-assignment', 'fischer':'fischer-reading',
    'sn2':'backside-attack', 'sn1':'carbocation-stability', 'e1':'carbocation-stability',
    'e2':'anti-periplanar-geometry', 'substrate-effects':'mechanism-selection',
    'alkene-structure':'alkene-pi-nucleophile', 'addition-reactions':'alkene-pi-nucleophile',
    'markovnikov':'markovnikov-regiochem', 'alkynes':'alkyne-acidity',
    'alcohol-reactions':'alcohol-activation', 'ether-chemistry':'alcohol-activation',
    'epoxides':'epoxide-opening-regiochem',
    'aldehydes-ketones':'carbonyl-electrophilicity', 'nucleophilic-addition':'tetrahedral-intermediate',
    'acetals':'acetal-formation',
    'carboxylic-acids':'acidity-factors', 'esters-amides':'acyl-reactivity-order',
    'acyl-substitution':'acyl-reactivity-order',
    'alpha-hydrogens':'alpha-acidity', 'aldol':'aldol-connectivity', 'claisen':'claisen-connectivity',
    'amine-structure':'amine-basicity', 'amine-reactions':'nucleophile-recognition',
    'aromaticity':'huckel-aromaticity', 'eas':'eas-mechanism', 'directing-effects':'directing-effects',
    'ir':'ir-functional-groups', 'h-nmr':'nmr-splitting-integration',
    'c-nmr':'nmr-shift-shielding', 'mass-spec':'ms-fragmentation'
  };
  function defaultConceptFor(topicId){
    if(TOPIC_PRIMARY[topicId]) return TOPIC_PRIMARY[topicId];
    var list = BY_TOPIC[topicId];
    return list && list.length ? list[0] : null;
  }

  function get(id){ return BY_ID[id] || null; }
  function title(id){ var c = BY_ID[id]; return c ? c.title : id; }

  /* A concept title as it reads mid-sentence ("you're struggling with ___").
     Naively lowercasing mangles the acronyms — "IR functional groups" must
     not become "ir functional groups" — so only the first letter is lowered,
     and only when the first word isn't an acronym in the first place. */
  function phrase(id){
    var t = title(id);
    if(/^[A-Z]{2,}\b/.test(t)) return t;
    return t.charAt(0).toLowerCase() + t.slice(1);
  }

  // Which curriculum topic should we send someone to in order to actually
  // (re)learn this concept? First topic listed that has a shipped lesson.
  function lessonTopicFor(conceptId){
    var c = BY_ID[conceptId];
    if(!c) return null;
    var C = window.OchemCurriculum;
    for(var i=0;i<(c.topics||[]).length;i++){
      var t = C && C.findTopic ? C.findTopic(c.topics[i]) : null;
      if(t && t.href) return t;
    }
    return null;
  }

  function families(){
    var seen = [], out = [];
    CONCEPTS.forEach(function(c){
      if(seen.indexOf(c.family) === -1){ seen.push(c.family); out.push({ name: c.family, concepts: [] }); }
      out[seen.indexOf(c.family)].concepts.push(c);
    });
    return out;
  }

  window.OchemConcepts = {
    ALL: CONCEPTS,
    get: get,
    title: title,
    phrase: phrase,
    byTopic: function(topicId){ return (BY_TOPIC[topicId] || []).slice(); },
    defaultConceptFor: defaultConceptFor,
    inferConcept: inferConcept,
    lessonTopicFor: lessonTopicFor,
    families: families
  };
})();
