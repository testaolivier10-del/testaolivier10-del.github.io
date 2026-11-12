/* What a free ochem lesson says before its script runs (docs/site-health.md,
   "Fuller tool and lesson pages", 2026-11-12).

   An ochem lesson is a hero, a progress bar and an empty #card: every step a
   student reads lives in the page's inline OchemLessonEngine.start({ steps })
   call and only appears once lesson-engine.js renders it. A reader without
   JavaScript, Bing and the AI assistants' crawlers saw about 60 words on each
   free lesson (the 22 in the sitemap).

   This writes the lesson's own explain steps (title, text and figure) into
   #card, inside a closed "Read this lesson as text" line. The engine sets
   card.innerHTML when it starts, so a student with JavaScript sees no change.
   No new words: only what the steps already say. Questions are left out, so
   no answer is given away. Premium lessons are skipped (scripts/vault/rules.mjs
   decides which are free), so nothing locked is put in the HTML, and so is
   formal-charge.html, which predates the engine and builds its steps in code.

   Only what is between the markers is generated:
     <!-- ls-text:start --> ... <!-- ls-text:end -->

     node scripts/build-ochem-lesson-text.mjs            rewrite
     node scripts/build-ochem-lesson-text.mjs --check    fail if stale (CI)

   Run it after build-ochem-figures.mjs: the figures are copied from the steps. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { premiumCourse } from './vault/rules.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIR = join(ROOT, 'ochem', 'lessons');
const check = process.argv.includes('--check');
const START = '<!-- ls-text:start -->';
const END = '<!-- ls-text:end -->';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The steps, by running the page's start call against a stub engine. */
function steps(html, file) {
  const src = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('OchemLessonEngine.start'));
  if (!src) return null; // formal-charge.html predates the engine and owns its own step loop
  let opts = null;
  const el = () => ({ style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild() {}, querySelector: () => null });
  const sandbox = {
    window: { OchemLessonEngine: { start(o) { opts = o; } } },
    document: { addEventListener: (e, cb) => cb(), getElementById: el, querySelector: () => null, createElement: el },
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  if (!opts || !Array.isArray(opts.steps)) throw new Error(`${file}: start call gave no steps`);
  return opts.steps;
}

/* A copy of a step's markup that cannot clash with the live one: no figure
   markers (build-ochem-figures.mjs owns those), no ids, no controls. */
function copy(html) {
  return String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s(id|aria-labelledby|aria-describedby|for)="[^"]*"/g, '')
    .replace(/<button[\s\S]*?<\/button>/g, '')
    .replace(/<(input|select|textarea)\b[^>]*>/g, '');
}

function block(list) {
  const parts = list
    .filter((s) => s.type === 'explain' && s.title)
    .map((s) => `<h2 class="tool-about-h">${esc(s.title)}</h2>${copy(s.bodyHtml)}${copy(s.diagramHtml)}`);
  if (!parts.length) return '';
  return `<details class="tool-about ls-text"><summary>Read this lesson as text</summary>${parts.join('')}</details>`;
}

let stale = 0;
let done = 0;
for (const name of readdirSync(DIR).filter((f) => f.endsWith('.html')).sort()) {
  const file = join(DIR, name);
  const html = readFileSync(file, 'utf8');
  if (premiumCourse(`ochem/lessons/${name}`, html)) continue;
  const list = steps(html, name);
  if (!list) { console.log(`skipped (no engine steps): ochem/lessons/${name}`); continue; }
  const inner = block(list);
  const want = `${START}${inner}${END}`;
  let out;
  if (html.includes(START)) {
    out = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => want);
  } else {
    const card = /(<div class="lesson-card" id="card"[^>]*>)(<\/div>)/;
    if (!card.test(html)) throw new Error(`${name}: no empty #card to write into`);
    out = html.replace(card, (m, a, b) => `${a}${want}${b}`);
  }
  done++;
  if (out === html) continue;
  stale++;
  if (check) console.error(`stale: ochem/lessons/${name}`);
  else writeFileSync(file, out);
}
if (check && stale) {
  console.error(`${stale} free ochem lesson(s) need: node scripts/build-ochem-lesson-text.mjs`);
  process.exit(1);
}
console.log(`${check ? 'checked' : 'wrote'} ${done} free ochem lessons${!check && stale ? ` (${stale} changed)` : ''}`);
