/* AP® Human Geography figures for Unit 5, Agriculture and Rural Land-Use
   Patterns and Processes (author E). Every figure is a LevlPrep original
   diagram or drawn scene; no photos. Drawn places are invented or generic
   unless a caption names a real place; the one data figure carries its
   dated source (FAO 2023).
   Writes
     human-geography/figures/<id>.svg
     human-geography/data/figures/<topic>.json   (the registry entries)

     node scripts/aphug-figures/author-e.mjs

   Style as author A: white background, role="img" with <title> and <desc>,
   Arial or Helvetica, ink #1F2A28, course teal #094953, then vermillion
   #C24E00, green #009E73 and reddish purple #A8508A. Text is 15 px or more on
   a canvas about 720 px wide so it stays readable on a phone. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'human-geography', 'figures');
const REG = join(ROOT, 'human-geography', 'data', 'figures');
const INK = '#1F2A28', TEAL = '#094953', VERM = '#C24E00', GREEN = '#009E73', PURP = '#A8508A', GREY = '#5F6B68',
  LINE = '#C9D3D1', TINT = '#E1F1F4', SOFT = '#F4F7F7', WARM = '#FBE9DC', MINT = '#DDF2EA', SAND = '#F3E7C9',
  WATER = '#9FCFE0', FIELD = '#BFDDA8', FIELD2 = '#E6D79A', FOREST = '#5E9E6E', BROWN = '#8A6A45';
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = v => Math.round(v * 10) / 10;
function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 16}"`, `fill="${o.fill || INK}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.bold) a.push('font-weight="700"');
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}
const lines = (x, y, s, o = {}) => { const lh = o.lh || (o.size || 16) * 1.3; return String(s).split('\n').map((l, i) => text(x, y + i * lh, l, o)).join(''); };
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` fill-opacity="${o.op}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.8}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}${o.both ? ` marker-start="url(#ar-${o.arrow})"` : ''}/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.4}"${o.op ? ` fill-opacity="${o.op}"` : ''}/>`;
const ellipse = (x, y, rx, ry, o = {}) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.4}"/>`;
const path = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` fill-opacity="${o.op}"` : ''} stroke-linejoin="round" stroke-linecap="round"${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const marker = (id, c) => `<marker id="ar-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
const DEFS = `<defs>${marker('ink', INK)}${marker('teal', TEAL)}${marker('verm', VERM)}${marker('green', GREEN)}</defs>`;
function box(x, y, w, h, label, o = {}) {
  const n = String(label).split('\n').length, size = o.size || 16, lh = size * 1.3;
  return rect(x, y, w, h, { fill: o.fill || SOFT, stroke: o.stroke || TEAL, w: o.w || 1.8, rx: o.rx }) +
    lines(x + w / 2, y + h / 2 - (n - 1) * lh / 2 + size * 0.36, label, { anchor: 'middle', size, bold: o.bold, fill: o.ink || INK, lh });
}
// A round badge with a short label (a panel number or a zone letter).
const badge = (x, y, s, o = {}) => circle(x, y, o.r || 15, { fill: o.fill || '#FFFFFF', stroke: o.stroke || INK, w: 2 }) + text(x, y + 6, s, { anchor: 'middle', size: 17, bold: true, fill: o.ink || INK });
const house = (x, y, s = 1, c = VERM) => path(`M${x - 7 * s},${y} L${x - 7 * s},${y - 9 * s} L${x},${y - 15 * s} L${x + 7 * s},${y - 9 * s} L${x + 7 * s},${y} Z`, { fill: c, stroke: INK, w: 1 });
const tree = (x, y, s = 1) => circle(x, y - 6 * s, 7 * s, { fill: FOREST, stroke: '#3E7550', w: 1 });
function svg(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
${DEFS}<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
const figs = [];
function add(topic, id, w, h, title, alt, body) { figs.push({ topic, id, w, h, alt, svg: svg(w, h, title, alt, body) }); }

/* ---------------------------------------------------- agriculture-intro */
{
  let b = '';
  const col = (x, head, sub, rows, c, fill) => {
    let s = rect(x, 10, 340, 400, { fill: '#FFFFFF', stroke: c, w: 2.2 });
    s += rect(x, 10, 340, 66, { fill, stroke: c, w: 2.2 });
    s += text(x + 170, 40, head, { anchor: 'middle', size: 20, bold: true, fill: c });
    s += text(x + 170, 64, sub, { anchor: 'middle', size: 15 });
    rows.forEach(([name, place], i) => {
      const y = 92 + i * 104;
      s += rect(x + 16, y, 308, 90, { fill: SOFT, stroke: LINE });
      s += text(x + 32, y + 34, name, { size: 18, bold: true });
      s += lines(x + 32, y + 62, place, { size: 15, fill: GREY });
    });
    return s;
  };
  b += col(10, 'Extensive', 'Few inputs per hectare, large areas', [['Shifting cultivation', 'Amazon basin, Brazil'], ['Nomadic herding', 'grasslands of Mongolia'], ['Ranching', 'the Pampas, Argentina']], VERM, WARM);
  b += col(370, 'Intensive', 'Many inputs per hectare, small areas', [['Market gardening', 'near Rotterdam, Netherlands'], ['Plantation agriculture', 'oil palm in Malaysia'], ['Mixed crop and livestock', 'the Corn Belt, Iowa']], TEAL, TINT);
  b += line(60, 440, 660, 440, { stroke: INK, w: 2.4, arrow: 'ink' });
  b += text(360, 470, 'More labor, money and machines per hectare', { anchor: 'middle', size: 16, bold: true });
  add('agriculture-intro', 'agriculture-intro-two-kinds', 720, 486, 'Extensive and intensive agriculture',
    'Two columns. Extensive agriculture uses few inputs per hectare over large areas: shifting cultivation in the Amazon basin of Brazil, nomadic herding on the grasslands of Mongolia and ranching on the Pampas of Argentina. Intensive agriculture uses many inputs per hectare on small areas: market gardening near Rotterdam in the Netherlands, plantation agriculture such as oil palm in Malaysia, and mixed crop and livestock farming in the Corn Belt of Iowa. An arrow below points from extensive to intensive: more labor, money and machines per hectare.', b);
}

