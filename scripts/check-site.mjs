#!/usr/bin/env node
// Lightweight CI checks for a static, no-build-step site: no bundler to catch
// a typo'd path or a broken JSON file before it ships, so this does it instead.
//   1. Every local href/src (and every <script src>) points at a file that exists.
//   2. Every JSON file (questions.json, manifest.json, etc.) actually parses.
//   3. Every URL listed in sitemap.xml maps to a file that exists on disk.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
let failures = 0;

function fail(msg) {
  failures++;
  console.error('FAIL: ' + msg);
}

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules' || name === 'scripts') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.includes(extname(name))) out.push(full);
  }
  return out;
}

// ---- 1 & (implicitly) well-formedness: scan every HTML file's local references ----
const htmlFiles = walk(ROOT, ['.html']);
const REF_RE = /(?:href|src)="([^"]+)"/g;

for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf8');
  let m;
  while ((m = REF_RE.exec(content))) {
    let ref = m[1];
    // Not a literal path: built at runtime inside an inline <script>, either
    // in a template literal (`${...}`) or by concatenation ("' + x + '").
    // Several lesson pages build href="' + location.pathname + '" that way.
    if (ref.includes('${')) continue;
    if (/['"`]\s*\+|\+\s*['"`]/.test(ref)) continue;
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith('mailto:') || ref.startsWith('tel:') || ref.startsWith('data:') || ref.startsWith('#')) continue;
    ref = ref.split('#')[0].split('?')[0];
    if (!ref) continue;
    const base = ref.startsWith('/') ? ROOT : dirname(file);
    const target = join(base, ref);
    if (!existsSync(target)) {
      fail(`${relative(ROOT, file)}: broken reference "${ref}"`);
    }
  }
}

// ---- 2. JSON files parse ----
const jsonFiles = walk(ROOT, ['.json']);
for (const file of jsonFiles) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    fail(`${relative(ROOT, file)}: invalid JSON (${e.message})`);
  }
}

// ---- 3. sitemap.xml URLs resolve to real files ----
const sitemapPath = join(ROOT, 'sitemap.xml');
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const locRe = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = locRe.exec(sitemap))) {
    const url = new URL(m[1]);
    let p = url.pathname;
    if (p.endsWith('/')) p += 'index.html';
    const target = join(ROOT, p);
    if (!existsSync(target)) {
      fail(`sitemap.xml: "${m[1]}" has no matching file (${relative(ROOT, target)})`);
    }
  }
}

// ---- 4. the lesson-concept map still lines up with the lessons ----
// assets/lesson-concepts.js credits concepts by step INDEX. If a lesson gains
// or loses a step, every index below it shifts and the map would quietly
// credit the wrong concept. The engine already falls back to inference when
// the step count disagrees, so this never ships bad data — but a silent
// fallback also means nobody notices the map has rotted, hence the check.
/* Count the top-level entries of a lesson's `steps: [ ... ]` array.

   This used to be `body.match(/\{\s*(?:type|render)\s*:/g).length`, which
   silently assumed every step object opens with `type:` or `render:` as
   its very first property. That is not a rule the engine enforces, and it
   stopped holding the moment steps grew a `diagramHtml` ahead of `type:`
   or a comment ahead of `render:` — at which point the checker reported
   every one of those lessons as having one step fewer than it has, which
   reads like the concept map drifting when nothing of the sort happened.

   So scan for real: find the steps array, then walk it tracking nesting,
   strings and comments, and count the braces that open at depth 1. */
function countSteps(body) {
  const start = body.indexOf('steps: [');
  if (start < 0) return null;
  let i = body.indexOf('[', start);
  let depth = 0, count = 0;
  let quote = null, esc = false, line = false, block = false;

  for (; i < body.length; i++) {
    const c = body[i], next = body[i + 1];

    if (line) { if (c === '\n') line = false; continue; }
    if (block) { if (c === '*' && next === '/') { block = false; i++; } continue; }
    if (quote) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && next === '/') { line = true; i++; continue; }
    if (c === '/' && next === '*') { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }

    if (c === '[') { depth++; continue; }
    if (c === ']') { depth--; if (depth === 0) return count; continue; }
    if (c === '{') { if (depth === 1) count++; depth++; continue; }
    if (c === '}') { depth--; continue; }
  }
  return null; // unbalanced; caller reports it
}

{
  const lcPath = join(ROOT, 'ochem/assets/lesson-concepts.js');
  const lessonDir = join(ROOT, 'ochem/lessons');
  if (existsSync(lcPath) && existsSync(lessonDir)) {
    const src = readFileSync(lcPath, 'utf8');
    // Each entry looks like:  'topic-id': { n:8, steps:{ ... } }
    const entries = [...src.matchAll(/'([a-z0-9-]+)':\s*\{\s*n:\s*(\d+)/g)]
      .map(m => ({ topic: m[1], n: Number(m[2]) }));
    if (!entries.length) fail('ochem/assets/lesson-concepts.js: no lesson entries parsed');
    for (const { topic, n } of entries) {
      const lesson = join(lessonDir, topic + '.html');
      if (!existsSync(lesson)) { fail(`lesson-concepts.js: no lesson file for "${topic}"`); continue; }
      // Count the step objects the lesson hands the engine.
      const body = readFileSync(lesson, 'utf8');
      const steps = countSteps(body);
      if (steps === null) {
        fail(`lesson-concepts.js: could not find the steps array in ${topic}.html`);
        continue;
      }
      if (steps !== n) {
        fail(`lesson-concepts.js: "${topic}" authored against ${n} steps but the lesson now has ${steps} — re-check the step indices, then update n.`);
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log(`OK — scanned ${htmlFiles.length} HTML files and ${jsonFiles.length} JSON files, no broken local references.`);
}
