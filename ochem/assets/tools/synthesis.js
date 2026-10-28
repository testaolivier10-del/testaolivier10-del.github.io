/* Synthesis Trainer: plan a route one step at a time.

   Students can name the reagent for one step and still not plan a route of
   three, so they memorize routes. This tool makes the plan the thing being
   practised: a start and a target, four reagent choices for the next step,
   and the intermediate drawn after each pick. A pick that is real chemistry
   but leads nowhere is not "wrong": it says what it made and why that is a
   dead end, and the student steps back.

   Nothing is stored as an answer. The reactions are the Reagent Roadmap's
   graph (reagent-roadmap-data.js) and every judgement uses the roadmap's own
   engine (window.OchemRoadmapEngine: through(), the substitution patterns,
   routes()); synthesis-data.js only says which real molecule each group is
   on a problem's skeleton. Any route that gets there counts, and a solved
   problem shows the shortest one if the student's was longer.

   THE EXACT WALK
   --------------
   The roadmap routes over groups and the patterns a group might have. A
   problem is about one molecule, so after every step the trainer looks the
   product up in the problem's family and narrows the patterns to what that
   molecule is (butan-2-ol dehydrates to but-2-ene, so hydroboration then
   gives butan-2-ol back, not butan-1-ol). States are (group, patterns,
   molecule, whether the one allowed C–C step is used); dist() is a
   breadth-first search over them. routes() is still the proof a random
   problem is offered on: one is only made when the router finds a route
   AND the exact walk agrees.

   The engine (window.OchemSynthesisEngine) has no DOM, so
   scripts/test/synthesis-trainer.test.mjs can play every problem in node. */
