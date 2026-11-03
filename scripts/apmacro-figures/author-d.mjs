/* AP® Macroeconomics figures for Unit 4, topics 4.1-4.7 (author D): diagrams
   and economics graphs drawn from their labels. Graphs a student works on are
   graph specs in the question files (drawn by mac-graph.js); these are the
   static lesson and notes figures.
   Writes
     macroeconomics/figures/<id>.svg
     macroeconomics/data/figures/<topic>.json   (the registry entries)

     node scripts/apmacro-figures/author-d.mjs

   Style: white background, role="img" with <title> and <desc>,
   Arial/Helvetica, ink #1F2A28, the course green #355A0A for emphasis, then
   Okabe-Ito blue #0072B2 for a curve after a shift and vermillion #D55E00 for
   arrows of change. Every graph labels both axes and every curve (the
   authoring guide's graph labeling rules). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'macroeconomics', 'figures');
const REG = join(ROOT, 'macroeconomics', 'data', 'figures');
const INK = '#1F2A28', GREEN = '#355A0A', BLUE = '#0072B2', VERM = '#D55E00', GRID = '#D6DEE3', TINT = '#EEF4E0', SOFT = '#F4F7F9', MUTED = '#5B6662';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = v => Math.round(v * 10) / 10;
function text(x, y, s, o = {}) {
  const a = [`x="${r(x)}"`, `y="${r(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.fill || INK}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.bold) a.push('font-weight="700"');
  if (o.rotate) a.push(`transform="rotate(${o.rotate} ${r(x)} ${r(y)})"`);
  return `<text ${a.join(' ')}>${o.raw ? s : esc(s)}</text>`;
}
const lines = (x, y, arr, o = {}) => arr.map((s, i) => text(x, y + i * (o.lh || (o.size || 14) * 1.35), s, o)).join('');
const rect = (x, y, w, h, o = {}) => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.sw || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 2}"${o.arrow ? ` marker-end="url(#${o.arrow})"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const path = (d, o = {}) => `<path d="${d}" fill="none" stroke="${o.stroke || INK}" stroke-width="${o.sw || 2.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const dot = (x, y, c = INK) => `<circle cx="${r(x)}" cy="${r(y)}" r="5" fill="${c}"/>`;
// A label with a subscript: "MD" + "1".
const sub = (x, y, main, s, o = {}) => text(x, y, `${esc(main)}<tspan font-size="${Math.round((o.size || 15) * 0.7)}" dy="4">${esc(s)}</tspan>`, { ...o, raw: true, bold: true, size: o.size || 15 });
const marker = (id, color) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker>`;
const DEFS = `<defs>${marker('arr', INK)}${marker('arrV', VERM)}${marker('arrG', GREEN)}</defs>`;
function svg(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
${DEFS}
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}

/* A graph frame: the plot area [x0, y0, w, h] in pixels, coordinates 0-10. */
function frame(x0, y0, w, h, xLabel, yLabel) {
  const X = v => x0 + v / 10 * w, Y = v => y0 + h - v / 10 * h;
  const body = line(x0, y0 + h, x0, y0 - 6, { arrow: 'arr' })
    + line(x0, y0 + h, x0 + w + 6, y0 + h, { arrow: 'arr' })
    + text(x0 + w, y0 + h + 44, xLabel, { anchor: 'end', size: 14, bold: true })
    + text(x0 - 50, y0, yLabel, { anchor: 'end', size: 14, bold: true, rotate: -90 });
  return { X, Y, body };
}
const poly = (F, pts, o) => path('M' + pts.map(([a, b]) => `${r(F.X(a))} ${r(F.Y(b))}`).join('L'), o);
// Dashed guides from a point to both axes, with labels.
function guides(F, x, y, xl, yl, color = MUTED) {
  return line(F.X(0), F.Y(y), F.X(x), F.Y(y), { stroke: color, sw: 1.3, dash: '5 4' }) + line(F.X(x), F.Y(y), F.X(x), F.Y(0), { stroke: color, sw: 1.3, dash: '5 4' })
    + (yl ? sub(F.X(0) - 8, F.Y(y) + 5, yl[0], yl[1], { anchor: 'end', size: 14 }) : '')
    + (xl ? sub(F.X(x), F.Y(0) + 18, xl[0], xl[1], { anchor: 'middle', size: 14 }) : '');
}

