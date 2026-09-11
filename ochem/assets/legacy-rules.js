/* Rules for diagnosing the legacy practice bank. See legacy-diagnosis.js for
   how they are matched.

   Most of these are SHARED rather than per-topic, and that works because a
   rule only fires in a topic whose concept list already contains its concept.
   A rule mapping "rate law" to rate-law-kinetics is live in SN1, SN2, E1, E2
   and substrate-effects and simply invisible everywhere else, so one rule
   covers five topics without any risk of dragging an NMR question into
   kinetics. Per-topic rules below handle the cases where the same words mean
   different things in different places. */
(function(){
  var L = window.OchemLegacyDiagnosis;

  /* ---- question rules: which concept is this question about? ----------
     These carry no message. Their whole job is to make the mastery engine
     record the right concept, which is what turns "weak at SN2" into "weak
     at stereochemical outcome — in SN2, in additions, and in E2". */
  L.shared([
    { q:/rate law|rate of the reaction|reaction rate|first[- ]order|second[- ]order|unimolecular|bimolecular|doubl\w+ the concentration|rate.determining/i, c:'rate-law-kinetics' },
    { q:/stereochemistr|configuration (is|at)|invert|inversion|retention|retained|racemi/i, c:'stereochemical-outcome' },
    { q:/solvent|protic|aprotic|DMSO|DMF|acetone as a solvent/i, c:'solvent-effects' },
    { q:/leaving group/i, c:'leaving-group-ability' },
    { q:/backside|back[- ]side|opposite the leaving group/i, c:'backside-attack' },
    { q:/steric|hinder|bulky|crowd/i, c:'steric-hindrance' },
    { q:/primary.*secondary.*tertiary|type of carbon|substrate class|methyl halide/i, c:'substrate-class' },
    { q:/carbocation/i, c:'carbocation-stability' },
    { q:/rearrange|hydride shift|methyl shift|1,2-shift/i, c:'carbocation-rearrangement' },
    { q:/anti[- ]?periplanar|dihedral|180°/i, c:'anti-periplanar-geometry' },
    { q:/zaitsev|hofmann|more substituted alkene|less substituted alkene/i, c:'zaitsev-hofmann' },
    { q:/which mechanism|SN1 or SN2|E1 or E2|predict the mechanism|favou?rs? (an? )?(SN|E)[12]/i, c:'mechanism-selection' },
    { q:/nucleophil/i, c:'nucleophile-recognition' },
    { q:/electrophil/i, c:'electrophile-recognition' },
    { q:/basicity|more basic|stronger base|nucleophilicity/i, c:'basicity-vs-nucleophilicity' },
    { q:/electron[- ]rich|electron[- ]poor|δ\+|δ−|partial (positive|negative)/i, c:'electron-rich-poor' },
    { q:/valence electron|atomic number|isotope|proton|neutron|shell|periodic table|quantum|spin|Hund|Pauli/i, c:'valence-electrons' },
    { q:/hybridi[sz]|s[- ]character|sp3|sp2|\bsp\b/i, c:'hybridization-assignment' },
    { q:/geometry|shape|bond angle|VSEPR|tetrahedral|trigonal|linear|bent|pyramidal/i, c:'molecular-geometry-vsepr' },
    { q:/formal charge/i, c:'formal-charge-calc' },
    { q:/lewis structure|octet|draw.*structure|skeleton/i, c:'lewis-structures-drawing' },
    { q:/electronegativ/i, c:'electronegativity-trend' },
    { q:/dipole|polarity|polar (bond|molecule)|nonpolar/i, c:'bond-polarity-dipoles' },
    { q:/resonance|delocali[sz]|conjugat(ed|ion)/i, c:'resonance-delocalization' },
    { q:/valid resonance|major contributor|resonance structure.*(valid|correct)/i, c:'resonance-validity' },
    { q:/curved arrow|arrow (tail|head)|push(ing)? electrons/i, c:'curved-arrow-direction' },
    { q:/pKa|acidity|more acidic|stronger acid|acid strength/i, c:'acidity-factors' },
    { q:/pKa (scale|value|of)|log scale/i, c:'pka-scale' },
    { q:/conjugate (acid|base)/i, c:'conjugate-pairs' },
    { q:/br(ø|o)nsted|proton (donor|acceptor)|donates? a proton|accepts? a proton/i, c:'bronsted-identification' },
    { q:/lewis acid|lewis base|electron[- ]pair (acceptor|donor)|empty orbital/i, c:'lewis-acid-base' },
    { q:/axial|equatorial|1,3-diaxial|A-value/i, c:'chair-axial-equatorial' },
    { q:/ring flip|chair.*chair|half-chair|twist.boat/i, c:'ring-flip-mechanics' },
    { q:/newman|staggered|eclipsed|gauche|anti conformation|conformer/i, c:'newman-reading' },
    { q:/torsional|angle strain|ring strain|strain/i, c:'torsional-strain' },
    { q:/stereocenter|stereogenic|chirality cent/i, c:'stereocenter-identification' },
    { q:/chiral|achiral|superimposab|mirror image|plane of symmetry/i, c:'chirality-recognition' },
    { q:/enantiomer|diastereomer|stereoisomer/i, c:'enantiomer-vs-diastereomer' },
    { q:/meso/i, c:'meso-detection' },
    { q:/priorit|CIP|Cahn/i, c:'cip-priority' },
    { q:/\bR\b.*\bS\b|assign.*configuration|clockwise|counterclockwise|dextro|levo|rotat\w+ (plane|light)|polarimet|specific rotation/i, c:'rs-assignment' },
    { q:/fischer/i, c:'fischer-reading' },
    { q:/aromatic|h(ü|u)ckel|4n\s*\+\s*2|antiaromatic|ring current/i, c:'huckel-aromaticity' },
    { q:/ortho|meta|para|directing|activat|deactivat/i, c:'directing-effects' },
    { q:/electrophilic aromatic|EAS|arenium|friedel/i, c:'eas-mechanism' },
    { q:/\bIR\b|wavenumber|cm.{0,2}1|stretch(ing)? (frequency|band)?|absor(b|ption)/i, c:'ir-functional-groups' },
    { q:/chemical shift|ppm|downfield|upfield|shield|deshield/i, c:'nmr-shift-shielding' },
    { q:/splitting|multiplet|n\s*\+\s*1|integration|singlet|doublet|triplet|quartet|coupling/i, c:'nmr-splitting-integration' },
    { q:/mass spec|m\/z|molecular ion|fragment|base peak|M\+2/i, c:'ms-fragmentation' },
    { q:/tetrahedral intermediate/i, c:'tetrahedral-intermediate' },
    { q:/carbonyl.*(electrophil|reactiv)|more electrophilic/i, c:'carbonyl-electrophilicity' },
    { q:/acid chloride|anhydride|reactivity (order|ladder)|derivative.*reactiv/i, c:'acyl-reactivity-order' },
    { q:/enolate/i, c:'enolate-formation' },
    { q:/alpha (hydrogen|carbon|proton)|α-(hydrogen|carbon)/i, c:'alpha-acidity' },
    { q:/aldol/i, c:'aldol-connectivity' },
    { q:/claisen|beta.keto ?ester|β-keto/i, c:'claisen-connectivity' },
    { q:/acetal|hemiacetal|protecting group/i, c:'acetal-formation' },
    { q:/epoxide|oxirane/i, c:'epoxide-opening-regiochem' },
    { q:/amine.*bas|amide.*bas|aniline|basicity of/i, c:'amine-basicity' },
    { q:/markovnikov|anti.markovnikov/i, c:'markovnikov-regiochem' },
    { q:/alkene stability|degree.{0,3} of unsaturation|pi bond|double bond.*(stab|rotat)/i, c:'alkene-pi-nucleophile' },
    { q:/terminal alkyne|alkyne.*acid|sp.*C–H|acetylide/i, c:'alkyne-acidity' },
    { q:/anti addition|syn addition|halonium|bromonium/i, c:'addition-stereochem' },
    { q:/tosylate|protonat.*(alcohol|OH)|activat.*alcohol/i, c:'alcohol-activation' },
    { q:/williamson|ether/i, c:'backside-attack' }
  ]);

  /* ---- option rules: what was the student actually thinking? ----------
     These only fire when the wrong answer says something specific enough to
     name. A bare "False" or "sp³" gets a concept from the rules above and the
     question's own explanation, with the UI hedging rather than inventing a
     misconception. */
  L.shared([
    { q:/stereochem|configuration|what happens.*carbon/i, o:/racemi/i, c:'stereochemical-outcome',
      m:'Racemization needs a planar intermediate that can be attacked from either face — that is the SN1 picture. A concerted backside attack has only one possible approach, so it gives clean inversion, not a mixture.' },
    { q:/stereochem|configuration|SN2/i, o:/retention|retained|no change/i, c:'stereochemical-outcome',
      m:'Retention would mean the nucleophile arrived on the same side the leaving group left from — but that side is exactly where the leaving group still is. The attack comes from the opposite face, so the centre inverts.' },
    { o:/stepwise|two[- ]step|via a carbocation|carbocation intermediate/i, q:/SN2|E2|concerted/i, c:'mechanism-selection',
      m:'That is the SN1/E1 answer. The defining feature of the bimolecular pathways is that there is no intermediate at all — bond making and bond breaking happen together in one step.' },
    { o:/radical/i, c:'mechanism-selection',
      m:'Radical chemistry is a different regime entirely, initiated by light or peroxides. Ionic mechanisms move electrons in pairs, which is what the curved arrows in this course always represent.' },
    { o:/tertiary/i, q:/SN2|fastest|backside/i, c:'steric-hindrance',
      m:'Tertiary is the slowest substrate for a backside attack, not the fastest. Three alkyl groups sit around the carbon and physically block the approach — SN2 rate falls off steeply with substitution.' },
    { o:/more electronegative|higher electronegativity/i, q:/priorit|CIP/i, c:'cip-priority',
      m:'CIP priority is set by ATOMIC NUMBER, not electronegativity. Fluorine is the most electronegative element there is and still ranks below chlorine and bromine.' },
    { o:/it (stays the same|makes no difference)|no (effect|change)|irrelevant|does not matter|doesn.t matter/i, c:'@q', soft:true,
      m:'Something that appears in the rate law cannot be irrelevant to the rate. Read the rate expression and ask which concentrations it actually contains.' },
    { o:/polar protic|water|methanol|ethanol as/i, q:/SN2|solvent/i, c:'solvent-effects',
      m:'A protic solvent hydrogen-bonds a cage around the nucleophile, which is exactly what you do NOT want for SN2 — it shields the electron pair you need. Polar aprotic solvents dissolve the salt without caging the anion.' },
    { o:/stronger base|strong(er)? acid/i, q:/leaving group/i, c:'leaving-group-ability',
      m:'Good leaving groups are WEAK bases — stable once they carry the electron pair away. A strong base holds electrons tightly and refuses to leave, which is why hydroxide is a terrible leaving group and tosylate is a great one.' },
    { o:/octahedral|square planar/i, q:/geometry|shape|transition state/i, c:'molecular-geometry-vsepr',
      m:'Carbon has four valence orbitals, so it never reaches six coordination in these mechanisms. Count the electron groups and match them to the standard shapes.' },
    { o:/only bonds? count|only bonding|ignore.*lone pair|lone pairs? (do not|don.t) count/i, c:'molecular-geometry-vsepr',
      m:'Lone pairs are electron groups too, and they take up MORE room than bonding pairs. Leaving them out is what turns water into "linear" and ammonia into "trigonal planar".' },
    { o:/atoms (also )?move|atoms shift|atoms change position/i, q:/resonance/i, c:'resonance-validity',
      m:'If an atom moves you have drawn a different compound, not a resonance form. Resonance moves electrons only — that is the one rule the whole concept rests on.' },
    { o:/higher pKa.*stronger acid|larger pKa.*stronger/i, c:'pka-scale',
      m:'The scale runs backwards: LOWER pKa means the stronger acid. It is a log scale too, so each unit is a factor of ten.' },
    { o:/equatorial.*stronger|axial.*prefer|prefers? (the )?axial/i, c:'chair-axial-equatorial',
      m:'Bulky groups prefer EQUATORIAL. Axial points straight up into the two other axial groups on the same face — the 1,3-diaxial clash — while equatorial points out and away from everything.' },
    { o:/any (number|amount) of swaps|two swaps|even number/i, q:/fischer/i, c:'fischer-reading',
      m:'An odd number of swaps inverts the stereocentre and an even number returns you to the original. One swap is odd, so it gives the enantiomer.' },
    { o:/constitutional isomer/i, q:/enantiomer|diastereomer|stereo/i, c:'enantiomer-vs-diastereomer',
      m:'Constitutional isomers differ in what is bonded to what. Here the connectivity is identical and only the 3D arrangement differs, which makes them stereoisomers.' },
    { o:/identical|same (molecule|compound)/i, q:/enantiomer|mirror image/i, c:'chirality-recognition',
      m:'Non-superimposable is the key word. Mirror images that you cannot lay on top of each other are different compounds — that is precisely what chirality means.' },
    { o:/all (three|four)? ?(react|are) (at )?the same|equally|no difference/i, c:'@q', soft:true,
      m:'These differ in a way the mechanism cares about a great deal. Identify what changes across the series — usually substitution at the reacting carbon — and reason from that.' },
    { o:/never|always|cannot be|impossible|does not exist/i, c:'@q', soft:true,
      m:'Absolute statements are rarely the answer in mechanism questions. Conditions decide: substrate, nucleophile strength, solvent and temperature all shift which pathway wins.' }
  ]);
})();

