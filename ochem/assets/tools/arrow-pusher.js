/* Arrow Pusher, tools v2 (docs/tools-v2-arrow-pusher-brief.md; standard: docs/tools-v2-standard.md).

   One screen, one idea: in a mechanism, curved arrows move electron pairs, and those moves make and break real
   bonds, one step at a time. The student grabs electrons on the molecule (a lone pair, a π bond or a σ bond) and
   drags them to where they go (the curved arrow is drawn behind them, as on paper): a nucleophile's pair becomes a
   new bond to the electrophile, a bond's pair leaves with the leaving group, a proton moves from one base to
   another. The electrons fly along the arrow, the bonds and charges change, and the pieces move: a group that has
   broken away drifts off, a new bond pulls its partner in. A push that would give an atom more than an octet is
   held (the atom ringed, "10 e⁻") until a second push makes room, which is how a concerted step (SN2) is drawn; a
   push that could not happen springs back with the reason. Under the picture, the row of this mechanism's steps
   (start, intermediate, product) lights the one shown; a tap on one plays the textbook arrows to it.

   The board, its drawing, the drag, the snapping and the spring back are the shared electron pushing board
   (ochem/assets/push-board.js), the same as Resonance's, so the two tools feel the same. Which arrows are legal and
   what they make is chem-core.js (valence rules, not an answer key).

   EXPLORE is free play on five curated mechanisms. TEST YOURSELF holds everything else the old tool did, with the
   same ids: draw each step (the seven mechanism challenges, the same checking, hints and Show one arrow), any
   molecule (the twenty one molecules with their nudges, a mechanism as long as you like, Build your own), and the
   six question Check yourself (slug arrow-pusher, the same question ids). Links keep working: ?start=<molecule>,
   ?chal=<challenge>, ?build=<structure>. */
