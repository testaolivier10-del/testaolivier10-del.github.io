/* Figures for AP® Microeconomics Unit 2 (author B): demand and supply
   schedules with a movement and a shift, the elastic and inelastic ranges of
   a straight-line demand curve with total revenue, supply elasticities, the
   signs of income and cross-price elasticity, consumer and producer surplus,
   a shortage and a surplus, two curves shifting at once, a per-unit tax with
   its areas, price controls, and a small country at the world price with a
   tariff. Each is a LevlPrep original SVG written to
   microeconomics/figures/<id>.svg; the registry entries go in
   microeconomics/data/figures/<topic>.json.

     node scripts/apmicro-figures/author-b.mjs

   House style (as the other courses' figure scripts): white background,
   Arial/Helvetica, ink #1F2A28, demand in cerulean #084F78, supply in the
   course plum #7E1A5E, consumer surplus pale blue, producer surplus pale
   plum, government revenue pale amber, deadweight loss pale vermillion with
   an Okabe-Ito vermillion #D55E00 edge. Every SVG has role="img", a <title>
   and a <desc>. Every number drawn is computed here from the invented
   straight-line markets the notes, lessons and questions use, so a figure
   and its worked example always agree. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'microeconomics', 'figures');
const DATA = join(ROOT, 'microeconomics', 'data');
mkdirSync(FIG, { recursive: true });
mkdirSync(join(DATA, 'figures'), { recursive: true });

const INK = '#1F2A28', MUTED = '#5B6664', BLUE = '#084F78', PLUM = '#7E1A5E', VERM = '#D55E00', GREEN = '#355A0A';
const FILL = { cs: '#DCEAF5', ps: '#F6E1EE', gov: '#FCEBC8', dwl: '#FBD9C6', gain: '#E3EFD3', plain: '#EEF1F0' };
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = v => Math.round(v * 10) / 10;

class Fig {
  constructor(id, w, h, title, desc) { Object.assign(this, { id, w, h, title, desc, body: [] }); }
  add(s) { this.body.push(s); return this; }
  text(x, y, s, { size = 13, anchor = 'start', bold = false, color = INK } = {}) {
    const lines = [].concat(s), lh = size * 1.25;
    return this.add(`<text x="${r(x)}" y="${r(y)}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${bold ? ' font-weight="bold"' : ''}>${lines.map((l, i) => `<tspan x="${r(x)}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join('')}</text>`);
  }
  svg() {
    const mk = (n, c) => `<marker id="${this.id}-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-labelledby="${this.id}-t ${this.id}-d" font-family="${FONT}">
<title id="${this.id}-t">${esc(this.title)}</title>
<desc id="${this.id}-d">${esc(this.desc)}</desc>
<defs>${mk('ink', INK)}${mk('b', BLUE)}${mk('p', PLUM)}${mk('v', VERM)}</defs>
<rect width="${this.w}" height="${this.h}" fill="#FFFFFF"/>
${this.body.join('\n')}
</svg>
`;
  }
}

/* One graph panel in data units. o: { ox, oy (top-left of the plot), pw, ph,
   xmax, ymax, xlab, ylab, title, xticks: [[v, text]], yticks: [[v, text]] }.
   Returns helpers that draw in data units. */
