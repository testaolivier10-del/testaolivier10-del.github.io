/* Site redesign round 3, step B4 (docs/site-redesign.md "Round 3 build"): every reading page in the R10
   system. Boards: docs/redesign-r3/r10/boards/R10-Notes, R10-Notes-Phone, R10-Unit, R10-Learn; placement
   lists docs/redesign-r3/inventory/R10-*.md.

   Every course writes its reading pages with the same shell (assets/course/book.css):
     <div class="tb-shell bk bk-notes|bk-chapter|bk-book"> rail, <main class="tb-main"> crumb, pill bar,
     <header class="bk-head|tb-chapter-head"> eyebrow, h1, meta, actions [, lede] </header> ...
   r3Reading() takes that finished page and gives it the R10 structure, the same way for all nine courses:
   - a short cover band before the shell: crumb, kicker (the eyebrow, split at its first middot), the two
     tone title (the page's own h1, its classes kept), the course's hand line, the page's own actions as
     the band's buttons (practice first), its meta as chips, its copy and print buttons and any other link
     as small links, and the course drawing (assets/covers/art/<key>.svg);
   - the shell gains .r3 and data-cover, so assets/course/r3.css and r3-reading.css style it as cards
     overlapping the band (contents rail | reading card | side column);
   - notes pages get the side column (R10-Notes): "Check your understanding" with the page's practice
     link, "In the reader" when the page has one, and a copy of the chapter's "Practice this" tools;
   - the header's lede, when it has one, opens the reading card.
   Nothing is dropped: every element the header and pill bar held is moved, with its classes, ids and data
   attributes, so book.js, hub progress chips, the copy and print buttons and the quick answer keep working.
   The spot the header was in keeps the marker <!-- r3:head -->, which scripts/lib/videos.mjs and
   scripts/lib/quick-answers.mjs anchor on, so build-videos and the quick answers still find it.
   Idempotent: a page that already has the band is returned as it is. */
import { homeData } from './r3-home.mjs';
import { COVERS } from './covers.mjs';

export const R3_HEAD_MARK = '<!-- r3:head -->';

const SMALL = new Set(['and', 'of', 'the', '&amp;', '&', 'in', 'to', 'for', 'a', 'an', 'with', 'on', 'vs', 'vs.', 'or', 'as', 'by', 'at']);

/* "Airway Management" -> Airway <span>Management</span>; longer titles split near the middle, a joining
   word starting the second half. Titles carrying markup (a span, an em) are left in one colour. */
export function twoTone(title) {
  if (/<(?!\/?(i|em|sub|sup)\b)/.test(title)) return title;
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return title;
  let cut = Math.ceil(words.length / 2);
  if (words.length === 2) cut = 1;
  /* A joining word opens the second line ("Chemistry / of Life"), never ends the first. */
  while (cut > 1 && SMALL.has(words[cut - 1].toLowerCase())) cut--;
  return `${words.slice(0, cut).join(' ')} <span>${words.slice(cut).join(' ')}</span>`;
}

function handFor(key) {
  try { return homeData(key).hand; } catch { return (COVERS[key] || {}).hand || ''; }
}

/* The first element matching re at or after from; returns { start, end, text, m }. */
function find(html, re, from = 0) {
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  r.lastIndex = from;
  const m = r.exec(html);
  return m ? { start: m.index, end: m.index + m[0].length, text: m[0], m } : null;
}

/* Every <a ...>...</a> or <button ...>...</button> in a fragment, in order. */
function controls(fragment) {
  return [...fragment.matchAll(/<(a|button)\b[^>]*>[\s\S]*?<\/\1>/g)].map((x) => x[0]);
}
const label = (el) => el.replace(/<i\b[^>]*>[\s\S]*?<\/i>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const hrefOf = (el) => (el.match(/href="([^"]*)"/) || [])[1] || '';

/* Give a control its band role without touching its href or data attributes. */
function asButton(el, cls) {
  /* bk-pill and bk-btn are only the old look (no script reads them), so they give way to the band's. */
  return el.replace(/^<(a|button)\b([^>]*?)(?:\sclass="([^"]*)")?([^>]*)>/, (all, tag, a, c, b) => {
    const keep = (c || '').split(/\s+/).filter((x) => x && !/^(bk-pill|bk-btn|solid|ghost)$/.test(x)).join(' ');
    return `<${tag}${a} class="${cls}${keep ? ' ' + keep : ''}"${b}>`;
  });
}

