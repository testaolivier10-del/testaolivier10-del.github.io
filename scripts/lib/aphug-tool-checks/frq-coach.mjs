/* Validator for human-geography/data/tools/frq-coach.json (FRQ coach), run by
   scripts/check-aphug-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems: the frame; the model's verb demands are the
   exam's (VERBS in scripts/lib/aphug-exams.mjs, word for word); each
   question has a scenario and three or four parts labeled A, B, C, D in
   order, each with one verb from VERBS whose prompt opens with that verb, a
   rubric line, a full-credit sample, a weak answer with its slip and why;
   the sample does what the verb demands and the weak answer misses it, by
   the ApHugGrade.flags rules the writing box uses (explain: a link word;
   compare: both sides; explain the degree: the degree first); an explain
   part has its chain (cause, link, effect, two wrong links); every context
   meets the verbs across the file (every verb at least twice); no em dash.
   Then 300 drills per context and type regenerated with the model the page
   runs (ApHugMath.frqCoach), each key recomputed independently: the demand
   keyed is the part's verb's, the answer keyed is the sample, the link keyed
   is the chain's. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';
import { VERBS } from '../aphug-exams.mjs';

export const TYPES = ['part', 'verbs', 'earns'];
const EMDASH = /—/;
const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const words = s => String(s).trim().split(/\s+/).length;
const right = s => s.options[s.correct];

function flagOk(Grade, rule, text) {
  const f = Grade.flags({ write: { [rule]: true } }, text).find(x => x.rule === rule);
  return !!(f && f.ok);
}

function contextProblems(c, model, Grade, errs) {
  const w = `context ${c.id}`, need = (ok, m) => { if (!ok) errs.push(`${w}: ${m}`); };
  for (const k of ['title', 'scenario']) need(typeof c[k] === 'string' && c[k].trim().length > 10, `"${k}" is required`);
  need(Array.isArray(c.parts) && c.parts.length >= 3 && c.parts.length <= 4, 'three or four parts');
  (c.parts || []).forEach((p, i) => {
    const pw = `part ${p.label}`, n = (ok, m) => need(ok, `${pw}: ${m}`);
    n(p.label === LABELS[i], `labels run A, B, C, D in order`);
    n(VERBS[p.verb], `verb "${p.verb}" is not one of ${Object.keys(VERBS).join(', ')}`);
    if (!VERBS[p.verb]) return;
    n(new RegExp(`^${VERBS[p.verb].name.replace(/ /g, '\\s+')}\\b`, 'i').test(p.prompt || ''), `the prompt opens with its verb "${VERBS[p.verb].name}"`);
    n(p.verb === 'explain' || !/^Explain the degree/i.test(p.prompt) || p.verb === 'explain-degree', 'an "explain the degree" prompt has the verb explain-degree');
    n(/[.?]$/.test(p.prompt || ''), 'the prompt ends with a period');
    for (const k of ['rubric', 'sample', 'sampleWhy', 'weak', 'weakWhy']) n(typeof p[k] === 'string' && p[k].trim().length > 3, `"${k}" is required`);
    n(model.SLIPS.includes(p.slip), `slip "${p.slip}" is not one of ${model.SLIPS.join(', ')}`);
    n(p.sample !== p.weak, 'the weak answer differs from the sample');
    // The sample does what the verb demands; the weak answer misses it.
    if (p.verb === 'explain' || p.verb === 'explain-degree') n(flagOk(Grade, 'mechanism', p.sample), 'the sample has its link word (because, so, which)');
    if (p.verb === 'compare') n(flagOk(Grade, 'both', p.sample), 'the compare sample speaks of both sides');
    if (p.verb === 'explain-degree') n(flagOk(Grade, 'degree', p.sample.split(':')[0]) && /^To an? \w+ degree/.test(p.sample), 'the degree sample opens with the degree');
    if (p.scale) n(flagOk(Grade, 'scale', p.sample), 'a scale part names a scale in its sample');
    if (p.slip === 'no-link') n(!flagOk(Grade, 'mechanism', p.weak), 'a no-link weak answer has no link word');
    if (p.slip === 'one-side') n(!flagOk(Grade, 'both', p.weak) && p.verb === 'compare', 'a one-side weak answer (compare) has no both-sides word');
    if (p.slip === 'no-degree') n(!flagOk(Grade, 'degree', p.weak) && p.verb === 'explain-degree', 'a no-degree weak answer (explain the degree) states no degree');
    if (p.slip === 'identify-only') n(words(p.weak) <= 4 && !flagOk(Grade, 'mechanism', p.weak), 'an identify-only weak answer is a bare name (4 words or fewer, no link)');
    if (p.slip === 'example') n(p.verb === 'define', 'the example slip belongs to a define part');
    if (p.verb === 'identify') n(words(p.sample) <= 14, 'an identify sample is short: a word or a phrase');
    if (p.verb === 'describe') n(words(p.sample) >= 12, 'a describe sample gives characteristics, not a name');
    if (p.verb === 'explain') n(p.chain, 'an explain part has its chain');
    if (p.chain) {
      const ch = p.chain;
      n(ch.cause && ch.link && ch.effect, 'chain: cause, link and effect');
      n(Array.isArray(ch.wrong) && ch.wrong.length === 2 && ch.wrong.every(x => x.text && x.why && x.why.length > 20 && x.text !== ch.link), 'chain: two wrong links, each with why');
    }
  });
}

function recheck(p, c, w, errs) {
  const { model } = runtime('frq-coach');
  const bad = m => errs.push(`${w}: ${m}`);
  const byLabel = Object.fromEntries(c.parts.map(x => [x.label, x]));
  for (const s of p.steps) {
    const [kind, label] = s.key.split('-'), part = byLabel[label];
    if (!part) { bad(`step ${s.key}: no part ${label}`); continue; }
    if (!p.parts.includes(label)) bad(`step ${s.key}: part ${label} is not shown as asked`);
    if (kind === 'demand') {
      if (right(s) !== VERBS[part.verb].demand) bad(`step ${s.key}: keyed demand is not ${part.verb}'s`);
      if (s.options.filter(o => o === VERBS[part.verb].demand).length !== 1) bad(`step ${s.key}: the demand appears twice`);
      if (!s.options.every(o => Object.values(VERBS).some(v => v.demand === o))) bad(`step ${s.key}: an option is not a verb demand`);
    } else if (kind === 'earns') {
      if (right(s) !== part.sample) bad(`step ${s.key}: keyed answer is not the sample`);
      if (!s.options.includes(part.weak) || s.options.length !== 2) bad(`step ${s.key}: the options are the sample and the weak answer`);
    } else if (kind === 'link') {
      if (!part.chain || right(s) !== part.chain.link) bad(`step ${s.key}: keyed link is not the chain's`);
    } else bad(`step ${s.key}: unknown step kind`);
    for (const x of [s.label, ...s.options, ...s.why]) if (EMDASH.test(x)) bad(`step ${s.key}: an em dash`);
  }
  if (p.type === 'part' && p.steps.length !== (byLabel[p.parts[0]].chain ? 3 : 2)) bad('a part drill has demand, earns and (with a chain) link');
  if (p.type !== 'part' && p.steps.length !== c.parts.length) bad('one step per part');
  if (model.TYPES.indexOf(p.type) < 0) bad(`type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'frq-coach', 'simulator', map, errs);
  if (EMDASH.test(JSON.stringify(data))) errs.push('an em dash in the data file (use a colon, a comma or two sentences)');
  const { model, Grade } = runtime('frq-coach');
  for (const k of Object.keys(VERBS)) {
    if (!model.VERBS[k] || model.VERBS[k].demand !== VERBS[k].demand || model.VERBS[k].name !== VERBS[k].name) errs.push(`model VERBS.${k} differs from scripts/lib/aphug-exams.mjs`);
  }
  if (Object.keys(model.VERBS).length !== Object.keys(VERBS).length) errs.push('model VERBS has a verb the exam does not');
  for (const c of data.contexts || []) contextProblems(c, model, Grade, errs);
  const count = {};
  for (const c of data.contexts || []) for (const p of c.parts || []) count[p.verb] = (count[p.verb] || 0) + 1;
  for (const v of Object.keys(VERBS)) if ((count[v] || 0) < 2) errs.push(`verb ${v}: at least two parts across the file (has ${count[v] || 0})`);
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), () => TYPES);
  return errs;
}
export { recheck };
