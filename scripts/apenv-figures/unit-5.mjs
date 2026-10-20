/* AP® Environmental Science figures for Unit 5, Land and Water Use (author D).
   Every data figure is drawn from the numbers listed with it (all invented for
   practice, and each says so), so a picture always shows the data it claims to
   show; diagrams are drawn from coordinates.

     node scripts/apenv-figures/unit-5.mjs          writes environmental-science/figures/<id>.svg
     node scripts/apenv-figures/unit-5.mjs --list   prints ids and sizes

   Style: white background, Arial/Helvetica, ink #1F2A28, course olive #474A10
   for emphasis, Okabe-Ito blue #0072B2, green #009E73 and vermillion #D55E00
   as second colors; role="img" with <title> and <desc>. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'environmental-science', 'figures');
const INK = '#1F2A28', OLIVE = '#474A10', SOFT = '#D3D27F', TINT = '#EFF0DA', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00';
const GREY = '#8A9290', LIGHT = '#E9ECEB', SOIL = '#B8916A', SOILD = '#8C6A48', SKY = '#EAF4FB', WATER = '#9CCBEA', GRASS = '#7FB069';
const FONT = 'Arial, Helvetica, sans-serif';

/* ------------------------------------------------------------ toolkit */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = v => +(+v).toFixed(2);
function T(x, y, s, o = {}) {
  const a = o.anchor || 'start', sz = o.size || 13, w = o.weight || 'normal', fill = o.fill || INK;
  return `<text x="${f(x)}" y="${f(y)}" font-size="${sz}" font-weight="${w}" fill="${fill}" text-anchor="${a}"${o.italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
}
function TL(x, y, s, o = {}) { const lh = o.lh || (o.size || 13) * 1.3; return String(s).split('\n').map((l, i) => T(x, y + i * lh, l, o)).join(''); }
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const Rc = (x, y, w, h, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const C = (x, y, r, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"/>`;
const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const poly = (pts, o = {}) => P('M' + pts.map(p => p.map(f).join(',')).join(' L') + (o.close === false ? '' : ' Z'), o);
function svg(id, w, h, title, desc, body) {
  const marks = [['ink', INK], ['olive', OLIVE], ['blue', BLUE], ['verm', VERM], ['green', GREEN], ['grey', GREY]].map(([n, c]) =>
    `<marker id="ar-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('');
  return { id, w, h, alt: desc, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${marks}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
` };
}
function niceTicks(lo, hi, step) { const out = []; for (let v = lo; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6)); return out; }
const fmt = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/* A chart frame: box [x0, y0, x1, y1], x and y ranges, ticks; returns scales and the axis markup. */
function frame(box, xr, yr, o = {}) {
  const [x0, y0, x1, y1] = box;
  const sx = v => x0 + (v - xr[0]) / (xr[1] - xr[0]) * (x1 - x0);
  const sy = v => y1 - (v - yr[0]) / (yr[1] - yr[0]) * (y1 - y0);
  let s = '';
  for (const v of niceTicks(yr[0], yr[1], o.yStep)) {
    s += L(x0, sy(v), x1, sy(v), { stroke: LIGHT, w: 1 }) + T(x0 - 8, sy(v) + 4, (o.yFmt || fmt)(v), { anchor: 'end', size: 12 });
  }
  if (o.xStep) for (const v of niceTicks(xr[0], xr[1], o.xStep)) s += L(sx(v), y1, sx(v), y1 + 5) + T(sx(v), y1 + 19, (o.xFmt || fmt)(v), { anchor: 'middle', size: 12 });
  s += L(x0, y1, x1, y1) + L(x0, y0, x0, y1);
  if (o.xLabel) s += T((x0 + x1) / 2, y1 + 42, o.xLabel, { anchor: 'middle', size: 13, weight: 'bold' });
  if (o.yLabel) s += `<text x="${f(x0 - 52)}" y="${f((y0 + y1) / 2)}" font-size="13" font-weight="bold" fill="${INK}" text-anchor="middle" transform="rotate(-90 ${f(x0 - 52)} ${f((y0 + y1) / 2)})">${esc(o.yLabel)}</text>`;
  return { s, sx, sy };
}
const linePath = (pts, sx, sy) => 'M' + pts.map(([x, y]) => `${f(sx(x))},${f(sy(y))}`).join(' L');
const note = (w, h, s) => T(w - 12, h - 10, s, { anchor: 'end', size: 11, fill: '#5A6260', italic: true });
function box(x, y, w, h, title, lines, o = {}) {
  return Rc(x, y, w, h, { rx: 10, fill: o.fill || TINT, stroke: o.stroke || OLIVE, w: 1.6 }) +
    T(x + w / 2, y + 22, title, { anchor: 'middle', weight: 'bold', size: o.tsize || 14, fill: o.tfill || OLIVE }) +
    (lines ? TL(x + w / 2, y + 42, lines, { anchor: 'middle', size: o.size || 12.5 }) : '');
}
function tree(x, y, s = 1, o = {}) {
  return Rc(x - 3 * s, y - 18 * s, 6 * s, 18 * s, { fill: o.trunk || '#7A5A3A' }) + C(x, y - 30 * s, 14 * s, { fill: o.fill || GREEN });
}
function stump(x, y) { return Rc(x - 4, y - 6, 8, 6, { fill: '#7A5A3A' }); }
function cow(x, y) { return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="11" ry="6" fill="#5A4636"/>` + C(x + 11, y - 3, 4, { fill: '#5A4636' }) + L(x - 6, y + 5, x - 6, y + 10, { stroke: '#5A4636', w: 2 }) + L(x + 6, y + 5, x + 6, y + 10, { stroke: '#5A4636', w: 2 }); }
function fish(x, y, c = BLUE, s = 1) { return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${9 * s}" ry="${4.5 * s}" fill="${c}"/>` + poly([[x - 8 * s, y], [x - 14 * s, y - 5 * s], [x - 14 * s, y + 5 * s]], { fill: c }); }
function legend(x, y, items) { return items.map(([c, label, dash], i) => L(x, y + i * 20, x + 26, y + i * 20, { stroke: c, w: 3, dash }) + T(x + 32, y + i * 20 + 4, label, { size: 12.5 })).join(''); }

