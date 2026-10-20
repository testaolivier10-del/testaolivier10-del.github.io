/* AP® Environmental Science figures for Units 7 and 8 (author F).
   Writes environmental-science/figures/<id>.svg for every figure registered in
   environmental-science/data/figures/<topic>.json by the Unit 7 and 8 topics.
   Charts are drawn from the numbers below (each says invented or its public
   source); diagrams are drawn from simple shapes. White background, role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, olive #474A10, and the
   Okabe-Ito blue #0072B2, green #009E73 and vermillion #D55E00.

     node scripts/apenv-figures/unit-7-unit-8.mjs            write every figure
     node scripts/apenv-figures/unit-7-unit-8.mjs <id> ...   write some */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'environmental-science', 'figures');
const INK = '#1F2A28', OLIVE = '#474A10', SOFT = '#D3D27F', BLUE = '#0072B2', GREEN = '#009E73', RED = '#D55E00', GREY = '#6B7370', PALE = '#F4F5EC', SKY = '#E8F2F9';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = v => Math.round(v * 10) / 10;

function svg(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="Arial, Helvetica, sans-serif">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}"/></marker>
<marker id="arO" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${OLIVE}"/></marker>
<marker id="arB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${BLUE}"/></marker>
<marker id="arR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${RED}"/></marker></defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}
// Text: lines is a string or an array of lines; centered by default.
function T(x, y, lines, { size = 15, weight = 400, fill = INK, anchor = 'middle', lh = 1.25, italic = false } = {}) {
  const L = [].concat(lines);
  const y0 = y - (L.length - 1) * size * lh / 2;
  return `<text x="${r(x)}" y="${r(y0)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''} dominant-baseline="middle">${L.map((l, i) => `<tspan x="${r(x)}" dy="${i ? r(size * lh) : 0}">${l === '' ? '\u00a0' : esc(l)}</tspan>`).join('')}</text>`;
}
function box(x, y, w, h, lines, { fill = PALE, stroke = OLIVE, size = 15, weight = 400, color = INK, rx = 8, sw = 2 } = {}) {
  return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>` + (lines ? T(x + w / 2, y + h / 2, lines, { size, weight, fill: color }) : '');
}
function arrow(x1, y1, x2, y2, { color = INK, sw = 2.5, dash = '', m = 'ar' } = {}) {
  return `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${color}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#${m})"/>`;
}
const line = (x1, y1, x2, y2, c = INK, sw = 2, dash = '') => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${c}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const rect = (x, y, w, h, fill, stroke = 'none', sw = 0, rx = 0) => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rx}" fill="${fill}"${stroke !== 'none' ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;
const circle = (cx, cy, rr, fill, stroke = 'none', sw = 0) => `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(rr)}" fill="${fill}"${stroke !== 'none' ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;
const path = (d, fill = 'none', stroke = INK, sw = 2) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

function niceStep(raw) { const p = 10 ** Math.floor(Math.log10(raw)), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
const fmt = v => (Math.abs(v) >= 1000 ? v.toLocaleString('en-US') : String(+v.toPrecision(6)));

/* A line chart drawn from its data: series [{ name, points: [[x, y]], color, dash }]. */
function lineChart({ w = 800, h = 440, x: [x0, x1], y: [y0, y1], xStep, yStep, xLabel, yLabel, series, xTick = fmt, legend = 'top', note }) {
  const L = 78, R = 40, Tp = legend === 'top' ? 56 : 24, B = 70 + (note ? 22 : 0);
  const pw = w - L - R, ph = h - Tp - B;
  const sx = v => L + (v - x0) / (x1 - x0) * pw, sy = v => Tp + ph - (v - y0) / (y1 - y0) * ph;
  let s = '';
  for (let v = y0; v <= y1 + 1e-9; v += yStep) s += line(L, sy(v), L + pw, sy(v), '#DADDD4', 1) + T(L - 10, sy(v), fmt(+v.toFixed(6)), { size: 14, anchor: 'end' });
  for (let v = x0; v <= x1 + 1e-9; v += xStep) s += line(sx(v), Tp + ph, sx(v), Tp + ph + 6, INK, 1.5) + T(sx(v), Tp + ph + 20, xTick(v), { size: 14 });
  s += line(L, Tp + ph, L + pw, Tp + ph, INK, 2) + line(L, Tp, L, Tp + ph, INK, 2);
  s += T(L + pw / 2, Tp + ph + 46, xLabel, { size: 15, weight: 700 });
  s += `<text x="20" y="${r(Tp + ph / 2)}" font-size="15" font-weight="700" fill="${INK}" text-anchor="middle" transform="rotate(-90 20 ${r(Tp + ph / 2)})">${esc(yLabel)}</text>`;
  const marks = ['circle', 'square', 'diamond', 'triangle'];
  series.forEach((se, i) => {
    const pts = se.points.map(([a, b]) => `${r(sx(a))},${r(sy(b))}`).join(' ');
    s += `<polyline points="${pts}" fill="none" stroke="${se.color}" stroke-width="3"${se.dash ? ` stroke-dasharray="${se.dash}"` : ''}/>`;
    for (const [a, b] of se.points) {
      const cx = sx(a), cy = sy(b), k = marks[i % 4];
      s += k === 'circle' ? circle(cx, cy, 4.5, se.color) : k === 'square' ? rect(cx - 4, cy - 4, 8, 8, se.color) : k === 'diamond' ? path(`M${r(cx)},${r(cy - 5.5)} L${r(cx + 5.5)},${r(cy)} L${r(cx)},${r(cy + 5.5)} L${r(cx - 5.5)},${r(cy)} z`, se.color, 'none', 0) : path(`M${r(cx)},${r(cy - 5.5)} L${r(cx + 5.5)},${r(cy + 4.5)} L${r(cx - 5.5)},${r(cy + 4.5)} z`, se.color, 'none', 0);
    }
  });
  if (legend === 'top') {
    let lx = L;
    series.forEach(se => { s += line(lx, 24, lx + 30, 24, se.color, 3, se.dash || '') + T(lx + 38, 24, se.name, { size: 14, anchor: 'start' }); lx += 52 + se.name.length * 7.6; });
  }
  if (note) s += T(w / 2, h - 14, note, { size: 13, fill: GREY, italic: true });
  return { body: s, sx, sy };
}

/* A bar chart drawn from its data: horizontal bars, categories [label], values [v]. */
function hbarChart({ w = 800, h = 460, cats, values, max, step, xLabel, colors, labelW = 300, note, valueFmt = v => fmt(v) }) {
  const L = labelW, R = 60, Tp = 20, B = 62 + (note ? 22 : 0);
  const pw = w - L - R, ph = h - Tp - B, bh = ph / cats.length;
  const sx = v => L + v / max * pw;
  let s = '';
  for (let v = 0; v <= max + 1e-9; v += step) s += line(sx(v), Tp, sx(v), Tp + ph, '#DADDD4', 1) + T(sx(v), Tp + ph + 18, fmt(v), { size: 14 });
  cats.forEach((c, i) => {
    const y = Tp + i * bh + bh * 0.18, hh = bh * 0.64;
    s += rect(L, y, sx(values[i]) - L, hh, colors ? colors[i] : OLIVE);
    s += T(L - 10, y + hh / 2, c, { size: 14, anchor: 'end' });
    s += T(sx(values[i]) + 6, y + hh / 2, valueFmt(values[i]), { size: 14, anchor: 'start', weight: 700 });
  });
  s += line(L, Tp, L, Tp + ph, INK, 2) + line(L, Tp + ph, L + pw, Tp + ph, INK, 2);
  s += T(L + pw / 2, Tp + ph + 44, xLabel, { size: 15, weight: 700 });
  if (note) s += T(w / 2, h - 14, note, { size: 13, fill: GREY, italic: true });
  return s;
}

const FIG = {};

/* 7.1 Primary and secondary pollutants */
FIG['air-pollution-primary-secondary'] = () => {
  let s = '';
  // car
  s += rect(40, 300, 150, 48, BLUE, 'none', 0, 10) + rect(70, 270, 86, 36, BLUE, 'none', 0, 10) + circle(75, 350, 15, INK) + circle(158, 350, 15, INK) + rect(26, 330, 18, 8, GREY);
  s += T(115, 392, 'Cars and trucks', { size: 15, weight: 700 });
  // power plant
  s += rect(230, 250, 130, 100, '#C9CCC2', INK, 1.5) + rect(330, 205, 26, 45, '#C9CCC2', INK, 1.5) + rect(250, 280, 26, 26, '#FFFFFF', INK, 1) + rect(292, 280, 26, 26, '#FFFFFF', INK, 1);
  s += T(295, 392, 'Coal power plant', { size: 15, weight: 700 });
  // primary box
  s += box(30, 30, 330, 155, null, { fill: PALE });
  s += T(195, 56, 'Primary pollutants', { size: 18, weight: 700, fill: OLIVE });
  s += T(195, 82, 'released directly by a source', { size: 14, fill: GREY, italic: true });
  s += T(195, 135, ['CO, NO, NO2, SO2', 'particulates (PM10, PM2.5)', 'VOCs, lead, mercury'], { size: 16, lh: 1.45 });
  s += arrow(115, 262, 140, 192) + arrow(343, 202, 343, 192);
  // middle: sunlight and water
  s += circle(470, 70, 26, '#F2C14E') ;
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; s += line(470 + 32 * Math.cos(a), 70 + 32 * Math.sin(a), 470 + 44 * Math.cos(a), 70 + 44 * Math.sin(a), '#C99A1E', 3); }
  s += T(470, 140, ['sunlight', 'water vapor', 'oxygen'], { size: 14, lh: 1.35, fill: INK });
  s += arrow(368, 228, 560, 228, { color: OLIVE, sw: 3.5, m: 'arO' });
  s += T(464, 254, 'react in the air', { size: 15, weight: 700, fill: OLIVE });
  // secondary box
  s += box(570, 40, 210, 340, null, { fill: '#FCEFE6', stroke: RED });
  s += T(675, 66, 'Secondary', { size: 18, weight: 700, fill: RED });
  s += T(675, 90, 'pollutants', { size: 18, weight: 700, fill: RED });
  s += T(675, 116, 'formed in the air', { size: 14, fill: GREY, italic: true });
  s += T(675, 230, ['ozone (O3)', 'near the ground', '', 'sulfuric acid', '(from SO2)', '', 'nitric acid', '(from NO2)'], { size: 15, lh: 1.3 });
  return svg(800, 420, 'Primary and secondary air pollutants',
    'A car and a coal power plant release primary pollutants directly: carbon monoxide, nitrogen oxides, sulfur dioxide, particulates, VOCs, lead and mercury. In the air, with sunlight, water vapor and oxygen, some react to form secondary pollutants: ozone near the ground, sulfuric acid from SO2 and nitric acid from NO2.', s);
};

/* 7.2 One sunny weekday of NO, NO2 and ozone (invented data for practice; the
   same numbers as the visual set in data/questions/photochemical-smog.json). */
export const SMOG_DAY = {
  hours: [0, 3, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24],
  NO: [12, 8, 40, 80, 95, 60, 30, 12, 8, 10, 25, 20, 14, 12],
  NO2: [30, 25, 35, 55, 75, 85, 70, 45, 35, 40, 55, 48, 38, 30],
  O3: [20, 15, 10, 12, 20, 35, 60, 100, 120, 105, 60, 35, 25, 20],
};
FIG['photochemical-smog-day'] = () => {
  const P = k => SMOG_DAY.hours.map((h, i) => [h, SMOG_DAY[k][i]]);
  const hourName = h => h === 0 || h === 24 ? 'midnight' : h === 12 ? 'noon' : h < 12 ? `${h} a.m.` : `${h - 12} p.m.`;
  const c = lineChart({ w: 800, h: 460, x: [0, 24], y: [0, 140], xStep: 3, yStep: 20, xLabel: 'Time of day', yLabel: 'Concentration (ppb)', xTick: hourName,
    series: [{ name: 'NO (nitric oxide)', points: P('NO'), color: BLUE }, { name: 'NO2 (nitrogen dioxide)', points: P('NO2'), color: RED, dash: '9 5' }, { name: 'Ozone (O3)', points: P('O3'), color: OLIVE }],
    note: 'Invented data for practice' });
  let s = c.body;
  s += T(c.sx(8), c.sy(95) - 16, 'rush hour', { size: 13, fill: BLUE, weight: 700 });
  s += T(c.sx(14), c.sy(120) - 16, 'afternoon peak', { size: 13, fill: OLIVE, weight: 700 });
  return svg(800, 460, 'NO, NO2 and ozone through a sunny day',
    'Line graph, invented data. Nitric oxide rises with morning traffic to 95 ppb at 8 a.m.; nitrogen dioxide peaks at 85 ppb at 9 a.m.; ozone climbs through the morning to 120 ppb at 2 p.m., while NO2 falls, then drops after sunset to about 20 ppb at midnight.', s);
};

/* 7.3 Normal conditions and a thermal inversion, side by side (diagram). */
FIG['thermal-inversion-profile'] = () => {
  let s = '';
  const panel = (x0, title, inversion) => {
    let p = '', lab = '';
    const W = 360, top = 70, floor = 380;
    p += T(x0 + W / 2, 30, title, { size: 18, weight: 700, fill: inversion ? RED : OLIVE });
    if (inversion) {
      p += rect(x0, top, W, 90, '#EEF5FB') + rect(x0, top + 90, W, 70, '#FBE3D2') + rect(x0, top + 160, W, floor - top - 160, '#DCEBF6');
      lab += T(x0 + W / 2, top + 30, 'cooler air above', { size: 14, fill: GREY });
      lab += T(x0 + W / 2, top + 112, 'warm layer (the lid)', { size: 15, weight: 700, fill: RED });
      lab += T(x0 + 290, top + 215, 'cool, dense air', { size: 15, weight: 700, fill: BLUE });
      lab += T(x0 + 290, top + 237, 'cannot rise', { size: 14, fill: BLUE });
    } else {
      p += `<defs><linearGradient id="g${x0}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FBE3D2"/><stop offset="1" stop-color="#DCEBF6"/></linearGradient></defs>`;
      p += rect(x0, top, W, floor - top, `url(#g${x0})`);
      lab += T(x0 + 265, top + 30, 'cooler air', { size: 15, weight: 700, fill: BLUE });
      lab += T(x0 + 265, floor - 95, 'warm air', { size: 15, weight: 700, fill: RED });
      lab += T(x0 + 265, floor - 75, 'near the ground', { size: 14, fill: RED });
    }
    p += path(`M${x0},${top + 120} L${x0 + 70},${floor} L${x0},${floor} z`, '#8C9A6A', 'none', 0);
    p += path(`M${x0 + W},${top + 140} L${x0 + W - 60},${floor} L${x0 + W},${floor} z`, '#8C9A6A', 'none', 0);
    p += rect(x0, floor, W, 14, '#6F7D4E');
    for (const cx of (inversion ? [x0 + 100, x0 + 155] : [x0 + 120, x0 + 175])) p += rect(cx - 16, floor - 34, 32, 34, '#C9CCC2', INK, 1) + rect(cx + 6, floor - 50, 8, 16, '#8D8F86');
    if (inversion) {
      for (const cx of [x0 + 110, x0 + 165]) p += path(`M${cx},${floor - 52} C${cx - 6},${floor - 90} ${cx + 8},${floor - 130} ${cx},${top + 168}`, 'none', GREY, 6);
      p += `<ellipse cx="${x0 + 150}" cy="${top + 170}" rx="110" ry="11" fill="#8D8F86" opacity="0.8"/>`;
      p += line(x0 + 4, top + 160, x0 + W - 4, top + 160, RED, 2.5, '7 5');
    } else {
      for (const cx of [x0 + 130, x0 + 185]) p += path(`M${cx},${floor - 52} C${cx - 10},${floor - 140} ${cx + 30},${floor - 220} ${cx + 10},${top + 30}`, 'none', GREY, 6);
      p += arrow(x0 + 85, floor - 70, x0 + 85, top + 70, { color: RED, sw: 3, m: 'arR' });
      lab += T(x0 + 85, top + 52, 'warm air rises', { size: 14, weight: 700, fill: RED });
    }
    p += lab;
    p += T(x0 + W / 2, floor + 36, inversion ? 'Smoke stops under the warm layer' : 'Smoke rises, spreads and thins', { size: 15, weight: 700 });
    return p;
  };
  s += panel(20, 'Normal: air cools with height', false);
  s += panel(420, 'Thermal inversion', true);
  return svg(800, 440, 'Normal conditions and a thermal inversion',
    'Left: under normal conditions air near the valley floor is warmest and cools with height, so warm air rises and smoke from the town rises and spreads out. Right: in a thermal inversion a warm layer sits above cool, dense air in the valley; the smoke rises only to the warm layer and spreads out beneath it, trapped like under a lid.', s);
};

