/* Conformation Lab, tools v2 (docs/tools-v2-conformations-brief.md; standard: docs/tools-v2-standard.md).

   Two tabs, one idea each, on the shared kit (assets/course/tool-kit2.js, turned on by OchemStudioKit.kit2 in
   tool-shell.js):

   TURN A BOND. A ball and stick model of the two carbons, seen from the side (a sawhorse view; the Newman
   projection of the same shape rides along as a small inset). The student grabs the model and turns the back carbon; a ball
   rides the energy hill beside it. Each molecule declares its energy at the six positions a textbook prints (three
   eclipsed, three staggered) and the curve between them is a cosine interpolation, flat at each node, so every peak
   and valley sits exactly where the chemistry says. Eclipsed bonds are joined by an amber plane (torsional strain);
   big groups that crowd each other glow red (steric strain).

   FLIP A CHAIR. One cyclohexane ring built from real geometry: the four seat carbons stay put while one end swings
   down (chair, half chair, boat) and then the other swings up (the other chair), so the ring never passes through
   a flat hexagon. Axial and equatorial are computed each frame from the bond's angle to the ring's mean plane, so
   every bond is seen swinging from one to the other. An axial group glows red against the two axial atoms on its
   face (1,3-diaxial strain); the ends of the flip control show both chairs and the share of molecules in each.

   EXPLORE is free play. TEST YOURSELF holds the two drills the old tool had (where does this Newman projection
   sit on the curve; find the more stable chair) and the six question Check yourself, with the same record ids. */
