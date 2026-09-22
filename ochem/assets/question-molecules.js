/* Structures for practice-bank questions.

   Every question in ochem/assets/practice-bank.json used to name its
   compounds in words — "2-bromo-2-methylbutane is warmed in aqueous
   ethanol". An exam draws the compound and asks about the drawing, and the
   drawing is doing work the words cannot: which carbon is the stereocenter,
   which face of the ring the methyl sits on, which of two beta positions is
   crowded, how many hydrogens are really on that carbon. A student who can
   only answer from a name has learned to read names.

   So a bank question may carry `"molecule": "<id>"`, and session-runner.js
   draws the record named here above the stem, static, before the options.
   These are the records for those questions. They are the same shape as the
   ones in molecules.js and register into the same lookup table, so svg(),
   get() and everything else resolve them identically — see the note above
   `register` in that file for why they live here rather than there.

   THREE RULES THESE RECORDS FOLLOW, and the reason for each:

   1. NO `role` AND NO `note`. Those fields exist for the interactive
      question kinds, where they mark the answer and explain it. A static
      drawing above a multiple-choice stem must not know which option is
      right. svg() never renders a note, but a role would still be a
      standing invitation for a later change to highlight it.

   2. NO `caption`. svg() DOES render a caption, and a sentence under the
      structure is exactly where an answer leaks out ("two different beta
      hydrogens are available"). The stem says what the question is.
      session-runner.js also passes `caption:''` when it draws a question's
      structure, which covers the records borrowed from molecules.js, where
      captions are a teaching device and perfectly correct; this rule is what
      keeps a caption from being written here in the first place.

   4. THE `name` MUST NOT BE THE ANSWER. It is the record's human title, and
      svg() puts it in the SVG's aria-label — so "(S)-Butan-2-ol" above a stem
      asking for the configuration hands the answer to the one reader who
      cannot see the drawing. session-runner.js therefore overrides the label
      with a neutral one ("Structure for this question" plus the formula), and
      these names are kept answer-free as well, so the record is safe wherever
      it is used. Where the full name is worth recording — the configuration
      the drawing encodes, say — it goes in an `iupac` field, which nothing
      renders.

   3. Hydrogens are drawn only where the question turns on them — a
      stereocenter's H so the wedge/hash can be read, the single tertiary
      H of isobutane, the two hydrogens of a CH2 being compared. Everywhere
      else this is ordinary skeletal shorthand, which check 32 in
      scripts/check-site.mjs knows the difference between: a carbon drawing
      SOME of its hydrogens and falling short of four bonds is an error; a
      carbon drawing none is a convention.

   Stereochemistry is drawn with the renderer's `style:'wedge'` and
   `style:'dash'` bonds, which is enough for a single tetrahedral center
   read in the plane of the page. It is not enough for ring stereochemistry
   or for cis/trans across a double bond, so those are drawn
   geometrically instead — a cis alkene has its two groups placed on the
   same side of the drawn C=C, and a chair is drawn as a real chair. */
