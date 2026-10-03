/* One title pattern for every page: "{Topic} — {Course} | LevlPrep", at most
   60 characters as a reader sees it (entities decoded).

   Site audit 2026-10 (SEO): about 640 course titles carried no "LevlPrep" and
   three separator styles (—, |, :). Every generator now builds its titles
   here, and site rule title-pattern holds hand-written pages to the same shape.

   courseTitle(topic, labels) tries each course label in turn, longest first
   ("Organic Chemistry Notes", then "Organic Chem Notes"...), and keeps the
   first that fits. A long topic name matters more to a searcher than the
   brand, so next the shortest label is tried without " | LevlPrep"; only if
   that still does not fit is the topic cut at a word and ended with "…". The
   label always stays, so a lesson and its notes page never share a title. */
export const BRAND = 'LevlPrep';
export const TITLE_MAX = 60;

export const decode = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&rsquo;/g, '’').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&amp;/g, '&');

export const titleLength = (s) => decode(s).length;

export function courseTitle(topic, labels) {
  const list = Array.isArray(labels) ? labels : [labels];
  for (const label of list) {
    const t = `${topic} — ${label} | ${BRAND}`;
    if (titleLength(t) <= TITLE_MAX) return t;
  }
  const label = list[list.length - 1];
  const bare = `${topic} — ${label}`;
  if (titleLength(bare) <= TITLE_MAX) return bare;
  const room = TITLE_MAX - titleLength(` — ${label}`) - 1;
  const cut = decode(topic).slice(0, room).replace(/\s+\S*$/, '').replace(/[\s,;:–—-]+$/, '');
  return `${cut}… — ${label}`;
}

/* A site-level page (hub, legal, search): "{Page} | LevlPrep". */
export function siteTitle(page) {
  return `${page} | ${BRAND}`;
}

/* The shape site rule title-pattern enforces: "… | LevlPrep", or "… — Label"
   when the brand would not fit. */
export function titleProblem(title) {
  if (/^[^|]+ \| LevlPrep$/.test(title)) return null;
  if (/\|/.test(title)) return 'uses "|" other than before "LevlPrep"';
  if (!/ — /.test(title)) return 'does not end with " | LevlPrep"';
  if (titleLength(`${title} | ${BRAND}`) <= TITLE_MAX) return '" | LevlPrep" would fit but is missing';
  return null;
}
