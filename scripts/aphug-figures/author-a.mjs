/* AP® Human Geography figures for the "Skills you need" chapter and Unit 1
   (author A). Every figure is a LevlPrep original diagram or drawn scene; no
   photos, no real data (the drawn places are invented or generic).
   Writes
     human-geography/figures/<id>.svg
     human-geography/data/figures/<topic>.json   (the registry entries)

     node scripts/aphug-figures/author-a.mjs

   Style: white background, role="img" with <title> and <desc>, Arial or
   Helvetica, ink #1F2A28, course teal #094953 for emphasis, then vermillion
   #C24E00, green #009E73 and reddish purple #A8508A (the ApHugPlot colors).
   Text is 15 px or more on a 720 px canvas so it stays readable on a phone. */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'human-geography', 'figures');
const REG = join(ROOT, 'human-geography', 'data', 'figures');
const INK = '#1F2A28', TEAL = '#094953', VERM = '#C24E00', GREEN = '#009E73', PURP = '#A8508A', GREY = '#5F6B68',
  LINE = '#C9D3D1', TINT = '#E1F1F4', SOFT = '#F4F7F7', WARM = '#FBE9DC', MINT = '#DDF2EA', SAND = '#F3E7C9';
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
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.8}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}${o.both ? ` marker-start="url(#ar-${o.arrow})"` : ''}/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.4}"${o.op ? ` fill-opacity="${o.op}"` : ''}/>`;
const path = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` fill-opacity="${o.op}"` : ''} stroke-linejoin="round" stroke-linecap="round"${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const marker = (id, c) => `<marker id="ar-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
const DEFS = `<defs>${marker('ink', INK)}${marker('teal', TEAL)}${marker('verm', VERM)}${marker('green', GREEN)}</defs>`;
const g = (dx, dy, body) => `<g transform="translate(${dx} ${dy})">${body}</g>`;
function box(x, y, w, h, label, o = {}) {
  const n = String(label).split('\n').length, size = o.size || 16, lh = size * 1.3;
  return rect(x, y, w, h, { fill: o.fill || SOFT, stroke: o.stroke || TEAL, w: o.w || 1.8, rx: o.rx }) +
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

const figs = [];
function add(topic, id, w, h, title, alt, body) { figs.push({ topic, id, w, h, alt, svg: svg(w, h, title, alt, body) }); }

/* ---------------------------------------------------- skills-reading */
{
  const cards = [
    ['1', 'Title', 'What does it show,\nwhere and when?', 'Share of people in cities,\nby country, 2020'],
    ['2', 'Legend and units', 'What do the shades\nand numbers mean?', 'Darker = higher;\nunits are percent'],
    ['3', 'Source line', 'Who made the data,\nand in what year?', 'A dated source,\nor "invented data"'],
    ['4', 'Pattern', 'Where is it high, where\nlow, and by how much?', 'Name a real place\nand give a value'],
  ];
  let b = text(360, 34, 'Read any map, table or chart in four steps', { anchor: 'middle', size: 20, bold: true });
  cards.forEach(([n, head, ask, eg], i) => {
    const x = 20 + (i % 2) * 350, y = 56 + Math.floor(i / 2) * 180;
    b += rect(x, y, 330, 164, { fill: i === 3 ? TINT : SOFT, stroke: TEAL, w: 1.8 });
    b += circle(x + 30, y + 30, 18, { fill: TEAL }) + text(x + 30, y + 37, n, { anchor: 'middle', size: 20, bold: true, fill: '#FFFFFF' });
    b += text(x + 60, y + 37, head, { size: 19, bold: true, fill: TEAL });
    b += lines(x + 20, y + 76, ask, { size: 16 });
    b += lines(x + 20, y + 126, eg, { size: 15, fill: GREY, italic: true });
  });
  add('skills-reading', 'skills-reading-steps', 720, 420, 'Four steps for reading a map, table or chart',
    'Four numbered cards. 1, Title: what does it show, where and when? 2, Legend and units: what do the shades and numbers mean? 3, Source line: who made the data, and in what year? 4, Pattern: where is it high, where low, and by how much, naming a real place and a value.', b);
}

/* ------------------------------------------------------ skills-scale */
{
  let b = text(180, 34, 'Map scale', { anchor: 'middle', size: 20, bold: true, fill: TEAL }) +
    text(540, 34, 'Scale of analysis', { anchor: 'middle', size: 20, bold: true, fill: VERM });
  b += line(360, 20, 360, 340, { stroke: LINE, w: 2 });
  b += lines(180, 62, 'How much the map shrinks\nthe ground', { anchor: 'middle', size: 16 });
  // scale bar
  b += rect(40, 110, 70, 12, { fill: INK, rx: 0 }) + rect(110, 110, 70, 12, { fill: '#FFFFFF', stroke: INK, rx: 0, w: 1.4 }) + rect(180, 110, 70, 12, { fill: INK, rx: 0 });
  b += text(40, 142, '0', { size: 15, anchor: 'middle' }) + text(250, 142, '3 km', { size: 15, anchor: 'middle' });
  b += text(300, 121, '1:50,000', { size: 15, anchor: 'middle', bold: true });
  b += box(30, 168, 300, 70, 'Large-scale map (1:10,000)\nsmall area, much detail', { fill: TINT, size: 15 });
  b += box(30, 252, 300, 70, 'Small-scale map (1:50,000,000)\nlarge area, little detail', { fill: SOFT, size: 15 });
  b += lines(540, 62, 'The size of the unit each\nnumber describes', { anchor: 'middle', size: 16 });
  // one value
  b += rect(400, 110, 110, 110, { fill: WARM, stroke: VERM, w: 2, rx: 4 }) + text(455, 172, '40', { anchor: 'middle', size: 24, bold: true });
  b += lines(455, 244, 'One value for\nthe country:\nnational scale', { anchor: 'middle', size: 15 });
  // four values
  const v = [['22', 570, 110], ['61', 625, 110], ['35', 570, 165], ['48', 625, 165]];
  for (const [t, x, y] of v) b += rect(x, y, 55, 55, { fill: WARM, stroke: VERM, w: 2, rx: 0 }) + text(x + 27.5, y + 34, t, { anchor: 'middle', size: 18, bold: true });
  b += lines(625, 244, 'One value per\nprovince: local\n(subnational) scale', { anchor: 'middle', size: 15 });
  b += rect(20, 352, 680, 50, { fill: SOFT, stroke: LINE });
  b += text(360, 383, 'Ask: what unit does each number describe? That is the scale of analysis.', { anchor: 'middle', size: 16, bold: true });
  add('skills-scale', 'skills-scale-two-meanings', 720, 420, 'Map scale and scale of analysis are different ideas',
    'Two panels. Map scale: how much the map shrinks the ground, shown with a scale bar of 1:50,000; a large-scale map such as 1:10,000 shows a small area in detail, and a small-scale map such as 1:50,000,000 shows a large area with little detail. Scale of analysis: the size of the unit each number describes; one value for a whole country is the national scale, and one value for each of four provinces is the local, or subnational, scale. A note says: ask what unit each number describes; that is the scale of analysis.', b);
}

/* -------------------------------------------------------- skills-frq */
{
  const rows = [
    ['Identify', 'Name it. A word or a phrase is enough.'],
    ['Define', 'Give its meaning in a full sentence.'],
    ['Describe', 'Give its features: what, where, how much.'],
    ['Explain', 'Say why or how, with "because" or "so".'],
    ['Compare', 'Say how two things differ or match: both sides.'],
    ['Explain the degree', 'State the degree first, then explain why.'],
  ];
  let b = text(360, 32, 'What each task verb asks you to write', { anchor: 'middle', size: 20, bold: true });
  rows.forEach(([v, d], i) => {
    const y = 52 + i * 58, x = 36 + i * 14;
    b += box(x, y, 196, 46, v, { fill: i < 2 ? SOFT : i < 4 ? TINT : WARM, stroke: i < 4 ? TEAL : VERM, bold: true, size: 16 });
    b += text(x + 212, y + 29, d, { size: 16 });
  });
  b += line(24, 60, 24, 400, { stroke: GREY, w: 2, arrow: 'ink' });
  b += `<text x="14" y="230" font-size="15" fill="${GREY}" text-anchor="middle" transform="rotate(-90 14 230)">More is asked</text>`;
  add('skills-frq', 'skills-frq-verbs', 720, 410, 'The six task verbs and what each demands',
    'A staircase of six task verbs, each asking for more than the one above. Identify: name it, a word or a phrase is enough. Define: give its meaning in a full sentence. Describe: give its features, what, where and how much. Explain: say why or how, with because or so. Compare: say how two things differ or match, speaking of both sides. Explain the degree: state the degree first, then explain why.', b);
}

/* ------------------------------------------------- views-of-the-world */
{
  // An invented island in four districts, drawn six ways.
  const D = {
    a: 'M12,34 L58,12 L100,16 L100,62 L16,66 Z', b: 'M100,16 L150,8 L192,36 L186,62 L100,62 Z',
    c: 'M16,66 L100,62 L96,112 L42,116 L12,92 Z', d: 'M100,62 L186,62 L182,96 L142,118 L96,112 Z',
  };
  const outline = o => Object.values(D).map(d => path(d, { fill: o.fill || '#FFFFFF', stroke: o.stroke || GREY, w: 1.4 })).join('');
  const panels = [
    ['Reference map', 'Where things are', () => outline({ fill: SAND }) + path('M20,80 C60,70 90,96 130,84 S180,60 190,50', { stroke: '#3B7DB8', w: 3 }) +
      path('M40,40 L150,96', { stroke: VERM, w: 2.2, dash: '6 4' }) + circle(40, 40, 5) + circle(150, 96, 5) + text(48, 34, 'Port', { size: 13 }) + text(140, 114, 'Mill', { size: 13 })],
    ['Choropleth map', 'A rate, by shading areas', () => path(D.a, { fill: '#BFE3EA', stroke: '#FFFFFF', w: 1.6 }) + path(D.b, { fill: '#2C8C9C', stroke: '#FFFFFF', w: 1.6 }) + path(D.c, { fill: '#6CB8C6', stroke: '#FFFFFF', w: 1.6 }) + path(D.d, { fill: TEAL, stroke: '#FFFFFF', w: 1.6 })],
    ['Dot density map', 'Counts, one dot each', () => outline({}) + [[30, 40], [40, 50], [36, 30], [52, 44], [130, 30], [140, 42], [150, 36], [160, 48], [146, 26], [170, 40], [120, 80], [134, 90], [150, 84], [60, 90], [140, 100]].map(([x, y]) => circle(x, y, 3.2)).join('')],
    ['Graduated symbol map', 'Amounts, by circle size', () => outline({}) + circle(56, 40, 8, { fill: VERM, op: 0.75 }) + circle(146, 36, 18, { fill: VERM, op: 0.75 }) + circle(56, 90, 5, { fill: VERM, op: 0.75 }) + circle(140, 88, 12, { fill: VERM, op: 0.75 })],
    ['Isoline map', 'Lines of equal value', () => outline({}) + path('M20,40 C70,30 130,50 185,40', { stroke: GREEN, w: 2.2 }) + path('M16,70 C70,60 130,80 184,70', { stroke: GREEN, w: 2.2 }) + path('M24,100 C70,90 120,108 170,100', { stroke: GREEN, w: 2.2 }) +
      [['10', 39], ['20', 69], ['30', 100]].map(([v, y]) => rect(88, y - 10, 24, 18, { fill: '#FFFFFF', rx: 3 }) + text(100, y + 4, v, { size: 13, anchor: 'middle', fill: GREEN, bold: true })).join('')],
    ['Cartogram', 'Area resized by a value', () => rect(10, 20, 50, 40, { fill: '#BFE3EA', stroke: GREY, rx: 2 }) + rect(64, 6, 126, 70, { fill: '#2C8C9C', stroke: GREY, rx: 2 }) + rect(10, 64, 50, 32, { fill: '#6CB8C6', stroke: GREY, rx: 2 }) + rect(64, 80, 96, 40, { fill: TEAL, stroke: GREY, rx: 2 })],
  ];
  let b = '';
  panels.forEach(([name, what, draw], i) => {
    const x = 16 + (i % 3) * 248, y = 12 + Math.floor(i / 3) * 228;
    b += rect(x, y, 232, 214, { fill: '#FFFFFF', stroke: LINE });
    b += text(x + 116, y + 28, name, { anchor: 'middle', size: 17, bold: true, fill: i === 0 ? INK : TEAL });
    b += g(x + 16, y + 44, draw());
    b += text(x + 116, y + 196, what, { anchor: 'middle', size: 15, fill: GREY });
  });
  add('views-of-the-world', 'views-of-the-world-types', 760, 468, 'One invented island drawn as six kinds of map',
    'The same invented island of four districts drawn six ways. A reference map shows where things are: a port, a mill, a river and a road. A choropleth map shades each district by a rate. A dot density map shows counts, one dot each. A graduated symbol map shows amounts by the size of circles. An isoline map joins points of equal value with lines labeled 10, 20 and 30. A cartogram resizes each district by a value.', b);
}

/* -------------------------------------------------------- data-sources */
{
  let b = text(190, 34, 'Quantitative data', { anchor: 'middle', size: 19, bold: true, fill: TEAL }) + text(190, 58, 'numbers you can count or measure', { anchor: 'middle', size: 15, fill: GREY });
  b += text(530, 34, 'Qualitative data', { anchor: 'middle', size: 19, bold: true, fill: VERM }) + text(530, 58, 'words, pictures and experiences', { anchor: 'middle', size: 15, fill: GREY });
  const q1 = ['A count of people in each town', 'Satellite readings of crop cover', 'Phone positions from satellite\nnavigation', 'Shares of homes with internet'];
  const q2 = ['Interviews with farmers', 'Field notes and sketches', 'Photos of a street', 'Travel accounts and news stories'];
  q1.forEach((t, i) => { b += box(30, 76 + i * 64, 320, 54, t, { fill: TINT, size: 15 }); });
  q2.forEach((t, i) => { b += box(370, 76 + i * 64, 320, 54, t, { fill: WARM, stroke: VERM, size: 15 }); });
  b += rect(20, 344, 680, 58, { fill: SOFT, stroke: LINE });
  b += lines(360, 368, 'A geographic information system (GIS) stacks both kinds as layers on one map,\nso you can ask how they line up.', { anchor: 'middle', size: 15 });
  add('data-sources', 'data-sources-two-kinds', 720, 420, 'Quantitative and qualitative geographic data',
    'Two columns. Quantitative data are numbers you can count or measure: a count of people in each town, satellite readings of crop cover, phone positions from satellite navigation, shares of homes with internet. Qualitative data are words, pictures and experiences: interviews with farmers, field notes and sketches, photos of a street, travel accounts and news stories. A note says a geographic information system, or GIS, stacks both kinds as layers on one map so you can ask how they line up.', b);
}

/* -------------------------------------------------- data-in-decisions */
{
  const rows = [
    ['Census: children\nby district', 'School board\n(local)', 'Where to build\na new school'],
    ['Satellite images\nof a flood', 'Government agency\n(national)', 'Where to send\nboats and food'],
    ['Census: people\nby state', 'A formula in US\nfederal law (national)', 'Seats each state gets\nin the House'],
  ];
  let b = text(120, 30, 'Data', { anchor: 'middle', size: 18, bold: true, fill: TEAL }) + text(360, 30, 'Who decides (scale)', { anchor: 'middle', size: 18, bold: true, fill: TEAL }) + text(600, 30, 'Decision', { anchor: 'middle', size: 18, bold: true, fill: TEAL });
  rows.forEach(([a, w, d], i) => {
    const y = 46 + i * 100;
    b += box(20, y, 200, 80, a, { fill: TINT, size: 15 }) + box(260, y, 200, 80, w, { fill: SOFT, size: 15 }) + box(500, y, 200, 80, d, { fill: WARM, stroke: VERM, size: 15 });
    b += line(222, y + 40, 256, y + 40, { arrow: 'teal', stroke: TEAL, w: 2.4 }) + line(462, y + 40, 496, y + 40, { arrow: 'teal', stroke: TEAL, w: 2.4 });
  });
  add('data-in-decisions', 'data-in-decisions-flow', 720, 356, 'How geographic data lead to decisions at different scales',
    'Three rows, each from data to who decides to the decision. A census count of children by district goes to a local school board, which decides where to build a new school. Satellite images of a flood go to a national government agency, which decides where to send boats and food. A census count of people by state feeds a formula in United States federal law, at the national scale, that sets the seats each state gets in the House.', b);
}

/* --------------------------------------------------- spatial-concepts */
{
  let b = text(190, 30, 'Distance decay', { anchor: 'middle', size: 19, bold: true, fill: TEAL });
  b += line(60, 290, 340, 290, { arrow: 'ink' }) + line(60, 290, 60, 50, { arrow: 'ink' });
  b += path('M64,64 C110,180 170,240 330,276', { stroke: TEAL, w: 3.4 });
  b += text(200, 322, 'Distance from the store', { anchor: 'middle', size: 15 });
  b += `<text x="30" y="170" font-size="15" fill="${INK}" text-anchor="middle" transform="rotate(-90 30 170)">Visits a week</text>`;
  b += lines(240, 120, 'Fewer visits\nfrom far away', { size: 15, fill: GREY });
  b += line(380, 20, 380, 330, { stroke: LINE, w: 2 });
  b += text(545, 30, 'Site and situation', { anchor: 'middle', size: 19, bold: true, fill: VERM });
  b += box(400, 50, 290, 118, 'Site: the place itself\nhigh ground, a river bend,\nfresh water, flat land', { fill: WARM, stroke: VERM, size: 15 });
  b += box(400, 186, 290, 118, 'Situation: its links to\nother places\non a trade route, near a\nport, between two cities', { fill: TINT, size: 15 });
  add('spatial-concepts', 'spatial-concepts-decay-site', 720, 340, 'Distance decay, and site against situation',
    'Left: a graph of visits a week against distance from a store, a curve that falls steeply and then levels off: fewer visits come from far away. This is distance decay. Right: two boxes. Site is the place itself, such as high ground, a river bend, fresh water or flat land. Situation is its links to other places, such as being on a trade route, near a port or between two cities.', b);
}

/* -------------------------------------------------- human-environment */
{
  let b = text(180, 30, 'Environmental determinism', { anchor: 'middle', size: 18, bold: true, fill: VERM }) + text(180, 52, 'an idea of the late 1800s and early 1900s', { anchor: 'middle', size: 14, fill: GREY });
  b += box(40, 76, 280, 56, 'The physical environment\n(climate, land)', { fill: SAND, stroke: VERM, size: 15 });
  b += line(180, 134, 180, 186, { stroke: VERM, w: 3, arrow: 'verm' }) + text(192, 166, 'decides', { size: 15, bold: true, fill: VERM });
  b += box(40, 190, 280, 56, 'How people live and\nhow they behave', { fill: SOFT, stroke: VERM, size: 15 });
  b += line(360, 18, 360, 270, { stroke: LINE, w: 2 });
  b += text(540, 30, 'Possibilism', { anchor: 'middle', size: 18, bold: true, fill: TEAL }) + text(540, 52, 'the view that replaced it', { anchor: 'middle', size: 14, fill: GREY });
  b += box(400, 76, 280, 56, 'The physical environment\nsets limits and offers options', { fill: SAND, size: 15 });
  b += line(540, 136, 540, 186, { stroke: TEAL, w: 3, arrow: 'teal', both: true }) + text(552, 166, 'people choose', { size: 15, bold: true, fill: TEAL });
  b += box(400, 190, 280, 56, 'Culture and technology\nshape how people use it', { fill: TINT, size: 15 });
  b += rect(20, 280, 680, 60, { fill: WARM, stroke: VERM, w: 1.4 });
  b += lines(360, 304, 'Determinism was used to claim that people in hot climates could not govern\nthemselves, an argument for colonial rule. Geographers rejected it.', { anchor: 'middle', size: 15 });
  add('human-environment', 'human-environment-two-views', 720, 356, 'Environmental determinism against possibilism',
    'Left: environmental determinism, an idea of the late 1800s and early 1900s: an arrow says the physical environment, climate and land, decides how people live and behave. Right: possibilism, the view that replaced it: the physical environment sets limits and offers options, and a two-way arrow says people choose, as culture and technology shape how they use it. A note says determinism was used to claim that people in hot climates could not govern themselves, an argument for colonial rule, and that geographers rejected it.', b);

  // The terraced hillside, a drawn scene for the image set.
  let s = rect(0, 0, 720, 440, { fill: '#EAF4F8', rx: 0 });
  s += path('M0,140 C120,60 260,40 380,70 C500,100 620,60 720,90 L720,440 L0,440 Z', { fill: '#C8D9B0' });
  s += path('M0,130 C140,70 250,58 380,80 C470,95 560,80 720,96 L720,150 L0,170 Z', { fill: '#5E8C52' });
  for (let i = 0; i < 28; i++) { const x = 20 + i * 25, y = 128 - Math.sin(i / 3) * 18; s += path(`M${x},${y + 30} L${x + 11},${y} L${x + 22},${y + 30} Z`, { fill: '#3F6B3A' }); }
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const y = 170 + i * 34, inset = 40 + i * 12;
    s += path(`M${inset},${y} C200,${y - 10} 520,${y - 10} ${720 - inset},${y} L${720 - inset},${y + 30} C520,${y + 22} 200,${y + 22} ${inset},${y + 30} Z`, { fill: i % 2 ? '#9CC46A' : '#B5D47F', stroke: '#7A8B5A', w: 1 });
    s += path(`M${inset},${y + 30} C200,${y + 22} 520,${y + 22} ${720 - inset},${y + 30} L${720 - inset},${y + 34} C520,${y + 26} 200,${y + 26} ${inset},${y + 34} Z`, { fill: '#8C7A62' });
    for (let k = 0; k < 18; k++) { const x = inset + 20 + k * ((680 - 2 * inset) / 18); s += line(x, y + 22, x, y + 10, { stroke: '#4F7A3A', w: 1.6 }); }
  }
  s += path('M600,150 C580,200 620,240 590,290 C570,330 610,370 590,420', { stroke: '#3B7DB8', w: 4 });
  s += path('M0,420 C200,405 500,430 720,412 L720,440 L0,440 Z', { fill: '#7FB2D6' });
  for (const [x, y] of [[632, 392], [676, 396]]) s += rect(x, y, 34, 22, { fill: '#E9D9B8', stroke: '#6B5A44', rx: 1 }) + path(`M${x - 4},${y} L${x + 17},${y - 14} L${x + 38},${y} Z`, { fill: '#9A5A3A' });
  figs.push({ topic: 'human-environment', id: 'human-environment-terraces', w: 720, h: 440,
    alt: 'A drawn scene of a steep, forested hillside cut into seven narrow, flat steps of green crops, each held up by a low stone wall. A small channel carries water down the slope beside the steps. Two houses stand near a river at the foot of the hill.',
    svg: svg(720, 440, 'Terraced fields on a steep hillside', 'A drawn scene of a steep, forested hillside cut into seven narrow, flat steps of green crops, each held up by a low stone wall. A small channel carries water down the slope beside the steps. Two houses stand near a river at the foot of the hill.', s) });
}

/* -------------------------------------------------- scales-of-analysis */
{
  const L = [['Global scale', 'the whole world', 20, 50, 680, 320, SOFT], ['Regional scale', 'South Asia', 50, 96, 620, 258, TINT], ['National scale', 'India', 80, 142, 560, 196, '#C6E4EA'], ['Local scale', 'the city of Mumbai', 110, 188, 500, 134, WARM]];
  let b = text(360, 30, 'Four scales of analysis, one inside the next', { anchor: 'middle', size: 19, bold: true });
  for (const [n, eg, x, y, w, h, fill] of L) { b += rect(x, y, w, h, { fill, stroke: n.startsWith('Local') ? VERM : TEAL, w: 2 }); b += text(x + 16, y + 28, n, { size: 17, bold: true, fill: n.startsWith('Local') ? VERM : TEAL }); b += text(x + w - 16, y + 28, eg, { size: 15, anchor: 'end', fill: GREY }); }
  b += lines(360, 262, 'A pattern can look different at each scale:\nask which scale a source shows.', { anchor: 'middle', size: 16 });
  add('scales-of-analysis', 'scales-of-analysis-nested', 720, 390, 'The four scales of analysis, nested',
    'Four nested boxes, each inside the next: the global scale, the whole world; the regional scale, South Asia; the national scale, India; the local scale, the city of Mumbai. A note says a pattern can look different at each scale, so ask which scale a source shows.', b);
}

/* -------------------------------------------------- regional-analysis */
{
  let b = '';
  const W = 236;
  const heads = [['Formal region', 'One shared trait', 'e.g. where most people\nspeak French'], ['Functional region', 'Organized around a center', 'e.g. a newspaper\'s\ndelivery area'], ['Perceptual region', 'What people believe', 'e.g. "the South"\nin the United States']];
  heads.forEach(([h, s, eg], i) => {
    const x = 12 + i * (W + 12);
    b += rect(x, 10, W, 330, { fill: '#FFFFFF', stroke: LINE });
    b += text(x + W / 2, 38, h, { anchor: 'middle', size: 18, bold: true, fill: TEAL });
    b += text(x + W / 2, 62, s, { anchor: 'middle', size: 15, fill: GREY });
    const cx = x + W / 2, cy = 170;
    if (i === 0) b += path(`M${cx - 80},${cy - 60} L${cx + 70},${cy - 72} L${cx + 88},${cy + 40} L${cx - 20},${cy + 70} L${cx - 90},${cy + 20} Z`, { fill: '#6CB8C6', stroke: TEAL, w: 2.4 });
    if (i === 1) { const pts = [[-80, -50], [70, -70], [90, 30], [-30, 70], [-90, 30], [20, -80], [60, 60]]; for (const [dx, dy] of pts) b += line(cx, cy, cx + dx, cy + dy, { stroke: TEAL, w: 1.6 }) + circle(cx + dx, cy + dy, 5, { fill: TEAL }); b += circle(cx, cy, 13, { fill: VERM }) + rect(cx - 32, cy + 19, 64, 22, { fill: '#FFFFFF', rx: 4 }) + text(cx, cy + 35, 'Center', { size: 14, anchor: 'middle', bold: true, fill: VERM }); }
    if (i === 2) { b += path(`M${cx - 100},${cy - 30} C${cx - 80},${cy - 80} ${cx + 10},${cy - 80} ${cx + 30},${cy - 30} C${cx + 50},${cy + 20} ${cx},${cy + 70} ${cx - 50},${cy + 60} C${cx - 100},${cy + 50} ${cx - 115},${cy + 10} ${cx - 100},${cy - 30} Z`, { fill: '#A8508A', op: 0.18, stroke: PURP, w: 2, dash: '7 5' }) + path(`M${cx - 30},${cy - 50} C${cx + 20},${cy - 90} ${cx + 100},${cy - 40} ${cx + 96},${cy + 20} C${cx + 90},${cy + 70} ${cx + 20},${cy + 80} ${cx - 20},${cy + 50} C${cx - 60},${cy + 20} ${cx - 60},${cy - 30} ${cx - 30},${cy - 50} Z`, { fill: '#A8508A', op: 0.18, stroke: PURP, w: 2, dash: '3 5' }); }
    b += lines(x + W / 2, 286, eg, { anchor: 'middle', size: 15 });
  });
  add('regional-analysis', 'regional-analysis-three-kinds', 760, 352, 'Formal, functional and perceptual regions',
    'Three panels. A formal region shares one trait, drawn as one evenly shaded area, for example where most people speak French. A functional region is organized around a center, drawn as lines from a center to many points, for example a newspaper\'s delivery area. A perceptual region is what people believe, drawn as two overlapping dashed outlines that do not agree, for example "the South" in the United States.', b);
}

mkdirSync(FIG, { recursive: true }); mkdirSync(REG, { recursive: true });
const byTopic = {};
for (const f of figs) {
  writeFileSync(join(FIG, `${f.id}.svg`), f.svg);
  (byTopic[f.topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
}
for (const [t, entries] of Object.entries(byTopic)) writeFileSync(join(REG, `${t}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`author A: ${figs.length} figures in ${Object.keys(byTopic).length} topics`);
