/* The course home layout from the site redesign, round 2 (docs/site-redesign.md, mockups S01 and S02):
   a cover hero with the course's own art, "Start here" in three steps, practice by exam domain or unit,
   notes and exams side by side, tools, and Free beside Premium. Every AP® builder, the A&P builder and the
   hand-written NREMT and ochem homes share this markup so the nine homes cannot drift apart. Styles live in
   assets/course/hub.css ("Course home, round 2"); colors come only from theme tokens plus the cover's own
   art colors (data-cover on the main element), so dark mode works.

   Nothing here shows one student's state: a returning student's place comes from the page's own home
   script (the AP® and A&P homes fill the start card) or, for NREMT and ochem, from levl_resume. */
import { COVERS } from './covers.mjs';
import { premiumData, foundingPrice, money, longDate } from './premium-data.mjs';

const esc = (s) => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The cover art beside the hero, with a card over its foot. `card` is the card's inner HTML
   (the AP® homes pass their start card, which their home script turns into "Continue"); with no
   card, a levl_resume script fills one in for returning visitors and the art stands alone otherwise. */
function panel({ key, up, card, cardId, extra = '' }) {
  const c = COVERS[key];
  const resume = card ? '' : `<a class="ch-resume" id="chResume" href="#" hidden><small>Pick up where you left off</small><b id="chResumeLabel"></b><span class="ch-go" aria-hidden="true">Continue &rarr;</span></a>
    <script>try{var r=(JSON.parse(localStorage.getItem('levl_resume')||'{}')||{})[${JSON.stringify(key)}];if(r&&typeof r.url==='string'&&/^\\/[^\\/]/.test(r.url)){var a=document.getElementById('chResume');a.href=r.url;document.getElementById('chResumeLabel').textContent=r.label||'Your last page';a.hidden=false;}}catch(e){}</script>`;
  return `<div class="ch-panel">
    <div class="ch-art" aria-hidden="true"><img src="${up}assets/covers/${key}.svg" alt="" width="640" height="320" decoding="async"><span class="ch-art-t"><b>${c.t1}<span>${c.t2}</span></b></span></div>
    ${card ? `<div class="ch-card" id="${cardId}">${card}</div>` : resume}
    ${extra}
  </div>`;
}

/* Hero: pill, two-tone headline, the handwritten line, a short lede, two buttons and one trust line. */
export function homeHero(o) {
  const c = COVERS[o.key];
  return `<section class="ch-hero" aria-labelledby="chTitle">
  <div class="ch-hero-copy">
    <p class="ch-pill">${o.pill}</p>
    <h1 id="chTitle">${o.t1 || c.t1} <span>${o.t2 || c.t2}</span></h1>
    <p class="ch-hand">${o.hand || c.hand}</p>
    <p class="ch-lede">${o.lede}</p>
    <div class="ch-btns">${o.primary}${o.secondary || ''}</div>
    ${o.trust ? `<p class="ch-trust">${o.trust}</p>` : ''}
  </div>
  ${panel({ key: o.key, up: o.up ?? '../', card: o.card, cardId: o.cardId, extra: o.panelExtra })}
</section>`;
}

/* A section heading in the display face: "Practice by <span>exam domain</span>". */
export const sectionHead = (id, a, b, lede = '', aside = '') =>
  `<div class="ch-sh"><div><h2 id="${id}">${a}${b ? ` <span>${b}</span>` : ''}</h2>${lede ? `<p>${lede}</p>` : ''}</div>${aside}</div>`;

/* Three numbered steps, in the order a new student should take them. */
export function homeSteps(steps, lede) {
  return `<section class="ch-sec" aria-labelledby="chStart">
  ${sectionHead('chStart', 'Start', 'here', lede)}
  <ol class="ch-steps">${steps.map((s, i) => `<li class="ch-box ch-step"><span class="ch-n" aria-hidden="true">${i + 1}</span><h3>${s.h}</h3><p>${s.p}</p><a class="ch-go" href="${s.href}">${s.go} &rarr;</a></li>`).join('')}</ol>
</section>`;
}

/* NREMT, ochem and A&P: domains or parts as rows with a share bar. rows: { h, p, share (0..1 of the
   widest), weight (text), count, href }. */
export function homeDomains({ id = 'chPractice', a, b, lede, rows }) {
  return `<section class="ch-sec" aria-labelledby="${id}">
  ${sectionHead(id, a, b, lede)}
  <ul class="ch-box ch-doms">${rows.map((r) => `<li class="ch-dom"><div class="ch-dom-t"><h3>${r.h}</h3>${r.p ? `<p>${r.p}</p>` : ''}</div><div class="ch-dom-w"><span class="ch-track" aria-hidden="true"><i style="width:${Math.max(4, Math.round(r.share * 100))}%"></i></span><span>${r.weight}</span></div>${r.href ? `<a class="ch-ghost" href="${r.href}">${r.go || 'Practice this'}<span class="sr-only">: ${r.h.replace(/<[^>]+>/g, '')}</span></a>` : ''}</li>`).join('')}</ul>
</section>`;
}

