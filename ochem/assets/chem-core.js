/* Chemistry semantics for the interactive tools.

   molecules.js knows how to DRAW a molecule; it does not know what one is.
   Its atoms carry a label ('O'), a lone-pair count for the dots, and a
   charge as a display string ('⁻') — enough to render, not enough to reason
   with. Nothing in the file can answer "does this nitrogen have room for
   another bond", which is exactly the question every tool here turns on.

   So this is the other half: the same molecules read as structures rather
   than pictures. Atoms become {el, lp, charge:number}, bonds keep their
   order, and from those two facts everything else falls out — formal charge,
   electron count, whether an octet is blown, what a curved arrow actually
   does to the molecule it is drawn on.

   The important piece is apply(): a set of curved arrows in, a new structure
   out. That is what turns arrow-pushing from a drawing exercise into a
   question with a consequence, and it is why the tools can grade a student's
   arrows without anyone hand-writing an answer key for every molecule. The
   rules are mechanical (octets, valence, where electrons may come from), not
   a lookup table, so they hold for structures nobody anticipated.

   Arrows are applied SIMULTANEOUSLY, not one after another, which matters:
   in an SN2 the nucleophile's arrow alone would put ten electrons on carbon,
   and only the leaving group's arrow in the same step saves it. Sequencing
   them would report a violation that the real mechanism never has. So every
   arrow contributes a delta, the deltas are summed, and the octet check runs
   once on the result. */
