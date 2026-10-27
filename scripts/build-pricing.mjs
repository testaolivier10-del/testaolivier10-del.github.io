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
      unit is published (docs/apchem-spec.md).
   9. The hub hero's course count and terms.html#fixed-date (the dated passes).
   8. AP® Physics 1's the same way (<!-- hub-phys:start/end -->,
      <!-- nf-phys:start/end -->, physics/manifest.json), hidden until its
      first unit is published (docs/apphys-spec.md).
   9. AP® Calculus AB's the same way (<!-- hub-calc:start/end -->,
      <!-- nf-calc:start/end -->, calculus/manifest.json), hidden until its
      first unit is published (docs/apcalc-spec.md).
  10. AP® Statistics's the same way (<!-- hub-stat:start/end -->,
      <!-- nf-stat:start/end -->, statistics/manifest.json), since its launch
      (docs/apstat-spec.md decision 15).
  11. AP® Environmental Science's the same way (<!-- hub-env:start/end -->,
      <!-- nf-env:start/end -->, environmental-science/manifest.json), hidden
      until its first unit is published (docs/apenv-spec.md).
  12. AP® Psychology's the same way (<!-- hub-psy:start/end -->,
      <!-- nf-psy:start/end -->, psychology/manifest.json), hidden until its
      first unit is published (docs/appsych-spec.md). */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, ORIGIN, FREE_SENTENCE, premiumData, counts, fmt, money, foundingPrice, longDate, courseOffers, guaranteeText } from './lib/premium-data.mjs';
import { CSP } from './lib/site-config.mjs';
import { PAID, OPEN, isOpen } from './lib/courses.mjs';
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

/* The price next to something a student already knows (trust plan, 2026-10-08):
   a private tutor's hour. Care.com's national figure for a tutor's starting
   rate was about $26 an hour in October 2026; update the number and the date
   together if it moves. */
/* Where each "For comparison" line in premium.js comes from (checked on the
   competitors' own pages, 2026-10-25). Re-check before changing a sentence. */
const AP_SOURCES = [['Fiveable', 'https://fiveable.me/pricing']];
const COMPARE_SOURCES = {
  nremt: [['App Store', 'https://apps.apple.com/us/app/pocket-prep-ems-2026/id1503584128']],
  apbio: AP_SOURCES, apchem: AP_SOURCES, apphys: AP_SOURCES, apcalc: AP_SOURCES, apstat: AP_SOURCES, apenv: AP_SOURCES, appsych: AP_SOURCES,
};
const TUTOR_HOUR = { rate: 26, source: 'https://www.care.com/cost/private-tutors/boston-ma', checked: 'October 2026' };
const PRICES = ORDER.flatMap((k) => COURSES[k].passes.map((x) => x.price));
const LOW = Math.min(...PRICES), HIGH = Math.max(...PRICES);
const HOURS = (n) => { const h = Math.max(1, Math.round(n / TUTOR_HOUR.rate)); return h === 1 ? 'one hour' : h === 2 ? 'two hours' : h + ' hours'; };
const tutorSpan = HOURS(LOW) === HOURS(HIGH) ? HOURS(LOW) : HOURS(LOW).replace(/ hours?$/, '') + ' or ' + HOURS(HIGH);
const BIO = ORDER.includes('apbio');
const CHEM = ORDER.includes('apchem');
const PHYS = ORDER.includes('apphys');
const CALC = ORDER.includes('apcalc');
const STAT = ORDER.includes('apstat');
const ENV = ORDER.includes('apenv');
const PSY = ORDER.includes('appsych');
/* Once every topic in the map is published the card stops promising more.
   "N published topics" keeps clear of check-site's ochem topic-count claim. */
const CHEM_ALL = N.apchemTopics >= JSON.parse(readFileSync(join(ROOT, 'docs', 'apchem-dependency-map.json'), 'utf8')).topics.length;
const PHYS_ALL = N.apphysTopics >= JSON.parse(readFileSync(join(ROOT, 'docs', 'apphys-dependency-map.json'), 'utf8')).topics.length;
const CALC_ALL = N.apcalcTopics >= JSON.parse(readFileSync(join(ROOT, 'docs', 'apcalc-dependency-map.json'), 'utf8')).topics.length;
const STAT_ALL = N.apstatTopics >= JSON.parse(readFileSync(join(ROOT, 'docs', 'apstat-dependency-map.json'), 'utf8')).topics.length;
const ENV_ALL = N.apenvTopics >= JSON.parse(readFileSync(join(ROOT, 'docs', 'apenv-dependency-map.json'), 'utf8')).topics.length;
// AP® Psychology's map lands in Phase 0 Part B; until then nothing is "all".
const PSY_MAP = join(ROOT, 'docs', 'appsych-dependency-map.json');
const PSY_ALL = existsSync(PSY_MAP) && N.appsychTopics >= JSON.parse(readFileSync(PSY_MAP, 'utf8')).topics.length;
const BIO_ALL = N.apbioTopics >= JSON.parse(readFileSync(join(ROOT, 'docs', 'apbio-dependency-map.json'), 'utf8')).topics.length;
// Any course that uses the College Board's mark (AP® Biology, AP® Chemistry, AP® Physics 1, AP® Calculus AB, AP® Statistics, AP® Environmental Science, AP® Psychology).
const MARK = BIO || CHEM || PHYS || CALC || STAT || ENV || PSY;
// The College Board sentence, on every page that uses the mark (docs/apbio-spec.md).
const TM_HTML = `<p class="tm-note">${esc(DISCLAIMER)}</p>`;
const founding = FOUNDING && FOUNDING.until ? FOUNDING : null;
/* The address terms.html and privacy.html publish. When hello@levlprep.com
   is set up (owner checklist), change it here and on those two pages. */
const CONTACT_EMAIL = 'hello@levlprep.com';
const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const listWords = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
// The courses whose pass runs through a date (the AP® passes), for the rules and terms.html#fixed-date.
const DATED = ORDER.filter((k) => COURSES[k].passes.some((p) => p.until));
const lowest = (c) => c.passes.reduce((a, b) => (b.price < a.price ? b : a));

/* ---- 1. premium.html ----------------------------------------------------- */

