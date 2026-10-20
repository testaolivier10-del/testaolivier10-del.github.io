/* AP® Environmental Science, Unit 6 figures (author E): standalone SVG
   diagrams for the lessons and notes of topics 6.1-6.13, written to
   environmental-science/figures/<id>.svg. Each figure is an <img>, so every
   style is inline: white background, role="img" with <title> and <desc>,
   Arial/Helvetica, ink #1F2A28, olive #474A10 for emphasis, Okabe-Ito blue,
   green and vermillion as second colors.

     node scripts/apenv-figures/unit-6.mjs            write every figure
     node scripts/apenv-figures/unit-6.mjs --list     print ids and sizes

   The registry entries (alt text, size) are in
   environmental-science/data/figures/<topic>.json; keep w and h equal. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'environmental-science', 'figures');

const INK = '#1F2A28', OLIVE = '#474A10', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GRAY = '#6B6F6E';
const TINT = { olive: '#EFF0DA', blue: '#E3F1FA', green: '#DFF3EC', verm: '#FBE7DA', gray: '#F1F2F1', soft: '#D3D27F' };
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---- tiny drawing kit ---- */
function T(x, y, s, o = {}) {
  const lines = String(s).split('\n');
  const size = o.size || 14, lh = o.lh || size * 1.25;
  const attrs = `x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${o.fill || INK}"${o.bold ? ' font-weight="700"' : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.italic ? ' font-style="italic"' : ''}`;
  if (lines.length === 1) return `<text ${attrs}>${esc(s)}</text>`;
  return `<text ${attrs}>${lines.map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join('')}</text>`;
}
const R = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ah-${o.arrow})"` : ''}/>`;
const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ah-${o.arrow})"` : ''}${o.join ? ' stroke-linejoin="round"' : ''}/>`;
const C = (cx, cy, r, o = {}) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill || 'none'}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.5}"/>`;
const ARROWS = { ink: INK, olive: OLIVE, blue: BLUE, green: GREEN, verm: VERM, gray: GRAY };
const defs = () => `<defs>${Object.entries(ARROWS).map(([k, c]) => `<marker id="ah-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`;
function box(x, y, w, h, title, body, o = {}) {
  return R(x, y, w, h, { fill: o.fill || TINT.olive, stroke: o.stroke || OLIVE, sw: 1.5 }) +
    T(x + w / 2, y + 22, title, { anchor: 'middle', bold: true, size: o.tsize || 14, fill: o.tfill || INK }) +
    (body ? T(x + w / 2, y + 42, body, { anchor: 'middle', size: o.bsize || 12.5, lh: 16 }) : '');
}
function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d">` +
    `<title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${defs()}` +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="#FFFFFF"/>${body}</svg>\n`;
}

const FIGS = {};

/* 6.1 Sorting energy sources */
FIGS['renewable-nonrenewable-sorting'] = { w: 760, h: 400, title: 'Renewable and nonrenewable energy sources', desc: 'Nonrenewable sources (coal, oil, natural gas, nuclear fuel) exist in a fixed amount and form over millions of years. Renewable sources are replenished at or near the rate we use them: sunlight, wind, moving water and Earth\'s internal heat are not used up, while wood and other biomass are depletable and stay renewable only if they regrow as fast as they are used.', body: () => [
  T(380, 30, 'Where does the energy come from, and does it come back?', { anchor: 'middle', bold: true, size: 17 }),
  box(20, 50, 330, 300, 'Nonrenewable', 'A fixed amount in Earth\'s crust.\nForms over millions of years,\nfar slower than we use it.', { fill: TINT.verm, stroke: VERM }),
  ...['Coal', 'Oil', 'Natural gas', 'Nuclear fuel (mined ore)'].map((s, i) => R(50, 150 + i * 46, 270, 36, { fill: '#fff', stroke: VERM, sw: 1.2 }) + T(185, 173 + i * 46, s, { anchor: 'middle', size: 14 })),
  box(410, 50, 330, 300, 'Renewable', 'Replenished naturally at or\nnear the rate we use it.', { fill: TINT.green, stroke: GREEN }),
  R(430, 130, 290, 120, { fill: '#fff', stroke: GREEN, sw: 1.2 }),
  T(575, 152, 'Nondepletable: use does not', { anchor: 'middle', bold: true, size: 13 }),
  T(575, 168, 'reduce the supply', { anchor: 'middle', bold: true, size: 13 }),
  T(575, 192, 'Sunlight, wind', { anchor: 'middle', size: 14 }),
  T(575, 214, 'Moving water', { anchor: 'middle', size: 14 }),
  T(575, 236, 'Earth\'s internal heat', { anchor: 'middle', size: 14 }),
  R(430, 262, 290, 76, { fill: '#fff', stroke: OLIVE, sw: 1.2, dash: '5 4' }),
  T(575, 284, 'Depletable: renewable only if', { anchor: 'middle', bold: true, size: 13 }),
  T(575, 300, 'it regrows as fast as it is used', { anchor: 'middle', bold: true, size: 13 }),
  T(575, 324, 'Wood, crops and other biomass', { anchor: 'middle', size: 14 }),
  L(60, 378, 700, 378, { stroke: GRAY, sw: 1.5, arrow: 'gray' }),
  T(60, 372, 'Time to replenish:', { size: 12, fill: GRAY }),
  T(700, 395, 'millions of years (nonrenewable)', { size: 12, fill: GRAY, anchor: 'end' }),
  T(60, 395, 'continuous, days or a few decades (renewable)', { size: 12, fill: GRAY }),
].join('') };

/* 6.2 Energy per person, invented */
FIGS['global-energy-consumption-per-person'] = { w: 760, h: 420, title: 'Energy use per person in four invented countries', desc: 'Invented data for practice. Stacked bars of energy use per person in gigajoules for four invented countries from least to most developed: country A 15 (10 biomass, 5 fossil fuels), country B 40 (8 biomass, 30 fossil fuels, 2 other), country C 110 (4 biomass, 92 fossil fuels, 14 other), country D 230 (5 biomass, 185 fossil fuels, 40 other). Energy use per person rises with development, and fossil fuels supply most of it in the more developed countries.', body: () => {
  const data = [['A', 10, 5, 0], ['B', 8, 30, 2], ['C', 4, 92, 14], ['D', 5, 185, 40]];
  const x0 = 110, y0 = 350, sc = 1.0, bw = 90, gap = 60, out = [];
  out.push(T(380, 28, 'Energy use per person, four invented countries', { anchor: 'middle', bold: true, size: 17 }));
  out.push(T(380, 48, 'Invented data for practice', { anchor: 'middle', size: 12, fill: GRAY, italic: true }));
  for (const v of [0, 50, 100, 150, 200, 250]) { const y = y0 - v * sc; out.push(L(x0 - 6, y, 640, y, { stroke: '#D9DCDA', sw: 1 }), T(x0 - 10, y + 4, String(v), { anchor: 'end', size: 12 })); }
  out.push(L(x0, y0, 640, y0, { sw: 1.5 }), L(x0, y0, x0, 50, { sw: 1.5 }));
  out.push(`<text transform="translate(40 ${y0 - 140}) rotate(-90)" font-family="${FONT}" font-size="13" font-weight="700" fill="${INK}" text-anchor="middle">Energy per person (GJ per year)</text>`);
  data.forEach(([n, b, f, o], i) => {
    const x = x0 + 30 + i * (bw + gap); let y = y0;
    for (const [v, col] of [[b, GREEN], [f, OLIVE], [o, BLUE]]) { if (!v) continue; y -= v * sc; out.push(`<rect x="${x}" y="${y}" width="${bw}" height="${v * sc}" fill="${col}" fill-opacity="0.85" stroke="#fff" stroke-width="1"/>`); }
    out.push(T(x + bw / 2, y - 8, String(b + f + o), { anchor: 'middle', bold: true, size: 13 }));
    out.push(T(x + bw / 2, y0 + 20, 'Country ' + n, { anchor: 'middle', size: 13, bold: true }));
  });
  out.push(T(x0 + 75, y0 + 40, 'less developed', { anchor: 'middle', size: 12, fill: GRAY }), T(x0 + 525, y0 + 40, 'more developed', { anchor: 'middle', size: 12, fill: GRAY }));
  out.push(L(x0 + 140, y0 + 36, x0 + 450, y0 + 36, { stroke: GRAY, sw: 1.3, arrow: 'gray' }));
  const lg = [[GREEN, 'Wood and other biomass'], [OLIVE, 'Fossil fuels'], [BLUE, 'Other sources']];
  lg.forEach(([c, s], i) => out.push(`<rect x="${130 + i * 190}" y="62" width="14" height="14" fill="${c}" fill-opacity="0.85"/>`, T(150 + i * 190, 74, s, { size: 12.5 })));
  return out.join('');
} };

/* 6.3 Coal ranks */
FIGS['fuel-types-coal-ranks'] = { w: 760, h: 380, title: 'From peat to anthracite: how coal forms and ranks', desc: 'Plant material buried in a swamp becomes peat, then, with more heat, pressure, depth of burial and time, lignite, then bituminous coal, then anthracite. Along the series the carbon content and the energy per kilogram rise and the moisture falls; peat and lignite are the lowest-energy fuels, anthracite the highest.', body: () => {
  const st = [['Peat', 'partly decayed\nplant material', '#C9B48F'], ['Lignite', 'soft, brown,\nmoist coal', '#8C6A43'], ['Bituminous', 'hard black coal,\nwidely burned\nfor electricity', '#4A4038'], ['Anthracite', 'hardest, shiny,\nhighest carbon', '#1F1F1F']];
  const out = [T(380, 28, 'Coal forms from buried plants: more heat and pressure, higher rank', { anchor: 'middle', bold: true, size: 16 })];
  st.forEach(([n, d, col], i) => {
    const x = 30 + i * 182;
    out.push(R(x, 60, 150, 122, { fill: TINT.gray, stroke: INK, sw: 1.2 }), `<rect x="${x + 50}" y="72" width="50" height="34" rx="6" fill="${col}"/>`, T(x + 75, 128, n, { anchor: 'middle', bold: true, size: 15 }), T(x + 75, 146, d, { anchor: 'middle', size: 11.5, lh: 13 }));
    if (i < 3) out.push(L(x + 152, 121, x + 178, 121, { stroke: OLIVE, sw: 2.5, arrow: 'olive' }));
  });
  out.push(L(40, 200, 720, 200, { stroke: VERM, sw: 3, arrow: 'verm' }), T(380, 222, 'more heat, pressure, depth of burial and time', { anchor: 'middle', size: 13, fill: VERM, bold: true }));
  const rows = [['Carbon content', 'low', 'high', true], ['Energy per kilogram', 'low', 'high', true], ['Moisture', 'high', 'low', false]];
  rows.forEach(([n, a, b, up], i) => {
    const y = 250 + i * 40;
    out.push(T(30, y + 16, n, { size: 13, bold: true }));
    for (let k = 0; k < 4; k++) { const v = up ? (k + 1) / 4 : (4 - k) / 4; out.push(`<rect x="${190 + k * 118}" y="${y + 4}" width="${100 * v}" height="16" rx="3" fill="${up ? OLIVE : BLUE}" fill-opacity="0.8"/>`); }
    out.push(T(740, y + 16, `${a} to ${b}`, { size: 12, anchor: 'end', fill: GRAY }));
  });
  out.push(T(380, 372, 'Bars show the trend only (relative, not measured values).', { anchor: 'middle', size: 11.5, fill: GRAY, italic: true }));
  return out.join('');
} };

/* 6.4 Where resources are */
FIGS['energy-resources-distribution-landscape'] = { w: 780, h: 400, title: 'Where natural energy resources are found', desc: 'A landscape cross-section. Oil, natural gas and coal lie in layers of sedimentary rock in basins that were once seas or swamps. Strong steady winds blow over coasts, open plains and mountain passes. Sunlight is strongest and most reliable in dry regions near 15 to 35 degrees latitude with few clouds. Rivers falling from mountains can turn turbines at dams. Earth\'s internal heat is close to the surface near plate boundaries and volcanoes. Each country has a different mix because each region has a different geologic history and climate.', body: () => [
  T(390, 26, 'Each region\'s geology and climate decide which resources it has', { anchor: 'middle', bold: true, size: 16 }),
  // sky + ground
  P('M0 230 L120 230 L200 120 L260 170 L330 90 L410 230 L780 230', { stroke: INK, sw: 2, fill: 'none', join: true }),
  P('M0 230 L120 230 L200 120 L260 170 L330 90 L410 230 L780 230 L780 400 L0 400 Z', { stroke: 'none', fill: '#EDE6D6' }),
  // sedimentary basin layers
  P('M430 260 Q600 300 770 260', { stroke: BLUE, sw: 8 }), P('M430 290 Q600 330 770 290', { stroke: '#4A4038', sw: 12 }), P('M440 320 Q600 360 770 320', { stroke: '#8C6A43', sw: 10 }),
  T(424, 268, 'natural gas', { anchor: 'end', size: 11.5 }), T(424, 298, 'coal', { anchor: 'end', size: 11.5 }), T(434, 328, 'oil', { anchor: 'end', size: 11.5 }),
  T(600, 386, 'Sedimentary rock layers: coal, oil and natural gas', { anchor: 'middle', size: 12.5, bold: true }),
  // magma near plate boundary
  P('M330 90 L330 230', { stroke: VERM, sw: 3, dash: '6 4' }), `<ellipse cx="300" cy="330" rx="90" ry="40" fill="${VERM}" fill-opacity="0.35" stroke="${VERM}"/>`,
  T(300, 334, 'hot rock near a plate boundary', { anchor: 'middle', size: 12 }), T(300, 352, '(Earth\'s internal heat)', { anchor: 'middle', size: 11.5 }),
  // river and dam
  P('M200 130 Q230 200 250 228', { stroke: BLUE, sw: 4 }), R(240, 200, 12, 30, { fill: GRAY, stroke: INK, rx: 1 }),
  T(150, 110, 'river falling\nfrom mountains\n(dams)', { size: 12, anchor: 'middle', lh: 14, fill: BLUE }),
  // sun
  C(640, 80, 26, { fill: '#F4D35E', stroke: '#C79A00' }), T(640, 130, 'dry, sunny, few clouds,\nlower latitudes: strong sunlight', { anchor: 'middle', size: 12, lh: 14 }),
  // wind
  ...[0, 1, 2].map(i => L(30, 160 + i * 18, 100, 160 + i * 18, { stroke: GREEN, sw: 2, arrow: 'green' })),
  T(65, 118, 'coasts, plains,\npasses: wind', { anchor: 'middle', size: 12, lh: 14, fill: GREEN }),
  T(10, 252, 'coast', { size: 11.5, fill: GRAY }), T(480, 222, 'open plain', { size: 11.5, fill: GRAY }),
].join('') };

/* 6.5 Power plant */
FIGS['fossil-fuels-power-plant'] = { w: 800, h: 400, title: 'How a coal-fired power plant makes electricity', desc: 'Coal burns in a boiler and heats water into high-pressure steam. The steam spins a turbine, which turns a generator that makes electricity for the transmission lines. Used steam is cooled back to water in a condenser by cooling water from a river or cooling tower and returns to the boiler. Smoke and carbon dioxide leave through the stack. Only about one third of the fuel\'s chemical energy leaves as electricity; most is lost as waste heat.', body: () => [
  T(400, 26, 'Fuel to outlet: chemical energy, heat, motion, electricity', { anchor: 'middle', bold: true, size: 16 }),
  R(40, 120, 120, 70, { fill: '#4A4038', stroke: INK }), T(100, 160, 'Coal', { anchor: 'middle', fill: '#fff', bold: true, size: 15 }),
  L(160, 155, 205, 155, { stroke: OLIVE, sw: 3, arrow: 'olive' }),
  box(210, 90, 140, 130, 'Boiler', 'burning fuel\nheats water\ninto steam', { fill: TINT.verm, stroke: VERM }),
  R(240, 40, 30, 50, { fill: TINT.gray, stroke: INK, rx: 2 }), T(285, 58, 'stack: smoke,\ncarbon dioxide', { size: 11.5, lh: 13 }),
  L(350, 120, 405, 120, { stroke: VERM, sw: 3, arrow: 'verm' }), T(378, 110, 'steam', { anchor: 'middle', size: 12, fill: VERM }),
  box(410, 90, 120, 80, 'Turbine', 'steam spins\nthe blades', { fill: TINT.blue, stroke: BLUE }),
  L(530, 130, 570, 130, { stroke: INK, sw: 4 }), T(550, 120, 'shaft', { anchor: 'middle', size: 11 }),
  box(575, 90, 120, 80, 'Generator', 'magnets and\ncoils', { fill: TINT.olive, stroke: OLIVE }),
  L(695, 130, 760, 130, { stroke: OLIVE, sw: 3, arrow: 'olive' }), T(728, 110, 'electricity', { anchor: 'middle', size: 12, fill: OLIVE, bold: true }),
  P('M470 170 L470 250', { stroke: VERM, sw: 2.5, arrow: 'verm' }), T(478, 214, 'used steam', { size: 11.5, fill: VERM }),
  box(400, 255, 140, 70, 'Condenser', 'steam cools\nback to water', { fill: TINT.blue, stroke: BLUE }),
  P('M400 290 L280 290 L280 222', { stroke: BLUE, sw: 2.5, arrow: 'blue' }), T(395, 306, 'water returns to boiler', { size: 11.5, fill: BLUE, anchor: 'end' }),
  L(660, 290, 545, 290, { stroke: BLUE, sw: 2.5, arrow: 'blue' }), T(665, 286, 'cooling water from a\nriver or cooling tower', { size: 11.5, lh: 13 }),
  L(545, 312, 660, 312, { stroke: VERM, sw: 2.5, arrow: 'verm' }), T(665, 322, 'returns warmer:\nwaste heat', { size: 11.5, lh: 13, fill: VERM }),
  R(40, 345, 720, 42, { fill: TINT.olive, stroke: OLIVE }),
  T(400, 371, 'About one third of the fuel\'s energy leaves as electricity; about two thirds is lost as heat.', { anchor: 'middle', size: 13.5, bold: true }),
].join('') };

/* 6.6 Nuclear reactor */
FIGS['nuclear-power-reactor'] = { w: 800, h: 410, title: 'How a nuclear power plant makes electricity', desc: 'In the reactor core, uranium-235 in fuel rods splits when struck by neutrons (nuclear fission), releasing heat and more neutrons. Control rods absorb neutrons to slow or stop the chain reaction. Water carries the heat to a steam generator; the steam spins a turbine that turns a generator. A condenser cools the used steam with water from a cooling tower or river. The plant releases no carbon dioxide while running, but produces radioactive spent fuel and warm water.', body: () => {
  const out = [T(400, 26, 'The fuel is uranium; the steam only carries the heat', { anchor: 'middle', bold: true, size: 16 })];
  out.push(R(40, 60, 220, 260, { fill: TINT.gray, stroke: INK, rx: 30 }), T(150, 84, 'Reactor', { anchor: 'middle', bold: true, size: 15 }));
  for (let i = 0; i < 5; i++) out.push(`<rect x="${70 + i * 34}" y="150" width="14" height="140" rx="3" fill="${GREEN}" fill-opacity="0.75"/>`);
  for (let i = 0; i < 4; i++) out.push(`<rect x="${88 + i * 34}" y="100" width="10" height="110" fill="${INK}"/>`);
  out.push(T(150, 310, 'fuel rods: uranium-235', { anchor: 'middle', size: 12, fill: GREEN, bold: true }));
  out.push(T(40, 346, 'Control rods (dark) absorb neutrons to slow or stop the chain reaction.', { size: 12.5 }));
  out.push(P('M260 160 L310 160 L310 120 L380 120', { stroke: VERM, sw: 3, arrow: 'verm' }), T(265, 178, 'hot water', { size: 11.5, fill: VERM }));
  out.push(box(385, 95, 130, 70, 'Steam', 'generator', { fill: TINT.verm, stroke: VERM }));
  out.push(P('M380 145 L345 145 L345 250 L260 250', { stroke: BLUE, sw: 2.5, arrow: 'blue' }), T(272, 268, 'cooler water returns', { size: 11.5, fill: BLUE }));
  out.push(L(515, 120, 560, 120, { stroke: VERM, sw: 3, arrow: 'verm' }), T(537, 110, 'steam', { anchor: 'middle', size: 11.5, fill: VERM }));
  out.push(box(565, 90, 100, 65, 'Turbine', '', { fill: TINT.blue, stroke: BLUE }), L(665, 122, 690, 122, { sw: 4 }), box(690, 90, 100, 65, 'Generator', '', { fill: TINT.olive, stroke: OLIVE }));
  out.push(L(740, 155, 740, 200, { stroke: OLIVE, sw: 3, arrow: 'olive' }), T(740, 218, 'electricity', { anchor: 'middle', size: 12, bold: true, fill: OLIVE }));
  out.push(P('M615 155 L615 240', { stroke: VERM, sw: 2.5, arrow: 'verm' }), box(555, 245, 120, 55, 'Condenser', '', { fill: TINT.blue, stroke: BLUE }));
  out.push(P('M555 285 L470 285 L470 168', { stroke: BLUE, sw: 2.5, arrow: 'blue' }));
  out.push(P('M690 330 Q700 280 690 245 L770 245 Q760 280 770 330 Z', { fill: TINT.gray, stroke: INK, sw: 1.5 }), T(730, 350, 'cooling tower', { anchor: 'middle', size: 11.5 }));
  out.push(L(690, 272, 678, 272, { stroke: BLUE, sw: 2 }));
  out.push(R(40, 362, 600, 40, { fill: TINT.olive, stroke: OLIVE }), T(340, 387, 'Fission: a neutron splits U-235, releasing heat and 2 or 3 more neutrons', { anchor: 'middle', size: 13, bold: true }));
  return out.join('');
} };

/* 6.7 Biomass carbon */
FIGS['biomass-energy-carbon'] = { w: 760, h: 400, title: 'Biomass energy and carbon', desc: 'Growing plants take in carbon dioxide by photosynthesis and store the carbon in wood, crops and waste. Harvested biomass is burned for heat or electricity, or made into ethanol or biodiesel, and burning releases the carbon as carbon dioxide along with smoke and soot. If new plants regrow at the same rate, they take the carbon back up over years or decades. If forest is cleared and not regrown, the carbon stays in the air and the land loses its habitat and soil.', body: () => [
  T(380, 26, 'Biomass is renewable only when it regrows as fast as it is burned', { anchor: 'middle', bold: true, size: 16 }),
  box(40, 70, 210, 90, 'Growing plants', 'photosynthesis stores\ncarbon in wood and crops', { fill: TINT.green, stroke: GREEN }),
  box(500, 70, 220, 90, 'Harvest', 'wood, crop waste, manure,\ncorn or sugarcane', { fill: TINT.olive, stroke: OLIVE }),
  box(500, 230, 220, 100, 'Burn or convert', 'heat, electricity, or\nliquid fuels (ethanol,\nbiodiesel)', { fill: TINT.verm, stroke: VERM }),
  box(40, 230, 210, 100, 'Carbon dioxide', 'in the air, with smoke\nand soot from burning', { fill: TINT.gray, stroke: GRAY }),
  L(255, 115, 495, 115, { stroke: OLIVE, sw: 3, arrow: 'olive' }), T(375, 105, 'years to decades', { anchor: 'middle', size: 12 }),
  L(610, 160, 610, 225, { stroke: OLIVE, sw: 3, arrow: 'olive' }),
  L(495, 280, 255, 280, { stroke: VERM, sw: 3, arrow: 'verm' }), T(375, 270, 'released in hours', { anchor: 'middle', size: 12, fill: VERM }),
  L(145, 225, 145, 165, { stroke: GREEN, sw: 3, arrow: 'green' }), T(155, 200, 'taken back up\nonly if plants regrow', { size: 12, lh: 14, fill: GREEN }),
  R(40, 350, 680, 40, { fill: TINT.olive, stroke: OLIVE }),
  T(380, 375, 'Cleared and not regrown: the carbon stays in the air and habitat is lost.', { anchor: 'middle', size: 13.5, bold: true }),
].join('') };

/* 6.8 Solar three ways */
FIGS['solar-energy-three-ways'] = { w: 800, h: 400, title: 'Three ways to use solar energy', desc: 'Photovoltaic cells turn sunlight directly into electricity with no moving parts; an inverter changes it for home use. An active solar system heats a fluid in a roof collector and uses a pump and a tank to move and store the heat. A passive solar building uses south-facing windows (in the Northern Hemisphere), a roof overhang and thick floors or walls to absorb and hold the sun\'s heat without pumps or fans.', body: () => {
  const out = [T(400, 26, 'Sunlight to electricity, or sunlight to heat', { anchor: 'middle', bold: true, size: 16 })];
  const sun = (x, y) => C(x, y, 18, { fill: '#F4D35E', stroke: '#C79A00' });
  // PV
  out.push(R(20, 50, 245, 300, { fill: '#fff', stroke: OLIVE }), T(142, 74, 'Photovoltaic (PV)', { anchor: 'middle', bold: true, size: 14 }), sun(50, 105));
  out.push(`<polygon points="70,190 200,150 230,180 100,220" fill="${BLUE}" fill-opacity="0.8" stroke="${INK}"/>`, L(64, 118, 140, 175, { stroke: '#C79A00', sw: 2, arrow: 'olive' }));
  out.push(L(165, 200, 165, 250, { stroke: OLIVE, sw: 2.5, arrow: 'olive' }), R(115, 255, 100, 34, { fill: TINT.olive, stroke: OLIVE }), T(165, 277, 'inverter', { anchor: 'middle', size: 12.5 }));
  out.push(T(142, 316, 'light to electricity', { anchor: 'middle', size: 12.5, bold: true }), T(142, 334, 'no moving parts', { anchor: 'middle', size: 12 }));
  // active
  out.push(R(278, 50, 245, 300, { fill: '#fff', stroke: OLIVE }), T(400, 74, 'Active solar heating', { anchor: 'middle', bold: true, size: 14 }), sun(310, 105));
  out.push(`<polygon points="330,180 450,140 470,165 350,205" fill="${VERM}" fill-opacity="0.6" stroke="${INK}"/>`, L(324, 118, 390, 160, { stroke: '#C79A00', sw: 2, arrow: 'olive' }));
  out.push(R(420, 230, 60, 80, { fill: TINT.blue, stroke: BLUE }), T(450, 275, 'tank', { anchor: 'middle', size: 12 }), P('M460 165 L460 230', { stroke: VERM, sw: 2.5, arrow: 'verm' }), P('M420 290 L340 290 L340 205', { stroke: BLUE, sw: 2.5, arrow: 'blue' }), C(370, 290, 10, { fill: '#fff' }), T(372, 316, 'pump', { anchor: 'middle', size: 12 }));
  out.push(T(400, 334, 'pumps or fans move the heat', { anchor: 'middle', size: 12 }));
  // passive
  out.push(R(536, 50, 245, 300, { fill: '#fff', stroke: OLIVE }), T(658, 74, 'Passive solar design', { anchor: 'middle', bold: true, size: 14 }), sun(565, 105));
  out.push(P('M600 300 L600 200 L700 160 L760 200 L760 300 Z', { fill: TINT.olive, stroke: INK, sw: 1.5 }), P('M585 205 L700 158', { stroke: INK, sw: 3 }));
  out.push(R(606, 215, 30, 60, { fill: '#BFE0F2', stroke: INK, rx: 2 }), `<rect x="606" y="285" width="140" height="15" fill="${GRAY}"/>`);
  out.push(L(578, 118, 625, 245, { stroke: '#C79A00', sw: 2, arrow: 'olive' }), T(690, 296, 'thick floor stores heat', { anchor: 'middle', size: 11.5, fill: '#fff' }));
  out.push(T(560, 330, 'south-facing windows', { size: 12 }), T(560, 345, 'no pumps or fans', { size: 12 }), T(712, 152, 'overhang', { size: 11.5 }));
  out.push(T(400, 380, 'Windows face south in the Northern Hemisphere (north in the Southern Hemisphere).', { anchor: 'middle', size: 12, fill: GRAY, italic: true }));
  return out.join('');
} };

/* 6.9 Dam */
FIGS['hydroelectric-dam'] = { w: 800, h: 400, title: 'How a hydroelectric dam makes electricity', desc: 'A dam holds water in a reservoir. Water enters an intake, falls through a large pipe called a penstock and spins a turbine, which turns a generator. The water leaves into the river below. The reservoir floods land upstream and traps sediment behind the dam; the dam blocks fish migration and changes the temperature and flow of the river downstream.', body: () => [
  T(400, 26, 'Falling water turns a turbine; the dam changes the river', { anchor: 'middle', bold: true, size: 16 }),
  P('M0 140 L330 140 L330 330 L0 330 Z', { fill: '#BFE0F2', stroke: 'none' }), T(140, 170, 'Reservoir', { anchor: 'middle', bold: true, size: 15, fill: BLUE }),
  T(140, 190, 'floods valley land upstream', { anchor: 'middle', size: 12 }),
  P('M0 300 Q160 285 330 300 L330 330 L0 330 Z', { fill: '#C9B48F', stroke: 'none' }), T(165, 322, 'sediment trapped behind the dam', { anchor: 'middle', size: 12 }),
  P('M330 90 L400 90 L470 330 L330 330 Z', { fill: TINT.gray, stroke: INK, sw: 2 }), T(375, 82, 'Dam', { anchor: 'middle', bold: true, size: 14 }),
  P('M330 200 L430 280 L480 300', { stroke: BLUE, sw: 8 }), T(395, 216, 'penstock', { size: 11.5 }),
  T(310, 216, 'intake', { anchor: 'end', size: 11.5 }),
  R(480, 280, 80, 50, { fill: TINT.blue, stroke: BLUE }), T(520, 310, 'turbine', { anchor: 'middle', size: 12 }),
  L(520, 280, 520, 230, { sw: 4 }), R(475, 185, 90, 45, { fill: TINT.olive, stroke: OLIVE }), T(520, 212, 'generator', { anchor: 'middle', size: 12 }),
  L(565, 205, 640, 160, { stroke: OLIVE, sw: 3, arrow: 'olive' }), T(650, 156, 'electricity to\npower lines', { size: 12, lh: 14, fill: OLIVE, bold: true }),
  P('M560 320 L800 320 L800 345 L560 345 Z', { fill: '#BFE0F2', stroke: 'none' }), T(680, 368, 'river below: less sediment,\naltered flow and temperature', { anchor: 'middle', size: 12, lh: 14 }),
  P('M770 330 Q720 312 680 332', { stroke: VERM, sw: 2.5, arrow: 'verm' }), T(760, 300, 'migrating fish\nblocked', { anchor: 'middle', size: 12, lh: 14, fill: VERM }),
].join('') };

/* 6.10 Geothermal */
FIGS['geothermal-plant-heat-pump'] = { w: 800, h: 410, title: 'Geothermal power plant and ground source heat pump', desc: 'Left: at a geothermal power plant, a production well brings hot water and steam up from hot rock heated by Earth\'s interior; the steam spins a turbine and generator, and the cooled water is pumped back down an injection well. Right: a ground source heat pump circulates fluid through pipes buried a few meters down, where the ground stays about the same temperature all year; it moves heat from the ground into a house in winter and from the house into the ground in summer.', body: () => [
  T(400, 26, 'Earth\'s internal heat: power plants where it is shallow, heat pumps almost anywhere', { anchor: 'middle', bold: true, size: 15 }),
  P('M0 150 L480 150', { stroke: INK, sw: 2 }), P('M0 150 L480 150 L480 410 L0 410 Z', { fill: '#EDE6D6', stroke: 'none' }),
  `<rect x="0" y="330" width="480" height="80" fill="${VERM}" fill-opacity="0.35"/>`, T(240, 362, 'hot rock: heat from Earth\'s interior\n(radioactive decay and heat left from Earth\'s formation)', { anchor: 'middle', size: 11.5 }),
  L(120, 330, 120, 160, { stroke: VERM, sw: 6, arrow: 'verm' }), T(112, 250, 'production\nwell: steam\nand hot water', { anchor: 'end', size: 11.5, lh: 13, fill: VERM }),
  L(360, 160, 360, 330, { stroke: BLUE, sw: 6, arrow: 'blue' }), T(368, 250, 'injection well:\ncooled water\nreturned', { size: 11.5, lh: 13, fill: BLUE }),
  R(150, 70, 90, 55, { fill: TINT.blue, stroke: BLUE }), T(195, 102, 'turbine', { anchor: 'middle', size: 12 }),
  R(260, 70, 90, 55, { fill: TINT.olive, stroke: OLIVE }), T(305, 102, 'generator', { anchor: 'middle', size: 12 }), L(240, 97, 260, 97, { sw: 4 }),
  P('M120 160 L120 97 L148 97', { stroke: VERM, sw: 3, arrow: 'verm' }), P('M195 125 L195 140 L360 140 L360 158', { stroke: BLUE, sw: 3 }),
  L(350, 85, 420, 60, { stroke: OLIVE, sw: 2.5, arrow: 'olive' }), T(425, 58, 'electricity', { size: 12, fill: OLIVE, bold: true }),
  // heat pump
  L(500, 50, 500, 400, { stroke: '#D9DCDA', sw: 1.5 }),
  P('M560 230 L560 150 L650 100 L740 150 L740 230 Z', { fill: TINT.olive, stroke: INK, sw: 1.5 }), T(650, 195, 'house', { anchor: 'middle', size: 12 }),
  P('M520 230 L790 230', { stroke: INK, sw: 2 }), P('M520 230 L790 230 L790 410 L520 410 Z', { fill: '#EDE6D6', stroke: 'none' }),
  P('M620 230 L620 330 Q650 360 680 330 L680 230', { stroke: GREEN, sw: 4 }), R(605, 205, 90, 22, { fill: '#fff', stroke: GREEN, rx: 4 }), T(650, 221, 'heat pump', { anchor: 'middle', size: 11.5 }),
  T(655, 386, 'pipes a few meters down: the ground', { anchor: 'middle', size: 11.5 }), T(655, 401, 'stays about the same temperature all year', { anchor: 'middle', size: 11.5 }),
  T(560, 268, 'winter: heat\nfrom ground\nto house', { size: 11, lh: 13, anchor: 'end', fill: VERM }), T(690, 268, 'summer: heat\nfrom house\nto ground', { size: 11, lh: 13, fill: BLUE }),
].join('') };

/* 6.11 Fuel cell */
FIGS['hydrogen-fuel-cell-diagram'] = { w: 780, h: 400, title: 'How a hydrogen fuel cell works', desc: 'Hydrogen gas enters at the anode, where a catalyst splits each molecule into hydrogen ions and electrons. The ions pass through a membrane to the cathode; the electrons cannot, so they travel through an outside circuit, powering a motor. At the cathode, oxygen from the air combines with the ions and electrons to form water, the only exhaust. No combustion happens and no carbon dioxide leaves the cell, but making the hydrogen takes energy.', body: () => [
  T(390, 26, 'Hydrogen + oxygen  →  electricity + water (no burning)', { anchor: 'middle', bold: true, size: 16 }),
  R(170, 120, 120, 200, { fill: TINT.blue, stroke: BLUE, rx: 4 }), T(230, 140, 'Anode (−)', { anchor: 'middle', bold: true, size: 13 }),
  R(330, 120, 120, 200, { fill: TINT.gray, stroke: GRAY, rx: 4 }), T(390, 140, 'Membrane', { anchor: 'middle', bold: true, size: 13 }),
  R(490, 120, 120, 200, { fill: TINT.verm, stroke: VERM, rx: 4 }), T(550, 140, 'Cathode (+)', { anchor: 'middle', bold: true, size: 13 }),
  L(40, 200, 165, 200, { stroke: BLUE, sw: 3, arrow: 'blue' }), T(40, 190, 'hydrogen (H₂) in', { size: 13, bold: true, fill: BLUE }),
  L(740, 180, 615, 180, { stroke: VERM, sw: 3, arrow: 'verm' }), T(740, 170, 'oxygen (O₂) from air', { size: 13, bold: true, fill: VERM, anchor: 'end' }),
  L(615, 270, 740, 270, { stroke: BLUE, sw: 3, arrow: 'blue' }), T(740, 295, 'water (H₂O) out', { size: 13, bold: true, fill: BLUE, anchor: 'end' }),
  L(290, 230, 485, 230, { stroke: GREEN, sw: 3, arrow: 'green' }), T(390, 222, 'H⁺ ions', { anchor: 'middle', size: 12.5, fill: GREEN, bold: true }),
  P('M230 120 L230 70 L550 70 L550 115', { stroke: OLIVE, sw: 3, arrow: 'olive' }), C(390, 70, 22, { fill: '#fff', stroke: OLIVE, sw: 2 }), T(390, 75, 'motor', { anchor: 'middle', size: 11.5 }),
  T(390, 110, 'electrons (e⁻) flow through the outside circuit', { anchor: 'middle', size: 12, fill: OLIVE }),
  T(230, 185, 'H₂ → 2H⁺ + 2e⁻', { anchor: 'middle', size: 12 }), T(550, 205, 'O₂ + 4H⁺ + 4e⁻', { anchor: 'middle', size: 12 }), T(550, 222, '→ 2H₂O', { anchor: 'middle', size: 12 }),
  R(40, 345, 700, 42, { fill: TINT.olive, stroke: OLIVE }),
  T(390, 371, 'Hydrogen is an energy carrier: it must first be made, often from natural gas or by splitting water.', { anchor: 'middle', size: 13, bold: true }),
].join('') };

/* 6.12 Wind turbine */
FIGS['wind-energy-turbine'] = { w: 760, h: 420, title: 'How a wind turbine makes electricity', desc: 'Moving air pushes on the blades and spins the rotor. In the nacelle on top of the tower, a shaft and gearbox turn a generator that makes electricity, which runs down the tower to power lines. Taller towers reach faster, steadier wind. Land between turbines can still be farmed or grazed; spinning blades can kill birds and bats; output rises and falls with the wind.', body: () => {
  const out = [T(380, 26, 'Kinetic energy of wind → spinning blades → generator → electricity', { anchor: 'middle', bold: true, size: 16 })];
  out.push(`<polygon points="246,400 254,185 266,185 274,400" fill="${TINT.gray}" stroke="${INK}" stroke-width="1.5"/>`);
  out.push(R(220, 157, 130, 40, { fill: TINT.olive, stroke: OLIVE, rx: 10 }), C(220, 177, 10, { fill: INK }));
  for (const a of [-90, 30, 150]) { const r = a * Math.PI / 180; const x2 = 220 + 110 * Math.cos(r), y2 = 177 + 110 * Math.sin(r); out.push(`<line x1="220" y1="177" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`); }
  for (let i = 0; i < 3; i++) out.push(L(20, 130 + i * 40, 90, 130 + i * 40, { stroke: GREEN, sw: 2.5, arrow: 'green' }));
  out.push(T(55, 118, 'wind', { anchor: 'middle', size: 13, bold: true, fill: GREEN }));
  out.push(R(420, 70, 320, 150, { fill: '#fff', stroke: OLIVE }), T(580, 92, 'Inside the nacelle', { anchor: 'middle', bold: true, size: 14 }));
  out.push(R(440, 120, 70, 45, { fill: TINT.gray, stroke: INK }), T(475, 147, 'shaft', { anchor: 'middle', size: 12 }), L(510, 142, 530, 142, { sw: 4 }));
  out.push(R(530, 120, 80, 45, { fill: TINT.blue, stroke: BLUE }), T(570, 147, 'gearbox', { anchor: 'middle', size: 12 }), L(610, 142, 630, 142, { sw: 4 }));
  out.push(R(630, 120, 95, 45, { fill: TINT.olive, stroke: OLIVE }), T(677, 147, 'generator', { anchor: 'middle', size: 12 }));
  out.push(T(580, 196, 'faster rotation → generator → electricity', { anchor: 'middle', size: 12 }));
  out.push(L(350, 177, 418, 150, { stroke: GRAY, sw: 1.2, dash: '4 3' }));
  out.push(L(274, 380, 360, 380, { stroke: OLIVE, sw: 3, arrow: 'olive' }), T(366, 384, 'electricity to power lines', { size: 12.5, bold: true, fill: OLIVE }));
  out.push(T(420, 260, '+ no fuel and no emissions while running', { size: 13 }), T(420, 282, '+ land below can still be farmed or grazed', { size: 13 }));
  out.push(T(420, 304, '− output varies with the wind (intermittent)', { size: 13 }), T(420, 326, '− blades can kill birds and bats', { size: 13 }));
  out.push(P('M0 400 L760 400', { stroke: INK, sw: 2 }));
  return out.join('');
} };

/* 6.13 Conserving energy at home */
FIGS['energy-conservation-home'] = { w: 800, h: 420, title: 'Ways to conserve energy in a home', desc: 'A house with labeled measures: attic insulation and weather stripping keep heat in; a programmable thermostat lowers heating and cooling when no one needs it; LED bulbs use at least 75 percent less electricity than incandescent bulbs for the same light; efficient appliances and low-flow fixtures cut electricity and hot water use; a shade tree on the sunny side and a windbreak (conservation landscaping) cut cooling and heating needs. Larger-scale measures include better vehicle fuel economy, public transportation and green building design.', body: () => {
  const out = [T(400, 26, 'Use less energy for the same comfort and light', { anchor: 'middle', bold: true, size: 16 })];
  out.push(P('M250 360 L250 200 L400 110 L550 200 L550 360 Z', { fill: TINT.olive, stroke: INK, sw: 2 }));
  out.push(`<rect x="290" y="175" width="220" height="18" fill="#F4D35E" fill-opacity="0.8"/>`, T(400, 188, 'attic insulation', { anchor: 'middle', size: 11.5 }));
  out.push(R(285, 240, 50, 50, { fill: '#BFE0F2', stroke: INK, rx: 2 }), R(465, 240, 50, 50, { fill: '#BFE0F2', stroke: INK, rx: 2 }), R(380, 290, 40, 70, { fill: TINT.gray, stroke: INK, rx: 2 }));
  out.push(C(400, 230, 9, { fill: '#FFF7C2', stroke: INK }), R(355, 300, 18, 26, { fill: '#fff', stroke: INK, rx: 3 }));
  out.push(C(640, 300, 52, { fill: GREEN, stroke: INK }), `<rect x="634" y="340" width="12" height="25" fill="#8C6A43"/>`);
  out.push(P('M0 365 L800 365', { stroke: INK, sw: 2 }));
  const lab = (x, y, tx, ty, s, anchor) => L(x, y, tx, ty, { stroke: GRAY, sw: 1.2 }) + T(tx + (anchor === 'end' ? -4 : 4), ty + 4, s, { size: 12.5, anchor, lh: 15 });
  out.push(lab(300, 184, 190, 120, 'insulation and weather\nstripping keep heat in', 'end'));
  out.push(lab(400, 230, 540, 80, 'LED bulbs: at least 75% less\nelectricity than incandescent bulbs', 'start'));
  out.push(lab(364, 312, 190, 290, 'programmable thermostat:\nlower heat or cooling when\nno one needs it', 'end'));
  out.push(lab(310, 268, 190, 215, 'efficient appliances,\nlow-flow fixtures', 'end'));
  out.push(lab(655, 252, 600, 132, 'shade tree, windbreak\n(conservation landscaping)', 'start'));
  out.push(R(20, 380, 760, 34, { fill: TINT.olive, stroke: OLIVE }), T(400, 402, 'Large scale: vehicle fuel economy, hybrids and electric vehicles, public transportation, green building design', { anchor: 'middle', size: 12.5, bold: true }));
  return out.join('');
} };

const args = new Set(process.argv.slice(2));
if (args.has('--list')) { for (const [id, f] of Object.entries(FIGS)) console.log(id, f.w, f.h); }
else {
  mkdirSync(OUT, { recursive: true });
  for (const [id, f] of Object.entries(FIGS)) writeFileSync(join(OUT, `${id}.svg`), svg(id, f.w, f.h, f.title, f.desc, f.body()));
  console.log(`unit 6: wrote ${Object.keys(FIGS).length} figures to environmental-science/figures/`);
}
export { FIGS };
