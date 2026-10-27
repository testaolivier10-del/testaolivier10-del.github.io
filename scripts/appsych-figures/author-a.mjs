/* AP® Psychology figures for the "Research skills you need" chapter and
   topics 1.1-1.2 (author A). Diagrams are drawn from their labels; the data
   figures (scatterplots, the histogram, the normal curves) are drawn from the
   numbers listed here, with every statistic they print computed by
   ApPsychStats (psychology/assets/psy-stats.js), so a figure always shows the
   data it claims to show. Every data figure's numbers are invented for
   practice and its caption says so.
   Writes
     psychology/figures/<id>.svg
     psychology/data/figures/<topic>.json   (the registry entries)

     node scripts/appsych-figures/author-a.mjs

   Style (docs/appsych-briefs/content-common.md): white background, role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, cerulean #084F78 for
   emphasis, then Okabe-Ito vermillion #D55E00, green #009E73 and reddish
   purple #CC79A7. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Stats } from '../lib/appsych-mathlib.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'psychology', 'figures');
const REG = join(ROOT, 'psychology', 'data', 'figures');
const INK = '#1F2A28', CER = '#084F78', VERM = '#D55E00', GREEN = '#009E73', PURP = '#CC79A7', GREY = '#6B7370', GRID = '#D6DEE3', TINT = '#E3F0F8', SOFT = '#F4F7F9', WARM = '#FBE6D9', MINT = '#DDF2EA';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = v => Math.round(v * 10) / 10;
function text(x, y, s, o = {}) {
  const a = [`x="${r1(x)}"`, `y="${r1(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.fill || INK}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.bold) a.push('font-weight="700"');
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}
// Several lines, centered or left, from a string with \n.
function lines(x, y, s, o = {}) { const lh = o.lh || (o.size || 14) * 1.3; return String(s).split('\n').map((l, i) => text(x, y + i * lh, l, o)).join(''); }
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.4}"/>`;
const path = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` fill-opacity="${o.op}"` : ''} stroke-linejoin="round"/>`;
const marker = (id, c) => `<marker id="ar-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
const DEFS = `<defs>${marker('ink', INK)}${marker('cer', CER)}${marker('verm', VERM)}${marker('green', GREEN)}</defs>`;
function box(x, y, w, h, label, o = {}) {
  const n = String(label).split('\n').length, size = o.size || 14, lh = size * 1.3;
  return rect(x, y, w, h, { fill: o.fill || SOFT, stroke: o.stroke || CER, w: o.w || 1.8 }) +
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

const figs = {};
function fig(topic, id, w, h, title, alt, body) {
  mkdirSync(FIG, { recursive: true });
  writeFileSync(join(FIG, `${id}.svg`), svg(w, h, title, alt, body));
  (figs[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

// A seeded random generator, so the dot pictures are the same on every run.
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ------------------------------------------- research-methods: an experiment */
{
  const W = 820, H = 440, b = [];
  b.push(text(W / 2, 30, 'An experiment, step by step', { anchor: 'middle', size: 18, bold: true }));
  b.push(box(300, 50, 220, 52, 'Participants\n(60 volunteers)', { bold: true }));
  b.push(line(410, 102, 410, 128, { arrow: 'ink' }));
  b.push(box(250, 130, 320, 52, 'Random assignment\n(a coin flip decides each person\'s group)', { fill: TINT, size: 13 }));
  b.push(line(360, 182, 210, 222, { arrow: 'cer', stroke: CER }));
  b.push(line(460, 182, 610, 222, { arrow: 'verm', stroke: VERM }));
  b.push(box(60, 224, 300, 70, 'Experimental group\ngets the real treatment\n(one level of the independent variable)', { stroke: CER, size: 13 }));
  b.push(box(460, 224, 300, 70, 'Control group\ngets a placebo: a look-alike\nwith no active ingredient', { stroke: VERM, size: 13 }));
  b.push(line(210, 294, 360, 330, { arrow: 'ink' }));
  b.push(line(610, 294, 460, 330, { arrow: 'ink' }));
  b.push(box(230, 332, 360, 52, 'Measure the dependent variable\nexactly as operationally defined', { size: 13 }));
  b.push(line(410, 384, 410, 398, { arrow: 'ink' }));
  b.push(text(410, 420, 'Compare the groups: because only the treatment differed, a difference points to cause and effect.', { anchor: 'middle', size: 13, bold: true, fill: CER }));
  b.push(rect(600, 46, 200, 120, { fill: '#FFFFFF', stroke: GREY, dash: '5 4', rx: 10 }));
  b.push(lines(612, 68, 'Double-blind:\nneither the participants\nnor the researchers who\nmeasure them know who\nis in which group.', { size: 12, lh: 18 }));
  fig('research-methods', 'research-methods-experiment', W, H, 'The steps of an experiment',
    'Sixty volunteers are randomly assigned, by a coin flip, to two groups. The experimental group gets the real treatment, one level of the independent variable; the control group gets a placebo, a look-alike with no active ingredient. Both groups are then measured on the dependent variable as it is operationally defined, and the groups are compared: because only the treatment differed, a difference points to cause and effect. A side note explains double-blind: neither the participants nor the researchers who measure them know who is in which group.', b.join(''));
}

