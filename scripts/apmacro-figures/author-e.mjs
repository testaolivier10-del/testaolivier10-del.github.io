#!/usr/bin/env node
/* AP® Macroeconomics figures for author E (Unit 5): standalone SVG diagrams
   written to macroeconomics/figures/<id>.svg, registered in
   macroeconomics/data/figures/<topic>.json. Every graph is labeled as the
   authoring guide asks: axes by name, curves with subscripts, the old and new
   equilibrium marked, the direction of a shift shown with an arrow.
   Run: node scripts/apmacro-figures/author-e.mjs
   Style: white background, role="img" with <title> and <desc>, Arial/Helvetica,
   ink #1F2A28, the course accent #355A0A, Okabe-Ito vermillion #D55E00 and blue
   #0072B2 as second colors. Numbers in the data figure are invented. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'macroeconomics', 'figures');
const INK = '#1F2A28', ACC = '#355A0A', VER = '#D55E00', BLU = '#0072B2', GREY = '#6B7672';
const TINT = '#EEF4E0', VTINT = '#FBEADF', BTINT = '#E3EEF8', NTINT = '#F2F4F3';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
const r1 = v => Math.round(v * 10) / 10;
function text(x, y, s, { size = 14, weight = 'normal', fill = INK, anchor = 'middle', italic = false } = {}) {
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''}>${s}</text>`;
}
// A label with a subscript: lab('SRAS', '1').
const lab = (main, sub) => esc(main) + (sub ? `<tspan font-size="10" dy="4">${esc(sub)}</tspan>` : '');
function lines(x, y, arr, o = {}) { const size = o.size || 14; return arr.map((t, i) => text(x, y + i * size * 1.3, esc(t), o)).join(''); }
function box(x, y, w, h, { fill = NTINT, stroke = INK, sw = 2, rx = 8 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function arrow(id, x1, y1, x2, y2, { color = 'ar', stroke = INK, sw = 2.2, dash = '' } = {}) {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#${id}-${color})"/>`;
}

/* A graph panel: data coordinates 0-10 on both axes, mapped into a box. */
function panel(id, ox, oy, w, h, { x: xl, y: yl, title }) {
  const X = v => ox + v / 10 * w, Y = v => oy + h - v / 10 * h;
  const out = [];
  if (title) out.push(text(ox + w / 2, oy - 14, esc(title), { size: 15, weight: 'bold' }));
  out.push(`<path d="M${ox} ${oy}V${oy + h}H${ox + w}" fill="none" stroke="${INK}" stroke-width="2"/>`);
  out.push(text(ox + w, oy + h + 36, esc(xl), { size: 13, anchor: 'end' }));
  out.push(`<text transform="translate(${ox - 14} ${oy}) rotate(-90)" font-size="13" fill="${INK}" text-anchor="end">${esc(yl)}</text>`);
  const api = {
    X, Y,
    line(x1, y1, x2, y2, { stroke = INK, sw = 2.6, dash = '' } = {}) { out.push(`<line x1="${r1(X(x1))}" y1="${r1(Y(y1))}" x2="${r1(X(x2))}" y2="${r1(Y(y2))}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`); return api; },
    // Curves of the course's model: down (slope -1) and up (slope +1) through (at, 5), vertical at `at`.
    down(at, o = {}) { const a = Math.max(0, at - 4), b = Math.min(10, at + 4); return api.line(a, 5 - (a - at), b, 5 - (b - at), o); },
    up(at, o = {}) { const a = Math.max(0, at - 4), b = Math.min(10, at + 4); return api.line(a, 5 + (a - at), b, 5 + (b - at), o); },
    vert(at, o = {}) { return api.line(at, 0.3, at, 9.6, o); },
    ppc(r, { stroke = INK, sw = 2.6, dash = '' } = {}) {
      const pts = []; for (let a = 0; a <= 90.01; a += 3) { const t = a * Math.PI / 180; pts.push(`${r1(X(r * Math.cos(t)))} ${r1(Y(r * Math.sin(t)))}`); }
      out.push(`<path d="M${pts.join('L')}" fill="none" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`); return api;
    },
    label(x, y, main, sub, { fill = INK, anchor = 'start', size = 13 } = {}) { out.push(`<text x="${r1(X(x))}" y="${r1(Y(y))}" font-size="${size}" font-weight="bold" fill="${fill}" text-anchor="${anchor}">${lab(main, sub)}</text>`); return api; },
    // An equilibrium point with dashed guides to both axes and its axis labels.
    point(x, y, { fill = INK, xlab, ylab, name, nameDx = 8, nameDy = -8 } = {}) {
      out.push(`<path d="M${ox} ${r1(Y(y))}H${r1(X(x))}V${oy + h}" fill="none" stroke="${GREY}" stroke-width="1.4" stroke-dasharray="4 4"/>`);
      out.push(`<circle cx="${r1(X(x))}" cy="${r1(Y(y))}" r="5" fill="${fill}"/>`);
      if (xlab) out.push(`<text x="${r1(X(x))}" y="${oy + h + 16}" font-size="12" fill="${INK}" text-anchor="middle">${xlab}</text>`);
      if (ylab) out.push(`<text x="${ox - 4}" y="${r1(Y(y) + 4)}" font-size="12" fill="${INK}" text-anchor="end">${ylab}</text>`);
      if (name) out.push(`<text x="${r1(X(x) + nameDx)}" y="${r1(Y(y) + nameDy)}" font-size="13" font-weight="bold" fill="${fill}">${esc(name)}</text>`);
      return api;
    },
    dot(x, y, name, { fill = INK, dx = 8, dy = -8 } = {}) { out.push(`<circle cx="${r1(X(x))}" cy="${r1(Y(y))}" r="5" fill="${fill}"/>` + `<text x="${r1(X(x) + dx)}" y="${r1(Y(y) + dy)}" font-size="13" font-weight="bold" fill="${fill}">${esc(name)}</text>`); return api; },
    arrow(x1, y1, x2, y2, o = {}) { out.push(arrow(id, X(x1), Y(y1), X(x2), Y(y2), o)); return api; },
    note(x, y, s, o = {}) { out.push(text(X(x), Y(y), esc(s), { size: 12, ...o })); return api; },
    svg: () => out.join('\n'),
  };
  return api;
}

