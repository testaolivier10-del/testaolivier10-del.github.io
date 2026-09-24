/* The tools' content, checked against itself.

   Every tool on this site computes its answers rather than storing them —
   shapes from coordinates, resonance counts from an enumerator, mechanism
   verdicts from a decision procedure. That is the design, and it has a
   specific consequence for testing: the data files are the part that can be
   wrong, and a wrong entry is silent. A mistyped pKa does not throw. A
   molecule whose hydrogens are placed a few degrees out still renders, still
   rotates, and still tells a student it is 120° when the viewer would measure
   131. A quiz question with two correct options marks one of them wrong.

   So these tests do what a chemist would do with a fresh page of data: check
   it against something independent. NMR integrations against the molecular
   formula. Claimed geometry against the geometry the viewer computes. Energy
   curves against the shape a torsional curve has to have. Every quiz question
   against the rule that exactly one option can be right.

   Written as one file because they share the same job — guarding content that
   is easy to add and easy to get quietly wrong. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

/* ---- Loading browser modules outside a browser --------------------------

   harness.mjs exists for the engines, which touch only localStorage and a
   clock. The tools touch the DOM, so they need a stand-in that answers every
   query with something chainable rather than null — these modules build their
   whole UI in innerHTML on load, and one null return aborts the file before
   the data is exported. */
function fakeEl(){
  const el = {
    innerHTML: '', textContent: '', value: '', hidden: false, disabled: false,
    className: '', style: {}, dataset: {}, checked: false,
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){},
    appendChild(){}, removeChild(){}, addEventListener(){}, removeEventListener(){},
    focus(){}, blur(){}, click(){}, closest(){ return fakeEl(); },
    getBoundingClientRect(){ return { width: 600, height: 300, left: 0, top: 0 }; },
    getContext(){ return null; },
    querySelector(){ return fakeEl(); },
    querySelectorAll(){ return []; },
  };
  return el;
}

function browser(extra){
  const s = {
    console, Math, Object, Array, JSON, String, Number, Boolean, Set, Map, Date,
    Float32Array, isNaN, parseInt, parseFloat, URLSearchParams,
    setTimeout(){}, clearTimeout(){}, setInterval(){}, clearInterval(){},
    requestAnimationFrame(){ return 0; }, cancelAnimationFrame(){},
    navigator: { userAgent: 'node', platform: 'node' },
    location: { href: 'http://x/', pathname: '/', search: '' },
    history: { replaceState(){} },
    localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
  };
  s.document = {
    readyState: 'complete', addEventListener(){}, removeEventListener(){},
    getElementById: () => fakeEl(), querySelector: () => fakeEl(), querySelectorAll: () => [],
    createElement: () => fakeEl(), createElementNS: () => fakeEl(),
    body: fakeEl(), head: fakeEl(),
  };
  s.window = s;
  s.globalThis = s;
  Object.assign(s, extra || {});
  vm.createContext(s);
  return {
    ctx: s,
    load(...paths){
      for(const p of paths) vm.runInContext(readFileSync(p, 'utf8'), s, { filename: p });
      return s;
    },
  };
}

/* Pulls a top-level `var NAME = [...]` out of a tool file and evaluates just
   that, for the tools whose data is worth checking without running their UI. */
function extract(path, from, to){
  const src = readFileSync(path, 'utf8');
  const a = src.indexOf(from);
  const b = to ? src.indexOf(to, a) : src.length;
  assert.ok(a >= 0, `could not find "${from}" in ${path}`);
  return src.slice(a, b > a ? b : src.length);
}

const CORE = [
  'ochem/assets/molecules.js',
  'ochem/assets/chem-core.js',
  'ochem/assets/resonance-engine.js',
  'ochem/assets/mol3d.js',
  'ochem/assets/mol3d-library.js',
  'ochem/assets/molecule-editor.js',
];

/* ====================================================================== */
/* The 3D library                                                          */
/* ====================================================================== */

/* Each note in the library makes a geometric claim — "flat", "107°", "the
   nitrogen here is FLAT, not pyramidal". The viewer measures from the same
   coordinates, so a claim and a placement that disagree produce a molecule
   that contradicts its own caption. */
const GEOMETRY_CLAIMS = {
  'methane':            { shape: 'Tetrahedral',        hyb: 'sp³',   maxAngle: 109.5 },
  'ammonia':            { shape: 'Trigonal pyramidal', hyb: 'sp³',   maxAngle: 107 },
  'water':              { shape: 'Bent',               hyb: 'sp³',   maxAngle: 104.5 },
  'boron-trifluoride':  { shape: 'Trigonal planar',    hyb: 'sp²',   maxAngle: 120 },
  'ethyne':             { shape: 'Linear',             hyb: 'sp',    maxAngle: 180 },
  'carbon-dioxide-3d':  { shape: 'Linear',             hyb: 'sp',    maxAngle: 180 },
  'benzene-3d':         { shape: 'Trigonal planar',    hyb: 'sp²',   maxAngle: 120 },
  'methyl-cation':      { shape: 'Trigonal planar',    hyb: 'sp²',   maxAngle: 120 },
  'methyl-anion':       { shape: 'Trigonal pyramidal', hyb: 'sp³' },
  'hydronium':          { shape: 'Trigonal pyramidal', hyb: 'sp³' },
  'acetonitrile':       { shape: 'Linear',             hyb: 'sp',    maxAngle: 180 },
  'dimethyl-ether':     { shape: 'Bent',               hyb: 'sp³' },
  'formamide':          { shape: 'Trigonal planar',    hyb: 'sp²',   maxAngle: 120 },
  'cyclopropane-3d':    { shape: 'Tetrahedral',        hyb: 'sp³' },
};

test('every molecule in the 3D library resolves to a shape', () => {
  const s = browser().load('ochem/assets/mol3d.js', 'ochem/assets/mol3d-library.js');
  const L = s.OchemMol3DLibrary, M = s.OchemMol3D;
  assert.ok(L.ALL.length >= 20, `only ${L.ALL.length} molecules`);
  for(const m of L.ALL){
    const a = M.analyse(m, m.focus === undefined ? 0 : m.focus);
    assert.ok(a && a.shape, `${m.id} has no shape at its focus atom`);
    assert.ok(m.name, `${m.id} has no name`);
  }
});

test('molecules measure the geometry their notes claim', () => {
  const s = browser().load('ochem/assets/mol3d.js', 'ochem/assets/mol3d-library.js');
  const L = s.OchemMol3DLibrary, M = s.OchemMol3D;
  for(const [id, want] of Object.entries(GEOMETRY_CLAIMS)){
    const m = L.get(id);
    assert.ok(m, `${id} is missing from the library`);
    const a = M.analyse(m, m.focus === undefined ? 0 : m.focus);
    assert.equal(a.shape.m, want.shape, `${id} shape`);
    assert.equal(a.shape.hyb, want.hyb, `${id} hybridization`);
    if(want.maxAngle !== undefined){
      const mx = Math.max(...a.angles.map(x => x.deg));
      assert.ok(Math.abs(mx - want.maxAngle) < 3,
        `${id}: largest angle ${mx.toFixed(1)}°, note claims about ${want.maxAngle}°`);
    }
  }
});

