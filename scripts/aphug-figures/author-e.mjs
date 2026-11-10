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
const badge = (x, y, s, o = {}) => circle(x, y, o.r || 18, { fill: o.fill || "#FFFFFF", stroke: o.stroke || INK, w: 2 }) + text(x, y + 7, s, { anchor: "middle", size: o.size || 20, bold: true, fill: o.ink || INK });
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
  const W = 480;
  const sec = (y, head, sub, rows, c, fill) => {
    let s = rect(6, y, W - 12, 294, { fill: '#FFFFFF', stroke: c, w: 2.2 });
    s += rect(6, y, W - 12, 62, { fill, stroke: c, w: 2.2 });
    s += text(W / 2, y + 28, head, { anchor: 'middle', size: 22, bold: true, fill: c });
    s += text(W / 2, y + 52, sub, { anchor: 'middle', size: 17 });
    rows.forEach(([name, place], i) => { const yy = y + 74 + i * 72; s += rect(20, yy, W - 40, 62, { fill: SOFT, stroke: LINE }); s += text(34, yy + 26, name, { size: 19, bold: true }); s += text(34, yy + 50, place, { size: 17, fill: GREY }); });
    return s;
  };
  b += sec(6, 'Extensive', 'Few inputs per hectare, large areas', [['Shifting cultivation', 'Amazon basin, Brazil'], ['Nomadic herding', 'grasslands of Mongolia'], ['Ranching', 'the Pampas, Argentina']], VERM, WARM);
  b += sec(314, 'Intensive', 'Many inputs per hectare, small areas', [['Market gardening', 'near Rotterdam, Netherlands'], ['Plantation agriculture', 'oil palm in Malaysia'], ['Mixed crop and livestock', 'the Corn Belt, Iowa']], TEAL, TINT);
  add('agriculture-intro', 'agriculture-intro-two-kinds', 480, 614, 'Extensive and intensive agriculture',
    'Two stacked panels. Extensive agriculture uses few inputs per hectare over large areas: shifting cultivation in the Amazon basin of Brazil, nomadic herding on the grasslands of Mongolia and ranching on the Pampas of Argentina. Intensive agriculture uses many inputs per hectare on small areas: market gardening near Rotterdam in the Netherlands, plantation agriculture such as oil palm in Malaysia, and mixed crop and livestock farming in the Corn Belt of Iowa.', b);
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
  b += text(240, 30, 'The Columbian Exchange, after 1492', { anchor: 'middle', size: 20, bold: true });
  b += rect(6, 50, 228, 350, { fill: MINT, stroke: GREEN, w: 2.2 });
  b += text(120, 80, 'From the Americas', { anchor: 'middle', size: 18, bold: true, fill: '#00694D' });
  b += line(40, 96, 200, 96, { stroke: GREEN, w: 3, arrow: 'green' });
  ['maize (corn)', 'potatoes', 'tomatoes', 'cacao', 'cassava', 'chili peppers'].forEach((s, i) => { b += text(22, 136 + i * 36, s, { size: 18 }); });
  b += rect(246, 50, 228, 350, { fill: TINT, stroke: TEAL, w: 2.2 });
  b += text(360, 80, 'From Afro-Eurasia', { anchor: 'middle', size: 18, bold: true, fill: TEAL });
  b += line(440, 96, 280, 96, { stroke: TEAL, w: 3, arrow: 'teal' });
  ['wheat, rice', 'sugarcane', 'coffee', 'cattle, pigs', 'horses, chickens', 'smallpox,', 'measles'].forEach((s, i) => { b += text(262, 136 + i * 36, s, { size: 18, fill: i >= 5 ? VERM : INK, bold: i >= 5 }); });
  b += lines(240, 432, 'Plants, animals and diseases crossed\nthe Atlantic in both directions.', { anchor: 'middle', size: 17, fill: GREY });
  add('agricultural-origins', 'agricultural-origins-exchange', 480, 470, 'The Columbian Exchange',
    'Two boxes, titled the Columbian Exchange, after 1492. From the Americas to Europe, Africa and Asia: maize (corn), potatoes, tomatoes, cacao, cassava and chili peppers. From Afro-Eurasia to the Americas: wheat and rice, sugarcane, coffee, cattle, pigs, horses and chickens, and diseases such as smallpox and measles. Plants, animals and diseases crossed the Atlantic in both directions.', b);
}