const FIGS = [];

/* 5.1 What one herder gains and pays for one more cow on a shared pasture */
{
  const herders = 10, gain = 1, cost = 1, share = cost / herders;
  const W = 720, H = 360;
  const fr = frame([90, 50, 330, 280], [0, 2], [0, 1.2], { yStep: 0.2, yFmt: v => (v * 100).toFixed(0) + '%', yLabel: 'Share of one cow’s value' });
  const bw = 70, bx = [fr.sx(0.5) - bw / 2, fr.sx(1.5) - bw / 2];
  let b = fr.s;
  b += Rc(bx[0], fr.sy(gain), bw, fr.sy(0) - fr.sy(gain), { fill: GREEN }) + T(bx[0] + bw / 2, fr.sy(gain) - 8, '+100%', { anchor: 'middle', weight: 'bold' });
  b += Rc(bx[1], fr.sy(share), bw, fr.sy(0) - fr.sy(share), { fill: VERM }) + T(bx[1] + bw / 2, fr.sy(share) - 8, `−${(share * 100).toFixed(0)}%`, { anchor: 'middle', weight: 'bold' });
  b += TL(bx[0] + bw / 2, 300, 'Gain: the herder\nkeeps the whole cow', { anchor: 'middle', size: 12 });
  b += TL(bx[1] + bw / 2, 300, `Cost: lost grass is\nshared by ${herders} herders`, { anchor: 'middle', size: 12 });
  b += T(210, 30, 'One herder adds one more cow', { anchor: 'middle', weight: 'bold', size: 14, fill: OLIVE });
  // the loop
  const cx = 540, cy = 185, r = 105;
  const steps = ['Each herder\nadds cows', 'Grass is eaten\nfaster than it regrows', 'Bare soil\nerodes', 'Less grass\nfor every herd'];
  const ang = [-90, 0, 90, 180];
  ang.forEach((a, i) => {
    const t = a * Math.PI / 180, x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
    b += Rc(x - 72, y - 22, 144, 44, { rx: 9, fill: i === 0 ? TINT : '#FFFFFF', stroke: OLIVE });
    b += TL(x, y - 4, steps[i], { anchor: 'middle', size: 12 });
  });
  for (let i = 0; i < 4; i++) {
    const a1 = (ang[i] + 30) * Math.PI / 180, a2 = (ang[(i + 1) % 4] - 30 + (i === 3 ? 360 : 0)) * Math.PI / 180;
    b += P(`M${f(cx + 70 * Math.cos(a1))},${f(cy + 70 * Math.sin(a1))} A70,70 0 0 1 ${f(cx + 70 * Math.cos(a2))},${f(cy + 70 * Math.sin(a2))}`, { stroke: OLIVE, w: 2, arrow: 'olive' });
  }
  b += T(cx, 30, 'The shared resource runs down', { anchor: 'middle', weight: 'bold', size: 14, fill: OLIVE });
  FIGS.push(svg('tragedy-of-commons-pasture', W, H, 'Why a shared pasture is overused',
    `Left: a bar chart for one herder who adds one cow to a pasture shared by ${herders} herders. The gain bar is 100% of one cow's value, because the herder keeps the whole cow. The cost bar is ${(share * 100).toFixed(0)}%, because the grass the cow eats is lost to all ${herders} herders, so each pays one tenth. Right: a loop. Each herder adds cows, grass is eaten faster than it regrows, bare soil erodes, and there is less grass for every herd, which pushes each herder to add still more cows.`, b));
}

/* 5.2 Forested vs clearcut hillside */
{
  const W = 720, H = 330;
  let b = '';
  const panel = (ox, cut) => {
    let s = Rc(ox, 40, 340, 260, { fill: SKY });
    const ground = [[ox, 120], [ox + 250, 250], [ox + 340, 262], [ox + 340, 300], [ox, 300]];
    s += poly(ground, { fill: SOIL });
    s += poly([[ox + 250, 250], [ox + 340, 262], [ox + 340, 280], [ox + 245, 268]], { fill: cut ? '#A9B6A0' : WATER });
    for (let i = 0; i < 7; i++) {
      const x = ox + 20 + i * 33, y = 120 + (x - ox) * (130 / 250);
      if (cut) s += stump(x, y + 2); else s += tree(x, y + 2, 1.1);
      if (!cut) s += P(`M${f(x)},${f(y + 3)} l-8,14 M${f(x)},${f(y + 3)} l8,14 M${f(x)},${f(y + 3)} l0,18`, { stroke: '#6B4E32', w: 1.4 });
    }
    return s;
  };
  b += panel(20, false) + panel(360, true);
  b += T(190, 28, 'Forest', { anchor: 'middle', weight: 'bold', size: 15, fill: OLIVE });
  b += T(530, 28, 'After clearcutting', { anchor: 'middle', weight: 'bold', size: 15, fill: VERM });
  b += TL(200, 70, 'Canopy shades the stream:\nwater stays cool', { size: 12.5 });
  b += TL(40, 230, 'Roots hold soil;\nleaf litter slows runoff', { size: 12.5 });
  b += T(270, 318, 'Clear, cool stream', { anchor: 'middle', size: 12, fill: '#0B4F7A', weight: 'bold' });
  b += L(400, 150, 560, 228, { stroke: BLUE, w: 2.5, arrow: 'blue' }) + TL(470, 150, 'More runoff\ncarries soil', { size: 12.5, fill: '#0B4F7A' });
  b += TL(535, 70, 'Full sun warms\nsoil and stream', { size: 12.5 });
  b += TL(380, 250, 'Bare soil erodes;\nnutrients leach', { size: 12.5 });
  b += T(610, 318, 'Muddy, warmer stream', { anchor: 'middle', size: 12, fill: VERM, weight: 'bold' });
  FIGS.push(svg('clearcutting-slope', W, H, 'A forested hillside and the same hillside after clearcutting',
    'Two panels of a hillside that drains into a stream. Left, forest: the canopy shades the stream so the water stays cool, and roots and leaf litter hold the soil and slow runoff, so the stream runs clear. Right, after clearcutting: only stumps remain, full sun warms the soil and the stream, more rain runs off the bare slope and carries soil into the stream, and nutrients leach away, so the stream is muddy and warmer.', b));
}

