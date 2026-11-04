/* The course home, site redesign round 3 (docs/site-redesign.md, boards docs/redesign-r3/r10/boards/R10-Home-*):
   one layout for all thirteen courses, chosen by Olivier from twelve versions (V09b, "cover band").

   In order: the tall cover band (kicker, course name, two-tone headline, hand line, lede, buttons, pills,
   founder line, the cover drawing); "In this course" (the course map) beside a try-one question; the fact
   strip; the progress card (start or up next, review queue, today's goal or Daily Rounds, level, XP,
   streak and tracks); "The lead" (notes card, how this course works, exam card); the tools, each with its
   own cover (assets/covers/tools/<course>/); "Only in <course>"; Free beside Premium; the FAQ; the About
   row. Styles: assets/course/r3.css (shared with the round 3 inner pages). Words: scripts/lib/course-homes.json,
   exported from the board generator; prices and the free and Premium lists come live from assets/premium.js.

   The progress card keeps every id each course's home script fills (bio-home.js and its forks, anp-home.js,
   ochem-home.js, the NREMT page script), so a returning student's state appears exactly as before; the
   first-visit wording below is what a new visitor (or a reader with JavaScript off) sees. */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { premiumData, foundingPrice, money, longDate, SURE, dayAfterUS } from './premium-data.mjs';
