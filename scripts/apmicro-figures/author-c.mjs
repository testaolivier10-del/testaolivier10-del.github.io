/* AP® Microeconomics figures for Unit 3 (author C): production, costs,
   profit and perfect competition. Every cost curve is drawn from the graph
   engine's own cost model (microeconomics/assets/mic-graph.js, COST.firm,
   read through ApMicroGraph.curves and ApMicroGraph.y), so MC passes exactly
   through the minimum of AVC and of ATC, as in every graph a student draws
   on the site. The production table and the profit bars are invented data,
   their numbers computed by ApMicroCalc, and the captions say so.
   Writes
     microeconomics/figures/<id>.svg
     microeconomics/data/figures/<topic>.json   (the registry entries)

     node scripts/apmicro-figures/author-c.mjs

   Style: white background (the page inverts it in dark mode), role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, the course accent
   #7E1A5E for the curve that matters, cerulean #084F78 and vermillion
   #D55E00 for a second curve or a point, grey dashed for a curve before a
   shift or a guide. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Calc, Graph } from '../lib/apmicro-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'microeconomics', 'figures');
const REG = join(ROOT, 'microeconomics', 'data', 'figures');
const INK = '#1F2A28', ACC = '#7E1A5E', CER = '#084F78', VERM = '#D55E00', GREY = '#6B7370', TINT = '#F8E6F1', SKY = '#DCEAF3', WARM = '#FBE6D9';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = v => Math.round(v * 10) / 10;
function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.fill || INK}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.bold) a.push('font-weight="700"');
  if (o.rotate) a.push(`transform="rotate(${o.rotate} ${r1(x)} ${r1(y)})"`);
  // "X_1" draws a subscript.
  const m = String(s).match(/^(.*?)_(\w+)$/);
  const body = m ? `${esc(m[1])}<tspan font-size="${Math.round((o.size || 14) * 0.72)}" dy="4">${esc(m[2])}</tspan>` : esc(s);
  return `<text ${a.join(' ')}>${body}</text>`;
}
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.op ? ` fill-opacity="${o.op}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#${o.arrow})"` : ''}/>`;
const dot = (x, y, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${o.r || 5}" fill="${o.fill || INK}"/>`;
function markers(id) {
  return `<defs>${[['ar', INK], ['arA', ACC], ['arV', VERM], ['arC', CER]].map(([k, c]) => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`;
}
function svgDoc(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">\n<title id="${id}-t">${esc(title)}</title>\n<desc id="${id}-d">${esc(desc)}</desc>\n${markers(id)}<rect width="${w}" height="${h}" fill="#FFFFFF"/>\n${body}\n</svg>\n`;
}

/* A plot frame: graph coordinates 0-xmax and 0-ymax inside a box. */
function frame(x0, y0, w, h, xl, yl, o = {}) {
  const xm = o.xmax || 10, ym = o.ymax || 10;
  const X = v => x0 + v / xm * w, Y = v => y0 + h - v / ym * h;
  const g = [line(x0, y0 - 6, x0, y0 + h, { w: 2 }), line(x0, y0 + h, x0 + w + 6, y0 + h, { w: 2 })];
  g.push(text(x0 + w, y0 + h + (o.xlDy || 38), xl, { anchor: 'end', size: o.size || 14, bold: true }));
  g.push(text(x0 - (o.ylDx || 34), y0, yl, { anchor: 'end', size: o.size || 14, bold: true, rotate: -90 }));
  return { X, Y, g, x0, y0, w, h, xm, ym };
}
// A sampled path of f over [a, b], clipped to the frame's box.
function fpath(F, f, a, b, o = {}) {
  const pts = [];
  for (let i = 0; i <= 160; i++) {
    const x = a + (b - a) * i / 160, v = f(x);
    if (v == null || !Number.isFinite(v) || v > F.ym || v < 0) { if (pts.length && pts[pts.length - 1] !== null) pts.push(null); continue; }
    pts.push(`${r1(F.X(x))} ${r1(F.Y(v))}`);
  }
  const d = pts.reduce((s, p, i) => p === null ? s : s + (i === 0 || pts[i - 1] === null ? 'M' : 'L') + p, '');
  return `<path d="${d}" fill="none" stroke="${o.stroke || ACC}" stroke-width="${o.w || 3}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
const hguide = (F, x, yv, o = {}) => line(F.X(0), F.Y(yv), F.X(x), F.Y(yv), { stroke: o.stroke || GREY, w: 1.4, dash: '5 4' });
const vguide = (F, x, yv, o = {}) => line(F.X(x), F.Y(yv), F.X(x), F.Y(0), { stroke: o.stroke || GREY, w: 1.4, dash: '5 4' });
const ytick = (F, yv, s, o = {}) => text(F.X(0) - 6, F.Y(yv) + 5, s, { anchor: 'end', size: o.size || 13, fill: o.fill || INK, bold: o.bold });
const xtick = (F, x, s, o = {}) => text(F.X(x), F.Y(0) + 18, s, { anchor: 'middle', size: o.size || 13, fill: o.fill || INK, bold: o.bold });
// A shaded polygon from graph points.
const poly = (F, pts, fill, op = 0.55) => `<path d="M${pts.map(p => `${r1(F.X(p[0]))} ${r1(F.Y(p[1]))}`).join('L')}Z" fill="${fill}" fill-opacity="${op}" stroke="none"/>`;

/* The engine's firm cost curves (the same ones every pc and costs graph draws). */
const COSTS = Graph.curves({ kind: 'costs', afc: true }, {});
const cv = id => COSTS.find(c => c.id === id);
const MC = x => Graph.y(cv('MC'), x), ATC = x => Graph.y(cv('ATC'), x), AVC = x => Graph.y(cv('AVC'), x), AFC = x => Graph.y(cv('AFC'), x);
const MIN_ATC = Graph.named({ kind: 'costs' }, {}, 'min-atc'), MIN_AVC = Graph.named({ kind: 'costs' }, {}, 'min-avc');
const qAt = p => Graph.xAt(cv('MC'), p);   // the output where MC meets a price line (rising part of MC)
// The engine's own check that MC passes through both minimums, so a figure never draws it otherwise.
for (const [m, f] of [[MIN_ATC, ATC], [MIN_AVC, AVC]]) if (Math.abs(MC(m[0]) - f(m[0])) > 1e-3) throw new Error('MC does not pass through a minimum: check the cost model');

const figures = {};
function add(topic, id, w, h, title, desc, body, alt) {
  writeFileSync(join(FIG, `${id}.svg`), svgDoc(id, w, h, title, desc, body));
  (figures[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* --------------------------------------------- 3.1 production function */
{
  const L = [0, 1, 2, 3, 4, 5, 6], TP = [0, 10, 24, 36, 44, 48, 48];
  const t = Calc.productTable(L, TP);
  const g = [];
  const A = frame(110, 40, 520, 190, 'Number of workers', 'Total product (loaves)', { xmax: 6, ymax: 50, size: 13, ylDx: 50, xlDy: 34 });
  g.push(text(370, 24, 'Total product', { anchor: 'middle', bold: true, size: 15 }), ...A.g);
  [0, 10, 20, 30, 40, 50].forEach(v => g.push(ytick(A, v, String(v), { size: 12, fill: GREY })));
  L.forEach(l => g.push(xtick(A, l, String(l), { size: 12, fill: GREY })));
  g.push(`<path d="M${L.map((l, i) => `${r1(A.X(l))} ${r1(A.Y(TP[i]))}`).join('L')}" fill="none" stroke="${ACC}" stroke-width="3"/>`);
  L.forEach((l, i) => g.push(dot(A.X(l), A.Y(TP[i]), { fill: ACC, r: 4.5 }), i ? text(A.X(l) + 4, A.Y(TP[i]) - 9, String(TP[i]), { size: 12, fill: ACC, anchor: i === 6 ? 'start' : 'end' }) : ''));
  g.push(text(A.X(5.15), A.Y(36), 'TP', { fill: ACC, bold: true, size: 15 }));
  const B = frame(110, 320, 520, 190, 'Number of workers', 'Product (loaves per worker)', { xmax: 6, ymax: 16, size: 13, ylDx: 50, xlDy: 34 });
  g.push(text(370, 302, 'Marginal and average product', { anchor: 'middle', bold: true, size: 15 }), ...B.g);
  [0, 4, 8, 12, 16].forEach(v => g.push(ytick(B, v, String(v), { size: 12, fill: GREY })));
  L.forEach(l => g.push(xtick(B, l, String(l), { size: 12, fill: GREY })));
  const mpPts = L.slice(1).map(l => [l, t.mp[l]]), apPts = L.slice(1).map(l => [l, t.ap[l]]);
  g.push(rect(B.X(2.5), B.Y(16), B.X(6) - B.X(2.5), B.h, { fill: WARM, op: 0.7 }));
  g.push(text(B.X(4.25), B.Y(15.2), 'Diminishing marginal returns', { anchor: 'middle', size: 12, fill: VERM, bold: true }));
  g.push(text(B.X(1.25), B.Y(15.2), 'MP rising', { anchor: 'middle', size: 12, fill: GREY, bold: true }));
  g.push(`<path d="M${apPts.map(p => `${r1(B.X(p[0]))} ${r1(B.Y(p[1]))}`).join('L')}" fill="none" stroke="${CER}" stroke-width="2.6" stroke-dasharray="8 5"/>`);
  g.push(`<path d="M${mpPts.map(p => `${r1(B.X(p[0]))} ${r1(B.Y(p[1]))}`).join('L')}" fill="none" stroke="${ACC}" stroke-width="3"/>`);
  mpPts.forEach(p => g.push(dot(B.X(p[0]), B.Y(p[1]), { fill: ACC, r: 4.5 })));
  apPts.forEach(p => g.push(dot(B.X(p[0]), B.Y(p[1]), { fill: CER, r: 3.5 })));
  g.push(text(B.X(6) + 8, B.Y(0) + 4, 'MP_L', { fill: ACC, bold: true, size: 15 }), text(B.X(6) + 8, B.Y(t.ap[6]) + 4, 'AP_L', { fill: CER, bold: true, size: 15 }));
  g.push(text(660, 120, 'TP rises by less', { size: 13 }), text(660, 138, 'and less after the', { size: 13 }), text(660, 156, 'second worker, then', { size: 13 }), text(660, 174, 'stops rising.', { size: 13 }));
  g.push(text(660, 380, `MP of the 3rd worker:`, { size: 13 }), text(660, 398, `${TP[3]} - ${TP[2]} = ${t.mp[3]} loaves`, { size: 13, fill: ACC, bold: true }), text(660, 430, 'MP above AP pulls', { size: 13 }), text(660, 448, 'AP up; MP below AP', { size: 13 }), text(660, 466, 'pulls it down.', { size: 13 }));
  add('production-function', 'production-function-tp-mp', 820, 560, 'Total, marginal and average product as workers are added to a fixed kitchen',
    `Top: total product of a bakery with one oven, rising from 0 loaves with no workers to ${TP.slice(1).join(', ')} loaves with 1 to 6 workers. Bottom: marginal product (${t.mp.slice(1).join(', ')} loaves) rises for the first two workers and falls from the third worker on, the shaded range of diminishing marginal returns, reaching 0 for the sixth worker; average product (dashed) rises while marginal product is above it and falls once marginal product is below it. Invented data for practice.`,
    g.join('\n'), `Two graphs for a bakery with one oven. Total product rises from 10 to 48 loaves as workers go from 1 to 5 and stays at 48 for 6 workers. Marginal product is ${t.mp.slice(1).join(', ')} loaves: it rises for the first two workers, then falls, which is diminishing marginal returns; average product is drawn dashed.`);
}

/* ---------------------------------------------- 3.2 short-run costs */
{
  const F = frame(90, 30, 460, 330, 'Quantity of output', 'Cost');
  const g = [...F.g];
  g.push(fpath(F, AFC, 0.6, 10, { stroke: GREY, w: 2.4, dash: '8 5' }), fpath(F, AVC, 0.3, 10, { stroke: CER }), fpath(F, ATC, 0.6, 10, { stroke: VERM }), fpath(F, MC, 0, 10, { stroke: ACC, w: 3.4 }));
  const mcEnd = [...Array(200).keys()].map(i => i / 20).filter(x => MC(x) <= 9.7).pop();
  g.push(text(F.X(mcEnd) + 6, F.Y(MC(mcEnd)) + 4, 'MC', { fill: ACC, bold: true, size: 15 }));
  g.push(text(F.X(10) + 6, F.Y(ATC(10)) + 4, 'ATC', { fill: VERM, bold: true, size: 15 }), text(F.X(10) + 6, F.Y(AVC(10)) + 14, 'AVC', { fill: CER, bold: true, size: 15 }), text(F.X(10) + 6, F.Y(AFC(10)) + 4, 'AFC', { fill: GREY, bold: true, size: 15 }));
  for (const [p, c, n] of [[MIN_AVC, CER, 'min AVC'], [MIN_ATC, VERM, 'min ATC']]) g.push(vguide(F, p[0], p[1]), dot(F.X(p[0]), F.Y(p[1]), { fill: c, r: 6 }));
  g.push(xtick(F, MIN_AVC[0], 'q_1', { fill: CER, bold: true }), xtick(F, MIN_ATC[0], 'q_2', { fill: VERM, bold: true }));
  g.push(text(645, 80, 'MC crosses AVC at', { size: 13, fill: CER, bold: true }), text(645, 98, 'the lowest point of AVC (q1)', { size: 13, fill: CER }));
  g.push(text(645, 136, 'MC crosses ATC at', { size: 13, fill: VERM, bold: true }), text(645, 154, 'the lowest point of ATC (q2)', { size: 13, fill: VERM }));
  g.push(text(645, 196, 'MC below an average', { size: 13 }), text(645, 214, 'pulls it down; MC above', { size: 13 }), text(645, 232, 'an average pulls it up.', { size: 13 }));
  g.push(text(645, 274, 'ATC minus AVC = AFC,', { size: 13, fill: GREY }), text(645, 292, 'which shrinks as output', { size: 13, fill: GREY }), text(645, 310, 'grows.', { size: 13, fill: GREY }));
  add('short-run-costs', 'short-run-costs-curves', 860, 400, 'Short-run cost curves: MC through the lowest points of AVC and ATC',
    'Cost on the vertical axis and quantity of output on the horizontal axis. Marginal cost (MC) dips, then rises steeply; it crosses average variable cost (AVC) at the lowest point of AVC, at output q1, and average total cost (ATC) at the lowest point of ATC, at the larger output q2. Average fixed cost (AFC, dashed) falls as output grows, and the vertical gap between ATC and AVC equals AFC.',
    g.join('\n'), 'A cost graph with MC, ATC, AVC and AFC. MC is U-shaped and rises through the lowest point of AVC at q1 and then through the lowest point of ATC at a larger output q2; AFC slopes down and is the gap between ATC and AVC.');
}

/* ----------------------------------------------- 3.3 long-run costs */
{
  const lr = x => x < 4 ? 3 + 0.16 * (x - 4) ** 2 : x <= 6 ? 3 : 3 + 0.16 * (x - 6) ** 2;
  const dlr = x => x < 4 ? 0.32 * (x - 4) : x <= 6 ? 0 : 0.32 * (x - 6);
  const sr = xi => x => lr(xi) + dlr(xi) * (x - xi) + 0.55 * (x - xi) ** 2;
  const F = frame(90, 30, 470, 320, 'Quantity of output', 'Average total cost');
  const g = [...F.g];
  g.push(rect(F.X(0), F.Y(10), F.X(4) - F.X(0), F.h, { fill: TINT, op: 0.6 }), rect(F.X(4), F.Y(10), F.X(6) - F.X(4), F.h, { fill: SKY, op: 0.6 }), rect(F.X(6), F.Y(10), F.X(10) - F.X(6), F.h, { fill: WARM, op: 0.6 }));
  g.push(text(F.X(2), F.Y(9.5), 'Economies', { anchor: 'middle', size: 13, bold: true, fill: ACC }), text(F.X(2), F.Y(9.5) + 17, 'of scale', { anchor: 'middle', size: 13, bold: true, fill: ACC }));
  g.push(text(F.X(5), F.Y(9.5), 'Constant', { anchor: 'middle', size: 13, bold: true, fill: CER }), text(F.X(5), F.Y(9.5) + 17, 'returns', { anchor: 'middle', size: 13, bold: true, fill: CER }));
  g.push(text(F.X(8), F.Y(9.5), 'Diseconomies', { anchor: 'middle', size: 13, bold: true, fill: VERM }), text(F.X(8), F.Y(9.5) + 17, 'of scale', { anchor: 'middle', size: 13, bold: true, fill: VERM }));
  for (const [xi, n] of [[1.6, 'SRATC_1'], [5, 'SRATC_2'], [8.3, 'SRATC_3']]) {
    g.push(fpath(F, sr(xi), Math.max(0.2, xi - 2.6), Math.min(10, xi + 2.6), { stroke: GREY, w: 2, dash: '6 4' }));
    g.push(text(F.X(xi), F.Y(lr(xi) - 0.75), n, { size: 12, fill: GREY, anchor: 'middle' }));
  }
  g.push(fpath(F, lr, 0.2, 10, { stroke: INK, w: 3.4 }), text(F.X(10) + 6, F.Y(lr(10)) + 4, 'LRATC', { bold: true, size: 15 }));
  g.push(vguide(F, 4, 3), dot(F.X(4), F.Y(3), { fill: ACC, r: 6 }), xtick(F, 4, 'MES', { bold: true, fill: ACC }));
  g.push(text(645, 90, 'Each dashed curve is', { size: 13 }), text(645, 108, 'one plant size in the', { size: 13 }), text(645, 126, 'short run.', { size: 13 }));
  g.push(text(645, 170, 'LRATC traces the lowest', { size: 13 }), text(645, 188, 'cost of each output when', { size: 13 }), text(645, 206, 'the firm can pick any', { size: 13 }), text(645, 224, 'plant size.', { size: 13 }));
  g.push(text(645, 268, 'MES: the smallest output', { size: 13, fill: ACC, bold: true }), text(645, 286, 'at which LRATC reaches', { size: 13, fill: ACC }), text(645, 304, 'its lowest level.', { size: 13, fill: ACC }));
  add('long-run-costs', 'long-run-costs-lratc', 860, 400, 'Long-run average total cost: economies of scale, constant returns and diseconomies of scale',
    'Average total cost on the vertical axis and quantity of output on the horizontal axis. Three dashed short-run ATC curves, one for each plant size, sit on or above the long-run average total cost curve (LRATC). LRATC falls over the range of economies of scale, is flat over the range of constant returns to scale and rises over the range of diseconomies of scale. Minimum efficient scale (MES) is the smallest output at which LRATC reaches its lowest level.',
    g.join('\n'), 'A long-run average total cost curve that falls (economies of scale), stays flat (constant returns to scale) and then rises (diseconomies of scale), with three dashed short-run ATC curves touching it and minimum efficient scale marked where the flat part begins.');
}

/* ----------------------------------------------- 3.4 types of profit */
{
  const tr = 120, ex = 80, im = 30;
  const acc = Calc.accountingProfit(tr, ex), eco = Calc.economicProfit(tr, ex, im);
  const g = [];
  const base = 360, k = 2.3, bw = 150;
  const bar = (x, parts, label) => {
    let y = base;
    for (const [v, fill, t, tc] of parts) {
      const h = v * k; y -= h;
      g.push(rect(x, y, bw, h, { fill, stroke: '#FFFFFF', w: 2 }));
      g.push(text(x + bw / 2, y + h / 2 + 5, t, { anchor: 'middle', size: 13, bold: true, fill: tc || '#FFFFFF' }));
    }
    g.push(text(x + bw / 2, base + 24, label, { anchor: 'middle', size: 14, bold: true }));
  };
  g.push(line(60, base, 760, base, { w: 2 }));
  bar(80, [[tr, CER, `Revenue $${tr}k`]], 'Total revenue');
  bar(300, [[ex, GREY, `Explicit $${ex}k`], [acc, ACC, `Accounting profit $${acc}k`]], 'An accountant sees');
  bar(520, [[ex, GREY, `Explicit $${ex}k`], [im, VERM, `Implicit $${im}k`], [eco, ACC, `Econ. profit $${eco}k`]], 'An economist sees');
  g.push(line(240, base - tr * k, 300, base - tr * k, { stroke: GREY, w: 1.4, dash: '5 4' }), line(450, base - tr * k, 520, base - tr * k, { stroke: GREY, w: 1.4, dash: '5 4' }));
  g.push(text(410, 40, `Accounting profit = ${tr} - ${ex} = ${acc}`, { anchor: 'middle', size: 14, bold: true, fill: ACC }));
  g.push(text(410, 62, `Economic profit = ${tr} - ${ex} - ${im} = ${eco}`, { anchor: 'middle', size: 14, bold: true, fill: ACC }));
  add('types-of-profit', 'types-of-profit-bars', 820, 400, 'Accounting profit and economic profit from the same revenue',
    `Three bars in thousands of dollars. Total revenue is $${tr}k. An accountant subtracts the explicit costs of $${ex}k and finds an accounting profit of $${acc}k. An economist also subtracts the implicit costs of $${im}k, the owner's forgone salary and interest, and finds an economic profit of $${eco}k. Invented data for practice.`,
    g.join('\n'), `Three bars: total revenue of $${tr} thousand; the accountant's view, $${ex} thousand of explicit costs and $${acc} thousand of accounting profit; the economist's view, the same explicit costs, $${im} thousand of implicit costs and $${eco} thousand of economic profit.`);
}

