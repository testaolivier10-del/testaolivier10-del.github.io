/* What an A&P tool page says before its script runs (docs/site-health.md,
   "Fuller tool and lesson pages", 2026-11-12).

   The AP® tools carry an authored intro and "how it works" (tool-about.mjs).
   The eight A&P tools have no such text: what they are is their content, in
   anatomy-physiology/data/tools/<slug>.json. So the closed "About this tool"
   line here lists what is inside: each item's own title and the intro or
   setup it already shows a student, then the notes pages of the topics it
   covers. Answers (steps in order, correct options, label positions) are
   never written out. The tool's runtime replaces everything in #app when it
   mounts, so a student with JavaScript sees no change.

     slug     the tool (anatomy-physiology/data/tools/<slug>.json)
     data     that file, parsed
     topic    id -> { title } for the course's topics, or undefined
     built    Set of topic ids with a built notes page
     esc      the builder's HTML escaper */

const CAP = 24;

/* Up to CAP items, one topic at a time in the file's (course) order, so the
   list spans the whole tool rather than its first chapter. */
function spread(items, cap = CAP) {
  const byTopic = new Map();
  for (const it of items) {
    const k = it.topic || '';
    if (!byTopic.has(k)) byTopic.set(k, []);
    byTopic.get(k).push(it);
  }
  const queues = [...byTopic.values()];
  const out = [];
  for (let round = 0; out.length < cap && queues.some((q) => q.length > round); round++) {
    for (const q of queues) if (q[round] && out.length < cap) out.push(q[round]);
  }
  const order = new Map(items.map((it, i) => [it, i]));
  return out.sort((a, b) => order.get(a) - order.get(b));
}

const first = (s) => {
  const t = String(s || '').trim();
  const m = /^.*?[.!?](\s|$)/.exec(t);
  return m ? m[0].trim() : t;
};

function list(items, text, esc, noun, cap) {
  const shown = spread(items, cap);
  const li = shown.map((it) => {
    const t = text(it);
    return `<li><b>${esc(it.title)}</b>${t ? `: ${esc(t)}` : ''}</li>`;
  }).join('');
  const more = items.length > shown.length ? `<p>And ${items.length - shown.length} more ${noun} in the tool.</p>` : '';
  return `<p>${items.length} ${noun}, including:</p><ul>${li}</ul>${more}`;
}

function inside(slug, d, esc) {
  switch (slug) {
    case 'graphs': return list(d.graphs || [], (g) => first(g.intro), esc, 'graphs');
    case 'pathways': return list(d.pathways || [], (p) => first(p.intro), esc, 'pathways');
    case 'calculators': return list(d.calculators || [], (c) => first(c.intro), esc, 'calculators');
    case 'feedback-loops': return list(d.loops || [], (l) => first(l.scenario), esc, 'feedback loops');
    case 'predict': return list(d.scenarios || [], (s) => first(s.setup), esc, 'prediction scenarios'); // not "N scenarios": check-site reads that as the NREMT simulator's count
    case 'lab-practical': return list(d.sets || [], () => '', esc, 'labeling sets', Infinity); // titles only, so all of them
    case 'anatomy-3d': {
      const items = (d.structures || []).map((s) => ({ ...s, title: s.name }));
      return list(items, (s) => first(s.what), esc, 'structures');
    }
    case 'word-roots': {
      const parts = d.parts || [];
      const kind = (type, label) => {
        const of = parts.filter((p) => p.type === type);
        if (!of.length) return '';
        return `<p><b>${label}</b> (${of.length}), for example: ${of.slice(0, 12).map((p) => `${esc(p.form)} (${esc(p.meaning)})`).join('; ')}.</p>`;
      };
      const terms = d.terms || [];
      return `<p>${terms.length} medical terms built from ${parts.length} word parts.</p>${kind('prefix', 'Prefixes')}${kind('root', 'Roots')}${kind('suffix', 'Suffixes')}`;
    }
    default: return '';
  }
}

export function anpToolAbout({ slug, data, topic, built, esc }) {
  const body = inside(slug, data, esc);
  if (!body) return '';
  const items = data.graphs || data.pathways || data.calculators || data.loops || data.scenarios || data.sets || data.structures || data.terms || [];
  const seen = [];
  for (const it of items) if (it.topic && built.has(it.topic) && !seen.includes(it.topic)) seen.push(it.topic);
  const notes = seen.slice(0, 12).map((id) => `<a href="../notes/${id}.html">${esc(topic(id)?.title || id)}</a>`).join(', ');
  const tail = notes ? `<p class="tool-about-n">Notes for these topics: ${notes}${seen.length > 12 ? ' and more' : ''}.</p>` : '';
  return `<details class="tool-about"><summary>About this tool</summary><h2 class="tool-about-h">What is inside</h2>${body}${tail}</details>`;
}