/* 7.4 Natural sources of CO2 and particulate matter (diagram). */
FIG['co2-particulates-natural-sources'] = () => {
  let s = rect(0, 0, 800, 300, SKY) + rect(0, 300, 800, 100, '#E9E4D2');
  // volcano
  s += path('M40,300 L120,170 L150,170 L230,300 z', '#8A7C6A', 'none', 0) + path('M120,170 L150,170 L142,186 L128,186 z', RED, 'none', 0);
  for (const [x, y, rr] of [[135, 150, 16], [150, 126, 19], [130, 102, 20]]) s += circle(x, y, rr, '#9A9C95');
  s += T(120, 30, 'Volcano', { size: 16, weight: 700 });
  s += T(120, 60, ['CO2, SO2,', 'ash'], { size: 14, fill: RED, lh: 1.2 });
  // wildfire
  for (const x of [270, 300, 330]) s += rect(x - 4, 250, 8, 50, '#6B4E2E') + path(`M${x - 18},262 L${x},200 L${x + 18},262 z`, '#3F6E3A', 'none', 0);
  s += path('M255,300 C262,270 275,262 280,240 C290,262 300,250 305,232 C315,258 330,262 345,300 z', '#F2A33A', 'none', 0);
  for (const [x, y, rr] of [[300, 182, 16], [314, 156, 19], [300, 128, 20]]) s += circle(x, y, rr, '#7E807A');
  s += T(285, 30, 'Wildfire', { size: 16, weight: 700 });
  s += T(285, 60, ['CO2, smoke', 'particles'], { size: 14, fill: RED, lh: 1.2 });
  // decomposition and respiration
  s += path('M400,300 C420,285 470,285 490,300 z', '#7A5A3A', 'none', 0) + T(445, 318, 'decomposing leaves', { size: 13 });
  s += `<ellipse cx="455" cy="262" rx="26" ry="14" fill="#A88A62"/>` + circle(482, 250, 9, '#A88A62') + rect(436, 270, 5, 18, '#A88A62') + rect(466, 270, 5, 18, '#A88A62');
  s += arrow(445, 240, 445, 190, { color: OLIVE, sw: 3, m: 'arO' });
  s += T(445, 30, 'Respiration and', { size: 16, weight: 700 });
  s += T(445, 52, 'decomposition', { size: 16, weight: 700 });
  s += T(445, 74, 'CO2', { size: 14, fill: RED });
  s += T(445, 172, 'CO2', { size: 15, weight: 700, fill: OLIVE });
  // desert dust
  s += path('M540,300 C570,260 620,262 650,300 z', '#D8B66A', 'none', 0);
  for (const [x, y] of [[585, 220], [600, 200], [620, 225], [640, 190], [610, 175], [655, 210]]) s += circle(x, y, 4, '#B58D3D');
  s += arrow(560, 240, 660, 170, { color: GREY, sw: 2.5 });
  s += T(600, 30, 'Desert dust', { size: 16, weight: 700 });
  s += T(600, 60, ['wind lifts', 'particles'], { size: 14, fill: RED, lh: 1.2 });
  // sea spray
  s += rect(690, 270, 110, 30, BLUE) + path('M690,272 C705,258 720,286 735,270 C750,256 765,286 780,270 C790,262 800,268 800,268', 'none', '#FFFFFF', 3);
  for (const [x, y] of [[715, 240], [740, 220], [765, 235], [750, 200]]) s += circle(x, y, 3.5, '#5C9CC8');
  s += T(745, 30, 'Sea spray', { size: 16, weight: 700 });
  s += T(745, 60, ['salt', 'particles'], { size: 14, fill: RED, lh: 1.2 });
  s += T(400, 365, 'Natural sources add CO2 and particles. Human sources (fuel burning, construction, plowing) add far more CO2.', { size: 14, fill: INK });
  return svg(800, 400, 'Natural sources of CO2 and particulate matter',
    'Five natural sources across a landscape. A volcano releases CO2, sulfur dioxide and ash. A wildfire releases CO2 and smoke particles. Decomposing leaves and a breathing animal release CO2. Wind lifts dust from a desert. Waves throw salt particles into the air as sea spray.', s);
};

