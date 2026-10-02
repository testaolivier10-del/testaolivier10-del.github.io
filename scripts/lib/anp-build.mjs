/* Page templates and helpers for the A&P course generator (scripts/build-anp.mjs).

   Everything a student reads in the course is built here from
   anatomy-physiology/data/ and docs/anp-dependency-map.json, so every page has
   the same head, the same 11-part lesson order (docs/anp-spec.md section 4) and
   the same glossary markup. docs/anp-phase1-architecture.md describes the data. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadMap, indexMap, scanTerms, termRegex, scanPage, ASCII } from './anp-map.mjs';

export const SITE = 'https://levlprep.com';
export const BASE = '/anatomy-physiology/';
export const COURSE_NAME = 'Anatomy & Physiology';
export const COURSE_ID = `${SITE}${BASE}#course`;
import { CSP } from './site-config.mjs';
export { CSP };
export const TEAS_DISCLAIMER = 'LevlPrep is not affiliated with, endorsed by, or connected to Assessment Technologies Institute (ATI). TEAS and ATI TEAS are trademarks of ATI, used here only to say what the material is for.';

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const text = html => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

/* ------------------------------------------------------------------ data */

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
function mergeDir(dir) {
  const all = {};
  if (!existsSync(dir)) return all;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const obj = readJson(join(dir, f));
    for (const [k, v] of Object.entries(obj)) if (!(k in all)) all[k] = { ...v, _file: f };
  }
  return all;
}

export function loadCourse(root) {
  const map = loadMap(join(root, 'docs', 'anp-dependency-map.json'));
  const data = join(root, 'anatomy-physiology', 'data');
  const { topicIndex, concepts } = indexMap(map);
  const lessons = {}, notes = {}, questions = {};
  for (const t of map.topics) {
    const lp = join(data, 'lessons', `${t.id}.json`);
    const np = join(data, 'notes', `${t.id}.html`);
    const qp = join(data, 'questions', `${t.id}.json`);
    if (existsSync(lp)) lessons[t.id] = readJson(lp);
    if (existsSync(np)) notes[t.id] = readFileSync(np, 'utf8');
    if (existsSync(qp)) questions[t.id] = readJson(qp);
  }
  const glossary = mergeDir(join(data, 'glossary'));
  const figures = mergeDir(join(data, 'figures'));
  // A figure's named labels live in data/labels/<figure id>.json, apart from
  // the figure entry, so naming labels and editing captions never collide.
  const labelDir = join(data, 'labels');
  if (existsSync(labelDir)) for (const f of readdirSync(labelDir).filter(f => f.endsWith('.json'))) {
    const id = f.slice(0, -5);
    if (figures[id]) figures[id] = { ...figures[id], labels: readJson(join(labelDir, f)).labels || [] };
  }
  // Published chapters (data/published.json, decision 53): a finished topic in an
  // unpublished chapter is checked but not built, so the branch can carry work
  // in progress while main only shows audited chapters.
  const pubPath = join(data, 'published.json');
  const published = existsSync(pubPath) ? new Set(readJson(pubPath).chapters) : null;
  const chapterIdOf = id => map.topics[topicIndex.get(id)].chapter;
  const built = new Set(map.topics.map(t => t.id).filter(id => lessons[id] && notes[id] && questions[id] && (!published || published.has(chapterIdOf(id)))));
  const chapterOf = id => map.chapters.find(c => c.id === map.topics[topicIndex.get(id)].chapter);
  return { map, topicIndex, concepts, lessons, notes, questions, glossary, figures, built, chapterOf, data };
}

/* ------------------------------------------------------------- the head */

export function clampTitle(cands) {
  for (const c of cands) if (c.length <= 60) return c;
  return cands[cands.length - 1].slice(0, 57).replace(/\s+\S*$/, '') + '…';
}
/* A description is whole sentences or it is the fallback. Cutting mid-sentence
   and adding "…" was what 190 A&P pages shipped: a snippet that stops before
   it says what the page is for reads as broken in a result list.
   Tried in order, within the first three sentences: a run of whole sentences
   that fits, then the clause before a semicolon, which usually stands on its
   own. A later sentence is skipped when it opens with a word pointing back
   ("It", "This", "So"), because out of context it would point at nothing. */
