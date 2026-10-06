/* The ochem textbook shows one section at a time, and the glossary page
   stays cheap to lay out.

   Audit finding (site audit 2026-10, performance): ochem/learn.html was
   134,000 px tall at 390 px for chapter 1 (every section's notes fetched and
   shown) and the glossary 94,000 px (every definition open). Measured after
   the fix: about 13,000 and 2,400 px. The glossary later moved to the shared
   page every course uses (owner decision 2026-10-06, docs/course-shell.md:
   every definition visible), which keeps the cost down by laying out only
   the letter groups near the screen (content-visibility in glossary.css). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function ({ ROOT, fail }) {
  const tb = readFileSync(join(ROOT, 'ochem/assets/textbook.js'), 'utf8');
  const render = /function renderChapter\(index\)\{([\s\S]*?)\n  \}\n/.exec(tb);
  if (!render || /loadNotes\(/.test(render[1])) fail('ochem-long-pages: textbook.js renderChapter() fetches every section; showSection() fetches one.');
  if (!/function showSection\(/.test(tb)) fail('ochem-long-pages: textbook.js lost showSection() (one section at a time).');
  const css = readFileSync(join(ROOT, 'assets/course/glossary.css'), 'utf8');
  if (!/\.gx-group\{[^}]*content-visibility:auto/.test(css)) fail('ochem-long-pages: assets/course/glossary.css must keep content-visibility:auto on .gx-group (1,000 visible definitions).');
}
