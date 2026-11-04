/* Figures for AP® Macroeconomics Unit 2 (author B): the circular flow, what
   GDP counts and leaves out, the labor force tree, a market basket and the
   CPI, who gains and loses from unexpected inflation, nominal and real GDP
   around a base year, and the business cycle around potential output. Each
   is a LevlPrep original SVG written to macroeconomics/figures/<id>.svg; the
   registry entries go in macroeconomics/data/figures/<topic>.json.

     node scripts/apmacro-figures/author-b.mjs

   House style (as the other courses' figure scripts): white background,
   Arial/Helvetica, ink #1F2A28, the course green #355A0A for money flows and
   emphasis, cerulean #084F78 for real flows, Okabe-Ito vermillion #D55E00
   for what is left out or lost. Every SVG has role="img", a <title> and a
   <desc>. Every number drawn is computed here from the invented data that
   the notes and lessons use. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'macroeconomics', 'figures');
const DATA = join(ROOT, 'macroeconomics', 'data');
mkdirSync(FIG, { recursive: true });
mkdirSync(join(DATA, 'figures'), { recursive: true });

const INK = '#1F2A28', MUTED = '#5B6664', GREEN = '#355A0A', BLUE = '#084F78', VERM = '#D55E00', PALE = '#F2F4F3', PALEG = '#EEF4E0', PALEV = '#FBEDE3';
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = v => Math.round(v * 10) / 10;

class Fig {
  constructor(id, w, h, title, desc) { Object.assign(this, { id, w, h, title, desc, body: [] }); }
  add(s) { this.body.push(s); return this; }
  text(x, y, s, { size = 14, anchor = 'start', bold = false, color = INK, italic = false } = {}) {
    const lines = [].concat(s), lh = size * 1.25;
    return this.add(`<text x="${r(x)}" y="${r(y)}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${bold ? ' font-weight="bold"' : ''}${italic ? ' font-style="italic"' : ''}>${lines.map((l, i) => `<tspan x="${r(x)}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join('')}</text>`);
  }
  box(x, y, w, h, { fill = PALE, stroke = INK, rx = 8, sw = 2 } = {}) {
    return this.add(`<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
  }
  line(x1, y1, x2, y2, { color = INK, sw = 2, dash, arrow } = {}) {
    return this.add(`<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${color}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}${arrow ? ` marker-end="url(#${this.id}-${arrow})"` : ''}/>`);
  }
  path(d, { color = INK, sw = 2.5, dash, arrow, fill = 'none' } = {}) {
    return this.add(`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}${arrow ? ` marker-end="url(#${this.id}-${arrow})"` : ''} stroke-linejoin="round"/>`);
  }
  svg() {
    const mk = (n, c) => `<marker id="${this.id}-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-labelledby="${this.id}-t ${this.id}-d" font-family="${FONT}">
<title id="${this.id}-t">${esc(this.title)}</title>
<desc id="${this.id}-d">${esc(this.desc)}</desc>
<defs>${mk('ink', INK)}${mk('g', GREEN)}${mk('b', BLUE)}${mk('v', VERM)}</defs>
<rect width="${this.w}" height="${this.h}" fill="#FFFFFF"/>
${this.body.join('\n')}
</svg>
`;
  }
}

const registry = {};
function save(topic, f, alt) {
  writeFileSync(join(FIG, `${f.id}.svg`), f.svg());
  (registry[topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* ============================================ 2.1 the circular flow ===== */
{
  const desc = 'Households on the left and firms on the right. Across the top, in the product market, firms sell goods and services to households and households pay for them with spending, which becomes firms\' revenue. Across the bottom, in the factor market, households sell land, labor, capital and entrepreneurship to firms, and firms pay them income: wages, rent, interest and profit. Money flows run around the outside loop; goods, services and factors run around the inside loop in the opposite direction.';
  const f = new Fig('gdp-circular-flow-diagram', 820, 600, 'The circular flow of a simple economy', desc);
  f.text(410, 30, 'The circular flow: spending on output is someone\'s income', { size: 18, bold: true, anchor: 'middle' });
  const D = 50;
  f.box(30, 215 + D, 200, 90, { fill: PALEG });
  f.text(130, 255 + D, 'Households', { size: 18, bold: true, anchor: 'middle' });
  f.text(130, 278 + D, 'own the factors of production', { size: 12, anchor: 'middle', color: MUTED });
  f.box(590, 215 + D, 200, 90, { fill: PALEG });
  f.text(690, 255 + D, 'Firms', { size: 18, bold: true, anchor: 'middle' });
  f.text(690, 278 + D, 'produce goods and services', { size: 12, anchor: 'middle', color: MUTED });
  f.box(310, 35 + D, 200, 80);
  f.text(410, 70 + D, 'Product market', { size: 17, bold: true, anchor: 'middle' });
  f.text(410, 92 + D, 'goods and services are sold', { size: 12, anchor: 'middle', color: MUTED });
  f.box(310, 405 + D, 200, 80);
  f.text(410, 440 + D, 'Factor market', { size: 17, bold: true, anchor: 'middle' });
  f.text(410, 462 + D, 'land, labor, capital, entrepreneurship', { size: 12, anchor: 'middle', color: MUTED });
  // outer loop: money (green)
  f.path(`M100 ${215 + D} L100 ${55 + D} L306 ${55 + D}`, { color: GREEN, arrow: 'g' });
  f.text(108, 45 + D, 'Spending ($)', { size: 14, bold: true, color: GREEN });
  f.path(`M510 ${55 + D} L720 ${55 + D} L720 ${211 + D}`, { color: GREEN, arrow: 'g' });
  f.text(712, 45 + D, 'Revenue ($)', { size: 14, bold: true, color: GREEN, anchor: 'end' });
  f.path(`M720 ${305 + D} L720 ${465 + D} L514 ${465 + D}`, { color: GREEN, arrow: 'g' });
  f.text(712, 490 + D, 'Payments for factors ($)', { size: 14, bold: true, color: GREEN, anchor: 'end' });
  f.path(`M310 ${465 + D} L100 ${465 + D} L100 ${309 + D}`, { color: GREEN, arrow: 'g' });
  f.text(30, 490 + D, 'Income ($): wages, rent, interest, profit', { size: 14, bold: true, color: GREEN });
  // inner loop: goods, services and factors (blue)
  f.path(`M650 ${215 + D} L650 ${95 + D} L514 ${95 + D}`, { color: BLUE, arrow: 'b', dash: '7 4' });
  f.text(560, 122 + D, ['Goods and', 'services'], { size: 13, color: BLUE });
  f.path(`M310 ${95 + D} L160 ${95 + D} L160 ${211 + D}`, { color: BLUE, arrow: 'b', dash: '7 4' });
  f.text(172, 122 + D, ['Goods and', 'services'], { size: 13, color: BLUE });
  f.path(`M160 ${305 + D} L160 ${425 + D} L306 ${425 + D}`, { color: BLUE, arrow: 'b', dash: '7 4' });
  f.text(172, 385 + D, ['Factors of', 'production'], { size: 13, color: BLUE });
  f.path(`M510 ${425 + D} L650 ${425 + D} L650 ${309 + D}`, { color: BLUE, arrow: 'b', dash: '7 4' });
  f.text(560, 385 + D, ['Factors of', 'production'], { size: 13, color: BLUE });
  // key
  f.line(300, 245 + D, 340, 245 + D, { color: GREEN, sw: 2.5 });
  f.text(348, 250 + D, 'money (outer loop)', { size: 13, color: GREEN });
  f.line(300, 275 + D, 340, 275 + D, { color: BLUE, sw: 2.5, dash: '7 4' });
  f.text(348, 280 + D, 'real things (inner loop)', { size: 13, color: BLUE });
  save('gdp-circular-flow', f, 'Circular flow diagram. In the product market, households spend money on goods and services and firms receive it as revenue. In the factor market, households supply land, labor, capital and entrepreneurship and receive wages, rent, interest and profit as income. Money moves around the outer loop, real goods and factors around the inner loop the other way.');
}

