/* AP® Human Geography, Unit 6 figures (author F). LevlPrep original SVG
   drawings: no photos, no outside material. Each figure is a function that
   returns { id, topic, w, h, title, alt, body }; this script writes
   human-geography/figures/<id>.svg and registers every figure in
   human-geography/data/figures/<topic>.json.

     node scripts/aphug-figures/author-f.mjs           write the files
     node scripts/aphug-figures/author-f.mjs --check   exit 1 if a file would change

   Colors: course teal #094953, vermillion #C24E00, green #009E73, reddish
   purple #A8508A, purple #7A4F9E; ink #1F2A28; soft tints for areas. Words
   are kept at 13 px or more so they read in a phone-width card. */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INK = '#1F2A28', TEAL = '#094953', VER = '#C24E00', GREEN = '#009E73', RP = '#A8508A', PUR = '#7A4F9E', GREY = '#6B6F6C';
const T = { teal: '#D7ECEF', ver: '#F8DCC8', green: '#D4F0E6', rp: '#F1DDEA', pur: '#E4DBEF', sand: '#F3EEDF', grey: '#ECEDEB', water: '#CFE6F5', farm: '#E8F1D2' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const c = (x, y, rad, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" ${extra}/>`;
const l = (x1, y1, x2, y2, stroke = INK, wdt = 2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${wdt}" ${extra}/>`;
const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
function t(x, y, s, { size = 14, anchor = 'start', weight = 'normal', fill = INK } = {}) {
  const lines = String(s).split('\n');
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" fill="${fill}">` +
    lines.map((ln, i) => `<tspan x="${x}" dy="${i ? size * 1.25 : 0}">${esc(ln)}</tspan>`).join('') + '</text>';
}
const hex = (cx, cy, R, fill, extra = '') => `<polygon points="${[0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI / 180 * (60 * i - 30); return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`; }).join(' ')}" fill="${fill}" ${extra}/>`;
const badge = (x, y, s, fill = INK) => c(x, y, 13, '#FFFFFF', `stroke="${fill}" stroke-width="2"`) + t(x, y + 5, s, { size: 14, anchor: 'middle', weight: 'bold', fill });

const FIGS = [];
const fig = f => FIGS.push(f);

/* 6.1 site and situation */
fig({
  id: 'urbanization-origins-site-situation', topic: 'urbanization-origins', w: 820, h: 430,
  title: 'Site and situation',
  alt: 'Two panels. Left, site: a town built on an island in a river bend, with a hill, fresh water and flat farmland beside it. Right, situation: the same town as a dot where a river route, a coast road and a mountain pass road meet, linked to a port, a mining town and farm villages.',
  body: [
    r(0, 0, 820, 430, '#FFFFFF'),
    t(205, 30, 'Site: the ground the city is on', { size: 17, anchor: 'middle', weight: 'bold', fill: TEAL }),
    t(615, 30, 'Situation: its place among other places', { size: 17, anchor: 'middle', weight: 'bold', fill: VER }),
    l(410, 45, 410, 410, '#C9CCC8', 2),
    r(20, 50, 370, 330, T.farm, 'rx="8"'),
    p('M60 50 C120 140 40 230 150 300 C230 350 260 330 330 380 L370 380 C300 320 270 330 200 290 C100 230 170 140 110 50 Z', T.water),
    p('M135 175 C160 150 215 160 222 190 C228 225 180 245 150 232 C125 220 118 195 135 175 Z', T.sand, `stroke="${INK}" stroke-width="1.5"`),
    ...[[150, 190], [170, 182], [190, 196], [160, 212], [182, 216], [204, 210]].map(([x, y]) => r(x, y, 12, 10, TEAL)),
    p('M270 120 L320 70 L370 120 Z', '#D9CFB8', `stroke="${INK}" stroke-width="1.2"`),
    t(150, 270, 'Island: easy to defend', { size: 14, anchor: 'middle' }),
    t(300, 145, 'Hill: a lookout', { size: 14, anchor: 'middle' }),
    t(60, 355, 'River: fresh water and fish', { size: 14 }),
    t(260, 210, 'Flat, fertile\nfarmland', { size: 14 }),
    r(430, 50, 370, 330, '#FBFBFA', 'rx="8"'),
    p('M430 300 C520 290 560 330 650 320 C720 312 760 330 800 325 L800 380 L430 380 Z', T.water),
    l(615, 210, 470, 320, GREY, 4, 'stroke-dasharray="2 0"'), l(615, 210, 790, 315, GREY, 4), l(615, 210, 720, 80, GREY, 4), l(615, 210, 480, 90, GREY, 4),
    c(615, 210, 18, VER), t(615, 250, 'The town', { size: 14, anchor: 'middle', weight: 'bold' }),
    c(470, 320, 9, TEAL), t(470, 350, 'Sea port', { size: 14, anchor: 'middle' }),
    c(720, 80, 9, TEAL), t(720, 68, 'Mining town', { size: 14, anchor: 'middle' }),
    c(480, 90, 9, TEAL), t(480, 78, 'Farm villages', { size: 14, anchor: 'middle' }),
    c(790, 315, 9, TEAL), t(792, 350, 'Coast road', { size: 14, anchor: 'end' }),
    t(410, 405, 'Site is the place itself. Situation is its links to other places: routes meet at the town, so trade passes through.', { size: 14, anchor: 'middle', fill: GREY }),
  ].join(''),
});

