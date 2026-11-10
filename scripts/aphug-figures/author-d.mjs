/* Author D's figures for AP® Human Geography Unit 4 (Political Patterns and
   Processes): LevlPrep original SVG diagrams, drawn from code so they stay
   small, legible and easy to fix.

     node scripts/aphug-figures/author-d.mjs          write the SVGs and the figure entries
     node scripts/aphug-figures/author-d.mjs --check  exit 1 if a written file is out of date

   Writes human-geography/figures/<id>.svg and human-geography/data/figures/<topic>.json
   for the Unit 4 topics only. Every figure is narrow (480 wide) with text of
   14 px or more, so it stays readable when a phone shows it about 340 px wide.
   Colors: ink #1F2A28, course teal #094953 on #E1F1F4, vermillion #C24E00,
   green #009E73, purple #7A4F9E (the course's plot colors, safe for color
   blindness); meaning is never carried by color alone. */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'human-geography', 'figures');
const DATA = join(ROOT, 'human-geography', 'data', 'figures');
const INK = '#1F2A28', TEAL = '#094953', TINT = '#E1F1F4', VER = '#C24E00', GRN = '#009E73', PUR = '#7A4F9E', GREY = '#6B7774', SEA = '#D6EAF0';
const W = 480;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Arial is about 0.53 em per character on average; wrap to a width.
function wrap(text, width, size) {
  const max = Math.floor(width / (size * 0.53));
  const out = []; let line = '';
  for (const w of String(text).split(' ')) {
    if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}
function text(x, y, s, { size = 15, weight = 400, fill = INK, anchor = 'start', width = null, lh = 1.25 } = {}) {
  const lines = width ? wrap(s, width, size) : [s];
  return lines.map((l, i) => `<text x="${x}" y="${(y + i * size * lh).toFixed(1)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(l)}</text>`).join('');
}
const lines = (s, width, size) => (width ? wrap(s, width, size) : [s]).length;
const rect = (x, y, w, h, { fill = 'none', stroke = INK, sw = 2, rx = 6, dash = '' } = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, { stroke = INK, sw = 2, dash = '', marker = '' } = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}${marker ? ` marker-end="url(#${marker})"` : ''}/>`;
const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#FFFFFF" stroke-width="1"/>`;
const tri = (x, y, s, fill) => `<path d="M${x},${y - s} L${x + s},${y + s * 0.8} L${x - s},${y + s * 0.8} z" fill="${fill}" stroke="#FFFFFF" stroke-width="1"/>`;
const sq = (x, y, s, fill) => `<rect x="${x - s}" y="${y - s}" width="${2 * s}" height="${2 * s}" fill="${fill}" stroke="#FFFFFF" stroke-width="1"/>`;
function arrowDefs(id, colors) {
  return `<defs>${Object.entries(colors).map(([k, c]) => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}</defs>`;
}
function svg(id, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="Arial, Helvetica, sans-serif">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<rect width="${W}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}

const figs = []; // { topic, id, h, title, alt, body }

/* 4.1 Four ways nations and states fit together. */
{
  const id = 'political-intro-nations';
  const rows = [
    { t: 'Nation-state', d: 'One nation fills one state.', ex: 'Close to one: Iceland', draw: (x, y) => rect(x, y, 140, 80, { fill: TINT, stroke: TEAL }) + [[25, 25], [60, 20], [100, 28], [40, 55], [80, 58], [115, 52]].map(([a, b]) => dot(x + a, y + b, 8, TEAL)).join('') },
    { t: 'Multinational state', d: 'Several nations share one state.', ex: 'Example: Nigeria', draw: (x, y) => rect(x, y, 140, 80, { fill: TINT, stroke: TEAL }) + dot(x + 25, y + 25, 8, TEAL) + dot(x + 50, y + 55, 8, TEAL) + tri(x + 75, y + 26, 9, VER) + tri(x + 95, y + 56, 9, VER) + sq(x + 118, y + 26, 8, GRN) + sq(x + 120, y + 56, 8, GRN) },
    { t: 'Multistate nation', d: 'One nation lives in two or more states.', ex: 'Example: Koreans', draw: (x, y) => rect(x, y, 64, 80, { fill: TINT, stroke: TEAL }) + rect(x + 76, y, 64, 80, { fill: TINT, stroke: TEAL }) + [[20, 25], [44, 55], [96, 25], [120, 55]].map(([a, b]) => tri(x + a, y + b, 9, VER)).join('') },
    { t: 'Stateless nation', d: 'A nation with no state of its own, spread across others.', ex: 'Example: Kurds', draw: (x, y) => rect(x, y, 44, 80, { stroke: GREY }) + rect(x + 48, y, 44, 80, { stroke: GREY }) + rect(x + 96, y, 44, 80, { stroke: GREY }) + [[22, 50], [70, 50], [118, 50]].map(([a, b]) => sq(x + a, y + b, 8, PUR)).join('') + [[22, 20], [70, 20], [118, 20]].map(([a, b]) => dot(x + a, y + b, 7, GREY)).join('') },
  ];
  let body = text(20, 30, 'Each box is a state. Each shape and color is one nation.', { size: 15, weight: 700 });
  rows.forEach((r, i) => {
    const y = 50 + i * 112;
    body += r.draw(20, y);
    body += text(180, y + 18, r.t, { size: 17, weight: 700, fill: TEAL });
    body += text(180, y + 42, r.d, { size: 15, width: 285 });
    body += text(180, y + 42 + lines(r.d, 285, 15) * 19, r.ex, { size: 14, fill: GREY });
  });
  figs.push({ topic: 'political-intro', id, h: 500, title: 'Nations and states: four ways they fit', alt: 'Four small diagrams. A nation-state: one box (a state) filled with one kind of shape (one nation), close to it is Iceland. A multinational state: one box with three kinds of shapes, for example Nigeria. A multistate nation: one kind of shape spread over two boxes, for example Koreans in two states. A stateless nation: one kind of shape spread across three boxes with no box of its own, for example the Kurds.', body });
}

/* 4.2 Waves of new states. */
{
  const id = 'political-processes-waves';
  const ev = [
    ['1776 to 1830s', 'The United States and most of Latin America break away from European empires.'],
    ['1945 to 1975', 'Most colonies in Africa and Asia win independence: the number of states grows fast.'],
    ['1991', 'The Soviet Union breaks into 15 independent states.'],
    ['1993 to 2011', 'More new states form, such as Eritrea (1993), Timor-Leste (2002) and South Sudan (2011).'],
  ];
  let body = arrowDefs(id, { k: TEAL }) + line(60, 30, 60, 410, { stroke: TEAL, sw: 4, marker: `${id}-k` });
  ev.forEach(([d, t], i) => {
    const y = 50 + i * 95;
    body += `<circle cx="60" cy="${y}" r="10" fill="${TINT}" stroke="${TEAL}" stroke-width="3"/>`;
    body += text(85, y + 6, d, { size: 17, weight: 700, fill: TEAL });
    body += text(85, y + 30, t, { size: 15, width: 375 });
  });
  body += text(85, 440, 'Time runs down the line.', { size: 14, fill: GREY });
  figs.push({ topic: 'political-processes', id, h: 455, title: 'Waves of independence', alt: 'A timeline running down the page with four dates. 1776 to 1830s: the United States and most of Latin America break away from European empires. 1945 to 1975: most colonies in Africa and Asia win independence. 1991: the Soviet Union breaks into 15 states. 1993 to 2011: more new states such as Eritrea, Timor-Leste and South Sudan.', body });
}

/* 4.3 A choke point. */
{
  const id = 'power-territoriality-choke';
  let body = arrowDefs(id, { s: VER });
  body += `<rect x="0" y="40" width="${W}" height="250" fill="${SEA}"/>`;
  body += `<path d="M0,40 L480,40 L480,130 C400,140 330,120 270,150 C250,160 230,160 210,150 C150,120 80,140 0,130 z" fill="#EFE9DC" stroke="${INK}" stroke-width="2"/>`;
  body += `<path d="M0,290 L480,290 L480,210 C400,200 330,215 270,185 C250,175 230,175 210,185 C150,215 80,200 0,210 z" fill="#EFE9DC" stroke="${INK}" stroke-width="2"/>`;
  body += text(240, 90, 'State on the north shore', { size: 15, anchor: 'middle', weight: 700 });
  body += text(240, 262, 'State on the south shore', { size: 15, anchor: 'middle', weight: 700 });
  body += `<path d="M20,170 C120,170 180,168 240,168 C300,168 360,170 460,170" fill="none" stroke="${VER}" stroke-width="3" stroke-dasharray="8 6" marker-end="url(#${id}-s)"/>`;
  body += text(20, 160, 'Ship route', { size: 14, fill: VER, weight: 700 });
  body += line(240, 156, 240, 180, { stroke: INK, sw: 2 });
  body += text(240, 30, 'Choke point: a narrow passage many ships must use', { size: 16, weight: 700, anchor: 'middle', fill: TEAL });
  body += text(20, 315, 'A state that controls the narrow part can tax, slow or block the traffic that passes through it.', { size: 15, width: 440 });
  figs.push({ topic: 'power-territoriality', id, h: 350, title: 'A choke point', alt: 'Two coasts almost meet, leaving a narrow strip of water between a state on the north shore and a state on the south shore. A dashed ship route has to pass through the narrow part. A note says a state that controls the narrow part can tax, slow or block the traffic.', body });
}

/* 4.4 Six boundary types. */
{
  const id = 'defining-boundaries-types';
  const house = (x, y, c = GREY) => `<path d="M${x - 7},${y} L${x},${y - 8} L${x + 7},${y} L${x + 7},${y + 8} L${x - 7},${y + 8} z" fill="${c}"/>`;
  const box = (x, y) => rect(x, y, 110, 64, { fill: '#F7F5EF', stroke: GREY, sw: 1.5, rx: 4 });
  const rows = [
    ['Antecedent', 'Drawn before many settlers lived there.', (x, y) => box(x, y) + line(x + 55, y + 4, x + 55, y + 60, { stroke: VER, sw: 3 }) + house(x + 25, y + 30)],
    ['Subsequent', 'Drawn after people settled, as the cultural landscape took shape.', (x, y) => box(x, y) + [[18, 18], [35, 40], [20, 50], [80, 16], [92, 38], [75, 50]].map(([a, b]) => house(x + a, y + b)).join('') + `<path d="M${x + 57},${y + 4} C${x + 50},${y + 24} ${x + 64},${y + 40} ${x + 56},${y + 60}" fill="none" stroke="${VER}" stroke-width="3"/>`],
    ['Consequent', 'Follows a cultural line, such as language or religion.', (x, y) => box(x, y) + [[18, 18], [35, 40], [20, 50]].map(([a, b]) => house(x + a, y + b, TEAL)).join('') + [[80, 16], [92, 38], [75, 50]].map(([a, b]) => house(x + a, y + b, PUR)).join('') + `<path d="M${x + 57},${y + 4} C${x + 50},${y + 24} ${x + 64},${y + 40} ${x + 56},${y + 60}" fill="none" stroke="${VER}" stroke-width="3"/>`],
    ['Superimposed', 'Forced on a place by outside powers, often cutting through one group.', (x, y) => box(x, y) + [[25, 18], [45, 44], [70, 20], [88, 46]].map(([a, b]) => house(x + a, y + b, TEAL)).join('') + line(x + 57, y + 4, x + 57, y + 60, { stroke: VER, sw: 3 })],
    ['Geometric', 'A straight line, often a line of latitude or longitude.', (x, y) => box(x, y) + line(x + 4, y + 32, x + 106, y + 32, { stroke: VER, sw: 3 }) + text(x + 55, y + 26, '49° N', { size: 14, anchor: 'middle', fill: GREY })],
    ['Relict', 'A former boundary that no longer works but still shows on the land.', (x, y) => box(x, y) + line(x + 55, y + 4, x + 55, y + 60, { stroke: GREY, sw: 3, dash: '5 5' }) + house(x + 30, y + 30) + house(x + 82, y + 34)],
  ];
  let body = text(20, 28, 'Six boundary types (the red line is the boundary)', { size: 16, weight: 700, fill: TEAL });
  rows.forEach(([t, d, draw], i) => {
    const y = 44 + i * 82;
    body += draw(20, y);
    body += text(148, y + 20, t, { size: 17, weight: 700 });
    body += text(148, y + 42, d, { size: 15, width: 315 });
  });
  body += text(20, 44 + 6 * 82 + 10, 'One boundary can fit more than one type.', { size: 15, weight: 700 });
  figs.push({ topic: 'defining-boundaries', id, h: 44 + 6 * 82 + 26, title: 'Six boundary types', alt: 'Six small sketches, each with a red boundary line. Antecedent: the line is drawn before many settlers live there. Subsequent: a winding line drawn after settlement. Consequent: a line between two groups of houses of different colors, following a cultural line. Superimposed: a line drawn by outsiders through the middle of one group. Geometric: a straight line along 49 degrees north. Relict: a dashed gray line, a former boundary that no longer works. A note says one boundary can fit more than one type.', body });
}

/* 4.5 Sea zones under the law of the sea, labeled and lettered. */
function zones(lettered) {
  const x0 = 50, xs = [x0, 140, 220, 380, 470];
  const names = lettered ? ['A', 'B', 'C', 'D'] : ['Territorial sea', 'Contiguous zone', 'Exclusive economic zone (EEZ)', 'High seas'];
  const fills = ['#B9DCE6', '#CFE6EC', '#E2F0F3', '#F4FAFB'];
  let body = `<rect x="0" y="40" width="${x0}" height="200" fill="#EFE9DC" stroke="${INK}" stroke-width="2"/>` + text(25, 145, 'Land', { size: 15, weight: 700, anchor: 'middle' });
  for (let i = 0; i < 4; i++) body += `<rect x="${xs[i]}" y="40" width="${xs[i + 1] - xs[i]}" height="200" fill="${fills[i]}"/>` + line(xs[i + 1], 40, xs[i + 1], 240, { stroke: TEAL, sw: 2, dash: i === 3 ? '' : '6 4' });
  body += line(x0, 40, x0, 240, { stroke: INK, sw: 3 });
  const nm = ['0', '12', '24', '200'];
  [x0, 140, 220, 380].forEach((x, i) => { body += text(x, 262, nm[i], { size: 15, anchor: 'middle', weight: 700 }); });
  body += text(275, 290, 'Nautical miles from the coast (not to scale)', { size: 14, anchor: 'middle', fill: GREY });
  if (lettered) {
    const mids = [95, 180, 300, 425];
    mids.forEach((m, i) => { body += `<circle cx="${m}" cy="140" r="16" fill="#FFFFFF" stroke="${TEAL}" stroke-width="2"/>` + text(m, 146, names[i], { size: 17, weight: 700, anchor: 'middle', fill: TEAL }); });
  } else {
    const lab = (x, ys, arr, bold) => arr.map((t, i) => text(x, ys + i * 18, t, { size: 14, anchor: 'middle', weight: bold ? 700 : 400 })).join('');
    body += lab(95, 92, ['Territorial', 'sea'], true) + lab(180, 92, ['Contiguous', 'zone'], true) + lab(300, 92, ['Exclusive', 'economic zone'], true) + lab(425, 92, ['High seas'], true);
    body += lab(95, 150, ['Ruled', 'like land'], false) + lab(180, 150, ['Customs', 'and police'], false) + lab(300, 150, ['Fish, oil, gas', 'and minerals', 'belong to the', 'coastal state'], false) + lab(425, 150, ['Open to', 'all states'], false);
    // The EEZ runs from the edge of the territorial sea out to 200 nm, so it takes in the contiguous zone.
    body += line(142, 62, 378, 62, { stroke: TEAL, sw: 2 }) + line(142, 56, 142, 68, { stroke: TEAL, sw: 2 }) + line(378, 56, 378, 68, { stroke: TEAL, sw: 2 });
    body += `<rect x="236" y="50" width="128" height="22" fill="#FFFFFF"/>` + text(300, 66, 'EEZ: 12 to 200', { size: 14, anchor: 'middle', weight: 700, fill: TEAL });
  }
  body += text(240, 26, lettered ? 'Sea zones off one coast' : 'Sea zones under the law of the sea (UNCLOS)', { size: 16, weight: 700, anchor: 'middle', fill: TEAL });
  return body;
}
figs.push({ topic: 'boundary-functions', id: 'boundary-functions-zones', h: 300, title: 'Sea zones under the law of the sea', alt: 'A strip of sea running out from the coast in four bands. From 0 to 12 nautical miles: the territorial sea, ruled like land. From 12 to 24: the contiguous zone, where the state can enforce customs and police laws. From 12 out to 200: the exclusive economic zone, where fish, oil, gas and minerals belong to the coastal state (the contiguous zone sits inside it). Beyond 200: the high seas, open to all states. Not to scale.', body: zones(false) });
figs.push({ topic: 'boundary-functions', id: 'boundary-functions-zones-lettered', h: 300, title: 'Sea zones off one coast, lettered', alt: 'A strip of sea running out from a coast in four bands lettered A to D. Band A runs from the coast to 12 nautical miles, band B from 12 to 24, band C from 24 to 200 and band D lies beyond 200 nautical miles. Not to scale.', body: zones(true) });

/* 4.6 Two districting plans for one invented county. */
{
  const id = 'internal-boundaries-plans';
  // Voters: columns 0-2 Party X, columns 3-4 Party Y (each block = 100 voters).
  const party = (r, c) => (c <= 2 ? 'X' : 'Y');
  const plan1 = (r, c) => c; // five columns
  const p2 = {}; // Plan 2: X packed into columns 0 and 1, the rest drawn so Y wins three
  for (let r = 0; r < 5; r++) { p2[`${r},0`] = 0; p2[`${r},1`] = 1; }
  [[0, 2], [0, 3], [0, 4], [1, 3], [1, 4]].forEach(([r, c]) => { p2[`${r},${c}`] = 2; });
  [[1, 2], [2, 2], [2, 3], [2, 4], [3, 3]].forEach(([r, c]) => { p2[`${r},${c}`] = 3; });
  [[3, 2], [4, 2], [3, 4], [4, 3], [4, 4]].forEach(([r, c]) => { p2[`${r},${c}`] = 4; });
  const plan2 = (r, c) => p2[`${r},${c}`];
  const S = 38;
  function grid(x0, y0, plan, title, result) {
    let g = text(x0 + 2.5 * S, y0 - 30, title, { size: 16, weight: 700, anchor: 'middle', fill: TEAL });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const x = x0 + c * S, y = y0 + r * S, p = party(r, c);
      g += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${p === 'X' ? '#F6D9C4' : '#CFE6EC'}" stroke="#FFFFFF" stroke-width="1"/>`;
      g += text(x + S / 2, y + S / 2 + 6, p, { size: 17, weight: 700, anchor: 'middle', fill: p === 'X' ? VER : TEAL });
    }
    // Thick lines where two neighboring blocks are in different districts.
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      if (c < 4 && plan(r, c) !== plan(r, c + 1)) g += line(x0 + (c + 1) * S, y0 + r * S, x0 + (c + 1) * S, y0 + (r + 1) * S, { sw: 4 });
      if (r < 4 && plan(r, c) !== plan(r + 1, c)) g += line(x0 + c * S, y0 + (r + 1) * S, x0 + (c + 1) * S, y0 + (r + 1) * S, { sw: 4 });
    }
    g += rect(x0, y0, 5 * S, 5 * S, { sw: 4, rx: 0 });
    g += text(x0 + 2.5 * S, y0 + 5 * S + 26, result, { size: 15, weight: 700, anchor: 'middle' });
    return g;
  }
  let body = grid(30, 70, plan1, 'Plan 1', 'X wins 3 seats, Y wins 2') + grid(260, 70, plan2, 'Plan 2', 'X wins 2 seats, Y wins 3');
  body += text(240, 24, 'One invented county: 25 blocks, 5 districts', { size: 16, weight: 700, anchor: 'middle' });
  body += text(20, 320, 'Each block has 100 voters. X = most vote for Party X; Y = most vote for Party Y. Thick lines are district boundaries.', { size: 14, width: 440 });
  figs.push({ topic: 'internal-boundaries', id, h: 360, title: 'Two districting plans for one county', alt: 'Two copies of the same invented county, each a 5 by 5 grid of 25 blocks of 100 voters. In both, the three left columns (15 blocks) vote mostly for Party X and the two right columns (10 blocks) vote mostly for Party Y. Plan 1 draws five districts as the five columns, so X wins 3 seats and Y wins 2. Plan 2 makes the two left columns into two all-X districts and draws the other three districts as bent shapes that each hold 3 or 4 Y blocks and only 1 or 2 X blocks, so X wins 2 seats and Y wins 3.', body });
}

