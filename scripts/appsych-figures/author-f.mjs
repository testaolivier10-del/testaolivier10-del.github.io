/* AP® Psychology figures for author F: Unit 4 topics 4.4-4.7 and Unit 5 topics 5.1-5.2.
   Diagrams drawn from coordinates; no data figures here (data stimuli use plot specs, drawn by
   psy-plot.js from their numbers). The Yerkes-Dodson and general adaptation syndrome figures are
   conceptual model curves, not data, and say so.

     node scripts/appsych-figures/author-f.mjs          writes psychology/figures/<id>.svg
                                                        and psychology/data/figures/<topic>.json
     node scripts/appsych-figures/author-f.mjs --list   prints ids and sizes

   Style: white background, Arial/Helvetica, ink #1F2A28, course cerulean #084F78 for emphasis,
   Okabe-Ito vermillion #D55E00, green #009E73 and reddish purple #CC79A7 as second colors;
   role="img" with <title> and <desc>. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'psychology', 'figures');
const REG = join(ROOT, 'psychology', 'data', 'figures');
const INK = '#1F2A28', CER = '#084F78', TINT = '#E3F0F8', VERM = '#D55E00', GREEN = '#009E73', PURP = '#CC79A7', GREY = '#6B7370', LIGHT = '#EEF1F0', SEA = '#D7E9F4';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = v => +(+v).toFixed(2);
function T(x, y, s, o = {}) {
  const a = o.anchor || 'start', sz = o.size || 13, w = o.weight || 'normal', fill = o.fill || INK;
  return `<text x="${f(x)}" y="${f(y)}" font-size="${sz}" font-weight="${w}" fill="${fill}" text-anchor="${a}"${o.italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
}
function TL(x, y, s, o = {}) { const lh = o.lh || (o.size || 13) * 1.3; return String(s).split('\n').map((l, i) => T(x, y + i * lh, l, o)).join(''); }
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}${o.start ? ` marker-start="url(#ar-${o.start})"` : ''}/>`;
const R = (x, y, w, h, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
function box(x, y, w, h, text, o = {}) {
  const lines = String(text).split('\n'), sz = o.size || 13, lh = sz * 1.3;
  const y0 = y + h / 2 - (lines.length - 1) * lh / 2 + sz * 0.35;
  return R(x, y, w, h, { fill: o.fill || '#FFFFFF', stroke: o.stroke || INK, rx: o.rx ?? 8, w: o.w || 1.5 }) +
    lines.map((l, i) => T(x + w / 2, y0 + i * lh, l, { anchor: 'middle', size: sz, weight: i === 0 && o.bold !== false ? 'bold' : 'normal', fill: o.ink || INK })).join('');
}
function svg(id, w, h, title, desc, body) {
  const marks = [['ink', INK], ['cer', CER], ['verm', VERM], ['green', GREEN], ['grey', GREY]].map(([n, c]) =>
    `<marker id="ar-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('');
  return { id, w, h, alt: desc, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${marks}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
` };
}

const FIGS = [];
const add = (topic, fig) => FIGS.push({ topic, ...fig });

/* 4.4: the psychodynamic view (most of mental life below awareness, defended) next to the
   humanistic view (growth when acceptance is unconditional). The iceberg is a common
   teaching picture of the unconscious, not a brain diagram. */
