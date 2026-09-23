/* Checks anatomy-physiology/data/tools/flashcards.json, the authored A&P
   flashcards (docs/anp-tools-contract.md). check(data, map) returns an array
   of error strings; an empty array means the file is good.

   Each card: { id, topic, core: [], level, compare?, front, back, why }.
   The ordering rule is applied to every card as if it were a page of its
   topic: a card for topic X may use only terms taught in X or earlier. */
import { scanPage } from '../anp-map.mjs';

const LEVELS = new Set(['recall', 'apply', 'analyze']);
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// An explanation that points at an answer's position breaks when answers move.
const POSITION = /\b(option|choice|answer)\s+[A-E]\b|\([A-E]\)|\b(first|second|third|fourth|last) (option|choice|answer)\b|\bthe (above|below) (option|answer)\b/i;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function check(data, map) {
  const errors = [];
  const err = (id, m) => errors.push(`flashcards ${id}: ${m}`);
  if (!data || !Array.isArray(data.cards)) return ['flashcards: missing "cards" array'];
  const topics = new Set(map.topics.map(t => t.id));
  const core = new Set(map.coreConcepts.map(c => c.id));
  const seen = new Set();
  for (const [i, c] of data.cards.entries()) {
    const id = c && c.id ? c.id : `#${i}`;
    if (!c || typeof c !== 'object') { err(id, 'not an object'); continue; }
    if (!c.id || !ID.test(c.id)) err(id, 'id must be lowercase words joined by hyphens');
    if (seen.has(c.id)) err(id, 'duplicate id'); seen.add(c.id);
    if (!topics.has(c.topic)) err(id, `unknown topic "${c.topic}"`);
    if (!Array.isArray(c.core) || !c.core.length) err(id, 'core must be a non-empty array');
    else for (const k of c.core) if (!core.has(k)) err(id, `unknown core concept "${k}"`);
    if (!LEVELS.has(c.level)) err(id, `level must be recall, apply or analyze (got "${c.level}")`);
    for (const f of ['front', 'back', 'why']) {
      if (typeof c[f] !== 'string' || c[f].trim().length < 3) err(id, `missing ${f}`);
      else if (/<(?!\/?(i|b|sub|sup|em|strong)>)[a-z/]/i.test(c[f])) err(id, `${f} holds markup other than i, b, sub, sup`);
    }
    if (c.compare !== undefined && (typeof c.compare !== 'string' || !c.compare.trim())) err(id, 'compare must be a non-empty string when present');
    if (typeof c.why === 'string' && POSITION.test(c.why)) err(id, 'explanation refers to an option by letter or position');
    if (typeof c.back === 'string' && POSITION.test(c.back)) err(id, 'answer refers to an option by letter or position');
    if (typeof c.why === 'string' && typeof c.back === 'string' && c.why.trim() === c.back.trim()) err(id, 'why repeats the answer instead of explaining it');
    if (topics.has(c.topic)) {
      const text = `<p>${esc(c.front)}</p><p>${esc(c.back)}</p><p>${esc(c.why)}</p>`;
      for (const p of scanPage(map, text, c.topic)) err(id, `ORDER: ${p}`);
    }
  }
  return errors;
}
