/* AP® Psychology figures for Unit 2, Cognition, topics 2.1-2.8 (author C).
   Diagrams are drawn from coordinates; the data figures are drawn from the
   numbers listed here: the serial position curve (invented data for practice,
   labeled so), Ebbinghaus's (1885) savings figures for the forgetting curve,
   and the IQ scale on a normal curve (mean 100, SD 15, the 68-95-99.7 rule from
   ApPsychStats), so a figure always shows the data it claims to show.
   Writes
     psychology/figures/<id>.svg
     psychology/data/figures/<topic>.json   (the registry entries)

     node scripts/appsych-figures/author-c.mjs

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
  if (o.rotate) a.push(`transform="rotate(${o.rotate} ${r1(x)} ${r1(y)})"`);
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}
function lines(x, y, s, o = {}) { const lh = o.lh || (o.size || 14) * 1.3; return String(s).split('\n').map((l, i) => text(x, y + i * lh, l, o)).join(''); }
const rect = (x, y, w, h, o = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}${o.arrow2 ? ` marker-start="url(#ar-${o.arrow2})"` : ''}/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${o.fill || INK}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.4}"/>`;
const path = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` fill-opacity="${o.op}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
const poly = (pts, o = {}) => path('M' + pts.map(p => `${r1(p[0])} ${r1(p[1])}`).join(' L') + ' Z', o);
const marker = (id, c) => `<marker id="ar-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
const DEFS = `<defs>${marker('ink', INK)}${marker('cer', CER)}${marker('verm', VERM)}${marker('green', GREEN)}${marker('grey', GREY)}</defs>`;
function box(x, y, w, h, label, o = {}) {
  const n = String(label).split('\n').length, size = o.size || 14, lh = size * 1.3;
  return rect(x, y, w, h, { fill: o.fill || SOFT, stroke: o.stroke || CER, w: o.w || 1.8, dash: o.dash }) +
    lines(x + w / 2, y + h / 2 - (n - 1) * lh / 2 + size * 0.36, label, { anchor: 'middle', size, bold: o.bold, fill: o.ink || INK, lh });
}

function svg(id, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
${DEFS}<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}

const figs = {};
function fig(topic, id, w, h, title, alt, body) {
  mkdirSync(FIG, { recursive: true });
  writeFileSync(join(FIG, `${id}.svg`), svg(id, w, h, title, alt, body));
  (figs[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* A plain axes frame for the line figures: returns { sx, sy, body }. */
function axes(o) {
  const { x0, y0, w, h, xmin, xmax, ymin, ymax, xticks, yticks, xlabel, ylabel, xfmt = v => v, yfmt = v => v, xlabelDy = 0 } = o;
  const sx = v => x0 + (v - xmin) / (xmax - xmin) * w, sy = v => y0 + h - (v - ymin) / (ymax - ymin) * h;
  const b = [];
  for (const t of yticks) { b.push(line(x0, sy(t), x0 + w, sy(t), { stroke: GRID, w: 1 })); b.push(text(x0 - 8, sy(t) + 4, yfmt(t), { anchor: 'end', size: 12 })); }
  for (const t of xticks) { b.push(line(sx(t), y0 + h, sx(t), y0 + h + 5, { w: 1.2 })); b.push(text(sx(t), y0 + h + 20, xfmt(t), { anchor: 'middle', size: 12 })); }
  b.push(line(x0, y0 + h, x0 + w, y0 + h, { w: 1.6 })); b.push(line(x0, y0, x0, y0 + h, { w: 1.6 }));
  b.push(text(x0 + w / 2, y0 + h + 44 + xlabelDy, xlabel, { anchor: 'middle', size: 13, bold: true }));
  b.push(text(x0 - 48, y0 + h / 2, ylabel, { anchor: 'middle', size: 13, bold: true, rotate: -90 }));
  return { sx, sy, body: b.join('') };
}

