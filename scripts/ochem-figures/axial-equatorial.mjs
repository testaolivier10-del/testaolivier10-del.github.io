/* Figures for the axial-equatorial notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Nothing on this page may lean on ring flips, which the next topic teaches.
   So every figure shows a single chair, or two chairs set side by side as two
   separate conformations of one compound, and never an arrow or a caption
   that turns one chair into the other. */
import { atom, bond, text, tag, label, rule, panel, bar, wedge, hash, P } from '../lib/ochem-figure.mjs';

/* Measured chair geometry, copied from the builder. Vertex 0 is the right-hand
   tip; the even vertices are the three carbons puckered up, the odd ones the
   three puckered down. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
function chair(cx, cy, k = 1) {
  return CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
}
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
/* Axial: straight up on the even carbons, straight down on the odd ones. */
const axialUp = (i) => i % 2 === 0;
const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (axialUp(i) ? -L : L));
/* Equatorial: outward, and tilted the other way from that carbon's axial. */
const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);

/* Where a carbon-number label goes: pushed away from the two ring bonds and
   the two substituent bonds at that vertex, so it lands in the open wedge. */
function numberSpot(pts, i, d = 17) {
  const p = pts[i];
  const dirs = [pts[(i + 1) % 6], pts[(i + 5) % 6], axialEnd(pts, i, 30), equatorialEnd(pts, i, 30)]
    .map((q) => { const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1; return P(dx / l, dy / l); });
  let sx = 0, sy = 0;
  for (const u of dirs) { sx -= u.x; sy -= u.y; }
  const l = Math.hypot(sx, sy) || 1;
  return P(p.x + (sx / l) * d, p.y + (sy / l) * d + 4);
}
const cNum = (pts, i, n, cls = 'fg-sm', d = 17) => {
  const s = numberSpot(pts, i, d);
  return text(s.x, s.y, 'C' + n, { cls });
};
/* A substituent on a chair: bond plus labelled atom disc. */
function sub(from, to, lab, opts = {}) {
  const r = opts.r ?? (lab.length > 1 ? 15 : 10);
  return bond(from, to, { rFrom: 0, rTo: r, cls: opts.cls }) + atom(to.x, to.y, lab, { r, kind: opts.kind });
}
/* A dashed contact line between two atom discs. */
function contact(a, b, ra = 15, rb = 10) {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
  const ux = dx / l, uy = dy / l;
  return `<line class="fg-dash-hi" x1="${(a.x + ux * ra).toFixed(2)}" y1="${(a.y + uy * ra).toFixed(2)}" x2="${(b.x - ux * rb).toFixed(2)}" y2="${(b.y - uy * rb).toFixed(2)}"></line>`;
}

/* Every position on one chair: six axial bonds tagged up/down, six equatorial
   bonds drawn thinner, carbons numbered C1–C6. */
