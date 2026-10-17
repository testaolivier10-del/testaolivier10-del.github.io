/* Validator for statistics/data/tools/design-randomizer.json (Design
   randomizer), run by scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. The frame; the explore scenes (units, two
   blocks of equal size, pairs inside one block, every design giving equal
   groups, block and pair designs exactly balanced); the contexts (every
   field the problems use, an even N, a blinding kind that exists); then 300
   problems per context and type through the page's own generator, each key
   recomputed here from the problem itself: the design named matches the
   procedure the text describes, a scope answer follows from whether the
   text says random sampling and random assignment, the explanatory and
   response keys are the context's, a blinding key is the authored kind, and
   the random assignment steps name N and N / 2. Student-facing text has no
   em or en dashes and no hyphen used as punctuation. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const DASH = /[—–]|\s-\s/;
function texts(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => texts(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'about') texts(x, out);
  return out;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export function check(data, map) {
  const errs = [];
  frame(data, 'design-randomizer', 'simulator', map, errs);
  const { M, model } = runtime('design-randomizer');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/design-randomizer.js does not register ApStatMath.designRandomizer with a generate()'); return errs; }
  for (const t of texts(data)) if (DASH.test(t)) errs.push(`a dash used as punctuation: "${t.slice(0, 60)}…"`);

  for (const sc of (data.explore && data.explore.scenes) || []) {
    const w = `scene ${sc.id}`;
    for (const k of ['name', 'unit', 'units', 'response', 'unitOf', 'tA', 'tB', 'blockWhy', 'pairWhy', 'noneWhy']) if (!sc[k]) errs.push(`${w}: "${k}" is required`);
    if (!['plants', 'people'].includes(sc.kind)) errs.push(`${w}: kind must be plants or people`);
    if (sc.placebo && !sc.blindWhy) errs.push(`${w}: a placebo effect needs blindWhy`);
    if (!(sc.effect > 0)) errs.push(`${w}: the true effect must be positive`);
    if (sc.cols % 2) errs.push(`${w}: an odd number of columns cannot form pairs`);
    let U;
    try { U = model.units(sc); } catch (e) { errs.push(`${w}: ${e.message}`); continue; }
    const nb = U.filter(u => u.block === 1).length;
    if (nb * 2 !== U.length) errs.push(`${w}: the two blocks are not the same size`);
    const pairs = {};
    for (const u of U) (pairs[u.pair] = pairs[u.pair] || []).push(u);
    for (const p of Object.values(pairs)) if (p.length !== 2 || p[0].block !== p[1].block) errs.push(`${w}: pair ${p[0].pair} is not two units of one block`);
    for (const d of model.DESIGNS) {
      const tr = model.assign(M.rng(9), U, d, sc), a = tr.filter(t => t === 'A').length;
      if (a * 2 !== U.length) errs.push(`${w}: ${d} gives ${a} of ${U.length} treatment A`);
      const res = model.run(M.rng(9), U, tr, sc, {});
      const mA = U.filter(u => tr[u.i] === 'A').reduce((s, u) => s + res.y[u.i], 0) / a, mB = U.filter(u => tr[u.i] === 'B').reduce((s, u) => s + res.y[u.i], 0) / (U.length - a);
      if (Math.abs(res.diff - (mA - mB)) > 1e-9) errs.push(`${w}: ${d}: the estimate is not mean A minus mean B`);
      if ((d === 'block' || d === 'pairs') && res.bal.A !== res.bal.B) errs.push(`${w}: ${d} is not balanced on the other variable`);
    }
  }

  for (const c of data.contexts || []) {
    const w = `context ${c.id}`;
    for (const k of ['lead', 'units', 'unit', 'tA', 'tB', 'measure', 'explanatory', 'response', 'blockVar', 'blockWhy', 'pairsHow', 'lurk', 'population', 'obs', 'obsWhy', 'sampleRandom', 'sampleVol', 'selfSelect']) if (!c[k]) errs.push(`${w}: "${k}" is required`);
    if (!c.N || c.N % 2) errs.push(`${w}: N must be even`);
    if (!Array.isArray(c.blocks) || c.blocks.length < 2) errs.push(`${w}: name at least two blocks`);
    if (c.blind && !['single', 'double'].includes(c.blind.kind)) errs.push(`${w}: blind.kind must be single or double`);
    if (c.selfPairs && (c.types || []).includes('procedure')) errs.push(`${w}: a self-paired study has no two-group procedure`);
  }
  if (errs.length) return errs;

  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const plain = p.text.replace(/<[^>]+>/g, '');
    const step = k => p.steps.find(s => s.key === k), right = s => s.options[s.correct];
    if (p.type === 'design') {
      const looks = c.selfPairs && plain.includes(c.selfPairs) ? 'pairs' : /into \d+ pairs/.test(plain) ? 'pairs' : /first separate/.test(plain) ? 'block' : /randomly assign \d+ of the/.test(plain) ? 'cr' : plain.includes(c.obs) ? 'obs' : '?';
      if (right(step('design')) !== model.D_NAME[looks]) errs.push(`${w}: the text reads as ${looks}, the key is "${right(step('design'))}"`);
    }
    if (p.type === 'scope') {
      const sampled = plain.includes(c.sampleRandom), assigned = !plain.includes(c.selfSelect);
      if (/^Yes, because the treatments were randomly assigned/.test(right(step('cause'))) !== assigned) errs.push(`${w}: cause and effect key does not follow the assignment`);
      if ((right(step('generalize')) === `To all ${c.population}`) !== sampled) errs.push(`${w}: generalize key does not follow the sampling`);
    }
    if (p.type === 'variables') {
      if (right(step('explanatory')) !== cap(c.explanatory)) errs.push(`${w}: explanatory key`);
      if (right(step('response')) !== cap(c.response)) errs.push(`${w}: response key`);
      if (right(step('units')) !== `The ${c.N} ${c.units}`) errs.push(`${w}: units key`);
    }
    if (p.type === 'procedure') {
      if (!right(step('label')).includes(`from 1 to ${c.N}.`)) errs.push(`${w}: label key`);
      if (!right(step('generate')).includes(`${c.N / 2} different integers from 1 to ${c.N}`)) errs.push(`${w}: generate key`);
      if (!right(step('assign')).includes(`the other ${c.N / 2} get`)) errs.push(`${w}: assign key`);
    }
    if (p.type === 'confound') {
      if (step('confound') && right(step('confound')) !== cap(c.lurk)) errs.push(`${w}: confounding key`);
      if (step('blind') && right(step('blind')).toLowerCase() !== `${c.blind.kind} blind`) errs.push(`${w}: blinding key`);
      if (!step('confound') && !step('blind')) errs.push(`${w}: a confound problem with no step`);
    }
  }, c => c.types || model.TYPES);
  return errs;
}