const figs = {};

/* 1. 5.1: the two short-run chains, monetary (ample reserves) and fiscal. */
{
  const id = 'policy-short-run-chains', W = 860, H = 430;
  let b = lines(W / 2, 32, ['Expansionary policy in the short run: every link of the chain'], { size: 19, weight: 'bold' });
  const row = (y, color, tint, mark, title, steps) => {
    let s = text(24, y - 12, esc(title), { size: 15, weight: 'bold', fill: color, anchor: 'start' });
    const bw = 150, gap = 18;
    steps.forEach((t, i) => {
      const x = 24 + i * (bw + gap);
      s += box(x, y, bw, 92, { fill: i === steps.length - 1 ? TINT : tint, stroke: i === steps.length - 1 ? ACC : color });
      s += lines(x + bw / 2, y + 26, t, { size: 13, fill: INK });
      if (i < steps.length - 1) s += arrow(id, x + bw + 2, y + 46, x + bw + gap - 2, y + 46, { color: mark, stroke: color });
    });
    return s;
  };
  b += row(78, BLU, BTINT, 'arB', 'Monetary policy (ample-reserves framework)', [
    ['Central bank', 'lowers the interest', 'rate on reserve', 'balances'],
    ['Policy rate', '(federal funds', 'rate) falls'],
    ['Loan rates and', 'other interest', 'rates fall'],
    ['Investment and', 'interest-sensitive', 'consumption rise'],
    ['AD shifts right:', 'real GDP and the', 'price level rise,', 'unemployment falls']]);
  b += row(250, VER, VTINT, 'arV', 'Fiscal policy', [
    ['Government', 'cuts taxes'],
    ['Disposable', 'income rises'],
    ['Consumption', 'rises (times the', 'multiplier)'],
    ['Total spending', 'rises at every', 'price level'],
    ['AD shifts right:', 'real GDP and the', 'price level rise,', 'unemployment falls']]);
  b += lines(W / 2, 384, ['Limited-reserves framework: the central bank buys bonds, the money supply shifts right on the money market graph,', 'and the nominal interest rate falls; the chain then continues the same way. Contractionary policy reverses every arrow.'], { size: 13, fill: GREY });
  figs[id] = { topic: 'policy-short-run', w: W, h: H, svg: svg(id, W, H, 'The monetary and fiscal policy chains',
    'Two rows of linked boxes. Monetary, ample reserves: the central bank lowers the interest rate on reserve balances, the policy rate falls, loan rates fall, investment and interest-sensitive consumption rise, AD shifts right so real GDP and the price level rise and unemployment falls. Fiscal: a tax cut raises disposable income, consumption rises with the multiplier, total spending rises, AD shifts right with the same results. A note says the limited-reserves tool is buying bonds, which shifts the money supply right on the money market graph.', b),
    alt: 'Two chains of boxes: lower interest on reserves, lower policy rate, lower loan rates, more investment, AD right; and a tax cut, higher disposable income, more consumption, AD right, real GDP and the price level up and unemployment down.' };
}