const REFERS_BACK = /^(That|This|These|Those|It|Its|They|Their|Them|So|But|And|Or|Then|Here|There|Both|Each|Such|Now|Also|Yet|Instead|Because|Which|We)\b/;
export function clampDesc(s, fallback) {
  s = text(s);
  if (s.length <= 158) return s;
  const sentences = s.split(/(?<=[.!?])\s+(?=[A-Z0-9(])/);
  for (let i = 0; i < Math.min(3, sentences.length); i++) {
    if (i && REFERS_BACK.test(sentences[i])) continue;
    let out = '';
    for (const sentence of sentences.slice(i)) {
      const next = out ? `${out} ${sentence}` : sentence;
      if (next.length > 158) break;
      out = next;
    }
    if (out.length >= 70) return out;
    const clause = sentences[i].split('; ')[0];
    if (clause.length >= 70 && clause.length <= 157 && clause !== sentences[i]) return `${clause.replace(/[,:]$/, '')}.`;
  }
  if (fallback) return clampDesc(fallback);
  return s.slice(0, 157).replace(/\s+\S*$/, '') + '…';
}

/* depth: '' for pages in anatomy-physiology/, '../' for pages one folder down. */
export function head({ title, desc, path, depth, ogType = 'article', jsonld, scripts = [], meta = '' }) {
  const url = `${SITE}${BASE}${path}`;
  const up = depth + '../';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}assets/icon-180.png">
<link rel="manifest" href="${depth}manifest.json">
<meta name="theme-color" content="#16332E">
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="LevlPrep">
<meta property="og:image" content="${SITE}${BASE}assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${meta}<link rel="stylesheet" href="${up}assets/theme.css">
<script src="${up}assets/errors.js" defer></script>
<script src="${up}assets/account.js" defer></script>
<script src="${up}assets/hub-progress.js" defer></script>
<script src="${up}assets/chime.js" defer></script>
<script src="${up}assets/site-chrome.js" defer></script>
<link rel="stylesheet" href="${depth}assets/anp.css">
<link rel="stylesheet" href="${up}assets/fonts/fonts.css">
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>`;
}

/* The scripts every course page ends with. section picks the active tab.
   premium loads the site's Premium module (assets/premium.js) ahead of the
   course scripts, on the pages with a Premium surface; AnpCore reads it and
   does without it when it is absent. */
export function tail({ depth, section, extra = [], premium = false, site = [] }) {
  const s = src => `<script src="${depth}assets/${src}" defer></script>`;
  return [
    ...site.map(f => `<script src="${depth}../assets/${f}" defer></script>`),
    ...(premium ? [`<script src="${depth}../assets/premium.js" defer></script>`] : []),
    `<script>window.ANP_SECTION = '${section}'; window.ANP_BASE = '${depth}';</script>`,
    s('anp-curriculum.js'), s('anp-core.js'), s('anp-glossary.js'), s('anp-nav.js'),
    ...extra.map(s),
  ].join('\n');
}

export function crumbs(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}
export const orgCrumbs = extra => [
  { name: 'LevlPrep', url: `${SITE}/` },
  { name: COURSE_NAME, url: `${SITE}${BASE}` },
  ...extra,
];
export function crumbNav(items, depth) {
  return `<nav class="anp-crumb" aria-label="Breadcrumb">${items.map((it, i) =>
    i === items.length - 1 ? `<span aria-current="page">${esc(it.name)}</span>`
      : `<a href="${it.href}">${esc(it.name)}</a> <span aria-hidden="true">&rsaquo;</span>`).join(' ')}</nav>`;
}

/* Beta label (audit 2026-10, fix 11; spec decision 74): the course has had no
   review by a licensed A&P instructor and docs/anp-needs-author.md holds open
   items, so every page says so. Remove only after that review. */
// anp-nav-ref: a label, not teaching, so the page check skips it ("Beta" next
// to a title like "Cell cycle" read as "beta cell").
export const BETA_PILL = '<span class="anp-beta anp-nav-ref">Beta</span>';
export const BETA_NOTE = 'This course has not yet been reviewed by a licensed A&amp;P instructor.';

export function footer(depth) {
  return `<footer class="anp-foot xshell">
  <p class="anp-accuracy-note">${BETA_PILL} ${BETA_NOTE} It follows current published sources, listed on the <a href="${depth}../sources.html">Sources</a> page. Spot a mistake? Use a “Report a problem” link: every question, notes page and the glossary has one.</p>
  <p class="privacy-link"><a href="${depth}../privacy.html">Privacy</a> &middot; <a href="${depth}../terms.html">Terms</a> &middot; <a href="${depth}../sources.html">Sources</a> &middot; <a href="${depth}credits.html">Figure credits</a> &middot; <a href="${depth}../account.html">Account</a> &middot; <a href="mailto:testaolivier10@gmail.com">Contact</a></p>
</footer>`;
}

/* ------------------------------------------------------------ glossary */

/* Every scan term, longest first, with its concept. Built once per course. */
export function termIndex(C) {
  const out = [];
  for (const c of C.map.concepts) {
    if (!C.glossary[c.id]) continue;
    for (const t of scanTerms(c)) out.push({ t, id: c.id });
  }
  out.sort((a, b) => b.t.length - a.t.length);
  return out.map(x => ({ ...x, re: termRegex(x.t), lower: ASCII.test(x.t) ? x.t.toLowerCase() : null }));
}

/* Where a concept is taught, as a link from `fromDepth`, or null when that
   page is not built yet (spec section 7: plain text plus hover until then). */
export function teachHref(C, conceptId, fromDepth, selfTopic) {
  const c = C.concepts.get(conceptId);
  if (!c || !C.built.has(c.taughtIn) || c.taughtIn === selfTopic) return null;
  return `${fromDepth}notes/${c.taughtIn}.html`;
}

/* The index positions of the terms that could occur in `lowerS`: an ASCII
   term can match only where its lowercased first three letters (two, for a
   two-letter term) appear, so the terms are bucketed by that prefix once and a
   text node looks up the prefixes it contains. Non-ASCII terms are always
   candidates. Returned in ascending order, which is the index's order. */
const bucketCache = new WeakMap();
function candidates(index, lowerS) {
  let b = bucketCache.get(index);
  if (!b) {
    b = { two: new Map(), three: new Map(), always: [] };
    index.forEach((x, k) => {
      const low = x.lower;
      if (low === null || low === undefined || low.length < 2) { b.always.push(k); return; }
      const [map, key] = low.length === 2 ? [b.two, low] : [b.three, low.slice(0, 3)];
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(k);
    });
    bucketCache.set(index, b);
  }
  const out = new Set(b.always);
  for (let i = 0; i + 2 <= lowerS.length; i++) {
    const l2 = b.two.get(lowerS.substr(i, 2));
    if (l2) for (const k of l2) out.add(k);
    if (i + 3 <= lowerS.length) {
      const l3 = b.three.get(lowerS.substr(i, 3));
      if (l3) for (const k of l3) out.add(k);
    }
  }
  return [...out].sort((x, y) => x - y);
}

const SKIP_TAGS = new Set(['a', 'script', 'style', 'svg', 'h1', 'h2', 'h3', 'code', 'button', 'summary', 'figcaption', 'th', 'label', 'title', 'nav']);

/* Marks the first use of each defined term on a page: a link to the page that
   teaches it when that page exists, otherwise a hover span. Only text outside
   tags is touched, never inside links, headings, SVG or scripts. `seen` is
   shared across the calls that make up one page. */
export function glossify(C, html, { depth, topic, seen, index }) {
  const parts = String(html).split(/(<[^>]+>)/);
  const stack = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      const m = p.match(/^<\s*(\/)?\s*([a-zA-Z0-9]+)/);
      if (m) {
        const tag = m[2].toLowerCase();
        const selfClose = /\/>$/.test(p) || ['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'ellipse'].includes(tag);
        if (m[1]) { const k = stack.lastIndexOf(tag); if (k > -1) stack.length = k; }
        else if (!selfClose) stack.push(tag);
      }
      continue;
    }
    if (!p.trim() || stack.some(t => SKIP_TAGS.has(t))) continue;
    // Inside a preview box a later term is allowed and still gets its hover.
    let s = p;
    const marks = [];
    // Only the terms whose opening letters occur in this text node can match
    // it (see candidates); they are tried in the index's own order, longest
    // first, exactly as a walk of the whole index would.
    const lowerS = s.toLowerCase();
    for (const k of candidates(index, lowerS)) {
      const { id, re, lower } = index[k];
      if (seen.has(id)) continue;
      if (lower !== null && lower !== undefined && !lowerS.includes(lower)) continue;
      re.lastIndex = 0;
      const m = re.exec(s);
      if (!m) continue;
      // Never mark inside a mark already placed in this text node.
      const start = m.index, end = start + m[0].length;
      if (marks.some(k => start < k.end && end > k.start)) continue;
      // A match touching a sub/superscript is part of a formula (the CO in
      // H<sub>2</sub>CO<sub>3</sub>), not the term.
      const SUBSUP = /^<\/?(sub|sup)\b/i;
      if ((start === 0 && SUBSUP.test(parts[i - 1] || '')) || (end === s.length && SUBSUP.test(parts[i + 1] || ''))) continue;
      seen.add(id);
      marks.push({ start, end, id, word: m[0] });
    }
    if (!marks.length) continue;
    marks.sort((a, b) => b.start - a.start);
    for (const k of marks) {
      const href = teachHref(C, k.id, depth, topic);
      const tag = href
        ? `<a class="gl" href="${href}" data-c="${k.id}">${k.word}</a>`
        : `<span class="gl" tabindex="0" data-c="${k.id}">${k.word}</span>`;
      s = s.slice(0, k.start) + tag + s.slice(k.end);
    }
    parts[i] = s;
  }
  return parts.join('');
}

/* ------------------------------------------------------------- figures */

/* A label printed on a figure names a concept. When that concept is taught
   after the page's topic, the label is covered for good on that page: a figure
   must not teach a word early any more than the text may (spec section 7). */
const laterCache = new WeakMap();
export function laterLabel(C, l, topicId) {
  // The same label on the same topic's page always answers the same, and a
  // figure is drawn on several pages (notes, lesson, questions), so the
  // expensive half, a scan of the label's printed name, is remembered.
  let byC = laterCache.get(C);
  if (!byC) { byC = new Map(); laterCache.set(C, byC); }
  const key = `${l.cover ? 1 : 0}\u0000${l.concept || ''}\u0000${l.name || ''}\u0000${topicId || ''}`;
  if (byC.has(key)) return byC.get(key);
  const v = laterLabelUncached(C, l, topicId);
  byC.set(key, v);
  return v;
}
function laterLabelUncached(C, l, topicId) {
  // A label marked "cover" is wrong or misleading as printed: covered on every
  // page and never quizzed.
  if (l.cover) return true;
  if (!topicId) return false;
  const c = l.concept && C.concepts.get(l.concept);
  if (c && C.topicIndex.get(c.taughtIn) > C.topicIndex.get(topicId)) return true;
  // The printed name itself may use a later term even when the label's own
  // concept is earlier or unmapped ("postsynaptic neuron").
  return scanPage(C.map, `<p>${esc(l.name || '')}</p>`, topicId).length > 0;
}

/* Labels printed with a typo carry "fix", the right spelling. It is drawn over
   the printed label as an SVG in the image's own pixel space, so it scales
   with the figure on any screen (audit 2026-10: Figure 25.10 "conboluted").
   Wrapped onto as many lines as the printed label has. */
export function fixSvg(f, labels) {
  const fx = (labels || []).filter(l => l.fix && l.box);
  if (!fx.length) return '';
  const W = f.w || 1000, H = f.h || 1000;
  const parts = fx.map(l => {
    const [x, y, w, h] = l.box;
    const n = Math.max(1, (l.lines || []).length);
    const words = l.fix.split(' ');
    const lines = [];
    // Balance by characters: fill each line up to its share of the text.
    let cur = [], target = l.fix.length / n;
    for (const word of words) {
      if (cur.length && lines.length < n - 1 && (cur.join(' ') + ' ' + word).length > target + 2) { lines.push(cur.join(' ')); cur = []; }
      cur.push(word);
    }
    lines.push(cur.join(' '));
    const fs = Math.min(h / lines.length * 0.78, 26).toFixed(1);
    const lh = h / lines.length;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/><text font-family="Arial,Helvetica,sans-serif" font-size="${fs}" font-weight="600" fill="#231F20">${lines.map((t, i) => `<tspan x="${x + 2}" y="${(y + lh * (i + 0.72)).toFixed(1)}">${esc(t)} </tspan>`).join('')}</text>`;
  });
  return `<svg class="anp-fix" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${parts.join('')}</svg>`;
}

