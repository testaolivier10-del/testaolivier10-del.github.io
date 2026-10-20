/* AP® Environmental Science figures for Unit 8 (8.12-8.15) and Unit 9 (author G).
   Every data figure is drawn from the numbers in DATA below (the same arrays
   the questions use), with LD50 values read by ApEnvCalc.doseAt, so a picture
   always shows the data it claims to show. Diagrams are drawn from coordinates.

     node scripts/apenv-figures/unit-8-unit-9.mjs          writes environmental-science/figures/<id>.svg
     node scripts/apenv-figures/unit-8-unit-9.mjs --list   prints ids and sizes

   Style: white background, Arial/Helvetica, ink #1F2A28, course olive #474A10
   for emphasis, Okabe-Ito blue #0072B2, green #009E73 and vermillion #D55E00
   as second colors; role="img" with <title> and <desc>. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Calc } from '../lib/apenv-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'environmental-science', 'figures');
const INK = '#1F2A28', OLIVE = '#474A10', TINT = '#EFF0DA', SOFT = '#D3D27F', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GREY = '#8A9290', LIGHT = '#E9ECEB';
const FONT = 'Arial, Helvetica, sans-serif';

/* ------------------------------------------------------------ data shared with the content */
export const DATA = {
  // 8.12 (invented): percent of test rats killed at each dose of a pesticide, mg/kg
  ratDeaths: [[0, 0], [10, 2], [20, 9], [30, 26], [40, 50], [50, 72], [60, 86], [80, 96], [100, 99]],
  // 8.13 (invented): percent of test fish killed by two pesticides, mg/kg
  doses: [0, 10, 20, 30, 40, 50, 60, 80, 100, 120, 160],
  pestX: [0, 0, 0, 2, 6, 12, 22, 50, 76, 90, 98],
  pestY: [0, 0, 8, 25, 50, 72, 88, 97, 99, 100, 100],
  // 8.14 (invented): percent of lab mice with lung damage after 30 days
  synergy: { control: 2, a: 10, b: 8, both: 40 },
  // 9.4 (real): NOAA Global Monitoring Laboratory, Mauna Loa annual mean CO2, ppm
  maunaLoa: [[1960, 316.91], [1965, 320.04], [1970, 325.68], [1975, 331.13], [1980, 338.76], [1985, 346.35], [1990, 354.45],
    [1995, 360.97], [2000, 369.71], [2005, 379.98], [2010, 390.10], [2015, 401.01], [2020, 414.21], [2023, 421.08]],
  // 9.8 (invented): a lake after an invasive mussel arrived; individuals per square meter
  invYears: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  invader: [0, 2, 8, 30, 110, 350, 800, 1200, 1350, 1400, 1420],
  native: [40, 40, 39, 37, 33, 26, 17, 9, 5, 3, 2],
};
const pairs = (xs, ys) => xs.map((x, i) => [x, ys[i]]);