/* ---------------------------------------------------- second-agricultural-revolution */
{
  let b = '';
  b += text(240, 30, 'A four-field rotation', { anchor: 'middle', size: 21, bold: true });
  b += text(240, 56, '(Norfolk, England, 1700s)', { anchor: 'middle', size: 17, fill: GREY });
  const crops = [['Wheat', 'grain to sell', FIELD2], ['Turnips', 'winter feed\nfor animals', '#E9C9B0'], ['Barley', 'grain', '#EFE2A4'], ['Clover', 'grazing; adds\nnitrogen to soil', FIELD]];
  const pos = [[24, 80], [256, 80], [256, 280], [24, 280]];
  crops.forEach(([n, s, f], i) => {
    const [x, y] = pos[i];
    b += rect(x, y, 200, 160, { fill: f, stroke: INK, w: 1.8, rx: 6 });
    b += text(x + 100, y + 52, n, { anchor: 'middle', size: 22, bold: true });
    b += lines(x + 100, y + 90, s, { anchor: 'middle', size: 18 });
  });
  b += line(226, 160, 252, 160, { stroke: TEAL, w: 3, arrow: 'teal' }) + line(356, 242, 356, 276, { stroke: TEAL, w: 3, arrow: 'teal' }) +
    line(254, 360, 228, 360, { stroke: TEAL, w: 3, arrow: 'teal' }) + line(124, 278, 124, 244, { stroke: TEAL, w: 3, arrow: 'teal' });
  b += lines(240, 476, 'Each year every field moves to the next\ncrop, so no field is left empty.', { anchor: 'middle', size: 17, fill: TEAL, bold: true });
  add('second-agricultural-revolution', 'second-agricultural-revolution-rotation', 480, 516, 'A four-field crop rotation',
    'Four fields in a square, linked by arrows that go around in a circle: wheat (grain to sell), then turnips (winter feed for animals), then barley (grain), then clover (grazing that adds nitrogen to the soil), then wheat again. Each year every field moves to the next crop, so no field is left empty and the farm can feed more animals. This rotation spread from Norfolk, England, in the 1700s.', b);
}

/* ---------------------------------------------------- green-revolution */
{
  let b = '';
  b += text(240, 28, 'The Green Revolution package', { anchor: 'middle', size: 20, bold: true, fill: TEAL });
  b += text(240, 52, 'about the 1960s to the 1980s', { anchor: 'middle', size: 17, fill: GREY });
  const ins = [['High-yield', 'seeds'], ['Chemical', 'fertilizer'], ['Irrigation', 'water'], ['Pesticides', 'and machines']];
  ins.forEach(([a, c], i) => { const x = 10 + (i % 2) * 236, y = 70 + Math.floor(i / 2) * 76; b += box(x, y, 224, 64, `${a}\n${c}`, { fill: TINT, size: 17, bold: true }); });
  b += line(240, 220, 240, 246, { stroke: TEAL, w: 3, arrow: 'teal' });
  b += box(110, 250, 260, 60, 'More grain per hectare', { fill: '#FFFFFF', stroke: INK, w: 2.6, size: 19, bold: true });
  b += line(180, 312, 120, 340, { stroke: GREEN, w: 2.6, arrow: 'green' }) + line(300, 312, 360, 340, { stroke: VERM, w: 2.6, arrow: 'verm' });
  b += rect(6, 344, 228, 170, { fill: MINT, stroke: GREEN, w: 2 }) + text(120, 374, 'Benefits', { anchor: 'middle', size: 19, bold: true, fill: '#00694D' }) +
    lines(20, 406, 'more food grown\nfewer famines\nlower grain prices', { size: 17 });
  b += rect(246, 344, 228, 170, { fill: WARM, stroke: VERM, w: 2 }) + text(360, 374, 'Costs', { anchor: 'middle', size: 19, bold: true, fill: VERM }) +
    lines(260, 406, 'heavy water use\nchemical runoff\ndebt for small farms\nfewer crop varieties', { size: 17 });
  add('green-revolution', 'green-revolution-package', 480, 522, 'The Green Revolution package',
    'Four inputs at the top: high-yield seeds, chemical fertilizer, irrigation water, and pesticides and machines. An arrow leads to one box: more grain per hectare. From it, one arrow leads to benefits (more food grown, fewer famines, lower grain prices) and one to costs (heavy water use, chemical runoff, debt for small farms, fewer crop varieties). Title: the Green Revolution package, about the 1960s to the 1980s.', b);
}
{
  let b = '';
  const items = [['First Agricultural Revolution', 'from about 12,000 years ago', 'plants and animals domesticated'], ['Second Agricultural Revolution', '1700s and 1800s', 'rotation, new tools, machines'], ['Green Revolution', 'about 1960s to 1980s', 'high-yield seeds, fertilizer'], ['Genetically modified crops', 'from the late 1990s', 'genes changed in a lab']];
  b += text(240, 30, 'Big changes in farming, in order', { anchor: 'middle', size: 20, bold: true });
  b += line(30, 60, 30, 600, { stroke: INK, w: 3, arrow: 'ink' });
  items.forEach(([n, d, w], i) => {
    const y = 56 + i * 134, last = i === 3;
    b += circle(30, y + 56, 10, { fill: last ? PURP : TEAL });
    b += rect(54, y, 418, 116, { fill: last ? '#F4E6EF' : TINT, stroke: last ? PURP : TEAL, w: 1.8 });
    b += text(70, y + 32, n, { size: 19, bold: true });
    b += text(70, y + 62, d, { size: 18, fill: VERM, bold: true });
    b += text(70, y + 92, w, { size: 18 });
  });
  add('green-revolution', 'green-revolution-timeline', 480, 610, 'Big changes in farming, in order',
    'A timeline with four boxes from top to bottom. First Agricultural Revolution, from about 12,000 years ago: plants and animals domesticated. Second Agricultural Revolution, 1700s and 1800s: crop rotation, new tools and machines. Green Revolution, about the 1960s to the 1980s: high-yield seeds and fertilizer. Genetically modified crops, from the late 1990s: genes changed in a lab. The last box is a different color: it came after the Green Revolution and is not part of it.', b);
}

