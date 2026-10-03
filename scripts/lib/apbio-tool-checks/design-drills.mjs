/* Validator for bio/data/tools/design-drills.json. 8-24 scenarios with every
   unit (1-8) represented, each with a data table and all five drills
   complete: two variables that differ (optional per-option notes), a control
   and its justification with one explanation per option, a three-slot null
   hypothesis plus a choice of alternative hypothesis, a
   claim-evidence-reasoning paragraph using all three tags whose evidence
   sentences quote the table, a prediction with its mechanism, and two
   written answers (CER, 3 points; prediction and mechanism, 2 points) with a
   rubric line per point and a model answer. No explanation names an
   option's position (options are shuffled). The right option is the longest
   in at most 40% of choice rows (no length tell). "status" is absent, or
   "placeholder" for unreviewed sample content (the page then shows a Draft
   note). */
import { base, topicOk, POS_RE, UNITS, SKILLS } from './_shared.mjs';

// Wording that makes a statement a null hypothesis.
const NULL_RE = /^There is no\b|\bno (effect|difference|relationship)\b|\bis the same\b/i;
const nums = s => (String(s).replace(/<[^>]+>/g, '').match(/\d[\d,]*(?:\.\d+)?/g) || []).map(x => parseFloat(x.replace(/,/g, '')));

export function check(data, map) {
  const errs = [];
  base(data, 'design-drills', map, errs, 'drill');
  if (data.status !== undefined && data.status !== 'placeholder') errs.push('status is either absent or "placeholder"');
  const kinds = (data.drills || []).map(d => d.id);
  if (kinds.join() !== 'variables,controls,null,cer,predict') errs.push('drills must be variables, controls, null, cer, predict');
  for (const d of data.drills || []) if (!topicOk(d.topic, map)) errs.push(`drill ${d.id}: unknown topic "${d.topic}"`);
  for (const k of ['iv', 'dv', 'control', 'control-why', 'null', 'alt', 'cer', 'predict', 'mechanism', 'write-cer', 'write-predict']) if (!data.partTopics?.[k]) errs.push(`partTopics.${k} is required`);
  const sc = data.scenarios || [];
  if (sc.length < 8 || sc.length > 24) errs.push(`8-24 scenarios (${sc.length})`);
  for (const u of UNITS) if (!sc.some(s => (s.requires || []).includes(u))) errs.push(`no scenario uses ${u}: spread the scenarios across Units 1-8`);
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
    const t = s.data || {};
    if (!t.caption || !Array.isArray(t.cols) || t.cols.length < 2 || !Array.isArray(t.rows) || t.rows.length < 2 || t.rows.some(r => !Array.isArray(r) || r.length !== t.cols.length)) errs.push(`${w}: data needs a caption, 2+ columns and 2+ rows as long as the columns`);
    const tableNums = new Set((t.rows || []).flat().flatMap(nums));
    const v = s.variables || {};
    if (!Array.isArray(v.options) || v.options.length < 4 || v.iv === v.dv || !(v.iv in (v.options || [])) || !(v.dv in (v.options || []))) errs.push(`${w}: variables need 4+ options and different iv and dv`);
    if (!v.why?.iv || !v.why?.dv) errs.push(`${w}: variables.why.iv and .dv are required`);
    if (v.whyOptions && (!Array.isArray(v.whyOptions) || v.whyOptions.length !== (v.options || []).length || v.whyOptions.some((x, i) => x !== null && (typeof x !== 'string' || i === v.iv || i === v.dv)))) errs.push(`${w}: variables.whyOptions has one entry per option (null or a note), and none for iv or dv`);
    choice(s.control || {}, `${w} control`, 4);
    choice(s.controlWhy || {}, `${w} controlWhy`, 4);
    choice(s.alt || {}, `${w} alt`, 4);
    if (s.alt && NULL_RE.test((s.alt.options || [])[s.alt.correct] || '')) errs.push(`${w}: the alternative hypothesis states an effect, not "no effect", "no difference" or "the same"`);
    choice(s.mechanism || {}, `${w} mechanism`, 4);
    choice(s.predict || {}, `${w} predict`, 3);
    const slots = s.null?.slots || [];
    if (slots.length !== 3) errs.push(`${w}: the null hypothesis has three slots`);
    slots.forEach((x, k) => { if (!x.label) errs.push(`${w} null slot ${k}: label`); choice(x, `${w} null slot ${k}`, 3, false); });
    if (slots[0] && !/^There is no\b/.test(slots[0].options[slots[0].correct])) errs.push(`${w}: a null hypothesis starts "There is no …"`);
    const tags = (s.cer || []).map(c => c.tag);
    if (tags.length < 3 || tags.length > 5) errs.push(`${w}: the paragraph has 3-5 sentences`);
    for (const tg of ['claim', 'evidence', 'reasoning']) if (!tags.includes(tg)) errs.push(`${w}: the paragraph needs at least one ${tg}`);
    if (tags.filter(tg => tg === 'claim').length !== 1) errs.push(`${w}: exactly one claim`);
    for (const c of s.cer || []) {
      if (!c.text || !c.why || !['claim', 'evidence', 'reasoning'].includes(c.tag)) errs.push(`${w}: each sentence has text, tag and why`);
      else if (c.tag === 'evidence' && !nums(c.text).some(n => tableNums.has(n))) errs.push(`${w}: evidence sentence "${c.text.slice(0, 40)}…" quotes no value from the data table`);
    }
    const wr = s.write || [];
    if (wr.map(x => x.drill).join() !== 'cer,predict') errs.push(`${w}: write has two parts, drill "cer" then "predict"`);
    wr.forEach(x => {
      const ww = `${w} write ${x.drill}`;
      if (x.points !== (x.drill === 'cer' ? 3 : 2)) errs.push(`${ww}: ${x.drill === 'cer' ? 3 : 2} points`);
      if (!x.prompt || !x.sample) errs.push(`${ww}: prompt and sample are required`);
      if (!SKILLS.has(x.practice)) errs.push(`${ww}: practice "${x.practice}" is not a skill id`);
      if (!Array.isArray(x.rubric) || x.rubric.length !== x.points) errs.push(`${ww}: one rubric line per point`);
      for (const r of x.rubric || []) if (!r.point || !Array.isArray(r.accept)) errs.push(`${ww}: each rubric line has "point" and "accept" []`);
    });
  }
  if (rows && longest / rows > 0.4) errs.push(`the right option is the longest in ${Math.round(100 * longest / rows)}% of choice rows (at most 40%)`);
  return errs;
}