/* "5 sections · 19 topics · free" in one plain span (or a .bk-small) -> one chip per part. */
function splitChips(inner) {
  return inner.replace(/<span( class="bk-small")?>([^<]*)<\/span>/g, (all, cls, text) => {
    const parts = text.split(/\s*(?:&middot;|·)\s*/).filter(Boolean);
    return parts.length > 1 ? parts.map((p) => `<span${cls || ''}>${p}</span>`).join('') : all;
  }).replace(/^([^<]+)(?=<|$)/, (text) => {
    const parts = text.split(/\s*(?:&middot;|·)\s*/).map((p) => p.trim()).filter(Boolean);
    return parts.map((p) => `<span>${p}</span>`).join('');
  }).replace(/\s*(?:&middot;|·)\s*(?=<span)/g, '');
}

export function r3Reading(html, { key, rel }) {
  if (!key || html.includes('class="r3 r3-read')) return html;
  const shell = find(html, /<div class="tb-shell bk (bk-notes|bk-chapter|bk-book)">/);
  if (!shell) {
    if (/(^|\/)(glossary|search)\.html$/.test(rel)) return r3PageHead(html, { key, rel });
    if (/\/lessons\//.test(rel)) return r3Lesson(html, { key, rel });
    return html;
  }
  const kind = shell.m[1];
  const mainOpen = find(html, /<main class="tb-main" id="(?:main|tbMain)">/, shell.end);
  if (!mainOpen) return html;
  const up = '../'.repeat(Math.max(0, rel.split('/').length - 1));
  /* A course book opens on its static contents (and keeps its chapter template inside a script). */
  if (html.includes('<div class="tb-static-toc">')) return learnBand(html, { key, up, shell, mainOpen });
  const head = find(html, /<header class="(?:bk-head|tb-chapter-head[^"]*)">[\s\S]*?<\/header>\n?/, mainOpen.end);
  if (!head) return html;
  const scriptAt = html.indexOf('<script', mainOpen.end);
  if (scriptAt !== -1 && scriptAt < head.start) return html;

  /* Pieces that move into the band, in the order they sit between <main> and the header's end. */
  let between = html.slice(mainOpen.end, head.start);
  const crumb = find(between, /<nav class="[^"]*crumb[^"]*" aria-label="Breadcrumb">[\s\S]*?<\/nav>\s*/);
  let crumbHtml = '';
  if (crumb) { crumbHtml = crumb.text.trim(); between = between.slice(0, crumb.start) + between.slice(crumb.end); }
  const pills = find(between, /<div class="bk-pillbar">[\s\S]*?<\/div>\s*/);
  let pillEls = [];
  if (pills) { pillEls = controls(pills.text); between = between.slice(0, pills.start) + between.slice(pills.end); }

  let h = head.text;
  const eyebrow = find(h, /<p class="(?:bk-eyebrow|tb-chapter-eyebrow)">([\s\S]*?)<\/p>/);
  const title = find(h, /<h1 class="([^"]*)"([^>]*)>([\s\S]*?)<\/h1>/);
  const actions = find(h, /<(div|p) class="(?:bk-actions|bk-chap-acts)[^"]*"[^>]*>[\s\S]*?<\/\1>/);
  let actionsHtml = '';
  if (actions) { actionsHtml = actions.text; h = h.slice(0, actions.start) + h.slice(actions.end); }
  const meta = find(h, /<(p|div) class="((?:bk-meta|tb-chapter-meta)[^"]*)">([\s\S]*?)<\/\1>/);
  const lede = find(h, /<p class="bk-lede">[\s\S]*?<\/p>/);
  if (!title) return html;

  /* Band buttons: the page's practice link first, then the next one (reader, lesson, unit sheet, exam);
     anything else (a course home link, copy, print, share) becomes a small link under them. */
  const actEls = actions ? controls(actions.text) : [];
  const linkEls = [...pillEls, ...actEls.filter((el) => /^<a\b/.test(el) && /\bbk-btn\b/.test(el))];
  const small = actEls.filter((el) => !linkEls.includes(el));
  const isPractice = (el) => /practi|quiz|questions/i.test(label(el));
  const primary = linkEls.find(isPractice) || linkEls[0] || null;
  const rest = linkEls.filter((el) => el !== primary);
  const isHome = (el) => /course home$/i.test(label(el));
  const secondary = rest.find((el) => !isHome(el)) || null;
  const extra = rest.filter((el) => el !== secondary);
  const buttons = [primary && asButton(primary, 'btn-chan'), secondary && asButton(secondary, 'btn-ghost')].filter(Boolean).join('');
  const smallLinks = [...small, ...extra.map((el) => asButton(el, 'r3-link'))];

  /* Kicker: "Chapter 9 of 40 · Airway ... domain" -> left, rule, right. */
  let kick = eyebrow ? eyebrow.m[1].trim() : '';
  const split = kick.match(/^([\s\S]*?)\s*(?:&middot;|·)\s*([\s\S]+)$/);
  const issue = split ? `${split[1]} <i></i> ${split[2]}` : `${kick} <i></i>`;

  const titleAttrs = title.m[2].includes('id=') ? title.m[2] : `${title.m[2]} id="r3Title"`;
  const titleId = (titleAttrs.match(/id="([^"]+)"/) || [])[1];
  const h1 = `<h1 class="deck ${title.m[1]}"${titleAttrs}>${twoTone(title.m[3].trim())}</h1>`;
  const hand = handFor(key);
  const chips = meta ? `<p class="r3-chips ${meta.m[2]}">${splitChips(meta.m[3].trim())}</p>` : '';
  const links = smallLinks.length ? `<p class="r3-links">${smallLinks.join(' ')}</p>` : '';
  const band = `<div class="r3 r3-read-top" data-cover="${key}">
<section class="band short r3-rband" aria-labelledby="${titleId}"><div class="hwrap"><div>
${crumbHtml}
${kick ? `<p class="issue">${issue}</p>` : ''}
${h1}
${hand ? `<p class="hand">${hand}</p>` : ''}
${buttons ? `<div class="hero-ctas">${buttons}</div>` : ''}
${chips}
${links}
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async"></div></div></section>
</div>
`;

  /* Side column (notes pages only): the page's own practice and reader links, and its tools. */
  let side = '';
  if (kind === 'bk-notes' || (kind === 'bk-book' && /\/notes\//.test(rel))) {
    const prac = primary && isPractice(primary) ? primary : linkEls.find(isPractice);
    const reader = linkEls.find((el) => /reader/i.test(label(el)));
    const toolsM = html.match(/<div class="chapter-tools">[\s\S]*?<\/div>/);
    const cards = [];
    /* The chapter's own end matter, when it has it (NREMT): its lede and its practice link's words. */
    const review = html.match(/<section class="book-review"[\s\S]*?<p class="book-end__lede">([\s\S]*?)<\/p>[\s\S]*?<p class="book-review__foot">(<a\b[^>]*>[\s\S]*?<\/a>)/);
    if (review) {
      const go = review[2];
      cards.push(`<div class="r3-side-card navy"><p class="k">Check your understanding</p><p class="h">${label(go).replace(/\s*→$|&rarr;$/, '').trim()}</p><p>${review[1].trim()}</p><a class="r3-side-go" href="${hrefOf(go)}">${label(go).replace(/&rarr;|→/g, '').trim()} &rarr;</a></div>`);
    } else if (prac) cards.push(`<div class="r3-side-card navy"><p class="k">Check your understanding</p><a class="r3-side-go" href="${hrefOf(prac)}">${label(prac)} &rarr;</a></div>`);
    if (reader) cards.push(`<div class="r3-side-card"><p class="k">In the reader</p><p>Open this chapter in the interactive reader for five questions drawn from the bank.</p><a class="r3-side-go" href="${hrefOf(reader)}">Open in the reader &rarr;</a></div>`);
    if (toolsM) cards.push(`<div class="r3-side-card r3-side-tools">${toolsM[0].replace('class="chapter-tools"', 'class="chapter-tools r3-tools-copy"')}</div>`);
    if (cards.length) side = `\n  <aside class="r3-side" aria-label="Practice and reading">${cards.join('')}</aside>`;
  }

  /* Rebuild: band before the shell; the shell marked .r3; the header gone (its marker kept), its lede at
     the top of the reading card; the side column after </main>. */
  const newHead = `${R3_HEAD_MARK}\n${lede ? lede.text + '\n' : ''}`;
  let out = html.slice(0, shell.start) + band
    + `<div class="tb-shell bk ${kind} r3 r3-read" data-cover="${key}">`
    + html.slice(shell.end, mainOpen.end) + between + newHead + html.slice(head.end);
  /* The unit and chapter pages' list heading in two tones, as on R10-Unit: "Topics, <span>in course order</span>". */
  out = out.replace(/<h2 class="bk-h" id="h-topics">([^<,]+), ([^<]+)<\/h2>/, '<h2 class="bk-h" id="h-topics">$1, <span>$2</span></h2>');
  if (side) {
    const mc = out.indexOf('</main>', out.indexOf('<main class="tb-main" id="main">'));
    if (mc > 0) out = out.slice(0, mc + 7) + side + out.slice(mc + 7);
  }
  return withStyles(out, up);
}

