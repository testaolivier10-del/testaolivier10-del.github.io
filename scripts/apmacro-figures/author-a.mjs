/* AP® Macroeconomics figures for the "Graph skills you need" chapter and
   Unit 1 (author A). Every graph is drawn from the coordinates listed here,
   so a figure shows exactly the curves and points its caption names; every
   number a figure prints (an opportunity cost, a shortage) is computed by
   ApMacroCalc (macroeconomics/assets/mac-calc.js). Data are invented for
   practice and the captions say so.
   Writes
     macroeconomics/figures/<id>.svg
     macroeconomics/data/figures/<topic>.json   (the registry entries)

     node scripts/apmacro-figures/author-a.mjs

   Style: white background (the page inverts it in dark mode), role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, the course accent
   #355A0A for the curve that matters, cerulean #084F78 and vermillion
   #D55E00 for a second curve or a point, grey dashed for a curve before a
   shift. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Calc } from '../lib/apmacro-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'macroeconomics', 'figures');
const REG = join(ROOT, 'macroeconomics', 'data', 'figures');
const INK = '#1F2A28', ACC = '#355A0A', CER = '#084F78', VERM = '#D55E00', GREY = '#6B7370', SOFT = '#F3F6EE', TINT = '#E6EEDA', WARM = '#FBE6D9';
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
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#${o.arrow})"` : ''}/>`;
const dot = (x, y, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${o.r || 5}" fill="${o.fill || INK}"/>`;
function markers(id) {
  return `<defs>${[['ar', INK], ['arA', ACC], ['arV', VERM], ['arC', CER]].map(([k, c]) => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`;
}
function svgDoc(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">\n<title id="${id}-t">${esc(title)}</title>\n<desc id="${id}-d">${esc(desc)}</desc>\n${markers(id)}<rect width="${w}" height="${h}" fill="#FFFFFF"/>\n${body}\n</svg>\n`;
}

/* A plot frame: graph coordinates 0-10 on both axes inside a box. */
function frame(x0, y0, w, h, xl, yl, o = {}) {
  const X = v => x0 + v / 10 * w, Y = v => y0 + h - v / 10 * h;
  const g = [line(x0, y0 - 6, x0, y0 + h, { w: 2 }), line(x0, y0 + h, x0 + w + 6, y0 + h, { w: 2 })];
  g.push(text(x0 + w, y0 + h + 38, xl, { anchor: 'end', size: o.size || 14, bold: true }));
  g.push(text(x0 - 34, y0, yl, { anchor: 'end', size: o.size || 14, bold: true, rotate: -90 }));
  return { X, Y, g };
}
// A straight curve between two graph points, with a label at its end.
function curve(F, a, b, lab, o = {}) {
  const out = [line(F.X(a[0]), F.Y(a[1]), F.X(b[0]), F.Y(b[1]), { stroke: o.stroke || ACC, w: o.w || 3, dash: o.dash })];
  if (lab) out.push(text(F.X(b[0]) + (o.dx ?? 6), F.Y(b[1]) + (o.dy ?? 4), lab, { fill: o.stroke || ACC, bold: true, size: 15 }));
  return out.join('');
}
// Dashed guides from a point to both axes, with axis labels.
function guides(F, p, xl, yl, o = {}) {
  const out = [line(F.X(0), F.Y(p[1]), F.X(p[0]), F.Y(p[1]), { stroke: GREY, w: 1.4, dash: '5 4' }), line(F.X(p[0]), F.Y(p[1]), F.X(p[0]), F.Y(0), { stroke: GREY, w: 1.4, dash: '5 4' })];
  if (yl) out.push(text(F.X(0) - 6, F.Y(p[1]) + 5, yl, { anchor: 'end', size: 13 }));
  if (xl) out.push(text(F.X(p[0]), F.Y(0) + 18, xl, { anchor: 'middle', size: 13 }));
  if (!o.noDot) out.push(dot(F.X(p[0]), F.Y(p[1]), { fill: o.fill || INK }));
  return out.join('');
}
function ppcPath(F, at) {
  const pts = [];
  for (let k = 0; k <= 90; k++) { const a = k / 90 * Math.PI / 2; pts.push(`${r1(F.X(at * Math.sin(a)))} ${r1(F.Y(at * Math.cos(a)))}`); }
  return pts.join('L');
}

