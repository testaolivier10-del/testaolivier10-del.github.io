/* The Synthesis Trainer, checked against the Reagent Roadmap it walks.

   The trainer stores no answers: every step is an edge of the roadmap's graph
   and every verdict comes from the roadmap's engine. So these tests check the
   two things that can still be wrong: the curated problems (each must be
   solvable, and its stated molecules must be the ones the graph produces) and
   the explanations a student is given for a wrong pick (each must say what
   the graph says). The route proofs use the roadmap's own router, routes(),
   independently of the trainer's step-by-step walk. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function load(){
  const s = {
    console, Math, Object, Array, JSON, String, Number, Boolean, Set, Map, Date, Infinity, isNaN, parseInt, parseFloat,
    localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
    location: { search: '', pathname: '/' }, history: { replaceState(){} },
  };
  s.window = s;
  s.document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] };
  vm.createContext(s);
  for(const f of ['ochem/assets/curriculum.js', 'ochem/assets/molecules.js', 'ochem/assets/chem-core.js', 'ochem/assets/mol3d.js',
    'ochem/assets/mol-builder.js', 'ochem/assets/tools/reagent-roadmap-data.js', 'ochem/assets/tools/reagent-roadmap.js',
    'ochem/assets/tools/synthesis-data.js', 'ochem/assets/tools/synthesis.js']){
    vm.runInContext(readFileSync(f, 'utf8'), s, { filename: f });
  }
  return { E: s.OchemSynthesisEngine, SD: s.OchemSynthesisData, D: s.OchemRoadmap, R: s.OchemRoadmapEngine, C: s.OchemCurriculum, B: s.OchemBuilder };
}
const L = load();
const { E, SD, D, R } = L;
const base = (id) => String(id).split('.')[0];

test('about thirty curated problems, 2 to 4 steps, easy to hard', () => {
  assert.ok(SD.PROBLEMS.length >= 28 && SD.PROBLEMS.length <= 40, `${SD.PROBLEMS.length} problems`);
  const ids = new Set();
  let last = 0;
  for(const def of SD.PROBLEMS){
    assert.ok(!ids.has(def.id), `duplicate problem id ${def.id}`); ids.add(def.id);
    const P = E.prepare(def);
    const d = E.dist(P, P.start);
    assert.ok(d >= 2 && d <= 4, `${def.id}: shortest route is ${d} steps`);
    assert.ok(d >= last, `${def.id} (${d} steps) comes after a ${last}-step problem: keep them easy to hard`);
    last = d;
  }
});

test('every curated problem has a valid route, proved by the roadmap router', () => {
  for(const def of SD.PROBLEMS){
    const P = E.prepare(def);
    assert.ok(!P.start.mol.generic, `${def.id}: the start is not a molecule of its family`);
    assert.ok(P.targetMol.m && !P.targetMol.m.generic, `${def.id}: the target is not a molecule of its family`);
    const r = E.shortest(P, P.start);
    assert.ok(r && r.length, `${def.id}: no route`);
    // The route ends on the target molecule and every step is a graph edge.
    assert.equal(r[r.length - 1].next.mol.name, P.targetMol.m.name, `${def.id}: route ends on ${r[r.length - 1].next.mol.name}`);
    let g = P.start.g;
    let cc = 0;
    for(const m of r){
      assert.equal(m.e.from, g, `${def.id}: step ${m.e.id} does not start where the last ended`);
      assert.ok(D.edge(m.e.id), `${def.id}: ${m.e.id} is not a roadmap reaction`);
      if(m.e.cc){ cc++; assert.ok((def.cc || []).some(c => c === m.e.id || c === base(m.e.id)), `${def.id}: ${m.e.id} changes the skeleton, which the problem does not allow`); }
      g = m.e.to;
    }
    assert.ok(cc <= 1, `${def.id}: ${cc} C–C steps`);
    if(P.two) assert.equal(cc, 1, `${def.id}: a two-skeleton problem whose route makes no C–C bond`);
    // Independently: the roadmap's own router, given the same steps it may
    // use, finds a route between the two groups with the patterns stated.
    const proof = R.routes(P.start.g, r[r.length - 1].e.to, {
      skeleton: true, set: P.start.set,
      ccOk: (e) => (def.cc || []).some(c => c === e.id || c === base(e.id)),
      edgeOk: (e) => !P.ban[base(e.id)],
      end: def.target.p ? [def.target.p] : null,
    });
    assert.ok(proof.shortest.length, `${def.id}: the roadmap router finds no route`);
    // The router never takes a step from a group to itself (alkylating an
    // alkyne), so it only bounds routes without one.
    if(!r.some(m => m.e.from === m.e.to)) assert.ok(proof.length <= r.length, `${def.id}: router ${proof.length} vs trainer ${r.length}`);
  }
});

test('any valid route is accepted, not one stored answer', () => {
  // Two different first steps both reach the target where the chemistry allows.
  const P = E.prepare(SD.PROBLEMS.find(p => p.id === 'benz-aniline'));
  const firsts = E.movesFrom(P, P.start).filter(m => E.dist(P, m.next) === 1).map(m => m.e.id);
  assert.ok(firsts.includes('ar-nitrate') && firsts.includes('ar-halogenate'), firsts.join());
  // A longer route still counts.
  const Q = E.prepare(SD.PROBLEMS.find(p => p.id === 'ipa-npa'));
  const hb = E.judge(Q, Q.start, D.edge('oh2-halide'), [Q.start]);
  assert.equal(hb.kind, 'detour');
  const e2 = E.judge(Q, hb.next, D.edge('rx2-e2'), [Q.start, hb.next]);
  assert.equal(e2.kind, 'good');
});

test('every curated molecule draws, and its formula has the right group', () => {
  const { B } = L;
  for(const f of Object.values(SD.FAMILIES)){
    for(const m of f.mols){
      if(!m.f){ assert.ok(m.text, `${f.id}: ${m.name} has neither a structure nor text`); continue; }
      const r = typeof m.f === 'string' ? B.parse(m.f) : B.parseRing(m.f);
      assert.ok(r && r.st && !r.error, `${f.id}: ${m.name} does not parse (${r && r.error})`);
      const atoms = Object.values(r.st.atoms);
      const has = (el) => atoms.some(a => a.el === el);
      const dbl = (x, y) => r.st.bonds.some(b => b.order === 2 && [r.st.atoms[b.a].el, r.st.atoms[b.b].el].sort().join() === [x, y].sort().join());
      const trip = (x, y) => r.st.bonds.some(b => b.order === 3 && [r.st.atoms[b.a].el, r.st.atoms[b.b].el].sort().join() === [x, y].sort().join());
      const want = {
        'alkene': () => dbl('C', 'C') || (m.f.aromatic && m.f.subs && /=/.test(Object.values(m.f.subs).join())), 'alkyne': () => trip('C', 'C'),
        'ketone': () => dbl('C', 'O'), 'aryl-ketone': () => dbl('C', 'O'), 'aldehyde': () => dbl('C', 'O'),
        'acid': () => dbl('C', 'O') && has('O'), 'nitrile': () => trip('C', 'N'), 'amide': () => dbl('C', 'O') && has('N'),
        'acid-chloride': () => dbl('C', 'O') && has('Cl'), 'amine': () => has('N'), 'aniline': () => has('N'),
        'nitroarene': () => has('N'), 'halide-1': () => has('Br'), 'halide-2': () => has('Br'), 'halide-3': () => has('Br'),
        'aryl-halide': () => has('Br'), 'alcohol-1': () => has('O'), 'alcohol-2': () => has('O'), 'alcohol-3': () => has('O'),
        'diol': () => atoms.filter(a => a.el === 'O').length === 2, 'phenol': () => has('O'), 'ether': () => has('O'),
        'alkane': () => !has('O') && !has('N') && !has('Br'),
      }[m.g];
      if(want) assert.ok(want(), `${f.id}: ${m.name} (${JSON.stringify(m.f)}) is not drawn as ${m.g}`);
      // Valences: every carbon has four bonds counting H.
      for(const [k, a] of Object.entries(r.st.atoms)){
        if(a.el !== 'C') continue;
        const n = r.st.bonds.filter(b => b.a === k || b.b === k).reduce((t, b) => t + b.order, 0) + (a.hFixed ?? a.hImplicit ?? 0);
        assert.equal(n, 4, `${f.id}: ${m.name} has a carbon with ${n} bonds`);
      }
    }
  }
});

test('a molecule a step makes is the one its family names for that step', () => {
  // Hand-checked outcomes the walk must reproduce.
  const P = (id) => E.prepare(SD.PROBLEMS.find(p => p.id === id));
  const step = (Q, s, id) => { const a = E.apply(Q, s, D.edge(id)); assert.equal(a.kind, 'ok', id); return a.next; };
  let Q = P('ipa-npa');
  let s = step(Q, Q.start, 'oh2-e1');
  assert.equal(s.mol.name, 'propene');
  assert.equal(step(Q, s, 'ene-hydroboration').mol.name, 'propan-1-ol');
  assert.equal(step(Q, s, 'ene-h3o-2').mol.name, 'propan-2-ol');
  // but-2-ene: hydroboration cannot give butan-1-ol.
  Q = P('acid-amine');
  const but2 = E.prepare({ id: 't', fam: SD.FAMILIES.C4, start: { g: 'alcohol-2' }, target: { g: 'alcohol-1', p: 'b2' } });
  s = step(but2, but2.start, 'oh2-e1');
  assert.equal(s.mol.name, 'but-2-ene');
  assert.notEqual(E.apply(but2, s, D.edge('ene-hydroboration')).kind, 'ok');
  assert.equal(step(but2, s, 'ene-hydroboration-2').mol.name, 'butan-2-ol');
  // Lindlar gives cis, Na/NH₃ trans.
  Q = P('propyne-cis');
  s = step(Q, Q.start, 'yne-alkylate');
  assert.equal(s.mol.name, 'pent-2-yne');
  assert.equal(step(Q, s, 'yne-lindlar').mol.name, 'cis-pent-2-ene');
  assert.equal(step(Q, s, 'yne-na').mol.name, 'trans-pent-2-ene');
  // Friedel–Crafts alkylation rearranges.
  Q = P('benz-propylbenz');
  assert.equal(step(Q, Q.start, 'ar-fc-alkyl').mol.name, 'isopropylbenzene (cumene)');
  assert.equal(step(Q, Q.start, 'ar-fc-acyl').mol.name, 'propiophenone (1-phenylpropan-1-one)');
  // OsO₄ cis, epoxide opening trans.
  Q = P('cyene-transdiol');
  assert.equal(step(Q, Q.start, 'ene-oso4').mol.name, 'cis-cyclohexane-1,2-diol');
});

/* Every tile the trainer can offer on any problem, at every position a
   student can reach, with its explanation held to the graph. */