/* ===================================== 2.2 what GDP counts and misses ===== */
{
  const counts = ['New consumer goods and services (C)', 'New capital, new homes, added inventory (I)', 'Government purchases of goods and services (G)', 'Exports minus imports (X − M)'];
  const misses = ['Intermediate goods (already in the final price)', 'Used goods, stocks and bonds', 'Transfer payments such as pensions', 'Unpaid home production and volunteer work', 'Underground (unreported) market activity', 'Leisure, pollution, how income is shared'];
  const desc = 'Two columns. Counted in GDP: ' + counts.join('; ') + '. Left out of GDP or of what it can show: ' + misses.join('; ') + '.';
  const f = new Fig('gdp-limitations-counted', 820, 430, 'What GDP counts and what it leaves out', desc);
  f.text(410, 32, 'What GDP counts, and what it leaves out', { size: 18, bold: true, anchor: 'middle' });
  f.box(30, 55, 360, 350, { fill: PALEG, stroke: GREEN });
  f.text(210, 88, 'Counted in GDP', { size: 17, bold: true, anchor: 'middle', color: GREEN });
  counts.forEach((c, i) => { f.text(52, 130 + i * 52, '✓', { size: 18, bold: true, color: GREEN }); f.text(76, 130 + i * 52, c.length > 40 ? splitAt(c) : c, { size: 14 }); });
  f.box(430, 55, 360, 350, { fill: PALEV, stroke: VERM });
  f.text(610, 88, 'Left out (or hidden) in GDP', { size: 17, bold: true, anchor: 'middle', color: VERM });
  misses.forEach((c, i) => { f.text(452, 125 + i * 46, '✗', { size: 18, bold: true, color: VERM }); f.text(476, 125 + i * 46, c.length > 40 ? splitAt(c) : c, { size: 14 }); });
  save('gdp-limitations', f, 'Two columns. Counted in GDP: new consumer goods and services, new capital and homes and added inventory, government purchases, and exports minus imports. Left out: intermediate goods, used goods and financial assets, transfer payments, unpaid home production and volunteering, underground activity, and leisure, pollution and how income is shared.');
}
function splitAt(s) {
  const mid = s.lastIndexOf(' ', 40);
  return [s.slice(0, mid), s.slice(mid + 1)];
}