/* ---------------------------------------------------- settlement-survey */
function surveyPanels(named) {
  let b = '';
  const P = 232, H = 300, top = named ? 46 : 46;
  const titles = ['Metes and bounds', 'Township and range', 'Long lot'];
  for (let i = 0; i < 3; i++) {
    const x = 8 + i * (P + 8);
    b += rect(x, top, P, H, { fill: FIELD2, stroke: INK, w: 1.6, rx: 2 });
    if (named) b += text(x + P / 2, 30, titles[i], { anchor: 'middle', size: 18, bold: true, fill: TEAL });
    else b += badge(x + P / 2, 24, String(i + 1));
  }
  // Panel 1: irregular parcels following a stream, a tree and a rock as markers.
  {
    const x = 8, y = top;
    b += path(`M${x + 20},${y} C${x + 60},${y + 80} ${x + 30},${y + 150} ${x + 100},${y + 200} S${x + 180},${y + 260} ${x + 200},${y + 300}`, { stroke: '#4A90B8', w: 7 });
    const parcels = [
      `M${x},${y} L${x + 24},${y} C${x + 62},${y + 80} ${x + 34},${y + 150} ${x + 70},${y + 180} L${x + 20},${y + 210} L${x},${y + 170} Z`,
      `M${x + 24},${y} L${x + 150},${y} L${x + 170},${y + 90} L${x + 70},${y + 180} C${x + 34},${y + 150} ${x + 62},${y + 80} ${x + 24},${y} Z`,
      `M${x + 150},${y} L${x + 232},${y} L${x + 232},${y + 140} L${x + 170},${y + 90} Z`,
      `M${x + 170},${y + 90} L${x + 232},${y + 140} L${x + 232},${y + 300} L${x + 200},${y + 300} C${x + 180},${y + 260} ${x + 160},${y + 240} ${x + 100},${y + 200} Z`,
      `M${x},${y + 170} L${x + 20},${y + 210} L${x + 70},${y + 180} L${x + 100},${y + 200} C${x + 160},${y + 240} ${x + 180},${y + 260} ${x + 200},${y + 300} L${x},${y + 300} Z`,
    ];
    const fills = [FIELD, '#D7E8B8', FIELD, '#D7E8B8', '#CFE3A9'];
    parcels.forEach((d, k) => { b += path(d, { fill: fills[k], stroke: INK, w: 1.6, op: 0.85 }); });
    b += path(`M${x + 20},${y} C${x + 60},${y + 80} ${x + 30},${y + 150} ${x + 100},${y + 200} S${x + 180},${y + 260} ${x + 200},${y + 300}`, { stroke: '#4A90B8', w: 6 });
    b += tree(x + 170, y + 96, 1.5) + circle(x + 70, y + 186, 7, { fill: '#9A9A9A', stroke: INK, w: 1 });
    b += tree(x + 150, y + 10, 1.3);
  }
  // Panel 2: a square grid with straight roads.
  {
    const x = 8 + P + 8, y = top, c = P / 4, r = H / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) b += rect(x + i * c, y + j * r, c, r, { fill: (i + j) % 2 ? FIELD : '#D7E8B8', stroke: INK, w: 1, rx: 0 });
    b += line(x + 2 * c, y, x + 2 * c, y + H, { stroke: '#7A7A7A', w: 5 }) + line(x, y + 2 * r, x + P, y + 2 * r, { stroke: '#7A7A7A', w: 5 });
    b += house(x + 2 * c - 12, y + r - 8) + house(x + 3 * c + 20, y + 3 * r + 30) + house(x + c - 20, y + 2 * r + 30);
  }
  // Panel 3: long narrow strips running back from a river.
  {
    const x = 8 + 2 * (P + 8), y = top;
    for (let k = 0; k < 8; k++) b += rect(x + k * (P / 8), y, P / 8, H - 52, { fill: k % 2 ? FIELD : '#D7E8B8', stroke: INK, w: 1, rx: 0 });
    b += rect(x, y + H - 52, P, 52, { fill: WATER, stroke: INK, w: 1.6, rx: 0 });
    for (let k = 0; k < 8; k++) b += house(x + k * (P / 8) + P / 16, y + H - 60, 0.9);
  }
  return b;
}
add('settlement-survey', 'settlement-survey-methods', 720, 356, 'Three survey methods seen from above',
  'Three panels drawn from above. Metes and bounds: odd-shaped fields whose edges follow a winding stream, a tree and a rock. Township and range: a grid of equal squares with straight roads at right angles. Long lot: narrow strips of land side by side, each running back from a river, with a farmhouse at the river end of each strip.', surveyPanels(true));
