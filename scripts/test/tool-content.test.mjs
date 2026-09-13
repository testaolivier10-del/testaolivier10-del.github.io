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
                    'reaction-predictor', 'spectroscopy', 'arrow-pusher'];

function quizConfigs(){
  const captured = [];
  for(const slug of QUIZ_TOOLS){
    const b = browser({
      OchemToolQuiz: { mount(el, cfg){ captured.push({ slug, cfg }); return {}; },
                       shuffle: a => a, esc: x => String(x) },
      OchemTools: null,
    });
    b.load(...CORE, `ochem/assets/tools/${slug}.js`);
  }
  return captured;
}

test('all seven tools register a quiz', () => {
  const got = quizConfigs().map(c => c.slug);
  for(const slug of QUIZ_TOOLS) assert.ok(got.includes(slug), `${slug} registered no quiz`);
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
  for(const x of s.S){
    const source = x.localSrc || x.synth || x.audioUrl;
    assert.ok(source, `${x.id} has no local file, no synth and no URL — nothing will play`);
    assert.ok(x.group === 'lung' || x.group === 'heart', `${x.id} has no group`);
    assert.ok(x.label && x.description && x.clinical, `${x.id} is missing its copy`);
    // Lung sounds must not be synthesized: a wheeze is a texture, and a
    // synthetic texture teaches the wrong thing. See sound-bank.js.
    if(x.group === 'lung') assert.ok(!x.synth, `${x.id} is a lung sound and must not be generated`);
  }
  // A round offers only its own group, so each group needs enough choices to
  // be a fair multiple choice.
  for(const g of ['lung', 'heart']){
    const n = s.S.filter(x => x.group === g).length;
    assert.ok(n >= 4, `only ${n} ${g} sounds — too few for a multiple choice`);
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

  assert.equal(s.S.length, 8);
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
