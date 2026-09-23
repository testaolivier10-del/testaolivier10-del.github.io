/* Validator for the pathway tracer's content, anatomy-physiology/data/tools/pathways.json
   (docs/anp-tools-contract.md). check(data, map) returns an array of error strings.

   Each pathway yields three scored items, stable forever:
     pathways:<pathway>:order     put every step in order
     pathways:<pathway>:missing   choose the step that fills the gap
     pathways:<pathway>:error     find the one wrong step
   so a pathway id must never be renamed once published.

   Checks: required fields; unique ids (pathways and steps); topic and core ids
   exist in the map; levels and difficulty valid; every step, distractor and
   planted error explains itself; no explanation points at an option by letter
   or position; and the ordering rule: nothing in a pathway uses a term the map
   teaches after the pathway's topic. */
import { scanUseTerms, everydaySet, termRegex, indexMap } from '../anp-map.mjs';

const LEVELS = ['recall', 'apply', 'analyze'];
const KINDS = ['flow', 'causal'];
const BLOOD = ['o2', 'deo2', 'exchange'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LABEL_MAX = 30;

/* An explanation must survive shuffling: never "option B", "the first
   choice", "(c)", "the answer above". */
const POSITION_TELLS = [
  /\b(option|choice|answer)\s*\(?[A-Ea-e1-5]\)?(?![\w-])/,
  /\b(first|second|third|fourth|fifth|last|top|bottom)\s+(option|choice|answer)s?\b/i,
  /\b(options?|choices?|answers?)\s+(above|below)\b/i,
  /(^|\s)\(?[A-Ea-e]\)\s/,
  /\bthe (one|option) (above|below)\b/i
];

export function textOf(html) {
  return String(html == null ? '' : html)
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

export function positionTell(s) {
  const t = textOf(s);
  return POSITION_TELLS.some(re => re.test(t));
}

/* Terms taught after `topicId` that appear in `text`. */
export function laterTerms(map, topicId, text) {
  const { topicIndex } = indexMap(map);
  const here = topicIndex.get(topicId);
  const out = [];
  if (here === undefined) return out;
  const t = textOf(text);
  for (const c of map.concepts) {
    const there = topicIndex.get(c.taughtIn);
    if (there === undefined || there <= here) continue;
    // Same terms as the page check: plurals count, everyday words (decision 51) do not.
    for (const term of scanUseTerms(c)) {
      if (everydaySet(map).has(term.toLowerCase())) continue;
      const m = t.match(termRegex(term));
      if (m) { out.push(`"${m[0]}" (${c.id}, taught in ${c.taughtIn})`); break; }
    }
  }
  return out;
}

const str = v => typeof v === 'string' && v.trim().length > 0;

export function check(data, map) {
  const errors = [];
  const err = (where, msg) => errors.push(`pathways ${where}: ${msg}`);
  if (!data || !Array.isArray(data.pathways)) return ['pathways: data.pathways must be an array'];
  const topics = new Set(map.topics.map(t => t.id));
  const cores = new Set(map.coreConcepts.map(c => c.id));
  const ids = new Set();
  const itemIds = new Set();

  data.pathways.forEach((p, n) => {
    const where = p && p.id ? p.id : `#${n}`;
    if (!p || typeof p !== 'object') { err(where, 'not an object'); return; }
    if (!str(p.id) || !SLUG.test(p.id)) err(where, 'id must be a lowercase slug');
    if (ids.has(p.id)) err(where, 'duplicate pathway id');
    ids.add(p.id);
    for (const v of ['order', 'missing', 'error']) {
      const iid = `pathways:${p.id}:${v}`;
      if (itemIds.has(iid)) err(where, `duplicate item id ${iid}`);
      itemIds.add(iid);
    }
    for (const f of ['title', 'intro', 'summary']) if (!str(p[f])) err(where, `missing ${f}`);
    if (!topics.has(p.topic)) err(where, `unknown topic "${p.topic}"`);
    if (!Array.isArray(p.core) || !p.core.length) err(where, 'core must be a non-empty array');
    else p.core.forEach(c => { if (!cores.has(c)) err(where, `unknown core concept "${c}"`); });
    if (!LEVELS.includes(p.level)) err(where, `level must be one of ${LEVELS.join(', ')}`);
    if (![1, 2, 3].includes(p.diff)) err(where, 'diff must be 1, 2 or 3');
    if (!KINDS.includes(p.kind)) err(where, `kind must be one of ${KINDS.join(', ')}`);
    if (p.cycle !== undefined && typeof p.cycle !== 'boolean') err(where, 'cycle must be true or false');

    const steps = Array.isArray(p.steps) ? p.steps : [];
    if (steps.length < 4) err(where, 'needs at least 4 steps');
    if (steps.length > 20) err(where, 'more than 20 steps is too many to order on a phone');
    const stepIds = new Set();
    const texts = new Set();
    steps.forEach((s, k) => {
      const sw = `${where} step ${k + 1}`;
      if (!str(s.id) || !SLUG.test(s.id)) err(sw, 'id must be a lowercase slug');
      if (stepIds.has(s.id)) err(sw, `duplicate step id "${s.id}"`);
      stepIds.add(s.id);
      if (!str(s.text)) err(sw, 'missing text');
      if (texts.has(s.text)) err(sw, 'two steps have the same text');
      texts.add(s.text);
      if (!str(s.label)) err(sw, 'missing label (the diagram node)');
      else if (textOf(s.label).length > LABEL_MAX) err(sw, `label longer than ${LABEL_MAX} characters: "${s.label}"`);
      if (!str(s.why)) err(sw, 'missing why (why it comes here)');
      if (s.blood !== undefined && !BLOOD.includes(s.blood)) err(sw, 'blood must be o2, deo2 or exchange');
    });

    const m = p.missing;
    if (!m || typeof m !== 'object') err(where, 'missing the "missing" variant');
    else {
      if (!Number.isInteger(m.at) || m.at < 0 || m.at >= steps.length) err(where, 'missing.at must index a step');
      if (m.level !== undefined && !LEVELS.includes(m.level)) err(where, 'missing.level invalid');
      if (!Array.isArray(m.distractors) || m.distractors.length < 2) err(where, 'missing needs at least 2 distractors');
      else m.distractors.forEach((d, k) => {
        if (!str(d.text)) err(where, `missing distractor ${k + 1} has no text`);
        if (!str(d.why)) err(where, `missing distractor ${k + 1} has no why`);
        if (steps[m.at] && d.text === steps[m.at].text) err(where, `missing distractor ${k + 1} is the right answer`);
      });
    }

    const e = p.error;
    if (!e || typeof e !== 'object') err(where, 'missing the "error" variant');
    else {
      if (!Number.isInteger(e.at) || e.at < 0 || e.at >= steps.length) err(where, 'error.at must index a step');
      if (e.level !== undefined && !LEVELS.includes(e.level)) err(where, 'error.level invalid');
      if (!str(e.text)) err(where, 'error.text (the planted wrong step) missing');
      if (!str(e.why)) err(where, 'error.why missing');
      if (steps[e.at] && e.text === steps[e.at].text) err(where, 'error.text is the same as the real step');
    }

    // Explanations: no letter or position references.
    const expl = [p.summary, ...steps.map(s => s.why), ...((m && m.distractors) || []).map(d => d.why), e && e.why];
    expl.forEach(x => { if (x && positionTell(x)) err(where, `an explanation refers to an option by letter or position: "${textOf(x).slice(0, 80)}"`); });

    // Ordering rule over everything the pathway shows.
    const all = [p.title, p.intro, p.summary,
      ...steps.flatMap(s => [s.text, s.label, s.why]),
      ...((m && m.distractors) || []).flatMap(d => [d.text, d.why]),
      e && e.text, e && e.why].join(' | ');
    if (topics.has(p.topic)) laterTerms(map, p.topic, all).forEach(h => err(where, `uses ${h} before it is taught`));
  });
  return errors;
}
