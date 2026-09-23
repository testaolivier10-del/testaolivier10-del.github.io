/* The A&P concept dependency map: loading it, checking it, and reading pages
   against it. docs/anp-dependency-map.json is the data; docs/anp-spec.md
   (section 7) is why it exists.

   The map is written at the level of concepts, not pages. Every concept names
   the topic that teaches it and the concepts it directly depends on. Topics
   are listed in course order, so "taught before" is just "earlier in the
   topics array". From that one rule everything else follows:

   - a concept may depend only on concepts taught in its own topic or an
     earlier one, unless its topic declares the later concept as a preview
     (a marked box that gives just enough and links forward);
   - a page for topic N may use a tagged term only if the topic that teaches
     it is N or earlier, unless the use sits inside a preview box.

   The first is checked against the map itself (validateMap), the second
   against the built pages (scanPages). Both are pure functions so the unit
   test can hand them a small map with a deliberate mistake in it. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

export const KINDS = ['anatomy', 'physiology', 'mixed'];
export const COURSES = ['I', 'II'];
export const TOOL_KINDS = ['comparisonTables', 'feedbackLoops', 'pathways', 'graphs', 'predictionThemes', 'labSets', 'calculators', 'wordRoots'];

export function loadMap(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/* The words a page is scanned for. A term or alias with a parenthetical
   qualifier ("nucleus (CNS)") is a display label: its bare form is shared by
   two concepts, so it cannot say which one a page means, and it is left out. */
export function scanTerms(concept) {
  return [concept.term, ...(concept.aliases || [])]
    .filter(t => !t.includes('('))
    .map(normalize)
    .filter(t => t.length >= 2);
}

export function normalize(s) {
  return s.replace(/[‐-―−]/g, '-').replace(/\s+/g, ' ').trim();
}

/* An acronym or symbol (ACh, GFR, pH) is matched case-sensitively, so "co"
   in "cooperate" is never read as cardiac output. Everything else ignores
   case. */
function isCaseSensitive(t) {
  // A single capital letter as a word ("A band", "Z disc", "T tubule") is part
  // of the name: "a band of tissue" is not the A band.
  return /[A-Z]/.test(t.slice(1)) || /^[A-Z]{2,}/.test(t) || /[0-9]/.test(t) || /^[A-Z][\s-]/.test(t);
}

export function termRegex(t) {
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Unicode sub/superscript digits belong to the word: CO₂ is not CO.
  return new RegExp(`(?<![\\w-])${esc}(?![\\w\u2070-\u209F\u00B2\u00B3\u00B9-])`, isCaseSensitive(t) ? 'g' : 'gi');
}

export function indexMap(map) {
  const topicIndex = new Map(map.topics.map((t, i) => [t.id, i]));
  const concepts = new Map(map.concepts.map(c => [c.id, c]));
  return { topicIndex, concepts };
}

