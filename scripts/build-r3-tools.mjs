#!/usr/bin/env node
/* Round 3, step B5 (docs/site-redesign.md; boards docs/redesign-r3/r10/boards/R10-Tools, R10-Tool): the NREMT tools
   hub and the cover band on every NREMT tool page. Both pages are written by hand, so this writes only what is
   between its markers:
     nremt/tools.html     <!-- r3-tools:start --> ... <!-- r3-tools:end -->      the hub's <main>
     nremt/<tool>.html    <!-- r3-toolband:start --> ... <!-- r3-toolband:end -->  after <!-- crumb:end -->
   The band's hand line is the page's own lede and its lede the page's meta description, so the words stay the
   page's. The other courses' hubs and bands come from their builders (build-ap*.mjs, build-anp.mjs,
   build-tool-pages.mjs), all through scripts/lib/r3-tools.mjs.

     node scripts/build-r3-tools.mjs           write
     node scripts/build-r3-tools.mjs --check   fail if stale (CI) */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toolsHubMain, toolBand, toolCovers } from './lib/r3-tools.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const stale = [], broken = [];

function put(rel, start, end, body, anchor) {
  const file = join(ROOT, rel);
  const cur = readFileSync(file, 'utf8');
  const a = cur.indexOf(start), b = cur.indexOf(end);
  let next;
  if (a !== -1 && b > a) next = cur.slice(0, a) + body + cur.slice(b + end.length);
  else {
    const at = anchor ? cur.indexOf(anchor) : -1;
    if (at === -1) { broken.push(`${rel}: no ${start} and no ${anchor}`); return; }
    next = cur.slice(0, at + anchor.length) + '\n' + body + cur.slice(at + anchor.length);
  }
  if (next === cur) return;
  if (check) stale.push(rel); else writeFileSync(file, next);
}

/* ---- the tool pages ---- */
const BAND = ['<!-- r3-toolband:start -->', '<!-- r3-toolband:end -->'];
// The full-screen tools (Tool Studio mount); mnemonics and reference cards are slim reference pages that scroll and
// keep the band.
const FULL = new Set(['body-map', 'flowcharts', 'formulary', 'scenario-sim', 'skillsheets', 'sound-trainer']);
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
for (const t of toolCovers('nremt')) {
  const rel = `nremt/${t.slug}.html`;
  let html = readFileSync(join(ROOT, rel), 'utf8');
  const a = html.indexOf(BAND[0]), b = html.indexOf(BAND[1]);
  if (a !== -1 && b > a) html = html.slice(0, a) + html.slice(b + BAND[1].length);
  const lede = /<p class="lede">([\s\S]*?)<\/p>/.exec(html);
  const desc = /<meta name="description" content="([^"]*)"/.exec(html);
  if (!lede) { broken.push(`${rel}: no <p class="lede"> to take the hand line from`); continue; }
  put(rel, BAND[0], BAND[1], toolBand({
    ref: !FULL.has(t.slug), key: 'nremt', up: '../', slug: t.slug, hand: lede[1].trim(), lede: desc ? desc[1] : '', backHref: 'tools.html',
    crumbs: [{ name: 'LevlPrep', href: '../index.html' }, { name: 'NREMT-EMT Prep', href: 'index.html' }, { name: 'Tools', href: 'tools.html' }, { name: strip(t.title) }],
  }), '<!-- crumb:end -->');
}

/* ---- the hub (board R10-Tools) ---- */
const CREDIT = 'Figure from BodyParts3D &copy; 2008 <a href="https://lifesciencedb.jp/bp3d/" rel="noopener">Life Science Integrated Database Center</a>, <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" rel="noopener">CC BY-SA 2.1 JP</a>.';
const card = (slug, name, desc, foot, premium) => ({ slug, href: `${slug}.html`, name, desc, foot, free: !premium, attrs: premium ? ' data-premium="1"' : '' });
const hub = toolsHubMain({
  key: 'nremt', up: '../', mountClass: 'cx-tools',
  crumbs: [{ name: 'LevlPrep', href: '../index.html' }, { name: 'NREMT-EMT Prep', href: 'index.html' }, { name: 'Tools' }],
  h1: 'What a question bank <span>can&rsquo;t test.</span>', hand: 'anatomy, sounds, calls and the skill stations',
  lede: 'Practice the parts a question bank can&rsquo;t test: anatomy, sounds, protocol flow, call simulations and the skill sheets.',
  cta: { href: 'body-map.html', label: 'Open the body map' }, cta2: { href: 'search.html', label: 'Search everything' },
  featured: { slug: 'body-map', href: 'body-map.html', name: 'Body Map', kick: 'Featured tool &middot; Anatomy', hand: 'A real 3D model. Click any part.',
    desc: 'Turn the body, tap a region and get the structures, the landmarks and the assessment findings that go with it.', cta: 'Open the body map', credit: CREDIT },
  groups: [
    { big: true, h: 'Six more <span>tools</span>', p: 'Sounds, calls, drugs and the skill stations.', label: 'More tools', cards: [
      card('sound-trainer', 'Sound Trainer', 'Wheezes, crackles, stridor and heart sounds, by ear.', 'Lung and heart sounds'),
      card('scenario-sim', 'Scenarios', 'Twenty-five branching calls, dispatch to handover.', '25 calls', true),
      card('formulary', 'Drug Formulary', 'The seven core EMT drugs: doses, contraindications, and what stops you.', '7 drugs'),
      card('reference-cards', 'Reference Cards', 'Pediatric vitals by age, GCS, APGAR, the assessment triangle.', 'Quick reference'),
      card('flowcharts', 'Flow Diagrams', 'Ten sequences: assessment, CPR, anaphylaxis, choking, triage.', '10 sequences'),
      card('skillsheets', 'Skill Sheets', 'The psychomotor stations and what fails them.', 'Psychomotor stations'),
    ] },
    { kick: 'Also in Learn', h: 'Also in Learn', label: 'Also in Learn', cards: [
      card('mnemonics', 'Mnemonics', 'The core EMT mnemonics, letter by letter.', 'Letter by letter'),
    ] },
  ],
  note: 'Flow diagrams and the station list are general structure, not scored sheets. Verify against your program&rsquo;s documents. Or <a href="search.html">search everything at once</a>.',
});
put('nremt/tools.html', '<!-- r3-tools:start -->', '<!-- r3-tools:end -->', `<!-- r3-tools:start -->\n${hub}\n<!-- r3-tools:end -->`, null);

if (broken.length) { console.error('FAIL:\n  ' + broken.join('\n  ')); process.exit(1); }
if (check) {
  if (stale.length) { console.error(`FAIL: stale round 3 tool blocks: ${stale.join(', ')}\nRun: node scripts/build-r3-tools.mjs`); process.exit(1); }
  console.log('OK: the NREMT tools hub and tool bands are up to date.');
} else console.log('Wrote the NREMT tools hub and tool bands.');
