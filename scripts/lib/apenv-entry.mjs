/* AP® Environmental Science search-entry pages and exam data
   (docs/apenv-architecture.md, "Exams and entry pages"), written by
   scripts/build-apenv.mjs:

     formula-sheet.html          "Formulas you must memorize": the exam gives
                                 no formula sheet (framework.md section 4), so
                                 every equation the calculations need, in our
                                 own words, with when to use it, the classic
                                 trap and where it is taught; the unit
                                 conversions and scale words to know. Free,
                                 indexable. No score calculator (spec
                                 decision 6).
     unit-tests/<unit>.html      a free sample of 12 questions per unit,
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the "Make it specific" trainer's prompts

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apenv-exams.mjs';
import { renderMath, prepareBank, specificSlots } from './apenv-build.mjs';
import { Calc } from './apenv-mathlib.mjs';

export const SAMPLE_SIZE = 12;

/* The unit test sample: the same choice every build, so the page is
   stable for search. Whole stimulus sets of single-answer items first (at
   most two, from different topics), then standalone items spread over the
   unit's topics, skipping lesson check items (they are already on the free
   lessons) where enough others exist. */
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

/* The formula page, "Formulas you must memorize" (docs/apenv-spec.md
   section 3, differentiator 2). Each row is [formula (TeX), what it is, when
   you use it, the classic trap, 'Unit N' or 'Math you need', topic id,
   trainers, recipe, worked], in our own words; the trainers
   (tools/<slug>.html) are linked only when live. The worked line is
   [setup TeX, ApEnvCalc recipe, unit TeX, decimals]: the page prints
   "setup = answer unit" with the answer computed by ApEnvCalc at build time,
   so no worked number is typed by hand. Every calculation type in spec
   section 7 appears (scripts/test/apenv-exams.test.mjs holds the list to
   ApEnvCalc's recipes). Each row is also a card in the "Formulas" flashcard
   deck (assets/formulas.json). */