/* 6.2 a metro area: central city, suburbs, edge city, boomburb, exurbs */
fig({
  id: 'cities-worldwide-metro', topic: 'cities-worldwide', w: 820, h: 470,
  title: 'The parts of a large metro area',
  alt: 'A metro area seen from above. The old central city sits in the middle. Rings of suburbs spread around it, crossed by highways. Where two highways meet in the suburbs stands an edge city of office towers and malls. One fast-growing suburb has become a boomburb. Beyond the built-up edge, scattered houses on large lots among farms form the exurbs.',
  body: [
    r(0, 0, 820, 470, '#FFFFFF'),
    c(330, 240, 215, T.farm), c(330, 240, 165, T.sand), c(330, 240, 60, T.teal, `stroke="${TEAL}" stroke-width="2"`),
    l(60, 240, 600, 240, GREY, 6), l(330, 20, 330, 460, GREY, 6), l(150, 60, 520, 430, GREY, 5),
    ...[[300, 225], [318, 250], [340, 228], [352, 252], [326, 212]].map(([x, y]) => r(x, y, 12, 22, TEAL)),
    r(282, 306, 96, 22, '#FFFFFF', 'rx="4"'), t(330, 322, 'Central city', { size: 15, anchor: 'middle', weight: 'bold', fill: TEAL }),
    ...[[455, 148], [465, 160], [478, 150]].map(([x, y]) => r(x, y, 14, 30, VER)),
    t(468, 200, 'Edge city:\noffices, malls, jobs', { size: 14, anchor: 'middle', weight: 'bold', fill: VER }),
    c(200, 380, 42, T.rp, `stroke="${RP}" stroke-width="2"`), t(200, 385, 'Boomburb', { size: 14, anchor: 'middle', weight: 'bold', fill: RP }),
    r(144, 120, 162, 21, '#FFFFFF', 'rx="4"'), t(225, 135, 'Suburbs: mostly homes', { size: 14, anchor: 'middle' }),
    ...[[90, 120], [110, 410], [560, 95], [585, 380], [70, 300]].map(([x, y]) => r(x, y, 10, 8, GREEN)),
    t(560, 70, 'Exurbs: homes on big lots among farms', { size: 14, anchor: 'middle', fill: GREEN, weight: 'bold' }),
    r(600, 140, 210, 190, '#FBFBFA', `stroke="#C9CCC8" rx="8"`),
    t(615, 165, 'Key', { size: 15, weight: 'bold' }),
    r(615, 178, 18, 14, T.teal), t(642, 190, 'Old central city', { size: 14 }),
    r(615, 202, 18, 14, T.sand), t(642, 214, 'Suburbs (built up)', { size: 14 }),
    r(615, 226, 18, 14, T.farm), t(642, 238, 'Exurbs and farmland', { size: 14 }),
    l(615, 258, 633, 258, GREY, 5), t(642, 263, 'Highway', { size: 14 }),
    r(615, 276, 18, 14, VER), t(642, 288, 'Edge city towers', { size: 14 }),
    t(615, 316, 'Not to scale', { size: 13, fill: GREY }),
  ].join(''),
});

/* 6.3 the urban hierarchy */
fig({
  id: 'cities-globalization-hierarchy', topic: 'cities-globalization', w: 820, h: 430,
  title: 'The urban hierarchy',
  alt: 'A pyramid of five tiers. At the top, a few world cities such as London and New York that command global finance and media. Below, major cities that link large world regions. Then national capitals and large cities, then regional cities, and at the wide base many small towns. Arrows show money, decisions and information flowing down and across, and goods and people moving up.',
  body: [
    r(0, 0, 820, 430, '#FFFFFF'),
    ...[
      [TEAL, '#FFFFFF', 'World cities', 'London, New York'],
      ['#3E7C86', '#FFFFFF', 'Major cities linking world regions', ''],
      ['#7FB3BB', INK, 'National capitals and large cities', ''],
      ['#B8D8DD', INK, 'Regional cities', ''],
      [T.teal, INK, 'Small towns: many of them', ''],
    ].map(([fill, ink, label, ex], i) => {
      const y = 40 + i * 70, top = 50 + i * 58, bot = top + 54;
      return p(`M${300 - bot} ${y + 66} L${300 + bot} ${y + 66} L${300 + top} ${y} L${300 - top} ${y} Z`, fill) +
        t(300, y + 32 + (ex ? -4 : 6), label, { size: 14, anchor: 'middle', weight: 'bold', fill: ink }) + (ex ? t(300, y + 50, ex, { size: 13, anchor: 'middle', fill: ink }) : '');
    }),
    l(612, 70, 612, 360, VER, 3, 'marker-end="url(#chf-dn)"'), t(640, 110, 'Down the hierarchy:\ndecisions, money,\nnew ideas, fashions', { size: 14, fill: VER }),
    l(626, 360, 626, 70, GREEN, 3, 'marker-end="url(#chf-up)"'), t(640, 260, 'Up the hierarchy:\nmigrants, goods,\nprofits', { size: 14, fill: '#05664B' }),
    t(410, 418, 'The higher the tier, the fewer the cities and the wider the area each one serves and controls.', { size: 14, anchor: 'middle', fill: GREY }),
  ].join(''),
  defs: `<marker id="chf-dn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${VER}"/></marker><marker id="chf-up" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${GREEN}"/></marker>`,
});