/* ------------------------------------------- 2.1 perception: Gestalt grouping */
{
  const W = 860, H = 380, b = [];
  b.push(text(W / 2, 30, 'Gestalt principles: the brain groups parts into wholes', { anchor: 'middle', size: 18, bold: true }));
  const panels = [
    { x: 20, t: 'Proximity', note: 'Dots close together\nform 3 columns of pairs' },
    { x: 230, t: 'Similarity', note: 'Same color forms rows,\nthough spacing is equal' },
    { x: 440, t: 'Closure', note: 'Gaps are filled in:\nyou see a circle and a square' },
    { x: 650, t: 'Figure-ground', note: 'A vase (figure) or two\nfaces: the ground flips' },
  ];
  for (const p of panels) { b.push(rect(p.x, 50, 190, 250, { fill: SOFT, stroke: GRID })); b.push(text(p.x + 95, 76, p.t, { anchor: 'middle', size: 15, bold: true, fill: CER })); b.push(lines(p.x + 95, 324, p.note, { anchor: 'middle', size: 12.5, lh: 17 })); }
  // proximity: 6 columns in 3 pairs, 5 rows
  for (let c = 0; c < 6; c++) for (let r = 0; r < 5; r++) b.push(circle(20 + 38 + Math.floor(c / 2) * 50 + (c % 2) * 18, 112 + r * 36, 6, { fill: INK }));
  // similarity: 5x5 equal grid, alternating row colors
  for (let c = 0; c < 5; c++) for (let r = 0; r < 5; r++) b.push(circle(230 + 39 + c * 28, 112 + r * 36, 7, { fill: r % 2 ? VERM : CER }));
  // closure: dashed circle and square made of segments
  const cx = 440 + 60, cy = 170;
  for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4 + 0.18, a1 = a0 + Math.PI / 4 - 0.36; b.push(path(`M${r1(cx + 40 * Math.cos(a0))} ${r1(cy + 40 * Math.sin(a0))} A40 40 0 0 1 ${r1(cx + 40 * Math.cos(a1))} ${r1(cy + 40 * Math.sin(a1))}`, { stroke: INK, w: 4 })); }
  const sqx = 440 + 100, sqy = 200, s = 66;
  for (const [x1, y1, x2, y2] of [[sqx, sqy, sqx + 24, sqy], [sqx + 42, sqy, sqx + s, sqy], [sqx + s, sqy, sqx + s, sqy + 24], [sqx + s, sqy + 42, sqx + s, sqy + s], [sqx + s, sqy + s, sqx + 42, sqy + s], [sqx + 24, sqy + s, sqx, sqy + s], [sqx, sqy + s, sqx, sqy + 42], [sqx, sqy + 24, sqx, sqy]]) b.push(line(x1, y1, x2, y2, { w: 4 }));
  // figure-ground: Rubin vase silhouette (symmetric profile curve)
  const vx = 650 + 95, top = 95, bot = 285;
  const prof = [[0, 0], [34, 0], [30, 12], [24, 22], [28, 34], [36, 50], [40, 66], [34, 82], [24, 100], [18, 116], [22, 130], [32, 146], [40, 162], [42, 176], [40, 190]];
  const right = prof.map(([dx, dy]) => [vx + dx, top + dy]), left = prof.slice().reverse().map(([dx, dy]) => [vx - dx, top + dy]);
  b.push(rect(650 + 20, top, 150, bot - top - 0, { fill: INK, rx: 0 }));
  b.push(poly([...right, ...left], { fill: '#FFFFFF' }));
  fig('perception', 'perception-gestalt', W, H, 'Four Gestalt principles',
    'Four panels. Proximity: dots set close together in pairs are seen as three columns of pairs. Similarity: an evenly spaced grid of dots in alternating blue and orange rows is seen as rows of the same color. Closure: a broken circle and a square drawn with gaps are seen as a whole circle and a whole square. Figure-ground: a white vase shape on a black background can be seen as a vase (the figure) or as two black faces in profile looking at each other; what counts as figure and ground flips.', b.join(''));
}

