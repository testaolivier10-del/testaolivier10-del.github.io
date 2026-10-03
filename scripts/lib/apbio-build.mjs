/* Data loading, page templates and helpers for the AP® Biology generator
   (scripts/build-apbio.mjs) and its content check (scripts/check-apbio-content.mjs).

   Forked from scripts/lib/anp-build.mjs (docs/apbio-spec.md decision 1): the
   same head, footer, glossary markup and figure credits, adapted for units,
   science practices, stimulus sets and numeric answers. docs/apbio-architecture.md
   describes every data format read here.

   THE MAP. loadMap() is a small stand-in for scripts/lib/apbio-map.mjs (written
   on another branch). It reads docs/apbio-dependency-map.json when present;
   otherwise, only when APBIO_MAP_STUB=1 (tests, the Phase 0 proof run), the
   fixture scripts/test/fixtures/apbio-map-stub.json; otherwise there is no map
   and nothing is built. Its interface is deliberately small so the swap is one
   import: { chapters, topics, concepts, practices, parts, order(), topicById(id),
   chapterById(id) }, where topics is already in course order. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP } from './site-config.mjs';

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const SITE = 'https://levlprep.com';
export const BASE = '/bio/';
export const COURSE_KEY = 'apbio';              // storage, analytics, registry: never in a URL
export const COURSE_NAME = 'AP® Biology';
export const COURSE_HTML = 'AP&reg; Biology';
export const COURSE_ID = `${SITE}${BASE}#course`;
export const DISCLAIMER = 'AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.';
export const BETA_NOTE = 'This course has not yet been reviewed by an AP® Biology teacher.';
// Units 1 and 2 are free, and every skills lesson: "the first lesson of each
// skills topic", and a skills topic has one lesson (docs/apbio-spec.md
// section 1, "Free", and decision 10).
export const FREE_UNITS = ['unit-1', 'unit-2'];
export const MAP_PATH = join(ROOT, 'docs', 'apbio-dependency-map.json');
export const STUB_PATH = join(ROOT, 'scripts', 'test', 'fixtures', 'apbio-map-stub.json');

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const text = html => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&reg;/g, '®').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));

/* The token rule (spec decision 2): no "ap" or "apbio" token in a served path. */
export const hasApToken = s => String(s).toLowerCase().split(/[^a-z0-9]+/).some(t => t === 'ap' || t === 'apbio');

/* The trademark (spec section 1, decision 3): "AP®" with the ®, as an
   adjective before a capitalized noun ("AP® Biology"), never plural or
   possessive. Returns problems found in a piece of authored text. */
