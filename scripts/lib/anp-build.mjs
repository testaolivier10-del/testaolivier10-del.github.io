/* Page templates and helpers for the A&P course generator (scripts/build-anp.mjs).

   Everything a student reads in the course is built here from
   anatomy-physiology/data/ and docs/anp-dependency-map.json, so every page has
   the same head, the same 11-part lesson order (docs/anp-spec.md section 4) and
   the same glossary markup. docs/anp-phase1-architecture.md describes the data. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadMap, indexMap, scanTerms, termRegex, scanPage } from './anp-map.mjs';

export const SITE = 'https://levlprep.com';
export const BASE = '/anatomy-physiology/';
export const COURSE_NAME = 'Anatomy & Physiology';
export const COURSE_ID = `${SITE}${BASE}#course`;
export const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cloud.umami.is; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://bsfcqrczehbcctwhxmrj.supabase.co https://cdn.jsdelivr.net https://*.workers.dev https://cloud.umami.is https://gateway.umami.is; media-src 'self'; base-uri 'self'; object-src 'none'";
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
  const built = new Set(map.topics.map(t => t.id).filter(id => lessons[id] && notes[id] && questions[id]));
  const chapterOf = id => map.chapters.find(c => c.id === map.topics[topicIndex.get(id)].chapter);
  return { map, topicIndex, concepts, lessons, notes, questions, glossary, figures, built, chapterOf, data };
}

/* ------------------------------------------------------------- the head */

export function clampTitle(cands) {
  for (const c of cands) if (c.length <= 60) return c;
  return cands[cands.length - 1].slice(0, 57).replace(/\s+\S*$/, '') + '…';
}
export function clampDesc(s) {
  s = text(s);
  if (s.length <= 158) return s;
  const cut = s.slice(0, 157);
  const dot = cut.lastIndexOf('. ');
  return dot > 90 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

/* depth: '' for pages in anatomy-physiology/, '../' for pages one folder down. */
export function head({ title, desc, path, depth, ogType = 'article', jsonld, scripts = [], meta = '' }) {
  const url = `${SITE}${BASE}${path}`;
  const up = depth + '../';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{if(localStorage.getItem("nremt_theme")==="dark")document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
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

/* The scripts every course page ends with. section picks the active tab. */
export function tail({ depth, section, extra = [] }) {
  const s = src => `<script src="${depth}assets/${src}" defer></script>`;
  return [
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

export function footer(depth) {
  return `<footer class="anp-foot xshell">
  <p class="anp-beta-note"><span class="anp-beta">Beta</span> This course follows current published sources and is pending review by a licensed A&amp;P instructor. Spot something wrong? Every question has a “Report a problem” link.</p>
  <p class="privacy-link"><a href="${depth}../privacy.html">Privacy</a> &middot; <a href="${depth}../terms.html">Terms</a> &middot; <a href="${depth}../sources.html">Sources</a> &middot; <a href="${depth}credits.html">Figure credits</a></p>
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
  return out.map(x => ({ ...x, re: termRegex(x.t) }));
}

/* Where a concept is taught, as a link from `fromDepth`, or null when that
   page is not built yet (spec section 7: plain text plus hover until then). */
export function teachHref(C, conceptId, fromDepth, selfTopic) {
  const c = C.concepts.get(conceptId);
  if (!c || !C.built.has(c.taughtIn) || c.taughtIn === selfTopic) return null;
  return `${fromDepth}notes/${c.taughtIn}.html`;
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
    for (const { t, id, re } of index) {
      if (seen.has(id)) continue;
      re.lastIndex = 0;
      const m = re.exec(s);
      if (!m) continue;
      // Never mark inside a mark already placed in this text node.
      const start = m.index, end = start + m[0].length;
      if (marks.some(k => start < k.end && end > k.start)) continue;
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
export function laterLabel(C, l, topicId) {
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

export function figureImg(C, figId, depth, { masks = true, topic = null } = {}) {
  const f = C.figures[figId];
  if (!f) return '';
  const src = `${depth}figures/${figId}.${f.ext || 'jpg'}`;
  const all = (f.labels || []).filter(l => l.box);
  const covered = all.filter(l => laterLabel(C, l, topic));
  const labels = all.filter(l => !covered.includes(l));
  const W = f.w || 1000, H = f.h || 1000;
  const pct = (v, of) => (100 * v / of).toFixed(2) + '%';
  const at = b => `left:${pct(b[0], W)};top:${pct(b[1], H)};width:${pct(b[2], W)};height:${pct(b[3], H)}`;
  const maskHtml = masks && labels.length ? labels.map(l =>
    `<button type="button" class="anp-mask" data-label="${esc(l.id)}" aria-label="Hidden label: ${esc(l.name)}. Select to reveal." style="${at(l.box)}"><span>${esc(l.name)}</span></button>`).join('') : '';
  const coverHtml = covered.map(l => `<span class="anp-cover" aria-hidden="true" style="${at(l.box)}"></span>`).join('');
  return `<div class="anp-figimg${masks && labels.length ? ' has-masks' : ''}" data-fig="${esc(figId)}"><img src="${src}" alt="${esc(f.alt)}" width="${W}" height="${H}" loading="lazy" decoding="async">${coverHtml}${maskHtml}</div>`;
}

export function credit(f) {
  if (!f) return '';
  if (f.source === 'openstax') {
    const page = f.openstax && f.openstax.page
      ? `https://openstax.org/books/anatomy-and-physiology-2e/pages/${f.openstax.page}`
      : 'https://openstax.org/details/books/anatomy-and-physiology-2e';
    return `<span class="anp-credit">${esc(f.credit)}, <a href="${page}">openstax.org</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>${f.modified ? ', modified' : ''}.</span>`;
  }
  return f.credit ? `<span class="anp-credit">${esc(f.credit)} (${esc(f.license)}).</span>` : '';
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
    const cr = fig ? ' ' + credit(C.figures[fig]) : '';
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
    fig: q.figure && C.figures[q.figure] ? figForQuestion(C, q.figure, topicId) : undefined,
  };
}

function figForQuestion(C, id, topicId) {
  const f = C.figures[id], W = f.w || 1000, H = f.h || 800;
  const covers = (f.labels || []).filter(l => l.box && laterLabel(C, l, topicId))
    .map(l => [l.box[0] / W, l.box[1] / H, l.box[2] / W, l.box[3] / H].map(v => +(100 * v).toFixed(2)));
  return { src: `figures/${id}.${f.ext || 'jpg'}`, alt: f.alt, w: W, h: H, ...(covers.length ? { covers } : {}) };
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
