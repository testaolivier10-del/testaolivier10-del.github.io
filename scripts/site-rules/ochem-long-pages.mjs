/* The ochem textbook shows one section at a time and the glossary opens one
   letter at a time.

   Audit finding (site audit 2026-10, performance): ochem/learn.html was
   134,000 px tall at 390 px for chapter 1 (every section's notes fetched and
   shown) and the glossary 94,000 px (every definition open). Measured after
   the fix: about 13,000 and 2,400 px. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function ({ ROOT, fail }) {
  const tb = readFileSync(join(ROOT, 'ochem/assets/textbook.js'), 'utf8');
  const render = /function renderChapter\(index\)\{([\s\S]*?)\n  \}\n/.exec(tb);
  if (!render || /loadNotes\(/.test(render[1])) fail('ochem-long-pages: textbook.js renderChapter() fetches every section; showSection() fetches one.');
  if (!/function showSection\(/.test(tb)) fail('ochem-long-pages: textbook.js lost showSection() (one section at a time).');
  const gl = readFileSync(join(ROOT, 'ochem/assets/glossary-page.js'), 'utf8');
  if (!/dl\.hidden = true;/.test(gl) || !/class="ogl-toggle"/.test(gl)) fail('ochem-long-pages: glossary-page.js must render each letter collapsed behind its toggle.');
}
