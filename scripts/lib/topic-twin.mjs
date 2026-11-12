/* One page per topic in search (docs/site-health.md, 2026-11-11).

   Every topic has a notes page and a lesson page whose titles differ by one
   word ("… Notes | LevlPrep", "… Lesson | LevlPrep"): two URLs asking Google
   for the same search. The notes page is the one written to be read from a
   search (plain text, free, quick answer, video), so it is the page listed
   and indexed. The lesson stays on the site, linked from the notes, the path
   and the textbook, but carries "noindex, follow" in the deployed copy and is
   left out of sitemap.xml.

   rel: a path relative to the repo root, with forward slashes. Returns the
   notes page's path when rel is a lesson with a notes page for the same
   topic, else null. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function notesTwin(rel) {
  const parts = rel.split('/');
  if (parts.length !== 3 || parts[1] !== 'lessons' || !rel.endsWith('.html')) return null;
  const notes = `${parts[0]}/notes/${parts[2]}`;
  return fs.existsSync(path.join(ROOT, notes)) ? notes : null;
}

/* The page with its robots meta set to "noindex, follow" ("follow" so the
   links on it still count). */
export function withNoindex(rel, html) {
  const tag = '<meta name="robots" content="noindex, follow">';
  if (/<meta\s+name="robots"[^>]*>/i.test(html)) return html.replace(/<meta\s+name="robots"[^>]*>/i, tag);
  const headEnd = html.indexOf('</head>');
  if (headEnd < 0) throw new Error(`topic-twin: ${rel} has no head`);
  return html.slice(0, headEnd) + tag + '\n' + html.slice(headEnd);
}
