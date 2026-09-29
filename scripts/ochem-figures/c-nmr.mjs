/* Figures for the c-nmr notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, arrow, text, tag, rule, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';
import { n2 } from '../lib/ochem-helpers.mjs';

/* A stick: one line of a line spectrum. A negative height points down. */
function stick(x, yBase, h, cls = 'fg-bond', w = 3) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}

/* A multiplet: lines `gap` apart, centered on x, heights in the given ratio. */
function multiplet(x, yBase, ratio, unit, gap) {
  const n = ratio.length;
  return ratio.map((r, i) => stick(x + (i - (n - 1) / 2) * gap, yBase, r * unit, 'fg-bond', 2.6)).join('');
}

/* A shift axis with ticks and numbers under it. */
function axis(X, x0, x1, y, ticks, cls = 'fg-tag') {
  let s = rule(x0, y, x1, y);
  for (const d of ticks) {
    s += rule(X(d), y, X(d), y + 6);
    s += text(X(d), y + 20, String(d), { cls, size: 11 });
  }
  return s;
}

/* ------------------------------------------------ ethanol, decoupling ---
   The concrete case before the rule: the same two carbons, first split by
   their own hydrogens, then one line each once the hydrogens are decoupled. */
function ethanolDecoupling(W) {
  const narrow = W < 400;
  const x0 = narrow ? 28 : 90, x1 = narrow ? 312 : 690;
  const X = (d) => x0 + ((70 - d) / 70) * (x1 - x0);
  const gap = narrow ? 10 : 14;
  let s = '';
  /* the molecule, with each carbon named the way the peaks are named */
  const cx = W / 2;
  const a = P(cx - 70, 40), b = P(cx, 40), c = P(cx + 70, 40);
  s += bond(a, b, { rFrom: 17, rTo: 17 }) + bond(b, c, { rFrom: 17, rTo: 16 });
  s += atom(a.x, a.y, 'CH₃', { kind: 'hi', r: 17 }) + atom(b.x, b.y, 'CH₂', { kind: 'hi', r: 17 }) + atom(c.x, c.y, 'OH');

  const t1 = 96, base1 = 200;
  s += tag(narrow ? 12 : 74, t1, narrow ? 'Without decoupling' : 'without decoupling: each carbon is split by the hydrogens bonded to it', { anchor: 'start' });
  s += multiplet(X(58), base1, [1, 2, 1], 28, gap);
  s += multiplet(X(18), base1, [1, 3, 3, 1], 21, gap);
  s += tag(X(58), 128, 'CH₂: 3 lines', { cls: 'fg-tag' });
  s += tag(X(18), 124, 'CH₃: 4 lines', { cls: 'fg-tag' });
  s += rule(x0 - 10, base1, x1 + 10, base1);

  const t2 = 236, base2 = 330;
  s += `<line class="fg-dash" x1="${x0 - 10}" y1="216" x2="${x1 + 10}" y2="216"></line>`;
  s += tag(narrow ? 12 : 74, t2, narrow ? 'With proton decoupling' : 'with proton decoupling: one line for each carbon', { anchor: 'start' });
  s += stick(X(58), base2, 62) + stick(X(18), base2, 62);
  s += tag(X(58), 258, 'CH₂, 58');
  s += tag(X(18), 258, 'CH₃, 18');
  s += axis(X, x0 - 10, x1 + 10, base2, narrow ? [60, 40, 20, 0] : [70, 60, 50, 40, 30, 20, 10, 0]);
  s += tag(W / 2, 372, 'chemical shift (ppm)', { cls: 'fg-tag-mut' });
  return s;
}

const ETHANOL_ALT = 'Ethanol, CH3–CH2–OH, above two carbon-13 spectra on one shift axis. Without decoupling, the CH2 carbon at 58 ppm is a group of three lines and the CH3 carbon at 18 ppm is a group of four. With proton decoupling, each carbon is a single line at the same position.';

/* ----------------------------------------------------- the xylenes ---
   Each ring is numbered C1 to C6 the way the worked example numbers it, and
   every mirror plane the text uses is drawn, edge-on, as a dashed line. */