export function trademarkProblems(s) {
  // The disclaimer is the one sentence where the mark is the subject.
  const t = String(s ?? '').replace(/&reg;/g, '®').replace(/<[^>]+>/g, ' ').split(DISCLAIMER).join(' ');
  const out = [];
  for (const m of t.matchAll(/\bAP\b(®?)(\S*)/g)) {
    const [all, reg, after] = m;
    if (!reg) out.push(`"${all}": write "AP®", with the ®`);
    else if (/^(s|'s|’s)\b/.test(after) || /^(s|'s|’s)$/.test(after)) out.push(`"${all}": the mark is never plural or possessive`);
    else if (after) out.push(`"${all}": "AP®" is followed by a space and a noun ("AP® Biology")`);
    else {
      const next = t.slice(m.index + all.length).match(/^\s+(\S+)/);
      if (!next || !/^[A-Z]/.test(next[1])) out.push(`"AP®${next ? ' ' + next[1] : ''}": use the mark as an adjective before a capitalized noun ("AP® Biology")`);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ map */

export function mapSource(env = process.env) {
  if (existsSync(MAP_PATH)) return MAP_PATH;
  if (env.APBIO_MAP_STUB === '1') return STUB_PATH;
  return null;
}

/* Validates the parts of the map this generator relies on and returns the
   interface above. Throws with every problem listed. */
export function loadMap(path = mapSource()) {
  if (!path) return null;
  const raw = readJson(path);
  const errs = [];
  for (const k of ['practices', 'parts', 'chapters', 'topics', 'concepts']) if (!Array.isArray(raw[k])) errs.push(`map: "${k}" must be an array`);
  if (errs.length) throw new Error(errs.join('\n'));
  const chapterById = new Map(raw.chapters.map(c => [c.id, c]));
  const partIds = new Set(raw.parts.map(p => p.id));
  const seen = new Set();
  for (const c of raw.chapters) {
    if (seen.has(c.id)) errs.push(`map: duplicate chapter ${c.id}`); seen.add(c.id);
    if (!partIds.has(c.part)) errs.push(`map: chapter ${c.id} has unknown part "${c.part}"`);
    if (hasApToken(c.id)) errs.push(`map: chapter id ${c.id} contains the token "ap"`);
  }
  const topicIds = new Set();
  for (const t of raw.topics) {
    if (topicIds.has(t.id)) errs.push(`map: duplicate topic ${t.id}`); topicIds.add(t.id);
    if (!chapterById.has(t.chapter)) errs.push(`map: topic ${t.id} has unknown chapter "${t.chapter}"`);
    if (hasApToken(t.id)) errs.push(`map: topic id ${t.id} contains the token "ap"`);
    if (!['concept', 'skill', 'drill'].includes(t.kind)) errs.push(`map: topic ${t.id} kind must be concept, skill or drill`);
  }
  for (const t of raw.topics) if (t.after && !topicIds.has(t.after)) errs.push(`map: topic ${t.id} is placed after unknown topic "${t.after}"`);
  for (const c of raw.concepts) {
    if (!topicIds.has(c.taughtIn)) errs.push(`map: concept ${c.id} taught in unknown topic "${c.taughtIn}"`);
    c.aliases = c.aliases || []; c.dependsOn = c.dependsOn || [];
  }
  if (errs.length) throw new Error(errs.join('\n'));

  /* Course order (spec section 4): unit topics in CED order, each skill or
     drill topic right after its "after" topic. */
  const cedKey = t => String(t.ced || '').split('.').map(n => String(+n).padStart(3, '0')).join('.');
  const chN = c => c.n ?? 999;
  const main = raw.topics.filter(t => !t.after)
    .map((t, i) => ({ t, i }))
    .sort((a, b) => chN(chapterById.get(a.t.chapter)) - chN(chapterById.get(b.t.chapter)) || (a.t.ced && b.t.ced ? cedKey(a.t).localeCompare(cedKey(b.t)) : 0) || a.i - b.i)
    .map(x => x.t);
  const ordered = [];
  const place = t => { ordered.push(t); for (const s of raw.topics.filter(x => x.after === t.id)) place(s); };
  for (const t of main) place(t);
  const byId = new Map(ordered.map(t => [t.id, t]));
  return {
    raw, path,
    practices: raw.practices, parts: raw.parts, bigIdeas: raw.bigIdeas || [],
    chapters: raw.chapters, topics: ordered, concepts: raw.concepts,
    everyday: new Set(((raw.everydayWords || {}).words || []).map(w => w.toLowerCase())),
    order: () => ordered.slice(),
    topicById: id => byId.get(id),
    chapterById: id => chapterById.get(id),
  };
}

/* ------------------------------------------------------------------ data */

function mergeDir(dir) {
  const all = {};
  if (!existsSync(dir)) return all;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    for (const [k, v] of Object.entries(readJson(join(dir, f)))) if (!(k in all)) all[k] = { ...v, _file: f };
  }
  return all;
}

/* published: override for tests (an array of chapter ids). */
export function loadCourse(root = ROOT, { map = loadMap(), published: pubOverride, data: dataDir } = {}) {
  const data = dataDir || join(root, 'bio', 'data');
  const lessons = {}, notes = {}, questions = {};
  const topics = map ? map.topics : [];
  for (const t of topics) {
    const lp = join(data, 'lessons', `${t.id}.json`), np = join(data, 'notes', `${t.id}.html`), qp = join(data, 'questions', `${t.id}.json`);
    if (existsSync(lp)) lessons[t.id] = readJson(lp);
    if (existsSync(np)) notes[t.id] = readFileSync(np, 'utf8');
    if (existsSync(qp)) questions[t.id] = readJson(qp);
  }
  const glossary = mergeDir(join(data, 'glossary'));
  const figures = mergeDir(join(data, 'figures'));
  const labelDir = join(data, 'labels');
  if (existsSync(labelDir)) for (const f of readdirSync(labelDir).filter(f => f.endsWith('.json'))) {
    const id = f.slice(0, -5);
    if (figures[id]) figures[id] = { ...figures[id], labels: readJson(join(labelDir, f)).labels || [] };
  }
  const frq = {};
  const frqDir = join(data, 'frq');
  if (existsSync(frqDir)) for (const f of readdirSync(frqDir).filter(f => f.endsWith('.json')).sort()) frq[f.slice(0, -5)] = readJson(join(frqDir, f));
  const pubPath = join(data, 'published.json');
  const published = new Set(pubOverride || (existsSync(pubPath) ? readJson(pubPath).chapters || [] : []));
  const readOpt = (f, d) => existsSync(join(data, f)) ? readJson(join(data, f)) : d;
  // A skills topic also waits for the chapter of the topic it sits after
  // (Hardy-Weinberg math publishes with Unit 7, Simpson's index with Unit 8).
  const anchorLive = t => { const a = t.after && topics.find(x => x.id === t.after); return !a || published.has(a.chapter); };
  const built = new Set(topics.filter(t => lessons[t.id] && notes[t.id] && questions[t.id] && published.has(t.chapter) && anchorLive(t)).map(t => t.id));
  return {
    map, data, lessons, notes, questions, glossary, figures, frq, published, built,
    pages: readOpt('pages.json', { apps: [], tools: [] }),
    descriptions: readOpt('descriptions.json', {}),
  };
}

/* Free lessons (structured data and the runtime gate agree on this):
   Units 1 and 2, and the first topic of each skills chapter. */
export function isFreeTopic(map, t) {
  const ch = map.chapterById(t.chapter);
  if (FREE_UNITS.includes(t.chapter)) return true;
  return !!(ch && ch.part !== 'course');
}

/* ------------------------------------------------------------- the head */

const REFERS_BACK = /^(That|This|These|Those|It|Its|They|Their|Them|So|But|And|Or|Then|Here|There|Both|Each|Such|Now|Also|Yet|Instead|Because|Which|We)\b/;
/* Whole sentences that fit, else the fallback (as scripts/lib/anp-build.mjs). */
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
  }
  if (fallback) return clampDesc(fallback);
  return s.slice(0, 157).replace(/\s+\S*$/, '') + '…';
}
/* Meta descriptions never carry the mark (spec decision 3). */
export const stripMark = s => String(s).replace(/\bAP®?\s*/g, '').replace(/\s+/g, ' ').trim();

