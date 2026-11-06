/* Course redesign round 4, Practice v2 (docs/course-redesign-r4.md decision 5, owner approved 2026-11-06;
   mockup docs/redesign-r4/mockups/PracticeAll.dc.txt): every course's practice.html is one card,
   "Build your session", with every setting on its own row, always visible. A setting that does not apply to
   the chosen format stays in place, greyed, with the reason under its label.

     <main id="main" class="r3 r3-inner r3-practice" data-cover="KEY">
       <section class="band short">   issue line, "Practice", the question count, the free limit box
       <div class="xshell lap pp-wrap">
         <div class="pp-grid" id="pp">
           <section class="pp-card">  quick picks, then the rows (#ppRows, drawn by practice-panel.js)
           <aside class="pp-side">    the navy "Your session" summary with the one Start, the sharing card
         <div class="pp-engine">      the practice engine's mount; shown only while a session runs
       <script type="application/json" id="ppConfig">

   assets/course/practice-panel.js reads the config, draws the rows and starts the engine for the chosen
   format with the settings in the URL (go=1). Styles: assets/course/practice-panel.css. Built pages go
   through practicePage(); nremt/practice.html and ochem/practice.html carry the band, the panel and the
   config between markers written by scripts/build-practice-panel.mjs. */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSES } from './r3-inner.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
/* Review areas: the drill picker's exam domains and topic areas (DOMAIN_TARGETS and SYSTEMS in
   nremt/practice-engine.js), read from the engine so the two cannot drift. */
function nremtReviewAreas() {
  const src = readFileSync(join(ROOT, 'nremt', 'practice-engine.js'), 'utf8');
  const dm = src.match(/const DOMAIN_TARGETS = \{([\s\S]*?)\};/), sm = src.match(/const SYSTEMS = (\[[^\]]*\]);/);
  if (!dm || !sm) throw new Error('practice-panel: DOMAIN_TARGETS or SYSTEMS not found in nremt/practice-engine.js');
  const doms = [...dm[1].matchAll(/"([^"]+)"\s*:/g)].map(m => m[1]);
  return { domains: doms, systems: JSON.parse(sm[1]) };
}
function nremtDomains() {
  return JSON.parse(readFileSync(join(ROOT, 'nremt', 'assets', 'flashcards.json'), 'utf8')).domains.map(d => [d.key, d.label]);
}

/* Format chips. Only the formats a course has are offered. */
const F = {
  q: 'Questions, feedback after each', exam: 'Timed exam', cards: 'Flashcards',
  frq: 'Written answers (free response)', jus: 'Justify prompts', cat: 'Adaptive exam', scen: 'Scenarios',
};
const fmt = ids => ids.map(id => [id, F[id]]);

const AP_KINDS = [['t', 'Term to definition'], ['d', 'Definition to term'], ['s', 'Topic summaries']];
const AP_EXAMS = [['full', 'Full practice exam'], ['unit', 'Unit test'], ['mixed', 'Mixed timed set']];

/* pace: seconds a multiple-choice question gets at the exam's pace (each exams engine's MCQ_SEC). The full
   exam line is information for the summary (from each course's exams engine header). */
