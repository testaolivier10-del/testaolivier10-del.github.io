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
   5. The Organic Chemistry card on 404.html (between <!-- nf-ochem:start/end -->). */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, ORIGIN, FREE_SENTENCE, premiumData, counts, fmt, money, foundingPrice, longDate, courseOffers, guaranteeText } from './lib/premium-data.mjs';
import { CSP } from './lib/site-config.mjs';

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

const COURSE_URL = { nremt: '/nremt/', ochem: '/ochem/', anp: '/anatomy-physiology/' };
const ORDER = ['nremt', 'ochem', 'anp'];
const founding = FOUNDING && FOUNDING.until ? FOUNDING : null;
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
          ${c.guarantee ? `<p class="pp-guarantee" id="pass-or-extend">${esc(guaranteeText())} <a href="terms.html#pass-or-extend">The full terms</a>.</p>` : ''}
        </section>`;
}

function premiumPage() {
  const title = 'Free vs Premium — Prices | LevlPrep';
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
<script>try{if(localStorage.getItem("nremt_theme")==="dark")document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
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
<!-- Like terms.html, this page draws its own header instead of calling
     LevlChrome.render, so it carries its own skip link too. -->
<a class="skip-link" href="#main">Skip to content</a>
<div id="site-header">
  <div class="site-header__inner">
    <a class="site-header__brand" href="index.html">
      <span class="brand-mark" aria-hidden="true">+</span> LevlPrep
    </a>
    <button type="button" class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode" title="Toggle dark mode"><svg class="ti-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg><svg class="ti-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
  </div>
</div>

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
          <li><strong>When a pass ends</strong>, your progress, XP and streaks stay; only the Premium parts lock again. Buying another pass adds its days after the current one.</li>
        </ul>
        <p>The details are in the <a href="terms.html#premium">terms</a>.</p>
      </div>
    </div>
  </div>

  <footer>
    <p class="privacy-link"><a href="privacy.html">Privacy</a> &middot; <a href="terms.html">Terms</a> &middot; <a href="sources.html">Sources</a> &middot; <a href="changelog.html">What&rsquo;s new</a></p>
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

function hubLd() {
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${ORIGIN}/#org`, name: 'LevlPrep', url: `${ORIGIN}/`,
        logo: `${ORIGIN}/assets/icon.svg`,
        description: `Exam prep tools and interactive courses. ${FREE_SENTENCE} No ads.`,
      },
      { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, name: 'LevlPrep', url: `${ORIGIN}/`, publisher: { '@id': `${ORIGIN}/#org` }, inLanguage: 'en' },
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

{
  const rel = 'index.html';
  let src = readFileSync(join(ROOT, rel), 'utf8');
  src = between(src, '<!-- pricing:start -->', '<!-- pricing:end -->', hubPricing(), rel);
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
  for (const k of ORDER) if (!out.includes(`// count:${k}`)) throw new Error(`${rel}: no line marked // count:${k}`);
  put(rel, out);
}

/* ---- 4. manifests ------------------------------------------------------------ */

const MANIFESTS = {
  'manifest.json': {
    name: 'LevlPrep — NREMT-EMT, Organic Chemistry and A&P study tools',
    short_name: 'LevlPrep',
    description: `Three courses, one login: NREMT-EMT exam prep, Organic Chemistry and Anatomy & Physiology. ${FREE_SENTENCE} Works offline.`,
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
  put(rel, between(src, '<!-- nf-ochem:start -->', '<!-- nf-ochem:end -->', card, rel));
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