add('psychodynamic-humanistic', (() => {
  const W = 800, H = 430;
  let b = '';
  // left panel
  b += T(200, 34, 'Psychodynamic view', { anchor: 'middle', size: 18, weight: 'bold', fill: CER });
  b += R(30, 150, 340, 250, { fill: SEA });                       // water
  b += L(30, 150, 370, 150, { stroke: CER, w: 2 });
  b += T(36, 143, 'awareness line', { size: 11, fill: CER });
  b += P('M150,150 L185,82 L215,96 L245,150 Z', { fill: '#FFFFFF', stroke: INK, w: 2 });   // tip
  b += P('M150,150 L95,250 L120,330 L200,388 L290,340 L320,250 L245,150 Z', { fill: '#FFFFFF', stroke: INK, w: 2, dash: '6 4' });
  b += T(198, 136, 'conscious', { anchor: 'middle', size: 12, weight: 'bold' });
  b += T(205, 240, 'unconscious', { anchor: 'middle', size: 15, weight: 'bold', fill: CER });
  b += TL(205, 262, 'wishes, fears and memories\noutside awareness that\nstill shape behavior', { anchor: 'middle', size: 12 });
  b += box(30, 50, 112, 56, 'defense\nmechanisms', { size: 12, stroke: VERM, ink: VERM });
  b += L(86, 106, 150, 150, { stroke: VERM, w: 2, arrow: 'verm' });
  b += T(200, 418, 'Assessed with projective tests (Rorschach, TAT)', { anchor: 'middle', size: 12, fill: GREY });
  // divider
  b += L(400, 24, 400, 410, { stroke: '#C9D1CE', w: 1.5 });
  // right panel
  b += T(600, 34, 'Humanistic view', { anchor: 'middle', size: 18, weight: 'bold', fill: CER });
  b += box(450, 70, 300, 70, 'unconditional positive regard\naccepted as a person,\neven when behavior is judged', { size: 12, stroke: CER, ink: INK, fill: TINT });
  b += L(600, 140, 600, 200, { stroke: CER, w: 2.5, arrow: 'cer' });
  b += box(450, 205, 300, 64, 'honest view of yourself\nno need to hide or distort\nexperience to stay accepted', { size: 12 });
  b += L(600, 269, 600, 318, { stroke: GREEN, w: 2.5, arrow: 'green' });
  b += box(450, 322, 300, 64, 'self-actualizing tendency\nfree to grow toward\nyour potential', { size: 12, stroke: GREEN, ink: INK });
  b += T(600, 418, 'Conditional acceptance blocks growth', { anchor: 'middle', size: 12, fill: GREY });
  return svg('psychodynamic-humanistic-views', W, H, 'Two views of personality',
    'Two panels. Left, the psychodynamic view: an iceberg with a small conscious tip above the awareness line and a large unconscious part below, holding wishes, fears and memories that still shape behavior; defense mechanisms push threatening material below the line; assessed with projective tests such as the Rorschach and TAT. Right, the humanistic view: unconditional positive regard leads to an honest view of yourself, which frees the self-actualizing tendency to grow toward your potential.', b);
})());

/* 4.5: reciprocal determinism, three factors each influencing the others. */
add('social-cognitive-trait', (() => {
  const W = 760, H = 420;
  let b = '';
  const P1 = [380, 70], P2 = [150, 330], P3 = [610, 330];
  b += box(P1[0] - 140, P1[1] - 42, 280, 84, 'Person\nthoughts, beliefs, self-efficacy,\nexpectations', { size: 13, stroke: CER, fill: TINT });
  b += box(P2[0] - 130, P2[1] - 42, 260, 84, 'Behavior\nwhat you actually do', { size: 13 });
  b += box(P3[0] - 130, P3[1] - 42, 260, 84, 'Environment\npeople, places, feedback,\nopportunities', { size: 13 });
  b += L(300, 118, 190, 282, { stroke: CER, w: 2.5, arrow: 'cer', start: 'cer' });
  b += L(460, 118, 570, 282, { stroke: CER, w: 2.5, arrow: 'cer', start: 'cer' });
  b += L(286, 330, 474, 330, { stroke: CER, w: 2.5, arrow: 'cer', start: 'cer' });
  b += TL(150, 200, 'believing you can\nsucceed leads you\nto practice more', { anchor: 'middle', size: 12, fill: INK });
  b += TL(612, 200, 'a supportive coach\nraises your\nexpectations', { anchor: 'middle', size: 12, fill: INK });
  b += TL(380, 358, 'joining a team changes the\npeople you spend time with', { anchor: 'middle', size: 12, fill: INK });
  b += T(380, 408, 'Reciprocal determinism: each factor influences the other two.', { anchor: 'middle', size: 13, weight: 'bold', fill: CER });
  return svg('social-cognitive-trait-reciprocal', W, H, 'Reciprocal determinism',
    'A triangle of three boxes joined by two-way arrows. Person: thoughts, beliefs, self-efficacy and expectations. Behavior: what you actually do. Environment: people, places, feedback and opportunities. Examples on the arrows: believing you can succeed leads you to practice more; a supportive coach raises your expectations; joining a team changes the people you spend time with. Each factor influences the other two.', b);
})());

