/* AP® Psychology figures for Unit 5 topics 5.3-5.5 (author G): explaining
   disorders, the categories of disorders, and treatments. All three are
   conceptual diagrams drawn from coordinates (no data); data figures for these
   topics are plot specs in the question files, drawn by the build.

     node scripts/appsych-figures/author-g.mjs          writes psychology/figures/<id>.svg
     node scripts/appsych-figures/author-g.mjs --list   prints ids and sizes

   Style: white background, Arial/Helvetica, ink #1F2A28, course cerulean
   #084F78 for emphasis, Okabe-Ito vermillion #D55E00 and green #009E73 as
   second colors; role="img" with <title> and <desc>. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const OUT = join(ROOT, 'psychology', 'figures');
const INK = '#1F2A28', CER = '#084F78', CERT = '#DCEBF4', VERM = '#D55E00', VERMT = '#FBE3D4', GREEN = '#009E73', GREENT = '#D6F0E7', PURP = '#CC79A7', PURPT = '#F5E3EE';
const GREY = '#6B7472', LIGHT = '#E3E7E6';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = v => +(+v).toFixed(2);
function T(x, y, s, o = {}) {
  const a = o.anchor || 'start', sz = o.size || 14, w = o.weight || 'normal', fill = o.fill || INK;
  return `<text x="${f(x)}" y="${f(y)}" font-size="${sz}" font-weight="${w}" fill="${fill}" text-anchor="${a}"${o.italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
}
function TL(x, y, s, o = {}) { const lh = o.lh || (o.size || 14) * 1.3; return String(s).split('\n').map((l, i) => T(x, y + i * lh, l, o)).join(''); }
const L = (x1, y1, x2, y2, o = {}) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#ar-${o.arrow})"` : ''}/>`;
const Rc = (x, y, w, h, o = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${o.rx || 0}" fill="${o.fill || 'none'}" stroke="${o.stroke || 'none'}" stroke-width="${o.w || 1.5}"/>`;
function svg(id, w, h, title, desc, body) {
  const marks = [['ink', INK], ['cer', CER], ['grey', GREY]].map(([n, c]) =>
    `<marker id="ar-${n}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('');
  return { id, w, h, alt: desc, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="${FONT}">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<defs>${marks}</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
${body}
</svg>
` };
}

/* 1. The diathesis-stress model: vulnerability plus stress against a threshold. */
function diathesis() {
  const W = 820, H = 510, base = 370, unit = 26, thr = 9; // threshold in units
  const people = [
    { x: 150, name: 'Person 1', v: 7, s: 3, note: 'high vulnerability,\nsmall stress' },
    { x: 400, name: 'Person 2', v: 2, s: 3, note: 'low vulnerability,\nthe same small stress' },
    { x: 650, name: 'Person 3', v: 2, s: 8, note: 'low vulnerability,\nlarge stress' },
  ];
  let b = '';
  b += T(W / 2, 34, 'The diathesis-stress model', { anchor: 'middle', size: 20, weight: 'bold' });
  b += T(W / 2, 58, 'A disorder appears when vulnerability and stress together pass a threshold (a model, not data).', { anchor: 'middle', size: 14, fill: GREY });
  const ty = base - thr * unit;
  b += L(60, ty, W - 40, ty, { stroke: INK, w: 2, dash: '8 6' });
  b += Rc(232, ty - 44, 106, 40, { fill: '#FFFFFF' });
  b += TL(285, ty - 28, 'Threshold\nfor a disorder', { anchor: 'middle', size: 14, weight: 'bold', lh: 17 });
  b += L(60, base, W - 40, base, { stroke: INK, w: 1.5 });
  for (const p of people) {
    const bw = 90, x0 = p.x - bw / 2;
    const vy = base - p.v * unit, sy = vy - p.s * unit;
    b += Rc(x0, vy, bw, p.v * unit, { fill: CER });
    b += Rc(x0, sy, bw, p.s * unit, { fill: VERM });
    if (p.v >= 2) b += T(p.x, vy + (p.v * unit) / 2 + 5, 'Vulnerability', { anchor: 'middle', size: p.v > 3 ? 14 : 12, fill: '#FFFFFF', weight: 'bold' });
    b += T(p.x, sy + (p.s * unit) / 2 + 5, 'Stress', { anchor: 'middle', size: 14, fill: '#FFFFFF', weight: 'bold' });
    b += T(p.x, base + 24, p.name, { anchor: 'middle', size: 15, weight: 'bold' });
    b += TL(p.x, base + 44, p.note, { anchor: 'middle', size: 13, fill: GREY, lh: 17 });
    const over = p.v + p.s > thr;
    b += T(p.x, base + 86, over ? 'Above the threshold:' : 'Below the threshold:', { anchor: 'middle', size: 13, weight: 'bold', fill: over ? VERM : GREEN });
    b += T(p.x, base + 103, over ? 'a disorder is more likely' : 'a disorder is less likely', { anchor: 'middle', size: 13, fill: over ? VERM : GREEN });
  }
  return svg('explaining-disorders-diathesis', W, H, 'The diathesis-stress model',
    'Three stacked bars against a dashed threshold line. Each bar is vulnerability (cerulean, bottom) plus stress (vermillion, top). Person 1 has high vulnerability and small stress and passes the threshold, so a disorder is more likely. Person 2 has low vulnerability and the same small stress and stays below it. Person 3 has low vulnerability but large stress and passes the threshold. A conceptual model, not data.', b);
}

