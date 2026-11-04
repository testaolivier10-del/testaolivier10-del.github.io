/* Validator for macroeconomics/data/tools/policy-chain.json (Policy Chain
   Builder), run by scripts/check-apmacro-content.mjs. OWNED BY THIS TOOL ONLY
   (builder T2). check(data, map) -> problems: the frame; every chain of the
   model (each family, version and direction) against this file's own list of
   the links in order and the way each must point, with each link's graph read
   back through ApMacroGraph (the graph agrees with the words); the "Make it
   specific" builder graded by ApMacroGrade.specific; then 300 problems per
   context and type regenerated with the model the page runs
   (ApMacroMath.policyChain), each step's key the link in order, its options
   distinct, a skipped-link option really the next link, no option the right
   answer twice. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['fiscal', 'monetary', 'open', 'crowding', 'selfadjust'];
const ORDER = {
  'fiscal/spend': ['policy', 'ad', 'outcome'],
  'fiscal/tax': ['policy', 'income', 'ad', 'outcome'],
  'monetary/ample': ['policy', 'policy-rate', 'rates', 'invest', 'ad', 'outcome'],
  'monetary/limited': ['policy', 'money', 'rate', 'invest', 'ad', 'outcome'],
  'open/rates': ['rates', 'capital', 'demand', 'value', 'nx', 'ad'],
  'crowding/deficit': ['deficit', 'borrow', 'rate', 'invest', 'growth'],
  'selfadjust/gap': ['gap', 'wages', 'sras', 'back']
};
/* The way each link must point, written out by hand: a regular expression
   its statement must match, for d = +1 and d = -1. */
const WAY = {
  fiscal: { policy: [/increase|cut/, /decrease|raised/], income: [/rises/, /falls/], ad: [/right/, /left/], outcome: [/^Real output rises, the price level rises/, /^Real output falls, the price level falls/] },
  monetary: { policy: [/lowers|buys/, /raises|sells/], 'policy-rate': [/falls/, /rises/], rates: [/fall/, /rise/], money: [/increases/, /decreases/], rate: [/falls/, /rises/], invest: [/rise/, /fall/], ad: [/right/, /left/], outcome: [/^Real output rises, the price level rises/, /^Real output falls, the price level falls/] },
  open: { rates: [/rise/, /fall/], capital: [/into/, /out of/], demand: [/increases/, /decreases/], value: [/appreciates/, /depreciates/], nx: [/net exports fall/, /net exports rise/], ad: [/left/, /right/] },
  crowding: { deficit: [/grows/, /shrinks/], borrow: [/increases/, /decreases/], rate: [/rises/, /falls/], invest: [/falls/, /rises/], growth: [/slows/, /speeds up/] },
  selfadjust: { gap: [/above/, /below/], wages: [/rise/, /fall/], sras: [/left/, /right/], back: [/higher price level/, /lower price level/] }
};
/* What each graph must show, read back through ApMacroGraph.outcome. */
function graphOk(Graph, fam, link, d) {
  const g = link.graph; if (!g) return null;
  const spec = { kind: g.kind, ...(g.start ? { start: g.start } : {}), ...(g.names ? { names: g.names } : {}) };
  const o = Graph.outcome(spec, g.shifts) || {}, up = x => (x > 0 ? 'up' : 'down');
  if (g.kind === 'adas' && link.id !== 'gap' && fam !== 'selfadjust') {
    const right = (fam === 'open' ? -d : d) > 0;
    return o.output === (right ? 'up' : 'down') && o['price level'] === (right ? 'up' : 'down') ? null : 'AD-AS does not show output and prices moving with AD';
  }
  if (fam === 'selfadjust') {
    if (!Object.values(g.shifts || {}).some(Boolean)) { const e = Graph.eq(spec, {}); return (d > 0 ? e[0] > 5 : e[0] < 5) ? null : 'the gap is on the wrong side of full employment'; }
    const e = Graph.eq(spec, g.shifts), e0 = Graph.eq(spec, {});
    return Math.abs(e[0] - 5) < 1e-6 && (d > 0 ? e[1] > e0[1] : e[1] < e0[1]) ? null : 'SRAS does not bring output back to LRAS with the price level the right way';
  }
  if (g.kind === 'reserves') return o['policy rate'] === up(-d) ? null : 'the reserve market does not show the policy rate the right way';
  if (g.kind === 'money') return o['nominal interest rate'] === up(-d) ? null : 'the money market does not show the interest rate the right way';
  if (g.kind === 'lf') return o['real interest rate'] === up(d) ? null : 'loanable funds does not show the real interest rate the right way';
  if (g.kind === 'forex') return o['value of the currency'] === up(d) && g.names && g.names.currency === 'dollar' ? null : 'the market for dollars does not show the dollar the right way';
  return `unexpected graph ${g.kind}`;
}

