/* AP® Psychology figures for Unit 3 topics 3.1-3.6 (author D): diagrams
   drawn from their labels. Data figures (results of invented studies) are
   plot specs in the question files, drawn by psy-plot.js from their numbers.
   Writes
     psychology/figures/<id>.svg
     psychology/data/figures/<topic>.json   (the registry entries)

     node scripts/appsych-figures/author-d.mjs

   Style (docs/appsych-briefs/content-common.md): white background, role="img"
   with <title> and <desc>, Arial/Helvetica, ink #1F2A28, cerulean #084F78 for
   emphasis, then Okabe-Ito vermillion #D55E00, green #009E73, reddish purple
   #CC79A7. Ages on these figures are typical ranges, not rules. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'psychology', 'figures');
const REG = join(ROOT, 'psychology', 'data', 'figures');
const INK = '#1F2A28', CER = '#084F78', VERM = '#D55E00', GREEN = '#009E73', PURP = '#CC79A7', GRID = '#D6DEE3', TINT = '#E3F0F8', SOFT = '#F4F7F9';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = v => Math.round(v * 10) / 10;
function text(x, y, s, o = {}) {
  const a = [`x="${r(x)}"`, `y="${r(y)}"`, `font-size="${o.size || 14}"`, `fill="${o.fill || INK}"`];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.bold) a.push('font-weight="700"');
  if (o.italic) a.push('font-style="italic"');
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}
// Several lines, top line at y.
const lines = (x, y, arr, o = {}) => arr.map((s, i) => text(x, y + i * (o.lh || (o.size || 14) * 1.3), s, o)).join('');
const rect = (x, y, w, h, o = {}) => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${o.rx ?? 8}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.sw || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 2}"${o.arrow ? ' marker-end="url(#arr)"' : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const circle = (cx, cy, rr, o = {}) => `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(rr)}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.sw || 1.5}"/>`;
// A simple person: head and shoulders.
function person(cx, top, h, color) {
  const hr = h * 0.2;
  return circle(cx, top + hr, hr, { fill: color }) +
    `<path d="M ${r(cx - h * 0.32)} ${r(top + h)} Q ${r(cx - h * 0.32)} ${r(top + hr * 2 + h * 0.08)} ${r(cx)} ${r(top + hr * 2 + h * 0.08)} Q ${r(cx + h * 0.32)} ${r(top + hr * 2 + h * 0.08)} ${r(cx + h * 0.32)} ${r(top + h)} Z" fill="${color}"/>`;
}
const DEFS = `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}"/></marker></defs>`;
function svg(w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
${DEFS}
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
`;
}

const figs = {};
function add(topic, id, w, h, title, alt, body) {
  mkdirSync(FIG, { recursive: true });
  writeFileSync(join(FIG, `${id}.svg`), svg(w, h, title, alt, body));
  (figs[topic] ||= {})[id] = { file: `figures/${id}.svg`, ext: 'svg', w, h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
}

/* 3.1 Two designs for the same question. */
{
  const W = 800, H = 440;
  let b = '';
  b += text(24, 34, 'Two ways to study how people change with age', { size: 19, bold: true });
  // Cross-sectional
  b += rect(16, 52, W - 32, 168, { fill: SOFT, stroke: GRID });
  b += text(32, 80, 'Cross-sectional study: different people, tested once', { size: 16, bold: true, fill: CER });
  const ages = [20, 40, 60, 80];
  ages.forEach((a, i) => {
    const cx = 120 + i * 150;
    for (let k = -1; k <= 1; k++) b += person(cx + k * 26, 100, 44, [CER, VERM, GREEN, PURP][i]);
    b += text(cx, 168, `Age ${a} group`, { anchor: 'middle', size: 14, bold: true });
  });
  b += text(W - 32, 198, 'All four groups tested in the same year (2025)', { anchor: 'end', size: 13 });
  b += text(32, 198, 'Fast and cheap; age is mixed up with birth year', { size: 13, italic: true });
  // Longitudinal
  b += rect(16, 236, W - 32, 188, { fill: SOFT, stroke: GRID });
  b += text(32, 264, 'Longitudinal study: the same people, tested again and again', { size: 16, bold: true, fill: CER });
  const yrs = [['2025', 20], ['2045', 40], ['2065', 60], ['2085', 80]];
  yrs.forEach(([y, a], i) => {
    const cx = 120 + i * 150;
    const n = i < 2 ? 3 : 2; // dropouts over time
    for (let k = 0; k < n; k++) b += person(cx + (k - (n - 1) / 2) * 26, 284, 44, CER);
    b += text(cx, 352, `${y}: age ${a}`, { anchor: 'middle', size: 14, bold: true });
    if (i < 3) b += line(cx + 52, 306, cx + 98, 306, { arrow: true });
  });
  b += text(32, 384, 'Shows change within the same people; slow, costly, and some people drop out', { size: 13, italic: true });
  b += text(32, 406, 'Both designs measure people as they are, so neither one by itself shows cause and effect.', { size: 13 });
  add('development-methods', 'development-methods-designs', W, H, 'Cross-sectional and longitudinal designs',
    'Top panel: a cross-sectional study tests four different groups, aged 20, 40, 60 and 80, all in the same year, 2025; it is fast but mixes up age with birth year. Bottom panel: a longitudinal study tests one group in 2025 at age 20, then again in 2045, 2065 and 2085; the group shrinks as people drop out. It shows change within the same people but is slow. Neither design alone shows cause and effect.', b);
}

