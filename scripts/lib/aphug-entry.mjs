/* AP® Human Geography search-entry pages and exam data
   (docs/aphug-architecture.md, "Exams and entry pages"), written by
   scripts/build-aphug.mjs:

     formula-sheet.html          "Formulas you must know": the exam gives
                                 no formula sheet and allows no calculator
                                 (framework.md section 5), so every rate,
                                 density and ratio it asks for, in our own
                                 words, with when to use it, the classic trap
                                 and where it is taught. Free, indexable. No
                                 score calculator (spec decision 6).
     unit-tests/<unit>.html      a free sample of 12 questions per unit,
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the "Make it specific" trainer's prompts
     models.html                 "Models you must know": every model the
                                 CED names, its picture drawn by the model
                                 engine (ApHugModel, and Model Studio's
                                 figures for the free layouts), what it
                                 claims, its assumptions, one limit, a real
                                 dated example and the models it is mixed up
                                 with (data/models.json). Free, indexable.

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, examVersion, FREE_JUSTIFY, JUSTIFY_SKILLS } from './aphug-exams.mjs';
import { renderMath, prepareBank, specificSlots } from './aphug-build.mjs';
import { Calc } from './aphug-mathlib.mjs';
import { r3Inner } from './r3-inner.mjs';
import { runtime } from './aphug-tool-checks/_shared.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const SAMPLE_SIZE = 12;

/* The unit test sample: the same choice every build, so the page is
   stable for search. Whole stimulus sets of single-answer items first (at
   most two, from different topics), then standalone items spread over the
   unit's topics, skipping lesson check items (they are already on the free
   lessons) where enough others exist. A question in a practice exam
   (ctx.exclude, every id in data/exams/forms.json) is never shown, nor any
   set one of its questions belongs to, so the free page gives nothing of
   the exams away. */