/* 7.5 Indoor air pollutants in a home (diagram). */
FIG['indoor-air-house'] = () => {
  let s = '';
  // ground and rock
  s += rect(0, 330, 800, 130, '#C9B48E') + rect(0, 400, 800, 60, '#A39787');
  s += T(110, 430, 'uranium-bearing rock (granite)', { size: 13, fill: '#FFFFFF', weight: 700 });
  // house walls
  s += path('M150,140 L400,40 L650,140 z', '#D9CBB8', INK, 2);
  s += rect(160, 140, 480, 190, '#FFFFFF', INK, 2) + line(160, 235, 640, 235, INK, 2);
  s += rect(160, 330, 480, 60, '#EFEDE6', INK, 2);
  s += T(220, 375, 'basement', { size: 13, fill: GREY });
  // radon arrows through crack
  s += line(330, 390, 340, 380, INK, 2) + line(340, 380, 334, 372, INK, 2);
  for (const x of [300, 340, 380]) s += arrow(x, 445, x + 6, 340, { color: RED, sw: 2.5, dash: '5 4', m: 'arR' });
  s += box(20, 300, 130, 56, ['Radon', 'seeps up'], { fill: '#FCEFE6', stroke: RED, size: 14, weight: 700 });
  s += line(150, 328, 296, 380, RED, 1.5);
  // furnace
  s += rect(520, 340, 50, 46, '#9A9C95', INK, 1.5) + rect(536, 330, 14, 10, '#9A9C95');
  s += box(660, 330, 130, 56, ['Carbon monoxide', 'furnace, stove'], { fill: PALE, stroke: OLIVE, size: 13 });
  s += line(660, 358, 572, 360, OLIVE, 1.5);
  // kitchen cabinets
  s += rect(180, 250, 120, 70, '#C59B6D', INK, 1.5) + line(240, 250, 240, 320, INK, 1);
  s += box(20, 230, 130, 56, ['Formaldehyde', 'new cabinets'], { fill: PALE, stroke: OLIVE, size: 13 });
  s += line(150, 258, 180, 270, OLIVE, 1.5);
  // gas stove with flame
  s += rect(320, 270, 70, 50, '#FFFFFF', INK, 1.5) + path('M342,268 C345,256 350,262 352,250 C356,262 362,256 364,268 z', BLUE, 'none', 0);
  // wood stove upstairs
  s += rect(470, 180, 50, 50, '#3E3E3A') + rect(488, 140, 12, 40, '#3E3E3A');
  for (const [x, y] of [[500, 205], [510, 196]]) s += circle(x, y, 5, '#C9CCC2');
  s += box(660, 160, 130, 56, ['Smoke particles', 'wood stove'], { fill: PALE, stroke: OLIVE, size: 13 });
  s += line(660, 188, 522, 200, OLIVE, 1.5);
  // pipe insulation in basement
  s += rect(420, 345, 90, 12, '#E6E1CF', INK, 1);
  s += box(660, 250, 130, 56, ['Asbestos fibers', 'old pipe wrap'], { fill: PALE, stroke: OLIVE, size: 13 });
  s += line(660, 278, 512, 349, OLIVE, 1.5);
  // paint can
  s += rect(200, 196, 26, 30, '#7AA6C8', INK, 1);
  s += box(20, 160, 130, 56, ['VOCs', 'paint, cleaners'], { fill: PALE, stroke: OLIVE, size: 13 });
  s += line(150, 188, 198, 206, OLIVE, 1.5);
  s += T(400, 20, 'Tight walls keep outdoor air out, so indoor pollutants build up', { size: 15, weight: 700 });
  return svg(800, 460, 'Indoor air pollutants in a home',
    'Cutaway house. Radon seeps up from uranium-bearing rock through a crack in the basement floor. New kitchen cabinets give off formaldehyde. A furnace and gas stove can release carbon monoxide. A wood stove releases smoke particles. Old pipe insulation in the basement can release asbestos fibers. Paints and cleaners release VOCs.', s);
};

