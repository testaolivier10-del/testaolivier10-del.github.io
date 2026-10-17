/* Validator for statistics/data/tools/sampling-lab.json (Sampling lab), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. The frame, the explore scenes (each makes a
   population whose strata, clusters and convenience spot exist), every
   context's arithmetic (strata sizes add to N, clusters times size is N,
   the systematic and cluster sample sizes divide), then 300 problems per
   context and type through the page's own generator, each key recomputed
   here independently: the method named matches the procedure the text
   describes, the systematic k is N / n, the proportional allocation is
   recomputed by the largest remainder from the stated sizes, the number of
   clusters is the sample size over the cluster size, and the bias kind and
   direction are the authored ones. Student-facing text has no em or en
   dashes and no hyphen used as punctuation. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const DASH = /[—–]|\s-\s/;
const BIASES = ['undercoverage', 'nonresponse', 'response', 'voluntary', 'convenience'];

function texts(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => texts(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'about') texts(x, out);
  return out;
}
function largestRemainder(sizes, n) {
  const N = sizes.reduce((a, b) => a + b, 0);
  const raw = sizes.map(s => (n * s) / N), out = raw.map(Math.floor);
  let left = n - out.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => [i, x - Math.floor(x)]).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length][0]]++;
  return out;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'sampling-lab', 'simulator', map, errs);
  const { M, model } = runtime('sampling-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/sampling-lab.js does not register ApStatMath.samplingLab with a generate()'); return errs; }
  for (const t of texts(data)) if (DASH.test(t)) errs.push(`a dash used as punctuation: "${t.slice(0, 60)}…"`);

  // Explore scenes
  for (const sc of (data.explore && data.explore.scenes) || []) {
    const w = `scene ${sc.id}`;
    if (!['houses', 'plots', 'rooms'].includes(sc.kind)) errs.push(`${w}: kind must be houses, plots or rooms`);
    for (const k of ['name', 'unit', 'units', 'variable', 'unitOf', 'abbr', 'stratWhy', 'clusterWhy', 'convWhy']) if (!sc[k]) errs.push(`${w}: "${k}" is required`);
    if (sc.voluntary && !sc.volWhy) errs.push(`${w}: a voluntary scene needs volWhy`);
    if (!sc.voluntary && !sc.noVoluntary) errs.push(`${w}: say why there is no voluntary response sample (noVoluntary)`);
    let pop;
    try { pop = model.population(sc); } catch (e) { errs.push(`${w}: ${e.message}`); continue; }
    if (!pop.N || pop.units.some(u => !Number.isFinite(u.value))) errs.push(`${w}: the population has a value that is not a number`);
    if (pop.strata.some(s => !s.n)) errs.push(`${w}: a stratum is empty`);
    if ((sc.clusters.names || []).length !== pop.clusters.length) errs.push(`${w}: ${pop.clusters.length} clusters but ${(sc.clusters.names || []).length} names`);
    // every random method's draw has the size it says and no repeats
    for (const m of model.METHODS) {
      const d = model.draw(M.rng(11), pop, m, sc.n, sc);
      if (!d.ok) { if (m !== 'vol' || sc.voluntary) errs.push(`${w}: ${m} cannot draw`); continue; }
      if (new Set(d.picks).size !== d.picks.length) errs.push(`${w}: ${m} picked a unit twice`);
      if (m !== 'cluster' && d.picks.length !== sc.n) errs.push(`${w}: ${m} drew ${d.picks.length}, not n = ${sc.n}`);
      const mean = d.picks.reduce((a, i) => a + pop.units[i].value, 0) / d.picks.length;
      if (Math.abs(mean - d.mean) > 1e-9) errs.push(`${w}: ${m} reports a mean that is not its sample's mean`);
      if (m === 'strat' && d.alloc.join() !== largestRemainder(pop.strata.map(s => s.n), sc.n).join()) errs.push(`${w}: stratified allocation is not proportional`);
      if (m === 'sys' && (d.k !== Math.floor(pop.N / sc.n) || d.start < 1 || d.start > d.k)) errs.push(`${w}: systematic k or start is wrong`);
    }
  }

  // Contexts: the arithmetic the problems rely on
  for (const c of data.contexts || []) {
    const w = `context ${c.id}`;
    for (const k of ['lead', 'who', 'verb', 'list', 'unit', 'units', 'param', 'conv', 'convWhy']) if (!c[k]) errs.push(`${w}: "${k}" is required`);
    if (c.vol && !c.volWhy) errs.push(`${w}: vol needs volWhy`);
    if (!c.strata || !Array.isArray(c.strata.groups) || !c.clusters || !Array.isArray(c.sysN) || !Array.isArray(c.stratN) || !Array.isArray(c.clusterN) || !c.N || !c.n) { errs.push(`${w}: needs N, n, strata.groups, clusters, sysN, stratN and clusterN`); continue; }
    const sum = c.strata.groups.reduce((a, g) => a + g.size, 0);
    if (sum !== c.N) errs.push(`${w}: strata sizes add to ${sum}, not N = ${c.N}`);
    if (c.clusters.count * c.clusters.size !== c.N) errs.push(`${w}: ${c.clusters.count} clusters of ${c.clusters.size} is not N = ${c.N}`);
    for (const n of c.sysN) if (c.N % n) errs.push(`${w}: systematic n = ${n} does not divide N`);
    for (const n of c.clusterN) if (n % c.clusters.size) errs.push(`${w}: cluster sample size ${n} is not a whole number of clusters`);
    if (!c.biases || c.biases.length < 2) errs.push(`${w}: at least two bias scenarios`);
    for (const b of c.biases || []) {
      if (!BIASES.includes(b.kind)) errs.push(`${w}: bias kind "${b.kind}"`);
      if (!['over', 'under'].includes(b.dir)) errs.push(`${w}: bias direction "${b.dir}"`);
      for (const k of ['text', 'why', 'how']) if (!b[k]) errs.push(`${w}: a bias needs "${k}"`);
    }
  }

  // Problems: regenerate and recompute every key (only on a sound frame)
  if (errs.length) return errs;
  const NAMES = model.NAME;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const plain = p.text.replace(/<[^>]+>/g, '');
    const step = k => p.steps.find(s => s.key === k);
    const right = s => s.options[s.correct];
    if (p.type === 'method') {
      const m = p.figure.method, s = step('method');
      if (right(s).toLowerCase() !== NAMES[m]) errs.push(`${w}: the key "${right(s)}" is not ${NAMES[m]}`);
      // the text describes that method, independently read
      const looks = /every [0-9]+(st|nd|rd|th)/.test(plain) ? 'sys' : /simple random sample from each/.test(plain) ? 'strat' : /at random and .* every one of/.test(plain) ? 'cluster'
        : /choose(s)? to (answer|fill|call)|call in|calls?\b|fill it in/.test(plain) && !/random number/.test(plain) ? 'vol' : /random number generator to choose/.test(plain) ? 'srs' : 'conv';
      if (looks !== m) errs.push(`${w}: the text reads as ${looks}, the key says ${m}`);
      if (m === 'sys' && !plain.includes(`random number from 1 to ${Math.floor(c.N / c.n)}`)) errs.push(`${w}: systematic start range is not 1 to N / n`);
    }
    if (p.type === 'procedure') {
      const want = { label: `from 1 to ${c.N}.`, generate: `integers from 1 to ${c.N}.`, repeats: 'Ignore any repeated number', select: `first ${c.n} different numbers` };
      for (const [k, frag] of Object.entries(want)) if (!step(k) || !right(step(k)).includes(frag)) errs.push(`${w}: procedure step ${k} key is "${step(k) && right(step(k))}"`);
    }
    if (p.type === 'bias') {
      const b = c.biases.find(x => plain.includes(x.text.replace(/"/g, '"')));
      if (!b) { errs.push(`${w}: bias text not found among the context's scenarios`); return; }
      if (right(step('bias')) !== model.BIAS[b.kind]) errs.push(`${w}: bias key "${right(step('bias'))}" is not ${b.kind}`);
      if (!right(step('direction')).includes(b.dir === 'over' ? 'overestimate' : 'underestimate')) errs.push(`${w}: direction key is wrong`);
    }
    if (p.type === 'numbers') {
      const k = step('k'), al = step('alloc'), m = step('m');
      if (k) { const n = +(/sample of (\d+) of the/.exec(plain) || [])[1]; if (k.cell.answer !== c.N / n) errs.push(`${w}: k = ${k.cell.answer}, not ${c.N} / ${n}`); if (!right(step('start')).includes(`1 to ${c.N / n}`)) errs.push(`${w}: start range key`); }
      if (al) {
        const nn = +(/stratified random sample of (\d+)/.exec(plain) || [])[1], gname = (/come from (.+)\?/.exec(al.label) || [])[1];
        const h = c.strata.groups.findIndex(g => g.name === gname);
        if (h < 0) errs.push(`${w}: allocation step names no stratum`);
        else if (al.cell.answer !== largestRemainder(c.strata.groups.map(g => g.size), nn)[h]) errs.push(`${w}: allocation ${al.cell.answer} is not proportional`);
      }
      if (m) { const want = +(/cluster sample of (\d+)/.exec(plain) || [])[1]; if (m.cell.answer * c.clusters.size !== want) errs.push(`${w}: ${m.cell.answer} clusters of ${c.clusters.size} is not ${want}`); }
      if (!k && !al && !m) errs.push(`${w}: a numbers problem with no number step`);
    }
  }, c => c.types || model.TYPES);
  return errs;
}
