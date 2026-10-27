/* The progress and exams pages of the built courses (site redesign round 3, step B3; docs/site-redesign.md,
   boards R10-Progress and R10-AP-Exams). Every course builder runs its built dashboard.html through
   dashboardPage() and its exams.html through examsPage(): both become round 3 inner pages (the short
   cover band, scripts/lib/r3-inner.mjs). nremt/ and ochem/ carry the same band by hand
   (scripts/build-r3-inner.mjs). Throws when the page is not shaped as expected, so a builder change cannot
   drop the redesign silently. */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { r3Inner, unitTestRow } from './r3-inner.mjs';

export const DASH_H1 = 'Where you <span>stand today.</span>';
export const DASH_HAND = 'worked out in your browser from every answer you give';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = { apbio: 'bio', apchem: 'chem', apphys: 'physics', apcalc: 'calculus', apstat: 'statistics', apenv: 'environmental-science', anp: 'anatomy-physiology' };

export function dashboardPage(html, key = 'apbio', up = '../') {
  if (!/<h1>Dashboard<\/h1>/.test(html)) throw new Error('dashboard-page: no "<h1>Dashboard</h1>" to rebuild');
  const link = `<link rel="stylesheet" href="${up}assets/course/dashboard.css">`;
  return r3Inner(html, { key, slug: 'dashboard', up }).replace('</body>', `${link}\n</body>`);
}

/* The exams page, with the free unit tests row under the exam builder (one card per unit test page). */
export function examsPage(html, key, map, up = '../') {
  const tests = map && DIR[key] ? map.chapters
    .filter(c => c.part === 'course' && existsSync(join(ROOT, DIR[key], 'unit-tests', `${c.id}.html`)))
    .map(c => ({ href: `unit-tests/${c.id}.html`, name: `Unit ${c.n}`,
      desc: `${String(c.title).replace(/&/g, "&amp;")} &middot; ${c.weight[0]} to ${c.weight[1]}% of the exam. Exam style, free, with an explanation for every option.` })) : [];
  return r3Inner(html, { key, slug: 'exams', up, after: unitTestRow(tests) });
}
