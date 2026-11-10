/* The course home: one layout for all thirteen courses. Round 3 (docs/site-redesign.md) gave it the tall cover
   band; course redesign round 4 (docs/course-redesign-r4.md, decision 2; mockups docs/redesign-r4/mockups/Main and
   HomeReturning) made the guided path the home.

   In order: the cover band (kicker, two-tone course name, hand line, lede, the cover drawing; no buttons); two
   columns, the side column on the left (Up next, Create your personalized path or Your path, Course progress, Ways
   to study) and the path on the right, one section per course unit (assets/course/path.js draws the stops; the
   first paint comes from assets/path/<key>.json); the video lessons and the top three tools; then, only for a
   visitor without this course's Premium, the exam fact chips, the course's Premium card (the one on premium.html,
   scripts/lib/pricing-section.mjs) and the FAQ cut to four questions. On a phone the path comes first. Styles:
   assets/course/r3.css (band, ways, media, faq), assets/course/hub.css (the two columns, the unit sections' first
   paint, the Premium card) and assets/course/path.css (the stops, loaded with path.js). Words:
   scripts/lib/course-homes.json; prices from assets/premium.js.

   The hidden progress card keeps every id each course's home script fills (bio-home.js and its forks,
   anp-home.js, ochem-home.js, the NREMT page script), so those scripts run as before. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { premiumData } from './premium-data.mjs';
import { loadVideos, displayTitle, clock, THUMB_DIR, THUMB_WIDTHS } from './videos.mjs';
import { courseSection, SECTION_SCRIPT } from './pricing-section.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DATA = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'course-homes.json'), 'utf8'));
const strip = (s) => String(s).replace(/<[^>]+>/g, '');
const attr = (s) => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/"/g, '&quot;');
const DIR = { nremt: 'nremt', ochem: 'ochem', anp: 'anatomy-physiology', apbio: 'bio', apchem: 'chem', apphys: 'physics', apcalc: 'calculus', apcalcbc: 'calculus-bc', apstat: 'statistics', apenv: 'environmental-science', appsych: 'psychology', apprecalc: 'precalculus', apmacro: 'macroeconomics', apmicro: 'microeconomics', aphug: 'human-geography' };

/* The tool covers: index.json per course gives each cover's real tool title. */
function toolCovers(key) {
  const f = join(ROOT, 'assets/covers/tools', key, 'index.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : [];
}
const norm = (s) => strip(s).toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();
/* Match a tool named on the home ("Scenarios", "Drug Formulary") to its cover and page. */
function findTool(key, name, list) {
  const n = norm(name);
  const hit = list.find((t) => norm(t.name) === n) || list.find((t) => norm(t.name).startsWith(n) || n.startsWith(norm(t.name)))
    || list.find((t) => norm(t.name).split(' ')[0] === n.split(' ')[0]);
  return hit || null;
}

export function homeData(key) {
  const d = DATA[key];
  if (!d) throw new Error(`r3-home: no data for "${key}"`);
  return d;
}

/* ---- the path, as the home (course redesign r4, decision 2) ----
   The first paint of the path column and the side column, from assets/path/<key>.json (scripts/build-paths.mjs):
   one section per course unit (skills woven into the unit they sit in, as courseUnits() in assets/course/path.js
   does), the first one open, and the first stop in the side card. assets/course/path.js then draws the stops into
   the same sections from the student's own progress and path; without JavaScript each section links its first topic.
   Markup shared with path.js: .lp-u > summary.lp-uh (.n, .t small + b, .c), keep the two in step. */
const pad = (n) => String(n).padStart(2, '0');
export function unitNum(label, k) { const m = /^(?:Unit|Chapter) (\d+)$/.exec(label); return pad(m ? +m[1] : k + 1); }
function pathSkeleton(key, up, primaryHref) {
  const f = join(ROOT, 'assets/path', `${key}.json`);
  if (!existsSync(f)) return null;
  const D = JSON.parse(readFileSync(f, 'utf8'));
  // A course registered before its first unit is published has no stops yet (AP® Microeconomics, Phase 0).
  if (!D.topics.length) return null;
  // A course registered before any topic is published (Phase 0) has an empty path.
  if (!D.topics.length) return null;
  const T = D.topics.map((t, i) => ({ ...t, i }));
  const skill = (t) => D.units[t.u] && D.units[t.u].label === 'Skills';
  const cus = [];
  D.units.forEach((u, ui) => { if (u.label === 'Skills') return; const ts = T.filter((t) => t.u === ui); if (ts.length) cus.push({ u: ui, a: ts[0].i, b: ts[ts.length - 1].i }); });
  cus.sort((x, y) => x.a - y.a);
  cus.forEach((c, k) => { c.from = k ? cus[k - 1].b + 1 : 0; c.to = k < cus.length - 1 ? c.b : T.length - 1; });
  const tName = (t) => attr((t.n ? `${t.n} ` : '') + t.t).replace(/</g, '&lt;');
  const open = (t) => (t.l && t.f ? t.l : t.o || t.l);
  const units = cus.map((c, k) => {
    const u = D.units[c.u], ts = T.filter((t) => t.i >= c.from && t.i <= c.to), n = ts.filter((t) => !skill(t)).length || ts.length;
    // Ochem keeps chapter numbers out of the page text (check-site rule 30); path.js writes the kicker at runtime.
    const kick = key === 'ochem' ? '&nbsp;' : attr(u.label + (u.w ? ` · ${u.w} of the exam` : ''));
    return `<details class="lp-u" id="lpu-${k}"${k ? '' : ' open'}><summary class="lp-uh${k ? '' : ' cur'}"><span class="n">${unitNum(u.label, k)}</span><span class="t"><small>${kick}</small><b>${attr(u.title || u.label)}</b></span><span class="c">${n} topic${n > 1 ? 's' : ''}</span></summary><p class="lp-nojs"><a href="${open(ts[0])}">Start with ${tName(ts[0])}</a></p></details>`;
  }).join('');
  const t0 = T[0];
  const name = attr(D.name);
  const ret = `<script>try{if(localStorage.getItem(${JSON.stringify(`${key}_path_v1`)})||localStorage.getItem(${JSON.stringify(D.progress || 'x')}))document.getElementById('lpHome').classList.add('lp-ret')}catch(e){}</script>`;
  const side = `<div class="lp-card lp-selc lp-static" id="lpSel" aria-live="polite"><p class="lp-k">Up next</p><h3>${tName(t0)}</h3><div class="act"><a class="lp-btn gold" href="${open(t0) || primaryHref}">Start</a></div></div>
<div id="lpSetup" class="lp-static"><div class="lp-card lp-make"><h3>Create your <span>personalized path</span></h3><p>Three quick questions and it starts in the right place.</p><button type="button" class="lp-btn gold sm" data-act="setup">Create my path</button></div></div>
<div class="lp-card lp-map" id="lpMap" hidden></div>`;
  const path = `<div class="lp-card lp-phead"><div><span class="lp-pill">Your path</span><h2 class="lp-h2" id="lpTitle">The <span>path</span> through ${name}</h2><p class="lp-p" id="lpSub">Every lesson, skill, practice set and unit test, in course order.</p></div><button type="button" class="lp-all" data-act="allunits" aria-pressed="false">Show every unit</button></div>
<div id="lpUnits">${units}</div>
<p class="lp-hand lp-tnote">jump anywhere, everything you finish stays done</p>
<p class="lp-note">Finishing a lesson or marking a stop done moves the path; practice answers do not. Your path&rsquo;s answers are saved on this device; what you finish counts everywhere you are logged in.</p>`;
  return { side, path, ret };
}

/* ctx (from the builder): {
     up: '../',                                   path to the site root
     hooks: { kind: 'ap'|'nremt'|'ochem', prefix } which ids the home script fills
     primaryHref, primaryScript                   the main button's target and its pending script
     links: { btn2, btn3, notes, exam, steps: [3], toc: [..], chips: [..], tryMore, freeCta, extras: [..] }
     tools: [{ slug, name, href }]                 the course's published tools, to link and find covers
     parts: [part ids in order]                    AP® and A&P track bars
     doms: [[name, desc, weight, count, bar]]       NREMT counts from the bank
     lede, strip                                   overrides when the builder counts them
   } */
export function r3HomeMain(key, ctx) {
  const d = homeData(key);
  const up = ctx.up ?? '../';
  const L = ctx.links || {};
  const covers = toolCovers(key);
  const coverFor = (name, slug) => (slug && covers.find((c) => c.slug === slug)) || covers.find((c) => norm(c.title) === norm(name))
    || covers.find((c) => norm(c.title).startsWith(norm(name)) || norm(name).startsWith(norm(c.title)));
  const tools = ctx.tools || [];

  /* ---- cover band ---- */
  const beta = ''; // the Beta label is gone (Olivier, 2026-10-26)
  const band = `<section class="band" aria-labelledby="r3Title"><div class="hwrap"><div>
<p class="issue">${d.pill}${beta} <i></i> ${d.note}</p>
<h1 class="mast${[d.t1, d.t2].some((w) => /\S{13,}/.test(String(w || '').replace(/<[^>]*>|&[a-z]+;/g, ''))) ? ' mast-long' : ''}" id="r3Title">${d.t1}<span>${d.t2}</span></h1>
<p class="hand">${d.hand}</p>
<p class="lede">${String(ctx.lede || d.lede).split(/(?<=[.!?])\s+(?=[A-Z])/)[0]}</p>
<a class="hero-continue" id="r3Resume" href="#" hidden><small>Pick up where you left off</small><b id="r3ResumeLabel"></b></a>
<script>try{var r=(JSON.parse(localStorage.getItem('levl_resume')||'{}')||{})[${JSON.stringify(key)}];if(r&&typeof r.url==='string'&&/^\\/[^\\/]/.test(r.url)){var a=document.getElementById('r3Resume');a.href=r.url;document.getElementById('r3ResumeLabel').textContent=r.label||'Your last page';a.hidden=false;}}catch(e){}</script>
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async" fetchpriority="high"></div></div></section>`;

  /* ---- ways to study: in place of the try one question (owner 2026-11-04: it was clutter). The three
     ways a student works outside the path, each to the course's own page. ---- */
  const WAYS = [
    ['practice.html', 'Practice', 'Questions on any topic, and every answer explains why.', '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'],
    ['review.html', 'Review', 'What you missed comes back right before you would forget it.', '<path d="M3 12a9 9 0 019-9 9 9 0 017 3.4M21 12a9 9 0 01-9 9 9 9 0 01-7-3.4"/><path d="M21 3v4h-4M3 21v-4h4"/>'],
    ['exams.html', 'Exams', 'Timed and full length, like the real thing.', '<circle cx="12" cy="14" r="7"/><path d="M12 14V10.5M10 3h4M12 3v4M18.5 7.5l1.5-1.5"/>'],
  ];
  const ways = `<section class="ways" aria-labelledby="ways-h"><span class="pill">Ways to study</span><h2 id="ways-h">Pick how you <span>want to work</span></h2><ul>${WAYS.map(([href, name, line, ic]) =>
    `<li><a href="${href}"><span class="ic"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg></span><span class="tx"><b>${name}</b><small>${line}</small></span></a></li>`).join('')}</ul></section>`;

  /* ---- fact strip ---- */
  const facts = `<div class="fact-row" aria-label="${d.strip_label}">${(ctx.strip || d.strip).map(([, b, st]) => `<span><span class="dot"></span><span><b>${b}</b> ${st}</span></span>`).join('')}</div>${d.strip_note ? `<p class="fact-note">${d.strip_label}. ${d.strip_note}</p>` : ''}`;

  /* ---- progress card ---- */
  const H = ctx.hooks;
  const id = (ap, nr, oc) => (H.kind === 'ap' ? `${H.prefix}${ap}` : H.kind === 'nremt' ? nr : oc);
  const [k1, h1, p1, go1] = d.start, [rk, rh, rp, rgo] = d.review, [dk, dh, dp, dgo] = d.daily;
  const [lvTitle, tracks, empty] = d.level;
  let split = '';
  if (H.kind === 'ap' && tracks && tracks.length) {
    split = `<div class="hub-split">${tracks.map((t, i) => `<span class="trk">${t}<i class="trk-bar" aria-hidden="true"><b data-part-bar="${(ctx.parts || [])[i] || ''}" style="width:0%"></b></i><em data-part-pct="${(ctx.parts || [])[i] || ''}">0%</em></span>`).join('')}</div>`;
  } else if (H.kind !== 'ap') {
    split = `<div class="hub-tracks" id="${H.kind === 'nremt' ? 'heroDomains' : 'heroModules'}"><p class="hp-note">${empty}</p></div>`;
  }
  const startHref = ctx.primaryHref;
  const reviewHref = L.review || 'review.html';
  const goalHref = L.goal || 'practice.html';
  const reviewHead = H.kind === 'ochem' ? 'h3' : 'h2';
  const progress = `<div class="r3-progress" hidden>
    <div class="hub-progress-card" id="${id('Level', 'heroProgress', 'heroProgress')}">
      <div class="hub-progress-top">
        <span class="hub-level-ring" id="${id('LvRing', 'heroLevelRing', 'heroLevelRing')}" aria-hidden="true">L1</span>
        <div><p class="hub-level-title" id="${id('LvTitle', 'heroLevelTitle', 'heroLevelTitle')}">${lvTitle}</p><p class="hub-level-sub"><span id="${id('LvSub', 'heroLevelSub', 'heroLevelSub')}">Level 1 &middot; 0 XP</span> &middot; <span id="${id('XpLabel', 'heroXpLabel', 'heroXpLabel')}">0 / 100 XP to Level 2</span>. One level and one streak count across every LevlPrep course.</p></div>
        <span class="hub-streak" id="${id('Streak', 'heroStreak', 'heroStreak')}" hidden><b id="${id('StreakN', 'heroStreakCount', 'heroStreakCount')}">0</b>-day streak</span>
      </div>
      <div class="hub-track" aria-hidden="true"><div class="hub-fill" id="${id('XpFill', 'heroXpFill', 'heroXpFill')}" style="width:2%"></div></div>
      ${split}
      <div class="hub-continue">
        <div class="first" id="${id('Start', 'nrStart', 'homeResume')}"><div class="k">${k1}</div><${reviewHead}>${h1}</${reviewHead}><p>${p1}</p><a class="btn-press" href="${startHref}">${go1}</a></div>
        <div id="${id('Review', 'nrReview', 'homeReview')}"><div class="k">${rk}</div><${reviewHead}>${rh}</${reviewHead}><p>${rp}</p><a class="link-quiet" href="${reviewHref}">${rgo}</a></div>
        <div id="${id('Goal', 'nrGoal', 'homeNext')}"><div class="k">${dk}</div><${reviewHead}>${dh}</${reviewHead}><p>${dp}</p><a class="link-quiet" href="${goalHref}">${dgo}</a></div>
      </div>
    </div>
  </div>`;

  /* ---- the lead: notes, how it works, exam ---- */
  const n = d.notes, e = d.exam;
  const chips = n.chips.map(([t, sub], i) => {
    const inner = `${t}${sub ? `<i>${sub}</i>` : ''}`;
    return (L.chips || [])[i] ? `<a href="${L.chips[i]}">${inner}</a>` : `<span>${inner}</span>`;
  }).join('');
  const notesCard = `<div class="ccard"><a class="cover" href="${L.notes}" data-cover="${key}" tabindex="-1" aria-hidden="true"><img src="${up}assets/covers/${key}.svg" alt="" width="640" height="320" loading="lazy" decoding="async"><span class="cv-t"><b>${n.h[0]}<span>${n.h[1]}</span></b><em>${n.eye}</em></span></a>
    <span class="cmeta"><a class="cname" href="${L.notes}">${n.cta}</a><span class="tag free">Free forever</span></span>
    <span class="cdesc">${n.p}</span><span class="chiprow">${chips}</span></div>`;
  const steps = d.steps.map(([a, b, g], i) => `<div class="step"><span class="n">${i + 1}</span><h3>${a}</h3><p>${b} <a class="go" href="${(L.steps || [])[i]}">${g}</a></p></div>`).join('');
  const examCard = `<a class="ccard" href="${L.exam}"><span class="clock"><b>${e.big}</b><span>${e.bigs}</span></span><span class="cmeta"><span class="cname">${e.cta}</span><span class="tag">${e.eye}</span></span><span class="cdesc">${e.p}${e.small ? ` ${e.small}` : ''}</span></a>`;
  const story = `<p class="kicker">The lead <i></i></p><section class="story" aria-label="Notes, exams and how this course works">${notesCard}<div class="col"><h3>How this course works</h3>${steps}${examCard}</div></section>`;

  /* ---- tools, each with its own cover ---- */
  const toolRow = ([nm, desc, t]) => {
    const tool = findTool(key, nm, tools);
    const cv = coverFor(nm, tool && tool.slug);
    const href = tool ? tool.href : (L.tools || 'tools.html');
    const tag = t ? `<span class="tag ${t === 'free' ? 'free' : 'prem'}">${t === 'free' ? 'Free' : 'Premium'}</span>` : '';
    const img = cv ? `<span class="tc"><img src="${up}assets/covers/tools/${key}/${cv.file ? cv.file.split('/').pop() : `${cv.slug}.svg`}" alt="" width="640" height="320" loading="lazy" decoding="async"></span>` : '';
    // No description line on the tool cards (owner, r4 decisions 2 and 6).
    void desc;
    return `<a href="${href}">${img}<span class="cmeta"><span class="cname">${nm}</span>${tag}</span></a>`;
  };
  const th = Array.isArray(d.tools_h) ? `${d.tools_h[0]} ${d.tools_h[1]}` : (d.trainh || d.tools_h).replace(/\.$/, '');
  const also = ''; void (d.tools_also || []).map(([h, xs]) => `<p class="also-line"><b>${h}:</b> ${xs.map((x) => { const t = findTool(key, x, tools); return t ? `<a href="${t.href}">${x}</a>` : x; }).join(', ')}</p>`).join('');
  const credit = d.tool_credit ? `<p class="credit">${d.tool_credit.replace(/<a href="#">Life Science/g, '<a href="https://lifesciencedb.jp/bp3d/" rel="noopener">Life Science').replace(/<a href="#">CC BY-SA/g, '<a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" rel="noopener">CC BY-SA')}</p>` : '';
  /* The home shows the course's three lead tools and links to the rest (Olivier, 2026-10-26: "you dont need
     to show all tools just the top 3 best ones and then the link to all tools"). The full list, its intro and
     the extra tool lines live on the Tools page. */
  const top = d.tools.slice(0, 3);
  const allN = d.tools.length;
  const toolsMore = `<a class="go" href="${L.tools || 'tools.html'}">${allN > 3 ? `All ${allN} tools` : 'All tools'} &rarr;</a>`;

  /* ---- only in this course ---- */
  const xs = d.extras.map((x, i) => {
    const href = (L.extras || [])[i];
    if (x.kind === 'feature') {
      const cv = coverFor('Body Map', 'body-map');
      return `<div class="feat"><div><span class="cname">${x.h}</span><p class="cdesc">${x.p}</p><a class="btn-gold" href="${href}">${x.cta}</a></div>${cv ? `<div class="fig tcfig" aria-hidden="true"><img src="${up}assets/covers/tools/${key}/${cv.slug}.svg" alt="" width="640" height="320" loading="lazy" decoding="async"></div>` : ''}</div>`;
    }
    if (x.kind === 'list') {
      const items = x.items.map((it, j) => { const h2 = (L.extraItems || [])[j]; return `<li>${h2 ? `<a href="${h2}">${it}</a>` : it}</li>`; }).join('');
      return `<div class="ccard xcard"><span class="cmeta"><span class="cname">${x.h}</span></span><span class="cdesc">${x.p}</span><ul class="mlist">${items}</ul>${href ? `<a class="go" href="${href}">${x.cta} &rarr;</a>` : ''}</div>`;
    }
    return href ? `<a class="ccard" href="${href}"><span class="cmeta"><span class="cname">${x.h}</span></span><span class="cdesc">${x.p}</span></a>`
      : `<div class="ccard"><span class="cmeta"><span class="cname">${x.h}</span></span><span class="cdesc">${x.p}</span></div>`;
  });
  /* The "Only in this course" band is left off the home (Olivier, 2026-10-26: "doesnt feel needed since the
     tools are right above"): every item in it is a tool or a page the Tools page and the course nav already link.
     The data stays in course-homes.json in case a course wants it back. */
  void xs;
  const extras = '';

  /* ---- the course's Premium card, the one on the Premium page (scripts/lib/pricing-section.mjs), shown open ---- */
  const { COURSES } = premiumData();
  const prem = COURSES[key] ? `<section class="lp-prem" aria-labelledby="pp-${key}">${courseSection(key, { up, open: true, start: ctx.primaryHref, source: 'course-home', h: 'h2' })}</section>${SECTION_SCRIPT}` : '';

  /* ---- FAQ: the four questions Olivier kept for the home (course redesign r4, decision 2), the rest on About ---- */
  const AP = /^ap/.test(key);
  const qa = [];
  qa.push(['Is this course free?', d.trust[0] === 'note' ? d.trust[1] : `All notes are free forever. ${d.deal.free[0]}.`]);
  qa.push([AP || key === 'nremt' ? 'What&rsquo;s on the exam?' : 'What does the course cover?', d.covers.join(' ')]);
  if (d.beta) qa.push(['Has it been reviewed?', `${d.beta_note} <a href="${up}about.html#report">Report a problem</a>.`]);
  qa.push([AP ? 'Is LevlPrep affiliated with the College Board?' : 'Is LevlPrep affiliated with the exam?', d.foot.join(' ')]);
  const faq = `<section class="home-faq" aria-labelledby="faq-h"><h2 id="faq-h">Questions</h2><div class="hub-faq">${qa.map(([q, a]) => `<details class="faq-item"><summary>${q}</summary><div class="ans">${a}</div></details>`).join('')}<p class="lp-faqmore">More questions, about who makes LevlPrep and how the questions are written, are answered on <a href="${up}about.html">About</a>.</p></div></section>`;

  /* Who makes this, how the questions are written and what changes are FAQ items now, not a row of cards
     (Olivier, 2026-10-26: "these are all also questions that could just be added to the question thing above"). */
  const about = '';

  const sticky = `<div class="sticky-cta"><a class="btn-chan" href="${ctx.primaryHref}">${d.btn1}</a></div>`;

  /* ---- watch the lessons: the course's videos from docs/videos.json, newest first, at most 3. Each is
     the same-origin thumbnail linking to its notes page (where the click-to-load player is), never an
     iframe. Nothing when the course has no video yet. scripts/add-video.mjs reruns the home builders. ---- */
  const vids = (ctx.videos || loadVideos().data.videos || []).filter((v) => v.course === key)
    .sort((a, b) => String(b.posted).localeCompare(String(a.posted))).slice(0, 3);
  /* The newest video and the top three tools share one row, so neither leaves a half-empty row
     (owner 2026-11-02: no empty space). Every video is still on its notes page and the channel. */
  const vcards = vids.map((v) => {
    const page = (v.pages || []).find((p) => /\/notes\//.test(p)) || v.pages[0];
    const t = displayTitle(v);
    const srcset = THUMB_WIDTHS.map((w) => `${up}${THUMB_DIR}/${v.id}-${w}.webp ${w}w`).join(', ');
    return `<a class="vcard" href="${up}${page}"><span class="vthumb"><img src="${up}${THUMB_DIR}/${v.id}-480.webp" srcset="${srcset}" sizes="(max-width: 760px) 100vw, 340px" width="1280" height="720" alt="" loading="lazy" decoding="async"><span class="vplay" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" focusable="false"><path d="M8 5.5v13l10.5-6.5z"/></svg></span><span class="vlen">${clock(v.seconds)}</span></span><span class="vtitle">${attr(t).replace(/</g, "&lt;")}</span><span class="vmeta">Video lesson &middot; ${Math.max(1, Math.round(v.seconds / 60))} min</span></a>`;
  }).join('');
  /* Owner 2026-11-03: videos and tools in their own rows again (up to three videos, then three tools), each
     with a plain heading and its "all" link, no kicker rule. */
  const media = (vids.length ? `<section class="media" aria-labelledby="media-v"><div class="media-h"><h2 id="media-v">Video <span>lessons</span></h2><p><a class="go" href="https://www.youtube.com/@LevlPrep">All videos &rarr;</a></p></div><div class="vstrip">${vcards}</div></section>` : '')
    + `<section class="media" aria-labelledby="media-t"><div class="media-h"><h2 id="media-t">Tools</h2><p>${toolsMore}</p></div><div class="dept">${top.map(toolRow).join('')}</div>${credit}</section>`;

  const P = pathSkeleton(key, up, ctx.primaryHref);
  const home = P ? `<div class="lp-home" id="lpHome">${P.ret}
<aside class="lp-hside" aria-label="Your next step and ways to study">
${P.side}
${ways}
</aside>
<section class="lp-hpath" id="levlPath" aria-labelledby="lpTitle">
${P.path}
</section>
</div>` : `<div class="lead">${ways}</div>`;
  /* Only for a visitor without this course's Premium (owner, r4 decision 2): the exam facts, the Premium card and
     the FAQ. premium.js says who has a pass; until it has loaded they show, as for every new visitor. */
  const npScript = `${ctx.premiumLoaded ? '' : `<script src="${up}assets/premium.js" defer></script>`}<script>document.addEventListener('DOMContentLoaded',function(){var P=window.LevlPremium,k=${JSON.stringify(key)};var s=document.querySelector('.lp-prem summary');if(s){s.tabIndex=-1;s.addEventListener('click',function(e){e.preventDefault();});}if(P&&P.onChange)P.onChange(function(){var on=P.launched(k)&&P.has(k);[].forEach.call(document.querySelectorAll('[data-np]'),function(e){e.hidden=on;});});});</script>`;

  return `<main id="main" class="r3 r3-home" data-cover="${key}">
${band}
<div class="hwrap">
${home}
${progress}
${media}
<div class="lp-np" data-np>
${facts}
${prem}
${faq}
</div>
${about}
${sticky}
${npScript}
</div>
</main>`;
}

/* Read the question out of a builder's sample card markup (homeSample in the AP® and A&P builders):
   stem, options, the right index, the explanation and the lesson link under it. */
export function parseSample(html) {
  if (!html) return null;
  const q = (html.match(/class="qtext"[^>]*>([\s\S]*?)<\/p>/) || [])[1];
  if (!q) return null;
  const opts = [...html.matchAll(/<button[^>]*class="qopt"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => m[1].replace(/<span class="letter">[^<]*<\/span>\s*/, '').trim());
  const ok = +((html.match(/data-correct="(\d+)"/) || [])[1] || 0);
  const key = (html.match(/sample-key"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1] || '';
  const why = key.replace(/^<b>[\s\S]*?<\/b>\s*/, '');
  const m = html.match(/sample-more"><a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)\s*(?:&rarr;|→)?\s*<\/a>/);
  return { q, opts, ok, why, moreHref: m ? m[1] : '', more: m ? m[2].trim() : '' };
}

export { DIR };
