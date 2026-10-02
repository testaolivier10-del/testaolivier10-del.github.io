/* A meta description stands on its own: it ends a sentence, and it does not
   point back at a page the searcher has not read.

   Audit finding (site audit 2026-10, SEO): eight notes descriptions were
   auto-extracted openers like "You have used pKa twice already", "In the last
   topic you saw … at a PO 2 of 100", and one ending mid-sentence on a colon.
   Those now have hand-written descriptions (scripts/ochem-notes-descriptions.json,
   anatomy-physiology/data/descriptions.json); this keeps new ones out. */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';

const BACKREF = /\b(in the last (topic|section|chapter)|you have (already )?(used|met|seen)|you met\b|the earlier sections?|recall (its|that|the)|as we saw|already know)\b/i;

export default function ({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel.startsWith('scripts/') || rel.startsWith('docs/')) continue;
    const html = readFileSync(file, 'utf8');
    if (/http-equiv="refresh"/i.test(html)) continue;
    const m = html.match(/<meta name="description" content="([^"]*)"/);
    if (!m) continue;
    const d = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
    const b = BACKREF.exec(d);
    if (b) fail(`description-openers: ${rel} description says "${b[0]}", which points at a page the searcher has not read; write one that stands alone.`);
    if (!/[.!?…]["”’)]?$/.test(d)) fail(`description-openers: ${rel} description does not end a sentence: "…${d.slice(-40)}".`);
  }
}
