/* AP® Environmental Science figures for Unit 4, Earth Systems and Resources (author C).
   Diagrams are drawn from coordinates; the data figures are drawn from the numbers listed
   here (the U.S. Standard Atmosphere, 1976 layer-boundary temperatures; the USDA soil
   texture classes, whose polygons also classify the marked samples), so a picture always
   shows the data it claims to show.

     node scripts/apenv-figures/unit-4.mjs          writes environmental-science/figures/<id>.svg
                                                     and environmental-science/data/figures/<topic>.json
     node scripts/apenv-figures/unit-4.mjs --list   prints ids and sizes

   Style: white background, Arial/Helvetica, ink #1F2A28, course olive #474A10 for emphasis,
   Okabe-Ito blue #0072B2, green #009E73 and vermillion #D55E00 as second colors;
   role="img" with <title> and <desc>. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'environmental-science', 'figures');
const REG = join(ROOT, 'environmental-science', 'data', 'figures');
const INK = '#1F2A28', OLIVE = '#474A10', SOFT = '#D3D27F', TINT = '#EFF0DA', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GREY = '#6B7370', LIGHT = '#E9ECEB', SKY = '#E6F1F8', SEA = '#CFE3F1', SAND = '#F3ECDD', WARM = '#F6D9C6', BROWN = '#8A6A45';
const FONT = 'Arial, Helvetica, sans-serif';

/* ------------------------------------------------------------ toolkit */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = v => +(+v).toFixed(2);
function T(x, y, s, o = {}) {
  const a = o.anchor || 'start', sz = o.size || 13, w = o.weight || 'normal', fill = o.fill || INK;
  const halo = o.halo ? ` stroke="#FFFFFF" stroke-width="4" paint-order="stroke"` : '';
  const rot = o.rotate ? ` transform="rotate(${o.rotate} ${f(x)} ${f(y)})"` : '';
  return `<text x="${f(x)}" y="${f(y)}" font-size="${sz}" font-weight="${w}" fill="${fill}" text-anchor="${a}"${o.italic ? ' font-style="italic"' : ''}${halo}${rot}>${esc(s)}</text>`;
}
function TL(x, y, s, o = {}) { const lh = o.lh || (o.size || 13) * 1.25; return String(s).split('\n').map((l, i) => T(x, y + i * lh, l, o)).join(''); }
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}${o.arrow2 ? ` marker-start="url(#ar-${o.arrow2})"` : ''}/>`;
const R = (x, y, w, h, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}/>`;
const C = (x, y, r, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"/>`;
const E = (x, y, rx, ry, o = {}) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}${o.op ? ` opacity="${o.op}"` : ''} stroke-linejoin="round"/>`;
const poly = (pts, o = {}) => P('M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z', o);
const marker = (id, color) => `<marker id="ar-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker>`;
const DEFS = `<defs>${marker('ink', INK)}${marker('olive', OLIVE)}${marker('blue', BLUE)}${marker('green', GREEN)}${marker('verm', VERM)}${marker('grey', GREY)}</defs>`;

function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
${DEFS}<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}

const FIGS = [];
function fig(topic, id, w, h, title, alt, body) { FIGS.push({ topic, id, w, h, title, alt, body }); }

/* ------------------------------------------------- 4.1 plate tectonics */
{
  const parts = [];
  const sea = 120;
  // mantle and asthenosphere
  parts.push(R(20, 200, 540, 220, { fill: WARM }));
  parts.push(T(30, 410, 'Mantle', { size: 13, weight: 'bold', fill: BROWN }));
  // ocean water
  parts.push(R(20, sea, 395, 40, { fill: SEA }));
  parts.push(T(28, sea + 16, 'Ocean', { size: 12, fill: BLUE }));
  // left ocean plate (ridge at x=160)
  parts.push(poly([[20, 168], [150, 152], [160, 146], [160, 196], [20, 200]], { fill: SOFT, stroke: INK, w: 1.2 }));
  // right ocean plate, then subducting slab
  parts.push(poly([[160, 146], [170, 152], [395, 160], [410, 172], [470, 230], [530, 330], [500, 345], [440, 255], [395, 205], [160, 196]], { fill: SOFT, stroke: INK, w: 1.2 }));
  // continental plate with mountains and a volcano
  parts.push(poly([[412, 168], [440, 112], [455, 104], [470, 72], [482, 60], [494, 72], [510, 100], [530, 92], [548, 104], [560, 108], [560, 215], [470, 215], [430, 190]], { fill: '#D9C7A8', stroke: INK, w: 1.2 }));
  parts.push(poly([[470, 72], [482, 60], [494, 72]], { fill: VERM }));
  parts.push(T(560, 128, 'Continent', { size: 12, anchor: 'end', fill: BROWN, weight: 'bold' }));
  // trench
  parts.push(T(405, 186, 'Trench', { size: 11, anchor: 'end', halo: true }));
  // magma at the ridge and above the slab
  parts.push(L(160, 196, 160, 154, { stroke: VERM, w: 3, arrow: 'verm' }));
  parts.push(P('M478 252 C474 200 484 140 482 78', { stroke: VERM, w: 2.5, dash: '6 4', arrow: 'verm' }));
  // plate motion arrows
  parts.push(L(130, 140, 70, 140, { stroke: INK, w: 2, arrow: 'ink' }));
  parts.push(L(190, 140, 250, 140, { stroke: INK, w: 2, arrow: 'ink' }));
  parts.push(L(300, 148, 370, 150, { stroke: INK, w: 2, arrow: 'ink' }));
  parts.push(L(540, 232, 490, 232, { stroke: INK, w: 2, arrow: 'ink' }));
  // convection loops in the mantle
  parts.push(P('M172 392 C166 330 166 270 168 226', { stroke: OLIVE, w: 2.2, arrow: 'olive' }));
  parts.push(P('M188 220 C300 232 380 250 420 300', { stroke: OLIVE, w: 2.2, arrow: 'olive' }));
  parts.push(P('M412 362 C340 406 250 408 186 398', { stroke: OLIVE, w: 2.2, arrow: 'olive' }));
  parts.push(P('M148 220 C100 226 60 260 52 330', { stroke: OLIVE, w: 2.2, arrow: 'olive' }));
  parts.push(T(290, 300, 'Convection currents in the mantle', { size: 12, anchor: 'middle', fill: OLIVE, weight: 'bold', halo: true }));
  parts.push(T(290, 316, 'move the plates above them', { size: 12, anchor: 'middle', fill: OLIVE, halo: true }));
  // labels
  parts.push(T(30, 30, 'Divergent boundary', { size: 12, weight: 'bold' }));
  parts.push(TL(30, 45, 'plates move apart; magma rises\nand forms new crust (a ridge)', { size: 12 }));
  parts.push(L(120, 72, 156, 140, { stroke: GREY, w: 1 }));
  parts.push(T(250, 30, 'Convergent boundary', { size: 12, weight: 'bold' }));
  parts.push(TL(250, 45, 'the denser ocean plate sinks under the\ncontinent: a trench, earthquakes, volcanoes', { size: 12 }));
  parts.push(L(400, 72, 405, 160, { stroke: GREY, w: 1 }));
  parts.push(TL(296, 262, 'Subduction', { size: 12, weight: 'bold', fill: INK }));
  parts.push(T(500, 364, 'Sinking plate', { size: 11, anchor: 'middle', halo: true }));
  // transform boundary inset (map view)
  const ix = 590, iy = 60, iw = 155, ih = 250;
  parts.push(R(ix, iy, iw, ih, { fill: '#FFFFFF', stroke: INK, w: 1.2 }));
  parts.push(R(ix, iy + 34, iw / 2, ih - 34, { fill: SOFT }));
  parts.push(R(ix + iw / 2, iy + 34, iw / 2, ih - 34, { fill: '#D9C7A8' }));
  parts.push(L(ix + iw / 2, iy + 34, ix + iw / 2, iy + ih, { stroke: VERM, w: 2.5, dash: '7 4' }));
  parts.push(L(ix + 38, iy + 220, ix + 38, iy + 140, { stroke: INK, w: 2.2, arrow: 'ink' }));
  parts.push(L(ix + iw - 38, iy + 70, ix + iw - 38, iy + 150, { stroke: INK, w: 2.2, arrow: 'ink' }));
  parts.push(TL(ix + iw / 2, iy + 16, 'Transform boundary', { size: 12, weight: 'bold', anchor: 'middle' }));
  parts.push(TL(ix + iw / 2, iy + 29, '(seen from above)', { size: 11, anchor: 'middle' }));
  parts.push(TL(ix + iw / 2, iy + ih + 18, 'plates slide past each\nother: earthquakes,\nlittle volcanic activity', { size: 12, anchor: 'middle' }));
  const body = parts.join('\n');
  fig('plate-tectonics', 'plate-tectonics-boundaries', 760, 440, 'Plate boundaries and mantle convection',
    'A cross-section of Earth\'s outer layers. Convection currents in the hot mantle move the rigid plates above them. On the left, at a divergent boundary, two ocean plates move apart and magma rises to form new crust at a mid-ocean ridge. In the middle, at a convergent boundary, a dense ocean plate sinks under a continent (subduction), forming a deep trench; the sinking plate melts and magma rises to form a volcano in a mountain range on the continent. An inset seen from above shows a transform boundary, where two plates slide past each other in opposite directions along a fault, causing earthquakes with little volcanic activity.', body);
}

