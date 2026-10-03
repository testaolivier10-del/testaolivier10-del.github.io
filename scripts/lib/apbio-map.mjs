/* The AP® Biology concept dependency map: loading it, checking it, and
   reading pages and questions against it. docs/apbio-dependency-map.json is
   the data; docs/apbio-spec.md (section 4) is its format. Adapted from
   scripts/lib/anp-map.mjs (same rule, same page scan), with two changes:

   - Course order is not the array order. Topics are stored grouped by
     chapter (eight units, then the two skills chapters); a skill or drill
     topic is placed right after its `after` topic. Several skills with the
     same anchor keep their listed order. courseOrder() works this out and
     everything else uses it.
   - A forward dependency needs both a preview box on the topic and a
     circularDependencies entry (resolution "preview") that names it, so
     every exception to the ordering rule is written down in one place.

   Pages under bio/ declare <meta name="bio-topic" content="topic-id">; text
   inside .bio-preview (a preview box) or .bio-nav-ref (navigation naming
   another topic) is exempt. Questions live in bio/data/questions/<topic>.json
   and their q, options, stimulus and why text is checked the same way. Files
   under bio/ never carry the token "ap" (spec decision 2), hence "bio-". */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

export const KINDS = ['concept', 'skill', 'drill'];
export const TOOL_KINDS = ['simulators', 'frqThemes', 'stimulusThemes', 'comparisonTables', 'pathways'];
export const FRQ_TYPES = [
  'Interpreting and Evaluating Experimental Results',
  'Interpreting and Evaluating Experimental Results with Graphing',
  'Scientific Investigation', 'Conceptual Analysis',
  'Analyze Model or Visual Representation', 'Analyze Data',
];
export const STIMULUS_KINDS = ['table', 'graph', 'setup', 'model'];
export const RESOLUTIONS = ['pull-forward', 'preview'];
// The owner brief's simulator list (spec section 1). Each must be planned in
// some unit, exactly once.
export const REQUIRED_SIMULATORS = [
  'enzyme-activity-inhibition', 'osmosis-water-potential', 'electron-transport-atp-synthase',
  'light-reactions-calvin', 'signal-transduction-amplification', 'cell-cycle-checkpoints',
  'meiosis-nondisjunction', 'operons', 'hardy-weinberg-drift', 'tree-reading',
  'population-growth', 'energy-flow',
];

