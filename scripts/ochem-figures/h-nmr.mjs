/* Figures for the h-nmr notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure that also appears in the lesson is 340 wide or less and uses
   only fg-lbl and fg-tag text, so one drawing serves both pages. */
import { atom, bond, wedge, hash, arrow, text, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, benzene } from '../lib/ochem-skeletal.mjs';
import { armEnd, n2 } from '../lib/ochem-helpers.mjs';

/* A stick, for spectra drawn as lines rather than traces. */
function stick(x, yBase, h, cls = 'fg-bond', w = 2.6) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}

/* Arrowhead with its tip at (x, y), pointing along (ux, uy). */
function head(x, y, ux, uy, cls = 'fg-head', size = 7) {
  const l = Math.hypot(ux, uy) || 1;
  ux /= l; uy /= l;
  const px = -uy, py = ux, bx = x - ux * size, by = y - uy * size, h = size * 0.52;
  return `<path class="${cls}" d="M${n2(x)} ${n2(y)} L${n2(bx + px * h)} ${n2(by + py * h)} L${n2(bx - px * h)} ${n2(by - py * h)} Z"></path>`;
}

/* Lines of text, one under another. A row is a string (fg-tag) or [text, class]. */
const lines = (x, y0, dy, rows, anchor = 'start') =>
  rows.map((r, i) => {
    if (!r) return '';
    const [s, cls] = Array.isArray(r) ? r : [r, 'fg-tag'];
    return text(x, y0 + i * dy, s, { cls, anchor });
  }).join('');

/* The applied field: a bold upward arrow with its label on top. */
function bField(x, yBottom, yTop, lab = 'B₀') {
  return arrow(P(x, yBottom), P(x, yTop), { size: 9 }) + text(x, yTop - 8, lab, { cls: 'fg-lbl' });
}

const FIGURES = [];

/* ------------------------------------------------------------ shielding ---
   The whole technique in one picture: the applied field points up, the
   electrons around a hydrogen answer with a small field pointing down, and
   the nucleus feels the difference. Less electron density, smaller answer. */
