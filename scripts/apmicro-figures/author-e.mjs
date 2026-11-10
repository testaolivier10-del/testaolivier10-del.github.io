#!/usr/bin/env node
/* AP® Microeconomics figures for author E (Units 5 and 6): standalone SVG
   diagrams written to microeconomics/figures/<id>.svg and registered in
   microeconomics/data/figures/<topic>.json. Every graph is labeled as the
   authoring guide asks: both axes by name, every curve, the prices, wages and
   quantities on the axes, shaded areas named in the caption. Curves use the
   graph engine's own coordinates (0-10, slopes of 1 and 2, the engine's cubic
   cost model for a monopoly), so a figure and a graded graph of the same kind
   agree. Numbers in the tables are invented for practice.
   Run: node scripts/apmicro-figures/author-e.mjs
   Style: white background, role="img" with <title> and <desc>, Arial,
   ink #1F2A28, the course accent #7E1A5E, Okabe-Ito vermillion #D55E00 and
   blue #0072B2 as second colors. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'microeconomics', 'figures');
const REG = join(ROOT, 'microeconomics', 'data', 'figures');
const INK = '#1F2A28', ACC = '#7E1A5E', VER = '#D55E00', BLU = '#0072B2', GREY = '#6B7672';
const TINT = '#F8E6F1', VTINT = '#FBE3D2', BTINT = '#DDEBF7', NTINT = '#F2F4F3';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = v => Math.round(v * 10) / 10;
function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="Arial, Helvetica, sans-serif">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${[['ar', INK], ['arA', ACC], ['arV', VER], ['arB', BLU]].map(([n, c]) => `<marker id="${id}-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
function text(x, y, s, { size = 14, weight = 'normal', fill = INK, anchor = 'middle', italic = false } = {}) {
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''}>${s}</text>`;
}
// A label with a subscript: lab('W', 'M').
const lab = (main, sub) => esc(main) + (sub ? `<tspan font-size="10" dy="4">${esc(sub)}</tspan>` : '');
function box(x, y, w, h, { fill = NTINT, stroke = INK, sw = 2, rx = 8 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function arrow(id, x1, y1, x2, y2, { color = 'ar', stroke = INK, sw = 2.2, dash = '' } = {}) {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#${id}-${color})"/>`;
}

/* A graph panel: data 0-10 on both axes (or xmax, ymax), mapped into a box. */
function panel(id, ox, oy, w, h, { x: xl, y: yl, title, xmax = 10, ymax = 10 }) {
  const X = v => ox + v / xmax * w, Y = v => oy + h - v / ymax * h;
  const out = [];
  if (title) out.push(text(ox + w / 2, oy - 16, esc(title), { size: 15, weight: 'bold' }));
  out.push(`<path d="M${ox} ${oy}V${oy + h}H${ox + w}" fill="none" stroke="${INK}" stroke-width="2"/>`);
  out.push(text(ox + w, oy + h + 40, esc(xl), { size: 13, anchor: 'end' }));
  out.push(`<text transform="translate(${ox - 40} ${oy}) rotate(-90)" font-size="13" fill="${INK}" text-anchor="end">${esc(yl)}</text>`);
  const api = {
    X, Y,
    fn(f, a, b, { stroke = INK, sw = 2.6, dash = '', n = 60 } = {}) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n, v = f(x); if (v == null || v < 0 || v > ymax) continue; pts.push(`${r1(X(x))} ${r1(Y(v))}`); }
      out.push(`<path d="M${pts.join('L')}" fill="none" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      return api;
    },
    line(x1, y1, x2, y2, { stroke = INK, sw = 2.6, dash = '' } = {}) { out.push(`<line x1="${r1(X(x1))}" y1="${r1(Y(y1))}" x2="${r1(X(x2))}" y2="${r1(Y(y2))}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`); return api; },
    poly(pts, fill, { stroke = 'none', opacity = 1 } = {}) { out.push(`<path d="M${pts.map(p => `${r1(X(p[0]))} ${r1(Y(p[1]))}`).join('L')}Z" fill="${fill}" stroke="${stroke}" fill-opacity="${opacity}"/>`); return api; },
    // Dashed guides from a point to both axes, with the axis marks.
    guide(x, y, xm, ym, { color = GREY, dot = true } = {}) {
      out.push(`<path d="M${r1(X(0))} ${r1(Y(y))}H${r1(X(x))}V${r1(Y(0))}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="5 4"/>`);
      if (dot) out.push(`<circle cx="${r1(X(x))}" cy="${r1(Y(y))}" r="4.5" fill="${INK}"/>`);
      if (xm) out.push(text(X(x), Y(0) + 20, xm, { size: 13 }));
      if (ym) out.push(text(X(0) - 8, Y(y) + 5, ym, { size: 13, anchor: 'end' }));
      return api;
    },
    dot(x, y, fill = INK) { out.push(`<circle cx="${r1(X(x))}" cy="${r1(Y(y))}" r="4.5" fill="${fill}"/>`); return api; },
    label(x, y, s, o = {}) { out.push(text(X(x), Y(y), s, { size: 14, weight: 'bold', ...o })); return api; },
    note(x, y, s, o = {}) { out.push(text(X(x), Y(y), s, { size: 12, ...o })); return api; },
    arrow(x1, y1, x2, y2, o = {}) { out.push(arrow(id, X(x1), Y(y1), X(x2), Y(y2), o)); return api; },
    raw(s) { out.push(s); return api; },
    done() { return out.join('\n'); }
  };
  return api;
}