/* ------------------------------ research-sampling: sampling versus assignment */
{
  const W = 860, H = 430, b = [], rnd = rng(7);
  b.push(text(W / 2, 30, 'Two different random steps', { anchor: 'middle', size: 18, bold: true }));
  // Population: 8 x 6 dots in three kinds (ages, say), mixed.
  const pop = [], kinds = [CER, VERM, GREEN];
  for (let i = 0; i < 48; i++) pop.push({ x: 50 + (i % 8) * 30 + (rnd() - 0.5) * 8, y: 90 + Math.floor(i / 8) * 34 + (rnd() - 0.5) * 8, c: kinds[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2] });
  // Shuffle the colors so groups are mixed.
  for (let i = pop.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pop[i].c, pop[j].c] = [pop[j].c, pop[i].c]; }
  b.push(rect(30, 64, 270, 230, { fill: SOFT, stroke: GREY }));
  b.push(text(165, 56, 'Population: everyone the study is about', { anchor: 'middle', size: 13, bold: true }));
  // Pick 12 at random, 4 of each kind, so the sample mirrors the population.
  const picked = [];
  for (const c of kinds) { const pool = pop.filter(p => p.c === c && !p.sel); for (let k = 0; k < 4; k++) { const p = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; p.sel = true; picked.push(p); } }
  for (const p of pop) b.push(circle(p.x, p.y, 8, { fill: p.c, stroke: p.sel ? INK : 'none', w: 2.4 }));
  b.push(lines(165, 316, 'Step 1. RANDOM SAMPLING\nEvery member has the same chance\nof being chosen (outlined dots).\nIt decides WHO is studied.', { anchor: 'middle', size: 13, lh: 18 }));
  b.push(text(165, 396, 'It lets results generalize to the population.', { anchor: 'middle', size: 13, bold: true, fill: CER }));
  b.push(line(310, 180, 370, 180, { arrow: 'ink', w: 2 }));
  // Sample of 12.
  b.push(rect(380, 120, 150, 120, { fill: '#FFFFFF', stroke: INK }));
  b.push(text(455, 112, 'Sample (12 people)', { anchor: 'middle', size: 13, bold: true }));
  picked.forEach((p, i) => b.push(circle(405 + (i % 4) * 33, 145 + Math.floor(i / 4) * 35, 8, { fill: p.c })));
  b.push(line(530, 160, 590, 120, { arrow: 'ink', w: 2 }));
  b.push(line(530, 200, 590, 240, { arrow: 'ink', w: 2 }));
  // Assignment: shuffle the 12 into two groups of 6.
  const order = picked.map((p, i) => ({ p, k: rnd() })).sort((a, b2) => a.k - b2.k).map(o => o.p);
  b.push(rect(600, 70, 220, 90, { fill: TINT, stroke: CER }));
  b.push(text(710, 62, 'Group 1 (treatment)', { anchor: 'middle', size: 13, bold: true }));
  b.push(rect(600, 200, 220, 90, { fill: WARM, stroke: VERM }));
  b.push(text(710, 192, 'Group 2 (control)', { anchor: 'middle', size: 13, bold: true }));
  order.forEach((p, i) => { const g = i < 6 ? 0 : 1, j = i % 6; b.push(circle(640 + (j % 3) * 70, (g ? 225 : 95) + Math.floor(j / 3) * 40, 8, { fill: p.c })); });
  b.push(lines(710, 316, 'Step 2. RANDOM ASSIGNMENT\nChance decides which condition\neach person in the sample gets.\nIt decides WHICH GROUP.', { anchor: 'middle', size: 13, lh: 18 }));
  b.push(text(710, 396, 'It lets an experiment claim cause and effect.', { anchor: 'middle', size: 13, bold: true, fill: CER }));
  b.push(text(W / 2, 422, 'A study can use either step, both, or neither. Colors stand for kinds of people (for example, age groups).', { anchor: 'middle', size: 12, fill: GREY }));
  fig('research-sampling', 'research-sampling-steps', W, H, 'Random sampling versus random assignment',
    'Left: a population of 48 people drawn as dots in three colors (three kinds of people, such as age groups). Random sampling gives every member the same chance of being chosen; 12 are chosen, 4 of each color, so the sample mirrors the population. It decides who is studied and lets results generalize to the population. Middle: the sample of 12. Right: random assignment uses chance to split the 12 into a treatment group and a control group of 6 each. It decides which condition each person gets and lets an experiment claim cause and effect. A study can use either step, both, or neither.', b.join(''));
}

