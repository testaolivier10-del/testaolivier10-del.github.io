/* A&P Practice, Review and Exams never load the whole bank.

   Guards the audit 2026-10 A&P row "Practice, Review, Exams download the whole
   bank first: 54 files, 4.2 MB". They read assets/bank/index.json
   (AnpCore.loadIndex), fetch only the chapters a set draws from
   (loadQuestions) and explanations after an answer (loadWhy).
   scripts/check-console.mjs runs each page and checks what it fetched. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export default function anpLazyBank({ ROOT, fail }) {
  for (const app of ['practice', 'review', 'exams']) {
    const p = join(ROOT, 'anatomy-physiology', 'assets', 'apps', `${app}.js`);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, 'utf8');
    if (/AnpCore\.loadBank\s*\(/.test(src)) fail(`anatomy-physiology/assets/apps/${app}.js calls AnpCore.loadBank (every chapter); use loadIndex + loadQuestions`);
  }
  if (!existsSync(join(ROOT, 'anatomy-physiology', 'assets', 'bank', 'index.json'))) fail('anatomy-physiology/assets/bank/index.json is missing (run scripts/build-anp.mjs)');
}
