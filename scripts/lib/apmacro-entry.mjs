/* AP® Macroeconomics search-entry pages and exam data
   (docs/apmacro-architecture.md, "Exams and entry pages"), written by
   scripts/build-apmacro.mjs:

     formula-sheet.html          "Graphs and formulas you must know": the
                                 exam gives no formula sheet and allows a
                                 four-function calculator (framework.md
                                 sections 5, 8 and 9), so every calculation
                                 and every graph, in our own words, with when
                                 to use it, the classic trap and where it is
                                 taught. Free, indexable. No score calculator
                                 (owner brief).
     unit-tests/<unit>.html      a free sample of 12 questions per unit,
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the "Make it specific" trainer's prompts

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, examVersion, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apmacro-exams.mjs';
import { renderMath, prepareBank, specificSlots } from './apmacro-build.mjs';
import { Stats, Graph } from './apmacro-mathlib.mjs';
import { r3Inner } from './r3-inner.mjs';

export const SAMPLE_SIZE = 12;

/* The unit test sample: the same choice every build, so the page is
   stable for search. Whole stimulus sets of single-answer items first (at
   most two, from different topics), then standalone items spread over the
   unit's topics, skipping lesson check items (they are already on the free
   lessons) where enough others exist. Never a question of the two practice
   exams (data/exams/forms.json), so the free test does not give them away. */