add('settlement-survey', 'settlement-survey-methods-numbered', 720, 356, 'Three ways of dividing farmland, seen from above',
  'Three numbered panels drawn from above. Panel 1: odd-shaped fields whose edges follow a winding stream, a tree and a rock. Panel 2: a grid of equal squares with straight roads at right angles and a few farmhouses. Panel 3: narrow strips of land side by side, each running back from a river, with a house at the river end of each strip.', surveyPanels(false));
{
  let b = '';
  const P = 232, H = 250, top = 46;
  ['Clustered', 'Dispersed', 'Linear'].forEach((t, i) => {
    const x = 8 + i * (P + 8);
    b += rect(x, top, P, H, { fill: '#D7E8B8', stroke: INK, w: 1.6, rx: 2 });
    b += text(x + P / 2, 30, t, { anchor: 'middle', size: 18, bold: true, fill: TEAL });
  });
  // clustered: houses in a tight village around a church, fields all around
  { const cx = 8 + P / 2, cy = top + H / 2;
    b += circle(cx, cy, 52, { fill: SAND, stroke: GREY, w: 1 });
    [[-30, -20], [-10, -30], [12, -24], [30, -10], [-34, 8], [-14, 4], [8, 6], [28, 16], [-22, 28], [0, 30], [20, 34]].forEach(([dx, dy]) => { b += house(cx + dx, cy + dy, 1); });
  }
  // dispersed: one house on each farm
  { const x = 8 + P + 8;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) b += rect(x + i * P / 3, top + j * H / 3, P / 3, H / 3, { fill: (i + j) % 2 ? FIELD : '#D7E8B8', stroke: GREY, w: 1, rx: 0 });
    [[30, 40], [120, 30], [200, 60], [50, 130], [140, 120], [190, 150], [40, 220], [110, 210], [190, 230]].forEach(([dx, dy]) => { b += house(x + dx, top + dy, 1); });
  }
  // linear: houses strung along a road
  { const x = 8 + 2 * (P + 8);
    b += path(`M${x},${top + 140} C${x + 60},${top + 110} ${x + 150},${top + 170} ${x + P},${top + 130}`, { stroke: '#7A7A7A', w: 8 });
    [[16, 128], [44, 118], [72, 118], [100, 128], [128, 140], [156, 146], [184, 144], [212, 136]].forEach(([dx, dy]) => { b += house(x + dx, top + dy - 6, 1) + house(x + dx + 6, top + dy + 30, 1); });
  }
  add('settlement-survey', 'settlement-survey-patterns', 720, 306, 'Clustered, dispersed and linear rural settlement',
    'Three panels drawn from above. Clustered: about a dozen houses packed together in one village, with fields all around it. Dispersed: a grid of farm fields with one farmhouse standing alone on each field. Linear: houses lined up along both sides of one winding road, with fields behind them.', b);
}

/* ---------------------------------------------------- agricultural-origins */
{
  let b = '';
  b += rect(10, 60, 260, 300, { fill: MINT, stroke: GREEN, w: 2.2 });
  b += text(140, 92, 'From the Americas', { anchor: 'middle', size: 19, bold: true, fill: '#00694D' });
  ['maize (corn)', 'potatoes', 'tomatoes', 'cacao (chocolate)', 'cassava', 'chili peppers'].forEach((s, i) => { b += text(34, 128 + i * 36, s, { size: 17 }); });
  b += rect(450, 60, 260, 300, { fill: TINT, stroke: TEAL, w: 2.2 });
  b += text(580, 92, 'From Afro-Eurasia', { anchor: 'middle', size: 19, bold: true, fill: TEAL });
  ['wheat and rice', 'sugarcane', 'coffee', 'cattle, pigs, horses', 'chickens', 'diseases: smallpox,', 'measles'].forEach((s, i) => { b += text(474, 128 + i * 32, s, { size: 17, fill: i >= 5 ? VERM : INK, bold: i >= 5 }); });
  b += path('M276,160 C330,130 390,130 444,160', { stroke: GREEN, w: 3, arrow: 'green' });
  b += path('M444,260 C390,290 330,290 276,260', { stroke: TEAL, w: 3, arrow: 'teal' });
  b += text(360, 210, 'Atlantic', { anchor: 'middle', size: 16, italic: true, fill: GREY });
  b += text(360, 30, 'The Columbian Exchange, after 1492', { anchor: 'middle', size: 20, bold: true });
  b += text(360, 392, 'Plants, animals and diseases crossed the ocean in both directions.', { anchor: 'middle', size: 15, fill: GREY });
  add('agricultural-origins', 'agricultural-origins-exchange', 720, 408, 'The Columbian Exchange',
    'Two boxes joined by arrows across the Atlantic, titled the Columbian Exchange, after 1492. From the Americas to Europe, Africa and Asia: maize (corn), potatoes, tomatoes, cacao, cassava and chili peppers. From Afro-Eurasia to the Americas: wheat and rice, sugarcane, coffee, cattle, pigs, horses and chickens, and diseases such as smallpox and measles. Plants, animals and diseases crossed the ocean in both directions.', b);
}