(function(){
  var M3 = window.OchemMol3D;
  var root = document.getElementById('cfRoot');
  if(!M3 || !root) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  var RT = 0.5925;    // kcal/mol at 298 K: turns an energy gap into a ratio

  /* ====================================================================== */
  /* NEWMAN                                                                  */
  /* ====================================================================== */

  /* energies[] are kcal/mol at 0°, 60°, 120°, 180°, 240°, 300°. front/back
     are the three substituents on each carbon, listed from the 12 o'clock
     position going clockwise. */
  var TORSIONALS = [
    {
      id:'ethane', name:'Ethane', formula:'C₂H₆',
      front:['H','H','H'], back:['H','H','H'],
      energies:[3.0, 0, 3.0, 0, 3.0, 0],
      note:'Three H/H eclipsing interactions at a time, about 1 kcal/mol each. There is no steric story here at all: the hydrogens are nowhere near touching. The barrier is torsional strain. The usual picture is filled C–H bonds repelling filled C–H bonds when they line up; a stabilizing overlap between neighboring bonds in the staggered shape is part of it too.'
    },
    {
      id:'propane', name:'Propane', formula:'C₃H₈',
      front:['CH₃','H','H'], back:['H','H','H'],
      energies:[3.4, 0, 3.4, 0, 3.4, 0],
      note:'One H/CH₃ eclipse (about 1.4) plus two H/H (about 1 each). Slightly worse than ethane, and still only one kind of staggered conformer.'
    },
    {
      id:'butane', name:'Butane', formula:'C₄H₁₀',
      front:['CH₃','H','H'], back:['CH₃','H','H'],
      energies:[4.6, 0.9, 3.6, 0, 3.6, 0.9],
      note:'The one worth knowing. Two different staggered conformers (anti at 180°, gauche at 60° and 300°) and two different eclipsed ones. Gauche is a real minimum, just not the best one.'
    },
    {
      id:'dichloroethane', name:'1,2-dichloroethane', formula:'C₂H₄Cl₂',
      front:['Cl','H','H'], back:['Cl','H','H'],
      energies:[5.0, 1.1, 4.0, 0, 4.0, 1.1],
      note:'The same shape of curve as butane with bigger groups. In the gas phase anti wins comfortably; in a polar solvent the gauche form, which has a dipole, closes much of the gap.'
    },
    {
      id:'dibromoethane', name:'1,2-dibromoethane', formula:'C₂H₄Br₂',
      front:['Br','H','H'], back:['Br','H','H'],
      energies:[6.0, 1.5, 4.3, 0, 4.3, 1.5],
      note:'Chlorine’s curve with a heavier halogen: every well is deeper and anti wins by more. This is what the steric story predicts, and it is worth having in mind before you meet the next molecule, which does the opposite.'
    },
    {
      /* The reason this one is in the list. Every rule a student has been
         given says the big groups go anti — and difluoroethane's gauche form
         is the more stable one, by about half a kcal. The tool cannot derive
         this and does not pretend to: the builder further down would get it
         backwards, which is exactly why the measured numbers are typed in
         here and the note says what the model is missing. */
      id:'difluoroethane', name:'1,2-difluoroethane', formula:'C₂H₄F₂',
      front:['F','H','H'], back:['F','H','H'],
      energies:[5.2, 0, 3.4, 0.6, 3.4, 0],
      note:'Look at which minimum is lowest: gauche, not anti, the opposite of butane and of every other molecule on this list. This is the gauche effect. Fluorine is small enough that sterics barely matter, and a stabilizing overlap between a C–H bonding orbital and the C–F antibonding orbital only lines up when the two fluorines are 60° apart. Sterics is not the only thing holding a conformation.',
      gauche:'effect'
    },
    {
      id:'ethylene-glycol', name:'Ethylene glycol', formula:'HOCH₂CH₂OH',
      front:['OH','H','H'], back:['OH','H','H'],
      energies:[4.4, 0, 3.2, 0.7, 3.2, 0],
      note:'Gauche again, and for a completely different reason: at 60° the two hydroxyls are close enough to hydrogen bond to each other, and that bond is worth more than the crowding costs. In water the intramolecular hydrogen bond largely gives way to hydrogen bonds with the solvent, yet gauche still predominates, because the same orbital effect that favors gauche in difluoroethane operates here too.',
      gauche:'hbond'
    },
    {
      id:'methylbutane', name:'2-methylbutane', formula:'(CH₃)₂CHCH₂CH₃',
      front:['CH₃','CH₃','H'], back:['CH₃','H','H'],
      energies:[4.1, 0.9, 4.1, 0, 3.3, 0],
      note:'Butane with one extra methyl, and the curve stops being symmetric. The three staggered wells are no longer all alike: two (one CH₃/CH₃ gauche each) tie for lowest, and the one with the C3 methyl between both C2 methyls pays a second gauche. The eclipsed peaks split the same way. Most real molecules look like this rather than like butane.'
    }
  ];

  /* ---- Building a torsion nobody typed in -------------------------------

     The twelve presets declare their six node energies directly, and where a
     textbook prints the number that is the honest thing to do. But a student
     who wants to see what happens with a tert-butyl on one carbon and a
     chlorine on the other is not served by a list, so the same six numbers can
     be computed from the substituents instead.

     Two terms, and both are pinned to values a course actually prints.

       eclipsing   e(a) + e(b) + 0.277·A(a)·A(b), with e(X) = 0.5 + 0.235·A(X)
       gauche      0.31·A(a)·A(b)

     Those constants are not decoration: they are what makes the formula
     reproduce butane exactly — 1.0 for H/H eclipsing, 1.4 for H/CH3, 2.6 for
     CH3/CH3, 0.9 for a CH3/CH3 gauche, and therefore 4.6, 0.9, 3.8, 0 around
     the curve. Everything involving a hydrogen falls out at zero for gauche,
     which is right: two groups 60° apart only cost anything if both of them
     are big.

     Beyond methyl the numbers are extrapolated from A-values rather than
     measured, and the tool says so on screen. An A-value measures how much a
     group dislikes being crowded, which is the same instinct the eclipsing
     term is trying to capture — but "same instinct" is not "same
     measurement", and pretending otherwise would be inventing data. */
  function aOf(key){ return (SUBS[key] && SUBS[key].a) || 0; }

  function eclipseCost(x, y){
    var ax = aOf(x), ay = aOf(y);
    return (0.5 + 0.235 * ax) + (0.5 + 0.235 * ay) + 0.277 * ax * ay;
  }
  function gaucheCost(x, y){
    return 0.31 * aOf(x) * aOf(y);
  }

  /* front[i] sits at theta + i·120; back[j] sits at j·120. At an eclipsed
     angle each front group is on top of exactly one back group; at a staggered
     one each is 60° from two of them and 180° from the third. */
  function computeEnergies(front, back){
    var out = [];
    for(var n=0; n<6; n++){
      var theta = n * 60;
      var total = 0;
      for(var i=0;i<3;i++){
        for(var j=0;j<3;j++){
          var d = Math.abs(((theta + i*120) - (j*120)) % 360);
          if(d > 180) d = 360 - d;
          if(d < 1)        total += eclipseCost(front[i], back[j]);
          else if(d < 61)  total += gaucheCost(front[i], back[j]);
          // 180° apart is anti and costs nothing.
        }
      }
      out.push(total);
    }
    var min = Math.min.apply(null, out);
    // Energies are reported relative to the best conformation, which is the
    // only thing a torsional curve can honestly claim to know.
    return out.map(function(v){ return Math.round((v - min) * 100) / 100; });
  }

  function customTorsion(front, back){
    return {
      id:'custom', name:'Your own', formula:'',
      front: front.slice(), back: back.slice(),
      energies: computeEnergies(front, back),
      custom: true,
      note:'Built from the groups you chose. The eclipsing and gauche costs are computed from A-values, ' +
           'calibrated so that ethane and butane come out at their textbook numbers. Anything bigger than a methyl is ' +
           'an extrapolation rather than a measurement.'
    };
  }

  /* A-values: how much it costs, in kcal/mol, to put this group axial rather
     than equatorial on a cyclohexane. The standard table. */
  var SUBS = {
    H:     { label:'H',    a:0,    r:0.30, color:'#E4DFD4', ink:'#2A2A28' },
    Me:    { label:'CH₃',  a:1.70, r:0.52, color:'#4A5A54', ink:'#FFFFFF' },
    Et:    { label:'Et',   a:1.75, r:0.58, color:'#4A5A54', ink:'#FFFFFF' },
    iPr:   { label:'iPr',  a:2.15, r:0.64, color:'#3F4C47', ink:'#FFFFFF' },
    tBu:   { label:'tBu',  a:4.90, r:0.76, color:'#333E3A', ink:'#FFFFFF' },
    Ph:    { label:'Ph',   a:2.80, r:0.70, color:'#3B4F49', ink:'#FFFFFF' },
    OH:    { label:'OH',   a:0.87, r:0.46, color:'#D1594A', ink:'#FFFFFF' },
    OMe:   { label:'OMe',  a:0.75, r:0.54, color:'#D1594A', ink:'#FFFFFF' },
    F:     { label:'F',    a:0.25, r:0.40, color:'#5FA85A', ink:'#FFFFFF' },
    Cl:    { label:'Cl',   a:0.43, r:0.50, color:'#5FA85A', ink:'#FFFFFF' },
    Br:    { label:'Br',   a:0.38, r:0.56, color:'#A0522D', ink:'#FFFFFF' }
  };

  var PRESETS = [
    { id:'methyl',      label:'Methylcyclohexane',   subs:[['Me','up'],null,null,null,null,null] },
    { id:'tbu',         label:'tert-Butylcyclohexane', subs:[['tBu','up'],null,null,null,null,null] },
    { id:'cis12',       label:'cis-1,2-dimethyl',    subs:[['Me','up'],['Me','up'],null,null,null,null] },
    { id:'trans12',     label:'trans-1,2-dimethyl',  subs:[['Me','up'],['Me','down'],null,null,null,null] },
    { id:'cis13',       label:'cis-1,3-dimethyl',    subs:[['Me','up'],null,['Me','up'],null,null,null] },
    { id:'trans13',     label:'trans-1,3-dimethyl',  subs:[['Me','up'],null,['Me','down'],null,null,null] },
    { id:'cis14',       label:'cis-1,4-dimethyl',    subs:[['Me','up'],null,null,['Me','up'],null,null] },
    { id:'trans14',     label:'trans-1,4-dimethyl',  subs:[['Me','up'],null,null,['Me','down'],null,null] }
  ];

  /* What this chair costs: every non-hydrogen sitting axial pays its A-value,
     plus a surcharge for two axial groups 1,3 to each other: they point the
     same way on the same face and genuinely collide, which a plain sum of
     A-values does not capture. */
  function chairEnergy(chair){
    var axialSubs = chair.atoms.filter(function(a){
      return a.subKey && a.subKey !== 'H' && a.isAxial;
    });
    var total = 0, terms = [];

    axialSubs.forEach(function(a){
      var s = SUBS[a.subKey];
      total += s.a;
      terms.push({ text: s.label + ' axial at C' + (a.carbon + 1), kcal: s.a });
    });

    for(var i=0;i<axialSubs.length;i++){
      for(var j=i+1;j<axialSubs.length;j++){
        var d = Math.abs(axialSubs[i].carbon - axialSubs[j].carbon);
        if(d === 2 || d === 4){
          total += 1.6;
          terms.push({
            text: 'Extra 1,3-diaxial crowding between ' + SUBS[axialSubs[i].subKey].label +
                  ' and ' + SUBS[axialSubs[j].subKey].label + ' (rough flat estimate)',
            kcal: 1.6
          });
        }
      }
    }

    /* Two groups on neighboring carbons are gauche to each other (60° apart, as in gauche butane) unless both are
       axial, where they point opposite ways. When at least one of the two is a carbon group the pair pays 0.9
       kcal/mol: the measured CH₃/CH₃ value (OpenStax Organic Chemistry 4.8: trans-1,2-dimethylcyclohexane
       diequatorial 3.8 kJ/mol, each cis chair 11.4), a flat estimate for the other carbon pairs. Two heteroatom
       groups (F, Cl, Br, OH, OMe) are not costed and get no glow: dipoles and hydrogen bonds decide there, and
       tab 1 teaches that F/F and OH/OH prefer to be gauche (docs/ochem-needs-author.md, "conf-v2-vicinal"). */
    var gauche = [], polar = [];
    var mes = chair.atoms.filter(function(a){ return a.subKey && a.subKey !== 'H'; });
    for(var m=0;m<mes.length;m++){
      for(var n=m+1;n<mes.length;n++){
        var dc = Math.abs(mes[m].carbon - mes[n].carbon);
        if((dc === 1 || dc === 5) && !(mes[m].isAxial && mes[n].isAxial)){
          var who = SUBS[mes[m].subKey].label + ' on C' + (mes[m].carbon + 1) + ' and ' + SUBS[mes[n].subKey].label + ' on C' + (mes[n].carbon + 1);
          if(!ALKYL[mes[m].subKey] && !ALKYL[mes[n].subKey]){
            polar.push([mes[m], mes[n]]);
            terms.push({ text: who + ': two polar neighbors, not estimated here (dipoles and hydrogen bonds decide)', kcal: 0 });
            continue;
          }
          total += 0.9;
          gauche.push([mes[m], mes[n]]);
          terms.push({ text: who + ' gauche, 60° apart' + (mes[m].subKey === 'Me' && mes[n].subKey === 'Me' ? '' : ' (CH₃/CH₃ value, a rough estimate here)'), kcal: 0.9 });
        }
      }
    }
    total = Math.round(total * 100) / 100;

    return { total: total, terms: terms, axial: axialSubs, gauche: gauche, polar: polar };
  }

  /* ====================================================================== */
  /* The model both tabs read: names, strain, chair geometry                 */
  /* ====================================================================== */

  var tor = TORSIONALS[2];      // opens on butane
  var theta = 180;              // anti: calm, and a turn either way costs energy
  var LABEL_KEY = {};
  Object.keys(SUBS).forEach(function(k){ LABEL_KEY[SUBS[k].label] = k; });
  // A preset lists its groups by label ('CH₃'), a built one by key ('Me').
  function gkey(x){ return SUBS[x] ? x : (LABEL_KEY[x] || 'H'); }
  var ALKYL = { Me:1, Et:1, iPr:1, tBu:1, Ph:1 };
  var FA = [90, 210, 330];      // where the three bonds of a carbon point, looking down the bond
  function mod360(t){ return ((t % 360) + 360) % 360; }
  function sepDeg(a, b){ var d = mod360(a - b); return d > 180 ? 360 - d : d; }
  function fx(n){ return n.toFixed(1); }
  function dot(a, b){ return a.x * b.x + a.y * b.y + a.z * b.z; }

  /* Cosine interpolation between the six declared points. Flat at each node,
     so every maximum and minimum lands exactly on a multiple of 60°. */
  function energyOf(E, t){
    var x = mod360(t), i = Math.floor(x / 60) % 6, f = (x - i * 60) / 60;
    var e0 = E[i], e1 = E[(i + 1) % 6];
    return e0 + (e1 - e0) * (1 - Math.cos(Math.PI * f)) / 2;
  }
  function energyAt(t){ return energyOf(tor.energies, t); }
  function minE(){ return Math.min.apply(null, tor.energies); }

  /* Every pair of non-hydrogen groups, one on each carbon, and how far apart they are around the bond. */
  function bigPairs(t){
    var out = [];
    tor.front.forEach(function(f, i){
      if(gkey(f) === 'H') return;
      tor.back.forEach(function(b, j){
        if(gkey(b) === 'H') return;
        out.push({ i:i, j:j, f:gkey(f), b:gkey(b), sep: sepDeg(FA[i], FA[j] + t) });
      });
    });
    return out;
  }

  /* What this conformation is, read from the groups and the declared energies (never from the angle alone: 60° is
     gauche only when two real groups are 60° apart, and anti is "lowest" only where the numbers say so). The
     picture, its labels, the cause line and the reference all read this one function. */
  var AT = 10;      // within this many degrees of a landmark, the shape has its name
  function conf(t){
    var x = mod360(t), near = Math.round(x / 60) * 60 % 360, at = sepDeg(x, near) < AT;
    var ecl = near % 120 === 0, bp = bigPairs(near);
    var nE = bp.filter(function(p){ return p.sep < 1; }).length;
    var nG = bp.filter(function(p){ return Math.abs(p.sep - 60) < 1; }).length;
    var single = bp.length === 1;
    var mn = minE(), mx = Math.max.apply(null, tor.energies), e = tor.energies[near / 60];
    var labs = [];
    bp.forEach(function(p){ [p.f, p.b].forEach(function(k){ if(labs.indexOf(SUBS[k].label) < 0) labs.push(SUBS[k].label); }); });
    var key = !at ? 'between' : ecl ? (nE && single ? 'syn' : 'eclipsed') : !bp.length ? 'staggered' : single ? (nG ? 'gauche' : 'anti') : 'staggered';
    return { at:at, near:near, ecl:ecl, key:key, pairs:bp.length, nE:nE, nG:nG, single:single,
      grp: labs.length === 1 ? labs[0] : 'big group', grps: labs.length === 1 ? labs[0] + ' groups' : 'big groups',
      alkyl: bp.length > 0 && bp.every(function(p){ return ALKYL[p.f] && ALKYL[p.b]; }),
      up: e - mn, isMin: e - mn < 0.005, isMax: mx - e < 0.005 };
  }
  var SHORT = { between:'Part way', syn:'Fully eclipsed', eclipsed:'Eclipsed', gauche:'Gauche', anti:'Anti', staggered:'Staggered' };
  var LONG = { between:'On the way', syn:'Syn-periplanar (totally eclipsed)', eclipsed:'Eclipsed', gauche:'Gauche', anti:'Anti (anti-periplanar)', staggered:'Staggered' };
  // What two crowded groups do to each other, in the words the picture and the cause line share.
  function crowdWord(c){ return c.alkyl ? 'steric strain' : 'they repel'; }
  function crowdLabel(c){ return c.alkyl ? 'steric strain' : 'groups repel'; }

  /* The name and the sentence behind it, for the reference sheet and the drill's feedback. */
  function describeTorsion(t){
    var c = conf(t), name = LONG[c.key], g = c.grp, detail;
    if(c.key === 'between'){
      detail = 'Between conformations. The molecule spends very little time here, because it is on the side of a hill rather than at the bottom of a valley or the top of a pass.';
    } else if(c.key === 'syn'){
      detail = 'The two ' + g + ' groups are eclipsing each other directly, so you are paying a torsional cost and a crowding cost at the same time. This is the highest point on the curve.';
    } else if(c.key === 'eclipsed'){
      detail = c.nE ? 'Bonds lined up front to back, with a ' + g + ' directly behind another. Torsional strain plus crowding: ' + fx(c.up) + ' kcal/mol above the lowest shape.'
        : c.single ? 'A ' + g + ' group eclipsing a hydrogen, twice, plus one H/H. ' + fx(c.up) + ' kcal/mol above the lowest shape, but better than having the two big groups eclipse each other.'
        : c.pairs ? 'Bonds lined up front to back, but no two big groups behind each other. ' + fx(c.up) + ' kcal/mol above the lowest shape.'
        : 'Every front bond is lined up with a back bond: torsional strain, three times over.';
    } else if(c.key === 'anti'){
      detail = c.isMin ? 'The two ' + g + ' groups are as far apart as the bond allows, 180° across. This is the lowest energy shape and where most molecules are at any instant.'
        : 'The two ' + g + ' groups are 180° apart. For this molecule that is not the lowest energy shape: gauche is, by ' + fx(c.up) + ' kcal/mol. The note below says why.';
    } else if(c.key === 'gauche'){
      detail = c.isMin ? 'Staggered, with the two ' + g + ' groups 60° apart. For this molecule that is the lowest energy shape. The note below says why.'
        : 'Staggered, so nothing is eclipsed, but the two ' + g + ' groups are only 60° apart and close enough to push on each other. That cost, about ' + fx(c.up) + ' kcal/mol, is what separates gauche from anti.';
    } else {
      detail = !c.pairs ? 'Staggered: every front bond sits between two back bonds. Nothing is eclipsing anything, and all three staggered shapes are the same.'
        : 'Staggered, with ' + (c.nG === 1 ? 'one pair' : c.nG + ' pairs') + ' of big groups 60° apart (gauche). ' + (c.isMin ? 'This is the lowest energy shape.' : fx(c.up) + ' kcal/mol above the lowest shape.');
    }
    return { name: name, detail: detail };
  }

  /* The chain under the picture, from the same reading. One colour per idea: torsional strain amber, crowding
     red, a relaxed shape green, energy in the course colour. */
  function chainBond(){
    var c = conf(theta), e = energyAt(theta) - minE();
    // "highest" and "lowest" only where the number shown is the extreme, not everywhere the name holds
    var mxE = Math.max.apply(null, tor.energies) - minE(), top = c.at && c.isMax && mxE - e < 0.05, low = c.at && c.isMin && e < 0.05;
    var ev = { t: fx(e) + ' kcal/mol' + (top ? ', highest' : low ? ', lowest' : ''), role:'energy',
      say: fx(e) + ' kilocalories per mole above the lowest shape' + (top ? ', the highest point' : low ? ', the lowest point' : '') };
    if(!c.at) return [{ t:'Part way', role:'ink', say:'Part way between two shapes' }, ev];
    var a = [];
    if(c.ecl){
      a.push({ t:'Eclipsed: torsional strain', role:'tors', say:'Bonds eclipsed: torsional strain' });
      if(c.nE) a.push({ t: c.grp + ' on ' + c.grp + ': ' + (c.alkyl ? 'steric' : 'repel'), role:'steric', join:'+', say: c.grp + ' on ' + c.grp + ': ' + crowdWord(c) });
    } else {
      a.push({ t: c.pairs ? 'Staggered' : 'Staggered: no strain', role:'calm' });
      if(c.nG && tor.gauche === 'effect') a.push({ t: c.grps + ' close: gauche effect', role:'calm', join:'+' });
      else if(c.nG && tor.gauche === 'hbond') a.push({ t: c.grps + ' close: hydrogen bond', role:'calm', join:'+' });
      else if(c.nG && !c.single) a.push(c.isMin ? { t: countPairs(c) + ' close', role:'ink', join:'+' } : { t: countPairs(c) + ' close: ' + crowdWord(c), role:'steric', join:'+' });
      else if(c.nG) a.push({ t: c.grps + ' close: ' + crowdWord(c), role:'steric', join:'+' });
      else if(c.pairs) a.push({ t: c.grps + ' far apart', role:'calm', join:'+' });
    }
    a.push(ev);
    return a;
  }
  // With more than one pair of big groups, the pairs 60° apart are counted: "1 CH₃ pair", "2 CH₃ pairs".
  function countPairs(c){ return c.nG + ' ' + c.grp + (c.nG === 1 ? ' pair' : ' pairs'); }
  // Whether the line under the picture names crowding at this landmark (the picture's label follows it).
  function crowdNamed(c){ return !!(c.nE || (c.nG && !tor.gauche && (c.single || !c.isMin))); }
  // How strongly two groups that far apart crowd each other in the picture (0 to 1; continuous as the bond turns).
  function stericW(sep){
    if(tor.gauche) return sep < 45 ? 1 - sep / 45 : 0;
    return sep <= 60 ? 1 - 0.6 * sep / 60 : sep < 95 ? 0.4 * (1 - (sep - 60) / 35) : 0;
  }
  function torsW(sep){ return sep < 30 ? Math.pow(Math.cos(sep / 30 * Math.PI / 2), 2) : 0; }

  /* ---- The chair ----------------------------------------------------------
     Position i carries [key, 'up'|'down'], or null for two hydrogens. p runs from 0 (one chair) to 1 (the other).
     The four seat carbons (C2, C3, C5, C6) stay put; C1 swings down over the first half (chair, half chair at
     p = 0.25, boat at p = 0.5) and C4 swings up over the second (half chair at 0.75, the other chair), each on an
     arc about its two neighbors, so every C-C bond keeps its length. A group's face (up or down) is which of its
     carbon's two free directions points more along the ring's mean plane normal; axial is whichever is more
     parallel to it. Nothing is labelled by position: the geometry decides, so the flipped chair reassigns itself. */
  var ring = [null, null, null, null, null, null];
  var XS = 0.765, YC = 1.26, DD = 0.868, PHI = 50 * Math.PI / 180;
  function sm(x){ x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function chairAt(p, rng){
    rng = rng || ring;
    var f1 = PHI * (1 - 2 * sm(p / 0.5)), f4 = -PHI * (1 - 2 * sm((p - 0.5) / 0.5));
    var P = [M3.v(XS + DD * Math.cos(f1), 0, DD * Math.sin(f1)), M3.v(XS, YC, 0), M3.v(-XS, YC, 0),
             M3.v(-XS - DD * Math.cos(f4), 0, DD * Math.sin(f4)), M3.v(-XS, -YC, 0), M3.v(XS, -YC, 0)];
    var c = M3.v(0, 0, 0), n = M3.v(0, 0, 0), i;
    P.forEach(function(q){ c = M3.add(c, q); });
    c = M3.mul(c, 1 / 6);
    P = P.map(function(q){ return M3.sub(q, c); });
    for(i = 0; i < 6; i++) n = M3.add(n, M3.cross(P[i], P[(i + 1) % 6]));
    n = M3.norm(n); if(n.z < 0) n = M3.mul(n, -1);
    // Level the ring: turn it about the y axis so its mean plane is flat (the seat then rocks a little as the ring
    // flips, as a model in the hand does), and both chairs are seen from the same side.
    var al = Math.atan2(n.x, n.z), ca = Math.cos(al), sa = Math.sin(al);
    P = P.map(function(q){ return M3.v(q.x * ca - q.z * sa, q.y, q.x * sa + q.z * ca); });
    n = M3.v(0, 0, 1);
    var atoms = [];
    for(i = 0; i < 6; i++){
      var d = M3.completeTetrahedral([M3.sub(P[(i + 5) % 6], P[i]), M3.sub(P[(i + 1) % 6], P[i])], 2);
      var up = dot(d[0], n) >= dot(d[1], n) ? 0 : 1;
      var ax = Math.abs(dot(d[0], n)) > Math.abs(dot(d[1], n)) ? 0 : 1;
      [up, 1 - up].forEach(function(k, f){
        var face = f === 0 ? 'up' : 'down', entry = rng[i];
        var key = entry && entry[1] === face ? entry[0] : 'H';
        atoms.push({ carbon:i, face:face, subKey:key, isAxial: k === ax, axness: Math.abs(dot(d[k], n)), dir: d[k],
          pos: M3.add(P[i], M3.mul(d[k], key === 'H' ? 1.09 : 1.53)) });
      });
    }
    return { C:P, n:n, atoms:atoms };
  }
  function ringSubs(rng){ return (rng || ring).filter(Boolean); }
  /* Both chairs' strain and the share of molecules in each at room temperature. */
  function chairPair(){
    var a = chairEnergy(chairAt(0)), b = chairEnergy(chairAt(1));
    var gap = Math.abs(a.total - b.total), Kq = Math.exp(gap / RT), pct = Kq / (1 + Kq) * 100;
    var sa = gap < 0.005 ? 50 : a.total <= b.total ? pct : 100 - pct;
    return { a:a, b:b, gap:gap, pct:pct, shareA:sa, shareB:100 - sa };
  }
  function pctText(v, gap){ return gap < 0.005 ? '50' : v < 0.01 ? 'under 0.01' : v > 99.99 ? 'over 99.99' : v.toFixed(gap > 2 ? 2 : 1); }
  /* Where the flip is: an end (a chair), or one of the shapes on the way. */
  /* The ring is still a chair (a flattening one) until one end is nearly level with the seat; from there to the
     same point on the far side it is on the high ground: a half chair, a boat, a half chair. Every frame has a
     name, and "high energy" is said only between the two half chairs. */
  function flipShape(p){
    if(p < 0.13) return 'a'; if(p > 0.87) return 'b';
    return p >= 0.37 && p <= 0.63 ? 'boat' : 'half';
  }
  var SHAPE = { half:'Half chair', boat:'Boat' };
  function listed(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function chairState(p){
    var sh = flipShape(p);
    if(sh !== 'a' && sh !== 'b') return SHAPE[sh];
    var subs = chairAt(sh === 'a' ? 0 : 1).atoms.filter(function(x){ return x.subKey !== 'H'; });
    if(!subs.length) return 'Chair';
    var ax = subs.filter(function(x){ return x.isAxial; }), eq = subs.filter(function(x){ return !x.isAxial; });
    function names(l){ return listed(l.map(function(x){ return SUBS[x.subKey].label; })); }
    if(subs.length > 2 || (ax.length && eq.length && names(ax).length + names(eq).length > 7)) return ax.length + ' axial, ' + eq.length + ' equatorial';
    if(subs.length > 2) return !ax.length ? 'All equatorial' : 'All axial';
    if(!ax.length) return subs.length === 1 ? names(eq) + ' equatorial' : 'Both equatorial';
    if(!eq.length) return subs.length === 1 ? names(ax) + ' axial' : 'Both axial';
    return names(ax) + ' axial, ' + names(eq) + ' equatorial';
  }
  function chainChair(p){
    var sh = flipShape(p);
    if(sh !== 'a' && sh !== 'b') return [{ t: SHAPE[sh], role:'ink' }, { t:'high energy', role:'energy' }];
    var pr = chairPair(), e = sh === 'a' ? pr.a : pr.b, share = sh === 'a' ? pr.shareA : pr.shareB;
    var out = [];
    if(!ringSubs().length) return [{ t:'No groups', role:'ink' }, { t:'both chairs the same', role:'calm' }, { t:'50% of molecules each', role:'ink' }];
    out.push({ t: chairState(p), role: e.axial.length ? 'ax' : 'eq' });
    out.push(e.total <= 0 ? { t:'no strain', role:'calm' }
      : { t: (e.axial.length ? 'strain ' : 'gauche: ') + parseFloat(e.total.toFixed(2)) + ' kcal/mol', role:'steric',
          say: (e.axial.length ? 'steric strain ' : 'the groups are gauche: ') + parseFloat(e.total.toFixed(2)) + ' kilocalories per mole' });
    out.push({ t: share < 0.01 ? 'almost no molecules' : share > 99.99 ? 'almost all molecules' : pctText(share, pr.gap) + '% of molecules', role:'ink' });
    return out;
  }

  /* The model with no page behind it, for scripts/test/tool-content.test.mjs. Each call leaves the tool's own
     molecule, angle and ring as they were. */
  window.OchemConformationModel = {
    torsionals: TORSIONALS, subs: SUBS, presets: PRESETS, custom: customTorsion,
    bond: function(t, deg){
      var keep = [tor, theta], out;
      tor = typeof t === 'string' ? TORSIONALS.filter(function(x){ return x.id === t; })[0] : t; theta = deg;
      out = { conf: conf(deg), chain: chainBond(), describe: describeTorsion(deg), up: energyAt(deg) - minE(),
        steric: bigPairs(deg).map(function(q){ return stericW(q.sep); }) };
      tor = keep[0]; theta = keep[1];
      return out;
    },
    chair: function(r, q){
      var keep = ring, out;
      ring = r;
      out = { geo: chairAt(q), energy: chairEnergy(chairAt(q)), pair: chairPair(), state: chairState(q), chain: chainChair(q) };
      ring = keep;
      return out;
    }
  };

  /* ====================================================================== */
  /* Drawing: a small ball and stick renderer both tabs share                */
  /* ====================================================================== */

  var CLS = { H:'h', Me:'r', Et:'r', iPr:'r', tBu:'r', Ph:'r', OH:'o', OMe:'o', F:'x', Cl:'x', Br:'b' };
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return (Math.round(v * 10) / 10).toString(); }

  /* o: { cx, cy, s (px per Å), spin (about the model's z), ry, rx, D (eye distance, Å) }. Returns p -> { x, y, z
     (toward the eye), k (px per Å at that depth) }. */
  function camera(o){
    var cs = Math.cos(o.spin || 0), ss = Math.sin(o.spin || 0), cyy = Math.cos(o.ry || 0), syy = Math.sin(o.ry || 0);
    var cxx = Math.cos(o.rx || 0), sxx = Math.sin(o.rx || 0), D = o.D || 18;
    return function(p){
      var x0 = p.x * cs - p.y * ss, y0 = p.x * ss + p.y * cs;
      var x1 = x0 * cyy + p.z * syy, z1 = -x0 * syy + p.z * cyy;
      var y2 = y0 * cxx - z1 * sxx, z2 = y0 * sxx + z1 * cxx;
      var k = D / (D - z2);
      return { x: o.cx + o.s * k * x1, y: o.cy - o.s * k * y2, z: z2, k: k * o.s };
    };
  }
  function paint(items){
    items.filter(function(it){ return it.text; }).forEach(function(it){ items.push(it.text); });
    items.sort(function(a, b){ return a.z - b.z; });
    return items.map(function(it){ return it.h; }).join('');
  }
  function ballItem(P, r, cls, label, o){
    var R = r * P.k, h = '<circle class="cf2-ball" cx="' + n1(P.x) + '" cy="' + n1(P.y) + '" r="' + n1(R) + '" fill="url(#cf2g-' + cls + ')"/>';
    if(R >= 9) h += '<ellipse class="cf2-shine" cx="' + n1(P.x - R * 0.36) + '" cy="' + n1(P.y - R * 0.44) + '" rx="' + n1(R * 0.26) + '" ry="' + n1(R * 0.16) + '" transform="rotate(-38 ' + n1(P.x - R * 0.36) + ' ' + n1(P.y - R * 0.44) + ')"/>';
    var out = { z: P.z, h: h };
    if(label && R >= 8.5){
      var fs = clamp(R * (label.length > 2 ? 0.66 : label.length > 1 ? 0.84 : 1.1), 11, 19);
      var t = '<text class="cf2-al is-' + cls + '" x="' + n1(P.x) + '" y="' + n1(P.y + fs * 0.35) + '" font-size="' + n1(fs) + '" text-anchor="middle">' + esc(label) + '</text>';
      // a group's letters are drawn after the atoms just in front of it, so "iPr" is never lost behind an H
      if(o && o.top) out.text = { z: P.z + 1.2, h: t }; else out.h += t;
    }
    return out;
  }
  /* A stick from ball to ball. ra, rb (px): the two balls' radii; the stick stops just inside each rim when it runs
     across the view, so it never covers a ball's letter. */
  function bondItem(A, B, w, style, ra, rb){
    var dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, a = Math.min((ra || 0) * 0.8, L * 0.45), b = Math.min((rb || 0) * 0.8, L * 0.45);
    var xy = 'x1="' + n1(A.x + dx / L * a) + '" y1="' + n1(A.y + dy / L * a) + '" x2="' + n1(B.x - dx / L * b) + '" y2="' + n1(B.y - dy / L * b) + '"';
    return { z: (A.z + B.z) / 2, h: '<line class="cf2-bo" ' + xy + ' stroke-width="' + n1(w + 2.6) + '"/><line class="cf2-bi" ' + xy + ' stroke-width="' + n1(w) + '"' + (style ? ' style="stroke:' + style + '"' : '') + '/>' };
  }
  function halo(P, R, w){
    return { z: P.z - 0.02, h: '<circle class="cf2-halo" cx="' + n1(P.x) + '" cy="' + n1(P.y) + '" r="' + n1(R) + '" opacity="' + w.toFixed(2) + '"/>' };
  }
  function polar(cx, cy, deg, r){ var a = deg * Math.PI / 180; return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }; }

  /* ---- The bond, seen almost down its axis. Returns the svg, where the handle goes and where the labels go. */
  function bondCam(cx, cy, s){ return camera({ cx: cx, cy: cy, s: s, rx: 0, ry: -0.95, D: 15 }); }
  /* The handle sits just outside the back carbon's first group, on the side away from the front carbon (C), so it
     never lands on the front atoms. */
  function knobFor(C, P, R, gap){
    var ux = P.x - C.x, uy = P.y - C.y, l = Math.hypot(ux, uy);
    if(l < R * 0.05){ ux = 0; uy = -1; l = 1; }
    return { x: P.x + ux / l * (R + gap), y: P.y + uy / l * (R + gap), ux: ux / l, uy: uy / l };
  }
  function rOf(k){ return k === 'H' ? 0.36 : clamp(SUBS[k].r * 1.12, 0.5, 0.68); }
  /* How far this molecule's model reaches from the middle of the bond per px of scale (l, r, u, d), through a full
     turn of the back carbon, and how far the point its handle hangs from reaches (kr, ku, kd; the handle itself
     is a fixed size in px, added by the layout). Each molecule is fitted on its own, so ethane is not drawn small
     to leave room for groups it does not have. */
  function bondReach(){
    var cam = bondCam(0, 0, 1), r = { l:0, r:0, u:0, d:0, kr:-9, ku:-9, kd:-9 }, c = cam(M3.v(0, 0, 0.77));
    function grow(P, R){ r.l = Math.max(r.l, -(P.x - R)); r.r = Math.max(r.r, P.x + R); r.u = Math.max(r.u, -(P.y - R)); r.d = Math.max(r.d, P.y + R); }
    function at(deg, key, zs){ var t = deg * Math.PI / 180, L = key === 'H' ? 1.09 : 1.5; return cam(M3.v(L * 0.943 * Math.cos(t), L * 0.943 * Math.sin(t), zs * (0.77 + L * 0.333))); }
    [c, cam(M3.v(0, 0, -0.77))].forEach(function(P){ grow(P, 0.46 * P.k); });
    tor.front.forEach(function(g, i){ var P = at(FA[i], gkey(g), 1); grow(P, rOf(gkey(g)) * P.k); });
    tor.back.forEach(function(g, j){
      for(var a = 0; a < 360; a += 10){
        var P = at(a, gkey(g), -1), R = rOf(gkey(g)) * P.k;
        grow(P, R);
        if(j === 0){ var kn = knobFor(c, P, R, 0); r.kr = Math.max(r.kr, kn.x); r.ku = Math.max(r.ku, -kn.y); r.kd = Math.max(r.kd, kn.y); }
      }
    });
    return r;
  }
  /* The largest scale at which the model and its handle (KNOB px beyond the point it hangs from) fit a box. */
  var KNOB = 38;
  function bondFit(rc, w, h){
    // the balls stand on the bottom of the box; under it the layout leaves room for the handle when it hangs low
    function ext(ms){ return { l: rc.l * ms, r: Math.max(rc.r * ms, rc.kr * ms + KNOB), u: Math.max(rc.u * ms, rc.ku * ms + KNOB), d: rc.d * ms, kd: Math.max(0, rc.kd * ms + KNOB - rc.d * ms) }; }
    var lo = 1, hi = 400, i, e;
    for(i = 0; i < 40; i++){ var mid = (lo + hi) / 2; e = ext(mid); if(e.l + e.r <= w && e.u + e.d <= h) lo = mid; else hi = mid; }
    e = ext(lo); e.ms = lo;
    return e;
  }
  function bondScene(th, G, plain){
    var cam = bondCam(G.mx, G.my, G.ms);
    var Cf = M3.v(0, 0, 0.77), Cb = M3.v(0, 0, -0.77), pCf = cam(Cf), pCb = cam(Cb), items = [], bw = clamp(G.ms * 0.105, 4.5, 9);
    function grp(list, C, zc, off){
      return list.map(function(g, i){
        var key = gkey(g), a = (FA[i] + off) * Math.PI / 180, d = M3.v(0.943 * Math.cos(a), 0.943 * Math.sin(a), zc);
        return { key:key, ang: FA[i] + off, d:d, P: cam(M3.add(C, M3.mul(d, key === 'H' ? 1.09 : 1.5))) };
      });
    }
    var F = grp(tor.front, Cf, 0.333, 0), B = grp(tor.back, Cb, -0.333, th);
    items.push(bondItem(pCb, pCf, bw * 1.2, null, 0.46 * pCb.k, 0.46 * pCf.k));
    items.push(ballItem(pCb, 0.46, 'c', ''));
    items.push(ballItem(pCf, 0.46, 'c', ''));
    B.forEach(function(g){ items.push(bondItem(pCb, g.P, bw, null, 0.46 * pCb.k, rOf(g.key) * g.P.k)); items.push(ballItem(g.P, rOf(g.key), CLS[g.key], SUBS[g.key].label)); });
    F.forEach(function(g){ items.push(bondItem(pCf, g.P, bw, null, 0.46 * pCf.k, rOf(g.key) * g.P.k)); items.push(ballItem(g.P, rOf(g.key), CLS[g.key], SUBS[g.key].label)); });
    if(!plain && G.standY){
      var bw2 = Math.max(26, G.ms * 0.62);
      items.push({ z: -90, h: '<ellipse class="cf2-shadow" cx="' + n1(pCf.x + bw2 * 0.5) + '" cy="' + n1(G.standY + 3) + '" rx="' + n1(G.ms * 2.2) + '" ry="' + n1(Math.max(6, G.ms * 0.12)) + '"/>' +
        '<ellipse class="cf2-base" cx="' + n1(pCf.x) + '" cy="' + n1(G.standY) + '" rx="' + n1(bw2) + '" ry="' + n1(bw2 * 0.2) + '"/>' +
        '<line class="cf2-post" x1="' + n1(pCf.x) + '" y1="' + n1(pCf.y) + '" x2="' + n1(pCf.x) + '" y2="' + n1(G.standY - 1) + '" stroke-width="' + n1(Math.max(4, G.ms * 0.07)) + '"/>' });
    }
    var out = { tors:null, crowd:null, hb:null };
    var kp = knobFor(pCf, B[0].P, rOf(B[0].key) * B[0].P.k, 17);
    function far(q){ return Math.hypot(q.x - kp.x, (q.y - kp.y) * 1.6); }      // how clear of the handle a label would be
    // the box round two groups' balls: a name for the pair goes just outside it
    function pairBox(f, b){
      var rf = rOf(f.key) * f.P.k, rb = rOf(b.key) * b.P.k, x0 = Math.min(f.P.x - rf, b.P.x - rb), x1 = Math.max(f.P.x + rf, b.P.x + rb), y0 = Math.min(f.P.y - rf, b.P.y - rb), y1 = Math.max(f.P.y + rf, b.P.y + rb);
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
    }
    if(!plain){
      var bestT = -1, bestS = 0;
      F.forEach(function(f){
        B.forEach(function(b, j){
          var sep = sepDeg(f.ang, b.ang), w = torsW(sep);
          if(w > 0.02){
            // eclipsed: the two bonds lie in one plane, drawn as that plane (behind the atoms)
            items.push({ z: -50, h: '<path class="cf2-tors" d="M' + n1(pCf.x) + ' ' + n1(pCf.y) + 'L' + n1(f.P.x) + ' ' + n1(f.P.y) + 'L' + n1(b.P.x) + ' ' + n1(b.P.y) + 'L' + n1(pCb.x) + ' ' + n1(pCb.y) + 'Z" opacity="' + (0.7 * w).toFixed(2) + '"/>' });
            // its label goes to a pair the handle is not on, the one nearest the bottom
            // on the plane when it is big enough to hold the words, else just under its two atoms; of the eclipsed
            // pairs, the one whose label is clearest of the handle
            var tl = { x: (pCf.x + f.P.x + b.P.x + pCb.x) / 4, y: (pCf.y + f.P.y + b.P.y + pCb.y) / 4 };
            var score = far(tl) + (j === 0 ? -40 : 0);
            if(w > 0.5 && score > bestT){ bestT = score; out.tors = { on: tl, pair: pairBox(f, b) }; }
          }
          if(f.key === 'H' || b.key === 'H') return;
          var sw = stericW(sep);
          if(sw > 0.02){
            items.push(halo(f.P, (rOf(f.key) + 0.62) * f.P.k, sw));
            items.push(halo(b.P, (rOf(b.key) + 0.62) * b.P.k, sw));
            if(sw > 0.7){
              var mx = (f.P.x + b.P.x) / 2, my = (f.P.y + b.P.y) / 2, L = 7 + 9 * sw, hh = '';
              [20, 80, 140, 200, 260, 320].forEach(function(a){ var p0 = polar(mx, my, a, L * 0.45), p1 = polar(mx, my, a, L); hh += '<line class="cf2-burst" x1="' + n1(p0.x) + '" y1="' + n1(p0.y) + '" x2="' + n1(p1.x) + '" y2="' + n1(p1.y) + '"/>'; });
              items.push({ z: 9, h: hh });
            }
            if(sw > bestS){
              bestS = sw;
              // above the two groups, or under them when the handle is up there
              out.crowd = { pair: pairBox(f, b) };
            }
          }
          if(tor.gauche === 'hbond'){
            var hw = Math.max(0, 1 - Math.abs(sep - 60) / 25);
            if(hw > 0.02){
              items.push({ z: 8, h: '<line class="cf2-hb" x1="' + n1(f.P.x) + '" y1="' + n1(f.P.y) + '" x2="' + n1(b.P.x) + '" y2="' + n1(b.P.y) + '" opacity="' + hw.toFixed(2) + '"/>' });
              out.hb = { pair: pairBox(f, b) };
            }
          }
        });
      });
    }
    out.knob = { x: kp.x, y: kp.y, rot: Math.atan2(kp.uy, kp.ux) * 180 / Math.PI + 90 };
    out.pivot = { x: pCb.x, y: pCb.y };
    out.balls = F.concat(B).filter(function(g){ return g.key !== 'H'; }).map(function(g){ var R = rOf(g.key) * g.P.k; return [g.P.x - R, g.P.y - R, R * 2, R * 2]; });
    out.svg = paint(items);
    return out;
  }

  /* ---- The Newman projection (the inset, and the drawing a question shows). Back bonds are drawn a few degrees
     off their front partners near an eclipsed angle, as textbooks do, so a back group is never hidden. */
  function newmanSvg(th){
    var R = 58, OUT = 30, out = '';
    function dirAt(deg, r){ var a = deg * Math.PI / 180; return { x: 150 + r * Math.cos(a), y: 150 - r * Math.sin(a) }; }
    var m120 = ((th % 120) + 120) % 120, toEclipse = m120 > 60 ? m120 - 120 : m120;
    var nudge = Math.abs(toEclipse) < 18 ? 16 * (1 - Math.abs(toEclipse) / 18) : 0;
    out += tor.back.map(function(g, i){
      var a = FA[i] + th + nudge, edge = dirAt(a, R), tip = dirAt(a, R + OUT), lab = dirAt(a, R + OUT + 16 + nudge);
      return '<line x1="' + n1(edge.x) + '" y1="' + n1(edge.y) + '" x2="' + n1(tip.x) + '" y2="' + n1(tip.y) + '" stroke="var(--nm-back)" stroke-width="3.4" stroke-linecap="round"/>' +
        '<text class="nm-lab nm-lab--back" x="' + n1(lab.x) + '" y="' + n1(lab.y + 5) + '" text-anchor="middle">' + esc(SUBS[gkey(g)].label) + '</text>';
    }).join('');
    out += '<circle cx="150" cy="150" r="' + R + '" fill="var(--nm-back-fill)" stroke="var(--nm-back)" stroke-width="3"/>';
    out += tor.front.map(function(g, i){
      var tip = dirAt(FA[i], R), lab = dirAt(FA[i], R + 17);
      return '<line x1="150" y1="150" x2="' + n1(tip.x) + '" y2="' + n1(tip.y) + '" stroke="var(--ink)" stroke-width="4.2" stroke-linecap="round"/>' +
        '<text class="nm-lab nm-lab--front" x="' + n1(lab.x) + '" y="' + n1(lab.y + 5) + '" text-anchor="middle">' + esc(SUBS[gkey(g)].label) + '</text>';
    }).join('');
    return out + '<circle cx="150" cy="150" r="7" fill="var(--ink)"/>';
  }

  /* ---- The energy hill: the curve as ground, with the ball that rides it. */
  function landSvg(G, V, o){
    var mx = V.maxE, x0 = G.gx0, x1 = G.gx1, yb = G.gbase, yt = G.gtop, h = '';
    function px(t){ return x0 + t / 360 * (x1 - x0); }
    function py(e){ return yb - e / mx * (yb - yt); }
    function path(E){ var d = ''; for(var t = 0; t <= 360; t += 3) d += (t ? 'L' : 'M') + n1(px(t)) + ' ' + n1(py(energyOf(E, t))); return d; }
    var step = mx > 9 ? 4 : 2, v;
    for(v = 0; v <= mx; v += step){
      h += '<line class="cf2-grid" x1="' + n1(x0) + '" y1="' + n1(py(v)) + '" x2="' + n1(x1) + '" y2="' + n1(py(v)) + '"/>' +
        '<text class="cf2-ax" x="' + n1(x0 - (o.ask ? 26 : 8)) + '" y="' + n1(py(v) + 4) + '" text-anchor="end">' + v + '</text>';
    }
    h += '<text class="cf2-axt" x="' + n1(x0 - 24) + '" y="' + n1(yt - 26) + '">Energy (kcal/mol)</text>';
    var curve = path(V.E), hill = curve + 'L' + n1(x1) + ' ' + n1(yb) + 'L' + n1(x0) + ' ' + n1(yb) + 'Z';
    h += '<path class="cf2-hill" d="' + hill + '"/>';
    h += '<clipPath id="cf2-hillclip"><path d="' + hill + '"/></clipPath><g clip-path="url(#cf2-hillclip)">';
    for(v = step / 2; v < mx; v += step / 2) h += '<line class="cf2-strata" x1="' + n1(x0) + '" y1="' + n1(py(v) + 3) + '" x2="' + n1(x1) + '" y2="' + n1(py(v) + 3) + '"/>';
    h += '</g>';
    if(V.ghost && !o.ask){
      h += '<path class="cf2-ghost" d="' + path(V.ghost.E) + '"/>';
    }
    h += '<path class="cf2-curve" d="' + curve + '"/>';
    [0, 60, 120, 180, 240, 300, 360].forEach(function(t){
      h += '<line class="cf2-tick" x1="' + n1(px(t)) + '" y1="' + n1(yb) + '" x2="' + n1(px(t)) + '" y2="' + n1(yb + 6) + '"/>' +
        '<text class="cf2-ax" x="' + n1(px(t)) + '" y="' + n1(yb + 21) + '" text-anchor="middle">' + t + '°</text>';
    });
    h += '<text class="cf2-axt" x="' + n1((x0 + x1) / 2) + '" y="' + n1(yb + 41) + '" text-anchor="middle">Dihedral angle</text>';
    if(!o.hideHere){
      var hx = px(V.theta), hy = py(energyOf(V.E, V.theta));
      h += '<line class="cf2-drop" x1="' + n1(hx) + '" y1="' + n1(hy) + '" x2="' + n1(hx) + '" y2="' + n1(yb) + '"/>' +
        '<ellipse class="cf2-mshadow" cx="' + n1(hx + 2) + '" cy="' + n1(hy + 4) + '" rx="12" ry="5"/>' +
        '<circle class="cf2-marker" cx="' + n1(hx) + '" cy="' + n1(hy - 10) + '" r="11" fill="url(#cf2g-e)"/>';
    }
    return { svg: h, px: px, py: py };
  }

  function axW(a){ return clamp((a.axness - 0.7) / 0.22, 0, 1); }
  /* ---- The chair. o: { bw, small (no letters), glow (0 to 1: the 1,3-diaxial strain), fog } */
  function chairItems(ch, cam, o){
    var items = [], PC = ch.C.map(cam), i;
    for(i = 0; i < 6; i++) items.push(bondItem(PC[i], PC[(i + 1) % 6], o.bw * 1.25, null, 0.31 * PC[i].k, 0.31 * PC[(i + 1) % 6].k));
    PC.forEach(function(P, k){ items.push(ballItem(P, 0.31, 'c', o.small ? '' : String(k + 1))); });
    ch.atoms.forEach(function(a){
      a.P = cam(a.pos); a.PC = PC[a.carbon];
      a.R = (a.subKey === 'H' ? 0.25 : Math.min(0.6, SUBS[a.subKey].r * 0.92)) * a.P.k;
      var t = Math.round(clamp((a.axness - 0.5) / 0.4, 0, 1) * 100);
      items.push(bondItem(a.PC, a.P, o.bw, 'color-mix(in srgb, var(--cf-ax) ' + t + '%, var(--cf-eq))', 0.31 * a.PC.k, a.R));
      items.push(ballItem(a.P, a.R / a.P.k, CLS[a.subKey], o.bare || (o.small && a.subKey === 'H') ? '' : SUBS[a.subKey].label, { top: a.subKey !== 'H' }));
    });
    if(o.glow){
      /* 1,3-diaxial strain: an axial group against the axial atoms two carbons on, on its side of the ring. The
         glow grows with how axial the bonds are, so it comes and goes with the flip instead of switching on. */
      var done = {};
      var put = function(i, at, R, w){ if(w > 0.02 && (!done[i] || done[i] < w)){ done[i] = w; items.push(halo(at.P, R, w)); } };
      ch.atoms.forEach(function(a, ai){
        if(a.subKey === 'H') return;
        var w0 = clamp(SUBS[a.subKey].a / 2.2, 0.5, 1), most = 0;
        ch.atoms.forEach(function(b, bi){
          if(b.face !== a.face || (b.carbon !== (a.carbon + 2) % 6 && b.carbon !== (a.carbon + 4) % 6)) return;
          var w = w0 * Math.min(axW(a), axW(b)); most = Math.max(most, w);
          put(bi, b, b.R + 0.42 * b.P.k, w);
        });
        put(ai, a, a.R + 0.6 * a.P.k, most);
        a.glow = most;
      });
      // two methyls on neighboring carbons, gauche to each other: a fainter glow on both
      chairEnergy(ch).gauche.forEach(function(pr){
        pr.forEach(function(a){ put(ch.atoms.indexOf(a), a, a.R + 0.5 * a.P.k, 0.42); });
      });
    }
    return items;
  }

  /* ====================================================================== */
  /* The page                                                                */
  /* ====================================================================== */

  var K = window.LevlKit2, studio = window.OchemStudio || null, Kit = window.OchemStudioKit;
  if(!K || !studio || !Kit || !Kit.kit2){
    // Without the studio and the kit (an old cached shell) there is no stage to draw on; the quiz still works.
    mountQuiz();
    if(root.insertAdjacentHTML) root.insertAdjacentHTML('beforeend', '<p class="tnote tnote--info">This tool needs a newer copy of the page. Reload to get it.</p>');
    return;
  }
  function mk(tag, cls, html){ var d = document.createElement(tag); if(cls) d.className = cls; if(html != null) d.innerHTML = html; return d; }
  function byId(id){ return document.getElementById(id); }
  function maxFor(E){ return Math.max(6.5, Math.max.apply(null, E) * 1.14); }

  var S = { tab:'newman', mode:'explore', part:null };
  var V = { theta: theta, E: tor.energies.slice(), maxE: maxFor(tor.energies), ghost:null, fade:1 };   // what is drawn
  var p = 1;                                   // the flip: 0 one chair, 1 the other
  /* The ring's camera. The default looks across the ring from a little above and well round to one side: from
     there no two ring carbons line up behind each other in either chair or in the boat between them. */
  var CAM0 = { spin:0.13, rx:-1.33 };
  var C = { spin:CAM0.spin, rx:CAM0.rx, fade:1, user:false };
  /* A group on the far side of the ring (C2 or C3) can hide behind the near carbons in the side view, so such a
     ring is seen from a little higher. Once the student has turned the view it is theirs and is left alone. */
  function viewFor(r){ return { spin: CAM0.spin, rx: (r[1] || r[2]) ? -1.0 : CAM0.rx }; }
  var custFront = ['Me','H','H'], custBack = ['Me','H','H'];
  var took = null, saved = null, G = null;
  ring = [['Me','up'], null, null, null, null, null];   // opens on methylcyclohexane, methyl equatorial

  /* ---- the two drills (Test yourself) */
  var nq = { on:false, mol:null, deg:0, pick:null, done:false, hint:false, right:0, total:0 };
  var chal = { on:false, done:false, right:0, total:0, ok:null };
  var CHAL_GROUPS = ['Me', 'Et', 'iPr', 'tBu', 'Ph', 'OH', 'Cl', 'Br'];

  /* ---------------------------------------------------- the stage */
  var stage = mk('div', 'cf2');
  var tabs = K.tabs({ label:'What to explore', big:true, value:S.tab, onChange: function(v){ setTab(v, true); },
    items: [{ value:'newman', label:'Turn a bond' }, { value:'chair', label:'Flip a chair' }] });
  stage.appendChild(tabs.el);
  var head = K.head({ purpose:'', how: { label:'Show me how', onClick: function(){ startTour(); } } });
  stage.appendChild(head.el);
  var sceneBox = mk('div', 'cf2-scene'); sceneBox.id = 'cf2Scene';
  function grad(id, a, b, c){ return '<radialGradient id="cf2g-' + id + '" cx="0.36" cy="0.32" r="0.75"><stop offset="0" class="' + a + '"/><stop offset="0.55" class="' + b + '"/><stop offset="1" class="' + c + '"/></radialGradient>'; }
  sceneBox.innerHTML = '<svg class="cf2-svg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs>' +
    ['c', 'h', 'r', 'o', 'x', 'b', 'e'].map(function(k){ return grad(k, 'cf2s-' + k + '0', 'cf2s-' + k + '1', 'cf2s-' + k + '2'); }).join('') +
    '<linearGradient id="cf2g-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cf2s-bg0"/><stop offset="1" class="cf2s-bg1"/></linearGradient>' +
    '<linearGradient id="cf2g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cf2s-bn0"/><stop offset="1" class="cf2s-bn1"/></linearGradient>' +
    '<linearGradient id="cf2g-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cf2s-hl0"/><stop offset="1" class="cf2s-hl1"/></linearGradient>' +
    '<radialGradient id="cf2g-halo"><stop offset="0.35" class="cf2s-ha0"/><stop offset="1" class="cf2s-ha1"/></radialGradient>' +
    '<radialGradient id="cf2g-sh"><stop offset="0" class="cf2s-sh0"/><stop offset="1" class="cf2s-sh1"/></radialGradient>' +
    '</defs><g class="cf2-static"></g><g class="cf2-dyn"></g></svg><div class="cf2-labs" aria-hidden="true"></div>';
  stage.appendChild(sceneBox);
  tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', sceneBox.id); });
  var svg = sceneBox.querySelector('svg'), gStatic = svg.querySelector('.cf2-static'), gDyn = svg.querySelector('.cf2-dyn');
  var labsEl = sceneBox.querySelector('.cf2-labs'), layer = K.layer(sceneBox);
  var lines = mk('div', 'cf2-lines');
  var cause = K.cause({ label:'Why' });
  lines.appendChild(cause.el);
  stage.appendChild(lines);
  var live = mk('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite');
  stage.appendChild(live);
  function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

  /* ---- motion: one tween at a time. settle (optional) finishes a change that is cut short, so nothing is left
     half made. With reduced motion the change is made at once and the picture cross fades in, briefly. */
  var tw = 0, twSettle = null;
  function stopTween(){ if(tw){ cancelAnimationFrame(tw); tw = 0; } if(twSettle){ var f = twSettle; twSettle = null; f(); } }
  function calm(){
    if(!K.reduced() || !gDyn.animate) return;
    try{ [gDyn, labsEl].forEach(function(n){ n.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); }); }catch(e){}
  }
  function tween(ms, fn, done, settle){
    stopTween();
    function end(){ twSettle = null; if(settle) settle(); if(done) done(); }
    if(K.reduced() || !window.requestAnimationFrame || ms <= 0){ fn(1); end(); if(ms > 0) calm(); return; }
    var t0 = null;
    twSettle = settle || null;
    function step(ts){
      if(t0 == null) t0 = ts;
      var f = Math.min(1, (ts - t0) / ms);
      fn(f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2);
      if(f < 1) tw = requestAnimationFrame(step); else { tw = 0; end(); }
    }
    tw = requestAnimationFrame(step);
  }
  function snapView(){ stopTween(); if(!C.user){ var v = viewFor(ring); C.spin = v.spin; C.rx = v.rx; } V.theta = theta; V.E = tor.energies.slice(); V.maxE = maxFor(tor.energies); V.fade = 1; C.fade = 1; }

  /* ---------------------------------------------------- tab 1 controls: the bond */
  /* The handle: a knob beside the back carbon's first group, and the whole model as its grab area. Its value is
     a real range input (arrow keys 5°, Page Up / Down to the next landmark, Home 0°, End 180°). */
  var turnHit = mk('div', 'cf2-turnhit');
  layer.el.appendChild(turnHit);
  var turn = mk('div', 'tk2-drag cf2-turn', '<span class="tk2-knob" aria-hidden="true"><span class="tk2-dot">' + K.icon('arrows', 'tk2-ar') + '</span></span>' +
    '<input class="tk2-in" type="range" min="0" max="360" step="1" value="' + theta + '" aria-label="Turn the back carbon: dihedral angle">');
  layer.el.appendChild(turn);
  var turnIn = turn.querySelector('input'), turnKnob = turn.querySelector('.tk2-knob');
  turnIn.addEventListener('focus', function(){ turn.classList.add('is-focus'); });
  turnIn.addEventListener('blur', function(){ turn.classList.remove('is-focus'); });
  function userChange(){ stopPlay(); stopTween(); took = null; hideCue(true); }
  function setTheta(v, quiet){
    theta = mod360(v); if(v >= 360 && Math.abs(v - 360) < 1e-6) theta = 360;
    V.theta = theta; turnIn.value = Math.round(theta);
    draw(); words();
    if(!quiet) tourDid('turn');
  }
  function goTheta(t){
    userChange();
    var from = V.theta, d;
    d = mod360(t - from); if(d > 180) d -= 360;
    // arriving at 0° from above goes on round through 360°; the ball then wraps to the 0° end of the hill
    if(t === 0 && from > 180) d = 360 - from;
    tween(Math.max(180, Math.abs(d) * 4.2), function(e){ setTheta(from + d * e, true); }, function(){ if(t === 0) setTheta(0, true); say(cause.text()); syncState(); refNow(); });
  }
  turnIn.addEventListener('keydown', function(e){
    var t = Math.round(mod360(theta)), nx = null;
    if(e.key === 'ArrowRight' || e.key === 'ArrowUp') nx = Math.floor(t / 5) * 5 + 5;
    else if(e.key === 'ArrowLeft' || e.key === 'ArrowDown') nx = Math.ceil(t / 5) * 5 - 5;
    else if(e.key === 'PageUp') nx = Math.floor(t / 60) * 60 + 60;
    else if(e.key === 'PageDown') nx = Math.ceil(t / 60) * 60 - 60;
    else if(e.key === 'Home') nx = 0;
    else if(e.key === 'End') nx = 180;
    if(nx == null) return;
    e.preventDefault(); userChange(); setTheta(nx); say(cause.text()); syncState(); refNow();
  });
  turnIn.addEventListener('input', function(){ userChange(); setTheta(+turnIn.value); });
  (function(){
    var pid = null, last = 0;
    function ang(e){ var r = sceneBox.getBoundingClientRect(); return Math.atan2(-(e.clientY - r.top - G.py), e.clientX - r.left - G.px) * 180 / Math.PI; }
    function down(e){
      if(pid != null || (e.pointerType === 'mouse' && e.button !== 0) || !G) return;
      pid = e.pointerId; try{ e.currentTarget.setPointerCapture(pid); }catch(x){}
      e.preventDefault(); userChange(); last = ang(e); turn.classList.add('is-drag'); turnHit.classList.add('is-drag');
      try{ turnIn.focus({ preventScroll:true }); }catch(x){}
    }
    function move(e){
      if(e.pointerId !== pid) return;
      var a = ang(e), d = a - last; if(d > 180) d -= 360; if(d < -180) d += 360; last = a;
      // near the middle of the model a small move is a big angle: ignore moves inside the front carbon
      var r = sceneBox.getBoundingClientRect(), dist = Math.hypot(e.clientX - r.left - G.px, e.clientY - r.top - G.py);
      if(dist < G.ms * 0.3) return;
      setTheta(theta + d);
    }
    function up(e){ if(e.pointerId !== pid) return; pid = null; turn.classList.remove('is-drag'); turnHit.classList.remove('is-drag'); say(cause.text()); syncState(); refNow(); }
    [turnHit, turnKnob].forEach(function(t){ t.addEventListener('pointerdown', down); t.addEventListener('pointermove', move); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up); });
  })();

  // The six landmarks on the hill: marks that are buttons (360° is 0° again and has a tick, not a button).
  var nodes = [0, 60, 120, 180, 240, 300].map(function(t){
    var b = mk('button', 'cf2-node'); b.type = 'button'; b.setAttribute('data-t', t);
    b.addEventListener('click', function(){ if(nq.on){ nqPick(t % 360); return; } goTheta(t); tourDid('hill'); });
    layer.el.appendChild(b);
    return b;
  });
  // Drag anywhere on the hill: the same value as the handle (pointer only; the handle has the keys).
  var scrub = K.scrub(sceneBox, { label:'Energy hill', min:0, max:360, step:1, value:theta, rect:[0, 0, 1, 1], knob:false,
    onStart: function(){ userChange(); }, onInput: function(v){ userChange(); setTheta(v); tourDid('hill'); },
    onEnd: function(){ say(cause.text()); syncState(); refNow(); } });
  scrub.el.classList.add('cf2-scrub');

  var molPick = mk('label', 'cf2-pick', '<span>Molecule</span><select aria-label="Molecule"></select>');
  layer.el.appendChild(molPick);
  var molSel = molPick.querySelector('select');
  molSel.innerHTML = '<optgroup label="Start here">' + TORSIONALS.slice(0, 3).map(opt).join('') + '</optgroup><optgroup label="Bigger groups">' + [TORSIONALS[3], TORSIONALS[4], TORSIONALS[7]].map(opt).join('') +
    '</optgroup><optgroup label="Gauche wins">' + [TORSIONALS[5], TORSIONALS[6]].map(opt).join('') + '</optgroup><option value="custom" hidden>Your own</option>';
  function opt(t){ return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>'; }
  molSel.addEventListener('change', function(){
    var t = TORSIONALS.filter(function(x){ return x.id === molSel.value; })[0];
    if(t) setMol(t, true);
    tourDid('mol');
  });
  /* A new molecule: the hill morphs from the old curve to the new one and the old one stays as a faint line.
     The angle does not move (one control never moves another). */
  function setMol(t, user){
    if(t === tor && !t.custom) return;
    userChange();
    var from = V.E.slice(), fromMax = V.maxE, to = t.energies, toMax = maxFor(to), prev = tor;
    if(user && prev.energies.join() !== to.join()){
      var at = 0, best = -1;
      [60, 120, 180, 240, 300].forEach(function(a){ var d = Math.abs(energyOf(prev.energies, a) - energyOf(to, a)); if(d > best){ best = d; at = a; } });
      V.ghost = { E: prev.energies.slice(), name: prev.name.toLowerCase(), at: at };
    }
    tor = t;
    molSel.querySelector('[value="custom"]').hidden = !t.custom;
    molSel.value = t.custom ? 'custom' : t.id;
    // each molecule is fitted to the stage on its own: the model glides from the old size and place to the new
    var g0 = G && S.tab === 'newman' ? { ms: G.ms, mx: G.mx, my: G.my } : null, g1 = null;
    if(g0){ V.fade = 0.25; layoutNow(); g1 = { ms: G.ms, mx: G.mx, my: G.my }; }
    // the words wait for the picture: the line under it dims while the hill morphs, then says the new molecule
    cause.el.classList.add('is-wait');
    tween(user ? 420 : 0, function(e){
      V.E = from.map(function(a, i){ return a + (to[i] - a) * e; });
      V.maxE = fromMax + (toMax - fromMax) * e; V.fade = 0.25 + 0.75 * e;
      if(g1){ G.ms = g0.ms + (g1.ms - g0.ms) * e; G.mx = g0.mx + (g1.mx - g0.mx) * e; G.my = g0.my + (g1.my - g0.my) * e; }
      draw();
    }, function(){ if(user) say(t.name + '. ' + cause.text()); },
    function(){ V.E = to.slice(); V.maxE = toMax; V.fade = 1; if(g1){ G.ms = g1.ms; G.mx = g1.mx; G.my = g1.my; } cause.el.classList.remove('is-wait'); draw(); words(); });
    syncState(); refNow();
  }

  /* ---------------------------------------------------- tab 2 controls: the ring */
  var camHit = mk('div', 'cf2-camhit'); camHit.tabIndex = 0; camHit.setAttribute('role', 'button');
  layer.el.appendChild(camHit);
  var flip = K.drag(layer, { key:'ochem-conf-flip', label:'Ring flip', min:0, max:100, step:1, value: p * 100, track:[0, 0, 1, 0], chip:false,
    valuetext: function(v){ return flipText(v / 100); },
    onInput: function(v){ userChange(); p = v / 100; draw(); words(); tourDid('flip'); },
    onEnd: function(){ say(cause.text()); refNow(); panels(); } });
  flip.el.classList.add('cf2-flip');
  function flipText(q){ var sh = flipShape(q); return (sh === 'a' || sh === 'b' ? 'Chair. ' : '') + chairState(q) + '.'; }
  function flipTo(end, after){
    userChange();
    var from = p;
    tween(Math.abs(end - from) * 1100, function(e){ p = from + (end - from) * e; flip.value(Math.round(p * 100)); draw(); words(); },
      function(){ p = end; flip.value(end * 100); draw(); words(); say('Ring flipped. ' + cause.text()); refNow(); panels(); if(after) after(); });
    tourDid('flip');
  }
  var thumbs = [0, 1].map(function(end){
    var b = mk('button', 'cf2-thumbhit'); b.type = 'button';
    b.addEventListener('click', function(){ if(Math.abs(p - end) > 0.02) flipTo(end); });
    layer.el.appendChild(b);
    return b;
  });
  (function(){
    var pid = null, lx = 0, ly = 0, moved = 0;
    camHit.addEventListener('pointerdown', function(e){
      if(pid != null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      pid = e.pointerId; try{ camHit.setPointerCapture(pid); }catch(x){}
      lx = e.clientX; ly = e.clientY; moved = 0; hideCue(true); camHit.classList.add('is-drag');
    });
    camHit.addEventListener('pointermove', function(e){
      if(e.pointerId !== pid) return;
      var dx = e.clientX - lx, dy = e.clientY - ly; moved += Math.abs(dx) + Math.abs(dy); lx = e.clientX; ly = e.clientY;
      if(moved < 6) return;
      C.spin += dx * 0.011; C.rx = clamp(C.rx + dy * 0.011, -1.5, -0.25); C.user = true;
      draw();
    });
    function up(e){
      if(e.pointerId !== pid) return; pid = null; camHit.classList.remove('is-drag');
      // a tap on the model, as opposed to a drag, flips the ring
      if(e.type === 'pointerup' && moved < 6) flipTo(p < 0.5 ? 1 : 0);
    }
    camHit.addEventListener('pointerup', up); camHit.addEventListener('pointercancel', up);
    camHit.addEventListener('keydown', function(e){
      var st = 0.14;
      if(e.key === 'ArrowLeft') C.spin -= st; else if(e.key === 'ArrowRight') C.spin += st;
      else if(e.key === 'ArrowUp') C.rx = clamp(C.rx - st, -1.5, -0.25); else if(e.key === 'ArrowDown') C.rx = clamp(C.rx + st, -1.5, -0.25);
      else if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); hideCue(true); flipTo(p < 0.5 ? 1 : 0); return; }
      else return;
      C.user = true; e.preventDefault(); draw();
    });
  })();
  var ringPick = mk('label', 'cf2-pick', '<span>Ring</span><select aria-label="Ring"></select>');
  layer.el.appendChild(ringPick);
  var ringSel = ringPick.querySelector('select');
  ringSel.innerHTML = '<option value="none">Cyclohexane</option><optgroup label="One group">' + PRESETS.slice(0, 2).map(popt).join('') + '</optgroup><optgroup label="Two methyl groups">' +
    PRESETS.slice(2).map(popt).join('') + '</optgroup><option value="custom" hidden>Your own</option>';
  function popt(x){ return '<option value="' + esc(x.id) + '">' + esc(x.label) + '</option>'; }
  function ringKey(r){ return r.map(function(e){ return e ? e[0] + ':' + e[1] : ''; }).join(','); }
  function presetOf(r){
    if(!ringSubs(r).length) return 'none';
    var k = ringKey(r), hit = PRESETS.filter(function(x){ return ringKey(x.subs) === k; })[0];
    return hit ? hit.id : 'custom';
  }
  ringSel.addEventListener('change', function(){
    var x = PRESETS.filter(function(q){ return q.id === ringSel.value; })[0];
    setRing(x ? x.subs.map(function(s){ return s ? [s[0], s[1]] : null; }) : [null, null, null, null, null, null], true);
    tourDid('ring');
  });
  // A new ring fades in; the flip control stays where it is.
  function setRing(r, user){
    userChange();
    ring = r;
    var id = presetOf(r);
    ringSel.querySelector('[value="custom"]').hidden = id !== 'custom';
    ringSel.value = id;
    var v0 = { spin: C.spin, rx: C.rx }, v1 = C.user ? v0 : viewFor(r);
    tween(user ? 320 : 0, function(e){ C.fade = 0.25 + 0.75 * e; C.spin = v0.spin + (v1.spin - v0.spin) * e; C.rx = v0.rx + (v1.rx - v0.rx) * e; draw(); }, null,
      function(){ C.fade = 1; C.spin = v1.spin; C.rx = v1.rx; draw(); });
    words(); syncState(); refNow(); ringBuild();
    if(user) say(ringSel.options[ringSel.selectedIndex].text + '. ' + cause.text());
  }

  /* ---------------------------------------------------- Watch it happen (small, secondary), one per tab */
  var playU = 0, playFrom = 0;
  var playTurn = K.player({ min:0, max:360, speed:48, hold:0.3, labels: { play:'Watch a full turn', pause:'Pause', again:'Watch again', next:'Next shape', rest:'To the end' },
    stops: function(){ return [60, 120, 180, 240, 300]; },
    get: function(){ return playU; },
    set: function(v){ playU = v; setTheta(v >= 360 ? 360 : v, true); },
    before: function(){ hideCue(true); stopTween(); took = null; if(!K.reduced() || playU >= 360) playU = 0; tourDid('watch'); },
    onEnd: function(){ took = takeBond(); words(); say(took); syncState(); refNow(); } });
  var playFlip = K.player({ min:0, max:1, speed:1 / 2.4, labels: { play:'Watch the flip', pause:'Pause', again:'Watch again', next:'Next shape', rest:'To the end' },
    stops: function(){ return [0.25, 0.5, 0.75]; },
    get: function(){ return playU; },
    set: function(v){ playU = v; p = playFrom ? 1 - v : v; flip.value(Math.round(p * 100)); draw(); words(); },
    before: function(){ hideCue(true); stopTween(); took = null; if(!K.reduced() || playU >= 1 || playU <= 0){ playFrom = p < 0.5 ? 0 : 1; playU = 0; } tourDid('watch'); },
    onEnd: function(){ p = playFrom ? 0 : 1; took = 'A ring flip turns every axial group equatorial and every equatorial group axial. Up stays up and down stays down.'; words(); say(took); refNow(); } });
  [playTurn, playFlip].forEach(function(x){ x.el.classList.add('is-sm'); lines.appendChild(x.el); });
  function stopPlay(){ if(playTurn.playing()) playTurn.stop(); if(playFlip.playing()) playFlip.stop(); playU = 0; playTurn.paint(); playFlip.paint(); }
  function takeBond(){
    var low = [60, 180, 300].filter(function(t){ return conf(t).isMin; }).map(function(t){ return conf(t); })[0];
    return 'Staggered shapes sit in the valleys and eclipsed shapes on the peaks.' +
      (low && low.key === 'anti' ? ' The lowest valley is anti: the ' + low.grps + ' are as far apart as they can get.'
        : low && low.key === 'gauche' ? ' Here the lowest valley is gauche, not anti.' : '');
  }

  /* ---------------------------------------------------- the one cue, and "Show me how" */
  /* The one first visit cue. It points at the handle from the first side where its whole bubble is inside the
     picture and covers no name, number or the Newman inset (measured when it shows). */
  function cueAt(tab){ return tab === 'newman' ? (G && G.knob ? [G.knob.x, G.knob.y] : [0, 0]) : (G && G.tx0 != null ? [G.tx0 + (G.tx1 - G.tx0) * p, G.trackY] : [0, 0]); }
  function mkCue(tab, side){ return K.cue(layer, { key: tab === 'newman' ? 'ochem-conf-turn' : 'ochem-conf-flip', text: tab === 'newman' ? 'Turn the bond' : 'Slide to flip the ring', side: side, at: function(){ return cueAt(tab); } }); }
  var cueTurn = mkCue('newman', 'right'), cueFlip = mkCue('chair', 'left');
  function cueClear(){
    var b = layer.el.querySelector('.tk2-cue'); if(!b) return true;
    var r = b.getBoundingClientRect(), sc = sceneBox.getBoundingClientRect();
    if(r.left < sc.left + 2 || r.right > sc.right - 2 || r.top < sc.top + 2 || r.bottom > sc.bottom - 2) return false;
    return [].every.call(sceneBox.querySelectorAll('.cf2-lab, .cf2-inset-bg, .cf2-pick:not([hidden]), .cf2-thumbhit:not([hidden])'), function(e){
      var q = e.getBoundingClientRect();
      return !q.width || r.right <= q.left || q.right <= r.left || r.bottom <= q.top || q.bottom <= r.top;
    });
  }
  function showBest(tab, sides){
    var c = null;
    for(var i = 0; i < sides.length; i++){
      c = mkCue(tab, sides[i]);
      if(!c.show()) return c;                 // already seen on this device
      if(cueClear() || i === sides.length - 1) return c;
      c.hide(false);
    }
    return c;
  }
  function hideCue(used){ if(cueTurn.active()) cueTurn.hide(used && S.tab === 'newman'); if(cueFlip.active()) cueFlip.hide(used && S.tab === 'chair'); }
  function showCue(){
    hideCue(false);
    if(S.mode !== 'explore' || tourActive()) return;
    if(!G) return;
    if(S.tab === 'newman') cueTurn = showBest('newman', ['right', 'left', 'above', 'below']);
    else cueFlip = showBest('chair', ['left', 'above', 'right', 'below']);
  }
  stage.addEventListener('pointerdown', function(){ hideCue(true); }, true);
  stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End|Enter| )/.test(e.key)) hideCue(true); }, true);
  var tourTurn = K.tour({ key:'ochem-conf-turn', label:'Show me how', steps: [
    { id:'turn', text:'Grab the model and turn the back carbon.', target: function(){ return turnKnob; } },
    { id:'hill', text:'The ball rides the energy hill. Valleys are the stable shapes. Tap a dot to jump there.', target: function(){ return nodes[3]; } },
    { id:'mol', text:'Pick another molecule and compare the hills.', target: function(){ return molPick; } }],
    onClose: function(had){ if(had) try{ head.how.focus({ preventScroll:true }); }catch(e){} showCue(); } });
  var tourFlip = K.tour({ key:'ochem-conf-flip', label:'Show me how', steps: [
    { id:'flip', text:'Slide to flip the ring, or tap the model. Every bond swaps.', target: function(){ return flip.el.querySelector('.tk2-knob'); } },
    { id:'read', text:'A red glow means an axial group is bumping its neighbors.', target: function(){ return camHit; } },
    { id:'ring', text:'Pick another ring. Build your own from the ? sheet.', target: function(){ return ringPick; } }],
    onClose: function(had){ if(had) try{ head.how.focus({ preventScroll:true }); }catch(e){} showCue(); } });
  function tourActive(){ return tourTurn.active() || tourFlip.active(); }
  function tourDid(id){ if(tourTurn.active()) tourTurn.did(id); if(tourFlip.active()) tourFlip.did(id); }
  function startTour(){
    if(S.mode !== 'explore') return;
    hideCue(false); tourTurn.stop(); tourFlip.stop();
    (S.tab === 'newman' ? tourTurn : tourFlip).start(true);
  }

  /* ---------------------------------------------------- layout and drawing */
  function layoutNow(){
    var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
    if(!W || !H) return;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var wide = W >= 640, st = '';
    G = { W:W, H:H, wide:wide };
    st += '<rect class="cf2-bg" x="0" y="0" width="' + W + '" height="' + H + '"/>';
    if(S.tab === 'newman'){
      /* From 1000 px the model and the hill stand side by side; below that the hill goes under the model (a
         tablet as well as a phone), so the model always has the stage's width to itself. */
      var side = W >= 1000, ph = W < 640, bench = side ? 58 : 52, fy = H - bench, zw = side ? W * 0.5 : W, zh = side ? fy : ph ? 310 : Math.round(H * 0.61);
      G.fy = fy; G.zh = zh;
      // the Newman projection, big enough to read, in the lower left; the model fills the rest and stands on the bench
      G.ins = side ? clamp(zw * 0.3, 150, 190) : ph ? 120 : 170; G.ix = ph ? 6 : 14; G.iy = side ? fy - G.ins - 30 : zh - 30 - G.ins;
      var rc = bondReach(), bx0 = G.ix + G.ins + (ph ? 4 : 14), bx1 = zw - (ph ? 8 : 20), by0 = ph ? 56 : 58, by1 = side ? fy - 22 : zh - 34;
      var bf = bondFit(rc, bx1 - bx0, by1 - by0);
      G.ms = bf.ms;
      G.mx = (bx0 + bx1) / 2 + (bf.l - bf.r) / 2; G.my = by1 - bf.d;
      G.hit = [G.mx - bf.l, G.my - bf.u, bf.l + bf.r, bf.u + bf.d + bf.kd];
      G.nk = (Math.min(zw, zh - 40) - 24) / 290;
      G.gx0 = side ? zw + 56 : ph ? 44 : 64; G.gx1 = W - (side ? 26 : 16); G.gtop = side ? 74 : zh + 46; G.gbase = fy;
      // the shape's name: on the bench under the model, or (stacked) in the picker's row, where the cue never covers it
      G.stateY = side ? fy + 30 : 30; G.stateX = side ? (bx0 + bx1) / 2 : W - (ph ? 86 : 110);
      st += '<rect class="cf2-bench" x="0" y="' + fy + '" width="' + W + '" height="' + bench + '"/><line class="cf2-benchedge" x1="0" y1="' + fy + '" x2="' + W + '" y2="' + fy + '"/>';
      // the model is held on a stand (a base on the bench and a post to the front carbon), so it is never left
      // hanging over its shadow when the back groups turn up out of the way
      G.standY = side ? fy + 6 : by1 + 14;
      if(nq.on){ G.mx = zw / 2; G.my = side ? zh / 2 : zh / 2 + 10; }
    } else {
      /* On a wide stage the two chairs stand big at the ends of the control with the ring between them. Below
         1100 px there is no room for three, so the two are small on the bench (as on a phone) and the ring keeps
         the whole stage. The ring's own size is fitted in fitRing() from everything it draws. */
      var big = W >= 1100, bn = big ? 96 : 198, f2 = H - bn;
      G.big = big; G.fy = f2;
      G.ts = big ? clamp(W * 0.034, 20, 46) : clamp(W * 0.03, 14.5, 18);
      G.tax = big ? Math.max(G.ts * 4.3 + 8, W * 0.125) : G.ts * 4.6 + 6; G.tbx = W - G.tax; G.ty = big ? f2 - G.ts * 2.1 : f2 + 44;
      G.tx0 = big ? G.tax : 44; G.tx1 = W - G.tx0; G.trackY = big ? f2 + 64 : f2 + 138;
      G.shareY = big ? f2 + 24 : f2 + 98;
      // with the small chairs on the bench the state has a row of its own under the control
      G.stateY = big ? f2 + 24 : f2 + 176;
      G.reg = big ? [G.tax + G.ts * 3.3 + 74, 22, W - (G.tax + G.ts * 3.3 + 74), f2 - 3] : [12, wide ? 24 : 60, W - 12, f2 - 3];
      G.fit = null;
      st += '<rect class="cf2-bench" x="0" y="' + f2 + '" width="' + W + '" height="' + bn + '"/><line class="cf2-benchedge" x1="0" y1="' + f2 + '" x2="' + W + '" y2="' + f2 + '"/>';
    }
    gStatic.innerHTML = st;
    draw();
    if(cueTurn.active()) cueTurn.place(); if(cueFlip.active()) cueFlip.place();
    if(tourTurn.active()) tourTurn.place(); if(tourFlip.active()) tourFlip.place();
  }
  // a name on the picture, kept inside it (its width is estimated from its length)
  function labSize(cls, text){
    var st8 = cls.indexOf('is-state') >= 0, sh = cls.indexOf('is-share') >= 0, small = G.W < 640;
    return { w: text.length * (st8 ? (small ? 8.4 : 9) : sh ? 10.5 : small ? 7 : 7.3) + (st8 ? 30 : sh ? 4 : 20), h: st8 ? 30 : 23 };
  }
  function lab(cls, x, y, text, html){
    var half = labSize(cls, text).w / 2;
    x = clamp(x, half + 4, G.W - half - 4); y = clamp(y, 14, G.H - 12);
    return '<span class="cf2-lab ' + cls + '" style="left:' + n1(x) + 'px;top:' + n1(y) + 'px">' + (html || esc(text)) + '</span>';
  }
  /* Names are placed one after another. Each takes the first of its candidate spots that is inside the picture
     and clear of every name and box already there (the pickers, the inset, the end chairs, the handle, the big
     groups' balls); a name with no clear spot is left out rather than laid over something. */
  function placer(boxes){
    var taken = boxes.slice();
    function free(r){
      if(r[0] < 4 || r[1] < 4 || r[0] + r[2] > G.W - 4 || r[1] + r[3] > G.H - 4) return false;
      return taken.every(function(t){ return r[0] + r[2] <= t[0] || t[0] + t[2] <= r[0] || r[1] + r[3] <= t[1] || t[1] + t[3] <= r[1]; });
    }
    return {
      block: function(r){ taken.push(r); },
      put: function(cls, text, cands, must, html){
        var z = labSize(cls, text), i, c, r;
        for(i = 0; i < cands.length; i++){
          c = cands[i]; r = [c.x - z.w / 2 - 2, c.y - z.h / 2 - 2, z.w + 4, z.h + 4];
          if(free(r)){ taken.push(r); return lab(cls, c.x, c.y, text, html); }
        }
        if(!must) return '';
        c = cands[0]; taken.push([c.x - z.w / 2 - 2, c.y - z.h / 2 - 2, z.w + 4, z.h + 4]);
        return lab(cls, c.x, c.y, text, html);
      }
    };
  }
  // candidate spots round a ball (or a pair): out along (ux, uy) first, then above, below, right, left
  function around(cx, cy, R, ux, uy, cls, text){
    var z = labSize(cls, text), out = [], g = 7;
    if(ux || uy) out.push({ x: cx + ux * (R + g + z.w / 2 * Math.abs(ux) + z.h / 2 * Math.abs(uy)), y: cy + uy * (R + g + z.w / 2 * Math.abs(ux) + z.h / 2 * Math.abs(uy)) });
    out.push({ x: cx, y: cy - R - g - z.h / 2 }, { x: cx, y: cy + R + g + z.h / 2 }, { x: cx + R + g + z.w / 2, y: cy }, { x: cx - R - g - z.w / 2, y: cy },
      { x: cx + R * 0.7 + z.w / 2, y: cy - R - g - z.h / 2 }, { x: cx - R * 0.7 - z.w / 2, y: cy - R - g - z.h / 2 }, { x: cx + R * 0.7 + z.w / 2, y: cy + R + g + z.h / 2 }, { x: cx - R * 0.7 - z.w / 2, y: cy + R + g + z.h / 2 });
    return out;
  }
  function pickerBox(el){ return [0, 0, el.offsetWidth + (G.W < 640 ? 14 : 20), 56]; }
  function box(el, x, y, w, h){ el.style.left = n1(x) + 'px'; el.style.top = n1(y) + 'px'; el.style.width = n1(w) + 'px'; el.style.height = n1(h) + 'px'; }
  function draw(){ if(!G) return; if(S.tab === 'newman') drawBond(); else drawChair(); }

  function drawBond(){
    if(G.mx == null) return;
    var ask = nq.on && !nq.done, c = conf(V.theta), labs = '';
    var land = landSvg(G, V, { hideHere: ask, ask: nq.on }), h = land.svg;
    if(nq.on){
      h += '<g transform="translate(' + n1(G.mx - 150 * G.nk) + ' ' + n1(G.my - 150 * G.nk) + ') scale(' + G.nk.toFixed(3) + ')">' + newmanSvg(V.theta) + '</g>';
      G.knob = null;
    } else {
      var sc = bondScene(V.theta, G, false), ik = G.ins / 300;
      h += '<g class="cf2-main"' + (V.fade < 1 ? ' opacity="' + V.fade.toFixed(2) + '"' : '') + '>' + sc.svg + '</g>';
      h += '<g class="cf2-inset" transform="translate(' + n1(G.ix) + ' ' + n1(G.iy) + ') scale(' + ik.toFixed(3) + ')"><rect class="cf2-inset-bg" x="4" y="4" width="292" height="292" rx="40"/>' + newmanSvg(V.theta) + '</g>';
      G.knob = sc.knob; G.px = sc.pivot.x; G.py = sc.pivot.y;
      turnKnob.style.left = n1(sc.knob.x) + 'px'; turnKnob.style.top = n1(sc.knob.y) + 'px';
      turn.querySelector('.tk2-ar').style.transform = 'rotate(' + n1(sc.knob.rot) + 'deg)';
      box(turnHit, G.hit[0], G.hit[1], G.hit[2], G.hit[3]);
      var pl = placer([pickerBox(molPick), [G.ix, G.iy, G.ins, G.ins], [sc.knob.x - 20, sc.knob.y - 20, 40, 40]]);
      labs += pl.put('is-cap', 'Newman projection', [{ x: G.ix + G.ins / 2, y: G.iy + G.ins + 12 }], true);
      if(V.fade >= 1) labs += pl.put('is-state' + (c.at ? '' : ' is-dim'), SHORT[c.key] + ' 000°', [{ x: G.stateX, y: G.stateY }], true,
        esc(SHORT[c.key]) + ' <i>' + (V.theta >= 359.5 ? 360 : Math.round(mod360(V.theta))) + '°</i>');
      if(!ask && V.fade >= 1) labs += etag(pl);
      if(c.at && V.fade >= 1){
        sc.balls.forEach(function(r){ pl.block(r); });
        // on the plane it names when that is big enough, else just outside the pair: above, below, either side, the corners
        var spots = function(q, cls, text, up){
          var z = labSize(cls, text), x = q.pair.x, y = q.pair.y, hw = q.pair.w / 2, hh = q.pair.h / 2, t = y - hh - 16, u = y + hh + 16;
          return (q.on && G.ms > 68 ? [q.on] : []).concat([{ x: x, y: up ? t : u }, { x: x, y: up ? u : t }, { x: x + hw + z.w / 2 + 8, y: y }, { x: x - hw - z.w / 2 - 8, y: y },
            { x: x + hw, y: t }, { x: x - hw, y: t }, { x: x + hw, y: u }, { x: x - hw, y: u }]);
        };
        if(crowdNamed(c) && sc.crowd) labs += pl.put('is-steric', crowdLabel(c), spots(sc.crowd, 'is-steric', crowdLabel(c), true), false);
        if(c.nG && tor.gauche === 'hbond' && sc.hb) labs += pl.put('is-calm', 'hydrogen bond', spots(sc.hb, 'is-calm', 'hydrogen bond', true), false);
        if(c.ecl && sc.tors) labs += pl.put('is-tors', 'torsional strain', spots(sc.tors, 'is-tors', 'torsional strain', false), false);
      }
    }
    if(nq.on && !ask && V.fade >= 1) labs += etag(null);
    function etag(pl){
      var e = energyOf(V.E, V.theta) - Math.min.apply(null, V.E), text = fx(e) + ' kcal/mol', x = clamp(land.px(V.theta), 56, G.W - 56), y = land.py(energyOf(V.E, V.theta));
      return pl ? pl.put('is-etag', text, [{ x: x, y: y - 42 }, { x: x, y: y + 22 }], true) : lab('is-etag', x, y - 42, text);
    }
    gDyn.innerHTML = h; labsEl.innerHTML = labs;
    nodes.forEach(function(b){
      var t = +b.getAttribute('data-t');
      b.style.left = n1(land.px(t)) + 'px'; b.style.top = n1(land.py(energyOf(V.E, t))) + 'px';
      var cls = 'cf2-node' + (nq.on ? ' is-ask' : '');
      if(nq.on && nq.done){
        if(nqSame(t)) cls += ' is-ok'; else if(nq.pick !== null && nq.pick === t % 360) cls += ' is-no';
      }
      b.className = cls; b.disabled = nq.on && nq.done;
      var d = conf(t);
      b.setAttribute('aria-label', (nq.on ? '' : 'Go to ') + t + ' degrees' + (nq.on && !nq.done ? '' : ', ' + SHORT[d.key].toLowerCase() + ', ' + fx(d.up) + ' kilocalories per mole'));
    });
    scrub.place([G.gx0, G.gtop - 8, G.gx1, G.gbase]); scrub.value(clamp(V.theta, 0, 360));
  }

  /* The ring's size and place, from everything it draws in this view in both chairs and on the way between them
     (every ball, with its radius), fitted into its region and stood on the bench. */
  function fitRing(){
    var key = [C.spin.toFixed(3), C.rx.toFixed(3), ringKey(ring), G.W, G.H].join('|');
    if(G.fit && G.fit.key === key) return G.fit;
    var cam = camera({ cx: 0, cy: 0, s: 1, spin: C.spin, rx: C.rx, D: 24 }), l = 0, r = 0, u = 0, d = 0;
    [0, 0.25, 0.5, 0.75, 1].forEach(function(q){
      var ch = chairAt(q);
      ch.C.map(cam).forEach(function(P){ l = Math.max(l, -P.x + 0.31 * P.k); r = Math.max(r, P.x + 0.31 * P.k); u = Math.max(u, -P.y + 0.31 * P.k); d = Math.max(d, P.y + 0.31 * P.k); });
      ch.atoms.forEach(function(a){
        var P = cam(a.pos), R = (a.subKey === 'H' ? 0.25 : Math.min(0.6, SUBS[a.subKey].r * 0.92)) * P.k;
        l = Math.max(l, -P.x + R); r = Math.max(r, P.x + R); u = Math.max(u, -P.y + R); d = Math.max(d, P.y + R);
      });
    });
    var g = G.reg, cs = Math.min((g[2] - g[0]) / (l + r), (g[3] - g[1]) / (u + d));
    G.fit = { key: key, cs: cs, cx: (g[0] + g[2]) / 2 + (l - r) * cs / 2, cy: g[3] - d * cs, box: [(g[0] + g[2]) / 2 - (l + r) * cs / 2, g[3] - (u + d) * cs, (l + r) * cs, (u + d) * cs] };
    return G.fit;
  }
  function drawChair(){
    if(G.reg == null) return;
    var ask = chal.on && !chal.done, pr = chairPair(), sh = flipShape(p), labs = '', h = '', fit = fitRing();
    G.cs = fit.cs; G.cx = fit.cx; G.cy = fit.cy;
    var cam = camera({ cx: G.cx, cy: G.cy, s: G.cs, spin: C.spin, rx: C.rx, D: 24 }), ch = chairAt(p);
    var pl = placer([pickerBox(ringPick)]);
    h += '<ellipse class="cf2-shadow" cx="' + n1(fit.box[0] + fit.box[2] / 2) + '" cy="' + n1(G.fy + 5) + '" rx="' + n1(fit.box[2] * 0.46) + '" ry="' + (G.big ? 10 : 7) + '"/>';
    if(G.big) [G.tax, G.tbx].forEach(function(x){ h += '<ellipse class="cf2-shadow" cx="' + n1(x) + '" cy="' + n1(G.fy + 5) + '" rx="' + n1(G.ts * 3.2) + '" ry="7"/>'; });
    h += '<g class="cf2-main"' + (C.fade < 1 ? ' opacity="' + C.fade.toFixed(2) + '"' : '') + '>' + paint(chairItems(ch, cam, { bw: clamp(G.cs * 0.1, 3.4, 7.5), glow: !ask })) + '</g>';
    [0, 1].forEach(function(end){
      var x = end ? G.tbx : G.tax, tv = viewFor(ring), tc = camera({ cx: x, cy: G.ty, s: G.ts, spin: tv.spin, rx: tv.rx, D: 24 });
      var here = sh === (end ? 'b' : 'a'), share = end ? pr.shareB : pr.shareA, win = !ask && pr.gap >= 0.005 && share > 50;
      var tw2 = G.ts * 6.6, th2 = G.ts * 4.7, top2 = G.big ? G.ty - G.ts * 3.2 : G.ty - th2 / 2, hh2 = G.big ? G.fy - top2 - 3 : th2;
      if(here) h += '<rect class="cf2-thumbbox" x="' + n1(x - tw2 / 2) + '" y="' + n1(top2) + '" width="' + n1(tw2) + '" height="' + n1(hh2) + '" rx="16"/>';
      h += '<g class="cf2-thumb' + (here ? ' is-here' : '') + '"' + (C.fade < 1 ? ' opacity="' + C.fade.toFixed(2) + '"' : '') + '>' +
        paint(chairItems(chairAt(end), tc, { bw: clamp(G.ts * 0.13, 2, 3.2), small:true, bare: !G.big, glow:0 })) + '</g>';
      pl.block([x - tw2 / 2, top2, tw2, hh2]);
      labs += pl.put('is-share' + (win ? ' is-win' : '') + (here ? ' is-here' : ''), ask ? '?' : pctText(share, pr.gap) + '%', [{ x: x, y: G.shareY }], true);
      box(thumbs[end], x - tw2 / 2, top2, tw2, hh2);
      thumbs[end].setAttribute('aria-label', 'Flip to this chair: ' + chairState(end).toLowerCase() + (ask ? '' : ', ' + pctText(share, pr.gap) + ' percent of molecules'));
      thumbs[end].setAttribute('aria-pressed', String(here));
    });
    if(!ask) labs += pl.put('is-state', chairState(p), [{ x: G.W / 2, y: G.stateY }], true);
    // the names hold while the ring is a chair (the same test the line under the picture uses)
    if((sh === 'a' || sh === 'b') && C.fade >= 1){
      // every group's ball keeps clear of names, so no name lies over its letters
      ch.atoms.forEach(function(a){ if(a.subKey !== 'H') pl.block([a.P.x - a.R, a.P.y - a.R, a.R * 2, a.R * 2]); });
      // name the two positions on the carbon that carries the first group (C1 on plain cyclohexane)
      var fc = 0; for(var i = 0; i < 6; i++) if(ring[i]){ fc = i; break; }
      var big = null;
      ch.atoms.forEach(function(a){
        var ux = a.P.x - a.PC.x, uy = a.P.y - a.PC.y, ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
        if(a.carbon === fc){
          var word = a.isAxial ? 'axial' : 'equatorial', cls = a.isAxial ? 'is-ax' : 'is-eq';
          labs += pl.put(cls, word, around(a.P.x, a.P.y, a.R, ux, uy, cls, word), false);
        }
        if(!ask && a.subKey !== 'H' && a.isAxial && (a.glow || 0) > 0.2 && (!big || SUBS[a.subKey].a > SUBS[big.subKey].a)) big = a;
      });
      if(big){
        // between the axial group and the axial atom two carbons on (the farther one across), else round the group
        var mates = ch.atoms.filter(function(b){ return b.face === big.face && (b.carbon === (big.carbon + 2) % 6 || b.carbon === (big.carbon + 4) % 6); });
        var m = mates.sort(function(x, y){ return Math.abs(y.P.x - big.P.x) - Math.abs(x.P.x - big.P.x); })[0], up = big.P.y < big.PC.y ? -1 : 1;
        labs += pl.put('is-steric', 'steric strain', (m ? [{ x: (big.P.x + m.P.x) / 2, y: (big.P.y + m.P.y) / 2 + up * (big.R * 0.5 + 16) }, { x: (big.P.x + m.P.x) / 2, y: Math.min(big.P.y, m.P.y) + up * (big.R + 18) }] : [])
          .concat(around(big.P.x, big.P.y, big.R, 0, up, 'is-steric', 'steric strain')), false);
      } else if(!ask){
        var gp = chairEnergy(ch).gauche[0];
        if(gp){
          var gx = (gp[0].P.x + gp[1].P.x) / 2, gy = (gp[0].P.y + gp[1].P.y) / 2, gR = Math.max(Math.abs(gp[0].P.y - gp[1].P.y) / 2 + Math.max(gp[0].R, gp[1].R), 10);
          labs += pl.put('is-steric', 'steric strain', around(gx, gy, gR, 0, -1, 'is-steric', 'steric strain'), false);
        }
      }
    }
    gDyn.innerHTML = h; labsEl.innerHTML = labs;
    flip.place([G.tx0, G.trackY, G.tx1, G.trackY]);
    box(camHit, fit.box[0], fit.box[1], fit.box[2], fit.box[3]);
    camHit.setAttribute('aria-label', 'The ring model: ' + chairState(p).toLowerCase() + '. Press Enter to flip it; the arrow keys turn the view.');
  }

  /* ---------------------------------------------------- words */
  var PURPOSE = { newman:'See how turning a bond changes its strain energy', chair:'Flip the ring and see which chair wins' };
  function words(){
    head.purpose(PURPOSE[S.tab]);
    if(took) cause.take(took); else cause.set(S.tab === 'newman' ? chainBond() : chainChair(p));
    var c = conf(theta);
    turnIn.setAttribute('aria-valuetext', Math.round(mod360(theta)) + ' degrees, ' + SHORT[c.key].toLowerCase() + ', ' + fx(energyAt(theta) - minE()) + ' kilocalories per mole above the lowest shape');
    svg.setAttribute('aria-label', S.tab === 'newman'
      ? (nq.on ? 'A Newman projection of ' + tor.name + ' and its energy curve.' : 'A model of ' + tor.name + ' seen down its central bond, beside its energy hill. ' + (nq.on ? '' : cause.text()))
      : 'A cyclohexane ring model with its two chairs at the ends of the flip control. ' + (chal.on && !chal.done ? '' : cause.text()));
  }
  /* What shows in which mode: Explore and the open Check yourself part get everything; a drill gets the picture and
     its own question only (no tabs, no pickers, no cause line until it is answered). */
  function chrome(){
    var drill = nq.on || chal.on, nw = S.tab === 'newman';
    tabs.el.hidden = drill; head.el.hidden = drill; if(head.how) head.how.hidden = S.mode !== 'explore';
    molPick.hidden = !nw || drill; ringPick.hidden = nw || drill;
    turn.hidden = turnHit.hidden = scrub.el.hidden = !nw || nq.on;
    nodes.forEach(function(b){ b.hidden = !nw; });
    flip.hide(nw); camHit.hidden = nw; thumbs.forEach(function(b){ b.hidden = nw; });
    playTurn.el.hidden = !nw || drill; playFlip.el.hidden = nw || drill;
    lines.hidden = drill && !(chal.on && chal.done);
    stage.classList.toggle('is-drill', drill);
    stage.setAttribute('data-tab', S.tab);
    if(tabs.value() !== S.tab) tabs.value(S.tab);
  }
  function setTab(v, user){
    if(v === S.tab && user) return;
    stopPlay(); stopTween(); took = null; V.ghost = null; tourTurn.stop(); tourFlip.stop();
    S.tab = v; snapView(); chrome(); layoutNow(); words(); refNow(); refBuild(); syncState();
    if(user){
      // the picture arrives, it does not swap: a short fade (none with reduced motion)
      tween(260, function(e){ gDyn.setAttribute('opacity', (0.15 + 0.85 * e).toFixed(2)); }, function(){ gDyn.removeAttribute('opacity'); });
      showCue();
    }
  }

  /* ====================================================================== */
  /* Test yourself: the two drills, on the same pictures                     */
  /* ====================================================================== */

  /* WHERE ON THE CURVE. A molecule at one of its six landmark angles, drawn as a Newman projection with the ball
     hidden. Tap where it sits on the energy curve. Any landmark with the same energy counts (butane's two gauche
     wells are the same conformation). A wrong tap stays on the curve in red beside the right ones in green; a
     method hint comes before Show the answer. */
  var nqBox = mk('div', 'cf-nq'); nqBox.id = 'cfNq';
  function nqNew(){
    var pool = TORSIONALS.filter(function(t){ return t.id !== 'ethane'; });
    var prev = nq.mol, prevDeg = nq.deg;
    for(var i = 0; i < 20; i++){
      nq.mol = pool[Math.floor(Math.random() * pool.length)];
      nq.deg = 60 * Math.floor(Math.random() * 6);
      if(nq.mol !== prev || nq.deg !== prevDeg) break;
    }
    tor = nq.mol; theta = nq.deg;
    nq.pick = null; nq.done = false; nq.hint = false;
    V.ghost = null; snapView(); chrome(); draw(); words(); nqPanel(); refNow();
  }
  function nqSame(t){ return Math.abs(energyAt(t) - energyAt(nq.deg)) < 0.05; }
  function nqPick(t){
    if(!nq.on || nq.done) return;
    nq.pick = t; nq.done = true; nq.total++;
    if(nqSame(t)) nq.right++;
    draw(); words(); nqPanel(); refNow();
  }
  function nqPanel(){
    if(!nq.on){ nqBox.innerHTML = ''; return; }
    var d = describeTorsion(nq.deg), up = energyAt(nq.deg) - minE();
    var ok = nq.done && nq.pick !== null && nqSame(nq.pick);
    var html = '<p class="cf-nq__q"><b>' + esc(tor.name) + '.</b> Where does this conformation sit on the energy curve? Tap a peak or a valley.' +
      (nq.total ? ' <span class="tmuted">' + nq.right + ' of ' + nq.total + '</span>' : '') + '</p>';
    if(!nq.done){
      html += '<div class="trow">' +
        (nq.hint ? '' : '<button type="button" class="tchip" id="cfNqHint">Hint</button>') +
        '<button type="button" class="tchip" id="cfNqShow">Show the answer</button></div>';
      if(nq.hint) html += '<div class="tnote tnote--info" id="cfNqHintBox"><span class="tnote__k">Method</span>' +
        'First look at the front bonds: if each one lines up with a back bond (drawn just beside it), it is eclipsed, a peak. If each sits between two back bonds, it is staggered, a valley. ' +
        'Then find the two biggest groups: 180° apart (anti) is usually the lowest valley and 60° apart (gauche) a higher one. The exceptions here are 1,2-difluoroethane and ethylene glycol, where gauche is lowest. ' +
        'Big groups lined up with each other is the highest peak.</div>';
    } else {
      var answer = nq.pick === null;
      html += '<div class="tnote ' + (answer ? 'tnote--info' : ok ? 'tnote--good' : 'tnote--bad') + '" id="cfNqSay" tabindex="-1"><span class="tnote__k">' +
        (answer ? 'The answer' : ok ? 'Right' : 'Not that one') + '</span>' +
        (answer || ok ? '' : 'You picked ' + nq.pick + '°, ' + fx(energyAt(nq.pick) - minE()) + ' kcal/mol above the minimum: ' + esc(describeTorsion(nq.pick).name.toLowerCase()) + '. ') +
        'This is ' + esc(d.name.toLowerCase()) + ' at ' + nq.deg + '°, ' + fx(up) + ' kcal/mol above the minimum. Green marks where it sits' + (answer || ok ? '' : ', red is your pick') + '.</div>' +
        '<div class="trow"><button type="button" class="btn-press" id="cfNqNext">Next one</button></div>';
    }
    nqBox.innerHTML = html;
    var h = byId('cfNqHint'); if(h) h.addEventListener('click', function(){ nq.hint = true; nqPanel(); var hb = byId('cfNqShow'); if(hb) hb.focus(); });
    var sh = byId('cfNqShow'); if(sh) sh.addEventListener('click', function(){ nq.done = true; nq.pick = null; nq.total++; draw(); words(); nqPanel(); refNow(); var n = byId('cfNqNext'); if(n) n.focus(); });
    var nx = byId('cfNqNext'); if(nx) nx.addEventListener('click', function(){ nqNew(); var g = nodes[0]; if(g) try{ g.focus({ preventScroll:true }); }catch(e){} });
  }

  /* FIND THE MORE STABLE CHAIR. A substitution pattern drawn at random (one or two groups, cis or trans, 1,2 / 1,3
     / 1,4), shown in whichever chair the dice pick, with the shares and the strain hidden. Flip until the chair
     shown is the better one and commit; the shares, the glow and the cause line then come back. Patterns whose two
     chairs cost the same are skipped: there is no right answer to find. */
  var chalBox = mk('div', 'cf-chal'); chalBox.id = 'cfChal';
  function newChal(){
    for(var tries = 0; tries < 60; tries++){
      var r = [null, null, null, null, null, null];
      var g1 = CHAL_GROUPS[Math.floor(Math.random() * CHAL_GROUPS.length)];
      r[0] = [g1, Math.random() < 0.5 ? 'up' : 'down'];
      if(Math.random() < 0.75){
        var pos = 1 + Math.floor(Math.random() * 3);
        var g2 = CHAL_GROUPS[Math.floor(Math.random() * CHAL_GROUPS.length)];
        r[pos] = [g2, Math.random() < 0.5 ? 'up' : 'down'];
      }
      /* trans-1,2-dihalides are the textbook exception to "diequatorial wins" (the diaxial chair is competitive
         or preferred in nonpolar solvents, a dipole effect A-values do not see), so the challenge does not ask
         about two halogens on neighboring carbons. */
      if(r[1] && /^(Cl|Br|F)$/.test(r[0][0]) && /^(Cl|Br|F)$/.test(r[1][0])) continue;
      ring = r;
      var a = chairEnergy(chairAt(0)).total, b = chairEnergy(chairAt(1)).total;
      if(Math.abs(a - b) >= 0.2) break;
    }
    p = Math.random() < 0.5 ? 0 : 1; flip.value(p * 100);
    chal.done = false; chal.ok = null;
    snapView(); chrome(); draw(); words(); chalPanel(); refNow();
  }
  function chalPanel(){
    if(!chal.on){ chalBox.innerHTML = ''; return; }
    var pr = chairPair(), atEnd = p < 0.04 || p > 0.96, mine = chal.told ? pr.b : pr.a, its = chal.told ? pr.a : pr.b;
    var names = ring.map(function(e, i){ return e ? SUBS[e[0]].label + ' on C' + (i + 1) + ' (' + e[1] + ')' : null; }).filter(Boolean);
    chalBox.innerHTML = '<p class="cf-chal__q"><b>Find the more stable chair.</b> ' + esc(names.join(', ')) + '. ' +
        'Flip the ring (slide, or tap the model) until the chair shown is the better one.' +
        (chal.total ? ' <span class="tmuted">' + chal.right + ' of ' + chal.total + '</span>' : '') + '</p>' +
      '<div class="trow">' +
        (chal.done ? '<button type="button" class="btn-press" id="cfChalNext">Next ring</button>'
                   : '<button type="button" class="btn-press" id="cfChalGo"' + (atEnd ? '' : ' disabled') + '>This chair is the stable one</button>') +
      '</div>' +
      (chal.done ? '<div class="tnote ' + (chal.ok ? 'tnote--good' : 'tnote--bad') + '" style="margin-top:10px;" tabindex="-1" id="cfChalSay"><span class="tnote__k">' +
        (chal.ok ? 'Right' : 'The other chair') + '</span>' +
        (chal.ok ? 'The chair you chose costs ' + mine.total.toFixed(2) + ' kcal/mol against ' + its.total.toFixed(2) + '.'
                 : 'The other chair costs ' + its.total.toFixed(2) + ' kcal/mol against ' + mine.total.toFixed(2) + ' for the one you chose.') +
        ' ' + (function(){
          var best = Math.min(pr.a.total, pr.b.total);
          var subs = ring.filter(Boolean);
          var bestE = pr.a.total <= pr.b.total ? pr.a : pr.b;
          if(!bestE.axial.length) return subs.length > 1 ? 'In the better chair every group is equatorial' + (bestE.polar.length ? ', so by A-values it costs nothing. The two polar neighbors are not estimated here.' : best < 0.005 ? ', so it pays nothing.' : ', and pays only the 0.9 kcal/mol of two neighboring groups being gauche.') : 'Equatorial costs nothing; axial costs the A-value.';
          var big = subs.slice().sort(function(x, y){ return SUBS[y[0]].a - SUBS[x[0]].a; })[0];
          return 'Here one group has to be axial in either chair, so the better chair puts the larger one, ' +
            SUBS[big[0]].label + ' (A = ' + SUBS[big[0]].a.toFixed(2) + '), equatorial.';
        })() + '</div>' : '');
    var go = byId('cfChalGo');
    if(go) go.addEventListener('click', function(){
      stopTween();
      var end = p < 0.5 ? 0 : 1, a = chairEnergy(chairAt(end)).total, b = chairEnergy(chairAt(1 - end)).total;
      chal.done = true; chal.total++; chal.ok = a <= b; chal.told = end; if(chal.ok) chal.right++;
      chrome(); draw(); words(); chalPanel(); refNow();
      var s2 = byId('cfChalNext') || byId('cfChalSay'); if(s2) s2.focus({ preventScroll:true });
    });
    var nx = byId('cfChalNext');
    if(nx) nx.addEventListener('click', function(){ newChal(); var g = byId('cfChalGo'); if(g) g.focus(); });
  }
  function panels(){ if(chal.on) chalPanel(); }

  /* ====================================================================== */
  /* "?": the numbers, the builders and how to read the picture              */
  /* ====================================================================== */
  var ref = mk('div', 'cf2-ref',
    '<p class="cf2-ref-how"><button type="button" class="tk2-how" id="cfRefHow">Show me how</button></p>' +
    '<div id="cfRefNow"></div><div id="cfRefBuild"></div>' +
    '<details class="tool-more" open><summary>How to read the picture</summary><div class="cf2-ref-key">' +
      '<p><span class="cf2-sw is-tors"></span><b>Amber plane:</b> two bonds lined up, one behind the other (eclipsed). That costs torsional strain.</p>' +
      '<p><span class="cf2-sw is-steric"></span><b>Red glow:</b> two groups crowding each other. That costs steric strain. On a ring it is an axial group against the two axial atoms on its side (1,3-diaxial strain).</p>' +
      '<p><span class="cf2-sw is-ax"></span><b>Blue bond:</b> axial, straight up or down from the ring. <span class="cf2-sw is-eq"></span><b>Green bond:</b> equatorial, pointing out from the ring\'s edge. White balls are hydrogens; the ring carbons are numbered.</p>' +
      '<p>The bond model is seen from the side and a little above, front carbon on the left. Seen exactly end on, from the front, it is the Newman projection in the corner. A ball marked CH₃ (or tBu, OH and so on) stands for the whole group.</p>' +
      '<p>The energy curve is pinned at the three eclipsed peaks and three staggered valleys and drawn smoothly between them. Those six points are the real numbers; a reading at 37° is the shape of the curve, not a measurement.</p>' +
      '<p>On the way from one chair to the other the ring passes a half chair (about 10 to 11 kcal/mol above the chair) and a boat (about 7). The real path also twists the boat a little (the twist boat, about 5.5); the picture leaves the twist out. At room temperature a cyclohexane ring flips roughly a hundred thousand times a second.</p>' +
    '</div></details>');
  function refNow(){
    var el = byId('cfRefNow'); if(!el) return;
    if((nq.on && !nq.done) || (chal.on && !chal.done)){ el.innerHTML = '<div class="tempty">Hidden until you answer.</div>'; return; }
    var html;
    if(S.tab === 'newman'){
      var d = describeTorsion(theta), e = energyAt(theta), min = minE();
      html = '<h3 class="cf2-ref-h">This molecule: ' + esc(tor.name) + '</h3>' +
        '<div class="tnote ' + (e - min < 0.05 ? 'tnote--good' : (e - min > 2 ? 'tnote--bad' : 'tnote--warn')) + '">' +
          '<span class="tnote__k">' + esc(d.name) + ' · ' + Math.round(mod360(theta)) + '° · ' + fx(e - min) + ' kcal/mol above the minimum</span>' + esc(d.detail) +
        '</div>' +
        '<div class="tstat">' +
          '<div><div class="k">Relative energy</div><div class="v">' + fx(e) + ' <small>kcal/mol</small></div></div>' +
          '<div><div class="k">Above the minimum</div><div class="v">' + fx(e - min) + ' <small>kcal/mol</small></div></div>' +
        '</div>' +
        '<p class="tmuted" style="margin:0;">' + esc(tor.note) + '</p>';
    } else {
      var here = chairAt(p < 0.5 ? 0 : 1), other = chairAt(p < 0.5 ? 1 : 0);
      var eHere = chairEnergy(here), eOther = chairEnergy(other);
      var gap = Math.abs(eHere.total - eOther.total), Kq = Math.exp(gap / RT), pct = Kq / (1 + Kq) * 100;
      html = '<h3 class="cf2-ref-h">This ring</h3><div class="tstat">' +
        '<div><div class="k">This chair</div><div class="v">' + eHere.total.toFixed(2) + ' <small>kcal/mol</small></div></div>' +
        '<div><div class="k">The other chair</div><div class="v">' + eOther.total.toFixed(2) + ' <small>kcal/mol</small></div></div>' +
        '<div><div class="k">At equilibrium</div><div class="v">' + (gap < 0.005 ? '50 : 50' : pct.toFixed(gap > 2 ? 2 : 1) + '%') +
          ' <small>' + (gap < 0.005 ? '' : 'favoured') + '</small></div></div>' +
      '</div>';
      if(eHere.terms.length === 0 && eOther.terms.length === 0){
        html += '<div class="tnote"><span class="tnote__k">Nothing to strain</span>' +
          'Unsubstituted cyclohexane. Both chairs are identical and it flips between them roughly a hundred thousand times a second. ' +
          'Pick a ring with a group on it and they stop being equivalent.</div>';
      } else if(gap < 0.005){
        html += '<div class="tnote tnote--info"><span class="tnote__k">Evenly matched</span>' +
          'Both chairs cost the same, so neither is preferred: the ring flips freely and you would find a 50:50 mixture. ' +
          'This is what happens when a flip only trades one identical axial group for another.</div>';
      } else {
        var winner = eHere.total < eOther.total ? 'the one on screen' : 'the other one';
        html += '<div class="tnote ' + (eHere.total <= eOther.total ? 'tnote--good' : 'tnote--warn') + '">' +
          '<span class="tnote__k">' + (eHere.total <= eOther.total ? 'You are looking at the major conformer' : 'The other chair is better') + '</span>' +
          'The gap is ' + gap.toFixed(2) + ' kcal/mol in favor of ' + winner + '. ' +
          'At room temperature that works out to about ' + pct.toFixed(gap > 2 ? 2 : 1) + '% of molecules sitting in the better chair ' +
          'at any moment. Energy differences this small still produce lopsided ratios, because the relationship is exponential.' +
        '</div>';
      }
      html += '<h3 class="cf2-ref-h">The strain, term by term</h3>';
      if(eHere.terms.length){
        html += '<div class="ttable-scroll"><table class="ttable">' +
          '<thead><tr><th>What this chair is paying for</th><th>kcal/mol</th></tr></thead><tbody>' +
          eHere.terms.map(function(t){
            return '<tr><td>' + esc(t.text) + '</td><td class="num">' + (t.kcal ? t.kcal.toFixed(2) : 'n/a') + '</td></tr>';
          }).join('') +
          '<tr><td><b>Total</b></td><td class="num win">' + eHere.total.toFixed(2) + '</td></tr>' +
          '</tbody></table></div>';
      } else {
        html += '<div class="tnote tnote--good"><span class="tnote__k">Nothing axial</span>' +
          'Every substituent on this chair is equatorial, so there is no A-value to pay. This is as good as it gets.</div>';
      }
      if(ringSubs().length) html += '<div class="ttable-scroll"><table class="ttable" style="margin-top:10px;">' +
        '<thead><tr><th>Position</th><th>Group</th><th>Face</th><th>This chair</th><th>After a flip</th></tr></thead><tbody>' +
        [0,1,2,3,4,5].map(function(i){
          var e2 = ring[i];
          if(!e2) return '';
          var a = here.atoms.filter(function(x){ return x.carbon === i && x.face === e2[1] && x.subKey !== 'H'; })[0];
          var b = other.atoms.filter(function(x){ return x.carbon === i && x.face === e2[1] && x.subKey !== 'H'; })[0];
          if(!a || !b) return '';
          return '<tr><td class="num">C' + (i + 1) + '</td><td>' + esc(SUBS[e2[0]].label) + '</td><td>' + e2[1] + '</td>' +
            '<td class="' + (a.isAxial ? 'lose' : 'win') + '">' + (a.isAxial ? 'axial' : 'equatorial') + '</td>' +
            '<td class="' + (b.isAxial ? 'lose' : 'win') + '">' + (b.isAxial ? 'axial' : 'equatorial') + '</td></tr>';
        }).join('') +
        '</tbody></table></div>';
      html += '<p class="tmuted" style="margin-top:10px;">A flip turns every axial group equatorial and every equatorial group axial, ' +
        'all six carbons at once. It never moves a group from one face of the ring to the other, which is why cis stays cis: ' +
        'that would take breaking a bond.</p>';
    }
    el.innerHTML = html;
  }

  /* Building your own: three groups on each carbon of the bond, or a group and a face on each ring carbon. The
     picture behind the sheet follows every change. */
  function refBuild(){
    var el = byId('cfRefBuild'); if(!el) return;
    if(S.tab === 'newman'){
      var keys = Object.keys(SUBS);
      var sel = function(side, i, cur){
        return '<select class="tselect" data-side="' + side + '" data-i="' + i + '" aria-label="' + (side === 'f' ? 'Front' : 'Back') + ' carbon, group ' + (i + 1) + '">' +
          keys.map(function(k){
            return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' +
              esc(SUBS[k].label) + (SUBS[k].a ? ' (A ' + SUBS[k].a.toFixed(2) + ')' : '') + '</option>';
          }).join('') + '</select>';
      };
      el.innerHTML = '<h3 class="cf2-ref-h">Build your own molecule</h3>' +
        '<div class="cf-torbuild">' +
          '<div><div class="cf-torbuild__k">Front carbon</div>' + [0,1,2].map(function(i){ return sel('f', i, custFront[i]); }).join('') + '</div>' +
          '<div><div class="cf-torbuild__k">Back carbon</div>' + [0,1,2].map(function(i){ return sel('b', i, custBack[i]); }).join('') + '</div>' +
        '</div>' +
        '<div class="trow" style="margin-top:8px;"><button type="button" class="tchip" id="cfTorUse">Show this molecule</button></div>' +
        '<p class="tmuted" style="margin:10px 0 0;">Ethane and butane come back at their textbook numbers. ' +
        'Past methyl the eclipsing and gauche costs are extrapolated from A-values rather than measured: ' +
        'the shape of the curve is right, the exact heights are an estimate.</p>';
      el.querySelectorAll('select').forEach(function(s){
        s.addEventListener('change', function(){
          var i = parseInt(s.getAttribute('data-i'), 10);
          if(s.getAttribute('data-side') === 'f') custFront[i] = s.value; else custBack[i] = s.value;
          if(!nq.on) setMol(customTorsion(custFront, custBack), true);
        });
      });
      byId('cfTorUse').addEventListener('click', function(){ if(!nq.on) setMol(customTorsion(custFront, custBack), true); });
    } else {
      el.innerHTML = '<h3 class="cf2-ref-h">Build your own ring: groups on C1 to C6</h3><div id="cfRing" class="cf-ring"></div>' +
        '<div class="trow" style="margin-top:10px;"><button type="button" class="tchip" id="cfClear">Clear all</button></div>';
      byId('cfClear').addEventListener('click', function(){ if(!chal.on) setRing([null, null, null, null, null, null], true); });
      ringBuild(true);
    }
  }
  function ringBuild(force){
    var el = byId('cfRing'); if(!el) return;
    if(!force && el.contains(document.activeElement)){
      // the student is in it: keep their place, only refresh the up / down buttons
      [0,1,2,3,4,5].forEach(function(i){
        var seg = el.querySelector('.cf-face[data-pos="' + i + '"]'), e = ring[i]; if(!seg) return;
        seg.querySelectorAll('button').forEach(function(b){ b.disabled = !e; b.classList.toggle('on', e ? e[1] === b.getAttribute('data-face') : b.getAttribute('data-face') === 'up'); });
        var s = el.querySelector('select[data-pos="' + i + '"]'); if(s && s !== document.activeElement) s.value = e ? e[0] : '';
      });
      return;
    }
    var opts = Object.keys(SUBS).map(function(k){
      return { k:k, label:SUBS[k].label + (SUBS[k].a ? ' (A = ' + SUBS[k].a.toFixed(2) + ')' : '') };
    });
    el.innerHTML = [0,1,2,3,4,5].map(function(i){
      var e = ring[i];
      return '<div class="cf-slot">' +
        '<label for="cfSub' + i + '">C' + (i + 1) + '</label>' +
        '<select class="tselect" id="cfSub' + i + '" data-pos="' + i + '">' +
          '<option value="">None</option>' +
          opts.filter(function(o){ return o.k !== 'H'; }).map(function(o){
            return '<option value="' + o.k + '"' + (e && e[0] === o.k ? ' selected' : '') + '>' + esc(o.label) + '</option>';
          }).join('') +
        '</select>' +
        '<div class="tseg cf-face" data-pos="' + i + '">' +
          '<button type="button" data-face="up"' + (!e || e[1] === 'up' ? ' class="on"' : '') + (e ? '' : ' disabled') + '>up</button>' +
          '<button type="button" data-face="down"' + (e && e[1] === 'down' ? ' class="on"' : '') + (e ? '' : ' disabled') + '>down</button>' +
        '</div>' +
      '</div>';
    }).join('');
    el.querySelectorAll('select').forEach(function(sel){
      sel.addEventListener('change', function(){
        if(chal.on) return;
        var i = parseInt(sel.getAttribute('data-pos'), 10), r = ring.slice();
        r[i] = sel.value ? [sel.value, (ring[i] && ring[i][1]) || 'up'] : null;
        setRing(r, true);
      });
    });
    el.querySelectorAll('.cf-face button').forEach(function(b){
      b.addEventListener('click', function(){
        var i = parseInt(b.parentNode.getAttribute('data-pos'), 10);
        if(!ring[i] || chal.on) return;
        var r = ring.slice(); r[i] = [ring[i][0], b.getAttribute('data-face')];
        setRing(r, true);
      });
    });
  }

  /* ====================================================================== */
  /* The link, the modes, the start                                          */
  /* ====================================================================== */
  function syncState(){
    if(!window.OchemToolState || nq.on || chal.on) return;
    var nw = S.tab === 'newman';
    window.OchemToolState.write({
      tab: nw ? null : 'chair',
      tor: (nw && tor && !tor.custom) ? tor.id : null,
      f: (nw && tor && tor.custom) ? custFront.join('.') : null,
      b: (nw && tor && tor.custom) ? custBack.join('.') : null,
      deg: nw ? Math.round(theta) : null,
      // Six slots as key:face, so a whole substitution pattern fits in a link.
      ring: !nw ? ring.map(function(e){ return e ? e[0] + ':' + e[1] : ''; }).join(',').replace(/,+$/, '') : null
    });
  }
  if(window.OchemToolState){
    var q = window.OchemToolState.read();
    if(q.ring != null && q.tab === 'chair'){
      ring = [null, null, null, null, null, null];
      String(q.ring).split(',').forEach(function(slot, i){
        if(i > 5 || !slot) return;
        var bits = slot.split(':');
        if(SUBS[bits[0]] && bits[0] !== 'H') ring[i] = [bits[0], bits[1] === 'down' ? 'down' : 'up'];
      });
      p = 0;
    }
    if(q.f && q.b){
      var cf = q.f.split('.').slice(0, 3), cb = q.b.split('.').slice(0, 3);
      if(cf.length === 3 && cb.length === 3 && cf.concat(cb).every(function(k){ return SUBS[k]; })){ custFront = cf; custBack = cb; tor = customTorsion(cf, cb); }
    } else if(q.tor){
      TORSIONALS.forEach(function(t){ if(t.id === q.tor) tor = t; });
    }
    if(q.deg != null && q.deg !== '') theta = clamp(parseInt(q.deg, 10) || 0, 0, 360);
    if(q.tab === 'chair') S.tab = 'chair';
  }

  /* The shell's adapter calls this after every switch: mode 'explore' | 'quiz', part 'predict' | 'chair' | 'check'
     (the six questions, with the pictures left free) or null. A drill borrows the picture; Explore gets back the
     molecule, angle, ring and chair it had. */
  function onShow(mode, part){
    stopPlay(); stopTween(); took = null; tourTurn.stop(); tourFlip.stop(); hideCue(false);
    var drill = mode === 'quiz' && (part === 'predict' || part === 'chair');
    if(drill && !saved) saved = { tor:tor, theta:theta, ring:ring, p:p, tab:S.tab };
    if(!drill && saved){ tor = saved.tor; theta = saved.theta; ring = saved.ring; p = saved.p; S.tab = saved.tab; saved = null; }
    S.mode = mode; S.part = part;
    nq.on = drill && part === 'predict'; chal.on = drill && part === 'chair';
    if(drill) S.tab = nq.on ? 'newman' : 'chair';
    V.ghost = null; snapView();
    molSel.querySelector('[value="custom"]').hidden = !tor.custom; molSel.value = tor.custom ? 'custom' : tor.id;
    var rid = presetOf(ring); ringSel.querySelector('[value="custom"]').hidden = rid !== 'custom'; ringSel.value = rid;
    flip.value(p * 100); turnIn.value = Math.round(theta);
    chrome(); layoutNow();
    if(nq.on) nqNew(); else nqPanel();
    if(chal.on) newChal(); else chalPanel();
    words(); refNow(); refBuild();
    if(mode === 'explore') showCue();
  }

  root.hidden = true;
  mountQuiz();
  Kit.kit2({
    stage: stage, ref: ref, onShow: onShow,
    parts: [
      { value:'predict', label:'Where on the curve?', dock: nqBox,
        task: { kicker:'Test yourself', title:'Where on the energy curve?', todo:'Read the Newman projection, then tap the peak or valley where it sits.' } },
      { value:'chair', label:'Find the stable chair', dock: chalBox,
        task: { kicker:'Test yourself', title:'Find the more stable chair', todo:'Flip the ring until the chair shown is the better one, then commit.' } }],
    check: { label:'Check yourself: 6 questions',
      task: { kicker:'Test yourself', title:'Check yourself', todo:'Six quick questions. The pictures stay live, so use them.' } }
  });
  byId('cfRefHow').addEventListener('click', function(){ studio.close(); if(S.mode === 'explore') startTour(); });
  if(window.ResizeObserver) new ResizeObserver(function(){ layoutNow(); }).observe(sceneBox);
  else window.addEventListener('resize', layoutNow);
  layoutNow();

  function mountQuiz(){
  /* ---- Check yourself ---------------------------------------------------
     Two question types, matching the two halves of the tool. The A-value
     comparison is the chair half asked in words, and the torsional question
     is the Newman half — both read the same tables the curves are drawn from,
     so the quiz cannot contradict the graph above it. */
  if(window.OchemToolQuiz){
    var SUB_KEYS = Object.keys(SUBS).filter(function(k){ return SUBS[k].a > 0; });

    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'conformations',
      rounds: 6,
      intro: 'Strain, A-values and which conformer you actually have in the flask.',
      make: function(recent){
        var kind = Math.random();

        /* A-VALUES. Pairs need a real gap: 0.38 against 0.43 (Br against Cl)
           is a coin toss dressed up as a question, and the honest answer to
           it is "they are the same within the measurement". */
        if(kind < 0.5){
          var x, y, tries = 0;
          do {
            x = SUB_KEYS[Math.floor(Math.random() * SUB_KEYS.length)];
            y = SUB_KEYS[Math.floor(Math.random() * SUB_KEYS.length)];
            tries++;
          } while(tries < 50 && (x === y || Math.abs(SUBS[x].a - SUBS[y].a) < 0.4 ||
                                 recent.indexOf('a:' + x + y) >= 0));
          var big = SUBS[x].a > SUBS[y].a ? x : y;
          var small = big === x ? y : x;
          return {
            id: 'a:' + x + y,
            term: 'a-value',
            prompt: 'On a cyclohexane ring, which group pays more to sit <b>axial</b>: ' +
                    '<span class="tformula">' + esc(SUBS[x].label) + '</span> or ' +
                    '<span class="tformula">' + esc(SUBS[y].label) + '</span>?',
            options: [
              { id:x, label:esc(SUBS[x].label), correct: x === big },
              { id:y, label:esc(SUBS[y].label), correct: y === big }
            ],
            explain: '<b>' + esc(SUBS[big].label) + '</b>, at ' + SUBS[big].a.toFixed(2) +
                     ' kcal/mol against ' + SUBS[small].a.toFixed(2) + '. ' +
                     'An A-value is exactly that cost: the penalty for the 1,3-diaxial crowding a group ' +
                     'meets when it points along the ring axis. It tracks how much room the group needs ' +
                     'near the ring, which is why tert-butyl (4.90) dwarfs everything: it is the only ' +
                     'common group big enough to hold a ring in one chair on its own.'
          };
        }

        /* TORSIONAL. Asked off the declared energy curve rather than off a
           remembered number, so a molecule added to TORSIONALS becomes a
           question for free. */
        var pool = TORSIONALS.filter(function(t){ return t.id !== 'custom' && t.energies; });
        var tor2 = pool[Math.floor(Math.random() * pool.length)];
        var e = tor2.energies;
        var maxE = Math.max.apply(null, e), minE = Math.min.apply(null, e);
        if(maxE - minE < 0.5) return null;
        var maxAt = e.indexOf(maxE) * 60;

        /* WHICH CONFORMER WINS. The question the barrier does not ask, and the
           only one that catches the two molecules on this list where the
           answer is not anti. A student who has learned "big groups go
           opposite each other" as a rule rather than as a tendency gets it
           wrong here, which is the point of it being asked. */
        if(Math.random() < 0.45){
          /* Only ask where there IS a single best conformer. In ethane and
             propane all three staggered positions are the same conformation
             at the same energy, so "which is most stable" has three correct
             answers and marking one of them wrong would be teaching a
             falsehood. 60° and 300° count as one answer (they are the same
             gauche conformer mirrored), which is what lets difluoroethane
             through. */
          var minima = [];
          for(var mi = 0; mi < e.length; mi++){
            if(Math.abs(e[mi] - minE) < 0.01){
              var conf = mi * 60;
              if(conf === 300) conf = 60;
              if(minima.indexOf(conf) < 0) minima.push(conf);
            }
          }
          if(minima.length !== 1) return null;

          var minAt = e.indexOf(minE) * 60;
          var NAMES = { 0:'Eclipsed, at 0°', 60:'Gauche, at 60°', 120:'Eclipsed, at 120°',
                        180:'Anti, at 180°', 240:'Eclipsed, at 240°', 300:'Gauche, at 300°' };
          /* 60° and 300° are the same conformer by symmetry, so offering both
             would be offering the right answer twice. */
          var opts60 = [0, 60, 120, 180].map(function(deg2){
            return { id:String(deg2), label:NAMES[deg2],
                     correct: deg2 === minAt || (deg2 === 60 && minAt === 300) };
          });
          if(!opts60.some(function(o){ return o.correct; })) return null;
          return {
            id: 'm:' + tor2.id,
            term: 'gauche', topic: 'newman',
            prompt: 'Which conformation of <b>' + esc(tor2.name) + '</b>' +
                    (tor2.formula ? ' (<span class="tformula">' + esc(tor2.formula) + '</span>)' : '') +
                    ' is the <b>most stable</b>?',
            options: opts60,
            explain: '<b>' + NAMES[minAt === 300 ? 60 : minAt] + '</b>, at ' + minE.toFixed(1) +
                     ' kcal/mol. ' + esc(tor2.note)
          };
        }

        return {
          id: 't:' + tor2.id,
          term: 'torsional-strain', topic: 'newman',
          prompt: 'Turning the central bond of <b>' + esc(tor2.name) + '</b>' +
                  (tor2.formula ? ' (<span class="tformula">' + esc(tor2.formula) + '</span>)' : '') +
                  ' through 360°, how big is the <b>barrier</b>, the gap between its highest and ' +
                  'lowest points?',
          options: (function(){
            var truth = maxE - minE;
            var set = [truth];
            [truth * 2, truth / 2, truth + 2.4].forEach(function(v){
              if(v > 0.2 && set.every(function(s){ return Math.abs(s - v) > 0.45; })) set.push(v);
            });
            return set.slice(0, 4).map(function(v){
              return { id:String(v.toFixed(1)), label:v.toFixed(1) + ' kcal/mol', correct: v === truth };
            });
          })(),
          explain: '<b>' + (maxE - minE).toFixed(1) + ' kcal/mol</b>, with the maximum at ' + maxAt + '°. ' +
                   'That is small enough that the bond is still turning millions of times a second at room ' +
                   'temperature. A conformer is a place the molecule spends more of its time, not a ' +
                   'compound you could put in a bottle.'
        };
      }
    });
  }
  }

})();
