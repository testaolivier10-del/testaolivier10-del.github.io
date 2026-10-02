/* Lists, for each ochem topic, the terms it uses before the course teaches
   them, and the cross-reference links whose "later"/"earlier" wording no
   longer matches the chapter order. See scripts/lib/ochem-order.mjs for what
   counts as a term and a use.

     node scripts/ochem-forward-refs.mjs                  report, topic by topic
     node scripts/ochem-forward-refs.mjs --topic=<id>     one topic
     node scripts/ochem-forward-refs.mjs --diff=<file>    only the forward references that a
                                                          different curriculum.js (an older
                                                          order) did not have
     node scripts/ochem-forward-refs.mjs --write-baseline rewrite the accepted list the
                                                          ochem-sequencing check ratchets on

   The baseline (scripts/ochem-forward-refs-baseline.json) is the forward
   references that were read and accepted: a labeled one-line preview, or a
   word that is only named, not leaned on. scripts/site-rules/ochem-sequencing.mjs
   fails on any (topic, term) pair that is not in it, so a reorder or a new
   paragraph cannot add one silently. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModules, topicSources, glossaryTerms, forwardRefs, directionProblems } from './lib/ochem-order.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const MODULES = loadModules(ROOT);
const sources = topicSources(ROOT, MODULES);
const terms = glossaryTerms(ROOT);
let refs = forwardRefs(MODULES, sources, terms);
const key = (r) => `${r.topic} ${r.term}`;

if (process.argv.includes('--write-baseline')) {
  const base = {};
  for (const r of refs) (base[r.topic] ||= []).includes(r.term) || base[r.topic].push(r.term);
  for (const k of Object.keys(base)) base[k].sort();
  writeFileSync(join(ROOT, 'scripts', 'ochem-forward-refs-baseline.json'), JSON.stringify(base, null, 1) + '\n');
  console.log(`wrote ${Object.values(base).flat().length} accepted (topic, term) pairs`);
  process.exit(0);
}

if (arg('diff')) {
  const old = loadModules(ROOT, readFileSync(arg('diff'), 'utf8'));
  const had = new Set(forwardRefs(old, topicSources(ROOT, old), terms).map(key));
  refs = refs.filter((r) => !had.has(key(r)));
}
const only = arg('topic');
const byTopic = {};
for (const r of refs) if (!only || r.topic === only) (byTopic[r.topic] ||= []).push(r);
for (const m of MODULES) for (const t of m.topics) {
  const rs = byTopic[t.id];
  if (!rs) continue;
  console.log(`\n${m.id} / ${t.id}`);
  for (const r of rs) console.log(`  ${r.term}  (taught in ${r.taughtIn})  ${r.kind} ${r.file} x${r.count}`);
}
const dir = directionProblems(MODULES, sources).filter((d) => !only || d.topic === only);
if (dir.length) {
  console.log('\nDirection words that contradict the order:');
  for (const d of dir) console.log(`  ${d.topic} [${d.kind}] -> ${d.target} says "${d.says}": ${d.sentence.slice(0, 220)}`);
}
console.log(`\n${refs.length} forward uses, ${dir.length} direction problems.`);