/* 2. 5.2: an AD shift is a movement along the SRPC. */
{
  const id = 'phillips-curve-adas-link', W = 860, H = 400;
  let b = lines(W / 2, 30, ['A rise in AD moves the economy along the short-run Phillips curve'], { size: 19, weight: 'bold' });
  const a = panel(id, 80, 80, 300, 250, { x: 'Real GDP', y: 'Price level', title: 'AD-AS' });
  a.vert(5, { stroke: GREY, sw: 2 }).label(5.1, 9.7, 'LRAS', '');
  a.up(5).label(9.1, 9.1, 'SRAS', '');
  a.down(5, { stroke: GREY, dash: '6 5', sw: 2 }).label(9.1, 1.3, 'AD', '1', { fill: GREY });
  a.down(6.5, { stroke: BLU }).label(9.9, 2.6, 'AD', '2', { fill: BLU });
  a.arrow(5.6, 3.2, 7.1, 3.2, { color: 'arB', stroke: BLU });
  a.point(5, 5, { xlab: lab('Y', 'F'), ylab: lab('PL', '1'), name: 'A', nameDx: 8, nameDy: 18 });
  a.point(5.75, 5.75, { fill: BLU, xlab: lab('Y', '2'), ylab: lab('PL', '2'), name: 'B' });
  const p = panel(id, 520, 80, 300, 250, { x: 'Unemployment rate', y: 'Inflation rate', title: 'Phillips curves' });
  p.vert(5, { stroke: GREY, sw: 2 }).label(5.1, 9.7, 'LRPC', '');
  p.down(5).label(9.1, 1.3, 'SRPC', '');
  p.point(5, 5, { xlab: lab('u', 'n'), ylab: '2%', name: 'A' });
  p.point(3.6, 6.4, { fill: BLU, ylab: '4%', name: 'B', nameDx: -22 });
  p.arrow(4.7, 5.7, 3.95, 6.45, { color: 'arB', stroke: BLU });
  b += a.svg() + p.svg();
  b += lines(W / 2, 384, ['Higher output means lower unemployment, and the faster rise in the price level is higher inflation: point A to point B on the same SRPC.'], { size: 13, fill: GREY });
  figs[id] = { topic: 'phillips-curve', w: W, h: H, svg: svg(id, W, H, 'AD-AS and the Phillips curves side by side',
    'Left: an AD-AS graph with LRAS at full-employment output YF; AD shifts right from AD1 to AD2, so equilibrium moves from A at PL1 and YF to B at a higher price level PL2 and higher real GDP Y2. Right: a Phillips curve graph with inflation rate on the vertical axis and unemployment rate on the horizontal axis, a downward-sloping SRPC and a vertical LRPC at the natural rate un; the economy moves along the SRPC from A at 2 percent inflation and the natural rate to B with lower unemployment and 4 percent inflation.', b),
    alt: 'AD shifting right on an AD-AS graph matches a move up and to the left along the short-run Phillips curve: lower unemployment, higher inflation.' };
}

