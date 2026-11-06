/* Course redesign round 4, part D (docs/course-redesign-r4.md decision 5; mockup
   docs/redesign-r4/mockups/Practice.dc.html): every course's practice.html is one panel.

     <main id="main" class="r3 r3-inner r3-practice" data-cover="KEY">
       <section class="band short">  issue line, "Practice", the question count, the free limit box
       <div class="xshell lap pp-wrap"><div class="pp" id="pp">
         1 · What do you want to do?   one tile per mode the course has (links, so they work without JS)
         2 · Set it up                 the practice engine's own builder (#app) for a Practice set; the
                                       panel's fields (#ppSet) for every other mode
         the navy bar                  the summary and the one Start (#ppBar; for a Practice set the
                                       engine's own .cx-start, styled as the bar)
       <script type="application/json" id="ppConfig">

   assets/course/practice-panel.js reads the config, draws the settings and opens the mode's existing
   page with the settings in the URL (review.html?go=1&unit=..., exams.html?go=1&mode=..., ...); each
   engine reads them and starts. Styles: assets/course/practice-panel.css (the band and .lap are part A's,
   in r3.css). Built pages go through practicePage(); nremt/practice.html and ochem/practice.html carry
   the band, the tiles and the config between markers written by scripts/build-practice-panel.mjs. */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSES } from './r3-inner.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
function nremtDomains() {
  return JSON.parse(readFileSync(join(ROOT, 'nremt', 'assets', 'flashcards.json'), 'utf8')).domains.map(d => [d.key, d.label]);
}

const ICON = {
  set: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  review: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
  flash: '<rect x="7" y="4" width="13" height="15" rx="2"/><path d="M4 8v11a2 2 0 0 0 2 2h9"/>',
  exam: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M10 2h4"/>',
  cat: '<path d="M4 18l5-6 4 3 7-9"/><path d="M15 6h5v5"/>',
  frq: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  justify: '<path d="M12 4v16"/><path d="M5 8h14"/><path d="M5 8l-3 7a3.5 3.5 0 0 0 6 0z"/><path d="M19 8l-3 7a3.5 3.5 0 0 0 6 0z"/><path d="M8 20h8"/>',
  cram: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  scen: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
};

/* Every mode a course can have. sub is the line under the title until the panel has a live count. */
export const MODES = {
  set: { title: 'Practice set', sub: 'Questions with feedback', href: 'practice.html' },
  review: { title: 'Review', sub: 'Your spaced review queue', href: 'review.html' },
  flash: { title: 'Flashcards', sub: 'Spaced cards', href: 'flashcards.html' },
  exam: { title: 'Exam', sub: 'Timed, no feedback', href: 'exams.html' },
  cat: { title: 'Adaptive exam', sub: '70 to 120 questions, like the real one', href: 'exams.html#adaptive' },
  frq: { title: 'Free response', sub: 'Scored with the rubrics', href: 'frq.html' },
  justify: { title: 'Justify', sub: 'Write it, then check it', href: 'justify.html' },
  cram: { title: 'Cram plan', sub: 'Counted back from exam day', href: 'cram.html' },
  scen: { title: 'Scenarios', sub: 'Run a call from dispatch to handoff', href: 'scenario-sim.html' },
};

const AP_MODES = ['set', 'review', 'flash', 'exam', 'frq', 'justify', 'cram'];
const AP_KINDS = [['t', 'Term → definition'], ['d', 'Definition → term'], ['s', 'Topic summaries']];

/* The full practice exam, in one line (information, not a setting: the panel keeps it behind
   "What's in the full exam"). From each course's exams engine header. */
const AP = {
  apbio: { dir: 'bio', glob: 'ApBio', note: 'Units 1 and 2 are unlimited.', practice: 'Science practice',
    exam: 'Section I: 60 multiple-choice questions in 90 minutes, drawn from each unit by its exam weight, stimulus sets kept whole. Section II: 6 free-response questions in 90 minutes, scored with the rubrics.' },
  apchem: { dir: 'chem', glob: 'ApChem', note: 'Units 1 and 2 are unlimited.', practice: 'Science practice',
    exam: 'Section I: 60 multiple-choice questions in 90 minutes, drawn from each unit by its exam weight. Section II: 7 free-response questions in 105 minutes, three long and four short, scored with the rubrics.' },
  apphys: { dir: 'physics', glob: 'ApPhys', note: 'Units 1 and 2 are unlimited.', practice: 'Science practice',
    exam: 'Section I: 42 multiple-choice questions in 85 minutes, drawn from each unit by its exam weight. Section II: 4 free-response questions in 95 minutes, in the exam’s fixed order, scored with the rubrics.' },
  apcalc: { dir: 'calculus', glob: 'ApCalc', note: 'Units 1 and 2 are unlimited.', practice: 'Mathematical practice',
    exam: 'Section I: 29 multiple-choice questions without a calculator in 62 minutes, then 13 with a graphing calculator in 38 minutes. Section II: 2 free-response questions with a calculator, then 4 without, scored with the rubrics.' },
  apcalcbc: { dir: 'calculus-bc', glob: 'ApCalc', note: 'Units 1 and 2 are unlimited.', practice: 'Mathematical practice', kit: '../calculus/assets/pages/frq-kit.js',
    exam: 'Section I: 29 multiple-choice questions without a calculator in 62 minutes, then 13 with a graphing calculator in 38 minutes. Section II: 2 free-response questions with a calculator, then 4 without, scored with the rubrics.' },
  apstat: { dir: 'statistics', glob: 'ApStat', note: 'Unit 1 is unlimited.', practice: 'Skill',
    exam: 'Section I: 42 multiple-choice questions in 90 minutes, drawn from every unit by its exam weight. Section II: 4 free-response questions in 90 minutes, 10 points each.' },
  apenv: { dir: 'environmental-science', glob: 'ApEnv', note: 'Unit 1 is unlimited.', practice: 'Science practice',
    kinds: [...AP_KINDS, ['f', 'Formulas']],
    exam: 'Section I: 80 multiple-choice questions in 90 minutes, drawn from every unit by its exam weight. Section II: 3 free-response questions in 70 minutes, 10 points each.' },
  appsych: { dir: 'psychology', glob: 'ApPsych', note: 'Unit 1 is unlimited.', practice: 'Science practice',
    kinds: [...AP_KINDS, ['f', 'Statistics']],
    exam: 'Section I: 75 multiple-choice questions in 90 minutes, drawn from every unit by its exam weight. Section II: the Article Analysis and Evidence-Based Questions in 70 minutes, 7 points each.' },
  apprecalc: { dir: 'precalculus', glob: 'ApPrecalc', note: 'Unit 1 and the algebra chapter are unlimited.', practice: 'Mathematical practice',
    exam: 'Section I: 29 multiple-choice questions without a calculator in 65 minutes, then 13 with a graphing calculator in 40 minutes. Section II: 2 free-response questions with a calculator, then 2 without, scored with the rubrics.' },
  apmacro: { dir: 'macroeconomics', glob: 'ApMacro', note: 'Unit 1 is unlimited.', practice: 'Skill',
    kinds: [...AP_KINDS, ['f', 'Formulas']],
    exam: 'Section I: 60 multiple-choice questions in 70 minutes, drawn from every unit by its exam weight. Section II: one long and two short free-response questions in 60 minutes, scored with the rubrics.' },
};