export function chains(model, errs) {
  const { Graph, Grade, M } = runtime('policy-chain');
  for (const f of model.FAMILIES) for (const v of f.variants) for (const d of [1, -1]) {
    const ch = model.chain(f.id, v.id, d), w = `chain ${f.id}/${v.id} ${d > 0 ? '+' : '-'}`;
    const want = ORDER[`${f.id}/${v.id}`];
    if (!want) { errs.push(`${w}: no expected order`); continue; }
    if (ch.links.map(l => l.id).join() !== want.join()) errs.push(`${w}: links ${ch.links.map(l => l.id).join(' > ')}, should be ${want.join(' > ')}`);
    for (const l of ch.links) {
      const re = (WAY[f.id][l.id] || [])[d > 0 ? 0 : 1];
      if (!re) errs.push(`${w}: no direction rule for ${l.id}`);
      else if (!re.test(l.say)) errs.push(`${w}: link ${l.id} "${l.say}" points the wrong way`);
      const bad = graphOk(Graph, f.id, l, d); if (bad) errs.push(`${w}: link ${l.id}: ${bad}`);
      if (!l.words.length) errs.push(`${w}: link ${l.id} has no words for the writing hints`);
      if (!model.covered(ch, l.say)[ch.links.indexOf(l)]) errs.push(`${w}: link ${l.id}'s own statement does not name it`);
      for (const t of l.traps) if (t[0].toLowerCase() === l.say.toLowerCase() || !t[1] || t[1].length < 20) errs.push(`${w}: link ${l.id} has a trap that is the link or has no reason`);
    }
    // Self-adjustment never runs through AD or automatic stabilizers.
    if (f.id === 'selfadjust' && ch.links.some(l => /\bAD\b|aggregate demand|stabiliz/i.test(l.say))) errs.push(`${w}: self-adjustment through AD`);
    const b = model.builder(ch, M.rng(5)), picks = {};
    for (const k of Object.keys(b.slots)) picks[k] = b.slots[k].correct;
    if (!Grade.specific(b, picks).correct) errs.push(`${w}: the builder's own key is graded wrong`);
    for (const k of Object.keys(b.slots)) {
      const s = b.slots[k];
      if (s.options[s.correct].toLowerCase() !== ch.links[+k.slice(4) - 1].say.toLowerCase()) errs.push(`${w}: builder ${k} is not link ${k.slice(4)}`);
      const wrong = { ...picks, [k]: (s.correct + 1) % s.options.length };
      if (Grade.specific(b, wrong).correct) errs.push(`${w}: builder ${k} accepts a wrong link`);
    }
  }
}

export function recheck(p, c, w, errs) {
  const { model } = runtime('policy-chain');
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const g = p.given || {};
  need(TYPES.includes(p.type) && p.type === g.family, `type ${p.type}`);
  need(!c.families || c.families.includes(g.family), 'a family the context does not list');
  const ids = ORDER[`${g.family}/${g.variant}`];
  need(!!ids, 'unknown chain');
  if (!ids) return;
  const ch = model.chain(g.family, g.variant, g.dir);
  need(p.steps.length === ids.length - 1, 'one step per link after the first');
  p.steps.forEach((s, i) => {
    const link = ch.links[i + 1];
    need(s.key === ids[i + 1], `step ${i + 1} is ${s.key}, should be ${ids[i + 1]}`);
    const re = WAY[g.family][s.key][g.dir > 0 ? 0 : 1];
    need(re.test(s.options[s.correct]), `step ${s.key}: the key "${s.options[s.correct]}" points the wrong way`);
    need(s.options[s.correct].replace(/\.$/, '').toLowerCase() === link.say.toLowerCase(), `step ${s.key}: the key is not the link`);
    need(s.options.length >= 3, `step ${s.key}: fewer than three choices`);
    // A "later" option is really the next link; no other option is the right link.
    s.options.forEach((o, k) => {
      if (k === s.correct) return;
      const t = o.replace(/\.$/, '').toLowerCase();
      need(t !== link.say.toLowerCase(), `step ${s.key}: option ${k} is also the right link`);
      if (/^Not yet/.test(s.why[k])) need(ch.links[i + 2] && t === ch.links[i + 2].say.toLowerCase(), `step ${s.key}: the skipped-link option is not the next link`);
    });
  });
  need(p.solution.length === ids.length, 'the worked solution names every link');
}

export function check(data, map) {
  const errs = [];
  frame(data, 'policy-chain', 'simulator', map, errs);
  const { model } = runtime('policy-chain');
  if (!model) { errs.push('no model registered (ApMacroMath.policyChain)'); return errs; }
  if (model.stub) return errs;
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    for (const f of c.families || []) if (!TYPES.includes(f)) errs.push(`context ${c.id}: unknown family ${f}`);
    if (!c.families || !c.families.length) errs.push(`context ${c.id}: lists its families`);
  }
  chains(model, errs);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  return errs;
}
