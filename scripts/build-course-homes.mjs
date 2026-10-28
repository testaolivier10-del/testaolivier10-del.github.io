#!/usr/bin/env node
/* Writes the round 3 course home (docs/site-redesign.md, boards R10-Home-NREMT and R10-Home-Ochem) into the
   two hand-written course homes, nremt/index.html and ochem/index.html, from scripts/lib/r3-home.mjs (the
   layout the seven built course homes share). It lands between <!-- course-home:main:start --> and
   <!-- course-home:main:end -->; the page head, the footer and the page scripts stay as written.

   Counts come from the data: NREMT questions per domain and the total from nremt/assets/questions.json,
   the ochem chapter path from ochem/assets/curriculum.js, the ochem sample question from
   ochem/assets/practice-bank.json, prices from assets/premium.js.

   node scripts/build-course-homes.mjs           rewrite the block
   node scripts/build-course-homes.mjs --check   exit 1 if either page is stale */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';
import { r3HomeMain, homeData } from './lib/r3-home.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const fmt = (n) => n.toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------------------------------------------------------------- NREMT */
const NREMT_TOOLS = [
  ['Body Map', 'body-map'], ['Scenarios', 'scenario-sim'], ['Skill Sheets', 'skillsheets'], ['Sound Trainer', 'sound-trainer'],
  ['Flow Diagrams', 'flowcharts'], ['Drug Formulary', 'formulary'], ['Mnemonics', 'mnemonics'], ['Reference Cards', 'reference-cards'],
];
function nremt() {
  const bank = JSON.parse(read('nremt/assets/questions.json'));
  const qs = Array.isArray(bank) ? bank : bank.questions;
  const per = {};
  for (const q of qs) per[q.domain] = (per[q.domain] || 0) + 1;
  const d = homeData('nremt');
  const doms = d.doms.map(([n, desc, w, , bar]) => {
    const name = n.replace(/&amp;/g, '&');
    if (!per[name]) throw new Error(`nremt: no questions tagged "${name}"`);
    return [n, desc, w, fmt(per[name]), bar];
  });
  const chapters = JSON.parse(read('nremt/assets/study-notes.json')).chapters;
  const slug = (t) => t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const chip = (t) => { const c = chapters.find((x) => x.title.replace(/&/g, '&amp;') === t || x.title === t); return c ? `notes/${slug(c.title)}.html` : 'study-notes.html'; };
  const lede = d.lede.replace(/^[\d,]+ questions, forty chapters/, `${fmt(qs.length)} questions, ${chapters.length === 40 ? 'forty' : chapters.length} chapters`);
  const main = r3HomeMain('nremt', {
    up: '../',
    hooks: { kind: 'nremt' },
    primaryHref: 'practice.html',
    primaryScript: `<script>try{if(localStorage.getItem('nremt_inprogress_exam')||(localStorage.getItem('nremt_mastery')||'{}').length>2)heroPrimaryCta.classList.add('cta-pending')}catch(e){}</script>`,
    doms, lede,
    tools: NREMT_TOOLS.map(([name, s]) => ({ slug: s, name, href: `${s}.html` })),
    links: {
      btn2: '#try', btn3: 'exam-day.html',
      toc: doms.map(([n]) => `practice.html?domain=${encodeURIComponent(n.replace(/&amp;/g, '&'))}`),
      notes: 'study-notes.html', chips: d.notes.chips.map(([t]) => chip(t)),
      steps: ['practice.html', 'study-notes.html', 'exams.html'], exam: 'exams.html',
      tryMore: 'practice.html', extras: ['body-map.html'], guide: 'exam-day.html', freeCta: 'practice.html',
    },
  });
  return { file: 'nremt/index.html', main };
}