const figs = {};
function add(topic, id, w, h, title, alt, body) {
  mkdirSync(FIG, { recursive: true });
  writeFileSync(join(FIG, `${id}.svg`), svg(w, h, title, alt, body));
  (figs[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* 4.1: interest rates and bond prices move in opposite directions. */
{
  const W = 760, H = 330;
  let b = '';
  const panel = (x, up) => {
    let s = rect(x, 20, 340, 290, { fill: SOFT, stroke: GRID });
    s += text(x + 170, 52, up ? 'Market interest rates rise' : 'Market interest rates fall', { anchor: 'middle', bold: true, size: 17 });
    // two arrows
    const a1 = x + 100, a2 = x + 240;
    s += text(a1, 92, 'Interest rates', { anchor: 'middle', size: 15 });
    s += text(a2, 92, 'Price of an', { anchor: 'middle', size: 15 }) + text(a2, 110, 'existing bond', { anchor: 'middle', size: 15 });
    s += up ? line(a1, 220, a1, 130, { stroke: GREEN, sw: 6, arrow: 'arrG' }) : line(a1, 130, a1, 220, { stroke: GREEN, sw: 6, arrow: 'arrG' });
    s += up ? line(a2, 130, a2, 220, { stroke: VERM, sw: 6, arrow: 'arrV' }) : line(a2, 220, a2, 130, { stroke: VERM, sw: 6, arrow: 'arrV' });
    s += lines(x + 170, 258, up
      ? ['New bonds pay more than the old one,', 'so buyers pay less for the old bond.']
      : ['The old bond pays more than new ones,', 'so buyers pay more for the old bond.'], { anchor: 'middle', size: 14, fill: MUTED });
    return s;
  };
  b += panel(20, true) + panel(400, false);
  add('financial-assets', 'financial-assets-bond-seesaw', W, H, 'Interest rates and bond prices move in opposite directions',
    'Two panels. Left: when market interest rates rise, the price of an existing bond falls, because new bonds pay more than the old one. Right: when market interest rates fall, the price of an existing bond rises, because the old bond pays more than new ones.', b);
}

/* 4.2: the nominal rate split into the real rate and anticipated inflation. */
{
  const W = 760, H = 250;
  let b = text(380, 40, 'A loan at a 7% nominal interest rate when lenders expect 3% inflation', { anchor: 'middle', bold: true, size: 17 });
  const x0 = 70, unit = 88;
  b += rect(x0, 80, unit * 4, 60, { fill: GREEN, rx: 4 }) + text(x0 + unit * 2, 116, 'Real interest rate: 4%', { anchor: 'middle', fill: '#FFFFFF', bold: true, size: 16 });
  b += rect(x0 + unit * 4, 80, unit * 3, 60, { fill: TINT, stroke: GREEN, rx: 4 }) + text(x0 + unit * 5.5, 116, 'Expected inflation rate: 3%', { anchor: 'middle', size: 16, bold: true });
  b += line(x0, 160, x0 + unit * 7, 160, { stroke: INK, sw: 1.5 }) + line(x0, 152, x0, 168, { sw: 1.5 }) + line(x0 + unit * 7, 152, x0 + unit * 7, 168, { sw: 1.5 });
  b += text(x0 + unit * 3.5, 188, 'Nominal interest rate: 7% (the rate written on the loan)', { anchor: 'middle', size: 15, bold: true });
  b += text(380, 228, 'Real rate = nominal rate - expected inflation rate = 7% - 3% = 4%', { anchor: 'middle', size: 15, fill: MUTED });
  add('nominal-real-rates', 'nominal-real-rates-split', W, H, 'The nominal interest rate is the real rate plus the expected inflation rate',
    'A bar for a 7 percent nominal interest rate split into two parts: a 4 percent real interest rate, the gain in buying power, and a 3 percent expected inflation rate. The real rate equals the nominal rate minus the expected inflation rate.', b);
}

/* 4.3: M1 inside M2, and what is not money. */
{
  const W = 760, H = 360;
  let b = rect(20, 20, 470, 320, { fill: TINT, stroke: GREEN, sw: 2 });
  b += text(40, 52, 'M2', { bold: true, size: 22, fill: GREEN });
  b += rect(45, 70, 250, 190, { fill: '#FFFFFF', stroke: GREEN, sw: 2 });
  b += text(65, 102, 'M1', { bold: true, size: 22, fill: GREEN });
  b += lines(65, 134, ['Currency held by the public', 'Checkable deposits', 'Savings deposits (counted in', 'M1 since May 2020)'], { size: 14 });
  b += lines(312, 100, ['Plus:', 'Small time deposits', '(certificates of deposit', 'under $100,000)', 'Retail money market', 'funds'], { size: 14 });
  b += text(45, 300, 'M2 is M1 plus less liquid near-monies.', { size: 14, fill: MUTED });
  b += rect(515, 20, 225, 320, { fill: SOFT, stroke: GRID });
  b += text(627, 52, 'Not money', { anchor: 'middle', bold: true, size: 18 });
  b += lines(535, 90, ['Credit cards (a way to', 'borrow money)', '', 'Stocks and bonds', '(financial assets you', 'sell for money first)', '', 'Houses, cars, gold'], { size: 14 });
  add('money-functions', 'money-functions-m1-m2', W, H, 'M1 and M2: what counts as money',
    'Nested boxes. M1, inside M2, holds currency held by the public, checkable deposits and savings deposits, which the Federal Reserve has counted in M1 since May 2020. M2 adds small time deposits under 100,000 dollars and retail money market funds. A separate box lists what is not money: credit cards, stocks and bonds, and houses, cars and gold.', b);
}

/* 4.4: a bank balance sheet (T-account) and its reserves. */
{
  const W = 760, H = 360;
  let b = text(380, 36, 'Quentar Savings Bank (invented), required reserve ratio 0.1', { anchor: 'middle', bold: true, size: 17 });
  b += line(120, 60, 640, 60, { sw: 2.5 }) + line(380, 60, 380, 230, { sw: 2.5 });
  b += text(250, 84, 'Assets', { anchor: 'middle', bold: true, size: 16 }) + text(510, 84, 'Liabilities', { anchor: 'middle', bold: true, size: 16 });
  b += text(140, 120, 'Reserves', { size: 15 }) + text(360, 120, '$300', { anchor: 'end', size: 15, bold: true });
  b += text(160, 146, 'required: $100', { size: 14, fill: MUTED }) + text(160, 170, 'excess: $200', { size: 14, fill: GREEN, bold: true });
  b += text(140, 204, 'Loans', { size: 15 }) + text(360, 204, '$700', { anchor: 'end', size: 15, bold: true });
  b += text(400, 120, 'Checkable deposits', { size: 15 }) + text(620, 120, '$1,000', { anchor: 'end', size: 15, bold: true });
  b += rect(60, 252, 640, 90, { fill: SOFT, stroke: GRID });
  b += lines(80, 280, ['Required reserves = $1,000 x 0.1 = $100.  Excess reserves = $300 - $100 = $200.',
    'Most this bank can lend now: its excess reserves, $200.',
    'Most the money supply can grow: $200 x (1 / 0.1) = $2,000.'], { size: 14 });
  add('banking-money-supply', 'banking-money-supply-balance-sheet', W, H, 'A bank balance sheet with required and excess reserves',
    'A T-account for an invented bank with a required reserve ratio of 0.1. Assets: reserves of 300 dollars, of which 100 dollars are required and 200 dollars are excess, and loans of 700 dollars. Liabilities: checkable deposits of 1,000 dollars. Below: required reserves are 1,000 times 0.1, or 100 dollars; excess reserves are 300 minus 100, or 200 dollars; the bank can lend at most 200 dollars; the money supply can grow by at most 200 times 10, or 2,000 dollars.', b);
}

/* 4.5: the money market, money demand shifting right after a rise in the price level. */
{
  const W = 520, H = 400;
  const F = frame(90, 30, 360, 300, 'Quantity of money', 'Nominal interest rate (i)');
  let b = F.body;
  b += line(F.X(5), F.Y(9.6), F.X(5), F.Y(0), { stroke: INK, sw: 2.5 }) + text(F.X(5) + 8, F.Y(9.3), 'MS', { bold: true, size: 15 });
  b += poly(F, [[1, 8], [9, 1.6]], { stroke: INK });
  b += sub(F.X(9) + 4, F.Y(1.6) + 4, 'MD', '1');
  b += poly(F, [[2.4, 9], [10, 2.92]], { stroke: BLUE });
  b += sub(F.X(9.6), F.Y(3.4) - 8, 'MD', '2', { fill: BLUE });
  b += line(F.X(6.6), F.Y(6.2), F.X(7.8), F.Y(7.2), { stroke: VERM, sw: 2.5, arrow: 'arrV' });
  b += guides(F, 5, 4.8, null, ['i', '1']) + guides(F, 5, 6.92, null, ['i', '2'], BLUE);
  b += dot(F.X(5), F.Y(4.8)) + dot(F.X(5), F.Y(6.92), BLUE);
  b += sub(F.X(5), F.Y(0) + 18, 'Q', 'M', { anchor: 'middle', size: 14 });
  add('money-market', 'money-market-md-shift', W, H, 'The money market: a rise in money demand raises the nominal interest rate',
    'A money market graph. The vertical axis is the nominal interest rate and the horizontal axis is the quantity of money. The money supply curve MS is vertical. Money demand shifts right from MD1 to MD2, so the equilibrium nominal interest rate rises from i1 to i2 while the quantity of money stays the same.', b);
}

/* 4.6: the two frameworks side by side. */
{
  const W = 900, H = 445;
  let b = text(225, 30, 'Limited reserves: buy bonds', { anchor: 'middle', bold: true, size: 17 }) + text(675, 30, 'Ample reserves: lower interest on reserves', { anchor: 'middle', bold: true, size: 17 });
  // money market
  const F = frame(80, 60, 320, 280, 'Quantity of money', 'Nominal interest rate (i)');
  b += F.body + poly(F, [[1, 9], [9.5, 0.5]], { stroke: INK }) + text(F.X(9.5) - 4, F.Y(0.5) - 14, 'MD', { bold: true, size: 15, anchor: 'end' });
  b += line(F.X(4), F.Y(9.6), F.X(4), F.Y(0), { sw: 2.5 }) + sub(F.X(4) - 6, F.Y(9.3), 'MS', '1', { anchor: 'end' });
  b += line(F.X(6), F.Y(9.6), F.X(6), F.Y(0), { sw: 2.5, stroke: BLUE }) + sub(F.X(6) + 6, F.Y(9.3), 'MS', '2', { fill: BLUE });
  b += line(F.X(4.3), F.Y(8.2), F.X(5.7), F.Y(8.2), { stroke: VERM, sw: 2.5, arrow: 'arrV' });
  b += guides(F, 4, 6, ['Q', '1'], ['i', '1']) + guides(F, 6, 4, ['Q', '2'], ['i', '2'], BLUE) + dot(F.X(4), F.Y(6)) + dot(F.X(6), F.Y(4), BLUE);
  // reserve market
  const G = frame(530, 60, 320, 280, 'Quantity of reserves', 'Policy rate');
  const rd = (lvl) => [[1, lvl + 4.5], [4, lvl], [10, lvl]];
  b += G.body + poly(G, rd(5), { stroke: INK }) + poly(G, rd(3), { stroke: BLUE });
  b += sub(G.X(9.8), G.Y(5) - 8, 'D', 'R1', { anchor: 'end' }) + sub(G.X(9.8), G.Y(3) - 8, 'D', 'R2', { anchor: 'end', fill: BLUE });
  b += line(G.X(7), G.Y(9.6), G.X(7), G.Y(0), { sw: 2.5 }) + sub(G.X(7) + 6, G.Y(9.3), 'S', 'R');
  b += line(G.X(8.4), G.Y(4.8), G.X(8.4), G.Y(3.3), { stroke: VERM, sw: 2.5, arrow: 'arrV' });
  b += guides(G, 7, 5, null, ['FFR', '1']) + guides(G, 7, 3, null, ['FFR', '2'], BLUE) + dot(G.X(7), G.Y(5)) + dot(G.X(7), G.Y(3), BLUE);
  b += text(G.X(5.2), G.Y(5) - 12, 'IORB', { size: 13, fill: MUTED, anchor: 'middle' });
  b += sub(G.X(7), G.Y(0) + 18, 'Q', 'R', { anchor: 'middle', size: 14 });
  b += lines(450, 402, ['Limited: more reserves shift MS right and the rate falls.  Ample: reserve supply sits in the flat part,', 'so the rate falls because the administered rates (the flat part) are lowered.'], { anchor: 'middle', size: 14, fill: MUTED });
  add('monetary-policy', 'monetary-policy-two-frameworks', W, H, 'Expansionary monetary policy with limited reserves and with ample reserves',
    'Two graphs. Left, limited reserves: a money market graph with nominal interest rate on the vertical axis and quantity of money on the horizontal axis; buying bonds shifts the vertical money supply right from MS1 to MS2, and the nominal interest rate falls from i1 to i2. Right, ample reserves: a reserve market graph with the policy rate, the federal funds rate, on the vertical axis and the quantity of reserves on the horizontal axis; reserve demand slopes down and then turns flat at the interest on reserve balances; the vertical reserve supply crosses it in the flat part; lowering the administered rates shifts the flat part down from DR1 to DR2, and the federal funds rate falls from FFR1 to FFR2 while the quantity of reserves is unchanged.', b);
}

/* 4.7: government borrowing in the loanable funds market. */
{
  const W = 520, H = 400;
  const F = frame(90, 30, 360, 300, 'Quantity of loanable funds', 'Real interest rate (r)');
  let b = F.body;
  b += poly(F, [[1, 1], [9, 9]], { stroke: INK }) + sub(F.X(9) + 4, F.Y(9) + 4, 'S', 'LF');
  b += poly(F, [[1, 9], [9, 1]], { stroke: INK }) + sub(F.X(9) + 4, F.Y(1) + 4, 'D', 'LF1');
  b += poly(F, [[2.6, 9.4], [10, 2]], { stroke: BLUE }) + sub(F.X(9.6), F.Y(2.4) - 10, 'D', 'LF2', { fill: BLUE, anchor: 'end' });
  b += line(F.X(3), F.Y(7), F.X(4.2), F.Y(7.6), { stroke: VERM, sw: 2.5, arrow: 'arrV' });
  b += guides(F, 5, 5, ['Q', '1'], ['r', '1']) + guides(F, 6, 6, ['Q', '2'], ['r', '2'], BLUE) + dot(F.X(5), F.Y(5)) + dot(F.X(6), F.Y(6), BLUE);
  add('loanable-funds', 'loanable-funds-government-borrowing', W, H, 'Loanable funds: more government borrowing raises the real interest rate',
    'A loanable funds graph. The vertical axis is the real interest rate and the horizontal axis is the quantity of loanable funds. Supply SLF slopes up and demand DLF1 slopes down. More government borrowing shifts demand right to DLF2, so the real interest rate rises from r1 to r2 and the quantity of loanable funds rises from Q1 to Q2.', b);
}

mkdirSync(REG, { recursive: true });
for (const [topic, entries] of Object.entries(figs)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`Wrote ${Object.values(figs).reduce((n, e) => n + Object.keys(e).length, 0)} figures for ${Object.keys(figs).length} topics.`);