function everyTile(fn){
  for(const def of SD.PROBLEMS){
    const P = E.prepare(def);
    const seen = new Set();
    const walk = (s, hist, depth) => {
      if(depth > 4 || seen.has(s.key)) return;
      seen.add(s.key);
      for(const t of E.choices(P, s, hist)) fn(P, s, t, hist);
      for(const m of E.movesFrom(P, s)){
        if(m.e.final || E.isGoal(P, m.next)) continue;
        if(E.dist(P, m.next) === Infinity) continue;
        walk(m.next, hist.concat([m.next]), depth + 1);
      }
    };
    walk(P.start, [P.start], 0);
  }
}

test('forward tiles: four choices, at least one valid, the rest explained by the graph', () => {
  let tiles = 0, positions = 0;
  const kinds = {};
  for(const def of SD.PROBLEMS){
    const P = E.prepare(def);
    const r = E.shortest(P, P.start);
    let s = P.start; const hist = [s];
    for(const m of r){
      positions++;
      const list = E.choices(P, s, hist);
      assert.equal(list.length, 4, `${def.id} at ${s.mol.name}: ${list.length} tiles`);
      assert.ok(list.some(t => t.v.kind === 'good' || t.v.kind === 'goal'), `${def.id} at ${s.mol.name}: no valid tile`);
      assert.equal(new Set(list.map(t => t.k)).size, 4, `${def.id}: two tiles say the same thing`);
      s = m.next; hist.push(s);
    }
  }
  everyTile((P, s, t, hist) => {
    tiles++;
    const v = t.v, e = t.e;
    kinds[v.kind] = (kinds[v.kind] || 0) + 1;
    const why = E.reason(P, s, e, v);
    const at = `${P.id} at ${s.mol.name}, "${t.k}" (${v.kind})`;
    if(['goal', 'good', 'detour'].includes(v.kind)){
      // A valid step really is a graph edge from here whose pattern passes.
      assert.equal(e.from, s.g, at);
      assert.ok(R.through(e, s.set).length, at);
      if(v.kind === 'goal') assert.ok(E.isGoal(P, v.next), at);
      else assert.notEqual(E.dist(P, v.next), Infinity, at);
      return;
    }
    assert.ok(why && !/undefined|NaN|\[object/.test(why), `${at}: explanation "${why}"`);
    assert.ok(!/—/.test(why), `${at}: an em dash in student copy`);
    switch(v.kind){
      case 'elsewhere':
        // Truly not a step from this group, and not a reagent the roadmap
        // knows reacts with it off the map.
        assert.ok(!R.edgesFrom(s.g).some(x => x.keys.some(k => e.keys.includes(k))), `${at}: the reagent does react with ${s.g}`);
        assert.ok(!(D.REACTS_OFF_MAP[s.g] || []).some(k => e.keys.includes(k)), `${at}: reacts off the map`);
        assert.ok(why.toLowerCase().includes(e.name.toLowerCase().slice(0, 12)), `${at}: does not name the reaction it is for`);
        break;
      case 'needs':
        assert.equal(R.through(e, s.set).length, 0, `${at}: the pattern does pass`);
        break;
      case 'skeleton':
        assert.ok(e.cc && !(P.cc || []).some(c => c === e.id || c === base(e.id)), at);
        assert.ok(why.includes(e.cc), `${at}: does not say what happens to the carbons`);
        break;
      case 'twice': assert.ok(e.cc && s.cc, at); break;
      case 'final': assert.ok(e.final && e.to !== P.target.g, at); break;
      case 'ban': assert.equal(why, P.ban[base(e.id)], at); break;
      case 'wrongmol':
        assert.ok(P.target.wrong && P.target.wrong[base(e.id)], at);
        assert.notEqual(v.next.mol.name, P.targetMol.m.name, at);
        break;
      case 'back':
        assert.ok(hist.some(h => h.key === v.next.key), at);
        break;
      case 'shape': case 'nowhere':
        // A real step, and from what it makes the target cannot be reached.
        assert.ok(R.through(e, s.set).length, at);
        assert.equal(E.dist(P, v.next), Infinity, `${at}: claimed a dead end, but ${v.next.mol.name} reaches the target`);
        assert.ok(why.includes(v.next.mol.name), `${at}: does not say what it made`);
        break;
      default: assert.fail(`${at}: unknown verdict`);
    }
  });
  assert.ok(tiles > 400, `only ${tiles} tiles checked`);
  for(const k of ['needs', 'skeleton', 'final', 'nowhere', 'wrongmol', 'back']) assert.ok(kinds[k], `no tile of kind ${k} anywhere: ${JSON.stringify(kinds)}`);
});

test('backward tiles: the right precursor is offered, and each wrong one is wrong for the stated reason', () => {
  let n = 0;
  for(const def of SD.PROBLEMS){
    const P = E.prepare(def);
    const G = E.forwardGraph(P);
    assert.equal(G.gd, E.dist(P, P.start), `${def.id}: backward and forward disagree on the shortest route`);
    let pos = 'GOAL'; const chain = [];
    for(let step = 0; step < 6; step++){
      const list = E.backChoices(P, pos, chain);
      assert.ok(list.length >= 2, `${def.id} backward step ${step}: ${list.length} tiles`);
      const good = list.filter(t => t.v.kind === 'good' || t.v.kind === 'done');
      assert.ok(good.length, `${def.id} backward step ${step}: no right tile`);
      for(const t of list){
        n++;
        const a = E.apply(P, t.q, t.e);
        const hits = a.kind === 'ok' && (pos === 'GOAL' ? E.isGoal(P, a.next) : a.next.key === pos.key);
        if(['good', 'done', 'detour', 'unmade', 'joined', 'past', 'loop'].includes(t.v.kind)) assert.ok(hits, `${def.id}: ${t.q.mol.name} + ${t.k} does not make the molecule`);
        if(t.v.kind === 'other') assert.ok(!hits, `${def.id}: ${t.q.mol.name} + ${t.k} does make it`);
        if(t.v.kind === 'unmade'){
          assert.equal(G.fd[t.q.key], undefined, `${def.id}: ${t.q.mol.name} can be made`);
          assert.ok(!G.joined[t.q.key] && !G.past[t.q.key], `${def.id}: ${t.q.mol.name} can be made, by a joining step or through the target`);
        }
        if(t.v.kind === 'joined') assert.ok(G.joined[t.q.key], `${def.id}: ${t.q.mol.name}`);
        if(t.v.kind === 'past') assert.ok(G.past[t.q.key] && G.fd[t.q.key] === undefined, `${def.id}: ${t.q.mol.name}`);
      }
      const g = good.find(t => t.v.kind === 'done') || good[0];
      if(g.v.kind === 'done') break;
      chain.push(g.q); pos = g.q;
    }
  }
  assert.ok(n > 100, `${n} backward tiles`);
});

test('random routes are only offered when the roadmap router proves them', () => {
  let made = 0;
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for(let i = 0; i < 40; i++){
    const P = E.randomProblem(rand);
    if(!P) continue;
    made++;
    const d = E.dist(P, P.start);
    assert.ok(d >= 2 && d <= 4, `${P.id}: ${d} steps`);
    const proof = R.routes(P.start.g, P.def.target.g, { skeleton: true, set: P.start.set, end: P.def.target.p ? [P.def.target.p] : null });
    assert.ok(proof.shortest.length, `${P.id}: offered without a router proof`);
    assert.ok(E.shortest(P, P.start).length === d);
  }
  assert.ok(made >= 30, `only ${made} of 40 random draws made a problem`);
});

test('every problem files under real curriculum topics and a chapter', () => {
  const topics = new Set();
  for(const m of L.C.MODULES) for(const t of m.topics) topics.add(t.id);
  for(const P of E.CURATED || []){
    for(const t of E.topicsOf(P)) assert.ok(topics.has(t), `${P.id}: topic ${t}`);
    assert.ok(P.ch >= 1 && P.ch <= L.C.MODULES.length, `${P.id}: chapter ${P.ch}`);
  }
});

test('the trainer adds no reaction of its own', () => {
  const src = readFileSync('ochem/assets/tools/synthesis-data.js', 'utf8') + readFileSync('ochem/assets/tools/synthesis.js', 'utf8');
  assert.ok(!/\brx\s*:\s*\[/.test(src), 'a reagent line (rx: [...]) is defined in the trainer');
  // Every reaction id the data names is a roadmap reaction.
  for(const def of SD.PROBLEMS){
    for(const id of [...(def.cc || []), ...Object.keys(def.with || {}), ...Object.keys(def.target.wrong || {}), ...Object.keys(def.ban || {})]){
      assert.ok(D.EDGES.some(e => e.id === id || base(e.id) === id), `${def.id}: ${id} is not a roadmap reaction`);
    }
  }
  for(const f of Object.values(SD.FAMILIES)){
    for(const id of Object.keys(f.ban || {})) assert.ok(D.EDGES.some(e => base(e.id) === id), `${f.id} bans ${id}`);
    for(const m of f.mols) for(const id of m.via || []) assert.ok(D.EDGES.some(e => base(e.id) === id), `${f.id}: ${m.name} via ${id}`);
  }
});

test('no em dashes in the trainer\'s student-facing text', () => {
  for(const def of SD.PROBLEMS){
    for(const t of [def.hint, def.ccWhy, ...Object.values(def.target.wrong || {})]) if(t) assert.ok(!/—/.test(t), `${def.id}: ${t}`);
  }
  for(const f of Object.values(SD.FAMILIES)){
    for(const t of Object.values(f.ban || {})) assert.ok(!/—/.test(t), t);
    for(const m of f.mols) assert.ok(!/—/.test(m.name + (m.text || '')), m.name);
  }
});