/* 5.3 Green Revolution inputs, results and costs */
{
  const W = 720, H = 360;
  let b = '';
  const inputs = ['High-yield seeds', 'Synthetic fertilizer', 'Irrigation', 'Pesticides', 'Machines'];
  inputs.forEach((s, i) => { b += Rc(20, 40 + i * 58, 190, 40, { rx: 8, fill: TINT, stroke: OLIVE }) + T(115, 65 + i * 58, s, { anchor: 'middle', size: 13, weight: 'bold' }); b += L(212, 60 + i * 58, 268, 180, { stroke: GREY, w: 1.4 }); });
  b += box(270, 135, 170, 90, 'More grain', 'per hectare\nof farmland', { tsize: 16 });
  b += L(442, 165, 480, 110, { stroke: GREEN, w: 2, arrow: 'green' }) + L(442, 200, 480, 255, { stroke: VERM, w: 2, arrow: 'verm' });
  b += box(485, 30, 220, 120, 'Benefits', 'Fewer famines\nMore food from the same land\nLess new land cleared', { stroke: GREEN, tfill: '#00704F', fill: '#E6F5EF' });
  b += box(485, 190, 220, 150, 'Costs', 'Monocultures: low\ngenetic diversity\nFertilizer runoff\nHeavy water use\nFossil fuels for fuel\nand fertilizer', { stroke: VERM, tfill: '#A8470A', fill: '#FBEDE4' });
  FIGS.push(svg('green-revolution-inputs', W, H, 'Green Revolution inputs, results and costs',
    'Five inputs on the left (high-yield seeds, synthetic fertilizer, irrigation, pesticides and machines) all point to one result: more grain per hectare of farmland. That result has benefits (fewer famines, more food from the same land, less new land cleared) and costs (monocultures with low genetic diversity, fertilizer runoff, heavy water use, and fossil fuels burned for machines and used to make fertilizer).', b));
}

/* 5.4 Tilled vs untilled soil */
{
  const W = 720, H = 330;
  let b = '';
  const col = (ox, tilled) => {
    let s = Rc(ox, 40, 330, 90, { fill: SKY });
    s += Rc(ox, 130, 330, 70, { fill: tilled ? '#C9A57E' : '#7C5A3C' });
    s += Rc(ox, 200, 330, 90, { fill: SOILD });
    if (tilled) {
      for (let i = 0; i < 11; i++) s += P(`M${ox + i * 30},130 q15,-12 30,0`, { fill: '#C9A57E', stroke: '#A07E58', w: 1 });
      s += L(ox + 250, 112, ox + 305, 62, { stroke: GREY, w: 2.5, arrow: 'grey' }) + T(ox + 200, 56, 'Wind lifts dust', { size: 12.5 });
      s += L(ox + 20, 108, ox + 200, 112, { stroke: BLUE, w: 2.5, arrow: 'blue' }) + T(ox + 20, 80, 'Rain runs off the bare surface,', { size: 12.5, fill: '#0B4F7A' }) + T(ox + 20, 96, 'carrying topsoil', { size: 12.5, fill: '#0B4F7A' });
      s += T(ox + 165, 160, 'Loose, bare topsoil: organic', { anchor: 'middle', size: 12.5, weight: 'bold' });
      s += T(ox + 165, 178, 'matter breaks down faster', { anchor: 'middle', size: 12.5, weight: 'bold' });
      s += L(ox, 202, ox + 330, 202, { stroke: '#3A2816', w: 5, dash: '12 4' });
      s += T(ox + 165, 232, 'Packed layer forms under', { anchor: 'middle', size: 12.5, fill: '#FFFFFF' }) + T(ox + 165, 250, 'the plow depth', { anchor: 'middle', size: 12.5, fill: '#FFFFFF' });
    } else {
      for (let i = 0; i < 20; i++) s += L(ox + 8 + i * 16, 129, ox + 18 + i * 16, 123, { stroke: '#C2A75A', w: 3 });
      for (const x of [150, 210, 270]) s += L(ox + x, 126, ox + x, 66, { stroke: GREEN, w: 3 }) + C(ox + x, 62, 7, { fill: GREEN });
      s += L(ox + 30, 60, ox + 30, 124, { stroke: BLUE, w: 2.5, arrow: 'blue' }) + L(ox + 30, 136, ox + 30, 190, { stroke: BLUE, w: 2.5, arrow: 'blue', dash: '5 4' });
      s += T(ox + 42, 80, 'Rain soaks in', { size: 12.5, fill: '#0B4F7A' });
      s += T(ox + 42, 100, 'Crop residue', { size: 12.5, weight: 'bold' }) + T(ox + 42, 116, 'covers the soil', { size: 12.5, weight: 'bold' });
      s += T(ox + 165, 232, 'Roots, pores and worm channels', { anchor: 'middle', size: 12.5, fill: '#FFFFFF', weight: 'bold' });
      s += T(ox + 165, 250, 'hold soil and water', { anchor: 'middle', size: 12.5, fill: '#FFFFFF', weight: 'bold' });
      for (const x of [150, 210, 270]) s += P(`M${ox + x},130 l-10,40 M${ox + x},130 l10,45 M${ox + x},130 l0,60`, { stroke: '#E8D9B0', w: 1.3 });
    }
    return s;
  };
  b += col(20, true) + col(370, false);
  b += T(185, 28, 'Tilled field', { anchor: 'middle', weight: 'bold', size: 15, fill: VERM });
  b += T(535, 28, 'Untilled field', { anchor: 'middle', weight: 'bold', size: 15, fill: OLIVE });
  b += note(W, H, 'Soil layers not to scale');
  FIGS.push(svg('agricultural-practices-tilling', W, H, 'Soil in a tilled field and an untilled field',
    'Two soil cross-sections. Left, a tilled field: the topsoil is loose and bare, wind lifts dust, rain runs off the bare surface carrying topsoil, organic matter breaks down faster, and a packed layer forms under the plow depth. Right, an untilled field: crop residue covers the surface, rain soaks in, and roots, pores and worm channels hold soil and water.', b));
}