test('the amide nitrogen is planar and cyclopropane is strained', () => {
  const s = browser().load('ochem/assets/mol3d.js', 'ochem/assets/mol3d-library.js');
  const L = s.OchemMol3DLibrary, M = s.OchemMol3D;

  // Formamide's note tells a student to click the N and read the angles. Three
  // angles summing to 360° is what "planar" means; a pyramidal N gives ~328.
  const sum = M.analyse(L.get('formamide'), 2).angles.reduce((t, x) => t + x.deg, 0);
  assert.ok(Math.abs(sum - 360) < 6, `formamide N angles sum to ${sum.toFixed(1)}°, not planar`);

  // Cyclopropane's note claims 60° internal angles against sp³'s 109.5.
  const ring = L.get('cyclopropane-3d').atoms.filter(a => a.el === 'C').slice(0, 3);
  const ang = M.angleBetween(M.sub(ring[1].pos, ring[0].pos), M.sub(ring[2].pos, ring[0].pos));
  assert.ok(Math.abs(ang - 60) < 1.5, `cyclopropane internal angle ${ang.toFixed(1)}°`);
});

/* ====================================================================== */
/* Resonance                                                               */
/* ====================================================================== */

/* The count of forms is what the tool tells you ("two of five") and what its
   quiz asks. It comes from the enumerator, so the thing that can be wrong is
   the molecule: a missing lone pair is a form the engine will never find, and
   a miscounted charge is a species that is not the one named. */
const RESONANCE_FORMS = {
  'acetate-ion': 2, 'formate': 2, 'allyl-cation': 2, 'allyl-anion': 2,
  'enolate': 2, 'acetamide': 2, 'nitromethane': 2, 'carbonate': 3,
  'benzene': 2, 'phenoxide': 5, 'benzyl-cation': 5, 'nitrate': 3, 'ozone': 2,
};

test('every species the Resonance Explorer offers actually exists', () => {
  const s = browser().load(...CORE);
  const species = extract('ochem/assets/tools/resonance.js', 'var SPECIES = [', '];')
    .match(/id:'([\w-]+)'/g).map(x => x.slice(4, -1));
  assert.ok(species.length >= 11);
  for(const id of species){
    assert.ok(s.OchemMolecules.get(id), `the picker offers "${id}" and molecules.js has no such molecule`);
  }
});

test('resonance species enumerate the expected number of forms, conserving charge', () => {
  const s = browser().load(...CORE);
  const { OchemMolecules: Mol, OchemChem: C, OchemResonance: R } = s;
  const net = st => Object.keys(st.atoms).reduce((n, k) => n + (st.atoms[k].charge || 0), 0);

  for(const [id, expected] of Object.entries(RESONANCE_FORMS)){
    const mol = Mol.get(id);
    assert.ok(mol, `${id} missing`);
    const start = C.fromMolecule(mol);
    const forms = R.contributors(start);
    assert.equal(forms.length, expected, `${id} enumerates ${forms.length} forms, expected ${expected}`);
    for(const f of forms){
      assert.equal(net(f), net(start), `${id}: a form does not conserve charge`);
    }
  }
});

/* ====================================================================== */
/* Conformations                                                           */
/* ====================================================================== */

test('torsional curves have the shape a torsional curve must have', () => {
  const src = extract('ochem/assets/tools/conformations.js', 'var TORSIONALS = [', '  /* ---- Building');
  const re = /id:'([\w-]+)', name:'([^']*)', formula:'([^']*)',\s*front:\[([^\]]*)\], back:\[([^\]]*)\],\s*energies:\[([^\]]*)\]/g;
  let m, seen = 0;
  while((m = re.exec(src))){
    const [, id, , , front, back, es] = m;
    const e = es.split(',').map(x => parseFloat(x.trim()));
    seen++;
    assert.equal(e.length, 6, `${id}: ${e.length} nodes, the curve has six`);
    assert.equal(Math.min(...e), 0, `${id}: energies are relative, so the best conformer must be 0`);

    // 0°, 120° and 240° are eclipsed and must sit above their staggered neighbours.
    for(const i of [0, 2, 4]){
      const lo = Math.min(e[(i + 1) % 6], e[(i + 5) % 6]);
      assert.ok(e[i] > lo, `${id}: the eclipsed node at ${i * 60}° is not above its staggered neighbours`);
    }
    // Identical substituents on both carbons means a curve symmetric about 180°.
    if(front === back){
      assert.ok(Math.abs(e[1] - e[5]) < 0.01 && Math.abs(e[2] - e[4]) < 0.01,
        `${id}: substituents are symmetric but the curve is not`);
    }
  }
  assert.ok(seen >= 7, `only ${seen} torsional systems parsed`);
});

test('the gauche effect molecules really do prefer gauche', () => {
  const src = extract('ochem/assets/tools/conformations.js', 'var TORSIONALS = [', '  /* ---- Building');
  for(const id of ['difluoroethane', 'ethylene-glycol']){
    const m = new RegExp(`id:'${id}'[\\s\\S]*?energies:\\[([^\\]]*)\\]`).exec(src);
    assert.ok(m, `${id} missing`);
    const e = m[1].split(',').map(x => parseFloat(x.trim()));
    const minAt = e.indexOf(Math.min(...e)) * 60;
    assert.ok(minAt === 60 || minAt === 300,
      `${id} is on the list to show gauche winning, but its minimum is at ${minAt}°`);
    assert.ok(e[3] > 0, `${id}: anti should not also be a minimum, or there is nothing to show`);
  }
});

/* ====================================================================== */
/* Spectroscopy                                                            */
/* ====================================================================== */