export function figureImg(C, figId, depth, { masks = true, topic = null } = {}) {
  const f = C.figures[figId];
  if (!f) return '';
  const src = `${depth}figures/${figId}.${f.ext || 'jpg'}`;
  const all = (f.labels || []).filter(l => l.box);
  const covered = all.filter(l => laterLabel(C, l, topic));
  const labels = all.filter(l => !covered.includes(l));
  const W = f.w || 1000, H = f.h || 1000;
  const pct = (v, of) => (100 * v / of).toFixed(2) + '%';
  // Detector padding can run a box a few pixels past the image edge; clip it.
  const clip = b => { const x = Math.max(0, b[0]), y = Math.max(0, b[1]); return [x, y, Math.min(b[0] + b[2], W) - x, Math.min(b[1] + b[3], H) - y]; };
  const at = b0 => { const b = clip(b0); return `left:${pct(b[0], W)};top:${pct(b[1], H)};width:${pct(b[2], W)};height:${pct(b[3], H)}`; };
  const maskHtml = masks && labels.length ? labels.map(l =>
    `<button type="button" class="anp-mask" data-label="${esc(l.id)}" aria-label="Hidden label: ${esc(l.name)}. Select to reveal." style="${at(l.box)}"><span>${esc(l.name)}</span></button>`).join('') : '';
  const coverHtml = covered.map(l => `<span class="anp-cover" aria-hidden="true" style="${at(l.box)}"></span>`).join('');
  // A label printed with a typo carries "fix": the right spelling is drawn
  // over it (audit 2026-10: OpenStax Figure 25.10's "conboluted").
  const fixHtml = fixSvg(f, labels);
  return `<div class="anp-figimg${masks && labels.length ? ' has-masks' : ''}" data-fig="${esc(figId)}"><img src="${src}" alt="${esc(f.alt)}" width="${W}" height="${H}" loading="lazy" decoding="async">${coverHtml}${fixHtml}${maskHtml}</div>`;
}

