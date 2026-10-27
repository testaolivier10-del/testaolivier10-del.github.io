/* Figures for AP® Psychology topics 1.3-1.6 (author B): the neuron and
   synapse, the action potential, the brain (side and middle views), a
   hypnogram, the eye and the ear. Each is a LevlPrep original SVG written to
   psychology/figures/<id>.svg; the figure registry entries go in
   psychology/data/figures/<topic>.json and the label boxes (for "Hide
   labels" on the lesson figure) in psychology/data/labels/<id>.json.

     node scripts/appsych-figures/author-b.mjs

   House style: white background, Arial/Helvetica, ink #1F2A28, cerulean
   #084F78 for emphasis, Okabe-Ito vermillion #D55E00, green #009E73 and
   reddish purple #CC79A7 as second colors. Every SVG has role="img", a
   <title> and a <desc>. Anatomy follows a current introductory text: the
   front of the head is on the left in every side view. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FIG = join(ROOT, 'psychology', 'figures');
const DATA = join(ROOT, 'psychology', 'data');
mkdirSync(FIG, { recursive: true });
mkdirSync(join(DATA, 'figures'), { recursive: true });
mkdirSync(join(DATA, 'labels'), { recursive: true });

const INK = '#1F2A28', BLUE = '#084F78', VERM = '#D55E00', GREEN = '#009E73', PURPLE = '#CC79A7';
const FONT = 'Arial, Helvetica, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = v => Math.round(v * 10) / 10;

/* Text width estimate for Arial (average glyph about 0.53 em). */
const tw = (s, size) => s.length * size * 0.53;

