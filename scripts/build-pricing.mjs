/* Writes every place the site states what is free, what Premium costs, or a
   catalogue count, from assets/premium.js and the data (audit 2026-10, W2).

     node scripts/build-pricing.mjs           apply
     node scripts/build-pricing.mjs --check   fail if anything is stale (CI)

   Before this, prices and counts were typed into pages and drifted: the
   purchase dialog sold a "3,795-question bank" that held 3,635, the 404 page
   said "Sixty-two interactive topics" when there were 121, the ochem app
   manifest said "14-module" for a 23-chapter course, and the hub hard-coded a
   founding price that would go stale on its own. It writes:

   1. premium.html: free vs Premium for each course, the passes and prices
      (founding price included, hidden by the page itself once it ends), the
      refund rule and Pass-or-extend's conditions, all from premium.js.
   2. The hub's pricing block (between <!-- pricing:start/end -->) and its
      structured data (Organization, the three courses with their offers).
   3. The bank counts in premium.js's Premium lists (lines marked
      `// count:<course>`).
   4. The four web app manifests' name, short_name and description.
   5. The Organic Chemistry card on 404.html (between <!-- nf-ochem:start/end -->).
   6. AP® Biology's hub and 404 cards (<!-- hub-bio:start/end -->,
      <!-- nf-bio:start/end -->) and its pricing section, only once a unit is
      published (OPEN in scripts/lib/courses.mjs; empty until then), and its
      manifest, bio/manifest.json, which never carries the mark.
   7. AP® Chemistry's the same way (<!-- hub-chem:start/end -->,
      <!-- nf-chem:start/end -->, chem/manifest.json), hidden until its first
      unit is published (docs/apchem-spec.md). */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, ORIGIN, FREE_SENTENCE, premiumData, counts, fmt, money, foundingPrice, longDate, courseOffers, guaranteeText } from './lib/premium-data.mjs';
import { CSP } from './lib/site-config.mjs';
import { PAID, isOpen } from './lib/courses.mjs';
import { DISCLAIMER } from './lib/apbio-build.mjs';

const check = process.argv.includes('--check');
const { COURSES, FOUNDING } = premiumData();
const N = counts();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stale = [];
function put(rel, after) {
  const file = join(ROOT, rel);
  let before = '';
  try { before = readFileSync(file, 'utf8'); } catch { /* new file */ }
  if (before === after) return;
  stale.push(rel);
  if (!check) writeFileSync(file, after);
}
function between(src, start, end, inner, rel) {
  const a = src.indexOf(start), b = src.indexOf(end);
  if (a === -1 || b === -1 || b < a) throw new Error(`${rel}: missing ${start} … ${end}`);
  return src.slice(0, a + start.length) + '\n' + inner + '\n' + src.slice(b);
}

// The paid courses in registry order (assets/courses.js); hidden ones are not
// on sale yet, so not on the pricing page either, and nor is a course that
// publishes by chapter (AP® Biology) before its first chapter is out.
const COURSE_URL = Object.fromEntries(PAID.map((c) => [c.key, c.path]));
const ORDER = PAID.filter((c) => isOpen(c)).map((c) => c.key);
const BIO = ORDER.includes('apbio');
const CHEM = ORDER.includes('apchem');
/* Once every topic in the map is published the card stops promising more.
   "N published topics" keeps clear of check-site's ochem topic-count claim. */
const CHEM_ALL = N.apchemTopics >= JSON.parse(readFileSync(join(ROOT, 'docs', 'apchem-dependency-map.json'), 'utf8')).topics.length;
// Any course that uses the College Board's mark (AP® Biology, AP® Chemistry).
const MARK = BIO || CHEM;
// The College Board sentence, on every page that uses the mark (docs/apbio-spec.md).
const TM_HTML = `<p class="tm-note">${esc(DISCLAIMER)}</p>`;
const founding = FOUNDING && FOUNDING.until ? FOUNDING : null;
/* The address terms.html and privacy.html publish. When hello@levlprep.com
   is set up (owner checklist), change it here and on those two pages. */
