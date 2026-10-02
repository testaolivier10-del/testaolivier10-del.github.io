/* The ochem glossary: one source file, two outputs.

   SOURCE
   ------
   ochem/data/glossary.json is the only place a definition is written. It is
   keyed by the topic that teaches each term (a curriculum.js topic id, so the
   chapter and the link come from the curriculum rather than being retyped):

     { "sn2": [ { "term": "SN2 reaction", "def": "…", "aliases": ["SN2"],
                  "see": ["backside attack"], "pop": false? }, … ], … }

   aliases  other spellings and plurals the inline popups should also catch.
   see      other terms (by their "term" text) listed as "See also".
   pop      false keeps a term off the inline popups (a word too common in
            ordinary prose to underline), while it stays on the glossary page.

   OUTPUTS
   -------
   ochem/assets/glossary.json
                            every term and definition, fetched by two readers:
                            glossary-tip.js, which marks the first use of each
                            term in a notes section and shows its definition on
                            hover, focus or tap; and glossary-page.js, which
                            renders the glossary page and its filters. The tutor
                            indexes it too ("term" and "def" are keys it reads).
   ochem/glossary.html      a light shell. Written out in full, 500 definitions
                            made a 270 KB page (60 KB gzipped), the weight the
                            site review flagged on the A&P glossary. So the page
                            carries every term NAME, A–Z, each linking to the
                            section that teaches it: it still reads, and is
                            crawlable, without JavaScript. The definitions
                            arrive in the one JSON file the popups already use,
                            cached once for the whole course.

     node scripts/build-ochem-glossary.mjs            rewrite
     node scripts/build-ochem-glossary.mjs --check    fail if stale or invalid (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { CSP } from './lib/site-config.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const ORIGIN = 'https://levlprep.com';
const SRC = join(ROOT, 'ochem', 'data', 'glossary.json');
const OUT_JSON = join(ROOT, 'ochem', 'assets', 'glossary.json');
const OUT_HTML = join(ROOT, 'ochem', 'glossary.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* curriculum.js is a browser script, so it runs in a sandbox, as in
   build-notes-pages.mjs. */
function loadModules() {
  const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} }, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(ROOT, 'ochem', 'assets', 'curriculum.js'), 'utf8') +
    '\nthis.M = window.OchemCurriculum.MODULES;', sandbox);
  if (!Array.isArray(sandbox.M)) throw new Error('curriculum.js did not yield a MODULES array');
  return sandbox.M;
}

const GREEK = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'λ': 'lambda', 'π': 'pi', 'σ': 'sigma' };
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4' };
const plain = (s) => s.replace(/[αβγδλπσ]/g, (c) => GREEK[c]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄]/g, (c) => SUP[c])
  .normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/* Alphabetized the way a printed glossary is: a leading Greek letter is read
   as its name (α-amino acid under A), and locants and isotope numbers are
   skipped (1,2-shift under S, ¹³C NMR under C). */
const sortKey = (s) => plain(s).replace(/^[\d,\s+\-[\]]+/, '').toLowerCase();

const modules = loadModules();
const topics = new Map();
modules.forEach((m, mi) => m.topics.forEach((t) => topics.set(t.id, { title: t.title, ch: mi + 1, chTitle: m.title })));

