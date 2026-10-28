/* Synthesis Trainer: the problems.

   No reaction is written here. Every step a student can take is an edge of
   the Reagent Roadmap's graph (reagent-roadmap-data.js), and the trainer
   judges every pick with the roadmap's own engine. What this file adds is
   what the graph cannot know: which real molecule a problem is about, so a
   step can be shown as a structure and not just as "an alkene".

   FAMILIES
   --------
   A family is one carbon skeleton and the molecule it is at each group of
   the map: on the propane skeleton the 1° alcohol is propan-1-ol and the
   alkene is propene. An entry is
     { g, p, name, f, text, via, after }
       g     the roadmap group (node id)
       p     the substitution pattern this molecule is (see PATTERNS in the
             roadmap data). It is also a fact the trainer uses: arriving at
             this molecule narrows the route's patterns to p, so but-2-ene
             cannot then be hydroborated to butan-1-ol.
       name  what it is called
       stereo 'cis' | 'trans': drawn that way (a C=C, or two groups on a ring)
       f     a formula the course's molecule builder draws (mol-builder.js
             parse); or a ring spec { n, aromatic, subs, unsat } (parseRing).
             Absent: no drawing, and `text` is shown instead.
       via   only when the last step was one of these reactions (reaction
             ids, or the id before the '.' of an expanded one)
       after only when the step before started from one of these patterns
     The first entry that fits is the molecule. Entries with `via` come
     first, so the exception wins over the rule.

   `ban` names reactions that the graph allows for a general group but that
   this skeleton cannot do, each with the reason a student is given:
   cyclohexene has no room for a C≡C, and bromobenzene has no nitro group
   to make SNAr work.

   PROBLEMS
   --------
     id      stable; in links (?p=) and in the progress store
     fam     a family, or [before, after] when the problem has one C–C step:
             the second family is the skeleton once that step is taken
     start, target   { g, p, name? } (name/drawing come from the family)
                     The target is reached when the molecule made has the target's
             name (propylbenzene is filed as an alkylbenzene and, made from
             an alkene, as an alkane: both are it). target.via picks the
             target's entry where the family has more than one (the trans
             diol, not the cis); target.wrong: why another reaction into
             that group makes the wrong molecule
     cc      reactions allowed to change the skeleton (at most one is used)
     with    the second reagent a C–C step uses here ('grig-rcho': 'CH₃CHO')
     ccWhy   why another C–C step does not build this target
     ban     as in a family, for this problem only
     hint    optional extra line for the first hint
     prefer  reactions the shortest route shown should use when two routes
             tie (nitration, not bromination then benzyne, to an aniline)

   The order is the order a student meets them: fewest steps first, then by
   chapter. scripts/test/synthesis-trainer.test.mjs proves every problem
   solvable on the graph and checks every molecule here draws. */
