/* Build your own molecule, and be told the truth about it.

   Every tool on this site used to open with a list. Seven molecules here,
   eleven species there, fifteen in the viewer — and no way to ask about the
   one you were actually stuck on. That is the difference between a
   demonstration and an instrument, and it is the reason a student who has
   just been confused by a structure in a problem set closes the tool again.

   The chemistry to fix it was already here. chem-core.js can compute a formal
   charge, count electrons, tell an octet from a violation and find the pieces
   a molecule has broken into; mol3d.js can generate real geometry from bond
   directions rather than stored coordinates. What was missing was the half in
   between: somewhere to put a structure a person made up, and the arithmetic
   that decides what it is.

   So this file is the model, and builder-ui.js is the canvas on top of it.

     normalize()  works out the hydrogens and lone pairs nobody drew
     check()      says what is wrong, in the words a marker would use
     parse()      reads 'CH3CH2OH' or 'acetone' into a structure
     to3D()       folds a flat drawing into the shape it really has

   The last one is the point of the whole exercise. A beginner's hardest jump
   is that the thing on the page and the thing in space are the same object,
   and no amount of looking at a fixed library of fifteen molecules builds it —
   you have to watch YOUR drawing stand up. */
(function(){
  var C = window.OchemChem;
  if(!C) return;

  /* ---- What an atom wants ------------------------------------------------

     The number of bonds an element forms at a given charge. This is a table
     rather than a formula because the formula has two exceptions and both of
     them matter: carbon, which loses a bond when it goes positive instead of
     gaining one (a carbocation has three bonds and an empty orbital), and
     boron, which gains one when it goes negative (borate is the octet boron
     usually does not have). A rule derived from "fill the shell" gets a
     carbocation wrong, and a carbocation is the single most important cation
     in the course. */
  var BONDS = {
    H:  { '-1':0, '0':1, '1':0 },
    Li: { '-1':0, '0':1, '1':0 },
    B:  { '-1':4, '0':3, '1':2 },
    C:  { '-1':3, '0':4, '1':3 },
    N:  { '-1':2, '0':3, '1':4 },
    O:  { '-1':1, '0':2, '1':3 },
    F:  { '-1':0, '0':1, '1':2 },
    Si: { '-1':3, '0':4, '1':3 },
    P:  { '-1':2, '0':3, '1':4 },
    S:  { '-1':1, '0':2, '1':3 },
    Cl: { '-1':0, '0':1, '1':2 },
    Br: { '-1':0, '0':1, '1':2 },
    I:  { '-1':0, '0':1, '1':2 }
  };

  /* The most bonds an atom of this element can hold at all, which is a
     different question from how many it wants. Third-row elements get room to
     expand, because sulfate and phosphate are correct chemistry and a tool
     that calls them errors teaches the wrong lesson. */
  var MAX_BONDS = {
    H:1, Li:1, B:4, C:4, N:4, O:3, F:1, Si:6, P:5, S:6, Cl:1, Br:1, I:1
  };

  function wantedBonds(el, charge){
    var row = BONDS[el];
    if(!row) return null;
    var key = String(Math.max(-1, Math.min(1, charge || 0)));
    return row[key] === undefined ? row['0'] : row[key];
  }
  function maxBonds(el){ return MAX_BONDS[el] === undefined ? 4 : MAX_BONDS[el]; }

  /* ---- Keeping a structure honest ---------------------------------------

     Called after every single edit. chem-core fixes the implicit-hydrogen
     count at parse time on purpose — an arrow moves electrons and must not be
     allowed to invent a hydrogen halfway through a mechanism — but a molecule
     being BUILT is the opposite situation: the drawing is not finished, and
     the hydrogens have to follow the bonds as they appear.

     Explicit bonds always win. If someone insists on five bonds to a carbon
     they get five bonds to a carbon, no hydrogens, and check() tells them what
     they have made rather than silently correcting it into something legal. */
  function normalize(st){
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k];
      if(!a.el || a.group){ a.hImplicit = 0; return; }
      var inf = C.info(a.el);
      if(!inf){ a.hImplicit = 0; return; }

      var drawn = C.bondsAt(st, k).reduce(function(n, b){ return n + b.order; }, 0);
      var want = wantedBonds(a.el, a.charge);
      /* A hydrogen count that was written down is a fact, not a default:
         CH2=CH2 and CH3CH3 differ only in that someone typed a 2. Editing the
         atom in the canvas clears hFixed, because at that point the drawing is
         the statement and the old text no longer is. */
      a.hImplicit = a.hFixed !== undefined
        ? a.hFixed
        : (a.noH ? 0 : Math.max(0, (want === null ? 0 : want) - drawn));

      var total = drawn + a.hImplicit;
      // Lone pairs are whatever is left over once the bonds are paid for.
      a.lp = Math.max(0, Math.round((inf.valence - total - (a.charge || 0)) / 2));
    });
    return st;
  }

  /* ---- What is wrong with it --------------------------------------------

     Three levels, because they are three different situations and flattening
     them into "invalid" is what makes a checker useless. An `error` cannot
     exist. A `warn` exists but is unusual enough that a student who drew it by
     accident should know. A `note` is just information about what they have.

     The wording matters as much as the check. "Invalid valence" teaches
     nothing; "carbon can hold 4 bonds and this one has 5" names the rule and
     the violation in the same breath. */
  function check(st){
    var problems = [];
    var keys = Object.keys(st.atoms);
    /* An atom that already has an impossible number of bonds will also have a
       formal charge that does not match and will usually push the electron
       count odd. Reporting all three is three sentences about one mistake, and
       the two extra ones are consequences rather than findings — so a hard
       error silences the softer notes about the same atom. */
    var broken = {};

    if(!keys.length){
      return { ok:true, empty:true, problems:[], formula:'', charge:0 };
    }

    keys.forEach(function(k){
      var a = st.atoms[k];
      if(!a.el || a.group) return;
      var inf = C.info(a.el);
      if(!inf){
        problems.push({ level:'error', at:k, msg: a.label + ' is not an element this tool knows.' });
        return;
      }

      var total = C.totalBonds(st, k);
      var cap = maxBonds(a.el);
      var name = inf.name;

      if(total > cap){
        broken[k] = true;
        problems.push({ level:'error', at:k, msg:
          name + ' can hold ' + cap + ' bond' + (cap === 1 ? '' : 's') + '. This one has ' + total +
          (a.hImplicit ? ' (' + (total - a.hImplicit) + ' drawn, plus ' + a.hImplicit + ' hydrogen' +
            (a.hImplicit === 1 ? '' : 's') + ')' : '') + '.' });
      } else if(C.overOctet(st, k)){
        broken[k] = true;
        problems.push({ level:'error', at:k, msg:
          name + ' has ' + C.electronCount(st, k) + ' electrons around it. The shell holds ' +
          C.octetOf(st, k) + '.' });
      }

      /* A charge the student asked for that the structure cannot deliver. It
         happens when explicit bonds outrun the charge — a "neutral" oxygen
         drawn with three bonds is an oxocation whether or not anyone typed a
         plus on it, and saying so is more useful than moving the bond. */
      var fc = C.formalCharge(st, k);
      if(fc !== (a.charge || 0) && !broken[k]){
        problems.push({ level:'warn', at:k, msg:
          'This ' + name.toLowerCase() + ' works out to ' + (fc > 0 ? '+' + fc : fc) +
          ', not ' + ((a.charge || 0) === 0 ? 'neutral' : ((a.charge > 0 ? '+' : '') + a.charge)) +
          '. Formal charge is valence minus lone-pair electrons minus bonds — it follows from what is drawn.' });
      }
    });

    /* An odd electron count is a radical. Organic I does not teach radicals as
       stable species, so this is nearly always a slip — but it is a real class
       of molecule, so it warns rather than errors. */
    var electrons = 0;
    keys.forEach(function(k){
      var a = st.atoms[k];
      if(!a.el || a.group) return;
      var inf = C.info(a.el);
      if(inf) electrons += inf.valence + (a.hImplicit || 0) * 1;
      electrons -= (a.charge || 0);
    });
    if(electrons % 2 === 1 && !Object.keys(broken).length){
      problems.push({ level:'warn', msg:
        'This has an odd number of electrons, which makes it a radical — one atom is left with a single unpaired electron rather than a pair.' });
    }

    var frags = C.fragments(st);
    if(frags.length > 1){
      problems.push({ level:'note', msg:
        'Two or more separate pieces. That is fine if you meant a reagent and a substrate side by side; it is a missing bond if you did not.' });
    }

    return {
      ok: !problems.some(function(p){ return p.level === 'error'; }),
      empty: false,
      problems: problems,
      fragments: frags.length,
      formula: C.formula(st),
      charge: keys.reduce(function(n, k){ return n + C.formalCharge(st, k); }, 0)
    };
  }

  /* ---- Reading a structure from text ------------------------------------

     Two front doors, because there are two ways a student refers to a
     molecule: by its condensed formula, which is what is written in their
     notes, and by its name, which is what is said out loud.

     The formula reader handles the notation an Organic I course actually
     writes — CH3CH2OH, CH3COCH3, (CH3)3CBr, CH3CH(CH3)CH3, with = and # for
     double and triple bonds. It is not SMILES and does not try to be; nobody
     taking this course writes SMILES, and a parser that demanded it would be
     a wall rather than a door.

     Rings do not survive condensed notation, so they come in by name instead —
     which is also how anyone asks for one. */

  var NAMES = {
    'water':'H2O', 'ammonia':'NH3', 'methane':'CH4', 'ethane':'CH3CH3',
    'propane':'CH3CH2CH3', 'butane':'CH3CH2CH2CH3', 'pentane':'CH3CH2CH2CH2CH3',
    'ethene':'CH2=CH2', 'ethylene':'CH2=CH2', 'propene':'CH3CH=CH2',
    'ethyne':'CH#CH', 'acetylene':'CH#CH',
    'methanol':'CH3OH', 'ethanol':'CH3CH2OH', 'propan-1-ol':'CH3CH2CH2OH',
    'isopropanol':'(CH3)2CHOH', '2-propanol':'(CH3)2CHOH',
    'tert-butanol':'(CH3)3COH', 'formaldehyde':'CH2=O', 'acetaldehyde':'CH3CH=O',
    'acetone':'CH3COCH3', 'butanone':'CH3COCH2CH3',
    'formic acid':'HCOOH', 'acetic acid':'CH3COOH', 'propanoic acid':'CH3CH2COOH',
    'methylamine':'CH3NH2', 'ethylamine':'CH3CH2NH2', 'trimethylamine':'(CH3)3N',
    'acetonitrile':'CH3C#N', 'hydrogen cyanide':'HC#N',
    'methyl chloride':'CH3Cl', 'chloromethane':'CH3Cl', 'bromomethane':'CH3Br',
    'bromoethane':'CH3CH2Br', 'tert-butyl bromide':'(CH3)3CBr',
    '2-bromopropane':'(CH3)2CHBr', 'dimethyl ether':'CH3OCH3',
    'diethyl ether':'CH3CH2OCH2CH3', 'methyl acetate':'CH3COOCH3',
    'acetamide':'CH3CONH2', 'hydroxide':'OH-', 'methoxide':'CH3O-',
    'ethoxide':'CH3CH2O-', 'acetate':'CH3COO-', 'cyanide':'C#N-',
    'ammonium':'NH4+', 'hydronium':'H3O+', 'carbon dioxide':'O=C=O',
    'tert-butyl cation':'(CH3)3C+', 'methyl cation':'CH3+'
  };

  /* Ring systems are declared as ring size plus what sits on each vertex,
     which is enough for the six or seven a first-year course draws and means
     the layout code can place them properly rather than as a broken chain. */
  var RINGS = {
    'benzene':        { n:6, aromatic:true },
    'cyclohexane':    { n:6 },
    'cyclopentane':   { n:5 },
    'cyclopropane':   { n:3 },
    'cyclobutane':    { n:4 },
    'cyclohexene':    { n:6, unsat:[[0,1]] },
    'toluene':        { n:6, aromatic:true, subs:{0:'CH3'} },
    'phenol':         { n:6, aromatic:true, subs:{0:'OH'} },
    'aniline':        { n:6, aromatic:true, subs:{0:'NH2'} },
    'chlorobenzene':  { n:6, aromatic:true, subs:{0:'Cl'} },
    'nitrobenzene':   { n:6, aromatic:true, subs:{0:'NO2'} },
    'benzoic acid':   { n:6, aromatic:true, subs:{0:'COOH'} },
    'cyclohexanol':   { n:6, subs:{0:'OH'} },
    'cyclohexanone':  { n:6, ketone:0 },
    'benzaldehyde':   { n:6, aromatic:true, subs:{0:'CHO'} },
    'p-xylene':       { n:6, aromatic:true, subs:{0:'CH3', 3:'CH3'} },
    'o-xylene':       { n:6, aromatic:true, subs:{0:'CH3', 1:'CH3'} },
    'styrene':        { n:6, aromatic:true, subs:{0:'CH=CH2'} },
    'anisole':        { n:6, aromatic:true, subs:{0:'OCH3'} },
    'acetophenone':   { n:6, aromatic:true, subs:{0:'COCH3'} }
  };

  /* ---- Tokenizer ---------------------------------------------------------

     A condensed formula is a flat sequence of element symbols, hydrogen
     counts, bond marks and parenthesised branches. The only genuinely awkward
     part is that a branch written BEFORE its anchor — (CH3)3C — attaches
     forward, while one written after it — CH(CH3) — attaches back. Both are
     standard and students write both, so the parser decides by whether
     anything bondable has been seen yet. */
  /* The condensed idioms. COOH is not C–O–O–H and never was; read literally
     it is a peroxide, which is the kind of confidently wrong answer a parser
     must never hand back. Each of these is rewritten into the connectivity it
     actually denotes before a single token is read.

     Nitro is written out with its charges because that IS the structure: a
     nitrogen with five bonds is the drawing students are marked down for, and
     a tool that produced one would be teaching it. */
  function expandMacros(s){
    return s
      .replace(/COOH/g, 'C(=O)OH')
      .replace(/COO(?!H)/g, 'C(=O)O')
      .replace(/CHO(?![A-Za-z])/g, 'CH=O')
      .replace(/NO2/g, 'N+(=O)O-')
      .replace(/SO3H/g, 'S(=O)(=O)OH')
      .replace(/CN(?![A-Za-z0-9])/g, 'C#N')
      // A CO followed by another chain — acetone's middle carbon. Deliberately
      // not before O or H, which are the two letters that mean something else.
      .replace(/CO(?=[BCFINPS(]|$)/g, 'C(=O)');
  }

  function tokenize(src){
    var s = expandMacros(String(src).replace(/\s+/g, ''));
    var toks = [], i = 0;

    while(i < s.length){
      var ch = s[i];

      if(ch === '(' ){
        var depth = 1, j = i + 1;
        while(j < s.length && depth > 0){
          if(s[j] === '(') depth++;
          else if(s[j] === ')') depth--;
          j++;
        }
        if(depth !== 0) return { error:'There is an unclosed bracket in that formula.' };
        var inner = s.slice(i + 1, j - 1);
        i = j;
        var mult = '';
        while(i < s.length && /[0-9]/.test(s[i])) mult += s[i++];
        toks.push({ t:'group', src:inner, n: mult ? parseInt(mult, 10) : 1 });
        continue;
      }

      if(ch === '=' || ch === '#'){ toks.push({ t:'bond', order: ch === '=' ? 2 : 3 }); i++; continue; }
      if(ch === '-' ){ toks.push({ t:'charge', q:-1 }); i++; continue; }
      if(ch === '+' ){ toks.push({ t:'charge', q: 1 }); i++; continue; }

      var m = /^([A-Z][a-z]?)/.exec(s.slice(i));
      if(!m) return { error:'"' + ch + '" is not something this reader understands.' };
      var el = m[1];
      if(!C.info(el)){
        // 'Cl' reads as one symbol, but a stray 'Xy' should say so by name.
        return { error:'"' + el + '" is not an element this tool knows.' };
      }
      i += el.length;
      var cnt = '';
      while(i < s.length && /[0-9]/.test(s[i])) cnt += s[i++];
      toks.push({ t:'atom', el:el, n: cnt ? parseInt(cnt, 10) : 1 });
    }
    return { toks: toks };
  }

  /* Turn tokens into atoms and bonds. Hydrogens written in the formula are
     absorbed into the heavy atom they follow rather than placed as atoms:
     CH3 is one carbon that happens to know it has three hydrogens, which is
     what makes the drawing readable and the arithmetic identical. */
  function assemble(toks, st, attachTo, seq){
    var prev = attachTo === undefined ? null : attachTo;
    var firstInThisRun = null;
    var pendingOrder = 1;
    var pendingBranches = [];
    var pendingH = 0;          // hydrogens written before the atom they belong to

    for(var i=0;i<toks.length;i++){
      var tk = toks[i];

      if(tk.t === 'bond'){ pendingOrder = tk.order; continue; }

      if(tk.t === 'charge'){
        var last = seq.last;
        if(last) st.atoms[last].charge = (st.atoms[last].charge || 0) + tk.q;
        continue;
      }

      if(tk.t === 'group'){
        if(prev === null){
          // Written before its anchor: hold it until the anchor shows up.
          pendingBranches.push(tk);
        } else {
          for(var g=0; g<tk.n; g++){
            var sub = tokenize(tk.src);
            if(sub.error) return sub;
            var r = assemble(sub.toks, st, prev, seq);
            if(r && r.error) return r;
          }
        }
        continue;
      }

      // An atom token. Hydrogens fold into whatever came before them...
      if(tk.el === 'H' && prev !== null && st.atoms[prev] && st.atoms[prev].el !== 'H'){
        st.atoms[prev].hExplicit = (st.atoms[prev].hExplicit || 0) + tk.n;
        continue;
      }
      /* ...and, when nothing came before, into whatever comes next. H2O and
         HCOOH both lead with their hydrogens, and reading them left to right
         as written would chain hydrogen to hydrogen — H–H–O rather than
         water. */
      if(tk.el === 'H' && prev === null){
        pendingH += tk.n;
        continue;
      }

      for(var c=0; c<tk.n; c++){
        var key = 'a' + (++seq.id);
        st.atoms[key] = {
          el: tk.el, label: tk.el, group:false,
          x:0, y:0, r: tk.el === 'H' ? 12 : 18,
          lp:0, charge:0, hImplicit:0
        };
        if(prev !== null){
          st.bonds.push({ a:prev, b:key, order: pendingOrder });
          pendingOrder = 1;
        }
        if(pendingH){
          st.atoms[key].hExplicit = (st.atoms[key].hExplicit || 0) + pendingH;
          pendingH = 0;
        }
        // Branches that were waiting for an anchor hang off this atom.
        if(pendingBranches.length){
          for(var p=0;p<pendingBranches.length;p++){
            var pb = pendingBranches[p];
            for(var q=0;q<pb.n;q++){
              var subp = tokenize(pb.src);
              if(subp.error) return subp;
              var rp = assemble(subp.toks, st, key, seq);
              if(rp && rp.error) return rp;
            }
          }
          pendingBranches = [];
        }
        if(firstInThisRun === null) firstInThisRun = key;
        seq.last = key;
        // A branch continues from its own last atom; the main chain does too.
        prev = key;
      }
    }

    if(pendingH && firstInThisRun === null && prev === null){
      // H2 and nothing else: real, and the only case where a leading hydrogen
      // has nothing to fold into.
      for(var h=0; h<pendingH; h++){
        var hk = 'a' + (++seq.id);
        st.atoms[hk] = { el:'H', label:'H', group:false, x:0, y:0, r:12, lp:0, charge:0, hImplicit:0, noH:true };
        if(h > 0) st.bonds.push({ a:'a' + seq.id - 1, b:hk, order:1 });
        seq.last = hk;
      }
      pendingH = 0;
    }
    if(pendingBranches.length) return { error:'That formula ends with a group that is not attached to anything.' };
    return { first: firstInThisRun };
  }

  function ringStructure(spec){
    var st = { atoms:{}, bonds:[], name:null };
    var keys = [];
    for(var i=0;i<spec.n;i++){
      var k = 'r' + (i + 1);
      keys.push(k);
      st.atoms[k] = { el:'C', label:'C', group:false, x:0, y:0, r:18, lp:0, charge:0, hImplicit:0 };
    }
    for(var j=0;j<spec.n;j++){
      var order = 1;
      // Benzene alternates formally, which is what a student draws and what
      // the resonance tools then have something to say about.
      if(spec.aromatic) order = (j % 2 === 0) ? 2 : 1;
      if(spec.unsat) spec.unsat.forEach(function(pair){
        if((pair[0] === j && pair[1] === (j + 1) % spec.n)) order = 2;
      });
      st.bonds.push({ a:keys[j], b:keys[(j + 1) % spec.n], order:order });
    }
    st.ring = keys.slice();

    var seq = { id: spec.n, last:null };
    if(spec.ketone !== undefined){
      var ok = 'a' + (++seq.id);
      st.atoms[ok] = { el:'O', label:'O', group:false, x:0, y:0, r:18, lp:2, charge:0, hImplicit:0 };
      st.bonds.push({ a:keys[spec.ketone], b:ok, order:2 });
    }
    if(spec.subs){
      Object.keys(spec.subs).forEach(function(pos){
        var sub = tokenize(spec.subs[pos]);
        if(sub.error) return;
        assemble(sub.toks, st, keys[parseInt(pos, 10)], seq);
      });
    }
    return st;
  }

  function parse(text){
    var raw = String(text || '').trim();
    if(!raw) return { error:'Type a formula or a name.' };

    var lower = raw.toLowerCase();
    if(RINGS[lower]){
      var rst = ringStructure(RINGS[lower]);
      rst.name = raw;
      absorbExplicitH(rst);
      layout(rst);
      normalize(rst);
      return { st: rst };
    }
    if(NAMES[lower]) raw = NAMES[lower];

    var tk = tokenize(raw);
    if(tk.error) return { error: tk.error };
    if(!tk.toks.length) return { error:'Nothing to build there.' };

    var st = { atoms:{}, bonds:[], name: (NAMES[lower] || RINGS[lower]) ? text : null };
    var seq = { id:0, last:null };
    var res = assemble(tk.toks, st, undefined, seq);
    if(res && res.error) return { error: res.error };
    if(!Object.keys(st.atoms).length) return { error:'That did not contain an atom this reader could place.' };

    absorbExplicitH(st);
    layout(st);
    normalize(st);
    return { st: st };
  }

  /* Hydrogens typed into the formula become a floor on the implicit count, so
     CH2 stays a CH2 — a carbon someone deliberately drew with two hydrogens
     is a carbon with two hydrogens, even where the valence rules would have
     handed it three. Without this, CH2=CH2 and CH3CH3 parse to the same
     thing, which is the difference between an alkene and an alkane. */
  function absorbExplicitH(st){
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k];
      if(a.hExplicit === undefined) return;
      a.hFixed = a.hExplicit;
      delete a.hExplicit;
    });
  }

  /* ---- Laying a parsed structure out on the page -------------------------

     A zig-zag, because that is how a chain is drawn and because straight-line
     placement makes every bond angle 180° and every drawing a lie. Rings are
     placed as rings first and everything else grows off whatever is already
     down, breadth-first, fanning into the space that is still free. */
  function layout(st){
    var keys = Object.keys(st.atoms);
    if(!keys.length) return st;

    var placed = {}, order = [];
    var STEP = 42;

    if(st.ring && st.ring.length){
      var n = st.ring.length;
      var rad = n <= 4 ? 34 : (n === 5 ? 40 : 46);
      st.ring.forEach(function(k, i){
        var ang = -Math.PI/2 + i * 2*Math.PI/n;
        st.atoms[k].x = 160 + rad * Math.cos(ang);
        st.atoms[k].y = 85  + rad * Math.sin(ang);
        placed[k] = true;
        order.push(k);
      });
    } else {
      var first = keys[0];
      st.atoms[first].x = 60;
      st.atoms[first].y = 95;
      placed[first] = true;
      order.push(first);
    }

    /* Each new neighbour is fanned around the direction the chain is already
       travelling, rather than stacked in the next column. The first version
       offset them by a fixed +34/-34 and gave tert-butyl bromide four
       substituents in three places — two of them exactly on top of each other,
       which looked like the parser had lost a bond. */
    var parent = {};
    var zig = 1;
    var STEP_R = 46;

    for(var i=0;i<order.length;i++){
      var k = order[i];
      var base = st.atoms[k];
      var open = C.neighbors(st, k).filter(function(n){ return !placed[n]; });
      if(!open.length) continue;

      var inAng;
      if(st.ring && st.ring.indexOf(k) >= 0){
        // Out of the ring, away from its centre.
        inAng = Math.atan2(base.y - 85, base.x - 160);
      } else if(parent[k]){
        var pp = st.atoms[parent[k]];
        inAng = Math.atan2(base.y - pp.y, base.x - pp.x);
      } else {
        inAng = 0;
      }

      var n = open.length;
      var SPREAD = 70 * Math.PI / 180;
      open.forEach(function(nb, idx){
        var ang;
        if(n === 1 && !(st.ring && st.ring.indexOf(k) >= 0)){
          // A plain chain zig-zags rather than running straight, because a
          // 180° bond angle is a drawing nobody would accept on paper.
          zig = -zig;
          ang = inAng + zig * 30 * Math.PI / 180;
        } else {
          ang = inAng + (idx - (n - 1) / 2) * SPREAD;
        }
        st.atoms[nb].x = Math.round(base.x + STEP_R * Math.cos(ang));
        st.atoms[nb].y = Math.round(base.y + STEP_R * Math.sin(ang));
        parent[nb] = k;
        placed[nb] = true;
        order.push(nb);
      });
    }

    spreadOut(st);
    centre(st);
    st.viewBox = '0 0 320 170';
    return st;
  }

  /* A last pass that pushes apart anything that still landed on top of
     something else. The fan above keeps siblings apart, but two branches that
     grew from different atoms can still meet, and two circles sharing a centre
     is the one drawing a student cannot read at all. */
  function spreadOut(st){
    var keys = Object.keys(st.atoms);
    for(var pass=0; pass<24; pass++){
      var moved = false;
      for(var i=0;i<keys.length;i++){
        for(var j=i+1;j<keys.length;j++){
          var a = st.atoms[keys[i]], b = st.atoms[keys[j]];
          var dx = b.x - a.x, dy = b.y - a.y;
          var d = Math.sqrt(dx*dx + dy*dy);
          var want = a.r + b.r + 8;
          if(d >= want) continue;
          if(d < 0.01){ dx = 1; dy = 0; d = 1; }     // exactly coincident
          var push = (want - d) / 2;
          var ux = dx/d, uy = dy/d;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
          moved = true;
        }
      }
      if(!moved) break;
    }
    keys.forEach(function(k){
      st.atoms[k].x = Math.round(st.atoms[k].x);
      st.atoms[k].y = Math.round(st.atoms[k].y);
    });
    return st;
  }

  /* Whatever the walk produced, sit it in the middle of the frame — and shrink
     it if it grew past the edges. Without this a four-carbon chain starts at
     the left margin and a branch off the end lands half outside the canvas,
     which reads as a bug in the molecule rather than in the layout. */
  function centre(st){
    var keys = Object.keys(st.atoms);
    if(!keys.length) return st;

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    keys.forEach(function(k){
      var a = st.atoms[k], pad = a.r + 10;   // room for charges and lone pairs
      minX = Math.min(minX, a.x - pad); maxX = Math.max(maxX, a.x + pad);
      minY = Math.min(minY, a.y - pad); maxY = Math.max(maxY, a.y + pad);
    });

    var w = maxX - minX, h = maxY - minY;
    var k2 = Math.min(1, Math.min(320 / w, 170 / h));
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;

    keys.forEach(function(k){
      var a = st.atoms[k];
      a.x = Math.round(160 + (a.x - cx) * k2);
      a.y = Math.round(85  + (a.y - cy) * k2);
      if(k2 < 1) a.r = Math.max(11, Math.round(a.r * k2));
    });
    return st;
  }

  /* ---- Flat drawing to real shape ---------------------------------------

     The payoff. A structure has connectivity and nothing else — the x and y
     above are where the atoms sit on the page, not where they sit in space,
     and anyone who has drawn a tetrahedral carbon as a cross knows the
     difference matters.

     So the geometry is rebuilt from scratch. Every atom's electron-group count
     picks its shape, mol3d's completions give the directions, covalent radii
     give the distances, and the hydrogens and lone pairs are left to mol3d's
     own filler so a built molecule is placed by exactly the same code as a
     library one. Rings are laid down first — grown one bond at a time they
     would never close. */
  function to3D(st){
    var M3 = window.OchemMol3D;
    if(!M3) return { error:'The 3D engine is not loaded on this page.' };

    var keys = Object.keys(st.atoms).filter(function(k){
      var a = st.atoms[k];
      return a.el && !a.group;
    });
    if(!keys.length) return { error:'There is nothing to fold up yet.' };

    var frags = C.fragments(st);
    if(frags.length > 1){
      return { error:'This is ' + frags.length + ' separate pieces. Bond them together, or view them one at a time.' };
    }

    function groupsAt(k){
      var a = st.atoms[k];
      return C.bondsAt(st, k).length + hydrogensAt(k) + (a.lp || 0);
    }
    function hydrogensAt(k){
      var a = st.atoms[k];
      return a.hFixed !== undefined ? a.hFixed : (a.hImplicit || 0);
    }

    var pos = {}, ringSet = {};
    var ring = findRing(st, keys);

    if(ring && ring.length >= 3){
      /* Saturated six-rings are puckered, because a flat cyclohexane is the
         single most persistent wrong picture in the course and drawing one
         here would teach it again. Anything aromatic or small stays planar,
         which is also correct. */
      var allSp3 = ring.every(function(k){ return groupsAt(k) >= 4; });
      var pucker = (ring.length === 6 && allSp3) ? 0.25 : 0;
      var pts = M3.ringPoints(ring.length, ring.length <= 4 ? 0.95 : 1.42, pucker);
      ring.forEach(function(k, i){ pos[k] = pts[i]; ringSet[k] = true; });
    } else {
      pos[keys[0]] = M3.v(0, 0, 0);
    }

    /* Breadth-first outward from whatever is already placed. The plane
       normal handed to the trigonal completion is kept constant so a chain of
       sp² centres comes out flat, the way a conjugated system actually is. */
    var queue = Object.keys(pos);
    var guard = 0;
    while(queue.length && guard++ < 400){
      var k = queue.shift();
      var here = pos[k];
      var existing = C.neighbors(st, k)
        .filter(function(n){ return pos[n]; })
        .map(function(n){ return M3.sub(pos[n], here); });

      var open = C.neighbors(st, k).filter(function(n){ return !pos[n]; });
      if(!open.length) continue;

      var steric = groupsAt(k);
      var dirs = M3.completeGeometry(existing, open.length, steric, M3.v(0, 0, 1));

      open.forEach(function(nb, i){
        var bond = C.findBond(st, k, nb);
        var len = M3.bondLength(st.atoms[k].el, st.atoms[nb].el, bond ? bond.order : 1);
        var d = dirs[i] || dirs[dirs.length - 1] || M3.v(1, 0, 0);
        pos[nb] = M3.add(here, M3.mul(M3.norm(d), len));
        queue.push(nb);
      });
    }

    // Centre it, so the viewer's fit-to-frame has something symmetric to work with.
    var placedKeys = Object.keys(pos);
    var cen = placedKeys.reduce(function(acc, k){ return M3.add(acc, pos[k]); }, M3.v(0,0,0));
    cen = M3.mul(cen, 1 / placedKeys.length);

    var index = {}, atoms = [], fill = [];
    placedKeys.forEach(function(k, i){
      index[k] = i;
      atoms.push({ el: st.atoms[k].el, pos: M3.sub(pos[k], cen), label: st.atoms[k].el });
    });

    var bonds = st.bonds.filter(function(b){
      return b.order > 0 && index[b.a] !== undefined && index[b.b] !== undefined;
    }).map(function(b){
      return { a:index[b.a], b:index[b.b], order:b.order };
    });

    placedKeys.forEach(function(k){
      var h = hydrogensAt(k), lp = st.atoms[k].lp || 0;
      if(!h && !lp) return;
      fill.push({
        at: index[k], h: h, lp: lp,
        geom: groupsAt(k),
        len: M3.bondLength(st.atoms[k].el, 'H', 1)
      });
    });

    var mol = M3.build({
      name: st.name || 'Your molecule',
      formula: C.formula(st),
      atoms: atoms, bonds: bonds, fill: fill,
      focus: 0
    });
    mol.approximate = !!(ring && countRings(st, keys) > 1);
    return { mol: mol };
  }

  /* Smallest cycle through the structure, found by walking out from each atom
     until the walk comes back. Good enough for the one ring a first-year
     molecule usually has; fused systems get the first ring placed properly and
     the rest grown off it, which is approximate and says so. */
  function findRing(st, keys){
    for(var i=0;i<keys.length;i++){
      var start = keys[i];
      var q = [[start]], seen = {};
      var guard = 0;
      while(q.length && guard++ < 600){
        var path = q.shift();
        var tail = path[path.length - 1];
        var nbs = C.neighbors(st, tail);
        for(var j=0;j<nbs.length;j++){
          var n = nbs[j];
          if(path.length > 1 && n === path[path.length - 2]) continue;
          if(n === start && path.length >= 3) return path;
          if(path.indexOf(n) >= 0) continue;
          if(path.length > 7) continue;
          var key = path.length + ':' + n;
          if(seen[key]) continue;
          seen[key] = true;
          q.push(path.concat([n]));
        }
      }
    }
    return null;
  }

  function countRings(st, keys){
    // Cyclomatic: bonds − atoms + components. Cheap and exact.
    var bonds = st.bonds.filter(function(b){ return b.order > 0; }).length;
    return bonds - keys.length + C.fragments(st).length;
  }

  /* ---- The library, searchable ------------------------------------------

     molecules.js already holds a couple of hundred structures with real
     coordinates, drawn for practice questions. There is no reason a tool
     should make anyone rebuild acetyl chloride by hand when it is sitting
     right there, so name search reaches into it and hands back a structure. */
  function search(q){
    var Mol = window.OchemMolecules;
    if(!Mol || !q) return [];
    var needle = String(q).toLowerCase().trim();
    if(!needle) return [];
    var out = [];
    Object.keys(Mol.ALL).forEach(function(id){
      var m = Mol.ALL[id];
      var hay = ((m.name || '') + ' ' + id).toLowerCase();
      if(hay.indexOf(needle) >= 0){
        out.push({ id:id, name:m.name || id, formula:m.formula || '' });
      }
    });
    out.sort(function(a, b){ return a.name.length - b.name.length; });
    return out.slice(0, 12);
  }

  function fromLibrary(id){
    var Mol = window.OchemMolecules;
    if(!Mol) return null;
    var m = Mol.get(id);
    if(!m) return null;
    var st = C.fromMolecule(m);
    st.id = id;
    return st;
  }

  function blank(){
    return { atoms:{}, bonds:[], name:null, viewBox:'0 0 320 170' };
  }

  window.OchemBuilder = {
    BONDS: BONDS,
    MAX_BONDS: MAX_BONDS,
    NAMES: NAMES,
    RINGS: RINGS,
    expandMacros: expandMacros,
    wantedBonds: wantedBonds,
    maxBonds: maxBonds,
    blank: blank,
    normalize: normalize,
    check: check,
    parse: parse,
    layout: layout,
    centre: centre,
    spreadOut: spreadOut,
    to3D: to3D,
    search: search,
    fromLibrary: fromLibrary,
    findRing: findRing
  };
})();