/* 5.5 Water applied by four irrigation methods (invented, same as the irrigation stimulus) */
export const IRRIGATION = { methods: ['Flood', 'Furrow', 'Spray', 'Drip'], applied: [10000, 7500, 6000, 5000], used: [4800, 4800, 4800, 4600] };
{
  const W = 720, H = 360, D = IRRIGATION;
  const fr = frame([110, 50, 560, 290], [0, 4], [0, 10000], { yStep: 2000, yLabel: 'Water (m³ per hectare per season)' });
  let b = fr.s;
  D.methods.forEach((m, i) => {
    const cx = fr.sx(i + 0.5), bw = 34;
    b += Rc(cx - bw - 3, fr.sy(D.applied[i]), bw, fr.sy(0) - fr.sy(D.applied[i]), { fill: BLUE });
    b += Rc(cx + 3, fr.sy(D.used[i]), bw, fr.sy(0) - fr.sy(D.used[i]), { fill: GREEN });
    b += T(cx - bw / 2 - 3, fr.sy(D.applied[i]) - 6, fmt(D.applied[i]), { anchor: 'middle', size: 11 });
    b += T(cx + bw / 2 + 3, fr.sy(D.used[i]) - 6, fmt(D.used[i]), { anchor: 'middle', size: 11 });
    b += T(cx, 310, m, { anchor: 'middle', size: 13, weight: 'bold' });
  });
  b += Rc(585, 90, 14, 14, { fill: BLUE }) + TL(605, 101, 'Water applied\nto the field', { size: 12.5 });
  b += Rc(585, 140, 14, 14, { fill: GREEN }) + TL(605, 151, 'Water taken up\nby the crop', { size: 12.5 });
  b += T(335, 30, 'Same crop, same field size, one season', { anchor: 'middle', weight: 'bold', size: 14, fill: OLIVE });
  b += note(W, H, 'Invented data for practice');
  FIGS.push(svg('irrigation-methods', W, H, 'Water applied and water used by four irrigation methods',
    `Paired bar chart, invented data for practice. For one season on one hectare of the same crop, water applied to the field and water taken up by the crop, in cubic meters per hectare: flood ${fmt(D.applied[0])} applied and ${fmt(D.used[0])} used; furrow ${fmt(D.applied[1])} and ${fmt(D.used[1])}; spray ${fmt(D.applied[2])} and ${fmt(D.used[2])}; drip ${fmt(D.applied[3])} and ${fmt(D.used[3])}. The crop uses about the same water each time, but flood and furrow apply far more, so more is lost to evaporation, runoff and deep seepage.`, b));
}

/* 5.6 Resistance rising under repeated spraying (invented) */
export const RESIST = [[0, 1], [2, 2], [4, 5], [6, 12], [8, 27], [10, 50], [12, 73], [14, 88], [16, 95]];
{
  const W = 720, H = 340;
  const fr = frame([100, 40, 620, 270], [0, 16], [0, 100], { yStep: 20, xStep: 2, yLabel: 'Pests resistant (%)', xLabel: 'Generations of pests since spraying began' });
  let b = fr.s + P(linePath(RESIST, fr.sx, fr.sy), { stroke: VERM, w: 3 });
  for (const [x, y] of RESIST) b += C(fr.sx(x), fr.sy(y), 4, { fill: VERM });
  b += TL(fr.sx(0.5), fr.sy(84), 'Each spraying kills most of the pests that\ncan be killed. The few with resistance\nsurvive and breed, so their share grows.', { size: 12.5 });
  b += note(W, H, 'Invented data for practice');
  FIGS.push(svg('pest-control-resistance', W, H, 'Share of a pest population resistant to a pesticide over time',
    `Line graph, invented data for practice. The percent of pests resistant to a pesticide, after each two generations of regular spraying: ${RESIST.map(p => p[1] + '%').join(', ')} at generations ${RESIST.map(p => p[0]).join(', ')}. The share starts near 1%, rises slowly, then quickly, and levels off near 95%, an S-shaped rise caused by natural selection.`, b));
}

/* 5.7 Rotational vs continuous grazing */
{
  const W = 720, H = 330;
  let b = '';
  b += T(170, 28, 'Continuous grazing', { anchor: 'middle', weight: 'bold', size: 15, fill: VERM });
  b += Rc(20, 45, 300, 230, { fill: '#D9C79A', stroke: INK });
  for (let i = 0; i < 14; i++) { const x = 40 + (i * 53) % 260, y = 70 + Math.floor(i / 5) * 60 + (i % 2) * 18; b += C(x, y, 6, { fill: '#A8B97A' }); }
  for (const [x, y] of [[70, 110], [150, 90], [230, 140], [110, 200], [200, 230], [270, 80], [60, 250]]) b += cow(x, y);
  b += T(170, 300, 'Grass eaten to the ground; bare soil', { anchor: 'middle', size: 12.5 });
  b += T(530, 28, 'Rotational grazing', { anchor: 'middle', weight: 'bold', size: 15, fill: OLIVE });
  const heights = ['Grazing now', 'Regrowing: week 1', 'Regrowing: week 3', 'Herd moves here next'];
  const fills = ['#B9C98A', '#9FC27C', '#7FB069', '#5E9A4E'];
  for (let k = 0; k < 4; k++) {
    const x = 380 + (k % 2) * 155, y = 45 + Math.floor(k / 2) * 117;
    b += Rc(x, y, 150, 112, { fill: fills[k], stroke: INK });
    b += T(x + 75, y + 104, heights[k], { anchor: 'middle', size: 12, weight: 'bold', fill: k ? '#FFFFFF' : INK });
  }
  for (const [x, y] of [[410, 70], [460, 85], [500, 65], [430, 110], [480, 115]]) b += cow(x, y);
  b += T(530, 300, 'The herd moves on; grass and roots recover', { anchor: 'middle', size: 12.5 });
  FIGS.push(svg('meat-production-grazing', W, H, 'Continuous grazing compared with rotational grazing',
    'Left, continuous grazing: seven cattle stay on one pasture all season, the grass is eaten to the ground and the soil is left bare. Right, rotational grazing: the same land is split into four paddocks; the herd grazes one while the others regrow (week 1, week 3, and the paddock the herd moves to next), and the herd moves on so grass and roots recover.', b));
}