/* ===================================== 2.3 the labor force tree ===== */
{
  const desc = 'A tree. The adult population (people 16 and older who are not in an institution or on active military duty) splits into the labor force and people not in the labor force. The labor force splits into employed (including part-time workers) and unemployed (no job, available, and looked for work in the past four weeks). Not in the labor force includes retirees, full-time students, people caring for family at home and discouraged workers. Underneath: unemployment rate equals unemployed divided by the labor force times 100; labor force participation rate equals the labor force divided by the adult population times 100.';
  const f = new Fig('unemployment-labor-force', 820, 470, 'Who counts as unemployed', desc);
  f.text(410, 30, 'Who is in the labor force, and who is unemployed', { size: 18, bold: true, anchor: 'middle' });
  f.box(235, 48, 350, 62);
  f.text(410, 74, 'Adult population', { size: 17, bold: true, anchor: 'middle' });
  f.text(410, 96, '16 and older, not in an institution or the military', { size: 12, anchor: 'middle', color: MUTED });
  f.box(60, 160, 320, 62, { fill: PALEG, stroke: GREEN });
  f.text(220, 186, 'Labor force', { size: 17, bold: true, anchor: 'middle', color: GREEN });
  f.text(220, 207, 'employed + unemployed', { size: 13, anchor: 'middle', color: MUTED });
  f.box(440, 160, 330, 120, { fill: PALEV, stroke: VERM });
  f.text(605, 186, 'Not in the labor force', { size: 17, bold: true, anchor: 'middle', color: VERM });
  f.text(605, 210, ['retirees, full-time students,', 'people caring for family at home,', 'discouraged workers'], { size: 13, anchor: 'middle' });
  f.line(410, 110, 220, 156, { arrow: 'ink' }); f.line(410, 110, 605, 156, { arrow: 'ink' });
  f.box(20, 280, 190, 84);
  f.text(115, 306, 'Employed', { size: 16, bold: true, anchor: 'middle' });
  f.text(115, 328, ['has a job, full-time', 'or part-time'], { size: 12, anchor: 'middle', color: MUTED });
  f.box(230, 280, 190, 84);
  f.text(325, 306, 'Unemployed', { size: 16, bold: true, anchor: 'middle' });
  f.text(325, 328, ['no job, available, and', 'looked in the past 4 weeks'], { size: 12, anchor: 'middle', color: MUTED });
  f.line(220, 222, 115, 276, { arrow: 'ink' }); f.line(220, 222, 325, 276, { arrow: 'ink' });
  f.box(20, 386, 780, 66, { fill: '#FFFFFF', stroke: MUTED, sw: 1.5 });
  f.text(40, 413, 'Unemployment rate = unemployed ÷ labor force × 100', { size: 15, bold: true });
  f.text(40, 438, 'Labor force participation rate = labor force ÷ adult population × 100', { size: 15, bold: true });
  save('unemployment', f, 'A tree diagram. The adult population splits into the labor force and those not in the labor force (retirees, full-time students, people caring for family, discouraged workers). The labor force splits into employed and unemployed. Below: the unemployment rate is unemployed divided by the labor force times 100, and the participation rate is the labor force divided by the adult population times 100.');
}

