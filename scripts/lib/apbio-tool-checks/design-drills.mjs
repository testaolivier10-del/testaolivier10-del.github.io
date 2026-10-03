/* Validator for bio/data/tools/design-drills.json. 6-10 scenarios, each
   with all five drills complete: two variables that differ, a control and
   its justification with one explanation per option, a three-slot null
   hypothesis, a claim-evidence-reasoning paragraph using all three tags, and
   a prediction with its mechanism. No explanation names an option's
   position (options are shuffled). The right option is the longest in at
   most 40% of choice rows (no length tell). Placeholder until reviewed. */
import { base, topicOk, POS_RE, UNITS } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  base(data, 'design-drills', map, errs, 'drill');
  if (data.status !== 'placeholder' && data.status !== 'reviewed') errs.push('status must be "placeholder" until a teacher reviews the drills, then "reviewed"');
  const kinds = (data.drills || []).map(d => d.id);
  if (kinds.join() !== 'variables,controls,null,cer,predict') errs.push('drills must be variables, controls, null, cer, predict');
  for (const d of data.drills || []) if (!topicOk(d.topic, map)) errs.push(`drill ${d.id}: unknown topic "${d.topic}"`);
  for (const k of ['iv', 'dv', 'control', 'control-why', 'null', 'cer', 'predict', 'mechanism']) if (!data.partTopics?.[k]) errs.push(`partTopics.${k} is required`);
  const sc = data.scenarios || [];
  if (sc.length < 6 || sc.length > 10) errs.push(`6-10 scenarios (${sc.length})`);
  const ids = new Set();
  let rows = 0, longest = 0;
  const choice = (o, w, n = 3, count = true) => {
    if (!Array.isArray(o.options) || o.options.length < n) errs.push(`${w}: at least ${n} options`);
    if (!(o.correct >= 0 && o.correct < (o.options || []).length)) errs.push(`${w}: correct out of range`);
    if (!Array.isArray(o.why) || o.why.length !== (o.options || []).length) errs.push(`${w}: one why per option`);
    for (const t of o.why || []) if (POS_RE.test(t)) errs.push(`${w}: an explanation names a position`);
    if (new Set(o.options).size !== (o.options || []).length) errs.push(`${w}: duplicate options`);
    const len = (o.options || []).map(x => x.length), mx = Math.max(...len);
    if (count) { rows++; if (len[o.correct] === mx && len.filter(x => x === mx).length === 1) longest++; }
  };
  for (const s of sc) {
    const w = `scenario ${s.id}`;
    if (!s.id || ids.has(s.id)) errs.push(`${w}: missing or duplicate id`); ids.add(s.id);
    if (!s.title || !s.setup) errs.push(`${w}: title and setup are required`);
    if (!Array.isArray(s.requires) || !s.requires.length || s.requires.some(u => !UNITS.includes(u))) errs.push(`${w}: requires lists the unit(s) whose biology it uses`);
    if (s.requires && s.requires.some(u => !['unit-1', 'unit-2', 'unit-3'].includes(u))) errs.push(`${w}: drill scenarios use Units 1-3 biology or everyday contexts only`);
    const v = s.variables || {};
    if (!Array.isArray(v.options) || v.options.length < 4 || v.iv === v.dv || !(v.iv in (v.options || [])) || !(v.dv in (v.options || []))) errs.push(`${w}: variables need 4+ options and different iv and dv`);
    if (!v.why?.iv || !v.why?.dv) errs.push(`${w}: variables.why.iv and .dv are required`);
    choice(s.control || {}, `${w} control`, 4);
    choice(s.controlWhy || {}, `${w} controlWhy`, 4);
    choice(s.mechanism || {}, `${w} mechanism`, 4);
    choice(s.predict || {}, `${w} predict`, 3);
    const slots = s.null?.slots || [];
    if (slots.length !== 3) errs.push(`${w}: the null hypothesis has three slots`);
    slots.forEach((x, k) => { if (!x.label) errs.push(`${w} null slot ${k}: label`); choice(x, `${w} null slot ${k}`, 3, false); });
    if (slots[0] && !/^There is no\b/.test(slots[0].options[slots[0].correct])) errs.push(`${w}: a null hypothesis starts "There is no …"`);
    const tags = (s.cer || []).map(c => c.tag);
    if (tags.length < 3 || tags.length > 5) errs.push(`${w}: the paragraph has 3-5 sentences`);
    for (const t of ['claim', 'evidence', 'reasoning']) if (!tags.includes(t)) errs.push(`${w}: the paragraph needs at least one ${t}`);
    if (tags.filter(t => t === 'claim').length !== 1) errs.push(`${w}: exactly one claim`);
    for (const c of s.cer || []) if (!c.text || !c.why || !['claim', 'evidence', 'reasoning'].includes(c.tag)) errs.push(`${w}: each sentence has text, tag and why`);
  }
  if (rows && longest / rows > 0.4) errs.push(`the right option is the longest in ${Math.round(100 * longest / rows)}% of choice rows (at most 40%)`);
  return errs;
}
