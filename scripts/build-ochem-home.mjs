/* Keeps the ochem homepage's two hand-listed copies of the chapter sequence
   in step with ochem/assets/curriculum.js.

   The homepage shows the course as a path of chapter nodes, and its JSON-LD
   Course carries a "teaches" list and one Syllabus per chapter. Both were
   typed in by hand, and both had stopped at fourteen chapters when the
   course had twenty-three: the path simply ended at Spectroscopy, and the
   structured data told search engines the same. When the chapter order was
   finally changed (a new chapter inserted seventh, one dissolved, two moved)
   there was no way to keep either copy right by hand, so this script
   generates both from the curriculum, and CI fails if they drift.

   What is generated:
     - everything between <!-- mod-path:start --> and <!-- mod-path:end -->
       inside the #modulePath div (one .node per chapter, numbered);
     - the "teaches" array and the "syllabusSections" array of the Course
       object in the page's JSON-LD script. The rest of that script is left
       exactly as written.

     node scripts/build-ochem-home.mjs            rewrite
     node scripts/build-ochem-home.mjs --check    fail if the page is stale (CI)
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const ORIGIN = 'https://levlprep.com';
const PAGE = join(ROOT, 'ochem', 'index.html');

function loadModules() {
  const sandbox = { window: {}, document: {}, localStorage: { getItem: () => null, setItem: () => {} } };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(ROOT, 'ochem', 'assets', 'curriculum.js'), 'utf8'), sandbox);
  return sandbox.window.OchemCurriculum.MODULES;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MODULES = loadModules();
let html = readFileSync(PAGE, 'utf8');
const before = html;

/* ---- the chapter path ------------------------------------------------- */
const START = '<!-- mod-path:start -->', END = '<!-- mod-path:end -->';
const a = html.indexOf(START), b = html.indexOf(END);
if (a === -1 || b === -1 || b < a) {
  console.error(`ochem/index.html: expected ${START} … ${END} inside #modulePath.`);
  process.exit(1);
}
const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const nodes = MODULES.map((m, i) =>
  `      <a class="node" href="learn.html#m-${m.id}" data-module="${m.id}" style="--p:0">\n` +
  `        <span class="ring" aria-hidden="true"><span class="n"><span class="num">${i + 1}</span>${TICK}</span><span class="lock">${LOCK}</span></span>\n` +
  `        <span class="label"><b>${esc(m.title)}</b><small>${m.topics.length} topic${m.topics.length === 1 ? '' : 's'}</small></span>\n` +
  `      </a>`
).join('\n');
html = html.slice(0, a + START.length) + '\n' + nodes + '\n      ' + html.slice(b);

/* ---- the JSON-LD course ----------------------------------------------- */
const sOpen = html.indexOf('<script type="application/ld+json">');
const sBody = sOpen + '<script type="application/ld+json">'.length;
const sClose = html.indexOf('</script>', sBody);
const ld = JSON.parse(html.slice(sBody, sClose));
const course = ld['@graph'].find((n) => n['@type'] === 'Course');
if (!course) { console.error('ochem/index.html: no Course node in the JSON-LD.'); process.exit(1); }
course.teaches = MODULES.map((m) => m.title);
course.syllabusSections = MODULES.map((m, i) => ({
  '@type': 'Syllabus',
  name: m.title,
  position: i + 1,
  url: `${ORIGIN}/ochem/learn.html#m-${m.id}`,
  /* Each topic exists in two forms: the interactive lesson, which is what the
     course "has", and the written section, which is the same topic as prose.
     The syllabus names the lesson and points at the notes alongside it — the
     mirror image of what each notes page's own structured data says about its
     lesson. Listing only one of the pair described half a course.

     A notes-only topic's href IS its notes page, so it would otherwise appear
     twice under two keys; relatedLink is dropped in that case. */
  hasPart: m.topics.map((t) => {
    const url = `${ORIGIN}/ochem/${t.href}`;
    const notes = `${ORIGIN}/ochem/notes/${t.id}.html`;
    return {
      '@type': 'LearningResource',
      name: t.title,
      url,
      ...(url === notes ? {} : { relatedLink: notes }),
    };
  }),
}));
html = html.slice(0, sBody) + '\n' + JSON.stringify(ld, null, 2) + '\n' + html.slice(sClose);

if (html === before) { console.log('ochem/index.html is up to date.'); process.exit(0); }
if (check) {
  console.error('ochem/index.html is stale against curriculum.js. Run: node scripts/build-ochem-home.mjs');
  process.exit(1);
}
writeFileSync(PAGE, html);
console.log('ochem/index.html rewritten from curriculum.js.');
