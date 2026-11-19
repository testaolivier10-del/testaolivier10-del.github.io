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
  'ochem/assets/push-board.js',
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
/* Tools v2 (docs/tools-v2-conformations-brief.md): the picture, its labels and the line under it all read one
   model, so the model is what is checked. */
function confModel(){
  return browser({ OchemToolQuiz: { mount(){ return {}; }, shuffle: a => a, esc: x => String(x) }, OchemTools: null })
    .load(...CORE, 'ochem/assets/tools/conformations.js').OchemConformationModel;
}
const chainText = c => c.map(x => x.t).join(' | ');

test('conformations v2: every landmark is named from the groups and the declared energies', () => {
  const M = confModel();
  // butane: syn > eclipsed > gauche > anti, with the strain named for each
  const b = d => M.bond('butane', d);
  assert.equal(b(180).conf.key, 'anti');   assert.match(chainText(b(180).chain), /Staggered \| CH₃ groups far apart \| 0\.0 kcal\/mol, lowest/);
  assert.equal(b(60).conf.key, 'gauche');  assert.match(chainText(b(60).chain), /Staggered \| CH₃ groups close: steric strain \| 0\.9 kcal\/mol$/);
  assert.equal(b(300).conf.key, 'gauche');
  assert.equal(b(120).conf.key, 'eclipsed'); assert.match(chainText(b(120).chain), /^Eclipsed: torsional strain \| 3\.6 kcal\/mol$/);
  assert.equal(b(0).conf.key, 'syn');      assert.match(chainText(b(0).chain), /^Eclipsed: torsional strain \| CH₃ on CH₃: steric \| 4\.6 kcal\/mol, highest$/);
  assert.equal(b(360).conf.key, 'syn');
  assert.ok(b(0).up > b(120).up && b(120).up > b(60).up && b(60).up > b(180).up, 'butane: syn > eclipsed > gauche > anti');
  // a name holds within 10 degrees of its landmark and nowhere else
  assert.equal(b(68).conf.key, 'gauche'); assert.equal(b(71).conf.key, 'between'); assert.match(chainText(b(90).chain), /^Part way \| /);
  // ethane and propane have no pair of big groups: staggered and eclipsed only, no steric words anywhere
  for(const id of ['ethane', 'propane']) for(let d = 0; d < 360; d += 60){
    const r = M.bond(id, d);
    assert.equal(r.conf.key, d % 120 === 0 ? 'eclipsed' : 'staggered', `${id} at ${d}`);
    assert.ok(!/steric|repel/.test(chainText(r.chain)), `${id} at ${d}: ${chainText(r.chain)}`);
  }
  // where gauche wins, nothing calls gauche strained or anti the lowest
  for(const id of ['difluoroethane', 'ethylene-glycol']){
    const g = M.bond(id, 60), a = M.bond(id, 180);
    assert.match(chainText(g.chain), id === 'difluoroethane' ? /gauche effect \| 0\.0 kcal\/mol, lowest/ : /hydrogen bond \| 0\.0 kcal\/mol, lowest/);
    assert.ok(!/steric|repel/.test(chainText(g.chain)) && !/lowest/.test(chainText(a.chain)), id);
    assert.ok(g.steric.every(w => w === 0), `${id}: no crowding drawn at gauche`);
    assert.ok(!/lowest energy shape and where/.test(a.describe.detail) && /not the lowest/.test(a.describe.detail), `${id}: anti is not called the minimum`);
  }
  // halogens crowd by repelling, not "steric strain"; every chain ends on an energy that matches the curve
  assert.match(chainText(M.bond('dichloroethane', 60).chain), /Cl groups close: they repel/);
  for(const t of M.torsionals) for(let d = 0; d < 360; d += 60){
    const r = M.bond(t.id, d), last = r.chain[r.chain.length - 1].t;
    assert.ok(last.startsWith(t.energies[d / 60].toFixed(1) + ' kcal/mol'), `${t.id} at ${d}: ${last}`);
    assert.equal(/highest/.test(last), t.energies[d / 60] === Math.max(...t.energies), `${t.id} at ${d}: highest`);
    assert.equal(/lowest/.test(last), t.energies[d / 60] === 0, `${t.id} at ${d}: lowest`);
    assert.ok(!/undefined|NaN/.test(chainText(r.chain) + r.describe.name + r.describe.detail));
  }
  // 2-methylbutane has two CH3 on one carbon: its wells are counted, not called anti
  assert.equal(M.bond('methylbutane', 180).conf.key, 'staggered');
  // ... and the line counts the close pairs, so a red strain pill never leads to "0.0, lowest"
  assert.equal(chainText(M.bond('methylbutane', 180).chain), 'Staggered | 1 CH₃ pair close | 0.0 kcal/mol, lowest');
  assert.equal(chainText(M.bond('methylbutane', 300).chain), 'Staggered | 1 CH₃ pair close | 0.0 kcal/mol, lowest');
  assert.equal(chainText(M.bond('methylbutane', 60).chain), 'Staggered | 2 CH₃ pairs close: steric strain | 0.9 kcal/mol');
  assert.equal(M.bond('methylbutane', 180).chain[1].role, 'ink');
  // "highest" and "lowest" only where the number shown is the extreme
  assert.ok(!/lowest/.test(chainText(M.bond('butane', 186).chain)) && /lowest/.test(chainText(M.bond('butane', 181).chain)));
  assert.ok(!/highest/.test(chainText(M.bond('butane', 351).chain)) && /highest/.test(chainText(M.bond('butane', 359).chain)));
  assert.match(M.bond('methylbutane', 60).describe.detail, /2 pairs of big groups 60° apart/);
});