class Fig {
  constructor(id, w, h, title, desc) { Object.assign(this, { id, w, h, title, desc, body: [], labels: [] }); }
  add(s) { this.body.push(s); return this; }
  /* A label: text (one or more lines), optional leader from (lx, ly) to the
     point it names; recorded for "Hide labels". anchor: start | middle | end. */
  label(id, lines, x, y, { to, anchor = 'start', size = 15, bold = false, color = INK, concept, halo = true } = {}) {
    lines = [].concat(lines);
    const lh = size * 1.2, w = Math.max(...lines.map(l => tw(l, size))), h = lh * lines.length;
    const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2, y0 = y - size * 0.9;
    if (to) {
      const [tx, ty] = to;
      // the leader leaves the label at its nearest edge
      const ex = tx < x0 ? x0 - 3 : tx > x0 + w ? x0 + w + 3 : Math.min(Math.max(tx, x0), x0 + w);
      const ey = ty < y0 ? y0 - 2 : ty > y0 + h ? y0 + h + 1 : y0 + h / 2;
      this.add(`<line x1="${r(ex)}" y1="${r(ey)}" x2="${r(tx)}" y2="${r(ty)}" stroke="${INK}" stroke-width="1.2"/><circle cx="${r(tx)}" cy="${r(ty)}" r="2.6" fill="${INK}"/>`);
    }
    if (halo) this.add(`<rect x="${r(x0 - 3)}" y="${r(y0 - 2)}" width="${r(w + 6)}" height="${r(h + 3)}" rx="3" fill="#FFFFFF" fill-opacity="0.88"/>`);
    this.add(`<text x="${r(x)}" y="${r(y)}" font-size="${size}" text-anchor="${anchor}" fill="${color}"${bold ? ' font-weight="bold"' : ''}>${lines.map((l, i) => `<tspan x="${r(x)}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join('')}</text>`);
    if (id) this.labels.push({ id, name: lines.join(' '), box: [Math.floor(x0 - 4), Math.floor(y0 - 3), Math.ceil(w + 8), Math.ceil(h + 5)], ...(concept ? { concept } : {}) });
    return this;
  }
  /* A lettered badge for the unlabeled copies (visual question sets). */
  badge(letter, x, y, to) {
    if (to) this.add(`<line x1="${r(x)}" y1="${r(y)}" x2="${r(to[0])}" y2="${r(to[1])}" stroke="${INK}" stroke-width="1.4"/><circle cx="${r(to[0])}" cy="${r(to[1])}" r="2.8" fill="${INK}"/>`);
    this.add(`<circle cx="${r(x)}" cy="${r(y)}" r="14" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/><text x="${r(x)}" y="${r(y + 5.5)}" font-size="16" font-weight="bold" text-anchor="middle" fill="${INK}">${letter}</text>`);
    return this;
  }
  svg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-labelledby="${this.id}-t ${this.id}-d" font-family="${FONT}">
<title id="${this.id}-t">${esc(this.title)}</title>
<desc id="${this.id}-d">${esc(this.desc)}</desc>
<rect width="${this.w}" height="${this.h}" fill="#FFFFFF"/>
${this.body.join('\n')}
</svg>
`;
  }
}

const registry = {}; // topic -> { figId: entry }
function save(topic, f, alt) {
  writeFileSync(join(FIG, `${f.id}.svg`), f.svg());
  (registry[topic] ||= {})[f.id] = { file: `figures/${f.id}.svg`, ext: 'svg', w: f.w, h: f.h, source: 'levlprep', license: 'LevlPrep original', credit: 'LevlPrep original diagram', alt };
  if (f.labels.length && f.keepLabels) writeFileSync(join(DATA, 'labels', `${f.id}.json`), JSON.stringify({ figure: f.id, labels: f.labels }, null, 1) + '\n');
}

/* ===================================================== the neuron ===== */
/* A tube drawn as an outline stroke under a fill stroke. */
function tubes(paths, fill, edge, w) {
  return paths.map(([d, k = 1]) => `<path d="${d}" fill="none" stroke="${edge}" stroke-width="${w * k + 3}" stroke-linecap="round" stroke-linejoin="round"/>`).join('') +
    paths.map(([d, k = 1]) => `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${w * k}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
}
function neuronBody(f) {
  const cell = '#D6E6F0';
  // dendrites: branching tubes leaving the cell body to the left, up and down
  const dend = [
    ['M128 168 C100 150 80 120 58 96', 1.3], ['M74 116 C62 112 46 116 34 124', 0.8], ['M66 104 C60 88 62 72 70 58', 0.8],
    ['M122 150 C118 120 124 92 140 66', 1.2], ['M132 90 C146 84 160 72 168 58', 0.8],
    ['M120 186 C96 204 78 230 64 258', 1.3], ['M80 228 C62 226 46 232 34 240', 0.8], ['M70 248 C70 266 76 280 86 292', 0.8],
    ['M136 200 C140 230 150 254 170 276', 1.1], ['M152 248 C166 250 182 258 192 270', 0.7],
    ['M112 176 C86 176 62 172 40 176', 1.0],
  ];
  f.add(tubes(dend, cell, BLUE, 7));
  // cell body and nucleus, then the axon hillock
  f.add(`<path d="M168 172 C188 168 196 164 212 165 L212 175 C196 176 188 178 168 184 Z" fill="${cell}" stroke="${BLUE}" stroke-width="1.5"/>`);
  f.add(`<ellipse cx="134" cy="174" rx="40" ry="36" fill="${cell}" stroke="${BLUE}" stroke-width="2.5"/><circle cx="128" cy="172" r="13" fill="#A9C9DE" stroke="${BLUE}" stroke-width="1.5"/>`);
  // axon (a tube) with the myelin sheath in segments
  f.add(`<rect x="206" y="165" width="404" height="10" fill="${cell}" stroke="${BLUE}" stroke-width="1.5"/>`);
  for (let x = 224; x < 580; x += 66) f.add(`<rect x="${x}" y="157" width="56" height="26" rx="12" fill="#FCE9DA" stroke="${VERM}" stroke-width="2"/>`);
  // axon terminals: branches ending in knobs
  const term = [['M606 170 C630 150 650 128 676 112'], ['M606 170 C636 162 664 152 694 148'], ['M606 170 C636 180 664 190 694 196'], ['M606 170 C630 192 650 216 676 232']];
  f.add(tubes(term, cell, BLUE, 6));
  for (const [x, y] of [[680, 110], [698, 148], [698, 197], [680, 234]]) f.add(`<circle cx="${x}" cy="${y}" r="10" fill="${cell}" stroke="${BLUE}" stroke-width="2"/>`);
  // direction of the signal
  f.add(`<defs><marker id="${f.id}-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${GREEN}"/></marker></defs>`);
  f.add(`<line x1="230" y1="212" x2="560" y2="212" stroke="${GREEN}" stroke-width="3" marker-end="url(#${f.id}-ar)"/>`);
}
function synapsePanel(f) {
  // zoom lines from one terminal knob to the panel
  f.add(`<rect x="420" y="296" width="360" height="226" rx="10" fill="#FFFFFF" stroke="${INK}" stroke-width="1.5"/>`);
  f.add(`<path d="M698 207 L470 296 M708 200 L770 296" stroke="${INK}" stroke-width="1" stroke-dasharray="4 4" fill="none"/>`);
  f.add(`<circle cx="698" cy="197" r="14" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="4 4"/>`);
  // sending terminal (top) and receiving dendrite (bottom)
  f.add(`<path d="M440 300 L760 300 L760 368 C760 398 740 410 712 410 L490 410 C462 410 440 398 440 368 Z" fill="#D6E6F0" stroke="${BLUE}" stroke-width="2.5"/>`);
  f.add(`<path d="M440 512 L760 512 L760 470 C760 452 744 446 726 446 L474 446 C456 446 440 452 440 470 Z" fill="#D3EFE6" stroke="${GREEN}" stroke-width="2.5"/>`);
  // vesicles with neurotransmitter inside; two fusing at the membrane
  const dots = (cx, cy, n = 5, rr = 7) => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n + 0.4; return `<circle cx="${r(cx + Math.cos(a) * rr * 0.55)}" cy="${r(cy + Math.sin(a) * rr * 0.55)}" r="2.4" fill="${VERM}"/>`; }).join('');
  for (const [x, y] of [[490, 340], [530, 330], [575, 345], [520, 372], [612, 330], [650, 352]]) f.add(`<circle cx="${x}" cy="${y}" r="13" fill="#FFFFFF" stroke="${BLUE}" stroke-width="1.5"/>${dots(x, y, 5, 13)}`);
  f.add(`<path d="M560 410 C560 394 586 394 586 410" fill="#FFFFFF" stroke="${BLUE}" stroke-width="1.5"/><path d="M612 410 C612 396 636 396 636 410" fill="#FFFFFF" stroke="${BLUE}" stroke-width="1.5"/>`);
  // released neurotransmitter in the gap
  for (const [x, y] of [[566, 420], [578, 430], [590, 418], [604, 436], [618, 422], [630, 432], [642, 420], [598, 428], [584, 440], [652, 436]]) f.add(`<circle cx="${x}" cy="${y}" r="3" fill="${VERM}"/>`);
  // receptor sites: cups on the receiving membrane, some holding a molecule
  for (const x of [520, 560, 600, 640, 680]) f.add(`<path d="M${x - 9} 446 L${x - 9} 438 L${x - 4} 438 L${x - 4} 443 L${x + 4} 443 L${x + 4} 438 L${x + 9} 438 L${x + 9} 446" fill="${GREEN}" stroke="${GREEN}" stroke-width="1"/>`);
  f.add(`<circle cx="600" cy="439" r="3" fill="${VERM}"/><circle cx="640" cy="439" r="3" fill="${VERM}"/>`);
  // reuptake: a curved arrow from the gap back into the terminal
  f.add(`<defs><marker id="${f.id}-ru" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${PURPLE}"/></marker></defs>`);
  f.add(`<path d="M672 432 C712 434 724 418 712 386" fill="none" stroke="${PURPLE}" stroke-width="3" marker-end="url(#${f.id}-ru)"/>`);
}
{
  const f = new Fig('neural-firing-neuron', 800, 540, 'A neuron and a synapse',
    'A neuron drawn left to right. Branching dendrites lead into the cell body, which holds the nucleus. The axon leaves the cell body and is wrapped in segments of myelin sheath. It ends in axon terminals. A green arrow shows the signal traveling from the cell body toward the terminals. An enlarged panel shows one synapse: the sending axon terminal holds vesicles of neurotransmitter, some vesicles release molecules into the synaptic gap, the molecules bind to receptor sites on the receiving dendrite, and a purple arrow shows reuptake back into the sending terminal.');
  neuronBody(f); synapsePanel(f);
  f.label('dendrites', 'Dendrites', 20, 40, { to: [62, 70], concept: 'dendrite' });
  f.label('cell-body', ['Cell body', '(soma)'], 110, 260, { to: [128, 206], anchor: 'middle', concept: 'cell-body' });
  f.label('axon', 'Axon', 296, 120, { to: [282, 170], concept: 'axon' });
  f.label('myelin', 'Myelin sheath', 390, 120, { to: [398, 158], concept: 'myelin' });
  f.label('terminals', 'Axon terminals', 640, 60, { to: [680, 100], concept: 'axon-terminal' });
  f.label(null, 'Direction of the action potential', 395, 240, { anchor: 'middle', color: GREEN, size: 14, halo: false });
  f.label(null, 'At a synapse (enlarged)', 600, 290, { anchor: 'middle', bold: true, size: 14 });
  f.label('vesicles', ['Vesicles holding', 'neurotransmitter'], 210, 330, { to: [478, 340], concept: 'neurotransmitter' });
  f.label('sending', ['Axon terminal of the', 'sending neuron'], 210, 380, { to: [446, 390], concept: 'axon-terminal' });
  f.label('gap', ['Synaptic gap', '(synapse)'], 210, 425, { to: [560, 428], concept: 'synapse' });
  f.label('receptors', 'Receptor sites', 210, 470, { to: [520, 440], concept: 'neurotransmitter' });
  f.label('receiving', ['Dendrite of the', 'receiving neuron'], 210, 505, { to: [446, 500], concept: 'dendrite' });
  f.label('reuptake', 'Reuptake', 690, 480, { to: [718, 420], concept: 'reuptake' });
  f.keepLabels = true;
  save('neural-firing', f, 'A neuron, left to right: branching dendrites, the cell body with its nucleus, an axon wrapped in segments of myelin sheath, and branching axon terminals; an arrow shows the action potential traveling from the cell body toward the terminals. An enlarged synapse below shows vesicles of neurotransmitter in the sending terminal, molecules crossing the synaptic gap to receptor sites on the receiving dendrite, and a reuptake arrow back into the sending terminal.');
}
{
  const f = new Fig('neural-firing-neuron-letters', 800, 540, 'A neuron and a synapse, parts marked A to F',
    'The same neuron and synapse with six parts marked by letters instead of names. A marks a dendrite at the far left. B marks the cell body. C marks a segment of the myelin sheath on the axon. D marks an axon terminal knob. E marks the synaptic gap between the sending terminal and the receiving dendrite in the enlarged panel. F marks a receptor site on the receiving dendrite.');
  neuronBody(f); synapsePanel(f);
  f.badge('A', 30, 60, [58, 94]);
  f.badge('B', 190, 120, [150, 150]);
  f.badge('C', 400, 120, [398, 157]);
  f.badge('D', 740, 70, [686, 104]);
  f.badge('E', 380, 428, [560, 428]);
  f.badge('F', 380, 480, [520, 440]);
  save('neural-firing', f, 'The neuron and synapse with six parts marked by letters: A a dendrite, B the cell body, C a segment of myelin sheath on the axon, D an axon terminal, E the synaptic gap in the enlarged synapse, F a receptor site on the receiving dendrite. The letters are the answers to questions, so the figure gives no names.');
}

