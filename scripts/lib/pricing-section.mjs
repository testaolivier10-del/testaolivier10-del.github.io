/* One course's Free vs Premium card: the cover and name, the table, the buy area (founding price, per-day price,
   Unlock and Start free, the refund line), the competitor comparison and the fine print, all from assets/premium.js.
   Written by courseSection() for premium.html (scripts/build-pricing.mjs, folded, one per course) and for the
   course home of a visitor without Premium (scripts/lib/r3-home.mjs, open; course redesign r4, decision 2), so the
   two can never say different things. The page that shows it carries premium.js (the buy button, data-premium-buy,
   and the per-day price, .pp-day) and the small scripts that swap the founding price after its date and switch
   between two passes. */
import { premiumData, money, foundingPrice, longDate, compareTable, guaranteeText, SURE, dayAfterUS } from './premium-data.mjs';
import { PAID } from './courses.mjs';

const { COURSES, FOUNDING } = premiumData();
const founding = FOUNDING && FOUNDING.until ? FOUNDING : null;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lowest = (c) => c.passes.reduce((a, b) => (b.price < a.price ? b : a));

export const COURSE_URL = Object.fromEntries(PAID.map((c) => [c.key, c.path]));

/* Where each "For comparison" line in premium.js comes from (checked on the
   competitors' own pages, 2026-10-25). Re-check before changing a sentence. */
const AP_SOURCES = [['Fiveable', 'https://fiveable.me/pricing']];
const COMPARE_SOURCES = {
  nremt: [['App Store', 'https://apps.apple.com/us/app/pocket-prep-ems-2026/id1503584128']],
  apbio: AP_SOURCES, apchem: AP_SOURCES, apphys: AP_SOURCES, apcalc: AP_SOURCES, apstat: AP_SOURCES, apenv: AP_SOURCES, appsych: AP_SOURCES, apprecalc: AP_SOURCES, apcalcbc: AP_SOURCES, apmacro: [...AP_SOURCES, ['UWorld', 'https://collegeprep.uworld.com/ap/']],
};

/* A price that changes on its own when the founding offer ends, with no
   rebuild: the page's script swaps [data-founding-until] for
   [data-founding-after] after the date. */
export function priceSpans(price) {
  return founding
    ? `<span data-founding-until="${founding.until}">${money(foundingPrice(price))}</span><span data-founding-after="${founding.until}" hidden>${money(price)}</span>`
    : money(price);
}
/* "Founding price · $25 from February 1, 2027": when the full price starts,
   never a struck-through price nobody has paid yet (FTC 16 CFR 233). */
function foundingNote(p) {
  return founding ? `<span data-founding-until="${founding.until}">Founding price &middot; ${money(p.price)} from ${dayAfterUS(founding.until)}</span>` : '';
}

/* One <details> per course (polish 2026-10-17, A8): on premium.html the page opens on the course the visitor came
   from and the rest stay folded to one line with their lowest price. Inside, the Free vs Premium table and one buy
   button that goes straight to checkout (owner 2026-10-28); a course with two passes gets a switch above it.
   o (the course home): { up: path to the site root, open: true, start: the Start free link, source: the analytics
   source of the buy button, h: the heading level } */