/* 3. 5.2: a negative supply shock shifts the SRPC right. */
{
  const id = 'phillips-curve-supply-shock', W = 860, H = 400;
  let b = lines(W / 2, 30, ['A negative supply shock shifts the short-run Phillips curve right'], { size: 19, weight: 'bold' });
  const a = panel(id, 80, 80, 300, 250, { x: 'Real GDP', y: 'Price level', title: 'AD-AS' });
  a.vert(5, { stroke: GREY, sw: 2 }).label(5.1, 9.7, 'LRAS', '');
  a.down(5).label(9.1, 1.3, 'AD', '');
  a.up(5, { stroke: GREY, dash: '6 5', sw: 2 }).label(9.1, 9.1, 'SRAS', '1', { fill: GREY });
  a.up(3.5, { stroke: VER }).label(7.5, 9.4, 'SRAS', '2', { fill: VER });
  a.arrow(6.6, 7.2, 5.4, 7.2, { color: 'arV', stroke: VER });
  a.point(5, 5, { xlab: lab('Y', 'F'), ylab: lab('PL', '1'), name: 'A' });
  a.point(4.25, 5.75, { fill: VER, xlab: lab('Y', '2'), ylab: lab('PL', '2'), name: 'B', nameDx: -8, nameDy: -12 });
  const p = panel(id, 520, 80, 300, 250, { x: 'Unemployment rate', y: 'Inflation rate', title: 'Phillips curves' });
  p.vert(5, { stroke: GREY, sw: 2 }).label(5.1, 9.7, 'LRPC', '');
  p.down(5, { stroke: GREY, dash: '6 5', sw: 2 }).label(8.2, 0.4, 'SRPC', '1', { fill: GREY, anchor: 'end' });
  p.down(6.5, { stroke: VER }).label(9.4, 2.4, 'SRPC', '2', { fill: VER });
  p.arrow(6.3, 3.4, 7.6, 3.4, { color: 'arV', stroke: VER });
  p.point(5, 5, { xlab: lab('u', 'n'), name: 'A', nameDx: -20 });
  p.point(6, 5.5, { fill: VER, name: 'B' });
  b += a.svg() + p.svg();
  b += lines(W / 2, 384, ['Output falls (unemployment rises) while the price level rises faster: inflation and unemployment rise together, stagflation.'], { size: 13, fill: GREY });
  figs[id] = { topic: 'phillips-curve', w: W, h: H, svg: svg(id, W, H, 'A supply shock on AD-AS and the Phillips curves',
    'Left: SRAS shifts left from SRAS1 to SRAS2, so equilibrium moves from A at full employment to B with a higher price level PL2 and lower real GDP Y2. Right: the short-run Phillips curve shifts right from SRPC1 to SRPC2; the economy moves from A at the natural rate to B with both higher unemployment and higher inflation. LRPC stays vertical at the natural rate.', b),
    alt: 'SRAS shifting left on an AD-AS graph matches the SRPC shifting right: higher inflation and higher unemployment at once.' };
}

/* 4. 5.3: money growth in the long run only raises the price level. */
{
  const id = 'money-growth-inflation-longrun', W = 620, H = 430;
  let b = lines(W / 2, 30, ['More money in the long run: a higher price level, the same real GDP'], { size: 18, weight: 'bold' });
  const a = panel(id, 110, 90, 380, 270, { x: 'Real GDP', y: 'Price level' });
  a.vert(5, { stroke: INK }).label(5.1, 9.7, 'LRAS', '');
  a.down(5, { stroke: GREY, dash: '6 5', sw: 2 }).label(9.1, 1.3, 'AD', '1', { fill: GREY });
  a.down(6.4, { stroke: BLU }).label(9.95, 2.7, 'AD', '2', { fill: BLU });
  a.up(5, { stroke: GREY, dash: '6 5', sw: 2 }).label(9.1, 9.1, 'SRAS', '1', { fill: GREY });
  a.up(3.6, { stroke: VER }).label(7.4, 9.5, 'SRAS', '2', { fill: VER });
  a.arrow(5.6, 3.0, 7.0, 3.0, { color: 'arB', stroke: BLU });
  a.arrow(6.8, 7.9, 5.6, 7.9, { color: 'arV', stroke: VER });
  a.point(5, 5, { xlab: lab('Y', 'F'), ylab: lab('PL', '1'), name: 'A', nameDx: 8, nameDy: 18 });
  a.dot(5.7, 5.7, 'B', { fill: BLU });
  a.point(5, 6.4, { fill: ACC, ylab: lab('PL', '3'), name: 'C', nameDx: -22 });
  b += a.svg();
  b += lines(W / 2, 404, ['A to B: more money raises AD (short run). B to C: nominal wages catch up and SRAS shifts left.', 'In the long run (C), real GDP is back at full employment; only the price level is higher.'], { size: 13, fill: GREY });
  figs[id] = { topic: 'money-growth-inflation', w: W, h: H, svg: svg(id, W, H, 'The long-run effect of more money on AD-AS',
    'An AD-AS graph with a vertical LRAS at full-employment output YF. A rise in the money supply shifts AD right from AD1 to AD2, moving the economy from A to B with more output and a higher price level. Nominal wages then rise and SRAS shifts left from SRAS1 to SRAS2, so the economy ends at C on LRAS: real GDP back at YF and a higher price level PL3.', b),
    alt: 'An AD-AS graph: AD shifts right after money growth, then SRAS shifts left as wages adjust, ending at full-employment output with a higher price level.' };
}