function passRow(p) {
  return `<li><span class="pp-label">${esc(p.label)}</span> <span class="pp-price">` +
    (founding
      ? `<span data-founding-until="${founding.until}"><s>${money(p.price)}</s> <b>${money(foundingPrice(p.price))}</b> <small>founding price</small></span><b data-founding-after="${founding.until}" hidden>${money(p.price)}</b>`
      : `<b>${money(p.price)}</b>`) +
    `</span> <small class="pp-day" data-pass="${p.id}"></small></li>`;
}

/* One <details> per course (polish 2026-10-17, A8): the page opens on the
   course the visitor came from (?course=, #key or the referring course page,
   chosen by the script at the end of the page) and the rest stay folded to
   one line with their lowest price. */
function courseSection(key) {
  const c = COURSES[key];
  const from = lowest(c).price;
  return `
        <details class="pp-course" id="${key}" data-path="${COURSE_URL[key]}">
          <summary><img class="pp-cover" src="assets/covers/thumb/${key}.svg" alt="" width="640" height="320" loading="lazy" decoding="async"><h2 id="pp-${key}">${esc(c.name)}</h2><span class="pp-from">${c.passes.length > 1 ? 'from ' : ''}${founding ? `<span data-founding-until="${founding.until}">${money(foundingPrice(from))}</span><span data-founding-after="${founding.until}" hidden>${money(from)}</span>` : money(from)}${c.passes.length === 1 ? `<small class="pp-len">${c.passes[0].until ? 'school year' : esc(c.passes[0].label)}</small>` : ''}</span></summary>
          <div class="pp-cols">
            <div><h3>Free</h3><ul>${c.free.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
            <div><h3>Premium adds</h3><ul>${c.premium.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
          </div>
          <ul class="pp-passes">${c.passes.map(passRow).join('')}</ul>
          <p class="pp-actions"><button type="button" class="btn-press sm" data-premium-open="${key}" data-premium-source="pricing-page">Get Premium for ${esc(c.name)}</button> <a href="${COURSE_URL[key]}">Start free</a></p>
          <p class="pp-sure">One payment. Never renews. Full refund within 7 days, from your Account page.</p>${c.compare ? `
          <p class="pp-compare">${esc(c.compare)} Sources: ${(COMPARE_SOURCES[key] || []).map(([n, u]) => `<a href="${u}" rel="noopener">${esc(n)}</a>`).join(', ')}.</p>` : ''}
          ${c.guarantee ? `<details class="pp-guarantee" id="pass-or-extend"><summary>Pass-or-extend: if you don&rsquo;t pass the NREMT during your pass, you can claim more days free.</summary><p>${esc(guaranteeText())} <a href="terms.html#pass-or-extend">The full terms</a>.</p></details>` : ''}${c.passes.some((p) => p.until) ? `
          <p>One pass, whenever you buy it: it lasts through ${esc(longDate(c.passes.find((p) => p.until).until))}, the end of the 2027 exam season.</p>` : ''}
        </details>`;
}

/* The price ticket at the top of premium.html (site redesign round 2): one
   row per kind of pass, courses with the same pass and price sharing a row
   ("Every AP® Course, through June 30, 2027"). With a founding offer it shows the
   discount, and a plain version takes over the day the offer ends. */
const SHORT_NAME = { nremt: 'NREMT', ochem: 'Organic Chemistry', anp: 'A&P' };
function priceGroups() {
  const groups = new Map();
  for (const k of ORDER) {
    for (const p of COURSES[k].passes) {
      const lab = p.label.replace(/\s*\(.*\)$/, '');
      const key = `${p.price}|${lab}`;
      if (!groups.has(key)) groups.set(key, { price: p.price, label: lab, keys: [] });
      groups.get(key).keys.push(k);
    }
  }
  return [...groups.values()].map((g) => {
    const ap = g.keys.every((k) => /^ap/.test(k));
    const who = ap && g.keys.length > 1 ? 'Every AP® Course' : g.keys.map((k) => SHORT_NAME[k] || COURSES[k].name).join(' or ');
    const lab = /^Through /.test(g.label) ? g.label.replace(/^Through/, 'through') : g.label.toLowerCase();
    return { ...g, text: `${who}, ${lab}` };
  });
}
function ticketHtml() {
  const rows = priceGroups();
  const plain = `<div class="sp-panel pp-ticket"${founding ? ` data-founding-after="${founding.until}" hidden` : ''}>
      <p class="hand">one-time passes</p>
      <p class="pp-big">$${LOW} <span>to $${HIGH}</span></p>
      <p class="pp-till">one course, one payment, never renewed</p>
      <ul class="pp-rows">${rows.map((r) => `<li><span>${esc(r.text)}</span><b>${money(r.price)}</b></li>`).join('')}</ul>
    </div>`;
  if (!founding) return plain;
  return `<div class="sp-panel pp-ticket" data-founding-until="${founding.until}">
      <p class="hand">founding price</p>
      <p class="pp-big">${FOUNDING.off}% <span>off</span></p>
      <p class="pp-till">every pass, until ${esc(longDate(founding.until))}</p>
      <ul class="pp-rows">${rows.map((r) => `<li><span>${esc(r.text)}</span><span><s>${money(r.price)}</s> <b>${money(foundingPrice(r.price))}</b></span></li>`).join('')}</ul>
    </div>
    ${plain}`;
}