const src = JSON.parse(readFileSync(SRC, 'utf8'));
const errors = [];
const entries = [];
const byKey = new Map();
for (const [topic, list] of Object.entries(src)) {
  if (!topics.has(topic)) { errors.push(`unknown topic "${topic}"`); continue; }
  for (const e of list) {
    const where = `${topic}: "${e.term}"`;
    if (!e.term || !e.def) { errors.push(`${where}: needs term and def`); continue; }
    if (!/[.)]$/.test(e.def)) errors.push(`${where}: definition should end with a full stop`);
    if (e.def.length > 330) errors.push(`${where}: definition is ${e.def.length} characters; keep it to two sentences (330 max)`);
    const id = slug(e.term);
    const entry = { id, topic, term: e.term, def: e.def, aliases: e.aliases || [], see: e.see || [], pop: e.pop !== false };
    for (const k of [e.term, ...entry.aliases]) {
      const key = k.toLowerCase();
      if (byKey.get(key) === entry) continue;
      if (byKey.has(key)) errors.push(`${where}: "${k}" is already used by "${byKey.get(key).term}"`);
      else byKey.set(key, entry);
    }
    entries.push(entry);
  }
}
const ids = new Set();
for (const e of entries) {
  if (ids.has(e.id)) errors.push(`duplicate id ${e.id}`);
  ids.add(e.id);
  e.seeIds = e.see.map((s) => {
    const hit = byKey.get(s.toLowerCase());
    if (!hit) { errors.push(`${e.topic}: "${e.term}" sees "${s}", which is not a term`); return null; }
    if (hit === e) errors.push(`${e.topic}: "${e.term}" sees itself`);
    return hit;
  }).filter(Boolean);
}
if (errors.length) {
  console.error(`FAIL: ochem/data/glossary.json has ${errors.length} problem(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
entries.sort((a, b) => sortKey(a.term).localeCompare(sortKey(b.term), 'en') || a.term.localeCompare(b.term, 'en'));

/* ---- runtime JSON: what the popups need and nothing else ---------------- */
const usedTopics = [...new Set(entries.map((e) => e.topic))];
const runtime = {
  // topic id -> [title, chapter number]
  topics: Object.fromEntries(usedTopics.map((t) => [t, [topics.get(t).title, topics.get(t).ch]])),
  // Objects rather than rows: "term" and "def" are key names the tutor's data
  // indexer (extractFromData in assets/tutor.js) reads as heading and body.
  terms: entries.map((e) => {
    const o = { id: e.id, term: e.term, def: e.def, topic: e.topic };
    if (e.aliases.length) o.aka = e.aliases;
    if (e.seeIds.length) o.see = e.seeIds.map((x) => x.id);
    if (!e.pop) o.pop = 0;
    return o;
  }),
};
const jsonOut = JSON.stringify(runtime) + '\n';

/* ---- the page ------------------------------------------------------------ */
const letters = [];
const groups = new Map();
for (const e of entries) {
  const L = (sortKey(e.term)[0] || '#').toUpperCase();
  if (!groups.has(L)) { groups.set(L, []); letters.push(L); }
  groups.get(L).push(e);
}
const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const title = 'Organic Chemistry Glossary — Key Terms Defined';
const desc = `${entries.length} organic chemistry terms in plain words, from atomic structure to polymers, each linked to the textbook section that teaches it.`;
const url = `${ORIGIN}/ochem/glossary.html`;
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'DefinedTermSet', '@id': `${url}#terms`, name: 'Organic Chemistry glossary', url, description: desc,
      inLanguage: 'en', isPartOf: { '@id': `${ORIGIN}/ochem/#course` }, provider: { '@id': `${ORIGIN}/#org` } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'LevlPrep', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Organic Chemistry', item: `${ORIGIN}/ochem/` },
      { '@type': 'ListItem', position: 3, name: 'Glossary', item: url },
    ] },
  ],
};

/* The no-JavaScript form of an entry: its name, linking to the section that
   teaches it. glossary-page.js replaces each letter's list with the full
   entries (same section ids, so the letter bar works either way). */
