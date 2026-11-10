/* AP® Microeconomics search-entry pages and exam data
   (docs/apmicro-architecture.md, "Exams and entry pages"), written by
   scripts/build-apmicro.mjs:

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
import { loadExams, loadJustify, formUnits, examVersion, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apmicro-exams.mjs';
import { renderMath, prepareBank, specificSlots } from './apmicro-build.mjs';
import { Stats, Graph, Matrix } from './apmicro-mathlib.mjs';
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
   The worked line is [setup TeX, ApMicroCalc recipe, unit TeX, decimals]:
   the page prints "setup = answer unit" with the answer computed by
   ApMicroCalc at build time, so no worked number is typed by hand. Each row
   is also a card in the "Formulas" flashcard deck (assets/formulas.json).
   GRAPHS lists the graphs with their axes, drawn by ApMicroGraph. */
const D = String.raw;
/* r[9] (optional): true for a formula students most often get wrong on the
   exam (framework.md section 7: marginal cost without dividing by the change
   in output, AFC divided by workers, a subsidy's cost on the old quantity,
   MRP written as MR times P, the sign of a cross-price elasticity, the one
   half in a surplus triangle); flagged "Easy to forget" on the page and
   listed at its top. */
export const EQ = [
  { id: 'choices', h: 'Choices and trade', rows: [
    [D`\text{opportunity cost of 1 unit of X} = \frac{\text{units of Y given up}}{\text{units of X gained}}`, 'Opportunity cost per unit, read off a PPC or an output table.', 'Comparative advantage and moving along a PPC.', 'Comparative advantage goes to the lower opportunity cost, not the larger output (that is absolute advantage).', 'Unit 1', 'comparative-advantage', [], 'opportunityCost',
      [D`\frac{20 \text{ bolts}}{10 \text{ chairs}}`, { fn: 'opportunityCost', args: [20, 10] }, D`\text{ bolts per chair}`, 0], true],
    [D`\text{marginal utility per dollar} = \frac{MU}{P}`, 'Marginal utility per dollar.', 'Choosing the bundle that maximizes total utility: equal MU per dollar across goods, budget spent.', 'Compare MU divided by price, not MU alone, and stop when the budget runs out.', 'Unit 1', 'marginal-analysis', [], 'muPerDollar',
      [D`\frac{30 \text{ utils}}{\$2}`, { fn: 'muPerDollar', args: [30, 2] }, D`\text{ utils per dollar}`, 0], true],
  ] },
  { id: 'elasticity', h: 'Elasticity and revenue', rows: [
    [D`\%\Delta = \frac{\text{new} - \text{old}}{\text{old}} \times 100`, 'A percent change.', 'Every elasticity starts from two of them.', 'Divide by the old value, and keep the sign until you take the absolute value.', 'Unit 2', 'price-elasticity-demand', ['elasticity-lab'], 'pctChange',
      [D`\frac{12 - 10}{10} \times 100`, { fn: 'pctChange', args: [10, 12] }, D`\%`, 0]],
    [D`E_d = \left| \frac{\%\Delta Q_d}{\%\Delta P} \right|`, 'The price elasticity of demand.', 'How strongly buyers respond to a price change; the total revenue test.', 'Quantity on top, price on the bottom; read the absolute value: above 1 is elastic, below 1 inelastic.', 'Unit 2', 'price-elasticity-demand', ['elasticity-lab'], 'priceElasticity',
      [D`\left| \frac{-20\%}{+10\%} \right|`, { fn: 'priceElasticity', args: [100, 80, 10, 11] }, '', 0], true],
    [D`E_d = \left| \frac{(Q_2 - Q_1) / \tfrac{Q_1 + Q_2}{2}}{(P_2 - P_1) / \tfrac{P_1 + P_2}{2}} \right|`, 'The price elasticity of demand by the midpoint method.', 'One route that gives the same answer whichever way the price moves (not keyed as the only route).', 'Each change is divided by the average of the two values.', 'Unit 2', 'price-elasticity-demand', ['elasticity-lab'], 'midpointElasticity',
      [D`\left| \frac{-20 / 90}{+2 / 11} \right|`, { fn: 'midpointElasticity', args: [100, 80, 10, 12] }, '', 2]],
    [D`E_I = \frac{\%\Delta Q_d}{\%\Delta \text{income}}`, 'The income elasticity of demand.', 'Telling normal goods (positive) from inferior goods (negative).', 'The sign matters here: keep it.', 'Unit 2', 'other-elasticities', ['elasticity-lab'], 'incomeElasticity',
      [D`\frac{+10\%}{+10\%}`, { fn: 'incomeElasticity', args: [50, 55, 1000, 1100] }, '', 0]],
    [D`E_{xy} = \frac{\%\Delta Q_{d,x}}{\%\Delta P_y}`, 'The cross-price elasticity of demand.', 'Telling substitutes (positive) from complements (negative).', 'Positive means substitutes, negative means complements; the price is the other good\'s.', 'Unit 2', 'other-elasticities', ['elasticity-lab'], 'crossElasticity',
      [D`\frac{-25\%}{+20\%}`, { fn: 'crossElasticity', args: [40, 30, 5, 6] }, '', 2], true],
    [D`TR = P \times Q`, 'Total revenue.', 'The total revenue test, and a firm\'s revenue at its output.', 'With elastic demand a price cut raises total revenue; with inelastic demand it lowers it.', 'Unit 2', 'price-elasticity-demand', ['elasticity-lab'], 'totalRevenue',
      [D`\$8 \times 50`, { fn: 'totalRevenue', args: [8, 50] }, '', 0, D`\$`]],
  ] },
  { id: 'areas', h: 'Surplus, taxes and trade', rows: [
    [D`CS = \tfrac{1}{2} \times Q \times (\text{top of demand} - P)`, 'Consumer surplus under a straight demand curve.', 'Surplus at equilibrium and after a change.', 'A triangle needs the one half; use the quantity actually bought.', 'Unit 2', 'equilibrium-surplus', ['surplus-lab'], 'consumerSurplus',
      [D`\tfrac{1}{2} \times 40 \times (\$10 - \$6)`, { fn: 'consumerSurplus', args: [40, 10, 6] }, '', 0, D`\$`], true],
    [D`\text{tax revenue} = \text{tax per unit} \times Q_{\text{after}}`, 'The government\'s revenue from a per-unit tax.', 'Shading and sizing the tax rectangle.', 'Use the quantity after the tax, not the old equilibrium quantity.', 'Unit 2', 'government-intervention', ['surplus-lab'], 'taxRevenue',
      [D`\$2 \times 40`, { fn: 'taxRevenue', args: [2, 40] }, '', 0, D`\$`]],
    [D`\text{subsidy cost} = \text{subsidy per unit} \times Q_{\text{after}}`, 'What a per-unit subsidy costs the government.', 'Shading and sizing the subsidy rectangle.', 'The whole rectangle between the price sellers receive and the price buyers pay, out to the new, larger quantity.', 'Unit 2', 'government-intervention', ['surplus-lab'], 'subsidyCost',
      [D`\$3 \times 60`, { fn: 'subsidyCost', args: [3, 60] }, '', 0, D`\$`], true],
    [D`DWL = \tfrac{1}{2} \times \Delta Q \times \text{price wedge}`, 'Deadweight loss, a triangle.', 'Taxes, subsidies, price controls, monopoly and externalities.', 'Between demand (MSB) and supply (MC, MSC), from the quantity traded to the efficient quantity; do not forget the one half.', 'Unit 2', 'government-intervention', ['surplus-lab', 'externality-lab'], 'dwl',
      [D`\tfrac{1}{2} \times (50 - 40) \times \$4`, { fn: 'dwl', args: [10, 4] }, '', 0, D`\$`], true],
    [D`\text{shortage} = Q_d - Q_s`, 'A shortage at a binding price ceiling (a surplus is the reverse).', 'Price controls.', 'Quantity demanded against quantity supplied at the controlled price, not demand against supply.', 'Unit 2', 'government-intervention', ['surplus-lab'], 'shortage',
      [D`70 - 40`, { fn: 'shortage', args: [70, 40] }, D`\text{ units}`, 0]],
    [D`\text{tariff revenue} = \text{tariff} \times \text{imports}_{\text{after}}`, 'The government\'s revenue from a tariff.', 'A domestic market with a world price and a tariff.', 'Imports after the tariff: quantity demanded minus quantity supplied at the higher price.', 'Unit 2', 'trade-policy', ['surplus-lab'], 'tariffRevenue',
      [D`\$1 \times (50 - 30)`, { fn: 'tariffRevenue', args: [1, 20] }, '', 0, D`\$`]],
  ] },
  { id: 'costs', h: 'Production, costs and profit', rows: [
    [D`MP = \frac{\Delta TP}{\Delta L}`, 'Marginal product.', 'A production table; diminishing marginal returns.', 'The change in output from one more worker, not output per worker (that is average product).', 'Unit 3', 'production-function', ['cost-lab'], 'marginalProduct',
      [D`\frac{25 - 15}{3 - 2}`, { fn: 'marginalProduct', args: [15, 25, 2, 3] }, D`\text{ units}`, 0]],
    [D`MC = \frac{\Delta TC}{\Delta Q}`, 'Marginal cost.', 'A cost table; the MR = MC rule.', 'Divide the change in total cost by the change in output, which is not always 1.', 'Unit 3', 'short-run-costs', ['cost-lab'], 'marginalCost',
      [D`\frac{\$300 - \$240}{30 - 20}`, { fn: 'marginalCost', args: [240, 300, 20, 30] }, '', 0, D`\$`], true],
    [D`ATC = \frac{TC}{Q}, \quad AVC = \frac{TVC}{Q}`, 'Average total and average variable cost.', 'A cost table; profit per unit; the shutdown point (minimum AVC).', 'Divide by output, and remember TC = TFC + TVC.', 'Unit 3', 'short-run-costs', ['cost-lab'], 'atc',
      [D`\frac{\$600}{50}`, { fn: 'atc', args: [600, 50] }, '', 0, D`\$`]],
    [D`AFC = \frac{TFC}{Q}`, 'Average fixed cost.', 'A cost table.', 'Divide fixed cost by output, not by workers; TFC is the same at every output, including zero.', 'Unit 3', 'short-run-costs', ['cost-lab'], 'afc',
      [D`\frac{\$200}{50}`, { fn: 'afc', args: [200, 50] }, '', 0, D`\$`], true],
    [D`\text{profit} = TR - TC = (P - ATC) \times Q`, 'Economic profit (or loss, when negative).', 'Sizing the profit or loss rectangle.', 'Use ATC at the profit-maximizing quantity, and subtract implicit costs for economic profit.', 'Unit 3', 'profit-maximization', ['firm-market'], 'unitProfit',
      [D`(\$12 - \$9) \times 100`, { fn: 'unitProfit', args: [12, 9, 100] }, '', 0, D`\$`]],
    [D`\text{economic profit} = TR - \text{explicit} - \text{implicit costs}`, 'Economic profit, against accounting profit (TR minus explicit costs only).', 'An owner who gives up a salary or interest to run the business.', 'Accounting profit is larger whenever implicit costs are positive.', 'Unit 3', 'types-of-profit', [], 'economicProfit',
      [D`90{,}000 - 60{,}000 - 40{,}000`, { fn: 'economicProfit', args: [90000, 60000, 40000] }, D`\text{ dollars}`, 0]],
  ] },
  { id: 'factors', h: 'Factor markets', rows: [
    [D`MRP = MP \times MR`, 'Marginal revenue product (MP x P when the firm sells in a competitive product market).', 'A hiring table; labor demand.', 'Marginal product times marginal revenue, never MR times P.', 'Unit 5', 'factor-markets', ['factor-lab'], 'mrp',
      [D`8 \times \$5`, { fn: 'mrp', args: [8, 5] }, '', 0, D`\$`], true],
    [D`MRC = \frac{\Delta TC}{\Delta L}`, 'Marginal resource (factor) cost.', 'Hiring where MRP = MRC; a monopsony\'s MFC.', 'For a firm that takes the market wage, MRC is the wage; for a monopsonist it is above the wage.', 'Unit 5', 'competitive-factor-markets', ['factor-lab'], 'mrc',
      [D`\frac{\$480 - \$400}{6 - 5}`, { fn: 'mrc', args: [400, 480, 5, 6] }, '', 0, D`\$`]],
    [D`\frac{MP_L}{w} = \frac{MP_K}{r}`, 'The least-cost rule: equal marginal product per dollar for every input.', 'Choosing the input mix that makes an output at least cost.', 'Use each input\'s own price, and compare products per dollar, not marginal utility.', 'Unit 5', 'competitive-factor-markets', ['factor-lab'], 'perDollar',
      [D`\frac{20}{\$10}`, { fn: 'perDollar', args: [20, 10] }, D`\text{ units per dollar}`, 0]],
    [D`\text{wage bill} = W \times L`, 'The wage bill.', 'A monopsony or any hiring answer.', 'A monopsonist pays the wage read from labor supply at the number hired.', 'Unit 5', 'monopsony', ['factor-lab'], 'wageBill',
      [D`\$12 \times 30`, { fn: 'wageBill', args: [12, 30] }, '', 0, D`\$`]],
  ] },
];
/* A worked line as TeX: "setup = answer unit", the answer from ApMicroCalc
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

// The graphs students draw (framework.md section 8): the graph as drawn (a
// spec for ApMicroGraph), the topic that teaches it, what to watch, and true
// where the graph point is most often lost (framework.md section 7). Graphs
// with lettered areas name each area in the caption.
export const GRAPHS = [
  [{ kind: 'ppc', names: { x: 'Good A', y: 'Good B' } }, 'production-possibilities', 'Label both goods; a bowed-out curve shows increasing opportunity cost, and growth shifts the whole curve out.'],
  [{ kind: 'sd' }, 'disequilibrium-changes', 'A change in the good\'s own price is a movement along a curve, not a shift.'],
  [{ kind: 'sd-micro', policy: { type: 'ceiling', at: 3 }, letters: true }, 'government-intervention', 'A binding ceiling sits below equilibrium: the quantity traded is QS. Consumer surplus a + b + d, producer surplus f, deadweight loss c + e.'],
  [{ kind: 'sd-micro', policy: { type: 'tax', amount: 2 }, letters: true }, 'government-intervention', 'The tax shifts supply up by the tax. Tax revenue b + d on the quantity after the tax (buyers pay b, sellers d), deadweight loss c + e.', true],
  [{ kind: 'sd-micro', policy: { type: 'subsidy', amount: 2 }, letters: true }, 'government-intervention', 'The subsidy shifts supply down by the subsidy. Its cost is the whole rectangle b + c + e + f + g out to the new quantity; deadweight loss g.', true],
  [{ kind: 'sd-micro', policy: { type: 'tariff', at: 2, amount: 1 }, letters: true }, 'trade-policy', 'At the world price the gap between QD and QS is imports. The tariff raises revenue e and creates deadweight loss d + f.'],
  [{ kind: 'costs', afc: true }, 'short-run-costs', 'MC crosses AVC and ATC at their minimums; the gap between ATC and AVC (AFC) narrows as output grows.', true],
  [{ kind: 'costs', set: 'long' }, 'long-run-costs', 'Economies of scale where LRATC falls, diseconomies where it rises; minimum efficient scale at the bottom.'],
  [{ kind: 'pc', start: { D: 1 }, letters: true }, 'perfect-competition', 'Market on the left, firm on the right, the price carried across. The firm\'s demand is horizontal: d = MR = AR = P; it produces where MR = MC. Profit is area a.', true],
  [{ kind: 'monopoly', letters: true }, 'monopoly', 'Quantity where MR = MC, price up on demand. Consumer surplus a, profit b, deadweight loss d between demand and MC.', true],
  [{ kind: 'monopoly', natural: true }, 'monopoly', 'A natural monopoly: ATC falls over the whole demand range. The fair-return price is where demand meets ATC.'],
  [{ kind: 'monocomp', run: 'long' }, 'monopolistic-competition', 'In the long run demand is tangent to ATC: zero economic profit, price above MC, excess capacity.'],
  [{ kind: 'labor' }, 'competitive-factor-markets', 'The market sets the wage; the firm takes it (S = MFC = W) and hires where MRP meets it.'],
  [{ kind: 'monopsony' }, 'monopsony', 'Hire where MRP = MFC, then read the wage down on labor supply, not on MRP.', true],
  [{ kind: 'externality', ext: { type: 'neg-prod' }, letters: true }, 'externalities', 'A negative production externality: MSC above MPC, so the market overproduces. Deadweight loss is area a, from the efficient to the market quantity.', true],
  [{ kind: 'lorenz' }, 'inequality', 'The further the Lorenz curve bows below the line of equality, the more unequal the income distribution.'],
];
/* A payoff matrix is the one visual students draw that is not a graph
   (spec 5b item 6). */