export function unitSample(ch, ctx) {
  const { map, C } = ctx;
  const inForms = new Set(loadExams(C.data).forms.flatMap(f => (f.mcq || []).flat()));
  const checks = new Set([...Object.values(C.lessons).flatMap(L => L.check || []), ...inForms]);
  const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
  const sets = [], singles = [];
  for (const t of topics) {
    const items = C.questions[t.id].items.filter(q => !inForms.has(q.id));
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
  // Still short (a unit whose standalone questions went to the practice
  // exams): recall questions too, spread over the topics the same way.
  // Then lesson check items (free already, but never a practice exam's).
  const more = [...singles.filter(q => !checks.has(q.id) && q.level === 'recall'), ...singles.filter(q => checks.has(q.id) && !inForms.has(q.id))].filter(q => !/previous/.test(q.q) && !out.includes(q));
  for (let i = 0; out.length < SAMPLE_SIZE && i < more.length * topics.length; i++) {
    const t = topics[i % topics.length], q = more.find(x => x.topic === t.id && !out.includes(x));
    if (q) out.push(q);
    if (!more.some(x => !out.includes(x))) break;
  }
  return out;
}

/* The graphs and formulas page, "Graphs and formulas you must know"
   (formula-sheet.html, the path every AP® course uses for its sheet). The
   exam gives no formula sheet (framework.md section 5). Each row is
   [formula (TeX), what it is, when you use it, the classic trap, 'Unit N',
   topic id, trainers, recipe, worked], in our own words (framework.md
   section 9); the trainers (tools/<slug>.html) are linked only when live.
   The worked line is [setup TeX, ApMacroCalc recipe, unit TeX, decimals]:
   the page prints "setup = answer unit" with the answer computed by
   ApMacroCalc at build time, so no worked number is typed by hand. Each row
   is also a card in the "Formulas" flashcard deck (assets/formulas.json).
   GRAPHS lists the nine graphs with their axes, drawn by ApMacroGraph. */
const D = String.raw;
/* r[9] (optional): true for a formula students most often get wrong on the
   exam (framework.md section 7: the deflator inverted, a gap multiplied, the
   tax multiplier's sign, deposits multiplied for excess reserves, the wrong
   denominator, the currency ratio flipped); flagged "Easy to forget" on the
   page and listed at its top. */
export const EQ = [
  { id: 'basics', h: 'Choices and trade', rows: [
    [D`\text{opportunity cost of 1 unit of X} = \frac{\text{units of Y given up}}{\text{units of X gained}}`, 'Opportunity cost per unit, read off a PPC or an output table.', 'Comparative advantage and moving along a PPC.', 'Comparative advantage goes to the lower opportunity cost, not the larger output (that is absolute advantage).', 'Unit 1', 'comparative-advantage', ['ppc-trade'], 'opportunityCost',
      [D`\frac{20 \text{ tons}}{10 \text{ tractors}}`, { fn: 'opportunityCost', args: [20, 10] }, D`\text{ tons per tractor}`, 0], true],
  ] },
  { id: 'output', h: 'Output and prices', rows: [
    [D`\text{GDP} = C + I + G + (X - M)`, 'GDP by the expenditure approach.', 'Adding up spending on final goods and services.', 'Imports are subtracted; transfers and used goods are left out.', 'Unit 2', 'gdp-circular-flow', ['indicators-lab'], 'gdp',
      [D`500 + 150 + 200 + (60 - 80)`, { fn: 'gdp', args: [500, 150, 200, 60, 80] }, '', 0]],
    [D`\text{net exports} = X - M`, 'Net exports: exports minus imports.', 'The foreign part of GDP and of aggregate demand.', 'A negative value (a trade deficit) lowers GDP; it is not a budget deficit.', 'Unit 2', 'gdp-circular-flow', ['indicators-lab'], 'netExports',
      [D`60 - 80`, { fn: 'netExports', args: [60, 80] }, '', 0]],
    [D`\text{GDP per capita} = \frac{\text{GDP}}{\text{population}}`, 'Output per person.', 'Comparing living standards across countries or years.', 'If population grows faster than GDP, GDP per capita falls.', 'Unit 2', 'gdp-limitations', ['indicators-lab'], 'perCapita',
      [D`\frac{900}{30}`, { fn: 'perCapita', args: [900, 30] }, '', 0]],
    [D`\text{CPI} = \frac{\text{basket cost now}}{\text{basket cost in the base year}} \times 100`, 'The consumer price index.', 'Comparing the cost of the same basket across years.', 'The base year is always 100; divide by the base year, not the other way round.', 'Unit 2', 'price-indices-inflation', ['indicators-lab'], 'cpi',
      [D`\frac{330}{300} \times 100`, { fn: 'cpi', args: [330, 300] }, '', 0]],
    [D`\text{inflation rate} = \frac{\text{new index} - \text{old index}}{\text{old index}} \times 100`, 'The inflation rate: the percent change in a price index.', 'From two years of CPI or the GDP deflator.', 'Divide by the old index; a fall in inflation (disinflation) is not deflation.', 'Unit 2', 'price-indices-inflation', ['indicators-lab'], 'inflation',
      [D`\frac{110 - 100}{100} \times 100`, { fn: 'inflation', args: [100, 110] }, D`\%`, 0], true],
    [D`\text{GDP deflator} = \frac{\text{nominal GDP}}{\text{real GDP}} \times 100`, 'The GDP deflator.', 'Turning nominal GDP into real GDP, or the reverse.', 'Real GDP = nominal / deflator x 100: students often multiply instead.', 'Unit 2', 'real-nominal-gdp', ['indicators-lab'], 'deflator',
      [D`\frac{1200}{1000} \times 100`, { fn: 'deflator', args: [1200, 1000] }, '', 0]],
    [D`\text{real value} = \frac{\text{nominal value}}{\text{price index}} \times 100`, 'A real value (real GDP, a real wage).', 'Removing the effect of prices.', 'Use the index of the same year as the nominal value; divide, never multiply.', 'Unit 2', 'real-nominal-gdp', ['indicators-lab'], 'realValue',
      [D`\frac{1200}{120} \times 100`, { fn: 'realValue', args: [1200, 120] }, '', 0], true],
    [D`\text{growth rate of real GDP} = \frac{\text{real GDP this year} - \text{real GDP last year}}{\text{real GDP last year}} \times 100`, 'The growth rate of real GDP.', 'How fast output grows from one year to the next.', 'Use real GDP; growth in nominal GDP mixes output with price changes.', 'Unit 2', 'real-nominal-gdp', ['indicators-lab'], 'growth',
      [D`\frac{1050 - 1000}{1000} \times 100`, { fn: 'growth', args: [1000, 1050] }, D`\%`, 0]],
  ] },
  { id: 'labor', h: 'Unemployment', rows: [
    [D`\text{labor force} = \text{employed} + \text{unemployed}`, 'The labor force.', 'The denominator of the unemployment rate.', 'People not looking for work (retirees, discouraged workers) are not in it.', 'Unit 2', 'unemployment', ['indicators-lab'], 'laborForce',
      [D`190 + 10`, { fn: 'laborForce', args: [190, 10] }, '', 0]],
    [D`\text{unemployment rate} = \frac{\text{unemployed}}{\text{labor force}} \times 100`, 'The unemployment rate.', 'From counts of employed and unemployed people.', 'The labor force is employed plus unemployed, not the whole adult population.', 'Unit 2', 'unemployment', ['indicators-lab'], 'unemploymentRate',
      [D`\frac{10}{200} \times 100`, { fn: 'unemploymentRate', args: [10, 200] }, D`\%`, 0], true],
    [D`\text{participation rate} = \frac{\text{labor force}}{\text{adult population}} \times 100`, 'The labor force participation rate.', 'How much of the adult population works or looks for work.', 'Discouraged workers leave the labor force: the unemployment rate falls though no one found a job.', 'Unit 2', 'unemployment', ['indicators-lab'], 'participationRate',
      [D`\frac{200}{320} \times 100`, { fn: 'participationRate', args: [200, 320] }, D`\%`, 1]],
    [D`\text{natural rate} = \text{frictional} + \text{structural}`, 'The natural rate of unemployment.', 'Unemployment at full employment.', 'Cyclical unemployment is not in it.', 'Unit 2', 'unemployment', ['indicators-lab'], 'naturalRate',
      [D`2\% + 3\%`, { fn: 'naturalRate', args: [2, 3] }, D`\%`, 0]],
    [D`\text{cyclical rate} = \text{actual rate} - \text{natural rate}`, 'Cyclical unemployment.', 'Reading how far the economy is from full employment.', 'Positive in a recessionary gap, negative in an inflationary gap; at full employment it is 0, not the natural rate.', 'Unit 2', 'unemployment', ['indicators-lab'], 'cyclicalRate',
      [D`7\% - 5\%`, { fn: 'cyclicalRate', args: [7, 5] }, D`\%`, 0], true],
  ] },
  { id: 'multipliers', h: 'Multipliers', rows: [
    [D`\text{MPS} = 1 - \text{MPC}`, 'The marginal propensity to save.', 'Every multiplier starts from it.', 'MPC + MPS = 1, so with MPC 0.8 the MPS is 0.2.', 'Unit 3', 'multipliers', ['multiplier-lab'], 'mps',
      [D`1 - 0.8`, { fn: 'mps', args: [0.8] }, '', 1]],
    [D`\text{spending multiplier} = \frac{1}{1 - \text{MPC}} = \frac{1}{\text{MPS}}`, 'The spending (expenditure) multiplier.', 'How much real GDP changes per dollar of new spending.', 'With MPC 0.8 the multiplier is 5, not 1.25.', 'Unit 3', 'multipliers', ['multiplier-lab'], 'spendingMultiplier',
      [D`\frac{1}{1 - 0.8}`, { fn: 'spendingMultiplier', args: [0.8] }, '', 0]],
    [D`\text{tax multiplier} = \frac{-\text{MPC}}{\text{MPS}}`, 'The tax multiplier (negative: a tax rise lowers output).', 'The effect of a change in taxes or transfers.', 'Its size is always one less than the spending multiplier, and a tax cut raises output.', 'Unit 3', 'multipliers', ['multiplier-lab'], 'taxMultiplier',
      [D`\frac{-0.8}{0.2}`, { fn: 'taxMultiplier', args: [0.8] }, '', 0], true],
    // Taught in multipliers as the sum of the two (needs-author c-balanced-budget-use): a row because the
    // course names it and asks it (mac-multipliers-12); drop it with the item if the CED leaves it out.
    [D`\text{balanced-budget multiplier} = \frac{1}{\text{MPS}} + \frac{-\text{MPC}}{\text{MPS}} = 1`, 'The balanced-budget multiplier: the spending and tax multipliers added.', 'Government purchases and taxes rise (or fall) by the same amount.', 'It is 1, not 0: the two effects do not cancel, so output rises by the amount of the change.', 'Unit 3', 'multipliers', ['multiplier-lab'], 'balancedBudgetMultiplier',
      [D`\frac{1}{0.2} + \frac{-0.8}{0.2}`, { fn: 'balancedBudgetMultiplier', args: [0.8] }, '', 0]],
    [D`\Delta \text{real GDP} = \text{change in spending} \times \text{multiplier}`, 'The largest change in real GDP from a change in spending or taxes.', 'Forward: from a policy or a shock to its effect on output.', 'Use the tax multiplier for taxes and transfers, the spending multiplier for purchases and investment.', 'Unit 3', 'multipliers', ['multiplier-lab'], 'totalChange',
      [D`20 \times 5`, { fn: 'totalChange', args: [20, 5] }, '', 0]],
    [D`\text{change needed} = \frac{\text{gap}}{\text{multiplier}}`, 'The change in spending that closes a gap.', 'Backward: from a recessionary or inflationary gap to the policy.', 'Divide, do not multiply; decide the direction first.', 'Unit 3', 'fiscal-policy', ['multiplier-lab'], 'gapChange',
      [D`\frac{100}{4}`, { fn: 'gapChange', args: [100, 4] }, '', 0], true],
    [D`\text{money multiplier} = \frac{1}{\text{required reserve ratio}}`, 'The money (deposit) multiplier (limited reserves).', 'How far new excess reserves can expand the money supply.', 'A cash deposit does not change the money supply at first.', 'Unit 4', 'banking-money-supply', ['multiplier-lab'], 'moneyMultiplier',
      [D`\frac{1}{0.1}`, { fn: 'moneyMultiplier', args: [0.1] }, '', 0]],
  ] },
  { id: 'money', h: 'Banks, interest rates and money', rows: [
    [D`\text{required reserves} = \text{deposits} \times \text{required reserve ratio}`, 'Required reserves (limited reserves).', 'A bank balance sheet.', 'The ratio applies to deposits, not to reserves.', 'Unit 4', 'banking-money-supply', ['reserves-lab'], 'requiredReserves',
      [D`1000 \times 0.1`, { fn: 'requiredReserves', args: [1000, 0.1] }, '', 0]],
    [D`\text{excess reserves} = \text{reserves} - \text{deposits} \times \text{ratio}`, 'Excess reserves: what a bank may lend.', 'A bank balance sheet.', 'Required reserves come off first.', 'Unit 4', 'banking-money-supply', ['reserves-lab'], 'excessReserves',
      [D`200 - 1000 \times 0.1`, { fn: 'excessReserves', args: [200, 1000, 0.1] }, '', 0]],
    [D`\text{largest change in the money supply} = \text{excess reserves} \times \text{money multiplier}`, 'The most the banking system can add to the money supply.', 'After a deposit or a bond purchase under limited reserves.', 'Multiply excess reserves, not total deposits or total reserves.', 'Unit 4', 'banking-money-supply', ['multiplier-lab'], 'maxMoneyChange',
      [D`100 \times 10`, { fn: 'maxMoneyChange', args: [100, 0.1] }, '', 0], true],
    [D`r = i - \pi^{e}`, 'The real interest rate: the nominal rate minus expected inflation.', 'Lenders, borrowers and the loanable funds market.', 'Unexpected inflation lowers the real rate a lender earns; i = r + expected inflation.', 'Unit 4', 'nominal-real-rates', ['reserves-lab'], 'realRate',
      [D`6\% - 2\%`, { fn: 'realRate', args: [6, 2] }, D`\%`, 0], true],
    [D`M \times V = P \times Y`, 'The quantity theory of money.', 'Money growth and inflation in the long run.', 'With V and Y steady, faster money growth shows up as inflation.', 'Unit 5', 'money-growth-inflation', ['policy-chain'], 'velocity',
      [D`V = \frac{2 \times 500}{250}`, { fn: 'velocity', args: [2, 500, 250] }, '', 0]],
    [D`\text{budget balance} = \text{tax revenue} - \text{government outlays}`, 'The government budget balance (negative is a deficit).', 'Deficits, surpluses and the national debt.', 'The debt is the sum of past deficits minus surpluses; a deficit is one year.', 'Unit 5', 'deficits-debt', ['policy-chain'], 'budgetBalance',
      [D`3000 - 3400`, { fn: 'budgetBalance', args: [3000, 3400] }, '', 0]],
  ] },
  { id: 'open', h: 'Exchange rates', rows: [
    [D`\text{price of B in A} = \frac{1}{\text{price of A in B}}`, 'An exchange rate read the other way round.', 'Switching between "bels per arl" and "arls per bel".', 'In the market for a currency, its price is in units of the other currency per unit of it.', 'Unit 6', 'exchange-rates', ['forex-lab'], 'inverseRate',
      [D`\frac{1}{4 \text{ bels per arl}}`, { fn: 'inverseRate', args: [4] }, D`\text{ arls per bel}`, 2], true],
    [D`\text{price in A} = \text{price in B} \times \text{units of A per unit of B}`, 'A foreign price in the home currency.', 'What an import costs, or what an export earns.', 'Check the units: bels times arls per bel gives arls.', 'Unit 6', 'exchange-rates', ['forex-lab'], 'convert',
      [D`100 \times 0.25`, { fn: 'convert', args: [100, 0.25] }, D`\text{ arls}`, 0]],
  ] },
];
/* A worked line as TeX: "setup = answer unit", the answer from ApMacroCalc
   (to the row's decimals, thousands as {,}). */
export function workedValue(w) { return Stats.evaluate(w[1]); }
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

// The graphs students draw (framework.md section 8): kind, the topic that
// teaches it, the trap readers report, and true where the graph point is
// most often lost (the currency ratio, the reserve market, real vs nominal).
export const GRAPHS = [
  ['ppc', 'opportunity-cost-ppc', 'Label both goods; growth shifts the whole curve out.'],
  ['sd', 'market-equilibrium', 'A change in the good\'s own price is a movement along a curve, not a shift.'],
  ['adas', 'adas-equilibrium', 'Price level and real GDP, not price and quantity; LRAS is vertical at full employment.'],
  ['money', 'money-market', 'The nominal interest rate, and a vertical money supply.', true],
  ['reserves', 'monetary-policy', 'With ample reserves the policy rate moves with the administered rate; reserve supply stays put.', true],
  ['lf', 'loanable-funds', 'The real interest rate; government borrowing shifts demand for loanable funds right.', true],
  ['phillips', 'phillips-curve', 'The LRPC is vertical at the natural rate; a supply shock shifts the SRPC.'],
  ['forex', 'foreign-exchange-market', 'The price of a currency is the other currency per unit of it (dollars per euro in the market for euros).', true],
];
/* The ninth thing students draw is a table, not a graph: the bank balance
   sheet (T-account), assets on the left, liabilities on the right. */
export const BALANCE_SHEET = { topic: 'banking-money-supply', assets: [['Required reserves', '100'], ['Excess reserves', '100'], ['Loans', '800']], liabilities: [['Checkable deposits', '1,000']],
  note: 'Assets on the left, liabilities on the right, and the two sides equal. With a 10% requirement, required reserves are 10% of deposits; the rest of the reserves are excess reserves, which the bank may lend.' };
// Exam-day facts (framework.md section 5).
export const NOT_ON = [
  ['Label everything', 'Every axis, every curve and every point the question names (P1, Y1, YF). A mislabeled graph loses the graph point and usually the shift point.', 'shifts-movements'],
  ['Show the direction', 'Draw the shift with an arrow and label the new curve (AD2) and the new equilibrium.', 'curves-crossing'],
  ['Explain with every link', '"Explain" needs the causal link, not the conclusion: the rate falls, so investment rises, so AD rises.', 'policy-short-run'],
  ['Show your work', '"Calculate" needs the formula or the steps, not just the number.', 'multipliers'],
];
export const TABLES = [
  ['Four-function calculator', 'Bluebook has one built in (add, subtract, multiply, divide, square root, percent) for both sections; no scientific or graphing calculator.'],
  ['No formula sheet', 'Nothing on this page is given on exam day.'],
  ['Graphs by hand', 'Free responses are handwritten in a paper booklet, graphs drawn by hand.'],
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
    return live.length ? `<span class="mac-eq-tools"><span class="mac-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Macroeconomics Graphs and Formulas You Must Know', [LABEL]);
    const desc = 'Every graph and formula the macroeconomics exam expects you to know without a formula sheet: what each means, when to use it and the classic trap.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Graphs and formulas you must know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Graphs and formulas you must know', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection mac-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="mac-eq"><thead><tr><th scope="col">Formula and a worked line</th><th scope="col">What it is and when to use it</th><th scope="col">The trap</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr${r[9] ? ' class="mac-eq-hot"' : ''}><th scope="row">${r[9] ? '<span class="mac-eq-flag">Easy to forget</span>' : ''}<span class="mac-eq-f">${R(`$${r[0]}$`)}</span><span class="mac-eq-w"><span class="mac-small">Worked:</span> ${R(`$${workedTex(r[8])}$`)}</span></th><td>${R(r[1])} <span class="mac-small">${R(r[2])}</span></td><td>${R(r[3])}</td><td>${esc(r[4])}<br>${topicLink(r[5], depth)}${trainers(r[6])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const hot = EQ.flatMap(sec => sec.rows.filter(r => r[9]));
    const hotList = `<section class="xsection mac-eq-sec" aria-labelledby="eq-hot"><h2 id="eq-hot">Easy to forget</h2>
    <p>These ${hot.length} formulas and ${GRAPHS.filter(g => g[3]).length} graphs cost the most points every year. Each is flagged below.</p>
    <ul class="mac-eq-not">${hot.map(r => `<li><b>${R(r[1])}</b> ${R(r[3])}</li>`).join('')}${GRAPHS.filter(g => g[3]).map(([k, , trap]) => `<li><b>${esc(Graph.KINDS[k].title)}.</b> ${esc(trap)}</li>`).join('')}</ul></section>`;
    const sheet = BALANCE_SHEET;
    const bsCard = `<figure class="mac-gr-card mac-gr-bs"><div class="table-wrap" tabindex="0" role="region" aria-label="A bank balance sheet"><table class="mac-bs"><caption>A bank's balance sheet (dollars)</caption><thead><tr><th scope="col" colspan="2">Assets</th><th scope="col" colspan="2">Liabilities</th></tr></thead><tbody>${sheet.assets.map((a, i) => `<tr><td>${esc(a[0])}</td><td>${esc(a[1])}</td><td>${esc((sheet.liabilities[i] || ['', ''])[0])}</td><td>${esc((sheet.liabilities[i] || ['', ''])[1])}</td></tr>`).join('')}</tbody></table></div><figcaption><b>Bank balance sheet.</b> ${esc(sheet.note)} <span class="mac-small">${topicLink(sheet.topic, depth)}</span></figcaption></figure>`;
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell mac-app mac-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Graphs and formulas you must know' }])}
  <header class="hero mac-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Graphs and formulas you must know</h1>
  <p class="lede">The exam gives you no formula sheet. These are the calculations and the graphs it expects you to know, in our own words: what each means, when to use it, and the trap that costs points. The ones students most often get wrong are flagged "Easy to forget".</p></header>
  ${hotList}
  ${sections}
  <section class="xsection mac-eq-sec" aria-labelledby="eq-graphs"><h2 id="eq-graphs">The graphs you must draw</h2>
    <p>Label every axis and curve exactly as here, and show each shift with a new curve (AD2) and the new equilibrium.</p>
    <div class="mac-gr-gallery">${GRAPHS.map(([k, t, trap, f]) => `<figure class="mac-gr-card${f ? ' mac-eq-hot' : ''}">${f ? '<span class="mac-eq-flag">Easy to forget</span>' : ''}<div class="mac-plot-wrap">${Graph.svg({ kind: k, do: [], names: k === 'ppc' ? { x: 'Good A', y: 'Good B' } : k === 'forex' ? { currency: 'euro', other: 'dollar' } : undefined }, { labelsShown: true })}</div><figcaption><b>${esc(Graph.KINDS[k].title)}.</b> ${esc(trap)} <span class="mac-small">${topicLink(t, depth)}</span></figcaption></figure>`).join('')}${bsCard}</div>
  </section>
  <section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Habits that save points</h2>
    <ul class="mac-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="mac-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-tables"><h2 id="eq-tables">On exam day</h2>
    <ul class="mac-eq-not">${TABLES.map(r => `<li><b>${esc(r[0])}.</b> ${R(r[1])}</li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[testLink('', 'Free unit practice tests'), `<a href="flashcards.html?deck=formulas">Formula flashcards</a>`, (liveTools || []).some(t => t.slug === 'graph-studio') ? `<a href="tools/graph-studio.html">Graph studio</a>` : '', `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
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
      return s ? `<div class="mac-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell mac-app mac-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero mac-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most are multiple choice, as on the real exam; a few ask for a number or have you shift a curve on a graph, and sets share one data table, graph or scenario.</p>
  <p class="mac-small mac-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="mac-qs" data-set="check">${html}</div>
  <section class="xsection mac-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="mac-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="mac-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="mac-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['mac-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = r3Inner(head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body, { key: 'apmacro', slug: 'unit-test', up: '../../' });
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
  /* items.json: every question a live form uses as the exam serves it, with
     five options: the exam-only ones, and each bank question with its fifth
     option (examVersion) and its explanations inline (pages/exams.js prefers
     these to the bank's four-option copies). Their stimuli go with them. */
  const used = [...new Set(live.flatMap(f => f.mcq.flat()))];
  const fifthR = renderMath(ex.fifth || {});
  const served = used.map(id => examItems.get(id) || (bank.get(id) && examVersion(bank.get(id), fifthR))).filter(Boolean);
  const stimById = sid => ex.stimuli[sid] || (map.topics.map(t => ((C.questions[t.id] || {}).stimuli || {})[sid]).find(Boolean));
  const ownStim = {};
  for (const q of served) { const s = q.stimulus && stimById(q.stimulus); if (s && !ownStim[q.stimulus]) ownStim[q.stimulus] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') }; }
  out['assets/exams/forms.json'] = JSON.stringify(live.map(f => ({ id: f.id, title: f.title, mcq: f.mcq, frq: f.frq })));
  out['assets/exams/items.json'] = JSON.stringify({ stimuli: ownStim, items: served.map(questionForPage) });

  /* --------------------------------------------- "Make it specific" data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  /* The builder for a prompt whose answer has components: the slots in
     order, option text raw (shown as plain text in a select, ApMacroTex.plain),
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