/* ------------------------------- stats-correlation: three scatterplots */
const CORR_PANELS = [
  { name: 'Positive', pts: [[1, 2], [2, 3], [3, 3], [4, 5], [5, 4], [6, 6], [7, 7], [8, 7], [9, 9], [10, 9]], color: CER },
  { name: 'Near zero', pts: [[1, 6], [2, 3], [3, 8], [4, 5], [5, 2], [6, 7], [7, 4], [8, 8], [9, 3], [10, 6]], color: GREY },
  { name: 'Negative', pts: [[1, 8], [2, 9], [3, 6], [4, 7], [5, 7], [6, 4], [7, 6], [8, 3], [9, 4], [10, 2]], color: VERM },
];
{
  const W = 860, H = 360, b = [];
  b.push(text(W / 2, 28, 'Three scatterplots: direction and strength', { anchor: 'middle', size: 18, bold: true }));
  CORR_PANELS.forEach((P, k) => {
    const x0 = 40 + k * 280, y0 = 60, pw = 230, ph = 220;
    const sx = x => x0 + 20 + (x - 0) / 11 * (pw - 20), sy = y => y0 + ph - (y - 0) / 10 * ph;
    b.push(line(x0 + 20, y0 + ph, x0 + pw, y0 + ph, { w: 1.4 }));
    b.push(line(x0 + 20, y0, x0 + 20, y0 + ph, { w: 1.4 }));
    const r = Stats.r(P.pts), sl = Stats.slope(P.pts), ic = Stats.intercept(P.pts);
    if (Math.abs(r) >= 0.1) b.push(line(sx(0.5), sy(ic + sl * 0.5), sx(10.5), sy(ic + sl * 10.5), { stroke: P.color, dash: '6 5', w: 2 }));
    for (const p of P.pts) b.push(circle(sx(p[0]), sy(p[1]), 6, { fill: P.color }));
    const rs = (r >= 0 ? '+' : '−') + Math.abs(r).toFixed(2);
    b.push(text(x0 + 20 + (pw - 20) / 2, y0 + ph + 30, `${P.name}: r = ${rs}`, { anchor: 'middle', size: 15, bold: true, fill: P.color === GREY ? INK : P.color }));
    b.push(text(x0 + 20 + (pw - 20) / 2, y0 + ph + 50, `(${Stats.describe(r)})`, { anchor: 'middle', size: 13 }));
    P.r = r;
  });
  b.push(text(W / 2, 350, 'Invented data. The dashed line is the line of best fit; the sign of r gives the direction, its size the strength.', { anchor: 'middle', size: 12, fill: GREY }));
  const rs = CORR_PANELS.map(P => (P.r >= 0 ? '+' : '-') + Math.abs(P.r).toFixed(2));
  fig('stats-correlation', 'stats-correlation-three', W, H, 'Positive, near-zero and negative correlations',
    `Three scatterplots of ten invented points each. Left: points rise from lower left to upper right, r = ${rs[0]}, ${Stats.describe(CORR_PANELS[0].r)}, with a rising line of best fit. Middle: points scattered with no pattern, r = ${rs[1]}, ${Stats.describe(CORR_PANELS[1].r)}. Right: points fall from upper left to lower right, r = ${rs[2]}, ${Stats.describe(CORR_PANELS[2].r)}, with a falling line of best fit. The sign of r gives the direction and its size the strength.`, b.join(''));
}

