/* No near-duplicate questions across A&P topics.

   Guards the audit 2026-10 A&P row "six cross-topic pairs are real
   duplicates" (the thymus-less baby, the panic attack, Brown-Séquard, the
   RAAS order, two fetal-shunt pins; three more turned up). A student who
   practices a chapter, or sits a final, met the same item twice. Two
   questions in different topics whose stem and options share 75% or more of
   their content words fail; vary one or drop it. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const STOP = new Set('the a an of to in and or is are which what that this does with for from by on as at it its be most best your you their than into when why how'.split(' '));
const LIMIT = 0.75;

export default function anpDuplicateQuestions({ ROOT, fail }) {
  const dir = join(ROOT, 'anatomy-physiology', 'data', 'questions');
  if (!existsSync(dir)) return;
  const all = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    for (const q of JSON.parse(readFileSync(join(dir, f), 'utf8'))) {
      const text = [q.q, ...(q.options || []), ...(q.variables || []).map((v) => v.name)].join(' ');
      const w = new Set(text.toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((x) => x && !STOP.has(x)));
      all.push({ t: f, id: q.id, w: [...w] });
    }
  }
  // Shared-word counts through an inverted index: only pairs that share a
  // word are ever compared.
  const index = new Map();
  all.forEach((x, i) => { for (const w of x.w) { if (!index.has(w)) index.set(w, []); index.get(w).push(i); } });
  for (let i = 0; i < all.length; i++) {
    const a = all[i], shared = new Map();
    for (const w of a.w) for (const j of index.get(w)) if (j > i && all[j].t !== a.t) shared.set(j, (shared.get(j) || 0) + 1);
    for (const [j, inter] of shared) {
      const b = all[j];
      if (inter / (a.w.length + b.w.length - inter) >= LIMIT) fail(`A&P questions ${a.id} and ${b.id} are near-duplicates across topics; vary or drop one`);
    }
  }
}
