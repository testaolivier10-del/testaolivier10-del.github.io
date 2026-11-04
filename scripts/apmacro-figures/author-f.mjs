/* Author F figures (AP® Macroeconomics Unit 6, the open economy): the lesson and
   notes figures, drawn as self-contained SVG files (shown as <img>, so every
   color is inline; the course inverts figures in dark mode like every figure).

     node scripts/apmacro-figures/author-f.mjs     writes macroeconomics/figures/<id>.svg
                                                   and macroeconomics/data/figures/<topic>.json

   Graph geometry follows mac-graph.js: coordinates 0-10, demand slope -1 and
   supply slope +1, each through (at, 5), so every crossing is exact and the
   figures match what the graph items draw. The foreign exchange axis is always
   the price of the currency in units of the other currency per unit of this
   one ("dollars per euro" in the market for euros). Every number shown is
   invented for teaching and the figures say so where numbers appear. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'macroeconomics', 'figures');
const REG = join(ROOT, 'macroeconomics', 'data', 'figures');
const INK = '#1F2A28', MUTED = '#6B7472', C1 = '#355A0A', C2 = '#9A4A00', C3 = '#1F5C8A', TINT = '#EEF4E0', WARM = '#FBEFE3', COOL = '#E5EEF6', BG = '#FFFFFF';
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f1 = v => Math.round(v * 10) / 10;

function T(x, y, s, o = {}) {
  return `<text x="${f1(x)}" y="${f1(y)}" font-size="${o.size || 13}" font-weight="${o.weight || 'normal'}" fill="${o.fill || INK}" text-anchor="${o.anchor || 'start'}">${o.raw ? s : esc(s)}</text>`;
}
function TL(x, y, s, o = {}) { const lh = o.lh || (o.size || 13) * 1.32; return String(s).split('\n').map((l, i) => T(x, y + i * lh, l, o)).join(''); }
const R = (x, y, w, h, o = {}) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${o.rx ?? 10}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"/>`;
const A = (x1, y1, x2, y2, o = {}) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.8}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} marker-end="url(#ar-${o.m || 'ink'})"/>`;
function box(x, y, w, h, text, o = {}) {
  const lines = String(text).split('\n'), sz = o.size || 13, lh = sz * 1.32;
  const y0 = y + h / 2 - (lines.length - 1) * lh / 2 + sz * 0.35;
  return R(x, y, w, h, { fill: o.fill || BG, stroke: o.stroke || INK, rx: o.rx ?? 10 }) +
    lines.map((l, i) => T(x + w / 2, y0 + i * lh, l, { anchor: 'middle', size: sz, weight: i === 0 && o.bold !== false ? 'bold' : 'normal', fill: o.ink || INK })).join('');
}
function svg(id, w, h, title, desc, body) {
  const marks = [['ink', INK], ['c1', C1], ['c2', C2], ['c3', C3], ['muted', MUTED]].map(([n, c]) =>
    `<marker id="ar-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${marks}</defs>
<rect width="${w}" height="${h}" fill="${BG}"/>
${body}
</svg>
`;
}

/* One market panel at (ox, oy), size pw x ph, in data units 0-10.
   curves: { shape: 'down'|'up', at, name, sub, old?, color? }
   points: { x, y, label, old? } with dashed guides to both axes and the axis
   values (yv, xv) written at the axes. */