const CONTACT_EMAIL = 'hello@levlprep.com';
const lowest = (c) => c.passes.reduce((a, b) => (b.price < a.price ? b : a));

/* ---- 1. premium.html ----------------------------------------------------- */

function passRow(p) {
  return `<li><span class="pp-label">${esc(p.label)}</span> <span class="pp-price">` +
    (founding
      ? `<span data-founding-until="${founding.until}"><s>${money(p.price)}</s> <b>${money(foundingPrice(p.price))}</b> <small>founding price</small></span><b data-founding-after="${founding.until}" hidden>${money(p.price)}</b>`
      : `<b>${money(p.price)}</b>`) +
    `</span></li>`;
}

function courseSection(key) {
  const c = COURSES[key];
  return `
        <section class="pp-course" id="${key}" aria-labelledby="pp-${key}">
          <h2 id="pp-${key}">${esc(c.name)}</h2>
          <div class="pp-cols">
            <div><h3>Free</h3><ul>${c.free.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
            <div><h3>Premium adds</h3><ul>${c.premium.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
          </div>
          <ul class="pp-passes">${c.passes.map(passRow).join('')}</ul>
          <p class="pp-actions"><button type="button" class="btn-press sm" data-premium-open="${key}" data-premium-source="pricing-page">Get Premium for ${esc(c.name)}</button> <a href="${COURSE_URL[key]}">Start free</a></p>
          ${c.guarantee ? `<p class="pp-guarantee" id="pass-or-extend">${esc(guaranteeText())} <a href="terms.html#pass-or-extend">The full terms</a>.</p>` : ''}${c.passes.some((p) => p.until) ? `
          <p>One pass, whenever you buy it: it lasts through ${esc(longDate(c.passes.find((p) => p.until).until))}, the end of the 2027 exam season.</p>` : ''}
        </section>`;
}

function premiumPage() {
  const title = 'Free vs Premium: Prices and Passes | LevlPrep';
  const desc = `What is free in each LevlPrep course and what Premium adds: one-time passes from ${money(Math.min(...ORDER.map((k) => lowest(COURSES[k]).price)))}, no subscription, 7-day refunds, and Pass-or-extend for NREMT.`;
  const url = `${ORIGIN}/premium.html`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, name: 'Free vs Premium', url, description: desc, publisher: { '@id': `${ORIGIN}/#org` } },
      ...ORDER.map((k) => ({
        '@type': 'Product', name: `${COURSES[k].name} Premium`, url: `${url}#${k}`,
        description: `Premium for ${COURSES[k].name}: ${COURSES[k].premium.join('; ')}.`,
        brand: { '@type': 'Brand', name: 'LevlPrep' },
        offers: courseOffers(k),
      })),
    ],
  };
  const csp = CSP;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="preload" href="/assets/fonts/nunito-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/icon-180.png">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#16332E">
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Generated by scripts/build-pricing.mjs from assets/premium.js. Edit those, not this. -->
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="LevlPrep">
<meta property="og:image" content="${ORIGIN}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="assets/theme.css">
<link rel="stylesheet" href="assets/fonts/fonts.css">
<style>
  .pp p,.pp li{font-size:15.5px;font-weight:600;color:var(--muted);line-height:1.6;max-width:66ch;}
  .pp strong{color:var(--ink);font-weight:800;}
  .pp h2{font-size:21px;margin:0 0 10px;}
  .pp h3{font:900 12px var(--font-ui);text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:0 0 6px;}
  .pp-course{border:var(--bw) solid var(--line);border-radius:var(--radius);padding:18px 20px;margin:0 0 18px;}
  .pp-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .pp-cols ul{padding-left:18px;margin:0;}
  .pp-cols li{margin-bottom:5px;}
  .pp-passes{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:6px;}
  .pp-passes li{display:flex;justify-content:space-between;gap:12px;border-top:var(--bw) solid var(--line);padding-top:8px;margin:0;max-width:none;}
  .pp-label{color:var(--ink);font-weight:800;}
  .pp-price b{color:var(--ink);font-weight:900;}
  .pp-actions{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;margin:14px 0 0;}
  .pp-guarantee{background:var(--tint-accent);border-radius:var(--radius);padding:12px 14px;margin:14px 0 0;}
  .pp ul.pp-rules{padding-left:20px;}
  @media (max-width:560px){.pp-cols{grid-template-columns:1fr;}}