/* ------------------------------- research-ethics: safeguards on a timeline */
{
  const W = 860, H = 400, b = [];
  b.push(text(W / 2, 30, 'Ethical safeguards across a study', { anchor: 'middle', size: 18, bold: true }));
  b.push(line(40, 80, 820, 80, { w: 3, arrow: 'ink' }));
  const st = [['Before', 130], ['At the start', 330], ['During', 530], ['After', 730]];
  for (const [s, x] of st) { b.push(circle(x, 80, 8, { fill: CER })); b.push(text(x, 64, s, { anchor: 'middle', size: 14, bold: true })); }
  b.push(box(40, 110, 180, 150, 'Review board\napproval:\nan institutional\nreview board (IRB),\nor an animal care\ncommittee, checks\nthe plan', { size: 13 }));
  b.push(box(240, 110, 180, 150, 'Informed consent:\nparticipants learn\nwhat will happen\nand agree. Minors\ngive assent, and a\nparent consents.', { size: 13 }));
  b.push(box(440, 110, 180, 150, 'Right to withdraw\nat any time.\nProtection from\nharm: risks kept\nminimal.\nConfidentiality.', { size: 13 }));
  b.push(box(640, 110, 180, 150, 'Debriefing:\nthe true purpose\nis explained,\nincluding any\ndeception, and\nquestions answered.', { size: 13 }));
  b.push(rect(40, 290, 780, 80, { fill: SOFT, stroke: GREY, dash: '5 4' }));
  b.push(lines(430, 318, 'On the exam, name a safeguard the summary actually describes, and say how the researchers applied it\n(for example, "parents signed consent forms and each student agreed before the first session").', { anchor: 'middle', size: 13, lh: 22 }));
  fig('research-ethics', 'research-ethics-timeline', W, H, 'Ethical safeguards across a study',
    'A timeline with four stages. Before: an institutional review board, or an animal care committee for animal research, reviews and approves the plan. At the start: informed consent, where participants learn what will happen and agree; minors give assent and a parent consents. During: the right to withdraw at any time, protection from harm with risks kept minimal, and confidentiality. After: debriefing, where the true purpose is explained, including any deception. A note says that on the exam you name a safeguard the summary describes and say how the researchers applied it.', b.join(''));
}