/* 4.6: the Yerkes-Dodson relationship as model curves (no data). */
add('motivation', (() => {
  const W = 760, H = 440;
  const x0 = 90, x1 = 700, y0 = 360, y1 = 50;
  const sx = a => x0 + (x1 - x0) * a, sy = p => y0 - (y0 - y1) * p;
  const curve = (peak, width, top) => { let d = ''; for (let i = 0; i <= 100; i++) { const a = i / 100; const p = top * Math.exp(-((a - peak) ** 2) / (2 * width ** 2)); d += (i ? 'L' : 'M') + f(sx(a)) + ',' + f(sy(p)); } return d; };
  let b = '';
  b += L(x0, y0, x1 + 10, y0, { w: 2, arrow: 'ink' }) + L(x0, y0, x0, y1 - 14, { w: 2, arrow: 'ink' });
  b += T((x0 + x1) / 2, 404, 'Arousal (low to high)', { anchor: 'middle', size: 15, weight: 'bold' });
  b += `<text transform="translate(40 ${(y0 + y1) / 2}) rotate(-90)" font-size="15" font-weight="bold" fill="${INK}" text-anchor="middle">Performance</text>`;
  b += T(x0 - 8, y0 + 18, 'low', { anchor: 'middle', size: 11, fill: GREY }) + T(x1, y0 + 18, 'high', { anchor: 'middle', size: 11, fill: GREY });
  b += P(curve(0.62, 0.2, 0.8), { stroke: CER, w: 3.5 });
  b += P(curve(0.36, 0.17, 0.75), { stroke: VERM, w: 3.5, dash: '10 6' });
  b += L(sx(0.62), sy(0.8), sx(0.62), y0, { stroke: CER, w: 1.2, dash: '3 4' });
  b += L(sx(0.36), sy(0.75), sx(0.36), y0, { stroke: VERM, w: 1.2, dash: '3 4' });
  b += TL(sx(0.72), sy(0.8) - 12, 'simple or well-practiced task:\nbest at higher arousal', { size: 13, fill: CER, weight: 'bold' });
  b += TL(sx(0.30), sy(0.75) - 20, 'difficult or new task:\nbest at lower arousal', { size: 13, fill: VERM, weight: 'bold', anchor: 'end' });
  b += T(x1, 432, 'Model curves to show the shape, not data from one study.', { anchor: 'end', size: 11, fill: GREY, italic: true });
  return svg('motivation-yerkes-dodson', W, H, 'The Yerkes-Dodson relationship',
    'Two inverted-U curves of performance against arousal. Performance is low at very low and very high arousal and best in between. The solid curve, a simple or well-practiced task, peaks at a higher level of arousal. The dashed curve, a difficult or new task, peaks at a lower level of arousal. Model curves to show the shape, not data from one study.', b);
})());