import { loadVideos, displayTitle, clock, THUMB_DIR, THUMB_WIDTHS } from './videos.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DATA = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'course-homes.json'), 'utf8'));
const FOUNDER = DATA._founder;
const strip = (s) => String(s).replace(/<[^>]+>/g, '');
const attr = (s) => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/"/g, '&quot;');
const DIR = { nremt: 'nremt', ochem: 'ochem', anp: 'anatomy-physiology', apbio: 'bio', apchem: 'chem', apphys: 'physics', apcalc: 'calculus', apcalcbc: 'calculus-bc', apstat: 'statistics', apenv: 'environmental-science', appsych: 'psychology', apprecalc: 'precalculus', apmacro: 'macroeconomics' };

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
<h1 class="mast${/^\S{13,}$/.test(d.t2) ? ' mast-long' : ''}" id="r3Title">${d.t1}<span>${d.t2}</span></h1>
<p class="hand">${d.hand}</p>
<p class="lede">${String(ctx.lede || d.lede).split(/(?<=[.!?])\s+(?=[A-Z])/)[0]}</p>
<div class="hero-ctas"><a class="btn-chan" id="heroPrimaryCta" href="${ctx.primaryHref}">${d.btn1}</a>${ctx.primaryScript || ''}<a class="btn-ghost" href="${L.btn2 || '#try'}">${d.btn2}</a></div>
<a class="hero-continue" id="r3Resume" href="#" hidden><small>Pick up where you left off</small><b id="r3ResumeLabel"></b></a>
<script>try{var r=(JSON.parse(localStorage.getItem('levl_resume')||'{}')||{})[${JSON.stringify(key)}];if(r&&typeof r.url==='string'&&/^\\/[^\\/]/.test(r.url)){var a=document.getElementById('r3Resume');a.href=r.url;document.getElementById('r3ResumeLabel').textContent=r.label||'Your last page';a.hidden=false;}}catch(e){}</script>
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async" fetchpriority="high"></div></div></section>`;

  /* ---- In this course: the map, as a contents list ---- */
  const rows = [];
  const kind = d.map_kind;
  if (kind === 'domains') {
    (ctx.doms || d.doms).forEach(([n, desc, w, q, bar], i) => rows.push({ n: String(i + 1).padStart(2, '0'), b: n, small: `${desc} ${q} questions`, right: `${w}<small>of the exam</small>` }));
  } else if (kind === 'path') {
    const p = d.path;
    for (let g = 0; g < p.length; g += 5) {
      const grp = p.slice(g, g + 5), tops = grp.reduce((s, x) => s + x[2], 0);
      // No "Chapters 1 to 5" and no "27 topics": the ochem site rules keep chapter numbers and topic counts
      // out of the page text (scripts/check-site.mjs rules 30 and the count rule); the number column is the
      // first chapter's position, generated from curriculum.js by build-course-homes.mjs.
      const ord = ['First', 'Next', 'Then', 'Later', 'Last', 'More'][Math.min(5, g / 5)];
      const size = ['', 'one', 'two', 'three', 'four', 'five'][grp.length] || grp.length;
      rows.push({ n: String(grp[0][0]).padStart(2, '0'), b: `${ord} ${size} chapters`, small: `<span class="grp">${grp.map((x) => x[1]).join(', ')}</span>`,
        right: g === 0 ? `${tops}<small class="free">topics, the first four chapters free</small>` : `${tops}<small>topics</small>`, txt: true });
    }
  } else if (kind === 'parts') {
    for (const [name, lo, hi, meta] of d.parts) {
      const grp = d.chapters.filter((x) => x[0] >= lo && x[0] <= hi);
      const [nch, ntop] = meta.split(' · ');
      const first = name === 'Foundations';
      rows.push({ n: String(lo).padStart(2, '0'), b: name, small: `<span class="grp">Chapters ${lo} to ${hi}: ${grp.map((x) => x[1]).join(', ')}</span>`,
        right: `${ntop}<small${first ? ' class="free"' : ''}>${first ? 'Lessons free, start here' : nch}</small>`, txt: true });
    }
  } else {
    for (const [num, t, meta, w, free, sk] of d.units) {
      if (sk) rows.push({ n: num, b: t, small: `${meta}, a skills track`, right: 'Skills<small>alongside the units</small>', txt: true });
      else {
        const hi = +w.replace('%', '').split(' to ')[1];
        rows.push({ n: num.length > 1 ? num : String(+num).padStart(2, '0'), b: t, small: meta,
          right: `${w}${free ? '<small class="free">lessons free</small>' : '<small>of the exam</small>'}` });
      }
    }
  }
  const tocLinks = L.toc || [];
  const toc = rows.map((r, i) => {
    const inner = `<span class="n">${r.n}</span><span><b>${r.b}</b><small>${r.small}</small></span><span class="w${r.txt ? ' txt' : ''}">${r.right}</span>`;
    return `<li>${tocLinks[i] ? `<a href="${tocLinks[i]}">${inner}</a>` : `<div class="toc-row">${inner}</div>`}</li>`;
  }).join('');

  /* ---- ways to study: in place of the try one question (owner 2026-11-04: it was clutter). The three
     ways a student works outside the path, each to the course's own page. ---- */
  // The board's sample card still feeds the FAQ's "What kinds of questions are there?" answer.
  const s = { ...d.sample };
  const WAYS = [
    ['practice.html', 'Practice', 'Questions on any topic, and every answer explains why.', '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'],
    ['review.html', 'Review', 'What you missed comes back right before you would forget it.', '<path d="M3 12a9 9 0 019-9 9 9 0 017 3.4M21 12a9 9 0 01-9 9 9 9 0 01-7-3.4"/><path d="M21 3v4h-4M3 21v-4h4"/>'],
    ['exams.html', 'Exams', 'Timed and full length, like the real thing.', '<circle cx="12" cy="14" r="7"/><path d="M12 14V10.5M10 3h4M12 3v4M18.5 7.5l1.5-1.5"/>'],
  ];
  const ways = `<section class="ways" aria-labelledby="ways-h"><span class="pill">Ways to study</span><h2 id="ways-h">Pick how you <span>want to work</span></h2><ul>${WAYS.map(([href, name, line, ic]) =>
    `<li><a href="${href}"><span class="ic"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg></span><span class="tx"><b>${name}</b><small>${line}</small></span></a></li>`).join('')}</ul></section>`;

  const lead = `<div class="lead"><section class="contents" aria-labelledby="toc-h"><h2 id="toc-h">In this <span>course</span></h2><p class="sub">${String(d.map_lede).split(/(?<=\.)\s/)[0]}</p><ol class="toc">${toc}</ol></section>${ways}</div>`;

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
    return `<a href="${href}">${img}<span class="cmeta"><span class="cname">${nm}</span>${tag}</span><span class="cdesc">${desc}</span></a>`;
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

  /* ---- free and premium, from assets/premium.js ---- */
  const { COURSES, FOUNDING } = premiumData();
  const pc = COURSES[key];
  let deal = '';
  if (pc) {
    const founding = FOUNDING && FOUNDING.until ? FOUNDING : null;
    const low = Math.min(...pc.passes.map((x) => x.price));
    const pass = pc.passes.find((x) => x.price === low);
    const from = pc.passes.length > 1 ? 'From ' : '';
    const spans = (price) => (founding
      ? `<span data-founding-until="${founding.until}">${money(foundingPrice(price))}</span><span data-founding-after="${founding.until}" hidden>${money(price)}</span>`
      : money(price));
    const amt = `${from}${spans(low)}`;
    const term = pass.until ? `One pass, good through ${longDate(pass.until)}, the end of the exam season.` : `One payment for ${pass.label.toLowerCase()}.`;
    /* When the full price starts, never a struck-through price nobody has paid yet (owner 2026-10-28). */
    const note = founding ? `<span data-founding-until="${founding.until}">Founding price, ${money(low)} from ${dayAfterUS(founding.until)}. </span>${term}` : term;
    /* Unlock goes straight to checkout (owner 2026-10-28): premium.html?buy= opens the course there and starts
       checkout, or the one-step sign-in, at once. A second pass is one line under it. */
    const buyHref = (p) => `${up}premium.html?course=${key}&amp;buy=${p.id}`;
    const other = pc.passes.filter((x) => x !== pass);
    const buy = `<a class="btn-gold" href="${buyHref(pass)}">Unlock for ${spans(pass.price)}</a>` +
      other.map((x) => `<a class="plan__alt" href="${buyHref(x)}">Or a ${x.label.replace(/\s*\(.*\)$/, '').toLowerCase()} for ${spans(x.price)}</a>`).join('');
    const name = d.deal.name;
    const free = pc.free.filter((x) => !/^Your progress/.test(x));
    const esc = (t) => String(t).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/</g, '&lt;');
    const freeNote = d.trust && d.trust[0] === 'note' ? `<p class="freenote">${d.trust[1]}</p>` : '';
    deal = `<section class="home-deal" id="r3Deal" aria-label="Free and Premium">
    <div class="plan">
      <span class="pill">Free</span>
      <h3>Everything to start</h3>
      <p class="plan__note">Start now, with no card.</p>${freeNote}
      <ul>${free.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <a class="btn-ghost" href="${L.freeCta || ctx.primaryHref}">${d.deal.freecta}</a>
    </div>
    <div class="plan plan--premium">
      <span class="pill">Premium &middot; ${name}</span>
      <p class="plan__amt">${amt}</p>
      <p class="plan__note">${note}</p>
      <ul>${pc.premium.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      ${buy}
      <p class="plan__sure">${SURE}</p>
      <a class="plan__compare" href="${up}premium.html#${key}">Compare Free and Premium</a>
    </div>
  </section>${founding ? `