/* Everything that can be wrong with the map. Returns { errors, warnings }. */
export function validateMap(map) {
  const errors = [], warnings = [];
  const err = m => errors.push(m), warn = m => warnings.push(m);
  const dup = (list, what) => {
    const seen = new Set();
    for (const x of list) { if (seen.has(x.id)) err(`duplicate ${what} id "${x.id}"`); seen.add(x.id); }
  };
  dup(map.chapters, 'chapter'); dup(map.topics, 'topic'); dup(map.concepts, 'concept'); dup(map.coreConcepts, 'core concept');

  const core = new Set(map.coreConcepts.map(c => c.id));
  const parts = new Set(map.parts.map(p => p.id));
  const chapterIds = map.chapters.map(c => c.id);
  const { topicIndex, concepts } = indexMap(map);

  for (const c of map.chapters) {
    if (!parts.has(c.part)) err(`chapter ${c.id}: unknown part "${c.part}"`);
    if (!COURSES.includes(c.course)) err(`chapter ${c.id}: course must be I or II`);
  }

  // Topics are grouped by chapter, and the chapters appear in their own order.
  let lastChapter = -1;
  const byTopic = new Map(map.topics.map(t => [t.id, []]));
  for (const t of map.topics) {
    const ci = chapterIds.indexOf(t.chapter);
    if (ci < 0) { err(`topic ${t.id}: unknown chapter "${t.chapter}"`); continue; }
    if (ci < lastChapter) err(`topic ${t.id}: chapter ${t.chapter} appears again after a later chapter; topics must be grouped by chapter in chapter order`);
    lastChapter = Math.max(lastChapter, ci);
    if (!KINDS.includes(t.kind)) err(`topic ${t.id}: kind must be one of ${KINDS.join(', ')}`);
    if (!COURSES.includes(t.course)) err(`topic ${t.id}: course must be I or II`);
    if (!t.coreConcepts || !t.coreConcepts.length) err(`topic ${t.id}: no core concepts`);
    for (const cc of t.coreConcepts || []) if (!core.has(cc)) err(`topic ${t.id}: unknown core concept "${cc}"`);
  }
  for (const id of chapterIds) if (!map.topics.some(t => t.chapter === id)) err(`chapter ${id} has no topics`);

  for (const c of map.concepts) {
    if (!topicIndex.has(c.taughtIn)) { err(`concept ${c.id}: taughtIn unknown topic "${c.taughtIn}"`); continue; }
    byTopic.get(c.taughtIn).push(c);
    if (c.fullIn !== undefined) {
      const f = Array.isArray(c.fullIn) ? c.fullIn : [c.fullIn];
      for (const t of f) {
        if (!topicIndex.has(t)) err(`concept ${c.id}: fullIn unknown topic "${t}"`);
        else if (topicIndex.get(t) <= topicIndex.get(c.taughtIn)) err(`concept ${c.id}: fullIn "${t}" is not after where the short version is taught`);
      }
    }
  }
  for (const t of map.topics) if (!byTopic.get(t.id).length) err(`topic ${t.id} teaches no concepts`);

  // THE ORDERING RULE.
  const previewsOf = new Map(map.topics.map(t => [t.id, new Set((t.previews || []).map(p => p.concept))]));
  const previewUsed = new Map(map.topics.map(t => [t.id, new Set()]));
  for (const c of map.concepts) {
    const here = topicIndex.get(c.taughtIn);
    for (const d of c.dependsOn) {
      if (d === c.id) { err(`concept ${c.id} depends on itself`); continue; }
      const dc = concepts.get(d);
      if (!dc) { err(`concept ${c.id}: depends on unknown concept "${d}"`); continue; }
      const there = topicIndex.get(dc.taughtIn);
      if (there > here) {
        if (previewsOf.get(c.taughtIn).has(d)) previewUsed.get(c.taughtIn).add(d);
        else err(`ORDER: ${c.id} (taught in ${c.taughtIn}, #${here + 1}) depends on ${d}, which is not taught until ${dc.taughtIn} (#${there + 1}) and is not a declared preview`);
      }
    }
  }
  for (const t of map.topics) {
    for (const p of t.previews || []) {
      const pc = concepts.get(p.concept);
      if (!pc) { err(`topic ${t.id}: preview of unknown concept "${p.concept}"`); continue; }
      if (topicIndex.get(pc.taughtIn) <= topicIndex.get(t.id)) err(`topic ${t.id}: preview of ${p.concept} is unnecessary; it is already taught in ${pc.taughtIn}`);
      else if (!previewUsed.get(t.id).has(p.concept)) err(`topic ${t.id}: preview of ${p.concept} is declared but no concept in this topic depends on it`);
      if (!p.reason) err(`topic ${t.id}: preview of ${p.concept} has no reason`);
    }
  }

  // No dependency cycles at all, including inside one topic.
  const state = new Map();
  const visit = (id, stack) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { err(`dependency cycle: ${[...stack.slice(stack.indexOf(id)), id].join(' -> ')}`); return; }
    state.set(id, 1); stack.push(id);
    for (const d of (concepts.get(id)?.dependsOn || [])) if (concepts.has(d)) visit(d, stack);
    stack.pop(); state.set(id, 2);
  };
  for (const c of map.concepts) visit(c.id, []);

  // A word on a page must point at one concept, or the page check cannot
  // tell which topic a page is leaning on.
  const owner = new Map();
  for (const c of map.concepts) for (const t of scanTerms(c)) {
    const k = isCaseSensitive(t) ? t : t.toLowerCase();
    if (owner.has(k) && owner.get(k) !== c.id) err(`term "${t}" belongs to both ${owner.get(k)} and ${c.id}; qualify one with a parenthetical`);
    owner.set(k, c.id);
  }

  for (const ch of map.chapters) {
    for (const [kind, items] of Object.entries(ch.tools || {})) {
      if (!TOOL_KINDS.includes(kind)) err(`chapter ${ch.id}: unknown tool kind "${kind}"`);
      for (const it of items) {
        const t = map.topics.find(x => x.id === it.topic);
        if (!t) err(`chapter ${ch.id} ${kind} "${it.title}": unknown topic "${it.topic}"`);
        else if (t.chapter !== ch.id) err(`chapter ${ch.id} ${kind} "${it.title}": topic ${it.topic} is in ${t.chapter}`);
        if (kind === 'predictionThemes' && ![1, 2, 3, 4].includes(it.level)) err(`chapter ${ch.id}: prediction theme "${it.title}" needs a level 1-4`);
      }
    }
    if (!ch.tools || !Object.keys(ch.tools).length) warn(`chapter ${ch.id} has no tool content planned`);
  }

  for (const cc of map.coreConcepts) {
    const n = map.topics.filter(t => t.coreConcepts.includes(cc.id)).length;
    if (n < 3) warn(`core concept ${cc.id} is tagged on only ${n} topics`);
  }
  return { errors, warnings };
}

