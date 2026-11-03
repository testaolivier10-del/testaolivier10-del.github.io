/* Validator for macroeconomics/data/tools/graph-studio.json (Graph Studio), run by
   scripts/check-apmacro-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems.

   Independent of the model where it can be: the economics of every scenario
   (which curve a shifter moves and which way) and the result of every shift
   (price up, quantity down ...) come from this file's own tables, written
   from the course's graph rules (docs/apmacro-authoring-guide.md), not from
   the model or the data. The graphs themselves are checked by
   ApMacroGraph.check and graded by ApMacroGrade.graph, the code students run.

   Then the drill sweep (_drills.mjs: 300 problems per context and kind) and
   recheck(p): the spec is sound, the key earns every rubric point, planted
   slips lose exactly the point they should with a note (the authored slip
   when there is one), the result step's key is this file's outcome, and the
   shift-or-movement step's key names the scenario's curve. */
import { frame, sweep } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

export const TYPES = ['draw', 'shift', 'move'];
const GRAPHS = ['ppc', 'sd', 'adas', 'money', 'reserves', 'lf', 'phillips', 'forex'];

/* Which curve each shifter moves, and which way (graph:shifter). */
export const SHIFTER = {
  'ppc:resources-up': [['PPC', 'out']], 'ppc:resources-down': [['PPC', 'in']],
  'ppc:point-inside': { region: 'inside' }, 'ppc:point-on': { region: 'on' }, 'ppc:point-outside': { region: 'outside' },
  'sd:income-normal-up': [['D', 'right']], 'sd:sub-price-up': [['D', 'right']], 'sd:comp-price-up': [['D', 'left']],
  'sd:tastes-down': [['D', 'left']], 'sd:expect-price-up': [['D', 'right']], 'sd:buyers-up': [['D', 'right']],
  'sd:input-price-up': [['S', 'left']], 'sd:tech-up': [['S', 'right']], 'sd:tax-per-unit': [['S', 'left']],
  'sd:subsidy': [['S', 'right']], 'sd:sellers-up': [['S', 'right']], 'sd:own-price': 'along',
  'adas:confidence-up': [['AD', 'right']], 'adas:gov-spending-up': [['AD', 'right']], 'adas:taxes-up': [['AD', 'left']],
  'adas:foreign-income-up': [['AD', 'right']], 'adas:expectations-down': [['AD', 'left']], 'adas:wealth-down': [['AD', 'left']],
  'adas:input-price-up': [['SRAS', 'left']], 'adas:wages-up': [['SRAS', 'left']], 'adas:energy-price-down': [['SRAS', 'right']],
  'adas:capacity-up': [['LRAS', 'right'], ['SRAS', 'right']], 'adas:own-price': 'along',
  'money:omo-buy': [['MS', 'right']], 'money:omo-sell': [['MS', 'left']], 'money:rr-down': [['MS', 'right']],
  'money:discount-up': [['MS', 'left']], 'money:income-up': [['MD', 'right']], 'money:pl-up': [['MD', 'right']], 'money:pl-down': [['MD', 'left']],
  'reserves:admin-down': [['RD', 'down']], 'reserves:admin-up': [['RD', 'up']], 'reserves:reserves-add': [['RS', 'right']], 'reserves:reserves-drain': [['RS', 'left']],
  'lf:deficit-up': [['DLF', 'right']], 'lf:saving-up': [['SLF', 'right']], 'lf:saving-down': [['SLF', 'left']],
  'lf:invest-up': [['DLF', 'right']], 'lf:inflow': [['SLF', 'right']], 'lf:outflow': [['SLF', 'left']],
  'phillips:ad-up': { on: 'SRPC', x: 'down', y: 'up' }, 'phillips:ad-down': { on: 'SRPC', x: 'up', y: 'down' },
  'phillips:expected-inflation-up': [['SRPC', 'right']], 'phillips:expected-inflation-down': [['SRPC', 'left']],
  'phillips:supply-shock-bad': [['SRPC', 'right']], 'phillips:natural-rate-down': [['LRPC', 'left']],
  'forex:foreign-buy-goods-up': [['D', 'right']], 'forex:foreign-tourism-down': [['D', 'left']], 'forex:home-rate-up': [['D', 'right']],
  'forex:home-buy-imports-up': [['S', 'right']], 'forex:home-buy-assets-abroad': [['S', 'right']], 'forex:home-income-up': [['S', 'right']],
  'forex:foreign-income-up': [['D', 'right']]
};
/* Accepted second keys (a deficit drawn as less saving). */
const ALT = { 'lf:deficit-up': [[['SLF', 'left']]] };
/* The result of one shift: [vertical axis, horizontal axis]. */
const OUT = {
  sd: { D: { right: ['up', 'up'], left: ['down', 'down'] }, S: { right: ['down', 'up'], left: ['up', 'down'] }, words: ['price', 'quantity'] },
  adas: { AD: { right: ['up', 'up'], left: ['down', 'down'] }, SRAS: { right: ['down', 'up'], left: ['up', 'down'] }, words: ['price level', 'output'] },
  money: { MD: { right: ['up', 'same'], left: ['down', 'same'] }, MS: { right: ['down', 'up'], left: ['up', 'down'] }, words: ['nominal interest rate', 'quantity of money'] },
  reserves: { RD: { down: ['down', 'same'], up: ['up', 'same'] }, RS: { right: ['same', 'up'], left: ['same', 'down'] }, words: ['policy rate', 'quantity of reserves'] },
  lf: { DLF: { right: ['up', 'up'], left: ['down', 'down'] }, SLF: { right: ['down', 'up'], left: ['up', 'down'] }, words: ['real interest rate', 'quantity of loanable funds'] },
  phillips: { SRPC: { right: ['up', 'same'], left: ['down', 'same'] }, words: ['inflation rate', 'unemployment rate'] },
  forex: { D: { right: ['up', 'up'], left: ['down', 'down'] }, S: { right: ['down', 'up'], left: ['up', 'down'] }, words: ['value of the currency', 'quantity of the currency'] }
};
function expectOutcome(graph, shifts) {
  if (shifts.length !== 1) return null;
  const t = OUT[graph] && OUT[graph][shifts[0].curve] && OUT[graph][shifts[0].curve][shifts[0].dir];
  if (!t) return null;
  return { [OUT[graph].words[0]]: t[0], [OUT[graph].words[1]]: t[1] };
}
const PH = /\{(\w+)\}/g;
const sameObj = (a, b) => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]])) === JSON.stringify(Object.keys(b).sort().map(k => [k, b[k]]));