/* 7.6 Air pollution control devices matched to pollutants (diagram). */
FIG['reducing-air-pollutants-devices'] = () => {
  let s = '';
  s += T(240, 24, 'Coal power plant', { size: 17, weight: 700, fill: OLIVE });
  // boiler
  s += box(20, 60, 110, 120, ['Boiler', 'burns coal'], { fill: '#E2E0D8', stroke: INK, size: 14 });
  s += arrow(130, 120, 160, 120);
  s += box(160, 60, 140, 120, ['Electrostatic', 'precipitator', 'or baghouse'], { fill: PALE, stroke: OLIVE, size: 14, weight: 700 });
  s += T(230, 200, 'removes particles', { size: 14, fill: RED, weight: 700 });
  s += arrow(300, 120, 330, 120);
  s += box(330, 60, 120, 120, ['Scrubber', 'limestone', 'spray'], { fill: PALE, stroke: OLIVE, size: 14, weight: 700 });
  s += T(390, 200, 'removes SO2', { size: 14, fill: RED, weight: 700 });
  s += arrow(450, 120, 470, 120);
  s += rect(470, 40, 30, 140, '#C9CCC2', INK, 1.5);
  s += T(485, 30, 'stack', { size: 13, fill: GREY });
  s += T(620, 70, 'Leaves the stack:', { size: 14, weight: 700 });
  s += T(620, 118, ['CO2 (not removed)', 'some NOx', 'water vapor'], { size: 14, lh: 1.35 });
  s += line(20, 228, 780, 228, '#DADDD4', 1.5);
  // car
  s += T(200, 254, 'Car', { size: 17, weight: 700, fill: OLIVE });
  s += rect(40, 300, 140, 46, BLUE, 'none', 0, 10) + rect(68, 272, 80, 34, BLUE, 'none', 0, 10) + circle(72, 348, 14, INK) + circle(150, 348, 14, INK);
  s += line(180, 336, 220, 336, GREY, 6);
  s += box(220, 306, 150, 60, ['Catalytic', 'converter'], { fill: PALE, stroke: OLIVE, size: 14, weight: 700 });
  s += arrow(370, 336, 400, 336);
  s += T(295, 395, ['CO to CO2;  NOx to N2;', 'hydrocarbons to CO2 and water'], { size: 14, fill: RED, weight: 700, lh: 1.3 });
  // gas pump
  s += T(620, 254, 'Gas pump', { size: 17, weight: 700, fill: OLIVE });
  s += rect(520, 280, 60, 90, '#C9CCC2', INK, 1.5) + rect(530, 292, 40, 26, '#FFFFFF', INK, 1);
  s += path('M580,330 C610,330 615,300 640,300 L660,300', 'none', INK, 4);
  s += box(640, 320, 140, 50, ['Vapor recovery', 'nozzle'], { fill: PALE, stroke: OLIVE, size: 14, weight: 700 });
  s += T(650, 400, ['captures gasoline vapor (VOCs),', 'not exhaust'], { size: 14, fill: RED, weight: 700, lh: 1.3 });
  return svg(800, 440, 'Air pollution control devices',
    'Top: at a coal power plant, exhaust from the boiler passes an electrostatic precipitator or baghouse that removes particles, then a scrubber with limestone spray that removes sulfur dioxide, then the stack; CO2 is not removed. Bottom left: a car catalytic converter changes CO to CO2, NOx to nitrogen gas, and hydrocarbons to CO2 and water. Bottom right: a vapor recovery nozzle at a gas pump captures gasoline vapor, not exhaust.', s);
};

/* 7.7 How acid deposition forms and where it lands (diagram). */
FIG['acid-rain-pathway'] = () => {
  let s = rect(0, 0, 800, 300, SKY) + rect(0, 300, 800, 120, '#D7D0BC');
  // plant and car
  s += rect(30, 220, 90, 80, '#C9CCC2', INK, 1.5) + rect(95, 140, 18, 80, '#C9CCC2', INK, 1.5);
  s += rect(140, 268, 70, 24, BLUE, 'none', 0, 6) + rect(152, 252, 40, 20, BLUE, 'none', 0, 6) + circle(155, 294, 7, INK) + circle(196, 294, 7, INK);
  s += T(110, 320, 'Power plants and vehicles', { size: 14, weight: 700 });
  s += path('M104,138 C120,110 160,100 200,96', 'none', GREY, 8);
  s += box(150, 40, 150, 46, ['SO2 and NOx', 'released'], { fill: '#FFFFFF', stroke: INK, size: 14, weight: 700 });
  // wind arrow
  s += arrow(220, 120, 390, 120, { color: INK, sw: 3 });
  s += T(305, 140, 'carried by wind, often hundreds of km', { size: 13, fill: GREY });
  // cloud
  for (const [x, y, rr] of [[440, 92, 42], [500, 66, 52], [562, 92, 42], [500, 108, 44]]) s += circle(x, y, rr, '#FFFFFF', 'none', 0);
  s += T(500, 86, ['react with water and oxygen:', 'sulfuric acid', 'nitric acid'], { size: 13, lh: 1.3, fill: RED });
  // rain
  for (let k = 0; k < 9; k++) { const x = 445 + k * 14; s += line(x, 140, x - 6, 175 + (k % 3) * 8, BLUE, 2); }
  s += T(640, 160, ['acid rain, snow, fog', 'and dry particles'], { size: 13, fill: BLUE, weight: 700, lh: 1.25 });
  // forest
  for (const x of [400, 430, 460]) s += rect(x - 3, 250, 6, 50, '#6B4E2E') + path(`M${x - 15},258 L${x},210 L${x + 15},258 z`, '#5E7F4A', 'none', 0);
  s += T(430, 320, ['forest soil: nutrients', 'leached, aluminum freed'], { size: 13, lh: 1.25 });
  // lakes
  s += `<ellipse cx="590" cy="304" rx="60" ry="14" fill="#7FA9C9"/>` + `<ellipse cx="730" cy="304" rx="55" ry="14" fill="#4F8FBF"/>`;
  s += rect(530, 330, 120, 40, '#A39787') + rect(675, 330, 110, 40, '#E6DEC8');
  s += T(590, 350, 'granite', { size: 13, fill: '#FFFFFF', weight: 700 }) + T(730, 350, 'limestone', { size: 13, weight: 700 });
  s += T(590, 395, ['pH about 4.8:', 'few fish'], { size: 13, fill: RED, weight: 700, lh: 1.25 });
  s += T(730, 395, ['buffered, pH about 7:', 'many fish'], { size: 13, fill: GREEN, weight: 700, lh: 1.25 });
  return svg(800, 420, 'How acid deposition forms',
    'Power plants and vehicles release SO2 and NOx. Wind carries them, often hundreds of kilometers. In clouds they react with water and oxygen to form sulfuric and nitric acid, which fall as acid rain, snow, fog and dry particles on a forest and two lakes. Forest soil loses nutrients and releases aluminum. A lake on granite becomes acidic, about pH 4.8, with few fish; a lake on limestone is buffered near pH 7 with many fish.', s);
};

/* 7.8 Common sounds on the decibel scale. Values: CDC National Center for
   Environmental Health, "What Noises Cause Hearing Loss?" (ranges as listed). */
export const DECIBELS = [
  ['Whispering', 30, 30], ['Refrigerator', 40, 40], ['Normal conversation', 65, 80], ['Lawn mower', 80, 100],
  ['Sports event', 94, 110], ['Siren', 110, 129], ['Fireworks', 140, 160],
];
FIG['noise-pollution-decibels'] = () => {
  const W = 800, H = 480, L = 210, R = 90, Tp = 20, B = 112;
  const pw = W - L - R, ph = H - Tp - B, bh = ph / DECIBELS.length, max = 160;
  const sx = v => L + v / max * pw;
  let s = '';
  for (let v = 0; v <= max; v += 20) s += line(sx(v), Tp, sx(v), Tp + ph, '#DADDD4', 1) + T(sx(v), Tp + ph + 18, String(v), { size: 14 });
  s += line(sx(85), Tp - 6, sx(85), Tp + ph + 50, RED, 2.5, '7 5');
  DECIBELS.forEach(([name, lo, hi], i) => {
    const y = Tp + i * bh + bh * 0.2, hh = bh * 0.6, col = hi >= 85 ? RED : OLIVE;
    if (lo < hi) s += rect(L, y, sx(lo) - L, hh, col, 'none', 0) + rect(sx(lo), y, sx(hi) - sx(lo), hh, col === RED ? '#F0B48A' : SOFT, col, 1.5);
    else s += rect(L, y, sx(hi) - L, hh, col);
    s += T(L - 10, y + hh / 2, name, { size: 14, anchor: 'end' });
    s += rect(sx(hi) + 3, y + hh / 2 - 9, (lo < hi ? 64 : 24), 18, '#FFFFFF') + T(sx(hi) + 6, y + hh / 2, lo < hi ? `${lo} to ${hi}` : String(hi), { size: 13, anchor: 'start', weight: 700 });
  });
  s += T(sx(85) + 8, Tp + ph + 64, '85 dB: hearing damage over time', { size: 13, anchor: 'start', fill: RED, weight: 700 });
  s += line(L, Tp, L, Tp + ph, INK, 2) + line(L, Tp + ph, L + pw, Tp + ph, INK, 2);
  s += T(L + pw / 2 - 120, Tp + ph + 44, 'Sound level (decibels, dB)', { size: 15, weight: 700 });
  s += T(W / 2, H - 16, 'Values from the CDC. The light part of a bar is the range. Each 10 dB is 10 times the intensity.', { size: 13, fill: GREY, italic: true });
  return svg(W, H, 'Common sounds in decibels',
    'Horizontal bar chart of sound levels from the CDC: whispering 30 dB, refrigerator 40, normal conversation 65 to 80, lawn mower 80 to 100, sports event 94 to 110, siren 110 to 129, fireworks 140 to 160. A dashed line at 85 dB marks where hearing damage can begin over time.', s);
};

