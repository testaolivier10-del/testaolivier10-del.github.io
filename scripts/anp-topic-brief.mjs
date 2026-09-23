/* Everything an author needs to write one A&P topic, read off the dependency
   map, so nobody writes a topic from memory of what the course has taught.

     node scripts/anp-topic-brief.mjs <topic-id>

   Prints: where the topic sits, what it must teach (every concept, term and
   alias it owns), what it builds on, the preview boxes it may use, the words
   it must NOT use because a later topic teaches them, and the tool content
   planned for it. */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMap, indexMap, scanTerms } from './lib/anp-map.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const map = loadMap(join(ROOT, 'docs', 'anp-dependency-map.json'));
const id = process.argv[2];
const { topicIndex, concepts } = indexMap(map);
if (!topicIndex.has(id)) { console.error(`unknown topic "${id}"`); process.exit(1); }
const here = topicIndex.get(id);
const topic = map.topics[here];
const chapter = map.chapters.find(c => c.id === topic.chapter);
const mine = map.concepts.filter(c => c.taughtIn === id);
const title = t => map.topics[topicIndex.get(t)].title;

console.log(`# ${topic.title}  (topic ${here + 1} of ${map.topics.length}; id ${id})`);
console.log(`Chapter: ${chapter.title} · A&P ${topic.course} · kind: ${topic.kind} · TEAS: ${chapter.teas}`);
console.log(`Core concepts: ${topic.coreConcepts.join(', ')}`);
console.log(`Search phrase for the notes page: "${topic.searchPhrase}"`);
console.log(`Previous topic: ${here > 0 ? map.topics[here - 1].id : '(none)'} · Next topic: ${map.topics[here + 1]?.id || '(none)'}`);

console.log(`\n## Concepts this topic teaches (${mine.length}) — every one must be taught on the page`);
for (const c of mine) {
  const extra = [];
  if (c.fullIn) extra.push(`SHORT VERSION: full treatment later in ${[].concat(c.fullIn).join(', ')} — keep it brief and say where it returns`);
  if (c.enrichment) extra.push('enrichment (beyond the coverage standards)');
  console.log(`- ${c.id}: **${c.term}**${c.aliases.length ? ` — also: ${c.aliases.join('; ')}` : ''}${extra.length ? `\n    (${extra.join('; ')})` : ''}`);
}

const builds = new Map();
for (const c of mine) for (const d of c.dependsOn) {
  const dc = concepts.get(d);
  if (dc.taughtIn !== id && topicIndex.get(dc.taughtIn) < here) {
    if (!builds.has(dc.taughtIn)) builds.set(dc.taughtIn, new Set());
    builds.get(dc.taughtIn).add(dc.term);
  }
}
console.log(`\n## Builds on (earlier topics this one directly uses)`);
for (const [t, terms] of [...builds].sort((a, b) => topicIndex.get(a[0]) - topicIndex.get(b[0])))
  console.log(`- ${t} (${title(t)}): ${[...terms].join('; ')}`);

console.log(`\n## Preview boxes allowed on this page`);
if (!(topic.previews || []).length) console.log('- none. Any later term must be avoided or rephrased in plain words.');
for (const p of topic.previews || []) {
  const pc = concepts.get(p.concept);
  console.log(`- ${p.concept} ("${pc.term}", taught in ${pc.taughtIn}): ${p.reason}`);
}

// Later concepts a writer on this topic is most likely to reach for: the ones
// that build on this topic, the rest of this chapter, and full versions.
const tempting = map.concepts.filter(c => {
  const t = topicIndex.get(c.taughtIn);
  if (t <= here) return false;
  if (map.topics[t].chapter === topic.chapter) return true;
  return c.dependsOn.some(d => concepts.get(d).taughtIn === id);
});
console.log(`\n## Do NOT use these words outside a preview box (taught later) — ${tempting.length} concepts most likely to tempt you`);
for (const c of tempting) {
  const words = scanTerms(c);
  if (words.length) console.log(`- ${words.slice(0, 8).join(', ')}${words.length > 8 ? ', …' : ''}  → ${c.taughtIn}`);
}
console.log('(The full check covers every later term: run node scripts/check-anp-content.mjs --topic ' + id + ')');

console.log(`\n## Tool content planned for this topic`);
let any = false;
for (const [kind, items] of Object.entries(chapter.tools || {}))
  for (const it of items) if (it.topic === id) { any = true; console.log(`- ${kind}: ${it.level ? `L${it.level} ` : ''}${it.title}`); }
if (!any) console.log('- none');