export const NOINDEX = '<meta name="robots" content="noindex, follow">';

/* depth: '' for pages in bio/, '../' one folder down. */
export function head({ title, desc, path, depth, ogType = 'article', jsonld, meta = '', noindex = false }) {
  const url = `${SITE}${BASE}${path}`;
  const up = depth + '../';
  desc = stripMark(desc);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="preload" href="/assets/fonts/nunito-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}assets/icon-180.png">
<link rel="manifest" href="${depth}manifest.json">
<meta name="theme-color" content="#16332E">
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? `${NOINDEX}\n` : ''}<link rel="canonical" href="${url}">
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
<link rel="stylesheet" href="${depth}assets/bio.css">
<link rel="stylesheet" href="${up}assets/fonts/fonts.css">
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>`;
}

/* The scripts every course page ends with. premium loads the site's Premium
   module first on pages with a Premium surface; ApBioCore does without it. */
export function tail({ depth, section, extra = [], premium = false, site = [] }) {
  const s = src => `<script src="${depth}assets/${src}" defer></script>`;
  return [
    ...['report-question.js', ...site].map(f => `<script src="${depth}../assets/${f}" defer></script>`),
    ...(premium ? [`<script src="${depth}../assets/premium.js" defer></script>`] : []),
    `<script>window.ApBioSection = '${section}'; window.ApBioBase = '${depth}';</script>`,
    s('bio-curriculum.js'), s('bio-core.js'), s('bio-glossary.js'), s('bio-nav.js'),
    ...extra.map(s),
  ].join('\n');
}

export function crumbs(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })) };
}
export const orgCrumbs = extra => [{ name: 'LevlPrep', url: `${SITE}/` }, { name: COURSE_NAME, url: `${SITE}${BASE}` }, ...extra];
export function crumbNav(items) {
  return `<nav class="bio-crumb bio-nav-ref" aria-label="Breadcrumb">${items.map((it, i) =>
    i === items.length - 1 ? `<span aria-current="page">${esc(it.name)}</span>`
      : `<a href="${it.href}">${esc(it.name)}</a> <span aria-hidden="true">&rsaquo;</span>`).join(' ')}</nav>`;
}

/* Beta until an AP® Biology teacher signs off (docs/apbio-needs-author.md,
   teacher-review). bio-nav-ref: a label, not teaching. */
export const BETA_PILL = '<span class="bio-beta bio-nav-ref">Beta</span>';

/* "Report a problem" for a page, through the site dialog (assets/report-question.js). */
export const reportButton = (pageId) => `<button type="button" class="report-btn" data-report-kind="page" data-report-course="${COURSE_KEY}" data-report-question="${esc(pageId)}">Report a problem</button>`;

/* Every page: the Beta note, the trademark disclaimer and Report a problem
   (spec section 1, "Quality" and "Trademark"; site rules apbio-trademark and
   apbio-beta-and-report). */
export function footer(depth, pageId) {
  return `<footer class="bio-foot xshell">
  <p class="bio-accuracy-note">${BETA_PILL} ${esc(BETA_NOTE)} It follows the published course framework and open textbooks, listed on the <a href="${depth}../sources.html">Sources</a> page. Spot a mistake? <span class="bio-nav-ref">${reportButton(pageId)}</span></p>
  <p class="bio-disclaimer">${esc(DISCLAIMER)}</p>
  <p class="privacy-link"><a href="${depth}../privacy.html">Privacy</a> &middot; <a href="${depth}../terms.html">Terms</a> &middot; <a href="${depth}../sources.html">Sources</a> &middot; <a href="${depth}../premium.html">Premium</a> &middot; <a href="${depth}../account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
