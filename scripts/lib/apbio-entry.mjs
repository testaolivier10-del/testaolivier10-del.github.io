/* AP® Biology free unit practice tests and the justification trainer's data
   (docs/apbio-architecture.md, "Unit practice tests" and "Justification
   trainer"), written by scripts/build-apbio.mjs. Forked from
   scripts/lib/apcalc-entry.mjs (Calculus, Physics and Chemistry build theirs
   the same way); no score calculator (owner, 2026-10-17).

     unit-tests/<unit>.html      a free sample of 12 reviewed bank questions
                                 per unit, readable without JavaScript, with
                                 a link into practice and the timed unit test
     assets/justify.json         the justification trainer's prompts

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadJustify, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apbio-exams.mjs';

export const SAMPLE_SIZE = 12;

/* The unit test sample: the same choice every build, so the page is stable
   for search. Whole stimulus sets of single-answer items first (at most two,
   from different topics, 8 items at most), then standalone single or
   numeric items spread over the unit's topics, skipping lesson check items
   (they are already on the free lessons) and recall items where enough
   others exist. Every item is an existing, reviewed bank item. */
export function unitSample(ch, ctx) {
  const { map, C } = ctx;
  const checks = new Set(Object.values(C.lessons).flatMap(L => L.check || []));
  const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
  const sets = [], singles = [];
  for (const t of topics) {
    const items = C.questions[t.id].items;
    const by = new Map();
    for (const q of items) {
      if (q.stimulus) { if (!by.has(q.stimulus)) by.set(q.stimulus, []); by.get(q.stimulus).push(q); }
      else if (q.type === 'single' || q.type === 'numeric') singles.push(q);
    }
    for (const [sid, qs] of by) {
      const ok = qs.filter(q => q.type === 'single' && !/previous (question|set|calculation)/i.test(q.q));
      if (ok.length >= 3 && ok.length === qs.filter(q => q.type === 'single').length) sets.push({ sid, topic: t.id, items: ok.slice(0, 4), checks: ok.filter(q => checks.has(q.id)).length });
    }
  }
  sets.sort((a, b) => a.checks - b.checks || a.sid.localeCompare(b.sid));
  const out = [], usedT = new Set();
  for (const s of sets) { if (out.length >= 8 || usedT.has(s.topic)) continue; if (out.length + s.items.length > 8) continue; out.push(...s.items); usedT.add(s.topic); }
  const pool = singles.filter(q => !checks.has(q.id) && q.level !== 'recall' && !/previous/i.test(q.q));
  const byTopic = new Map(); for (const q of pool) { if (!byTopic.has(q.topic)) byTopic.set(q.topic, []); byTopic.get(q.topic).push(q); }
  for (let round = 0; out.length < SAMPLE_SIZE && round < 6; round++) {
    for (const t of topics) {
      if (out.length >= SAMPLE_SIZE) break;
      if (round === 0 && usedT.has(t.id)) continue;
      const q = (byTopic.get(t.id) || [])[round - (usedT.has(t.id) ? 1 : 0)];
      if (q && !out.includes(q)) out.push(q);
    }
  }
  return out;
}

export function entryPages(ctx) {
  const { map, C, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, SITE, BASE, COURSE_ID, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic } = ctx;
  const units = map.chapters.filter(c => c.part === 'course');
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const out = {};

  /* ---------------------------------------------------- unit practice tests */
  const stimFor = q => ((C.questions[q.topic] || {}).stimuli || {})[q.stimulus];
  for (const ch of units.filter(built)) {
    const depth = '../', path = `unit-tests/${ch.id}.html`, url = `${SITE}${BASE}${path}`;
    const qs = unitSample(ch, ctx).map(questionForPage);
    const title = courseTitle(`Unit ${ch.n} Practice Test: ${ch.title}`, [LABEL]);
    const desc = clampDesc(`A free ${qs.length}-question biology practice test for Unit ${ch.n}, ${ch.title.toLowerCase()}, with data sets and an explanation for every option.`);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Quiz', '@id': `${url}#quiz`, name: `Unit ${ch.n} practice test: ${ch.title}`, url, description: desc, isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', about: ch.title, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test`, url }])),
    ] };
    const stimuli = {};
    for (const q of qs) if (q.stimulus) { const s = stimFor(q); if (s) stimuli[q.stimulus] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') }; }
    const html = groupSets(qs).map(g => {
      const items = g.items.map(q => questionHtml(q, qs.indexOf(q) + 1)).join('');
      const s = g.stimulus && stimuli[g.stimulus];
      return s ? `<div class="bio-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell bio-app bio-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: ctx.COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero bio-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Sets share one table, graph or experiment, as on the real exam.</p>
  <p class="bio-small bio-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="bio-qs" data-set="check">${html}</div>
  <section class="xsection bio-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="bio-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="bio-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Write a full answer with <a href="../justify.html?unit=${ch.id}">the justification trainer</a>. Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="bio-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['bio-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* ---------------------------------------------------- justification data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    prompts: prompts.map((p, i) => ({ id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: p.earns, misses: p.misses, ...(i < FREE_JUSTIFY ? { free: true } : {}) })),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), prompts: prompts.length };
}