(function(){
  var Mo = window.OchemMolecules;
  if(!Mo || !Mo.register) return;

  var Q = {};

  /* A zig-zag carbon chain, c1..cn, alternately low and high — how a
     skeletal structure is drawn. c1 sits on the lower line. */
  function chain(n, x0, y0, dx, dy, r){
    var a = {};
    for(var i=1;i<=n;i++) a['c'+i] = { x:x0 + (i-1)*dx, y:(i%2 ? y0 : y0 - dy), r:r, label:'C' };
    return a;
  }
  function chainBonds(n){
    var b = [];
    for(var i=2;i<=n;i++) b.push({a:'c'+(i-1), b:'c'+i});
    return b;
  }
  function with_(base, extra){ for(var k in extra) base[k] = extra[k]; return base; }

  /* Small letters and locants drawn beside the structure, so a stem can say
     "the carbon marked 2" and the four options can keep naming carbons the
     way the bank already names them. Decor is plain SVG drawn UNDER the
     atoms, so these are placed in open space, never over a circle. */
  function tags(list){
    return list.map(function(t){
      return '<text x="' + t[0] + '" y="' + t[1] + '" text-anchor="middle" font-size="12.5"' +
             ' font-weight="700" fill="var(--muted)">' + t[2] + '</text>';
    }).join('');
  }
  // A row of locants along the bottom of a zig-zag chain, one under each carbon.
  function locants(n, x0, dx, y, start, step){
    var out = [];
    for(var i=0;i<n;i++) out.push([x0 + i*dx, y, String(start + i*(step || 1))]);
    return tags(out);
  }

  /* ---- Substitution and elimination substrates ------------------------ */

  // (S)-1-methoxy-2-bromopropane skeleton: CH3-CHBr-CH2OCH3. The hydrogen is
  // on a hash, so the three remaining groups can be read as drawn. With Br
  // up, CH2OCH3 to the lower LEFT and CH3 to the lower right, 1->2->3 runs
  // counterclockwise: S.
  Q['q-sn2-methoxy-bromide'] = {
    name: '2-Bromo-1-methoxypropane', iupac: '(S)-2-bromo-1-methoxypropane',
    formula: 'CH₃CHBrCH₂OCH₃',
    atoms: {
      c2:  { x:200, y:92, r:16, label:'C' },
      br:  { x:200, y:34, r:17, label:'Br', lp:3 },
      h:   { x:200, y:148,r:11, label:'H' },
      ch2: { x:146, y:124,r:15, label:'C' },
      o:   { x:96,  y:100,r:16, label:'O', lp:2 },
      ome: { x:46,  y:124,r:15, label:'C' },
      me:  { x:254, y:124,r:15, label:'C' }
    },
    bonds: [{a:'c2',b:'br'},{a:'c2',b:'h',style:'dash'},{a:'c2',b:'ch2'},{a:'c2',b:'me'},
            {a:'ch2',b:'o'},{a:'o',b:'ome'}]
  };

  Q['q-neopentyl-bromide'] = {
    name: 'Neopentyl bromide', formula: '(CH₃)₃CCH₂Br',
    atoms: {
      cq:  { x:150, y:96, r:16, label:'C' },
      m1:  { x:96,  y:60, r:15, label:'C' },
      m2:  { x:150, y:38, r:15, label:'C' },
      m3:  { x:96,  y:132,r:15, label:'C' },
      ch2: { x:212, y:64, r:15, label:'C' },
      br:  { x:266, y:100,r:17, label:'Br', lp:3 }
    },
    bonds: [{a:'cq',b:'m1'},{a:'cq',b:'m2'},{a:'cq',b:'m3'},{a:'cq',b:'ch2'},{a:'ch2',b:'br'}]
  };

  Q['q-3-bromobut-1-ene'] = {
    name: '3-Bromobut-1-ene', formula: 'CH₂=CHCHBrCH₃',
    decor: locants(4, 60, 52, 152, 1),
    atoms: with_(chain(4, 60, 110, 52, 32, 15), { br:{ x:164, y:44, r:17, label:'Br', lp:3 } }),
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4'},{a:'c3',b:'br'}]
  };

  Q['q-3-chlorobut-1-ene'] = {
    name: '3-Chlorobut-1-ene', formula: 'CH₂=CHCHClCH₃',
    decor: locants(4, 60, 52, 152, 1),
    atoms: with_(chain(4, 60, 110, 52, 32, 15), { cl:{ x:164, y:44, r:16, label:'Cl', lp:3 } }),
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4'},{a:'c3',b:'cl'}]
  };

  Q['q-3-methylbutan-2-ol'] = {
    name: '3-Methylbutan-2-ol', formula: 'CH₃CH(OH)CH(CH₃)₂',
    atoms: {
      c1: { x:50,  y:110,r:15, label:'C' },
      c2: { x:100, y:78, r:16, label:'C' },
      o:  { x:100, y:32, r:16, label:'O', lp:2 },
      ho: { x:146, y:12, r:11, label:'H' },
      c3: { x:150, y:110,r:16, label:'C' },
      c4: { x:200, y:78, r:15, label:'C' },
      me: { x:150, y:150,r:15, label:'C' }
    },
    bonds: [{a:'c1',b:'c2'},{a:'c2',b:'o'},{a:'o',b:'ho'},{a:'c2',b:'c3'},{a:'c3',b:'c4'},{a:'c3',b:'me'}]
  };

  Q['q-tert-butyl-bromide'] = {
    name: '2-Bromo-2-methylpropane', formula: '(CH₃)₃CBr',
    atoms: {
      c:  { x:160, y:96, r:16, label:'C' },
      br: { x:160, y:150,r:17, label:'Br', lp:3 },
      m1: { x:106, y:62, r:15, label:'C' },
      m2: { x:214, y:62, r:15, label:'C' },
      m3: { x:160, y:40, r:15, label:'C' }
    },
    bonds: [{a:'c',b:'br'},{a:'c',b:'m1'},{a:'c',b:'m2'},{a:'c',b:'m3'}]
  };

  Q['q-3-bromo-2,2-dimethylbutane'] = {
    name: '3-Bromo-2,2-dimethylbutane', formula: '(CH₃)₃CCHBrCH₃',
    atoms: {
      cq: { x:120, y:96, r:16, label:'C' },
      m1: { x:66,  y:62, r:15, label:'C' },
      m2: { x:120, y:40, r:15, label:'C' },
      m3: { x:66,  y:130,r:15, label:'C' },
      c3: { x:182, y:64, r:16, label:'C' },
      br: { x:182, y:20, r:17, label:'Br', lp:3 },
      c4: { x:240, y:96, r:15, label:'C' }
    },
    bonds: [{a:'cq',b:'m1'},{a:'cq',b:'m2'},{a:'cq',b:'m3'},{a:'cq',b:'c3'},{a:'c3',b:'br'},{a:'c3',b:'c4'}]
  };

  Q['q-3-chloro-3-methylpentane'] = {
    name: '3-Chloro-3-methylpentane', formula: 'CH₃CH₂CCl(CH₃)CH₂CH₃',
    atoms: with_(chain(5, 40, 104, 50, 32, 15), {
      c3: { x:140, y:104,r:16, label:'C' },
      cl: { x:140, y:148,r:16, label:'Cl', lp:3 },
      me: { x:140, y:60, r:15, label:'C' }
    }),
    bonds: chainBonds(5).concat([{a:'c3',b:'cl'},{a:'c3',b:'me'}])
  };

  Q['q-2-bromo-2-methylbutane'] = {
    name: '2-Bromo-2-methylbutane', formula: 'CH₃CBr(CH₃)CH₂CH₃',
    atoms: {
      c1: { x:76,  y:58, r:15, label:'C' },
      c2: { x:130, y:90, r:16, label:'C' },
      br: { x:130, y:36, r:17, label:'Br', lp:3 },
      me: { x:130, y:146,r:15, label:'C' },
      c3: { x:184, y:58, r:15, label:'C' },
      c4: { x:238, y:90, r:15, label:'C' }
    },
    bonds: [{a:'c1',b:'c2'},{a:'c2',b:'br'},{a:'c2',b:'me'},{a:'c2',b:'c3'},{a:'c3',b:'c4'}]
  };

  /* Bromocyclohexane drawn as a real chair with the bromine EQUATORIAL —
     the conformation the question starts from. Same construction as
     chair-bromocyclohexane and chair-dimethylcyclohexane in molecules.js:
     three pairs of parallel edges, the two tips at r5 (highest) and r2
     (lowest), and the axial direction alternating round the ring — UP at r1,
     r3, r5 and DOWN at r2, r4, r6.

     The vertices are stretched vertically against those two records (tips 40px
     clear of their neighbours instead of 26) because this drawing is the whole
     question: at the width a phone gives a question card, the shallower chair
     read as a flat hexagon and axial could not be told from equatorial at all.
     For the same reason the bromine now leaves r4 on a full-length bond out
     and slightly UP (equatorial, roughly parallel to the r5–r6 edge) while
     r4's axial hydrogen drops straight DOWN on a normal-weight bond — the
     faint style it used before was invisible at that size — and r1's axial
     hydrogen is drawn pointing straight UP, so the alternation that makes a
     ring flip necessary is visible rather than asserted. (r3's axial hydrogen
     would be the tidier partner, but r5 sits directly above r3 and the two
     circles would overlap.) */
  Q['q-chair-bromocyclohexane-eq'] = {
    name: 'Bromocyclohexane (chair conformation)', formula: 'C₆H₁₁Br', viewBox: '0 0 320 190',
    partialH: 'chair: only the axial hydrogens that show which direction is axial are drawn',
    atoms: {
      r1: { x:56,  y:116,r:13, label:'C' },
      r2: { x:112, y:156,r:13, label:'C' },
      r3: { x:184, y:132,r:13, label:'C' },
      r4: { x:240, y:96, r:13, label:'C' },
      r5: { x:184, y:56, r:13, label:'C' },
      r6: { x:112, y:80, r:13, label:'C' },
      br: { x:289, y:80, r:16, label:'Br', lp:3 },
      hax4:{ x:240, y:150,r:11, label:'H' },
      hax1:{ x:56,  y:72, r:11, label:'H' }
    },
    bonds: [{a:'r1',b:'r2'},{a:'r2',b:'r3'},{a:'r3',b:'r4'},{a:'r4',b:'r5'},{a:'r5',b:'r6'},{a:'r6',b:'r1'},
            {a:'r4',b:'br'},{a:'r4',b:'hax4'},{a:'r1',b:'hax1'}]
  };

  Q['q-cyclohexyl-bromide'] = {
    name: 'Cyclohexyl bromide', formula: 'C₆H₁₁Br', viewBox: '0 0 320 180',
    atoms: {
      p1: { x:150, y:44, r:14, label:'C' },
      p2: { x:190, y:67, r:14, label:'C' },
      p3: { x:190, y:113,r:14, label:'C' },
      p4: { x:150, y:136,r:14, label:'C' },
      p5: { x:110, y:113,r:14, label:'C' },
      p6: { x:110, y:67, r:14, label:'C' },
      br: { x:236, y:44, r:17, label:'Br', lp:3 }
    },
    bonds: [{a:'p1',b:'p2'},{a:'p2',b:'p3'},{a:'p3',b:'p4'},{a:'p4',b:'p5'},{a:'p5',b:'p6'},{a:'p6',b:'p1'},
            {a:'p2',b:'br'}]
  };

  /* ---- Alkenes and additions ------------------------------------------ */

  Q['q-2-methylbut-2-ene'] = {
    name: '2-Methylbut-2-ene', formula: '(CH₃)₂C=CHCH₃',
    atoms: {
      me1: { x:96,  y:50, r:15, label:'C' },
      me2: { x:96,  y:110,r:15, label:'C' },
      c2:  { x:150, y:80, r:16, label:'C' },
      c3:  { x:204, y:110,r:16, label:'C' },
      c4:  { x:258, y:80, r:15, label:'C' }
    },
    bonds: [{a:'c2',b:'me1'},{a:'c2',b:'me2'},{a:'c2',b:'c3',order:2},{a:'c3',b:'c4'}]
  };

  // C1 bears the methyl, C2 is the other end of the double bond.
  Q['q-1-methylcyclohexene'] = {
    name: '1-Methylcyclohexene', formula: 'C₇H₁₂', viewBox: '0 0 320 190',
    decor: tags([[127,48,'1'],[220,72,'2']]),
    atoms: {
      p1: { x:150, y:58, r:14, label:'C' },
      p2: { x:190, y:81, r:14, label:'C' },
      p3: { x:190, y:127,r:14, label:'C' },
      p4: { x:150, y:150,r:14, label:'C' },
      p5: { x:110, y:127,r:14, label:'C' },
      p6: { x:110, y:81, r:14, label:'C' },
      me: { x:150, y:20, r:15, label:'C' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4'},{a:'p4',b:'p5'},{a:'p5',b:'p6'},
            {a:'p6',b:'p1'},{a:'p1',b:'me'}]
  };

  Q['q-33-dimethylbut-1-ene'] = {
    name: '3,3-Dimethylbut-1-ene', formula: 'CH₂=CHC(CH₃)₃',
    atoms: {
      c1: { x:46,  y:104,r:15, label:'C' },
      c2: { x:96,  y:72, r:15, label:'C' },
      cq: { x:150, y:100,r:16, label:'C' },
      m1: { x:150, y:150,r:15, label:'C' },
      m2: { x:204, y:66, r:15, label:'C' },
      m3: { x:204, y:134,r:15, label:'C' }
    },
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'cq'},{a:'cq',b:'m1'},{a:'cq',b:'m2'},{a:'cq',b:'m3'}]
  };

  /* cis-But-2-ene. The geometry IS the question, so both vinyl hydrogens are
     drawn: the two methyls sit above the C=C and the two hydrogens below,
     which is what "cis" means and what a name cannot show. */
  Q['q-cis-but-2-ene'] = {
    name: 'cis-But-2-ene', formula: 'CH₃CH=CHCH₃',
    atoms: {
      c2:  { x:120, y:92, r:16, label:'C' },
      c3:  { x:200, y:92, r:16, label:'C' },
      me1: { x:84,  y:52, r:15, label:'C' },
      me2: { x:236, y:52, r:15, label:'C' },
      h2:  { x:84,  y:132,r:11, label:'H' },
      h3:  { x:236, y:132,r:11, label:'H' }
    },
    bonds: [{a:'c2',b:'c3',order:2},{a:'c2',b:'me1'},{a:'c3',b:'me2'},{a:'c2',b:'h2'},{a:'c3',b:'h3'}]
  };

  Q['q-oct-1-ene'] = {
    name: 'Oct-1-ene', formula: 'CH₂=CH(CH₂)₅CH₃',
    atoms: chain(8, 24, 110, 38, 28, 15),
    bonds: [{a:'c1',b:'c2',order:2}].concat(chainBonds(8).slice(1))
  };

  Q['q-2-methyl-23-epoxybutane'] = {
    name: '2-Methyl-2,3-epoxybutane', formula: 'C₅H₁₀O',
    atoms: {
      c2: { x:126, y:110,r:16, label:'C' },
      c3: { x:194, y:110,r:16, label:'C' },
      o:  { x:160, y:62, r:16, label:'O', lp:2 },
      m1: { x:72,  y:142,r:15, label:'C' },
      m2: { x:72,  y:78, r:15, label:'C' },
      m3: { x:248, y:142,r:15, label:'C' }
    },
    bonds: [{a:'c2',b:'c3'},{a:'c2',b:'o'},{a:'c3',b:'o'},{a:'c2',b:'m1'},{a:'c2',b:'m2'},{a:'c3',b:'m3'}]
  };

  Q['q-22-dimethyloxirane'] = {
    name: '2,2-Dimethyloxirane', formula: 'C₄H₈O',
    atoms: {
      c2: { x:126, y:110,r:16, label:'C' },
      c3: { x:194, y:110,r:16, label:'C' },
      o:  { x:160, y:62, r:16, label:'O', lp:2 },
      m1: { x:72,  y:142,r:15, label:'C' },
      m2: { x:72,  y:78, r:15, label:'C' }
    },
    bonds: [{a:'c2',b:'c3'},{a:'c2',b:'o'},{a:'c3',b:'o'},{a:'c2',b:'m1'},{a:'c2',b:'m2'}]
  };

  /* ---- Alcohols and stereocenters ------------------------------------- */

  Q['q-33-dimethylbutan-2-ol'] = {
    name: '3,3-Dimethylbutan-2-ol', formula: 'CH₃CH(OH)C(CH₃)₃', viewBox: '0 0 320 190',
    atoms: {
      c2: { x:116, y:104,r:16, label:'C' },
      o:  { x:66,  y:70, r:16, label:'O', lp:2 },
      ho: { x:30,  y:44, r:11, label:'H' },
      c1: { x:116, y:154,r:15, label:'C' },
      cq: { x:176, y:70, r:16, label:'C' },
      m1: { x:176, y:20, r:15, label:'C' },
      m2: { x:230, y:44, r:15, label:'C' },
      m3: { x:230, y:100,r:15, label:'C' }
    },
    bonds: [{a:'c2',b:'o'},{a:'o',b:'ho'},{a:'c2',b:'c1'},{a:'c2',b:'cq'},
            {a:'cq',b:'m1'},{a:'cq',b:'m2'},{a:'cq',b:'m3'}]
  };

  /* (S)-butan-2-ol, drawn exactly as the question describes it: OH up, ethyl
     to the lower left, methyl to the lower right, H on a hash. With the
     hydrogen pointing away, OH -> ethyl -> methyl runs counterclockwise. */
  Q['q-S-butan-2-ol'] = {
    name: 'Butan-2-ol', iupac: '(S)-butan-2-ol', formula: 'CH₃CH(OH)CH₂CH₃',
    atoms: {
      c2:  { x:160, y:92, r:17, label:'C' },
      o:   { x:160, y:34, r:16, label:'O', lp:2 },
      ho:  { x:206, y:14, r:11, label:'H' },
      h:   { x:160, y:150,r:11, label:'H' },
      ce1: { x:96,  y:126,r:15, label:'C' },
      ce2: { x:42,  y:96, r:15, label:'C' },
      cm:  { x:224, y:126,r:15, label:'C' }
    },
    bonds: [{a:'c2',b:'o'},{a:'o',b:'ho'},{a:'c2',b:'h',style:'dash'},
            {a:'c2',b:'ce1'},{a:'ce1',b:'ce2'},{a:'c2',b:'cm'}]
  };

  // The four groups named by the question, drawn as groups rather than atoms.
  Q['q-stereocenter-oh-nh2-ch3'] = {
    name: 'A tetrahedral stereocenter', formula: 'CH₃CH(OH)NH₂',
    atoms: {
      c:  { x:160, y:92, r:17, label:'C' },
      o:  { x:160, y:34, r:16, label:'O', lp:2 },
      ho: { x:206, y:14, r:11, label:'H' },
      n:  { x:96,  y:126,r:18, label:'NH₂' },
      me: { x:224, y:126,r:18, label:'CH₃' },
      h:  { x:160, y:150,r:11, label:'H' }
    },
    bonds: [{a:'c',b:'o'},{a:'o',b:'ho'},{a:'c',b:'n'},{a:'c',b:'me'},{a:'c',b:'h',style:'dash'}]
  };

  /* Glyceraldehyde as the question draws it: OH up, CHO lower left, CH₂OH
     lower right, and the hydrogen on a WEDGE — which is the whole point,
     because the trace then has to be reversed. */
  Q['q-glyceraldehyde-wedge'] = {
    name: 'Glyceraldehyde', formula: 'OHC-CH(OH)-CH₂OH',
    atoms: {
      c2:  { x:160, y:92, r:17, label:'C' },
      o:   { x:160, y:34, r:16, label:'O', lp:2 },
      ho:  { x:206, y:14, r:11, label:'H' },
      cho: { x:92,  y:126,r:18, label:'CHO' },
      ch2: { x:230, y:126,r:20, label:'CH₂OH' },
      h:   { x:160, y:150,r:11, label:'H' }
    },
    bonds: [{a:'c2',b:'o'},{a:'o',b:'ho'},{a:'c2',b:'cho'},{a:'c2',b:'ch2'},{a:'c2',b:'h',style:'wedge'}]
  };

  // 2-Chloropropane with Cl on a wedge and H on a hash: the mirror plane the
  // question is asking about runs vertically through Cl, C and H.
  Q['q-2-chloropropane-wedge'] = {
    name: '2-Chloropropane', formula: '(CH₃)₂CHCl',
    atoms: {
      c:  { x:160, y:92, r:17, label:'C' },
      cl: { x:160, y:34, r:17, label:'Cl', lp:3 },
      h:  { x:160, y:150,r:11, label:'H' },
      m1: { x:96,  y:126,r:15, label:'C' },
      m2: { x:224, y:126,r:15, label:'C' }
    },
    bonds: [{a:'c',b:'cl',style:'wedge'},{a:'c',b:'h',style:'dash'},{a:'c',b:'m1'},{a:'c',b:'m2'}]
  };

  Q['q-3-methylhexane'] = {
    name: '3-Methylhexane', formula: 'C₇H₁₆',
    decor: locants(6, 34, 50, 34, 1),
    atoms: with_(chain(6, 34, 100, 50, 32, 15), { me:{ x:134, y:140, r:15, label:'C' } }),
    bonds: chainBonds(6).concat([{a:'c3',b:'me'}])
  };

  Q['q-3-methylpentane'] = {
    name: '3-Methylpentane', formula: 'C₆H₁₄',
    decor: locants(5, 48, 56, 34, 1),
    atoms: with_(chain(5, 48, 104, 56, 34, 15), { me:{ x:160, y:146, r:15, label:'C' } }),
    bonds: chainBonds(5).concat([{a:'c3',b:'me'}])
  };

  Q['q-2-bromobutane-numbered'] = {
    name: '2-Bromobutane', formula: 'CH₃CHBrCH₂CH₃',
    decor: locants(4, 60, 52, 152, 1),
    atoms: with_(chain(4, 60, 110, 52, 32, 15), { br:{ x:112, y:26, r:17, label:'Br', lp:3 } }),
    bonds: chainBonds(4).concat([{a:'c2',b:'br'}])
  };

  /* 2-Bromobutane again, this time with the two hydrogens on C3 drawn on a
     wedge and a hash — they are the pair the substitution test is run on, so
     they have to be distinguishable and they have to be visible.

     C2's bromine is on a wedge too. The question's options name the two
     products as (2R,3R) and (2R,3S), which is only true of a drawing that
     fixes C2; with a plain C2–Br bond the picture left that centre open and
     the options asserted something it did not show. As drawn — Br toward the
     viewer at the top, C3 to the lower right, C1 to the lower left, the
     implicit H pointing back — Br > C3 > C1 runs clockwise: 2R. The locant
     "3" sits directly above C3 (it used to sit beside C4). */
  Q['q-2-bromobutane-c3-h'] = {
    name: '2-Bromobutane', formula: 'CH₃CHBrCH₂CH₃',
    partialH: 'only the two hydrogens on C3 are drawn: they are the pair the question compares',
    decor: tags([[86,64,'2'],[160,72,'3']]),
    atoms: {
      c1: { x:56,  y:112,r:15, label:'C' },
      c2: { x:108, y:80, r:16, label:'C' },
      br: { x:108, y:28, r:17, label:'Br', lp:3 },
      c3: { x:160, y:112,r:16, label:'C' },
      c4: { x:212, y:80, r:15, label:'C' },
      ha: { x:136, y:152,r:11, label:'H' },
      hb: { x:196, y:150,r:11, label:'H' }
    },
    bonds: [{a:'c1',b:'c2'},{a:'c2',b:'br',style:'wedge'},{a:'c2',b:'c3'},{a:'c3',b:'c4'},
            {a:'c3',b:'ha',style:'wedge'},{a:'c3',b:'hb',style:'dash'}]
  };

  Q['q-12-dimethylcyclohexane'] = {
    name: '1,2-Dimethylcyclohexane', formula: 'C₈H₁₆', viewBox: '0 0 320 190',
    decor: tags([[124,52,'1'],[214,96,'2'],[214,152,'3'],[150,182,'4'],[86,152,'5'],[86,96,'6']]),
    atoms: {
      p1: { x:150, y:66, r:14, label:'C' },
      p2: { x:188, y:88, r:14, label:'C' },
      p3: { x:188, y:132,r:14, label:'C' },
      p4: { x:150, y:154,r:14, label:'C' },
      p5: { x:112, y:132,r:14, label:'C' },
      p6: { x:112, y:88, r:14, label:'C' },
      me1:{ x:150, y:22, r:18, label:'CH₃' },
      me2:{ x:226, y:66, r:18, label:'CH₃' }
    },
    bonds: [{a:'p1',b:'p2'},{a:'p2',b:'p3'},{a:'p3',b:'p4'},{a:'p4',b:'p5'},{a:'p5',b:'p6'},{a:'p6',b:'p1'},
            {a:'p1',b:'me1'},{a:'p2',b:'me2'}]
  };

  /* ---- Alkene geometry ------------------------------------------------ */

  // CH3-C(Br)=CH-CH3 with the two methyl groups on OPPOSITE sides. Drawn, not
  // asserted: the methyls sit above-left and below-right of the C=C.
  Q['q-2-bromobut-2-ene'] = {
    name: '2-Bromobut-2-ene', formula: 'CH₃C(Br)=CHCH₃',
    decor: tags([[120,66,'2'],[200,66,'3']]),
    atoms: {
      c2:  { x:120, y:96, r:16, label:'C' },
      c3:  { x:200, y:96, r:16, label:'C' },
      me1: { x:84,  y:56, r:15, label:'C' },
      br:  { x:84,  y:136,r:17, label:'Br', lp:3 },
      me2: { x:236, y:136,r:15, label:'C' },
      h3:  { x:236, y:56, r:11, label:'H' }
    },
    bonds: [{a:'c2',b:'c3',order:2},{a:'c2',b:'me1'},{a:'c2',b:'br'},{a:'c3',b:'me2'},{a:'c3',b:'h3'}]
  };

  // CH3-CH=CBrCl with the chlorine on the SAME side as the methyl.
  Q['q-1-bromo-1-chloropropene'] = {
    name: '1-Bromo-1-chloropropene', formula: 'CH₃CH=CBrCl',
    atoms: {
      c2:  { x:120, y:96, r:16, label:'C' },
      c1:  { x:200, y:96, r:16, label:'C' },
      me:  { x:84,  y:56, r:15, label:'C' },
      h2:  { x:84,  y:136,r:11, label:'H' },
      cl:  { x:236, y:56, r:16, label:'Cl', lp:3 },
      br:  { x:236, y:136,r:17, label:'Br', lp:3 }
    },
    bonds: [{a:'c2',b:'c1',order:2},{a:'c2',b:'me'},{a:'c2',b:'h2'},{a:'c1',b:'cl'},{a:'c1',b:'br'}]
  };

  // 3-Methylpent-2-ene with the C1 methyl and the C3 ethyl on the SAME side.
  Q['q-3-methylpent-2-ene'] = {
    name: '3-Methylpent-2-ene', formula: 'CH₃CH=C(CH₃)CH₂CH₃',
    decor: tags([[62,40,'1'],[120,66,'2'],[200,66,'3']]),
    atoms: {
      c2:  { x:120, y:96, r:16, label:'C' },
      c3:  { x:200, y:96, r:16, label:'C' },
      c1:  { x:84,  y:56, r:15, label:'C' },
      h2:  { x:84,  y:136,r:11, label:'H' },
      c4:  { x:236, y:56, r:15, label:'C' },
      c5:  { x:282, y:86, r:15, label:'C' },
      me:  { x:236, y:136,r:15, label:'C' }
    },
    bonds: [{a:'c2',b:'c3',order:2},{a:'c2',b:'c1'},{a:'c2',b:'h2'},
            {a:'c3',b:'c4'},{a:'c4',b:'c5'},{a:'c3',b:'me'}]
  };

  /* ---- Carbonyls ------------------------------------------------------ */

  Q['q-chloral'] = {
    name: 'Trichloroacetaldehyde (chloral)', formula: 'CCl₃CHO',
    atoms: {
      ccl:  { x:120, y:96, r:16, label:'C' },
      cl1:  { x:66,  y:62, r:16, label:'Cl', lp:3 },
      cl2:  { x:66,  y:130,r:16, label:'Cl', lp:3 },
      cl3:  { x:120, y:150,r:16, label:'Cl', lp:3 },
      cald: { x:182, y:64, r:16, label:'C' },
      o:    { x:236, y:36, r:17, label:'O', lp:2 },
      h:    { x:182, y:116,r:11, label:'H' }
    },
    bonds: [{a:'ccl',b:'cl1'},{a:'ccl',b:'cl2'},{a:'ccl',b:'cl3'},{a:'ccl',b:'cald'},
            {a:'cald',b:'o',order:2},{a:'cald',b:'h'}]
  };

  Q['q-butan-2-one'] = {
    name: 'Butan-2-one', formula: 'CH₃COCH₂CH₃',
    atoms: {
      c1: { x:56,  y:112,r:15, label:'C' },
      c2: { x:112, y:80, r:16, label:'C' },
      o:  { x:112, y:28, r:17, label:'O', lp:2 },
      c3: { x:168, y:112,r:15, label:'C' },
      c4: { x:224, y:80, r:15, label:'C' }
    },
    bonds: [{a:'c1',b:'c2'},{a:'c2',b:'o',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4'}]
  };

  Q['q-2-phenylbutan-2-ol'] = {
    name: '2-Phenylbutan-2-ol', formula: 'C₆H₅C(OH)(CH₃)CH₂CH₃', viewBox: '0 0 320 190',
    atoms: {
      p1: { x:80,  y:60, r:13, label:'C' },
      p2: { x:115, y:80, r:13, label:'C' },
      p3: { x:115, y:120,r:13, label:'C' },
      p4: { x:80,  y:140,r:13, label:'C' },
      p5: { x:45,  y:120,r:13, label:'C' },
      p6: { x:45,  y:80, r:13, label:'C' },
      c:  { x:180, y:120,r:16, label:'C' },
      o:  { x:180, y:70, r:16, label:'O', lp:2 },
      ho: { x:216, y:44, r:11, label:'H' },
      me: { x:180, y:170,r:15, label:'C' },
      ce1:{ x:240, y:148,r:15, label:'C' },
      ce2:{ x:292, y:120,r:14, label:'C' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},
            {a:'p3',b:'c'},{a:'c',b:'o'},{a:'o',b:'ho'},{a:'c',b:'me'},{a:'c',b:'ce1'},{a:'ce1',b:'ce2'}]
  };

  // 4-Oxopentanal: one aldehyde, one ketone, in one molecule.
  Q['q-oxopentanal'] = {
    name: '4-Oxopentanal', formula: 'OHC(CH₂)₂COCH₃',
    atoms: with_(chain(5, 36, 110, 56, 34, 15), {
      o1: { x:36,  y:56, r:17, label:'O', lp:2 },
      o2: { x:204, y:26, r:17, label:'O', lp:2 }
    }),
    bonds: chainBonds(5).concat([{a:'c1',b:'o1',order:2},{a:'c4',b:'o2',order:2}])
  };

  // 2,2-Dimethyl-1,3-dioxolane: the cyclic acetal of acetone.
  Q['q-cyclic-acetal'] = {
    name: '2,2-Dimethyl-1,3-dioxolane', formula: 'C₅H₁₀O₂',
    atoms: {
      ca:  { x:120, y:96, r:16, label:'C' },
      o1:  { x:120, y:46, r:16, label:'O', lp:2 },
      o2:  { x:120, y:146,r:16, label:'O', lp:2 },
      ch2a:{ x:178, y:64, r:15, label:'C' },
      ch2b:{ x:178, y:128,r:15, label:'C' },
      m1:  { x:62,  y:64, r:15, label:'C' },
      m2:  { x:62,  y:128,r:15, label:'C' }
    },
    bonds: [{a:'ca',b:'o1'},{a:'ca',b:'o2'},{a:'o1',b:'ch2a'},{a:'ch2a',b:'ch2b'},{a:'ch2b',b:'o2'},
            {a:'ca',b:'m1'},{a:'ca',b:'m2'}]
  };

  Q['q-acetic-anhydride'] = {
    name: 'Acetic anhydride', formula: '(CH₃CO)₂O',
    atoms: {
      c1:  { x:50,  y:110,r:15, label:'C' },
      c2:  { x:104, y:80, r:16, label:'C' },
      o1:  { x:104, y:30, r:17, label:'O', lp:2 },
      obr: { x:160, y:110,r:16, label:'O', lp:2 },
      c3:  { x:216, y:80, r:16, label:'C' },
      o2:  { x:216, y:30, r:17, label:'O', lp:2 },
      c4:  { x:270, y:110,r:15, label:'C' }
    },
    bonds: [{a:'c1',b:'c2'},{a:'c2',b:'o1',order:2},{a:'c2',b:'obr'},
            {a:'obr',b:'c3'},{a:'c3',b:'o2',order:2},{a:'c3',b:'c4'}]
  };

  Q['q-propanoyl-chloride'] = {
    name: 'Propanoyl chloride', formula: 'CH₃CH₂COCl',
    atoms: {
      c1: { x:60,  y:112,r:15, label:'C' },
      c2: { x:116, y:80, r:15, label:'C' },
      c3: { x:172, y:112,r:16, label:'C' },
      o:  { x:172, y:58, r:17, label:'O', lp:2 },
      cl: { x:228, y:140,r:16, label:'Cl', lp:3 }
    },
    bonds: [{a:'c1',b:'c2'},{a:'c2',b:'c3'},{a:'c3',b:'o',order:2},{a:'c3',b:'cl'}]
  };

  Q['q-2-methylpent-2-enal'] = {
    name: '2-Methylpent-2-enal', formula: 'CH₃CH₂CH=C(CH₃)CHO',
    atoms: {
      c5: { x:40,  y:110,r:15, label:'C' },
      c4: { x:90,  y:78, r:15, label:'C' },
      c3: { x:140, y:110,r:15, label:'C' },
      c2: { x:190, y:78, r:16, label:'C' },
      c1: { x:240, y:110,r:16, label:'C' },
      o:  { x:240, y:58, r:17, label:'O', lp:2 },
      me: { x:190, y:28, r:15, label:'C' }
    },
    bonds: [{a:'c5',b:'c4'},{a:'c4',b:'c3'},{a:'c3',b:'c2',order:2},{a:'c2',b:'c1'},
            {a:'c1',b:'o',order:2},{a:'c2',b:'me'}]
  };

  Q['q-heptanedial'] = {
    name: 'Heptanedial', formula: 'OHC(CH₂)₅CHO',
    atoms: with_(chain(7, 30, 104, 42, 30, 14), {
      o1: { x:30,  y:52, r:16, label:'O', lp:2 },
      o7: { x:282, y:52, r:16, label:'O', lp:2 }
    }),
    bonds: chainBonds(7).concat([{a:'c1',b:'o1',order:2},{a:'c7',b:'o7',order:2}])
  };

  Q['q-ethyl-propanoate'] = {
    name: 'Ethyl propanoate', formula: 'CH₃CH₂CO₂CH₂CH₃',
    atoms: {
      c1:  { x:34,  y:110,r:15, label:'C' },
      c2:  { x:84,  y:78, r:15, label:'C' },
      c3:  { x:134, y:110,r:16, label:'C' },
      o1:  { x:134, y:58, r:17, label:'O', lp:2 },
      o2:  { x:190, y:140,r:16, label:'O', lp:2 },
      ce1: { x:244, y:110,r:15, label:'C' },
      ce2: { x:294, y:140,r:14, label:'C' }
    },
    bonds: [{a:'c1',b:'c2'},{a:'c2',b:'c3'},{a:'c3',b:'o1',order:2},{a:'c3',b:'o2'},
            {a:'o2',b:'ce1'},{a:'ce1',b:'ce2'}]
  };

  Q['q-4-hydroxy-4-phenylbutan-2-one'] = {
    name: '4-Hydroxy-4-phenylbutan-2-one', formula: 'PhCH(OH)CH₂COCH₃',
    atoms: {
      p1: { x:60,  y:64, r:12, label:'C' },
      p2: { x:91,  y:82, r:12, label:'C' },
      p3: { x:91,  y:118,r:12, label:'C' },
      p4: { x:60,  y:136,r:12, label:'C' },
      p5: { x:29,  y:118,r:12, label:'C' },
      p6: { x:29,  y:82, r:12, label:'C' },
      c4: { x:140, y:64, r:15, label:'C' },
      o:  { x:140, y:22, r:15, label:'O', lp:2 },
      ho: { x:180, y:34, r:10, label:'H' },
      c3: { x:190, y:92, r:14, label:'C' },
      c2: { x:240, y:64, r:15, label:'C' },
      o2: { x:240, y:20, r:16, label:'O', lp:2 },
      c1: { x:290, y:92, r:14, label:'C' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},
            {a:'p2',b:'c4'},{a:'c4',b:'o'},{a:'o',b:'ho'},{a:'c4',b:'c3'},
            {a:'c3',b:'c2'},{a:'c2',b:'o2',order:2},{a:'c2',b:'c1'}]
  };

  // 2-Methylcyclohexanone. C1 is the carbonyl, C2 carries the methyl, C6 is
  // the open CH2 on the other side of it — the two alpha carbons the whole
  // topic is about, so both are labelled.
  Q['q-2-methylcyclohexanone'] = {
    name: '2-Methylcyclohexanone', formula: 'C₇H₁₂O', viewBox: '0 0 320 190',
    decor: tags([[130,46,'1'],[222,104,'2'],[98,104,'6']]),
    atoms: {
      p1: { x:160, y:64, r:14, label:'C' },
      p2: { x:198, y:86, r:14, label:'C' },
      p3: { x:198, y:130,r:14, label:'C' },
      p4: { x:160, y:152,r:14, label:'C' },
      p5: { x:122, y:130,r:14, label:'C' },
      p6: { x:122, y:86, r:14, label:'C' },
      o:  { x:160, y:20, r:16, label:'O', lp:2 },
      me: { x:240, y:62, r:15, label:'C' }
    },
    bonds: [{a:'p1',b:'p2'},{a:'p2',b:'p3'},{a:'p3',b:'p4'},{a:'p4',b:'p5'},{a:'p5',b:'p6'},{a:'p6',b:'p1'},
            {a:'p1',b:'o',order:2},{a:'p2',b:'me'}]
  };

  /* ---- Aromatics ------------------------------------------------------ */

  Q['q-tert-butylbenzene'] = {
    name: 'tert-Butylbenzene', formula: 'C₆H₅C(CH₃)₃', viewBox: '0 0 320 180',
    atoms: {
      p1: { x:100, y:50, r:13, label:'C' },
      p2: { x:136, y:71, r:13, label:'C' },
      p3: { x:136, y:113,r:13, label:'C' },
      p4: { x:100, y:134,r:13, label:'C' },
      p5: { x:64,  y:113,r:13, label:'C' },
      p6: { x:64,  y:71, r:13, label:'C' },
      cq: { x:196, y:60, r:16, label:'C' },
      m1: { x:252, y:32, r:14, label:'C' },
      m2: { x:252, y:88, r:14, label:'C' },
      m3: { x:196, y:112,r:14, label:'C' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},
            {a:'p2',b:'cq'},{a:'cq',b:'m1'},{a:'cq',b:'m2'},{a:'cq',b:'m3'}]
  };

  Q['q-nitrobenzene'] = {
    name: 'Nitrobenzene', formula: 'C₆H₅NO₂', viewBox: '0 0 320 190',
    atoms: {
      p1: { x:150, y:66, r:14, label:'C' },
      p2: { x:188, y:88, r:14, label:'C' },
      p3: { x:188, y:132,r:14, label:'C' },
      p4: { x:150, y:154,r:14, label:'C' },
      p5: { x:112, y:132,r:14, label:'C' },
      p6: { x:112, y:88, r:14, label:'C' },
      no2:{ x:250, y:66, r:19, label:'NO₂' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},{a:'p2',b:'no2'}]
  };

  Q['q-benzoic-acid'] = {
    name: 'Benzoic acid', formula: 'C₆H₅COOH',
    atoms: {
      p1: { x:140, y:54, r:13, label:'C' },
      p2: { x:176, y:75, r:13, label:'C' },
      p3: { x:176, y:117,r:13, label:'C' },
      p4: { x:140, y:138,r:13, label:'C' },
      p5: { x:104, y:117,r:13, label:'C' },
      p6: { x:104, y:75, r:13, label:'C' },
      co2h:{x:236, y:54, r:20, label:'CO₂H' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},{a:'p2',b:'co2h'}]
  };

  Q['q-acetophenone'] = {
    name: 'Acetophenone', formula: 'C₆H₅COCH₃', viewBox: '0 0 320 180',
    atoms: {
      p1: { x:96,  y:50, r:13, label:'C' },
      p2: { x:132, y:71, r:13, label:'C' },
      p3: { x:132, y:113,r:13, label:'C' },
      p4: { x:96,  y:134,r:13, label:'C' },
      p5: { x:60,  y:113,r:13, label:'C' },
      p6: { x:60,  y:71, r:13, label:'C' },
      cc: { x:192, y:60, r:16, label:'C' },
      o:  { x:246, y:34, r:17, label:'O', lp:2 },
      me: { x:192, y:114,r:15, label:'C' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},
            {a:'p2',b:'cc'},{a:'cc',b:'o',order:2},{a:'cc',b:'me'}]
  };

  // m-Xylene with the four open positions numbered, because the options name
  // them. Methyls are on 1 and 3; 2 is the one squeezed between them.
  Q['q-m-xylene'] = {
    name: 'm-Xylene', formula: '1,3-(CH₃)₂C₆H₄', viewBox: '0 0 320 210',
    /* Drawn flat-topped, with C1 and C3 stacked down the left-hand side and
       their methyls above and below. The obvious pointy-top orientation puts
       the two methyls and C2 on one horizontal line, where the three read as
       CH₃-C-CH₃ and the ring looks like a substituent. Position 2 being
       hemmed in on both sides is the whole question, so it has to be
       unmistakable which carbon it is. */
    decor: tags([[88,106,'2'],[193,178,'4'],[250,106,'5'],[193,30,'6']]),
    atoms: {
      c1: { x:147, y:60, r:14, label:'C' },
      c2: { x:124, y:100,r:14, label:'C' },
      c3: { x:147, y:140,r:14, label:'C' },
      c4: { x:193, y:140,r:14, label:'C' },
      c5: { x:216, y:100,r:14, label:'C' },
      c6: { x:193, y:60, r:14, label:'C' },
      me1:{ x:124, y:20, r:18, label:'CH₃' },
      me3:{ x:124, y:180,r:18, label:'CH₃' }
    },
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4',order:2},{a:'c4',b:'c5'},
            {a:'c5',b:'c6',order:2},{a:'c6',b:'c1'},{a:'c1',b:'me1'},{a:'c3',b:'me3'}]
  };

  Q['q-1-fluoro-4-nitrobenzene'] = {
    name: '1-Fluoro-4-nitrobenzene', formula: 'FC₆H₄NO₂',
    atoms: {
      p1: { x:204, y:104,r:14, label:'C' },
      p2: { x:182, y:142,r:14, label:'C' },
      p3: { x:138, y:142,r:14, label:'C' },
      p4: { x:116, y:104,r:14, label:'C' },
      p5: { x:138, y:66, r:14, label:'C' },
      p6: { x:182, y:66, r:14, label:'C' },
      f:  { x:258, y:104,r:15, label:'F', lp:3 },
      no2:{ x:58,  y:104,r:19, label:'NO₂' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},{a:'p1',b:'f'},{a:'p4',b:'no2'}]
  };

  Q['q-1-chloro-24-dinitrobenzene'] = {
    name: '1-Chloro-2,4-dinitrobenzene', formula: 'ClC₆H₃(NO₂)₂', viewBox: '0 0 320 180',
    atoms: {
      c1: { x:114, y:106,r:14, label:'C' },
      c2: { x:137, y:66, r:14, label:'C' },
      c3: { x:183, y:66, r:14, label:'C' },
      c4: { x:206, y:106,r:14, label:'C' },
      c5: { x:183, y:146,r:14, label:'C' },
      c6: { x:137, y:146,r:14, label:'C' },
      cl: { x:66,  y:106,r:15, label:'Cl', lp:3 },
      n2: { x:113, y:24, r:18, label:'NO₂' },
      n4: { x:254, y:106,r:18, label:'NO₂' }
    },
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4',order:2},{a:'c4',b:'c5'},
            {a:'c5',b:'c6',order:2},{a:'c6',b:'c1'},
            {a:'c1',b:'cl'},{a:'c2',b:'n2'},{a:'c4',b:'n4'}]
  };

  // 2-Bromo-1,3-dimethylbenzene: the point of the drawing is that both
  // carbons flanking the bromine carry a methyl and no hydrogen.
  Q['q-2-bromo-13-dimethylbenzene'] = {
    name: '2-Bromo-1,3-dimethylbenzene', formula: 'BrC₆H₃(CH₃)₂', viewBox: '0 0 320 190',
    atoms: {
      p1: { x:160, y:70, r:14, label:'C' },
      p2: { x:200, y:93, r:14, label:'C' },
      p3: { x:200, y:139,r:14, label:'C' },
      p4: { x:160, y:162,r:14, label:'C' },
      p5: { x:120, y:139,r:14, label:'C' },
      p6: { x:120, y:93, r:14, label:'C' },
      br: { x:160, y:24, r:17, label:'Br', lp:3 },
      me1:{ x:240, y:70, r:18, label:'CH₃' },
      me3:{ x:80,  y:70, r:18, label:'CH₃' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},
            {a:'p1',b:'br'},{a:'p2',b:'me1'},{a:'p6',b:'me3'}]
  };

  Q['q-cyclohexylamine'] = {
    name: 'Cyclohexylamine', formula: 'C₆H₁₁NH₂', viewBox: '0 0 320 180',
    atoms: {
      p1: { x:140, y:52, r:14, label:'C' },
      p2: { x:178, y:74, r:14, label:'C' },
      p3: { x:178, y:118,r:14, label:'C' },
      p4: { x:140, y:140,r:14, label:'C' },
      p5: { x:102, y:118,r:14, label:'C' },
      p6: { x:102, y:74, r:14, label:'C' },
      n:  { x:222, y:52, r:18, label:'NH₂' }
    },
    bonds: [{a:'p1',b:'p2'},{a:'p2',b:'p3'},{a:'p3',b:'p4'},{a:'p4',b:'p5'},{a:'p5',b:'p6'},{a:'p6',b:'p1'},
            {a:'p2',b:'n'}]
  };

  Q['q-1-phenylpentan-1-one'] = {
    name: '1-Phenylpentan-1-one', formula: 'C₆H₅CO(CH₂)₃CH₃', viewBox: '0 0 340 170',
    atoms: {
      p1: { x:56,  y:62, r:12, label:'C' },
      p2: { x:85,  y:79, r:12, label:'C' },
      p3: { x:85,  y:113,r:12, label:'C' },
      p4: { x:56,  y:130,r:12, label:'C' },
      p5: { x:27,  y:113,r:12, label:'C' },
      p6: { x:27,  y:79, r:12, label:'C' },
      k1: { x:130, y:62, r:15, label:'C' },
      o:  { x:130, y:20, r:15, label:'O', lp:2 },
      k2: { x:178, y:88, r:14, label:'C' },
      k3: { x:226, y:62, r:14, label:'C' },
      k4: { x:274, y:88, r:14, label:'C' },
      k5: { x:322, y:62, r:14, label:'C' }
    },
    bonds: [{a:'p1',b:'p2',order:2},{a:'p2',b:'p3'},{a:'p3',b:'p4',order:2},{a:'p4',b:'p5'},
            {a:'p5',b:'p6',order:2},{a:'p6',b:'p1'},
            {a:'p2',b:'k1'},{a:'k1',b:'o',order:2},{a:'k1',b:'k2'},{a:'k2',b:'k3'},
            {a:'k3',b:'k4'},{a:'k4',b:'k5'}]
  };

  /* ---- Cations, radicals, small alkanes -------------------------------- */

  Q['q-neopentyl-cation'] = {
    name: 'Neopentyl cation', formula: '(CH₃)₃CCH₂⁺',
    atoms: {
      cq:  { x:150, y:96, r:16, label:'C' },
      m1:  { x:96,  y:60, r:15, label:'C' },
      m2:  { x:150, y:38, r:15, label:'C' },
      m3:  { x:96,  y:132,r:15, label:'C' },
      ch2: { x:212, y:64, r:16, label:'C', charge:'⁺' }
    },
    bonds: [{a:'cq',b:'m1'},{a:'cq',b:'m2'},{a:'cq',b:'m3'},{a:'cq',b:'ch2'}]
  };

  Q['q-chloromethylcyclobutane'] = {
    name: '(Chloromethyl)cyclobutane', formula: 'C₄H₇CH₂Cl',
    atoms: {
      s1:  { x:96,  y:74, r:14, label:'C' },
      s2:  { x:146, y:74, r:14, label:'C' },
      s3:  { x:146, y:124,r:14, label:'C' },
      s4:  { x:96,  y:124,r:14, label:'C' },
      ch2: { x:198, y:52, r:15, label:'C' },
      cl:  { x:250, y:80, r:16, label:'Cl', lp:3 }
    },
    bonds: [{a:'s1',b:'s2'},{a:'s2',b:'s3'},{a:'s3',b:'s4'},{a:'s4',b:'s1'},
            {a:'s2',b:'ch2'},{a:'ch2',b:'cl'}]
  };

  // Isobutane with its single tertiary hydrogen drawn: the one hydrogen the
  // question counts separately from the other nine.
  Q['q-2-methylpropane'] = {
    name: '2-Methylpropane', formula: '(CH₃)₃CH',
    partialH: 'only the tertiary hydrogen is drawn: the nine primary hydrogens are the methyls the question counts by group',
    atoms: {
      c:  { x:150, y:96, r:16, label:'C' },
      h:  { x:150, y:44, r:11, label:'H' },
      m1: { x:96,  y:62, r:15, label:'C' },
      m2: { x:204, y:62, r:15, label:'C' },
      m3: { x:150, y:146,r:15, label:'C' }
    },
    bonds: [{a:'c',b:'h'},{a:'c',b:'m1'},{a:'c',b:'m2'},{a:'c',b:'m3'}]
  };

  Q['q-2-methylbutane'] = {
    name: '2-Methylbutane', formula: '(CH₃)₂CHCH₂CH₃',
    decor: locants(4, 48, 56, 152, 1),
    atoms: with_(chain(4, 48, 110, 56, 32, 15), { me:{ x:104, y:28, r:15, label:'C' } }),
    bonds: chainBonds(4).concat([{a:'c2',b:'me'}])
  };

  Q['q-butane'] = {
    name: 'Butane', formula: 'CH₃CH₂CH₂CH₃',
    decor: locants(4, 60, 52, 152, 1),
    atoms: chain(4, 60, 110, 52, 32, 15),
    bonds: chainBonds(4)
  };

  Mo.register(Q);
})();
