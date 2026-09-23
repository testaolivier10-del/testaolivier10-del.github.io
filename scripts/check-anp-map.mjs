/* The A&P concept-ordering check (docs/anp-spec.md, section 7).

   Two halves, one rule: nothing is used before it is taught.

   1. THE MAP. docs/anp-dependency-map.json lists every topic in course order
      and every concept with the topic that teaches it and the concepts it
      depends on. A concept that depends on something taught later fails,
      unless its topic declares that later concept as a preview. So do
      unknown ids, dependency cycles, a preview nobody needs, and one word
      standing for two concepts.

   2. THE PAGES. Every A&P page that declares <meta name="anp-topic"> is read
      for the tagged terms of every concept taught after its topic. A hit
      outside an .anp-preview box fails. Before Phase 1 there are no pages, so
      this half has nothing to read yet.

     node scripts/check-anp-map.mjs            report
     node scripts/check-anp-map.mjs --check    exit non-zero on a failure (CI)
     node scripts/check-anp-map.mjs --order    print the course order
*/
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMap, validateMap, scanPages } from './lib/anp-map.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const map = loadMap(join(ROOT, 'docs', 'anp-dependency-map.json'));
const args = new Set(process.argv.slice(2));

if (args.has('--order')) {
  let ch = null, n = 0;
  for (const t of map.topics) {
    if (t.chapter !== ch) {
      ch = t.chapter;
      const c = map.chapters.find(x => x.id === ch);
      console.log(`\n${c.title}  [A&P ${c.course}]`);
    }
    const k = map.concepts.filter(c => c.taughtIn === t.id).length;
    console.log(`  ${String(++n).padStart(3)}. ${t.title}  (${t.kind}, ${k} concepts)`);
  }
  process.exit(0);
}

const { errors, warnings } = validateMap(map);
const pages = scanPages(map, ROOT);
const pageProblems = pages.flatMap(p => p.problems.map(m => `${p.file}: ${m}`));

console.log(`A&P map: ${map.chapters.length} chapters, ${map.topics.length} topics, ${map.concepts.length} concepts, ${map.topics.reduce((n, t) => n + (t.previews || []).length, 0)} preview boxes.`);
console.log(`Pages checked: ${pages.length}.`);
for (const w of warnings) console.log(`  warning: ${w}`);
for (const e of [...errors, ...pageProblems]) console.log(`  FAIL: ${e}`);
if (!errors.length && !pageProblems.length) console.log('Nothing is used before it is taught.');
if (args.has('--check') && (errors.length || pageProblems.length)) process.exit(1);
