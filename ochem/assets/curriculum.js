/* Ochem curriculum — a single source of truth for modules/topics/lessons so
   Learn, Mastery, and the sub-nav all read the same structure instead of
   each page hand-listing modules and drifting out of sync.

   A topic has two independent things: written notes (always — every topic
   has a page under ochem/notes/) and an interactive lesson (not always).
   `href` points at whatever a reader should open for that topic, and
   `notesOnly: true` says that destination is the notes page because the
   interactive lesson has not been built yet.

   So `href` alone does NOT mean "has a lesson" — use hasLesson(topic) for
   that. Everything that scores, resumes, or recommends a lesson must go
   through hasLesson, or a notes-only topic becomes a lesson that can never
   be finished (it would be recommended forever and hold its chapter open).

   A notes-only topic is UNTRACKED: there is no lesson to answer questions
   in, so it can never earn a mastery score. It is still counted in the
   denominator of module and overall mastery, deliberately — a chapter with
   a section nobody can be scored on is not a mastered chapter, and
   reporting 100% for it would be a lie about the course, not about the
   student. That also means overall mastery cannot reach 100 while any
   untracked topic exists, which scripts/check-curriculum.mjs enforces, and
   which fixes itself the moment the lesson ships.

   Progress is read from localStorage under 'ochem_progress': a plain object
   keyed by topic id -> { step, correct, attempts, completed, bestScore }.
   See the comment above beginLessonRun below for exactly what each field
   means and how mastery (bestScore) only ever moves up. Lessons own calling
   recordAttempt/completeLessonRun/saveStep as they go; this file only owns
   the shape of the curriculum and reading/writing that state. */
