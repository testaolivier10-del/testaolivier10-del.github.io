/* The NREMT glossary: one source file, two outputs (as ochem's).

   SOURCE
   ------
   nremt/data/glossary.json, a list of
     { "term": "Syncope", "def": "…", "section": "ch22-seizure-stroke-syncope"?,
       "aka": ["…"]?, "pop": false? }
   section  the study-notes section (nremt/assets/study-notes.json) that
            teaches the term; "Taught in" links to study-notes.html#<section>.
            Left out where no section clearly teaches it (the word only
            passes by, or appears only in a table): a wrong link is worse
            than none.
   aka      other spellings the popups should also catch.
   pop      false keeps an everyday word (Sign, Acute, Prone…) off the
            underlined terms in prose; it stays on the glossary page.
   Each term's NREMT domain lives in GLOSSARY_DOMAIN
   (scripts/lib/nremt-flashcard-sources.mjs), which the flashcard deck uses.

   OUTPUTS
   -------
   nremt/assets/glossary.json   the normalized shape every course serves
                                (scripts/lib/glossary.mjs), read by the
                                glossary page, the popups, site search and
                                the tutor.
   nremt/glossary.html          the shared glossary page.

     node scripts/build-nremt-glossary.mjs            rewrite
     node scripts/build-nremt-glossary.mjs --check    fail if stale or invalid (CI)
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP } from './lib/site-config.mjs';
import { glossaryJson, glossaryMain, glossaryScript, slug, esc } from './lib/glossary.mjs';
import { GLOSSARY_DOMAIN } from './lib/nremt-flashcard-sources.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const ORIGIN = 'https://levlprep.com';
const SRC = join(ROOT, 'nremt', 'data', 'glossary.json');
const OUT_JSON = join(ROOT, 'nremt', 'assets', 'glossary.json');
const OUT_HTML = join(ROOT, 'nremt', 'glossary.html');

const notes = JSON.parse(readFileSync(join(ROOT, 'nremt', 'assets', 'study-notes.json'), 'utf8'));
const sections = new Map();
for (const ch of notes.chapters) for (const s of ch.sections) sections.set(s.id, { title: s.title, ch: ch.num });

const src = JSON.parse(readFileSync(SRC, 'utf8'));
const domainOf = new Map();
for (const [d, list] of Object.entries(GLOSSARY_DOMAIN)) for (const t of list) domainOf.set(t, d);
const errors = [];
const ids = new Set();
const terms = [];
let prev = '';
for (const e of src) {
  const where = `"${e.term}"`;
  if (!e.term || !e.def) { errors.push(`${where}: needs term and def`); continue; }
  if (prev && prev.localeCompare(e.term, 'en', { sensitivity: 'base' }) > 0) errors.push(`${where}: the file is kept A-Z; it comes before "${prev}"`);
  prev = e.term;
  if (e.section && !sections.has(e.section)) errors.push(`${where}: section "${e.section}" is not in study-notes.json`);
  if (!domainOf.has(e.term)) errors.push(`${where}: not filed under a domain in GLOSSARY_DOMAIN (scripts/lib/nremt-flashcard-sources.mjs)`);
  const id = slug(e.term);
  if (ids.has(id)) errors.push(`${where}: duplicate id ${id}`);
  ids.add(id);
  const s = e.section ? sections.get(e.section) : null;
  terms.push({
    id, term: e.term, def: e.def, topic: e.section || '', topicTitle: s ? s.title : '',
    href: s ? `study-notes.html#${e.section}` : '', aka: e.aka || [], chapter: s ? s.ch : '', pop: e.pop === false ? 0 : 1,
  });
}
if (errors.length) {
  console.error(`FAIL: nremt/data/glossary.json has ${errors.length} problem(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}

const chapters = notes.chapters.map((c) => ({ id: c.num, title: `${c.num}. ${c.title}` }));
const jsonOut = glossaryJson({ chapters, terms }) + '\n';

const title = 'EMT Glossary — Medical Terminology for NREMT | LevlPrep';
const desc = `Plain-language definitions of ${terms.length} common EMT and EMS medical terms, for NREMT-EMT exam prep, each linked to the study notes that teach it.`;
const url = `${ORIGIN}/nremt/glossary.html`;
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'DefinedTermSet', '@id': `${url}#terms`, name: 'NREMT-EMT glossary', url, description: desc,
      inLanguage: 'en', isPartOf: { '@id': `${ORIGIN}/nremt/#course` }, provider: { '@id': `${ORIGIN}/#org` } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'LevlPrep', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'NREMT-EMT', item: `${ORIGIN}/nremt/` },
      { '@type': 'ListItem', position: 3, name: 'Glossary', item: url },
    ] },
  ],
};
const linked = terms.filter((t) => t.href).length;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="preload" href="/assets/fonts/nunito-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="manifest" href="manifest.json">
<link rel="icon" href="assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../assets/icon-180.png">
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
<meta property="og:image" content="${ORIGIN}/nremt/assets/og-image.png">
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
<link rel="stylesheet" href="../assets/fonts/fonts.css">
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${JSON.stringify(ld).replace(/<\//g, '<\\/')}
</script>
</head>
<body data-course="nremt">
<header id="site-header"></header>
<div class="course-nav"></div>
<noscript><div class="site-nav-fallback" style="max-width:1120px;margin:0 auto;padding:14px clamp(20px,4vw,56px)"><a href="index.html">Home</a> · <a href="study-notes.html">Learn</a> · <a href="practice.html">Practice</a> · <a href="review.html">Review</a> · <a href="exams.html">Exams</a> · <a href="glossary.html">Glossary</a> · <a href="tools.html">Tools</a> · <a href="dashboard.html">Dashboard</a></div></noscript>
<main id="main" class="xshell">
  ${glossaryMain({
    crumbs: [{ name: 'LevlPrep', href: '/' }, { name: 'NREMT-EMT', href: '/nremt/' }, { name: 'Glossary' }],
    courseHtml: 'NREMT-EMT',
    lede: `${terms.length} EMS terms used across the questions and notes, in plain words. ${linked} link to the study notes section that teaches them.`,
    chapters, terms, placeholder: 'e.g. syncope, stridor, Fowler', searchHref: 'search.html',
  })}
</main>
<div class="xshell">
  <footer>
    <p>General terminology. Defer to your course for anything protocol-specific.</p>
    <p class="privacy-link"><a href="../privacy.html">Privacy</a> &middot; <a href="../terms.html">Terms</a> &middot; <a href="../about.html">About</a> &middot; <a href="../sources.html">Sources</a> &middot; <a href="../changelog.html">What&rsquo;s new</a> &middot; <a href="../premium.html">Premium</a> &middot; <a href="../account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
  </footer>
</div>
<script src="assets/nav.js" defer></script>
${glossaryScript('glossary-page.js', { up: '../', data: 'assets/glossary.json', root: '' })}
</body>
</html>
`;

const stale = [];
for (const [file, body] of [[OUT_JSON, jsonOut], [OUT_HTML, html]]) {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (current === body) continue;
  if (check) { stale.push(file.slice(ROOT.length + 1)); continue; }
  writeFileSync(file, body);
  console.log(`Wrote ${file.slice(ROOT.length + 1)}`);
}
if (stale.length) {
  console.error(`FAIL: ${stale.join(' and ')} ${stale.length > 1 ? 'are' : 'is'} stale. Run: node scripts/build-nremt-glossary.mjs`);
  process.exit(1);
}
console.log(`OK — ${terms.length} NREMT glossary terms, ${linked} linked to a study-notes section.`);
