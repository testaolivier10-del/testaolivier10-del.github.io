/* Course redesign round 4, Practice v4 B (docs/course-redesign-r4.md decision 5, owner approved 2026-11-06;
   mockup docs/redesign-r4/mockups/PracticeV4B.dc.txt): every course's practice.html is one card in three
   columns. The modes the course has are a list on the left; every setting of the chosen mode is in one
   column in the middle, in two groups; Your session on the right sums up the choice with one Start, Reset
   and the share row, and stays in view while the settings scroll (on phones the three stack).

     <main id="main" class="r3 r3-inner r3-practice" data-cover="KEY">
       <section class="band short">   issue line, "Practice", the question count, the free limit box
       <div class="xshell lap pp-wrap">
         <div class="pp-v3" id="pp">
           <section class="pp-card">  .pp-rail (the modes), .pp-form (#ppSet, drawn by practice-panel.js), .pp-side
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

function countOf(dir, file, pick) {
  try { const d = JSON.parse(readFileSync(join(ROOT, dir, 'assets', file), 'utf8')); return pick(d).length; } catch (e) { return 0; }
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
  apmicro: { dir: 'microeconomics', glob: 'ApMicro', note: 'Unit 1 is unlimited.', practice: 'Skill', pace: 70,
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
      frqN: countOf(a.dir, 'frq/index.json', d => d), jusN: countOf(a.dir, 'justify.json', d => d.prompts || []),
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
    exam: 'Finals cover every chapter of A&P I or A&P II, weighted by topic; the TEAS practice follows the TEAS 7 A&P areas',
  };
  if (key === 'ochem') return {
    course: 'ochem', family: 'ochem', explained: 'every answer explained', note: 'The first four chapters are unlimited.', dir: 'ochem',
    formats: fmt(['q', 'exam', 'cards']), unitWord: 'Chapters', practice: null, pace: 90,
    from: ['new', 'due', 'missed', 'weak', 'studied'], counts: [5, 10, 20, 40, 0],
    examKinds: [['chapter', 'Chapter test'], ['midterm', 'Midterm'], ['final', 'Cumulative final']],
    store: { cards: 'ochem_flashcards_v1' }, engine: '#practiceHome', end: '#sessionQuit', total: '#practiceProgLabel',
    kinds: [['concept', 'Concepts'], ['table', 'Facts'], ['authored', 'Named reactions']],
    exam: '50 questions from every chapter, timed at 90 seconds a question',
  };
  /* The flashcard domains are the deck's own (nremt/assets/flashcards.json "domains"). */
  if (key === 'nremt') return {
    course: 'nremt', family: 'nremt', explained: 'every answer explained', note: 'The study notes stay open.', dir: 'nremt',
    formats: fmt(['q', 'exam', 'cat', 'scen', 'cards']), unitWord: 'Domains', practice: null, pace: 72,
    from: ['new', 'due', 'missed', 'weak'], counts: [10, 20, 30, 50],
    examKinds: [['std', '100 questions, 2 hours'], ['real', 'Exam-realistic: no flagging, no going back']],
    store: { cards: 'nremt_flashcards_v1' }, engine: '#nrBuilder', total: '#progressText',
    kinds: [['fact', 'Key facts'], ['glossary', 'Terms'], ['mnemonic', 'Mnemonics'], ['reference', 'Reference tables']],
    exam: '100 questions in 2 hours, in the 2025 NREMT domain mix; no feedback until you submit',
    domains: nremtDomains(), reviewAreas: nremtReviewAreas(),
  };
  throw new Error(`practice-panel: no config for ${key}`);
}


/* The short band: issue line with the course, "Practice", one sub line (the question count, filled in by
   the panel when it knows it) and the free daily limit box (filled in only for a visitor with a limit). */