/* 8.1 Point and nonpoint sources along a river (diagram). */
FIG['pollution-sources-point-nonpoint'] = () => {
  let s = rect(0, 0, 800, 420, '#EEF1E2');
  // river
  s += path('M0,250 C150,220 250,290 400,250 C550,210 650,280 800,240 L800,290 C650,330 550,260 400,300 C250,340 150,270 0,300 z', '#7FB3D9', 'none', 0);
  s += T(560, 290, 'river', { size: 14, fill: '#FFFFFF', weight: 700, italic: true });
  // fields (top-left)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) s += rect(30 + i * 52, 60 + j * 52, 46, 46, j % 2 ? '#CFD39A' : '#B9C27A');
  s += T(130, 46, 'Crop fields', { size: 14, weight: 700 });
  // suburb (top-middle)
  for (let i = 0; i < 4; i++) s += rect(300 + i * 52, 110, 30, 24, '#E2D6C2', INK, 1) + path(`M${296 + i * 52},110 L${315 + i * 52},94 L${334 + i * 52},110 z`, '#B28A6A', 'none', 0) + rect(296 + i * 52, 134, 40, 18, '#9CC37A');
  s += T(395, 72, 'Lawns and streets', { size: 14, weight: 700 });
  // construction
  s += rect(560, 100, 90, 60, '#C9A97A') + T(605, 72, 'Construction site', { size: 14, weight: 700 });
  // nonpoint arrows (many small)
  for (const x of [50, 100, 150, 200, 320, 370, 420, 470, 575, 625]) s += arrow(x, 175, x + 6, 225, { color: GREEN, sw: 2.5 });
  s += rect(205, 10, 0, 0, 'none') + T(400, 16, 'nonpoint: runoff from everywhere along the river', { size: 15, fill: GREEN, weight: 700 });
  // point sources (bottom)
  s += rect(120, 340, 90, 50, '#C9CCC2', INK, 1.5) + T(165, 404, 'Factory pipe', { size: 14, weight: 700 });
  s += line(165, 340, 165, 300, INK, 5) + circle(165, 296, 9, RED);
  s += rect(380, 350, 110, 40, '#C9CCC2', INK, 1.5) + T(435, 404, 'Sewage plant outfall', { size: 14, weight: 700 });
  s += line(435, 350, 435, 306, INK, 5) + circle(435, 302, 9, RED);
  s += rect(640, 330, 60, 60, '#C9CCC2', INK, 1.5) + rect(680, 200, 14, 130, '#C9CCC2', INK, 1.5) + T(670, 404, 'Smokestack', { size: 14, weight: 700 });
  s += circle(687, 190, 9, RED);
  s += T(560, 370, ['point: one', 'place each'], { size: 14, fill: RED, weight: 700 });
  return svg(800, 420, 'Point and nonpoint sources',
    'A river runs across the picture. Above it, crop fields, a suburb with lawns and streets, and a construction site send many small runoff arrows into the river along its whole length: nonpoint sources. Below it, a factory pipe, a sewage plant outfall and a smokestack each enter at one marked spot: point sources.', s);
};

/* 8.2 Stream invertebrates by pollution tolerance (diagram). */
FIG['human-impacts-ecosystems-indicators'] = () => {
  let s = '';
  const groups = [
    ['Pollution-sensitive', ['mayfly larvae', 'stonefly larvae', 'caddisfly larvae'], GREEN, 3],
    ['Somewhat tolerant', ['dragonfly larvae', 'crayfish', 'scuds'], '#B58D3D', 2],
    ['Pollution-tolerant', ['midge larvae', 'aquatic worms', 'leeches'], RED, 0],
  ];
  groups.forEach(([title, names, col, tails], i) => {
    const x0 = 20 + i * 260;
    s += box(x0, 40, 240, 270, null, { fill: '#FFFFFF', stroke: col, sw: 2.5 });
    s += T(x0 + 120, 66, title, { size: 17, weight: 700, fill: col });
    names.forEach((n, j) => { s += circle(x0 + 40, 115 + j * 70, 11, col) + T(x0 + 64, 115 + j * 70, n, { size: 16, anchor: 'start' }); });
  });
  // scale arrow
  s += `<defs><linearGradient id="gq" x1="0" x2="1"><stop offset="0" stop-color="${GREEN}"/><stop offset="0.5" stop-color="#E0C35A"/><stop offset="1" stop-color="${RED}"/></linearGradient></defs>`;
  s += rect(20, 330, 760, 16, 'url(#gq)', 'none', 0, 8);
  s += T(20, 368, 'Clean, oxygen-rich water', { size: 14, weight: 700, anchor: 'start', fill: GREEN });
  s += T(780, 368, 'Polluted, low-oxygen water', { size: 14, weight: 700, anchor: 'end', fill: RED });
  s += T(400, 390, 'Many sensitive species = healthy stream; only tolerant species = polluted stream', { size: 13, fill: GREY, italic: true });
  return svg(800, 400, 'Stream insects as indicator species',
    'Three groups of stream invertebrates along a scale from clean to polluted water. Pollution-sensitive: mayfly, stonefly and caddisfly larvae. Somewhat tolerant: dragonfly larvae, crayfish and scuds. Pollution-tolerant: midge larvae, aquatic worms and leeches. Many sensitive species mean a healthy stream; only tolerant species mean a polluted one.', s);
};

/* 8.3 Hormone, mimic and blocker at a receptor (diagram). */
FIG['endocrine-disruptors-receptor'] = () => {
  let s = '';
  // receptor: a cup with a V-shaped notch on top of the cell
  const receptor = x => path(`M${x - 50},250 L${x - 50},180 L${x - 22},180 L${x},212 L${x + 22},180 L${x + 50},180 L${x + 50},250 z`, '#DCE6C8', OLIVE, 2.5);
  // ligand: a pointed key fits the notch (seated) ; a flat block sits on top (blocker)
  const pointed = (x, y, col) => path(`M${x - 22},${y - 34} L${x + 22},${y - 34} L${x + 22},${y - 32} L${x},${y} L${x - 22},${y - 32} z`, col, INK, 1.5);
  const flatBlock = (x, y, col) => path(`M${x - 24},${y - 30} L${x + 24},${y - 30} L${x + 24},${y} L${x},${y + 30} L${x - 24},${y} z`, col, INK, 1.5);
  const panels = [
    ['Natural hormone', ['fits the receptor and', 'sends the normal signal'], BLUE, 'hormone', GREEN, 'signal ON'],
    ['Mimic', ['a look-alike chemical fits', 'and sends a false signal'], RED, 'mimic', RED, 'false signal ON'],
    ['Blocker', ['sits in the receptor;', 'the hormone cannot bind'], '#7A4F9E', 'blocker', GREY, 'no signal'],
  ];
  panels.forEach(([title, lines, col, kind, sigCol, sig], i) => {
    const x = 140 + i * 260;
    s += T(x, 28, title, { size: 18, weight: 700, fill: col });
    s += T(x, 62, lines, { size: 14, lh: 1.25 });
    s += rect(x - 110, 250, 220, 56, '#F4F5EC', OLIVE, 1.5) + T(x, 288, 'target cell', { size: 13, fill: GREY });
    s += receptor(x);
    s += T(x - 78, 196, 'receptor', { size: 12, fill: OLIVE, anchor: 'end' }) + line(x - 76, 196, x - 52, 200, OLIVE, 1);
    if (kind === 'blocker') {
      s += flatBlock(x, 182, col);
      s += pointed(x + 76, 140, BLUE) + T(x + 76, 92, 'hormone', { size: 12, fill: BLUE });
      s += line(x + 58, 112, x + 94, 142, RED, 3) + line(x + 94, 112, x + 58, 142, RED, 3);
    } else s += pointed(x, 212, col);
    s += arrow(x, 310, x, 336, { color: sigCol, sw: 3, m: kind === 'blocker' ? 'ar' : 'arO' });
    s += T(x, 350, sig, { size: 14, weight: 700, fill: sigCol });
  });
  return svg(800, 360, 'How endocrine disruptors act at a receptor',
    'Three panels with a receptor on a target cell. Left: the natural hormone fits the receptor and turns on the normal signal. Middle: a mimic chemical with a similar shape fits and turns on a false signal. Right: a blocker sits in the receptor so the natural hormone cannot bind, and no signal is sent.', s);
};

