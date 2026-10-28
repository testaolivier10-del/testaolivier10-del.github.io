/* Site redesign round 3, step B3 (docs/site-redesign.md, boards docs/redesign-r3/r10/boards/R10-Exams,
   R10-AP-Exams, R10-AP-UnitTest, R10-Progress, R10-ExamDay): the short cover band every inner page opens
   with, and the page frame under it.

   An inner page is   <main id="main" class="r3 r3-inner" data-cover="KEY">
                        <section class="band short">...</section>       (full width, course colour)
                        <div class="xshell r3-body ...">...</div>        (the page's own content, pulled up
                      </main>                                             over the band's foot)
   Styles: assets/course/r3.css (the band) and assets/course/r3-inner.css (the frame and the exams and
   progress parts). Built pages go through r3Inner(); the hand-written pages (nremt/exams.html,
   nremt/dashboard.html, nremt/exam-day.html, ochem/exams.html, ochem/dashboard.html) carry the band between
   <!-- r3-band:start --> and <!-- r3-band:end -->, written by scripts/build-r3-inner.mjs. */

export const COURSES = {
  nremt: { label: 'NREMT-EMT', name: 'NREMT-EMT Prep' },
  ochem: { label: 'Organic Chemistry', name: 'Organic Chemistry' },
  anp: { label: 'Anatomy &amp; Physiology', name: 'Anatomy &amp; Physiology' },
  apbio: { label: 'AP&reg; Biology', name: 'AP&reg; Biology' },
  apchem: { label: 'AP&reg; Chemistry', name: 'AP&reg; Chemistry' },
  apphys: { label: 'AP&reg; Physics 1', name: 'AP&reg; Physics 1' },
  apcalc: { label: 'AP&reg; Calculus AB', name: 'AP&reg; Calculus AB' },
  apstat: { label: 'AP&reg; Statistics', name: 'AP&reg; Statistics' },
  apenv: { label: 'AP&reg; Environmental Science', name: 'AP&reg; Environmental Science' },
  appsych: { label: 'AP&reg; Psychology', name: 'AP&reg; Psychology' },
};
const AP = new Set(['apbio', 'apchem', 'apphys', 'apcalc', 'apstat', 'apenv', 'appsych']);

/* The words of each band. Lede null keeps the page's own lede. */
export function bandWords(key, slug) {
  const ap = AP.has(key);
  if (slug === 'exams') return {
    kicker: 'Exams', title: 'Exams', tone: 'the full run.',
    hand: ap ? 'the real format, on the real clock' : 'on the clock, like test day',
    cta: { label: key === 'nremt' ? 'Start timed exam' : ap ? 'Start the practice exam' : 'Set up an exam', start: true },
  };
  if (slug === 'dashboard') return {
    kicker: 'Dashboard', title: 'Where you', tone: 'stand today.',
    hand: 'worked out in your browser from every answer you give',
    cta: { label: 'Continue practicing', href: 'practice.html' },
  };
  if (slug === 'exam-day') return {
    kicker: 'About the exam', title: 'What the NREMT-EMT exam', tone: 'is actually like.',
    hand: 'everything around the test, in one place',
    cta: { label: 'Take a timed exam', href: 'exams.html' },
  };
  if (slug === 'unit-test') return {
    kicker: 'Free unit test', tone: 'one unit, exam style.',
    hand: 'free, with an explanation for every option',
    cta: { label: 'Start at question 1', href: '#r3Questions' },
  };
  throw new Error(`r3-inner: no band words for ${key}/${slug}`);
}

/* The band. crumbs: [{ name, href }] (the last one is the current page, no href). issue replaces the whole
   kicker line ("Course · kicker") when a page has its own. */
