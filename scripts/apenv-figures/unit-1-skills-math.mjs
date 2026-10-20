/* AP® Environmental Science figures for Unit 1 and the "Math you need" chapter (author A).
   Every data figure is drawn from the numbers listed here, computed with ApEnvCalc where a
   number is calculated (the 10% rule, NPP, doubling), so a picture always shows the data it
   claims to show. Diagrams are drawn from coordinates.

     node scripts/apenv-figures/unit-1-skills-math.mjs          writes environmental-science/figures/<id>.svg
                                                                 and environmental-science/data/figures/<topic>.json
     node scripts/apenv-figures/unit-1-skills-math.mjs --list   prints ids and sizes

   Style: white background, Arial/Helvetica, ink #1F2A28, course olive #474A10 for emphasis,
   Okabe-Ito blue #0072B2, green #009E73 and vermillion #D55E00 as second colors;
   role="img" with <title> and <desc>. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Calc } from '../lib/apenv-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'environmental-science', 'figures');
const REG = join(ROOT, 'environmental-science', 'data', 'figures');
const INK = '#1F2A28', OLIVE = '#474A10', SOFT = '#D3D27F', TINT = '#EFF0DA', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GREY = '#6B7370', LIGHT = '#E9ECEB', SKY = '#E6F1F8', SAND = '#F3ECDD';
const FONT = 'Arial, Helvetica, sans-serif';

/* ------------------------------------------------------------ toolkit */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = v => +(+v).toFixed(2);
function T(x, y, s, o = {}) {
  const a = o.anchor || 'start', sz = o.size || 13, w = o.weight || 'normal', fill = o.fill || INK;
  const body = o.raw ? s : esc(s);
  return `<text x="${f(x)}" y="${f(y)}" font-size="${sz}" font-weight="${w}" fill="${fill}" text-anchor="${a}"${o.italic ? ' font-style="italic"' : ''}>${body}</text>`;
}
function TL(x, y, s, o = {}) { const lh = o.lh || (o.size || 13) * 1.25; return String(s).split('\n').map((l, i) => T(x, y + i * lh, l, o)).join(''); }
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const R = (x, y, w, h, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const C = (x, y, r, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"/>`;
const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
// a box with centered multi-line text
function box(x, y, w, h, text, o = {}) {
  const lines = String(text).split('\n'), sz = o.size || 13, lh = sz * 1.25;
  const y0 = y + h / 2 - (lines.length - 1) * lh / 2 + sz * 0.35;
  return R(x, y, w, h, { fill: o.fill || '#FFFFFF', stroke: o.stroke || INK, rx: o.rx ?? 8, w: o.w || 1.5 }) +
    lines.map((l, i) => T(x + w / 2, y0 + i * lh, l, { anchor: 'middle', size: sz, weight: i === 0 && o.bold !== false ? 'bold' : 'normal', fill: o.ink || INK })).join('');
}
// an arrow from (x1,y1) to (x2,y2) with a label at its middle (offset dx, dy)
function arrow(x1, y1, x2, y2, label, o = {}) {
  const c = o.color || INK, mk = o.mk || 'ink';
  let s = L(x1, y1, x2, y2, { stroke: c, w: o.w || 2, dash: o.dash, arrow: mk });
  if (label) s += TL((x1 + x2) / 2 + (o.dx || 0), (y1 + y2) / 2 + (o.dy || 0), label, { anchor: o.anchor || 'middle', size: o.size || 12, fill: o.lc || c, weight: o.weight || 'normal' });
  return s;
}
function svg(id, w, h, title, desc, body) {
  const marks = [['ink', INK], ['olive', OLIVE], ['blue', BLUE], ['green', GREEN], ['verm', VERM], ['grey', GREY]].map(([n, c]) =>
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
const fmt = v => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const sup = (base, p) => `${esc(base)}<tspan font-size="70%" dy="-6">${esc(p)}</tspan><tspan dy="6"> </tspan>`;

const figs = [];   // { topic, ...svg() }
const add = (topic, fig) => figs.push({ topic, ...fig });

/* ------------------------------------------- 1.1 species interactions */
{
  const rows = [
    ['Mutualism', '+', '+', 'Bees get nectar; flowers get pollinated'],
    ['Commensalism', '+', '0', 'Barnacles ride on a whale; the whale is unaffected'],
    ['Parasitism', '+', '−', 'A tick feeds on a deer and weakens it'],
    ['Predation', '+', '−', 'An owl catches and eats a mouse'],
    ['Competition', '−', '−', 'Two plant species shade each other for light'],
  ];
  const col = s => s === '+' ? GREEN : s === '−' ? VERM : GREY;
  let b = T(24, 34, 'How two species affect each other', { size: 16, weight: 'bold' });
  b += T(24, 70, 'Interaction', { weight: 'bold' }) + T(205, 70, 'Species 1', { weight: 'bold', anchor: 'middle' }) + T(290, 70, 'Species 2', { weight: 'bold', anchor: 'middle' }) + T(345, 70, 'Example', { weight: 'bold' });
  b += L(20, 80, 700, 80);
  rows.forEach((r, i) => {
    const y = 112 + i * 46;
    if (i % 2 === 0) b += R(20, y - 26, 680, 46, { fill: '#F6F7F2' });
    b += T(24, y + 2, r[0], { weight: 'bold', fill: i < 3 ? OLIVE : INK });
    for (const [k, x] of [[1, 205], [2, 290]]) b += C(x, y - 3, 14, { fill: col(r[k]) }) + T(x, y + 3, r[k], { anchor: 'middle', size: 17, weight: 'bold', fill: '#FFFFFF' });
    b += T(345, y + 2, r[3], { size: 13 });
  });
  b += T(24, 352, '+ helped    − harmed    0 not affected. Mutualism, commensalism and parasitism are the three kinds of symbiosis.', { size: 12, fill: GREY });
  add('intro-ecosystems', svg('intro-ecosystems-interactions', 720, 368, 'Species interactions and their effects',
    'A table of five interactions between two species, with + for helped, minus for harmed and 0 for not affected. Mutualism: + and +, bees and flowers. Commensalism: + and 0, barnacles on a whale. Parasitism: + and minus, a tick on a deer. Predation: + and minus, an owl eating a mouse. Competition: minus and minus, two plant species shading each other. Mutualism, commensalism and parasitism are the three kinds of symbiosis.', b));
}

/* ------------------------------------------- 1.2 biomes by climate */
{
  const W = 720, H = 470, x0 = 78, x1 = 700, y0 = 410, y1 = 40;
  const sx = t => x0 + (t + 15) / 45 * (x1 - x0), sy = p => y0 - p / 450 * (y0 - y1);
  const regions = [
    ['Tundra', -15, -5, 0, 100, '#D9E6EE'],
    ['Taiga', -5, 5, 25, 200, '#BFD8C7'],
    ['Desert', 5, 20, 0, 25, '#F3E3C2'],
    ['Temperate\ngrassland', 5, 13, 25, 75, '#E7EDB8'],
    ['Chaparral', 13, 20, 25, 75, '#E9D8B0'],
    ['Temperate\ndeciduous forest', 5, 20, 75, 200, '#C6E0B4'],
    ['Temperate\nrainforest', 5, 20, 200, 350, '#A9D2BE'],
    ['Desert', 20, 30, 0, 50, '#F3E3C2'],
    ['Savanna', 20, 30, 50, 150, '#EDE3A6'],
    ['Tropical\nrainforest', 20, 30, 200, 450, '#9CCB9F'],
  ];
  let b = '';
  for (const [name, a, z, lo, hi, fill] of regions) {
    b += R(sx(a), sy(hi), sx(z) - sx(a), sy(lo) - sy(hi), { fill, stroke: '#FFFFFF', w: 2 });
    const lines = name.split('\n'), cy = (sy(lo) + sy(hi)) / 2 - (lines.length - 1) * 7 + 4;
    b += TL((sx(a) + sx(z)) / 2, cy, name, { anchor: 'middle', size: 12, weight: 'bold', lh: 14 });
  }
  b += L(x0, y0, x1, y0) + L(x0, y0, x0, y1);
  for (let t = -15; t <= 30; t += 5) b += L(sx(t), y0, sx(t), y0 + 5) + T(sx(t), y0 + 20, String(t).replace('-', '−'), { anchor: 'middle', size: 12 });
  for (let p = 0; p <= 450; p += 50) b += L(x0 - 5, sy(p), x0, sy(p)) + T(x0 - 9, sy(p) + 4, String(p), { anchor: 'end', size: 12 });
  b += T((x0 + x1) / 2, y0 + 44, 'Average yearly temperature (°C)', { anchor: 'middle', weight: 'bold' });
  b += `<text transform="translate(22 ${f((y0 + y1) / 2)}) rotate(-90)" font-size="13" font-weight="bold" fill="${INK}" text-anchor="middle">Yearly precipitation (cm)</text>`;
  b += T(x0 + 8, y1 + 4, 'Simplified: real biomes overlap, and seasons matter too.', { size: 12, fill: GREY, italic: true });
  add('terrestrial-biomes', svg('terrestrial-biomes-climate', W, H, 'Terrestrial biomes by temperature and precipitation',
    'A simplified chart of biomes placed by average yearly temperature from minus 15 to 30 degrees Celsius and yearly precipitation from 0 to 450 centimeters. Tundra is coldest and dry. Taiga is cold with moderate precipitation. In the temperate band, desert is driest, then temperate grassland and chaparral, then temperate deciduous forest, then temperate rainforest at the wettest. In the warm band, desert is driest, savanna has moderate rain, and tropical rainforest is wettest, above 200 centimeters. Real biomes overlap, and seasons matter too.', b));
}

/* ------------------------------------------- 1.3 lake zones */
{
  const W = 720, H = 400;
  let b = R(0, 0, W, 92, { fill: SKY });
  // lake basin
  const basin = 'M 30 110 C 120 112 150 150 200 200 C 260 270 330 330 380 335 C 470 340 560 300 620 200 C 650 150 670 115 700 110 Z';
  b += P(basin, { fill: '#CFE6F3', stroke: BLUE, w: 2 });
  b += L(30, 110, 700, 110, { stroke: BLUE, w: 2.5 });
  // light limit (dashed)
  b += L(150, 200, 640, 200, { stroke: OLIVE, w: 1.8, dash: '7 5' });
  b += T(400, 216, 'Light reaches down to about here', { size: 12, fill: OLIVE, weight: 'bold' });
  // rooted plants in the littoral zone (left and right edges)
  for (const [x, y] of [[70, 113], [100, 118], [130, 128], [160, 148], [655, 140], [675, 125]]) b += P(`M ${x} ${y + 26} q -6 -14 0 -26 M ${x} ${y + 26} q 7 -14 1 -22`, { stroke: GREEN, w: 2.2 });
  // benthic bottom band
  b += P('M 200 200 C 260 270 330 330 380 335 C 470 340 560 300 620 200', { stroke: '#8C6D46', w: 7 });
  // labels
  b += box(36, 132, 112, 44, 'Littoral zone\nshallow, rooted plants', { size: 11, fill: '#FFFFFF', stroke: GREEN });
  b += box(300, 128, 160, 44, 'Limnetic zone\nopen, sunlit water', { size: 11, fill: '#FFFFFF', stroke: BLUE });
  b += box(310, 234, 150, 44, 'Profundal zone\ndeep, too dark for plants', { size: 11, fill: '#FFFFFF', stroke: INK });
  b += box(470, 340, 210, 44, 'Benthic zone\nthe bottom and its mud', { size: 11, fill: '#FFFFFF', stroke: '#8C6D46' });
  b += L(470, 350, 440, 330, { stroke: '#8C6D46', w: 1.5 });
  b += T(24, 30, 'Zones of a lake', { size: 16, weight: 'bold' }) + T(24, 52, 'Light and depth decide where plants and algae can grow.', { size: 12, fill: GREY });
  add('aquatic-biomes', svg('aquatic-biomes-lake-zones', W, H, 'The zones of a freshwater lake',
    'A cross-section of a lake. The littoral zone is the shallow edge where rooted plants grow. The limnetic zone is the open water near the surface where sunlight reaches. A dashed line marks the depth light reaches. Below it, the profundal zone is deep water too dark for plants to grow. The benthic zone is the bottom of the lake and its mud.', b));
}

/* ------------------------------------------- math: prefixes */
{
  const rows = [
    ['giga', 'G', '9', 'billion', '1,000,000,000'],
    ['mega', 'M', '6', 'million', '1,000,000'],
    ['kilo', 'k', '3', 'thousand', '1,000'],
    ['(base unit)', 'g, m, L, W', '0', 'one', '1'],
    ['centi', 'c', '−2', 'hundredth', '0.01'],
    ['milli', 'm', '−3', 'thousandth', '0.001'],
    ['micro', 'µ', '−6', 'millionth', '0.000001'],
  ];
  let b = T(24, 32, 'Metric prefixes and powers of ten', { size: 16, weight: 'bold' });
  const cols = [24, 150, 280, 400, 540];
  ['Prefix', 'Symbol', 'Power of ten', 'Scale word', 'Written out'].forEach((h, i) => { b += T(cols[i], 66, h, { weight: 'bold' }); });
  b += L(20, 76, 700, 76);
  rows.forEach((r, i) => {
    const y = 102 + i * 34;
    if (i === 3) b += R(20, y - 22, 680, 34, { fill: TINT });
    b += T(cols[0], y, r[0], { weight: 'bold', fill: i === 3 ? INK : OLIVE }) + T(cols[1], y, r[1]);
    b += T(cols[2], y, sup('10', r[2]), { raw: true }) + T(cols[3], y, r[3]) + T(cols[4], y, r[4]);
  });
  b += T(24, 352, 'Each step up the table is a larger unit: 1 kg = 1,000 g, so 2.5 kg = 2,500 g.', { size: 12, fill: GREY });
  add('math-sci-notation', svg('math-sci-notation-prefixes', 720, 368, 'Metric prefixes with powers of ten',
    'A table of metric prefixes. Giga, G, is 10 to the 9th, a billion. Mega, M, is 10 to the 6th, a million. Kilo, k, is 10 to the 3rd, a thousand. The base unit is 10 to the 0, one. Centi, c, is 10 to the minus 2, a hundredth. Milli, m, is 10 to the minus 3, a thousandth. Micro is 10 to the minus 6, a millionth. Example: 1 kilogram is 1,000 grams, so 2.5 kilograms is 2,500 grams.', b));
}

/* ------------------------------------------- 1.4 carbon cycle */
{
  const W = 760, H = 480;
  let b = '';
  const A = [280, 24, 200, 54], PL = [40, 170, 180, 58], SO = [40, 360, 180, 58], OC = [540, 170, 190, 58], SE = [540, 360, 190, 58], FF = [290, 360, 180, 58];
  b += box(...A, 'Atmosphere\nCO2 and methane', { fill: SKY, stroke: BLUE });
  b += box(...PL, 'Plants and animals\n(living things)', { fill: '#E4F2E9', stroke: GREEN });
  b += box(...SO, 'Soil and dead matter', { fill: SAND, stroke: '#8C6D46' });
  b += box(...OC, 'Ocean\ndissolved CO2, sea life', { fill: '#D7E9F5', stroke: BLUE });
  b += box(...SE, 'Ocean sediments and\nsedimentary rock', { fill: '#EDE7DC', stroke: GREY });
  b += box(...FF, 'Fossil fuels\ncoal, oil, natural gas', { fill: '#E9E6DA', stroke: INK });
  // atmosphere <-> living things
  b += arrow(300, 78, 160, 170, 'Photosynthesis', { color: GREEN, mk: 'green', dx: 16, dy: 16, anchor: 'start', weight: 'bold' });
  b += arrow(120, 170, 280, 66, 'Respiration', { color: INK, dx: -16, dy: -10, anchor: 'end', weight: 'bold' });
  // living things -> soil
  b += arrow(110, 228, 110, 360, 'Wastes and\ndead matter', { color: '#8C6D46', mk: 'ink', dx: -40, dy: -6 });
  // soil -> atmosphere (decomposition)
  b += arrow(200, 360, 330, 78, 'Decomposition', { color: '#8C6D46', mk: 'ink', dx: 52, dy: 64, weight: 'bold' });
  // fossil fuels -> atmosphere (combustion)
  b += arrow(390, 360, 390, 78, 'Combustion\n(burning\nfossil fuels)', { color: VERM, mk: 'verm', dx: 44, dy: 60, weight: 'bold' });
  // atmosphere <-> ocean
  b += arrow(480, 50, 620, 170, 'CO2 dissolves', { color: BLUE, mk: 'blue', dx: 62, dy: -20 });
  b += arrow(580, 170, 480, 72, 'CO2 released', { color: BLUE, mk: 'blue', dx: -6, dy: 34 });
  // ocean -> sediments
  b += arrow(635, 228, 635, 360, 'Sedimentation\n(shells and remains\nsettle and harden)', { color: GREY, mk: 'grey', dx: -10, dy: -24, anchor: 'end', dash: '7 5' });
  // soil -> fossil fuels (very slow)
  b += arrow(220, 400, 290, 400, '', { color: GREY, mk: 'grey', dash: '7 5' });
  b += TL(255, 440, 'buried for millions\nof years', { anchor: 'middle', size: 11, fill: GREY });
  b += T(24, 470, 'Solid arrows: fast exchanges (days to centuries). Dashed arrows: slow ones (thousands to millions of years).', { size: 12, fill: GREY });
  add('carbon-cycle', svg('carbon-cycle-reservoirs', W, H, 'The carbon cycle: reservoirs and fluxes',
    'Six carbon reservoirs: the atmosphere, plants and animals, soil and dead matter, the ocean, ocean sediments and sedimentary rock, and fossil fuels. Photosynthesis moves carbon from the atmosphere into living things; respiration returns it. Wastes and dead matter move carbon into the soil, and decomposition returns it to the atmosphere. Combustion of fossil fuels moves carbon to the atmosphere. CO2 dissolves into the ocean and is also released from it. Slow processes, shown dashed: sedimentation moves carbon from the ocean into sediments and rock, and buried dead matter becomes fossil fuels over millions of years.', b));
}

/* ------------------------------------------- 1.5 nitrogen cycle */
{
  const W = 760, H = 470;
  let b = '';
  const AT = [270, 20, 220, 54], AM = [60, 250, 190, 54], NI = [500, 250, 190, 54], PL = [500, 380, 190, 54], DE = [60, 380, 190, 54];
  b += box(...AT, 'Atmosphere\nN2 gas (78% of air)', { fill: SKY, stroke: BLUE });
  b += box(...AM, 'Ammonium (NH4+)\nin soil', { fill: SAND, stroke: '#8C6D46' });
  b += box(...NI, 'Nitrate (NO3−)\nin soil', { fill: SAND, stroke: '#8C6D46' });
  b += box(...PL, 'Plants, then the\nanimals that eat them', { fill: '#E4F2E9', stroke: GREEN });
  b += box(...DE, 'Wastes and dead matter,\nbroken down by decomposers', { fill: '#EDE7DC', stroke: GREY, size: 12 });
  b += arrow(300, 74, 160, 250, '1. Nitrogen fixation\nbacteria (in soil and\nlegume roots) turn\nN2 into ammonium', { color: OLIVE, mk: 'olive', dx: -66, dy: -26, weight: 'bold' });
  b += arrow(250, 277, 500, 277, '2. Nitrification\nbacteria turn ammonium\ninto nitrite, then nitrate', { color: OLIVE, mk: 'olive', dy: -40, weight: 'bold' });
  b += arrow(595, 304, 595, 380, '3. Assimilation\nroots take up nitrate\n(and ammonium)', { color: GREEN, mk: 'green', dx: 72, dy: -12, weight: 'bold' });
  b += arrow(500, 407, 250, 407, 'Wastes and remains', { color: GREY, mk: 'grey', dy: -8 });
  b += arrow(155, 380, 155, 304, '4. Ammonification\ndecomposers release\nammonium', { color: OLIVE, mk: 'olive', dx: -84, dy: -8, weight: 'bold' });
  b += arrow(630, 250, 470, 74, '5. Denitrification\nbacteria in soil with little\noxygen turn nitrate\nback into N2 gas', { color: VERM, mk: 'verm', dx: 108, dy: -26, weight: 'bold' });
  b += T(24, 460, 'Lightning also fixes a little nitrogen. Fertilizer adds ammonium and nitrate directly.', { size: 12, fill: GREY });
  add('nitrogen-cycle', svg('nitrogen-cycle-steps', W, H, 'The nitrogen cycle in five steps',
    'The nitrogen cycle. Nitrogen gas, N2, makes up 78 percent of the atmosphere. Step 1, nitrogen fixation: bacteria in soil and in legume roots turn N2 into ammonium. Step 2, nitrification: bacteria turn ammonium into nitrite and then nitrate. Step 3, assimilation: plant roots take up nitrate and ammonium, and animals get nitrogen by eating plants. Wastes and remains go to decomposers. Step 4, ammonification: decomposers release ammonium. Step 5, denitrification: bacteria in soil with little oxygen turn nitrate back into N2 gas. Lightning also fixes a little nitrogen, and fertilizer adds ammonium and nitrate directly.', b));
}

/* ------------------------------------------- 1.6 phosphorus cycle */
{
  const W = 760, H = 470;
  let b = '';
  const RK = [30, 40, 176, 58], SO = [290, 40, 200, 58], PL = [560, 40, 170, 58], WA = [290, 250, 200, 58], SE = [30, 380, 220, 58], PE = [560, 250, 170, 58];
  b += box(...RK, 'Rocks with phosphate', { fill: '#EDE7DC', stroke: GREY });
  b += box(...SO, 'Phosphate in soil', { fill: SAND, stroke: '#8C6D46' });
  b += box(...PL, 'Plants, then\nanimals', { fill: '#E4F2E9', stroke: GREEN });
  b += box(...WA, 'Phosphate in lakes,\nrivers and oceans', { fill: '#D7E9F5', stroke: BLUE });
  b += box(...SE, 'Ocean sediments', { fill: '#EDE7DC', stroke: GREY });
  b += box(...PE, 'People: fertilizer,\nmined phosphate', { fill: '#FBE9DF', stroke: VERM });
  b += arrow(206, 69, 290, 69, 'Weathering', { color: OLIVE, mk: 'olive', dy: -10, weight: 'bold' });
  b += arrow(490, 60, 560, 60, 'Taken up', { color: GREEN, mk: 'green', dy: -10 });
  b += arrow(560, 84, 490, 84, 'Wastes, remains,\ndecomposers', { color: GREY, mk: 'grey', dx: 6, dy: 24, size: 11 });
  b += arrow(390, 98, 390, 250, 'Washed off\nby rain', { color: BLUE, mk: 'blue', dx: -46, dy: 0 });
  b += arrow(330, 308, 200, 380, 'Sedimentation\n(settles to the bottom)', { color: GREY, mk: 'grey', dx: 88, dy: 22 });
  b += arrow(100, 380, 100, 98, 'Uplift over\nmillions of years', { color: GREY, mk: 'grey', dash: '7 5', dx: -52, dy: 30, size: 11 });
  b += arrow(560, 279, 490, 279, '', { color: VERM, mk: 'verm' });
  b += arrow(645, 250, 645, 98, 'Added to\nfarm soil', { color: VERM, mk: 'verm', dx: 44 });
  b += TL(500, 334, 'Farm water and wastewater carry\nextra phosphate into lakes;\nalgae then grow out of control.', { size: 12, fill: VERM });
  b += box(300, 400, 430, 50, 'No gas phase: phosphorus does not cycle through the air,\nso it moves slowly and is often a limiting nutrient.', { size: 12, fill: TINT, stroke: OLIVE, bold: false });
  add('phosphorus-cycle', svg('phosphorus-cycle-steps', W, H, 'The phosphorus cycle',
    'The phosphorus cycle has no gas phase. Weathering releases phosphate from rocks into soil. Plants take up phosphate and animals get it by eating plants; wastes, remains and decomposers return it to the soil. Rain washes phosphate from soil into lakes, rivers and oceans, where it settles as sediment. Over millions of years, uplift turns sediments back into rock on land. People add phosphate as fertilizer to farm soil, and water from farms and wastewater carries extra phosphate into lakes, where algae then grow out of control. Because phosphorus does not cycle through the air, it moves slowly and is often a limiting nutrient.', b));
}

/* ------------------------------------------- 1.7 water cycle */
{
  const W = 760, H = 470;
  let b = R(0, 0, W, 300, { fill: SKY });
  // sun
  b += C(700, 52, 26, { fill: '#F2C94C' });
  // land and ocean
  b += P('M 0 300 L 0 170 L 90 110 L 170 190 L 260 200 L 470 290 L 470 300 Z', { fill: '#C9DDB8', stroke: '#6B8F55' });
  b += R(470, 290, 290, 80, { fill: '#9CC9E6', stroke: BLUE });
  b += R(0, 300, 470, 70, { fill: SAND });
  b += R(0, 370, 760, 100, { fill: '#E3D3B5' });
  b += R(0, 392, 760, 50, { fill: '#BBD6EA' });
  b += T(16, 422, 'Aquifer: groundwater stored in the pores of rock and sediment', { size: 12, weight: 'bold', fill: '#0B4F7A' });
  // cloud
  b += P('M 300 70 a 26 26 0 0 1 48 -14 a 30 30 0 0 1 56 4 a 24 24 0 0 1 22 40 h -122 a 22 22 0 0 1 -4 -30 z', { fill: '#FFFFFF', stroke: GREY });
  b += T(370, 90, 'Condensation', { anchor: 'middle', size: 12, weight: 'bold' });
  // tree
  b += R(214, 168, 8, 30, { fill: '#7A5C3A' }) + C(218, 160, 18, { fill: GREEN });
  // arrows
  b += arrow(600, 280, 470, 108, 'Evaporation', { color: BLUE, mk: 'blue', dx: 70, dy: 10, weight: 'bold' });
  b += arrow(222, 138, 310, 104, 'Transpiration', { color: GREEN, mk: 'green', dx: -50, dy: -10, weight: 'bold' });
  b += arrow(130, 98, 120, 160, '', { color: BLUE, mk: 'blue' }) + arrow(160, 98, 150, 170, '', { color: BLUE, mk: 'blue' });
  b += T(40, 90, 'Precipitation', { size: 12, weight: 'bold', fill: BLUE });
  b += P('M 280 214 Q 380 250 460 284', { stroke: BLUE, w: 2.2, arrow: 'blue' });
  b += T(330, 228, 'Runoff', { size: 12, weight: 'bold', fill: BLUE });
  b += arrow(110, 230, 110, 392, 'Infiltration', { color: BLUE, mk: 'blue', dx: 44, dy: 30, weight: 'bold' });
  b += arrow(300, 410, 470, 410, 'Groundwater flows slowly', { color: '#0B4F7A', mk: 'blue', dy: -6, size: 11 });
  b += T(610, 336, 'Ocean', { anchor: 'middle', weight: 'bold', fill: '#0B4F7A' });
  b += T(24, 460, 'The sun drives evaporation; gravity pulls water down as precipitation, runoff and infiltration.', { size: 12, fill: INK });
  add('water-cycle', svg('water-cycle-diagram', W, H, 'The hydrologic (water) cycle',
    'The water cycle. The sun drives evaporation from the ocean and transpiration from plants. Water vapor cools and condenses into clouds. Precipitation falls on land. Some water flows over the surface as runoff to the ocean. Some soaks into the ground by infiltration and becomes groundwater, stored in an aquifer, a layer of rock and sediment whose pores hold water; groundwater flows slowly toward the ocean.', b));
}

/* ------------------------------------------- math: per person */
{
  const towns = [['Town A', 30000, 4500000], ['Town B', 8000, 2000000]];
  const per = towns.map(t => Calc.evaluate({ fn: 'perCapita', args: [t[2], t[1]] }));
  const W = 720, H = 384;
  let b = T(24, 32, 'Total water use vs water use per person', { size: 16, weight: 'bold' });
  // left chart: total (millions of L/day), right: per person
  const panel = (x0, title, vals, max, fmtV, unit) => {
    let s = T(x0 + 130, 66, title, { anchor: 'middle', weight: 'bold' });
    const base = 300, top = 90, sy = v => base - v / max * (base - top);
    s += L(x0, base, x0 + 260, base);
    vals.forEach((v, i) => {
      const x = x0 + 40 + i * 120;
      s += R(x, sy(v), 70, base - sy(v), { fill: i ? BLUE : OLIVE });
      s += T(x + 35, sy(v) - 8, fmtV(v), { anchor: 'middle', weight: 'bold' });
      s += T(x + 35, base + 20, towns[i][0], { anchor: 'middle' });
    });
    s += T(x0 + 130, base + 42, unit, { anchor: 'middle', size: 12, fill: GREY });
    return s;
  };
  b += panel(40, 'Total use', towns.map(t => t[2]), 5000000, v => (v / 1e6) + ' million L', 'liters per day');
  b += panel(400, 'Use per person', per, 300, v => fmt(v) + ' L', 'liters per person per day');
  b += T(24, 376, `Town A: ${fmt(towns[0][1])} people. Town B: ${fmt(towns[1][1])} people. Invented data for practice.`, { size: 12, fill: GREY });
  add('math-rates', svg('math-rates-per-person', W, H, 'Total water use compared with use per person',
    `Two bar charts from invented data. Total use: Town A uses 4.5 million liters a day and Town B 2 million liters a day, so Town A uses more in total. Use per person: Town A has 30,000 people, so 4,500,000 divided by 30,000 is ${fmt(per[0])} liters per person per day; Town B has 8,000 people, so 2,000,000 divided by 8,000 is ${fmt(per[1])} liters per person per day. Town B uses more per person.`, b));
}

/* ------------------------------------------- math: units cancel */
{
  const kwh = Calc.evaluate({ fn: 'chain', args: [30, 'day', [[6, 'h', 1, 'day'], [2, 'kW', 1, '']]], pick: 'value' });
  const cost = Calc.evaluate({ fn: 'mul', args: [kwh, 0.15] });
  const W = 720, H = 300;
  let b = T(24, 32, 'Dimensional analysis: units cancel like numbers', { size: 16, weight: 'bold' });
  b += T(24, 56, 'A water pump runs 6 hours a day for 30 days and draws 2 kW. Electricity costs $0.15 per kWh.', { size: 12, fill: GREY });
  // units in a tspan with a line through them cancel
  const X = u => `<tspan fill="${VERM}" text-decoration="line-through">${esc(u)}</tspan>`;
  const frac = (x, top, bot) => T(x, 120, top, { anchor: 'middle', size: 18, raw: true }) + L(x - 46, 132, x + 46, 132, { w: 1.8 }) + T(x, 158, bot, { anchor: 'middle', size: 18, raw: true });
  b += frac(80, '30 ' + X('days'), '1');
  b += T(140, 140, '×', { anchor: 'middle', size: 20 });
  b += frac(200, '6 h', '1 ' + X('day'));
  b += T(260, 140, '×', { anchor: 'middle', size: 20 });
  b += frac(320, '2 kW', '1');
  b += T(385, 140, '=', { anchor: 'middle', size: 20 });
  b += T(400, 145, `${fmt(kwh)} kWh`, { size: 20, weight: 'bold', fill: OLIVE });
  b += T(80, 208, 'Then the cost:', { size: 14, weight: 'bold' });
  b += T(200, 208, `${fmt(kwh)} ${X('kWh')} × $0.15 / 1 ${X('kWh')} = $${fmt(cost)}`, { size: 16, raw: true });
  b += T(24, 262, 'Write each factor as a fraction, with the unit you want to remove on the opposite side.', { size: 12, fill: INK });
  b += T(24, 284, 'Units with a line through them cancel; h × kW is left, which is kWh.', { size: 12, fill: VERM });
  add('math-units', svg('math-units-chain', W, H, 'A dimensional analysis chain with units that cancel',
    `A pump runs 6 hours a day for 30 days and draws 2 kilowatts. The chain is 30 days over 1, times 6 hours over 1 day, times 2 kilowatts. Days cancel, and hours times kilowatts gives kilowatt-hours: ${fmt(kwh)} kWh. Then ${fmt(kwh)} kWh times $0.15 per kWh, with kWh cancelling, is $${fmt(cost)}.`, b));
}

/* ------------------------------------------- math: percent change */
{
  const oldV = 120, newV = 150, pc = Calc.evaluate({ fn: 'percentChange', args: [oldV, newV] });
  const W = 720, H = 300;
  let b = T(24, 32, 'Percent change: the change compared with where you started', { size: 16, weight: 'bold' });
  const x0 = 60, sx = v => x0 + v / 160 * 560;
  b += R(x0, 70, sx(oldV) - x0, 40, { fill: OLIVE }) + T(x0 + 8, 96, `2020: ${oldV} frogs (old value)`, { fill: '#FFFFFF', weight: 'bold' });
  b += R(x0, 124, sx(newV) - x0, 40, { fill: BLUE }) + T(x0 + 8, 150, `2024: ${newV} frogs (new value)`, { fill: '#FFFFFF', weight: 'bold' });
  b += L(sx(oldV), 66, sx(oldV), 176, { dash: '5 4', stroke: GREY });
  b += P(`M ${f(sx(oldV))} 178 v 8 h ${f(sx(newV) - sx(oldV))} v -8`, { stroke: VERM, w: 2 });
  b += T((sx(oldV) + sx(newV)) / 2, 204, `change = ${newV - oldV}`, { anchor: 'middle', fill: VERM, weight: 'bold' });
  b += T(60, 248, `(${newV} − ${oldV}) / ${oldV} × 100 = ${pc}%`, { size: 20, weight: 'bold' });
  b += T(60, 278, 'Brackets first, divide by the OLD value, then × 100. Invented data for practice.', { size: 12, fill: GREY });
  add('math-percents', svg('math-percents-change', W, H, 'Percent change from an old value to a new value',
    `Two bars from invented data: 120 frogs in 2020, the old value, and 150 frogs in 2024, the new value. The change is 30. Percent change is (150 minus 120) divided by 120, times 100, which is ${pc} percent: subtract in brackets first, divide by the old value, then multiply by 100.`, b));
}

/* ------------------------------------------- 1.8 GPP, respiration, NPP */
{
  const gpp = 12000, r = 7000, npp = Calc.evaluate({ fn: 'npp', args: [gpp, r] });
  const W = 720, H = 300, x0 = 40, sx = v => x0 + v / gpp * 640;
  let b = T(24, 32, 'Where the energy plants capture goes', { size: 16, weight: 'bold' });
  b += T(24, 54, 'A grassland, in kcal per square meter per year. Invented data for practice.', { size: 12, fill: GREY });
  b += R(x0, 80, 640, 44, { fill: OLIVE }) + T(x0 + 10, 108, `Gross primary productivity (GPP): ${fmt(gpp)}`, { fill: '#FFFFFF', weight: 'bold' });
  b += R(x0, 150, sx(r) - x0, 44, { fill: GREY }) + T(x0 + 10, 178, `Respiration (R): ${fmt(r)}`, { fill: '#FFFFFF', weight: 'bold' });
  b += R(sx(r), 150, sx(gpp) - sx(r), 44, { fill: GREEN }) + T(sx(r) + 10, 178, `NPP: ${fmt(npp)}`, { fill: '#FFFFFF', weight: 'bold' });
  b += TL(x0, 222, 'used by the plants themselves to stay alive\n(released as heat)', { size: 12, fill: GREY });
  b += TL(sx(r) + 4, 222, 'stored as new plant matter, the energy\navailable to the animals that eat plants', { size: 12, fill: GREEN });
  b += T(x0, 282, `NPP = GPP − R = ${fmt(gpp)} − ${fmt(r)} = ${fmt(npp)} kcal/m²/yr`, { size: 16, weight: 'bold' });
  add('primary-productivity', svg('primary-productivity-gpp-npp', W, H, 'Gross primary productivity split into respiration and NPP',
    `Invented data for a grassland in kilocalories per square meter per year. Gross primary productivity, GPP, is ${fmt(gpp)}. Of that, ${fmt(r)} is used by the plants in respiration to stay alive. The rest, net primary productivity, NPP, is ${fmt(gpp)} minus ${fmt(r)} = ${fmt(npp)}, stored as new plant matter and available to the animals that eat plants.`, b));
}

/* ------------------------------------------- 1.9 trophic levels */
{
  const levels = [
    ['Trophic level 1: producers', 'Grass', 'make their own food by photosynthesis', GREEN],
    ['Trophic level 2: primary consumers', 'Grasshopper', 'herbivores: eat producers', OLIVE],
    ['Trophic level 3: secondary consumers', 'Frog', 'eat primary consumers', BLUE],
    ['Trophic level 4: tertiary consumers', 'Snake', 'eat secondary consumers', '#5A4A8A'],
    ['Top: apex predator', 'Hawk', 'eats snakes; nothing hunts it', VERM],
  ];
  const W = 720, H = 400;
  let b = T(24, 32, 'Trophic levels in a meadow', { size: 16, weight: 'bold' });
  levels.slice().reverse().forEach((lv, j) => {
    const i = levels.length - 1 - j, y = 56 + j * 62;
    b += R(24, y, 300, 46, { fill: lv[3], rx: 8 }) + T(36, y + 28, lv[1], { fill: '#FFFFFF', weight: 'bold', size: 15 });
    b += T(340, y + 20, lv[0], { weight: 'bold', size: 13 }) + T(340, y + 38, lv[2], { size: 12, fill: GREY });
    if (i > 0) b += L(260, y + 102, 260, y + 50, { stroke: INK, w: 2, arrow: 'ink' });
  });
  b += T(270, 390, 'Arrows point from the food to the eater: the way energy moves.', { size: 12, fill: GREY, anchor: 'middle' });
  add('trophic-levels', svg('trophic-levels-meadow', W, H, 'Trophic levels in a meadow',
    'Five feeding levels in a meadow, bottom to top, with arrows pointing from food to eater. Trophic level 1, producers: grass, which makes its own food by photosynthesis. Level 2, primary consumers: a grasshopper, a herbivore that eats producers. Level 3, secondary consumers: a frog that eats primary consumers. Level 4, tertiary consumers: a snake. At the top, an apex predator: a hawk that eats snakes and that nothing hunts.', b));
}

/* ------------------------------------------- 1.10 energy pyramid */
{
  const E0 = 10000, names = ['Producers', 'Primary consumers', 'Secondary consumers', 'Tertiary consumers'];
  const vals = names.map((_, k) => Calc.evaluate({ fn: 'tenPercent', args: [E0, k] }));
  const W = 720, H = 380, cx = 290, widths = [520, 380, 240, 120];
  let b = T(24, 30, 'An energy pyramid: about 10% passes up each level', { size: 16, weight: 'bold' });
  vals.forEach((v, k) => {
    const y = 296 - k * 62, w = widths[k];
    b += R(cx - w / 2, y, w, 52, { fill: [GREEN, OLIVE, BLUE, VERM][k], rx: 4 });
    b += T(cx, y + 22, names[k], { anchor: 'middle', fill: '#FFFFFF', weight: 'bold', size: k === 3 ? 12 : 13 });
    b += T(cx, y + 41, `${fmt(v)} kcal/m²/yr`, { anchor: 'middle', fill: '#FFFFFF', size: 12 });
    if (k > 0) b += T(cx + widths[k - 1] / 2 + 14, y + 52, `× 0.10`, { size: 12, fill: INK, weight: 'bold' });
  });
  b += TL(560, 120, 'At each step about\n90% is used for life\nprocesses and lost\nas heat (second law\nof thermodynamics).', { size: 12, fill: VERM });
  b += T(24, 368, 'Widths not to scale. Invented data for practice.', { size: 12, fill: GREY });
  add('energy-flow', svg('energy-flow-pyramid', W, H, 'An energy pyramid with the 10% rule',
    `An energy pyramid from invented data in kilocalories per square meter per year. Producers ${fmt(vals[0])}; primary consumers ${fmt(vals[1])}; secondary consumers ${fmt(vals[2])}; tertiary consumers ${fmt(vals[3])}. Each level holds about 10 percent of the level below; about 90 percent is used for life processes and lost as heat, as the second law of thermodynamics predicts. Widths are not to scale.`, b));
}

/* ------------------------------------------- 1.11 food web */
{
  const W = 760, H = 470;
  const N = {
    grass: [90, 380, 'Grass', GREEN], shrub: [290, 380, 'Shrubs', GREEN],
    hopper: [60, 260, 'Grasshopper', OLIVE], rabbit: [230, 260, 'Rabbit', OLIVE], mouse: [400, 260, 'Mouse', OLIVE],
    frog: [40, 150, 'Frog', BLUE], snake: [240, 150, 'Snake', BLUE], fox: [560, 150, 'Fox', BLUE],
    hawk: [420, 50, 'Hawk', VERM],
  };
  const bw = 120, bh = 38;
  const center = k => [N[k][0] + bw / 2, N[k][1] + bh / 2];
  const edge = (a, z) => { // from box a to box z, clipped to box edges
    const [x1, y1] = center(a), [x2, y2] = center(z);
    const dx = x2 - x1, dy = y2 - y1;
    const clip = (sgn) => { const tx = (bw / 2) / Math.abs(dx || 1e-9), ty = (bh / 2) / Math.abs(dy || 1e-9); return Math.min(tx, ty); };
    const t1 = clip(), t2 = clip();
    return L(x1 + dx * t1, y1 + dy * t1, x2 - dx * t2, y2 - dy * t2, { stroke: GREY, w: 1.8, arrow: 'grey' });
  };
  const eats = [['grass', 'hopper'], ['grass', 'rabbit'], ['shrub', 'rabbit'], ['shrub', 'mouse'], ['hopper', 'frog'], ['frog', 'snake'], ['mouse', 'snake'], ['mouse', 'fox'], ['rabbit', 'fox'], ['snake', 'hawk'], ['rabbit', 'hawk'], ['mouse', 'hawk']];
  let b = '';
  for (const [a, z] of eats) b += edge(a, z);
  for (const [k, [x, y, name, c]] of Object.entries(N)) b += box(x, y, bw, bh, name, { fill: '#FFFFFF', stroke: c, size: 13 });
  b += box(560, 300, 180, 120, 'Decomposers and\ndetritivores\nfungi, bacteria,\nearthworms', { fill: SAND, stroke: '#8C6D46', size: 12 });
  b += T(560, 440, 'They break down dead matter', { size: 11, fill: GREY }) + T(560, 454, 'from every level.', { size: 11, fill: GREY });
  b += T(24, 24, 'A meadow food web: arrows point from the food to the eater', { size: 15, weight: 'bold' });
  b += T(24, 462, 'Producers green, primary consumers olive, secondary consumers blue, top predator vermillion.', { size: 11, fill: GREY });
  add('food-webs', svg('food-webs-meadow', W, H, 'A meadow food web',
    'A food web in a meadow, with arrows from food to eater. Grass is eaten by grasshoppers and rabbits. Shrubs are eaten by rabbits and mice. Grasshoppers are eaten by frogs. Frogs are eaten by snakes. Mice are eaten by snakes, foxes and hawks. Rabbits are eaten by foxes and hawks. Snakes are eaten by hawks. Decomposers and detritivores, such as fungi, bacteria and earthworms, break down dead matter from every level.', b));
}

/* ------------------------------------------- math: doubling */
{
  const n0 = 1, rate = 2, td = Calc.evaluate({ fn: 'ruleOf70', args: [rate] });
  const pts = []; for (let t = 0; t <= 70; t += 1) pts.push([t, Calc.evaluate({ fn: 'exponential', args: [n0, rate, t] })]);
  const W = 720, H = 360, x0 = 80, x1 = 680, y0 = 300, y1 = 50;
  const sx = t => x0 + t / 70 * (x1 - x0), sy = v => y0 - v / 4.5 * (y0 - y1);
  let b = T(24, 30, `A population growing ${rate}% a year doubles about every ${td} years`, { size: 16, weight: 'bold' });
  b += L(x0, y0, x1, y0) + L(x0, y0, x0, y1);
  for (let t = 0; t <= 70; t += 10) b += L(sx(t), y0, sx(t), y0 + 5) + T(sx(t), y0 + 20, String(2000 + t), { anchor: 'middle', size: 12 });
  for (let v = 0; v <= 4; v += 1) b += L(x0 - 5, sy(v), x0, sy(v)) + T(x0 - 9, sy(v) + 4, String(v), { anchor: 'end', size: 12 });
  b += P('M ' + pts.map(([t, v]) => `${f(sx(t))} ${f(sy(v))}`).join(' L '), { stroke: OLIVE, w: 3 });
  for (const k of [1, 2]) {
    const t = k * td, v = Calc.evaluate({ fn: 'exponential', args: [n0, rate, t] });
    b += L(sx(t), y0, sx(t), sy(v), { dash: '5 4', stroke: VERM }) + L(x0, sy(v), sx(t), sy(v), { dash: '5 4', stroke: VERM }) + C(sx(t), sy(v), 5, { fill: VERM });
    b += T(sx(t) - 8, sy(v) - 10, `${2000 + t}: about ${Math.round(v)} million`, { size: 12, weight: 'bold', fill: VERM, anchor: 'end' });
  }
  b += T((x0 + x1) / 2, y0 + 44, 'Year', { anchor: 'middle', weight: 'bold' });
  b += `<text transform="translate(26 ${f((y0 + y1) / 2)}) rotate(-90)" font-size="13" font-weight="bold" fill="${INK}" text-anchor="middle">Population (millions)</text>`;
  b += T(x0 + 10, y1 + 10, `Rule of 70: 70 / ${rate} = ${td} years. Start: ${n0} million in 2000. Invented data.`, { size: 12, fill: GREY });
  add('math-doubling', svg('math-doubling-curve', W, H, 'A population doubling every 35 years',
    `A curve from invented data: a population of 1 million in 2000 grows 2 percent a year. By the rule of 70 the doubling time is 70 divided by 2 = ${td} years, so it reaches about 2 million in ${2000 + td} and about 4 million in ${2000 + 2 * td}. The curve gets steeper as the population grows.`, b));
}

/* ------------------------------------------------------------- write */
if (process.argv.includes('--list')) { for (const x of figs) console.log(x.id, `${x.w}x${x.h}`, x.topic); }
else {
  mkdirSync(OUT, { recursive: true }); mkdirSync(REG, { recursive: true });
  const byTopic = {};
  for (const x of figs) {
    writeFileSync(join(OUT, `${x.id}.svg`), x.svg);
    (byTopic[x.topic] ||= {})[x.id] = { file: `figures/${x.id}.svg`, ext: 'svg', w: x.w, h: x.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: x.alt };
  }
  for (const [t, o] of Object.entries(byTopic)) writeFileSync(join(REG, `${t}.json`), JSON.stringify(o, null, 1) + '\n');
  console.log(`wrote ${figs.length} figures for ${Object.keys(byTopic).length} topics`);
}
