/* No page, script or manifest promises more free access than Premium allows.

   Audit finding (site audit 2026-10, "Free vs Premium, legal and trust"):
   "The teaching material is free, permanently" (hub, terms, sources), "Every
   lesson and notes page free" (A&P home), "Free, offline, no account needed"
   (manifests), "Free Anatomy & Physiology Course" and "A free timed practice
   exam" (titles and descriptions) all contradicted Premium locking lessons,
   exams and AI answers; and "Pass guarantee" promised more than a 90-day
   extension with conditions. The site now says one sentence everywhere
   (FREE_SENTENCE in scripts/lib/premium-data.mjs).

   The changelog is a dated record and may quote the old names; docs/ and
   tests are not published. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const BANNED = [
  [/free,? permanently/i, 'say what is free: notes and textbook pages free forever, early-chapter lessons free'],
  [/\bevery (interactive )?lesson[^.<"]{0,40}\bfree\b/i, 'only the early chapters\' lessons are free'],
  // Allowed when it is scoped: "No account is needed for any free feature except …".
  [/\b(no|without an?) (account|sign-?up|signup|login)( is)? (needed|required)\b(?![^.]{0,40}free feature)/i, 'AI answers and buying need an account; say "free to start" or name the free features'],
  [/\bpass[- ]guarantee\b/i, 'it is called Pass-or-extend'],
  [/\bFree Anatomy (&amp;|&) Physiology\b/, 'the course is free to start, not free'],
  [/\b(a|the) (complete )?free (NREMT|timed|interactive organic)/i, 'say "free to start" or "one free"'],
  [/\bteaching material (is|stays) free/i, 'notes and textbook pages are free; lessons outside the early chapters are not'],
];

const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs', 'scripts', '.github', '.claude', 'data']);
const ALLOW_FILES = new Set(['changelog.html']);

function files(dir, root, out = []) {
  for (const f of readdirSync(dir)) {
    if (SKIP_DIRS.has(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) files(p, root, out);
    else if (/\.(html|js|json)$/.test(f) && !/(^|-)bank|questions\.json$|tool-data|glossary\.json$|notes-index|tutor-bank/.test(f)) out.push(p);
  }
  return out;
}

export default function ({ ROOT, fail }) {
  const list = files(ROOT, ROOT);
  // Generators write copy too: check the sources that produce pages.
  for (const g of ['build-anp.mjs', 'build-og-images.mjs', 'build-nremt-notes-toc.mjs', 'build-pricing.mjs', 'build-tool-pages.mjs', 'lib/anp-build.mjs']) {
    const p = join(ROOT, 'scripts', g);
    if (existsSync(p)) list.push(p);
  }
  for (const file of list) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (ALLOW_FILES.has(rel) || rel.startsWith('worker/dist/') || rel.includes('/vendor/')) continue;
    const text = readFileSync(file, 'utf8');
    for (const [re, why] of BANNED) {
      const m = re.exec(text);
      if (m) fail(`free-claims: ${rel} says "${m[0]}": ${why}.`);
    }
  }
}
