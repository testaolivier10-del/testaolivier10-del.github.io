/* The shared glossary layer for every course (docs/course-shell.md, W-A).

   Each course's generator (build-nremt-glossary, build-ochem-glossary,
   build-anp, build-apbio) hands its terms to this module and gets back:

   glossaryJson({ chapters, terms })
       <course>/assets/glossary.json in the one shape the shared scripts read
       (assets/course/glossary-page.js and glossary-tip.js):
         { "chapters": [{ "id", "title" }],
           "terms": [{ "id", "term", "def", "topic", "topicTitle", "href",
                       "aka": [], "roots": [["root","meaning"]], "say",
                       "chapter", "pop"? }] }
       href is relative to the course root ("notes/x.html",
       "study-notes.html#ch5-terminology"), empty when the teaching page does
       not exist. chapter is a key into chapters (the chapter/unit filter on
       the glossary page). pop: 0 keeps a term off runtime marking (a word too
       ordinary to underline in prose); it stays on the glossary page. def may
       carry <i>, <b>, <em>, <strong>, <sub>, <sup>; nothing else.

   glossaryMain({ ... })
       the page body the four glossary pages share: breadcrumb, opener,
       search, chapter filter, the A-Z rail, and a list the script fills. The
       rail and the filter are written here so nothing moves when the script
       runs; the list ships as a <noscript> index of names (each linking to
       its teaching page) for a reader without JavaScript.

   Terms sort the way a printed glossary does: a leading Greek letter reads as
   its name (α-amino acid under A), locants and isotope numbers are skipped
   (1,2-shift under S, ¹³C NMR under C), and a strand end reads as words
   (5′ end as "five prime end", under F). */

const GREEK = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu', 'π': 'pi', 'σ': 'sigma', 'ω': 'omega' };
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4' };
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

export const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const plain = (s) => String(s).replace(/[αβγδεκλμπσω]/g, (c) => GREEK[c]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄]/g, (c) => SUP[c])
  .normalize('NFD').replace(/[̀-ͯ]/g, '');
export const slug = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function sortKey(s) {
  return plain(s).toLowerCase()
    .replace(/^(\d)\s*['′]\s*/, (_, d) => NUM[+d] + ' prime ')
    .replace(/^[^a-z]+/, '');
}
export function letterOf(s) {
  const m = sortKey(s).match(/[a-z]/);
  return m ? m[0].toUpperCase() : 'A';
}
export const byTerm = (a, b) => sortKey(a.term).localeCompare(sortKey(b.term), 'en') || a.term.localeCompare(b.term, 'en');

/* The normalized file. Every key is written for every term (empty when the
   course has nothing for it), so a reader never has to guess. */
export function glossaryJson({ chapters, terms }) {
  const list = [...terms].sort(byTerm).map((t) => {
    const o = {
      id: t.id, term: t.term, def: t.def, topic: t.topic || '', topicTitle: t.topicTitle || '', href: t.href || '',
      aka: t.aka || [], roots: t.roots || [], say: t.say || '', chapter: t.chapter == null ? '' : String(t.chapter),
    };
    if (t.pop === 0 || t.pop === false) o.pop = 0;
    return o;
  });
  const used = new Set(list.map((t) => t.chapter));
  return JSON.stringify({ chapters: chapters.filter((c) => used.has(String(c.id))).map((c) => ({ id: String(c.id), title: c.title })), terms: list });
}

const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

/* The shared page body. crumbs: [{ name, href? }] (the last is the page).
   courseHtml: the course display name as HTML. data / root: the JSON and the
   course root, relative to the page (the page script reads them from its own
   tag, so pass them to glossaryScript too). */
export function glossaryMain({ crumbs, courseHtml, beta = false, lede, chapters, chapterWord = 'chapter', placeholder, terms, searchHref }) {
  const json = JSON.parse(glossaryJson({ chapters, terms }));
  const groups = new Map();
  for (const t of json.terms) {
    const L = letterOf(t.term);
    if (!groups.has(L)) groups.set(L, []);
    groups.get(L).push(t);
  }
  const Ch = chapterWord[0].toUpperCase() + chapterWord.slice(1);
  const crumb = `<nav class="cx-crumb" aria-label="Breadcrumb">${crumbs.map((c, i) => i === crumbs.length - 1
    ? `<span aria-current="page">${esc(c.name)}</span>`
    : `<a href="${esc(c.href)}">${esc(c.name)}</a> <span aria-hidden="true">&rsaquo;</span>`).join(' ')}</nav>`;
  const noscript = [...groups].map(([L, list]) => `<h2>${L}</h2><ul>${list.map((t) => `<li>${t.href ? `<a href="${esc(t.href)}">${esc(t.term)}</a>` : esc(t.term)}</li>`).join('')}</ul>`).join('');
  return `${crumb}
  <header class="page-head"><div class="eyebrow">${courseHtml}${beta ? ' <span class="cx-beta">Beta</span>' : ''}</div><h1>Glossary</h1><p class="lede">${lede}</p></header>
  <div class="gx">
    <div class="gx-tools">
      <div class="cx-search">${SEARCH_ICON}<label class="sr-only" for="gx-q">Find a term</label><input type="search" id="gx-q" autocomplete="off" spellcheck="false" placeholder="${esc(placeholder)}" aria-controls="gx-list"></div>
      ${json.chapters.length > 1 ? `<label class="gx-ch"><span class="sr-only">${esc(Ch)}</span><select id="gx-ch" aria-controls="gx-list"><option value="">All ${esc(chapterWord)}s</option>${json.chapters.map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('')}</select></label>` : ''}
    </div>
    <p class="gx-status" id="gx-status" role="status" aria-live="polite" aria-atomic="true"></p>
    <nav class="gx-rail" aria-label="Jump to letter">${AZ.map((L) => groups.has(L) ? `<a href="#l-${L}">${L}</a>` : `<span class="gx-off" aria-hidden="true">${L}</span>`).join('')}</nav>
    <div class="gx-list" id="gx-list"><noscript><div class="gx-noscript">${noscript}</div></noscript></div>
    <div class="cx-card cx-empty gx-none" id="gx-none" hidden><div class="cx-empty-num">0<small>terms</small></div><div><h2>No term matches</h2><p>Try fewer letters, another ${esc(chapterWord)}, or <a href="${esc(searchHref)}">search the whole course</a>.</p></div></div>
  </div>`;
}

/* The two shared scripts with their data attributes, from a page at `depth`
   (the path up to the site root, e.g. '' for nremt/glossary.html is '../'). */
export function glossaryScript(file, { up, data, root }) {
  return `<script src="${up}assets/course/${file}" data-glossary="${data}" data-course-root="${root}" defer></script>`;
}