test('conformations v2: the ring flip keeps every bond length, swaps every position and keeps every face', () => {
  const M = confModel(), d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const ringOf = (...e) => { const r = [null, null, null, null, null, null]; e.forEach(([i, k, f]) => { r[i] = [k, f]; }); return r; };
  const r1 = ringOf([0, 'Me', 'up']);
  for(let p = 0; p <= 1.0001; p += 0.05){
    const g = M.chair(r1, p).geo;
    for(let i = 0; i < 6; i++) assert.ok(Math.abs(d(g.C[i], g.C[(i + 1) % 6]) - 1.53) < 0.012, `C-C at p=${p.toFixed(2)}: ${d(g.C[i], g.C[(i + 1) % 6])}`);
    assert.equal(g.atoms.length, 12);
    // never flat: some carbon is always well off the mean plane
    assert.ok(Math.max(...g.C.map(c => Math.abs(c.z))) > 0.2, `flat ring at p=${p.toFixed(2)}`);
  }
  const A = M.chair(r1, 0).geo, B = M.chair(r1, 1).geo;
  for(let i = 0; i < 12; i++){
    assert.equal(A.atoms[i].carbon, B.atoms[i].carbon); assert.equal(A.atoms[i].face, B.atoms[i].face);
    assert.notEqual(A.atoms[i].isAxial, B.atoms[i].isAxial, 'a flip swaps axial and equatorial at every position');
  }
  for(const g of [A, B]) for(let c = 0; c < 6; c++){
    const two = g.atoms.filter(a => a.carbon === c);
    assert.equal(two.filter(a => a.isAxial).length, 1, 'one axial and one equatorial on each carbon');
    const ax = two.find(a => a.isAxial), eq = two.find(a => !a.isAxial);
    assert.ok(ax.axness > 0.93 && eq.axness < 0.45, `axial is along the ring axis, equatorial is not (${ax.axness}, ${eq.axness})`);
    // axial positions alternate up and down around the ring
    assert.equal(ax.face, g.atoms.find(a => a.carbon === (c + 2) % 6 && a.isAxial).face);
    assert.notEqual(ax.face, g.atoms.find(a => a.carbon === (c + 1) % 6 && a.isAxial).face);
  }
  // the classic results fall out of the geometry
  const best = ring => { const pr = M.chair(ring, 0).pair; return Math.min(pr.a.total, pr.b.total); };
  const worst = ring => { const pr = M.chair(ring, 0).pair; return Math.max(pr.a.total, pr.b.total); };
  // 1,2-dimethyl rings pay the gauche CH3/CH3 cost tab 1 teaches (OpenStax 4.8: trans ee 3.8 kJ/mol, each cis chair 11.4)
  assert.equal(best(ringOf([0, 'Me', 'up'], [1, 'Me', 'down'])), 0.9, 'trans-1,2: diequatorial, one gauche pair');
  assert.equal(worst(ringOf([0, 'Me', 'up'], [1, 'Me', 'down'])), 3.4, 'trans-1,2 diaxial: two A-values, the methyls anti');
  { const t12 = M.chair(ringOf([0, 'Me', 'up'], [1, 'Me', 'down']), 0), ee = t12.pair.a.total < t12.pair.b.total ? 0 : 1;
    assert.equal(chainText(M.chair(ringOf([0, 'Me', 'up'], [1, 'Me', 'down']), ee).chain), 'Both equatorial | gauche: 0.9 kcal/mol | 98.55% of molecules');
    assert.equal(best(ringOf([0, 'Me', 'up'], [1, 'Et', 'down'])), 0.9, 'any two neighboring groups pay the flat gauche estimate');
    assert.equal(best(ringOf([0, 'Ph', 'up'], [1, 'Br', 'down'])), 0.9, 'a carbon group beside anything pays it');
    assert.equal(best(ringOf([0, 'Me', 'up'], [1, 'OH', 'down'])), 0.9, 'CH3/OH: one carbon group is enough');
    // two polar neighbors are not costed and not drawn as strained (tab 1 teaches F/F and OH/OH prefer gauche)
    for(const [g, ax] of [['F', 0.5], ['OH', 1.74], ['Cl', 0.86]]){
      const r = ringOf([0, g, 'up'], [1, g, 'down']), pr = M.chair(r, 0).pair, ee = pr.a.axial.length ? pr.b : pr.a, aa = pr.a.axial.length ? pr.a : pr.b;
      assert.equal(ee.total, 0, `${g}/${g} diequatorial: no cost`); assert.equal(ee.gauche.length, 0, `${g}/${g}: no glow pair`); assert.equal(ee.polar.length, 1);
      assert.ok(Math.abs(aa.total - ax) < 1e-9, `${g}/${g} diaxial: the two A-values only (${aa.total})`);
      assert.ok(ee.terms.some(t => /two polar neighbors, not estimated here/.test(t.text) && t.kcal === 0));
      const end = pr.a.axial.length ? 1 : 0;
      assert.match(chainText(M.chair(r, end).chain), /^Both equatorial \| no strain \| /);
    } }
  /* The drill (Find the stable chair) draws one or two groups from eight, cis or trans, 1,2 / 1,3 / 1,4, never two
     halogens on neighboring carbons, and skips ties. For every such ring the better chair is the one it was
     before the gauche term existed (the term is the same in both chairs of a cis ring, and never outweighs two
     A-values in a trans one), so no answer changed. */
  { const G8 = ['Me', 'Et', 'iPr', 'tBu', 'Ph', 'OH', 'Cl', 'Br'], hal = k => /^(Cl|Br|F)$/.test(k); let n = 0;
    const plain = e => e.total - 0.9 * e.gauche.length;
    for(const g1 of G8) for(const f1 of ['up', 'down']) for(const pos of [1, 2, 3]) for(const g2 of G8) for(const f2 of ['up', 'down']){
      if(pos === 1 && hal(g1) && hal(g2)) continue;
      const pr = M.chair(ringOf([0, g1, f1], [pos, g2, f2]), 0).pair;
      if(Math.abs(pr.a.total - pr.b.total) < 0.2) continue;
      n++;
      assert.ok(Math.abs(plain(pr.a) - plain(pr.b)) >= 0.2 - 1e-9 && (pr.a.total < pr.b.total) === (plain(pr.a) < plain(pr.b)), `${g1} ${f1} C1, ${g2} ${f2} C${pos + 1}: the winner moved`);
    }
    assert.ok(n > 500, `only ${n} drill rings checked`); }
  assert.equal(best(ringOf([0, 'Me', 'up'], [2, 'Me', 'up'])), 0, 'cis-1,3: diequatorial');
  assert.equal(best(ringOf([0, 'Me', 'up'], [3, 'Me', 'down'])), 0, 'trans-1,4: diequatorial');
  assert.equal(best(ringOf([0, 'Me', 'up'], [1, 'Me', 'up'])), 2.6, 'cis-1,2: one axial and one gauche pair in either chair');
  assert.equal(worst(ringOf([0, 'Me', 'up'], [1, 'Me', 'up'])), 2.6);
  assert.equal(best(ringOf([0, 'Me', 'up'], [2, 'Me', 'down'])), 1.7, 'trans-1,3: one axial in either chair');
  assert.equal(worst(ringOf([0, 'Me', 'up'], [2, 'Me', 'up'])), 1.7 * 2 + 1.6, 'cis-1,3 diaxial pays the extra 1,3 term');
  // methylcyclohexane: 1.70 kcal/mol is about 95 : 5 at room temperature; the words follow
  const m0 = M.chair(r1, 0), m1 = M.chair(r1, 1);
  assert.equal(m0.state, 'CH₃ axial'); assert.equal(m1.state, 'CH₃ equatorial');
  assert.match(chainText(m0.chain), /^CH₃ axial \| strain 1\.7 kcal\/mol \| 5\.4% of molecules$/);
  assert.match(chainText(m1.chain), /^CH₃ equatorial \| no strain \| 94\.6% of molecules$/);
  assert.equal(chainText(M.chair(r1, 0.25).chain), 'Half chair | high energy'); assert.equal(chainText(M.chair(r1, 0.5).chain), 'Boat | high energy');
  // "high energy" only from half chair to half chair: near either end the ring is still a chair and says so
  for(let i = 0; i <= 100; i++){
    const p = i / 100, t = chainText(M.chair(r1, p).chain), high = /high energy/.test(t);
    assert.equal(high, i >= 13 && i <= 87, `p=${p.toFixed(2)}: ${t}`);
    if(!high) assert.match(t, p < 0.5 ? /^CH₃ axial/ : /^CH₃ equatorial/);
  }
  // the methyl's bond is already (or still) mostly axial wherever the words say axial, so the glow has something to follow
  for(const p of [0, 0.05, 0.1, 0.12]){ const a = M.chair(r1, p).geo.atoms.find(x => x.subKey === 'Me'); assert.ok(a.isAxial && a.axness > 0.8, `p=${p}: axness ${a.axness}`); }
  assert.match(chainText(M.chair(ringOf(), 0).chain), /both chairs the same/);
});

