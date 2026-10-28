/* Validator for psychology/data/tools/stats-lab.json (Stats lab), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems: the frame, then 300 problems per context and
   type regenerated with the model the page runs (ApPsychMath.statsLab), and
   every key recomputed independently from the problem's givens with
   ApPsychStats recipes (never through the model): z scores, the 68-95-99.7
   shares, mean, median and range, the mean with an outlier and the skew it
   makes, and r recomputed from the very points the scatterplot draws. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['rule', 'between', 'zcompare', 'center', 'outlier', 'scatter'];
const RULE_BELOW = { '-3': 0.15, '-2': 2.5, '-1': 16, 0: 50, 1: 84, 2: 97.5, 3: 99.85 };

const stepOf = (p, k) => p.steps.find(s => s.key === k);
const keyOf = s => s.cell.answer;
const rightText = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { Stats } = runtime('stats-lab');
  const E = (fn, ...args) => Stats.evaluate({ fn, args });
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const key = k => { const s = stepOf(p, k); if (!s) { errs.push(`${w}: no step ${k}`); return NaN; } return keyOf(s); };
  if (p.type === 'rule') {
    const z = E('z', g.x, g.mean, g.sd);
    need(close(key('z'), z), `z key ${key('z')} is not ${z}`);
    need(Number.isInteger(z) && Math.abs(z) <= 3, 'the score is not at a whole SD');
    const below = E('percentileRule', z);
    need(close(key('below'), below) && close(below, RULE_BELOW[z]), `below key ${key('below')} is not ${below} (rule ${RULE_BELOW[z]})`);
    need(rightText(stepOf(p, 'meaning')).includes(`${Math.round(below * 100) / 100}% of test takers scored lower`), 'the meaning key does not say the share below');
    need(c.scale && g.mean === c.scale.mean && g.sd === c.scale.sd, 'mean or SD is not the context scale');
  } else if (p.type === 'between') {
    const za = E('z', g.a, g.mean, g.sd), zb = E('z', g.b, g.mean, g.sd);
    need(close(key('za'), za, 1e-6, 1e-9) && close(key('zb'), zb, 1e-6, 1e-9), 'a z key is wrong');
    const pct = E('rulePct', za, zb);
    need(close(key('pct'), pct), `pct key ${key('pct')} is not ${pct}`);
    need(close(pct, RULE_BELOW[zb] - RULE_BELOW[za], 1e-9, 1e-9), 'the share disagrees with the rule table');
  } else if (p.type === 'zcompare') {
    const [a, b] = g.tests;
    const z1 = E('z', a.x, a.mean, a.sd), z2 = E('z', b.x, b.mean, b.sd);
    need(close(key('z1'), z1, 1e-6, 1e-9) && close(key('z2'), z2, 1e-6, 1e-9), 'a z key is wrong');
    need(z1 !== z2, 'the two z scores tie');
    const win = z1 > z2 ? a.name : b.name;
    need(rightText(stepOf(p, 'better')).startsWith(`The ${win},`) && /z score is higher/.test(rightText(stepOf(p, 'better'))), `better key does not name the ${win}`);
  } else if (p.type === 'center') {
    const d = g.data;
    need(d.length >= 4 && d.length <= 8 && d.every(Number.isInteger), 'not four to eight whole numbers');
    need(close(key('mean'), E('mean', d)), `mean key is not ${E('mean', d)}`);
    need(close(key('median'), E('median', d)), `median key is not ${E('median', d)}`);
    need(close(key('range'), E('range', d)), `range key is not ${E('range', d)}`);
    need(Math.abs(E('mean', d) * 10 - Math.round(E('mean', d) * 10)) < 1e-9, 'the mean needs more than one decimal (not by hand)');
  } else if (p.type === 'outlier') {
    const d2 = g.data.concat([g.out]), m0 = E('mean', g.data), m1 = E('mean', d2), md0 = E('median', g.data), md1 = E('median', d2);
    need(close(key('newmean'), m1), `newmean key is not ${m1}`);
    need(Math.abs(m1 - m0) > Math.abs(md1 - md0), 'the outlier does not move the mean more than the median');
    need(rightText(stepOf(p, 'center')).startsWith('The median'), 'the center key is not the median');
    const pos = m1 > md1;
    need(pos === g.high, 'the mean is not on the outlier side of the median');
    need(rightText(stepOf(p, 'skew')).startsWith(pos ? 'Positively skewed' : 'Negatively skewed'), 'the skew key names the wrong tail');
  } else if (p.type === 'scatter') {
    const r = E('r', g.points), t = g.target;
    need(Math.abs(r - t) <= 0.15, `the points give r = ${r}, far from the keyed ${t}`);
    need(Stats.strength(r) === Stats.strength(t) && Stats.direction(r) === Stats.direction(t), `the drawn r ${r} reads as ${Stats.describe(r)}, the key says ${Stats.describe(t)}`);
    need(rightText(stepOf(p, 'r')) === `r = ${String(t).replace('-', '−')}`, 'the r key is not the target');
    need(rightText(stepOf(p, 'words')).toLowerCase().startsWith(Stats.describe(t)), 'the words key disagrees with describe(r)');
    need(/^No\b/.test(rightText(stepOf(p, 'cause'))), 'the causation key does not say no');
    for (const s of p.steps.filter(s => s.kind === 'choice')) need(new Set(s.options).size === 4, `step ${s.key} does not have four different options`);
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'stats-lab', 'simulator', map, errs);
  const { model, Stats } = runtime('stats-lab');
  if (!model) errs.push('no model registered (ApPsychMath.statsLab)');
  else if (!model.stub) {
    for (const c of data.contexts || []) {
      for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
      if ((c.types || []).some(t => t === 'rule' || t === 'between') && !(c.scale && c.scale.sd > 0)) errs.push(`context ${c.id}: a normal-curve context needs scale { mean, sd }`);
      if ((c.types || []).includes('scatter') && !(c.pair && c.claim && c.right && c.wrong && c.thirdWhy)) errs.push(`context ${c.id}: a scatter context needs pair, claim, right, wrong, thirdWhy`);
    }
    // The explore pane's own numbers: the rule table is ApPsychStats's.
    for (const [z, v] of Object.entries(RULE_BELOW)) if (!close(Stats.evaluate({ fn: 'percentileRule', args: [+z] }), v)) errs.push(`percentileRule(${z}) is not ${v}`);
    for (const s of model.SETS) if (!s.values.every(Number.isInteger)) errs.push(`explore set ${s.k}: whole numbers only`);
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
