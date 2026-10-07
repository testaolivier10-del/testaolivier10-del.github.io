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
  return errs;
}
