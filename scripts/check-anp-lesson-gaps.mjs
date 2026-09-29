#!/usr/bin/env node
/* Lesson gaps: ideas a lesson tests or states but never teaches.

   A lesson teaches through its anatomy caption, its causal chain and its key
   ideas; the full prose lives on the notes page. The ordering check only asks
   whether a term is used before the topic that owns it, so a lesson can pass
   while its check questions, misconception box or summary lean on one of its
   own topic's concepts that only the notes page explains. A student who does
   the lesson alone then meets that idea untaught.

   For each built topic, this lists every concept the topic owns (taughtIn)
   whose words appear in the misconception box, the summary or a check
   question, but nowhere in the caption, the chain or the key ideas.

   Usage: node scripts/check-anp-lesson-gaps.mjs [--json] [--topic <id>] [--check]
   --check exits 1 when any gap is found. */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCourse } from './lib/anp-build.mjs';
import { scanUseTerms, termRegex, everydaySet, stripForScan } from './lib/anp-map.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const only = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;
const C = loadCourse(ROOT);
const everyday = everydaySet(C.map);
const plain = s => stripForScan(String(s || ''));

function findTerm(concept, text) {
  for (const t of scanUseTerms(concept)) {
    if (everyday.has(t.toLowerCase())) continue;
    const m = text.match(termRegex(t));
    if (m) return m[0];
  }
  return null;
}

const report = [];
for (const t of C.map.topics) {
  if (!C.built.has(t.id) || (only && t.id !== only)) continue;
  const L = C.lessons[t.id];
  const bank = new Map(C.questions[t.id].map(q => [q.id, q]));
  const taught = plain([
    L.anatomy && L.anatomy.caption,
    ...L.chain.flatMap(s => [s.cause, s.effect]),
    ...(L.ideas || []),
  ].join('\n'));
  const uses = [
    ['misconception', plain(`${L.misconception.wrong}\n${L.misconception.right}`)],
    ['summary', plain(L.summary)],
    ...L.check.map(id => {
      const q = bank.get(id) || {};
      const why = q.why || {};
      return [id, plain([q.q, ...(q.options || []), ...(q.steps || []), why.correct, ...(why.options || []),
        ...(q.variables || []).flatMap(v => [v.name, v.why])].join('\n'))];
    }),
  ];
  const gaps = [];
  for (const c of C.map.concepts) {
    if (c.taughtIn !== t.id || findTerm(c, taught)) continue;
    const where = uses.map(([k, text]) => [k, findTerm(c, text)]).filter(([, m]) => m);
    if (where.length) gaps.push({ concept: c.id, term: c.term, found: where.map(([k, m]) => `${k} ("${m}")`) });
  }
  if (gaps.length) report.push({ topic: t.id, chapter: t.chapter, gaps });
}

if (args.includes('--json')) console.log(JSON.stringify(report, null, 1));
else {
  for (const r of report) {
    console.log(`${r.topic} (${r.chapter})`);
    for (const g of r.gaps) console.log(`  ${g.concept}: ${g.found.join(', ')}`);
  }
  const n = report.reduce((a, r) => a + r.gaps.length, 0);
  console.log(`\n${report.length} of ${C.built.size} lessons have gaps; ${n} concepts in all.`);
}
if (args.includes('--check') && report.length) process.exit(1);
