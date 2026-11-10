/* Validator for human-geography/data/tools/diffusion-lab.json (Diffusion lab), run by
   scripts/check-aphug-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, the map network (every place
   inside Country A, none closer than 28 px), every hearth list (each kind's
   spread looks like that kind), then 300 problems per context and type
   regenerated with the model the page runs (ApHugMath.diffusionLab), every
   key recomputed independently:
     diffusion  the hearth from the figure (the one place at Step 1), the type
                classified from the figure alone (changed places: stimulus;
                arrows to far places with nothing between: relocation; steps
                that follow size: hierarchical; steps that follow distance:
                contagious), relocation or expansion from that type
     mixed      the hearth; large cities all at Step 2; every later place near
                an earlier one
     migration  each numbered factor's role and cause from the factor bank
     kinds      forced or voluntary and the kind from the scene bank
     ravenstein every number with plain arithmetic from `given`, the law from
                the variant
   Student text: no em dashes, no names the CED does not use for a model,
   every case labeled invented. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['diffusion', 'mixed', 'migration', 'kinds', 'ravenstein'];
const KIND_NAME = { relocation: 'Relocation diffusion', contagious: 'Contagious diffusion', hierarchical: 'Hierarchical diffusion', stimulus: 'Stimulus diffusion' };
const ROLE_NAME = { push: 'Push factor', pull: 'Pull factor', obstacle: 'Intervening obstacle', opportunity: 'Intervening opportunity' };
const LAW = { short: /short distance/, counter: /counterflow/, centers: /big centers/, women: /Women migrate more/ };
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s && s.options[s.correct];
const plain = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const NOT_CED = /\bLee'?s? (model|theory|laws?)\b|\bZelinsky\b/i;

/* The type of a spread, read from the picture only. */
export function classify(sp, model) {
  const ids = Object.keys(sp.steps), P = model.BY, d = (a, b) => Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y);
  if (Object.keys(sp.changed || {}).length) return 'stimulus';
  if ((sp.arrows || []).length) {
    // Relocation: only the hearth and the arrow ends; every arrow end far from the hearth.
    const ends = new Set(sp.arrows.map(a => a[1]));
    return ids.every(id => id === sp.hearth || ends.has(id)) && [...ends].every(e => d(sp.hearth, e) >= 200) ? 'relocation' : 'unknown';
  }
  const bySize = ids.every(id => id === sp.hearth || sp.steps[id] === Math.max(2, P[id].rank));
  if (bySize && ids.length === model.PLACES.length) return 'hierarchical';
  // Contagious: a place's step never goes down as distance from the hearth goes up.
  const sorted = ids.slice().sort((a, b) => d(sp.hearth, a) - d(sp.hearth, b));
  const monotone = sorted.every((id, i) => i === 0 || sp.steps[id] >= sp.steps[sorted[i - 1]]);
  return monotone ? 'contagious' : 'unknown';
}

