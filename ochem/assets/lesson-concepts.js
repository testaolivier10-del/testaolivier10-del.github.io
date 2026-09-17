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
    'acetals': { n:8, steps:{
      1:['acetal-formation'],
      2:['acetal-formation'],
      4:['acetal-formation','carbonyl-electrophilicity'],
      6:['acetal-formation'],
      7:['acetal-formation','carbonyl-electrophilicity'] } },

    /* Step 2 is the hydration sorter: sterics and electronics read off five
       structures, which is the equilibrium concept alone. 3 and 4 are the
       Jones/PCC payoff, so oxidizability joins it. 6 is the one-carbon
       extension, and 7 is the case where the two causes disagree. */
    /* Step 2 sorts six nucleophiles against one acid chloride, 3 is the
       two-equivalent trap, 4 the leaving-group ranking, 6 the activate-then-
       acylate order, 7 the deprotonation that turns nothing into a reaction. */
    /* Step 2 sorts six condition sets, 3 is why acid stops, 4 the iodoform
       scope, 6 the monohalogenation choice, 7 the methyl-versus-alpha trap. */
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

    'alpha-halogenation': { n:8, steps:{
      2:['alpha-halogenation-control','enolate-formation'],
      3:['alpha-halogenation-control','alpha-acidity'],
      4:['alpha-halogenation-control'],
      6:['alpha-halogenation-control'],
      7:['alpha-halogenation-control','acyl-reactivity-order'] } },

    /* Step 2 sorts six condition sets including two LDA rows that are not
       kinetic. 3 is which alpha carbon, 4 why a weak base wins on stability,
       6 the SN2 limit on the halide, 7 the inverse-addition trap. */
    'enolate-regiochemistry': { n:8, steps:{
      2:['enolate-regiocontrol','enolate-formation'],
      3:['enolate-regiocontrol','alpha-acidity'],
      4:['enolate-regiocontrol'],
      6:['enolate-regiocontrol','mechanism-selection'],
      7:['enolate-regiocontrol'] } },

    'acyl-chlorides-anhydrides': { n:8, steps:{
      2:['activation-before-acylation','acyl-reactivity-order'],
      3:['activation-before-acylation'],
      4:['acyl-reactivity-order','leaving-group-ability'],
      6:['activation-before-acylation'],
      7:['activation-before-acylation','acyl-reactivity-order'] } },

    /* Step 2 is the product sorter and carries the carbon counting with it.
       3 is why a Grignard adds once, 4 is a pure carbon count, 6 the route
       chosen on the substrate rather than the target, 7 the DIBAL trap. */
    'nitriles': { n:8, steps:{
      2:['nitrile-as-acyl-level'],
      3:['nitrile-as-acyl-level','tetrahedral-intermediate'],
      4:['nitrile-as-acyl-level','oxidation-level'],
      6:['nitrile-as-acyl-level'],
      7:['nitrile-as-acyl-level'] } },

    'hydrates-cyanohydrins': { n:8, steps:{
      2:['addition-equilibrium'],
      3:['addition-equilibrium','aldehyde-oxidizability'],
      4:['addition-equilibrium','aldehyde-oxidizability'],
      6:['addition-equilibrium','tetrahedral-intermediate'],
      7:['addition-equilibrium','carbonyl-electrophilicity'] } },

    /* Step 2 sorts five test results, 3 is why a weak oxidant is the right
       tool for a test, 4 is the hemiacetal opening, 6 the reagent choice
       under two constraints, 7 the IR-against-chemical-test contradiction. */
    'aldehyde-oxidation': { n:8, steps:{
      2:['aldehyde-oxidizability'],
      3:['aldehyde-oxidizability'],
      4:['aldehyde-oxidizability','addition-equilibrium'],
      6:['aldehyde-oxidizability','oxidation-level'],
      7:['aldehyde-oxidizability','addition-equilibrium'] } },

    /* Step 2 is the hands-on "find every carbon", which is the skeleton-reading
       concept alone. 3 and 6 are hydrogen counts, so implicit-hydrogens leads.
       4 is the C–H versus O–H asymmetry, which is a notation rule rather than
       a counting one. 7 is the five-bond slip, where both are involved. */
    /* Step 2 is the sorter (chain mechanism alone). 3 is radical stability, 4
       is the bromine-versus-chlorine selectivity that follows from it. 6 is
       NBS, which is a competition/concentration argument resting on the chain.
       7 is anti-Markovnikov HBr — the chain logic applied somewhere new. */
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
      2:['route-order'], 3:['route-order'], 4:['route-order'],
      6:['route-order'], 7:['route-order','fgi-map'] } },

    'multistep-synthesis': { n:8, steps:{
      2:['route-order'], 3:['route-order'], 4:['route-order'],
      6:['route-order'], 7:['route-order','cc-bond-toolkit'] } },

    'carbohydrates': { n:8, steps:{
      2:['sugar-ring'], 3:['sugar-ring'], 4:['sugar-ring'],
      6:['sugar-ring'], 7:['sugar-ring'] } },

    'amino-acids': { n:8, steps:{
      2:['zwitterion'], 3:['zwitterion'], 4:['zwitterion'],
      6:['zwitterion'], 7:['zwitterion'] } },

    'peptides-proteins': { n:8, steps:{
      2:['peptide-bond'], 3:['peptide-bond'], 4:['peptide-bond'],
      6:['peptide-bond'], 7:['peptide-bond'] } },

    'lipids': { n:8, steps:{
      2:['lipid-ester'], 3:['lipid-ester'], 4:['lipid-ester'],
      6:['lipid-ester'], 7:['lipid-ester'] } },

    'nucleic-acids': { n:8, steps:{
      2:['nucleotide-assembly'], 3:['nucleotide-assembly'], 4:['nucleotide-assembly'],
      6:['nucleotide-assembly','sugar-ring'], 7:['nucleotide-assembly'] } },

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

    'wittig-reaction': { n:8, steps:{
      2:['alkene-by-construction'], 3:['alkene-by-construction'], 4:['alkene-by-construction'],
      6:['alkene-by-construction'], 7:['alkene-by-construction'] } },

    'imines-enamines': { n:8, steps:{
      2:['amine-condensation'], 3:['amine-condensation'], 4:['amine-condensation'],
      6:['enamine-nucleophile'], 7:['enamine-nucleophile','amine-condensation'] } },

    'michael-robinson': { n:8, steps:{
      2:['product-spacing'], 3:['product-spacing'], 4:['product-spacing'],
      6:['product-spacing'], 7:['product-spacing'] } },

    'ester-syntheses': { n:8, steps:{
      2:['activating-group'], 3:['activating-group'], 4:['activating-group'],
      6:['activating-group'], 7:['activating-group'] } },

    'baeyer-villiger': { n:8, steps:{
      2:['migratory-aptitude'], 3:['migratory-aptitude'], 4:['migratory-aptitude'],
      6:['migratory-aptitude'], 7:['migratory-aptitude'] } },

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
      2:['redox-stereochemistry','oxidant-choice'],
      3:['oxidant-choice'],
      4:['oxidant-choice'],
      6:['oxidant-choice'],
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

    'naming-parent-chain': { n:8, steps:{
      2:['parent-chain'],
      3:['parent-chain'],
      4:['locant-rules'],
      6:['parent-chain','locant-rules'],
      7:['parent-chain'] } },

    'naming-substituents': { n:8, steps:{
      2:['alphabetization'],
      3:['locant-rules','alphabetization'],
      4:['alphabetization'],
      6:['locant-rules'],
      7:['locant-rules','alphabetization'] } },

    'naming-functional-groups': { n:8, steps:{
      2:['group-priority'],
      3:['group-priority','locant-rules'],
      4:['group-priority','parent-chain'],
      6:['group-priority','alphabetization'],
      7:['group-priority'] } },

    'naming-rings-unsaturation': { n:8, steps:{
      2:['locant-rules','parent-chain'],
      3:['locant-rules'],
      4:['group-priority','locant-rules'],
      6:['locant-rules'],
      7:['parent-chain','group-priority'] } },

    'radical-halogenation': { n:8, steps:{
      2:['radical-chain'],
      3:['radical-stability'],
      4:['radical-stability','radical-chain'],
      6:['radical-chain','radical-stability'],
      7:['radical-chain','radical-stability'] } },

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
      4:['carbonyl-electrophilicity','steric-hindrance'],
      6:['carbonyl-electrophilicity','steric-hindrance'],
      7:['carbonyl-electrophilicity','steric-hindrance'] } },

    'aldol': { n:8, steps:{
      1:['enolate-formation'],
      2:['aldol-connectivity'],
      4:['aldol-connectivity'],
      6:['aldol-connectivity','enolate-formation'],
      7:['aldol-connectivity','enolate-formation'] } },

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

    'alpha-hydrogens': { n:8, steps:{
      1:['alpha-acidity'],
      2:['alpha-acidity','resonance-delocalization'],
      4:['resonance-delocalization','alpha-acidity'],
      6:['enolate-formation','alpha-acidity'],
      7:['alpha-acidity','resonance-delocalization'] } },

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

    'atomic-structure': { n:9, steps:{
      3:['valence-electrons'], 4:['valence-electrons'],
      5:['valence-electrons'], 8:['valence-electrons'] } },

    'axial-equatorial': { n:7, steps:{
      1:['chair-axial-equatorial'],
      2:['chair-axial-equatorial','steric-hindrance'],
      3:['chair-axial-equatorial','steric-hindrance'],
      6:['chair-axial-equatorial','steric-hindrance'] } },

    /* Step 2 sorts six condensed formulas into ester/ether/amide/ketone, 3 is
       the tert-butylamine degree trap, 4 is "which one contains an amide", 6
       reads aspirin, 7 reads acetaminophen. */
    'functional-groups': { n:8, steps:{
      2:['carbonyl-family-distinction','functional-group-recognition'],
      3:['functional-group-recognition'],
      4:['carbonyl-family-distinction','functional-group-recognition'],
      6:['carbonyl-family-distinction','functional-group-recognition'],
      7:['functional-group-recognition','carbonyl-family-distinction'] } },

    'bond-polarity': { n:9, steps:{
      1:['bond-polarity-dipoles'],
      2:['bond-polarity-dipoles','molecular-geometry-vsepr'],
      3:['bond-polarity-dipoles','molecular-geometry-vsepr'],
      6:['bond-polarity-dipoles'],
      8:['bond-polarity-dipoles','molecular-geometry-vsepr'] } },

    'bonding': { n:7, steps:{
      1:['sigma-pi-bonding','valence-electrons'],
      2:['sigma-pi-bonding','lewis-structures-drawing'],
      3:['sigma-pi-bonding'],
      6:['sigma-pi-bonding','valence-electrons'] } },

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
      1:['acidity-factors'],
      2:['resonance-delocalization','acidity-factors'],
      3:['acidity-factors'],
      5:['acyl-reactivity-order'],
      7:['acidity-factors'] } },

    'chirality': { n:7, steps:{
      1:['chirality-recognition'],
      2:['chirality-recognition'],
      3:['chirality-recognition','meso-detection'],
      6:['chirality-recognition','meso-detection'] } },

    'claisen': { n:8, steps:{
      1:['claisen-connectivity'],
      2:['claisen-connectivity','tetrahedral-intermediate'],
      4:['alpha-acidity','claisen-connectivity'],
      6:['claisen-connectivity','enolate-formation'],
      7:['claisen-connectivity'] } },

    'conformational-analysis': { n:7, steps:{
      1:['chair-axial-equatorial'],
      2:['chair-axial-equatorial'],
      3:['chair-axial-equatorial','ring-flip-mechanics'],
      6:['anti-periplanar-geometry','ring-flip-mechanics'] } },

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

    'diastereomers': { n:7, steps:{
      1:['enantiomer-vs-diastereomer','stereocenter-identification'],
      2:['enantiomer-vs-diastereomer','stereocenter-identification'],
      3:['enantiomer-vs-diastereomer'],
      6:['enantiomer-vs-diastereomer'] } },

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

    'electron-rich-poor': { n:7, steps:{
      1:['electron-rich-poor'],
      2:['electron-rich-poor','nucleophile-recognition'],
      4:['electron-rich-poor','electrophile-recognition'],
      6:['electron-rich-poor','electrophile-recognition'] } },

    'electronegativity': { n:9, steps:{
      2:['electronegativity-trend'],
      3:['electronegativity-trend'],
      4:['electronegativity-trend','bond-polarity-dipoles'],
      6:['electronegativity-trend'],
      8:['electronegativity-trend','bond-polarity-dipoles'] } },

    'electrophiles': { n:7, steps:{
      1:['electrophile-recognition'],
      2:['electrophile-recognition','electronegativity-trend'],
      3:['electrophile-recognition','electronegativity-trend'],
      6:['lewis-acid-base','electrophile-recognition'] } },

    'enantiomers': { n:7, steps:{
      1:['enantiomer-vs-diastereomer'],
      2:['enantiomer-vs-diastereomer'],
      3:['enantiomer-vs-diastereomer','rs-assignment'],
      6:['enantiomer-vs-diastereomer'] } },

    'epoxides': { n:9, steps:{
      1:['epoxide-opening-regiochem'],
      2:['epoxide-opening-regiochem','backside-attack'],
      4:['epoxide-opening-regiochem'],
      5:['epoxide-opening-regiochem'],
      7:['epoxide-opening-regiochem','curved-arrow-direction'],
      8:['epoxide-opening-regiochem','backside-attack'] } },

    'esters-amides': { n:8, steps:{
      1:['acyl-reactivity-order'],
      2:['acyl-reactivity-order','leaving-group-ability','amide-resonance'],
      4:['acyl-reactivity-order','tetrahedral-intermediate'],
      6:['acyl-reactivity-order','leaving-group-ability'],
      7:['acyl-reactivity-order'] } },

    'ether-chemistry': { n:7, steps:{
      1:['alcohol-activation'],
      2:['backside-attack','alcohol-activation'],
      3:['backside-attack'],
      6:['backside-attack'] } },

    /* Step 5 is the R/S-from-a-Fischer-projection drill, which grades
       three times — reading the projection is a different skill from
       assigning a configuration from one, and only the first was
       practised here before. */
    'fischer': { n:8, steps:{
      1:['fischer-reading'],
      2:['fischer-reading'],
      3:['fischer-reading','enantiomer-vs-diastereomer'],
      5:['fischer-reading','rs-assignment','cip-priority'],
      7:['fischer-reading','enantiomer-vs-diastereomer'] } },

    'h-nmr': { n:8, steps:{
      1:['nmr-splitting-integration'],
      2:['nmr-splitting-integration'],
      4:['nmr-splitting-integration'],
      6:['nmr-splitting-integration'],
      7:['nmr-shift-shielding','huckel-aromaticity'] } },

    'hybridization': { n:9, steps:{
      3:['hybridization-assignment'],
      4:['hybridization-assignment'],
      5:['hybridization-assignment'],
      8:['hybridization-assignment','molecular-geometry-vsepr'] } },

    'ir': { n:8, steps:{
      1:['ir-functional-groups'],
      2:['ir-functional-groups'],
      4:['ir-functional-groups'],
      6:['ir-functional-groups'],
      7:['ir-functional-groups'] } },

    'leaving-groups': { n:9, steps:{
      3:['leaving-group-ability'],
      4:['leaving-group-ability','pka-scale'],
      5:['leaving-group-ability','pka-scale'],
      8:['leaving-group-ability'] } },

    'lewis-acids': { n:7, steps:{
      1:['lewis-acid-base'], 2:['lewis-acid-base'],
      3:['lewis-acid-base'], 6:['lewis-acid-base'] } },

    'lewis-structures': { n:7, steps:{
      1:['lewis-structures-drawing'],
      2:['valence-electrons','lewis-structures-drawing'],
      3:['formal-charge-calc','lewis-structures-drawing'],
      6:['lewis-structures-drawing'] } },

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

    'meso': { n:7, steps:{
      1:['meso-detection'],
      2:['meso-detection','chirality-recognition'],
      3:['meso-detection','enantiomer-vs-diastereomer'],
      6:['meso-detection'] } },

    'molecular-geometry': { n:9, steps:{
      1:['molecular-geometry-vsepr'],
      2:['molecular-geometry-vsepr','lewis-structures-drawing'],
      3:['molecular-geometry-vsepr','lewis-structures-drawing'],
      5:['molecular-geometry-vsepr'],
      8:['molecular-geometry-vsepr','hybridization-assignment'] } },

    'newman': { n:7, steps:{
      1:['newman-reading'],
      2:['torsional-strain','newman-reading'],
      3:['torsional-strain','newman-reading'],
      6:['newman-reading','torsional-strain'] } },

    'nucleophiles': { n:8, steps:{
      1:['nucleophile-recognition'],
      2:['nucleophile-recognition','electron-rich-poor'],
      4:['solvent-effects','basicity-vs-nucleophilicity'],
      7:['nucleophile-recognition','electron-rich-poor'] } },

    'nucleophilic-addition': { n:8, steps:{
      1:['carbonyl-electrophilicity'],
      2:['tetrahedral-intermediate','carbonyl-electrophilicity'],
      4:['tetrahedral-intermediate','nucleophile-recognition'],
      6:['tetrahedral-intermediate'],
      7:['tetrahedral-intermediate','nucleophile-recognition'] } },

    'orbitals': { n:8, steps:{
      3:['valence-electrons'], 4:['valence-electrons'],
      5:['valence-electrons'], 7:['valence-electrons','hybridization-assignment'] } },

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
    'rs-configuration': { n:10, steps:{
      2:['cip-priority'],
      3:['cip-priority'],
      4:['cip-priority'],
      6:['rs-assignment','cip-priority'],
      7:['rs-assignment','cip-priority'],
      9:['rs-assignment','cip-priority'] } },

    'stereocenters': { n:7, steps:{
      1:['stereocenter-identification'], 2:['stereocenter-identification'],
      3:['stereocenter-identification'], 6:['stereocenter-identification'] } },

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
