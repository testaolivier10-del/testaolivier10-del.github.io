/* AP® Microeconomics figures for Unit 4, topics 4.1-4.5 (author D). The
   graphs are drawn from the course graph engine's own curves
   (microeconomics/assets/mic-graph.js), so MC passes through the minimum of
   ATC exactly and every point (MR = MC, P = MC, P = ATC, the tangency) is
   where the engine and the grader put it. Graphs a student works on are
   graph specs in the question files; these are the static lesson and notes
   figures.
   Writes
     microeconomics/figures/<id>.svg
     microeconomics/data/figures/<topic>.json   (the registry entries)

     node scripts/apmicro-figures/author-d.mjs

   Style: white background, role="img" with <title> and <desc>,
   Arial/Helvetica, ink #1F2A28, the course accent #7E1A5E for emphasis,
   Okabe-Ito blue #0072B2 and vermillion #D55E00 for a second curve and for
   arrows. Every graph labels both axes and every curve (the authoring guide's
   graph rules); shaded areas carry a word label or a key. */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'microeconomics', 'figures');
const REG = join(ROOT, 'microeconomics', 'data', 'figures');
const sandbox = {};
sandbox.globalThis = sandbox;
vm.runInNewContext(readFileSync(join(ROOT, 'microeconomics', 'assets', 'mic-graph.js'), 'utf8'), sandbox);
const G = sandbox.ApMicroGraph;