/* 2. The categories of disorders the course covers, with their examples. */
function categories() {
  const W = 860, H = 610;
  const cats = [
    ['Neurodevelopmental', 'ADHD; autism spectrum disorder'],
    ['Schizophrenia spectrum', 'schizophrenia: positive and\nnegative symptoms'],
    ['Depressive', 'major depressive disorder;\npersistent depressive disorder'],
    ['Bipolar', 'bipolar I (mania);\nbipolar II (hypomania)'],
    ['Anxiety', 'specific phobia, agoraphobia, panic,\nsocial anxiety, generalized anxiety'],
    ['Obsessive-compulsive\nand related', 'obsessive-compulsive disorder;\nhoarding disorder'],
    ['Dissociative', 'dissociative amnesia (with or\nwithout fugue); dissociative\nidentity disorder'],
    ['Trauma- and stressor-\nrelated', 'posttraumatic stress disorder'],
    ['Feeding and eating', 'anorexia nervosa;\nbulimia nervosa'],
    ['Personality', 'Cluster A (odd), Cluster B (dramatic),\nCluster C (anxious)'],
  ];
  const fills = [CERT, CERT, VERMT, VERMT, GREENT, GREENT, PURPT, PURPT, LIGHT, LIGHT];
  const edges = [CER, CER, VERM, VERM, GREEN, GREEN, PURP, PURP, GREY, GREY];
  let b = T(W / 2, 34, 'Categories of psychological disorders in the course', { anchor: 'middle', size: 20, weight: 'bold' });
  b += T(W / 2, 58, 'DSM-5-TR category names, each with the representative disorders you need', { anchor: 'middle', size: 14, fill: GREY });
  const cw = 395, ch = 92, gx = 30, gy = 12, x0 = (W - 2 * cw - gx) / 2, y0 = 78;
  cats.forEach(([name, ex], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (cw + gx), y = y0 + row * (ch + gy);
    b += Rc(x, y, cw, ch, { fill: fills[i], stroke: edges[i], rx: 10, w: 2 });
    const nameLines = name.split('\n');
    b += TL(x + 14, y + 26, name, { size: 15, weight: 'bold', lh: 18 });
    b += TL(x + 14, y + 26 + nameLines.length * 18 + 2, ex, { size: 13, lh: 16 });
  });
  return svg('disorders-categories', W, H, 'Categories of psychological disorders in the course',
    'Ten boxes, one per DSM-5-TR category, each listing its representative disorders: neurodevelopmental (ADHD, autism spectrum disorder); schizophrenia spectrum (schizophrenia, with positive and negative symptoms); depressive (major depressive disorder, persistent depressive disorder); bipolar (bipolar I with mania, bipolar II with hypomania); anxiety (specific phobia, agoraphobia, panic, social anxiety, generalized anxiety); obsessive-compulsive and related (obsessive-compulsive disorder, hoarding disorder); dissociative (dissociative amnesia with or without fugue, dissociative identity disorder); trauma- and stressor-related (posttraumatic stress disorder); feeding and eating (anorexia nervosa, bulimia nervosa); personality (Clusters A, B and C).', b);
}