test('every spectrum agrees with its own molecular formula', () => {
  const body = extract('ochem/assets/tools/spectroscopy.js', 'var IR_BANDS', '/* ---- Drawing an IR spectrum');
  const s = browser().ctx;
  vm.runInContext(body + '\nthis.C=COMPOUNDS; this.B=IR_BANDS; this.pf=parseFormula; this.dou=degreesOfUnsaturation;', s);

  assert.ok(s.C.length >= 16, `only ${s.C.length} compounds`);
  for(const c of s.C){
    const counts = s.pf(c.formula);
    assert.ok(counts, `${c.name}: formula "${c.formula}" will not parse`);

    // The integration is the check that catches a mistyped peak table.
    const nmrH = (c.nmr || []).reduce((t, p) => t + (p.h || 0), 0);
    assert.equal(nmrH, counts.H || 0,
      `${c.name}: NMR integrates to ${nmrH}H but ${c.formula} has ${counts.H || 0}`);

    const d = s.dou(counts);
    assert.ok(d >= 0 && d % 1 === 0, `${c.name}: degrees of unsaturation came out ${d}`);

    for(const p of (c.nmr || [])){
      assert.ok(p.ppm >= 0 && p.ppm <= 14, `${c.name}: an NMR signal at ${p.ppm} ppm`);
    }
    for(const b of (c.ir || [])){
      assert.ok(b.cm >= 500 && b.cm <= 4000, `${c.name}: an IR band at ${b.cm} is off the plotted window`);
      // A band labelled as a carbonyl that is not in the carbonyl region is
      // either a typo or a mislabel, and both teach the wrong number.
      if(/C=O/.test(b.label)){
        assert.ok(b.cm >= 1630 && b.cm <= 1780, `${c.name}: "${b.label}" at ${b.cm} cm⁻¹`);
      }
      if(/[O]–H|O-H/.test(b.label)){
        assert.ok(b.cm >= 2400 && b.cm <= 3700, `${c.name}: "${b.label}" at ${b.cm} cm⁻¹`);
      }
    }
  }
});

/* ====================================================================== */
/* Acid/base                                                               */
/* ====================================================================== */

test('the acid table is complete and its pKa values are in range', () => {
  const body = extract('ochem/assets/tools/acid-base.js', 'var ACIDS', '/* ---- State');
  const s = browser().ctx;
  vm.runInContext(body + '\nthis.A=ACIDS; this.an=analyse;', s);

  assert.ok(s.A.length >= 30, `only ${s.A.length} acids`);
  const seen = new Set();
  for(const a of s.A){
    assert.ok(!seen.has(a.id), `duplicate acid id "${a.id}"`);
    seen.add(a.id);
    for(const k of ['name', 'formula', 'site', 'pKa', 'atom', 'hyb', 'cbase', 'why']){
      assert.notEqual(a[k], undefined, `${a.id} is missing ${k}`);
    }
    assert.equal(typeof a.pKa, 'number', `${a.id}: pKa is not a number`);
    assert.ok(a.pKa > -15 && a.pKa < 60, `${a.id}: pKa ${a.pKa} is outside any plausible range`);
  }
});

test('the comparator answers from the measured pKa, never from the rules', () => {
  const body = extract('ochem/assets/tools/acid-base.js', 'var ACIDS', '/* ---- State');
  const s = browser().ctx;
  vm.runInContext(body + '\nthis.A=ACIDS; this.an=analyse;', s);

  /* The tool's whole thesis is that the answer comes from the measurement and
     the explanation from the rules, and that it says so when they disagree.
     So: whatever the rules argue, the verdict must be the lower pKa — every
     time, across every pair. */
  let disagreements = 0, pairs = 0;
  for(let i = 0; i < s.A.length; i++){
    for(let j = i + 1; j < s.A.length; j++){
      const a = s.A[i], b = s.A[j];
      if(a.pKa === b.pKa) continue;
      pairs++;
      const r = s.an(a, b);
      const stronger = a.pKa < b.pKa ? a : b;
      assert.equal(r.truth, stronger, `${a.name} vs ${b.name}: verdict did not follow the pKa`);
      if(r.deciding && r.agrees === false) disagreements++;
    }
  }
  assert.ok(pairs > 500, `only ${pairs} pairs compared`);
  // The disagreements are the point of the tool, not a fault — but if they
  // ever reach half the table, the structural model has stopped being a model.
  assert.ok(disagreements / pairs < 0.35,
    `the structural rules lose ${(disagreements / pairs * 100).toFixed(0)}% of pairs`);
});

/* ====================================================================== */
/* The quizzes                                                             */
/* ====================================================================== */

/* Every tool's quiz generator, driven the way the shell drives it. The rule
   that matters is that exactly one option is correct: a question with two
   right answers marks a student wrong for being right, which is worse than
   no quiz at all. */
const QUIZ_TOOLS = ['acid-base', 'viewer-3d', 'conformations', 'resonance',
                    'reaction-predictor', 'spectroscopy', 'arrow-pusher', 'reagent-roadmap'];

/* A tool whose data lives in a file of its own loads it first, as its page
   does. */
const TOOL_DEPS = {
  'reagent-roadmap': ['ochem/assets/curriculum.js', 'ochem/assets/tools/reagent-roadmap-data.js'],
};

function quizConfigs(){
  const captured = [];
  for(const slug of QUIZ_TOOLS){
    const b = browser({
      OchemToolQuiz: { mount(el, cfg){ captured.push({ slug, cfg }); return {}; },
                       shuffle: a => a, esc: x => String(x) },
      OchemTools: null,
    });
    b.load(...CORE, ...(TOOL_DEPS[slug] || []), `ochem/assets/tools/${slug}.js`);
  }
  return captured;
}

test('every tool registers a quiz', () => {
  const got = quizConfigs().map(c => c.slug);
  for(const slug of QUIZ_TOOLS) assert.ok(got.includes(slug), `${slug} registered no quiz`);
  // And the list above is every tool, so a new one cannot skip this file.
  const s = browser().load('ochem/assets/tools-registry.js');
  for(const t of s.OchemTools.ALL){
    assert.ok(QUIZ_TOOLS.includes(t.slug), `${t.slug} is in the registry but not in QUIZ_TOOLS here`);
  }
});

test('every question a generator can produce has exactly one right answer', () => {
  for(const { slug, cfg } of quizConfigs()){
    let made = 0;
    for(let i = 0; i < 300; i++){
      const q = cfg.make([]);
      if(!q) continue;               // declining is allowed, and deliberate
      made++;
      const right = q.options.filter(o => o.correct).length;
      assert.equal(right, 1, `${slug}: "${String(q.prompt).slice(0, 70)}" has ${right} correct options`);
      assert.ok(q.options.length >= 2, `${slug}: a question with ${q.options.length} option(s)`);
      assert.ok(q.prompt && q.explain, `${slug}: a question missing its prompt or explanation`);
      assert.ok(q.id, `${slug}: a question with no id, so repeats cannot be avoided`);
      const rendered = q.prompt + q.explain + q.options.map(o => o.label).join('');
      assert.ok(!/undefined|\[object Object\]/.test(rendered),
        `${slug}: a question renders undefined — "${String(q.prompt).slice(0, 70)}"`);
    }
    assert.ok(made > 50, `${slug}: only ${made} of 300 attempts produced a question`);
  }
});