/* ------------------------- stats-descriptive: a skewed histogram, three centers */
export const SKEW_DATA = [1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7, 8, 10, 12];
{
  const W = 820, H = 420, b = [], D = SKEW_DATA;
  const mean = Stats.mean(D), median = Stats.median(D), mode = Stats.mode(D);
  b.push(text(W / 2, 30, 'A positively skewed distribution: mode, median and mean', { anchor: 'middle', size: 18, bold: true }));
  const x0 = 80, y0 = 60, pw = 680, ph = 260, xmax = 13, ymax = 7;
  const sx = x => x0 + x / xmax * pw, sy = y => y0 + ph - y / ymax * ph;
  for (let y = 0; y <= ymax; y++) { b.push(line(x0, sy(y), x0 + pw, sy(y), { stroke: GRID, w: 1 })); b.push(text(x0 - 10, sy(y) + 5, String(y), { anchor: 'end', size: 12 })); }
  const counts = {};
  for (const v of D) counts[v] = (counts[v] || 0) + 1;
  for (let v = 1; v <= 12; v++) {
    const c = counts[v] || 0;
    if (c) b.push(rect(sx(v - 0.5), sy(c), sx(1) - sx(0), sy(0) - sy(c), { fill: TINT, stroke: CER, rx: 0, w: 1.4 }));
    b.push(text(sx(v), y0 + ph + 20, String(v), { anchor: 'middle', size: 12 }));
  }
  b.push(line(x0, y0 + ph, x0 + pw, y0 + ph, { w: 1.4 }));
  b.push(line(x0, y0, x0, y0 + ph, { w: 1.4 }));
  b.push(text(x0 + pw / 2, y0 + ph + 44, 'Hours of sleep lost per week (invented data, 25 students)', { anchor: 'middle', size: 13, bold: true }));
  b.push(text(28, y0 + ph / 2, 'Number of students', { anchor: 'middle', size: 13, bold: true }).replace('<text', `<text transform="rotate(-90 28 ${y0 + ph / 2})"`));
  const marks = [[mode, 'Mode', GREEN, 0], [median, 'Median', PURP, 1], [mean, 'Mean', VERM, 2]];
  for (const [v, name, c, k] of marks) {
    b.push(line(sx(v), y0 - 2, sx(v), y0 + ph, { stroke: c, w: 3, dash: k === 0 ? '' : k === 1 ? '8 4' : '3 3' }));
    const ly = y0 + 22 + k * 26;
    b.push(line(560, ly - 5, 600, ly - 5, { stroke: c, w: 3, dash: k === 0 ? '' : k === 1 ? '8 4' : '3 3' }));
    b.push(text(610, ly, `${name} = ${+v.toFixed(2)}`, { size: 14, bold: true, fill: c === PURP ? '#8E3F72' : c === GREEN ? '#00785A' : '#B04400' }));
  }
  b.push(text(sx(10.8), sy(2.6), 'long tail to the right', { anchor: 'middle', size: 13, italic: true }));
  b.push(line(sx(9.4), sy(2.2), sx(11.6), sy(1.4), { arrow: 'ink' }));
  fig('stats-descriptive', 'stats-descriptive-skew', W, H, 'A positively skewed histogram with its mode, median and mean',
    `A histogram of invented data: hours of sleep lost per week for 25 students. Most students lost 1 to 5 hours; a few lost 7, 8, 10 and 12, making a long tail to the right (positive skew). The mode is ${mode}, the median is ${median} and the mean is ${+mean.toFixed(2)}: the few high values pull the mean toward the tail, past the median.`, b.join(''));
}