/* AP®: the units as a grid of numbered cards. units: { num, title, href, meta, weight, free, skill }. */
export function homeUnits({ id = 'chUnits', a, b, lede, units }) {
  return `<section class="ch-sec" aria-labelledby="${id}">
  ${sectionHead(id, a, b, lede)}
  <ol class="ch-units">${units.map((u) => {
    const inner = `<span class="ch-num" aria-hidden="true">${u.num}</span><span class="ch-unit-t"><b>${u.skill ? '' : `<span class="sr-only">Unit ${u.num}: </span>`}${esc(u.title)}</b><small>${u.meta}</small>${u.free ? `<span class="ch-free">${u.free}</span>` : ''}</span><span class="ch-w">${u.weight || ''}</span>`;
    return `<li class="ch-box ch-unit${u.skill ? ' skill' : ''}" data-unit="${u.id || ''}">${u.href ? `<a href="${u.href}">${inner}</a>` : `<div>${inner}</div>`}</li>`;
  }).join('')}</ol>
</section>`;
}

/* The exam in one strip: [{ k, b, s }] small label, big value, sub line. */
export function examStrip(cells, label = 'The exam') {
  return `<section class="ch-box ch-strip" aria-label="${label}">${cells.map((c) => `<div><small>${c.k}</small><b>${c.b}</b><span>${c.s}</span></div>`).join('')}</section>`;
}

/* Notes (free) beside the exams card. */
export function notesAndExams({ notes, exam }) {
  return `<section class="ch-sec ch-two" aria-label="Notes and exams">
  <div class="ch-box ch-notes">
    <p class="ch-eye">${notes.eye}</p>
    <h2>${notes.a} <span>${notes.b}</span></h2>
    <p>${notes.p}</p>
    ${notes.chips && notes.chips.length ? `<ul class="ch-chips">${notes.chips.map((c) => `<li><a href="${c.href}">${esc(c.t)}${c.i ? `<i>${c.i}</i>` : ''}</a></li>`).join('')}</ul>` : ''}
    <a class="ch-ghost" href="${notes.href}">${notes.go}</a>
  </div>
  <div class="ch-box ch-exam">
    <p class="ch-eye">${exam.eye || 'Exams'}</p>
    ${exam.big ? `<p class="ch-clock"><b>${exam.big}</b><span>${exam.unit}</span></p>` : ''}
    ${exam.h ? `<h2>${exam.h}</h2>` : ''}
    <p>${exam.p}</p>
    <a class="ch-cta" href="${exam.href}">${exam.go}</a>
    ${exam.note ? `<p class="ch-small">${exam.note}</p>` : ''}
  </div>
</section>`;
}

/* Tools as cards: { href, name, desc, icon (inner SVG paths, stroke) }. */
export function homeTools({ a = 'Tools', b, lede, tools, allHref }) {
  if (!tools.length) return '';
  return `<section class="ch-sec" aria-labelledby="chTools">
  ${sectionHead('chTools', a, b, lede, allHref ? `<a class="ch-go" href="${allHref}">All tools &rarr;</a>` : '')}
  <ul class="ch-tools">${tools.map((t) => `<li><a class="ch-box ch-tool" href="${t.href}"><span class="ch-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">${t.icon || '<circle cx="12" cy="12" r="8"/>'}</svg></span><span><b>${esc(t.name)}</b>${t.desc ? `<small>${esc(t.desc)}</small>` : ''}</span></a></li>`).join('')}</ul>
</section>`;
}

/* The whole <main> of an AP® course home. The six AP® builders are forks of one another and pass the
   same locals; `o.prefix` names their ids (bio, chem, phys, calc, stat, env) so each course's home script
   (assets/<x>-home.js) still finds its start card, review card, hero button and sample question.
   o: { key, prefix, mainClass, courseHtml, beta, t2, lede, storageKey, first, firstCh, unitLabel,
        freeUnits, freeUnitsText, dailyFree, chapters, topicsOf, chapterBuilt, partLabel, nq, apps, tools,
        toolIcon, exam: { mcq, mcqTime, frq, frqTime }, sample } */