/* ------------------------------------------------------------ toolkit */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = v => +(+v).toFixed(2);
function T(x, y, s, o = {}) {
  const a = o.anchor || 'start', sz = o.size || 13, w = o.weight || 'normal', fill = o.fill || INK;
  const extra = (o.italic ? ' font-style="italic"' : '') + (o.rotate ? ` transform="rotate(${o.rotate} ${f(x)} ${f(y)})"` : '');
  return `<text x="${f(x)}" y="${f(y)}" font-size="${sz}" font-weight="${w}" fill="${fill}" text-anchor="${a}"${extra}>${esc(s)}</text>`;
}
function TL(x, y, s, o = {}) { const lh = o.lh || (o.size || 13) * 1.3; return String(s).split('\n').map((l, i) => T(x, y + i * lh, l, o)).join(''); }
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const R = (x, y, w, h, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const C = (x, y, r, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"/>`;
const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const poly = (pts, sx, sy, o = {}) => `<polyline points="${pts.map(p => `${f(sx(p[0]))},${f(sy(p[1]))}`).join(' ')}" fill="none" stroke="${o.stroke || OLIVE}" stroke-width="${o.w || 2.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
function svg(id, w, h, title, desc, body) {
  const marks = [['ink', INK], ['olive', OLIVE], ['blue', BLUE], ['verm', VERM], ['green', GREEN], ['grey', GREY]].map(([n, c]) =>
    `<marker id="ar-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('');
  return { id, w, h, alt: desc, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${marks}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
` };
}
// a chart frame: x and y scales, gridlines, ticks and axis titles
function frame(o) {
  const { x0, x1, y0, y1, xs, ys } = o; // pixel box and data ranges
  const sx = v => x0 + (v - xs[0]) / (xs[1] - xs[0]) * (x1 - x0);
  const sy = v => y0 - (v - ys[0]) / (ys[1] - ys[0]) * (y0 - y1);
  let s = '';
  for (const v of o.yt) s += L(x0, sy(v), x1, sy(v), { stroke: LIGHT, w: 1 }) + T(x0 - 8, sy(v) + 4, (o.yfmt || String)(v), { anchor: 'end', size: 12 });
  for (const v of o.xt) s += L(sx(v), y0, sx(v), y0 + 5) + T(sx(v), y0 + 19, (o.xfmt || String)(v), { anchor: 'middle', size: 12 });
  s += L(x0, y0, x1, y0) + L(x0, y0, x0, y1);
  if (o.xLabel) s += T((x0 + x1) / 2, y0 + 42, o.xLabel, { anchor: 'middle', size: 13, weight: 'bold' });
  if (o.yLabel) s += T(x0 - 48, (y0 + y1) / 2, o.yLabel, { anchor: 'middle', size: 13, weight: 'bold', rotate: -90 });
  return { s, sx, sy };
}
const range = (a, b, st) => { const out = []; for (let v = a; v <= b + 1e-9; v += st) out.push(+v.toFixed(6)); return out; };
const dotsOn = (pts, sx, sy, fill, sq) => pts.map(p => sq ? R(sx(p[0]) - 4.5, sy(p[1]) - 4.5, 9, 9, { fill, stroke: '#FFFFFF', w: 1 }) : C(sx(p[0]), sy(p[1]), 4.5, { fill, stroke: '#FFFFFF', w: 1 })).join('');
function box(x, y, w, h, title, lines, o = {}) {
  let s = R(x, y, w, h, { rx: o.rx ?? 10, fill: o.fill || '#FFFFFF', stroke: o.stroke || INK, w: o.w || 1.5 });
  const ty = lines ? y + 22 : y + h / 2 + 5;
  if (title) s += T(x + w / 2, ty, title, { anchor: 'middle', weight: 'bold', size: o.tsize || 14, fill: o.tfill || INK });
  if (lines) s += TL(x + w / 2, y + (title ? 41 : 22), lines, { anchor: 'middle', size: o.size || 12.5, lh: o.lh || 16, fill: o.lfill || INK });
  return s;
}

/* ------------------------------------------------------------ figures */
const FIG = [];

// 8.12 percent killed against dose, LD50 read off
FIG.push((() => {
  const id = 'lethal-dose-50-curve', W = 640, H = 380;
  const ld = Calc.ld50(DATA.ratDeaths);
  const F = frame({ x0: 80, x1: 600, y0: 310, y1: 30, xs: [0, 100], ys: [0, 100], xt: range(0, 100, 10), yt: range(0, 100, 25), xLabel: 'Dose of the pesticide (mg per kg of body mass)', yLabel: 'Test rats killed (%)' });
  let b = F.s;
  b += L(F.sx(0), F.sy(50), F.sx(ld), F.sy(50), { stroke: VERM, w: 2, dash: '6 5' }) + L(F.sx(ld), F.sy(50), F.sx(ld), F.sy(0), { stroke: VERM, w: 2, dash: '6 5' });
  b += poly(DATA.ratDeaths, F.sx, F.sy) + dotsOn(DATA.ratDeaths, F.sx, F.sy, OLIVE);
  b += C(F.sx(ld), F.sy(50), 6, { fill: VERM, stroke: '#FFFFFF', w: 1.5 });
  b += R(F.sx(ld) + 12, F.sy(50) + 10, 168, 46, { rx: 6, fill: '#FFFFFF', stroke: VERM, w: 1.5 });
  b += T(F.sx(ld) + 96, F.sy(50) + 29, `LD50 = ${ld} mg/kg`, { anchor: 'middle', weight: 'bold', fill: VERM });
  b += T(F.sx(ld) + 96, F.sy(50) + 47, 'half of the rats die', { anchor: 'middle', size: 12, fill: VERM });
  b += T(F.sx(2), F.sy(50) - 7, '50%', { size: 12, weight: 'bold', fill: VERM });
  b += T(92, 46, 'Invented data for practice', { size: 11.5, italic: true, fill: GREY });
  return svg(id, W, H, 'Percent of test rats killed at each dose of a pesticide',
    `A graph of the percent of test rats killed against the dose of a pesticide in milligrams per kilogram of body mass (invented data). Deaths are 0% at 0, 2% at 10, 9% at 20, 26% at 30, 50% at 40, 72% at 50, 86% at 60, 96% at 80 and 99% at 100 mg/kg, an S-shaped rise. A dashed line across from 50% meets the curve at 40 mg/kg and drops to the dose axis: the LD50 is ${ld} mg/kg.`, b);
})());

// 8.13 two pesticides, thresholds and LD50s
FIG.push((() => {
  const id = 'dose-response-curve-two-pesticides', W = 680, H = 400;
  const X = pairs(DATA.doses, DATA.pestX), Y = pairs(DATA.doses, DATA.pestY);
  const ldX = Calc.ld50(X), ldY = Calc.ld50(Y);
  const F = frame({ x0: 80, x1: 640, y0: 320, y1: 40, xs: [0, 160], ys: [0, 100], xt: range(0, 160, 20), yt: range(0, 100, 25), xLabel: 'Dose (mg per kg of body mass)', yLabel: 'Test fish killed (%)' });
  let b = F.s;
  b += L(F.sx(0), F.sy(50), F.sx(ldX), F.sy(50), { stroke: GREY, w: 1.5, dash: '6 5' });
  for (const [v, c] of [[ldY, BLUE], [ldX, VERM]]) b += L(F.sx(v), F.sy(50), F.sx(v), F.sy(0), { stroke: c, w: 1.5, dash: '6 5' });
  b += poly(Y, F.sx, F.sy, { stroke: BLUE }) + dotsOn(Y, F.sx, F.sy, BLUE);
  b += poly(X, F.sx, F.sy, { stroke: VERM }) + dotsOn(X, F.sx, F.sy, VERM, true);
  b += T(F.sx(ldY) - 6, F.sy(50) - 10, `LD50 of Y = ${ldY}`, { anchor: 'end', size: 12.5, weight: 'bold', fill: BLUE });
  b += T(F.sx(ldX) + 8, F.sy(50) + 18, `LD50 of X = ${ldX}`, { size: 12.5, weight: 'bold', fill: VERM });
  // threshold zones: the curve leaves zero
  // legend
  b += R(470, 222, 156, 66, { rx: 6, fill: '#FFFFFF', stroke: LIGHT, w: 1 });
  b += L(482, 242, 512, 242, { stroke: BLUE, w: 2.5 }) + C(497, 242, 4.5, { fill: BLUE }) + T(520, 246, 'Pesticide Y', { size: 13 });
  b += L(482, 268, 512, 268, { stroke: VERM, w: 2.5 }) + R(492.5, 263.5, 9, 9, { fill: VERM }) + T(520, 272, 'Pesticide X', { size: 13 });
  b += T(636, 310, 'Invented data for practice', { anchor: 'end', size: 11.5, italic: true, fill: GREY });
  return svg(id, W, H, 'Percent of test fish killed by two pesticides at each dose',
    `Two curves of percent of test fish killed against dose in mg per kg (invented data). Pesticide Y (circles) kills 0% at 0 and 10, 8% at 20, 25% at 30, 50% at 40, 72% at 50, 88% at 60, 97% at 80 and nearly all fish above that. Pesticide X (squares) kills 0% up to 20, 2% at 30, 6% at 40, 12% at 50, 22% at 60, 50% at 80, 76% at 100, 90% at 120 and 98% at 160. Dashed lines read the LD50s: ${ldY} mg/kg for Y and ${ldX} mg/kg for X, so Y is more toxic. Y's curve first rises above zero between 10 and 20 mg/kg, X's between 20 and 30 mg/kg.`, b);
})());

// 8.14 synergism: two pollutants alone and together
FIG.push((() => {
  const id = 'pollution-human-health-synergism', W = 640, H = 380;
  const d = DATA.synergy;
  const cats = [['No pollutant', d.control, GREY], ['Pollutant A alone', d.a, BLUE], ['Pollutant B alone', d.b, GREEN], ['A and B together', d.both, VERM]];
  const F = frame({ x0: 80, x1: 610, y0: 300, y1: 30, xs: [0, 4], ys: [0, 50], xt: [], yt: range(0, 50, 10), yLabel: 'Mice with lung damage (%)' });
  let b = F.s;
  cats.forEach(([name, v, c], j) => {
    const x = F.sx(j + 0.2), w = F.sx(j + 0.8) - x;
    b += R(x, F.sy(v), w, F.sy(0) - F.sy(v), { fill: c });
    b += T(x + w / 2, F.sy(v) - 7, `${v}%`, { anchor: 'middle', weight: 'bold' });
    b += T(x + w / 2, F.sy(0) + 20, name, { anchor: 'middle', size: 12.5 });
  });
  const sum = d.a + d.b; // what two separate effects would add to
  b += L(F.sx(3.1), F.sy(sum), F.sx(3.9), F.sy(sum), { stroke: INK, w: 2, dash: '6 4' });
  b += T(F.sx(3.0), F.sy(sum) + 4, `A + B added: ${sum}%`, { anchor: 'end', size: 12, weight: 'bold' });
  b += T(345, 340, 'Lab mice breathing air for 30 days', { anchor: 'middle', size: 13, weight: 'bold' });
  b += T(606, 46, 'Invented data for practice', { anchor: 'end', size: 11.5, italic: true, fill: GREY });
  return svg(id, W, H, 'Lung damage in lab mice from two air pollutants, alone and together',
    `A bar chart of the percent of lab mice with lung damage after 30 days (invented data): ${d.control}% with no pollutant, ${d.a}% with pollutant A alone, ${d.b}% with pollutant B alone and ${d.both}% with A and B together. A dashed line at ${sum}% marks what the two separate effects would add to; the bar for both together is far above it, which is synergism.`, b);
})());

// 8.15 a mosquito-borne disease cycle and a warming range
FIG.push((() => {
  const id = 'pathogens-vector-cycle', W = 720, H = 400;
  let b = '';
  b += T(220, 30, 'How a vector spreads a pathogen', { anchor: 'middle', weight: 'bold', size: 15 });
  b += box(140, 50, 160, 64, 'Infected person', 'pathogen in the blood', { stroke: VERM, tfill: VERM });
  b += box(20, 250, 170, 64, 'Mosquito (vector)', 'picks up the pathogen\nwhen it bites', { stroke: OLIVE, tfill: OLIVE, lh: 15 });
  b += box(250, 250, 170, 64, 'Healthy person', 'pathogen enters\nwith the next bite', { stroke: BLUE, tfill: BLUE, lh: 15 });
  b += P('M 160 116 Q 90 170 100 246', { stroke: INK, w: 2, arrow: 'ink' }) + T(70, 180, '1 bite', { anchor: 'middle', size: 12.5, weight: 'bold' });
  b += P('M 192 290 L 246 290', { stroke: INK, w: 2, arrow: 'ink' }) + T(219, 280, '2', { anchor: 'middle', size: 12.5, weight: 'bold' });
  b += P('M 340 246 Q 360 170 285 118', { stroke: INK, w: 2, arrow: 'ink' }) + T(372, 180, '3 sick', { anchor: 'middle', size: 12.5, weight: 'bold' });
  b += TL(220, 346, 'Malaria, West Nile virus and Zika virus\nall spread this way, through mosquito bites.', { anchor: 'middle', size: 12.5, lh: 16 });
  // latitude panel
  const x0 = 470, x1 = 700;
  b += T((x0 + x1) / 2, 30, 'Warmer climate, wider range', { anchor: 'middle', weight: 'bold', size: 15 });
  const bands = [['Temperate', 60, '#F4F5F4'], ['Subtropical', 120, '#FBF4E6'], ['Tropical', 180, '#FBE9DE'], ['Subtropical', 240, '#FBF4E6'], ['Temperate', 300, '#F4F5F4']];
  for (const [n, y, c] of bands) { b += R(x0, y - 10, x1 - x0, 60, { fill: c, stroke: LIGHT, w: 1 }); b += T(x0 + 8, y + 8, n, { size: 12, fill: GREY }); }
  b += L(x0, 230, x1, 230, { stroke: GREY, w: 1, dash: '3 4' }) + T(x0 + 8, 226, 'Equator', { size: 11.5, fill: GREY });
  b += R(x0 + 120, 170, 100, 120, { rx: 8, fill: 'none', stroke: VERM, w: 2.5 });
  b += T(x0 + 170, 252, 'range today', { anchor: 'middle', size: 12, weight: 'bold', fill: VERM });
  b += R(x0 + 120, 110, 100, 240, { rx: 8, fill: 'none', stroke: VERM, w: 2, dash: '6 4' });
  b += L(x0 + 170, 168, x0 + 170, 116, { stroke: VERM, w: 2, arrow: 'verm' }) + L(x0 + 170, 292, x0 + 170, 344, { stroke: VERM, w: 2, arrow: 'verm' });
  b += TL((x0 + x1) / 2, 376, 'Milder winters let the vector\nsurvive farther from the equator.', { anchor: 'middle', size: 12.5, lh: 16 });
  return svg(id, W, H, 'How a mosquito spreads a pathogen, and how a warmer climate widens its range',
    'Left: a cycle of three boxes. 1: a mosquito bites an infected person and picks up the pathogen. 2: the mosquito carries it. 3: it bites a healthy person, who gets sick and can infect the next mosquito. Malaria, West Nile virus and Zika virus spread this way. Right: climate bands from the equator outward. The mosquito range today covers the tropics; a dashed outline shows it stretching into subtropical and temperate bands as winters get milder.', b);
})());

// 9.1 the chlorine cycle that destroys ozone
FIG.push((() => {
  const id = 'ozone-depletion-chlorine-cycle', W = 720, H = 380;
  let b = '';
  b += R(0, 0, W, 30, { fill: TINT }) + T(W / 2, 20, 'In the stratosphere, about 15 to 35 km up', { anchor: 'middle', weight: 'bold', size: 14, fill: OLIVE });
  b += box(20, 60, 200, 92, '1. UV breaks a CFC', 'Ultraviolet light splits\na CFC molecule and\nfrees a chlorine atom (Cl).', { stroke: VERM, tfill: VERM });
  b += box(300, 60, 220, 92, '2. Cl attacks ozone', 'Cl + O₃ → ClO + O₂\nOne ozone molecule\nis destroyed.', { stroke: OLIVE, tfill: OLIVE });
  b += box(300, 230, 220, 92, '3. Cl is set free again', 'ClO + O → Cl + O₂\nThe chlorine atom\nis released unchanged.', { stroke: BLUE, tfill: BLUE });
  b += L(222, 106, 294, 106, { stroke: INK, w: 2, arrow: 'ink' });
  b += P('M 470 154 Q 520 192 470 226', { stroke: INK, w: 2, arrow: 'ink' });
  b += P('M 350 228 Q 300 192 350 156', { stroke: OLIVE, w: 2.5, arrow: 'olive' });
  b += T(262, 196, 'repeats', { anchor: 'middle', size: 12.5, weight: 'bold', fill: OLIVE });
  b += box(550, 130, 160, 120, 'One Cl atom', 'can destroy many\nthousands of ozone\nmolecules before it\nleaves the cycle.', { fill: TINT, stroke: OLIVE, tfill: OLIVE });
  b += box(20, 230, 240, 92, 'Result at the surface', 'Less ozone lets more UV\nthrough: more skin cancer\nand cataracts.', { stroke: GREY });
  b += T(W / 2, 360, 'O₃ is ozone, O₂ is ordinary oxygen, O is a single oxygen atom.', { anchor: 'middle', size: 12.5, fill: GREY });
  return svg(id, W, H, 'How chlorine from CFCs destroys stratospheric ozone',
    'A three-step cycle in the stratosphere, about 15 to 35 km up. Step 1: ultraviolet light breaks a CFC molecule and frees a chlorine atom. Step 2: chlorine reacts with ozone: Cl + O3 gives ClO + O2, destroying one ozone molecule. Step 3: ClO reacts with a single oxygen atom: ClO + O gives Cl + O2, and the chlorine atom is free again, so the cycle repeats. One chlorine atom can destroy many thousands of ozone molecules. Result at the surface: less ozone lets more UV through, raising skin cancer and cataracts.', b);
})());

// 9.2 timeline of the ozone fix
FIG.push((() => {
  const id = 'reducing-ozone-depletion-timeline', W = 760, H = 330;
  const ev = [
    [1974, 'Scientists warn that\nCFCs could destroy\nstratospheric ozone', 'up'],
    [1985, 'Ozone hole over\nAntarctica reported', 'down'],
    [1987, 'Montreal Protocol\nsigned', 'up'],
    [1996, 'CFC production ends\nin developed countries', 'down'],
    [2010, 'CFC production ends\nworldwide', 'up'],
    [2016, 'Kigali Amendment:\nHFCs phased down', 'down'],
    [2066, 'Antarctic ozone expected\nback to 1980 levels', 'up'],
  ];
  const sx = y => 50 + (y - 1970) / (2070 - 1970) * 660;
  const lx = { 1974: 75, 1985: 95, 1987: 215, 1996: 245, 2010: 355, 2016: 395, 2066: 660 };
  let b = '';
  b += L(40, 165, 725, 165, { stroke: INK, w: 3 });
  for (const y of [1970, 1980, 1990, 2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070]) b += L(sx(y), 159, sx(y), 171);
  for (const y of [1970, 2020, 2070]) b += T(sx(y), 150, String(y), { anchor: 'middle', size: 11, fill: GREY });
  b += R(sx(2026), 152, sx(2070) - sx(2026), 26, { fill: TINT });
  b += T(sx(2048), 194, 'expected (projection)', { anchor: 'middle', size: 11.5, italic: true, fill: OLIVE });
  ev.forEach(([y, s, side]) => {
    const x = sx(y), up = side === 'up', c = y === 1987 ? OLIVE : y === 2066 ? GREEN : INK, t = lx[y];
    b += C(x, 165, 6, { fill: c });
    b += up ? P(`M ${f(x)} 158 L ${f(x)} 138 L ${f(t)} 104`, { stroke: GREY, w: 1 }) : P(`M ${f(x)} 172 L ${f(x)} 186 L ${f(t)} 208`, { stroke: GREY, w: 1 });
    b += T(t, up ? 30 : 226, String(y), { anchor: 'middle', weight: 'bold', size: 13, fill: c });
    b += TL(t, up ? 48 : 244, s, { anchor: 'middle', size: 11.5, lh: 14, fill: c });
  });
  b += T(W / 2, 318, 'Dates from the UN Environment Programme and WMO ozone assessments.', { anchor: 'middle', size: 11.5, fill: GREY });
  return svg(id, W, H, 'Timeline of ozone depletion and the Montreal Protocol',
    'A timeline from 1970 to 2070. 1974: scientists warn that CFCs could destroy stratospheric ozone. 1985: the ozone hole over Antarctica is reported. 1987: the Montreal Protocol is signed. 1996: CFC production ends in developed countries. 2010: CFC production ends worldwide. 2016: the Kigali Amendment adds a phase-down of HFCs. About 2066, shaded as a projection: Antarctic ozone is expected to be back to 1980 levels.', b);
})());

// 9.3 the greenhouse effect beside the ozone layer
FIG.push((() => {
  const id = 'greenhouse-effect-ozone', W = 760, H = 460;
  let b = '';
  const panel = (x, title, c) => R(x, 40, 360, 380, { rx: 10, fill: '#FFFFFF', stroke: LIGHT, w: 1.5 }) + T(x + 180, 30, title, { anchor: 'middle', weight: 'bold', size: 15, fill: c });
  const wave = (x0, y0, x1, y1, c, mk) => {
    const n = 5, dx = (x1 - x0) / n, dy = (y1 - y0) / n; let d = `M ${f(x0)} ${f(y0)}`;
    for (let i = 0; i < n; i++) { const mx = x0 + dx * (i + 0.5) + (i % 2 ? -6 : 6), my = y0 + dy * (i + 0.5); d += ` Q ${f(mx)} ${f(my)} ${f(x0 + dx * (i + 1))} ${f(y0 + dy * (i + 1))}`; }
    return P(d, { stroke: c, w: 2.5, arrow: mk });
  };
  // left: greenhouse effect
  b += panel(10, 'The greenhouse effect', VERM);
  b += R(11, 330, 358, 89, { fill: '#E7EFE2' }) + T(190, 408, 'Earth’s surface', { anchor: 'middle', weight: 'bold', size: 13, fill: GREEN });
  b += R(11, 150, 358, 180, { fill: '#FBF1EA' }) + T(24, 168, 'Troposphere', { size: 12.5, weight: 'bold', fill: VERM });
  b += C(45, 72, 22, { fill: '#F3C64A' }) + T(45, 112, 'Sun', { anchor: 'middle', size: 12.5 });
  b += L(68, 88, 92, 326, { stroke: '#C99A00', w: 3, arrow: 'ink' }) + T(90, 136, 'sunlight', { size: 12, fill: '#8A6A00' });
  b += wave(258, 326, 246, 220, VERM, 'verm');
  b += wave(232, 222, 222, 324, VERM, 'verm');
  b += wave(320, 326, 340, 62, VERM, 'verm');
  b += T(332, 56, 'some IR escapes', { anchor: 'end', size: 12, fill: VERM });
  for (const [x, y] of [[244, 212], [290, 236], [200, 200], [276, 192]]) b += C(x, y, 7, { fill: '#FFFFFF', stroke: VERM, w: 2 });
  b += TL(140, 262, 'Greenhouse gases\nabsorb infrared and send\npart of it back down.', { anchor: 'middle', size: 12, lh: 15 });
  b += T(250, 172, 'CO₂, CH₄, N₂O, H₂O, CFCs', { anchor: 'middle', size: 12, weight: 'bold', fill: VERM });
  b += T(190, 355, 'surface gives off infrared (IR)', { anchor: 'middle', size: 12, fill: VERM });
  b += T(190, 382, 'Result: the lower atmosphere warms', { anchor: 'middle', size: 12.5, weight: 'bold' });
  // right: ozone layer
  const ox = 390;
  b += panel(ox, 'The ozone layer', BLUE);
  b += R(ox + 1, 330, 358, 89, { fill: '#E7EFE2' }) + T(ox + 180, 408, 'Earth’s surface', { anchor: 'middle', weight: 'bold', size: 13, fill: GREEN });
  b += R(ox + 1, 130, 358, 70, { fill: '#E3EEF6' }) + T(ox + 14, 148, 'Stratosphere: ozone layer (O₃)', { size: 12.5, weight: 'bold', fill: BLUE });
  b += T(ox + 14, 166, 'about 15 to 35 km up', { size: 12, fill: BLUE });
  b += C(ox + 40, 80, 22, { fill: '#F3C64A' }) + T(ox + 40, 120, 'Sun', { anchor: 'middle', size: 12.5 });
  for (const x of [ox + 236, ox + 272, ox + 308, ox + 344]) b += L(x - 30, 64, x, 184, { stroke: '#7A3FA0', w: 2.5, arrow: 'ink' });
  b += L(ox + 300, 64, ox + 340, 324, { stroke: '#7A3FA0', w: 1.5, dash: '5 4', arrow: 'ink' });
  b += T(ox + 270, 56, 'ultraviolet (UV)', { anchor: 'middle', size: 12, fill: '#7A3FA0' });
  b += TL(ox + 160, 228, 'Ozone absorbs most UV\nbefore it reaches the ground.', { anchor: 'middle', size: 12, lh: 15 });
  b += TL(ox + 160, 270, 'CFCs release chlorine that destroys\nozone, so more UV gets through.', { anchor: 'middle', size: 12, lh: 15, fill: VERM });
  b += T(ox + 180, 382, 'Result: more skin cancer and cataracts', { anchor: 'middle', size: 12.5, weight: 'bold' });
  b += T(W / 2, 450, 'Different gases, different radiation, different layers of the atmosphere.', { anchor: 'middle', size: 12.5, fill: GREY });
  return svg(id, W, H, 'The greenhouse effect beside the ozone layer',
    'Two panels. Left, the greenhouse effect: sunlight reaches Earth’s surface, which gives off infrared radiation (IR). In the troposphere, greenhouse gases (CO2, CH4, N2O, H2O and CFCs) absorb infrared and send part of it back down; some IR escapes to space. Result: the lower atmosphere warms. Right, the ozone layer: ultraviolet (UV) light from the Sun is mostly absorbed by ozone (O3) in the stratosphere, about 15 to 35 km up; a dashed arrow shows a little UV reaching the ground. CFCs release chlorine that destroys ozone, so more UV gets through. Result: more skin cancer and cataracts. Caption: different gases, different radiation, different layers of the atmosphere.', b);
})());

// 9.4 Mauna Loa CO2 (NOAA)
FIG.push((() => {
  const id = 'greenhouse-gas-increases-keeling', W = 680, H = 400;
  const D = DATA.maunaLoa;
  const F = frame({ x0: 90, x1: 640, y0: 320, y1: 40, xs: [1955, 2025], ys: [270, 430], xt: range(1960, 2020, 10), yt: range(270, 430, 20), xLabel: 'Year', yLabel: 'CO₂ in the air (ppm)' });
  let b = F.s;
  b += L(F.sx(1955), F.sy(280), F.sx(2025), F.sy(280), { stroke: GREY, w: 2, dash: '7 5' });
  b += T(F.sx(1957), F.sy(280) - 8, 'About 280 ppm before about 1800 (ice cores)', { size: 12, fill: GREY });
  b += poly(D, F.sx, F.sy) + dotsOn(D, F.sx, F.sy, OLIVE);
  const [ya, va] = D[0], [yb, vb] = D[D.length - 1];
  b += T(F.sx(ya) + 8, F.sy(va) + 20, `${ya}: ${va.toFixed(2)} ppm`, { size: 12.5, weight: 'bold', fill: OLIVE });
  b += T(F.sx(yb) - 6, F.sy(vb) - 12, `${yb}: ${vb.toFixed(2)} ppm`, { anchor: 'end', size: 12.5, weight: 'bold', fill: OLIVE });
  b += T(W / 2, 390, 'Source: NOAA Global Monitoring Laboratory, Mauna Loa annual means', { anchor: 'middle', size: 11.5, fill: GREY });
  return svg(id, W, H, 'Carbon dioxide in the air at Mauna Loa, 1960 to 2023',
    `A line graph of yearly average carbon dioxide at Mauna Loa Observatory, Hawaii, from NOAA: ${D.map(([y, v]) => `${y} ${v.toFixed(2)}`).join(', ')} parts per million. The line rises every year and gets steeper over time. A dashed line at 280 ppm marks the level before about 1800, measured in ice cores.`, b);
})());

// 9.5 two positive feedback loops
FIG.push((() => {
  const id = 'climate-change-feedback', W = 760, H = 420;
  let b = '';
  const loop = (cx, title, steps, c) => {
    let s = T(cx, 30, title, { anchor: 'middle', weight: 'bold', size: 15, fill: c });
    const pos = [[cx, 70, 184], [cx + 100, 190, 150], [cx, 310, 184], [cx - 100, 190, 150]];
    steps.forEach((t, i) => { const [x, y, w] = pos[i]; s += box(x - w / 2, y - 30, w, 60, '', t, { stroke: i === 0 ? c : INK, w: i === 0 ? 2.5 : 1.5, size: 12.5, lh: 15, fill: i === 0 ? TINT : '#FFFFFF' }); });
    s += P(`M ${cx + 94} 70 Q ${cx + 118} 90 ${cx + 112} 156`, { stroke: c, w: 2, arrow: 'olive' });
    s += P(`M ${cx + 112} 222 Q ${cx + 112} 262 ${cx + 94} 296`, { stroke: c, w: 2, arrow: 'olive' });
    s += P(`M ${cx - 94} 312 Q ${cx - 118} 292 ${cx - 112} 224`, { stroke: c, w: 2, arrow: 'olive' });
    s += P(`M ${cx - 112} 158 Q ${cx - 118} 92 ${cx - 96} 74`, { stroke: c, w: 2, arrow: 'olive' });
    s += C(cx, 190, 20, { fill: '#FFFFFF', stroke: c, w: 2 }) + T(cx, 198, '+', { anchor: 'middle', weight: 'bold', size: 22, fill: c });
    return s;
  };
  b += loop(190, 'Ice and albedo', ['Earth warms', 'Snow and sea ice\nmelt', 'Darker water and land\nare exposed (lower albedo)', 'More sunlight\nis absorbed'], OLIVE);
  b += loop(570, 'Thawing permafrost', ['Earth warms', 'Permafrost\nthaws', 'Microbes decompose\nthe frozen remains', 'Methane and CO₂\nare released'], OLIVE);
  b += TL(W / 2, 370, 'A positive feedback loop: each change makes the first one stronger.\nMelting sea ice is part of this loop, but it does not raise sea level.', { anchor: 'middle', size: 13, lh: 18 });
  return svg(id, W, H, 'Two positive feedback loops that amplify warming',
    'Two loops, each marked with a plus sign. Left, ice and albedo: Earth warms, snow and sea ice melt, darker water and land are exposed so albedo falls, more sunlight is absorbed, and Earth warms more. Right, thawing permafrost: Earth warms, permafrost thaws, microbes decompose the frozen remains, methane and carbon dioxide are released, and Earth warms more. Caption: a positive feedback loop makes the first change stronger; melting sea ice is part of the loop but does not raise sea level.', b);
})());

// 9.6 effects of ocean warming
FIG.push((() => {
  const id = 'ocean-warming-effects', W = 760, H = 400;
  let b = '';
  b += R(0, 0, W, 400, { fill: '#FFFFFF' });
  b += box(250, 150, 260, 90, 'The ocean absorbs heat', 'It has taken up about 90% of the\nextra heat trapped since 1970.', { fill: '#E3EEF6', stroke: BLUE, tfill: BLUE, w: 2.5 });
  const out = [
    [20, 20, 'Water expands', 'Warmer water takes more\nspace: sea level rises.', 330, 150, 200, 66],
    [540, 20, 'Less dissolved oxygen', 'Warm water holds less O₂;\nfish and shellfish struggle.', 430, 150, 200, 66],
    [20, 300, 'Coral bleaching', 'Heat-stressed corals expel\ntheir algae and can starve.', 300, 240, 200, 66],
    [540, 300, 'Species move', 'Fish shift toward the poles\nor into deeper, cooler water.', 460, 240, 200, 66],
    [280, 320, 'Less mixing', 'A warm surface layer floats on top,\nso fewer nutrients rise to it.', 380, 240, 200, 66],
  ];
  for (const [x, y, t, s, ax, ay, w, h] of out) {
    const wide = t === 'Less mixing' ? 200 : w;
    b += box(x, y, wide, h + 8, t, s, { stroke: INK, size: 12, lh: 15 });
    const cx = x + wide / 2, cy = y < 150 ? y + h + 8 : y;
    b += L(ax, ay, cx + (cx - ax) * -0.02, cy + (y < 150 ? 6 : -6), { stroke: BLUE, w: 2, arrow: 'blue' });
  }
  return svg(id, W, H, 'Effects of ocean warming',
    'A central box: the ocean absorbs heat; it has taken up about 90% of the extra heat trapped since 1970. Arrows lead to five effects: water expands, so sea level rises; warm water holds less dissolved oxygen, so fish and shellfish struggle; heat-stressed corals expel their algae and can starve (coral bleaching); fish shift toward the poles or into deeper, cooler water; and a warm surface layer floats on top, so fewer nutrients rise to it.', b);
})());

// 9.7 carbonate chemistry with pH
FIG.push((() => {
  const id = 'ocean-acidification-carbonate', W = 760, H = 420;
  let b = '';
  b += R(0, 0, W, 70, { fill: '#F4F5F4' }) + T(20, 26, 'Air', { weight: 'bold', size: 13, fill: GREY });
  b += R(0, 70, W, 250, { fill: '#E3EEF6' }) + T(W - 20, 94, 'Surface ocean', { anchor: 'end', weight: 'bold', size: 13, fill: BLUE });
  b += box(40, 18, 120, 40, 'CO₂ in the air', null, { fill: '#FFFFFF', stroke: GREY, tsize: 13 });
  b += L(100, 60, 100, 112, { stroke: INK, w: 2, arrow: 'ink' }) + T(110, 92, 'dissolves', { size: 12 });
  b += box(30, 116, 150, 52, 'CO₂ + H₂O', null, { tsize: 15 });
  b += L(184, 142, 238, 142, { stroke: INK, w: 2, arrow: 'ink' });
  b += box(242, 116, 170, 52, 'H₂CO₃', null, { tsize: 15 }) + T(327, 186, 'carbonic acid', { anchor: 'middle', size: 12 });
  b += L(416, 142, 470, 142, { stroke: INK, w: 2, arrow: 'ink' });
  b += box(474, 116, 180, 52, 'H⁺ + HCO₃⁻', null, { tsize: 15, stroke: VERM, tfill: VERM });
  b += TL(564, 186, 'more hydrogen ions:\npH falls', { anchor: 'middle', size: 12, lh: 15, fill: VERM, weight: 'bold' });
  b += box(160, 222, 300, 52, 'H⁺ + CO₃²⁻ → HCO₃⁻', null, { tsize: 15, stroke: OLIVE, tfill: OLIVE });
  b += P('M 560 220 Q 520 246 466 248', { stroke: VERM, w: 2, arrow: 'verm' });
  b += TL(310, 292, 'Hydrogen ions take up carbonate ions, so fewer are left\nfor corals and shellfish to build calcium carbonate (CaCO₃).', { anchor: 'middle', size: 12.5, lh: 16 });
  // pH strip
  const sx = v => 120 + (8.3 - v) / (8.3 - 7.6) * 520;
  b += T(W / 2, 346, 'Average surface ocean pH (lower is more acidic)', { anchor: 'middle', weight: 'bold', size: 13 });
  b += L(sx(8.3), 370, sx(7.6), 370, { stroke: INK, w: 2 });
  for (const v of [8.3, 8.2, 8.1, 8.0, 7.9, 7.8, 7.7, 7.6]) b += L(sx(v), 365, sx(v), 375) + T(sx(v), 392, v.toFixed(1), { anchor: 'middle', size: 12 });
  for (const [v, t, c] of [[8.2, 'about 1750', GREEN], [8.1, 'today', OLIVE], [7.8, '2100 if emissions stay high', VERM]]) b += C(sx(v), 370, 6, { fill: c }) + T(sx(v), 412, t, { anchor: 'middle', size: 11.5, weight: 'bold', fill: c });
  return svg(id, W, H, 'How carbon dioxide lowers ocean pH',
    'Carbon dioxide from the air dissolves in the surface ocean. CO2 + H2O forms H2CO3, carbonic acid, which releases a hydrogen ion and a bicarbonate ion (H+ + HCO3-): more hydrogen ions, so pH falls. Hydrogen ions also combine with carbonate ions (H+ + CO3 2- gives HCO3-), so fewer carbonate ions are left for corals and shellfish to build calcium carbonate. A pH scale below shows average surface ocean pH of about 8.2 around 1750, about 8.1 today and about 7.8 by 2100 if emissions stay high.', b);
})());

// 9.8 an invader rises as a native species falls
FIG.push((() => {
  const id = 'invasive-species-takeover', W = 680, H = 400;
  const A = pairs(DATA.invYears, DATA.invader), N = pairs(DATA.invYears, DATA.native);
  const F = frame({ x0: 90, x1: 590, y0: 320, y1: 40, xs: [0, 10], ys: [0, 1500], xt: range(0, 10, 1), yt: range(0, 1500, 300), xLabel: 'Years since the invasive mussel arrived', yLabel: 'Invasive mussels per m²' });
  let b = F.s;
  const syR = v => 320 - v / 50 * 280;
  for (const v of range(0, 50, 10)) b += L(590, syR(v), 595, syR(v)) + T(600, syR(v) + 4, String(v), { size: 12, fill: BLUE });
  b += L(590, 320, 590, 40);
  b += T(648, 180, 'Native mussels per m²', { anchor: 'middle', size: 13, weight: 'bold', fill: BLUE, rotate: 90 });
  b += poly(A, F.sx, F.sy, { stroke: VERM }) + dotsOn(A, F.sx, F.sy, VERM);
  const Npx = N.map(([x, y]) => [x, y]);
  b += `<polyline points="${Npx.map(p => `${f(F.sx(p[0]))},${f(syR(p[1]))}`).join(' ')}" fill="none" stroke="${BLUE}" stroke-width="2.5" stroke-dasharray="7 4"/>`;
  b += Npx.map(p => R(F.sx(p[0]) - 4.5, syR(p[1]) - 4.5, 9, 9, { fill: BLUE, stroke: '#FFFFFF', w: 1 })).join('');
  b += R(104, 170, 230, 60, { rx: 6, fill: '#FFFFFF', stroke: LIGHT, w: 1 });
  b += L(116, 190, 146, 190, { stroke: VERM, w: 2.5 }) + C(131, 190, 4.5, { fill: VERM }) + T(154, 194, 'Invasive mussel (left axis)', { size: 12.5 });
  b += L(116, 214, 146, 214, { stroke: BLUE, w: 2.5, dash: '7 4' }) + R(126.5, 209.5, 9, 9, { fill: BLUE }) + T(154, 218, 'Native mussel (right axis)', { size: 12.5 });
  b += T(586, 388, 'Invented data for practice', { anchor: 'end', size: 11.5, italic: true, fill: GREY });
  return svg(id, W, H, 'An invasive mussel and a native mussel in one lake over ten years',
    `A graph with two y axes (invented data). The invasive mussel (left axis, per square meter) goes ${DATA.invader.join(', ')} in years 0 to 10: slow at first, then explosive growth, then leveling off. The native mussel (right axis, per square meter) goes ${DATA.native.join(', ')}: steady at first, then falling as the invader takes over.`, b);
})());

// 9.9 risk traits and protections
FIG.push((() => {
  const id = 'endangered-species-categories', W = 760, H = 400;
  let b = '';
  b += T(190, 30, 'Traits that raise extinction risk', { anchor: 'middle', weight: 'bold', size: 15, fill: VERM });
  const traits = ['Specialist: narrow diet or habitat', 'Slow reproduction (K-selected)', 'Small or isolated population', 'Needs a large territory', 'Low genetic diversity', 'Hunted or traded for parts'];
  traits.forEach((t, i) => { b += R(30, 48 + i * 50, 320, 40, { rx: 8, fill: '#FBEDE5', stroke: VERM, w: 1.2 }) + T(46, 73 + i * 50, t, { size: 13 }); });
  b += L(360, 190, 400, 190, { stroke: INK, w: 2.5, arrow: 'ink' });
  b += T(570, 30, 'What protects species', { anchor: 'middle', weight: 'bold', size: 15, fill: GREEN });
  const prot = [['Endangered Species Act (US law)', 'lists species, bans harming them,\nprotects habitat they need'], ['CITES (international treaty)', 'controls trade in protected\nspecies and their parts'], ['Protected areas and captive breeding', 'refuges, parks, breeding and\nrelease programs']];
  prot.forEach(([t, s], i) => { b += box(410, 48 + i * 100, 320, 86, t, s, { stroke: GREEN, tfill: GREEN, fill: '#E8F5F0', size: 12.5, lh: 16, tsize: 13.5 }); });
  b += TL(W / 2, 362, 'Threatened: likely to become endangered soon.  Endangered: in danger of\nextinction in all or much of its range (definitions from the Endangered Species Act).', { anchor: 'middle', size: 12.5, lh: 16 });
  return svg(id, W, H, 'Traits that raise extinction risk, and the protections for endangered species',
    'Left, traits that raise extinction risk: specialist with a narrow diet or habitat; slow reproduction (K-selected); small or isolated population; needs a large territory; low genetic diversity; hunted or traded for parts. An arrow points right to what protects species: the Endangered Species Act, a US law that lists species, bans harming them and protects habitat they need; CITES, an international treaty that controls trade in protected species and their parts; protected areas and captive breeding. Footer: threatened means likely to become endangered soon; endangered means in danger of extinction in all or much of its range.', b);
})());

// 9.10 fragmentation and a corridor
FIG.push((() => {
  const id = 'human-impacts-biodiversity-corridor', W = 760, H = 330;
  let b = '';
  const panel = (x, title) => R(x, 40, 230, 230, { rx: 8, fill: '#F6F1E3', stroke: LIGHT }) + T(x + 115, 28, title, { anchor: 'middle', weight: 'bold', size: 14 });
  const forest = (x, y, w, h) => R(x, y, w, h, { rx: 14, fill: '#9BC9A5', stroke: GREEN, w: 1.5 });
  const animal = (x, y) => C(x, y, 5, { fill: OLIVE });
  b += panel(15, '1. One large forest');
  b += forest(35, 60, 190, 190);
  for (const [x, y] of [[70, 100], [150, 90], [110, 160], [190, 200], [80, 215], [170, 140]]) b += animal(x, y);
  b += panel(265, '2. Split into fragments');
  b += forest(280, 60, 80, 80) + forest(395, 60, 90, 100) + forest(285, 180, 90, 75) + forest(405, 195, 75, 60);
  b += R(368, 41, 20, 228, { fill: '#B9B4A8' }) + L(378, 41, 378, 269, { stroke: '#FFFFFF', w: 2, dash: '10 8' });
  b += R(266, 160, 228, 14, { fill: '#E9D9A5' }) + T(380, 166 + 4, 'farm', { anchor: 'middle', size: 11, fill: INK });
  b += T(378, 290, 'road', { anchor: 'middle', size: 11.5, fill: GREY });
  for (const [x, y] of [[315, 95], [440, 100], [325, 215]]) b += animal(x, y);
  b += panel(515, '3. Reconnected by a corridor');
  b += forest(530, 60, 80, 80) + forest(645, 60, 90, 100) + forest(535, 180, 90, 75) + forest(655, 195, 75, 60);
  b += R(618, 41, 20, 228, { fill: '#B9B4A8' }) + L(628, 41, 628, 269, { stroke: '#FFFFFF', w: 2, dash: '10 8' });
  b += R(604, 86, 48, 26, { rx: 6, fill: '#6FB07D', stroke: GREEN, w: 2 });
  b += R(570, 138, 26, 46, { rx: 6, fill: '#6FB07D', stroke: GREEN, w: 2 });
  for (const [x, y] of [[565, 95], [628, 99], [690, 110], [583, 160], [570, 215], [695, 225]]) b += animal(x, y);
  b += T(628, 290, 'wildlife bridge and strips of habitat', { anchor: 'middle', size: 11.5, weight: 'bold', fill: GREEN });
  b += TL(W / 2, 314, 'Small, isolated fragments hold fewer species; corridors let animals move, find mates and recolonize.', { anchor: 'middle', size: 12.5 });
  return svg(id, W, H, 'Habitat fragmentation and a wildlife corridor',
    'Three panels. 1: one large forest with many animals. 2: a road and a farm split the forest into four small fragments, and fewer animals remain. 3: the same fragments reconnected by a wildlife bridge over the road and strips of habitat between patches, with animals moving among them again. Caption: small, isolated fragments hold fewer species; corridors let animals move, find mates and recolonize.', b);
})());

export const FIGURES = FIG;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  mkdirSync(OUT, { recursive: true });
  for (const F of FIG) {
    if (process.argv.includes('--list')) { console.log(F.id, F.w, F.h); continue; }
    writeFileSync(join(OUT, `${F.id}.svg`), F.svg);
  }
  if (!process.argv.includes('--list')) console.log(`wrote ${FIG.length} figures to environmental-science/figures/`);
}