const D = String.raw;
export const EQ = [
  { id: 'percents', h: 'Percents and change', rows: [
    [D`\text{percent change} = \frac{\text{new} - \text{old}}{\text{old}} \times 100`, 'How much a quantity grew or shrank, as a percent of where it started.', 'Any "by what percent did it change" question.', 'Brackets around the difference, divide by the OLD value, then × 100. A fall comes out negative.', 'Math you need', 'math-percents', ['calculation-studio'], 'percentChange',
      [D`\frac{(150 - 120)\,\text{fish}}{120\,\text{fish}} \times 100`, { fn: 'percentChange', args: [120, 150] }, D`\%`, 0]],
    [D`\text{part} = \frac{\text{percent}}{100} \times \text{whole}`, 'A percent of a quantity.', 'Energy passed on, water lost, the share of a budget.', 'Turn the percent into a decimal first: 10% is 0.10. "40% less" means 60% is left.', 'Math you need', 'math-percents', ['calculation-studio'], 'percentOf',
      [D`0.40 \times 6{,}000\,\text{m}^3`, { fn: 'percentOf', args: [40, 6000] }, D`\text{m}^3`, 0]],
  ] },
  { id: 'populations', h: 'Populations', rows: [
    [D`\text{rate of natural increase }(\%) = \frac{\text{CBR} - \text{CDR}}{10}`, 'Growth from births and deaths, when both rates are per 1,000 people.', 'Turning crude birth and death rates into a growth rate in percent.', 'Divide by 10, not 100: the rates are per 1,000.', 'Unit 3', 'human-population', ['population-growth', 'age-structure'], 'naturalIncrease',
      [D`\frac{30 - 10}{10}`, { fn: 'naturalIncrease', args: [30, 10] }, D`\%\text{ per year}`, 1]],
    [D`\text{growth }(\%) = \frac{(\text{B} + \text{I}) - (\text{D} + \text{E})}{\text{population}} \times 100`, 'Growth from counts, with migration: B births, I immigrants, D deaths, E emigrants.', 'When the scenario gives numbers of people rather than rates.', 'Immigration adds, emigration subtracts; divide by the population at the start.', 'Unit 3', 'human-population', ['population-growth'], 'growthRate',
      [D`\frac{(1{,}100{,}000 + 100{,}000) - (400{,}000 + 50{,}000)}{50{,}000{,}000} \times 100`, { fn: 'growthRate', args: [1100000, 400000, 100000, 50000, 50000000] }, D`\%`, 1]],
    [D`\text{doubling time} \approx \frac{70}{\text{growth rate }(\%)}`, 'The rule of 70: how long a population (or anything growing at a steady rate) takes to double.', 'A growth rate in percent per year, and a question about doubling.', 'Use the rate in percent (2, not 0.02).', 'Math you need', 'math-doubling', ['population-growth', 'calculation-studio'], 'ruleOf70',
      [D`\frac{70}{1.4}`, { fn: 'ruleOf70', args: [1.4] }, D`\text{years}`, 0]],
    [D`\text{year it doubles} = \text{start year} + \frac{70}{\text{growth rate }(\%)}`, 'The calendar year a population doubles.', 'Any question that asks "in what year".', 'Add the doubling time to the start year; 50 years is not the answer to "in what year".', 'Math you need', 'math-doubling', ['population-growth', 'calculation-studio'], 'doublingYear',
      [D`2025 + \frac{70}{1.4}`, { fn: 'doublingYear', args: [2025, 1.4] }, '', -1]],
    [D`N = N_0 \times 2^{t / T_d}`, 'A population after a number of doubling times.', 'How big something gets after a stated time at a steady growth rate.', 'Count the doublings first: t divided by the doubling time.', 'Unit 3', 'population-growth', ['population-growth'], 'afterDoublings',
      [D`1{,}000\,\text{bacteria} \times 2^{30 / 10}`, { fn: 'afterDoublings', args: [1000, 30, 10] }, D`\text{bacteria}`, 0]],
    [D`N = N_0 \times \left(1 + \frac{r}{100}\right)^{t}`, 'Exponential growth at r percent a year, year by year.', 'A projection a set number of years ahead.', 'r is a percent, so divide by 100; t is the exponent, not a multiplier.', 'Unit 3', 'population-growth', ['population-growth'], 'exponential',
      [D`5{,}000\,\text{people} \times (1.02)^{10}`, { fn: 'exponential', args: [5000, 2, 10] }, D`\text{people}`, 0]],
    [D`\text{TFR} \approx 2.1`, 'Replacement-level fertility: the average number of children per woman that keeps a population the same size over time.', 'Judging whether a population will grow or shrink in the long run.', 'Not 2.0: a little extra makes up for children who do not survive to have children.', 'Unit 3', 'total-fertility-rate', ['age-structure'], 'aboveReplacement',
      [D`3.4 - 2.1`, { fn: 'aboveReplacement', args: [3.4] }, D`\text{children per woman above 2.1}`, 1]],
    [D`\text{TFR} = \frac{\text{sum of age-specific birth rates per 1,000 women} \times 5}{1{,}000}`, 'Total fertility rate from birth rates in 5-year age bands.', 'A table of births per 1,000 women by age group.', 'Multiply by the 5 years in each band, then divide by 1,000.', 'Unit 3', 'total-fertility-rate', ['age-structure'], 'tfr',
      [D`\frac{(20 + 110 + 130 + 90 + 40 + 10 + 0) \times 5}{1{,}000}`, { fn: 'tfr', args: [[20, 110, 130, 90, 40, 10, 0]] }, D`\text{children per woman}`, 1]],
  ] },
  { id: 'energy-flow', h: 'Energy flow and productivity', rows: [
    [D`\text{NPP} = \text{GPP} - \text{respiration}`, 'Net primary productivity: the energy producers store, after their own respiration.', 'What is left for consumers, from GPP and respiration.', 'NPP is never larger than GPP; GPP = NPP + respiration.', 'Unit 1', 'primary-productivity', ['energy-flow'], 'npp',
      [D`24{,}000 - 9{,}000\,\text{kcal/m}^2\text{/yr}`, { fn: 'npp', args: [24000, 9000] }, D`\text{kcal/m}^2\text{/yr}`, 0]],
    [D`E_{\text{next level}} = E \times 0.10`, 'The 10% rule: about a tenth of the energy at one trophic level reaches the next.', 'Energy at the top of a food chain from the energy at the bottom.', 'Multiply by 0.10 once per arrow: producers to secondary consumers is two steps, × 0.01.', 'Unit 1', 'energy-flow', ['energy-flow', 'calculation-studio'], 'tenPercent',
      [D`15{,}000\,\text{kcal} \times 0.10 \times 0.10`, { fn: 'tenPercent', args: [15000, 2] }, D`\text{kcal}`, 0]],
  ] },
  { id: 'energy', h: 'Energy, efficiency and emissions', rows: [
    [D`\text{efficiency} = \frac{\text{useful output}}{\text{input}} \times 100`, 'The share of input energy that comes out as useful work.', 'Power plants, engines, light bulbs.', 'Output over input, never the other way round.', 'Unit 6', 'energy-conservation', ['energy-chain'], 'efficiency',
      [D`\frac{350\,\text{MWh}}{1{,}000\,\text{MWh}} \times 100`, { fn: 'efficiency', args: [350, 1000] }, D`\%`, 0]],
    [D`\text{overall efficiency} = e_1 \times e_2 \times e_3 \times \ldots`, 'Efficiencies in a chain multiply.', 'Fuel to plant to wires to motor.', 'Multiply the decimals; do not add or average the percents.', 'Unit 6', 'fossil-fuels', ['energy-chain'], 'chainEfficiency',
      [D`0.35 \times 0.90 \times 0.90 \times 100`, { fn: 'chainEfficiency', args: [35, 90, 90] }, D`\%`, 2]],
    [D`\text{energy (kWh)} = \text{power (kW)} \times \text{time (h)}`, 'Energy used by a device running at a steady power.', 'Electricity use from wattage and hours.', 'Watts to kilowatts: divide by 1,000.', 'Math you need', 'math-units', ['energy-chain', 'calculation-studio'], 'mul',
      [D`1{,}500\,\text{W} \times 4\,\text{h} \times \frac{1\,\text{kW}}{1{,}000\,\text{W}}`, { fn: 'div', args: [{ fn: 'mul', args: [1500, 4] }, 1000] }, D`\text{kWh}`, 0]],
    [D`\text{cost} = \text{quantity} \times \text{price per unit}`, 'What a quantity costs.', 'Electricity, water or fuel bills.', 'Keep the units: kWh × \$/kWh gives \$; multiply, do not divide by the price.', 'Unit 6', 'energy-conservation', ['calculation-studio'], 'cost',
      [D`13{,}600\,\text{kWh} \times \frac{\$0.12}{1\,\text{kWh}}`, { fn: 'cost', args: [13600, 0.12] }, '', 0, D`\$`]],
    [D`\text{savings} = (\text{use before} - \text{use after}) \times \text{price}`, 'Money (or energy) saved by a change.', 'An upgrade, a new bulb, a new irrigation method.', 'Subtract first, then multiply; the cost of the new use alone is not the saving.', 'Unit 6', 'energy-conservation', ['calculation-studio'], 'savings',
      [D`(25{,}600 - 12{,}000)\,\text{kWh} \times \frac{\$0.12}{1\,\text{kWh}}`, { fn: 'savings', args: [25600, 12000, 0.12] }, '', 0, D`\$`]],
    [D`\text{emissions} = \text{quantity} \times \text{emission factor}`, 'Carbon dioxide (or another gas) released, from how much fuel or electricity is used.', 'Emissions, or emissions saved by a change.', 'The factor\'s units must cancel what you multiply: kWh × kg CO₂/kWh.', 'Unit 6', 'energy-conservation', ['energy-chain'], 'emissions',
      [D`13{,}600\,\text{kWh} \times \frac{0.4\,\text{kg CO}_2}{1\,\text{kWh}}`, { fn: 'emissions', args: [13600, 0.4] }, D`\text{kg CO}_2`, 0]],
    [D`\text{value in new unit} = \text{value} \times \frac{\text{new unit}}{\text{old unit}}`, 'Unit conversion by dimensional analysis: each factor is a fraction equal to 1.', 'Gallons to liters, hectares to square meters, BTU to kWh, and any chain of them.', 'Put the unit you want to get rid of in the denominator, so it cancels.', 'Math you need', 'math-units', ['calculation-studio'], 'convert',
      [D`25\,\text{gal} \times \frac{3.785\,\text{L}}{1\,\text{gal}}`, { fn: 'mul', args: [25, 3.785] }, D`\text{L}`, 1]],
  ] },
  { id: 'toxicology', h: 'Toxicology and half-life', rows: [
    [D`\text{number of half-lives} = \frac{\text{time}}{t_{1/2}}`, 'How many times a radioactive or breaking-down substance has halved.', 'The first step of every half-life question.', 'Divide the time by the half-life, not the other way round.', 'Unit 6', 'nuclear-power', ['dose-response', 'calculation-studio'], 'halfLives',
      [D`\frac{24\,\text{days}}{8\,\text{days}}`, { fn: 'halfLives', args: [24, 8] }, D`\text{half-lives}`, 0]],
    [D`\text{amount left} = \text{amount} \times \left(\frac{1}{2}\right)^{t / t_{1/2}}`, 'What is left after time t.', 'Radioactive decay, or a pesticide breaking down.', 'Three half-lives leave one eighth, not one third or one sixth.', 'Unit 6', 'nuclear-power', ['dose-response', 'calculation-studio'], 'halfLifeLeft',
      [D`80\,\text{mg} \times \left(\frac{1}{2}\right)^{24/8}`, { fn: 'halfLifeLeft', args: [80, 8, 24] }, D`\text{mg}`, 0]],
    [D`\text{LD}_{50}`, 'The dose that kills half of a test population, read off a dose-response curve.', 'Comparing how toxic two substances are.', 'A lower LD50 means a MORE toxic substance; read across from 50% to the curve, then down to the dose.', 'Unit 8', 'lethal-dose-50', ['dose-response'], 'ld50',
      [D`\text{dose at }50\%\text{ deaths}`, { fn: 'ld50', args: [[[0, 0], [10, 20], [20, 50], [40, 90]]] }, D`\text{mg/kg}`, 0]],
    [D`\text{dose} = \text{dose per kg} \times \text{body mass (kg)}`, 'A whole-body dose from a dose in mg per kg.', 'How much of a substance would reach a stated dose.', 'Convert body mass to kilograms first.', 'Unit 8', 'lethal-dose-50', ['dose-response'], 'doseFor',
      [D`25\,\text{mg/kg} \times 12\,\text{kg}`, { fn: 'doseFor', args: [25, 12] }, D`\text{mg}`, 0]],
    [D`C_{\text{top}} = C \times f^{\,n}`, 'Biomagnification: concentration multiplies by a factor at each step up a food chain.', 'The concentration in a top predator.', 'Bioaccumulation is one organism over time; biomagnification is up the chain.', 'Unit 8', 'bioaccumulation-biomagnification', ['dose-response'], 'biomagnify',
      [D`0.04\,\text{ppm} \times 10^{3}`, { fn: 'biomagnify', args: [0.04, 10, 3] }, D`\text{ppm}`, 0]],
    [D`\text{magnification} = \frac{\text{higher concentration}}{\text{lower concentration}}`, 'How many times more concentrated a substance is at one level than another.', '"How many times greater" questions, and comparing LD50s.', 'Divide, do not subtract; the answer has no unit ("times").', 'Unit 8', 'bioaccumulation-biomagnification', ['dose-response'], 'magnification',
      [D`\frac{0.2\,\text{ppm}}{0.002\,\text{ppm}}`, { fn: 'magnification', args: [0.2, 0.002] }, D`\text{times}`, 0]],
  ] },
  { id: 'land-water', h: 'Land, water and people', rows: [
    [D`\text{per capita} = \frac{\text{total}}{\text{population}}`, 'An amount per person.', 'Water use, energy use, waste or footprint per person.', 'Scale words first: 4.5 billion is 4,500,000,000.', 'Math you need', 'math-rates', ['calculation-studio'], 'perCapita',
      [D`\frac{4.5 \times 10^{9}\,\text{L}}{3 \times 10^{6}\,\text{people}}`, { fn: 'perCapita', args: [4.5e9, 3e6] }, D`\text{L per person}`, 0]],
    [D`\text{population density} = \frac{\text{number}}{\text{area}}`, 'How crowded a population is.', 'People per square kilometer, trees per hectare.', 'Area units must match the question (km² or hectares).', 'Unit 3', 'population-growth', ['calculation-studio'], 'density',
      [D`\frac{1{,}200{,}000\,\text{people}}{400\,\text{km}^2}`, { fn: 'density', args: [1200000, 400] }, D`\text{people/km}^2`, 0]],
    [D`\text{water volume} = \text{depth} \times \text{area}`, 'Irrigation water from the depth applied and the field area.', 'Water applied to a field or stored in a wetland.', 'Put depth and area in matching units (m and m²) before you multiply.', 'Unit 5', 'irrigation', ['calculation-studio'], 'waterVolume',
      [D`0.5\,\text{m} \times 1{,}200{,}000\,\text{m}^2`, { fn: 'waterVolume', args: [0.5, 1200000] }, D`\text{m}^3`, 0]],
    [D`\text{water per area} = \frac{\text{volume}}{\text{area}}`, 'Water use per hectare (or per acre).', 'Comparing irrigation methods or farms of different sizes.', 'Volume over area, and keep both units in the answer (m³/ha).', 'Unit 5', 'irrigation', ['calculation-studio'], 'waterPerArea',
      [D`\frac{9{,}000\,\text{m}^3}{1.5\,\text{ha}}`, { fn: 'waterPerArea', args: [9000, 1.5] }, D`\text{m}^3\text{/ha}`, 0]],
  ] },
];
/* A worked line as TeX: "setup = answer unit", the answer from ApEnvCalc
   (to the row's decimals, thousands as {,}); a leading unit (\$) goes before
   the number. */