/* ---------------------------------------------------- second-agricultural-revolution */
{
  let b = '';
  b += text(360, 30, 'A four-field rotation (Norfolk, England, 1700s)', { anchor: 'middle', size: 19, bold: true });
  const crops = [['Wheat', 'grain to sell', FIELD2], ['Turnips', 'winter feed\nfor animals', '#E9C9B0'], ['Barley', 'grain', '#EFE2A4'], ['Clover', 'grazing; puts\nnitrogen in soil', FIELD]];
  const pos = [[150, 60], [380, 60], [380, 250], [150, 250]];
  crops.forEach(([n, s, f], i) => {
    const [x, y] = pos[i];
    b += rect(x, y, 190, 150, { fill: f, stroke: INK, w: 1.8, rx: 6 });
    b += text(x + 95, y + 50, n, { anchor: 'middle', size: 20, bold: true });
    b += lines(x + 95, y + 84, s, { anchor: 'middle', size: 15 });
  });
  b += path('M342,135 L376,135', { stroke: TEAL, w: 3, arrow: 'teal' }) + path('M475,212 L475,246', { stroke: TEAL, w: 3, arrow: 'teal' }) +
    path('M376,325 L342,325', { stroke: TEAL, w: 3, arrow: 'teal' }) + path('M245,246 L245,212', { stroke: TEAL, w: 3, arrow: 'teal' });
  b += lines(16, 120, 'Each year,\nevery field\nmoves to the\nnext crop.', { size: 15, fill: TEAL, bold: true });
  b += lines(584, 120, 'No field is\nleft empty,\nso more food\nand more\nanimals.', { size: 15, fill: TEAL, bold: true });
  add('second-agricultural-revolution', 'second-agricultural-revolution-rotation', 720, 420, 'A four-field crop rotation',
    'Four fields in a square, linked by arrows that go around in a circle: wheat (grain to sell), then turnips (winter feed for animals), then barley (grain), then clover (grazing that puts nitrogen back in the soil), then wheat again. Each year every field moves to the next crop. No field is left empty, so the farm grows more food and can feed more animals. This rotation spread from Norfolk, England, in the 1700s.', b);
}

/* ---------------------------------------------------- green-revolution */
{
  let b = '';
  const ins = ['High-yield seeds', 'Chemical fertilizer', 'Irrigation water', 'Pesticides and machines'];
  ins.forEach((s, i) => { b += box(10, 20 + i * 78, 220, 60, s, { fill: TINT, size: 16, bold: true }); b += line(232, 50 + i * 78, 290, 170, { stroke: TEAL, w: 2, arrow: 'teal' }); });
  b += box(296, 130, 160, 84, 'More grain\nper hectare', { fill: '#FFFFFF', stroke: INK, w: 2.6, size: 18, bold: true });
  b += line(458, 160, 498, 92, { stroke: GREEN, w: 2.4, arrow: 'green' }) + line(458, 186, 498, 252, { stroke: VERM, w: 2.4, arrow: 'verm' });
  b += rect(500, 20, 210, 140, { fill: MINT, stroke: GREEN, w: 2 }) + text(605, 48, 'Benefits', { anchor: 'middle', size: 18, bold: true, fill: '#00694D' }) +
    lines(516, 78, 'more food grown\nfewer famines\nlower grain prices', { size: 15 });
  b += rect(500, 182, 210, 150, { fill: WARM, stroke: VERM, w: 2 }) + text(605, 210, 'Costs', { anchor: 'middle', size: 18, bold: true, fill: VERM }) +
    lines(516, 240, 'heavy water use\nchemical runoff\ndebt for small farms\nfewer crop varieties', { size: 15 });
  b += text(360, 372, 'The Green Revolution package, about 1960s to 1980s', { anchor: 'middle', size: 17, bold: true, fill: TEAL });
  add('green-revolution', 'green-revolution-package', 720, 390, 'The Green Revolution package',
    'Four inputs on the left: high-yield seeds, chemical fertilizer, irrigation water, and pesticides and machines. Arrows from all four lead to one box: more grain per hectare. From it, one arrow leads to benefits (more food grown, fewer famines, lower grain prices) and one to costs (heavy water use, chemical runoff, debt for small farms, fewer crop varieties). Caption: the Green Revolution package, about the 1960s to the 1980s.', b);
}
{
  let b = '';
  const items = [['First\nAgricultural\nRevolution', 'from about\n12,000 years ago', 'plants and animals\ndomesticated'], ['Second\nAgricultural\nRevolution', '1700s and 1800s', 'rotation, new\ntools, machines'], ['Green\nRevolution', 'about 1960s\nto 1980s', 'high-yield seeds,\nfertilizer'], ['Genetically\nmodified\ncrops', 'from the\nlate 1990s', 'genes changed\nin a lab']];
  b += line(30, 70, 700, 70, { stroke: INK, w: 3, arrow: 'ink' });
  items.forEach(([n, d, w], i) => {
    const x = 20 + i * 172;
    b += circle(x + 80, 70, 10, { fill: i === 3 ? PURP : TEAL });
    b += rect(x, 100, 160, 190, { fill: i === 3 ? '#F4E6EF' : TINT, stroke: i === 3 ? PURP : TEAL, w: 1.8 });
    b += lines(x + 80, 128, n, { anchor: 'middle', size: 16, bold: true });
    b += lines(x + 80, 208, d, { anchor: 'middle', size: 15, fill: VERM, bold: true });
    b += lines(x + 80, 258, w, { anchor: 'middle', size: 15 });
  });
  b += text(360, 36, 'Big changes in farming, in order', { anchor: 'middle', size: 19, bold: true });
  add('green-revolution', 'green-revolution-timeline', 720, 330, 'Big changes in farming, in order',
    'A timeline with four boxes. First Agricultural Revolution, from about 12,000 years ago: plants and animals domesticated. Second Agricultural Revolution, 1700s and 1800s: crop rotation, new tools and machines. Green Revolution, about the 1960s to the 1980s: high-yield seeds and fertilizer. Genetically modified crops, from the late 1990s: genes changed in a lab. The last box is a different color: it came after the Green Revolution and is not part of it.', b);
}