export function loadMap(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/* Spec decision 2: no id may contain the token "ap" (or "apbio"), because
   topic ids become file names under bio/ and concept ids end up in data
   attributes there. Tokens are split on anything that is not a letter or
   digit, so "map" or "chapter" inside a longer word is not a token. */
export function hasApToken(id) {
  return String(id).toLowerCase().split(/[^a-z0-9]+/).some(t => t === 'ap' || t === 'apbio');
}

/* The words a page is scanned for. A term or alias with a parenthetical
   qualifier ("base (chemistry)") is a display label: its bare form is shared
   by two concepts, so it cannot say which one a page means, and it is left
   out. */
export function scanTerms(concept) {
  return [concept.term, ...(concept.aliases || [])]
    .filter(t => !t.includes('('))
    .map(normalize)
    .filter(t => t.length >= 2);
}

/* Regular plural of a scan term, unless it is an acronym or symbol. */
export function plural(t) {
  if (isCaseSensitive(t)) return null;
  if (/(s|x|z|ch|sh)$/i.test(t)) return t + 'es';
  if (/[^aeiou]y$/i.test(t)) return t.slice(0, -1) + 'ies';
  return t + 's';
}
/* Singular of a multi-word plural alias ("sister chromatids" -> "sister
   chromatid"). Single words are left alone: stripping an s misfires. */
export function singular(t) {
  if (isCaseSensitive(t) || !/\s/.test(t)) return null;
  if (/ies$/i.test(t)) return t.slice(0, -3) + 'y';
  if (/(ches|shes|xes|zes|sses)$/i.test(t)) return t.slice(0, -2);
  if (/[^su]s$/i.test(t)) return t.slice(0, -1);
  return null;
}
const useTermsCache = new WeakMap();
export function scanUseTerms(concept) {
  const key = [concept.term, ...(concept.aliases || [])].join('\u0000');
  const hit = useTermsCache.get(concept);
  if (hit && hit.key === key) return hit.out;
  const base = scanTerms(concept);
  const have = new Set(base.map(t => t.toLowerCase()));
  const out = [...base];
  for (const t of base) {
    for (const v of [plural(t), singular(t)]) if (v && !have.has(v.toLowerCase())) { have.add(v.toLowerCase()); out.push(v); }
  }
  useTermsCache.set(concept, { key, out });
  return out;
}

/* Everyday words: common words a student already roughly knows ("cell",
   "gene", "species"). They may be used in their everyday sense before their
   topic; the technical terms of the same concept stay strict. */
const everydayCache = new WeakMap();
export function everydaySet(map) {
  if (everydayCache.has(map)) return everydayCache.get(map);
  const set = new Set();
  for (const w of (map.everydayWords && map.everydayWords.words) || []) {
    const t = normalize(w).toLowerCase();
    set.add(t);
    const p = plural(t); if (p) set.add(p.toLowerCase());
  }
  everydayCache.set(map, set);
  return set;
}

export function normalize(s) {
  return s.replace(/[‐-―−]/g, '-').replace(/\s+/g, ' ').trim();
}

/* Acronyms and symbols (ATP, pH, G1) match case-sensitively; a single
   capital letter as a word ("A site", "meiosis I") is part of the name. */
export function isCaseSensitive(t) {
  return /[A-Z]/.test(t.slice(1)) || /^[A-Z]{2,}/.test(t) || /[0-9]/.test(t) || /^[A-Z][\s-]/.test(t);
}

const regexCache = new Map();
export function termRegex(t) {
  let re = regexCache.get(t);
  if (!re) {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Unicode sub/superscript digits belong to the word: CO₂ is not CO.
    re = new RegExp(`(?<![\\w-])${esc}(?![\\w⁰-₟²³¹-])`, isCaseSensitive(t) ? 'g' : 'gi');
    regexCache.set(t, re);
  }
  re.lastIndex = 0;
  return re;
}

/* Course order: unit topics in array order, each skill/drill inserted right
   after its anchor. Unknown anchors are left at the end (validateMap reports
   them). */
export function courseOrder(map) {
  const units = map.topics.filter(t => !t.after);
  const byAnchor = new Map();
  const orphans = [];
  for (const t of map.topics) {
    if (!t.after) continue;
    if (!units.some(u => u.id === t.after)) { orphans.push(t); continue; }
    if (!byAnchor.has(t.after)) byAnchor.set(t.after, []);
    byAnchor.get(t.after).push(t);
  }
  const out = [];
  for (const u of units) { out.push(u); out.push(...(byAnchor.get(u.id) || [])); }
  return [...out, ...orphans];
}

const indexCache = new WeakMap();
export function indexMap(map) {
  const sig = `${map.topics.length}:${map.concepts.length}:${map.topics.map(t => t.after || '').join(',')}`;
  const hit = indexCache.get(map);
  if (hit && hit.sig === sig) return hit.out;
  const order = courseOrder(map);
  const out = {
    order,
    topicIndex: new Map(order.map((t, i) => [t.id, i])),
    topics: new Map(map.topics.map(t => [t.id, t])),
    concepts: new Map(map.concepts.map(c => [c.id, c])),
  };
  indexCache.set(map, { sig, out });
  return out;
}

/* Everything that can be wrong with the map. Returns { errors, warnings }.
   requiredSimulators: simulator ids that must be planned somewhere (the
   owner brief's list by default; tests pass [] for their small maps). */
export function validateMap(map, { requiredSimulators = REQUIRED_SIMULATORS } = {}) {
  const errors = [], warnings = [];
  const err = m => errors.push(m), warn = m => warnings.push(m);
  const dup = (list, what) => {
    const seen = new Set();
    for (const x of list) { if (seen.has(x.id)) err(`duplicate ${what} id "${x.id}"`); seen.add(x.id); }
  };
  dup(map.chapters, 'chapter'); dup(map.topics, 'topic'); dup(map.concepts, 'concept');
  dup(map.circularDependencies || [], 'circular dependency');

  for (const [what, list] of [['chapter', map.chapters], ['topic', map.topics], ['concept', map.concepts], ['circular dependency', map.circularDependencies || []]])
    for (const x of list) if (hasApToken(x.id)) err(`${what} id "${x.id}" contains the token "ap" (spec decision 2)`);
  for (const t of map.topics) if (/ap/i.test(t.id)) warn(`topic id "${t.id}" contains the letters "ap"; it becomes a file name under bio/, so prefer a slug without them`);

  const parts = new Set(map.parts.map(p => p.id));
  const bigIdeas = new Set((map.bigIdeas || []).map(b => b.id));
  const practices = new Set((map.practices || []).map(p => p.id));
  const chapterById = new Map(map.chapters.map(c => [c.id, c]));
  const chapterIds = map.chapters.map(c => c.id);
  const { topicIndex, topics, concepts, order } = indexMap(map);

  // Weights: each course chapter has [min, max] percent; the ranges must be
  // able to add up to 100.
  let minSum = 0, maxSum = 0;
  for (const c of map.chapters) {
    if (!parts.has(c.part)) err(`chapter ${c.id}: unknown part "${c.part}"`);
    if (c.part === 'course') {
      const w = c.weight;
      if (!Array.isArray(w) || w.length !== 2 || !w.every(Number.isFinite) || w[0] > w[1] || w[0] < 0 || w[1] > 100) err(`chapter ${c.id}: weight must be [min, max] percent`);
      else { minSum += w[0]; maxSum += w[1]; }
      if (!Number.isInteger(c.n)) err(`chapter ${c.id}: course chapter needs a unit number n`);
    } else if (c.weight !== undefined) err(`chapter ${c.id}: only course units carry an exam weight`);
  }
  if (map.chapters.some(c => c.part === 'course') && (minSum > 100 || maxSum < 100)) err(`unit weights cannot add to 100% (mins sum to ${minSum}, maxes to ${maxSum})`);
  for (const p of map.practices || []) {
    const w = p.mcqWeight;
    if (!Array.isArray(w) || w.length !== 2 || w[0] > w[1]) err(`practice ${p.id}: mcqWeight must be [min, max]`);
  }

  // Topics are grouped by chapter, chapters in their own order.
  let lastChapter = -1;
  const unitSeq = new Map();
  for (const t of map.topics) {
    const ci = chapterIds.indexOf(t.chapter);
    if (ci < 0) { err(`topic ${t.id}: unknown chapter "${t.chapter}"`); continue; }
    if (ci < lastChapter) err(`topic ${t.id}: chapter ${t.chapter} appears again after a later chapter; topics must be grouped by chapter in chapter order`);
    lastChapter = Math.max(lastChapter, ci);
    const ch = chapterById.get(t.chapter);
    if (!KINDS.includes(t.kind)) err(`topic ${t.id}: kind must be one of ${KINDS.join(', ')}`);
    for (const b of t.bigIdeas || []) if (!bigIdeas.has(b)) err(`topic ${t.id}: unknown big idea "${b}"`);
    if (!t.practices || !t.practices.length) err(`topic ${t.id}: no focus practices`);
    for (const p of t.practices || []) if (!practices.has(p)) err(`topic ${t.id}: unknown practice ${p}`);
    if (!t.title) err(`topic ${t.id}: no title`);
    if (t.kind === 'concept') {
      if (ch.part !== 'course') err(`topic ${t.id}: concept topics belong in a course unit`);
      if (t.after !== undefined) err(`topic ${t.id}: only skills and drills take "after"`);
      if (!t.bigIdeas || !t.bigIdeas.length) err(`topic ${t.id}: no big idea`);
      // CED numbers run 1, 2, 3 ... inside each unit, in array order.
      const want = `${ch.n}.${(unitSeq.get(ch.id) || 0) + 1}`;
      if (t.ced !== want) err(`topic ${t.id}: ced is "${t.ced}", expected "${want}" (CED order)`);
      unitSeq.set(ch.id, (unitSeq.get(ch.id) || 0) + 1);
    } else if (KINDS.includes(t.kind)) {
      if (ch.part !== 'skills') err(`topic ${t.id}: ${t.kind} topics belong in a skills chapter`);
      if (t.ced !== null) err(`topic ${t.id}: skills and drills have ced null`);
      const a = topics.get(t.after);
      if (!t.after) err(`topic ${t.id}: a ${t.kind} needs an "after" anchor`);
      else if (!a) err(`topic ${t.id}: "after" names unknown topic "${t.after}"`);
      else if (a.kind !== 'concept') err(`topic ${t.id}: "after" must name a unit topic, not ${a.kind} ${a.id}`);
    }
  }
  for (const id of chapterIds) if (!map.topics.some(t => t.chapter === id)) err(`chapter ${id} has no topics`);

  // Concepts: where taught, short versions with a later full treatment.
  const byTopic = new Map(map.topics.map(t => [t.id, []]));
  for (const c of map.concepts) {
    if (!c.term) err(`concept ${c.id}: no term`);
    if (!Array.isArray(c.dependsOn)) { err(`concept ${c.id}: dependsOn must be a list`); c.dependsOn = []; }
    if (!topicIndex.has(c.taughtIn)) { err(`concept ${c.id}: taughtIn unknown topic "${c.taughtIn}"`); continue; }
    byTopic.get(c.taughtIn).push(c);
    for (const f of c.fullIn || []) {
      if (!topicIndex.has(f)) err(`concept ${c.id}: fullIn unknown topic "${f}"`);
      else if (topicIndex.get(f) <= topicIndex.get(c.taughtIn)) err(`concept ${c.id}: fullIn "${f}" is not after where the short version is taught`);
    }
  }
  for (const t of map.topics) if (!byTopic.get(t.id).length) err(`topic ${t.id} teaches no concepts`);

  // circularDependencies: every exception to the ordering rule, written down.
  const previewBacked = new Set();   // "topic|concept"
  const pulledForward = new Set();   // concept ids
  for (const cd of map.circularDependencies || []) {
    if (!RESOLUTIONS.includes(cd.resolution)) err(`circular dependency ${cd.id}: resolution must be ${RESOLUTIONS.join(' or ')}`);
    if (!cd.problem || !cd.detail) err(`circular dependency ${cd.id}: needs a problem and a detail`);
    for (const t of cd.into || []) if (!topicIndex.has(t)) err(`circular dependency ${cd.id}: into unknown topic "${t}"`);
    for (const t of cd.fullIn || []) if (!topicIndex.has(t)) err(`circular dependency ${cd.id}: fullIn unknown topic "${t}"`);
    if (!cd.concepts || !cd.concepts.length) err(`circular dependency ${cd.id}: lists no concepts`);
    for (const id of cd.concepts || []) {
      const c = concepts.get(id);
      if (!c) { err(`circular dependency ${cd.id}: unknown concept "${id}"`); continue; }
      if (cd.resolution === 'pull-forward') {
        pulledForward.add(id);
        if (!(cd.into || []).includes(c.taughtIn)) err(`circular dependency ${cd.id}: ${id} is taught in ${c.taughtIn}, not in ${(cd.into || []).join(', ')}`);
        for (const f of c.fullIn || []) if (!(cd.fullIn || []).includes(f)) err(`circular dependency ${cd.id}: ${id} has fullIn ${f}, missing from the entry's fullIn`);
      } else {
        for (const t of cd.into || []) previewBacked.add(`${t}|${id}`);
      }
    }
  }
  for (const c of map.concepts) if ((c.fullIn || []).length && !pulledForward.has(c.id)) err(`concept ${c.id}: has fullIn but no pull-forward circularDependencies entry lists it`);

  // THE ORDERING RULE, in course order.
  const previewsOf = new Map(map.topics.map(t => [t.id, new Set((t.previews || []).map(p => p.concept))]));
  const previewUsed = new Map(map.topics.map(t => [t.id, new Set()]));
  for (const c of map.concepts) {
    const here = topicIndex.get(c.taughtIn);
    if (here === undefined) continue;
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
      if (!previewBacked.has(`${t.id}|${p.concept}`)) err(`topic ${t.id}: preview of ${p.concept} has no circularDependencies entry (resolution "preview") naming it`);
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

  // Everyday words must be real terms of the map, so the list cannot hide a typo.
  const allTerms = new Set(map.concepts.flatMap(c => [c.term, ...(c.aliases || [])].map(t => normalize(t).toLowerCase())));
  for (const w of (map.everydayWords && map.everydayWords.words) || [])
    if (!allTerms.has(normalize(w).toLowerCase())) err(`everydayWords: "${w}" is not a term or alias of any concept`);

  // A word must point at one concept. Checked on every label, qualified ones
  // included, so two concepts cannot both claim "base (chemistry)".
  const owner = new Map();
  for (const c of map.concepts) for (const raw of [c.term, ...(c.aliases || [])]) {
    const t = normalize(raw);
    const k = isCaseSensitive(t) ? t : t.toLowerCase();
    if (owner.has(k) && owner.get(k) !== c.id) err(`term "${t}" belongs to both ${owner.get(k)} and ${c.id}; qualify one with a parenthetical`);
    owner.set(k, c.id);
  }

  // Planned tools.
  const sims = new Map();
  for (const ch of map.chapters) {
    for (const [kind, items] of Object.entries(ch.tools || {})) {
      if (!TOOL_KINDS.includes(kind)) { err(`chapter ${ch.id}: unknown tool kind "${kind}"`); continue; }
      for (const it of items) {
        const t = topics.get(it.topic);
        if (!it.title) err(`chapter ${ch.id} ${kind}: an item has no title`);
        if (!t) err(`chapter ${ch.id} ${kind} "${it.title}": unknown topic "${it.topic}"`);
        else if (t.chapter !== ch.id) err(`chapter ${ch.id} ${kind} "${it.title}": topic ${it.topic} is in ${t.chapter}`);
        if (kind === 'simulators') {
          if (!it.id) err(`chapter ${ch.id}: simulator "${it.title}" needs an id`);
          else {
            if (hasApToken(it.id)) err(`simulator id "${it.id}" contains the token "ap"`);
            if (sims.has(it.id)) err(`simulator ${it.id} is planned twice`);
            sims.set(it.id, ch.id);
          }
        }
        if (kind === 'frqThemes' && !FRQ_TYPES.includes(it.type)) err(`chapter ${ch.id}: FRQ theme "${it.title}" has unknown type "${it.type}"`);
        if (kind === 'stimulusThemes' && !STIMULUS_KINDS.includes(it.stimulus)) err(`chapter ${ch.id}: stimulus theme "${it.title}" needs stimulus ${STIMULUS_KINDS.join('|')}`);
      }
    }
    if (ch.part === 'course' && (!ch.tools || !Object.values(ch.tools).some(v => v.length))) warn(`chapter ${ch.id} has no tool content planned`);
  }
  for (const s of requiredSimulators) if (!sims.has(s)) err(`simulator ${s} from the owner brief is not planned in any unit`);

  void order;
  return { errors, warnings };
}

/* The page half of the build check. Every course page declares its topic
   with <meta name="bio-topic" content="topic-id">. Text inside an element
   with the class "bio-preview" is exempt: that is the marked preview box. */
export function scanPage(map, html, topicId) {
  const { topicIndex } = indexMap(map);
  const here = topicIndex.get(topicId);
  if (here === undefined) return [`declares unknown topic "${topicId}"`];
  const text = maskAllowed(map, stripForScan(html), here, topicIndex);
  const problems = [];
  // A concept this topic previews may be named once the page carries its
  // preview box (<… class="bio-preview" data-concept="id">).
  const previewed = new Set();
  const topic = map.topics.find(t => t.id === topicId);
  for (const p of (topic && topic.previews) || [])
    if (new RegExp(`class="[^"]*\\bbio-preview\\b[^"]*"[^>]*\\bdata-concept="${p.concept}"`).test(html)) previewed.add(p.concept);
  const lower = text.toLowerCase();
  for (const { c, there, terms } of scanList(map)) {
    if (there <= here || previewed.has(c.id)) continue;
    for (const { t, low } of terms) {
      if (low !== null && !lower.includes(low)) continue;
      const m = text.match(termRegex(t));
      if (m) { problems.push(`uses "${m[0]}" (${c.id}), which is not taught until ${c.taughtIn}; teach it first or put this use inside a preview box`); break; }
    }
  }
  return problems;
}

const scanListCache = new WeakMap();
function scanList(map) {
  const sig = `${map.topics.length}:${map.concepts.length}:${((map.everydayWords && map.everydayWords.words) || []).length}`;
  const hit = scanListCache.get(map);
  if (hit && hit.sig === sig) return hit.out;
  const { topicIndex } = indexMap(map);
  const everyday = everydaySet(map);
  const out = map.concepts.map(c => ({
    c, there: topicIndex.get(c.taughtIn),
    terms: scanUseTerms(c).filter(t => !everyday.has(t.toLowerCase()))
      .map(t => ({ t, low: ASCII.test(t) ? t.toLowerCase() : null })),
  }));
  scanListCache.set(map, { sig, out });
  return out;
}
export const ASCII = /^[\x20-\x7e]*$/;

/* A term already taught can contain a later one: "competitive inhibitor"
   (3.3) is not a use of a later "competition". The longer, allowed term is
   blanked out before the later terms are looked for. */
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
  let lower = text.toLowerCase();
  for (const { t, topic } of nestingTerms(map)) {
    if (topicIndex.get(topic) > here) continue;
    if (ASCII.test(t) && !lower.includes(t.toLowerCase())) continue;
    const next = text.replace(termRegex(t), ' ');
    if (next !== text) { text = next; lower = text.toLowerCase(); }
  }
  return text;
}

export function stripForScan(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ');
  s = removeClassBlocks(s, 'bio-preview');
  // Navigation that names another topic points somewhere; it does not teach.
  s = removeClassBlocks(s, 'bio-nav-ref');
  // Subscripts and superscripts belong to the word they follow.
  s = s.replace(/<\/?(sub|sup|tspan)\b[^>]*>/gi, '');
  return normalize(s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'));
}

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

/* Every course page under bio/ that declares a topic. bio/ may not exist
   yet; then there is nothing to read. */
export function scanPages(map, root, dir = 'bio') {
  const base = join(root, dir);
  const results = [];
  if (!existsSync(base)) return results;
  const walk = d => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.html')) {
        const html = readFileSync(p, 'utf8');
        // The generator marks a topic's lesson and notes pages on <body data-topic>;
        // <meta name="bio-topic"> is accepted too.
        const m = html.match(/<meta\s+name="bio-topic"\s+content="([^"]+)"/i) || html.match(/<body\b[^>]*\bdata-topic="([^"]+)"/i);
        if (!m) continue;
        results.push({ file: relative(root, p), topic: m[1], problems: scanPage(map, html, m[1]) });
      }
    }
  };
  walk(base);
  return results;
}