export function shortBand({ key, up = '../', crumbs = [], kicker, issue, title, tone, hand, lede, ledeId, cta, beta, extra = '', id }) {
  if (!COURSES[key]) throw new Error(`r3-inner: unknown course ${key}`);
  const crumb = crumbs.length ? `<nav class="r3-crumb" aria-label="Breadcrumb">${crumbs.map((c, i) => i === crumbs.length - 1
    ? `<span aria-current="page">${c.name}</span>` : `<a href="${c.href}">${c.name}</a> <span aria-hidden="true">&rsaquo;</span> `).join('')}</nav>\n` : '';
  const btn = !cta ? '' : cta.start
    ? `<div class="hero-ctas"><a class="btn-chan" href="#r3Body" data-r3-start>${cta.label}</a></div>`
    : `<div class="hero-ctas"><a class="btn-chan" href="${cta.href}">${cta.label}</a></div>`;
  return `<section class="band short"${id ? ` id="${id}"` : ''} aria-labelledby="r3Title"><div class="hwrap"><div>
${crumb}<p class="issue">${issue || `${COURSES[key].label} &middot; ${kicker}`} <i></i></p>
<h1 class="deck" id="r3Title">${title ? `${title} ` : ''}<span>${tone}</span></h1>
<p class="hand">${hand}</p>
${lede ? `<p class="lede"${ledeId ? ` id="${ledeId}"` : ''}>${lede}</p>\n` : ''}${btn}${extra}
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async"></div></div></section>`;
}

/* The band's start button presses the page's own start button (the exam builders render theirs), or
   scrolls to the page body when there is none yet. */
export const START_SCRIPT = `<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-r3-start]');if(!a)return;var b=document.querySelector('#r3Body #startBtn,#r3Body .cx-start button,#r3Body [data-start]');if(b&&!b.disabled){e.preventDefault();b.click();}});</script>`;

/* Turn a built course page into a round 3 inner page: the <main> becomes the r3 frame, its breadcrumb and
   page head move into the band, and the rest goes into the body wrapper. */