const AP = {
  apbio: { dir: 'bio', glob: 'ApBio', note: 'Units 1 and 2 are unlimited.', practice: 'Science practice', pace: 90,
    exam: '60 multiple choice in 90 minutes, then 6 free response in 90 minutes' },
  apchem: { dir: 'chem', glob: 'ApChem', note: 'Units 1 and 2 are unlimited.', practice: 'Science practice', pace: 90,
    exam: '60 multiple choice in 90 minutes, then 7 free response in 105 minutes' },
  apphys: { dir: 'physics', glob: 'ApPhys', note: 'Units 1 and 2 are unlimited.', practice: 'Science practice', pace: 121,
    exam: '42 multiple choice in 85 minutes, then 4 free response in 95 minutes' },
  apcalc: { dir: 'calculus', glob: 'ApCalc', note: 'Units 1 and 2 are unlimited.', practice: 'Mathematical practice', pace: 143,
    exam: '42 multiple choice in 100 minutes, then 6 free response in 90 minutes' },
  apcalcbc: { dir: 'calculus-bc', glob: 'ApCalc', note: 'Units 1 and 2 are unlimited.', practice: 'Mathematical practice', pace: 143,
    kit: '../calculus/assets/pages/frq-kit.js',
    exam: '42 multiple choice in 100 minutes, then 6 free response in 90 minutes' },
  apstat: { dir: 'statistics', glob: 'ApStat', note: 'Unit 1 is unlimited.', practice: 'Skill', pace: 129,
    exam: '42 multiple choice in 90 minutes, then 4 free response in 90 minutes' },
  apenv: { dir: 'environmental-science', glob: 'ApEnv', note: 'Unit 1 is unlimited.', practice: 'Science practice', pace: 68,
    kinds: [...AP_KINDS, ['f', 'Formulas']],
    exam: '80 multiple choice in 90 minutes, then 3 free response in 70 minutes' },
  appsych: { dir: 'psychology', glob: 'ApPsych', note: 'Unit 1 is unlimited.', practice: 'Science practice', pace: 72,
    kinds: [...AP_KINDS, ['f', 'Statistics']],
    exam: '75 multiple choice in 90 minutes, then the AAQ and EBQ in 70 minutes' },
  apprecalc: { dir: 'precalculus', glob: 'ApPrecalc', note: 'Unit 1 and the algebra chapter are unlimited.', practice: 'Mathematical practice', pace: 150,
    exam: '42 multiple choice in 105 minutes, then 4 free response in 60 minutes' },
  apmacro: { dir: 'macroeconomics', glob: 'ApMacro', note: 'Unit 1 is unlimited.', practice: 'Skill', pace: 70,
    kinds: [...AP_KINDS, ['f', 'Formulas']],
    exam: '60 multiple choice in 70 minutes, then 3 free response in 60 minutes' },
};

/* The config practice-panel.js reads. */
export function panelConfig(key) {
  if (AP[key]) {
    const a = AP[key];
    return {
      course: key, family: 'ap', glob: a.glob, note: a.note, dir: a.dir,
      formats: fmt(['q', 'exam', 'cards', 'frq', 'jus']), unitWord: 'Units', practice: a.practice, pace: a.pace,
      from: ['new', 'due', 'missed', 'weak'], counts: [5, 10, 20, 40, 0], examKinds: AP_EXAMS, exam: a.exam, cram: true,
      store: { prefs: `${key}_prefs_v1`, cards: `${key}_flashcards_v1` },
      kinds: a.kinds || AP_KINDS, kit: a.kit || 'assets/pages/frq-kit.js', kitGlob: `${a.glob}Frq`,
      engine: '#app', end: '.cx-end', print: true,
    };
  }
  if (key === 'anp') return {
    course: 'anp', family: 'anp', glob: 'Anp', note: 'Foundations questions are unlimited.', dir: 'anatomy-physiology',
    formats: fmt(['q', 'exam', 'cards']), unitWord: 'Chapters', practice: 'Core concept', pace: 90,
    from: ['new', 'due', 'missed', 'weak', 'studied'], counts: [5, 10, 20, 40, 0],
    examKinds: [['unit', 'Unit quiz'], ['system', 'System exam'], ['finalI', 'Final, A&P I'], ['finalII', 'Final, A&P II'], ['custom', 'Custom exam'], ['teas', 'TEAS A&P practice']],
    store: { prefs: 'anp_prefs_v1', cards: 'anp_flashcards_v1' },
    kinds: [['t', 'Term to definition'], ['d', 'Definition to term'], ['f', 'Comparisons and key facts']],
    engine: '#app', end: '.cx-end',
  };
  if (key === 'ochem') return {
    course: 'ochem', family: 'ochem', note: 'The first four chapters are unlimited.', dir: 'ochem',
    formats: fmt(['q', 'exam', 'cards']), unitWord: 'Chapters', practice: null, pace: 90,
    from: ['new', 'due', 'missed', 'weak', 'studied'], counts: [5, 10, 20, 40, 0],
    examKinds: [['chapter', 'Chapter test'], ['midterm', 'Midterm'], ['final', 'Cumulative final']],
    store: { cards: 'ochem_flashcards_v1' }, engine: '#practiceHome', end: '#sessionQuit', total: '#practiceProgLabel',
  };
  /* The flashcard domains are the deck's own (nremt/assets/flashcards.json "domains"). */
  if (key === 'nremt') return {
    course: 'nremt', family: 'nremt', note: 'The study notes stay open.', dir: 'nremt',
    formats: fmt(['q', 'exam', 'cat', 'scen', 'cards']), unitWord: 'Domains', practice: null, pace: 72,
    from: ['new', 'due', 'missed', 'weak'], counts: [10, 20, 30, 50],
    examKinds: [['std', '100 questions, 2 hours'], ['real', 'Exam-realistic: no flagging, no going back']],
    store: { cards: 'nremt_flashcards_v1' }, engine: '#nrBuilder', total: '#progressText',
    domains: nremtDomains(), reviewAreas: nremtReviewAreas(),
  };
  throw new Error(`practice-panel: no config for ${key}`);
}