/* 6.4 central place hexagons */
const hexes = [];
{
  const R = 58, cx = 280, cy = 230;
  hexes.push(hex(cx, cy, R * 2.6, T.teal, `stroke="${TEAL}" stroke-width="2.5"`));
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i);
    const x = cx + R * 1.73 * Math.cos(a), y = cy + R * 1.73 * Math.sin(a);
    hexes.push(hex(x, y, R, T.sand, `stroke="${VER}" stroke-width="1.5" fill-opacity="0.85"`));
  }
  hexes.push(hex(cx, cy, R, T.sand, `stroke="${VER}" stroke-width="1.5"`));
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i);
    hexes.push(c(cx + R * 1.73 * Math.cos(a), cy + R * 1.73 * Math.sin(a), 8, VER));
    const b = Math.PI / 180 * (60 * i + 30);
    hexes.push(c(cx + R * Math.cos(b), cy + R * Math.sin(b), 5, GREEN));
  }
  hexes.push(c(cx, cy, 13, TEAL));
}
fig({
  id: 'city-size-distribution-central-place', topic: 'city-size-distribution', w: 820, h: 460,
  title: 'Central place theory: market areas as hexagons',
  alt: 'One large city sits at the center of a big hexagon, its market area. Six towns sit around it, each at the center of a smaller hexagon. Villages sit at the corners of the small hexagons. A key explains that higher-order places are fewer, farther apart and offer goods with a larger range and threshold.',
  body: [
    r(0, 0, 820, 460, '#FFFFFF'), ...hexes,
    r(540, 60, 260, 300, '#FBFBFA', `stroke="#C9CCC8" rx="8"`),
    t(555, 88, 'Key', { size: 15, weight: 'bold' }),
    c(565, 115, 12, TEAL), t(588, 120, 'City: rare goods (a big', { size: 14 }), t(588, 138, 'hospital, a stadium)', { size: 14 }),
    c(565, 168, 8, VER), t(588, 173, 'Town: a supermarket,', { size: 14 }), t(588, 191, 'a high school', { size: 14 }),
    c(565, 220, 5, GREEN), t(588, 225, 'Village: a gas station', { size: 14 }),
    t(555, 262, 'Range: how far people will', { size: 14, weight: 'bold' }), t(555, 280, 'travel for a good.', { size: 14 }),
    t(555, 310, 'Threshold: how many buyers', { size: 14, weight: 'bold' }), t(555, 328, 'a seller needs to stay open.', { size: 14 }),
    t(410, 440, 'Hexagons fill a plain with no gaps or overlaps, which is why the model uses them.', { size: 14, anchor: 'middle', fill: GREY }),
  ].join(''),
});

/* 6.5 numbered concentric zones (stimulus: names withheld) */
fig({
  id: 'city-structure-zones', topic: 'city-structure', w: 600, h: 470,
  title: 'A city model with numbered zones',
  alt: 'A city model of five rings around one center, numbered 1 at the center to 5 at the outer edge. The rings are equal bands with no wedges. A lake lies along the east side, so the rings are drawn as half circles open to the lake. A railroad enters zone 2 from the west.',
  body: [
    r(0, 0, 600, 470, '#FFFFFF'),
    r(470, 20, 110, 430, T.water), t(525, 235, 'Lake', { size: 15, anchor: 'middle', weight: 'bold', fill: TEAL }),
    ...[[225, T.farm], [180, T.green], [135, T.sand], [90, T.ver], [45, T.teal]].map(([rad, fill]) => p(`M470 ${235 - rad} A${rad} ${rad} 0 0 0 470 ${235 + rad} Z`, fill, `stroke="${INK}" stroke-width="1.5"`)),
    l(20, 205, 405, 205, GREY, 3, 'stroke-dasharray="10 6"'), t(30, 196, 'Railroad', { size: 14, fill: GREY }),
    badge(447, 235, '1'), badge(420, 279, '2'), badge(386, 309, '3'), badge(352, 339, '4'), badge(318, 368, '5'),
  ].join(''),
});