/* ============================================ the action potential ===== */
{
  const W = 720, H = 400, L = 80, R = 690, T = 30, B = 330;
  const f = new Fig('neural-firing-action-potential', W, H, 'One action potential, charge across the membrane over time',
    'A graph of the electrical charge inside a neuron, in millivolts, over about 6 milliseconds. The line sits at the resting potential of about -70 mV, rises slightly to the threshold of about -55 mV, then shoots up to a peak of about +40 mV (depolarization), falls back below rest to about -80 mV and returns to -70 mV. The stretch after the peak is labeled the refractory period.');
  const sx = t => L + (t / 6) * (R - L), sy = v => T + ((50 - v) / 140) * (B - T);
  // axes and ticks
  f.add(`<line x1="${L}" y1="${T}" x2="${L}" y2="${B}" stroke="${INK}" stroke-width="1.5"/><line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${INK}" stroke-width="1.5"/>`);
  for (const v of [40, 0, -55, -70, -90]) f.add(`<line x1="${L - 5}" y1="${r(sy(v))}" x2="${L}" y2="${r(sy(v))}" stroke="${INK}"/><text x="${L - 8}" y="${r(sy(v) + 5)}" font-size="13" text-anchor="end" fill="${INK}">${v > 0 ? '+' + v : v}</text>`);
  for (let t = 0; t <= 6; t++) f.add(`<line x1="${r(sx(t))}" y1="${B}" x2="${r(sx(t))}" y2="${B + 5}" stroke="${INK}"/><text x="${r(sx(t))}" y="${B + 20}" font-size="13" text-anchor="middle" fill="${INK}">${t}</text>`);
  f.add(`<text x="${(L + R) / 2}" y="${B + 44}" font-size="14" text-anchor="middle" fill="${INK}">Time (milliseconds)</text>`);
  f.add(`<text transform="translate(22 ${(T + B) / 2}) rotate(-90)" font-size="14" text-anchor="middle" fill="${INK}">Charge inside the neuron (mV)</text>`);
  // reference lines: 0, threshold, rest
  f.add(`<line x1="${L}" y1="${r(sy(0))}" x2="${R}" y2="${r(sy(0))}" stroke="#B9C2C0" stroke-width="1"/>`);
  f.add(`<line x1="${L}" y1="${r(sy(-55))}" x2="${R}" y2="${r(sy(-55))}" stroke="${VERM}" stroke-width="1.5" stroke-dasharray="6 5"/>`);
  f.add(`<line x1="${L}" y1="${r(sy(-70))}" x2="${R}" y2="${r(sy(-70))}" stroke="${GREEN}" stroke-width="1.5" stroke-dasharray="2 4"/>`);
  // the curve
  const pts = [[0, -70], [1.0, -70], [1.3, -66], [1.6, -55], [1.85, 0], [2.0, 40], [2.2, 20], [2.55, -40], [2.85, -72], [3.2, -80], [3.8, -76], [4.4, -71], [5, -70], [6, -70]];
  // a Catmull-Rom spline through the points, as cubic Beziers
  const P = pts.map(([t, v]) => [sx(t), sy(v)]);
  let d = `M${r(P[0][0])} ${r(P[0][1])}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    d += ` C${r(p1[0] + (p2[0] - p0[0]) / 6)} ${r(p1[1] + (p2[1] - p0[1]) / 6)} ${r(p2[0] - (p3[0] - p1[0]) / 6)} ${r(p2[1] - (p3[1] - p1[1]) / 6)} ${r(p2[0])} ${r(p2[1])}`;
  }
  // refractory period: a light band from the peak until the charge is back at rest
  f.add(`<rect x="${r(sx(2.0))}" y="${T}" width="${r(sx(4.4) - sx(2.0))}" height="${B - T}" fill="${PURPLE}" fill-opacity="0.12"/>`);
  f.add(`<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="3.5" stroke-linejoin="round"/>`);
  f.label('refractory', ['Refractory period:', 'it cannot fire again yet'], sx(3.45), sy(30), { anchor: 'middle', size: 14, concept: 'refractory-period' });
  f.label('threshold', 'Threshold (about -55 mV)', sx(4.0), sy(-55) - 8, { concept: 'threshold-neural', size: 14 });
  f.label('rest', 'Resting potential (-70 mV)', sx(4.45), sy(-70) + 22, { concept: 'resting-potential', size: 14 });
  f.label('depol', ['Depolarization:', 'the inside turns', 'positive'], 92, sy(25), { to: [sx(1.83), sy(-5)], concept: 'depolarization', size: 14 });
  f.label('peak', ['Peak, about +40 mV,', 'the same every time'], sx(2.3), sy(48), { to: [sx(2.02), sy(40)], concept: 'all-or-none', size: 14 });
  f.keepLabels = true;
  save('neural-firing', f, 'A graph of the charge inside a neuron over 6 milliseconds. The line starts flat at the resting potential, about -70 mV, rises to the threshold, about -55 mV (a dashed line), then shoots up to a peak of about +40 mV, which every action potential reaches. It falls back, dips below rest to about -80 mV, and returns to -70 mV. A bracket marks the refractory period, from the peak until the charge is back at rest.');
}

/* ===================================================== the brain ===== */
/* Left hemisphere seen from the left: the front of the head is on the left. */
const CEREBRUM = 'M165 318 C120 290 105 200 150 145 C200 80 300 55 400 58 C500 60 600 95 650 165 C690 220 700 280 672 318 C650 345 610 350 585 340 C560 365 540 385 505 392 C430 400 330 395 270 372 C240 360 232 330 245 315 C230 318 200 325 165 318 Z';
const LOBES = {
  frontal: ['#D6E6F0', '0,0 432,0 426,40 345,287 245,315 215,330 150,600 0,600'],
  parietal: ['#D3EFE6', '432,0 600,0 598,110 606,240 480,248 345,287 426,40'],
  temporal: ['#FBE3D0', '245,315 345,287 480,248 606,240 612,330 612,600 150,600 215,330'],
  occipital: ['#EBD9F2', '600,0 800,0 800,600 612,600 612,330 606,240 598,110'],
};
function lateralBrain(f) {
  f.add(`<defs><clipPath id="${f.id}-cl"><path d="${CEREBRUM}"/></clipPath></defs>`);
  // brainstem and cerebellum first (behind the cerebrum)
  f.add(`<path d="M432 360 C436 410 438 450 446 500 L486 500 C484 452 488 410 496 360 Z" fill="#DADADA" stroke="${INK}" stroke-width="2"/>`);
  f.add(`<path d="M500 372 C520 342 600 334 650 352 C680 366 676 410 640 428 C600 446 540 440 512 420 C494 406 490 388 500 372 Z" fill="#E7E2D6" stroke="${INK}" stroke-width="2"/>`);
  for (const k of [0, 1, 2, 3, 4]) f.add(`<path d="M${514 + k * 4} ${392 + k * 8} C${560} ${378 + k * 9} ${620} ${374 + k * 9} ${658 - k * 6} ${384 + k * 8}" fill="none" stroke="#A89E86" stroke-width="1.2"/>`);
  // lobes, clipped to the cerebrum
  f.add(`<g clip-path="url(#${f.id}-cl)">` + Object.values(LOBES).map(([c, p]) => `<polygon points="${p}" fill="${c}"/>`).join('') +
    // motor strip just in front of the central sulcus, somatosensory strip just behind
    `<polygon points="426,40 345,287 315,293 396,40" fill="#9CC2DA"/><polygon points="426,40 345,287 375,279 456,40" fill="#9AD8C3"/>` +
    // gentle folds (gyri) for texture
    ['M180 150 C220 140 250 170 300 150', 'M170 230 C210 220 240 250 290 230', 'M240 110 C270 100 300 120 340 100', 'M480 120 C510 140 540 120 580 140', 'M470 190 C510 200 540 180 590 200', 'M300 340 C350 330 400 345 460 330', 'M630 200 C650 230 660 260 660 290', 'M270 285 C300 270 320 280 330 265'].map(d => `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/>`).join('') +
    // the central sulcus, the lateral fissure and the lobe borders
    `<path d="M426 40 L345 287" stroke="${INK}" stroke-width="2.5" fill="none"/><path d="M245 315 L480 248 L520 236" stroke="${INK}" stroke-width="3" fill="none"/>` +
    `<path d="M480 248 L606 240" stroke="${INK}" stroke-width="1.2" stroke-dasharray="5 4" fill="none"/><path d="M598 100 L598 110 L606 240 L612 340" stroke="${INK}" stroke-width="1.2" stroke-dasharray="5 4" fill="none"/>` +
    `</g>`);
  f.add(`<path d="${CEREBRUM}" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
}
function brocaWernicke(f) {
  f.add(`<ellipse cx="292" cy="278" rx="30" ry="17" fill="${VERM}" fill-opacity="0.35" stroke="${VERM}" stroke-width="2.5"/>`);
  f.add(`<ellipse cx="498" cy="276" rx="34" ry="17" fill="${PURPLE}" fill-opacity="0.35" stroke="${PURPLE}" stroke-width="2.5"/>`);
}
{
  const f = new Fig('brain-lobes', 800, 540, 'The left hemisphere of the brain seen from the side',
    'A side view of the left hemisphere, front of the head on the left. The frontal lobe fills the front, with the motor cortex as a strip at its back edge. Behind the central sulcus are the somatosensory cortex and the parietal lobe. The occipital lobe is at the back. The temporal lobe lies below the lateral fissure. Broca\'s area is in the lower frontal lobe and Wernicke\'s area in the upper back of the temporal lobe. The cerebellum sits under the back of the brain and the brainstem runs down from the middle of its underside.');
  lateralBrain(f); brocaWernicke(f);
  f.label('frontal', 'Frontal lobe', 205, 200, { bold: true, concept: 'frontal-lobe', halo: false });
  f.label('parietal', 'Parietal lobe', 470, 155, { bold: true, concept: 'parietal-lobe', halo: false });
  f.label('temporal', 'Temporal lobe', 330, 352, { bold: true, concept: 'temporal-lobe', halo: false });
  f.label('occipital', ['Occipital', 'lobe'], 708, 236, { bold: true, to: [650, 250], concept: 'occipital-lobe' });
  f.label('motor', 'Motor cortex', 250, 36, { to: [395, 90], concept: 'motor-cortex' });
  f.label('somato', 'Somatosensory cortex', 470, 36, { to: [440, 92], concept: 'somatosensory' });
  f.label('broca', ["Broca's area", '(speaking)'], 70, 400, { to: [276, 286], concept: 'brocas-area' });
  f.label('wernicke', ["Wernicke's area", '(understanding speech)'], 560, 492, { to: [500, 290], concept: 'wernickes-area' });
  f.label('cerebellum', 'Cerebellum', 690, 440, { to: [646, 408], concept: 'cerebellum' });
  f.label('brainstem', 'Brainstem', 290, 470, { to: [444, 470], concept: 'brainstem' });
  f.label(null, 'Front', 40, 520, { size: 13, halo: false });
  f.add(`<path d="M86 515 L140 515" stroke="${INK}" stroke-width="1.5"/><path d="M86 515 L94 510 L94 520 Z" fill="${INK}"/>`);
  f.keepLabels = true;
  save('brain', f, "Side view of the left hemisphere, front on the left. Frontal lobe at the front with the motor cortex as a strip at its back edge; the central sulcus; then the somatosensory cortex and the parietal lobe; the occipital lobe at the back; the temporal lobe below the lateral fissure. Broca's area is in the lower frontal lobe, Wernicke's area in the upper back of the temporal lobe. The cerebellum is under the back of the brain and the brainstem runs down from its middle.");
}
{
  const f = new Fig('brain-lobes-letters', 800, 540, 'The left hemisphere from the side, regions marked A to F',
    "The side view of the left hemisphere with six regions marked by letters. A marks the front of the frontal lobe (the prefrontal area). B marks the motor cortex strip. C marks the occipital lobe. D marks Broca's area. E marks Wernicke's area. F marks the cerebellum.");
  lateralBrain(f); brocaWernicke(f);
  f.badge('A', 60, 160, [170, 190]);
  f.badge('B', 360, 26, [388, 110]);
  f.badge('C', 740, 250, [652, 260]);
  f.badge('D', 160, 420, [282, 288]);
  f.badge('E', 560, 470, [500, 290]);
  f.badge('F', 730, 440, [646, 410]);
  save('brain', f, "The side view of the left hemisphere with six regions marked by letters and no names: A the front of the frontal lobe, B the motor cortex strip, C the occipital lobe, D Broca's area, E Wernicke's area, F the cerebellum.");
}
{
  // The middle view: the right hemisphere cut down the midline, front on the left.
  const f = new Fig('brain-inner', 800, 560, 'Structures inside the brain, seen from the middle',
    'The brain cut down the middle, front of the head on the left. The corpus callosum is an arched band joining the two hemispheres. Below it sits the thalamus, and below and in front of the thalamus the small hypothalamus, with the pituitary gland hanging beneath it. The amygdala and hippocampus lie deeper, inside the temporal lobe (drawn dashed). The brainstem runs down to the spinal cord, with the medulla at its base and the reticular activating system running through its core. The cerebellum sits behind the brainstem. The prefrontal cortex is at the front and the reward center (nucleus accumbens) lies deep below the front of the corpus callosum.');
  f.add(`<defs><clipPath id="${f.id}-cl"><path d="${CEREBRUM}"/></clipPath></defs>`);
  // cerebellum
  f.add(`<path d="M500 372 C520 342 600 334 650 352 C680 366 676 410 640 428 C600 446 540 440 512 420 C494 406 490 388 500 372 Z" fill="#E7E2D6" stroke="${INK}" stroke-width="2"/>`);
  for (const k of [0, 1, 2, 3, 4]) f.add(`<path d="M${514 + k * 4} ${392 + k * 8} C560 ${378 + k * 9} 620 ${374 + k * 9} ${658 - k * 6} ${384 + k * 8}" fill="none" stroke="#A89E86" stroke-width="1.2"/>`);
  // cerebrum (inner surface)
  f.add(`<path d="${CEREBRUM}" fill="#EEF3F1" stroke="${INK}" stroke-width="2.5"/>`);
  f.add(`<path d="M232 196 C210 160 170 165 160 200 M600 200 C640 210 660 250 650 290 M300 110 C350 95 420 95 480 110" fill="none" stroke="#C5D0CC" stroke-width="2"/>`);
  // prefrontal tint
  f.add(`<g clip-path="url(#${f.id}-cl)"><path d="M0 0 L250 0 C230 120 230 220 245 330 L0 330 Z" fill="#D6E6F0"/></g><path d="${CEREBRUM}" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
  // brainstem: midbrain, pons, medulla, then spinal cord
  f.add(`<path d="M404 262 C402 300 408 340 420 370 C414 392 420 420 432 440 C436 470 440 500 444 548 L478 548 C474 500 476 470 478 440 C492 418 494 390 486 370 C494 346 494 300 488 262 Z" fill="#DADADA" stroke="${INK}" stroke-width="2"/>`);
  f.add(`<path d="M420 372 C430 360 478 360 486 372" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M432 440 C444 432 466 432 478 440" fill="none" stroke="${INK}" stroke-width="1.2"/>`);
  // reticular activating system: a dotted core through the brainstem
  for (let y = 300; y <= 450; y += 11) f.add(`<circle cx="${r(450 + Math.sin(y / 20) * 3)}" cy="${y}" r="2.6" fill="${PURPLE}"/>`);
  // corpus callosum: an arched band
  f.add(`<path d="M268 236 C262 196 300 172 360 168 C440 162 520 170 548 204 C560 220 552 240 536 244 C520 222 480 204 420 202 C360 200 312 206 296 226 C300 236 300 246 290 250 C278 252 270 246 268 236 Z" fill="${BLUE}" fill-opacity="0.85" stroke="${BLUE}" stroke-width="1.5"/>`);
  // thalamus, hypothalamus, pituitary
  f.add(`<ellipse cx="420" cy="252" rx="46" ry="26" fill="#9AD8C3" stroke="${GREEN}" stroke-width="2"/>`);
  f.add(`<path d="M352 270 C360 262 384 262 394 274 C394 290 380 300 364 298 C352 294 348 282 352 270 Z" fill="#F6C6A8" stroke="${VERM}" stroke-width="2"/>`);
  f.add(`<path d="M366 298 L362 318" stroke="${VERM}" stroke-width="2.5"/><ellipse cx="360" cy="326" rx="11" ry="9" fill="#F6C6A8" stroke="${VERM}" stroke-width="2"/>`);
  // reward center (deep): a dashed circle below the front of the corpus callosum
  f.add(`<circle cx="318" cy="268" r="12" fill="${PURPLE}" fill-opacity="0.3" stroke="${PURPLE}" stroke-width="2" stroke-dasharray="4 3"/>`);
  // amygdala and hippocampus, deep in the temporal lobe (dashed)
  f.add(`<path d="M390 350 C430 344 476 332 510 300 C528 284 540 264 548 250 L560 258 C552 276 540 296 522 314 C486 348 436 362 394 366 Z" fill="${GREEN}" fill-opacity="0.25" stroke="${GREEN}" stroke-width="2" stroke-dasharray="5 3"/>`);
  f.add(`<ellipse cx="376" cy="358" rx="16" ry="11" fill="${VERM}" fill-opacity="0.3" stroke="${VERM}" stroke-width="2" stroke-dasharray="5 3"/>`);
  f.label('cc', 'Corpus callosum', 420, 140, { anchor: 'middle', to: [420, 168], concept: 'corpus-callosum' });
  f.label('thalamus', 'Thalamus', 610, 250, { to: [464, 254], concept: 'thalamus' });
  f.label('hypothalamus', 'Hypothalamus', 150, 330, { to: [354, 284], concept: 'hypothalamus' });
  f.label('pituitary', 'Pituitary gland', 150, 372, { to: [350, 328], concept: 'pituitary' });
  f.label('amygdala', ['Amygdala', '(deep, in the temporal lobe)'], 120, 432, { to: [372, 364], concept: 'amygdala' });
  f.label('hippocampus', ['Hippocampus', '(deep, in the temporal lobe)'], 590, 320, { to: [530, 300], concept: 'hippocampus' });
  f.label('reward', ['Reward center', '(nucleus accumbens, deep)'], 60, 250, { to: [306, 268], concept: 'reward-center' });
  f.label('prefrontal', 'Prefrontal cortex', 60, 150, { to: [170, 170], concept: 'prefrontal' });
  f.label('ras', ['Reticular activating', 'system (core of', 'the brainstem)'], 240, 488, { to: [448, 420], concept: 'reticular' });
  f.label('medulla', 'Medulla', 540, 500, { to: [474, 470], concept: 'medulla' });
  f.label('cerebellum', 'Cerebellum', 690, 440, { to: [646, 408], concept: 'cerebellum' });
  f.label(null, 'Front', 40, 540, { size: 13, halo: false });
  f.add(`<path d="M86 535 L140 535" stroke="${INK}" stroke-width="1.5"/><path d="M86 535 L94 530 L94 540 Z" fill="${INK}"/>`);
  f.keepLabels = true;
  save('brain', f, 'The brain cut down the middle, front on the left. An arched band, the corpus callosum, joins the hemispheres. Under it is the thalamus; below and in front of that the hypothalamus with the pituitary gland hanging beneath. Drawn dashed because they lie deeper, inside the temporal lobe: the amygdala and, behind it, the hippocampus. The reward center lies deep below the front of the corpus callosum. The prefrontal cortex is at the front. The brainstem runs down to the spinal cord, the medulla at its base and the reticular activating system through its core; the cerebellum sits behind it.');
}

/* ===================================================== the hypnogram ===== */
/* One invented night: [start minute, stage]; stage 4 awake, 3 REM, 2 N1, 1 N2, 0 N3. */
export const NIGHT = [[0, 4], [10, 2], [16, 1], [30, 0], [62, 1], [75, 3], [85, 1], [100, 0], [126, 1], [150, 3], [170, 1], [196, 0], [208, 1], [245, 3], [270, 4], [274, 2], [280, 1], [330, 3], [355, 1], [410, 3], [440, 1], [468, 2], [474, 4], [480, 4]];
{
  const W = 760, H = 380, L = 110, R = 730, T = 30, B = 300;
  const f = new Fig('sleep-hypnogram', W, H, 'Sleep stages across one night (a hypnogram)',
    'A hypnogram of one 8-hour night (invented for practice). Stages run down the side: awake at the top, then REM, N1, N2 and N3 at the bottom. The sleeper drops through N1 and N2 into N3 within the first half hour, and the night repeats in cycles of about 90 minutes. N3 deep sleep appears in the first half of the night and fades; REM periods come at the end of each cycle and grow longer toward morning, from about 10 minutes in the first cycle to about 30 minutes in the last.');
  const sy = s => T + (4 - s) * (B - T) / 4, sx = m => L + m / 480 * (R - L);
  f.add(`<rect x="${L}" y="${r(sy(3) - 12)}" width="${R - L}" height="24" fill="${VERM}" fill-opacity="0.08"/>`);
  for (const [s, name] of [[4, 'Awake'], [3, 'REM'], [2, 'N1'], [1, 'N2'], [0, 'N3 (deep)']]) f.add(`<line x1="${L}" y1="${r(sy(s))}" x2="${R}" y2="${r(sy(s))}" stroke="#DDE3E1"/><text x="${L - 10}" y="${r(sy(s) + 5)}" font-size="14" text-anchor="end" fill="${INK}"${s === 3 ? ` font-weight="bold"` : ''}>${name}</text>`);
  f.add(`<line x1="${L}" y1="${T - 10}" x2="${L}" y2="${B}" stroke="${INK}" stroke-width="1.5"/><line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${INK}" stroke-width="1.5"/>`);
  for (let h = 0; h <= 8; h++) f.add(`<line x1="${r(sx(h * 60))}" y1="${B}" x2="${r(sx(h * 60))}" y2="${B + 5}" stroke="${INK}"/><text x="${r(sx(h * 60))}" y="${B + 21}" font-size="13" text-anchor="middle" fill="${INK}">${h}</text>`);
  f.add(`<text x="${(L + R) / 2}" y="${B + 46}" font-size="14" text-anchor="middle" fill="${INK}">Hours after lights out</text>`);
  let d = '';
  NIGHT.forEach(([m, s], i) => { d += i ? ` L${r(sx(m))} ${r(sy(NIGHT[i - 1][1]))} L${r(sx(m))} ${r(sy(s))}` : `M${r(sx(m))} ${r(sy(s))}`; });
  f.add(`<path d="${d}" fill="none" stroke="${BLUE}" stroke-width="2.5" stroke-linejoin="round"/>`);
  // REM periods drawn thick in vermillion
  NIGHT.forEach(([m, s], i) => { if (s === 3) f.add(`<line x1="${r(sx(m))}" y1="${r(sy(3))}" x2="${r(sx(NIGHT[i + 1][0]))}" y2="${r(sy(3))}" stroke="${VERM}" stroke-width="7" stroke-linecap="butt"/>`); });
  f.label(null, 'REM periods (thick) grow longer toward morning', sx(250), 18, { size: 13, color: INK });
  save('sleep', f, 'A hypnogram of one invented 8-hour night. Awake is at the top, then REM, N1, N2 and N3 (deep) at the bottom. The sleeper drops into N3 within the first half hour; the night repeats in cycles of about 90 minutes. N3 appears mostly in the first half of the night. REM periods, drawn thick, end each cycle and grow from about 10 minutes in the first cycle to about 30 minutes near morning. A brief waking comes after the third REM period.');
}

/* ===================================================== the eye ===== */
{
  const f = new Fig('sensation-eye', 800, 460, 'The eye, cut from side to side',
    'A cross-section of the eye with light entering from the left. Light passes through the clear cornea, through the pupil (the opening in the colored iris) and through the lens, which focuses it on the retina lining the back of the eye. The fovea is a small pit at the center of the back of the retina. The optic nerve leaves the back of the eye a little to one side of the fovea; where it leaves there are no rods or cones, so that spot is the blind spot. A box below says rods work in dim light and detect no color and are spread across most of the retina, while cones detect color and fine detail and are packed in the fovea.');
  const cx = 420, cy = 200, R0 = 150;
  // light rays from the left focusing on the fovea
  f.add(`<path d="M40 150 L318 186 L566 200 M40 250 L318 214 L566 200 M40 200 L566 200" stroke="#E0B000" stroke-width="2" fill="none" opacity="0.9"/>`);
  f.add(`<text x="40" y="138" font-size="13" fill="${INK}">Light</text>`);
  // sclera (white of the eye) and the retina lining
  f.add(`<circle cx="${cx}" cy="${cy}" r="${R0}" fill="#FBFCFC" stroke="${INK}" stroke-width="2.5"/>`);
  const arc = (rad, a0, a1) => { const p = a => [cx + rad * Math.cos(a * Math.PI / 180), cy + rad * Math.sin(a * Math.PI / 180)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${r(x0)} ${r(y0)} A${rad} ${rad} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${r(x1)} ${r(y1)}`; };
  f.add(`<path d="${arc(140, -125, 125)}" fill="none" stroke="${VERM}" stroke-width="7"/>`);
  // fovea: a small pit at the back center
  f.add(`<path d="M${cx + 138} ${cy - 12} C${cx + 128} ${cy - 4} ${cx + 128} ${cy + 4} ${cx + 138} ${cy + 12}" fill="#FFFFFF" stroke="${VERM}" stroke-width="3"/>`);
  // optic nerve leaving below the fovea (the blind spot where it leaves)
  f.add(`<path d="M${cx + 128} ${cy + 46} L760 ${cy + 80} L760 ${cy + 122} L${cx + 112} ${cy + 86} Z" fill="#F2E6B8" stroke="${INK}" stroke-width="2"/>`);
  f.add(`<path d="M${cx + 130} ${cy + 52} L${cx + 120} ${cy + 80}" stroke="#FFFFFF" stroke-width="9"/>`);
  // cornea bulge, iris, pupil, lens
  f.add(`<path d="M${cx - 132} ${cy - 70} C${cx - 186} ${cy - 40} ${cx - 186} ${cy + 40} ${cx - 132} ${cy + 70}" fill="#E6F3FA" stroke="${BLUE}" stroke-width="2.5"/>`);
  f.add(`<rect x="${cx - 128}" y="${cy - 64}" width="9" height="46" fill="#4E8F6E"/><rect x="${cx - 128}" y="${cy + 18}" width="9" height="46" fill="#4E8F6E"/>`);
  f.add(`<ellipse cx="${cx - 98}" cy="${cy}" rx="18" ry="48" fill="#D6E6F0" stroke="${BLUE}" stroke-width="2"/>`);
  f.label('cornea', 'Cornea', 170, 70, { to: [cx - 168, cy - 30], concept: 'vision' });
  f.label('iris', 'Iris (colored ring)', 236, 36, { to: [cx - 124, cy - 50], concept: 'vision' });
  f.label('pupil', 'Pupil (the opening)', 120, 300, { to: [cx - 124, cy + 6], concept: 'vision' });
  f.label('lens', 'Lens', 300, 330, { to: [cx - 98, cy + 40], concept: 'vision' });
  f.label('retina', 'Retina (lines the back)', 520, 30, { to: [cx + 70, cy - 122], concept: 'retina' });
  f.label('fovea', ['Fovea', '(cones packed here)'], 620, 140, { to: [cx + 132, cy - 4], concept: 'fovea' });
  f.label('optic', 'Optic nerve (to the brain)', 590, 350, { to: [700, cy + 104], concept: 'optic-nerve' });
  f.label('blindspot', ['Blind spot: no rods or', 'cones where the nerve leaves'], 380, 392, { to: [cx + 124, cy + 66], concept: 'blind-spot' });
  // rods and cones box
  f.add(`<rect x="24" y="360" width="330" height="88" rx="8" fill="#F7F9F8" stroke="#C5D0CC"/>`);
  f.add(`<rect x="40" y="376" width="8" height="30" rx="4" fill="${BLUE}"/><path d="M44 414 L38 434 L50 434 Z" fill="${VERM}"/>`);
  f.add(`<text x="62" y="392" font-size="13" fill="${INK}"><tspan font-weight="bold">Rods:</tspan> dim light, no color, most of the retina</text>`);
  f.add(`<text x="62" y="430" font-size="13" fill="${INK}"><tspan font-weight="bold">Cones:</tspan> color and fine detail, packed in the fovea</text>`);
  f.keepLabels = true;
  save('sensation', f, 'A side-to-side cut through the eye, light entering from the left. Light passes through the cornea, the pupil (the opening in the colored iris) and the lens, which focuses it on the fovea, a small pit at the back of the retina. The retina lines the back of the eye. The optic nerve leaves a little below the fovea; where it leaves there are no rods or cones, the blind spot. A box notes that rods work in dim light, detect no color and cover most of the retina, while cones detect color and fine detail and are packed in the fovea.');
}

/* ===================================================== the ear ===== */
{
  const f = new Fig('sensation-ear', 800, 470, 'The ear, and where pitch is sensed along the cochlea',
    'The outer ear funnels sound down the ear canal to the eardrum. Three tiny middle-ear bones carry the vibration to the cochlea, a fluid-filled coil in the inner ear, where hair cells turn the vibration into neural signals that travel along the auditory nerve. A bracket over the ear canal, eardrum and middle-ear bones says damage there causes conduction deafness; a bracket over the cochlea and auditory nerve says damage there causes sensorineural deafness. Below, the cochlea is drawn uncoiled: high pitches make the base, near the middle ear, vibrate most, and low pitches the far tip.');
  // outer ear (a cupped shape) and ear canal
  f.add(`<path d="M70 70 C30 90 26 170 54 220 C70 250 72 280 96 300 C116 316 134 300 128 278 C124 262 110 252 114 230 C118 214 136 214 150 206 L150 176 C130 170 110 150 112 120 C114 96 100 72 70 70 Z" fill="#F4D9C6" stroke="${INK}" stroke-width="2"/>`);
  f.add(`<path d="M146 174 L330 168 L330 214 L146 208 Z" fill="#FBEFE6" stroke="${INK}" stroke-width="2"/>`);
  // eardrum
  f.add(`<path d="M330 150 C340 170 340 212 330 232" fill="none" stroke="${BLUE}" stroke-width="5"/>`);
  // middle-ear bones (three linked shapes)
  f.add(`<path d="M338 186 C352 170 366 160 376 166 C384 172 378 186 370 194" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`);
  f.add(`<path d="M374 168 C392 158 404 166 404 184 L400 204" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`);
  f.add(`<path d="M400 204 L420 206 M420 196 L420 216 M400 204 L420 196 M400 204 L420 216" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`);
  // cochlea: a spiral
  let d = '', cx = 488, cy = 212;
  for (let i = 0; i <= 160; i++) { const a = i / 160 * 2.6 * 2 * Math.PI, rr = 52 - i / 160 * 44; const x = cx + rr * Math.cos(a + Math.PI), y = cy + rr * Math.sin(a + Math.PI); d += (i ? ' L' : 'M') + r(x) + ' ' + r(y); }
  f.add(`<path d="${d}" fill="none" stroke="#9AD8C3" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${GREEN}" stroke-width="2"/>`);
  // auditory nerve
  f.add(`<path d="M512 230 C560 250 610 262 680 262" fill="none" stroke="#F2E6B8" stroke-width="18" stroke-linecap="round"/><path d="M512 230 C560 250 610 262 680 262" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="1 0"/>`);
  // sound waves arriving
  for (const k of [0, 1, 2]) f.add(`<path d="M${170 - k * 22} 30 C${186 - k * 22} 50 ${186 - k * 22} 70 ${170 - k * 22} 90" fill="none" stroke="#E0B000" stroke-width="2"/>`);
  f.add(`<text x="200" y="54" font-size="13" fill="${INK}">Sound waves</text>`);
  f.label('outer', 'Outer ear', 30, 340, { to: [80, 290], concept: 'hearing' });
  f.label('canal', 'Ear canal', 200, 146, { concept: 'hearing', halo: false });
  f.label('eardrum', 'Eardrum', 300, 270, { to: [334, 228], concept: 'conduction-deafness' });
  f.label('bones', 'Middle-ear bones', 330, 120, { to: [378, 164], concept: 'conduction-deafness' });
  f.label('cochlea', ['Cochlea (hair cells', 'turn vibration into', 'neural signals)'], 560, 100, { to: [520, 186], concept: 'cochlea' });
  f.label('nerve', 'Auditory nerve (to the brain)', 560, 300, { to: [660, 264], concept: 'sensorineural' });
  // brackets for the two kinds of deafness
  f.add(`<path d="M150 22 L150 14 L424 14 L424 22" fill="none" stroke="${VERM}" stroke-width="2.5"/><path d="M440 22 L440 14 L700 14 L700 22" fill="none" stroke="${PURPLE}" stroke-width="2.5"/>`);
  f.label('conduction', 'Damage here: conduction deafness', 287, 10, { anchor: 'middle', size: 13, concept: 'conduction-deafness', halo: false });
  f.label('sensorineural', 'Damage here: sensorineural deafness', 570, 10, { anchor: 'middle', size: 13, concept: 'sensorineural', halo: false });
  // the uncoiled cochlea for place theory
  f.add(`<defs><linearGradient id="${f.id}-g" x1="0" x2="1"><stop offset="0" stop-color="${BLUE}"/><stop offset="1" stop-color="#CFE3EE"/></linearGradient></defs>`);
  f.add(`<path d="M120 380 L700 372 C716 372 716 404 700 404 L120 396 Z" fill="url(#${f.id}-g)" stroke="${INK}" stroke-width="1.5"/>`);
  f.add(`<text x="120" y="366" font-size="14" font-weight="bold" fill="${INK}">The cochlea uncoiled</text>`);
  f.add(`<text x="120" y="422" font-size="13" fill="${INK}">Base (near the middle ear):</text><text x="120" y="440" font-size="13" fill="${INK}">high pitches vibrate it most</text>`);
  f.add(`<text x="700" y="422" font-size="13" text-anchor="end" fill="${INK}">Tip of the coil:</text><text x="700" y="440" font-size="13" text-anchor="end" fill="${INK}">low pitches vibrate it most</text>`);
  f.keepLabels = true;
  save('sensation', f, 'The ear. The outer ear funnels sound waves down the ear canal to the eardrum; three tiny middle-ear bones carry the vibration to the cochlea, a fluid-filled coil whose hair cells turn vibration into neural signals that travel along the auditory nerve. A bracket over the ear canal, eardrum and middle-ear bones reads "damage here: conduction deafness"; one over the cochlea and auditory nerve reads "damage here: sensorineural deafness". Below, the cochlea is drawn uncoiled: high pitches vibrate the base most and low pitches the tip.');
}

for (const [topic, entries] of Object.entries(registry)) writeFileSync(join(DATA, 'figures', `${topic}.json`), JSON.stringify(entries, null, 1) + '\n');
console.log(`author-b figures: ${Object.values(registry).reduce((n, e) => n + Object.keys(e).length, 0)} written`);