/* The text a learner reads in one question: its stem (q), options, stimulus
   and explanation (why). Options and why may be strings, lists, or objects
   with a text field; a stimulus may be a string or an object with text, a
   caption, or table rows. Anything else is ignored. */
export function questionText(q) {
  const out = [];
  const add = v => {
    if (v == null) return;
    if (typeof v === 'string') out.push(v);
    else if (typeof v === 'number') return;
    else if (Array.isArray(v)) v.forEach(add);
    else if (typeof v === 'object') for (const k of ['text', 'caption', 'title', 'label', 'rows', 'headers', 'why']) add(v[k]);
  };
  add(q.q); add(q.options); add(q.stimulus); add(q.why);
  return out.join('\n');
}

/* Questions in a bank file: a list, or { questions: [...] }, where an item
   can be a stimulus set ({ stimulus, questions: [...] }) whose stimulus is
   shared by its questions. Each yields { id, topic, text }. */
export function bankQuestions(bank, fileTopic) {
  const out = [];
  // The authored format (docs/apbio-architecture.md): { stimuli: { id: {...} }, items: [...] }.
  // A shared stimulus is scanned once, against the topic of the first item that uses it.
  if (bank && !Array.isArray(bank) && Array.isArray(bank.items)) {
    const stimuli = bank.stimuli || {};
    const seen = new Set();
    for (const item of bank.items) {
      if (!item) continue;
      const sid = item.stimulus;
      if (typeof sid === 'string' && stimuli[sid] && !seen.has(sid)) {
        seen.add(sid);
        const st = stimuli[sid];
        const text = [st.title, st.text, st.html, st.table && JSON.stringify(st.table), st.chart && JSON.stringify(st.chart)]
          .filter(Boolean).join('\n');
        out.push({ id: `${sid} (stimulus)`, topic: item.topic || fileTopic, text });
      }
      out.push({ id: item.id, topic: item.topic || fileTopic, text: questionText({ ...item, stimulus: undefined }) });
    }
    return out;
  }
  const list = Array.isArray(bank) ? bank : (bank && Array.isArray(bank.questions) ? bank.questions : []);
  for (const item of list) {
    if (item && Array.isArray(item.questions)) {
      const shared = questionText({ stimulus: item.stimulus });
      if (shared) out.push({ id: `${item.id || 'set'} (stimulus)`, topic: item.topic || fileTopic, text: shared });
      for (const q of item.questions) out.push({ id: q.id, topic: q.topic || item.topic || fileTopic, text: questionText(q) });
    } else if (item) out.push({ id: item.id, topic: item.topic || fileTopic, text: questionText(item) });
  }
  return out;
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
export function scanQuestions(map, root, dir = join('bio', 'data', 'questions')) {
  const base = join(root, dir);
  const results = [];
  if (!existsSync(base)) return results;
  for (const f of readdirSync(base).sort()) {
    if (!f.endsWith('.json')) continue;
    const p = join(base, f);
    let bank;
    try { bank = JSON.parse(readFileSync(p, 'utf8')); }
    catch (e) { results.push({ file: relative(root, p), id: null, problems: [`not valid JSON: ${e.message}`] }); continue; }
    for (const q of bankQuestions(bank, basename(f, '.json'))) {
      const problems = scanPage(map, `<p>${esc(q.text)}</p>`, q.topic);
      results.push({ file: relative(root, p), id: q.id, topic: q.topic, problems });
    }
  }
  return results;
}