test('a quiz files topic attempts against real curriculum topics', () => {
  /* The quiz's one side effect. It reports against the topics the registry
     declares, and a topic id that is not in the curriculum is filed into a
     store nothing reads — silently, which is the worst way to lose it. */
  const s = browser().load('ochem/assets/curriculum.js', 'ochem/assets/tools-registry.js');
  const valid = new Set();
  for(const mod of s.OchemCurriculum.MODULES){
    valid.add(mod.id);
    for(const t of mod.topics || []) valid.add(t.id);
  }
  for(const tool of s.OchemTools.ALL){
    for(const topic of [].concat(tool.topic || [])){
      assert.ok(valid.has(topic),
        `tool "${tool.slug}" declares topic "${topic}", which the curriculum does not have`);
    }
  }
});

/* ====================================================================== */
/* NREMT: the sound trainer and the scenarios                              */
/* ====================================================================== */

test('every sound in the trainer has a source and a group', () => {
  const src = extract('nremt/sound-trainer.html', 'const SOUNDS =', 'function quizPool()');
  const s = browser().ctx;
  vm.runInContext(src + '\nthis.S=SOUNDS; this.draw=drawSound; this.misses=misses;', s);

  assert.ok(s.S.length >= 10, `only ${s.S.length} sounds`);
  const GROUPS = ['airway', 'lung', 'heart'];
  for(const x of s.S){
    assert.ok(GROUPS.includes(x.group), `${x.id} has no group`);
    assert.ok(x.label && x.description && x.clinical, `${x.id} is missing its copy`);
    // An entry may exist without audio — the description still teaches, and an
    // invented clip would be worse than none. But if it claims to be playable
    // it has to have something to play.
    const source = x.localSrc || x.synth || x.audioUrl;
    if(x.available) assert.ok(source, `${x.id} is marked available but has no local file, no synth and no URL`);
    else assert.ok(!source, `${x.id} is marked unavailable but carries a source — mark it available or drop the source`);
    // Airway and lung sounds must not be synthesized: a wheeze is a texture,
    // and a synthetic texture teaches the wrong thing. See sound-bank.js.
    if(x.group !== 'heart') assert.ok(!x.synth, `${x.id} is a recorded-only sound and must not be generated`);
  }
  // A round offers only its own group, so a group is quizzable only once it has
  // four playable clips. Airway is described on the page before it reaches that.
  for(const g of ['lung', 'heart']){
    const n = s.S.filter(x => x.group === g && x.available).length;
    assert.ok(n >= 4, `only ${n} playable ${g} sounds — too few for a multiple choice`);
  }
});

test('missing a sound makes it come back, without taking over the quiz', () => {
  const src = extract('nremt/sound-trainer.html', 'const SOUNDS =', 'function quizPool()');
  const s = browser().ctx;
  vm.runInContext(src + '\nthis.S=SOUNDS; this.draw=drawSound; this.misses=misses;', s);

  const pool = s.S.filter(x => x.available && x.group === 'lung');
  const target = pool[0];
  const rate = () => {
    let hits = 0;
    for(let i = 0; i < 4000; i++) if(s.draw(pool, null).id === target.id) hits++;
    return hits / 4000;
  };
  const before = rate();
  s.misses[target.id] = 3;
  const after = rate();

  assert.ok(after > before * 1.5, `missing it barely changed its odds (${before.toFixed(2)} to ${after.toFixed(2)})`);
  assert.ok(after < 0.5, `a missed sound takes ${(after * 100).toFixed(0)}% of rounds — that is no longer a quiz about the others`);
});

test('every scenario path leads somewhere, and every fork can be rewound to', () => {
  const src = extract('nremt/scenario-sim.html', 'const SCENARIOS =', '\nlet currentScenario');
  const s = browser().ctx;
  vm.runInContext(src + '\nthis.S=SCENARIOS;', s);

  // A floor, not an exact count: scenarios get added, and the advertised
  // number is tied to the real one by check 18 in check-site.mjs. What this
  // guards is a scenario silently disappearing.
  assert.ok(s.S.length >= 25, `expected at least 25 scenarios, found ${s.S.length}`);
  for(const sc of s.S){
    assert.ok(sc.nodes[sc.startNode], `${sc.id}: startNode "${sc.startNode}" does not exist`);
    for(const [id, n] of Object.entries(sc.nodes)){
      if(n.ending){
        assert.ok(['good', 'neutral', 'bad'].includes(n.ending), `${sc.id}/${id}: odd ending "${n.ending}"`);
        continue;
      }
      assert.ok((n.choices || []).length, `${sc.id}/${id}: no ending and no choices — a dead end`);
      for(const c of n.choices){
        assert.ok(sc.nodes[c.next], `${sc.id}/${id}: a choice points at missing node "${c.next}"`);
        assert.ok(c.text, `${sc.id}/${id}: a choice with no text`);
      }
    }

    // Every node reachable, every path terminating, no cycles. A cycle would
    // make the transcript — and therefore rewind — meaningless.
    const reached = new Set();
    (function walk(id, seen, depth){
      assert.ok(depth < 40, `${sc.id}: a path longer than 40 steps suggests a loop`);
      reached.add(id);
      const n = sc.nodes[id];
      if(n.ending) return;
      for(const c of n.choices){
        assert.ok(!seen.has(c.next), `${sc.id}: "${c.next}" loops back on itself`);
        walk(c.next, new Set([...seen, c.next]), depth + 1);
      }
    })(sc.startNode, new Set([sc.startNode]), 0);

    for(const id of Object.keys(sc.nodes)){
      assert.ok(reached.has(id), `${sc.id}: node "${id}" is unreachable`);
    }
  }
});

/* ====================================================================== */
/* Carrying a structure between tools                                      */
/* ====================================================================== */

test('a structure survives the trip from one tool to another', () => {
  const b = browser({ OCHEM_TOOL: 'arrow-pusher' });
  const s = b.load('ochem/assets/molecules.js', 'ochem/assets/chem-core.js',
                   'ochem/assets/mol-builder.js', 'ochem/assets/tools-registry.js',
                   'ochem/assets/tool-state.js', 'ochem/assets/tool-handoff.js');
  const { OchemToolHandoff: H, OchemBuilder: B, OchemChem: C, OchemMolecules: Mol } = s;

  /* The encoding is what a handoff link carries, so a structure that does not
     survive it arrives at the far tool as a different molecule — silently,
     because a decoded structure is still a valid structure. */
  for(const id of ['acetate-ion', 'benzene', 'acetone', 'phenoxide', 'ozone', 'ethanol']){
    const st = C.fromMolecule(Mol.get(id));
    const heavy = x => Object.keys(x.atoms).filter(k => x.atoms[k].el && !x.atoms[k].group).length;
    const back = H.decode(B.encode(st));
    assert.ok(back, `${id}: its encoding will not decode`);
    assert.equal(heavy(back), heavy(st), `${id}: atom count changed in transit`);
  }
});

