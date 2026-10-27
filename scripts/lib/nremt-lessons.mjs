/* The NREMT lesson data (nremt/data/lessons/*.json, docs/nremt-lessons-spec.md),
   checked and in textbook order: by chapter, then by the section's place in
   the chapter. Shared by scripts/build-nremt-lessons.mjs and
   scripts/build-nremt-notes-pages.mjs (each section links to its lesson). */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function loadLessons(root, chapters) {
  const dir = join(root, 'nremt', 'data', 'lessons');
  if (!existsSync(dir)) return [];
  const where = new Map();
  chapters.forEach((ch) => ch.sections.forEach((s, i) => where.set(s.id, [ch.num, i])));
  const out = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    const L = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const bad = (m) => { throw new Error(`nremt/data/lessons/${f}: ${m}`); };
    if (L.id !== f.replace(/\.json$/, '')) bad('id must match the file name');
    if (!where.has(L.section)) bad(`section ${L.section} is not in study-notes.json`);
    if (where.get(L.section)[0] !== L.chapter) bad(`section ${L.section} is not in chapter ${L.chapter}`);
    for (const k of ['title', 'hook', 'summary']) if (!L[k]) bad(`missing ${k}`);
    if (!Array.isArray(L.steps) || L.steps.length < 3) bad('needs at least 3 steps');
    if (!Array.isArray(L.check) || L.check.length < 3) bad('needs at least 3 check questions');
    L.check.forEach((q, i) => {
      if (!Array.isArray(q.options) || q.options.length !== 4) bad(`question ${i + 1} needs 4 options`);
      if (!(q.correct >= 0 && q.correct < 4)) bad(`question ${i + 1} has no valid answer`);
      if (!q.why) bad(`question ${i + 1} has no explanation`);
    });
    return L;
  });
  const ids = new Set();
  for (const L of out) { if (ids.has(L.section)) throw new Error(`two lessons for section ${L.section}`); ids.add(L.section); }
  return out.sort((a, b) => { const [ca, sa] = where.get(a.section), [cb, sb] = where.get(b.section); return ca - cb || sa - sb; });
}
