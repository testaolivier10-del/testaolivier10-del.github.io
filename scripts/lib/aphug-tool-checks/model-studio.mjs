/* Validator for human-geography/data/tools/model-studio.json (Model Studio), run by
   scripts/check-aphug-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems.

   Every context: a model the CED names (TYPES in the tool's model file), a
   sound model (ApHugModel.check) whose decoys never collide with its pieces,
   a figure for every free layout whose numbered spots and labels never touch
   at 330 or 600 px, an explanation for every place, authored apply cases
   with one right answer and three wrong ones (each with its reason), every
   map passing ApHugMap.check, and limits with real limits, claims and
   misreadings. Then the drill sweep (_drills.mjs: 300 seeds per context,
   every step sound) with recheck: every key recomputed here, with this
   file's own arithmetic and thresholds, not the model's. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';
import { ROOT } from '../aphug-build.mjs';

const SLUG = 'model-studio';
const DASH = /[–—]/;
const bases = {};
const base = id => { if (!bases[id]) bases[id] = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'figures', 'base', `${id}.json`), 'utf8')); return bases[id]; };
const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const TYPES = () => runtime(SLUG).model.TYPES;

export function check(data, map) {
  const errs = [];
  frame(data, SLUG, 'simulator', map, errs);
  const { model: MS, Model, Map } = runtime(SLUG);
  if (!MS || MS.stub) { errs.push('the model file is still the Phase 0 stub'); return errs; }
  const walk = (v, p) => { if (typeof v === 'string') { if (DASH.test(v)) errs.push(`${p}: an en or em dash (use a colon, a comma or two sentences)`); } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${p}.${k}`); };
  walk(data, 'data');
  const seen = new Set();
  for (const c of data.contexts || []) {
    const w = `context ${c.id}`;
    const t = (c.types || [])[0];
    if (!MS.TYPES.includes(t)) errs.push(`${w}: type "${t}" is not a model the tool knows (TYPES)`);
    if (seen.has(t)) errs.push(`${w}: model "${t}" has two contexts`); seen.add(t);
    for (const k of ['name', 'short', 'claim', 'origin', 'unit']) if (!c[k] || typeof c[k] !== 'string') errs.push(`${w}: "${k}" is required`);
    if (!Array.isArray(c.assumes) || !c.assumes.length) errs.push(`${w}: say what the model assumes (assumes)`);
    if (!MS.APPLY[c.apply && c.apply.kind]) errs.push(`${w}: unknown apply kind "${c.apply && c.apply.kind}"`);
    if (c.free && c.id !== 'dtm') errs.push(`${w}: only the demographic transition drills are free (spec section 6)`);
    // The model (generated ones are checked in the sweep).
    if (!c.build) {
      const pr = Model.check(c.model || {});
      if (pr.length) errs.push(`${w}: model: ${pr.join('; ')}`);
      const ids = new Set((c.model.pieces || []).map(p => p.id)), texts = new Set((c.model.pieces || []).map(p => p.text));
      for (const d of c.decoys || []) { if (ids.has(d.id) || texts.has(d.text)) errs.push(`${w}: decoy "${d.text}" collides with a piece`); if (d.text.length > 40) errs.push(`${w}: decoy "${d.text}" is over 40 characters`); }
      for (const s of c.model.slots) if (!c.explain || !c.explain[s.id]) errs.push(`${w}: no explanation for ${s.id}`);
      if (c.model.layout === 'free') {
        const f = MS.figure(c.figure);
        if (!f) errs.push(`${w}: a free layout needs a figure (figure: one of ${MS.figureIds.join(', ')})`);
        else if (f.spots.length !== c.model.slots.length) errs.push(`${w}: the figure has ${f.spots.length} spots for ${c.model.slots.length} places`);
      }
    } else if (!MS.GEN[c.build]) errs.push(`${w}: unknown generated model "${c.build}"`);
    if (c.figure) { const f = MS.figure(c.figure); if (!f) errs.push(`${w}: unknown figure "${c.figure}"`); else for (const px of [330, 600]) for (const o of MS.overlaps(f, px)) errs.push(`${w}: figure ${c.figure}: ${o}`); }
    // Authored apply cases.
    if (c.apply && c.apply.kind === 'choice') {
      if (!Array.isArray(c.apply.pool) || !c.apply.pool.length) errs.push(`${w}: an authored apply needs a pool`);
      for (const [i, it] of (c.apply.pool || []).entries()) {
        if (!it.q || !it.right || !it.right.t || !it.right.why) errs.push(`${w}: apply ${i}: q and right {t, why} are required`);
        if (!Array.isArray(it.wrong) || it.wrong.length < 3 || it.wrong.some(x => !x.t || !x.why)) errs.push(`${w}: apply ${i}: at least three wrong answers, each with why`);
        if (it.wrong && it.wrong.some(x => x.t === it.right.t)) errs.push(`${w}: apply ${i}: a wrong answer reads the same as the right one`);
        if (it.map) { const pr = Map.check(it.map, base(it.map.base)); if (pr.length) errs.push(`${w}: apply ${i} map: ${pr.join('; ')}`); }
      }
    }
    const L = c.limits || {};
    if (!Array.isArray(L.right) || L.right.length < 2 || L.right.some(x => !x.t || !x.why)) errs.push(`${w}: at least two limits, each with why`);
    if (!Array.isArray(L.claims) || L.claims.length < 2) errs.push(`${w}: at least two claims (what the model says)`);
    if (!Array.isArray(L.wrong) || !L.wrong.length || L.wrong.some(x => !x.t || !x.why)) errs.push(`${w}: at least one misreading, with why`);
    const all = [...(L.right || []).map(x => x.t), ...(L.claims || []), ...(L.wrong || []).map(x => x.t)];
    if (new Set(all).size !== all.length) errs.push(`${w}: two limits statements read the same`);
  }
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => MS.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types);
  return errs;
}

/* Every key, recomputed. */
export function recheck(p, c, w, errs = []) {
  const { Model, Map, Plot } = runtime(SLUG);
  const push = m => errs.push(`${w}: ${m}`);
  const steps = Object.fromEntries(p.steps.map(s => [s.key, s]));
  const pick = s => s.options[s.correct];
  // Build.
  const m = steps.build && steps.build.model;
  if (!m) { push('no build step'); return errs; }
  if (!Model.grade(m, m.key).correct) push('the build key grades wrong');
  if (m.pieces.length > m.slots.length + 2) push('more than two decoys');
  if (!c.build) {
    for (const s of c.model.slots) if (m.key[s.id] !== c.model.key[s.id]) push(`build key for ${s.id} changed`);
    const allowed = new Set([...c.model.pieces, ...(c.decoys || [])].map(x => x.id));
    for (const x of m.pieces) if (!allowed.has(x.id)) push(`unknown piece ${x.id}`);
  } else if (c.build === 'ranksize') {
    const L = Number(m.pieces.find(x => x.id === 'c1').text.replace(/\D/g, '')) / 1000;
    [1, 2, 3, 4].forEach(n => { const want = 'City of ' + thou(1000 * L / n), got = m.pieces.find(x => x.id === m.key['r' + n]); if (!got || got.text !== want) push(`rank ${n} should be ${want}`); });
  } else if (c.build === 'gravity') {
    const v = m.pairs.map(q => ({ n: q.n, v: q.p1 * q.p2 / (q.d * q.d) })).sort((a, b) => b.v - a.v);
    v.forEach((q, i) => { if (m.key['t' + i] !== 'p' + q.n) push(`gravity rank ${i + 1} should be pair ${q.n}`); });
    if (!(v[0].v >= 1.4 * v[1].v && v[1].v >= 1.4 * v[2].v)) push('gravity pairs are too close to rank');
  }
  // Apply.
  const a = p.apply, k = c.apply.kind, s1 = steps.apply;
  if (!s1) push('no apply step');
  else if (k === 'choice') {
    const it = c.apply.pool.find(x => x.right.t === pick(s1));
    if (!it) push('the apply key is not an authored right answer');
    if (a.fig && a.fig.kind === 'map' && Map.check(a.fig.map, base(a.fig.map.base)).length) push('the apply map fails ApHugMap.check');
  } else if (k === 'rates') {
    const { b, d } = a;
    const st = b < d ? 5 : b >= 30 && d >= 20 ? 1 : b >= 30 ? 2 : b - d >= 5 ? 3 : 4;
    if (s1.correct !== st - 1) push(`rates ${b}/${d}: stage should be ${st}`);
    if (!close(steps.rate.cell.answer, (b - d) / 10)) push('RNI should be (CBR - CDR) / 10');
  } else if (k === 'epi') {
    const st = a.inf >= 55 ? 1 : a.inf >= 35 ? 2 : a.le < 75 ? 3 : 4;
    if (s1.correct !== st - 1) push(`epi ${a.inf}%/${a.le}: stage should be ${st}`);
  } else if (k === 'malthus') {
    const [pp, ff] = a.last;
    if ((pp > ff) !== /^Yes: population/.test(pick(s1))) push('malthus key does not match the data');
    if (Math.abs(pp - ff) < 10) push('malthus lines end too close to read');
  } else if (k === 'ravenstein') {
    if (a.data.kind === 'distance') { if (!a.data.v.every((x, i, v) => !i || x < v[i - 1])) push('distance bars must fall'); if (!/short distance/.test(pick(s1))) push('distance key'); }
    else { if (!a.data.out.every((x, i) => x > 0 && x < a.data.inn[i])) push('counterflow data'); if (!/counterflow/.test(pick(s1))) push('counterflow key'); }
  } else if (k === 'bidrent') {
    const bids = a.uses.map(u => u.a - u.b * a.d), best = bids.indexOf(Math.max(...bids));
    if (s1.correct !== best) push('bid-rent winner');
    if (!close(steps.rent.cell.answer, bids[best])) push('bid-rent number');
    const srt = [...bids].sort((x, y) => y - x); if (srt[0] - srt[1] < 4) push('bid-rent bids too close');
  } else if (k === 'christaller') {
    const lvl = a.pl.findIndex(x => x.p >= a.T);
    if (s1.correct !== lvl) push('central place: smallest place with enough people');
    if (lvl < 0) push('no place meets the threshold');
  } else if (k === 'ranksize') {
    const primate = a.pops[0] >= 3 * a.pops[1];
    if (primate !== a.primate || /primate/i.test(pick(s1)) !== primate) push('rank-size pattern');
    if (!close(steps.rule.cell.answer, a.L / a.k)) push('rank-size number');
  } else if (k === 'gravity') {
    if (!close(s1.cell.answer, a.p.p1 * a.p.p2 / (a.p.d * a.p.d))) push('gravity index');
    if (!/4 times/.test(pick(steps.apply2))) push('halving distance gives 4 times');
  } else if (k === 'leastcost') {
    if (!close(s1.cell.answer, a.inW * a.D * a.c)) push('least cost shipping');
    if ((a.inW > 1) !== /mine/.test(pick(steps.apply2))) push('least cost location');
  } else if (k === 'worldsystem') {
    const raw = a.vals.map(v => v[0]), want = a.ask === 'periphery' ? raw.indexOf(Math.max(...raw)) : raw.indexOf(Math.min(...raw));
    if (s1.correct !== want) push(`world system: ${a.ask}`);
  }
  if (a.fig && a.fig.kind === 'plot') { try { const sv = Plot.svg(a.fig.spec); if (!/<svg/.test(sv) || String(a.fig.spec.label).length < 20) push('plot'); } catch (e) { push('plot: ' + e.message); } }
  // Limits.
  const lim = steps.limits;
  if (!lim) push('no limits step');
  else {
    const rights = new Set(c.limits.right.map(x => x.t));
    if (!rights.has(pick(lim))) push('the limits key is not a limit');
    lim.options.forEach((o, i) => { if (i !== lim.correct && rights.has(o)) push('two limits in one question'); });
  }
  return errs;
}
