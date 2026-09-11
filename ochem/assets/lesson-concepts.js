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

    'acidity-factors': { n:8, steps:{
      2:['acidity-factors'],
      3:['acidity-factors','electronegativity-trend'],
      4:['resonance-delocalization','acidity-factors'],
      7:['resonance-delocalization','acidity-factors'] } },

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
      3:['hybridization-assignment'],
      5:['alkene-pi-nucleophile'],
      7:['alkene-pi-nucleophile'] } },

    'alkynes': { n:8, steps:{
      1:['alkyne-acidity'],
      2:['alkyne-acidity','hybridization-assignment'],
      3:['alkyne-acidity','acidity-factors'],
      6:['addition-stereochem'],
      7:['markovnikov-regiochem'] } },

    'alpha-hydrogens': { n:8, steps:{
      1:['alpha-acidity'],
      2:['alpha-acidity','resonance-delocalization'],
      4:['resonance-delocalization','alpha-acidity'],
      6:['enolate-formation','alpha-acidity'],
      7:['alpha-acidity','resonance-delocalization'] } },

    'amine-reactions': { n:8, steps:{
      1:['nucleophile-recognition'],
      2:['amine-basicity','nucleophile-recognition'],
      4:['nucleophile-recognition'],
      6:['nucleophile-recognition'],
      7:['nucleophile-recognition'] } },

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

    'bond-polarity': { n:7, steps:{
      1:['bond-polarity-dipoles'],
      2:['bond-polarity-dipoles','molecular-geometry-vsepr'],
      3:['bond-polarity-dipoles','molecular-geometry-vsepr'],
      6:['bond-polarity-dipoles','molecular-geometry-vsepr'] } },

    'bonding': { n:7, steps:{
      1:['lewis-structures-drawing','valence-electrons'],
      2:['lewis-structures-drawing','valence-electrons'],
      3:['lewis-structures-drawing'],
      6:['lewis-structures-drawing','valence-electrons'] } },

    'bronsted': { n:7, steps:{
      1:['bronsted-identification'],
      2:['bronsted-identification'],
      3:['conjugate-pairs'],
      6:['bronsted-identification','conjugate-pairs'] } },

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

    'curved-arrows': { n:7, steps:{
      1:['curved-arrow-direction'],
      2:['curved-arrow-direction','resonance-validity'],
      3:['curved-arrow-direction','formal-charge-calc'],
      6:['curved-arrow-direction','resonance-validity'] } },

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

    'electronegativity': { n:7, steps:{
      2:['electronegativity-trend'],
      3:['electronegativity-trend'],
      4:['electronegativity-trend','bond-polarity-dipoles'],
      6:['electronegativity-trend','bond-polarity-dipoles'] } },

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

    'epoxides': { n:8, steps:{
      1:['epoxide-opening-regiochem'],
      2:['epoxide-opening-regiochem','backside-attack'],
      4:['epoxide-opening-regiochem'],
      5:['epoxide-opening-regiochem'],
      7:['epoxide-opening-regiochem','backside-attack'] } },

    'esters-amides': { n:8, steps:{
      1:['acyl-reactivity-order'],
      2:['acyl-reactivity-order','leaving-group-ability'],
      4:['acyl-reactivity-order','tetrahedral-intermediate'],
      6:['acyl-reactivity-order','leaving-group-ability'],
      7:['acyl-reactivity-order'] } },

    'ether-chemistry': { n:7, steps:{
      1:['alcohol-activation'],
      2:['backside-attack','alcohol-activation'],
      3:['backside-attack'],
      6:['backside-attack'] } },

    'fischer': { n:7, steps:{
      1:['fischer-reading'],
      2:['fischer-reading'],
      3:['fischer-reading','enantiomer-vs-diastereomer'],
      6:['fischer-reading','enantiomer-vs-diastereomer'] } },

    'h-nmr': { n:8, steps:{
      1:['nmr-splitting-integration'],
      2:['nmr-splitting-integration'],
      4:['nmr-splitting-integration'],
      6:['nmr-splitting-integration'],
      7:['nmr-shift-shielding','huckel-aromaticity'] } },

    'hybridization': { n:8, steps:{
      2:['hybridization-assignment'],
      3:['hybridization-assignment'],
      4:['hybridization-assignment'],
      7:['hybridization-assignment','molecular-geometry-vsepr'] } },

    'ir': { n:8, steps:{
      1:['ir-functional-groups'],
      2:['ir-functional-groups'],
      4:['ir-functional-groups'],
      6:['ir-functional-groups'],
      7:['ir-functional-groups'] } },

    'leaving-groups': { n:7, steps:{
      1:['leaving-group-ability'],
      2:['leaving-group-ability','pka-scale'],
      3:['leaving-group-ability','pka-scale'],
      6:['leaving-group-ability'] } },

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

    'molecular-geometry': { n:7, steps:{
      1:['molecular-geometry-vsepr'],
      2:['molecular-geometry-vsepr','lewis-structures-drawing'],
      3:['molecular-geometry-vsepr','lewis-structures-drawing'],
      6:['molecular-geometry-vsepr','hybridization-assignment'] } },

    'newman': { n:7, steps:{
      1:['newman-reading'],
      2:['torsional-strain','newman-reading'],
      3:['torsional-strain','newman-reading'],
      6:['newman-reading','torsional-strain'] } },

    'nucleophiles': { n:7, steps:{
      1:['nucleophile-recognition'],
      2:['nucleophile-recognition','electron-rich-poor'],
      3:['solvent-effects','basicity-vs-nucleophilicity'],
      6:['nucleophile-recognition','electron-rich-poor'] } },

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

    'resonance': { n:7, steps:{
      2:['resonance-delocalization'],
      3:['resonance-validity'],
      4:['resonance-delocalization','resonance-validity'],
      6:['resonance-validity','resonance-delocalization'] } },

    'ring-flips': { n:7, steps:{
      1:['ring-flip-mechanics'], 2:['ring-flip-mechanics'],
      3:['ring-flip-mechanics'],
      6:['ring-flip-mechanics','chair-axial-equatorial'] } },

    'rs-configuration': { n:8, steps:{
      2:['rs-assignment'],
      3:['cip-priority'],
      4:['cip-priority'],
      7:['rs-assignment','cip-priority'] } },

    'stereocenters': { n:7, steps:{
      1:['stereocenter-identification'], 2:['stereocenter-identification'],
      3:['stereocenter-identification'], 6:['stereocenter-identification'] } },

    'substrate-effects': { n:8, steps:{
      2:['mechanism-selection'],
      3:['mechanism-selection','solvent-effects'],
      4:['mechanism-selection','solvent-effects'],
      7:['mechanism-selection','zaitsev-hofmann'] } }
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