/* 4.7 Unitary and federal states. */
{
  const id = 'forms-of-governance-power';
  let body = arrowDefs(id, { k: TEAL, v: VER });
  // Unitary
  body += text(120, 28, 'Unitary state', { size: 17, weight: 700, anchor: 'middle', fill: TEAL });
  body += rect(40, 44, 160, 50, { fill: TINT, stroke: TEAL }) + text(120, 66, 'National', { size: 15, weight: 700, anchor: 'middle' }) + text(120, 84, 'government', { size: 15, weight: 700, anchor: 'middle' });
  [50, 100, 150].forEach((x, i) => { body += line(120, 94, x + 15, 160, { stroke: TEAL, sw: 2.5, marker: `${id}-k` }) + rect(x - 5, 164, 40, 30, { stroke: GREY, sw: 1.5, rx: 4 }); });
  body += text(120, 216, 'Regions carry out', { size: 15, anchor: 'middle' }) + text(120, 235, 'national decisions.', { size: 15, anchor: 'middle' });
  body += text(120, 262, 'Example: France', { size: 14, anchor: 'middle', fill: GREY });
  // Federal
  body += text(360, 28, 'Federal state', { size: 17, weight: 700, anchor: 'middle', fill: VER });
  body += rect(280, 44, 160, 50, { fill: '#F6D9C4', stroke: VER }) + text(360, 66, 'Constitution divides', { size: 14, weight: 700, anchor: 'middle' }) + text(360, 84, 'the powers', { size: 14, weight: 700, anchor: 'middle' });
  body += line(330, 94, 300, 130, { stroke: VER, sw: 2.5, marker: `${id}-v` }) + line(390, 94, 420, 130, { stroke: VER, sw: 2.5, marker: `${id}-v` });
  body += rect(250, 134, 100, 44, { stroke: INK, sw: 1.5 }) + text(300, 153, 'National', { size: 14, anchor: 'middle', weight: 700 }) + text(300, 170, 'government', { size: 14, anchor: 'middle', weight: 700 });
  body += rect(370, 134, 100, 44, { stroke: INK, sw: 1.5 }) + text(420, 153, 'State', { size: 14, anchor: 'middle', weight: 700 }) + text(420, 170, 'governments', { size: 14, anchor: 'middle', weight: 700 });
  body += text(300, 196, 'Army, money', { size: 14, anchor: 'middle' }) + text(420, 196, 'Schools, police', { size: 14, anchor: 'middle' });
  body += text(360, 222, 'Each level has its', { size: 15, anchor: 'middle' }) + text(360, 241, 'own powers.', { size: 15, anchor: 'middle' });
  body += text(360, 262, 'Example: Germany', { size: 14, anchor: 'middle', fill: GREY });
  body += line(240, 20, 240, 270, { stroke: '#D4D9D7', sw: 1.5 });
  body += text(240, 300, 'In both, the national government exists. What differs is how power is shared across space.', { size: 15, anchor: 'middle', width: 440 }).replace(/x="240"/g, 'x="240"');
  figs.push({ topic: 'forms-of-governance', id, h: 335, title: 'Unitary and federal states', alt: 'Two diagrams side by side. Unitary state (example France): the national government at the top sends arrows down to three regions, which carry out national decisions. Federal state (example Germany): a constitution divides the powers between the national government (army, money) and the state governments (schools, police), so each level has its own powers. A note says both have a national government; what differs is how power is shared across space.', body });
}