/* Figure attribution, built from the figure's data (audit 2026-10, fix 11).
   OpenStax figures name the book's authors, publisher and rights holder and
   its license; a figure OpenStax credits to someone else also carries that
   party's own credit line and license (data: "thirdParty"), with share-alike
   noted for a CC BY-SA source; a figure shown with any printed label hidden
   or covered says "Adapted: labels hidden." */
export const OPENSTAX_BOOK_TEXT = 'J. Gordon Betts et al., Anatomy and Physiology 2e, OpenStax, © Rice University';
const OPENSTAX_BOOK_HTML = 'J. Gordon Betts et al., <i>Anatomy and Physiology 2e</i>, OpenStax, &copy; Rice University';
export const LICENSE_URL = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/',
};
export const isShareAlike = (license) => /\bBY-SA\b/.test(license || '');
export function openstaxPage(f) {
  return f.openstax && f.openstax.page
    ? `https://openstax.org/books/anatomy-and-physiology-2e/pages/${f.openstax.page}`
    : 'https://openstax.org/details/books/anatomy-and-physiology-2e';
}

/* { text, html } for one figure as shown. adapted: some printed label is
   hidden (masked or covered) where it is shown. */
export function attribution(f, { adapted = false } = {}) {
  if (!f) return { text: '', html: '' };
  const lic = (name) => LICENSE_URL[name] ? `<a href="${LICENSE_URL[name]}" rel="license">${esc(name)}</a>` : esc(name);
  const tp = f.thirdParty;
  const sa = tp && isShareAlike(tp.license) ? '; this adaptation is shared under the same license' : '';
  const tpText = tp ? ` Original: ${tp.credit}, ${tp.license}${sa}.` : '';
  const tpHtml = tp ? ` Original: ${esc(tp.credit)}, ${lic(tp.license)}${sa}.` : '';
  const ad = (adapted ? ' Adapted: labels hidden.' : '') + ((f.labels || []).some(l => l.fix) ? ' A misspelled printed label is corrected.' : '');
  if (f.source === 'openstax') {
    const n = f.openstax && f.openstax.figure;
    return {
      text: `Figure ${n} from ${OPENSTAX_BOOK_TEXT}, ${f.license}.${tpText}${ad}`,
      html: `Figure ${esc(n)} from ${OPENSTAX_BOOK_HTML}, <a href="${openstaxPage(f)}">openstax.org</a>, ${lic(f.license)}.${tpHtml}${ad}`,
    };
  }
  if (!f.credit) return { text: '', html: '' };
  return { text: `${f.credit} (${f.license}).${ad}`, html: `${esc(f.credit)} (${esc(f.license)}).${ad}` };
}