/* ------------------------------------------ 3.5 profit maximization */
{
  const P = 6.5, q = qAt(P), a = ATC(q);
  const F = frame(90, 30, 460, 330, 'Quantity of output', 'Price and cost');
  const g = [...F.g];
  g.push(poly(F, [[0, P], [q, P], [q, a], [0, a]], TINT, 0.9), text(F.X(q * 0.78), F.Y(P - 0.42), 'Profit', { anchor: 'middle', bold: true, size: 15, fill: ACC }));
  g.push(fpath(F, ATC, 0.6, 10, { stroke: VERM }), fpath(F, MC, 0, 10, { stroke: ACC, w: 3.4 }));
  g.push(line(F.X(0), F.Y(P), F.X(10), F.Y(P), { stroke: CER, w: 3 }), text(F.X(10) + 6, F.Y(P) + 4, 'd = MR = P', { fill: CER, bold: true, size: 14 }));
  const mcEnd = [...Array(200).keys()].map(i => i / 20).filter(x => MC(x) <= 9.7).pop();
  g.push(text(F.X(mcEnd) + 6, F.Y(MC(mcEnd)) + 4, 'MC', { fill: ACC, bold: true, size: 15 }), text(F.X(10) + 6, F.Y(ATC(10)) + 4, 'ATC', { fill: VERM, bold: true, size: 15 }));
  g.push(dot(F.X(q), F.Y(P), { fill: ACC, r: 6 }), vguide(F, q, a), hguide(F, q, a), xtick(F, q, 'q*', { bold: true, fill: ACC }));
  g.push(ytick(F, P, 'P', { bold: true, fill: CER }), ytick(F, a, 'ATC at q*', { size: 12, fill: VERM }));
  g.push(text(645, 80, 'Produce where MR = MC:', { size: 13, bold: true, fill: ACC }), text(645, 98, 'output q*.', { size: 13 }));
  g.push(text(645, 140, 'Profit = (P - ATC) x q*,', { size: 13, bold: true }), text(645, 158, 'the rectangle from the', { size: 13 }), text(645, 176, 'price down to ATC, from', { size: 13 }), text(645, 194, 'zero out to q*.', { size: 13 }));
  g.push(text(645, 236, 'Left of q*, each unit adds', { size: 13 }), text(645, 254, 'more to revenue than to', { size: 13 }), text(645, 272, 'cost; right of q*, less.', { size: 13 }));
  add('profit-maximization', 'profit-maximization-rule', 860, 400, 'The profit-maximizing output where marginal revenue equals marginal cost',
    'Price and cost on the vertical axis and quantity of output on the horizontal axis. A firm sells every unit at the price P, so its demand and marginal revenue are one horizontal line, d = MR = P. MC rises through it at q*, the profit-maximizing output. Price is above ATC at q*, and the shaded profit rectangle runs from the price down to ATC and from zero out to q*.',
    g.join('\n'), 'A firm graph with a horizontal line d = MR = P crossing a rising MC curve at q*; the profit rectangle between the price and ATC from zero to q* is shaded.');
}