/* The config practice-panel.js reads. */
export function panelConfig(key) {
  if (AP[key]) {
    const a = AP[key];
    return {
      course: key, family: 'ap', glob: a.glob, note: a.note, modes: AP_MODES,
      store: { prefs: `${key}_prefs_v1`, cards: `${key}_flashcards_v1`, date: `${key}_exam_date` },
      kinds: a.kinds || AP_KINDS, kit: a.kit || 'assets/pages/frq-kit.js', kitGlob: `${a.glob}Frq`, exam: a.exam,
      setRoot: '#app',
    };
  }
  if (key === 'anp') return {
    course: 'anp', family: 'anp', glob: 'Anp', note: 'Foundations questions are unlimited.', modes: ['set', 'review', 'flash', 'exam'],
    store: { prefs: 'anp_prefs_v1', cards: 'anp_flashcards_v1' },
    kinds: [['t', 'Term → definition'], ['d', 'Definition → term'], ['f', 'Comparisons and key facts']],
    setRoot: '#app',
  };
  if (key === 'ochem') return {
    course: 'ochem', family: 'ochem', note: 'The first four chapters are unlimited.', modes: ['set', 'review', 'flash', 'exam'],
    store: { cards: 'ochem_flashcards_v1' }, setRoot: '#practiceHome',
  };
  /* The flashcard domains are the deck's own (nremt/assets/flashcards.json "domains"). */
  if (key === 'nremt') return {
    course: 'nremt', family: 'nremt', note: 'The study notes stay open.', modes: ['set', 'review', 'flash', 'exam', 'cat', 'scen'],
    store: { cards: 'nremt_flashcards_v1' }, setRoot: '#nrBuilder', domains: nremtDomains(),
  };
  throw new Error(`practice-panel: no config for ${key}`);
}

const svg = id => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[id]}</svg>`;

/* Step 1: a link per mode (without JavaScript each opens its own page). */
export function tilesHtml(modes) {
  return modes.map(id => {
    const m = MODES[id];
    return `<a class="pp-tile" href="${m.href}" data-mode="${id}"><span class="pp-ic">${svg(id)}</span><span class="pp-tt"><b>${m.title}</b><span class="pp-ts" data-live="${id}">${m.sub}</span></span></a>`;
  }).join('');
}

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

/* The panel around a step 2 body (the engine's mount). */
export function panelHtml(key, step2) {
  const cfg = panelConfig(key);
  return `<div class="pp" id="pp">
<section class="pp-step pp-s1" aria-labelledby="ppS1"><h2 class="pp-k" id="ppS1">1 &middot; What do you want to do?</h2>
<div class="pp-tiles">${tilesHtml(cfg.modes)}</div></section>
<section class="pp-step pp-s2" aria-labelledby="ppS2"><h2 class="pp-k" id="ppS2">2 &middot; Set it up</h2>
${step2}
<div class="pp-set" id="ppSet" hidden></div></section>
<div class="pp-bar" id="ppBar" hidden><div class="pp-bar-t"><p class="pp-sum" id="ppSum" aria-live="polite"></p><p class="pp-sum2" id="ppSum2"></p></div><a class="pp-go" id="ppGo" href="practice.html">Start</a></div>
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
${panelHtml(key, app[0])}
</div>
${configHtml(key)}
</main>`;
  let out = html.replace(m[0], main);
  const css = `<link rel="stylesheet" href="${up}assets/course/r3-inner.css">\n<link rel="stylesheet" href="${up}assets/course/practice-panel.css">\n`;
  if (!out.includes('assets/course/practice-panel.css')) out = out.replace('</head>', `${css}</head>`);
  const js = `${panelConfig(key).modes.includes('cram') ? `<script src="${up}assets/exam-date.js" defer></script>\n` : ''}<script src="${up}assets/course/practice-panel.js" defer></script>\n`;
  if (!out.includes('assets/course/practice-panel.js')) out = out.replace('</body>', `${js}</body>`);
  return out;
}