function positionsChair(cx, cy, k, numCls, tagCls) {
  const pts = chair(cx, cy, k);
  let s = chairRing(pts);
  for (let i = 0; i < 6; i++) {
    const a = axialEnd(pts, i, 36 * k);
    s += bond(pts[i], a, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(pts[i], equatorialEnd(pts, i, 34 * k), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += axialUp(i) ? text(a.x, a.y - 6, 'up', { cls: tagCls })
      : text(a.x - 6, a.y + 2, 'down', { cls: tagCls, anchor: 'end' });
    s += cNum(pts, i, i + 1, numCls, 17);
  }
  return s;
}

/* Methylcyclohexane on one chair, methyl on C1 (vertex 0) either axial or
   equatorial. The axial hydrogens on C3 and C5 are drawn; so is C1's other H. */
function methylChair(cx, cy, k, where, numCls) {
  const pts = chair(cx, cy, k);
  let s = chairRing(pts);
  const ax1 = axialEnd(pts, 0, 38 * k), eq1 = equatorialEnd(pts, 0, 38 * k);
  const h3 = axialEnd(pts, 2, 32 * k), h5 = axialEnd(pts, 4, 30 * k);
  s += sub(pts[2], h3, 'H');
  s += sub(pts[4], h5, 'H');
  if (where === 'axial') {
    s += contact(ax1, h3);
    s += contact(ax1, h5);
    s += sub(pts[0], ax1, 'CH₃', { kind: 'warn', r: 16 });
    s += sub(pts[0], eq1, 'H');
  } else {
    s += sub(pts[0], ax1, 'H');
    s += sub(pts[0], eq1, 'CH₃', { kind: 'hi', r: 16 });
  }
  s += text(pts[0].x - 36 * k, pts[0].y + 24 * k, 'C1', { cls: numCls });
  s += cNum(pts, 2, 3, numCls, 18);
  s += cNum(pts, 4, 5, numCls, 18);
  return s;
}

/* A line of text whose first word is an italic prefix such as cis or trans. */
function itx(x, y, word, rest, cls = 'fg-tag', anchor = 'start') {
  return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}"><tspan font-style="italic">${word}</tspan>${rest}</text>`;
}

const FIGURES = [];

/* ---------------------------------------------------------------------------
   1. The twelve positions. */
FIGURES.push({
  id: 'chair-twelve-positions',
  section: 'axial-equatorial',
  anchor: 'and C2, C4 and C6 have theirs on the bottom face.</p>',
  alt: 'A cyclohexane chair with carbons numbered C1 to C6. Each carbon has one vertical axial bond and one outward equatorial bond. The axial bonds point up on C1, C3 and C5 and down on C2, C4 and C6.',
  viewBox: '0 0 760 310',
  build() {
    let s = '';
    s += tag(210, 20, 'EVERY CARBON CARRIES ONE OF EACH');
    s += positionsChair(210, 168, 1.25, 'fg-sm', 'fg-tag');
    s += rule(420, 50, 420, 280);
    s += text(450, 110, 'AXIAL: the bold vertical bonds', { cls: 'fg-tag', anchor: 'start' });
    s += text(450, 130, 'up on C1, C3, C5; down on C2, C4, C6', { anchor: 'start' });
    s += text(450, 180, 'EQUATORIAL: the thin angled bonds', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(450, 200, 'outward, tilted opposite to the axial', { anchor: 'start' });
    return s;
  },
  caption: 'All twelve positions on one chair, with the carbons numbered C1 to C6.',
});

FIGURES.push({
  id: 'l-chair-positions',
  lessons: ['axial-equatorial'],
  alt: 'A cyclohexane chair numbered C1 to C6. Bold vertical axial bonds point up on C1, C3 and C5 and down on C2, C4 and C6. Thin equatorial bonds point outward.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    s += positionsChair(172, 124, 1.0, 'fg-tag', 'fg-tag');
    s += text(170, 244, 'bold: axial. thin: equatorial.', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'One chair, with the carbons numbered C1 to C6.',
});

/* ---------------------------------------------------------------------------
   2. The 1,3-diaxial clash, axial methyl against equatorial methyl. */
FIGURES.push({
  id: 'diaxial-clash',
  section: 'axial-equatorial',
  anchor: 'That steric clash is a',
  alt: 'Two chairs of methylcyclohexane. Left: the methyl on C1 is axial and points up, next to the axial hydrogens on C3 and C5; dashed lines mark the two 1,3-diaxial contacts. Right: the methyl on C1 is equatorial and points outward, and C1 carries an axial hydrogen instead.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += panel(16, 14, 356, 272, { kind: 'warn' });
    s += panel(388, 14, 356, 272, { kind: 'good' });
    s += tag(194, 40, 'METHYL AXIAL', { cls: 'fg-tag-warn' });
    s += methylChair(190, 160, 1.0, 'axial', 'fg-sm');
    s += text(194, 256, 'two 1,3-diaxial contacts (dashed),', { cls: 'fg-sm' });
    s += text(194, 272, 'with the axial H on C3 and on C5', { cls: 'fg-sm' });
    s += tag(566, 40, 'METHYL EQUATORIAL', { cls: 'fg-tag-good' });
    s += methylChair(558, 160, 1.0, 'equatorial', 'fg-sm');
    s += text(566, 256, 'the methyl points out, away from the ring;', { cls: 'fg-sm' });
    s += text(566, 272, 'only a small H sits axial on C1', { cls: 'fg-sm' });
    return s;
  },
  caption: 'The same compound, methylcyclohexane, in two chair shapes. Only the hydrogens that matter are drawn, and dashed lines mark the contacts.',
});

FIGURES.push({
  id: 'l-diaxial-clash',
  lessons: ['axial-equatorial'],
  alt: 'Two chairs of methylcyclohexane, stacked. Top: the methyl on C1 is axial, next to the axial hydrogens on C3 and C5, with dashed lines marking the two contacts. Bottom: the methyl on C1 is equatorial and points outward.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    s += panel(6, 6, 328, 222, { kind: 'warn' });
    s += panel(6, 240, 328, 222, { kind: 'good' });
    s += tag(170, 30, 'METHYL AXIAL: 2 CONTACTS', { cls: 'fg-tag-warn' });
    s += methylChair(170, 136, 1.0, 'axial', 'fg-tag');
    s += tag(170, 264, 'METHYL EQUATORIAL: NONE', { cls: 'fg-tag-good' });
    s += methylChair(170, 370, 1.0, 'equatorial', 'fg-tag');
    return s;
  },
  caption: 'Methylcyclohexane in two chair shapes. Dashed lines mark the 1,3-diaxial contacts.',
});

/* ---------------------------------------------------------------------------
   3. Why each contact costs a gauche interaction: Newman down C1–C2. */
function newman(cx, cy, front, back, hiF, hiB) {
  // front/back: arrays of [angleDeg clockwise from up, label]
  const R = 30, L = 62;
  const at = (deg, len) => P(cx + len * Math.sin(deg * Math.PI / 180), cy - len * Math.cos(deg * Math.PI / 180));
  let s = '';
  for (const [deg, lab] of back) {
    const hi = lab === hiB;
    s += bond(at(deg, R), at(deg, L), { rFrom: 0, rTo: lab.length > 1 ? 15 : 10 });
    const e = at(deg, L);
    s += atom(e.x, e.y, lab, { r: lab.length > 1 ? 15 : 10, kind: hi ? 'hi' : undefined });
  }
  s += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="${R}" fill="none"></circle>`;
  for (const [deg, lab] of front) {
    const hi = lab === hiF;
    s += bond(P(cx, cy), at(deg, L), { rFrom: 0, rTo: lab.length > 1 ? 16 : 10 });
    const e = at(deg, L);
    s += atom(e.x, e.y, lab, { r: lab.length > 1 ? 16 : 10, kind: hi ? 'warn' : undefined });
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="3.2"></circle>`;
  return { s, at };
}

FIGURES.push({
  id: 'diaxial-newman',
  section: 'axial-equatorial',
  anchor: 'which is the anti arrangement.</p>',
  alt: 'Two Newman projections of methylcyclohexane viewed down the C1–C2 bond, with C1 in front. Left, methyl axial: the methyl points up and the ring carbon C3 on the back carbon sits 60 degrees from it, gauche. Right, methyl equatorial: the methyl sits 180 degrees from C3, anti.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    s += tag(190, 24, 'METHYL AXIAL: GAUCHE TO C3', { cls: 'fg-tag-warn' });
    const a = newman(190, 142,
      [[0, 'CH₃'], [120, 'C6'], [240, 'H']],
      [[60, 'C3'], [180, 'H'], [300, 'H']], 'CH₃', 'C3');
    s += a.s;
    s += `<path class="fg-dash-hi" d="M ${a.at(0, 86).x} ${a.at(0, 86).y} A 86 86 0 0 1 ${a.at(60, 86).x.toFixed(2)} ${a.at(60, 86).y.toFixed(2)}" fill="none"></path>`;
    s += text(a.at(30, 100).x + 12, a.at(30, 100).y, '60°', { cls: 'fg-tag-warn' });
    s += text(190, 262, 'front carbon C1, back carbon C2', { cls: 'fg-sm' });

    s += rule(380, 44, 380, 260);

    s += tag(570, 24, 'METHYL EQUATORIAL: ANTI TO C3', { cls: 'fg-tag-good' });
    const b = newman(570, 142,
      [[0, 'H'], [120, 'C6'], [240, 'CH₃']],
      [[60, 'C3'], [180, 'H'], [300, 'H']], 'CH₃', 'C3');
    s += b.s.replace('fg-atom-warn', 'fg-atom-hi');
    const e1 = b.at(60, 88), e2 = b.at(239.5, 88);
    s += `<path class="fg-dash-hi" d="M ${e1.x.toFixed(2)} ${e1.y.toFixed(2)} A 88 88 0 0 1 ${e2.x.toFixed(2)} ${e2.y.toFixed(2)}" fill="none"></path>`;
    const lb = b.at(150, 102);
    s += text(lb.x + 14, lb.y + 4, '180°', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(570, 262, 'front carbon C1, back carbon C2', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Both chairs of methylcyclohexane viewed down the C1–C2 bond, with C1 in front. Compare where the methyl sits relative to C3.',
});

/* ---------------------------------------------------------------------------
   4. The A-value chart. */
FIGURES.push({
  id: 'a-value-chart',
  section: 'axial-equatorial',
  anchor: 'converts directly into an equilibrium ratio.</p>',
  alt: 'Bar chart of A-values in kcal/mol with the percentage of molecules that have the group equatorial at room temperature: CN 0.2 (58%), F 0.25 (60%), Cl 0.5 (70%), OH 0.9 (82%), CH3 1.7 (95%), CH2CH3 1.8 (95%), CH(CH3)2 2.2 (98%), C6H5 2.8 (99%), C(CH3)3 4.9 (more than 99.9%).',
  viewBox: '0 0 760 420',
  build() {
    const rows = [
      ['–CN', 0.2, '58'], ['–F', 0.25, '60'], ['–Cl', 0.5, '70'], ['–OH', 0.9, '82'],
      ['–CH₃', 1.7, '95'], ['–CH₂CH₃', 1.8, '95'], ['–CH(CH₃)₂', 2.2, '98'],
      ['–C₆H₅', 2.8, '99'], ['–C(CH₃)₃', 4.9, '>99.9'],
    ];
    let s = '';
    s += tag(70, 28, 'group');
    s += tag(190, 28, 'A-value');
    s += tag(440, 28, 'energy gained by sitting equatorial');
    s += tag(700, 28, '% equatorial');
    const x0 = 262, scale = 80;
    rows.forEach(([g, v, pct], i) => {
      const y = 66 + i * 40;
      s += label(70, y + 5, g);
      s += label(190, y + 5, String(v));
      s += bar(x0, y - 8, Math.max(14, v * scale), 16, { opacity: 0.35 + 0.65 * (v / 4.9) });
      s += text(700, y + 4, pct, { cls: 'fg-sm' });
    });
    s += text(440, 412, 'A-values in kcal/mol; percentages at room temperature (298 K)', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Common A-values, smallest to largest, with the share of molecules that have the group equatorial.',
});

/* ---------------------------------------------------------------------------
   5. Cis/trans is about faces; axial/equatorial is about the chair. */
function hex(cx, cy, r) {
  const v = [];
  for (let i = 0; i < 6; i++) {
    const a = (90 - i * 60) * Math.PI / 180;
    v.push(P(cx + r * Math.cos(a), cy - r * Math.sin(a)));
  }
  return v;
}
function flatDimethyl(cx, cy, kind) {
  const v = hex(cx, cy, 46);
  let g = v.map((p, i) => bond(p, v[(i + 1) % 6], { rFrom: 0, rTo: 0 })).join('');
  const t1 = P(v[0].x, v[0].y - 34);
  const t2 = P(v[1].x + 30, v[1].y - 17);
  g += wedge(v[0], t1, { rFrom: 0, rTo: 16 });
  g += (kind === 'cis' ? wedge : hash)(v[1], t2, { rFrom: 0, rTo: 16 });
  g += atom(t1.x, t1.y, 'CH₃', { r: 16 });
  g += atom(t2.x, t2.y, 'CH₃', { r: 16 });
  g += text(v[0].x, v[0].y + 20, 'C1');
  g += text(v[1].x - 18, v[1].y + 8, 'C2');
  return g;
}

FIGURES.push({
  id: 'cis-trans-on-rings',
  section: 'axial-equatorial',
  anchor: 'Two wedges, or two hashes, is cis',
  alt: 'Left: flat hexagons of trans-1,2-dimethylcyclohexane, with one wedge and one hash, and cis-1,2-dimethylcyclohexane, with two wedges. Right: a chair with C1 and C2 marked. On C1 the bond that points up is axial; on C2 the bond that points up is equatorial.',
  viewBox: '0 0 760 320',
  build() {
    let s = '';
    s += tag(224, 26, 'THE FLAT DRAWING SHOWS THE FACE');
    s += flatDimethyl(118, 150, 'trans');
    s += itx(118, 240, 'trans', ': one wedge, one hash', 'fg-tag-warn', 'middle');
    s += text(118, 258, 'one up, one down');
    s += flatDimethyl(330, 150, 'cis');
    s += itx(330, 240, 'cis', ': two wedges', 'fg-tag-good', 'middle');
    s += text(330, 258, 'both up');
    s += text(224, 296, 'Moving a group to the other face means breaking a bond.');
    s += rule(456, 44, 456, 300);

    s += tag(600, 26, 'THE CHAIR SHOWS AXIAL OR EQUATORIAL');
    const pts = chair(590, 170, 0.9);
    s += chairRing(pts);
    // C1 = vertex 0 (axial up), C2 = vertex 1 (axial down, so its up bond is equatorial).
    const up1 = axialEnd(pts, 0, 40), up2 = equatorialEnd(pts, 1, 40);
    const dn1 = equatorialEnd(pts, 0, 30), dn2 = axialEnd(pts, 1, 32);
    s += bond(pts[0], dn1, { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += bond(pts[1], dn2, { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += bond(pts[0], up1, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bond(pts[1], up2, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += text(up1.x + 6, up1.y + 4, 'up, axial', { cls: 'fg-tag', anchor: 'start' });
    s += text(up2.x - 8, up2.y - 6, 'up, equatorial', { cls: 'fg-tag', anchor: 'end' });
    s += text(pts[0].x + 10, pts[0].y + 22, 'C1', { anchor: 'start' });
    s += text(pts[1].x - 14, pts[1].y + 20, 'C2');
    s += text(600, 266, 'The up bond on C1 is axial;');
    s += text(600, 282, 'the up bond on C2 is equatorial.');
    return s;
  },
  caption: 'Left: the flat drawings of the two isomers. Right: one chair, with the bond that points up on C1 and on C2 drawn bold.',
});

FIGURES.push({
  id: 'l-up-not-axial',
  lessons: ['axial-equatorial'],
  alt: 'A chair of cis-1,2-dimethylcyclohexane. Both methyls point up. The methyl on C1 is axial; the methyl on C2 is equatorial.',
  viewBox: '0 0 340 250',
  build() {
    let s = '';
    const pts = chair(130, 136, 1.0);
    s += chairRing(pts);
    // C1 = vertex 0 (axial up); C2 = vertex 5 (axial down, so its up bond is equatorial).
    const m1 = axialEnd(pts, 0, 46), m2 = equatorialEnd(pts, 5, 44);
    s += sub(pts[0], m1, 'CH₃', { r: 16 });
    s += sub(pts[5], m2, 'CH₃', { r: 16 });
    s += cNum(pts, 0, 1, 'fg-tag', 18);
    s += cNum(pts, 5, 2, 'fg-tag', 18);
    s += text(m1.x + 22, m1.y + 4, 'up, axial', { cls: 'fg-tag', anchor: 'start' });
    s += text(m2.x, m2.y + 34, 'up, equatorial', { cls: 'fg-tag' });
    s += '<text class="fg-tag-good" x="170" y="244" text-anchor="middle">both up, so <tspan font-style="italic">cis</tspan></text>';
    return s;
  },
  caption: '<i>cis</i>-1,2-Dimethylcyclohexane drawn on one chair.',
});

/* ---------------------------------------------------------------------------
   6. 1,2-disubstituted rings: which placements a chair allows. */
function pair(cx, cy, k, spec) {
  // spec: list of [vertex, 'ax'|'eq'] for the two methyls, plus numbering.
  const pts = chair(cx, cy, k);
  let s = chairRing(pts);
  spec.forEach(([i, kind, n]) => {
    const end = kind === 'ax' ? axialEnd(pts, i, 40 * k) : equatorialEnd(pts, i, 42 * k);
    s += sub(pts[i], end, 'CH₃', { r: 16, kind: kind === 'ax' ? 'warn' : 'hi' });
    s += cNum(pts, i, n, 'fg-sm', 17);
  });
  return s;
}

FIGURES.push({
  id: 'one-must-be-axial',
  section: 'axial-equatorial',
  anchor: 'cannot put both groups equatorial.</p>',
  alt: 'Four chairs. Top row, trans-1,2-dimethylcyclohexane: one chair with both methyls equatorial, one with both axial. Bottom row, cis-1,2-dimethylcyclohexane: one chair with the C1 methyl equatorial and the C2 methyl axial, and one with the C1 methyl axial and the C2 methyl equatorial.',
  viewBox: '0 0 760 500',
  build() {
    let s = '';
    s += itx(20, 26, 'trans', '-1,2-dimethylcyclohexane: one methyl on each face');
    s += pair(200, 100, 1.0, [[0, 'eq', 1], [5, 'eq', 2]]);
    s += text(200, 232, 'both equatorial', { cls: 'fg-tag-good' });
    s += pair(560, 100, 1.0, [[0, 'ax', 1], [5, 'ax', 2]]);
    s += text(560, 232, 'both axial', { cls: 'fg-tag-warn' });
    s += rule(20, 252, 740, 252);
    s += itx(20, 280, 'cis', '-1,2-dimethylcyclohexane: both methyls on the same face');
    s += pair(200, 354, 1.0, [[0, 'eq', 1], [5, 'ax', 2]]);
    s += text(200, 486, 'C1 equatorial, C2 axial', { cls: 'fg-tag' });
    s += pair(560, 354, 1.0, [[0, 'ax', 1], [5, 'eq', 2]]);
    s += text(560, 486, 'C1 axial, C2 equatorial', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The two chairs of each isomer, with the position of each methyl written underneath.',
});

export default FIGURES;