function panel({ ox, oy, pw = 250, ph = 220, title, xLabel, yLabel, curves = [], points = [], arrows = [], note }) {
  const X = x => ox + (x / 10) * pw, Y = v => oy + ph - (v / 10) * ph;
  const g = [];
  if (title) g.push(T(ox + pw / 2, oy - 16, title, { anchor: 'middle', size: 15, weight: 'bold' }));
  g.push(`<path d="M${ox} ${oy}V${oy + ph}H${ox + pw}" fill="none" stroke="${INK}" stroke-width="1.8"/>`);
  g.push(T(ox + pw, oy + ph + 36, xLabel, { anchor: 'end', size: 13, weight: 'bold' }));
  g.push(`<text transform="translate(${f1(ox - 34)} ${f1(oy)}) rotate(-90)" text-anchor="end" font-size="13" font-weight="bold" fill="${INK}">${esc(yLabel)}</text>`);
  for (const c of curves) {
    const col = c.old ? MUTED : c.color || C1, dash = c.old ? ' stroke-dasharray="4 5"' : '', w = c.old ? 2 : 2.8;
    const ys = x => c.shape === 'down' ? 5 - (x - c.at) : 5 + (x - c.at);
    const x0 = Math.max(0.4, c.at - 4.2), x1 = Math.min(9.7, c.at + 4.2);
    g.push(`<path d="M${f1(X(x0))} ${f1(Y(ys(x0)))}L${f1(X(x1))} ${f1(Y(ys(x1)))}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash}/>`);
    const lx = X(x1) + 5, ly = Y(ys(x1)) + (c.shape === 'down' ? 12 : 0);
    g.push(`<text x="${f1(lx)}" y="${f1(ly)}" font-size="13" font-weight="bold" fill="${col}">${esc(c.name)}${c.sub ? `<tspan font-size="10" dy="3">${esc(c.sub)}</tspan>` : ''}</text>`);
  }
  for (const p of points) {
    const col = p.old ? MUTED : INK;
    g.push(`<path d="M${f1(X(0))} ${f1(Y(p.y))}H${f1(X(p.x))}V${f1(Y(0))}" fill="none" stroke="${col}" stroke-width="1.1" stroke-dasharray="3 4"/>`);
    g.push(`<circle cx="${f1(X(p.x))}" cy="${f1(Y(p.y))}" r="4.5" fill="${col}"/>`);
    if (p.label) g.push(T(X(p.x) + (p.lx ?? 8), Y(p.y) + (p.ly ?? -7), p.label, { size: 12, weight: 'bold', fill: col }));
    if (p.yv) g.push(T(X(0) - 6, Y(p.y) + 4, p.yv, { anchor: 'end', size: 12, weight: 'bold', fill: col }));
    if (p.xv) g.push(T(X(p.x), Y(0) + 16, p.xv, { anchor: 'middle', size: 12, weight: 'bold', fill: col }));
  }
  for (const a of arrows) g.push(A(X(a[0]), Y(a[1]), X(a[2]), Y(a[3]), { stroke: a[4] || C2, m: a[5] || 'c2', w: 2 }));
  if (note) g.push(TL(ox + 10, oy + 14, note, { size: 12, fill: MUTED }));
  return g.join('');
}

const FIGS = [];
const add = (topic, id, w, h, title, alt, body) => FIGS.push({ topic, id, w, h, title, alt, svg: svg(id, w, h, title, alt, body) });

