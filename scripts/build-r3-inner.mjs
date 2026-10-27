#!/usr/bin/env node
/* Site redesign round 3, step B3 (docs/site-redesign.md): the short cover band and the generated parts of
   the hand-written inner pages, between their markers:
     <!-- r3-band:start --> ... <!-- r3-band:end -->                 the band (scripts/lib/r3-inner.mjs)
     <!-- r3-exams-built:start --> ... <!-- r3-exams-built:end -->   nremt/exams.html, "How the exam is built"
   The pages: nremt/exams.html, nremt/dashboard.html, nremt/exam-day.html, ochem/exams.html,
   ochem/dashboard.html. The built courses get the same band from their builders (dashboard-page.mjs).
   node scripts/build-r3-inner.mjs [--check] */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shortBand, bandWords, START_SCRIPT } from './lib/r3-inner.mjs';
import { homeData } from './lib/r3-home.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const NR = [{ name: 'LevlPrep', href: '../index.html' }, { name: 'NREMT-EMT Prep', href: 'index.html' }];
const OC = [{ name: 'LevlPrep', href: '../index.html' }, { name: 'Organic Chemistry', href: 'index.html' }];

const PAGES = [
  { file: 'nremt/exams.html', key: 'nremt', slug: 'exams', crumbs: [...NR, { name: 'Exams' }],
    lede: 'A full 100-question exam in the proportions of the National Registry&rsquo;s five EMT exam domains (April 2025 outline), on a two-hour clock and scored by domain. Leave mid-way and it waits here for you.' },
  { file: 'nremt/dashboard.html', key: 'nremt', slug: 'dashboard', crumbs: [...NR, { name: 'Dashboard' }], ledeId: 'headSub',
    lede: 'Everything this browser knows about how you&rsquo;re doing, in six topic areas and the five exam domains.' },
  { file: 'nremt/exam-day.html', key: 'nremt', slug: 'exam-day', crumbs: [...NR, { name: 'About the NREMT-EMT exam' }],
    lede: 'The format, the clock, the cost, who can sit it, what happens if you fail, and what to bring. The practice here trains the content; this page covers everything around it.' },
  { file: 'ochem/exams.html', key: 'ochem', slug: 'exams', crumbs: [...OC, { name: 'Exams' }], id: 'examHero',
    lede: 'Timed tests on one chapter, a range of chapters or the whole course, with a full review at the end.' },
  { file: 'ochem/dashboard.html', key: 'ochem', slug: 'dashboard', crumbs: [...OC, { name: 'Dashboard' }], ledeId: 'headSub',
    lede: 'Mastery, not a readiness score: built from every question you have answered, not from lessons opened.' },
];

function examsBuilt() {
  const doms = homeData('nremt').doms;
  return `<section class="r3-built" aria-labelledby="r3BuiltH">
<p class="kicker">How the exam is built <i></i></p>
<div class="r3-built-grid">
<div class="contents"><h2 class="r3-h2" id="r3BuiltH">Drawn like <span>the real one</span></h2><p class="sub">The National Registry&rsquo;s five EMT exam domains, April 2025 outline, in the same proportions.</p>
<ol class="toc">${doms.map(([name, , w, , bar], i) => `<li><div class="toc-row"><span class="n">0${i + 1}</span><span><b>${name}</b><small>its share of the 100</small></span><span class="w">${w}<small>of the exam</small><span class="wbar"><i style="width:${bar}%"></i></span></span></div></li>`).join('')}</ol></div>
<ol class="r3-steps">
<li class="step"><span class="n">1</span><h3>Answer all 100</h3><p>No feedback while the clock runs. Leave mid-way and it waits here for you.</p></li>
<li class="step"><span class="n">2</span><h3>Submit and see every answer</h3><p>Each question is reviewed with its explanation, and the score is broken down by domain.</p></li>
<li class="step"><span class="n">3</span><h3>Fix what you missed</h3><p>Misses go to your <a href="review.html">review queue</a> and come back before you forget them.</p></li>
</ol>
</div>
</section>`;
}

/* exam day: an "On this page" list of the Details headings and the common questions */
function toc(html) {
  const items = [...html.matchAll(/<h2 id="(ed-[a-z0-9-]+)">([\s\S]*?)<\/h2>/g)].map(m => [m[1], m[2].replace(/<[^>]+>/g, '')]);
  items.push(['ed-common-questions', 'Common questions']);
  return `<nav class="r3-toc" aria-label="On this page"><p class="kicker">On this page</p><ol>${items.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ol></nav>`;
}

function between(html, name, body, file) {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(html)) throw new Error(`build-r3-inner: ${file} has no ${name} markers`);
  return html.replace(re, `$1\n${body}\n$2`);
}

let stale = 0;
for (const p of PAGES) {
  const path = join(ROOT, p.file);
  const old = readFileSync(path, 'utf8');
  const w = bandWords(p.key, p.slug);
  let html = between(old, 'r3-band', shortBand({ key: p.key, crumbs: p.crumbs, ...w, lede: p.lede, ledeId: p.ledeId, id: p.id }), p.file);
  if (p.file === 'nremt/exams.html') html = between(html, 'r3-exams-built', examsBuilt(), p.file);
  if (p.file === 'nremt/exam-day.html') html = between(html, 'r3-toc', toc(html), p.file);
  if (w.cta && w.cta.start && !html.includes(START_SCRIPT)) throw new Error(`build-r3-inner: ${p.file} needs the band's start script before </body>`);
  if (html !== old) {
    stale++;
    if (CHECK) console.error(`build-r3-inner: ${p.file} is out of date`);
    else writeFileSync(path, html);
  }
}
if (CHECK && stale) { console.error('Run: node scripts/build-r3-inner.mjs'); process.exit(1); }
console.log(CHECK ? 'r3 inner pages are up to date.' : `build-r3-inner: ${stale} page(s) written.`);
