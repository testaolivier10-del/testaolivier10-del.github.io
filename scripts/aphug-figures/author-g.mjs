/* Author G (Unit 7) figures for AP® Human Geography: drawn LevlPrep SVG
   diagrams, one or two per topic, and their entries in
   human-geography/data/figures/<topic>.json.

     node scripts/aphug-figures/author-g.mjs           write the SVGs and the figure entries
     node scripts/aphug-figures/author-g.mjs --check   exit 1 if a file would change

   Every word is large (17 px or more on a 640-wide canvas, so about 10 px on a
   360 px phone) and kept inside its own box, so nothing crowds or overlaps. */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIG = join(ROOT, 'human-geography', 'figures');
const DATA = join(ROOT, 'human-geography', 'data', 'figures');
const INK = '#1F2A28', TEAL = '#094953', TINT = '#E1F1F4', VER = '#C24E00', GRN = '#007A5A', PUR = '#7A4F9E';
const PALE = { teal: '#E1F1F4', ver: '#FBE7DA', grn: '#DDF2EA', pur: '#EEE6F5', grey: '#F2F2EF' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function text(x, y, lines, { size = 18, weight = 400, fill = INK, anchor = 'middle', lh = 1.25 } = {}) {
  const L = [].concat(lines);
  const y0 = y - ((L.length - 1) * size * lh) / 2;
  return L.map((l, i) => `<text x="${x}" y="${(y0 + i * size * lh + size * 0.35).toFixed(1)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(l)}</text>`).join('');
}
function box(x, y, w, h, lines, { fill = PALE.teal, stroke = TEAL, size = 18, weight = 400, head } = {}) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  if (head) {
    s += text(x + w / 2, y + 22, head, { size: size + 1, weight: 700, fill: stroke });
    s += text(x + w / 2, y + 22 + (h - 22) / 2 + 4, lines, { size, weight });
  } else s += text(x + w / 2, y + h / 2, lines, { size, weight });
  return s;
}
function arrow(id, x1, y1, x2, y2, color = INK) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2.5" marker-end="url(#${id}-ar)"/>`;
}
function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="Arial, Helvetica, sans-serif">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs><marker id="${id}-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}"/></marker></defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}

const FIGS = [];
function fig(topic, id, w, h, title, alt, body) { FIGS.push({ topic, id, w, h, alt, content: svg(id, w, h, title, alt, body) }); }

/* 7.1 How industrialization spread its effects. */
{
  const id = 'industrial-revolution-chain';
  let b = '';
  b += box(30, 20, 270, 80, ['New machines', '(the steam engine)']);
  b += box(340, 20, 270, 80, ['Coal and iron ore', 'close at hand']);
  b += arrow(id, 165, 100, 290, 140) + arrow(id, 475, 100, 350, 140);
  b += box(170, 145, 300, 70, ['Factories open in towns'], { fill: PALE.ver, stroke: VER, weight: 700 });
  b += arrow(id, 250, 215, 165, 255) + arrow(id, 390, 215, 475, 255);
  b += box(30, 260, 270, 80, ['Farm workers move', 'to factory towns']);
  b += box(340, 260, 270, 80, ['Factories need more', 'cotton, rubber and buyers']);
  b += arrow(id, 165, 340, 165, 375) + arrow(id, 475, 340, 475, 375);
  b += box(30, 380, 270, 80, ['Cities grow fast; a new', 'working class forms'], { fill: PALE.grn, stroke: GRN });
  b += box(340, 380, 270, 80, ['Colonies supply raw', 'materials and markets'], { fill: PALE.pur, stroke: PUR });
  fig('industrial-revolution', id, 640, 480, 'How the Industrial Revolution changed places',
    'Flow diagram. New machines such as the steam engine, and coal and iron ore close at hand, lead to factories opening in towns. Factories lead to two effects: farm workers move to factory towns, so cities grow fast and a new working class forms; and factories need more cotton, rubber and buyers, so colonies supply raw materials and markets.', b);
}