/* 6.5 four models side by side */
function panel(x, y, title) { return r(x, y, 190, 250, '#FBFBFA', `stroke="#C9CCC8" rx="8"`) + t(x + 95, y + 24, title, { size: 15, anchor: 'middle', weight: 'bold' }); }
const pc = (x, y) => [x + 95, y + 135];
const ringsArt = (x, y) => { const [cx, cy] = pc(x, y); return [[85, T.farm], [65, T.green], [47, T.sand], [30, T.ver], [14, TEAL]].map(([rr, f]) => c(cx, cy, rr, f, `stroke="${INK}" stroke-width="1"`)).join(''); };
const sectorArt = (x, y) => {
  const [cx, cy] = pc(x, y), R = 85;
  const wedges = [[0, 60, T.sand], [60, 100, T.ver], [100, 170, T.green], [170, 230, T.sand], [230, 300, T.rp], [300, 360, T.green]];
  return wedges.map(([a0, a1, f]) => { const A = d => [cx + R * Math.cos((d - 90) * Math.PI / 180), cy + R * Math.sin((d - 90) * Math.PI / 180)]; const [x0, y0] = A(a0), [x1, y1] = A(a1); return p(`M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`, f, `stroke="${INK}" stroke-width="1"`); }).join('') + c(cx, cy, 14, TEAL);
};
const nucleiArt = (x, y) => { const [cx, cy] = pc(x, y); return c(cx, cy, 85, T.sand, `stroke="${INK}" stroke-width="1"`) + c(cx - 15, cy - 10, 16, TEAL) + c(cx + 45, cy - 40, 14, T.ver, `stroke="${VER}" stroke-width="2"`) + c(cx - 50, cy + 40, 14, T.green, `stroke="${GREEN}" stroke-width="2"`) + c(cx + 35, cy + 45, 14, T.rp, `stroke="${RP}" stroke-width="2"`); };
const galacticArt = (x, y) => { const [cx, cy] = pc(x, y); return c(cx, cy, 85, T.farm) + c(cx, cy, 62, 'none', `stroke="${GREY}" stroke-width="5"`) + c(cx, cy, 13, TEAL) + [0, 90, 180, 270].map(d => c(cx + 62 * Math.cos(d * Math.PI / 180), cy + 62 * Math.sin(d * Math.PI / 180), 11, VER)).join('') + l(cx, cy - 85, cx, cy + 85, GREY, 3) + l(cx - 85, cy, cx + 85, cy, GREY, 3); };
fig({
  id: 'city-structure-models', topic: 'city-structure', w: 820, h: 330,
  title: 'Four models of the North American city',
  alt: 'Four small diagrams. Concentric zone: rings around one downtown center. Sector: wedges that run out from the center along transport lines. Multiple nuclei: several separate centers scattered in the city, such as a downtown, an airport area, a university and an industrial park. Galactic city: an old downtown plus edge cities spaced along a ring highway, with homes and farmland between.',
  body: [
    r(0, 0, 820, 330, '#FFFFFF'),
    panel(10, 10, 'Concentric zone'), ringsArt(10, 10),
    panel(215, 10, 'Sector'), sectorArt(215, 10),
    panel(420, 10, 'Multiple nuclei'), nucleiArt(420, 10),
    panel(625, 10, 'Galactic city'), galacticArt(625, 10),
    c(30, 285, 9, TEAL), t(46, 290, 'Downtown (CBD)', { size: 14 }),
    c(200, 285, 9, VER), t(216, 290, 'Other centers of jobs and shops', { size: 14 }),
    l(470, 285, 500, 285, GREY, 5), t(508, 290, 'Highway', { size: 14 }),
    t(410, 320, 'Each is a simplified model built from mid-1900s North American cities.', { size: 14, anchor: 'middle', fill: GREY }),
  ].join(''),
});

/* 6.5 Latin American city model */
fig({
  id: 'city-structure-latin-american', topic: 'city-structure', w: 820, h: 440,
  title: 'The Latin American city model',
  alt: 'A half-circle city around a central business district by a main plaza. A narrow wedge, the spine, runs from the center along a grand avenue: wealthy homes, offices and parks, ending at a mall and a wealthy suburb. Around the center lie rings: first older, solid homes; then homes being improved bit by bit; then on the outer edge self-built squatter settlements. Factories sit in another wedge along a rail line.',
  body: [
    r(0, 0, 820, 440, '#FFFFFF'),
    ...[[230, T.grey], [160, T.sand], [95, T.green]].map(([rad, fill]) => p(`M${300 - rad} 410 A${rad} ${rad} 0 0 1 ${300 + rad} 410 Z`, fill, `stroke="${INK}" stroke-width="1.2"`)),
    p('M300 410 L270 182 A230 230 0 0 1 330 182 Z', T.pur, `stroke="${PUR}" stroke-width="2"`),
    p('M300 410 L95 303 A230 230 0 0 1 120 266 Z', T.rp, `stroke="${RP}" stroke-width="2"`),
    p('M300 410 L262 410 A38 38 0 0 1 338 410 Z', TEAL),
    badge(300, 392, '1'), badge(300, 250, '2'), badge(365, 370, '3'), badge(410, 320, '4'), badge(470, 280, '5'), badge(128, 312, '6'),
    r(560, 20, 250, 240, '#FBFBFA', `stroke="#C9CCC8" rx="8"`),
    ...['1 CBD and main plaza', '2 Spine: wealthy homes and', '   offices along an avenue', '3 Zone of maturity: older,', '   solid homes', '4 Zone of in situ accretion:', '   homes improved bit by bit', '5 Zone of peripheral squatter', '   settlements: self-built homes', '6 Industry along a rail line'].map((s, i) => t(575, 46 + i * 21, s, { size: 14 })),
    t(410, 432, 'Wealth follows the spine out from the center; the newest, poorest homes are at the edge.', { size: 14, anchor: 'middle', fill: GREY }),
  ].join(''),
});