/* ------------------------------------- 2.1 perception: the visual set (3 panels) */
{
  const W = 900, H = 420, b = [];
  b.push(text(W / 2, 28, 'Three perception figures', { anchor: 'middle', size: 18, bold: true }));
  // Panel A: a grid where color (similarity) and spacing (proximity) both group
  b.push(rect(20, 44, 270, 330, { fill: SOFT, stroke: GRID }));
  b.push(text(155, 70, 'Figure A', { anchor: 'middle', size: 15, bold: true, fill: CER }));
  for (let c = 0; c < 6; c++) for (let r = 0; r < 6; r++) {
    const x = 20 + 52 + Math.floor(c / 2) * 72 + (c % 2) * 26, y = 112 + r * 38;
    b.push(circle(x, y, 8, { fill: c % 2 ? '#FFFFFF' : INK, stroke: INK, w: 2 }));
  }
  // Panel B: a road scene with linear perspective, relative size, interposition, texture
  const bx = 310;
  b.push(rect(bx, 44, 280, 330, { fill: '#FFFFFF', stroke: GRID }));
  b.push(text(bx + 140, 70, 'Figure B', { anchor: 'middle', size: 15, bold: true, fill: CER }));
  const hy = 150, vpx = bx + 140;
  b.push(rect(bx + 1, 82, 278, hy - 82, { fill: TINT, rx: 0 }));
  b.push(poly([[bx + 30, 372], [vpx - 6, hy], [vpx + 6, hy], [bx + 250, 372]], { fill: '#D9DDE0' }));
  b.push(line(bx + 30, 372, vpx - 6, hy, { w: 2 })); b.push(line(bx + 250, 372, vpx + 6, hy, { w: 2 }));
  b.push(line(bx + 1, hy, bx + 279, hy, { stroke: GREY, w: 1 }));
  // fence posts shrinking toward the horizon (relative size, texture gradient)
  for (let i = 0; i < 7; i++) { const t = Math.pow(0.68, i), y = hy + (372 - hy) * t, x = vpx - (vpx - (bx + 18)) * t, hh = 60 * t; b.push(line(x, y, x, y - hh, { w: Math.max(1.2, 5 * t), stroke: '#7A5A3A' })); }
  // two people of equal real size: near one large, far one small; a box partly hiding a third
  const person = (x, y, s, col) => circle(x, y - 34 * s, 7 * s, { fill: col }) + rect(x - 7 * s, y - 27 * s, 14 * s, 27 * s, { fill: col, rx: 3 * s });
  b.push(person(bx + 205, 330, 1.6, CER));
  b.push(person(vpx + 22, 190, 0.6, CER));
  b.push(person(bx + 214, 238, 0.95, VERM));
  b.push(rect(bx + 192, 206, 40, 34, { fill: '#B9875A', stroke: INK, w: 1.4, rx: 2 }));
  // Panel C: Ponzo illusion, two equal bars between converging lines
  const cxp = 610;
  b.push(rect(cxp, 44, 270, 330, { fill: SOFT, stroke: GRID }));
  b.push(text(cxp + 135, 70, 'Figure C', { anchor: 'middle', size: 15, bold: true, fill: CER }));
  b.push(line(cxp + 60, 360, cxp + 128, 92, { w: 2.4 })); b.push(line(cxp + 210, 360, cxp + 142, 92, { w: 2.4 }));
  for (let i = 0; i < 6; i++) { const y = 360 - i * 46; b.push(line(cxp + 40, y, cxp + 230, y, { stroke: GREY, w: 1.4 })); }
  const barW = 64;
  b.push(rect(cxp + 135 - barW / 2, 150, barW, 10, { fill: VERM, rx: 1 }));
  b.push(rect(cxp + 135 - barW / 2, 300, barW, 10, { fill: VERM, rx: 1 }));
  b.push(text(W / 2, 404, 'In Figure C the two orange bars are exactly the same length.', { anchor: 'middle', size: 13, fill: GREY }));
  fig('perception', 'perception-figure-set', W, H, 'Three perception figures: grouping, a road scene and an illusion',
    'Figure A: a grid of six columns of dots. The columns alternate black and white dots, and the columns are spaced in pairs, so a black column sits close to a white column. Figure B: a road narrows toward the horizon; fence posts shrink and crowd together toward the horizon; a large blue person stands in the foreground, a small blue person of the same shape stands far down the road, and an orange person stands partly hidden behind a box. Figure C: two lines converge toward the top like railroad tracks, with evenly spaced cross lines; two orange bars of exactly equal length sit between them, one high and one low, and the upper bar looks longer.', b.join(''));
}

/* ------------------------------------- 2.2 thinking: algorithm versus heuristic */
{
  const W = 880, H = 420, b = [];
  b.push(text(W / 2, 30, 'Two ways to solve a problem', { anchor: 'middle', size: 18, bold: true }));
  b.push(box(330, 48, 220, 46, 'A problem to solve', { bold: true, fill: TINT }));
  b.push(line(400, 94, 230, 128, { arrow: 'cer', stroke: CER, w: 2 })); b.push(line(480, 94, 650, 128, { arrow: 'verm', stroke: VERM, w: 2 }));
  b.push(box(60, 130, 340, 66, 'Algorithm\na step-by-step procedure', { bold: true, stroke: CER, size: 15 }));
  b.push(box(480, 130, 340, 66, 'Heuristic\na mental shortcut', { bold: true, stroke: VERM, size: 15, fill: WARM }));
  b.push(lines(76, 228, 'Slow and effortful\nGuarantees a solution if followed\nExample: trying every 4-digit code\nfrom 0000 to 9999 on a lock', { size: 13.5, lh: 21 }));
  b.push(lines(496, 228, 'Fast and easy\nUsually works, but can mislead\nExample: trying the owner\'s birthday\nas the code first', { size: 13.5, lh: 21 }));
  b.push(rect(480, 322, 340, 84, { fill: '#FFFFFF', stroke: VERM, dash: '5 4' }));
  b.push(lines(494, 344, 'Representativeness: judging by how well\nsomething matches a prototype.\nAvailability: judging by how easily\nexamples come to mind.', { size: 12.5, lh: 18 }));
  b.push(rect(60, 322, 340, 84, { fill: '#FFFFFF', stroke: CER, dash: '5 4' }));
  b.push(lines(74, 344, 'Both can be blocked by mental set\n(sticking with a method that worked\nbefore) and functional fixedness\n(seeing an object only in its usual use).', { size: 12.5, lh: 18 }));
  fig('thinking', 'thinking-strategies', W, H, 'Algorithms and heuristics',
    'A problem branches into two strategies. Left: an algorithm, a step-by-step procedure that is slow and effortful but guarantees a solution if followed, for example trying every four-digit code from 0000 to 9999 on a lock. Right: a heuristic, a mental shortcut that is fast and easy and usually works but can mislead, for example trying the owner\'s birthday as the code first. A note under the heuristic defines the representativeness heuristic (judging by how well something matches a prototype) and the availability heuristic (judging by how easily examples come to mind). A note under the algorithm says both can be blocked by mental set (sticking with a method that worked before) and functional fixedness (seeing an object only in its usual use).', b.join(''));
}

