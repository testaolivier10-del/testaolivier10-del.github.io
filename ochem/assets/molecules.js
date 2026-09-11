/* Ochem molecule library + SVG renderer.

   Interactive questions need molecules a student can point at: "click the
   electrophile", "click the hydrogen that has to be anti-periplanar", "click
   the atom the arrow starts from". That means every molecule is structured
   data (atoms with coordinates and *roles*, bonds with orders) rather than a
   picture, so a question can say `target:'electrophile'` and the engine
   resolves which atoms count as correct — and so feedback can highlight the
   part of the molecule the student overlooked.

   The mechanism pages (mechanisms/sn2.html and friends) each hand-rolled
   their own inline atom/bond drawing before this file existed. Those pages
   are left alone; this is the shared version that practice questions draw
   from, using the same .scene/.atom CSS already in ochem.css so the two look
   identical.

   Atom:  { x, y, r, label, charge, lp, role, note }
     lp    number of lone pairs to draw as dots around the atom
     role  what this atom IS in the reaction being asked about — the hook
           questions and feedback highlights key off. One atom can hold only
           one role; where a molecule needs several (a carbon that is both
           electrophilic and a stereocenter) use `roles` as an array.
     note  short explanation used by feedback when this atom is the answer
           or a common wrong click.

   Bond:  { a, b, order, style }
     style 'plain' | 'wedge' (toward viewer) | 'dash' (away) | 'faint'

   Coordinates are in a 0..320 x 0..170 space; the renderer emits a viewBox
   so everything scales to the card width. */