/* 6.6 density gradient and infill */
fig({
  id: 'density-land-use-gradient', topic: 'density-land-use', w: 820, h: 380,
  title: 'Density falls with distance from downtown',
  alt: 'A side view of a city from downtown on the left to the edge on the right. Tall towers stand downtown, then mid-rise apartment blocks, then row houses, then single-family houses on large lots, then farmland. One empty lot between the mid-rise blocks is being filled with a new apartment building, marked as infill.',
  body: [
    r(0, 0, 820, 380, '#FFFFFF'), l(20, 300, 800, 300, INK, 2),
    ...[[30, 80], [70, 40], [110, 100], [150, 60]].map(([x, y]) => r(x, y, 34, 300 - y, TEAL)),
    ...[[210, 190], [250, 180], [330, 195], [370, 185]].map(([x, y]) => r(x, y, 32, 300 - y, '#3E7C86')),
    r(290, 200, 32, 100, 'none', `stroke="${VER}" stroke-width="3" stroke-dasharray="6 4"`), t(306, 120, 'Infill:\nnew building\non an empty lot', { size: 14, anchor: 'middle', weight: 'bold', fill: VER }),
    ...[430, 452, 474, 496].map(x => r(x, 250, 20, 50, '#7FB3BB')),
    ...[560, 620, 680].map(x => r(x, 268, 34, 32, '#B8D8DD') + p(`M${x - 4} 268 L${x + 17} 252 L${x + 38} 268 Z`, '#B8D8DD')),
    r(730, 290, 70, 10, T.farm), t(765, 280, 'Farms', { size: 14, anchor: 'middle' }),
    t(90, 330, 'Downtown towers', { size: 14, anchor: 'middle' }), t(300, 330, 'Mid-rise apartments', { size: 14, anchor: 'middle' }),
    t(463, 330, 'Row houses', { size: 14, anchor: 'middle' }), t(630, 330, 'Houses on big lots', { size: 14, anchor: 'middle' }),
    t(410, 365, 'More people per square kilometer near the center; fewer toward the edge.', { size: 14, anchor: 'middle', fill: GREY }),
  ].join(''),
});

/* 6.7 infrastructure networks */
fig({
  id: 'infrastructure-networks', topic: 'infrastructure', w: 820, h: 430,
  title: 'Where the pipes, wires and rails reach',
  alt: 'A plan of a city. The older center is crossed by a grid of water mains, power lines and a rail line with stations. New homes and factories cluster near the stations. On the far edge, a newer settlement on a hillside has no water mains or rail, only a dirt road and a water tank truck.',
  body: [
    r(0, 0, 820, 430, '#FFFFFF'),
    r(40, 40, 420, 340, T.teal, 'rx="10"'), t(250, 66, 'Older city: served', { size: 15, anchor: 'middle', weight: 'bold', fill: TEAL }),
    ...[110, 170, 230, 290].map(y => l(60, y, 440, y, '#2F7FC1', 3)), ...[120, 220, 320].map(x => l(x, 80, x, 360, '#E0A100', 2, 'stroke-dasharray="8 5"')),
    l(20, 200, 700, 200, INK, 4), ...[130, 280, 420].map(x => r(x - 9, 191, 18, 18, '#FFFFFF', `stroke="${INK}" stroke-width="2"`)),
    ...[[150, 140], [170, 145], [300, 245], [320, 250], [400, 140]].map(([x, y]) => r(x, y, 14, 14, VER)),
    p('M560 120 L790 90 L800 360 L540 380 Z', T.sand), t(670, 140, 'Newer hillside settlement:', { size: 15, anchor: 'middle', weight: 'bold', fill: VER }), t(670, 160, 'not yet served', { size: 15, anchor: 'middle', weight: 'bold', fill: VER }),
    ...[[600, 220], [640, 250], [700, 230], [740, 280], [620, 300], [690, 320]].map(([x, y]) => r(x, y, 16, 12, '#B08A5A')),
    p('M460 330 C520 320 560 300 620 270 C680 245 720 260 770 240', 'none', `stroke="#B08A5A" stroke-width="4" stroke-dasharray="3 5"`), t(600, 352, 'Dirt road and a water truck', { size: 14 }),
    r(40, 392, 18, 4, '#2F7FC1'), t(66, 400, 'Water main', { size: 14 }), r(180, 392, 18, 4, '#E0A100'), t(206, 400, 'Power line', { size: 14 }),
    l(320, 394, 340, 394, INK, 4), t(348, 400, 'Rail line and stations', { size: 14 }), r(520, 388, 14, 14, VER), t(542, 400, 'New homes and workplaces', { size: 14 }),
  ].join(''),
});

