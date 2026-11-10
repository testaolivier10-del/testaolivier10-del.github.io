/* Author G (Unit 7) figures for AP® Human Geography: drawn LevlPrep SVG
   diagrams, one or two per topic, and their entries in
   human-geography/data/figures/<topic>.json.

     node scripts/aphug-figures/author-g.mjs           write the SVGs and the figure entries
     node scripts/aphug-figures/author-g.mjs --check   exit 1 if a file would change

   Every word is large (21 px or more on a 640-wide canvas, so about 11 px in a
   card on a 360 px phone) and kept inside its own box, so nothing crowds or overlaps. */
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
    s += text(x + w / 2, y + size + 6, head, { size: size + 2, weight: 700, fill: stroke });
    s += text(x + w / 2, y + (size + 14) + (h - size - 14) / 2, lines, { size, weight });
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
  b += box(16, 16, 296, 96, ['New machines', '(steam engine)'], { size: 23 });
  b += box(328, 16, 296, 96, ['Coal and iron', 'close at hand'], { size: 23 });
  b += arrow(id, 164, 112, 280, 150) + arrow(id, 476, 112, 360, 150);
  b += box(120, 156, 400, 70, ['Factories open in towns'], { fill: PALE.ver, stroke: VER, weight: 700, size: 23 });
  b += arrow(id, 230, 226, 164, 264) + arrow(id, 410, 226, 476, 264);
  b += box(16, 270, 296, 96, ['Farmworkers move', 'to factory towns'], { size: 23 });
  b += box(328, 270, 296, 96, ['Mills need cotton,', 'rubber and buyers'], { size: 23 });
  b += arrow(id, 164, 366, 164, 398) + arrow(id, 476, 366, 476, 398);
  b += box(16, 404, 296, 96, ['Cities grow fast;', 'a working class forms'], { fill: PALE.grn, stroke: GRN, size: 23 });
  b += box(328, 404, 296, 96, ['Colonies supply raw', 'materials, markets'], { fill: PALE.pur, stroke: PUR, size: 23 });
  fig('industrial-revolution', id, 640, 516, 'How the Industrial Revolution changed places',
    'Flow diagram. New machines such as the steam engine, and coal and iron close at hand, lead to factories opening in towns. Factories lead to two effects: farmworkers move to factory towns, so cities grow fast and a working class forms; and mills need cotton, rubber and buyers, so colonies supply raw materials and markets.', b);
}