/* ---------------------------------------------------- production-regions: bid-rent */
{
  let b = '';
  const X0 = 90, Y0 = 380, W = 580, H = 320;
  const xs = d => X0 + d / 100 * W, ys = r => Y0 - r / 100 * H;
  // three bid-rent lines: rent = a - b * distance
  const L = [{ n: 'Market gardening', a: 95, k: 2.2, c: VERM }, { n: 'Grain', a: 60, k: 0.9, c: TEAL }, { n: 'Ranching', a: 26, k: 0.26, c: GREEN }];
  const cross = (p, q) => (p.a - q.a) / (p.k - q.k);
  const d1 = cross(L[0], L[1]), d2 = cross(L[1], L[2]), dEnd = L[2].a / L[2].k;
  for (const l of L) b += line(xs(0), ys(l.a), xs(Math.min(100, l.a / l.k)), ys(Math.max(0, l.a - l.k * Math.min(100, l.a / l.k))), { stroke: l.c, w: 3 });
  b += line(X0, Y0, X0, Y0 - H - 10, { w: 2, arrow: 'ink' }) + line(X0, Y0, X0 + W + 10, Y0, { w: 2, arrow: 'ink' });
  b += lines(20, 60, 'Rent a\nfarmer\ncan pay', { size: 15, bold: true });
  b += text(X0 + W / 2, Y0 + 60, 'Distance from the market', { anchor: 'middle', size: 16, bold: true });
  b += text(X0, Y0 + 22, 'Market', { anchor: 'middle', size: 15 });
  // highest-bidder bands under the axis
  const bands = [[0, d1, L[0]], [d1, d2, L[1]], [d2, Math.min(100, dEnd), L[2]]];
  for (const [a, c, l] of bands) b += rect(xs(a), Y0 + 30, xs(c) - xs(a), 12, { fill: l.c, rx: 2 });
  b += text(xs(8), ys(95) + 4, 'Market gardening', { size: 16, bold: true, fill: VERM });
  b += text(xs(36), ys(36), 'Grain', { size: 16, bold: true, fill: TEAL });
  b += text(xs(62), ys(13) - 6, 'Ranching', { size: 16, bold: true, fill: GREEN });
  add('production-regions', 'production-regions-bid-rent', 720, 456, 'Bid-rent lines for three kinds of farming',
    'A graph. The vertical axis is the rent a farmer can pay for a hectare of land; the horizontal axis is distance from the market. Three falling lines: market gardening starts highest and falls fastest, grain starts in the middle and falls more slowly, ranching starts lowest and falls slowest. A colored band under the axis shows which use can pay the most at each distance: market gardening nearest the market, then grain, then ranching farthest away.', b);
}

/* ---------------------------------------------------- farm-organization: commodity chain */
{
  let b = '';
  const steps = [['Inputs', 'seed,\nfertilizer,\nmachines'], ['Farm', 'grows the\ncrop'], ['Processor', 'mills, packs,\ncooks'], ['Distributor', 'ships and\nstores'], ['Store', 'sells to\nshoppers'], ['Consumer', 'buys and\neats']];
  steps.forEach(([n, s], i) => {
    const x = 6 + i * 119;
    b += rect(x, 90, 104, 130, { fill: i === 1 ? MINT : TINT, stroke: i === 1 ? GREEN : TEAL, w: 2 });
    b += text(x + 52, 122, n, { anchor: 'middle', size: 16, bold: true });
    b += lines(x + 52, 158, s, { anchor: 'middle', size: 15 });
    if (i < 5) b += line(x + 106, 155, x + 117, 155, { stroke: INK, w: 2.2, arrow: 'ink' });
  });
  b += text(360, 34, 'A commodity chain: every step from seed to plate', { anchor: 'middle', size: 18, bold: true });
  b += path('M10,250 L10,262 L470,262 L470,250', { stroke: VERM, w: 2.4 });
  b += lines(240, 290, 'One agribusiness may own or control\nseveral steps (vertical integration)', { anchor: 'middle', size: 15, bold: true, fill: VERM });
  add('farm-organization', 'farm-organization-chain', 720, 330, 'A commodity chain from seed to plate',
    'Six boxes joined by arrows, left to right: inputs (seed, fertilizer, machines), farm (grows the crop), processor (mills, packs, cooks), distributor (ships and stores), store (sells to shoppers) and consumer (buys and eats). A bracket under the first four boxes says one agribusiness may own or control several steps, which is called vertical integration.', b);
}