const ico = d => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

/* The short band: issue line with the course, "Practice", one sub line (the question count, filled in by
   the panel when it knows it) and the free daily limit box (filled in only for a visitor with a limit). */
export function bandHtml(key, { up = '../', crumbs = [], sub = 'Every answer explained' } = {}) {
  const label = COURSES[key].label;
  const crumb = crumbs.length ? `<nav class="r3-crumb" aria-label="Breadcrumb">${crumbs.map((c, i) => i === crumbs.length - 1
    ? `<span aria-current="page">${c.name}</span>` : `<a href="${c.href}">${c.name}</a> <span aria-hidden="true">&rsaquo;</span> `).join('')}</nav>\n` : '';
  return `<section class="band short" aria-labelledby="r3Title"><div class="hwrap"><div>
${crumb}<p class="issue">${label} <i></i></p>
<h1 class="deck" id="r3Title">Practice</h1>
<p class="lede pp-sub" id="ppSub">${sub}</p>
<div class="pp-free" id="ppFree" hidden></div>
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async"></div></div></section>`;
}

export function configHtml(key) {
  return `<script type="application/json" id="ppConfig">${JSON.stringify(panelConfig(key))}</script>`;
}

/* Without JavaScript nothing here can run, so the card names the pages that open each format. */
function noscriptHtml(key) {
  const c = panelConfig(key), links = [['review.html', 'Review'], ['flashcards.html', 'Flashcards'], ['exams.html', 'Exams']];
  if (c.formats.some(f => f[0] === 'frq')) links.push(['frq.html', 'Free response']);
  if (c.formats.some(f => f[0] === 'jus')) links.push(['justify.html', 'Justify']);
  if (c.formats.some(f => f[0] === 'scen')) links.push(['scenario-sim.html', 'Scenarios']);
  return `<noscript><p class="pp-noscript">Building a session needs JavaScript. Each format also has its own page: ${links.map(l => `<a href="${l[0]}">${l[1]}</a>`).join(', ')}.</p></noscript>`;
}

