/* Author C figures (AP® Macroeconomics Unit 3): the AD-AS lesson and notes
   figures, drawn as self-contained SVG files (shown as <img>, so every color
   is inline; the course inverts them in dark mode like every figure).

     node scripts/apmacro-figures/author-c.mjs     writes macroeconomics/figures/<id>.svg

   Geometry follows mac-graph.js: coordinates 0-10, AD slope -1 and SRAS
   slope +1 through (at, 5), LRAS vertical, so every crossing is exact and
   the figures match what the graph items draw. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'macroeconomics', 'figures');
const INK = '#1F2A28', MUTED = '#6B7472', C1 = '#355A0A', C2 = '#9A4A00', C3 = '#1F5C8A', BG = '#FFFFFF';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f1 = v => Math.round(v * 10) / 10;

/* One AD-AS panel at (ox, oy), size pw x ph, in data units 0-10. */
function panel({ ox, oy, pw = 250, ph = 230, title, curves = [], points = [], arrows = [], brackets = [], xLabel = 'Real GDP', yLabel = 'Price level', id }) {
  const X = x => ox + (x / 10) * pw, Y = v => oy + ph - (v / 10) * ph;
  const g = [];
  if (title) g.push(`<text x="${f1(ox + pw / 2)}" y="${f1(oy - 14)}" text-anchor="middle" font-size="15" font-weight="700" fill="${INK}">${esc(title)}</text>`);
  g.push(`<path d="M${ox} ${oy}V${oy + ph}H${ox + pw}" fill="none" stroke="${INK}" stroke-width="1.8"/>`);
  g.push(`<text x="${ox + pw}" y="${oy + ph + 34}" text-anchor="end" font-size="13" font-weight="700" fill="${INK}">${esc(xLabel)}</text>`);
  g.push(`<text transform="translate(${ox - 30} ${oy}) rotate(-90)" text-anchor="end" font-size="13" font-weight="700" fill="${INK}">${esc(yLabel)}</text>`);
  for (const c of curves) {
    const col = c.old ? MUTED : c.color || C1, dash = c.old ? ' stroke-dasharray="4 5"' : '', w = c.old ? 2 : 2.8;
    let d, lx, ly, anchor = 'start';
    if (c.shape === 'vertical') { d = `M${f1(X(c.at))} ${f1(Y(9.6))}V${f1(Y(0))}`; lx = X(c.at) + 5; ly = Y(9.6) + 12; }
    else {
      const ys = x => c.shape === 'down' ? 5 - (x - c.at) : 5 + (x - c.at);
      const x0 = Math.max(0.3, c.shape === 'down' ? c.at - 4.2 : c.at - 4.2), x1 = Math.min(9.8, c.at + 4.2);
      d = `M${f1(X(x0))} ${f1(Y(ys(x0)))}L${f1(X(x1))} ${f1(Y(ys(x1)))}`;
      lx = X(x1) + 4; ly = Y(ys(x1)) + (c.shape === 'down' ? 12 : -2);
      if (lx > ox + pw - 4) { lx = X(x1); anchor = 'middle'; ly = c.shape === 'down' ? Y(ys(x1)) + 16 : Y(ys(x1)) - 8; }
    }
    g.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${dash}/>`);
    g.push(`<text x="${f1(lx)}" y="${f1(ly)}" text-anchor="${anchor}" font-size="13" font-weight="700" fill="${col}">${esc(c.name)}${c.sub ? `<tspan font-size="10" dy="3">${esc(c.sub)}</tspan>` : ''}</text>`);
  }
  for (const p of points) {
    if (p.tick) { g.push(`<text x="${f1(X(p.x))}" y="${f1(Y(0) + 16)}" text-anchor="middle" font-size="12" font-weight="700" fill="${p.old ? MUTED : INK}">${esc(p.xl)}</text>`); continue; }
    g.push(`<path d="M${f1(X(0))} ${f1(Y(p.y))}H${f1(X(p.x))}V${f1(Y(0))}" fill="none" stroke="${p.old ? MUTED : INK}" stroke-width="1.1" stroke-dasharray="3 4"/>`);
    g.push(`<circle cx="${f1(X(p.x))}" cy="${f1(Y(p.y))}" r="4.5" fill="${p.old ? MUTED : INK}"/>`);
    if (p.yl) g.push(`<text x="${f1(X(0) - 5)}" y="${f1(Y(p.y) + 4)}" text-anchor="end" font-size="12" font-weight="700" fill="${p.old ? MUTED : INK}">${esc(p.yl)}</text>`);
    if (p.xl) g.push(`<text x="${f1(X(p.x))}" y="${f1(Y(0) + 16)}" text-anchor="middle" font-size="12" font-weight="700" fill="${p.old ? MUTED : INK}">${esc(p.xl)}</text>`);
    if (p.label) g.push(`<text x="${f1(X(p.x) + 8)}" y="${f1(Y(p.y) - 7)}" font-size="12" font-weight="700" fill="${INK}">${esc(p.label)}</text>`);
  }
  for (const a of arrows) {
    g.push(`<path d="M${f1(X(a.from[0]))} ${f1(Y(a.from[1]))}L${f1(X(a.to[0]))} ${f1(Y(a.to[1]))}" stroke="${a.color || C2}" stroke-width="2.2" marker-end="url(#${id}-ar)"/>`);
  }
  for (const b of brackets) {
    const yb = Y(0) + 26;
    g.push(`<path d="M${f1(X(b.x0))} ${f1(yb - 5)}V${f1(yb)}H${f1(X(b.x1))}V${f1(yb - 5)}" fill="none" stroke="${C3}" stroke-width="1.6"/>`);
    g.push(`<text x="${f1((X(b.x0) + X(b.x1)) / 2)}" y="${f1(yb + 14)}" text-anchor="middle" font-size="12" font-weight="700" fill="${C3}">${esc(b.text)}</text>`);
  }
  return g.join('\n');
}

function svgDoc(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="Arial, Helvetica, sans-serif">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs><marker id="${id}-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C2}"/></marker></defs>
<rect width="${w}" height="${h}" fill="${BG}"/>
${body}
</svg>
`;
}

// Crossing of AD (down, at a) and SRAS (up, at s).
const eq = (a, s) => [(a + s) / 2, 5 + (a - s) / 2];

const FIGS = {};
function add(id, w, h, title, desc, body) { FIGS[id] = svgDoc(id, w, h, title, desc, body); }

// 3.1 Aggregate demand: a movement along AD vs a shift of AD.
add('aggregate-demand-curve', 640, 330, 'Movement along AD and a shift of AD',
  'Two graphs with the price level on the vertical axis and real GDP on the horizontal axis. Left: one downward-sloping AD curve; a fall in the price level from PL1 to PL2 moves along it from Y1 to a larger Y2. Right: AD1 shifts right to AD2 when spending rises at every price level.',
  panel({ id: 'aggregate-demand-curve', ox: 60, oy: 40, title: 'A movement along AD', curves: [{ shape: 'down', at: 5, name: 'AD' }],
    points: [{ x: 4, y: 6, yl: 'PL1', xl: 'Y1', label: 'A' }, { x: 6, y: 4, yl: 'PL2', xl: 'Y2', label: 'B' }], arrows: [{ from: [4.35, 5.65], to: [5.65, 4.35] }] }) + '\n' +
  panel({ id: 'aggregate-demand-curve', ox: 370, oy: 40, title: 'A shift of AD', curves: [{ shape: 'down', at: 3.5, name: 'AD', sub: '1', old: true }, { shape: 'down', at: 6.5, name: 'AD', sub: '2' }],
    arrows: [{ from: [3.4, 5.6], to: [5.6, 5.6] }] }));

// 3.2 Multipliers: rounds of spending with MPC 0.8 (a bar chart, drawn here).
{
  const rounds = [100, 80, 64, 51.2, 41, 32.8], w = 640, h = 360, ox = 70, oy = 40, pw = 520, ph = 230;
  const g = [`<text x="${ox + pw / 2}" y="24" text-anchor="middle" font-size="15" font-weight="700" fill="${INK}">New spending in each round (MPC = 0.8, first round 100)</text>`];
  g.push(`<path d="M${ox} ${oy}V${oy + ph}H${ox + pw}" fill="none" stroke="${INK}" stroke-width="1.8"/>`);
  [0, 25, 50, 75, 100].forEach(v => { const y = oy + ph - v / 100 * ph; g.push(`<text x="${ox - 6}" y="${f1(y + 4)}" text-anchor="end" font-size="12" fill="${INK}">${v}</text><path d="M${ox} ${f1(y)}H${ox + pw}" stroke="#D9DEDC" stroke-width="1"/>`); });
  rounds.forEach((v, i) => {
    const bw = 58, x = ox + 18 + i * 80, y = oy + ph - v / 100 * ph;
    g.push(`<rect x="${x}" y="${f1(y)}" width="${bw}" height="${f1(v / 100 * ph)}" fill="${i ? C1 : C2}"/>`);
    g.push(`<text x="${x + bw / 2}" y="${f1(y - 6)}" text-anchor="middle" font-size="12" font-weight="700" fill="${INK}">${v}</text>`);
    g.push(`<text x="${x + bw / 2}" y="${oy + ph + 16}" text-anchor="middle" font-size="12" fill="${INK}">${i + 1}</text>`);
  });
  g.push(`<text x="${ox + pw}" y="${oy + ph + 36}" text-anchor="end" font-size="13" font-weight="700" fill="${INK}">Round of spending</text>`);
  g.push(`<text transform="translate(${ox - 40} ${oy}) rotate(-90)" text-anchor="end" font-size="13" font-weight="700" fill="${INK}">New spending (millions of dollars)</text>`);
  g.push(`<text x="${ox + pw}" y="${oy + 22}" text-anchor="end" font-size="13" font-weight="700" fill="${C3}">All rounds add up to 100 × 5 = 500</text>`);
  FIGS['multipliers-rounds'] = svgDoc('multipliers-rounds', w, h, 'Rounds of spending behind the multiplier',
    'A bar chart of new spending in each round when the MPC is 0.8 and the first round is 100 million dollars: 100, then 80, 64, 51.2, 41 and 32.8, each round 0.8 times the one before. All rounds together add up to 500, five times the first.', g.join('\n'));
}

// 3.3 SRAS: upward slope and a leftward shift.
add('sras-curve', 640, 330, 'Movement along SRAS and a shift of SRAS',
  'Two graphs with the price level on the vertical axis and real GDP on the horizontal axis. Left: an upward-sloping SRAS curve; a higher price level PL2 goes with more output Y2. Right: SRAS1 shifts left to SRAS2 when input costs such as nominal wages rise.',
  panel({ id: 'sras-curve', ox: 60, oy: 40, title: 'A movement along SRAS', curves: [{ shape: 'up', at: 5, name: 'SRAS' }],
    points: [{ x: 4, y: 4, yl: 'PL1', xl: 'Y1' }, { x: 6, y: 6, yl: 'PL2', xl: 'Y2' }], arrows: [{ from: [4.35, 4.35], to: [5.65, 5.65] }] }) + '\n' +
  panel({ id: 'sras-curve', ox: 370, oy: 40, title: 'A shift of SRAS', curves: [{ shape: 'up', at: 6.5, name: 'SRAS', sub: '1', old: true }, { shape: 'up', at: 3.5, name: 'SRAS', sub: '2' }],
    arrows: [{ from: [6.6, 4.4], to: [4.4, 4.4] }] }));

// 3.4 LRAS: vertical at full-employment output, and a rightward shift.
add('lras-curve', 640, 330, 'LRAS at full-employment output, and a shift of LRAS',
  'Two graphs with the price level on the vertical axis and real GDP on the horizontal axis. Left: a vertical LRAS at full-employment output YF; the price levels PL1 and PL2 both go with the same output. Right: LRAS1 at YF1 shifts right to LRAS2 at YF2 when the economy gains resources or better technology.',
  panel({ id: 'lras-curve', ox: 60, oy: 40, title: 'LRAS is vertical at YF', curves: [{ shape: 'vertical', at: 5, name: 'LRAS' }],
    points: [{ x: 5, y: 7, yl: 'PL2' }, { x: 5, y: 3.5, yl: 'PL1', xl: 'YF' }] }) + '\n' +
  panel({ id: 'lras-curve', ox: 370, oy: 40, title: 'More resources shift LRAS right', curves: [{ shape: 'vertical', at: 4, name: 'LRAS', sub: '1', old: true }, { shape: 'vertical', at: 6.5, name: 'LRAS', sub: '2' }],
    points: [{ x: 4, y: 0.01, xl: 'YF1', old: true }, { x: 6.5, y: 0.01, xl: 'YF2' }], arrows: [{ from: [4.2, 6], to: [6.3, 6] }] }));

// 3.5 Equilibrium and gaps.
{
  const [rx, ry] = eq(3, 5), [ix, iy] = eq(7, 5);
  add('adas-equilibrium-gaps', 660, 350, 'Recessionary and inflationary gaps',
    'Two AD-AS graphs, each with AD, SRAS and a vertical LRAS at full-employment output YF. Left: AD crosses SRAS at Y1, to the left of YF, a recessionary gap. Right: AD crosses SRAS at Y1, to the right of YF, an inflationary gap with a higher price level.',
    panel({ id: 'adas-equilibrium-gaps', ox: 60, oy: 40, title: 'Recessionary gap: Y1 < YF', curves: [{ shape: 'vertical', at: 5, name: 'LRAS', color: C3 }, { shape: 'up', at: 5, name: 'SRAS' }, { shape: 'down', at: 3, name: 'AD', color: C2 }],
      points: [{ x: rx, y: ry, yl: 'PL1', xl: 'Y1' }, { x: 5, tick: true, xl: 'YF' }], brackets: [{ x0: rx, x1: 5, text: 'gap' }] }) + '\n' +
    panel({ id: 'adas-equilibrium-gaps', ox: 380, oy: 40, title: 'Inflationary gap: Y1 > YF', curves: [{ shape: 'vertical', at: 5, name: 'LRAS', color: C3 }, { shape: 'up', at: 5, name: 'SRAS' }, { shape: 'down', at: 7, name: 'AD', color: C2 }],
      points: [{ x: ix, y: iy, yl: 'PL1', xl: 'Y1' }, { x: 5, tick: true, xl: 'YF' }], brackets: [{ x0: 5, x1: ix, text: 'gap' }] }));
}

// 3.6 Demand-pull and cost-push.
{
  const e1 = eq(5, 5), d2 = eq(7, 5), c2 = eq(5, 3);
  add('adas-short-run-changes-shocks', 660, 340, 'Demand-pull and cost-push inflation',
    'Two AD-AS graphs. Left: AD1 shifts right to AD2; the price level rises from PL1 to PL2 and real GDP rises from Y1 to Y2 (demand-pull inflation). Right: SRAS1 shifts left to SRAS2; the price level rises from PL1 to PL2 while real GDP falls from Y1 to Y2 (cost-push inflation).',
    panel({ id: 'adas-short-run-changes-shocks', ox: 60, oy: 40, title: 'Demand-pull: AD shifts right', curves: [{ shape: 'up', at: 5, name: 'SRAS' }, { shape: 'down', at: 5, name: 'AD', sub: '1', old: true }, { shape: 'down', at: 7, name: 'AD', sub: '2', color: C2 }],
      points: [{ x: e1[0], y: e1[1], yl: 'PL1', xl: 'Y1', old: true }, { x: d2[0], y: d2[1], yl: 'PL2', xl: 'Y2' }], arrows: [{ from: [2.3, 8.1], to: [4.1, 8.1] }] }) + '\n' +
    panel({ id: 'adas-short-run-changes-shocks', ox: 380, oy: 40, title: 'Cost-push: SRAS shifts left', curves: [{ shape: 'down', at: 5, name: 'AD', color: C2 }, { shape: 'up', at: 5, name: 'SRAS', sub: '1', old: true }, { shape: 'up', at: 3, name: 'SRAS', sub: '2' }],
      points: [{ x: e1[0], y: e1[1], yl: 'PL1', xl: 'Y1', old: true }, { x: c2[0], y: c2[1], yl: 'PL2', xl: 'Y2' }], arrows: [{ from: [7.6, 3.2], to: [5.8, 3.2] }] }));
}

// 3.7 Self-adjustment from a recessionary gap.
{
  const a = eq(3, 5), b = eq(3, 7);
  add('long-run-self-adjustment-recession', 420, 360, 'Self-adjustment from a recessionary gap',
    'An AD-AS graph with a vertical LRAS at YF. AD crosses SRAS1 at Y1, below YF, at price level PL1. As nominal wages fall, SRAS1 shifts right to SRAS2, which crosses AD on LRAS at YF and a lower price level PL2.',
    panel({ id: 'long-run-self-adjustment-recession', ox: 80, oy: 40, pw: 280, ph: 240, title: 'Wages fall, SRAS shifts right', curves: [{ shape: 'vertical', at: 5, name: 'LRAS', color: C3 }, { shape: 'down', at: 3, name: 'AD', color: C2 }, { shape: 'up', at: 5, name: 'SRAS', sub: '1', old: true }, { shape: 'up', at: 7, name: 'SRAS', sub: '2' }],
      points: [{ x: a[0], y: a[1], yl: 'PL1', xl: 'Y1', old: true }, { x: b[0], y: b[1], yl: 'PL2', xl: 'YF' }], arrows: [{ from: [6.6, 6.6], to: [8.4, 6.6] }] }));
}

// 3.8 Fiscal policy closing a recessionary gap.
{
  const a = eq(3, 5), b = eq(5, 5);
  add('fiscal-policy-close-gap', 420, 360, 'Expansionary fiscal policy closes a recessionary gap',
    'An AD-AS graph with a vertical LRAS at YF. AD1 crosses SRAS at Y1, below YF, at PL1. Higher government spending or lower taxes shift AD1 right to AD2, which crosses SRAS on LRAS at YF and a higher price level PL2.',
    panel({ id: 'fiscal-policy-close-gap', ox: 80, oy: 40, pw: 280, ph: 240, title: 'Spending up or taxes down: AD shifts right', curves: [{ shape: 'vertical', at: 5, name: 'LRAS', color: C3 }, { shape: 'up', at: 5, name: 'SRAS' }, { shape: 'down', at: 3, name: 'AD', sub: '1', old: true }, { shape: 'down', at: 5, name: 'AD', sub: '2', color: C2 }],
      points: [{ x: a[0], y: a[1], yl: 'PL1', xl: 'Y1', old: true }, { x: b[0], y: b[1], yl: 'PL2', xl: 'YF' }], arrows: [{ from: [1.2, 7.2], to: [3, 7.2] }] }));
}

// 3.9 Automatic stabilizers: a flow diagram.
{
  const w = 680, h = 300, g = [];
  const box = (x, y, bw, t, col) => { g.push(`<rect x="${x}" y="${y}" width="${bw}" height="62" rx="10" fill="#F4F7EE" stroke="${col}" stroke-width="2"/>`); t.forEach((s, i) => g.push(`<text x="${x + bw / 2}" y="${y + 24 + i * 17}" text-anchor="middle" font-size="13" font-weight="${i ? 400 : 700}" fill="${INK}">${esc(s)}</text>`)); };
  const arr = (x1, y1, x2, y2) => g.push(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${C2}" stroke-width="2.2" marker-end="url(#automatic-stabilizers-flow-ar)"/>`);
  g.push(`<text x="${w / 2}" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="${INK}">In a recession, with no new law</text>`);
  box(20, 60, 180, ['Incomes and jobs fall', 'real GDP falls'], C3);
  box(250, 20 + 30, 190, ['Tax bills fall faster', 'progressive income tax'], C1);
  box(250, 140 + 20, 190, ['Transfers rise', 'unemployment compensation'], C1);
  box(490, 105, 170, ['Disposable income', 'falls by less'], C1);
  box(490, 205, 170, ['Consumption and AD', 'fall by less'], C2);
  arr(200, 85, 248, 80); arr(200, 100, 248, 185); arr(440, 82, 488, 125); arr(440, 190, 488, 145); arr(575, 167, 575, 203);
  g.push(`<text x="20" y="${h - 14}" font-size="12" fill="${MUTED}">In a boom the same programs work in reverse: tax bills rise faster than income and transfers fall.</text>`);
  FIGS['automatic-stabilizers-flow'] = svgDoc('automatic-stabilizers-flow', w, h, 'How automatic stabilizers soften a recession',
    'A flow diagram. When incomes and jobs fall in a recession, tax bills under a progressive income tax fall faster than income, and transfers such as unemployment compensation rise. Both keep disposable income from falling as much, so consumption and aggregate demand fall by less. In a boom the same programs work in reverse.', g.join('\n'));
}

mkdirSync(OUT, { recursive: true });
for (const [id, s] of Object.entries(FIGS)) writeFileSync(join(OUT, `${id}.svg`), s);
console.log(`author C figures: ${Object.keys(FIGS).length} written to macroeconomics/figures/`);