function ring(cx, cy, r, spec) {
  const pos = (deg) => P(cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180));
  const pts = spec.angles.map(pos);
  const c = P(cx, cy);
  let s = '';
  for (const m of spec.mirrors || []) {
    const L = m.len;
    const ux = Math.cos((m.deg * Math.PI) / 180), uy = -Math.sin((m.deg * Math.PI) / 180);
    s += `<line class="fg-dash-hi" x1="${n2(cx - ux * L)}" y1="${n2(cy - uy * L)}" x2="${n2(cx + ux * L)}" y2="${n2(cy + uy * L)}"></line>`;
  }
  for (let i = 0; i < 6; i++) {
    const p = pts[i], q = pts[(i + 1) % 6];
    s += i % 2 === 0 ? ringDouble(p, q, c, { inset: 7 }) : bond(p, q, { rFrom: 0, rTo: 0 });
  }
  for (const i of spec.methyls) {
    const deg = spec.angles[i];
    const m = P(cx + (r + 36) * Math.cos((deg * Math.PI) / 180), cy - (r + 36) * Math.sin((deg * Math.PI) / 180));
    s += bond(pts[i], m, { rFrom: 0, rTo: 16, cls: 'fg-bond' });
    s += atom(m.x, m.y, 'CH₃', { kind: 'hi', r: 16 });
  }
  if (spec.numbers !== false) {
    spec.angles.forEach((deg, i) => {
      const nd = spec.numAngles?.[i] ?? deg;
      const d = 14;
      const x = pts[i].x + d * Math.cos((nd * Math.PI) / 180);
      const y = pts[i].y - d * Math.sin((nd * Math.PI) / 180);
      s += text(x, y + 4, String(i + 1), { cls: 'fg-tag', size: 11 });
    });
  }
  return s;
}

/* Angles are listed C1 to C6, clockwise. numAngles moves a number off a
   methyl bond or a mirror line. */
const ORTHO = { angles: [120, 60, 0, 300, 240, 180], methyls: [0, 1], numAngles: [165, 15],
  mirrors: [{ deg: 90, len: 100 }] };
const META = { angles: [150, 90, 30, 330, 270, 210], methyls: [0, 2], numAngles: [195, 55, -15, 330, 305],
  mirrors: [{ deg: 90, len: 100 }] };
const PARA = { angles: [90, 30, 330, 270, 210, 150], methyls: [0, 3], numAngles: [128, 30, 330, 232],
  mirrors: [{ deg: 90, len: 110 }, { deg: 0, len: 82 }] };

/* ------------------------------------------------------ DEPT spectra ---
   Butan-2-one: routine, DEPT-135 and DEPT-90 on one axis, with the molecule
   under them and each carbon labeled with its shift. */
function butanone(cx, y, W) {
  /* CH3(29)–C(=O)(209)–CH2(37)–CH3(8), drawn left to right */
  const dx = W < 400 ? 66 : 80;
  const a = P(cx - 1.5 * dx, y), b = P(cx - 0.5 * dx, y), c = P(cx + 0.5 * dx, y), d = P(cx + 1.5 * dx, y);
  const o = P(b.x, y - 46);
  let s = '';
  s += bond(a, b, { rFrom: 17, rTo: 15 }) + bond(b, c, { rFrom: 15, rTo: 17 }) + bond(c, d, { rFrom: 17, rTo: 17 });
  s += bond(b, o, { order: 2, rFrom: 15, rTo: 15 });
  s += atom(a.x, a.y, 'CH₃', { r: 17 }) + atom(b.x, b.y, 'C', { kind: 'warn' }) + atom(c.x, c.y, 'CH₂', { r: 17 }) + atom(d.x, d.y, 'CH₃', { r: 17 });
  s += atom(o.x, o.y, 'O');
  for (const [p, v] of [[a, '29'], [b, '209'], [c, '37'], [d, '8']]) s += tag(p.x, p.y + 36, v + ' ppm');
  return s;
}