/* ------------------------------------ 2.3 memory-intro: stores and working memory */
{
  const W = 900, H = 440, b = [];
  b.push(text(W / 2, 30, 'How information moves through memory', { anchor: 'middle', size: 18, bold: true }));
  b.push(box(20, 150, 130, 64, 'Sights,\nsounds, touch', { size: 13, fill: '#FFFFFF', stroke: GREY }));
  b.push(line(150, 182, 182, 182, { arrow: 'ink', w: 2 }));
  b.push(box(184, 140, 170, 84, 'Sensory memory\nabout 1/2 second (sights)\nto a few seconds (sounds)', { size: 12.5, stroke: CER }));
  b.push(line(354, 182, 410, 182, { arrow: 'cer', stroke: CER, w: 2.4 }));
  b.push(text(382, 170, 'attention', { anchor: 'middle', size: 12, fill: CER, bold: true }));
  b.push(box(412, 120, 200, 124, 'Short-term memory\nfew items, about 20 to\n30 seconds without\nrehearsal; working\nmemory is its active part', { size: 12.5, stroke: CER, fill: TINT }));
  b.push(path('M612 160 L690 160', { stroke: CER, w: 2.4, arrow: 'cer' }));
  b.push(text(651, 150, 'encoding', { anchor: 'middle', size: 12, fill: CER, bold: true }));
  b.push(path('M690 205 L612 205', { stroke: GREEN, w: 2.4, arrow: 'green' }));
  b.push(text(651, 224, 'retrieval', { anchor: 'middle', size: 12, fill: GREEN, bold: true }));
  b.push(box(692, 120, 188, 124, 'Long-term memory\nvery large capacity,\nlasts days to a lifetime', { size: 12.5, stroke: CER }));
  b.push(path('M200 140 Q 210 96 260 96', { stroke: GREY, w: 1.4, dash: '4 4' }));
  b.push(text(268, 100, 'unattended input fades', { size: 12, fill: GREY }));
  b.push(path('M470 120 Q 512 70 556 120', { stroke: INK, w: 1.6, arrow: 'ink' }));
  b.push(text(512, 72, 'rehearsal keeps it active', { anchor: 'middle', size: 12 }));
  // working memory components
  b.push(rect(330, 282, 360, 140, { fill: '#FFFFFF', stroke: CER, dash: '6 4' }));
  b.push(text(510, 304, 'Working memory: three parts', { anchor: 'middle', size: 14, bold: true, fill: CER }));
  b.push(box(410, 316, 200, 40, 'Central executive\ndirects attention', { size: 12, fill: TINT }));
  b.push(box(345, 368, 160, 44, 'Phonological loop\nwords and sounds', { size: 12 }));
  b.push(box(515, 368, 160, 44, 'Visuospatial sketchpad\nimages and places', { size: 12 }));
  b.push(line(512, 244, 512, 280, { stroke: CER, dash: '4 4', w: 1.4 }));
  b.push(lines(30, 300, 'The multi-store\n(Atkinson-Shiffrin)\nmodel: three stores.\nThe working memory\nmodel zooms in on\nthe middle one.', { size: 12.5, lh: 18, fill: GREY }));
  fig('memory-intro', 'memory-intro-stores', W, H, 'The multi-store model and working memory',
    'Sights, sounds and touch enter sensory memory, which holds them for about half a second for sights and a few seconds for sounds; unattended input fades. Attention moves some of it into short-term memory, which holds a few items for about 20 to 30 seconds unless it is rehearsed; rehearsal keeps it active. Encoding moves information from short-term memory into long-term memory, which has a very large capacity and lasts from days to a lifetime; retrieval brings it back into short-term memory. A box below shows the working memory model of the short-term store: a central executive that directs attention, a phonological loop for words and sounds, and a visuospatial sketchpad for images and places.', b.join(''));
}

