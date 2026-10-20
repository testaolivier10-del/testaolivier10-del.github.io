/* Plain text from the site's FRQ JSON (rubric, prompts, stimulus), for the
   grader's prompt. The JSON carries HTML: tables, MathML with a TeX
   annotation, inline SVG graphs with an aria-label, and <img> figures with
   alt text. A model reads TeX and "a | b | c" rows far better than markup, and
   a figure it cannot see is described by the alt text the site already
   writes for screen readers. Shared by the Worker and the eval script. */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', times: '×', minus: '−', deg: '°', micro: 'µ', le: '≤', ge: '≥', ne: '≠', plusmn: '±', rarr: '→', larr: '←', harr: '↔', rlarr: '⇌', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

export function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, e.toLowerCase()) ? ENTITIES[e.toLowerCase()] : m;
  });
}

export function htmlText(html) {
  let h = String(html == null ? '' : html);
  // MathML: keep the TeX annotation when there is one, else the visible text.
  h = h.replace(/<math\b[\s\S]*?<\/math>/gi, (m) => {
    const tex = m.match(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/i);
    return ' ' + (tex ? tex[1] : m.replace(/<[^>]+>/g, '')) + ' ';
  });
  h = h.replace(/<wbr\s*\/?>/gi, '');
  // Figures: their alt text or aria-label, then any text drawn in an SVG.
  h = h.replace(/<img\b[^>]*?\balt="([^"]*)"[^>]*>/gi, ' [Figure: $1] ');
  h = h.replace(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi, (m, attrs, body) => {
    const label = (attrs.match(/aria-label="([^"]*)"/i) || [])[1] || '';
    const titles = [...body.matchAll(/<(?:title|desc)\b[^>]*>([\s\S]*?)<\/(?:title|desc)>/gi)].map((x) => x[1]);
    const texts = [...body.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)].map((x) => x[1].replace(/<[^>]+>/g, ''));
    const words = [label, ...titles].filter(Boolean).join('. ');
    return ' [Figure: ' + words + (texts.length ? ' Labels drawn: ' + texts.join('; ') : '') + '] ';
  });
  h = h.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  h = h.replace(/<br\s*\/?>/gi, '\n');
  h = h.replace(/<\/(p|div|li|tr|caption|h[1-6]|figcaption|section|ol|ul|table)>/gi, '\n');
  h = h.replace(/<li\b[^>]*>/gi, '- ');
  h = h.replace(/<\/t[dh]>/gi, ' | ');
  h = h.replace(/<sup>([\s\S]*?)<\/sup>/gi, '^$1').replace(/<sub>([\s\S]*?)<\/sub>/gi, '_$1');
  h = h.replace(/<[^>]+>/g, '');
  h = decodeEntities(h);
  return h.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
}

/* The question, laid out the way the grader's prompt quotes it. */
export function questionText(f, maxStimulus = 7000) {
  const stim = htmlText(f.stimulus && f.stimulus.html).slice(0, maxStimulus);
  const lines = [`Question: ${htmlText(f.title)} (${f.points} points)`];
  if (f.stimulus && f.stimulus.title) lines.push(`Stimulus title: ${htmlText(f.stimulus.title)}`);
  lines.push('Stimulus:', stim, '');
  for (const p of f.parts) {
    lines.push(`Part (${p.label}), ${p.points} point${p.points === 1 ? '' : 's'}: ${htmlText(p.prompt)}`);
  }
  return lines.join('\n');
}

export function rubricText(f) {
  const out = [];
  for (const p of f.parts) {
    out.push(`Part (${p.label}) rubric, ${p.rubric.length} point${p.rubric.length === 1 ? '' : 's'}:`);
    p.rubric.forEach((r, k) => {
      out.push(`  Point ${k + 1}: ${htmlText(r.point)}`);
      if (r.accept && r.accept.length) out.push(`    Also accept (examples, not a complete list; notes here are binding): ${r.accept.map((a) => htmlText(a)).join(' ; ')}`);
    });
    out.push(`  A full-credit answer to part (${p.label}): ${htmlText(p.sample)}`);
  }
  return out.join('\n');
}