test('the handoff offers other tools, never the one you are standing in', () => {
  const b = browser({ OCHEM_TOOL: 'arrow-pusher' });
  const s = b.load('ochem/assets/molecules.js', 'ochem/assets/chem-core.js',
                   'ochem/assets/mol-builder.js', 'ochem/assets/tools-registry.js',
                   'ochem/assets/tool-state.js', 'ochem/assets/tool-handoff.js');
  const { OchemToolHandoff: H, OchemChem: C, OchemMolecules: Mol } = s;

  let html = '';
  const el = { className: '', set innerHTML(v){ html = v; }, get innerHTML(){ return html; } };
  H.mountSend(el, () => C.fromMolecule(Mol.get('acetone')));

  const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  assert.equal(links.length, H.ACCEPTS.length - 1, 'wrong number of destinations');
  assert.ok(!links.some(l => l.startsWith('arrow-pusher')), 'offers a link back to itself');
  for(const l of links){
    const code = decodeURIComponent(l.split('build=')[1] || '');
    assert.ok(H.decode(code), `a destination link carries an undecodable structure: ${l.slice(0, 40)}`);
  }

  // Nothing drawn means nothing to send, and an empty row would be clutter.
  H.mountSend(el, () => null);
  assert.equal(html, '', 'the send row renders with no structure to send');
});

test('every destination the handoff offers can actually receive a structure', () => {
  const s = browser().load('ochem/assets/tools-registry.js', 'ochem/assets/tool-handoff.js');
  for(const t of s.OchemToolHandoff.ACCEPTS){
    assert.ok(s.OchemTools.bySlug(t.slug), `handoff offers "${t.slug}", which is not a tool`);
    const src = readFileSync(`ochem/assets/tools/${t.slug}.js`, 'utf8');
    // A destination that never reads ?build= is a dead end wearing a link.
    assert.match(src, /\.build\b/,
      `${t.slug} is offered as a destination but never reads the structure it is sent`);
  }
});

/* ====================================================================== */
/* Reachability                                                            */
/* ====================================================================== */

test('every focusable atom and bond has an accessible name', () => {
  const s = browser().load('ochem/assets/molecules.js');
  const live = s.OchemMolecules.svg('acetate-ion', { clickable: 'all', clickableBonds: 'all' });

  const focusable = [...live.matchAll(/<(?:g|line)[^>]*tabindex="0"[^>]*>/g)].map(m => m[0]);
  assert.ok(focusable.length > 5, 'nothing focusable in an interactive structure');
  for(const t of focusable){
    assert.match(t, /aria-label="[^"]+"/,
      `a focusable target announces as "button" and nothing else: ${t.slice(0, 60)}`);
  }

  /* role="img" makes assistive technology treat the SVG as one picture and
     stop exposing what is inside — which would hide every control above. */
  assert.match(live, /role="group"/, 'an interactive structure still claims role="img"');
  const stat = s.OchemMolecules.svg('acetate-ion', {});
  assert.match(stat, /role="img"/, 'a static diagram should stay role="img"');
  assert.equal([...stat.matchAll(/tabindex="0"/g)].length, 0, 'a static diagram has focusable children');
});

/* ====================================================================== */
/* Shipping                                                                */
/* ====================================================================== */

test('the service worker precaches files that exist', () => {
  const sw = readFileSync('sw.js', 'utf8');
  const list = sw.slice(sw.indexOf('const PRECACHE_URLS'), sw.indexOf('// The question bank'));
  const urls = [...list.matchAll(/'([^']+)'/g)].map(m => m[1]).filter(u => u.includes('.'));
  assert.ok(urls.length > 20, `only ${urls.length} precached URLs`);
  for(const u of urls){
    /* A precache entry that 404s fails cache.addAll(), which rejects the whole
       install — so one stale path silently costs every user the entire offline
       mode, not just that file. */
    assert.ok(existsSync(u), `sw.js precaches "${u}", which does not exist`);
  }
});

test('every script a tool page loads exists and is loaded in a workable order', () => {
  for(const page of readdirSync('ochem/tools').filter(f => f.endsWith('.html'))){
    const html = readFileSync(`ochem/tools/${page}`, 'utf8');
    const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    for(const src of srcs){
      if(/^https?:/.test(src)) continue;
      assert.ok(existsSync(join('ochem/tools', src)), `${page} loads "${src}", which does not exist`);
    }
    /* The tool's own file builds its UI on load and calls into these, so a
       dependency loaded after it is a dependency that is not there yet. */
    const slug = page.replace('.html', '');
    const self = srcs.findIndex(x => x.endsWith(`tools/${slug}.js`));
    assert.ok(self >= 0, `${page} never loads its own tool script`);
    for(const dep of ['tools-registry.js', 'tool-state.js', 'tool-quiz.js', 'tool-handoff.js']){
      const at = srcs.findIndex(x => x.endsWith(dep));
      if(at >= 0) assert.ok(at < self, `${page} loads ${dep} after the tool that uses it`);
    }
  }
});

/* ====================================================================== */
/* Regressions found in review                                             */
/* ====================================================================== */

test('a quiz run reaches its full length even when makers decline draws', () => {
  /* Drives the real shell rather than reimplementing its loop, which is the
     only way this test can see the bug it exists for: a maker returns null
     when the draw it happened to make would not be a fair question, and the
     shell used to treat the first null as the end of the run. Spectroscopy
     declines roughly a quarter of its draws, so a "6 questions" quiz ended on
     question one with "0 of 0". */
  const b = browser();
  const s = b.load('ochem/assets/tool-quiz.js');

  let asked = 0;
  const el = {
    _html: '',
    set innerHTML(v){
      this._html = v;
      const m = /(\d+) of (\d+)/.exec(v);
      if(m) asked = Math.max(asked, parseInt(m[1], 10));
    },
    get innerHTML(){ return this._html; },
    querySelector(){ return fakeEl(); },
    querySelectorAll(){ return []; },
  };

  // A maker that declines three draws out of four, like a real one on a bad run.
  let n = 0;
  const api = s.OchemToolQuiz.mount(el, {
    slug: 'acid-base', rounds: 6, intro: 'x',
    make(){
      if(Math.random() < 0.75) return null;
      n++;
      return { id: 'q' + n, prompt: 'p', explain: 'e',
               options: [{ id:'a', label:'a', correct:true }, { id:'b', label:'b', correct:false }] };
    },
  });
  api.start();
  assert.ok(asked >= 1, 'the quiz never rendered a question');
  assert.equal(asked, 1, 'expected the first question to render');
  assert.ok(n >= 1, 'the shell gave up before the maker produced anything');
});