/* ------------------------------------------------ 3.6 firm decisions */
{
  const F = frame(90, 30, 460, 330, 'Quantity of output', 'Price and cost');
  const g = [...F.g];
  g.push(fpath(F, ATC, 0.6, 10, { stroke: VERM }), fpath(F, AVC, 0.3, 10, { stroke: CER }), fpath(F, MC, 0, 10, { stroke: ACC, w: 3.4 }));
  const mcEnd = [...Array(200).keys()].map(i => i / 20).filter(x => MC(x) <= 9.7).pop();
  g.push(text(F.X(mcEnd) + 6, F.Y(MC(mcEnd)) + 4, 'MC', { fill: ACC, bold: true, size: 15 }), text(F.X(10) + 6, F.Y(ATC(10)) - 2, 'ATC', { fill: VERM, bold: true, size: 15 }), text(F.X(10) + 6, F.Y(AVC(10)) + 14, 'AVC', { fill: CER, bold: true, size: 15 }));
  const lines = [[7, 'P_1', 'profit'], [4.3, 'P_2', 'loss, keep producing'], [3, 'P_3', 'shut down']];
  for (const [p, n] of lines) g.push(line(F.X(0), F.Y(p), F.X(10), F.Y(p), { stroke: GREY, w: 1.8, dash: '7 4' }), ytick(F, p, n, { bold: true }));
  g.push(ytick(F, MIN_ATC[1], 'min ATC', { size: 11, fill: VERM }), ytick(F, MIN_AVC[1], 'min AVC', { size: 11, fill: CER }));
  g.push(dot(F.X(MIN_AVC[0]), F.Y(MIN_AVC[1]), { fill: CER, r: 6 }), text(F.X(MIN_AVC[0]) + 4, F.Y(MIN_AVC[1]) + 22, 'S', { size: 14, bold: true, fill: CER }));
  g.push(dot(F.X(MIN_ATC[0]), F.Y(MIN_ATC[1]), { fill: VERM, r: 6 }), text(F.X(MIN_ATC[0]) + 4, F.Y(MIN_ATC[1]) + 22, 'B', { size: 14, bold: true, fill: VERM }));
  g.push(text(645, 70, 'P1, above min ATC:', { size: 13, bold: true }), text(645, 88, 'economic profit.', { size: 13 }));
  g.push(text(645, 128, 'P2, between min AVC', { size: 13, bold: true }), text(645, 146, 'and min ATC: a loss, but', { size: 13 }), text(645, 164, 'price covers AVC, so keep', { size: 13 }), text(645, 182, 'producing in the short run.', { size: 13 }));
  g.push(text(645, 222, 'P3, below min AVC:', { size: 13, bold: true }), text(645, 240, 'shut down; the loss is', { size: 13 }), text(645, 258, 'then the fixed cost alone.', { size: 13 }));
  g.push(text(645, 372, 'S: shutdown point', { size: 13, fill: CER, bold: true }), text(645, 390, 'B: break-even point', { size: 13, fill: VERM, bold: true }));
  g.push(text(645, 300, 'Above the shutdown point,', { size: 13, fill: ACC }), text(645, 318, 'the MC curve is the firm\'s', { size: 13, fill: ACC }), text(645, 336, 'short-run supply curve.', { size: 13, fill: ACC }));
  add('firm-decisions', 'firm-decisions-three-prices', 860, 400, 'Three prices and the short-run decision: profit, loss but produce, shut down',
    'A firm\'s MC, ATC and AVC curves with three price lines. P1 is above the lowest point of ATC, so the firm earns an economic profit. P2 is between the lowest points of AVC and ATC: the firm makes a loss but covers its variable costs, so it keeps producing in the short run. P3 is below the lowest point of AVC: the firm shuts down. The shutdown point is the lowest point of AVC and the break-even point the lowest point of ATC; above the shutdown point, the MC curve is the firm\'s short-run supply curve.',
    g.join('\n'), 'Cost curves MC, ATC and AVC with three price lines: P1 above the lowest point of ATC (profit), P2 between the lowest points of AVC and ATC (a loss, but keep producing) and P3 below the lowest point of AVC (shut down), with the shutdown and break-even points marked.');
}

