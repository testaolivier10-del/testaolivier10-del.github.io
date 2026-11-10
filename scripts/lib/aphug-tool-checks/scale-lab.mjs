/* Validator for human-geography/data/tools/scale-lab.json (Scale lab), run by
   scripts/check-aphug-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems: the frame; each context's fields (a chain
   names a cause and an effect at two different scales, a link with three
   wrong sentences that each say why; limit questions each with a scale, the
   unit and the ground covered); no em dash anywhere; then 300 drills per
   context and type regenerated with the model the page runs
   (ApHugMath.scaleLab), each key recomputed here independently:
     identify  the unit and scale from the case's data unit, never the map's
               extent; every map passes ApHugMap.check on its base
     across    the gap (highest minus lowest province), the national figure
               (provinces weighted by people), the question for the asked scale
     chain     the cause's and effect's scales from the data file, the link
     limit     need and have from the question and source, the limitation by
               rule (units too big, or too little ground covered)
     mapscale  map cm x denominator / 100,000 = km; the larger-scale map is the
               smaller denominator
   and the Explore views (four scales, their maps) for 50 data sets. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';
import { ROOT } from '../aphug-build.mjs';

export const TYPES = ['identify', 'across', 'chain', 'limit', 'mapscale'];
const SCALES = ['global', 'regional', 'national', 'local'];
const EMDASH = /—/;
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s.options[s.correct];

let BASES = null;
export function bases() {
  if (BASES) return BASES;
  const { model } = runtime('scale-lab');
  BASES = {};
  for (const id of ['world', 'country-a', ...model.REGION_BASES]) BASES[id] = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'figures', 'base', `${id}.json`), 'utf8'));
  return BASES;
}

function contextProblems(c, errs) {
  const w = `context ${c.id}`, need = (ok, m) => { if (!ok) errs.push(`${w}: ${m}`); };
  need(Array.isArray(c.types) && c.types.length && c.types.every(t => TYPES.includes(t)), `types must list kinds from ${TYPES.join(', ')}`);
  if ((c.types || []).includes('chain')) {
    const ch = c.chain || {};
    need(typeof ch.setup === 'string' && ch.setup.length > 60, 'chain.setup (the case, with a place and a date)');
    need(/\b(1[89]|20)\d\ds?\b/.test(ch.setup || ''), 'chain.setup dates the case (accuracy-risks.md rule 1)');
    for (const k of ['cause', 'effect']) need(ch[k] && ch[k].text && SCALES.includes(ch[k].scale) && ch[k].unit, `chain.${k}: text, scale and unit`);
    need(ch.cause && ch.effect && ch.cause.scale !== ch.effect.scale, 'the cause and the effect are at different scales');
    need(typeof ch.link === 'string' && /\b(so|because|which)\b/.test(ch.link), 'chain.link states its links (so, because)');
    need(typeof ch.linkWhy === 'string' && ch.linkWhy.length > 20, 'chain.linkWhy');
    need(Array.isArray(ch.wrong) && ch.wrong.length === 3 && ch.wrong.every(x => x.text && x.why && x.why.length > 20), 'three wrong links, each with why');
  }
  if ((c.types || []).includes('limit')) {
    need(Array.isArray(c.questions) && c.questions.length >= 3, 'three or more questions');
    for (const q of c.questions || []) need(q.text && /\?$/.test(q.text) && SCALES.includes(q.scale) && q.unit && Number.isInteger(q.cover), `question "${q.text}": text ending in ?, scale, unit and cover`);
  }
}

function recheck(p, c, w, errs) {
  const { Map, Calc, model } = runtime('scale-lab');
  const B = bases();
  const bad = m => errs.push(`${w}: ${m}`);
  if (p.type === 'identify') {
    const cs = model.CASES.find(x => x.id === p.case);
    if (!cs) return bad(`unknown case ${p.case}`);
    const pr = Map.check(p.map, B[p.map.base]);
    if (pr.length) bad(`map: ${pr.join('; ')}`);
    if (!p.map.invented) bad('a drill map is invented data');
    // The data unit decides the scale, recomputed from the map itself: one
    // shade per region, per country, per province or none.
    const vals = p.map.values || {}, base = B[p.map.base];
    let data;
    if (p.map.render === 'reference') data = 'global';
    else if (p.map.base === 'country-a') data = new Set(Object.values(vals)).size === 1 && (p.map.marks || []).length === 1 ? 'national' : 'local';
    else if (p.map.disputedOk) data = 'regional';
    else data = 'national';
    if (data !== cs.data || data !== p.data) bad(`the data are ${data}, the key says ${p.data}`);
    if (p.map.base === 'country-a' && data === 'local' && (p.map.marks || []).length !== 8) bad('a province map labels all eight provinces');
    if (data === 'regional') for (const f of base.features) { if (f.r && vals[f.id] == null) bad(`regional map: ${f.id} has no shade`); }
    if (data === 'national' && p.map.base !== 'country-a') for (const f of base.features) if (f.disputed && vals[f.id] != null) bad(`by-country map: disputed ${f.id} has a value`);
    if (SCALES[stepOf(p, 'unit').correct] !== data) bad('unit step key');
    if (right(stepOf(p, 'scale')) !== model.SCALE_NAME[data]) bad('scale step key');
  } else if (p.type === 'across') {
    const pv = p.ds.provinces, xs = pv.map(q => q.value);
    const gap = Math.max(...xs) - Math.min(...xs);
    if (!close(stepOf(p, 'gap').cell.answer, gap)) bad(`gap ${stepOf(p, 'gap').cell.answer}, recomputed ${gap}`);
    let wsum = 0, psum = 0; for (const q of pv) { wsum += q.value * q.pop; psum += q.pop; }
    if (!close(p.ds.national, wsum / psum)) bad('national figure is not the population-weighted mean');
    if (p.national !== Math.round(wsum / psum)) bad('national figure as shown');
    if (stepOf(p, 'hide').correct !== 0 || !/averages/.test(right(stepOf(p, 'hide')))) bad('hide step key');
    const wh = stepOf(p, 'which'), asked = SCALES.find(s => new RegExp(`needs ${model.SCALE_WORD[s].replace(/[()]/g, '\\$&')} data`).test(wh.label));
    if (!asked || SCALES[wh.correct] !== asked) bad('which step key');
    if (p.table.rows.length !== 8) bad('table has every province');
  } else if (p.type === 'chain') {
    const ch = c.chain;
    if (SCALES[stepOf(p, 'from').correct] !== ch.cause.scale) bad('from key');
    if (SCALES[stepOf(p, 'to').correct] !== ch.effect.scale) bad('to key');
    if (right(stepOf(p, 'link')) !== ch.link) bad('link key');
  } else if (p.type === 'limit') {
    const q = c.questions.find(x => p.text.includes(x.text)), src = model.SOURCES.find(s => s.id === p.source);
    if (!q || !src) return bad('question or source not found');
    if (src.scale === q.scale) bad('a source at the question\'s own scale');
    const coarse = SCALES.indexOf(src.scale) < SCALES.indexOf(q.scale), partial = src.cover < q.cover;
    if (coarse === partial) bad('the source misfits in both ways or neither');
    if (SCALES[stepOf(p, 'need').correct] !== q.scale) bad('need key');
    if (SCALES[stepOf(p, 'have').correct] !== src.scale) bad('have key');
    if (right(stepOf(p, 'limit')) !== (coarse ? model.LIMIT.coarse : model.LIMIT.fine)) bad('limit key');
  } else if (p.type === 'mapscale') {
    const km = p.cm * p.denom / 100000;
    if (!close(stepOf(p, 'ground').cell.answer, km)) bad(`ground ${stepOf(p, 'ground').cell.answer}, recomputed ${km}`);
    if (!close(Calc.evaluate({ fn: 'mapToGround', args: [p.cm, p.denom] }), km)) bad('ApHugCalc.mapToGround disagrees');
    const larger = p.m1 < p.m2 ? 0 : 1;
    if (stepOf(p, 'larger').correct !== larger) bad('larger key');
    const d = stepOf(p, 'detail'), wantsDetail = /streets/.test(d.label);
    if (d.correct !== (wantsDetail ? larger : 1 - larger)) bad('detail key');
  } else bad(`unknown type ${p.type}`);
  for (const s of p.steps) if (s.kind === 'choice') for (const x of [s.label, ...s.options, ...s.why]) if (EMDASH.test(x)) bad(`step ${s.key}: an em dash`);
}

/* Explore: four views for many data sets, every map legible. */
function exploreProblems(errs) {
  const { M, Map, model } = runtime('scale-lab'), B = bases();
  for (let i = 1; i <= 50; i++) {
    const ds = model.dataset(M.rng(i * 101 + 7), i % 2 ? 'walk' : undefined), vs = model.views(ds);
    if (vs.map(v => v.scale).join() !== SCALES.join()) { errs.push('explore: the four views in order'); break; }
    for (const v of vs) {
      const spec = v.spec || model.regionalSpec(B.world, ds), pr = Map.check(spec, B[spec.base]);
      if (pr.length) { errs.push(`explore data set ${i} ${v.scale}: ${pr.join('; ')}`); return; }
    }
    if (!(vs[3].range > 0 && vs[1].range >= 35)) errs.push(`explore data set ${i}: the pattern does not change across scales`);
  }
  const lad = model.ladder();
  lad.forEach((l, k) => { if (!close(l.kmPerCm, l.denom / 100000)) errs.push(`ladder ${l.denom}: km per cm`); if (k && l.denom <= lad[k - 1].denom) errs.push('ladder order'); });
}

export function check(data, map) {
  const errs = [];
  frame(data, 'scale-lab', 'simulator', map, errs);
  if (EMDASH.test(JSON.stringify(data))) errs.push('an em dash in the data file (use a colon, a comma or two sentences)');
  for (const c of data.contexts || []) contextProblems(c, errs);
  if (errs.length) return errs;
  const { model } = runtime('scale-lab');
  for (const t of TYPES) if (!(data.contexts || []).some(c => c.types.includes(t))) errs.push(`no context for type ${t}`);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t, bases()), (p, c, w) => recheck(p, c, w, errs), c => c.types);
  exploreProblems(errs);
  return errs;
}
export { recheck };
