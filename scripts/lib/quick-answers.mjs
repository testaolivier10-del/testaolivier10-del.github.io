/* The quick answer box on notes pages, from docs/quick-answers.json.

   Why. Search engines and AI assistants (ChatGPT became the site's largest
   named source of visits in October 2026, with Bing behind it) quote a short,
   direct answer to the question a student actually typed. The notes pages
   open with a story or a lead, which reads well but is not that answer. The
   box gives it in two or three sentences, using only facts the page already
   teaches, right under the page header.

   applyQuickAnswer(rel, html) owns everything between the two markers: it
   removes the box and, when the data lists one for the page, writes it back
   directly after the page header (before the video block, if any). It is
   idempotent and is called from applyVideo() (scripts/lib/videos.mjs), so
   every course builder, both notes generators and build-videos.mjs --check
   write and check it with no change of their own. docs/quick-answers.md has
   the rules for writing one. */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const QA_FILE = 'docs/quick-answers.json';
export const QA_START = '<!-- quick-answer:start -->';
export const QA_END = '<!-- quick-answer:end -->';
const MAX_Q = 120, MAX_A = 420;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Problems with the data, as sentences (empty when it is sound). */
export function validateQuickAnswers(data, root = ROOT) {
  const errs = [];
  if (!data || typeof data.pages !== 'object' || !data.pages) return [`${QA_FILE}: needs a "pages" object`];
  for (const [rel, qa] of Object.entries(data.pages)) {
    const where = `${QA_FILE} ${rel}`;
    if (!/^[a-z-]+\/notes\/[a-z0-9-]+\.html$/.test(rel)) errs.push(`${where}: only notes pages get a quick answer`);
    else if (!existsSync(join(root, rel))) errs.push(`${where}: page does not exist`);
    if (!qa || typeof qa.q !== 'string' || typeof qa.a !== 'string') { errs.push(`${where}: needs "q" and "a"`); continue; }
    if (!qa.q.trim().endsWith('?')) errs.push(`${where}: the question must end with a question mark`);
    if (qa.q.length > MAX_Q) errs.push(`${where}: question longer than ${MAX_Q} characters`);
    if (qa.a.length > MAX_A) errs.push(`${where}: answer longer than ${MAX_A} characters (two or three sentences)`);
    if (/[—–]|\s-\s/.test(qa.q + ' ' + qa.a)) errs.push(`${where}: no dashes as punctuation (site rule)`);
    if (/<|>/.test(qa.q + qa.a)) errs.push(`${where}: plain text only`);
  }
  return errs;
}

let cached = null;
export function loadQuickAnswers(root = ROOT) {
  if (cached && root === ROOT) return cached;
  const file = join(root, QA_FILE);
  const data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { pages: {} };
  const out = { data, byPage: new Map(Object.entries(data.pages || {})) };
  if (root === ROOT) cached = out;
  return out;
}

export function quickAnswerBox(rel, qa) {
  const id = 'qa-' + rel.replace(/^.*\//, '').replace(/\.html$/, '');
  return `${QA_START}
<div class="qa-box">
  <link rel="stylesheet" href="/assets/quick-answer.css">
  <p class="qa-k">Quick answer</p>
  <p class="qa-q" id="${id}">${esc(qa.q.trim())}</p>
  <p class="qa-a">${esc(qa.a.trim())}</p>
</div>
${QA_END}
`;
}

// The same spot the video block uses on notes pages (scripts/lib/videos.mjs SPOTS).
const HEAD_RE = /<header class="bk-head">[\s\S]*?<\/header>\n|<header class="tb-chapter-head">[\s\S]*?<\/header>\n/;
const BOX_RE = new RegExp(`[ \\t]*${QA_START}[\\s\\S]*?${QA_END}\\n?`, 'g');

export function applyQuickAnswer(rel, html, answers = loadQuickAnswers()) {
  const stripped = html.replace(BOX_RE, '');
  const qa = answers.byPage.get(rel);
  if (!qa) return stripped;
  const m = stripped.match(HEAD_RE);
  if (!m) throw new Error(`${rel}: ${QA_FILE} lists a quick answer but the page has no notes header`);
  const at = m.index + m[0].length;
  return stripped.slice(0, at) + quickAnswerBox(rel, qa) + stripped.slice(at);
}
