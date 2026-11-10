/* AP® Human Geography figures for Unit 3, Cultural Patterns and Processes
   (author C). Every figure is a LevlPrep original SVG: diagrams drawn from
   their labels and street scenes drawn from simple shapes (no photos). The
   scenes show invented places and say so in their captions.
   Writes
     human-geography/figures/<id>.svg
     human-geography/data/figures/<topic>.json   (the registry entries)

     node scripts/aphug-figures/author-c.mjs

   Style: white background, role="img" with <title> and <desc>, Arial or
   Helvetica, ink #1F2A28, course teal #094953 for emphasis, then vermillion
   #C24E00, green #009E73 and reddish purple #A8508A. Text is 16 px or more on
   a canvas about 640 px wide, so it stays readable when the figure is shown
   at phone width. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'human-geography', 'figures');
const REG = join(ROOT, 'human-geography', 'data', 'figures');
const INK = '#1F2A28', TEAL = '#094953', VERM = '#C24E00', GREEN = '#009E73', PURP = '#A8508A', GREY = '#6B7370';
const TINT = '#E1F1F4', SOFT = '#F4F7F9', WARM = '#FBE6D9', MINT = '#DDF2EA', LILAC = '#F3E4EE';
const SKY = '#DCEAF4', GRASS = '#CFE3C4', ROAD = '#B9B4AA', WATER = '#9CC7E0', BRICK = '#B5603A', WOOD = '#A9825A', STONE = '#C9C3B6';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = v => Math.round(v * 10) / 10;
function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 17}"`, `fill="${o.fill || INK}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.bold) a.push('font-weight="700"');
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}
function lines(x, y, s, o = {}) { const lh = o.lh || (o.size || 17) * 1.28; return String(s).split('\n').map((l, i) => text(x, y + i * lh, l, o)).join(''); }
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''} stroke-linecap="round"/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.4}"/>`;
const path = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
const poly = (pts, o = {}) => `<polygon points="${pts.map(p => p.map(r1).join(',')).join(' ')}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.4}" stroke-linejoin="round"/>`;
const marker = (id, c) => `<marker id="ar-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
const DEFS = `<defs>${marker('ink', INK)}${marker('teal', TEAL)}${marker('verm', VERM)}${marker('green', GREEN)}${marker('purp', PURP)}</defs>`;
function box(x, y, w, h, label, o = {}) {
  const n = String(label).split('\n').length, size = o.size || 17, lh = size * 1.28;
  return rect(x, y, w, h, { fill: o.fill || SOFT, stroke: o.stroke || TEAL, w: o.w || 2, rx: o.rx ?? 10 }) +
    lines(x + w / 2, y + h / 2 - (n - 1) * lh / 2 + size * 0.36, label, { anchor: 'middle', size, bold: o.bold, fill: o.ink || INK, lh });
}
function svg(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
${DEFS}<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}

/* ---------------------------------------------------------- scene kit */
// A building on the ground line gy: x, width, height; roof 'flat' | 'gable';
// windows in rows and columns; an optional sign { text, fill, ink }.
function building(x, gy, w, h, o = {}) {
  const y = gy - h, fill = o.fill || STONE;
  let s = rect(x, y, w, h, { fill, stroke: INK, w: 1.4 });
  if (o.roof === 'gable') s += poly([[x - 6, y], [x + w / 2, y - (o.roofH || 34)], [x + w + 6, y]], { fill: o.roofFill || '#7B5E45', stroke: INK });
  if (o.roof === 'flat') s += rect(x - 3, y - 6, w + 6, 6, { fill: '#6F6A60', stroke: INK, w: 1 });
  const rows = o.rows ?? 2, cols = o.cols ?? 2, top = y + (o.winTop ?? 14), bottom = o.sign ? gy - (o.signY || 70) - 8 : gy - (o.door ? 46 : 14);
  if (rows && cols) {
    const ww = o.winW || 16, wh = o.winH || 20;
    const gx = (w - cols * ww) / (cols + 1), gyy = rows > 1 ? (bottom - top - rows * wh) / (rows - 1) : 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      s += rect(x + gx + c * (ww + gx), top + r * (wh + Math.max(gyy, 4)), ww, wh, { fill: o.win || '#EAF2F6', stroke: INK, w: 1 });
  }
  if (o.door) s += rect(x + w / 2 - 11, gy - 34, 22, 34, { fill: o.doorFill || '#5B4636', stroke: INK, w: 1.2 });
  if (o.sign) s += sign(x + 6, gy - (o.signY || 70), w - 12, o.signH || 26, o.sign.text, o.sign);
  return s;
}
function sign(x, y, w, h, label, o = {}) {
  return rect(x, y, w, h, { fill: o.fill || '#FFFFFF', stroke: INK, w: 1.2, rx: 3 }) +
    lines(x + w / 2, y + h / 2 + (o.size || 15) * 0.36 - (String(label).split('\n').length - 1) * (o.size || 15) * 0.64, label, { anchor: 'middle', size: o.size || 15, bold: true, fill: o.ink || INK, lh: (o.size || 15) * 1.28 });
}
const tree = (x, gy, s = 1) => rect(x - 3 * s, gy - 26 * s, 6 * s, 26 * s, { fill: '#7B5E45' }) + circle(x, gy - 38 * s, 17 * s, { fill: '#6FA36B', stroke: '#3F6E3C', w: 1.2 });
const person = (x, gy, c = TEAL, s = 1) => circle(x, gy - 36 * s, 6 * s, { fill: '#8A6A55' }) + path(`M${x - 7 * s},${gy - 14 * s} L${x - 6 * s},${gy - 28 * s} Q${x},${gy - 32 * s} ${x + 6 * s},${gy - 28 * s} L${x + 7 * s},${gy - 14 * s} Z`, { fill: c }) + line(x - 3 * s, gy - 14 * s, x - 4 * s, gy, { w: 2.4 }) + line(x + 3 * s, gy - 14 * s, x + 4 * s, gy, { w: 2.4 });
const car = (x, gy, c = VERM) => path(`M${x},${gy - 8} L${x},${gy - 20} L${x + 14},${gy - 22} L${x + 22},${gy - 34} L${x + 50},${gy - 34} L${x + 60},${gy - 22} L${x + 74},${gy - 20} L${x + 74},${gy - 8} Z`, { fill: c, stroke: INK, w: 1.2 }) + circle(x + 16, gy - 7, 7, { fill: INK }) + circle(x + 58, gy - 7, 7, { fill: INK }) + rect(x + 25, gy - 31, 22, 9, { fill: '#EAF2F6' });
const cart = (x, gy) => rect(x, gy - 30, 46, 16, { fill: WOOD, stroke: INK, w: 1.2 }) + circle(x + 10, gy - 9, 9, { fill: 'none', stroke: INK, w: 2 }) + circle(x + 36, gy - 9, 9, { fill: 'none', stroke: INK, w: 2 }) +
  path(`M${x + 50},${gy - 22} q8,-2 12,-14 l8,0 l2,12 l-6,0 l0,24 l-4,0 l0,-14 l-10,0 l0,14 l-4,0 z`, { fill: '#8A6A55', stroke: INK, w: 1 }) + line(x + 46, gy - 22, x + 54, gy - 22, { w: 2 });
