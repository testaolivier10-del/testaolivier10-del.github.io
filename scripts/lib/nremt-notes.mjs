/* The NREMT study notes as the build scripts see them: the chapters from
   nremt/assets/study-notes.json, and the one rule that turns a chapter into
   the file name of its own page under nremt/notes/.

   Shared by build-nremt-notes-pages.mjs (which writes those pages) and
   build-nremt-notes-toc.mjs (which links to them from study-notes.html), so
   the two cannot disagree about where a chapter lives. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadChapters(root) {
  const data = JSON.parse(readFileSync(join(root, 'nremt', 'assets', 'study-notes.json'), 'utf8'));
  const chapters = Array.isArray(data.chapters) ? data.chapters : null;
  if (!chapters || !chapters.length) throw new Error('nremt/assets/study-notes.json has no chapters');
  return chapters;
}

/* "Ventilation & Oxygen Equipment" -> "ventilation-and-oxygen-equipment".
   From the title rather than the number, so the URL says what the page is
   about; a chapter renamed gets a new URL, which is the honest result. */
export function chapterSlug(ch) {
  return String(ch.title).toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