/* 5. 5.4: deficits are flows that add to the debt, a stock (invented numbers). */
{
  const id = 'deficits-debt-flow', W = 760, H = 420;
  let b = lines(W / 2, 30, ['Each year’s deficit adds to the debt; a surplus subtracts (invented numbers)'], { size: 17, weight: 'bold' });
  const years = [['Year 1', -100, 1100], ['Year 2', -70, 1170], ['Year 3', 20, 1150], ['Year 4', -140, 1290]];
  const ox = 90, oy = 70, w = 600, h = 280, base = oy + h;
  const sy = v => base - v / 1400 * h;
  b += `<path d="M${ox} ${oy}V${base}H${ox + w}" fill="none" stroke="${INK}" stroke-width="2"/>`;
  b += `<text transform="translate(${ox - 52} ${oy + h / 2}) rotate(-90)" font-size="13" fill="${INK}" text-anchor="middle">Billions of dollars</text>`;
  for (const v of [0, 400, 800, 1200]) b += text(ox - 8, sy(v) + 4, String(v), { size: 12, anchor: 'end' }) + `<line x1="${ox}" y1="${r1(sy(v))}" x2="${ox + w}" y2="${r1(sy(v))}" stroke="#DDE2E0" stroke-width="1"/>`;
  b += text(ox + 10, sy(1000) - 6, 'Debt at the start: 1,000', { size: 12, anchor: 'start', fill: GREY });
  b += `<line x1="${ox}" y1="${r1(sy(1000))}" x2="${ox + 80}" y2="${r1(sy(1000))}" stroke="${GREY}" stroke-width="2" stroke-dasharray="5 4"/>`;
  years.forEach(([yr, bal, debt], i) => {
    const cx = ox + 175 + i * 125;
    b += `<rect x="${cx - 26}" y="${r1(sy(debt))}" width="52" height="${r1(base - sy(debt))}" fill="${TINT}" stroke="${ACC}" stroke-width="2"/>`;
    b += text(cx, sy(debt) - 8, debt.toLocaleString('en-US'), { size: 13, weight: 'bold', fill: ACC });
    b += text(cx, base + 20, yr, { size: 13 });
    b += text(cx, base + 38, bal < 0 ? `deficit ${-bal}` : `surplus ${bal}`, { size: 12, fill: bal < 0 ? VER : BLU, weight: 'bold' });
  });
  figs[id] = { topic: 'deficits-debt', w: W, h: H, svg: svg(id, W, H, 'Budget deficits and the national debt over four years',
    'A bar chart of an invented national debt that starts at 1,000 billion dollars. A deficit of 100 in Year 1 raises it to 1,100; a deficit of 70 in Year 2 raises it to 1,170; a surplus of 20 in Year 3 lowers it to 1,150; a deficit of 140 in Year 4 raises it to 1,290.', b),
    alt: 'Bars of an invented national debt: 1,100, 1,170, 1,150 and 1,290 billion dollars after deficits of 100 and 70, a surplus of 20, and a deficit of 140.' };
}

