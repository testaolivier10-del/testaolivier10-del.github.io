/* The progress and exams pages of the built courses (site redesign round 3, step B3; docs/site-redesign.md,
   boards R10-Progress and R10-AP-Exams). Every course builder runs its built dashboard.html through
   dashboardPage() and its exams.html through examsPage(): both become round 3 inner pages (the short
   cover band, scripts/lib/r3-inner.mjs). nremt/ and ochem/ carry the same band by hand
   (scripts/build-r3-inner.mjs). Throws when the page is not shaped as expected, so a builder change cannot
   drop the redesign silently. */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { r3Inner, unitTestRow, COURSES } from './r3-inner.mjs';

export const DASH_H1 = 'Where you <span>stand today.</span>';
export const DASH_HAND = 'worked out in your browser from every answer you give';

/* Round 4 (docs/course-redesign-r4.md decisions 3 and 7): the Progress tab opens with the small inner band: the
   course name on the issue line, the title "Progress" and one sub line, no buttons. The sub line starts as the
   sentence below; assets/course/dash.js puts the one-sentence status there (data-d5-status) and the level chip
   under it once the page has worked them out. */
export const PROGRESS_SUB = 'Worked out in your browser from every answer you give';
export function progressBand(key, up = '../', o = {}) {
  if (!COURSES[key]) throw new Error(`dashboard-page: unknown course ${key}`);
  return `<section class="band short"${o.id ? ` id="${o.id}"` : ''} aria-labelledby="r3Title"><div class="hwrap"><div>
<p class="issue">${COURSES[key].label} <i></i></p>
<h1 class="deck" id="r3Title">Progress</h1>
<p class="lede"${o.ledeId ? ` id="${o.ledeId}"` : ''} data-d5-status>${PROGRESS_SUB}</p>
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async"></div></div></section>`;
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = { apbio: 'bio', apchem: 'chem', apphys: 'physics', apcalc: 'calculus', apcalcbc: 'calculus-bc', apstat: 'statistics', apenv: 'environmental-science', appsych: 'psychology', apprecalc: 'precalculus', apmacro: 'macroeconomics', apmicro: 'microeconomics', anp: 'anatomy-physiology' };

export function dashboardPage(html, key = 'apbio', up = '../') {
  if (!/<h1>(?:Progress|Dashboard)<\/h1>/.test(html)) throw new Error('dashboard-page: no "<h1>Progress</h1>" to rebuild');
  // The five-question dashboard (docs/dashboard.md): its styles and the two shared scripts. The course's own
  // dashboard script waits for DOMContentLoaded, so these may come after it in the page.
  const link = `<link rel="stylesheet" href="${up}assets/course/dashboard.css">\n<link rel="stylesheet" href="${up}assets/course/dash.css">\n<script src="${up}assets/course/dash.js" defer></script>\n<script src="${up}assets/course/dash-ap.js" defer></script>`;
  const out = r3Inner(html, { key, slug: 'dashboard', up });
  const band = /<section class="band short"[\s\S]*?<\/section>/;
  if (!band.test(out)) throw new Error('dashboard-page: r3Inner wrote no band to replace');
  return out.replace(band, progressBand(key, up)).replace('</body>', `${link}\n</body>`);
}

/* The exams page, with the free unit tests row under the exam builder (one card per unit test page). */
export function examsPage(html, key, map, up = '../') {
  const tests = map && DIR[key] ? map.chapters
    .filter(c => c.part === 'course' && existsSync(join(ROOT, DIR[key], 'unit-tests', `${c.id}.html`)))
    .map(c => ({ href: `unit-tests/${c.id}.html`, name: `Unit ${c.n}`,
      desc: `${String(c.title).replace(/&/g, "&amp;")} &middot; ${c.weight[0]} to ${c.weight[1]}% of the exam. Exam style, free, with an explanation for every option.` })) : [];
  return r3Inner(html, { key, slug: 'exams', up, after: unitTestRow(tests) });
}
