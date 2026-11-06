#!/usr/bin/env node
/* Course redesign round 4, part D (docs/course-redesign-r4.md decision 5): the Practice panel's generated
   parts on the two hand-written practice pages, nremt/practice.html and ochem/practice.html, between
   their markers:
     <!-- practice-band:start --> ... <!-- practice-band:end -->      the short band
     <!-- practice-tiles:start --> ... <!-- practice-tiles:end -->    step 1, a tile per mode
     <!-- practice-config:start --> ... <!-- practice-config:end -->  the panel's config
   The built courses get the same parts from their builders (scripts/lib/practice-panel.mjs practicePage).
   node scripts/build-practice-panel.mjs [--check] */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bandHtml, tilesHtml, configHtml, panelConfig } from './lib/practice-panel.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const PAGES = [
  { file: 'nremt/practice.html', key: 'nremt', crumbs: [{ name: 'LevlPrep', href: '../index.html' }, { name: 'NREMT-EMT', href: 'index.html' }, { name: 'Practice' }] },
  { file: 'ochem/practice.html', key: 'ochem', crumbs: [{ name: 'LevlPrep', href: '../index.html' }, { name: 'Organic Chemistry', href: 'index.html' }, { name: 'Practice' }] },
];

function between(html, name, body, file) {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(html)) throw new Error(`build-practice-panel: ${file} has no ${name} markers`);
  return html.replace(re, () => `<!-- ${name}:start -->\n${body}\n<!-- ${name}:end -->`);
}

let stale = 0;
for (const p of PAGES) {
  const path = join(ROOT, p.file);
  const old = readFileSync(path, 'utf8');
  let html = between(old, 'practice-band', bandHtml(p.key, { crumbs: p.crumbs }), p.file);
  html = between(html, 'practice-tiles', `<div class="pp-tiles">${tilesHtml(panelConfig(p.key).modes)}</div>`, p.file);
  html = between(html, 'practice-config', configHtml(p.key), p.file);
  if (html !== old) {
    stale++;
    if (CHECK) console.error(`build-practice-panel: ${p.file} is out of date`);
    else writeFileSync(path, html);
  }
}
if (CHECK && stale) { console.error('Run: node scripts/build-practice-panel.mjs'); process.exit(1); }
console.log(CHECK ? 'Practice panels are up to date.' : `build-practice-panel: ${stale} page(s) written.`);
