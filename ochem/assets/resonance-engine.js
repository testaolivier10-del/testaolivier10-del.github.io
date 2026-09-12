/* Resonance: what counts as a form, how many there are, and which one wins.

   The thing that makes a resonance tool hard to fake is that it has to know
   the difference between "a different resonance structure" and "a different
   molecule", and students get that wrong in a specific way — they break a
   sigma bond, or connect two atoms that were never connected, and call the
   result a resonance form. A tool that only checks octets would wave both
   through. So the rules here are about the SKELETON: every resonance form of
   a species shares one sigma framework and one set of atoms, and only pi
   electrons and lone pairs are allowed to move.

   Given that, the set of valid forms is enumerable rather than something
   anyone has to write down — which is what lets the tool say "you have found
   two of the three" for a molecule nobody anticipated, and lets it offer the
   one you are missing instead of a canned hint. */
(function(){
  var C = window.OchemChem;
  if(!C) return;

  var MAX_FORMS = 80;      // a ceiling on the raw search, not on what gets shown
  var MAX_ARROWS = 3;      // benzene's second Kekulé structure needs exactly three

  /* A structure's identity for "have I seen this one before" purposes: the
     bond orders and each atom's lone pairs. Coordinates and labels are not
     part of it, since two forms differ only in where the electrons sit. */
  function key(st){
    var bonds = st.bonds.map(function(b){
      var ends = [b.a, b.b].sort();
      return ends[0] + '-' + ends[1] + ':' + b.order;
    }).sort().join(',');
    var atoms = Object.keys(st.atoms).sort().map(function(k){
      return k + ':' + st.atoms[k].lp;
    }).join(',');
    return bonds + '|' + atoms;
  }

  /* The sigma framework: which pairs are bonded at all, ignoring order. This
     is the invariant every resonance form has to preserve. */
  function skeleton(st){
    var out = {};
    st.bonds.forEach(function(b){
      if(b.order > 0) out[[b.a, b.b].sort().join('-')] = true;
    });
    return out;
  }

  /* ---- Legal single moves ----------------------------------------------

     Three, and only three, because these are the only ways electrons move
     without the skeleton moving with them:

       a lone pair becomes a pi bond to a neighbour
       a pi bond collapses into a lone pair on one of its own atoms
       a pi bond shifts into the adjacent bond

     Note what is missing: a lone pair forming a bond to an atom it was not
     already bonded to. That is a reaction, not resonance, and leaving it out
     of the move list is what keeps the enumeration honest. */
  function legalMoves(st){
    var moves = [];
    var keys = Object.keys(st.atoms);

    keys.forEach(function(k){
      var a = st.atoms[k];
      if(a.group || !a.el || a.lp < 1) return;
      C.bondsAt(st, k).forEach(function(b){
        if(b.order >= 3) return;
        moves.push({ from:k, to:'bond:' + b.a + '-' + b.b });
      });
    });

    st.bonds.forEach(function(b){
      if(b.order < 2) return;
      var bk = 'bond:' + b.a + '-' + b.b;
      // Collapse onto either end.
      moves.push({ from:bk, to:b.a });
      moves.push({ from:bk, to:b.b });
      // Shift into any bond sharing an atom with this one.
      st.bonds.forEach(function(o){
        if(o === b || o.order >= 3) return;
        var shares = o.a === b.a || o.a === b.b || o.b === b.a || o.b === b.b;
        if(shares) moves.push({ from:bk, to:'bond:' + o.a + '-' + o.b });
      });
    });

    return moves;
  }

  /* Apply a set of arrows and decide whether the result is a resonance form
     of the original — with the reason spelled out when it is not, because
     "invalid" on its own teaches nothing. */
  function validate(st0, arrows){
    if(!arrows || !arrows.length){
      return { valid:false, code:'empty', reason:'Draw an arrow first.' };
    }
    if(arrows.length > MAX_ARROWS + 1){
      return { valid:false, code:'too-many', reason:'That is more arrows than any resonance form of this species needs.' };
    }

    var res = C.apply(st0, arrows);
    var st = res.structure;
    var sk0 = skeleton(st0), sk1 = skeleton(st);

    var broke = Object.keys(sk0).filter(function(k){ return !sk1[k]; });
    if(broke.length){
      var ends = broke[0].split('-');
      return { valid:false, code:'broke-sigma', structure:st,
        reason:'That breaks the ' + st0.atoms[ends[0]].label + '–' + st0.atoms[ends[1]].label +
               ' bond completely. Every resonance form of a species has the same skeleton — the atoms stay ' +
               'exactly where they are and stay bonded to exactly the same neighbours. Once a sigma bond ' +
               'is gone you have drawn a reaction, not a resonance structure.' };
    }

    var made = Object.keys(sk1).filter(function(k){ return !sk0[k]; });
    if(made.length){
      var e2 = made[0].split('-');
      return { valid:false, code:'new-sigma', structure:st,
        reason:'That bonds ' + st0.atoms[e2[0]].label + ' to ' + st0.atoms[e2[1]].label +
               ', and they were not bonded before. Curved arrows in a resonance structure only move pi ' +
               'electrons and lone pairs around a skeleton that never changes — connecting two new atoms ' +
               'makes a different compound.' };
    }

    var octet = res.issues.filter(function(i){ return i.code === 'octet'; });
    if(octet.length){
      return { valid:false, code:'octet', structure:st, reason:octet[0].text };
    }

    var other = res.issues.filter(function(i){ return i.level === 'error'; });
    if(other.length){
      return { valid:false, code:other[0].code, structure:st, reason:other[0].text };
    }

    if(key(st) === key(st0)){
      return { valid:false, code:'no-change', structure:st,
        reason:'Those arrows cancel out — the electrons end up exactly where they started.' };
    }

    return { valid:true, structure:st, steps:res.steps };
  }

  /* Every form reachable from the starting structure. Breadth-first over
     combinations of legal moves, because a conjugated ring only changes as a
     concerted set: benzene's other Kekulé form is three arrows or nothing,
     and an enumerator that only tried one at a time would report that benzene
     has no resonance. */
  function enumerate(st0){
    var seen = {}, forms = [], queue = [];
    seen[key(st0)] = true;
    forms.push(st0);
    queue.push(st0);

    while(queue.length && forms.length < MAX_FORMS){
      var cur = queue.shift();
      var moves = legalMoves(cur);
      // The combination count grows fast; past this many moves, concerted
      // triples are not worth the wait and pairs find everything that matters.
      var maxSet = moves.length > 20 ? 2 : MAX_ARROWS;

      combinations(moves, maxSet).forEach(function(set){
        if(forms.length >= MAX_FORMS) return;
        var v = validate(cur, set);
        if(!v.valid) return;
        var k = key(v.structure);
        if(seen[k]) return;
        // Reachable from cur, but it must also be a resonance form of the
        // ORIGINAL — same skeleton, which the chain preserves — so it counts.
        seen[k] = true;
        forms.push(v.structure);
        queue.push(v.structure);
      });
    }

    return forms;
  }

  function combinations(items, maxSize){
    var out = [];
    for(var size = 1; size <= maxSize; size++) build([], 0, size);
    function build(acc, start, size){
      if(acc.length === size){ out.push(acc.slice()); return; }
      for(var i = start; i < items.length; i++){
        acc.push(items[i]);
        build(acc, i + 1, size);
        acc.pop();
      }
    }
    return out;
  }

  /* ---- Which form contributes most -------------------------------------

     The textbook ranking, in the textbook order, because the order is the
     lesson: a form with a complete octet beats a form with fewer charges,
     and both beat a form that merely puts the charge somewhere comfortable.
     Each rule returns a number and a sentence, so the tool can show the
     comparison rather than just the verdict. */
  function score(st){
    var atoms = Object.keys(st.atoms).filter(function(k){
      var a = st.atoms[k];
      return a.el && !a.group && a.el !== 'H';
    });

    var incomplete = 0, charges = 0, enFit = 0, adjacentLike = 0, bondTotal = 0;

    atoms.forEach(function(k){
      var a = st.atoms[k];
      if(C.electronCount(st, k) < C.octetOf(st, k)) incomplete++;
      var fc = C.formalCharge(st, k);
      charges += Math.abs(fc);
      if(fc < 0) enFit += C.info(a.el).en;
      if(fc > 0) enFit -= C.info(a.el).en;
    });

    st.bonds.forEach(function(b){ bondTotal += b.order; });

    st.bonds.forEach(function(b){
      if(b.order < 1) return;
      var fa = C.formalCharge(st, b.a), fb = C.formalCharge(st, b.b);
      if(fa && fb && (fa > 0) === (fb > 0)) adjacentLike++;
    });

    /* Weights encode the priority order rather than any real energy: octets
       dominate charge count, charge count dominates placement. The number is
       only ever used to sort forms against each other. */
    var total = -incomplete * 100 - charges * 22 - adjacentLike * 30 + enFit * 4 + bondTotal;

    return {
      total: total,
      incomplete: incomplete,
      charges: charges,
      adjacentLike: adjacentLike,
      enFit: enFit,
      bonds: bondTotal
    };
  }

  /* Why one form beats another, in the order a marker would give it. */
  function compare(a, b){
    var sa = score(a), sb = score(b);
    if(sa.incomplete !== sb.incomplete){
      return { winner: sa.incomplete < sb.incomplete ? 'a' : 'b', rule:'octet',
        text:'Complete octets come first. One of these leaves an atom short of eight electrons and the other does not, and nothing further down the list outweighs that.' };
    }
    if(sa.charges !== sb.charges){
      return { winner: sa.charges < sb.charges ? 'a' : 'b', rule:'charge-count',
        text:'Both satisfy their octets, so the next question is how much charge had to be separated. Fewer formal charges means less work done against electrostatics.' };
    }
    if(sa.adjacentLike !== sb.adjacentLike){
      return { winner: sa.adjacentLike < sb.adjacentLike ? 'a' : 'b', rule:'like-charges',
        text:'Two like charges on neighbouring atoms repel each other. The form that avoids putting them side by side is the better one.' };
    }
    if(Math.abs(sa.enFit - sb.enFit) > 0.01){
      return { winner: sa.enFit > sb.enFit ? 'a' : 'b', rule:'electronegativity',
        text:'Same octets, same number of charges — so it comes down to placement. Negative charge belongs on the most electronegative atom available, positive charge on the least.' };
    }
    return { winner:'tie', rule:'equivalent',
      text:'These two are equivalent by every rule that matters, which means neither is the major contributor: the real structure is the average of them, with the charge genuinely shared.' };
  }

  /* A sentence per form, saying where it stands and why. */
  function describe(st, all){
    var s = score(st);
    var bits = [];
    if(s.incomplete) bits.push(s.incomplete + (s.incomplete === 1 ? ' atom is' : ' atoms are') + ' short of an octet');
    else bits.push('every atom has a full octet');
    bits.push(s.charges === 0 ? 'no formal charges' :
      s.charges + ' unit' + (s.charges === 1 ? '' : 's') + ' of formal charge');

    /* Naming the atom the charge sits on, not just how much there is.
       Phenoxide's five forms all read "full octets, one unit of charge" —
       identical summaries for structures the tool has just ranked against
       each other, which looks like a bug and hides the only thing that
       separates them. Where the charge went IS the difference. */
    var charged = Object.keys(st.atoms).filter(function(k){
      var a = st.atoms[k];
      return a.el && !a.group && C.formalCharge(st, k) !== 0;
    });
    if(charged.length && charged.length <= 3){
      bits.push(charged.map(function(k){
        var fc = C.formalCharge(st, k);
        return (fc < 0 ? 'negative' : 'positive') + ' on ' + st.atoms[k].label;
      }).join(' and '));
    }
    if(s.adjacentLike) bits.push('like charges on neighbouring atoms');

    var best = all.reduce(function(m, f){ return score(f).total > score(m).total ? f : m; }, all[0]);
    var tiedForBest = all.filter(function(f){ return score(f).total === score(best).total; }).length;
    var rank = score(st).total === score(best).total
      ? (tiedForBest > 1 ? 'Equivalent major contributor' : 'Major contributor')
      : 'Minor contributor';

    return { rank: rank, summary: bits.join(', '), score: s };
  }

  /* Everything legal is not everything worth drawing.

     Push a carbonyl's pi bond the wrong way and you get a structure that
     satisfies every rule in validate() — same skeleton, no octet blown — and
     is still not one of the two forms of acetate anybody means. What rules it
     out is that it leaves a carbon with six electrons when a form with eight
     was available, and the octet rule outranks everything else on the list.

     So the enumeration stays permissive and the filter is applied here: keep
     the forms that leave the fewest atoms short of an octet, and drop the
     ones that separate charge far beyond what that costs. This is the line
     textbooks draw when they say acetate has two resonance forms rather than
     the five you can technically write, and drawing it in one place means the
     count the tool reports is the count a marker would accept.

     Deliberately NOT filtered out: a form that is charge-separated but fully
     octet-satisfied. That is the amide's second structure — the one that
     explains why amides are planar and not basic — and a tool that hid it to
     keep the count tidy would be hiding the interesting one. */
  function contributors(st0){
    var all = enumerate(st0);
    var minIncomplete = all.reduce(function(m, f){
      return Math.min(m, score(f).incomplete);
    }, Infinity);

    var kept = all.filter(function(f){
      return score(f).incomplete === minIncomplete;
    });

    var minCharges = kept.reduce(function(m, f){ return Math.min(m, score(f).charges); }, Infinity);
    kept = kept.filter(function(f){ return score(f).charges <= minCharges + 2; });

    // The structure the student started from is always one of the answers,
    // even if some quirk of the search would have ranked it out.
    if(kept.indexOf(st0) === -1 && kept.every(function(f){ return key(f) !== key(st0); })){
      kept.unshift(st0);
    }

    return kept.sort(function(a, b){ return score(b).total - score(a).total; });
  }

  window.OchemResonance = {
    key: key,
    contributors: contributors,
    skeleton: skeleton,
    legalMoves: legalMoves,
    validate: validate,
    enumerate: enumerate,
    score: score,
    compare: compare,
    describe: describe
  };
})();
