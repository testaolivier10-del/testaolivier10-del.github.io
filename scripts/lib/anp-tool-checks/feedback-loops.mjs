/* Validator for anatomy-physiology/data/tools/feedback-loops.json (Feedback
   loop builder, docs/anp-spec.md section 8.3; docs/anp-tools-contract.md).

     check(data, map) -> array of error strings (empty when the file is good)

   It checks the seven fixed slots, the cards (every slot filled, distractors
   explained, no two cards alike), the classification, the failure question,
   ids, tags against the dependency map, the writing rules (no bare
   "receptor", no option letters or positions), the ordering rule (a loop uses
   only terms taught in its topic or earlier) and that every feedback loop the
   map plans for the pilot chapters is built. */
import { scanPage } from '../anp-map.mjs';
import { POS_RE, PILOT_CHAPTERS, bareReceptor } from './predict.mjs';

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLOTS = ['stimulus', 'sensor', 'afferent', 'control', 'efferent', 'effector', 'response'];
export const SLOT_LABELS = ['Stimulus', 'Receptor (sensor)', 'Afferent pathway', 'Control center', 'Efferent pathway', 'Effector', 'Response'];
const KINDS = ['negative', 'positive'];
export const LIVE_BROKEN = ['uncorrected', 'worse', 'partial', 'slower', 'corrected', 'stalls', 'reset', 'never', 'text'];
const SHORT_MAX = 44; // the finished diagram fits two lines of about 22 characters
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function check(data, map) {
  const errors = [];
  const err = m => errors.push(m);
  const str = v => typeof v === 'string' && v.trim().length > 0;
  if (!data || !Array.isArray(data.loops) || !data.loops.length) return ['loops: missing or empty'];
  if (!Array.isArray(data.slots) || data.slots.map(s => s.id).join() !== SLOTS.join()) err(`slots: must be ${SLOTS.join(', ')} in that order`);
  else data.slots.forEach((s, i) => { if (s.label !== SLOT_LABELS[i]) err(`slots: ${s.id} must be labeled "${SLOT_LABELS[i]}"`); });
  const topics = new Map(map.topics.map(t => [t.id, t]));
  const core = new Set(map.coreConcepts.map(c => c.id));
  const seen = new Set();

  for (const [li, l] of data.loops.entries()) {
    const where = `loop ${l && l.id ? l.id : '#' + li}`;
    if (!l || !str(l.id) || !ID_RE.test(l.id)) { err(`${where}: id must be kebab-case`); continue; }
    if (seen.has(l.id)) err(`${where}: duplicate id`);
    seen.add(l.id);
    for (const f of ['title', 'topic', 'scenario', 'classify']) if (!str(l[f])) err(`${where}: missing ${f}`);
    const topic = topics.get(l.topic);
    if (!topic) err(`${where}: unknown topic "${l.topic}"`);
    if (!Array.isArray(l.core) || !l.core.length) err(`${where}: core must list at least one core concept`);
    else for (const c of l.core) if (!core.has(c)) err(`${where}: unknown core concept "${c}"`);
    if (!KINDS.includes(l.kind)) err(`${where}: kind must be negative or positive`);
    if (l.classify && l.kind && !l.classify.toLowerCase().includes(`${l.kind} feedback`)) err(`${where}: classify must explain why it is ${l.kind} feedback`);

    // The live loop (assets/tools/feedback-loops.js, "Watch it work").
    const lv = l.live;
    if (!lv || !str(lv.variable)) err(`${where}: live.variable missing`);
    else {
      if (!['up', 'down'].includes(lv.dir)) err(`${where}: live.dir must be up or down`);
      if (!LIVE_BROKEN.includes(lv.broken)) err(`${where}: live.broken must be one of ${LIVE_BROKEN.join(', ')}`);
      if (l.kind === 'positive' && !str(lv.end)) err(`${where}: a positive loop's live.end must say what ends it`);
      // Numbers on the gauge only where the loop's own text already gives them.
      const own = [l.scenario, ...SLOTS.map(k => (l.slots && l.slots[k] && l.slots[k].text) || ''), (l.failure && l.failure.q) || ''].join(' ');
      for (const v of [lv.setPoint, lv.shift && lv.shift.to].filter(Boolean)) for (const n of String(v).match(/\d+(\.\d+)?/g) || []) if (!own.includes(n)) err(`${where}: live value "${v}" has a number (${n}) the loop's text does not give`);
    }
    const texts = [l.title, l.scenario, l.classify];
    const cards = new Set();
    const slots = l.slots || {};
    for (const k of Object.keys(slots)) if (!SLOTS.includes(k)) err(`${where}: unknown slot "${k}"`);
    for (const k of SLOTS) {
      const s = slots[k];
      if (!s) { err(`${where}: slot ${k} is missing`); continue; }
      for (const f of ['text', 'short', 'why']) if (!str(s[f])) err(`${where}: slot ${k} missing ${f}`);
      if (s.short && s.short.length > SHORT_MAX) err(`${where}: slot ${k} short label over ${SHORT_MAX} characters`);
      if (s.why && POS_RE.test(s.why)) err(`${where}: slot ${k} explanation refers to an option by letter or position`);
      const key = String(s.text || '').trim().toLowerCase();
      if (cards.has(key)) err(`${where}: two cards read "${s.text}"`);
      cards.add(key);
      texts.push(s.text || '', s.short || '', s.why || '');
    }
    if (!Array.isArray(l.distractors) || l.distractors.length < 2) err(`${where}: needs at least two distractor cards`);
    for (const d of l.distractors || []) {
      if (!str(d.text) || !str(d.why)) { err(`${where}: every distractor needs text and why`); continue; }
      const key = d.text.trim().toLowerCase();
      if (cards.has(key)) err(`${where}: distractor repeats a card: "${d.text}"`);
      cards.add(key);
      if (POS_RE.test(d.why)) err(`${where}: distractor explanation refers to an option by letter or position`);
      texts.push(d.text, d.why);
    }
    const f = l.failure;
    if (!f) err(`${where}: missing failure question`);
    else {
      if (!SLOTS.includes(f.part)) err(`${where}: failure.part must name a slot`);
      if (!str(f.q)) err(`${where}: failure.q missing`);
      if (!Array.isArray(f.options) || f.options.length < 3) err(`${where}: failure needs at least three options`);
      else {
        if (!Number.isInteger(f.correct) || f.correct < 0 || f.correct >= f.options.length) err(`${where}: failure.correct is not a valid option index`);
        for (const o of f.options) {
          if (!str(o.text) || !str(o.why)) err(`${where}: every failure option needs text and why`);
          else if (POS_RE.test(o.why)) err(`${where}: failure explanation refers to an option by letter or position`);
          texts.push(o.text || '', o.why || '');
        }
      }
      texts.push(f.q || '');
    }
    const all = texts.join('\n');
    const bare = bareReceptor(all);
    if (bare) err(`${where}: bare "receptor" (write "sensory receptor", "receptor protein" or "Receptor (sensor)"): "${bare}"`);
    if (topic) for (const p of scanPage(map, `<p>${esc(all)}</p>`, l.topic)) err(`${where}: ${p}`);
  }

  // Every feedback loop the map plans for the pilot chapters is built.
  const built = new Set(data.loops.map(l => l && l.map).filter(Boolean));
  const planned = new Set();
  for (const ch of map.chapters) {
    if (!PILOT_CHAPTERS.includes(ch.id)) continue;
    for (const t of (ch.tools && ch.tools.feedbackLoops) || []) {
      planned.add(t.title);
      if (!built.has(t.title)) err(`map loop "${t.title}" (${ch.id}) has no loop`);
    }
  }
  const allLoops = new Set(map.chapters.flatMap(ch => ((ch.tools && ch.tools.feedbackLoops) || []).map(t => t.title)));
  for (const l of data.loops) if (l && l.map && !allLoops.has(l.map)) err(`loop ${l.id}: map "${l.map}" is not a feedback loop in the map`);
  return errors;
}