FIGURES.push({
  id: 'h-nmr-shielding',
  section: 'h-nmr',
  lessons: ['h-nmr'],
  viewBox: '0 0 340 300',
  alt: 'Two C–H bonds in an upward applied field B0. Top: the C–H of ethane, with a large electron cloud around the hydrogen and a long downward arrow for the opposing field the electrons set up; the hydrogen is shielded and appears at 0.9 ppm. Bottom: a C–H of fluoromethane, where the fluorine on the carbon has pulled density away, so the cloud around the hydrogen is small and the opposing arrow is short; the hydrogen is deshielded and appears at 4.3 ppm.',
  build() {
    let s = '';
    const row = (y0, title, left, cloud, opp, words) => {
      let o = panel(6, y0, 328, 136);
      o += text(170, y0 + 20, title, { cls: 'fg-lbl' });
      o += bField(30, y0 + 118, y0 + 52);
      const yc = y0 + 80;
      /* F–C–H or H3C–C–H, left to right */
      o += atom(80, yc, left.lab, { kind: left.kind, r: left.r ?? 15 });
      o += bond(P(80, yc), P(128, yc), { rFrom: left.r ?? 15, rTo: 13 });
      o += atom(128, yc, 'C', { r: 13 });
      o += `<ellipse class="fg-orb" cx="178" cy="${yc}" rx="${cloud}" ry="${cloud * 0.82}"></ellipse>`;
      o += bond(P(128, yc), P(178, yc), { rFrom: 13, rTo: 11 });
      o += atom(178, yc, 'H', { r: 11, kind: 'hi' });
      /* the opposing field, drawn beside the hydrogen */
      o += arrow(P(236, yc - opp / 2), P(236, yc + opp / 2), { size: 8 });
      o += lines(248, yc - 10, 16, words);
      return o;
    };
    s += row(6, 'Ethane: a dense electron cloud', { lab: 'CH₃', r: 17 }, 36, 52,
      ['large', 'opposing', 'field']);
    s += text(178, 131, 'H is shielded: δ 0.9', { cls: 'fg-tag-good' });
    s += row(154, 'Fluoromethane: F pulls density away', { lab: 'F', kind: 'warn' }, 20, 22,
      ['small', 'opposing', 'field']);
    s += text(178, 279, 'H is deshielded: δ 4.3', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The downward arrow beside each hydrogen is the opposing field from its own electrons. Compare its length in the two rows.',
});

/* ----------------------------------------------------------- shift scale ---
   The table, drawn as bars on a printed axis: δ grows to the LEFT, which is
   the one thing about the axis a student gets wrong. */
const RANGES = [
  ['carboxylic acid O–H', 10, 13, 0],
  ['aldehyde C–H', 9, 10, 1],
  ['aromatic C–H', 6.5, 8.5, 1],
  ['vinyl C–H', 4.5, 6.5, 1],
  ['C–H next to O or halogen', 3.3, 4.5, 0],
  ['C–H next to N', 2.3, 3.0, 0],
  ['C–H alpha to a carbonyl', 2.0, 2.5, 0],
  ['≡C–H (terminal alkyne)', 1.8, 3.0, 1],
  ['C–H next to C=C or aryl', 1.6, 2.5, 0],
  ['alkyl C–H', 0.9, 1.5, 0],
];
FIGURES.push({
  id: 'h-nmr-shift-scale',
  section: 'h-nmr',
  viewBox: '0 0 760 330',
  alt: 'The proton chemical shift axis, printed with 13 ppm on the left and 0 on the right. Horizontal bars mark the table\'s ranges, from carboxylic acid O–H at 10 to 13 at the top down to alkyl C–H at 0.9 to 1.5 at the bottom. The aldehyde, aromatic, vinyl and terminal alkyne bars are colored differently because a pi bond sets their shift. Under the axis, the left end is labeled downfield, deshielded and the right end upfield, shielded, with TMS at 0.',
  build() {
    const X = (d) => 700 - d * 48;
    let s = '';
    RANGES.forEach(([lab, lo, hi, pi], i) => {
      const y = 22 + i * 22;
      const x1 = X(hi), x2 = X(lo);
      s += bar(x1, y, x2 - x1, 13, { kind: pi ? 'warn' : 'hi', opacity: 0.85, r: 4 });
      if (x1 > 330) s += text(x1 - 8, y + 11, lab, { cls: 'fg-tag', anchor: 'end' });
      else s += text(x2 + 8, y + 11, lab, { cls: 'fg-tag', anchor: 'start' });
    });
    const base = 250;
    s += rule(X(13.3), base, X(-0.3), base);
    for (let d = 0; d <= 13; d++) {
      s += rule(X(d), base, X(d), base + 6);
      s += text(X(d), base + 20, String(d), { cls: 'fg-sm' });
    }
    s += text(X(0), base - 8, 'TMS', { cls: 'fg-tag-mut' });
    s += text(X(6.5), base + 40, 'chemical shift δ (ppm)', { cls: 'fg-sm' });
    s += arrow(P(X(8.5), base + 68), P(X(12.8), base + 68), { size: 8 });
    s += text(X(12.8), base + 58, 'downfield: deshielded, higher δ', { cls: 'fg-tag', anchor: 'start' });
    s += arrow(P(X(4.5), base + 68), P(X(0.2), base + 68), { size: 8 });
    s += text(X(0.2), base + 58, 'upfield: shielded, lower δ', { cls: 'fg-tag', anchor: 'end' });
    return s;
  },
  caption: 'The table as a picture. Coral bars are hydrogens on a carbon that is itself part of a π bond; the next heading explains them.',
});

/* ------------------------------------------------------------- anisotropy ---
   Pi electrons circulate in the applied field and make a field of their own.
   Field lines are closed loops, so the induced field points one way on one
   side of the loop and the other way outside it. Where a hydrogen sits on
   that map decides whether it is shielded or deshielded. */

/* Two closed field loops around a vertical axis at cx, from yTop to yBot.
   The central run points DOWN (against B0); the outer runs point UP. If
   `gapAxis` is given, the central run is drawn only above and below it,
   because a molecule sits on the axis there. */
function fieldLoops(cx, yTop, yBot, reach, gapAxis) {
  const k = reach / 0.75;
  const ym = (yTop + yBot) / 2;
  let s = '';
  for (const sgn of [1, -1]) {
    const cxk = cx + sgn * k;
    s += `<path class="fg-arrow-mut" d="M${n2(cx)} ${n2(yBot)} C${n2(cxk)} ${n2(yBot)} ${n2(cxk)} ${n2(yTop)} ${n2(cx)} ${n2(yTop)}"></path>`;
    /* put the arrowhead on the curve itself, a little below the middle */
    const bz = (u) => {
      const v = 1 - u;
      return { x: cx + sgn * k * 3 * u * v, y: yBot * (v * v * v + 3 * v * v * u) + yTop * (3 * v * u * u + u * u * u),
        dx: sgn * k * 3 * (1 - 2 * u), dy: 6 * u * v * (yTop - yBot) };
    };
    let u = 0.5;
    for (let i = 0; i < 40; i++) { const q = bz(u); u += (q.y - (ym + 60)) / (yBot - yTop) * 0.5; }
    const q = bz(u);
    s += head(q.x, q.y, q.dx, q.dy, 'fg-head-mut', 9);
  }
  if (gapAxis) {
    const [g1, g2] = gapAxis;
    s += `<line class="fg-arrow-mut" x1="${n2(cx)}" y1="${n2(yTop)}" x2="${n2(cx)}" y2="${n2(g1)}"></line>`;
    s += head(cx, g1, 0, 1, 'fg-head-mut', 9);
    s += `<line class="fg-arrow-mut" x1="${n2(cx)}" y1="${n2(g2)}" x2="${n2(cx)}" y2="${n2(yBot)}"></line>`;
    s += head(cx, yBot - 4, 0, 1, 'fg-head-mut', 9);
  } else {
    s += `<line class="fg-arrow-mut" x1="${n2(cx)}" y1="${n2(yTop)}" x2="${n2(cx)}" y2="${n2(yBot)}"></line>`;
    s += head(cx, ym - 34, 0, 1, 'fg-head-mut', 9);
    s += head(cx, yBot - 16, 0, 1, 'fg-head-mut', 9);
  }
  return s;
}

/* A flat loop of circulating electrons, drawn as a squashed ellipse with one
   arrowhead on its front edge. */
function circulation(cx, cy, rx, ry) {
  return `<ellipse class="fg-dash-hi" cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(rx)}" ry="${n2(ry)}"></ellipse>` +
    head(cx + rx * 0.62, cy + ry * 0.78, -rx * 0.78, ry * 0.62, 'fg-head', 8);
}

/* Benzene seen edge-on, ring in a plane at right angles to B0. */
function benzenePanel(cx, cy, reach) {
  const rx = 52, ry = 14;
  const v = [0, 60, 120, 180, 240, 300].map((a) => P(cx + rx * Math.cos((a * Math.PI) / 180), cy + ry * Math.sin((a * Math.PI) / 180)));
  let s = fieldLoops(cx, cy - 118, cy + 118, reach);
  for (let i = 0; i < 6; i++) s += sk(v[i], v[(i + 1) % 6]);
  s += circulation(cx, cy, rx - 16, ry - 5);
  for (const sgn of [1, -1]) {
    const c = P(cx + sgn * rx, cy);
    const h = P(cx + sgn * (rx + 30), cy);
    s += bond(c, h, { rFrom: 0, rTo: 11 });
    s += atom(h.x, h.y, 'H', { r: 11, kind: 'warn' });
  }
  return s;
}

/* An alkene seen edge-on: C=C across the page, H out to both sides. */
function alkenePanel(cx, cy, reach) {
  const a = P(cx - 20, cy), b = P(cx + 20, cy);
  let s = fieldLoops(cx, cy - 118, cy + 118, reach);
  s += bond(a, b, { order: 2, rFrom: 0, rTo: 0 });
  for (const [c, sgn] of [[a, -1], [b, 1]]) {
    for (const dy of [-1, 1]) {
      const h = P(c.x + sgn * 30, c.y + dy * 22);
      s += bond(c, h, { rFrom: 0, rTo: 11 });
      s += atom(h.x, h.y, 'H', { r: 11, kind: 'warn' });
    }
  }
  s += `<ellipse class="fg-orb" cx="${n2(cx)}" cy="${n2(cy - 20)}" rx="14" ry="11"></ellipse>`;
  s += `<ellipse class="fg-orb" cx="${n2(cx)}" cy="${n2(cy + 20)}" rx="14" ry="11"></ellipse>`;
  return s;
}

/* A terminal alkyne along B0: H on top, C≡C, then CH3. */
function alkynePanel(cx, cy, reach) {
  const yH = cy - 66, y1 = cy - 30, y2 = cy + 30, yR = cy + 68;
  let s = fieldLoops(cx, cy - 118, cy + 118, reach, [yH - 16, yR + 20]);
  s += `<ellipse class="fg-orb" cx="${n2(cx)}" cy="${n2(cy)}" rx="24" ry="44"></ellipse>`;
  s += bond(P(cx, y1), P(cx, y2), { order: 3, rFrom: 0, rTo: 0, gap: 3.6 });
  s += bond(P(cx, yH), P(cx, y1), { rFrom: 11, rTo: 0 });
  s += bond(P(cx, y2), P(cx, yR), { rFrom: 0, rTo: 17 });
  s += atom(cx, yH, 'H', { r: 11, kind: 'hi' });
  s += atom(cx, yR, 'CH₃', { r: 17 });
  s += circulation(cx, cy, 34, 8);
  return s;
}

FIGURES.push({
  id: 'h-nmr-anisotropy',
  section: 'h-nmr',
  viewBox: '0 0 760 372',
  alt: 'Three molecules in an upward applied field B0, each with the closed loops of the field its circulating pi electrons induce. Down the middle of each drawing the induced field points down, against B0; on the outside of each loop it points back up, with B0. Left: a benzene ring seen edge-on, with a dashed ring current; the two ring hydrogens stick out past the ring, into the region where the induced field points up, so they are deshielded, 6.5 to 8.5 ppm. Middle: an alkene seen edge-on with its pi lobes above and below the C=C; the four vinyl hydrogens sit out to the sides, also where the field points up, 4.5 to 6.5 ppm. Right: a terminal alkyne standing along the field, with its cylinder of pi electrons circulating around the axis; its hydrogen sits on the axis, where the induced field points down, so it is shielded, 1.8 to 3.0 ppm.',
  build() {
    let s = '';
    s += bField(20, 270, 60);
    const cy = 150;
    const cols = [[160, 'benzene, ring seen edge-on', benzenePanel,
      [['ring H stick out, where', 'fg-tag'], ['the loops point up (with B₀)', 'fg-tag'], ['deshielded: δ 6.5–8.5', 'fg-tag-warn']]],
    [400, 'an alkene, seen edge-on', alkenePanel,
      [['vinyl H sit out to the sides,', 'fg-tag'], ['where the loops point up', 'fg-tag'], ['deshielded: δ 4.5–6.5', 'fg-tag-warn']]],
    [630, 'a terminal alkyne, along B₀', alkynePanel,
      [['≡C–H sits on the axis, where', 'fg-tag'], ['the field points down (against B₀)', 'fg-tag'], ['shielded: δ 1.8–3.0', 'fg-tag-good']]]];
    for (const [cx, title, fn, rows] of cols) {
      s += text(cx, 18, title, { cls: 'fg-lbl' });
      s += fn(cx, cy, 108);
      s += lines(cx, 302, 18, rows, 'middle');
    }
    s += `<line class="fg-dash" x1="280" y1="30" x2="280" y2="350"></line>`;
    s += `<line class="fg-dash" x1="516" y1="30" x2="516" y2="350"></line>`;
    return s;
  },
  caption: 'Gray loops: the induced field. Dashed ellipses: the circulating π electrons. The coral hydrogens sit where the loops point up; the teal alkyne hydrogen sits where they point down.',
});

/* The lesson copy: benzene alone, 340 wide. */
FIGURES.push({
  id: 'l-h-nmr-ring-current',
  lessons: ['h-nmr'],
  viewBox: '0 0 340 372',
  alt: 'A benzene ring seen edge-on in an upward applied field B0, with a dashed ring current and the closed loops of the field it induces. Down the middle of the ring the induced field points down, against B0. Around the outside it points up, with B0, and that is where the two ring hydrogens sit, so they are deshielded, 6.5 to 8.5 ppm.',
  build() {
    let s = '';
    s += bField(24, 270, 60);
    s += text(180, 18, 'benzene, ring seen edge-on', { cls: 'fg-lbl' });
    s += benzenePanel(180, 150, 108);
    s += lines(180, 302, 18, [['middle: induced field points down', 'fg-tag'], ['outside: it points up, with B₀', 'fg-tag'], ['ring H sit outside: δ 6.5–8.5', 'fg-tag-warn']], 'middle');
    return s;
  },
  caption: 'The gray loops are the field the ring current (dashed) creates. The coral hydrogens sit where it adds to B₀.',
});

/* ---------------------------------------------------------------- p-xylene ---
   Symmetry makes look-alike hydrogens identical, so they share a signal. */
FIGURES.push({
  id: 'h-nmr-pxylene',
  section: 'h-nmr',
  lessons: ['h-nmr'],
  viewBox: '0 0 340 230',
  alt: 'p-Xylene, a benzene ring with a methyl group at the top and at the bottom and a hydrogen drawn on each of the other four ring carbons. The four ring hydrogens are colored coral and labeled 4 H, one signal near 7.0 ppm. The two methyl groups are colored teal and labeled 6 H, one signal near 2.3 ppm. Ten hydrogens give only two signals.',
  build() {
    let s = '';
    const cx = 96, cy = 116;
    const ring = benzene(cx, cy, 36, { rot: 90 });
    s += ring.svg;
    const pts = ring.pts;
    const out = (p, len) => { const dx = p.x - cx, dy = p.y - cy, l = Math.hypot(dx, dy); return P(p.x + (dx / l) * len, p.y + (dy / l) * len); };
    for (const i of [0, 3]) {
      const m = out(pts[i], 34);
      s += bond(pts[i], m, { rFrom: 0, rTo: 17 });
      s += atom(m.x, m.y, 'CH₃', { r: 17, kind: 'hi' });
    }
    for (const i of [1, 2, 4, 5]) {
      const h = out(pts[i], 28);
      s += bond(pts[i], h, { rFrom: 0, rTo: 11 });
      s += atom(h.x, h.y, 'H', { r: 11, kind: 'warn' });
    }
    s += '<text class="fg-lbl" x="196" y="24" text-anchor="start"><tspan font-style="italic">p</tspan>-xylene, C₈H₁₀</text>';
    s += lines(196, 88, 18, [['coral: 4 ring H', 'fg-tag-warn'], 'one signal, δ 7.0']);
    s += lines(196, 150, 18, [['teal: 6 methyl H', 'fg-tag-good'], 'one signal, δ 2.3']);
    s += text(196, 210, '10 H, 2 signals', { cls: 'fg-lbl', anchor: 'start' });
    return s;
  },
  caption: 'Coral and teal mark the two sets of equivalent hydrogens.',
});

/* --------------------------------------------------- the substitution test ---
   C3 of (R)-2-bromobutane, run through the test from the Prochirality page:
   the two products are diastereomers, so the two hydrogens can differ. */
function bromobutane(x, y, left, right, o = {}) {
  const c1 = P(x, y + 24), c2 = P(x + 40, y), c3 = P(x + 80, y + 24), c4 = P(x + 120, y);
  let s = sk(c1, c2) + sk(c2, c3) + sk(c3, c4);
  const br = P(x + 40, y - 40);
  s += wedge(c2, br, { rFrom: 0, rTo: 15, width: 10 });
  s += atom(br.x, br.y, 'Br', { kind: 'hi', size: 10.5 });
  const a = armEnd(c3, 245, 42), b = armEnd(c3, 295, 42);
  s += wedge(c3, a, { rFrom: 0, rTo: 12, width: 10 });
  s += hash(c3, b, { rFrom: 0, rTo: 12, width: 10 });
  s += atom(a.x, a.y, left.lab, { r: 12, kind: left.kind, size: left.size });
  s += atom(b.x, b.y, right.lab, { r: 12, kind: right.kind, size: right.size });
  if (o.labels) {
    s += text(c2.x - 12, c2.y + 4, 'C2', { cls: 'fg-tag', anchor: 'end' });
    s += text(c3.x + 12, c3.y + 4, 'C3', { cls: 'fg-tag', anchor: 'start' });
  }
  return s;
}
const cfg = (x, y, c3) => `<text class="fg-tag-good" x="${x}" y="${y}" text-anchor="end">(2<tspan font-style="italic">R</tspan>,3<tspan font-style="italic">${c3}</tspan>)</text>`;
FIGURES.push({
  id: 'h-nmr-topicity',
  section: 'h-nmr',
  viewBox: '0 0 760 280',
  alt: 'The substitution test on the two hydrogens of C3 in (R)-2-bromobutane. On the left, the molecule is drawn as a zigzag with Br on a wedge at C2, and at C3 one hydrogen, Ha, on a wedge and the other, Hb, on a hash. An arrow labeled "replace Ha with D" leads to the (2R,3R) product, and an arrow labeled "replace Hb with D" leads to the (2R,3S) product. The two products are diastereomers, so Ha and Hb are diastereotopic and can give two separate signals.',
  build() {
    let s = '';
    s += '<text class="fg-lbl" x="110" y="26" text-anchor="middle">(<tspan font-style="italic">R</tspan>)-2-bromobutane</text>';
    s += bromobutane(50, 128, { lab: 'Ha', size: 10.5 }, { lab: 'Hb', size: 10.5 }, { labels: true });
    s += arrow(P(210, 132), P(318, 84), { size: 9 });
    s += text(244, 88, 'replace Ha with D', { cls: 'fg-tag', anchor: 'middle' });
    s += arrow(P(210, 164), P(318, 212), { size: 9 });
    s += text(244, 216, 'replace Hb with D', { cls: 'fg-tag', anchor: 'middle' });

    s += panel(330, 8, 190, 124);
    s += bromobutane(362, 58, { lab: 'D', kind: 'warn' }, { lab: 'H' });
    s += cfg(512, 32, 'R');
    s += panel(330, 144, 190, 124);
    s += bromobutane(362, 194, { lab: 'H' }, { lab: 'D', kind: 'warn' });
    s += cfg(512, 168, 'S');

    s += lines(540, 104, 22, [
      ['C2 matches, C3 is opposite:', 'fg-tag'],
      ['diastereomers', 'fg-lbl'],
      ['so Ha and Hb are', 'fg-tag'],
      ['diastereotopic, and can', 'fg-tag'],
      ['give two signals', 'fg-tag-warn'],
    ]);
    return s;
  },
  caption: 'D (coral) marks the replaced hydrogen in each product. The label beside each product gives its configuration at C2 and C3.',
});

/* ------------------------------------------------------- neighbor spins ---
   Why n neighbors give n + 1 lines in the ratios they do: each neighbor is a
   small magnet that points with the field or against it, and every way of
   arranging them is about equally likely. Lines with the same total land in
   one place and add up. */
FIGURES.push({
  id: 'h-nmr-neighbor-spins',
  section: 'h-nmr',
  lessons: ['h-nmr'],
  viewBox: '0 0 340 444',
  alt: 'Three rows. One neighboring hydrogen can point with the field or against it, so the signal splits into two equal lines, a doublet, 1 to 1. Two neighbors have four arrangements: both with, one of each in two ways, or both against, giving three lines in the ratio 1 to 2 to 1, a triplet. Three neighbors have eight arrangements, grouped as one, three, three and one, giving four lines in the ratio 1 to 3 to 3 to 1, a quartet.',
  build() {
    let s = '';
    s += text(170, 18, '↑ = neighbor H with the field', { cls: 'fg-tag' });
    s += text(170, 36, '↓ = neighbor H against it', { cls: 'fg-tag' });
    const row = (y0, title, cols, name) => {
      let o = rule(8, y0, 332, y0);
      o += text(10, y0 + 24, title, { cls: 'fg-lbl', anchor: 'start' });
      const n = cols.length, gap = 50, x0 = 236 - ((n - 1) * gap) / 2;
      const maxRows = Math.max(...cols.map((c) => c.length));
      const base = y0 + 40 + maxRows * 16 + 42;
      cols.forEach((combos, i) => {
        const x = x0 + i * gap;
        combos.forEach((c, j) => { o += text(x, y0 + 40 + j * 16, c, { cls: 'fg-tag' }); });
        o += stick(x, base, combos.length * 14, 'fg-bond', 3);
      });
      o += rule(x0 - 22, base, x0 + (n - 1) * gap + 22, base);
      o += text(10, base - 4, name, { cls: 'fg-tag-good', anchor: 'start' });
      return { o, next: base + 14 };
    };
    let r = row(50, '1 neighbor', [['↑'], ['↓']], 'doublet 1:1');
    s += r.o;
    r = row(r.next, '2 neighbors', [['↑↑'], ['↑↓', '↓↑'], ['↓↓']], 'triplet 1:2:1');
    s += r.o;
    r = row(r.next, '3 neighbors', [['↑↑↑'], ['↑↑↓', '↑↓↑', '↓↑↑'], ['↑↓↓', '↓↑↓', '↓↓↑'], ['↓↓↓']], 'quartet 1:3:3:1');
    s += r.o;
    return s;
  },
  caption: 'Each column lists the neighbor arrangements that shift the line to the same place. More arrangements in a column make a taller line.',
});

/* ------------------------------------------- 1H NMR, the splitting tree ---
   Two neighbour sets, taken one at a time. Panel 1 is the case where the two
   J values match and the tree collapses; panel 2 is the case where they do
   not and every line survives. */
FIGURES.push({
  id: 'h-nmr-splitting-tree',
  section: 'h-nmr',
  viewBox: '0 0 760 440',
  alt: 'Two splitting trees side by side. On the left, one line splits into four equally spaced lines and each of those splits into three, and because both coupling constants are 7 hertz the twelve lines fall onto six positions, drawn underneath as a six-line multiplet with heights 1, 5, 10, 10, 5 and 1. On the right, one line splits into two lines 17.6 hertz apart and each of those splits into two lines 10.9 hertz apart, giving four separate lines of equal height drawn underneath.',
  build() {
    let s = '';
    const tier = (y, positions, from) => {
      let out = '';
      for (const p of positions) {
        out += `<line class="fg-bond-soft" x1="${n2(from)}" y1="${n2(y - 34)}" x2="${n2(p)}" y2="${n2(y)}"></line>`;
        out += stick(p, y + 16, 16, 'fg-bond', 2.4);
      }
      return out;
    };
    /* ---- panel 1: equal J, the tree collapses ---- */
    const c1 = 196;
    s += text(c1, 36, 'CH₃–CH₂–CHBr–CH₃, the CHBr hydrogen', { cls: 'fg-lbl', size: 12 });
    s += text(c1, 52, 'two different neighbor sets, both J ≈ 7 Hz', { cls: 'fg-sm', size: 10 });
    s += stick(c1, 92, 16, 'fg-bond', 2.4);
    s += text(c1, 108, 'before any coupling', { cls: 'fg-sm', size: 9.5 });

    const g = 24;
    const q = [-1.5, -0.5, 0.5, 1.5].map((k) => c1 + k * g);
    s += tier(150, q, c1);
    s += text(c1, 186, 'split by the 3 H of the CH₃: a quartet', { cls: 'fg-tag', size: 11 });

    /* second tier: every quartet line becomes a triplet. Lines that land on
       the same position are drawn once, as tall as the number landing there. */
    const land = new Map();
    for (const p of q) {
      for (const k of [-1, 0, 1]) {
        const x = p + k * g;
        s += `<line class="fg-bond-soft" x1="${n2(p)}" y1="198" x2="${n2(x)}" y2="226"></line>`;
        land.set(x, (land.get(x) || 0) + 1);
      }
    }
    for (const [x, c] of land) s += stick(x, 246, 5 + c * 4, 'fg-bond', 2.4);
    s += text(c1, 266, 'each line split again by the 2 H of the CH₂', { cls: 'fg-tag', size: 11 });
    s += text(c1, 282, 'twelve lines, but only six positions', { cls: 'fg-sm', size: 9.5 });

    const base1 = 372;
    s += rule(60, base1, 332, base1);
    const heights = [1, 5, 10, 10, 5, 1];
    [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].forEach((k, i) => {
      s += stick(c1 + k * g, base1, heights[i] * 7.2, 'fg-bond', 3);
    });
    s += text(c1, 392, 'what you see: a sextet', { cls: 'fg-lbl', size: 12 });
    s += text(c1, 408, '1 : 5 : 10 : 10 : 5 : 1', { cls: 'fg-sm', size: 10 });

    /* ---- panel 2: unequal J, nothing collapses ---- */
    s += `<line class="fg-dash" x1="380" y1="30" x2="380" y2="412"></line>`;
    const c2 = 566;
    s += text(c2, 36, 'C₆H₅–CH=CH₂, the H on the ring-side carbon', { cls: 'fg-lbl', size: 12 });
    s += text(c2, 52, 'two different neighbors, J = 17.6 and 10.9 Hz', { cls: 'fg-sm', size: 10 });
    s += stick(c2, 92, 16, 'fg-bond', 2.4);
    s += text(c2, 108, 'before any coupling', { cls: 'fg-sm', size: 9.5 });

    const gA = 52, gB = 22;
    const d1 = [-0.5, 0.5].map((k) => c2 + k * gA);
    s += tier(150, d1, c2);
    s += `<text class="fg-tag" x="${c2}" y="186" text-anchor="middle">split by the <tspan font-style="italic">trans</tspan> H: J = 17.6 Hz</text>`;
    for (const p of d1) for (const k of [-0.5, 0.5]) {
      s += `<line class="fg-bond-soft" x1="${n2(p)}" y1="198" x2="${n2(p + k * gB)}" y2="226"></line>`;
      s += stick(p + k * gB, 246, 16, 'fg-bond', 2.4);
    }
    s += `<text class="fg-tag" x="${c2}" y="266" text-anchor="middle">split again by the <tspan font-style="italic">cis</tspan> H: J = 10.9 Hz</text>`;
    s += text(c2, 282, 'four lines, and all four stay separate', { cls: 'fg-sm', size: 9.5 });

    s += rule(430, base1, 702, base1);
    for (const p of d1) for (const k of [-0.5, 0.5]) s += stick(p + k * gB, base1, 72, 'fg-bond', 3);
    s += text(c2, 392, 'what you see: a doublet of doublets', { cls: 'fg-lbl', size: 12 });
    s += text(c2, 408, '1 : 1 : 1 : 1', { cls: 'fg-sm', size: 10 });
    s += text(380, 432, 'Same procedure both times. Only the two J values decide what comes out.', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Read each tree from the top down. The bottom row is what the spectrum shows.',
  note: 'The left panel makes one simplification. C2 of 2-bromobutane is a stereocenter, so the two CH₂ hydrogens are diastereotopic rather than equivalent (see the heading on equivalent hydrogens), and a real spectrum is a little messier than the clean sextet drawn. The tree treats them as equivalent because its point is what two different J values do.',
});

/* ------------------------------------------------------------ J geometry ---
   Coupling constants are geometry: which side of a C=C, which ring position. */
FIGURES.push({
  id: 'h-nmr-j-geometry',
  section: 'h-nmr',
  viewBox: '0 0 760 240',
  alt: 'Three panels. Left: a trans alkene, R–CH=CH–R with the two hydrogens on opposite sides of the double bond, J 12 to 18 hertz. Middle: the cis alkene, with both hydrogens on the same side, J 6 to 12 hertz. Right: a benzene ring carrying a group X, with one ring hydrogen, Ha, highlighted; the hydrogen on the next carbon is labeled ortho, J 7 to 10 hertz, and the hydrogen one carbon further round is labeled meta, J 2 to 3 hertz.',
  build() {
    let s = '';
    const alkene = (cx, cis) => {
      const a = P(cx - 24, 110), b = P(cx + 24, 110);
      let o = bond(a, b, { order: 2, rFrom: 0, rTo: 0 });
      const up = -1, dn = 1;
      const hA = P(a.x - 34, a.y + up * 38), rA = P(a.x - 34, a.y + dn * 38);
      const yb = cis ? up : dn;
      const hB = P(b.x + 34, b.y + yb * 38), rB = P(b.x + 34, b.y - yb * 38);
      o += bond(a, hA, { rFrom: 0, rTo: 12 }) + atom(hA.x, hA.y, 'H', { r: 12, kind: 'warn' });
      o += bond(a, rA, { rFrom: 0, rTo: 12 }) + atom(rA.x, rA.y, 'R', { r: 12 });
      o += bond(b, hB, { rFrom: 0, rTo: 12 }) + atom(hB.x, hB.y, 'H', { r: 12, kind: 'warn' });
      o += bond(b, rB, { rFrom: 0, rTo: 12 }) + atom(rB.x, rB.y, 'R', { r: 12 });
      return o;
    };
    s += `<text class="fg-lbl" x="120" y="24" text-anchor="middle"><tspan font-style="italic">trans</tspan>: H on opposite sides</text>`;
    s += alkene(120, false);
    s += text(120, 196, 'J = 12–18 Hz', { cls: 'fg-tag-warn' });
    s += `<line class="fg-dash" x1="250" y1="20" x2="250" y2="210"></line>`;
    s += `<text class="fg-lbl" x="370" y="24" text-anchor="middle"><tspan font-style="italic">cis</tspan>: H on the same side</text>`;
    s += alkene(370, true);
    s += text(370, 196, 'J = 6–12 Hz', { cls: 'fg-tag-warn' });
    s += `<line class="fg-dash" x1="500" y1="20" x2="500" y2="210"></line>`;

    /* the ring: X on top, Ha upper left, ortho lower left, meta at the bottom */
    const cx = 610, cy = 104;
    const ring = benzene(cx, cy, 34, { rot: 90 });
    s += ring.svg;
    const pts = ring.pts;
    const out = (p, len) => { const dx = p.x - cx, dy = p.y - cy, l = Math.hypot(dx, dy); return P(p.x + (dx / l) * len, p.y + (dy / l) * len); };
    const x = out(pts[0], 30);
    s += bond(pts[0], x, { rFrom: 0, rTo: 12 }) + atom(x.x, x.y, 'X', { r: 12 });
    const spec = [[1, 'Ha', 'warn'], [2, 'H', 'hi'], [3, 'H', 'hi'], [4, 'H', 'plain'], [5, 'H', 'plain']];
    for (const [i, lab, kind] of spec) {
      const h = out(pts[i], 26);
      s += bond(pts[i], h, { rFrom: 0, rTo: 12 }) + atom(h.x, h.y, lab, { r: 12, kind, size: lab.length > 1 ? 10.5 : 12 });
    }
    s += text(cx, 24, 'on a ring, from Ha', { cls: 'fg-lbl' });
    const ho = out(pts[2], 26), hm = out(pts[3], 26);
    s += text(ho.x - 16, ho.y + 4, 'ortho', { cls: 'fg-tag-good', anchor: 'end' });
    s += text(hm.x - 16, hm.y + 4, 'meta', { cls: 'fg-tag-good', anchor: 'end' });
    s += text(cx + 30, 208, 'ortho: J = 7–10 Hz', { cls: 'fg-tag-warn', anchor: 'middle' });
    s += text(cx + 30, 226, 'meta: J = 2–3 Hz', { cls: 'fg-tag-warn', anchor: 'middle' });
    return s;
  },
  caption: 'In each alkene the coral hydrogens are the coupled pair. On the ring, the teal hydrogens are the ortho and meta partners of Ha.',
});

/* ---------------------------------------------------------------- ethanol ---
   The first spectrum a student reads, structure above and spectrum below. */
FIGURES.push({
  id: 'h-nmr-ethanol',
  section: 'h-nmr',
  lessons: ['h-nmr'],
  viewBox: '0 0 340 330',
  alt: 'Ethanol, CH3–CH2–OH, drawn as three colored groups: the CH3 with 3 H, the CH2 with 2 H and the OH with 1 H. Below it, a spectrum axis runs from 5 ppm on the left to 0 on the right. The CH2 is a four-line quartet at 3.6 ppm, the OH is a broad single hump near 2.4 ppm whose position varies, and the CH3 is a three-line triplet at 1.2 ppm.',
  build() {
    let s = '';
    s += text(170, 20, 'ethanol, CH₃CH₂OH', { cls: 'fg-lbl' });
    const g = [[90, 'CH₃', 'warn', '3 H'], [170, 'CH₂', 'hi', '2 H'], [250, 'OH', 'plain', '1 H']];
    s += bond(P(90, 62), P(170, 62), { rFrom: 22, rTo: 22 });
    s += bond(P(170, 62), P(250, 62), { rFrom: 22, rTo: 20 });
    for (const [x, lab, kind, n] of g) {
      s += atom(x, 62, lab, { r: kind === 'plain' ? 20 : 22, kind, size: 12 });
      s += text(x, 104, n, { cls: kind === 'warn' ? 'fg-tag-warn' : kind === 'hi' ? 'fg-tag-good' : 'fg-tag' });
    }
    const X = (d) => 305 - d * 57;
    const base = 230;
    const mult = (d, hs, gap = 7) => {
      let o = '';
      const x0 = X(d) - ((hs.length - 1) * gap) / 2;
      hs.forEach((h, i) => { o += stick(x0 + i * gap, base, h, 'fg-bond', 2.6); });
      return o;
    };
    s += mult(3.6, [20, 60, 60, 20]);
    s += mult(1.2, [36, 72, 36]);
    const xo = X(2.4);
    s += `<path class="fg-bond" fill="none" d="M${n2(xo - 16)} ${base} Q${n2(xo - 6)} ${base} ${n2(xo)} ${base - 40} Q${n2(xo + 6)} ${base} ${n2(xo + 16)} ${base}"></path>`;
    s += rule(X(5.2), base, X(-0.1), base);
    for (let d = 0; d <= 5; d++) {
      s += rule(X(d), base, X(d), base + 5);
      s += text(X(d), base + 18, String(d), { cls: 'fg-tag' });
    }
    s += text(170, 140, 'δ (ppm) rises to the left', { cls: 'fg-tag-mut' });
    const lab = (d, a, b, c, cls) => lines(X(d), 272, 17, [[a, cls], b, c], 'middle');
    s += lab(3.6, 'CH₂', 'q · 2H', 'δ 3.6', 'fg-tag-good');
    s += lab(2.4, 'OH', 's · 1H', 'δ varies', 'fg-tag');
    s += lab(1.2, 'CH₃', 't · 3H', 'δ 1.2', 'fg-tag-warn');
    return s;
  },
  caption: 'Three kinds of hydrogen, three signals. Under each signal: its group, its splitting and integration, and its shift.',
});

/* ------------------------------------------------------------- 1H NMR ---
   Ethyl acetate, which is the compound the section's own worked example
   solves, so the figure is the answer to the example, drawn. */
FIGURES.push({
  id: 'h-nmr-spectrum-ethyl-acetate',
  section: 'h-nmr',
  alt: 'The proton NMR spectrum of ethyl acetate. The chemical shift axis runs from 5 ppm on the left to 0 on the right. A four-line quartet stands at 4.1 ppm, a single line at 2.0 ppm, a three-line triplet at 1.3 ppm and a small TMS reference line at 0. A stepped integration trace above the peaks rises by two hydrogens at the quartet and by three at each of the other two signals, and a labeled bar underneath links the quartet and the triplet by their shared coupling constant of about 7 hertz.',
  viewBox: '0 0 760 444',
  build() {
    const X = (d) => 80 + (5 - d) * 124;
    const base = 300;
    let s = '';
    s += rule(70, base, 716, base);
    for (const d of [5, 4, 3, 2, 1, 0]) {
      s += rule(X(d), base, X(d), base + 6);
      s += text(X(d), base + 20, String(d), { cls: 'fg-sm', size: 9.5 });
    }
    s += text(394, 350, 'chemical shift δ (ppm), rising to the left as a spectrum is printed', { cls: 'fg-sm', size: 10.5 });

    /* the three multiplets. The line SPACING is drawn far wider than scale:
       7 Hz on a 300 MHz instrument is 0.023 ppm, about three pixels here, and
       at that size nobody could count the lines. */
    const mult = (d, heights, gap) => {
      let out = '';
      const x0 = X(d) - ((heights.length - 1) * gap) / 2;
      heights.forEach((h, i) => { out += stick(x0 + i * gap, base, h); });
      return out;
    };
    s += mult(4.1, [33.33, 100, 100, 33.33], 7);
    s += mult(2.0, [130], 7);
    s += mult(1.3, [60, 120, 60], 7);
    s += stick(X(0), base, 34, 'fg-bond-soft', 2.2);

    /* integration, drawn the way an instrument draws it: a trace that steps up
       by the area of each signal as it crosses it. */
    let step = 'M110 150';
    const risers = [[4.1, 20], [2.0, 30], [1.3, 30]];
    let y = 150;
    for (const [d, h] of risers) {
      step += ` L${n2(X(d) - 16)} ${n2(y)} L${n2(X(d) + 16)} ${n2(y - h)}`;
      y -= h;
    }
    step += ` L690 ${n2(y)}`;
    s += `<path class="fg-arrow-mut" d="${step}"></path>`;
    s += text(X(4.1) + 22, 142, '2H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(X(2.0) + 22, 118, '3H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(X(1.3) + 22, 88, '3H', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(96, 74, 'integration 2 : 3 : 3, eight hydrogens, and C₄H₈O₂ has exactly eight', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });

    const assign = (d, a, b, dx = 0) => text(X(d), 374, a, { cls: 'fg-lbl', size: 12 }) + text(X(d) + dx, 390, b, { cls: 'fg-sm', size: 9.5 });
    s += assign(4.1, '–O–CH₂–', 'δ 4.1 · q · 2H');
    s += assign(2.0, 'CH₃–C=O', 'δ 2.0 · s · 3H', -14);
    s += assign(1.3, '–CH₃', 'δ 1.3 · t · 3H', 16);
    s += text(716, 374, 'TMS', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += text(716, 390, 'δ 0', { cls: 'fg-sm', size: 9.5, anchor: 'end' });

    s += text(X(2.7), 412, 'matching J ≈ 7 Hz: these two are coupled to each other', { cls: 'fg-tag', size: 11 });
    s += `<line class="fg-arrow" x1="${n2(X(4.1))}" y1="426" x2="${n2(X(1.3))}" y2="426"></line>`;
    s += `<line class="fg-arrow" x1="${n2(X(4.1))}" y1="420" x2="${n2(X(4.1))}" y2="432"></line>`;
    s += `<line class="fg-arrow" x1="${n2(X(1.3))}" y1="420" x2="${n2(X(1.3))}" y2="432"></line>`;
    s += text(680, 46, 'ethyl acetate, CH₃COOCH₂CH₃', { cls: 'fg-tag', size: 11, anchor: 'end' });
    return s;
  },
  caption: 'The worked example&rsquo;s answer, drawn as a spectrum. The stepped line is the integration trace. The bar underneath joins the two signals that share a coupling constant.',
  note: 'The line spacings are drawn much wider than scale on purpose: 7 Hz on a 300 MHz instrument is 0.023 ppm, about three pixels at this size, and a real printed multiplet is expanded before anyone tries to count its lines.',
});

export default FIGURES;
