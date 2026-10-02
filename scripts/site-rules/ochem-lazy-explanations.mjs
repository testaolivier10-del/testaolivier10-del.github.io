/* The ochem explanations file is fetched when a question is shown, not with
   the page.

   Audit finding (site audit 2026-10, performance): Practice and Exams
   downloaded every explanation (about 120 KB gzipped) before a session
   started. bank-loader.js now exposes OchemPracticeWhyLoad(), called by
   session-runner.js when a question is shown and by exams-page.js when an
   exam begins. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function ({ ROOT, fail }) {
  const read = (p) => readFileSync(join(ROOT, p), 'utf8');
  const loader = read('ochem/assets/bank-loader.js');
  // Every get(whyUrl…) must sit inside OchemPracticeWhyLoad.
  const body = /window\.OchemPracticeWhyLoad = function\(\)\{([\s\S]*?)\n  \};/.exec(loader);
  const calls = (loader.match(/get\(whyUrl/g) || []).length;
  if (!body || calls !== (body[1].match(/get\(whyUrl/g) || []).length) {
    fail('ochem-lazy-explanations: bank-loader.js fetches practice-bank-why.json outside OchemPracticeWhyLoad().');
  }
  if (!/OchemPracticeWhyLoad\(\)/.test(read('ochem/assets/session-runner.js'))) fail('ochem-lazy-explanations: session-runner.js never asks for the explanations.');
  if (!/OchemPracticeWhyLoad\(\)/.test(read('ochem/assets/exams-page.js'))) fail('ochem-lazy-explanations: exams-page.js never asks for the explanations.');
  for (const page of ['ochem/practice.html', 'ochem/exams.html', 'ochem/review.html']) {
    if (/practice-bank-why\.json/.test(read(page))) fail(`ochem-lazy-explanations: ${page} preloads practice-bank-why.json.`);
  }
}