/* ----------------------------- stats-normal: the curve and the 68-95-99.7 rule */
function normalPath(sx, sy, mu, sd, a, b0, n = 160) {
  const pdf = x => Math.exp(-(((x - mu) / sd) ** 2) / 2);
  let d = '';
  for (let i = 0; i <= n; i++) { const x = a + (b0 - a) * i / n; d += (i ? ' L' : 'M') + r1(sx(x)) + ' ' + r1(sy(pdf(x))); }
  return d;
}
{
  const W = 860, H = 430, b = [];
  b.push(text(W / 2, 30, 'The normal curve and the 68-95-99.7 rule', { anchor: 'middle', size: 18, bold: true }));
  const x0 = 60, pw = 740, base = 300, ph = 230;
  const sx = z => x0 + (z + 3.5) / 7 * pw, sy = h => base - h * ph;
  // Bands shaded by distance from the mean.
  const pdf = z => Math.exp(-z * z / 2);
  const shade = (a, c, fill) => { let d = `M${r1(sx(a))} ${base}`; for (let i = 0; i <= 40; i++) { const z = a + (c - a) * i / 40; d += ` L${r1(sx(z))} ${r1(sy(pdf(z)))}`; } return path(d + ` L${r1(sx(c))} ${base} Z`, { fill, stroke: 'none' }); };
  for (const [a, c, f] of [[-1, 1, '#BBD9EC'], [-2, -1, '#DCEBF5'], [1, 2, '#DCEBF5'], [-3, -2, '#EEF5FA'], [2, 3, '#EEF5FA']]) b.push(shade(a, c, f));
  b.push(path(normalPath(sx, sy, 0, 1, -3.5, 3.5), { stroke: CER, w: 3 }));
  b.push(line(x0, base, x0 + pw, base, { w: 1.4 }));
  for (let z = -3; z <= 3; z++) b.push(line(sx(z), base, sx(z), sy(pdf(z)), { stroke: z ? GREY : INK, dash: z ? '5 4' : '', w: z ? 1.4 : 2 }));
  const bands = [[0.5, '34%', 0.45], [1.5, '13.5%', 0.14], [2.5, '2.35%', 0.07]];
  for (const [m, t, h] of bands) for (const s of [-1, 1]) b.push(text(sx(s * m), sy(h), t, { anchor: 'middle', size: 14, bold: true }));
  b.push(text(sx(-3.3), sy(0.12), '0.15%', { anchor: 'middle', size: 12 }));
  b.push(text(sx(3.3), sy(0.12), '0.15%', { anchor: 'middle', size: 12 }));
  b.push(text(14, base + 24, 'z score', { size: 13, bold: true }));
  b.push(text(14, base + 48, 'Percentile', { size: 13, bold: true }));
  for (let z = -3; z <= 3; z++) {
    b.push(text(sx(z), base + 24, z === 0 ? '0' : (z > 0 ? '+' : '−') + Math.abs(z), { anchor: 'middle', size: 14, bold: true, fill: CER }));
    b.push(text(sx(z), base + 48, String(Stats.percentileRule(z)), { anchor: 'middle', size: 13 }));
  }
  // Brackets for 68, 95, 99.7.
  const br = (z, y, t) => line(sx(-z), y, sx(z), y, { stroke: VERM, w: 2 }) + line(sx(-z), y - 6, sx(-z), y + 6, { stroke: VERM, w: 2 }) + line(sx(z), y - 6, sx(z), y + 6, { stroke: VERM, w: 2 }) + text(sx(0), y - 6, t, { anchor: 'middle', size: 13, bold: true, fill: '#B04400' });
  b.push(br(1, 340 + 30, `${Stats.rulePct(-1, 1)}% within 1 SD`));
  b.push(br(2, 340 + 52, `${Stats.rulePct(-2, 2)}% within 2 SD`));
  b.push(br(3, 340 + 74, `${Stats.rulePct(-3, 3)}% within 3 SD`));
  fig('stats-normal', 'stats-normal-curve', W, H, 'The normal curve with the 68-95-99.7 rule',
    'A bell-shaped normal curve with vertical lines at the mean and at 1, 2 and 3 standard deviations on each side. The bands hold 34% of scores between the mean and 1 SD on each side, 13.5% between 1 and 2 SD, 2.35% between 2 and 3 SD, and 0.15% beyond 3 SD. Below the axis, z scores run from minus 3 to plus 3, with percentiles 0.15, 2.5, 16, 50, 84, 97.5 and 99.85. Brackets show 68% of scores within 1 SD of the mean, 95% within 2 SD and 99.7% within 3 SD.', b.join(''));
}

