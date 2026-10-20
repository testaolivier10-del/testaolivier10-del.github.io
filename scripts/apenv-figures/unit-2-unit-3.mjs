/* AP® Environmental Science figures for Unit 2 (Biodiversity) and Unit 3
   (Populations), author B. Every data figure is drawn from the numbers in
   this file, so the picture always matches the data an item states; the
   diagrams are drawn from their labels. Writes
     environmental-science/figures/<id>.svg
     environmental-science/data/figures/<topic>.json   (the registry entries)

     node scripts/apenv-figures/unit-2-unit-3.mjs

   Style (docs/apenv-briefs/content-common.md): white background, role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, olive #474A10 for
   emphasis, then the Okabe-Ito blue #0072B2, green #009E73, vermillion
   #D55E00. All numbers here are invented for practice unless a figure says
   otherwise. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'environmental-science', 'figures');
const REG = join(ROOT, 'environmental-science', 'data', 'figures');
const INK = '#1F2A28', OLIVE = '#474A10', BLUE = '#0072B2', GREEN = '#009E73', VERM = '#D55E00', GRID = '#D9DCD3', SOFT = '#EFF0DA';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = v => Math.round(v * 10) / 10;
const fmt = v => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en-US') : String(+v.toPrecision(6)));
function text(x, y, s, o = {}) {
  const a = [`x="${r(x)}"`, `y="${r(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.fill || INK}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.weight) a.push(`font-weight="${o.weight}"`);
  if (o.rotate) a.push(`transform="rotate(${o.rotate} ${r(x)} ${r(y)})"`);
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const rect = (x, y, w, h, o = {}) => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.w || 1.5}"` : ''}${o.rx ? ` rx="${o.rx}"` : ''}${o.op != null ? ` fill-opacity="${o.op}"` : ''}/>`;
const poly = (pts, o = {}) => `<polyline points="${pts.map(p => `${r(p[0])},${r(p[1])}`).join(' ')}" fill="none" stroke="${o.stroke || OLIVE}" stroke-width="${o.w || 3}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const arrowDef = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}"/></marker></defs>`;
const arrow = (x1, y1, x2, y2, o = {}) => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 2}" marker-end="url(#ah)"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
function svg(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
${arrowDef}<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
const nice = (lo, hi, n = 5) => { const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; const s = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; const out = []; for (let v = Math.ceil(lo / s - 1e-9) * s; v <= hi + 1e-9; v += s) out.push(+v.toPrecision(10)); return out; };

/* A plain x-y chart frame. Returns { sx, sy, body } */
function frame({ x0 = 80, y0 = 30, w, h, xr, yr, xLabel, yLabel, xticks, yticks, xfmt = fmt, yfmt = fmt, grid = true, ylog = false }) {
  const sx = v => x0 + (v - xr[0]) / (xr[1] - xr[0]) * w;
  const sy = ylog ? v => y0 + h - (Math.log10(v) - Math.log10(yr[0])) / (Math.log10(yr[1]) - Math.log10(yr[0])) * h : v => y0 + h - (v - yr[0]) / (yr[1] - yr[0]) * h;
  const out = [];
  const xt = xticks || nice(xr[0], xr[1]), yt = yticks || nice(yr[0], yr[1]);
  if (grid) for (const v of yt) out.push(line(x0, sy(v), x0 + w, sy(v), { stroke: GRID, w: 1 }));
  out.push(line(x0, y0 + h, x0 + w, y0 + h), line(x0, y0, x0, y0 + h));
  for (const v of xt) out.push(line(sx(v), y0 + h, sx(v), y0 + h + 5), text(sx(v), y0 + h + 20, xfmt(v), { anchor: 'middle', size: 13 }));
  for (const v of yt) out.push(line(x0 - 5, sy(v), x0, sy(v)), text(x0 - 9, sy(v) + 4.5, yfmt(v), { anchor: 'end', size: 13 }));
  if (xLabel) out.push(text(x0 + w / 2, y0 + h + 44, xLabel, { anchor: 'middle', weight: 700 }));
  if (yLabel) out.push(text(x0 - 58, y0 + h / 2, yLabel, { anchor: 'middle', weight: 700, rotate: -90 }));
  return { sx, sy, body: out.join('\n') };
}
function legend(x, y, entries) {
  return entries.map((e, i) => {
    const yy = y + i * 22;
    const mark = e.box ? rect(x, yy - 10, 16, 12, { fill: e.color, op: e.op ?? 0.75, stroke: e.color, w: 1 }) : line(x, yy - 4, x + 26, yy - 4, { stroke: e.color, w: 3, dash: e.dash });
    return mark + text(x + (e.box ? 22 : 32), yy + 1, e.name, { size: 13 });
  }).join('\n');
}
const invented = (w, h) => text(w - 12, h - 10, 'Invented data for practice', { anchor: 'end', size: 11, fill: '#5B625A', italic: true });