const PP_ICON = {
  renew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  refund: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  keep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
};

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
<link rel="stylesheet" href="assets/site-pages.css">
<style>
  /* Free vs Premium in the light channel look (docs/site-redesign.md,
     round 2). Shared parts are in assets/site-pages.css. */
  .pp-hero h1{font-size:clamp(40px,5.4vw,68px);}
  .pp-ticket{position:relative;padding:30px 30px 26px;overflow:hidden;}
  .pp-ticket::before,.pp-ticket::after{content:"";position:absolute;top:50%;width:28px;height:28px;border-radius:50%;background:var(--paper);transform:translateY(-50%);}
  .pp-ticket::before{left:-14px;}.pp-ticket::after{right:-14px;}
  .pp-ticket .hand{margin:0;}
  .pp-big{font:900 clamp(56px,6vw,76px)/.9 var(--display);letter-spacing:-.05em;margin:6px 0 6px;color:var(--panel-ink);}
  .pp-big span{color:var(--gold);}
  .pp-till{color:var(--panel-muted);margin:0 0 18px;font-size:15.5px;}
  .pp-rows{list-style:none;margin:0;padding:16px 0 0;border-top:2px dashed var(--panel-line);display:grid;gap:9px;font-size:15px;}
  .pp-rows li{display:flex;justify-content:space-between;gap:12px;color:var(--panel-muted);}
  .pp-rows b{color:var(--panel-ink);font-weight:900;white-space:nowrap;}
  .pp-rows li > span:last-child{white-space:nowrap;}
  .pp-rows s{opacity:.8;margin-right:4px;}
  .pp-promise{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;}
  .pp-pr{padding:18px 18px 16px;display:grid;gap:6px;align-content:start;}
  .pp-pr b{font:900 16.5px var(--font-ui);letter-spacing:-.01em;color:var(--ink);}
  .pp-pr span{color:var(--muted);font-size:14.5px;line-height:1.45;}
  .pp-pr svg{width:24px;height:24px;color:var(--accent);}
  /* One <details> per course. */
  .pp p,.pp li{font-size:15.5px;font-weight:600;color:var(--muted);line-height:1.6;max-width:66ch;}
  .pp strong{color:var(--ink);font-weight:800;}
  .pp h3{font:900 12.5px var(--font-ui);text-transform:uppercase;letter-spacing:.08em;color:var(--accent-text);margin:0 0 10px;}
  .pp-list{display:grid;gap:12px;}
  .pp-course{background:var(--white);border:1px solid var(--line);border-radius:20px;padding:0 22px;scroll-margin-top:calc(var(--chrome-row1-h) + 16px);}
  .pp-course[open]{padding-bottom:22px;}
  .pp-course > summary{list-style:none;display:flex;align-items:center;gap:16px;padding:14px 0;cursor:pointer;}
  .pp-course > summary::-webkit-details-marker{display:none;}
  .pp-course > summary::after{content:var(--disclose);font:900 24px/1 var(--font-ui);color:var(--accent);flex-shrink:0;width:16px;text-align:center;transition:transform .15s ease;}
  .pp-course[open] > summary::after{transform:rotate(90deg);}
  .pp-course > summary:focus-visible{outline:3px solid var(--accent);outline-offset:2px;border-radius:12px;}
  .pp-course > summary .pp-cover{width:120px;height:60px;object-fit:cover;object-position:center;border-radius:10px;flex-shrink:0;background:var(--panel);}
  .pp-course > summary h2{margin:0;flex:1;min-width:0;font:900 clamp(19px,2vw,23px)/1.2 var(--display);letter-spacing:-.025em;color:var(--ink);}
  .pp .pp-from{font:900 17px var(--font-ui);color:var(--ink);white-space:nowrap;}
  .pp-course[open] .pp-from{visibility:hidden;}
  .pp-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;border:1px solid var(--line);border-radius:16px;overflow:hidden;}
  .pp-cols > div{padding:20px 22px;}
  .pp-cols > div:last-child{background-color:var(--panel);background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:36px 36px;}
  .pp-cols > div:last-child h3{color:var(--gold);}
  .pp-cols > div:last-child li{color:var(--panel-ink);}
  .pp-cols ul{list-style:none;padding:0;margin:0;display:grid;gap:8px;}
  .pp-cols li{position:relative;padding-left:26px;margin:0;}
  .pp-cols li::before{content:"";position:absolute;left:3px;top:8px;width:11px;height:6px;border-left:2.5px solid var(--accent);border-bottom:2.5px solid var(--accent);transform:rotate(-45deg);}
  .pp-cols > div:last-child li::before{border-color:var(--teal-hi);}
  .pp-passes{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:0;}
  .pp-passes li{display:flex;flex-wrap:wrap;justify-content:flex-start;align-items:baseline;gap:4px 14px;border-top:1px solid var(--line);padding:10px 0;margin:0;max-width:none;}
  .pp-passes li:first-child{border-top:0;}
  .pp-label{color:var(--ink);font-weight:800;}
  .pp-price b{color:var(--ink);font-weight:900;font-size:17px;}
  .pp-price small{font-weight:700;}
  .pp-actions{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:14px 0 0;}
  .pp .pp-actions .btn-press{background:var(--gold);color:var(--gold-ink);box-shadow:none;font:900 16px var(--font-ui);padding:13px 20px;border-radius:12px;}
  .pp-actions a{color:var(--accent-text);font-weight:800;}
  .pp .pp-sure{margin:8px 0 0;font-size:13.5px;}
  .pp-guarantee{background:var(--tint-accent);border-radius:14px;padding:12px 14px;margin:14px 0 0;}
  .pp-guarantee a{color:var(--accent-text);}
  .pp-rules p{color:var(--muted);margin:0 0 12px;max-width:40em;}
  .pp-rules a{color:var(--accent-text);}
  @media (prefers-reduced-motion:reduce){.pp-course > summary::after{transition:none;}}
  @media (max-width:900px){.pp-promise{grid-template-columns:minmax(0,1fr) minmax(0,1fr);}}
  @media (max-width:560px){
    .pp-promise{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;}
    .pp-pr{padding:14px;}
    .pp-pr span{font-size:13.5px;}
    .pp-cols{grid-template-columns:minmax(0,1fr);}
    .pp-course{padding:0 14px;}
    .pp-course > summary{gap:12px;}
    .pp-course > summary .pp-cover{width:52px;height:52px;}
    .pp-course > summary h2{font-size:18px;overflow-wrap:anywhere;hyphens:auto;}
    .pp .pp-from{font-size:15px;}
    .pp-ticket{padding:24px 22px 22px;}
  }
  .pp-guarantee > summary{cursor:pointer;font-weight:800;}
  .pp-guarantee > p{margin:8px 0 0;}
  .pp-day{display:block;flex-basis:100%;text-align:left;font:700 12.5px var(--font-ui);color:var(--muted);margin-top:-4px;}
  .pp-day:empty{display:none;}
  .pp .pp-len{display:block;font:700 11.5px var(--font-ui);color:var(--muted);text-align:right;}
  .pp-compare{margin:6px 0 0;font-size:14px;color:var(--muted);}