/* --------------------------- 2.4 encoding-memories: serial position (invented data) */
export const SERIAL = [72, 60, 48, 40, 34, 31, 30, 29, 30, 33, 38, 50, 66, 80, 88];
{
  const W = 820, H = 430, b = [];
  b.push(text(W / 2, 30, 'The serial position curve', { anchor: 'middle', size: 18, bold: true }));
  const A = axes({ x0: 100, y0: 60, w: 650, h: 270, xmin: 0.5, xmax: 15.5, ymin: 0, ymax: 100, xticks: [1, 3, 5, 7, 9, 11, 13, 15], yticks: [0, 20, 40, 60, 80, 100], xlabel: 'Position of the word in the list (1 = heard first)', ylabel: 'Percent who recalled it', yfmt: v => `${v}%` });
  b.push(A.body);
  b.push(rect(A.sx(0.6), A.sy(100), A.sx(3.4) - A.sx(0.6), A.sy(0) - A.sy(100), { fill: TINT, rx: 0 }));
  b.push(rect(A.sx(12.6), A.sy(100), A.sx(15.4) - A.sx(12.6), A.sy(0) - A.sy(100), { fill: MINT, rx: 0 }));
  b.push(A.body);
  b.push(path('M' + SERIAL.map((v, i) => `${r1(A.sx(i + 1))} ${r1(A.sy(v))}`).join(' L'), { stroke: CER, w: 3 }));
  SERIAL.forEach((v, i) => b.push(circle(A.sx(i + 1), A.sy(v), 4.5, { fill: CER })));
  b.push(lines(A.sx(2), A.sy(94), 'Primacy effect\nearly words', { anchor: 'middle', size: 13, bold: true, fill: CER }));
  b.push(lines(A.sx(14), A.sy(97), 'Recency effect\nlast words', { anchor: 'middle', size: 13, bold: true, fill: GREEN }));
  b.push(text(A.sx(8), A.sy(48), 'Middle words are recalled least', { anchor: 'middle', size: 13 }));
  b.push(text(W / 2, 422, 'Invented data for practice: 15 spoken words, recalled right away in any order.', { anchor: 'middle', size: 12, fill: GREY }));
  fig('encoding-memories', 'encoding-memories-serial', W, H, 'The serial position curve',
    `A line graph of the percent of people who recalled each word, by its position in a 15-word list heard once and recalled right away in any order (invented data for practice). Recall starts high for the first words (${SERIAL[0]}% for word 1), falls to about 30% for the middle words (${Math.min(...SERIAL)}% at its lowest), then rises for the last words (${SERIAL[14]}% for word 15). The high start is labeled the primacy effect and the high end the recency effect.`, b.join(''));
}

/* ------------------------------------------ 2.5 storing-memories: two amnesias */
{
  const W = 880, H = 380, b = [];
  b.push(text(W / 2, 30, 'Two kinds of amnesia, on a timeline', { anchor: 'middle', size: 18, bold: true }));
  const y = 170, x0 = 60, x1 = 820, inj = 440;
  b.push(line(x0, y, x1, y, { w: 3, arrow: 'ink' }));
  b.push(text(x1 - 4, y + 26, 'time', { anchor: 'end', size: 13, fill: GREY }));
  b.push(path(`M${inj - 12} ${y - 38} L${inj + 6} ${y - 14} L${inj - 6} ${y - 10} L${inj + 12} ${y + 14}`, { stroke: VERM, w: 4 }));
  b.push(text(inj, y - 48, 'Brain injury or illness', { anchor: 'middle', size: 14, bold: true, fill: VERM }));
  b.push(rect(150, y + 30, inj - 150, 52, { fill: WARM, stroke: VERM, rx: 6 }));
  b.push(lines((150 + inj) / 2, y + 52, 'RETROGRADE amnesia: memories from\nBEFORE the injury are lost', { anchor: 'middle', size: 13, bold: true }));
  b.push(rect(inj, y + 96, 360, 52, { fill: TINT, stroke: CER, rx: 6 }));
  b.push(lines(inj + 180, y + 118, 'ANTEROGRADE amnesia: new long-term\nmemories cannot be formed AFTER it', { anchor: 'middle', size: 13, bold: true }));
  b.push(line(inj - 6, y + 22, 154, y + 22, { stroke: VERM, w: 2.4, arrow: 'verm' }));
  b.push(line(inj + 6, y + 88, inj + 356, y + 88, { stroke: CER, w: 2.4, arrow: 'cer' }));
  b.push(lines(60, 70, 'Retrograde: a person cannot recall the\nweeks before a car crash.', { size: 12.5, lh: 18 }));
  b.push(lines(560, 70, 'Anterograde: a person can chat for a minute\nbut cannot remember the talk an hour later.', { size: 12.5, lh: 18 }));
  b.push(text(W / 2, 352, 'In anterograde amnesia, skills (procedural memory) can often still be learned.', { anchor: 'middle', size: 13, fill: GREY }));
  fig('storing-memories', 'storing-memories-amnesia', W, H, 'Retrograde and anterograde amnesia',
    'A timeline with a brain injury or illness marked in the middle. An orange arrow points back in time from the injury: retrograde amnesia, where memories from before the injury are lost, for example a person who cannot recall the weeks before a car crash. A blue arrow points forward in time from the injury: anterograde amnesia, where new long-term memories cannot be formed after it, for example a person who can chat for a minute but cannot remember the talk an hour later. A note says that in anterograde amnesia, skills (procedural memory) can often still be learned.', b.join(''));
}