(function(){
  var Mol = window.OchemMolecules;
  var C = window.OchemChem;
  var root = document.getElementById('apRoot');
  if(!Mol || !C || !root) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* ====================================================================== */
  /* The bank (unchanged from the old tool: ids, labels, nudges, challenges)  */
  /* ====================================================================== */
  /* Grouped, because "pick a molecule" is a different question depending on what you sat down to practise. The
     order inside each group runs from the mechanism you meet first to the one you meet last. */
  var GROUPS = [
    { label: 'Substitution & elimination', picks: [
      { id:'sn2-bromoethane', label:'SN2',
        hint:'Two arrows, drawn at the same time: hydroxide’s lone pair into the carbon, and the C–Br bond onto bromine. Draw only the first and the tool will tell you what carbon ends up holding.' },
      { id:'sn1-secondary', label:'SN1 ionization',
        hint:'One arrow. The C–Br bond’s electrons leave with bromide, and nothing attacks yet. That separation of steps is the whole of SN1.' },
      { id:'sn2-tertiary', label:'Blocked SN2',
        hint:'You can draw the SN2 here and it will be legal. Look at what is crowding the carbon and ask whether a nucleophile could physically reach it.' },
      { id:'e2-butane', label:'E2',
        hint:'Three arrows in the real mechanism; two if no base is drawn. The C–H bond into the C–C bond, and the C–Br bond onto bromine.' }
    ]},
    { label: 'Carbonyls', picks: [
      { id:'formaldehyde', label:'Formaldehyde',
        hint:'Push the C=O pi bond up onto oxygen. Watch which atom goes positive and which goes negative, and ask yourself whether that is the right way round.' },
      { id:'acetaldehyde', label:'Aldehyde' },
      { id:'acetone', label:'Ketone',
        hint:'Same move as the aldehyde. The interesting comparison is how hindered this carbon is next to formaldehyde’s.' },
      { id:'methyl-acetate', label:'Ester',
        hint:'The first arrow is the same as a ketone’s. The difference comes one step later, when the tetrahedral intermediate has a group it can push back out.' },
      { id:'acetyl-chloride', label:'Acyl chloride' },
      { id:'acetamide', label:'Amide',
        hint:'Try pushing the nitrogen lone pair into the C–N bond. What happens to the carbonyl tells you why amides are so unreactive.' }
    ]},
    { label: 'Additions', picks: [
      { id:'propene-hbr', label:'Markovnikov addition',
        hint:'The pi bond is the nucleophile here, not the electrophile. Push it at the hydrogen of H–Br and let the H–Br bond collapse onto bromine.' },
      { id:'propylene-oxide', label:'Epoxide opening',
        hint:'A leaving group that cannot leave, because it is tied on at both ends. Attack a ring carbon and open the C–O bond onto oxygen.' },
      { id:'benzene', label:'Aromatic ring',
        hint:'The ring can attack, but it pays for it: push a pi bond out and see what the ring is left holding.' }
    ]},
    { label: 'Acids & bases', picks: [
      { id:'acetic-acid', label:'Carboxylic acid',
        hint:'Break the O–H bond and give both electrons to oxygen. Then look at the anion and ask what else could be done with the second oxygen.' },
      { id:'water', label:'Water' },
      { id:'ammonia', label:'Ammonia',
        hint:'One lone pair, two jobs. Push it at a proton and it is a base; push it at a carbon and it is a nucleophile.' },
      { id:'ethylamine', label:'Amine' },
      { id:'acetate-ion', label:'Acetate' }
    ]}
  ];
  var ALL = GROUPS.reduce(function(acc, g){ return acc.concat(g.picks); }, []);

  /* The mechanism challenges (Test yourself, "Draw each step"). The start and the product are given; the arrows are
     not. A step is right when the structure the arrows make is the structure the mechanism makes at that step (same
     bonds, same lone pairs, atom for atom), which accepts any arrow set with the same result. hints: per step, the
     ladder from the idea down to the move (the answer itself, arrow by arrow, is Show one arrow). take: the finished
     card's takeaway. stepGoals: a two step challenge's task, step by step. topic: the lesson the card links. */
  var CHALLENGES = [
    { id:'sn2', label:'SN2', mol:'sn2-bromoethane', goal:'Make ethanol and bromide in one concerted step.', topic:'sn2',
      steps:[ [['nucO','c1'], ['bond:c1-br','br']] ],
      hints:[[ 'The nucleophile is the one with a negative charge and lone pairs to give.',
               'It attacks the carbon that holds bromine. In the same step the C–Br bond breaks onto bromine.' ]],
      take:[ 'SN2 happens in one step.', 'Hydroxide attacks the carbon from the back while bromide leaves. One arrow makes a bond, one breaks a bond.' ] },
    { id:'acid-base', label:'Acid–base', mol:'acetic-acid-hydroxide', goal:'Hydroxide takes the acid proton.',
      steps:[ [['nucO','h'], ['bond:o2-h','o2']] ],
      hints:[[ 'A base uses a lone pair to take a proton.',
               'As the new bond to the proton forms, the old O–H bond breaks and its electrons stay on the acid’s oxygen.' ]],
      take:[ 'The base takes the proton.', 'Hydroxide’s lone pair makes the new O–H bond, and the old O–H bond’s electrons stay on oxygen as acetate. Every proton transfer is these two arrows.' ] },
    { id:'sn1', label:'SN1 step 1', mol:'sn1-secondary', goal:'Ionize: make the carbocation and bromide.',
      steps:[ [['bond:c1-br','br']] ],
      hints:[[ 'Nothing attacks in this step.', 'One bond breaks, and both of its electrons leave with the more electronegative atom.' ]],
      take:[ 'Ionization comes first in SN1.', 'The C–Br bond breaks on its own and bromide leaves with both electrons. The carbocation meets its nucleophile in a separate step.' ] },
    { id:'protonate', label:'Protonate a C=O', mol:'fischer-protonation', goal:'Acid catalysis, step 1: put the proton on the carbonyl oxygen.',
      steps:[ [['o1','ha'], ['bond:ac-ha','ac']] ],
      hints:[[ 'The carbonyl oxygen has lone pairs to give.', 'One lone pair takes a proton from hydronium, and that O–H bond breaks onto its oxygen, which leaves as water.' ]],
      take:[ 'Acid makes the carbonyl a better electrophile.', 'A lone pair on oxygen takes the proton. The positive oxygen pulls electrons away from the carbonyl carbon, so even a weak nucleophile can attack it next.' ] },
    { id:'aldol', label:'Aldol addition', mol:'enolate-plus-acetone', goal:'The enolate carbon attacks the second carbonyl; give the alkoxide.',
      steps:[ [['ca','c2'], ['bond:c2-o2','o2']] ],
      hints:[[ 'The enolate’s carbon is the nucleophile.', 'It attacks the carbonyl carbon of the other molecule, and the C=O pi bond moves up onto oxygen.' ]],
      take:[ 'An enolate is a carbon nucleophile.', 'Its carbon makes a new C–C bond to the carbonyl carbon and the pi electrons move onto oxygen, which gives the alkoxide.' ] },
    { id:'acyl', label:'Acyl substitution', mol:'acetyl-chloride-nu', goal:'Two steps: add methoxide to make the tetrahedral intermediate, then collapse it and expel chloride.',
      stepGoals:[ 'Add methoxide to the carbonyl to make the tetrahedral intermediate.', 'Collapse the intermediate and expel chloride.' ],
      steps:[ [['nuO','c'], ['bond:c-o1','o1']], [['o1','bond:c-o1'], ['bond:c-cl','cl']] ],
      hints:[[ 'Methoxide is the nucleophile.', 'It adds to the carbonyl carbon, and the C=O pi bond moves onto oxygen.' ],
             [ 'The negative oxygen pushes a lone pair back down to remake C=O.', 'Carbon can keep only four bonds, so the C–Cl bond breaks and chloride leaves.' ]],
      take:[ 'Add, then eliminate.', 'The nucleophile adds to make a tetrahedral intermediate, then C=O forms again and pushes out chloride, the best leaving group on that carbon.' ] },
    { id:'claisen', label:'Claisen', mol:'enolate-plus-ester', goal:'Two steps: the enolate adds to the ester, then the intermediate collapses and expels ethoxide.',
      stepGoals:[ 'The enolate adds to the ester carbonyl.', 'Collapse the intermediate and expel ethoxide.' ],
      steps:[ [['ca','c2'], ['bond:c2-o2','o2']], [['o2','bond:c2-o2'], ['bond:c2-o3','o3']] ],
      hints:[[ 'The enolate’s carbon is the nucleophile.', 'It adds to the ester’s carbonyl carbon, and the C=O pi bond moves onto oxygen.' ],
             [ 'The negative oxygen pushes a lone pair back down to remake C=O.', 'The C–OEt bond on that same carbon breaks, and ethoxide leaves.' ]],
      take:[ 'Add, then eliminate, again.', 'The enolate adds to the ester carbonyl and the intermediate collapses to push out ethoxide: acyl substitution with a carbon nucleophile.' ] }
  ];

  /* Explore: five mechanisms, each a short path of real steps (the textbook arrows, the same ones the challenges
     check). names: what each state is, shown on its card and in the cause line when the board reaches it. tags: the
     card's tag. take: the takeaway when the last state is reached. Keyed by molecule id, so ?start= finds them. */
  var MECHS = [
    { id:'sn2-bromoethane', label:'SN2', chal:'sn2', names:['Bromoethane + HO⁻', 'Ethanol + Br⁻'], tags:['start', 'product'],
      take:'SN2 is one step: a bond forms as the old one breaks.', long:'SN2 is one step: the new bond to carbon forms as the old one breaks, so both arrows are drawn together. The hydroxide comes in from the side opposite the bromine (not drawn here).' },
    { id:'acetic-acid-hydroxide', label:'Proton transfer', chal:'acid-base', names:['Acetic acid + HO⁻', 'Acetate + water'], tags:['start', 'product'],
      take:'A pair takes the H; the old bond’s pair stays behind.', long:'Every proton transfer is two arrows: a lone pair of the base takes the proton, and the old O–H bond’s pair stays on the acid’s oxygen, which leaves acetate.', roles:{ nucO:'Base', h:'Acidic H' } },
    { id:'sn1-secondary', label:'SN1 ionization', chal:'sn1', names:['2-Bromopropane', 'Carbocation + Br⁻'], tags:['start', 'intermediate'],
      take:'SN1 starts with the leaving group going on its own.', long:'In SN1 the leaving group goes first, on its own: the C–Br bond’s pair leaves with bromide and a carbocation is left, to meet a nucleophile in a second step.' },
    { id:'propene-hbr', label:'HBr addition', names:['Propene + HBr', 'Carbocation + Br⁻', '2-Bromopropane'], tags:['start', 'intermediate', 'product'],
      steps:[ [['bond:c1-c2','hbrH'], ['bond:hbrH-hbrBr','hbrBr']], [['hbrBr','c2']] ],
      take:'The + lands on the more substituted C; Br⁻ bonds there.', long:'The π bond takes the proton at its CH₂ end, so the positive charge lands on the more substituted carbon (a secondary carbocation, not a primary one). Bromide then bonds there: Markovnikov’s rule, from the arrows.', roles:{ c1:'Nucleophile', hbrH:'Electrophile' } },
    { id:'acetyl-chloride-nu', label:'Acyl substitution', chal:'acyl', names:['Acetyl chloride + CH₃O⁻', 'Tetrahedral intermediate', 'Methyl acetate + Cl⁻'], tags:['start', 'intermediate', 'product'],
      take:'Add, then eliminate: C=O opens, then closes and Cl⁻ leaves.', long:'Add, then eliminate: methoxide adds and the C=O opens to the tetrahedral intermediate; then the C=O closes again and pushes out chloride, the best leaving group on that carbon.' }
  ];
  MECHS.forEach(function(m){ if(!m.steps) m.steps = CHALLENGES.filter(function(c){ return c.id === m.chal; })[0].steps; });

  /* Where a molecule is drawn differently from molecules.js (molecule units). HBr sits next to the CH₂ end of the
     alkene: a π bond attacks with its end nearer the target (chem-core), so the textbook (Markovnikov) arrow is the
     natural one; grabbing the π bond at its other end still attacks with that end. */
  var LAYOUT = { 'propene-hbr': { hbrH: [112, 4], hbrBr: [168, -28] }, 'sn2-bromoethane': { nucO: [54, 72], nucH: [40, 30] } };

  function startOf(id){
    var st = C.fromMolecule(Mol.get(id)), o = LAYOUT[id];
    if(o) Object.keys(o).forEach(function(k){ if(st.atoms[k]){ st.atoms[k].x = o[k][0]; st.atoms[k].y = o[k][1]; } });
    return st;
  }

  /* ====================================================================== */
  /* The chemistry the picture needs (no page)                               */
  /* ====================================================================== */
  function arrowsOf(list){ return list.map(function(a){ return { from:a[0], to:a[1] }; }); }

  /* Same atoms, same bonds at the same orders, same lone pairs. */
  function sameStructure(a, b){
    var ka = Object.keys(a.atoms), kb = Object.keys(b.atoms);
    if(ka.length !== kb.length) return false;
    for(var i = 0; i < ka.length; i++){
      var x = a.atoms[ka[i]], y = b.atoms[ka[i]];
      if(!y || (x.lp || 0) !== (y.lp || 0)) return false;
    }
    function bonds(st){ var o = {}; st.bonds.forEach(function(bd){ if(bd.order > 0) o[[bd.a, bd.b].sort().join('|')] = bd.order; }); return o; }
    var A = bonds(a), Bd = bonds(b);
    var keys = Object.keys(A).concat(Object.keys(Bd));
    return keys.every(function(k){ return A[k] === Bd[k]; });
  }
  function normKey(k){ var m = /^bond:(.+?)-(.+)$/.exec(k); return m ? 'bond:' + [m[1], m[2]].sort().join('-') : k; }
  function sameArrow(a, b){ return normKey(a.from) === normKey(b.from) && normKey(a.to) === normKey(b.to); }

  window.OchemArrowChallenge = { CHALLENGES: CHALLENGES, sameStructure: sameStructure };

  /* Apply arrows. An arrow may carry `end`: the atom of a π bond that makes the new bond when the bond attacks an
     outside atom (the end the student grabbed). chem-core picks the end nearer the target, so the target is moved
     next to that end for the sum only; every atom keeps its own place in the result. */
  function applyArrows(st, arrows){
    var use = st, moved = false;
    arrows.forEach(function(ar){
      if(!ar.end || !C.isBondKey(ar.from) || C.isBondKey(ar.to)) return;
      var bk = C.parseBondKey(ar.from);
      if(ar.to === bk.a || ar.to === bk.b || (ar.end !== bk.a && ar.end !== bk.b)) return;
      if(!moved){ use = C.clone(st); moved = true; }
      var e = use.atoms[ar.end], o = use.atoms[ar.end === bk.a ? bk.b : bk.a];
      use.atoms[ar.to].x = e.x + (e.x - o.x) * 0.05; use.atoms[ar.to].y = e.y + (e.y - o.y) * 0.05;
    });
    var r = C.apply(use, arrows);
    if(moved){ Object.keys(st.atoms).forEach(function(k){ if(r.structure.atoms[k]){ r.structure.atoms[k].x = st.atoms[k].x; r.structure.atoms[k].y = st.atoms[k].y; } }); }
    return r;
  }
  function errorsOf(r){ return r.issues.filter(function(i){ return i.level === 'error' || i.code === 'group-source'; }); }

  /* Could a held set of arrows (an atom past its octet) still become a real structure? The next arrow starts at a
     bond of an atom that is over, and sends that bond's pair to its other end or on into a bond beside it (a
     concerted step: SN2, E2, a proton transfer). Up to three more arrows, five in all. Returns the arrows to add. */
  function completion(st, arrows, depth){
    var r = applyArrows(st, arrows), errs = errorsOf(r);
    if(!errs.length) return [];
    if(depth <= 0 || arrows.length >= 5 || errs.some(function(e){ return e.code !== 'octet'; })) return null;
    var used = {}; arrows.forEach(function(a){ used[normKey(a.from)] = 1; });
    var cands = [];
    errs.forEach(function(e){
      var k = e.atom;
      C.bondsAt(st, k).forEach(function(b){
        if(b.order < 1) return;
        var key = 'bond:' + b.a + '-' + b.b;
        if(used[normKey(key)]) return;
        var m = b.a === k ? b.b : b.a;
        cands.push({ from: key, to: m });
        C.bondsAt(st, m).forEach(function(b2){ if(b2 === b || b2.order < 1) return; cands.push({ from: key, to: 'bond:' + b2.a + '-' + b2.b }); });
      });
    });
    for(var i = 0; i < cands.length; i++){
      var rest = completion(st, arrows.concat([cands[i]]), depth - 1);
      if(rest) return [cands[i]].concat(rest);
    }
    return null;
  }

  /* What one push does on top of the held ones: a step (a real structure), held (an atom over its octet that one
     to three more arrows can relieve) or reject (with the first error). */
  function outcome(st, arrows){
    var r = applyArrows(st, arrows), errs = errorsOf(r);
    if(!errs.length) return { kind: 'step', r: r };
    var octOnly = errs.every(function(e){ return e.code === 'octet'; });
    if(octOnly && arrows.length < 5 && completion(st, arrows, 3)) return { kind: 'held', r: r, over: errs.map(function(e){ return e.atom; }) };
    var e0 = errs.filter(function(e){ return e.code !== 'octet'; })[0] || errs[0];
    return { kind: 'reject', r: r, err: e0 };
  }

  /* Where the pieces go after a step. A piece is a set of atoms still held together by bonds that existed before
     the step and still exist; each piece moves as one (translation only). A new bond pulls its two pieces to a
     bond's length; a bond that broke lets its piece drift off until it is clear of the rest; nothing overlaps. The
     piece with the most heavy atoms stays put. A sketch, not geometry: no angles change (SN2's inversion is not
     drawn), and "?" says so. */
  function bondLen(st){
    var bl = st.bonds.filter(function(b){ var x = st.atoms[b.a], y = st.atoms[b.b]; return b.order > 0 && x.el !== 'H' && y.el !== 'H'; })
      .map(function(b){ var x = st.atoms[b.a], y = st.atoms[b.b]; return Math.hypot(x.x - y.x, x.y - y.y); }).sort(function(a, b){ return a - b; });
    return bl.length ? bl[Math.floor(bl.length / 2)] : 60;
  }
  function piecesOf(prev, next){
    var up = {};
    function find(k){ while(up[k] !== k){ up[k] = up[up[k]]; k = up[k]; } return k; }
    Object.keys(next.atoms).forEach(function(k){ up[k] = k; });
    next.bonds.forEach(function(b){
      if(b.order < 1) return;
      var o = C.findBond(prev, b.a, b.b);
      if(o && o.order >= 1){ var x = find(b.a), y = find(b.b); if(x !== y) up[x] = y; }
    });
    var ids = {}, n = 0, out = {};
    Object.keys(next.atoms).forEach(function(k){ var r = find(k); if(ids[r] == null) ids[r] = n++; out[k] = ids[r]; });
    return out;
  }
  function relax(prev, next){
    var pc = piecesOf(prev, next), keys = Object.keys(next.atoms), Lb = bondLen(prev);
    var pos = {}; keys.forEach(function(k){ pos[k] = { x: prev.atoms[k].x, y: prev.atoms[k].y }; });
    var frag = {}; C.fragments(next).forEach(function(f, i){ f.forEach(function(k){ frag[k] = i; }); });
    var np = 0, heavyN = {}, count = {};
    keys.forEach(function(k){ var p = pc[k]; np = Math.max(np, p + 1); count[p] = (count[p] || 0) + 1; if(next.atoms[k].el !== 'H') heavyN[p] = (heavyN[p] || 0) + 1; });
    if(np < 2) return pos;
    var anchor = 0;
    for(var p = 1; p < np; p++){ if((heavyN[p] || 0) > (heavyN[anchor] || 0) || ((heavyN[p] || 0) === (heavyN[anchor] || 0) && count[p] > count[anchor])) anchor = p; }
    var links = next.bonds.filter(function(b){ return b.order >= 1 && pc[b.a] !== pc[b.b]; });
    for(var it = 0; it < 160; it++){
      var dx = {}, dy = {}, w = {};
      for(var q = 0; q < np; q++){ dx[q] = 0; dy[q] = 0; w[q] = 0; }
      function push(pa, pb, ux, uy, amt){
        var fa = pa === anchor ? 0 : pb === anchor ? 1 : 0.5, fb = pb === anchor ? 0 : pa === anchor ? 1 : 0.5;
        dx[pa] -= ux * amt * fa; dy[pa] -= uy * amt * fa; w[pa]++;
        dx[pb] += ux * amt * fb; dy[pb] += uy * amt * fb; w[pb]++;
      }
      links.forEach(function(b){
        var a = pos[b.a], z = pos[b.b], vx = z.x - a.x, vy = z.y - a.y, d = Math.hypot(vx, vy) || 0.01;
        var hasH = next.atoms[b.a].el === 'H' || next.atoms[b.b].el === 'H', want = hasH ? Lb * 0.72 : Lb;
        push(pc[b.a], pc[b.b], vx / d, vy / d, -(d - want));
      });
      for(var i = 0; i < keys.length; i++) for(var j = i + 1; j < keys.length; j++){
        var ka = keys[i], kb = keys[j];
        var bb = C.findBond(next, ka, kb);
        if(pc[ka] === pc[kb] || (bb && bb.order > 0)) continue;
        var A = pos[ka], Z = pos[kb], vx2 = Z.x - A.x, vy2 = Z.y - A.y, d2 = Math.hypot(vx2, vy2) || 0.01;
        var hh = (next.atoms[ka].el === 'H') + (next.atoms[kb].el === 'H');
        var min = frag[ka] === frag[kb] ? Lb * (hh ? 0.7 : 0.9) : Lb * (hh === 2 ? 1.0 : hh ? 1.2 : 1.45);
        // the two atoms of a bond that broke: the leaving group goes clearly away
        var was = C.findBond(prev, ka, kb);
        if(was && was.order >= 1 && frag[ka] !== frag[kb]) min = Math.max(min, Lb * 1.9);
        if(d2 < min) push(pc[ka], pc[kb], vx2 / d2, vy2 / d2, min - d2);
      }
      var moved = 0;
      for(var r = 0; r < np; r++){
        if(r === anchor || !w[r]) continue;
        var mx = dx[r] * 0.5, my = dy[r] * 0.5;
        moved = Math.max(moved, Math.abs(mx) + Math.abs(my));
        keys.forEach(function(k){ if(pc[k] === r){ pos[k].x += mx; pos[k].y += my; } });
      }
      if(moved < 0.05) break;
    }
    return pos;
  }
  function withPos(st, pos){ var o = C.clone(st); Object.keys(pos).forEach(function(k){ if(o.atoms[k]){ o.atoms[k].x = pos[k].x; o.atoms[k].y = pos[k].y; } }); return o; }
  // the next state after a real step: the structure, its pieces moved
  function stepTo(st, arrows){
    var r = applyArrows(st, arrows);
    return withPos(r.structure, relax(st, r.structure));
  }

  /* The states of a mechanism, from its textbook arrows. */
  function pathOf(m){
    var st = startOf(m.id), out = [{ st: st, name: m.names[0], tag: m.tags[0] }];
    m.steps.forEach(function(s, i){ st = stepTo(st, arrowsOf(s)); out.push({ st: st, name: m.names[i + 1], tag: m.tags[i + 1], arrows: arrowsOf(s) }); });
    return out;
  }

  /* ---- Legal, but (the old tool's middle category, kept): everything here IS a legal arrow, and the tool says so
     first. The valence checks answer "could these electrons have moved"; these answer "would they". short: the cause
     line's pill; text: the full sentence (Any molecule's notes, screen readers). */
  function plausibility(before, after){
    var notes = [];
    function carbonNeighbours(st, k){
      return C.neighbors(st, k).filter(function(n){ var a = st.atoms[n]; return a && (a.el === 'C' || (a.group && C.anchorElement(a.label) === 'C')); }).length;
    }
    Object.keys(after.atoms).forEach(function(k){
      var b = before.atoms[k], a = after.atoms[k];
      if(!b || !a || a.el !== 'C') return;
      var was = C.formalCharge(before, k), now = C.formalCharge(after, k);
      if(now === 1 && was !== 1){
        var subst = carbonNeighbours(after, k);
        if(subst <= 1){
          notes.push(subst === 0
            ? { short: 'CH₃⁺: too unstable', pill: true, text: 'That makes a methyl cation. Nothing stabilizes it at all, and it is high enough in energy that reactions simply take another route, which is why there is no SN1 on a methyl halide.' }
            : { short: '1° C⁺: rarely forms', pill: true, text: 'That makes a PRIMARY carbocation. It breaks no rule, but only one alkyl group is donating toward it and the barrier is high enough that primary substrates essentially never ionize. If a mechanism needs this, the mechanism is usually wrong.' });
        } else if(subst === 2){
          notes.push({ short: '2° C⁺: borderline', text: 'A secondary carbocation: real, but borderline. Whether it forms depends on the solvent and what else is available; a strong nucleophile will usually reach the carbon before it ever ionizes.' });
        }
      }
      if(now === -1 && was !== -1){
        // A carbanion next to a pi system or an electronegative atom is an enolate or similar and perfectly ordinary.
        var propped = C.neighbors(after, k).some(function(n){
          var nb = after.atoms[n];
          if(!nb) return false;
          if(nb.el && nb.el !== 'C' && nb.el !== 'H') return true;
          var bond = C.findBond(after, k, n);
          return bond && bond.order > 1;
        });
        if(!propped) notes.push({ short: 'Bare C⁻: very basic', pill: true, text: 'That leaves a negative charge on a carbon with nothing next to it to share the load: no carbonyl, no pi system, no electronegative neighbor. Carbon is the worst of the common atoms at holding a negative charge, so this is a very basic, very reactive species.' });
      }
    });
    /* A fragment that has just left. A leaving group is only as good as its conjugate acid is strong, and hydroxide
       leaving is the single most common wrong arrow in the course. */
    var beforeFrags = C.fragments(before).length, afterFrags = C.fragments(after);
    if(afterFrags.length > beforeFrags){
      afterFrags.forEach(function(f){
        if(f.length > 2) return;
        var el = f.map(function(k){ return after.atoms[k]; }).filter(function(a){ return a && a.el && a.el !== 'H'; })[0];
        if(!el) return;
        var q = f.reduce(function(n, k){ return n + C.formalCharge(after, k); }, 0);
        if(q >= 0) return;
        if(el.el === 'O') notes.push({ short: 'O⁻ leaving: poor', pill: true, text: 'Something left as an oxygen anion: hydroxide or an alkoxide. Those are strong bases, which makes them poor leaving groups: in practice the OH is protonated to water first, and water leaves instead.' });
        else if(el.el === 'N') notes.push({ short: 'N⁻ leaving: very poor', pill: true, text: 'An amide anion leaving is worse still: nitrogen holds a negative charge less comfortably than oxygen, so an amine leaves only after it has been protonated or otherwise turned into something stable.' });
        else if(el.el === 'C') notes.push({ short: 'C⁻ leaving: unheard of', pill: true, text: 'A carbanion leaving group is essentially unheard of outside a few specific reactions. Carbon is the worst of the common atoms at carrying the charge it would have to take with it.' });
      });
    }
    return notes;
  }

  // the engine's sentences use dashes as punctuation; the page does not
  function undash(t){ return String(t).replace(/\s+—\s+/g, ', ').replace(/—/g, ', '); }
  function upper1(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function elOf(st, k){ var a = st.atoms[k]; return a ? (a.group ? a.label : a.el) : '?'; }

  /* A short name for one arrow (the cause line): "New O–C bond", "C–Br breaks", "C=O π → O", "C=C attacks H". */
  function moveWord(st, ar){
    var d = C.deltaFor(st, ar), f = ar.from, t = ar.to;
    if(!d.ok) return 'Pair moved';
    if(d.kind === 'lp-to-atom') return C.findBond(st, f, t) ? elOf(st, f) + '=' + elOf(st, t) + ' forms' : 'New ' + elOf(st, f) + '–' + elOf(st, t) + ' bond';
    if(d.kind === 'lp-to-bond'){ var tb = C.parseBondKey(t), o = tb.a === f ? tb.b : tb.a; return elOf(st, f) + '=' + elOf(st, o) + ' forms'; }
    var fb = C.parseBondKey(f), b0 = C.findBond(st, fb.a, fb.b), dbl = b0 && b0.order > 1, nm = elOf(st, fb.a) + (dbl ? '=' : '–') + elOf(st, fb.b);
    if(d.kind === 'heterolysis') return dbl ? nm + ' π → ' + elOf(st, t) : nm + ' breaks';
    if(d.kind === 'pi-attack') return nm + ' attacks ' + elOf(st, t);
    var b2 = C.parseBondKey(t), sh = fb.a === b2.a || fb.a === b2.b ? fb.a : fb.b, other = b2.a === sh ? b2.b : b2.a;
    return nm + ' → ' + elOf(st, sh) + '=' + elOf(st, other);
  }
  function chargedOf(st){ return Object.keys(st.atoms).filter(function(k){ var a = st.atoms[k]; return a.el && !a.group && C.formalCharge(st, k) !== 0; }).map(function(k){ return { k: k, el: st.atoms[k].el, q: C.formalCharge(st, k) }; }); }
  function sgn(q){ return q < 0 ? (q === -1 ? '−' : -q + '−') : (q === 1 ? '+' : q + '+'); }
  function whereQ(st, hide){
    var cs = chargedOf(st).filter(function(c){ return !hide || hide.indexOf(c.k) < 0; });
    if(!cs.length) return null;
    var by = {};
    cs.forEach(function(c){ var t = sgn(c.q) + ' on '; by[t] = by[t] || []; by[t].push(c.el); });
    return Object.keys(by).map(function(t){ var els = by[t]; return t + (els.length > 1 && els.every(function(x){ return x === els[0]; }) ? els.length + ' ' + els[0] : els.join(', ')); }).join(', ');
  }
  function speciesOf(st){ return C.fragments(st).map(function(f){ return C.formula(st, f); }); }

  window.OchemArrowModel = { MECHS: MECHS, GROUPS: GROUPS, startOf: startOf, applyArrows: applyArrows, outcome: outcome, completion: completion,
    relax: relax, stepTo: stepTo, pathOf: pathOf, piecesOf: piecesOf, plausibility: plausibility, moveWord: moveWord, sameStructure: sameStructure,
    arrowsOf: arrowsOf, speciesOf: speciesOf, bondLen: bondLen };

  /* ====================================================================== */
  /* Check yourself (the old quiz, unchanged: slug arrow-pusher, ids "<molecule>:fc:<atom>" and ":ec:")       */
  /* ====================================================================== */
  /* The sandbox tells you when an arrow could not have happened. What it cannot tell you is whether you could have
     SEEN that before drawing it, which is the skill being built, so the quiz asks about electron bookkeeping on a
     structure, before any arrow is drawn. Formal charge and electron count both come from chem-core, the same two
     functions the board uses to decide that an arrow blew an octet: the checker, asked in advance. */
  function mountQuiz(){
    if(!window.OchemToolQuiz) return;
    /* Only atoms worth asking about: a hydrogen has one bond and no story, and a carbon in the middle of a chain has
       the same answer every time. */
    function interesting(st){
      return Object.keys(st.atoms).filter(function(k){
        var a = st.atoms[k];
        if(!a.el || a.el === 'H' || a.group) return false;
        return a.lp > 0 || C.formalCharge(st, k) !== 0 || a.el !== 'C';
      });
    }
    var QUIZ_MOLS = [];
    ['water','ammonia','acetate-ion','acetic-acid','acetone','formaldehyde','acetaldehyde',
     'acetamide','methyl-acetate','acetyl-chloride','ethylamine','sn2-bromoethane',
     'sn1-secondary','propylene-oxide','benzene','ammonium'].forEach(function(id){
      var m = Mol.get(id);
      if(!m) return;
      var st = C.fromMolecule(m);
      var keys = interesting(st);
      if(keys.length) QUIZ_MOLS.push({ id:id, name:m.name, formula:m.formula, st:st, keys:keys });
    });
    if(!QUIZ_MOLS.length) return;
    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'arrow-pusher',
      rounds: 6,
      intro: 'Formal charge and octets: the bookkeeping that decides whether an arrow is legal.',
      make: function(recent){
        /* `recent` holds full question ids ("acetone:fc:o"), so compare against the prefix. */
        var pool = QUIZ_MOLS.filter(function(m){
          return !recent.some(function(r){ return r.indexOf(m.id + ':') === 0; });
        });
        if(!pool.length) pool = QUIZ_MOLS;
        var m = pool[Math.floor(Math.random() * pool.length)];
        var key = m.keys[Math.floor(Math.random() * m.keys.length)];
        var atom = m.st.atoms[key];
        var el = atom.el;
        if(Math.random() < 0.5){
          var fc = C.formalCharge(m.st, key);
          var fcOpts = [fc];
          [fc + 1, fc - 1, fc + 2].forEach(function(v){ if(fcOpts.indexOf(v) < 0 && fcOpts.length < 4) fcOpts.push(v); });
          return {
            id: m.id + ':fc:' + key,
            term: 'formal-charge', topic: 'formal-charge',
            prompt: 'In <b>' + esc(m.name) + '</b>' +
                    (m.formula ? ' (<span class="tformula">' + esc(m.formula) + '</span>)' : '') +
                    ', the ' + esc(el) + ' has ' + C.totalBonds(m.st, key) + ' bond' +
                    (C.totalBonds(m.st, key) === 1 ? '' : 's') + ' and ' + atom.lp +
                    ' lone pair' + (atom.lp === 1 ? '' : 's') + '. What is its <b>formal charge</b>?',
            options: fcOpts.map(function(v){ return { id:String(v), label: v > 0 ? '+' + v : String(v), correct: v === fc }; }),
            explain: '<b>' + (fc > 0 ? '+' + fc : fc) + '</b>. Formal charge is the group number minus ' +
                     'what the atom is holding: ' + C.info(el).valence + ' valence electrons for ' + el +
                     ', minus ' + (atom.lp * 2) + ' in lone pairs, minus ' + C.totalBonds(m.st, key) +
                     ' for its share of the bonds. Every arrow you draw changes one of those two ' +
                     'numbers, which is why the charges move when the arrows do.'
          };
        }
        var ec = C.electronCount(m.st, key);
        var ecOpts = [ec];
        [ec + 2, ec - 2, ec + 4].forEach(function(v){ if(v >= 0 && ecOpts.indexOf(v) < 0 && ecOpts.length < 4) ecOpts.push(v); });
        return {
          id: m.id + ':ec:' + key,
          term: 'octet-rule', topic: 'lewis-structures',
          prompt: 'How many electrons surround the <b>' + esc(el) + '</b> in <b>' + esc(m.name) +
                  '</b>, counting both electrons of every bond it makes?',
          options: ecOpts.map(function(v){ return { id:String(v), label:String(v), correct: v === ec }; }),
          explain: '<b>' + ec + '</b>: ' + (atom.lp * 2) + ' from ' + atom.lp + ' lone pair' +
                   (atom.lp === 1 ? '' : 's') + ' and ' + (C.totalBonds(m.st, key) * 2) +
                   ' from ' + C.totalBonds(m.st, key) + ' bond' + (C.totalBonds(m.st, key) === 1 ? '' : 's') +
                   '. ' + (ec > C.octetOf(m.st, key)
                     ? 'That is past what this atom can hold, which is exactly the state an illegal arrow leaves behind.'
                     : ec === 8
                       ? 'A full octet. An arrow pointing another pair at this atom has nowhere to put it: that is the error the board catches.'
                       : 'Short of an octet, so this atom can still accept a pair. That is what makes it an electrophile.')
        };
      }
    });
  }

  /* ====================================================================== */
  /* The page                                                                */
  /* ====================================================================== */
  var K = window.LevlKit2, studio = window.OchemStudio || null, Kit = window.OchemStudioKit, PB = window.OchemPushBoard;
  if(!K || !studio || !Kit || !Kit.kit2 || !PB){
    mountQuiz();
    if(root.insertAdjacentHTML) root.insertAdjacentHTML('beforeend', '<p class="tnote tnote--info">This tool needs a newer copy of the page. Reload to get it.</p>');
    return;
  }
  var f1 = PB.f1, draw = PB.draw, fitT = PB.fitT, labelOf = PB.labelOf, anchorOf = PB.anchorOf, ease = PB.ease;
  function mk(tag, cls, html){ var d = document.createElement(tag); if(cls) d.className = cls; if(html != null) d.innerHTML = html; return d; }
  function byId(id){ return document.getElementById(id); }

  /* ---- state: one board per place (Explore, each Test yourself part), so leaving one and coming back finds it as
     it was, and nothing from one shows in another */
  function blank(ctx){ return { ctx: ctx, id: null, name: '', start: null, cur: null, pending: [], pendingSt: null, hist: [], row: [], took: false, lastWhy: null, notes: [], reached: 0 }; }
  var boards = { explore: blank('explore'), any: blank('any'), chal: blank('chal') };
  var S = boards.explore;
  var MODE = { mode: 'explore', part: null };
  var chal = { def: null, i: 0, wrong: 0, verdict: null, shown: 0, states: [], marks: null, showTarget: false };
  var built = null;   // a molecule from Build your own: { st, name, text }

  /* ---- the stage */
  var stage = mk('div', 'ap2 pb2');
  var head = K.head({ purpose: 'Push electrons: bonds break and form, step by step.', how: { label:'Show me how', onClick: function(){ startTour(); } } });
  stage.appendChild(head.el);
  var sceneBox = mk('div', 'ap2-scene');
  sceneBox.innerHTML = '<svg class="ap2-svg" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep" aria-hidden="true"><defs>' + PB.defs() + '</defs>' +
    '<g class="rs2-bgs"></g><g class="rs2-strip"></g><g class="rs2-mainA"></g><g class="rs2-mainB"></g>' +
    '<g class="rs2-arrows"></g><g class="rs2-fly"></g><g class="rs2-ui"></g></svg><div class="rs2-labs" aria-hidden="true"></div>';
  stage.appendChild(sceneBox);
  var svg = sceneBox.querySelector('svg');
  var G = {};
  ['bgs', 'strip', 'mainA', 'mainB', 'arrows', 'fly', 'ui'].forEach(function(n){ G[n] = svg.querySelector('.rs2-' + n); });
  var labsEl = sceneBox.querySelector('.rs2-labs'), layer = K.layer(sceneBox);
  // the molecule itself is the control: one focusable element over it (keys and screen readers), pointer on it
  var hit = mk('div', 'rs2-hit');
  hit.tabIndex = 0; hit.setAttribute('role', 'application');
  hit.setAttribute('aria-roledescription', 'electron pushing board');
  layer.el.appendChild(hit);
  // the picker and Undo, quiet, on the picture
  var pick = mk('label', 'rs2-pick', '<span>Mechanism</span><select aria-label="Mechanism"></select>');
  layer.el.appendChild(pick);
  var sel = pick.querySelector('select');
  var undoBtn = mk('button', 'rs2-undo', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg><span>Undo</span>');
  undoBtn.type = 'button'; undoBtn.setAttribute('aria-label', 'Undo the last push');
  layer.el.appendChild(undoBtn);
  // the steps row: one button per state (a tap plays the arrows that reach it)
  var thumbsEl = mk('div', 'ap2-thumbs'); layer.el.appendChild(thumbsEl);
  var lines = mk('div', 'ap2-lines');
  var cause = K.cause({ label:'Why' });
  lines.appendChild(cause.el);
  stage.appendChild(lines);
  var live = mk('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite');
  stage.appendChild(live);
  function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

  var mainT = null, mainA = null;
  function shown(){ return S.pendingSt || S.cur; }
  function over(st){ return Object.keys(st.atoms).filter(function(k){ var a = st.atoms[k]; return a.el && !a.group && C.electronCount(st, k) > C.octetOf(st, k); }); }
  var B = PB.board({ svg: svg, G: G, labsEl: labsEl, waitEls: [labsEl, cause.el], reduced: K.reduced, calm: [G.mainA, G.strip, labsEl],
    T: function(){ return mainT; }, A: function(){ return mainA; }, shown: function(){ return V(shown()); }, noCharge: function(st){ return over(st); } });

  function picksHtml(){
    function opt(v, l){ return '<option value="' + esc(v) + '">' + esc(l) + '</option>'; }
    if(S.ctx === 'explore') return MECHS.map(function(m){ return opt(m.id, m.label); }).join('');
    if(S.ctx === 'chal') return CHALLENGES.map(function(c){ return opt(c.id, c.label + (c.steps.length > 1 ? ', ' + c.steps.length + ' steps' : '')); }).join('');
    return GROUPS.map(function(g){ return '<optgroup label="' + esc(g.label) + '">' + g.picks.map(function(p){ return opt(p.id, p.label); }).join('') + '</optgroup>'; }).join('') +
      (built ? '<optgroup label="Yours">' + opt('__built', built.name) + '</optgroup>' : '');
  }
  function syncPicker(){
    var lab = S.ctx === 'explore' ? 'Mechanism' : S.ctx === 'chal' ? 'Challenge' : 'Molecule';
    pick.querySelector('span').textContent = lab; sel.setAttribute('aria-label', lab);
    sel.innerHTML = picksHtml();
    sel.value = S.id || '';
  }

  /* ====================================================================== */
  /* Layout                                                                  */
  /* ====================================================================== */
  var L = null;
  function layout(){
    var W = Math.max(280, sceneBox.clientWidth), H = Math.max(300, sceneBox.clientHeight);
    var phone = W < 641, wide = W >= 700, top = phone ? 52 : 60, pad = phone ? 8 : 14;
    var stripH = wide ? Math.max(140, Math.min(184, H * 0.28)) : 156;
    return { W: W, H: H, phone: phone, wide: wide, top: top, pad: pad,
      strip: { x: pad, y: H - stripH, w: W - pad * 2, h: stripH - pad },
      main: { x: pad, y: top, w: W - pad * 2, h: H - top - stripH - 6 } };
  }
  /* The board's transform: every state this board has shown or will show fits, so the scale holds still while the
     pieces move. */
  /* On a phone a wide scene (two molecules side by side) is turned a quarter turn, so it fills the tall board instead of
     a thin band of it: V(st) is the structure as drawn (the same atoms, bonds and keys; only the places turned). */
  var vmemo = new WeakMap();
  function V(st){
    if(!st || !L || !L.rot) return st;
    var m = vmemo.get(st); if(m) return m;
    m = C.clone(st); Object.keys(m.atoms).forEach(function(k){ var a = st.atoms[k]; m.atoms[k].x = -a.y; m.atoms[k].y = a.x; });
    vmemo.set(st, m); return m;
  }
  function moveE(a, b, arrows, o, done){ B.moveElectrons(V(a), V(b), arrows, o, done); }
  function allAtoms(){
    var ex = [];
    S.row.forEach(function(r){ if(r.st) Object.keys(r.st.atoms).forEach(function(k){ ex.push(r.st.atoms[k]); }); });
    [S.cur, S.pendingSt].forEach(function(st){ if(st) Object.keys(st.atoms).forEach(function(k){ ex.push(st.atoms[k]); }); });
    S.hist.forEach(function(h){ Object.keys(h.cur.atoms).forEach(function(k){ ex.push(h.cur.atoms[k]); }); });
    return ex;
  }
  function decideRot(){
    if(!L.phone || !S.start) return false;
    var ex = allAtoms(), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    ex.forEach(function(a){ x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y); });
    var m = 70, w = x1 - x0 + m, h = y1 - y0 + m;
    return Math.min(L.main.w / h, L.main.h / w) > Math.min(L.main.w / w, L.main.h / h) * 1.3;
  }
  function boardT(){
    var ex = [];
    allAtoms().forEach(function(a){ ex.push(L.rot ? { x: -a.y, y: a.x } : a); });
    var cap = L.phone ? 1.55 : Math.min(3.2, 2.4 * Math.max(1, L.main.h / 460));
    return fitT(V(S.start), L.main, { cap: cap, margin: L.phone ? 26 : 34, extra: ex });
  }

  /* ====================================================================== */
  /* Painting                                                                */
  /* ====================================================================== */
  function paintBg(){
    var o = L, h = '<rect class="rs2-bg" x="0" y="0" width="' + o.W + '" height="' + o.H + '" fill="url(#rs2g-bg)"/>';
    h += '<ellipse class="rs2-spot" cx="' + f1(o.main.x + o.main.w / 2) + '" cy="' + f1(o.main.y + o.main.h / 2) + '" rx="' + f1(o.main.w * 0.55) + '" ry="' + f1(o.main.h * 0.58) + '" fill="url(#rs2g-spot)"/>';
    h += '<rect class="rs2-tray" x="0" y="' + f1(o.strip.y - 4) + '" width="' + o.W + '" height="' + f1(o.H - o.strip.y + 4) + '" fill="url(#rs2g-tray)"/>' +
      '<line class="rs2-trayedge" x1="0" y1="' + f1(o.strip.y - 4) + '" x2="' + o.W + '" y2="' + f1(o.strip.y - 4) + '"/>';
    G.bgs.innerHTML = h;
  }
  function paintMain(){
    var st = shown();
    if(!st){ G.mainA.innerHTML = ''; G.mainB.innerHTML = ''; mainA = null; return; }
    mainT = boardT();
    var noQ = {}; over(st).forEach(function(k){ noQ[k] = 1; });
    var d = draw(V(st), mainT, { noCharge: noQ });
    G.mainA.innerHTML = d.html; G.mainA.style.opacity = '1'; G.mainA.removeAttribute('transform');
    G.mainB.innerHTML = ''; mainA = d.A;
    var marks = S.ctx === 'chal' && chal.marks ? chal.marks : null;
    G.arrows.innerHTML = S.pending.map(function(ar, i){ return B.arrowHtml(ar, d.A, 'is-held' + (marks && marks.indexOf(i) >= 0 ? ' is-bad' : '')); }).join('');
    // problems drawn on the atom: an amber ring and the count
    var ring = '';
    over(st).forEach(function(k){ var p = d.A.atoms[k]; ring += '<circle class="rs2-oct" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(p.r + 4) + '"/>'; });
    G.ui.innerHTML = ring;
  }

  /* The steps row: each state as a small drawing on a card, in order, an arrow between them. */
  var thumbBoxes = [];
  function rowNow(){
    // which card the board is on (by structure), or -1
    if(S.pendingSt || !S.cur) return -1;
    for(var i = S.row.length - 1; i >= 0; i--) if(S.row[i].st && sameStructure(S.row[i].st, S.cur)) return i;
    return -1;
  }
  /* A card's drawing: the species as on the board, or, when that is much wider than the card, stacked one above the
     other (left one on top), so a small card still shows each one at a readable size. */
  function cardSt(st, box){
    var fr = C.fragments(st).map(function(f){ return f.filter(function(k){ return st.atoms[k].el !== 'H' || f.length < 3; }); }).filter(function(f){ return f.length; });
    if(fr.length < 2) return st;
    function bb(keys){ var o = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }; keys.forEach(function(k){ var a = st.atoms[k]; o.x0 = Math.min(o.x0, a.x); o.x1 = Math.max(o.x1, a.x); o.y0 = Math.min(o.y0, a.y); o.y1 = Math.max(o.y1, a.y); }); return o; }
    var all = bb([].concat.apply([], fr)), gap = 40, m = 36;
    var boxes = fr.map(bb), sw = Math.max.apply(null, boxes.map(function(b){ return b.x1 - b.x0; })), sh = boxes.reduce(function(t, b){ return t + b.y1 - b.y0; }, 0) + gap * (fr.length - 1);
    var keep = Math.min(box.w / (all.x1 - all.x0 + m), box.h / (all.y1 - all.y0 + m)), stack = Math.min(box.w / (sw + m), box.h / (sh + m));
    if(stack < keep * 1.25) return st;
    var o = C.clone(st), y = 0, order = fr.map(function(f, i){ return i; }).sort(function(a, b){ return boxes[a].x0 - boxes[b].x0; });
    var full = C.fragments(st);
    order.forEach(function(i){
      var b = boxes[i], dx = -(b.x0 + b.x1) / 2, dy = y - b.y0;
      full[i].forEach(function(k){ o.atoms[k].x = st.atoms[k].x + dx; o.atoms[k].y = st.atoms[k].y + dy; });
      y += b.y1 - b.y0 + gap;
    });
    return o;
  }
  function paintStrip(){
    thumbBoxes = [];
    var n = S.row.length, gap = L.phone ? 14 : 30, st = L.strip, headH = L.phone ? 16 : 22, tagH = L.phone ? 19 : 24;
    if(!n){ G.strip.innerHTML = ''; thumbsEl.innerHTML = ''; return; }
    var w = Math.min(L.phone ? 150 : 230, (st.w - gap * (n - 1)) / n), x0 = st.x + (st.w - (w * n + gap * (n - 1))) / 2;
    var now = rowNow(), h = '', btn = '';
    S.row.forEach(function(r, i){
      var bx = x0 + i * (w + gap), by = st.y + headH, bh = st.h - headH, on = i === now;
      var hid = !r.st || r.hidden;
      var room = { x: bx + 2, y: by + 2, w: w - 4, h: bh - 6 - tagH }, pad = L.phone ? 3 : 6;
      var inner = { x: room.x + pad, y: room.y + pad, w: room.w - pad * 2, h: room.h - pad * 2 };
      h += '<rect class="rs2-thumb' + (on ? ' is-on' : '') + (hid ? ' is-hid' : '') + '" x="' + f1(bx) + '" y="' + f1(by) + '" width="' + f1(w) + '" height="' + f1(bh) + '" rx="12"/>';
      if(hid) h += '<text class="rs2-q" x="' + f1(bx + w / 2) + '" y="' + f1(by + (bh - tagH) / 2 + 10) + '" font-size="26" text-anchor="middle">?</text>';
      else { var fs = cardSt(r.st, inner); h += PB.drawFlat(fs, PB.fitFlat(fs, fs, inner, { cap: 1.0 }), room); }
      if(i < n - 1){
        var ax = bx + w + 4, ay = by + (bh - tagH) / 2, al = gap - 8;
        h += '<path class="ap2-next" d="M' + f1(ax) + ' ' + f1(ay) + 'h' + f1(al - 5) + '"/><path class="ap2-nexth" d="M' + f1(ax + al) + ' ' + f1(ay) + 'l-6 -4.5v9z"/>';
      }
      thumbBoxes.push({ x: bx, y: by, w: w, h: bh, r: r, i: i, hid: hid, on: on });
      var what = (hid ? 'Step ' + i + ', not reached yet' : r.name + ' (' + r.tag + ')' + (on ? ', shown now' : '')) + '. ' + (hid ? '' : speciesOf(r.st).join(' + '));
      btn += '<button type="button" class="rs2-tb" data-i="' + i + '" style="left:' + f1(bx) + 'px;top:' + f1(by) + 'px;width:' + f1(w) + 'px;height:' + f1(bh) + 'px"' +
        (hid ? ' disabled' : '') + ' aria-label="' + esc(what) + '"' + (on ? ' aria-current="true"' : '') + '></button>';
    });
    G.strip.innerHTML = h;
    thumbsEl.innerHTML = btn;
  }

  /* Names on the picture, placed after the picture: the row's heading and tags; on the board, the roles at the start
     (nucleophile, electrophile, leaving group), each species once a step has split or joined them, an atom's count
     when it is over its octet. Each goes in the first spot clear of every ball, badge, name and control. */
  var ROLE = { 'nucleophile': 'Nucleophile', 'electrophile': 'Electrophile', 'leaving-group': 'Leaving group', 'pi-nucleophile': 'Nucleophile', 'acidic-h': 'Acidic H' };
  var labs = [];
  function boardNames(){
    var st = shown(), out = [];
    if(!st || !mainA) return out;
    if(S.pendingSt){
      over(st).forEach(function(k){ out.push({ t: C.electronCount(st, k) + ' e⁻', cls: 'is-oct', atom: k }); });
      return out;
    }
    if(S.ctx !== 'chal' && rowNow() === 0 && Mol.get(S.id)){
      // the roles, from the molecule's own notes, on the atoms they name
      var mol = Mol.get(S.id), used = {}, own = S.ctx === 'explore' && S.mech && S.mech.roles;
      Object.keys(mol.atoms || {}).forEach(function(k){
        var t = own ? own[k] : ROLE[mol.atoms[k].role];
        if(!t || used[t] || !st.atoms[k]) return;
        used[t] = 1; out.push({ t: t, cls: 'is-role', atom: k });
      });
      return out;
    }
    var fr = C.fragments(st);
    if(fr.length > 1) fr.forEach(function(f){ out.push({ t: C.formula(st, f), cls: 'is-sp', frag: f }); });
    return out;
  }
  function placeLabels(){
    var out = [];
    out.push({ t: S.ctx === 'any' ? 'Your steps' : S.ctx === 'chal' ? 'Steps to the target' : 'Mechanism steps', cls: 'is-sub', x: L.strip.x + L.strip.w / 2, y: L.strip.y + (L.phone ? 7 : 10) });
    thumbBoxes.forEach(function(b){ out.push({ t: b.r.tag, cls: 'is-tag is-' + (b.r.tag === 'product' || b.r.tag === 'target' ? 'product' : b.r.tag === 'start' ? 'start' : 'inter') + (b.on ? ' is-on' : ''), x: b.x + b.w / 2, y: b.y + b.h - (L.phone ? 9 : 10) }); });
    var names = boardNames();
    labs = out.concat(names);
    labsEl.innerHTML = labs.map(function(l){ return '<span class="rs2-lab ' + l.cls + '"' + (l.x != null ? ' style="left:' + f1(l.x) + 'px;top:' + f1(l.y) + 'px"' : '') + '>' + esc(l.t) + '</span>'; }).join('');
    var els = labsEl.children;
    names.forEach(function(l, i){
      var e = els[out.length + i], tries = [];
      if(l.atom){
        var p = mainA.atoms[l.atom], angs = (p.free || []).slice();
        for(var a = 0; a < 12; a++) angs.push(-Math.PI / 2 + a * Math.PI / 6);
        [24, 36, 50, 66, 84, 104].forEach(function(d){ angs.forEach(function(g){ tries.push([p.x + Math.cos(g) * (p.r + d), p.y + Math.sin(g) * (p.r + d)]); }); });
      } else {
        var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        l.frag.forEach(function(k){ var p = mainA.atoms[k]; x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); y0 = Math.min(y0, p.y - p.r); y1 = Math.max(y1, p.y + p.r); });
        var cx = (x0 + x1) / 2;
        [18, 30, 44].forEach(function(d){ tries.push([cx, y1 + d], [cx, y0 - d]); });
        [0.5, 0.25, 0.75].forEach(function(f){ tries.push([x0 + (x1 - x0) * f, y1 + 20], [x0 + (x1 - x0) * f, y0 - 20]); });
        tries.push([x1 + 40, (y0 + y1) / 2], [x0 - 40, (y0 + y1) / 2]);
      }
      var ok = false;
      for(var t = 0; t < tries.length && !ok; t++){
        e.style.left = f1(tries[t][0]) + 'px'; e.style.top = f1(tries[t][1]) + 'px';
        ok = !labelHits(e);
      }
      if(!ok) e.hidden = true;     // no clear spot: the picture and the cause line still say it
    });
  }
  function labelHits(e){
    var r = e.getBoundingClientRect(), s = sceneBox.getBoundingClientRect(), g = 5;
    if(r.left < s.left + 2 || r.right > s.right - 2 || r.top < s.top + 2 || r.bottom > s.bottom - 2) return true;
    var lim = L.strip.y - 6 + s.top;
    if(r.bottom > lim) return true;
    var things = [].slice.call(svg.querySelectorAll('.rs2-mainA .rs2-ball, .rs2-mainA .rs2-badge circle, .rs2-mainA .rs2-e, .rs2-ui .rs2-oct, .rs2-arrows path')).concat([sel, undoBtn], [].slice.call(layer.el.querySelectorAll('.tk2-cue')));
    // the sticks too: a name never sits across a bond (sampled along each line, in the svg's own px)
    var sticks = svg.querySelectorAll('.rs2-mainA .rs2-sig, .rs2-mainA .rs2-pi');
    for(var i = 0; i < sticks.length; i++){
      var l = sticks[i], x1 = +l.getAttribute('x1') + s.left, y1 = +l.getAttribute('y1') + s.top, x2 = +l.getAttribute('x2') + s.left, y2 = +l.getAttribute('y2') + s.top;
      var n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 5));
      for(var j = 0; j <= n; j++){ var px = x1 + (x2 - x1) * j / n, py = y1 + (y2 - y1) * j / n; if(px > r.left - 3 && px < r.right + 3 && py > r.top - 3 && py < r.bottom + 3) return true; }
    }
    return things.some(function(b){ var q = b.getBoundingClientRect(); return !(q.right + g <= r.left || q.left >= r.right + g || q.bottom + g <= r.top || q.top >= r.bottom + g); }) ||
      [].some.call(labsEl.children, function(o){ if(o === e || o.hidden || !o.style.left) return false; var q = o.getBoundingClientRect(); return !(q.right + g <= r.left || q.left >= r.right + g || q.bottom + g <= r.top || q.top >= r.bottom + g); });
  }
  var drawn = false;
  function paintAll(){
    L = layout();
    L.rot = decideRot();
    svg.setAttribute('viewBox', '0 0 ' + L.W + ' ' + L.H);
    paintBg(); paintMain(); paintStrip();
    placeHit();
    placeLabels();
    undoBtn.disabled = !S.pending.length && !S.hist.length;
    drawn = true;
    view.L = L; view.A = mainA; view.S = S; view.T = mainT; view.labelHits = labelHits; view.placeLabels = placeLabels;
  }
  function placeHit(){
    var b = L.main;
    hit.style.left = f1(b.x) + 'px'; hit.style.top = f1(b.y) + 'px'; hit.style.width = f1(b.w) + 'px'; hit.style.height = f1(b.h) + 'px';
  }

  /* ====================================================================== */
  /* Motion: a real step, and a replay                                        */
  /* ====================================================================== */
  /* Every played change carries a run token. Anything that leaves or resets the picture (a mode switch, a new
     molecule, Undo, another replay, "?" over the stage on a phone) bumps it first, so a step cut short stops: the
     board keeps the last state it fully reached and the rest of a chain never starts. */
  var run = 0;
  function cancelRuns(){ run++; B.stopTween(); }

  /* After the electrons have moved (drawn at the old places), the pieces slide to their new places: a leaving group
     drifts off, a nucleophile comes in. Only the piece groups' transforms and the bonds between pieces change per
     frame. */
  function glide(prev, next, ms, done){
    prev = V(prev); next = V(next);
    var from = withPos(next, (function(){ var p = {}; Object.keys(next.atoms).forEach(function(k){ p[k] = { x: prev.atoms[k].x, y: prev.atoms[k].y }; }); return p; })());
    var pc = PB_pieces(prev, next), T = mainT;
    var still = Object.keys(next.atoms).every(function(k){ return Math.abs(next.atoms[k].x - prev.atoms[k].x) + Math.abs(next.atoms[k].y - prev.atoms[k].y) < 0.5; });
    if(still){ if(done) done(); return; }
    var noQ = {}; over(from).forEach(function(k){ noQ[k] = 1; });
    G.mainA.innerHTML = draw(from, T, { noCharge: noQ, pieces: pc }).html;
    G.mainA.style.opacity = '1';
    var delta = {}, groups = {};
    Object.keys(next.atoms).forEach(function(k){ var p = pc[k]; if(!delta[p]) delta[p] = { x: (next.atoms[k].x - prev.atoms[k].x) * T.s, y: (next.atoms[k].y - prev.atoms[k].y) * T.s }; });
    [].forEach.call(G.mainA.querySelectorAll('[data-p]'), function(g){ var p = g.getAttribute('data-p'); (groups[p] = groups[p] || []).push(g); });
    var links = [].map.call(G.mainA.querySelectorAll('[data-l]'), function(l){ var ab = l.getAttribute('data-l').split('|'); return { el: l, a: ab[0], b: ab[1] }; });
    function at(k, e){ var a = prev.atoms[k], z = next.atoms[k]; return PB.P(T, { x: a.x + (z.x - a.x) * e, y: a.y + (z.y - a.y) * e }); }
    B.tween(ms, function(f){
      var e = ease(f);
      Object.keys(groups).forEach(function(p){ var d = delta[p] || { x: 0, y: 0 }, tr = 'translate(' + f1(d.x * e) + ' ' + f1(d.y * e) + ')'; groups[p].forEach(function(g){ g.setAttribute('transform', tr); }); });
      links.forEach(function(l){ var a = at(l.a, e), z = at(l.b, e); l.el.setAttribute('x1', f1(a[0])); l.el.setAttribute('y1', f1(a[1])); l.el.setAttribute('x2', f1(z[0])); l.el.setAttribute('y2', f1(z[1])); });
    }, done);
  }
  function PB_pieces(prev, next){ return piecesOf(prev, next); }

  /* One real step on the board: the electrons along the arrows, then the pieces. o: { start, from, fresh } for a
     push the finger has just let go of (as in Resonance). */
  function playStep(prev, arrows, next, o, done){
    var my = run, mid = withPos(next, (function(){ var p = {}; Object.keys(next.atoms).forEach(function(k){ p[k] = { x: prev.atoms[k].x, y: prev.atoms[k].y }; }); return p; })());
    mainT = boardT();
    moveE(prev, mid, arrows, o || {}, function(){
      if(my !== run) return;
      glide(mid, next, 520, function(){ if(my !== run) return; if(done) done(); });
    });
  }

  /* ====================================================================== */
  /* What a push does                                                        */
  /* ====================================================================== */
  var RANK = { step: 0, ok: 0, held: 1, reject: 3 };
  function pushOutcome(arrows){
    if(S.ctx === 'chal'){
      // a challenge collects the step's arrows and checks them together; only an arrow that cannot start where it
      // starts, or cannot go where it goes, springs back at once
      var last = arrows[arrows.length - 1], src = C.checkSource(S.cur, last);
      if(src && (src.level === 'error' || src.code === 'group-source')) return { kind: 'reject', err: src };
      var d = C.deltaFor(S.cur, last);
      if(!d.ok) return { kind: 'reject', err: { code: d.reason, text: d.text } };
      if(arrows.length > 4) return { kind: 'reject', err: { code: 'too-many', text: 'Four arrows at most in one step.' } };
      return { kind: 'ok' };
    }
    return outcome(S.cur, arrows);
  }
  function judgeTarget(src, t){
    if(t.res) return t.res;
    t.res = pushOutcome(S.pending.concat([arrowFor(src, t)]));
    return t.res;
  }
  function arrowFor(src, t){
    var ar = { from: src.key || src, to: t.key };
    if(src.end) ar.end = src.end;
    if(src.sigma && C.isBondKey(ar.from)) ar.sigma = true;
    return ar;
  }

  function commit(src, t, dropPt, srcPt){
    var ar = arrowFor(src, t), res = judgeTarget(src, t), arrows = S.pending.concat([ar]);
    S.took = true; hideCue(true); tourTurn.did('push');
    if(res.kind === 'reject'){
      if(!G.arrows.querySelector('.is-drag')) G.arrows.insertAdjacentHTML('beforeend', '<g class="rs2-arrow is-drag">' + arrowPathHtml(B.curve(srcPt, { x: t.x, y: t.y })) + '</g>');
      S.lastWhy = undash(upper1(res.err.text || ''));
      B.springBack(dropPt, srcPt, function(){ paintAll(); words({ kind: 'reject', err: res.err, ar: ar }); });
      words({ kind: 'reject', err: res.err, ar: ar }, true);
      return;
    }
    var my = run;
    if(res.kind === 'held' || res.kind === 'ok'){
      var mid = res.kind === 'held' ? res.r.structure : null;
      if(res.kind === 'ok'){
        // a challenge: the arrow stays on the structure as drawn; nothing is applied until Check
        B.endDragVis();
        S.pending = arrows; chal.marks = null; chal.verdict = null;
        paintAll(); words({ kind: 'ok' }); chalPanel();
        return;
      }
      moveE(shown(), mid, arrows, { start: dropPt, from: srcPt, fresh: [ar], ms: 420 }, function(){
        if(my !== run) return;
        S.pending = arrows; S.pendingSt = mid; paintAll(); words({ kind: 'held' }); afterPush();
      });
      return;
    }
    // a real step
    var prev = S.cur, next = stepTo(prev, arrows);
    var now = matchRow(next);
    if(now >= 0) next = S.row[now].st;
    var from = shown();
    mainT = boardT();
    var midSt = withPos(next, posOf(prev));
    moveE(from, midSt, arrows, { start: dropPt, from: srcPt, fresh: [ar], ms: 480 }, function(){
      if(my !== run) return;
      glide(midSt, next, 520, function(){
        if(my !== run) return;
        landStep(prev, next, arrows);
      });
    });
  }
  function posOf(st){ var p = {}; Object.keys(st.atoms).forEach(function(k){ p[k] = { x: st.atoms[k].x, y: st.atoms[k].y }; }); return p; }
  function matchRow(st){ for(var i = 0; i < S.row.length; i++) if(S.row[i].st && sameStructure(S.row[i].st, st)) return i; return -1; }
  // a step has landed: the board is the new state
  function landStep(prev, next, arrows){
    S.hist.push({ cur: prev });
    S.cur = next; S.pending = []; S.pendingSt = null;
    var notes = plausibility(prev, next);
    if(S.ctx === 'any'){
      S.row.push({ st: next, name: 'Step ' + S.row.length, tag: 'step ' + S.row.length });
      if(S.row.length > 5) S.row = [S.row[0]].concat(S.row.slice(-4));
      S.notes = applyArrows(prev, arrows).steps.map(function(t){ return { k: 'What you drew', text: undash(upper1(t)) + '.' }; })
        .concat(C.commentary(prev, next).map(function(n){ return { k: n.level === 'good' ? 'Looks right' : n.level === 'warn' ? 'Worth a second look' : 'Note', text: undash(n.text) }; }))
        .concat(notes.map(function(n){ return { k: 'Legal, but', text: n.text, warn: true }; }));
      anyPanel();
    }
    paintAll(); words({ kind: 'step', arrows: arrows, prev: prev, notes: notes });
    syncState();
  }
  function afterPush(){ if(S.ctx === 'any') anyPanel(); }
  function arrowPathHtml(cv){ var p = PB.arrowPath(cv); return '<path class="rs2-al-l" d="' + p.line + '"/><path class="rs2-al-h" d="' + p.head + '"/>'; }

  /* A tap on a card: the textbook arrows play from where the board is (or from the start) to that state. */
  function goTo(j){
    var r = S.row[j]; if(!r || !r.st) return;
    var i = rowNow();
    if(i === j && !S.pendingSt) return;
    cancelRuns();
    var my = run;
    S.pending = []; S.pendingSt = null;
    if(S.ctx === 'any' || i > j || i < 0 && j === 0 || !r.arrows && j > 0){
      // back (or to your own step): no arrows to play, the board fades to it
      S.hist.push({ cur: S.cur }); S.cur = r.st; crossPaint(); words(null); syncState(); return;
    }
    if(i < 0){ S.hist.push({ cur: S.cur }); S.cur = S.row[0].st; i = 0; paintAll(); }
    (function next(k){
      var to = S.row[k + 1], prev = S.cur;
      mainT = boardT();
      var midSt = withPos(to.st, posOf(prev));
      moveE(prev, midSt, to.arrows, {}, function(){
        if(my !== run) return;
        glide(midSt, to.st, 520, function(){
          if(my !== run) return;
          S.hist.push({ cur: prev }); S.cur = to.st;
          if(k + 1 < j){ paintAll(); next(k + 1); return; }
          paintAll(); words({ kind: 'step', arrows: to.arrows, prev: prev, notes: plausibility(prev, to.st) }); syncState();
        });
      });
    })(i);
  }
  function crossPaint(){
    if(K.reduced() || !G.mainA.animate){ paintAll(); return; }
    var old = G.mainA.innerHTML; paintAll();
    G.mainB.innerHTML = old; G.mainB.style.opacity = '1';
    B.tween(420, function(f){ G.mainB.style.opacity = f1(1 - ease(f)); G.mainA.style.opacity = f1(ease(f)); }, function(){ G.mainB.innerHTML = ''; G.mainB.style.opacity = '0'; G.mainA.style.opacity = '1'; });
  }

  function undo(){
    cancelRuns();
    if(S.pending.length){
      S.pending.pop();
      S.pendingSt = null;
      if(S.ctx !== 'chal' && S.pending.length){ var r = applyArrows(S.cur, S.pending); S.pendingSt = errorsOf(r).length ? r.structure : null; }
      chal.marks = null; chal.verdict = null;
    } else if(S.hist.length && S.ctx !== 'chal'){
      S.cur = S.hist.pop().cur;
      if(S.ctx === 'any'){ var k = matchRow(S.cur); if(k >= 0) S.row = S.row.slice(0, k + 1); S.notes = []; anyPanel(); }
    } else return;
    paintAll(); words(null); syncState();
    if(S.ctx === 'chal') chalPanel();
    say('Undone. ' + cause.text());
  }

  /* ====================================================================== */
  /* Pointer and keys on the molecule (the same as Resonance)                 */
  /* ====================================================================== */
  var drag = null, tapSrc = null;
  function local(e){ var r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) * L.W / r.width, y: (e.clientY - r.top) * L.H / r.height }; }
  function snapT(src, pt, list){ return B.snap(src.key, pt, list, function(t){ return RANK[judgeTarget(src, t).kind]; }); }
  // a π bond grabbed nearer one end attacks with that end
  function withEnd(src, pt){
    if(!src || !C.isBondKey(src.key) || src.sigma) return src;
    var bk = C.parseBondKey(src.key), a = mainA.atoms[bk.a], b = mainA.atoms[bk.b], L0 = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    var t = ((pt.x - a.x) * (b.x - a.x) + (pt.y - a.y) * (b.y - a.y)) / (L0 * L0);
    if(t < 0.36) src.end = bk.a; else if(t > 0.64) src.end = bk.b;
    return src;
  }
  hit.addEventListener('pointerdown', function(e){
    if(!S.cur || B.busy()) return;
    var pt = local(e), src = withEnd(B.sourceAt(pt, { sigma: true }), pt);
    if(tapSrc && !src){ var tl = B.targetsFor(tapSrc.key), t0 = snapT(tapSrc, pt, tl); if(t0){ var s0 = tapSrc; tapSrc = null; clearPick(); commit(s0, t0, { x: t0.x, y: t0.y }, { x: s0.x, y: s0.y }); } return; }
    if(!src) return;
    if(tapSrc && src.key !== tapSrc.key){
      var tl2 = B.targetsFor(tapSrc.key), t2 = snapT(tapSrc, pt, tl2);
      if(t2){ var s2 = tapSrc; tapSrc = null; clearPick(); commit(s2, t2, { x: t2.x, y: t2.y }, { x: s2.x, y: s2.y }); return; }
    }
    e.preventDefault();
    try{ hit.setPointerCapture(e.pointerId); }catch(er){}
    drag = { src: src, start: pt, moved: false, list: B.targetsFor(src.key), t: null, id: e.pointerId };
    hideCue(true);
  });
  hit.addEventListener('pointermove', function(e){
    if(!drag || e.pointerId !== drag.id) return;
    var pt = local(e);
    if(!drag.moved && Math.hypot(pt.x - drag.start.x, pt.y - drag.start.y) < 6) return;
    if(!drag.moved){ drag.moved = true; B.startDragVis(drag); }
    drag.pt = pt;
    drag.t = snapT(drag.src, pt, drag.list);
    B.paintDrag(drag, function(t){ return judgeTarget(drag.src, t).kind; });
  });
  function endDrag(e, cancel){
    if(!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null;
    if(!d.moved){
      B.endDragVis();
      if(!d.src.real){ commitBad(d.src); return; }
      tapSrc = d.src; showPick(d.src); return;
    }
    // let go back on (or next to) the spot it came from: no push, the pair goes home
    // (when the target is that close too, as a π bond onto its own atom on a small drawing, the nearer one wins)
    var dh = d.pt ? Math.hypot(d.pt.x - d.src.x, d.pt.y - d.src.y) : 0, dt = d.pt && d.t ? Math.hypot(d.pt.x - d.t.x, d.pt.y - d.t.y) : Infinity;
    var home = d.pt && dh < Math.max(22, 16 * mainT.k) && dh <= dt;
    if(cancel || !d.t || home){ B.endDragVis(); B.springBack(d.pt || d.start, { x: d.src.x, y: d.src.y }, function(){ paintAll(); }); return; }
    B.endDragVis(true);
    commit(d.src, d.t, d.pt, { x: d.src.x, y: d.src.y });
  }
  hit.addEventListener('pointerup', function(e){ endDrag(e); });
  hit.addEventListener('pointercancel', function(e){ endDrag(e, true); });
  hit.addEventListener('lostpointercapture', function(e){ if(drag && drag.id === e.pointerId) endDrag(e, true); });
  function showPick(src){
    G.ui.insertAdjacentHTML('beforeend', '<circle class="rs2-pickring" cx="' + f1(src.x) + '" cy="' + f1(src.y) + '" r="' + f1(Math.max(13, 10 * mainT.k)) + '"/>');
    cause.set([{ t: C.isBondKey(src.key) ? (src.sigma ? 'Bond picked' : 'π bond picked') : 'Lone pair picked', role: 'e' }, { t: 'tap where it goes', role: 'ink' }]);
    say(cause.text());
  }
  function clearPick(){ [].forEach.call(G.ui.querySelectorAll('.rs2-pickring'), function(n){ n.remove(); }); }
  function commitBad(src){
    // grabbed an atom with no lone pair: say why nothing moves
    var st = shown();
    cause.set([{ t: labelOf(st, src.key) + ' has no lone pair', role: 'bad' }, { t: 'grab a pair or a bond', role: 'ink' }]);
    say(cause.text());
  }

  // keys: arrows pick what to move, Enter takes it, arrows pick where it goes, Enter pushes; Esc cancels; Backspace undoes
  var kb = { phase: 'src', i: 0, list: [], src: null };
  function atomName(st, k){
    var a = st.atoms[k], lab = labelOf(st, k), same = Object.keys(st.atoms).filter(function(o){ return labelOf(st, o) === lab; });
    var q = over(st).indexOf(k) >= 0 ? 0 : PB.fc(st, k), extra = q ? (q < 0 ? ' (negative)' : ' (positive)') : '';
    if(same.length < 2) return lab + extra;
    var vs = V(st), p = vs.atoms[k], cx = 0, cy = 0; same.forEach(function(o){ cx += vs.atoms[o].x; cy += vs.atoms[o].y; }); cx /= same.length; cy /= same.length;
    var dx = p.x - cx, dy = p.y - cy, where = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'top' : 'bottom') : (dx < 0 ? 'left' : 'right');
    return lab + ' ' + where + extra;
  }
  function kbSources(){
    var st = shown(), A = mainA, out = [];
    Object.keys(st.atoms).forEach(function(k){ if((st.atoms[k].lp || 0) > 0 && A.lps[k].length){ var l = A.lps[k][0]; out.push({ key: k, x: l.x, y: l.y, real: true, say: 'lone pair on ' + atomName(st, k) }); } });
    st.bonds.forEach(function(b){ if(b.order >= 2){ var bk = PB.bondKey(b), p = A.pis[bk]; out.push({ key: bk, x: p.mx, y: p.my, real: true, say: 'π bond ' + atomName(st, b.a) + ' to ' + atomName(st, b.b) }); } });
    // σ bonds, those to a heteroatom or a hydrogen first (the ones that break in a mechanism)
    var sig = st.bonds.filter(function(b){ return b.order >= 1; }).map(function(b){ var bk = PB.bondKey(b), m = A.bonds[bk], hetero = st.atoms[b.a].el !== 'C' || st.atoms[b.b].el !== 'C';
      return { key: bk, x: m.mx, y: m.my, real: true, sigma: true, h: hetero ? 0 : 1, say: (b.order > 1 ? 'σ bond ' : 'bond ') + atomName(st, b.a) + ' to ' + atomName(st, b.b) }; });
    sig.sort(function(a, b){ return a.h - b.h; });
    return out.concat(sig);
  }
  function kbTargets(src){
    var st = shown();
    return B.targetsFor(src.key).map(function(t){ t.res = null; return t; }).sort(function(a, b){
      return (RANK[judgeTarget(src, a).kind] - RANK[judgeTarget(src, b).kind]) || (Math.hypot(a.x - src.x, a.y - src.y) - Math.hypot(b.x - src.x, b.y - src.y));
    }).map(function(t){ t.say = t.bond ? 'into the ' + atomName(st, t.bond.a) + ' to ' + atomName(st, t.bond.b) + ' bond' : 'onto ' + atomName(st, t.key); return t; });
  }
  function kbMark(p){ clearPick(); if(p) G.ui.insertAdjacentHTML('beforeend', '<circle class="rs2-pickring is-kb" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(Math.max(13, 10 * mainT.k)) + '"/>'); }
  hit.addEventListener('keydown', function(e){
    if(!S.cur || B.busy()) return;
    var k = e.key;
    if(k === 'Backspace' || ((e.ctrlKey || e.metaKey) && k === 'z')){ e.preventDefault(); undo(); kb.phase = 'src'; return; }
    if(k === 'Escape'){ if(kb.phase === 'tgt'){ e.preventDefault(); kb.phase = 'src'; kbMark(null); say('Cancelled.'); } return; }
    if(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(k) >= 0){
      e.preventDefault(); hideCue(true);
      var step = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1;
      if(kb.phase === 'src'){ kb.list = kbSources(); }
      if(!kb.list.length) return;
      kb.i = kb.started ? (kb.i + step + kb.list.length) % kb.list.length : 0; kb.started = true;
      var it = kb.list[kb.i]; kbMark(it);
      say((kb.phase === 'src' ? 'Move the ' : 'Push it ') + it.say + '. ' + (kb.i + 1) + ' of ' + kb.list.length + '. Enter to ' + (kb.phase === 'src' ? 'pick it.' : 'push.'));
      return;
    }
    if(k === 'Enter' || k === ' '){
      e.preventDefault();
      if(kb.phase === 'src'){
        kb.list = kbSources(); if(!kb.list.length) return;
        var sc = kb.list[kb.started ? kb.i % kb.list.length : 0];
        kb.src = sc; kb.phase = 'tgt'; kb.list = kbTargets(sc); kb.i = 0; kb.started = true;
        if(!kb.list.length){ kb.phase = 'src'; return; }
        kbMark(kb.list[0]); say('Picked the ' + sc.say + '. Arrows choose where it goes: ' + kb.list[0].say + ', 1 of ' + kb.list.length + '. Enter to push.');
      } else {
        var t = kb.list[kb.i], src = kb.src; kb.phase = 'src'; kb.started = false; kbMark(null);
        commit(src, t, { x: t.x, y: t.y }, { x: src.x, y: src.y });
      }
    }
  });
  hit.addEventListener('blur', function(){ if(kb.phase === 'tgt'){ kb.phase = 'src'; kbMark(null); } kb.started = false; });

  thumbsEl.addEventListener('click', function(e){
    var b = e.target.closest('.rs2-tb'); if(!b || b.disabled) return;
    hideCue(true); S.took = true; tourTurn.did('steps');
    goTo(+b.getAttribute('data-i'));
  });
  undoBtn.addEventListener('click', undo);
  sel.addEventListener('change', function(){
    if(S.ctx === 'explore'){ var m = MECHS.filter(function(x){ return x.id === sel.value; })[0]; if(m) loadMech(m); }
    else if(S.ctx === 'chal'){ var c = CHALLENGES.filter(function(x){ return x.id === sel.value; })[0]; if(c) startChal(c); }
    else if(sel.value === '__built' && built) loadAny(null);
    else { var p = ALL.filter(function(x){ return x.id === sel.value; })[0]; if(p) loadAny(p); }
  });

  /* ====================================================================== */
  /* Words: the cause line and the screen reader text                        */
  /* ====================================================================== */
  function words(res, early){
    var st = shown();
    if(!st) return;
    var parts, now = rowNow();
    if(!res){
      if(S.pendingSt) parts = heldWords();
      else if(S.ctx === 'chal') parts = chalWords();
      else if(!S.took && now === 0) parts = [{ t: 'Move a pair', role: 'e' }, { t: 'a bond forms or breaks', role: 'ink' }];
      else parts = stateWords(st, now);
    } else if(res.kind === 'reject') parts = rejectWords(res.err, res.ar);
    else if(res.kind === 'held') parts = heldWords();
    else if(res.kind === 'ok') parts = chalWords();
    else {
      var mv = res.arrows.length > 2 ? [{ t: res.arrows.length + ' pairs moved', role: 'e' }] : res.arrows.map(function(a){ return { t: moveWord(res.prev, a), role: 'e' }; });
      var warn = (res.notes || []).filter(function(n){ return n.pill; })[0];
      if(warn && mv.length > 1) mv = [{ t: mv.length + ' pairs moved', role: 'e' }];
      parts = mv.concat(stateWords(st, now)).concat(warn ? [{ t: warn.short, role: 'warn' }] : []);
    }
    cause.set(parts);
    if(!early){
      if(res && res.kind === 'step' && S.ctx === 'explore' && now === S.row.length - 1 && S.mech && S.mech.take) cause.take(S.mech.take);
      say(cause.text() + ' ' + (res && res.kind === 'reject' && S.lastWhy ? S.lastWhy + ' ' : '') + boardText());
      if(res && res.kind === 'reject') refNow();
    }
    hit.setAttribute('aria-label', boardText());
    refNow();
  }
  function stateWords(st, now){
    if(now >= 0 && S.ctx !== 'any' && S.row[now].name) return [{ t: S.row[now].name, role: now === S.row.length - 1 && S.row[now].tag !== 'intermediate' ? 'good' : now ? 'inter' : 'ink' }];
    var sp = speciesOf(st);
    if(sp.length > 1) return [{ t: sp.join(' + '), role: 'ink' }];
    var w = whereQ(st);
    return [{ t: w || 'no charges', role: w ? (chargedOf(st).some(function(c){ return c.q < 0; }) ? (chargedOf(st).some(function(c){ return c.q > 0; }) ? 'ink' : 'neg') : 'pos') : 'ink' }];
  }
  function heldWords(){
    var mid = S.pendingSt, k = mid ? over(mid)[0] : null, n = k ? C.electronCount(mid, k) : 10, el = k ? labelOf(mid, k) : 'An atom';
    return [{ t: el + ': ' + n + ' e⁻', role: 'warn' }, { t: 'a bond to ' + el + ' must break', role: 'e' }];
  }
  function chalWords(){
    if(chal.verdict && chal.verdict.ok) return [{ t: 'Step ' + (chal.verdict.step + 1) + ' right', role: 'good' }].concat(chal.i >= chal.def.steps.length ? [{ t: chal.def.label + ' done', role: 'good' }] : [{ t: 'now step ' + (chal.i + 1), role: 'ink' }]);
    if(chal.verdict) return [{ t: 'Not this step yet', role: 'bad' }, { t: chal.marks && chal.marks.length ? 'red: not this step' : chal.verdict.missing ? 'an arrow is missing' : 'see the panel', role: 'ink' }];
    if(S.pending.length) return [{ t: S.pending.length + ' arrow' + (S.pending.length > 1 ? 's' : '') + ' drawn', role: 'e' }, { t: 'Check step ' + (chal.i + 1) + ' when done', role: 'ink' }];
    return [{ t: 'Draw step ' + (chal.i + 1), role: 'e' }, { t: 'then Check', role: 'ink' }];
  }
  function rejectWords(err, ar){
    var st = S.cur, code = err && err.code;
    if(code === 'no-lone-pair' || code === 'group-source') return [{ t: labelOf(st, ar.from) + ' has no lone pair', role: 'bad' }, { t: 'start where electrons are', role: 'ink' }];
    if(code === 'not-adjacent') return [{ t: 'Not connected', role: 'bad' }, { t: 'move along a bond', role: 'ink' }];
    if(code === 'octet'){ var mid = applyArrows(S.cur, S.pending.concat([ar])).structure, k = over(mid)[0]; return [{ t: (k ? labelOf(mid, k) : 'An atom') + ': ' + (k ? C.electronCount(mid, k) : 10) + ' e⁻', role: 'bad' }, { t: 'no bond there can break', role: 'ink' }]; }
    if(code === 'over-broken') return [{ t: 'One bond used twice', role: 'bad' }, { t: 'a bond has one pair', role: 'ink' }];
    if(code === 'too-many') return [{ t: 'Four arrows at most', role: 'bad' }, { t: 'Check this step', role: 'ink' }];
    return [{ t: 'That cannot happen', role: 'bad' }];
  }
  function boardText(){
    var st = shown(); if(!st) return '';
    var now = rowNow(), hide = S.pendingSt ? over(st) : null;
    var dbl = st.bonds.filter(function(b){ return b.order >= 2; }).map(function(b){ return atomName(st, b.a) + ' = ' + atomName(st, b.b); });
    return S.name + (S.pendingSt ? ', a push held' : now >= 0 && S.row[now].name && S.ctx !== 'any' ? ', ' + S.row[now].name + ' (' + S.row[now].tag + ')' : '') +
      '. Species: ' + speciesOf(st).join(' + ') + '. Double bonds: ' + (dbl.join('; ') || 'none') + '. Charges: ' + (whereQ(st, hide) || 'none') +
      '. Arrow keys pick a lone pair or a bond to move.';
  }

  /* ====================================================================== */
  /* Loading                                                                 */
  /* ====================================================================== */
  function reset(name, st, id){
    cancelRuns(); tapSrc = null; kb.phase = 'src';
    S.id = id; S.name = name; S.start = st; S.cur = st; S.pending = []; S.pendingSt = null; S.hist = []; S.took = false; S.lastWhy = null; S.notes = [];
  }
  function loadMech(m){
    S = boards.explore; S.mech = m;
    reset(Mol.get(m.id).name, startOf(m.id), m.id);
    S.row = pathOf(m); S.cur = S.start = S.row[0].st;
    after();
  }
  function loadAny(p){
    S = boards.any; S.pick = p;
    if(p) reset(Mol.get(p.id).name, startOf(p.id), p.id);
    else { var B0 = window.OchemBuilder; reset(built.name, B0 && B0.withHydrogens ? B0.withHydrogens(built.st) : C.clone(built.st), '__built'); }
    S.row = [{ st: S.start, name: S.name, tag: 'start' }];
    if(hintsAny) hintsAny.reset();
    anyPanel();
    after();
  }
  function after(){
    syncPicker();
    var fade = drawn && !K.reduced() && G.mainA.animate;
    paintAll(); words(null);
    if(fade) try{ [G.mainA, G.strip].forEach(function(n){ n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }); }); }catch(e){}
    syncState(); placeCue();
  }
  var booting = true;
  function syncState(){
    if(!window.OchemToolState || booting) return;
    window.OchemToolState.write({
      start: MODE.mode === 'explore' ? (S.id && S.id !== MECHS[0].id ? S.id : null) : MODE.part === 'any' && S.id !== '__built' ? S.id : null,
      build: MODE.part === 'any' && S.id === '__built' && built ? built.text : null,
      chal: MODE.part === 'chal' && chal.def ? chal.def.id : null
    });
  }

  /* ====================================================================== */
  /* The first visit cue and "Show me how"                                   */
  /* ====================================================================== */
  var cue = null, SIDES = ['below', 'above', 'right', 'left'];
  function firstSource(){
    var r1 = S.row[1];
    if(!r1 || !r1.arrows || !mainA || rowNow() !== 0) return null;
    var ar = r1.arrows[0], p = anchorOf(ar, mainA, 'from'), isLp = !C.isBondKey(ar.from), spots = [{ x: p.x, y: p.y, lp: isLp, atom: isLp ? ar.from : null, pi: !isLp && C.findBond(S.cur, C.parseBondKey(ar.from).a, C.parseBondKey(ar.from).b).order > 1 }];
    if(isLp) (mainA.lps[ar.from] || []).forEach(function(l){ if(l.x !== p.x || l.y !== p.y) spots.push({ x: l.x, y: l.y, lp: true, atom: ar.from }); });
    return { spots: spots };
  }
  var cueAt = null;
  function placeCue(){
    if(cue){ cue.hide(false); cue = null; }
    if(MODE.mode !== 'explore' || S.took) return;
    var fs = firstSource(); if(!fs) return;
    var best = null;
    for(var ti = 0; ti < 3; ti++){
      for(var j = 0; j < fs.spots.length; j++){
        var sp = fs.spots[j], text = sp.lp ? ['Drag this lone pair', 'Drag this pair', 'Drag this'][ti] : sp.pi ? ['Drag this π bond', 'Drag the π bond', 'Drag this'][ti] : ['Drag this bond', 'Drag the bond', 'Drag this'][ti];
        for(var i = 0; i < SIDES.length; i++){
          cueAt = sp;
          cue = K.cue(layer, { key: 'ochem-ap-push', text: text, side: SIDES[i], at: function(){ return [cueAt.x, cueAt.y]; } });
          if(!cue.show()){ cue = null; return; }
          var sc = cueScore();
          if(sc === 0){ placeLabels(); return; }
          if(!best || sc < best.sc) best = { sc: sc, spot: sp, side: SIDES[i], text: text };
          cue.hide(false); cue = null;
        }
      }
    }
    cueAt = best.spot;
    cue = K.cue(layer, { key: 'ochem-ap-push', text: best.text, side: best.side, at: function(){ return [cueAt.x, cueAt.y]; } });
    cue.show();
    placeLabels();
  }
  function cueScore(){
    var b = layer.el.querySelector('.tk2-cue'); if(!b) return 0;
    var r0 = b.getBoundingClientRect(), s = sceneBox.getBoundingClientRect(), sc = 0;
    // 4 px clear of everything (a name, a ball, a control)
    var r = { left: r0.left - 4, right: r0.right + 4, top: r0.top - 4, bottom: r0.bottom + 4 };
    sc += (Math.max(0, s.left + 2 - r.left) + Math.max(0, r.right - s.right + 2) + Math.max(0, s.top + 2 - r.top) + Math.max(0, r.bottom - s.bottom + 2)) * 1000;
    // the names on the board make way for the cue (they are placed again around it); the row's names do not
    var things = [].slice.call(svg.querySelectorAll('.rs2-mainA .rs2-ball, .rs2-mainA .rs2-badge circle, .rs2-mainA .rs2-lp, .rs2-thumb')).concat([].slice.call(labsEl.children).filter(function(x){ return !x.hidden && !/is-role|is-sp/.test(x.className); }), [sel, undoBtn]);
    things.forEach(function(t){
      var q = t.getBoundingClientRect();
      // the pairs of the atom the cue points at are meant to be next to it
      var src = cueAt && (cueAt.atom ? mainA.atoms[cueAt.atom] : { x: cueAt.x, y: cueAt.y, r: 0 });
      if(src && /rs2-lp/.test(t.getAttribute('class') || '') && Math.hypot((q.left + q.right) / 2 - s.left - src.x, (q.top + q.bottom) / 2 - s.top - src.y) < src.r + 18) return;
      var w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top); if(w > 0 && h > 0) sc += w * h; });
    return sc;
  }
  function hideCue(used){ if(cue){ cue.hide(used); cue = null; } }
  var tourTurn = K.tour({ key:'ochem-ap', label:'Show me how', steps: [
    { id:'push', text:'Grab a lone pair or a bond and drag it to where its electrons go. The curved arrow follows; the bonds change when you let go.', target: function(){ var f = cueAt || (firstSource() || { spots: [] }).spots[0]; if(!f) return hit; var r = svg.getBoundingClientRect(); return { left: r.left + f.x - 14, top: r.top + f.y - 14, width: 28, height: 28, right: r.left + f.x + 14, bottom: r.top + f.y + 14 }; } },
    { id:'steps', text:'Each step of this mechanism is in the row. Tap one to watch the arrows that make it.', target: function(){ return thumbsEl.lastChild || thumbsEl; } },
    { id:'why', text:'This line says what your arrows did: the bond made or broken, and what it gave.', target: function(){ return cause.el; } }
  ] });
  function startTour(){ hideCue(true); tourTurn.start(true); }

  /* ====================================================================== */
  /* "?": this mechanism, the formal charges, how to read the picture, build your own */
  /* ====================================================================== */
  var ref = mk('div', 'ap2-ref',
    '<p class="ap2-ref-how"><button type="button" class="tk2-how" id="apRefHow">Show me how</button></p>' +
    '<div id="apRefNow"></div>' +
    '<details class="tool-more" open id="apBooksBox"><summary>Formal charges on the board</summary><div id="apBooks"></div></details>' +
    '<details class="tool-more" open><summary>How to read the picture</summary><div class="ap2-ref-key">' +
      '<p><span class="rs2-sw is-e"></span><b>Violet:</b> electrons that can move: lone pairs (two dots) and π bonds (the second line of a double bond). A σ bond (the grey stick) can move too: grab it to break it. Curved arrows are violet: each moves one pair, from where it is to where it goes, an atom or the space between two atoms.</p>' +
      '<p><span class="rs2-sw is-neg"></span><b>Red glow:</b> a negative formal charge. <span class="rs2-sw is-pos"></span><b>Blue glow:</b> a positive one. The badge gives the sign. Charges are worked out again after every step (valence electrons minus lone pair electrons minus bonds).</p>' +
      '<p><span class="rs2-sw is-warn"></span><b>Amber ring:</b> an atom past its octet, with its electron count ("10 e⁻" on carbon, "4 e⁻" on hydrogen). The push is held: in the same step a bond to that atom has to break (draw the second arrow). That is how a one step mechanism such as SN2 or a proton transfer is drawn.</p>' +
      '<p><b>A push that cannot happen springs back</b> (red), with the reason: an atom with no lone pair cannot give one; electrons move only along bonds that connect; a bond has one pair to give. A push that is legal but rarely happens (a primary carbocation, hydroxide leaving) is made, with a note.</p>' +
      '<p><b>The atoms move</b> when a step joins or splits species: a group that has broken away drifts off, a new bond pulls its partner in. Positions are a sketch, not geometry: no angles change, so the backside attack and inversion of an SN2 are not drawn.</p>' +
      '<p><b>The steps row</b> shows this mechanism’s states, start to product, from the textbook arrows. Tap one to watch its arrows. Pushes of your own that reach a state light its card.</p>' +
      '<p>The balls and their sizes are a model, not to scale. A ball marked CH₃ stands for the whole group.</p>' +
    '</div></details>' +
    '<details class="tool-more"><summary>Using the keyboard</summary><p class="ap2-ref-p">On the picture, the arrow keys go through what can move (lone pairs, π bonds, then bonds) and Enter picks one; the arrow keys then go through where it can go and Enter pushes. Esc cancels; Backspace undoes.</p></details>' +
    '<details class="tool-more" id="apBuildBox"><summary>Build your own</summary><div id="apBuilder"></div><div id="apBuildMsg"></div><div id="apSend"></div></details>');

  function refNow(){
    var el = byId('apRefNow'); if(!el) return;
    var html = '';
    if(S.ctx === 'explore' && S.mech){
      html += '<h3 class="ap2-ref-h">' + esc(S.mech.label) + ', arrow by arrow</h3><ol class="ap2-steps">' + S.row.slice(1).map(function(r, i){
        return '<li><b>' + esc(r.name) + '.</b> ' + r.arrows.map(function(a){ return esc(undash(upper1(C.deltaFor(S.row[i].st, a).text))) + '.'; }).join(' ') + '</li>';
      }).join('') + '</ol><p>' + esc(S.mech.long || S.mech.take) + '</p>';
    }
    if(S.lastWhy) html += '<p><b>The last push that sprang back:</b> ' + esc(S.lastWhy) + '</p>';
    var st = shown(), big = st ? C.fragments(st).slice().sort(function(a, b){ return b.length - a.length; })[0] : null;
    if(window.OchemBuilder && big && big.length > 1){
      var only = C.clone(st);
      Object.keys(only.atoms).forEach(function(k){ if(big.indexOf(k) < 0) delete only.atoms[k]; });
      only.bonds = only.bonds.filter(function(b){ return only.atoms[b.a] && only.atoms[b.b] && b.order > 0; });
      try{ html += '<p><a class="ls-tag" href="viewer-3d.html?st=' + encodeURIComponent(window.OchemBuilder.encode(only)) + '">See ' + esc(C.formula(st, big)) + ' in 3D &rarr;</a></p>'; }catch(e){}
    }
    el.innerHTML = html;
    books();
  }
  /* The arithmetic, spelled out (the old "Electron bookkeeping"): valence − lone pair electrons − bonds, for every
     atom but an uncharged hydrogen. */
  function books(){
    var el = byId('apBooks'), st = shown(); if(!el || !st) return;
    var hide = S.pendingSt ? over(st) : [];
    var rows = Object.keys(st.atoms).filter(function(k){ var a = st.atoms[k]; return !a.group && a.el && (a.el !== 'H' || C.formalCharge(st, k) !== 0); });
    el.innerHTML = '<div class="ttable-scroll"><table class="ttable"><thead><tr><th>Atom</th><th>Valence e⁻</th><th>Lone pairs</th><th>Bonds</th><th>Formal charge</th></tr></thead><tbody>' +
      rows.map(function(k){
        var a = st.atoms[k], fc = C.formalCharge(st, k), held = hide.indexOf(k) >= 0;
        return '<tr><td class="num">' + esc(atomName(st, k)) + '</td><td class="num">' + C.info(a.el).valence + '</td><td class="num">' + a.lp + ' <small class="tmuted">(' + (a.lp * 2) + ' e⁻)</small></td>' +
          '<td class="num">' + C.totalBonds(st, k) + '</td><td class="num' + (fc && !held ? ' win' : '') + '">' + (held ? C.electronCount(st, k) + ' e⁻, held' : (fc > 0 ? '+' : '') + fc) + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="tmuted ap2-ref-p">Formal charge = valence electrons − lone pair electrons − number of bonds. Hydrogens are left out unless one of them is charged.</p>';
  }

  var builderApi = null, sendApi = null, lastBuilt = null;
  function openBuilder(){
    var box = byId('apBuilder'), msg = byId('apBuildMsg');
    if(builderApi || !window.OchemBuilderUI || !box) return builderApi;
    if(window.OchemToolHandoff) sendApi = window.OchemToolHandoff.mountSend(byId('apSend'), function(){ return lastBuilt; });
    builderApi = window.OchemBuilderUI.mount(box, {
      onChange: function(st, rep){
        lastBuilt = (rep.empty || !rep.ok) ? null : st;
        if(sendApi) sendApi.refresh();
        if(rep.empty){ msg.innerHTML = ''; return; }
        if(!rep.ok){ msg.innerHTML = '<div class="tnote tnote--bad" style="margin-top:12px;">Fix what is flagged on the canvas first. Arrows on a structure that could not exist teach nothing.</div>'; return; }
        var typed = byId('mbText');
        built = { st: C.clone(st), name: st.name || rep.formula || 'Your molecule', text: typed && typed.value ? typed.value : null };
        msg.innerHTML = '<div class="tnote tnote--good" style="margin-top:12px;"><b>' + esc(st.name ? st.name + ', ' + rep.formula : rep.formula) + '.</b> Every atom checks out. It is on the picture, in Test yourself, Any molecule.</div>';
        if(kitApi && (MODE.mode !== 'quiz' || MODE.part !== 'any')) kitApi.go('quiz', 'any');
        loadAny(null);
      }
    });
    Kit.builder(box);
    return builderApi;
  }
  ref.querySelector('#apBuildBox').addEventListener('toggle', function(){ if(this.open) openBuilder(); });

  /* ====================================================================== */
  /* Test yourself                                                           */
  /* ====================================================================== */
  // 1. Draw each step: the seven challenges, checked as before
  var chalBox = mk('div', 'ap2-dock');
  chalBox.innerHTML = '<div class="ap2-stepmark" id="apStepMark"></div><div id="apChalSay" tabindex="-1"></div><div id="apChalHint"></div><div class="trow ap2-row" id="apChalRow"></div>';
  var hintsChal = studio.hints({
    hints: function(){ var h = chal.def && chal.def.hints && chal.def.hints[chal.i]; return (h || []).map(esc); },
    answer: { label: 'Show one arrow', onShow: function(){
      var want = arrowsOf(chal.def.steps[chal.i]);
      chal.shown = Math.min(chal.shown + 1, want.length);
      return want.slice(0, chal.shown).map(function(a, i){ return '<p>' + (want.length > 1 ? 'Arrow ' + (i + 1) + ': ' : '') + esc(undash(upper1(C.deltaFor(S.cur, a).text))) + '.</p>'; }).join('');
    } }
  });
  chalBox.querySelector('#apChalHint').appendChild(hintsChal.card);
  var checkBtn = mk('button', 'ls-btn ls-pri ap2-check', 'Check'); checkBtn.type = 'button';
  var tgtBtn = mk('button', 'tchip', 'Show the target'); tgtBtn.type = 'button'; tgtBtn.setAttribute('aria-pressed', 'false');
  var againBtn = mk('button', 'tchip', 'Start over'); againBtn.type = 'button';
  chalBox.querySelector('#apChalRow').appendChild(checkBtn);
  chalBox.querySelector('#apChalRow').appendChild(hintsChal.row);
  chalBox.querySelector('#apChalRow').appendChild(tgtBtn);
  chalBox.querySelector('#apChalRow').appendChild(againBtn);
  checkBtn.addEventListener('click', function(){ var n = byId('apChalSay'); if(n) n.focus({ preventScroll: true }); checkChal(); });
  tgtBtn.addEventListener('click', function(){ chal.showTarget = !chal.showTarget; chalRow(); paintAll(); chalPanel(); });
  againBtn.addEventListener('click', function(){ startChal(chal.def); });

  var whyEl = mk('div', 'ls-sec ap2-why');
  studio.add('why', whyEl, { mode: 'quiz' });
  function startChal(def){
    S = boards.chal;
    whyEl.innerHTML = '';
    chal.def = def; chal.i = 0; chal.wrong = 0; chal.verdict = null; chal.shown = 0; chal.marks = null; chal.showTarget = false;
    var st0 = startOf(def.mol);
    chal.states = [st0];
    def.steps.forEach(function(arr, i){ chal.states.push(stepTo(chal.states[i], arrowsOf(arr))); });
    reset(Mol.get(def.mol).name, st0, def.id);
    chalRow();
    hintsChal.reset();
    studio.done(false, 'quiz');
    chalPanel();
    after();
  }
  function chalRow(){
    var n = chal.def.steps.length;
    S.row = chal.states.map(function(st, i){
      var last = i === n, reached = i <= chal.i;
      return { st: st, name: i === 0 ? 'Start' : last ? 'Target' : 'Step ' + i + ' result', tag: i === 0 ? 'start' : last ? 'target' : 'intermediate', hidden: !reached && !(last && chal.showTarget) };
    });
  }
  // a run started from the side panel (above the picture on a phone): bring the picture into view first
  function showStage(){
    if(!L || !L.phone) return;
    var r = sceneBox.getBoundingClientRect();
    if(r.top < 0 || r.bottom > innerHeight) try{ sceneBox.scrollIntoView({ block: 'center', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){}
  }
  function checkChal(){
    if(!S.pending.length || chal.i >= chal.def.steps.length) return;
    showStage();
    var want = arrowsOf(chal.def.steps[chal.i]), drawnA = S.pending.slice(), prev = S.cur;
    var r = applyArrows(prev, drawnA), errs = errorsOf(r);
    if(!errs.length && sameStructure(r.structure, chal.states[chal.i + 1])){
      chal.verdict = { ok: true, step: chal.i };
      var next = chal.states[chal.i + 1];
      chal.i++; chal.shown = 0; chal.marks = null;
      cancelRuns();
      var my = run, mid = withPos(next, posOf(prev));
      mainT = boardT();
      S.pending = [];
      moveE(prev, mid, drawnA, {}, function(){
        if(my !== run) return;
        glide(mid, next, 520, function(){
          if(my !== run) return;
          S.hist.push({ cur: prev }); S.cur = next;
          hintsChal.reset(); chalRow(); paintAll(); words(null); chalPanel(); syncState();
        });
      });
      chalPanel();
      return;
    }
    chal.wrong++;
    var missing = want.filter(function(n){ return !drawnA.some(function(d){ return sameArrow(d, n); }); });
    var extra = drawnA.filter(function(d){ return !want.some(function(n){ return sameArrow(d, n); }); });
    var linesW = [];
    if(errs.length) linesW.push(undash(upper1(errs[0].text)) + (/[.!?]$/.test(errs[0].text) ? '' : '.'));
    else if(r.steps.length) linesW.push('Your arrows: ' + undash(r.steps.join('; ')) + '.');
    if(extra.length) linesW.push('Not part of this step: ' + undash(C.deltaFor(prev, extra[0]).text) + '.');
    if(missing.length) linesW.push(missing.length === want.length && !drawnA.length ? 'Start with the electron source.' : 'Still needed: something to happen at ' + C.describeKey(prev, missing[0].to) + '.');
    chal.verdict = { ok: false, text: linesW.join(' '), missing: missing.length > 0 };
    chal.marks = []; drawnA.forEach(function(d, i){ if(!want.some(function(n){ return sameArrow(d, n); })) chal.marks.push(i); });
    hintsChal.attempt();
    paintAll(); words(null); chalPanel();
  }
  function chalPanel(){
    var def = chal.def; if(!def) return;
    var n = def.steps.length, done = chal.i >= n;
    var mark = byId('apStepMark');
    if(mark){
      mark.hidden = n < 2 || done;
      mark.innerHTML = n > 1 ? def.steps.map(function(_, i){ var d = i < chal.i, now = i === chal.i && !done; return '<span class="ap2-sm' + (d ? ' is-done' : now ? ' is-now' : '') + '">' + (d ? '✓ ' : '') + 'Step ' + (i + 1) + (now ? ' of ' + n : '') + '</span>'; }).join('<span class="ap2-sm-line" aria-hidden="true"></span>') : '';
    }
    var sayEl = byId('apChalSay');
    if(sayEl) sayEl.innerHTML = chal.verdict ? (chal.verdict.ok ? '<div class="tnote tnote--good"><span class="tnote__k">Step ' + (chal.verdict.step + 1) + ' right</span>' + (done ? 'That is the whole mechanism.' : 'The board is now the intermediate. Draw step ' + (chal.i + 1) + ' on it.') + '</div>'
      : '<div class="tnote tnote--bad"><span class="tnote__k">Not this step yet</span>' + esc(chal.verdict.text) + '</div>') : '';
    checkBtn.textContent = n > 1 ? 'Check step ' + (chal.i + 1) : 'Check';
    checkBtn.disabled = !S.pending.length || done || B.busy();
    checkBtn.hidden = done;
    tgtBtn.textContent = chal.showTarget ? 'Hide the target' : 'Show the target';
    tgtBtn.setAttribute('aria-pressed', String(chal.showTarget));
    tgtBtn.hidden = done;
    if(MODE.mode !== 'quiz' || MODE.part !== 'chal') return;
    if(done){
      var tk = def.take;
      // Full explanation: the mechanism, arrow by arrow
      whyEl.innerHTML = '<h3 class="ls-title-l">' + esc(def.label) + ', arrow by arrow</h3><ol class="ls-steps">' + def.steps.map(function(arr, i){
        return '<li><span>' + (n > 1 ? '<b>Step ' + (i + 1) + '.</b> ' : '') + arrowsOf(arr).map(function(a){ return esc(undash(upper1(C.deltaFor(chal.states[i], a).text))) + '.'; }).join(' ') + '</span></li>';
      }).join('') + '</ol><p>' + esc(tk[1]) + '</p>';
      studio.done({ kicker: 'Solved', title: esc(tk[0]),
        text: esc(tk[1]) + ' ' + (chal.wrong ? 'You got there with ' + chal.wrong + ' wrong check' + (chal.wrong > 1 ? 's' : '') + '.' : 'First time.'),
        next: { label: 'Next challenge', onClick: function(){ var i = CHALLENGES.indexOf(def); startChal(CHALLENGES[(i + 1) % CHALLENGES.length]); } },
        links: [{ label: 'Try it again', onClick: function(){ startChal(def); } }].concat(Kit.extras ? Kit.extras({ topic: def.topic }) : [])
      }, 'quiz');
    } else {
      whyEl.innerHTML = '';
      studio.done(false, 'quiz');
      studio.task({ kicker: 'Test yourself', title: esc(def.stepGoals ? def.stepGoals[chal.i] : def.goal),
        todo: chal.i ? 'Step ' + chal.i + ' gave you this intermediate. Draw step ' + (chal.i + 1) + ' on it, then Check.' : 'Drag each electron pair of this step to where it goes, then Check.' }, 'quiz');
    }
  }

  // 2. Any molecule: the twenty one molecules (and Build your own), pushed freely; your steps in the row, the notes here
  var anyBox = mk('div', 'ap2-dock');
  anyBox.innerHTML = '<div id="apAnyNotes" class="ap2-notes" role="status"></div><div id="apAnyHint"></div><div class="trow ap2-row" id="apAnyRow"></div>';
  var hintsAny = studio.hints({ label: 'Need a nudge?', hints: function(){ return S.ctx === 'any' && S.pick && S.pick.hint ? [esc(S.pick.hint)] : []; } });
  anyBox.querySelector('#apAnyHint').appendChild(hintsAny.card);
  anyBox.querySelector('#apAnyRow').appendChild(hintsAny.row);
  var anyAgain = mk('button', 'tchip', 'Start over'); anyAgain.type = 'button';
  anyAgain.addEventListener('click', function(){ loadAny(S.id === '__built' ? null : S.pick); });
  anyBox.querySelector('#apAnyRow').appendChild(anyAgain);
  function anyPanel(){
    var b = boards.any, el = byId('apAnyNotes');
    if(el) el.innerHTML = (b.notes || []).map(function(n){ return '<div class="tnote' + (n.warn ? ' tnote--warn' : '') + '"><span class="tnote__k">' + esc(n.k) + '</span>' + esc(n.text) + '</div>'; }).join('');
    if(hintsAny) hintsAny.paint();
    if(MODE.mode === 'quiz' && MODE.part === 'any')
      studio.task({ kicker: 'Test yourself', title: 'Push electrons on ' + esc(b.id === '__built' ? 'your molecule' : b.name) + '.', todo: 'Drag a lone pair or a bond to where it goes. Each real step is kept in the row; tap a card to go back to it.' }, 'quiz');
  }

  /* ====================================================================== */
  /* Modes                                                                   */
  /* ====================================================================== */
  function onShow(mode, part){
    cancelRuns(); hideCue(false); tourTurn.stop(); tapSrc = null; drag = null;
    if(drawn) B.endDragVis();
    MODE.mode = mode; MODE.part = part;
    stage.setAttribute('data-part', mode === 'quiz' ? part : 'explore');
    head.el.hidden = mode !== 'explore';
    studio.done(false, 'quiz');
    var want = mode === 'explore' ? 'explore' : part === 'chal' ? 'chal' : part === 'any' ? 'any' : 'check';
    // the Full explanation belongs to a finished challenge only
    if(want !== 'chal') whyEl.innerHTML = '';
    if(want === 'check'){ paintAll(); words(null); syncState(); return; }   // the quiz: the picture stays live as it was
    S = boards[want];
    // a step cut short: the board is on the last state it fully reached, nothing held from a drag
    if(S.ctx !== 'chal' && S.pendingSt && !S.pending.length) S.pendingSt = null;
    if(!S.start){
      if(want === 'explore') loadMech(MECHS[0]);
      else if(want === 'chal') startChal(CHALLENGES[0]);
      else loadAny(ALL[0]);
    } else { syncPicker(); paintAll(); words(null); }
    if(want === 'chal') chalPanel();
    if(want === 'any') anyPanel();
    syncState();
    if(mode === 'explore') placeCue();
  }

  var q = window.OchemToolState ? window.OchemToolState.read() : {};
  root.hidden = true;
  mountQuiz();
  var view = {};
  window.OchemArrowModel.view = view;
  var kitApi = Kit.kit2({
    stage: stage, ref: ref, onShow: onShow,
    parts: [
      { value:'chal', label:'Draw each step', dock: chalBox,
        task: function(){ return { kicker:'Test yourself', title: chal.def ? esc(chal.def.goal) : 'Draw each step', todo:'Drag each electron pair of this step to where it goes, then Check.' }; } },
      { value:'any', label:'Any molecule', dock: anyBox,
        task: function(){ return { kicker:'Test yourself', title:'Push electrons on any molecule', todo:'Drag a lone pair or a bond to where it goes.' }; } }],
    check: { label:'Check yourself: 6 questions',
      task: { kicker:'Test yourself', title:'Check yourself', todo:'Six quick questions on formal charge and octets. The picture stays live, so use it.' } }
  });
  view.kit = kitApi;
  /* "?" on a phone covers the whole stage: a step still moving stops there (the board keeps the last state it fully
     reached), as on a mode change. On a desktop the stage stays in view beside the sheet and carries on. */
  (function(){
    var sheet = studio.root.querySelector('.ls-sheet');
    if(!sheet || !window.MutationObserver) return;
    function check(){
      var open = studio.root.classList.contains('is-sheet') && !sheet.hidden;
      if(!open || !B.busy()) return;
      var r = sceneBox.getBoundingClientRect(), qq = sheet.getBoundingClientRect();
      var covered = qq.left <= r.left + 1 && qq.right >= r.right - 1 || (L && L.phone);
      if(!covered) return;
      cancelRuns(); if(S.ctx !== 'chal' && S.pendingSt && !S.pending.length) S.pendingSt = null; paintAll(); words(null);
    }
    var mo = new MutationObserver(check);
    mo.observe(studio.root, { attributes: true, attributeFilter: ['class'] });
    mo.observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
  })();
  byId('apRefHow').addEventListener('click', function(){ studio.close(); if(MODE.mode === 'explore') startTour(); });

  /* ---- start: a mechanism or molecule from the link, a challenge, a structure handed over, or SN2 */
  var m0 = MECHS.filter(function(m){ return m.id === q.start; })[0];
  var p0 = !m0 && q.start ? ALL.filter(function(p){ return p.id === q.start; })[0] : null;
  var c0 = q.chal ? CHALLENGES.filter(function(c){ return c.id === q.chal; })[0] : null;
  booting = true;
  if(MODE.mode === 'explore' && !boards.explore.start) loadMech(m0 || MECHS[0]);
  if(p0){ loadAny(p0); if(kitApi) kitApi.go('quiz', 'any'); }
  if(c0){ startChal(c0); if(kitApi) kitApi.go('quiz', 'chal'); }
  booting = false;
  if(q.build && window.OchemToolHandoff){
    var box = byId('apBuildBox');
    if(box){
      box.open = true;
      var api = openBuilder(), got = window.OchemToolHandoff.decode ? window.OchemToolHandoff.decode(q.build) : null;
      // the link carries the builder's own text form; a typed formula or name also works
      if(api){ var typedIn = byId('mbText'); if(typedIn && !got) typedIn.value = q.build; if(got && api.load) api.load(got); else api.build(q.build); }
    }
  }
  syncState();
  // a new size redraws the picture; the cue is placed again from the new drawing
  if(window.ResizeObserver) new ResizeObserver(function(){ if(!B.busy() && !drag){ paintAll(); if(cue) placeCue(); } }).observe(sceneBox);
  else window.addEventListener('resize', function(){ paintAll(); });
  paintAll(); words(null);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(!B.busy() && !drag){ paintAll(); if(cue) placeCue(); } });
})();