/* 7.2 The five sectors as a ladder. */
{
  const id = 'economic-sectors-ladder';
  const rows = [
    ['Quinary', 'Top decisions', 'Heads of firms, governments', PALE.pur, PUR],
    ['Quaternary', 'Information, research', 'Science, software, finance', PALE.teal, TEAL],
    ['Tertiary', 'Services', 'Shops, transport, health', PALE.grn, GRN],
    ['Secondary', 'Making goods', 'Factories, building', PALE.ver, VER],
    ['Primary', 'Taking from nature', 'Farming, mining, fishing', PALE.grey, INK],
  ];
  let b = '';
  rows.forEach(([n, what, ex, fill, stroke], i) => {
    const y = 12 + i * 96;
    b += `<rect x="12" y="${y}" width="616" height="86" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    b += text(28, y + 43, n, { size: 25, weight: 700, fill: stroke, anchor: 'start' });
    b += text(232, y + 28, what, { size: 23, weight: 700, anchor: 'start' });
    b += text(232, y + 60, ex, { size: 22, anchor: 'start' });
  });
  fig('economic-sectors', id, 640, 494, 'The five economic sectors',
    'Five stacked bands, from the bottom up. Primary: taking from nature, such as farming, mining and fishing. Secondary: making goods in factories and building. Tertiary: services such as shops, transport and health care. Quaternary: information and research, such as science, software and finance. Quinary: top decisions by the heads of firms and governments.', b);
}

/* 7.3 What goes into the HDI. */
{
  const id = 'development-measures-hdi';
  let b = '';
  b += box(8, 12, 202, 130, ['Life', 'expectancy'], { head: 'Health', fill: PALE.grn, stroke: GRN, size: 22 });
  b += box(219, 12, 202, 130, ['Years of', 'schooling'], { head: 'Education', fill: PALE.teal, stroke: TEAL, size: 22 });
  b += box(430, 12, 202, 130, ['Income per', 'person (GNI)'], { head: 'Income', fill: PALE.ver, stroke: VER, size: 22 });
  b += arrow(id, 109, 142, 230, 214) + arrow(id, 320, 142, 320, 214) + arrow(id, 531, 142, 410, 214);
  b += box(90, 220, 460, 104, ['Human Development Index', 'one number from 0 to 1'], { fill: '#FFFFFF', stroke: INK, size: 24, weight: 700 });
  b += text(320, 362, 'Higher means longer, healthier,', { size: 22 });
  b += text(320, 392, 'better-schooled lives and more income.', { size: 22 });
  b += text(320, 422, 'It hides who gets the income.', { size: 22, weight: 700 });
  fig('development-measures', id, 640, 440, 'The three parts of the Human Development Index',
    'Three boxes feed one. Health is measured by life expectancy, education by years of schooling, and income by income per person (GNI). Together they make the Human Development Index, one number from 0 to 1. Higher means longer, healthier, better-schooled lives and more income; it hides who gets the income.', b);
}

/* 7.4 How a microloan cycle works. */
{
  const id = 'women-development-cycle';
  let b = '';
  b += box(150, 10, 340, 92, ['A small loan, often to', 'a woman in a group'], { size: 22 });
  b += box(372, 176, 260, 100, ['She starts or grows', 'a small business'], { fill: PALE.ver, stroke: VER, size: 22 });
  b += box(150, 350, 340, 92, ['Income pays for food,', 'school and repayment'], { fill: PALE.grn, stroke: GRN, size: 22 });
  b += box(8, 176, 260, 100, ['A repaid loan lets', 'her borrow more'], { fill: PALE.pur, stroke: PUR, size: 22 });
  b += arrow(id, 450, 102, 500, 170) + arrow(id, 500, 276, 450, 344) + arrow(id, 190, 350, 140, 282) + arrow(id, 140, 176, 190, 108);
  b += text(320, 226, ['Micro-', 'lending'], { size: 24, weight: 700, fill: TEAL });
  fig('women-development', id, 640, 452, 'The microlending cycle',
    'A loop of four steps around the word microlending. A small loan goes, often, to a woman in a group. She starts or grows a small business. Its income pays for food, school and the repayment. A repaid loan lets her borrow more, and the loop starts again.', b);
}

/* 7.5 Rostow's staircase and the world system. */
{
  const id = 'development-theories-rostow';
  const steps = [['1', 'Tradi-', 'tional'], ['2', 'Pre-', 'conditions'], ['3', 'Take-off'], ['4', 'Drive to', 'maturity'], ['5', 'High mass', 'consump-', 'tion']];
  let b = '';
  steps.forEach((l, i) => {
    const x = 6 + i * 126, top = 250 - i * 50;
    b += `<rect x="${x}" y="${top}" width="124" height="${440 - top}" fill="${i % 2 ? PALE.teal : '#C9E6EB'}" stroke="${TEAL}" stroke-width="2"/>`;
    b += text(x + 62, top + 16 + l.length * 13, l, { size: 21, weight: 700, fill: TEAL });
  });
  b += text(160, 30, 'One path, step by step', { size: 24, weight: 700, fill: VER });
  b += arrow(id, 20, 170, 290, 64, VER);
  fig('development-theories', id, 640, 450, "Rostow's five stages of economic growth",
    "A staircase of five steps rising from left to right: 1 traditional society, 2 preconditions for take-off, 3 take-off, 4 drive to maturity, 5 high mass consumption. An arrow labeled one path, step by step, climbs beside it.", b);
}
{
  const id = 'development-theories-world-system';
  let b = '';
  b += box(150, 10, 340, 112, ['High-wage, high-tech', 'and decision work'], { head: 'Core', fill: PALE.teal, stroke: TEAL, size: 21 });
  b += box(150, 176, 340, 112, ['Factories, some', 'research, farming'], { head: 'Semiperiphery', fill: PALE.pur, stroke: PUR, size: 21 });
  b += box(150, 342, 340, 112, ['Raw materials,', 'low-wage work'], { head: 'Periphery', fill: PALE.ver, stroke: VER, size: 21 });
  b += arrow(id, 128, 342, 128, 126) + arrow(id, 512, 126, 512, 342);
  b += text(62, 232, ['Raw', 'goods,', 'cheap', 'labor'], { size: 21 });
  b += text(578, 232, ['Goods,', 'loans,', 'profits'], { size: 21 });
  fig('development-theories', id, 640, 464, "Wallerstein's world system",
    'Three stacked boxes. Core at the top: high-wage, high-tech and decision work. Semiperiphery in the middle: factories, some research and farming. Periphery at the bottom: raw materials and low-wage work. An arrow on the left carries raw goods and cheap labor up toward the core; an arrow on the right carries goods, loans and profits down from the core.', b);
}

/* 7.6 Comparative advantage with two invented countries. */
{
  const id = 'trade-world-economy-advantage';
  let b = '';
  b += box(8, 10, 304, 170, ['Rice: 6 tonnes', 'or bikes: 3'], { head: 'Country A, 1 day', fill: PALE.teal, stroke: TEAL, size: 23 });
  b += box(328, 10, 304, 170, ['Rice: 2 tonnes', 'or bikes: 2'], { head: 'Country B, 1 day', fill: PALE.ver, stroke: VER, size: 23 });
  b += box(8, 196, 304, 116, ['1 bike = 2 t rice', '1 t rice = 0.5 bike'], { fill: '#FFFFFF', stroke: TEAL, size: 23 });
  b += box(328, 196, 304, 116, ['1 bike = 1 t rice', '1 t rice = 1 bike'], { fill: '#FFFFFF', stroke: VER, size: 23 });
  b += text(160, 364, ['Gives up less', 'for rice:', 'A makes rice'], { size: 22, weight: 700, fill: TEAL });
  b += text(480, 364, ['Gives up less', 'for bikes:', 'B makes bikes'], { size: 22, weight: 700, fill: VER });
  fig('trade-world-economy', id, 640, 420, 'Comparative advantage in two invented countries',
    'Two invented countries. In one day of work, Country A makes 6 tonnes of rice or 3 bikes; Country B makes 2 tonnes of rice or 2 bikes. So in A one bike costs 2 tonnes of rice and a tonne of rice costs half a bike; in B one bike costs 1 tonne of rice and a tonne of rice costs 1 bike. A gives up less to make rice, so A makes rice; B gives up less to make bikes, so B makes bikes.', b);
}

/* 7.7 Agglomeration and a growth pole, stacked. */
{
  const id = 'world-economy-changes-poles';
  let b = '';
  b += `<rect x="8" y="8" width="624" height="210" rx="14" fill="${PALE.teal}" stroke="${TEAL}" stroke-width="2"/>`;
  b += `<rect x="8" y="232" width="624" height="210" rx="14" fill="${PALE.ver}" stroke="${VER}" stroke-width="2"/>`;
  const firm = (x, y, s = 1, c = TEAL) => `<rect x="${x - 14 * s}" y="${y - 10 * s}" width="${28 * s}" height="${20 * s}" fill="${c}"/><rect x="${x - 14 * s}" y="${y - 22 * s}" width="${8 * s}" height="${12 * s}" fill="${c}"/>`;
  for (const [x, y] of [[60, 80], [105, 70], [150, 85], [70, 125], [118, 118], [165, 130], [90, 170], [140, 172]]) b += firm(x, y);
  b += text(400, 50, 'Agglomeration', { size: 26, weight: 700, fill: TEAL });
  b += text(400, 128, ['Many firms cluster to', 'share workers,', 'suppliers and ideas'], { size: 22 });
  b += firm(115, 340, 2, VER);
  for (const [x, y] of [[40, 270], [190, 270], [40, 410], [190, 410]]) { b += `<circle cx="${x}" cy="${y}" r="9" fill="${VER}"/>`; b += arrow(id, 115 + (x - 115) * 0.4, 330 + (y - 330) * 0.4, 115 + (x - 115) * 0.82, 330 + (y - 330) * 0.82); }
  b += text(400, 274, 'Growth pole', { size: 26, weight: 700, fill: VER });
  b += text(400, 352, ['One key project sparks', 'growth in the towns', 'and region around it'], { size: 22 });
  fig('world-economy-changes', id, 640, 450, 'Agglomeration compared with a growth pole',
    'Two panels. Agglomeration: many small factories clustered together, labeled many firms cluster to share workers, suppliers and ideas. Growth pole: one large factory with arrows reaching out to four small towns, labeled one key project sparks growth in the towns and region around it.', b);
}

/* 7.8 The three parts of sustainable development. */
{
  const id = 'sustainable-development-circles';
  let b = '';
  b += `<circle cx="215" cy="160" r="140" fill="${PALE.ver}" fill-opacity="0.85" stroke="${VER}" stroke-width="2"/>`;
  b += `<circle cx="425" cy="160" r="140" fill="${PALE.teal}" fill-opacity="0.85" stroke="${TEAL}" stroke-width="2"/>`;
  b += `<circle cx="320" cy="320" r="140" fill="${PALE.grn}" fill-opacity="0.85" stroke="${GRN}" stroke-width="2"/>`;
  b += text(165, 120, ['Economy:', 'jobs,', 'income'], { size: 23, weight: 700, fill: VER });
  b += text(475, 120, ['Society:', 'health,', 'school'], { size: 23, weight: 700, fill: TEAL });
  b += text(320, 390, ['Environment:', 'air, water,', 'climate'], { size: 23, weight: 700, fill: GRN });
  b += `<circle cx="320" cy="212" r="8" fill="${INK}"/>`;
  b += `<line x1="320" y1="212" x2="520" y2="420" stroke="${INK}" stroke-width="2"/>`;
  b += box(440, 420, 196, 90, ['Sustainable', 'development'], { fill: '#FFFFFF', stroke: INK, size: 22, weight: 700 });
  fig('sustainable-development', id, 640, 516, 'The three parts of sustainable development',
    'Three overlapping circles. Economy: jobs and income. Society: health and school. Environment: air, water and climate. The point where all three overlap is labeled sustainable development.', b);
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
