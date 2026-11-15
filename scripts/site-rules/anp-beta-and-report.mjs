/* Every A&P page says the course is Beta and not yet reviewed by a licensed
   A&P instructor, and every notes page and the glossary has a "Report a
   problem" button.

   Guards audit 2026-10 fix 11 (the A&P row "No Beta or review label") and the
   row "Notes and glossary: no Report a problem link, only on questions".
   Both come from scripts/build-anp.mjs (footer() and reportPage()). The review half was
   dropped from the footer on 2026-11-14 (owner; About and Sources still say it). */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';

const NOTE = 'licensed A&amp;P instructor has reviewed it yet';

export default function anpBetaAndReport({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (!rel.startsWith('anatomy-physiology/') || rel.startsWith('anatomy-physiology/data/')) continue;
    const html = readFileSync(file, 'utf8');
    if (/<meta http-equiv="refresh"/i.test(html)) continue;
    if (/^anatomy-physiology\/(notes\/[^/]+|glossary)\.html$/.test(rel)) {
      if (!/data-report-kind="page"[^>]*data-report-question="[^"]+"/.test(html)) fail(`${rel}: no "Report a problem" button for the page`);
      if (!/assets\/report-question\.js/.test(html)) fail(`${rel}: has a Report button but does not load assets/report-question.js`);
    }
  }
}