/* ---------------------------------------------------------------- ochem */
const OCHEM_TOOLS = [
  ['Arrow Pusher', 'arrow-pusher'], ['Resonance Explorer', 'resonance'], ['3D Molecule Viewer', 'viewer-3d'], ['Conformation Lab', 'conformations'],
  ['Reaction Predictor', 'reaction-predictor'], ['Acid/Base Comparator', 'acid-base'], ['Spectroscopy Lab', 'spectroscopy'], ['Reagent Roadmap', 'reagent-roadmap'],
  ['Synthesis Trainer', 'synthesis'],
];
const MECH = { SN2: 'sn2', SN1: 'sn1', E2: 'e2', E1: 'e1', 'Alkene addition': 'addition', 'Carbonyl addition': 'carbonyl-addition', 'Acyl substitution': 'acyl-substitution', Aldol: 'aldol', Claisen: 'claisen', EAS: 'eas' };
function ochem() {
  const sandbox = { window: {}, document: {}, localStorage: { getItem: () => null, setItem: () => {} } };
  vm.createContext(sandbox);
  vm.runInContext(read('ochem/assets/curriculum.js'), sandbox);
  const MODULES = sandbox.window.OchemCurriculum.MODULES;
  const d = homeData('ochem');
  // The board's path is chapter, title, topic count; take all three from the curriculum.
  d.path = MODULES.map((m, i) => [i + 1, esc(m.title), m.topics.length]);
  const groups = [];
  for (let g = 0; g < MODULES.length; g += 5) groups.push(MODULES[g]);
  // The sample: one real question from the practice bank (a free chapter, Curved arrows), found by its stem.
  const SAMPLE = { topic: 'curved-arrows', stem: 'A proposed step has one curved arrow: from a lone pair on hydroxide' };
  const bank = JSON.parse(read('ochem/assets/practice-bank.json'));
  const q = (bank[SAMPLE.topic] || []).find((x) => x.type === 'mcq' && x.q.startsWith(SAMPLE.stem));
  if (!q) { console.error(`ochem: the sample question ("${SAMPLE.stem}...") is no longer in the ${SAMPLE.topic} bank. Pick another in scripts/build-course-homes.mjs.`); process.exit(1); }
  const topic = MODULES.flatMap((m) => m.topics).find((t) => t.id === SAMPLE.topic);
  const main = r3HomeMain('ochem', {
    up: '../',
    hooks: { kind: 'ochem' },
    primaryHref: 'learn.html',
    primaryScript: `<script>try{if((localStorage.getItem('ochem_progress')||'{}').length>2)heroPrimaryCta.classList.add('cta-pending')}catch(e){}</script>`,
    tools: OCHEM_TOOLS.map(([name, s]) => ({ slug: s, name, href: `tools/${s}.html` })),
    sample: { q: esc(q.q), opts: q.options.map(esc), ok: q.correct, why: esc(q.why || ''), more: `Open the free lesson on ${esc(topic.title.toLowerCase())}` },
    links: {
      btn2: 'tools/arrow-pusher.html?start=sn2-bromoethane', btn3: 'how-to-study.html',
      toc: groups.map((m) => `learn.html#m-${m.id}`),
      notes: 'learn.html', chips: ['flashcards.html', 'glossary.html'],
      steps: ['lessons/atomic-structure.html', 'tools/arrow-pusher.html?start=sn2-bromoethane', 'practice.html'], exam: 'exams.html',
      tryMore: topic.href, extras: ['tools/arrow-pusher.html?start=sn2-bromoethane', ''],
      extraItems: d.extras[0].items.map((x) => (MECH[x] ? `mechanisms/${MECH[x]}.html` : '')),
      guide: 'how-to-study.html', freeCta: 'lessons/atomic-structure.html',
    },
  });
  return { file: 'ochem/index.html', main };
}

let stale = 0;
for (const page of [nremt(), ochem()]) {
  const before = read(page.file);
  const a = '<!-- course-home:main:start -->', b = '<!-- course-home:main:end -->';
  const i = before.indexOf(a), j = before.indexOf(b);
  if (i === -1 || j < i) { console.error(`${page.file}: expected ${a} … ${b}.`); process.exit(1); }
  const html = before.slice(0, i + a.length) + '\n' + page.main + '\n' + before.slice(j);
  if (html === before) continue;
  if (CHECK) { console.error(`${page.file} is stale. Run: node scripts/build-course-homes.mjs`); stale++; continue; }
  writeFileSync(join(ROOT, page.file), html);
  console.log(`${page.file}: course home rewritten.`);
}
if (stale) process.exit(1);
if (CHECK) console.log('course homes are up to date.');
