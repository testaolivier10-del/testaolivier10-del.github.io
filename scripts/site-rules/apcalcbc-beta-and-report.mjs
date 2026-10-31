/* Every AP® Calculus BC page says the course is Beta and not yet reviewed by an
   AP® Calculus BC teacher, carries the trademark disclaimer and a "Report a
   problem" button, and loads the report dialog; notes pages and the glossary
   report as a page (notes:<topic>, glossary).

   The same guard A&P has (site rule anp-beta-and-report, A&P decisions 74 and
   75), set before the course's first page ships (docs/apbio-spec.md section 1,
   "Quality"). All of it comes from footer() in scripts/lib/apcalc-build.mjs (BC profile).
   Remove the Beta half only after a teacher signs off (docs/apcalcbc-needs-author.md,
   teacher-review). */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
const BETA_NOTE = 'This course has not yet been reviewed by an AP® Calculus BC teacher.';

export default function apcalcbcBetaAndReport({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (!rel.startsWith('calculus-bc/') || rel.startsWith('calculus-bc/data/')) continue;
    const html = readFileSync(file, 'utf8');
    if (/<meta http-equiv="refresh"/i.test(html)) continue;
    if (!html.includes(BETA_NOTE)) fail(`${rel}: missing the Beta note ("${BETA_NOTE}")`);
    // The Beta pill is gone (Olivier, 2026-10-26: "the label of beta should be removed"); the review note stays.
    if (!/class="report-btn"[^>]*data-report-course="apcalcbc"/.test(html)) fail(`${rel}: no "Report a problem" button for the course (data-report-course="apcalcbc")`);
    if (!/assets\/report-question\.js/.test(html)) fail(`${rel}: has a Report button but does not load assets/report-question.js`);
    const m = rel.match(/^calculus-bc\/notes\/([^/]+)\.html$/);
    if (m && !html.includes(`data-report-kind="page" data-report-course="apcalcbc" data-report-question="notes:${m[1]}"`)) fail(`${rel}: the notes page has no page report (notes:${m[1]})`);
    if (rel === 'calculus-bc/glossary.html' && !html.includes('data-report-question="glossary"')) fail(`${rel}: no page report for the glossary`);
  }
}