/* 3.2 Physical development across the lifespan. */
{
  const W = 800, H = 430;
  let b = '';
  b += text(24, 34, 'Physical development across the lifespan', { size: 19, bold: true });
  const cols = [
    ['Before birth', VERM, ['Teratogens (alcohol,', 'nicotine, some drugs', 'and infections) can', 'cross the placenta', 'and harm the baby.']],
    ['Infancy and childhood', CER, ['Reflexes at birth:', 'rooting, sucking,', 'grasping.', 'Motor milestones in a', 'similar order: sit,', 'stand, walk (about', '12 months, wide range).', 'Many babies crawl', 'first; some skip it.']],
    ['Adolescence', GREEN, ['Puberty: hormones', 'bring primary and', 'secondary sex', 'characteristics,', 'menarche and', 'spermarche. The', 'brain keeps maturing.']],
    ['Adulthood', PURP, ['Strength and speed', 'peak in the mid-20s,', 'then slowly decline.', 'Vision and hearing', 'fade with age.', 'Menopause, often', 'around age 50.']],
  ];
  const cw = (W - 48) / 4;
  cols.forEach(([h, c, body], i) => {
    const x = 16 + i * (cw + 5.3);
    b += rect(x, 56, cw, 300, { fill: SOFT, stroke: c, sw: 2 });
    b += rect(x, 56, cw, 40, { fill: c, rx: 8 });
    b += text(x + cw / 2, 82, h, { anchor: 'middle', size: 15, bold: true, fill: '#FFFFFF' });
    b += lines(x + 12, 124, body, { size: 14, lh: 24 });
  });
  b += line(24, 384, W - 24, 384, { arrow: true, sw: 2.5 });
  b += text(24, 410, 'Conception', { size: 13 });
  b += text(W - 24, 410, 'Older adulthood', { size: 13, anchor: 'end' });
  b += text(W / 2, 410, 'Maturation sets the order; experience and health shape the timing.', { size: 13, anchor: 'middle', italic: true });
  add('physical-development', 'physical-development-lifespan', W, H, 'Physical development from before birth to late adulthood',
    'Four columns along a lifespan arrow. Before birth: teratogens such as alcohol, nicotine, some drugs and infections can cross the placenta and harm the baby. Infancy and childhood: reflexes at birth (rooting, sucking, grasping) and motor milestones in a set order (sit, crawl, stand, walk at about 12 months, with a wide range). Adolescence: puberty, with primary and secondary sex characteristics, menarche and spermarche; the brain keeps maturing. Adulthood: strength and speed peak in the mid-20s then slowly decline, vision and hearing fade, and menopause often comes around age 50. Maturation sets the order; experience and health shape the timing.', b);
}

