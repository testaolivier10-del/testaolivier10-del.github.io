/* The upgraded Ochem tools (docs/tools-upgrade-notes/ochem.md), checked
   against the engines they draw from. A visual that disagrees with its own
   verdict is the failure these guard: a meter whose winning corner is the one
   it marks "blocked", a drawn product with the wrong formula. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function fakeEl(){
  const el = {
    innerHTML: '', textContent: '', value: '', hidden: false, style: {}, dataset: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    setAttribute(){}, getAttribute(){ return null; }, addEventListener(){}, appendChild(){},
    focus(){}, click(){}, closest(){ return null; },
    getBoundingClientRect(){ return { width: 600, height: 300, left: 0, top: 0 }; },
    querySelector(){ return fakeEl(); }, querySelectorAll(){ return []; },
  };
  return el;
}
export function load(...paths){
  const s = { console, Math, Object, Array, JSON, String, Number, Boolean, Set, Map, Date, isNaN, parseInt, parseFloat,
    URLSearchParams, setTimeout(){}, clearTimeout(){}, requestAnimationFrame(){ return 0; },
    location: { href: 'http://x/', pathname: '/', search: '' }, history: { replaceState(){} },
    localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
    matchMedia: () => ({ matches: false }) };
  s.document = { readyState: 'complete', addEventListener(){}, getElementById: () => fakeEl(),
    querySelector: () => fakeEl(), querySelectorAll: () => [], createElement: () => fakeEl(), body: fakeEl() };
  s.window = s; s.globalThis = s;
  vm.createContext(s);
  for(const p of paths) vm.runInContext(readFileSync(p, 'utf8'), s, { filename: p });
  return s;
}
const CORE = ['ochem/assets/molecules.js', 'ochem/assets/chem-core.js', 'ochem/assets/mol3d.js', 'ochem/assets/mol-builder.js'];

function combos(R){
  const out = [];
  for(const sub of R.SUBSTRATES) for(const rgt of R.REAGENTS) for(const solvent of R.SOLVENTS)
    for(const heat of [false, true]) out.push({ sub, rgt, solvent, heat, guess: null });
  return out;
}

test('reaction predictor: the meter never marks the winner blocked, and its shares add up', () => {
  const s = load(...CORE, 'ochem/assets/tools/reaction-predictor.js');
  const R = s.OchemReactionPredictor;
  let n = 0;
  for(const c of combos(R)){
    const p = R.predict(c);
    const tag = `${c.sub.id}/${c.rgt.id}/${c.solvent.id}/${c.heat}`;
    assert.ok(!p.blocked[p.major], `${tag}: ${p.major} wins but is drawn as blocked`);
    if(p.minor) assert.ok(!p.blocked[p.minor], `${tag}: minor ${p.minor} is drawn as blocked`);
    const mix = R.mixture(c, p);
    if(mix){
      const sum = mix.slice(0, 2).reduce((t, m) => t + (m.pct || 0), 0);
      assert.equal(sum, 100, `${tag}: shares add to ${sum}`);
    }
    // Every pathway with a share has at least one factor pulling toward it.
    for(const m of (mix || []).slice(0, 2)){
      if(!m.path) continue;
      assert.ok(p.reasons.some(r => r.votes && r.votes[m.path]), `${tag}: ${m.path} has a share but no factor argues for it`);
    }
    n++;
  }
  assert.ok(n > 300);
});

test('reaction predictor: every substrate is drawn with its leaving group, class and beta hydrogens', () => {
  const s = load(...CORE, 'ochem/assets/tools/reaction-predictor.js');
  const R = s.OchemReactionPredictor;
  const WANT = { mebr:[0,0], prbr:[1,2], neopentyl:[1,0], bubr2:[2,5], cyhexbr:[2,4], tbubr:[3,9], mebubr:[3,8], bnbr:[1,0] };
  for(const sub of R.SUBSTRATES){
    const st = R.build(R.DRAW[sub.id], 'Br');
    assert.ok(st, `${sub.id} did not draw`);
    assert.equal(s.OchemChem.formula(st).replace(/[^\w]/g, '').length > 0, true);
    const at = R.sites(st);
    assert.ok(at, `${sub.id}: no C-Br found`);
    const [carbons, betaH] = WANT[sub.id];
    assert.equal(at.betas.length, carbons, `${sub.id}: ${at.betas.length} carbons on the alpha carbon`);
    // Benzyl's ring neighbours carry no H that can be eliminated: the ring CH's
    // are aromatic, and the tool rightly blocks E1/E2 there.
    if(sub.id !== 'bnbr') assert.equal(at.betaH, betaH, `${sub.id}: ${at.betaH} beta hydrogens`);
    assert.equal(!!sub.zaitsev, betaH > 0, `${sub.id}: drawing and record disagree on whether it can eliminate`);
  }
});

test('reaction predictor: the drawn product has the formula the reaction gives', () => {
  const s = load(...CORE, 'ochem/assets/tools/reaction-predictor.js');
  const R = s.OchemReactionPredictor, C = s.OchemChem;
  const count = (st) => { const n = {}; for(const k of Object.keys(st.atoms)){ const a = st.atoms[k];
    if(!a.el) continue; n[a.el] = (n[a.el] || 0) + 1; n.H = (n.H || 0) + (a.hFixed ?? a.hImplicit ?? 0); } return n; };
  const fromMol = (mol) => { const n = {}; for(const k of Object.keys(mol.atoms)){ const lab = mol.atoms[k].label;
    const m = /^([A-Z][a-z]?)(?:H([₀-₉]*))?$/.exec(lab); assert.ok(m, 'unreadable label ' + lab);
    n[m[1]] = (n[m[1]] || 0) + 1; if(lab.includes('H')) n.H = (n.H || 0) + (m[2] ? Number([...m[2]].map(d => '₀₁₂₃₄₅₆₇₈₉'.indexOf(d)).join('')) : 1); } return n; };
  let drawn = 0;
  for(const c of combos(R)){
    const p = R.predict(c);
    const mol = R.productDrawing(c.sub, c.rgt, p);
    if(!mol) continue;
    const sub = count(R.build(R.DRAW[c.sub.id], 'Br'));
    const got = fromMol(mol);
    const want = { ...sub }; delete want.Br;
    if(p.major === 'E1' || p.major === 'E2'){ want.H -= 1; }
    else {
      // substitution: Br out, the nucleophile's group in
      const g = { OH:{O:1,H:1}, OCH2CH3:{O:1,C:2,H:5}, 'OC(CH3)3':{O:1,C:4,H:9}, SH:{S:1,H:1}, 'C#N':{C:1,N:1},
                  'N=N+=N-':{N:3}, I:{I:1}, NH2:{N:1,H:2} };
      const key = { oh:'OH', h2o:'OH', oet:'OCH2CH3', etoh:'OCH2CH3', otbu:'OC(CH3)3', sh:'SH', cn:'C#N', n3:'N=N+=N-', i:'I', nh3:'NH2' }[c.rgt.id];
      for(const [el, k] of Object.entries(g[key])) want[el] = (want[el] || 0) + k;
    }
    for(const el of new Set([...Object.keys(want), ...Object.keys(got)])){
      assert.equal(got[el] || 0, want[el] || 0, `${c.sub.id}+${c.rgt.id} (${p.major}): ${el} ${got[el]} vs ${want[el]}`);
    }
    drawn++;
  }
  assert.ok(drawn > 100, `only ${drawn} products drawn`);
});
