/* AP® Human Geography figures for Unit 2, Population and Migration (author B).
   Every figure is a LevlPrep original diagram. The two flow maps are drawn on
   the course's Natural Earth base maps (human-geography/figures/base/) with
   ApHugMap, and their flows are invented for practice.
   Writes
     human-geography/figures/<id>.svg
     human-geography/data/figures/<topic>.json   (the registry entries)

     node scripts/aphug-figures/author-b.mjs

   Style (as author A): white background, role="img" with <title> and <desc>,
   Arial or Helvetica, ink #1F2A28, course teal #094953 for emphasis, then
   vermillion #C24E00, green #009E73 and reddish purple #A8508A. Text is 15 px
   or more on a 720 px canvas. */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HugMap } from '../lib/aphug-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'human-geography', 'figures');
const REG = join(ROOT, 'human-geography', 'data', 'figures');
const BASE = id => JSON.parse(readFileSync(join(FIG, 'base', `${id}.json`), 'utf8'));
const INK = '#1F2A28', TEAL = '#094953', VERM = '#C24E00', GREEN = '#009E73', PURP = '#A8508A', GREY = '#5F6B68',
  LINE = '#C9D3D1', TINT = '#E1F1F4', SOFT = '#F4F7F7', WARM = '#FBE9DC', MINT = '#DDF2EA';
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
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.8}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.4}"/>`;
const path = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const marker = (id, c) => `<marker id="ar-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
const DEFS = `<defs>${marker('ink', INK)}${marker('teal', TEAL)}${marker('verm', VERM)}${marker('green', GREEN)}${marker('purp', PURP)}</defs>`;
function box(x, y, w, h, label, o = {}) {
  const n = String(label).split('\n').length, size = o.size || 16, lh = size * 1.3;
  return rect(x, y, w, h, { fill: o.fill || SOFT, stroke: o.stroke || TEAL, w: o.w || 1.8, rx: o.rx }) +
    lines(x + w / 2, y + h / 2 - (n - 1) * lh / 2 + size * 0.36, label, { anchor: 'middle', size, bold: o.bold, fill: o.ink || INK, lh });
}
const halo = (x, y, s, o = {}) => { const size = o.size || 15, w = String(s).length * size * 0.55 + 8; const x0 = o.anchor === 'middle' ? x - w / 2 : o.anchor === 'end' ? x - w + 4 : x - 4; return rect(x0, y - size, w, size * 1.35, { fill: '#FFFFFF', rx: 3 }) + text(x, y, s, o); };
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

/* ------------------------------------------- population-distribution */
{
  let b = '';
  b += text(360, 34, 'What shapes where people live?', { anchor: 'middle', size: 20, bold: true });
  b += text(130, 72, 'Physical factors', { anchor: 'middle', size: 17, bold: true, fill: GREEN });
  b += text(590, 72, 'Human factors', { anchor: 'middle', size: 17, bold: true, fill: VERM });
  const phys = ['Climate', 'Water', 'Landforms', 'Soil'], hum = ['Jobs', 'Transport', 'Government', 'History'];
  phys.forEach((p, i) => { b += box(40, 88 + i * 58, 180, 44, p, { stroke: GREEN, fill: MINT }); b += line(222, 110 + i * 58, 262, 200, { stroke: GREEN, w: 2, arrow: 'green' }); });
  hum.forEach((p, i) => { b += box(500, 88 + i * 58, 180, 44, p, { stroke: VERM, fill: WARM }); b += line(498, 110 + i * 58, 458, 200, { stroke: VERM, w: 2, arrow: 'verm' }); });
  b += box(266, 160, 188, 84, 'Population\ndistribution:\nwhere people live', { bold: true, fill: TINT, size: 16 });
  b += lines(360, 348, 'Which factors matter most depends on the scale of analysis:\nlocal, national, regional or global.', { anchor: 'middle', size: 15, fill: GREY });
  add('population-distribution', 'population-distribution-factors', 720, 380, 'Physical and human factors of population distribution',
    'Diagram: four physical factors (climate, water, landforms, soil) on the left and four human factors (jobs, transport, government, history) on the right, each with an arrow pointing to a center box, population distribution: where people live. A note says which factors matter most depends on the scale of analysis.', b);
}
/* ------------------------------------------ distribution-consequences */
{
  let b = '';
  b += text(360, 32, 'One invented country, three densities', { anchor: 'middle', size: 20, bold: true });
  const panels = [
    { x: 20, title: 'Arithmetic density', top: 'All people ÷ all land', calc: '40 million ÷ 400,000 km²', res: '= 100 per km²', arable: false, farmers: false },
    { x: 260, title: 'Physiological density', top: 'All people ÷ arable land', calc: '40 million ÷ 40,000 km²', res: '= 1,000 per km²', arable: true, farmers: false },
    { x: 500, title: 'Agricultural density', top: 'Farmers ÷ arable land', calc: '20 million ÷ 40,000 km²', res: '= 500 per km²', arable: true, farmers: true }];
  for (const p of panels) {
    b += text(p.x + 100, 70, p.title, { anchor: 'middle', size: 17, bold: true, fill: TEAL });
    b += text(p.x + 100, 94, p.top, { anchor: 'middle', size: 15 });
    b += rect(p.x + 20, 110, 160, 160, { fill: p.arable ? SOFT : TINT, stroke: TEAL, w: 2, rx: 4 });
    if (p.arable) b += rect(p.x + 20, 222, 80, 48, { fill: '#BFE3D4', stroke: GREEN, w: 2, rx: 2 }) + text(p.x + 60, p.farmers ? 262 : 252, 'arable', { anchor: 'middle', size: 15, fill: INK });
    if (!p.arable) b += text(p.x + 100, 196, 'all land', { anchor: 'middle', size: 15 });
    if (p.arable && !p.farmers) b += text(p.x + 100, 170, 'desert, ice,\nhills, cities'.split('\n')[0], { anchor: 'middle', size: 15, fill: GREY }) + text(p.x + 100, 190, 'hills, cities', { anchor: 'middle', size: 15, fill: GREY });
    if (p.farmers) for (let i = 0; i < 5; i++) b += circle(p.x + 32 + i * 15, 232, 4.5, { fill: VERM });
    b += text(p.x + 100, 300, p.calc, { anchor: 'middle', size: 15 });
    b += text(p.x + 100, 324, p.res, { anchor: 'middle', size: 17, bold: true });
  }
  b += text(360, 368, 'Invented numbers for practice. Arable land is land that can grow crops.', { anchor: 'middle', size: 15, fill: GREY });
  add('distribution-consequences', 'distribution-consequences-densities', 720, 390, 'Arithmetic, physiological and agricultural density',
    'Three panels for one invented country of 40 million people and 400,000 square kilometers. Arithmetic density divides all people by all land: 100 per square kilometer. Physiological density divides all people by the 40,000 square kilometers of arable land: 1,000 per square kilometer. Agricultural density divides the 20 million farmers by arable land: 500 per square kilometer.', b);
}
/* ------------------------------------------- population-composition */
{
  let b = '';
  b += text(360, 32, 'Three pyramid shapes', { anchor: 'middle', size: 20, bold: true });
  const shapes = [
    { x: 120, name: 'Expansive', sub: 'wide base: many births,\na young, growing population', v: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1.2] },
    { x: 360, name: 'Stationary', sub: 'straight sides: births and\ndeaths balanced for decades', v: [6, 6, 6, 6, 5.9, 5.8, 5.5, 5, 4, 2.5] },
    { x: 600, name: 'Constrictive', sub: 'narrow base: births have\nfallen; an older population', v: [4, 4.4, 4.8, 5.2, 5.6, 6, 6, 5.6, 4.6, 3.2] }];
  for (const s of shapes) {
    s.v.forEach((v, i) => { const y = 250 - i * 17, w = v * 8.5; b += rect(s.x - w, y, w - 1, 14, { fill: TEAL, rx: 1 }) + rect(s.x + 1, y, w - 1, 14, { fill: VERM, rx: 1 }); });
    b += line(s.x, 90, s.x, 266, { stroke: '#FFFFFF', w: 2 });
    b += text(s.x, 292, s.name, { anchor: 'middle', size: 17, bold: true });
    b += lines(s.x, 316, s.sub, { anchor: 'middle', size: 15, fill: GREY });
  }
  b += rect(250, 60, 14, 14, { fill: TEAL, rx: 2 }) + text(270, 72, 'Male', { size: 15 }) + rect(330, 60, 14, 14, { fill: VERM, rx: 2 }) + text(350, 72, 'Female', { size: 15 }) + text(420, 72, 'Youngest at the bottom', { size: 15, fill: GREY });
  add('population-composition', 'population-composition-shapes', 720, 360, 'Expansive, stationary and constrictive pyramids',
    'Three population pyramid outlines, males on the left and females on the right, youngest at the bottom. Expansive: a wide base that narrows quickly, a young, growing population. Stationary: nearly straight sides, births and deaths balanced for decades. Constrictive: a base narrower than the middle, births have fallen and the population is older.', b);
}
/* ---------------------------------------------- population-dynamics */
{
  let b = '';
  b += text(360, 32, 'Four flows change a population', { anchor: 'middle', size: 20, bold: true });
  b += rect(36, 56, 226, 250, { stroke: TEAL, w: 2, dash: '7 5', rx: 12 });
  b += text(149, 80, 'Natural increase', { anchor: 'middle', size: 16, bold: true, fill: TEAL });
  b += box(270, 150, 180, 70, 'Population', { bold: true, fill: TINT, size: 18 });
  b += box(56, 100, 160, 50, 'Births (CBR)', { stroke: GREEN, fill: MINT });
  b += box(56, 226, 160, 50, 'Deaths (CDR)', { stroke: VERM, fill: WARM });
  b += box(504, 100, 180, 50, 'People moving in', { stroke: GREEN, fill: MINT });
  b += box(504, 226, 180, 50, 'People moving out', { stroke: VERM, fill: WARM });
  b += line(218, 125, 268, 165, { stroke: GREEN, w: 3, arrow: 'green' }) + line(268, 207, 218, 245, { stroke: VERM, w: 3, arrow: 'verm' });
  b += line(502, 125, 452, 165, { stroke: GREEN, w: 3, arrow: 'green' }) + line(452, 207, 502, 245, { stroke: VERM, w: 3, arrow: 'verm' });
  b += text(360, 336, 'Rate of natural increase (%) = (CBR − CDR) ÷ 10: births and deaths only.', { anchor: 'middle', size: 16, bold: true });
  b += text(360, 362, 'Total growth adds net migration (people moving in minus people moving out).', { anchor: 'middle', size: 15, fill: GREY });
  add('population-dynamics', 'population-dynamics-flows', 720, 384, 'Births, deaths and migration change a population',
    'Diagram: a population box with four arrows. Births and people moving in add to it; deaths and people moving out take away. A dashed box around births and deaths is labeled natural increase. The rate of natural increase in percent is the crude birth rate minus the crude death rate, divided by 10; total growth adds net migration.', b);
}
/* ------------------------------------------------- transition-model */
{
  let b = '';
  const X0 = 70, X1 = 690, Y0 = 330, Y1 = 70, stageW = (X1 - X0) / 5;
  b += text(380, 32, 'The demographic transition model', { anchor: 'middle', size: 20, bold: true });
  for (let i = 0; i < 5; i++) {
    b += rect(X0 + i * stageW, Y1, stageW, Y0 - Y1, { fill: i % 2 ? '#FFFFFF' : SOFT, rx: 0 });
    b += text(X0 + (i + 0.5) * stageW, 58, `Stage ${i + 1}`, { anchor: 'middle', size: 16, bold: true });
  }
  b += line(X0, Y0, X1, Y0, { w: 2 }) + line(X0, Y0, X0, Y1, { w: 2 });
  b += text(X0 - 12, 200, 'Rate', { anchor: 'end', size: 15 });
  const yv = v => Y0 - (v / 45) * (Y0 - Y1);
  const curve = pts => 'M' + pts.map(([x, v]) => `${r1(X0 + x * stageW)} ${r1(yv(v))}`).join(' L');
  b += path(curve([[0, 40], [0.5, 41], [1, 40], [1.5, 40], [2, 38], [2.5, 30], [3, 20], [3.5, 14], [4, 12], [4.5, 9], [5, 8]]), { stroke: GREEN, w: 3.5 });
  b += path(curve([[0, 38], [0.5, 34], [1, 36], [1.5, 28], [2, 18], [2.5, 13], [3, 11], [3.5, 10], [4, 10], [4.5, 11], [5, 12]]), { stroke: VERM, w: 3.5 });
  b += path(curve([[0, 4], [1, 5], [2, 9], [3, 18], [4, 25], [4.6, 26], [5, 25]]), { stroke: TEAL, w: 2.5, dash: '8 6' });
  b += halo(X0 + 0.45 * stageW, yv(41) - 10, 'Birth rate', { size: 15, fill: GREEN, bold: true, anchor: 'middle' });
  b += halo(X0 + 1.55 * stageW, yv(28) + 26, 'Death rate', { size: 15, fill: VERM, bold: true, anchor: 'middle' });
  b += halo(X0 + 3.9 * stageW, yv(25) - 12, 'Total population', { size: 15, fill: TEAL, bold: true, anchor: 'middle' });
  const notes = ['Both high', 'Deaths fall', 'Births fall', 'Both low', 'Births below\ndeaths'];
  notes.forEach((n, i) => { b += lines(X0 + (i + 0.5) * stageW, 356, n, { anchor: 'middle', size: 15 }); });
  b += text(380, 406, 'Growth is fastest where the gap between the lines is widest (late stage 2, early stage 3).', { anchor: 'middle', size: 15, fill: GREY });
  add('transition-model', 'transition-model-stages', 760, 420, 'The five stages of the demographic transition model',
    'Graph of the demographic transition model in five stages. The birth rate stays high in stages 1 and 2, falls in stage 3 and is low in stages 4 and 5. The death rate is high in stage 1, falls in stage 2 and stays low, rising a little in stage 5, where it is above the birth rate. A dashed line shows total population rising slowly, then fast, then leveling and falling slightly.', b);
}
/* ------------------------------------------------ malthusian-theory */
{
  let b = '';
  const X0 = 90, X1 = 620, Y0 = 320, Y1 = 70;
  b += text(360, 32, 'Malthus’s idea (1798)', { anchor: 'middle', size: 20, bold: true });
  b += line(X0, Y0, X1, Y0, { w: 2 }) + line(X0, Y0, X0, Y1, { w: 2 });
  const xv = i => X0 + 20 + i * 120, yv = v => Y0 - v / 16 * (Y0 - Y1 - 10);
  const pop = [1, 2, 4, 8, 16], food = [1, 2, 3, 4, 5];
  b += path('M' + pop.map((v, i) => `${r1(xv(i))} ${r1(yv(v))}`).join(' L'), { stroke: VERM, w: 3.5 });
  b += path('M' + food.map((v, i) => `${r1(xv(i))} ${r1(yv(v))}`).join(' L'), { stroke: GREEN, w: 3.5 });
  pop.forEach((v, i) => { b += circle(xv(i), yv(v), 5, { fill: VERM }); b += text(xv(i), Y0 + 24, String(i), { anchor: 'middle', size: 15 }); });
  food.forEach((v, i) => { b += circle(xv(i), yv(v), 5, { fill: GREEN }); });
  b += text((X0 + X1) / 2, Y0 + 48, 'Generations (about 25 years each)', { anchor: 'middle', size: 15 });
  b += halo(xv(4) - 10, yv(16) + 4, 'Population: 1, 2, 4, 8, 16', { anchor: 'end', size: 15, fill: VERM, bold: true });
  b += text(X0 - 10, 196, 'Amount', { anchor: 'end', size: 15 });
  b += halo(xv(4), Y0 - 14, 'Food: 1, 2, 3, 4, 5', { anchor: 'end', size: 15, fill: GREEN, bold: true });
  b += box(120, 84, 230, 62, 'Population outruns food:\nfamine, disease, war', { stroke: INK, fill: '#FFFFFF', size: 15 });
  add('malthusian-theory', 'malthusian-theory-curves', 720, 390, 'Population grows geometrically, food arithmetically',
    'Graph over four generations: population doubles each generation (1, 2, 4, 8, 16) while food grows by one step each generation (1, 2, 3, 4, 5), so the population line rises far above the food line. A box says population outruns food, followed by famine, disease and war.', b);
}
/* ----------------------------------------------- population-policies */
{
  let b = '';
  const X0 = 150, X1 = 690, yr = y => X0 + (y - 1970) / (2026 - 1970) * (X1 - X0);
  b += text(400, 32, 'Policies change as fertility falls', { anchor: 'middle', size: 20, bold: true });
  [1970, 1980, 1990, 2000, 2010, 2020].forEach(y => { b += line(yr(y), 60, yr(y), 300, { stroke: LINE, w: 1 }) + text(yr(y), 322, String(y), { anchor: 'middle', size: 15, fill: GREY }); });
  const lanes = [
    { name: 'China', y: 90, segs: [[1980, 2015.9, VERM, 'One-child policy'], [2016, 2021, PURP, 'Two'], [2021, 2026, TEAL, 'Three']] },
    { name: 'Singapore', y: 170, segs: [[1972, 1986.9, VERM, 'Stop at Two'], [1987, 2026, TEAL, 'Three or more, if you can afford it']] },
    { name: 'Iran', y: 250, segs: [[1989, 2011.9, VERM, 'Family planning program'], [2021, 2026, TEAL, '2021 law']] }];
  for (const L of lanes) {
    b += text(X0 - 14, L.y + 26, L.name, { anchor: 'end', size: 17, bold: true });
    for (const [a, z, c, t] of L.segs) { b += rect(yr(a), L.y + 6, yr(z) - yr(a) - 2, 32, { fill: c, rx: 4 }); if (t.length * 8.4 < yr(z) - yr(a) - 8) b += text((yr(a) + yr(z)) / 2, L.y + 28, t, { anchor: 'middle', size: 15, fill: '#FFFFFF', bold: true }); else b += text(yr(a) + 4, L.y + 58, t, { size: 15, fill: TEAL, bold: true }); }
  }
  b += rect(150, 346, 18, 18, { fill: VERM, rx: 3 }) + text(176, 361, 'Antinatalist: lower births', { size: 15 });
  b += rect(380, 346, 18, 18, { fill: PURP, rx: 3 }) + text(406, 361, 'Limit eased', { size: 15 });
  b += rect(520, 346, 18, 18, { fill: TEAL, rx: 3 }) + text(546, 361, 'Pronatalist: raise births', { size: 15 });
  add('population-policies', 'population-policies-timeline', 760, 380, 'China, Singapore and Iran moved from lowering births to raising them',
    'Timeline from 1970 to 2026. China: the one-child policy, antinatalist, from 1980 to 2015, then the limit eased to two children from 2016, and a three-child policy from 2021 aimed at raising births. Singapore: Stop at Two, antinatalist, from 1972, then from 1987 a pronatalist call for three or more children if families can afford them. Iran: a family planning program, antinatalist, from 1989, and a 2021 law to raise births.', b);
}
/* ------------------------------------------ women-population-change */
{
  let b = '';
  b += text(360, 32, 'Women’s roles and population change', { anchor: 'middle', size: 20, bold: true });
  b += box(24, 150, 210, 96, 'More schooling,\npaid work and\nhealth care for women', { bold: true, fill: TINT, size: 16 });
  const rows = [
    { y: 60, a: 'Later marriage; more\nuse of family planning', z: 'Fewer births\n(lower TFR)', c: GREEN, m: 'green' },
    { y: 166, a: 'Mothers know more\nabout health', z: 'Fewer child deaths\n(lower IMR)', c: PURP, m: 'purp' },
    { y: 272, a: 'More women move\nfor work themselves', z: 'New migration\npatterns', c: VERM, m: 'verm' }];
  for (const R of rows) {
    b += line(236, 198, 284, R.y + 32, { stroke: R.c, w: 2.5, arrow: R.m });
    b += box(288, R.y, 196, 64, R.a, { stroke: R.c, fill: '#FFFFFF', size: 15 });
    b += line(486, R.y + 32, 518, R.y + 32, { stroke: R.c, w: 2.5, arrow: R.m });
    b += box(522, R.y, 176, 64, R.z, { stroke: R.c, fill: SOFT, size: 15, bold: true });
  }
  b += text(360, 372, 'Example: Bangladesh, TFR more than 6 (early 1970s) to 2.3 (2022, Bangladesh DHS).', { anchor: 'middle', size: 15, fill: GREY });
  add('women-population-change', 'women-population-change-chain', 720, 392, 'How women’s schooling and work change births, deaths and migration',
    'Diagram: a box, more schooling, paid work and health care for women, branches three ways. Later marriage and more family planning lead to fewer births. Mothers knowing more about health leads to fewer child deaths. More women moving for work leads to new migration patterns. Example: Bangladesh, where the total fertility rate fell from more than 6 in the early 1970s to 2.3 in 2022.', b);
}
/* ------------------------------------------------ aging-populations */
{
  let b = '';
  const cx = 300, v = [3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 4.8, 4.6, 4.2, 3.6, 2.8, 2.2];
  b += text(360, 30, 'Who depends on whom?', { anchor: 'middle', size: 20, bold: true });
  const y = i => 360 - i * 18;
  v.forEach((w0, i) => { const w = w0 * 30; const col = i < 3 ? PURP : i < 13 ? TEAL : VERM; b += rect(cx - w, y(i), w - 1, 15, { fill: col, rx: 1 }) + rect(cx + 1, y(i), w * (i > 13 ? 1.12 : 1) - 1, 15, { fill: col, rx: 1 }); });
  const brace = (y1, y2, c, label) => path(`M470 ${y1} q10 0 10 10 L480 ${(y1 + y2) / 2 - 8} l8 8 l-8 8 L480 ${y2 - 10} q0 10 -10 10`, { stroke: c, w: 2.5 }) + lines(500, (y1 + y2) / 2, label, { size: 15, fill: c, bold: true });
  b += brace(y(2), y(0) + 15, PURP, 'Under 15:\nyouth dependents');
  b += brace(y(12), y(3) + 15, TEAL, '15 to 64:\nworking age');
  b += brace(y(16), y(13) + 15, VERM, '65 and over:\nelderly dependents');
  b += text(cx, 400, 'Dependency ratio = (under 15 + 65 and over) ÷ (15 to 64) × 100', { anchor: 'middle', size: 16, bold: true });
  add('aging-populations', 'aging-populations-pyramid', 720, 420, 'The dependency ratio on a constrictive pyramid',
    'A constrictive population pyramid divided into three colored groups: people under 15 (youth dependents) at the bottom, people aged 15 to 64 (working age) in the middle, and people 65 and over (elderly dependents) at the top, where the female side is a little longer. The dependency ratio is the people under 15 plus the people 65 and over, divided by the people aged 15 to 64, times 100.', b);
}
/* ------------------------------------------------- migration-causes */
{
  let b = '';
  b += text(360, 32, 'Why people move', { anchor: 'middle', size: 20, bold: true });
  b += box(20, 70, 200, 180, '', { stroke: VERM, fill: WARM });
  b += text(120, 98, 'Origin', { anchor: 'middle', size: 18, bold: true });
  b += lines(120, 128, 'Push factors\nlow pay\ndrought\nwar', { anchor: 'middle', size: 15, lh: 24 });
  b += box(500, 70, 200, 180, '', { stroke: GREEN, fill: MINT });
  b += text(600, 98, 'Destination', { anchor: 'middle', size: 18, bold: true });
  b += lines(600, 128, 'Pull factors\njobs\nsafety\nfamily', { anchor: 'middle', size: 15, lh: 24 });
  b += line(222, 160, 496, 160, { stroke: TEAL, w: 4, arrow: 'teal' });
  b += box(296, 140, 128, 40, 'Obstacle', { stroke: INK, fill: '#FFFFFF', size: 15, bold: true });
  b += lines(360, 212, 'Intervening obstacles: distance,\ncost, borders, seas, rough land', { anchor: 'middle', size: 15 });
  b += path('M246 160 Q246 290 318 300', { stroke: PURP, w: 2.5, dash: '6 5', arrow: 'purp' });
  b += circle(324, 300, 7, { fill: PURP });
  b += lines(342, 296, 'Intervening opportunity:\na job on the way', { size: 15, fill: PURP, bold: true });
  add('migration-causes', 'migration-causes-pushpull', 720, 340, 'Push factors, pull factors and what lies between',
    'Diagram: an origin box with push factors (low pay, drought, war) and a destination box with pull factors (jobs, safety, family), joined by an arrow. An obstacle sits on the arrow: intervening obstacles such as distance, cost, borders, seas and rough land. A dashed branch leaves the arrow and stops at an intervening opportunity, a job on the way.', b);
}
/* ---------------------------------------- forced-voluntary-migration */
{
  let b = '';
  b += text(360, 32, 'Kinds of migration', { anchor: 'middle', size: 20, bold: true });
  b += box(30, 56, 300, 50, 'Forced: no real choice', { stroke: VERM, fill: WARM, bold: true, size: 17 });
  b += box(390, 56, 300, 50, 'Voluntary: by choice', { stroke: GREEN, fill: MINT, bold: true, size: 17 });
  const forced = ['Refugee: crossed a border,\ngranted protection', 'Asylum seeker: crossed,\nasked, waiting', 'Internally displaced person:\nstayed in own country', 'Enslavement: captured\nand moved by force'];
  const vol = ['Internal (rural-to-urban,\ninterregional, intraregional)', 'Step and chain migration', 'Guest worker: set time', 'Transnational and\ntranshumance'];
  b += line(180, 106, 180, 330, { stroke: VERM, w: 1.6 }) + line(540, 106, 540, 330, { stroke: GREEN, w: 1.6 });
  forced.forEach((t, i) => { b += box(52, 120 + i * 70, 256, 58, t, { stroke: VERM, fill: '#FFFFFF', size: 15 }); });
  vol.forEach((t, i) => { b += box(412, 120 + i * 70, 256, 58, t, { stroke: GREEN, fill: '#FFFFFF', size: 15 }); });
  add('forced-voluntary-migration', 'forced-voluntary-migration-types', 720, 412, 'Forced and voluntary migration',
    'Two columns. Forced migration (no real choice): refugee, who crossed a border and was granted protection; asylum seeker, who crossed, asked for protection and is waiting; internally displaced person, who stayed in his or her own country; enslavement. Voluntary migration (by choice): internal migration (rural-to-urban, interregional, intraregional); step and chain migration; guest worker for a set time; transnational migration and transhumance.', b);
}
/* Flow maps: a base map from ApHugMap, cropped, with flows drawn on top. */
function baseLayer(baseId, focus, crop, W, H) {
  const base = BASE(baseId);
  const raw = HugMap.svg({ base: baseId, render: 'reference', label: 'Base map for a flow figure', focus }, base);
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/id="nd"/g, `id="nd-${baseId}"`).replace(/url\(#nd\)/g, `url(#nd-${baseId})`);
  const [cx, cy, cw, ch] = crop, k = W / cw;
  const P = pt => { const q = HugMap.project(base, pt); return [(q[0] - cx) * k, (q[1] - cy) * k]; };
  const C = id => { const f = HugMap.feature(base, id); return [(f.c[0] - cx) * k, (f.c[1] - cy) * k]; };
  return { layer: `<clipPath id="clip-${baseId}"><rect width="${W}" height="${H}"/></clipPath><g clip-path="url(#clip-${baseId})"><g transform="scale(${r1(k * 1000) / 1000}) translate(${-cx} ${-cy})">${inner}</g></g>`, P, C };
}
const curve = (a, z, bend = 0.2) => { const mx = (a[0] + z[0]) / 2, my = (a[1] + z[1]) / 2, dx = z[0] - a[0], dy = z[1] - a[1]; return `M${r1(a[0])} ${r1(a[1])} Q${r1(mx - dy * bend)} ${r1(my + dx * bend)} ${r1(z[0])} ${r1(z[1])}`; };
const dot = ([x, y], c = INK) => circle(x, y, 5.5, { fill: c, stroke: '#FFFFFF', w: 2 });
{
  const W = 720, H = 450;
  const { layer, P } = baseLayer('north-america', [], [175, 100, 315, 197], W, H);
  let b = layer;
  const oax = P([-96.7, 17.1]), mex = P([-99.1, 19.4]), tij = P([-117.0, 32.5]), la = P([-118.2, 34.05]), pue = P([-98.2, 19.0]), ny = P([-74.0, 40.7]);
  b += path(curve(oax, mex, 0.3), { stroke: TEAL, w: 4, arrow: 'teal' }) + path(curve(mex, tij, 0.12), { stroke: TEAL, w: 4, arrow: 'teal' }) + path(curve(tij, la, 0.4), { stroke: TEAL, w: 4, arrow: 'teal' });
  [0.16, 0.24, 0.32].forEach((bend, i) => { b += path(curve(pue, ny, -bend), { stroke: VERM, w: 3, arrow: 'verm' }); });
  for (const [p, c] of [[oax, TEAL], [mex, TEAL], [tij, TEAL], [la, TEAL], [pue, VERM], [ny, VERM]]) b += dot(p, c);
  const badge = ([x, y], n) => circle(x, y, 13, { fill: '#FFFFFF', stroke: TEAL, w: 2.5 }) + text(x, y + 5.5, n, { anchor: 'middle', size: 16, bold: true, fill: TEAL });
  const mid = (a, z) => [(a[0] + z[0]) / 2, (a[1] + z[1]) / 2];
  b += badge([mid(oax, mex)[0] - 30, mid(oax, mex)[1] + 8], '1') + badge([mid(mex, tij)[0] - 6, mid(mex, tij)[1] + 30], '2') + badge([mid(tij, la)[0] - 26, mid(tij, la)[1] + 6], '3');
  b += halo(oax[0] + 12, oax[1] + 24, 'Village in Oaxaca', { size: 15, bold: true });
  b += halo(mex[0] - 10, mex[1] - 12, 'Mexico City', { size: 15, anchor: 'end', bold: true });
  b += halo(tij[0] + 12, tij[1] + 8, 'Tijuana', { size: 15, bold: true });
  b += halo(la[0] + 10, la[1] - 10, 'Los Angeles', { size: 15, bold: true });
  b += halo(pue[0] + 14, pue[1] + 4, 'Town in Puebla', { size: 15, bold: true });
  b += halo(ny[0] - 8, ny[1] - 14, 'New York', { size: 15, anchor: 'end', bold: true });
  b += halo(560, 236, 'First migrant 1995', { size: 15, fill: VERM, anchor: 'middle' }) + halo(560, 258, 'Brother 2001', { size: 15, fill: VERM, anchor: 'middle' }) + halo(560, 280, 'Cousins 2008', { size: 15, fill: VERM, anchor: 'middle' });
  b += rect(14, 14, 290, 94, { fill: '#FFFFFF', stroke: LINE, w: 1.2 }) + line(26, 36, 66, 36, { stroke: TEAL, w: 4 }) + text(74, 41, 'Path 1 (steps 1 to 3)', { size: 15 }) + line(26, 64, 66, 64, { stroke: VERM, w: 3 }) + text(74, 69, 'Path 2 (three moves)', { size: 15 }) + text(26, 96, 'Invented flows. Base: Natural Earth.', { size: 15, fill: GREY });
  add('forced-voluntary-migration', 'forced-voluntary-migration-flows', W, H, 'Two invented migration paths from Mexico to the United States',
    'Flow map of Mexico and the United States with two invented paths. Path 1, in three numbered steps: a village in Oaxaca to Mexico City, then to Tijuana, then to Los Angeles. Path 2: three arrows from a town in Puebla to New York, labeled first migrant 1995, brother 2001 and cousins 2008.', b);
}
/* ------------------------------------------------- migration-effects */
{
  let b = '';
  b += text(360, 32, 'Migration changes both ends', { anchor: 'middle', size: 20, bold: true });
  b += box(20, 60, 230, 270, '', { stroke: VERM, fill: WARM });
  b += box(470, 60, 230, 270, '', { stroke: GREEN, fill: MINT });
  b += text(135, 88, 'Origin', { anchor: 'middle', size: 18, bold: true }) + text(585, 88, 'Destination', { anchor: 'middle', size: 18, bold: true });
  b += lines(135, 124, 'Money from abroad\nfor schools, homes\nSkills lost\n(brain drain)\nOlder population,\nfewer births', { anchor: 'middle', size: 15, lh: 26 });
  b += lines(585, 124, 'Jobs filled,\nnew businesses\nNew foods, languages,\nreligions\nDebates over\nimmigration policy', { anchor: 'middle', size: 15, lh: 26 });
  b += line(254, 130, 466, 130, { stroke: TEAL, w: 5, arrow: 'teal' }) + text(360, 118, 'Workers, often young adults', { anchor: 'middle', size: 15, bold: true, fill: TEAL });
  b += line(466, 250, 254, 250, { stroke: PURP, w: 5, arrow: 'purp' }) + text(360, 238, 'Remittances: money sent home', { anchor: 'middle', size: 15, bold: true, fill: PURP });
  add('migration-effects', 'migration-effects-two-way', 720, 350, 'Migration has effects at the origin and the destination',
    'Diagram: workers, often young adults, flow from the origin to the destination, and remittances, money sent home, flow back. At the origin: money for schools and homes, skills lost (brain drain), an older population with fewer births. At the destination: jobs filled and new businesses, new foods, languages and religions, and debates over immigration policy.', b);
}
{
  const W = 720, H = 560;
  const { layer, C } = baseLayer('country-a', [], [0, 0, 600, 400], W, 480);
  let b = layer;
  const cap = C('capital'), coast = C('coast');
  const flows = [
    { from: C('north'), to: cap, n: '40,000', w: 9, bend: 0.15 },
    { from: C('west'), to: cap, n: '25,000', w: 6.5, bend: -0.1 },
    { from: C('northeast'), to: cap, n: '10,000', w: 3.5, bend: 0.2 },
    { from: C('south'), to: coast, n: '15,000', w: 4.5, bend: -0.2 }];
  for (const f of flows) {
    const a = [f.from[0] + (f.to[0] - f.from[0]) * 0.12, f.from[1] + (f.to[1] - f.from[1]) * 0.12], z = [f.from[0] + (f.to[0] - f.from[0]) * 0.86, f.from[1] + (f.to[1] - f.from[1]) * 0.86];
    b += path(curve(a, z, f.bend), { stroke: TEAL, w: f.w, arrow: 'teal' });
    b += halo((a[0] + z[0]) / 2 - (z[1] - a[1]) * f.bend, (a[1] + z[1]) / 2 + (z[0] - a[0]) * f.bend + 6, f.n, { size: 15, bold: true, anchor: 'middle', fill: TEAL });
  }
  const abroad = [{ from: C('north'), to: [C('north')[0] - 20, 6], n: '20,000 abroad', w: 6.5 }, { from: coast, to: [W - 8, coast[1] + 70], n: '15,000 abroad', w: 4.5, lx: W - 150, ly: coast[1] + 96 }];
  for (const f of abroad) { b += path(`M${r1(f.from[0])} ${r1(f.from[1])} L${r1(f.to[0])} ${r1(f.to[1])}`, { stroke: VERM, w: f.w, arrow: 'verm', dash: '10 6' }); b += halo(f.lx ?? f.to[0] + 14, f.ly ?? (f.from[1] + f.to[1]) / 2, f.n, { size: 15, bold: true, fill: VERM }); }
  for (const id of ['north', 'west', 'northeast', 'south', 'capital', 'coast']) b += dot(C(id));
  const names = { north: 'Northern Hills', west: 'Western Uplands', northeast: 'Lake District', south: 'Southern Forest', capital: 'Capital Region', coast: 'South Coast' };
  const off = { north: [-10, -14, 'end'], west: [-8, 24, 'middle'], northeast: [10, -12, 'start'], south: [-10, 26, 'end'], capital: [12, -12, 'start'], coast: [14, -12, 'start'] };
  for (const [id, nm] of Object.entries(names)) { const p = C(id), o = off[id]; b += halo(p[0] + o[0], p[1] + o[1], nm, { size: 15, anchor: o[2] }); }
  b += line(26, 506, 66, 506, { stroke: TEAL, w: 5 }) + text(74, 511, 'Moves within Country A', { size: 15 }) + line(290, 506, 330, 506, { stroke: VERM, w: 5, dash: '10 6' }) + text(338, 511, 'Moves abroad', { size: 15 }) + text(26, 540, 'Migrants per year (invented data); arrow width shows size.', { size: 15, fill: GREY });
  add('migration-effects', 'migration-effects-country-a-flows', W, H, 'Migration flows in Country A, an invented country',
    'Flow map of Country A, an invented country, with migrants per year. Within the country, arrows run to the Capital Region from the Northern Hills (40,000, the widest), the Western Uplands (25,000) and the Lake District (10,000), and from the Southern Forest to the South Coast (15,000). Dashed arrows show moves abroad: 20,000 a year from the Northern Hills and 15,000 from the South Coast.', b);
}

mkdirSync(REG, { recursive: true });
const reg = {};
for (const f of figs) {
  writeFileSync(join(FIG, `${f.id}.svg`), f.svg);
  (reg[f.topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
}
for (const [t, entries] of Object.entries(reg)) writeFileSync(join(REG, `${t}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`author B figures: ${figs.length} written for ${Object.keys(reg).length} topics`);
