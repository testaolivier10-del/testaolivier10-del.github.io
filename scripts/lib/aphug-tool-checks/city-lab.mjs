/* Validator for human-geography/data/tools/city-lab.json (City lab), run by
   scripts/check-aphug-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame; the bid-rent lines give von
   Thunen's rings in his order (dairy and market gardens, forest, grain,
   ranching) and the city's bands (shops and offices, industry, homes), each
   band where the model's rings() puts it; the seven city models the CED names
   and no author the CED leaves unnamed; then 300 problems per context and
   type regenerated with the model the page runs (ApHugMath.cityLab), every
   key recomputed independently:
     rings     the change's effect from its id (the rule written here)
     bidrent   both bids as A - a x d with plain arithmetic, the winner the
               higher bid, never at the crossing
     models    the model from the clue words in the description
     central   people = area x density, open when people >= threshold, the
               high-order good
     ranksize  largest / rank, primate when the largest is over 3 times the
               second
   Student text: no em dashes, no names the CED does not use for a model. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['rings', 'bidrent', 'models', 'central', 'ranksize'];
const VT_ORDER = ['dairy', 'forest', 'grain', 'ranch'], TOWN_ORDER = ['retail', 'industry', 'homes'];
const EFFECT = { fridge: /dairy ring spreads/, road: /Every ring spreads/, river: /along the river/, town: /its own set of rings/ };
const CLUES = { concentric: /rings around one downtown/, sector: /wedges that run out/, nuclei: /several separate centers/, galactic: /edge cities/, latin: /wide avenue/, seasian: /colonial port/, african: /three centers/ };
const NOT_CED = /\bGriffin[- ](and|&)[- ]Ford\b|\bMcGee\b|\bde Blij\b/i;
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s && s.options[s.correct];
const plain = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

export function recheck(p, c, w, errs) {
  const { model } = runtime('city-lab');
  const g = p.given || {}, text = plain(p.text);
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...(s.model ? s.model.pieces.map(x => x.text) : [])])].join(' ');
  need(!/—/.test(all), 'an em dash in student text');
  need(!NOT_CED.test(all), 'names an author the CED leaves unnamed');
  need(p.ctx === c.id && p.topic === c.topic, 'problem context or topic does not match its context');
  if (p.type === 'rings') {
    const m = stepOf(p, 'place').model;
    need(VT_ORDER.every((id, i) => m.key['r' + (i + 1)] === id), 'the rings key is not von Thunen\'s order');
    need(EFFECT[g.change] && EFFECT[g.change].test(right(stepOf(p, 'change'))), `change key "${right(stepOf(p, 'change'))}" does not follow from ${g.change}`);
  } else if (p.type === 'bidrent') {
    need(/Invented numbers/.test(text), 'not labeled invented');
    const uses = g.farm ? model.FARM : model.TOWN, u = uses.find(x => x.id === g.u), v = uses.find(x => x.id === g.v);
    const bu = u.A - u.a * g.d, bv = v.A - v.a * g.d;
    need(close(stepOf(p, 'bidU').cell.answer, bu), `bidU ${stepOf(p, 'bidU').cell.answer} is not ${bu}`);
    need(close(stepOf(p, 'bidV').cell.answer, bv), `bidV ${stepOf(p, 'bidV').cell.answer} is not ${bv}`);
    need(bu > 0 && bv > 0 && Math.abs(bu - bv) > 1e-9, 'a bid is 0 or less, or the bids tie');
    need(Number.isInteger(bu) && Number.isInteger(bv), 'a bid is not a whole number (no calculator)');
    need(right(stepOf(p, 'wins')) === (bu > bv ? u : v).name, 'the winner is not the higher bid');
    need(text.includes('$' + model.fmtN(u.A)) && text.includes('$' + model.fmtN(v.a)), 'the numbers are not printed');
  } else if (p.type === 'models') {
    const found = Object.keys(CLUES).filter(k => CLUES[k].test(text));
    need(found.length === 1 && found[0] === g.model, `the description reads as ${found}, the key is ${g.model}`);
    need(right(stepOf(p, 'model')) === model.CITY[g.model].full, 'model key is wrong');
    need(right(stepOf(p, 'limit')) === model.CITY[g.model].limit, 'limit key is wrong');
    if (g.model === 'concentric') { const z = stepOf(p, 'zones'); need(z && z.model.key.z1 === 'cbd' && z.model.key.z5 === 'comm', 'the concentric zones key is wrong'); }
  } else if (p.type === 'central') {
    need(/Invented numbers/.test(text), 'not labeled invented');
    const people = g.area * g.dens;
    need(close(stepOf(p, 'people').cell.answer, people), 'people key is not area x density');
    need(Number.isInteger(g.area) && people !== g.threshold, 'the area is not whole, or people equals the threshold');
    need(right(stepOf(p, 'open')).startsWith(people >= g.threshold ? 'Yes' : 'No'), 'the open key is wrong');
    need(right(stepOf(p, 'order')) === 'A heart surgery center', 'the high-order key is wrong');
  } else if (p.type === 'ranksize') {
    need(/Invented country/.test(text), 'not labeled invented');
    need(close(stepOf(p, 'expected').cell.answer, g.P1 / g.rank / 1e6), 'expected key is not largest / rank');
    const primate = g.cities[0] > 3 * g.cities[1];
    need(primate === g.primate, 'the cities do not show the pattern the problem says');
    need(right(stepOf(p, 'pattern')).includes(primate ? 'primate' : 'rank-size'), 'the pattern key is wrong');
    need(g.cities.every((x, i) => i === 0 || x < g.cities[i - 1]), 'the cities are not in rank order');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'city-lab', 'simulator', map, errs);
  const { model } = runtime('city-lab');
  if (!model) { errs.push('no model registered (ApHugMath.cityLab)'); return errs; }
  if (model.stub) return errs;
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
  for (const k of ['intro', 'howItWorks']) { if (/—/.test(data[k] || '')) errs.push(`${k}: an em dash`); if (NOT_CED.test(data[k] || '')) errs.push(`${k}: names an unnamed model's author`); }
  // Von Thunen's order and the city's, from the bid-rent lines.
  const vt = model.rings(model.FARM, {}).map(x => x.id), tw = model.rings(model.TOWN, {}).map(x => x.id);
  if (vt.join() !== VT_ORDER.join()) errs.push(`the farm bid-rent lines give rings ${vt}, not ${VT_ORDER}`);
  if (tw.join() !== TOWN_ORDER.join()) errs.push(`the city bid-rent lines give bands ${tw}, not ${TOWN_ORDER}`);
  for (const L of [model.FARM, model.TOWN]) for (let i = 0; i + 1 < L.length; i++) { const x = model.cross(L[i], L[i + 1]); if (!Number.isInteger(x)) errs.push(`${L[i].id} and ${L[i + 1].id} cross at ${x} km, not a whole number`); }
  // Refrigeration widens the dairy ring; cheaper transport widens every ring.
  const width = (rs, id) => { const b = rs.find(x => x.id === id); return b ? b.to - b.from : 0; };
  if (!(width(model.rings(model.FARM, { fridge: true }), 'dairy') > width(model.rings(model.FARM, {}), 'dairy'))) errs.push('refrigeration does not widen the dairy ring');
  const far = o => model.rings(model.FARM, o).slice(-1)[0].to;
  if (!(far({ transport: 0.5 }) > far({}))) errs.push('cheaper transport does not push the rings out');
  const ids = Object.keys(model.CITY);
  if (ids.length !== 7) errs.push('the CED names seven city models');
  for (const k of ids) { const m = model.CITY[k]; if (m.zones.length > 10) errs.push(`city model ${k}: too many zones`); if (NOT_CED.test(JSON.stringify(m))) errs.push(`city model ${k}: names an unnamed author`); }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  return errs;
}