/* --------------------- stats-significance: a small and a large effect size */
{
  const W = 860, H = 360, b = [];
  b.push(text(W / 2, 28, 'Effect size: how far apart two groups are', { anchor: 'middle', size: 18, bold: true }));
  const panel = (x0, gap, title, sub) => {
    const pw = 360, base = 250, ph = 160;
    const sx = z => x0 + (z + 3.5) / (7 + gap) * pw, sy = h => base - h * ph;
    b.push(text(x0 + pw / 2, 64, title, { anchor: 'middle', size: 15, bold: true }));
    b.push(path(normalPath(sx, sy, 0, 1, -3.5, 3.5) + ` L${r1(sx(3.5))} ${base} L${r1(sx(-3.5))} ${base} Z`, { fill: CER, op: 0.12, stroke: CER, w: 2.4 }));
    b.push(path(normalPath(sx, sy, gap, 1, gap - 3.5, gap + 3.5) + ` L${r1(sx(gap + 3.5))} ${base} L${r1(sx(gap - 3.5))} ${base} Z`, { fill: VERM, op: 0.12, stroke: VERM, w: 2.4, dash: '7 4' }));
    b.push(line(x0, base, x0 + pw, base, { w: 1.4 }));
    b.push(line(sx(0), sy(1), sx(0), base, { stroke: CER, w: 1.6 }));
    b.push(line(sx(gap), sy(1), sx(gap), base, { stroke: VERM, w: 1.6 }));
    b.push(text(x0 + pw / 2, base + 26, sub, { anchor: 'middle', size: 13 }));
  };
  panel(40, 0.2, 'Small effect', 'Means 0.2 standard deviations apart: lots of overlap');
  panel(460, 0.8, 'Large effect', 'Means 0.8 standard deviations apart: less overlap');
  b.push(rect(40, 296, 210, 24, { fill: 'none', stroke: 'none' }));
  b.push(line(60, 312, 96, 312, { stroke: CER, w: 2.4 })); b.push(text(104, 317, 'Control group', { size: 13 }));
  b.push(line(230, 312, 266, 312, { stroke: VERM, w: 2.4, dash: '7 4' })); b.push(text(274, 317, 'Treatment group', { size: 13 }));
  b.push(text(W / 2, 346, 'With a large enough sample, even the small effect can be statistically significant: significance is not size.', { anchor: 'middle', size: 13, bold: true, fill: CER }));
  fig('stats-significance', 'stats-significance-effect', W, H, 'A small and a large effect size',
    'Two panels, each with two overlapping bell curves: a control group and a treatment group. Left, a small effect: the means are 0.2 standard deviations apart and the curves overlap almost completely. Right, a large effect: the means are 0.8 standard deviations apart and the curves overlap less. A note says that with a large enough sample even the small effect can be statistically significant, because significance is not size.', b.join(''));
}

/* --------------------------- heredity-environment: twin and adoption studies */
{
  const W = 860, H = 420, b = [];
  b.push(text(W / 2, 30, 'Separating heredity and environment', { anchor: 'middle', size: 18, bold: true }));
  // Twin study panel.
  b.push(rect(30, 50, 390, 340, { fill: SOFT, stroke: GREY }));
  b.push(text(225, 76, 'Twin study', { anchor: 'middle', size: 16, bold: true, fill: CER }));
  const person = (x, y, c) => circle(x, y - 22, 11, { fill: c }) + path(`M${x - 16} ${y + 16} Q${x} ${y - 14} ${x + 16} ${y + 16} Z`, { fill: c });
  b.push(person(95, 140, CER) + person(140, 140, CER));
  b.push(lines(118, 180, 'Identical twins\nshare all\ntheir genes', { anchor: 'middle', size: 13, lh: 17 }));
  b.push(person(300, 140, VERM) + person(345, 140, GREEN));
  b.push(lines(322, 180, 'Fraternal twins\nshare about half,\nlike other siblings', { anchor: 'middle', size: 13, lh: 17 }));
  b.push(rect(55, 240, 340, 46, { fill: '#FFFFFF', stroke: CER }));
  b.push(lines(225, 259, 'Both kinds of twins grow up in the same home\nat the same time.', { anchor: 'middle', size: 13, lh: 17 }));
  b.push(lines(225, 318, 'If identical twins are more alike on a trait\nthan fraternal twins, genes contribute\nto differences in that trait.', { anchor: 'middle', size: 13, bold: true, lh: 18 }));
  // Adoption study panel.
  b.push(rect(440, 50, 390, 340, { fill: SOFT, stroke: GREY }));
  b.push(text(635, 76, 'Adoption study', { anchor: 'middle', size: 16, bold: true, fill: CER }));
  b.push(box(460, 100, 160, 56, 'Biological parents\n(share genes)', { size: 13, stroke: VERM }));
  b.push(box(650, 100, 160, 56, 'Adoptive parents\n(share the home)', { size: 13, stroke: GREEN }));
  b.push(box(555, 210, 160, 46, 'Adopted child', { size: 14, bold: true }));
  b.push(line(540, 156, 600, 208, { arrow: 'verm', stroke: VERM, w: 2 }));
  b.push(line(730, 156, 670, 208, { arrow: 'green', stroke: GREEN, w: 2 }));
  b.push(lines(635, 296, 'More like the biological parents:\nevidence for heredity.\nMore like the adoptive parents:\nevidence for environment.', { anchor: 'middle', size: 13, bold: true, lh: 18 }));
  b.push(text(W / 2, 410, 'Most traits show both: genes and experience work together.', { anchor: 'middle', size: 13, fill: GREY }));
  fig('heredity-environment', 'heredity-environment-designs', W, H, 'Twin studies and adoption studies',
    'Left panel, twin study: identical twins share all their genes; fraternal twins share about half, like other siblings. Both kinds grow up in the same home at the same time. If identical twins are more alike on a trait than fraternal twins, genes contribute to differences in that trait. Right panel, adoption study: an adopted child shares genes with the biological parents and a home with the adoptive parents. Being more like the biological parents is evidence for heredity; being more like the adoptive parents is evidence for environment. A note says most traits show both.', b.join(''));
}