/* ------------------------------------------------- 4.2 soil horizons */
{
  const parts = [];
  const x = 40, w = 200;
  const bands = [
    ['O', 70, 100, '#3B2A1A', 'O horizon', 'fallen leaves and other organic\nmatter, decaying into humus'],
    ['A', 100, 175, '#5B4128', 'A horizon (topsoil)', 'humus mixed with minerals;\nmost roots and soil organisms'],
    ['B', 175, 265, '#9A6B3F', 'B horizon (subsoil)', 'clay, iron and other minerals\nleached down from above collect here'],
    ['C', 265, 345, '#C7A87F', 'C horizon', 'chunks of partly weathered\nparent material'],
    ['R', 345, 420, '#9AA09D', 'Bedrock (parent material)', 'the solid rock the soil\nslowly forms from'],
  ];
  for (const [k, y0, y1, col, name, note] of bands) {
    parts.push(R(x, y0, w, y1 - y0, { fill: col }));
    parts.push(T(x + w / 2, (y0 + y1) / 2 + 6, k, { size: 18, weight: 'bold', anchor: 'middle', fill: k === 'C' || k === 'R' ? INK : '#FFFFFF' }));
    parts.push(L(x + w + 4, (y0 + y1) / 2, x + w + 26, (y0 + y1) / 2, { stroke: GREY, w: 1 }));
    parts.push(T(x + w + 32, (y0 + y1) / 2 - 8, name, { size: 13, weight: 'bold' }));
    parts.push(TL(x + w + 32, (y0 + y1) / 2 + 8, note, { size: 12 }));
  }
  // rock fragments in C and cracks in R
  for (const [cx, cy, r] of [[70, 290, 9], [100, 325, 10], [185, 285, 8], [210, 330, 10], [70, 335, 6], [175, 318, 7]]) parts.push(E(cx, cy, r * 1.4, r, { fill: '#8E8F86', stroke: INK, w: 0.8 }));
  for (const [x1, y1, x2, y2] of [[60, 360, 90, 400], [150, 350, 130, 410], [200, 370, 225, 405]]) parts.push(L(x1, y1, x2, y2, { stroke: '#5F6563', w: 1.2 }));
  // roots
  parts.push(P('M90 70 C92 100 84 130 96 160 M150 70 C148 105 156 135 148 170 M200 70 C202 95 194 120 204 140', { stroke: '#D8C3A0', w: 1.6 }));
  // plants on top
  for (const px of [60, 90, 120, 150, 180, 210]) parts.push(P(`M${px} 70 L${px - 6} 50 M${px} 70 L${px} 44 M${px} 70 L${px + 7} 52`, { stroke: GREEN, w: 2.2 }));
  // process arrows on the left
  parts.push(L(24, 400, 24, 290, { stroke: OLIVE, w: 2.5, arrow: 'olive' }));
  parts.push(T(16, 345, 'Weathering of rock', { size: 11, anchor: 'middle', rotate: -90, fill: OLIVE }));
  parts.push(T(140, 30, 'Organic matter added from above', { size: 12, anchor: 'middle', fill: GREEN, weight: 'bold' }));
  parts.push(T(x + w / 2, 446, 'Soil forms slowly: often centuries for a few centimeters', { size: 12, anchor: 'start', italic: true, fill: GREY }).replace(`x="${f(x + w / 2)}"`, `x="${x}"`));
  fig('soil-formation', 'soil-formation-horizons', 560, 460, 'Soil horizons in a soil profile',
    'A soil profile cut straight down. At the top, plants grow and drop leaves. The O horizon is a thin dark layer of fallen leaves and organic matter decaying into humus. The A horizon, or topsoil, is dark: humus mixed with minerals, where most roots and soil organisms live. The B horizon, or subsoil, is lighter brown and collects clay, iron and other minerals leached down from above. The C horizon holds chunks of partly weathered parent material. At the bottom is bedrock, the parent material the soil slowly forms from. An arrow shows weathering breaking rock into smaller pieces from below, while organic matter is added from above. Soil forms slowly, often taking centuries for a few centimeters.', parts.join('\n'));
}

/* ---------------------------------------- 4.3 the soil texture triangle */
// USDA texture classes as [clay, silt, sand] vertices (each sums to 100).
export const CLASSES = [
  ['Clay', [[100, 0, 0], [60, 40, 0], [40, 40, 20], [40, 15, 45], [55, 0, 45]]],
  ['Silty clay', [[60, 40, 0], [40, 60, 0], [40, 40, 20]]],
  ['Sandy clay', [[55, 0, 45], [40, 15, 45], [35, 20, 45], [35, 0, 65]]],
  ['Clay loam', [[40, 40, 20], [27, 53, 20], [27, 28, 45], [40, 15, 45]]],
  ['Silty clay loam', [[40, 60, 0], [27, 73, 0], [27, 53, 20], [40, 40, 20]]],
  ['Sandy clay loam', [[35, 20, 45], [27, 28, 45], [20, 28, 52], [20, 0, 80], [35, 0, 65]]],
  ['Loam', [[27, 28, 45], [27, 50, 23], [7, 50, 43], [7, 41, 52], [20, 28, 52]]],
  ['Silt loam', [[27, 50, 23], [27, 73, 0], [12, 88, 0], [12, 80, 8], [0, 80, 20], [0, 50, 50], [7, 50, 43]]],
  ['Silt', [[12, 88, 0], [0, 100, 0], [0, 80, 20], [12, 80, 8]]],
  ['Sandy loam', [[20, 28, 52], [7, 41, 52], [7, 50, 43], [0, 50, 50], [0, 30, 70], [15, 0, 85], [20, 0, 80]]],
  ['Loamy sand', [[15, 0, 85], [0, 30, 70], [0, 15, 85], [10, 0, 90]]],
  ['Sand', [[10, 0, 90], [0, 15, 85], [0, 0, 100]]],
];
/* The class of a sample [clay, silt, sand], by point-in-polygon on the
   triangle's own coordinates (so the figure and the key agree). */