/* 6.8 transit-oriented development versus sprawl */
fig({
  id: 'urban-sustainability-tod', topic: 'urban-sustainability', w: 820, h: 430,
  title: 'Building around a station versus spreading out',
  alt: 'Two panels. Left: a rail station in the middle of a ten-minute walking circle, with shops below apartments, offices, a small park, bike lanes and sidewalks, all close together. Right: houses on cul-de-sacs far from a strip mall and an office park, joined only by wide roads, so every trip is by car.',
  body: [
    r(0, 0, 820, 430, '#FFFFFF'),
    t(205, 30, 'Built around a station', { size: 17, anchor: 'middle', weight: 'bold', fill: TEAL }), t(615, 30, 'Spread out, built for cars', { size: 17, anchor: 'middle', weight: 'bold', fill: VER }),
    l(410, 45, 410, 400, '#C9CCC8', 2),
    c(205, 220, 150, T.teal), c(205, 220, 150, 'none', `stroke="${TEAL}" stroke-width="2" stroke-dasharray="8 6"`),
    l(40, 220, 370, 220, INK, 5), r(190, 208, 30, 24, '#FFFFFF', `stroke="${INK}" stroke-width="2"`), t(205, 254, 'Station', { size: 14, anchor: 'middle', weight: 'bold' }),
    ...[[130, 150], [250, 150], [130, 270], [250, 270]].map(([x, y]) => r(x, y, 34, 40, '#3E7C86') + r(x, y + 30, 34, 10, VER)),
    c(205, 130, 18, T.green, `stroke="${GREEN}" stroke-width="2"`), t(205, 108, 'Park', { size: 14, anchor: 'middle' }),
    t(205, 395, 'Shops below homes and offices,\nall within a 10-minute walk', { size: 14, anchor: 'middle' }),
    ...[[470, 90], [500, 120], [470, 150], [740, 300], [770, 330], [740, 360]].map(([x, y]) => r(x, y, 18, 14, '#B8D8DD')),
    p('M440 230 L800 230', 'none', `stroke="${GREY}" stroke-width="10"`), p('M500 230 C500 180 490 140 480 110', 'none', `stroke="${GREY}" stroke-width="4"`), p('M740 230 C740 270 750 300 755 330', 'none', `stroke="${GREY}" stroke-width="4"`),
    r(560, 160, 90, 40, VER), t(605, 152, 'Strip mall', { size: 14, anchor: 'middle' }), r(600, 270, 90, 40, PUR), t(645, 330, 'Office park', { size: 14, anchor: 'middle' }),
    t(615, 395, 'Homes, shops and jobs far apart:\nalmost every trip by car', { size: 14, anchor: 'middle' }),
  ].join(''),
});

/* 6.9 two kinds of urban data */
fig({
  id: 'urban-data-kinds', topic: 'urban-data', w: 820, h: 360,
  title: 'Two kinds of data about a city',
  alt: 'Two columns. Quantitative data: a census table of counts, a survey bar chart and a line of rising rents, which answer how many and how much. Qualitative data: speech bubbles from interviews, a field notebook and a map a resident drew, which answer how people feel and why.',
  body: [
    r(0, 0, 820, 360, '#FFFFFF'),
    r(20, 20, 380, 320, T.teal, 'rx="10"'), r(420, 20, 380, 320, T.ver, 'rx="10"'),
    t(210, 50, 'Quantitative: numbers', { size: 17, anchor: 'middle', weight: 'bold', fill: TEAL }), t(610, 50, 'Qualitative: words and meanings', { size: 17, anchor: 'middle', weight: 'bold', fill: VER }),
    r(45, 75, 150, 100, '#FFFFFF', `stroke="${INK}"`), ...[95, 115, 135, 155].map(y => l(45, y, 195, y, '#C9CCC8', 1)), l(120, 75, 120, 175, '#C9CCC8', 1), t(120, 195, 'Census counts', { size: 14, anchor: 'middle' }),
    ...[[230, 140, 30], [260, 110, 60], [290, 125, 45], [320, 95, 75]].map(([x, y, h]) => r(x, y, 22, h, TEAL)), l(225, 170, 350, 170, INK, 1.5), t(290, 195, 'Survey results', { size: 14, anchor: 'middle' }),
    p('M60 290 L120 275 L180 260 L240 235 L300 215 L360 210', 'none', `stroke="${VER}" stroke-width="3"`), l(55, 300, 370, 300, INK, 1.5), t(210, 325, 'Rent over time', { size: 14, anchor: 'middle' }),
    r(445, 80, 160, 50, '#FFFFFF', `stroke="${INK}" rx="14"`), t(525, 110, '"I grew up here."', { size: 14, anchor: 'middle' }),
    r(615, 140, 165, 50, '#FFFFFF', `stroke="${INK}" rx="14"`), t(697, 170, '"The bakery closed."', { size: 14, anchor: 'middle' }),
    r(445, 215, 140, 90, '#FFFFFF', `stroke="${INK}"`), ...[235, 252, 269, 286].map(y => l(455, y, 575, y, '#C9CCC8', 1)), t(515, 325, 'Field notes', { size: 14, anchor: 'middle' }),
    r(620, 215, 150, 90, '#FFFFFF', `stroke="${INK}"`), p('M635 290 C660 250 700 280 720 235 C735 260 750 240 760 230', 'none', `stroke="${GREEN}" stroke-width="3"`), t(695, 325, 'A map a resident drew', { size: 14, anchor: 'middle' }),
  ].join(''),
});

