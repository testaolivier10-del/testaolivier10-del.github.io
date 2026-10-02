/* Structured data never calls Premium content free, or prices it at $0.

   Audit finding (site audit 2026-10, SEO): 279 lesson pages and 4 Premium
   tool pages carried "isAccessibleForFree": true, the tools with an offer of
   "price": "0", while Premium locked them. Google can treat that as
   misleading markup. Now:
   - a page whose interactive part is Premium (ochem lessons and mechanisms
     outside premium.js's free chapters, A&P lessons outside Foundations,
     Premium tools, the NREMT scenario simulator) says isAccessibleForFree:
     false, with hasPart.cssSelector naming a class that is on the page;
   - nothing carries isAccessibleForFree: false without that hasPart;
   - no Premium page offers a price of 0;
   - every Course node's offers match premium.js's passes. */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { premiumData } from '../lib/premium-data.mjs';

const PREMIUM_TOOLS_OCHEM = () => {
  const src = readFileSync(new URL('../../ochem/assets/ochem-premium.js', import.meta.url), 'utf8');
  return JSON.parse(/var FREE_TOOLS = (\[[^\]]*\])/.exec(src)[1].replace(/'/g, '"'));
};

function nodesOf(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const ld = JSON.parse(m[1]);
      for (const n of ld['@graph'] || [ld]) {
        out.push(n);
        if (n.itemListElement) for (const li of n.itemListElement) if (li.item && typeof li.item === 'object') out.push(li.item);
      }
    } catch { /* section 2 of check-site reports bad JSON */ }
  }
  return out;
}

export default function ({ ROOT, fail, htmlFiles }) {
  const { COURSES } = premiumData();
  const freeTools = PREMIUM_TOOLS_OCHEM();
  const courseOf = { '/nremt/#course': 'nremt', '/ochem/#course': 'ochem', '/anatomy-physiology/#course': 'anp' };

  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    const html = readFileSync(file, 'utf8');
    if (!html.includes('application/ld+json')) continue;
    const nodes = nodesOf(html);
    const main = nodes.find((n) => n.isAccessibleForFree !== undefined);

    // Which pages are Premium, from the same data the gates use.
    let gated = false;
    const ch = (/data-chapter="([^"]+)"/.exec(html) || [])[1];
    if (/^ochem\/(lessons|mechanisms)\//.test(rel)) gated = !COURSES.ochem.freeChapters.includes(ch);
    else if (/^ochem\/tools\/([a-z0-9-]+)\.html$/.test(rel)) gated = !freeTools.includes(rel.match(/tools\/([a-z0-9-]+)\.html/)[1]);
    else if (/^anatomy-physiology\/tools\//.test(rel)) gated = /data-premium="tools"/.test(html);
    else if (rel === 'nremt/scenario-sim.html') gated = true;
    // A&P lessons are checked below, chapter by chapter, from the map.

    if (gated && (!main || main.isAccessibleForFree !== false)) {
      fail(`gated-structured-data: ${rel} is Premium but its structured data does not say isAccessibleForFree: false.`);
    }
    for (const n of nodes) {
      if (n.isAccessibleForFree === false) {
        const sel = n.hasPart && n.hasPart.cssSelector;
        const cls = sel && /^\.([\w-]+)$/.exec(sel);
        if (!cls) fail(`gated-structured-data: ${rel} marks content not free without hasPart.cssSelector (a class).`);
        else if (!new RegExp(`class="([^"]*\\s)?${cls[1]}(\\s[^"]*)?"`).test(html)) fail(`gated-structured-data: ${rel}: hasPart.cssSelector ${sel} matches nothing on the page.`);
      }
      const offers = [].concat(n.offers || []);
      if ((gated || n.isAccessibleForFree === false) && offers.some((o) => String(o.price) === '0')) {
        fail(`gated-structured-data: ${rel} offers a Premium feature at price 0.`);
      }
      if (n['@type'] === 'Course') {
        if (n.isAccessibleForFree === true) fail(`gated-structured-data: ${rel}: a Course is free to start, not free; drop isAccessibleForFree: true and list its offers.`);
        const key = Object.entries(courseOf).find(([k]) => String(n['@id'] || '').endsWith(k));
        if (key) {
          const want = COURSES[key[1]].passes.map((p) => String(p.price)).join(',');
          const got = offers.map((o) => String(o.price)).join(',');
          if (want !== got) fail(`gated-structured-data: ${rel}: ${key[1]} Course offers are [${got}], premium.js passes are [${want}].`);
        }
      }
    }
  }

  // A&P lessons: the chapter comes from the page's breadcrumb data, so check
  // the count instead: every lesson outside Foundations is marked.
  const anpFree = new Set(COURSES.anp.freeChapters);
  const map = JSON.parse(readFileSync(new URL('../../docs/anp-dependency-map.json', import.meta.url), 'utf8'));
  for (const t of map.topics) {
    const file = htmlFiles.find((f) => relative(ROOT, f).split(sep).join('/') === `anatomy-physiology/lessons/${t.id}.html`);
    if (!file) continue;
    const node = nodesOf(readFileSync(file, 'utf8')).find((n) => n.learningResourceType === 'Lesson');
    const want = anpFree.has(t.chapter);
    if (!node || node.isAccessibleForFree !== want) {
      fail(`gated-structured-data: anatomy-physiology/lessons/${t.id}.html (chapter ${t.chapter}) should say isAccessibleForFree: ${want}.`);
    }
  }
}