/* 3.3 Four separate dimensions. */
{
  const W = 800, H = 400;
  let b = '';
  b += text(24, 34, 'Four different questions about a person', { size: 19, bold: true });
  const rows = [
    ['Biological sex', VERM, 'What body?', 'Chromosomes, hormones and anatomy (some people have intersex traits).'],
    ['Gender identity', CER, 'Who am I?', 'A person’s inner sense of being a woman, a man, both or neither.'],
    ['Gender roles', GREEN, 'What is expected?', 'A culture’s expectations for how women and men act, dress and work.'],
    ['Sexual orientation', PURP, 'Attracted to whom?', 'A lasting pattern of romantic or sexual attraction to others.'],
  ];
  rows.forEach(([h, c, q, d], i) => {
    const y = 56 + i * 78;
    b += rect(16, y, W - 32, 66, { fill: SOFT, stroke: c, sw: 2 });
    b += rect(16, y, 196, 66, { fill: c, rx: 8 });
    b += text(114, y + 30, h, { anchor: 'middle', size: 16, bold: true, fill: '#FFFFFF' });
    b += text(114, y + 51, q, { anchor: 'middle', size: 13, fill: '#FFFFFF', italic: true });
    b += text(228, y + 39, d, { size: 14 });
  });
  b += text(24, 384, 'Knowing a person’s answer to one question does not tell you their answers to the others.', { size: 14, italic: true });
  add('gender-orientation', 'gender-orientation-dimensions', W, H, 'Sex, gender identity, gender roles and sexual orientation',
    'Four separate bars. Biological sex (what body?): chromosomes, hormones and anatomy, and some people have intersex traits. Gender identity (who am I?): a person’s inner sense of being a woman, a man, both or neither. Gender roles (what is expected?): a culture’s expectations for how women and men act, dress and work. Sexual orientation (attracted to whom?): a lasting pattern of romantic or sexual attraction. Knowing one answer does not tell you the others.', b);
}