/* ============================== 2.4 a market basket and the CPI ===== */
const BASKET = [{ year: '2024 (base)', cost: 200 }, { year: '2025', cost: 220 }, { year: '2026', cost: 242 }];
{
  const cpi = BASKET.map(b => Math.round(b.cost / BASKET[0].cost * 1000) / 10);
  const desc = `A bar chart of invented data: the cost of the same market basket was $${BASKET.map(b => b.cost).join(', $')} in ${BASKET.map(b => b.year).join(', ')}. Divided by the base-year cost and multiplied by 100, the consumer price index is ${cpi.join(', ')}. The inflation rate from 2024 to 2025 is 10 percent and from 2025 to 2026 is also 10 percent, even though the index rose 10 points and then 11 points.`;
  const f = new Fig('price-indices-inflation-basket', 820, 460, 'A market basket and the consumer price index', desc);
  f.text(410, 30, 'Same basket, three years: the CPI compares each cost with the base year', { size: 17, bold: true, anchor: 'middle' });
  const X0 = 110, Y0 = 390, H = 300, max = 260;
  f.line(X0, Y0, 760, Y0); f.line(X0, Y0, X0, Y0 - H - 10);
  for (let v = 0; v <= 250; v += 50) { const y = Y0 - v / max * H; f.line(X0 - 5, y, X0, y); f.text(X0 - 9, y + 5, `$${v}`, { size: 12, anchor: 'end', color: MUTED }); if (v) f.line(X0, y, 760, y, { color: '#DDE2E0', sw: 1 }); }
  f.add(`<text x="34" y="${Y0 - H / 2}" font-size="14" text-anchor="middle" fill="${INK}" transform="rotate(-90 34 ${Y0 - H / 2})">Cost of the market basket</text>`);
  f.text(435, Y0 + 50, 'Year (invented data)', { size: 14, anchor: 'middle' });
  BASKET.forEach((b, i) => {
    const x = 170 + i * 200, h = b.cost / max * H;
    f.box(x, Y0 - h, 120, h, { fill: i ? PALEG : PALE, stroke: i ? GREEN : INK, rx: 2 });
    f.text(x + 60, Y0 - h - 30, `$${b.cost}`, { size: 16, bold: true, anchor: 'middle' });
    f.text(x + 60, Y0 - h - 10, `CPI ${cpi[i]}`, { size: 14, bold: true, anchor: 'middle', color: GREEN });
    f.text(x + 60, Y0 + 22, b.year, { size: 14, anchor: 'middle' });
    if (i) {
      const infl = Math.round((cpi[i] - cpi[i - 1]) / cpi[i - 1] * 1000) / 10;
      f.text(x - 40, Y0 - h + 60, [`+${infl}%`, 'inflation'], { size: 13, bold: true, anchor: 'middle', color: VERM });
    }
  });
  save('price-indices-inflation', f, 'Bar chart of invented data: the same market basket cost $200 in 2024, the base year, $220 in 2025 and $242 in 2026, so the CPI is 100, 110 and 121. Inflation is 10 percent each year, although the index rose 10 points and then 11 points.');
}