const INK = '#1F2A28', ACC = '#7E1A5E', BLUE = '#0072B2', VERM = '#D55E00', MUTED = '#5B6662', GREEN = '#009E73';
const F_CS = '#C3DDF0', F_PROFIT = '#F1DAE7', F_DWL = '#F6D2BD', F_LOSS = '#F6D2BD', F_SOFT = '#F4F7F9';
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = v => Math.round(v * 10) / 10;
function text(x, y, s, o = {}) {
  const a = [`x="${r(x)}"`, `y="${r(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.fill || INK}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.bold) a.push('font-weight="700"');
  return `<text ${a.join(' ')}>${o.raw ? s : esc(s)}</text>`;
}
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 2}"${o.arrow ? ` marker-end="url(#${o.arrow})"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const dot = (x, y, c = INK) => `<circle cx="${r(x)}" cy="${r(y)}" r="4.5" fill="${c}"/>`;
const marker = (id, color) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker>`;
const DEFS = `<defs>${marker('arr', INK)}${marker('arrV', VERM)}${marker('arrA', ACC)}</defs>`;
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

/* A plot box: pixel origin (x0, y0 = bottom-left), size w x h, engine coordinates 0-10. */
function box(x0, y0, w, h) {
  const X = v => x0 + v / 10 * w, Y = v => y0 - v / 10 * h;
  return { X, Y, x0, y0, w, h };
}
function axes(B, xLabel, yLabel, title) {
  let s = line(B.x0, B.y0, B.x0, B.y0 - B.h - 8, { arrow: 'arr' }) + line(B.x0, B.y0, B.x0 + B.w + 8, B.y0, { arrow: 'arr' });
  s += text(B.x0 + B.w, B.y0 + 40, xLabel, { anchor: 'end', bold: true });
  s += text(B.x0 - 8, B.y0 - B.h - 16, yLabel, { anchor: 'start', bold: true });
  if (title) s += text(B.x0 + B.w / 2, B.y0 - B.h - 40, title, { anchor: 'middle', bold: true, size: 16, fill: ACC });
  return s;
}
// A curve as a polyline sampled from the engine, clipped to the box.
function curvePath(B, c, x0 = 0, x1 = 10, color = INK, sw = 2.6) {
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const x = x0 + (x1 - x0) * i / 200, v = c.y ? c.y(x) : G.y(c, x);
    if (v == null || v < 0 || v > 10) continue;
    pts.push(`${r(B.X(x))},${r(B.Y(v))}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}
function poly(B, pts, fill, o = {}) {
  return `<polygon points="${pts.map(p => `${r(B.X(p[0]))},${r(B.Y(p[1]))}`).join(' ')}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}"` : ''}${o.opacity ? ` fill-opacity="${o.opacity}"` : ''}/>`;
}
// Dashed guides from a point to both axes, with axis marks.
function guides(B, x, v, xl, yl, o = {}) {
  let s = '';
  if (yl !== null) s += line(B.X(0), B.Y(v), B.X(x), B.Y(v), { dash: '5 4', sw: 1.4, stroke: MUTED }) + sub(B.x0 - 8, B.Y(v) + 5, yl[0], yl[1], { anchor: 'end', size: 13 });
  if (xl !== null) s += line(B.X(x), B.Y(v), B.X(x), B.y0, { dash: '5 4', sw: 1.4, stroke: MUTED }) + sub(B.X(x), B.y0 + 20, xl[0], xl[1], { anchor: 'middle', size: 13 });
  if (o.dot !== false) s += dot(B.X(x), B.Y(v), o.color || INK);
  return s;
}
// A label with a subscript: ["Q", "M"].
function sub(x, y, main, s, o = {}) {
  const size = o.size || 15;
  const inner = `${esc(main)}${s ? `<tspan font-size="${Math.round(size * 0.72)}" dy="4">${esc(s)}</tspan>` : ''}`;
  return text(x, y, inner, { ...o, raw: true, bold: o.bold !== false, size });
}
const curveLabel = (B, x, v, s, color = INK, o = {}) => text(B.X(x) + (o.dx || 6), B.Y(v) + (o.dy || 0), s, { bold: true, fill: color, size: 15, anchor: o.anchor });
const cur = (spec, id) => G.find(G.curves(spec, {}), id);
const yOf = (spec, id, x) => G.y(cur(spec, id), x);

const figures = {};
function save(topic, id, w, h, title, desc, alt, body) {
  writeFileSync(join(FIG, `${id}.svg`), svg(w, h, title, desc, body));
  (figures[topic] = figures[topic] || {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* 4.1: a price taker's flat demand beside a price maker's downward demand with MR below it. */
function priceMaker() {
  const W = 820, H = 380, L = box(80, 300, 270, 230), R = box(500, 300, 270, 230);
  let b = axes(L, 'Quantity', 'Price', 'Price taker (perfect competition)') + axes(R, 'Quantity', 'Price', 'Price maker (imperfect competition)');
  b += line(L.X(0), L.Y(5), L.X(9.6), L.Y(5), { stroke: ACC, sw: 2.6 }) + text(L.X(9.6), L.Y(5) - 10, 'd = MR = AR = P', { anchor: 'end', bold: true, fill: ACC });
  b += text(L.X(5), L.Y(2.6), 'Sell more at the same price:', { anchor: 'middle', size: 13, fill: MUTED }) + text(L.X(5), L.Y(2.6) + 17, 'MR equals the price.', { anchor: 'middle', size: 13, fill: MUTED });
  const D = x => 9 - 0.8 * x, MR = x => 9 - 1.6 * x;
  b += curvePath(R, { y: D }, 0, 10, INK) + curveLabel(R, 9.4, D(9.4) - 0.2, 'D', INK, { dx: 4, dy: -8 });
  b += curvePath(R, { y: MR }, 0, 5.6, BLUE) + curveLabel(R, 5.0, MR(5.0), 'MR', BLUE, { dx: 8, dy: 2 });
  b += guides(R, 3, D(3), ['Q', '1'], ['P', '1']) + dot(R.X(3), R.Y(MR(3)), BLUE);
  b += line(R.X(3) + 10, R.Y(D(3)) + 6, R.X(3) + 10, R.Y(MR(3)) - 8, { stroke: VERM, sw: 1.8, arrow: 'arrV' });
  b += text(R.X(3) + 6, R.Y(D(3)) - 12, 'MR < P', { bold: true, fill: VERM, size: 13 });
  b += text(R.X(4.6), R.Y(8.4), 'To sell one more unit it', { size: 13, fill: MUTED }) + text(R.X(4.6), R.Y(8.4) + 17, 'cuts the price on every unit.', { size: 13, fill: MUTED });
  save('imperfect-competition', 'imperfect-competition-price-maker', W, H,
    'A price taker and a price maker',
    'Left: a perfectly competitive firm faces a horizontal demand curve, d = MR = AR = P. Right: a firm with market power faces a downward-sloping demand curve D, and its marginal revenue curve MR lies below D, so at quantity Q1 marginal revenue is less than the price P1.',
    'Two graphs with Price on the vertical axis and Quantity on the horizontal axis. Left: a horizontal line labeled d = MR = AR = P. Right: a downward-sloping demand curve D with a steeper MR curve below it; at Q1 the price P1 on D is above marginal revenue.', b);
}

/* 4.2: the monopoly graph with CS, profit and DWL shaded (engine default curves). */
function monopolyAreas() {
  const spec = { kind: 'monopoly' }, W = 760, H = 420, B = box(90, 350, 400, 300);
  const pm = G.named(spec, {}, 'profit-max'), al = G.named(spec, {}, 'allocative'), mm = G.named(spec, {}, 'mr=mc');
  const Qm = pm[0], Pm = pm[1], A = yOf(spec, 'ATC', Qm), Qa = al[0];
  let b = '';
  const Dc = cur(spec, 'D'), MCc = cur(spec, 'MC');
  // areas
  const csPts = [[0, G.y(Dc, 0)], [Qm, Pm], [0, Pm]];
  b += poly(B, csPts, F_CS) + poly(B, [[0, Pm], [Qm, Pm], [Qm, A], [0, A]], F_PROFIT);
  const dw = [];
  for (let i = 0; i <= 30; i++) { const x = Qm + (Qa - Qm) * i / 30; dw.push([x, G.y(Dc, x)]); }
  for (let i = 30; i >= 0; i--) { const x = Qm + (Qa - Qm) * i / 30; dw.push([x, G.y(MCc, x)]); }
  b += poly(B, dw, F_DWL);
  b += axes(B, 'Quantity', 'Price and cost');
  b += curvePath(B, Dc, 0, 10, INK) + curveLabel(B, 9.3, yOf(spec, 'D', 9.3), 'D', INK, { dy: -6 });
  b += curvePath(B, cur(spec, 'MR'), 0, 4.8, BLUE) + curveLabel(B, 4.75, yOf(spec, 'MR', 4.75), 'MR', BLUE, { dy: 6 });
  b += curvePath(B, MCc, 0.2, 5.4, VERM) + curveLabel(B, 5.25, yOf(spec, 'MC', 5.25), 'MC', VERM, { dx: 6, dy: 12 });
  b += curvePath(B, cur(spec, 'ATC'), 0.9, 7.6, ACC) + curveLabel(B, 7.6, yOf(spec, 'ATC', 7.6), 'ATC', ACC, { dy: 4 });
  b += guides(B, Qm, Pm, null, ['P', 'M']) + line(B.X(Qm), B.Y(Pm), B.X(Qm), B.y0, { dash: '5 4', sw: 1.4, stroke: MUTED }) + sub(B.X(Qm), B.y0 + 20, 'Q', 'M', { anchor: 'middle', size: 13 });
  b += guides(B, Qm, A, null, ['ATC', 'M'], { dot: false }) + dot(B.X(mm[0]), B.Y(mm[1]), BLUE);
  b += line(B.X(Qa), B.Y(al[1]), B.X(Qa), B.y0, { dash: '5 4', sw: 1.4, stroke: MUTED }) + sub(B.X(Qa), B.y0 + 20, 'Q', 'E', { anchor: 'middle', size: 13 }) + dot(B.X(Qa), B.Y(al[1]), VERM);
  // CS sits between MR and D just above PM; Profit in the corner under ATC (no curve crosses either word).
  b += text(B.X(2.15), B.Y(Pm + 0.16), 'CS', { bold: true, size: 13, anchor: 'middle' });
  b += text(B.X(0.7), B.Y(A + 0.23), 'Profit', { bold: true, size: 13, anchor: 'middle' });
  b += line(B.X(Qm + 0.55), B.Y(5.4), B.X(6.6), B.Y(7.9), { sw: 1.2, stroke: MUTED }) + text(B.X(6.7), B.Y(7.9) + 4, 'DWL', { bold: true, size: 13 });
  b += text(B.X(mm[0]) + 8, B.Y(mm[1]) + 18, 'MR = MC', { size: 12, fill: BLUE, bold: true });
  // key
  const kx = 510;
  [['CS: consumer surplus', F_CS], ['Profit: (P minus ATC) times Q', F_PROFIT], ['DWL: deadweight loss', F_DWL]].forEach(([t, f], i) => { b += `<rect x="${kx}" y="${60 + i * 28}" width="16" height="16" fill="${f}" stroke="${MUTED}" stroke-width="0.8"/>` + text(kx + 22, 73 + i * 28, t, { size: 12 }); });
  b += text(kx, 160, 'QM: where MR = MC', { size: 12, fill: MUTED }) + text(kx, 178, 'PM: up to demand', { size: 12, fill: MUTED }) + text(kx, 196, 'QE: where D meets MC', { size: 12, fill: MUTED });
  save('monopoly', 'monopoly-areas', W, H,
    'A profit-maximizing monopoly',
    'A monopoly graph: demand D, marginal revenue MR below it, marginal cost MC and average total cost ATC, with MC crossing ATC at its minimum. The monopolist produces QM where MR = MC and charges PM read up on the demand curve. Consumer surplus is the triangle under D above PM; profit is the rectangle between PM and ATC out to QM; deadweight loss is the triangle between D and MC from QM to QE, where D meets MC.',
    'A monopoly graph with Price and cost on the vertical axis and Quantity on the horizontal axis. QM is where MR crosses MC; PM is read up on the demand curve. Consumer surplus (blue), the profit rectangle between PM and ATC (pink) and the deadweight loss triangle between D and MC from QM to QE (orange) are shaded.', b);
}

/* 4.2: the natural monopoly and the two regulated prices (engine natural: D = 10 - Q, MC = 2, ATC = 2 + 12/Q). */
function natural() {
  const spec = { kind: 'monopoly', natural: true }, W = 740, H = 420, B = box(90, 350, 400, 300);
  const pm = G.named(spec, {}, 'profit-max'), fr = G.named(spec, {}, 'fair-return'), al = G.named(spec, {}, 'allocative');
  let b = axes(B, 'Quantity', 'Price and cost');
  b += curvePath(B, cur(spec, 'D'), 0, 10, INK) + curveLabel(B, 9.2, yOf(spec, 'D', 9.2), 'D', INK, { dy: -8 });
  b += curvePath(B, cur(spec, 'MR'), 0, 4.9, BLUE) + curveLabel(B, 4.9, yOf(spec, 'MR', 4.9), 'MR', BLUE, { dy: 4 });
  b += curvePath(B, cur(spec, 'MC'), 0, 10, VERM) + curveLabel(B, 0.3, 2, 'MC', VERM, { dy: -8 });
  b += curvePath(B, cur(spec, 'ATC'), 1.25, 10, ACC) + curveLabel(B, 9.5, yOf(spec, 'ATC', 9.5), 'ATC', ACC, { dy: -8, dx: -14 });
  b += guides(B, pm[0], pm[1], ['Q', 'M'], ['P', 'M']);
  b += guides(B, fr[0], fr[1], ['Q', 'F'], ['P', 'F'], { color: ACC });
  b += line(B.X(al[0]), B.Y(al[1]), B.X(al[0]), B.y0, { dash: '5 4', sw: 1.4, stroke: MUTED }) + sub(B.X(al[0]), B.y0 + 20, 'Q', 'S', { anchor: 'middle', size: 13 }) + dot(B.X(al[0]), B.Y(al[1]), VERM);
  b += sub(B.x0 - 8, B.Y(2) + 5, 'P', 'S', { anchor: 'end', size: 13 });
  const kx = 510;
  b += text(kx, 70, 'Unregulated: MR = MC', { size: 12, bold: true }) + text(kx, 88, 'QM and PM (profit)', { size: 12, fill: MUTED });
  b += text(kx, 120, 'Fair-return price: P = ATC', { size: 12, bold: true, fill: ACC }) + text(kx, 138, 'QF and PF (zero profit)', { size: 12, fill: MUTED });
  b += text(kx, 170, 'Socially optimal: P = MC', { size: 12, bold: true, fill: VERM }) + text(kx, 188, 'QS and PS (a loss: ATC > P)', { size: 12, fill: MUTED });
  b += text(kx, 220, 'ATC falls over the whole', { size: 12, fill: MUTED }) + text(kx, 238, 'range of demand.', { size: 12, fill: MUTED });
  save('monopoly', 'monopoly-natural', W, H,
    'A natural monopoly and two regulated prices',
    'A natural monopoly: average total cost ATC falls over the whole range of demand and lies above a flat marginal cost MC. Unregulated, the firm produces QM where MR = MC and charges PM from demand. At the fair-return price PF, where demand meets ATC, it earns zero economic profit at QF. At the socially optimal price PS, where demand meets MC, output is the efficient QS but price is below ATC, so the firm makes a loss.',
    'A natural monopoly graph with Price and cost on the vertical axis and Quantity on the horizontal axis: a falling ATC curve above a flat MC, demand D and MR. Three points are marked: QM and PM where MR = MC, QF and PF where D meets ATC, and QS and PS where D meets MC.', b);
}

/* 4.3: single price vs perfect price discrimination (D = 10 - Q, MR = 10 - 2Q, MC = 2). */
function discrimination() {
  const W = 840, H = 400, L = box(80, 320, 290, 240), R = box(510, 320, 290, 240);
  const D = x => 10 - x, MR = x => 10 - 2 * x, MC = () => 2;
  let b = '';
  b += poly(L, [[0, 10], [4, 6], [0, 6]], F_CS) + poly(L, [[0, 6], [4, 6], [4, 2], [0, 2]], F_PROFIT) + poly(L, [[4, 6], [8, 2], [4, 2]], F_DWL);
  b += poly(R, [[0, 10], [8, 2], [0, 2]], F_PROFIT);
  b += axes(L, 'Quantity', 'Price and cost', 'One price for everyone') + axes(R, 'Quantity', 'Price and cost', 'Perfect price discrimination');
  b += curvePath(L, { y: D }, 0, 10, INK) + curveLabel(L, 9.2, D(9.2), 'D', INK, { dy: -10 });
  b += curvePath(L, { y: MR }, 0, 5, BLUE) + curveLabel(L, 4.9, MR(4.9), 'MR', BLUE, { dy: 4 });
  b += curvePath(L, { y: MC }, 0, 10, VERM) + curveLabel(L, 0.2, 2, 'MC', VERM, { dy: -8 });
  b += guides(L, 4, 6, ['Q', 'M'], ['P', 'M']) + line(L.X(8), L.Y(2), L.X(8), L.y0, { dash: '5 4', sw: 1.4, stroke: MUTED }) + sub(L.X(8), L.y0 + 20, 'Q', 'E', { anchor: 'middle', size: 13 });
  b += text(L.X(2.3), L.Y(6.25), 'CS', { bold: true, size: 13, anchor: 'middle' }) + text(L.X(2), L.Y(4) + 5, 'Profit', { bold: true, size: 13, anchor: 'middle' }) + text(L.X(5.1), L.Y(3.2), 'DWL', { bold: true, size: 13, anchor: 'middle' });
  b += curvePath(R, { y: D }, 0, 10, INK) + text(R.X(6.6), R.Y(D(6.6)) - 12, 'D = MR', { bold: true, size: 15 });
  b += curvePath(R, { y: MC }, 0, 10, VERM) + curveLabel(R, 0.2, 2, 'MC', VERM, { dy: -8 });
  b += guides(R, 8, 2, ['Q', 'E'], null);
  b += text(R.X(2.6), R.Y(4.2), 'Profit: all the', { bold: true, size: 13, anchor: 'middle' }) + text(R.X(2.6), R.Y(4.2) + 17, 'surplus', { bold: true, size: 13, anchor: 'middle' });
  b += text(R.X(5.4), R.Y(8.6), 'Each buyer pays the most', { size: 12, fill: MUTED }) + text(R.X(5.4), R.Y(8.6) + 16, 'they are willing to pay.', { size: 12, fill: MUTED });
  b += text(R.X(5.4), R.Y(8.6) + 36, 'CS = 0 and DWL = 0.', { size: 12, fill: MUTED, bold: true });
  save('price-discrimination', 'price-discrimination-perfect', W, H,
    'One price compared with perfect price discrimination',
    'Left: a single-price monopolist produces QM where MR = MC and charges PM from demand, leaving consumer surplus, profit and a deadweight loss triangle between D and MC from QM to QE. Right: a perfectly price-discriminating monopolist charges each buyer the most that buyer will pay, so its marginal revenue curve is the demand curve; it produces QE where D = MC, all surplus becomes profit, consumer surplus is zero and there is no deadweight loss.',
    'Two monopoly graphs with Price and cost on the vertical axis and Quantity on the horizontal axis. Left: one price PM at QM with consumer surplus, profit and deadweight loss shaded. Right: D = MR, output QE where D meets MC, and the whole area between D and MC shaded as profit.', b);
}

/* 4.4: monopolistic competition, short run (profit) and long run (tangency, excess capacity). */
function monocomp() {
  const W = 860, H = 450, L = box(80, 330, 300, 250), R = box(520, 330, 300, 250);
  const s1 = { kind: 'monocomp', run: 'short' }, s2 = { kind: 'monocomp', run: 'long' };
  let b = '';
  const p1 = G.named(s1, {}, 'profit-max'), A1 = yOf(s1, 'ATC', p1[0]);
  b += poly(L, [[0, p1[1]], [p1[0], p1[1]], [p1[0], A1], [0, A1]], F_PROFIT);
  b += axes(L, 'Quantity', 'Price and cost', 'Short run: economic profit') + axes(R, 'Quantity', 'Price and cost', 'Long run: zero economic profit');
  const draw = (B, s, dmax) => curvePath(B, cur(s, 'D'), 0, 10, INK) + curvePath(B, cur(s, 'MR'), 0, dmax, BLUE)
    + curvePath(B, cur(s, 'MC'), 0.2, 5.4, VERM) + curvePath(B, cur(s, 'ATC'), 0.9, 7.6, ACC);
  b += draw(L, s1, 4.8) + curveLabel(L, 9.3, yOf(s1, 'D', 9.3), 'D', INK, { dy: -6 }) + curveLabel(L, 4.75, yOf(s1, 'MR', 4.75), 'MR', BLUE, { dy: 8 })
    + curveLabel(L, 5.25, yOf(s1, 'MC', 5.25), 'MC', VERM, { dy: 12 }) + curveLabel(L, 7.6, yOf(s1, 'ATC', 7.6), 'ATC', ACC, { dy: 4 });
  b += guides(L, p1[0], p1[1], ['Q', '1'], ['P', '1']) + guides(L, p1[0], A1, null, ['ATC', '1'], { dot: false });
  b += text(L.X(0.75), L.Y(A1 + 0.18), 'Profit', { bold: true, size: 13, anchor: 'middle' });
  const p2 = G.named(s2, {}, 'profit-max'), mn = G.named(s2, {}, 'min-atc');
  b += draw(R, s2, 2.9) + curveLabel(R, 6.4, yOf(s2, 'D', 6.4), 'D', INK, { dy: -2 }) + curveLabel(R, 1.6, yOf(s2, 'MR', 1.6), 'MR', BLUE, { dy: 4, dx: -34 })
    + curveLabel(R, 5.25, yOf(s2, 'MC', 5.25), 'MC', VERM, { dy: 12 }) + curveLabel(R, 7.6, yOf(s2, 'ATC', 7.6), 'ATC', ACC, { dy: 4 });
  b += guides(R, p2[0], p2[1], ['Q', '2'], ['P = ATC', ''], { color: ACC });
  b += line(R.X(mn[0]), R.Y(mn[1]), R.X(mn[0]), R.y0, { dash: '5 4', sw: 1.4, stroke: MUTED }) + sub(R.X(mn[0]), R.y0 + 20, 'Q', 'min ATC', { anchor: 'start', size: 13 }) + dot(R.X(mn[0]), R.Y(mn[1]), ACC);
  b += line(R.X(p2[0]), R.y0 + 36, R.X(mn[0]) - 3, R.y0 + 36, { stroke: VERM, sw: 1.8, arrow: 'arrV' }) + text(R.X((p2[0] + mn[0]) / 2), R.y0 + 56, 'Excess capacity', { anchor: 'middle', size: 12, bold: true, fill: VERM });
  b += text(R.X(5.8), R.Y(8.6), 'D is tangent to ATC at Q2:', { size: 12, fill: MUTED }) + text(R.X(5.8), R.Y(8.6) + 16, 'P = ATC, and P > MC.', { size: 12, fill: MUTED });
  save('monopolistic-competition', 'monopolistic-competition-runs', W, H,
    'Monopolistic competition in the short run and the long run',
    'Left: in the short run a monopolistically competitive firm produces Q1 where MR = MC and charges P1 from its demand curve; P1 is above ATC, so it earns the shaded economic profit. Right: entry shifts each firm\'s demand left until, in the long run, demand is tangent to ATC at Q2, where P = ATC and economic profit is zero. Q2 is less than the quantity at minimum ATC: excess capacity. Price is above MC.',
    'Two graphs with Price and cost on the vertical axis and Quantity on the horizontal axis, each with D, MR, MC and ATC. Short run: profit rectangle between P1 and ATC out to Q1. Long run: D tangent to ATC at Q2, to the left of the minimum of ATC, with the gap marked excess capacity.', b);
}

/* 4.5: a payoff matrix with each player's best responses marked. */
function matrixFig() {
  const W = 720, H = 360;
  // Ad campaign game: rows Firm A, columns Firm B; payoffs in thousands of dollars.
  const P = [[[50, 50], [90, 20]], [[20, 90], [70, 70]]], rowS = ['Advertise', 'Do not'], colS = ['Advertise', 'Do not'];
  const x0 = 200, y0 = 90, cw = 170, ch = 80;
  let b = text(x0 + cw, 40, 'Firm B', { anchor: 'middle', bold: true, size: 16, fill: BLUE });
  b += text(60, y0 + ch + 6, 'Firm A', { anchor: 'middle', bold: true, size: 16, fill: ACC });
  colS.forEach((s, j) => { b += text(x0 + cw * j + cw / 2, y0 - 14, s, { anchor: 'middle', bold: true, fill: BLUE }); });
  rowS.forEach((s, i) => { b += text(x0 - 12, y0 + ch * i + ch / 2 + 5, s, { anchor: 'end', bold: true, fill: ACC }); });
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const cx = x0 + cw * j, cy = y0 + ch * i, nash = i === 0 && j === 0;
    b += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${nash ? '#F8E6F1' : '#FFFFFF'}" stroke="${INK}" stroke-width="1.5"/>`;
    const a = P[i][j][0], c = P[i][j][1];
    const aBest = P[i][j][0] > P[1 - i][j][0], cBest = P[i][j][1] > P[i][1 - j][1];
    b += text(cx + cw / 2 - 30, cy + ch / 2 + 6, `$${a}`, { anchor: 'middle', bold: true, size: 18, fill: ACC });
    b += text(cx + cw / 2, cy + ch / 2 + 6, ',', { anchor: 'middle', size: 18 });
    b += text(cx + cw / 2 + 30, cy + ch / 2 + 6, `$${c}`, { anchor: 'middle', bold: true, size: 18, fill: BLUE });
    if (aBest) b += line(cx + cw / 2 - 48, cy + ch / 2 + 12, cx + cw / 2 - 12, cy + ch / 2 + 12, { stroke: ACC, sw: 2.4 });
    if (cBest) b += line(cx + cw / 2 + 12, cy + ch / 2 + 12, cx + cw / 2 + 48, cy + ch / 2 + 12, { stroke: BLUE, sw: 2.4 });
    if (nash) b += text(cx + 8, cy + 18, 'Nash equilibrium', { size: 12, bold: true, fill: ACC });
  }
  const kx = 560;
  b += text(kx, 110, 'Payoffs in thousands', { size: 12, fill: MUTED }) + text(kx, 126, 'of dollars, Firm A first.', { size: 12, fill: MUTED });
  b += text(kx, 160, 'Underlined: the best', { size: 12, fill: MUTED }) + text(kx, 176, 'response to the other', { size: 12, fill: MUTED }) + text(kx, 192, "firm's choice.", { size: 12, fill: MUTED });
  b += text(x0, 290, 'Firm A: 50 > 20 if B advertises, and 90 > 70 if B does not, so Advertise is dominant.', { size: 13 });
  b += text(x0 - 130, 318, 'Both advertise ($50 each), though both not advertising ($70 each) would pay more: a prisoner\'s dilemma.', { size: 13 });
  save('oligopoly-game-theory', 'oligopoly-game-theory-matrix', W, H,
    'A payoff matrix with best responses underlined',
    'A two-by-two payoff matrix for Firm A (rows) and Firm B (columns), each choosing Advertise or Do not, payoffs in thousands of dollars with Firm A first: both advertise 50, 50; A advertises and B does not 90, 20; A does not and B advertises 20, 90; neither advertises 70, 70. Each firm\'s best response is underlined. Advertise is a dominant strategy for both, so both advertising is the Nash equilibrium, although both not advertising gives each firm more.',
    'A payoff matrix for two firms choosing Advertise or Do not, with Firm A\'s payoff first in each cell; best responses are underlined and the cell where both advertise is marked as the Nash equilibrium.', b);
}

mkdirSync(FIG, { recursive: true });
mkdirSync(REG, { recursive: true });
priceMaker(); monopolyAreas(); natural(); discrimination(); monocomp(); matrixFig();
for (const [topic, f] of Object.entries(figures)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(f, null, 1) + '\n');
console.log(`author D figures: ${Object.values(figures).reduce((n, f) => n + Object.keys(f).length, 0)} written`);