/* 5.8 Catch in a fishery that collapses (invented) */
export const CATCH = [[1960, 210], [1965, 260], [1970, 340], [1975, 420], [1980, 450], [1985, 400], [1990, 250], [1995, 60], [2000, 20], [2005, 15], [2010, 25], [2015, 30]];
{
  const W = 720, H = 340;
  const fr = frame([110, 40, 640, 270], [1960, 2015], [0, 500], { yStep: 100, xStep: 5, xFmt: v => String(v), yLabel: 'Catch (thousand metric tons)', xLabel: 'Year' });
  let b = fr.s + P(linePath(CATCH, fr.sx, fr.sy), { stroke: BLUE, w: 3 });
  for (const [x, y] of CATCH) b += C(fr.sx(x), fr.sy(y), 4, { fill: BLUE });
  b += L(fr.sx(1980), fr.sy(450) - 6, fr.sx(1980), fr.sy(500) + 4, { stroke: GREY, dash: '4 3' }) + T(fr.sx(1980) + 6, fr.sy(490), 'Peak catch', { size: 12.5 });
  b += TL(fr.sx(1997), fr.sy(300), 'Catch falls even\nthough boats fish harder:\nthe stock is depleted', { size: 12.5 });
  b += note(W, H, 'Invented data for practice');
  FIGS.push(svg('overfishing-catch', W, H, 'Yearly catch in a fishery that is fished faster than it can recover',
    `Line graph, invented data for practice. Yearly catch in thousand metric tons: ${CATCH.map(p => p[0] + ' ' + p[1]).join(', ')}. The catch rises to a peak of 450 in 1980, then falls to 20 by 2000 although boats fish harder, and recovers only slightly by 2015.`, b));
}

/* 5.9 Surface and subsurface mining */
{
  const W = 720, H = 360;
  let b = Rc(0, 0, W, 90, { fill: SKY });
  b += Rc(0, 90, W, 270, { fill: SOIL });
  b += Rc(0, 150, W, 210, { fill: '#A27E5C' });
  // surface pit
  b += poly([[60, 90], [300, 90], [260, 180], [100, 180]], { fill: '#EDE6DA' });
  b += Rc(110, 180, 140, 22, { fill: '#5C5C5C' }) + T(180, 196, 'Ore near the surface', { anchor: 'middle', size: 12, fill: '#FFFFFF', weight: 'bold' });
  b += poly([[300, 90], [330, 55], [380, 55], [410, 90]], { fill: '#9B8B76', stroke: INK, w: 1 }) + T(355, 48, 'Overburden pile', { anchor: 'middle', size: 12.5 });
  b += L(240, 120, 320, 75, { stroke: INK, w: 1.5, arrow: 'ink' });
  b += T(180, 125, 'Open pit', { anchor: 'middle', size: 13, weight: 'bold' });
  b += poly([[0, 90], [55, 90], [40, 80], [0, 80]], { fill: '#C4B9A0', stroke: INK, w: 1 }) + T(8, 72, 'Tailings', { size: 12.5 });
  b += P('M30,92 C35,130 25,170 40,215', { stroke: VERM, w: 3, arrow: 'verm' }) + Rc(44, 216, 112, 54, { rx: 6, fill: '#FFFFFF', stroke: VERM }) + TL(52, 234, 'Acid drainage\ncarries metals\ninto water', { size: 12, fill: '#A8470A', weight: 'bold' });
  // subsurface
  b += Rc(520, 20, 50, 70, { fill: '#7D7D7D', stroke: INK }) + T(545, 14, 'Headframe', { anchor: 'middle', size: 12.5 });
  b += Rc(538, 90, 14, 230, { fill: '#3F3F3F' });
  b += Rc(552, 250, 140, 14, { fill: '#3F3F3F' }) + Rc(420, 300, 118, 14, { fill: '#3F3F3F' });
  b += Rc(600, 230, 90, 22, { fill: '#5C5C5C' }) + Rc(430, 316, 90, 22, { fill: '#5C5C5C' });
  b += T(645, 222, 'Deep ore', { anchor: 'middle', size: 12.5, fill: '#FFFFFF', weight: 'bold' });
  b += TL(470, 140, 'Shaft and tunnels:\nless land disturbed,\nmore risk to miners', { size: 12.5, fill: '#FFFFFF' });
  b += T(180, 345, 'Surface mining', { anchor: 'middle', size: 15, weight: 'bold', fill: '#FFFFFF' });
  b += T(555, 345, 'Subsurface mining', { anchor: 'middle', size: 15, weight: 'bold', fill: '#FFFFFF' });
  FIGS.push(svg('mining-cross-section', W, H, 'Surface mining and subsurface mining in cross-section',
    'Cross-section of the ground. Left, surface mining: an open pit is dug to reach ore near the surface, the soil and rock removed (overburden) are piled beside it, waste rock called tailings sits nearby, and acid drainage carries metals from the waste into water. Right, subsurface mining: a headframe sits over a vertical shaft with tunnels to deep ore; it disturbs less land but carries more risk to miners.', b));
}

/* 5.10 Stream flow after a storm, before and after a watershed is paved (invented) */
export const HYDRO = { before: [[0, 2], [2, 3], [4, 6], [6, 10], [8, 13], [10, 14], [12, 13], [14, 11], [16, 9], [18, 7], [20, 5], [24, 3]],
  after: [[0, 2], [1, 8], [2, 22], [3, 34], [4, 30], [6, 18], [8, 10], [10, 6], [12, 4], [16, 3], [20, 2], [24, 2]] };
{
  const W = 720, H = 340;
  const fr = frame([100, 40, 600, 270], [0, 24], [0, 40], { yStep: 10, xStep: 4, yLabel: 'Stream flow (m³ per second)', xLabel: 'Hours after the storm began' });
  let b = fr.s + P(linePath(HYDRO.before, fr.sx, fr.sy), { stroke: GREEN, w: 3 }) + P(linePath(HYDRO.after, fr.sx, fr.sy), { stroke: VERM, w: 3, dash: '8 5' });
  b += legend(470, 70, [[GREEN, 'Before: fields and forest'], [VERM, 'After: paved and built', '8 5']]);
  b += TL(fr.sx(4.2), fr.sy(36), 'Higher, sooner peak', { size: 12.5, fill: '#A8470A', weight: 'bold' });
  b += note(W, H, 'Invented data for practice');
  FIGS.push(svg('urbanization-hydrograph', W, H, 'Stream flow after the same storm, before and after a watershed is built up',
    `Line graph, invented data for practice. Stream flow in cubic meters per second after the same storm. Before development (fields and forest) the flow rises slowly to a peak of 14 at 10 hours and stays high for many hours. After the watershed is paved and built up, the flow rises fast to a peak of 34 at 3 hours, then drops quickly. Paved surfaces send rain to the stream at once instead of letting it soak in.`, b));
}