<script>(function(){var n=Date.now(),d=document.getElementById('r3Deal');[].forEach.call(d.querySelectorAll('[data-founding-until]'),function(e){if(n>Date.parse(e.getAttribute('data-founding-until')+'T23:59:59Z'))e.hidden=true;});[].forEach.call(d.querySelectorAll('[data-founding-after]'),function(e){if(n>Date.parse(e.getAttribute('data-founding-after')+'T23:59:59Z'))e.hidden=false;});})();</script>` : ''}`;
  }

  /* ---- FAQ ---- */
  const g = d.guide;
  const qa = [[d.covers_h, d.covers.join(' ')]];
  const gp = g.p ? `${g.p} ` : '';
  qa.push([g.h, `${gp}<a href="${L.guide}">${g.cta}</a>.<ul>${g.items.map((x) => `<li>${x}</li>`).join('')}</ul>`]);
  qa.push([s.legend_title || 'What kinds of questions are there?', `<ul class="legend">${s.legend.map(([a, b]) => `<li><i>${a}</i>${b}</li>`).join('')}</ul>${s.note || ''}`]);
  if (d.strip_note) qa.push(['Are the exam figures current?', d.strip_note]);
  if (d.beta) qa.push(['Has this course been reviewed?', `${d.beta_note} <a href="${up}about.html#report">Report a problem</a>.`]);
  qa.push(['Is this course free?', d.trust[0] === 'note' ? d.trust[1] : `All notes are free forever. ${d.deal.free[0]}.`]);
  qa.push(['Is LevlPrep affiliated with the exam?', d.foot.join(' ')]);
  qa.push(['Who makes LevlPrep?', `${FOUNDER} <a href="${up}about.html">Why I built it</a>. An independent project, not a company or a training program. Premium is an optional one-time pass, and <a href="${up}premium.html">what is free</a> is listed course by course. No ads.`]);
  qa.push(['How are the questions written?', `Every question in every course is original, written for LevlPrep with an explanation on each one. Automated checks look for answer-position and length tells. <a href="${up}sources.html">Sources and checks</a>.`]);
  qa.push(['How do I see what changed?', `Corrected questions, new lessons and site fixes are listed, dated, on <a href="${up}changelog.html">What&rsquo;s new</a>.`]);
  const faq = `<section class="home-faq" aria-labelledby="faq-h"><h2 id="faq-h">Questions</h2><div class="hub-faq">${qa.map(([q, a]) => `<details class="faq-item"><summary>${q}</summary><div class="ans">${a}</div></details>`).join('')}</div></section>`;

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

  return `<main id="main" class="r3 r3-home" data-cover="${key}">
${band}
<div class="hwrap">
${lead}
${facts}
${progress}
${media}
${deal}
${faq}
${about}
${sticky}
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