export const MATRIX_CARD = { topic: 'oligopoly-game-theory',
  matrix: { players: [{ name: 'Firm A', strategies: ['Low price', 'High price'] }, { name: 'Firm B', strategies: ['Low price', 'High price'] }], payoffs: [[[40, 30], [70, 20]], [[20, 60], [50, 50]]], unit: '$' },
  note: 'Firm A\'s payoff is first in each cell. Firm A\'s dominant strategy is Low price: 40 > 20 if B goes low, and 70 > 50 if B goes high. Compare twice, then decide.' };
// Exam-day facts (framework.md section 5).
export const NOT_ON = [
  ['Label everything', 'Every axis, every curve and every point the question names (PM, QM, PF, QF). A mislabeled graph loses the graph point and usually the next one.', 'axes-points'],
  ['MC through the minimums', 'Draw MC so it crosses AVC and ATC at their lowest points, every time.', 'short-run-costs'],
  ['Price from demand', 'In monopoly and monopolistic competition, find the quantity where MR = MC, then go straight up to the demand curve for the price.', 'monopoly'],
  ['Shade the whole area', 'Partial shading loses the point; shade the full triangle or rectangle the question names.', 'curves-crossing'],
  ['Both comparisons', 'A dominant-strategy claim needs both comparisons from the matrix, with the numbers.', 'oligopoly-game-theory'],
  ['Show your work', '"Calculate" needs the formula or the numbers used, not just the answer.', 'short-run-costs'],
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
    return live.length ? `<span class="mic-eq-tools"><span class="mic-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Microeconomics Graphs and Formulas You Must Know', [LABEL]);
    const desc = 'Every graph and formula the microeconomics exam expects you to know without a formula sheet: what each means, when to use it and the classic trap.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Graphs and formulas you must know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Graphs and formulas you must know', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection mic-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="mic-eq"><thead><tr><th scope="col">Formula and a worked line</th><th scope="col">What it is and when to use it</th><th scope="col">The trap</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr${r[9] ? ' class="mic-eq-hot"' : ''}><th scope="row">${r[9] ? '<span class="mic-eq-flag">Easy to forget</span>' : ''}<span class="mic-eq-f">${R(`$${r[0]}$`)}</span><span class="mic-eq-w"><span class="mic-small">Worked:</span> ${R(`$${workedTex(r[8])}$`)}</span></th><td>${R(r[1])} <span class="mic-small">${R(r[2])}</span></td><td>${R(r[3])}</td><td>${esc(r[4])}<br>${topicLink(r[5], depth)}${trainers(r[6])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const hot = EQ.flatMap(sec => sec.rows.filter(r => r[9]));
    const hotList = `<section class="xsection mic-eq-sec" aria-labelledby="eq-hot"><h2 id="eq-hot">Easy to forget</h2>
    <p>These ${hot.length} formulas and ${GRAPHS.filter(g => g[3]).length} graphs cost the most points every year. Each is flagged below.</p>
    <ul class="mic-eq-not">${hot.map(r => `<li><b>${R(r[1])}</b> ${R(r[3])}</li>`).join('')}${GRAPHS.filter(g => g[3]).map(([g, , trap]) => `<li><b>${esc(Graph.KINDS[g.kind].title)}.</b> ${esc(trap)}</li>`).join('')}</ul></section>`;
    const mx = MATRIX_CARD;
    const bsCard = `<figure class="mic-gr-card mic-gr-mx"><div class="mic-plot-wrap">${Matrix.html(mx.matrix)}</div><figcaption><b>Payoff matrix.</b> ${esc(mx.note)} <span class="mic-small">${topicLink(mx.topic, depth)}</span></figcaption></figure>`;
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell mic-app mic-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Graphs and formulas you must know' }])}
  <header class="hero mic-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Graphs and formulas you must know</h1>
  <p class="lede">The exam gives you no formula sheet. These are the calculations and the graphs it expects you to know, in our own words: what each means, when to use it, and the trap that costs points. The ones students most often get wrong are flagged "Easy to forget".</p></header>
  ${hotList}
  ${sections}
  <section class="xsection mic-eq-sec" aria-labelledby="eq-graphs"><h2 id="eq-graphs">The graphs you must draw</h2>
    <p>Label every axis and curve exactly as here, show each shift with a new curve (D2) and the new equilibrium, and shade the whole area a question names.</p>
    <div class="mic-gr-gallery">${GRAPHS.map(([g, t, trap, f]) => `<figure class="mic-gr-card${f ? ' mic-eq-hot' : ''}">${f ? '<span class="mic-eq-flag">Easy to forget</span>' : ''}<div class="mic-plot-wrap">${Graph.svg({ ...g, do: [] }, { labelsShown: true, letters: !!g.letters })}</div><figcaption><b>${esc(Graph.KINDS[g.kind].title)}.</b> ${esc(trap)} <span class="mic-small">${topicLink(t, depth)}</span></figcaption></figure>`).join('')}${bsCard}</div>
  </section>
  <section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Habits that save points</h2>
    <ul class="mic-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="mic-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>
  <section class="xsection" aria-labelledby="eq-tables"><h2 id="eq-tables">On exam day</h2>
    <ul class="mic-eq-not">${TABLES.map(r => `<li><b>${esc(r[0])}.</b> ${R(r[1])}</li>`).join('')}</ul>
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
      return s ? `<div class="mic-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell mic-app mic-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero mic-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most are multiple choice, as on the real exam; a few ask for a number or have you shift a curve on a graph, and sets share one data table, graph or scenario.</p>
  <p class="mic-small mic-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="mic-qs" data-set="check">${html}</div>
  <section class="xsection mic-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="mic-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="mic-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="mic-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['mic-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = r3Inner(head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body, { key: 'apmicro', slug: 'unit-test', up: '../../' });
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
     order, option text raw (shown as plain text in a select, ApMicroTex.plain),
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