export function textureClass(clay, silt, sand) {
  const p = tri(clay, silt, sand);
  for (const [name, vs] of CLASSES) {
    const q = vs.map(v => tri(...v));
    let inside = false;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
      const [xi, yi] = q[i], [xj, yj] = q[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return name;
  }
  return null;
}
const TRI = { bl: [90, 470], br: [530, 470] };
TRI.top = [(TRI.bl[0] + TRI.br[0]) / 2, TRI.bl[1] - (TRI.br[0] - TRI.bl[0]) * Math.sqrt(3) / 2];
function tri(clay, silt, sand) {
  return [0, 1].map(k => (sand * TRI.bl[k] + silt * TRI.br[k] + clay * TRI.top[k]) / 100);
}
const CENTERS = { 'Clay': [58, 20, 22], 'Silty clay': [47, 46, 7], 'Sandy clay': [42, 7, 51], 'Clay loam': [34, 34, 32], 'Silty clay loam': [34, 56, 10], 'Sandy clay loam': [27, 13, 60], 'Loam': [17, 40, 43], 'Silt loam': [14, 66, 20], 'Silt': [5, 89, 6], 'Sandy loam': [9, 25, 66], 'Loamy sand': [5, 11, 84], 'Sand': [2, 4, 94] };
export const SAMPLES = [['A', 22, 8, 70], ['B', 20, 40, 40], ['C', 60, 30, 10], ['D', 6, 74, 20]];
// Where class names sit when samples are marked, so no dot covers a name.
const MOVED = { 'Sandy clay loam': [31, 17, 52], 'Loam': [11, 44, 45], 'Silt loam': [20, 58, 22] };
function textureTriangle(samples) {
  const parts = [];
  const pt = (c, s, d) => tri(c, s, d);
  // light grid every 10%
  for (let v = 10; v < 100; v += 10) {
    const a = pt(v, 0, 100 - v), b = pt(v, 100 - v, 0); parts.push(L(a[0], a[1], b[0], b[1], { stroke: LIGHT, w: 1 }));
    const c = pt(0, v, 100 - v), d = pt(100 - v, v, 0); parts.push(L(c[0], c[1], d[0], d[1], { stroke: LIGHT, w: 1 }));
    const e = pt(0, 100 - v, v), g = pt(100 - v, 0, v); parts.push(L(e[0], e[1], g[0], g[1], { stroke: LIGHT, w: 1 }));
  }
  for (const [name, vs] of CLASSES) parts.push(poly(vs.map(v => pt(...v)), { fill: name === 'Loam' ? TINT : 'none', stroke: INK, w: 1.3 }));
  parts.push(poly([TRI.bl, TRI.br, TRI.top], { stroke: INK, w: 2 }));
  for (const [name, c0] of Object.entries(CENTERS)) {
    const c = samples && MOVED[name] ? MOVED[name] : c0;
    const [x, y] = pt(...c);
    const two = name === 'Silty clay loam' ? ['Silty clay', 'loam'] : name === 'Sandy clay loam' ? ['Sandy clay', 'loam'] : [name];
    two.forEach((t, i) => parts.push(T(x, y + 4 + (i - (two.length - 1) / 2) * 13, t, { size: 11.5, anchor: 'middle', weight: name === 'Loam' ? 'bold' : 'normal', fill: name === 'Loam' ? OLIVE : INK, halo: !!samples })));
  }
  // ticks and numbers
  for (let v = 0; v <= 100; v += 10) {
    const [cx, cy] = pt(v, 0, 100 - v); parts.push(T(cx - 8, cy + 4, String(v), { size: 11, anchor: 'end', fill: GREY }));
    const [sx, sy] = pt(100 - v, v, 0); parts.push(T(sx + 8, sy + 4, String(v), { size: 11, anchor: 'start', fill: GREY }));
    const [dx, dy] = pt(0, 100 - v, v); parts.push(T(dx, dy + 18, String(v), { size: 11, anchor: 'middle', fill: GREY }));
  }
  const ml = pt(50, 0, 50), mr = pt(50, 50, 0), mb = pt(0, 50, 50);
  parts.push(T(ml[0] - 40, ml[1], 'Clay (%)', { size: 13, weight: 'bold', anchor: 'middle', rotate: -60 }));
  parts.push(T(mr[0] + 40, mr[1], 'Silt (%)', { size: 13, weight: 'bold', anchor: 'middle', rotate: 60 }));
  parts.push(T(mb[0], mb[1] + 38, 'Sand (%)', { size: 13, weight: 'bold', anchor: 'middle' }));
  // reading guide: which way each scale runs
  parts.push(TL(20, 30, 'Read each side in the direction its numbers rise:\nclay lines run across, silt lines slope down to the left,\nsand lines slope down to the right.', { size: 11.5, fill: GREY }));
  for (const [k, c, s, d] of samples || []) {
    const [x, y] = pt(c, s, d);
    parts.push(C(x, y, 6, { fill: VERM, stroke: '#FFFFFF', w: 1.5 }));
    parts.push(T(x - 10, y + 5, k, { size: 15, weight: 'bold', fill: VERM, halo: true, anchor: 'end' }));
  }
  return parts.join('\n');
}
fig('soil-properties', 'soil-properties-texture-triangle', 620, 530, 'The soil texture triangle',
  'The USDA soil texture triangle. Each side is a percent scale from 0 to 100: clay on the left side, silt on the right side, sand along the bottom. Lines of equal clay run across the triangle; lines of equal silt slope down to the left; lines of equal sand slope down to the right. The triangle is divided into twelve texture classes: clay at the top; silty clay, sandy clay, silty clay loam, clay loam and sandy clay loam below it; loam in the middle, shaded; silt loam and silt toward the bottom right; sandy loam, loamy sand and sand toward the bottom left. Loam is a balanced mix of sand, silt and clay, roughly 40% sand, 40% silt and 20% clay.',
  textureTriangle(null));
fig('soil-properties', 'soil-properties-samples', 620, 530, 'Four soil samples on the texture triangle',
  'The USDA soil texture triangle with four soil samples marked. Sample A: 70% sand, 8% silt, 22% clay, in the sandy clay loam class. Sample B: 40% sand, 40% silt, 20% clay, in the loam class. Sample C: 10% sand, 30% silt, 60% clay, in the clay class. Sample D: 20% sand, 74% silt, 6% clay, in the silt loam class. Invented samples for practice.',
  textureTriangle(SAMPLES));

/* ------------------------------------------------- 4.4 the atmosphere */
// U.S. Standard Atmosphere, 1976 (NOAA, NASA, U.S. Air Force): temperature at each layer
// boundary, altitude in km (geopotential), the mesopause rounded from 84.852 to 85 km.
export const STD_ATM = [[0, 15], [11, -56.5], [20, -56.5], [32, -44.5], [47, -2.5], [51, -2.5], [71, -58.5], [85, -86.3]];
{
  const parts = [];
  const X0 = 90, X1 = 640, Y0 = 470, Y1 = 40; // plot box
  const tx = t => X0 + (t + 100) / 220 * (X1 - X0); // -100..120 °C
  const ay = a => Y0 - a / 110 * (Y0 - Y1); // 0..110 km
  const bands = [[0, 11, 'Troposphere', '#EAF3EC', 'weather; cools with height'], [11, 50, 'Stratosphere', SKY, 'holds the ozone layer;\ntemperature rises with height'], [50, 85, 'Mesosphere', '#F1F1F7', 'temperature falls\nwith height again'], [85, 110, 'Thermosphere', WARM, 'very thin air;\ntemperature rises sharply']];
  for (const [a, b, name, col, note] of bands) parts.push(R(X0, ay(b), X1 - X0, ay(a) - ay(b), { fill: col }));
  // grid and ticks
  for (let t = -100; t <= 120; t += 20) { parts.push(L(tx(t), Y0, tx(t), Y1, { stroke: '#FFFFFF', w: 1 })); parts.push(T(tx(t), Y0 + 18, String(t).replace('-', '−'), { size: 11, anchor: 'middle' })); }
  for (let a = 0; a <= 110; a += 10) parts.push(T(X0 - 8, ay(a) + 4, String(a), { size: 11, anchor: 'end' }));
  for (const [a, b, name, col, note] of bands) {
    const top = name === 'Troposphere' ? ay(b) + 16 : ay(b) + 18;
    parts.push(T(X1 - 8, top, name, { size: 13, weight: 'bold', anchor: 'end' }));
    parts.push(TL(X1 - 8, top + 14, note, { size: 11, anchor: 'end', lh: 13 }));
  }
  // ozone layer band
  parts.push(R(X0 + 2, ay(35), 22, ay(15) - ay(35), { fill: BLUE, op: 0.35 }));
  parts.push(TL(X0 + 30, ay(25) - 2, 'Ozone layer\n(about 15-35 km)', { size: 11.5, fill: BLUE, weight: 'bold', halo: true }));
  parts.push(L(X0, Y0, X1, Y0, { w: 1.4 })); parts.push(L(X0, Y0, X0, Y1, { w: 1.4 }));
  parts.push(T((X0 + X1) / 2, Y0 + 40, 'Temperature (°C)', { size: 13, anchor: 'middle', weight: 'bold' }));
  parts.push(T(36, (Y0 + Y1) / 2, 'Altitude (km)', { size: 13, anchor: 'middle', weight: 'bold', rotate: -90 }));
  // the profile, from the data
  parts.push(P('M' + STD_ATM.map(([a, t]) => `${f(tx(t))} ${f(ay(a))}`).join(' L'), { stroke: OLIVE, w: 3 }));
  for (const [a, t] of STD_ATM) parts.push(C(tx(t), ay(a), 3.5, { fill: OLIVE }));
  parts.push(P(`M${f(tx(-86.3))} ${f(ay(85))} C${f(tx(-80))} ${f(ay(95))} ${f(tx(-40))} ${f(ay(102))} ${f(tx(5))} ${f(ay(108))}`, { stroke: OLIVE, w: 2.5, dash: '6 5', arrow: 'olive' }));
  parts.push(T(tx(15) + 8, ay(0) - 6, '15 °C at sea level', { size: 11, halo: true }));
  parts.push(T(tx(-56.5) - 8, ay(11) + 4, '−56.5 °C at 11 km', { size: 11, anchor: 'end', halo: true }));
  fig('atmosphere', 'atmosphere-layers', 680, 530, 'Layers of the atmosphere and how temperature changes with height',
    'A graph of temperature in degrees Celsius on the horizontal axis against altitude in kilometers on the vertical axis, with the four layers of the atmosphere shaded. Data from the U.S. Standard Atmosphere, 1976 (NOAA, NASA and the U.S. Air Force). In the troposphere, from the ground to about 11 km, temperature falls from 15 degrees at sea level to minus 56.5 degrees; this layer holds the weather. In the stratosphere, from about 11 to 50 km, temperature stays near minus 56.5 degrees and then rises to about minus 2.5 degrees, because the ozone layer, about 15 to 35 km up, absorbs ultraviolet light. In the mesosphere, from about 50 to 85 km, temperature falls again to about minus 86 degrees. In the thermosphere, above about 85 km, the thin air heats up sharply.', parts.join('\n'));
}

/* ------------------------------------------- 4.5 global wind patterns */
{
  const parts = [];
  const cx = 300, cy = 280, r = 215;
  const ly = lat => cy - r * Math.sin(lat * Math.PI / 180);
  const half = lat => r * Math.cos(lat * Math.PI / 180);
  parts.push(C(cx, cy, r, { fill: SKY, stroke: INK, w: 1.8 }));
  for (const lat of [-60, -30, 0, 30, 60]) {
    parts.push(L(cx - half(lat), ly(lat), cx + half(lat), ly(lat), { stroke: lat === 0 ? OLIVE : GREY, w: lat === 0 ? 2 : 1.2, dash: lat === 0 ? null : '5 4' }));
  }
  const latLab = { 60: '60° N', 30: '30° N', 0: 'Equator 0°', '-30': '30° S', '-60': '60° S' };
  for (const [lat, lab] of Object.entries(latLab)) parts.push(T(cx - half(+lat) - 6, ly(+lat) + 4, lab, { size: 11.5, anchor: 'end', weight: +lat === 0 ? 'bold' : 'normal' }));
  // surface winds: [lat center, dx, dy direction, label]
  const winds = [
    [75, -1, 0.55, 'Polar easterlies'], [45, 1, -0.55, 'Westerlies'], [15, -1, 0.55, 'Northeast trade winds'],
    [-15, -1, -0.55, 'Southeast trade winds'], [-45, 1, 0.55, 'Westerlies'], [-75, -1, -0.55, 'Polar easterlies'],
  ];
  for (const [lat, dx, dy, lab] of winds) {
    const y = ly(lat), w = half(lat) * 0.8;
    const xs = Math.abs(lat) > 70 ? [cx - 30, cx + 30] : [cx - w * 0.55, cx, cx + w * 0.55];
    for (const x of xs) parts.push(L(x - dx * 18, y - dy * 18, x + dx * 18, y + dy * 18, { stroke: lat > 30 || lat < -30 ? BLUE : VERM, w: 2.4, arrow: lat > 30 || lat < -30 ? 'blue' : 'verm' }));
    parts.push(T(cx, Math.abs(lat) > 70 ? (lat > 0 ? ly(90) - 8 : ly(-90) + 18) : y - 16, lab, { size: 12, anchor: 'middle', weight: 'bold', halo: true }));
  }
  // cells strip: x = height (left = surface)
  const sx0 = 560, sx1 = 650;
  const sy = lat => cy - r * lat / 90; // the side view spaces latitude evenly
  parts.push(L(sx0, sy(90) - 10, sx0, sy(-90) + 10, { stroke: GREY, w: 1 }));
  for (const lat of [90, 60, 30, 0, -30, -60, -90]) parts.push(T(sx0 - 6, sy(lat) + 4, (lat ? Math.abs(lat) + '°' : '0°'), { size: 10.5, anchor: 'end', fill: GREY }));
  parts.push(T(sx0, sy(-90) + 26, 'surface', { size: 10.5, anchor: 'middle', fill: GREY }));
  parts.push(T(sx1, sy(-90) + 26, 'upper air', { size: 10.5, anchor: 'middle', fill: GREY }));
  // a loop between lat a (start side) and b; dir: +1 surface flow from a to b
  function loop(a, b, name, col) {
    const ya = sy(a), yb = sy(b), pad = 9;
    const top = Math.min(ya, yb) + pad, bot = Math.max(ya, yb) - pad, l = sx0 + 10, rr = sx1;
    // surface (left side) flows from a toward b
    const s1 = ya < yb ? [l, top, l, bot] : [l, bot, l, top];
    const s2 = ya < yb ? [l, bot, rr, bot] : [l, top, rr, top]; // rising at b
    const s3 = ya < yb ? [rr, bot, rr, top] : [rr, top, rr, bot]; // aloft back toward a
    const s4 = ya < yb ? [rr, top, l, top] : [rr, bot, l, bot]; // sinking at a
    for (const s of [s1, s2, s3, s4]) parts.push(L(s[0], s[1], s[0] + (s[2] - s[0]) * 0.92, s[1] + (s[3] - s[1]) * 0.92, { stroke: col, w: 2.2, arrow: col === OLIVE ? 'olive' : col === GREEN ? 'green' : 'blue' }));
    parts.push(T((l + rr) / 2, (top + bot) / 2 + 4, name, { size: 11.5, anchor: 'middle', weight: 'bold', fill: col, halo: true }));
  }
  // surface flow: Hadley from 30 toward 0, Ferrel from 30 toward 60, polar from 90 toward 60
  loop(30, 0, 'Hadley', OLIVE); loop(-30, 0, 'Hadley', OLIVE);
  loop(30, 60, 'Ferrel', GREEN); loop(-30, -60, 'Ferrel', GREEN);
  loop(90, 60, 'Polar', BLUE); loop(-90, -60, 'Polar', BLUE);
  parts.push(T((sx0 + sx1) / 2, 22, 'Circulation cells', { size: 13, anchor: 'middle', weight: 'bold' }));
  parts.push(T((sx0 + sx1) / 2, 38, '(side view)', { size: 11, anchor: 'middle', fill: GREY }));
  const notes = [[60, 'rising air: wet'], [30, 'sinking air: dry,\nmany deserts'], [0, 'rising air: heavy\nrain, rainforests'], [-30, 'sinking air: dry,\nmany deserts'], [-60, 'rising air: wet']];
  for (const [lat, n] of notes) parts.push(TL(sx1 + 14, sy(lat) + 4 - (n.includes('\n') ? 7 : 0), n, { size: 11.5 }));
  fig('global-wind-patterns', 'global-wind-patterns-cells', 780, 560, 'Global wind patterns and circulation cells',
    'Earth with lines at the equator and at 30 and 60 degrees north and south. Surface winds in each band: between the equator and 30 degrees, the trade winds blow toward the equator and to the west (northeast trade winds in the north, southeast trade winds in the south); between 30 and 60 degrees, the westerlies blow from the west toward the poles; above 60 degrees, the polar easterlies blow from the east. A side view shows three circulation cells in each hemisphere: the Hadley cell, where air rises at the equator, moves toward the poles high up, sinks near 30 degrees and returns along the surface; the Ferrel cell between 30 and 60 degrees; and the polar cell between 60 degrees and the pole. Rising air at the equator and near 60 degrees brings rain; sinking air near 30 degrees is dry, where many deserts lie.', parts.join('\n'));
}

/* ------------------------------------------------- 4.6 watersheds */
{
  const parts = [];
  // left panel: map view
  parts.push(R(20, 40, 400, 380, { fill: '#F4F7EF', stroke: GREY, w: 1 }));
  parts.push(T(220, 30, 'Seen from above', { size: 13, anchor: 'middle', weight: 'bold' }));
  const divA = [[60, 90], [140, 60], [230, 70], [300, 110], [310, 190], [270, 260], [230, 330], [200, 350], [160, 330], [110, 270], [60, 200], [45, 140]];
  parts.push(poly(divA, { fill: TINT, stroke: OLIVE, w: 2.5, dash: '9 5' }));
  parts.push(P('M300 110 L380 90 L405 180 L390 280 L330 340 L270 260', { stroke: OLIVE, w: 2.5, dash: '9 5' }));
  // streams
  parts.push(P('M110 110 C130 160 150 210 175 260 C185 290 192 320 200 350', { stroke: BLUE, w: 3 }));
  parts.push(P('M230 95 C220 150 200 200 182 268', { stroke: BLUE, w: 2 }));
  parts.push(P('M75 175 C110 205 140 235 168 248', { stroke: BLUE, w: 2 }));
  parts.push(P('M280 170 C250 210 210 250 186 285', { stroke: BLUE, w: 2 }));
  parts.push(P('M200 350 C205 370 210 385 215 400', { stroke: BLUE, w: 3.5 }));
  parts.push(E(230, 410, 70, 14, { fill: SEA, stroke: BLUE, w: 1.5 }));
  parts.push(T(300, 416, 'Lake', { size: 12, fill: BLUE, weight: 'bold' }));
  parts.push(P('M360 120 C355 170 345 220 340 290', { stroke: BLUE, w: 2 }));
  parts.push(P('M340 290 C350 320 370 340 395 360', { stroke: BLUE, w: 2, arrow: 'blue' }));
  // runoff arrows downslope
  for (const [x1, y1, x2, y2] of [[80, 120, 105, 140], [150, 90, 158, 120], [260, 140, 240, 165], [100, 240, 130, 245], [270, 230, 235, 240]]) parts.push(L(x1, y1, x2, y2, { stroke: GREY, w: 1.4, arrow: 'grey' }));
  parts.push(T(170, 180, 'Watershed A', { size: 14, weight: 'bold', anchor: 'middle', fill: OLIVE, halo: true }));
  parts.push(T(370, 220, 'Watershed B', { size: 12, weight: 'bold', anchor: 'middle', fill: OLIVE, halo: true, rotate: -80 }));
  parts.push(TL(230, 56, 'Divide (high ground)', { size: 12, weight: 'bold', fill: OLIVE, halo: true }));
  parts.push(TL(36, 300, 'Tributaries\njoin the main\nriver', { size: 11.5, fill: BLUE, halo: true }));
  parts.push(TL(120, 395, 'Outlet', { size: 12, weight: 'bold', halo: true }));
  parts.push(L(160, 391, 205, 383, { stroke: GREY, w: 1 }));
  // right panel: cross-section, watershed vs aquifer
  const x0 = 440;
  parts.push(T(x0 + 150, 30, 'Cut-away side view', { size: 13, anchor: 'middle', weight: 'bold' }));
  parts.push(P(`M${x0} 170 C${x0 + 60} 100 ${x0 + 100} 100 ${x0 + 140} 200 L${x0 + 160} 210 C${x0 + 200} 120 ${x0 + 240} 110 ${x0 + 300} 160 L${x0 + 300} 420 L${x0} 420 Z`, { fill: '#D9C7A8', stroke: INK, w: 1.2 }));
  parts.push(R(x0, 300, 300, 70, { fill: SEA }));
  for (let i = 0; i < 26; i++) parts.push(C(x0 + 8 + (i * 11.3) % 290, 312 + (i * 17) % 52, 2.2, { fill: BLUE }));
  parts.push(L(x0, 300, x0 + 300, 300, { stroke: BLUE, w: 1.5, dash: '6 4' }));
  parts.push(T(x0 + 296, 294, 'water table', { size: 11, anchor: 'end', fill: BLUE }));
  parts.push(R(x0, 370, 300, 50, { fill: '#9AA09D' }));
  parts.push(T(x0 + 150, 400, 'rock that water does not pass through', { size: 11, anchor: 'middle', fill: '#FFFFFF' }));
  parts.push(E(x0 + 150, 206, 14, 5, { fill: BLUE }));
  parts.push(T(x0 + 150, 226, 'stream', { size: 11, anchor: 'middle', fill: BLUE }));
  for (const x of [x0 + 40, x0 + 80, x0 + 220, x0 + 260]) parts.push(L(x, 60, x - 6, 85, { stroke: BLUE, w: 1.5 }));
  parts.push(T(x0 + 150, 76, 'rain', { size: 11, anchor: 'middle', fill: BLUE }));
  parts.push(L(x0 + 90, 130, x0 + 132, 196, { stroke: GREY, w: 1.6, arrow: 'grey' }));
  parts.push(T(x0 + 70, 120, 'runoff', { size: 11, anchor: 'middle', halo: true }));
  parts.push(L(x0 + 240, 150, x0 + 240, 290, { stroke: BLUE, w: 1.6, dash: '4 3', arrow: 'blue' }));
  parts.push(T(x0 + 246, 230, 'infiltration', { size: 11, halo: true }));
  parts.push(TL(x0 + 10, 338, 'Aquifer: water held underground\nin the pores of sand, gravel or rock', { size: 11.5, weight: 'bold', fill: '#0B4F7A' }));
  parts.push(TL(x0 + 150, 440, 'The watershed is the land surface that drains to the stream;\nthe aquifer is water stored below the ground.', { size: 11.5, anchor: 'middle', italic: true }));
  fig('watersheds', 'watersheds-divide-aquifer', 760, 470, 'A watershed, its divide, and an aquifer below',
    'Two panels. Seen from above: watershed A is outlined by a dashed line along its divide, the high ground that separates it from watershed B next door. Rain that falls inside the divide runs downhill as runoff into small tributaries, which join a main river that leaves the watershed at its outlet into a lake. Water falling on the far side of the divide drains to watershed B and flows somewhere else. A cut-away side view: rain falls on hills; runoff flows over the land surface into a stream; some water soaks in by infiltration down to the water table. Below the water table is an aquifer, water held underground in the pores of sand, gravel or rock, above a layer of rock that water does not pass through. The watershed is the land surface that drains to the stream; the aquifer is water stored below the ground.', parts.join('\n'));
}

/* ----------------------------------- 4.7 solar radiation and seasons */
{
  const parts = [];
  // panel (a): the same beam at two latitudes
  parts.push(T(180, 28, 'Why the equator gets more energy', { size: 13, anchor: 'middle', weight: 'bold' }));
  const ecx = 250, ecy = 230, er = 150;
  parts.push(P(`M${ecx} ${ecy - er} A${er} ${er} 0 0 0 ${ecx} ${ecy + er}`, { fill: '#DDEBD8', stroke: INK, w: 1.6 }));
  parts.push(L(ecx - er, ecy, ecx, ecy, { stroke: OLIVE, w: 1.5, dash: '5 4' }));
  parts.push(T(ecx - er + 6, ecy - 6, 'Equator', { size: 11, fill: OLIVE, weight: 'bold' }));
  // beam at equator: band of rays, height 40
  for (const dy of [-20, -10, 0, 10, 20]) parts.push(L(20, ecy + dy, ecx - er - 3, ecy + dy, { stroke: '#E69F00', w: 2, arrow: 'verm' }));
  parts.push(L(ecx - er, ecy - 20, ecx - er, ecy + 20, { stroke: VERM, w: 5 }));
  parts.push(TL(ecx - er + 10, ecy + 34, 'small area:\nconcentrated', { size: 11 }));
  // beam at 60°N: rays horizontal hit at y = ecy - er*sin60 ± spread
  const lat = 60 * Math.PI / 180;
  const hy = ecy - er * Math.sin(lat), hx = ecx - er * Math.cos(lat);
  for (const dy of [-20, -10, 0, 10, 20]) {
    const y = hy + dy, x = ecx - Math.sqrt(er * er - (ecy - y) ** 2);
    parts.push(L(20, y, x - 3, y, { stroke: '#E69F00', w: 2, arrow: 'verm' }));
  }
  const yA = hy - 20, yB = hy + 20;
  parts.push(P(`M${f(ecx - Math.sqrt(er * er - (ecy - yA) ** 2))} ${f(yA)} A${er} ${er} 0 0 0 ${f(ecx - Math.sqrt(er * er - (ecy - yB) ** 2))} ${f(yB)}`, { stroke: VERM, w: 5 }));
  parts.push(TL(hx + 30, hy + 4, 'same beam, larger\narea: spread out', { size: 11, halo: true }));
  parts.push(T(20, 370, 'Same sunlight, different area hit', { size: 11.5, italic: true, fill: GREY }));
  // panel (b): orbit and tilt
  parts.push(T(560, 28, 'Why there are seasons', { size: 13, anchor: 'middle', weight: 'bold' }));
  const ox = 560, oy = 210;
  parts.push(E(ox, oy, 150, 60, { stroke: GREY, w: 1.2, dash: '5 4' }));
  parts.push(C(ox, oy, 26, { fill: '#F2C14E', stroke: '#C99500', w: 1.5 }));
  parts.push(T(ox, oy + 4, 'Sun', { size: 12, anchor: 'middle', weight: 'bold' }));
  const tilt = 23.5 * Math.PI / 180;
  function earth(x, y, label, sub, lit) {
    const rr = 32;
    parts.push(C(x, y, rr, { fill: '#9CC3E0', stroke: INK, w: 1.3 }));
    // lit half faces the sun
    // the night half, away from the Sun
    parts.push(P(`M${x} ${y - rr} A${rr} ${rr} 0 0 ${lit} ${x} ${y + rr} Z`, { fill: '#2B3A55', op: 0.45 }));
    const dx = Math.sin(tilt) * (rr + 14), dy = Math.cos(tilt) * (rr + 14);
    parts.push(L(x - dx, y + dy, x + dx, y - dy, { stroke: INK, w: 2 }));
    parts.push(T(x + dx + 4, y - dy - 2, 'N', { size: 12, weight: 'bold' }));
    const ex = Math.cos(tilt) * rr, ey = Math.sin(tilt) * rr;
    parts.push(L(x - ex, y - ey, x + ex, y + ey, { stroke: OLIVE, w: 1.5, dash: '4 3' }));
    parts.push(TL(x, y + rr + 50, label, { size: 12, anchor: 'middle', weight: 'bold' }));
    parts.push(TL(x, y + rr + 65, sub, { size: 11, anchor: 'middle' }));
  }
  earth(ox - 150, oy, 'June', 'North Pole tilted toward\nthe Sun: northern summer', 0);
  earth(ox + 150, oy, 'December', 'North Pole tilted away\nfrom the Sun: northern winter', 1);
  parts.push(T(ox, oy - 90, 'The axis tilts 23.5° and keeps pointing the same way all year', { size: 11, anchor: 'middle', fill: GREY }));
  parts.push(T(ox, 380, 'Earth is a little closer to the Sun in early January,', { size: 11, anchor: 'middle', italic: true, fill: GREY }));
  parts.push(T(ox, 394, 'during northern winter: distance does not cause seasons.', { size: 11, anchor: 'middle', italic: true, fill: GREY }));
  fig('solar-radiation-seasons', 'solar-radiation-seasons-tilt', 800, 410, 'Insolation by latitude and the cause of the seasons',
    'Two panels. Left: two equal beams of sunlight reach Earth. At the equator the beam strikes head-on and lights a small area, so its energy is concentrated. At 60 degrees north the same beam strikes at a low angle and spreads over a larger area, so each square meter gets less energy. Right: Earth orbits the Sun with its axis tilted 23.5 degrees, always pointing the same way in space. In June the North Pole is tilted toward the Sun, so the Northern Hemisphere has summer: higher Sun, longer days. In December the North Pole is tilted away, so the Northern Hemisphere has winter. Earth is actually a little closer to the Sun in early January, during northern winter, so distance does not cause the seasons.', parts.join('\n'));
}

/* ------------------------------------------------- 4.8 rain shadow */
{
  const parts = [];
  parts.push(R(20, 290, 170, 70, { fill: SEA }));
  parts.push(T(105, 330, 'Ocean', { size: 13, anchor: 'middle', fill: BLUE, weight: 'bold' }));
  parts.push(P('M190 300 L270 270 L400 90 L470 200 L560 280 L740 300 L740 360 L190 360 Z', { fill: '#D9C7A8', stroke: INK, w: 1.3 }));
  // vegetation windward, sparse leeward
  for (const [x, y] of [[215, 290], [240, 280], [275, 262], [300, 228], [325, 192], [350, 158]]) parts.push(P(`M${x} ${y} l-8 0 l8 -22 l8 22 z`, { fill: GREEN }));
  for (const [x, y] of [[600, 285], [690, 293]]) parts.push(P(`M${x} ${y} l0 -14 m0 6 l-5 -4 m5 6 l5 -5`, { stroke: OLIVE, w: 2 }));
  // wind
  parts.push(L(30, 250, 150, 250, { stroke: INK, w: 3, arrow: 'ink' }));
  parts.push(TL(30, 232, 'Moist air from the ocean', { size: 12, weight: 'bold' }));
  // rising, cooling air
  parts.push(P('M170 245 C240 228 300 180 360 100 L388 66', { stroke: BLUE, w: 3, arrow: 'blue' }));
  parts.push(TL(60, 150, 'Air is pushed up the slope\nand cools; water vapor\ncondenses into clouds', { size: 12, fill: BLUE, weight: 'bold', halo: true }));
  // cloud and rain
  parts.push(P('M250 130 a22 22 0 0 1 40 -16 a26 26 0 0 1 48 6 a20 20 0 0 1 10 36 h-92 a18 18 0 0 1 -6 -26 z', { fill: '#E3E6E5', stroke: GREY, w: 1.2 }));
  for (const x of [262, 282, 302, 322]) parts.push(L(x, 164, x - 6, 190, { stroke: BLUE, w: 1.6 }));
  parts.push(T(250, 205, 'Heavy rain', { size: 12, anchor: 'middle', weight: 'bold', halo: true }));
  // sinking, warming air
  parts.push(P('M420 70 C480 120 540 200 640 250', { stroke: VERM, w: 3, arrow: 'verm' }));
  parts.push(TL(520, 120, 'Dry air sinks and warms', { size: 12, fill: VERM, weight: 'bold', halo: true }));
  parts.push(T(230, 385, 'Windward side: wet, forested', { size: 12.5, anchor: 'middle', weight: 'bold', fill: GREEN }));
  parts.push(T(620, 385, 'Leeward side: rain shadow, dry', { size: 12.5, anchor: 'middle', weight: 'bold', fill: VERM }));
  parts.push(T(470, 150, 'Mountain range', { size: 11.5, anchor: 'start', halo: true }));
  fig('geo-and-climate', 'geo-and-climate-rain-shadow', 760, 400, 'The rain shadow effect',
    'Moist air from the ocean blows toward a mountain range. On the windward side the air is pushed up the slope, so it cools; its water vapor condenses into clouds and falls as heavy rain, and the windward slope is green and forested. The air that crosses the peak has lost most of its water. On the leeward side it sinks and warms, so it is dry, and the land there is a rain shadow: a dry region, often a desert, with sparse plants.', parts.join('\n'));
}

/* ------------------------------------------- 4.9 El Niño and La Niña */
{
  const parts = [];
  const W = 760, PH = 236;
  const panels = [
    ['Normal year', 1, 0.35, 200, 'Trade winds push warm water west; upwelling off Peru brings up cold, nutrient-rich water.'],
    ['El Niño', 0.35, 0.75, 470, 'Trade winds weaken; warm water spreads east; upwelling off Peru weakens; the rain moves east.'],
    ['La Niña', 1.6, 0.22, 160, 'Trade winds strengthen; warm water is pushed farther west; stronger upwelling cools the east.'],
  ];
  panels.forEach(([name, wind, eastWarm, rainX, note], i) => {
    const y0 = 10 + i * (PH + 10), sea = y0 + 128, bot = y0 + PH - 22;
    parts.push(R(10, y0, W - 20, PH - 14, { fill: '#FFFFFF', stroke: LIGHT, w: 1 }));
    parts.push(T(20, y0 + 20, name, { size: 15, weight: 'bold', fill: name === 'El Niño' ? VERM : name === 'La Niña' ? BLUE : INK }));
    parts.push(T(110, y0 + 20, note, { size: 11.5, fill: GREY }));
    // land masses
    parts.push(R(10, sea - 10, 70, bot - sea + 10, { fill: '#D9C7A8' }));
    parts.push(TL(45, bot - 30, 'Australia,\nIndonesia', { size: 10.5, anchor: 'middle' }));
    parts.push(R(W - 80, sea - 22, 70, bot - sea + 22, { fill: '#D9C7A8' }));
    parts.push(TL(W - 45, bot - 30, 'South\nAmerica', { size: 10.5, anchor: 'middle' }));
    // ocean: cold below, warm layer on top whose thickness falls from west to east
    const xw = 80, xe = W - 80;
    parts.push(R(xw, sea, xe - xw, bot - sea, { fill: SEA }));
    const thickW = 52 - (wind > 1 ? -6 : wind < 0.5 ? 18 : 0), thickE = 50 * eastWarm;
    parts.push(P(`M${xw} ${sea} L${xe} ${sea} L${xe} ${sea + thickE} C${xe - 200} ${sea + thickE} ${xw + 250} ${sea + thickW} ${xw} ${sea + thickW} Z`, { fill: WARM, stroke: VERM, w: 1 }));
    parts.push(T(xw + 130, sea + 20, 'warm water', { size: 11, fill: VERM, weight: 'bold' }));
    parts.push(T(xe - 150, bot - 8, 'colder, deeper water', { size: 11, fill: BLUE }));
    // upwelling arrows off South America
    const up = wind;
    if (up > 0.5) for (const dx of [0, 18]) parts.push(L(xe - 20 - dx, bot - 6, xe - 20 - dx, sea + thickE + 4, { stroke: BLUE, w: 1 + up, arrow: 'blue' }));
    parts.push(T(xe - 30, sea + thickE + (up > 0.5 ? 26 : 18), up > 0.5 ? (up > 1.2 ? 'strong upwelling' : 'upwelling') : 'weak upwelling', { size: 10.5, anchor: 'end', fill: BLUE, halo: true }));
    // trade winds (westward)
    const len = 30 + 40 * wind;
    for (const x of [330, 470, 610]) parts.push(L(x, sea - 14, x - len, sea - 14, { stroke: INK, w: 1.5 + wind, arrow: 'ink' }));
    parts.push(T(560, sea - 24, wind > 1.2 ? 'strong trade winds' : wind < 0.5 ? 'weak trade winds' : 'trade winds', { size: 11, anchor: 'middle', weight: 'bold' }));
    // rising air and rain
    parts.push(P(`M${rainX - 30} ${y0 + 54} a14 14 0 0 1 26 -10 a16 16 0 0 1 30 4 a12 12 0 0 1 6 22 h-58 a11 11 0 0 1 -4 -16 z`, { fill: '#E3E6E5', stroke: GREY, w: 1 }));
    for (const dx of [-18, -6, 6, 18]) parts.push(L(rainX + dx, y0 + 74, rainX + dx - 4, y0 + 90, { stroke: BLUE, w: 1.4 }));
    parts.push(T(rainX + 34, y0 + 70, 'rising air, heavy rain', { size: 10.5, fill: BLUE, halo: true }));
  });
  fig('el-nino-la-nina', 'el-nino-la-nina-compare', 760, 750, 'Normal, El Niño and La Niña conditions in the equatorial Pacific',
    'Three cross-sections of the equatorial Pacific Ocean, with Australia and Indonesia on the left (west) and South America on the right (east). Normal year: moderate trade winds blow from east to west, warm surface water piles up in the west, and upwelling off Peru brings cold, nutrient-rich water to the surface; rain clouds sit over the western Pacific. El Niño: the trade winds weaken, warm water spreads east toward South America, upwelling off Peru weakens, and the rain moves east into the central and eastern Pacific. La Niña: the trade winds strengthen, warm water is pushed farther west, upwelling off South America strengthens, the eastern Pacific is colder than normal, and heavy rain falls over the far western Pacific.', parts.join('\n'));
}
{
  // a schematic map of sea surface temperature departures from average
  const parts = [];
  const W = 760, panelH = 230, mx0 = 60, mx1 = 730;
  const lon0 = 100, lon1 = 290, lat0 = -40, lat1 = 30;
  const geo = (lon, lat, y0) => [mx0 + (lon - lon0) / (lon1 - lon0) * (mx1 - mx0), y0 + 20 + (lat1 - lat) / (lat1 - lat0) * (panelH - 40)];
  const AUS = [[114, -22], [122, -17], [130, -12], [136, -12], [142, -11], [146, -19], [153, -25], [150, -37], [141, -38.5], [131, -31.5], [120, -34], [114, -34]];
  const NG = [[131, -1], [141, -3], [150, -6], [147, -10], [141, -9], [134, -4]];
  const BOR = [[109, 1.5], [113, 3], [117, 7], [119, 5], [118, 1], [116, -3.5], [111, -3]];
  const SUM = [[95.5, 5.5], [100, 2], [104, -1], [106, -6], [102, -4], [98, 0]];
  const JAVA = [[105, -6], [111, -6.5], [114.5, -8], [108, -8]];
  const AM = [[290, 30], [245, 30], [250, 25], [255, 20], [262, 17], [270, 14], [276, 9], [279, 8], [281, 2], [279.5, -3], [279, -6], [281, -10], [284, -14], [289, -18], [290, -18]];
  const maps = [['El Niño', VERM, 'Warmer than average', [[245, 0, 55, 9, 0.55], [245, 0, 38, 6, 0.75], [260, -2, 20, 4, 0.9]], [[140, 8, 20, 8, 0.3]]],
                ['La Niña', BLUE, 'Cooler than average', [[230, 0, 50, 7, 0.5], [235, 0, 32, 5, 0.75]], [[140, 5, 18, 8, 0.28]]]];
  maps.forEach(([name, col, lab, blobs, opp], i) => {
    const y0 = 30 + i * (panelH + 20);
    const [bx0, by0] = geo(lon0, lat1, y0), [bx1, by1] = geo(lon1, lat0, y0);
    parts.push(`<clipPath id="sst-clip-${i}"><rect x="${f(bx0)}" y="${f(by0)}" width="${f(bx1 - bx0)}" height="${f(by1 - by0)}"/></clipPath>`);
    parts.push(R(bx0, by0, bx1 - bx0, by1 - by0, { fill: SKY }));
    parts.push(`<g clip-path="url(#sst-clip-${i})">`);
    const other = col === VERM ? BLUE : VERM;
    for (const [lo, la, rlo, rla, op] of opp) { const [x, y] = geo(lo, la, y0); const [x2] = geo(lo + rlo, la, y0); const [, y2] = geo(lo, la - rla, y0); parts.push(E(x, y, x2 - x, y2 - y, { fill: other, op })); }
    for (const [lo, la, rlo, rla, op] of blobs) { const [x, y] = geo(lo, la, y0); const [x2] = geo(lo + rlo, la, y0); const [, y2] = geo(lo, la - rla, y0); parts.push(E(x, y, x2 - x, y2 - y, { fill: col, op })); }
    for (const shape of [AUS, NG, BOR, SUM, JAVA, AM]) parts.push(poly(shape.map(([lo, la]) => geo(lo, la, y0)), { fill: '#D9C7A8', stroke: INK, w: 1 }));
    parts.push('</g>');
    parts.push(R(bx0, by0, bx1 - bx0, by1 - by0, { stroke: GREY, w: 1 }));
    const [ex0, ey] = geo(lon0, 0, y0), [ex1] = geo(lon1, 0, y0);
    parts.push(L(ex0, ey, ex1, ey, { stroke: INK, w: 1, dash: '5 4' }));
    parts.push(T(ex0 + 6, ey - 5, 'Equator', { size: 11, halo: true }));
    const [dx, dy0] = geo(180, lat1, y0), [, dy1] = geo(180, lat0, y0);
    parts.push(L(dx, dy0, dx, dy1, { stroke: GREY, w: 1, dash: '2 4' }));
    parts.push(T(dx + 4, dy1 - 6, '180°', { size: 10.5, fill: GREY }));
    const [ax, ay] = geo(133, -25, y0); parts.push(T(ax, ay, 'Australia', { size: 11, anchor: 'middle' }));
    const [px, py] = geo(286, -8, y0); parts.push(T(px, py, 'Peru', { size: 11, anchor: 'middle' }));
    const [ix, iy] = geo(106, 10, y0); parts.push(T(ix, iy, 'Indonesia', { size: 11, anchor: 'start', halo: true }));
    parts.push(T(bx0 - 6, by0 + 14, name, { size: 15, weight: 'bold', fill: col, anchor: 'end', rotate: -90 }).replace(/x="[^"]+" y="[^"]+"/, `x="${f(bx0 - 14)}" y="${f((by0 + by1) / 2)}"`).replace(/rotate\([^)]*\)/, `rotate(-90 ${f(bx0 - 14)} ${f((by0 + by1) / 2)})`).replace('text-anchor="end"', 'text-anchor="middle"'));
    // legend
    parts.push(R(bx0 + 250, by0 + 8, 14, 14, { fill: VERM, op: 0.75 }));
    parts.push(T(bx0 + 270, by0 + 20, 'Warmer than average', { size: 11.5, halo: true }));
    parts.push(R(bx0 + 420, by0 + 8, 14, 14, { fill: BLUE, op: 0.75 }));
    parts.push(T(bx0 + 440, by0 + 20, 'Cooler than average', { size: 11.5, halo: true }));
  });
  parts.push(T(W / 2, 520, 'Schematic map: sea surface temperature compared with the long-term average (invented pattern for practice).', { size: 11, anchor: 'middle', italic: true, fill: GREY }));
  fig('el-nino-la-nina', 'el-nino-la-nina-sst-map', 760, 530, 'Pacific sea surface temperatures in El Niño and La Niña',
    'Two schematic maps of the tropical Pacific Ocean from Indonesia and Australia in the west to Peru in the east, with the equator and the 180 degree line marked. Colors show sea surface temperature compared with the long-term average. Top, El Niño: a long band of warmer than average water lies along the equator from the central Pacific east to the coast of Peru, warmest near South America; the far western Pacific is slightly cooler than average. Bottom, La Niña: a tongue of cooler than average water stretches west along the equator from near South America into the central Pacific; the far western Pacific is slightly warmer than average. Invented pattern for practice, not a real year.', parts.join('\n'));
}

/* ------------------------------------------------------------ write */
const list = process.argv.includes('--list');
if (list) { for (const g of FIGS) console.log(g.id, g.w, g.h); }
else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT, { recursive: true }); mkdirSync(REG, { recursive: true });
  const reg = {};
  for (const g of FIGS) {
    writeFileSync(join(OUT, `${g.id}.svg`), svg(g.id, g.w, g.h, g.title, g.alt, g.body));
    (reg[g.topic] = reg[g.topic] || {})[g.id] = { file: `figures/${g.id}.svg`, ext: 'svg', w: g.w, h: g.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: g.alt };
  }
  for (const [topic, r] of Object.entries(reg)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(r, null, 1) + '\n');
  console.log(`unit 4: ${FIGS.length} figures`);
}