/* ---------------------------------------------------- production-regions: bid-rent */
{
  let b = '';
  const X0 = 64, Y0 = 400, W = 390, H = 300;
  const xs = d => X0 + d / 100 * W, ys = r => Y0 - r / 100 * H;
  const L = [{ n: 'Market gardening', a: 95, k: 2.2, c: VERM }, { n: 'Grain', a: 60, k: 0.9, c: TEAL }, { n: 'Ranching', a: 26, k: 0.26, c: GREEN }];
  const cross = (p, q) => (p.a - q.a) / (p.k - q.k);
  const d1 = cross(L[0], L[1]), d2 = cross(L[1], L[2]), dEnd = L[2].a / L[2].k;
  for (const l of L) { const end = Math.min(100, l.a / l.k); b += line(xs(0), ys(l.a), xs(end), ys(Math.max(0, l.a - l.k * end)), { stroke: l.c, w: 3.4 }); }
  b += line(X0, Y0, X0, Y0 - H - 14, { w: 2, arrow: 'ink' }) + line(X0, Y0, X0 + W + 14, Y0, { w: 2, arrow: 'ink' });
  b += text(12, 24, 'Rent a farmer can pay', { size: 18, bold: true });
  b += text(X0 + W / 2, Y0 + 70, 'Distance from the market', { anchor: 'middle', size: 18, bold: true });
  b += text(X0, Y0 + 24, 'Market', { anchor: 'middle', size: 17 });
  const bands = [[0, d1, L[0]], [d1, d2, L[1]], [d2, Math.min(100, dEnd), L[2]]];
  for (const [a, c, l] of bands) b += rect(xs(a), Y0 + 34, xs(c) - xs(a), 14, { fill: l.c, rx: 2 });
  b += text(xs(10), ys(92), 'Market gardening', { size: 18, bold: true, fill: VERM });
  b += text(xs(40), ys(36), 'Grain', { size: 18, bold: true, fill: TEAL });
  b += text(xs(70), ys(12) - 4, 'Ranching', { size: 18, bold: true, fill: GREEN });
  add('production-regions', 'production-regions-bid-rent', 480, 490, 'Bid-rent lines for three kinds of farming',
    'A graph. The vertical axis is the rent a farmer can pay for a hectare of land; the horizontal axis is distance from the market. Three falling lines: market gardening starts highest and falls fastest, grain starts in the middle and falls more slowly, ranching starts lowest and falls slowest. A colored band under the axis shows which use can pay the most at each distance: market gardening nearest the market, then grain, then ranching farthest away.', b);
}

