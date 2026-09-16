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
    /* Skeletal notation. Two concepts rather than one because students fail
       them separately and in different places: reading the skeleton (a vertex
       and an END are both carbons) is a counting error, while the implied
       hydrogens are an inference error that only shows up later, when a
       mechanism asks for a hydrogen nobody drew. Tagged into the topics that
       assume fluency rather than teach it — every mechanism after Foundations
       is drawn this way. */
    /* Radical chemistry. Its own pair rather than folded into Electron flow,
       because the defining move is single-electron (fishhook) rather than the
       pair-pushing every other mechanism in the course uses — a student who is
       fluent in curved arrows can still be lost here. Tagged into markovnikov
       and mass-spec, which is where radicals reappear. */
    { id:'radical-chain', title:'Radical chain mechanism', family:'Electron flow',
      topics:['radical-halogenation','markovnikov','mass-spec'],
      hint:'Count the radicals before and after the step: up from zero, unchanged, or down to zero.',
      teach:'Sort a radical step by what it does to the radical COUNT, never by whether a product appears. Zero to two is initiation, one to one is propagation, two to zero is termination. The second propagation step makes the product and is still propagation. Bonds break homolytically and the arrows are single-barbed fishhooks; if a step produces a charge, it was not a radical step.' },
    { id:'radical-stability', title:'Radical stability and selectivity', family:'Electron flow',
      topics:['radical-halogenation','markovnikov','mass-spec'], dependsOn:['radical-chain'],
      hint:'Radicals rank like carbocations: 3° > 2° > 1° > methyl. Then ask how selective the attacking radical is.',
      teach:'Radicals follow 3° > 2° > 1° > methyl, for the same hyperconjugation reason carbocations do. How much that matters depends on the halogen: bromine prefers 3° over 1° by roughly 1600 to 1, chlorine by about 5 to 1. The sluggish reagent is the selective one — its transition state comes late and looks like the radical, so the radical\'s stability shows up in the rate. Rates are per hydrogen, so multiply by how many there are.' },
    /* ---- Nomenclature ------------------------------------------------
       Four concepts, split the way students actually fail. Picking the parent
       chain is a structural skill; the locant rules are a procedure; the
       priority order is recall; and the alphabet rules are a small set of
       exceptions people misapply in a specific direction. Merging them would
       hide which of the four a wrong name came from, which is the one thing
       the mastery model is for. */
    { id:'parent-chain', title:'Choosing the parent chain', family:'Nomenclature',
      topics:['naming-parent-chain','naming-rings-unsaturation','naming-functional-groups'],
      dependsOn:['skeletal-notation'],
      hint:'Longest CONTINUOUS path, turning corners if it has to — and it must contain the principal characteristic group.',
      teach:'The parent is the longest continuous chain of carbons, which is very often not the row drawn horizontally across the page. Two rules bend it: when two chains tie, take the one with more substituents; and once a principal characteristic group is present, the parent must contain it even if that means a shorter chain. Count carbons, not line segments.' },
    { id:'locant-rules', title:'Numbering and locants', family:'Nomenclature',
      topics:['naming-parent-chain','naming-substituents','naming-functional-groups','naming-rings-unsaturation'],
      dependsOn:['parent-chain'],
      hint:'Compare the two locant sets term by term and stop at the first place they differ.',
      teach:'Number from the end giving the lowest set of locants, decided at the FIRST POINT OF DIFFERENCE — not by adding the numbers up, which agrees often enough to feel right and is not the rule. Priority order for who gets the low number: principal characteristic group, then multiple bonds, then prefixes, then the alphabet as a last tie-break. Every substituent keeps its own locant, so di- needs two numbers.' },
    { id:'group-priority', title:'Functional group priority', family:'Nomenclature',
      topics:['naming-functional-groups','naming-rings-unsaturation','carboxylic-acids','esters-amides','aldehydes-ketones'],
      hint:'One group takes the suffix; every other becomes a prefix. Ethers and halides can never be the suffix.',
      teach:'acid > ester > amide > nitrile > aldehyde > ketone > alcohol > amine > alkene/alkyne. Ethers, halides and nitro groups are never suffixes. The winner takes the suffix AND the lowest locant, and the parent chain must contain it. A demoted group changes name: an -ol becomes hydroxy-, a ketone becomes oxo-.' },
    { id:'alphabetization', title:'Citation order in a name', family:'Nomenclature',
      topics:['naming-substituents','naming-rings-unsaturation'], dependsOn:['locant-rules'],
      hint:'The typography tells you: a hyphenated italic prefix is skipped, one joined to the word is counted.',
      teach:'Substituents are cited alphabetically whatever their numbers. Ignore the multiplying prefixes di-, tri-, tetra- and the italic sec-, tert-; do NOT ignore iso, neo or cyclo. Alphabetical order sets the order of WORDS in the name — it only touches the numbering when both directions give an identical locant set.' },
    /* ---- Conjugation ---------------------------------------------------
       Split four ways because these fail independently: recognizing that a
       system IS conjugated, predicting where a delocalized intermediate gets
       captured, deciding which of two products conditions select, and the
       geometric/stereochemical requirements of the cycloaddition. */
    { id:'conjugation-recognition', title:'Recognizing conjugation', family:'Conjugation',
      topics:['conjugated-systems','uv-vis','diels-alder','aromaticity','resonance'],
      dependsOn:['resonance-delocalization'],
      hint:'Alternating single and double bonds, with every atom in the run sp2 so the p orbitals line up.',
      teach:'Conjugated means the p orbitals overlap continuously: double bonds alternating with single bonds, or a lone pair, empty p orbital or radical next to a pi bond. Isolated means separated by sp3 carbons; cumulated means sharing a carbon, with the two pi systems perpendicular and unable to interact. Conjugation is worth about 15 kJ/mol, measurable by heats of hydrogenation.' },
    { id:'allylic-capture', title:'Capturing a delocalized intermediate', family:'Conjugation',
      topics:['diene-addition','kinetic-thermodynamic','markovnikov','radical-halogenation'],
      dependsOn:['conjugation-recognition'],
      hint:'Draw both resonance forms of the intermediate — the nucleophile can arrive at either end.',
      teach:'An allylic cation has positive charge at BOTH ends of the three-carbon system and none in the middle, so a nucleophile has two places to attack. That is where 1,2- and 1,4-addition products come from. Which resonance form is the better one (more substituted cation) tells you where most of the charge sits, and therefore which product forms faster.' },
    { id:'kinetic-vs-thermodynamic', title:'Kinetic vs thermodynamic control', family:'Conjugation',
      topics:['kinetic-thermodynamic','diene-addition','alpha-hydrogens','aldol','e2','eas'],
      dependsOn:['allylic-capture'],
      hint:'Ask first whether the reaction can reverse. That decides which comparison matters.',
      teach:'The kinetic product forms FASTER (lower barrier); the thermodynamic product is more STABLE (deeper well). They need not be the same compound. Reversibility is the switch: irreversible and cold means the rates decide, reversible and warm means the stabilities decide. A stated low temperature such as -78 C is usually a signal that kinetic control is intended.' },
    { id:'cycloaddition-geometry', title:'Cycloaddition requirements', family:'Conjugation',
      topics:['diels-alder','conjugated-systems','diastereomers'],
      dependsOn:['conjugation-recognition'],
      hint:'s-cis or nothing — and because it is concerted, the starting geometry survives into the product.',
      teach:'The diene must react from its s-cis conformation, which is the commonest reason a Diels-Alder fails. The reaction is concerted with no intermediate, so it is stereospecific: cis substituents on the dienophile stay cis in the product, trans stays trans. Electron-rich diene plus electron-poor dienophile is fastest. The endo product is the kinetic one, via secondary orbital interactions.' },
    /* ---- Oxidation & reduction -----------------------------------------
       Four concepts. Counting the oxidation level is a separate skill from
       knowing the reagents; and among the reagents, "where does it stop" and
       "what else does it touch" fail independently, so they are separate too.
       Stereochemical control (syn vs anti, cis vs trans) is its own thing
       again, and is what synthesis questions usually hinge on. */
    { id:'oxidation-level', title:'Counting oxidation level', family:'Oxidation & reduction',
      topics:['oxidation-states','alcohol-oxidation','carbonyl-reduction','alkene-oxidation','esters-amides'],
      dependsOn:['electronegativity-trend'],
      hint:'More bonds to O (or N, halogen) is up; more bonds to H is down; C-C counts zero.',
      teach:'Oxidation gains bonds to electronegative atoms or loses bonds to hydrogen; reduction is the reverse. The ladder runs alkane, alcohol, aldehyde/ketone, carboxylic acid, CO2. A reaction that gains one C-H and one C-O is redox-NEUTRAL, which is most alkene additions. Acid, ester, amide and nitrile all sit on the same rung, which is why they interconvert by substitution rather than by redox.' },
    { id:'oxidant-choice', title:'Where an oxidation stops', family:'Oxidation & reduction',
      topics:['alcohol-oxidation','oxidation-states','alkene-oxidation'], dependsOn:['oxidation-level'],
      hint:'For a chromium reagent, ask whether there is water in the flask.',
      teach:'A primary alcohol gives an aldehyde with an ANHYDROUS oxidant (PCC, Swern, DMP) and a carboxylic acid with an AQUEOUS one (Jones, CrO3/H2SO4). The reason is the hydrate: in water the aldehyde forms a gem-diol, which is an alcohol again and gets oxidized a second time. Secondary alcohols give ketones either way; tertiary alcohols do not react, because there is no C-H on the carbinol carbon to remove.' },
    { id:'reductant-scope', title:'What a reducing agent will touch', family:'Oxidation & reduction',
      topics:['carbonyl-reduction','hydrogenation','esters-amides','amine-reactions'], dependsOn:['oxidation-level'],
      hint:'Choosing the WEAKER reagent on purpose is usually how selectivity is achieved.',
      teach:'NaBH4 reduces aldehydes and ketones and little else, and tolerates methanol. LiAlH4 also reduces esters, acids, amides and nitriles, and reacts violently with water. An amide plus LiAlH4 gives an AMINE, not an alcohol. Neither hydride touches an isolated C=C — that needs catalytic hydrogenation, which in turn leaves esters, acids and benzene rings alone under ordinary conditions.' },
    { id:'redox-stereochemistry', title:'Stereochemical control in redox', family:'Oxidation & reduction',
      topics:['hydrogenation','alkene-oxidation','diastereomers','epoxides','alkynes'],
      dependsOn:['reductant-scope','stereochemical-outcome'],
      hint:'Ask whether both new bonds arrive on the same face.',
      teach:'Surface and cyclic mechanisms deliver both new groups to one face: catalytic hydrogenation is SYN, and OsO4 gives the SYN (cis) diol. Going through an epoxide and opening it with water gives the ANTI (trans) diol instead, because the nucleophile attacks from the opposite face. For alkynes, Lindlar gives the cis alkene and Na/NH3 gives the trans one — one substrate, two conditions, two geometries.' },
    /* ---- Synthesis ------------------------------------------------------
       Four concepts, split by what actually goes wrong. Choosing a
       disconnection, knowing the short list of C-C reactions, navigating the
       functional group map, and getting the ORDER right are separate
       failures — a student can have all the reactions and still write a route
       that destroys its own reagent in step two. */
    { id:'disconnection', title:'Choosing a disconnection', family:'Synthesis',
      topics:['retrosynthesis','carbon-carbon-bonds','multistep-synthesis','diels-alder','aldol'],
      hint:'A disconnection is only legitimate if you can name the forward reaction that makes that bond.',
      teach:'Retrosynthesis works backwards from the target with an open arrow meaning "could be made from". Disconnect next to functional groups, at branch points, and across a cyclohexene (retro-Diels-Alder). The fragments are synthons — idealized, usually charged — and each has a real synthetic equivalent: R- is a Grignard, RCO+ is an acyl chloride with AlCl3. A structural pattern that signals a disconnection is a retron: a beta-hydroxy carbonyl means aldol, a 1,3-dicarbonyl means Claisen.' },
    { id:'cc-bond-toolkit', title:'Ways to make a C–C bond', family:'Synthesis',
      topics:['carbon-carbon-bonds','retrosynthesis','multistep-synthesis','alkynes','aldol','claisen','eas'],
      dependsOn:['disconnection'],
      hint:'Count the carbons first. The difference tells you how many C-C bonds you must form.',
      teach:'There are only about ten: Grignard or organolithium onto a carbonyl or CO2, acetylide plus alkyl halide, cyanide plus alkyl halide, aldol, Claisen, Michael, Diels-Alder, Friedel-Crafts, Wittig. The one-carbon extensions are worth knowing as a set — RX + NaCN, RMgBr + CO2, RMgBr + formaldehyde — because each ends somewhere different. A carbonyl offers three attachment points: the carbonyl carbon, the alpha carbon via an enolate, and the beta carbon via conjugate addition.' },
    { id:'fgi-map', title:'Functional group interconversion', family:'Synthesis',
      topics:['functional-group-interconversion','multistep-synthesis','oxidation-states','alcohol-reactions'],
      dependsOn:['oxidation-level'],
      hint:'Ask whether the move is UP or DOWN the oxidation ladder, or SIDEWAYS within one level.',
      teach:'Up or down the ladder needs a redox reagent; sideways within a level (alcohol to halide, acid to ester to amide) is substitution and needs none. Asking which kind of move it is picks the class of reagent immediately. Some conversions have no direct reagent and go around: to move a functional group along a chain, eliminate to the alkene and add back with the opposite regiochemistry.' },
    { id:'route-order', title:'Ordering a synthesis', family:'Synthesis',
      topics:['multistep-synthesis','protecting-groups','directing-effects','eas','amine-reactions'],
      dependsOn:['cc-bond-toolkit','fgi-map'],
      hint:'For every step ask what ELSE the reagent could attack, and whether the product survives the next step.',
      teach:'Install sensitive groups late. A Grignard is destroyed by any O-H, N-H or S-H in the molecule, so that group goes on later or gets protected. On a ring the group attached first decides where the next one lands. Use Friedel-Crafts ACYLATION then reduce, rather than alkylation, because the alkylation cation rearranges. Protecting groups cost two steps, so prefer a selective reagent or a reordering first — an acetal protects a carbonyl and comes off with aqueous acid, a silyl ether protects an alcohol and comes off with fluoride, and being removable independently makes them orthogonal.' },
    /* ---- Biomolecules ---------------------------------------------------
       Five concepts, one per section, because the failures really are
       separate: a student who has the sugar ring cold can still think the
       peptide nitrogen is basic. Each one is a reaction already taught,
       named again in its biological setting, so the dependsOn edges point
       back at the general reaction rather than sideways. */
    { id:'sugar-ring', title:'Sugars as cyclic hemiacetals', family:'Biomolecules',
      topics:['carbohydrates','nucleic-acids','acetals','nucleophilic-addition','fischer'],
      hint:'The ring is not a new reaction — it is the molecule\'s own OH adding to its own carbonyl.',
      teach:'An -OH three or four carbons down the chain reaches the carbonyl and adds to it, giving a cyclic HEMIACETAL: in an aldohexose the C4 OH closes a five-membered furanose and the C5 OH a six-membered pyranose. The old carbonyl carbon becomes the ANOMERIC carbon, the only one carrying both an OR and an OH, and it is a new stereocenter — down is alpha, up is beta in D-sugars. Because the ring opens and closes through the open-chain aldehyde, the two anomers interconvert in solution (mutarotation) and the sugar still reduces Tollens\' reagent. Cap that OH with a second alcohol and you have an ACETAL, called a glycoside: the ring can no longer open, so a glycoside is non-reducing.' },
    { id:'zwitterion', title:'Amino acids as internal salts', family:'Biomolecules',
      topics:['amino-acids','peptides-proteins','pka','bronsted','acidity-factors'],
      dependsOn:['acidity-factors'],
      hint:'Draw the charges before anything else: at pH 7 neither end of an amino acid is neutral.',
      teach:'The COOH (pKa about 2) and the NH2 (pKa about 9 to 10) are on the same molecule, so the acid protonates the amine and the neutral form is the doubly charged ZWITTERION. Net charge follows pH: fully protonated and +1 in strong acid, zwitterionic and 0 near neutral, fully deprotonated and -1 in base. The pH where the net charge is zero is the isoelectric point, and for a side chain without its own ionizable group pI = (pKa1 + pKa2)/2, about 6. Above its pI the molecule is net negative and moves toward the anode in electrophoresis; below it, the other way.' },
    { id:'peptide-bond', title:'The peptide bond is an amide', family:'Biomolecules',
      topics:['peptides-proteins','amino-acids','esters-amides','acyl-substitution','resonance'],
      dependsOn:['resonance-delocalization'],
      hint:'Everything odd about the peptide bond is one resonance structure doing its job.',
      teach:'Joining the COOH of one amino acid to the NH2 of the next gives an AMIDE, written N-terminus to C-terminus. The nitrogen lone pair delocalizes into the carbonyl, and three consequences follow at once: the C-N bond is partly double, so the unit is planar and rotation about it is restricted; the nitrogen is not basic, because that lone pair is already spoken for; and the amide is the least reactive acyl derivative, so hydrolysis needs hot acid or an enzyme. Backbone hydrogen bonding builds helices and sheets, disulfides between cysteines are the only covalent cross-link, and the hydrophobic effect buries the nonpolar side chains.' },
    { id:'lipid-ester', title:'Fats are esters, and shape sets melting point', family:'Biomolecules',
      topics:['lipids','esters-amides','acyl-substitution','hydrogenation','alkene-structure'],
      hint:'Lipid is a solubility class, not a functional group — ask what the ester is doing.',
      teach:'A triglyceride is glycerol triple-esterified with three fatty acids, so hydroxide hydrolyzes it to glycerol plus three carboxylate salts: soap, and the reaction is saponification. A soap works because one molecule has an ionic head and a long nonpolar tail, so it gathers into micelles. Saturated chains pack straight and stack well, giving a solid; one CIS double bond puts a kink in the chain, packing fails, and the melting point drops — which is the whole difference between lard and olive oil. Partial hydrogenation isomerizes some of those cis bonds to TRANS, which packs like a saturated chain again. Replace one fatty acid with a phosphate and the molecule has both a head and tails, which is the bilayer.' },
    { id:'nucleotide-assembly', title:'How a nucleotide is put together', family:'Biomolecules',
      topics:['nucleic-acids','carbohydrates','acetals','amine-structure','bond-polarity'],
      dependsOn:['sugar-ring'],
      hint:'Build it in order: sugar, then base, then phosphate. Two of the three links you already know.',
      teach:'A base bonded to the anomeric carbon of ribose or 2-deoxyribose is a NUCLEOSIDE, and that bond is an N-glycoside — the same acetal-forming step as an O-glycoside, with nitrogen as the nucleophile. Add a phosphate ester at the 5\' OH and it is a NUCLEOTIDE. Phosphate then esterifies a second sugar at its 3\' OH, so the backbone is a chain of PHOSPHODIESTERS running 5\' to 3\'. RNA keeps the 2\' OH, which can attack the neighboring phosphate, and that is why RNA hydrolyzes and DNA lasts. The two strands run antiparallel and pair by hydrogen bonds only: A-T with two, G-C with three. Weak bonds are the right choice, because the strands have to come apart to be read.' },
    /* ---- Organometallics -----------------------------------------------
       Five concepts on one axis. Every question in this chapter is really
       "how reactive does this reagent need to be", and the failures are
       separate: not seeing why the carbon is nucleophilic at all, forgetting
       what kills the reagent, picking 1,2 when 1,4 was wanted, and treating
       the palladium cycle as four names rather than one mechanism. */
    { id:'polarity-reversal', title:'Why C–metal means nucleophilic carbon', family:'Organometallics',
      topics:['organometallic-bonding','grignard-reagents','electronegativity','bond-polarity','nucleophiles'],
      hint:'Compare the electronegativities and put the electrons on the more electronegative atom. Here that is carbon.',
      teach:'Carbon is at 2.55, magnesium 1.31, lithium 0.98. So in C-Cl the carbon is delta plus, and in C-MgBr the SAME carbon is delta minus: it has gone from electrophile to nucleophile without anything else about the molecule changing. A deliberate reversal like this is called umpolung. The C-Mg bond is polar covalent rather than ionic, so the reagent is not a free carbanion, but it behaves like one and the curved arrow starts at the C-metal bond.' },
    { id:'organometallic-quench', title:'What destroys an organometallic', family:'Organometallics',
      topics:['grignard-reagents','organolithium-reagents','organometallic-bonding','protecting-groups','pka'],
      dependsOn:['polarity-reversal'],
      hint:'Scan the substrate for O-H, N-H, S-H and terminal alkyne C-H before writing any organometallic step.',
      teach:'R- is the conjugate base of an alkane, pKa about 50, so it deprotonates essentially anything acidic: water at 15.7, alcohols at 16, carboxylic acids at 5, amines at 35, terminal alkynes at 25. The reagent is consumed and the carbonyl is untouched, which is why a route that works on paper fails in a flask. Three fixes in order of cost: reorder so the organometallic step comes before the acidic group is installed, use an extra equivalent, or protect. Quenching with D2O instead of water puts a deuterium exactly where the metal was.' },
    { id:'grignard-scope', title:'What a Grignard gives you', family:'Organometallics',
      topics:['grignard-reagents','organolithium-reagents','nucleophilic-addition','acyl-substitution','epoxides'],
      dependsOn:['polarity-reversal'],
      hint:'Name the electrophile first; the alcohol class follows from it, and only esters take two equivalents.',
      teach:'Formaldehyde gives a primary alcohol, any other aldehyde a secondary, a ketone a tertiary. CO2 gives a carboxylic acid, ethylene oxide opens to give an alcohol two carbons along, and a substituted epoxide adds more, still opening at the less hindered carbon, and a nitrile gives a ketone after hydrolysis. The one-carbon extensions are worth knowing as a set, because each ends somewhere different. An ester adds TWICE: the tetrahedral intermediate expels alkoxide to give a ketone that is more electrophilic than the ester was, so a second equivalent attacks at once and the product is a tertiary alcohol with two identical R groups.' },
    { id:'hard-soft-addition', title:'1,2 against 1,4', family:'Organometallics',
      topics:['gilman-reagents','grignard-reagents','nucleophilic-addition','conjugated-systems','aldol'],
      dependsOn:['grignard-scope'],
      hint:'An enone has two electrophilic carbons. The metal on the nucleophile decides which one it picks.',
      teach:'A hard, charge-dense nucleophile such as RMgX or RLi adds 1,2, at the carbonyl carbon, giving an allylic alcohol. A soft, polarizable one such as a Gilman reagent R2CuLi adds 1,4, at the beta carbon, giving an enolate that protonates on workup to a ketone with the new group at beta. Same substrate, same R group, two different products, chosen by the metal. The cuprate is less reactive because copper is much closer to carbon in electronegativity than lithium is, and that lower reactivity is the property being used rather than a limitation: it also lets a cuprate couple with vinyl and aryl halides and stop at the ketone with an acyl chloride.' },
    { id:'catalytic-cycle', title:'The cross-coupling cycle', family:'Organometallics',
      topics:['cross-coupling','gilman-reagents','eas','carbon-carbon-bonds','multistep-synthesis'],
      dependsOn:['hard-soft-addition'],
      hint:'Track the palladium oxidation state and the three step names tell you what they are.',
      teach:'Oxidative addition: Pd(0) inserts into the Ar-X bond and becomes Pd(II), holding both pieces. Transmetalation: the R group moves from its own metal onto the palladium. Reductive elimination: the two organic groups join, leave as Ar-R, and hand back Pd(0) — which is why a few mole percent turns over thousands of times. The named reactions differ only in the partner: boronic acid plus base is Suzuki, stannane is Stille, organozinc is Negishi, terminal alkyne with copper is Sonogashira. Heck is the exception with no organometallic at all: the alkene inserts and a beta-hydride elimination releases the product. The metal activates the aryl halide by bonding to it, which is how a substrate inert to both SN1 and SN2 becomes usable.' },
    /* ---- Carbonyl & enolate breadth -------------------------------------
       Five named reactions, and the thing that makes them learnable rather
       than memorizable is that each leaves a distinctive SPACING in the
       product. Four of these concepts are about reading a product backwards;
       the fifth, migratory aptitude, is the one genuinely new idea. */
    { id:'alkene-by-construction', title:'Building a C=C instead of eliminating to one', family:'Carbonyl breadth',
      topics:['wittig-reaction','alkene-structure','sn2','nucleophilic-addition','retrosynthesis'],
      hint:'Ask where the double bond ends up. An elimination lets Zaitsev choose; a Wittig puts it where the carbonyl was.',
      teach:'Every earlier route to an alkene is an elimination, so the C=C forms between two carbons already joined and Zaitsev decides which. A Wittig joins two separate pieces and the double bond lands exactly at the old carbonyl carbon, with no rearrangement and no mixture of positions. Make the ylide by SN2 of PPh3 on a methyl or primary halide, then deprotonate next to the P+; that SN2 is the whole limitation on which alkenes are reachable. The driving force is the P=O bond of Ph3P=O, one of the strongest bonds in organic chemistry at around 130-140 kcal/mol. Geometry is the part it does not fully control: an unstabilized ylide gives mainly cis and a stabilized one mainly trans, which is the more reactive reagent giving the less stable product.' },
    { id:'amine-condensation', title:'Imine or enamine, decided by one count', family:'Carbonyl breadth',
      topics:['imines-enamines','amine-structure','amine-reactions','nucleophilic-addition','acetals'],
      hint:'Count the hydrogens left on nitrogen after it adds. One gives an imine, none gives an enamine.',
      teach:'Both start the same way: the amine adds to the carbonyl and the carbinolamine loses water under acid to give a C=N+ cation. A PRIMARY amine still has an N-H to lose, so the product is the imine. A SECONDARY amine has none, so the only proton available is on the alpha carbon, and removing it gives the enamine. A tertiary amine has no N-H at all and gives no stable product. The pH has to be about 4.5: acid is needed to make the OH leave, but too much acid protonates the amine and there is no nucleophile left. Every step is reversible, so the water is removed to pull it across.' },
    { id:'enamine-nucleophile', title:'The enamine as a neutral enolate', family:'Carbonyl breadth',
      topics:['imines-enamines','alpha-hydrogens','aldol','michael-robinson','amine-reactions'],
      dependsOn:['amine-condensation'],
      hint:'Push the nitrogen lone pair into the C=C and look at what the alpha carbon becomes.',
      teach:'The second resonance structure of an enamine is an iminium cation with a negative alpha carbon, so an enamine is nucleophilic carbon reached without a strong base. Against an enolate it is neutral rather than anionic, less reactive, and cleaner for it: it usually alkylates once where an enolate goes twice. The Stork sequence is form the enamine, alkylate or acylate the alpha carbon, hydrolyze back to the ketone. It is also a good Michael donor, because the milder nucleophile does not compete with 1,2-addition the way a full enolate does.' },
    { id:'product-spacing', title:'Reading a condensation from its spacing', family:'Carbonyl breadth',
      topics:['michael-robinson','aldol','claisen','ester-syntheses','retrosynthesis'],
      hint:'Count the carbons between the two oxygen-bearing carbons and the reaction names itself.',
      teach:'An aldol leaves a beta-hydroxy carbonyl. A Claisen leaves a 1,3-dicarbonyl. A Michael leaves a 1,5-DICARBONYL, because conjugate addition joins the donor alpha carbon to the acceptor beta carbon. A Robinson annulation is a Michael followed by an intramolecular aldol condensation. Count the ring rather than assume it: an aldol joins an ALPHA carbon to a CARBONYL carbon and never two carbonyl carbons, so from a 1,5-dicarbonyl the productive closure runs from the alpha-prime carbon past one carbonyl to the far carbonyl carbon, enclosing six atoms. The alternatives are three- and four-membered, which is why they lose. So the product is a cyclohexenone in every case you will meet. Undo one in reverse: put the water back, break the ring at the aldol bond to a 1,5-dicarbonyl, then disconnect beta to a carbonyl. Michael donors are doubly stabilized on purpose - a pKa near 9 to 13 means a catalytic alkoxide deprotonates them fully, and the spread-out charge makes the enolate soft enough to add 1,4 rather than 1,2.' },
    { id:'activating-group', title:'A group installed to be thrown away', family:'Carbonyl breadth',
      topics:['ester-syntheses','claisen','alpha-hydrogens','sn2','carboxylic-acids'],
      dependsOn:['product-spacing'],
      hint:'Ask what the second carbonyl was for. If the answer is only "to make that hydrogen acidic", it is leaving at the end.',
      teach:'An ester alpha hydrogen is pKa 25 and a malonate one is 13, because the carbanion is delocalized onto two oxygens. That twelve-order-of-magnitude difference is what lets sodium ethoxide do the deprotonation. Deprotonate, alkylate by SN2, then hydrolyze and heat: diethyl malonate has two esters and ends as a carboxylic acid, ethyl acetoacetate has one ester and a ketone and ends as a methyl ketone. Decarboxylation works only because the intermediate carries a second carbonyl BETA to the carboxyl, so a six-membered cyclic transition state can close. In the acetoacetic route that second carbonyl is a ketone and the intermediate really is a beta-keto acid; in the malonic route it is the other carboxyl, making a substituted malonic acid. Same mechanism, different name. An alpha or gamma keto acid cannot reach the ring and does not decarboxylate. The real constraint is the SN2, so the halide must be methyl, primary, allylic or benzylic - a tertiary target cannot be reached this way however neat the disconnection looks.' },
    { id:'migratory-aptitude', title:'Which group migrates', family:'Carbonyl breadth',
      topics:['baeyer-villiger','sn1','epoxides','esters-amides','alcohol-reactions'],
      hint:'The migrating carbon carries partial positive charge, so rank the groups the way you rank carbocations.',
      teach:'A peroxyacid adds to the carbonyl carbon to give the Criegee intermediate, which collapses by a 1,2-shift: one group moves with its bonding pair onto the adjacent oxygen as the O-O bond breaks. The result is an oxygen inserted INTO a C-C bond, turning a ketone into an ester. Order is tertiary > cyclohexyl, secondary, benzyl > primary > methyl, which is carbocation stability arriving from another direction - so a methyl ketone gives the acetate ester of the other group, every time. A cyclic ketone expands by one atom to a lactone. The migrating group keeps its configuration, because the bond never fully breaks, which makes this usable on a chiral center. mCPBA epoxidizes alkenes faster, so an alkene in the substrate has to be dealt with first.' },
    /* ---- Aromatic follow-through ----------------------------------------
       Five concepts. The first is a pair of opposites students routinely
       merge; the rest are each one idea applied to a different position on
       or beside the ring. */
    { id:'aromatic-nucleophilic', title:'Two ways to put a nucleophile on a ring', family:'Aromatic breadth',
      topics:['nucleophilic-aromatic','eas','directing-effects','sn2','cross-coupling'],
      hint:'Read the substrate. Withdrawing groups ortho or para means SNAr; a bare ring plus NaNH2 means benzyne.',
      teach:'A plain aryl halide does neither SN1 nor SN2: the backside is behind the ring and an aryl cation is badly unstable. SNAr gets round it with ADDITION FIRST: the nucleophile adds to give a Meisenheimer complex, then the halide leaves. That costs aromaticity, so it needs strong withdrawing groups ORTHO OR PARA to pay for it. A meta group withdraws inductively and does accelerate the reaction measurably, but induction is far too small to make it practical: only ortho and para can reach the charge by resonance, and that is the stabilization the intermediate needs. Two consequences: fluorine is the BEST leaving group here, the reverse of every other substitution, because attack is rate-determining and F makes that carbon most electrophilic; and the nucleophile arrives exactly where the halide was. Benzyne is the mirror image, ELIMINATION FIRST: NaNH2 removes an ortho hydrogen, halide leaves, and a strained in-plane triple bond forms. Attack at either of its two carbons gives TWO products at adjacent positions, which is how benzyne was proved to exist. A substrate with no ortho hydrogen cannot go this way at all.' },
    { id:'benzylic-stabilization', title:'Why the position next to the ring is special', family:'Aromatic breadth',
      topics:['benzylic-reactivity','resonance','sn1','radical-halogenation','alcohol-oxidation'],
      hint:'Put the cation, radical or anion next to the ring and count how many carbons the charge reaches.',
      teach:'A benzylic cation, radical or anion is delocalized over four carbons — the benzylic one plus both ortho and the para. Same argument as allylic stabilization with a ring in place of one alkene; counted like for like, an allyl system carries the charge on two positions and a benzylic one on four. Three consequences: a benzylic halide does BOTH SN1 and SN2 well, which is rare, so benzyl bromide is a standard alkylating agent; NBS with light brominates selectively at the benzylic position, the same reagent and reason as allylic bromination; and hot KMnO4 cuts ANY side chain with a benzylic hydrogen back to a single carbon as -COOH, so propylbenzene and toluene both give benzoic acid. tert-Butylbenzene does not react, because it has no benzylic hydrogen — the exception that shows the mechanism.' },
    { id:'phenol-acidity', title:'An OH on a ring', family:'Aromatic breadth',
      topics:['phenols','acidity-factors','pka','directing-effects','ether-chemistry'],
      dependsOn:['benzylic-stabilization'],
      hint:'Deprotonate it and ask where the charge goes. On a chain it sits on one oxygen; on a ring it spreads.',
      teach:'Phenol is pKa 10 against 16 for ethanol, because the phenoxide delocalizes onto both ortho carbons and the para carbon. Withdrawing groups make it more acidic and only from ortho or para: 4-nitrophenol is 7.2 and picric acid, with three nitro groups, is 0.4 — stronger than most carboxylic acids. Practical consequence: NaOH deprotonates a phenol and NaHCO3 does not, while both deprotonate a carboxylic acid, which is the standard way to separate the two. The same lone pair that stabilizes the anion also donates when it is not deprotonated, so OH is a strong activator and ortho/para director — phenol plus bromine water gives the 2,4,6-tribromide with no catalyst. And nothing substitutes at that C-O bond, because the carbon is sp2 in the ring.' },
    { id:'partial-reduction', title:'Reducing a ring partway', family:'Aromatic breadth',
      topics:['birch-reduction','aromaticity','hydrogenation','conjugated-systems','alkynes'],
      hint:'Ask where the carbanion is most stable. That carbon gets protonated and comes out sp3.',
      teach:'Catalytic hydrogenation either leaves a ring alone or takes it all the way to cyclohexane. Na or Li in liquid ammonia with an alcohol stops halfway, by alternating electron and proton additions: electron, proton, electron, proton. The product is the UNCONJUGATED 1,4-cyclohexadiene rather than the more stable 1,3-isomer, because the reaction is under kinetic control. Substituents decide the positions, and both rules come from one question. A WITHDRAWING group stabilizes negative charge on its own carbon, so the carbanion sits there, gets protonated, and that carbon ends up sp3. A DONATING group destabilizes charge there, so the charge goes elsewhere and that carbon stays on a double bond. Birching an anisole and hydrolyzing the resulting enol ether is a standard route to a cyclohexenone.' },
    { id:'diazonium-hub', title:'The group that leaves as nitrogen gas', family:'Aromatic breadth',
      topics:['diazonium-chemistry','amine-reactions','eas','directing-effects','multistep-synthesis'],
      dependsOn:['aromatic-nucleophilic'],
      hint:'When a target needs OH, CN, F or I on a ring, or needs a group removed, start from the nitro compound.',
      teach:'Nitrate, reduce the nitro group to an amine, then diazotize with NaNO2/HCl at 0-5 degrees — warmer and the salt decomposes. Ar-N2+ is the best leaving group available on a ring because it departs as N2, a gas that never comes back, which is enough to make even an aryl position substitutable. CuCl, CuBr and CuCN are the Sandmeyer reactions; KI gives the iodide, HBF4 then heat gives the fluoride, warm water gives the phenol. Four of those — CN, OH, F, I — cannot be installed by electrophilic substitution at all. H3PO2 replaces it with H, which DELETES the substituent: install an amine so it directs, let it direct, then remove it, which is a protecting group in aromatic clothes and the way to reach substitution patterns directing effects otherwise forbid. A diazonium is also a weak electrophile, so an activated ring couples with it to give a colored azo compound.' },
    /* ---- Polymers -------------------------------------------------------
       Five concepts, and not one new reaction among them. What is new is the
       habit of reading a STRUCTURE and predicting a MATERIAL, which is a
       different skill from predicting a product. */
    { id:'two-reactive-sites', title:'Counting reactive sites', family:'Polymers',
      topics:['polymer-basics','addition-reactions','acyl-substitution','polymer-design','esters-amides'],
      hint:'Count the reactive groups on one monomer. One stops, two gives a chain, three or more gives a network.',
      teach:'A polymer is the reactions you already know run repeatedly on a monomer with TWO reactive ends. One site gives a small molecule and stops; two gives a chain; three or more gives a cross-linked network, which is what a thermoset is. Count the sites one functional group at a time for a step-growth monomer, and one C=C at a time for a chain-growth one. The other count that matters is atoms: compare the repeat unit with the monomer, and if the repeat unit is lighter something was condensed out and it was STEP-GROWTH, while if the formulas match nothing was lost, which for an alkene monomer means ADDITION. Ring-opening is the case that escapes the shortcut: caprolactam becomes nylon 6 with no change of formula, and that chain is a polyamide. Those two counts answer most questions in the chapter before any mechanism is written.' },
    { id:'chain-growth', title:'How an addition polymer grows', family:'Polymers',
      topics:['addition-polymers','polymer-basics','markovnikov','radical-halogenation','alkene-structure'],
      dependsOn:['two-reactive-sites'],
      hint:'It is a radical chain reaction: initiation, propagation, termination, exactly as in halogenation.',
      teach:'An initiator breaks to give a radical, which adds to an alkene; the new radical adds to the next monomer, thousands of times; two radicals eventually meet and terminate. Termination needs two dilute radicals to find each other, which is why propagation runs so far and chains are long. Regiochemistry is the Markovnikov argument: the growing radical adds to the CH2 end because that leaves the radical on the substituted carbon, so substituents end up on alternating carbons — HEAD-TO-TAIL. Two structural variables then decide the material without changing the chemistry: TACTICITY (radical polymerization gives atactic and a Ziegler-Natta catalyst gives isotactic) and BRANCHING (high-pressure radical growth gives branched LDPE, Ziegler-Natta gives linear HDPE). Same formula, different material.' },
    { id:'step-growth', title:'How a condensation polymer grows', family:'Polymers',
      topics:['condensation-polymers','polymer-basics','esters-amides','acyl-substitution','peptides-proteins'],
      dependsOn:['two-reactive-sites'],
      hint:'Any two pieces can join, so nothing is long until almost everything has reacted.',
      teach:'A diacid plus a diol gives a POLYESTER and a diacid plus a diamine gives a POLYAMIDE, losing water at every join. Nylon 6,6 is hexamethylenediamine and adipic acid: in nylon X,Y the first number counts the carbons in the diamine and the second the carbons in the diacid, which matters the moment the two differ, as in nylon 6,10. A polyamide is a protein backbone made of one repeating unit: same amide, same planarity, same interchain hydrogen bonding, which is why nylon is strong for the reason a beta sheet is. Amides resist hydrolysis far better than esters, so polyester fabric weakens in hot alkali faster than nylon does; the two nevertheless fail under different conditions, since acid, chlorine and sunlight attack nylon and leave PET alone. Kevlar adds aromatic para-substituted monomers, making chains rigid and straight so their hydrogen bonds line up. The kinetics differ from chain growth in a way that matters: degree of polymerization is 1/(1-p), so 90% conversion gives 10 and only 99.9% gives 1,000 — exact stoichiometry and continuous removal of the by-product are not fussiness but the whole reaction.' },
    { id:'packing-and-properties', title:'Reading a structure as a material', family:'Polymers',
      topics:['polymer-properties','addition-polymers','condensation-polymers','lipids','polymer-design'],
      dependsOn:['chain-growth','step-growth'],
      hint:'Ask whether the chains can lie against each other. Everything else follows from that.',
      teach:'A polymer has crystalline regions where chains pack and amorphous regions where they tangle, and most properties track the crystalline fraction: more crystalline means denser, stronger, higher melting and more opaque, because crystalline regions scatter light. Linear and stereoregular chains pack; branched or atactic ones pack far less, and bulky substituents raise Tg and slow crystallization rather than forbidding it outright — ordinary polystyrene is amorphous because radical growth makes it atactic, while syndiotactic polystyrene has the same phenyl group and crystallizes. Interchain hydrogen bonds, as in nylon and Kevlar, hold them together hard. This is the fatty acid argument again — straight chains stack and melt high, kinked ones do not. Two transition temperatures rather than one: Tg, where the amorphous regions unfreeze, which essentially every polymer has, and Tm, where crystalline regions melt, which only semicrystalline ones have. Above Tg the amorphous regions are mobile, but whether the sample is rubbery depends on what else holds it — HDPE, PET and nylon are all far above their Tg at room temperature and stay rigid because their crystallites act as physical cross-links. Cool rubber below its Tg and it shatters like glass.' },
    { id:'crosslink-and-end-of-life', title:'Cross-links, and what happens afterwards', family:'Polymers',
      topics:['polymer-design','polymer-properties','condensation-polymers','acyl-substitution','esters-amides'],
      dependsOn:['packing-and-properties'],
      hint:'Ask whether the backbone has a bond that hydrolysis can find. That decides everything about the end of its life.',
      teach:'A THERMOPLASTIC is separate chains held by intermolecular forces, so heat lets them slide and it can be remolded. A THERMOSET is one covalent network, so heat destroys it — and the difference traces back to whether the monomer had two reactive sites or three. Cross-linking is a dial: none and rubber flows, a few percent and it is elastic, heavy cross-linking and it is brittle. Elasticity is an ENTROPY effect, because stretching straightens coiled chains into a state with far fewer conformations and releasing lets entropy coil them back. At end of life the backbone decides: PET and nylon can be depolymerized chemically because an ester or amide is a bond hydrolysis can select, while polyethylene cannot be hydrolyzed at all, because a saturated C-C backbone offers nothing for water or an enzyme to select; thermal cracking returns feedstock rather than monomer. The properties that make a polyolefin cheap, inert and durable are the same ones that make it permanent.' },
    { id:'amine-synthesis-routes', title:'Making an amine without over-alkylating', family:'Amines',
      topics:['amine-synthesis','amine-reactions','sn2','nitriles','imines-enamines'], dependsOn:['nucleophile-recognition','amine-basicity'],
      hint:'Direct alkylation cannot be stopped, so every good route is a way around that one failure.',
      teach:'Alkylating ammonia with an alkyl halide gives a mixture of 1, 2, 3 amine and quaternary salt, because each product is a BETTER nucleophile than what made it — the added alkyl group donates to nitrogen — so composition is set by relative rates rather than by how much halide is used, and adding less halide does not help — though a large excess of AMMONIA does bias the mixture toward the primary amine, which is how simple ones are made industrially. The run is also not monotonic: a tertiary amine is a poorer nucleophile than the secondary amine that made it, because three alkyl groups crowd the SN2 transition state. The one time it is welcome is when a quaternary ammonium salt is the target. The escapes: GABRIEL alkylates phthalimide, whose N-H is acidic (pKa near 9) between two carbonyls, and whose alkylated product is an imide with no N-H and a delocalized lone pair, so it cannot go twice; hydrolysis or hydrazine then releases a PRIMARY amine. AZIDE is the same escape in fewer steps, since N3- is an excellent nucleophile whose product is not an amine; reduce with LiAlH4 or H2/Pd. Both are still SN2, so both need a primary unhindered halide and both give only primary amines. CYANIDE then LiAlH4 gives a primary amine with ONE MORE CARBON. REDUCTIVE AMINATION makes the C-N bond by reducing a C=N rather than by displacement, so 1, 2 or 3 amines are all reachable and the halide SN2 limits do not apply; its own limits are that the nitrogen lands on the old carbonyl carbon, putting tert-butylamine and aryl amines out of reach, and that making a PRIMARY amine from ammonia still over-alkylates because the product competes with ammonia for the next carbonyl; NaBH3CN or NaBH(OAc)3 are used because they survive the mildly acidic pH (4-5) imine formation wants and reduce the protonated imine far faster than the carbonyl, where NaBH4 would just give the alcohol. AMIDE REDUCTION gives a 1, 2 or 3 amine with NO carbon lost — a primary amide gives a primary amine — and is the cleanest route to a secondary or tertiary one, since acylation is self-limiting: an amide nitrogen is not nucleophilic, so one acylation gives one product. HOFMANN and CURTIUS rearrangements go the other way and lose one: butanamide gives propylamine, the carbonyl carbon leaving as CO2 by way of an isocyanate. Choose by asking first whether the carbon count must change, then how substituted the target nitrogen is.' },
    { id:'hofmann-elimination-rule', title:'Eliminating from an amine', family:'Amines',
      topics:['hofmann-elimination','amine-synthesis','e2','substrate-effects','kinetic-thermodynamic'], dependsOn:['amine-synthesis-routes','anti-periplanar-geometry'],
      hint:'Quaternize the nitrogen so something neutral can leave, and the bulky leaving group picks the alkene.',
      teach:'An amine cannot do E2 as it stands, because what would have to leave is an amide anion R2N-, one of the strongest bases in the course and so one of the worst leaving groups. EXHAUSTIVE METHYLATION with excess CH3I makes a QUATERNARY AMMONIUM salt, and what leaves then is a NEUTRAL trialkylamine: the nitrogen was cationic before and uncharged after, so no negative charge is carried away. Ag2O in water with heat supplies hydroxide and precipitates AgI, removing the competing nucleophile, and the elimination is an ordinary anti-periplanar E2. The product is the LEAST substituted alkene, the opposite of Zaitsev, because the N(CH3)3 group is enormous and hydroxide takes the accessible beta hydrogen rather than the crowded one — the same steric argument the E2 chapter makes for tert-butoxide. A second effect agrees: the cationic nitrogen acidifies the beta hydrogens so the C-H breaks ahead of the C-N, giving E1cb character with partial negative charge on the beta carbon, and alkyl groups destabilize a carbanion. 2-Aminobutane takes three equivalents of CH3I and gives BUT-1-ENE, four carbons, not but-2-ene. Counting equivalents consumed reads the amine class directly — three for primary, two for secondary, one for tertiary — and a CYCLIC amine needs two full rounds to free its nitrogen, because two C-N bonds hold it; that was structure determination before spectroscopy. The lasting point is that Zaitsev breaks a third way here: not by geometry and not by a bulky base, but by bulk on the LEAVING GROUP, which is part of the substrate rather than something you choose.' },

    { id:'skeletal-notation', title:'Reading skeletal structures', family:'Structure & bonding',
      topics:['skeletal-structures','lewis-structures','alkene-structure','cyclohexanes','aromaticity'],
      hint:'Every vertex AND every end of a line is a carbon — the ends are the ones people miss.',
      teach:'A line is a bond and every corner or line-end is a carbon, with no C written. A zigzag of five segments is a SIX-carbon chain, because both ends count. Every atom that is not carbon is drawn, and so are the hydrogens on it — an O–H is written out because that hydrogen does chemistry.' },
    { id:'implicit-hydrogens', title:'Implied hydrogens', family:'Structure & bonding',
      topics:['skeletal-structures','lewis-structures','formal-charge','h-nmr'], dependsOn:['skeletal-notation'],
      hint:'Count the lines meeting the atom, then subtract from four.',
      teach:'Hydrogens on carbon are not drawn; you subtract. Count the bonds you can see at a vertex and take that from four — two lines meeting means CH2, one line at a chain end means CH3. The classic slip is counting a vertex as a carbon and then ALSO writing its hydrogens in when you redraw, giving carbon five bonds.' },
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

    { id:'addition-equilibrium', title:'How far a carbonyl addition goes', family:'Carbonyl chemistry',
      topics:['hydrates-cyanohydrins','aldehydes-ketones','nucleophilic-addition','acetals'], dependsOn:['carbonyl-electrophilicity','tetrahedral-intermediate'],
      hint:'Two causes, and for ordinary substituents they agree: crowding of the sp3 product, and donation into the C=O.',
      teach:'Water, cyanide and bisulfite all add reversibly to a carbonyl, and how far each goes is a number rather than an adjective. Hydration runs acetone 0.1%, acetaldehyde about 50%, formaldehyde about 99.9%, chloral essentially 100% — three orders of magnitude in percent hydrate from two causes. STERICS: addition squeezes substituents from 120 to 109 degrees, which two methyls resist and two hydrogens do not. ELECTRONICS: alkyl groups donate into the C=O and stabilize the starting material, while withdrawing groups do the opposite. Together they are why ALDEHYDE > KETONE toward every nucleophile in the chapter. They can disagree: hexafluoroacetone is crowded and fully hydrated because electronics wins, and cyclopropanone is fully hydrated because addition RELIEVES ring strain, which runs the steric argument backwards. Cyanide is the one of the three that makes a C-C bond, so a cyanohydrin is a one-carbon extension whose nitrile becomes an alpha-hydroxy acid, a beta-amino alcohol, or an alpha,beta-unsaturated nitrile. Conjugation is a third cause once a ring is attached: benzaldehyde hydrates far less than acetaldehyde, because addition destroys the conjugation.' },
    { id:'aldehyde-oxidizability', title:'Which carbonyls oxidize, and why', family:'Carbonyl chemistry',
      topics:['aldehyde-oxidation','hydrates-cyanohydrins','oxidation-states','carbohydrates'], dependsOn:['addition-equilibrium','carbonyl-electrophilicity'],
      hint:'An oxidant needs a C-H and an O-H on the same carbon. A C=O has neither, but its hydrate has both.',
      teach:'Oxidation trades a C-H for a bond to oxygen, so an aldehyde goes on to the acid and a ketone does not, because a ketone would have to break a C-C bond. The oxidant never attacks the C=O itself: it attacks the HYDRATE, which has an O-H and a C-H on one carbon and is oxidized exactly as a primary alcohol is. That is the whole Jones-against-PCC difference — aqueous Cr(VI) keeps regenerating the hydrate and runs to the acid, anhydrous PCC cannot and stops at the aldehyde. TOLLENS (Ag(NH3)2+, basic) gives a silver mirror and the carboxylate, and is useful precisely because it is too weak to touch alcohols or alkenes. FEHLINGS (Cu(II) tartrate) and BENEDICTS (Cu(II) citrate) drop brick-red Cu2O; Fehlings is unreliable with aromatic aldehydes, which is why Benedicts is the clinical one. A REDUCING SUGAR tests positive because its hemiacetal ring opens and supplies the carbonyl continuously; sucrose does not, because its glycosidic bond locks both anomeric carbons. Ketoses count too: the basic conditions of these tests isomerize fructose to glucose through an enediol, so a free anomeric carbon rather than an aldehyde is what actually decides. The same reactivity is a hazard: aldehydes autoxidize in air, so old benzaldehyde carries benzoic acid.' },

    { id:'activation-before-acylation', title:'Climbing the acyl ladder', family:'Carbonyl chemistry',
      topics:['acyl-chlorides-anhydrides','acyl-substitution','esters-amides','carboxylic-acids','alcohol-reactions'], dependsOn:['acyl-reactivity-order','leaving-group-ability'],
      hint:'You can go down the ladder freely and never up, so almost every route from an acid opens by replacing the OH.',
      teach:'A carboxylic acid is a poor acylating agent for a reason unrelated to its carbonyl: at pKa 4-5 it hands its proton to any good nucleophile, and an ammonium carboxylate has a protonated nucleophile and a negatively charged electrophile. So step one is to replace the OH entirely. SOCl2 and oxalyl chloride (with catalytic DMF) are preferred because their by-products are gases — SO2 and HCl, or CO, CO2 and HCl — which leave the flask, drive the equilibrium and reduce the workup to an evaporation; PCl3 and PCl5 work but leave H3PO3 or POCl3 behind. SOCl2 is doing exactly the job it did on an alcohol in an earlier chapter: converting a terrible leaving group into an excellent one. The acid chloride then gives the acid with water, an ester with an alcohol IRREVERSIBLY (unlike Fischer), an amide with TWO equivalents of amine (the first acylates, the second takes the HCl; pyridine substitutes for the second, basic enough to mop up HCl and too weakly nucleophilic to compete, its lone pair being in an sp2 orbital in the ring plane rather than hindered), an anhydride with a CARBOXYLATE rather than the neutral acid, and an aryl ketone with AlCl3 and an arene. An anhydride sits between: its carboxylate leaving group is resonance-stabilized and leaves willingly, but not as willingly as chloride, whose conjugate acid is far stronger. The cost of using one is that half the molecule is spent as the leaving group. Cyclic anhydrides escape that, and with an amine give an amic acid that closes to an imide on heating.' },
    { id:'nitrile-as-acyl-level', title:'Nitriles, and the one-carbon extension', family:'Carbonyl chemistry',
      topics:['nitriles','acyl-substitution','sn2','oxidation-states','grignard-reagents'], dependsOn:['acyl-reactivity-order','oxidation-level'],
      hint:'Three bonds to nitrogen is the same count as three bonds to oxygen, so a nitrile is on the acid rung.',
      teach:'A nitrile has no carbonyl and no leaving group, and belongs to this chapter anyway: its carbon carries three bonds to nitrogen, the same count a carboxylic acid carbon carries to oxygen, so both sit on the +3 rung with the ester, amide and acid chloride. Moving along the rung is substitution and needs no oxidant; getting off it needs a reducing agent. Nitriles come from SN2 of cyanide on a PRIMARY halide (secondary is sluggish and eliminates, tertiary gives only alkene), from dehydrating a primary amide, from a cyanohydrin, and on a ring from a diazonium salt with CuCN. What they do: aqueous acid or base with heat gives the CARBOXYLIC ACID through the amide, which milder conditions can catch; LiAlH4 gives the PRIMARY AMINE with the nitrile carbon becoming the CH2, so no carbon is gained or lost; DIBAL-H at one equivalent and -78 C gives the ALDEHYDE, because the metalated imine anion it makes is not an electrophile and simply waits for water — the reagent is crippled, not rationed; a Grignard or organolithium gives a KETONE for the same structural reason, adding once and unable to add twice, which is the whole contrast with an ester that expels alkoxide and releases a hungrier ketone mid-reaction. RX to RCN to RCOOH is the standard one-carbon chain extension, and it complements rather than duplicates the Grignard-plus-CO2 route: cyanide needs a primary unhindered substrate but tolerates O-H and N-H, a Grignard tolerates hindrance but is destroyed by them. IR: a sharp medium C-N stretch near 2250 in an otherwise empty window.' },

    /* ---- Enolate chemistry --------------------------------------------- */
    { id:'alpha-acidity', title:'Alpha hydrogen acidity', family:'Enolate chemistry',
      topics:['alpha-hydrogens','aldol','claisen','acidity-factors'], dependsOn:['resonance-delocalization','acidity-factors'],
      hint:'Only hydrogens on the carbon next to a carbonyl are acidic.',
      teach:'An alpha hydrogen (pKa ≈ 20) is acidic because the resulting carbanion is resonance-stabilized onto the carbonyl oxygen — the enolate. Hydrogens two carbons away are not acidic at all. Between two carbonyls the pKa drops to about 9.' },
    { id:'alpha-halogenation-control', title:'Halogenating the alpha carbon', family:'Enolate chemistry',
      topics:['alpha-halogenation','alpha-hydrogens','acyl-substitution','carboxylic-acids','amino-acids'], dependsOn:['alpha-acidity','enolate-formation'],
      hint:'Acid stops after one halogen and base does not stop at all, and it is the same substituent effect both times.',
      teach:'An enol or enolate is nucleophilic at the alpha carbon and a halogen molecule is a fine electrophile, so both acid and base put a halogen there — with opposite outcomes. ACID goes through the ENOL, whose formation is the slow step and begins by protonating the carbonyl; the halogen just installed withdraws electron density, so the carbonyl is a weaker base, the second enol forms more slowly, and MONOHALOGENATION IS CONTROLLABLE. BASE goes through the ENOLATE; the same withdrawal makes the remaining alpha hydrogens MORE acidic, so each deprotonation is faster than the last and the reaction keeps going for as long as the halogenated alpha carbon still has a hydrogen — isopropyl phenyl ketone, with one alpha hydrogen, stops after one however much halogen is used. One effect, two consequences, because one route needs the substrate basic and the other needs it acidic. The runaway is useful on a METHYL ketone: excess halogen and hydroxide give CX3, which is a workable leaving group because three halogens stabilize the departing carbanion, so hydroxide adds and expels it — the HALOFORM reaction, giving the carboxylate and CHX3. With iodine the CHI3 is a yellow precipitate, making the IODOFORM TEST, positive for a methyl ketone, for acetaldehyde, and for any alcohol the hypoiodite oxidizes to one first (ethanol, and any CH3-CH(OH)-R). It reports a CH3CO or CH3CH(OH) fragment, not a methyl anywhere in the molecule, and as a synthesis it COSTS A CARBON. A carboxylic acid has essentially no enol, so HELL-VOLHARD-ZELINSKY uses Br2 with catalytic PBr3 to make the acyl bromide, which does enolize; the product alpha-bromo acid is an SN2 substrate, and excess ammonia on it is the classical racemic route to an alpha-amino acid, alongside Strecker and the Gabriel-malonic ester sequence.' },
    { id:'enolate-regiocontrol', title:'Which alpha carbon', family:'Enolate chemistry',
      topics:['enolate-regiochemistry','alpha-hydrogens','aldol','kinetic-thermodynamic','imines-enamines'], dependsOn:['enolate-formation','alpha-acidity'],
      hint:'Ask whether the deprotonation can reverse. Temperature on its own decides nothing.',
      teach:'An unsymmetrical ketone has two different alpha carbons, so "form the enolate" is a question. In 2-methylcyclohexanone, C6 is an unsubstituted CH2 whose protons are more numerous and less crowded, while C2 carries the methyl and gives the more substituted, more stable C=C — so the easier proton and the more stable anion are on OPPOSITE sides. The KINETIC enolate comes from LDA, one equivalent, -78 C in THF, with the KETONE ADDED TO THE BASE: strong enough (conjugate acid pKa ~36 against a ketone 20) that deprotonation does not reverse, bulky enough to prefer the open proton, cold enough not to equilibrate, and inverse addition so no free ketone is ever left to shuttle protons between enolates. The THERMODYNAMIC enolate comes from a base too weak to finish the job — NaOEt, NaH — at room temperature or above, where every deprotonation reverses and the population collects in the more substituted enolate. REVERSIBILITY IS WHAT MATTERS, NOT TEMPERATURE: LDA at room temperature is still kinetic, and LDA followed by warming with leftover ketone is not. This is the same kinetic-against-thermodynamic switch the diene chapter used for 1,2 against 1,4 addition, moved one step earlier — there the two options were products, here they are intermediates chosen to steer the next reaction. The third option is not an enolate at all: an ENAMINE from a secondary amine forms toward the less substituted side, is neutral rather than anionic, and stops after ONE alkylation where a lithium enolate can go twice. Alkylation is an SN2 by a nucleophile that is also a strong base, so methyl and primary halides work, secondary ones eliminate substantially and tertiary ones only eliminate — the same limit that caps the malonic ester synthesis. Check it on the halide, never on the target.' },

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
    'hydrates-cyanohydrins':'addition-equilibrium', 'aldehyde-oxidation':'aldehyde-oxidizability',
    'carboxylic-acids':'acidity-factors', 'esters-amides':'acyl-reactivity-order',
    'acyl-substitution':'acyl-reactivity-order',
    'acyl-chlorides-anhydrides':'activation-before-acylation', 'nitriles':'nitrile-as-acyl-level',
    'alpha-halogenation':'alpha-halogenation-control', 'enolate-regiochemistry':'enolate-regiocontrol',
    'alpha-hydrogens':'alpha-acidity', 'aldol':'aldol-connectivity', 'claisen':'claisen-connectivity',
    'amine-structure':'amine-basicity', 'amine-reactions':'nucleophile-recognition',
    'amine-synthesis':'amine-synthesis-routes', 'hofmann-elimination':'hofmann-elimination-rule',
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