const termHtml = (e) => `<li><a href="notes/${e.topic}.html">${esc(e.term)}</a></li>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="icon" href="../assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../assets/icon-180.png">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#16332E">
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="LevlPrep">
<meta property="og:image" content="${ORIGIN}/ochem/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../assets/theme.css">
<script src="../assets/errors.js" defer></script>
<script src="../assets/account.js" defer></script>
<script src="../assets/hub-progress.js" defer></script>
<script src="../assets/chime.js" defer></script>
<script src="../assets/site-chrome.js" defer></script>
<script src="assets/ochem-xp.js" defer></script>
<link rel="stylesheet" href="assets/ochem.css">
<link rel="stylesheet" href="../assets/fonts/fonts.css">
<style>
/* This page's own styles; no other page lists terms. */
.ogl-tools{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;margin:18px 0 10px;}
.ogl-tools label{display:grid;gap:5px;font:800 13px var(--font-ui);color:var(--ink);}
.ogl-tools input,.ogl-tools select{font:700 16px var(--font-ui);color:var(--ink);background:var(--white);border:0;box-shadow:inset 0 0 0 1.5px var(--line);border-radius:12px;padding:10px 12px;min-height:44px;width:100%;}
.ogl-tools select{max-width:15em;}
.ogl-letters{display:flex;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:4px;margin:6px 0 4px;position:sticky;top:var(--site-header-h,0px);z-index:2;background:var(--paper);padding:8px 0;}
.ogl-letters::-webkit-scrollbar{display:none;}
.ogl-letters a,.ogl-letters span{flex:none;min-width:32px;min-height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;font:900 13px var(--font-ui);text-decoration:none;}
.ogl-letters a{background:var(--ctint);color:var(--cink);}
.ogl-letters span,.ogl-letters a.is-empty{color:var(--muted);opacity:.45;background:none;}
.ogl-count{font:700 13px var(--font-ui);color:var(--muted);margin:8px 0 0;}
.ogl-letter{scroll-margin-top:calc(var(--site-header-h,0px) + 60px);}
.ogl-letter h2{font-size:22px;margin:22px 0 4px;}
.ogl-letter dl{margin:0;}
.ogl-t{padding:11px 0;border-bottom:1px solid var(--line-soft);scroll-margin-top:calc(var(--site-header-h,0px) + 60px);}
.ogl-t:target{background:var(--tint-accent);border-radius:8px;padding-left:8px;padding-right:8px;}
.ogl-t dt{font-weight:900;font-size:16px;}
.ogl-t dd{margin:3px 0 0;font-weight:600;font-size:15px;line-height:1.6;}
.ogl-src,.ogl-see{display:block;font-size:13.5px;color:var(--muted);margin-top:2px;}
.ogl-none{font-weight:700;color:var(--muted);}
.ogl-names{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px 16px;font-weight:700;}
@media (max-width:520px){.ogl-tools{grid-template-columns:1fr;}.ogl-tools select{max-width:none;}}
</style>
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${JSON.stringify(ld).replace(/<\//g, '<\\/')}
</script>
</head>
<body data-course="ochem">
<header id="site-header"></header>
<div class="course-nav"></div>
<main id="main" class="xshell narrow">
  <div class="page-head">
    <div class="eyebrow">Organic Chemistry</div>
    <h1>Glossary</h1>
    <p class="lede">${entries.length} terms from all ${modules.length} chapters, in plain words. Each one links to the section that teaches it.</p>
  </div>
  <div class="ogl-tools">
    <label>Find a term <input type="search" id="oglFilter" autocomplete="off" spellcheck="false" placeholder="e.g. enolate, SN2, chirality"></label>
    <label>Chapter <select id="oglChapter"><option value="">All chapters</option>${modules.map((m, i) => `<option value="${i + 1}">${i + 1}. ${esc(m.title)}</option>`).join('')}</select></label>
  </div>
  <nav class="ogl-letters" aria-label="Jump to letter">${AZ.map((L) => groups.has(L) ? `<a href="#l-${L}">${L}</a>` : `<span aria-hidden="true">${L}</span>`).join('')}</nav>
  <p class="ogl-count" id="oglCount" aria-live="polite"></p>
  <p class="ogl-none" id="oglNone" hidden>No term matches. Try fewer letters, or <a href="search.html">search the whole course</a>.</p>
  <div id="oglList">
${letters.map((L) => `  <section class="ogl-letter" id="l-${L}"><h2>${L}</h2><ul class="ogl-names">${groups.get(L).map(termHtml).join('')}</ul></section>`).join('\n')}
  </div>
</main>
<script>
  window.OCHEM_SECTION = 'glossary';
  window.OCHEM_BASE = '';
</script>
<script src="assets/ochem-nav.js" defer></script>
<script src="assets/glossary-page.js" defer></script>
<div class="xshell">
  <footer>
    <p class="privacy-link"><a href="../privacy.html">Privacy</a> &middot; <a href="../terms.html">Terms</a> &middot; <a href="../sources.html">Sources</a> &middot; <a href="../changelog.html">What&rsquo;s new</a> &middot; <a href="../account.html">Account</a> &middot; <a href="mailto:testaolivier10@gmail.com">Contact</a></p>
  </footer>
</div>
</body>
</html>
`;

/* ---- write or check ------------------------------------------------------ */
const stale = [];
for (const [file, body] of [[OUT_JSON, jsonOut], [OUT_HTML, html]]) {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (current === body) continue;
  if (check) { stale.push(file.slice(ROOT.length + 1)); continue; }
  writeFileSync(file, body);
  console.log(`Wrote ${file.slice(ROOT.length + 1)}`);
}
if (stale.length) {
  console.error(`FAIL: ${stale.join(' and ')} ${stale.length > 1 ? 'are' : 'is'} stale. Run: node scripts/build-ochem-glossary.mjs`);
  process.exit(1);
}
console.log(`OK — ${entries.length} glossary terms across ${usedTopics.length} topics.`);
