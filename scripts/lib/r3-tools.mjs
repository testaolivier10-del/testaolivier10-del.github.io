/* Tools, site redesign round 3 (docs/site-redesign.md, boards docs/redesign-r3/r10/boards/R10-Tools*, R10-Tool*):
   the tools hub of every course and the opener of every tool page, in the shared round 3 system
   (assets/course/r3.css, scoped to .r3, course colour per data-cover) plus assets/course/r3-tools.css.

   Every tool has its own cover (assets/covers/tools/<course>/<slug>.svg; index.json gives its title and order).

   - toolsHubMain(o): the hub's <main>: the small inner band (round 4: course, "Tools", the count), then the Free and
     Premium groups, each in a card, of tool cards led by their covers. The cards keep the hooks the courses' hub scripts fill: data-tool / data-premium on the
     link, .cx-tool-top (the Premium pill goes in it) and .cx-tool-status ("Not tried yet" or accuracy).
   - toolBand(o): the short cover band at the top of a tool page, with the tool's own cover. It sits before the
     tool, outside <main>, so the Tool Studio (assets/course/tool-studio.js) mounts after it. On a desktop the
     studio keeps the site header, the course tabs and this band above the tool; on a phone the band is hidden and
     the tool takes the whole screen, as before (assets/course/r3-tools.css). */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const COURSE_DIR = { nremt: 'nremt', ochem: 'ochem', anp: 'anatomy-physiology', apbio: 'bio', apchem: 'chem', apphys: 'physics', apcalc: 'calculus', apcalcbc: 'calculus-bc', apstat: 'statistics', apenv: 'environmental-science', appsych: 'psychology', apprecalc: 'precalculus', apmacro: 'macroeconomics', aphug: 'human-geography' };
export const COURSE_SHORT = { nremt: 'NREMT-EMT', ochem: 'Organic Chemistry', anp: 'Anatomy &amp; Physiology', apbio: 'AP&reg; Biology', apchem: 'AP&reg; Chemistry', apphys: 'AP&reg; Physics 1', apcalc: 'AP&reg; Calculus AB', apcalcbc: 'AP&reg; Calculus BC', apstat: 'AP&reg; Statistics', apenv: 'AP&reg; Environmental Science', appsych: 'AP&reg; Psychology', apprecalc: 'AP&reg; Precalculus', apmacro: 'AP&reg; Macroeconomics', aphug: 'AP&reg; Human Geography' };

const esc = (s) => String(s ?? '').replace(/&(?![a-z]+;|#\d+;|#x[0-9a-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const covers = new Map();
export function toolCovers(key) {
  if (!covers.has(key)) {
    const f = join(ROOT, 'assets/covers/tools', key, 'index.json');
    covers.set(key, existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : []);
  }
  return covers.get(key);
}
export function toolCover(key, slug) {
  return toolCovers(key).find((t) => t.slug === slug) || null;
}
/* up: path from the page to the site root ('../' from a course page, '../../' from a tool under tools/). */
export const coverSrc = (key, slug, up) => `${up}assets/covers/tools/${key}/${slug}.svg`;

/* The stylesheets a round 3 tools page needs, after the page's own. */
export const r3ToolsCss = (up) => `<link rel="stylesheet" href="${up}assets/course/r3.css">\n<link rel="stylesheet" href="${up}assets/course/r3-tools.css">`;

/* "Hardy-Weinberg and genetic drift" -> plain "Hardy-Weinberg and", course colour "genetic drift". */
export function twoTone(title) {
  const w = String(title).trim().split(/\s+/);
  if (w.length < 2) return esc(title);
  const cut = w.length === 2 ? 1 : Math.ceil(w.length / 2);
  return `${esc(w.slice(0, cut).join(' '))} <span>${esc(w.slice(cut).join(' '))}</span>`;
}

const crumbHtml = (crumbs) => crumbs && crumbs.length ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => (i ? ' <span aria-hidden="true">&rsaquo;</span> ' : '') + (c.href ? `<a href="${c.href}">${c.name}</a>` : `<span aria-current="page">${c.name}</span>`)).join('')}</nav>` : '';

/* The short cover band. o: { kicker, note, h1 (html, two-tone), hand, lede, cta: {href,label}, cta2: {href,label},
   art (html), crumbs: [{name, href}], id } */
export function bandShort(o) {
  const ctas = [o.cta && `<a class="btn-chan" href="${o.cta.href}">${o.cta.label}</a>`, o.cta2 && `<a class="btn-ghost" href="${o.cta2.href}">${o.cta2.label}</a>`].filter(Boolean).join('');
  return `<section class="band short"${o.id ? ` id="${o.id}"` : ''} aria-labelledby="${o.hid || 'r3Title'}"><div class="hwrap"><div>