/* 4.7: emotion theories by sequence (the CED excludes their names). */
add('emotion', (() => {
  const W = 800, H = 470;
  let b = '';
  const row = (y, label, steps) => {
    let s = T(20, y - 44, label, { size: 14, weight: 'bold', fill: CER });
    let x = 20;
    steps.forEach((st, i) => {
      s += box(x, y - 32, st.w, 64, st.t, { size: 12, stroke: st.c || INK, fill: st.fill || '#FFFFFF' });
      x += st.w;
      if (i < steps.length - 1) { s += L(x + 4, y, x + 36, y, { stroke: INK, w: 2, arrow: 'ink' }); x += 40; }
    });
    return s;
  };
  const ev = { t: 'Event\na dog runs\nat you', w: 120, fill: LIGHT };
  b += row(84, '1. Arousal first, then the feeling', [ev, { t: 'Body arousal\nheart pounds,\nyou tremble', w: 150, c: VERM }, { t: 'Emotion\nyou notice the arousal\nand feel fear', w: 200, c: CER, fill: TINT }]);
  b += row(224, '2. Arousal and feeling at the same time', [ev, { t: 'Brain signals both at once\nbody arousal and the feeling of fear,\nneither causes the other', w: 330, c: CER, fill: TINT }]);
  b += row(364, '3. Arousal plus a cognitive appraisal, then the feeling', [ev, { t: 'Body arousal\nheart pounds', w: 130, c: VERM }, { t: 'Cognitive appraisal\nyou label the arousal:\n"this dog is dangerous"', w: 190, c: GREEN }, { t: 'Emotion\nfear', w: 120, c: CER, fill: TINT }]);
  b += T(20, 452, 'Tests ask you to match a scenario to a sequence, not to a theory name.', { size: 12, fill: GREY, italic: true });
  return svg('emotion-sequences', W, H, 'Three sequences for emotion',
    'Three rows, each starting from the same event, a dog running at you. Row 1, arousal first, then the feeling: the body becomes aroused (heart pounds, you tremble), you notice the arousal and feel fear. Row 2, arousal and feeling at the same time: the brain signals body arousal and the feeling of fear at once, and neither causes the other. Row 3, arousal plus a cognitive appraisal, then the feeling: the body is aroused, you label the arousal as "this dog is dangerous", and then you feel fear.', b);
})());

/* 5.1: the general adaptation syndrome as a model curve of resistance (no data). */
add('health-psychology', (() => {
  const W = 800, H = 440;
  const x0 = 80, x1 = 760, y0 = 360, base = 240;
  let b = '';
  b += R(x0, 40, 140, y0 - 40, { fill: '#FBEDE3' }) + R(x0 + 140, 40, 330, y0 - 40, { fill: TINT }) + R(x0 + 470, 40, x1 - x0 - 470, y0 - 40, { fill: LIGHT });
  b += T(x0 + 70, 66, '1. Alarm', { anchor: 'middle', size: 15, weight: 'bold', fill: VERM });
  b += T(x0 + 305, 66, '2. Resistance', { anchor: 'middle', size: 15, weight: 'bold', fill: CER });
  b += T(x0 + 575, 66, '3. Exhaustion', { anchor: 'middle', size: 15, weight: 'bold', fill: INK });
  b += L(x0, base, x1, base, { stroke: GREY, w: 1.5, dash: '6 5' });
  b += T(x1 - 4, base - 8, 'normal level of resistance', { anchor: 'end', size: 12, fill: GREY });
  b += P(`M${x0},${base} L${x0 + 30},${base} C${x0 + 60},${base} ${x0 + 70},${base + 50} ${x0 + 95},${base + 50} C${x0 + 120},${base + 50} ${x0 + 130},${base - 120} ${x0 + 175},${base - 125} L${x0 + 440},${base - 125} C${x0 + 500},${base - 120} ${x0 + 520},${base + 40} ${x0 + 580},${base + 80} L${x1 - 10},${base + 100}`, { stroke: CER, w: 3.5 });
  b += L(x0, y0, x1, y0, { w: 2, arrow: 'ink' }) + L(x0, y0, x0, 30, { w: 2, arrow: 'ink' });
  b += T((x0 + x1) / 2, 392, 'Time under a stressor that continues', { anchor: 'middle', size: 15, weight: 'bold' });
  b += `<text transform="translate(36 ${(y0 + 40) / 2}) rotate(-90)" font-size="15" font-weight="bold" fill="${INK}" text-anchor="middle">Resistance to stress</text>`;
  b += TL(x0 + 70, base + 78, 'shock, then\nsympathetic\narousal', { anchor: 'middle', size: 12 });
  b += TL(x0 + 305, base - 92, 'body copes at a high cost:\nhormones and arousal stay up', { anchor: 'middle', size: 12 });
  b += TL(x0 + 575, base + 44 - 140, 'reserves run down:\nmore vulnerable to illness', { anchor: 'middle', size: 12 });
  b += T(x1, 432, 'A model curve to show the stages, not data from one study.', { anchor: 'end', size: 11, fill: GREY, italic: true });
  return svg('health-psychology-gas', W, H, 'The general adaptation syndrome',
    'A curve of resistance to stress over time while a stressor continues, against a dashed line at the normal level. 1, Alarm: resistance briefly dips below normal at the shock, then sympathetic arousal begins. 2, Resistance: resistance rises well above normal and stays high while the body copes at a cost, with hormones and arousal kept up. 3, Exhaustion: reserves run down, resistance falls below normal and the person becomes more vulnerable to illness. A model curve, not data from one study.', b);
})());