/* ------------------------------------------- 3.7 perfect competition */
function twoPanel(g, o = {}) {
  const M = frame(80, 50, 280, 270, 'Quantity', 'Price', { size: 13 });
  const Fm = frame(500, 50, 280, 270, 'Quantity', 'Price and cost', { size: 13 });
  g.push(text(220, 28, 'Market', { anchor: 'middle', bold: true, size: 16 }), ...M.g, text(640, 28, 'Typical firm', { anchor: 'middle', bold: true, size: 16 }), ...Fm.g);
  return [M, Fm];
}
{
  const g = [];
  const [M, Fm] = twoPanel(g);
  const sd = Graph.curves({ kind: 'pc' }, {}), D = sd.find(c => c.id === 'D'), S = sd.find(c => c.id === 'S'), E = Graph.eq({ kind: 'pc' }, {});
  g.push(fpath(M, x => Graph.y(D, x), 0, 10, { stroke: CER }), fpath(M, x => Graph.y(S, x), 0, 10, { stroke: ACC }));
  g.push(text(M.X(9.6), M.Y(Graph.y(D, 9.6)) - 8, 'D', { fill: CER, bold: true, size: 15 }), text(M.X(9.6) - 8, M.Y(Graph.y(S, 9.6)) + 2, 'S', { fill: ACC, bold: true, size: 15, anchor: 'end' }));
  g.push(dot(M.X(E[0]), M.Y(E[1]), { r: 6 }), vguide(M, E[0], E[1]), xtick(M, E[0], 'Q_M', { bold: true }), ytick(M, E[1], 'P_M', { bold: true }));
  g.push(line(M.X(E[0]), M.Y(E[1]), Fm.X(10), Fm.Y(E[1]), { stroke: GREY, w: 1.4, dash: '5 4' }));
  g.push(fpath(Fm, ATC, 0.6, 10, { stroke: VERM }), fpath(Fm, AVC, 0.3, 10, { stroke: CER, w: 2.4 }), fpath(Fm, MC, 0, 10, { stroke: ACC, w: 3.4 }));
  g.push(line(Fm.X(0), Fm.Y(E[1]), Fm.X(10), Fm.Y(E[1]), { stroke: INK, w: 3 }));
  g.push(text(Fm.X(10) + 6, Fm.Y(E[1]) - 4, 'd = MR =', { bold: true, size: 13 }), text(Fm.X(10) + 6, Fm.Y(E[1]) + 12, 'AR = P', { bold: true, size: 13 }));
  const mcEnd = [...Array(200).keys()].map(i => i / 20).filter(x => MC(x) <= 9.7).pop();
  g.push(text(Fm.X(mcEnd) + 6, Fm.Y(MC(mcEnd)) + 4, 'MC', { fill: ACC, bold: true, size: 15 }), text(Fm.X(10) + 6, Fm.Y(ATC(10)) - 2, 'ATC', { fill: VERM, bold: true, size: 14 }), text(Fm.X(10) + 6, Fm.Y(AVC(10)) + 12, 'AVC', { fill: CER, bold: true, size: 14 }));
  g.push(dot(Fm.X(MIN_ATC[0]), Fm.Y(E[1]), { r: 6 }), vguide(Fm, MIN_ATC[0], E[1]), xtick(Fm, MIN_ATC[0], 'q_F', { bold: true }), ytick(Fm, E[1], 'P_F', { bold: true }));
  g.push(text(430, 380, 'The market sets the price; the firm takes it. The firm produces where MR = MC; in the long run', { anchor: 'middle', size: 13, fill: GREY }));
  g.push(text(430, 398, 'that is at the lowest point of ATC, so the firm earns zero economic profit.', { anchor: 'middle', size: 13, fill: GREY }));
  if (Math.abs(E[1] - MIN_ATC[1]) > 1e-6) throw new Error('the default pc graph is no longer in long-run equilibrium');
  add('perfect-competition', 'perfect-competition-side-by-side', 880, 420, 'A perfectly competitive market and a typical firm in long-run equilibrium',
    'Left, the market: demand D and supply S cross at the market price PM and quantity QM. Right, a typical firm: the market price carried across with a dashed line is the firm\'s horizontal demand curve, d = MR = AR = P, at PF. The firm produces qF, where MR = MC, which in long-run equilibrium is at the lowest point of ATC, so price equals ATC and economic profit is zero. Market quantity is in capital Q, the firm\'s in lower-case q.',
    g.join('\n'), 'Side-by-side graphs. The market\'s demand and supply set the price PM; the firm takes it as a horizontal line d = MR = AR = P and produces qF where MR = MC, at the lowest point of ATC, earning zero economic profit.');
}
{
  const g = [];
  const [M, Fm] = twoPanel(g);
  const s0 = Graph.curves({ kind: 'pc' }, {}), s1 = Graph.curves({ kind: 'pc' }, { D: 2 }), s2 = Graph.curves({ kind: 'pc' }, { D: 2, S: 2 });
  const c = (cs, id) => cs.find(k => k.id === id);
  const E1 = Graph.eq({ kind: 'pc' }, {}), E2 = Graph.eq({ kind: 'pc' }, { D: 2 }), E3 = Graph.eq({ kind: 'pc' }, { D: 2, S: 2 });
  g.push(fpath(M, x => Graph.y(c(s0, 'D'), x), 0, 10, { stroke: GREY, w: 2.2, dash: '7 5' }), fpath(M, x => Graph.y(c(s0, 'S'), x), 0, 10, { stroke: GREY, w: 2.2, dash: '7 5' }));
  g.push(fpath(M, x => Graph.y(c(s1, 'D'), x), 0, 10, { stroke: CER }), fpath(M, x => Graph.y(c(s2, 'S'), x), 0, 10, { stroke: ACC }));
  g.push(text(M.X(7.6) - 6, M.Y(Graph.y(c(s0, 'D'), 7.6)) + 4, 'D_1', { fill: GREY, bold: true, size: 14, anchor: 'end' }), text(M.X(9.6), M.Y(Graph.y(c(s1, 'D'), 9.6)) - 8, 'D_2', { fill: CER, bold: true, size: 14 }));
  g.push(text(M.X(9.2) - 8, M.Y(Graph.y(c(s0, 'S'), 9.2)) - 4, 'S_1', { fill: GREY, bold: true, size: 14, anchor: 'end' }), text(M.X(10) + 4, M.Y(Graph.y(c(s2, 'S'), 10)) + 4, 'S_2', { fill: ACC, bold: true, size: 14 }));
  g.push(line(M.X(5.7), M.Y(7.6), M.X(6.5), M.Y(7.6), { stroke: CER, w: 2, arrow: 'perfect-competition-long-run-arC' }), line(M.X(7.3), M.Y(6.8), M.X(8.1), M.Y(6.8), { stroke: ACC, w: 2, arrow: 'perfect-competition-long-run-arA' }));
  for (const [e, n] of [[E1, '1'], [E2, '2'], [E3, '3']]) g.push(dot(M.X(e[0]), M.Y(e[1]), { r: 5, fill: n === '2' ? VERM : INK }), vguide(M, e[0], e[1]), xtick(M, e[0], `Q_${n}`, { size: 12 }));
  g.push(ytick(M, E2[1], 'P_2', { bold: true, fill: VERM }), ytick(M, E1[1], 'P_1', { bold: true }));
  g.push(line(M.X(0), M.Y(E1[1]), M.X(10), M.Y(E1[1]), { stroke: INK, w: 1.6, dash: '2 3' }), text(M.X(0.3), M.Y(E1[1]) - 7, 'long-run supply', { size: 11, fill: INK }));
  g.push(fpath(Fm, ATC, 0.6, 10, { stroke: VERM }), fpath(Fm, MC, 0, 10, { stroke: ACC, w: 3.4 }));
  const mcEnd = [...Array(200).keys()].map(i => i / 20).filter(x => MC(x) <= 9.7).pop();
  g.push(text(Fm.X(mcEnd) + 6, Fm.Y(MC(mcEnd)) + 4, 'MC', { fill: ACC, bold: true, size: 15 }), text(Fm.X(10) + 6, Fm.Y(ATC(10)) - 2, 'ATC', { fill: VERM, bold: true, size: 14 }));
  const q2 = qAt(E2[1]), a2 = ATC(q2);
  g.push(poly(Fm, [[0, E2[1]], [q2, E2[1]], [q2, a2], [0, a2]], TINT, 0.95));
  g.push(line(Fm.X(0), Fm.Y(E2[1]), Fm.X(10), Fm.Y(E2[1]), { stroke: VERM, w: 2.6 }), text(Fm.X(10) + 6, Fm.Y(E2[1]) + 4, 'MR = P_2', { fill: VERM, bold: true, size: 13 }));
  g.push(line(Fm.X(0), Fm.Y(E1[1]), Fm.X(10), Fm.Y(E1[1]), { stroke: INK, w: 2.6 }), text(Fm.X(10) + 6, Fm.Y(E1[1]) + 14, 'MR = P_1', { bold: true, size: 13 }));
  g.push(line(M.X(E2[0]), M.Y(E2[1]), Fm.X(0), Fm.Y(E2[1]), { stroke: GREY, w: 1.2, dash: '5 4' }));
  g.push(vguide(Fm, MIN_ATC[0], E1[1]), xtick(Fm, MIN_ATC[0], 'q_1', { size: 12 }), vguide(Fm, q2, E2[1]), text(Fm.X(q2) + 3, Fm.Y(0) + 18, 'q_2', { size: 12, fill: VERM }));
  g.push(text(Fm.X(q2 / 2), Fm.Y((E2[1] + a2) / 2) + 4, 'profit', { anchor: 'middle', size: 12, bold: true, fill: ACC }));
  g.push(text(430, 384, '1. Demand rises (D1 to D2): the price rises to P2 and firms earn economic profit at q2.', { anchor: 'middle', size: 13, fill: GREY }));
  g.push(text(430, 402, '2. Profit draws new firms in: market supply shifts right (S1 to S2) until the price is back at P1, the lowest point of ATC.', { anchor: 'middle', size: 13, fill: GREY }));
  if (Math.abs(E3[1] - E1[1]) > 1e-6) throw new Error('the long-run figure no longer returns to the original price');
  add('perfect-competition', 'perfect-competition-long-run', 880, 420, 'From short-run profit to the new long-run equilibrium in a constant-cost industry',
    'Left, the market: demand rises from D1 to D2, so the price rises from P1 to P2 and quantity from Q1 to Q2. Right, the firm: at P2 it produces q2, where MR2 = MC, and earns the shaded economic profit. The profit draws new firms in, market supply shifts right from S1 to S2, and the price falls back to P1, the lowest point of ATC, at the larger market quantity Q3. In a constant-cost industry the long-run supply curve is horizontal at P1.',
    g.join('\n'), 'Side-by-side graphs: market demand rises from D1 to D2, raising the price to P2 and giving the firm a profit at q2; new firms enter, supply shifts from S1 to S2, and the price returns to P1 at the lowest point of ATC, with a larger market quantity.');
}

mkdirSync(FIG, { recursive: true });
mkdirSync(REG, { recursive: true });
for (const [topic, f] of Object.entries(figures)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(f, null, 1) + '\n');
console.log(`author C figures: ${Object.values(figures).reduce((n, f) => n + Object.keys(f).length, 0)} written`);