/* 5.11 Ecological footprint per person, four countries (invented) */
export const FOOT = { countries: ['A', 'B', 'C', 'D'], gha: [8.0, 4.8, 2.4, 1.0], bio: 1.6 };
{
  const W = 720, H = 340;
  const fr = frame([110, 40, 560, 270], [0, 4], [0, 9], { yStep: 1, yLabel: 'Footprint (gha per person)' });
  let b = fr.s;
  FOOT.countries.forEach((c, i) => {
    const cx = fr.sx(i + 0.5);
    b += Rc(cx - 30, fr.sy(FOOT.gha[i]), 60, fr.sy(0) - fr.sy(FOOT.gha[i]), { fill: OLIVE });
    b += T(cx, Math.min(fr.sy(FOOT.gha[i]), fr.sy(FOOT.bio) - 4) - 6, FOOT.gha[i].toFixed(1), { anchor: 'middle', size: 12, weight: 'bold' });
    b += T(cx, 290, 'Country ' + c, { anchor: 'middle', size: 13, weight: 'bold' });
  });
  b += L(110, fr.sy(FOOT.bio), 560, fr.sy(FOOT.bio), { stroke: GREEN, w: 2.5, dash: '8 5' });
  b += TL(575, fr.sy(FOOT.bio) - 8, `Earth's biocapacity:\nabout ${FOOT.bio} gha\nper person`, { size: 12.5, fill: '#00704F', weight: 'bold' });
  b += note(W, H, 'Invented data for practice; gha = global hectares');
  FIGS.push(svg('ecological-footprints-bars', W, H, 'Ecological footprint per person in four countries',
    `Bar chart, invented data for practice. Ecological footprint in global hectares per person: country A ${FOOT.gha[0]}, B ${FOOT.gha[1]}, C ${FOOT.gha[2]}, D ${FOOT.gha[3]}. A dashed line marks Earth's biocapacity, about ${FOOT.bio} global hectares per person. Countries A, B and C are above the line; country D is below it.`, b));
}

/* 5.12 Surplus growth of a logistic population and the maximum sustainable yield */
export const MSY = { r: 0.4, K: 1000 };
{
  const W = 720, H = 340, { r, K } = MSY;
  const pts = []; for (let N = 0; N <= K; N += 25) pts.push([N, r * N * (1 - N / K)]);
  const top = r * K / 4;
  const fr = frame([110, 40, 600, 270], [0, K], [0, 120], { yStep: 20, xStep: 200, yLabel: 'New fish per year', xLabel: 'Population size (fish)' });
  let b = fr.s + P(linePath(pts, fr.sx, fr.sy), { stroke: OLIVE, w: 3 });
  b += L(fr.sx(K / 2), fr.sy(0), fr.sx(K / 2), fr.sy(top), { stroke: BLUE, dash: '5 4', w: 2 }) + L(fr.sx(0), fr.sy(top), fr.sx(K / 2), fr.sy(top), { stroke: BLUE, dash: '5 4', w: 2 });
  b += C(fr.sx(K / 2), fr.sy(top), 6, { fill: BLUE });
  b += TL(fr.sx(K / 2) + 12, fr.sy(top) - 16, `Maximum sustainable yield:\n${top} fish a year at ${K / 2} fish (half of K)`, { size: 12.5, fill: '#0B4F7A', weight: 'bold' });
  b += TL(fr.sx(0.12 * K), fr.sy(12), 'Few fish:\nfew births', { size: 12 });
  b += TL(fr.sx(0.86 * K), fr.sy(80), 'Near K = 1,000:\ncrowding slows\ngrowth', { size: 12 });
  FIGS.push(svg('sustainability-msy', W, H, 'How fast a fish population adds new fish at each size',
    `A hump-shaped curve for a fish population with logistic growth and a carrying capacity (K) of ${fmt(K)} fish. The number of new fish added each year is near zero when the population is small (few parents), rises to a peak of ${top} fish a year at ${K / 2} fish (half of K), and falls back to zero at ${fmt(K)} fish, where crowding stops growth. Harvesting the peak, ${top} fish a year, while the population is held at ${K / 2}, is the maximum sustainable yield.`, b));
}