</footer>`;
}

/* ------------------------------------------------------------ glossary */

const termRe = t => new RegExp(`(?<![A-Za-z0-9-])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9-])`, /^[A-Z0-9]+$/.test(t) ? 'g' : 'gi');
/* Every term and alias of every concept with a definition, longest first. */
export function termIndex(C) {
  const out = [];
  for (const c of C.map.concepts) {
    if (!C.glossary[c.id]) continue;
    for (const t of [c.term, ...c.aliases]) if (t && t.length > 1) out.push({ t, id: c.id, re: termRe(t) });
  }
  return out.sort((a, b) => b.t.length - a.t.length);
}

const SKIP_TAGS = new Set(['a', 'script', 'style', 'svg', 'h1', 'h2', 'h3', 'code', 'button', 'summary', 'figcaption', 'th', 'label', 'title', 'nav', 'caption']);
const VOID = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'ellipse', 'wbr']);

/* Marks the first use of each defined term on a page: a link to the notes
   page that teaches it when that page is built, else a hover span. */
export function glossify(C, html, { depth, topic, seen, index }) {
  const parts = String(html).split(/(<[^>]+>)/);
  const stack = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      const m = p.match(/^<\s*(\/)?\s*([a-zA-Z0-9]+)/);
      if (m) {
        const tag = m[2].toLowerCase();
        if (m[1]) { const k = stack.lastIndexOf(tag); if (k > -1) stack.length = k; }
        else if (!/\/>$/.test(p) && !VOID.has(tag)) stack.push(tag);
      }
      continue;
    }
    if (!p.trim() || stack.some(t => SKIP_TAGS.has(t))) continue;
    let s = p;
    const marks = [];
    for (const { id, re } of index) {
      if (seen.has(id)) continue;
      re.lastIndex = 0;
      const m = re.exec(s);
      if (!m) continue;
      const start = m.index, end = start + m[0].length;
      if (marks.some(k => start < k.end && end > k.start)) continue;
      seen.add(id);
      marks.push({ start, end, id, word: m[0] });
    }
    marks.sort((a, b) => b.start - a.start);
    for (const k of marks) {
      const c = C.map.concepts.find(x => x.id === k.id);
      const href = c && C.built.has(c.taughtIn) && c.taughtIn !== topic ? `${depth}notes/${c.taughtIn}.html` : null;
      const tag = href ? `<a class="gl" href="${href}" data-c="${k.id}">${k.word}</a>` : `<span class="gl" tabindex="0" data-c="${k.id}">${k.word}</span>`;
      s = s.slice(0, k.start) + tag + s.slice(k.end);
    }
    parts[i] = s;
  }
  return parts.join('');
}

/* ------------------------------------------------------------- figures */

export const OPENSTAX_BIO = 'Mary Ann Clark, Matthew Douglas and Jung Choi, Biology 2e, OpenStax, © Rice University';
const OPENSTAX_BIO_HTML = 'Mary Ann Clark, Matthew Douglas and Jung Choi, <i>Biology 2e</i>, OpenStax, &copy; Rice University';
export const ALLOWED_LICENSES = ['CC BY 4.0', 'Public domain', 'LevlPrep original'];
const LICENSE_URL = { 'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/', 'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/' };

/* { text, html } credit for a figure as shown; adapted when labels are hidden. */
export function attribution(f, { adapted = false } = {}) {
  if (!f) return { text: '', html: '' };
  const ad = adapted ? ' Adapted: labels hidden.' : '';
  if (f.source === 'openstax') {
    const n = f.openstax && f.openstax.figure;
    const page = f.openstax && f.openstax.page ? `https://openstax.org/books/biology-2e/pages/${f.openstax.page}` : 'https://openstax.org/details/books/biology-2e';
    return {
      text: `Figure ${n} from ${OPENSTAX_BIO}, CC BY 4.0.${ad}`,
      html: `Figure ${esc(n)} from ${OPENSTAX_BIO_HTML}, <a href="${page}">openstax.org</a>, <a href="${LICENSE_URL['CC BY 4.0']}" rel="license">CC BY 4.0</a>.${ad}`,
    };
  }
  if (f.source === 'levlprep') return { text: 'LevlPrep original diagram.', html: 'LevlPrep original diagram.' };
  if (!f.credit) return { text: '', html: '' };
  const lic = LICENSE_URL[f.license] ? `<a href="${LICENSE_URL[f.license]}" rel="license">${esc(f.license)}</a>` : esc(f.license);
  return { text: `${f.credit} (${f.license}).${ad}`, html: `${esc(f.credit)} (${lic}).${ad}` };
}

