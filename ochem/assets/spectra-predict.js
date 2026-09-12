/* Predicting an IR and a ¹H NMR from a structure.

   The Spectroscopy Lab held ten compounds, each with its bands and signals
   typed out by hand. Ten is enough to show what a spectrum is and nothing like
   enough to answer "what would MY compound look like", which is the question a
   problem set leaves you holding. So this works the same material out from the
   connectivity instead.

   Two honest caveats, both stated on screen rather than buried here.

   The IR is a lookup over functional groups, and that is genuinely how IR is
   read at this level — the carbonyl regions are narrow and well separated, and
   "1740 not 1715" really is how you tell an ester from a ketone. Those numbers
   are as good as the hand-typed ones.

   The NMR is an additive-increment estimate: a base value for a CH3, CH2 or
   CH, plus a contribution for each thing attached to it or next to it. That is
   the model every textbook teaches and it is good to a few tenths of a ppm for
   ordinary compounds. It is not a calculation from first principles and it
   will be wrong about anything unusual — conjugation stacked on conjugation,
   anisotropy, hydrogen bonding, anything aromatic and substituted. A predicted
   shift is a prediction.

   Equivalence is decided by a Morgan-style refinement rather than by symmetry
   detection: two carbons are equivalent if their environments are
   indistinguishable out to four bonds. That gets acetone's two methyls as one
   signal and ethanol's three carbons as two, which is what matters. */