/* --------------------------------- nervous-system: the divisions as a tree */
{
  const W = 900, H = 480, b = [];
  b.push(text(W / 2, 30, 'Divisions of the nervous system', { anchor: 'middle', size: 18, bold: true }));
  b.push(box(340, 46, 220, 44, 'Nervous system', { bold: true, size: 16, fill: TINT }));
  b.push(line(400, 90, 220, 126, { w: 2 })); b.push(line(500, 90, 655, 126, { w: 2 }));
  b.push(box(90, 126, 260, 56, 'Central nervous system (CNS)\nbrain and spinal cord', { bold: true, size: 14, stroke: CER }));
  b.push(box(520, 126, 270, 56, 'Peripheral nervous system (PNS)\nnerves linking the CNS to the body', { bold: true, size: 13.5, stroke: VERM }));
  b.push(lines(220, 212, 'Takes in information, decides,\nsends out commands. The spinal\ncord carries messages between\nthe brain and the body.', { anchor: 'middle', size: 13, lh: 18 }));
  b.push(line(610, 182, 485, 224, { w: 2 })); b.push(line(700, 182, 765, 224, { w: 2 }));
  b.push(box(380, 224, 210, 64, 'Somatic\nvoluntary: moves\nskeletal muscles', { size: 13, stroke: VERM }));
  b.push(box(660, 224, 210, 64, 'Autonomic\nautomatic: heart,\nlungs, glands, gut', { size: 13, stroke: VERM }));
  b.push(lines(485, 310, 'Kicking a ball, typing,\nfeeling a tap on the arm', { anchor: 'middle', size: 12.5, lh: 17, fill: GREY }));
  b.push(line(720, 288, 640, 340, { w: 2 })); b.push(line(810, 288, 815, 340, { w: 2 }));
  b.push(box(560, 340, 165, 124, 'Sympathetic\narouses: heart\nspeeds, pupils\nwiden, digestion\nslows, sweating', { size: 13, stroke: VERM, fill: WARM }));
  b.push(box(735, 340, 155, 124, 'Parasympathetic\ncalms: heart\nslows, digestion\nresumes', { size: 13, stroke: GREEN, fill: MINT }));
  b.push(rect(30, 352, 500, 100, { fill: '#FFFFFF', stroke: GREY, dash: '5 4' }));
  b.push(lines(46, 376, 'Example: a car horn blares as you step off the curb.\nSympathetic: your heart pounds and you jump back\n(the jump itself is somatic). A minute later the\nparasympathetic division brings your heart rate back down.', { size: 13, lh: 19 }));
  fig('nervous-system', 'nervous-system-divisions', W, H, 'Divisions of the nervous system',
    'A tree diagram. The nervous system divides into the central nervous system, the brain and spinal cord, which takes in information, decides and sends commands, and the peripheral nervous system, the nerves linking the central nervous system to the body. The peripheral system divides into the somatic system, voluntary, which moves skeletal muscles (kicking a ball, typing, feeling a tap), and the autonomic system, automatic, which runs the heart, lungs, glands and gut. The autonomic system divides into the sympathetic division, which arouses (heart speeds, pupils widen, digestion slows, sweating rises), and the parasympathetic division, which calms (heart slows, digestion resumes). An example: a car horn blares; the sympathetic division makes the heart pound, the jump back is somatic, and the parasympathetic division later brings the heart rate down.', b.join(''));
}

mkdirSync(REG, { recursive: true });
for (const [topic, entries] of Object.entries(figs)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(Object.values(figs).flatMap(o => Object.keys(o)).join('\n'));