/* 5.13 Methods to reduce urban runoff */
{
  const W = 720, H = 340;
  let b = Rc(0, 0, W, 230, { fill: SKY }) + Rc(0, 230, W, 110, { fill: SOIL });
  for (let i = 0; i < 12; i++) b += L(30 + i * 58, 10, 22 + i * 58, 30, { stroke: BLUE, w: 2 });
  // green roof
  b += Rc(40, 110, 170, 120, { fill: '#D6D3CC', stroke: INK }) + Rc(36, 96, 178, 14, { fill: GREEN, stroke: INK, w: 1 });
  b += T(125, 88, 'Green roof', { anchor: 'middle', size: 13, weight: 'bold', fill: OLIVE });
  b += TL(125, 150, 'Plants and soil\nsoak up rain and\nslow its release', { anchor: 'middle', size: 12 });
  // rain garden
  b += P('M250,230 Q310,270 370,230 Z', { fill: '#5E9A4E' }) + T(318, 218, 'Rain garden', { anchor: 'middle', size: 13, weight: 'bold', fill: OLIVE });
  for (let i = 0; i < 4; i++) b += L(285 + i * 18, 245, 285 + i * 18, 300, { stroke: BLUE, w: 2, arrow: 'blue', dash: '4 3' });
  b += L(212, 225, 255, 232, { stroke: BLUE, w: 2, arrow: 'blue' }) + T(216, 246, 'Downspout', { size: 11.5, anchor: 'end' });
  // permeable pavement
  b += Rc(410, 222, 140, 10, { fill: '#9AA0A6' });
  for (let i = 0; i < 9; i++) b += Rc(412 + i * 15.5, 223, 3, 8, { fill: '#FFFFFF' });
  for (let i = 0; i < 4; i++) b += L(430 + i * 32, 240, 430 + i * 32, 300, { stroke: BLUE, w: 2, arrow: 'blue', dash: '4 3' });
  b += TL(480, 186, 'Permeable\npavement', { anchor: 'middle', size: 13, weight: 'bold', fill: OLIVE });
  // ordinary pavement
  b += Rc(570, 222, 140, 10, { fill: '#555B60' });
  b += L(580, 215, 700, 215, { stroke: BLUE, w: 2.5, arrow: 'blue' }) + TL(640, 186, 'Ordinary\npavement', { anchor: 'middle', size: 13, weight: 'bold', fill: VERM });
  b += T(640, 255, 'Water runs off to', { anchor: 'middle', size: 12, fill: '#FFFFFF' }) + T(640, 271, 'the storm drain', { anchor: 'middle', size: 12, fill: '#FFFFFF' });
  b += T(400, 325, 'Dashed arrows: water soaking into the ground and recharging groundwater', { anchor: 'middle', size: 12, fill: '#FFFFFF', weight: 'bold' });
  FIGS.push(svg('urban-runoff-methods', W, H, 'Three ways to reduce urban runoff, next to ordinary pavement',
    'Rain falls on a city block. A green roof holds rain in plants and soil and releases it slowly. A downspout sends roof water into a rain garden, a planted low spot where water soaks into the ground. Permeable pavement has gaps that let water pass through into the ground. Ordinary pavement sheds the water sideways to a storm drain. Dashed arrows show water soaking in and recharging groundwater.', b));
}

/* 5.14 Pest counts against an action threshold (invented) */
export const IPMDATA = { weeks: [[1, 2], [2, 3], [3, 5], [4, 8], [5, 12], [6, 6], [7, 4], [8, 5], [9, 7], [10, 9]], threshold: 10 };
{
  const W = 720, H = 340;
  const fr = frame([100, 40, 600, 270], [0, 10], [0, 15], { yStep: 3, xStep: 1, yLabel: 'Aphids per leaf (average)', xLabel: 'Week of the growing season' });
  let b = fr.s + L(fr.sx(0), fr.sy(IPMDATA.threshold), fr.sx(10), fr.sy(IPMDATA.threshold), { stroke: VERM, w: 2, dash: '8 5' });
  b += T(fr.sx(10) + 8, fr.sy(IPMDATA.threshold) + 4, 'Action', { size: 12.5, fill: '#A8470A', weight: 'bold' }) + T(fr.sx(10) + 8, fr.sy(IPMDATA.threshold) + 20, 'threshold', { size: 12.5, fill: '#A8470A', weight: 'bold' });
  b += P(linePath(IPMDATA.weeks, fr.sx, fr.sy), { stroke: OLIVE, w: 3 });
  for (const [x, y] of IPMDATA.weeks) b += C(fr.sx(x), fr.sy(y), 4, { fill: OLIVE });
  b += L(fr.sx(5), fr.sy(12) - 10, fr.sx(5), fr.sy(15) + 6, { stroke: INK, w: 1.5 }) + T(fr.sx(5) + 6, fr.sy(14.4), 'Week 5: count passes the threshold, so a targeted control is used', { size: 12 });
  b += TL(fr.sx(0.3), fr.sy(13.4), 'Scouts count pests\nevery week', { size: 12 });
  b += note(W, H, 'Invented data for practice');
  FIGS.push(svg('integrated-pest-management-threshold', W, H, 'Weekly pest counts compared with an action threshold',
    `Line graph, invented data for practice. Average aphids per leaf, counted each week: ${IPMDATA.weeks.map(p => p[1]).join(', ')} for weeks 1 to 10. A dashed line marks the action threshold at ${IPMDATA.threshold} aphids per leaf. The count passes the threshold only in week 5 (12 aphids per leaf); a targeted control is used then, and the count falls to 6 the next week and stays below the threshold.`, b));
}

/* 5.15 Soil conservation on a hillside */
{
  const W = 720, H = 380;
  let b = Rc(0, 0, W, H, { fill: SKY });
  // contour plowing panel
  b += T(180, 26, 'Contour plowing and strip cropping', { anchor: 'middle', size: 14, weight: 'bold', fill: OLIVE });
  b += '<clipPath id="hill-clip"><path d="M20,320 Q180,-20 340,320 Z"/></clipPath>';
  b += P('M20,320 Q180,-20 340,320 Z', { fill: '#C9B27C' });
  b += '<g clip-path="url(#hill-clip)">';
  for (let k = 0; k < 7; k++) { const y = 312 - k * 22; b += P(`M10,${y} Q180,${y - 26} 350,${y}`, { stroke: k % 2 ? GREEN : SOILD, w: 11 }); }
  b += '</g>';
  b += L(300, 60, 300, 120, { stroke: BLUE, w: 2, arrow: 'blue' }) + TL(250, 50, 'Rain', { size: 12, fill: '#0B4F7A' });
  b += TL(180, 345, 'Rows follow the land’s contour; strips of different\ncrops alternate. Each row and strip slows runoff.', { anchor: 'middle', size: 12 });
  // terraces panel
  b += T(540, 26, 'Terracing', { anchor: 'middle', size: 14, weight: 'bold', fill: OLIVE });
  const steps = [[380, 300], [440, 250], [500, 200], [560, 150], [620, 100]];
  let d = 'M380,320 L380,300';
  for (const [x, y] of steps) d += ` L${x + 60},${y} L${x + 60},${y - 50 < 50 ? 50 : y - 50}`;
  d = 'M380,320 ' + steps.map(([x, y]) => `L${x},${y} L${x + 60},${y}`).join(' ') + ' L700,100 L700,320 Z';
  b += P(d, { fill: '#C9B27C', stroke: SOILD, w: 2 });
  for (const [x, y] of steps) b += L(x + 4, y - 4, x + 56, y - 4, { stroke: GREEN, w: 6 });
  b += L(470, 222, 470, 246, { stroke: BLUE, w: 2, arrow: 'blue' }) + TL(462, 200, 'Water pools\nand soaks in', { anchor: 'end', size: 12 });
  b += TL(540, 345, 'Flat steps cut into a steep slope\nshorten each run of water.', { anchor: 'middle', size: 12 });
  FIGS.push(svg('sustainable-agriculture-hillside', W, H, 'Contour plowing, strip cropping and terracing on hillsides',
    'Two hillsides. Left: plowed rows follow the contour of the hill instead of running up and down it, and strips of different crops alternate, so each row and strip slows the water running downhill. Right: terraces, flat steps cut into a steep slope, each planted with a crop; water pools on each step and soaks in instead of running down the whole slope.', b));
}