export function courseSection(key, o = {}) {
  const up = o.up || '';
  const c = COURSES[key];
  const low = lowest(c);
  const multi = c.passes.length > 1;
  const h = o.h || 'h2';
  const head = multi
    ? c.passes.map((p) => `<span data-pp-for="${p.id}"${p === low ? '' : ' hidden'}>${priceSpans(p.price)}</span>`).join('')
    : priceSpans(low.price);
  const sw = multi ? `
          <fieldset class="pp-switch"><legend class="sr-only">Pass length</legend>${c.passes.map((p) => `<label><input type="radio" name="pp-pass-${key}" value="${p.id}"${p === low ? ' checked' : ''}><span>${esc(p.label)}</span></label>`).join('')}</fieldset>` : '';
  return `
        <details class="pp-course" id="${key}" data-path="${COURSE_URL[key]}"${o.open ? ' open' : ''}>
          <summary><img class="pp-cover" src="${up}assets/covers/thumb/${key}.svg" alt="" width="640" height="320" loading="lazy" decoding="async"><${h} id="pp-${key}">${esc(c.name)}</${h}><span class="pp-from">${multi ? 'from ' : ''}${priceSpans(low.price)}${c.passes.length === 1 ? `<small class="pp-len">${c.passes[0].until ? 'school year' : esc(c.passes[0].label)}</small>` : ''}</span></summary>
          <div class="pp-body" data-premium-scope>${sw}
          ${compareTable(c, head)}
          <div class="pp-buy">
            <p class="pp-note">${c.passes.map((p) => `<span data-pp-for="${p.id}"${p === low ? '' : ' hidden'}>${p.until ? `One pass, valid through ${esc(longDate(p.until))} whenever you buy it. ` : `One payment for ${esc(p.label.toLowerCase())}. `}${foundingNote(p)}<small class="pp-day" data-pass="${p.id}"></small></span>`).join('')}</p>
            <p class="pp-actions"><button type="button" class="btn-press pp-cta" data-premium-buy="${low.id}" data-premium-source="${o.source || 'pricing-page'}">Unlock for ${c.passes.map((p) => `<span data-pp-for="${p.id}"${p === low ? '' : ' hidden'}>${priceSpans(p.price)}</span>`).join('')}</button> <a href="${o.start || COURSE_URL[key]}">Start free</a></p>
            <p class="pp-sure">${esc(SURE)}</p>
            <p class="pp-msg" data-premium-msg role="status"></p>
          </div>${c.compare ? `
          <p class="pp-compare">For comparison: ${esc(c.compare)} Source: ${(COMPARE_SOURCES[key] || []).map(([n, u]) => `<a href="${u}" rel="noopener">${esc(n)}</a>`).join(', ')}.</p>` : ''}
          ${c.guarantee ? `<details class="pp-guarantee" id="pass-or-extend"><summary>Pass-or-extend: if you don&rsquo;t pass the NREMT during your pass, you can claim more days free.</summary><p>${esc(guaranteeText())} <a href="${up}terms.html#pass-or-extend">The full terms</a>.</p></details>` : ''}
          <p class="pp-terms"><a href="${up}terms.html#premium">Fine print and terms</a></p>
          </div>
        </details>`;
}

/* The scripts a page showing courseSection() needs (premium.html carries its own, longer copies; the course home
   uses this one): the founding price ends on its date without a rebuild, a two-pass course's switch picks what the
   button buys, and premium.js writes each pass's price per day once it has loaded. */
export const SECTION_SCRIPT = `<script>(function(){var n=Date.now();[].forEach.call(document.querySelectorAll('.pp-course [data-founding-until]'),function(e){if(n>Date.parse(e.getAttribute('data-founding-until')+'T23:59:59Z'))e.hidden=true;});[].forEach.call(document.querySelectorAll('.pp-course [data-founding-after]'),function(e){if(n>Date.parse(e.getAttribute('data-founding-after')+'T23:59:59Z'))e.hidden=false;});document.addEventListener('change',function(e){var r=e.target;if(!r||r.type!=='radio'||!/^pp-pass-/.test(r.name))return;var b=r.closest('.pp-body');b.querySelector('[data-premium-buy]').setAttribute('data-premium-buy',r.value);[].forEach.call(b.querySelectorAll('[data-pp-for]'),function(x){x.hidden=x.getAttribute('data-pp-for')!==r.value;});});document.addEventListener('DOMContentLoaded',function(){var P=window.LevlPremium;if(P&&P.perDay)[].forEach.call(document.querySelectorAll('.pp-day[data-pass]'),function(x){x.textContent=P.perDay(x.getAttribute('data-pass'));});});})();</script>`;