/* 6. 5.5: crowding out in the loanable funds market. */
{
  const id = 'crowding-out-lf', W = 860, H = 430;
  let b = lines(W / 2, 30, ['Crowding out: government borrowing raises the real interest rate'], { size: 19, weight: 'bold' });
  const a = panel(id, 90, 80, 330, 260, { x: 'Quantity of loanable funds', y: 'Real interest rate', title: 'Loanable funds market' });
  a.up(5).label(9.1, 9.1, 'S', 'LF');
  a.down(5, { stroke: GREY, dash: '6 5', sw: 2 }).label(9.1, 1.3, 'D', 'LF1', { fill: GREY });
  a.down(6.5, { stroke: VER }).label(9.95, 2.6, 'D', 'LF2', { fill: VER });
  a.arrow(5.6, 3.3, 7.1, 3.3, { color: 'arV', stroke: VER });
  a.point(5, 5, { xlab: lab('Q', '1'), ylab: lab('r', '1'), name: 'A', nameDx: -22 });
  a.point(5.75, 5.75, { fill: VER, xlab: lab('Q', '2'), ylab: lab('r', '2'), name: 'B' });
  b += a.svg();
  const steps = [['Government borrows', 'to pay for a deficit'], ['Demand for loanable', 'funds shifts right'], ['Real interest', 'rate rises'], ['Private investment', 'falls'], ['Capital stock grows', 'more slowly']];
  steps.forEach((t, i) => {
    const y = 74 + i * 64;
    b += box(520, y, 290, 48, { fill: i === 4 ? TINT : VTINT, stroke: i === 4 ? ACC : VER });
    b += lines(665, y + 20, t, { size: 13 });
    if (i < steps.length - 1) b += arrow(id, 665, y + 50, 665, y + 62, { color: 'arV', stroke: VER });
  });
  b += lines(W / 2, 414, ['The government takes a larger share of the funds; at the higher real rate, private borrowers want less.'], { size: 13, fill: GREY });
  figs[id] = { topic: 'crowding-out', w: W, h: H, svg: svg(id, W, H, 'Crowding out in the loanable funds market',
    'Left: a loanable funds graph with the real interest rate on the vertical axis and the quantity of loanable funds on the horizontal axis. Government borrowing shifts the demand for loanable funds right from DLF1 to DLF2, so the equilibrium moves from A at r1 and Q1 to B at a higher real interest rate r2 and a larger quantity Q2. Right: a chain of boxes: the government borrows, demand for loanable funds rises, the real interest rate rises, private investment falls, the capital stock grows more slowly.', b),
    alt: 'A loanable funds graph where the demand for loanable funds shifts right and the real interest rate rises, beside the chain from government borrowing to lower private investment and a slower-growing capital stock.' };
}

/* 7. 5.6: growth as the PPC shifting out and LRAS shifting right. */
{
  const id = 'economic-growth-ppc-lras', W = 860, H = 400;
  let b = lines(W / 2, 30, ['Economic growth on two graphs'], { size: 19, weight: 'bold' });
  const a = panel(id, 80, 80, 300, 250, { x: 'Consumer goods', y: 'Capital goods', title: 'Production possibilities curve' });
  a.ppc(6, { stroke: GREY, dash: '6 5', sw: 2 }).label(2.4, 4.6, 'PPC', '1', { fill: GREY });
  a.ppc(8, { stroke: ACC }).label(6.0, 6.0, 'PPC', '2', { fill: ACC });
  a.arrow(4.0, 4.0, 5.3, 5.3, { color: 'arA', stroke: ACC });
  a.dot(2.2, 2.0, 'X', { fill: INK, dx: 8, dy: 4 });
  a.note(2.2, 1.0, 'inside: idle resources', { fill: GREY, anchor: 'start' });
  const p = panel(id, 520, 80, 300, 250, { x: 'Real GDP', y: 'Price level', title: 'AD-AS' });
  p.vert(4, { stroke: GREY, dash: '6 5', sw: 2 }).label(4.1, 9.7, 'LRAS', '1', { fill: GREY });
  p.vert(6, { stroke: ACC }).label(6.1, 9.7, 'LRAS', '2', { fill: ACC });
  p.arrow(4.3, 8.3, 5.7, 8.3, { color: 'arA', stroke: ACC });
  p.label(4, -0.7, 'Y', 'F1', { fill: GREY, anchor: 'middle', size: 12 });
  p.label(6, -0.7, 'Y', 'F2', { fill: ACC, anchor: 'middle', size: 12 });
  b += a.svg() + p.svg();
  b += lines(W / 2, 384, ['More physical and human capital, better technology or more resources: the PPC shifts out and LRAS shifts right.'], { size: 13, fill: GREY });
  figs[id] = { topic: 'economic-growth', w: W, h: H, svg: svg(id, W, H, 'Economic growth on the PPC and the AD-AS graph',
    'Left: a production possibilities curve for capital goods and consumer goods shifts out from PPC1 to PPC2; a point X inside the curve marks idle resources. Right: an AD-AS graph where the vertical long-run aggregate supply curve shifts right from LRAS1 at YF1 to LRAS2 at YF2.', b),
    alt: 'Economic growth shown as the PPC shifting outward and LRAS shifting right to a higher full-employment output.' };
}