/* 5.16 Open net pens and a closed tank */
{
  const W = 720, H = 340;
  let b = Rc(0, 0, 400, 90, { fill: SKY }) + Rc(0, 90, 400, 250, { fill: WATER });
  b += T(200, 26, 'Open net pen in a bay', { anchor: 'middle', size: 14, weight: 'bold', fill: OLIVE });
  b += Rc(100, 80, 200, 12, { fill: '#9AA0A6' });
  b += P('M100,92 L110,240 L290,240 L300,92', { stroke: INK, w: 1.5, dash: '3 3' });
  for (let i = 0; i < 10; i++) b += fish(130 + (i % 5) * 36, 130 + Math.floor(i / 5) * 50, OLIVE);
  b += P('M200,242 C200,270 160,290 140,320', { stroke: SOILD, w: 3, arrow: 'grey' }) + TL(70, 290, 'Waste and\nuneaten feed', { size: 12, anchor: 'middle' });
  b += fish(345, 170, OLIVE) + L(305, 170, 330, 170, { stroke: INK, arrow: 'ink' }) + TL(335, 140, 'Escapes', { size: 12 });
  b += fish(350, 270, BLUE) + TL(320, 300, 'Wild fish catch\nparasites and disease', { size: 12, anchor: 'middle' });
  b += Rc(420, 0, 300, 340, { fill: '#F4F4F2' });
  b += T(570, 26, 'Closed tank on land', { anchor: 'middle', size: 14, weight: 'bold', fill: OLIVE });
  b += Rc(450, 90, 170, 150, { rx: 8, fill: WATER, stroke: INK });
  for (let i = 0; i < 6; i++) b += fish(480 + (i % 3) * 50, 130 + Math.floor(i / 3) * 60, OLIVE);
  b += Rc(640, 130, 60, 70, { rx: 6, fill: TINT, stroke: OLIVE }) + T(670, 170, 'Filter', { anchor: 'middle', size: 12, weight: 'bold' });
  b += P('M620,120 C640,110 660,115 670,128', { stroke: BLUE, w: 2, arrow: 'blue' }) + P('M670,202 C660,225 640,230 622,220', { stroke: BLUE, w: 2, arrow: 'blue' });
  b += TL(570, 275, 'Water is cleaned and reused;\nwaste is captured. Costs more\nin electricity and money.', { anchor: 'middle', size: 12 });
  FIGS.push(svg('aquaculture-pens', W, H, 'An open net pen compared with a closed tank for farming fish',
    'Left: an open net pen floats in a bay. Waste and uneaten feed sink to the sea floor below the pen, some farmed fish escape through the net, and wild fish nearby catch parasites and disease from the crowded pen. Right: a closed tank on land. Water flows through a filter and back into the tank, so waste is captured and the water is reused, but the system costs more in electricity and money.', b));
}

/* 5.17 Three sustainable forestry practices */
{
  const W = 720, H = 320;
  let b = '';
  const panel = (ox, title, lines) => Rc(ox, 40, 225, 200, { fill: SKY }) + Rc(ox, 200, 225, 40, { fill: SOIL }) + T(ox + 112, 28, title, { anchor: 'middle', size: 14, weight: 'bold', fill: OLIVE }) + TL(ox + 112, 262, lines, { anchor: 'middle', size: 12 });
  b += panel(10, 'Selective cutting', 'A few mature trees are cut;\nmost of the forest stands');
  for (let i = 0; i < 6; i++) b += (i === 1 || i === 4) ? stump(35 + i * 35, 200) : tree(35 + i * 35, 200, 1.3);
  b += panel(247, 'Reforestation', 'Seedlings are planted\nwhere trees were cut');
  for (let i = 0; i < 7; i++) b += tree(270 + i * 30, 200, 0.45);
  b += panel(484, 'Prescribed burn', 'A planned, low fire clears\ndead wood and brush');
  for (let i = 0; i < 4; i++) b += tree(510 + i * 55, 200, 1.4);
  for (let i = 0; i < 9; i++) b += P(`M${500 + i * 22},200 q6,-14 0,-22 q10,8 8,22 Z`, { fill: i % 2 ? '#F5A623' : VERM });
  b += T(360, 312, 'Each keeps forest cover, soil and habitat while still producing wood or lowering wildfire risk', { anchor: 'middle', size: 12, italic: true });
  FIGS.push(svg('sustainable-forestry-practices', W, H, 'Three sustainable forestry practices',
    'Three panels. Selective cutting: a few mature trees are cut and most of the forest stands. Reforestation: rows of seedlings are planted where trees were cut. Prescribed burn: a planned, low fire burns dead wood and brush on the forest floor while the large trees survive. Each keeps forest cover, soil and habitat while still producing wood or lowering the risk of a large wildfire.', b));
}

const args = new Set(process.argv.slice(2));
if (args.has('--list')) { for (const g of FIGS) console.log(`${g.id} ${g.w}x${g.h}`); }
else if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  for (const g of FIGS) writeFileSync(join(OUT, `${g.id}.svg`), g.svg);
  console.log(`wrote ${FIGS.length} figures to environmental-science/figures/`);
}
export { FIGS };