</style>
<script type="application/ld+json">
${JSON.stringify(ld, null, 2).replace(/<\//g, '<\\/')}
</script>
</head>
<body>
<!-- The shared site header (site-chrome.js renders it from data-site-header),
     with its own skip link like the other pages outside a course. -->
<a class="skip-link" href="#main">Skip to content</a>
<header id="site-header" data-site-header>
  <div class="site-header__inner">
    <span class="site-header__brand-row"><a class="site-header__brand" href="/" aria-label="LevlPrep home"><span class="brand-mark" aria-hidden="true">+</span><span class="brand-text">LevlPrep</span></a></span>
  </div>
</header>

<div class="xshell narrow" id="main" role="main" data-skip-target tabindex="-1">
  <div class="hero">
    <div class="eyebrow">Free vs Premium</div>
    <h1>What&rsquo;s free, and what Premium adds.</h1>
    <p class="lede">${esc(FREE_SENTENCE)} Premium is a one-time pass for one course: no subscription, nothing renews.${founding ? ` <span data-founding-until="${founding.until}">Founding-member price: ${FOUNDING.off}% off every pass until ${longDate(founding.until)}.</span>` : ''}</p>
  </div>

  <div class="xsection">
    <div class="xgrid">
      <div class="xlabel">Courses</div>
      <div class="xcontent narrow pp">
${ORDER.map(courseSection).join('\n')}
      </div>
    </div>
  </div>

  <div class="xsection">
    <div class="xgrid">
      <div class="xlabel">The rules</div>
      <div class="xcontent narrow pp">
        <ul class="pp-rules">
          <li><strong>One-time, never a subscription.</strong> Prices are in US dollars; sales tax or VAT is added at checkout and shown before you pay. Polar, our merchant of record, sells the pass and sends the receipt.</li>
          <li><strong>Buying needs a free account</strong>, so the pass follows you to every device. Everything free works without one.</li>
          <li><strong>Refunds:</strong> refund a pass yourself, in full, from your <a href="account.html">Account</a> page within 7 days of buying it. Once per account and email address.</li>
          <li><strong>When a pass ends</strong>, your progress, XP and streaks stay; only the Premium parts lock again. Buying another pass adds its days after the current one.${ORDER.some((k) => COURSES[k].passes.some((p) => p.until)) ? ' A pass with an end date (AP® Biology) runs through that date <a href="terms.html#fixed-date">whenever it is bought</a>.' : ''}</li>
        </ul>
        <p>The details are in the <a href="terms.html#premium">terms</a>.</p>
        <p><strong>Under 18?</strong> You need a parent or guardian&rsquo;s permission, and they accept the <a href="terms.html#premium">terms</a> for you; under 16, they should make the purchase.</p>
      </div>
    </div>
  </div>

</div>
<div class="xshell narrow">
  <footer>
${MARK ? `    ${TM_HTML}
` : ''}    <p class="privacy-link"><a href="privacy.html">Privacy</a> &middot; <a href="terms.html">Terms</a> &middot; <a href="about.html">About</a> &middot; <a href="sources.html">Sources</a> &middot; <a href="changelog.html">What&rsquo;s new</a> &middot; <a href="premium.html">Premium</a> &middot; <a href="account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
  </footer>
</div>

<script>
// The founding price ends on its date without a rebuild: after it, the
// founding parts hide and the full price shows.
(function(){
  var now = Date.now();
  [].forEach.call(document.querySelectorAll('[data-founding-until]'), function(el){
    if (now > Date.parse(el.getAttribute('data-founding-until') + 'T23:59:59Z')) el.hidden = true;
  });
  [].forEach.call(document.querySelectorAll('[data-founding-after]'), function(el){
    if (now > Date.parse(el.getAttribute('data-founding-after') + 'T23:59:59Z')) el.hidden = false;
  });
})();
</script>
<script src="assets/errors.js" defer></script>
<script src="assets/account.js" defer></script>
<script src="assets/premium.js" defer></script>
<script src="assets/hub-progress.js" defer></script>
<script src="assets/site-chrome.js" defer></script>
</body>
</html>
`;
}

put('premium.html', premiumPage());

/* ---- 2. the hub ------------------------------------------------------------ */

function hubPricing() {
  const low = Math.min(...ORDER.map((k) => lowest(COURSES[k]).price));
  const price = founding
    ? `Premium passes start at ${money(low)}, one-time<span data-founding-until="${founding.until}"> (${money(foundingPrice(low))} at the founding-member price until ${longDate(founding.until)})</span>.`
    : `Premium passes start at ${money(low)}, one-time.`;
  return `  <div class="xsection">
    <div class="xgrid">
      <div class="xlabel">Free and Premium</div>
      <div class="xcontent">
        <p class="section-lede">${esc(FREE_SENTENCE)} ${price} No subscription. <a href="premium.html">What&rsquo;s free in each course, and the prices</a>.</p>
      </div>
    </div>
  </div>
<script>(function(){var n=Date.now();[].forEach.call(document.querySelectorAll('[data-founding-until]'),function(e){if(n>Date.parse(e.getAttribute('data-founding-until')+'T23:59:59Z'))e.hidden=true;});})();</script>`;
}

/* The hub's three questions (site audit 2026-10, SEO: "No FAQ (affiliation,
   price, is it free)"). Shown on the page and given as FAQPage structured
   data; both come from here, the prices from premium.js. The founding price
   is left out: it expires on a date, and the block above states it and hides
   it once it has. */
const AFFILIATION = MARK
  ? `No. LevlPrep is an independent study aid. It is not affiliated with or endorsed by the National Registry of Emergency Medical Technicians (NREMT), ATI, OpenStax, the College Board or any university. ${DISCLAIMER}`
  : 'No. LevlPrep is an independent study aid. It is not affiliated with or endorsed by the National Registry of Emergency Medical Technicians (NREMT), ATI, OpenStax or any university.';
const passWords = (p) => (p.until ? `for a pass valid through ${longDate(p.until)}`
  : /^(semester|full year)/i.test(p.label) ? `a ${p.label[0].toLowerCase()}${p.label.slice(1)}` : `for ${p.label}`);
const passList = (k) => COURSES[k].passes.map((p) => `${money(p.price)} ${passWords(p)}`).join(' or ');
const PRICE = `Premium is a one-time pass per course, with no subscription: ${ORDER.map((k) => `${COURSES[k].name}, ${passList(k)}`).join('; ')}. Prices are in US dollars.`;
const FAQ = [
  ['Is LevlPrep free?', FREE_SENTENCE],
  ['How much does Premium cost?', PRICE],
  [MARK ? 'Is LevlPrep affiliated with the NREMT, ATI, OpenStax or the College Board?' : 'Is LevlPrep affiliated with the NREMT, ATI or OpenStax?', AFFILIATION],
];

function hubFaq() {
  return `  <div class="xsection">
    <div class="xgrid">
      <div class="xlabel">Questions</div>
      <div class="xcontent">
        <div class="hub-faq">
${FAQ.map(([q, a], i) => `          <h2>${esc(q)}</h2>
          <p>${esc(a)}${i === 1 ? ' <a href="premium.html">Free vs Premium, course by course</a>.' : ''}</p>`).join('\n')}
        </div>
      </div>
    </div>
  </div>`;
}

function hubLd() {
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${ORIGIN}/#org`, name: 'LevlPrep', url: `${ORIGIN}/`,
        // Raster, 112 px or more: Google does not take an SVG logo (audit 2026-10).
        logo: { '@type': 'ImageObject', url: `${ORIGIN}/assets/icon-512.png`, width: 512, height: 512 },
        description: `Exam prep tools and interactive courses. ${FREE_SENTENCE} No ads.`,
        // Who runs it and how to reach them, as terms.html and privacy.html say.
        founder: { '@type': 'Person', name: 'Olivier Testa' },
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: CONTACT_EMAIL, url: `${ORIGIN}/terms.html` },
      },
      { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, name: 'LevlPrep', url: `${ORIGIN}/`, publisher: { '@id': `${ORIGIN}/#org` }, inLanguage: 'en' },
      {
        '@type': 'FAQPage', '@id': `${ORIGIN}/#faq`,
        mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
      {
        '@type': 'ItemList', name: 'Courses and exam prep on LevlPrep',
        itemListElement: ORDER.map((k, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: { '@type': 'Course', '@id': `${ORIGIN}${COURSE_URL[k]}#course`, name: COURSES[k].name, url: `${ORIGIN}${COURSE_URL[k]}`,
            description: `${COURSES[k].name}, free to start.`, provider: { '@id': `${ORIGIN}/#org` }, offers: courseOffers(k) },
        })),
      },
    ],
  };
  return `<script type="application/ld+json">\n${JSON.stringify(ld).replace(/<\//g, '<\\/')}\n</script>`;
}