/* 6.1: the two halves of the balance of payments, with one invented set of
   numbers that sums to zero. */
{
  const W = 820, H = 430;
  let b = '';
  b += T(W / 2, 34, 'The balance of payments of Arland (invented numbers, billions of arls)', { anchor: 'middle', size: 16, weight: 'bold' });
  // Current account
  b += R(30, 60, 360, 270, { fill: WARM, stroke: C2 });
  b += T(210, 88, 'Current account', { anchor: 'middle', size: 15, weight: 'bold', fill: C2 });
  b += T(210, 106, 'trade in goods and services, income, transfers', { anchor: 'middle', size: 12, fill: INK });
  const ca = [['Exports of goods and services', '+400'], ['Imports of goods and services', '-520'], ['Net income from abroad', '+30'], ['Net transfers', '-10']];
  ca.forEach(([k, v], i) => { b += T(50, 140 + i * 30, k, { size: 13 }); b += T(370, 140 + i * 30, v, { anchor: 'end', size: 13, weight: 'bold' }); });
  b += `<line x1="50" y1="262" x2="370" y2="262" stroke="${C2}" stroke-width="1.4"/>`;
  b += T(50, 290, 'Current account balance', { size: 14, weight: 'bold', fill: C2 });
  b += T(370, 290, '-100', { anchor: 'end', size: 15, weight: 'bold', fill: C2 });
  b += T(210, 316, 'a deficit: more spent abroad than earned', { anchor: 'middle', size: 12, fill: INK });
  // Capital and financial account
  b += R(430, 60, 360, 270, { fill: COOL, stroke: C3 });
  b += T(610, 88, 'Capital and financial account', { anchor: 'middle', size: 15, weight: 'bold', fill: C3 });
  b += T(610, 106, 'purchases and sales of assets', { anchor: 'middle', size: 12, fill: INK });
  const fa = [['Foreigners buy Arland assets', '+250'], ['Arlanders buy foreign assets', '-150']];
  fa.forEach(([k, v], i) => { b += T(450, 140 + i * 30, k, { size: 13 }); b += T(770, 140 + i * 30, v, { anchor: 'end', size: 13, weight: 'bold' }); });
  b += TL(450, 222, 'Money flows in (+) when a foreigner pays for\nan Arland asset; it flows out (-) when an\nArlander pays for a foreign one.', { size: 12, fill: MUTED });
  b += `<line x1="450" y1="262" x2="770" y2="262" stroke="${C3}" stroke-width="1.4"/>`;
  b += T(450, 290, 'Capital and financial account balance', { size: 14, weight: 'bold', fill: C3 });
  b += T(770, 290, '+100', { anchor: 'end', size: 15, weight: 'bold', fill: C3 });
  b += T(610, 316, 'a surplus: assets sold abroad pay for it', { anchor: 'middle', size: 12, fill: INK });
  b += box(210, 352, 400, 56, 'Sum: -100 + (+100) = 0\nEvery purchase from abroad is paid for somehow.', { fill: TINT, stroke: C1, size: 14 });
  add('balance-of-payments', 'balance-of-payments-accounts', W, H, 'The two accounts of the balance of payments',
    'Two panels for the invented country Arland, in billions of arls. Current account: exports of goods and services plus 400, imports minus 520, net income from abroad plus 30, net transfers minus 10, for a current account balance of minus 100, a deficit. Capital and financial account: foreigners buy Arland assets plus 250, Arlanders buy foreign assets minus 150, for a balance of plus 100, a surplus. The two balances sum to zero.', b);
}

/* 6.2: one exchange rate written both ways, and what appreciation means. */
{
  const W = 820, H = 400;
  let b = '';
  b += T(W / 2, 34, 'One exchange rate, written two ways (suppose these rates)', { anchor: 'middle', size: 16, weight: 'bold' });
  b += box(40, 60, 330, 84, '1 euro = 1.25 dollars\nthe price of the euro: 1.25 dollars per euro', { fill: TINT, stroke: C1, size: 14 });
  b += box(450, 60, 330, 84, '1 dollar = 0.80 euro\nthe price of the dollar: 0.80 euro per dollar', { fill: COOL, stroke: C3, size: 14 });
  b += A(372, 92, 446, 92, { stroke: INK, m: 'ink' });
  b += A(446, 116, 372, 116, { stroke: INK, m: 'ink' });
  b += T(409, 84, '1 / 1.25', { anchor: 'middle', size: 12, weight: 'bold' });
  b += T(409, 136, '1 / 0.80', { anchor: 'middle', size: 12, weight: 'bold' });
  b += T(W / 2, 186, 'Then the rate changes to 1 euro = 1.50 dollars', { anchor: 'middle', size: 15, weight: 'bold' });
  b += box(40, 206, 330, 110, 'The euro appreciates\nOne euro now buys 1.50 dollars,\nnot 1.25: it buys more dollars.\nA 40-euro ticket: 50 dollars before, 60 after.', { fill: WARM, stroke: C2, size: 13 });
  b += box(450, 206, 330, 110, 'The dollar depreciates\nOne dollar now buys 0.67 euro,\nnot 0.80: it buys fewer euros.\nThe two moves are one change, seen from each side.', { fill: COOL, stroke: C3, size: 13 });
  b += T(W / 2, 352, 'Read the units: "dollars per euro" is the price of one euro. Flip the ratio and you get the price of one dollar.', { anchor: 'middle', size: 13, fill: INK });
  b += T(W / 2, 376, 'Rates are made up for practice.', { anchor: 'middle', size: 12, fill: MUTED });
  add('exchange-rates', 'exchange-rates-two-quotes', W, H, 'An exchange rate written two ways, and appreciation',
    'Suppose 1 euro equals 1.25 dollars; flipped, 1 dollar equals 0.80 euro, because 1 divided by 1.25 is 0.80. When the rate changes to 1 euro equals 1.50 dollars, the euro appreciates (it buys more dollars, and a 40-euro ticket costs 60 dollars instead of 50) and the dollar depreciates (it buys about 0.67 euro instead of 0.80). Made-up rates for practice.', b);
}