export function credit(f, opts = {}) {
  const a = attribution(f, opts);
  return a.html ? `<span class="anp-credit">${a.html}</span>` : '';
}

/* The printed labels a page for this topic paints over for good. */
export function coveredLabels(C, figId, topic) {
  const f = C.figures[figId];
  return f ? (f.labels || []).filter(l => l.box && laterLabel(C, l, topic)) : [];
}

/* Numbers every figure on a page and rewrites <a class="figref"> to match,
   and fills registered figures (<figure data-fig>) with their image. */
export function renderFigures(C, html, depth, topic = null) {
  let n = 0;
  const numbers = {};
  html = html.replace(/<figure\b([^>]*)>([\s\S]*?)<\/figure>/g, (all, attrs, inner) => {
    n++;
    const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    if (id) numbers[id] = n;
    const fig = (attrs.match(/\bdata-fig="([^"]+)"/) || [])[1];
    let body = inner;
    let cap = (inner.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1] || '';
    // The generator numbers figures; an author's own "Figure 3." would repeat it.
    cap = cap.replace(/^\s*(<b>|<strong>)?\s*Figure\s+\d+[.:]?\s*(<\/b>|<\/strong>)?\s*/i, '');
    if (fig) body = figureImg(C, fig, depth, { masks: false, topic });
    else body = inner.replace(/<figcaption>[\s\S]*?<\/figcaption>/, '');
    const cr = fig ? ' ' + credit(C.figures[fig], { adapted: coveredLabels(C, fig, topic).length > 0 }) : '';
    const cls = (attrs.match(/\bclass="([^"]+)"/) || [])[1];
    const attrsOut = attrs.replace(/\bclass="[^"]*"/, '').replace(/\bdata-fig="[^"]*"/, '');
    return `<figure${attrsOut} class="anp-figure${cls ? ' ' + cls : ''}">${body}<figcaption><b>Figure ${n}.</b> ${cap}${cr}</figcaption></figure>`;
  });
  html = html.replace(/<a class="figref" href="#([^"]+)">[^<]*<\/a>/g, (all, id) =>
    numbers[id] ? `<a class="figref" href="#${id}">Figure ${numbers[id]}</a>` : all);
  return html;
}