export function apHomeMain(o) {
  const P = o.prefix;
  const app = (slug) => (o.apps || []).find((a) => a.slug === slug);
  const prem = premiumData().COURSES[o.key] || { free: [] };
  const freeExam = prem.free.some((x) => /practice exam/i.test(x));
  const first = o.first, firstCh = o.firstCh;
  const startCard = first
    ? `<div class="k">Start here</div><h2>${esc(first.title)}</h2><p>${esc(o.unitLabel(firstCh))} &middot; ${esc(firstCh.title)}.${o.freeUnitsText ? ` ${o.freeUnitsText} lessons and every notes page are free.` : ' Every notes page is free.'}</p><a class="btn-press" href="lessons/${first.id}.html">Start the first lesson</a>`
    : '<div class="k">Start here</div><h2>Pick any unit</h2><p>Every notes page is free.</p>';
  const review = `<div class="ch-mini" id="${P}Review"><span class="k">Review queue</span><h2>Missed questions come back</h2><p>Anything you miss returns when you are about to forget it, not on a fixed date.</p><a href="review.html">Open review &rarr;</a></div>`;
  const primary = first
    ? `<a class="ch-cta" id="heroPrimaryCta" href="lessons/${first.id}.html">Start the first lesson</a><script>try{var d=JSON.parse(localStorage.getItem('${o.storageKey}')||'null');if(d&&(Object.keys(d.lessons||{}).length||Object.keys(d.q||{}).length))heroPrimaryCta.classList.add('cta-pending')}catch(e){}</script>`
    : '<a class="ch-cta" href="learn.html">See the units</a>';
  const trust = `Every notes page is free${o.freeUnitsText ? `, and so are the lessons in ${o.freeUnitsText}` : ''}.${o.dailyFree ? ` ${o.dailyFree} practice questions a day are free too.` : ''}`;
  const hero = homeHero({
    key: o.key,
    pill: `${o.courseHtml} &middot; free to start ${o.beta || ''}`,
    t1: `${o.courseHtml},`, t2: o.t2,
    lede: o.lede,
    primary,
    secondary: '<a class="ch-ghost" href="learn.html">All units</a>',
    trust,
    card: startCard, cardId: `${P}Start`, panelExtra: review,
  });
  const strip = examStrip([
    { k: 'Section I', b: `${o.exam.mcq} questions`, s: `multiple choice${o.exam.mcqTime ? ` &middot; ${o.exam.mcqTime}` : ''}` },
    { k: 'Section II', b: `${o.exam.frq} free response`, s: o.exam.frqTime ? `written answers &middot; ${o.exam.frqTime}` : 'written answers' },
    { k: 'The question bank', b: `${o.nq.toLocaleString('en-US')} questions`, s: 'every option explained' },
    { k: 'Practice exams', b: 'Full length', s: `both sections, timed${freeExam ? ', one free' : ''}` },
  ], 'The exam');
  const steps = homeSteps([
    first
      ? { h: 'Learn a topic from scratch', p: `Start with ${esc(first.title.toLowerCase())}: a lesson that checks what you need first, then walks it one step at a time.`, href: `lessons/${first.id}.html`, go: 'Start the first lesson' }
      : { h: 'Pick a unit', p: 'Every notes page is free.', href: 'learn.html', go: 'See the units' },
    { h: 'Practice what you learned', p: `${app('practice') ? esc(app('practice').card) : 'Exam style questions.'}${o.dailyFree ? ` ${o.dailyFree} a day are free.` : ''}`, href: 'practice.html', go: 'Practice now' },
    { h: 'Sit a practice exam', p: app('exams') ? esc(app('exams').card) : 'Full timed practice exams.', href: 'exams.html', go: 'See the exams' },
  ], 'New to the course? Three steps, in this order.');
  let skill = 0;
  const freeIds = new Set((o.freeUnits || []).map((c) => c.id));
  const units = homeUnits({
    a: `${o.chapters.filter((c) => c.part === 'course').length} units,`, b: 'in order',
    lede: `Each unit's share of the exam, from the course framework. Every notes page is free${o.freeUnitsText ? `; the lessons in ${o.freeUnitsText} are free too` : ''}.`,
    units: o.chapters.map((ch) => {
      const n = o.topicsOf(ch.id).length, built = o.chapterBuilt(ch), isSkill = ch.part !== 'course';
      const w = Array.isArray(ch.weight) ? `${ch.weight[0]} to ${ch.weight[1]}%<small>of the exam</small>` : (isSkill ? `<small>${esc(o.partLabel[ch.part] || 'Skills')}</small>` : '');
      return {
        id: ch.id, num: isSkill ? `S${++skill}` : ch.n, title: ch.title, skill: isSkill,
        href: built ? `units/${ch.id}.html` : '',
        meta: `${n} topic${n === 1 ? '' : 's'}${built ? '' : ' &middot; coming soon'}`,
        weight: w, free: freeIds.has(ch.id) ? 'lessons free' : '',
      };
    }),
  });
  const frq = app('frq');
  const two = `<section class="ch-sec ch-two" aria-label="Notes and free response">
  <div class="ch-box ch-notes">
    <p class="ch-eye">Learn &middot; free forever</p>
    <h2>Every topic, <span>in notes</span></h2>
    <p>A free notes page for every topic, in framework order, with a printable sheet for each unit and a glossary of every term.</p>
    <ul class="ch-chips">${['flashcards', 'cram', 'justify'].map(app).filter(Boolean).map((a) => `<li><a href="${a.slug}.html">${esc(a.h1)}</a></li>`).join('')}<li><a href="glossary.html">Glossary</a></li></ul>
    <a class="ch-ghost" href="learn.html">Open the notes</a>
  </div>
  ${frq ? `<div class="ch-box ch-exam">
    <p class="ch-eye">Section II</p>
    <p class="ch-clock"><b>${o.exam.frq}</b><span>free response questions on the exam</span></p>
    <p>${esc(frq.card)}</p>
    <a class="ch-cta" href="frq.html">Try a free response</a>
    ${app('exams') ? `<p class="ch-small">${esc(app('exams').card)}</p>` : ''}
  </div>` : ''}
</section>`;
  const live = o.tools || [];
  const tools = homeTools({
    a: 'Tools that let you', b: 'see it happen', lede: app('tools') ? esc(app('tools').card) : '',
    allHref: 'tools.html',
    tools: live.slice(0, 6).map((t) => ({ href: `tools/${t.slug}.html`, name: t.name, desc: t.blurb, icon: o.toolIcon[t.slug] || o.toolIcon[t.kind] })),
  });
  return `<main id="main" class="xshell ${o.mainClass} ch-home" data-cover="${o.key}">
${hero}
${strip}
${steps}
${units}
${two}
${tools}
${o.sample || ''}
${homeDeal({ key: o.key, up: '../', freeCta: first ? `<a class="ch-ghost" href="lessons/${first.id}.html">Start the first lesson</a>` : '' })}
</main>`;
}

