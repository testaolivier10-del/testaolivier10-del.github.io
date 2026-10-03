/* The AP® Biology concept-ordering check (docs/apbio-spec.md, section 4).

   Two halves, one rule: nothing is used before it is taught.

   1. THE MAP. docs/apbio-dependency-map.json lists the 61 CED topics in CED
      order, the skills and drills with the topic each follows, and every
      concept with the topic that teaches it and the concepts it depends on.
      A concept that depends on something taught later fails unless its
      topic declares a preview box backed by a circularDependencies entry.
      So do unknown ids, dependency cycles, one word for two concepts, a bad
      skill anchor, the token "ap" in an id, and unit weights that cannot
      add to 100%.

   2. THE PAGES AND QUESTIONS. Every page under bio/ that declares
      <meta name="bio-topic"> is read for the tagged terms of every concept
      taught after its topic; a hit outside a .bio-preview box or .bio-nav-ref
      fails. Question banks in bio/data/questions/<topic>.json are read the
      same way (q, options, stimulus, why). Before Phase 2 neither exists, and
      this half has nothing to read.

     node scripts/check-apbio-map.mjs            report
     node scripts/check-apbio-map.mjs --check    exit non-zero on a failure (CI)
     node scripts/check-apbio-map.mjs --order    print the course order
*/
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMap, validateMap, scanPages, scanQuestions, courseOrder } from './lib/apbio-map.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const map = loadMap(join(ROOT, 'docs', 'apbio-dependency-map.json'));
const args = new Set(process.argv.slice(2));

if (args.has('--order')) {
  let ch = null, n = 0;
  for (const t of courseOrder(map)) {
    const k = map.concepts.filter(c => c.taughtIn === t.id).length;
    if (t.kind === 'concept' && t.chapter !== ch) {
      ch = t.chapter;
      const c = map.chapters.find(x => x.id === ch);
      console.log(`\nUnit ${c.n}: ${c.title}  [${c.weight[0]}-${c.weight[1]}%]`);
    }
    const label = t.kind === 'concept' ? t.ced : t.kind;
    console.log(`  ${String(++n).padStart(3)}. ${label.padEnd(5)} ${t.title}  (${t.id}, ${k} concepts)`);
  }
  process.exit(0);
}

const { errors, warnings } = validateMap(map);
const pages = scanPages(map, ROOT);
const questions = scanQuestions(map, ROOT);
const problems = [
  ...pages.flatMap(p => p.problems.map(m => `${p.file}: ${m}`)),
  ...questions.flatMap(q => q.problems.map(m => `${q.file}${q.id ? ` [${q.id}]` : ''}: ${m}`)),
];
const previews = map.topics.reduce((n, t) => n + (t.previews || []).length, 0);
const skills = map.topics.filter(t => t.kind !== 'concept').length;

console.log(`AP Biology map: ${map.chapters.length} chapters, ${map.topics.length - skills} CED topics + ${skills} skills/drills, ${map.concepts.length} concepts, ${previews} preview boxes.`);
console.log(`Pages checked: ${pages.length}. Questions checked: ${questions.length}.`);
for (const w of warnings) console.log(`  warning: ${w}`);
for (const e of [...errors, ...problems]) console.log(`  FAIL: ${e}`);
if (!errors.length && !problems.length) console.log('Nothing is used before it is taught.');
if (args.has('--check') && (errors.length || problems.length)) process.exit(1);