const steeple = (x, gy, w, h) => building(x, gy, w, h, { fill: '#F2EEE6', roof: 'gable', roofH: 26, rows: 1, cols: 2, door: true, winH: 26 }) +
  rect(x + w / 2 - 10, gy - h - 70, 20, 48, { fill: '#F2EEE6', stroke: INK, w: 1.4 }) + poly([[x + w / 2 - 12, gy - h - 70], [x + w / 2, gy - h - 104], [x + w / 2 + 12, gy - h - 70]], { fill: '#7B5E45', stroke: INK }) +
  line(x + w / 2, gy - h - 104, x + w / 2, gy - h - 118, { w: 2 }) + line(x + w / 2 - 6, gy - h - 112, x + w / 2 + 6, gy - h - 112, { w: 2 });
function ground(W, gy, H) { return rect(0, 0, W, gy, { fill: SKY }) + rect(0, gy, W, H - gy, { fill: ROAD }) + line(0, gy + 1, W, gy + 1, { stroke: '#8D877C', w: 2 }); }
const caption = (W, H, s) => rect(0, H - 34, W, 34, { fill: '#FFFFFF' }) + text(W / 2, H - 11, s, { anchor: 'middle', size: 16, fill: GREY });

/* -------------------------------------------------------- the figures */
const out = {};
function add(topic, id, w, h, alt, body, title) {
  writeFileSync(join(FIG, `${id}.svg`), svg(w, h, title || alt.split(':')[0], alt, body));
  (out[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

// 3.1 Two ways to look at another culture.
{
  const W = 640, H = 470;
  let b = text(W / 2, 34, 'One custom, two ways of judging it', { anchor: 'middle', size: 22, bold: true });
  b += box(150, 54, 340, 74, 'The custom: in many parts of India,\npeople eat with the right hand.', { fill: TINT, stroke: TEAL, size: 18 });
  b += line(250, 130, 160, 186, { stroke: VERM, w: 2.6, arrow: 'verm' }) + line(390, 130, 480, 186, { stroke: GREEN, w: 2.6, arrow: 'green' });
  b += box(20, 192, 290, 70, 'Ethnocentrism', { fill: WARM, stroke: VERM, size: 21, bold: true });
  b += box(330, 192, 290, 70, 'Cultural relativism', { fill: MINT, stroke: GREEN, size: 21, bold: true });
  b += lines(32, 296, 'Judges the custom by the\nviewer\'s own culture.', { size: 17 });
  b += lines(342, 296, 'Tries to understand the\ncustom by its own culture.', { size: 17 });
  b += box(20, 348, 290, 92, '"Eating with your hands\nis bad manners."', { fill: '#FFFFFF', stroke: VERM, size: 18, rx: 16 });
  b += box(330, 348, 290, 92, '"Here, eating with the right\nhand is the polite way."', { fill: '#FFFFFF', stroke: GREEN, size: 18, rx: 16 });
  add('culture-intro', 'culture-intro-lenses', W, H, 'Diagram: one custom, eating with the right hand in many parts of India, judged two ways. Ethnocentrism judges it by the viewer\'s own culture and calls it bad manners. Cultural relativism understands it by its own culture and sees it as the polite way.', b, 'Ethnocentrism and cultural relativism');
}

// 3.2 Sequent occupance: one riverbank in three periods (invented place).
function riverPanel(x0, y0, W, H, era) {
  const gy = y0 + H - 70;
  let b = rect(x0, y0, W, H, { fill: SKY }) + rect(x0, gy, W, 26, { fill: GRASS }) + rect(x0, gy + 26, W, 44, { fill: WATER });
  if (era === 1) {
    b += poly([[x0 + 30, gy], [x0 + 62, gy - 52], [x0 + 94, gy]], { fill: WOOD, stroke: INK }) + poly([[x0 + 112, gy], [x0 + 144, gy - 46], [x0 + 176, gy]], { fill: WOOD, stroke: INK });
    b += rect(x0 + 192, gy - 34, 4, 34, { fill: '#7B5E45' }) + rect(x0 + 238, gy - 34, 4, 34, { fill: '#7B5E45' }) + line(x0 + 192, gy - 30, x0 + 242, gy - 30, { w: 2 });
    for (let i = 0; i < 4; i++) b += line(x0 + 200 + i * 11, gy - 30, x0 + 200 + i * 11, gy - 12, { stroke: '#7FA6B8', w: 3 });
    b += path(`M${x0 + 70},${gy + 44} q40,12 80,0 l-8,8 q-32,8 -64,0 z`, { fill: WOOD, stroke: INK, w: 1.2 });
    b += tree(x0 + 20, gy, 0.9) + tree(x0 + 270, gy, 1);
  } else if (era === 2) {
    b += building(x0 + 16, gy, 120, 92, { fill: BRICK, rows: 2, cols: 4, winW: 14, winH: 16 }) + rect(x0 + 112, gy - 150, 16, 58, { fill: BRICK, stroke: INK, w: 1.2 });
    b += path(`M${x0 + 120},${gy - 154} q16,-16 6,-30 q-8,-12 10,-24`, { stroke: GREY, w: 6 });
    b += building(x0 + 150, gy, 54, 50, { fill: '#D9CDB8', roof: 'gable', roofH: 22, rows: 1, cols: 2, door: true });
    b += building(x0 + 212, gy, 54, 50, { fill: '#D9CDB8', roof: 'gable', roofH: 22, rows: 1, cols: 2, door: true });
    b += line(x0, gy + 12, x0 + W, gy + 12, { stroke: INK, w: 2 }) + line(x0, gy + 18, x0 + W, gy + 18, { stroke: INK, w: 2 });
    for (let i = 0; i < W; i += 14) b += line(x0 + i, gy + 10, x0 + i, gy + 20, { stroke: '#7B5E45', w: 2 });
  } else {
    b += building(x0 + 16, gy, 120, 92, { fill: BRICK, rows: 2, cols: 4, winW: 14, winH: 16, win: '#FFF6D8' }) + rect(x0 + 112, gy - 150, 16, 58, { fill: BRICK, stroke: INK, w: 1.2 });
    b += sign(x0 + 26, gy - 30, 100, 22, 'Lofts + Cafe', { size: 14 });
    b += path(`M${x0 + 168},${gy} L${x0 + 168},${gy - 150} L${x0 + 208},${gy - 170} L${x0 + 248},${gy - 150} L${x0 + 248},${gy} Z`, { fill: '#BFD7E6', stroke: INK, w: 1.4 });
    for (let r = 0; r < 6; r++) b += line(x0 + 168, gy - 20 - r * 22, x0 + 248, gy - 20 - r * 22, { stroke: '#7FA6B8', w: 1.2 });
    b += line(x0, gy + 14, x0 + W, gy + 14, { stroke: '#8D877C', w: 6 });
    b += person(x0 + 150, gy + 12, GREEN, 0.7) + person(x0 + 270, gy + 12, PURP, 0.7) + tree(x0 + 276, gy, 0.8);
  }
  return rect(x0, y0, W, H, { stroke: INK, w: 1.4 }) + b;
}
{
  const W = 640, H = 1070, PW = 300, PH = 300;
  let b = text(W / 2, 32, 'Sequent occupance: one riverbank, three layers', { anchor: 'middle', size: 21, bold: true });
  const rows = [
    ['About 1850', 'Fishing camp: wooden lodges,\na drying rack and canoes.'],
    ['About 1920', 'Mill town: a brick mill, a rail\nline and workers\' houses.'],
    ['About 2020', 'The mill is now lofts and a cafe,\nbeside a glass tower and a\nriverside path.'],
  ];
  rows.forEach(([when, what], i) => {
    const y = 56 + i * (PH + 34);
    b += riverPanel(20, y, PW, PH, i + 1);
    b += text(342, y + 40, when, { size: 22, bold: true, fill: TEAL });
    b += lines(342, y + 76, what, { size: 18 });
    if (i < 2) b += line(170, y + PH + 4, 170, y + PH + 30, { stroke: TEAL, w: 2.6, arrow: 'teal' });
  });
  b += text(W / 2, H - 12, 'An invented place, drawn for practice.', { anchor: 'middle', size: 16, fill: GREY });
  add('culture-on-the-land', 'culture-on-the-land-sequent', W, H, 'Three drawings of one invented riverbank. About 1850: a fishing camp of wooden lodges, a drying rack and a canoe. About 1920: a brick mill with a smokestack, a rail line and small workers\' houses. About 2020: the same mill, now lofts and a cafe, keeps its smokestack beside a glass tower and a riverside path. Each period left marks that the next one built on.', b, 'Sequent occupance on one riverbank');
}

// 3.2 A drawn ethnic neighborhood streetscape (stimulus).
{
  const W = 640, H = 420, gy = 330;
  let b = ground(W, gy, H);
  b += building(10, gy, 140, 190, { fill: '#E9D8B4', roof: 'flat', rows: 3, cols: 3, door: true, sign: { text: 'Phở Saigon\nNoodle House', fill: '#FCE8C8' }, signY: 92, signH: 42 });
  b += building(160, gy, 130, 170, { fill: '#D6E4D2', roof: 'flat', rows: 2, cols: 3, door: true, sign: { text: 'Chợ\nAsian Market', fill: '#FFFFFF' }, signY: 92, signH: 42 });
  b += building(300, gy, 150, 150, { fill: '#F2D7C9', roof: 'gable', roofH: 30, roofFill: '#B5481F', rows: 1, cols: 3, door: true, sign: { text: 'Chùa\nBuddhist Temple', fill: '#FFF2C2' }, signY: 92, signH: 42 });
  b += path('M296,182 q16,-14 30,-6 M454,182 q-16,-14 -30,-6', { stroke: '#B5481F', w: 4 });
  b += building(460, gy, 170, 180, { fill: '#DCD7EA', roof: 'flat', rows: 2, cols: 3, door: true, sign: { text: 'Áo Dài Tailor\nBánh Mì', fill: '#FFFFFF' }, signY: 92, signH: 42 });
  b += line(490, 150, 490, 124, { stroke: INK, w: 2 }) + line(600, 150, 600, 124, { stroke: INK, w: 2 }) + sign(470, 96, 150, 28, 'Community Center', { size: 15 });
  b += line(0, gy + 40, W, gy + 40, { stroke: '#FFFFFF', w: 3, dash: '18 14' });
  b += person(110, gy + 4, TEAL) + person(260, gy + 4, PURP) + person(276, gy + 4, GREEN, 0.8) + person(500, gy + 4, VERM);
  b += caption(W, H, 'Drawn for practice. Signs are in Vietnamese and English.');
  add('culture-on-the-land', 'culture-on-the-land-street', W, H, 'A drawn street in a Vietnamese American neighborhood such as Little Saigon in Westminster, California. Signs in Vietnamese and English: a noodle house (Phở Saigon), an Asian market (Chợ), a Buddhist temple (Chùa) with a curved red tile roof, a tailor for áo dài (a long Vietnamese dress) and a bánh mì shop, and a community center. People walk on the sidewalk.', b, 'An ethnic neighborhood streetscape');
}

// FRQ Q3: one street in an invented river town, 1925 and 2025.
{
  const W = 640, H = 420, gy = 320;
  let a = ground(W, gy, H);
  a += steeple(14, gy, 120, 120);
  a += building(150, gy, 150, 140, { fill: '#D9CDB8', roof: 'flat', rows: 2, cols: 3, door: true, sign: { text: 'Lindqvist & Sons\nGeneral Store', fill: '#FFFFFF' }, signY: 84, signH: 40 });
  a += building(312, gy, 160, 160, { fill: BRICK, roof: 'flat', rows: 3, cols: 4, winW: 14, winH: 16, sign: { text: 'River Town\nFlour Mill', fill: '#FFFFFF' }, signY: 48, signH: 40 }) + rect(440, gy - 230, 18, 70, { fill: BRICK, stroke: INK, w: 1.2 });
  a += path('M449,96 q18,-14 6,-28 q-8,-12 12,-22', { stroke: GREY, w: 6 });
  a += building(486, gy, 70, 80, { fill: '#E9D8B4', roof: 'gable', roofH: 26, rows: 1, cols: 2, door: true }) + building(564, gy, 70, 80, { fill: '#E9D8B4', roof: 'gable', roofH: 26, rows: 1, cols: 2, door: true });
  a += cart(170, gy + 40) + person(120, gy + 30, TEAL) + person(300, gy + 30, PURP);
  a += caption(W, H, 'Scene 1: Main Street, about 1925 (invented town, drawn for practice)');
  add('culture-on-the-land', 'culture-on-the-land-1925', W, H, 'Scene 1, Main Street of an invented river town in about 1925: a white wooden church with a steeple and cross, a general store with the sign "Lindqvist & Sons General Store", a brick flour mill with a smoking smokestack, and two small workers\' houses. A horse pulls a cart on the dirt street and two people walk past. Every sign is in English.', a, 'Main Street, about 1925');

  let c = ground(W, gy, H);
  c += steeple(14, gy, 120, 120);
  c += building(150, gy, 150, 140, { fill: '#D9CDB8', roof: 'flat', rows: 2, cols: 3, door: true, sign: { text: 'Hilal Halal Market\nSomali Restaurant', fill: '#E6F4EA' }, signY: 84, signH: 40 });
  c += building(312, gy, 160, 160, { fill: BRICK, roof: 'flat', rows: 3, cols: 4, winW: 14, winH: 16, win: '#FFF6D8', sign: { text: 'Mill Lofts\nand Coffee', fill: '#FFFFFF' }, signY: 48, signH: 40 }) + rect(440, gy - 230, 18, 70, { fill: BRICK, stroke: INK, w: 1.2 });
  c += building(486, gy, 148, 118, { fill: '#F1F1F1', roof: 'flat', rows: 1, cols: 3, door: true, sign: { text: 'Global Burger\nPhones 5G', fill: '#FFE08A' }, signY: 84, signH: 40 });
  c += car(160, gy + 46, VERM) + car(380, gy + 46, TEAL) + person(120, gy + 24, GREEN) + person(300, gy + 24, PURP) + person(470, gy + 24, VERM);
  c += caption(W, H, 'Scene 2: the same street, about 2025 (invented town, drawn for practice)');
  add('culture-on-the-land', 'culture-on-the-land-2025', W, H, 'Scene 2, the same Main Street in about 2025: the church still stands; the general store building is now "Hilal Halal Market" and a Somali restaurant; the flour mill keeps its smokestack but is now "Mill Lofts and Coffee"; the workers\' houses are gone and a building holds a "Global Burger" chain restaurant and a "Phones 5G" store. Cars drive on a paved street and people walk past.', c, 'Main Street, about 2025');
}

// 3.3 Centripetal and centrifugal forces.
{
  const W = 640, H = 520, cx = 160, cy = 250, dx = 480;
  let b = text(W / 2, 32, 'Forces that unite and forces that divide', { anchor: 'middle', size: 21, bold: true });
  b += text(cx, 72, 'Centripetal force', { anchor: 'middle', size: 21, bold: true, fill: GREEN }) + text(cx, 96, 'pulls people together', { anchor: 'middle', size: 17 });
  b += text(dx, 72, 'Centrifugal force', { anchor: 'middle', size: 21, bold: true, fill: VERM }) + text(dx, 96, 'pushes people apart', { anchor: 'middle', size: 17 });
  b += circle(cx, cy, 46, { fill: MINT, stroke: GREEN, w: 2.4 }) + text(cx, cy + 6, 'Group', { anchor: 'middle', size: 18, bold: true });
  b += circle(dx, cy, 46, { fill: WARM, stroke: VERM, w: 2.4 }) + text(dx, cy + 6, 'Group', { anchor: 'middle', size: 18, bold: true });
  for (const a of [0, 90, 180, 270]) {
    const r = a * Math.PI / 180, c1 = Math.cos(r), s1 = Math.sin(r);
    b += line(cx + 110 * c1, cy + 110 * s1, cx + 56 * c1, cy + 56 * s1, { stroke: GREEN, w: 3, arrow: 'green' });
    b += line(dx + 56 * c1, cy + 56 * s1, dx + 110 * c1, cy + 110 * s1, { stroke: VERM, w: 3, arrow: 'verm' });
  }
  b += lines(cx, 392, 'A shared language\nA national holiday\nA shared religion', { anchor: 'middle', size: 17 });
  b += lines(dx, 392, 'Two languages in\nseparate regions\nReligious differences', { anchor: 'middle', size: 17 });
  b += box(40, 462, 560, 44, 'The same trait can unite one region and divide the whole country.', { fill: TINT, stroke: TEAL, size: 16 });
  add('cultural-patterns', 'cultural-patterns-forces', W, H, 'Diagram: on the left, arrows point in toward a group, labeled centripetal force, which pulls people together, with examples a shared language, a national holiday and a shared religion. On the right, arrows point out from a group, labeled centrifugal force, which pushes people apart, with examples two languages in separate regions and religious differences. A note says the same trait can unite one region and divide the whole country.', b, 'Centripetal and centrifugal forces');
}

// 3.4 The kinds of diffusion, on a grid of places.
function grid(x0, y0, fill) {
  let s = rect(x0, y0, 280, 190, { fill: SOFT, stroke: GREY, w: 1.2, rx: 8 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) s += circle(x0 + 30 + c * 44, y0 + 30 + r * 44, fill(r, c) ? 9 : 6, { fill: fill(r, c) ? TEAL : '#C9D3D6' });
  return s;
}
{
  const W = 640, H = 690;
  let b = text(W / 2, 32, 'Four ways a trait spreads', { anchor: 'middle', size: 22, bold: true });
  // Relocation: people move and carry the trait; the hearth is left behind.
  const P = [[20, 60], [340, 60], [20, 390], [340, 390]];
  const titles = ['Relocation', 'Contagious (expansion)', 'Hierarchical (expansion)', 'Stimulus (expansion)'];
  const notes = ['People move and carry\nthe trait to a new place.', 'Spreads to the nearest\nplaces, like a ripple.', 'Spreads from big places\nto smaller ones.', 'The idea spreads, but people\nchange it to fit their culture.'];
  P.forEach(([x, y], i) => { b += text(x, y + 6, titles[i], { size: 19, bold: true, fill: TEAL }); b += lines(x, y + (i < 2 ? 238 : 262), notes[i], { size: 16 }); });
  b += grid(20, 76, (r, c) => (r === 0 && c === 0) || (r === 3 && c === 5));
  b += path('M50,106 C150,120 230,190 248,226', { stroke: VERM, w: 2.6, dash: '8 6', arrow: 'verm' });
  b += text(60, 96, 'hearth', { size: 15, fill: VERM });
  b += grid(340, 76, (r, c) => Math.abs(r - 1) + Math.abs(c - 2) <= 2);
  b += circle(458, 150, 10, { fill: VERM });
  b += grid(20, 406, () => false);
  b += circle(94, 480, 16, { fill: VERM }) + circle(226, 524, 12, { fill: TEAL }) + circle(270, 436, 12, { fill: TEAL }) + circle(138, 568, 9, { fill: TEAL });
  b += line(108, 486, 212, 518, { stroke: VERM, w: 2.4, arrow: 'verm' }) + line(108, 472, 256, 440, { stroke: VERM, w: 2.4, arrow: 'verm' }) + line(222, 536, 148, 562, { stroke: TEAL, w: 2, arrow: 'teal' });
  b += text(20, 618, 'big city first, then smaller towns', { size: 15, fill: VERM });
  b += grid(340, 406, (r, c) => r === 1 && c === 1);
  b += circle(414, 450, 10, { fill: VERM });
  for (const [r, c] of [[1, 3], [2, 4], [0, 4]]) b += rect(340 + 30 + c * 44 - 9, 406 + 30 + r * 44 - 9, 18, 18, { fill: PURP, rx: 2 });
  b += text(340, 618, 'circles become squares: changed', { size: 15, fill: PURP });
  add('diffusion-types', 'diffusion-types-four', W, H, 'Four small grids of places. Relocation: a dashed arrow shows people carrying a trait from the hearth to a far place. Contagious: the trait fills the places nearest the hearth, like a ripple. Hierarchical: arrows run from a big city to smaller towns, skipping the places between. Stimulus: the idea reaches nearby places but changes form there, shown as circles turning into squares.', b, 'The kinds of diffusion');
}

// 3.5 How a creole language forms.
{
  const W = 640, H = 600;
  let b = text(W / 2, 32, 'From contact to a creole language', { anchor: 'middle', size: 21, bold: true });
  b += box(30, 60, 270, 70, 'Speakers of\nLanguage 1', { fill: TINT, stroke: TEAL, size: 18 });
  b += box(340, 60, 270, 70, 'Speakers of\nLanguage 2', { fill: LILAC, stroke: PURP, size: 18 });
  b += line(165, 132, 280, 182, { stroke: TEAL, w: 2.6, arrow: 'teal' }) + line(475, 132, 360, 182, { stroke: PURP, w: 2.6, arrow: 'purp' });
  b += box(140, 188, 360, 92, 'Pidgin: a simple mixed\nlanguage for trade or work.\nNo one speaks it from birth.', { fill: WARM, stroke: VERM, size: 17 });
  b += line(320, 282, 320, 322, { stroke: VERM, w: 2.6, arrow: 'verm' });
  b += text(336, 308, 'children grow up speaking it', { size: 16, fill: VERM });
  b += box(140, 328, 360, 92, 'Creole: a full language that\nchildren learn as their\nfirst language.', { fill: MINT, stroke: GREEN, size: 17 });
  b += box(30, 448, 580, 124, 'Example: Haitian Creole (Kreyòl) grew from French\nand West African languages spoken by enslaved\npeople brought to Haiti. Haiti\'s 1987 constitution\nmade it an official language beside French.', { fill: '#FFFFFF', stroke: GREY, size: 17 });
  add('diffusion-history', 'diffusion-history-creole', W, H, 'Flow diagram: speakers of two languages meet and make a pidgin, a simple mixed language for trade or work that no one speaks from birth. When children grow up speaking it, it becomes a creole, a full first language. Example: Haitian Creole grew from French and West African languages spoken by enslaved people brought to Haiti, and Haiti\'s 1987 constitution made it an official language beside French.', b, 'How a creole language forms');
}

// 3.6 Globalization: convergence and divergence.
{
  const W = 640, H = 540;
  let b = text(W / 2, 32, 'Globalization pulls culture two ways', { anchor: 'middle', size: 21, bold: true });
  b += box(150, 56, 340, 92, 'Globalization\nfaster links: internet, phones,\nflights, trade, streaming', { fill: TINT, stroke: TEAL, size: 17 });
  b += line(240, 150, 150, 214, { stroke: PURP, w: 2.6, arrow: 'purp' }) + line(400, 150, 490, 214, { stroke: GREEN, w: 2.6, arrow: 'green' });
  b += box(20, 220, 290, 80, 'Cultural convergence:\nplaces grow more alike', { fill: LILAC, stroke: PURP, size: 18, bold: true });
  b += box(330, 220, 290, 80, 'Cultural divergence:\nplaces grow more different', { fill: MINT, stroke: GREEN, size: 18, bold: true });
  b += lines(30, 340, 'The same chain stores,\nsongs and apps in many\ncountries; English used\nfor business and online.', { size: 17 });
  b += lines(340, 340, 'Groups protect or revive\ntheir own language, food\nand customs, such as the\nrevival of te reo Māori.', { size: 17 });
  b += box(40, 470, 560, 48, 'Both can happen in the same place at the same time.', { fill: '#FFFFFF', stroke: TEAL, size: 17 });
  add('diffusion-today', 'diffusion-today-paths', W, H, 'Diagram: globalization, the faster links of the internet, phones, flights, trade and streaming, leads two ways. Cultural convergence: places grow more alike, with the same chain stores, songs and apps in many countries and English used for business and online. Cultural divergence: places grow more different, as groups protect or revive their own language, food and customs, such as the revival of te reo Māori. Both can happen in the same place at the same time.', b, 'Cultural convergence and divergence');
}

// 3.7 Part of the Indo-European language family.
{
  const W = 640, H = 560;
  let b = text(W / 2, 32, 'Part of the Indo-European language family', { anchor: 'middle', size: 21, bold: true });
  b += box(170, 54, 300, 52, 'Indo-European (family)', { fill: TINT, stroke: TEAL, size: 19, bold: true });
  const br = [['Germanic', ['English', 'German', 'Dutch', 'Swedish']], ['Romance', ['Spanish', 'Portuguese', 'French', 'Italian']], ['Slavic', ['Russian', 'Polish', 'Ukrainian', 'Czech']], ['Indo-Iranian', ['Hindi', 'Bengali', 'Punjabi', 'Persian']]];
  br.forEach(([name, langs], i) => {
    const x = 14 + i * 156, w = 144;
    b += line(320, 108, x + w / 2, 168, { stroke: TEAL, w: 2.2 });
    b += box(x, 170, w, 48, name, { fill: '#FFFFFF', stroke: TEAL, size: 17, bold: true });
    langs.forEach((l, j) => { b += line(x + w / 2, 220 + j * 64, x + w / 2, 240 + j * 64, { stroke: GREY, w: 1.6 }); b += box(x + 10, 240 + j * 64, w - 20, 40, l, { fill: SOFT, stroke: GREY, size: 16, w: 1.4, rx: 6 }); });
  });
  b += text(28, 520, 'Family, then branch, then language. Dialects are versions of one language.', { size: 15, fill: GREY });
  b += text(28, 542, 'Only some branches and languages are shown.', { size: 15, fill: GREY });
  add('religion-language-diffusion', 'religion-language-diffusion-tree', W, H, 'Tree diagram of part of the Indo-European language family. Four branches: Germanic (English, German, Dutch, Swedish), Romance (Spanish, Portuguese, French, Italian), Slavic (Russian, Polish, Ukrainian, Czech) and Indo-Iranian (Hindi, Bengali, Punjabi, Persian). A note says the order is family, then branch, then language, that dialects are versions of one language, and that only some branches are shown.', b, 'The Indo-European language family');
}

// 3.7 How universalizing and ethnic religions spread.
{
  const W = 640, H = 500;
  let b = text(W / 2, 32, 'How the two kinds of religion spread', { anchor: 'middle', size: 21, bold: true });
  b += text(160, 70, 'Universalizing', { anchor: 'middle', size: 20, bold: true, fill: TEAL }) + text(480, 70, 'Ethnic', { anchor: 'middle', size: 20, bold: true, fill: PURP });
  b += rect(14, 84, 292, 260, { fill: SOFT, stroke: GREY, w: 1.2, rx: 10 }) + rect(334, 84, 292, 260, { fill: SOFT, stroke: GREY, w: 1.2, rx: 10 });
  b += circle(160, 214, 26, { fill: TEAL }) + text(160, 220, 'hearth', { anchor: 'middle', size: 13, bold: true, fill: '#FFFFFF' });
  for (const [x, y] of [[44, 110], [270, 120], [40, 320], [280, 318], [160, 106]]) b += line(160 + (x - 160) * 0.22, 214 + (y - 214) * 0.22, x, y, { stroke: TEAL, w: 2.6, arrow: 'teal' }) + circle(x, y, 8, { fill: TEAL });
  b += circle(480, 214, 26, { fill: PURP }) + text(480, 220, 'hearth', { anchor: 'middle', size: 13, bold: true, fill: '#FFFFFF' });
  b += circle(480, 214, 62, { fill: 'none', stroke: PURP, w: 2, dash: '6 6' });
  b += path('M520,250 C560,290 580,300 596,318', { stroke: PURP, w: 2.4, dash: '8 6', arrow: 'purp' }) + circle(600, 322, 8, { fill: PURP });
  b += lines(24, 376, 'Seeks new followers anywhere.\nSpreads by expansion and\nrelocation diffusion.\nChristianity, Islam,\nBuddhism, Sikhism.', { size: 16 });
  b += lines(344, 376, 'Tied to one group and place.\nStays near its hearth, or\nspreads by relocation when\nfollowers migrate.\nHinduism, Judaism.', { size: 16 });
  add('religion-language-diffusion', 'religion-language-diffusion-spread', W, H, 'Two panels. Universalizing religions: arrows go out in every direction from the hearth; they seek new followers anywhere and spread by expansion and relocation diffusion; examples Christianity, Islam, Buddhism and Sikhism. Ethnic religions: most followers stay in a ring near the hearth, and one dashed arrow shows relocation when followers migrate; examples Hinduism and Judaism.', b, 'Universalizing and ethnic religions');
}

// 3.8 Four results when cultures meet.
{
  const W = 640, H = 600;
  let b = text(W / 2, 32, 'When two cultures meet', { anchor: 'middle', size: 22, bold: true });
  const cards = [
    ['Acculturation', 'Adopts some traits of the\nother culture and keeps\nits own.', (x, y) => circle(x, y, 18, { fill: TEAL }) + circle(x + 26, y, 12, { fill: VERM })],
    ['Assimilation', 'Takes on the other culture\nso fully that its own traits\nfade away.', (x, y) => circle(x, y, 18, { fill: VERM, stroke: TEAL, w: 3 }) + line(x + 24, y, x + 48, y, { stroke: INK, w: 2, arrow: 'ink' }) + circle(x + 66, y, 18, { fill: VERM })],
    ['Syncretism', 'Traits blend into something\nnew that neither culture\nhad before.', (x, y) => circle(x, y, 16, { fill: TEAL }) + circle(x + 22, y, 16, { fill: VERM }) + line(x + 44, y, x + 62, y, { stroke: INK, w: 2, arrow: 'ink' }) + circle(x + 80, y, 18, { fill: PURP })],
    ['Multiculturalism', 'Many cultures live side by\nside and each keeps its\nown traits.', (x, y) => circle(x, y, 14, { fill: TEAL }) + circle(x + 32, y, 14, { fill: VERM }) + circle(x + 64, y, 14, { fill: GREEN }) + circle(x + 96, y, 14, { fill: PURP })],
  ];
  cards.forEach(([name, what, icon], i) => {
    const x = i % 2 ? 330 : 20, y = 60 + Math.floor(i / 2) * 262;
    b += rect(x, y, 290, 244, { fill: SOFT, stroke: TEAL, w: 2, rx: 12 });
    b += text(x + 145, y + 36, name, { anchor: 'middle', size: 21, bold: true, fill: TEAL });
    b += icon(x + 90, y + 92);
    b += lines(x + 145, y + 156, what, { anchor: 'middle', size: 17 });
  });
  add('diffusion-effects', 'diffusion-effects-outcomes', W, H, 'Four cards. Acculturation: a group adopts some traits of another culture and keeps its own. Assimilation: a group takes on the other culture so fully that its own traits fade away. Syncretism: traits blend into something new that neither culture had before. Multiculturalism: many cultures live side by side and each keeps its own traits.', b, 'Acculturation, assimilation, syncretism and multiculturalism');
}

mkdirSync(REG, { recursive: true });
for (const [topic, figs] of Object.entries(out)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(figs, null, 1) + '\n');
console.log(`author C figures: ${Object.values(out).reduce((n, f) => n + Object.keys(f).length, 0)} written.`);
