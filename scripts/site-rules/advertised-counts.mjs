/* Counts the site advertises outside the HTML sweep match the data.

   Audit finding (site audit 2026-10, Fix-first 10): the purchase dialog sold
   the ochem bank as "3,795 questions" (it held 3,635), the 404 page said
   "Sixty-two interactive topics" (121), the ochem manifest said "14-module"
   (23 chapters), and the A&P glossary said "1041 terms". check-site's
   sections 6 and 8 read HTML only, so a figure in a script or a manifest, or
   one spelled out in words, slipped past. This checks:
   - each "The full N-question bank" in premium.js against its bank;
   - the manifests' chapter, topic, question and tool counts;
   - no topic, lesson, mechanism or question count spelled out in words
     ("Sixty-two topics") in a page's visible text, since a word cannot be
     checked against data;
   - no "N-module" description of the ochem course (it has chapters). */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { counts, fmt } from '../lib/premium-data.mjs';

const WORD_NUM = /\b(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|one hundred)(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?\s+(?:interactive\s+|chemistry\s+|reaction\s+)?(?:topics|lessons|questions|mechanisms)\b/i;

function walkFiles(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (['.git', 'node_modules', 'docs', 'scripts', '.github', '.claude', 'data', 'worker', 'vendor'].includes(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkFiles(p, out);
    else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}

export default function ({ ROOT, fail }) {
  const N = counts();

  const prem = readFileSync(join(ROOT, 'assets', 'premium.js'), 'utf8');
  for (const m of prem.matchAll(/The full ([\d,]+)-question bank[^\n]*\/\/ count:(\w+)/g)) {
    if (m[1] !== fmt(N[m[2]])) fail(`advertised-counts: premium.js sells the ${m[2]} bank as ${m[1]} questions; it holds ${fmt(N[m[2]])}. Run node scripts/build-pricing.mjs.`);
  }
  if (/\b\d[\d,]*-question bank(?![^\n]*\/\/ count:)/.test(prem)) fail('advertised-counts: premium.js has a question count not marked // count:<course>, so nothing keeps it current.');

  const expect = {
    'ochem/manifest.json': [[/(\d+) chapters/, N.ochemChapters], [/(\d+) topics/, N.ochemTopics], [/(\d+) interactive tools/, N.ochemTools]],
    'nremt/manifest.json': [[/([\d,]+)-question bank/, fmt(N.nremt)]],
    'anatomy-physiology/manifest.json': [[/(\d+) chapters/, N.anpChapters]],
  };
  for (const [rel, checks] of Object.entries(expect)) {
    const desc = JSON.parse(readFileSync(join(ROOT, rel), 'utf8')).description || '';
    if (/\d+-module/.test(desc)) fail(`advertised-counts: ${rel} describes the course in modules; it has chapters.`);
    for (const [re, want] of checks) {
      const m = re.exec(desc);
      if (!m) fail(`advertised-counts: ${rel} no longer states ${re} (build-pricing.mjs writes it).`);
      else if (String(m[1]) !== String(want)) fail(`advertised-counts: ${rel} says ${m[0]}; the data says ${want}.`);
    }
  }

  for (const file of walkFiles(ROOT)) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel === 'changelog.html') continue; // dated record
    const text = readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
    const m = WORD_NUM.exec(text);
    if (m) fail(`advertised-counts: ${rel} says "${m[0]}"; write counts as digits generated from the data, so they can be checked.`);
  }
}