/* 8.4 Ecosystem services of wetlands and mangroves (diagram). */
FIG['wetlands-mangroves-services'] = () => {
  let s = rect(0, 0, 800, 420, '#F4F6EC');
  // land, marsh, coast, sea
  s += rect(0, 220, 520, 200, '#D9D0B5') + rect(520, 220, 280, 200, '#5C9CC8');
  s += path('M0,240 C80,232 160,252 240,240 C320,228 400,250 520,238 L520,262 C400,272 320,252 240,264 C160,276 80,256 0,264 z', '#7FB3D9', 'none', 0);
  // marsh grass
  for (let x = 160; x < 420; x += 16) s += line(x, 240, x - 4, 212, '#6B8E3A', 2.5) + line(x + 5, 240, x + 8, 216, '#6B8E3A', 2.5);
  s += T(290, 196, 'Freshwater marsh', { size: 15, weight: 700, fill: OLIVE });
  // groundwater arrow
  s += arrow(290, 270, 290, 340, { color: BLUE, sw: 3, m: 'arB' });
  s += T(290, 360, ['recharges', 'groundwater'], { size: 13, fill: BLUE, weight: 700, lh: 1.2 });
  // mangroves at coast
  for (let x = 530; x < 660; x += 26) {
    s += rect(x + 9, 170, 6, 50, '#6B4E2E') + circle(x + 12, 160, 18, '#4F7A3A');
    for (const dx of [-8, 0, 8]) s += path(`M${x + 12},${200} C${x + 12 + dx},${215} ${x + 12 + dx * 1.6},${225} ${x + 12 + dx * 2},${240}`, 'none', '#6B4E2E', 2);
  }
  s += T(600, 124, 'Mangroves', { size: 15, weight: 700, fill: OLIVE });
  // waves
  for (const y of [270, 300, 330]) s += path(`M690,${y} C705,${y - 8} 720,${y + 8} 735,${y} C750,${y - 8} 765,${y + 8} 780,${y}`, 'none', '#FFFFFF', 3);
  s += arrow(780, 350, 690, 330, { color: '#FFFFFF', sw: 3 });
  s += T(720, 392, ['roots slow waves', 'and storm surge'], { size: 13, fill: '#FFFFFF', weight: 700, lh: 1.2 });
  // labels for marsh services
  const tag = (x, y, lines) => box(x, y, 150, 52, lines, { fill: '#FFFFFF', stroke: OLIVE, size: 13 });
  s += tag(20, 30, ['stores floodwater,', 'releases it slowly']);
  s += tag(190, 30, ['filters sediment', 'and pollutants']);
  s += tag(360, 30, ['soils store carbon', '(slow decay)']);
  s += tag(20, 120, ['habitat for ducks', 'and herons']);
  s += `<ellipse cx="622" cy="252" rx="10" ry="4" fill="#E0C35A"/>` + `<ellipse cx="600" cy="262" rx="10" ry="4" fill="#E0C35A"/>`;
  s += tag(620, 30, ['nursery for', 'young fish']);
  s += line(170, 160, 210, 210, OLIVE, 1.2) + line(265, 82, 265, 178, OLIVE, 1.2) + line(435, 82, 380, 206, OLIVE, 1.2) + line(165, 82, 185, 210, OLIVE, 1.2) + line(695, 82, 615, 246, OLIVE, 1.2);
  s += T(80, 300, 'river', { size: 13, fill: BLUE, italic: true, weight: 700 });
  return svg(800, 420, 'Ecosystem services of wetlands and mangroves',
    'A river flows through a freshwater marsh to a coast lined with mangroves. Labels show the services: the marsh stores floodwater and releases it slowly, filters sediment and pollutants, stores carbon in slowly decaying soils, recharges groundwater, and gives habitat to ducks and herons. At the coast, mangrove roots slow waves and storm surge, and the mangroves are a nursery for young fish.', s);
};

/* 8.5 The eutrophication chain (diagram). */
FIG['eutrophication-chain'] = () => {
  let s = '';
  const steps = [
    ['1. Nutrients enter', ['nitrate and phosphate', 'from fertilizer, manure,', 'sewage']],
    ['2. Algal bloom', ['algae multiply and', 'turn the water green']],
    ['3. Die-off', ['bloom blocks light;', 'algae and plants die']],
    ['4. Decomposition', ['dead matter sinks;', 'decomposers break', 'it down']],
    ['5. Oxygen falls', ['decomposers use', 'dissolved oxygen', '(hypoxia)']],
    ['6. Fish kill', ['fish die or leave;', 'a dead zone']],
  ];
  const W = 230, H = 150, gx = 35, gy = 60;
  steps.forEach(([title, lines], i) => {
    const row = Math.floor(i / 3), col = row === 0 ? i : 5 - i;
    const x = 20 + col * (W + gx), y = 30 + row * (H + gy);
    const fill = i === 4 || i === 5 ? '#FCEFE6' : PALE, stroke = i === 4 || i === 5 ? RED : OLIVE;
    s += box(x, y, W, H, null, { fill, stroke, sw: 2.5 });
    s += T(x + W / 2, y + 28, title, { size: 17, weight: 700, fill: stroke });
    s += T(x + W / 2, y + 90, lines, { size: 15, lh: 1.3 });
    if (i < 2) s += arrow(x + W + 4, y + H / 2, x + W + gx - 4, y + H / 2, { sw: 3 });
    if (i === 2) s += arrow(x + W / 2, y + H + 4, x + W / 2, y + H + gy - 4, { sw: 3 });
    if (i === 3 || i === 4) s += arrow(x - 4, y + H / 2, x - gx + 4, y + H / 2, { sw: 3 });
  });
  s += T(400, 428, 'The step most often left out: decomposition of the dead algae uses up the oxygen.', { size: 14, fill: GREY, italic: true });
  return svg(800, 440, 'The eutrophication chain',
    'Six linked boxes in a loop. 1: nitrate and phosphate from fertilizer, manure and sewage enter the water. 2: algae multiply into a bloom and turn the water green. 3: the bloom blocks light and algae and plants die. 4: dead matter sinks and decomposers break it down. 5: decomposers use dissolved oxygen, so oxygen falls (hypoxia). 6: fish die or leave, making a dead zone.', s);
};

