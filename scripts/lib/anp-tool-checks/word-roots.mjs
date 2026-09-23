/* Validator for the word root builder's content,
   anatomy-physiology/data/tools/word-roots.json (docs/anp-tools-contract.md).
   check(data, map) returns an array of error strings.

   Each term yields two scored items, stable forever:
     word-roots:<term>:decode   split the term and give each part's meaning
     word-roots:<term>:build    assemble the term from part cards
   so a term id must never be renamed once published.

   Checks: required fields; unique ids (parts and terms); topic, concept and
   core ids exist in the map, and a term's concept is taught in the term's own
   topic; every segment names a real part and the segments spell the term;
   every term has at least two meaningful parts, a literal meaning and a real
   one; no two terms are built from the same parts (so a build has one answer)
   or share a meaning; every part is used by some term; no text points at an
   option by letter or position; and the ordering rule: a term's text uses
   only terms taught by its topic, and a part's text only terms taught by the
   first topic that uses it. */
import { scanTerms, termRegex, indexMap } from '../anp-map.mjs';

const TYPES = ['prefix', 'root', 'suffix'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const POSITION_TELLS = [
  /\b(option|choice|answer|card)\s*\(?[A-Ea-e1-5]\)?(?![\w-])/,
  /\b(first|second|third|fourth|fifth|last|top|bottom)\s+(option|choice|answer|card)s?\b/i,
  /\b(options?|choices?|answers?)\s+(above|below)\b/i,
];

const textOf = s => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function laterTerms(map, topicIndex, topicId, text, self) {
  const here = topicIndex.get(topicId);
  const out = [];
  const t = textOf(text);
  for (const c of map.concepts) {
    if (c.id === self) continue;
    const there = topicIndex.get(c.taughtIn);
    if (there === undefined || there <= here) continue;
    for (const term of scanTerms(c)) {
      const m = t.match(termRegex(term));
      if (m) { out.push(`"${m[0]}" (${c.id}, taught in ${c.taughtIn})`); break; }
    }
  }
  return out;
}

export function check(data, map) {
  const errors = [];
  const err = m => errors.push(m);
  if (!data || typeof data !== 'object') return ['word-roots.json is not an object'];
  const { topicIndex, concepts } = indexMap(map);
  const core = new Set(map.coreConcepts.map(c => c.id));
  for (const k of data.core || []) if (!core.has(k)) err(`unknown core concept "${k}"`);
  if (!Array.isArray(data.core) || !data.core.length) err('needs top-level core concept ids');

  const parts = new Map();
  for (const p of data.parts || []) {
    const e = m => err(`part ${p.id || '(no id)'}: ${m}`);
    if (!p.id) { e('missing id'); continue; }
    if (parts.has(p.id)) e('duplicate id');
    parts.set(p.id, p);
    if (!TYPES.includes(p.type)) e(`type must be one of ${TYPES.join(', ')}`);
    for (const f of ['form', 'meaning', 'origin', 'from']) if (!p[f] || typeof p[f] !== 'string') e(`missing ${f}`);
    if (p.type === 'prefix' && !/-$/.test(p.id)) e('a prefix id ends with a hyphen');
    if (p.type === 'suffix' && !/^-/.test(p.id)) e('a suffix id starts with a hyphen');
  }

  const termIds = new Set(), builds = new Map(), meanings = new Map(), used = new Map();
  for (const t of data.terms || []) {
    const e = m => err(`term ${t.id || '(no id)'}: ${m}`);
    if (!t.id || !SLUG.test(t.id)) { e('id must be a lowercase slug'); continue; }
    if (termIds.has(t.id)) e('duplicate id');
    termIds.add(t.id);
    for (const f of ['term', 'literal', 'meaning']) if (!t[f] || typeof t[f] !== 'string') e(`missing ${f}`);
    if (!topicIndex.has(t.topic)) { e(`unknown topic "${t.topic}"`); continue; }
    if (t.concept !== null) {
      const c = concepts.get(t.concept);
      if (!c) e(`unknown concept "${t.concept}" (use null when the map has none)`);
      else if (c.taughtIn !== t.topic) e(`concept ${t.concept} is taught in ${c.taughtIn}, but the term is tagged ${t.topic}`);
    }
    if (!Array.isArray(t.segs) || !t.segs.length) { e('no segments'); continue; }
    const spelled = t.segs.map(s => s[0]).join('');
    if (spelled.toLowerCase() !== String(t.term).toLowerCase().replace(/[\s-]/g, '')) e(`segments spell "${spelled}", not "${t.term}"`);
    const ids = [];
    for (const s of t.segs) {
      if (!Array.isArray(s) || !s[0] || s.length > 2) { e(`bad segment ${JSON.stringify(s)}`); continue; }
      if (s.length === 2) {
        if (!parts.has(s[1])) { e(`segment "${s[0]}" names unknown part "${s[1]}"`); continue; }
        ids.push(s[1]);
        const u = used.get(s[1]);
        if (!u || topicIndex.get(t.topic) < topicIndex.get(u)) used.set(s[1], t.topic);
      } else if (s[0].length > 2) e(`unlabeled segment "${s[0]}" is long; label it with its part`);
    }
    if (ids.length < 2) e('needs at least two meaningful parts');
    const key = ids.join('+');
    if (builds.has(key)) e(`built from the same parts as ${builds.get(key)}, so a build would have two answers`);
    builds.set(key, t.id);
    const mk = String(t.meaning).toLowerCase();
    if (meanings.has(mk)) e(`same meaning as ${meanings.get(mk)}`);
    meanings.set(mk, t.id);
    const texts = [t.literal, t.meaning, t.note];
    for (const x of texts) if (x && POSITION_TELLS.some(re => re.test(textOf(x)))) e(`text refers to an option by letter or position: "${textOf(x).slice(0, 60)}"`);
    const later = laterTerms(map, topicIndex, t.topic, texts.filter(Boolean).join(' \n '), t.concept);
    if (later.length) e(`uses terms taught after ${t.topic}: ${later.join(', ')}`);
  }
  for (const [id, p] of parts) {
    if (!used.has(id)) { err(`part ${id}: not used by any term`); continue; }
    // "from" cites the source word in its own language (Greek osteon, neuron), which
    // is not a use of the English term, so only meaning and note are scanned.
    const later = laterTerms(map, topicIndex, used.get(id), [p.meaning, p.note].filter(Boolean).join(' \n '));
    if (later.length) err(`part ${id}: first offered at ${used.get(id)} but uses ${later.join(', ')}`);
  }
  if (!termIds.size) err('no terms');
  return errors;
}