/* 4.8 Six devolutionary factors. */
{
  const id = 'devolution-factors-wheel';
  const f = ['Physical division', 'Ethnic separatism', 'Ethnic cleansing', 'Terrorism', 'Economic and social problems', 'Irredentism'];
  let body = arrowDefs(id, { k: TEAL });
  body += `<ellipse cx="240" cy="200" rx="115" ry="52" fill="${TINT}" stroke="${TEAL}" stroke-width="3"/>`;
  body += text(240, 190, 'Devolution', { size: 18, weight: 700, anchor: 'middle', fill: TEAL }) + text(240, 212, 'power moves from the', { size: 14, anchor: 'middle' }) + text(240, 230, 'national level to regions', { size: 14, anchor: 'middle' });
  const pos = [[85, 50], [240, 50], [395, 50], [85, 330], [240, 330], [395, 330]];
  f.forEach((t, i) => {
    const [x, y] = pos[i];
    const L = wrap(t, 135, 15);
    const top = y - 22, hgt = 14 + L.length * 19;
    body += rect(x - 74, top, 148, hgt, { fill: '#FFFFFF', stroke: INK, sw: 1.5 });
    body += text(x, y - 2, t, { size: 15, weight: 700, anchor: 'middle', width: 135 });
    const from = y < 200 ? [x, top + hgt] : [x, top];
    const to = [240 + (x - 240) * 0.45, y < 200 ? 146 : 254];
    body += line(from[0], from[1] + (y < 200 ? 2 : -2), to[0], to[1], { stroke: TEAL, sw: 2, marker: `${id}-k` });
  });
  figs.push({ topic: 'devolution-factors', id, h: 385, title: 'Factors that push devolution', alt: 'A central oval reads: devolution, power moves from the national level to regions. Six boxes point arrows at it: physical division, ethnic separatism, ethnic cleansing, terrorism, economic and social problems, and irredentism.', body });
}