/* 8.6 A power plant's cooling water and a cooling tower (diagram). */
FIG['thermal-pollution-plant'] = () => {
  let s = rect(0, 0, 800, 400, '#F4F6EC');
  // river along the bottom, warm plume
  s += rect(0, 290, 800, 110, '#7FB3D9');
  s += `<defs><linearGradient id="plume" x1="0" x2="1"><stop offset="0" stop-color="#E8885A"/><stop offset="1" stop-color="#7FB3D9"/></linearGradient></defs>`;
  s += path('M330,292 C420,300 560,330 800,340 L800,372 C560,368 420,336 330,320 z', 'url(#plume)', 'none', 0);
  s += T(80, 360, 'cool river water', { size: 14, fill: '#FFFFFF', weight: 700 });
  s += T(620, 392, 'warm plume: less dissolved oxygen', { size: 14, fill: '#FFFFFF', weight: 700 });
  s += arrow(30, 320, 140, 320, { color: '#FFFFFF', sw: 3 });
  // plant building
  s += rect(140, 150, 180, 110, '#C9CCC2', INK, 1.5) + rect(285, 70, 22, 80, '#C9CCC2', INK, 1.5);
  s += T(230, 180, 'Power plant', { size: 15, weight: 700 });
  s += T(230, 206, ['steam is cooled', 'back to water'], { size: 13, lh: 1.25 });
  // intake and outlet pipes
  s += path('M170,262 L170,300', 'none', BLUE, 7) + T(120, 278, 'intake', { size: 13, fill: BLUE, weight: 700 });
  s += path('M300,262 L300,296 L330,300', 'none', RED, 7) + T(352, 270, 'warm outlet', { size: 13, fill: RED, weight: 700, anchor: 'start' });
  // cooling tower option
  s += path('M560,250 C575,190 575,150 555,90 L665,90 C645,150 645,190 660,250 z', '#E2E0D8', INK, 1.5);
  for (const [x, y, rr] of [[590, 70, 18], [615, 55, 22], [640, 72, 18], [612, 36, 16]]) s += circle(x, y, rr, '#FFFFFF', '#B9C0C6', 1);
  s += T(700, 40, ['heat and water', 'vapor to the air'], { size: 13, lh: 1.2, anchor: 'start' });
  s += T(610, 275, 'Cooling tower', { size: 15, weight: 700 });
  s += path('M320,210 L555,210', 'none', RED, 3, ) + arrow(470, 210, 556, 210, { color: RED, sw: 3, m: 'arR' });
  s += T(440, 195, 'or: send warm water here', { size: 13, fill: RED });
  return svg(800, 400, 'Thermal pollution from a power plant',
    'A power plant pumps in cool river water to condense its steam and returns it warmer through an outlet; a warm plume with less dissolved oxygen spreads downstream. Alternatively, the warm water goes to a cooling tower, which releases the heat and some water vapor to the air.', s);
};

/* 8.7 Long-range transport of POPs toward the poles (diagram). */
FIG['persistent-organic-pollutants-transport'] = () => {
  let s = `<defs><linearGradient id="popsky" x1="0" x2="1"><stop offset="0" stop-color="#FBE3D2"/><stop offset="1" stop-color="#DCEBF6"/></linearGradient></defs>`;
  s += rect(0, 0, 800, 300, 'url(#popsky)') + rect(0, 300, 560, 100, '#D7CFA8') + rect(560, 300, 240, 100, '#E9F1F7');
  s += T(110, 30, 'Warm regions', { size: 16, weight: 700, fill: RED }) + T(700, 30, 'Cold Arctic', { size: 16, weight: 700, fill: BLUE });
  // field and factory
  for (let i = 0; i < 4; i++) s += rect(30 + i * 34, 278, 30, 22, '#B9C27A');
  s += rect(170, 250, 60, 50, '#C9CCC2', INK, 1) + rect(210, 220, 12, 30, '#C9CCC2', INK, 1);
  s += T(130, 325, 'used on fields, released by industry', { size: 13 });
  // hops
  const hops = [[120, 270], [250, 140], [330, 270], [430, 140], [500, 270], [600, 150], [660, 290]];
  for (let i = 0; i < hops.length - 1; i++) {
    const [x1, y1] = hops[i], [x2, y2] = hops[i + 1];
    s += arrow(x1, y1, x2, y2, { color: i % 2 ? BLUE : RED, sw: 2.5, dash: '6 4', m: i % 2 ? 'arB' : 'arR' });
  }
  s += T(250, 122, 'evaporates where warm', { size: 13, fill: RED, weight: 700 });
  s += T(430, 122, 'travels on the wind', { size: 13, fill: INK, weight: 700 });
  s += T(520, 292, 'condenses where cool', { size: 13, fill: BLUE, weight: 700 });
  // arctic ice, seal, bear
  s += rect(600, 300, 200, 18, '#FFFFFF', '#B9C0C6', 1);
  s += `<ellipse cx="660" cy="292" rx="26" ry="10" fill="#7E807A"/>` + circle(686, 286, 7, '#7E807A');
  s += `<ellipse cx="745" cy="280" rx="34" ry="18" fill="#F2F2EC" stroke="#B9C0C6"/>` + circle(778, 268, 11, '#F2F2EC', '#B9C0C6', 1);
  s += T(700, 345, ['stored in the fat of', 'seals and polar bears'], { size: 13, weight: 700, fill: OLIVE, lh: 1.25 });
  s += T(400, 385, 'POPs collect in cold regions far from where they were used.', { size: 14, fill: GREY, italic: true });
  return svg(800, 400, 'Persistent organic pollutants travel toward the poles',
    'From warm regions on the left, where POPs are used on fields and released by industry, the chemicals evaporate, travel on the wind, condense where it is cooler and evaporate again, hopping toward the cold Arctic on the right. There they settle and are stored in the fat of seals and polar bears.', s);
};

/* 8.8 Biomagnification up a lake food chain, and bioaccumulation in one fish
   (diagram; the concentrations are the invented values of the set in
   data/questions/bioaccumulation-biomagnification.json). */
FIG['bioaccumulation-biomagnification-chain'] = () => {
  let s = '';
  const lv = [['Lake water', '0.00005 ppm', 1], ['Phytoplankton', '0.04 ppm', 3], ['Zooplankton', '0.3 ppm', 6], ['Small fish', '2 ppm', 11], ['Large fish', '12 ppm', 18], ['Osprey', '50 ppm', 28]];
  s += T(250, 22, 'Biomagnification: up the food chain', { size: 17, weight: 700, fill: OLIVE });
  lv.forEach(([name, ppm, dots], i) => {
    const y = 380 - i * 58, w = 260 - i * 18, x = 270 - w / 2;
    s += rect(x, y - 22, w, 44, i === 5 ? '#FCEFE6' : PALE, i === 5 ? RED : OLIVE, 2, 8);
    s += T(x - 12, y, name, { size: 14, anchor: 'end', weight: 700 });
    s += T(x + w + 12, y, ppm, { size: 14, anchor: 'start', weight: 700, fill: i === 5 ? RED : INK });
    const per = Math.max(2, Math.floor((w - 20) / 12)); for (let k = 0; k < dots; k++) s += circle(x + 10 + (k % per) * 12, y - 12 + Math.floor(k / per) * 10, 3.2, RED);
    if (i < 5) s += arrow(270, y - 24, 270, y - 32, { sw: 2 });
  });
  s += T(250, 418, 'Each level eats many of the level below and keeps their pesticide.', { size: 13, fill: GREY, italic: true });
  // bioaccumulation panel
  s += line(500, 40, 500, 420, '#DADDD4', 1.5);
  s += T(650, 22, 'Bioaccumulation: in one fish', { size: 17, weight: 700, fill: BLUE });
  [[2, 0.08, 40], [6, 0.31, 60], [10, 0.62, 80]].forEach(([age, hg, len], i) => {
    const y = 110 + i * 100, x = 640;
    s += `<ellipse cx="${x}" cy="${y}" rx="${len / 2 + 10}" ry="${len / 6 + 6}" fill="#9FC2DA" stroke="${BLUE}" stroke-width="1.5"/>`;
    s += path(`M${x + len / 2 + 8},${y} L${x + len / 2 + 26},${y - 12} L${x + len / 2 + 26},${y + 12} z`, '#9FC2DA', BLUE, 1.5);
    s += T(x - len / 2 - 20, y, `${age} yr`, { size: 14, anchor: 'end', weight: 700 });
    s += T(x, y + len / 6 + 22, `mercury ${hg} ppm`, { size: 13, fill: BLUE, weight: 700 });
  });
  s += T(650, 418, 'Older fish have had longer to store it.', { size: 13, fill: GREY, italic: true });
  return svg(800, 440, 'Bioaccumulation and biomagnification',
    'Left: a food chain from lake water to phytoplankton, zooplankton, small fish, large fish and an osprey; the pesticide concentration rises from 0.00005 ppm in water to 0.04, 0.3, 2, 12 and 50 ppm in the osprey (invented values), shown by more dots at each level. Right: one species of fish at ages 2, 6 and 10 years, with mercury rising from 0.08 to 0.31 to 0.62 ppm as it ages.', s);
};