export function workedValue(w) { return Calc.evaluate(w[1]); }
export function workedTex(w) {
  const v = workedValue(w), d = Math.max(0, w[3] || 0);
  // Decimals -1: a year, printed without a thousands comma.
  const num = w[3] === -1 ? String(Math.round(v)) : Number(v.toFixed(d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/,/g, '{,}');
  return `${w[0]} = ${w[4] || ''}${num}${w[2] ? `\\,${w[2]}` : ''}`;
}
/* The "Formulas" flashcard deck (assets/formulas.json, read by
   pages/flashcards.js): one card per row, front "what it is" and the cue,
   back the formula, its worked line and the trap; card id eq:<recipe>. */
export function formulaCards() {
  return EQ.flatMap(s => s.rows.map(r => ({ id: `eq:${r[7]}`, group: s.h, topic: r[5], front: renderMath([r[1]])[0], cue: renderMath([r[2]])[0],
    formula: renderMath([`$${r[0]}$`])[0], worked: renderMath([`$${workedTex(r[8])}$`])[0], trap: renderMath([r[3]])[0] })));
}

// Not formulas, but numbers the exam expects you to know or convert.
export const NOT_ON = [
  ['Scale words', 'thousand = $10^3$, million = $10^6$, billion = $10^9$, trillion = $10^{12}$. Multiply by adding exponents and divide by subtracting them.', 'math-sci-notation'],
  ['Metric prefixes', 'kilo- = 1,000; mega- = 1,000,000; giga- = 1,000,000,000; milli- = one thousandth. 1 kWh = 1,000 Wh.', 'math-sci-notation'],
  ['Dimensional analysis', 'Write each conversion as a fraction so the unit you do not want cancels: $5\,\text{kWh} \times \frac{0.9\,\text{kg}}{1\,\text{kWh}} = 4.5\,\text{kg}$.', 'math-units'],
  ['Show the setup', 'On the calculation question, one point is for the setup and one for the answer with units. Type the setup with brackets and units, then the answer.', 'math-percents'],
];
// How the free-response calculation is scored (framework.md section 4).
export const TABLES = [
  ['No formula sheet', 'Bluebook shows only how to type math (fractions, powers, brackets) and a reminder to show work and units. Every formula above must be memorized.'],
  ['Calculator', 'A four-function (with square root) or scientific calculator, or the Desmos scientific calculator in Bluebook. Graphing calculators are not allowed from 2027.'],
];

export function entryPages(ctx) {
  const { map, C, put, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools } = ctx;
  const units = map.chapters.filter(c => c.part === 'course');
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const topicLink = (id, depth) => C.built.has(id) ? `<a href="${depth}notes/${id}.html">${esc(map.topicById(id).title)}</a>` : esc((map.topicById(id) || {}).title || id);
  const out = {};
  // Live trainers that practice an equation (EQ rows' sixth field), as links.
  const trainers = slugs => {
    const live = (slugs || []).map(sl => (liveTools || []).find(t => t.slug === sl)).filter(Boolean);
    return live.length ? `<span class="env-eq-tools"><span class="env-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Environmental Science Formulas You Must Memorize', [LABEL]);
    const desc = 'Every environmental science formula the exam expects you to know, with no sheet provided: what it means, when to use it and the classic trap.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Formulas you must memorize', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Formulas you must memorize', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection env-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="env-eq"><thead><tr><th scope="col">Formula and a worked line</th><th scope="col">What it is and when to use it</th><th scope="col">The trap</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="env-eq-f">${R(`$${r[0]}$`)}</span><span class="env-eq-w"><span class="env-small">Worked:</span> ${R(`$${workedTex(r[8])}$`)}</span></th><td>${R(r[1])} <span class="env-small">${R(r[2])}</span></td><td>${R(r[3])}</td><td>${esc(r[4])}<br>${topicLink(r[5], depth)}${trainers(r[6])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell env-app env-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Formulas you must memorize' }])}
  <header class="hero env-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Formulas you must memorize</h1>
  <p class="lede">The exam gives you no formula sheet. These are the equations its calculations use, in our own words: what each means, when to use it, and the trap that costs points.</p></header>
  <section class="xsection env-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="env-links">
      <li><b>Write the setup, then the answer.</b> The calculation question gives one point for the setup and one for the answer with its units, so the setup must be on the page.</li>
      <li><b>Brackets and units in the setup.</b> ${R('$\\frac{(150 - 120)}{120} \\times 100$')}, not 150 - 120 / 120 × 100; and units that visibly cancel.</li>
      <li><b>Read the question to the end.</b> "In what year" means add the doubling time to the start year; "in millions" means give the scale.</li>
    </ul>
  </section>
  ${sections}
  <section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Numbers and conversions to know</h2>
    <ul class="env-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="env-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-tables"><h2 id="eq-tables">On exam day</h2>
    <ul class="env-eq-not">${TABLES.map(r => `<li><b>${esc(r[0])}.</b> ${R(r[1])}</li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[testLink('', 'Free unit practice tests'), `<a href="flashcards.html">Formula flashcards</a>`, `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
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

  /* The "Formulas" flashcard deck: free, always served (the formulas page is). */
  out['assets/formulas.json'] = JSON.stringify(formulaCards());

  /* ---------------------------------------------------- unit practice tests */
  const stimFor = q => { const s = ((C.questions[q.topic] || {}).stimuli || {})[q.stimulus]; return s; };
  for (const ch of units.filter(built)) {
    const depth = '../', path = `unit-tests/${ch.id}.html`, url = `${SITE}${BASE}${path}`;
    const qs = unitSample(ch, ctx).map(questionForPage);
    const title = courseTitle(`Unit ${ch.n} Practice Test: ${ch.title}`, [LABEL]);
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
      return s ? `<div class="env-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell env-app env-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero env-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most have four answer choices, as on the real exam, and a few ask you to type a calculation with its units; sets share one data table, graph, model or passage.</p>
  <p class="env-small env-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="env-qs" data-set="check">${html}</div>
  <section class="xsection env-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="env-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="env-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="env-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['env-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
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
  const usedOwn = new Set(live.flatMap(f => f.mcq.flat()).filter(id => examItems.has(id)));
  const ownStim = {};
  for (const id of usedOwn) { const s = examItems.get(id).stimulus; if (s && ex.stimuli[s]) ownStim[s] = { kind: ex.stimuli[s].kind, title: ex.stimuli[s].title, html: stimulusBody(C, ex.stimuli[s], '') }; }
  out['assets/exams/forms.json'] = JSON.stringify(live.map(f => ({ id: f.id, title: f.title, mcq: f.mcq, frq: f.frq })));
  out['assets/exams/items.json'] = JSON.stringify({ stimuli: ownStim, items: [...usedOwn].map(id => questionForPage(examItems.get(id))) });

  /* --------------------------------------------- "Make it specific" data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  /* The builder for a prompt whose answer has components: the slots in
     order, option text raw (shown as plain text in a select, ApEnvTex.plain),
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