(function(){

  /* Valence electrons and octet capacity — the two numbers every check here
     needs. `expand` marks the third-row elements that may legitimately hold
     more than eight (sulfur in a sulfoxide, phosphorus in a ylide), so the
     tools don't cry foul at correct chemistry. */
  var EL = {
    H:  { z:1,  valence:1, octet:2,  en:2.20, name:'Hydrogen' },
    Li: { z:3,  valence:1, octet:2,  en:0.98, name:'Lithium' },
    B:  { z:5,  valence:3, octet:6,  en:2.04, name:'Boron' },
    C:  { z:6,  valence:4, octet:8,  en:2.55, name:'Carbon' },
    N:  { z:7,  valence:5, octet:8,  en:3.04, name:'Nitrogen' },
    O:  { z:8,  valence:6, octet:8,  en:3.44, name:'Oxygen' },
    F:  { z:9,  valence:7, octet:8,  en:3.98, name:'Fluorine' },
    Na: { z:11, valence:1, octet:2,  en:0.93, name:'Sodium' },
    Mg: { z:12, valence:2, octet:4,  en:1.31, name:'Magnesium' },
    Si: { z:14, valence:4, octet:8,  en:1.90, name:'Silicon', expand:true },
    P:  { z:15, valence:5, octet:8,  en:2.19, name:'Phosphorus', expand:true },
    S:  { z:16, valence:6, octet:8,  en:2.58, name:'Sulfur', expand:true },
    Cl: { z:17, valence:7, octet:8,  en:3.16, name:'Chlorine' },
    Br: { z:35, valence:7, octet:8,  en:2.96, name:'Bromine' },
    I:  { z:53, valence:7, octet:8,  en:2.66, name:'Iodine' },
    Mg2:{ z:12, valence:2, octet:4,  en:1.31, name:'Magnesium' }
  };

  /* Display order for a molecular formula: carbon, then hydrogen, then
     everything else alphabetically. Hill notation, the convention every
     textbook prints. */
  function hillOrder(a, b){
    if(a === b) return 0;
    if(a === 'C') return -1;
    if(b === 'C') return 1;
    if(a === 'H') return -1;
    if(b === 'H') return 1;
    return a < b ? -1 : 1;
  }

  var SUB = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉' };
  function sub(n){ return String(n).split('').map(function(c){ return SUB[c] || c; }).join(''); }

  /* Charges live as numbers inside a structure and as glyphs on the way out,
     because molecules.js prints atom.charge straight into the SVG label. */
  function chargeGlyph(c){
    if(!c) return '';
    var mag = Math.abs(c) === 1 ? '' : String(Math.abs(c)).split('').map(function(d){
      return { '2':'²','3':'³','4':'⁴' }[d] || d;
    }).join('');
    return mag + (c > 0 ? '⁺' : '⁻');
  }
  function parseCharge(c){
    if(typeof c === 'number') return c;
    if(!c) return 0;
    var s = String(c);
    var sign = s.indexOf('⁻') !== -1 || s.indexOf('-') !== -1 ? -1 : 1;
    var mag = 1;
    if(s.indexOf('²') !== -1 || s.indexOf('2') !== -1) mag = 2;
    if(s.indexOf('³') !== -1 || s.indexOf('3') !== -1) mag = 3;
    return sign * mag;
  }

  /* A label is only an ELEMENT when it is exactly one. 'O' is an oxygen we
     can reason about; 'OH' and 'CH₃' are condensed groups drawn as a single
     blob, and their internals are not on the page. Reading 'OH' as an oxygen
     would have the checks invent five hydrogens to fill its valence, so the
     match is deliberately exact and everything else is flagged as a group. */
  function elementOf(label){
    var s = String(label || '').replace(/[₀-₉0-9⁺⁻²³]/g, '');
    return EL[s] ? s : null;
  }

  // The atom a condensed group is attached THROUGH — 'CH₂OH' hangs off its
  // carbon. Enough for electronegativity talk; not enough for valence math.
  function anchorElement(label){
    var s = String(label || '').replace(/[₀-₉0-9⁺⁻²³]/g, '');
    var m = /^([A-Z][a-z]?)/.exec(s);
    return m && EL[m[1]] ? m[1] : null;
  }

  function info(el){ return EL[el] || null; }

  /* ---- Structures ------------------------------------------------------

     A structure is the computable twin of a molecules.js entry, and keeps
     every field the renderer needs (x, y, r, label) so one can be turned
     back into the other without losing the drawing. */

  function fromMolecule(mol){
    if(!mol) return null;
    var atoms = {};
    Object.keys(mol.atoms).forEach(function(k){
      var a = mol.atoms[k];
      var el = elementOf(a.label);
      atoms[k] = {
        el: el || anchorElement(a.label),
        group: !el,                       // 'OH', 'CH₃' — drawn as one unit
        label: a.label,
        x: a.x, y: a.y, r: a.r,
        lp: a.lp || 0,
        charge: parseCharge(a.charge),
        hImplicit: 0,
        role: a.role, roles: a.roles, note: a.note
      };
    });
    var st0 = {
      id: mol.id || null,
      name: mol.name,
      caption: mol.caption,
      viewBox: mol.viewBox,
      atoms: atoms,
      bonds: (mol.bonds || []).map(function(b){
        return { a:b.a, b:b.b, order:b.order || 1, style:b.style };
      })
    };
    countImplicitHydrogens(st0);
    return st0;
  }

  /* Skeletal drawings leave hydrogens off, and the tools cannot afford to
     pretend they are not there: a carbon drawn with one bond is not a
     tricationic carbon, it is a methyl with three hydrogens nobody drew. So
     once, at parse time, work out how many are implied and keep the number.

     From FC = valence − 2·lp − bonds, the bond count an atom needs in order
     to carry the charge it is DRAWN with is valence − 2·lp − charge. Anything
     that count exceeds the bonds actually drawn is hydrogen. Fixed at parse
     time and never recomputed, because an arrow moves electrons — it does not
     add or remove hydrogens, and re-deriving the count afterwards would let a
     new bond silently evict one. */
  function countImplicitHydrogens(st){
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k];
      if(!a.el || a.group){ a.hImplicit = 0; return; }
      var want = info(a.el).valence - 2 * a.lp - a.charge;
      a.hImplicit = Math.max(0, want - bondOrderSum(st, k));
    });
  }

  function clone(st){
    var atoms = {};
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k], c = {};
      Object.keys(a).forEach(function(f){ c[f] = a[f]; });
      atoms[k] = c;
    });
    return {
      id: st.id, name: st.name, caption: st.caption, viewBox: st.viewBox,
      atoms: atoms,
      bonds: st.bonds.map(function(b){ return { a:b.a, b:b.b, order:b.order, style:b.style }; })
    };
  }

  /* Back to something molecules.js can draw. Bonds of order 0 are dropped
     rather than drawn as nothing, so a bond that broke visibly disappears. */
  function toMolecule(st){
    var atoms = {};
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k];
      atoms[k] = {
        x:a.x, y:a.y, r:a.r, label:a.label, lp:a.lp,
        charge: chargeGlyph(a.charge),
        role:a.role, roles:a.roles, note:a.note
      };
    });
    return {
      name: st.name, caption: st.caption, viewBox: st.viewBox,
      atoms: atoms,
      bonds: st.bonds.filter(function(b){ return b.order > 0; })
                     .map(function(b){ return { a:b.a, b:b.b, order:b.order, style:b.style }; })
    };
  }

  function findBond(st, a, b){
    for(var i=0;i<st.bonds.length;i++){
      var x = st.bonds[i];
      if((x.a === a && x.b === b) || (x.a === b && x.b === a)) return x;
    }
    return null;
  }

  function bondsAt(st, key){
    return st.bonds.filter(function(b){ return (b.a === key || b.b === key) && b.order > 0; });
  }

  function neighbors(st, key){
    return bondsAt(st, key).map(function(b){ return b.a === key ? b.b : b.a; });
  }

  /* Bonding electrons around an atom, counted as bonds not electrons — a
     double bond is 2 here. */
  function bondOrderSum(st, key){
    return bondsAt(st, key).reduce(function(n, b){ return n + b.order; }, 0);
  }

  // Every bond the atom has, drawn or implied.
  function totalBonds(st, key){
    var a = st.atoms[key];
    return bondOrderSum(st, key) + (a ? (a.hImplicit || 0) : 0);
  }

  /* Formal charge = valence − (lone pair electrons) − (bonds).
     The definition, computed rather than stored, so a structure that has been
     altered by an arrow reports the charge it actually has now. */
  function formalCharge(st, key){
    var a = st.atoms[key];
    if(!a || !a.el || a.group) return a ? a.charge : 0;
    return info(a.el).valence - (a.lp * 2) - totalBonds(st, key);
  }

  // Electrons "around" the atom for octet purposes: both electrons of each
  // shared pair count toward it, which is what the octet rule counts.
  function electronCount(st, key){
    var a = st.atoms[key];
    if(!a || !a.el || a.group) return 8;
    return a.lp * 2 + totalBonds(st, key) * 2;
  }

  function octetOf(st, key){
    var a = st.atoms[key];
    if(!a || !a.el) return 8;
    return info(a.el).octet;
  }

  /* Groups drawn as a single label ('CH₃') hide their own hydrogens, so their
     bond count says nothing about whether they are full. Skip them. */
  function overOctet(st, key){
    var a = st.atoms[key];
    if(!a || !a.el || a.group) return false;
    if(info(a.el).expand) return false;
    return electronCount(st, key) > octetOf(st, key);
  }

  function formula(st, keys){
    var counts = {}, charge = 0;
    (keys || Object.keys(st.atoms)).forEach(function(k){
      var a = st.atoms[k];
      charge += formalCharge(st, k);
      if(a.group){ counts[a.label] = (counts[a.label] || 0) + 1; return; }
      counts[a.el] = (counts[a.el] || 0) + 1;
      // The hydrogens nobody drew are still in the molecular formula.
      if(a.hImplicit) counts.H = (counts.H || 0) + a.hImplicit;
    });
    var out = Object.keys(counts).sort(hillOrder).map(function(el){
      return el + (counts[el] > 1 ? sub(counts[el]) : '');
    }).join('');
    return out + (charge ? chargeGlyph(charge) : '');
  }

  /* Separate species, found as connected components. A mechanism that breaks
     a bond produces two of these, and showing them apart is half the point —
     "the leaving group left" is a claim about connectivity. */
  function fragments(st){
    var seen = {}, out = [];
    Object.keys(st.atoms).forEach(function(start){
      if(seen[start]) return;
      var stack = [start], group = [];
      seen[start] = true;
      while(stack.length){
        var k = stack.pop();
        group.push(k);
        neighbors(st, k).forEach(function(n){
          if(!seen[n]){ seen[n] = true; stack.push(n); }
        });
      }
      out.push(group);
    });
    return out;
  }

  /* ---- Arrow keys ------------------------------------------------------

     An arrow endpoint is an atom key ('c1') or a bond key ('bond:c1-br'),
     the same vocabulary molecule-editor.js already speaks. */

  function parseBondKey(key){
    var m = /^bond:(.+?)-(.+)$/.exec(key || '');
    return m ? { a:m[1], b:m[2] } : null;
  }
  function isBondKey(key){ return String(key || '').indexOf('bond:') === 0; }

  function endpointAtoms(key){
    var bk = parseBondKey(key);
    return bk ? [bk.a, bk.b] : [key];
  }

  function midpoint(st, key){
    var bk = parseBondKey(key);
    if(bk){
      var a = st.atoms[bk.a], b = st.atoms[bk.b];
      if(!a || !b) return null;
      return { x:(a.x + b.x)/2, y:(a.y + b.y)/2 };
    }
    var at = st.atoms[key];
    return at ? { x:at.x, y:at.y } : null;
  }

  var BOND_GLYPH = { 1:'–', 2:'=', 3:'≡' };

  function describeKey(st, key){
    var bk = parseBondKey(key);
    if(bk){
      var a = st.atoms[bk.a], b = st.atoms[bk.b];
      if(!a || !b) return 'a bond';
      var bond = findBond(st, bk.a, bk.b);
      var glyph = BOND_GLYPH[bond ? bond.order : 1] || '–';
      return 'the ' + a.label + glyph + b.label + ' bond';
    }
    var at = st.atoms[key];
    return at ? at.label + (at.charge ? chargeGlyph(at.charge) : '') : key;
  }

  /* ---- What an arrow does ----------------------------------------------

     Four shapes cover essentially every arrow a first-year course draws:

       atom -> atom    a lone pair becomes a new sigma bond
       atom -> bond    a lone pair becomes a pi bond alongside an existing one
       bond -> atom    a bond's electrons collapse onto an atom (heterolysis),
                       or, when the destination is not part of the bond, that
                       bond attacks it — a pi bond acting as the nucleophile
       bond -> bond    electrons shift from one bond into an adjacent one

     Each returns a delta rather than a mutated structure, because arrows in
     one step happen at once and have to be summed before anything is judged. */

  function classify(st, arrow){
    var fromBond = isBondKey(arrow.from), toBond = isBondKey(arrow.to);
    if(!fromBond && !toBond) return 'lp-to-atom';
    if(!fromBond && toBond) return 'lp-to-bond';
    if(fromBond && !toBond) return 'bond-to-atom';
    return 'bond-to-bond';
  }

  function sharedAtom(bk1, bk2){
    var s = [bk1.a, bk1.b].filter(function(k){ return k === bk2.a || k === bk2.b; });
    return s.length === 1 ? s[0] : null;
  }

  /* Which end of a pi bond forms the new sigma bond when the arrow points at
     an outside atom? The drawing does not say, so geometry decides: the end
     nearer the target, which is how it is drawn on paper anyway (the arrow
     is short). The readout always names the bond that resulted, so a student
     who meant the other carbon can see the difference immediately rather
     than wondering what the tool assumed. */
  function attackingEnd(st, bk, targetKey){
    var t = st.atoms[targetKey];
    if(!t) return bk.a;
    var a = st.atoms[bk.a], b = st.atoms[bk.b];
    var da = Math.pow(a.x - t.x, 2) + Math.pow(a.y - t.y, 2);
    var db = Math.pow(b.x - t.x, 2) + Math.pow(b.y - t.y, 2);
    return da <= db ? bk.a : bk.b;
  }

  /* A delta is {bonds:[{a,b,delta}], lp:{key:±n}} plus a sentence describing
     the move in the words a student would use. */
  function deltaFor(st, arrow){
    var kind = classify(st, arrow);
    var from = arrow.from, to = arrow.to;

    if(kind === 'lp-to-atom'){
      return {
        ok: true, kind: kind,
        bonds: [{ a:from, b:to, delta:1 }],
        lp: pair(from, -1),
        text: 'a lone pair on ' + describeKey(st, from) + ' became a new bond to ' + describeKey(st, to)
      };
    }

    if(kind === 'lp-to-bond'){
      var tb = parseBondKey(to);
      // The lone pair can only reinforce a bond the donor is already part of
      // — that is what makes it a pi bond rather than a bond to nowhere.
      if(tb.a !== from && tb.b !== from){
        return { ok:false, kind:kind, reason:'not-adjacent',
          text:'an arrow from a lone pair into a bond only works when that lone pair is on one of the bond\'s own atoms — otherwise there is nothing for the electrons to overlap with' };
      }
      return {
        ok: true, kind: kind,
        bonds: [{ a:tb.a, b:tb.b, delta:1 }],
        lp: pair(from, -1),
        text: 'a lone pair on ' + describeKey(st, from) + ' became a pi bond, making ' + describeKey(st, to) + ' a double bond'
      };
    }

    if(kind === 'bond-to-atom'){
      var fb = parseBondKey(from);
      var onBond = to === fb.a || to === fb.b;
      if(onBond){
        /* Both electrons of the pair end up on one atom. Whether that counts
           as the bond BREAKING depends on what is left: a single bond going
           to zero is a break, but a double bond going to single is the pi
           bond collapsing while the sigma bond holds the atoms together —
           the difference between a leaving group leaving and a carbonyl
           opening up, and calling both "broke" would blur exactly the thing
           a student is trying to learn. */
        var existing = findBond(st, fb.a, fb.b);
        var order = existing ? existing.order : 1;
        return {
          ok: true, kind: 'heterolysis',
          bonds: [{ a:fb.a, b:fb.b, delta:-1 }],
          lp: pair(to, +1),
          text: order > 1
            ? 'the pi bond of ' + describeKey(st, from) + ' collapsed onto ' + describeKey(st, to) +
              ', leaving a single bond behind'
            : describeKey(st, from) + ' broke, with both electrons going to ' + describeKey(st, to)
        };
      }
      // The bond is acting as a nucleophile: one of its atoms bonds to the target.
      var end = attackingEnd(st, fb, to);
      return {
        ok: true, kind: 'pi-attack',
        bonds: [{ a:fb.a, b:fb.b, delta:-1 }, { a:end, b:to, delta:1 }],
        lp: {},
        text: describeKey(st, from) + ' attacked ' + describeKey(st, to) +
              ', forming a ' + st.atoms[end].label + '–' + st.atoms[to].label + ' bond'
      };
    }

    // bond -> bond
    var b1 = parseBondKey(from), b2 = parseBondKey(to);
    var shared = sharedAtom(b1, b2);
    if(!shared){
      return { ok:false, kind:kind, reason:'not-adjacent',
        text:'electrons can only shift between two bonds that share an atom — these two are not connected, so there is no path for them to move along' };
    }
    return {
      ok: true, kind: kind,
      bonds: [{ a:b1.a, b:b1.b, delta:-1 }, { a:b2.a, b:b2.b, delta:1 }],
      lp: {},
      text: describeKey(st, from) + '’s electrons shifted into ' + describeKey(st, to)
    };
  }

  function pair(k, v){ var o = {}; o[k] = v; return o; }

  /* ---- Legality --------------------------------------------------------

     These are valence rules, not an answer key: nothing here knows which
     mechanism is being drawn, only whether the electrons a student moved
     could have come from where they said and could go where they sent them.
     That distinction is the whole reason the sandbox can be ungraded and
     still tell you something true. */

  function checkSource(st, arrow){
    var from = arrow.from;
    if(isBondKey(from)){
      var bk = parseBondKey(from);
      var b = findBond(st, bk.a, bk.b);
      if(!b || b.order < 1){
        return { level:'error', code:'no-bond',
          text:'There is no bond there to push. An arrow has to start at electrons that exist.' };
      }
      return null;
    }
    var a = st.atoms[from];
    if(!a) return null;
    if(a.group){
      return { level:'warn', code:'group-source',
        text:'This is drawn as a group, not a single atom, so it has no lone pair of its own to push. Start the arrow at the atom that actually holds the electrons.' };
    }
    if(a.lp < 1){
      var why = formalCharge(st, from) > 0
        ? ' It carries a positive charge, which means it is short of electrons — it accepts arrows, it does not send them.'
        : ' Every electron it has is already in a bond, so if you mean those, start the arrow on the bond itself.';
      return { level:'error', code:'no-lone-pair',
        text: a.label + ' has no lone pair to give.' + why +
              ' Curved arrows move electrons, and they always start where the electrons are.' };
    }
    return null;
  }

  /* Run the whole arrow set at once and report what it produced. */
  function apply(st, arrows){
    var next = clone(st);
    var issues = [], steps = [], deltas = [];

    (arrows || []).forEach(function(ar){
      var src = checkSource(st, ar);
      if(src) issues.push({ level:src.level, code:src.code, text:src.text, arrow:ar });
      /* An arrow that cannot legally start where it starts does not get to
         move anything. Applying it anyway would cascade a second round of
         octet complaints downstream of the first mistake, and burying the
         real error under its own consequences is how feedback stops being
         read. */
      if(src && src.level === 'error') return;
      var d = deltaFor(st, ar);
      if(!d.ok){
        issues.push({ level:'error', code:d.reason, arrow:ar, text:d.text });
        return;
      }
      deltas.push(d);
      steps.push(d.text);
    });

    // Sum first, then apply — simultaneous arrows, one net change.
    var bondDelta = {}, lpDelta = {};
    deltas.forEach(function(d){
      d.bonds.forEach(function(b){
        var key = [b.a, b.b].sort().join('');
        bondDelta[key] = (bondDelta[key] || 0) + b.delta;
      });
      Object.keys(d.lp).forEach(function(k){ lpDelta[k] = (lpDelta[k] || 0) + d.lp[k]; });
    });

    Object.keys(bondDelta).forEach(function(key){
      var parts = key.split(''), a = parts[0], b = parts[1], delta = bondDelta[key];
      if(!delta) return;
      var bond = findBond(next, a, b);
      if(bond){
        bond.order += delta;
        // A wedge or dash describes a bond that exists; once the order
        // changes the old stereo drawing is no longer a claim we can make.
        if(delta !== 0 && (bond.style === 'wedge' || bond.style === 'dash')) bond.style = undefined;
      } else if(delta > 0){
        next.bonds.push({ a:a, b:b, order:delta });
      }
    });

    Object.keys(lpDelta).forEach(function(k){
      if(next.atoms[k]) next.atoms[k].lp = Math.max(0, (next.atoms[k].lp || 0) + lpDelta[k]);
    });

    // A bond driven below zero means the arrows asked for electrons that
    // were never there — worth saying plainly rather than rendering nonsense.
    next.bonds.forEach(function(b){
      if(b.order < 0){
        issues.push({ level:'error', code:'over-broken',
          text:'Two arrows both tried to take the ' + st.atoms[b.a].label + '–' + st.atoms[b.b].label +
               ' bond’s electrons. A bond only has one pair to give.' });
        b.order = 0;
      }
    });

    /* Charges are not tracked, they are recomputed. An arrow that leaves an
       oxygen negative does so because the arithmetic says so, which is how a
       student should be getting it too. */
    Object.keys(next.atoms).forEach(function(k){
      var a = next.atoms[k];
      if(a.el && !a.group) a.charge = formalCharge(next, k);
    });

    // Octet check runs on the finished structure, after every arrow.
    Object.keys(next.atoms).forEach(function(k){
      if(overOctet(next, k)){
        var a = next.atoms[k];
        var n = electronCount(next, k);
        issues.push({ level:'error', code:'octet', atom:k,
          text: a.label + ' ends up with ' + n + ' electrons. A second-row atom has four orbitals and cannot hold more than ' +
                octetOf(next, k) + ' — if something is arriving here, something else has to leave in the same step.' });
      }
    });

    return { structure: next, issues: issues, steps: steps };
  }

  /* Did the electrons end up somewhere sensible? Separate from legality:
     a mechanism can be legal and still be bad chemistry. These are the
     observations a tutor would make while watching. */
  function commentary(before, after){
    var notes = [];
    Object.keys(after.atoms).forEach(function(k){
      var b = before.atoms[k], a = after.atoms[k];
      if(!b || !a || !a.el) return;
      var was = b.charge || 0, now = a.charge || 0;
      if(was === now) return;
      if(now < 0 && info(a.el).en < 2.5){
        notes.push({ level:'warn',
          text: a.label + ' picked up a negative charge, and it is not very electronegative. ' +
                'Negative charge is happiest on the electronegative atoms — oxygen, nitrogen, the halogens. ' +
                'A carbanion is a real species, but it is a high-energy one, so this had better be deliberate.' });
      }
      if(now > 0 && info(a.el).en > 3.0){
        notes.push({ level:'warn',
          text: a.label + ' ends up positive. An electronegative atom carrying a positive charge is expensive — ' +
                'sometimes correct (a protonated carbonyl, an oxocarbenium) but always worth a second look.' });
      }
      if(now > 0 && a.el === 'C'){
        notes.push({ level:'info',
          text:'That carbon is now a carbocation. Count what is attached to it: more alkyl groups means more hyperconjugation and a more stable cation, which is the whole reason tertiary substrates go SN1 and primary ones do not.' });
      }
      if(now === 0 && was !== 0){
        notes.push({ level:'good',
          text: a.label + ' came out neutral, which is usually the sign the electrons landed where they wanted to be.' });
      }
    });
    var brokeCount = fragments(after).length - fragments(before).length;
    if(brokeCount > 0){
      notes.push({ level:'info',
        text: 'The molecule came apart into ' + fragments(after).length + ' separate species — a bond broke all the way.' });
    }
    if(brokeCount < 0){
      notes.push({ level:'info', text: 'Two species joined into one.' });
    }
    return notes;
  }

  window.OchemChem = {
    EL: EL,
    info: info,
    elementOf: elementOf,
    chargeGlyph: chargeGlyph,
    parseCharge: parseCharge,
    sub: sub,
    fromMolecule: fromMolecule,
    toMolecule: toMolecule,
    clone: clone,
    findBond: findBond,
    bondsAt: bondsAt,
    neighbors: neighbors,
    bondOrderSum: bondOrderSum,
    totalBonds: totalBonds,
    anchorElement: anchorElement,
    countImplicitHydrogens: countImplicitHydrogens,
    formalCharge: formalCharge,
    electronCount: electronCount,
    octetOf: octetOf,
    overOctet: overOctet,
    formula: formula,
    fragments: fragments,
    parseBondKey: parseBondKey,
    isBondKey: isBondKey,
    endpointAtoms: endpointAtoms,
    midpoint: midpoint,
    describeKey: describeKey,
    classify: classify,
    deltaFor: deltaFor,
    checkSource: checkSource,
    apply: apply,
    commentary: commentary
  };
})();