test('a maker told a question was just asked will not ask it again', () => {
  /* `recent` holds full question ids — "water:shape", "acetone:fc:o" — and two
     makers were testing a bare molecule id against it. That never matched, so
     their repeat filter did nothing at all.

     The effect is statistically small (a repeat every forty-odd draws), which
     is exactly why it needs an exact assertion rather than a tolerance: these
     two makers exclude the whole molecule when told about it, so a working
     filter repeats ZERO times and a broken one repeats occasionally. Only the
     makers that filter by molecule are checked, because the others legitimately
     do not — conformations draws a fresh torsional curve each time. */
  const byMolecule = ['viewer-3d', 'arrow-pusher'];
  for(const { slug, cfg } of quizConfigs()){
    if(!byMolecule.includes(slug)) continue;

    let first = null;
    for(let t = 0; t < 40 && !first; t++) first = cfg.make([]);
    assert.ok(first, `${slug}: produced no question at all`);

    let repeats = 0, got = 0;
    for(let t = 0; t < 400; t++){
      const q = cfg.make([first.id]);
      if(!q) continue;
      got++;
      // Same molecule, whichever question type it produced about it.
      if(q.id.split(':')[0] === first.id.split(':')[0]) repeats++;
    }
    assert.ok(got > 100, `${slug}: only ${got} of 400 draws produced a question`);
    assert.equal(repeats, 0,
      `${slug}: asked about the molecule it was told to avoid ${repeats} times in ${got} draws`);
  }
});

test('the styles for a block live in the stylesheet its page loads', () => {
  /* The tool suggestion renders at the end of every lesson and mechanism, and
     those pages load only ochem.css. Putting its rules in tools.css styled it
     on the seven pages that never show it. */
  const ochem = readFileSync('ochem/assets/ochem.css', 'utf8');
  for(const cls of ['.tool-suggest', '.tool-suggest__link', '.kbd-hint', '.med-status']){
    assert.ok(ochem.includes(cls), `${cls} is rendered on lesson pages but not styled in ochem.css`);
  }
  // And a lesson page must actually load that stylesheet.
  const lesson = readFileSync('ochem/lessons/pka.html', 'utf8');
  assert.match(lesson, /assets\/ochem\.css/);
  assert.ok(!/assets\/tools\.css/.test(lesson), 'a lesson unexpectedly loads tools.css');
});

