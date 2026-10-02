/* What the ochem course teaches where, and what each topic leans on before it
   has been taught. Shared by scripts/ochem-forward-refs.mjs (the report) and
   scripts/site-rules/ochem-sequencing.mjs (the check).

   A TERM is taught by the topic ochem/data/glossary.json files it under (that
   file is keyed by the teaching topic). A topic USES a term when the term, or
   one of its aliases, appears in what a reader of that topic sees: its notes
   prose, its interactive lesson, its mechanism walkthrough and its practice-bank
   items. A FORWARD REFERENCE is a use of a term whose teaching topic comes later
   in curriculum.js. Cross-reference links (a topic's or chapter's name, linked)
   are not uses: they are the labeled pointers the course writes on purpose, and
   are checked separately for the direction words around them ("later",
   "you saw", ...), which go stale when chapters move.

   Everything here is text processing; nothing about chemistry is decided. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export function loadModules(ROOT, src) {
  const code = src || readFileSync(join(ROOT, 'ochem', 'assets', 'curriculum.js'), 'utf8');
  const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} }, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.OchemCurriculum.MODULES;
}

/* Position of every topic and chapter in course order. */
export function positions(MODULES) {
  const topic = {}, chapterOf = {}, chapter = {};
  let i = 0;
  MODULES.forEach((m, mi) => {
    chapter[m.id] = { index: mi, first: i, last: i + m.topics.length - 1, title: m.title };
    m.topics.forEach((t) => { topic[t.id] = i++; chapterOf[t.id] = m.id; });
  });
  return { topic, chapter, chapterOf, count: i };
}

const ENT = { nbsp: ' ', mdash: '—', ndash: '–', amp: '&', lt: '<', gt: '>', quot: '"', rarr: '→', larr: '←',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', pi: 'π', sigma: 'σ', middot: '·', minus: '−', times: '×',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', deg: '°', rlhar: '⇌', harr: '↔' };
export function decode(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (n in ENT ? ENT[n] : m));
}

/* The reader-visible part of a page, with its cross-reference links pulled
   out. Returns { text, links: [{ href, label, sentence }] }. */