function deptRows(X, x0, x1, narrow) {
  let s = '';
  const tx = narrow ? 12 : 74;
  /* routine spectrum */
  const b1 = 130;
  s += tag(tx, 30, narrow ? 'Routine ¹³C: four lines' : 'routine proton-decoupled ¹³C: four lines, so four carbon environments', { anchor: 'start' });
  for (const d of [209, 37, 29, 8]) {
    s += stick(X(d), b1, 66);
    s += tag(X(d), b1 - 74, String(d));
  }
  s += tag(X(209) + 10, b1 - 30, 'C=O', { cls: 'fg-tag-warn', anchor: 'start' });
  if (!narrow) {
    for (const k of [-5, 0, 5]) s += stick(X(77) + k, b1, 24, 'fg-bond-soft', 2);
    s += tag(X(77), b1 - 34, 'CDCl₃ solvent, 77: ignore it', { cls: 'fg-tag-mut' });
  }
  s += rule(x0, b1, x1, b1);
  s += `<line class="fg-dash" x1="${x0}" y1="${b1 + 26}" x2="${x1}" y2="${b1 + 26}"></line>`;

  /* DEPT-135 */
  const b2 = 262;
  s += tag(tx, 182, narrow ? 'DEPT-135' : 'DEPT-135: CH₃ and CH point up, CH₂ points down, carbons with no H are missing', { anchor: 'start' });
  s += stick(X(29), b2, 54) + stick(X(8), b2, 54);
  s += tag(X(29), b2 - 62, 'CH₃') + tag(X(8), b2 - 62, 'CH₃');
  s += stick(X(37), b2, -46);
  s += tag(X(37), b2 + 62, 'CH₂');
  s += `<line class="fg-dash" x1="${n2(X(209))}" y1="${b2}" x2="${n2(X(209))}" y2="${b2 - 46}"></line>`;
  s += tag(X(209) + 8, b2 - 30, 'missing', { cls: 'fg-tag-mut', anchor: 'start' });
  s += tag(X(209) + 8, b2 - 16, 'C=O: no H', { cls: 'fg-tag-mut', anchor: 'start' });
  s += rule(x0, b2, x1, b2);
  s += `<line class="fg-dash" x1="${x0}" y1="${b2 + 76}" x2="${x1}" y2="${b2 + 76}"></line>`;

  /* DEPT-90 */
  const b3 = 416;
  s += tag(tx, 362, narrow ? 'DEPT-90: only CH carbons' : 'DEPT-90: only CH carbons appear', { anchor: 'start' });
  s += tag((x0 + x1) / 2, b3 - 20, narrow ? 'no lines: there is no CH' : 'no lines at all: butan-2-one has no CH carbon', { cls: 'fg-tag-mut' });
  s += rule(x0, b3, x1, b3);
  return s;
}

const FIGURES = [];

FIGURES.push({
  id: 'c-nmr-ethanol-decoupling',
  section: 'c-nmr',
  anchor: 'The CH₂ carbon, with two, gives three.</p>',
  alt: ETHANOL_ALT,
  viewBox: '0 0 760 384',
  build() { return ethanolDecoupling(760); },
  caption: 'The top trace shows ethanol&rsquo;s two carbons split by their own hydrogens. In the bottom trace, decoupling has collapsed each group of lines into one line at the same shift.',
});

FIGURES.push({
  id: 'l-c-nmr-ethanol-decoupling',
  lessons: ['c-nmr'],
  alt: ETHANOL_ALT,
  viewBox: '0 0 340 384',
  build() { return ethanolDecoupling(340); },
  caption: 'On top, each carbon is split by its own hydrogens. Below, decoupling leaves one line per carbon.',
});

/* The alkyne exception. The triple bond's pi electrons form a cylinder; with
   the bond axis along the applied field they circulate around it, and the
   field they induce opposes the applied field along the axis, where the two
   carbons sit. The strip underneath shows where that leaves sp carbons. */
