/* Which concepts each lesson step actually tests.

   The lesson engine can infer a concept from a step's own text, and for a
   while that was the only source. It is not good enough: measured across all
   57 engine-driven lessons, inference collapsed 34 of them onto a single
   concept, recording an average of 1.5 distinct concepts against 4.25
   available per topic. Lesson prose is explanatory rather than keyword-dense
   — "Why it matters", "Putting it together" — so the keyword rules mostly
   miss and the topic's primary concept wins by default. A lesson that
   teaches seven ideas and records one is barely better than recording
   nothing.

   So the mapping is authored. It lives here rather than inline in 58
   hand-written lesson pages for three reasons: one file to audit, no risk of
   corrupting lesson markup to add a field, and drift is detectable — each
   entry records the step count it was written against, and a lesson whose
   steps have since changed falls back to inference rather than silently
   crediting the wrong concept (see forTopic below, and the validator in
   scripts/check-site.mjs).

   Keys are step indices into the lesson's own steps array. Only graded steps
   appear (mcq, final, and custom hands-on steps); explain steps record
   nothing because clicking Continue is not evidence of anything. First
   concept listed is primary and takes the larger share; the rest are
   genuinely involved but secondary. */
(function(){
  var MAP = {
    'acetals': { n:13, steps:{
      1:['acetal-formation'],
      4:['acetal-formation'],
      6:['acetal-formation','carbonyl-electrophilicity'],
      8:['acetal-formation'],
      11:['acetal-formation'],
      12:['acetal-formation','carbonyl-electrophilicity'] } },

    /* Step 2 sorts six nucleophiles against one acid chloride, 3 is the
       two-equivalent trap, 4 the leaving-group ranking, 6 the activate-then-
       acylate order, 7 the deprotonation that turns nothing into a reaction. */
    /* Step 2 is the carbon-count sorter, which is the first question to ask of
       any amine synthesis. 3 is why direct alkylation runs away, 4 why Gabriel
       can only go once, 6 the route for a secondary amine, 7 a synthesis that
       is flawless step by step and still arrives one carbon short. */
    'amine-synthesis': { n:8, steps:{
      2:['amine-synthesis-routes','oxidation-level'],
      3:['amine-synthesis-routes','nucleophile-recognition'],
      4:['amine-synthesis-routes'],
      6:['amine-synthesis-routes'],
      7:['amine-synthesis-routes'] } },

    /* Step 2 counts equivalents, which is the historical assay. 3 is the
       leaving-group argument, 4 the worked alkene, 6 the two-observation
       deduction, 7 the third way Zaitsev breaks. */
    'hofmann-elimination': { n:8, steps:{
      2:['hofmann-elimination-rule'],
      3:['hofmann-elimination-rule','leaving-group-ability'],
      4:['hofmann-elimination-rule','anti-periplanar-geometry'],
      6:['hofmann-elimination-rule'],
      7:['hofmann-elimination-rule','anti-periplanar-geometry'] } },

    'alpha-halogenation': { n:11, steps:{
      3:['alpha-halogenation-control','alpha-acidity'],
      6:['alpha-halogenation-control'],
      8:['alpha-halogenation-control','enolate-formation'],
      9:['alpha-halogenation-control'],
      10:['alpha-halogenation-control','acyl-reactivity-order'] } },

    /* 3 is which alpha carbon LDA takes, 5 the proton carriers, 8 sorts
       condition sets including one LDA row (0.9 equiv) that is not kinetic,
       10 the SN2 limit on the halide, 11 the final. */
    'enolate-regiochemistry': { n:12, steps:{
      3:['enolate-regiocontrol','alpha-acidity'],
      5:['enolate-regiocontrol'],
      8:['enolate-regiocontrol','enolate-formation'],
      10:['enolate-regiocontrol','mechanism-selection'],
      11:['enolate-regiocontrol'] } },

    'acyl-chlorides-anhydrides': { n:12, steps:{
      3:['activation-before-acylation','acyl-reactivity-order'],
      4:['activation-before-acylation'],
      6:['activation-before-acylation'],
      8:['acyl-reactivity-order','leaving-group-ability'],
      9:['activation-before-acylation'],
      11:['activation-before-acylation','acyl-reactivity-order'] } },

    /* Step 2 is the product sorter and carries the carbon counting with it.
       3 is why a Grignard adds once, 4 is a pure carbon count, 6 the route
       chosen on the substrate rather than the target, 7 the DIBAL trap. */
    'nitriles': { n:11, steps:{
      2:['substrate-class','nitrile-as-acyl-level'],
      5:['nitrile-as-acyl-level','reductant-scope','oxidation-level'],
      6:['nitrile-as-acyl-level','grignard-scope','tetrahedral-intermediate'],
      7:['nitrile-as-acyl-level','oxidation-level'],
      9:['nitrile-as-acyl-level','organometallic-quench'],
      10:['nitrile-as-acyl-level','reductant-scope'] } },

    'hydrates-cyanohydrins': { n:15, steps:{
      4:['addition-equilibrium'],
      6:['addition-equilibrium','aldehyde-oxidizability'],
      7:['addition-equilibrium','aldehyde-oxidizability'],
      9:['addition-equilibrium','tetrahedral-intermediate'],
      12:['addition-equilibrium','tetrahedral-intermediate'],
      14:['addition-equilibrium','carbonyl-electrophilicity'] } },

    'aldehyde-oxidation': { n:15, steps:{
      2:['aldehyde-oxidizability','addition-equilibrium'],
      5:['aldehyde-oxidizability','oxidation-level'],
      7:['aldehyde-oxidizability'],
      9:['aldehyde-oxidizability','addition-equilibrium'],
      12:['aldehyde-oxidizability'],
      14:['aldehyde-oxidizability','addition-equilibrium'] } },

    /* Step 2 is the hands-on "find every carbon", which is the skeleton-reading
       concept alone. 3 and 6 are hydrogen counts, so implicit-hydrogens leads.
       4 is the C–H versus O–H asymmetry, which is a notation rule rather than
       a counting one. 7 is the five-bond slip, where both are involved. */
    /* The four nomenclature lessons. Graded steps are 2, 3, 4, 6, 7 in each
       (0, 1 and 5 are explain steps and record nothing). */
    /* The synthesis chapter. Graded steps are 2, 3, 4, 6, 7. */
    'retrosynthesis': { n:8, steps:{
      2:['disconnection'], 3:['disconnection'], 4:['disconnection','cc-bond-toolkit'],
      6:['disconnection'], 7:['disconnection'] } },

    'carbon-carbon-bonds': { n:8, steps:{
      2:['cc-bond-toolkit'], 3:['cc-bond-toolkit'], 4:['cc-bond-toolkit','disconnection'],
      6:['cc-bond-toolkit'], 7:['cc-bond-toolkit'] } },

    'functional-group-interconversion': { n:8, steps:{
      2:['fgi-map'], 3:['fgi-map'], 4:['fgi-map','route-order'],
      6:['fgi-map'], 7:['fgi-map'] } },

    'protecting-groups': { n:8, steps:{
      2:['protection'], 3:['protection'], 4:['protection'],
      6:['protection','route-order'], 7:['protection','fgi-map'] } },

    'multistep-synthesis': { n:8, steps:{
      2:['route-order','protection'], 3:['route-order'], 4:['route-order'],
      6:['route-order'], 7:['route-order','cc-bond-toolkit'] } },

    'carbohydrates': { n:12, steps:{
      1:['sugar-ring'],
      4:['sugar-ring'],
      5:['sugar-ring'],
      8:['sugar-ring'],
      10:['sugar-ring'],
      11:['sugar-ring'] } },

    'amino-acids': { n:13, steps:{
      2:['zwitterion'],
      4:['zwitterion'],
      5:['zwitterion'],
      7:['zwitterion'],
      11:['cip-priority'],
      12:['zwitterion'] } },

    'peptides-proteins': { n:12, steps:{
      3:['peptide-bond'],
      4:['peptide-bond'],
      5:['peptide-bond'],
      8:['peptide-bond'],
      11:['peptide-bond'] } },

    'lipids': { n:14, steps:{
      3:['lipid-ester'],
      4:['lipid-ester'],
      6:['lipid-ester'],
      9:['lipid-ester'],
      13:['lipid-ester'] } },

    'nucleic-acids': { n:12, steps:{
      3:['nucleotide-assembly'],
      4:['nucleotide-assembly'],
      5:['nucleotide-assembly'],
      8:['nucleotide-assembly'],
      9:['nucleotide-assembly','sugar-ring'],
      11:['nucleotide-assembly'] } },

    'organometallic-bonding': { n:8, steps:{
      2:['polarity-reversal'], 3:['polarity-reversal'], 4:['polarity-reversal'],
      6:['organometallic-quench'], 7:['polarity-reversal','organometallic-quench'] } },

    'grignard-reagents': { n:8, steps:{
      2:['grignard-scope'], 3:['grignard-scope'], 4:['grignard-scope'],
      6:['grignard-scope'], 7:['organometallic-quench','grignard-scope'] } },

    'organolithium-reagents': { n:8, steps:{
      2:['grignard-scope'], 3:['grignard-scope'], 4:['grignard-scope'],
      6:['grignard-scope'], 7:['grignard-scope'] } },

    'gilman-reagents': { n:8, steps:{
      2:['hard-soft-addition'], 3:['hard-soft-addition'], 4:['hard-soft-addition'],
      6:['hard-soft-addition'], 7:['hard-soft-addition'] } },

    'cross-coupling': { n:8, steps:{
      2:['catalytic-cycle'], 3:['catalytic-cycle'], 4:['catalytic-cycle'],
      6:['catalytic-cycle'], 7:['catalytic-cycle','hard-soft-addition'] } },

    'wittig-reaction': { n:13, steps:{
      3:['alkene-by-construction'],
      5:['alkene-by-construction'],
      6:['alkene-by-construction'],
      10:['alkene-by-construction'],
      12:['alkene-by-construction'] } },

    'imines-enamines': { n:12, steps:{
      3:['amine-condensation'],
      5:['amine-condensation'],
      6:['amine-condensation'],
      8:['enamine-nucleophile'],
      11:['enamine-nucleophile','amine-condensation'] } },

    'michael-robinson': { n:11, steps:{
      3:['product-spacing'],
      4:['product-spacing'],
      5:['product-spacing'],
      8:['product-spacing'],
      10:['product-spacing'] } },

    'ester-syntheses': { n:11, steps:{
      3:['activating-group'],
      6:['activating-group'],
      8:['activating-group'],
      9:['activating-group'],
      10:['activating-group'] } },

    'baeyer-villiger': { n:13, steps:{
      3:['migratory-aptitude','curved-arrow-direction'],
      5:['migratory-aptitude','carbocation-stability'],
      6:['migratory-aptitude','carbocation-stability'],
      8:['migratory-aptitude'],
      10:['migratory-aptitude','stereochemical-outcome'],
      12:['migratory-aptitude','stereochemical-outcome'] } },

    'nucleophilic-aromatic': { n:8, steps:{
      2:['aromatic-nucleophilic'], 3:['aromatic-nucleophilic'], 4:['aromatic-nucleophilic'],
      6:['aromatic-nucleophilic'], 7:['aromatic-nucleophilic'] } },

    'benzylic-reactivity': { n:8, steps:{
      2:['benzylic-stabilization'], 3:['benzylic-stabilization'], 4:['benzylic-stabilization'],
      6:['benzylic-stabilization'], 7:['benzylic-stabilization'] } },

    'phenols': { n:8, steps:{
      2:['phenol-acidity'], 3:['phenol-acidity'], 4:['phenol-acidity'],
      6:['phenol-acidity'], 7:['phenol-acidity'] } },

    'birch-reduction': { n:8, steps:{
      2:['partial-reduction'], 3:['partial-reduction'], 4:['partial-reduction'],
      6:['partial-reduction'], 7:['partial-reduction'] } },

    'diazonium-chemistry': { n:8, steps:{
      2:['diazonium-hub'], 3:['diazonium-hub'], 4:['diazonium-hub'],
      6:['diazonium-hub'], 7:['diazonium-hub','aromatic-nucleophilic'] } },

    'polymer-basics': { n:8, steps:{
      2:['two-reactive-sites'], 3:['two-reactive-sites'], 4:['two-reactive-sites'],
      6:['two-reactive-sites'], 7:['two-reactive-sites'] } },

    'addition-polymers': { n:8, steps:{
      2:['chain-growth'], 3:['chain-growth'], 4:['chain-growth'],
      6:['chain-growth'], 7:['chain-growth','packing-and-properties'] } },

    'condensation-polymers': { n:8, steps:{
      2:['step-growth'], 3:['step-growth'], 4:['step-growth'],
      6:['step-growth'], 7:['step-growth'] } },

    'polymer-properties': { n:8, steps:{
      2:['packing-and-properties'], 3:['packing-and-properties'], 4:['packing-and-properties'],
      6:['crosslink-and-end-of-life'], 7:['crosslink-and-end-of-life'] } },

    'polymer-design': { n:8, steps:{
      2:['crosslink-and-end-of-life'], 3:['two-reactive-sites'], 4:['packing-and-properties'],
      6:['crosslink-and-end-of-life'], 7:['crosslink-and-end-of-life'] } },

    /* The oxidation & reduction chapter. Graded steps are 2, 3, 4, 6, 7. */
    'oxidation-states': { n:8, steps:{
      2:['oxidation-level'],
      3:['oxidation-level'],
      4:['oxidation-level','oxidant-choice'],
      6:['oxidation-level'],
      7:['oxidation-level'] } },

    'alcohol-oxidation': { n:8, steps:{
      2:['oxidant-choice'],
      3:['oxidant-choice','oxidation-level'],
      4:['oxidant-choice'],
      6:['oxidant-choice'],
      7:['oxidant-choice','oxidation-level'] } },

    'carbonyl-reduction': { n:8, steps:{
      2:['reductant-scope'],
      3:['reductant-scope'],
      4:['reductant-scope'],
      6:['reductant-scope'],
      7:['reductant-scope','oxidation-level'] } },

    'hydrogenation': { n:8, steps:{
      2:['reductant-scope'],
      3:['redox-stereochemistry'],
      4:['redox-stereochemistry','reductant-scope'],
      6:['reductant-scope'],
      7:['reductant-scope'] } },

    'alkene-oxidation': { n:8, steps:{
      2:['redox-stereochemistry','alkene-cleavage-scope'],
      3:['alkene-cleavage-scope'],
      4:['alkene-cleavage-scope'],
      6:['alkene-cleavage-scope'],
      7:['redox-stereochemistry'] } },

    /* The conjugation chapter. Graded steps are 2, 3, 4, 6, 7 in each. */
    'conjugated-systems': { n:8, steps:{
      2:['conjugation-recognition'],
      3:['conjugation-recognition'],
      4:['conjugation-recognition'],
      6:['allylic-capture','conjugation-recognition'],
      7:['conjugation-recognition'] } },

    'diene-addition': { n:8, steps:{
      2:['allylic-capture'],
      3:['allylic-capture'],
      4:['kinetic-vs-thermodynamic','allylic-capture'],
      6:['kinetic-vs-thermodynamic'],
      7:['allylic-capture','kinetic-vs-thermodynamic'] } },

    'kinetic-thermodynamic': { n:8, steps:{
      2:['kinetic-vs-thermodynamic'],
      3:['kinetic-vs-thermodynamic'],
      4:['kinetic-vs-thermodynamic'],
      6:['kinetic-vs-thermodynamic','allylic-capture'],
      7:['kinetic-vs-thermodynamic'] } },

    'diels-alder': { n:8, steps:{
      2:['cycloaddition-geometry','conjugation-recognition'],
      3:['cycloaddition-geometry'],
      4:['cycloaddition-geometry'],
      6:['cycloaddition-geometry'],
      7:['cycloaddition-geometry'] } },

    'uv-vis': { n:8, steps:{
      2:['conjugation-recognition'],
      3:['conjugation-recognition'],
      4:['conjugation-recognition'],
      6:['conjugation-recognition'],
      7:['conjugation-recognition'] } },

    'naming-parent-chain': { n:11, steps:{
      2:['parent-chain'],
      4:['parent-chain'],
      7:['locant-rules'],
      9:['parent-chain','locant-rules'],
      10:['parent-chain'] } },

    'naming-substituents': { n:13, steps:{
      3:['locant-rules'],
      5:['alphabetization'],
      7:['locant-rules','alphabetization'],
      8:['alphabetization'],
      11:['locant-rules'],
      12:['locant-rules','alphabetization'] } },

    'naming-functional-groups': { n:13, steps:{
      2:['group-priority'],
      4:['group-priority','locant-rules'],
      6:['group-priority','parent-chain'],
      8:['group-priority','alphabetization'],
      10:['group-priority','locant-rules'],
      12:['group-priority'] } },

    'naming-rings-unsaturation': { n:19, steps:{
      1:['locant-rules'],
      3:['locant-rules','alphabetization'],
      7:['locant-rules'],
      11:['locant-rules'],
      13:['group-priority','locant-rules'],
      17:['locant-rules'],
      18:['parent-chain','group-priority'] } },

    'radical-halogenation': { n:14, steps:{
      3:['radical-chain'],
      5:['radical-stability'],
      7:['radical-stability','hammond-postulate'],
      9:['radical-stability'],
      12:['radical-chain','allylic-capture'],
      13:['radical-chain','radical-stability'] } },

    'skeletal-structures': { n:8, steps:{
      2:['skeletal-notation'],
      3:['implicit-hydrogens','skeletal-notation'],
      4:['skeletal-notation'],
      6:['implicit-hydrogens','skeletal-notation'],
      7:['implicit-hydrogens','skeletal-notation'] } },

    'acidity-factors': { n:11, steps:{
      4:['acidity-factors'],
      5:['acidity-factors','electronegativity-trend'],
      6:['resonance-delocalization','acidity-factors'],
      9:['acidity-factors','pka-scale'],
      10:['resonance-delocalization','acidity-factors'] } },

    'acyl-substitution': { n:8, steps:{
      1:['tetrahedral-intermediate'],
      2:['tetrahedral-intermediate','leaving-group-ability'],
      4:['leaving-group-ability','tetrahedral-intermediate'],
      6:['leaving-group-ability','acyl-reactivity-order'],
      7:['acyl-reactivity-order','leaving-group-ability'] } },

    'addition-reactions': { n:8, steps:{
      1:['alkene-pi-nucleophile'],
      2:['alkene-pi-nucleophile','electrophile-recognition'],
      4:['addition-stereochem','stereochemical-outcome'],
      7:['addition-stereochem','stereochemical-outcome'] } },

    'alcohol-reactions': { n:8, steps:{
      1:['alcohol-activation'],
      2:['alcohol-activation','leaving-group-ability'],
      4:['alcohol-activation','leaving-group-ability'],
      6:['alcohol-activation'],
      7:['alcohol-activation'] } },

    'aldehydes-ketones': { n:8, steps:{
      1:['carbonyl-electrophilicity'],
      2:['carbonyl-electrophilicity','electrophile-recognition'],
      5:['carbonyl-electrophilicity','steric-hindrance'],
      6:['carbonyl-electrophilicity','steric-hindrance'],
      7:['carbonyl-electrophilicity','steric-hindrance'] } },

    'aldol': { n:13, steps:{
      2:['enolate-formation'],
      3:['aldol-connectivity'],
      6:['aldol-connectivity'],
      10:['aldol-connectivity','enolate-formation'],
      11:['aldol-connectivity','enolate-formation'],
      12:['aldol-connectivity','enolate-formation'] } },

    'alkene-structure': { n:8, steps:{
      1:['alkene-pi-nucleophile'],
      2:['hybridization-assignment','alkene-pi-nucleophile'],
      3:['degrees-of-unsaturation'],
      5:['alkene-stability-ranking'],
      7:['alkene-stability-ranking'] } },

    'alkynes': { n:9, steps:{
      1:['alkyne-acidity'],
      2:['alkyne-acidity','hybridization-assignment'],
      3:['alkyne-acidity','acidity-factors'],
      6:['addition-stereochem'],
      7:['alkyne-acidity','curved-arrow-direction','acetylide-alkylation'],
      8:['markovnikov-regiochem','keto-enol-tautomerism'] } },

    'alpha-hydrogens': { n:14, steps:{
      2:['resonance-delocalization','alpha-acidity'],
      3:['alpha-acidity','resonance-delocalization'],
      5:['alpha-acidity'],
      7:['keto-enol-tautomerism','resonance-delocalization'],
      10:['enolate-formation','alpha-acidity'],
      12:['keto-enol-tautomerism'],
      13:['alpha-acidity','resonance-delocalization'] } },

    'amine-reactions': { n:8, steps:{
      1:['nucleophile-recognition'],
      2:['amine-basicity','acylation-self-termination'],
      4:['acylation-self-termination','nucleophile-recognition'],
      6:['nucleophile-recognition'],
      7:['acylation-self-termination','nucleophile-recognition'] } },

    'amine-structure': { n:8, steps:{
      1:['amine-basicity'],
      2:['amine-basicity'],
      4:['amine-basicity'],
      6:['amine-basicity'],
      7:['amine-basicity','pka-scale'] } },

    'aromaticity': { n:8, steps:{
      1:['huckel-aromaticity'],
      2:['huckel-aromaticity'],
      4:['huckel-aromaticity','resonance-delocalization'],
      6:['huckel-aromaticity'],
      7:['huckel-aromaticity'] } },

    'atomic-structure': { n:15, steps:{
      3:['valence-electrons'],
      4:['valence-electrons'],
      5:['valence-electrons'],
      7:['valence-electrons'],
      12:['valence-electrons'],
      14:['valence-electrons'] } },

    'axial-equatorial': { n:7, steps:{
      1:['chair-axial-equatorial'],
      2:['chair-axial-equatorial','steric-hindrance'],
      3:['chair-axial-equatorial','steric-hindrance'],
      6:['chair-axial-equatorial','steric-hindrance'] } },

    /* Step 3 sorts six condensed formulas into ester/ether/amide/ketone, 5 is
       the tert-butylamine degree trap, 6 is "which one contains an amide", 9
       reads aspirin, 10 reads acetaminophen. */
    'functional-groups': { n:11, steps:{
      3:['carbonyl-family-distinction','functional-group-recognition'],
      5:['functional-group-recognition'],
      6:['carbonyl-family-distinction','functional-group-recognition'],
      9:['carbonyl-family-distinction','functional-group-recognition'],
      10:['functional-group-recognition','carbonyl-family-distinction'] } },

    'bond-polarity': { n:14, steps:{
      1:['bond-polarity-dipoles','electronegativity-trend'],
      3:['bond-polarity-dipoles','molecular-geometry-vsepr'],
      6:['bond-polarity-dipoles','molecular-geometry-vsepr'],
      10:['bond-polarity-dipoles'],
      12:['bond-polarity-dipoles'],
      13:['bond-polarity-dipoles','molecular-geometry-vsepr'] } },

    'bonding': { n:12, steps:{
      4:['sigma-pi-bonding'],
      6:['sigma-pi-bonding','valence-electrons'],
      7:['sigma-pi-bonding','lewis-structures-drawing'],
      9:['sigma-pi-bonding'],
      11:['sigma-pi-bonding','valence-electrons'] } },

    'bronsted': { n:8, steps:{
      1:['bronsted-identification'],
      2:['bronsted-identification'],
      3:['conjugate-pairs'],
      6:['bronsted-identification','curved-arrow-direction'],
      7:['bronsted-identification','conjugate-pairs'] } },

    'c-nmr': { n:7, steps:{
      1:['nmr-shift-shielding'],
      2:['nmr-shift-shielding'],
      4:['nmr-shift-shielding','nmr-splitting-integration'],
      6:['nmr-splitting-integration','nmr-shift-shielding'] } },

    'carboxylic-acids': { n:8, steps:{
      1:['resonance-delocalization','acidity-factors'],
      2:['resonance-delocalization','acidity-factors'],
      3:['acidity-factors'],
      5:['acyl-reactivity-order'],
      7:['acidity-factors'] } },

    'chirality': { n:11, steps:{
      1:['chirality-recognition'],
      2:['chirality-recognition'],
      4:['chirality-recognition','meso-detection'],
      7:['chirality-recognition'],
      10:['chirality-recognition','meso-detection'] } },

    'claisen': { n:11, steps:{
      2:['claisen-connectivity'],
      3:['claisen-connectivity','tetrahedral-intermediate'],
      5:['alpha-acidity','claisen-connectivity'],
      7:['alpha-acidity','claisen-connectivity'],
      8:['claisen-connectivity','enolate-formation'],
      10:['claisen-connectivity'] } },

    'conformational-analysis': { n:7, steps:{
      1:['chair-axial-equatorial'],
      2:['chair-axial-equatorial'],
      3:['chair-axial-equatorial','ring-flip-mechanics'],
      6:['chair-axial-equatorial','ring-flip-mechanics'] } },

    'conjugate': { n:7, steps:{
      1:['conjugate-pairs'],
      2:['conjugate-pairs','pka-scale'],
      3:['conjugate-pairs','pka-scale'],
      6:['conjugate-pairs','pka-scale'] } },

    'curved-arrows': { n:9, steps:{
      1:['curved-arrow-direction'],
      2:['curved-arrow-direction','resonance-validity'],
      3:['curved-arrow-direction','formal-charge-calc'],
      6:['curved-arrow-direction','carbonyl-electrophilicity'],
      7:['curved-arrow-direction'],
      8:['curved-arrow-direction','resonance-validity'] } },

    'cyclohexanes': { n:7, steps:{
      1:['chair-axial-equatorial'],
      2:['torsional-strain'],
      3:['chair-axial-equatorial','torsional-strain'],
      6:['torsional-strain','chair-axial-equatorial'] } },

    'diastereomers': { n:11, steps:{
      2:['enantiomer-vs-diastereomer','stereocenter-identification'],
      3:['enantiomer-vs-diastereomer','stereocenter-identification'],
      5:['enantiomer-vs-diastereomer'],
      8:['enantiomer-vs-diastereomer'],
      10:['enantiomer-vs-diastereomer'] } },

    'directing-effects': { n:8, steps:{
      1:['directing-effects'],
      2:['directing-effects','resonance-delocalization'],
      4:['directing-effects','electron-rich-poor'],
      6:['directing-effects','resonance-delocalization'],
      7:['directing-effects'] } },

    'eas': { n:8, steps:{
      1:['eas-mechanism'],
      2:['eas-mechanism','huckel-aromaticity'],
      4:['lewis-acid-base','eas-mechanism'],
      6:['eas-mechanism','carbocation-stability'],
      7:['eas-mechanism','carbocation-stability'] } },

    'electron-rich-poor': { n:11, steps:{
      2:['electron-rich-poor'],
      3:['electron-rich-poor','nucleophile-recognition'],
      5:['electron-rich-poor','electrophile-recognition','leaving-group-ability'],
      8:['electron-rich-poor','electrophile-recognition','resonance-delocalization'],
      10:['electron-rich-poor','electrophile-recognition'] } },

    'electronegativity': { n:14, steps:{
      2:['electronegativity-trend'],
      3:['electronegativity-trend'],
      4:['electronegativity-trend','bond-polarity-dipoles'],
      8:['electronegativity-trend','bond-polarity-dipoles'],
      11:['electronegativity-trend'],
      13:['electronegativity-trend','bond-polarity-dipoles'] } },

    'electrophiles': { n:9, steps:{
      1:['electrophile-recognition'],
      2:['electrophile-recognition','electronegativity-trend'],
      3:['electrophile-recognition','electronegativity-trend'],
      6:['electrophile-recognition','electronegativity-trend'],
      8:['lewis-acid-base','electrophile-recognition'] } },

    'enantiomers': { n:12, steps:{
      2:['enantiomer-vs-diastereomer'],
      3:['enantiomer-vs-diastereomer'],
      4:['enantiomer-vs-diastereomer','rs-assignment'],
      8:['enantiomer-vs-diastereomer'],
      11:['enantiomer-vs-diastereomer'] } },

    'epoxides': { n:9, steps:{
      1:['epoxide-opening-regiochem'],
      2:['epoxide-opening-regiochem','backside-attack'],
      4:['epoxide-opening-regiochem'],
      5:['epoxide-opening-regiochem'],
      7:['epoxide-opening-regiochem','curved-arrow-direction'],
      8:['epoxide-opening-regiochem','backside-attack'] } },

    'esters-amides': { n:10, steps:{
      1:['acyl-reactivity-order','leaving-group-ability'],
      3:['acyl-reactivity-order','amide-resonance','leaving-group-ability'],
      5:['acyl-reactivity-order','tetrahedral-intermediate'],
      7:['leaving-group-ability','reductant-scope'],
      9:['activation-before-acylation','acyl-reactivity-order'] } },

    'ether-chemistry': { n:7, steps:{
      1:['alcohol-activation'],
      2:['backside-attack','alcohol-activation'],
      3:['backside-attack'],
      6:['backside-attack'] } },

    /* Step 5 is the R/S-from-a-Fischer-projection drill, which grades
       three times — reading the projection is a different skill from
       assigning a configuration from one, and only the first was
       practised here before. */
    'fischer': { n:15, steps:{
      1:['fischer-reading'],
      2:['fischer-reading'],
      5:['fischer-reading','rs-assignment','cip-priority'],
      9:['fischer-reading','enantiomer-vs-diastereomer'],
      12:['fischer-reading'],
      14:['fischer-reading','enantiomer-vs-diastereomer'] } },

    'prochirality': { n:12, steps:{
      2:['topicity-test'],
      5:['topicity-test','enantiomer-vs-diastereomer'],
      6:['topicity-test'],
      8:['topicity-test'],
      11:['topicity-test','prochiral-faces'] } },

    'h-nmr': { n:8, steps:{
      1:['nmr-splitting-integration'],
      2:['nmr-splitting-integration'],
      4:['nmr-splitting-integration'],
      6:['nmr-splitting-integration'],
      7:['nmr-shift-shielding','huckel-aromaticity'] } },

    'hybridization': { n:13, steps:{
      5:['hybridization-assignment'],
      6:['hybridization-assignment'],
      7:['hybridization-assignment'],
      9:['hybridization-assignment'],
      12:['hybridization-assignment','molecular-geometry-vsepr'] } },

    'ir': { n:8, steps:{
      1:['ir-functional-groups'],
      2:['ir-functional-groups'],
      4:['ir-functional-groups'],
      6:['ir-functional-groups'],
      7:['ir-functional-groups'] } },

    'energy-diagrams': { n:14, steps:{
      2:['energy-diagram-reading'],
      4:['energy-diagram-reading'],
      6:['energy-diagram-reading'],
      8:['energy-diagram-reading'],
      11:['hammond-postulate'],
      13:['hammond-postulate','energy-diagram-reading'] } },
    'carbocations': { n:14, steps:{
      3:['carbocation-stability','formal-charge-calc'],
      5:['carbocation-stability'],
      9:['carbocation-stability','resonance-delocalization'],
      11:['carbocation-rearrangement'],
      13:['carbocation-rearrangement','carbocation-stability'] } },

    'leaving-groups': { n:15, steps:{
      4:['leaving-group-ability'],
      5:['leaving-group-ability','pka-scale'],
      6:['leaving-group-ability','pka-scale'],
      11:['alcohol-activation','leaving-group-ability'],
      14:['leaving-group-ability'] } },

    'lewis-acids': { n:7, steps:{
      1:['lewis-acid-base'], 2:['lewis-acid-base'],
      3:['lewis-acid-base'], 6:['lewis-acid-base'] } },

    'lewis-structures': { n:16, steps:{
      1:['lewis-structures-drawing','valence-electrons'],
      3:['formal-charge-calc','lewis-structures-drawing'],
      5:['valence-electrons','lewis-structures-drawing'],
      7:['formal-charge-calc','lewis-structures-drawing'],
      13:['lewis-structures-drawing'],
      15:['lewis-structures-drawing'] } },

    'markovnikov': { n:8, steps:{
      1:['markovnikov-regiochem'],
      2:['markovnikov-regiochem','carbocation-stability'],
      4:['carbocation-rearrangement','markovnikov-regiochem'],
      7:['markovnikov-regiochem'] } },

    'mass-spec': { n:8, steps:{
      1:['ms-fragmentation'],
      2:['ms-fragmentation','carbocation-stability'],
      4:['ms-fragmentation'],
      6:['ms-fragmentation','carbocation-stability'],
      7:['ms-fragmentation'] } },

    'meso': { n:10, steps:{
      1:['meso-detection'],
      2:['meso-detection','enantiomer-vs-diastereomer'],
      5:['meso-detection','chirality-recognition'],
      7:['meso-detection','chirality-recognition'],
      9:['meso-detection'] } },

    'molecular-geometry': { n:11, steps:{
      1:['molecular-geometry-vsepr','lewis-structures-drawing'],
      3:['molecular-geometry-vsepr','lewis-structures-drawing'],
      4:['molecular-geometry-vsepr','lewis-structures-drawing'],
      6:['molecular-geometry-vsepr','hybridization-assignment'],
      8:['molecular-geometry-vsepr'],
      10:['molecular-geometry-vsepr','hybridization-assignment'] } },

    'newman': { n:7, steps:{
      1:['newman-reading'],
      2:['torsional-strain','newman-reading'],
      3:['torsional-strain','newman-reading'],
      6:['newman-reading','torsional-strain'] } },

    'nucleophiles': { n:11, steps:{
      2:['nucleophile-recognition'],
      4:['nucleophile-recognition','electron-rich-poor'],
      7:['solvent-effects','basicity-vs-nucleophilicity'],
      9:['basicity-vs-nucleophilicity','steric-hindrance'],
      10:['nucleophile-recognition','solvent-effects'] } },

    'nucleophilic-addition': { n:11, steps:{
      1:['tetrahedral-intermediate','carbonyl-electrophilicity'],
      3:['carbonyl-electrophilicity'],
      5:['tetrahedral-intermediate','carbonyl-electrophilicity'],
      7:['tetrahedral-intermediate','nucleophile-recognition'],
      9:['tetrahedral-intermediate'],
      10:['tetrahedral-intermediate','nucleophile-recognition'] } },

    'orbitals': { n:16, steps:{
      11:['valence-electrons'],
      12:['valence-electrons'],
      13:['valence-electrons'],
      15:['valence-electrons'] } },

    'pka': { n:7, steps:{
      1:['pka-scale'], 2:['pka-scale'], 3:['pka-scale'],
      6:['pka-scale','conjugate-pairs'] } },

    'resonance': { n:9, steps:{
      2:['resonance-delocalization','resonance-validity'],
      3:['resonance-validity'],
      4:['resonance-delocalization'],
      5:['resonance-validity'],
      6:['resonance-delocalization','resonance-validity'],
      8:['resonance-validity','resonance-delocalization'] } },

    'ring-flips': { n:7, steps:{
      1:['ring-flip-mechanics'], 2:['ring-flip-mechanics'],
      3:['ring-flip-mechanics'],
      6:['ring-flip-mechanics','chair-axial-equatorial'] } },

    /* Steps 6 and 7 are the two wedge-dash assignment drills, each of
       which grades three times (rank, toward/away, R or S) — so this
       topic now records far more evidence per run than the four
       questions it used to, and all of it against the two concepts the
       topic is actually about. */
    'rs-configuration': { n:12, steps:{
      2:['cip-priority'],
      3:['cip-priority'],
      5:['cip-priority'],
      7:['rs-assignment','cip-priority'],
      8:['rs-assignment','cip-priority'],
      11:['rs-assignment','cip-priority'] } },

    'cis-trans-ez': { n:15, steps:{
      3:['ring-cis-trans'],
      5:['ez-assignment'],
      7:['ez-assignment','cip-priority'],
      9:['ez-assignment','cip-priority'],
      14:['ez-assignment','cip-priority'] } },

    'stereocenters': { n:10, steps:{
      2:['stereocenter-identification'],
      4:['stereocenter-identification'],
      7:['stereocenter-identification'],
      9:['stereocenter-identification'] } },

    'substrate-effects': { n:10, steps:{
      2:['mechanism-selection'],
      3:['mechanism-selection','solvent-effects'],
      4:['mechanism-selection','solvent-effects'],
      5:['substrate-class','mechanism-selection'],
      8:['mechanism-selection','stereochemical-outcome'],
      9:['mechanism-selection','zaitsev-hofmann'] } }
  };

  /* Returns { stepIndex: [conceptId, ...] } for a lesson, or null.

     `stepCount` is the lesson's actual steps.length. If it no longer matches
     what the map was authored against, the lesson has been edited since and
     every index below may now point at a different step — so return null and
     let the engine fall back to inference. A slightly vague concept is
     recoverable; confidently crediting the wrong one is not. */
  function forTopic(topicId, stepCount){
    var e = MAP[topicId];
    if(!e) return null;
    if(stepCount !== undefined && stepCount !== e.n) return null;
    return e.steps;
  }

  window.OchemLessonConcepts = { MAP: MAP, forTopic: forTopic };
})();
