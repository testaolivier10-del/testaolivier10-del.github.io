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
                            every term in the normalized shape all four courses
                            serve (scripts/lib/glossary.mjs), read by the shared
                            popups (assets/course/glossary-tip.js: notes, the
                            textbook and the interactive lessons), the shared
                            glossary page (assets/course/glossary-page.js),
                            site search and the tutor ("term" and "def").
   ochem/glossary.html      the shared glossary page; every definition is drawn
                            from the JSON, and a <noscript> index lists every
                            term name linking to its section.

     node scripts/build-ochem-glossary.mjs            rewrite
     node scripts/build-ochem-glossary.mjs --check    fail if stale or invalid (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { CSP } from './lib/site-config.mjs';
import { glossaryJson, glossaryMain, glossaryScript, byTerm } from './lib/glossary.mjs';

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
entries.sort(byTerm); // the printed-glossary order of scripts/lib/glossary.mjs

/* ---- runtime JSON: the normalized shape every course serves -------------- */
// scripts/lib/glossary.mjs. "term" and "def" are also the key names the
// tutor's data indexer (extractFromData in assets/tutor.js) reads.
const usedTopics = [...new Set(entries.map((e) => e.topic))];
const chapters = modules.map((m, i) => ({ id: i + 1, title: `${i + 1}. ${m.title}` }));
const jsonOut = glossaryJson({
  chapters,
  terms: entries.map((e) => ({
    id: e.id, term: e.term, def: e.def, topic: e.topic, topicTitle: topics.get(e.topic).title,
    href: `notes/${e.topic}.html`, aka: e.aliases, chapter: topics.get(e.topic).ch, pop: e.pop ? 1 : 0,
  })),
}) + '\n';

/* ---- the page ------------------------------------------------------------ */
const title = 'Glossary of Key Terms — Organic Chemistry | LevlPrep';
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

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="preload" href="/assets/fonts/nunito-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
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
<link rel="stylesheet" href="../assets/course/base.css">
<link rel="stylesheet" href="../assets/course/glossary.css">
<script src="../assets/errors.js" defer></script>
<script src="../assets/account.js" defer></script>
<script src="../assets/hub-progress.js" defer></script>
<script src="../assets/chime.js" defer></script>
<script src="../assets/site-chrome.js" defer></script>
<script src="assets/ochem-xp.js" defer></script>
<link rel="stylesheet" href="assets/ochem.css">
<link rel="stylesheet" href="../assets/fonts/fonts.css">
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${JSON.stringify(ld).replace(/<\//g, '<\\/')}
</script>
</head>
<body data-course="ochem">
<header id="site-header"></header>
<div class="course-nav"></div>
<main id="main" class="xshell">
  ${glossaryMain({
    crumbs: [{ name: 'LevlPrep', href: '/' }, { name: 'Organic Chemistry', href: '/ochem/' }, { name: 'Glossary' }],
    courseHtml: 'Organic Chemistry',
    lede: `${entries.length} terms from all ${modules.length} chapters, in plain words. Each one links to the section that teaches it.`,
    chapters, terms: JSON.parse(jsonOut).terms, placeholder: 'e.g. enolate, SN2, chirality', searchHref: 'search.html',
  })}
</main>
<script>
  window.OCHEM_SECTION = 'glossary';
  window.OCHEM_BASE = '';
</script>
<script src="assets/ochem-nav.js" defer></script>
${glossaryScript('glossary-page.js', { up: '../', data: 'assets/glossary.json', root: '' })}
<div class="xshell">
  <footer>
    <p class="privacy-link"><a href="../privacy.html">Privacy</a> &middot; <a href="../terms.html">Terms</a> &middot; <a href="../about.html">About</a> &middot; <a href="../sources.html">Sources</a> &middot; <a href="../changelog.html">What&rsquo;s new</a> &middot; <a href="../premium.html">Premium</a> &middot; <a href="../account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
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
