/* The AP® Calculus BC concept-ordering check (docs/apcalcbc-phase0.md): AB's check
   (scripts/check-apcalc-map.mjs, scripts/lib/apcalc-map.mjs) run on the BC course map.

   The BC map is docs/apcalcbc-dependency-map.json, an overlay merged onto AB's map
   (mergeBcMap in scripts/lib/apcalc-build.mjs): 111 CED topics in CED order, the
   "Math you need" chapter with AB's seven skills and BC's three, every concept.

   1. THE MAP: the same rules as AB, with BC's topic list (Units 1-10, nothing
      skipped), BC's FRQ types and BC's six trainers added to the required ones.
   2. THE PAGES AND QUESTIONS: every page under calculus-bc/ that declares a
      topic, and every question file BC serves (AB's calculus/data/questions/ and
      BC's calculus-bc/data/questions/), read against the BC order. An AB question
      that names a BC concept fails here, though AB's own check passes it.

     node scripts/check-apcalcbc-map.mjs            report
     node scripts/check-apcalcbc-map.mjs --check    exit non-zero on a failure (CI)
     node scripts/check-apcalcbc-map.mjs --order    print the course order
*/
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.APCALC_COURSE = 'bc';
const { readMapRaw } = await import('./lib/apcalc-build.mjs');
const { validateMap, scanPages, scanQuestions, courseOrder } = await import('./lib/apcalc-map.mjs');

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const map = readMapRaw(join(ROOT, 'docs', 'apcalcbc-dependency-map.json'));
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
    console.log(`  ${String(++n).padStart(3)}. ${label.padEnd(5)} ${t.title}  (${t.id}, ${k} concepts${t.source === 'bc' ? ', BC' : ''})`);
  }
  process.exit(0);
}

const { errors, warnings } = validateMap(map, { course: 'bc' });
const pages = scanPages(map, ROOT, 'calculus-bc');
const questions = [...scanQuestions(map, ROOT, join('calculus', 'data', 'questions')), ...scanQuestions(map, ROOT, join('calculus-bc', 'data', 'questions'))];
const problems = [
  ...pages.flatMap(p => p.problems.map(m => `${p.file}: ${m}`)),
  ...questions.flatMap(q => q.problems.map(m => `${q.file}${q.id ? ` [${q.id}]` : ''}: ${m}`)),
];
const previews = map.topics.reduce((n, t) => n + (t.previews || []).length, 0);
const skills = map.topics.filter(t => t.kind !== 'concept').length;
const bcTopics = map.topics.filter(t => t.source === 'bc' && t.kind === 'concept').length;

console.log(`AP Calculus BC map: ${map.chapters.length} chapters, ${map.topics.length - skills} CED topics (${bcTopics} BC only) + ${skills} math skills, ${map.concepts.length} concepts, ${previews} preview boxes.`);
console.log(`Pages checked: ${pages.length}. Questions checked: ${questions.length}.`);
for (const w of warnings) console.log(`  warning: ${w}`);
for (const e of [...errors, ...problems]) console.log(`  FAIL: ${e}`);
if (!errors.length && !problems.length) console.log('Nothing is used before it is taught.');
if (args.has('--check') && (errors.length || problems.length)) process.exit(1);