(function(){
  var D = window.OchemRoadmap, R = window.OchemRoadmapEngine, SD = window.OchemSynthesisData;
  if(!D || !R || !SD) return;

  var MAXD = 7;

  function inter(a, b){ return a.filter(function(x){ return b.indexOf(x) >= 0; }); }
  function base(id){ return String(id).split('.')[0]; }
  function inList(list, e){ return !!list && (list.indexOf(e.id) >= 0 || list.indexOf(base(e.id)) >= 0); }
  function node(id){ return D.node(id); }
  /* The reagent line as the roadmap writes it, with its dashes read as the
     site now writes them ("PCC, DMP, Swern or Jones: any of them"). */
  function rxText(e){
    return undash(e.rx.length === 1 ? e.rx[0] : e.rx.map(function(s, i){ return (i + 1) + '. ' + s; }).join('  '));
  }
  function undash(t){ return String(t || '').replace(/ — or /g, ', or ').replace(/ — /g, ': ').replace(/—/g, ': '); }

  /* ---- Problems ---------------------------------------------------------- */

  function prepare(def){
    var fams = [].concat(def.fam);
    var P = {
      id: def.id, def: def, fams: fams, two: fams.length > 1,
      cc: def.cc || [], with: Object.assign({}, SD.WITH || {}, def.with || {}),
      ban: {}, target: def.target, memo: {}
    };
    fams.forEach(function(f){ Object.keys(f.ban || {}).forEach(function(k){ P.ban[k] = f.ban[k]; }); });
    Object.keys(def.ban || {}).forEach(function(k){ P.ban[k] = def.ban[k]; });
    P.start = startState(P);
    var lastFam = fams[fams.length - 1];
    var tm = def.target.name
      ? { m: lastFam.mols.filter(function(m){ return m.name === def.target.name; })[0] }
      : lookup(lastFam, def.target.g, def.target.p ? [def.target.p] : R.patternsOf(def.target.g), null, null, def.target.via);
    P.targetMol = tm;
    return P;
  }

  /* The molecule a group is on this skeleton, given how we got there. */
  function lookup(fam, g, set, e, prevSet, wantVia){
    var list = fam.mols;
    for(var i = 0; i < list.length; i++){
      var m = list[i];
      if(m.g !== g) continue;
      if(m.via){
        var ok = e ? inList(m.via, e) : (wantVia ? m.via.some(function(v){ return wantVia.indexOf(v) >= 0; }) : false);
        if(!ok) continue;
      }
      if(m.after && !(prevSet && inter(prevSet, m.after).length)) continue;
      if(m.p && set.indexOf(m.p) < 0 && set.indexOf('*') < 0) continue;
      return { i: i, m: m };
    }
    return { i: -1, m: { g: g, name: lc(node(g).name), text: node(g).short, generic: true } };
  }

  function famOf(P, cc){ return P.fams[P.two && cc ? 1 : 0]; }

  function mk(P, g, set, cc, e, prevSet){
    var L = lookup(famOf(P, cc), g, set, e, prevSet);
    if(L.m.p && set.indexOf(L.m.p) >= 0) set = [L.m.p];
    var s = { g: g, set: set, cc: !!cc, mi: L.i, mol: L.m, via: e ? e.id : null, fin: !!(e && e.final) };
    s.key = g + '|' + set.slice().sort().join(',') + '|' + (cc ? 1 : 0) + '|' + L.i + (s.fin ? '|fin' : '');
    return s;
  }

  function startState(P){
    var st = P.def.start;
    return mk(P, st.g, st.p ? [st.p] : R.patternsOf(st.g), false, null, null);
  }

  /* The target is a molecule, not a group: propylbenzene made by
     Clemmensen reduction and by hydrogenating 1-phenylpropene is the same
     molecule (filed under two groups), and isopropylbenzene is not it. */
  function isGoal(P, s){
    if(P.two && !s.cc) return false;
    return !s.mol.generic && s.mol.name === P.targetMol.m.name;
  }

  /* ---- One step ---------------------------------------------------------- */

  /* What edge e does from state s. kind:
       ok        a real step; next is the product
       elsewhere e does not start from this group
       ban       this skeleton cannot do it (P.ban says why)
       skeleton  it makes or breaks a C–C bond this problem does not need
       twice     a second C–C step (a problem allows one)
       final     it fastens a second molecule on, and the target is not that
       needs     the substitution pattern is wrong (e.needs / e.map)
     An ok step can still be a dead end: see judge(). */
  function apply(P, s, e){
    if(e.from !== s.g) return { kind: 'elsewhere' };
    if(P.ban[base(e.id)] || P.ban[e.id]) return { kind: 'ban', why: P.ban[base(e.id)] || P.ban[e.id] };
    if(e.from === e.to && !e.cc) return { kind: 'elsewhere' };
    /* Whether it reacts at all comes first: the haloform needs a methyl
       ketone, so on cyclohexanone it does nothing, which matters more than
       that it would have cut a carbon off. */
    var out = R.through(e, s.set);
    if(!out.length) return { kind: e.sub ? 'needs' : 'nomol' };
    if(e.cc){
      if(!inList(P.cc, e)) return { kind: 'skeleton' };
      if(s.cc) return { kind: 'twice' };
    }
    if(e.final && e.to !== P.target.g) return { kind: 'final' };
    /* (Above: when the pattern does not pass, only a reaction whose data says
       what the substrate must be, `sub`, really fails here: no H to lose, not
       an internal alkyne. Otherwise it does react, to something the map does
       not draw (HBr, ROOR on cyclohexene gives bromocyclohexane), so it is
       not offered at all rather than called a failure.) */
    var next = mk(P, e.to, out, s.cc || !!e.cc, e, s.set);
    /* The graph allows it for the group, but the family has no molecule it
       would make here (radical bromination of ethylbenzene does not give a
       3° bromide). Not a move, and never offered. */
    if(next.mol.generic) return { kind: 'nomol' };
    return { kind: 'ok', next: next };
  }

  function movesFrom(P, s){
    var out = [];
    R.edgesFrom(s.g).forEach(function(e){
      var a = apply(P, s, e);
      if(a.kind === 'ok') out.push({ e: e, next: a.next });
    });
    return out;
  }

  /* Fewest steps from s to the target on this problem (Infinity if none). */
  function dist(P, s){
    // After a step that joins a second molecule on, nothing may follow.
    if(s.fin) return Infinity;
    if(P.memo[s.key] !== undefined) return P.memo[s.key];
    var seen = {}; seen[s.key] = true;
    var layer = [s], d = 0, found = Infinity;
    while(layer.length && d < MAXD && found === Infinity){
      d++;
      var nxt = [];
      layer.forEach(function(x){
        movesFrom(P, x).forEach(function(m){
          if(isGoal(P, m.next)){ found = d; return; }
          if(m.e.final || seen[m.next.key]) return;
          seen[m.next.key] = true; nxt.push(m.next);
        });
      });
      layer = nxt;
    }
    P.memo[s.key] = found;
    return found;
  }

  /* One shortest route from s, as a list of { e, next }. */
  function shortest(P, s){
    var d = dist(P, s);
    if(d === Infinity) return null;
    var out = [], cur = s, pref = P.def.prefer || [];
    while(d > 0){
      var pick = null;
      // Ties go to the route the course teaches (def.prefer), then data order.
      movesFrom(P, cur).sort(function(a, b){ return inList(pref, b.e) - inList(pref, a.e); }).some(function(m){
        if(isGoal(P, m.next) && d === 1){ pick = m; return true; }
        if(!m.e.final && !isGoal(P, m.next) && dist(P, m.next) === d - 1){ pick = m; return true; }
        return false;
      });
      if(!pick) return null;
      out.push(pick); cur = pick.next; d--;
    }
    return out;
  }

  /* The verdict on picking e at s. history: the states already on the
     route (to spot a step back to one of them). */
  function judge(P, s, e, history){
    var a = apply(P, s, e);
    if(a.kind !== 'ok') return a;
    var n = a.next;
    if(isGoal(P, n)) return { kind: 'goal', next: n };
    var onLast = !P.two || n.cc;
    if(onLast && P.target.wrong && e.to === P.target.g && (inList(Object.keys(P.target.wrong), e))){
      return { kind: 'wrongmol', next: n, why: P.target.wrong[base(e.id)] || P.target.wrong[e.id] };
    }
    if(e.final) return e.to === P.target.g ? { kind: 'nowhere', next: n } : { kind: 'final', next: n };
    // Back to a molecule already on the route: it undoes work.
    var back = (history || []).some(function(h){ return h.key === n.key; });
    if(back) return { kind: 'back', next: n };
    var dn = dist(P, n), ds = dist(P, s);
    if(dn !== Infinity){
      return { kind: dn < ds ? 'good' : 'detour', next: n, left: dn, best: ds - 1 };
    }
    // With any pattern the group could have, would it reach? Then the shape
    // of the molecule made is the problem (Markovnikov vs anti, Zaitsev...).
    var loose = { g: n.g, set: R.patternsOf(n.g), cc: n.cc, mi: -1, mol: n.mol, via: n.via, key: n.g + '|loose|' + (n.cc ? 1 : 0) };
    if(n.set.length < loose.set.length && dist(P, loose) !== Infinity) return { kind: 'shape', next: n };
    return { kind: 'nowhere', next: n };
  }

  /* ---- Choices ----------------------------------------------------------- */

  /* A small seeded random, so the same position always offers the same four
     tiles (stepping back finds them where they were). */
  function rng(seed){
    var h = 2166136261;
    for(var i = 0; i < seed.length; i++){ h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function(){ h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  }
  function shuffle(a, rnd){ for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var BAD_ORDER = ['wrongmol', 'shape', 'back', 'nowhere', 'needs', 'final', 'ban', 'skeleton', 'twice'];
  var TEACH = ['wrongmol', 'shape', 'needs', 'nowhere', 'back', 'final'];

  /* The four tiles for the next forward step. Tiles are reagent lines; one
     line can name several reactions (HBr gives a 2° or a 3° halide depending
     on the alkene), and the reaction that applies is the one the molecule's
     pattern lets through. */
  function choices(P, s, history, seed){
    var rnd = rng(P.id + '|' + s.key + '|' + (seed || ''));
    var here = {}, order = [];
    R.edgesFrom(s.g).forEach(function(e){
      if(e.from === e.to && !e.cc) return;
      var k = rxText(e);
      if(!here[k]){ here[k] = { k: k, edges: [] }; order.push(k); }
      here[k].edges.push(e);
    });
    var tiles = order.map(function(k){
      var t = here[k], best = null;
      t.edges.forEach(function(e){
        var v = judge(P, s, e, history), rank;
        if(v.kind === 'goal') rank = -1000;
        else if(v.kind === 'good' || v.kind === 'detour') rank = -100 + v.left;
        else rank = v.kind === 'nomol' ? 99 : BAD_ORDER.indexOf(v.kind);
        if(!best || rank < best.rank) best = { e: e, v: v, rank: rank };
      });
      t.e = best.e; t.v = best.v;
      return t;
    }).filter(function(t){ return t.v.kind !== 'nomol'; });
    var good = tiles.filter(function(t){ return t.v.kind === 'goal' || t.v.kind === 'good'; });
    var detour = tiles.filter(function(t){ return t.v.kind === 'detour'; });
    // The dead ends worth showing: a real step that teaches something first.
    var rules = tiles.filter(function(t){ return ['ban', 'skeleton', 'twice'].indexOf(t.v.kind) >= 0; });
    var pick = shuffle(good, rnd).slice(0, 2);
    /* The wrong tiles: one of each kind of dead end first, in the order that
       teaches most (a wrong isomer before "joins a second molecule"), so
       four tiles are not three esters. */
    var byKind = {};
    shuffle(tiles.slice(), rnd).forEach(function(t){
      if(TEACH.indexOf(t.v.kind) >= 0 && !(t.v.next && t.v.next.mol.generic)) (byKind[t.v.kind] = byKind[t.v.kind] || []).push(t);
    });
    for(var round = 0; round < 3 && pick.length < 4; round++){
      TEACH.forEach(function(k){ if(pick.length < 4 && byKind[k] && byKind[k].length && (round || k !== 'final' || pick.length < 3)) pick.push(byKind[k].shift()); });
    }
    var rl = shuffle(rules, rnd);
    if(pick.length < 4 && rl.length) pick.push(rl.shift());
    if(pick.length < 4 && detour.length) pick.push(shuffle(detour, rnd)[0]);
    while(pick.length < 4 && rl.length) pick.push(rl.shift());
    // Still short: a reagent from elsewhere on the map that does nothing here.
    if(pick.length < 4){
      var hereKeys = {};
      R.edgesFrom(s.g).forEach(function(x){ x.keys.forEach(function(k){ hereKeys[k] = 1; }); });
      ((D.REACTS_OFF_MAP || {})[s.g] || []).forEach(function(k){ hereKeys[k] = 1; });
      var used = {}; pick.forEach(function(t){ used[t.k] = 1; });
      var pool = shuffle(D.EDGES.filter(function(e){
        return e.from !== s.g && e.from !== e.to && !e.cc && !used[rxText(e)] && !e.keys.some(function(k){ return hereKeys[k]; });
      }), rnd);
      pool.forEach(function(e){
        if(pick.length >= 4 || used[rxText(e)]) return;
        used[rxText(e)] = 1;
        pick.push({ k: rxText(e), edges: [], e: e, v: { kind: 'elsewhere' } });
      });
    }
    return shuffle(pick, rnd);
  }

  /* ---- Backward (retrosynthesis) ------------------------------------------

     Every state the start can reach, with the reactions into each. Working
     back from the target, a precursor is valid if the start can reach it;
     the best one is a step nearer the start. */
  function forwardGraph(P){
    if(P.fg) return P.fg;
    var fd = {}, states = {}, preds = {}, goals = [], joined = {};
    fd[P.start.key] = 0; states[P.start.key] = P.start;
    var layer = [P.start], d = 0;
    while(layer.length && d < MAXD){
      d++;
      var nxt = [];
      layer.forEach(function(x){
        movesFrom(P, x).forEach(function(m){
          // The target is where a route ends: nothing is routed through it
          // (the acid chloride made FROM the acid is no precursor of the acid).
          if(isGoal(P, m.next)){ goals.push({ from: x, e: m.e, next: m.next }); return; }
          // Made only by joining a second molecule on: real, but a last step.
          if(m.e.final){ joined[m.next.key.replace(/\|fin$/, '')] = true; return; }
          (preds[m.next.key] = preds[m.next.key] || []).push({ from: x, e: m.e });
          if(fd[m.next.key] === undefined){ fd[m.next.key] = d; states[m.next.key] = m.next; nxt.push(m.next); }
        });
      });
      layer = nxt;
    }
    var gd = Infinity;
    goals.forEach(function(g){ gd = Math.min(gd, fd[g.from.key] + 1); });
    /* What the start reaches only by going THROUGH the target (phenylacetylene
       from ethylbenzene, by way of styrene): real, but it cannot come before
       the target in a route to the target. */
    var past = {}, layer2 = goals.map(function(g){ return g.next; }), d2 = 0;
    while(layer2.length && d2 < 3){
      d2++;
      var nx2 = [];
      layer2.forEach(function(x){
        movesFrom(P, x).forEach(function(m){
          if(m.e.final || fd[m.next.key] !== undefined || past[m.next.key]) return;
          past[m.next.key] = true; nx2.push(m.next);
        });
      });
      layer2 = nx2;
    }
    P.fg = { fd: fd, states: states, preds: preds, goals: goals, gd: gd, joined: joined, past: past };
    return P.fg;
  }

  /* fdist of a backward position: 'GOAL' or a state. */
  function backDist(P, pos){
    var G = forwardGraph(P);
    return pos === 'GOAL' ? G.gd : G.fd[pos.key];
  }

  /* The verdict on choosing precursor q and reaction e at a backward
     position. kinds:
       done   q is the start: the route is complete
       good   q is a step nearer the start
       detour q can be made from the start, but by a longer way
       loop   q is already on the route
       unmade real chemistry, but q cannot be made from the start here
       other  this reaction on q makes something else (other = that) */
  function backJudge(P, pos, q, e, chain){
    var G = forwardGraph(P);
    var a = apply(P, q, e);
    var gives = a.kind === 'ok' ? a.next : null;
    var hits = gives && (pos === 'GOAL' ? isGoal(P, gives) : gives.key === pos.key);
    if(!hits) return { kind: 'other', made: gives, why: a.kind === 'ok' ? null : a };
    if(q.key === P.start.key) return { kind: 'done' };
    if((chain || []).some(function(c){ return c.key === q.key; })) return { kind: 'loop' };
    if(G.fd[q.key] === undefined) return { kind: G.joined[q.key] ? 'joined' : (G.past[q.key] ? 'past' : 'unmade') };
    return { kind: G.fd[q.key] === backDist(P, pos) - 1 ? 'good' : 'detour', left: G.fd[q.key] };
  }

  /* A precursor of a group drawn from the family (for disconnections the
     start cannot reach), in the pattern a reaction e needs. */
  function famState(P, g, cc, e){
    var fam = famOf(P, cc), seen = {}, out = [];
    fam.mols.forEach(function(m){
      if(m.g !== g || m.via || seen[m.p || '*']) return;
      seen[m.p || '*'] = 1;
      var st = mk(P, g, m.p ? [m.p] : R.patternsOf(g), cc, null, null);
      if(R.through(e, st.set).length) out.push(st);
    });
    return out;
  }

  /* The four tiles for the next backward step: { q, e, v }. */
  function backChoices(P, pos, chain, seed){
    var G = forwardGraph(P), rnd = rng(P.id + '|back|' + (pos === 'GOAL' ? 'G' : pos.key) + '|' + (seed || ''));
    var list = pos === 'GOAL' ? G.goals.map(function(g){ return { q: g.from, e: g.e }; }) : (G.preds[pos.key] || []).map(function(p){ return { q: p.from, e: p.e }; });
    var seen = {}, valid = [];
    list.forEach(function(x){
      if(x.q.mol.generic) return;
      var k = x.q.key + '>' + rxText(x.e);
      if(seen[k]) return; seen[k] = 1;
      x.v = backJudge(P, pos, x.q, x.e, chain); x.k = k;
      valid.push(x);
    });
    var good = valid.filter(function(x){ return x.v.kind === 'good' || x.v.kind === 'done'; });
    var rest = valid.filter(function(x){ return x.v.kind !== 'good' && x.v.kind !== 'done'; });
    var pick = shuffle(good, rnd).slice(0, 2);
    var cur = pos === 'GOAL' ? null : pos;
    var tg = pos === 'GOAL' ? P.target.g : pos.g;
    var bad = [];
    // The right precursor with a reagent that makes something else.
    pick.concat(shuffle(good.slice(), rnd)).forEach(function(x){
      R.edgesFrom(x.q.g).forEach(function(e2){
        if(rxText(e2) === rxText(x.e)) return;
        var k = x.q.key + '>' + rxText(e2);
        if(seen[k]) return;
        var v = backJudge(P, pos, x.q, e2, chain);
        if(v.kind !== 'other' || !v.made || v.made.mol.generic) return;
        seen[k] = 1; bad.push({ q: x.q, e: e2, v: v, k: k });
      });
    });
    // A real reaction into this group from a precursor the start cannot reach.
    R.edgesInto(tg).forEach(function(e){
      if(e.from === e.to) return;
      var cc = cur ? cur.cc : P.two;
      if(e.cc){ if(!inList(P.cc, e)) return; cc = false; }
      famState(P, e.from, cc, e).forEach(function(q){
        var k = q.key + '>' + rxText(e);
        if(seen[k] || q.mol.generic) return;
        var v = backJudge(P, pos, q, e, chain);
        if(['unmade', 'joined', 'past'].indexOf(v.kind) < 0) return;
        seen[k] = 1; bad.push({ q: q, e: e, v: v, k: k });
      });
    });
    bad = shuffle(bad, rnd);
    /* One of each kind first (the right molecule with the wrong reagent, a
       real reaction from a molecule the start cannot become), and no more
       than two tiles about the same precursor, so the choice is about the
       molecule as well as the reagent. */
    var byKind = {}, perQ = {};
    pick.forEach(function(x){ perQ[x.q.key] = (perQ[x.q.key] || 0) + 1; });
    function take(x){ if(pick.length >= 4 || (perQ[x.q.key] || 0) >= 2) return false; perQ[x.q.key] = (perQ[x.q.key] || 0) + 1; pick.push(x); return true; }
    bad.forEach(function(x){ (byKind[x.v.kind] = byKind[x.v.kind] || []).push(x); });
    ['other', 'unmade', 'joined', 'past'].forEach(function(k){ (byKind[k] || []).some(take); });
    var more = shuffle((byKind.other || []).concat(byKind.unmade || [], byKind.joined || [], byKind.past || []), rnd);
    more.forEach(function(x){ if(pick.indexOf(x) < 0) take(x); });
    rest = shuffle(rest, rnd);
    while(pick.length < 4 && rest.length) pick.push(rest.shift());
    /* Still short (a group with one way in, like a diazonium salt): other
       molecules on the way from the start, each with a reaction it really
       does, which makes something else. */
    if(pick.length < 4){
      var near = Object.keys(G.states).map(function(k){ return G.states[k]; })
        .filter(function(q){ return !q.mol.generic && !pick.some(function(x){ return x.q.key === q.key; }) && (pos === 'GOAL' || q.key !== pos.key); });
      var extra = [];
      shuffle(near, rnd).forEach(function(q){
        movesFrom(P, q).forEach(function(m){
          var k = q.key + '>' + rxText(m.e);
          if(seen[k] || m.next.mol.generic) return;
          var v = backJudge(P, pos, q, m.e, chain);
          if(v.kind !== 'other') return;
          seen[k] = 1; extra.push({ q: q, e: m.e, v: v, k: k, d: G.fd[q.key] });
        });
      });
      // Nearest the molecule being made first: the ones a student might confuse.
      var want = pos === 'GOAL' ? G.gd - 1 : G.fd[pos.key] - 1;
      extra.sort(function(a, b){ return Math.abs(a.d - want) - Math.abs(b.d - want); });
      var usedQ = {};
      extra.forEach(function(x){ if(pick.length < 4 && !usedQ[x.q.key]){ usedQ[x.q.key] = 1; pick.push(x); } });
    }
    // Last resort: a third tile on one precursor beats three tiles.
    more.forEach(function(x){ if(pick.length < 4 && pick.indexOf(x) < 0) pick.push(x); });
    return shuffle(pick, rnd);
  }

  /* ---- Random problems ----------------------------------------------------

     A random start and target on one skeleton, 2 to 4 steps apart, kept only
     if the roadmap's router finds a route between the two groups AND the
     exact walk reaches the molecule. */
  var FAM_LIST = Object.keys(SD.FAMILIES).map(function(k){ return SD.FAMILIES[k]; })
    .filter(function(f){ return ['C3', 'C4', 'iC4', 'cyc', 'benz', 'PhEt'].indexOf(f.id) >= 0; });

  function randomProblem(rand, okFn){
    rand = rand || Math.random;
    for(var tries = 0; tries < 400; tries++){
      var fam = FAM_LIST[Math.floor(rand() * FAM_LIST.length)];
      var mols = fam.mols.filter(function(m){ return !m.via && !m.after && (m.f || m.text) && !/^an? /.test(m.name); });
      var a = mols[Math.floor(rand() * mols.length)], b = mols[Math.floor(rand() * mols.length)];
      if(!a || !b || a.g === b.g) continue;
      if(fam.mols.filter(function(m){ return m.g === b.g; }).length > 1 && !b.p) continue;
      var def = { id: 'r-' + fam.id + '-' + a.g + (a.p ? '.' + a.p : '') + '-' + b.g + (b.p ? '.' + b.p : ''), fam: fam,
        start: { g: a.g, p: a.p }, target: { g: b.g, p: b.p }, random: true };
      var P = prepare(def);
      if(P.start.mol !== a || P.targetMol.m !== b) continue;
      var proof = R.routes(a.g, b.g, { skeleton: true, set: P.start.set, end: b.p ? [b.p] : null,
        edgeOk: function(e){ return !P.ban[base(e.id)]; } });
      if(!proof.shortest.length) continue;
      var d = dist(P, P.start);
      if(d < 2 || d > 4) continue;
      if(okFn && !okFn(P)) continue;
      return P;
    }
    return null;
  }

  /* The topics a problem's shortest route teaches, and the latest chapter
     among them: what the chapter filter reads. */
  function topicsOf(P){
    if(P.topics) return P.topics;
    var r = shortest(P, P.start) || [];
    var t = [];
    r.forEach(function(m){ if(t.indexOf(m.e.topic) < 0) t.push(m.e.topic); });
    P.topics = t;
    return t;
  }

  window.OchemSynthesisEngine = {
    prepare: prepare, apply: apply, judge: judge, dist: dist, shortest: shortest, isGoal: isGoal,
    choices: choices, movesFrom: movesFrom, forwardGraph: forwardGraph, backDist: backDist,
    backJudge: backJudge, backChoices: backChoices, randomProblem: randomProblem, topicsOf: topicsOf,
    rxText: rxText, base: base, lookup: lookup
  };

  function lc(s){ return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

  /* ======================================================================
     The page
     ====================================================================== */

  var B = window.OchemBuilder, MolR = window.OchemMolecules, Chem = window.OchemChem, C = window.OchemCurriculum;
  var SUBD = '₀₁₂₃₄₅₆₇₈₉';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function nodeName(id){ var n = node(id); return n ? n.name : id; }
  function aName(id){ var n = lc(nodeName(id)); return (/^[aeiou]/i.test(n) ? 'an ' : 'a ') + n; }
  // "Grignard addition" keeps its capital; "Acid-catalyzed hydration" loses it mid-sentence.
  var PROPER = /^(Williamson|Grignard|Fischer|Friedel|Gabriel|Wittig|Hofmann|Baeyer|Corey|Sandmeyer|Birch|Clemmensen|Wolff|Lindlar|SNAr|Sₙ|E2|E1)/;
  function lcName(n){ return PROPER.test(n) ? n : lc(n); }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }

  /* ---- Drawing a molecule ------------------------------------------------- */

  /* Labels carry their hydrogens (OH, CH₂), as in the Acid/Base Comparator:
     a student reading a synthesis needs to see which carbon holds what. */
  function drawingOf(st){
    var mol = Chem.toMolecule(st);
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k], m = mol.atoms[k];
      if(!a.el || a.group) return;
      var h = a.hFixed !== undefined ? a.hFixed : (a.hImplicit || 0);
      m.label = a.el + (h > 0 ? 'H' + (h > 1 ? SUBD[h] : '') : '');
      m.r = Math.max(m.r || 14, m.label.length > 2 ? 17 : 15);
    });
    Object.keys(mol.atoms).forEach(function(k){ var t = mol.atoms[k]; t.x = 160 + (t.x - 160) * 1.45; t.y = 85 + (t.y - 85) * 1.45; });
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    Object.keys(mol.atoms).forEach(function(k){ var t = mol.atoms[k], pd = t.r + (t.lp ? 11 : 5);
      x0 = Math.min(x0, t.x - pd); x1 = Math.max(x1, t.x + pd); y0 = Math.min(y0, t.y - pd); y1 = Math.max(y1, t.y + pd); });
    var w = Math.max(150, x1 - x0), hgt = Math.max(110, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    mol.viewBox = Math.round(cx - w / 2) + ' ' + Math.round(cy - hgt / 2) + ' ' + Math.round(w) + ' ' + Math.round(hgt);
    return mol;
  }

  /* The course's builder lays every chain out as a zig-zag, which draws a
     C=C as trans. A cis alkene gets the far side of its double bond
     reflected across the bond; a cis or trans 1,2-diol on a ring gets a
     wedge and a wedge (cis) or a wedge and a dash (trans). */
  function applyStereo(st, stereo){
    if(!stereo) return;
    var ring = st.ring || [];
    if(!ring.length){
      var db = st.bonds.filter(function(b){ return b.order === 2 && st.atoms[b.a].el === 'C' && st.atoms[b.b].el === 'C'; })[0];
      if(!db || stereo !== 'cis') return;
      var A = st.atoms[db.a], Bt = st.atoms[db.b];
      // Everything joined to b without passing through a.
      var side = {}, stack = [db.b]; side[db.b] = 1;
      while(stack.length){
        var k = stack.pop();
        Chem.neighbors(st, k).forEach(function(n){ if(n !== db.a && !side[n]){ side[n] = 1; stack.push(n); } });
      }
      var dx = Bt.x - A.x, dy = Bt.y - A.y, L = dx * dx + dy * dy;
      Object.keys(side).forEach(function(k){
        if(k === db.b) return;
        var p = st.atoms[k], t = ((p.x - A.x) * dx + (p.y - A.y) * dy) / L;
        var fx = A.x + t * dx, fy = A.y + t * dy;
        p.x = 2 * fx - p.x; p.y = 2 * fy - p.y;
      });
      return;
    }
    var subs = st.bonds.filter(function(b){
      return (ring.indexOf(b.a) >= 0) !== (ring.indexOf(b.b) >= 0) && /^(O|N|Br|Cl)$/.test(st.atoms[ring.indexOf(b.a) >= 0 ? b.b : b.a].el);
    });
    subs.forEach(function(b, i){ b.style = i === 0 || stereo === 'cis' ? 'wedge' : 'dash'; });
  }

  var drawCache = {};
  function structSvg(m, label){
    if(!m || !m.f || !B || !MolR || !Chem) return '';
    var key = JSON.stringify(m.f) + '|' + (m.stereo || '');
    if(drawCache[key] === undefined){
      var mol = null;
      try{
        var r = typeof m.f === 'string' ? B.parse(m.f) : B.parseRing(m.f);
        if(r && r.st){ B.centre(r.st); applyStereo(r.st, m.stereo); mol = drawingOf(r.st); }
      }catch(e){ mol = null; }
      drawCache[key] = mol;
    }
    if(!drawCache[key]) return '';
    return MolR.svg(drawCache[key], { caption: '', label: label || m.name });
  }

  function molCard(m, role, extra){
    var pic = structSvg(m, (role ? role + ': ' : '') + m.name);
    return '<figure class="sy-mol' + (extra ? ' ' + extra : '') + '">' +
      (role ? '<figcaption class="sy-mol__k">' + esc(role) + '</figcaption>' : '') +
      (pic ? '<div class="sy-mol__pic">' + pic + '</div>' : '<div class="sy-mol__pic sy-mol__pic--text"><span class="tformula">' + esc(m.text || '') + '</span></div>') +
      '<div class="sy-mol__name">' + esc(m.name) + '</div>' +
    '</figure>';
  }

  /* ---- Words for every verdict -------------------------------------------- */

  function patLabel(g, list){
    var n = node(g), P = n && n.patterns ? D.PATTERNS[n.patterns] : null;
    if(!P) return '';
    return P.label + ' ' + list.map(function(p){ return P.set[p]; }).filter(Boolean).join(' or ');
  }

  function rxShort(e){ return rxText(e); }

  /* Why picking e from state s does not move the route on. Every sentence is
     built from the graph (the edge's own `sub`, `needs`, `cc`, `name`) or
     from the problem's data (ban, ccWhy, target.wrong). */
  function reason(P, s, e, v){ return undash(reason0(P, s, e, v)); }
  function reason0(P, s, e, v){
    var here = s.mol.name;
    switch(v.kind){
      case 'elsewhere':
        return 'Not a reaction of ' + lc(nodeName(s.g)) + ' in this course. It is the reagent for ' + lcName(e.name) + ': ' +
          lc(nodeName(e.from)) + ' to ' + lc(nodeName(e.to)) + '.';
      case 'ban': return v.why;
      case 'skeleton':
        return e.name + ' changes the carbon skeleton (' + e.cc + '). ' +
          (P.def.ccWhy ? P.def.ccWhy + ' This step does not build it.' : 'The target has the same carbons as the start, so no step may add or cut one.');
      case 'twice':
        return 'The new C–C bond is already made. ' + (P.def.ccWhy || '') + ' Another one would overshoot.';
      case 'final':
        return 'This fastens a second molecule onto yours (' + e.name + '): ' + here + ' would become one half of ' + aName(e.to) +
          '. That is only worth doing as the last step, when the target is that ' + lc(nodeName(e.to)) + '. Here it adds a piece you would have to cut off again.';
      case 'needs':
        var want = e.needs ? patLabel(e.from, e.needs) : (e.map ? patLabel(e.from, Object.keys(e.map)) : '');
        var is = s.mol.p && node(s.g).patterns ? D.PATTERNS[node(s.g).patterns].set[s.mol.p] : '';
        return (e.sub ? e.sub + ' ' : '') + (want ? 'It needs ' + want + ', and ' + here + (is ? ' is ' + is : ' is not one') + '.'
          : 'It does not work on ' + here + '.');
      case 'back':
        return 'That gives ' + v.next.mol.name + ' again, which is already on your route: it undoes work instead of moving on.';
      case 'wrongmol':
        return v.why;
      case 'shape':
        return 'That gives ' + v.next.mol.name + '. ' + (e.regio ? e.regio + ' ' : '') +
          'It is the wrong isomer for this route: from it nothing in the course reaches ' + P.targetMol.m.name + ' without changing the skeleton.';
      case 'nowhere':
        if(e.final) return 'That gives ' + v.next.mol.name + ', not ' + P.targetMol.m.name + '. A step that joins a second molecule on can only be the last one in this trainer, so there is no fixing it afterwards.';
        var outs = R.edgesFrom(v.next.g).filter(function(x){ return x.from !== x.to; }).length;
        if(v.next.g === 'alkane') return 'That gives ' + v.next.mol.name + ', which has no functional group left. The only way back in is radical bromination: it takes the most substituted C–H and gives a mixture where several are alike, so it cannot put a group just where ' + P.targetMol.m.name + ' needs it. Step back.';
        return 'That gives ' + v.next.mol.name + '. ' + (outs
          ? 'Real chemistry, but a dead end here: the Reagent Roadmap has no route from ' + v.next.mol.name + ' to ' + P.targetMol.m.name + ' on this skeleton. Step back.'
          : 'The Reagent Roadmap has no reaction that takes ' + aName(v.next.g) + ' on toward ' + P.targetMol.m.name + '. Step back.');
    }
    return '';
  }

  function stepNotes(e){
    return undash([e.regio, e.stereo].filter(Boolean).join(' '));
  }
  function topicLink(id){
    var t = C && C.findTopic ? C.findTopic(id) : null;
    return '<a class="sy-learn" href="../notes/' + esc(id) + '.html">' + esc(t ? t.title : id) + '</a>';
  }

  /* ---- State --------------------------------------------------------------- */

  var root = document.getElementById('syRoot');
  // The node test harness hands every lookup a stand-in element that has no
  // insertAdjacentHTML: there is no page to build, only the quiz to mount.
  var live = !!(root && typeof root.insertAdjacentHTML === 'function');

  var STORE = 'ochem_synth_v1';
  function load(){ try{ var d = JSON.parse(localStorage.getItem(STORE) || 'null'); return d && d.v === 1 ? d : { v: 1, solved: {} }; }catch(e){ return { v: 1, solved: {} }; } }
  function save(d){ try{ localStorage.setItem(STORE, JSON.stringify(d)); }catch(e){} }

  var CURATED = SD.PROBLEMS.map(function(d, i){ var P = prepare(d); P.n = i + 1; return P; });
  function byId(id){
    for(var i = 0; i < CURATED.length; i++) if(CURATED[i].id === id) return CURATED[i];
    var m = /^r~(\w+)~([a-z0-9-]+)(?:\.(\w+))?~([a-z0-9-]+)(?:\.(\w+))?$/.exec(id || '');
    if(m && SD.FAMILIES[m[1]] && node(m[2]) && node(m[4])){
      var P = prepare({ id: id, fam: SD.FAMILIES[m[1]], start: { g: m[2], p: m[3] }, target: { g: m[4], p: m[5] }, random: true });
      if(dist(P, P.start) !== Infinity && dist(P, P.start) > 0) return P;
    }
    return null;
  }

  /* Chapters: a problem belongs to the latest chapter its shortest route
     needs. The filter shows the problems a student can do with the chapters
     up to the one picked. */
  var CH = {};
  if(C) C.MODULES.forEach(function(m, i){ m.topics.forEach(function(t){ CH[t.id] = i + 1; }); });
  function chapterOf(P){ var t = topicsOf(P), c = 0; t.forEach(function(x){ c = Math.max(c, CH[x] || 0); }); return c; }
  CURATED.forEach(function(P){ P.ch = chapterOf(P); });
  window.OchemSynthesisEngine.chapterOf = chapterOf;
  window.OchemSynthesisEngine.CURATED = CURATED;

  /* The furthest chapter this student has started a lesson in, as the
     default reach: 0 means "every chapter". */
  function reachDefault(){
    var p = {}; try{ p = JSON.parse(localStorage.getItem('ochem_progress') || '{}') || {}; }catch(e){}
    var far = 0;
    Object.keys(p).forEach(function(t){ if(CH[t] && p[t] && (p[t].completed || p[t].step)) far = Math.max(far, CH[t]); });
    return far;
  }

  var S = {
    mode: 'fwd', P: null, reach: 0,
    // forward
    hist: [], steps: [], tried: {}, note: null, hint: 0, misses: 0, dead: null, done: false,
    // backward
    chain: [], bsteps: [], bnote: null, bdone: false
  };

  function pool(){ return CURATED.filter(function(P){ return !S.reach || P.ch <= S.reach; }); }

  function setProblem(P, mode){
    S.P = P; if(mode) S.mode = mode;
    S.hist = [P.start]; S.steps = []; S.tried = {}; S.note = null; S.hint = 0; S.misses = 0; S.dead = null; S.done = false;
    S.chain = []; S.bsteps = []; S.bnote = null; S.bdone = false;
    S.logged = false;
  }

  function cur(){ return S.hist[S.hist.length - 1]; }
  function bpos(){ return S.chain.length ? S.chain[S.chain.length - 1] : 'GOAL'; }

  /* ---- Recording -------------------------------------------------------------

     Each judged pick is evidence about the reaction's topic (the dashboard's
     chapter strength and the Mastery page read these); a finished problem is
     one answer on the course's daily accuracy line and one review of the
     synthesis concept it practises, which is what puts synthesis back in the
     Review queue when it slips. A pick that only names a reagent from another
     group is not evidence about any topic and records nothing. */
  function notePick(e, ok){
    var M = window.OchemMastery;
    if(M && M.noteTopicAttempt && e && e.topic) M.noteTopicAttempt(e.topic, !!ok);
  }
  function finishProblem(clean){
    if(S.logged) return;
    S.logged = true;
    var P = S.P, d = load(), was = d.solved[P.id] || {};
    var n = S.mode === 'fwd' ? S.steps.length : S.bsteps.length;
    d.solved[P.id] = { best: Math.min(was.best || 99, n), fwd: was.fwd || S.mode === 'fwd', back: was.back || S.mode === 'back', clean: was.clean || clean, at: Date.now() };
    save(d);
    var M = window.OchemMastery, concept = S.mode === 'back' ? 'disconnection' : (P.two ? 'cc-bond-toolkit' : 'fgi-map');
    if(M && M.record && window.OchemConcepts && window.OchemConcepts.get(concept)) M.record(concept, clean, { tier: 3 });
    if(window.LevlPremium && window.LevlPremium.noteAnswer) window.LevlPremium.noteAnswer('ochem', clean, 'synth:' + P.id.slice(0, 50), 'multistep-synthesis');
    if(window.HubProgress && window.HubProgress.recordActivity) window.HubProgress.recordActivity('ochem', 1);
  }

  /* ---- Forward ----------------------------------------------------------- */

  function tiles(){
    var s = cur();
    S.tiles = S.tiles && S.tiles.key === s.key + '|' + S.steps.length ? S.tiles : { key: s.key + '|' + S.steps.length, list: choices(S.P, s, S.hist) };
    return S.tiles.list;
  }

  function pick(i){
    if(S.done || S.dead) return;
    var t = tiles()[i]; if(!t) return;
    var s = cur(), e = t.e, v = judge(S.P, s, e, S.hist);
    if(!t.edges.length) v = { kind: 'elsewhere' };
    var k = v.kind;
    if(k === 'goal' || k === 'good' || k === 'detour'){
      notePick(e, k !== 'detour');
      S.steps.push({ e: e, from: s, v: v }); S.hist.push(v.next);
      S.note = { tone: k === 'detour' ? 'warn' : 'good', e: e, v: v };
      S.tried = {}; S.hint = 0;
      if(k === 'goal'){ S.done = true; finishProblem(S.misses === 0 && !S.usedReagentHint); }
    } else if(k === 'wrongmol' || k === 'shape' || k === 'nowhere'){
      // Real chemistry, and it is shown: then the student steps back.
      notePick(e, false); S.misses++;
      S.steps.push({ e: e, from: s, v: v, dead: true }); S.hist.push(v.next);
      S.dead = { e: e, v: v, text: reason(S.P, s, e, v) };
      S.note = null;
    } else {
      if(k !== 'elsewhere') notePick(e, false);
      S.misses++;
      S.tried[i] = reason(S.P, s, e, v);
      S.note = { tone: 'bad', e: e, v: v, text: S.tried[i], k: t.k };
    }
    render(true);
  }

  function stepBack(){
    if(S.mode === 'back') return bStepBack();
    if(!S.steps.length) return;
    S.steps.pop(); S.hist.pop();
    S.dead = null; S.done = false; S.note = null; S.tried = {}; S.hint = 0;
    render();
  }

  /* Hints, one layer at a time: which way on the ladder, which group to aim
     for, then the reagent itself. */
  function hintText(){
    var P = S.P;
    if(S.mode === 'back') return bHintText();
    var r = shortest(P, cur());
    if(!r || !r.length) return '';
    var e = r[0].e, a = node(e.from), b = node(e.to), out = [];
    var dir = e.cc ? 'This step makes a C–C bond (' + e.cc + ').'
      : (typeof a.band === 'number' && typeof b.band === 'number')
        ? (b.band > a.band ? 'Go up the oxidation ladder: this step needs an oxidant.' : b.band < a.band ? 'Go down the oxidation ladder: this step needs a reductant.' : 'Stay on the same rung of the ladder: no oxidant or reductant this step.')
        : 'This step puts a group on the benzene ring, or changes the one already there.';
    out.push(dir + ' ' + plural(r.length, 'step') + ' to go at best.' + (S.steps.length === 0 && P.def.hint ? ' ' + P.def.hint : ''));
    if(S.hint >= 2) out.push('Aim for ' + r[0].next.mol.name + ' (' + aName(e.to) + ') next.');
    if(S.hint >= 3) out.push('Use ' + rxText(e) + ' (' + lcName(e.name) + ').');
    return out;
  }
  function hint(){ if(S.hint < 3) S.hint++; if(S.hint >= 3) S.usedReagentHint = true; render(); }

  /* ---- Backward ------------------------------------------------------------ */

  function btiles(){
    var pos = bpos(), key = (pos === 'GOAL' ? 'G' : pos.key) + '|' + S.chain.length;
    if(!S.btiles || S.btiles.key !== key) S.btiles = { key: key, list: backChoices(S.P, pos, S.chain) };
    return S.btiles.list;
  }
  function bpick(i){
    if(S.bdone) return;
    var t = btiles()[i]; if(!t) return;
    var v = t.v, pos = bpos(), posMol = pos === 'GOAL' ? S.P.targetMol.m : pos.mol;
    if(v.kind === 'done' || v.kind === 'good' || v.kind === 'detour'){
      notePick(t.e, v.kind !== 'detour');
      S.bsteps.push({ q: t.q, e: t.e, v: v, to: posMol });
      S.tried = {}; S.hint = 0;
      if(v.kind === 'done'){ S.bdone = true; S.bnote = { tone: 'good', t: t }; finishProblem(S.misses === 0 && !S.usedReagentHint); }
      else { S.chain.push(t.q); S.bnote = { tone: v.kind === 'detour' ? 'warn' : 'good', t: t }; }
    } else {
      notePick(t.e, false); S.misses++;
      S.tried[i] = breason(t, posMol);
      S.bnote = { tone: 'bad', t: t, text: S.tried[i] };
    }
    render(true);
  }
  function bStepBack(){
    if(!S.bsteps.length) return;
    var last = S.bsteps.pop();
    if(!S.bdone) S.chain.pop();
    S.bdone = false; S.bnote = null; S.tried = {}; S.hint = 0;
    render();
  }
  function breason(t, posMol){
    var v = t.v, q = t.q.mol.name;
    if(v.kind === 'other'){
      if(v.made) return t.e.name + ' on ' + q + ' gives ' + v.made.mol.name + ', not ' + posMol.name + '.';
      var w = v.why ? reason(S.P, t.q, t.e, v.why) : '';
      return 'Not that way: ' + (w || rxText(t.e) + ' does not turn ' + q + ' into ' + posMol.name + '.');
    }
    if(v.kind === 'unmade') return 'Real chemistry: ' + rxText(t.e) + ' does turn ' + q + ' into ' + posMol.name +
      '. But nothing in the course makes ' + q + ' from ' + S.P.start.mol.name + (S.P.two ? ' with the one C–C step this problem allows' : ' on the same skeleton') + ', so the route cannot get there.';
    if(v.kind === 'past') return 'Real chemistry: ' + rxText(t.e) + ' does turn ' + q + ' into ' + posMol.name +
      '. But the only way to ' + q + ' from ' + S.P.start.mol.name + ' goes through ' + S.P.targetMol.m.name + ' itself, so it cannot come before it.';
    if(v.kind === 'joined') return 'Real chemistry: ' + rxText(t.e) + ' does turn ' + q + ' into ' + posMol.name +
      '. But ' + q + ' is made by joining a second molecule on, and in this trainer a step like that can only be the last one in a route, not the middle.';
    if(v.kind === 'loop') return q + ' is already on your route, further down. Going back to it is a loop.';
    return '';
  }
  function bHintText(){
    var P = S.P, pos = bpos(), G = forwardGraph(P);
    var opts = btiles().filter(function(t){ return t.v.kind === 'good' || t.v.kind === 'done'; });
    if(!opts.length) return '';
    var t = opts[0], e = t.e, out = [];
    var left = pos === 'GOAL' ? G.gd : G.fd[pos.key];
    var a = node(e.from), b = node(e.to);
    out.push((e.cc ? 'The last bond made here is a C–C bond (' + e.cc + ').' :
      (typeof a.band === 'number' && typeof b.band === 'number')
        ? (b.band > a.band ? 'Look one rung down the ladder: this was made by an oxidation.' : b.band < a.band ? 'Look one rung up the ladder: this was made by a reduction.' : 'Look on the same rung of the ladder: no redox in this step.')
        : 'This step put a group on the benzene ring, or changed the one already there.') + ' ' + plural(left, 'step') + ' back to the start at best.' + (S.bsteps.length === 0 && P.def.hint ? ' ' + P.def.hint : ''));
    if(S.hint >= 2) out.push('It was made from ' + aName(e.from) + '.');
    if(S.hint >= 3) out.push('From ' + t.q.mol.name + ', with ' + rxText(e) + '.');
    return out;
  }

  /* ---- Rendering ----------------------------------------------------------- */

  var studio = window.OchemStudio || null;
  var el = {};

  function build(){
    root.innerHTML =
      '<div class="sy-stage" id="syStage"></div>' +
      '<div class="sy-dock" id="syDock">' +
        '<p class="sy-ask" id="syAsk"></p>' +
        // The verdict sits above the tiles, so on a phone it is in view next
        // to the tile just tapped.
        '<div class="sy-note" id="syNote" aria-live="polite"></div>' +
        '<div class="sy-tiles" id="syTiles" role="group" aria-label="Choices for the next step"></div>' +
        '<div class="sy-acts" id="syActs"></div>' +
      '</div>' +
      '<div class="sy-why" id="syWhy"></div>' +
      '<div class="sy-probs" id="syProbs"></div>';
    ['Stage', 'Dock', 'Ask', 'Tiles', 'Note', 'Acts', 'Why', 'Probs'].forEach(function(k){ el[k] = document.getElementById('sy' + k); });
    if(studio){
      studio.root.classList.add('sy-ls');
      studio.modes({ items: [{ value: 'fwd', label: 'Forward' }, { value: 'back', label: 'Backward' }], value: S.mode,
        onChange: function(v){ if(v !== S.mode){ setProblem(S.P, v); render(); sync(); } } });
      studio.add('stage', el.Stage);
      studio.add('dock', el.Dock);
      studio.add('why', el.Why);
      studio.add('details', el.Probs);
      // The problem list first in its sheet, above Check yourself and Keep going.
      if(el.Probs.parentNode) el.Probs.parentNode.insertBefore(el.Probs, el.Probs.parentNode.firstChild);
      root.hidden = true;
    } else {
      root.insertAdjacentHTML('afterbegin', '<div class="tseg sy-seg" role="group" aria-label="Direction"><button type="button" data-m="fwd">Forward</button><button type="button" data-m="back">Backward</button></div>');
      root.querySelector('.sy-seg').addEventListener('click', function(ev){ var b = ev.target.closest('button'); if(b){ setProblem(S.P, b.getAttribute('data-m')); render(); sync(); } });
    }
    el.Tiles.addEventListener('click', function(ev){
      var b = ev.target.closest('.sy-tile'); if(!b || b.disabled) return;
      var i = parseInt(b.getAttribute('data-i'), 10);
      if(S.mode === 'fwd') pick(i); else bpick(i);
    });
    el.Acts.addEventListener('click', function(ev){
      var b = ev.target.closest('button'); if(!b) return;
      var a = b.getAttribute('data-act');
      if(a === 'back') stepBack();
      else if(a === 'hint') hint();
      else if(a === 'next') nextProblem();
      else if(a === 'flip'){ setProblem(S.P, S.mode === 'fwd' ? 'back' : 'fwd'); if(studio) studio.mode(S.mode); render(); sync(); }
      else if(a === 'list'){ if(studio) studio.open('details'); else el.Probs.scrollIntoView(); }
      else if(a === 'again'){ setProblem(S.P); render(); }
      if(a !== 'list'){ var f = el.Tiles.querySelector('.sy-tile:not([disabled])') || el.Acts.querySelector('button'); if(f && document.activeElement === document.body) f.focus({ preventScroll: true }); }
    });
    el.Probs.addEventListener('click', function(ev){
      var b = ev.target.closest('[data-p]'); if(b){ var P = byId(b.getAttribute('data-p')); if(P){ setProblem(P); render(); sync(); if(studio) studio.close(); } return; }
      if(ev.target.closest('[data-random]')) randomOne();
    });
    el.Probs.addEventListener('change', function(ev){
      if(ev.target.id === 'syReach'){ S.reach = parseInt(ev.target.value, 10) || 0; try{ localStorage.setItem('ochem_synth_reach', String(S.reach)); }catch(e){} renderProbs(); }
    });
  }

  function nextProblem(){
    var list = pool(), d = load(), i = list.indexOf(S.P);
    var after = list.slice(i + 1).concat(list.slice(0, Math.max(0, i)));
    var P = after.filter(function(x){ return !d.solved[x.id]; })[0] || after[0] || list[0];
    if(!P){ randomOne(); return; }
    setProblem(P, 'fwd'); if(studio) studio.mode('fwd'); render(); sync();
  }
  function randomOne(){
    var P = randomProblem(null, function(Q){ return !S.reach || chapterOf(Q) <= S.reach; });
    if(P){ P.id = 'r~' + P.def.fam.id + '~' + P.def.start.g + (P.def.start.p ? '.' + P.def.start.p : '') + '~' + P.def.target.g + (P.def.target.p ? '.' + P.def.target.p : ''); setProblem(P, 'fwd'); if(studio){ studio.mode('fwd'); studio.close(); } render(); sync(); }
  }

  function sync(){
    if(!window.OchemToolState || !S.P) return;
    window.OchemToolState.write({ p: S.P.id, m: S.mode === 'back' ? 'back' : null });
  }

  function trailHtml(){
    var P = S.P, items = [];
    if(S.mode === 'fwd'){
      items.push({ name: P.start.mol.name, cls: 'is-a' });
      S.steps.forEach(function(st){ items.push({ name: st.v.next.mol.name, cls: st.dead ? 'is-dead' : (st.v.kind === 'goal' ? 'is-b' : '') }); });
      if(!S.done) items.push({ name: '?', cls: 'is-gap' }, { name: P.targetMol.m.name, cls: 'is-b' });
    } else {
      items.push({ name: P.start.mol.name, cls: 'is-a' });
      if(!S.bdone) items.push({ name: '?', cls: 'is-gap' });
      S.bsteps.slice().reverse().forEach(function(st){ if(st.v.kind !== 'done') items.push({ name: st.q.mol.name, cls: '' }); });
      items.push({ name: P.targetMol.m.name, cls: 'is-b' });
    }
    return '<ol class="sy-trail" aria-label="Your route so far">' + items.map(function(it, i){
      return '<li class="sy-trail__n ' + it.cls + '">' + (i ? '<span class="sy-trail__arr" aria-hidden="true">&rarr;</span>' : '') + '<span>' + esc(it.name) + '</span></li>';
    }).join('') + '</ol>';
  }

  function renderStage(){
    var P = S.P, left, right, gap;
    if(S.mode === 'fwd'){
      var c = cur(), last = S.steps[S.steps.length - 1];
      left = molCard(c.mol, S.done ? 'Made it' : (S.steps.length ? (S.dead ? 'Dead end' : 'Step ' + S.steps.length) : 'Start'), S.dead ? 'is-dead' : (S.done ? 'is-done' : ''));
      right = molCard(P.targetMol.m, 'Target', 'is-target');
      gap = S.done ? '<span class="sy-gap__t">&#10003;</span>' : (last && !S.dead ? '<span class="sy-gap__rx">' + esc(rxText(last.e)) + '</span>' : '') + '<span class="sy-gap__t">' + (S.dead ? '&times;' : '?') + '</span>';
      if(S.done){ left = ''; right = molCard(P.targetMol.m, 'Made it', 'is-done is-target'); }
    } else {
      var pos = bpos();
      left = molCard(P.start.mol, 'Start', '');
      right = molCard(pos === 'GOAL' ? P.targetMol.m : pos.mol, S.bdone ? 'Made it' : (S.chain.length ? 'Working back: step ' + S.chain.length : 'Target'), S.bdone ? 'is-done' : 'is-target');
      gap = '<span class="sy-gap__t">' + (S.bdone ? '&#10003;' : '?') + '</span>';
      if(S.bdone) left = '';
    }
    el.Stage.innerHTML = trailHtml() +
      '<div class="sy-pair' + (left ? '' : ' is-one') + (S.mode === 'back' ? ' is-back' : '') + '">' + left +
        (left ? '<div class="sy-gap" aria-hidden="true">' + gap + '</div>' : '') + right + '</div>';
    var tr = el.Stage.querySelector('.sy-trail'); if(tr) tr.scrollLeft = tr.scrollWidth;
  }

  function tileHtml(t, i, tried){
    return '<button type="button" class="sy-tile' + (tried ? ' is-no' : '') + '" data-i="' + i + '"' + (tried ? ' aria-disabled="true"' : '') + '>' +
      '<span class="sy-tile__rx">' + esc(t.k) + '</span>' + (tried ? '<span class="sy-tile__x">Not this</span>' : '') + '</button>';
  }
  function btileHtml(t, i, tried){
    return '<button type="button" class="sy-tile sy-tile--b' + (tried ? ' is-no' : '') + '" data-i="' + i + '"' + (tried ? ' aria-disabled="true"' : '') + '>' +
      '<span class="sy-tile__mol">' + esc(t.q.mol.name) + '</span><span class="sy-tile__rx">then ' + esc(rxText(t.e)) + '</span>' +
      (tried ? '<span class="sy-tile__x">Not this</span>' : '') + '</button>';
  }

  function routeLine(list){
    return list.map(function(m){ return esc(rxText(m.e)) + ' &rarr; <b>' + esc(m.next.mol.name) + '</b>'; }).join('; ');
  }

  function renderDock(){
    var P = S.P, acts = [], note = '', ask = '', tl = '';
    var hints = S.hint ? hintText() : null;
    if(S.mode === 'fwd'){
      if(S.done){
        var best = dist(P, P.start), n = S.steps.length;
        ask = '';
        note = '<div class="tnote tnote--good"><span class="tnote__k">' + (n === best ? 'Made it in the fewest steps' : 'Made it') + '</span>' +
          esc(P.targetMol.m.name) + ' in ' + plural(n, 'step') + (S.misses ? ', after ' + S.misses + (S.misses === 1 ? ' miss' : ' misses') + ' on the way' : ', with no misses') + '.' +
          (n > best ? ' The shortest route takes ' + best + ': ' + routeLine(shortest(P, P.start)) + '.' : '') + '</div>';
        acts.push('<button type="button" class="btn-press" data-act="next">Next problem</button>',
          '<button type="button" class="tchip" data-act="flip">Solve it backward</button>');
      } else if(S.dead){
        ask = '';
        note = '<div class="tnote tnote--bad"><span class="tnote__k">Dead end: ' + esc(S.dead.e.name) + '</span>' + esc(S.dead.text) + '</div>';
        acts.push('<button type="button" class="btn-press" data-act="back">Step back</button>');
      } else {
        ask = S.steps.length ? 'Now at <b>' + esc(cur().mol.name) + '</b>. Pick the reagents for the next step.' : 'Pick the reagents for the first step.';
        tl = tiles().map(function(t, i){ return tileHtml(t, i, S.tried[i]); }).join('');
        if(S.note){
          var v = S.note.v;
          if(S.note.tone === 'bad') note = '<div class="tnote tnote--bad"><span class="tnote__k">' + esc(S.note.k.length > 40 ? S.note.k.slice(0, 38) + '…' : S.note.k) + '</span>' + esc(S.note.text) + '</div>';
          else note = '<div class="tnote tnote--' + (S.note.tone === 'warn' ? 'warn' : 'good') + '"><span class="tnote__k">' + esc(S.note.e.name) + '</span>' +
            'Made ' + esc(v.next.mol.name) + (P.with[base(S.note.e.id)] ? ' (with ' + esc(P.with[base(S.note.e.id)]) + ')' : '') + '. ' +
            (S.note.tone === 'warn' ? 'That works, but it is the long way round: ' + plural(v.left, 'step') + ' to go from here, where the best pick left ' + v.best + '.' : esc(stepNotes(S.note.e))) + '</div>';
        }
        if(S.steps.length) acts.push('<button type="button" class="tchip" data-act="back">Step back</button>');
      }
    } else {
      var pos = bpos(), posMol = pos === 'GOAL' ? P.targetMol.m : pos.mol;
      if(S.bdone){
        var G = forwardGraph(P), bn = S.bsteps.length;
        note = '<div class="tnote tnote--good"><span class="tnote__k">' + (bn === G.gd ? 'Back to the start in the fewest steps' : 'Back to the start') + '</span>' +
          'Read forward, your route is: ' + S.bsteps.slice().reverse().map(function(st){ return esc(rxText(st.e)) + ' &rarr; <b>' + esc(st.to.name) + '</b>'; }).join('; ') + '.' +
          (bn > G.gd ? ' The shortest takes ' + G.gd + ': ' + routeLine(shortest(P, P.start)) + '.' : '') + '</div>';
        acts.push('<button type="button" class="btn-press" data-act="next">Next problem</button>');
      } else {
        ask = 'What was <b>' + esc(posMol.name) + '</b> made from, and with what?';
        tl = btiles().map(function(t, i){ return btileHtml(t, i, S.tried[i]); }).join('');
        if(S.bnote){
          var t = S.bnote.t;
          if(S.bnote.tone === 'bad') note = '<div class="tnote tnote--bad"><span class="tnote__k">Not this one</span>' + esc(S.bnote.text) + '</div>';
          else note = '<div class="tnote tnote--' + (S.bnote.tone === 'warn' ? 'warn' : 'good') + '"><span class="tnote__k">' + esc(t.e.name) + '</span>' +
            esc(t.q.mol.name) + ' can be made from the start' + (S.bnote.tone === 'warn' ? ', but by a longer way: ' + plural(t.v.left, 'step') + ' from the start, where the best pick needed ' + (backDist(P, S.chain.length > 1 ? S.chain[S.chain.length - 2] : 'GOAL') - 1) + '.' : '. Keep working back.') + '</div>';
        }
        if(S.bsteps.length) acts.push('<button type="button" class="tchip" data-act="back">Step back</button>');
      }
    }
    if(!S.done && !S.bdone && !(S.mode === 'fwd' && S.dead)){
      acts.push('<button type="button" class="tchip" data-act="hint">' + (S.hint ? (S.hint < 3 ? 'Another hint' : 'Hints shown') : 'Hint') + '</button>');
    }
    // In the studio the Problems sheet has its own button under the dock.
    if(!studio) acts.push('<button type="button" class="tchip tchip--ghost" data-act="list">Problems</button>');
    if(hints && hints.length && !S.done && !S.bdone && !S.dead){
      note = '<div class="tnote tnote--info sy-hint"><span class="tnote__k">Hint ' + S.hint + ' of 3</span>' + hints.map(esc).join(' ') + '</div>' + note;
    }
    el.Ask.innerHTML = ask; el.Ask.hidden = !ask;
    el.Tiles.innerHTML = tl; el.Tiles.hidden = !tl;
    el.Note.innerHTML = note;
    el.Acts.innerHTML = acts.join('');
    // The reagent hint marks its tile.
    if(S.hint >= 3 && tl){
      var hi = S.mode === 'fwd' ? (shortest(P, cur()) || [])[0] : null;
      el.Tiles.querySelectorAll('.sy-tile').forEach(function(b){
        var t = (S.mode === 'fwd' ? tiles() : btiles())[+b.getAttribute('data-i')];
        var on = S.mode === 'fwd' ? (hi && t.e && rxText(t.e) === rxText(hi.e) && (t.v.kind === 'good' || t.v.kind === 'goal'))
          : (t.v.kind === 'good' || t.v.kind === 'done');
        if(on) b.classList.add('is-hint');
      });
    }
  }

  function stepCard(e, made, i){
    return '<li class="sy-step"><div class="sy-step__h"><b>' + (i + 1) + '. ' + esc(e.name) + '</b> &rarr; ' + esc(made) + '</div>' +
      '<div class="sy-step__rx">' + esc(rxText(e)) + '</div>' +
      (stepNotes(e) ? '<div class="sy-step__n">' + esc(stepNotes(e)) + '</div>' : '') +
      '<div class="sy-step__l">Taught in ' + topicLink(e.topic) + '</div></li>';
  }

  function renderWhy(){
    var P = S.P, h = '';
    h += '<div class="ls-sec"><p class="ls-h">Plan it like this</p><p>' + (S.mode === 'fwd'
      ? 'Ask which group the target is and where it sits on the oxidation ladder compared with the start. Then ask what group comes one step before it, and work toward that.'
      : 'Work backward: look at the target and ask which reaction makes it, from what. Each precursor has to be something the start can become.') +
      (P.two ? ' Count the carbons: ' + esc(P.def.ccWhy || '') + '' : ' The carbon skeleton does not change: no step may add or cut a carbon.') + '</p></div>';
    var list = S.mode === 'fwd' ? S.steps.filter(function(st){ return !st.dead; }).map(function(st){ return { e: st.e, made: st.v.next.mol.name }; })
      : S.bsteps.slice().reverse().map(function(st){ return { e: st.e, made: st.to.name }; });
    if(list.length) h += '<div class="ls-sec"><p class="ls-h">Your route so far</p><ol class="sy-steps">' + list.map(function(x, i){ return stepCard(x.e, x.made, i); }).join('') + '</ol></div>';
    if(S.done || S.bdone){
      var r = shortest(P, P.start);
      h += '<div class="ls-sec"><p class="ls-h">A shortest route</p><ol class="sy-steps">' + r.map(function(m, i){ return stepCard(m.e, m.next.mol.name, i); }).join('') + '</ol></div>';
    }
    h += '<div class="ls-sec"><p class="ls-h">Read more</p><p><a href="../notes/multistep-synthesis.html">Planning a multistep route</a> &middot; <a href="../notes/retrosynthesis.html">Thinking backwards</a> &middot; <a href="reagent-roadmap.html">Reagent Roadmap</a></p></div>';
    el.Why.innerHTML = h;
  }

  function renderProbs(){
    var d = load(), list = pool(), mods = C ? C.MODULES : [];
    var opts = '<option value="0">Every chapter</option>' + mods.map(function(m, i){
      return CURATED.some(function(P){ return P.ch === i + 1; }) ? '<option value="' + (i + 1) + '"' + (S.reach === i + 1 ? ' selected' : '') + '>Up to chapter ' + (i + 1) + ': ' + esc(m.title) + '</option>' : '';
    }).join('');
    el.Probs.innerHTML =
      '<div class="ls-sec"><p class="ls-h"><label for="syReach">Problems from the chapters you have reached</label></p>' +
        '<select id="syReach" class="sy-reach">' + opts + '</select>' +
        '<p class="tmuted">' + plural(list.length, 'problem') + ' of ' + CURATED.length + ', easiest first. Solved ones are ticked.</p></div>' +
      '<ol class="sy-plist">' + list.map(function(P){
        var s = d.solved[P.id];
        return '<li><button type="button" class="sy-pbtn' + (P === S.P ? ' is-on' : '') + '" data-p="' + esc(P.id) + '"' + (P === S.P ? ' aria-current="true"' : '') + '>' +
          '<span class="sy-pbtn__n">' + (s ? '&#10003;' : P.n) + '</span><span class="sy-pbtn__t">' + esc(P.start.mol.name) + ' &rarr; ' + esc(P.targetMol.m.name) +
          '</span><span class="sy-pbtn__m">' + plural(dist(P, P.start), 'step') + (P.two ? ', one new C–C bond' : '') + ' &middot; ch. ' + P.ch + '</span>' +
          (s ? '<span class="sr-only"> (solved)</span>' : '') + '</button></li>';
      }).join('') + '</ol>' +
      '<div class="ls-sec"><p class="ls-h">A random route</p><p class="tmuted">Two groups on one skeleton, 2 to 4 steps apart. Only routes the roadmap proves possible are offered.</p>' +
        '<button type="button" class="btn-press" data-random="1">Random route</button></div>';
  }

  function caption(){
    if(!studio) return;
    var P = S.P, cap, pills = [];
    if(S.mode === 'fwd'){
      if(S.done){ cap = '<b>Made it.</b> ' + esc(P.targetMol.m.name) + ' in ' + plural(S.steps.length, 'step') + '. Why? has the route, step by step.'; pills.push({ html: 'Solved', tone: 'good' }); }
      else if(S.dead){ cap = '<b>Dead end.</b> ' + esc(S.dead.text); pills.push({ html: 'Dead end', tone: 'bad' }); }
      else {
        cap = '<b>Make ' + esc(P.targetMol.m.name) + ' from ' + esc(P.start.mol.name) + '.</b> ' + (S.steps.length ? 'Step ' + (S.steps.length + 1) + ': pick the next reagents.' : 'Pick the reagents for the first step.');
        pills.push({ html: plural(S.steps.length, 'step') + ' so far', tone: 'ghost' });
      }
    } else {
      if(S.bdone){ cap = '<b>Back to the start.</b> Why? has the route read forward.'; pills.push({ html: 'Solved', tone: 'good' }); }
      else { cap = '<b>Work back from ' + esc(P.targetMol.m.name) + ' to ' + esc(P.start.mol.name) + '.</b> Pick what the molecule on the right was made from.'; pills.push({ html: 'Backward', tone: 'ghost' }); }
    }
    studio.caption(cap, S.mode);
    studio.pills(pills, 'left', S.mode);
    studio.pills(S.misses ? [{ html: S.misses + (S.misses === 1 ? ' miss' : ' misses'), tone: 'ghost' }] : [], 'right', S.mode);
  }

  function render(moved){
    if(!S.P) return;
    renderStage(); renderDock(); renderWhy(); renderProbs(); caption();
    if(!studio){ root.querySelectorAll('.sy-seg button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === S.mode)); }); }
    if(moved){
      var f = el.Tiles.querySelector('.sy-tile:not(.is-no)') || el.Acts.querySelector('.btn-press') || el.Acts.querySelector('button');
      if(f) f.focus({ preventScroll: true });
    }
  }

  /* ---- Check yourself ------------------------------------------------------

     "What is the best first step?" from a curated problem: the right answer
     is a step on a shortest route, and the wrong ones are tiles the trainer
     itself judges a dead end or not a step from here, never a longer but
     valid way. */
  function quizQ(){
    var P = CURATED[Math.floor(Math.random() * CURATED.length)];
    var list = choices(P, P.start, [P.start], 'q' + Math.floor(Math.random() * 1000));
    var right = list.filter(function(t){ return t.v.kind === 'good' || t.v.kind === 'goal'; });
    var wrong = list.filter(function(t){ return ['good', 'goal', 'detour'].indexOf(t.v.kind) < 0; });
    if(!right.length || wrong.length < 2) return null;
    var r = right[0];
    return {
      id: 'sy:' + P.id, topic: r.e.topic,
      prompt: 'First step from <b>' + esc(P.start.mol.name) + '</b> toward <b>' + esc(P.targetMol.m.name) + '</b>?',
      options: [{ id: 'r', label: esc(r.k), correct: true }].concat(wrong.slice(0, 3).map(function(t, i){ return { id: 'w' + i, label: esc(t.k), correct: false }; })),
      explain: '<b>' + esc(r.e.name) + '</b> makes ' + esc(r.v.next.mol.name) + '. ' + wrong.slice(0, 3).map(function(t){
        return '<br>' + esc(t.k) + ': ' + esc(reason(P, P.start, t.e, t.v));
      }).join('')
    };
  }
  if(window.OchemToolQuiz){
    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'synthesis', rounds: 5,
      intro: 'Pick the best first step of a route, and see why the others go nowhere.',
      make: function(recent){ var q = quizQ(); return q && recent.indexOf(q.id) < 0 ? q : null; }
    });
  }
  window.OchemSynthesisEngine.reason = reason;
  window.OchemSynthesisEngine.structSvg = structSvg;

  if(!live) return;

  try{ S.reach = parseInt(localStorage.getItem('ochem_synth_reach'), 10) || reachDefault(); }catch(e){ S.reach = 0; }
  var q0 = window.OchemToolState ? window.OchemToolState.read() : {};
  var first = byId(q0.p);
  if(!first){
    var d0 = load(), pl = pool();
    first = pl.filter(function(P){ return !d0.solved[P.id]; })[0] || pl[0] || CURATED[0];
  }
  setProblem(first, q0.m === 'back' ? 'back' : 'fwd');
  build();
  render();
  sync();
  if(studio) studio.hint({ target: '#syTiles .sy-tile', text: S.mode === 'fwd' ? 'Pick a reagent' : 'Pick a precursor' });
})();