// The engine's straight curves: down through (at, 5) with slope -1, up with slope +1.
const down = at => x => 5 - (x - at);
const up = at => x => 5 + (x - at);

const figs = {};      // topic -> { id: registration }
function add(topic, id, w, h, title, alt, body) {
  writeFileSync(join(OUT, `${id}.svg`), svg(id, w, h, title, alt, body));
  (figs[topic] = figs[topic] || {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

mkdirSync(OUT, { recursive: true });
mkdirSync(REG, { recursive: true });

/* ---------------------------------------------- 5.1 factor-markets */
{
  const id = 'factor-markets-flow', W = 780, H = 380;
  const b = [];
  b.push(box(40, 150, 170, 80, { fill: TINT, stroke: ACC }), text(125, 186, 'Households', { size: 16, weight: 'bold' }), text(125, 208, 'buy goods, sell factors', { size: 12 }));
  b.push(box(570, 150, 170, 80, { fill: TINT, stroke: ACC }), text(655, 186, 'Firms', { size: 16, weight: 'bold' }), text(655, 208, 'sell goods, buy factors', { size: 12 }));
  b.push(box(300, 28, 180, 70, { fill: BTINT, stroke: BLU }), text(390, 60, 'Product market', { size: 15, weight: 'bold' }), text(390, 80, 'bread, haircuts, bikes', { size: 12 }));
  b.push(box(300, 282, 180, 70, { fill: VTINT, stroke: VER }), text(390, 314, 'Factor market', { size: 15, weight: 'bold' }), text(390, 334, 'labor, land, capital', { size: 12 }));
  // Real flows (solid): goods from firms to households; factors from households to firms.
  b.push(arrow(id, 600, 145, 485, 75, { color: 'arB', stroke: BLU }), text(555, 102, 'goods and services', { size: 12, fill: BLU, anchor: 'start' }));
  b.push(arrow(id, 300, 75, 185, 145, { color: 'arB', stroke: BLU }));
  b.push(arrow(id, 185, 235, 300, 310, { color: 'arV', stroke: VER }), text(236, 304, 'labor, land, capital', { size: 12, fill: VER, anchor: 'end' }));
  b.push(arrow(id, 485, 310, 600, 235, { color: 'arV', stroke: VER }));
  // Money flows (dashed): spending and revenue; wages, rent and interest as income.
  b.push(arrow(id, 215, 160, 320, 100, { dash: '6 4' }), text(212, 128, 'spending', { size: 12, anchor: 'end' }));
  b.push(arrow(id, 460, 100, 565, 160, { dash: '6 4' }), text(538, 124, 'revenue', { size: 12, anchor: 'start' }));
  b.push(arrow(id, 565, 222, 460, 282, { dash: '6 4' }), text(560, 270, 'wages, rent, interest', { size: 12, anchor: 'start' }));
  b.push(arrow(id, 320, 282, 215, 222, { dash: '6 4' }), text(230, 262, 'income', { size: 12, anchor: 'end' }));
  b.push(text(390, 190, 'Solid: goods and factors', { size: 12, fill: GREY }), text(390, 208, 'Dashed: money', { size: 12, fill: GREY }));
  add('factor-markets', id, W, H, 'Product markets and factor markets',
    'Households buy goods and services from firms in the product market and sell labor, land and capital to firms in the factor market. Money flows the other way: spending becomes firms\' revenue, and wages, rent and interest become households\' income.', b.join('\n'));
}
{
  const id = 'factor-markets-mrp', W = 800, H = 400;
  const rows = [[1, 20, 20, 60], [2, 36, 16, 48], [3, 48, 12, 36], [4, 56, 8, 24], [5, 60, 4, 12]];
  const b = [];
  b.push(text(190, 34, 'Juniper Bakery (invented data)', { size: 15, weight: 'bold' }));
  const cols = ['Workers', 'Loaves (TP)', 'MP', 'MRP at $3'], cx = [50, 140, 220, 300];
  b.push(`<rect x="22" y="52" width="340" height="34" fill="${TINT}"/>`);
  cols.forEach((c, i) => b.push(text(cx[i] + 20, 74, esc(c), { size: 13, weight: 'bold' })));
  rows.forEach((r, j) => { const yy = 112 + j * 40; if (j % 2) b.push(`<rect x="22" y="${yy - 25}" width="340" height="40" fill="${NTINT}"/>`); r.forEach((v, i) => b.push(text(cx[i] + 20, yy, i === 3 ? '$' + v : String(v), { size: 14 }))); });
  b.push(text(192, 330, 'MP = change in loaves from one more worker', { size: 12 }), text(192, 350, 'MRP = MP × MR = MP × $3 (each loaf sells for $3)', { size: 12 }));
  const p = panel(id, 470, 50, 290, 270, { x: 'Quantity of labor (workers)', y: 'Dollars', xmax: 6, ymax: 70 });
  for (const [l, , , m] of rows) p.raw(`<rect x="${r1(p.X(l) - 14)}" y="${r1(p.Y(m))}" width="28" height="${r1(p.Y(0) - p.Y(m))}" fill="${TINT}" stroke="${ACC}" stroke-width="1.5"/>`);
  p.fn(x => 72 - 12 * x, 0.5, 5.6, { stroke: ACC, sw: 3 });
  for (const [l, , , m] of rows) p.dot(l, m, ACC);
  for (const [l] of rows) p.note(l, -7, String(l), { size: 12 });
  for (const v of [20, 40, 60]) p.note(-0.15, v - 2, '$' + v, { size: 12, anchor: 'end' });
  p.label(4.3, 40, 'MRP', { fill: ACC, anchor: 'start' });
  p.note(4.3, 34, "(the firm's demand", { anchor: 'start' }).note(4.3, 29, 'curve for labor)', { anchor: 'start' });
  b.push(p.done());
  add('factor-markets', id, W, H, 'Marginal revenue product falls as workers are added',
    'A table for an invented bakery: 1 to 5 workers make 20, 36, 48, 56 and 60 loaves, so the marginal product falls from 20 to 16, 12, 8 and 4 loaves. At $3 a loaf the marginal revenue product is $60, $48, $36, $24 and $12. A bar graph beside it shows MRP falling with each worker; the MRP curve is the firm\'s demand curve for labor.', b.join('\n'));
}

/* ---------------------------------------------- 5.2 factor-demand-supply */
{
  const id = 'factor-demand-supply-shifts', W = 800, H = 400;
  const b = [];
  const L = panel(id, 80, 50, 280, 270, { x: 'Quantity of labor', y: 'Wage', title: 'Labor demand increases' });
  L.fn(up(5), 1, 9, { stroke: BLU }).fn(down(5), 1, 9, { stroke: ACC }).fn(down(7), 3, 9.8, { stroke: ACC, dash: '8 5' });
  L.guide(5, 5, lab('Q', '1'), lab('W', '1')).guide(6, 6, '', '').label(8.4, 0.6, lab('D', 'L1'), { fill: ACC, anchor: 'end' }).label(9.8, 2.6, lab('D', 'L2'), { fill: ACC, anchor: 'start' }).label(9.1, 9.3, lab('S', 'L'), { fill: BLU, anchor: 'start' });
  L.note(6, -0.75, lab('Q', '2'), { size: 13 }).note(-0.15, 6.45, lab('W', '2'), { size: 13, anchor: 'end' });
  L.arrow(2.4, 7.6, 4.2, 7.6, { color: 'arA', stroke: ACC });
  b.push(L.done());
  const R = panel(id, 490, 50, 280, 270, { x: 'Quantity of labor', y: 'Wage', title: 'Labor supply decreases' });
  R.fn(down(5), 1, 9, { stroke: ACC }).fn(up(5), 1, 9, { stroke: BLU }).fn(up(3), 0.2, 7.6, { stroke: BLU, dash: '8 5' });
  R.guide(5, 5, lab('Q', '1'), lab('W', '1')).guide(4, 6, '', '').label(9.1, 1.4, lab('D', 'L'), { fill: ACC, anchor: 'start' }).label(9.1, 9.3, lab('S', 'L1'), { fill: BLU, anchor: 'start' }).label(7.4, 9.8, lab('S', 'L2'), { fill: BLU, anchor: 'end' });
  R.note(4, -0.75, lab('Q', '2'), { size: 13 }).note(-0.15, 6.45, lab('W', '2'), { size: 13, anchor: 'end' });
  R.arrow(4.4, 2.4, 2.6, 2.4, { color: 'arB', stroke: BLU });
  b.push(R.done());
  add('factor-demand-supply', id, W, H, 'Shifts in a labor market',
    'Two labor market graphs with Wage on the vertical axis and Quantity of labor on the horizontal axis. Left: labor demand shifts right from DL1 to DL2, so the wage rises from W1 to W2 and employment rises from Q1 to Q2. Right: labor supply shifts left from SL1 to SL2, so the wage rises from W1 to W2 and employment falls from Q1 to Q2.', b.join('\n'));
}

/* ---------------------------------------------- 5.3 competitive-factor-markets */
{
  const id = 'competitive-factor-markets-side', W = 800, H = 400;
  const b = [];
  const M = panel(id, 80, 50, 280, 270, { x: 'Quantity of labor', y: 'Wage', title: 'Labor market' });
  M.fn(down(5), 1, 9, { stroke: ACC }).fn(up(5), 1, 9, { stroke: BLU }).guide(5, 5, lab('Q', 'M'), lab('W', 'M'));
  M.label(9.1, 1.4, lab('D', 'L'), { fill: ACC, anchor: 'start' }).label(9.1, 9.3, lab('S', 'L'), { fill: BLU, anchor: 'start' });
  b.push(M.done());
  const F = panel(id, 490, 50, 280, 270, { x: 'Quantity of labor', y: 'Wage', title: 'Firm' });
  F.line(0, 5, 10, 5, { stroke: BLU }).fn(down(5), 1, 9, { stroke: ACC }).guide(5, 5, lab('q', 'F'), '');
  F.label(9.95, 5.5, 'S = MFC = W', { fill: BLU, anchor: 'end', size: 13 }).label(9.1, 1.4, 'MRP', { fill: ACC, anchor: 'start' });
  F.note(5.3, 6.8, 'hire where', { anchor: 'start' }).note(5.3, 6.15, 'MRP = MFC', { anchor: 'start', weight: 'bold' });
  b.push(F.done());
  // The wage carried across from the market to the firm.
  b.push(`<line x1="${M.X(5)}" y1="${M.Y(5)}" x2="${F.X(0)}" y2="${F.Y(5)}" stroke="${GREY}" stroke-width="1.5" stroke-dasharray="5 4"/>`);
  add('competitive-factor-markets', id, W, H, 'A competitive labor market and one firm',
    'Side-by-side graphs with Wage on the vertical axis and Quantity of labor on the horizontal axis. In the labor market, DL and SL cross at the market wage WM and quantity QM. The wage is carried across to the firm, where it is a horizontal line labeled S = MFC = W. The firm hires qF workers, where its downward-sloping MRP curve meets that line.', b.join('\n'));
}

/* ---------------------------------------------- 5.4 monopsony */
// The engine's monopsony: SL: w = x + 1, MFC: w = 2x + 1, MRP: w = 10 - x.
const SLm = x => x + 1, MFCm = x => 2 * x + 1, MRPm = x => 10 - x;
{
  const id = 'monopsony-graph', W = 600, H = 430;
  const p = panel(id, 110, 40, 420, 310, { x: 'Quantity of labor', y: 'Wage' });
  p.poly([[0, 0], [3, 0], [3, 4], [0, 4]], TINT);
  p.poly([[3, 4], [3, 7], [4.5, 5.5]], VTINT);
  p.fn(SLm, 0, 8.8, { stroke: BLU }).fn(MFCm, 0, 4.4, { stroke: VER }).fn(MRPm, 0.6, 9.6, { stroke: ACC });
  p.raw(`<path d="M${p.X(3)} ${p.Y(7)}V${p.Y(0)}" stroke="${GREY}" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M${p.X(0)} ${p.Y(7)}H${p.X(3)}" stroke="${GREY}" stroke-width="1" stroke-dasharray="2 4"/>`);
  p.guide(3, 4, lab('Q', 'M'), lab('W', 'M')).guide(4.5, 5.5, lab('Q', 'C'), lab('W', 'C'), { color: '#9AA3A0' }).dot(3, 7, VER);
  p.label(8.9, 9.6, lab('S', 'L'), { fill: BLU, anchor: 'start' }).label(4.5, 9.6, 'MFC', { fill: VER, anchor: 'start' }).label(8.3, 2.3, 'MRP', { fill: ACC, anchor: 'start' });
  p.note(2.1, 1.5, 'wage bill', { fill: ACC, weight: 'bold' }).note(3.45, 5.3, 'DWL', { fill: VER, weight: 'bold', size: 11 });
  p.note(0.3, 7.3, 'MRP = MFC', { anchor: 'start', size: 12 });
  add('monopsony', id, W, H, 'A monopsony hires where MRP = MFC and pays the wage on labor supply',
    'A monopsony graph with Wage on the vertical axis and Quantity of labor on the horizontal axis. MFC rises twice as steeply as the labor supply curve SL from the same starting wage. The firm hires QM workers, where MRP crosses MFC, and pays the wage WM read down from that quantity to SL. The wage bill, WM times QM, is the shaded rectangle. Under competition the quantity would be QC and the wage WC, where MRP meets SL; the triangle between MRP and SL from QM to QC is the deadweight loss.', p.done());
}
{
  const id = 'monopsony-min-wage', W = 600, H = 430;
  const p = panel(id, 110, 40, 420, 310, { x: 'Quantity of labor', y: 'Wage' });
  p.fn(SLm, 0, 8.8, { stroke: BLU }).fn(MFCm, 0, 4.4, { stroke: VER, dash: '3 4', sw: 2 }).fn(MRPm, 0.6, 9.6, { stroke: ACC });
  // The firm's MFC with a minimum wage of 5: flat at 5 out to SL (4 workers), then the old MFC.
  p.line(0, 5, 4, 5, { stroke: VER, sw: 3.4 }).line(4, 5, 4, 9, { stroke: VER, sw: 1.8, dash: '4 3' }).fn(MFCm, 4, 4.4, { stroke: VER, sw: 3.4 });
  p.guide(3, 4, lab('Q', 'M'), lab('W', 'M'), { color: '#9AA3A0' }).guide(4, 5, lab('Q', 'min'), lab('W', 'min'));
  p.label(8.9, 9.6, lab('S', 'L'), { fill: BLU, anchor: 'start' }).label(4.5, 9.6, 'MFC', { fill: VER, anchor: 'start' }).label(8.3, 2.3, 'MRP', { fill: ACC, anchor: 'start' });
  p.note(0.15, 5.35, 'MFC = minimum wage', { fill: VER, anchor: 'start', weight: 'bold' });
  add('monopsony', id, W, H, 'A minimum wage set between the monopsony wage and the competitive wage',
    'The same monopsony graph with a minimum wage Wmin set above the monopsony wage WM and below the competitive wage. Up to the labor supply curve, each extra worker now costs exactly Wmin, so the firm\'s MFC is flat at Wmin. The firm hires Qmin workers, where the flat MFC reaches labor supply, which is more than QM, and every worker earns the higher wage Wmin.', p.done());
}

/* ---------------------------------------------- 6.1 market-efficiency */
{
  const id = 'market-efficiency-dwl', W = 800, H = 400;
  const b = [];
  const L = panel(id, 80, 50, 280, 270, { x: 'Quantity', y: 'Price', title: 'Too little is made' });
  L.poly([[3, 3], [3, 7], [5, 5]], VTINT);
  L.fn(down(5), 1, 9, { stroke: ACC }).fn(up(5), 1, 9, { stroke: BLU }).guide(5, 5, 'Q*', 'P*');
  L.raw(`<path d="M${L.X(3)} ${L.Y(7)}V${L.Y(0)}" stroke="${GREY}" stroke-width="1.5" stroke-dasharray="5 4"/>`).note(3, -0.75, lab('Q', '1'), { size: 13 });
  L.label(9.1, 1.4, 'D = MSB', { fill: ACC, anchor: 'end', size: 13 }).label(9.1, 9.3, 'S = MSC', { fill: BLU, anchor: 'start', size: 13 }).note(3.7, 4.85, 'DWL', { weight: 'bold', fill: VER, size: 12 });
  b.push(L.done());
  const R = panel(id, 490, 50, 280, 270, { x: 'Quantity', y: 'Price', title: 'Too much is made' });
  R.poly([[5, 5], [7, 7], [7, 3]], VTINT);
  R.fn(down(5), 1, 9, { stroke: ACC }).fn(up(5), 1, 9, { stroke: BLU }).guide(5, 5, 'Q*', 'P*');
  R.raw(`<path d="M${R.X(7)} ${R.Y(7)}V${R.Y(0)}" stroke="${GREY}" stroke-width="1.5" stroke-dasharray="5 4"/>`).note(7, -0.75, lab('Q', '2'), { size: 13 });
  R.label(9.1, 1.4, 'D = MSB', { fill: ACC, anchor: 'end', size: 13 }).label(9.1, 9.3, 'S = MSC', { fill: BLU, anchor: 'start', size: 13 }).note(6.3, 4.85, 'DWL', { weight: 'bold', fill: VER, size: 12 });
  b.push(R.done());
  add('market-efficiency', id, W, H, 'Deadweight loss on either side of the efficient quantity',
    'Two graphs with Price on the vertical axis and Quantity on the horizontal axis, each with D = MSB sloping down and S = MSC sloping up, crossing at the efficient quantity Q* and price P*. Left: only Q1, less than Q*, is made, and the triangle between MSB and MSC from Q1 to Q* is deadweight loss. Right: Q2, more than Q*, is made, and the triangle between MSC and MSB from Q* to Q2 is deadweight loss. Both triangles point toward Q*.', b.join('\n'));
}

/* ---------------------------------------------- 6.2 externalities */
{
  const id = 'externalities-negative', W = 600, H = 430;
  const p = panel(id, 110, 40, 420, 310, { x: 'Quantity', y: 'Price' });
  p.poly([[4, 6], [5, 7], [5, 5]], VTINT);
  p.fn(down(5), 1, 9, { stroke: ACC }).fn(up(5), 1, 9, { stroke: BLU }).fn(up(3), 0.4, 7.6, { stroke: VER });
  p.guide(5, 5, lab('Q', 'M'), lab('P', 'M')).guide(4, 6, lab('Q', 'E'), lab('P', 'E'));
  p.label(5.6, 0.45, 'D = MPB = MSB', { fill: ACC, anchor: 'start', size: 13 }).label(9.1, 9.3, 'S = MPC', { fill: BLU, anchor: 'start', size: 13 }).label(7.7, 9.85, 'MSC', { fill: VER, anchor: 'start', size: 13 });
  p.line(4.68, 6.05, 2.4, 8.3, { stroke: VER, sw: 1.2 }).note(2.3, 8.45, 'DWL', { weight: 'bold', fill: VER, size: 13, anchor: 'end' });
  // The marginal external cost: the vertical gap between MPC and MSC.
  p.raw(`<path d="M${p.X(6)} ${p.Y(6)}V${p.Y(8)}" stroke="${INK}" stroke-width="1.5"/><path d="M${p.X(5.85)} ${p.Y(6)}H${p.X(6.15)}M${p.X(5.85)} ${p.Y(8)}H${p.X(6.15)}" stroke="${INK}" stroke-width="1.5"/>`);
  p.note(5.85, 9.0, 'external cost per unit', { anchor: 'end', size: 12 });
  add('externalities', id, W, H, 'A negative production externality: the market makes too much',
    'An externality graph with Price on the vertical axis and Quantity on the horizontal axis. D = MPB = MSB slopes down. S = MPC slopes up, and MSC lies above it by the external cost per unit. The market produces QM at price PM, where MPB = MPC. The efficient quantity QE, where MSB = MSC, is smaller and its price PE higher. The deadweight loss is the shaded triangle between MSC and MSB from QE to QM, pointing toward QE.', p.done());
}
{
  const id = 'externalities-positive', W = 600, H = 430;
  const p = panel(id, 110, 40, 420, 310, { x: 'Quantity', y: 'Price' });
  p.poly([[5, 5], [5, 7], [6, 6]], VTINT);
  p.fn(down(5), 1, 9, { stroke: ACC }).fn(down(7), 2.4, 9.6, { stroke: VER }).fn(up(5), 1, 9, { stroke: BLU });
  p.guide(5, 5, lab('Q', 'M'), lab('P', 'M')).guide(6, 6, lab('Q', 'E'), lab('P', 'E'));
  p.label(9.1, 1.4, 'D = MPB', { fill: ACC, anchor: 'end', size: 13 }).label(9.6, 2.9, 'MSB', { fill: VER, anchor: 'start', size: 13 }).label(1.4, 0.45, 'S = MPC = MSC', { fill: BLU, anchor: 'start', size: 13 });
  p.line(5.35, 6.05, 7.2, 8.3, { stroke: VER, sw: 1.2 }).note(7.2, 8.45, 'DWL', { weight: 'bold', fill: VER, size: 13, anchor: 'start' });
  p.raw(`<path d="M${p.X(3)} ${p.Y(7)}V${p.Y(9)}" stroke="${INK}" stroke-width="1.5"/><path d="M${p.X(2.85)} ${p.Y(7)}H${p.X(3.15)}M${p.X(2.85)} ${p.Y(9)}H${p.X(3.15)}" stroke="${INK}" stroke-width="1.5"/>`);
  p.note(3.25, 9.6, 'external benefit per unit', { anchor: 'start', size: 12 });
  add('externalities', id, W, H, 'A positive consumption externality: the market makes too little',
    'An externality graph with Price on the vertical axis and Quantity on the horizontal axis. D = MPB slopes down, and MSB lies above it by the external benefit per unit. S = MPC = MSC slopes up. The market produces QM at PM, where MPB = MPC; the efficient quantity QE, where MSB = MSC, is larger. The deadweight loss is the shaded triangle between MSB and MSC from QM to QE.', p.done());
}

/* ---------------------------------------------- 6.3 public-goods */
{
  const id = 'public-goods-grid', W = 700, H = 400;
  const b = [];
  const x0 = 170, y0 = 70, cw = 255, ch = 140;
  b.push(text(x0 + cw / 2, 52, 'Rival', { size: 15, weight: 'bold' }), text(x0 + cw * 1.5, 52, 'Nonrival', { size: 15, weight: 'bold' }));
  b.push(text(x0 - 14, y0 + ch / 2 + 5, 'Excludable', { size: 15, weight: 'bold', anchor: 'end' }), text(x0 - 14, y0 + ch * 1.5 + 5, 'Nonexcludable', { size: 15, weight: 'bold', anchor: 'end' }));
  const cells = [
    [0, 0, 'Private good', ['a sandwich, a bike,', 'a pair of shoes'], TINT, ACC],
    [1, 0, 'Club good', ['a streaming service,', 'an uncrowded toll road'], BTINT, BLU],
    [0, 1, 'Common resource', ['fish in the ocean,', 'a shared pasture'], VTINT, VER],
    [1, 1, 'Public good', ['national defense,', 'a flood wall'], NTINT, INK]
  ];
  for (const [c, r, name, ex, fill, stroke] of cells) {
    const x = x0 + c * cw, y = y0 + r * ch;
    b.push(box(x + 4, y + 4, cw - 8, ch - 8, { fill, stroke, rx: 10 }), text(x + cw / 2, y + 46, esc(name), { size: 17, weight: 'bold' }));
    ex.forEach((e, i) => b.push(text(x + cw / 2, y + 78 + i * 20, esc(e), { size: 13 })));
  }
  b.push(text(x0 + cw, 375, 'Rival: one person\'s use leaves less for others. Excludable: nonpayers can be kept out.', { size: 12, fill: GREY }));
  add('public-goods', id, W, H, 'Four kinds of goods, by rivalry and excludability',
    'A two-by-two grid. Columns: rival and nonrival. Rows: excludable and nonexcludable. Rival and excludable: private goods, such as a sandwich or a bike. Nonrival and excludable: club goods, such as a streaming service. Rival and nonexcludable: common resources, such as fish in the ocean. Nonrival and nonexcludable: public goods, such as national defense or a flood wall.', b.join('\n'));
}

/* ---------------------------------------------- 6.4 intervention-structures */
{
  // The engine's natural monopoly: D: P = 10 - Q, MR: 10 - 2Q, MC = 2, ATC = 2 + 12/Q.
  const id = 'intervention-structures-natural', W = 600, H = 430;
  const p = panel(id, 110, 40, 420, 310, { x: 'Quantity', y: 'Price and cost' });
  p.fn(x => 10 - x, 0, 9.6, { stroke: ACC }).fn(x => 10 - 2 * x, 0, 5, { stroke: ACC, dash: '8 5' }).line(0, 2, 10, 2, { stroke: BLU }).fn(x => 2 + 12 / x, 1.25, 10, { stroke: VER });
  p.guide(4, 6, lab('Q', 'M'), lab('P', 'M')).guide(6, 4, lab('Q', 'F'), lab('P', 'F')).guide(8, 2, lab('Q', 'S'), lab('P', 'S'));
  p.label(9.3, 1.3, 'D', { fill: ACC, anchor: 'start' }).label(4.7, 1.0, 'MR', { fill: ACC, anchor: 'start' }).label(9.95, 2.3, 'MC', { fill: BLU, anchor: 'end' }).label(9.95, 3.6, 'ATC', { fill: VER, anchor: 'end' });
  p.note(4.15, 6.45, 'unregulated', { anchor: 'start', size: 12 }).note(6.15, 4.6, 'fair return: P = ATC', { anchor: 'start', size: 12 }).note(8.1, 2.65, 'P = MC', { anchor: 'start', size: 12 });
  add('intervention-structures', id, W, H, 'Three prices for a natural monopoly',
    'A natural monopoly graph with Price and cost on the vertical axis and Quantity on the horizontal axis. ATC falls over the whole range of demand and stays above the flat MC curve. Unregulated, the firm produces QM where MR = MC and charges PM from the demand curve. The fair-return price PF, where demand meets ATC, gives a larger quantity QF and zero economic profit. The socially optimal price PS, where demand meets MC, gives the largest quantity QS, but there price is below ATC, so the firm makes a loss.', p.done());
}
{
  // The engine's monopoly cost model (COST.monopoly in mic-graph.js), so MC passes through the minimum of ATC.
  const qv = 2, vmin = 2.5, qa = 3.5, amin = 4;
  const c = (amin - vmin) / ((qa - qv) ** 2 + 2 * qa * (qa - qv)), bb = 2 * c * qv, a = vmin + c * qv * qv, F = 2 * c * qa * qa * (qa - qv);
  const MC = q => a - 2 * bb * q + 3 * c * q * q, ATC = q => a - bb * q + c * q * q + F / q;
  const root = (f, lo, hi) => { for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; };
  const qm = root(q => (10 - 2 * q) - MC(q), 2, 5), pm = 10 - qm, qc = root(q => (10 - q) - MC(q), 2, 6), pc = 10 - qc;
  const id = 'intervention-structures-ceiling', W = 600, H = 430;
  const p = panel(id, 110, 40, 420, 310, { x: 'Quantity', y: 'Price and cost' });
  p.fn(x => 10 - x, 0, 9.6, { stroke: ACC }).fn(x => 10 - 2 * x, 0, 5, { stroke: ACC, dash: '8 5' }).fn(MC, 0.3, 6, { stroke: BLU }).fn(ATC, 0.9, 7.5, { stroke: VER });
  p.line(0, pc, 10, pc, { stroke: INK, sw: 2.4 }).label(9.95, pc + 0.3, lab('P', 'C') + ' = price ceiling', { anchor: 'end', size: 13 });
  p.guide(qm, pm, lab('Q', 'M'), lab('P', 'M')).guide(qc, pc, lab('Q', 'C'), '');
  p.note(-0.15, pc - 0.15, lab('P', 'C'), { size: 13, anchor: 'end' });
  p.label(9.3, 1.3, 'D', { fill: ACC, anchor: 'start' }).label(4.7, 1.0, 'MR', { fill: ACC, anchor: 'start' }).label(6, MC(6) - 0.2, 'MC', { fill: BLU, anchor: 'start' }).label(7.55, ATC(7.5), 'ATC', { fill: VER, anchor: 'start' });
  add('intervention-structures', id, W, H, 'A price ceiling at P = MC on a monopoly raises output',
    'A monopoly graph with Price and cost on the vertical axis and Quantity on the horizontal axis, showing D, MR below it, MC passing through the minimum of ATC, and ATC. Unregulated, the monopoly produces QM where MR = MC and charges PM from demand. A price ceiling PC set where demand meets MC makes the ceiling the firm\'s marginal revenue up to demand, so it produces QC, more than QM, at the lower price PC.', p.done());
}

/* ---------------------------------------------- 6.5 inequality */
{
  const id = 'inequality-lorenz', W = 600, H = 470;
  const p = panel(id, 120, 40, 360, 340, { x: 'Cumulative percentage of households', y: 'Cumulative percentage of income', xmax: 100, ymax: 100 });
  const A = [[0, 0], [20, 8], [40, 22], [60, 40], [80, 62], [100, 100]], B = [[0, 0], [20, 4], [40, 12], [60, 26], [80, 50], [100, 100]];
  p.poly([[0, 0], [100, 100], ...B.slice().reverse()], VTINT, { opacity: 0.8 });
  p.line(0, 0, 100, 100, { stroke: INK, sw: 2.2 });
  const path = (pts, stroke, dash = '') => p.raw(`<path d="M${pts.map(q => `${r1(p.X(q[0]))} ${r1(p.Y(q[1]))}`).join('L')}" fill="none" stroke="${stroke}" stroke-width="3"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
  path(A, BLU); path(B, ACC);
  for (const q of A.slice(1, 5)) p.dot(q[0], q[1], BLU);
  for (const q of B.slice(1, 5)) p.dot(q[0], q[1], ACC);
  for (const v of [20, 40, 60, 80, 100]) { p.note(v, -6, v + '%', { size: 12 }); p.note(-1.5, v - 1.5, v + '%', { size: 12, anchor: 'end' }); }
  p.label(46, 56, 'Line of equality', { anchor: 'end', size: 13 });
  p.line(64, 15, 71, 15, { stroke: BLU, sw: 3 }).label(73, 13.6, 'Country A', { fill: BLU, anchor: 'start', size: 13 }).line(64, 7, 71, 7, { stroke: ACC, sw: 3 }).label(73, 5.6, 'Country B', { fill: ACC, anchor: 'start', size: 13 });
  add('inequality', id, W, H, 'Lorenz curves for two invented countries',
    'A Lorenz curve graph with Cumulative percentage of households on the horizontal axis and Cumulative percentage of income on the vertical axis, both from 0 to 100 percent. The diagonal is the line of equality. Country A\'s curve passes through 8, 22, 40 and 62 percent of income at 20, 40, 60 and 80 percent of households. Country B\'s curve lies below it, through 4, 12, 26 and 50 percent, so income in Country B is less equally shared. The shaded area between the line of equality and Country B\'s curve is the area the Gini coefficient compares with the whole triangle under the line. Invented data for practice.', p.done());
}

for (const [topic, f] of Object.entries(figs)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(f, null, 1) + '\n');
console.log(`author E figures: ${Object.values(figs).reduce((n, f) => n + Object.keys(f).length, 0)} written for ${Object.keys(figs).length} topics`);