${crumbHtml(o.crumbs)}
<p class="issue">${o.kicker} <i></i>${o.note ? ` ${o.note}` : ''}</p>
<h1 class="deck" id="${o.hid || 'r3Title'}">${o.h1}</h1>
${o.hand ? `<p class="hand">${o.hand}</p>` : ''}
${o.lede ? `<p class="lede">${o.lede}</p>` : ''}
${ctas ? `<div class="hero-ctas">${ctas}</div>` : ''}
</div>${o.art ? `<div class="art${o.artClass ? ` ${o.artClass}` : ''}" aria-hidden="true">${o.art}</div>` : ''}</div></section>`;
}

/* One tool card. t: { key, up, slug, href, name, desc, foot, premium (bool), attrs, status (bool) }
   Round 4 (owner 2026-11-05, docs/course-redesign-r4.md decision 6): no description line; t.desc is kept in the
   builders' lists (the tool pages and search still use it) but the card shows cover, name, badge, status and Open. */
/* Owner 2026-11-03: no topic or skill label under a tool (the name already says what it is). Only an item count
   the hub script updates (.cx-tool-count) stays. */
function toolFoot(f) { const m = /<span class="cx-tool-count">[\s\S]*?<\/span><\/span>|<span class="cx-tool-count">[\s\S]*?<\/span>/.exec(f || ''); return m ? m[0] : ''; }
export function toolCard(t) {
  const has = t.slug && toolCover(t.key, t.slug);
  const cover = has ? `<span class="tc" aria-hidden="true"><img src="${coverSrc(t.key, t.slug, t.up)}" alt="" width="640" height="320" loading="lazy" decoding="async"></span>` : '';
  return `<li><a class="cx-tool r3-tool" href="${t.href}"${t.attrs || ''}>${cover}<span class="cx-tool-top"><span class="cx-tool-name">${esc(t.name)}</span>${t.free ? '<span class="tag free">Free</span>' : ''}</span>${t.status ? '<span class="cx-tool-status"></span>' : ''}<span class="cx-tool-foot"><span>${toolFoot(t.foot)}</span><span class="cx-tool-go">Open <span aria-hidden="true">&rarr;</span></span></span></a></li>`;
}

/* The hub's <main>. o: {
     key, up ('../'), hand (the sub line after the count), sub (html, replaces the whole sub line),
     featured: { slug, href, name, kick, hand, desc, cta, credit (html) } | null,
     featHtml (html, replaces featured), before (html, opens the first card), status (cards get a .cx-tool-status),
     groups: [{ h (html), p, kick, big, cards: [toolCard input] }], note (html), mountClass, mountAttrs, after (html),
     pass (html course name): regroup the cards as Free / With Premium (byAccess; every hub does) } */
/* One grouping on every course's tools hub (consistency audit 2026-11, C5): the tools a free student can open now,
   then the ones that come with Premium, each headed by its count, so the counts always add up to the band's
   "N tools". The cards keep the order the builder gave. A free card needs no "Free" tag under the "Free" heading. */
function byAccess(groups, pass) {
  const cards = groups.flatMap((g) => g.cards);
  const free = cards.filter((c) => c.free).map((c) => ({ ...c, free: false }));
  const paid = cards.filter((c) => !c.free);
  return [
    { h: 'Free', kick: `Free &middot; ${free.length}`, p: 'Open any of these now.', label: 'Free tools', cards: free },
    { h: 'With Premium', kick: `With Premium &middot; ${paid.length}`, p: `Part of the ${pass} pass.`, label: 'Premium tools', cards: paid },
  ].filter((g) => g.cards.length);
}

export function toolsHubMain(o) {
  if (o.pass) o = { ...o, groups: byAccess(o.groups, o.pass) };
  const up = o.up ?? '../';
  const total = o.groups.reduce((n, g) => n + g.cards.length, 0) + (o.featured || o.featHtml ? 1 : 0);
  /* Round 4 (docs/course-redesign-r4.md decision 3): the small inner band, issue line with the course name, the title
     "Tools" and one sub line (the tool count, then the hub's own hand line); no buttons, no breadcrumb (the course
     tabs say where you are). */
  const sub = o.sub || `${total} tool${total === 1 ? '' : 's'}${o.hand ? ` &middot; ${o.hand}` : ''}`;
  const band = `<section class="band short" aria-labelledby="r3Title"><div class="hwrap"><div>