/* Glossary and course search (R10-Glossary, R10-Search): pages with a plain <header class="page-head">
   (eyebrow, h1, lede) in an .xshell. The header becomes the short band (its h1 kept, in two tones with the
   board's second line), and the page is marked .r3 .r3-page so its first block (the glossary's find
   tools, the search box) sits as the white card over the band. The crumb moves in when it is in the page;
   a crumb kept between build-crumbs markers stays where that script puts it. */
const PAGE_WORDS = {
  glossary: { t2: 'in plain words', hand: 'every word the questions use' },
  search: { t2: 'the whole course', hand: 'one box for everything' },
};
export function r3PageHead(html, { key, rel }) {
  if (html.includes('class="r3 r3-read-top')) return html;
  const kindM = rel.match(/(glossary|search)\.html$/);
  const words = PAGE_WORDS[kindM ? kindM[1] : ''] || {};
  const body = html.indexOf('<body');
  const head = find(html, /<header class="page-head">([\s\S]*?)<\/header>\n?/, body);
  if (!head) return html;
  const scriptAt = html.indexOf('<script', body);
  if (scriptAt !== -1 && scriptAt < head.start) return html;
  const up = '../'.repeat(Math.max(0, rel.split('/').length - 1));
  const inner = head.m[1];
  const eyebrow = (inner.match(/<div class="eyebrow">([\s\S]*?)<\/div>/) || [])[1] || '';
  const h1 = inner.match(/<h1([^>]*)>([\s\S]*?)<\/h1>/);
  const lede = (inner.match(/<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '';
  if (!h1) return html;
  /* The container the header lives in: <main ... class="xshell ..."> or a plain <div class="xshell">. */
  const boxStart = Math.max(html.lastIndexOf('<main', head.start), html.lastIndexOf('<div class="xshell">', head.start));
  if (boxStart < body) return html;
  const boxTag = find(html, /<(main|div)\b[^>]*>/, boxStart);
  let between = html.slice(boxTag.end, head.start);
  const crumb = find(between, /<nav class="[^"]*crumb[^"]*" aria-label="Breadcrumb">[\s\S]*?<\/nav>\s*/);
  let crumbHtml = '';
  if (crumb) { crumbHtml = crumb.text.trim(); between = between.slice(0, crumb.start) + between.slice(crumb.end); }
  const titleText = h1[2].trim();
  const titleId = (h1[1].match(/id="([^"]+)"/) || [])[1] || 'r3Title';
  const title = words.t2 ? `${titleText} <span>${words.t2}</span>` : twoTone(titleText);
  const hand = words.hand || handFor(key);
  const band = `<div class="r3 r3-read-top r3-pagetop" data-cover="${key}">
<section class="band short r3-rband" aria-labelledby="${titleId}"><div class="hwrap"><div>
${crumbHtml}
<p class="issue">${eyebrow} <i></i> ${titleText}</p>
<h1 class="deck"${h1[1].includes('id=') ? h1[1] : `${h1[1]} id="${titleId}"`}>${title}</h1>
${hand ? `<p class="hand">${hand}</p>` : ''}
${lede ? `<p class="lede">${lede}</p>` : ''}
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async"></div></div></section>
</div>
`;
  /* Mark the container (keeping its own classes) and drop the header, leaving the marker. */
  const tag = boxTag.text.includes('class="')
    ? boxTag.text.replace(/class="([^"]*)"/, `class="$1 r3 r3-page r3-${kindM ? kindM[1] : 'page'}" data-cover="${key}"`)
    : boxTag.text.replace(/>$/, ` class="r3 r3-page" data-cover="${key}">`);
  const out = html.slice(0, boxStart) + band + tag + between + `${R3_HEAD_MARK}\n` + html.slice(head.end);
  return withStyles(out, up);
}

/* Lessons (R10-Lesson): the lesson engines (ochem's lesson-engine.js, step-back.js and ochem-premium.js; the
   AP® and A&P lesson scripts) find their hero and shell by class, and the video block anchors inside the
   hero, so the markup stays where it is. The shell is marked .r3 .r3-lesson with the course, and
   r3-reading.css draws the hero as the full width cover band with the course drawing, and the steps as
   the card over it. Idempotent. */
export function r3Lesson(html, { key, rel }) {
  if (/class="[^"]*\br3-lesson\b/.test(html)) return html;
  const up = '../'.repeat(Math.max(0, rel.split('/').length - 1));
  let out = html;
  const ap = out.match(/<main id="main" class="([a-z]+-ls-main[^"]*)"/);
  if (ap) out = out.replace(ap[0], `<main id="main" class="${ap[1]} r3 r3-lesson" data-cover="${key}"`);
  else {
    const oc = out.match(/<div class="xshell lesson-shell"/);
    if (!oc) return html;
    out = out.replace(oc[0], `<div class="xshell lesson-shell r3 r3-lesson" data-cover="${key}"`);
  }
  return withStyles(out, up);
}

