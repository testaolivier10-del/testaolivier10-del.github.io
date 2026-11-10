/* Validator for human-geography/data/tools/borders-lab.json (Borders lab), run by
   scripts/check-aphug-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, the UNCLOS limits (12, 24 and 200
   nautical miles, copied here so a typo in the model cannot slip through),
   the real cases (none on a disputed feature, every one dated, marks legible
   on the world map at 360 px), then 300 problems per context and type
   regenerated with the model the page runs (ApHugMath.bordersLab), every key
   recomputed independently:
     boundary  antecedent or subsequent from the two years in the story; the
               other type from the story's clue words; relict or working
     shape     the shape the figure draws, and that shape's challenge
     forces    centripetal or centrifugal and the factor or outcome from the
               scene bank, found by the scene's text
     sea       the zone at the ship's distance from the limits here, the
               right answer for that zone and ship, the EEZ overlap 400 - D
   Student text: no em dashes, every case labeled invented. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';
import { ROOT } from '../aphug-build.mjs';

export const TYPES = ['boundary', 'shape', 'forces', 'sea'];
const LIMITS = { ts: 12, cz: 24, eez: 200 };
const B = { antecedent: 'Antecedent boundary', subsequent: 'Subsequent boundary', consequent: 'Consequent boundary', superimposed: 'Superimposed boundary', geometric: 'Geometric boundary', relict: 'Relict boundary' };
const CLUE = { geometric: /straight line along the 41st parallel/, consequent: /speak Ardic on one side and Bessan on the other/, superimposed: /empire that ruled both lands/, relict: /joined into one/ };
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s && s.options[s.correct];
const plain = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/* The map Explore draws for a real case: its region, one mark. */
export const realSpec = x => ({ base: x.base, render: 'reference', label: `Map of the region with the boundary marked ${x.mark}: ${x.name}`, marks: [{ at: x.at, text: x.mark }] });

export function recheck(p, c, w, errs) {
  const { model } = runtime('borders-lab');
  const g = p.given || {}, text = plain(p.text);
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || [])])].join(' ');
  need(!/—/.test(all), 'an em dash in student text');
  need(/Invented case\./.test(text), 'the case is not labeled invented');
  need(p.ctx === c.id && p.topic === c.topic, 'problem context or topic does not match its context');
  if (p.type === 'boundary') {
    const yrs = (text.match(/\b(1[6-9]\d\d|20\d\d)\b/g) || []).map(Number);
    need(yrs.includes(g.drawn) && yrs.includes(g.settled), 'the story does not print both years');
    need(g.drawn <= 2000, 'a year in the future');
    const when = g.drawn < g.settled ? 'antecedent' : 'subsequent';
    need(right(stepOf(p, 'when')).startsWith(B[when]), `when key "${right(stepOf(p, 'when'))}" is not ${B[when]}`);
    const found = Object.keys(CLUE).filter(k => CLUE[k].test(text));
    need(found.length === 1, `the story shows ${found.length} extra types (${found}); exactly one keeps the key single`);
    need(right(stepOf(p, 'extra')) === B[found[0]], `extra key "${right(stepOf(p, 'extra'))}" is not ${B[found[0]]}`);
    need(!['consequent', 'superimposed'].includes(found[0]) || when === 'subsequent', `a ${found[0]} line must come after the people it follows or cuts`);
    need(/no longer divides/.test(right(stepOf(p, 'function'))) === (found[0] === 'relict'), 'the function key does not match relict');
  } else if (p.type === 'shape') {
    need(p.figure.shape === g.shape && model.SHAPES[g.shape], 'the figure is not the shape asked');
    need(right(stepOf(p, 'shape')) === model.SHAPES[g.shape].name, 'shape key is wrong');
    need(right(stepOf(p, 'challenge')) === model.SHAPES[g.shape].challenge, 'challenge key is wrong');
    need(g.shape !== 'perforated' || model.SHAPES.perforated.d.length === 2, 'a perforated outline needs the state inside');
    need(g.shape !== 'fragmented' || model.SHAPES.fragmented.d.length >= 3, 'a fragmented outline needs pieces');
  } else if (p.type === 'forces') {
    const sc = model.SCENES.find(s => text.includes(s.t));
    need(sc, 'the scene is not in the bank');
    if (!sc) return;
    need(right(stepOf(p, 'force')).startsWith(sc.force === 'centripetal' ? 'Centripetal' : 'Centrifugal'), 'force key is wrong');
    if (sc.force === 'centripetal') need(right(stepOf(p, 'outcome')) === model.OUTCOMES[sc.out], 'outcome key is wrong');
    else need(right(stepOf(p, 'factor')) === model.FACTORS[sc.factor].name, `factor key "${right(stepOf(p, 'factor'))}" is not ${model.FACTORS[sc.factor].name}`);
  } else if (p.type === 'sea') {
    const z = g.nm <= LIMITS.ts ? 'ts' : g.nm <= LIMITS.cz ? 'cz' : g.nm <= LIMITS.eez ? 'eez' : 'hs';
    const want = g.ship === 1 ? (z === 'hs' ? /^No state/ : /^Country A/) : g.ship === 2 ? (z === 'ts' || z === 'cz' ? /^Stop and search/ : /^Not enforce/) : (z === 'ts' ? /innocent passage/ : /^Nothing/);
    need(want.test(right(stepOf(p, 'ship'))), `ship key "${right(stepOf(p, 'ship'))}" is wrong at ${g.nm} nm (${z})`);
    need(new RegExp(`\\b${g.nm} nautical miles from`).test(right(stepOf(p, 'ship')) ? stepOf(p, 'ship').label : ''), 'the distance is not printed');
    need(close(stepOf(p, 'overlap').cell.answer, 2 * LIMITS.eez - g.D), 'overlap key is not 400 - D');
    need(g.D > LIMITS.eez && g.D < 2 * LIMITS.eez, 'the sea is too wide or too narrow for an overlap');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'borders-lab', 'simulator', map, errs);
  const { model, Map } = runtime('borders-lab');
  if (!model) { errs.push('no model registered (ApHugMath.bordersLab)'); return errs; }
  if (model.stub) return errs;
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
  for (const k of ['intro', 'howItWorks']) if (/—/.test(data[k] || '')) errs.push(`${k}: an em dash`);
  model.ZONES.slice(0, 3).forEach(z => { if (LIMITS[z.id] !== z.to) errs.push(`zone ${z.id} ends at ${z.to}, UNCLOS says ${LIMITS[z.id]}`); });
  // The real cases on the world map: legible, dated, no disputed feature.
  for (const x of model.REAL) {
    const base = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'figures', 'base', `${x.base}.json`), 'utf8'));
    for (const e of Map.check(realSpec(x), base)) errs.push(`real case ${x.mark} map: ${e}`);
    const q = Map.project(base, x.at);
    if (!(q[0] > 0 && q[0] < base.width && q[1] > 0 && q[1] < base.height)) errs.push(`real case ${x.mark}: its mark is off the ${x.base} map`);
    if (!/\b(1[89]\d\d|20\d\d)\b/.test(x.text)) errs.push(`real case ${x.mark}: no year`);
    if (/—/.test(x.text + x.name)) errs.push(`real case ${x.mark}: an em dash`);
    if (/Kashmir|Crimea|Taiwan|Palestine|Western Sahara|Kosovo/i.test(x.text + x.name)) errs.push(`real case ${x.mark}: a disputed place needs the accuracy-risks.md pattern; keep it out of keyed cases`);
    for (const t of x.types) if (!B[t]) errs.push(`real case ${x.mark}: unknown type ${t}`);
  }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  return errs;
}