/* ---------------------------------------------------- von-thunen */
function rings(cx, cy, R, fills) {
  let s = '';
  for (let i = R.length - 1; i >= 0; i--) s += circle(cx, cy, R[i], { fill: fills[i], stroke: INK, w: 1.4 });
  return s;
}
{
  let b = '';
  const cx = 230, cy = 230, R = [50, 95, 150, 210];
  b += rect(4, 4, 452, 452, { fill: '#EFEBDD', stroke: LINE, rx: 4 });
  b += rings(cx, cy, R, [VERM, FOREST, FIELD2, FIELD]);
  b += circle(cx, cy, 16, { fill: '#FFFFFF', stroke: INK, w: 2 }) + text(cx, cy + 6, 'M', { anchor: 'middle', size: 16, bold: true });
  [[cx, cy - 72, '1'], [cx, cy - 122, '2'], [cx, cy - 180, '3'], [cx + 150, cy + 150, '4']].forEach(([x, y, s]) => { b += badge(x, y, s, { r: 14 }); });
  const leg = [['M', 'Market town', '#FFFFFF'], ['1', 'Market gardening\nand dairy', VERM], ['2', 'Forest (wood\nfor fuel, building)', FOREST], ['3', 'Grain and\nfield crops', FIELD2], ['4', 'Livestock ranching', FIELD]];
  leg.forEach(([k, s, f], i) => {
    const y = 26 + i * 84;
    b += rect(476, y, 36, 36, { fill: f, stroke: INK, w: 1.4, rx: 4 }) + text(494, y + 24, k, { anchor: 'middle', size: 16, bold: true, fill: k === '1' || k === '2' ? '#FFFFFF' : INK });
    b += lines(524, y + 14, s, { size: 15 });
  });
  b += lines(476, 446, 'Beyond ring 4:\nwilderness', { size: 15, fill: GREY });
  add('von-thunen', 'von-thunen-rings', 720, 470, 'Von Thünen model: rings of land use around one market',
    'Concentric rings around a market town M on a flat plain. Ring 1, nearest the market: market gardening and dairy. Ring 2: forest, for wood used as fuel and for building. Ring 3: grain and field crops. Ring 4: livestock ranching. Beyond ring 4 is wilderness.', b);
}
{
  // The stimulus: an invented region where a river and a second town bend the rings.
  let b = '';
  b += rect(4, 4, 712, 412, { fill: '#EFEBDD', stroke: LINE, rx: 4 });
  const cx = 300, cy = 210;
  const zones = [[300, 150, FIELD], [235, 112, FIELD2], [170, 78, FOREST], [95, 44, VERM]];
  for (const [rx, ry, f] of zones) b += ellipse(cx, cy, rx, ry, { fill: f, stroke: INK, w: 1.4 });
  b += path(`M4,${cy} L716,${cy}`, { stroke: '#4A90B8', w: 9 });
  b += text(660, cy - 12, 'River', { anchor: 'middle', size: 15, italic: true, fill: '#1F5F82' });
  // second small town with its own small ring
  b += circle(620, 330, 44, { fill: VERM, stroke: INK, w: 1.4 }) + circle(620, 330, 12, { fill: '#FFFFFF', stroke: INK, w: 2 });
  b += text(620, 392, 'Small town', { anchor: 'middle', size: 15, bold: true });
  b += circle(cx, cy, 16, { fill: '#FFFFFF', stroke: INK, w: 2 }) + rect(cx - 52, cy - 44, 104, 24, { fill: '#FFFFFF', stroke: INK, w: 1, rx: 4 }) + text(cx, cy - 26, 'Market town', { anchor: 'middle', size: 15, bold: true });
  b += badge(cx + 22, cy + 27, 'W', { r: 14 }) + badge(cx + 22, cy + 61, 'X', { r: 14 }) + badge(cx + 22, cy + 95, 'Y', { r: 14 }) + badge(cx + 22, cy + 131, 'Z', { r: 14 });
  b += badge(70, 60, 'V', { r: 15 });
  add('von-thunen', 'von-thunen-river', 720, 420, 'Land use around an invented market town with a river',
    'A drawn map of an invented region. Zones of land use surround a market town in stretched ovals that are much longer east to west, along a river, than north to south. Zones are lettered from the town outward: W nearest the town, then X, Y and Z. Area V, in the far corner, lies outside all the zones. A small town in the southeast has its own small zone the same color as zone W around it.', b);
}

/* ---------------------------------------------------- global-agriculture */
{
  let b = '';
  const steps = [['Farm', 'Ecuador'], ['Packing\nhouse', 'washed,\nboxed'], ['Port', 'Guayaquil'], ['Cold ship', 'kept at\nabout\n13 °C'], ['Port', 'United\nStates'], ['Ripening\ncenter', 'gas\nripens\nfruit'], ['Store', 'shopper\nbuys']];
  steps.forEach(([n, s], i) => {
    const x = 4 + i * 102;
    const sea = i === 3;
    b += rect(x, 70, 92, 150, { fill: sea ? '#DCEEF6' : i < 3 ? MINT : TINT, stroke: sea ? '#1F5F82' : i < 3 ? GREEN : TEAL, w: 2 });
    b += lines(x + 46, 104, n, { anchor: 'middle', size: 15, bold: true });
    b += lines(x + 46, 162, s, { anchor: 'middle', size: 15 });
    if (i < 6) b += line(x + 93, 145, x + 101, 145, { stroke: INK, w: 2, arrow: 'ink' });
  });
  b += text(360, 36, 'A global supply chain for bananas', { anchor: 'middle', size: 19, bold: true });
  b += path('M8,240 L8,252 L298,252 L298,240', { stroke: GREEN, w: 2.4 }) + text(153, 276, 'In the exporting country', { anchor: 'middle', size: 15, bold: true, fill: '#00694D' });
  b += path('M412,240 L412,252 L712,252 L712,240', { stroke: TEAL, w: 2.4 }) + text(562, 276, 'In the importing country', { anchor: 'middle', size: 15, bold: true, fill: TEAL });
  b += text(360, 314, 'Each step adds cost and value; a delay at any step can spoil the fruit.', { anchor: 'middle', size: 15, fill: GREY });
  add('global-agriculture', 'global-agriculture-banana-chain', 720, 330, 'A global supply chain for bananas',
    'Seven boxes joined by arrows: a farm in Ecuador, a packing house where fruit is washed and boxed, the port of Guayaquil, a refrigerated ship kept at about 13 degrees Celsius, a port in the United States, a ripening center where gas ripens the fruit, and a store where a shopper buys it. The first three steps are in the exporting country and the last three in the importing country. Each step adds cost and value, and a delay at any step can spoil the fruit.', b);
}