/* 5.2: the six virtue categories with example character strengths. */
add('positive-psychology', (() => {
  const W = 800, H = 400;
  const V = [
    ['Wisdom', 'creativity, curiosity,\nlove of learning, perspective', CER],
    ['Courage', 'bravery, perseverance,\nhonesty, zest', VERM],
    ['Humanity', 'love, kindness,\nsocial intelligence', GREEN],
    ['Justice', 'teamwork, fairness,\nleadership', CER],
    ['Temperance', 'forgiveness, humility,\nprudence, self-regulation', VERM],
    ['Transcendence', 'gratitude, hope, humor,\nappreciation of beauty', GREEN],
  ];
  let b = T(400, 36, 'Six virtue categories and some of the character strengths in each', { anchor: 'middle', size: 16, weight: 'bold' });
  V.forEach(([name, s, c], i) => {
    const x = 30 + (i % 3) * 250, y = 64 + Math.floor(i / 3) * 150;
    b += R(x, y, 230, 130, { fill: '#FFFFFF', stroke: c, rx: 10, w: 2.5 });
    b += R(x, y, 230, 40, { fill: c, rx: 10 }) + R(x, y + 26, 230, 14, { fill: c });
    b += T(x + 115, y + 27, name, { anchor: 'middle', size: 16, weight: 'bold', fill: '#FFFFFF' });
    b += TL(x + 115, y + 72, s, { anchor: 'middle', size: 13 });
  });
  b += T(400, 388, 'Your signature strengths are the few you show most and that feel most like you.', { anchor: 'middle', size: 13, fill: CER, weight: 'bold' });
  return svg('positive-psychology-virtues', W, H, 'Six virtue categories',
    'Six boxes. Wisdom: creativity, curiosity, love of learning, perspective. Courage: bravery, perseverance, honesty, zest. Humanity: love, kindness, social intelligence. Justice: teamwork, fairness, leadership. Temperance: forgiveness, humility, prudence, self-regulation. Transcendence: gratitude, hope, humor, appreciation of beauty. Your signature strengths are the few you show most and that feel most like you.', b);
})());

if (process.argv.includes('--list')) { for (const g of FIGS) console.log(`${g.id} ${g.w}x${g.h} (${g.topic})`); process.exit(0); }
mkdirSync(OUT, { recursive: true }); mkdirSync(REG, { recursive: true });
const byTopic = {};
for (const g of FIGS) {
  writeFileSync(join(OUT, `${g.id}.svg`), g.svg);
  (byTopic[g.topic] ||= {})[g.id] = { file: `figures/${g.id}.svg`, ext: 'svg', w: g.w, h: g.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt: g.alt };
}
for (const [t, o] of Object.entries(byTopic)) writeFileSync(join(REG, `${t}.json`), JSON.stringify(o, null, 1) + '\n');
console.log(`author F figures: ${FIGS.length} written`);