/* 6.3: the market for euros and the market for dollars side by side: who
   demands and who supplies each currency, and the axis ratio. */
{
  const W = 860, H = 470;
  let b = '';
  b += panel({ ox: 90, oy: 60, title: 'The market for euros', xLabel: 'Quantity of euros', yLabel: 'Price of the euro (dollars per euro)',
    curves: [{ shape: 'down', at: 5, name: 'D', sub: '€' }, { shape: 'up', at: 5, name: 'S', sub: '€', color: C3 }],
    points: [{ x: 5, y: 5, label: 'E1', yv: 'XR1', xv: 'Q1' }] });
  b += panel({ ox: 530, oy: 60, title: 'The market for dollars', xLabel: 'Quantity of dollars', yLabel: 'Price of the dollar (euros per dollar)',
    curves: [{ shape: 'down', at: 5, name: 'D', sub: '$' }, { shape: 'up', at: 5, name: 'S', sub: '$', color: C3 }],
    points: [{ x: 5, y: 5, label: 'E1', yv: 'XR1', xv: 'Q1' }] });
  b += box(40, 340, 380, 108, 'Who is on each side of the euro market\nDemand for euros: Americans (and others) buying\nEuropean goods, services and assets.\nSupply of euros: Europeans buying American goods,\nservices and assets with their euros.', { fill: TINT, stroke: C1, size: 12.5 });
  b += box(480, 340, 360, 108, 'The same trades, seen as dollars\nAmericans buying euros supply dollars.\nEuropeans selling euros demand dollars.\nSo more demand for euros is more supply\nof dollars: one change, two mirror graphs.', { fill: COOL, stroke: C3, size: 12.5 });
  add('foreign-exchange-market', 'foreign-exchange-market-mirror', W, H, 'The market for euros and the market for dollars',
    'Two foreign exchange graphs side by side. Left: the market for euros, with Quantity of euros on the horizontal axis and Price of the euro (dollars per euro) on the vertical axis, a downward demand curve and an upward supply curve crossing at E1, with exchange rate XR1 and quantity Q1. Right: the market for dollars, with Quantity of dollars and Price of the dollar (euros per dollar). Notes: demand for euros comes from people buying European goods, services and assets; supply of euros from Europeans buying American ones; more demand for euros is the same trades as more supply of dollars.', b);
}