/* Free beside Premium, from assets/premium.js (scripts/lib/premium-data.mjs), with the founding price
   shown only until it ends (premium.js swaps data-founding-until / -after) and the refund line under
   the button. */
export function homeDeal({ key, up = '../', freeCta }) {
  const { COURSES, FOUNDING } = premiumData();
  const c = COURSES[key];
  if (!c) return '';
  const founding = FOUNDING && FOUNDING.until ? FOUNDING : null;
  const low = Math.min(...c.passes.map((p) => p.price));
  const pass = c.passes.find((p) => p.price === low);
  const from = c.passes.length > 1 ? 'From ' : '';
  const amt = founding
    ? `<span data-founding-until="${founding.until}">${from}${money(foundingPrice(low))} <s>${money(low)}</s></span><span data-founding-after="${founding.until}" hidden>${from}${money(low)}</span>`
    : `${from}${money(low)}`;
  const term = pass.until ? `One pass, good through ${longDate(pass.until)}, the end of the exam season.` : `One payment for ${pass.label.toLowerCase()}.`;
  const note = founding ? `<span data-founding-until="${founding.until}">Founding price until ${longDate(founding.until)}. </span>${term}` : term;
  const name = c.name.replace(/ Prep$/, '').replace(/&/g, '&amp;');
  // "Your progress, XP, streak..." describes the hub; the card keeps to what you study.
  const free = c.free.filter((x) => !/^Your progress/.test(x));
  return `<section class="ch-sec ch-deal" aria-labelledby="chDeal">
  <h2 id="chDeal" class="sr-only">Free and Premium</h2>
  <div class="ch-box ch-plan">
    <p class="ch-pill">Free</p>
    <h3>Everything to start</h3>
    <ul>${free.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    ${freeCta || ''}
  </div>
  <div class="ch-box ch-plan prem">
    <p class="ch-pill">Premium &middot; ${name}</p>
    <p class="ch-amt">${amt}</p>
    <p class="ch-note">${note}</p>
    <ul>${c.premium.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <a class="ch-cta gold" href="${up}premium.html#${key}">Get Premium for ${name}</a>
    <p class="ch-sure">Never renews. Full refund within 7 days.</p>
  </div>
</section>${founding ? `
<script>(function(){var n=Date.now(),d=document.getElementById('chDeal').parentNode;[].forEach.call(d.querySelectorAll('[data-founding-until]'),function(e){if(n>Date.parse(e.getAttribute('data-founding-until')+'T23:59:59Z'))e.hidden=true;});[].forEach.call(d.querySelectorAll('[data-founding-after]'),function(e){if(n>Date.parse(e.getAttribute('data-founding-after')+'T23:59:59Z'))e.hidden=false;});})();</script>` : ''}`;
}