/* One figure's markup: an <img> for raster or SVG files, with masks for
   labelled figures when asked. */
export function figureImg(C, figId, depth, { masks = false } = {}) {
  const f = C.figures[figId];
  if (!f) return '';
  const W = f.w || 800, H = f.h || 600;
  const labels = (f.labels || []).filter(l => l.box);
  const pct = (v, of) => (100 * v / of).toFixed(2) + '%';
  const maskHtml = masks ? labels.map(l => `<button type="button" class="bio-mask" data-label="${esc(l.id)}" aria-label="Hidden label: ${esc(l.name)}. Select to reveal." style="left:${pct(l.box[0], W)};top:${pct(l.box[1], H)};width:${pct(l.box[2], W)};height:${pct(l.box[3], H)}"><span>${esc(l.name)}</span></button>`).join('') : '';
  return `<div class="bio-figimg${maskHtml ? ' has-masks' : ''}" data-fig="${esc(figId)}"><img src="${depth}figures/${figId}.${f.ext || 'svg'}" alt="${esc(f.alt)}" width="${W}" height="${H}" loading="lazy" decoding="async">${maskHtml}</div>`;
}
export const credit = (f, opts) => { const a = attribution(f, opts); return a.html ? `<span class="bio-credit">${a.html}</span>` : ''; };