/* --------------------------------------------------------- questions */

/* A question as the page embeds it. Order items keep the authored order as the
   key; the runtime shuffles for display. */
export function questionForPage(C, q, topicId) {
  const t = C.map.topics[C.topicIndex.get(topicId)];
  const ch = C.chapterOf(topicId);
  return {
    id: q.id, type: q.type, level: q.level, diff: q.diff, core: q.core,
    topic: topicId, chapter: ch.id, course: t.course, teas: ch.teas,
    q: q.q, options: q.options, correct: q.correct, variables: q.variables,
    figure: q.figure, pin: q.pin, why: q.why, misconception: q.misconception,
    // A figure question carries its image by path from the course root; the
    // runtime prefixes the page's base, so the same data works on any page.
    fig: q.figure && C.figures[q.figure] ? figForQuestion(C, q.figure, topicId, q.type === 'image' ? q.pin : null) : undefined,
  };
}

function figForQuestion(C, id, topicId, pin) {
  const f = C.figures[id], W = f.w || 1000, H = f.h || 800;
  const pct = b => [b[0] / W, b[1] / H, b[2] / W, b[3] / H].map(v => +(100 * v).toFixed(2));
  const labels = (f.labels || []).filter(l => l.box);
  // An identification question covers every printed label, or the answer
  // could be read off the figure, and marks the pinned label's box as the
  // target. Any other figure question covers only labels taught later.
  const target = pin ? labels.find(l => l.id === pin) : null;
  const coveredL = labels.filter(l => target ? l !== target : laterLabel(C, l, topicId));
  const covers = coveredL.map(l => pct(l.box));
  const fixes = fixSvg(f, labels.filter(l => l.fix && l !== target && !coveredL.includes(l)));
  const credit = attribution(f, { adapted: covers.length > 0 || !!target }).text;
  return { src: `figures/${id}.${f.ext || 'jpg'}`, alt: f.alt, w: W, h: H, ...(covers.length ? { covers } : {}), ...(target ? { pin: pct(target.box) } : {}), ...(fixes ? { fixes } : {}), credit };
}