/* 7.2 The five sectors as a ladder. */
{
  const id = 'economic-sectors-ladder';
  const rows = [
    ['Quinary', 'Top decisions', 'Heads of big firms and governments', PALE.pur, PUR],
    ['Quaternary', 'Information and research', 'Scientists, software, finance', PALE.teal, TEAL],
    ['Tertiary', 'Services', 'Shops, transport, health care', PALE.grn, GRN],
    ['Secondary', 'Making goods', 'Factories, building', PALE.ver, VER],
    ['Primary', 'Taking from nature', 'Farming, mining, fishing', PALE.grey, INK],
  ];
  let b = '';
  rows.forEach(([n, what, ex, fill, stroke], i) => {
    const y = 16 + i * 84;
    b += `<rect x="20" y="${y}" width="600" height="72" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    b += text(36, y + 36, n, { size: 21, weight: 700, fill: stroke, anchor: 'start' });
    b += text(220, y + 24, what, { size: 18, weight: 700, anchor: 'start' });
    b += text(220, y + 50, ex, { size: 17, anchor: 'start' });
  });
  fig('economic-sectors', id, 640, 440, 'The five economic sectors',
    'Five stacked bands, from the bottom up. Primary: taking from nature, such as farming, mining and fishing. Secondary: making goods in factories and building. Tertiary: services such as shops, transport and health care. Quaternary: information and research, such as scientists, software and finance. Quinary: top decisions by the heads of big firms and governments.', b);
}

/* 7.3 What goes into the HDI. */
{
  const id = 'development-measures-hdi';
  let b = '';
  b += box(16, 20, 192, 120, ['Life expectancy', 'at birth'], { head: 'Health', fill: PALE.grn, stroke: GRN, size: 17 });
  b += box(224, 20, 192, 120, ['Years of', 'schooling'], { head: 'Education', fill: PALE.teal, stroke: TEAL, size: 17 });
  b += box(432, 20, 192, 120, ['Income per', 'person (GNI)'], { head: 'Income', fill: PALE.ver, stroke: VER, size: 17 });
  b += arrow(id, 112, 140, 250, 222) + arrow(id, 320, 140, 320, 222) + arrow(id, 528, 140, 390, 222);
  b += box(150, 228, 340, 100, ['Human Development Index', 'one number from 0 to 1'], { fill: '#FFFFFF', stroke: INK, size: 19, weight: 700 });
  b += text(320, 362, 'Higher means longer, healthier, better-schooled lives', { size: 17 });
  b += text(320, 390, 'and more income. It shows nothing about who gets it.', { size: 17 });
  fig('development-measures', id, 640, 410, 'The three parts of the Human Development Index',
    'Three boxes feed one. Health is measured by life expectancy at birth, education by years of schooling, and income by income per person (GNI). Together they make the Human Development Index, one number from 0 to 1. Higher means longer, healthier, better-schooled lives and more income; it shows nothing about who gets the income.', b);
}

/* 7.4 How a microloan cycle works. */
{
  const id = 'women-development-cycle';
  let b = '';
  b += box(170, 16, 300, 80, ['A small loan, often to', 'a woman in a group']);
  b += box(390, 170, 236, 90, ['She starts or grows', 'a small business'], { fill: PALE.ver, stroke: VER });
  b += box(170, 330, 300, 80, ['Income pays for food,', 'school fees and repayment'], { fill: PALE.grn, stroke: GRN });
  b += box(14, 170, 236, 90, ['A repaid loan lets', 'her borrow more'], { fill: PALE.pur, stroke: PUR });
  b += arrow(id, 440, 96, 500, 166) + arrow(id, 500, 260, 440, 326) + arrow(id, 200, 330, 140, 264) + arrow(id, 140, 170, 200, 100);
  b += text(320, 215, 'Microlending', { size: 21, weight: 700, fill: TEAL });
  fig('women-development', id, 640, 430, 'The microlending cycle',
    'A loop of four steps around the word microlending. A small loan goes, often, to a woman in a group. She starts or grows a small business. Its income pays for food, school fees and the repayment. A repaid loan lets her borrow more, and the loop starts again.', b);
}

/* 7.5 Rostow's staircase and the world system. */
{
  const id = 'development-theories-rostow';
  const steps = [['1', 'Traditional', 'society'], ['2', 'Preconditions', 'for take-off'], ['3', 'Take-off'], ['4', 'Drive to', 'maturity'], ['5', 'High mass', 'consumption']];
  let b = '';
  steps.forEach((l, i) => {
    const x = 10 + i * 124, top = 290 - i * 52;
    b += `<rect x="${x}" y="${top}" width="122" height="${380 - top}" fill="${i % 2 ? PALE.teal : '#C9E6EB'}" stroke="${TEAL}" stroke-width="2"/>`;
    b += text(x + 61, top + 14 + l.length * 10, l, { size: 15, weight: 700, fill: TEAL });
  });
  b += text(170, 26, 'One path, step by step', { size: 18, weight: 700, fill: VER });
  b += arrow(id, 30, 150, 300, 56, VER);
  fig('development-theories', id, 640, 390, "Rostow's five stages of economic growth",
    "A staircase of five steps rising from left to right: 1 traditional society, 2 preconditions for take-off, 3 take-off, 4 drive to maturity, 5 high mass consumption. An arrow labeled one path, step by step, climbs beside it.", b);
}
{
  const id = 'development-theories-world-system';
  let b = '';
  b += box(170, 16, 300, 90, ['Most high-wage, high-tech', 'and decision work'], { head: 'Core', fill: PALE.teal, stroke: TEAL, size: 17 });
  b += box(170, 166, 300, 90, ['A mix: factories, some', 'research, some farming'], { head: 'Semiperiphery', fill: PALE.pur, stroke: PUR, size: 17 });
  b += box(170, 316, 300, 90, ['Mostly raw materials', 'and low-wage work'], { head: 'Periphery', fill: PALE.ver, stroke: VER, size: 17 });
  b += arrow(id, 150, 316, 150, 110) + arrow(id, 490, 110, 490, 316);
  b += text(76, 200, ['Raw', 'materials,', 'cheap', 'labor'], { size: 16 });
  b += text(566, 200, ['Factory', 'goods,', 'loans,', 'profits'], { size: 16 });
  fig('development-theories', id, 640, 420, "Wallerstein's world system",
    'Three stacked boxes. Core at the top: most high-wage, high-tech and decision work. Semiperiphery in the middle: a mix of factories, some research and some farming. Periphery at the bottom: mostly raw materials and low-wage work. An arrow on the left carries raw materials and cheap labor up toward the core; an arrow on the right carries factory goods, loans and profits down from the core.', b);
}

/* 7.6 Comparative advantage with two invented countries. */
{
  const id = 'trade-world-economy-advantage';
  let b = '';
  b += box(16, 16, 296, 190, ['Rice: 6 tonnes', 'or', 'Bikes: 3'], { head: 'Country A, one day', fill: PALE.teal, stroke: TEAL });
  b += box(328, 16, 296, 190, ['Rice: 2 tonnes', 'or', 'Bikes: 2'], { head: 'Country B, one day', fill: PALE.ver, stroke: VER });
  b += box(16, 230, 296, 110, ['1 bike costs 2 t of rice', '1 t of rice costs 0.5 bike'], { fill: '#FFFFFF', stroke: TEAL, size: 17 });
  b += box(328, 230, 296, 110, ['1 bike costs 1 t of rice', '1 t of rice costs 1 bike'], { fill: '#FFFFFF', stroke: VER, size: 17 });
  b += text(164, 370, 'Gives up less for rice:', { size: 17, weight: 700, fill: TEAL });
  b += text(164, 396, 'A makes rice', { size: 17, weight: 700, fill: TEAL });
  b += text(476, 370, 'Gives up less for bikes:', { size: 17, weight: 700, fill: VER });
  b += text(476, 396, 'B makes bikes', { size: 17, weight: 700, fill: VER });
  fig('trade-world-economy', id, 640, 420, 'Comparative advantage in two invented countries',
    'Two invented countries. In one day of work, Country A makes 6 tonnes of rice or 3 bikes; Country B makes 2 tonnes of rice or 2 bikes. So in A one bike costs 2 tonnes of rice and a tonne of rice costs half a bike; in B one bike costs 1 tonne of rice and a tonne of rice costs 1 bike. A gives up less to make rice, so A makes rice; B gives up less to make bikes, so B makes bikes.', b);
}

/* 7.7 Agglomeration and a growth pole side by side. */
{
  const id = 'world-economy-changes-poles';
  let b = '';
  b += `<rect x="12" y="12" width="300" height="300" rx="14" fill="${PALE.teal}" stroke="${TEAL}" stroke-width="2"/>`;
  b += `<rect x="328" y="12" width="300" height="300" rx="14" fill="${PALE.ver}" stroke="${VER}" stroke-width="2"/>`;
  b += text(162, 44, 'Agglomeration', { size: 21, weight: 700, fill: TEAL });
  b += text(478, 44, 'Growth pole', { size: 21, weight: 700, fill: VER });
  const firm = (x, y, s = 1, c = TEAL) => `<rect x="${x - 14 * s}" y="${y - 10 * s}" width="${28 * s}" height="${20 * s}" fill="${c}"/><rect x="${x - 14 * s}" y="${y - 22 * s}" width="${8 * s}" height="${12 * s}" fill="${c}"/>`;
  for (const [x, y] of [[120, 120], [160, 110], [200, 125], [130, 160], [175, 155], [215, 165], [150, 195], [195, 200]]) b += firm(x, y);
  b += text(162, 262, ['Many firms cluster', 'together to share', 'workers, suppliers', 'and ideas'], { size: 17 });
  b += firm(478, 150, 2, VER);
  for (const [x, y] of [[380, 95], [580, 95], [380, 210], [580, 210]]) { b += `<circle cx="${x}" cy="${y}" r="9" fill="${VER}"/>`; b += arrow(id, 478 + (x - 478) * 0.3, 150 + (y - 150) * 0.3, 478 + (x - 478) * 0.85, 150 + (y - 150) * 0.85); }
  b += text(478, 262, ['One key project', 'sparks growth in', 'the towns and region', 'around it'], { size: 17 });
  fig('world-economy-changes', id, 640, 324, 'Agglomeration compared with a growth pole',
    'Two panels. Agglomeration: many small factories clustered together, labeled many firms cluster together to share workers, suppliers and ideas. Growth pole: one large factory with arrows reaching out to four small towns, labeled one key project sparks growth in the towns and region around it.', b);
}

/* 7.8 The three parts of sustainable development. */
{
  const id = 'sustainable-development-circles';
  let b = '';
  b += `<circle cx="230" cy="150" r="125" fill="${PALE.ver}" fill-opacity="0.85" stroke="${VER}" stroke-width="2"/>`;
  b += `<circle cx="410" cy="150" r="125" fill="${PALE.teal}" fill-opacity="0.85" stroke="${TEAL}" stroke-width="2"/>`;
  b += `<circle cx="320" cy="290" r="125" fill="${PALE.grn}" fill-opacity="0.85" stroke="${GRN}" stroke-width="2"/>`;
  b += text(190, 110, ['Economy:', 'jobs and', 'income'], { size: 18, weight: 700, fill: VER });
  b += text(450, 110, ['Society:', 'health, school,', 'fair shares'], { size: 18, weight: 700, fill: TEAL });
  b += text(320, 350, ['Environment:', 'clean air, water,', 'forests, climate'], { size: 18, weight: 700, fill: GRN });
  b += `<circle cx="320" cy="200" r="7" fill="${INK}"/>`;
  b += `<line x1="320" y1="200" x2="560" y2="330" stroke="${INK}" stroke-width="2"/>`;
  b += box(468, 330, 160, 84, ['All three:', 'sustainable', 'development'], { fill: '#FFFFFF', stroke: INK, size: 16, weight: 700 });
  fig('sustainable-development', id, 640, 426, 'The three parts of sustainable development',
    'Three overlapping circles. Economy: jobs and income. Society: health, school and fair shares. Environment: clean air, water, forests and climate. The point where all three overlap is labeled sustainable development.', b);
}

const check = process.argv.includes('--check');
let changed = 0;
const byTopic = {};
for (const f of FIGS) {
  const p = join(FIG, `${f.id}.svg`);
  if (!existsSync(p) || readFileSync(p, 'utf8') !== f.content) { changed++; if (!check) writeFileSync(p, f.content); }
  (byTopic[f.topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
}
for (const [topic, entries] of Object.entries(byTopic)) {
  const p = join(DATA, `${topic}.json`), s = JSON.stringify(entries, null, 1) + '\n';
  if (!existsSync(p) || readFileSync(p, 'utf8') !== s) { changed++; if (!check) writeFileSync(p, s); }
}
if (check && changed) { console.log(`author-g figures: ${changed} files out of date; run node scripts/aphug-figures/author-g.mjs`); process.exit(1); }
console.log(`author-g figures: ${FIGS.length} figures${check ? ', up to date' : `, ${changed} files written`}.`);