/* --------------------------------------- 2.6 retrieving-memories: cues that match */
{
  const W = 880, H = 420, b = [];
  b.push(text(W / 2, 30, 'Retrieval depends on cues', { anchor: 'middle', size: 18, bold: true }));
  b.push(rect(30, 52, 400, 340, { fill: SOFT, stroke: GRID }));
  b.push(text(230, 78, 'Recall versus recognition', { anchor: 'middle', size: 15, bold: true, fill: CER }));
  b.push(box(50, 96, 360, 70, 'Recall: produce it with few cues\n"Name the part of the brain that\nforms new memories."', { size: 13, stroke: VERM, fill: '#FFFFFF' }));
  b.push(box(50, 182, 360, 96, 'Recognition: pick it from options\n"Which forms new memories?\n(a) cerebellum  (b) hippocampus\n(c) amygdala  (d) thalamus"', { size: 13, stroke: GREEN, fill: '#FFFFFF' }));
  b.push(lines(230, 306, 'Recognition is usually easier: the\noptions themselves are retrieval cues.\nThat is why multiple choice can feel\neasier than a blank page.', { anchor: 'middle', size: 12.5, lh: 18 }));
  b.push(rect(450, 52, 400, 340, { fill: SOFT, stroke: GRID }));
  b.push(text(650, 78, 'When the cues at test match learning', { anchor: 'middle', size: 15, bold: true, fill: CER }));
  const rows = [['Context-dependent', 'the same place', 'Learn words underwater, recall\nthem better underwater'], ['State-dependent', 'the same body state', 'Learn while calm, recall better\nwhen calm again'], ['Mood-congruent', 'the same mood', 'When sad, sad memories\ncome to mind more easily']];
  rows.forEach(([n, m, ex], i) => {
    const y = 98 + i * 96;
    b.push(rect(466, y, 368, 84, { fill: '#FFFFFF', stroke: CER }));
    b.push(text(480, y + 24, `${n} memory`, { size: 13.5, bold: true, fill: CER }));
    b.push(text(480, y + 44, `cue: ${m}`, { size: 12.5, fill: GREY }));
    b.push(lines(480, y + 62, ex, { size: 12.5, lh: 16 }));
  });
  fig('retrieving-memories', 'retrieving-memories-cues', W, H, 'Recall, recognition and matching cues',
    'Left panel: recall means producing the answer with few cues, as in "Name the part of the brain that forms new memories." Recognition means picking it from options, as in a four-option question listing the cerebellum, hippocampus, amygdala and thalamus. Recognition is usually easier because the options are retrieval cues. Right panel: three ways retrieval improves when the cues at test match learning. Context-dependent memory: the same place, for example words learned underwater are recalled better underwater. State-dependent memory: the same body state, for example learning while calm and recalling better when calm again. Mood-congruent memory: the same mood, for example sad memories come to mind more easily when a person is sad.', b.join(''));
}