/* ---------------------------------------------------- farm-organization: commodity chain */
{
  let b = '';
  b += text(240, 28, 'A commodity chain:', { anchor: 'middle', size: 20, bold: true });
  b += text(240, 54, 'every step from seed to plate', { anchor: 'middle', size: 18 });
  const steps = [['Inputs', 'seed, fertilizer,\nmachines'], ['Farm', 'grows the\ncrop'], ['Processor', 'mills, packs,\ncooks'], ['Distributor', 'ships and\nstores'], ['Store', 'sells to\nshoppers'], ['Consumer', 'buys and\neats']];
  const pos = [[6, 76], [166, 76], [326, 76], [326, 250], [166, 250], [6, 250]];
  steps.forEach(([n, s], i) => {
    const [x, y] = pos[i];
    b += rect(x, y, 148, 130, { fill: i === 1 ? MINT : TINT, stroke: i === 1 ? GREEN : TEAL, w: 2 });
    b += text(x + 74, y + 32, n, { anchor: 'middle', size: 19, bold: true });
    b += lines(x + 74, y + 68, s, { anchor: 'middle', size: 17 });
  });
  b += line(155, 141, 164, 141, { w: 2.6, arrow: 'ink' }) + line(315, 141, 324, 141, { w: 2.6, arrow: 'ink' }) + line(400, 207, 400, 247, { w: 2.6, arrow: 'ink' }) +
    line(325, 315, 316, 315, { w: 2.6, arrow: 'ink' }) + line(165, 315, 156, 315, { w: 2.6, arrow: 'ink' });
  b += lines(240, 416, 'Vertical integration: one agribusiness\nowns or controls several of these steps.', { anchor: 'middle', size: 17, bold: true, fill: VERM });
  add('farm-organization', 'farm-organization-chain', 480, 460, 'A commodity chain from seed to plate',
    'Six boxes joined by arrows in two rows: inputs (seed, fertilizer, machines), then farm (grows the crop), then processor (mills, packs, cooks), then distributor (ships and stores), then store (sells to shoppers), then consumer (buys and eats). A note says that vertical integration means one agribusiness owns or controls several of these steps.', b);
}