(function(){
  var C = window.OchemChem;
  if(!C) return;

  function heavy(st){
    return Object.keys(st.atoms).filter(function(k){
      var a = st.atoms[k];
      return a.el && !a.group && a.el !== 'H';
    });
  }
  function hOn(st, k){
    var a = st.atoms[k];
    if(!a) return 0;
    var explicit = C.neighbors(st, k).filter(function(n){
      return st.atoms[n] && st.atoms[n].el === 'H';
    }).length;
    var implicit = a.hFixed !== undefined ? a.hFixed : (a.hImplicit || 0);
    return explicit + implicit;
  }
  function el(st, k){ return st.atoms[k] ? st.atoms[k].el : null; }
  function bondTo(st, a, b){
    var bd = C.findBond(st, a, b);
    return bd ? bd.order : 0;
  }
  function neighboursHeavy(st, k){
    return C.neighbors(st, k).filter(function(n){ return el(st, n) !== 'H'; });
  }

  /* ---- Rings and aromaticity ---------------------------------------------

     Not a Hückel analysis: a six-membered all-carbon ring in which every atom
     carries a double bond. That covers benzene and its substituted versions,
     which is every aromatic ring an Organic I spectroscopy question contains,
     and it declines to call anything else aromatic rather than guessing. */
  function ringsOf(st){
    var keys = heavy(st), found = [], seen = {};
    keys.forEach(function(start){
      var q = [[start]], guard = 0;
      while(q.length && guard++ < 900){
        var path = q.shift();
        var tail = path[path.length - 1];
        neighboursHeavy(st, tail).forEach(function(n){
          if(path.length > 1 && n === path[path.length - 2]) return;
          if(n === start && path.length >= 3 && path.length <= 6){
            var key = path.slice().sort().join(',');
            if(!seen[key]){ seen[key] = 1; found.push(path.slice()); }
            return;
          }
          if(path.indexOf(n) >= 0 || path.length >= 6) return;
          q.push(path.concat([n]));
        });
      }
    });
    return found;
  }

  function aromaticSet(st){
    var out = {};
    ringsOf(st).forEach(function(ring){
      if(ring.length !== 6) return;
      var ok = ring.every(function(k){
        if(el(st, k) !== 'C') return false;
        return C.bondsAt(st, k).some(function(b){ return b.order === 2; });
      });
      if(ok) ring.forEach(function(k){ out[k] = true; });
    });
    return out;
  }

  /* ---- What kind of carbonyl --------------------------------------------- */
  function carbonylKind(st, k){
    if(el(st, k) !== 'C') return null;
    var dbl = C.bondsAt(st, k).filter(function(b){
      var other = b.a === k ? b.b : b.a;
      return b.order === 2 && el(st, other) === 'O';
    });
    if(!dbl.length) return null;

    var others = neighboursHeavy(st, k).filter(function(n){
      return !(bondTo(st, k, n) === 2 && el(st, n) === 'O');
    });
    var hasOH = others.some(function(n){ return el(st, n) === 'O' && hOn(st, n) > 0; });
    var hasOR = others.some(function(n){ return el(st, n) === 'O' && hOn(st, n) === 0; });
    var hasN  = others.some(function(n){ return el(st, n) === 'N'; });
    var hasX  = others.some(function(n){ return ['Cl','Br','I','F'].indexOf(el(st, n)) >= 0; });
    if(hasOH) return 'acid';
    if(hasX)  return 'acylhalide';
    if(hasOR) return 'ester';
    if(hasN)  return 'amide';
    if(hOn(st, k) > 0) return 'aldehyde';
    return 'ketone';
  }

  /* ---- IR ----------------------------------------------------------------

     Positions and shapes from the same table the reference chart draws, so a
     predicted band and the region it lands in can never disagree. */
  var CARBONYL = {
    acid:       { cm:1710, w:24, d:80, label:'carboxylic acid C=O', note:'Near a ketone’s position, but you will never confuse them: the enormous O–H trough from 2500 to 3300 gives the acid away first.' },
    ester:      { cm:1740, w:22, d:80, label:'ester C=O',           note:'Higher than a ketone’s 1715. That 25 cm⁻¹ is the whole of how you separate an ester from a ketone, and it is reliable.' },
    amide:      { cm:1660, w:26, d:72, label:'amide C=O',           note:'The lowest carbonyl there is. The nitrogen lone pair delocalizes into the C=O, giving it real single-bond character and softening it.' },
    aldehyde:   { cm:1725, w:22, d:78, label:'aldehyde C=O',        note:'Just above a ketone. The two weak bands near 2820 and 2720 are what actually settle it — that C–H is the only thing separating an aldehyde from a ketone in an IR.' },
    ketone:     { cm:1715, w:22, d:78, label:'ketone C=O',          note:'The reference point every other carbonyl is quoted against.' },
    acylhalide: { cm:1800, w:22, d:82, label:'acyl halide C=O',     note:'The highest carbonyl in the course. The halogen pulls inductively on the carbonyl carbon and stiffens the bond.' }
  };

  function predictIR(st){
    var keys = heavy(st);
    var arom = aromaticSet(st);
    var bands = [];
    var seen = {};
    function add(b){
      if(seen[b.label]) return;
      seen[b.label] = 1;
      bands.push(b);
    }

    var kinds = {};
    keys.forEach(function(k){
      var kind = carbonylKind(st, k);
      if(kind) kinds[kind] = true;
    });

    var acidOH = false, alcoholOH = false, nh = 0, nhPrimary = false;
    var sp3CH = false, sp2CH = false, alkyneCH = false, aldehydeCH = false;
    var co = false, cc2 = false, cc3 = false, cn3 = false;

    keys.forEach(function(k){
      var e = el(st, k);
      if(e === 'O' && hOn(st, k) > 0){
        var onCarbonyl = neighboursHeavy(st, k).some(function(n){ return carbonylKind(st, n) === 'acid'; });
        if(onCarbonyl) acidOH = true; else alcoholOH = true;
      }
      /* A C–O STRETCH needs a C–O single bond. Counting the carbonyl's own
         double-bonded oxygen here put a 1100 band on acetaldehyde, which has
         no C–O single bond anywhere. */
      if(e === 'O' && neighboursHeavy(st, k).some(function(n){ return bondTo(st, k, n) === 1; })) co = true;
      if(e === 'N' && hOn(st, k) > 0){ nh++; if(hOn(st, k) >= 2) nhPrimary = true; }

      if(e === 'C'){
        var h = hOn(st, k);
        var groups = neighboursHeavy(st, k).length + h;
        var maxOrder = C.bondsAt(st, k).reduce(function(m, b){ return Math.max(m, b.order); }, 1);
        if(h > 0){
          if(arom[k] || (maxOrder === 2 && !carbonylKind(st, k))) sp2CH = true;
          else if(maxOrder === 3) alkyneCH = true;
          else if(carbonylKind(st, k) === 'aldehyde') aldehydeCH = true;
          else if(groups >= 4 || maxOrder === 1) sp3CH = true;
        }
        C.bondsAt(st, k).forEach(function(b){
          var other = b.a === k ? b.b : b.a;
          if(b.order === 2 && el(st, other) === 'C' && !arom[k]) cc2 = true;
          if(b.order === 3 && el(st, other) === 'C') cc3 = true;
          if(b.order === 3 && el(st, other) === 'N') cn3 = true;
        });
      }
    });

    if(acidOH) add({ cm:3000, w:420, d:48, label:'O–H (acid)',
      note:'The enormous trough from about 2500 to 3300 — wider than anything else in spectroscopy. A carboxylic acid dimerizes through two hydrogen bonds at once, and this is what that looks like.' });
    else if(alcoholOH) add({ cm:3350, w:180, d:55, label:'O–H stretch',
      note:'Broad and strong. The breadth is hydrogen bonding: every molecule sits in a slightly different environment, so the band is a blur of slightly different frequencies.' });

    if(nh) add({ cm:3350, w:70, d:40, label:'N–H stretch',
      note: nhPrimary
        ? 'A primary amine or amide, so expect TWO bands here — a symmetric and an antisymmetric stretch. Counting them tells you how substituted the nitrogen is.'
        : 'One band: the nitrogen carries a single hydrogen.' });

    if(alkyneCH) add({ cm:3300, w:14, d:45, label:'≡C–H',
      note:'A terminal alkyne. Sharp and narrow, sitting on top of the O–H region — the sharpness is how you tell them apart.' });
    if(sp2CH) add({ cm:3050, w:34, d:32, label:'sp² C–H',
      note:'Above 3000, which means alkene or aromatic. The line at 3000 is the one to watch.' });
    if(sp3CH) add({ cm:2950, w:44, d:36, label:'sp³ C–H',
      note:'Present in almost every organic compound, which is why it tells you almost nothing on its own — except when it is ABSENT.' });
    if(aldehydeCH) add({ cm:2770, w:60, d:22, label:'aldehyde C–H',
      note:'Two weak bands around 2820 and 2720. Small, easy to miss, and the one thing that separates an aldehyde from a ketone here.' });

    if(cn3) add({ cm:2245, w:14, d:50, label:'C≡N',
      note:'A nitrile, in a region where almost nothing else absorbs. One of the most reliable peaks in the whole spectrum.' });
    if(cc3) add({ cm:2120, w:14, d:24, label:'C≡C',
      note:'An alkyne, and weak — a symmetrical internal one can be invisible, because the stretch changes no dipole.' });

    Object.keys(kinds).forEach(function(kind){
      if(CARBONYL[kind]) add(CARBONYL[kind]);
    });

    if(Object.keys(arom).length) add({ cm:1600, w:26, d:40, label:'aromatic C=C',
      note:'Ring stretching. Usually two or three bands between 1450 and 1600, and taken together with sp² C–H above 3000 they are what say "aromatic".' });
    if(cc2) add({ cm:1650, w:20, d:30, label:'C=C stretch',
      note:'An alkene. Weak to medium — and weaker the more symmetrical the alkene is.' });

    if(co){
      // Esters put theirs near 1240 and give two strong bands; alcohols and
      // ethers sit lower. Quoting one position for both loses the distinction
      // the band is useful for.
      var esterCO = !!kinds.ester;
      add(esterCO
        ? { cm:1240, w:46, d:65, label:'C–O stretch',
            note:'Esters give two strong C–O bands in this region; ketones give none at all. Together with a carbonyl at 1740 that is an ester identified.' }
        : { cm:1050, w:46, d:58, label:'C–O stretch',
            note:'Strong, and confirms the oxygen sits in an alcohol or ether rather than only in a carbonyl.' });
    }

    bands.sort(function(a, b){ return b.cm - a.cm; });
    return bands;
  }

  /* ---- Equivalence -------------------------------------------------------

     Morgan refinement. Start every atom with a label describing only itself,
     then repeatedly replace each label with one built from its own plus its
     neighbours'. After four rounds two atoms share a label only if their
     surroundings match out to four bonds, which is the practical definition of
     "the same environment" for an NMR at this level. */
  function environments(st){
    var keys = heavy(st);
    var label = {};
    keys.forEach(function(k){
      label[k] = el(st, k) + ':' + hOn(st, k) + ':' + neighboursHeavy(st, k).length +
                 ':' + (C.formalCharge(st, k) || 0);
    });
    for(var round=0; round<4; round++){
      var next = {};
      keys.forEach(function(k){
        var around = neighboursHeavy(st, k).map(function(n){
          return bondTo(st, k, n) + label[n];
        }).sort().join('|');
        next[k] = label[k] + '{' + around + '}';
      });
      // Re-index to keep the strings from growing without bound.
      var pool = {}, id = 0;
      keys.forEach(function(k){
        if(pool[next[k]] === undefined) pool[next[k]] = ++id;
        label[k] = 'e' + pool[next[k]];
      });
    }
    return label;
  }

  /* ---- Is this the same molecule? ----------------------------------------

     The same refinement, but keeping the CONTENT of each label rather than
     re-indexing it, so two separately built structures can be compared. Hashed
     each round to stop the strings doubling in length, sorted at the end so
     the answer does not depend on which atom happened to be drawn first.

     This is a graph-isomorphism test by canonical labelling. It can in
     principle be fooled by a highly regular graph; nothing in a first-year
     spectroscopy problem comes close, and the failure mode is refusing to
     recognize a correct answer rather than accepting a wrong one. */
  function hash(str){
    var h = 5381;
    for(var i=0;i<str.length;i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function canonical(st){
    var keys = heavy(st);
    if(!keys.length) return '';
    var label = {};
    keys.forEach(function(k){
      label[k] = el(st, k) + hOn(st, k) + (C.formalCharge(st, k) || 0);
    });
    for(var round=0; round<5; round++){
      var next = {};
      keys.forEach(function(k){
        var around = neighboursHeavy(st, k).map(function(n){
          return bondTo(st, k, n) + label[n];
        }).sort().join('|');
        next[k] = hash(label[k] + '{' + around + '}');
      });
      label = next;
    }
    return C.formula(st) + '|' + keys.map(function(k){ return label[k]; }).sort().join(',');
  }

  /* ---- ¹H shifts ---------------------------------------------------------

     Base value for the carbon, plus an increment for every neighbour that
     pulls. The increments are the ones a course prints, and they are additive
     by assumption — which is the assumption the whole method rests on and the
     reason it drifts on anything heavily substituted. */
  var ALPHA = { O:2.3, N:1.4, F:2.6, Cl:2.2, Br:2.3, I:1.9, S:1.3 };
  var BETA  = { O:0.4, N:0.2, F:0.3, Cl:0.4, Br:0.4, I:0.4, S:0.2 };

  function predictNMR(st){
    var keys = heavy(st);
    var arom = aromaticSet(st);
    var env = environments(st);

    /* Every hydrogen-bearing heavy atom becomes a candidate signal; atoms in
       the same environment merge, which is what turns acetone's six hydrogens
       into one peak. */
    var groups = {};
    keys.forEach(function(k){
      var h = hOn(st, k);
      if(!h) return;
      var g = groups[env[k]] || (groups[env[k]] = { keys:[], h:0 });
      g.keys.push(k);
      g.h += h;
    });

    var signals = [];
    Object.keys(groups).forEach(function(e){
      var g = groups[e];
      var k = g.keys[0];
      var kind = el(st, k);
      var h = hOn(st, k);
      var ppm, label, note, mult = 's', j = null, exchangeable = false;

      if(kind === 'O'){
        var onAcid = neighboursHeavy(st, k).some(function(n){ return carbonylKind(st, n) === 'acid'; });
        ppm = onAcid ? 11.4 : 2.5;
        label = onAcid ? 'COOH' : 'OH';
        exchangeable = true;
        note = onAcid
          ? 'Further downfield than anything else in a first course, and diagnostic on its own. Broad, and it disappears when you shake the sample with D₂O.'
          : 'An O–H. The position moves with concentration, solvent and temperature — anywhere from 1 to 5 ppm — so it is the one shift never to reason from. It does not couple either: the proton swaps between molecules faster than the coupling can be felt.';
      } else if(kind === 'N'){
        ppm = 1.6; label = 'NH'; exchangeable = true;
        note = 'An N–H. Like an O–H, broad, variable in position, and exchangeable.';
      } else if(carbonylKind(st, k) === 'aldehyde'){
        ppm = 9.7; label = 'CHO';
        note = 'An aldehyde proton. Nothing else in an ordinary spectrum sits near 9.7, which makes this the single most useful signal there is.';
      } else if(arom[k]){
        ppm = 7.26; label = 'Ar–H';
        note = 'Aromatic. The ring current adds about 1.5 ppm on top of an ordinary alkene — substituents then push individual positions either side of 7.26, which is benzene’s own value.';
      } else {
        var maxOrder = C.bondsAt(st, k).reduce(function(m, b){ return Math.max(m, b.order); }, 1);
        if(maxOrder === 3){ ppm = 2.3; label = '≡C–H';
          note = 'A terminal alkyne proton. Further upfield than an alkene’s, which surprises people — the triple bond’s electron circulation shields it rather than deshielding it.'; }
        else if(maxOrder === 2){ ppm = 5.3; label = '=CH';
          note = 'On a double bond. The pi electrons circulate and deshield anything attached to them.'; }
        else {
          ppm = h >= 3 ? 0.9 : (h === 2 ? 1.25 : 1.5);
          label = h >= 3 ? 'CH₃' : (h === 2 ? 'CH₂' : 'CH');
        }

        // Attached and once-removed heteroatoms and carbonyls.
        neighboursHeavy(st, k).forEach(function(n){
          var e2 = el(st, n);
          var nCarbonyl = carbonylKind(st, n);

          if(ALPHA[e2]) ppm += ALPHA[e2];
          if(nCarbonyl) ppm += 1.2;
          if(arom[n]) ppm += 1.6;

          /* An oxygen whose other side is a carbonyl — the O of an ester —
             pulls harder than an ether oxygen. Ethyl acetate's OCH2 sits at
             4.12, a good half ppm past ethanol's 3.7, and that gap is
             exactly this. */
          if(e2 === 'O' && neighboursHeavy(st, n).some(function(m){
            return m !== k && carbonylKind(st, m);
          })) ppm += 0.55;

          // A nitrile or alkyne one bond away.
          if(e2 === 'C'){
            C.bondsAt(st, n).forEach(function(b){
              var far = b.a === n ? b.b : b.a;
              if(far === k) return;
              if(b.order === 3 && el(st, far) === 'N') ppm += 1.1;
              else if(b.order === 3 && el(st, far) === 'C') ppm += 0.9;
            });
          }

          neighboursHeavy(st, n).forEach(function(m){
            if(m === k) return;
            /* The beta term must not reach through a carbonyl carbon: its two
               oxygens have already been paid for by the +1.2 above, and adding
               them again put acetone's methyls at 2.5 instead of 2.17. */
            if(nCarbonyl) return;
            if(BETA[el(st, m)]) ppm += BETA[el(st, m)];
          });
        });
      }

      /* n+1, counting only hydrogens on neighbouring atoms that are in a
         DIFFERENT environment — hydrogens equivalent to these ones do not
         split them, which is why acetone is a singlet and not a septet. */
      if(!exchangeable && kind === 'C'){
        var nbH = 0, mixed = false, first = null;
        neighboursHeavy(st, k).forEach(function(n){
          if(env[n] === env[k]) return;
          if(el(st, n) === 'O' || el(st, n) === 'N') return;   // exchangeable, no coupling
          var count = hOn(st, n);
          if(!count) return;
          nbH += count;
          if(first === null) first = env[n];
          else if(first !== env[n]) mixed = true;
        });
        mult = nbH === 0 ? 's'
             : (mixed ? 'm'
             : (nbH === 1 ? 'd' : nbH === 2 ? 't' : nbH === 3 ? 'q' : nbH === 4 ? 'quint' : nbH === 5 ? 'sext' : 'm'));
        if(nbH) j = 7;
        if(!note){
          note = (nbH === 0
            ? 'A singlet: there is no hydrogen on any neighbouring carbon for this one to couple with.'
            : 'Split into ' + (nbH + 1) + ' lines by the ' + nbH + ' hydrogen' + (nbH === 1 ? '' : 's') +
              ' on the neighbouring carbon' + (mixed ? 's, which are not all equivalent — so in practice this is a multiplet rather than a clean n+1 pattern' : '') + '.');
        }
      }

      signals.push({
        ppm: Math.round(Math.max(0, Math.min(12, ppm)) * 100) / 100,
        h: g.h, mult: mult, j: j, label: label, note: note, exchangeable: exchangeable
      });
    });

    /* Ortho, meta and para hydrogens really are inequivalent, and the
       refinement is right to separate them — but an Organic I spectrum of a
       monosubstituted ring shows one lump around 7.2, and reporting toluene as
       five separate aromatic singlets describes a spectrum nobody has seen.
       They merge, and the note says what has been merged. */
    var aromatic = signals.filter(function(x){ return x.label === 'Ar–H'; });
    if(aromatic.length > 1){
      var totalH = aromatic.reduce(function(n, x){ return n + x.h; }, 0);
      var mean = aromatic.reduce(function(n, x){ return n + x.ppm * x.h; }, 0) / totalH;
      signals = signals.filter(function(x){ return x.label !== 'Ar–H'; });
      signals.push({
        ppm: Math.round(mean * 100) / 100, h: totalH, mult:'m', j:null, label:'Ar–H',
        note:'The ring hydrogens, as one multiplet. They are not actually equivalent — ortho, meta and para each sit ' +
             'slightly differently — but on a teaching-scale spectrum they overlap into a single lump near 7.2, and ' +
             'pulling them apart is what a higher-field instrument is for.',
        exchangeable:false
      });
    }

    signals.sort(function(a, b){ return a.ppm - b.ppm; });
    return signals;
  }

  function predict(st, name){
    return {
      id: 'predicted',
      name: name || st.name || 'Your compound',
      formula: C.formula(st),
      structure: name || '',
      predicted: true,
      ir: predictIR(st),
      nmr: predictNMR(st),
      tell: null
    };
  }

  window.OchemSpectra = {
    predict: predict,
    canonical: canonical,
    predictIR: predictIR,
    predictNMR: predictNMR,
    environments: environments,
    aromaticSet: aromaticSet,
    carbonylKind: carbonylKind
  };
})();