/* ------------------------------ 2.7 forgetting: Ebbinghaus's (1885) savings curve */
export const EBB = [[20 / 60, 58.2], [1, 44.2], [8.8, 35.8], [24, 33.7], [48, 27.8], [144, 25.4], [744, 21.1]];
{
  const W = 840, H = 440, b = [];
  b.push(text(W / 2, 30, 'The forgetting curve (Ebbinghaus, 1885)', { anchor: 'middle', size: 18, bold: true }));
  // x on a square-root scale so the early drop and the long tail both show
  const tx = h => Math.sqrt(h);
  const A = axes({ x0: 100, y0: 60, w: 680, h: 280, xmin: 0, xmax: tx(744), ymin: 0, ymax: 100, xticks: [], yticks: [0, 20, 40, 60, 80, 100], xlabel: 'Time since learning (square-root scale)', xlabelDy: 14, ylabel: 'Savings: % of relearning time saved', yfmt: v => `${v}%` });
  b.push(A.body);
  const labels = [['20 min', 20 / 60], ['1 h', 1], ['9 h', 8.8], ['1 day', 24], ['2 days', 48], ['6 days', 144], ['31 days', 744]];
  labels.forEach(([s, h], i) => { const x = A.sx(tx(h)); b.push(line(x, 340, x, 345, { w: 1.2 })); b.push(text(x + (i === 0 ? -8 : i === 1 ? 10 : 0), i === 1 ? 374 : 360, s, { anchor: 'middle', size: 11.5 })); });
  b.push(circle(A.sx(0), A.sy(100), 4.5, { fill: GREY }));
  b.push(text(A.sx(0) + 10, A.sy(100) + 4, 'just learned (100%)', { size: 12, fill: GREY }));
  const pts = [[0, 100], ...EBB.map(([h, v]) => [tx(h), v])];
  b.push(path('M' + pts.map(([x, y]) => `${r1(A.sx(x))} ${r1(A.sy(y))}`).join(' L'), { stroke: CER, w: 3 }));
  EBB.forEach(([h, v]) => { b.push(circle(A.sx(tx(h)), A.sy(v), 5, { fill: CER })); b.push(text(A.sx(tx(h)) + 4, A.sy(v) - 10, `${v}%`, { size: 12, bold: true, fill: CER })); });
  b.push(text(A.sx(tx(240)), A.sy(70), 'Steep drop in the first hours,', { anchor: 'middle', size: 13 }));
  b.push(text(A.sx(tx(240)), A.sy(62), 'then a slow, level tail', { anchor: 'middle', size: 13 }));
  b.push(text(W / 2, 422, 'Ebbinghaus (1885) learned lists of nonsense syllables and measured how much faster he relearned them.', { anchor: 'middle', size: 12, fill: GREY }));
  fig('forgetting', 'forgetting-curve', W, H, 'The forgetting curve',
    'A line graph of Ebbinghaus\'s 1885 results. The vertical axis is savings, the percent of the original learning time saved when he relearned a list of nonsense syllables. Savings were 58.2% after 20 minutes, 44.2% after 1 hour, 35.8% after about 9 hours, 33.7% after 1 day, 27.8% after 2 days, 25.4% after 6 days and 21.1% after 31 days. The curve drops steeply in the first hours and then levels into a slow tail. Time is on a square-root scale so both parts show.', b.join(''));
}

/* --------------------------------------- 2.7 forgetting: two kinds of interference */
{
  const W = 860, H = 340, b = [];
  b.push(text(W / 2, 30, 'Interference: which way does it point?', { anchor: 'middle', size: 18, bold: true }));
  const row = (y, title, col, oldTxt, newTxt, dir, note) => {
    b.push(text(40, y, title, { size: 15, bold: true, fill: col }));
    b.push(box(40, y + 14, 230, 56, oldTxt, { size: 13, stroke: GREY, fill: '#FFFFFF' }));
    b.push(box(590, y + 14, 230, 56, newTxt, { size: 13, stroke: GREY, fill: '#FFFFFF' }));
    b.push(text(430, y + 30, 'time', { anchor: 'middle', size: 12, fill: GREY }));
    if (dir > 0) b.push(line(278, y + 42, 582, y + 42, { stroke: col, w: 3.2, arrow: col === CER ? 'cer' : 'verm' }));
    else b.push(line(582, y + 42, 278, y + 42, { stroke: col, w: 3.2, arrow: col === CER ? 'cer' : 'verm' }));
    b.push(text(430, y + 64, note, { anchor: 'middle', size: 13, bold: true, fill: col }));
  };
  row(70, 'Proactive interference: OLD blocks NEW (pro = forward)', CER, 'Old learning\nlast year\'s locker code', 'New learning\nthis year\'s locker code', 1, 'the old code keeps coming out');
  row(200, 'Retroactive interference: NEW blocks OLD (retro = backward)', VERM, 'Old learning\nSpanish words from 9th grade', 'New learning\nFrench words this year', -1, 'the new French words crowd out the Spanish');
  fig('forgetting', 'forgetting-interference', W, H, 'Proactive and retroactive interference',
    'Two rows on a timeline from old learning on the left to new learning on the right. Top row, proactive interference: an arrow points forward from the old learning (last year\'s locker code) to the new learning (this year\'s locker code); the old code keeps coming out, so old learning blocks new. Bottom row, retroactive interference: an arrow points backward from the new learning (French words this year) to the old learning (Spanish words from 9th grade); the new French words crowd out the Spanish, so new learning blocks old.', b.join(''));
}