export function bandHtml(key, { up = '../', crumbs = [], sub = 'Every answer explained' } = {}) {
  /* NREMT and ochem explain the right answer; the AP® courses and A&P explain every option (question audit 2026-11-06). */
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

/* Without JavaScript nothing here can run, so the card names the pages that open each mode. */
function noscriptHtml(key) {
  const c = panelConfig(key), links = [['review.html', 'Review'], ['flashcards.html', 'Flashcards'], ['exams.html', 'Exams']];
  if (c.formats.some(f => f[0] === 'frq')) links.push(['frq.html', 'Free response']);
  if (c.formats.some(f => f[0] === 'jus')) links.push(['justify.html', 'Justify']);
  if (c.formats.some(f => f[0] === 'scen')) links.push(['scenario-sim.html', 'Scenarios']);
  if (c.cram) links.push(['cram.html', 'Cram plan']);
  return `<noscript><p class="pp-noscript">Setting up a session needs JavaScript. Each mode also has its own page: ${links.map(l => `<a href="${l[0]}">${l[1]}</a>`).join(', ')}.</p></noscript>`;
}

const ico22 = d => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/* Step 1's tiles, in the mockup's order; a course shows only the modes it has. The second line of Review and
   Flashcards is live (practice-panel.js fills in the counts; data-live). */
const TILE_ICONS = {
  set: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  rev: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
  fc: '<rect x="7" y="4" width="13" height="15" rx="2"/><path d="M4 8v11a2 2 0 0 0 2 2h9"/>',
  exam: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M10 2h4"/>',
  cat: '<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>',
  scen: '<rect x="2" y="9" width="13" height="8" rx="1.5"/><path d="M15 11h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8.5 11v4M6.5 13h4"/>',
  frq: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  jus: '<path d="M12 4v16"/><path d="M5 8h14"/><path d="M5 8l-3 7a3.5 3.5 0 0 0 6 0z"/><path d="M19 8l-3 7a3.5 3.5 0 0 0 6 0z"/><path d="M8 20h8"/>',
  cram: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
};
export function panelModes(key) {
  const c = panelConfig(key), has = id => c.formats.some(f => f[0] === id), out = [];
  const n = (k, w) => `${k.toLocaleString('en-US')} ${w}${k === 1 ? '' : 's'}`;
  out.push(['set', 'Practice set', 'Questions with feedback']);
  out.push(['rev', 'Review', 'Due questions, spaced', 'due']);
  out.push(['fc', 'Flashcards', 'New and due cards', 'new']);
  out.push(['exam', 'Exam', 'Timed, like the real one']);
  if (has('cat')) out.push(['cat', 'Adaptive exam', 'Adapts to each answer, like the CAT']);
  if (has('scen')) out.push(['scen', 'Scenarios', 'One call, dispatch to handoff']);
  if (has('frq')) out.push(['frq', 'Free response', c.frqN ? n(c.frqN, 'question') : 'Write, then score with the rubric']);
  if (has('jus')) out.push(['jus', 'Justify', c.jusN ? n(c.jusN, 'prompt') : 'Short written reasoning']);
  /* The cram plan is a schedule, not a session: it lives with the path on Home (owner 2026-11-06); Exam links to it. */
  return out;
}

/* The card (Practice v4 B): the modes as a list on the left, the chosen mode's settings in one column in
   the middle (drawn by practice-panel.js from the config, in two groups), and Your session on the right:
   the choice in words, one Start, Reset and the share row. The right column stays in view on wide screens; on
   narrower ones, where it comes after the settings, a one-line bar (.pp-mbar: the choice and Start) stays above the
   tab bar until Your session is on screen (owner 2026-11-06). */
export function panelHtml(key) {
  const tiles = panelModes(key).map(([id, t, line, live]) => `<button type="button" class="pp-tile" data-mode="${id}" aria-pressed="false"><span class="pp-tile-i">${ico22(TILE_ICONS[id])}</span><span class="pp-tile-x"><b>${t}</b><span class="pp-tile-l"${live ? ` data-live="${live}"` : ''}>${line}</span></span></button>`).join('');
  return `<div class="pp-v3 pp-v4" id="pp">
<section class="pp-card" aria-label="Set up a practice session">
<div class="pp-rail"><h2 class="sr-only" id="ppK1">What do you want to do?</h2>
<div class="pp-tiles" role="group" aria-labelledby="ppK1">${tiles}</div></div>
<div class="pp-form"><h2 class="sr-only" id="ppK2">Set it up</h2>
<div class="pp-set" id="ppSet" role="group" aria-labelledby="ppK2"><p class="pp-loading">Loading the settings&hellip;</p></div>
${noscriptHtml(key)}
</div>
<aside class="pp-side" aria-label="Your session"><div class="pp-sum">
<div class="pp-sumcard"><p class="pp-sum-k">Your session</p><p class="pp-sum-t" id="ppSumT" aria-live="polite"></p><p class="pp-sum-b" id="ppSumB"></p><a class="pp-go" id="ppGo" href="practice.html">Start practice</a></div>
<button type="button" class="pp-reset" id="ppReset">Reset to defaults</button>
<div id="ppShare"></div>
</div></aside>
</section>
<div class="pp-mbar" id="ppMbar"><p class="pp-mbar-t" id="ppMbarT" aria-hidden="true"></p><button type="button" class="pp-mbar-go" id="ppMbarGo">Start</button></div>
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