const LINK = /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
export function pageText(file) {
  if (!existsSync(file)) return null;
  let s = readFileSync(file, 'utf8');
  if (s.includes('<!-- notes:start -->')) {
    s = s.split('<!-- notes:start -->')[1].split('<!-- notes:end -->')[0];
  } else {
    s = s.slice(Math.max(0, s.indexOf('<body')));
    s = s.replace(/<nav class="lesson-links[\s\S]*?<\/nav>/g, ' ')
      .replace(/<!-- crumb:start -->[\s\S]*?<!-- crumb:end -->/g, ' ')
      .replace(/<script src=[^>]*><\/script>/g, ' ');
  }
  s = s.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
  const links = [];
  // Mark each link in place so the sentence around it can be recovered.
  s = s.replace(LINK, (m, href, label) => {
    links.push({ href, label: decode(label.replace(/<[^>]+>/g, '')).trim() });
    return ` \u0001${links.length - 1}\u0002 `;
  });
  s = decode(s.replace(/<[^>]+>/g, ' ')).replace(/\\'/g, "'").replace(/\s+/g, ' ');
  // Sentences: split at . ! ? followed by space and a capital, or at step/paragraph seams.
  const sentences = s.split(/(?<=[.!?])\s+(?=[A-Z(“"])|'\s*\+\s*'/);
  for (const sent of sentences) {
    // A link's own words are the text between the link before it and the link
    // after it, so "X, later, and Y, which you saw" is read per link.
    const pieces = sent.split(/\u0001\d+\u0002/);
    const ids = [...sent.matchAll(/\u0001(\d+)\u0002/g)].map((m) => +m[1]);
    ids.forEach((k, j) => {
      links[k].sentence = sent.replace(/\u0001(\d+)\u0002/g, (_, q) => links[+q].label).trim();
      links[k].near = `${pieces[j]} ${links[k].label} ${pieces[j + 1]}`.trim();
    });
  }
  const text = s.replace(/\u0001\d+\u0002/g, ' ');
  return { text, links };
}

/* Every reader-visible text source for each topic, by topic id. */
export function topicSources(ROOT, MODULES) {
  const bank = JSON.parse(readFileSync(join(ROOT, 'ochem', 'assets', 'practice-bank.json'), 'utf8'));
  const out = {};
  for (const m of MODULES) for (const t of m.topics) {
    const srcs = [];
    const add = (kind, file) => { const p = pageText(join(ROOT, 'ochem', file)); if (p) srcs.push({ kind, file, ...p }); };
    add('notes', `notes/${t.id}.html`);
    if (t.href && t.href.startsWith('lessons/')) add('lesson', t.href);
    if (t.href && t.href.startsWith('mechanisms/')) add('mechanism', t.href);
    if (t.mechanism) add('mechanism', t.mechanism);
    (bank[t.id] || []).forEach((q, i) => {
      const text = decode([q.q, ...(q.options || []), q.why || ''].join(' \n '));
      srcs.push({ kind: 'bank', file: `${t.id}#${i}`, text, links: [] });
    });
    out[t.id] = srcs;
  }
  return out;
}

/* Glossary terms with the topic that teaches them. Terms marked pop:false are
   ordinary words (the glossary keeps them off the popups for that reason) and
   are skipped here too. */
export function glossaryTerms(ROOT) {
  const g = JSON.parse(readFileSync(join(ROOT, 'ochem', 'data', 'glossary.json'), 'utf8'));
  const terms = [];
  for (const [topic, list] of Object.entries(g)) {
    for (const e of list) {
      if (e.pop === false) continue;
      const forms = [e.term, ...(e.aliases || [])].filter((f) => f && f.length >= 3);
      terms.push({ term: e.term, topic, res: forms.map(termRe) });
    }
  }
  return terms;
}
function termRe(form) {
  const esc = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // All-lowercase terms match in any case; a term with capitals (SN2, Grignard)
  // matches with only its first letter free.
  const body = form === form.toLowerCase() ? esc : `[${esc[0].toLowerCase()}${esc[0].toUpperCase()}]${esc.slice(1)}`;
  return new RegExp(`(?<![A-Za-z0-9-])${body}(?![A-Za-z0-9])`, form === form.toLowerCase() ? 'gi' : 'g');
}

/* Forward references: { topic, term, taughtIn, kind, file, count }. */
export function forwardRefs(MODULES, sources, terms) {
  const pos = positions(MODULES).topic;
  const out = [];
  for (const m of MODULES) for (const t of m.topics) {
    const here = pos[t.id];
    const later = terms.filter((g) => pos[g.topic] !== undefined && pos[g.topic] > here);
    for (const src of sources[t.id] || []) {
      for (const g of later) {
        let n = 0;
        for (const re of g.res) { re.lastIndex = 0; n += (src.text.match(re) || []).length; }
        if (n) out.push({ topic: t.id, term: g.term, taughtIn: g.topic, kind: src.kind, file: src.file, count: n });
      }
    }
  }
  return out;
}

/* Where a cross-reference link points, as a course position range. */
export function linkTarget(href, P) {
  let m = href.match(/(?:^|\/)(notes|lessons|mechanisms)\/([a-z0-9-]+)\.html/);
  if (m) {
    if (P.topic[m[2]] !== undefined) return { id: m[2], from: P.topic[m[2]], to: P.topic[m[2]] };
    // A mechanism page named differently from its topic (addition, carbonyl-addition...).
    return null;
  }
  m = href.match(/learn\.html#(m-)?([a-z0-9-]+)/);
  if (m) {
    if (m[1] && P.chapter[m[2]]) return { id: 'm-' + m[2], from: P.chapter[m[2]].first, to: P.chapter[m[2]].last };
    if (!m[1] && P.topic[m[2]] !== undefined) return { id: m[2], from: P.topic[m[2]], to: P.topic[m[2]] };
  }
  return null;
}

/* Direction words that contradict where a link now points.
   "later" words next to a link to something already taught, or "earlier"
   words next to a link to something not yet taught. */
const LATER = /\b(later|ahead|coming up|comes after|you will (?:meet|see|learn)|you['’]ll (?:meet|see|learn)|will be (?:taught|covered|shown)|in a later|a later chapter|a later section|until you reach)\b/i;
const EARLIER = /\b(earlier|already (?:met|seen|saw|learned|taught|covered|drew|showed)|you (?:saw|met|learned|drew)|as you saw|as .{0,40} (?:showed|explained|drew|set out|introduced)|(?<!comes? |came )back in|recall from|from earlier|the previous (?:chapter|section))\b/i;
export function directionProblems(MODULES, sources) {
  const P = positions(MODULES);
  const out = [];
  for (const m of MODULES) for (const t of m.topics) {
    const here = P.topic[t.id];
    for (const src of sources[t.id] || []) {
      for (const l of src.links || []) {
        const tg = linkTarget(l.href, P);
        if (!tg || !l.near) continue;
        // Inside its own chapter a link may be either side; only the words decide.
        const before = tg.to < here, after = tg.from > here;
        const lab = l.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pastTense = lab && new RegExp(`${lab},? (?:has |had )?(?:showed|shown|explained|drew|drawn|set out|introduced|noted|covered|taught|worked)\\b`, 'i').test(l.near);
        if (before && LATER.test(l.near)) out.push({ topic: t.id, kind: src.kind, target: tg.id, says: 'later', sentence: l.sentence });
        if (after && (EARLIER.test(l.near) || pastTense)) out.push({ topic: t.id, kind: src.kind, target: tg.id, says: 'earlier', sentence: l.sentence });
      }
    }
  }
  return out;
}