/* ===================================== 2.5 who gains and who loses ===== */
{
  const rows = [['Borrower with a fixed-rate loan', 'gains', 'loses'], ['Lender or saver at a fixed rate', 'loses', 'gains'], ['Person on a fixed income', 'loses', 'gains'], ['Worker whose pay rises with the CPI', 'about even', 'about even']];
  const desc = 'A table of who gains and who loses when inflation turns out different from what people expected. ' + rows.map(([who, hi, lo]) => `${who}: ${hi} when inflation is higher than expected, ${lo} when it is lower than expected`).join('. ') + '.';
  const f = new Fig('inflation-costs-winners', 820, 360, 'Who gains and who loses from unexpected inflation', desc);
  f.text(410, 30, 'Inflation that people did not expect moves purchasing power', { size: 18, bold: true, anchor: 'middle' });
  const cx = [20, 400, 600], cw = [380, 190, 190];
  f.box(cx[1], 52, cw[1], 60, { fill: PALE, rx: 0, sw: 1.5 }); f.box(cx[2], 52, cw[2], 60, { fill: PALE, rx: 0, sw: 1.5 });
  f.text(cx[1] + 95, 77, ['Inflation higher', 'than expected'], { size: 14, bold: true, anchor: 'middle' });
  f.text(cx[2] + 95, 77, ['Inflation lower', 'than expected'], { size: 14, bold: true, anchor: 'middle' });
  rows.forEach((row, i) => {
    const y = 112 + i * 56;
    f.box(cx[0], y, cw[0], 56, { fill: '#FFFFFF', rx: 0, sw: 1.5 });
    f.text(cx[0] + 16, y + 34, row[0], { size: 15 });
    for (const k of [1, 2]) {
      const v = row[k], col = v === 'gains' ? GREEN : v === 'loses' ? VERM : MUTED, fill = v === 'gains' ? PALEG : v === 'loses' ? PALEV : '#FFFFFF';
      f.box(cx[k], y, cw[k], 56, { fill, rx: 0, sw: 1.5 });
      f.text(cx[k] + 95, y + 34, v, { size: 16, bold: true, anchor: 'middle', color: col });
    }
  });
  f.text(20, 352, 'Anticipated inflation is built into interest rates and contracts, so it moves much less purchasing power.', { size: 13, color: MUTED });
  save('inflation-costs', f, 'Table. When inflation is higher than expected, a borrower with a fixed-rate loan gains, while a lender or saver at a fixed rate and a person on a fixed income lose. When inflation is lower than expected, each result reverses. A worker whose pay rises with the CPI comes out about even either way.');
}

