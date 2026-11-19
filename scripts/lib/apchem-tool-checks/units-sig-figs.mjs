/* Validator for chem/data/tools/units-sig-figs.json. 300 seeded items per
   context from ApChemMath.units.generate. Each item is a bank-format item
   (_shared.mjs question()); its answer is recomputed here from the numbers
   in its own stem; its significant figures are recomputed from the data by
   the multiply/divide or add/subtract rule; and the runtime grader
   (chem-questions.js, loaded in a sandbox) must mark the key, written to the
   item's significant figures with its unit, fully right and every authored
   mistake wrong on value. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { runtime, topicOk, SKILLS, LEVELS, POS_RE } from './_shared.mjs';
import { frame, SEEDS, seedOf } from './_drills.mjs';
import { ROOT } from '../apchem-build.mjs';

let Q = null;
function grader() {
  if (Q) return Q;
  const ctx = { document: { querySelector: () => null } }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(readFileSync(join(ROOT, 'chem', 'assets', 'chem-questions.js'), 'utf8'), ctx);
  return (Q = ctx.ApChemQuestions);
}
/* The bank item format (docs/apchem-architecture.md), as far as these items use it. */
function question(q, slug, map, errs, w) {
  if (!q.id || !q.id.startsWith(`${slug}:`) || q.id.split(':').length !== 3) errs.push(`${w}: id must be "${slug}:<context>:<item>"`);
  if (!topicOk(q.topic, map)) errs.push(`${w}: unknown topic "${q.topic}"`);
  if (!SKILLS.has(q.practice) || !LEVELS.includes(q.level) || ![1, 2, 3].includes(q.diff)) errs.push(`${w}: practice, level or diff is not valid`);
  if (!q.q || !q.why || !q.why.correct) errs.push(`${w}: stem and why.correct are required`);
  if (q.type === 'single') {
    if (q.options.length !== 4 || !(q.correct >= 0 && q.correct < 4)) errs.push(`${w}: a single item has 4 options and a key`);
    if (!q.why.options || q.why.options.length !== 4 || q.why.options.some(t => POS_RE.test(t))) errs.push(`${w}: one explanation per option, none naming a position`);
  } else if (q.type === 'numeric') {
    const N = q.numeric || {};
    if (!Number.isFinite(N.answer) || !(N.tol > 0) || (N.sigfigs == null && N.places == null)) errs.push(`${w}: numeric needs answer, tol and sigfigs or places`);
  } else errs.push(`${w}: type must be single or numeric`);
}
const KINDS = ['muldiv', 'addsub', 'gas', 'calorimetry', 'pH', 'rchoice'];
const nums = s => [...String(s).replace(/<[^>]+>/g, ' ').matchAll(/(\d+\.\d+|\d+)/g)].map(m => m[1]);
const sf = s => { const d = s.replace(/^0+/, ''); const dot = d.includes('.'); const all = d.replace('.', '').replace(/^0+/, ''); return dot ? all.length : all.replace(/0+$/, '').length; };
const dec = s => (s.includes('.') ? s.split('.')[1].length : 0);

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  const G = grader();
  frame(data, 'units-sig-figs', 'skill', map, errs);
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
  for (const c of data.contexts || []) {
    for (let i = 1; i <= SEEDS; i++) {
      const w = `context ${c.id} seed ${seedOf(i)}`, before = errs.length;
      let q;
      try { q = M.units.generate(M.rng(seedOf(i)), c).item; } catch (e) { errs.push(`${w}: ${e.message}`); break; }
      question(q, 'units-sig-figs', map, errs, w);
      if (q.type === 'single') {
        const unitP = /pressure in (\w+)/.exec(q.q)[1], want = { atm: 0, kPa: 1, torr: 2 }[unitP];
        if (q.correct !== want) errs.push(`${w}: the R for ${unitP} is keyed wrong`);
      } else {
        const N = q.numeric, x = nums(q.q);
        let ans, sig;
        if (c.kind === 'muldiv') { ans = +x[0] / +x[1]; sig = Math.min(sf(x[0]), sf(x[1])); }
        if (c.kind === 'addsub') { ans = +x[0] - +x[1]; sig = sf((+x[0] - +x[1]).toFixed(Math.min(dec(x[0]), dec(x[1])))); }
        if (c.kind === 'gas') { ans = (+x[1] * 0.08206 * (+x[2] + 273.15)) / +x[0]; sig = Math.min(sf(x[0]), sf(x[1])); }
        if (c.kind === 'calorimetry') { ans = -(+x[1] * 4.18 * +x[2]) / 1000 / +x[0]; sig = Math.min(sf(x[0]), sf(x[1]), sf(x[2]), 3); }
        if (c.kind === 'pH') { const m = /= ([\d.]+) × 10<sup>−(\d+)/.exec(q.q); ans = -Math.log10(+m[1] * 10 ** -+m[2]); sig = sf(m[1]); }
        if (Math.abs(ans - N.answer) > 1e-9 * Math.abs(ans)) errs.push(`${w}: answer ${N.answer}, the stem's numbers give ${ans}`);
        if ((N.sigfigs ?? N.places) !== sig) errs.push(`${w}: ${N.sigfigs != null ? 'sigfigs' : 'places'} is ${N.sigfigs ?? N.places}, the data support ${sig}`);
        const typed = N.places != null ? N.answer.toFixed(N.places) : G.formatKey({ answer: N.answer, sigfigs: N.sigfigs }).replace(' × 10^', 'e');
        const g = G.grade(q, N.askUnit ? { value: typed, unit: N.unit } : typed);
        if (!g.correct) errs.push(`${w}: the key typed as "${typed}" is not graded fully right`);
        for (const mk of N.mistakes) if (G.grade(q, N.askUnit ? { value: String(mk.value), unit: N.unit } : String(mk.value)).parts.value) errs.push(`${w}: mistake ${mk.value} is graded right on value`);
        if (N.askUnit && G.grade(q, { value: typed, unit: 'J' }).parts.unit) errs.push(`${w}: a wrong unit is accepted`);
      }
      if (errs.length > before) break;
    }
  }
  explore(data.explore, M, errs);
  return errs;
}

