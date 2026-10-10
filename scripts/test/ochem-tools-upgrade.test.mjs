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

test('acid/base: every drawn acid parses, and every tappable proton site sits on an atom with that hydrogen', () => {
  const s = load(...CORE, 'ochem/assets/tools/acid-base.js');
  const A = s.OchemAcidBase;
  for(const a of A.ACIDS){
    const st = A.parseDrawn(A.DRAWN[a.id]);
    assert.ok(st, `${a.name} does not draw`);
    const q = Object.values(st.atoms).reduce((t, x) => t + (x.charge || 0), 0);
    assert.equal(q, /⁺$/.test(a.formula) ? 1 : 0, `${a.name}: drawn charge ${q}`);
  }
  for(const m of A.MULTI){
    const d = A.MULTI_DRAWN[m.id];
    assert.ok(d, `${m.id} has no drawing`);
    const st = A.parseDrawn(d.f);
    for(const [lbl, keys] of Object.entries(d.at)){
      assert.ok(m.sites.some(x => x.label === lbl), `${m.id}: "${lbl}" is not one of its sites`);
      for(const k of keys){
        const at = st.atoms[k];
        assert.ok(at, `${m.id}: no atom ${k}`);
        const h = at.hFixed ?? at.hImplicit ?? 0;
        assert.ok(h > 0, `${m.id}: ${lbl} points at ${at.el} ${k}, which has no hydrogen`);
        const el = /S/.test(lbl) ? 'S' : /NH|N/.test(lbl) ? 'N' : /C–H|CH/.test(lbl) ? 'C' : 'O';
        assert.equal(at.el, el, `${m.id}: ${lbl} points at ${at.el}`);
      }
    }
    // the most acidic site is always tappable, so the structure can be answered
    const first = m.sites.slice().sort((x, y) => x.pKa - y.pKa)[0];
    assert.ok(d.at[first.label], `${m.id}: the right answer (${first.label}) cannot be tapped`);
  }
});

test('spectroscopy: every tabulated signal lights hydrogens that add up to its integration', () => {
  const s = load(...CORE, 'ochem/assets/spectra-predict.js', 'ochem/assets/tools/spectroscopy.js');
  const S = s.OchemSpectroscopy;
  for(const c of S.COMPOUNDS){
    assert.ok(S.NMR_ATOMS[c.id], `${c.id} has no structure map`);
    const st = s.OchemBuilder.parse(S.NMR_ATOMS[c.id].f).st;
    const sig = S.NMR_ATOMS[c.id].sig;
    assert.equal(sig.length, c.nmr.length, `${c.id}: ${sig.length} mapped signals for ${c.nmr.length}`);
    // the drawn molecule is the compound
    assert.equal(s.OchemChem.formula(st), c.formula, `${c.id}: drawn ${s.OchemChem.formula(st)}`);
    const seen = {};
    c.nmr.forEach((x, i) => {
      const keys = sig[i];
      const h = keys.reduce((t, k) => { const a = st.atoms[k]; assert.ok(a, `${c.id}: no atom ${k}`); return t + (a.hFixed ?? a.hImplicit ?? 0); }, 0);
      keys.forEach(k => { seen[k] = (seen[k] || 0) + 1; });
      // Styrene's =CH₂ is two one-H signals on one carbon (cis and trans to the ring).
      if(c.id === 'styrene' && i < 2) assert.equal(h, 2);
      else assert.equal(h, x.h, `${c.id}: signal ${x.label} is ${x.h}H, its atoms carry ${h}`);
    });
    // every hydrogen-bearing atom belongs to some signal
    for(const [k, a] of Object.entries(st.atoms)){
      if((a.hFixed ?? a.hImplicit ?? 0) > 0) assert.ok(seen[k], `${c.id}: ${a.el} ${k} has hydrogens but no signal`);
    }
  }
});

test('spectroscopy: a predicted spectrum reports which atoms make each signal', () => {
  const s = load(...CORE, 'ochem/assets/spectra-predict.js');
  for(const f of ['CH3CH2OH', 'CH3COOCH2CH3', 'toluene', 'p-xylene', 'CH3CH(OH)CH3', 'cyclohexanone']){
    const st = s.OchemBuilder.parse(f).st;
    const sigs = s.OchemSpectra.predictNMR(st);
    for(const x of sigs){
      const h = x.keys.reduce((t, k) => t + (st.atoms[k].hFixed ?? st.atoms[k].hImplicit ?? 0), 0);
      assert.equal(h, x.h, `${f}: ${x.label} ${x.h}H but its atoms carry ${h}`);
    }
  }
});
