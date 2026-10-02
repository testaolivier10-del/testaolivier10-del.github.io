/* The breadcrumb row for a page, from its own BreadcrumbList JSON-LD
   (scripts/build-crumbs.mjs; build-ochem-glossary.mjs calls it on the page it
   writes). applyCrumbs(html) returns the page with the row between the crumb
   markers under the tab row, or without one when the trail is shorter than
   three steps (a course home). */
export const START = '<!-- crumb:start -->';
export const END = '<!-- crumb:end -->';
const ANCHOR = '<div class="course-nav"></div>\n';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function trail(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let d;
    try { d = JSON.parse(m[1]); } catch { continue; }
    for (const x of d['@graph'] || [d]) {
      if (x['@type'] === 'BreadcrumbList') return x.itemListElement.map((i) => ({ name: i.name, href: new URL(i.item).pathname + new URL(i.item).hash }));
    }
  }
  return null;
}

function block(items) {
  const parts = items.map((it, i) => i === items.length - 1
    ? `<span aria-current="page">${esc(it.name)}</span>`
    : `<a href="${esc(it.href)}">${esc(it.name)}</a> <span aria-hidden="true">&rsaquo;</span>`);
  return `${START}\n<div class="xshell" data-crumb><nav class="site-crumb" aria-label="Breadcrumb">${parts.join(' ')}</nav></div>\n${END}\n`;
}

export function applyCrumbs(html) {
  if (/http-equiv="refresh"/i.test(html) || !html.includes(ANCHOR)) return html;
  const stripped = html.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n`), '');
  const items = trail(stripped);
  return items && items.length >= 3 ? stripped.replace(ANCHOR, ANCHOR + block(items)) : stripped;
}
