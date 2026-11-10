/* AP® Microeconomics figures for the "Graph skills you need" chapter and
   Unit 1 (author A). Every graph is drawn from the coordinates listed here,
   so a figure shows exactly the curves and points its caption names; every
   number a figure prints (a slope, an area, an opportunity cost, a ratio) is
   computed by ApMicroCalc (microeconomics/assets/mic-calc.js) and matches the
   lesson, notes and questions that use it. Data are invented for practice and
   the captions say so.
   Writes
     microeconomics/figures/<id>.svg
     microeconomics/data/figures/<topic>.json   (the registry entries)

     node scripts/apmicro-figures/author-a.mjs

   Style: white background (the page inverts it in dark mode), role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, the course accent
   #7E1A5E for the curve that matters, cerulean #084F78 and vermillion
   #D55E00 for a second curve or a point, grey dashed for a curve before a
   shift. No word on a figure overlaps another: notes sit beside the plot. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Calc } from '../lib/apmicro-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'microeconomics', 'figures');
const REG = join(ROOT, 'microeconomics', 'data', 'figures');
const INK = '#1F2A28', ACC = '#7E1A5E', CER = '#084F78', VERM = '#D55E00', GREY = '#6B7370', SOFT = '#F7F3F6', TINT = '#F8E6F1', WARM = '#FBE6D9', SKY = '#E3EEF6';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = v => Math.round(v * 10) / 10;
const money = v => `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
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
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#${o.arrow})"` : ''}/>`;
const dot = (x, y, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${o.r || 5}" fill="${o.fill || INK}"/>`;
const poly = (pts, o = {}) => `<polygon points="${pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="${o.fill || TINT}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const path = (d, o = {}) => `<path d="${d}" fill="none" stroke="${o.stroke || ACC}" stroke-width="${o.w || 3}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
function markers(id) {
  return `<defs>${[['ar', INK], ['arA', ACC], ['arV', VERM], ['arC', CER], ['arG', GREY]].map(([k, c]) => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`;
}
function svgDoc(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">\n<title id="${id}-t">${esc(title)}</title>\n<desc id="${id}-d">${esc(desc)}</desc>\n${markers(id)}<rect width="${w}" height="${h}" fill="#FFFFFF"/>\n${body}\n</svg>\n`;
}

/* A plot frame: graph coordinates 0-10 on both axes inside a box (or the
   ranges xr, yr). */
function frame(x0, y0, w, h, xl, yl, o = {}) {
  const [xa, xb] = o.xr || [0, 10], [ya, yb] = o.yr || [0, 10];
  const X = v => x0 + (v - xa) / (xb - xa) * w, Y = v => y0 + h - (v - ya) / (yb - ya) * h;
  const g = [line(x0, y0 - 6, x0, y0 + h, { w: 2 }), line(x0, y0 + h, x0 + w + 6, y0 + h, { w: 2 })];
  g.push(text(x0 + w, y0 + h + (o.xlDy || 38), xl, { anchor: 'end', size: o.size || 14, bold: true }));
  g.push(text(x0 - (o.ylDx || 34), y0, yl, { anchor: 'end', size: o.size || 14, bold: true, rotate: -90 }));
  return { X, Y, g };
}
function ticks(F, xs, ys, o = {}) {
  const g = [];
  for (const v of xs) g.push(line(F.X(v), F.Y(o.y0 ?? 0), F.X(v), F.Y(o.y0 ?? 0) + 5, { stroke: GREY, w: 1.2 }), text(F.X(v), F.Y(o.y0 ?? 0) + 19, o.xf ? o.xf(v) : String(v), { anchor: 'middle', size: 12, fill: GREY }));
  for (const v of ys) g.push(line(F.X(o.x0 ?? 0) - 5, F.Y(v), F.X(o.x0 ?? 0), F.Y(v), { stroke: GREY, w: 1.2 }), text(F.X(o.x0 ?? 0) - 8, F.Y(v) + 4, o.yf ? o.yf(v) : String(v), { anchor: 'end', size: 12, fill: GREY }));
  return g.join('');
}
// A straight curve between two graph points, with a label at its end.
function curve(F, a, b, lab, o = {}) {
  const out = [line(F.X(a[0]), F.Y(a[1]), F.X(b[0]), F.Y(b[1]), { stroke: o.stroke || ACC, w: o.w || 3, dash: o.dash })];
  if (lab) out.push(text(F.X(b[0]) + (o.dx ?? 6), F.Y(b[1]) + (o.dy ?? 4), lab, { fill: o.stroke || ACC, bold: true, size: 15 }));
  return out.join('');
}
// Dashed guides from a point to both axes, with axis labels.
function guides(F, p, xl, yl, o = {}) {
  const out = [line(F.X(o.x0 ?? 0), F.Y(p[1]), F.X(p[0]), F.Y(p[1]), { stroke: GREY, w: 1.4, dash: '5 4' }), line(F.X(p[0]), F.Y(p[1]), F.X(p[0]), F.Y(o.y0 ?? 0), { stroke: GREY, w: 1.4, dash: '5 4' })];
  if (yl) out.push(text(F.X(o.x0 ?? 0) - 8, F.Y(p[1]) + 5, yl, { anchor: 'end', size: 13, fill: o.lfill || INK }));
  if (xl) out.push(text(F.X(p[0]), F.Y(o.y0 ?? 0) + 19, xl, { anchor: 'middle', size: 13, fill: o.lfill || INK }));
  if (!o.noDot) out.push(dot(F.X(p[0]), F.Y(p[1]), { fill: o.fill || INK }));
  return out.join('');
}
// A bowed-out PPC: a quarter ellipse through (xMax, 0) and (0, yMax).
function ppcPath(F, xm, ym) {
  const pts = [];
  for (let k = 0; k <= 90; k++) { const a = k / 90 * Math.PI / 2; pts.push(`${r1(F.X(xm * Math.sin(a)))} ${r1(F.Y(ym * Math.cos(a)))}`); }
  return 'M' + pts.join('L');
}
const ppcY = (x, xm, ym) => ym * Math.sqrt(Math.max(0, 1 - (x / xm) ** 2));
// A bowed-in PPC (decreasing opportunity cost), for the labeled contrast only.
function ppcInPath(F, xm, ym) {
  const pts = [];
  for (let k = 0; k <= 60; k++) { const u = k / 60; pts.push(`${r1(F.X(xm * u))} ${r1(F.Y(ym * (1 - u) / (1 + 2 * u)))}`); }
  return 'M' + pts.join('L');
}

