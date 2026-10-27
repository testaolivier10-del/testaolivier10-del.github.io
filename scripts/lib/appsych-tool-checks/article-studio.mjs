/* Validator for psychology/data/tools/article-studio.json (Article Analysis Studio), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems: the frame; each study's fields (a known
   method, two or more safeguards the summary describes and two or more it
   does not, a population and a participant trait for part E, the measure in
   the method's own words for part B); no em dash anywhere; then 300 drills
   per context and type regenerated with the model the page runs
   (ApPsychMath.articleStudio), each key recomputed independently:
     A  the method's name from the study's own design field
     C  the difference of the means with ApPsychStats (never the model), the
        higher group read off the means, r recomputed from the plotted points
        and its sign and size checked against the result the study ran
     D  the keyed safeguard is one the summary describes; every distractor
        safeguard is one it does not
     E  the keyed verdict is the study's own for that population
     F  supports / does not support / refutes, from the means and the
        significance (or r) read independently. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['full', 'design', 'results', 'ethics'];
const METHOD = { experiment: 'An experiment', correlational: 'A correlational study', naturalistic: 'Naturalistic observation', case: 'A case study', survey: 'A survey', meta: 'A meta-analysis' };
const GUIDES = { consent: 'Informed consent', parent: 'Parental consent', assent: 'Informed assent', withdraw: 'The right to withdraw', confidential: 'Confidentiality', debrief: 'Debriefing', irb: 'Review by an institutional review board', harm: 'Protection from harm' };
const VERDICT = { yes: 'Yes', no: 'No', partly: 'Partly' };
const EMDASH = /—/;

const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s.options[s.correct];

function contextProblems(c, errs) {
  const w = `context ${c.id}`;
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  need(c.kind === 'means' || c.kind === 'r', 'kind must be "means" or "r"');
  need(!c.variants || (Array.isArray(c.variants) && c.variants.length && c.variants.every(v => ['support', 'null', 'reverse'].includes(v))), 'variants: some of support, null, reverse');
  need(METHOD[c.method], `method "${c.method}" is not one of ${Object.keys(METHOD).join(', ')}`);
  need(c.kind !== 'r' || c.method === 'correlational', 'a study reported with r is correlational');
  need(c.method !== 'experiment' || /random/i.test(c.design), 'an experiment says in its design that participants were randomly assigned');
  for (const k of ['title', 'methodWhy', 'iv', 'ivWhat', 'intro', 'hypothesis', 'concept', 'design', 'procedure', 'flaw']) need(typeof c[k] === 'string' && c[k].trim(), `"${k}" is required`);
  const P = c.participants || {};
  need(Number.isInteger(P.n) && P.n >= 20, 'participants.n must be a whole number of at least 20');
  need(Array.isArray(P.table) && P.table.length >= 2 && P.table.every(r => Array.isArray(r) && r.length === 2), 'participants.table: two or more [label, value] rows');
  need(typeof P.html === 'string' && /\d/.test(P.html), 'participants.html names who took part, with ages');
  const dv = c.dv || {};
  for (const k of ['name', 'what', 'how', 'howNear', 'vague', 'near', 'sentence']) need(typeof dv[k] === 'string' && dv[k].trim(), `dv.${k} is required`);
  need(dv.how !== dv.howNear && dv.what !== dv.near, 'the dv distractors must differ from the key');
  if (c.kind === 'means') {
    need(Array.isArray(c.groups) && c.groups.length >= 2 && c.groups.length <= 3, 'two or three groups');
    need(Array.isArray(c.predict) && c.predict.length === 2 && c.predict[0] !== c.predict[1] && c.predict.every(i => i >= 0 && i < (c.groups || []).length), 'predict: [higher group, lower group] indices');
    for (const k of ['res', 'more', 'axis']) need(typeof dv[k] === 'string', `dv.${k} is required`);
    need(/\{g\}/.test(dv.res || '') && /\{m\}/.test(dv.res || ''), 'dv.res has {g} and {m}');
    for (const k of ['base', 'gap', 'nullGap']) need(Array.isArray(dv[k]) && dv[k].length === 2 && dv[k][0] <= dv[k][1], `dv.${k}: [low, high]`);
    if (dv.gap && dv.nullGap) need(dv.nullGap[1] < dv.gap[0], 'the null gap must be smaller than the real gap');
    if (dv.max && dv.base && dv.gap) need(dv.base[1] + dv.gap[1] <= dv.max, 'means could pass the scale maximum');
  } else {
    for (const ax of ['x', 'y']) { const a = c[ax] || {}; need(Array.isArray(a.range) && a.range[0] < a.range[1] && a.name && a.axis, `${ax}: name, axis and range`); }
    need(c.direction === 1 || c.direction === -1, 'direction is 1 or -1');
    need(c.y && c.y.up && c.y.down && c.x && c.x.more, 'x.more, y.up and y.down are required');
  }
  const has = new Set((c.ethics || []).map(e => e.g));
  need(Array.isArray(c.ethics) && c.ethics.length >= 2, 'two or more safeguards the summary describes (spec: the AAQ study.ethics)');
  for (const e of c.ethics || []) need(GUIDES[e.g] && typeof e.how === 'string' && e.how.length > 20, `ethics "${e.g}": a known guideline and how it was applied`);
  need(Array.isArray(c.ethicsAbsent) && c.ethicsAbsent.length >= 2, 'two or more safeguards the summary does not describe (distractors)');
  for (const g of c.ethicsAbsent || []) { need(GUIDES[g], `ethicsAbsent "${g}" is not a guideline`); need(!has.has(g), `"${g}" is both described and absent`); }
  need(Array.isArray(c.generalize) && c.generalize.length >= 1, 'generalize: one or more populations');
  for (const g of c.generalize || []) need(VERDICT[g.key] && g.pop && g.because && !/\b(sample size|only \d+|too few|small sample)\b/i.test(g.because), `generalize "${g.pop}": a verdict argued from participant traits, not sample size`);
  const walk = (v, path) => {
    if (typeof v === 'string') { if (EMDASH.test(v)) errs.push(`${w}: ${path} has an em dash`); return; }
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(c, '');
}

export function recheck(p, c, w, errs) {
  const { Stats } = runtime('article-studio');
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const g = p.given, st = p.study;
  need(g.kind === c.kind, 'the study kind is the context\'s');
  need(!c.variants || c.variants.includes(g.variant), `result "${g.variant}" is not one this context allows`);
  // The variant from the numbers alone.
  let verdict;
  if (c.kind === 'means') {
    need(g.means.length === c.groups.length && g.hi === c.predict[0] && g.lo === c.predict[1], 'means and the compared groups match the context');
    const diff = Stats.evaluate({ fn: 'abs', args: [{ fn: 'sub', args: [g.means[g.hi], g.means[g.lo]] }] });
    const up = g.means[g.hi] > g.means[g.lo];
    if (c.dv.max) need(g.means.every(m => m >= 0 && m <= c.dv.max), 'a mean is off the scale');
    if (g.variant === 'null') { need(!st.sig, 'a null result is not significant'); need(diff <= c.dv.nullGap[1] + 1e-9, `null difference ${diff} is larger than the null gap`); verdict = 'Does not support'; }
    else { need(st.sig, 'a real difference is reported as significant'); need(diff >= c.dv.gap[0] - 1e-9, `difference ${diff} is smaller than the real gap`); need(up === (g.variant === 'support'), `the higher group does not match the "${g.variant}" result`); verdict = g.variant === 'support' ? 'Supports' : 'Refutes'; }
    const sd = stepOf(p, 'diff');
    if (sd) need(close(sd.cell.answer, diff, 1e-9, 1e-9), `diff key ${sd.cell.answer} is not ${diff}`);
    const ss = stepOf(p, 'stat');
    if (ss) {
      const k = right(ss), higher = up ? c.groups[g.hi].name : c.groups[g.lo].name;
      need(k.toLowerCase().startsWith(higher.toLowerCase()), `stat key does not start with the higher group (${higher})`);
      need(/statistically significant/.test(k) && (/not statistically significant/.test(k) === !st.sig), 'stat key misreads the significance');
    }
  } else {
    const rv = Stats.evaluate({ fn: 'r', args: [g.points] });
    need(close(rv, g.r, 1e-9, 1e-9), `r ${g.r} is not the plotted points' r ${rv}`);
    need(g.points.length === c.participants.n, 'one point per participant');
    need(g.points.every(q => q[0] >= c.x.range[0] && q[0] <= c.x.range[1] && q[1] >= c.y.range[0] && q[1] <= c.y.range[1]), 'a point is off the axes');
    if (g.variant === 'null') { need(Math.abs(rv) < 0.1, `null r ${rv} is not near 0`); verdict = 'Does not support'; }
    else { const s = Math.sign(rv) * c.direction; need(s === (g.variant === 'support' ? 1 : -1) && Math.abs(rv) >= 0.3, `r ${rv} does not match the "${g.variant}" result`); verdict = g.variant === 'support' ? 'Supports' : 'Refutes'; }
    const ss = stepOf(p, 'rstat');
    if (ss) {
      const k = right(ss), r2 = Math.round(rv * 100) / 100;
      need(k.includes(Stats.describe(r2)), 'rstat key does not describe r in words');
      if (Math.abs(r2) >= 0.1) need(k.includes(rv * 1 > 0 ? c.y.up : c.y.down) && /does not show/.test(k), 'rstat key has the wrong direction or claims cause');
    }
  }
  const sm = stepOf(p, 'method');
  if (sm) need(right(sm) === METHOD[c.method], `method key "${right(sm)}" is not ${METHOD[c.method]}`);
  if (sm) need(sm.options.filter(o => Object.values(METHOD).includes(o) || /experimental correlation/.test(o)).length === sm.options.length, 'method options are methods');
  const sw = stepOf(p, 'what');
  if (sw) need(right(sw).toLowerCase() === c.dv.what.toLowerCase(), 'B key is not the study\'s measure');
  const sh = stepOf(p, 'how');
  if (sh) need(right(sh).toLowerCase() === c.dv.how.toLowerCase(), 'B timing key is not the study\'s');
  const se = stepOf(p, 'ethics');
  if (se) {
    const named = Object.entries(GUIDES).filter(([, n]) => n === right(se)).map(([k]) => k)[0];
    need(named && c.ethics.some(e => e.g === named) && named === g.ethic, `ethics key "${right(se)}" is not a safeguard the summary describes`);
    for (const o of se.options) { const k = Object.entries(GUIDES).filter(([, n]) => n === o).map(([x]) => x)[0]; if (k && o !== right(se)) need(!c.ethics.some(e => e.g === k), `distractor "${o}" is a safeguard the summary describes`); }
    const sx = stepOf(p, 'ehow');
    need(sx && right(sx) === c.ethics.find(e => e.g === named).how, 'the "how" key is not how the summary applied that guideline');
  }
  const sg = stepOf(p, 'gen');
  if (sg) {
    const gp = c.generalize.find(x => x.pop === g.pop);
    need(gp && right(sg) === `${VERDICT[gp.key]}: ${gp.because}`, 'generalize key is not the study\'s own verdict for that population');
  }
  const sa = stepOf(p, 'argue');
  if (sa) need(right(sa).startsWith(verdict + ':'), `argument key does not start with "${verdict}" for a ${g.variant} result`);
  const keys = p.steps.map(s => s.key);
  const want = { full: ['method', 'what', 'how', c.kind === 'means' ? 'diff' : null, c.kind === 'means' ? 'stat' : 'rstat', 'ethics', 'ehow', 'gen', 'argue'], design: ['method', 'what', 'how'], results: [c.kind === 'means' ? 'diff' : null, c.kind === 'means' ? 'stat' : 'rstat', 'argue'], ethics: ['ethics', 'ehow', 'gen'] }[p.type].filter(Boolean);
  need(JSON.stringify(keys) === JSON.stringify(want), `steps ${keys.join(',')} are not ${want.join(',')}`);
  const text = JSON.stringify(p);
  need(!EMDASH.test(text), 'a drill text has an em dash');
}

export function check(data, map) {
  const errs = [];
  frame(data, 'article-studio', 'simulator', map, errs);
  const { model } = runtime('article-studio');
  if (!model) { errs.push('no model registered (ApPsychMath.articleStudio)'); return errs; }
  if (model.stub) return errs;
  for (const c of data.contexts || []) contextProblems(c, errs);
  for (const k of ['intro', 'howItWorks']) if (EMDASH.test(data[k] || '')) errs.push(`${k} has an em dash`);
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), () => TYPES);
  return errs;
}