/* The question as static HTML (readable without JavaScript; anp-questions.js
   turns it into the interactive version). */
export function questionHtml(q, n) {
  const opts = q.type === 'predict'
    ? `<table class="anp-predict"><thead><tr><th scope="col">Variable</th><th scope="col">Change</th></tr></thead><tbody>${q.variables.map(v => `<tr><th scope="row">${v.name}</th><td>—</td></tr>`).join('')}</tbody></table>`
    : `<ol class="anp-opts">${(q.options || []).map(o => `<li>${o}</li>`).join('')}</ol>`;
  const key = q.type === 'predict'
    ? q.variables.map(v => `<li><b>${v.name}: ${v.answer === 'none' ? 'no change' : v.answer}.</b> ${v.why}</li>`).join('')
    : q.type === 'order'
      ? `<li>Correct order: ${q.options.map((o, i) => `${i + 1}. ${o}`).join(' ')}</li>`
      : (q.options || []).map((o, i) => `<li>${[].concat(q.correct).includes(i) ? '<b>Correct:</b> ' : ''}${o}: ${(q.why.options || [])[i] || ''}</li>`).join('');
  return `<div class="anp-q" data-qid="${esc(q.id)}"><p class="anp-q-stem"><span class="anp-q-n">${n}.</span> ${q.q}</p>${opts}<details class="anp-q-key"><summary>Show the answer</summary>${q.why && q.why.correct ? `<p>${q.why.correct}</p>` : ''}<ul>${key}</ul></details></div>`;
}
