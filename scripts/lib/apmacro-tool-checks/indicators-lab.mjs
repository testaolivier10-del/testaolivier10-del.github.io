/* Validator for macroeconomics/data/tools/indicators-lab.json (Economic indicators lab), run by
   scripts/check-apmacro-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems.

   1. The frame; each context's types and the topic each type belongs to.
   2. The GDP catalogue against this file's own answer sheet (every
      transaction's category), the explore economies' totals, the CPI basket,
      the deflator table, and the jobs events (people conserved, every rate
      recomputed here).
   3. 300 seeded problems per context and type (_drills.mjs sweep), every
      key recomputed from the problem's numbers with this file's own
      arithmetic; the kind of unemployment from this file's own answer sheet.
      No PPI calculation (CED 2.4). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['gdp-count', 'gdp-calc', 'cpi', 'real', 'unemp', 'utype'];
export const TOPIC = { 'gdp-count': 'gdp-circular-flow', 'gdp-calc': 'gdp-circular-flow', cpi: 'price-indices-inflation', real: 'real-nominal-gdp', unemp: 'unemployment', utype: 'unemployment' };
// The answer sheet, written independently of the model's tags.
export const SHEET = {
  fridge: 'C', haircut: 'C', rent: 'C', groceries: 'C', dentist: 'C',
  trucks: 'I', house: 'I', inventory: 'I', datacenter: 'I',
  firefighters: 'G', bridge: 'G', ship: 'G',
  soybeans: 'X', tourist: 'X', plane: 'X',
  laptops: 'CM', scanner: 'IM',
  socsec: 'none', ubenefit: 'none', stock: 'none', bond: 'none', usedcar: 'none', flour: 'none', cooking: 'none', mexico: 'none'
};
const LABEL = { C: 'Consumption (C)', I: 'Investment (I)', G: 'Government purchases (G)', X: 'Net exports (X − M)', none: 'Not counted in this year\'s US GDP' };
const UNEMP = [
  [/quits her job to move|first job in her field|left a job he disliked/, 'frictional'],
  [/printing is now done digitally|mines close for good|apps and kiosks/, 'structural'],
  [/In a recession, car sales|During a downturn|spending falls across the economy/, 'cyclical'],
  [/stops looking|not looking for work/, 'none']
];
const UTYPE_LABEL = { frictional: 'Frictional', structural: 'Structural', cyclical: 'Cyclical', none: 'Not unemployed: out of the labor force' };
const strip = s => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const pct = (a, b) => a / b * 100;
const cells = html => [...String(html).matchAll(/<t[dh][^>]*>([^<]*)<\/t[dh]>/g)].map(m => m[1]);
const money = s => Number(String(s).replace(/[$,h ]|billion/g, ''));

export function exploreProblems(model, M) {
  const errs = [];
  for (const t of model.TX) {
    if (!(t.id in SHEET)) errs.push(`transaction ${t.id}: not on the validator's answer sheet`);
    else if (SHEET[t.id] !== t.cat) errs.push(`transaction ${t.id}: tagged ${t.cat}, the answer sheet says ${SHEET[t.id]}`);
  }
  for (let i = 1; i <= 60; i++) {
    const items = model.economy(M.rng(i * 31 + 5)), s = model.totals(items);
    let C = 0, I = 0, G = 0, X = 0, Mi = 0;
    for (const t of items) { const c = SHEET[t.id]; if (c === 'C' || c === 'CM') C += t.amt; if (c === 'I' || c === 'IM') I += t.amt; if (c === 'G') G += t.amt; if (c === 'X') X += t.amt; if (c === 'CM' || c === 'IM') Mi += t.amt; }
    if (!close(s.gdp, C + I + G + X - Mi, 1e-12, 1e-9)) { errs.push(`economy ${i}: GDP ${s.gdp}, want ${C + I + G + X - Mi}`); break; }
    if (items.filter(t => SHEET[t.id] === 'none').length < 2) { errs.push(`economy ${i}: fewer than two transactions that do not count`); break; }
  }
  for (let b = 0; b < model.YEARS.length; b++) {
    const P = model.prices(b);
    const cost = model.YEARS.map((_, i) => model.BASKET.reduce((s, g) => s + g.q * g.p[i], 0));
    cost.forEach((c, i) => {
      if (!close(P.cost[i], c, 1e-12)) errs.push(`basket cost year ${i}: ${P.cost[i]}, want ${c}`);
      if (!close(P.cpi[i], c / cost[b] * 100, 1e-9)) errs.push(`CPI year ${i} base ${b}: ${P.cpi[i]}`);
      if (i && !close(P.infl[i], (c - cost[i - 1]) / cost[i - 1] * 100, 1e-9)) errs.push(`inflation year ${i} base ${b}: ${P.infl[i]} (inflation must not depend on the base year)`);
      if (!close(P.realWage[i], P.wage[i] / (c / cost[b] * 100) * 100, 1e-9)) errs.push(`real wage year ${i} base ${b}`);
    });
    if (!close(P.cpi[b], 100, 1e-12)) errs.push(`the base year's CPI is ${P.cpi[b]}, not 100`);
  }
  const R = model.realGdp();
  R.real.forEach((r, i) => { if (!close(r, R.nominal[i] / R.deflator[i] * 100, 1e-9)) errs.push(`real GDP year ${i}: ${r}`); });
  if (!R.gReal.some((g, i) => i && g < 0 && R.gNom[i] > 0)) errs.push('the deflator table should show a year when nominal GDP rose and real GDP fell');
  const rateOk = (st, w) => {
    const tot = Object.values(st).reduce((a, b) => a + b, 0);
    if (tot !== 100) errs.push(`${w}: ${tot} adults, not 100`);
    if (Object.values(st).some(v => v < 0)) errs.push(`${w}: a negative group`);
    const U = st.uF + st.uS + st.uC, lf = st.E + U, r = model.rates(st);
    if (!close(r.u, pct(U, lf), 1e-9)) errs.push(`${w}: unemployment rate ${r.u}`);
    if (!close(r.lfpr, pct(lf, 100), 1e-9)) errs.push(`${w}: participation ${r.lfpr}`);
    if (!close(r.natural, pct(st.uF + st.uS, lf), 1e-9)) errs.push(`${w}: natural rate ${r.natural}`);
    if (!close(r.cyclical, pct(st.uC, lf), 1e-9, 1e-9)) errs.push(`${w}: cyclical rate ${r.cyclical}`);
  };
  rateOk(model.JOBS0, 'start');
  const seq = ['recession', 'giveup', 'grads', 'automation', 'retire', 'recovery', 'hired', 'retrain', 'giveup'];
  let st = model.JOBS0;
  for (const id of seq) {
    const before = model.rates(st), out = model.jobEvent(st, id), after = model.rates(out.st);
    rateOk(out.st, `after ${id}`);
    if (id === 'giveup' && out.moved && !(after.u < before.u && after.lfpr < before.lfpr)) errs.push('discouraged workers leaving must lower both the unemployment rate and participation');
    if (id === 'recession' && !(after.cyclical > before.cyclical)) errs.push('a recession must raise cyclical unemployment');
    if (id === 'automation' && !(after.natural > before.natural)) errs.push('automation must raise the natural rate');
    st = out.st;
  }
  return errs;
}

export function recheckProblem(p, c, model) {
  const errs = [], v = p.values, step = k => p.steps.find(s => s.key === k), ans = k => step(k).cell.answer, opt0 = k => strip(step(k).options[0]);
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, ...(s.options || []), ...(s.why || [])])].map(strip).join(' ');
  if (c && c.topic !== TOPIC[p.type]) errs.push(`type ${p.type} belongs to topic ${TOPIC[p.type]}, the context says ${c.topic}`);
  for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`step ${s.key}: the key is not option 0`);
  if (/\bPPI\b|producer price/i.test(all)) errs.push('the PPI is not calculated in this course (CED 2.4)');
  if (p.type === 'gdp-count') {
    v.ids.forEach((id, i) => {
      const s = p.steps[i], t = model.TX.find(x => x.id === id);
      if (!t || !s.label.includes(t.text)) errs.push(`step ${s.key}: the transaction text is missing`);
      const want = LABEL[SHEET[id]];
      if (!want) errs.push(`step ${s.key}: ${id} is an import, not a single-category item`);
      else if (strip(s.options[0]) !== want) errs.push(`step ${s.key}: ${id} keyed "${strip(s.options[0])}", want "${want}"`);
      if (s.options.length !== 5) errs.push(`step ${s.key}: offer all five places`);
    });
  }
  if (p.type === 'gdp-calc') {
    const t = cells(p.fig.html), val = name => money(t[t.indexOf(name) + 1]);
    const C = val('Consumption'), I = val('Investment'), G = val('Government purchases'), X = val('Exports'), Mi = val('Imports');
    if (!close(ans('nx'), X - Mi, 1e-12, 1e-9)) errs.push(`net exports ${ans('nx')}, want ${X - Mi}`);
    if (!close(ans('gdp'), C + I + G + X - Mi, 1e-12, 1e-9)) errs.push(`GDP ${ans('gdp')}, want ${C + I + G + X - Mi}`);
    if (!t.includes('Government transfer payments')) errs.push('the table should hold a transfer payment to leave out');
  }
  if (p.type === 'cpi') {
    const cost = [0, 1, 2].map(i => v.goods.reduce((s, g) => s + g.q * g.p[i], 0));
    const c1 = cost[1] / cost[0] * 100, c2 = cost[2] / cost[0] * 100;
    if (!close(ans('cost'), cost[0], 1e-9)) errs.push(`base cost ${ans('cost')}, want ${cost[0]}`);
    if (!close(ans('cpi1'), c1, 1e-9)) errs.push(`CPI ${ans('cpi1')}, want ${c1}`);
    if (!close(ans('cpi2'), c2, 1e-9)) errs.push(`CPI ${ans('cpi2')}, want ${c2}`);
    if (!close(ans('infl'), (c2 - c1) / c1 * 100, 1e-9, 1e-9)) errs.push(`inflation ${ans('infl')}, want ${(c2 - c1) / c1 * 100}`);
    const t = cells(p.fig.html);
    v.goods.forEach(g => { const i = t.indexOf(g.name); if (i < 0 || Number(t[i + 1]) !== g.q || g.p.some((x, k) => Math.abs(money(t[i + 2 + k]) - x) > 1e-9)) errs.push(`the table does not show ${g.name} as used`); });
  }
  if (p.type === 'real') {
    if (v.variant === 'deflate') {
      const r1 = v.g1 / v.d1 * 100, r2 = v.g2 / v.d2 * 100;
      if (!close(ans('r2'), r2, 1e-9)) errs.push(`real GDP ${ans('r2')}, want ${r2}`);
      if (!close(ans('gr'), (r2 - r1) / r1 * 100, 1e-9, 1e-9)) errs.push(`real growth ${ans('gr')}`);
    } else {
      const d = v.nom / v.real * 100;
      if (!close(ans('defl'), d, 1e-9)) errs.push(`deflator ${ans('defl')}, want ${d}`);
      if (!close(ans('infl'), (d - v.dPrev) / v.dPrev * 100, 1e-9, 1e-9)) errs.push(`deflator inflation ${ans('infl')}`);
    }
  }
  if (p.type === 'unemp') {
    const lf = v.E + v.U, adults = v.E + v.U + v.Ret + v.Stu + v.D;
    if (!close(ans('lf'), lf, 1e-12)) errs.push(`labor force ${ans('lf')}, want ${lf}`);
    if (!close(ans('u'), pct(v.U, lf), 1e-9)) errs.push(`unemployment rate ${ans('u')}`);
    if (!close(ans('lfpr'), pct(lf, adults), 1e-9)) errs.push(`participation ${ans('lfpr')}`);
    const t = cells(p.fig.html);
    if (![v.E, v.U, v.Ret, v.Stu, v.D].every(x => t.includes(String(x)))) errs.push('the table does not show the numbers used');
  }
  if (p.type === 'utype') {
    for (const s of p.steps) {
      const hit = UNEMP.find(([re]) => re.test(s.label));
      if (!hit) { errs.push(`step ${s.key}: a scenario not on the answer sheet`); continue; }
      if (strip(s.options[0]) !== UTYPE_LABEL[hit[1]]) errs.push(`step ${s.key}: keyed "${strip(s.options[0])}", the answer sheet says ${hit[1]}`);
    }
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'indicators-lab', 'skill', map, errs);
  const { M, model } = runtime('indicators-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('the model ApMacroMath.indicatorsLab is not registered (macroeconomics/assets/tools/math/indicators-lab.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub'); return errs; }
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length) { errs.push(`context ${c.id}: list its types`); continue; }
    for (const t of c.types) {
      if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}" (one of ${TYPES.join(', ')})`);
      else if (TOPIC[t] !== c.topic) errs.push(`context ${c.id}: type ${t} belongs to topic ${TOPIC[t]}, not ${c.topic}`);
    }
  }
  errs.push(...exploreProblems(model, M));
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => { for (const e of recheckProblem(p, c, model)) errs.push(`${w}: ${e}`); }, c => (c.types || []).filter(t => TYPES.includes(t)));
  return errs;
}
export function recheck(p, c) { return recheckProblem(p, c, runtime('indicators-lab').model); }