/* Numbers every <figure> on a page and fills <figure data-fig> with its image. */
export function renderFigures(C, html, depth) {
  let n = 0;
  return String(html).replace(/<figure\b([^>]*)>([\s\S]*?)<\/figure>/g, (all, attrs, inner) => {
    n++;
    const fig = (attrs.match(/\bdata-fig="([^"]+)"/) || [])[1];
    const cap = ((inner.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1] || '').replace(/^\s*(<b>)?\s*Figure\s+\d+[.:]?\s*(<\/b>)?\s*/i, '');
    const body = fig ? figureImg(C, fig, depth) : inner.replace(/<figcaption>[\s\S]*?<\/figcaption>/, '');
    const cr = fig ? ' ' + credit(C.figures[fig]) : '';
    const rest = attrs.replace(/\bdata-fig="[^"]*"/, '').replace(/\bclass="[^"]*"/, '');
    return `<figure${rest} class="bio-figure">${body}<figcaption><b>Figure ${n}.</b> ${cap}${cr}</figcaption></figure>`;
  });
}

/* ---------------------------------------------------- charts (stimuli) */

/* A small, accessible chart drawn at build time from data, so a graph
   stimulus is authored as numbers, not as a picture:
   { type: "line"|"bar", x: { label, unit?, categories? }, y: { label, unit?, min?, max?, step? },
     series: [{ name, points: [[x, y, err?], ...] }] }
   err draws an error bar (±err). The SVG is role="img" with a label; the
   data table follows in a <details> for screen readers and for checking. */