export function unitSample(ch, ctx) {
  const { map, C } = ctx;
  const exclude = ctx.exclude || new Set();
  const checks = new Set(Object.values(C.lessons).flatMap(L => L.check || []));
  const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
  const sets = [], singles = [];
  for (const t of topics) {
    const usedSets = new Set(C.questions[t.id].items.filter(q => exclude.has(q.id) && q.stimulus).map(q => q.stimulus));
    const items = C.questions[t.id].items.filter(q => !exclude.has(q.id) && !usedSets.has(q.stimulus));
    const by = new Map();
    for (const q of items) {
      if (q.stimulus) { if (!by.has(q.stimulus)) by.set(q.stimulus, []); by.get(q.stimulus).push(q); }
      else if (q.type === 'single' || q.type === 'numeric') singles.push(q);
    }
    for (const [sid, qs] of by) {
      const ok = qs.filter(q => q.type === 'single' && !/previous (question|set|calculation)/.test(q.q));
      if (ok.length >= 3 && ok.length === qs.filter(q => q.type === 'single').length) sets.push({ sid, topic: t.id, items: ok.slice(0, 4), checks: ok.filter(q => checks.has(q.id)).length });
    }
  }
  sets.sort((a, b) => a.checks - b.checks || a.sid.localeCompare(b.sid));
  const out = [], usedT = new Set();
  for (const s of sets) { if (out.length >= 8 || usedT.has(s.topic)) continue; if (out.length + s.items.length > 8) continue; out.push(...s.items); usedT.add(s.topic); }
  const pool = singles.filter(q => !checks.has(q.id) && q.level !== 'recall' && !/previous/.test(q.q));
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

/* The formulas page, "Formulas you must know" (formula-sheet.html, the path
   every AP® course uses for its sheet). The exam gives no formula sheet and
   allows no calculator (framework.md section 5), yet Units 1, 2 and 6 ask for
   rates, densities, ratios, doubling time and the rank-size and gravity
   models. Each row is [formula (TeX), what it is, when you use it, the classic
   trap, 'Unit N' or 'Skills you need', topic id, trainers, recipe, worked], in
   our own words; the trainers (tools/<slug>.html) are linked only when live.
   The worked line is [setup TeX, ApHugCalc recipe, unit TeX, decimals]: the
   page prints "setup = answer unit" with the answer computed by ApHugCalc at
   build time, so no worked number is typed by hand, and every worked number
   is small enough to do by hand. Each row is also a card in the "Formulas"
   flashcard deck (assets/formulas.json). */
const D = String.raw;
const SK = 'Skills you need';
export const EQ = [
  { id: 'rates', h: 'Births, deaths and growth', rows: [
    [D`\text{CBR} = \frac{\text{births in a year}}{\text{population}} \times 1{,}000`, 'The crude birth rate: births per 1,000 people a year.', 'Comparing how fast places add people by birth.', 'It is per 1,000 people, not a percent, and not per woman (that is the total fertility rate).', 'Unit 2', 'population-dynamics', ['population-lab'], 'cbr',
      [D`\frac{30{,}000}{1{,}000{,}000} \times 1{,}000`, { fn: 'cbr', args: [30000, 1000000] }, D`\text{ per }1{,}000`, 0]],
    [D`\text{RNI} = \frac{\text{CBR} - \text{CDR}}{10}`, 'The rate of natural increase: the percent a population grows each year from births minus deaths.', 'Reading growth from the two crude rates.', 'Migration is not in it, and the order is births minus deaths. Divide by 10 to turn "per 1,000" into a percent.', 'Unit 2', 'population-dynamics', ['population-lab'], 'rni',
      [D`\frac{30 - 10}{10}`, { fn: 'rni', args: [30, 10] }, D`\%`, 0]],
    [D`\text{doubling time} \approx \frac{70}{\text{RNI}\ (\%)}`, 'Doubling time by the rule of 70: about how many years a population takes to double at its current rate of natural increase.', 'Turning a growth rate into a time.', 'Use the RNI as a percent (2, not 0.02). A population that is not growing has no doubling time.', 'Unit 2', 'population-dynamics', ['population-lab'], 'doublingTime',
      [D`\frac{70}{2}`, { fn: 'doublingTime', args: [2] }, D`\text{ years}`, 0]],
    [D`\text{NMR} = \frac{\text{immigrants} - \text{emigrants}}{\text{population}} \times 1{,}000`, 'The net migration rate: people gained or lost by migration, per 1,000 people a year.', 'Adding migration to natural increase to see total growth.', 'More people leaving than arriving gives a negative rate.', 'Unit 2', 'migration-causes', ['population-lab'], 'netMigrationRate',
      [D`\frac{6{,}000 - 2{,}000}{1{,}000{,}000} \times 1{,}000`, { fn: 'netMigrationRate', args: [6000, 2000, 1000000] }, D`\text{ per }1{,}000`, 0]],
  ] },
  { id: 'structure', h: 'Age and sex', rows: [
    [D`\text{dependency ratio} = \frac{\text{under }15 + 65\text{ and over}}{15\text{ to }64} \times 100`, 'The dependency ratio: people of the ages that usually depend on others, per 100 people of working age.', 'Reading the strain a population pyramid shows: many children, many older people, or both.', 'The working-age group (15 to 64) goes on the bottom. Youth and elderly ratios use one group each.', 'Unit 2', 'aging-populations', ['population-lab'], 'dependency',
      [D`\frac{30 + 20}{100} \times 100`, { fn: 'dependency', args: [30, 20, 100] }, '', 0]],
    [D`\text{sex ratio} = \frac{\text{males}}{\text{females}} \times 100`, 'The sex ratio: males per 100 females.', 'Reading the two sides of a population pyramid.', 'Above 100 means more males. It changes with age: women live longer on average.', 'Unit 2', 'population-composition', ['population-lab'], 'sexRatio',
      [D`\frac{105}{100} \times 100`, { fn: 'sexRatio', args: [105, 100] }, '', 0]],
  ] },
  { id: 'density', h: 'Density', rows: [
    [D`\text{arithmetic density} = \frac{\text{population}}{\text{total land area}}`, 'Arithmetic density: people per unit of all the land.', 'A first comparison of crowding between places.', 'It hides where people live: deserts and mountains count as land.', 'Unit 2', 'distribution-consequences', ['population-lab'], 'arithmeticDensity',
      [D`\frac{1{,}000{,}000}{50{,}000\ \text{km}^2}`, { fn: 'arithmeticDensity', args: [1000000, 50000] }, D`\text{ per km}^2`, 0]],
    [D`\text{physiological density} = \frac{\text{population}}{\text{arable land}}`, 'Physiological density: people per unit of farmland, the pressure on the land that grows food.', 'Judging how hard a country\'s farmland must work.', 'The bottom is arable land only. Do not confuse it with carrying capacity, which is how many people land can support.', 'Unit 2', 'distribution-consequences', ['population-lab'], 'physiologicalDensity',
      [D`\frac{1{,}000{,}000}{5{,}000\ \text{km}^2}`, { fn: 'physiologicalDensity', args: [1000000, 5000] }, D`\text{ per km}^2`, 0]],
    [D`\text{agricultural density} = \frac{\text{farmers}}{\text{arable land}}`, 'Agricultural density: farmers per unit of farmland.', 'A clue to how mechanized farming is: fewer farmers per unit usually means more machines.', 'The top is farmers, not everyone.', 'Unit 2', 'distribution-consequences', ['population-lab'], 'agriculturalDensity',
      [D`\frac{100{,}000}{5{,}000\ \text{km}^2}`, { fn: 'agriculturalDensity', args: [100000, 5000] }, D`\text{ per km}^2`, 0]],
  ] },
  { id: 'cities', h: 'Cities and interaction', rows: [
    [D`P_n = \frac{P_1}{n}`, 'The rank-size rule: the city of rank n has about 1/n the population of the largest city.', 'Checking whether a country\'s cities follow the rule or have a primate city.', 'A primate city is far larger than the rule predicts for rank 1 against rank 2.', 'Unit 6', 'city-size-distribution', ['city-lab'], 'rankSize',
      [D`\frac{12{,}000{,}000}{3}`, { fn: 'rankSize', args: [12000000, 3] }, '', 0]],
    [D`\text{interaction} = k \times \frac{P_1 \times P_2}{d^2}`, 'The gravity model: interaction between two places rises with their populations and falls with the square of the distance between them.', 'Comparing which pair of cities will have more trips, calls or trade.', 'Square the distance. Twice as far means a quarter of the interaction, not half.', 'Unit 6', 'city-size-distribution', ['city-lab'], 'gravity',
      [D`\frac{4 \times 3}{2^2}`, { fn: 'gravity', args: [4, 3, 2] }, '', 0]],
    [D`\%\ \text{change} = \frac{\text{new} - \text{old}}{\text{old}} \times 100`, 'Percent change: how much a value grew or shrank, as a share of where it started.', 'Reading a table of populations or outputs over time.', 'Divide by the old value, not the new one.', SK, 'skills-reading', ['map-reader'], 'percentChange',
      [D`\frac{150 - 120}{120} \times 100`, { fn: 'percentChange', args: [120, 150] }, D`\%`, 0]],
  ] },
  { id: 'scale', h: 'Map scale', rows: [
    [D`\text{ground distance} = \text{map distance} \times \text{scale denominator}`, 'A ratio scale (1:50,000) turns a map length into a ground distance: 1 cm on the map is 50,000 cm on the ground.', 'Measuring on a reference map.', 'A large-scale map (1:10,000) shows a small area in detail; a small-scale map (1:10,000,000) shows a large area. Map scale is not the scale of analysis.', SK, 'skills-scale', ['scale-lab'], 'mapToGround',
      [D`4\ \text{cm} \times 50{,}000`, { fn: 'mapToGround', args: [4, 50000] }, D`\text{ km}`, 0]],
  ] },
];
/* A worked line as TeX: "setup = answer unit", the answer from ApHugCalc
   (to the row's decimals, thousands as {,}). */
export function workedValue(w) { return Calc.evaluate(w[1]); }
export function workedTex(w) {
  const v = workedValue(w), d = Math.max(0, w[3] || 0);
  const num = Number(v.toFixed(d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/,/g, '{,}');
  return `${w[0]} = ${w[4] || ''}${num}${w[2] ? `\\,${w[2]}` : ''}`;
}
/* The "Formulas" flashcard deck (assets/formulas.json, read by
   pages/flashcards.js): one card per row, front "what it is" and the cue,
   back the formula, its worked line and the trap; card id eq:<recipe>. */
export function formulaCards() {
  return EQ.flatMap(s => s.rows.map(r => ({ id: `eq:${r[7]}`, group: s.h, topic: r[5], front: renderMath([r[1]])[0], cue: renderMath([r[2]])[0],
    formula: renderMath([`$${r[0]}$`])[0], worked: renderMath([`$${workedTex(r[8])}$`])[0], trap: renderMath([r[3]])[0] })));
}

// Not formulas, but ideas the exam expects you to read off a source.
export const NOT_ON = [
  ['Scale of analysis', 'The scale of the data shown (global, regional, national, local), not the size of the area on the map. Provinces of one country are local (subnational) data.', 'skills-scale'],
  ['Pyramid shapes', 'A wide base (expansive) means many children and fast growth; straight sides (stationary) slow growth; a narrow base (constrictive) an aging, shrinking population.', 'population-composition'],
  ['Demographic transition stages', 'A pair of rates is consistent with a stage of the model; a country is never in a stage as a fact. Negative natural increase fits stage 5.', 'transition-model'],
  ['Say what a source cannot show', 'A national map hides differences inside the country; one year of data shows no trend.', 'skills-reading'],
];
// Exam-day facts (framework.md section 5).
export const TABLES = [
  ['No calculator', 'The AP® Human Geography exam allows no calculator. Every number it asks for (a rate, a density, a ratio, a doubling time) can be worked out by hand.'],
  ['No formula sheet', 'Nothing on this page is printed in Bluebook: know what each measure means and how to read it from a table, a pyramid or a map.'],
];

/* "Models you must know" (models.html): one entry per model in
   data/models.json order. Model Studio's 21 contexts give the picture, the
   claim, the assumptions and the first limit; data/models.json gives each a
   dated example and its easy-to-confuse partners, and writes the other five
   in full. Pictures: a free layout is Model Studio's figure (shapes only,
   every number and word in HTML over it); the others ApHugModel.artSvg
   (numbers only); in both, the numbered key is a list beside the picture. */
export function modelEntries(dataDir, map) {
  const p = join(dataDir, 'models.json'), sp = join(dataDir, 'tools', 'model-studio.json');
  if (!existsSync(p) || !existsSync(sp)) return [];
  const D = JSON.parse(readFileSync(p, 'utf8')), studio = JSON.parse(readFileSync(sp, 'utf8'));
  const R = runtime('model-studio'), MS = R.model;
  return D.order.map(id => {
    const c = studio.contexts.find(x => x.id === id), x = c ? D.studio[id] || {} : D.extra[id];
    if (!x) throw new Error(`models.json: no entry for ${id}`);
    const topic = c ? c.topic : x.topic, t = map.topicById(topic);
    if (!t) throw new Error(`models.json: ${id}: unknown topic ${topic}`);
    let model = c ? (c.build ? MS.GEN[c.build](R.M.rng(7), c) : c.model) : x.model;
    model = JSON.parse(JSON.stringify(model));
    const probs = R.Model.check(model);
    if (probs.length) throw new Error(`models.json: ${id}: model: ${probs.join('; ')}`);
    const lim = c ? (c.limits.right || [])[0] : null;
    return { id, topic, chapter: t.chapter, name: c ? c.name : x.name, origin: c ? c.origin : x.origin || '', aside: c ? c.aside || '' : '', claim: c ? c.claim : x.claim,
      assumes: c ? c.assumes : x.assumes, limit: lim ? `${lim.t}. ${lim.why}` : x.limit, example: x.example, confuse: x.confuse || [],
      model, figure: c && c.figure ? MS.figure(c.figure, c.build ? model : null) : null, studio: !!c,
      key: model.slots.map((sl, i) => ({ n: i + 1, slot: R.Model.slotName(model, i), piece: (model.pieces.find(q => q.id === model.key[sl.id]) || {}).text })) };
  });
}
function modelPicture(e, esc, artSvg) {
  if (!e.figure) return `<figure class="ms-fig ms-fig-art" data-layout="${esc(e.model.layout)}"><div class="ms-card"><div class="hug-model-art">${artSvg(e.model)}</div></div></figure>`;
  const f = e.figure, over = [];
  f.spots.forEach((list, i) => list.forEach(p => over.push(`<span class="ms-badge" style="left:${p[0]}%;top:${p[1]}%">${i + 1}</span>`)));
  for (const l of f.labels || []) over.push(`<span class="ms-tag${l.cls ? ' ' + esc(l.cls) : ''}" style="left:${l.x}%;top:${l.y}%">${esc(l.text)}</span>`);
  const legend = (f.legend || []).length ? `<ul class="ms-legend">${f.legend.map(l => `<li><span class="ms-sw ms-sw-${esc(l.sw)}" aria-hidden="true"></span>${esc(l.text)}</li>`).join('')}</ul>` : '';
  return `<figure class="ms-fig"><div class="ms-card"><div class="ms-pic">${f.svg}<div class="ms-over" aria-hidden="true">${over.join('')}</div></div>${legend}${f.note ? `<p class="ms-note">${esc(f.note)}</p>` : ''}${f.alt ? `<p class="ms-note">${esc(f.alt.note)} ${esc(f.alt.noteAlt)}</p>` : ''}</div></figure>`;
}

export function entryPages(ctx) {
  const { map, C, put, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools } = ctx;
  const units = map.chapters.filter(c => c.part === 'course');
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const topicLink = (id, depth) => C.built.has(id) ? `<a href="${depth}notes/${id}.html">${esc(map.topicById(id).title)}</a>` : esc((map.topicById(id) || {}).title || id);
  const out = {};
  // Live trainers that practice an equation (EQ rows' sixth field), as links.
  const trainers = slugs => {
    const live = (slugs || []).map(sl => (liveTools || []).find(t => t.slug === sl)).filter(Boolean);
    return live.length ? `<span class="hug-eq-tools"><span class="hug-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Formulas You Must Know', [LABEL]);
    const desc = 'Every rate, density and ratio the human-geography exam asks you to work out by hand or read from a source: what it means, when to use it and the classic trap.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Formulas you must know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Formulas you must know', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection hug-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="hug-eq"><thead><tr><th scope="col">Formula and a worked line</th><th scope="col">What it is and when to use it</th><th scope="col">The trap</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="hug-eq-f">${R(`$${r[0]}$`)}</span><span class="hug-eq-w"><span class="hug-small">Worked:</span> ${R(`$${workedTex(r[8])}$`)}</span></th><td>${R(r[1])} <span class="hug-small">${R(r[2])}</span></td><td>${R(r[3])}</td><td>${esc(r[4])}<br>${topicLink(r[5], depth)}${trainers(r[6])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell hug-app hug-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Formulas you must know' }])}
  <header class="hero hug-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Formulas you must know</h1>
  <p class="lede">The exam gives you no formula sheet and no calculator. These are the rates, densities and ratios it asks you to work out by hand or read from a table, a pyramid or a map, in our own words: what each means, when to use it, and the trap that costs points.</p></header>
  <section class="xsection hug-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="hug-links">
      <li><b>Interpret, do not define.</b> "Physiological density is people per farmland" earns little; "Egypt's physiological density is far above its arithmetic density, so its farmland along the Nile is under heavy pressure" earns the point.</li>
      <li><b>Name the place and the scale.</b> Say where a value is high or low, and at what scale the data are.</li>
      <li><b>Say what the number means.</b> A doubling time of 35 years means the population needs twice the schools and jobs in a generation.</li>
    </ul>
  </section>
  ${sections}
  <section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Ideas to read off a source</h2>
    <ul class="hug-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="hug-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-tables"><h2 id="eq-tables">On exam day</h2>
    <ul class="hug-eq-not">${TABLES.map(r => `<li><b>${esc(r[0])}.</b> ${R(r[1])}</li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[testLink('', 'Free unit practice tests'), `<a href="flashcards.html?deck=formulas">Formulas flashcards</a>`, `<a href="flashcards.html?unit=geo-skills">Skills terms flashcards</a>`, `<a href="models.html">Models you must know</a>`, `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
  </section>
</main>
${footer(depth, 'page:formula-sheet')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
<link rel="stylesheet" href="../assets/course/tool-studio.css">
${tail({ depth, section: 'exams', extra: ['pages/calm-ref.js'], site: ['course/tool-studio.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* The "Statistics" flashcard deck: free, always served (the statistics page is). */
  out['assets/formulas.json'] = JSON.stringify(formulaCards());

  /* ------------------------------------------------------ models page */
  {
    const depth = '', path = 'models.html', url = `${SITE}${BASE}${path}`;
    const entries = modelEntries(C.data, map);
    const artSvg = runtime('model-studio').Model.artSvg;
    const studioLive = (liveTools || []).some(t => t.slug === 'model-studio');
    const nameOf = id => (entries.find(e => e.id === id) || {}).name || id;
    const title = courseTitle('Models You Must Know', [LABEL]);
    const desc = 'Every model the human-geography exam names, drawn: what each claims, what it assumes, one limit, a real dated example, and the models students mix up.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#models`, name: 'Models you must know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Models you must know', url }])),
    ] };
    const R = x => renderMath([x])[0];
    const card = e => `<section class="hug-mdl" id="m-${e.id}" aria-labelledby="m-${e.id}-h"><h3 id="m-${e.id}-h">${esc(e.name)}</h3>
      <p class="hug-small hug-mdl-meta">${esc(e.origin)}${e.origin ? ' &middot; ' : ''}Learn it in ${topicLink(e.topic, depth)}</p>
      <div class="hug-mdl-grid"><div class="hug-mdl-pic">${modelPicture(e, esc, artSvg)}</div>
      <ol class="hug-mdl-key" aria-label="${esc(e.name)}: what each number shows">${e.key.map(k => `<li><span class="hug-mdl-n" aria-hidden="true">${k.n}</span><span><b>${esc(k.piece)}</b><span class="hug-small">${esc(k.slot)}</span></span></li>`).join('')}</ol></div>
      <dl class="hug-mdl-facts"><dt>What it claims</dt><dd>${R(e.claim)}</dd><dt>It assumes</dt><dd><ul>${e.assumes.map(a => `<li>${R(a)}</li>`).join('')}</ul></dd><dt>One limit</dt><dd>${R(e.limit)}</dd><dt>A real example</dt><dd>${R(e.example)}</dd></dl>
      ${e.confuse.map(([id, how]) => `<p class="hug-mdl-confuse"><b>Easy to confuse${id ? ` with <a href="#m-${id}">${esc(nameOf(id))}</a>` : ' inside this model'}.</b> ${R(how)}</p>`).join('')}
      ${e.aside ? `<p class="hug-aside hug-small">${esc(e.aside)}</p>` : ''}
      ${studioLive && e.studio ? `<p class="hug-small"><a href="tools/model-studio.html">Build it in Model Studio</a></p>` : ''}</section>`;
    const groups = map.chapters.filter(ch => entries.some(e => e.chapter === ch.id)).map(ch => `<section class="xsection hug-mdl-unit" aria-labelledby="mu-${ch.id}"><h2 id="mu-${ch.id}">${ch.part === 'course' ? `Unit ${ch.n}: ` : ''}${esc(ch.title)}</h2>${entries.filter(e => e.chapter === ch.id).map(card).join('\n')}</section>`).join('\n  ');
    const confusing = entries.filter(e => e.confuse.some(([id]) => id)).length;
    const body = `
${bodyOpen(' data-app="models"')}
<main id="main" class="xshell hug-app hug-entry hug-models">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Models you must know' }])}
  <header class="hero hug-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Models you must know</h1>
  <p class="lede">The ${entries.length} models the course and exam description names, each drawn, with what it claims, what it assumes, one limit and a real, dated example. A model is a simplified idea, not a fact about a place: on the exam, apply it to a named place and say where it fits and where it fails. ${confusing} are flagged with the model students most often mix them up with.</p></header>
  <nav class="xsection hug-mdl-jump" aria-label="Jump to a model"><h2 class="hug-small">Jump to a model</h2><ul>${entries.map(e => `<li><a href="#m-${e.id}">${esc(e.name)}</a></li>`).join('')}</ul></nav>
  <section class="xsection hug-eq-tips" aria-labelledby="mdl-tips"><h2 id="mdl-tips">Three habits that save points</h2>
    <ul class="hug-links">
      <li><b>Apply it to a named place.</b> "Chicago in the 1920s fits the concentric zone model" earns more than a definition of the model.</li>
      <li><b>Say "consistent with", not "is".</b> A country's data are consistent with stage 3 of the demographic transition; the country is not in stage 3 as a fact.</li>
      <li><b>Give a limit with its reason.</b> "It was built on one US city before cars spread homes in every direction" is a limit; "it is old" is not.</li>
    </ul>
  </section>
  ${groups}
  <section class="xsection" aria-labelledby="mdl-next"><h2 id="mdl-next">Practice with it</h2>
    <p>${[studioLive ? '<a href="tools/model-studio.html">Model Studio: build every model by hand</a>' : '', testLink('', 'Free unit practice tests'), '<a href="formula-sheet.html">Formulas you must know</a>', '<a href="justify.html">Make it specific</a>', '<a href="exams.html">Full practice exams</a>'].filter(Boolean).join(' &middot; ')}</p>
  </section>
</main>
${footer(depth, 'page:models')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
<link rel="stylesheet" href="assets/tools/model-studio.css">
${tail({ depth, section: 'learn', extra: [] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* ---------------------------------------------------- unit practice tests */
  // Every question either practice exam uses: never on a free unit test.
  const examIds = new Set(loadExams(C.data).forms.flatMap(f => (f.mcq || []).flat()));
  const stimFor = q => { const s = ((C.questions[q.topic] || {}).stimuli || {})[q.stimulus]; return s; };
  for (const ch of units.filter(built)) {
    const depth = '../', path = `unit-tests/${ch.id}.html`, url = `${SITE}${BASE}${path}`;
    const qs = unitSample(ch, { ...ctx, exclude: examIds }).map(questionForPage);
    const title = courseTitle(`Unit ${ch.n} Practice Test`, [LABEL]);
    const desc = clampDesc(`A free ${qs.length}-question practice test for Unit ${ch.n}, ${ch.title.toLowerCase()}, with the answer and an explanation for every option.`);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Quiz', '@id': `${url}#quiz`, name: `Unit ${ch.n} practice test: ${ch.title}`, url, description: desc, isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', about: ch.title, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test`, url }])),
    ] };
    const stimuli = {};
    for (const q of qs) if (q.stimulus) { const s = stimFor(q); if (s) stimuli[q.stimulus] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') }; }
    const html = groupSets(qs).map(g => {
      const items = g.items.map(q => questionHtml(q, qs.indexOf(q) + 1)).join('');
      const s = g.stimulus && stimuli[g.stimulus];
      return s ? `<div class="hug-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell hug-app hug-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero hug-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Each has four answer choices (the real exam and the practice exams have five), and sets share one map, table, chart, image or passage. None of them is in the two practice exams.</p>
  <p class="hug-small hug-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="hug-qs" data-set="check">${html}</div>
  <section class="xsection hug-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="hug-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="hug-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="hug-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['hug-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = r3Inner(head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body, { key: 'aphug', slug: 'unit-test', up: '../../' });
  }

  /* ---------------------------------------------------------- exam data */
  const ex = loadExams(C.data);
  // Exam-only items and their stimuli get the same math rendering as the bank.
  ex.items = prepareBank(renderMath({ items: ex.items }), 'exams').items;
  ex.stimuli = renderMath(ex.stimuli);
  const bank = new Map(); for (const t of map.topics) for (const q of ((C.questions[t.id] || {}).items || [])) bank.set(q.id, q);
  const examItems = new Map(ex.items.map(q => [q.id, q]));
  const frqById = Object.fromEntries(frqs.map(f => [f.id, f]));
  const live = ex.forms.filter(f => formUnits(f, { bank, examItems, frqs: frqById }).every(u => C.published.has(u)) && (f.frq || []).every(id => frqById[id]));
  /* assets/exams/items.json serves every question a live form uses with its
     five options and its explanations inline: the exam-only ones, and each
     bank question with the form's fifth option (examVersion), so the page
     never shows a bank question with four. Every stimulus they read comes
     with them. */
  const served = [], stimServed = {};
  for (const f of live) for (const id of f.mcq.flat()) {
    const q = examItems.get(id) || (bank.get(id) && examVersion(bank.get(id), renderMath(f.fifth || {})));
    if (!q) continue;
    served.push(q);
    if (q.stimulus && !stimServed[q.stimulus]) {
      const s = ex.stimuli[q.stimulus] || stimFor(q);
      if (s) stimServed[q.stimulus] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') };
    }
  }
  out['assets/exams/forms.json'] = JSON.stringify(live.map(f => ({ id: f.id, title: f.title, mcq: f.mcq, frq: f.frq })));
  out['assets/exams/items.json'] = JSON.stringify({ stimuli: stimServed, items: served.map(questionForPage) });

  /* --------------------------------------------- "Make it specific" data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  /* The builder for a prompt whose answer has components: the slots in
     order, option text raw (shown as plain text in a select, ApHugTex.plain),
     each why rendered as math. */
  const builder = S => {
    const sl = specificSlots(S);
    return { slots: Object.fromEntries(Object.keys(sl).map(k => [k, { label: sl[k].label, options: sl[k].options, correct: sl[k].correct, why: renderMath(sl[k].why || {}) }])) };
  };
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    // "answer" is a raw key for questions (never TeX), so the model answers are rendered on their own.
    prompts: prompts.map((raw, i) => { const p = renderMath(raw), R1 = s => renderMath([s])[0]; return { id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: { answer: R1(raw.earns.answer), why: p.earns.why }, misses: { answer: R1(raw.misses.answer), why: p.misses.why }, ...(raw.specific ? { specific: builder(raw.specific) } : {}), ...(i < FREE_JUSTIFY ? { free: true } : {}) }; }),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