/* 3.4 A conservation task and Piaget's stages. */
{
  const W = 800, H = 470;
  let b = '';
  b += text(24, 34, 'The liquid conservation task', { size: 19, bold: true });
  // glass(x, bottom, w, h, fillH)
  const glass = (x, bottom, w, h, fh) => rect(x, bottom - fh, w, fh, { fill: '#9CCBE6', rx: 2 }) +
    `<path d="M ${x} ${bottom - h} L ${x} ${bottom} L ${x + w} ${bottom} L ${x + w} ${bottom - h}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
  b += text(110, 70, '1. Two equal glasses', { anchor: 'middle', size: 14, bold: true });
  b += glass(50, 220, 50, 90, 60) + glass(120, 220, 50, 90, 60);
  b += text(110, 246, 'Child agrees: same amount', { anchor: 'middle', size: 13 });
  b += line(196, 160, 290, 160, { arrow: true, sw: 2.5 });
  b += text(243, 145, 'pour one', { anchor: 'middle', size: 13 });
  b += text(390, 70, '2. Poured into a tall, thin glass', { anchor: 'middle', size: 14, bold: true });
  b += glass(330, 220, 50, 90, 60) + glass(410, 220, 25, 140, 120);
  b += text(390, 246, '"Which has more?"', { anchor: 'middle', size: 13 });
  // answers
  b += rect(500, 70, 284, 78, { fill: '#FBE9DF', stroke: VERM, sw: 2 });
  b += text(514, 94, 'Typical 4-year-old', { size: 14, bold: true, fill: VERM });
  b += lines(514, 116, ['"The tall one has more!" Focuses on', 'height alone; does not reverse the pour.'], { size: 13, lh: 18 });
  b += rect(500, 162, 284, 78, { fill: '#DDF2EA', stroke: GREEN, sw: 2 });
  b += text(514, 186, 'Typical 8-year-old', { size: 14, bold: true, fill: '#00704F' });
  b += lines(514, 208, ['"The same. You only poured it." Sees', 'that taller is also thinner.'], { size: 13, lh: 18 });
  // stage strip
  b += text(24, 292, 'Piaget’s four stages (typical ages; later research finds the skills often appear earlier)', { size: 14, bold: true });
  const st = [['Sensorimotor', 'birth to about 2', 'object permanence'], ['Preoperational', 'about 2 to 7', 'make-believe, egocentrism'], ['Concrete operational', 'about 7 to 11', 'conservation, logic about real things'], ['Formal operational', 'about 12 and up', 'abstract, hypothetical thinking']];
  const sw = (W - 48) / 4;
  st.forEach(([n, a, k], i) => {
    const x = 16 + i * (sw + 5.3);
    b += rect(x, 306, sw, 140, { fill: i === 2 ? TINT : SOFT, stroke: CER, sw: 2 });
    b += text(x + sw / 2, 334, n, { anchor: 'middle', size: 15, bold: true, fill: CER });
    b += text(x + sw / 2, 358, a, { anchor: 'middle', size: 13 });
    const words = k.split(' '); const ls = []; let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > 22) { ls.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    ls.push(cur.trim());
    b += lines(x + sw / 2, 390, ls, { anchor: 'middle', size: 13, lh: 18, italic: true });
  });
  add('cognitive-development', 'cognitive-development-conservation', W, H, 'The liquid conservation task and Piaget’s stages',
    'Top: two equal glasses of water; one is poured into a tall, thin glass and the child is asked which has more. A typical 4-year-old says the tall one has more, focusing on height alone. A typical 8-year-old says they are the same because the water was only poured. Bottom: Piaget’s four stages with typical ages: sensorimotor, birth to about 2 (object permanence); preoperational, about 2 to 7 (make-believe, egocentrism); concrete operational, about 7 to 11 (conservation, logic about real things); formal operational, about 12 and up (abstract, hypothetical thinking). Later research finds the skills often appear earlier.', b);
}

/* 3.5 Language milestones. */
{
  const W = 800, H = 330;
  let b = '';
  b += text(24, 34, 'How speech develops in the first years', { size: 19, bold: true });
  const x0 = 50, x1 = W - 40, months = 30, sx = m => x0 + (x1 - x0) * m / months;
  b += line(x0, 250, x1, 250, { sw: 2.5 });
  for (let m = 0; m <= 30; m += 6) { b += line(sx(m), 250, sx(m), 258, { sw: 2 }); b += text(sx(m), 276, String(m), { anchor: 'middle', size: 13 }); }
  b += text((x0 + x1) / 2, 302, 'Age in months (typical; children vary by several months)', { anchor: 'middle', size: 13, bold: true });
  const ms = [[2, 'Cooing', '"ooh", "aah"', CER, 0], [6, 'Babbling', '"ba-ba-ba"', GREEN, 1], [12, 'One-word stage', '"Doggy!"', VERM, 0], [21, 'Telegraphic speech', '"Want juice."', PURP, 1], [27, 'Sentences', '"I goed outside."', CER, 0]];
  for (const [m, n, ex, c, up] of ms) {
    const y = up ? 70 : 150;
    b += line(sx(m), y + 52, sx(m), 246, { stroke: c, sw: 2, dash: '4 3' });
    b += circle(sx(m), 250, 6, { fill: c });
    const bw = 150, bx = Math.min(Math.max(sx(m) - bw / 2, 16), W - 16 - bw);
    b += rect(bx, y, bw, 52, { fill: SOFT, stroke: c, sw: 2 });
    b += text(bx + bw / 2, y + 21, n, { anchor: 'middle', size: 14, bold: true, fill: INK });
    b += text(bx + bw / 2, y + 41, ex, { anchor: 'middle', size: 13, italic: true });
  }
  add('language-development', 'language-development-milestones', W, H, 'Milestones of early language',
    'A timeline from birth to 30 months. Cooing at about 2 months ("ooh", "aah"); babbling at about 6 months ("ba-ba-ba"); the one-word stage at about 12 months ("Doggy!"); telegraphic speech at about 18 to 24 months ("Want juice."); sentences by about 27 months, often with overgeneralized rules ("I goed outside."). Ages are typical; children vary by several months.', b);
}

/* 3.6 Ecological systems. */
{
  const W = 800, H = 520;
  let b = '';
  b += text(24, 34, 'Ecological systems: layers of influence around a child', { size: 19, bold: true });
  const cx = 300, cy = 270;
  const rings = [[250, 205, '#F3E6EF', PURP, 'Macrosystem', 'culture, values, laws, the economy'], [195, 158, '#FBE9DF', VERM, 'Exosystem', 'parent’s workplace, school board, media'], [140, 112, '#DDF2EA', GREEN, 'Mesosystem', 'links: parents talk with teachers'], [86, 68, TINT, CER, 'Microsystem', 'family, classroom, friends']];
  for (const [rx, ry, f, s] of rings) b += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${s}" stroke-width="2.5"/>`;
  b += circle(cx, cy, 30, { fill: '#FFFFFF', stroke: INK, sw: 2 });
  b += text(cx, cy + 5, 'Child', { anchor: 'middle', size: 14, bold: true });
  // ring labels at the top of each band
  rings.forEach(([rx, ry, , s, n], i) => {
    const inner = i < rings.length - 1 ? rings[i + 1][1] : 30;
    const y = cy - (ry + inner) / 2 + 5;
    b += text(cx, y, n, { anchor: 'middle', size: 14, bold: true, fill: s === GREEN ? '#00704F' : s === PURP ? '#8E3F72' : s });
  });
  // key at right
  const kx = 574;
  rings.slice().reverse().forEach(([, , f, s, n, d], i) => {
    const y = 70 + i * 78;
    b += rect(kx, y, 210, 68, { fill: f, stroke: s, sw: 2 });
    b += text(kx + 10, y + 22, n, { size: 14, bold: true });
    const ws = d.split(' '); const ls = []; let cur = '';
    for (const w of ws) { if ((cur + ' ' + w).trim().length > 27) { ls.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    ls.push(cur.trim());
    b += lines(kx + 10, y + 41, ls, { size: 12, lh: 15 });
  });
  b += rect(kx, 382, 210, 68, { fill: SOFT, stroke: INK, sw: 1.5 });
  b += text(kx + 10, 404, 'Chronosystem', { size: 14, bold: true });
  b += lines(kx + 10, 423, ['time: life changes and', 'historical events'], { size: 12, lh: 15 });
  b += line(40, 498, 560, 498, { arrow: true, sw: 2.5 });
  b += text(40, 488, 'Chronosystem: every layer changes over time', { size: 13, italic: true });
  add('social-emotional-development', 'social-emotional-development-ecological', W, H, 'Ecological systems theory',
    'Nested ovals around a child. Microsystem, closest: family, classroom, friends. Mesosystem: the links between them, such as parents talking with teachers. Exosystem: settings the child is not in that still matter, such as a parent’s workplace, the school board and media. Macrosystem, outermost: culture, values, laws and the economy. An arrow along the bottom shows the chronosystem: every layer changes over time, through life changes and historical events.', b);
}

mkdirSync(REG, { recursive: true });
for (const [topic, entries] of Object.entries(figs)) writeFileSync(join(REG, `${topic}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`author D figures: ${Object.values(figs).reduce((n, e) => n + Object.keys(e).length, 0)} written`);