/* AP® Biology's hub card, once a unit is out. What it says is counted from
   what is published (scripts/build-apbio.mjs), never typed. "N published
   topics", not "N topics": check-site reads "N topics" on the hub as the
   ochem curriculum's count. */
function hubBioCard() {
  const topics = N.apbioTopics;
  return `        <a class="featured-card" href="bio/">
          <div class="featured-top">
            <div class="featured-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 3c0 6 10 6 10 12s-10 6-10 6"/><path d="M17 3c0 6-10 6-10 12"/><path d="M8.5 7h7M8.5 17h7"/></svg></div>
            <span class="status-badge">Beta</span>
          </div>
          <div>
            <p class="featured-name">AP® Biology</p>
            <p class="featured-desc">Built on the 2025 course framework, in its order: lessons from scratch, data-heavy practice like the real exam, and the statistics skills. ${fmt(topics)} published topic${topics === 1 ? '' : 's'} so far, more every few weeks.</p>
          </div>
          <div class="featured-tags">
            <span>Beta</span>
            <span>Free notes</span>
            <span>Stimulus sets</span>
            <span>Statistics skills</span>
          </div>
          <span class="featured-cta">Start learning &rarr;</span>
        </a>`;
}

/* AP® Chemistry's hub card, the same way: counted, never typed. */
function hubChemCard() {
  const topics = N.apchemTopics;
  return `        <a class="featured-card" href="chem/">
          <div class="featured-top">
            <div class="featured-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3v6L4 19a1.6 1.6 0 0 0 1.4 2h13.2A1.6 1.6 0 0 0 20 19l-5-10V3"/><path d="M7.5 3h9M6.7 14h10.6"/></svg></div>
            <span class="status-badge">Beta</span>
          </div>
          <div>
            <p class="featured-name">AP® Chemistry</p>
            <p class="featured-desc">Built on the 2024 course framework, in its order: lessons from scratch at the particle level, practice that checks units and significant figures, and justification training. ${CHEM_ALL ? `All ${fmt(topics)} published topics, from the math you need to electrochemistry.` : `${fmt(topics)} published topic${topics === 1 ? '' : 's'} so far, more every few weeks.`}</p>
          </div>
          <div class="featured-tags">
            <span>Beta</span>
            <span>Free notes</span>
            <span>Particle diagrams</span>
            <span>Units and sig figs</span>
          </div>
          <span class="featured-cta">Start learning &rarr;</span>
        </a>`;
}

