/* One title pattern for every page: "{Topic} — {Course} | LevlPrep", at most
   60 characters as a reader sees it (entities decoded).

   Site audit 2026-10 (SEO): about 640 course titles carried no "LevlPrep" and
   three separator styles (—, |, :). Every generator now builds its titles
   here, and site rule title-pattern holds hand-written pages to the same shape.

   courseTitle(topic, labels) tries each course label in turn, longest first
   ("Organic Chemistry Notes", then "Organic Chem Notes"...), and keeps the
   first that fits. When none fits, the topic is cut at a word and ended
   with "…" next to the first label (the shortest when that would leave
   under 20 characters of topic); the brand always stays (consistency audit
   2026-11, D13). The label always stays, so a lesson and its notes page
   never share a title.

   { keepFirstLabel: true } lowers that floor to 16 characters. */
export const BRAND = 'LevlPrep';
export const TITLE_MAX = 60;

export const decode = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&rsquo;/g, '’').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&amp;/g, '&');

export const titleLength = (s) => decode(s).length;

export function courseTitle(topic, labels, { keepFirstLabel = false } = {}) {
  const list = Array.isArray(labels) ? labels : [labels];
  for (const label of list) {
    const t = `${topic} — ${label} | ${BRAND}`;
    if (titleLength(t) <= TITLE_MAX) return t;
  }
  /* Nothing fits whole: the brand always stays (consistency audit 2026-11, D13), so the topic is shortened. It keeps
     its first words and its last ones with "…" between ("Impacts of… Overfishing"), since the end of a topic name is
     usually what tells it from its neighbours; a lesson and its notes page still differ by their label. */
  const shortenings = (label) => {
    const room = TITLE_MAX - titleLength(` — ${label} | ${BRAND}`);
    const words = decode(topic).split(/\s+/);
    const clean = (w) => w.replace(/[\s,;:–—(-]+$/, '');
    // k first words and m last words. Ones that keep the last word come first, then by length.
    const out = [];
    for (let k = words.length - 1; k >= 0; k--) {
      for (let m = words.length - k; m >= 0; m--) {
        if (!k && !m) continue;
        const head = clean(words.slice(0, k).join(' '));
        const tail = m ? words.slice(words.length - m).join(' ').replace(/^[,;:]\s*/, '') : '';
        const t = !m ? `${head}…` : k ? `${head}… ${tail}` : `…${tail}`;
        if (t.length <= room) out.push({ t, tail: m > 0 });
      }
    }
    return out.sort((x, y) => (y.tail - x.tail) || (y.t.length - x.t.length)).map((x) => x.t);
  };
  /* The first label while it leaves a readable topic, else the next. Within one build, two pages never get the same
     shortened title: the next candidate is taken (check-site section 33). */
  const floor = keepFirstLabel ? 16 : 20;
  for (const [i, label] of list.entries()) {
    const c = shortenings(label);
    if (!c.length || (c[0].length < floor && i < list.length - 1)) continue;
    const pick = c.find((t) => !ISSUED.has(`${t} — ${label}`)) || c[0];
    ISSUED.add(`${pick} — ${label}`);
    return `${pick} — ${label} | ${BRAND}`;
  }
  // A single long word that cannot be cut: the label drops its "AP® " before the topic is cut mid-word.
  const plain = list[list.length - 1].replace(/^AP® /, '');
  const whole = `${topic} — ${plain} | ${BRAND}`;
  if (titleLength(whole) <= TITLE_MAX) return whole;
  return `${decode(topic).slice(0, TITLE_MAX - titleLength(` — ${plain} | ${BRAND}`) - 1)}… — ${plain} | ${BRAND}`;
}
const ISSUED = new Set();

/* A site-level page (hub, legal, search): "{Page} | LevlPrep". */
export function siteTitle(page) {
  return `${page} | ${BRAND}`;
}

/* The shape site rule title-pattern enforces: every title ends " | LevlPrep" (consistency audit 2026-11, D13). */
export function titleProblem(title) {
  if (/^[^|]+ \| LevlPrep$/.test(title)) return null;
  if (/\|/.test(title)) return 'uses "|" other than before "LevlPrep"';
  return 'does not end with " | LevlPrep"';
}