/* The styles, once, after the course stylesheets. */
function withStyles(out, up) {
  if (out.includes('assets/course/r3-reading.css')) return out;
  const css = `${out.includes('assets/course/r3.css') ? '' : `<link rel="stylesheet" href="${up}assets/course/r3.css">\n`}<link rel="stylesheet" href="${up}assets/course/r3-reading.css">\n`;
  return out.replace('</head>', `${css}</head>`);
}

/* The course book (learn.html, NREMT study-notes.html; R10-Learn): a reader that opens on its static
   contents and swaps a chapter in. Its band names the book (the contents' own h1 stays in the page for
   the outline and screen readers, shown only to them while the band is there) and starts at the first
   page; the crumb moves into the band; the shell becomes the card layout. */
function learnBand(html, { key, up, shell, mainOpen }) {
  const toc = find(html, /<div class="tb-static-toc">\s*<h1>([\s\S]*?)<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/, mainOpen.end);
  if (!toc) return html;
  let between = html.slice(mainOpen.end);
  const crumb = find(between, /<nav class="[^"]*crumb[^"]*" aria-label="Breadcrumb">[\s\S]*?<\/nav>\s*/);
  let crumbHtml = '';
  if (crumb && crumb.start < 400) { crumbHtml = crumb.text.trim(); between = between.slice(0, crumb.start) + between.slice(crumb.end); }
  const first = (html.slice(toc.start).match(/href="(notes\/[a-z0-9-]+\.html)"/) || [])[1];
  const name = toc.m[1].replace(/^The\s+/i, '').trim();
  const hand = handFor(key);
  const band = `<div class="r3 r3-read-top r3-learn" data-cover="${key}">
<section class="band short r3-rband" aria-label="${name.replace(/<[^>]+>/g, '').replace(/"/g, '&quot;')}"><div class="hwrap"><div>
${crumbHtml}
<p class="issue">Learn <i></i> Free forever</p>
<p class="deck" aria-hidden="true">${twoTone(name)}</p>
${hand ? `<p class="hand">${hand}</p>` : ''}
<p class="lede">${toc.m[2].trim()}</p>
${first ? `<div class="hero-ctas"><a class="btn-chan" href="${first}">Start at the first page</a></div>` : ''}
</div><div class="art" aria-hidden="true"><img src="${up}assets/covers/art/${key}.svg" alt="" width="640" height="400" decoding="async"></div></div></section>
</div>
`;
  const out = html.slice(0, shell.start) + band
    + `<div class="tb-shell bk ${shell.m[1]} r3 r3-read" data-cover="${key}">`
    + html.slice(shell.end, mainOpen.end) + between;
  return withStyles(out, up);
}