export function r3Inner(html, { key, slug, up = '../', words, after = '' }) {
  const w = { ...bandWords(key, slug), ...(words || {}) };
  const m = html.match(/<main id="main" class="([^"]*)">([\s\S]*?)<\/main>/);
  if (!m) throw new Error(`r3-inner: ${key}/${slug}: no <main id="main" class="...">`);
  let inner = m[2];
  const crumbM = inner.match(/<nav class="[^"]*crumb[^"]*"[^>]*aria-label="Breadcrumb">([\s\S]*?)<\/nav>/);
  const crumbs = [];
  if (crumbM) {
    for (const a of crumbM[1].matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>/g)) crumbs.push({ href: a[1], name: a[2] });
    const cur = crumbM[1].match(/<span aria-current="page">([\s\S]*?)<\/span>/);
    if (cur) crumbs.push({ name: cur[1] });
    inner = inner.replace(crumbM[0], '');
  }
  const headM = inner.match(/<header class="(?:page-head[^"]*|hero [^"]*)">([\s\S]*?)<\/header>/);
  if (!headM) throw new Error(`r3-inner: ${key}/${slug}: no page head`);
  const lede = w.lede !== undefined ? w.lede : ((headM[1].match(/<p class="lede">([\s\S]*?)<\/p>/) || [])[1] || '');
  const beta = /\bBeta\b/.test(headM[1]);
  const title = w.title !== undefined ? w.title : ((headM[1].match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '');
  inner = inner.replace(headM[0], '');
  if (LAYOUT[slug]) inner = LAYOUT[slug](inner, { key, up });
  if (slug === 'unit-test') {
    /* "Unit 1 · 8–11% of the exam", "Unit 1 practice test: Chemistry of Life", the lede and its Covers line */
    const eyebrow = ((headM[1].match(/<div class="eyebrow">([\s\S]*?)<\/div>/) || [])[1] || '').replace(/<(span|strong|b)[^>]*>[\s\S]*?<\/\1>/g, '').replace(/&ndash;/g, ' to ').trim();
    const [t1, t2] = title.split(/:\s*/);
    const covers = ((headM[1].match(/<p class="[a-z]+-small[^"]*">(Covers:[\s\S]*?)<\/p>/) || [])[1] || '');
    const n = +((lede.match(/^(\d+)/) || [])[1] || 0);
    Object.assign(w, { issue: eyebrow, hand: `${numWord(n)} questions, every option explained` });
    const band = shortBand({ key, up, crumbs, ...w, title: `${t1}:`, tone: t2, lede: `${lede} ${covers}`.trim(), beta });
    return finish(html, m, band, inner, { key, slug, up, w, after });
  }
  const band = shortBand({ key, up, crumbs, ...w, title, lede, beta });
  return finish(html, m, band, inner, { key, slug, up, w, after });
}

function finish(html, m, band, inner, { key, slug, up, w, after }) {
  const main = `<main id="main" class="r3 r3-inner r3-${slug}" data-cover="${key}">
${band}
<div class="xshell r3-body ${m[1].replace(/\bxshell\b/, '').trim()}" id="r3Body">${inner}${after}</div>
</main>`;
  let out = html.replace(m[0], main);
  const css = `<link rel="stylesheet" href="${up}assets/course/r3.css">\n<link rel="stylesheet" href="${up}assets/course/r3-inner.css">\n`;
  if (!out.includes('assets/course/r3-inner.css')) out = out.replace('</head>', `${css}</head>`);
  if (w.cta && w.cta.start && !out.includes(START_SCRIPT)) out = out.replace('</body>', `${START_SCRIPT}\n</body>`);
  return out;
}

const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const numWord = n => NUM[n] || String(n);

/* Page layouts under the band, by page kind. */
const LAYOUT = {
  /* A free unit test (board R10-AP-UnitTest): the questions on the left, a rail on the right with the
     "Keep going" buttons, the justification trainer and the other units, all from the page's own
     "Keep going" section. */
  'unit-test'(inner) {
    const sec = inner.match(/<section class="xsection[^"]*" aria-labelledby="ut-more">([\s\S]*?)<\/section>/);
    const qs = inner.match(/<div class="[a-z]+-qs" data-set="check">[\s\S]*?<\/div>(?=\s*<section class="xsection)/);
    if (!sec || !qs) throw new Error('r3-inner: unit test: no question list or Keep going section');
    const btns = (sec[1].match(/<div class="[a-z]+-cards-row">([\s\S]*?)<\/div>/) || [])[1] || '';
    const small = (sec[1].match(/<p class="[a-z]+-small">([\s\S]*?)<\/p>/) || [])[1] || '';
    const [, keep = small, write = '', others = ''] = small.match(/^([\s\S]*?)\s*(Write a full answer[\s\S]*?\.)?\s*(?:Other units: ([\s\S]*?)\.)?$/) || [];
    const chips = others ? others.split(/\s*&middot;\s*/).map(u => /^<b>/.test(u) ? `<span aria-current="page">${u.replace(/<\/?b>/g, '')}</span>` : u).join('') : '';
    const rail = `<aside class="r3-rail" aria-label="Keep going">
<div class="r3-navy"><p class="kicker">Keep going</p><div class="r3-railbtns">${btns.replace(/class="btn-press"/, 'class="btn-gold"').replace(/class="btn-outline"/g, 'class="btn-line"')}</div><p>${keep}</p></div>
${write ? `<div class="r3-card"><h2 class="r3-card-h">Write a full answer</h2><p>${write.replace(/^Write a full answer with /, 'Practice the reasoning the free response asks for with ').replace(/\.$/, '.')}</p></div>` : ''}
${chips ? `<div class="r3-card"><h2 class="r3-card-h">Other units</h2><p class="r3-chips">${chips}</p></div>` : ''}
</aside>`;
    return inner.replace(sec[0], '').replace(qs[0], `<div class="r3-split" id="r3Questions"><div class="r3-col">${qs[0]}</div>${rail}</div>`);
  },
};

/* The free unit tests under an AP® exams page: one short line of links, not a card per unit (Olivier,
   2026-10-26, the cards read like a repeat of the picker). These are fixed tests, the same for everyone, unlike
   the picker's unit test, which builds a new set from the bank each time. */
export function unitTestRow(tests) {
  if (!tests.length) return '';
  return `
<section class="r3-units" aria-label="Free unit tests">
<p class="r3-units-line"><b>Free fixed tests, one per unit:</b> ${tests.map(t => `<a href="${t.href}">${t.name}</a>`).join(' · ')}</p>
</section>`;
}