/* ---------------------------------------------------- agriculture-consequences */
{
  let b = '';
  const P = 232, H = 260, top = 46;
  for (let i = 0; i < 3; i++) { b += rect(8 + i * (P + 8), top, P, H, { fill: '#EAF4F8', stroke: INK, w: 1.6, rx: 2 }); b += badge(8 + i * (P + 8) + P / 2, 24, String(i + 1)); }
  // 1: terraces on a steep slope, side view
  { const x = 8, y = top;
    b += path(`M${x},${y + H} L${x},${y + 60} L${x + P},${y + H - 10} L${x + P},${y + H} Z`, { fill: BROWN });
    for (let k = 0; k < 7; k++) { const sx = x + k * 32, sy = y + 66 + k * 26; b += path(`M${sx},${sy} L${sx + 32},${sy} L${sx + 32},${sy + 26}`, { stroke: '#6B6B6B', w: 3 }); b += rect(sx, sy - 6, 32, 6, { fill: GREEN, rx: 0 }); }
  }
  // 2: circles of irrigated crops from above
  { const x = 8 + P + 8, y = top;
    b += rect(x, y, P, H, { fill: '#E3D3A8', rx: 2, stroke: INK, w: 1.6 });
    [[60, 70], [170, 70], [60, 190], [170, 190]].forEach(([dx, dy], k) => { b += circle(x + dx, y + dy, 50, { fill: k === 2 ? '#D9C795' : FIELD, stroke: '#5E8A3E', w: 1.4 }); b += line(x + dx, y + dy, x + dx + 46, y + dy - 18, { stroke: '#6B6B6B', w: 2 }); });
  }
  // 3: forest with a cleared, burned patch and smoke
  { const x = 8 + 2 * (P + 8), y = top;
    b += rect(x, y, P, H, { fill: FOREST, rx: 2, stroke: INK, w: 1.6 });
    for (let k = 0; k < 22; k++) b += circle(x + 14 + (k * 47) % 206, y + 18 + Math.floor(k * 47 / 206) * 44, 14, { fill: '#3E7550' });
    b += path(`M${x + 60},${y + 150} L${x + 170},${y + 140} L${x + 190},${y + 230} L${x + 50},${y + 240} Z`, { fill: '#7A5A3A', stroke: INK, w: 1 });
    b += path(`M${x + 110},${y + 180} C${x + 90},${y + 140} ${x + 130},${y + 120} ${x + 110},${y + 80}`, { stroke: '#9A9A9A', w: 8 });
    [[80, 220], [140, 200], [160, 225]].forEach(([dx, dy]) => { b += rect(x + dx, y + dy, 10, 6, { fill: '#2B2B2B', rx: 1 }); });
  }
  add('agriculture-consequences', 'agriculture-consequences-scenes', 720, 316, 'Three farm landscapes',
    'Three numbered drawn scenes. Scene 1, seen from the side: a steep hillside cut into seven flat steps, each with a strip of green crops held up by a stone wall. Scene 2, seen from above: four large green circles of crops on dry tan land, each with a long pipe arm turning around its center. Scene 3, seen from above: thick forest with one patch cleared and burned brown, smoke rising and a few charred logs on the ground.', b);
}
{
  let b = '';
  const steps = ['Farmers irrigate\ndry land for\nyears', 'Water evaporates\nin the hot sun', 'Salts in the water\nare left behind\nin the soil', 'Crops grow poorly;\nsome fields are\nabandoned'];
  steps.forEach((s, i) => {
    const x = 6 + i * 180;
    b += box(x, 60, 160, 130, s, { fill: i === 3 ? WARM : TINT, stroke: i === 3 ? VERM : TEAL, size: 16 });
    if (i < 3) b += line(x + 162, 125, x + 178, 125, { stroke: INK, w: 2.4, arrow: 'ink' });
  });
  b += text(360, 34, 'How irrigation can lead to salinization', { anchor: 'middle', size: 19, bold: true });
  b += lines(360, 230, 'Fixes: drain fields, flush salts with extra water,\nuse drip irrigation that wets only the roots.', { anchor: 'middle', size: 15, fill: GREY });
  add('agriculture-consequences', 'agriculture-consequences-salinization', 720, 272, 'How irrigation can lead to salinization',
    'Four boxes joined by arrows: farmers irrigate dry land for years; the water evaporates in the hot sun; salts in the water are left behind in the soil; crops grow poorly and some fields are abandoned. Below: fixes include draining fields, flushing salts with extra water and drip irrigation that wets only the roots.', b);
}