export function check(data, map) {
  const errs = [];
  frame(data, 'graph-studio', 'simulator', map, errs);
  const { model: GS, Graph: G, Grade, M } = runtime('graph-studio');
  if (!GS || GS.stub) { errs.push('ApMacroMath.graphStudio is missing or still the stub'); return errs; }
  // The explore graphs.
  const gids = new Set();
  for (const g of data.graphs || []) {
    const w = `graph ${g.id}`;
    if (!GRAPHS.includes(g.id)) { errs.push(`${w}: not one of ${GRAPHS.join(', ')}`); continue; }
    if (gids.has(g.id)) errs.push(`${w}: listed twice`); gids.add(g.id);
    if (!topicOk(g.topic, map)) errs.push(`${w}: unknown topic "${g.topic}"`);
    for (const k of ['title', 'shows', 'axes', 'movement']) if (!g[k] || String(g[k]).length < 12) errs.push(`${w}: "${k}" is a sentence`);
    const ids = G.KINDS[g.id].curves.map(c => c.id);
    for (const s of g.shifters || []) {
      if (!ids.includes(s.curve)) errs.push(`${w}: shifters name unknown curve "${s.curve}"`);
      if (!Array.isArray(s.list) || !s.list.length) errs.push(`${w}: shifters.${s.curve} lists what shifts it`);
    }
    for (const c of ids) if (!(g.shifters || []).some(s => s.curve === c)) errs.push(`${w}: no shifters listed for ${c}`);
  }
  for (const id of GRAPHS) if (!gids.has(id)) errs.push(`graphs: ${id} is missing (Graph Studio draws every graph kind)`);
  // The name sets every placeholder needs.
  const need = { ppc: ['x', 'y'], sd: ['good', 'sub', 'comp', 'input'], forex: ['home', 'cur', 'abroad', 'other'] };
  for (const [g, keys] of Object.entries(need)) {
    const sets = (data.names || {})[g] || [];
    if (!sets.length) errs.push(`names.${g}: at least one name set`);
    sets.forEach((s, i) => keys.forEach(k => { if (!s[k]) errs.push(`names.${g}[${i}]: needs "${k}"`); }));
  }
  // Every scenario: its economics from SHIFTER, its graph through ApMacroGraph.check.
  const sids = new Set();
  for (const sc of data.scenarios || []) {
    const w = `scenario ${sc.id}`;
    if (!sc.id || sids.has(sc.id)) errs.push(`${w}: missing or duplicate id`); sids.add(sc.id);
    if (!GRAPHS.includes(sc.graph)) { errs.push(`${w}: unknown graph "${sc.graph}"`); continue; }
    if (!topicOk(sc.topic, map)) errs.push(`${w}: unknown topic "${sc.topic}"`);
    if (!sc.title || !sc.cause || sc.cause.length < 15) errs.push(`${w}: needs a title and a cause sentence`);
    const rule = SHIFTER[`${sc.graph}:${sc.shifter}`];
    if (!rule) { errs.push(`${w}: shifter "${sc.shifter}" is not in the validator's table for ${sc.graph}`); continue; }
    const sets = (data.names || {})[sc.graph] || [{}];
    const texts = [sc.cause, sc.because, sc.ask, sc.pointWhy, ...(sc.why || []), ...Object.values(sc.slips || {})].filter(Boolean);
    for (const set of sets) for (const t of texts) { const left = GS.fill(t, set).match(PH); if (left) errs.push(`${w}: "${left[0]}" has no value in a ${sc.graph} name set`); }
    if (rule === 'along') {
      if (!(GS.ALONG[sc.graph] || []).includes(sc.along)) errs.push(`${w}: a movement along needs "along" (${(GS.ALONG[sc.graph] || []).join(' or ')})`);
      if (sc.shifts) errs.push(`${w}: a movement along a curve shifts nothing`);
      continue;
    }
    if (!Array.isArray(rule)) {
      const P = sc.point || {};
      if (!sameObj(P, rule)) errs.push(`${w}: point ${JSON.stringify(P)}, but ${sc.shifter} puts it ${JSON.stringify(rule)}`);
      const sp = GS.specOf(sc, GS.namesFor(sc.graph, null, data), ['point']);
      for (const p of G.check(sp)) errs.push(`${w}: ${p}`);
      if (!sc.pointWhy) errs.push(`${w}: a point scenario says why the point goes there (pointWhy)`);
      continue;
    }
    const got = (sc.shifts || []).map(s => [s.curve, s.dir]);
    if (JSON.stringify(got) !== JSON.stringify(rule)) errs.push(`${w}: shifts ${JSON.stringify(got)}, but ${sc.shifter} shifts ${JSON.stringify(rule)}`);
    if (!sc.because || sc.because.length < 8) errs.push(`${w}: "because" names the cause in a few words`);
    const alt = ALT[`${sc.graph}:${sc.shifter}`] || [];
    const altGot = (sc.alt || []).map(a => a.map(s => [s.curve, s.dir]));
    if (JSON.stringify(altGot) !== JSON.stringify(alt)) errs.push(`${w}: accepted second keys ${JSON.stringify(altGot)}, the table has ${JSON.stringify(alt)}`);
    const eqOk = !!G.KINDS[sc.graph].eq && !sc.noEq;
    const sp = GS.specOf(sc, GS.namesFor(sc.graph, null, data), eqOk ? ['label', 'shift', 'equilibrium'] : ['label', 'shift']);
    for (const p of G.check(sp)) errs.push(`${w}: ${p}`);
    if (eqOk && sc.drill !== false) {
      const want = expectOutcome(sc.graph, sc.shifts);
      if (!want) errs.push(`${w}: the validator has no outcome for this shift; mark it noEq or drill: false`);
      else if (!sameObj(want, sp.key.outcome || {})) errs.push(`${w}: the graph gives ${JSON.stringify(sp.key.outcome)}, the economics ${JSON.stringify(want)}`);
    }
    for (const c of Object.keys(sc.slips || {})) if (sc.shifts.some(s => s.curve === c)) errs.push(`${w}: slips.${c} is for a wrong curve, but ${c} is the key`);
  }
  // Contexts: a known graph, kinds with scenarios behind them.
  for (const c of data.contexts || []) {
    if (!GRAPHS.includes(c.graph)) { errs.push(`context ${c.id}: unknown graph "${c.graph}"`); continue; }
    for (const t of c.types || []) {
      if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown kind "${t}"`);
      else if (!GS.poolOf(c, t, data).length) errs.push(`context ${c.id}: no scenario fits the kind "${t}"`);
    }
  }
  for (const g of GRAPHS) if (!(data.contexts || []).some(c => c.graph === g)) errs.push(`contexts: no drill for the ${g} graph`);
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => GS.generate(r, c, t, data), (p, c, w) => { errs.push(...recheck(p, c, w, data)); }, c => c.types || [undefined]);
  return errs;
}

/* One generated problem, rechecked. */
export function recheck(p, ctx, w, data) {
  const errs = [];
  const bad = m => errs.push(`${w}: ${m}`);
  const { model: GS, Graph: G, Grade } = runtime('graph-studio');
  const sc = (data.scenarios || []).find(s => s.id === p.scenario);
  if (!sc) { bad(`unknown scenario ${p.scenario}`); return errs; }
  if (p.graph !== ctx.graph || sc.graph !== ctx.graph) bad(`a ${sc.graph} scenario in the ${ctx.graph} context`);
  const tasks = p.steps.map(s => s.key);
  if (JSON.stringify(tasks) !== JSON.stringify(GS.tasksOf(sc, p.type))) bad(`steps ${tasks} for a ${p.type} problem`);
  if (/\{\w+\}/.test([p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, ...(s.options || []), ...(s.why || [])])].join(' '))) bad('a placeholder was left unfilled');
  const spec = p.spec, graphSteps = p.steps.filter(s => s.kind === 'graph');
  if (graphSteps.length) {
    for (const m of G.check(spec)) bad(`spec: ${m}`);
    const full = Grade.graph(spec, p.key);
    if (!full.correct) bad(`the key loses points: ${full.notes.join(' ')}`);
    for (const s of graphSteps) {
      const k = JSON.parse(JSON.stringify(p.key)), pt = r => Grade.graph(spec, r).points.find(x => x.id === s.task);
      if (s.task === 'labels') {
        const r = { ...k, labels: { ...k.labels, y: G.labelOptions(spec, 'y')[1] } }, q = pt(r);
        if (q.ok || !/vertical axis|price of a currency/i.test(q.note)) bad('a wrong vertical axis label is not caught by name');
      }
      if (s.task === 'shift') {
        const key = sc.shifts[0], cs = G.KINDS[sc.graph].curves.map(c => c.id).filter(c => !sc.shifts.some(x => x.curve === c));
        const back = { ...k, shifts: { ...k.shifts, [key.curve]: -k.shifts[key.curve] } }, qb = pt(back);
        if (qb.ok || !/right curve/.test(qb.note)) bad(`the backwards shift of ${key.curve} is not named`);
        for (const c of cs) {
          if ((sc.alt || []).some(a => a.some(x => x.curve === c))) continue;
          const wrong = { ...k, shifts: { [c]: 1 } }, qw = pt(wrong);
          if (qw.ok) bad(`moving ${c} instead of ${key.curve} is graded right`);
          else if (sc.slips && sc.slips[c] && qw.note !== GS.fill(sc.slips[c], p.words)) bad(`moving ${c}: the authored slip is not the note`);
        }
      }
      if (s.task === 'equilibrium') {
        const e0 = G.eq(spec, {}), q = pt({ ...k, eq: e0 });
        if (q.ok) bad('E2 left on E1 is graded right');
      }
      if (s.task === 'point') {
        const P = spec.key.point, opp = P.region ? { inside: 'outside', on: 'inside', outside: 'inside' }[P.region] : null;
        const r = P.region ? GS.keyPoint({ ...spec, key: { point: { region: opp } } }) : [10 - k.point[0], 10 - k.point[1]];
        if (pt({ ...k, point: r }).ok) bad('a point in the wrong place is graded right');
      }
    }
  }
  for (const s of p.steps) {
    if (s.key === 'outcome') {
      const want = expectOutcome(sc.graph, (spec.key || {}).shifts || []);
      if (!want) bad('no independent outcome for this shift');
      else if (!sameObj(s.keys[s.correct], want)) bad(`the result key ${JSON.stringify(s.keys[s.correct])} is not the economics ${JSON.stringify(want)}`);
      if (!sameObj(s.keys[s.correct], G.outcome(spec, G.keyOffsets(spec)))) bad('the result key disagrees with the graph');
      if (s.keys.filter(x => sameObj(x, s.keys[s.correct])).length !== 1) bad('two result options say the same');
      if (s.options[s.correct] !== GS.outcomeText(sc.graph, want, spec.names)) bad('the right option does not read as the outcome');
    }
    if (s.key === 'move') {
      const right = s.options[s.correct];
      const name = G.curveName(sc.along || sc.shifts[0].curve);
      if (right !== (sc.along ? 'A movement along ' : 'A shift of ') + name) bad(`shift-or-movement key "${right}"`);
    }
  }
  return errs;
}