/* The page half of the build check. Every A&P page declares its topic with
   <meta name="anp-topic" content="topic-id">. Text inside an element with the
   class "anp-preview" is exempt: that is the marked preview box. */
export function scanPage(map, html, topicId) {
  const { topicIndex } = indexMap(map);
  const here = topicIndex.get(topicId);
  if (here === undefined) return [`declares unknown topic "${topicId}"`];
  const text = maskAllowed(map, stripForScan(html), here, topicIndex);
  const problems = [];
  for (const c of map.concepts) {
    const there = topicIndex.get(c.taughtIn);
    if (there <= here) continue;
    for (const t of scanTerms(c)) {
      const m = text.match(termRegex(t));
      if (m) { problems.push(`uses "${m[0]}" (${c.id}), which is not taught until ${c.taughtIn}; teach it first or put this use inside a preview box`); break; }
    }
  }
  return problems;
}

/* A term already taught can contain a later one: "amino acid" (biomolecules)
   holds "acid" (acids and bases). The longer, allowed term is what the page
   says, so it is blanked out before the later terms are looked for. Only
   allowed terms that contain some other term's words are worth blanking; the
   list is worked out once per map. */
const nestCache = new WeakMap();
function nestingTerms(map) {
  if (nestCache.has(map)) return nestCache.get(map);
  const all = map.concepts.flatMap(c => scanTerms(c).map(t => ({ t, topic: c.taughtIn })));
  const known = new Set(all.map(x => x.t.toLowerCase()));
  const out = [];
  for (const x of all) {
    const words = x.t.toLowerCase().split(/[\s-]+/);
    if (words.length < 2) continue;
    let nests = false;
    for (let i = 0; i < words.length && !nests; i++)
      for (let j = i + 1; j <= words.length && !nests; j++)
        if (j - i < words.length && known.has(words.slice(i, j).join(' '))) nests = true;
    if (nests) out.push(x);
  }
  out.sort((a, b) => b.t.length - a.t.length);
  nestCache.set(map, out);
  return out;
}
function maskAllowed(map, text, here, topicIndex) {
  for (const { t, topic } of nestingTerms(map)) {
    if (topicIndex.get(topic) > here) continue;
    text = text.replace(termRegex(t), ' ');
  }
  return text;
}

export function stripForScan(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ');
  s = removeClassBlocks(s, 'anp-preview');
  // Navigation that names another topic ("Next: Organelles and the
  // cytoskeleton") points somewhere; it does not teach, so it is not a use.
  s = removeClassBlocks(s, 'anp-nav-ref');
  // Subscripts and superscripts belong to the word they follow: CO<sub>2</sub>
  // is carbon dioxide ("CO2"), not "CO" (cardiac output) followed by a 2.
  s = s.replace(/<\/?(sub|sup|tspan)\b[^>]*>/gi, '');
  return normalize(s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'));
}

// Removes every element carrying the class, matching nested tags of the same
// name so a preview box that contains a <div> is removed whole.
function removeClassBlocks(html, cls) {
  const open = new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\bclass="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'i');
  let m;
  while ((m = open.exec(html))) {
    const tag = m[1];
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    re.lastIndex = m.index + m[0].length;
    let depth = 1, end = html.length, t;
    while ((t = re.exec(html))) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) { end = t.index + t[0].length; break; }
    }
    html = html.slice(0, m.index) + ' ' + html.slice(end);
  }
  return html;
}

export function scanPages(map, root, dir = 'anatomy-physiology') {
  const base = join(root, dir);
  const results = [];
  if (!existsSync(base)) return results;
  const walk = d => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.html')) {
        const html = readFileSync(p, 'utf8');
        const m = html.match(/<meta\s+name="anp-topic"\s+content="([^"]+)"/i);
        if (!m) continue;
        results.push({ file: relative(root, p), topic: m[1], problems: scanPage(map, html, m[1]) });
      }
    }
  };
  walk(base);
  return results;
}