FIGURES.push({
  id: 'c-nmr-alkyne-cylinder',
  section: 'c-nmr',
  anchor: 'so they are shielded and move upfield.</p>',
  alt: 'Ethyne, H–C≡C–H, drawn along a horizontal applied field B0 that points right. A shaded cylinder of pi electrons surrounds the C≡C bond. A loop arrow shows the electrons circulating around the bond axis, and an arrow inside the cylinder, labeled induced field, points left, against B0. Below, a shift scale shows sp3 carbons at 0 to 50 ppm, sp carbons at 65 to 90 and sp2 carbons at 100 to 150.',
  viewBox: '0 0 640 350',
  build() {
    let s = '';
    s += arrow(P(90, 34), P(550, 34));
    s += tag(320, 22, 'applied field B₀');
    const y = 138;
    /* pi cylinder, behind the atoms */
    s += `<rect class="fg-orb" x="206" y="${y - 40}" width="244" height="80" rx="40"></rect>`;
    const h1 = P(130, y), c1 = P(250, y), c2 = P(390, y), h2 = P(510, y);
    s += bond(h1, c1, { rFrom: 15, rTo: 15 }) + bond(c2, h2, { rFrom: 15, rTo: 15 });
    s += bond(c1, c2, { order: 3, rFrom: 15, rTo: 15, gap: 4 });
    s += atom(h1.x, h1.y, 'H') + atom(c1.x, c1.y, 'C', { kind: 'hi' }) + atom(c2.x, c2.y, 'C', { kind: 'hi' }) + atom(h2.x, h2.y, 'H');
    /* circulation: a loop around the axis, seen obliquely */
    /* the loop sits between the right carbon and the end of the cylinder,
       so it crosses only the axis, never a label or the induced-field arrow */
    s += `<path class="fg-arrow" d="M 424 ${y - 54} C 444 ${y - 54} 444 ${y + 54} 428 ${y + 54} C 412 ${y + 54} 410 ${y - 54} 420 ${y - 54}"></path>`;
    s += `<path class="fg-head" d="M 416 ${y - 54} L 425 ${y - 58.5} L 425 ${y - 49.5} Z"></path>`;
    s += tag(446, y - 62, 'pi electrons circulate', { anchor: 'start' });
    s += tag(446, y - 46, 'around the axis', { anchor: 'start' });
    /* induced field, inside the cylinder, pointing against B0 */
    s += arrow(P(372, y + 26), P(268, y + 26));
    s += tag(320, y + 70, 'induced field inside the cylinder points against B₀');
    s += tag(320, y + 88, 'both carbons feel a weaker field: shielded, so upfield', { cls: 'fg-tag-mut' });

    /* where that leaves the three kinds of carbon */
    const X = (d) => 80 + ((160 - d) / 160) * 480;
    const yb = 290;
    const band = (lo, hi, lbl, cls) =>
      `<rect class="${cls}" x="${n2(X(hi))}" y="${yb - 22}" width="${n2(X(lo) - X(hi))}" height="14" rx="5" opacity="0.85"></rect>` +
      tag((X(lo) + X(hi)) / 2, yb - 30, lbl);
    s += band(100, 150, 'sp² C=C: 100–150', 'fg-fill-mut');
    s += band(65, 90, 'sp C≡C: 65–90', 'fg-fill-hi');
    s += band(0, 50, 'sp³ C: 0–50', 'fg-fill-mut');
    s += axis(X, 70, 570, yb, [160, 120, 80, 40, 0]);
    s += tag(320, yb + 42, 'carbon chemical shift (ppm)', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Here the triple bond lies along the applied field, B₀. The arrow inside the cylinder is the induced field. The strip below places the three kinds of carbon on one shift scale.',
});

FIGURES.push({
  id: 'c-nmr-xylenes',
  section: 'c-nmr',
  anchor: '¹³C separates all three by peak count alone.</p>',
  alt: 'o-, m- and p-xylene side by side, each ring numbered C1 to C6 with its mirror planes drawn edge-on as dashed lines. o-Xylene: methyls on C1 and C2, one mirror between them; 4 signals. m-Xylene: methyls on C1 and C3, one mirror through C2 and C5; 5 signals. p-Xylene: methyls on C1 and C4, one mirror through C1 and C4 and a second at right angles to it; 3 signals.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const cy = 150, r = 44;
    const cols = [
      { cx: 130, name: 'o-xylene', spec: ORTHO, sets: 'C1=C2 · C3=C6 · C4=C5', n: '3 ring + 1 CH₃ = 4 signals' },
      { cx: 380, name: 'm-xylene', spec: META, sets: 'C1=C3 · C2 · C4=C6 · C5', n: '4 ring + 1 CH₃ = 5 signals' },
      { cx: 630, name: 'p-xylene', spec: PARA, sets: 'C1=C4 · C2=C3=C5=C6', n: '2 ring + 1 CH₃ = 3 signals' },
    ];
    for (const col of cols) {
      s += `<text class="fg-tag" x="${col.cx}" y="24" text-anchor="middle" font-size="11"><tspan font-style="italic">${col.name[0]}</tspan>${col.name.slice(1)}</text>`;
      s += ring(col.cx, cy, r, col.spec);
      s += tag(col.cx, 284, col.sets, { cls: 'fg-tag-mut' });
      s += tag(col.cx, 306, col.n);
    }
    s += rule(255, 40, 255, 300) + rule(505, 40, 505, 300);
    return s;
  },
  caption: 'Under each ring are its sets of equivalent ring carbons and the number of lines they give. The two methyls always add one more set.',
});

FIGURES.push({
  id: 'l-c-nmr-p-xylene',
  lessons: ['c-nmr'],
  alt: 'p-Xylene with the ring numbered C1 to C6 and methyls on C1 and C4. Mirror 1 runs vertically through C1 and C4; mirror 2 runs horizontally, at right angles to it. Below: the two methyls give 1 signal, C1 and C4 give 1 signal, and C2, C3, C5 and C6 give 1 signal, so 3 signals from 8 carbons.',
  viewBox: '0 0 340 360',
  build() {
    let s = '';
    s += ring(170, 150, 50, { ...PARA, mirrors: [{ deg: 90, len: 120 }, { deg: 0, len: 110 }] });
    s += tag(196, 36, 'mirror 1', { anchor: 'start' });
    s += tag(22, 142, 'mirror 2', { anchor: 'start' });
    s += tag(170, 284, 'both CH₃ carbons: 1 signal');
    s += tag(170, 304, 'C1 and C4: 1 signal');
    s += tag(170, 324, 'C2, C3, C5 and C6: 1 signal');
    s += tag(170, 350, '3 signals from 8 carbons', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Follow each dashed mirror and check which numbered carbons it swaps.',
});

FIGURES.push({
  id: 'l-c-nmr-o-xylene',
  lessons: ['c-nmr'],
  alt: 'o-Xylene with the ring numbered C1 to C6 and methyls on C1 and C2. No mirror planes are drawn.',
  viewBox: '0 0 340 222',
  build() {
    let s = '';
    s += `<text class="fg-tag" x="170" y="22" text-anchor="middle" font-size="11"><tspan font-style="italic">o</tspan>-xylene (1,2-dimethylbenzene)</text>`;
    s += ring(170, 140, 50, { ...ORTHO, mirrors: [] });
    return s;
  },
  caption: 'The methyls sit on C1 and C2. Look for the mirror plane before you count.',
});

/* Carbon shift ranges for the lesson, one bar per row with its label above,
   so every label stays readable at 340 wide. */
FIGURES.push({
  id: 'l-c-nmr-ranges',
  lessons: ['c-nmr'],
  alt: 'Carbon-13 shift ranges on an axis from 220 to 0 ppm: ketone or aldehyde C=O 190 to 220; ester, acid or amide C=O 165 to 185; aromatic 110 to 160; alkene 100 to 150; nitrile 115 to 125; alkyne 65 to 90; C next to O 50 to 90; C next to N 30 to 65; alkyl 0 to 50.',
  viewBox: '0 0 340 440',
  build() {
    const X = (d) => 20 + ((220 - d) / 220) * 300;
    const rows = [
      ['ketone / aldehyde C=O', 190, 220, 'fg-fill-warn'],
      ['ester / acid / amide C=O', 165, 185, 'fg-fill-warn'],
      ['aromatic C', 110, 160, 'fg-fill-hi'],
      ['alkene C', 100, 150, 'fg-fill-hi'],
      ['nitrile C≡N', 115, 125, 'fg-fill-hi'],
      ['alkyne C', 65, 90, 'fg-fill-good'],
      ['C next to O', 50, 90, 'fg-fill-mut'],
      ['C next to N', 30, 65, 'fg-fill-mut'],
      ['alkyl C', 0, 50, 'fg-fill-mut'],
    ];
    let s = '';
    rows.forEach(([lbl, lo, hi, cls], i) => {
      const y = 24 + i * 42;
      const mid = (X(lo) + X(hi)) / 2;
      const w = `${lbl}: ${lo}–${hi}`.length * 6.6;
      const tx = Math.min(Math.max(mid, 14 + w / 2), 326 - w / 2);
      s += tag(tx, y, `${lbl}: ${lo}–${hi}`);
      s += `<rect class="${cls}" x="${n2(X(hi))}" y="${y + 8}" width="${n2(X(lo) - X(hi))}" height="14" rx="5"></rect>`;
    });
    s += axis(X, 20, 320, 404, [200, 150, 100, 50, 0]);
    return s;
  },
  caption: 'Left is downfield. The two carbonyl rows sit on their own at the far left.',
});

FIGURES.push({
  id: 'c-nmr-dept-butanone',
  section: 'c-nmr',
  anchor: 'Between the two, every carbon gets its hydrogen count.</p>',
  alt: 'Three spectra of butan-2-one on one shift axis from 220 to 0 ppm, with the molecule underneath. Routine carbon-13: four lines, at 209, 37, 29 and 8 ppm, plus a small gray three-line solvent signal at 77. DEPT-135: lines pointing up at 29 and 8 labeled CH3, a line pointing down at 37 labeled CH2, and a dashed gap at 209 labeled missing, C=O has no H. DEPT-90: no lines. The molecule CH3–C(=O)–CH2–CH3 has its carbons labeled 29, 209, 37 and 8 ppm.',
  viewBox: '0 0 760 616',
  build() {
    const X = (d) => 80 + ((220 - d) / 220) * 620;
    let s = deptRows(X, 70, 716, false);
    s += axis(X, 70, 716, 442, [220, 200, 150, 100, 50, 0]);
    s += tag(394, 484, 'chemical shift (ppm)', { cls: 'fg-tag-mut' });
    s += butanone(394, 562, 760);
    return s;
  },
  caption: 'Read each carbon down the column. The routine spectrum finds four carbons. DEPT-135 sorts them by direction. DEPT-90 is empty, so both upward lines are CH₃, and the line missing from both DEPT spectra is the C=O carbon.',
});

FIGURES.push({
  id: 'l-c-nmr-dept',
  lessons: ['c-nmr'],
  alt: 'Three spectra of butan-2-one on a broken shift axis, 220 to 190 then 50 to 0 ppm. Routine: lines at 209, 37, 29 and 8. DEPT-135: up at 29 and 8 (CH3), down at 37 (CH2), missing at 209 (C=O, no H). DEPT-90: no lines. Below, the molecule with each carbon labeled by its shift.',
  viewBox: '0 0 340 620',
  build() {
    const X = (d) => (d >= 190 ? 30 + ((220 - d) / 30) * 64 : 128 + ((50 - d) / 50) * 190);
    let s = deptRows(X, 20, 324, true);
    /* broken axis: two segments with a break mark between them */
    const y = 442;
    s += rule(20, y, 100, y) + rule(122, y, 324, y);
    s += `<line class="fg-bond-soft" x1="100" y1="${y + 6}" x2="108" y2="${y - 6}"></line><line class="fg-bond-soft" x1="114" y1="${y + 6}" x2="122" y2="${y - 6}"></line>`;
    for (const d of [220, 200, 50, 25, 0]) {
      s += rule(X(d), y, X(d), y + 6);
      s += tag(X(d), y + 20, String(d));
    }
    s += tag(170, 482, 'chemical shift (ppm), axis broken', { cls: 'fg-tag-mut' });
    s += butanone(170, 562, 340);
    return s;
  },
  caption: 'Lines point up for CH₃ or CH and down for CH₂. A carbon with no H is missing, and DEPT-90 keeps only CH.',
});

/* The worked example's answer, with each carbon's shift beside it. */
FIGURES.push({
  id: 'c-nmr-pinacolone',
  section: 'c-nmr',
  anchor: 'That is 3,3-dimethylbutan-2-one.</p>',
  alt: '3,3-Dimethylbutan-2-one, CH3–C(=O)–C(CH3)3, with each carbon labeled by its shift: the lone CH3 at 25 ppm, the C=O carbon at 214, the central carbon with no hydrogens at 44, and the three equivalent methyls of the tert-butyl group at 26, drawn highlighted.',
  viewBox: '0 0 640 270',
  build() {
    let s = '';
    const me = P(120, 170), co = P(220, 130), o = P(220, 66), q = P(330, 170);
    const m1 = P(430, 110), m2 = P(430, 230), m3 = P(330, 250);
    s += bond(me, co, { rFrom: 17, rTo: 16 }) + bond(co, o, { order: 2, rFrom: 16, rTo: 15 }) + bond(co, q, { rFrom: 16, rTo: 16 });
    s += bond(q, m1, { rFrom: 16, rTo: 17 }) + bond(q, m2, { rFrom: 16, rTo: 17 }) + bond(q, m3, { rFrom: 16, rTo: 17 });
    s += atom(me.x, me.y, 'CH₃', { r: 17 }) + atom(co.x, co.y, 'C', { kind: 'warn' }) + atom(o.x, o.y, 'O') + atom(q.x, q.y, 'C');
    for (const m of [m1, m2, m3]) s += atom(m.x, m.y, 'CH₃', { kind: 'hi', r: 17 });
    s += tag(me.x, me.y + 36, '25 ppm');
    s += tag(co.x + 26, co.y + 4, '214 ppm', { anchor: 'start' });
    s += tag(q.x - 26, q.y + 26, '44 ppm', { anchor: 'end' });
    s += tag(470, 172, 'all three: 26 ppm', { anchor: 'start' });
    s += tag(470, 190, 'one line', { anchor: 'start', cls: 'fg-tag-mut' });
    s += tag(320, 24, '3,3-dimethylbutan-2-one');
    return s;
  },
  caption: 'The molecule has six carbons but gives four lines, because the three highlighted methyls are equivalent and share the line at 26.',
});

export default FIGURES;
