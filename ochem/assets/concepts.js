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
               mid-session, by someone who just got something wrong. NOT in
               this file: the strings live in concept-teach.json, keyed by
               concept id, and are attached by attachTeach() below once the
               page that needs them (practice.html, review.html, via
               session-runner.js) has fetched the file. Every ochem page
               loads this script for the concept graph, and only two ever
               show a teach block, so shipping the prose to all of them was
               half this file's weight for nothing. scripts/check-site.mjs
               fails if the JSON and the ids here drift apart.
     hint      one short nudge, shown before the answer is revealed.
     topics    curriculum topic ids this concept shows up in. Used to tag
               the legacy per-topic question bank and to pick which lesson
               to link to for remediation.
     dependsOn concept ids that must be understood first. The recommender
               walks this: if you're failing anti-periplanar geometry and
               you're also shaky on chair conformations, it sends you to
               the prerequisite rather than drilling the symptom.

   Keep `topics` accurate — it's how ~1900 legacy questions get concept
   tags for free. Keep `teach` (in concept-teach.json) short — it's
   remediation, not a lesson. */
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
      hint:'Count the radicals before and after the step: up from zero, unchanged, or down to zero.' },
    { id:'radical-stability', title:'Radical stability and selectivity', family:'Electron flow',
      topics:['radical-halogenation','markovnikov','mass-spec'], dependsOn:['radical-chain'],
      hint:'Radicals rank like carbocations: 3° > 2° > 1° > methyl. Then ask how selective the attacking radical is.' },
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
      hint:'Longest CONTINUOUS path, turning corners if it has to — and it must contain the principal characteristic group.' },
    { id:'locant-rules', title:'Numbering and locants', family:'Nomenclature',
      topics:['naming-parent-chain','naming-substituents','naming-functional-groups','naming-rings-unsaturation'],
      dependsOn:['parent-chain'],
      hint:'Compare the two locant sets term by term and stop at the first place they differ.' },
    { id:'group-priority', title:'Functional group priority', family:'Nomenclature',
      topics:['naming-functional-groups','naming-rings-unsaturation','carboxylic-acids','esters-amides','aldehydes-ketones'],
      hint:'One group takes the suffix; every other becomes a prefix. Ethers and halides can never be the suffix.' },
    { id:'alphabetization', title:'Citation order in a name', family:'Nomenclature',
      topics:['naming-substituents','naming-rings-unsaturation'], dependsOn:['locant-rules'],
      hint:'The typography tells you: a hyphenated italic prefix is skipped, one joined to the word is counted.' },
    /* ---- Conjugation ---------------------------------------------------
       Split four ways because these fail independently: recognizing that a
       system IS conjugated, predicting where a delocalized intermediate gets
       captured, deciding which of two products conditions select, and the
       geometric/stereochemical requirements of the cycloaddition. */
    { id:'conjugation-recognition', title:'Recognizing conjugation', family:'Conjugation',
      topics:['conjugated-systems','uv-vis','diels-alder','aromaticity','resonance'],
      dependsOn:['resonance-delocalization'],
      hint:'Alternating single and double bonds, with every atom in the run sp2 so the p orbitals line up.' },
    { id:'allylic-capture', title:'Capturing a delocalized intermediate', family:'Conjugation',
      topics:['diene-addition','kinetic-thermodynamic','markovnikov','radical-halogenation'],
      dependsOn:['conjugation-recognition'],
      hint:'Draw both resonance forms of the intermediate — the nucleophile can arrive at either end.' },
    { id:'kinetic-vs-thermodynamic', title:'Kinetic vs thermodynamic control', family:'Conjugation',
      topics:['kinetic-thermodynamic','diene-addition','alpha-hydrogens','aldol','e2','eas'],
      dependsOn:['allylic-capture'],
      hint:'Ask first whether the reaction can reverse. That decides which comparison matters.' },
    { id:'cycloaddition-geometry', title:'Cycloaddition requirements', family:'Conjugation',
      topics:['diels-alder','conjugated-systems','diastereomers'],
      dependsOn:['conjugation-recognition'],
      hint:'s-cis or nothing — and because it is concerted, the starting geometry survives into the product.' },
    /* ---- Oxidation & reduction -----------------------------------------
       Four concepts. Counting the oxidation level is a separate skill from
       knowing the reagents; and among the reagents, "where does it stop" and
       "what else does it touch" fail independently, so they are separate too.
       Stereochemical control (syn vs anti, cis vs trans) is its own thing
       again, and is what synthesis questions usually hinge on. */
    { id:'oxidation-level', title:'Counting oxidation level', family:'Oxidation & reduction',
      topics:['oxidation-states','alcohol-oxidation','carbonyl-reduction','alkene-oxidation','esters-amides'],
      dependsOn:['electronegativity-trend'],
      hint:'More bonds to O (or N, halogen) is up; more bonds to H is down; C-C counts zero.' },
    { id:'oxidant-choice', title:'Where an oxidation stops', family:'Oxidation & reduction',
      topics:['alcohol-oxidation','oxidation-states','alkene-oxidation'], dependsOn:['oxidation-level'],
      hint:'For a chromium reagent, ask whether there is water in the flask.' },
    { id:'reductant-scope', title:'What a reducing agent will touch', family:'Oxidation & reduction',
      topics:['carbonyl-reduction','nucleophilic-addition','hydrogenation','esters-amides','amine-reactions'], dependsOn:['oxidation-level'],
      hint:'Choosing the WEAKER reagent on purpose is usually how selectivity is achieved.' },
    { id:'redox-stereochemistry', title:'Stereochemical control in redox', family:'Oxidation & reduction',
      topics:['hydrogenation','alkene-oxidation','diastereomers','epoxides','alkynes'],
      dependsOn:['reductant-scope','stereochemical-outcome'],
      hint:'Ask whether both new bonds arrive on the same face.' },
    /* ---- Synthesis ------------------------------------------------------
       Four concepts, split by what actually goes wrong. Choosing a
       disconnection, knowing the short list of C-C reactions, navigating the
       functional group map, and getting the ORDER right are separate
       failures — a student can have all the reactions and still write a route
       that destroys its own reagent in step two. */
    { id:'disconnection', title:'Choosing a disconnection', family:'Synthesis',
      topics:['retrosynthesis','carbon-carbon-bonds','multistep-synthesis','diels-alder','aldol'],
      hint:'A disconnection is only legitimate if you can name the forward reaction that makes that bond.' },
    { id:'cc-bond-toolkit', title:'Ways to make a C–C bond', family:'Synthesis',
      topics:['carbon-carbon-bonds','retrosynthesis','multistep-synthesis','alkynes','aldol','claisen','eas'],
      dependsOn:['disconnection'],
      hint:'Count the carbons first. The difference tells you how many C-C bonds you must form.' },
    { id:'fgi-map', title:'Functional group interconversion', family:'Synthesis',
      topics:['functional-group-interconversion','multistep-synthesis','oxidation-states','alcohol-reactions'],
      dependsOn:['oxidation-level'],
      hint:'Ask whether the move is UP or DOWN the oxidation ladder, or SIDEWAYS within one level.' },
    { id:'route-order', title:'Ordering a synthesis', family:'Synthesis',
      topics:['multistep-synthesis','protecting-groups','directing-effects','eas','amine-reactions'],
      dependsOn:['cc-bond-toolkit','fgi-map'],
      hint:'For every step ask what ELSE the reagent could attack, and whether the product survives the next step.' },
    /* ---- Biomolecules ---------------------------------------------------
       Five concepts, one per section, because the failures really are
       separate: a student who has the sugar ring cold can still think the
       peptide nitrogen is basic. Each one is a reaction already taught,
       named again in its biological setting, so the dependsOn edges point
       back at the general reaction rather than sideways. */
    { id:'sugar-ring', title:'Sugars as cyclic hemiacetals', family:'Biomolecules',
      topics:['carbohydrates','nucleic-acids','acetals','nucleophilic-addition','fischer'],
      hint:'The ring is not a new reaction — it is the molecule\'s own OH adding to its own carbonyl.' },
    { id:'zwitterion', title:'Amino acids as internal salts', family:'Biomolecules',
      topics:['amino-acids','peptides-proteins','pka','bronsted','acidity-factors'],
      dependsOn:['acidity-factors'],
      hint:'Draw the charges before anything else: at pH 7 neither end of an amino acid is neutral.' },
    { id:'peptide-bond', title:'The peptide bond is an amide', family:'Biomolecules',
      topics:['peptides-proteins','amino-acids','esters-amides','acyl-substitution','resonance'],
      dependsOn:['resonance-delocalization'],
      hint:'Everything odd about the peptide bond is one resonance structure doing its job.' },
    { id:'lipid-ester', title:'Fats are esters, and shape sets melting point', family:'Biomolecules',
      topics:['lipids','esters-amides','acyl-substitution','hydrogenation','alkene-structure'],
      hint:'Lipid is a solubility class, not a functional group — ask what the ester is doing.' },
    { id:'nucleotide-assembly', title:'How a nucleotide is put together', family:'Biomolecules',
      topics:['nucleic-acids','carbohydrates','acetals','amine-structure'],
      dependsOn:['sugar-ring'],
      hint:'Build it in order: sugar, then base, then phosphate. Two of the three links you already know.' },
    /* ---- Organometallics -----------------------------------------------
       Five concepts on one axis. Every question in this chapter is really
       "how reactive does this reagent need to be", and the failures are
       separate: not seeing why the carbon is nucleophilic at all, forgetting
       what kills the reagent, picking 1,2 when 1,4 was wanted, and treating
       the palladium cycle as four names rather than one mechanism. */
    { id:'polarity-reversal', title:'Why C–metal means nucleophilic carbon', family:'Organometallics',
      topics:['organometallic-bonding','grignard-reagents','electronegativity','bond-polarity','nucleophiles'],
      hint:'Compare the electronegativities and put the electrons on the more electronegative atom. Here that is carbon.' },
    { id:'organometallic-quench', title:'What destroys an organometallic', family:'Organometallics',
      topics:['grignard-reagents','organolithium-reagents','organometallic-bonding','protecting-groups','pka'],
      dependsOn:['polarity-reversal'],
      hint:'Scan the substrate for O-H, N-H, S-H and terminal alkyne C-H before writing any organometallic step.' },
    { id:'grignard-scope', title:'What a Grignard gives you', family:'Organometallics',
      topics:['grignard-reagents','organolithium-reagents','nucleophilic-addition','acyl-substitution','epoxides'],
      dependsOn:['polarity-reversal'],
      hint:'Name the electrophile first; the alcohol class follows from it, and only esters take two equivalents.' },
    { id:'hard-soft-addition', title:'1,2 against 1,4', family:'Organometallics',
      topics:['gilman-reagents','grignard-reagents','nucleophilic-addition','michael-robinson','aldol'],
      dependsOn:['grignard-scope'],
      hint:'An enone has two electrophilic carbons. The metal on the nucleophile decides which one it picks.' },
    { id:'catalytic-cycle', title:'The cross-coupling cycle', family:'Organometallics',
      topics:['cross-coupling','gilman-reagents','eas','carbon-carbon-bonds','multistep-synthesis'],
      dependsOn:['hard-soft-addition'],
      hint:'Track the palladium oxidation state and the three step names tell you what they are.' },
    /* ---- Carbonyl & enolate breadth -------------------------------------
       Five named reactions, and the thing that makes them learnable rather
       than memorizable is that each leaves a distinctive SPACING in the
       product. Four of these concepts are about reading a product backwards;
       the fifth, migratory aptitude, is the one genuinely new idea. */
    { id:'alkene-by-construction', title:'Building a C=C instead of eliminating to one', family:'Carbonyl breadth',
      topics:['wittig-reaction','alkene-structure','sn2','nucleophilic-addition','retrosynthesis'],
      hint:'Ask where the double bond ends up. An elimination lets Zaitsev choose; a Wittig puts it where the carbonyl was.' },
    { id:'amine-condensation', title:'Imine or enamine, decided by one count', family:'Carbonyl breadth',
      topics:['imines-enamines','amine-structure','amine-reactions','nucleophilic-addition','acetals'],
      hint:'Count the hydrogens left on nitrogen after it adds. One gives an imine, none gives an enamine.' },
    { id:'enamine-nucleophile', title:'The enamine as a neutral enolate', family:'Carbonyl breadth',
      topics:['imines-enamines','alpha-hydrogens','aldol','michael-robinson','amine-reactions'],
      dependsOn:['amine-condensation'],
      hint:'Push the nitrogen lone pair into the C=C and look at what the alpha carbon becomes.' },
    { id:'product-spacing', title:'Reading a condensation from its spacing', family:'Carbonyl breadth',
      topics:['michael-robinson','aldol','claisen','ester-syntheses','retrosynthesis'],
      hint:'Count the carbons between the two oxygen-bearing carbons and the reaction names itself.' },
    { id:'activating-group', title:'A group installed to be thrown away', family:'Carbonyl breadth',
      topics:['ester-syntheses','claisen','alpha-hydrogens','sn2','carboxylic-acids'],
      dependsOn:['product-spacing'],
      hint:'Ask what the second carbonyl was for. If the answer is only "to make that hydrogen acidic", it is leaving at the end.' },
    { id:'migratory-aptitude', title:'Which group migrates', family:'Carbonyl breadth',
      topics:['baeyer-villiger','sn1','epoxides','esters-amides','alcohol-reactions'],
      hint:'The migrating carbon carries partial positive charge, so rank the groups the way you rank carbocations.' },
    /* ---- Aromatic follow-through ----------------------------------------
       Five concepts. The first is a pair of opposites students routinely
       merge; the rest are each one idea applied to a different position on
       or beside the ring. */
    { id:'aromatic-nucleophilic', title:'Two ways to put a nucleophile on a ring', family:'Aromatic breadth',
      topics:['nucleophilic-aromatic','eas','directing-effects','sn2','cross-coupling'],
      hint:'Read the substrate. Withdrawing groups ortho or para means SNAr; a bare ring plus NaNH2 means benzyne.' },
    { id:'benzylic-stabilization', title:'Why the position next to the ring is special', family:'Aromatic breadth',
      topics:['benzylic-reactivity','resonance','sn1','radical-halogenation','alcohol-oxidation'],
      hint:'Put the cation, radical or anion next to the ring and count how many carbons the charge reaches.' },
    { id:'phenol-acidity', title:'An OH on a ring', family:'Aromatic breadth',
      topics:['phenols','acidity-factors','pka','directing-effects','ether-chemistry'],
      dependsOn:['benzylic-stabilization'],
      hint:'Deprotonate it and ask where the charge goes. On a chain it sits on one oxygen; on a ring it spreads.' },
    { id:'partial-reduction', title:'Reducing a ring partway', family:'Aromatic breadth',
      topics:['birch-reduction','aromaticity','hydrogenation','conjugated-systems','alkynes'],
      hint:'Ask where the carbanion is most stable. That carbon gets protonated and comes out sp3.' },
    { id:'diazonium-hub', title:'The group that leaves as nitrogen gas', family:'Aromatic breadth',
      topics:['diazonium-chemistry','amine-reactions','eas','directing-effects','multistep-synthesis'],
      dependsOn:['aromatic-nucleophilic'],
      hint:'When a target needs OH, CN, F or I on a ring, or needs a group removed, start from the nitro compound.' },
    /* ---- Polymers -------------------------------------------------------
       Five concepts, and not one new reaction among them. What is new is the
       habit of reading a STRUCTURE and predicting a MATERIAL, which is a
       different skill from predicting a product. */
    { id:'two-reactive-sites', title:'Counting reactive sites', family:'Polymers',
      topics:['polymer-basics','addition-reactions','acyl-substitution','polymer-design','esters-amides'],
      hint:'Count the reactive groups on one monomer. One stops, two gives a chain, three or more gives a network.' },
    { id:'chain-growth', title:'How an addition polymer grows', family:'Polymers',
      topics:['addition-polymers','polymer-basics','markovnikov','radical-halogenation','alkene-structure'],
      dependsOn:['two-reactive-sites'],
      hint:'It is a radical chain reaction: initiation, propagation, termination, exactly as in halogenation.' },
    { id:'step-growth', title:'How a condensation polymer grows', family:'Polymers',
      topics:['condensation-polymers','polymer-basics','esters-amides','acyl-substitution','peptides-proteins'],
      dependsOn:['two-reactive-sites'],
      hint:'Any two pieces can join, so nothing is long until almost everything has reacted.' },
    { id:'packing-and-properties', title:'Reading a structure as a material', family:'Polymers',
      topics:['polymer-properties','addition-polymers','condensation-polymers','lipids','polymer-design'],
      dependsOn:['chain-growth','step-growth'],
      hint:'Ask whether the chains can lie against each other. Everything else follows from that.' },
    { id:'crosslink-and-end-of-life', title:'Cross-links, and what happens afterwards', family:'Polymers',
      topics:['polymer-design','polymer-properties','condensation-polymers','acyl-substitution','esters-amides'],
      dependsOn:['packing-and-properties'],
      hint:'Ask whether the backbone has a bond that hydrolysis can find. That decides everything about the end of its life.' },
    { id:'amine-synthesis-routes', title:'Making an amine without over-alkylating', family:'Amines',
      topics:['amine-synthesis','amine-reactions','sn2','nitriles','imines-enamines'], dependsOn:['nucleophile-recognition','amine-basicity'],
      hint:'Direct alkylation cannot be stopped, so every good route is a way around that one failure.' },
    { id:'hofmann-elimination-rule', title:'Eliminating from an amine', family:'Amines',
      topics:['hofmann-elimination','amine-synthesis','e2','substrate-effects','kinetic-thermodynamic'], dependsOn:['amine-synthesis-routes','anti-periplanar-geometry'],
      hint:'Quaternize the nitrogen so something neutral can leave, and the bulky leaving group picks the alkene.' },

    { id:'skeletal-notation', title:'Reading skeletal structures', family:'Structure & bonding',
      topics:['skeletal-structures','lewis-structures','alkene-structure','cyclohexanes','aromaticity'],
      hint:'Every vertex AND every end of a line is a carbon — the ends are the ones people miss.' },
    { id:'implicit-hydrogens', title:'Implied hydrogens', family:'Structure & bonding',
      topics:['skeletal-structures','lewis-structures','formal-charge','h-nmr'], dependsOn:['skeletal-notation'],
      hint:'Count the lines meeting the atom, then subtract from four.' },
    { id:'valence-electrons', title:'Valence electrons', family:'Structure & bonding',
      topics:['atomic-structure','orbitals','bonding','lewis-structures'],
      hint:'Count the outermost shell, not every electron in the atom.' },
    { id:'sigma-pi-bonding', title:'Sigma and pi bonds', family:'Structure & bonding',
      topics:['bonding','hybridization','alkene-structure'], dependsOn:['valence-electrons'],
      hint:'One sigma per connection; every extra line in a multiple bond is a pi bond, and pi electrons sit above and below the axis.' },
    { id:'formal-charge-calc', title:'Formal charge', family:'Structure & bonding',
      topics:['formal-charge','lewis-structures','resonance','curved-arrows'], dependsOn:['valence-electrons'],
      hint:'Formal charge = valence electrons − (lone-pair electrons + number of bonds).' },
    { id:'lewis-structures-drawing', title:'Building Lewis structures', family:'Structure & bonding',
      topics:['lewis-structures','bonding','molecular-geometry','formal-charge'], dependsOn:['valence-electrons'],
      hint:'Total the valence electrons first, then place them — bonds before lone pairs.' },
    { id:'hybridization-assignment', title:'Assigning hybridization', family:'Structure & bonding',
      topics:['hybridization','orbitals','molecular-geometry','alkene-structure','alkynes','aromaticity','aldehydes-ketones'],
      hint:'Count groups around the atom: bonds to atoms plus lone pairs, counting a double or triple bond once. Exception: a lone pair next to a pi bond moves into a p orbital, so an amide N is sp2, not sp3.' },
    { id:'molecular-geometry-vsepr', title:'Molecular geometry', family:'Structure & bonding',
      topics:['molecular-geometry','hybridization','bond-polarity'], dependsOn:['hybridization-assignment'],
      hint:'Lone pairs take up space and push bond angles closed.' },
    { id:'electronegativity-trend', title:'Electronegativity trends', family:'Structure & bonding',
      topics:['electronegativity','bond-polarity','acidity-factors','nucleophiles','electrophiles','h-nmr'],
      hint:'Electronegativity rises going right across a period and rising up a group: F > O > Cl > N > Br > I > C > H.' },
    { id:'bond-polarity-dipoles', title:'Bond polarity & dipoles', family:'Structure & bonding',
      topics:['bond-polarity','electronegativity','molecular-geometry','ir'], dependsOn:['electronegativity-trend','molecular-geometry-vsepr'],
      hint:'A molecule can hold polar bonds and still have no net dipole if they cancel.' },
    { id:'functional-group-recognition', title:'Recognizing functional groups', family:'Structure & bonding',
      topics:['functional-groups','skeletal-structures','naming-functional-groups','bond-polarity'], dependsOn:['lewis-structures-drawing','bond-polarity-dipoles'],
      hint:'Look for anything that is not C-C or C-H: an O, N, halogen, S, or a double or triple bond. For amines, count carbons on the nitrogen.' },
    { id:'carbonyl-family-distinction', title:'Telling the carbonyl family apart', family:'Structure & bonding',
      topics:['functional-groups','aldehydes-ketones','esters-amides','acyl-substitution'], dependsOn:['functional-group-recognition'],
      hint:'Find the C=O, then read the atom on its other side: H, carbon, OH, O-carbon, N, Cl, or an O leading to a second C=O.' },

    /* ---- Electron flow ----------------------------------------------- */
    { id:'resonance-delocalization', title:'Resonance delocalization', family:'Electron flow',
      topics:['resonance','curved-arrows','acidity-factors','carboxylic-acids','aromaticity','directing-effects','alpha-hydrogens','conjugate'], dependsOn:['formal-charge-calc'],
      hint:'Resonance needs a p orbital next door — look for a lone pair or pi bond adjacent to the site.' },
    { id:'resonance-validity', title:'Legal vs. illegal resonance', family:'Electron flow',
      topics:['resonance','curved-arrows','aromaticity'], dependsOn:['resonance-delocalization','formal-charge-calc'],
      hint:'Never break a sigma bond, and never give a second-row atom more than eight electrons.' },
    { id:'curved-arrow-direction', title:'Curved arrow direction', family:'Electron flow',
      topics:['curved-arrows','resonance','sn2','sn1','e1','e2','addition-reactions','nucleophilic-addition','acyl-substitution','eas'], dependsOn:['resonance-delocalization'],
      hint:'Arrows always start at electrons and end where the electrons land.' },
    { id:'nucleophile-recognition', title:'Recognizing nucleophiles', family:'Electron flow',
      topics:['nucleophiles','electron-rich-poor','sn2','sn1','addition-reactions','nucleophilic-addition','amine-reactions','alkynes'], dependsOn:['electronegativity-trend'],
      hint:'Look for the electron-rich species: a negative charge, a lone pair, or a pi bond.' },
    { id:'electrophile-recognition', title:'Recognizing electrophiles', family:'Electron flow',
      topics:['electrophiles','electron-rich-poor','sn2','sn1','aldehydes-ketones','eas','addition-reactions'], dependsOn:['electronegativity-trend'],
      hint:'Find the atom that is electron-poor: δ+, formally positive, or short of an octet.' },
    { id:'leaving-group-ability', title:'Leaving group ability', family:'Electron flow',
      topics:['leaving-groups','sn2','sn1','e1','e2','alcohol-reactions','epoxides','esters-amides','acyl-substitution'], dependsOn:['pka-scale'],
      hint:'Good leaving groups are weak bases — check the pKa of their conjugate acid.' },
    { id:'electron-rich-poor', title:'Electron-rich vs. electron-poor', family:'Electron flow',
      topics:['electron-rich-poor','nucleophiles','electrophiles','directing-effects','eas'], dependsOn:['electronegativity-trend','resonance-delocalization'],
      hint:'Map the charge distribution before you decide what attacks what.' },

    /* ---- Acids & bases ------------------------------------------------ */
    { id:'bronsted-identification', title:'Brønsted acids & bases', family:'Acids & bases',
      topics:['bronsted','conjugate','pka','amine-structure'],
      hint:'Follow the proton: the species that loses H+ is the acid.' },
    { id:'lewis-acid-base', title:'Lewis acids & bases', family:'Acids & bases',
      topics:['lewis-acids','nucleophiles','electrophiles','eas'], dependsOn:['electrophile-recognition'],
      hint:'Lewis acid = electron-pair acceptor. It does not need a proton at all.' },
    { id:'pka-scale', title:'Reading the pKa scale', family:'Acids & bases',
      topics:['pka','conjugate','acidity-factors','leaving-groups','alpha-hydrogens','amine-structure'],
      hint:'Lower pKa means stronger acid — and each unit is a factor of ten.' },
    { id:'conjugate-pairs', title:'Conjugate acid/base pairs', family:'Acids & bases',
      topics:['conjugate','bronsted','pka'], dependsOn:['bronsted-identification'],
      hint:'Conjugates differ by exactly one H and one unit of charge.' },
    { id:'acidity-factors', title:'What makes an acid strong', family:'Acids & bases',
      topics:['acidity-factors','pka','carboxylic-acids','alkynes','alpha-hydrogens','amine-structure'], dependsOn:['resonance-delocalization','electronegativity-trend','pka-scale'],
      hint:'Judge the stability of the conjugate base, not the acid itself.' },
    { id:'basicity-vs-nucleophilicity', title:'Basicity vs. nucleophilicity', family:'Acids & bases',
      topics:['nucleophiles','sn2','e2','substrate-effects','alkynes'], dependsOn:['nucleophile-recognition','pka-scale'],
      hint:'Basicity attacks H; nucleophilicity attacks C. Size and hindrance separate them.' },

    /* ---- Conformations ------------------------------------------------ */
    { id:'newman-reading', title:'Reading Newman projections', family:'Conformations',
      topics:['newman','conformational-analysis'],
      hint:'The front carbon\'s bonds meet at a point; the back carbon\'s come off a circle.' },
    { id:'torsional-strain', title:'Torsional & steric strain', family:'Conformations',
      topics:['newman','conformational-analysis','cyclohexanes'], dependsOn:['newman-reading'],
      hint:'Eclipsing costs energy; two big groups eclipsing each other costs the most.' },
    { id:'chair-axial-equatorial', title:'Axial vs. equatorial', family:'Conformations',
      topics:['cyclohexanes','axial-equatorial','ring-flips','conformational-analysis','epoxides'],
      hint:'Axial bonds point straight up or down; equatorial bonds fan out along the ring.' },
    { id:'ring-flip-mechanics', title:'Ring flips', family:'Conformations',
      topics:['ring-flips','axial-equatorial','conformational-analysis'], dependsOn:['chair-axial-equatorial'],
      hint:'A flip swaps axial and equatorial — but never changes up to down.' },
    { id:'steric-hindrance', title:'Steric hindrance', family:'Conformations',
      topics:['sn2','substrate-effects','nucleophiles','axial-equatorial','nucleophilic-addition','aldehydes-ketones','e2'], dependsOn:['torsional-strain'],
      hint:'Count the carbon groups crowding the reacting atom.' },

    /* ---- Stereochemistry ---------------------------------------------- */
    { id:'chirality-recognition', title:'Recognizing chirality', family:'Stereochemistry',
      topics:['chirality','stereocenters','enantiomers','meso'],
      hint:'Chiral means non-superimposable on its mirror image. Check for an internal mirror plane.' },
    { id:'stereocenter-identification', title:'Finding stereocenters', family:'Stereochemistry',
      topics:['stereocenters','chirality','rs-configuration','diastereomers','meso'], dependsOn:['chirality-recognition'],
      hint:'A stereocenter is a carbon with four *different* groups.' },
    { id:'cip-priority', title:'CIP priority rules', family:'Stereochemistry',
      topics:['rs-configuration','fischer','enantiomers','diastereomers'], dependsOn:['stereocenter-identification'],
      hint:'Rank by atomic number at the first point of difference; duplicate atoms for double bonds.' },
    { id:'rs-assignment', title:'Assigning R and S', family:'Stereochemistry',
      topics:['rs-configuration','fischer','enantiomers'], dependsOn:['cip-priority'],
      hint:'Put the lowest priority in back, then read 1→2→3. Reverse if it was pointing at you.' },
    { id:'enantiomer-vs-diastereomer', title:'Enantiomers vs. diastereomers', family:'Stereochemistry',
      topics:['enantiomers','diastereomers','meso','fischer'], dependsOn:['rs-assignment'],
      hint:'Every stereocenter inverted = enantiomers. Some but not all = diastereomers.' },
    { id:'meso-detection', title:'Meso compounds', family:'Stereochemistry',
      topics:['meso','diastereomers','chirality'], dependsOn:['enantiomer-vs-diastereomer','chirality-recognition'],
      hint:'Stereocenters present but an internal mirror plane — achiral anyway.' },
    { id:'fischer-reading', title:'Fischer projections', family:'Stereochemistry',
      topics:['fischer','rs-configuration','diastereomers'], dependsOn:['rs-assignment'],
      hint:'Horizontal bonds come toward you; vertical bonds go away.' },
    { id:'stereochemical-outcome', title:'Stereochemical outcome', family:'Stereochemistry',
      topics:['sn2','sn1','e2','addition-reactions','markovnikov','epoxides','substrate-effects'], dependsOn:['rs-assignment','backside-attack'],
      hint:'One-step backside attack inverts; a planar intermediate gives a mixture.' },

    /* ---- Substitution & elimination ------------------------------------ */
    { id:'substrate-class', title:'Substrate class (1°/2°/3°)', family:'Substitution & elimination',
      topics:['sn2','sn1','e1','e2','substrate-effects','alcohol-reactions'],
      hint:'Count carbons attached to the carbon bearing the leaving group.' },
    { id:'backside-attack', title:'Backside attack', family:'Substitution & elimination',
      topics:['sn2','substrate-effects','epoxides','ether-chemistry'], dependsOn:['steric-hindrance','nucleophile-recognition'],
      hint:'The nucleophile must approach 180° from the leaving group.' },
    { id:'carbocation-stability', title:'Carbocation stability', family:'Substitution & elimination',
      topics:['sn1','e1','markovnikov','alcohol-reactions','eas','mass-spec'], dependsOn:['resonance-delocalization'],
      hint:'More substituted is more stable; resonance beats everything.' },
    { id:'carbocation-rearrangement', title:'Carbocation rearrangements', family:'Substitution & elimination',
      topics:['sn1','e1','markovnikov','alcohol-reactions'], dependsOn:['carbocation-stability'],
      hint:'If a 1,2-shift would make a more stable cation, it happens.' },
    { id:'anti-periplanar-geometry', title:'Anti-periplanar geometry', family:'Substitution & elimination',
      topics:['e2','conformational-analysis','ring-flips','substrate-effects','axial-equatorial'], dependsOn:['chair-axial-equatorial','newman-reading'],
      hint:'The H and the leaving group must be 180° apart — on a ring, both axial.' },
    { id:'zaitsev-hofmann', title:'Zaitsev vs. Hofmann', family:'Substitution & elimination',
      topics:['e1','e2','substrate-effects','alcohol-reactions'], dependsOn:['anti-periplanar-geometry','steric-hindrance'],
      hint:'Small base → most substituted alkene. Bulky base → least substituted.' },
    { id:'mechanism-selection', title:'Choosing SN1/SN2/E1/E2', family:'Substitution & elimination',
      topics:['substrate-effects','sn1','sn2','e1','e2','alcohol-reactions'], dependsOn:['substrate-class','basicity-vs-nucleophilicity','carbocation-stability','solvent-effects'],
      hint:'Substrate first, then the nucleophile/base strength, then the solvent.' },
    { id:'solvent-effects', title:'Solvent effects', family:'Substitution & elimination',
      topics:['substrate-effects','sn1','sn2','nucleophiles'], dependsOn:['nucleophile-recognition'],
      hint:'Protic solvents cage anions; aprotic solvents leave them bare and reactive.' },
    { id:'rate-law-kinetics', title:'Rate laws & kinetics', family:'Substitution & elimination',
      topics:['sn1','sn2','e1','e2','substrate-effects'], dependsOn:['mechanism-selection'],
      hint:'Only species in the rate-determining step appear in the rate law.' },

    /* ---- Alkenes & alkynes --------------------------------------------- */
    { id:'alkene-pi-nucleophile', title:'The alkene pi bond as nucleophile', family:'Alkenes & alkynes',
      topics:['alkene-structure','addition-reactions','markovnikov','eas'], dependsOn:['nucleophile-recognition','hybridization-assignment'],
      hint:'The pi bond is the electron source — it attacks, it is not attacked.' },
    { id:'markovnikov-regiochem', title:'Markovnikov regiochemistry', family:'Alkenes & alkynes',
      topics:['markovnikov','addition-reactions','alkynes','alcohol-reactions'], dependsOn:['carbocation-stability','alkene-pi-nucleophile'],
      hint:'The proton adds so as to leave the more stable carbocation behind.' },
    { id:'addition-stereochem', title:'Syn vs. anti addition', family:'Alkenes & alkynes',
      topics:['addition-reactions','markovnikov','alkynes','epoxides'], dependsOn:['stereochemical-outcome'],
      hint:'A bridged intermediate forces anti; a concerted one-face delivery gives syn.' },
    { id:'alkyne-acidity', title:'Terminal alkyne acidity', family:'Alkenes & alkynes',
      topics:['alkynes','acidity-factors','alpha-hydrogens'], dependsOn:['acidity-factors','hybridization-assignment'],
      hint:'sp carbon holds its lone pair closer to the nucleus — so it is more acidic.' },
    { id:'ez-assignment', title:'E/Z assignment', family:'Alkenes & alkynes',
      topics:['alkene-structure'], dependsOn:['cip-priority'],
      hint:'Rank each alkene carbon on its own two groups, then compare only the two winners.' },
    { id:'degrees-of-unsaturation', title:'Degrees of unsaturation', family:'Alkenes & alkynes',
      topics:['alkene-structure','alkynes'], dependsOn:['lewis-structures-drawing'],
      hint:'Halogens count as hydrogens, nitrogen is added, oxygen is ignored.' },
    { id:'alkene-stability-ranking', title:'Ranking alkene stability', family:'Alkenes & alkynes',
      topics:['alkene-structure','e1','e2'], dependsOn:['alkene-pi-nucleophile'],
      hint:'More alkyl groups is more stable, and trans beats cis.' },
    { id:'acetylide-alkylation', title:'Acetylide alkylation', family:'Alkenes & alkynes',
      topics:['alkynes','carbon-carbon-bonds'], dependsOn:['alkyne-acidity','backside-attack'],
      hint:'A carbon nucleophile doing SN2 — so methyl and primary halides only.' },
    { id:'keto-enol-tautomerism', title:'Keto-enol tautomerism', family:'Alkenes & alkynes',
      topics:['alkynes','alpha-hydrogens'], dependsOn:['resonance-delocalization'],
      hint:'A hydrogen actually moves, so these are two compounds, not two resonance forms.' },

    /* ---- Alcohols, ethers, epoxides ------------------------------------ */
    { id:'alcohol-activation', title:'Activating alcohols', family:'Alcohols & ethers',
      topics:['alcohol-reactions','ether-chemistry','leaving-groups'], dependsOn:['leaving-group-ability'],
      hint:'HO− is a terrible leaving group — protonate it or tosylate it first.' },
    { id:'epoxide-opening-regiochem', title:'Epoxide opening', family:'Alcohols & ethers',
      topics:['epoxides','ether-chemistry','substrate-effects'], dependsOn:['backside-attack','carbocation-stability'],
      hint:'Basic conditions attack the less hindered carbon; acidic attack the more substituted one.' },

    /* ---- Carbonyl chemistry -------------------------------------------- */
    { id:'carbonyl-electrophilicity', title:'Carbonyl electrophilicity', family:'Carbonyl chemistry',
      topics:['aldehydes-ketones','nucleophilic-addition','acetals','acyl-substitution','esters-amides'], dependsOn:['electrophile-recognition','resonance-delocalization'],
      hint:'The carbonyl carbon is δ+ — that is where nucleophiles attack.' },
    { id:'tetrahedral-intermediate', title:'The tetrahedral intermediate', family:'Carbonyl chemistry',
      topics:['nucleophilic-addition','acetals','acyl-substitution','esters-amides','aldol','claisen'], dependsOn:['carbonyl-electrophilicity','curved-arrow-direction'],
      hint:'The pi bond breaks up onto oxygen, giving an alkoxide — then it collapses back or not.' },
    { id:'acyl-reactivity-order', title:'Acyl substitution reactivity', family:'Carbonyl chemistry',
      topics:['acyl-substitution','esters-amides','carboxylic-acids'], dependsOn:['tetrahedral-intermediate','leaving-group-ability'],
      hint:'Reactivity tracks how good the leaving group is: Cl− > carboxylate > RO− > H2N−.' },
    { id:'amide-resonance', title:'Amide resonance', family:'Carbonyl chemistry',
      topics:['esters-amides','acyl-substitution','amine-structure','peptides-proteins','ir'], dependsOn:['resonance-delocalization','carbonyl-electrophilicity'],
      hint:'The nitrogen lone pair is in the pi system, not on nitrogen — so the C–N will not rotate, the carbonyl is the least electrophilic of the four, and the nitrogen is not basic.' },
    { id:'acetal-formation', title:'Acetals & hemiacetals', family:'Carbonyl chemistry',
      topics:['acetals','nucleophilic-addition','alcohol-reactions'], dependsOn:['tetrahedral-intermediate','alcohol-activation'],
      hint:'One alcohol gives a hemiacetal; a second, under acid, gives the acetal.' },

    { id:'addition-equilibrium', title:'How far a carbonyl addition goes', family:'Carbonyl chemistry',
      topics:['hydrates-cyanohydrins','aldehydes-ketones','nucleophilic-addition','acetals'], dependsOn:['carbonyl-electrophilicity','tetrahedral-intermediate'],
      hint:'Two causes, and for ordinary substituents they agree: crowding of the sp3 product, and donation into the C=O.' },
    { id:'aldehyde-oxidizability', title:'Which carbonyls oxidize, and why', family:'Carbonyl chemistry',
      topics:['aldehyde-oxidation','hydrates-cyanohydrins','oxidation-states','carbohydrates'], dependsOn:['addition-equilibrium','carbonyl-electrophilicity'],
      hint:'An oxidant needs a C-H and an O-H on the same carbon. A C=O has neither, but its hydrate has both.' },

    { id:'activation-before-acylation', title:'Climbing the acyl ladder', family:'Carbonyl chemistry',
      topics:['acyl-chlorides-anhydrides','acyl-substitution','esters-amides','carboxylic-acids','alcohol-reactions'], dependsOn:['acyl-reactivity-order','leaving-group-ability'],
      hint:'You can go down the ladder freely and never up, so almost every route from an acid opens by replacing the OH.' },
    { id:'nitrile-as-acyl-level', title:'Nitriles, and the one-carbon extension', family:'Carbonyl chemistry',
      topics:['nitriles','acyl-substitution','sn2','oxidation-states','grignard-reagents'], dependsOn:['acyl-reactivity-order','oxidation-level'],
      hint:'Three bonds to nitrogen is the same count as three bonds to oxygen, so a nitrile is on the acid rung.' },

    /* ---- Enolate chemistry --------------------------------------------- */
    { id:'alpha-acidity', title:'Alpha hydrogen acidity', family:'Enolate chemistry',
      topics:['alpha-hydrogens','aldol','claisen','acidity-factors'], dependsOn:['resonance-delocalization','acidity-factors'],
      hint:'Only hydrogens on the carbon next to a carbonyl are acidic.' },
    { id:'alpha-halogenation-control', title:'Halogenating the alpha carbon', family:'Enolate chemistry',
      topics:['alpha-halogenation','alpha-hydrogens','acyl-substitution','carboxylic-acids','amino-acids'], dependsOn:['alpha-acidity','enolate-formation'],
      hint:'Acid stops after one halogen and base does not stop at all, and it is the same substituent effect both times.' },
    { id:'enolate-regiocontrol', title:'Which alpha carbon', family:'Enolate chemistry',
      topics:['enolate-regiochemistry','alpha-hydrogens','aldol','kinetic-thermodynamic','imines-enamines'], dependsOn:['enolate-formation','alpha-acidity'],
      hint:'Ask whether the deprotonation can reverse. Temperature on its own decides nothing.' },

    { id:'enolate-formation', title:'Forming enolates', family:'Enolate chemistry',
      topics:['alpha-hydrogens','aldol','claisen','amine-reactions'], dependsOn:['alpha-acidity','basicity-vs-nucleophilicity'],
      hint:'Match the base to the job: LDA for full deprotonation, alkoxide for catalytic amounts.' },
    { id:'aldol-connectivity', title:'Aldol connectivity', family:'Enolate chemistry',
      topics:['aldol','alpha-hydrogens','nucleophilic-addition'], dependsOn:['enolate-formation','tetrahedral-intermediate'],
      hint:'The alpha carbon of one partner bonds to the carbonyl carbon of the other.' },
    { id:'claisen-connectivity', title:'Claisen connectivity', family:'Enolate chemistry',
      topics:['claisen','aldol','acyl-substitution'], dependsOn:['aldol-connectivity','acyl-reactivity-order'],
      hint:'Same attack as an aldol, but the ester expels an alkoxide, giving a beta-keto ester.' },

    /* ---- Amines -------------------------------------------------------- */
    { id:'amine-basicity', title:'Amine basicity', family:'Amines',
      topics:['amine-structure','amine-reactions','acidity-factors','esters-amides'], dependsOn:['acidity-factors','resonance-delocalization'],
      hint:'A lone pair tied up in resonance is not available to grab a proton.' },

    /* ---- Aromatic chemistry -------------------------------------------- */
    { id:'huckel-aromaticity', title:'Aromaticity & Hückel\'s rule', family:'Aromatic chemistry',
      topics:['aromaticity','eas','directing-effects','h-nmr'], dependsOn:['resonance-delocalization','hybridization-assignment'],
      hint:'Cyclic, planar, fully conjugated, and 4n+2 pi electrons — all four.' },
    { id:'eas-mechanism', title:'EAS mechanism', family:'Aromatic chemistry',
      topics:['eas','directing-effects','aromaticity'], dependsOn:['huckel-aromaticity','carbocation-stability'],
      hint:'Attack, then lose H+ to restore aromaticity — the ring is never permanently added to.' },
    { id:'directing-effects', title:'Ortho/para vs. meta directors', family:'Aromatic chemistry',
      topics:['directing-effects','eas','esters-amides'], dependsOn:['eas-mechanism','resonance-delocalization'],
      hint:'Draw the arenium resonance structures and see which position gets the donation.' },

    /* ---- Spectroscopy --------------------------------------------------- */
    { id:'ir-functional-groups', title:'IR functional groups', family:'Spectroscopy',
      topics:['ir','aldehydes-ketones','carboxylic-acids','esters-amides'],
      hint:'Check three places: ~1700 (C=O), ~3300 broad (O–H), ~2250 (C≡N or C≡C).' },
    { id:'nmr-shift-shielding', title:'NMR chemical shift', family:'Spectroscopy',
      topics:['h-nmr','c-nmr','electronegativity','aromaticity'], dependsOn:['electronegativity-trend'],
      hint:'Nearby electronegative atoms and pi systems push signals downfield.' },
    { id:'nmr-splitting-integration', title:'Splitting & integration', family:'Spectroscopy',
      topics:['h-nmr','c-nmr'], dependsOn:['nmr-shift-shielding'],
      hint:'n neighboring hydrogens give n+1 lines; integration gives the ratio of hydrogens.' },
    { id:'ms-fragmentation', title:'Mass spec fragmentation', family:'Spectroscopy',
      topics:['mass-spec','sn1'], dependsOn:['carbocation-stability'],
      hint:'Molecules fragment to give the most stable cation available.' }
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
    [/\be\/z\b|entgegen|zusammen/i, 'ez-assignment'],
    [/degrees? of unsaturation/i, 'degrees-of-unsaturation'],
    [/acetylide/i, 'acetylide-alkylation'],
    [/keto.?enol|tautomer|\benol\b/i, 'keto-enol-tautomerism'],
    [/heats? of hydrogenation|alkene stability|more substituted alkene/i, 'alkene-stability-ranking'],
    [/halohydrin|bromohydrin|mercurinium|oxymercuration/i, 'markovnikov-regiochem'],
    [/lindlar|dissolving.metal|liquid (nh3|ammonia)/i, 'addition-stereochem'],
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
    'hybridization':'hybridization-assignment', 'bonding':'sigma-pi-bonding',
    'electronegativity':'electronegativity-trend', 'formal-charge':'formal-charge-calc',
    'lewis-structures':'lewis-structures-drawing', 'molecular-geometry':'molecular-geometry-vsepr',
    'bond-polarity':'bond-polarity-dipoles',
    'functional-groups':'functional-group-recognition',
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

  /* The teach strings arrive separately (see the header). Attaching them
     onto the concept records, rather than keeping a side table, means every
     caller that already reads concept.teach keeps working unchanged; until
     the fetch lands the property is simply absent, and the one renderer that
     shows it (session-runner.js) treats a missing string as "no micro-lesson
     yet" rather than printing undefined. */
  var teachReady = null;
  function attachTeach(map){
    if(!map) return;
    CONCEPTS.forEach(function(c){ if(typeof map[c.id] === 'string') c.teach = map[c.id]; });
  }
  function loadTeach(url){
    if(teachReady) return teachReady;
    teachReady = fetch(url).then(function(res){
      if(!res.ok) throw new Error('concept teach strings ' + res.status);
      return res.json();
    }).then(function(map){ attachTeach(map); return map; })
      .catch(function(err){
        if(window.console && console.warn) console.warn('Concept micro-lessons unavailable; feedback will omit them.', err);
        return {};
      });
    return teachReady;
  }

  window.OchemConcepts = {
    ALL: CONCEPTS,
    attachTeach: attachTeach,
    loadTeach: loadTeach,
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