/* 6.10 neighborhood change */
fig({
  id: 'urban-change-challenges-cycle', topic: 'urban-change-challenges', w: 820, h: 400,
  title: 'How a neighborhood can change over decades',
  alt: 'A row of five boxes joined by arrows. One: lenders refuse loans or set worse terms in the neighborhood. Two: owners cannot repair or sell, so buildings decline and some are abandoned. Three: the city clears blocks for new projects, or investors buy cheap buildings. Four: new money arrives, rents and prices rise, and new shops open. Five: some long-time residents gain while others are priced out and move away. Below, policy responses: fair lending laws, inclusionary zoning, rent help and land trusts.',
  body: [
    r(0, 0, 820, 400, '#FFFFFF'),
    ...[
      [TEAL, 'Disinvestment', 'Lenders refuse\nloans or set\nworse terms here'],
      ['#3E7C86', 'Decline', 'Repairs stop;\nsome buildings\nare abandoned'],
      [PUR, 'Reinvestment', 'The city clears\nblocks, or buyers\npick up cheap\nbuildings'],
      [RP, 'Rising prices', 'New money, new\nshops, higher\nrents and taxes'],
      [VER, 'Gains and losses', 'Some owners gain;\nmany renters are\npriced out'],
    ].map(([col, head, body], i) => {
      const x = 15 + i * 162;
      return r(x, 40, 145, 200, '#FFFFFF', `stroke="${col}" stroke-width="3" rx="10"`) + r(x, 40, 145, 38, col, 'rx="10"') + t(x + 72, 65, head, { size: 14, anchor: 'middle', weight: 'bold', fill: '#FFFFFF' }) + t(x + 72, 110, body, { size: 14, anchor: 'middle' }) +
        (i < 4 ? l(x + 145, 140, x + 160, 140, INK, 2.5, 'marker-end="url(#ucc-ar)"') : '');
    }),
    r(15, 270, 790, 110, T.green, 'rx="10"'), t(30, 298, 'Responses cities and residents use', { size: 15, weight: 'bold', fill: '#05664B' }),
    t(30, 325, 'Fair lending and fair housing laws (the United States banned housing discrimination in 1968)', { size: 14 }),
    t(30, 348, 'Inclusionary zoning: new buildings must include some homes at prices lower-income families can pay', { size: 14 }),
    t(30, 371, 'Community land trusts, rent help and local food projects', { size: 14 }),
  ].join(''),
  defs: `<marker id="ucc-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${INK}"/></marker>`,
});

/* 6.11 metro with an urban growth boundary (stimulus with letters) */
fig({
  id: 'sustainability-challenges-growth-boundary', topic: 'sustainability-challenges', w: 820, h: 480,
  title: 'A metro area with an urban growth boundary',
  alt: 'An invented metro area. A river runs through the old downtown. The built-up area spreads around it, and a dashed line, the urban growth boundary, circles it with some empty land left inside. Outside the line are farms and forest. Letter W marks a rail station in a suburb. Letter X marks an empty lot inside the boundary. Letter Y marks farmland just outside the boundary. Letter Z marks an old factory site on the river near downtown.',
  body: [
    r(0, 0, 820, 480, T.farm),
    ...[[90, 60], [700, 80], [760, 400], [690, 440], [60, 200]].map(([x, y]) => c(x, y, 22, '#BFD9A8')),
    p('M0 250 C150 230 260 280 360 250 C470 215 560 260 820 230 L820 262 C560 292 470 247 360 282 C260 312 150 262 0 282 Z', T.water),
    p('M170 150 C250 90 470 80 590 140 C680 190 660 330 560 370 C450 410 270 400 190 340 C120 290 120 200 170 150 Z', T.sand, `stroke="#B9AE93" stroke-width="1"`),
    p('M150 130 C240 60 490 50 620 125 C720 185 700 350 580 395 C450 440 250 430 165 360 C90 300 95 190 150 130 Z', 'none', `stroke="${VER}" stroke-width="3" stroke-dasharray="12 7"`),
    c(380, 250, 45, T.teal, `stroke="${TEAL}" stroke-width="2"`), t(350, 312, 'Downtown', { size: 14, anchor: 'middle', weight: 'bold', fill: TEAL }),
    l(380, 250, 600, 150, INK, 3, 'stroke-dasharray="2 0"'), r(553, 160, 16, 16, '#FFFFFF', `stroke="${INK}" stroke-width="2"`),
    r(250, 320, 38, 26, '#FFFFFF', `stroke="${INK}" stroke-dasharray="4 3"`),
    r(415, 262, 40, 22, '#9A958C'),
    badge(590, 190, 'W'), badge(268, 360, 'X'), badge(700, 300, 'Y'), badge(450, 300, 'Z'),
    r(14, 352, 230, 118, '#FFFFFF', `stroke="#C9CCC8" rx="8"`),
    p('M28 376 L58 376', 'none', `stroke="${VER}" stroke-width="3" stroke-dasharray="8 5"`), t(68, 381, 'Urban growth boundary', { size: 14 }),
    r(28, 392, 30, 14, T.sand), t(68, 404, 'Built-up area', { size: 14 }),
    r(28, 416, 30, 14, T.farm, `stroke="#BFD9A8"`), t(68, 428, 'Farms and forest', { size: 14 }),
    l(28, 447, 58, 447, INK, 3), t(68, 452, 'Rail line', { size: 14 }),
    t(800, 470, 'Invented metro area for practice. Not to scale.', { size: 13, anchor: 'end', fill: GREY }),
  ].join(''),
});