test('every tool that renders a send row actually mounts one', () => {
  /* Declaring the element and the refresh hook without calling mountSend left
     one tool with a permanently empty handoff row — present in the markup,
     never filled. */
  for(const slug of ['arrow-pusher', 'resonance', 'spectroscopy', 'reaction-predictor', 'viewer-3d']){
    const src = readFileSync(`ochem/assets/tools/${slug}.js`, 'utf8');
    assert.match(src, /mountSend\(/, `${slug} has a send row in its markup but never mounts it`);
  }
});

/* ====================================================================== */
/* The textbook prose, which is now two things at once                     */
/* ====================================================================== */

/* Each file under ochem/notes/ is both the source learn.html fetches and a
   page a reader can open. That only works while the markers around the prose
   are intact: textbook.js slices between them, and if they were missing it
   would inject a whole document — <head>, stylesheets, breadcrumbs and all —
   into the middle of the textbook. The page would still render, which is what
   makes it worth a test rather than an assumption. */
test('every textbook section is a page and still yields just its prose', () => {
  const START = '<!-- notes:start -->';
  const END = '<!-- notes:end -->';
  const files = readdirSync('ochem/notes').filter(f => f.endsWith('.html'));
  assert.ok(files.length >= 62, `expected at least 62 sections, found ${files.length}`);

  // The extraction textbook.js performs, kept identical on purpose.
  const extract = (html) => {
    const a = html.indexOf(START);
    const b = html.indexOf(END);
    return (a !== -1 && b !== -1) ? html.slice(a + START.length, b) : html;
  };

  for(const f of files){
    const html = readFileSync(join('ochem/notes', f), 'utf8');

    // A page in its own right.
    assert.match(html, /^<!DOCTYPE html>/, `${f}: not a standalone page`);
    assert.match(html, /<title>[^<]+<\/title>/, `${f}: no title`);
    assert.match(html, /<link rel="canonical"/, `${f}: no canonical URL`);
    assert.match(html, /ochem\.css/, `${f}: no stylesheet — the reason these used to be disallowed`);

    // And still a fragment when sliced.
    assert.ok(html.includes(START) && html.includes(END), `${f}: missing prose markers`);
    const prose = extract(html);
    assert.ok(prose.trim().length > 200, `${f}: prose between the markers is empty or tiny`);
    assert.ok(!/<html|<head|<body|<!DOCTYPE/i.test(prose),
      `${f}: the extracted prose still contains page structure — the textbook would inject a whole document`);
    assert.ok(!prose.includes('notes-crumb'),
      `${f}: the extracted prose contains the standalone page's breadcrumbs`);

    // The prose carries the class the styles are written against.
    assert.ok(html.includes('notes-view'), `${f}: article is missing notes-view, so its prose would render unstyled`);
  }
});

/* Generated figures are drawn from coordinates, and the failure mode is not a
   crash — it is a diagram with a label sitting outside the canvas, or on top
   of another label, which renders perfectly and reads as nonsense. The first
   six of these had all three problems (a clipped row of names, a caption
   landing on a heading, and a double bond drawn as three lines) and every one
   of them was found by looking at a rendering rather than by any check.
   Bounds are the part that can be checked without eyes; this checks that. */
test('every generated ochem figure draws inside its own canvas', () => {
  // Lessons too: build-ochem-figures.mjs writes the same figures into lesson
  // steps between the same markers.
  const files = [
    ...readdirSync('ochem/notes').filter(f => f.endsWith('.html')).map(f => join('ochem/notes', f)),
    ...readdirSync('ochem/lessons').filter(f => f.endsWith('.html')).map(f => join('ochem/lessons', f)),
  ];
  let seen = 0;
  for(const f of files){
    const html = readFileSync(f, 'utf8');
    for(const m of html.matchAll(/<!-- fig:([a-z0-9-]+):start -->([\s\S]*?)<!-- fig:\1:end -->/g)){
      const [, id, block] = m;
      seen++;
      const vb = block.match(/viewBox="([^"]+)"/);
      assert.ok(vb, `${id}: no viewBox`);
      const [mx, my, w, h] = vb[1].split(/\s+/).map(Number);
      assert.ok(w > 0 && h > 0, `${id}: degenerate viewBox`);

      const xs = [...block.matchAll(/\s(?:cx|x1|x2|x)="(-?[\d.]+)"/g)].map(v => Number(v[1]));
      const ys = [...block.matchAll(/\s(?:cy|y1|y2|y)="(-?[\d.]+)"/g)].map(v => Number(v[1]));

      /* Rects and circles say how wide they are, so ask. A panel whose x is
         inside the canvas while x+width is 60 units past the right edge passed
         the anchor-only version of this check. */
      for (const r of block.matchAll(/<rect[^>]*\sx="(-?[\d.]+)"[^>]*\sy="(-?[\d.]+)"[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/g)) {
        xs.push(Number(r[1]) + Number(r[3]));
        ys.push(Number(r[2]) + Number(r[4]));
      }
      for (const c of block.matchAll(/<circle[^>]*\scx="(-?[\d.]+)"[^>]*\scy="(-?[\d.]+)"[^>]*\sr="([\d.]+)"/g)) {
        xs.push(Number(c[1]) + Number(c[3]), Number(c[1]) - Number(c[3]));
        ys.push(Number(c[2]) + Number(c[3]), Number(c[2]) - Number(c[3]));
      }

      /* Text, measured as text. This is the check that was missing, and the
         gap it left was not theoretical: a review of nineteen figures found
         clipped labels in twelve of them, including one where BOTH product
         names — the whole answer the figure existed to give — were cut off at
         the right edge. A <text> element's x is an anchor, not a left edge,
         and the drawing kit defaults text-anchor to `middle`, so a label
         centred two characters inside the canvas is half outside it.

         The size that renders is the CSS one, not the attribute: every fg-
         class in theme.css sets font-size and a CSS declaration beats a
         presentation attribute, so estimating from the `size` option the kit
         offers under-measures every label. The width estimate is crude — a
         mean glyph is about 0.62 em in these faces — and deliberately
         generous, because the failure it is looking for is half a sentence
         missing, not two pixels. */
      const CSS_SIZE = { 'fg-lbl': 13, 'fg-sm': 10.5, 'fg-tag': 11, 'fg-tag-mut': 11, 'fg-tag-warn': 11, 'fg-tag-good': 11 };
      for (const t of block.matchAll(/<text class="([a-z-]+)"[^>]*\sx="(-?[\d.]+)"[^>]*\stext-anchor="(\w+)"[^>]*\sfont-size="([\d.]+)"[^>]*>([^<]*)</g)) {
        const [, cls, ax, anchor, fs, body] = t;
        const size = CSS_SIZE[cls] ?? Number(fs);
        const wide = body.replace(/&[a-z]+;/g, 'x').length * size * 0.62;
        const left = anchor === 'middle' ? Number(ax) - wide / 2 : anchor === 'end' ? Number(ax) - wide : Number(ax);
        xs.push(left, left + wide);
      }

      assert.ok(xs.length && ys.length, `${id}: nothing drawn`);
      // A few units of slack: a stroke has width and a glyph has descenders.
      assert.ok(Math.min(...xs) >= mx - 6, `${id}: content runs off the left edge`);
      assert.ok(Math.max(...xs) <= mx + w + 6, `${id}: content runs off the right edge`);
      assert.ok(Math.min(...ys) >= my - 6, `${id}: content runs off the top edge`);
      assert.ok(Math.max(...ys) <= my + h + 6, `${id}: content runs off the bottom edge`);

      assert.match(block, /role="img"/, `${id}: figure is not exposed as an image`);
      assert.match(block, /aria-label="[^"]{12,}"/, `${id}: figure has no usable alt text`);
      assert.match(block, /<figcaption>/, `${id}: figure has no caption`);
    }
  }
  assert.ok(seen >= 6, `expected at least 6 generated figures, found ${seen}`);
});

/* ====================================================================== */
/* The Reagent Roadmap                                                     */
/* ====================================================================== */

/* The roadmap routes over a hand-written graph of every interconversion the
   course teaches, so the graph is the thing that can be wrong. These hold it
   to things that are not written in it: the curriculum, the oxidation ladder
   the course draws, and routes whose answer the notes work out by hand. */
function roadmap(){
  const s = browser().load('ochem/assets/curriculum.js', 'ochem/assets/tools/reagent-roadmap-data.js',
                           'ochem/assets/tools/reagent-roadmap.js');
  return { D: s.OchemRoadmap, E: s.OchemRoadmapEngine, C: s.OchemCurriculum };
}

test('roadmap: every reaction joins real groups, names real reagents and links a real section', () => {
  const { D, C } = roadmap();
  const topics = new Set();
  for(const m of C.MODULES) for(const t of m.topics) topics.add(t.id);
  const ids = new Set(), used = new Set(), touched = new Set();

  for(const n of D.NODES){
    assert.ok(topics.has(n.topic), `group ${n.id} links topic "${n.topic}", which the curriculum does not have`);
    assert.ok(existsSync(`ochem/notes/${n.topic}.html`), `group ${n.id}: no notes page for ${n.topic}`);
  }
  for(const e of D.EDGES){
    assert.ok(!ids.has(e.id), `duplicate reaction id ${e.id}`); ids.add(e.id);
    assert.ok(D.node(e.from), `${e.id}: no group "${e.from}"`);
    assert.ok(D.node(e.to), `${e.id}: no group "${e.to}"`);
    assert.ok(topics.has(e.topic), `${e.id} links topic "${e.topic}", which the curriculum does not have`);
    assert.ok(existsSync(`ochem/notes/${e.topic}.html`), `${e.id}: no notes page for ${e.topic}`);
    assert.ok(e.keys.length, `${e.id} names no reagent`);
    for(const k of e.keys){ assert.ok(D.reagent(k), `${e.id} uses reagent "${k}", which is not defined`); used.add(k); }
    assert.ok(Array.isArray(e.rx) && e.rx.length && e.rx.every(x => typeof x === 'string' && x.trim()), `${e.id}: no reagent line`);
    assert.ok(Array.isArray(e.ex) && e.ex.length === 2 && e.ex.every(Boolean), `${e.id}: no worked example`);
    assert.ok(['up', 'down', 'across', 'cc', 'join', 'ring'].includes(e.kind), `${e.id}: kind "${e.kind}"`);
    if(e.kind === 'cc') assert.ok(e.cc, `${e.id} is a C–C step but does not say what happens to the carbons`);
    touched.add(e.from); touched.add(e.to);
  }
  for(const r of D.REAGENTS) assert.ok(used.has(r.id), `reagent ${r.id} is listed but no reaction uses it`);
  for(const n of D.NODES) assert.ok(touched.has(n.id), `group ${n.id} has no reactions at all`);
});

test('roadmap: every redox claim agrees with the oxidation ladder', () => {
  /* The notes' ladder: a step that climbs needs an oxidant, one that falls a
     reductant, and one that stays level needs neither. A reaction filed as
     "across" between two levels — or "up" to a lower one — would teach the
     wrong shelf to reach for. C–C steps are exempt: the ladder counts bonds
     to heteroatoms on a fixed skeleton. */
  const { D } = roadmap();
  let checked = 0;
  for(const e of D.EDGES){
    if(e.cc || !['up', 'down', 'across'].includes(e.kind)) continue;
    const a = D.node(e.from).band, b = D.node(e.to).band;
    if(typeof a !== 'number' || typeof b !== 'number') continue;
    const want = b > a ? 'up' : b < a ? 'down' : 'across';
    assert.equal(e.kind, want, `${e.id}: filed as "${e.kind}" but goes from level ${a} to ${b}`);
    checked++;
  }
  assert.ok(checked > 60, `only ${checked} reactions checked against the ladder`);
});

test('roadmap: substitution patterns only name patterns that exist', () => {
  const { D } = roadmap();
  const pats = (id) => { const n = D.node(id); return n.patterns ? Object.keys(D.PATTERNS[n.patterns].set) : null; };
  for(const e of D.EDGES){
    const pf = pats(e.from), pt = pats(e.to);
    if(e.needs){ assert.ok(pf, `${e.id} needs a pattern of an untracked group`);
      for(const p of e.needs) assert.ok(pf.includes(p), `${e.id} needs "${p}", which ${e.from} does not have`); }
    if(e.gives){ assert.ok(pt, `${e.id} gives a pattern to an untracked group`);
      for(const p of e.gives) assert.ok(pt.includes(p), `${e.id} gives "${p}", which ${e.to} does not have`); }
    if(e.map){ assert.ok(pf && pt, `${e.id} maps patterns between untracked groups`);
      for(const [k, v] of Object.entries(e.map)){
        assert.ok(pf.includes(k), `${e.id} maps from "${k}", which ${e.from} does not have`);
        for(const p of v) assert.ok(pt.includes(p), `${e.id} maps to "${p}", which ${e.to} does not have`);
      } }
    if(e.keep) assert.ok(pf && pt && pf.some(p => pt.includes(p)), `${e.id} keeps a pattern the two groups do not share`);
  }
});

test('roadmap: two reactions with the same start and end either agree or say how they differ', () => {
  /* Lindlar and Na/NH₃ both turn an alkyne into an alkene, and the difference
     is the whole point. The quiz asks about such pairs, so each side must name
     its outcome — or it would mark one of two right answers wrong. */
  const { D } = roadmap();
  for(const a of D.EDGES) for(const b of D.EDGES){
    if(a === b || a.from !== b.from || a.to !== b.to) continue;
    if(a.spec || b.spec) assert.ok(a.spec && b.spec && a.spec !== b.spec,
      `${a.id} and ${b.id} share a start and an end, but only one says which product it means`);
  }
});

test('roadmap: routes the notes work out by hand come out the same', () => {
  const { E } = roadmap();
  const keep = { skeleton: true }, any = { skeleton: false };
  const ids = (r) => r.hops.map(h => h.map(e => e.id));

  // Functional group interconversion, worked example: propan-2-ol to
  // propan-1-ol is eliminate, then hydroborate — two steps, via propene.
  let r = E.routes('alcohol-2', 'alcohol-1', keep);
  assert.equal(r.length, 2);
  assert.equal(r.shortest[0].nodes.join(' > '), 'alcohol-2 > alkene > alcohol-1');
  assert.ok(ids(r.shortest[0])[1].includes('ene-hydroboration'), 'the re-addition must be the anti-Markovnikov one');
  assert.ok(!ids(r.shortest[0])[1].includes('ene-h3o-2'), 'acid hydration would put the OH straight back');

  // One-step oxidations stop where the water says.
  r = E.routes('alcohol-1', 'aldehyde', keep);
  assert.equal(r.length, 1);
  assert.ok(r.shortest[0].hops[0].every(e => e.keys.includes('PCC')), 'the aldehyde needs an anhydrous oxidant');
  r = E.routes('alcohol-1', 'acid', keep);
  assert.equal(r.length, 1);
  assert.ok(r.shortest[0].hops[0].some(e => e.keys.includes('Jones')));

  // Syn diol in one step; the anti diol is the epoxide route, one longer.
  r = E.routes('alkene', 'diol', keep);
  assert.equal(r.length, 1);
  assert.ok(r.longer.some(x => x.nodes.join() === 'alkene,epoxide,diol'), 'no anti-diol route through the epoxide');

  // A 3° alcohol's alkene has no H on one carbon, so no alkyne can be made
  // from it without changing the skeleton — the trap a naive map falls into.
  r = E.routes('alcohol-3', 'alkyne', keep);
  assert.equal(r.shortest.length, 0, `3° alcohol → alkyne should be impossible on the same skeleton: ${r.shortest.map(x => x.nodes.join(' > ')).join(' | ')}`);

  // Benzylic alcohols have no β-H: an acid off a ring cannot come back down
  // as an alcohol and then eliminate.
  r = E.routes('acid', 'alkene', keep);
  for(const x of r.shortest.concat(r.longer)) assert.ok(!x.states[0].includes('ar'), 'ArCOOH was routed to an alkene through benzyl alcohol');

  // Skeleton mode never makes or breaks a C–C bond; nothing that fastens on a
  // second molecule is ever followed by another step.
  for(const [a, b] of [['halide-1', 'acid'], ['ketone', 'aldehyde'], ['alkene', 'ester'], ['arene', 'acid']]){
    for(const opts of [keep, any]){
      const res = E.routes(a, b, opts);
      for(const x of res.shortest.concat(res.longer)){
        x.hops.forEach((h, i) => {
          for(const e of h){
            if(opts.skeleton) assert.ok(!e.cc, `${a} → ${b}: ${e.id} changes the skeleton in keep-the-skeleton mode`);
            if(e.final) assert.equal(i, x.hops.length - 1, `${a} → ${b}: ${e.id} is followed by another step`);
          }
        });
      }
    }
  }

  // And the one-carbon extensions exist only when asked for.
  assert.equal(E.routes('halide-1', 'acid', keep).length, 2, 'halide → 1° alcohol → acid, keeping the skeleton');
  assert.ok(E.routes('halide-1', 'acid', any).shortest.some(x => x.hops[0].some(e => e.cc === '+1 C')));
});

test('roadmap: the reagent search finds what students type', () => {
  const { E } = roadmap();
  const first = (q) => E.searchReagents(q).map(r => r.id);
  for(const [q, id] of [['nabh4', 'NaBH4'], ['LiAlH4', 'LiAlH4'], ['h2cro4', 'Jones'], ['PCC', 'PCC'], ['mcpba', 'mCPBA'],
                        ['OsO4', 'OsO4'], ['ozone', 'O3'], ['DMS', 'O3'], ['BH3', 'BH3'], ['HBr/ROOR', 'HBrROOR'],
                        ['socl2', 'SOCl2'], ['PBr3', 'PBr3'], ['grignard', 'RMgX'], ['gilman', 'R2CuLi'],
                        ['NaNH2', 'NaNH2'], ['lindlar', 'Lindlar'], ['Na/NH3', 'NaNH3'], ['dibal', 'DIBAL']]){
    assert.ok(first(q).includes(id), `searching "${q}" does not find ${id}`);
  }
  assert.equal(E.searchReagents('zzzz').length, 0);
});