/* 4.9 Sovereignty shared upward and downward. */
{
  const id = 'sovereignty-challenges-updown';
  let body = arrowDefs(id, { k: TEAL, v: VER });
  body += rect(90, 20, 300, 70, { fill: '#F6D9C4', stroke: VER }) + text(240, 48, 'Supranational organizations', { size: 16, weight: 700, anchor: 'middle' }) + text(240, 70, 'such as the UN, the EU, NATO, ASEAN', { size: 14, anchor: 'middle' });
  body += rect(140, 150, 200, 60, { fill: TINT, stroke: TEAL, sw: 3 }) + text(240, 177, 'The state', { size: 17, weight: 700, anchor: 'middle', fill: TEAL }) + text(240, 198, '(national government)', { size: 14, anchor: 'middle' });
  body += rect(90, 270, 300, 70, { stroke: INK, sw: 1.5 }) + text(240, 298, 'Regions and autonomous areas', { size: 16, weight: 700, anchor: 'middle' }) + text(240, 320, 'such as Scotland, Catalonia, Quebec', { size: 14, anchor: 'middle' });
  body += line(240, 150, 240, 96, { stroke: VER, sw: 3, marker: `${id}-v` }) + line(240, 210, 240, 264, { stroke: TEAL, sw: 3, marker: `${id}-k` });
  body += text(252, 128, 'Power shared upward', { size: 14, weight: 700, fill: VER });
  body += text(252, 236, 'Power shared downward', { size: 14, weight: 700, fill: TEAL }) + text(252, 254, '(devolution)', { size: 14, weight: 700, fill: TEAL });
  body += text(240, 370, 'Both moves can limit what the national government decides alone.', { size: 15, anchor: 'middle', width: 440 });
  figs.push({ topic: 'sovereignty-challenges', id, h: 390, title: 'Sovereignty shared upward and downward', alt: 'The state, meaning the national government, sits in the middle. An arrow up shows power shared upward to supranational organizations such as the UN, the EU, NATO and ASEAN. An arrow down shows power shared downward, called devolution, to regions and autonomous areas such as Scotland, Catalonia and Quebec. A note says both moves can limit what the national government decides alone.', body });
}