/* 8.9 Cross-section of a sanitary landfill (diagram). */
FIG['solid-waste-landfill'] = () => {
  let s = rect(0, 0, 800, 420, '#F4F6EC');
  // groundwater
  s += rect(0, 360, 800, 60, '#9FC2DA') + T(400, 398, 'groundwater', { size: 14, fill: '#FFFFFF', weight: 700, italic: true });
  // liner
  s += path('M100,330 L700,330 L640,150 L160,150 z', 'none', 'none', 0);
  s += path('M80,340 L720,340 L720,352 L80,352 z', '#B08A5A', 'none', 0);
  s += path('M80,334 L720,334', 'none', INK, 4);
  // trash layers
  for (let i = 0; i < 4; i++) {
    const y = 300 - i * 40;
    s += rect(130 + i * 20, y, 540 - i * 40, 28, ['#B7B09A', '#A79F86', '#B7B09A', '#A79F86'][i]);
    s += rect(130 + i * 20, y - 6, 540 - i * 40, 6, '#8C7A5A');
  }
  // cap
  s += path('M190,170 C300,120 500,120 610,170 L610,176 L190,176 z', '#8C7A5A', 'none', 0);
  s += path('M190,170 C300,120 500,120 610,170', 'none', '#6B8E3A', 6);
  // leachate pipes
  for (const x of [200, 330, 460, 590]) s += circle(x, 326, 6, '#FFFFFF', INK, 2);
  s += line(200, 326, 740, 326, INK, 1, '3 3') + arrow(720, 326, 760, 326, { color: BLUE, sw: 3, m: 'arB' });
  // gas wells
  for (const x of [300, 500]) s += rect(x - 4, 90, 8, 220, '#6B7370') + path(`M${x},90 L${x},70`, 'none', '#6B7370', 4);
  s += path('M500,70 L620,70', 'none', '#6B7370', 4) + path('M300,70 L500,70', 'none', '#6B7370', 4);
  s += box(620, 50, 160, 40, ['methane to flare', 'or generator'], { fill: '#FFFFFF', stroke: OLIVE, size: 13 });
  // labels
  const lab = (x, y, t, tx, ty) => line(x, y, tx, ty, OLIVE, 1.2) + T(tx, ty - 9, t, { size: 13, anchor: 'start', weight: 700 });
  s += lab(240, 150, 'clay and soil cap with plants', 14, 110);
  s += lab(160, 270, 'trash in layers', 14, 250);
  s += lab(175, 252, 'daily soil cover', 14, 205);
  s += lab(300, 160, 'gas well', 334, 128);
  s += lab(100, 336, 'clay and plastic liner', 14, 300);
  s += T(700, 300, ['leachate pipes', 'to treatment'], { size: 13, weight: 700, fill: BLUE, lh: 1.2 });
  return svg(800, 420, 'A sanitary landfill',
    'Cross-section of a sanitary landfill. A compacted clay layer and plastic liner sit above groundwater, with perforated pipes collecting leachate and sending it to treatment. Trash is placed in layers separated by daily soil cover. Vertical gas wells collect methane and pipe it to a flare or generator. A clay and soil cap planted with grass covers the top.', s);
};

/* 8.10 The waste hierarchy (diagram). */
FIG['waste-reduction-hierarchy'] = () => {
  let s = '';
  const bands = [
    ['Reduce', ['less packaging, durable', 'goods, buy what you need'], GREEN],
    ['Reuse', ['refillable bottles, cloth', 'bags, repair, donate'], '#4FA06A'],
    ['Recycle and compost', ['aluminum cans, paper;', 'food and yard scraps'], '#9A8A2A'],
    ['Recover energy', ['waste-to-energy plants,', 'landfill gas to power'], '#C9762A'],
    ['Dispose', ['sanitary landfill'], RED],
  ];
  bands.forEach(([name, ex, col], i) => {
    const y = 30 + i * 74, w = 460 - i * 72, x = 300 - w / 2;
    s += path(`M${x},${y} L${x + w},${y} L${x + w - 45},${y + 64} L${x + 45},${y + 64} z`, col, 'none', 0);
    s += T(x + w / 2, y + 32, name, { size: 18, weight: 700, fill: '#FFFFFF' });
    s += T(560, y + 32, ex, { size: 14, anchor: 'start', fill: INK, lh: 1.3 });
  });
  s += arrow(14, 40, 14, 380, { sw: 3 });
  s += `<text x="34" y="210" font-size="14" font-weight="700" fill="${INK}" text-anchor="middle" transform="rotate(-90 34 210)">most preferred to least preferred</text>`;
  return svg(800, 420, 'The waste hierarchy',
    'An inverted pyramid of five bands, most preferred at the top: reduce (less packaging, durable goods), reuse (refillable bottles, cloth bags, repair), recycle and compost (aluminum cans, paper, food and yard scraps), recover energy (waste-to-energy plants, landfill gas), and dispose (sanitary landfill) at the bottom.', s);
};

/* 8.11 The stages of a sewage treatment plant (diagram). */
FIG['sewage-treatment-stages'] = () => {
  let s = '';
  const st = [
    ['Screens and', 'grit chamber', 'remove debris and sand', '#E2E0D8', INK],
    ['Primary', 'settling tank', 'solids sink as sludge', PALE, OLIVE],
    ['Secondary', 'aeration tank', 'microbes eat organic matter', '#E5F1E8', GREEN],
    ['Tertiary', 'filters', 'remove N and P', '#E8F2F9', BLUE],
    ['Disinfection', 'chlorine or UV', 'kills germs', '#FCEFE6', RED],
  ];
  const W = 130, gap = 24, y = 90, H = 120;
  s += T(30, 60, ['raw', 'sewage'], { size: 13, weight: 700, lh: 1.2 });
  s += arrow(10, y + H / 2, 22, y + H / 2, { sw: 3 });
  st.forEach(([a, b, c, fill, col], i) => {
    const x = 24 + i * (W + gap);
    s += box(x, y, W, H, null, { fill, stroke: col, sw: 2.5 });
    s += T(x + W / 2, y + 26, a, { size: 15, weight: 700, fill: col });
    s += T(x + W / 2, y + 46, b, { size: 14, weight: 700, fill: col });
    s += T(x + W / 2, y + 86, c.length > 18 ? [c.split(' ').slice(0, 2).join(' '), c.split(' ').slice(2).join(' ')] : c, { size: 13, lh: 1.25 });
    if (i < 4) s += arrow(x + W + 2, y + H / 2, x + W + gap - 2, y + H / 2, { sw: 3 });
  });
  s += arrow(24 + 4 * (W + gap) + W / 2, y + H + 4, 24 + 4 * (W + gap) + W / 2, y + H + 46, { sw: 3, color: BLUE, m: 'arB' });
  s += T(24 + 4 * (W + gap) + W / 2, y + H + 66, ['clean water', 'to the river'], { size: 13, weight: 700, fill: BLUE, lh: 1.2 });
  // sludge path
  for (const i of [1, 2]) { const x = 24 + i * (W + gap) + W / 2; s += line(x, y + H, x, 290, '#8C7A5A', 3, '6 4'); }
  s += line(24 + 1 * (W + gap) + W / 2, 290, 24 + 2 * (W + gap) + W / 2, 290, '#8C7A5A', 3, '6 4');
  s += arrow(24 + 1.5 * (W + gap) + W / 2, 290, 24 + 1.5 * (W + gap) + W / 2, 312, { color: '#8C7A5A', sw: 3 });
  s += box(140, 314, 260, 64, ['Sludge digester: methane for energy;', 'solids landfilled, burned or used', 'as fertilizer'], { fill: '#F3EDE2', stroke: '#8C7A5A', size: 13 });
  s += T(160, 30, 'physical', { size: 13, fill: GREY, italic: true }) + T(330, 30, 'biological', { size: 13, fill: GREY, italic: true }) + T(560, 30, 'nutrients and germs', { size: 13, fill: GREY, italic: true });
  return svg(800, 400, 'Stages of sewage treatment',
    'Flow diagram from left to right: raw sewage enters screens and a grit chamber that remove debris and sand; a primary settling tank where solids sink as sludge; a secondary aeration tank where microbes eat organic matter; tertiary filters that remove nitrogen and phosphorus; and disinfection with chlorine or UV that kills germs, after which clean water goes to the river. Sludge from the primary and secondary tanks goes to a digester that makes methane for energy; the solids are landfilled, burned or used as fertilizer.', s);
};

export { FIG };
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  mkdirSync(OUT, { recursive: true });
  const want = process.argv.slice(2);
  for (const [id, f] of Object.entries(FIG)) if (!want.length || want.includes(id)) { writeFileSync(join(OUT, `${id}.svg`), f()); console.log(`wrote environmental-science/figures/${id}.svg`); }
}