/* 6.8 FRQ stimulus: rail lines and city limits */
fig({
  id: 'urban-sustainability-rail-limits', topic: 'urban-sustainability', w: 820, h: 500,
  title: 'Rail lines and city limits in an invented metro area',
  alt: 'An invented metro area. The central city has a solid outline, its city limits, and holds the downtown and an existing rail line with six stations. Around it, the built-up area extends far past the city limits into eight separate suburban cities, each outlined. A proposed rail extension, drawn dashed, would run from the end of the existing line through three suburban cities to an edge city of offices at a highway junction marked E. Letter H marks a large suburb where most homes are single-family houses on cul-de-sacs.',
  body: [
    r(0, 0, 820, 500, T.farm),
    p('M80 90 C200 40 600 40 720 100 C800 170 790 360 700 420 C580 480 230 480 120 410 C40 350 30 160 80 90 Z', T.sand),
    ...[
      'M80 90 C140 64 210 52 280 48 L300 150 L150 190 Z', 'M280 48 C400 40 520 44 600 60 L560 160 L300 150 Z', 'M600 60 C660 72 700 85 720 100 C770 140 790 210 790 250 L620 240 L560 160 Z',
      'M790 250 C790 320 760 390 700 420 L590 330 L620 240 Z', 'M700 420 C620 460 480 478 400 478 L420 340 L590 330 Z', 'M400 478 C300 478 200 460 120 410 L230 320 L420 340 Z',
      'M120 410 C60 365 40 300 42 240 L190 240 L230 320 Z', 'M42 240 C42 170 60 115 80 90 L150 190 L190 240 Z',
    ].map(d => p(d, 'none', `stroke="${GREY}" stroke-width="1.5"`)),
    p('M190 240 L150 190 L300 150 L560 160 L620 240 L590 330 L420 340 L230 320 Z', T.teal, `stroke="${TEAL}" stroke-width="3.5"`),
    c(390, 290, 26, '#7FB3BB'), t(390, 295, 'Downtown', { size: 14, anchor: 'middle', weight: 'bold', fill: INK }),
    l(250, 250, 520, 220, INK, 4), ...[[250, 250], [305, 244], [360, 238], [420, 232], [470, 226], [520, 220]].map(([x, y]) => r(x - 7, y - 7, 14, 14, '#FFFFFF', `stroke="${INK}" stroke-width="2"`)),
    p('M520 220 C580 210 640 190 700 175', 'none', `stroke="${INK}" stroke-width="4" stroke-dasharray="9 7"`),
    l(560, 60, 760, 330, GREY, 6), l(640, 90, 760, 160, GREY, 6),
    ...[[690, 150], [705, 160], [715, 146]].map(([x, y]) => r(x, y, 12, 26, VER)), badge(740, 120, 'E'),
    badge(170, 380, 'H'),
    r(20, 18, 270, 140, '#FFFFFF', `stroke="#C9CCC8" rx="8"`),
    r(34, 32, 30, 14, T.teal, `stroke="${TEAL}" stroke-width="2.5"`), t(74, 44, 'Central city (city limits)', { size: 14 }),
    r(34, 56, 30, 14, T.sand, `stroke="${GREY}"`), t(74, 68, 'Suburban cities (built up)', { size: 14 }),
    l(34, 87, 64, 87, INK, 4), t(74, 92, 'Existing rail line', { size: 14 }),
    p('M34 111 L64 111', 'none', `stroke="${INK}" stroke-width="4" stroke-dasharray="9 7"`), t(74, 116, 'Proposed extension', { size: 14 }),
    l(34, 135, 64, 135, GREY, 6), t(74, 140, 'Highway', { size: 14 }),
    t(800, 490, 'Invented metro area for practice. Not to scale.', { size: 13, anchor: 'end', fill: GREY }),
  ].join(''),
});

/* --- write */
function svg(f) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.w} ${f.h}" width="${f.w}" height="${f.h}" role="img" aria-labelledby="${f.id}-t ${f.id}-d" font-family="Arial, Helvetica, sans-serif">\n` +
    `<title id="${f.id}-t">${esc(f.title)}</title>\n<desc id="${f.id}-d">${esc(f.alt)}</desc>\n` + (f.defs ? `<defs>${f.defs}</defs>\n` : '') + f.body + '\n</svg>\n';
}
const check = process.argv.includes('--check');
let changed = 0;
const write = (path, s) => { const old = existsSync(path) ? readFileSync(path, 'utf8') : null; if (old !== s) { changed++; if (!check) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, s); } } };
const reg = {};
for (const f of FIGS) {
  write(join(ROOT, 'human-geography', 'figures', `${f.id}.svg`), svg(f));
  (reg[f.topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: f.alt };
}
for (const [topic, F] of Object.entries(reg)) write(join(ROOT, 'human-geography', 'data', 'figures', `${topic}.json`), JSON.stringify(F, null, 1) + '\n');
console.log(`${FIGS.length} figures, ${Object.keys(reg).length} topic registries; ${changed} file(s) ${check ? 'would change' : 'written'}.`);
if (check && changed) process.exit(1);