/* 4.10 Forces that pull a state together or apart. */
{
  const id = 'centrifugal-centripetal-forces';
  let body = arrowDefs(id, { k: TEAL, v: VER });
  body += `<circle cx="240" cy="200" r="52" fill="${TINT}" stroke="${TEAL}" stroke-width="3"/>` + text(240, 196, 'The', { size: 16, weight: 700, anchor: 'middle', fill: TEAL }) + text(240, 215, 'state', { size: 16, weight: 700, anchor: 'middle', fill: TEAL });
  const inn = ['Shared language', 'National roads and rail', 'Fair shares of money'];
  const out = ['Unequal regions', 'Distrust after conflict', 'Rival identities'];
  inn.forEach((t, i) => { const y = 100 + i * 90; body += text(20, y, t, { size: 15, weight: 700, fill: TEAL, width: 125 }) + line(150, y + 4, 186, 200 + (i - 1) * 28, { stroke: TEAL, sw: 2.5, marker: `${id}-k` }); });
  out.forEach((t, i) => { const y = 100 + i * 90; body += text(460, y, t, { size: 15, weight: 700, fill: VER, anchor: 'end', width: 125 }) + line(294, 200 + (i - 1) * 28, 330, y + 4, { stroke: VER, sw: 2.5, marker: `${id}-v`, dash: '7 4' }); });
  body += text(20, 40, 'Centripetal: pull together', { size: 16, weight: 700, fill: TEAL });
  body += text(460, 40, 'Centrifugal: pull apart', { size: 16, weight: 700, fill: VER, anchor: 'end' });
  body += text(240, 335, 'Solid arrows point in; dashed arrows point out.', { size: 14, anchor: 'middle', fill: GREY });
  figs.push({ topic: 'centrifugal-centripetal', id, h: 355, title: 'Centripetal and centrifugal forces', alt: 'A circle labeled the state. On the left, solid arrows point inward from three centripetal forces that pull the state together: shared language, national road and rail, fair shares of money. On the right, dashed arrows point outward to three centrifugal forces that pull it apart: unequal regions, distrust after conflict, rival identities.', body });
}

/* --------------------------------------------------------------- write */
const check = process.argv.includes('--check');
let stale = 0;
const byTopic = {};
for (const f of figs) {
  const out = svg(f.id, f.h, f.title, f.alt, f.body);
  const p = join(FIG, `${f.id}.svg`);
  if (check) { if (!existsSync(p) || readFileSync(p, 'utf8') !== out) { console.log(`stale: ${p}`); stale++; } }
  else writeFileSync(p, out);
  (byTopic[f.topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: W, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
}
if (!check) mkdirSync(DATA, { recursive: true });
for (const [t, o] of Object.entries(byTopic)) {
  const p = join(DATA, `${t}.json`), out = JSON.stringify(o, null, 1) + '\n';
  if (check) { if (!existsSync(p) || readFileSync(p, 'utf8') !== out) { console.log(`stale: ${p}`); stale++; } }
  else writeFileSync(p, out);
}
console.log(check ? `${figs.length} figures, ${stale} stale` : `wrote ${figs.length} figures for ${Object.keys(byTopic).length} topics`);
if (check && stale) process.exit(1);