export function recheck(p, c, w, errs) {
  const { model, Calc } = runtime('diffusion-lab');
  const g = p.given || {}, text = plain(p.text);
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || [])])].join(' ');
  need(!/—/.test(all), 'an em dash in student text');
  need(!NOT_CED.test(all), 'names a model the CED does not name');
  need(/Invented (case|survey)/.test(text), 'the case is not labeled invented');
  need(p.ctx === c.id && p.topic === c.topic, 'problem context or topic does not match its context');
  if (p.type === 'diffusion' || p.type === 'mixed') {
    const sp = p.figure && p.figure.spread;
    need(sp && p.figure.letters, 'no spread figure');
    if (!sp) return;
    const ones = Object.keys(sp.steps).filter(id => sp.steps[id] === 1);
    need(ones.length === 1 && ones[0] === g.hearth, 'the hearth is not the one place at Step 1');
    const letter = Object.keys(p.figure.letters).find(l => p.figure.letters[l] === ones[0]);
    need(right(stepOf(p, 'hearth')) === `Place ${letter}`, `hearth key "${right(stepOf(p, 'hearth'))}" is not Place ${letter}`);
    const ls = Object.values(p.figure.letters);
    need(ls.length === 4 && new Set(ls).size === 4, 'four different lettered places');
    for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) need(model.dist(ls[i], ls[j]) >= 40, `letters on ${ls[i]} and ${ls[j]} would crowd`);
    if (p.type === 'diffusion') {
      const k = classify(sp, model);
      need(k === g.kind, `the picture reads as ${k}, the problem says ${g.kind}`);
      need(right(stepOf(p, 'type')) === KIND_NAME[k], `type key "${right(stepOf(p, 'type'))}" is not ${KIND_NAME[k]}`);
      need(right(stepOf(p, 'family')).startsWith(k === 'relocation' ? 'Relocation' : 'Expansion'), 'relocation or expansion key is wrong');
      need(right(stepOf(p, 'example')) === model.REAL[k], 'the real-case key is not the same type');
    } else {
      const P = model.BY;
      need(model.PLACES.every(x => x.rank > 2 || x.id === g.hearth || sp.steps[x.id] === 2), 'not every large city is at Step 2');
      for (const id of Object.keys(sp.steps)) if (sp.steps[id] > 2) need(Object.keys(sp.steps).some(o => sp.steps[o] < sp.steps[id] && Math.hypot(P[o].x - P[id].x, P[o].y - P[id].y) <= model.R_NEAR), `${id} at Step ${sp.steps[id]} is near no earlier place`);
      need(right(stepOf(p, 'mix')) === 'Hierarchical first, then contagious', 'mix key is wrong');
    }
  } else if (p.type === 'migration') {
    const items = text.match(/Invented case\.[\s\S]*/)[0];
    const fs = (p.figure.tags || []).sort((a, b) => a.num - b.num);
    need(fs.length === 3 && new Set(fs.map(f => f.role)).size === 3, 'three factors with three roles');
    need(fs.some(f => f.role === 'push') && fs.some(f => f.role === 'pull'), 'a push and a pull factor');
    // Each factor's text sits in the bank under its role and cause.
    const li = (p.text.match(/<li>([\s\S]*?)<\/li>/g) || []).map(x => plain(x).trim());
    need(li.length === 3, 'three numbered factors');
    const bankRole = t => Object.keys(model.FACTORS).find(r => model.FACTORS[r].some(f => new RegExp('^' + f.t.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\\{[a-z]\\\}|\{[a-z]\}/g, '.+?') + '$').test(t)));
    const bankCause = t => { for (const r of Object.keys(model.FACTORS)) for (const f of model.FACTORS[r]) if (new RegExp('^' + f.t.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[a-z]\}/g, '.+?') + '$').test(t)) return f.k; return null; };
    const roles = li.map(bankRole), causes = li.map(bankCause);
    need(JSON.stringify(roles) === JSON.stringify(g.roles), `roles from the bank ${roles} differ from ${g.roles}`);
    need(right(stepOf(p, 'roleA')) === ROLE_NAME[roles[g.askA - 1]], `roleA key "${right(stepOf(p, 'roleA'))}"`);
    need(right(stepOf(p, 'roleB')) === ROLE_NAME[roles[g.askB - 1]], `roleB key "${right(stepOf(p, 'roleB'))}"`);
    need(g.askA !== g.askB, 'the two role steps ask about the same factor');
    need(right(stepOf(p, 'cause')).toLowerCase() === causes[g.askC - 1], `cause key "${right(stepOf(p, 'cause'))}" is not ${causes[g.askC - 1]}`);
    need(fs.every(f => (f.role === 'push') === (f.at === p.figure.from) || f.role !== 'push'), 'the push factor is not at the origin');
    need(fs.every(f => f.role !== 'pull' || f.at === p.figure.to), 'the pull factor is not at the destination');
    void items;
  } else if (p.type === 'kinds') {
    const sc = model.MSCENES.find(s => text.includes(s.t.split('{')[0].trim()) && new RegExp(s.t.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[a-z]\}/g, '.+?')).test(text));
    need(sc && sc.k === g.kind, 'the scene does not match its kind');
    if (!sc) return;
    const K = model.MKINDS[sc.k];
    need(right(stepOf(p, 'forced')) === (K.forced ? 'Forced migration' : 'Voluntary migration'), 'forced or voluntary key is wrong');
    need(right(stepOf(p, 'kind')) === K.name, `kind key "${right(stepOf(p, 'kind'))}" is not ${K.name}`);
    // Clues the definitions rest on.
    if (sc.k === 'idp') need(/inside Country A|same country/.test(text), 'an IDP scene must say the person stayed in the country');
    if (sc.k === 'refugee') need(/crossed the border/.test(text) && /recognized/.test(text), 'a refugee scene must cross a border and be recognized');
    if (sc.k === 'asylum') need(/not yet decided/.test(text), 'an asylum scene must be undecided');
  } else if (p.type === 'ravenstein') {
    const s = p.steps[0], v = g.v;
    let want;
    if (v === 'short') { want = 100 * g.a / (g.a + g.b + g.c); need(g.a > g.b + g.c, 'most moves are not short'); need(g.b > 0 && g.c > 0, 'empty distance band'); }
    else if (v === 'counter') { want = g.out - g.back; need(g.back < g.out, 'the counterflow is not smaller'); }
    else if (v === 'centers') { want = 100 * g.big / g.far; need(g.big > g.far / 2 && g.big < g.far, 'most long movers do not go to big centers'); }
    else if (v === 'women') { want = 100 * g.w / g.within; need(g.w > g.within / 2 && g.wa < g.abroad / 2, 'the data do not show the women law'); }
    need(close(s.cell.answer, want), `number key ${s.cell.answer} is not ${want}`);
    need(Math.abs(want - Math.round(want)) < 1e-9, 'the answer is not a whole number (no calculator)');
    need(close(Calc.evaluate({ fn: 'share', args: [1, 4] }), 25), 'ApHugCalc.share is not a percent');
    need(LAW[v].test(right(stepOf(p, 'law'))), `law key "${right(stepOf(p, 'law'))}" does not match ${v}`);
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'diffusion-lab', 'simulator', map, errs);
  const { model } = runtime('diffusion-lab');
  if (!model) { errs.push('no model registered (ApHugMath.diffusionLab)'); return errs; }
  if (model.stub) return errs;
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
  for (const k of ['intro', 'howItWorks']) if (/—/.test(data[k] || '')) errs.push(`${k}: an em dash`);
  // The network: inside Country A, spaced so dots and letters never crowd.
  for (const p of model.PLACES) if (!model.provinceOf(p.id)) errs.push(`place ${p.id} is outside Country A`);
  for (let i = 0; i < model.PLACES.length; i++) for (let j = i + 1; j < model.PLACES.length; j++) {
    const a = model.PLACES[i], b = model.PLACES[j];
    if (Math.hypot(a.x - b.x, a.y - b.y) < 28) errs.push(`places ${a.id} and ${b.id} are under 28 px apart`);
  }
  // Every listed hearth gives a spread that reads as its kind.
  for (const k of ['contagious', 'stimulus', 'hierarchical', 'relocation']) for (const h of model.HEARTHS[k]) {
    const dest = k === 'relocation' ? model.farCities(h).slice(0, 2) : null;
    if (dest && !dest.length) { errs.push(`relocation hearth ${h} has no far city`); continue; }
    const got = classify(model.spread(k, h, dest), model);
    if (got !== k) errs.push(`hearth ${h}: a ${k} spread reads as ${got}`);
  }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  return errs;
}
