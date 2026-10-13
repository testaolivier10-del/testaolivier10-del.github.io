/* Every AP® Physics 1 page says the course is Beta and not yet reviewed by an
   AP® Physics 1 teacher, carries the trademark disclaimer and a "Report a
   problem" button, and loads the report dialog; notes pages and the glossary
   report as a page (notes:<topic>, glossary).

   The same guard A&P has (site rule anp-beta-and-report, A&P decisions 74 and
   75), set before the course's first page ships (docs/apbio-spec.md section 1,
   "Quality"). All of it comes from footer() in scripts/lib/apphys-build.mjs.
   Remove the Beta half only after a teacher signs off (docs/apphys-needs-author.md,
   teacher-review). */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { BETA_NOTE } from '../lib/apphys-build.mjs';

export default function apphysBetaAndReport({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (!rel.startsWith('physics/') || rel.startsWith('physics/data/')) continue;
    const html = readFileSync(file, 'utf8');
    if (/<meta http-equiv="refresh"/i.test(html)) continue;
    if (!html.includes(BETA_NOTE)) fail(`${rel}: missing the Beta note ("${BETA_NOTE}")`);
    if (!/class="phys-beta[^"]*"/.test(html)) fail(`${rel}: missing the Beta pill`);
    if (!/class="report-btn"[^>]*data-report-course="apphys"/.test(html)) fail(`${rel}: no "Report a problem" button for the course (data-report-course="apphys")`);
    if (!/assets\/report-question\.js/.test(html)) fail(`${rel}: has a Report button but does not load assets/report-question.js`);
    const m = rel.match(/^physics\/notes\/([^/]+)\.html$/);
    if (m && !html.includes(`data-report-kind="page" data-report-course="apphys" data-report-question="notes:${m[1]}"`)) fail(`${rel}: the notes page has no page report (notes:${m[1]})`);
    if (rel === 'physics/glossary.html' && !html.includes('data-report-question="glossary"')) fail(`${rel}: no page report for the glossary`);
  }
}