<p class="issue">${COURSE_SHORT[o.key]} <i></i></p>
<h1 class="deck" id="r3Title">Tools</h1>
<p class="lede">${sub}</p>
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${o.key}.svg" alt="" width="640" height="400" decoding="async"></div></div></section>`;
  const f = o.featured;
  const feat = o.featHtml ? o.featHtml : f ? `<p class="kicker">${f.kick || 'Featured tool'} <i></i></p>
<div class="feat r3-feat"><div><h2 class="cname">${esc(f.name)}</h2>${f.hand ? `<p class="hand">${f.hand}</p>` : ''}<p class="cdesc">${f.desc}</p><a class="btn-gold" href="${f.href}">${f.cta} &rarr;</a>${f.credit ? `<p class="credit">${f.credit}</p>` : ''}</div><a class="fig tcfig" href="${f.href}" tabindex="-1" aria-hidden="true"><img src="${coverSrc(o.key, f.slug, up)}" alt="" width="640" height="320" decoding="async"></a></div>` : '';
  /* Each group sits in a card (decision 6) so the first can overlap the band's foot (.lap, assets/course/r3.css).
     What came before the groups (a filter bar, a noscript note, a featured tool) opens the first card. */
  const lead = `${o.before || ''}${feat}`;
  const groups = o.groups.map((g, i) => {
    const cards = g.cards.map((c) => toolCard({ key: o.key, up, status: o.status, ...c })).join('');
    const head = g.big
      ? `<div class="ruled-h r3-tools-h"><h2>${g.h}</h2>${g.p ? `<p>${g.p}</p>` : ''}</div>`
      : `<p class="kicker">${g.kick || g.h} <i></i></p>${g.p ? `<p class="r3-tools-p">${g.p}</p>` : ''}`;
    return `<section class="r3-tools-group r3-tools-card${i ? '' : ' lap'}" aria-label="${esc(String(g.label || g.h).replace(/<[^>]+>/g, ''))}">${i ? '' : lead}${head}<ul class="r3-tool-grid">${cards}</ul></section>`;
  }).join('\n');
  return `<main id="main" class="r3 r3-tools" data-cover="${o.key}">
${band}
<div class="hwrap r3-tools-body"><div id="${o.mountId || 'app'}" class="${o.mountClass || ''}" data-slug="tools"${o.mountAttrs || ''}>
${groups || lead}
${o.note ? `<p class="r3-tools-note">${o.note}</p>` : ''}
</div>${o.after || ''}</div>
</main>`;
}

/* Put a round 3 <main> into a page a builder made: replaces its <main id="main" ...>...</main> and adds the round 3
   sheets after the page's last stylesheet in <head>. */
export function swapMain(page, main, up) {
  const a = page.indexOf('<main id="main"'), b = page.indexOf('</main>', a);
  if (a < 0 || b < 0) throw new Error('r3-tools: no <main id="main"> in the page');
  let out = page.slice(0, a) + main + page.slice(b + 7);
  if (!out.includes('assets/course/r3-tools.css')) out = out.replace('</head>', `${r3ToolsCss(up)}\n</head>`);
  return out;
}

/* The AP® courses' tools hub (the six AP® builders): one shape for all, from the builder's own tool list.
   o: { key, up, courseName (html), lede, groups: [{ h, p, tools: [{ slug, name, blurb, premium, foot }] }],
        mountClass, note } */