function panel(f, o) {
  const X = x => o.ox + x / o.xmax * o.pw, Y = v => o.oy + o.ph - v / o.ymax * o.ph;
  const P = {
    X, Y,
    poly(pts, fill, label, { stroke, lx, ly, color = INK, size = 13 } = {}) {
      f.add(`<path d="M${pts.map(p => `${r(X(p[0]))} ${r(Y(p[1]))}`).join('L')}Z" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="1.4"` : ''}/>`);
      if (label) {
        const cx = lx ?? pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = ly ?? pts.reduce((a, p) => a + p[1], 0) / pts.length;
        f.text(X(cx), Y(cy) + 4, label, { size, anchor: 'middle', bold: true, color });
      }
      return P;
    },
    line(x0, y0, x1, y1, { color = BLUE, sw = 2.8, dash, label, lx, ly, anchor = 'start', arrow } = {}) {
      f.add(`<path d="M${r(X(x0))} ${r(Y(y0))}L${r(X(x1))} ${r(Y(y1))}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}${arrow ? ` marker-end="url(#${f.id}-${arrow})"` : ''}/>`);
      if (label) f.text(lx ?? X(x1) + 5, ly ?? Y(y1) + 4, label, { size: 13, bold: true, color, anchor });
      return P;
    },
    curve(fn, x0, x1, opts = {}) {
      const pts = []; for (let i = 0; i <= 40; i++) { const x = x0 + (x1 - x0) * i / 40; pts.push([x, fn(x)]); }
      f.add(`<path d="M${pts.map(p => `${r(X(p[0]))} ${r(Y(p[1]))}`).join('L')}" fill="none" stroke="${opts.color || INK}" stroke-width="${opts.sw || 2.8}"${opts.dash ? ` stroke-dasharray="${opts.dash}"` : ''}/>`);
      if (opts.label) f.text(opts.lx ?? X(x1) + 5, opts.ly ?? Y(fn(x1)) + 4, opts.label, { size: 13, bold: true, color: opts.color || INK });
      return P;
    },
    hline(v, x1, { label, color = INK, dash = '4 4', sw = 1.2, tick = true } = {}) {
      f.add(`<path d="M${r(X(0))} ${r(Y(v))}H${r(X(x1))}" stroke="${color}" stroke-width="${sw}" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      if (label && tick) f.text(X(0) - 6, Y(v) + 4, label, { size: 12, anchor: 'end', bold: true, color });
      return P;
    },
    vline(x, v, { label, color = INK, dash = '4 4' } = {}) {
      f.add(`<path d="M${r(X(x))} ${r(Y(v))}V${r(Y(0))}" stroke="${color}" stroke-width="1.2" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
      if (label) f.text(X(x), Y(0) + 17, label, { size: 12, anchor: 'middle', bold: true, color });
      return P;
    },
    dot(x, v, label, { dx = 8, dy = -7, color = INK, anchor = 'start' } = {}) {
      f.add(`<circle cx="${r(X(x))}" cy="${r(Y(v))}" r="4.5" fill="${color}"/>`);
      if (label) f.text(X(x) + dx, Y(v) + dy, label, { size: 12, bold: true, color, anchor });
      return P;
    },
    arrow(x0, y0, x1, y1, color = VERM) {
      f.add(`<path d="M${r(X(x0))} ${r(Y(y0))}L${r(X(x1))} ${r(Y(y1))}" stroke="${color}" stroke-width="2.2" fill="none" marker-end="url(#${f.id}-v)"/>`);
      return P;
    },
    bracket(x0, x1, text, color = VERM, below = 30) {
      const yb = Y(0) + below;
      f.add(`<path d="M${r(X(x0))} ${r(yb - 6)}V${r(yb)}H${r(X(x1))}V${r(yb - 6)}" fill="none" stroke="${color}" stroke-width="1.6"/>`);
      f.text((X(x0) + X(x1)) / 2, yb + 15, text, { size: 12, anchor: 'middle', bold: true, color });
      return P;
    },
    axes() {
      f.add(`<path d="M${o.ox} ${o.oy - 6}V${o.oy + o.ph}H${o.ox + o.pw + 6}" fill="none" stroke="${INK}" stroke-width="1.8"/>`);
      if (o.title) f.text(o.ox + o.pw / 2, o.oy - 16, o.title, { size: 15, bold: true, anchor: 'middle' });
      f.text(o.ox + o.pw, o.oy + o.ph + (o.xlabDy || 36), o.xlab, { size: 13, bold: true, anchor: 'end' });
      f.add(`<text transform="translate(${r(o.ox - (o.ylabDx || 40))} ${o.oy}) rotate(-90)" text-anchor="end" font-size="13" font-weight="bold" fill="${INK}">${esc(o.ylab)}</text>`);
      for (const [v, t] of o.xticks || []) { f.add(`<path d="M${r(X(v))} ${r(Y(0))}v5" stroke="${INK}" stroke-width="1.2"/>`); f.text(X(v), Y(0) + 17, t, { size: 11, anchor: 'middle', color: MUTED }); }
      for (const [v, t] of o.yticks || []) { f.add(`<path d="M${r(X(0))} ${r(Y(v))}h-5" stroke="${INK}" stroke-width="1.2"/>`); f.text(X(0) - 8, Y(v) + 4, t, { size: 11, anchor: 'end', color: MUTED }); }
      return P;
    },
  };
  return P;
}

const registry = {};
function save(topic, f, alt) {
  writeFileSync(join(FIG, `${f.id}.svg`), f.svg());
  (registry[topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}
const ticks = (from, to, step, fmt = v => String(v)) => { const t = []; for (let v = from; v <= to + 1e-9; v += step) t.push([v, fmt(v)]); return t; };
const usd = v => `$${v}`;

/* ==================== 2.1 demand: a movement along and a shift ==== */
{
  // Veggie wraps at a campus cart (invented): Qd = 80 - 10P; D2 adds 20 at every price.
  const qd = p => 80 - 10 * p, qd2 = p => 100 - 10 * p;
  const f = new Fig('demand-movement-shift', 760, 400, 'A movement along demand and a shift of demand',
    'Two panels for veggie wraps, price on the vertical axis and quantity per day on the horizontal axis. Left: one demand curve D; a fall in price from $5 to $3 moves buyers along the curve from point A (30 wraps) to point B (50 wraps): a change in quantity demanded. Right: a rise in buyers\' incomes shifts the whole curve right from D1 to D2, so at $4 buyers want 60 wraps instead of 40: a change in demand. Invented data for practice.');
  for (const [i, title] of [[0, 'Price falls: a movement along D'], [1, 'Income rises: D shifts right']]) {
    const P = panel(f, { ox: 70 + i * 370, oy: 50, pw: 280, ph: 260, xmax: 100, ymax: 8, xlab: 'Quantity of wraps per day', ylab: 'Price', title, xticks: ticks(20, 100, 20), yticks: ticks(1, 7, 1, usd) }).axes();
    if (i === 0) {
      P.line(10, 7, 70, 1, { color: BLUE, label: 'D' });
      P.hline(5, qd(5)).vline(qd(5), 5).hline(3, qd(3)).vline(qd(3), 3);
      P.dot(qd(5), 5, 'A').dot(qd(3), 3, 'B');
      P.arrow(qd(5) + 2, 5 - 0.2, qd(3) - 2, 3 + 0.2);
    } else {
      P.line(10, 7, 70, 1, { color: MUTED, sw: 2.2, dash: '6 5', label: 'D1' });
      P.line(30, 7, 90, 1, { color: BLUE, label: 'D2' });
      P.hline(4, qd2(4)).vline(qd(4), 4).vline(qd2(4), 4);
      P.dot(qd(4), 4, '40', { dx: -8, anchor: 'end' }).dot(qd2(4), 4, '60');
      P.arrow(qd(4) + 3, 4.6, qd2(4) - 3, 4.6);
    }
  }
  f.text(380, 390, 'Invented data for practice.', { size: 11, anchor: 'middle', color: MUTED });
  save('demand', f, 'Left: a price fall moves buyers along one demand curve from A (30 wraps at $5) to B (50 wraps at $3). Right: higher incomes shift demand right from D1 to D2, so 60 wraps instead of 40 are wanted at $4.');
}

/* ==================== 2.2 supply: a movement along and a shift ==== */
{
  // Strawberries from a farm (invented): Qs = 10P; after a rise in fertilizer prices S2: Qs = 10P - 20.
  const f = new Fig('supply-movement-shift', 760, 400, 'A movement along supply and a shift of supply',
    'Two panels for boxes of strawberries, price on the vertical axis and quantity on the horizontal axis. Left: a rise in price from $3 to $5 moves sellers along supply S from 30 to 50 boxes: a change in quantity supplied. Right: a rise in the price of fertilizer, an input, shifts supply left from S1 to S2, so at $5 sellers offer 30 boxes instead of 50: a decrease in supply. Invented data for practice.');
  for (const [i, title] of [[0, 'Price rises: a movement along S'], [1, 'Input price rises: S shifts left']]) {
    const P = panel(f, { ox: 70 + i * 370, oy: 50, pw: 280, ph: 260, xmax: 80, ymax: 8, xlab: 'Boxes of strawberries', ylab: 'Price', title, xticks: ticks(10, 70, 20), yticks: ticks(1, 7, 1, usd) }).axes();
    if (i === 0) {
      P.line(10, 1, 70, 7, { color: PLUM, label: 'S' });
      P.hline(3, 30).vline(30, 3).hline(5, 50).vline(50, 5);
      P.dot(30, 3, 'A', { dx: 8, dy: 14 }).dot(50, 5, 'B', { dx: 8, dy: 14 });
      P.arrow(32, 3.4, 48, 4.6);
    } else {
      P.line(10, 1, 70, 7, { color: MUTED, sw: 2.2, dash: '6 5', label: 'S1' });
      P.line(0, 2, 50, 7, { color: PLUM, label: 'S2', lx: P.X(50) - 32, ly: P.Y(7) + 4 });
      P.hline(5, 50).vline(30, 5).vline(50, 5);
      P.dot(30, 5, '30', { dx: -8, anchor: 'end' }).dot(50, 5, '50', { dx: 8, dy: 16 });
      P.arrow(47, 5.6, 33, 5.6);
    }
  }
  f.text(380, 390, 'Invented data for practice.', { size: 11, anchor: 'middle', color: MUTED });
  save('supply', f, 'Left: a price rise moves sellers along one supply curve from 30 boxes at $3 to 50 boxes at $5. Right: a higher fertilizer price shifts supply left from S1 to S2, so 30 boxes instead of 50 are offered at $5.');
}

/* ========== 2.3 elastic and inelastic ranges, and total revenue ==== */
{
  // Phone cases (invented): Qd = 100 - 10P; TR = P x Q, largest at $5 (unit elastic).
  const f = new Fig('price-elasticity-demand-ranges', 780, 420, 'Elasticity changes along a straight-line demand curve',
    'Left: a straight-line demand curve for phone cases from $10 at zero cases to 100 cases at $0. Above the midpoint ($5, 50 cases) demand is elastic; at the midpoint it is unit elastic; below it demand is inelastic, even though the slope is the same everywhere. Right: total revenue (price times quantity) at each quantity. It rises from $0 to its largest value, $250, at the midpoint and then falls back to $0: cutting the price raises revenue in the elastic range and lowers it in the inelastic range. Invented data for practice.');
  const P = panel(f, { ox: 70, oy: 50, pw: 280, ph: 270, xmax: 100, ymax: 10, xlab: 'Quantity of cases', ylab: 'Price', title: 'Demand', xticks: ticks(20, 100, 20), yticks: ticks(2, 10, 2, usd) }).axes();
  P.line(0, 10, 50, 5, { color: BLUE, sw: 4 }).line(50, 5, 100, 0, { color: '#4B8DB8', sw: 4 });
  P.hline(5, 50, { label: '$5' }).vline(50, 5, { label: '' });
  P.dot(50, 5, 'Unit elastic', { dx: 10, dy: -8 });
  f.text(P.X(22), P.Y(8.6), ['Elastic', '(|E| > 1)'], { size: 13, bold: true, color: BLUE });
  f.text(P.X(70), P.Y(3.6), ['Inelastic', '(|E| < 1)'], { size: 13, bold: true, color: '#4B8DB8' });
  f.text(P.X(92), P.Y(2.2), 'D', { size: 13, bold: true, color: BLUE });
  const T = panel(f, { ox: 460, oy: 50, pw: 280, ph: 270, xmax: 100, ymax: 300, xlab: 'Quantity of cases', ylab: 'Total revenue', title: 'Total revenue', xticks: ticks(20, 100, 20), yticks: ticks(50, 250, 50, usd), ylabDx: 46 }).axes();
  T.curve(q => q * (10 - q / 10), 0, 100, { color: GREEN, label: 'TR', lx: T.X(93), ly: T.Y(120) });
  T.hline(250, 50, { label: '' }).vline(50, 250);
  T.dot(50, 250, 'Largest: $250 at $5', { dx: 8, dy: -10 });
  f.text(T.X(36), T.Y(70), ['Price cut,', 'TR rises'], { size: 12, bold: true, color: BLUE, anchor: 'middle' });
  f.text(T.X(64), T.Y(70), ['Price cut,', 'TR falls'], { size: 12, bold: true, color: '#4B8DB8', anchor: 'middle' });
  f.text(390, 410, 'Invented data for practice. The slope of D is the same everywhere; elasticity is not.', { size: 11, anchor: 'middle', color: MUTED });
  save('price-elasticity-demand', f, 'A straight-line demand curve for phone cases is elastic above its midpoint, unit elastic at $5 and 50 cases, and inelastic below it. Total revenue rises to its largest value, $250, at the midpoint and then falls.');
}

/* ======================= 2.4 supply elasticities through one point ==== */
{
  const f = new Fig('price-elasticity-supply-curves', 760, 400, 'Three supplies through the same point',
    'Three supply curves pass through the same starting point at a price of $4 and 40 units. A vertical supply is perfectly inelastic: the quantity stays at 40 whatever the price. A steep supply is inelastic: a rise to $6 adds only a few units. A flat supply is elastic: the same price rise adds many units. Because the three curves start from the same point, the flatter one is the more elastic. Invented data for practice.');
  const P = panel(f, { ox: 80, oy: 50, pw: 360, ph: 280, xmax: 90, ymax: 8, xlab: 'Quantity supplied', ylab: 'Price', xticks: ticks(10, 80, 10), yticks: ticks(1, 7, 1, usd) }).axes();
  P.line(40, 0.6, 40, 7.6, { color: MUTED, sw: 2.6, label: 'Perfectly inelastic', lx: P.X(40) - 6, ly: P.Y(7.6) - 6, anchor: 'end' });
  P.line(34, 0.4, 46, 7.6, { color: PLUM, label: 'Inelastic', lx: P.X(46) + 6, ly: P.Y(7.6) + 4 });
  P.line(10, 2.5, 88, 6.4, { color: '#B8467F', label: 'Elastic', lx: P.X(88) - 4, ly: P.Y(6.4) - 12, anchor: 'end' });
  P.hline(6, 80).hline(4, 40);
  P.vline(40, 4).dot(40, 4, 'Start', { dx: -8, dy: -8, anchor: 'end' });
  P.dot(43.33, 6).dot(80, 6);
  f.text(470, 90, 'Price rises from $4 to $6 (+50%):', { size: 13, bold: true });
  f.text(470, 120, ['Perfectly inelastic: 40 units, +0%', 'E = 0'], { size: 13, color: MUTED });
  f.text(470, 170, ['Inelastic: 40 to about 43, +8%', 'E is about 0.17, less than 1'], { size: 13, color: PLUM });
  f.text(470, 220, ['Elastic: 40 to 80, +100%', 'E = 2, greater than 1'], { size: 13, color: '#B8467F' });
  f.text(470, 280, ['Supply is more elastic when sellers', 'can add output easily: spare', 'capacity, inputs that are easy to', 'buy, goods that can be stored, and', 'more time to adjust.'], { size: 12, color: INK });
  f.text(380, 390, 'Invented data for practice.', { size: 11, anchor: 'middle', color: MUTED });
  save('price-elasticity-supply', f, 'Three supply curves through $4 and 40 units: a vertical one is perfectly inelastic, a steep one is inelastic, and a flat one is elastic, so the same price rise adds no units, a few units or many units.');
}

/* ======================= 2.5 the signs of income and cross elasticity ==== */
{
  const f = new Fig('other-elasticities-signs', 760, 330, 'Read the sign: income and cross-price elasticity',
    'Two number lines. Income elasticity of demand: below zero the good is inferior (buyers want less when income rises); above zero the good is normal, and above 1 it is a normal good whose demand grows faster than income. Cross-price elasticity of demand: below zero the goods are complements (a higher price of one lowers demand for the other); near zero they are unrelated; above zero they are substitutes (a higher price of one raises demand for the other).');
  const line = (y, title, left, mid, right, tick1) => {
    const x0 = 80, x1 = 680, z = 330;
    f.text(x0, y - 44, title, { size: 15, bold: true });
    f.add(`<path d="M${x0} ${y}H${x1}" stroke="${INK}" stroke-width="2" marker-end="url(#${f.id}-ink)" marker-start="url(#${f.id}-ink)"/>`);
    f.add(`<path d="M${z} ${y - 10}V${y + 10}" stroke="${INK}" stroke-width="2"/>`);
    f.text(z, y + 28, '0', { size: 13, bold: true, anchor: 'middle' });
    f.add(`<rect x="${x0 + 10}" y="${y - 32}" width="${z - x0 - 20}" height="22" rx="5" fill="${FILL.dwl}"/>`);
    f.text((x0 + z) / 2, y - 16, left, { size: 13, bold: true, anchor: 'middle', color: VERM });
    if (tick1) {
      const t = 480;
      f.add(`<path d="M${t} ${y - 8}V${y + 8}" stroke="${INK}" stroke-width="2"/>`);
      f.text(t, y + 28, '1', { size: 13, bold: true, anchor: 'middle' });
      f.add(`<rect x="${z + 10}" y="${y - 32}" width="${t - z - 20}" height="22" rx="5" fill="${FILL.cs}"/>`);
      f.text((z + t) / 2, y - 16, mid, { size: 13, bold: true, anchor: 'middle', color: BLUE });
      f.add(`<rect x="${t + 10}" y="${y - 32}" width="${x1 - t - 20}" height="22" rx="5" fill="${FILL.cs}"/>`);
      f.text((t + x1) / 2, y - 16, right, { size: 13, bold: true, anchor: 'middle', color: BLUE });
    } else {
      f.text(z, y + 46, mid, { size: 12, anchor: 'middle', color: MUTED });
      f.add(`<rect x="${z + 10}" y="${y - 32}" width="${x1 - z - 20}" height="22" rx="5" fill="${FILL.cs}"/>`);
      f.text((z + x1) / 2, y - 16, right, { size: 13, bold: true, anchor: 'middle', color: BLUE });
    }
  };
  line(110, 'Income elasticity of demand = %ΔQd / %Δincome', 'Negative: inferior good', 'Normal (0 to 1)', 'Normal (above 1)', true);
  f.text(580, 152, 'demand grows faster than income', { size: 12, anchor: 'middle', color: MUTED });
  line(250, 'Cross-price elasticity of demand = %ΔQd of X / %ΔP of Y', 'Negative: complements', 'Zero: unrelated', 'Positive: substitutes', false);
  save('other-elasticities', f, 'Two number lines: a negative income elasticity means an inferior good and a positive one a normal good; a negative cross-price elasticity means complements, zero means unrelated goods, and a positive one means substitutes.');
}

/* ============================ 2.6 consumer and producer surplus ==== */
{
  // Kelp bars (invented): Qd = 100 - 10P (choke $10), Qs = 20P - 20 (starts at $1): E at $4, 60 bars.
  const f = new Fig('equilibrium-surplus-areas', 640, 420, 'Consumer and producer surplus at equilibrium',
    'Demand for kelp bars runs from $10 at zero bars down to the right; supply starts at $1 and rises. They cross at E: a price of $4 and a quantity of 60 bars a day. Consumer surplus is the triangle below demand and above $4, out to 60 bars: one half times 60 times $6, or $180. Producer surplus is the triangle above supply and below $4, out to 60 bars: one half times 60 times $3, or $90. Total surplus is $270. Invented data for practice.');
  const P = panel(f, { ox: 80, oy: 50, pw: 360, ph: 300, xmax: 100, ymax: 11, xlab: 'Kelp bars per day', ylab: 'Price', xticks: [[20, '20'], [40, '40'], [80, '80'], [100, '100']], yticks: [[1, '$1'], [4, '$4'], [7, '$7'], [10, '$10']] }).axes();
  P.poly([[0, 10], [60, 4], [0, 4]], FILL.cs, 'CS = $180', { color: BLUE, lx: 18, ly: 5.9 });
  P.poly([[0, 4], [60, 4], [0, 1]], FILL.ps, 'PS = $90', { color: PLUM, lx: 18, ly: 3.0 });
  P.line(0, 10, 90, 1, { color: BLUE, label: 'D' });
  P.curve(q => 1 + q / 20, 0, 95, { color: PLUM, label: 'S', lx: P.X(95) + 4, ly: P.Y(5.75) + 4 });
  P.hline(4, 60, { label: '' }).vline(60, 4, { label: '60' });
  P.dot(60, 4, 'E', { dx: 8, dy: -8 });
  f.text(470, 110, ['CS = ½ × 60 × ($10 − $4)', '     = $180'], { size: 13, color: BLUE, bold: true });
  f.text(470, 170, ['PS = ½ × 60 × ($4 − $1)', '     = $90'], { size: 13, color: PLUM, bold: true });
  f.text(470, 230, ['Total surplus', '= $180 + $90 = $270'], { size: 13, bold: true });
  f.text(320, 410, 'Invented data for practice.', { size: 11, anchor: 'middle', color: MUTED });
  save('equilibrium-surplus', f, 'Kelp bar market at equilibrium E, $4 and 60 bars: consumer surplus is the triangle under demand above $4, worth $180; producer surplus is the triangle above supply below $4, worth $90; total surplus is $270.');
}

/* ============================ 2.7 shortage and surplus; two shifts ==== */
{
  // Bike helmets (invented): Qd = 100 - P, Qs = 2P - 20 (P in dollars): E at $40, 60 helmets.
  const qd = p => 100 - p, qs = p => 2 * p - 20;
  const f = new Fig('disequilibrium-changes-gaps', 640, 420, 'A shortage below equilibrium, a surplus above it',
    'Demand and supply for bike helmets cross at E: $40 and 60 helmets. At $30, quantity demanded is 70 and quantity supplied is 40: a shortage of 30 helmets, which pushes the price up. At $50, quantity supplied is 80 and quantity demanded is 50: a surplus of 30 helmets, which pushes the price down. Invented data for practice.');
  const P = panel(f, { ox: 80, oy: 50, pw: 380, ph: 300, xmax: 100, ymax: 70, xlab: 'Helmets per week', ylab: 'Price', xticks: [[20, '20'], [40, '40'], [80, '80'], [100, '100']], yticks: [[30, '$30'], [40, '$40'], [50, '$50'], [60, '$60']] }).axes();
  P.line(35, 65, 95, 5, { color: BLUE, label: 'D' });
  f.add(`<path d="M${r(P.X(qs(20)))} ${r(P.Y(20))}L${r(P.X(qs(57)))} ${r(P.Y(57))}" stroke="${PLUM}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`);
  f.text(P.X(qs(57)) + 6, P.Y(57) + 4, 'S', { size: 13, bold: true, color: PLUM });
  P.hline(30, qd(30), { label: '' }).hline(50, qs(50), { label: '' });
  P.line(qs(30), 30, qd(30), 30, { color: VERM, sw: 5 }).line(qd(50), 50, qs(50), 50, { color: GREEN, sw: 5 });
  f.text(P.X(48), P.Y(30) + 18, ['Shortage', '70 − 40 = 30'], { size: 12, bold: true, anchor: 'middle', color: VERM });
  f.text(P.X(66), P.Y(50) - 10, 'Surplus = 80 − 50 = 30', { size: 12, bold: true, anchor: 'middle', color: GREEN });
  P.vline(60, 40, { label: '60' }).hline(40, 60);
  P.dot(60, 40, 'E', { dx: 10, dy: 4 });
  P.arrow(8, 31, 8, 38).arrow(8, 49, 8, 42, GREEN);
  f.text(320, 410, 'Invented data for practice.', { size: 11, anchor: 'middle', color: MUTED });
  save('disequilibrium-changes', f, 'Bike helmet market with equilibrium at $40 and 60 helmets: at $30 there is a shortage of 30 helmets (70 demanded, 40 supplied); at $50 there is a surplus of 30 (80 supplied, 50 demanded).');
}
{
  const f = new Fig('disequilibrium-changes-double', 760, 400, 'Both curves shift: one change is certain, the other indeterminate',
    'Two supply and demand panels. Left: demand and supply both increase. Quantity rises for sure, but the new price can be higher, lower or the same as before, depending on which shift is larger: the price is indeterminate. Right: demand increases while supply decreases. The price rises for sure, but the quantity change is indeterminate.');
  for (const [i, title, dS] of [[0, 'Demand and supply both increase', 1.8], [1, 'Demand increases, supply decreases', -1.8]]) {
    const P = panel(f, { ox: 70 + i * 370, oy: 50, pw: 270, ph: 250, xmax: 10, ymax: 10, xlab: 'Quantity', ylab: 'Price', title }).axes();
    P.line(0.8, 9.2, 8.2, 1.8, { color: MUTED, sw: 2, dash: '6 5', label: 'D1', lx: P.X(8.2) - 4, ly: P.Y(1.8) + 18 });
    P.line(2.6, 9.2, 10, 1.8, { color: BLUE, label: 'D2', lx: P.X(10) - 4, ly: P.Y(1.8) + 18 });
    P.line(0.8, 0.8, 9.2, 9.2, { color: MUTED, sw: 2, dash: '6 5', label: 'S1', lx: i ? P.X(9.2) + 6 : P.X(9.2) - 26, ly: i ? P.Y(9.2) + 14 : P.Y(9.2) + 4 });
    if (dS > 0) P.line(2.6, 0.8, 10, 8.2, { color: PLUM, label: 'S2', lx: P.X(10) - 22, ly: P.Y(8.2) - 6 });
    else P.line(0.8, 2.6, 7.4, 9.2, { color: PLUM, label: 'S2' });
    P.dot(5, 5, 'E1', { dx: 0, dy: 22, anchor: 'middle', color: MUTED });
    const e2 = i === 0 ? [6.8, 5.0] : [5.0, 6.8];
    P.dot(e2[0], e2[1], 'E2', { dx: 10, dy: 5 });
    f.text(70 + i * 370 + 135, 378, i === 0 ? 'Quantity rises; price indeterminate' : 'Price rises; quantity indeterminate', { size: 13, bold: true, anchor: 'middle', color: VERM });
  }
  save('disequilibrium-changes', f, 'Left: demand and supply both increase, so quantity rises but the price change is indeterminate. Right: demand increases and supply decreases, so the price rises but the quantity change is indeterminate.');
}

/* ======================= 2.8 a per-unit tax and its areas ==== */
{
  // Ferry rides (invented): Qd = 100 - 10P, Qs = 10P; a $2 tax on sellers: buyers pay $6, sellers keep $4, 40 rides.
  const f = new Fig('government-intervention-tax', 700, 440, 'A per-unit tax: who pays, the revenue and the deadweight loss',
    'Ferry rides: demand D and supply S cross at $5 and 50 rides. A $2 tax on each ride, collected from sellers, shifts supply up by $2 to S + tax. The new quantity is 40 rides; buyers pay $6 and sellers keep $4. Tax revenue is the rectangle $2 times 40 rides, $80: buyers pay $40 of it and sellers $40. Consumer surplus shrinks to the triangle above $6, producer surplus to the triangle below $4, and the triangle between the curves from 40 to 50 rides, $10, is deadweight loss. Invented data for practice.');
  const P = panel(f, { ox: 80, oy: 50, pw: 380, ph: 320, xmax: 100, ymax: 11, xlab: 'Ferry rides per day', ylab: 'Price', xticks: [[20, '20'], [70, '70'], [100, '100']], yticks: [[2, '$2'], [4, '$4'], [5, '$5'], [6, '$6'], [10, '$10']] }).axes();
  P.poly([[0, 10], [40, 6], [0, 6]], FILL.cs, 'CS', { color: BLUE, lx: 10, ly: 7 });
  P.poly([[0, 6], [40, 6], [40, 4], [0, 4]], FILL.gov, 'Revenue', { color: '#8A5A00', lx: 11, ly: 4.85, size: 12 });
  P.poly([[40, 6], [50, 5], [40, 4]], FILL.dwl, '', { stroke: VERM });
  P.poly([[0, 4], [40, 4], [0, 0]], FILL.ps, 'PS', { color: PLUM, lx: 6, ly: 1.5 });
  P.line(0, 10, 95, 0.5, { color: BLUE, label: 'D' });
  P.line(0, 0, 95, 9.5, { color: PLUM, label: 'S' });
  P.line(0, 2, 85, 10.5, { color: PLUM, dash: '7 4', label: 'S + tax', lx: P.X(85) - 8, ly: P.Y(10.5) - 6, anchor: 'end' });
  P.hline(6, 40, { label: '' }).hline(4, 40, { label: '' }).vline(40, 6, { label: '40' }).vline(50, 5, { label: '50' });
  P.dot(50, 5, 'E1', { dx: 10, dy: 5 }).dot(40, 6, 'E2', { dx: 10, dy: 5 });
  f.text(P.X(57), P.Y(2.0), 'DWL $10', { size: 12, bold: true, color: VERM });
  f.add(`<path d="M${r(P.X(56.5))} ${r(P.Y(2.35))}L${r(P.X(44))} ${r(P.Y(4.9))}" stroke="${VERM}" stroke-width="1.4"/>`);
  f.text(490, 120, ['Buyers pay $6 (up $1)', 'Sellers keep $4 (down $1)', 'Tax per ride: $6 − $4 = $2'], { size: 13, bold: true });
  f.text(490, 200, ['Revenue = $2 × 40 = $80', 'DWL = ½ × (50 − 40) × $2', '       = $10'], { size: 13, bold: true, color: '#8A5A00' });
  f.text(350, 430, 'Invented data for practice.', { size: 11, anchor: 'middle', color: MUTED });
  save('government-intervention', f, 'A $2 per-unit tax on ferry rides shifts supply up by $2: 40 rides are traded instead of 50, buyers pay $6 and sellers keep $4, tax revenue is $80 and the deadweight loss triangle between 40 and 50 rides is $10.');
}
{
  const f = new Fig('government-intervention-controls', 780, 400, 'A binding price ceiling and a binding price floor',
    'Two panels for the same ferry ride market, equilibrium $5 and 50 rides. Left: a price ceiling at $3, below equilibrium, is binding: buyers want 70 rides but sellers offer only 30, a shortage of 40, and only 30 rides are traded. Right: a price floor at $7, above equilibrium, is binding: sellers offer 70 rides but buyers want only 30, a surplus of 40, and only 30 rides are traded. In both, the triangle between the curves from 30 to 50 rides is deadweight loss. Invented data for practice.');
  for (const [i, title, at] of [[0, 'Price ceiling at $3', 3], [1, 'Price floor at $7', 7]]) {
    const P = panel(f, { ox: 70 + i * 380, oy: 50, pw: 290, ph: 270, xmax: 100, ymax: 10.5, xlab: 'Ferry rides per day', ylab: 'Price', title, xticks: [[50, '50'], [100, '100']], yticks: [[3, '$3'], [5, '$5'], [7, '$7']] }).axes();
    P.poly([[30, 7], [50, 5], [30, 3]], FILL.dwl, '', { stroke: VERM });
    P.line(0, 10, 95, 0.5, { color: BLUE, label: 'D' }).line(0, 0, 95, 9.5, { color: PLUM, label: 'S', lx: P.X(95) - 14, ly: P.Y(9.5) - 6 });
    P.line(0, at, 98, at, { color: VERM, sw: 2.4, label: i ? 'Pf' : 'Pc', lx: P.X(98) - 2, ly: P.Y(at) - 7, anchor: 'end' });
    P.vline(30, i ? 7 : 3, { label: '30' }).vline(70, at, { label: '70' }).vline(50, 5, { label: '' }).hline(5, 50, { label: '' });
    P.dot(50, 5, 'E', { dx: 8, dy: -4 });
    f.text(P.X(50), P.Y(at) + (i ? -10 : 20), i ? 'Surplus of 40' : 'Shortage of 40', { size: 12, bold: true, anchor: 'middle', color: VERM });
    f.text(P.X(36.5), P.Y(5.75) + 4, 'DWL', { size: 11, bold: true, anchor: 'middle', color: VERM });
  }
  f.text(390, 392, 'Invented data for practice.', { size: 11, anchor: 'middle', color: MUTED });
  save('government-intervention', f, 'Left: a $3 price ceiling below the $5 equilibrium leaves a shortage of 40 ferry rides and only 30 traded. Right: a $7 price floor above it leaves a surplus of 40 and only 30 traded. Both create a deadweight loss triangle from 30 to 50 rides.');
}

/* ======================= 2.9 the world price and a tariff ==== */
{
  // Rice in Dornia (invented): Qd = 100 - 10P, Qs = 10P; world price $3; a $1 tariff raises it to $4.
  const f = new Fig('trade-policy-tariff', 720, 490, 'A small country at the world price, then a tariff',
    'The rice market in Dornia, an invented small country. Without trade the price is $5 and 50 tons are traded. At the world price of $3, Dornians buy 70 tons, farmers grow 30, and 40 tons are imported. A $1 tariff raises the domestic price to $4: buyers want 60 tons, farmers grow 40, and imports fall to 20. The tariff revenue is $1 times 20 tons, $20. The two triangles from 30 to 40 tons and from 60 to 70 tons, $5 each, are the deadweight loss of the tariff. Invented data for practice.');
  const P = panel(f, { ox: 80, oy: 50, pw: 400, ph: 320, xmax: 100, ymax: 10.5, xlab: 'Tons of rice', ylab: 'Price', xticks: [[10, '10'], [20, '20'], [50, '50'], [80, '80'], [90, '90']], yticks: [[3, '$3'], [4, '$4'], [5, '$5']] }).axes();
  P.poly([[40, 4], [60, 4], [60, 3], [40, 3]], FILL.gov, '', {});
  P.poly([[30, 3], [40, 4], [40, 3]], FILL.dwl, '', { stroke: VERM });
  P.poly([[60, 4], [70, 3], [60, 3]], FILL.dwl, '', { stroke: VERM });
  P.line(0, 10, 95, 0.5, { color: BLUE, label: 'D' }).line(0, 0, 95, 9.5, { color: PLUM, label: 'S', lx: P.X(95) - 14, ly: P.Y(9.5) - 6 });
  P.line(0, 3, 98, 3, { color: GREEN, sw: 2.4, label: 'PW', lx: P.X(98), ly: P.Y(3) + 16, anchor: 'end' });
  P.line(0, 4, 98, 4, { color: '#8A5A00', sw: 2.4, label: 'PW + t', lx: P.X(98), ly: P.Y(4) - 7, anchor: 'end' });
  P.hline(5, 50, { label: '' }).dot(50, 5, 'No trade', { dx: 10, dy: 5 });
  for (const q of [30, 40, 60, 70]) P.vline(q, q < 50 ? (q === 30 ? 3 : 4) : (q === 60 ? 4 : 3), { label: String(q) });
  f.text(P.X(50), P.Y(3.5) + 4, 'Revenue $20', { size: 11, bold: true, anchor: 'middle', color: '#8A5A00' });
  P.bracket(30, 70, 'Imports at $3: 40 tons', GREEN, 34).bracket(40, 60, 'Imports at $4: 20 tons', '#8A5A00', 62);
  f.text(510, 110, ['Free trade at $3:', 'Qd 70, Qs 30, imports 40'], { size: 13, bold: true, color: GREEN });
  f.text(510, 170, ['With a $1 tariff ($4):', 'Qd 60, Qs 40, imports 20', 'Revenue = $1 × 20 = $20'], { size: 13, bold: true, color: '#8A5A00' });
  f.text(510, 245, ['DWL = two triangles', '½ × 10 × $1 + ½ × 10 × $1', '= $10'], { size: 13, bold: true, color: VERM });
  f.text(360, 482, 'Invented country and data for practice.', { size: 11, anchor: 'middle', color: MUTED });
  save('trade-policy', f, 'Rice in the invented country Dornia: at the $3 world price 40 tons are imported; a $1 tariff raises the price to $4, cuts imports to 20 tons, raises $20 of revenue and creates two deadweight loss triangles worth $10 in all.');
}

for (const [topic, entries] of Object.entries(registry)) writeFileSync(join(DATA, 'figures', `${topic}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`author B figures: ${Object.values(registry).reduce((a, e) => a + Object.keys(e).length, 0)} SVGs for ${Object.keys(registry).length} topics`);