(function(){

  var WITH = { 'ald-redam': 'NH₃', 'ket-redam': 'NH₃', 'acl-amide': 'NH₃', 'est-amide': 'NH₃' };

  var F = {};

  F.C3 = { id: 'C3', name: 'propane skeleton', mols: [
    { g: 'alkane', p: 'none3', name: 'propane', f: 'CH3CH2CH3' },
    { g: 'halide-1', p: 'b2', name: '1-bromopropane', f: 'CH3CH2CH2Br' },
    { g: 'halide-2', name: '2-bromopropane', f: 'CH3CH(Br)CH3' },
    { g: 'alcohol-1', p: 'b2', name: 'propan-1-ol', f: 'CH3CH2CH2OH' },
    { g: 'alcohol-2', name: 'propan-2-ol', f: 'CH3CH(OH)CH3' },
    { g: 'alkene', p: 'mono', name: 'propene', f: 'CH3CH=CH2' },
    { g: 'alkyne', p: 'terminal', name: 'propyne', f: 'CH3C#CH' },
    { g: 'epoxide', p: 'mono', name: '2-methyloxirane', text: 'CH₃CH–CH₂, closed by an O bridge' },
    { g: 'diol', name: 'propane-1,2-diol', f: 'CH3CH(OH)CH2OH' },
    { g: 'aldehyde', p: 'b2', name: 'propanal', f: 'CH3CH2CHO' },
    { g: 'ketone', p: 'methyl', name: 'acetone (propanone)', f: 'CH3COCH3' },
    { g: 'acid', p: 'b2', name: 'propanoic acid', f: 'CH3CH2COOH' },
    { g: 'acid-chloride', p: 'b2', name: 'propanoyl chloride', f: 'CH3CH2COCl' },
    { g: 'ester', p: 'b2', name: 'a propanoate ester', text: 'CH₃CH₂COOR′' },
    { g: 'amide', p: 'b2', name: 'propanamide', f: 'CH3CH2CONH2' },
    { g: 'nitrile', p: 'b2', name: 'propanenitrile', f: 'CH3CH2CN' },
    { g: 'amine', p: 'b2', name: 'propan-1-amine', f: 'CH3CH2CH2NH2' },
    { g: 'amine', p: 'sec', name: 'propan-2-amine', f: 'CH3CH(NH2)CH3' },
    // With CH₃I (Williamson) or CH₃OH (alkoxymercuration), as in the problems.
    { g: 'ether', via: ['oh-ether'], after: ['*'], name: '2-methoxypropane', f: '(CH3)2CHOCH3' },
    { g: 'ether', via: ['ene-ether'], name: '2-methoxypropane', f: '(CH3)2CHOCH3' },
    { g: 'ether', via: ['oh-ether'], name: '1-methoxypropane', f: 'CH3CH2CH2OCH3' },
    { g: 'ether', name: 'an ether of propanol', text: 'C₃H₇–O–R′' }
  ]};

  F.C4 = { id: 'C4', name: 'butane skeleton', mols: [
    { g: 'alkane', p: 'none3', name: 'butane', f: 'CH3CH2CH2CH3' },
    { g: 'halide-1', p: 'b2', name: '1-bromobutane', f: 'CH3CH2CH2CH2Br' },
    { g: 'halide-2', name: '2-bromobutane', f: 'CH3CH(Br)CH2CH3' },
    { g: 'alcohol-1', p: 'b2', name: 'butan-1-ol', f: 'CH3CH2CH2CH2OH' },
    { g: 'alcohol-2', name: 'butan-2-ol', f: 'CH3CH(OH)CH2CH3' },
    // Hofmann elimination takes the less substituted alkene.
    { g: 'alkene', p: 'mono', via: ['amn-hofmann'], name: 'but-1-ene', f: 'CH2=CHCH2CH3' },
    { g: 'alkene', p: '12', name: 'but-2-ene', f: 'CH3CH=CHCH3' },
    { g: 'alkene', p: 'mono', name: 'but-1-ene', f: 'CH2=CHCH2CH3' },
    { g: 'alkyne', p: 'internal', name: 'but-2-yne', f: 'CH3C#CCH3' },
    { g: 'alkyne', p: 'terminal', name: 'but-1-yne', f: 'HC#CCH2CH3' },
    { g: 'epoxide', p: '12', name: '2,3-dimethyloxirane', text: 'CH₃CH–CHCH₃, closed by an O bridge' },
    { g: 'epoxide', p: 'mono', name: '2-ethyloxirane', text: 'CH₃CH₂CH–CH₂, closed by an O bridge' },
    { g: 'diol', after: ['12'], name: 'butane-2,3-diol', f: 'CH3CH(OH)CH(OH)CH3' },
    { g: 'diol', after: ['mono'], name: 'butane-1,2-diol', f: 'HOCH2CH(OH)CH2CH3' },
    { g: 'aldehyde', p: 'b2', name: 'butanal', f: 'CH3CH2CH2CHO' },
    { g: 'ketone', p: 'methyl', name: 'butanone', f: 'CH3COCH2CH3' },
    { g: 'acid', p: 'b2', name: 'butanoic acid', f: 'CH3CH2CH2COOH' },
    { g: 'acid-chloride', p: 'b2', name: 'butanoyl chloride', f: 'CH3CH2CH2COCl' },
    { g: 'ester', p: 'b2', name: 'a butanoate ester', text: 'CH₃CH₂CH₂COOR′' },
    { g: 'amide', p: 'b2', name: 'butanamide', f: 'CH3CH2CH2CONH2' },
    { g: 'nitrile', p: 'b2', name: 'butanenitrile', f: 'CH3CH2CH2CN' },
    { g: 'amine', p: 'b2', name: 'butan-1-amine', f: 'CH3CH2CH2CH2NH2' },
    { g: 'amine', p: 'sec', name: 'butan-2-amine', f: 'CH3CH(NH2)CH2CH3' }
  ]};

  F.iC4 = { id: 'iC4', name: '2-methylpropane skeleton', mols: [
    { g: 'alkane', p: 'h3', name: '2-methylpropane (isobutane)', f: '(CH3)3CH' },
    { g: 'halide-3', name: '2-bromo-2-methylpropane (tert-butyl bromide)', f: '(CH3)3CBr' },
    { g: 'halide-1', p: 'b1', name: '1-bromo-2-methylpropane', f: '(CH3)2CHCH2Br' },
    { g: 'alcohol-3', name: '2-methylpropan-2-ol (tert-butyl alcohol)', f: '(CH3)3COH' },
    { g: 'alcohol-1', p: 'b1', name: '2-methylpropan-1-ol', f: '(CH3)2CHCH2OH' },
    { g: 'alkene', p: '11', name: '2-methylpropene', f: '(CH3)2C=CH2' },
    { g: 'epoxide', p: '11', name: '2,2-dimethyloxirane', text: '(CH₃)₂C–CH₂, closed by an O bridge' },
    { g: 'diol', name: '2-methylpropane-1,2-diol', f: '(CH3)2C(OH)CH2OH' },
    { g: 'aldehyde', p: 'b1', name: '2-methylpropanal', f: '(CH3)2CHCHO' },
    { g: 'acid', p: 'b1', name: '2-methylpropanoic acid', f: '(CH3)2CHCOOH' },
    { g: 'acid-chloride', p: 'b1', name: '2-methylpropanoyl chloride', f: '(CH3)2CHCOCl' },
    { g: 'ester', p: 'b1', name: 'a 2-methylpropanoate ester', text: '(CH₃)₂CHCOOR′' },
    { g: 'amide', p: 'b1', name: '2-methylpropanamide', f: '(CH3)2CHCONH2' },
    { g: 'nitrile', p: 'b1', name: '2-methylpropanenitrile', f: '(CH3)2CHCN' },
    { g: 'amine', p: 'b1', name: '2-methylpropan-1-amine', f: '(CH3)2CHCH2NH2' },
    { g: 'ether', name: 'an ether', text: 'C₄H₉–O–R′' }
  ]};

  var RING_ALKYNE = 'A six-membered ring has no room for a C≡C: the two carbons of a triple bond and their neighbors need a straight line, 180°.';

  F.cyc = { id: 'cyc', name: 'cyclohexane skeleton', ban: { 'ene-alkyne': RING_ALKYNE }, mols: [
    { g: 'alkane', p: 'none3', name: 'cyclohexane', f: { n: 6 } },
    { g: 'halide-2', name: 'bromocyclohexane', f: { n: 6, subs: { 0: 'Br' } } },
    { g: 'alcohol-2', name: 'cyclohexanol', f: { n: 6, subs: { 0: 'OH' } } },
    { g: 'alkene', p: '12', name: 'cyclohexene', f: { n: 6, unsat: [[0, 1]] } },
    { g: 'ketone', p: 'other', name: 'cyclohexanone', f: { n: 6, ketone: 0 } },
    { g: 'epoxide', p: '12', name: 'cyclohexene oxide', text: 'a cyclohexane ring with an O bridging two neighboring carbons' },
    { g: 'diol', via: ['ene-oso4'], name: 'cis-cyclohexane-1,2-diol', stereo: 'cis', f: { n: 6, subs: { 0: 'OH', 1: 'OH' } } },
    { g: 'diol', via: ['epox-open'], name: 'trans-cyclohexane-1,2-diol', stereo: 'trans', f: { n: 6, subs: { 0: 'OH', 1: 'OH' } } },
    { g: 'amine', p: 'sec', name: 'cyclohexanamine', f: { n: 6, subs: { 0: 'NH2' } } },
    { g: 'ether', name: 'a cyclohexyl ether', text: 'C₆H₁₁–O–R′' }
  ]};

  var BIRCH = 'Birch reduction gives 1,4-cyclohexadiene: the ring stops being aromatic, and nothing in the course takes it back to a substituted benzene.';
  var SNAR = 'SNAr needs a nitro group ortho or para to the halogen to hold the negative charge. Bromobenzene has none, so NaOH does nothing to it under ordinary conditions.';

  F.benz = { id: 'benz', name: 'benzene ring', ban: { 'ar-birch': BIRCH, 'arx-snar': SNAR }, mols: [
    { g: 'arene', name: 'benzene', f: 'benzene' },
    { g: 'nitroarene', name: 'nitrobenzene', f: 'nitrobenzene' },
    { g: 'aniline', name: 'aniline', f: 'aniline' },
    { g: 'diazonium', name: 'benzenediazonium chloride', text: 'C₆H₅–N₂⁺ Cl⁻' },
    { g: 'aryl-halide', name: 'bromobenzene', f: { n: 6, aromatic: true, subs: { 0: 'Br' } } },
    { g: 'phenol', name: 'phenol', f: 'phenol' },
    { g: 'amide', name: 'acetanilide', f: { n: 6, aromatic: true, subs: { 0: 'NHCOCH3' } } },
    { g: 'ether', name: 'anisole (with CH₃I)', f: 'anisole' }
  ]};

  F.benzCOOH = { id: 'benzCOOH', name: 'one carbon on the ring',
    ban: { 'ald-ch2': 'Wolff–Kishner or Clemmensen takes the C=O all the way to CH₃: toluene. That is a step down the ladder you would only climb again (KMnO₄ oxidizes toluene back to benzoic acid), and this trainer does not follow toluene.' }, mols: [
    { g: 'acid', p: 'ar', name: 'benzoic acid', f: 'benzoic acid' },
    { g: 'nitrile', p: 'ar', name: 'benzonitrile', f: { n: 6, aromatic: true, subs: { 0: 'C#N' } } },
    { g: 'amide', p: 'ar', name: 'benzamide', f: { n: 6, aromatic: true, subs: { 0: 'CONH2' } } },
    { g: 'acid-chloride', p: 'ar', name: 'benzoyl chloride', f: { n: 6, aromatic: true, subs: { 0: 'COCl' } } },
    { g: 'ester', p: 'ar', name: 'a benzoate ester', text: 'C₆H₅COOR′' },
    { g: 'aldehyde', p: 'ar', name: 'benzaldehyde', f: 'benzaldehyde' },
    { g: 'alcohol-1', p: 'ar', name: 'benzyl alcohol', f: { n: 6, aromatic: true, subs: { 0: 'CH2OH' } } },
    { g: 'halide-1', p: 'ar', name: 'benzyl bromide', f: { n: 6, aromatic: true, subs: { 0: 'CH2Br' } } },
    { g: 'amine', p: 'ar', name: 'benzylamine', f: { n: 6, aromatic: true, subs: { 0: 'CH2NH2' } } },
    { g: 'alkane', name: 'toluene', f: 'toluene' },
    { g: 'ether', name: 'a benzyl ether', text: 'C₆H₅CH₂–O–R′' }
  ]};

  F.PhEt = { id: 'PhEt', name: 'ethylbenzene skeleton', mols: [
    { g: 'alkylbenzene', name: 'ethylbenzene', f: { n: 6, aromatic: true, subs: { 0: 'CH2CH3' } } },
    { g: 'alkane', name: 'ethylbenzene', f: { n: 6, aromatic: true, subs: { 0: 'CH2CH3' } } },
    { g: 'halide-2', name: '(1-bromoethyl)benzene', f: { n: 6, aromatic: true, subs: { 0: 'CH(Br)CH3' } } },
    { g: 'halide-1', p: 'b2', name: '(2-bromoethyl)benzene', f: { n: 6, aromatic: true, subs: { 0: 'CH2CH2Br' } } },
    { g: 'alkene', p: 'mono', name: 'styrene', f: 'styrene' },
    { g: 'alkyne', p: 'terminal', name: 'phenylacetylene', f: { n: 6, aromatic: true, subs: { 0: 'C#CH' } } },
    { g: 'alcohol-2', name: '1-phenylethanol', f: { n: 6, aromatic: true, subs: { 0: 'CH(OH)CH3' } } },
    { g: 'alcohol-1', p: 'b2', name: '2-phenylethanol', f: { n: 6, aromatic: true, subs: { 0: 'CH2CH2OH' } } },
    { g: 'ketone', p: 'methyl', name: 'acetophenone', f: 'acetophenone' },
    { g: 'aryl-ketone', name: 'acetophenone', f: 'acetophenone' },
    { g: 'aldehyde', p: 'b2', name: 'phenylacetaldehyde', f: { n: 6, aromatic: true, subs: { 0: 'CH2CHO' } } },
    { g: 'acid', p: 'b2', name: 'phenylacetic acid', f: { n: 6, aromatic: true, subs: { 0: 'CH2COOH' } } },
    { g: 'epoxide', p: 'mono', name: 'styrene oxide', text: 'C₆H₅CH–CH₂, closed by an O bridge' },
    { g: 'diol', name: '1-phenylethane-1,2-diol', f: { n: 6, aromatic: true, subs: { 0: 'CH(OH)CH2OH' } } },
    { g: 'amine', p: 'sec', name: '1-phenylethanamine', f: { n: 6, aromatic: true, subs: { 0: 'CH(NH2)CH3' } } },
    { g: 'amine', p: 'b2', name: '2-phenylethanamine', f: { n: 6, aromatic: true, subs: { 0: 'CH2CH2NH2' } } }
  ]};

  F.PhPr = { id: 'PhPr', name: 'propylbenzene skeleton',
    ban: { 'ark-haloform': 'The haloform reaction needs a methyl ketone, ArCOCH₃. Propiophenone has an ethyl group on its C=O, so there is no CH₃ to leave as iodoform.' },
    mols: [
    { g: 'alkylbenzene', via: ['ar-fc-alkyl'], name: 'isopropylbenzene (cumene)', f: { n: 6, aromatic: true, subs: { 0: 'CH(CH3)2' } } },
    { g: 'aryl-ketone', name: 'propiophenone (1-phenylpropan-1-one)', f: { n: 6, aromatic: true, subs: { 0: 'COCH2CH3' } } },
    { g: 'alkylbenzene', name: 'propylbenzene', f: { n: 6, aromatic: true, subs: { 0: 'CH2CH2CH3' } } },
    { g: 'alkane', name: 'propylbenzene', f: { n: 6, aromatic: true, subs: { 0: 'CH2CH2CH3' } } },
    { g: 'alcohol-2', name: '1-phenylpropan-1-ol', f: { n: 6, aromatic: true, subs: { 0: 'CH(OH)CH2CH3' } } },
    { g: 'halide-2', name: '(1-bromopropyl)benzene', f: { n: 6, aromatic: true, subs: { 0: 'CH(Br)CH2CH3' } } },
    { g: 'alkene', p: '12', name: '1-phenylpropene', f: { n: 6, aromatic: true, subs: { 0: 'CH=CHCH3' } } }
  ]};

  F.C5yne = { id: 'C5yne', name: 'pentane skeleton', mols: [
    { g: 'alkyne', p: 'internal', name: 'pent-2-yne', f: 'CH3C#CCH2CH3' },
    { g: 'alkene', p: '12', via: ['yne-lindlar'], name: 'cis-pent-2-ene', stereo: 'cis', f: 'CH3CH=CHCH2CH3' },
    { g: 'alkene', p: '12', via: ['yne-na'], name: 'trans-pent-2-ene', stereo: 'trans', f: 'CH3CH=CHCH2CH3' },
    { g: 'alkane', name: 'pentane', f: 'CH3CH2CH2CH2CH3' },
    { g: 'ketone', name: 'pentan-2-one and pentan-3-one (a mixture)', f: 'CH3COCH2CH2CH3' }
  ]};

  F.C6yne = { id: 'C6yne', name: 'hexane skeleton', mols: [
    { g: 'alkyne', p: 'internal', name: 'hex-3-yne', f: 'CH3CH2C#CCH2CH3' },
    { g: 'alkene', p: '12', via: ['yne-lindlar'], name: 'cis-hex-3-ene', stereo: 'cis', f: 'CH3CH2CH=CHCH2CH3' },
    { g: 'alkene', p: '12', via: ['yne-na'], name: 'trans-hex-3-ene', stereo: 'trans', f: 'CH3CH2CH=CHCH2CH3' },
    { g: 'alkane', name: 'hexane', f: 'CH3CH2CH2CH2CH2CH3' },
    { g: 'ketone', p: 'other', name: 'hexan-3-one', f: 'CH3CH2COCH2CH2CH3' }
  ]};

  var NA_TRANS = 'Na in liquid NH₃ gives the trans (E) alkene: the vinyl anion sits with its R groups apart. The target is cis.';
  var LINDLAR_CIS = 'H₂ on Lindlar’s catalyst adds both H from one face: the cis (Z) alkene. The target is trans.';

  var PROBLEMS = [
    /* ---- Two steps ------------------------------------------------------- */
    { id: 'ipa-npa', fam: F.C3, start: { g: 'alcohol-2' }, target: { g: 'alcohol-1', p: 'b2' },
      hint: 'Moving an OH to the next carbon is two steps: take it off, then put it back where you want it.' },
    { id: 'npa-ipa', fam: F.C3, start: { g: 'alcohol-1', p: 'b2' }, target: { g: 'alcohol-2' } },
    { id: 'tba-iba', fam: F.iC4, start: { g: 'alcohol-3' }, target: { g: 'alcohol-1', p: 'b1' } },
    { id: 'iba-tba', fam: F.iC4, start: { g: 'alcohol-1', p: 'b1' }, target: { g: 'alcohol-3' } },
    { id: 'prbr-propanal', fam: F.C3, start: { g: 'halide-1', p: 'b2' }, target: { g: 'aldehyde', p: 'b2' } },
    { id: 'prbr-propyne', fam: F.C3, start: { g: 'halide-1', p: 'b2' }, target: { g: 'alkyne', p: 'terminal' } },
    { id: 'cyol-cyane', fam: F.cyc, start: { g: 'alcohol-2' }, target: { g: 'alkane', p: 'none3' }, prefer: ['oh2-e1', 'ene-h2'] },
    { id: 'cyone-cyene', fam: F.cyc, start: { g: 'ketone', p: 'other' }, target: { g: 'alkene', p: '12' } },
    { id: 'cyene-transdiol', fam: F.cyc, start: { g: 'alkene', p: '12' },
      target: { g: 'diol', via: ['epox-open'], wrong: { 'ene-oso4': 'OsO₄ adds both oxygens to one face: that is cis-cyclohexane-1,2-diol. The target is trans.' } } },
    { id: 'propene-acid', fam: F.C3, start: { g: 'alkene', p: 'mono' }, target: { g: 'acid', p: 'b2' } },
    { id: 'acid-propanal', fam: F.C3, start: { g: 'acid', p: 'b2' }, target: { g: 'aldehyde', p: 'b2' } },
    { id: 'ipa-amine', fam: F.C3, start: { g: 'alcohol-2' }, target: { g: 'amine', p: 'sec' } },
    { id: 'butene-amine', fam: F.C4, start: { g: 'alkene', p: 'mono' }, target: { g: 'amine', p: 'b2' } },
    { id: 'acetone-ether', fam: F.C3, start: { g: 'ketone', p: 'methyl' }, target: { g: 'ether', name: '2-methoxypropane' }, with: { 'oh-ether': 'CH₃I', 'ene-ether': 'CH₃OH' },
      hint: 'The OCH₃ goes on the middle carbon, where the C=O is now.' },
    { id: 'benz-aniline', fam: F.benz, start: { g: 'arene' }, target: { g: 'aniline' }, prefer: ['ar-nitrate'] },
    { id: 'ethylbenz-styrene', fam: F.PhEt, start: { g: 'alkylbenzene' }, target: { g: 'alkene', p: 'mono' } },

    /* Two steps, one of them a C–C bond. */
    { id: 'propyne-cis', fam: [F.C3, F.C5yne], start: { g: 'alkyne', p: 'terminal' },
      target: { g: 'alkene', p: '12', via: ['yne-lindlar'], wrong: { 'yne-na': NA_TRANS } },
      cc: ['yne-alkylate'], with: { 'yne-alkylate': 'CH₃CH₂Br' },
      ccWhy: 'The target has five carbons in a row: the three of propyne and an ethyl group on the alkyne end.' },
    { id: 'butyne-trans', fam: [F.C4, F.C6yne], start: { g: 'alkyne', p: 'terminal' },
      target: { g: 'alkene', p: '12', via: ['yne-na'], wrong: { 'yne-lindlar': LINDLAR_CIS } },
      cc: ['yne-alkylate'], with: { 'yne-alkylate': 'CH₃CH₂Br' },
      ccWhy: 'The target has six carbons in a row: the four of but-1-yne and an ethyl group on the alkyne end.' },
    { id: 'acid-butanone', fam: [F.C3, F.C4], start: { g: 'acid', p: 'b2' }, target: { g: 'ketone', p: 'methyl' },
      cc: ['acl-gilman', 'nit-grig'], with: { 'acl-gilman': '(CH₃)₂CuLi', 'nit-grig': 'CH₃MgBr' },
      ccWhy: 'The target is the acid’s three carbons plus one methyl on the old C=O carbon.' },
    { id: 'prbr-butanal', fam: [F.C3, F.C4], start: { g: 'halide-1', p: 'b2' }, target: { g: 'aldehyde', p: 'b2' },
      cc: ['rx1-cn', 'grig-hcho', 'grig-co2'], with: { 'grig-hcho': 'HCHO' },
      ccWhy: 'The target has one carbon more than the start, on the end that held the Br.' },
    { id: 'iprbr-isobutanal', fam: [F.C3, F.iC4], start: { g: 'halide-2' }, target: { g: 'aldehyde', p: 'b1' },
      cc: ['grig-hcho', 'grig-co2'], with: { 'grig-hcho': 'HCHO' },
      ccWhy: 'The target has one carbon more than the start, on the carbon that held the Br.' },
    { id: 'acetone-iba', fam: [F.C3, F.iC4], start: { g: 'ketone', p: 'methyl' }, target: { g: 'alcohol-1', p: 'b1' },
      cc: ['ket-grig', 'ket-wittig'], with: { 'ket-grig': 'CH₃MgBr', 'ket-wittig': 'Ph₃P=CH₂' },
      ccWhy: 'The target is acetone’s three carbons plus one more on the old C=O carbon.' },
    { id: 'benz-benzoic', fam: [F.benz, F.benzCOOH], start: { g: 'arene' }, target: { g: 'acid', p: 'ar' }, prefer: ['ar-halogenate'],
      cc: ['arx-grig', 'dz-cn'],
      ccWhy: 'The target has one carbon on the ring, the carboxyl carbon.' },
    { id: 'benz-propylbenz', fam: [F.benz, F.PhPr], start: { g: 'arene' },
      target: { g: 'alkylbenzene',
        wrong: { 'ar-fc-alkyl': '1-Chloropropane with AlCl₃ gives mostly isopropylbenzene: the 1° carbocation shifts a hydride and becomes 2°.' } },
      cc: ['ar-fc-acyl', 'ar-fc-alkyl'], with: { 'ar-fc-acyl': 'CH₃CH₂COCl', 'ar-fc-alkyl': 'CH₃CH₂CH₂Cl' },
      ccWhy: 'The target has a straight three-carbon chain on the ring.' },

    /* ---- Three steps ----------------------------------------------------- */
    { id: 'npa-acetone', fam: F.C3, start: { g: 'alcohol-1', p: 'b2' }, target: { g: 'ketone', p: 'methyl' } },
    { id: 'acetone-npa', fam: F.C3, start: { g: 'ketone', p: 'methyl' }, target: { g: 'alcohol-1', p: 'b2' } },
    { id: 'tbubr-isobutanal', fam: F.iC4, start: { g: 'halide-3' }, target: { g: 'aldehyde', p: 'b1' } },
    { id: 'isobutane-iba', fam: F.iC4, start: { g: 'alkane', p: 'h3' }, target: { g: 'alcohol-1', p: 'b1' },
      hint: 'An alkane has one way in: a radical. Bromine picks the most substituted C–H.' },
    { id: 'cybr-cyone', fam: F.cyc, start: { g: 'halide-2' }, target: { g: 'ketone', p: 'other' }, prefer: ['ene-oxy-2'] },
    { id: 'ethylbenz-phenethyl', fam: F.PhEt, start: { g: 'alkylbenzene' }, target: { g: 'alcohol-1', p: 'b2' } },
    { id: 'acid-amine', fam: F.C4, start: { g: 'acid', p: 'b2' }, target: { g: 'amine', p: 'b2' } },
    { id: 'nitro-bromo', fam: F.benz, start: { g: 'nitroarene' }, target: { g: 'aryl-halide' } },
    { id: 'phbr-benzaldehyde', fam: [F.benz, F.benzCOOH], start: { g: 'aryl-halide' }, target: { g: 'aldehyde', p: 'ar' },
      cc: ['arx-grig'],
      ccWhy: 'The target has one carbon on the ring, where the Br was.' },

    /* ---- Four steps ------------------------------------------------------ */
    { id: 'benz-phenol', fam: F.benz, start: { g: 'arene' }, target: { g: 'phenol' }, prefer: ['ar-nitrate'],
      hint: 'There is no electrophilic “OH⁺”. Put a nitrogen on first: it can be swapped later.' },
    { id: 'cyane-cyone', fam: F.cyc, start: { g: 'alkane', p: 'none3' }, target: { g: 'ketone', p: 'other' }, prefer: ['ene-oxy-2'] },
    { id: 'isobutane-acid', fam: F.iC4, start: { g: 'alkane', p: 'h3' }, target: { g: 'acid', p: 'b1' } }
  ];

  window.OchemSynthesisData = { FAMILIES: F, PROBLEMS: PROBLEMS, WITH: WITH };
})();