/* ---------------------------------------------------- agriculture-challenges: food desert */
{
  let b = '';
  b += rect(4, 4, 712, 452, { fill: '#F1F1EC', stroke: LINE, rx: 4 });
  for (let i = 0; i < 9; i++) b += line(4 + i * 89, 4, 4 + i * 89, 456, { stroke: '#FFFFFF', w: 6 });
  for (let j = 0; j < 6; j++) b += line(4, 4 + j * 90, 716, 4 + j * 90, { stroke: '#FFFFFF', w: 6 });
  b += circle(560, 140, 130, { fill: '#009E73', op: 0.12, stroke: GREEN, w: 2.4 });
  b += rect(540, 122, 40, 36, { fill: GREEN, stroke: INK, w: 1.6, rx: 4 }) + text(560, 147, 'S', { anchor: 'middle', size: 18, bold: true, fill: '#FFFFFF' });
  b += text(560, 300, '1 mile', { anchor: 'middle', size: 15, bold: true, fill: '#00694D' });
  b += line(560, 140, 560, 270, { stroke: GREEN, w: 2, dash: '5 4' });
  b += rect(40, 250, 330, 190, { fill: '#C24E00', op: 0.1, stroke: VERM, w: 2.4, dash: '8 5' });
  b += text(205, 276, 'Neighborhood N', { anchor: 'middle', size: 16, bold: true, fill: VERM });
  [[110, 340], [260, 380]].forEach(([x, y]) => { b += rect(x - 16, y - 14, 32, 28, { fill: VERM, stroke: INK, w: 1.4, rx: 4 }) + text(x, y + 6, 'C', { anchor: 'middle', size: 16, bold: true, fill: '#FFFFFF' }); });
  b += path('M20,200 L716,200', { stroke: PURP, w: 3, dash: '10 6' }) + text(80, 190, 'Bus line', { anchor: 'middle', size: 15, bold: true, fill: PURP });
  const leg = [['S', 'Supermarket: fresh food', GREEN], ['C', 'Corner store: snacks, little fresh food', VERM]];
  leg.forEach(([k, s, f], i) => { b += rect(400, 360 + i * 40, 28, 26, { fill: f, rx: 4 }) + text(414, 379 + i * 40, k, { anchor: 'middle', size: 15, bold: true, fill: '#FFFFFF' }) + text(436, 379 + i * 40, s, { size: 15 }); });
  add('agriculture-challenges', 'agriculture-challenges-food-desert', 720, 460, 'An invented town: where fresh food is sold',
    'A drawn street grid of an invented town. One supermarket, marked S, is in the northeast, with a circle showing everything within 1 mile of it. Neighborhood N, in the southwest, is outside that circle; it has two corner stores, marked C, that sell snacks and little fresh food. A bus line runs east to west between the neighborhood and the supermarket.', b);
}

/* ---------------------------------------------------- women-in-agriculture (FAO 2023 data) */
{
  let b = '';
  const data = [['World', 36, 38], ['Sub-Saharan\nAfrica', 66, 60], ['Southern Asia', 71, 47]];
  const X0 = 70, Y0 = 360, H = 260, G = 210;
  for (let v = 0; v <= 80; v += 20) { const y = Y0 - v / 80 * H; b += line(X0, y, 700, y, { stroke: v ? '#E3E8E7' : INK, w: v ? 1 : 2 }) + text(X0 - 10, y + 5, `${v}%`, { anchor: 'end', size: 15 }); }
  data.forEach(([n, w, m], i) => {
    const x = X0 + 40 + i * G;
    b += rect(x, Y0 - w / 80 * H, 60, w / 80 * H, { fill: PURP, rx: 0 }) + text(x + 30, Y0 - w / 80 * H - 8, `${w}%`, { anchor: 'middle', size: 15, bold: true });
    b += rect(x + 66, Y0 - m / 80 * H, 60, m / 80 * H, { fill: TEAL, rx: 0 }) + text(x + 96, Y0 - m / 80 * H - 8, `${m}%`, { anchor: 'middle', size: 15, bold: true });
    b += lines(x + 63, Y0 + 24, n, { anchor: 'middle', size: 15 });
  });
  b += rect(470, 14, 22, 18, { fill: PURP, rx: 0 }) + text(500, 29, 'Working women', { size: 15 });
  b += rect(470, 40, 22, 18, { fill: TEAL, rx: 0 }) + text(500, 55, 'Working men', { size: 15 });
  b += lines(10, 24, 'Share of workers\nwhose job is in\nagrifood systems', { size: 15, bold: true });
  b += text(360, 426, 'Source: FAO, The Status of Women in Agrifood Systems, 2023.', { anchor: 'middle', size: 15, fill: GREY });
  add('women-in-agriculture', 'women-in-agriculture-jobs', 720, 440, 'Share of working women and men employed in agrifood systems',
    'A bar chart from FAO, The Status of Women in Agrifood Systems, 2023. Share of workers whose job is in agrifood systems: world, 36% of working women and 38% of working men; Sub-Saharan Africa, 66% of women and 60% of men; Southern Asia, 71% of women and 47% of men.', b);
}

mkdirSync(FIG, { recursive: true }); mkdirSync(REG, { recursive: true });
const byTopic = {};
for (const f of figs) {
  if (/[–—]/.test(f.svg)) throw new Error(`${f.id}: no em or en dashes`);
  writeFileSync(join(FIG, `${f.id}.svg`), f.svg);
  (byTopic[f.topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
}
for (const [t, entries] of Object.entries(byTopic)) writeFileSync(join(REG, `${t}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`author E: ${figs.length} figures in ${Object.keys(byTopic).length} topics`);