const SERIES_CLASS = ['s1', 's2', 's3', 's4', 's5'];
const fmt = v => (Math.round(v * 1000) / 1000).toString();
export function chartSvg(spec, title = '') {
  const W = 560, H = 320, L = 64, R = 18, T = 18, B = 58;
  const pw = W - L - R, ph = H - T - B;
  const series = spec.series || [];
  const isBar = spec.type === 'bar';
  const cats = isBar ? (spec.x.categories || [...new Set(series.flatMap(s => s.points.map(p => p[0])))]) : null;
  const ys = series.flatMap(s => s.points.flatMap(p => [p[1] + (p[2] || 0), p[1] - (p[2] || 0)]));
  const yMin = spec.y.min ?? Math.min(0, ...ys), yMax = spec.y.max ?? Math.max(...ys) * 1.1;
  const step = spec.y.step || niceStep((yMax - yMin) / 5);
  const sy = v => T + ph - (v - yMin) / (yMax - yMin) * ph;
  let xs, sx;
  if (!isBar) {
    const xv = series.flatMap(s => s.points.map(p => p[0]));
    const xMin = spec.x.min ?? Math.min(...xv), xMax = spec.x.max ?? Math.max(...xv);
    sx = v => L + (v - xMin) / ((xMax - xMin) || 1) * pw;
    const xstep = spec.x.step || niceStep((xMax - xMin) / 6);
    xs = []; for (let v = xMin; v <= xMax + 1e-9; v += xstep) xs.push(v);
  }
  const yt = []; for (let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step) yt.push(v);
  const axisLabel = a => esc(a.label + (a.unit ? ` (${a.unit})` : ''));
  const parts = [];
  parts.push(`<line class="axis" x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}"/><line class="axis" x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}"/>`);
  for (const v of yt) parts.push(`<line class="grid" x1="${L}" y1="${sy(v).toFixed(1)}" x2="${L + pw}" y2="${sy(v).toFixed(1)}"/><text class="tick" x="${L - 8}" y="${(sy(v) + 4).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`);
  if (isBar) {
    const gw = pw / cats.length, bw = Math.min(46, gw * 0.7 / Math.max(1, series.length));
    cats.forEach((c, ci) => {
      parts.push(`<text class="tick" x="${(L + gw * (ci + 0.5)).toFixed(1)}" y="${T + ph + 18}" text-anchor="middle">${esc(c)}</text>`);
      series.forEach((s, si) => {
        const p = s.points.find(q => q[0] === c);
        if (!p) return;
        const x = L + gw * (ci + 0.5) - bw * series.length / 2 + bw * si;
        parts.push(`<rect class="bar ${SERIES_CLASS[si % SERIES_CLASS.length]}" x="${x.toFixed(1)}" y="${sy(Math.max(p[1], 0)).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${Math.abs(sy(p[1]) - sy(0)).toFixed(1)}"/>`);
        if (p[2]) parts.push(errBar(x + (bw - 4) / 2, sy(p[1] + p[2]), sy(p[1] - p[2])));
      });
    });
  } else {
    for (const v of xs) parts.push(`<text class="tick" x="${sx(v).toFixed(1)}" y="${T + ph + 18}" text-anchor="middle">${fmt(v)}</text>`);
    series.forEach((s, si) => {
      const cls = SERIES_CLASS[si % SERIES_CLASS.length];
      parts.push(`<polyline class="series ${cls}" points="${s.points.map(p => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ')}"/>`);
      for (const p of s.points) {
        parts.push(si % 2 ? `<rect class="pt ${cls}" x="${(sx(p[0]) - 4).toFixed(1)}" y="${(sy(p[1]) - 4).toFixed(1)}" width="8" height="8"/>` : `<circle class="pt ${cls}" cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="4.5"/>`);
        if (p[2]) parts.push(errBar(sx(p[0]), sy(p[1] + p[2]), sy(p[1] - p[2])));
      }
    });
  }
  parts.push(`<text class="lbl" x="${L + pw / 2}" y="${H - 12}" text-anchor="middle">${axisLabel(spec.x)}</text>`);
  parts.push(`<text class="lbl" transform="translate(16 ${T + ph / 2}) rotate(-90)" text-anchor="middle">${axisLabel(spec.y)}</text>`);
  const legend = series.length > 1 ? `<p class="bio-legend">${series.map((s, si) => `<span class="${SERIES_CLASS[si % SERIES_CLASS.length]}"><i aria-hidden="true"></i>${esc(s.name)}</span>`).join('')}</p>` : '';
  const label = `${title ? `${title}: ` : ''}${isBar ? 'bar' : 'line'} graph of ${text(spec.y.label)} against ${text(spec.x.label)}${series.length > 1 ? ` for ${series.map(s => s.name).join(', ')}` : ''}. The data table follows.`;
  const anyErr = series.some(s => s.points.some(p => p[2]));
  const xHead = axisLabel(spec.x);
  const table = `<details class="bio-chart-data"><summary>Data table</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Data table"><table><thead><tr><th scope="col">${xHead}</th>${series.map(s => `<th scope="col">${esc(s.name || text(spec.y.label))}${anyErr ? ' (± error)' : ''}</th>`).join('')}</tr></thead><tbody>${
    [...new Set(series.flatMap(s => s.points.map(p => p[0])))].map(x => `<tr><th scope="row">${esc(x)}</th>${series.map(s => { const p = s.points.find(q => q[0] === x); return `<td>${p ? fmt(p[1]) + (p[2] ? ` ± ${fmt(p[2])}` : '') : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  return `<div class="bio-chart"><svg class="bio-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${parts.join('')}</svg>${legend}${table}</div>`;
}
function errBar(x, y1, y2) {
  return `<path class="err" d="M${x.toFixed(1)} ${y1.toFixed(1)}V${y2.toFixed(1)}M${(x - 5).toFixed(1)} ${y1.toFixed(1)}h10M${(x - 5).toFixed(1)} ${y2.toFixed(1)}h10"/>`;
}
function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * p) return m * p;
  return 10 * p;
}

/* ------------------------------------------------------------ stimuli */

export function tableHtml(t) {
  const cap = t.caption ? `<caption>${t.caption}</caption>` : '';
  return `<table class="bio-data">${cap}<thead><tr>${t.cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((v, i) => i === 0 ? `<th scope="row">${v}</th>` : `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

/* The body of a stimulus panel, as HTML, from its authored form:
   { kind, title, text?, html? | table? | figure? | chart? }. Built once and
   carried in the bank, so the runtime only places it. depth is the path from
   the page to bio/ (the bank uses '' and the runtime prefixes ApBioBase). */
export function stimulusBody(C, s, depth = '') {
  const out = [];
  if (s.text) out.push(`<div class="bio-stim-text">${s.text}</div>`);
  // Wrapped here, not only by the page generator: the bank and page data carry
  // this HTML to the runtime, which places it as is.
  if (s.table) out.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(text(s.table.caption || s.title || 'Data table'))}">${tableHtml(s.table)}</div>`);
  if (s.chart) out.push(chartSvg(s.chart, s.title));
  if (s.figure && C.figures[s.figure]) out.push(`<figure class="bio-figure">${figureImg(C, s.figure, depth)}<figcaption>${credit(C.figures[s.figure])}</figcaption></figure>`);
  if (s.html) out.push(`<div class="bio-stim-html">${s.html}</div>`);
  return out.join('');
}
export const STIM_KIND = { table: 'Data table', graph: 'Graph', setup: 'Experimental setup', model: 'Model' };
export function stimulusPanel(id, s, bodyHtml) {
  return `<section class="bio-stim" data-stim="${esc(id)}" aria-labelledby="stim-${esc(id)}"><p class="bio-stim-k">${STIM_KIND[s.kind] || 'Stimulus'}</p><h3 id="stim-${esc(id)}">${esc(s.title || '')}</h3>${bodyHtml}</section>`;
}

/* ---------------------------------------------------------- questions */

/* A question as a page or the bank carries it. unit, topic and practice are
   copied from the item itself: never inferred (spec section 1). */
export function questionForPage(q) {
  return {
    id: q.id, type: q.type, unit: q.unit, topic: q.topic, practice: q.practice, level: q.level, diff: q.diff,
    ...(q.stimulus ? { stimulus: q.stimulus } : {}), ...(q.fixed ? { fixed: true } : {}),
    q: q.q, options: q.options, correct: q.correct, numeric: q.numeric, variables: q.variables, why: q.why,
  };
}

const PRED = { up: 'increases', down: 'decreases', none: 'no change' };
/* The question as static HTML, readable without JavaScript; bio-questions.js
   swaps in the live version. */
export function questionHtml(q, n) {
  let opts = '', key = '';
  if (q.type === 'predict') {
    opts = `<table class="bio-predict"><thead><tr><th scope="col">Variable</th><th scope="col">Change</th></tr></thead><tbody>${q.variables.map(v => `<tr><th scope="row">${v.name}</th><td>—</td></tr>`).join('')}</tbody></table>`;
    key = q.variables.map(v => `<li><b>${v.name}: ${PRED[v.answer]}.</b> ${v.why || ''}</li>`).join('');
  } else if (q.type === 'numeric') {
    const u = q.numeric.unit ? ` ${esc(q.numeric.unit)}` : '';
    opts = `<p class="bio-small">Type a number${u ? ` in${u}` : ''}.</p>`;
    key = `<li>Answer: ${Number(q.numeric.answer).toFixed(q.numeric.decimals ?? 2)}${u}</li>`;
  } else {
    opts = `<ol class="bio-opts">${(q.options || []).map(o => `<li>${o}</li>`).join('')}</ol>`;
    key = q.type === 'order'
      ? `<li>Correct order: ${q.options.map((o, i) => `${i + 1}. ${o}`).join(' ')}</li>`
      : (q.options || []).map((o, i) => `<li>${[].concat(q.correct).includes(i) ? '<b>Correct:</b> ' : ''}${o}: ${((q.why || {}).options || [])[i] || ''}</li>`).join('');
  }
  return `<div class="bio-q" data-qid="${esc(q.id)}"><p class="bio-q-stem"><span class="bio-q-n">${n}.</span> ${q.q}</p>${opts}<details class="bio-q-key"><summary>Show the answer</summary>${q.why && q.why.correct ? `<p>${q.why.correct}</p>` : ''}<ul>${key}</ul></details></div>`;
}

/* Consecutive items sharing a stimulus, in authored order:
   [{ stimulus: id|null, items: [...] }]. */
export function groupSets(items) {
  const out = [];
  for (const q of items) {
    const last = out[out.length - 1];
    if (q.stimulus && last && last.stimulus === q.stimulus) last.items.push(q);
    else out.push({ stimulus: q.stimulus || null, items: [q] });
  }
  return out;
}