{
  const rel = 'index.html';
  let src = readFileSync(join(ROOT, rel), 'utf8');
  src = between(src, '<!-- pricing:start -->', '<!-- pricing:end -->', hubPricing(), rel);
  src = between(src, '<!-- faq:start -->', '<!-- faq:end -->', hubFaq(), rel);
  src = between(src, '<!-- hub-bio:start -->', '<!-- hub-bio:end -->', BIO ? hubBioCard() : '', rel);
  src = between(src, '<!-- hub-chem:start -->', '<!-- hub-chem:end -->', CHEM ? hubChemCard() : '', rel);
  const m = src.indexOf('<!-- levlprep-structured-data -->');
  if (m === -1) throw new Error('index.html: no <!-- levlprep-structured-data --> marker');
  const s0 = src.indexOf('<script type="application/ld+json">', m);
  const s1 = src.indexOf('</script>', s0) + '</script>'.length;
  src = src.slice(0, s0) + hubLd() + src.slice(s1);
  put(rel, src);
}

/* ---- 3. counts in premium.js ------------------------------------------------ */

{
  const rel = 'assets/premium.js';
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const out = src.replace(/(The full )[\d,]+(-question bank[^\n]*\/\/ count:)(nremt|ochem|anp)/g,
    (_, a, b, k) => `${a}${fmt(N[k])}${b}${k}`);
  // AP® Biology and AP® Chemistry state no count while their banks grow unit by unit.
  for (const k of ORDER.filter((x) => x !== 'apbio' && x !== 'apchem')) if (!out.includes(`// count:${k}`)) throw new Error(`${rel}: no line marked // count:${k}`);
  put(rel, out);
}