/* 6.4: a determinant shifts demand for the dollar right; the dollar appreciates. */
{
  const W = 820, H = 420;
  let b = '';
  b += panel({ ox: 100, oy: 60, pw: 300, ph: 250, title: 'The market for dollars', xLabel: 'Quantity of dollars', yLabel: 'Price of the dollar (euros per dollar)',
    curves: [{ shape: 'down', at: 4, name: 'D', sub: '1', old: true }, { shape: 'down', at: 6, name: 'D', sub: '2' }, { shape: 'up', at: 4, name: 'S', sub: '1', color: C3 }],
    points: [{ x: 4, y: 5, label: 'E1', yv: 'XR1', xv: 'Q1', old: true, lx: -26, ly: -8 }, { x: 5, y: 6, label: 'E2', yv: 'XR2', xv: 'Q2' }],
    arrows: [[2.3, 7, 3.7, 7]] });
  b += box(470, 70, 320, 64, 'Cause: US real interest rates rise\nrelative to those in Europe', { fill: WARM, stroke: C2, size: 13 });
  b += A(630, 136, 630, 160, { stroke: INK, m: 'ink' });
  b += box(470, 162, 320, 64, 'European savers want US bonds,\nso they demand more dollars: D shifts right', { fill: BG, stroke: INK, size: 13, bold: false });
  b += A(630, 228, 630, 252, { stroke: INK, m: 'ink' });
  b += box(470, 254, 320, 64, 'The price of the dollar rises from XR1\nto XR2: the dollar appreciates', { fill: TINT, stroke: C1, size: 13 });
  b += TL(470, 346, 'In the market for euros, the mirror change: the supply of\neuros rises, so the euro depreciates.', { size: 12.5, fill: MUTED });
  add('fx-policy-changes', 'fx-policy-changes-demand-shift', W, H, 'Higher US real interest rates shift demand for the dollar right',
    'A graph of the market for dollars, with Quantity of dollars on the horizontal axis and Price of the dollar (euros per dollar) on the vertical axis. Demand shifts right from D1 to D2 along an unchanged supply curve S1; the equilibrium moves from E1 to E2, the exchange rate rises from XR1 to XR2 and the quantity from Q1 to Q2. Beside it, the chain: US real interest rates rise relative to Europe, European savers demand more dollars to buy US bonds, demand shifts right, the dollar appreciates; in the market for euros the supply of euros rises and the euro depreciates.', b);
}

/* 6.5: from a stronger currency to net exports and aggregate demand. */
{
  const W = 820, H = 450;
  let b = '';
  b += T(W / 2, 34, 'When the dollar appreciates (ceteris paribus)', { anchor: 'middle', size: 16, weight: 'bold' });
  b += box(260, 54, 300, 52, 'The dollar appreciates\neach dollar buys more foreign currency', { fill: WARM, stroke: C2, size: 13 });
  b += A(360, 108, 210, 140); b += A(460, 108, 610, 140);
  b += box(40, 142, 340, 70, 'US goods cost more abroad\na 20-dollar shirt: 16 euros at 0.80 euro per\ndollar, 18 euros at 0.90 euro per dollar', { size: 12.5 });
  b += box(440, 142, 340, 70, 'Foreign goods cost less in the US\na 45-euro jacket: 56.25 dollars at 0.80 euro\nper dollar, 50 dollars at 0.90 euro per dollar', { size: 12.5 });
  b += A(210, 214, 210, 240); b += A(610, 214, 610, 240);
  b += box(40, 242, 340, 48, 'US exports (X) fall', { fill: BG, size: 14 });
  b += box(440, 242, 340, 48, 'US imports (M) rise', { fill: BG, size: 14 });
  b += A(210, 292, 360, 318); b += A(610, 292, 460, 318);
  b += box(240, 320, 340, 48, 'Net exports (X - M) fall', { fill: TINT, stroke: C1, size: 14 });
  b += A(410, 370, 410, 392);
  b += box(140, 394, 540, 44, 'AD shifts left: real GDP and the price level fall in the short run', { fill: TINT, stroke: C1, size: 13.5 });
  add('fx-net-exports', 'fx-net-exports-chain', W, H, 'From an appreciating dollar to net exports and AD',
    'A flow chart. The dollar appreciates, so each dollar buys more foreign currency. Two branches: US goods cost more abroad (a 20-dollar shirt costs 16 euros at 0.80 euro per dollar and 18 euros at 0.90), so US exports fall; foreign goods cost less in the US (a 45-euro jacket costs 56.25 dollars at 0.80 euro per dollar and 50 dollars at 0.90), so US imports rise. Both lower net exports, X minus M, so aggregate demand shifts left and real GDP and the price level fall in the short run. Made-up rates.', b);
}