/* ===================================== 2.6 nominal and real GDP ===== */
const GDPYEARS = [{ y: 1, real: 900, defl: 90 }, { y: 2, real: 950, defl: 95 }, { y: 3, real: 1000, defl: 100 }, { y: 4, real: 1040, defl: 106 }, { y: 5, real: 1100, defl: 110 }];
{
  const nom = GDPYEARS.map(d => Math.round(d.real * d.defl / 100 * 10) / 10);
  const desc = `A line chart of invented data over five years, with Year 3 as the base year. Real GDP is ${GDPYEARS.map(d => d.real).join(', ')} billion dollars; the GDP deflator is ${GDPYEARS.map(d => d.defl).join(', ')}; so nominal GDP (real times the deflator divided by 100) is ${nom.join(', ')}. Nominal GDP is below real GDP before the base year, equal to it in the base year, and above it after.`;
  const f = new Fig('real-nominal-gdp-lines', 820, 470, 'Nominal and real GDP cross in the base year', desc);
  f.text(410, 30, 'Nominal and real GDP are equal in the base year', { size: 18, bold: true, anchor: 'middle' });
  const X0 = 120, Y0 = 390, W = 560, H = 310, lo = 750, hi = 1250;
  const px = y => X0 + (y - 1) / 4 * W, py = v => Y0 - (v - lo) / (hi - lo) * H;
  f.line(X0, Y0, X0 + W + 20, Y0); f.line(X0, Y0, X0, Y0 - H - 10);
  for (let v = 800; v <= 1200; v += 100) { f.line(X0 - 5, py(v), X0, py(v)); f.text(X0 - 9, py(v) + 5, `${v}`, { size: 12, anchor: 'end', color: MUTED }); f.line(X0, py(v), X0 + W, py(v), { color: '#DDE2E0', sw: 1 }); }
  GDPYEARS.forEach(d => { f.line(px(d.y), Y0, px(d.y), Y0 + 5); f.text(px(d.y), Y0 + 22, d.y === 3 ? 'Year 3 (base)' : `Year ${d.y}`, { size: 13, anchor: 'middle', bold: d.y === 3 }); });
  f.add(`<text x="40" y="${Y0 - H / 2}" font-size="14" text-anchor="middle" fill="${INK}" transform="rotate(-90 40 ${Y0 - H / 2})">GDP (billions of dollars)</text>`);
  f.text(X0 + W / 2, Y0 + 50, 'Year (invented data)', { size: 14, anchor: 'middle' });
  f.line(px(3), py(lo), px(3), py(hi), { color: MUTED, sw: 1.2, dash: '4 4' });
  f.path('M' + GDPYEARS.map(d => `${r(px(d.y))} ${r(py(d.real))}`).join(' L'), { color: BLUE, sw: 3 });
  f.path('M' + GDPYEARS.map((d, i) => `${r(px(d.y))} ${r(py(nom[i]))}`).join(' L'), { color: GREEN, sw: 3, dash: '9 5' });
  GDPYEARS.forEach((d, i) => { f.add(`<circle cx="${r(px(d.y))}" cy="${r(py(d.real))}" r="4.5" fill="${BLUE}"/><circle cx="${r(px(d.y))}" cy="${r(py(nom[i]))}" r="4.5" fill="${GREEN}"/>`); });
  f.text(px(5) + 12, py(nom[4]) + 5, 'Nominal GDP', { size: 14, bold: true, color: GREEN });
  f.text(px(5) + 12, py(GDPYEARS[4].real) + 5, 'Real GDP', { size: 14, bold: true, color: BLUE });
  f.text(px(1) + 10, py(hi) + 18, ['Before the base year,', 'prices were lower: nominal < real'], { size: 12, color: MUTED });
  f.text(px(3) + 10, py(hi) + 18, ['After the base year,', 'prices are higher: nominal > real'], { size: 12, color: MUTED });
  save('real-nominal-gdp', f, 'Line chart of invented data, Years 1 to 5, base Year 3. Real GDP rises from 900 to 1,100 billion dollars. Nominal GDP rises from 810 to 1,210. The lines cross in Year 3: before it nominal GDP is below real GDP because prices were lower than in the base year, and after it nominal GDP is above real GDP.');
}