/* The card and the right column. The rows are drawn by practice-panel.js from the config. */
export function panelHtml(key) {
  const c = panelConfig(key);
  return `<div class="pp-grid" id="pp">
<section class="pp-card" aria-labelledby="ppH">
<div class="pp-head"><h2 class="pp-h2" id="ppH">Build your <em>session</em></h2><p class="pp-hint">Every setting is here. Change any of them.</p></div>
<div class="pp-quick" role="group" aria-label="Quick picks"><span class="pp-quick-l">Quick picks:</span><button type="button" class="pp-chip" data-quick="q10">Quick 10</button><button type="button" class="pp-chip" data-quick="due">Review what&rsquo;s due</button><button type="button" class="pp-chip" data-quick="exam">Full practice exam</button><button type="button" class="pp-chip" data-quick="cards">20 flashcards</button></div>
<div class="pp-rows" id="ppRows"><p class="pp-loading">Loading the settings&hellip;</p></div>
${noscriptHtml(key)}
</section>
<aside class="pp-side" aria-label="Your session">
<div class="pp-sum"><p class="pp-sum-k">Your session</p><p class="pp-sum-t" id="ppSumT" aria-live="polite"></p><p class="pp-sum-b" id="ppSumB"></p><a class="pp-go" id="ppGo" href="practice.html">Start practice</a></div>
<div class="pp-share" id="ppShare"><p class="pp-share-h">Teaching or sharing?</p>
<a class="pp-chip pp-sbtn" id="ppClass" href="https://classroom.google.com/" target="_blank" rel="noopener">${ico('<path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 14v6h14v-6"/>')} Share to Google Classroom<span class="sr-only"> (opens in a new tab)</span></a>
<button type="button" class="pp-chip pp-sbtn" id="ppCopy">${ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>')} Copy a link to this session</button>
<button type="button" class="pp-chip pp-sbtn" id="ppPrint"${c.print ? '' : ' disabled title="Worksheets are not available for this course yet"'}>${ico('<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>')} Print as a worksheet</button>
<label class="pp-key"><input type="checkbox" id="ppKey"${c.print ? '' : ' disabled'}> Answer key on a separate page</label>
<p class="pp-share-n" id="ppShareN" aria-live="polite"></p></div>
</aside>
</div>`;
}

/* A built course practice page (the AP® courses and A&P) becomes the panel. */
export function practicePage(html, key, up = '../') {
  const m = html.match(/<main id="main" class="([^"]*)">([\s\S]*?)<\/main>/);
  if (!m) throw new Error(`practice-panel: ${key}: no <main id="main">`);
  const inner = m[2];
  const crumbs = [];
  const crumbM = inner.match(/<nav class="[^"]*crumb[^"]*"[^>]*aria-label="Breadcrumb">([\s\S]*?)<\/nav>/);
  if (crumbM) {
    for (const a of crumbM[1].matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>/g)) crumbs.push({ href: a[1], name: a[2] });
    const cur = crumbM[1].match(/<span aria-current="page">([\s\S]*?)<\/span>/);
    if (cur) crumbs.push({ name: cur[1] });
  }
  const app = inner.match(/<div id="app"[^>]*>[\s\S]*?<\/div>/);
  if (!app) throw new Error(`practice-panel: ${key}: no #app mount`);
  const main = `<main id="main" class="r3 r3-inner r3-practice" data-cover="${key}">
${bandHtml(key, { up, crumbs })}
<div class="xshell lap pp-wrap">
${panelHtml(key)}
<div class="pp-engine">${app[0]}</div>
</div>
${configHtml(key)}
</main>`;
  let out = html.replace(m[0], main);
  const css = `<link rel="stylesheet" href="${up}assets/course/r3-inner.css">\n<link rel="stylesheet" href="${up}assets/course/practice-panel.css">\n`;
  if (!out.includes('assets/course/practice-panel.css')) out = out.replace('</head>', `${css}</head>`);
  const js = `<script src="${up}assets/exam-date.js" defer></script>\n<script src="${up}assets/course/practice-panel.js" defer></script>\n`;
  if (!out.includes('assets/course/practice-panel.js')) out = out.replace('</body>', `${js}</body>`);
  return out;
}