/* 8. 5.7: the channels from policy to long-run growth. */
{
  const id = 'growth-policy-channels', W = 860, H = 440;
  let b = lines(W / 2, 30, ['How public policy can raise long-run growth'], { size: 19, weight: 'bold' });
  const rows = [
    [['Tax incentives for investment;', 'smaller deficits (lower real rates)'], ['More physical capital', '(machines, factories)']],
    [['Education, job training,', 'public health'], ['More human capital', '(skills, knowledge)']],
    [['Research funding,', 'patent protection'], ['Better technology', '(new ideas, methods)']],
    [['Roads, ports, power,', 'communications networks'], ['Better infrastructure', '(public capital)']],
  ];
  rows.forEach(([pol, ch], i) => {
    const y = 64 + i * 86;
    b += box(24, y, 260, 64, { fill: BTINT, stroke: BLU }) + lines(154, y + 28, pol, { size: 13 });
    b += arrow(id, 288, y + 32, 330, y + 32, { color: 'arB', stroke: BLU });
    b += box(334, y, 220, 64, { fill: NTINT, stroke: INK }) + lines(444, y + 28, ch, { size: 13, weight: 'bold' });
    b += arrow(id, 558, y + 32, 604, 64 + 1.5 * 86 + 32, { color: 'ar', stroke: GREY, sw: 1.8 });
  });
  b += box(608, 150, 228, 120, { fill: TINT, stroke: ACC, sw: 3 }) + lines(722, 180, ['Productivity rises:', 'potential output grows,', 'LRAS shifts right,', 'the PPC shifts out'], { size: 13, weight: 'bold', fill: ACC });
  b += lines(W / 2, 420, ['Spending on these programs also raises AD in the short run; the growth effect comes later, through LRAS.'], { size: 13, fill: GREY });
  figs[id] = { topic: 'growth-policy', w: W, h: H, svg: svg(id, W, H, 'From growth policies to higher potential output',
    'Four rows: investment incentives and smaller deficits lead to more physical capital; education, training and public health to more human capital; research funding and patents to better technology; roads, ports, power and communications to better infrastructure. All four arrows point to one box: productivity rises, potential output grows, LRAS shifts right and the PPC shifts out. A note says the spending also raises AD in the short run.', b),
    alt: 'Four policy channels, physical capital, human capital, technology and infrastructure, all leading to higher productivity, LRAS shifting right and the PPC shifting out.' };
}

mkdirSync(OUT, { recursive: true });
const reg = {};
for (const [id, f] of Object.entries(figs)) {
  writeFileSync(join(OUT, `${id}.svg`), f.svg);
  (reg[f.topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
}
const FIGDIR = join(ROOT, 'macroeconomics', 'data', 'figures');
mkdirSync(FIGDIR, { recursive: true });
for (const [topic, o] of Object.entries(reg)) writeFileSync(join(FIGDIR, `${topic}.json`), JSON.stringify(o, null, 1) + '\n');
console.log(`author E: ${Object.keys(figs).length} figures written to macroeconomics/figures/ and registered in macroeconomics/data/figures/.`);