/* ---- 4. manifests ------------------------------------------------------------ */

/* Manifests never carry the AP® mark (docs/apbio-spec.md, "Trademark": no
   "AP" in meta tags or ad copy, and an install name is both): AP® Biology's
   app is "Biology". */
const MANIFEST_NAMES = { nremt: 'NREMT-EMT exam prep', ochem: 'Organic Chemistry', anp: 'Anatomy & Physiology', apbio: 'Biology', apchem: 'Chemistry' };
const listWords = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const MANIFESTS = {
  'manifest.json': {
    name: 'LevlPrep — NREMT-EMT, Organic Chemistry and A&P study tools',
    short_name: 'LevlPrep',
    description: `${NUMBER_WORDS[ORDER.length] || ORDER.length} courses, one login: ${listWords(ORDER.map((k) => MANIFEST_NAMES[k]))}. ${FREE_SENTENCE} Works offline.`,
  },
  'bio/manifest.json': {
    name: 'LevlPrep — Biology',
    short_name: 'LevlPrep Bio',
    description: `Biology on the 2025 course framework, in its order, for the May exam: every notes page is free forever and Units 1 and 2 are fully interactive, with every skills lesson; Premium adds unlimited practice, the FRQs, practice exams, every simulator and every lesson.`,
  },
  'chem/manifest.json': {
    name: 'LevlPrep — Chemistry',
    short_name: 'LevlPrep Chem',
    description: `Chemistry on the 2024 course framework, in its order, for the May exam: every notes page is free forever and Units 1 and 2 are fully interactive, with the math refresher; Premium adds unlimited practice, the FRQs, practice exams, every trainer and every lesson.`,
  },
  'nremt/manifest.json': {
    name: 'LevlPrep — NREMT-EMT Practice Exam & Study Tools',
    short_name: 'LevlPrep NREMT',
    description: `NREMT-EMT prep, free to start: a ${fmt(N.nremt)}-question bank, timed exams, study notes, flashcards and mnemonics. The notes are free forever, with ${COURSES.nremt.dailyFree} practice questions a day and one full exam free; Premium adds unlimited practice, exams and analytics.`,
  },
  'ochem/manifest.json': {
    name: 'LevlPrep — Organic Chemistry I & II',
    short_name: 'LevlPrep Ochem',
    description: `Organic Chemistry I and II in ${N.ochemChapters} chapters and ${N.ochemTopics} topics, with mechanisms you perform yourself and ${N.ochemTools} interactive tools. Every textbook page is free forever and the first ${COURSES.ochem.freeChapters.length} chapters are fully interactive; Premium adds unlimited practice, exams, every lesson and analytics.`,
  },
  'anatomy-physiology/manifest.json': {
    name: 'LevlPrep — Anatomy & Physiology',
    short_name: 'LevlPrep A&P',
    description: `Anatomy & Physiology in ${N.anpChapters} chapters that build in strict order. Every notes page is free forever and the ${COURSES.anp.freeChapters.length} Foundations chapters are fully interactive; Premium adds unlimited practice, exams, every lesson and analytics.`,
  },
};
for (const [rel, fields] of Object.entries(MANIFESTS)) {
  // Replace the three fields in place, so the icon lists keep their layout.
  let src = readFileSync(join(ROOT, rel), 'utf8');
  for (const [k, v] of Object.entries(fields)) {
    const re = new RegExp(`("${k}":\\s*)"(?:[^"\\\\]|\\\\.)*"`);
    if (!re.test(src)) throw new Error(`${rel}: no "${k}"`);
    src = src.replace(re, (_, a) => a + JSON.stringify(v));
  }
  JSON.parse(src);
  put(rel, src);
}

