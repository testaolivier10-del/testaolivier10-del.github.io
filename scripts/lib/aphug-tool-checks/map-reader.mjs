/* Validator for human-geography/data/tools/map-reader.json (Map reader), run by
   scripts/check-aphug-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems. The frame; every base a context names
   exists; the Explore maps (each base x each type x each class-break mode)
   pass ApHugMap.check; then 300 problems per context and type regenerated
   with the model the page runs (ApHugMath.mapReader) and every key
   recomputed here: every map passes ApHugMap.check (labels legible and apart
   at 360 px) and carries "invented" or a dated source, no disputed place is
   valued, marked or named; the map type; the class of a marked place and the
   highest marked place; the pattern's named places at the right end of the
   legend; the most crowded province by people per km²; the lumped pair and
   the legend gap; the limit; the isoline range from the lines' own points
   and the fastest change from their spacing. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';
import { ROOT } from '../aphug-build.mjs';

export const TYPES = ['kind', 'legend', 'pattern', 'breaks', 'limits', 'isoline'];
const step = (p, k) => p.steps.find(s => s.key === k);
const plain = s => String(s).replace(/<[^>]+>/g, ' ');
const right = (p, k) => { const s = step(p, k); return s ? plain(s.options[s.correct]) : ''; };
const BASE_DIR = join(ROOT, 'human-geography', 'figures', 'base');
const bases = {};
function loadBase(id) {
  if (!bases[id]) { const p = join(BASE_DIR, `${id}.json`); if (!existsSync(p)) return null; bases[id] = JSON.parse(readFileSync(p, 'utf8')); }
  return bases[id];
}
export function ready(data) {
  const { model } = runtime('map-reader');
  const ids = model.basesFor(data.contexts || []).concat(data.exploreBases || []);
  const o = {};
  for (const id of ids) { const b = loadBase(id); if (b) o[id] = b; }
  model.setBases(o);
  return o;
}

function mapProblems(spec, w, bad) {
  const { Map } = runtime();
  const B = loadBase(spec.base);
  if (!B) return bad(`unknown base ${spec.base}`);
  for (const p of Map.check(spec, B)) bad(`map: ${p}`);
  if (spec.render !== 'reference' && !spec.invented && !spec.source) bad('a thematic map with neither invented nor a source');
  const disputed = new Set(B.features.filter(f => f.disputed).map(f => f.id));
  for (const id of Object.keys(spec.values || {})) if (disputed.has(id)) bad(`disputed ${id} carries a value`);
  for (const m of spec.marks || []) if (typeof m.at === 'string' && disputed.has(m.at)) bad(`disputed ${m.at} is marked`);
  for (const s of (spec.symbols || {}).items || []) if (typeof s.at === 'string' && disputed.has(s.at)) bad(`disputed ${s.at} has a symbol`);
  return B;
}

export function recheck(p, c, w, errs) {
  const { model, Map } = runtime('map-reader');
  const g = p.given, bad = m => errs.push(`${w}: ${m}`), f = p.figure;
  if (!g || !f) return bad('no givens or no figure');
  let B = null;
  if (f.kind === 'map') B = mapProblems(f.spec, w, bad);
  else if (f.kind === 'cartogram') {
    const sq = f.data.squares;
    if (sq.length !== 8) bad('a cartogram of Country A has 8 squares');
    for (let i = 0; i < sq.length; i++) for (let j = i + 1; j < sq.length; j++) {
      const a = sq[i], b = sq[j], need = (a.s + b.s) / 2;
      if (Math.abs(a.x - b.x) < need && Math.abs(a.y - b.y) < need) bad(`cartogram squares ${a.id} and ${b.id} overlap`);
    }
    for (const a of sq) if (a.x - a.s / 2 < 0 || a.x + a.s / 2 > 600 || a.y - a.s / 2 < 0 || a.y + a.s / 2 > 400) bad(`cartogram square ${a.id} leaves the frame`);
    for (const a of sq) for (const b of sq) if (a.value > b.value * 1.0001 && a.s < b.s) bad('a larger value has a smaller square');
  } else bad(`unknown figure kind ${f.kind}`);
  const disputedNames = B ? B.features.filter(x => x.disputed).map(x => x.name) : [];
  const allText = plain([p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, ...(s.options || [])])].join(' '));
  for (const n of disputedNames) if (allText.includes(n)) bad(`names the disputed place ${n}`);
  if (/[—]/.test(allText)) bad('an em dash');
  // The key line names exactly the marked places.
  if (f.kind === 'map' && f.key) for (const k of f.key) { const mk = (f.spec.marks || []).find(m => m.text === k.mark); if (!mk || (typeof mk.at === 'string' && Map.feature(B, mk.at).name !== k.name)) bad(`key ${k.mark} does not match its mark`); }
  const order = ['reference', 'choropleth', 'dot', 'symbol', 'isoline', 'cartogram'];
  switch (p.type) {
    case 'kind': {
      const rendered = f.kind === 'cartogram' ? 'cartogram' : f.spec.render;
      if (rendered !== g.render) bad(`drew ${rendered}, asked about ${g.render}`);
      if (step(p, 'kind').correct !== order.indexOf(rendered)) bad('kind key');
      if (!right(p, 'best').toLowerCase().startsWith(model.KINDS[rendered].best.slice(0, 20).toLowerCase())) bad('best-use key');
      break;
    }
    case 'legend': {
      const marks = f.spec.marks.map(m => m.at);
      if (g.mode === 'choropleth') {
        const k = f.spec.values[g.ask];
        if (step(p, 'klass').correct !== k) bad(`class key ${step(p, 'klass').correct}, the map says ${k}`);
        const mx = Math.max(...marks.map(id => f.spec.values[id]));
        const tops = marks.filter(id => f.spec.values[id] === mx);
        if (tops.length !== 1) bad('the highest marked class is not unique');
        if (marks[step(p, 'top').correct] !== tops[0]) bad('top key');
        if (f.spec.classes.length !== step(p, 'klass').options.length) bad('one option per class');
      } else {
        const val = {}; for (const s of f.spec.symbols.items) val[s.at] = s.value;
        const vs = marks.map(id => val[id]), mx = Math.max(...vs);
        if (vs.filter(v => v === mx).length !== 1) bad('the largest marked symbol is not unique');
        if (vs[step(p, 'top').correct] !== mx) bad('top key');
        if (!/^Its circle has 4 times the area/.test(right(p, 'area'))) bad('area key');
      }
      if (marks.length < 3) bad('fewer than three marks');
      break;
    }
    case 'pattern': {
      const cls = f.spec.values, L = B.features.filter(x => !x.context && !x.disputed);
      const v = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[g.dir], al = id => { const x = Map.feature(B, id).c; return x[0] * v[0] + x[1] * v[1]; };
      const sorted = L.map(x => al(x.id)).sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)];
      for (const id of g.top) { if (cls[id] !== 3) bad(`${id} is named as high but is in class ${cls[id]}`); if (!(al(id) > median)) bad(`${id} is not toward the ${g.dir}`); }
      for (const id of g.low) if (cls[id] !== 0) bad(`${id} is named as low but is in class ${cls[id]}`);
      if (cls[g.big] >= 2) bad(`the "largest place" distractor ${g.big} is in a high class`);
      const k = right(p, 'pattern');
      for (const id of g.top) if (!k.includes(Map.feature(B, id).name)) bad(`the key does not name ${id}`);
      if (!k.includes(`in the ${g.dir} of`)) bad('the key does not name the direction');
      // The top class leans the right way: its mean position is past the median.
      const topMean = L.filter(x => cls[x.id] === 3).reduce((s, x) => s + al(x.id), 0) / L.filter(x => cls[x.id] === 3).length;
      if (!(topMean > median)) bad('the top class does not lean toward the named direction');
      break;
    }
    case 'breaks': {
      if (g.mode === 'totals') {
        const ids = Object.keys(g.people), d = id => g.people[id] / g.land[id];
        const maxD = ids.reduce((a, b) => d(b) > d(a) ? b : a), maxT = ids.reduce((a, b) => g.people[b] > g.people[a] ? b : a);
        if (maxD !== g.maxD || maxT !== g.maxT) bad('totals: the most crowded or most populous province is wrong');
        if (maxD === maxT) bad('totals: the most crowded province is also the most populous (nothing to spot)');
        if (f.spec.values[maxT] !== 3) bad('totals: the most populous province is not the darkest');
        if (!right(p, 'dense').startsWith(Map.feature(B, maxD).name)) bad('dense key');
        const rows = f.table.rows; if (rows.length !== 8) bad('the table has 8 provinces');
      } else if (g.mode === 'lumped') {
        const ids = Object.keys(g.vals), same = ids.filter(id => g.cls[id] === g.cls[g.lo]);
        const lo = same.reduce((a, b) => g.vals[b] < g.vals[a] ? b : a), hi = same.reduce((a, b) => g.vals[b] > g.vals[a] ? b : a);
        if (lo !== g.lo || hi !== g.hi) bad('lumped: the far-apart pair is wrong');
        if (g.cls[g.near] === g.cls[g.lo]) bad('lumped: the different-class distractor shares the class');
        if (g.vals[hi] - g.vals[lo] < 40) bad('lumped: the pair is not far apart');
        if (!right(p, 'which').startsWith(Map.feature(B, lo).name)) bad('which key');
      } else {
        const inGap = Object.keys(g.vals).filter(id => g.vals[id] >= 20 && g.vals[id] < 25);
        if (inGap.length !== 1 || inGap[0] !== g.gap) bad('gap: exactly one province must fall in the gap');
        if (f.spec.values[g.gap] != null) bad('gap: the province in the gap is shaded');
        if (!/^None/.test(right(p, 'which'))) bad('gap key');
      }
      break;
    }
    case 'limits': {
      const k = right(p, 'cannot');
      const want = g.time ? 'How the values have changed' : { choropleth: 'Where inside', dot: 'The rate per 1,000', symbol: 'How the amount is spread', reference: 'How many people live', isoline: 'The exact value' }[g.render];
      if (!k.startsWith(want)) bad(`limits key "${k.slice(0, 30)}" for ${g.render}`);
      const rendered = f.kind === 'cartogram' ? 'cartogram' : f.spec.render;
      if (rendered !== g.render) bad('limits: the map type does not match');
      break;
    }
    case 'isoline': {
      const L = f.spec.isolines.lines, xAt = (l, y) => l.points.reduce((b, q) => Math.abs(q[1] - y) < Math.abs(b[1] - y) ? q : b)[0];
      const idx = pt => { let i = 0; while (i < L.length && xAt(L[i], pt[1]) < pt[0]) i++; return i - 1; };
      const iA = idx(g.A), iB = idx(g.B);
      if (iA !== g.iA || iB !== g.iB) bad(`isoline: A is between lines ${iA} and ${iA + 1}, B ${iB}; the problem says ${g.iA}, ${g.iB}`);
      if (step(p, 'range').correct !== iA) bad('range key');
      const gap = i => xAt(L[i + 1], 200) - xAt(L[i], 200);
      const fastA = gap(iA) < gap(iB);
      if (!right(p, 'fast').startsWith('Near ' + (fastA ? 'A' : 'B'))) bad('fast key');
      if (!(Math.max(gap(iA), gap(iB)) > 1.5 * Math.min(gap(iA), gap(iB)))) bad('isoline: the two spacings are too alike to compare');
      break;
    }
    default: bad(`unknown type ${p.type}`);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'map-reader', 'simulator', map, errs);
  const { model, Map } = runtime('map-reader');
  if (!model) { errs.push('no model registered (ApHugMath.mapReader)'); return errs; }
  if (model.stub) return errs;
  for (const c of data.contexts || []) for (const b of c.bases || []) if (!loadBase(b)) errs.push(`context ${c.id}: no base map "${b}"`);
  for (const b of data.exploreBases || []) if (!loadBase(b)) errs.push(`exploreBases: no base map "${b}"`);
  ready(data);
  const have = new Set((data.contexts || []).flatMap(c => c.types || []));
  for (const t of TYPES) if (!have.has(t)) errs.push(`no context drills "${t}"`);
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}"`);
  // Explore: every base, every map type, every class-break mode.
  for (const b of data.exploreBases || []) for (const render of ['reference', 'choropleth', 'dot', 'symbol']) for (const br of render === 'choropleth' ? ['even', 'lumped', 'totals'] : ['even']) {
    try { const x = model.exploreSpec(b, render, { breaks: br }); for (const pr of Map.check(x.spec, loadBase(b))) errs.push(`explore ${b} ${render} ${br}: ${pr}`); } catch (e) { errs.push(`explore ${b} ${render}: ${e.message}`); }
  }
  for (const render of ['isoline', 'cartogram']) { try { const x = model.exploreSpec('country-a', render, {}); if (render === 'isoline') for (const pr of Map.check(x.spec, loadBase('country-a'))) errs.push(`explore isoline: ${pr}`); } catch (e) { errs.push(`explore ${render}: ${e.message}`); } }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || [undefined]);
  return errs;
}