/* --------------------------------------------- 2.8 intelligence: the IQ scale */
{
  const W = 860, H = 440, b = [];
  b.push(text(W / 2, 30, 'Modern IQ scores on a normal curve (mean 100, SD 15)', { anchor: 'middle', size: 18, bold: true }));
  const M = 100, SD = 15, x0 = 70, w = 720, base = 300, top = 70;
  const sx = v => x0 + (v - 40) / 120 * w, pdf = z => Math.exp(-z * z / 2);
  const sy = d => base - d * (base - top);
  // shaded bands from the rule
  const bandCol = [WARM, MINT, TINT, TINT, MINT, WARM];
  for (let k = -3; k < 3; k++) {
    const a = M + k * SD, c = a + SD, pts = [];
    for (let v = a; v <= c + 1e-9; v += 0.5) pts.push([sx(v), sy(pdf((v - M) / SD))]);
    b.push(poly([[sx(a), base], ...pts, [sx(c), base]], { fill: bandCol[k + 3] }));
    const pct = Stats.rulePct(k, k + 1);
    const tail = k === -3 || k === 2;
    b.push(text(tail ? sx(a + SD / 2) + (k < 0 ? -18 : 18) : sx(a + SD / 2), k === -1 || k === 0 ? base - 60 : tail ? base - 22 : base - 14, `${pct}%`, { anchor: 'middle', size: tail ? 12 : 14, bold: true }));
  }
  const curve = []; for (let v = 40; v <= 160; v += 0.5) curve.push(`${r1(sx(v))} ${r1(sy(pdf((v - M) / SD)))}`);
  b.push(path('M' + curve.join(' L'), { stroke: CER, w: 3 }));
  b.push(line(x0, base, x0 + w, base, { w: 1.6 }));
  for (let k = -3; k <= 3; k++) {
    const v = M + k * SD, x = sx(v);
    b.push(line(x, base, x, base + 6, { w: 1.4 }));
    if (k) b.push(line(x, sy(pdf(k)), x, base, { stroke: GREY, w: 1, dash: '3 3' }));
    b.push(text(x, base + 22, String(v), { anchor: 'middle', size: 13, bold: true }));
    b.push(text(x, base + 40, k ? `z = ${k > 0 ? '+' : '−'}${Math.abs(k)}` : 'z = 0', { anchor: 'middle', size: 12, fill: GREY }));
    const pr = Stats.percentileRule(k);
    b.push(text(x, base + 58, `${pr}th`.replace('50th', '50th').replace(/\.(\d+)th/, '.$1th'), { anchor: 'middle', size: 12, fill: CER }));
  }
  b.push(line(x0, sy(pdf(0)), x0, sy(pdf(0)), {}));
  b.push(line(sx(M), sy(1), sx(M), base, { stroke: CER, w: 1.6, dash: '5 4' }));
  b.push(text(x0 - 6, base + 22, 'IQ', { anchor: 'end', size: 12, bold: true }));
  b.push(text(x0 - 6, base + 58, 'percentile', { anchor: 'end', size: 11, fill: CER }));
  b.push(line(sx(85), base - 96, sx(115), base - 96, { stroke: INK, w: 1.4, arrow: 'ink', arrow2: 'ink' }));
  b.push(text(sx(100), base - 104, '68% score 85 to 115', { anchor: 'middle', size: 13, bold: true }));
  b.push(text(W / 2, 424, 'Percent of scores between marks by the 68-95-99.7 rule; percentile = percent of scores below that mark.', { anchor: 'middle', size: 12, fill: GREY }));
  fig('intelligence', 'intelligence-iq-curve', W, H, 'IQ scores on the normal curve',
    'A bell-shaped normal curve of modern IQ scores with a mean of 100 and a standard deviation of 15. Marks at 55, 70, 85, 100, 115, 130 and 145 are z scores of minus 3 to plus 3. By the 68-95-99.7 rule, 34% of scores fall between 85 and 100 and 34% between 100 and 115, so 68% score 85 to 115; 13.5% fall in each band from 70 to 85 and 115 to 130; 2.35% in each band from 55 to 70 and 130 to 145. The percentile at each mark is 0.15, 2.5, 16, 50, 84, 97.5 and 99.85.', b.join(''));
}

mkdirSync(REG, { recursive: true });
for (const [topic, entries] of Object.entries(figs)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(Object.values(figs).flatMap(o => Object.keys(o)).join('\n'));