/* Explore (tools v2): the flask and its four factors, and the two instruments. Every factor must be a true
   equality (checked against the equation sheet values and the model's constants), every factor must cancel the
   unit before it in the right order, and the full chain must give the number of molecules in 250. mL of water;
   the reading model must give one more real digit with the finer marks. */
function explore(E, M, errs) {
  if (!E || !E.convert || !E.read) { errs.push('explore: convert and read are required'); return; }
  const C = E.convert, F = Object.fromEntries((C.factors || []).map(f => [f.id, f]));
  if (C.start.sf !== sf(C.start.v.replace(/\.$/, '.0').replace(/\.0$/, '.'))) errs.push('explore: the start\'s sf does not match how it is written');
  const truth = { L: 1 / 1000, g: 1.00, mol: 1 / 18.02, n: 6.022e23 };
  for (const [id, want] of Object.entries(truth)) {
    const f = F[id];
    if (!f) { errs.push(`explore: factor ${id} is missing`); continue; }
    const v = +f.top[0] / +f.bot[0];
    if (Math.abs(v - want) > 1e-9 * Math.abs(want)) errs.push(`explore: factor ${id} is ${v}, should be ${want}`);
    if (!f.name || !f.why) errs.push(`explore: factor ${id} needs a name and where it comes from`);
  }
  const mm = 2 * 1.008 + 16.00;
  if (Math.abs(mm - 18.02) > 0.005) errs.push('explore: the molar mass of water is not 18.02 g/mol');
  const ord = ['g', 'mol', 'n'].map(id => ({ top: F[id].top, bot: F[id].bot, sf: F[id].sf }));
  const r = M.units.chain(C.start, ord);
  if (r.unit !== 'molecules' || r.pairs.length !== 3) errs.push(`explore: the chain mL to molecules leaves ${r.unit}`);
  if (Math.abs(r.value - 250 / 18.02 * 6.022e23) > 1e15) errs.push('explore: the chain value is wrong');
  if (r.sf !== 3) errs.push('explore: the chain should keep 3 significant figures (250. mL and 1.00 g/mL)');
  if (M.units.chain(C.start, [{ ...ord[0], flip: true }]).pairs.length) errs.push('explore: a flipped factor must cancel nothing');
  const R = E.read, ins = Object.fromEntries((R.instruments || []).map(x => [x.id, x]));
  if (!ins.cylinder || !ins.coarse || ins.cylinder.every !== 1 || ins.coarse.every !== 10) errs.push('explore: two graduated cylinders, one with 1 mL marks and one with 10 mL marks, are expected');
  else {
    if (!(R.min >= 2 && R.max <= Math.min(ins.cylinder.cap, ins.coarse.cap) && R.value >= R.min && R.value <= R.max)) errs.push('explore: the water range must fit both vessels');
    for (let v = 10.5; v <= R.max + 1e-9; v += 0.1) {
      const a = M.units.read(v, ins.cylinder), b = M.units.read(v, ins.coarse);
      if (a.sf - b.sf !== 1 || Math.abs(a.value - v) > 0.05 + 1e-9 || Math.abs(b.value - v) > 0.5 + 1e-9) { errs.push(`explore: the reading at ${v.toFixed(1)} mL is wrong`); break; }
    }
  }
}