(function(){
  var MODULES = [
    { id: 'foundations', title: 'Foundations', topics: [
      { id: 'atomic-structure', title: 'Atomic structure', href: 'lessons/atomic-structure.html' },
      { id: 'orbitals', title: 'Orbitals', href: 'lessons/orbitals.html', dependsOn: ['atomic-structure'] },
      { id: 'hybridization', title: 'Hybridization', href: 'lessons/hybridization.html', dependsOn: ['orbitals'] },
      { id: 'bonding', title: 'Bonding', href: 'lessons/bonding.html', dependsOn: ['orbitals', 'hybridization'] },
      { id: 'electronegativity', title: 'Electronegativity', href: 'lessons/electronegativity.html', dependsOn: ['atomic-structure'] },
      { id: 'formal-charge', title: 'Formal charge', href: 'lessons/formal-charge.html', dependsOn: ['bonding', 'electronegativity'] },
      { id: 'lewis-structures', title: 'Lewis structures', href: 'lessons/lewis-structures.html', dependsOn: ['formal-charge', 'bonding'] },
      { id: 'molecular-geometry', title: 'Molecular geometry', href: 'lessons/molecular-geometry.html', dependsOn: ['lewis-structures', 'hybridization'] },
      { id: 'bond-polarity', title: 'Bond polarity', href: 'lessons/bond-polarity.html', dependsOn: ['electronegativity', 'molecular-geometry'] },
      // Last in Foundations on purpose: it needs Lewis structures to draw the
      // groups and bond polarity to say why each one reacts where it does,
      // and it comes before skeletal structures, so every group is drawn in
      // condensed or Lewis form.
      { id: 'functional-groups', title: 'Functional groups', href: 'lessons/functional-groups.html', dependsOn: ['lewis-structures', 'bond-polarity'] }
    ]},
    /* The two notations the rest of the course is written in: skeletal
       structures for molecules, curved arrows for electrons. Arrows come
       before resonance because resonance is the first thing drawn with
       them. Nucleophiles, electrophiles and leaving groups used to live here
       too; they moved to How Reactions Happen, after Acids & Bases, so that
       they can be taught with pKa in hand instead of an inline primer. */
    { id: 'electron-movement', title: 'Drawing Molecules & Moving Electrons', topics: [
      { id: 'skeletal-structures', title: 'Skeletal structures', href: 'lessons/skeletal-structures.html', dependsOn: ['lewis-structures'] },
      { id: 'curved-arrows', title: 'Curved arrows', href: 'lessons/curved-arrows.html', dependsOn: ['lewis-structures', 'formal-charge', 'skeletal-structures'] },
      { id: 'resonance', title: 'Resonance', href: 'lessons/resonance.html', dependsOn: ['curved-arrows', 'formal-charge', 'skeletal-structures'] }
    ]},
    /* Nomenclature sits here, third, for one reason: you have to be able to
       READ a structure before you can name one (module 2), and everything
       from Acids & Bases onward refers to compounds by name in its prose and
       its questions. Teaching it later would mean the course spends eleven
       chapters using a vocabulary it has not introduced. */
    { id: 'nomenclature', title: 'IUPAC Nomenclature', topics: [
      { id: 'naming-parent-chain', title: 'The parent chain', href: 'lessons/naming-parent-chain.html', dependsOn: ['skeletal-structures'] },
      { id: 'naming-substituents', title: 'Substituents & locants', href: 'lessons/naming-substituents.html', dependsOn: ['naming-parent-chain'] },
      { id: 'naming-functional-groups', title: 'Functional group priority', href: 'lessons/naming-functional-groups.html', dependsOn: ['naming-substituents'] },
      { id: 'naming-rings-unsaturation', title: 'Rings & unsaturation', href: 'lessons/naming-rings-unsaturation.html', dependsOn: ['naming-functional-groups'] }
    ]},
    /* Conjugate pairs come before pKa because pKa is defined on a conjugate
       pair; Lewis acids close the chapter because their payoff is the
       nucleophile/electrophile vocabulary that opens the next one. */
    { id: 'acids-bases', title: 'Acids & Bases', topics: [
      { id: 'bronsted', title: 'Brønsted acids/bases', href: 'lessons/bronsted.html', dependsOn: ['lewis-structures', 'curved-arrows'] },
      { id: 'conjugate', title: 'Conjugate acids/bases', href: 'lessons/conjugate.html', dependsOn: ['bronsted'] },
      { id: 'pka', title: 'pKa', href: 'lessons/pka.html', dependsOn: ['bronsted', 'conjugate'] },
      { id: 'acidity-factors', title: 'Factors affecting acidity', href: 'lessons/acidity-factors.html', dependsOn: ['pka', 'resonance', 'electronegativity', 'hybridization'] },
      { id: 'lewis-acids', title: 'Lewis acids/bases', href: 'lessons/lewis-acids.html', dependsOn: ['bronsted', 'curved-arrows'] }
    ]},
    { id: 'alkanes-conformations', title: 'Alkanes & Conformations', topics: [
      { id: 'newman', title: 'Newman projections', href: 'lessons/newman.html', dependsOn: ['molecular-geometry', 'bonding'] },
      { id: 'cyclohexanes', title: 'Cyclohexanes', href: 'lessons/cyclohexanes.html', dependsOn: ['newman'] },
      { id: 'axial-equatorial', title: 'Axial/equatorial', href: 'lessons/axial-equatorial.html', dependsOn: ['cyclohexanes'] },
      { id: 'ring-flips', title: 'Ring flips', href: 'lessons/ring-flips.html', dependsOn: ['axial-equatorial'] },
      { id: 'conformational-analysis', title: 'Conformational analysis', href: 'lessons/conformational-analysis.html', dependsOn: ['ring-flips'] }
    ]},
    /* R/S comes third because every relationship test in enantiomers,
       diastereomers and meso is "compare the descriptors". */
    { id: 'stereochemistry', title: 'Stereochemistry', topics: [
      { id: 'chirality', title: 'Chirality', href: 'lessons/chirality.html', dependsOn: ['molecular-geometry'] },
      { id: 'stereocenters', title: 'Stereocenters', href: 'lessons/stereocenters.html', dependsOn: ['chirality'] },
      { id: 'rs-configuration', title: 'R/S configuration', href: 'lessons/rs-configuration.html', dependsOn: ['stereocenters', 'electronegativity'] },
      { id: 'enantiomers', title: 'Enantiomers', href: 'lessons/enantiomers.html', dependsOn: ['stereocenters', 'rs-configuration'] },
      { id: 'diastereomers', title: 'Diastereomers', href: 'lessons/diastereomers.html', dependsOn: ['enantiomers'] },
      { id: 'meso', title: 'Meso compounds', href: 'lessons/meso.html', dependsOn: ['diastereomers'] },
      { id: 'fischer', title: 'Fischer projections', href: 'lessons/fischer.html', dependsOn: ['rs-configuration', 'meso'] },
      { id: 'prochirality', title: 'Prochirality: which hydrogens are the same?', href: 'lessons/prochirality.html', dependsOn: ['stereocenters', 'enantiomers', 'diastereomers', 'rs-configuration'] }
    ]},
    /* The chapter that used to be missing: the ideas every reaction chapter
       leans on, taught once, after acids and bases (so nucleophilicity and
       leaving-group ability can be argued from pKa) and after
       stereochemistry (so racemization can be named). Radical halogenation
       closes it because it is the cleanest place to USE a reaction-energy
       argument: radical stability by the same reasoning as carbocations,
       the Hammond postulate for Br2 against Cl2, racemization at a new
       stereocenter. */
    { id: 'reactivity', title: 'How Reactions Happen', topics: [
      { id: 'nucleophiles', title: 'Nucleophiles', href: 'lessons/nucleophiles.html', dependsOn: ['electronegativity', 'pka', 'lewis-acids'] },
      { id: 'electrophiles', title: 'Electrophiles', href: 'lessons/electrophiles.html', dependsOn: ['electronegativity', 'lewis-acids'] },
      { id: 'electron-rich-poor', title: 'Electron-rich vs. electron-poor atoms', href: 'lessons/electron-rich-poor.html', dependsOn: ['nucleophiles', 'electrophiles'] },
      { id: 'leaving-groups', title: 'Leaving groups', href: 'lessons/leaving-groups.html', dependsOn: ['electrophiles', 'pka', 'conjugate'] },
      { id: 'radical-halogenation', title: 'Radical halogenation', href: 'lessons/radical-halogenation.html', dependsOn: ['conformational-analysis', 'resonance', 'stereocenters'] }
    ]},
    /* E2 before E1: E2 is the one that needs the conformational material,
       and E1 then reads as SN1's other branch. */
    { id: 'substitution-elimination', title: 'Substitution & Elimination', topics: [
      { id: 'sn2', title: 'SN2', href: 'mechanisms/sn2.html', dependsOn: ['nucleophiles', 'leaving-groups', 'curved-arrows', 'molecular-geometry'] },
      { id: 'sn1', title: 'SN1', href: 'mechanisms/sn1.html', dependsOn: ['sn2', 'leaving-groups', 'resonance', 'enantiomers'] },
      { id: 'e2', title: 'E2', href: 'mechanisms/e2.html', dependsOn: ['conformational-analysis', 'leaving-groups', 'bronsted', 'sn2'] },
      { id: 'e1', title: 'E1', href: 'mechanisms/e1.html', dependsOn: ['sn1', 'e2'] },
      { id: 'substrate-effects', title: 'Substrate & solvent effects', href: 'lessons/substrate-effects.html', dependsOn: ['sn2', 'sn1', 'e1', 'e2'] }
    ]},
    /* Oxidative cleavage, dihydroxylation and hydrogenation live with the
       alkenes, where the substrate is, so that heats of hydrogenation,
       epoxidation (needed by Epoxides) and ozonolysis are available as soon
       as alkenes are. */
    { id: 'alkenes-alkynes', title: 'Alkenes & Alkynes', topics: [
      { id: 'alkene-structure', title: 'Alkene structure', href: 'lessons/alkene-structure.html', dependsOn: ['hybridization'] },
      { id: 'addition-reactions', title: 'Addition reactions', href: 'lessons/addition-reactions.html', mechanism: 'mechanisms/addition.html', dependsOn: ['alkene-structure', 'nucleophiles', 'electrophiles'] },
      { id: 'markovnikov', title: 'Markovnikov / anti-Markovnikov', href: 'lessons/markovnikov.html', dependsOn: ['addition-reactions', 'sn1'] },
      { id: 'alkene-oxidation', title: 'Oxidative cleavage & dihydroxylation', href: 'lessons/alkene-oxidation.html', dependsOn: ['addition-reactions', 'diastereomers'] },
      { id: 'hydrogenation', title: 'Catalytic hydrogenation', href: 'lessons/hydrogenation.html', dependsOn: ['alkene-structure', 'addition-reactions'] },
      { id: 'alkynes', title: 'Alkynes', href: 'lessons/alkynes.html', dependsOn: ['alkene-structure', 'acidity-factors', 'sn2', 'hydrogenation'] }
    ]},
    /* Conjugation goes directly after Alkenes & Alkynes: it is alkene
       chemistry with the p orbitals joined up, and it needs resonance from
       module 2. It also has to precede Aromatic Chemistry, which is the
       limiting case of the same idea, and Enolate Chemistry, which reuses the
       kinetic/thermodynamic argument wholesale.

       UV-Vis lives here rather than in Spectroscopy because it measures
       conjugation specifically, and is close to useless for anything else —
       it is the experimental half of this chapter, not a fourth instrument. */
    { id: 'conjugation', title: 'Conjugation & Pericyclic Reactions', topics: [
      { id: 'conjugated-systems', title: 'Conjugated systems', href: 'lessons/conjugated-systems.html', dependsOn: ['alkene-structure', 'resonance'] },
      { id: 'diene-addition', title: '1,2- vs 1,4-addition', href: 'lessons/diene-addition.html', dependsOn: ['conjugated-systems', 'markovnikov'] },
      { id: 'kinetic-thermodynamic', title: 'Kinetic vs thermodynamic control', href: 'lessons/kinetic-thermodynamic.html', dependsOn: ['diene-addition'] },
      { id: 'diels-alder', title: 'The Diels–Alder reaction', href: 'lessons/diels-alder.html', dependsOn: ['conjugated-systems', 'kinetic-thermodynamic'] },
      { id: 'uv-vis', title: 'UV-Vis spectroscopy', href: 'lessons/uv-vis.html', dependsOn: ['conjugated-systems'] }
    ]},
    { id: 'alcohols-ethers', title: 'Alcohols, Ethers & Related Chemistry', topics: [
      { id: 'alcohol-reactions', title: 'Alcohol reactions', href: 'lessons/alcohol-reactions.html', dependsOn: ['leaving-groups', 'e1'] },
      { id: 'ether-chemistry', title: 'Ether chemistry', href: 'lessons/ether-chemistry.html', dependsOn: ['sn2', 'alcohol-reactions'] },
      { id: 'epoxides', title: 'Epoxides', href: 'lessons/epoxides.html', dependsOn: ['ether-chemistry', 'cyclohexanes', 'substrate-effects', 'alkene-oxidation'] }
    ]},
    /* Imines, enamines and the Wittig are nucleophilic additions to a C=O,
       so they belong here, where the mechanism is taught, rather than in a
       breadth chapter at the end that Enolates, Amines and Synthesis all
       had to point forward to. */
    { id: 'carbonyl-chemistry', title: 'Carbonyl Chemistry', topics: [
      { id: 'aldehydes-ketones', title: 'Aldehydes & ketones', href: 'lessons/aldehydes-ketones.html', dependsOn: ['hybridization', 'electrophiles'] },
      { id: 'nucleophilic-addition', title: 'Nucleophilic addition', href: 'lessons/nucleophilic-addition.html', mechanism: 'mechanisms/carbonyl-addition.html', dependsOn: ['aldehydes-ketones', 'nucleophiles'] },
      { id: 'hydrates-cyanohydrins', title: 'Hydrates & cyanohydrins', href: 'lessons/hydrates-cyanohydrins.html', dependsOn: ['nucleophilic-addition', 'electronegativity'] },
      { id: 'acetals', title: 'Acetals & hemiacetals', href: 'lessons/acetals.html', dependsOn: ['nucleophilic-addition', 'hydrates-cyanohydrins', 'alcohol-reactions', 'resonance'] },
      { id: 'imines-enamines', title: 'Imines and enamines', href: 'lessons/imines-enamines.html', dependsOn: ['nucleophilic-addition', 'acetals', 'bronsted'] },
      { id: 'wittig-reaction', title: 'The Wittig reaction', href: 'lessons/wittig-reaction.html', dependsOn: ['nucleophilic-addition', 'sn2', 'alkene-structure'] },
      { id: 'aldehyde-oxidation', title: 'Oxidizing an aldehyde', href: 'lessons/aldehyde-oxidation.html', dependsOn: ['hydrates-cyanohydrins', 'aldehydes-ketones'] }
    ]},
    /* Oxidation & Reduction sits after Carbonyl Chemistry because it needs
       both ends of the ladder available: alcohols to oxidize and aldehydes
       and ketones to reduce. Keeping oxidation and reduction in one chapter
       rather than scattering them is deliberate: nearly every question on
       this material is "which reagent, and what survives", and that
       comparison only works if the reagents are in the same place. */
    { id: 'redox', title: 'Oxidation & Reduction', topics: [
      { id: 'oxidation-states', title: 'Oxidation levels in organic chemistry', href: 'lessons/oxidation-states.html', dependsOn: ['electronegativity', 'alcohol-reactions'] },
      { id: 'alcohol-oxidation', title: 'Oxidizing alcohols', href: 'lessons/alcohol-oxidation.html', dependsOn: ['oxidation-states', 'aldehydes-ketones'] },
      { id: 'carbonyl-reduction', title: 'Reducing carbonyls', href: 'lessons/carbonyl-reduction.html', dependsOn: ['oxidation-states', 'nucleophilic-addition'] }
    ]},
    /* Baeyer–Villiger closes this chapter rather than Redox: it is an
       oxidation, but its product is an ester, so it has to come after esters
       and amides are known. */
    { id: 'carboxylic-acids', title: 'Carboxylic Acids & Derivatives', topics: [
      { id: 'carboxylic-acids', title: 'Carboxylic acids', href: 'lessons/carboxylic-acids.html', dependsOn: ['resonance', 'pka', 'acidity-factors'] },
      { id: 'esters-amides', title: 'Esters & amides', href: 'lessons/esters-amides.html', dependsOn: ['carboxylic-acids', 'leaving-groups'] },
      { id: 'acyl-substitution', title: 'Nucleophilic acyl substitution', href: 'lessons/acyl-substitution.html', mechanism: 'mechanisms/acyl-substitution.html', dependsOn: ['esters-amides', 'nucleophilic-addition'] },
      { id: 'acyl-chlorides-anhydrides', title: 'Acid chlorides & anhydrides', href: 'lessons/acyl-chlorides-anhydrides.html', dependsOn: ['acyl-substitution', 'alcohol-reactions'] },
      { id: 'nitriles', title: 'Nitriles', href: 'lessons/nitriles.html', dependsOn: ['acyl-chlorides-anhydrides', 'sn2'] },
      { id: 'baeyer-villiger', title: 'Baeyer–Villiger oxidation', href: 'lessons/baeyer-villiger.html', dependsOn: ['epoxides', 'esters-amides', 'sn1', 'alcohol-oxidation'] }
    ]},
    /* Organometallics come right after the acid derivatives because the
       chapter's core argument — an acid chloride or ester adds two
       equivalents — needs the derivatives, and because everything after it
       (Michael with cuprates, Synthesis) wants a Grignard already known. */
    { id: 'organometallics', title: 'Organometallics', topics: [
      { id: 'organometallic-bonding', title: 'Why C–metal means nucleophilic carbon', href: 'lessons/organometallic-bonding.html', dependsOn: ['electronegativity', 'bond-polarity', 'nucleophiles'] },
      { id: 'grignard-reagents', title: 'Grignard reagents', href: 'lessons/grignard-reagents.html', dependsOn: ['organometallic-bonding', 'nucleophilic-addition', 'acyl-substitution'] },
      { id: 'organolithium-reagents', title: 'Organolithiums and acetylides', href: 'lessons/organolithium-reagents.html', dependsOn: ['grignard-reagents', 'alkynes', 'acidity-factors'] },
      { id: 'gilman-reagents', title: 'Cuprates and conjugate addition', href: 'lessons/gilman-reagents.html', dependsOn: ['grignard-reagents', 'nucleophilic-addition', 'resonance'] },
      { id: 'cross-coupling', title: 'Palladium cross-coupling', href: 'lessons/cross-coupling.html', dependsOn: ['gilman-reagents', 'sn2', 'alkene-structure'] }
    ]},
    /* The malonic/acetoacetic ester syntheses and the Michael/Robinson pair
       are enolate reactions, so they close the enolate chapter instead of
       waiting for a breadth chapter after Organometallics. */
    { id: 'enolate-chemistry', title: 'Enolate Chemistry', topics: [
      { id: 'alpha-hydrogens', title: 'Alpha hydrogens & enolates', href: 'lessons/alpha-hydrogens.html', dependsOn: ['aldehydes-ketones', 'acidity-factors', 'alkynes'] },
      { id: 'aldol', title: 'Aldol reactions', href: 'lessons/aldol.html', mechanism: 'mechanisms/aldol.html', dependsOn: ['alpha-hydrogens', 'nucleophilic-addition'] },
      { id: 'claisen', title: 'Claisen reactions', href: 'lessons/claisen.html', mechanism: 'mechanisms/claisen.html', dependsOn: ['aldol', 'acyl-substitution'] },
      { id: 'alpha-halogenation', title: 'Alpha halogenation & the haloform reaction', href: 'lessons/alpha-halogenation.html', dependsOn: ['alpha-hydrogens', 'acyl-substitution'] },
      { id: 'enolate-regiochemistry', title: 'Kinetic & thermodynamic enolates', href: 'lessons/enolate-regiochemistry.html', dependsOn: ['alpha-hydrogens', 'aldol'] },
      { id: 'ester-syntheses', title: 'Malonic and acetoacetic ester', href: 'lessons/ester-syntheses.html', dependsOn: ['claisen', 'alpha-hydrogens', 'sn2'] },
      { id: 'michael-robinson', title: 'Michael and Robinson', href: 'lessons/michael-robinson.html', dependsOn: ['aldol', 'alpha-hydrogens', 'gilman-reagents'] }
    ]},
    { id: 'aromatic-chemistry', title: 'Aromatic Chemistry', topics: [
      { id: 'aromaticity', title: 'Aromaticity', href: 'lessons/aromaticity.html', dependsOn: ['resonance', 'hybridization'] },
      { id: 'eas', title: 'Electrophilic aromatic substitution', href: 'lessons/eas.html', mechanism: 'mechanisms/eas.html', dependsOn: ['aromaticity', 'addition-reactions', 'markovnikov'] },
      { id: 'directing-effects', title: 'Ortho/meta/para directing effects', href: 'lessons/directing-effects.html', dependsOn: ['eas', 'esters-amides'] }
    ]},
    /* Amines come after Aromatic Chemistry because the aniline / pyridine /
       pyrrole basicity argument is an aromaticity argument, and half of
       amine reactions are run on an aromatic amine. */
    { id: 'amines', title: 'Amines', topics: [
      { id: 'amine-structure', title: 'Structure & basicity', href: 'lessons/amine-structure.html', dependsOn: ['bronsted', 'lewis-acids', 'esters-amides', 'aromaticity'] },
      { id: 'amine-reactions', title: 'Amine reactions', href: 'lessons/amine-reactions.html', dependsOn: ['amine-structure', 'sn2', 'nucleophilic-addition', 'acyl-substitution', 'imines-enamines'] },
      { id: 'amine-synthesis', title: 'Making amines', href: 'lessons/amine-synthesis.html', dependsOn: ['amine-reactions', 'sn2', 'carbonyl-reduction'] },
      { id: 'hofmann-elimination', title: 'Hofmann elimination', href: 'lessons/hofmann-elimination.html', dependsOn: ['amine-synthesis', 'e2'] }
    ]},
    /* The aromatic chapter taught one reaction — electrophilic substitution —
       and stopped. This is everything that follows from it: the two ways to
       put a NUCLEOPHILE on a ring, the position next to the ring, what an OH
       on a ring does, how to reduce a ring partway, and the intermediate that
       reaches the groups substitution cannot. */
    { id: 'aromatic-breadth', title: 'Aromatic Follow-Through', topics: [
      { id: 'nucleophilic-aromatic', title: 'SNAr and benzyne', href: 'lessons/nucleophilic-aromatic.html', dependsOn: ['eas', 'directing-effects', 'sn2'] },
      { id: 'benzylic-reactivity', title: 'Benzylic reactivity', href: 'lessons/benzylic-reactivity.html', dependsOn: ['resonance', 'sn1', 'radical-halogenation'] },
      { id: 'phenols', title: 'Phenols', href: 'lessons/phenols.html', dependsOn: ['acidity-factors', 'pka', 'directing-effects'] },
      { id: 'birch-reduction', title: 'Birch reduction', href: 'lessons/birch-reduction.html', dependsOn: ['aromaticity', 'hydrogenation', 'conjugated-systems'] },
      { id: 'diazonium-chemistry', title: 'Diazonium salts and Sandmeyer', href: 'lessons/diazonium-chemistry.html', dependsOn: ['amine-reactions', 'eas', 'directing-effects'] }
    ]},
    /* Spectroscopy stays after the aromatic chapters, so that every
       functional group is known when spectra are read, and Synthesis
       follows immediately, which is where "confirm the product" is used. */
    { id: 'spectroscopy', title: 'Spectroscopy', topics: [
      { id: 'ir', title: 'IR', href: 'lessons/ir.html', dependsOn: ['bonding', 'hybridization'] },
      { id: 'h-nmr', title: '¹H NMR', href: 'lessons/h-nmr.html', dependsOn: ['electronegativity', 'aromaticity'] },
      { id: 'c-nmr', title: '¹³C NMR', href: 'lessons/c-nmr.html', dependsOn: ['h-nmr'] },
      { id: 'mass-spec', title: 'Mass spectrometry', href: 'lessons/mass-spec.html', dependsOn: ['sn1', 'markovnikov', 'eas'] }
    ]},
    /* Synthesis is the capstone: it plans with reactions from every chapter
       before it, including Spectroscopy, since confirming a product is part
       of making one. */
    { id: 'synthesis', title: 'Synthesis & Retrosynthesis', topics: [
      { id: 'retrosynthesis', title: 'Thinking backwards', href: 'lessons/retrosynthesis.html', dependsOn: ['nucleophilic-addition', 'aldol', 'grignard-reagents'] },
      { id: 'carbon-carbon-bonds', title: 'Making carbon–carbon bonds', href: 'lessons/carbon-carbon-bonds.html', dependsOn: ['retrosynthesis', 'alkynes', 'diels-alder', 'claisen', 'wittig-reaction', 'michael-robinson', 'cross-coupling'] },
      { id: 'functional-group-interconversion', title: 'Functional group interconversion', href: 'lessons/functional-group-interconversion.html', dependsOn: ['retrosynthesis', 'alcohol-oxidation', 'carbonyl-reduction', 'hydrogenation'] },
      { id: 'protecting-groups', title: 'Protecting groups', href: 'lessons/protecting-groups.html', dependsOn: ['acetals', 'nucleophilic-addition', 'alcohol-reactions'] },
      { id: 'multistep-synthesis', title: 'Planning a multistep route', href: 'lessons/multistep-synthesis.html', dependsOn: ['carbon-carbon-bonds', 'functional-group-interconversion', 'protecting-groups', 'directing-effects'] }
    ]},
    /* Biomolecules sits after Synthesis because it earns its place by being
       downstream of almost everything: a sugar is an intramolecular
       hemiacetal, a peptide bond is an amide, a fat is a triester, and DNA's
       backbone is a diester. Nothing here is a new reaction — it is the
       reactions already taught, shown doing the work they do in a cell. */
    { id: 'biomolecules', title: 'Biomolecules', topics: [
      { id: 'carbohydrates', title: 'Carbohydrates', href: 'lessons/carbohydrates.html', dependsOn: ['acetals', 'nucleophilic-addition', 'fischer'] },
      { id: 'amino-acids', title: 'Amino acids', href: 'lessons/amino-acids.html', dependsOn: ['pka', 'bronsted', 'rs-configuration'] },
      { id: 'peptides-proteins', title: 'Peptides and proteins', href: 'lessons/peptides-proteins.html', dependsOn: ['amino-acids', 'esters-amides', 'resonance'] },
      { id: 'lipids', title: 'Lipids', href: 'lessons/lipids.html', dependsOn: ['esters-amides', 'acyl-substitution', 'hydrogenation'] },
      { id: 'nucleic-acids', title: 'Nucleic acids', href: 'lessons/nucleic-acids.html', dependsOn: ['carbohydrates', 'acetals', 'amine-structure'] }
    ]},
    /* Polymers last, and genuinely last rather than as an afterthought: not
       one reaction in the chapter is new. It is addition and acyl
       substitution run on monomers with two reactive ends, which makes it
       the place where the course's own reactions get applied to materials
       people can pick up. */
    { id: 'polymers', title: 'Polymers', topics: [
      { id: 'polymer-basics', title: 'What a polymer is', href: 'lessons/polymer-basics.html', dependsOn: ['addition-reactions', 'acyl-substitution', 'alkene-structure'] },
      { id: 'addition-polymers', title: 'Addition polymers', href: 'lessons/addition-polymers.html', dependsOn: ['polymer-basics', 'markovnikov', 'radical-halogenation'] },
      { id: 'condensation-polymers', title: 'Condensation polymers', href: 'lessons/condensation-polymers.html', dependsOn: ['polymer-basics', 'esters-amides', 'peptides-proteins'] },
      { id: 'polymer-properties', title: 'Structure and properties', href: 'lessons/polymer-properties.html', dependsOn: ['addition-polymers', 'condensation-polymers', 'lipids'] },
      { id: 'polymer-design', title: 'Designing and unmaking a polymer', href: 'lessons/polymer-design.html', dependsOn: ['polymer-properties', 'retrosynthesis', 'acyl-substitution'] }
    ]}
  ];

  function readProgress(){
    try{ var raw = localStorage.getItem('ochem_progress'); return raw ? JSON.parse(raw) : {}; }
    catch(e){ return {}; }
  }
  function writeProgress(p){
    try{ localStorage.setItem('ochem_progress', JSON.stringify(p)); }catch(e){}
  }

  /* Progress is tracked per topic as { step, correct, attempts, completed,
     bestScore }. step/correct/attempts/completed describe the CURRENT run
     (reset each time a fresh attempt begins); bestScore is a separate,
     permanent high-water mark — the best score you've ever gotten on a
     COMPLETED run of this lesson. topicMastery reports bestScore, never the
     live in-progress tally, so: (1) mastery only counts once you've actually
     finished the lesson at least once ("make sure you know the topics", not
     just opened them), and (2) redoing a lesson can only push that number up
     — a worse retry never erases a better earlier score, and once it hits
     100 it just stays there.

     beginLessonRun is called once, when a lesson page loads, before its
     first step renders:
       - no saved run, or the saved run was already completed -> this is a
         fresh attempt (opening a finished lesson again is a deliberate
         redo, e.g. to try to improve). Reset step/correct/attempts/completed
         to start a clean run, but carry bestScore forward untouched.
       - a saved, unfinished run exists -> the learner left partway through;
         resume at their saved step with that run's tally intact. */
  function beginLessonRun(topicId, totalSteps){
    var p = readProgress();
    var t = p[topicId];
    if(!t || t.completed){
      p[topicId] = { step: 0, correct: 0, attempts: 0, completed: false, bestScore: t ? t.bestScore : undefined };
      writeProgress(p);
      return { step: 0, resumed: false };
    }
    var step = Math.max(0, Math.min(t.step || 0, Math.max(0, totalSteps - 1)));
    return { step: step, resumed: step > 0 };
  }

  // Called whenever the engine renders a step, so an exit mid-lesson can
  // resume at the right place next time instead of restarting at step 1.
  function saveStep(topicId, step){
    var p = readProgress();
    var t = p[topicId] || { step: 0, correct: 0, attempts: 0, completed: false };
    t.step = step;
    p[topicId] = t;
    writeProgress(p);
  }

  // Every lesson calls this on each answered question so the current run's
  // tally builds up as you go.
  function recordAttempt(topicId, isCorrect){
    var p = readProgress();
    var t = p[topicId] || { step: 0, correct: 0, attempts: 0, completed: false };
    t.attempts++;
    if(isCorrect) t.correct++;
    p[topicId] = t;
    writeProgress(p);
  }

  // Marks the current run finished once the final challenge is answered
  // correctly, and folds this run's score into bestScore (only if it's
  // higher than whatever was already there) — the number topicMastery
  // reports from here on, until a later run beats it.
  function completeLessonRun(topicId){
    var p = readProgress();
    var t = p[topicId] || { step: 0, correct: 0, attempts: 0, completed: false };
    var thisRunScore = t.attempts > 0 ? Math.round((t.correct / t.attempts) * 100) : 0;
    t.bestScore = (typeof t.bestScore === 'number') ? Math.max(t.bestScore, thisRunScore) : thisRunScore;
    t.completed = true;
    p[topicId] = t;
    writeProgress(p);
  }

  // Explicit "start over" — used by the resume banner's opt-out link. Only
  // resets the in-progress run; your best completed score is untouched.
  function resetRun(topicId){
    var p = readProgress();
    var t = p[topicId];
    p[topicId] = { step: 0, correct: 0, attempts: 0, completed: false, bestScore: t ? t.bestScore : undefined };
    writeProgress(p);
  }

  // The score shown anywhere in the app: your best-ever completed-run
  // score for this topic, or null if you've never actually finished it.
  function topicMastery(topicId){
    var p = readProgress();
    var t = p[topicId];
    if(!t || typeof t.bestScore !== 'number') return null; // never completed
    return t.bestScore;
  }

  /* Does this topic have an interactive lesson you can be scored in?

     `href` is set on every topic, including the notes-only ones, so that no
     topic is ever a dead link. This is the test for "is there a lesson
     here" — the one the schedulers, resumers and recommenders need. Getting
     it wrong the other way (treating a notes page as a lesson) produces a
     lesson that can never be completed: recommended forever, holding its
     chapter permanently unfinished. */
  function hasLesson(topic){
    return !!(topic && topic.href && !topic.notesOnly);
  }

  // The label shown anywhere a notes-only topic is listed. One string, so
  // the textbook, the contents, the notes page and the checks cannot drift
  // into describing the same state three different ways.
  var NOTES_ONLY_LABEL = 'Notes only — interactive lesson coming soon';

  /* How much of the course can be scored at all.

     Untracked = a topic with written notes but no interactive lesson. These
     are counted, not hidden: any surface that shows a mastery percentage
     also has to be able to say what that percentage is silent about. */
  function masteryCoverage(mod){
    var topics = mod ? mod.topics : MODULES.reduce(function(a, m){ return a.concat(m.topics); }, []);
    var tracked = topics.filter(hasLesson).length;
    return { total: topics.length, tracked: tracked, untracked: topics.length - tracked };
  }

  function untrackedTopics(mod){
    var topics = mod ? mod.topics : MODULES.reduce(function(a, m){ return a.concat(m.topics); }, []);
    return topics.filter(function(t){ return !hasLesson(t); });
  }

  /* A module's mastery averages the scores you've earned over the topics you
     could have earned them in: every lesson you've completed, PLUS every
     untracked topic, which counts as not yet mastered.

     Untracked topics are in the denominator on purpose. Leaving them out is
     what let a chapter report 100% while containing a section with no lesson
     in it. A module with nothing scored yet still reports null rather than
     0% — "you haven't started" and "you scored zero" are different answers. */
  function moduleMastery(mod){
    var scored = mod.topics
      .filter(hasLesson)
      .map(function(t){ return topicMastery(t.id); })
      .filter(function(m){ return m !== null; });
    if(!scored.length) return null;
    var untracked = masteryCoverage(mod).untracked;
    var sum = scored.reduce(function(a,b){ return a+b; }, 0);
    return Math.round(sum / (scored.length + untracked));
  }

  function overallMastery(){
    var scored = MODULES.map(moduleMastery).filter(function(m){ return m !== null; });
    if(!scored.length) return null;
    return Math.round(scored.reduce(function(a,b){ return a+b; }, 0) / scored.length);
  }

  function findTopic(topicId){
    for(var i=0;i<MODULES.length;i++){
      for(var j=0;j<MODULES[i].topics.length;j++){
        if(MODULES[i].topics[j].id === topicId) return MODULES[i].topics[j];
      }
    }
    return null;
  }

  // The concept-dependency check from the spec: "you're struggling with E2,
  // so review conformational analysis first" — rather than just serving more
  // E2 questions. A topic only counts as "struggling" once there's enough
  // signal (5+ attempts) to mean something, not one unlucky first try.
  // Prerequisite topics are surfaced whether or not their own lesson exists
  // yet — the recommendation is honest either way ("review this" vs
  // "this hasn't been built yet"), rather than hiding the dependency.
  var STRUGGLING_THRESHOLD = 60;
  var MIN_ATTEMPTS_TO_JUDGE = 5;
  function strugglingPrerequisites(topicId){
    var topic = findTopic(topicId);
    if(!topic || !topic.dependsOn || !topic.dependsOn.length) return null;
    var p = readProgress();
    var t = p[topicId];
    if(!t || t.attempts < MIN_ATTEMPTS_TO_JUDGE) return null;
    var score = Math.round((t.correct / t.attempts) * 100);
    if(score >= STRUGGLING_THRESHOLD) return null;
    return {
      topic: topic,
      score: score,
      prerequisites: topic.dependsOn.map(findTopic).filter(Boolean)
    };
  }

  window.OchemCurriculum = {
    MODULES: MODULES,
    NOTES_ONLY_LABEL: NOTES_ONLY_LABEL,
    hasLesson: hasLesson,
    masteryCoverage: masteryCoverage,
    untrackedTopics: untrackedTopics,
    beginLessonRun: beginLessonRun,
    saveStep: saveStep,
    recordAttempt: recordAttempt,
    completeLessonRun: completeLessonRun,
    resetRun: resetRun,
    topicMastery: topicMastery,
    moduleMastery: moduleMastery,
    overallMastery: overallMastery,
    findTopic: findTopic,
    strugglingPrerequisites: strugglingPrerequisites
  };
})();