/* 3. Approaches to treatment: what each targets and a technique. */
function approaches() {
  const W = 880, H = 520;
  const rows = [
    ['Psychodynamic', 'unconscious conflicts from\nearlier experience', 'free association;\ndream interpretation', CER],
    ['Humanistic', 'blocked growth; a gap between\nself-concept and experience', 'person-centered therapy:\nactive listening, UPR', CER],
    ['Behavioral', 'learned behaviors and\nlearned fears', 'exposure; systematic desensitization;\naversion therapy; token economy', VERM],
    ['Cognitive', 'distorted, negative\nthoughts', 'cognitive restructuring;\nREBT disputes irrational beliefs', VERM],
    ['Cognitive-behavioral', 'thoughts and behaviors\ntogether', 'CBT; DBT (skills for strong\nemotions)', VERM],
    ['Biomedical', 'brain chemistry and\nbrain activity', 'medication; TMS; ECT;\nrarely, psychosurgery', GREEN],
  ];
  let b = T(W / 2, 34, 'Approaches to treatment', { anchor: 'middle', size: 20, weight: 'bold' });
  b += T(W / 2, 58, 'Psychotherapies (cerulean and vermillion) and biomedical therapy (green)', { anchor: 'middle', size: 14, fill: GREY });
  const xs = [30, 260, 560], ws = [210, 280, 290], y0 = 74, rh = 70;
  ['Approach', 'What it targets', 'Example techniques'].forEach((h, i) => { b += T(xs[i] + 12, y0 + 20, h, { size: 15, weight: 'bold' }); });
  rows.forEach(([a, t, e, c], i) => {
    const y = y0 + 32 + i * rh;
    b += Rc(xs[0], y, ws[0], rh - 10, { fill: c, rx: 8 });
    b += T(xs[0] + ws[0] / 2, y + (rh - 10) / 2 + 5, a, { anchor: 'middle', size: 15, weight: 'bold', fill: '#FFFFFF' });
    b += L(xs[0] + ws[0] + 2, y + (rh - 10) / 2, xs[1] - 4, y + (rh - 10) / 2, { stroke: GREY, w: 1.5, arrow: 'grey' });
    b += Rc(xs[1], y, ws[1], rh - 10, { fill: '#FFFFFF', stroke: c, rx: 8 });
    b += TL(xs[1] + 12, y + 24, t, { size: 13, lh: 17 });
    b += L(xs[1] + ws[1] + 2, y + (rh - 10) / 2, xs[2] - 4, y + (rh - 10) / 2, { stroke: GREY, w: 1.5, arrow: 'grey' });
    b += Rc(xs[2], y, ws[2], rh - 10, { fill: '#FFFFFF', stroke: c, rx: 8 });
    b += TL(xs[2] + 12, y + 24, e, { size: 13, lh: 17 });
  });
  return svg('treatment-approaches', W, H, 'Approaches to treatment',
    'Six rows, each an approach, what it targets and example techniques. Psychodynamic: unconscious conflicts; free association and dream interpretation. Humanistic: blocked growth; person-centered therapy with active listening and unconditional positive regard. Behavioral: learned behaviors and fears; exposure, systematic desensitization, aversion therapy, token economy. Cognitive: distorted negative thoughts; cognitive restructuring and REBT. Cognitive-behavioral: thoughts and behaviors together; CBT and DBT. Biomedical: brain chemistry and activity; medication, TMS, ECT and, rarely, psychosurgery.', b);
}

const figs = [diathesis(), categories(), approaches()];
if (process.argv.includes('--list')) for (const g of figs) console.log(`${g.id} ${g.w}x${g.h}`);
else {
  mkdirSync(OUT, { recursive: true });
  for (const g of figs) writeFileSync(join(OUT, `${g.id}.svg`), g.svg);
  console.log(`wrote ${figs.length} figures to psychology/figures/`);
}
export { figs };