/* ===================================== 2.7 the business cycle ===== */
{
  const desc = 'A graph with time on the horizontal axis and real GDP on the vertical axis. A straight dashed line rising to the right is potential output, the economy\'s full-employment output. Actual real GDP is a wavy line around it: it rises in an expansion to a peak, falls in a contraction to a trough, then rises in the next expansion. Where actual output is above potential the gap is shaded and labeled a positive (inflationary) output gap; where it is below potential the gap is labeled a negative (recessionary) output gap.';
  const f = new Fig('business-cycles-phases', 820, 480, 'The business cycle around potential output', desc);
  f.text(410, 30, 'Expansion and contraction around potential output', { size: 18, bold: true, anchor: 'middle' });
  const X0 = 90, Y0 = 410, W = 680, H = 330;
  const pot = t => 120 + 120 * t, act = t => pot(t) + 60 * Math.sin(2 * Math.PI * (t * 1.25 - 0.05));
  const px = t => X0 + t * W, py = v => Y0 - (v - 40) / 300 * H;
  f.line(X0, Y0, X0 + W + 15, Y0, { arrow: 'ink' }); f.line(X0, Y0, X0, Y0 - H - 15, { arrow: 'ink' });
  f.add(`<text x="40" y="${Y0 - H / 2}" font-size="15" text-anchor="middle" fill="${INK}" transform="rotate(-90 40 ${Y0 - H / 2})">Real GDP</text>`);
  f.text(X0 + W, Y0 + 26, 'Time', { size: 15, anchor: 'end' });
  const N = 200, ts = Array.from({ length: N + 1 }, (_, i) => i / N);
  // shade the gaps
  let seg = [], sign = 0;
  const flush = () => { if (seg.length > 2) { const d = 'M' + seg.map(t => `${r(px(t))} ${r(py(act(t)))}`).join(' L') + ' L' + seg.slice().reverse().map(t => `${r(px(t))} ${r(py(pot(t)))}`).join(' L') + ' Z'; f.add(`<path d="${d}" fill="${sign > 0 ? PALEV : '#E3EEF6'}" stroke="none"/>`); } seg = []; };
  for (const t of ts) { const s = Math.sign(act(t) - pot(t)) || sign; if (s !== sign) { flush(); sign = s; } seg.push(t); }
  flush();
  f.path(`M${r(px(0))} ${r(py(pot(0)))} L${r(px(1))} ${r(py(pot(1)))}`, { color: INK, sw: 2.5, dash: '9 6' });
  f.path('M' + ts.map(t => `${r(px(t))} ${r(py(act(t)))}`).join(' L'), { color: GREEN, sw: 3.5 });
  f.text(px(1) - 4, py(pot(1)) + 48, ['Potential output', '(full employment)'], { size: 13, bold: true, anchor: 'end' });
  // peak and trough: the first local maximum and minimum of actual real GDP itself
  const isExt = (i, cmp) => i > 0 && i < N && cmp(act(ts[i]), act(ts[i - 1])) && cmp(act(ts[i]), act(ts[i + 1]));
  const tPeak = ts[ts.findIndex((_, i) => isExt(i, (a, b) => a >= b))], tTrough = ts[ts.findIndex((_, i) => isExt(i, (a, b) => a <= b))];
  f.add(`<circle cx="${r(px(tPeak))}" cy="${r(py(act(tPeak)))}" r="6" fill="${INK}"/><circle cx="${r(px(tTrough))}" cy="${r(py(act(tTrough)))}" r="6" fill="${INK}"/>`);
  f.text(px(tPeak), py(act(tPeak)) - 14, 'Peak', { size: 15, bold: true, anchor: 'middle' });
  f.text(px(tTrough), py(act(tTrough)) + 28, 'Trough', { size: 15, bold: true, anchor: 'middle' });
  f.text(px(0.1), py(act(0.1)) - 26, 'Expansion', { size: 14, bold: true, anchor: 'middle', color: GREEN });
  f.text(px(0.42) + 8, py(act(0.42)) - 12, 'Contraction', { size: 14, bold: true, anchor: 'start', color: VERM });
  f.text(px(0.84), py(act(0.84)) - 30, 'Expansion', { size: 14, bold: true, anchor: 'end', color: GREEN });
  const mid = t => py((pot(t) + act(t)) / 2);
  f.text(px(0.29), mid(0.29) - 2, ['Positive (inflationary)', 'output gap'], { size: 12, anchor: 'middle', color: VERM, bold: true });
  f.text(px(0.62), mid(0.62) - 2, ['Negative (recessionary)', 'output gap'], { size: 12, anchor: 'middle', color: BLUE, bold: true });
  f.text(X0 + 10, Y0 + 52, 'Actual real GDP (solid) rises and falls around potential output (dashed), which grows over time.', { size: 13, color: MUTED });
  save('business-cycles', f, 'Graph of real GDP against time. Potential output is a rising dashed line. Actual real GDP waves around it: an expansion up to a peak, a contraction down to a trough, then another expansion. Output above potential is a positive, or inflationary, output gap; output below potential is a negative, or recessionary, output gap.');
}

for (const [topic, entries] of Object.entries(registry)) writeFileSync(join(DATA, 'figures', `${topic}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`author B figures: ${Object.values(registry).reduce((n, e) => n + Object.keys(e).length, 0)} written`);