const figs = {};
function add(topic, id, w, h, alt, body, title) {
  writeFileSync(join(FIG, `${id}.svg`), svg(w, h, title, alt, body));
  (figs[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* ---------------------------------------------------------- 2.1 */
export const EVENNESS = { species: ['Species W', 'Species X', 'Species Y', 'Species Z'], A: [25, 25, 25, 25], B: [85, 5, 5, 5] };
{
  const W = 720, H = 420, { species, A, B } = EVENNESS;
  const f = frame({ w: 560, h: 270, xr: [0, 4], yr: [0, 100], yticks: [0, 20, 40, 60, 80, 100], xticks: [], yLabel: 'Number of individuals', x0: 100 });
  const out = [f.body];
  species.forEach((s, j) => {
    const bw = 40, gx = f.sx(j + 0.5);
    out.push(rect(gx - bw - 3, f.sy(A[j]), bw, f.sy(0) - f.sy(A[j]), { fill: OLIVE, op: 0.8, stroke: OLIVE, w: 1 }));
    out.push(rect(gx + 3, f.sy(B[j]), bw, f.sy(0) - f.sy(B[j]), { fill: BLUE, op: 0.75, stroke: BLUE, w: 1 }));
    out.push(text(gx - bw / 2 - 3, f.sy(A[j]) - 6, A[j], { anchor: 'middle', size: 13, weight: 700 }), text(gx + bw / 2 + 3, f.sy(B[j]) - 6, B[j], { anchor: 'middle', size: 13, weight: 700 }));
    out.push(text(gx, 322, s, { anchor: 'middle', size: 13 }));
  });
  out.push(legend(470, 52, [{ name: 'Community A (even)', color: OLIVE, box: true }, { name: 'Community B (uneven)', color: BLUE, box: true }]));
  out.push(text(100 + 280, 360, 'Both communities: 4 species, 100 individuals', { anchor: 'middle', size: 14, weight: 700 }));
  out.push(invented(W, H));
  add('biodiversity', 'biodiversity-evenness', W, H,
    'Bar chart of two communities with the same species richness. Community A has 25 individuals of each of four species (even). Community B has 85 of species W and 5 each of species X, Y and Z (uneven). Invented data.',
    out.join('\n'), 'Same richness, different evenness');
}

/* ---------------------------------------------------------- 2.2 */
{
  const W = 720, H = 430;
  const cats = [
    ['Provisioning', 'goods people take', ['food and fish', 'timber and fiber', 'fresh water', 'medicines'], OLIVE],
    ['Regulating', 'natural processes that protect', ['pollination of crops', 'flood control by wetlands', 'water purification', 'carbon storage in forests'], BLUE],
    ['Cultural', 'nonmaterial benefits', ['recreation and tourism', 'spiritual and aesthetic value', 'education and research'], VERM],
    ['Supporting', 'processes the others depend on', ['photosynthesis', 'nutrient cycling', 'soil building', 'habitat for species'], GREEN],
  ];
  const out = [];
  cats.forEach(([name, sub, ex, col], i) => {
    const x = 20 + (i % 2) * 350, y = 20 + Math.floor(i / 2) * 200, w = 330, h = 185;
    out.push(rect(x, y, w, h, { fill: '#FFFFFF', stroke: col, w: 2.5, rx: 10 }), rect(x, y, w, 44, { fill: col, op: 0.14, rx: 10 }));
    out.push(text(x + 16, y + 28, name, { size: 19, weight: 700, fill: col === GREEN ? '#00714F' : col }), text(x + w - 14, y + 28, sub, { size: 13, anchor: 'end', italic: true }));
    ex.forEach((e, k) => out.push(`<circle cx="${x + 24}" cy="${y + 72 + k * 28}" r="4" fill="${col}"/>`, text(x + 36, y + 77 + k * 28, e, { size: 15 })));
  });
  add('ecosystem-services', 'ecosystem-services-categories', W, H,
    'Four boxes for the four kinds of ecosystem services. Provisioning: food and fish, timber and fiber, fresh water, medicines. Regulating: pollination of crops, flood control by wetlands, water purification, carbon storage in forests. Cultural: recreation and tourism, spiritual and aesthetic value, education and research. Supporting: photosynthesis, nutrient cycling, soil building, habitat for species.',
    out.join('\n'), 'The four kinds of ecosystem services');
}

/* ---------------------------------------------------------- 2.3 */
export const ISLANDS = [
  { name: 'Large, near', km: 40, area: 1000, species: 48, x: 330, y: 120, rr: 62 },
  { name: 'Small, near', km: 40, area: 100, species: 22, x: 330, y: 300, rr: 30 },
  { name: 'Large, far', km: 300, area: 1000, species: 26, x: 590, y: 120, rr: 62 },
  { name: 'Small, far', km: 300, area: 100, species: 9, x: 590, y: 300, rr: 30 },
];
{
  const W = 720, H = 420, out = [];
  out.push(`<path d="M0,0 L150,0 C175,90 135,170 160,240 C180,310 140,370 150,${H} L0,${H} Z" fill="${GREEN}" fill-opacity="0.22" stroke="${GREEN}" stroke-width="2"/>`);
  out.push(text(70, 200, 'Mainland', { anchor: 'middle', size: 17, weight: 700 }), text(70, 222, '(source of', { anchor: 'middle', size: 13 }), text(70, 238, 'new species)', { anchor: 'middle', size: 13 }));
  for (const I of ISLANDS) {
    out.push(`<ellipse cx="${I.x}" cy="${I.y}" rx="${I.rr * 1.25}" ry="${I.rr}" fill="${OLIVE}" fill-opacity="0.18" stroke="${OLIVE}" stroke-width="2"/>`);
    const ty = I.rr < 40 ? I.y + I.rr + 18 : I.y - 4;
    out.push(text(I.x, ty, I.name, { anchor: 'middle', size: 14, weight: 700 }), text(I.x, ty + 18, `${I.species} species`, { anchor: 'middle', size: 14 }));
  }
  out.push(arrow(165, 120, 245, 120, { w: 3 }), arrow(165, 300, 270, 300, { w: 3 }), arrow(165, 200, 520, 160, { w: 1.5, dash: '6 5' }), arrow(165, 240, 548, 290, { w: 1.5, dash: '6 5' }));
  out.push(text(210, 108, 'many arrive', { anchor: 'middle', size: 12 }), text(440, 236, 'few arrive (far)', { anchor: 'middle', size: 12 }));
  out.push(text(330, 20, '40 km from mainland', { anchor: 'middle', size: 13, italic: true }), text(590, 20, '300 km from mainland', { anchor: 'middle', size: 13, italic: true }));
  out.push(invented(W, H));
  add('island-biogeo', 'island-biogeo-islands', W, H,
    'Map-style diagram: a mainland on the left and four islands. Large island 40 km away: 48 species. Small island 40 km away: 22 species. Large island 300 km away: 26 species. Small island 300 km away: 9 species. Solid arrows show many species arriving at near islands; dashed arrows show few arriving at far islands. Invented data.',
    out.join('\n'), 'Island size, distance and species richness');
}

/* ---------------------------------------------------------- 2.4 */
{
  const W = 720, H = 420, out = [];
  const f = frame({ x0: 90, y0: 60, w: 580, h: 250, xr: [0, 40], yr: [0, 100], xticks: [0, 5, 10, 15, 20, 25, 30, 35, 40], yticks: [], xLabel: 'Water temperature (°C)', yLabel: 'Number of fish', grid: false });
  const zones = [[0, 8, '#F4D7C7', 'Zone of intolerance'], [8, 16, '#FBEFD6', 'Zone of physiological stress'], [16, 26, SOFT, 'Optimal range'], [26, 33, '#FBEFD6', 'Zone of physiological stress'], [33, 40, '#F4D7C7', 'Zone of intolerance']];
  for (const [a, b, c] of zones) out.push(rect(f.sx(a), 60, f.sx(b) - f.sx(a), 250, { fill: c }));
  out.push(f.body);
  const g = t => (t <= 8 || t >= 33) ? 0 : 100 * Math.exp(-Math.pow((t - 21) / 5.2, 2) / 2) * (1 - Math.exp(-Math.pow(Math.min(t - 8, 33 - t), 2) / 6));
  const pts = []; for (let t = 0; t <= 40; t += 0.25) pts.push([f.sx(t), f.sy(Math.max(0, g(t)))]);
  out.push(poly(pts, { stroke: OLIVE, w: 3.5 }));
  const lab = [[4, 'Intolerance:', 'none survive'], [12, 'Stress:', 'few, weak'], [21, 'Optimal:', 'most fish'], [29.5, 'Stress:', 'few, weak'], [36.5, 'Intolerance:', 'none survive']];
  for (const [t, a, b] of lab) out.push(text(f.sx(t), 32, a, { anchor: 'middle', size: 13, weight: 700 }), text(f.sx(t), 48, b, { anchor: 'middle', size: 12 }));
  for (const t of [8, 16, 26, 33]) out.push(line(f.sx(t), 60, f.sx(t), 310, { stroke: '#8A8F86', w: 1, dash: '4 4' }));
  out.push(invented(W, H));
  add('ecological-tolerance', 'ecological-tolerance-zones', W, H,
    'Range of tolerance for an invented fish species against water temperature. The curve of fish numbers is highest in the optimal range, 16 to 26 °C, low in the zones of physiological stress, 8 to 16 °C and 26 to 33 °C, and zero in the zones of intolerance below 8 °C and above 33 °C.',
    out.join('\n'), 'Range of tolerance for water temperature');
}

/* ---------------------------------------------------------- 2.5 */
{
  const W = 720, H = 380, out = [];
  const x0 = 200, x1 = 690, sx = yr => x0 + yr / 30 * (x1 - x0);
  out.push(line(x0, 330, x1, 330), text((x0 + x1) / 2, 365, 'Years', { anchor: 'middle', weight: 700 }));
  for (let y = 0; y <= 30; y += 5) out.push(line(sx(y), 330, sx(y), 336), text(sx(y), 350, y, { anchor: 'middle', size: 13 }));
  const rows = [
    ['Periodic', 'regular interval', 'river floods each spring', Array.from({ length: 31 }, (_, i) => i), OLIVE, 70],
    ['Episodic', 'recurs, irregular', 'droughts', [3, 4, 11, 17, 18, 26], BLUE, 170],
    ['Random', 'no pattern', 'volcanic eruption', [21], VERM, 270],
  ];
  for (const [name, sub, ex, ev, col, y] of rows) {
    out.push(text(20, y - 6, name, { size: 18, weight: 700, fill: col }), text(20, y + 14, sub, { size: 13 }), text(20, y + 32, `e.g. ${ex}`, { size: 13, italic: true }));
    out.push(line(x0, y + 10, x1, y + 10, { stroke: GRID, w: 1 }));
    for (const e of ev) out.push(rect(sx(e) - 4, y - 14, 8, 30, { fill: col, op: 0.85 }));
  }
  out.push(text(W - 12, 20, 'Invented example', { anchor: 'end', size: 11, fill: '#5B625A', italic: true }));
  add('natural-disruptions', 'natural-disruptions-timing', W, H,
    'Timeline of 30 years with three rows of events. Periodic: a river floods every spring, a mark every year. Episodic: droughts in years 3, 4, 11, 17, 18 and 26, recurring at irregular intervals. Random: one volcanic eruption in year 21. Invented example.',
    out.join('\n'), 'Periodic, episodic and random disruptions');
}

/* ---------------------------------------------------------- 2.6 */
export const BEAKS = { classes: ['8', '9', '10', '11', '12'], before: [10, 25, 35, 20, 10], after: [4, 15, 32, 30, 19] };
{
  const W = 720, H = 420, { classes, before, after } = BEAKS, out = [];
  const f = frame({ x0: 100, w: 560, h: 270, xr: [0, 5], yr: [0, 40], yticks: [0, 10, 20, 30, 40], xticks: [], yLabel: 'Percent of birds', xLabel: 'Beak depth (mm)' });
  out.push(f.body);
  classes.forEach((c, j) => {
    const gx = f.sx(j + 0.5), bw = 38;
    out.push(rect(gx - bw - 3, f.sy(before[j]), bw, f.sy(0) - f.sy(before[j]), { fill: OLIVE, op: 0.8, stroke: OLIVE, w: 1 }), rect(gx + 3, f.sy(after[j]), bw, f.sy(0) - f.sy(after[j]), { fill: BLUE, op: 0.75, stroke: BLUE, w: 1 }));
    out.push(text(gx - bw / 2 - 3, f.sy(before[j]) - 6, before[j], { anchor: 'middle', size: 12, weight: 700 }), text(gx + bw / 2 + 3, f.sy(after[j]) - 6, after[j], { anchor: 'middle', size: 12, weight: 700 }));
    out.push(text(gx, 320, c, { anchor: 'middle', size: 13 }));
  });
  out.push(legend(110, 50, [{ name: 'Parents (before the drought)', color: OLIVE, box: true }, { name: 'Offspring (after the drought)', color: BLUE, box: true }]));
  out.push(invented(W, H));
  add('evolving-populations', 'evolving-populations-beaks', W, H,
    'Bar chart of beak depth in an invented seed-eating bird. Parents before a drought: 10% at 8 mm, 25% at 9 mm, 35% at 10 mm, 20% at 11 mm, 10% at 12 mm. Offspring after the drought: 4% at 8 mm, 15% at 9 mm, 32% at 10 mm, 30% at 11 mm, 19% at 12 mm. The distribution shifts toward deeper beaks.',
    out.join('\n'), 'Beak depth before and after a drought');
}

/* ---------------------------------------------------------- 2.7 */
{
  const W = 760, H = 400, out = [];
  const row = (y, title, col, steps, start) => {
    out.push(text(20, y - 40, title, { size: 17, weight: 700, fill: col }));
    const n = steps.length, bw = (W - 40 - (n - 1) * 14) / n;
    steps.forEach((s, i) => {
      const x = 20 + i * (bw + 14);
      out.push(rect(x, y - 26, bw, 64, { fill: i === 0 ? '#F2F2EE' : SOFT, stroke: col, w: 1.8, rx: 8 }));
      const parts = s.split('|');
      parts.forEach((p, k) => out.push(text(x + bw / 2, y + 2 + (k - (parts.length - 1) / 2) * 17, p, { anchor: 'middle', size: 12.5, weight: k === 0 ? 700 : 400 })));
      if (i < n - 1) out.push(arrow(x + bw + 1, y + 6, x + bw + 13, y + 6, { w: 1.6 }));
    });
    out.push(text(20, y + 60, start, { size: 13, italic: true }));
  };
  row(90, 'Primary succession', OLIVE, ['Bare rock|no soil', 'Lichens, mosses|pioneer species', 'Grasses|thin soil', 'Shrubs', 'Fast-growing|trees', 'Mature forest|climax community'], 'Starts after lava cools or a glacier retreats. Soil must form first: slow, often centuries.');
  row(250, 'Secondary succession', BLUE, ['Soil remains|after fire or farm', 'Grasses, weeds|pioneer species', 'Shrubs', 'Fast-growing|trees', 'Mature forest|climax community'], 'Starts after a fire, a flood or an abandoned field. Soil and seeds remain: faster, often decades.');
  out.push(arrow(20, 375, W - 30, 375, { w: 2 }), text(W / 2, 368, 'Time', { anchor: 'middle', size: 13, weight: 700 }));
  add('succession', 'succession-stages', W, H,
    'Two rows of stages. Primary succession: bare rock with no soil, lichens and mosses as pioneer species, grasses on thin soil, shrubs, fast-growing trees, mature forest (climax community); it starts after lava cools or a glacier retreats and is slow. Secondary succession: soil remains after a fire or farm, grasses and weeds as pioneer species, shrubs, fast-growing trees, mature forest; it is faster because soil and seeds remain.',
    out.join('\n'), 'Primary and secondary succession');
}

/* ---------------------------------------------------------- 3.1 */
{
  const W = 720, H = 400, out = [];
  const f = frame({ x0: 100, w: 560, h: 260, xr: [0, 20], yr: [0, 100], xticks: [0, 5, 10, 15, 20], yticks: [0, 25, 50, 75, 100], xLabel: 'Size of food item (mm)', yLabel: 'Share of diet eaten (relative)' });
  out.push(f.body);
  const spec = x => 95 * Math.exp(-Math.pow((x - 6) / 1.1, 2) / 2), gen = x => 32 * Math.exp(-Math.pow((x - 10) / 4.5, 2) / 2);
  const P = fn => { const a = []; for (let x = 0; x <= 20; x += 0.1) a.push([f.sx(x), f.sy(fn(x))]); return a; };
  out.push(poly(P(gen), { stroke: BLUE, w: 3.5 }), poly(P(spec), { stroke: OLIVE, w: 3.5 }));
  out.push(text(f.sx(7.6), f.sy(88), 'Specialist: narrow niche', { size: 14, weight: 700, fill: OLIVE }), text(f.sx(13.5), f.sy(36), 'Generalist: broad niche', { size: 14, weight: 700, fill: BLUE }));
  out.push(invented(W, H).replace('Invented data for practice', 'Invented example'));
  add('generalists-specialists', 'generalists-specialists-niche', W, H,
    'Two curves of how much of each food size two species eat. The specialist curve is tall and narrow, centered on 6 mm food items. The generalist curve is low and broad, spread from about 0 to 20 mm. Invented example.',
    out.join('\n'), 'Narrow and broad niches');
}

/* ---------------------------------------------------------- 3.2 */
{
  const W = 720, H = 430, out = [];
  const rows = [['Offspring per reproduction', 'many', 'few'], ['Size of each offspring', 'small', 'large'], ['Parental care', 'little or none', 'a lot'], ['Age at first reproduction', 'early', 'late'], ['Life span', 'short', 'long'], ['Population size over time', 'swings up and down', 'fairly steady'], ['After a disruption', 'rebounds fast', 'recovers slowly'], ['Examples', 'insects, mice, weeds', 'elephants, whales, oaks']];
  const cx = [20, 330, 530], cw = [300, 190, 170];
  out.push(rect(cx[1], 18, cw[1], 40, { fill: OLIVE, op: 0.16, rx: 6 }), rect(cx[2], 18, cw[2], 40, { fill: BLUE, op: 0.14, rx: 6 }));
  out.push(text(cx[0] + 6, 44, 'Trait', { size: 16, weight: 700 }), text(cx[1] + cw[1] / 2, 44, 'r-selected', { anchor: 'middle', size: 17, weight: 700, fill: OLIVE }), text(cx[2] + cw[2] / 2, 44, 'K-selected', { anchor: 'middle', size: 17, weight: 700, fill: BLUE }));
  rows.forEach((rw, i) => {
    const y = 64 + i * 44;
    if (i % 2 === 0) out.push(rect(14, y, W - 28, 44, { fill: '#F5F6F0' }));
    out.push(text(cx[0] + 6, y + 28, rw[0], { size: 15, weight: 700 }), text(cx[1] + cw[1] / 2, y + 28, rw[1], { anchor: 'middle', size: 15 }), text(cx[2] + cw[2] / 2, y + 28, rw[2], { anchor: 'middle', size: 15 }));
  });
  add('r-k-selection', 'r-k-selection-traits', W, H,
    'Table comparing r-selected and K-selected species. r-selected: many small offspring, little or no parental care, early first reproduction, short life span, population swings up and down, rebounds fast after a disruption; examples insects, mice, weeds. K-selected: few large offspring, a lot of parental care, late first reproduction, long life span, fairly steady population, recovers slowly after a disruption; examples elephants, whales, oaks.',
    out.join('\n'), 'r-selected and K-selected traits');
}

/* ---------------------------------------------------------- 3.3 */
// Survivors out of 1,000 newborns at each 10% of the maximum life span (log scale).
export const SURV = {
  ages: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  I: [1000, 980, 970, 960, 940, 910, 860, 750, 500, 150, 1],
  II: [1000, 501, 251, 126, 63, 32, 16, 8, 4, 2, 1],
  III: [1000, 40, 12, 9, 7, 6, 5, 4, 3, 2, 1],
};
{
  const W = 720, H = 420, out = [];
  const f = frame({ x0: 100, y0: 30, w: 560, h: 290, xr: [0, 100], yr: [1, 1000], ylog: true, yticks: [1, 10, 100, 1000], xticks: [0, 20, 40, 60, 80, 100], xLabel: 'Age (% of maximum life span)', yLabel: 'Survivors (log scale)', yfmt: v => v.toLocaleString('en-US') });
  out.push(f.body);
  const S = k => SURV.ages.map((a, i) => [f.sx(a), f.sy(SURV[k][i])]);
  out.push(poly(S('I'), { stroke: OLIVE, w: 3.5 }), poly(S('II'), { stroke: BLUE, w: 3.5, dash: '9 6' }), poly(S('III'), { stroke: VERM, w: 3.5 }));
  out.push(text(f.sx(40), f.sy(1000) - 8, 'Type I', { size: 15, weight: 700, fill: OLIVE }), text(f.sx(44), f.sy(70), 'Type II', { size: 15, weight: 700, fill: BLUE }), text(f.sx(30), f.sy(16), 'Type III', { size: 15, weight: 700, fill: VERM }));
  out.push(text(110, 312, 'Start: 1,000 newborns at age 0', { size: 12, italic: true }));
  add('survivorship-curves', 'survivorship-curves-types', W, H,
    'Three survivorship curves on a log scale, starting from 1,000 newborns. Type I stays near 1,000 until late in life, then drops steeply (most die old). Type II falls as a straight line on the log scale, so the same fraction die at every age. Type III drops to about 40 by 10% of the life span, then levels off (most die young).',
    out.join('\n'), 'Type I, II and III survivorship curves');
}

/* ---------------------------------------------------------- 3.4 */
export const HERD = { K: 1000, pts: [[0, 50], [3, 120], [6, 300], [9, 640], [12, 1080], [14, 1450], [16, 1700], [18, 1300], [20, 600], [22, 380], [24, 520], [26, 700], [28, 760], [30, 740]] };
{
  const W = 720, H = 420, out = [];
  const f = frame({ x0: 100, w: 560, h: 280, xr: [0, 30], yr: [0, 2000], yticks: [0, 500, 1000, 1500, 2000], xticks: [0, 5, 10, 15, 20, 25, 30], xLabel: 'Years after deer reached the island', yLabel: 'Number of deer', yfmt: v => v.toLocaleString('en-US') });
  out.push(f.body, line(f.sx(0), f.sy(HERD.K), f.sx(30), f.sy(HERD.K), { stroke: BLUE, w: 2.5, dash: '9 6' }));
  out.push(text(f.sx(0.5), f.sy(HERD.K) - 8, 'Carrying capacity: 1,000', { size: 13, weight: 700, fill: BLUE }));
  out.push(poly(HERD.pts.map(p => [f.sx(p[0]), f.sy(p[1])]), { stroke: OLIVE, w: 3.5 }));
  for (const p of HERD.pts) out.push(`<circle cx="${r(f.sx(p[0]))}" cy="${r(f.sy(p[1]))}" r="4" fill="${OLIVE}"/>`);
  out.push(text(f.sx(16.6), f.sy(1780), 'Overshoot', { size: 14, weight: 700 }), text(f.sx(22), f.sy(380) + 26, 'Dieback', { size: 14, weight: 700, anchor: 'middle' }));
  out.push(invented(W, H));
  add('carrying-limits', 'carrying-limits-overshoot', W, H,
    'Line graph of an invented deer herd on an island over 30 years. It grows from 50 to a peak of 1,700 in year 16, well above the carrying capacity of 1,000 (dashed line), then dies back to 380 by year 22 and recovers only to about 750, below the old carrying capacity, because heavy grazing damaged the plants.',
    out.join('\n'), 'Overshoot and dieback');
}

/* ---------------------------------------------------------- 3.5 */
{
  const W = 720, H = 420, out = [];
  const K = 1000, N0 = 20, rr = 0.25;
  const f = frame({ x0: 100, w: 560, h: 280, xr: [0, 30], yr: [0, 1400], yticks: [0, 200, 400, 600, 800, 1000, 1200, 1400], xticks: [0, 5, 10, 15, 20, 25, 30], xLabel: 'Time (years)', yLabel: 'Population size', yfmt: v => v.toLocaleString('en-US') });
  out.push(f.body, line(f.sx(0), f.sy(K), f.sx(30), f.sy(K), { stroke: '#5B625A', w: 1.8, dash: '6 5' }), text(f.sx(29.5), f.sy(K) - 8, 'Carrying capacity (K)', { anchor: 'end', size: 13, weight: 700 }));
  const J = [], S = [];
  for (let t = 0; t <= 30; t += 0.1) { const e = N0 * Math.exp(rr * t); if (e <= 1400) J.push([f.sx(t), f.sy(e)]); S.push([f.sx(t), f.sy(K / (1 + (K - N0) / N0 * Math.exp(-rr * t)))]); }
  out.push(poly(J, { stroke: VERM, w: 3.5 }), poly(S, { stroke: OLIVE, w: 3.5 }));
  out.push(text(f.sx(15.6), f.sy(1300), 'Exponential (J-curve)', { size: 14, weight: 700, fill: VERM, anchor: 'end' }), text(f.sx(21), f.sy(620), 'Logistic (S-curve)', { size: 14, weight: 700, fill: OLIVE }));
  out.push(text(f.sx(15.6), f.sy(K / 2) + 4, '← fastest growth at K/2', { size: 12 }));
  add('population-growth', 'population-growth-j-s', W, H,
    'Two growth curves from the same start of 20 individuals. The exponential J-curve rises faster and faster and leaves the graph above 1,400 at about year 17. The logistic S-curve grows fastest at half the carrying capacity, 500, and levels off at the carrying capacity of 1,000 (dashed line).',
    out.join('\n'), 'Exponential and logistic growth');
}

/* ---------------------------------------------------------- pyramids */
function pyramids(panels, { W, H, unit, max, step, top = 40, groups }) {
  const out = [];
  const pw = (W - 40) / panels.length;
  panels.forEach((P, k) => {
    const cx = 20 + pw * k + pw / 2 + 14, half = pw / 2 - 46, rowH = (H - top - 90) / groups.length;
    const sx = v => v / max * half;
    out.push(text(cx, top - 14, P.name, { anchor: 'middle', size: 16, weight: 700 }));
    groups.forEach((g, j) => {
      const y = top + (groups.length - 1 - j) * rowH;
      out.push(rect(cx - 22 - sx(P.male[j]), y + 2, sx(P.male[j]), rowH - 4, { fill: OLIVE, op: 0.8 }), rect(cx + 22, y + 2, sx(P.female[j]), rowH - 4, { fill: BLUE, op: 0.75 }));
      out.push(text(cx, y + rowH / 2 + 4, g, { anchor: 'middle', size: 10 }));
    });
    const by = top + groups.length * rowH + 4;
    out.push(line(cx - 22 - half, by, cx - 22, by), line(cx + 22, by, cx + 22 + half, by));
    for (let v = 0; v <= max + 1e-9; v += step) {
      out.push(line(cx - 22 - sx(v), by, cx - 22 - sx(v), by + 4), text(cx - 22 - sx(v), by + 17, fmt(v), { anchor: 'middle', size: 11 }));
      if (v) out.push(line(cx + 22 + sx(v), by, cx + 22 + sx(v), by + 4), text(cx + 22 + sx(v), by + 17, fmt(v), { anchor: 'middle', size: 11 }));
    }
  });
  out.push(text(W / 2, H - 40, unit, { anchor: 'middle', size: 13, weight: 700 }));
  out.push(legend(30, H - 16, [{ name: 'Male', color: OLIVE, box: true }]), legend(110, H - 16, [{ name: 'Female', color: BLUE, box: true }]));
  out.push(text(W - 14, H - 12, 'Age groups in years at the center of each pyramid. Invented data for practice', { anchor: 'end', size: 11, italic: true, fill: '#5B625A' }));
  return out.join('\n');
}
export const AGE_GROUPS = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
export const SHAPES = [
  { name: 'Rapid growth', male: [13.5, 11, 8.5, 6.5, 4.5, 3, 2, 1, 0.4], female: [13, 10.5, 8.5, 6.5, 4.5, 3, 2.2, 1, 0.4] },
  { name: 'Slow or no growth', male: [6, 6.2, 6.3, 6.3, 6.2, 5.8, 5.3, 4, 2], female: [5.8, 6, 6.2, 6.3, 6.3, 6.1, 5.8, 4.9, 4.5] },
  { name: 'Decline', male: [4, 4.6, 5.4, 6.4, 7, 7, 6.4, 5, 3.2], female: [3.8, 4.4, 5.2, 6.2, 7, 7.2, 6.8, 5.6, 4.8] },
];
for (const P of SHAPES) { const t = [...P.male, ...P.female].reduce((a, b) => a + b, 0); if (Math.abs(t - 100) > 1e-9) throw new Error(`${P.name} sums to ${t}%`); }
// Three invented countries, millions of people by age group.
export const COUNTRIES = [
  { name: 'Country X', male: [4.2, 3.4, 2.6, 1.9, 1.3, 0.8, 0.5, 0.2, 0.1], female: [4.0, 3.3, 2.6, 1.9, 1.4, 0.9, 0.6, 0.3, 0.1] },
  { name: 'Country Y', male: [2.0, 2.1, 2.1, 2.0, 2.0, 1.9, 1.6, 1.0, 0.4], female: [1.9, 2.0, 2.0, 2.0, 2.0, 1.9, 1.7, 1.2, 0.7] },
  { name: 'Country Z', male: [1.0, 1.2, 1.5, 1.8, 2.0, 2.1, 1.9, 1.4, 0.7], female: [1.0, 1.1, 1.4, 1.7, 2.0, 2.1, 2.0, 1.6, 1.1] },
];
{
  const W = 780, H = 420;
  add('age-structure', 'age-structure-shapes', W, H,
    'Three population pyramids, percent of the population in each 10-year age group, male on the left and female on the right. Rapid growth: a wide base (13.5% of the population is male and 13% female aged 0 to 9) narrowing quickly with age. Slow or no growth: bars of almost equal length up to age 60 (a column). Decline: a base narrower than the middle, with the widest bars at ages 40 to 59. Invented data.',
    pyramids(SHAPES, { W, H, unit: 'Percent of population', max: 15, step: 5, groups: AGE_GROUPS }), 'Three shapes of age structure diagram');
  add('age-structure', 'age-structure-countries', W, H,
    'Population pyramids of three invented countries in millions of people. Country X: 4.2 million males and 4.0 million females aged 0 to 9, shrinking steadily to 0.1 million aged 80 and over. Country Y: about 2 million in each sex in every group from 0 to 59, then fewer. Country Z: 1.0 million of each sex aged 0 to 9, rising to 2.1 million in each sex aged 50 to 59, then falling.',
    pyramids(COUNTRIES, { W, H, unit: 'Population (millions)', max: 5, step: 1, groups: AGE_GROUPS }), 'Population pyramids of Countries X, Y and Z');
}
// FRQ: two countries, millions, five age groups.
export const FRQ_GROUPS = ['0-14', '15-29', '30-44', '45-59', '60-74', '75+'];
export const FRQ_PYR = [
  { name: 'Country P', male: [9.0, 6.5, 4.5, 2.6, 1.2, 0.3], female: [8.8, 6.4, 4.5, 2.7, 1.4, 0.4] },
  { name: 'Country Q', male: [3.0, 3.3, 3.5, 3.6, 3.0, 1.6], female: [2.9, 3.2, 3.5, 3.7, 3.3, 2.4] },
];
{
  const W = 720, H = 400;
  add('age-structure', 'age-structure-frq-pq', W, H,
    'Population pyramids of invented Countries P and Q in millions. Country P, males then females: ages 0 to 14, 9.0 and 8.8; 15 to 29, 6.5 and 6.4; 30 to 44, 4.5 and 4.5; 45 to 59, 2.6 and 2.7; 60 to 74, 1.2 and 1.4; 75 and over, 0.3 and 0.4. Country Q: 0 to 14, 3.0 and 2.9; 15 to 29, 3.3 and 3.2; 30 to 44, 3.5 and 3.5; 45 to 59, 3.6 and 3.7; 60 to 74, 3.0 and 3.3; 75 and over, 1.6 and 2.4.',
    pyramids(FRQ_PYR, { W, H, unit: 'Population (millions)', max: 10, step: 2, groups: FRQ_GROUPS }), 'Population pyramids of Countries P and Q');
}

/* ---------------------------------------------------------- 3.7 */
export const TFR_LINES = { years: [1960, 1970, 1980, 1990, 2000, 2010, 2020], A: [6.8, 6.6, 6.2, 5.4, 4.3, 3.4, 2.8], B: [3.6, 2.9, 2.2, 1.9, 1.7, 1.6, 1.5] };
{
  const W = 720, H = 420, out = [];
  const f = frame({ x0: 100, w: 560, h: 280, xr: [1960, 2020], yr: [0, 8], yticks: [0, 1, 2, 3, 4, 5, 6, 7, 8], xticks: TFR_LINES.years, xfmt: v => String(v), xLabel: 'Year', yLabel: 'Total fertility rate (children per woman)' });
  out.push(f.body, line(f.sx(1960), f.sy(2.1), f.sx(2020), f.sy(2.1), { stroke: '#5B625A', w: 2, dash: '6 5' }), text(f.sx(1961), f.sy(2.1) + 18, 'Replacement level, about 2.1', { size: 13, weight: 700 }));
  const L = k => TFR_LINES.years.map((y, i) => [f.sx(y), f.sy(TFR_LINES[k][i])]);
  out.push(poly(L('A'), { stroke: OLIVE, w: 3.5 }), poly(L('B'), { stroke: BLUE, w: 3.5 }));
  for (const k of ['A', 'B']) L(k).forEach(p => out.push(`<circle cx="${r(p[0])}" cy="${r(p[1])}" r="4" fill="${k === 'A' ? OLIVE : BLUE}"/>`));
  out.push(legend(470, 46, [{ name: 'Country A', color: OLIVE }, { name: 'Country B', color: BLUE }]));
  out.push(invented(W, H));
  add('total-fertility-rate', 'total-fertility-rate-trends', W, H,
    'Line graph of total fertility rate from 1960 to 2020 for two invented countries, with a dashed line at replacement level, about 2.1. Country A falls from 6.8 in 1960 to 2.8 in 2020, still above replacement. Country B falls from 3.6 in 1960 to 2.2 in 1980 and to 1.5 in 2020, below replacement since about 1985.',
    out.join('\n'), 'Total fertility rate in two countries');
}

/* ---------------------------------------------------------- 3.8 */
{
  const W = 720, H = 420, out = [];
  const f = frame({ x0: 100, w: 560, h: 280, xr: [0, 105], yr: [0, 80], yticks: [0, 10, 20, 30, 40, 50, 60, 70, 80], xticks: [0, 35, 70, 105], xLabel: 'Years from now', yLabel: 'Population (millions)' });
  out.push(f.body);
  const P = []; for (let t = 0; t <= 105; t += 0.5) P.push([f.sx(t), f.sy(10 * Math.pow(1.02, t))]);
  out.push(poly(P, { stroke: OLIVE, w: 3.5 }));
  for (const [t, v] of [[35, 20], [70, 40], [105, 80]]) {
    const yv = 10 * Math.pow(1.02, t);
    out.push(line(f.sx(0), f.sy(yv), f.sx(t), f.sy(yv), { stroke: BLUE, w: 1.6, dash: '5 4' }), line(f.sx(t), f.sy(yv), f.sx(t), f.sy(0), { stroke: BLUE, w: 1.6, dash: '5 4' }));
    out.push(`<circle cx="${r(f.sx(t))}" cy="${r(f.sy(yv))}" r="5" fill="${BLUE}"/>`, text(f.sx(t) - 8, f.sy(yv) - 10, `about ${v} million`, { anchor: 'end', size: 13, weight: 700, fill: BLUE }));
  }
  out.push(text(f.sx(3), f.sy(76), 'Growth rate 2% a year: doubling time = 70 / 2 = 35 years', { size: 14, weight: 700 }));
  out.push(invented(W, H).replace('Invented data for practice', 'Invented example'));
  add('human-population', 'human-population-doubling', W, H,
    'Line graph of a population of 10 million growing 2% a year for 105 years. Dashed guides mark doubling every 35 years: about 20 million at 35 years, 40 million at 70 years and 80 million at 105 years, as the rule of 70 predicts (70 divided by 2 is 35). Invented example.',
    out.join('\n'), 'Doubling every 35 years at 2% growth');
}

/* ---------------------------------------------------------- 3.9 */
export const DTM = {
  t: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  cbr: [40, 40, 40, 40, 38, 32, 24, 17, 12, 11, 11],
  cdr: [38, 36, 30, 21, 15, 12, 10, 10, 10, 10, 10],
};
{
  const W = 760, H = 440, out = [];
  const f = frame({ x0: 100, y0: 60, w: 600, h: 270, xr: [0, 100], yr: [0, 50], yticks: [0, 10, 20, 30, 40, 50], xticks: [], yLabel: 'Rate per 1,000 people per year' });
  const stages = [[0, 20, 'Stage 1', 'Preindustrial'], [20, 50, 'Stage 2', 'Transitional'], [50, 80, 'Stage 3', 'Industrial'], [80, 100, 'Stage 4', 'Postindustrial']];
  stages.forEach(([a, b], i) => out.push(rect(f.sx(a), 60, f.sx(b) - f.sx(a), 270, { fill: i % 2 ? '#FFFFFF' : '#F5F6F0' })));
  // Shade the gap between births and deaths: natural increase.
  const top = DTM.t.map((t, i) => `${r(f.sx(t))},${r(f.sy(DTM.cbr[i]))}`), bot = DTM.t.map((t, i) => `${r(f.sx(t))},${r(f.sy(DTM.cdr[i]))}`).reverse();
  out.push(`<polygon points="${top.concat(bot).join(' ')}" fill="${GREEN}" fill-opacity="0.18"/>`);
  out.push(f.body);
  for (const [a, b, s, n] of stages) out.push(text(f.sx((a + b) / 2), 30, s, { anchor: 'middle', size: 15, weight: 700 }), text(f.sx((a + b) / 2), 48, n, { anchor: 'middle', size: 13 }), line(f.sx(b), 60, f.sx(b), 330, { stroke: '#8A8F86', w: 1, dash: '4 4' }));
  out.push(poly(DTM.t.map((t, i) => [f.sx(t), f.sy(DTM.cbr[i])]), { stroke: OLIVE, w: 3.5 }), poly(DTM.t.map((t, i) => [f.sx(t), f.sy(DTM.cdr[i])]), { stroke: VERM, w: 3.5, dash: '9 6' }));
  out.push(text(f.sx(56), f.sy(32) - 4, 'Crude birth rate', { size: 14, weight: 700, fill: OLIVE }), text(f.sx(82), f.sy(10) + 22, 'Crude death rate', { size: 14, weight: 700, fill: VERM }), text(f.sx(41), f.sy(27) + 2, 'natural increase', { anchor: 'middle', size: 13, italic: true, fill: '#00714F' }));
  out.push(arrow(100, 360, 700, 360), text(400, 384, 'Time, as a country develops', { anchor: 'middle', weight: 700 }));
  out.push(invented(W, H).replace('Invented data for practice', 'Model with invented numbers'));
  add('population-transition', 'population-transition-model', W, H,
    'Demographic transition model in four stages. Stage 1 preindustrial: crude birth and death rates both near 40 per 1,000, little growth. Stage 2 transitional: the death rate falls to about 12 while the birth rate stays near 40, so the gap (natural increase, shaded) is widest. Stage 3 industrial: the birth rate falls from about 32 to 12 and the gap narrows. Stage 4 postindustrial: both rates low, about 11 and 10, little growth.',
    out.join('\n'), 'The demographic transition model');
}

mkdirSync(REG, { recursive: true });
for (const [topic, entries] of Object.entries(figs)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`unit-2-unit-3 figures: ${Object.values(figs).reduce((n, e) => n + Object.keys(e).length, 0)} SVGs for ${Object.keys(figs).length} topics`);