/* ---- per-topic rules -------------------------------------------------
   Everything the shared set above could not reach. Two kinds of entry here:
   concept rules, which fix what the mastery engine records, and `recall`
   rules, which mark a question as vocabulary or trivia so that NO concept
   evidence is written for it. The second kind matters more than it looks: a
   bank this size carries a real tail of "what suffix does IUPAC use", "nylon
   is which polymer", "esters smell fruity", and attributing those to acyl
   reactivity would have Review scheduling mechanism drills for a vocabulary
   gap. */
(function(){
  var L = window.OchemLegacyDiagnosis;

  var RECALL = /IUPAC|suffix|nomenclature|common name|named|naming|prefix|is called|called a|classified as|classic example|which class of compound|abbreviat|trade name|odor|smell|fruity|miscible|boiling point|melting point|solubility|soluble|polymer|nylon|PET|wax|peptide bond|amino acid|protein|Tollens|Lucas test|Fehling|Benedict|silver mirror|color\/precipitate|test is used|reagent is commonly used|simplest possible|simplest \(one-carbon\)|general molecular formula|molecular formula for/i;

  /* Module 1 */
  L.define('bonding', [
    { q:RECALL, recall:true },
    { q:/sigma|pi bond|bond order|bond length|shorter|stronger bond|dissociation|overlap|triple bond|double bond|single bond|rotat|covalent|ionic|metallic/i, c:'lewis-structures-drawing' },
    { q:/polar|nonpolar/i, c:'lewis-structures-drawing' },
    { o:/pi.*stronger than.*sigma|sigma.*weaker/i, c:'lewis-structures-drawing',
      m:'Sigma bonds are the stronger ones: head-on overlap concentrates electron density directly between the nuclei. Pi bonds overlap sideways, which is weaker — and that is exactly why the pi bond is what reacts.' },
    { o:/two identical sigma|two sigma bonds/i, c:'lewis-structures-drawing',
      m:'A double bond is one sigma plus one pi, not two sigmas. An atom can only form one sigma bond to a given neighbour; the second and third bonds have to be pi.' }
  ]);
  L.define('orbitals', [
    { q:RECALL, recall:true },
    { q:/orbital|subshell|shell|node|lobe|spherical|dumbbell|overlap|sigma|pi/i, c:'valence-electrons' },
    { q:/hybrid/i, c:'hybridization-assignment' }
  ]);
  L.define('hybridization', [
    { q:/shortest|longest|bond length|C–H bond|acidic/i, c:'hybridization-assignment' }
  ]);
  L.define('lewis-structures', [
    { q:RECALL, recall:true },
    { q:/central atom|terminal|outer atom|skeleton|which atom/i, c:'lewis-structures-drawing' }
  ]);
  L.define('molecular-geometry', [
    { q:/lone pairs? occupy|electron groups?|repulsion/i, c:'molecular-geometry-vsepr' }
  ]);
  L.define('electronegativity', [
    { q:/identical atoms|more polar|most polar|least polar/i, c:'electronegativity-trend' }
  ]);
  L.define('bond-polarity', [
    { q:/partial (negative|positive)|δ|more polar|most polar|Grignard|purely covalent|purely ionic/i, c:'bond-polarity-dipoles' }
  ]);

  /* Module 2 */
  L.define('resonance', [
    { q:/shorter and stronger|same length|drawn with|restricted rotation|bond length/i, c:'resonance-delocalization' }
  ]);
  L.define('curved-arrows', [
    { q:/draws an arrow|student draws|arrow from/i, c:'curved-arrow-direction' }
  ]);
  L.define('electrophiles', [
    { q:/electron[- ]withdrawing|inductive/i, c:'electrophile-recognition' }
  ]);
  L.define('electron-rich-poor', [
    { q:/inductive|withdrawal|donation/i, c:'electron-rich-poor' }
  ]);

  /* Module 3 */
  L.define('bronsted', [
    { q:/dissolv|amphoteric|bicarbonate|acting as|self-ionization|zwitterion|free.{0,12}proton|acetylene|NaNH2|role does/i, c:'bronsted-identification' }
  ]);
  L.define('lewis-acids', [
    { q:/Grignard|TiCl4|attacks|carbon-metal|synthesis/i, c:'lewis-acid-base' }
  ]);
  L.define('pka', [
    { q:/which quantity|predicts|extent/i, c:'pka-scale' }
  ]);

  /* Module 4 */
  L.define('newman', [
    { q:/lowest in energy|energy min|rotation about|barrier|profile/i, c:'newman-reading' }
  ]);
  L.define('cyclohexanes', [
    { q:/chair|boat|twist|half-chair|conformation|conformer|flagpole|ring flip|interconvert|planar|bond angles/i, c:'torsional-strain' },
    { q:RECALL, recall:true }
  ]);
  L.define('ring-flips', [
    { q:/conformer|dimethylcyclohexane|di-tert-butyl|locked|equilibrium|degenerate|disubstitution/i, c:'ring-flip-mechanics' }
  ]);
  L.define('conformational-analysis', [
    { q:/disubstituted|cis-1|trans-1|most stable conformation|preferred arrangement|lowest energy conformation|places the/i, c:'chair-axial-equatorial' }
  ]);

  /* Module 5 */
  L.define('chirality', [ { q:/smell|biolog|receptor|drug|taste/i, c:'chirality-recognition' } ]);
  L.define('stereocenters', [ { q:/quaternary ammonium|isolated as/i, c:'stereocenter-identification' } ]);
  L.define('enantiomers', [ { q:/label the relationship|relationship|natural proteins|configuration/i, c:'enantiomer-vs-diastereomer' } ]);
  L.define('diastereomers', [ { q:/cis and trans|relationship|geometric|same connectivity|cis-1|trans-1/i, c:'enantiomer-vs-diastereomer' } ]);
  L.define('meso', [ { q:/mirror plane|cyclic disubstituted|internal plane/i, c:'meso-detection' } ]);
  L.define('rs-configuration', [ { q:/\(2R|R label|naming|indicate/i, c:'rs-assignment' } ]);
  L.define('fischer', [ { q:/horizontal|vertical|swap|rotat/i, c:'fischer-reading' } ]);

  /* Module 6 */
  L.define('sn2', [
    { q:/kind of mechanism|concerted|single step|transition state|geometric shape/i, c:'mechanism-selection' },
    { q:/neopentyl|vinyl|aryl|allylic|benzylic|bulk of the alkyl|increasing the bulk/i, c:'steric-hindrance' },
    { q:/combination of conditions|fastest possible/i, c:'mechanism-selection' },
    { q:/single enantiomer|\(S\)-2-bromo|which stereochem/i, c:'stereochemical-outcome' }
  ]);
  L.define('sn1', [
    { q:/kind of mechanism|reaction order|overall order/i, c:'mechanism-selection' },
    { q:/methyl and primary|allylic|benzylic|vinyl|aryl|which cation is more stable|ranking/i, c:'carbocation-stability' },
    { q:/phenomenon|scramble/i, c:'carbocation-rearrangement' },
    { q:/solvolysis|pure water|water-ethanol/i, c:'solvent-effects' },
    { q:/single pure enantiomer|stereochemical outcome/i, c:'stereochemical-outcome' },
    { q:/E1 elimination byproduct|accompanied by/i, c:'mechanism-selection' }
  ]);
  L.define('e1', [
    { q:/shares its first step|which substitution mechanism|weak base|conditions of heat|favou?red by which|what determines/i, c:'mechanism-selection' },
    { q:/which alkene|expected|major product|alkene product/i, c:'zaitsev-hofmann' },
    { q:/scramble|side phenomenon/i, c:'carbocation-rearrangement' },
    { q:/temperature|E1.to.SN1|ratio|solvolysis|tert-butyl (chloride|iodide)/i, c:'mechanism-selection' },
    { q:/hindered bases|very weak/i, c:'carbocation-stability' }
  ]);
  L.define('e2', [
    { q:/how many.{0,20}steps|concerted|bonds break|simultaneous/i, c:'mechanism-selection' },
    { q:/kind of base|what does the base remove|concentration of the base|bulkier|tert-butoxide/i, c:'basicity-vs-nucleophilicity' },
    { q:/beta.hydrogen|E and Z|predominat/i, c:'zaitsev-hofmann' },
    { q:/solvent polarity|isotope effect|deuterium/i, c:'rate-law-kinetics' },
    { q:/tertiary substrates|primary carbons|substrate of choice/i, c:'substrate-class' }
  ]);
  L.define('substrate-effects', [
    { q:/primary substrates|secondary substrates|borderline|neopentyl/i, c:'substrate-class' }
  ]);

  /* Module 7 */
  L.define('alkene-structure', [
    { q:RECALL, recall:true },
    { q:/sigma bonds|made up of|shorter|restricted|rotation|planar/i, c:'hybridization-assignment' },
    { q:/E\/Z|cis|trans|geometric|priority/i, c:'alkene-pi-nucleophile' },
    { q:/stability|stable|heat of hydrogenation|reactive|substitution pattern/i, c:'alkene-pi-nucleophile' }
  ]);
  L.define('addition-reactions', [
    { q:RECALL, recall:true },
    { q:/hydrogenation|H2|catalyst|Pt|Pd/i, c:'addition-stereochem' },
    { q:/Br2|bromine water|colou?r|halogen|Cl2/i, c:'addition-stereochem' },
    { q:/hydration|water across|oxymercuration|hydroboration/i, c:'markovnikov-regiochem' },
    { q:/hydrogen halide|HX|rate-determining|order of key mechanistic steps|rearrange/i, c:'markovnikov-regiochem' }
  ]);
  L.define('markovnikov', [
    { q:/major product|peroxide|regiochem|halogen|terminal alkene|oxymercuration/i, c:'markovnikov-regiochem' }
  ]);
  L.define('alkynes', [
    { q:RECALL, recall:true },
    { q:/pi bonds|sigma bonds|bond angle|perpendicular|bond length/i, c:'hybridization-assignment' },
    { q:/Lindlar|Na\/NH3|dissolving.metal|hydrogenation|cis-alkene|trans-alkene|reduction/i, c:'addition-stereochem' },
    { q:/hydration|enol|tautomer|Markovnikov|HX|Br2|equivalent/i, c:'markovnikov-regiochem' },
    { q:/internal alkyne|terminal/i, c:'alkyne-acidity' }
  ]);

  /* Module 8 */
  L.define('alcohol-reactions', [
    { q:RECALL, recall:true },
    { q:/OH.{0,3} typically leave|leave directly/i, c:'alcohol-activation' },
    { q:/PCC|Jones|chromium|oxidi[sz]|Swern|periodic acid|HIO4/i, c:'alcohol-activation' },
    { q:/dehydration|dehydrates/i, c:'zaitsev-hofmann' },
    { q:/sodium metal|Grignard|Williamson|TMS|silyl/i, c:'alcohol-activation' },
    { q:/PBr3|HBr|inverted|stereochem/i, c:'mechanism-selection' },
    { q:/weaker acids|tert-butanol|compared to methanol/i, c:'alcohol-activation' },
    { q:/Fischer esterification/i, c:'acetal-formation' }
  ]);
  L.define('ether-chemistry', [
    { q:RECALL, recall:true },
    { q:/crown|cavity|KF|fluoride|Grignard|THF|solvent/i, c:'alcohol-activation' }
  ]);
  L.define('epoxides', [
    { q:/peroxyacid|mCPBA|epoxidation|epoxidi[sz]|syn|stereospecific|cis-2-butene|trans-2-butene/i, c:'addition-stereochem' },
    { q:/ring-opening|hydrolysis|methanol|methoxide|attacks/i, c:'epoxide-opening-regiochem' }
  ]);

  /* Module 9 */
  L.define('aldehydes-ketones', [
    { q:RECALL, recall:true },
    { q:/less reactive|more reactive|reactivity|resist/i, c:'carbonyl-electrophilicity' },
    { q:/partial positive|δ\+|dipole/i, c:'electrophile-recognition' },
    { q:/hydrate|geminal diol|equilibrium|formalin/i, c:'carbonyl-electrophilicity' },
    { q:/reduce|reducing|NaBH4|LiAlH4|selectively/i, c:'carbonyl-electrophilicity' },
    { q:/alpha.hydrogen/i, c:'carbonyl-electrophilicity' },
    { q:/cyclic ketone|carbonyl carbon is part/i, c:'hybridization-assignment' }
  ]);
  L.define('nucleophilic-addition', [
    { q:RECALL, recall:true },
    { q:/cyanide|CN-|cyanohydrin|primary amine|secondary amine|imine|enamine|loss of water/i, c:'tetrahedral-intermediate' },
    { q:/Grignard|irreversible|geminal diol|hydrate/i, c:'tetrahedral-intermediate' }
  ]);
  L.define('acetals', [
    { q:/diol|ethylene glycol|glucose|cyclic|intramolecular|mutarotation|optical rotation/i, c:'acetal-formation' }
  ]);
  L.define('carboxylic-acids', [
    { q:RECALL, recall:true },
    { q:/NaHCO3|bicarbonate|NaOH|CO2 bubbles|treated with aqueous/i, c:'acidity-factors' },
    { q:/dimer|hydrogen bond|gas phase|nonpolar solvent/i, c:'resonance-delocalization' },
    { q:/decarboxylat|beta-keto|heating/i, c:'acyl-reactivity-order' },
    { q:/Grignard|CO2 gas|oxidi[sz]|acyl chloride|SOCl2|LiAlH4|NaBH4|reduc/i, c:'acyl-reactivity-order' },
    { q:/second ionization|Ka2|formic acid|carboxyl group/i, c:'acidity-factors' }
  ]);
  L.define('esters-amides', [
    { q:RECALL, recall:true },
    { q:/more reactive|hydrolysis|reactiv/i, c:'acyl-reactivity-order' },
    { q:/Fischer esterification|transesterification|saponification|reversible|equilibrium/i, c:'acyl-reactivity-order' },
    { q:/amide.*(NOT|not) made|mixing a carboxylic acid|room temperature/i, c:'acyl-reactivity-order' },
    { q:/restricted rotation|resonance|delocali/i, c:'amine-basicity' },
    { q:/LiAlH4|Grignard|reduc/i, c:'acyl-reactivity-order' },
    { q:/basicity|nitrogen basicity/i, c:'amine-basicity' },
    { q:/lactone|lactam|alkoxy/i, c:'acyl-reactivity-order' }
  ]);
  L.define('acyl-substitution', [
    { q:/reactiv|ladder|order|which is more|hydrolys|convert/i, c:'acyl-reactivity-order' },
    { q:/intermediate|collapse|attack/i, c:'tetrahedral-intermediate' }
  ]);
  L.define('amine-reactions', [
    { q:RECALL, recall:true },
    { q:/acyl chloride|ester|amide|acylation/i, c:'nucleophile-recognition' },
    { q:/aldehyde|ketone|imine|enamine|condens|alkylat|methyl iodide|SN2/i, c:'nucleophile-recognition' },
    { q:/strong acids|HCl|salt/i, c:'amine-basicity' },
    { q:/nitrous acid|HNO2|diazonium/i, c:'nucleophile-recognition' }
  ]);
  L.define('amine-structure', [
    { q:RECALL, recall:true },
    { q:/basic|basicity|aniline|pyridine|amide/i, c:'amine-basicity' }
  ]);
  L.define('alpha-hydrogens', [ { q:/tautomer|keto|enol/i, c:'alpha-acidity' } ]);
  L.define('aldol', [ { q:/crossed|dehydrat|enone|condensation|product/i, c:'aldol-connectivity' } ]);
  L.define('claisen', [ { q:/crossed|product|Dieckmann|intramolecular/i, c:'claisen-connectivity' } ]);

  /* Module 10-11 */
  L.define('aromaticity', [
    { q:RECALL, recall:true },
    { q:/planar|cyclic|conjugat|pi electron|count|criteria|requirement/i, c:'huckel-aromaticity' }
  ]);
  L.define('eas', [
    { q:RECALL, recall:true },
    { q:/nitration|halogenation|sulfonation|alkylation|acylation|catalyst|AlCl3|FeBr3|electrophile/i, c:'eas-mechanism' },
    { q:/rearrange|polyalkylation|acylium/i, c:'eas-mechanism' }
  ]);
  L.define('directing-effects', [
    { q:/rate|faster|slower|reactiv/i, c:'directing-effects' }
  ]);
  L.define('ir', [ { q:RECALL, recall:true }, { q:/peak|band|region|fingerprint|functional group/i, c:'ir-functional-groups' } ]);
  L.define('h-nmr', [ { q:RECALL, recall:true }, { q:/equivalent|environment|signal|peak|proton/i, c:'nmr-splitting-integration' } ]);
  L.define('c-nmr', [ { q:RECALL, recall:true }, { q:/equivalent|environment|signal|peak|DEPT|carbon/i, c:'nmr-shift-shielding' } ]);
  L.define('mass-spec', [ { q:RECALL, recall:true }, { q:/peak|ion|isotope|cleavage|rearrangement|nitrogen rule|ratio/i, c:'ms-fragmentation' } ]);
  L.define('conjugate', [ { q:/stronger|weaker|relationship|pair/i, c:'conjugate-pairs' } ]);
  L.define('acidity-factors', [ { q:/ARIO|atom|resonance|induction|orbital|factor/i, c:'acidity-factors' } ]);
  L.define('leaving-groups', [ { q:/tosylate|triflate|mesylate|water|halide|rank/i, c:'leaving-group-ability' } ]);
  L.define('nucleophiles', [ { q:/rank|stronger|better|charge|size|polarizab/i, c:'nucleophile-recognition' } ]);
  L.define('atomic-structure', [ { q:RECALL, recall:true } ]);
  L.define('molecular-geometry', [ { q:RECALL, recall:true } ]);
})();

/* ---- option rules: naming the misconception --------------------------
   These fire on what the wrong answer SAYS, so they only apply where the
   distractor is self-describing. Each is scoped to a concept, so it is
   automatically invisible in topics that do not carry that concept. */
(function(){
  var L = window.OchemLegacyDiagnosis;
  L.shared([
    /* Over-generalisation. A distractor built on "always" or "never" is
       usually a real rule stretched past where it holds, and that is a
       genuinely teachable error rather than a random wrong answer. */
    { o:/\balways\b/i, c:'@q', soft:true,
      m:'Very little in organic chemistry is unconditional. Ask what would have to be true for this to fail — substrate, base strength, solvent or temperature usually decides, and an answer that admits no exceptions is usually a real rule stretched too far.' },
    { o:/\bnever\b|\bcannot\b|impossible|does not exist|no such/i, c:'@q', soft:true,
      m:'This one is too absolute. The underlying trend is usually right but the "never" is not — look for the conditions under which it does happen.' },
    { o:/no effect|makes no difference|does not (affect|matter|change)|doesn.t (affect|matter|change)|irrelevant/i, c:'@q', soft:true,
      m:'Something that appears in the rate expression cannot be irrelevant to the rate. Write the rate law out and check which concentrations are actually in it.' },
    { o:/all (three|four|of them)? ?(are |react )?(equal|identical|the same)|equally|no difference between/i, c:'@q', soft:true,
      m:'These are not equivalent — the series was chosen because one variable changes across it. Find what differs (substitution at the reacting carbon, electronegativity, ring size) and reason from that.' },

    /* Reversals: the two halves of a pair swapped. */
    { o:/^\s*electrophile/i, q:/nucleophil/i, c:'nucleophile-recognition',
      m:'Those are opposites. A nucleophile is electron-RICH and donates a pair; an electrophile is electron-poor and accepts one. Check which side of the reaction has the lone pair.' },
    { o:/^\s*nucleophile/i, q:/electrophil/i, c:'electrophile-recognition',
      m:'Those are opposites. The electrophile is the electron-POOR partner, the one being attacked.' },
    { o:/proton acceptor/i, q:/acid\b/i, c:'bronsted-identification',
      m:'That is the definition of a Br\u00f8nsted BASE. An acid is the proton donor.' },
    { o:/proton donor/i, q:/\bbase\b/i, c:'bronsted-identification',
      m:'That is the definition of a Br\u00f8nsted ACID. A base is the proton acceptor.' },
    { o:/conjugate base/i, q:/conjugate acid/i, c:'conjugate-pairs',
      m:'Those are the two halves of the pair, and they differ by one proton in the other direction. Adding a proton gives the conjugate acid; removing one gives the conjugate base.' },
    { o:/electron[- ]pair donor|donates? an electron pair/i, q:/lewis acid/i, c:'lewis-acid-base',
      m:'That is a Lewis BASE. A Lewis acid accepts the electron pair — it is the one with the empty orbital.' },

    /* Sigma / pi confusion. */
    { o:/side[- ]by[- ]side|parallel p orbitals|above and below/i, q:/sigma/i, c:'lewis-structures-drawing',
      m:'Side-by-side overlap gives a PI bond. A sigma bond is head-on along the axis joining the nuclei, which is why you can rotate about it.' },
    { o:/head[- ]on|end[- ]to[- ]end|along the (bond )?axis/i, q:/\bpi\b|π/i, c:'lewis-structures-drawing',
      m:'Head-on overlap along the internuclear axis is a SIGMA bond. Pi bonds come from parallel p orbitals overlapping sideways.' },
    { o:/\bpi\b|π/i, q:/free rotation|rotate/i, c:'lewis-structures-drawing',
      m:'Rotation is free about a SIGMA bond. Twisting about a pi bond would pull its parallel p orbitals out of overlap, which is why a C=C is locked and cis/trans isomers exist.' },

    /* Hybridization arithmetic. */
    { o:/sp3/i, q:/double bond|trigonal planar|carbonyl|sp2/i, c:'hybridization-assignment',
      m:'Count electron GROUPS, not bonds: a double bond still counts once. Three groups means sp\u00b2 and trigonal planar; sp\u00b3 is four groups.' },
    { o:/sp2/i, q:/triple bond|linear|180/i, c:'hybridization-assignment',
      m:'A triple bond plus one other group is two electron groups, which is sp and linear. sp\u00b2 would need three groups.' },
    { o:/not hybridi[sz]ed/i, c:'hybridization-assignment',
      m:'Any atom forming sigma bonds in an organic structure is using hybrid orbitals. Count sigma bonds plus lone pairs and read the hybridization off that number.' },

    /* Acidity and basicity. */
    { o:/weaker acid|less acidic/i, q:/lower pKa|stronger acid/i, c:'pka-scale',
      m:'Lower pKa means STRONGER acid — the scale runs backwards, and it is logarithmic, so a difference of five pKa units is a factor of a hundred thousand.' },
    { o:/more electronegative/i, q:/leaving group|nucleophil/i, c:'basicity-vs-nucleophilicity',
      m:'Electronegativity is the wrong axis here. What matters is how stable the species is once it holds the electron pair — that is base strength, and in protic solvents polarizability and solvation matter too.' },
    { o:/carbanion/i, q:/leaving group/i, c:'leaving-group-ability',
      m:'Carbanions are extremely strong bases, which makes them among the worst leaving groups there are. That is exactly why ketones add rather than substitute.' },

    /* Stereochemistry. */
    { o:/retention|retained/i, q:/SN2|backside|inver/i, c:'stereochemical-outcome',
      m:'Retention would require the nucleophile to arrive on the face the leaving group is still occupying. Backside attack inverts the centre, every time.' },
    { o:/racemi/i, q:/SN2|concerted|backside/i, c:'stereochemical-outcome',
      m:'Racemization needs a planar intermediate open to attack from both faces. A concerted mechanism has no intermediate, so there is only one possible approach and one product.' },
    { o:/single enantiomer|optically (pure|active)/i, q:/SN1|carbocation|racemi/i, c:'stereochemical-outcome',
      m:'The carbocation is planar, so the nucleophile can arrive from either face at roughly equal rates. That gives a racemic (or nearly racemic) mixture, not one enantiomer.' },
    { o:/enantiomer/i, q:/diastereomer|cis.{0,4}trans|one.*inverted/i, c:'enantiomer-vs-diastereomer',
      m:'Enantiomers need EVERY stereocentre inverted. Invert some but not all and the result is a diastereomer — not a mirror image, and separable by ordinary physical means.' },
    { o:/diastereomer/i, q:/mirror image|all.*inverted|non-?superimposab/i, c:'enantiomer-vs-diastereomer',
      m:'Diastereomers are stereoisomers that are NOT mirror images. When every stereocentre is inverted you have the mirror image — enantiomers.' },
    { o:/\bchiral\b/i, q:/meso|plane of symmetry|internal mirror/i, c:'meso-detection',
      m:'An internal mirror plane makes a molecule achiral no matter how many stereocentres it has. That is exactly what meso means — stereocentres present, optical activity zero.' },

    /* Regiochemistry and elimination. */
    { o:/less substituted|terminal|Hofmann/i, q:/Zaitsev|major|more substituted/i, c:'zaitsev-hofmann',
      m:'Zaitsev is the default: the more substituted alkene is more stable and is the major product. The less substituted one wins only when the base is bulky enough to be unable to reach the interior hydrogens.' },
    { o:/more substituted|Zaitsev/i, q:/bulky base|tert-butoxide|Hofmann/i, c:'zaitsev-hofmann',
      m:'A bulky base cannot reach the crowded interior hydrogen, so it takes the accessible terminal one instead and gives the LESS substituted alkene. That is the Hofmann product.' },
    { o:/less substituted carbon|anti-?Markovnikov/i, q:/Markovnikov|HX|hydration|carbocation/i, c:'markovnikov-regiochem',
      m:'Under ionic conditions the proton adds so as to leave the positive charge on the MORE substituted carbon, where it is better stabilized — so the halide or OH ends up there. Anti-Markovnikov needs peroxides (radicals) or hydroboration.' },

    /* Carbonyl chemistry. */
    { o:/carbon/i, q:/where do the pi electrons go|C=O pi/i, c:'carbonyl-electrophilicity',
      m:'The pi electrons go to OXYGEN. Oxygen is far better able to carry the negative charge, and the carbon is already accepting a new bond from the nucleophile.' },
    { o:/amide/i, q:/most reactive|reactiv.*order/i, c:'acyl-reactivity-order',
      m:'Amides are the LEAST reactive derivative: nitrogen donates its lone pair strongly into the carbonyl, and the leaving group would have to be an amide anion, which is a very strong base. Acid chlorides sit at the reactive end.' },
    { o:/acid chloride|acyl chloride/i, q:/least reactive|most stable/i, c:'acyl-reactivity-order',
      m:'Acid chlorides are the MOST reactive of the derivatives — chloride is an excellent leaving group and chlorine barely donates into the carbonyl. The unreactive end of the ladder is the amide.' },
    { o:/alcohol/i, q:/amide.*LiAlH4|LiAlH4.*amide/i, c:'acyl-reactivity-order',
      m:'Reducing an amide gives an AMINE, not an alcohol: the nitrogen never leaves the carbon during the reduction. It is the ester and the acid that give alcohols.' },

    /* Aromatics. */
    { o:/\bmeta\b/i, q:/donor|activating|OH|NH2|OCH3|alkyl/i, c:'directing-effects',
      m:'Donors direct ORTHO and PARA. Those are the positions whose arenium resonance forms put the positive charge next to the donating group, where the lone pair can stabilize it. Meta is where deactivators send the electrophile.' },
    { o:/ortho|para/i, q:/nitro|NO2|withdraw|deactivat|carbonyl substituent/i, c:'directing-effects',
      m:'A withdrawing group directs META — not because meta is stabilized, but because ortho and para attack would place positive charge directly on or next to an already electron-poor carbon. It is elimination of the worse options.' },
    { o:/antiaromatic/i, q:/4n\s*\+\s*2|6 pi|aromatic\?/i, c:'huckel-aromaticity',
      m:'Antiaromatic needs a 4n count (4, 8, 12) in a planar, fully conjugated ring. 4n+2 counts — 2, 6, 10 — are aromatic and stabilized.' },

    /* Spectroscopy. */
    { o:/carboxylic acid/i, q:/no (broad|O–H|OH)|1715|ketone/i, c:'ir-functional-groups',
      m:'A carboxylic acid would show a very broad O\u2013H from about 2500 to 3300 cm\u207b\u00b9, and the question rules that out. A C=O with no O\u2013H is a ketone or aldehyde.' },
    { o:/number of (neighbou?ring )?(hydrogens|protons) directly|equals the number of/i, q:/splitting|n\s*\+\s*1|peaks/i, c:'nmr-splitting-integration',
      m:'It is n+1, not n. Three neighbouring hydrogens give a QUARTET, four peaks — the count of peaks is always one more than the count of neighbours.' },
    { o:/total (number of )?hydrogens|exactly \d+ (total )?hydrogens/i, q:/integration|ratio/i, c:'nmr-splitting-integration',
      m:'Integration gives a RATIO, not an absolute count. A 3:2 ratio fits CH\u2083CH\u2082 but equally fits a molecule with six and four of those hydrogens.' }
  ]);
})();

/* ---- guidance for answers that cannot be diagnosed from their text ----
   True/False and bare tokens ("3", "sp\u00b2", "Tetrahedral") carry no
   misconception on their own — the meaning is entirely in the question. These
   are marked `soft`, so they show as guidance and the UI still hedges rather
   than claiming to have identified an error it has not. */
(function(){
  var L = window.OchemLegacyDiagnosis;
  L.shared([
    { o:/^\s*false\s*$/i, c:'@q', soft:true,
      m:'Statements like this usually turn on a single word — an "always", a "never", a "more" that should be "less". Read the claim one clause at a time and find the clause that would have to change to make it true.' },
    { o:/^\s*true\s*$/i, c:'@q', soft:true,
      m:'This one reads plausibly and is still wrong, which is what makes it worth a second look. Take the statement clause by clause: one specific part of it is false, and finding which part is the actual lesson here.' },
    { o:/\bonly\b/i, c:'@q', soft:true,
      m:'"Only" is doing a lot of work in that answer. Check whether the restriction it claims is real, or whether it has narrowed something that is true more broadly.' },
    { o:/^\s*neither\s*$|^\s*both\s*$|^\s*none\b/i, c:'@q', soft:true,
      m:'Before settling on an all-or-nothing answer, test each option on its own — usually at least one of them holds under some conditions.' },
    { o:/^\s*-?\d+(\.\d+)?\s*°?\s*$|^\s*[−-]\d/i, c:'@q', soft:true,
      m:'A numerical slip. Redo the count or the arithmetic one step at a time — for formal charge, for electron groups, for degrees of unsaturation, the error is almost always a single miscounted term rather than the method.' }
  ]);
})();

/* ---- topic-specific option rules --------------------------------------
   Where the wrong answer says something specific enough to name, these name
   it. They are scoped by topic, so "SN2" as an answer means something
   different in the E1 topic than it does in the alkene topics. */
(function(){
  var L = window.OchemLegacyDiagnosis;

  L.define('sn1', [
    { o:/single concerted|one step|concerted/i, c:'mechanism-selection',
      m:'Concerted is the SN2 picture. SN1 is stepwise by definition: the leaving group goes first on its own, and the nucleophile does not arrive until the carbocation already exists.' },
    { o:/requires no leaving group/i, c:'leaving-group-ability',
      m:'Every substitution needs a leaving group — SN1 more than most, because the leaving group departs unassisted in the slow step. That is exactly why iodide substrates ionize faster than chlorides.' },
    { o:/^\s*(methyl|primary)\s*$/i, c:'carbocation-stability',
      m:'Methyl and primary cations are far too unstable to form. SN1 needs a carbocation it can afford, which means tertiary, allylic or benzylic.' },
    { o:/both substrate and nucleophile/i, c:'rate-law-kinetics',
      m:'That is the SN2 rate law. In SN1 the slow step is ionization, which happens before the nucleophile is involved at all — so its concentration does not appear in the rate.' },
    { o:/nucleophile only/i, c:'rate-law-kinetics',
      m:'The rate depends on the SUBSTRATE only. The rate-determining step is the substrate ionizing; the nucleophile arrives afterwards and cannot speed up a step it is not in.' },
    { o:/attack of the nucleophile|proton transfer/i, q:/rate.determining|slow(est)? step/i, c:'rate-law-kinetics',
      m:'Those steps are fast. The slow, rate-determining step is the ionization that forms the carbocation — breaking a bond with no help is far harder than forming one.' }
  ]);

  L.define('e1', [
    { o:/^\s*SN2\s*$/i, c:'mechanism-selection',
      m:'SN2 is concerted and bimolecular; E1 is neither. The mechanism E1 shares its first step with is SN1 — both begin by ionizing to the same carbocation, which is why they compete.' },
    { o:/^\s*E2\s*$/i, q:/first step|shares/i, c:'mechanism-selection',
      m:'E2 has no first step to share — it is one concerted step. E1 ionizes first, exactly as SN1 does, and the two then compete for the same cation.' },
    { o:/least substituted|Hofmann|terminal alkene/i, c:'zaitsev-hofmann',
      m:'E1 has no bulky base to force the Hofmann product — a weak base picks off whichever proton gives the most stable alkene. That is Zaitsev: the more substituted alkene.' },
    { o:/removal of the beta.hydrogen|formation of the pi bond|solvation/i, q:/rate.determining|slow/i, c:'rate-law-kinetics',
      m:'Those all come after the hard part. The rate-determining step is the initial ionization; losing the proton from a carbocation is fast by comparison.' },
    { o:/strong.{0,12}(bulky )?base|requires a strong/i, c:'mechanism-selection',
      m:'That requirement belongs to E2. E1 runs with weak bases and heat precisely because the base is not involved until after the rate-determining step.' }
  ]);

  L.define('e2', [
    { o:/(two|three|four) steps|no defined number/i, c:'mechanism-selection',
      m:'E2 is a single concerted step — base removes the proton, the pi bond forms and the leaving group departs all at once. That simultaneity is what forces the anti-periplanar geometry.' },
    { o:/gauche|eclipsed|60°|0°|any orientation/i, c:'anti-periplanar-geometry',
      m:'E2 needs the H and the leaving group anti-periplanar — 180° apart. Only then do the breaking C–H sigma orbital and the C–LG antibonding orbital line up to become the new pi bond.' },
    { o:/rate = k\[substrate\](?!\^)|first order overall|rate = k\[base\]/i, c:'rate-law-kinetics',
      m:'E2 is second order: rate = k[substrate][base]. Both partners are in the single step, so both concentrations appear in the rate law — that is what the 2 in E2 means.' },
    { o:/only the C-?(leaving group|H) bond breaks|only the beta/i, c:'curved-arrow-direction',
      m:'Three things happen at once in E2: the base takes the beta hydrogen, those C–H electrons become the pi bond, and the C–LG bond breaks. Picking out just one of them describes a stepwise mechanism instead.' },
    { o:/bulky bases (cannot|are never)|no relationship between base size/i, c:'basicity-vs-nucleophilicity',
      m:'Bulk and strength are independent. tert-Butoxide is both very strong and very bulky, and its bulk is what steers it away from substitution and toward the accessible terminal hydrogen.' }
  ]);

  L.define('markovnikov', [
    { o:/less substituted|fewest hydrogens|terminal/i, q:/Markovnikov|major product|HX|HCl|HBr|HI/i, c:'markovnikov-regiochem',
      m:'Markovnikov: the proton adds to the carbon with MORE hydrogens, leaving the positive charge on the more substituted carbon where it is better stabilized. The halide then lands there.' },
    { o:/random|statistical|chosen randomly/i, c:'markovnikov-regiochem',
      m:'Regiochemistry here is not statistical at all — it is decided by which of the two possible carbocations is more stable, and tertiary beats secondary beats primary by a wide margin.' },
    { o:/radical stability only|steric hindrance of the nucleophile alone/i, c:'markovnikov-regiochem',
      m:'Under ordinary ionic conditions it is CARBOCATION stability that decides. Radical stability governs the peroxide (anti-Markovnikov) case, which is a different mechanism.' },
    { o:/same carbon as in Markovnikov/i, q:/peroxide|anti/i, c:'markovnikov-regiochem',
      m:'Peroxides flip it. The radical mechanism adds Br first, to the less substituted carbon, so the product is the opposite of the ionic one.' }
  ]);

  L.define('epoxides', [
    { o:/extra oxygen|contain a double bond|always negatively charged/i, c:'epoxide-opening-regiochem',
      m:'What makes an epoxide reactive is RING STRAIN. A three-membered ring forces about 60° bond angles against carbon\u2019s preferred 109.5°, and opening the ring releases that.' },
    { o:/more substituted carbon \(SN1-like\)|more substituted/i, q:/bas(e|ic)|NaOH|methoxide|strong nucleophile/i, c:'epoxide-opening-regiochem',
      m:'Under basic conditions this is a plain SN2, so sterics decide and attack goes to the LESS substituted carbon. Attack at the more substituted carbon is the acid-catalyzed answer.' },
    { o:/less substituted/i, q:/acid|H3O|H2SO4|protonat/i, c:'epoxide-opening-regiochem',
      m:'Protonating the oxygen lets positive charge build in the transition state, and the more substituted carbon carries that charge better. Under acid the nucleophile goes to the MORE substituted carbon.' },
    { o:/the oxygen( atom)?( itself)?/i, q:/attack|opens|nucleophile/i, c:'backside-attack',
      m:'The nucleophile attacks a ring CARBON. The oxygen is the leaving group — tethered, because the ring keeps it attached, which is why the product is an alkoxide rather than a free leaving group.' }
  ]);

  L.define('directing-effects', [
    { o:/ipso/i, c:'directing-effects',
      m:'Ipso is the substituted carbon itself, and it is already occupied. The available positions are ortho (adjacent), meta (one further) and para (directly across).' },
    { o:/every position equally|all positions equally/i, c:'directing-effects',
      m:'Substituents direct strongly — often 95% or better to the favoured positions. Which positions are favoured follows from where the arenium ion\u2019s positive charge ends up.' },
    { o:/halogens (have no|always activate|direct exclusively|only deactivate)/i, c:'directing-effects',
      m:'Halogens are the awkward case, and deliberately so: they DEACTIVATE by induction (electronegative, pulling density out of the ring) while still directing ORTHO/PARA by resonance donation of a lone pair. Slower than benzene, but with the donor\u2019s substitution pattern.' }
  ]);

  L.define('sn2', [
    { o:/trigonal planar|tetrahedral/i, q:/transition state/i, c:'backside-attack',
      m:'At the transition state the carbon is bonded to five things at once — the incoming nucleophile, the departing leaving group and three others — which makes it trigonal bipyramidal. Tetrahedral is what it was before and what it becomes after.' },
    { o:/vinyl|aryl|sp2/i, q:/fastest|best/i, c:'backside-attack',
      m:'Backside attack on a vinyl or aryl carbon would mean approaching through the pi system and the ring itself. Those carbons are effectively inaccessible to SN2, whatever their substitution.' },
    { o:/weak and (bulky|small)|weak nucleophile/i, q:/best favou?rs|fastest/i, c:'basicity-vs-nucleophilicity',
      m:'SN2 needs a strong nucleophile, because the nucleophile is in the rate-determining step — the only step there is. Weak nucleophiles push the substrate toward the unimolecular pathways instead.' }
  ]);

  L.define('substrate-effects', [
    { o:/primary/i, q:/SN1|E1|carbocation/i, c:'carbocation-stability',
      m:'A primary carbocation is prohibitively unstable, so primary substrates essentially never take the unimolecular route. They go SN2, or E2 if the base is strong enough.' },
    { o:/tertiary/i, q:/SN2/i, c:'steric-hindrance',
      m:'Tertiary carbons are the worst possible SN2 substrates — three alkyl groups block the backside approach entirely. Tertiary plus a strong base means E2.' }
  ]);

  L.define('aromaticity', [
    { o:/not part of the ring|not aromatic/i, q:/pyrrole|pyridine|lone pair/i, c:'huckel-aromaticity',
      m:'Both rings are aromatic; the difference is WHERE the nitrogen lone pair sits. In pyrrole it is in a p orbital and counts toward the six pi electrons, so pyrrole is barely basic. In pyridine it is in an sp\u00b2 orbital in the ring plane, outside the pi system and free to act as a base.' },
    { o:/any (ring|cyclic)|all rings|simply being cyclic/i, c:'huckel-aromaticity',
      m:'Aromaticity takes four things together: cyclic, planar, fully conjugated around the ring, and a 4n+2 pi electron count. Drop any one and it fails.' }
  ]);

  L.define('acyl-substitution', [
    { o:/addition(?! ?-? ?elimination)|simple addition/i, q:/ester|acid chloride|amide|derivative/i, c:'tetrahedral-intermediate',
      m:'Carboxylic acid derivatives run addition-ELIMINATION: the tetrahedral intermediate forms and then collapses, expelling the leaving group. Plain addition is what happens to ketones and aldehydes, which have no leaving group to expel.' },
    { o:/SN2|backside/i, c:'tetrahedral-intermediate',
      m:'Substitution at a carbonyl does not go by backside attack. It goes through a tetrahedral intermediate — add first, then eliminate — which is why the stereochemistry at that carbon is not set the way an SN2 sets it.' }
  ]);

  L.define('nucleophiles', [
    { o:/more electronegative|higher electronegativity/i, c:'nucleophile-recognition',
      m:'Electronegativity works against nucleophilicity: an atom that holds its electrons tightly is less willing to donate them. Down a group in a protic solvent, the bigger and more polarizable ion is the better nucleophile even though it is less electronegative.' },
    { o:/neutral/i, q:/stronger|better nucleophile/i, c:'nucleophile-recognition',
      m:'The charged species wins, other things equal. Methoxide is a far better nucleophile than methanol for the same reason it is a stronger base — more available electron density on the donating atom.' }
  ]);

  L.define('leaving-groups', [
    { o:/hydroxide|OH|amide|NH2|alkoxide/i, q:/best|good leaving group/i, c:'leaving-group-ability',
      m:'Those are strong bases, which makes them poor leaving groups — they do not want to carry the electron pair away. Good leaving groups are weak bases: halides, water, tosylate.' },
    { o:/fluoride|F−|F-/i, q:/best|fastest/i, c:'leaving-group-ability',
      m:'Fluoride is the worst halide leaving group, not the best: HF has a pKa around 3, so fluoride is a comparatively strong base. Leaving-group ability improves down the group — I > Br > Cl >> F.' }
  ]);
})();