/* ====================================================================== */

/* Every tool's quiz generator, driven the way the shell drives it. The rule
   that matters is that exactly one option is correct: a question with two
   right answers marks a student wrong for being right, which is worse than
   no quiz at all. */
const QUIZ_TOOLS = ['acid-base', 'viewer-3d', 'conformations', 'resonance',
                    'reaction-predictor', 'spectroscopy', 'arrow-pusher', 'reagent-roadmap', 'synthesis'];

/* A tool whose data lives in a file of its own loads it first, as its page
   does. */
const TOOL_DEPS = {
  'reagent-roadmap': ['ochem/assets/curriculum.js', 'ochem/assets/tools/reagent-roadmap-data.js'],
  // The Synthesis Trainer walks the roadmap's graph with the roadmap's engine.
  // Its own route and explanation checks are in synthesis-trainer.test.mjs.
  'synthesis': ['ochem/assets/curriculum.js', 'ochem/assets/mol-builder.js', 'ochem/assets/tools/reagent-roadmap-data.js',
                'ochem/assets/tools/reagent-roadmap.js', 'ochem/assets/tools/synthesis-data.js'],
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
  // four playable clips. Airway and lung are described on the page before they
  // reach that (lung dropped to two when the unlicensed rhonchi and normal
  // clips were removed); the page hides a group's quiz button until then.
  for(const g of ['heart']){
    const n = s.S.filter(x => x.group === g && x.available).length;
    assert.ok(n >= 4, `only ${n} playable ${g} sounds — too few for a multiple choice`);
  }
});