/* ---- 5. the 404 page --------------------------------------------------------- */

{
  const rel = '404.html';
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const card = `    <a class="card nf-card" href="/ochem/">
      <h2>Organic Chemistry &rarr;</h2>
      <p>${N.ochemChapters} chapters and ${N.ochemTopics} topics, ${N.ochemMechanisms} mechanisms you perform yourself, and ${N.ochemTools} tools.</p>
    </a>`;
  let out = between(src, '<!-- nf-ochem:start -->', '<!-- nf-ochem:end -->', card, rel);
  const bio = `    <a class="card nf-card" href="/bio/">
      <h2>AP® Biology (Beta) &rarr;</h2>
      <p>${fmt(N.apbioTopics)} published topic${N.apbioTopics === 1 ? '' : 's'} so far, in the order of the 2025 course framework, with free notes for every one. ${esc(DISCLAIMER)}</p>
    </a>`;
  out = between(out, '<!-- nf-bio:start -->', '<!-- nf-bio:end -->', BIO ? bio : '', rel);
  const chem = `    <a class="card nf-card" href="/chem/">
      <h2>AP® Chemistry (Beta) &rarr;</h2>
      <p>${CHEM_ALL ? `All ${fmt(N.apchemTopics)} published topics` : `${fmt(N.apchemTopics)} published topic${N.apchemTopics === 1 ? '' : 's'} so far`}, in the order of the 2024 course framework, with free notes for every one. ${esc(DISCLAIMER)}</p>
    </a>`;
  out = between(out, '<!-- nf-chem:start -->', '<!-- nf-chem:end -->', CHEM ? chem : '', rel);
  put(rel, out);
}

if (check) {
  if (stale.length) {
    console.error(`build-pricing: stale (run node scripts/build-pricing.mjs):\n  ${stale.join('\n  ')}`);
    process.exit(1);
  }
  console.log('build-pricing: up to date');
} else {
  console.log(stale.length ? `build-pricing: wrote ${stale.join(', ')}` : 'build-pricing: nothing to change');
}