/* 6.6: higher real interest rates in the US, linked through three markets. */
{
  const W = 900, H = 470;
  let b = '';
  b += panel({ ox: 80, oy: 60, pw: 220, ph: 200, title: 'US loanable funds market', xLabel: 'Quantity of loanable funds', yLabel: 'Real interest rate',
    curves: [{ shape: 'down', at: 4, name: 'D', sub: 'LF1', old: true }, { shape: 'down', at: 6, name: 'D', sub: 'LF2' }, { shape: 'up', at: 4, name: 'S', sub: 'LF', color: C3 }],
    points: [{ x: 4, y: 5, label: '', yv: 'r1', old: true }, { x: 5, y: 6, label: '', yv: 'r2' }], arrows: [[2.3, 7, 3.7, 7]] });
  b += panel({ ox: 560, oy: 60, pw: 220, ph: 200, title: 'Market for dollars', xLabel: 'Quantity of dollars', yLabel: 'Price of the dollar (euros per dollar)',
    curves: [{ shape: 'down', at: 4, name: 'D', sub: '1', old: true }, { shape: 'down', at: 6, name: 'D', sub: '2' }, { shape: 'up', at: 4, name: 'S', sub: '', color: C3 }],
    points: [{ x: 4, y: 5, label: '', yv: 'XR1', old: true }, { x: 5, y: 6, label: '', yv: 'XR2' }], arrows: [[2.3, 7, 3.7, 7]] });
  b += A(360, 160, 470, 160, { stroke: C2, m: 'c2', w: 2.4 });
  b += TL(415, 120, 'r rises above\nEurope\'s', { anchor: 'middle', size: 12.5, weight: 'bold', fill: C2 });
  b += TL(415, 186, 'financial capital\nflows into the US', { anchor: 'middle', size: 12.5, weight: 'bold', fill: C2 });
  const steps = ['Government\nborrowing rises', 'Real interest\nrate rises', 'Capital inflow:\nforeigners buy\nUS assets', 'Demand for\ndollars rises', 'The dollar\nappreciates', 'Net exports\nfall'];
  const bw = 132, gap = 12, x0 = (W - (steps.length * bw + (steps.length - 1) * gap)) / 2;
  steps.forEach((s, i) => {
    const x = x0 + i * (bw + gap);
    b += box(x, 350, bw, 70, s, { fill: i === 2 ? WARM : i === 5 ? TINT : BG, stroke: i === 2 ? C2 : i === 5 ? C1 : INK, size: 12, bold: false });
    if (i < steps.length - 1) b += A(x + bw + 1, 385, x + bw + gap - 1, 385, { w: 1.6 });
  });
  b += T(W / 2, 450, 'The inflow also shows up as a larger surplus on the US capital and financial account, matched by a smaller current account balance.', { anchor: 'middle', size: 12.5, fill: MUTED });
  add('real-rates-financial-flows', 'real-rates-financial-flows-links', W, H, 'Higher US real interest rates, through two markets',
    'Two linked graphs. Left: the US loanable funds market, with Quantity of loanable funds and Real interest rate on the axes; demand for loanable funds shifts right from DLF1 to DLF2 along supply SLF, and the real interest rate rises from r1 to r2. An arrow says the real rate rises above Europe\'s and financial capital flows into the US. Right: the market for dollars, with Quantity of dollars and Price of the dollar (euros per dollar); demand shifts right from D1 to D2 and the exchange rate rises from XR1 to XR2. Below, the chain: government borrowing rises, the real interest rate rises, capital flows in as foreigners buy US assets, demand for dollars rises, the dollar appreciates, net exports fall. The inflow is a larger capital and financial account surplus, matched by a smaller current account balance.', b);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(REG, { recursive: true });
const byTopic = {};
for (const F of FIGS) {
  writeFileSync(join(OUT, `${F.id}.svg`), F.svg);
  (byTopic[F.topic] ||= {})[F.id] = { file: `figures/${F.id}.svg`, ext: 'svg', w: F.w, h: F.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: F.alt };
}
for (const [topic, reg] of Object.entries(byTopic)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(reg, null, 1) + '\n');
console.log(`author F: ${FIGS.length} figures: ${FIGS.map(f => f.id).join(', ')}`);