test('missing a sound makes it come back, without taking over the quiz', () => {
  const src = extract('nremt/sound-trainer.html', 'const SOUNDS =', 'function quizPool()');
  const s = browser().ctx;
  vm.runInContext(src + '\nthis.S=SOUNDS; this.draw=drawSound; this.misses=misses;', s);

  const pool = s.S.filter(x => x.available && x.group === 'heart');
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

/* ====================================================================== */
/* Spectrum predictor (site audit 2026-10)                                 */
/* ====================================================================== */

test('the spectrum predictor reads splitting, anhydrides, para rings and condensed groups', () => {
  const s = browser().load('ochem/assets/molecules.js', 'ochem/assets/chem-core.js',
                           'ochem/assets/mol-builder.js', 'ochem/assets/spectra-predict.js');
  const { OchemBuilder: B, OchemSpectra: S, OchemChem: C } = s;
  const nmr = f => S.predictNMR(B.parse(f).st);

  // n+1 past a sextet: six equivalent neighbours make a septet.
  const ipr = nmr('(CH3)2CHCl');
  assert.ok(ipr.some(x => x.h === 1 && x.mult === 'sept'), '2-chloropropane CH is not a septet');

  // Acetic anhydride shows two carbonyl bands, not one ester band.
  const ir = S.predictIR(B.parse('CH3COOCOCH3').st).map(b => b.cm);
  assert.ok(ir.includes(1820) && ir.includes(1760) && !ir.includes(1740), 'anhydride carbonyls wrong: ' + ir);

  // A para ring with two different groups: two 2H doublets, ortho-to-NO2 downfield.
  B.RINGS['p-nitrotoluene (test)'] = { n:6, aromatic:true, subs:{0:'CH3', 3:'NO2'} };
  const ar = S.predictNMR(B.parse('p-nitrotoluene (test)').st).filter(x => x.label === 'Ar–H');
  assert.equal(ar.length, 2, 'para ring merged into one signal');
  assert.ok(ar.every(x => x.h === 2 && x.mult === 'd'), 'para ring is not two 2H doublets');
  assert.ok(Math.abs(ar[0].ppm - ar[1].ppm) > 0.5, 'para doublets not separated');

  // Equivalent ring hydrogens stay one singlet whatever the Kekulé drawing.
  const px = S.predictNMR(B.parse('p-xylene').st).filter(x => x.label === 'Ar–H');
  assert.ok(px.length === 1 && px[0].mult === 's' && px[0].h === 4, 'p-xylene ring H is not a 4H singlet');

  // A C=O pointing out of the ring does not make the ring aromatic (quinone).
  B.RINGS['quinone (test)'] = { n:6, unsat:[[1,2],[4,5]], ketone:0 };
  const q = B.parse('quinone (test)').st;
  q.atoms.o2 = { el:'O', label:'O', group:false, x:0, y:0, r:18, lp:2, charge:0, hImplicit:0 };
  q.bonds.push({ a:'r4', b:'o2', order:2 });
  C.countImplicitHydrogens(q);
  assert.equal(Object.keys(S.aromaticSet(q)).length, 0, 'a quinone is called aromatic');

  // Condensed CH₃ labels count in the formula and show up in the spectrum.
  const mx = { atoms:{}, bonds:[] };
  for(let i = 1; i <= 6; i++) mx.atoms['c' + i] = { label:'C', x:i, y:0 };
  mx.atoms.m1 = { label:'CH₃', x:0, y:0 }; mx.atoms.m3 = { label:'CH₃', x:0, y:0 };
  for(let i = 1; i <= 6; i++) mx.bonds.push({ a:'c' + i, b:'c' + (i % 6 + 1), order: i % 2 ? 2 : 1 });
  mx.bonds.push({ a:'c1', b:'m1' }, { a:'c3', b:'m3' });
  const st = C.fromMolecule(mx);
  assert.equal(C.formula(st), 'C₈H₁₀', 'm-xylene formula');
  assert.ok(S.predictNMR(st).some(x => x.h === 6 && x.label === 'CH₃'), 'm-xylene methyls missing');

  // Repeated halogens hang off the atom before them; sulfonic acid is S(=O)(=O)OH, not a chain.
  const star = (g) => JSON.stringify(C.parseGroup(g).bonds.map(b => [b[0], b[2]]));
  assert.equal(star('CF₃'), '[[0,1],[0,1],[0,1]]', 'CF3 read as a chain');
  assert.equal(star('CCl₃'), '[[0,1],[0,1],[0,1]]', 'CCl3 read as a chain');
  assert.equal(star('SO₃H'), '[[0,2],[0,2],[0,1]]', 'SO3H read as a chain');
});

/* ====================================================================== */
/* Resonance v2 (docs/tools-v2-resonance-brief.md)                         */
/* ====================================================================== */

function resModel(){
  return browser({ OchemToolQuiz: { mount(){ return {}; }, shuffle: a => a, esc: x => String(x) }, OchemTools: null })
    .load(...CORE, 'ochem/assets/tools/resonance.js');
}

test('resonance v2: majors, minors and equal forms, with the reason a minor form ranks lower', () => {
  const s = resModel(), M = s.OchemResonanceModel, C = s.OchemChem, R = s.OchemResonance, Mol = s.OchemMolecules;
  const rank = id => M.rankForms(R.contributors(C.fromMolecule(Mol.get(id))));
  const tags = id => rank(id).map(f => f.tag).join(',');
  for(const id of ['acetate-ion', 'formate', 'allyl-cation', 'allyl-anion', 'nitromethane', 'benzene', 'ozone']) assert.equal(tags(id), 'equal,equal', id);
  assert.equal(tags('carbonate'), 'equal,equal,equal');
  assert.equal(tags('nitrate'), 'equal,equal,equal');
  assert.equal(tags('enolate'), 'major,minor');
  assert.equal(rank('enolate')[1].rule, 'electronegativity');
  assert.equal(tags('acetamide'), 'major,minor');
  assert.equal(rank('acetamide')[1].rule, 'charge-count');
  assert.equal(tags('phenoxide'), 'major,major,minor,minor,minor');
  // the benzyl cation: the engine ties all five; the two that keep the benzene ring whole are the major ones
  const bz = rank('benzyl-cation');
  assert.equal(bz.map(f => f.tag).join(','), 'major,major,minor,minor,minor');
  assert.ok(bz.slice(0, 2).every(f => M.kekule(f.st)) && bz.slice(2).every(f => !M.kekule(f.st) && f.rule === 'ring'));
  // the + sits on CH₂ in both major forms
  for(const f of bz.slice(0, 2)) assert.equal(C.formalCharge(f.st, 'ch2'), 1);
});

test('resonance v2: the real molecule shares charge exactly only where every form is equal', () => {
  const s = resModel(), M = s.OchemResonanceModel, C = s.OchemChem, R = s.OchemResonance, Mol = s.OchemMolecules;
  const hyb = id => M.hybridOf(M.rankForms(R.contributors(C.fromMolecule(Mol.get(id)))));
  const means = h => Object.fromEntries(Object.entries(h.atoms).map(([k, a]) => [k, a.fixed != null ? 'fixed ' + a.fixed : a.mean == null ? (a.big ? 'big' : 'small') : M.fraction(a.mean)]));
  assert.deepEqual(means(hyb('acetate-ion')), { o1: '−½', o2: '−½' });
  assert.deepEqual(means(hyb('carbonate')), { o1: '−⅔', o2: '−⅔', o3: '−⅔' });
  assert.deepEqual(means(hyb('nitrate')), { n: 'fixed 1', o1: '−⅔', o2: '−⅔', o3: '−⅔' });
  assert.equal(means(hyb('ozone')).o2, 'fixed 1');
  assert.deepEqual(means(hyb('allyl-cation')), { c1: '+½', c3: '+½' });
  // unequal forms: no fraction, only which atoms carry it in a major form (big) or only in a minor one (small)
  const en = means(hyb('enolate'));
  assert.ok(Object.values(en).includes('big') && Object.values(en).includes('small'));
  const am = means(hyb('acetamide'));
  assert.ok(Object.values(am).every(v => v === 'small'), JSON.stringify(am));
  // partial bonds: acetate's two C–O bonds, every benzene ring bond
  assert.equal(Object.values(hyb('acetate-ion').bonds).filter(b => b.hi > b.lo).length, 2);
  assert.equal(Object.values(hyb('benzene').bonds).filter(b => b.hi > b.lo).length, 6);
});

test('resonance v2: every form of every species is reachable by pushes, and a first push that overfills an atom is held', () => {
  const s = resModel(), M = s.OchemResonanceModel, C = s.OchemChem, R = s.OchemResonance, Mol = s.OchemMolecules;
  for(const sp of M.SPECIES){
    const start = C.fromMolecule(Mol.get(sp.id)), forms = R.contributors(start);
    for(const f of forms){
      if(R.key(f) === R.key(start)) continue;
      const path = M.pathTo(start, f, forms);
      assert.ok(path && path.length, `${sp.id}: no path to a form`);
      let cur = start;
      for(const step of path){ const v = R.validate(cur, step.arrows); assert.ok(v.valid, `${sp.id}: a step is not valid`); cur = v.structure; }
      assert.equal(R.key(cur), R.key(f), `${sp.id}: the path ends elsewhere`);
    }
  }
  // acetate: the O⁻ lone pair into C–O alone gives carbon ten electrons; that push can still be finished
  const ac = C.fromMolecule(Mol.get('acetate-ion')), first = [{ from: 'o2', to: 'bond:c-o2' }];
  const v = R.validate(ac, first);
  assert.equal(v.code, 'octet');
  assert.ok(M.completable(ac, first));
  // a lone pair onto a hydrogen makes a new σ bond: never completable
  const bad = [{ from: 'o1', to: 'h1' }];
  assert.notEqual(R.validate(ac, bad).code, 'octet');
});

test('resonance v2: Which is more stabilized keeps the old verdicts', () => {
  const s = resModel(), M = s.OchemResonanceModel, C = s.OchemChem, Mol = s.OchemMolecules;
  const j = (a, b) => M.judge(M.stabilization(C.fromMolecule(Mol.get(a))), M.stabilization(C.fromMolecule(Mol.get(b))));
  assert.equal(j('acetate-ion', 'phenoxide').winner, 'a');
  assert.equal(j('acetate-ion', 'phenoxide').rule, 'What the charge lands on');
  assert.equal(j('enolate', 'allyl-anion').winner, 'a');
  assert.equal(j('allyl-cation', 'acetate-ion').winner, 'tie');
  assert.equal(j('benzyl-cation', 'allyl-cation').winner, 'a');
});

/* ====================================================================== */
/* Arrow Pusher v2 (docs/tools-v2-arrow-pusher-brief.md)                   */
/* ====================================================================== */

function apModel(){
  return browser({ OchemToolQuiz: { mount(){ return {}; }, shuffle: a => a, esc: x => String(x) }, OchemTools: null })
    .load(...CORE, 'ochem/assets/tools/arrow-pusher.js');
}

test('arrow pusher v2: the bank keeps every id (challenges, molecules, mechanisms)', () => {
  const s = apModel(), A = s.OchemArrowChallenge, M = s.OchemArrowModel, Mol = s.OchemMolecules;
  assert.equal(JSON.stringify(A.CHALLENGES.map(c => c.id)), JSON.stringify(['sn2', 'acid-base', 'sn1', 'protonate', 'aldol', 'acyl', 'claisen']));
  const ids = M.GROUPS.reduce((a, g) => a.concat(g.picks.map(p => p.id)), []);
  assert.equal(ids.length, 18);
  for(const id of ids.concat(M.MECHS.map(m => m.id))) assert.ok(Mol.get(id), `${id} is not a molecule`);
  // the links other pages use (the course home, the Reaction Predictor) still land
  for(const id of ['sn2-bromoethane', 'sn1-secondary', 'e2-butane']) assert.ok(ids.includes(id), `${id} is not reachable by ?start=`);
});

test('arrow pusher v2: every Explore mechanism is real steps, and a concerted step is held after its first arrow', () => {
  const s = apModel(), M = s.OchemArrowModel, C = s.OchemChem;
  for(const m of M.MECHS){
    const path = M.pathOf(m);
    assert.equal(path.length, m.steps.length + 1, m.id);
    assert.equal(m.names.length, path.length, `${m.id}: a name per state`);
    for(let i = 0; i < m.steps.length; i++){
      const arrows = M.arrowsOf(m.steps[i]), r = M.applyArrows(path[i].st, arrows);
      assert.equal(r.issues.filter(x => x.level === 'error').length, 0, `${m.id} step ${i + 1}: the textbook arrows are rejected`);
      assert.ok(!M.sameStructure(path[i].st, path[i + 1].st), `${m.id} step ${i + 1} changes nothing`);
      assert.ok(M.sameStructure(r.structure, path[i + 1].st), `${m.id} step ${i + 1}: the row state is not what the arrows make`);
      // every atom keeps an octet (or a duet for H), except a carbocation the step is about
      for(const k of Object.keys(path[i + 1].st.atoms)){ const a = path[i + 1].st.atoms[k]; if(!a.el || a.group) continue; assert.ok(C.electronCount(path[i + 1].st, k) <= C.octetOf(path[i + 1].st, k), `${m.id}: ${k} over its octet`); }
      if(arrows.length > 1){
        const o = M.outcome(path[i].st, [arrows[0]]);
        assert.equal(o.kind, 'held', `${m.id} step ${i + 1}: the first arrow alone is ${o.kind}`);
        const o2 = M.outcome(path[i].st, arrows);
        assert.equal(o2.kind, 'step', `${m.id} step ${i + 1}: both arrows are ${o2.kind}`);
      }
    }
    // the pieces never land on one another, and a group that leaves is clearly away
    for(const st of path.map(p => p.st)){
      const keys = Object.keys(st.atoms), Lb = M.bondLen(path[0].st);
      for(let a = 0; a < keys.length; a++) for(let b = a + 1; b < keys.length; b++){
        const x = st.atoms[keys[a]], y = st.atoms[keys[b]];
        assert.ok(Math.hypot(x.x - y.x, x.y - y.y) > Lb * 0.45, `${m.id}: ${keys[a]} and ${keys[b]} overlap`);
      }
    }
  }
  // SN2: bromide drifts off, hydroxide comes in to a bond's length
  const sn2 = M.pathOf(M.MECHS[0]), a = sn2[0].st.atoms, b = sn2[1].st.atoms, d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  assert.ok(d(b.br, b.c1) > d(a.br, a.c1) * 1.5, 'bromide did not leave');
  assert.ok(d(b.nucO, b.c1) < d(a.nucO, a.c1), 'hydroxide did not come in');
});

test('arrow pusher v2: HBr adds Markovnikov by default; grabbing the other end gives the primary cation, with its note', () => {
  const s = apModel(), M = s.OchemArrowModel, C = s.OchemChem;
  const st = M.startOf('propene-hbr');
  const mk = (end) => M.applyArrows(st, [{ from: 'bond:c1-c2', to: 'hbrH', end }, { from: 'bond:hbrH-hbrBr', to: 'hbrBr' }]).structure;
  const mark = mk(undefined), anti = mk('c2');
  assert.equal(C.formalCharge(mark, 'c2'), 1, 'the textbook arrow does not put + on the secondary carbon');
  assert.equal(C.formalCharge(anti, 'c1'), 1, 'grabbing the CH end did not attack with it');
  assert.ok(M.plausibility(st, anti).some(n => /1° C⁺/.test(n.short) && n.pill), 'a primary carbocation gets no note');
  assert.ok(!M.plausibility(st, mark).some(n => n.pill), 'the Markovnikov step is flagged');
  // the atoms keep their places in the result (the end choice is not a move)
  for(const k of Object.keys(st.atoms)) assert.equal(anti.atoms[k].x, st.atoms[k].x);
});

test('arrow pusher v2: a push that cannot happen is rejected with its reason', () => {
  const s = apModel(), M = s.OchemArrowModel;
  const st = M.startOf('sn2-bromoethane');
  assert.equal(M.outcome(st, [{ from: 'c2', to: 'nucO' }]).err.code, 'no-lone-pair');
  assert.equal(M.outcome(st, [{ from: 'nucO', to: 'bond:c2-m1' }]).err.code, 'not-adjacent');
  assert.equal(M.outcome(st, [{ from: 'bond:c1-br', to: 'br' }]).kind, 'step', 'ionization alone is a legal step');
});

test('arrow pusher v2: "O⁻ leaving: poor" only where an oxide leaves a carbon on its own (review round 1)', () => {
  const s = apModel(), M = s.OchemArrowModel, A = s.OchemArrowChallenge;
  // the Claisen's second step: the tetrahedral intermediate collapses and ethoxide leaves (fine, no note)
  const c = A.CHALLENGES.find(x => x.id === 'claisen');
  let st = M.startOf(c.mol, false); st = M.stepTo(st, M.arrowsOf(c.steps[0]));
  const next = M.stepTo(st, M.arrowsOf(c.steps[1]));
  assert.ok(!M.plausibility(st, next).some(n => /O⁻ leaving/.test(n.short)), 'the Claisen collapse is flagged');
  // the acyl substitution pushed back (methoxide expelled as the C=O re-forms): fine too
  const ac = M.pathOf(M.MECHS.find(m => m.id === 'acetyl-chloride-nu'));
  const back = M.stepTo(ac[1].st, [{ from: 'o1', to: 'bond:c-o1' }, { from: 'bond:c-nuO', to: 'nuO' }]);
  assert.ok(!M.plausibility(ac[1].st, back).some(n => /O⁻ leaving/.test(n.short)), 'methoxide leaving a tetrahedral intermediate is flagged');
  // hydroxide leaving a saturated carbon on its own: flagged
  const eth = M.pathOf(M.MECHS[0])[1].st;
  const lost = M.stepTo(eth, [{ from: 'bond:c1-nucO', to: 'nucO' }]);
  assert.ok(M.plausibility(eth, lost).some(n => /O⁻ leaving/.test(n.short) && n.pill), 'hydroxide leaving on its own is not flagged');
});

test('arrow pusher v2: a hand drawn intermediate is used where molecules.js has one; a phone stacks two wide species', () => {
  const s = apModel(), M = s.OchemArrowModel, A = s.OchemArrowChallenge, Mol = s.OchemMolecules;
  const c = A.CHALLENGES.find(x => x.id === 'claisen'), st = M.startOf(c.mol, false), mid = M.stepTo(st, M.arrowsOf(c.steps[0]));
  const rec = Mol.get('claisen-tetrahedral').atoms, dx = mid.atoms.c2.x - rec.c2.x, dy = mid.atoms.c2.y - rec.c2.y;
  for (const k of Object.keys(rec)) { assert.ok(Math.abs(mid.atoms[k].x - rec[k].x - dx) < 0.01 && Math.abs(mid.atoms[k].y - rec[k].y - dy) < 0.01, `${k} is not where the hand drawing puts it`); }
  const wide = M.startOf('enolate-plus-ester', false), tall = M.startOf('enolate-plus-ester', true);
  const span = (x) => { const v = Object.values(x.atoms); return [Math.max(...v.map(a => a.x)) - Math.min(...v.map(a => a.x)), Math.max(...v.map(a => a.y)) - Math.min(...v.map(a => a.y))]; };
  assert.ok(span(tall)[0] < span(wide)[0] * 0.7 && span(tall)[1] > span(wide)[1], 'the phone layout is not stacked');
});

/* ====================================================================== */
/* 3D Molecule Viewer, tools v2 (docs/tools-v2-viewer-3d-brief.md): the cause line, the card, the arc and the R or S
   letters all read OchemViewer3DModel, so the model is what is checked. */
function viewerModel(){
  const s = browser({ OchemToolQuiz: { mount(){ return {}; }, shuffle: a => a, esc: x => String(x) }, OchemTools: null })
    .load(...CORE, 'ochem/assets/tools/viewer-3d.js');
  return { M: s.OchemViewer3DModel, LIB: s.OchemMol3DLibrary, M3: s.OchemMol3D };
}

test('viewer-3d v2: each tapped atom is named and explained from its electron groups', () => {
  const { M, LIB } = viewerModel();
  const line = (id, i) => { const m = LIB.get(id); return M.causeParts(M.readAtom(m, i == null ? m.focus : i)).map(x => x.t).join(' | '); };
  assert.equal(line('ammonia'), '3 bonds | 1 lone pair | 4 groups, sp³ | trigonal pyramidal 107°');
  assert.equal(line('water'), '2 bonds | 2 lone pairs | 4 groups, sp³ | bent 104.5°');
  assert.equal(line('methane'), '4 bonds | no lone pairs | 4 groups, sp³ | tetrahedral 109.5°');
  assert.equal(line('boron-trifluoride'), '3 bonds | no lone pairs | 3 groups, sp² | trigonal planar 120°');
  assert.equal(line('carbon-dioxide-3d'), '2 bonds | no lone pairs | 2 groups, sp | linear 180°');
  assert.equal(line('phosphorus-pentachloride'), '5 bonds | no lone pairs | 5 groups, sp³d | trigonal bipyramidal 90°');
  assert.equal(line('sulfur-hexafluoride'), '6 bonds | no lone pairs | 6 groups, sp³d² | octahedral 90°');
  // a double or triple bond is one group
  // ethene and formaldehyde carry their measured H–C–H (a double bond pushes a little harder)
  assert.equal(line('ethene'), '3 bonds | no lone pairs | 3 groups, sp² | trigonal planar 117.4°');
  assert.equal(line('formaldehyde-3d'), '3 bonds | no lone pairs | 3 groups, sp² | trigonal planar 116.5°');
  assert.equal(line('ethyne'), '2 bonds | no lone pairs | 2 groups, sp | linear 180°');
  // formamide's flat nitrogen: the pair is shared, never "no lone pairs"
  assert.equal(line('formamide'), '3 bonds | lone pair shared with C=O | 3 groups, sp² | trigonal planar ideal 120°');
  // the methyl cation and anion differ by one pair
  assert.equal(line('methyl-cation'), '3 bonds | no lone pairs | 3 groups, sp² | trigonal planar 120°');
  assert.equal(line('methyl-anion'), '3 bonds | 1 lone pair | 4 groups, sp³ | trigonal pyramidal ideal 109.5°');
  // review round 1: measured angles, not ammonia's copied; a model atom says "ideal"; a three membered ring says so
  assert.equal(line('hydronium'), '3 bonds | 1 lone pair | 4 groups, sp³ | trigonal pyramidal 113°');
  assert.equal(line('methanol', 1), '2 bonds | 2 lone pairs | 4 groups, sp³ | bent 108.5°');
  assert.equal(line('methanol', 0), '4 bonds | no lone pairs | 4 groups, sp³ | tetrahedral ideal 109.5°');
  assert.equal(line('cyclopropane-3d'), '4 bonds | no lone pairs | 4 groups, sp³ | tetrahedral, the ring squeezes it to 60°');
  assert.equal(line('ethane'), '4 bonds | no lone pairs | 4 groups, sp³ | tetrahedral ideal 109.5°');
  // recheck 1: formamide's carbon at its measured angles (smallest N–C–H 112.5°), dimethyl ether's C–O–C 111.7°
  assert.equal(line('formamide', 0), '3 bonds | no lone pairs | 3 groups, sp² | trigonal planar 112.5°');
  assert.equal(line('dimethyl-ether'), '2 bonds | 2 lone pairs | 4 groups, sp³ | bent 111.7°');
  for(const id of ['cyclohexane-chair-3d', 'cyclohexane-boat-3d']){
    const m = LIB.get(id);
    const all = m.atoms.map((a, i) => a.el === 'C' ? line(id, i) : null).filter(Boolean);
    assert.equal(all.length, 6, id);
    all.forEach(t => assert.equal(t, '4 bonds | no lone pairs | 4 groups, sp³ | tetrahedral ideal 109.5°', id));
  }
  // the label on the picture is the end of the line
  for(const m of LIB.ALL){
    const r = M.readAtom(m, m.focus);
    if(r.shape && r.angle !== null) assert.ok(M.causeParts(r).slice(-1)[0].t.endsWith(M.angleLabel(r)), m.id);
  }
  // an end atom has no shape of its own
  assert.equal(line('ammonia', 1), '1 bond | an end atom, no shape of its own');
  assert.equal(line('sulfur-hexafluoride', 1), '1 bond | 3 lone pairs | an end atom, no shape of its own');
  // every central atom the card names carries the VSEPR table's name
  for(const m of LIB.ALL){
    const r = M.readAtom(m, m.focus);
    if(r.shape) assert.equal(r.name, r.shape.m, m.id);
  }
});

test('viewer-3d v2: R or S read off the drawn frame agrees with the 3D configuration, and the mirror reads the other', () => {
  const { M, LIB, M3 } = viewerModel();
  const mol = LIB.get('chiral-carbon');
  const pr = M.priorities(mol, 0);
  assert.equal(pr.map(i => mol.atoms[i].el).join(' '), 'Br Cl F H');
  const cfg = M.config3D(mol, 0);
  assert.equal(cfg, 'S');
  // its mirror image (x -> -x) is the other one
  const mir = { atoms: mol.atoms.map(a => Object.assign({}, a, { pos: M3.v(-a.pos.x, a.pos.y, a.pos.z) })), bonds: mol.bonds };
  assert.equal(M.config3D(mir, 0), 'R');
  // "H to the back" really points it away
  const t = M.awayView(M3.sub(mol.atoms[pr[3]].pos, mol.atoms[0].pos));
  const h = M.rotate(M3.norm(M3.sub(mol.atoms[pr[3]].pos, mol.atoms[0].pos)), t.rx, t.ry);
  assert.ok(h.z < -0.999 && Math.abs(t.rx) <= 1.45, 'H to the back');
  // every orientation with the H within 35 degrees of straight back: the screen reading (y down) is the configuration
  let n = 0, seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for(let k = 0; k < 4000; k++){
    const rx = -1.45 + 2.9 * rnd(), ry = 6.283 * rnd();
    const hd = M.rotate(M3.norm(M3.sub(mol.atoms[pr[3]].pos, mol.atoms[0].pos)), rx, ry);
    if(-hd.z < M.BACK) continue;
    n++;
    for(const mirror of [null, 'x', 'y']){
      const P = pr.slice(0, 3).map(i => { const q = M.rotate(mol.atoms[i].pos, rx, ry, mirror); return [q.x, -q.y]; });
      const read = M.readTurn(P[0], P[1], P[2]) === 'cw' ? 'R' : 'S';
      assert.equal(read, mirror ? (cfg === 'R' ? 'S' : 'R') : cfg, `rx ${rx} ry ${ry} mirror ${mirror}`);
    }
  }
  assert.ok(n > 200, `only ${n} orientations had the H at the back`);
});