export function apToolsHubMain(o) {
  return toolsHubMain({
    key: o.key, up: o.up, status: true, mountClass: o.mountClass, pass: o.courseName,
    hand: 'every tool ends in questions',
    groups: o.groups.filter((g) => g.tools.length).map((g) => ({
      h: g.h, kick: `${esc(g.h)} &middot; ${g.tools.length}`, p: g.p, label: g.h,
      // A tool may link elsewhere (AP® Calculus BC links AB's trainers: t.href, t.attrs) and keep that
      // course's cover (t.coverKey).
      cards: g.tools.map((t) => ({ ...(t.coverKey ? { key: t.coverKey } : {}), slug: t.slug, href: t.href || `tools/${t.slug}.html`, name: t.name, desc: t.blurb, foot: esc(t.foot || ''), free: !t.premium,
        attrs: t.attrs !== undefined ? t.attrs : ` data-tool="${t.slug}"${t.premium ? ' data-premium="1"' : ''}` })),
    })),
    note: o.note,
  });
}

/* ---- the AP® course pages that share the tools step's boards: free-response practice (list and each question),
   the cram kit and the teachers page (boards R10-AP-FRQList, R10-AP-FRQ, R10-AP-Cram, R10-AP-Teachers). The builder
   makes the page as before; this turns its <main> into a round 3 page: the short cover band in place of the old
   breadcrumb and hero (the share bar moves into the band), and the page's own content below it. */
function heroParts(inner) {
  const crumb = /\s*<nav class="[^"]*crumb[^"]*"[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/.exec(inner);
  let rest = crumb ? inner.replace(crumb[0], '') : inner;
  const hero = /\s*<header class="(?:hero|page-head)[^"]*">([\s\S]*?)<\/header>/.exec(rest);
  if (hero) rest = rest.replace(hero[0], '');
  const h = hero ? hero[1] : '';
  const share = /<div class="[a-z]+-share[^"]*"[^>]*role="group"[\s\S]*?<\/div>/.exec(h);
  const pick = (re) => { const m = re.exec(h); return m ? m[1].trim() : ''; };
  return { rest, crumbs: crumb ? crumb[1].trim() : '', share: share ? share[0] : '', h1: pick(/<h1[^>]*>([\s\S]*?)<\/h1>/), lede: pick(/<p class="lede">([\s\S]*?)<\/p>/) };
}
export function r3PageMain(page, o) {
  const a = page.indexOf('<main id="main" class="xshell');
  if (a < 0) throw new Error('r3-tools: no xshell <main> in the page');
  const te = page.indexOf('>', a), b = page.indexOf('</main>', te);
  const cls = (/class="xshell ?([^"]*)"/.exec(page.slice(a, te + 1)) || [, ''])[1];
  const p = heroParts(page.slice(te + 1, b));
  const band = bandShort({
    kicker: `${o.kicker}`, note: o.note || '',
    h1: o.h1 || (o.plainH1 ? p.h1 : twoTone(p.h1)), hand: o.hand, lede: o.lede ?? p.lede, cta: o.cta, cta2: o.cta2,
    art: `<img src="${o.up}assets/covers/art/${o.key}.svg" alt="" width="640" height="400" decoding="async">`,
  }).replace('<p class="issue">', p.crumbs ? `<nav class="crumbs" aria-label="Breadcrumb">${p.crumbs}</nav>\n<p class="issue">` : '<p class="issue">')
    .replace('</div>\n</div><div class="art"', `${p.share ? `\n<div class="r3-share">${p.share}</div>` : ''}\n</div>\n</div><div class="art"`);
  const main = `<main id="main" class="r3 r3-page ${o.pageClass || ''} ${cls}" data-cover="${o.key}">\n${band}\n<div class="hwrap r3-page-body">${p.rest}</div>\n</main>`;
  let out = page.slice(0, a) + main + page.slice(b + 7);
  if (!out.includes('assets/course/r3-tools.css')) out = out.replace('</head>', `${r3ToolsCss(o.up)}\n</head>`);
  return out;
}
/* ctx: { key, courseHtml, frqFirst (href or ''), frqCount } */
export function apPageR3(slug, page, ctx) {
  const k = ctx.key, C = COURSE_SHORT[k];
  if (slug === 'frq') return r3PageMain(page, { key: k, up: '../', beta: true, pageClass: 'r3-frqlist', kicker: `${C} &middot; Free response`,
    h1: 'Free-response <span>practice.</span>', hand: 'the written part of the exam',
    lede: 'Pick a question, write your answer, then score it yourself with the rubric.',
    cta: ctx.frqFirst ? { href: ctx.frqFirst, label: 'Start with the first question' } : null });
  if (slug === 'cram') return r3PageMain(page, { key: k, up: '../', beta: true, pageClass: 'r3-cram', kicker: `${C} &middot; Cram kit`,
    h1: 'Counted back from <span>your exam date.</span>', hand: 'study days, practice exams and rest days',
    cta: { href: '#app', label: 'Set your exam date' }, cta2: { href: 'learn.html', label: 'Read the free notes for every topic' } });
  if (slug === 'teachers') {
    /* Free classes with a join code live at /teach/ (docs/teacher-classes.md); every course's teachers page leads there
       first, then the plain-link way (consistency audit D2). */
    const classes = `<section class="xsection" aria-labelledby="h-classes">
    <h2 id="h-classes">Free classes with a class code</h2>
    <p>Make a free class on <a href="/teach/">LevlPrep for teachers</a>, share its class code, and students join at <a href="/join.html">levlprep.com/join</a>. You assign practice, review, exams and free response, and see each student's mastery and the questions the class misses. <a href="/teach/?demo=1">See a sample class</a>.</p>
  </section>

  `;
    const withClasses = page.replace('<section class="xsection" aria-labelledby="h-assign">', classes + '<section class="xsection" aria-labelledby="h-assign">');
    return r3PageMain(withClasses, { key: k, up: '../', beta: true, pageClass: 'r3-teachers', kicker: `${C} &middot; For teachers`,
      h1: 'Assign it <span>with a link.</span>', hand: 'or make a free class with a code',
      cta: { href: '/teach/', label: 'Make a free class' }, cta2: { href: '#h-assign', label: 'Or assign with links' } });
  }
  return page;
}
export function apFrqItemR3(page, ctx) {
  const k = ctx.key, C = COURSE_SHORT[k];
  const unit = (/<div class="eyebrow">Free response &middot; ([^<]*?) ?<span/.exec(page) || [, ''])[1].trim();
  return r3PageMain(page, { key: k, up: '../../', beta: true, pageClass: 'r3-frq', plainH1: true, kicker: `${C} &middot; Free response${unit ? ` &middot; ${unit}` : ''}`,
    hand: 'write it first, then score yourself point by point',
    cta: { href: '#app', label: 'Start writing' }, cta2: { href: '../frq.html', label: `All ${ctx.frqCount} questions` } });
}