/* ---------------------------------------------------- von-thunen */
function rings(cx, cy, R, fills) {
  let s = '';
  for (let i = R.length - 1; i >= 0; i--) s += circle(cx, cy, R[i], { fill: fills[i], stroke: INK, w: 1.4 });
  return s;
}
{
  let b = '';
  const cx = 240, cy = 226, R = [46, 92, 150, 214];
  b += rect(4, 4, 472, 446, { fill: '#EFEBDD', stroke: LINE, rx: 4 });
  b += rings(cx, cy, R, [VERM, FOREST, FIELD2, FIELD]);
  b += circle(cx, cy, 18, { fill: '#FFFFFF', stroke: INK, w: 2 }) + text(cx, cy + 7, 'M', { anchor: 'middle', size: 19, bold: true });
  [[cx, cy - 69, '1'], [cx, cy - 121, '2'], [cx, cy - 182, '3'], [cx + 152, cy + 140, '4']].forEach(([x, y, s]) => { b += badge(x, y, s, { r: 17 }); });
  const leg = [['M', 'Market town', '#FFFFFF'], ['1', 'Market gardening and dairy', VERM], ['2', 'Forest (fuel and lumber)', FOREST], ['3', 'Grain and field crops', FIELD2], ['4', 'Livestock ranching', FIELD]];
  leg.forEach(([k, s, f], i) => {
    const y = 466 + i * 46;
    b += rect(14, y, 36, 36, { fill: f, stroke: INK, w: 1.4, rx: 4 }) + text(32, y + 25, k, { anchor: 'middle', size: 18, bold: true, fill: k === '1' || k === '2' ? '#FFFFFF' : INK });
    b += text(64, y + 25, s, { size: 18 });
  });
  b += text(14, 714, 'Beyond ring 4: wilderness', { size: 17, fill: GREY });
  add('von-thunen', 'von-thunen-rings', 480, 728, 'Von Thünen model: rings of land use around one market',
    'Concentric rings around a market town M on a flat plain. Ring 1, nearest the market: market gardening and dairy. Ring 2: forest, for fuel and lumber. Ring 3: grain and field crops. Ring 4: livestock ranching. Beyond ring 4 is wilderness.', b);
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
  b += text(240, 28, 'A global supply chain for bananas', { anchor: 'middle', size: 20, bold: true });
  const steps = [['Farm', 'Ecuador'], ['Packing house', 'washed, boxed'], ['Port', 'Guayaquil, Ecuador'], ['Cold ship', 'kept at about 13 °C'], ['Port', 'United States'], ['Ripening center', 'gas ripens the fruit'], ['Store', 'a shopper buys it']];
  steps.forEach(([n, s], i) => {
    const y = 48 + i * 70, sea = i === 3, exp = i < 3;
    b += rect(40, y, 434, 54, { fill: sea ? '#DCEEF6' : exp ? MINT : TINT, stroke: sea ? '#1F5F82' : exp ? GREEN : TEAL, w: 2 });
    b += text(54, y + 34, n, { size: 19, bold: true });
    b += text(462, y + 34, s, { size: 17, anchor: 'end' });
    if (i < 6) b += line(257, y + 55, 257, y + 68, { w: 2.4, arrow: 'ink' });
  });
  b += path('M30,52 L20,52 L20,238 L30,238', { stroke: GREEN, w: 3 }) + path('M30,332 L20,332 L20,518 L30,518', { stroke: TEAL, w: 3 });
  b += `<text x="14" y="145" font-size="16" fill="#00694D" font-weight="700" text-anchor="middle" transform="rotate(-90 14 145)">Exporting country</text>`;
  b += `<text x="14" y="425" font-size="16" fill="${TEAL}" font-weight="700" text-anchor="middle" transform="rotate(-90 14 425)">Importing country</text>`;
  b += lines(240, 560, 'Each step adds cost and value; a delay\nat any step can spoil the fruit.', { anchor: 'middle', size: 17, fill: GREY });
  add('global-agriculture', 'global-agriculture-banana-chain', 480, 600, 'A global supply chain for bananas',
    'Seven steps from top to bottom, joined by arrows: a farm in Ecuador, a packing house where fruit is washed and boxed, the port of Guayaquil, a refrigerated ship kept at about 13 degrees Celsius, a port in the United States, a ripening center where gas ripens the fruit, and a store where a shopper buys it. The first three steps are marked as in the exporting country and the last three as in the importing country. Each step adds cost and value, and a delay at any step can spoil the fruit.', b);
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
  b += text(240, 30, 'How irrigation can lead to salinization', { anchor: 'middle', size: 19, bold: true });
  const steps = ['Farmers irrigate dry land for years', 'Water evaporates in the hot sun', 'Salts in the water stay in the soil', 'Crops grow poorly; some fields\nare abandoned'];
  steps.forEach((s, i) => {
    const y = 52 + i * 96;
    b += box(30, y, 420, 72, s, { fill: i === 3 ? WARM : TINT, stroke: i === 3 ? VERM : TEAL, size: 18 });
    if (i < 3) b += line(240, y + 73, 240, y + 94, { w: 2.6, arrow: 'ink' });
  });
  b += lines(240, 456, 'Fixes: drain fields, flush salts with extra\nwater, use drip irrigation that wets\nonly the roots.', { anchor: 'middle', size: 17, fill: GREY });
  add('agriculture-consequences', 'agriculture-consequences-salinization', 480, 530, 'How irrigation can lead to salinization',
    'Four boxes from top to bottom, joined by arrows: farmers irrigate dry land for years; the water evaporates in the hot sun; salts in the water stay in the soil; crops grow poorly and some fields are abandoned. Below: fixes include draining fields, flushing salts with extra water and drip irrigation that wets only the roots.', b);
}