(function(){

  function ring(cx, cy, r, n, startAngle){
    var pts = [];
    for(var i=0;i<n;i++){
      var a = (startAngle || -90) * Math.PI/180 + i * 2*Math.PI/n;
      pts.push({ x: Math.round(cx + r*Math.cos(a)), y: Math.round(cy + r*Math.sin(a)) });
    }
    return pts;
  }

  var M = {};

  /* ---- Foundations: shapes, bonding, geometry -------------------------
     Module 1 had no interactive questions at all, because there was nothing
     to point at — every molecule in this file was a reaction substrate. These
     are the small ones a first-week question actually asks about. */

  M['water'] = {
    name: 'Water', formula: 'H₂O',
    atoms: {
      o:  { x:160, y:96, r:18, label:'O', lp:2, role:'nucleophile', note:'Two bonding pairs and two lone pairs — four electron groups, which is why the shape is bent rather than linear.' },
      h1: { x:100, y:56, r:12, label:'H', note:'A bonding pair, not a lone pair. Bonding pairs are shared; lone pairs sit on one atom.' },
      h2: { x:220, y:56, r:12, label:'H', note:'A bonding pair, not a lone pair.' }
    },
    bonds: [{a:'o',b:'h1'},{a:'o',b:'h2'}],
    caption: 'Bent, about 104.5° — the two lone pairs push the hydrogens together.'
  };

  M['ammonia'] = {
    name: 'Ammonia', formula: 'NH₃',
    atoms: {
      n:  { x:160, y:100,r:18, label:'N', lp:1, role:'nucleophile', note:'One lone pair on nitrogen — the electron pair that makes ammonia both a base and a nucleophile.' },
      h1: { x:96,  y:64, r:12, label:'H' },
      h2: { x:160, y:150,r:12, label:'H' },
      h3: { x:224, y:64, r:12, label:'H' }
    },
    bonds: [{a:'n',b:'h1'},{a:'n',b:'h2'},{a:'n',b:'h3'}],
    caption: 'Four electron groups, three of them bonds — trigonal pyramidal.'
  };

  M['methane'] = {
    name: 'Methane', formula: 'CH₄',
    atoms: {
      c:  { x:160, y:88, r:18, label:'C', note:'Four bonding groups and no lone pairs — the textbook tetrahedral carbon.' },
      h1: { x:160, y:30, r:12, label:'H' },
      h2: { x:98,  y:124,r:12, label:'H' },
      h3: { x:222, y:124,r:12, label:'H' },
      h4: { x:160, y:146,r:12, label:'H' }
    },
    bonds: [{a:'c',b:'h1'},{a:'c',b:'h2'},{a:'c',b:'h3',style:'wedge'},{a:'c',b:'h4',style:'dash'}],
    caption: 'Tetrahedral, 109.5°. The wedge comes toward you; the dash goes back.'
  };

  M['carbon-dioxide'] = {
    name: 'Carbon dioxide', formula: 'CO₂',
    atoms: {
      o1: { x:64,  y:86, r:17, label:'O', lp:2, role:'electron-rich', note:'The electronegative end of a polar C=O bond — δ−.' },
      c:  { x:160, y:86, r:17, label:'C', role:'electrophile', note:'Two electron groups, no lone pairs. Both oxygens pull on it, but the pulls point in exactly opposite directions.' },
      o2: { x:256, y:86, r:17, label:'O', lp:2, role:'electron-rich', note:'The other δ− end, pointing the opposite way.' }
    },
    bonds: [{a:'c',b:'o1',order:2},{a:'c',b:'o2',order:2}],
    caption: 'Two polar bonds, zero net dipole — the shape cancels them.'
  };

  M['formaldehyde'] = {
    name: 'Formaldehyde', formula: 'H₂C=O',
    atoms: {
      o:  { x:160, y:34, r:17, label:'O', lp:2, role:'carbonyl-o', note:'Where the pi electrons go when a nucleophile attacks the carbon.' },
      c:  { x:160, y:96, r:17, label:'C', role:'electrophile', note:'Three electron groups (the double bond counts once) and no lone pairs — sp², trigonal planar, and strongly δ+.' },
      h1: { x:98,  y:132,r:12, label:'H' },
      h2: { x:222, y:132,r:12, label:'H' }
    },
    bonds: [{a:'c',b:'o',order:2},{a:'c',b:'h1'},{a:'c',b:'h2'}],
    caption: 'The simplest carbonyl: no alkyl groups to shield the carbon at all.'
  };

  M['hydrogen-cyanide'] = {
    name: 'Hydrogen cyanide', formula: 'HCN',
    atoms: {
      h: { x:56,  y:86, r:12, label:'H' },
      c: { x:150, y:86, r:17, label:'C', role:'electrophile', note:'Two electron groups — sp hybridized and linear.' },
      n: { x:254, y:86, r:17, label:'N', lp:1, role:'nucleophile', note:'The lone pair sits in an sp orbital, held close and tightly — which is exactly why cyanide is a good nucleophile but a weak base.' }
    },
    bonds: [{a:'h',b:'c'},{a:'c',b:'n',order:3}],
    caption: 'Linear. A triple bond still counts as one electron group.'
  };

  /* ---- Stereochemistry ------------------------------------------------ */

  M['bromochlorofluoromethane'] = {
    name: 'Bromochlorofluoromethane', formula: 'CHFClBr',
    atoms: {
      c:  { x:160, y:90, r:18, label:'C', role:'stereocenter', note:'Four different groups — H, F, Cl and Br — so this carbon is a stereocenter.' },
      br: { x:160, y:28, r:17, label:'Br', lp:3, role:'priority-1', note:'Highest atomic number of the four, so CIP priority 1.' },
      cl: { x:88,  y:124,r:16, label:'Cl', lp:3, role:'priority-2', note:'Priority 2 — heavier than fluorine, lighter than bromine.' },
      f:  { x:232, y:124,r:15, label:'F', lp:3, role:'priority-3', note:'Priority 3. Electronegative, but CIP ranks by atomic number, not electronegativity.' },
      h:  { x:160, y:148,r:12, label:'H', role:'priority-4', note:'Lowest priority — the one that must point away from you before you read the rotation.' }
    },
    bonds: [{a:'c',b:'br'},{a:'c',b:'cl'},{a:'c',b:'f',style:'wedge'},{a:'c',b:'h',style:'dash'}],
    caption: 'Four different groups on one carbon. Priorities by atomic number: Br > Cl > F > H.'
  };

  M['butan-2-ol'] = {
    name: 'Butan-2-ol', formula: 'CH₃CH(OH)CH₂CH₃',
    atoms: {
      c2: { x:160, y:92, r:18, label:'C', role:'stereocenter', note:'Bonded to OH, H, methyl and ethyl — four genuinely different groups, so it is a stereocenter.' },
      o:  { x:160, y:32, r:16, label:'O', lp:2, role:'priority-1', note:'Oxygen outranks both carbons and the hydrogen — CIP priority 1.' },
      ho: { x:214, y:14, r:11, label:'H' },
      h:  { x:160, y:146,r:12, label:'H', role:'priority-4', note:'Lowest priority, and the one that has to point away before you read R or S.' },
      c1: { x:92,  y:124,r:15, label:'C', role:'less-substituted', note:'The methyl carbon: attached to (H, H, H).' },
      c3: { x:228, y:124,r:15, label:'C', role:'more-substituted', note:'The ethyl carbon: attached to (C, H, H) — outranks methyl at the first point of difference.' },
      c4: { x:282, y:88, r:14, label:'C' }
    },
    bonds: [{a:'c2',b:'o'},{a:'o',b:'ho'},{a:'c2',b:'h',style:'dash'},{a:'c2',b:'c1'},{a:'c2',b:'c3'},{a:'c3',b:'c4'}],
    caption: 'One stereocenter. Ethyl beats methyl only when you look one atom further out.'
  };

  M['propane-2-ol-achiral'] = {
    name: '2-propanol (for contrast)', formula: '(CH₃)₂CHOH',
    atoms: {
      c2: { x:160, y:92, r:18, label:'C', role:'not-stereocenter', note:'NOT a stereocenter: two of its four groups are identical methyls, so swapping them changes nothing.' },
      o:  { x:160, y:32, r:16, label:'O', lp:2 },
      ho: { x:214, y:14, r:11, label:'H' },
      h:  { x:160, y:146,r:12, label:'H' },
      c1: { x:92,  y:124,r:15, label:'C', role:'duplicate', note:'One of two identical methyl groups — the reason this carbon is not a stereocenter.' },
      c3: { x:228, y:124,r:15, label:'C', role:'duplicate', note:'The other identical methyl.' }
    },
    bonds: [{a:'c2',b:'o'},{a:'o',b:'ho'},{a:'c2',b:'h'},{a:'c2',b:'c1'},{a:'c2',b:'c3'}],
    caption: 'Looks like butan-2-ol at a glance. Two identical methyls make it achiral.'
  };

  M['fischer-glyceraldehyde'] = {
    name: 'Glyceraldehyde (Fischer projection)', formula: 'OHC–CH(OH)–CH₂OH',
    atoms: {
      top: { x:160, y:26, r:17, label:'CHO', role:'vertical', note:'Vertical bonds in a Fischer projection point AWAY from you, behind the page.' },
      c:   { x:160, y:88, r:14, label:'C', role:'stereocenter', note:'The stereocenter sits where the lines cross — it is not usually drawn as a letter.' },
      left:{ x:74,  y:88, r:15, label:'H', role:'horizontal', note:'Horizontal bonds come TOWARD you, out of the page. That is what makes a single swap an inversion.' },
      right:{x:250, y:88, r:16, label:'OH', role:'horizontal', note:'Also toward you. On the right at the bottom-most stereocenter, this is the D configuration by convention.' },
      bot: { x:160, y:150,r:20, label:'CH₂OH', role:'vertical', note:'Vertical, so pointing away from you.' }
    },
    bonds: [{a:'c',b:'top'},{a:'c',b:'bot'},{a:'c',b:'left'},{a:'c',b:'right'}],
    caption: 'A Fischer projection: horizontal toward you, vertical away from you.'
  };

  /* ---- Conformations -------------------------------------------------- */

  /* A real Newman projection, which a plain atom/bond list cannot express:
     the defining feature is that the BACK carbon is a circle and the front
     carbon is the point where three bonds meet. Without the circle this is
     just a six-bonded carbon, which is exactly the wrong mental model. The
     back bonds are drawn as decor from the circle's edge, since they do not
     connect to any atom in the list. */
  M['newman-butane-anti'] = (function(){
    var cx = 160, cy = 98, R = 46;
    function at(ang, d){
      var a = ang * Math.PI/180;
      return { x: Math.round(cx + d*Math.cos(a)), y: Math.round(cy + d*Math.sin(a)) };
    }
    var edge = [90, 210, -30].map(function(ang){ return at(ang, R); });
    var back = [90, 210, -30].map(function(ang){ return at(ang, 74); });
    var decor = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="var(--line)" stroke-width="2.5"/>' +
      edge.map(function(e, i){
        return '<line x1="' + e.x + '" y1="' + e.y + '" x2="' + back[i].x + '" y2="' + back[i].y +
               '" stroke="var(--line)" stroke-width="2.5"/>';
      }).join('');
    var f = [-90, 150, 30].map(function(ang){ return at(ang, 62); });
    return {
      name: 'Butane, anti conformation (Newman)', formula: 'CH₃CH₂CH₂CH₃',
      viewBox: '0 0 320 196', decor: decor,
      atoms: {
        fc:  { x:cx, y:cy, r:7, label:'', role:'front-carbon', note:'The front carbon sits where the three front bonds meet — it is drawn as a point, not a circle.' },
        fme: { x:f[0].x, y:f[0].y, r:17, label:'CH₃', role:'front-methyl', note:'The front methyl. Measure the dihedral angle from here round to the back methyl.' },
        fh1: { x:f[1].x, y:f[1].y, r:12, label:'H', role:'front-h' },
        fh2: { x:f[2].x, y:f[2].y, r:12, label:'H', role:'front-h' },
        bme: { x:back[0].x, y:back[0].y, r:17, label:'CH₃', role:'back-methyl', note:'The back methyl, 180° round from the front one. That 180° is what "anti" means.' },
        bh1: { x:back[1].x, y:back[1].y, r:12, label:'H', role:'back-h', note:'A back hydrogen. Back bonds start at the circle’s edge, front bonds at its centre.' },
        bh2: { x:back[2].x, y:back[2].y, r:12, label:'H', role:'back-h' }
      },
      bonds: [{a:'fc',b:'fme'},{a:'fc',b:'fh1'},{a:'fc',b:'fh2'}],
      caption: 'Staggered with the methyls 180° apart — butane’s lowest-energy conformation.'
    };
  })();

  M['chair-dimethylcyclohexane'] = {
    name: 'trans-1,2-dimethylcyclohexane (chair)', formula: 'C₈H₁₆', viewBox: '0 0 320 180',
    atoms: {
      r1: { x:60,  y:104,r:13, label:'C' },
      r2: { x:112, y:130,r:13, label:'C' },
      r3: { x:176, y:118,r:13, label:'C' },
      r4: { x:228, y:80, r:13, label:'C' },
      r5: { x:176, y:54, r:13, label:'C' },
      r6: { x:112, y:66, r:13, label:'C' },
      me6:{ x:112, y:18, r:17, label:'CH₃', role:'axial-substituent', note:'Axial methyl — pointing straight up into two 1,3-diaxial clashes. This is the costly position.' },
      me5:{ x:228, y:28, r:17, label:'CH₃', role:'equatorial-substituent', note:'Equatorial methyl — pointing out around the ring’s edge, clear of everything.' },
      hax1:{x:60,  y:56, r:11, label:'H', role:'syn-axial-h', note:'One of the axial hydrogens the axial methyl is crashing into, three carbons away on the same face.' },
      hax3:{x:176, y:164,r:11, label:'H', role:'axial-h' }
    },
    bonds: [{a:'r1',b:'r2'},{a:'r2',b:'r3'},{a:'r3',b:'r4'},{a:'r4',b:'r5'},{a:'r5',b:'r6'},{a:'r6',b:'r1'},
            {a:'r6',b:'me6'},{a:'r5',b:'me5'},{a:'r1',b:'hax1',style:'faint'},{a:'r3',b:'hax3',style:'faint'}],
    caption: 'One methyl axial, one equatorial. A ring flip swaps both.'
  };

  /* ---- Acids, bases and conjugates ------------------------------------ */

  M['acetate-ion'] = {
    name: 'Acetate ion', formula: 'CH₃CO₂⁻',
    atoms: {
      o1: { x:214, y:36, r:17, label:'O', lp:2, role:'resonance-o', note:'One of two equivalent oxygens. The charge is shared between them, not parked on either.' },
      c:  { x:160, y:86, r:17, label:'C', role:'carboxyl-c' },
      o2: { x:214, y:136,r:17, label:'O', charge:'⁻', lp:3, role:'resonance-o', note:'The other equivalent oxygen. Draw the second resonance form and this one carries the double bond instead.' },
      ca: { x:92,  y:86, r:16, label:'C', role:'alpha-carbon' },
      h1: { x:52,  y:44, r:11, label:'H', role:'alpha-h', note:'An alpha C–H, pKa around 20 here — far less acidic than the O–H was.' },
      h2: { x:52,  y:128,r:11, label:'H', role:'alpha-h' }
    },
    bonds: [{a:'c',b:'o1',order:2},{a:'c',b:'o2'},{a:'c',b:'ca'},{a:'ca',b:'h1'},{a:'ca',b:'h2'}],
    caption: 'The conjugate base of acetic acid. Two equivalent oxygens share one negative charge.'
  };

  M['ammonium'] = {
    name: 'Ammonium ion', formula: 'NH₄⁺',
    atoms: {
      n:  { x:160, y:90, r:18, label:'N', charge:'⁺', role:'conjugate-acid', note:'No lone pair left — it was used to grab the fourth proton. That is why ammonium cannot act as a base.' },
      h1: { x:160, y:30, r:12, label:'H' },
      h2: { x:96,  y:124,r:12, label:'H' },
      h3: { x:224, y:124,r:12, label:'H' },
      h4: { x:160, y:150,r:12, label:'H', role:'acidic-h', note:'Losing any one of these four gives back ammonia — ammonium is the conjugate ACID of NH₃.' }
    },
    bonds: [{a:'n',b:'h1'},{a:'n',b:'h2'},{a:'n',b:'h3'},{a:'n',b:'h4'}],
    caption: 'Ammonia after it accepted a proton. Four bonds, no lone pair, +1 charge.'
  };

  /* ---- Ethers, acetals, amines ---------------------------------------- */

  M['methyl-propyl-ether'] = {
    name: 'Methyl propyl ether', formula: 'CH₃OCH₂CH₂CH₃', viewBox: '0 0 320 190',
    atoms: {
      o:  { x:160, y:56, r:17, label:'O', lp:2, role:'ether-o', note:'An ether oxygen. Unreactive until it is protonated — then it becomes a leaving group.' },
      cm: { x:88,  y:96, r:16, label:'C', role:'less-hindered', note:'The methyl carbon: nothing but hydrogens around it, so the easiest possible backside attack.' },
      hm1:{ x:44,  y:58, r:11, label:'H' },
      c1: { x:232, y:96, r:16, label:'C', role:'more-hindered', note:'A primary carbon, but it carries a whole propyl chain — more crowded than a methyl.' },
      c2: { x:272, y:140,r:15, label:'C' },
      c3: { x:224, y:166,r:14, label:'C' }
    },
    bonds: [{a:'o',b:'cm'},{a:'o',b:'c1'},{a:'cm',b:'hm1'},{a:'c1',b:'c2'},{a:'c2',b:'c3'}],
    caption: 'An unsymmetrical ether. Cleaving it with HI is a question about which carbon is easier to reach.'
  };

  M['dimethyl-acetal'] = {
    name: 'Acetone dimethyl acetal', formula: '(CH₃)₂C(OCH₃)₂',
    atoms: {
      c:  { x:160, y:92, r:18, label:'C', role:'acetal-c', note:'The acetal carbon: TWO OR groups on one carbon. That is the pattern to recognize.' },
      o1: { x:100, y:44, r:16, label:'O', lp:2, role:'acetal-o', note:'One of the two ether-type oxygens. One of these leaves (after protonation) to give the oxocarbenium.' },
      o2: { x:220, y:44, r:16, label:'O', lp:2, role:'acetal-o', note:'The other. In a HEMIacetal one of these two would be an OH instead.' },
      m1: { x:56,  y:92, r:15, label:'C' },
      m2: { x:264, y:92, r:15, label:'C' },
      ca: { x:112, y:146,r:15, label:'C', role:'alkyl' },
      cb: { x:208, y:146,r:15, label:'C', role:'alkyl' }
    },
    bonds: [{a:'c',b:'o1'},{a:'c',b:'o2'},{a:'o1',b:'m1'},{a:'o2',b:'m2'},{a:'c',b:'ca'},{a:'c',b:'cb'}],
    caption: 'Two OR groups on one carbon: an acetal. Stable to base, hydrolyzed by aqueous acid.'
  };

  M['acetone-hemiacetal'] = {
    name: 'Hemiacetal', formula: '(CH₃)₂C(OH)OCH₃',
    atoms: {
      c:  { x:160, y:92, r:18, label:'C', role:'hemiacetal-c', note:'A hemiacetal carbon: one OH and one OR. Halfway there — hence "hemi".' },
      o1: { x:100, y:44, r:16, label:'O', lp:2, role:'hydroxyl-o', note:'The OH oxygen. This is the half that still has to be replaced to reach a full acetal.' },
      h1: { x:52,  y:20, r:11, label:'H' },
      o2: { x:220, y:44, r:16, label:'O', lp:2, role:'alkoxy-o', note:'The OR oxygen, already installed from the first equivalent of alcohol.' },
      m2: { x:268, y:20, r:15, label:'C' },
      ca: { x:112, y:146,r:15, label:'C' },
      cb: { x:208, y:146,r:15, label:'C' }
    },
    bonds: [{a:'c',b:'o1'},{a:'o1',b:'h1'},{a:'c',b:'o2'},{a:'o2',b:'m2'},{a:'c',b:'ca'},{a:'c',b:'cb'}],
    caption: 'One OH and one OR on the same carbon — a hemiacetal, the intermediate on the way to an acetal.'
  };

  /* ---- Spectroscopy --------------------------------------------------- */

  M['para-xylene'] = (function(){
    // Rotated so the two substituents sit left and right: the page is much
    // wider than it is tall, and stacked methyls collided with the ring.
    var pts = ring(158, 86, 50, 6, 0);
    var atoms = {};
    var names = ['c1','c2','c3','c4','c5','c6'];
    pts.forEach(function(p, i){
      atoms[names[i]] = { x:p.x, y:p.y, r:13, label:'C' };
    });
    atoms.c1.role = 'substituted'; atoms.c1.note = 'A substituted ring carbon. Its partner across the ring is identical by symmetry, so the two share one signal.';
    atoms.c4.role = 'substituted'; atoms.c4.note = 'The other substituted carbon — chemically identical to the first.';
    atoms.c2.role = 'ring-ch'; atoms.c2.note = 'One of four equivalent aromatic CH carbons. All four give a single peak.';
    atoms.c3.role = 'ring-ch'; atoms.c5.role = 'ring-ch'; atoms.c6.role = 'ring-ch';
    atoms.me1 = { x:268, y:86, r:18, label:'CH₃', role:'methyl', note:'One of two equivalent methyls — they share a single signal.' };
    atoms.me4 = { x:48,  y:86, r:18, label:'CH₃', role:'methyl', note:'The other methyl, equivalent to the first by the molecule’s symmetry.' };
    return { name:'para-Xylene', formula:'C₆H₄(CH₃)₂', atoms: atoms,
      bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4',order:2},
              {a:'c4',b:'c5'},{a:'c5',b:'c6',order:2},{a:'c6',b:'c1'},
              {a:'c1',b:'me1'},{a:'c4',b:'me4'}],
      caption: 'Eight carbons, but symmetry collapses them into only three ¹³C signals.' };
  })();

  M['ethanol'] = {
    name: 'Ethanol', formula: 'CH₃CH₂OH', viewBox: '0 0 320 190',
    atoms: {
      o:  { x:246, y:52, r:17, label:'O', lp:2, role:'hydroxyl-o' },
      ho: { x:290, y:100,r:12, label:'H', role:'oh-h', note:'The O–H proton. It exchanges, so it is usually a broad singlet that does not split anything.' },
      c2: { x:176, y:96, r:17, label:'C', role:'ch2', note:'The CH₂: next to oxygen, so its hydrogens sit downfield, and split by the three CH₃ hydrogens into a quartet.' },
      h21:{ x:176, y:148,r:11, label:'H' },
      h22:{ x:136, y:56, r:11, label:'H' },
      c1: { x:98,  y:130,r:17, label:'C', role:'ch3', note:'The CH₃: three equivalent hydrogens, split by the two CH₂ hydrogens into a triplet.' },
      h11:{ x:44,  y:108,r:11, label:'H' },
      h12:{ x:70,  y:168,r:11, label:'H' }
    },
    bonds: [{a:'o',b:'ho'},{a:'o',b:'c2'},{a:'c2',b:'h21'},{a:'c2',b:'h22'},{a:'c2',b:'c1'},{a:'c1',b:'h11'},{a:'c1',b:'h12'}],
    caption: 'Three hydrogen environments: CH₃, CH₂ and OH.'
  };

  /* ---- Substitution / elimination substrates ------------------------- */

  M['sn2-bromoethane'] = {
    name: '1-bromoethane + hydroxide', formula: 'CH₃CH₂Br + HO⁻',
    atoms: {
      nucO: { x:34,  y:88, r:16, label:'O', charge:'⁻', lp:3, role:'nucleophile', note:'Hydroxide — negative charge and three lone pairs, the electron source.' },
      nucH: { x:34,  y:44, r:10, label:'H' },
      c1:   { x:140, y:88, r:16, label:'C', role:'electrophile', note:'The carbon bonded to bromine: bromine pulls electron density away, leaving it δ+.' },
      c2:   { x:196, y:52, r:16, label:'C', note:'This carbon has no leaving group on it — nothing makes it electron-poor.' },
      h1:   { x:140, y:44, r:10, label:'H' },
      h2:   { x:112, y:126,r:10, label:'H' },
      br:   { x:196, y:126,r:17, label:'Br', lp:3, role:'leaving-group', note:'Bromide is a weak base (HBr pKa ≈ −9), so it is happy to leave with the bonding electrons.' },
      m1:   { x:252, y:30, r:10, label:'H' }, m2:{ x:236, y:80, r:10, label:'H' }, m3:{ x:176, y:14, r:10, label:'H' }
    },
    bonds: [{a:'nucO',b:'nucH'},{a:'c1',b:'c2'},{a:'c1',b:'h1'},{a:'c1',b:'h2'},{a:'c1',b:'br'},
            {a:'c2',b:'m1'},{a:'c2',b:'m2'},{a:'c2',b:'m3'}],
    caption: 'A primary alkyl halide and a strong nucleophile.'
  };

  M['sn2-tertiary'] = {
    name: '2-bromo-2-methylpropane + hydroxide', formula: '(CH₃)₃CBr + HO⁻',
    atoms: {
      nucO: { x:30,  y:88, r:16, label:'O', charge:'⁻', lp:3, role:'nucleophile' },
      nucH: { x:30,  y:44, r:10, label:'H' },
      c1:   { x:160, y:88, r:17, label:'C', role:'electrophile', note:'Tertiary: three methyl groups wall off every approach to the backside.' },
      br:   { x:160, y:146,r:17, label:'Br', lp:3, role:'leaving-group' },
      ma:   { x:104, y:52, r:15, label:'C', role:'sterics', note:'One of three methyl groups crowding the reacting carbon.' },
      mb:   { x:216, y:52, r:15, label:'C', role:'sterics' },
      mc:   { x:160, y:28, r:15, label:'C', role:'sterics' }
    },
    bonds: [{a:'nucO',b:'nucH'},{a:'c1',b:'br'},{a:'c1',b:'ma'},{a:'c1',b:'mb'},{a:'c1',b:'mc'}],
    caption: 'A tertiary alkyl halide — note how surrounded the C–Br carbon is.'
  };

  M['sn1-secondary'] = {
    name: '2-bromopropane', formula: '(CH₃)₂CHBr',
    atoms: {
      c1: { x:160, y:82, r:17, label:'C', role:'electrophile', note:'Secondary carbon — it can go either way, so the reagent and solvent decide.' },
      h:  { x:160, y:36, r:10, label:'H' },
      br: { x:160, y:140,r:17, label:'Br', lp:3, role:'leaving-group' },
      ma: { x:98,  y:82, r:15, label:'C' },
      mb: { x:222, y:82, r:15, label:'C' }
    },
    bonds: [{a:'c1',b:'h'},{a:'c1',b:'br'},{a:'c1',b:'ma'},{a:'c1',b:'mb'}],
    caption: 'A secondary substrate — the genuinely ambiguous case.'
  };

  M['e2-butane'] = {
    name: '2-bromobutane', formula: 'CH₃CH₂CHBrCH₃',
    atoms: {
      c1: { x:46,  y:108,r:15, label:'C', note:'The terminal methyl — eliminating toward here gives the less substituted alkene.' },
      c2: { x:110, y:70, r:16, label:'C', role:'beta-carbon', note:'A beta carbon: its hydrogen can be removed to form the more substituted alkene.' },
      c3: { x:174, y:108,r:17, label:'C', role:'alpha-carbon', note:'The alpha carbon — it carries the leaving group.' },
      c4: { x:238, y:70, r:15, label:'C', role:'beta-carbon' },
      br: { x:174, y:154,r:17, label:'Br', lp:3, role:'leaving-group' },
      hb: { x:88,  y:26, r:11, label:'H', role:'beta-h', note:'A beta hydrogen — removing this one gives the more substituted (Zaitsev) alkene.' },
      hc: { x:222, y:26, r:11, label:'H', role:'beta-h' },
      ha: { x:230, y:140,r:11, label:'H', role:'alpha-h', note:'This hydrogen is on the same carbon as the leaving group — removing it eliminates nothing.' }
    },
    bonds: [{a:'c1',b:'c2'},{a:'c2',b:'c3'},{a:'c3',b:'c4'},{a:'c3',b:'br'},{a:'c2',b:'hb'},{a:'c4',b:'hc'},{a:'c3',b:'ha'}],
    caption: 'Two different beta hydrogens are available — they give different alkenes.'
  };

  // A chair drawn as a real chair so axial/equatorial is visually true, not
  // just asserted. Axial bonds are vertical; equatorial ones splay outward.
  M['chair-bromocyclohexane'] = {
    name: 'Bromocyclohexane (chair)', formula: 'C₆H₁₁Br', viewBox: '0 0 320 180',
    atoms: {
      r1: { x:60,  y:104,r:13, label:'C' },
      r2: { x:112, y:130,r:13, label:'C', role:'beta-carbon' },
      r3: { x:176, y:118,r:13, label:'C' },
      r4: { x:228, y:80, r:13, label:'C' },
      r5: { x:176, y:54, r:13, label:'C', role:'beta-carbon' },
      r6: { x:112, y:66, r:14, label:'C', role:'alpha-carbon', note:'The carbon bearing the leaving group.' },
      br: { x:112, y:18, r:16, label:'Br', lp:3, role:'leaving-group', note:'Axial bromine — pointing straight up, exactly what E2 needs.' },
      hax2:{ x:112, y:170,r:11, label:'H', role:'axial-h', note:'Axial hydrogen on a beta carbon — anti-periplanar to the axial C–Br bond. This is the one E2 takes.' },
      hax5:{ x:176, y:16, r:11, label:'H', role:'syn-axial-h', note:'Axial, but on the same side as the bromine — syn-periplanar, not anti. E2 cannot use it.' },
      heq3:{ x:222, y:146,r:11, label:'H', role:'equatorial-h', note:'Equatorial hydrogen — roughly 60° from the C–Br bond, not the 180° E2 requires.' }
    },
    bonds: [{a:'r1',b:'r2'},{a:'r2',b:'r3'},{a:'r3',b:'r4'},{a:'r4',b:'r5'},{a:'r5',b:'r6'},{a:'r6',b:'r1'},
            {a:'r6',b:'br'},{a:'r2',b:'hax2'},{a:'r5',b:'hax5'},{a:'r3',b:'heq3',style:'faint'}],
    caption: 'Bromine sits axial. Only an axial hydrogen on a neighbouring carbon is 180° from it.'
  };

  /* ---- Carbonyls ------------------------------------------------------ */

  M['acetone'] = {
    name: 'Acetone', formula: 'CH₃COCH₃',
    atoms: {
      o:   { x:160, y:30, r:16, label:'O', lp:2, role:'carbonyl-o', note:'The carbonyl oxygen is electron-RICH (δ−). Nucleophiles are not attracted here.' },
      c:   { x:160, y:88, r:17, label:'C', role:'electrophile', note:'The carbonyl carbon is δ+ — oxygen pulls the pi electrons toward itself.' },
      ca:  { x:98,  y:120,r:15, label:'C', role:'alpha-carbon', note:'Alpha carbon — the one next to the carbonyl.' },
      cb:  { x:222, y:120,r:15, label:'C', role:'alpha-carbon' },
      ha:  { x:62,  y:88, r:11, label:'H', role:'alpha-h', note:'An alpha hydrogen, pKa ≈ 20 — acidic because the resulting enolate is resonance stabilized.' },
      ha2: { x:74,  y:154,r:11, label:'H', role:'alpha-h' },
      hb:  { x:258, y:88, r:11, label:'H', role:'alpha-h' },
      hb2: { x:246, y:154,r:11, label:'H', role:'alpha-h' }
    },
    bonds: [{a:'c',b:'o',order:2},{a:'c',b:'ca'},{a:'c',b:'cb'},{a:'ca',b:'ha'},{a:'ca',b:'ha2'},{a:'cb',b:'hb'},{a:'cb',b:'hb2'}],
    caption: 'A simple ketone.'
  };

  M['acetaldehyde'] = {
    name: 'Acetaldehyde', formula: 'CH₃CHO',
    atoms: {
      o:  { x:200, y:38, r:16, label:'O', lp:2, role:'carbonyl-o' },
      c:  { x:172, y:90, r:17, label:'C', role:'electrophile', note:'Only one alkyl group here, so this carbonyl is less hindered and more electrophilic than a ketone.' },
      h:  { x:214, y:128,r:11, label:'H', note:'The aldehyde hydrogen — it sits far downfield in ¹H NMR (~9.7 ppm).' },
      ca: { x:110, y:118,r:15, label:'C', role:'alpha-carbon' },
      h1: { x:70,  y:88, r:10, label:'H', role:'alpha-h' },
      h2: { x:86,  y:156,r:10, label:'H', role:'alpha-h' },
      h3: { x:146, y:154,r:10, label:'H', role:'alpha-h' }
    },
    bonds: [{a:'c',b:'o',order:2},{a:'c',b:'h'},{a:'c',b:'ca'},{a:'ca',b:'h1'},{a:'ca',b:'h2'},{a:'ca',b:'h3'}],
    caption: 'An aldehyde: one substituent plus a hydrogen on the carbonyl carbon.'
  };

  M['methyl-acetate'] = {
    name: 'Methyl acetate', formula: 'CH₃CO₂CH₃',
    atoms: {
      o1: { x:120, y:30, r:16, label:'O', lp:2, role:'carbonyl-o' },
      c:  { x:120, y:88, r:17, label:'C', role:'electrophile', note:'The acyl carbon — where a nucleophile attacks in acyl substitution.' },
      ca: { x:62,  y:120,r:15, label:'C', role:'alpha-carbon' },
      o2: { x:186, y:120,r:16, label:'O', lp:2, role:'leaving-group', note:'The ester oxygen. Methoxide is basic, so this is a mediocre leaving group — esters are less reactive than acid chlorides.' },
      cm: { x:250, y:88, r:15, label:'C' },
      h1: { x:26,  y:88, r:10, label:'H', role:'alpha-h' },
      h2: { x:44,  y:158,r:10, label:'H', role:'alpha-h' }
    },
    bonds: [{a:'c',b:'o1',order:2},{a:'c',b:'ca'},{a:'c',b:'o2'},{a:'o2',b:'cm'},{a:'ca',b:'h1'},{a:'ca',b:'h2'}],
    caption: 'An ester — a carbonyl with a leaving group attached.'
  };

  M['acetyl-chloride'] = {
    name: 'Acetyl chloride', formula: 'CH₃COCl',
    atoms: {
      o:  { x:140, y:30, r:16, label:'O', lp:2, role:'carbonyl-o' },
      c:  { x:140, y:88, r:17, label:'C', role:'electrophile' },
      ca: { x:80,  y:122,r:15, label:'C', role:'alpha-carbon' },
      cl: { x:206, y:122,r:17, label:'Cl', lp:3, role:'leaving-group', note:'Chloride is a very weak base, which is what makes acid chlorides the most reactive acyl derivative.' }
    },
    bonds: [{a:'c',b:'o',order:2},{a:'c',b:'ca'},{a:'c',b:'cl'}],
    caption: 'The most reactive common acyl derivative.'
  };

  /* ---- Alkenes, alcohols, epoxides ------------------------------------ */

  M['propene-hbr'] = {
    name: 'Propene + HBr', formula: 'CH₃CH=CH₂ + HBr',
    atoms: {
      c1: { x:74,  y:60, r:16, label:'C', role:'pi-nucleophile', note:'The less substituted alkene carbon (CH₂). The proton adds here, because it leaves the + charge on the other carbon.' },
      c2: { x:140, y:96, r:16, label:'C', role:'markovnikov-carbon', note:'The more substituted carbon — this is where the positive charge ends up, and where Br finally bonds.' },
      c3: { x:206, y:60, r:15, label:'C' },
      h1: { x:34,  y:26, r:10, label:'H' }, h2:{ x:56, y:112, r:10, label:'H' },
      h3: { x:140, y:148,r:10, label:'H' },
      hbrH:{ x:250, y:140,r:13, label:'H', role:'electrophile', note:'The acidic proton of HBr — this is the electrophile the pi bond attacks.' },
      hbrBr:{x:296, y:112,r:16, label:'Br', lp:3, role:'leaving-group' }
    },
    bonds: [{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c1',b:'h1'},{a:'c1',b:'h2'},{a:'c2',b:'h3'},{a:'hbrH',b:'hbrBr'}],
    caption: 'An unsymmetrical alkene: the two carbons are not equivalent.'
  };

  M['propylene-oxide'] = {
    name: 'Propylene oxide', formula: 'C₃H₆O', viewBox: '0 0 320 170',
    atoms: {
      o:  { x:150, y:36, r:16, label:'O', lp:2, role:'leaving-group', note:'The epoxide oxygen becomes an alkoxide (or alcohol) as the ring opens.' },
      c1: { x:110, y:100,r:16, label:'C', role:'less-hindered', note:'The CH₂ carbon — less hindered, so this is where a strong nucleophile attacks under basic conditions.' },
      c2: { x:190, y:100,r:16, label:'C', role:'more-substituted', note:'The more substituted carbon — it holds more positive character when protonated, so acid conditions send the nucleophile here.' },
      cm: { x:252, y:138,r:15, label:'C' },
      h1: { x:58,  y:74, r:10, label:'H' }, h2:{ x:74, y:144, r:10, label:'H' },
      h3: { x:190, y:150,r:10, label:'H' }
    },
    bonds: [{a:'o',b:'c1'},{a:'o',b:'c2'},{a:'c1',b:'c2'},{a:'c2',b:'cm'},{a:'c1',b:'h1'},{a:'c1',b:'h2'},{a:'c2',b:'h3'}],
    caption: 'A strained three-membered ring — electrophilic at both carbons.'
  };

  M['isopropanol'] = {
    name: '2-propanol', formula: '(CH₃)₂CHOH',
    atoms: {
      o:  { x:160, y:36, r:16, label:'O', lp:2, role:'nucleophile', note:'The alcohol oxygen — nucleophilic and basic, but a terrible leaving group until it is protonated.' },
      ho: { x:214, y:18, r:11, label:'H' },
      c:  { x:160, y:94, r:17, label:'C', role:'electrophile', note:'Only electrophilic once the OH has been protonated or converted to a tosylate.' },
      h:  { x:160, y:140,r:10, label:'H' },
      ma: { x:98,  y:128,r:15, label:'C' },
      mb: { x:222, y:128,r:15, label:'C' }
    },
    bonds: [{a:'o',b:'ho'},{a:'o',b:'c'},{a:'c',b:'h'},{a:'c',b:'ma'},{a:'c',b:'mb'}],
    caption: 'A secondary alcohol.'
  };

  /* ---- Aromatics ------------------------------------------------------ */

  (function(){
    // Ring centre sits low enough that the substituent circle above c1
    // (48px up, r17) stays inside the box.
    var pts = ring(150, 118, 52, 6, -90);
    var keys = ['c1','c2','c3','c4','c5','c6'];
    function aromatic(id, name, formula, subLabel, subRole, subNote, roleMap){
      var atoms = {};
      keys.forEach(function(k, i){
        atoms[k] = { x: pts[i].x, y: pts[i].y, r: 14, label:'C' };
        if(roleMap && roleMap[k]){ atoms[k].role = roleMap[k].role; atoms[k].note = roleMap[k].note; }
      });
      atoms.sub = { x: pts[0].x, y: pts[0].y - 48, r: 17, label: subLabel, lp: 1, role: subRole, note: subNote };
      M[id] = {
        name: name, formula: formula, viewBox: '0 0 320 186',
        atoms: atoms,
        bonds: [
          {a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4',order:2},
          {a:'c4',b:'c5'},{a:'c5',b:'c6',order:2},{a:'c6',b:'c1'},
          {a:'c1',b:'sub'}
        ],
        caption: 'Positions: ortho is next to the substituent, meta is one further, para is directly across.'
      };
    }
    aromatic('anisole', 'Anisole', 'C₆H₅OCH₃', 'OMe', 'donor',
      'A lone-pair donor: it pushes electron density into the ring, activating it and directing ortho/para.',
      { c2:{role:'ortho', note:'Ortho — a donor stabilizes the arenium ion here.'},
        c6:{role:'ortho', note:'Ortho — a donor stabilizes the arenium ion here.'},
        c3:{role:'meta',  note:'Meta — where a withdrawing group sends the electrophile, by elimination.'},
        c5:{role:'meta',  note:'Meta.'},
        c4:{role:'para',  note:'Para — directly across from the substituent, also stabilized by a donor.'} });
    aromatic('nitrobenzene', 'Nitrobenzene', 'C₆H₅NO₂', 'NO₂', 'withdrawer',
      'A strong withdrawer: it destabilizes the arenium ion at ortho and para, so substitution defaults to meta.',
      { c2:{role:'ortho', note:'Ortho — a withdrawing group destabilizes the cation here.'},
        c6:{role:'ortho', note:'Ortho.'},
        c3:{role:'meta',  note:'Meta — the least bad option when the substituent withdraws.'},
        c5:{role:'meta',  note:'Meta.'},
        c4:{role:'para',  note:'Para — also destabilized by a withdrawing group.'} });
  })();

  M['benzene'] = (function(){
    var pts = ring(150, 92, 54, 6, -90), atoms = {};
    ['c1','c2','c3','c4','c5','c6'].forEach(function(k,i){ atoms[k] = { x:pts[i].x, y:pts[i].y, r:15, label:'C', role:'pi-nucleophile' }; });
    return { name:'Benzene', formula:'C₆H₆', atoms: atoms,
      bonds:[{a:'c1',b:'c2',order:2},{a:'c2',b:'c3'},{a:'c3',b:'c4',order:2},{a:'c4',b:'c5'},{a:'c5',b:'c6',order:2},{a:'c6',b:'c1'}],
      caption:'Six pi electrons in a planar ring — 4n+2 with n=1.' };
  })();

  /* ---- Amines & acids -------------------------------------------------- */

  M['acetic-acid'] = {
    name: 'Acetic acid', formula: 'CH₃CO₂H',
    atoms: {
      o1: { x:120, y:32, r:16, label:'O', lp:2, role:'carbonyl-o' },
      c:  { x:120, y:90, r:17, label:'C' },
      ca: { x:60,  y:124,r:15, label:'C', role:'alpha-carbon' },
      o2: { x:186, y:122,r:16, label:'O', lp:2 },
      h:  { x:244, y:98, r:12, label:'H', role:'acidic-h', note:'The O–H proton, pKa ≈ 4.8 — acidic because the carboxylate left behind is resonance stabilized over two equivalent oxygens.' },
      ha: { x:24,  y:92, r:10, label:'H', role:'alpha-h', note:'An alpha C–H, pKa far above 20 here — not the acidic proton.' }
    },
    bonds: [{a:'c',b:'o1',order:2},{a:'c',b:'ca'},{a:'c',b:'o2'},{a:'o2',b:'h'},{a:'ca',b:'ha'}],
    caption: 'Two oxygens, but only one acidic hydrogen.'
  };

  M['ethylamine'] = {
    name: 'Ethylamine', formula: 'CH₃CH₂NH₂',
    atoms: {
      n:  { x:180, y:62, r:17, label:'N', lp:1, role:'nucleophile', note:'The nitrogen lone pair — available, so ethylamine is both nucleophilic and basic.' },
      h1: { x:236, y:38, r:11, label:'H' }, h2:{ x:228, y:96, r:11, label:'H' },
      c1: { x:116, y:96, r:16, label:'C' },
      c2: { x:54,  y:64, r:15, label:'C' },
      h3: { x:116, y:142,r:10, label:'H' }, h4:{ x:74, y:134, r:10, label:'H' }
    },
    bonds: [{a:'n',b:'h1'},{a:'n',b:'h2'},{a:'n',b:'c1'},{a:'c1',b:'c2'},{a:'c1',b:'h3'},{a:'c1',b:'h4'}],
    caption: 'A primary alkylamine.'
  };

  M['acetamide'] = {
    name: 'Acetamide', formula: 'CH₃CONH₂', viewBox: '0 0 320 180',
    atoms: {
      o:  { x:130, y:32, r:16, label:'O', lp:2, role:'carbonyl-o' },
      c:  { x:130, y:90, r:17, label:'C', role:'electrophile' },
      ca: { x:70,  y:124,r:15, label:'C', role:'alpha-carbon' },
      n:  { x:196, y:122,r:17, label:'N', lp:1, role:'conjugated-lone-pair', note:'This lone pair is delocalized into the C=O, so it is not available to grab a proton — amides are essentially non-basic.' },
      h1: { x:252, y:100,r:11, label:'H' }, h2:{ x:210, y:162, r:11, label:'H' }
    },
    bonds: [{a:'c',b:'o',order:2},{a:'c',b:'ca'},{a:'c',b:'n'},{a:'n',b:'h1'},{a:'n',b:'h2'}],
    caption: 'An amide — the nitrogen lone pair is tied up in resonance.'
  };

  /* ---- Two the lessons needed and the library did not have ------------
     Every lesson from Module 8 onward was written without a single
     structure on the page, and most of them could be fixed by pointing at
     a molecule already defined above. These two could not: the alkynes
     lesson had nothing with a triple bond in it, and the meso lesson
     talked about tartaric acid throughout while showing nothing. */

  M['propyne'] = {
    name: 'Propyne', formula: 'CH₃C≡CH',
    // The methyl is drawn condensed rather than as a bare C, because the
    // point of the picture is the contrast between its hydrogens (pKa ~50)
    // and the one on the far right (pKa ~25).
    viewBox: '0 0 320 132',
    atoms: {
      ch3: { x:54,  y:66, r:19, label:'CH₃', role:'alkyl', note:'An ordinary sp³ carbon. Its hydrogens sit around pKa 50 — nothing remotely acidic.' },
      c1:  { x:136, y:66, r:17, label:'C', role:'sp-carbon', note:'sp hybridized: two electron groups, 180° apart, so this end of the molecule is straight.' },
      c2:  { x:218, y:66, r:17, label:'C', role:'sp-carbon', note:'The other end of the triple bond — also sp hybridized, also linear.' },
      h:   { x:288, y:66, r:12, label:'H', role:'acidic-h', note:'The terminal alkyne C–H, pKa ≈ 25. The anion left behind sits in an sp orbital with 50% s character, held close to the nucleus — which is the whole reason this C–H is 25 orders of magnitude more acidic than the methyl hydrogens at the other end of the same molecule.' }
    },
    bonds: [{a:'ch3',b:'c1'},{a:'c1',b:'c2',order:3},{a:'c2',b:'h'}],
    caption: 'Linear at both sp carbons. Only the terminal C–H is acidic — and only because of the s character in the orbital that has to hold the anion.'
  };

  M['meso-tartaric-acid'] = {
    name: 'meso-tartaric acid', formula: 'HO₂C–CH(OH)–CH(OH)–CO₂H', viewBox: '0 0 320 210',
    atoms: {
      a1: { x:44,  y:52, r:15, label:'CO₂H' },
      c1: { x:122, y:78, r:17, label:'C', role:'stereocenter', note:'Stereocenter one: four different groups — OH, H, CO₂H and the rest of the chain.' },
      o1: { x:122, y:20, r:16, label:'OH', lp:2 },
      h1: { x:60,  y:110,r:11, label:'H' },
      c2: { x:198, y:132,r:17, label:'C', role:'stereocenter', note:'Stereocenter two — and the mirror image of the first. That internal mirror is what makes the whole molecule achiral despite having two stereocenters.' },
      o2: { x:198, y:190,r:16, label:'OH', lp:2 },
      h2: { x:260, y:100,r:11, label:'H' },
      a2: { x:276, y:158,r:15, label:'CO₂H' }
    },
    bonds: [{a:'a1',b:'c1'},{a:'c1',b:'o1'},{a:'c1',b:'h1'},{a:'c1',b:'c2'},
            {a:'c2',b:'o2'},{a:'c2',b:'h2'},{a:'c2',b:'a2'}],
    caption: 'Two stereocenters, (R) and (S) — and a mirror plane running between them. Superimposable on its own reflection, so it is achiral, and optically inactive.'
  };

  /* ---- Renderer -------------------------------------------------------- */

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function rolesOf(atom){
    if(!atom) return [];
    if(atom.roles) return atom.roles;
    return atom.role ? [atom.role] : [];
  }

  // Atom keys in a molecule carrying a given role — how a question declares
  // its answer without hard-coding which atom key happens to be right.
  function keysWithRole(mol, role){
    return Object.keys(mol.atoms).filter(function(k){ return rolesOf(mol.atoms[k]).indexOf(role) !== -1; });
  }

  function lonePairDots(a){
    if(!a.lp) return '';
    // Place pairs around the atom, starting above and going clockwise.
    var out = '', angles = [-90, 0, 90, 180];
    for(var i=0;i<Math.min(a.lp, 4);i++){
      var rad = angles[i] * Math.PI/180;
      var d = a.r + 6;
      var cx = a.x + d*Math.cos(rad), cy = a.y + d*Math.sin(rad);
      var px = -Math.sin(rad)*3.2, py = Math.cos(rad)*3.2;
      out += '<circle class="lp-dot" cx="' + (cx+px).toFixed(1) + '" cy="' + (cy+py).toFixed(1) + '" r="1.9"/>' +
             '<circle class="lp-dot" cx="' + (cx-px).toFixed(1) + '" cy="' + (cy-py).toFixed(1) + '" r="1.9"/>';
    }
    return out;
  }

  function bondPath(mol, b){
    var a = mol.atoms[b.a], c = mol.atoms[b.b];
    if(!a || !c) return '';
    var stroke = b.style === 'faint' ? 'var(--line-soft)' : 'var(--line)';
    var dx = c.x - a.x, dy = c.y - a.y, len = Math.sqrt(dx*dx + dy*dy) || 1;
    // Stop the line at each atom's edge so it doesn't run under the label.
    var ux = dx/len, uy = dy/len;
    var x1 = a.x + ux*(a.r - 1), y1 = a.y + uy*(a.r - 1);
    var x2 = c.x - ux*(c.r - 1), y2 = c.y - uy*(c.r - 1);
    if(b.style === 'wedge'){
      var wx = -uy*5, wy = ux*5;
      return '<path d="M ' + x1 + ' ' + y1 + ' L ' + (x2+wx) + ' ' + (y2+wy) + ' L ' + (x2-wx) + ' ' + (y2-wy) + ' Z" fill="var(--ink)"/>';
    }
    if(b.style === 'dash'){
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="3 4"/>';
    }
    var order = b.order || 1;
    if(order === 1){
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + stroke + '" stroke-width="2.5"/>';
    }
    var out = '', offsets = order === 2 ? [-3, 3] : [-4.5, 0, 4.5];
    offsets.forEach(function(o){
      var ox = -uy*o, oy = ux*o;
      out += '<line x1="' + (x1+ox).toFixed(1) + '" y1="' + (y1+oy).toFixed(1) + '" x2="' + (x2+ox).toFixed(1) + '" y2="' + (y2+oy).toFixed(1) + '" stroke="' + stroke + '" stroke-width="2.2"/>';
    });
    return out;
  }

  /* Where an arrow can start or end. Atoms by key, and bonds by "bond:a-b"
     — because half of arrow-pushing starts at a BOND, not an atom: the
     C-Br electrons leaving with bromide, the pi bond attacking an
     electrophile. Without a bond anchor a student can only ever draw the
     lone-pair half of a mechanism. Bond keys are order-insensitive, so
     "bond:c1-br" and "bond:br-c1" resolve to the same midpoint. */
  function anchor(mol, key){
    if(!key) return null;
    if(mol.atoms[key]) return mol.atoms[key];
    var m = /^bond:(.+?)-(.+)$/.exec(key);
    if(!m) return null;
    var a = mol.atoms[m[1]], b = mol.atoms[m[2]];
    if(!a || !b) return null;
    // Slightly larger than it looks: the arrow tail is offset by r, and
    // starting it right at the midpoint buries the tail in the bond stroke.
    return { x:(a.x + b.x)/2, y:(a.y + b.y)/2, r:13, isBond:true };
  }

  function bondKey(b){ return 'bond:' + b.a + '-' + b.b; }

  // Matches a bond key against a bond regardless of which end is named first.
  function sameBond(key, b){
    var m = /^bond:(.+?)-(.+)$/.exec(key || '');
    if(!m) return false;
    return (m[1] === b.a && m[2] === b.b) || (m[1] === b.b && m[2] === b.a);
  }

  /* Invisible fat line over each bond so it can be clicked. Drawn after the
     bond strokes but before the atoms, so an atom always wins a click where
     the two overlap. */
  function bondHit(mol, b, opts){
    var a = mol.atoms[b.a], c = mol.atoms[b.b];
    if(!a || !c) return '';
    var key = bondKey(b);
    var on = opts.clickableBonds === 'all' ||
             (opts.clickableBonds && opts.clickableBonds.some(function(k){ return sameBond(k, b); }));
    if(!on) return '';
    var cls = 'obond';
    if(opts.chosen && opts.chosen.some(function(k){ return sameBond(k, b); })) cls += ' chosen';
    return '<line class="' + cls + '" data-key="' + esc(key) + '" tabindex="0" role="button"' +
      ' x1="' + a.x + '" y1="' + a.y + '" x2="' + c.x + '" y2="' + c.y + '"/>';
  }

  function atomGroup(key, a, opts){
    var cls = 'atom';
    var clickable = opts.clickable === 'all' || (opts.clickable && opts.clickable.indexOf(key) !== -1);
    if(!clickable) cls += ' atom--static';
    if(opts.chosen && opts.chosen.indexOf(key) !== -1) cls += ' chosen';
    if(opts.highlight && opts.highlight.indexOf(key) !== -1) cls += ' atom--highlight';
    if(opts.correct && opts.correct.indexOf(key) !== -1) cls += ' atom--correct';
    if(opts.wrong && opts.wrong.indexOf(key) !== -1) cls += ' atom--wrong';
    var fontSize = a.r > 15 ? 14.5 : (a.r > 12 ? 12.5 : 11);
    return '<g class="' + cls + '" data-key="' + esc(key) + '"' + (clickable ? ' tabindex="0" role="button"' : '') + '>' +
      lonePairDots(a) +
      '<circle cx="' + a.x + '" cy="' + a.y + '" r="' + a.r + '" fill="var(--white)" stroke="var(--line)" stroke-width="2"/>' +
      '<text x="' + a.x + '" y="' + (a.y + fontSize*0.35) + '" text-anchor="middle" font-size="' + fontSize + '">' +
        esc(a.label) + (a.charge ? esc(a.charge) : '') +
      '</text>' +
    '</g>';
  }

  // A curved arrow between two atoms, in the same visual language as the
  // mechanism pages: tail at the electron source, head at the destination.
  function arrowPath(mol, arrow, i){
    var a = anchor(mol, arrow.from), b = anchor(mol, arrow.to);
    if(!a || !b) return '';
    var color = arrow.color || 'var(--accent)';
    var id = 'omol-ah' + i;
    /* Curved arrows are drawn as an arc that leaves the source atom sideways
       and comes back into the target atom sideways, bowing to one side of the
       bond — the way they're drawn by hand.

       Two things this has to get right, because both are common here. First,
       the bow must be perpendicular to the from->to vector rather than always
       upward, or a vertically stacked pair (a lone pair above its atom, a
       carbonyl oxygen above its carbon) collapses into a hook. Second, the
       endpoints are placed by ROTATING off the bond direction rather than by
       sliding along it — sliding eats the whole path on a short bond and
       leaves nothing but an arrowhead. */
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx*dx + dy*dy) || 1;
    var ux = dx/len, uy = dy/len;
    var nx = -uy, ny = ux;
    var sigma = 1;
    if(ny > 0){ nx = -nx; ny = -ny; sigma = -1; }   // keep the arc on the upper side
    var phi = sigma * 48 * Math.PI/180;
    function rot(x, y, ang){
      var c = Math.cos(ang), s2 = Math.sin(ang);
      return [x*c - y*s2, x*s2 + y*c];
    }
    var st = rot(ux, uy, phi);                       // leave the source sideways
    var en = rot(-ux, -uy, -phi);                    // enter the target sideways
    /* Short hops (a bond to the atom at its own end, a lone pair to its
       neighbour) need a proportionally bigger bow or the arc degenerates
       into a hook tucked under the atom it points at. */
    var bow = arrow.bow === undefined ? Math.max(len < 55 ? 19 : 14, Math.min(34, len * 0.33)) : arrow.bow;
    /* Clear each anchor, but never by so much that there is no arc left. Bond
       anchors sit at bond midpoints, and two adjacent bonds' midpoints can be
       only ~40px apart — with a fixed r+3 offset at each end that consumes the
       whole path and leaves a bare arrowhead floating in space. Capping the
       offset at a fraction of the length keeps a visible arc on short hops
       while leaving long ones exactly as they were. */
    var offA = Math.min(a.r + 3, len * 0.3);
    var offB = Math.min(b.r + 5, len * 0.3);
    var x1 = a.x + st[0]*offA, y1 = a.y + st[1]*offA;
    var x2 = b.x + en[0]*offB, y2 = b.y + en[1]*offB;
    var mx = (x1 + x2)/2 + nx*bow, my = (y1 + y2)/2 + ny*bow;
    var d = 'M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q ' + mx.toFixed(1) + ' ' + my.toFixed(1) +
            ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
    /* The visible arrow rides inside a group with a fat transparent twin. A
       2.5px curved stroke is not something you can reliably tap, and in the
       editor an arrow is a click target — you click one to erase it. The
       twin is stroke-only hit area; the group carries the index so the
       editor knows which arrow was hit without counting DOM order. */
    return '<g class="oarrow" data-arrow="' + i + '">' +
           '<defs><marker id="' + id + '" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">' +
             '<path d="M0,0 L6,3 L0,6 Z" fill="' + color + '"/></marker></defs>' +
           '<path class="oarrow-hit" d="' + d + '" stroke="transparent" stroke-width="18" fill="none"/>' +
           '<path class="oarrow-line" d="' + d + '" ' +
             'stroke="' + color + '" stroke-width="2.5" fill="none" marker-end="url(#' + id + ')"/>' +
           '</g>';
  }

  /* Render a molecule to an SVG string wrapped in .scene.
       opts.clickable  'all' | [keys]   which atoms respond to clicks
       opts.chosen     [keys]           currently selected
       opts.highlight  [keys]           attention ring (used by feedback)
       opts.correct    [keys]           marked green after the answer
       opts.wrong      [keys]           marked red after the answer
       opts.arrows     [{from,to,color,bow}] — from/to are atom keys or "bond:a-b"
       opts.clickableBonds 'all' | [bond keys]  which bonds respond to clicks
       opts.caption    override the molecule's own caption ('' to hide) */
  function svg(molOrId, opts){
    var mol = typeof molOrId === 'string' ? M[molOrId] : molOrId;
    if(!mol) return '';
    opts = opts || {};
    var body = (mol.decor || '') +
      mol.bonds.map(function(b){ return bondPath(mol, b); }).join('') +
      mol.bonds.map(function(b){ return bondHit(mol, b, opts); }).join('') +
      Object.keys(mol.atoms).map(function(k){ return atomGroup(k, mol.atoms[k], opts); }).join('') +
      (opts.arrows || []).map(function(ar, i){ return arrowPath(mol, ar, i); }).join('');
    var caption = opts.caption === undefined ? mol.caption : opts.caption;
    return '<div class="scene omol">' +
      '<svg viewBox="' + (mol.viewBox || '0 0 320 170') + '" role="img" aria-label="' + esc(mol.name) + '">' + body + '</svg>' +
      (caption ? '<div class="omol-caption">' + esc(caption) + '</div>' : '') +
    '</div>';
  }

  function noteFor(molOrId, key){
    var mol = typeof molOrId === 'string' ? M[molOrId] : molOrId;
    var a = mol && mol.atoms[key];
    return a && a.note ? a.note : '';
  }

  function labelFor(molOrId, key){
    var mol = typeof molOrId === 'string' ? M[molOrId] : molOrId;
    var a = mol && mol.atoms[key];
    return a ? a.label + (a.charge || '') : key;
  }

  window.OchemMolecules = {
    ALL: M,
    get: function(id){ return M[id] || null; },
    svg: svg,
    anchor: anchor,
    bondKey: bondKey,
    sameBond: sameBond,
    keysWithRole: keysWithRole,
    rolesOf: rolesOf,
    noteFor: noteFor,
    labelFor: labelFor
  };
})();