/* The opener of a tool page. o: { key, up ('../../'), slug, title?, hand, lede, back: {href,label}, crumbs } */
export function toolBand(o) {
  /* A full tool page owns the screen (Olivier, 2026-10-26): it gets no band, only the empty markers, so the builders
     keep one place to write. Reference pages that scroll (o.ref: NREMT formulary, flowcharts and the like) keep it. */
  if (!o.ref) return '<!-- r3-toolband:start -->\n\n<!-- r3-toolband:end -->';
  const list = toolCovers(o.key);
  const i = list.findIndex((t) => t.slug === o.slug);
  const t = i >= 0 ? list[i] : null;
  const title = o.title || (t && t.title) || o.slug;
  const lede = o.lede && o.hand && String(o.lede).trim() === String(o.hand).trim() ? '' : o.lede;
  return `<!-- r3-toolband:start -->
${r3ToolsCss(o.up)}
<div class="r3 r3-toolband" data-cover="${o.key}">
${bandShort({
    crumbs: o.crumbs, hid: 'r3ToolTitle',
    kicker: `${COURSE_SHORT[o.key]} &middot; Tools`, note: i >= 0 ? `Tool ${i + 1} of ${list.length}` : '',
    h1: twoTone(title), hand: o.hand, lede, cta2: o.back || { href: `${o.backHref || '../tools.html'}`, label: '&larr; All tools' },
    art: t ? `<img src="${coverSrc(o.key, o.slug, o.up)}" alt="" width="640" height="320" decoding="async" fetchpriority="high">` : '',
    artClass: 'tool',
  })}
</div>
<!-- r3-toolband:end -->`;
}