</style>
<script type="application/ld+json">
${JSON.stringify(ld, null, 2).replace(/<\//g, '<\\/')}
</script>
</head>
<body class="sp-page">
<!-- The shared site header (site-chrome.js renders it from data-site-header),
     with its own skip link like the other pages outside a course. -->
<a class="skip-link" href="#main">Skip to content</a>
<header id="site-header" data-site-header>
  <div class="site-header__inner">
    <span class="site-header__brand-row"><a class="site-header__brand" href="/" aria-label="LevlPrep home"><span class="brand-mark" aria-hidden="true">+</span><span class="brand-text">LevlPrep</span></a></span>
  </div>
</header>

<div class="xshell" id="main" role="main" data-skip-target tabindex="-1">
  <section class="sp-hero pp-hero" aria-labelledby="ppTitle">
    <div>
      <span class="sp-pill">Free vs Premium</span>
      <h1 id="ppTitle">What&rsquo;s free,<span>and what Premium adds.</span></h1>
      <p class="hand">one payment, never a subscription</p>
      <p class="lede">Every course is free to start. Premium is one payment per course that never renews, from ${founding ? `<span data-founding-until="${founding.until}">${money(foundingPrice(LOW))} (founding price until ${longDate(founding.until)})</span><span data-founding-after="${founding.until}" hidden>${money(LOW)}</span>` : money(LOW)}, with a full refund within 7 days.</p>
      <div class="sp-btns"><a class="btn-chan" href="#courses">Compare your course</a><a class="btn-ghost" href="/#subjects">Start free</a></div>
    </div>
    ${ticketHtml()}
  </section>

  <section class="pp-promise sp-sec" aria-label="What every pass promises">
    <div class="sp-box pp-pr">${PP_ICON.renew}<b>Never renews</b><span>One payment for one course. It ends on its own, with nothing to cancel.</span></div>
    <div class="sp-box pp-pr">${PP_ICON.refund}<b>Refund it yourself</b><span>In full, from your Account page, within 7 days of buying.</span></div>
    <div class="sp-box pp-pr">${PP_ICON.notes}<b>Notes free forever</b><span>Every notes and textbook page, in every course, with no ads.</span></div>
    <div class="sp-box pp-pr">${PP_ICON.keep}<b>Progress stays</b><span>When a pass ends, your progress, XP and streaks stay. Only the Premium parts lock.</span></div>
  </section>

  <section class="sp-sec" id="courses" aria-labelledby="ppCourses">
    <div class="sp-sh"><h2 class="sp-h2" id="ppCourses">What you get in <span>each course</span></h2><p>Open a course to compare free and Premium side by side.</p></div>
    <div class="pp pp-list">
${ORDER.map(courseSection).join('\n')}
    </div>
  </section>

  <section class="sp-sec" aria-labelledby="ppHow">
    <div class="sp-sh"><h2 class="sp-h2" id="ppHow">How a pass <span>works</span></h2></div>
    <ol class="sp-steps" style="list-style:none;margin:0;padding:0">
      <li class="sp-box sp-step"><span class="n" aria-hidden="true">1</span><h3>Start free</h3><p>Everything free works without an account: the notes, and each course&rsquo;s free practice.</p></li>
      <li class="sp-box sp-step"><span class="n" aria-hidden="true">2</span><h3>Buy one course</h3><p>A free account holds the pass, so it follows you to every device.</p></li>
      <li class="sp-box sp-step"><span class="n" aria-hidden="true">3</span><h3>Study without limits</h3><p>Everything Premium adds, until the pass ends. Buying another adds its days after this one.</p></li>
      <li class="sp-box sp-step"><span class="n" aria-hidden="true">4</span><h3>It ends on its own</h3><p>No renewal. Your progress stays and the free parts keep working.</p></li>
    </ol>
  </section>

  <section class="sp-faq sp-sec" aria-labelledby="ppRules">
    <div class="sp-faq__intro">
      <h2 class="sp-h2" id="ppRules">The rules, <span>in plain words</span></h2>
      <p class="hand">no fine print</p>
      <p>${esc(FREE_SENTENCE)}</p>
      <p>A pass costs $${LOW} to $${HIGH}, about what ${tutorSpan} with a private tutor costs (<a href="${TUTOR_HOUR.source}" rel="noopener">Care.com</a> puts a US tutor&rsquo;s average starting rate near $${TUTOR_HOUR.rate} an hour, ${TUTOR_HOUR.checked}).</p>
      <p>The details are in the <a href="terms.html#premium">terms</a>.</p>
    </div>
    <div class="sp-qa pp-rules">
      <details class="sp-box" open><summary>Is this a subscription?</summary><p><strong>One-time, never a subscription.</strong> Prices are in US dollars; sales tax or VAT is added at checkout and shown before you pay. Polar, our merchant of record, sells the pass and sends the receipt.</p></details>
      <details class="sp-box"><summary>Do I need an account?</summary><p><strong>Buying needs a free account</strong>, so the pass follows you to every device. Everything free works without one.</p></details>
      <details class="sp-box"><summary>How do refunds work?</summary><p>Refund a pass yourself, in full, from your <a href="account.html">Account</a> page within 7 days of buying it. Once per account and email address.</p></details>
      <details class="sp-box"><summary>What happens when a pass ends?</summary><p>Your progress, XP and streaks stay; only the Premium parts lock again. Buying another pass adds its days after the current one.${DATED.length ? ` A pass with an end date (${esc(listWords(DATED.map((k) => COURSES[k].name)))}) runs through that date <a href="terms.html#fixed-date">whenever it is bought</a>.` : ''}</p></details>
      <details class="sp-box"><summary>I&rsquo;m under 18. Can I buy one?</summary><p>You need a parent or guardian&rsquo;s permission, and they accept the <a href="terms.html#premium">terms</a> for you; under 16, they should make the purchase.</p></details>
    </div>
  </section>
</div>
<div class="xshell narrow">
  <footer>
${MARK ? `    ${TM_HTML}
` : ''}    <p class="privacy-link"><a href="privacy.html">Privacy</a> &middot; <a href="terms.html">Terms</a> &middot; <a href="about.html">About</a> &middot; <a href="sources.html">Sources</a> &middot; <a href="changelog.html">What&rsquo;s new</a> &middot; <a href="premium.html">Premium</a> &middot; <a href="account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
  </footer>
</div>

<script>
// Open the course the visitor came from: ?course= (a key or its folder), a
// #key link, or the course page that linked here. With none, all stay folded.
(function(){
  var list = [].slice.call(document.querySelectorAll('details.pp-course'));
  var want = null, q = null, ref = '';
  try { q = new URLSearchParams(location.search).get('course'); } catch(e){}
  var h = location.hash.replace('#', '');
  try { var r = new URL(document.referrer); if(r.origin === location.origin) ref = r.pathname; } catch(e){}
  list.forEach(function(d){
    var path = d.getAttribute('data-path'), folder = path.split('/').join('');
    if(!want && q && (q === d.id || q === folder)) want = d;
  });
  if(!want && h) want = document.getElementById(h);
  if(!want && ref) list.forEach(function(d){ if(!want && ref.indexOf(d.getAttribute('data-path')) === 0) want = d; });
  if(want && want.tagName === 'DETAILS'){
    want.open = true;
    if(want !== list[0] || h) want.scrollIntoView({ block: 'start' });
  }
})();
</script>
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
<script>
// Each pass's price per day, from premium.js once it has loaded (a dated pass
// counts the days it has left, so this cannot be written at build time).
document.addEventListener('DOMContentLoaded', function(){
  var P = window.LevlPremium;
  if (!P || !P.perDay) return;
  [].forEach.call(document.querySelectorAll('.pp-day[data-pass]'), function(el){ el.textContent = P.perDay(el.getAttribute('data-pass')); });
});
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

/* Two plan cards side by side (polish 2026-10-17, A6: one thin centred
   paragraph left a wide card empty). Both lists are the clauses of
   FREE_SENTENCE, so the cards cannot drift from what every other page says. */
function hubPricing() {
  const low = Math.min(...ORDER.map((k) => lowest(COURSES[k]).price));
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  const [notes, lessons, adds] = FREE_SENTENCE.replace(/\.$/, '').split('; ');
  if (!adds || !/^Premium adds /.test(adds)) throw new Error('build-pricing: FREE_SENTENCE no longer reads "…; …; Premium adds …"');
  const premium = adds.replace(/^Premium adds /, '').split(/, | and /);
  const li = (t) => `<li>${esc(cap(t))}</li>`;
  /* Free and Premium side by side (site redesign 2026-10): what is free first,
     then the price with the risk-reversal line right under its button, where a
     guarantee line has been measured to help most. */
  const amount = founding
    ? `From ${money(low)}<span data-founding-until="${founding.until}"> (${money(foundingPrice(low))} founding price until ${longDate(founding.until)})</span>`
    : `From ${money(low)}`;
  return `  <section class="home-deal" aria-label="Free and Premium">
    <div class="plan">
      <span class="pill">Free</span>
      <h3>Start now, keep it free</h3>
      <p class="plan__note">Start in any course, with no card.</p>
      <ul>${li(notes)}${li(lessons)}<li>Your level, streak and weak topics</li><li>No ads</li></ul>
      <a class="btn-ghost" href="#subjects">Choose a course</a>
    </div>
    <div class="plan plan--premium">
      <span class="pill">Premium</span>
      <p class="plan__amt">${amount}</p>
      <p class="plan__note">One-time pass per course. No subscription.</p>
      <ul>${premium.map(li).join('')}</ul>
      <a class="btn-gold" href="premium.html">See prices for your course</a>
      <p class="plan__sure">Never renews. Full refund within 7 days.</p>
    </div>
  </section>
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
/* On the page the price answer is one line plus the link (polish 2026-10-17,
   A7); the structured data keeps every price. */
const PRICE_SHORT = `A one-time pass for one course, from ${money(LOW)} to ${money(HIGH)} in US dollars, with no subscription.`;
const FAQ = [
  ['Is LevlPrep free?', FREE_SENTENCE],
  ['How much does Premium cost?', PRICE],
  [MARK ? 'Is LevlPrep affiliated with the NREMT, ATI, OpenStax or the College Board?' : 'Is LevlPrep affiliated with the NREMT, ATI or OpenStax?', AFFILIATION],
];

function homeTry() {
  const H = JSON.parse(readFileSync(join(ROOT, 'scripts/lib/course-homes.json'), 'utf8'));
  const items = OPEN.map((c) => {
    const d = H[c.key];
    if (!d || !d.sample || !d.try || !Array.isArray(d.sample.opts)) return null;
    return { k: c.key, pill: `${d.short || d.name} &middot; ${(d.sample.tags || [])[0] || 'Sample'}`, q: d.sample.q, o: d.sample.opts,
      ok: d.try.ok, t: d.try.title, w: d.try.why, href: `${c.dir}/practice.html`, name: d.short || d.name };
  }).filter(Boolean);
  const json = JSON.stringify(items).replace(/</g, '\\u003c');
  // The questions and the script live in assets/home-try.js (written here), so the homepage stays inside
  // its weight budget; the page keeps the NREMT question as its no-JavaScript fallback.
  const js = `/* Written by scripts/build-pricing.mjs from scripts/lib/course-homes.json; do not edit. */
(function(){var DATA=${json};
var f=document.getElementById('tryq');if(!f)return;var all=DATA;
var ok=1;if(all.length){var last=null;try{last=localStorage.getItem('levl_tryq_last');}catch(e){}
var pool=all.filter(function(x){return x.k!==last;});var it=(pool.length?pool:all)[Math.floor(Math.random()*(pool.length||all.length))];
try{localStorage.setItem('levl_tryq_last',it.k);}catch(e){}ok=it.ok;
f.querySelector('.pill').innerHTML=it.pill;document.getElementById('tryq-stem').innerHTML=it.q;
var fs=f.querySelector('fieldset');fs.querySelectorAll('label').forEach(function(l){l.remove();});
it.o.forEach(function(t,i){var l=document.createElement('label');var inp=document.createElement('input');inp.type='radio';inp.name='tryq';l.appendChild(inp);var sp=document.createElement('span');sp.innerHTML=t;l.appendChild(sp);if(i===ok)l.className='ok';fs.appendChild(l);});
var why=f.querySelector('.tryq__why');why.innerHTML='<b>'+it.t+'</b>'+it.w;var m=f.querySelector('.tryq__more a');m.href=it.href;m.textContent='Keep going with free '+it.name+' questions';}
f.addEventListener('change',function(e){if(f.classList.contains('done'))return;e.target.closest('label').classList.add('picked');f.classList.add('done');[].forEach.call(f.querySelectorAll('input'),function(i){i.disabled=true;});});f.addEventListener('submit',function(e){e.preventDefault();});})();
`;
  put('assets/home-try.js', js);
  return `    <script src="assets/home-try.js" defer></script>`;
}

/* Who makes this, how the questions are written and what changes, folded into the FAQ instead of a row of
   cards under it (Olivier, 2026-10-26). They carry links, so they are written as HTML and stay out of the
   FAQPage data. */
const HOME_ABOUT_QA = [
  ['Who makes LevlPrep?', 'An independent project, not a company or a training program. Premium is an optional one-time pass, and <a href="premium.html">what is free</a> is listed course by course. No ads.'],
  ['How are the questions written?', 'Every question in every course is original, written for LevlPrep with an explanation on each one: NREMT questions to current national guidelines and the five domains of the Registry&rsquo;s 2025 EMT exam, every other course&rsquo;s questions to the topic that teaches them. Automated checks look for answer-position and length tells. <a href="sources.html">Sources and checks</a>.'],
  ['How do I see what changed?', 'Corrected questions, new lessons and site fixes are listed, dated, on <a href="changelog.html">What&rsquo;s new</a>.'],
];

function hubFaq() {
  return `  <section class="home-faq" aria-labelledby="home-faq-h">
    <h2 id="home-faq-h">Questions</h2>
    <div class="hub-faq">
${FAQ.map(([q, a], i) => `      <details class="faq-item"><summary>${esc(q)}</summary>
      <p>${esc(i === 1 ? PRICE_SHORT : a)}${i === 1 ? ' <a href="premium.html">Every price, course by course</a>.' : ''}</p></details>`).join('\n')}
${HOME_ABOUT_QA.map(([q, a]) => `      <details class="faq-item"><summary>${q}</summary>
      <p>${a}</p></details>`).join('\n')}
    </div>
  </section>`;
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
        // The official channels, listed on about.html too.
        sameAs: ['https://www.youtube.com/@levlprep', 'https://www.tiktok.com/@levl.prep'],
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

/* The homepage course cards (site redesign 2026-10, docs/site-redesign.md):
   each course's own cover art (assets/covers/<key>.svg, never a video
   thumbnail) with its two-tone title and handwritten line, then the name, a
   badge and one line. The three complete courses are typed in index.html in
   the same shape; the AP® cards come from here, counted from what is
   published, never typed. "N published topics", not "N topics": check-site
   reads "N topics" on the hub as the ochem curriculum's count. */
export function courseCard({ href, tint, cover, t1, t2, hand, name, tag, line }) {
  return `        <a class="ccard" href="${href}" data-tint="${tint}">
          <span class="cover" data-cover="${cover}"><img src="assets/covers/${cover}.svg" alt="" width="640" height="320" loading="lazy" decoding="async"><span class="cv-t"><b>${t1}<span>${t2}</span></b><em>${hand}</em></span></span>
          <span class="cmeta"><span class="cname">${name}</span><span class="tag${tag === 'Beta' ? ' tag--beta' : ''}">${tag}</span></span>
          <span class="cdesc">${line}</span>
        </a>`;
}
const published = (all, topics, rest) => (all ? `All ${fmt(topics)} published topics, ${rest}.` : `${fmt(topics)} published topic${topics === 1 ? '' : 's'} so far, ${rest}.`);
const apCard = (o) => courseCard({ tag: 'Free to start', t1: 'AP®', ...o });
function hubBioCard() {
  return apCard({ href: 'bio/', tint: 'bio', cover: 'apbio', t2: 'Biology', hand: 'every unit, data questions', name: 'AP® Biology',
    line: published(BIO_ALL, N.apbioTopics, 'with data-heavy practice like the real exam') });
}
function hubChemCard() {
  return apCard({ href: 'chem/', tint: 'apchem', cover: 'apchem', t2: 'Chemistry', hand: 'units and sig figs, checked', name: 'AP® Chemistry',
    line: published(CHEM_ALL, N.apchemTopics, 'with units and significant figures checked') });
}
function hubPhysCard() {
  return apCard({ href: 'physics/', tint: 'apphys', cover: 'apphys', t2: 'Physics 1', hand: 'force by force', name: 'AP® Physics 1',
    line: published(PHYS_ALL, N.apphysTopics, 'with free-body diagrams graded force by force') });
}
function hubCalcCard() {
  return apCard({ href: 'calculus/', tint: 'apcalc', cover: 'apcalc', t2: 'Calculus AB', hand: 'typed like real math', name: 'AP® Calculus AB',
    line: published(CALC_ALL, N.apcalcTopics, 'with answers you type as expressions') });
}
function hubStatCard() {
  return apCard({ href: 'statistics/', tint: 'apstat', cover: 'apstat', t2: 'Statistics', hand: 'conclusions in context', name: 'AP® Statistics',
    line: published(STAT_ALL, N.apstatTopics, 'with conclusions checked in context') });
}
function hubEnvCard() {
  return apCard({ href: 'environmental-science/', tint: 'apenv', cover: 'apenv', t1: 'AP® Environmental', t2: 'Science', hand: 'every calculation, with units', name: 'AP® Environmental Science',
    line: published(ENV_ALL, N.apenvTopics, 'with every calculation drilled with units') });
}
function hubPsyCard() {
  return apCard({ href: 'psychology/', tint: 'appsych', cover: 'appsych', t2: 'Psychology', hand: 'from neuron to society', name: 'AP® Psychology',
    line: published(PSY_ALL, N.appsychTopics, 'with every concept applied to a situation') });
}

{
  const rel = 'index.html';
  let src = readFileSync(join(ROOT, rel), 'utf8');
  src = between(src, '<!-- pricing:start -->', '<!-- pricing:end -->', hubPricing(), rel);
  src = between(src, '<!-- faq:start -->', '<!-- faq:end -->', hubFaq(), rel);
  src = between(src, '<!-- hub-bio:start -->', '<!-- hub-bio:end -->', BIO ? hubBioCard() : '', rel);
  src = between(src, '<!-- hub-chem:start -->', '<!-- hub-chem:end -->', CHEM ? hubChemCard() : '', rel);
  src = between(src, '<!-- hub-phys:start -->', '<!-- hub-phys:end -->', PHYS ? hubPhysCard() : '', rel);
  src = between(src, '<!-- hub-calc:start -->', '<!-- hub-calc:end -->', CALC ? hubCalcCard() : '', rel);
  src = between(src, '<!-- hub-stat:start -->', '<!-- hub-stat:end -->', STAT ? hubStatCard() : '', rel);
  src = between(src, '<!-- hub-env:start -->', '<!-- hub-env:end -->', ENV ? hubEnvCard() : '', rel);
  src = between(src, '<!-- hub-psy:start -->', '<!-- hub-psy:end -->', PSY ? hubPsyCard() : '', rel);
  /* The hero's course count (owner, 2026-10-12: it said "Three courses" with
     five live): every open course, from the registry. */
  const word = (NUMBER_WORDS[OPEN.length] || String(OPEN.length));
  for (const [re, txt] of [
    [/(<div class="eyebrow">Free to start &middot; )\w+( courses &middot; notes free forever<\/div>)/, `$1${word.toLowerCase()}$2`],
  ]) {
    if (!re.test(src)) throw new Error(`${rel}: the hero no longer matches ${re}`);
    src = src.replace(re, txt);
  }
  /* The try one question (Olivier, 2026-10-26: NREMT should not lead the homepage): every open course's
     own sample question from its course home (scripts/lib/course-homes.json, already published there), one
     picked per visit and never the same course twice in a row. The NREMT question in the markup is the
     no-JavaScript fallback. */
  src = between(src, '<!-- home-try:start -->', '<!-- home-try:end -->', homeTry(), rel);
  /* The desktop facts row (polish 2026-10-17, A2): course-neutral, counted
     from every open course's bank, never typed. */
  const BANK = { nremt: N.nremt, ochem: N.ochem, anp: N.anp, apbio: N.apbio, apchem: N.apchem, apphys: N.apphys, apcalc: N.apcalc, apstat: N.apstat, apenv: N.apenv, appsych: N.appsych };
  const allQ = OPEN.reduce((n, c) => n + (BANK[c.key] || 0), 0);
  const facts = [
    `${fmt(allQ)} practice questions, each one explained`,
    'Notes free forever in every course',
    `One level and one streak across all ${word.toLowerCase()} courses`,
    'No ads',
  ];
  src = between(src, '<!-- hero-facts:start -->', '<!-- hero-facts:end -->',
    `    <div class="fact-row">\n${facts.map((f) => `      <span><span class="dot"></span>${f}</span>`).join('\n')}\n    </div>`, rel);
  const m = src.indexOf('<!-- levlprep-structured-data -->');
  if (m === -1) throw new Error('index.html: no <!-- levlprep-structured-data --> marker');
  const s0 = src.indexOf('<script type="application/ld+json">', m);
  const s1 = src.indexOf('</script>', s0) + '</script>'.length;
  src = src.slice(0, s0) + hubLd() + src.slice(s1);
  put(rel, src);
}

/* ---- 2b. terms.html#fixed-date: every pass that runs through a date ------- */

{
  const rel = 'terms.html';
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const until = DATED.length ? COURSES[DATED[0]].passes.find((p) => p.until).until : null;
  if (DATED.some((k) => COURSES[k].passes.find((p) => p.until).until !== until)) throw new Error('terms.html#fixed-date: the dated passes end on different days; write the paragraph per course');
  const names = listWords(DATED.map((k) => COURSES[k].name));
  const one = DATED.length === 1;
  const para = DATED.length
    ? `        <p id="fixed-date"><strong>Passes with an end date:</strong> most passes run for a number of days from when they start. ${one ? `The ${esc(names)} pass instead runs` : `The ${esc(names)} passes instead run`} through a date (${new Date(until + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}, the end of the 2027 exam season) whenever you buy ${one ? 'it' : 'one'}, never ending sooner; bought while another pass for the same course or a free month is running, it starts when that one ends and still runs through the date (at least a day). ${one ? 'It is' : 'They are'} not sold after that date.</p>`
    : '';
  put(rel, between(src, '<!-- fixed-date:start -->', '<!-- fixed-date:end -->', para, rel));
}

/* ---- 3. counts in premium.js ------------------------------------------------ */

{
  const rel = 'assets/premium.js';
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const out = src.replace(/(The full )[\d,]+(-question bank[^\n]*\/\/ count:)(nremt|ochem|anp)/g,
    (_, a, b, k) => `${a}${fmt(N[k])}${b}${k}`);
  // AP® Biology and AP® Chemistry state no count while their banks grow unit by unit.
  for (const k of ORDER.filter((x) => x !== 'apbio' && x !== 'apchem' && x !== 'apphys' && x !== 'apcalc' && x !== 'apstat' && x !== 'apenv' && x !== 'appsych')) if (!out.includes(`// count:${k}`)) throw new Error(`${rel}: no line marked // count:${k}`);
  put(rel, out);
}

/* ---- 4. manifests ------------------------------------------------------------ */

/* Manifests never carry the AP® mark (docs/apbio-spec.md, "Trademark": no
   "AP" in meta tags or ad copy, and an install name is both): AP® Biology's
   app is "Biology". */
const MANIFEST_NAMES = { nremt: 'NREMT-EMT exam prep', ochem: 'Organic Chemistry', anp: 'Anatomy & Physiology', apbio: 'Biology', apchem: 'Chemistry', apphys: 'Physics', apcalc: 'Calculus', apstat: 'Statistics', apenv: 'Environmental Science', appsych: 'Psychology' };
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
  'physics/manifest.json': {
    name: 'LevlPrep — Physics',
    short_name: 'LevlPrep Physics',
    description: `Physics 1 on the 2024-25 course framework, in its order, for the May exam: every notes page is free forever and Units 1 and 2 are fully interactive, with the math you need; Premium adds unlimited practice, the FRQs, practice exams, every trainer and every lesson.`,
  },
  'calculus/manifest.json': {
    name: 'LevlPrep — Calculus',
    short_name: 'LevlPrep Calculus',
    description: `Calculus AB on the course framework, in its order, for the May exam: every notes page is free forever and Units 1 and 2 are fully interactive, with the math you need; Premium adds unlimited practice, the FRQs, practice exams, every trainer and every lesson.`,
  },
  'statistics/manifest.json': {
    name: 'LevlPrep Statistics',
    short_name: 'LevlPrep Statistics',
    description: `Statistics on the revised course framework, in its order, for the May 2027 exam: every notes page is free forever and Unit 1 is fully interactive, with the math you need; Premium adds unlimited practice, the FRQs, practice exams, every trainer and every lesson.`,
  },
  'environmental-science/manifest.json': {
    name: 'LevlPrep Environmental Science',
    short_name: 'LevlPrep Env Science',
    description: `Environmental Science on the course framework, in its order, for the May 2027 exam: every notes page is free forever and Units 1 and 2 are fully interactive, with the math you need; Premium adds unlimited practice, the FRQs, practice exams, every trainer and every lesson.`,
  },
  'psychology/manifest.json': {
    name: 'LevlPrep Psychology',
    short_name: 'LevlPrep Psychology',
    description: `Psychology on the course framework, in its order, for the May 2027 exam: every notes page is free forever and Unit 1 is fully interactive, with the research skills you need; Premium adds unlimited practice, the FRQs, practice exams, every trainer and every lesson.`,
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
  const card = `    <a class="card nf-card" href="/ochem/"><img class="sp-cv" src="/assets/covers/ochem.svg" alt="" width="640" height="320" loading="lazy" decoding="async">
      <h2>Organic Chemistry</h2>
      <p>${N.ochemChapters} chapters and ${N.ochemTopics} topics, ${N.ochemMechanisms} mechanisms you perform yourself, and ${N.ochemTools} tools.</p>
    </a>`;
  let out = between(src, '<!-- nf-ochem:start -->', '<!-- nf-ochem:end -->', card, rel);
  const bio = `    <a class="card nf-card" href="/bio/"><img class="sp-cv" src="/assets/covers/apbio.svg" alt="" width="640" height="320" loading="lazy" decoding="async">
      <h2>AP® Biology</h2>
      <p>${BIO_ALL ? `All ${fmt(N.apbioTopics)} published topics` : `${fmt(N.apbioTopics)} published topic${N.apbioTopics === 1 ? '' : 's'} so far`}, in the order of the 2025 course framework, with free notes for every one.</p>
    </a>`;
  out = between(out, '<!-- nf-bio:start -->', '<!-- nf-bio:end -->', BIO ? bio : '', rel);
  const chem = `    <a class="card nf-card" href="/chem/"><img class="sp-cv" src="/assets/covers/apchem.svg" alt="" width="640" height="320" loading="lazy" decoding="async">
      <h2>AP® Chemistry</h2>
      <p>${CHEM_ALL ? `All ${fmt(N.apchemTopics)} published topics` : `${fmt(N.apchemTopics)} published topic${N.apchemTopics === 1 ? '' : 's'} so far`}, in the order of the 2024 course framework, with free notes for every one.</p>
    </a>`;
  out = between(out, '<!-- nf-chem:start -->', '<!-- nf-chem:end -->', CHEM ? chem : '', rel);
  const phys = `    <a class="card nf-card" href="/physics/"><img class="sp-cv" src="/assets/covers/apphys.svg" alt="" width="640" height="320" loading="lazy" decoding="async">
      <h2>AP® Physics 1</h2>
      <p>${PHYS_ALL ? `All ${fmt(N.apphysTopics)} published topics` : `${fmt(N.apphysTopics)} published topic${N.apphysTopics === 1 ? '' : 's'} so far`}, in the order of the 2024-25 course framework, with free notes for every one.</p>
    </a>`;
  out = between(out, '<!-- nf-phys:start -->', '<!-- nf-phys:end -->', PHYS ? phys : '', rel);
  const calc = `    <a class="card nf-card" href="/calculus/"><img class="sp-cv" src="/assets/covers/apcalc.svg" alt="" width="640" height="320" loading="lazy" decoding="async">
      <h2>AP® Calculus AB</h2>
      <p>${CALC_ALL ? `All ${fmt(N.apcalcTopics)} published topics` : `${fmt(N.apcalcTopics)} published topic${N.apcalcTopics === 1 ? '' : 's'} so far`}, in the order of the course framework, with free notes for every one.</p>
    </a>`;
  out = between(out, '<!-- nf-calc:start -->', '<!-- nf-calc:end -->', CALC ? calc : '', rel);
  const stat = `    <a class="card nf-card" href="/statistics/"><img class="sp-cv" src="/assets/covers/apstat.svg" alt="" width="640" height="320" loading="lazy" decoding="async">
      <h2>AP® Statistics</h2>
      <p>${STAT_ALL ? `All ${fmt(N.apstatTopics)} published topics` : `${fmt(N.apstatTopics)} published topic${N.apstatTopics === 1 ? '' : 's'} so far`}, in the order of the revised course framework, with free notes for every one.</p>
    </a>`;
  out = between(out, '<!-- nf-stat:start -->', '<!-- nf-stat:end -->', STAT ? stat : '', rel);
  const env = `    <a class="card nf-card" href="/environmental-science/"><img class="sp-cv" src="/assets/covers/apenv.svg" alt="" width="640" height="320" loading="lazy" decoding="async">
      <h2>AP® Environmental Science</h2>
      <p>${ENV_ALL ? `All ${fmt(N.apenvTopics)} published topics` : `${fmt(N.apenvTopics)} published topic${N.apenvTopics === 1 ? '' : 's'} so far`}, in the order of the course framework, with free notes for every one.</p>
    </a>`;
  out = between(out, '<!-- nf-env:start -->', '<!-- nf-env:end -->', ENV ? env : '', rel);
  const psy = `    <a class="card nf-card" href="/psychology/"><img class="sp-cv" src="/assets/covers/appsych.svg" alt="" width="640" height="320" loading="lazy" decoding="async">
      <h2>AP® Psychology</h2>
      <p>${PSY_ALL ? `All ${fmt(N.appsychTopics)} published topics` : `${fmt(N.appsychTopics)} published topic${N.appsychTopics === 1 ? '' : 's'} so far`}, in the order of the course framework, with free notes for every one.</p>
    </a>`;
  out = between(out, '<!-- nf-psy:start -->', '<!-- nf-psy:end -->', PSY ? psy : '', rel);
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