const figures = {};
function add(topic, id, w, h, title, desc, body, alt) {
  if (!id.startsWith(topic)) throw new Error(`figure ${id} must start with its topic id ${topic}`);
  writeFileSync(join(FIG, `${id}.svg`), svgDoc(id, w, h, title, desc, body));
  (figures[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* ----------------------------------------------------- graph skills */
{ // axes-points: three ordered pairs from the taco truck table (questions axes-points-s1, notes)
  const rows = [[1, 120], [2, 100], [3, 80], [4, 60], [5, 40]]; // price per taco ($), tacos sold a day (invented)
  const F = frame(100, 30, 440, 300, 'Tacos sold per day', 'Price per taco ($)', { xr: [0, 140], yr: [0, 6] });
  const g = [...F.g, ticks(F, [20, 40, 60, 80, 100, 120], [1, 2, 3, 4, 5])];
  const pts = [[40, 5, 'J'], [80, 3, 'K'], [120, 1, 'L']];
  for (const [q, p, n] of pts) {
    if (!rows.some(r => r[0] === p && r[1] === q)) throw new Error('axes-points: a plotted point is not in the table');
    g.push(guides(F, [q, p], null, null, { fill: ACC }), text(F.X(q) + 10, F.Y(p) - 9, `${n} (${q}, ${p})`, { size: 14, bold: true, fill: ACC }));
  }
  g.push(text(580, 80, 'Read each point as', { size: 13 }), text(580, 98, '(horizontal, vertical):', { size: 13 }), text(580, 124, 'J: 40 tacos at $5', { size: 13, fill: ACC }), text(580, 144, 'K: 80 tacos at $3', { size: 13, fill: ACC }), text(580, 164, 'L: 120 tacos at $1', { size: 13, fill: ACC }));
  g.push(text(580, 204, 'As the price falls,', { size: 13, fill: GREY }), text(580, 222, 'more tacos are sold:', { size: 13, fill: GREY }), text(580, 240, 'an inverse relationship.', { size: 13, fill: GREY }));
  add('axes-points', 'axes-points-pairs', 780, 390, 'Plotting ordered pairs from a table',
    'A graph with Tacos sold per day on the horizontal axis (0 to 140) and Price per taco in dollars on the vertical axis (0 to 6). Three points with dashed lines to both axes: J at 40 tacos and $5, K at 80 tacos and $3, L at 120 tacos and $1. As the price falls the number sold rises, an inverse relationship. Invented data for practice.',
    g.join('\n'), 'A labeled graph with tacos sold per day across the bottom and price per taco up the side, showing three points, J (40, 5), K (80, 3) and L (120, 1), each with dashed lines to both axes; the points fall to the right, an inverse relationship.');
}
{ // slopes-curves: four shapes, with the rise and run of the first worked out
  const rise = Calc.sub(6, 3), run = Calc.sub(6, 2), slopeUp = Calc.div(rise, run); // (2, 3) to (6, 6)
  const g = [];
  const panel = (i, head, note1, note2) => { const x0 = 40 + (i % 2) * 360, y0 = 40 + Math.floor(i / 2) * 270; g.push(text(x0 + 150, y0, head, { anchor: 'middle', bold: true, size: 15 })); const F = frame(x0 + 40, y0 + 20, 220, 150, 'x', 'y', { size: 13, xlDy: 30, ylDx: 16 }); g.push(...F.g, text(x0 + 150, y0 + 212, note1, { anchor: 'middle', size: 12, fill: GREY }), text(x0 + 150, y0 + 228, note2, { anchor: 'middle', size: 12, fill: GREY })); return F; };
  const A = panel(0, 'Upward sloping: positive slope', `slope = rise / run = ${rise} / ${run} = ${slopeUp}`, 'both variables rise together');
  g.push(curve(A, [1, 2.25], [9, 8.25], null), line(A.X(2), A.Y(3), A.X(6), A.Y(3), { stroke: CER, w: 2, dash: '5 4' }), line(A.X(6), A.Y(3), A.X(6), A.Y(6), { stroke: VERM, w: 2, dash: '5 4' }), dot(A.X(2), A.Y(3)), dot(A.X(6), A.Y(6)));
  g.push(text(A.X(4), A.Y(3) + 17, `run ${run}`, { anchor: 'middle', size: 12, fill: CER, bold: true }), text(A.X(6) + 8, A.Y(4.5) + 4, `rise ${rise}`, { size: 12, fill: VERM, bold: true }));
  const B = panel(1, 'Downward sloping: negative slope', 'the rise is negative: one variable', 'falls as the other rises');
  g.push(curve(B, [1, 9], [9, 1], null, { stroke: CER }));
  const C = panel(2, 'Flat and straight up', 'horizontal: slope 0 (y never changes)', 'vertical: x never changes');
  g.push(curve(C, [0.5, 6], [9.5, 6], null, { stroke: VERM }), curve(C, [6.5, 0.5], [6.5, 9.5], null, { stroke: GREY }), text(C.X(1), C.Y(6) - 8, 'horizontal', { size: 12, fill: VERM }), text(C.X(6.5) + 6, C.Y(9) + 4, 'vertical', { size: 12, fill: GREY }));
  const D = panel(3, 'U-shaped: falls, bottoms out, rises', 'negative slope, then 0 at the', 'minimum point, then positive');
  const pts = []; for (let k = 0; k <= 40; k++) { const x = 1 + k * 0.2; pts.push(`${r1(D.X(x))} ${r1(D.Y(2 + 0.28 * (x - 5) ** 2))}`); }
  g.push(path('M' + pts.join('L'), { stroke: ACC }), guides(D, [5, 2], null, null, { fill: VERM }), text(D.X(5) + 8, D.Y(2) + 18, 'minimum point', { size: 12, fill: VERM, bold: true }));
  add('slopes-curves', 'slopes-curves-shapes', 740, 580, 'Curve shapes and what their slopes say',
    `Four small graphs. Upward sloping: from the point (2, 3) to (6, 6) the rise is ${rise} and the run is ${run}, so the slope is ${slopeUp}, positive. Downward sloping: a negative slope, one variable falls as the other rises. Flat and straight up: a horizontal line has a slope of 0; on a vertical line the horizontal value never changes. U-shaped: the slope is negative, then 0 at the minimum point, then positive.`,
    g.join('\n'), `Four small graphs: an upward line with its rise of ${rise} over a run of ${run} marked (slope ${slopeUp}), a downward line (negative slope), a horizontal and a vertical line, and a U-shaped curve with its minimum point marked.`);
}
{ // shifts-movements: the bakery (questions shifts-movements-s1, notes)
  const g = [];
  const L = frame(80, 50, 240, 220, 'Croissants sold per day', 'Price', { size: 13 });
  g.push(text(200, 28, 'Movement along the curve', { anchor: 'middle', bold: true, size: 15 }), ...L.g, curve(L, [1, 9], [9, 1], 'D'));
  g.push(dot(L.X(3), L.Y(7), { fill: VERM }), text(L.X(3) + 9, L.Y(7) - 8, 'J', { bold: true, fill: VERM }), dot(L.X(5), L.Y(5), { fill: VERM }), text(L.X(5) + 9, L.Y(5) - 8, 'K', { bold: true, fill: VERM }));
  g.push(line(L.X(3.3), L.Y(6.3), L.X(4.6), L.Y(5.0), { stroke: VERM, w: 2, arrow: 'shifts-movements-bakery-arV' }));
  g.push(text(L.X(0) - 8, L.Y(7) + 4, '$4', { anchor: 'end', size: 12, fill: GREY }), text(L.X(0) - 8, L.Y(5) + 4, '$3', { anchor: 'end', size: 12, fill: GREY }));
  g.push(text(200, 330, 'The price falls from $4 to $3: the same', { anchor: 'middle', size: 12, fill: GREY }), text(200, 346, 'curve, a new point (J to K).', { anchor: 'middle', size: 12, fill: GREY }));
  const R = frame(440, 50, 240, 220, 'Croissants sold per day', 'Price', { size: 13 });
  g.push(text(560, 28, 'Shift of the curve', { anchor: 'middle', bold: true, size: 15 }), ...R.g, curve(R, [0.5, 8.5], [7.5, 1.5], 'D_1', { stroke: GREY, dash: '7 5', w: 2.5 }), curve(R, [2.5, 8.5], [9.5, 1.5], 'D_2'));
  g.push(line(R.X(4.2), R.Y(5), R.X(5.9), R.Y(5), { stroke: ACC, w: 2.2, arrow: 'shifts-movements-bakery-arA' }));
  g.push(text(560, 330, 'An office opens next door: more', { anchor: 'middle', size: 12, fill: GREY }), text(560, 346, 'croissants are bought at every price.', { anchor: 'middle', size: 12, fill: GREY }));
  add('shifts-movements', 'shifts-movements-bakery', 740, 360, 'A movement along a curve and a shift of the curve',
    'Left: one downward curve D for a bakery\'s croissants, with an arrow from point J ($4) down to point K ($3): a lower price, more croissants sold, the same curve. Right: the curve D1 dashed and a new curve D2 to its right, with an arrow pointing right: an office opened next door, so more croissants are bought at every price. Invented example.',
    g.join('\n'), 'Two graphs side by side for a bakery\'s croissants. Left: a movement along one curve D from point J at $4 to point K at $3. Right: the whole curve shifts right from D1 to D2 after an office opens next door.');
}
{ // curves-crossing: the crossing point and the two areas (questions curves-crossing-s1, notes)
  // D: P = 10 - Q/10, S: P = Q/10 (Q in units of 10 on the drawn 0-100 axis); they cross at Q 50, P $5.
  const q = 50, p = 5, top = 10;
  const tri = Calc.triangle(q, Calc.sub(top, p)), box = Calc.rectangle(q, p);
  const F = frame(100, 30, 400, 300, 'Quantity (boxes per week)', 'Price ($)', { xr: [0, 100], yr: [0, 10] });
  const g = [...F.g];
  g.push(poly([[F.X(0), F.Y(top)], [F.X(q), F.Y(p)], [F.X(0), F.Y(p)]], { fill: TINT, stroke: ACC }));
  g.push(`<rect x="${r1(F.X(0))}" y="${r1(F.Y(p))}" width="${r1(F.X(q) - F.X(0))}" height="${r1(F.Y(0) - F.Y(p))}" fill="${SKY}" fill-opacity="0.75" stroke="${CER}" stroke-width="1.5" stroke-dasharray="6 4"/>`);
  g.push(ticks(F, [25, 50, 75, 100], [2, 4, 6, 8, 10]));
  g.push(curve(F, [0, 10], [100, 0], 'D', { stroke: ACC, dy: -6 }), curve(F, [0, 0], [100, 10], 'S', { stroke: VERM, dy: 14 }));
  g.push(guides(F, [q, p], null, null), text(F.X(q) + 10, F.Y(p) + 4, 'E (50, $5)', { bold: true, size: 14 }));
  g.push(text(F.X(14), F.Y(6.4), 'A', { bold: true, size: 18, fill: ACC }), text(F.X(22), F.Y(2.4), 'B', { bold: true, size: 18, fill: CER }));
  g.push(text(540, 70, 'Where D and S cross: E,', { size: 13 }), text(540, 88, 'a price of $5 and 50 boxes.', { size: 13 }));
  g.push(text(540, 130, 'Triangle A (under D, above $5):', { size: 13, fill: ACC, bold: true }), text(540, 150, `½ × base × height`, { size: 13, fill: ACC }), text(540, 170, `= ½ × ${q} × ${top - p} = ${tri}`, { size: 13, fill: ACC }));
  g.push(text(540, 212, 'Rectangle B (under $5, out to 50):', { size: 13, fill: CER, bold: true }), text(540, 232, 'base × height', { size: 13, fill: CER }), text(540, 252, `= ${q} × ${p} = ${box}`, { size: 13, fill: CER }));
  g.push(text(540, 294, 'Read the base on the horizontal', { size: 12, fill: GREY }), text(540, 310, 'axis and the height on the vertical.', { size: 12, fill: GREY }));
  add('curves-crossing', 'curves-crossing-areas', 800, 390, 'Where two curves cross, and the areas a triangle and a rectangle make',
    `A downward curve D from $10 at zero to zero at 100 boxes, and an upward curve S from zero to $10 at 100 boxes, cross at E: a price of $5 and a quantity of 50 boxes. Triangle A lies under D and above $5, from 0 to 50 boxes: area ½ × 50 × 5 = ${tri}. Rectangle B lies under $5 from 0 to 50 boxes: area 50 × 5 = ${box}. Invented data for practice.`,
    g.join('\n'), `A graph where a downward curve D and an upward curve S cross at E, 50 boxes at $5. A shaded triangle A under D and above $5 has area ${tri}; a shaded rectangle B under $5 out to 50 boxes has area ${box}.`);
}

/* ------------------------------------------------------------ unit 1 */
{ // scarcity: wants, resources and the next-best choice (Maya's Saturday, lesson and notes)
  const opts = [['Lifeguard shift', 96], ['Tutoring', 60], ['Pickup soccer', 40]];
  const oc = Calc.max(opts[1][1], opts[2][1]);
  const g = [];
  g.push(rect(30, 40, 230, 110, { fill: WARM, stroke: VERM }), text(145, 74, 'Wants', { anchor: 'middle', bold: true, size: 18 }), text(145, 100, 'more goods, services and', { anchor: 'middle', size: 13 }), text(145, 118, 'time than anyone can have', { anchor: 'middle', size: 13 }));
  g.push(rect(30, 180, 230, 180, { fill: TINT, stroke: ACC }), text(145, 212, 'Resources (limited)', { anchor: 'middle', bold: true, size: 17 }));
  ['Land: natural resources', 'Labor: human effort', 'Capital: tools, machines,', '   buildings', 'Entrepreneurship: organizing', '   and taking risks'].forEach((s, i) => g.push(text(46, 240 + i * 20, s, { size: 13 })));
  g.push(line(266, 96, 330, 180, { w: 2.4, arrow: 'scarcity-choice-ar' }), line(266, 270, 330, 206, { w: 2.4, arrow: 'scarcity-choice-ar' }));
  g.push(rect(336, 150, 130, 86, { fill: SOFT, stroke: INK }), text(401, 186, 'Scarcity', { anchor: 'middle', bold: true, size: 17 }), text(401, 208, 'so every choice', { anchor: 'middle', size: 13 }), text(401, 224, 'has a trade-off', { anchor: 'middle', size: 13 }));
  g.push(line(470, 193, 510, 193, { w: 2.4, arrow: 'scarcity-choice-ar' }));
  g.push(text(520, 52, "Maya's Saturday: pick one", { bold: true, size: 15 }));
  opts.forEach(([n, v], i) => { const y = 70 + i * 62; g.push(rect(520, y, 250, 48, { fill: i === 0 ? TINT : '#FFFFFF', stroke: i === 0 ? ACC : i === 1 ? CER : GREY }), text(535, y + 30, n, { size: 14, bold: true, fill: i === 0 ? ACC : INK }), text(755, y + 30, `worth $${v}`, { anchor: 'end', size: 14 })); });
  g.push(text(520, 278, 'She picks the shift. The opportunity cost', { size: 13, fill: CER, bold: true }), text(520, 298, `is the next-best choice: tutoring, $${oc}.`, { size: 13, fill: CER, bold: true }), text(520, 324, 'Not $60 + $40: she could only have', { size: 13, fill: GREY }), text(520, 342, 'done one of the other two.', { size: 13, fill: GREY }));
  add('scarcity', 'scarcity-choice', 800, 380, 'Scarcity forces a choice, and the next-best choice is its opportunity cost',
    `Unlimited wants and limited resources (land, labor, capital and entrepreneurship) create scarcity, so every choice has a trade-off. Example: Maya can spend Saturday on one of three things: a lifeguard shift worth $96, tutoring worth $60 or pickup soccer worth $40 to her. She picks the shift. Its opportunity cost is the next-best choice, tutoring at $${oc}, not the $100 of both others together. Invented example.`,
    g.join('\n'), `A diagram: unlimited wants and limited resources (land, labor, capital, entrepreneurship) create scarcity, so every choice has a trade-off. Maya picks a $96 lifeguard shift over $60 of tutoring and $40 of soccer; the opportunity cost is the next-best choice, $${oc}.`);
}
{ // economic-systems: three systems side by side
  const g = [];
  const cols = [['Market economy', CER, ['Households and firms decide', 'Prices coordinate choices', 'Private property, contracts', 'Firms seek profit', 'Buyers choose what to buy']], ['Command economy', VERM, ['A central authority decides', 'Plans and orders coordinate', 'The state owns most factories', 'Output targets set from above']], ['Mixed economy', ACC, ['Markets decide most things', 'Government sets rules, taxes', 'Government provides some goods', 'Prices plus laws coordinate', 'Every real economy is mixed']]];
  g.push(text(400, 32, 'Every system answers the same three questions: what, how and for whom', { anchor: 'middle', bold: true, size: 15 }));
  cols.forEach(([h, c, lines], i) => { const x = 30 + i * 255; g.push(rect(x, 54, 235, 250, { fill: '#FFFFFF', stroke: c, w: 2 }), rect(x, 54, 235, 42, { fill: c, stroke: c, rx: 8 }), text(x + 117, 82, h, { anchor: 'middle', bold: true, size: 16, fill: '#FFFFFF' })); lines.forEach((s, j) => g.push(text(x + 14, 126 + j * 30, s, { size: 13 }))); });
  g.push(text(400, 330, 'A spectrum, not three boxes: real economies sit between the two ends.', { anchor: 'middle', size: 13, fill: GREY }));
  g.push(line(60, 350, 740, 350, { stroke: GREY, w: 2, arrow: 'economic-systems-compare-arG' }), line(740, 350, 60, 350, { stroke: GREY, w: 2, arrow: 'economic-systems-compare-arG' }), text(60, 372, 'more decided by markets', { size: 12, fill: CER }), text(740, 372, 'more decided by a central plan', { size: 12, fill: VERM, anchor: 'end' }));
  add('economic-systems', 'economic-systems-compare', 800, 390, 'Market, command and mixed economies',
    'Three columns. Market economy: households and firms decide, prices coordinate choices, private property and contracts, firms seek profit and buyers choose. Command economy: a central authority decides, plans and orders coordinate, the state owns most factories and land, output targets are set from above. Mixed economy: markets decide most things while government sets rules and taxes and provides some goods; every real economy is mixed. Below, a two-way arrow from more decided by markets to more decided by a central plan.',
    g.join('\n'), 'Three columns comparing a market economy (prices and private choices coordinate), a command economy (a central plan coordinates) and a mixed economy (markets plus government rules), above a spectrum from market to central plan.');
}
{ // production-possibilities: points on, inside and outside, and growth (stimulus production-possibilities-s2, lesson, notes)
  const F = frame(100, 30, 420, 320, 'Corn (truckloads)', 'Beans (truckloads)', { xr: [0, 6], yr: [0, 25] });
  const g = [...F.g, ticks(F, [1, 2, 3, 4, 5, 6], [5, 10, 15, 20, 25])];
  // The table A-E: corn 0..4, beans 20, 19, 17, 13, 6 (the bank's data set s1).
  const T = [[0, 20, 'A'], [1, 19, 'B'], [2, 17, 'C'], [3, 13, 'D'], [4, 6, 'E']];
  const grow = T.map(([c, b]) => [c * 1.2, b * 1.2]);
  const pd = pts => 'M' + pts.map(([x, y]) => `${r1(F.X(x))} ${r1(F.Y(y))}`).join('L');
  // smooth through the table points (and the corn axis at 4.4)
  const smooth = pts => { let d = `M${r1(F.X(pts[0][0]))} ${r1(F.Y(pts[0][1]))}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]; d += `C${r1(F.X(c1[0]))} ${r1(F.Y(c1[1]))} ${r1(F.X(c2[0]))} ${r1(F.Y(c2[1]))} ${r1(F.X(p2[0]))} ${r1(F.Y(p2[1]))}`; } return d; };
  void pd;
  g.push(path(smooth([...grow, [4.4 * 1.2, 0]]), { stroke: GREY, w: 2.4, dash: '7 5' }), text(F.X(1.6), F.Y(24.6), 'PPC_2', { fill: GREY, bold: true }));
  g.push(path(smooth([...T.map(([c, b]) => [c, b]), [4.4, 0]]), { stroke: ACC, w: 3.2 }), text(F.X(3.55), F.Y(12.5), 'PPC_1', { fill: ACC, bold: true }));
  for (const [c, b, n] of T) g.push(dot(F.X(c), F.Y(b), { fill: ACC, r: 4.5 }), text(F.X(c) + (n === 'A' ? 8 : 7), F.Y(b) - 8, n, { bold: true, fill: ACC, size: 14 }));
  g.push(dot(F.X(2), F.Y(10), { fill: CER }), text(F.X(2) + 9, F.Y(10) + 5, 'U (2, 10)', { bold: true, fill: CER, size: 14 }));
  g.push(dot(F.X(3), F.Y(16), { fill: VERM }), text(F.X(3) + 8, F.Y(16) - 7, 'Z', { bold: true, fill: VERM, size: 14 }));
  g.push(line(F.X(3.9), F.Y(9.5), F.X(4.5), F.Y(12), { stroke: GREY, w: 2, arrow: 'production-possibilities-points-arG' }));
  g.push(text(560, 80, 'A to E: on the curve, efficient', { size: 13, fill: ACC }), text(560, 104, 'U: inside, workers or land idle', { size: 13, fill: CER }), text(560, 128, 'Z (3, 16): outside, not reachable now', { size: 13, fill: VERM }), text(560, 168, 'PPC2: more resources or better', { size: 13, fill: GREY }), text(560, 186, 'methods let the farm reach Z', { size: 13, fill: GREY }));
  g.push(text(560, 230, 'Each extra truckload of corn', { size: 13 }), text(560, 248, 'costs more beans: 1, 2, 4, then 7.', { size: 13 }), text(560, 266, 'The curve bows out.', { size: 13 }));
  [[1, 0], [2, 1], [4, 2], [7, 3]].forEach(([want, i]) => { const got = Calc.opportunityCost(Calc.sub(T[i][1], T[i + 1][1]), Calc.sub(T[i + 1][0], T[i][0])); if (got !== want) throw new Error('production-possibilities: opportunity cost label changed'); });
  add('production-possibilities', 'production-possibilities-points', 820, 400, "A farm's production possibilities curve: on, inside, outside and growth",
    "A bowed-out PPC1 for Corn (truckloads, horizontal) and Beans (truckloads, vertical) through the combinations A (0 corn, 20 beans), B (1, 19), C (2, 17), D (3, 13) and E (4, 6). Point U (2 corn, 10 beans) lies inside: some workers or land sit idle. Point Z (3 corn, 16 beans) lies outside: it cannot be produced now. A dashed PPC2 farther out shows growth from more resources or better methods. Each extra truckload of corn costs 1, 2, 4 and then 7 truckloads of beans, so the curve bows out. Invented data for practice.",
    g.join('\n'), "A bowed-out production possibilities curve for a farm's corn and beans through points A to E, with point U inside (idle resources), point Z outside (unattainable now) and a dashed outward-shifted curve PPC2 (growth).");
}
{ // production-possibilities: three shapes, bowed in only as the labeled contrast (notes)
  const g = [];
  const shapes = [['Bowed out', 'increasing opportunity cost', 'resources suit one good more than', 'the other: the usual case', 'out'], ['Straight line', 'constant opportunity cost', 'resources are equally good at', 'both goods', 'line'], ['Bowed in (contrast)', 'decreasing opportunity cost', 'each extra unit costs less of the', 'other good: rare, shown to compare', 'in']];
  shapes.forEach(([h, s1, s2, s3, k], i) => {
    const x0 = 30 + i * 255;
    g.push(text(x0 + 115, 30, h, { anchor: 'middle', bold: true, size: 15 }));
    const F = frame(x0 + 40, 50, 180, 170, 'Good A', 'Good B', { size: 13, xlDy: 30, ylDx: 16 });
    g.push(...F.g);
    if (k === 'out') g.push(path(ppcPath(F, 8.5, 8.5), { stroke: ACC }));
    if (k === 'line') g.push(curve(F, [0, 8.5], [8.5, 0], null, { stroke: CER }));
    if (k === 'in') g.push(path(ppcInPath(F, 8.5, 8.5), { stroke: GREY, dash: '7 5' }));
    g.push(text(x0 + 115, 275, s1, { anchor: 'middle', size: 13, bold: true, fill: k === 'out' ? ACC : k === 'line' ? CER : GREY }), text(x0 + 115, 295, s2, { anchor: 'middle', size: 12, fill: GREY }), text(x0 + 115, 311, s3, { anchor: 'middle', size: 12, fill: GREY }));
  });
  add('production-possibilities', 'production-possibilities-shapes', 800, 330, 'Three PPC shapes and the opportunity cost each shows',
    'Three production possibilities curves for Good A and Good B. Bowed out: increasing opportunity cost, because resources suit one good more than the other; the usual case. A straight line: constant opportunity cost, because resources are equally good at both goods. Bowed in, dashed and labeled as a contrast: decreasing opportunity cost, each extra unit costs less of the other good.',
    g.join('\n'), 'Three production possibilities curves side by side: bowed out (increasing opportunity cost), a straight line (constant opportunity cost) and, as a labeled contrast, bowed in (decreasing opportunity cost).');
}
{ // comparative-advantage: two workshops (questions comparative-advantage-s1, lesson, notes)
  const fen = { chairs: 12, tables: 6 }, gar = { chairs: 8, tables: 2 }; // per day (invented)
  const oc = { fT: Calc.opportunityCost(fen.chairs, fen.tables), gT: Calc.opportunityCost(gar.chairs, gar.tables), fC: Calc.opportunityCost(fen.tables, fen.chairs), gC: Calc.opportunityCost(gar.tables, gar.chairs) };
  const F = frame(100, 30, 400, 300, 'Chairs per day', 'Tables per day', { xr: [0, 14], yr: [0, 7] });
  const g = [...F.g, ticks(F, [2, 4, 6, 8, 10, 12, 14], [1, 2, 3, 4, 5, 6, 7])];
  g.push(curve(F, [0, fen.tables], [fen.chairs, 0], null), text(F.X(5.6), F.Y(3.6), 'Fenwick', { fill: ACC, bold: true, size: 15 }));
  g.push(curve(F, [0, gar.tables], [gar.chairs, 0], null, { stroke: CER }), text(F.X(1.2), F.Y(1.0), 'Garnet', { fill: CER, bold: true, size: 15 }));
  g.push(text(540, 64, 'Opportunity cost of 1 table:', { size: 14, bold: true }), text(540, 88, `Fenwick ${oc.fT} chairs`, { size: 13, fill: ACC }), text(540, 108, `Garnet ${oc.gT} chairs`, { size: 13, fill: CER }));
  g.push(text(540, 148, 'Opportunity cost of 1 chair:', { size: 14, bold: true }), text(540, 172, `Fenwick ${oc.fC} table`, { size: 13, fill: ACC }), text(540, 192, `Garnet ${oc.gC} table`, { size: 13, fill: CER }));
  g.push(text(540, 232, 'Lower cost of tables: Fenwick', { size: 13, bold: true }), text(540, 252, 'Lower cost of chairs: Garnet', { size: 13, bold: true }));
  g.push(text(540, 290, 'A price between 2 and 4 chairs', { size: 13, fill: GREY }), text(540, 308, 'per table helps both workshops.', { size: 13, fill: GREY }));
  if (oc.fT !== 2 || oc.gT !== 4 || oc.fC !== 0.5 || oc.gC !== 0.25) throw new Error('comparative-advantage: labels changed');
  add('comparative-advantage', 'comparative-advantage-workshops', 800, 390, 'Two workshops, two straight PPCs, two opportunity costs',
    `Production possibilities for one day. Fenwick Workshop can make 12 chairs or 6 tables; Garnet Workshop can make 8 chairs or 2 tables. One table costs Fenwick ${oc.fT} chairs and Garnet ${oc.gT}, so Fenwick has the comparative advantage in tables; one chair costs Fenwick ${oc.fC} table and Garnet ${oc.gC}, so Garnet has the comparative advantage in chairs, even though Fenwick makes more of both. A price between 2 and 4 chairs per table helps both. Invented data for practice.`,
    g.join('\n'), `Two straight production possibilities lines for one day: Fenwick Workshop, 12 chairs or 6 tables, and Garnet Workshop, 8 chairs or 2 tables. A table costs Fenwick ${oc.fT} chairs and Garnet ${oc.gT}; a chair costs Fenwick ${oc.fC} table and Garnet ${oc.gC}.`);
}
{ // cost-benefit: total benefit, cost and net benefit of guitar lessons (questions cost-benefit-s2, lesson, notes)
  const n = [0, 1, 2, 3, 4, 5], tb = [0, 50, 90, 120, 140, 150], tc = n.map(k => Calc.mul(k, 25));
  const net = n.map((k, i) => Calc.sub(tb[i], tc[i]));
  const best = net.indexOf(Calc.max(...net));
  const F = frame(100, 30, 420, 300, 'Guitar lessons per month', 'Dollars', { xr: [-0.5, 5.5], yr: [0, 160] });
  const g = [...F.g, ticks(F, [], [20, 40, 60, 80, 100, 120, 140, 160], { x0: -0.5 })];
  n.forEach((k, i) => {
    const w = 0.24;
    g.push(`<rect x="${r1(F.X(k - w - 0.02))}" y="${r1(F.Y(tb[i]))}" width="${r1(F.X(w) - F.X(0))}" height="${r1(F.Y(0) - F.Y(tb[i]))}" fill="${ACC}"/>`);
    g.push(`<rect x="${r1(F.X(k + 0.02))}" y="${r1(F.Y(tc[i]))}" width="${r1(F.X(w) - F.X(0))}" height="${r1(F.Y(0) - F.Y(tc[i]))}" fill="${CER}"/>`);
    g.push(text(F.X(k), F.Y(0) + 19, String(k), { anchor: 'middle', size: 12, fill: GREY }));
    g.push(text(F.X(k), F.Y(Math.max(tb[i], tc[i])) - 8, `net ${net[i]}`, { anchor: 'middle', size: 11, fill: i === best ? VERM : GREY, bold: i === best }));
  });
  g.push(rect(560, 60, 16, 16, { fill: ACC, rx: 2 }), text(584, 74, 'Total benefit', { size: 13 }), rect(560, 88, 16, 16, { fill: CER, rx: 2 }), text(584, 102, 'Cost ($25 a lesson)', { size: 13 }));
  g.push(text(560, 144, 'Net benefit = total benefit', { size: 13 }), text(560, 162, 'minus the full cost.', { size: 13 }), text(560, 196, `It is largest at ${best} lessons:`, { size: 13, fill: VERM, bold: true }), text(560, 214, `$${tb[best]} - $${tc[best]} = $${net[best]}.`, { size: 13, fill: VERM, bold: true }));
  g.push(text(560, 252, 'More lessons still add benefit,', { size: 12, fill: GREY }), text(560, 268, 'but they add more cost than', { size: 12, fill: GREY }), text(560, 284, 'benefit after the third.', { size: 12, fill: GREY }));
  if (best !== 3) throw new Error('cost-benefit: the best quantity changed');
  add('cost-benefit', 'cost-benefit-net', 800, 380, 'Total benefit, cost and net benefit',
    `Paired bars for 0 to 5 guitar lessons a month: total benefit $0, $50, $90, $120, $140 and $150, and the cost at $25 a lesson, $0 to $125. Net benefit, total benefit minus cost, is 0, 25, 40, 45, 40 and 25 dollars, largest at ${best} lessons ($${net[best]}). Invented data for practice.`,
    g.join('\n'), `A bar chart of total benefit and cost for 0 to 5 guitar lessons a month at $25 a lesson; net benefit is largest, $${net[best]}, at ${best} lessons. Invented data.`);
}
{ // marginal-analysis: marginal utility per dollar for tacos and smoothies (questions marginal-analysis-s1, lesson, notes)
  const muT = [20, 16, 12, 8, 4], pT = 2, muS = [48, 32, 24, 16], pS = 4, budget = 12;
  const rT = muT.map(m => Calc.muPerDollar(m, pT)), rS = muS.map(m => Calc.muPerDollar(m, pS));
  const best = Calc.utilityMax(muT, pT, muS, pS, budget);
  if (best.x !== 2 || best.y !== 2 || best.tu !== 116) throw new Error('marginal-analysis: the best bundle changed');
  const g = [];
  g.push(text(400, 30, `Leo has $${budget}. Tacos cost $${pT}, smoothies $${pS}. Buy the unit with the higher MU per dollar first.`, { anchor: 'middle', size: 14, bold: true }));
  const cols = ['Unit', 'MU taco', 'MU / $2', 'MU smoothie', 'MU / $4'];
  const x0 = 60, cw = [80, 110, 110, 130, 110], y0 = 60, rh = 36;
  let x = x0;
  cols.forEach((c, j) => { g.push(rect(x, y0, cw[j], rh, { fill: j === 2 ? TINT : j === 4 ? SKY : SOFT, stroke: GREY, rx: 0, w: 1 }), text(x + cw[j] / 2, y0 + 23, c, { anchor: 'middle', size: 13, bold: true })); x += cw[j]; });
  for (let i = 0; i < 5; i++) {
    const vals = [String(i + 1), String(muT[i]), String(rT[i]), muS[i] != null ? String(muS[i]) : '', rS[i] != null ? String(rS[i]) : ''];
    x = x0;
    vals.forEach((v, j) => {
      const pick = (j === 2 && i < best.x) || (j === 4 && i < best.y);
      g.push(rect(x, y0 + rh * (i + 1), cw[j], rh, { fill: pick ? (j === 2 ? TINT : SKY) : '#FFFFFF', stroke: GREY, rx: 0, w: 1 }), text(x + cw[j] / 2, y0 + rh * (i + 1) + 23, v, { anchor: 'middle', size: 13, bold: pick, fill: pick ? (j === 2 ? ACC : CER) : INK }));
      x += cw[j];
    });
  }
  g.push(text(620, 110, 'The best bundle:', { size: 14, bold: true }), text(620, 134, `${best.x} tacos and ${best.y} smoothies`, { size: 13 }), text(620, 154, `costs $${best.x * pT} + $${best.y * pS} = $${budget}`, { size: 13 }), text(620, 186, 'The last taco and the last', { size: 13 }), text(620, 204, 'smoothie each give 8 per', { size: 13 }), text(620, 222, 'dollar: the ratios are equal.', { size: 13 }), text(620, 256, `Total utility: ${best.tu}`, { size: 13, bold: true, fill: VERM }));
  g.push(text(400, 297, 'MU falls with each extra unit (diminishing marginal utility). Invented data.', { anchor: 'middle', size: 12, fill: GREY }));
  add('marginal-analysis', 'marginal-analysis-per-dollar', 800, 310, 'Marginal utility per dollar picks the best bundle',
    `A table for Leo, who has $${budget} to spend on tacos at $${pT} and smoothies at $${pS}. Marginal utility of tacos 20, 16, 12, 8, 4 (per dollar 10, 8, 6, 4, 2); of smoothies 48, 32, 24, 16 (per dollar 12, 8, 6, 4). The best bundle is ${best.x} tacos and ${best.y} smoothies, which spends the whole $${budget}; the last of each gives 8 utils per dollar, and total utility is ${best.tu}. Invented data for practice.`,
    g.join('\n'), `A marginal utility table for tacos ($${pT}) and smoothies ($${pS}) with a $${budget} budget; the best bundle, ${best.x} tacos and ${best.y} smoothies, equalizes marginal utility per dollar at 8 and gives total utility ${best.tu}.`);
}

mkdirSync(REG, { recursive: true });
mkdirSync(FIG, { recursive: true });
for (const [topic, f] of Object.entries(figures)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(f, null, 1) + '\n');
console.log(`author A figures: ${Object.values(figures).reduce((n, f) => n + Object.keys(f).length, 0)} written`);