/* ---------------------------------------------------- agriculture-challenges: food desert */
{
  let b = '';
  b += rect(4, 4, 472, 452, { fill: '#F1F1EC', stroke: LINE, rx: 4 });
  for (let i = 0; i < 7; i++) b += line(4 + i * 78, 4, 4 + i * 78, 456, { stroke: '#FFFFFF', w: 6 });
  for (let j = 0; j < 7; j++) b += line(4, 4 + j * 75, 476, 4 + j * 75, { stroke: '#FFFFFF', w: 6 });
  b += circle(360, 120, 100, { fill: '#009E73', op: 0.12, stroke: GREEN, w: 2.6 });
  b += rect(340, 102, 40, 36, { fill: GREEN, stroke: INK, w: 1.6, rx: 4 }) + text(360, 127, 'S', { anchor: 'middle', size: 20, bold: true, fill: '#FFFFFF' });
  b += line(360, 140, 360, 220, { stroke: GREEN, w: 2, dash: '5 4' }) + text(410, 214, '1 mile', { anchor: 'middle', size: 18, bold: true, fill: '#00694D' });
  b += rect(20, 300, 250, 140, { fill: '#C24E00', op: 0.1, stroke: VERM, w: 2.6, dash: '8 5' });
  b += text(145, 326, 'Neighborhood N', { anchor: 'middle', size: 19, bold: true, fill: VERM });
  [[80, 380], [200, 405]].forEach(([x, y]) => { b += rect(x - 17, y - 15, 34, 30, { fill: VERM, stroke: INK, w: 1.4, rx: 4 }) + text(x, y + 7, 'C', { anchor: 'middle', size: 18, bold: true, fill: '#FFFFFF' }); });
  b += path('M4,262 L476,262', { stroke: PURP, w: 3.4, dash: '10 6' }) + rect(14, 236, 86, 22, { fill: '#FFFFFF', rx: 3 }) + text(57, 253, 'Bus line', { anchor: 'middle', size: 17, bold: true, fill: PURP });
  b += rect(14, 474, 30, 28, { fill: GREEN, rx: 4 }) + text(29, 495, 'S', { anchor: 'middle', size: 17, bold: true, fill: '#FFFFFF' }) + text(56, 495, 'Supermarket: fresh food', { size: 18 });
  b += rect(14, 514, 30, 28, { fill: VERM, rx: 4 }) + text(29, 535, 'C', { anchor: 'middle', size: 17, bold: true, fill: '#FFFFFF' }) + text(56, 535, 'Corner store: snacks, little fresh food', { size: 18 });
  add('agriculture-challenges', 'agriculture-challenges-food-desert', 480, 556, 'An invented town: where fresh food is sold',
    'A drawn street grid of an invented town. One supermarket, marked S, is in the northeast, with a circle showing everything within 1 mile of it. Neighborhood N, in the southwest, is outside that circle; it has two corner stores, marked C, that sell snacks and little fresh food. A bus line runs east to west between the neighborhood and the supermarket.', b);
}

/* ---------------------------------------------------- women-in-agriculture (FAO 2023 data) */
{
  let b = '';
  const data = [['World', 36, 38], ['Sub-Saharan\nAfrica', 66, 60], ['Southern\nAsia', 71, 47]];
  const X0 = 58, Y0 = 380, H = 250, G = 140;
  for (let v = 0; v <= 80; v += 20) { const y = Y0 - v / 80 * H; b += line(X0, y, 470, y, { stroke: v ? '#E3E8E7' : INK, w: v ? 1 : 2 }) + text(X0 - 8, y + 6, `${v}%`, { anchor: 'end', size: 16 }); }
  data.forEach(([n, w, m], i) => {
    const x = X0 + 18 + i * G;
    b += rect(x, Y0 - w / 80 * H, 50, w / 80 * H, { fill: PURP, rx: 0 }) + text(x + 25, Y0 - w / 80 * H - 8, `${w}%`, { anchor: 'middle', size: 17, bold: true });
    b += rect(x + 54, Y0 - m / 80 * H, 50, m / 80 * H, { fill: TEAL, rx: 0 }) + text(x + 79, Y0 - m / 80 * H - 8, `${m}%`, { anchor: 'middle', size: 17, bold: true });
    b += lines(x + 52, Y0 + 26, n, { anchor: 'middle', size: 17 });
  });
  b += lines(10, 26, 'Share of workers whose job\nis in agrifood systems', { size: 18, bold: true });
  b += rect(10, 74, 22, 18, { fill: PURP, rx: 0 }) + text(40, 90, 'Working women', { size: 17 });
  b += rect(220, 74, 22, 18, { fill: TEAL, rx: 0 }) + text(250, 90, 'Working men', { size: 17 });
  b += lines(240, 456, 'Source: FAO, The Status of Women in\nAgrifood Systems, 2023.', { anchor: 'middle', size: 16, fill: GREY });
  add('women-in-agriculture', 'women-in-agriculture-jobs', 480, 490, 'Share of working women and men employed in agrifood systems',
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