const figures = {};
function add(topic, id, w, h, title, desc, body, alt) {
  writeFileSync(join(FIG, `${id}.svg`), svgDoc(id, w, h, title, desc, body));
  (figures[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* ----------------------------------------------------- graph skills */
{ // axes-points: a coordinate plane with three labeled points
  const F = frame(90, 30, 460, 300, 'Hours studied', 'Test score');
  const pts = [[2, 4, 'Q', '(2, 60)'], [5, 7, 'R', '(5, 75)'], [8, 9, 'T', '(8, 85)']];
  const g = [...F.g];
  for (let v = 0; v <= 10; v += 2) { g.push(text(F.X(v), F.Y(0) + 18, String(v), { anchor: 'middle', size: 12, fill: GREY })); }
  [[0, '40'], [4, '60'], [7, '75'], [9, '85']].forEach(([v, s]) => g.push(text(F.X(0) - 8, F.Y(v) + 4, s, { anchor: 'end', size: 12, fill: GREY })));
  for (const [x, y, n, c] of pts) { g.push(guides(F, [x, y], null, null, { fill: ACC })); g.push(text(F.X(x) + 10, F.Y(y) - 8, `${n} ${c}`, { size: 14, bold: true, fill: ACC })); }
  g.push(text(330, 400, 'Each point is one pair of values: read down to the horizontal axis and across to the vertical axis.', { anchor: 'middle', size: 13, fill: GREY }));
  add('axes-points', 'axes-points-plane', 640, 410, 'Reading points on a labeled graph',
    'A graph with Hours studied on the horizontal axis and Test score on the vertical axis. Three points with dashed lines to both axes: Q at 2 hours and a score of 60, R at 5 hours and 75, T at 8 hours and 85. The points rise to the right: a direct relationship. Invented data for practice.',
    g.join('\n'), 'A labeled graph with hours studied across the bottom and test score up the side, showing three points, Q (2, 60), R (5, 75) and T (8, 85), each with dashed lines to both axes; the scores rise as hours rise.');
}
{ // slopes-curves: four shapes
  const g = [];
  const panels = [['Upward sloping', 'positive slope: both rise together', [1, 1], [9, 9]], ['Downward sloping', 'negative slope: one rises as the other falls', [1, 9], [9, 1]], ['Vertical line', 'the horizontal value stays fixed', [5, 0.5], [5, 9.5]], ['Horizontal line', 'the vertical value stays fixed', [0.5, 5], [9.5, 5]]];
  panels.forEach(([h, s, a, b], i) => {
    const x0 = 40 + (i % 2) * 330, y0 = 40 + Math.floor(i / 2) * 245;
    const F = frame(x0 + 30, y0 + 20, 220, 130, 'x', 'y', { size: 13 });
    g.push(text(x0 + 140, y0, h, { anchor: 'middle', bold: true, size: 15 }), ...F.g, curve(F, a, b, null, { stroke: i === 1 ? CER : i > 1 ? VERM : ACC }), text(x0 + 140, y0 + 208, s, { anchor: 'middle', size: 12, fill: GREY }));
  });
  add('slopes-curves', 'slopes-curves-shapes', 700, 520, 'Four curve shapes and what their slopes say',
    'Four small graphs. Upward sloping: a positive slope, both variables rise together. Downward sloping: a negative slope, one rises as the other falls. A vertical line: the horizontal value stays the same whatever the vertical value. A horizontal line: the vertical value stays the same whatever the horizontal value.',
    g.join('\n'), 'Four small graphs: an upward-sloping line (positive slope), a downward-sloping line (negative slope), a vertical line and a horizontal line, each with a note on what it means.');
}
{ // shifts-movements: movement along vs shift
  const g = [];
  const L = frame(70, 50, 240, 220, 'Quantity', 'Price', { size: 13 });
  g.push(text(190, 28, 'A movement along the curve', { anchor: 'middle', bold: true, size: 15 }), ...L.g, curve(L, [1, 9], [9, 1], 'D'));
  g.push(dot(L.X(3), L.Y(7), { fill: VERM }), text(L.X(3) + 8, L.Y(7) - 8, 'J', { bold: true, fill: VERM }), dot(L.X(6), L.Y(4), { fill: VERM }), text(L.X(6) + 8, L.Y(4) - 8, 'K', { bold: true, fill: VERM }));
  g.push(line(L.X(3.4), L.Y(6.2), L.X(5.6), L.Y(4.0), { stroke: VERM, w: 2, arrow: 'shifts-movements-two-ways-arV' }));
  g.push(text(190, 330, 'The price falls: same curve,', { anchor: 'middle', size: 12, fill: GREY }), text(190, 346, 'a larger quantity (J to K).', { anchor: 'middle', size: 12, fill: GREY }));
  const R = frame(420, 50, 240, 220, 'Quantity', 'Price', { size: 13 });
  g.push(text(540, 28, 'A shift of the curve', { anchor: 'middle', bold: true, size: 15 }), ...R.g, curve(R, [0.5, 8.5], [7.5, 1.5], 'D_1', { stroke: GREY, dash: '7 5', w: 2.5 }), curve(R, [2.5, 8.5], [9.5, 1.5], 'D_2'));
  g.push(line(R.X(4.2), R.Y(5), R.X(5.8), R.Y(5), { stroke: ACC, w: 2.2, arrow: 'shifts-movements-two-ways-arA' }));
  g.push(text(540, 330, 'Something other than price changes:', { anchor: 'middle', size: 12, fill: GREY }), text(540, 346, 'more is bought at every price.', { anchor: 'middle', size: 12, fill: GREY }));
  add('shifts-movements', 'shifts-movements-two-ways', 720, 360, 'A movement along a curve versus a shift of the curve',
    'Left: one downward-sloping curve labeled D, with an arrow from point J down to point K along it: a lower price, a larger quantity, the same curve. Right: the curve D1 dashed and a new curve D2 to its right, with an arrow pointing right: something other than the price changed, so a larger quantity is bought at every price.',
    g.join('\n'), 'Two graphs side by side. Left: a movement along one curve from point J to point K when the price falls. Right: the whole curve shifts right from D1 to D2 when something other than the price changes.');
}
{ // curves-crossing: E1 and E2
  const F = frame(90, 30, 420, 300, 'Quantity', 'Price');
  const g = [...F.g];
  g.push(curve(F, [1, 9], [9, 1], 'D'), curve(F, [1, 1], [9, 9], 'S_1', { stroke: GREY, dash: '7 5', w: 2.5, dy: -2 }), curve(F, [0, 2], [8, 10], 'S_2', { stroke: CER, dy: 10 }));
  g.push(guides(F, [5, 5], 'Q_1', 'P_1'), text(F.X(5) + 10, F.Y(5) + 18, 'E_1', { bold: true }));
  g.push(guides(F, [4, 6], 'Q_2', 'P_2', { fill: VERM }), text(F.X(4) - 4, F.Y(6) - 14, 'E_2', { bold: true, fill: VERM, anchor: 'end' }));
  g.push(line(F.X(6.6), F.Y(6.2), F.X(5.6), F.Y(7.2), { stroke: CER, w: 2, arrow: 'curves-crossing-before-after-arC' }));
  add('curves-crossing', 'curves-crossing-before-after', 600, 370, 'Where two curves cross, before and after a shift',
    'A downward curve D and an upward curve S1 cross at E1, with dashed lines to P1 on the vertical axis and Q1 on the horizontal axis. S shifts left to S2, and the new crossing E2 sits higher and to the left, at P2 above P1 and Q2 below Q1.',
    g.join('\n'), 'A downward curve D crosses an upward curve S1 at point E1 (P1, Q1); after the upward curve shifts left to S2, the new crossing E2 has a higher price P2 and a smaller quantity Q2.');
}

/* ------------------------------------------------------------ unit 1 */
{ // scarcity
  const g = [];
  g.push(rect(30, 40, 250, 120, { fill: WARM, stroke: VERM }), text(155, 75, 'Wants', { anchor: 'middle', bold: true, size: 18 }), text(155, 102, 'unlimited: people always', { anchor: 'middle', size: 13 }), text(155, 120, 'want more goods and services', { anchor: 'middle', size: 13 }));
  g.push(rect(30, 200, 250, 170, { fill: TINT, stroke: ACC }), text(155, 232, 'Resources', { anchor: 'middle', bold: true, size: 18 }), text(155, 254, 'limited (the factors of production)', { anchor: 'middle', size: 13 }));
  ['Land: natural resources', 'Labor: human effort', 'Capital: tools, machines, buildings', 'Entrepreneurship: organizing, risk'].forEach((s, i) => g.push(text(50, 282 + i * 22, s, { size: 13 })));
  g.push(line(290, 100, 380, 190, { w: 2.4, arrow: 'scarcity-choices-ar' }), line(290, 285, 380, 210, { w: 2.4, arrow: 'scarcity-choices-ar' }));
  g.push(rect(390, 150, 120, 100, { fill: SOFT, stroke: INK }), text(450, 195, 'Scarcity', { anchor: 'middle', bold: true, size: 17 }), text(450, 217, 'so we choose', { anchor: 'middle', size: 13 }));
  g.push(line(515, 200, 560, 200, { w: 2.4, arrow: 'scarcity-choices-ar' }));
  ['What to produce?', 'How to produce it?', 'For whom?'].forEach((s, i) => { g.push(rect(570, 110 + i * 64, 170, 48, { fill: '#FFFFFF', stroke: CER }), text(655, 140 + i * 64, s, { anchor: 'middle', bold: true, size: 14, fill: CER })); });
  add('scarcity', 'scarcity-choices', 770, 400, 'Scarcity: unlimited wants, limited resources',
    'Two boxes, unlimited wants and limited resources (land, labor, capital and entrepreneurship), lead to scarcity, which forces three choices: what to produce, how to produce it and for whom.',
    g.join('\n'), 'A diagram: unlimited wants and limited resources (land, labor, capital, entrepreneurship) together create scarcity, which forces every society to choose what to produce, how, and for whom.');
}
{ // opportunity-cost-ppc: bowed PPC, points, growth
  const F = frame(90, 30, 420, 320, 'Pizzas (thousands)', 'Robots (thousands)');
  const g = [...F.g];
  g.push(`<path d="M${ppcPath(F, 9.4)}" fill="none" stroke="${GREY}" stroke-width="2.4" stroke-dasharray="7 5"/>`, text(F.X(7.3), F.Y(6.4), 'PPC_2', { fill: GREY, bold: true }));
  g.push(`<path d="M${ppcPath(F, 7.5)}" fill="none" stroke="${ACC}" stroke-width="3.2"/>`, text(F.X(5.6) - 8, F.Y(4.6) - 14, 'PPC_1', { fill: ACC, bold: true, anchor: 'end' }));
  const P = [[3, Math.sqrt(7.5 ** 2 - 9), 'F', INK], [6, Math.sqrt(7.5 ** 2 - 36), 'G', INK], [3, 3, 'U', CER], [7, 6.5, 'Z', VERM]];
  for (const [x, y, n, c] of P) g.push(dot(F.X(x), F.Y(y), { fill: c }), text(F.X(x) + 9, F.Y(y) - 8, n, { bold: true, fill: c, size: 15 }));
  g.push(line(F.X(5.2), F.Y(5.2), F.X(6.3), F.Y(6.3), { stroke: GREY, w: 2, arrow: 'opportunity-cost-ppc-points-ar' }));
  g.push(text(560, 80, 'F, G: on the curve, efficient', { size: 13 }), text(560, 104, 'U: inside, resources idle', { size: 13, fill: CER }), text(560, 128, 'Z: outside, not reachable now', { size: 13, fill: VERM }), text(560, 152, 'PPC2: more resources or', { size: 13, fill: GREY }), text(560, 170, 'better technology', { size: 13, fill: GREY }));
  add('opportunity-cost-ppc', 'opportunity-cost-ppc-points', 800, 400, 'A production possibilities curve: points on, inside and outside, and growth',
    'A bowed-out PPC1 for pizzas (horizontal) and robots (vertical). F and G sit on the curve and are efficient; U sits inside, with idle resources; Z sits outside and cannot be produced now. A dashed PPC2 farther out, with an arrow from PPC1, shows growth from more resources or better technology.',
    g.join('\n'), 'A bowed-out production possibilities curve for pizzas and robots, with efficient points F and G on it, point U inside (idle resources), point Z outside (unattainable), and a dashed outward-shifted curve showing growth.');
}
{ // opportunity-cost-ppc: straight vs bowed
  const g = [];
  const L = frame(70, 50, 250, 220, 'Bread', 'Cake', { size: 13 });
  g.push(text(195, 28, 'Constant opportunity cost', { anchor: 'middle', bold: true, size: 15 }), ...L.g, curve(L, [0, 8], [8, 0], 'PPC', { dy: -8 }));
  g.push(text(195, 330, 'A straight line: each extra loaf costs', { anchor: 'middle', size: 12, fill: GREY }), text(195, 346, 'the same amount of cake.', { anchor: 'middle', size: 12, fill: GREY }));
  const R = frame(430, 50, 250, 220, 'Bread', 'Cake', { size: 13 });
  g.push(text(555, 28, 'Increasing opportunity cost', { anchor: 'middle', bold: true, size: 15 }), ...R.g, `<path d="M${ppcPath(R, 8)}" fill="none" stroke="${ACC}" stroke-width="3"/>`, text(R.X(6.2), R.Y(5.8), 'PPC', { fill: ACC, bold: true }));
  g.push(text(555, 330, 'Bowed out: each extra loaf costs', { anchor: 'middle', size: 12, fill: GREY }), text(555, 346, 'more cake than the one before.', { anchor: 'middle', size: 12, fill: GREY }));
  add('opportunity-cost-ppc', 'opportunity-cost-ppc-shapes', 740, 360, 'Straight and bowed-out production possibilities curves',
    'Left: a straight-line PPC between bread and cake, constant opportunity cost, each extra loaf costs the same amount of cake. Right: a bowed-out PPC, increasing opportunity cost, each extra loaf costs more cake than the one before, because resources are not equally good at making both.',
    g.join('\n'), 'Two production possibilities curves for bread and cake: a straight line showing constant opportunity cost, and a bowed-out curve showing increasing opportunity cost.');
}
{ // comparative-advantage: two straight PPCs
  const W = 40, Cl = 20, BW = 30, BC = 10; // per worker per day (invented)
  const oc = { aCloth: Calc.opportunityCost(W, Cl), bCloth: Calc.opportunityCost(BW, BC), aWheat: Calc.opportunityCost(Cl, W), bWheat: Calc.opportunityCost(BC, BW) };
  const F = frame(90, 30, 400, 320, 'Wheat (bushels)', 'Cloth (yards)');
  const sx = v => v / 4, sy = v => v / 2.2;
  const g = [...F.g];
  [0, 10, 20, 30, 40].forEach(v => g.push(text(F.X(sx(v)), F.Y(0) + 18, String(v), { anchor: 'middle', size: 12, fill: GREY })));
  [10, 20].forEach(v => g.push(text(F.X(0) - 8, F.Y(sy(v)) + 4, String(v), { anchor: 'end', size: 12, fill: GREY })));
  g.push(curve(F, [0, sy(Cl)], [sx(W), 0], null), text(F.X(sx(W * 0.42)) + 6, F.Y(sy(Cl * 0.58)) - 6, 'Dornia', { fill: ACC, bold: true, size: 15 }));
  g.push(curve(F, [0, sy(BC)], [sx(BW), 0], null, { stroke: CER }), text(F.X(sx(BW * 0.3)) - 4, F.Y(sy(BC * 0.7)) - 8, 'Belmar', { fill: CER, bold: true, size: 15 }));
  g.push(text(530, 70, 'Opportunity cost of', { size: 14, bold: true }), text(530, 92, '1 yard of cloth:', { size: 14, bold: true }));
  g.push(text(530, 118, `Dornia ${oc.aCloth} bushels of wheat`, { size: 13, fill: ACC }), text(530, 140, `Belmar ${oc.bCloth} bushels of wheat`, { size: 13, fill: CER }));
  g.push(text(530, 180, 'Opportunity cost of', { size: 14, bold: true }), text(530, 202, '1 bushel of wheat:', { size: 14, bold: true }));
  g.push(text(530, 228, `Dornia ${oc.aWheat} yard of cloth`, { size: 13, fill: ACC }), text(530, 250, `Belmar 1/3 yard of cloth`, { size: 13, fill: CER }));
  g.push(text(530, 292, 'Lower cost of cloth: Dornia', { size: 13, bold: true }), text(530, 312, 'Lower cost of wheat: Belmar', { size: 13, bold: true }));
  if (Math.abs(oc.bWheat - 1 / 3) > 1e-9) throw new Error('Belmar wheat cost changed: update the label');
  add('comparative-advantage', 'comparative-advantage-two-ppcs', 800, 400, 'Two countries, two straight PPCs, two opportunity costs',
    'Per-worker production possibilities for Dornia (40 bushels of wheat or 20 yards of cloth a day) and Belmar (30 bushels of wheat or 10 yards of cloth). One yard of cloth costs Dornia 2 bushels of wheat and Belmar 3, so Dornia has the comparative advantage in cloth; one bushel of wheat costs Dornia half a yard of cloth and Belmar a third of a yard, so Belmar has the comparative advantage in wheat. Invented data for practice.',
    g.join('\n'), 'Two straight production possibilities lines for one worker a day: Dornia, 40 bushels of wheat or 20 yards of cloth, and Belmar, 30 bushels of wheat or 10 yards of cloth, with the opportunity costs: cloth costs Dornia 2 bushels and Belmar 3; wheat costs Dornia half a yard and Belmar a third of a yard.');
}
{ // demand: movement and shift
  const F = frame(90, 30, 420, 300, 'Quantity of concert tickets', 'Price');
  const g = [...F.g];
  g.push(curve(F, [0.5, 9], [8, 1.5], 'D_1', { stroke: GREY, dash: '7 5', w: 2.5 }), curve(F, [2.5, 9], [10, 1.5], 'D_2'));
  g.push(dot(F.X(2.5), F.Y(7), { fill: VERM }), text(F.X(2.5) - 8, F.Y(7) - 6, 'J', { bold: true, fill: VERM, anchor: 'end' }), dot(F.X(5), F.Y(4.5), { fill: VERM }), text(F.X(5) - 8, F.Y(4.5) - 6, 'K', { bold: true, fill: VERM, anchor: 'end' }));
  g.push(line(F.X(2.9), F.Y(6.6), F.X(4.6), F.Y(4.9), { stroke: VERM, w: 2, arrow: 'demand-curve-shift-arV' }));
  g.push(line(F.X(5.6), F.Y(6), F.X(7.2), F.Y(6), { stroke: ACC, w: 2.4, arrow: 'demand-curve-shift-arA' }));
  g.push(text(540, 70, 'J to K: the price falls, so the', { size: 13, fill: VERM }), text(540, 88, 'quantity demanded rises', { size: 13, fill: VERM }), text(540, 106, '(a movement along D1)', { size: 13, fill: VERM }));
  g.push(text(540, 150, 'D1 to D2: demand increases', { size: 13, fill: ACC, bold: true }), text(540, 168, '(a shift): tastes, income, related', { size: 13, fill: ACC }), text(540, 186, 'prices, expectations or the', { size: 13, fill: ACC }), text(540, 204, 'number of buyers changed', { size: 13, fill: ACC }));
  add('demand', 'demand-curve-shift', 800, 370, 'A change in quantity demanded versus a change in demand',
    'A demand curve D1 for concert tickets, with an arrow along it from J to K: a lower price raises the quantity demanded. A second curve D2 to the right, with an arrow from D1: an increase in demand, caused by a change in tastes, income, the prices of related goods, expectations or the number of buyers.',
    g.join('\n'), 'A demand graph for concert tickets: a movement along D1 from J to K when the price falls (a change in quantity demanded), and a shift from D1 to D2 when something else changes (a change in demand).');
}
{ // supply: movement and shift
  const F = frame(90, 30, 420, 300, 'Quantity of bicycles', 'Price');
  const g = [...F.g];
  g.push(curve(F, [2, 1], [9.5, 8.5], 'S_1', { stroke: GREY, dash: '7 5', w: 2.5 }), curve(F, [0.5, 2.5], [7.5, 9.5], 'S_2', { dy: 14 }));
  g.push(dot(F.X(4), F.Y(3), { fill: VERM }), text(F.X(4) + 9, F.Y(3) + 14, 'J', { bold: true, fill: VERM }), dot(F.X(7), F.Y(6), { fill: VERM }), text(F.X(7) + 9, F.Y(6) + 14, 'K', { bold: true, fill: VERM }));
  g.push(line(F.X(4.4), F.Y(3.4), F.X(6.6), F.Y(5.6), { stroke: VERM, w: 2, arrow: 'supply-curve-shift-arV' }));
  g.push(line(F.X(6.2), F.Y(3.2), F.X(4.6), F.Y(3.2), { stroke: ACC, w: 2.4, arrow: 'supply-curve-shift-arA' }));
  g.push(text(540, 70, 'J to K: the price rises, so the', { size: 13, fill: VERM }), text(540, 88, 'quantity supplied rises', { size: 13, fill: VERM }), text(540, 106, '(a movement along S1)', { size: 13, fill: VERM }));
  g.push(text(540, 150, 'S1 to S2: supply decreases', { size: 13, fill: ACC, bold: true }), text(540, 168, '(a shift left): input costs rose,', { size: 13, fill: ACC }), text(540, 186, 'a new tax, fewer sellers, or', { size: 13, fill: ACC }), text(540, 204, 'expectations changed', { size: 13, fill: ACC }));
  add('supply', 'supply-curve-shift', 800, 370, 'A change in quantity supplied versus a change in supply',
    'A supply curve S1 for bicycles, with an arrow along it from J to K: a higher price raises the quantity supplied. A second curve S2 to the left, with an arrow from S1: a decrease in supply, caused by higher input costs, a new tax, fewer sellers or a change in expectations.',
    g.join('\n'), 'A supply graph for bicycles: a movement along S1 from J to K when the price rises (a change in quantity supplied), and a shift left from S1 to S2 when input costs rise (a decrease in supply).');
}
{ // market-equilibrium: shortage at a price below equilibrium
  const qd = 70, qs = 40; // at a price of $2 (invented)
  const short = Calc.sub(qd, qs);
  const F = frame(90, 30, 420, 300, 'Quantity of lemonade (cups)', 'Price per cup');
  const g = [...F.g];
  g.push(curve(F, [1, 9], [9, 1], 'D', { stroke: CER }), curve(F, [1, 1], [9, 9], 'S'));
  g.push(guides(F, [5, 5], 'Q*', 'P* = $3'), text(F.X(5) + 10, F.Y(5) + 5, 'E', { bold: true }));
  g.push(line(F.X(0), F.Y(3), F.X(7.6), F.Y(3), { stroke: VERM, w: 2 }), text(F.X(0) - 6, F.Y(3) + 5, '$2', { anchor: 'end', size: 13, fill: VERM }));
  g.push(dot(F.X(3), F.Y(3), { fill: VERM, r: 4 }), dot(F.X(7), F.Y(3), { fill: VERM, r: 4 }));
  g.push(line(F.X(3), F.Y(2.2), F.X(7), F.Y(2.2), { stroke: VERM, w: 1.6 }), line(F.X(3), F.Y(2), F.X(3), F.Y(2.4), { stroke: VERM, w: 1.6 }), line(F.X(7), F.Y(2), F.X(7), F.Y(2.4), { stroke: VERM, w: 1.6 }));
  g.push(text(F.X(5), F.Y(2.2) + 18, `shortage = ${qd} - ${qs} = ${short} cups`, { anchor: 'middle', size: 13, fill: VERM, bold: true }));
  g.push(text(F.X(3), F.Y(3) - 10, `Qs ${qs}`, { anchor: 'middle', size: 12, fill: VERM }), text(F.X(7), F.Y(3) - 10, `Qd ${qd}`, { anchor: 'middle', size: 12, fill: VERM }));
  g.push(text(540, 90, 'At $3 the quantities match:', { size: 13 }), text(540, 108, 'equilibrium E.', { size: 13 }), text(540, 146, 'At $2, buyers want 70 cups', { size: 13, fill: VERM }), text(540, 164, 'but sellers offer 40: a', { size: 13, fill: VERM }), text(540, 182, 'shortage of 30 cups, so the', { size: 13, fill: VERM }), text(540, 200, 'price is pushed up toward $3.', { size: 13, fill: VERM }));
  add('market-equilibrium', 'market-equilibrium-shortage', 800, 380, 'Equilibrium and a shortage below the equilibrium price',
    'Demand D and supply S for lemonade cross at E, an equilibrium price of $3. At a price of $2, the quantity demanded is 70 cups and the quantity supplied is 40, a shortage of 30 cups, which pushes the price up toward $3. Invented data for practice.',
    g.join('\n'), 'A supply and demand graph for lemonade with equilibrium E at $3; at a price of $2, quantity demanded (70 cups) exceeds quantity supplied (40 cups), a shortage of 30 cups.');
}
{ // market-equilibrium: both curves shift
  const g = [];
  const L = frame(70, 50, 250, 220, 'Quantity', 'Price', { size: 13 });
  g.push(text(195, 28, 'Demand up, supply up', { anchor: 'middle', bold: true, size: 15 }), ...L.g);
  g.push(curve(L, [1, 9], [9, 1], 'D_1', { stroke: GREY, dash: '7 5', w: 2 }), curve(L, [1, 1], [9, 9], 'S_1', { stroke: GREY, dash: '7 5', w: 2, dy: -2 }));
  g.push(curve(L, [2.5, 9], [9.5, 2], 'D_2', { stroke: CER }), curve(L, [2.5, 1], [9.5, 8], 'S_2'));
  g.push(dot(L.X(5), L.Y(5), { fill: GREY }), dot(L.X(6.5), L.Y(5), { fill: VERM }));
  g.push(text(195, 330, 'Quantity rises for sure;', { anchor: 'middle', size: 12, fill: GREY }), text(195, 346, 'price depends on the sizes.', { anchor: 'middle', size: 12, fill: GREY }));
  const R = frame(430, 50, 250, 220, 'Quantity', 'Price', { size: 13 });
  g.push(text(555, 28, 'Demand up, supply down', { anchor: 'middle', bold: true, size: 15 }), ...R.g);
  g.push(curve(R, [1, 9], [9, 1], 'D_1', { stroke: GREY, dash: '7 5', w: 2 }), curve(R, [1, 1], [9, 9], 'S_1', { stroke: GREY, dash: '7 5', w: 2, dy: 12 }));
  g.push(curve(R, [2.5, 9], [9.5, 2], 'D_2', { stroke: CER }), curve(R, [0, 1.5], [8, 9.5], 'S_2', { dx: -30, dy: -6 }));
  g.push(dot(R.X(5), R.Y(5), { fill: GREY }), dot(R.X(5), R.Y(6.5), { fill: VERM }));
  g.push(text(555, 330, 'Price rises for sure;', { anchor: 'middle', size: 12, fill: GREY }), text(555, 346, 'quantity depends on the sizes.', { anchor: 'middle', size: 12, fill: GREY }));
  add('market-equilibrium', 'market-equilibrium-double-shift', 740, 360, 'When both curves shift, one change is indeterminate',
    'Left: demand and supply both increase; the new crossing is to the right, so quantity rises, but whether price rises or falls depends on which shift is larger. Right: demand increases and supply decreases; the new crossing is higher, so price rises, but the change in quantity depends on the sizes of the shifts.',
    g.join('\n'), 'Two supply and demand graphs where both curves shift: when both increase, quantity rises but the price change is indeterminate; when demand rises and supply falls, price rises but the quantity change is indeterminate.');
}

mkdirSync(REG, { recursive: true });
for (const [topic, f] of Object.entries(figures)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(f, null, 1) + '\n');
console.log(`author A figures: ${Object.values(figures).reduce((n, f) => n + Object.keys(f).length, 0)} written`);
