/* Figures for the molecular-geometry notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Foundations comes before skeletal structures, so every atom here is drawn
   and labeled. Tetrahedral centers use the page's own convention: two plain
   bonds in the plane of the paper, one solid wedge toward the reader and one
   dashed wedge away, with the wedge and the dash next to each other. An angle
   arc is drawn only between two plain bonds, because only those two are seen
   at their true angle; an angle between out-of-plane bonds is written as
   text instead. Lone pairs are drawn on the central atom only. */
import { atom, bond, wedge, hash, arrow, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* Screen point at math angle `deg` (0 = east, counterclockwise) and distance `len`. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const f1 = (v) => (Math.round(v * 10) / 10).toString();

/* An arc between two directions around c, drawn counterclockwise from d1 to d2. */
function arc(c, d1, d2, r, cls = 'fg-arrow') {
  const a = at(c, d1, r), b = at(c, d2, r);
  const sweep = ((d2 - d1) % 360 + 360) % 360;
  return `<path class="${cls}" d="M${f1(a.x)} ${f1(a.y)} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${f1(b.x)} ${f1(b.y)}" style="stroke-width:1.6"></path>`;
}
/* An angle: arc plus its value, placed on the bisector. */
function angle(c, d1, d2, r, s, opts = {}) {
  let sweep = ((d2 - d1) % 360 + 360) % 360;
  const mid = d1 + sweep / 2;
  const p = at(c, mid, r + (opts.gap ?? 13));
  return arc(c, d1, d2, r) + text(p.x + (opts.dx ?? 0), p.y + 4 + (opts.dy ?? 0), s, { cls: 'fg-tag', size: 11 });
}
/* A lone pair as a shaded lobe (the room it takes) with its two dots. */
function lobe(c, deg, opts = {}) {
  const d = opts.d ?? 27, rx = opts.rx ?? 17, ry = opts.ry ?? 13;
  const m = at(c, deg, d);
  return `<ellipse class="fg-orb" cx="${f1(m.x)}" cy="${f1(m.y)}" rx="${rx}" ry="${ry}" transform="rotate(${f1(-deg)} ${f1(m.x)} ${f1(m.y)})" fill-opacity="0.16"></ellipse>` +
    lonePair(c.x, c.y, -deg, { dist: d });
}
const lp = (c, deg, dist = 26) => lonePair(c.x, c.y, -deg, { dist });
const rOf = (l) => (l === 'H' ? 12 : String(l).length > 1 ? 15 : 14);

/* A central atom with arms. Each arm: { deg, len, kind: plain|wedge|hash|double|triple|lp|lobe, l }. */
function star(c, el, arms, opts = {}) {
  let s = '';
  const rc = opts.rc ?? 16;
  for (const a of arms) {
    if (a.kind === 'lp') { s += lp(c, a.deg, a.dist); continue; }
    if (a.kind === 'lobe') { s += lobe(c, a.deg, a); continue; }
    const e = at(c, a.deg, a.len ?? 50);
    const o = { rFrom: rc, rTo: rOf(a.l) };
    if (a.kind === 'wedge') s += wedge(c, e, { ...o, width: 10 });
    else if (a.kind === 'hash') s += hash(c, e, { ...o, width: 11, rungs: 5 });
    else s += bond(c, e, { ...o, order: a.kind === 'double' ? 2 : a.kind === 'triple' ? 3 : 1, gap: a.kind === 'triple' ? 3.4 : 4 });
    s += atom(e.x, e.y, a.l, { r: rOf(a.l) });
  }
  s += atom(c.x, c.y, el, { kind: opts.kind ?? 'hi', r: rc });
  return s;
}

/* The four-group family on one template: two plain bonds in the plane
   pointing down, and the two other corners pointing up (front and back).
   A lone pair takes an up corner in ammonia, both in water. */
function tetFamily(c, which, opts = {}) {
  const L = opts.len ?? 50;
  const half = { CH4: 54.75, NH3: 53.5, H2O: 52.25, H3O: 56.5 }[which];
  const down = [{ deg: 270 - half, len: L, l: 'H' }, { deg: 270 + half, len: L, l: 'H' }];
  const lobes = !!opts.lobes;
  const lpArm = (deg) => (lobes ? { deg, kind: 'lobe' } : { deg, kind: 'lp' });
  let arms, el;
  if (which === 'CH4') { el = 'C'; arms = [...down, { deg: 118, len: L * 0.92, kind: 'wedge', l: 'H' }, { deg: 62, len: L * 0.92, kind: 'hash', l: 'H' }]; }
  if (which === 'NH3') { el = 'N'; arms = [...down, { deg: 120, len: L * 0.92, kind: 'wedge', l: 'H' }, lpArm(58)]; }
  if (which === 'H3O') { el = 'O⁺'; arms = [...down, { deg: 120, len: L * 0.92, kind: 'wedge', l: 'H' }, lpArm(58)]; }
  if (which === 'H2O') { el = 'O'; arms = [...down, lpArm(132), lpArm(48)]; }
  const val = { CH4: '109.5°', NH3: '107°', H2O: '104.5°', H3O: '' }[which];
  let s = star(c, el, arms, { rc: which === 'H3O' ? 17 : 16 });
  if (val && !opts.noAngle) s += angle(c, 270 - half, 270 + half, Math.round(L * 0.62), val, { gap: 13 });
  return s;
}

/* ============================================================ NOTES === */

/* --------------------------------------------------- methane-not-flat ---
   The opening claim: the flat cross a Lewis structure suggests is wrong, and
   the real molecule is a tetrahedron. A faint outline joins the four H. */
function methaneReal(c, opts = {}) {
  let s = '';
  const L = 50, pts = [at(c, 215.25, L), at(c, 324.75, L), at(c, 118, L * 0.92), at(c, 62, L * 0.92)];
  const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  if (!opts.noOutline) for (const [i, j] of edges) s += `<line class="fg-dash" x1="${f1(pts[i].x)}" y1="${f1(pts[i].y)}" x2="${f1(pts[j].x)}" y2="${f1(pts[j].y)}" style="opacity:.55"></line>`;
  s += tetFamily(c, 'CH4');
  return s;
}
function methaneFlat(c) {
  let s = star(c, 'C', [0, 90, 180, 270].map((deg) => ({ deg, len: 50, l: 'H' })), { kind: 'warn' });
  s += angle(c, 0, 90, 22, '90°', { gap: 12 });
  return s;
}
FIGURES.push({
  id: 'methane-not-flat',
  section: 'molecular-geometry',
  anchor: 'and every H–C–H angle is 109.5°.</p>',
  viewBox: '0 0 560 250',
  alt: 'Two drawings of methane. Left: a flat cross, carbon in the middle and four hydrogens 90 degrees apart, labeled wrong: not the real shape. Right: the real molecule, with two C–H bonds as plain lines 109.5 degrees apart, one H on a solid wedge toward the reader and one on a dashed wedge away, and a faint dashed outline joining the four hydrogens into a tetrahedron.',
  build() {
    let s = panel(14, 8, 258, 234, { kind: 'warn' }) + panel(288, 8, 258, 234);
    s += text(143, 32, 'flat cross: 90°', { cls: 'fg-lbl', size: 13 });
    s += methaneFlat(P(143, 128));
    s += text(143, 226, 'wrong: not the real shape', { cls: 'fg-tag-warn', size: 11 });
    s += text(417, 32, 'real: tetrahedron, 109.5°', { cls: 'fg-lbl', size: 13 });
    s += methaneReal(P(417, 136));
    s += text(417, 208, 'solid wedge: toward you', { cls: 'fg-tag', size: 11 });
    s += text(417, 226, 'dashed wedge: away from you', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Methane two ways. The faint dashed lines on the right join the four hydrogens into the tetrahedron.',
});

/* ------------------------------------------------------ vsepr-shapes ---
   Every row of the table, drawn with the right angles. The old figure put
   four groups on a flat plus sign at 90°; these use wedge and dash. */
const SHAPES = [
  { name: 'Linear', count: '2 groups, 0 lone pairs', f: 'CO₂',
    draw: (c) => star(c, 'C', [{ deg: 0, len: 60, kind: 'double', l: 'O' }, { deg: 180, len: 60, kind: 'double', l: 'O' }]) + angle(c, 0, 180, 32, '180°', { gap: 12 }) },
  { name: 'Trigonal planar', count: '3 groups, 0 lone pairs', f: 'BF₃',
    draw: (c) => star(c, 'B', [{ deg: 90, len: 56, l: 'F' }, { deg: 210, len: 56, l: 'F' }, { deg: 330, len: 56, l: 'F' }]) + angle(c, 210, 330, 32, '120°', { gap: 13 }) },
  { name: 'Bent', count: '3 groups, 1 lone pair', f: 'SO₂',
    draw: (c) => star(c, 'S', [{ deg: 90, kind: 'lp' }, { deg: 210, kind: 'double', len: 58, l: 'O' }, { deg: 330, kind: 'double', len: 58, l: 'O' }]) + angle(c, 210, 330, 32, '<120°', { gap: 13 }) },
  { name: 'Tetrahedral', count: '4 groups, 0 lone pairs', f: 'CH₄', draw: (c) => tetFamily(c, 'CH4', { len: 56 }) },
  { name: 'Trigonal pyramidal', count: '4 groups, 1 lone pair', f: 'NH₃', draw: (c) => tetFamily(c, 'NH3', { len: 56 }) },
  { name: 'Bent', count: '4 groups, 2 lone pairs', f: 'H₂O', draw: (c) => tetFamily(c, 'H2O', { len: 56 }) },
];
FIGURES.push({
  id: 'vsepr-shapes',
  section: 'molecular-geometry',
  anchor: '<h3>The shapes you need</h3>',
  viewBox: '0 0 760 452',
  alt: 'Six panels, one per row of the table, each with every atom labeled and the bond angle marked. Linear: O=C=O in a straight line, 180 degrees. Trigonal planar: boron with three fluorines 120 degrees apart. Bent: sulfur double-bonded to two oxygens, with one lone pair on sulfur, angle under 120 degrees. Tetrahedral: methane with two C–H bonds as plain lines 109.5 degrees apart, one H on a solid wedge and one on a dashed wedge. Trigonal pyramidal: ammonia on the same frame, with a lone pair in place of the dashed-wedge hydrogen, H–N–H 107 degrees. Bent: water on the same frame, with lone pairs in both upper corners, H–O–H 104.5 degrees.',
  build() {
    let s = '';
    SHAPES.forEach((k, i) => {
      const x = 14 + (i % 3) * 248, y = 8 + Math.floor(i / 3) * 224;
      s += panel(x, y, 236, 212);
      s += text(x + 118, y + 24, k.name, { cls: 'fg-tag', size: 11 });
      s += text(x + 118, y + 42, k.count, { cls: 'fg-sm', size: 10.5 });
      s += k.draw(P(x + 118, y + 122));
      s += text(x + 118, y + 198, k.f, { cls: 'fg-lbl', size: 13 });
    });
    return s;
  },
  caption: 'Each shape from the table, with the angle marked. Lone pairs are drawn on the central atom only. The bottom row uses one frame: two bonds in the plane pointing down, and two upper corners, one toward you and one away. Compare which upper corners hold a lone pair.',
});

/* ----------------------------------------------------- lone-pair-room ---
   Why the angle closes: a bonding pair is held between two nuclei, a lone
   pair by one, so the lone pair spreads wider. Then the three angles, with
   the lone pairs drawn as the lobes that do the squeezing. */
function roomPanels(ox, oy, stacked) {
  let s = '';
  // Bond pair vs lone pair, drawn on ammonia's nitrogen.
  const N = stacked ? P(ox + 140, oy + 84) : P(ox + 100, oy + 92), H = at(N, 0, 86);
  s += `<ellipse class="fg-orb" cx="${f1((N.x + H.x) / 2)}" cy="${f1(N.y)}" rx="30" ry="8.5" fill-opacity="0.16"></ellipse>`;
  s += bond(N, H, { rFrom: 16, rTo: 12 });
  s += atom(H.x, H.y, 'H', { r: 12 });
  s += lobe(N, 180, { d: 30, rx: 22, ry: 17 });
  s += atom(N.x, N.y, 'N', { kind: 'hi' });
  s += text(N.x - 30, N.y - 50, 'lone pair:', { cls: 'fg-tag', size: 11 });
  s += text(N.x - 30, N.y - 34, 'one nucleus, wide', { cls: 'fg-tag-mut', size: 11 });
  s += text(N.x + 45, N.y + 34, 'bonding pair:', { cls: 'fg-tag', size: 11 });
  s += text(N.x + 45, N.y + 50, 'two nuclei, narrow', { cls: 'fg-tag-mut', size: 11 });
  // The three angles.
  const row = stacked
    ? [['CH4', P(ox + 58, oy + 236)], ['NH3', P(ox + 166, oy + 236)], ['H2O', P(ox + 274, oy + 236)]]
    : [['CH4', P(ox + 300, oy + 96)], ['NH3', P(ox + 450, oy + 96)], ['H2O', P(ox + 600, oy + 96)]];
  const cap = { CH4: ['CH₄', '0 lone pairs'], NH3: ['NH₃', '1 lone pair'], H2O: ['H₂O', '2 lone pairs'] };
  for (const [w, c] of row) {
    s += tetFamily(c, w, { lobes: true, len: 46 });
    s += text(c.x, c.y + 70, cap[w][0], { cls: 'fg-lbl', size: 13 });
    s += text(c.x, c.y + 88, cap[w][1], { cls: 'fg-tag-mut', size: 11 });
  }
  return s;
}
FIGURES.push({
  id: 'lone-pair-room',
  section: 'molecular-geometry',
  anchor: 'a small quantitative prediction that the measurements confirm exactly.</div>',
  viewBox: '0 0 760 206',
  alt: 'Left: a nitrogen with an N–H bond, whose electron pair sits in a narrow shaded region between the two nuclei, and a lone pair, whose shaded region is wider and sits against the nitrogen. Right: methane, ammonia and water on the same frame with their lone pairs drawn as wide shaded lobes. The angle between the two in-plane bonds shrinks from 109.5 degrees with no lone pairs to 107 degrees with one and 104.5 degrees with two.',
  build() {
    let s = '';
    s += panel(14, 12, 214, 182);
    s += panel(240, 12, 506, 182);
    const inner = roomPanels(14, 12, false);
    return s + inner;
  },
  caption: 'Left: compare the two shaded regions around the nitrogen. Right: count the shaded lobes on each central atom, then read the angle under it.',
});

/* -------------------------------------------------- shape-at-every-atom ---
   The section's worked examples, drawn in full: every hydrogen shown, the
   tetrahedral carbons in wedge and dash, and the shape written at each
   heavy atom. */
function geoTag(x, y, a, b) {
  return text(x, y, a, { cls: 'fg-tag-good', size: 11 }) + text(x, y + 15, b, { cls: 'fg-sm', size: 10.5 });
}
FIGURES.push({
  id: 'shape-at-every-atom',
  section: 'molecular-geometry',
  anchor: 'The molecule as a whole has no single shape — it has a shape at every atom.</p>',
  viewBox: '0 0 760 300',
  alt: 'Ethanol and acetic acid drawn with every atom. In ethanol both carbons are tetrahedral, each with two hydrogens or a hydrogen and a neighbor in the plane, one hydrogen on a solid wedge and one on a dashed wedge; the oxygen has two bonds and two lone pairs and is bent, about 108 degrees. In acetic acid the CH3 carbon is tetrahedral, the carbonyl carbon is trigonal planar with its three neighbors 120 degrees apart, the carbonyl oxygen has three groups (one double bond and two lone pairs), and the OH oxygen is bent.',
  build() {
    let s = '';
    // Ethanol
    s += panel(14, 12, 360, 276);
    s += text(194, 36, 'ethanol, CH₃CH₂OH', { cls: 'fg-lbl', size: 13 });
    {
      const C1 = P(92, 170), C2 = P(170, 125), O = P(248, 170), Ho = at(O, 30, 52);
      s += bond(C1, C2, { rFrom: 16, rTo: 16 }); s += bond(C2, O, { rFrom: 16, rTo: 16 }); s += bond(O, Ho, { rFrom: 16, rTo: 12 });
      s += star(C1, 'C', [{ deg: 150, len: 46, l: 'H' }, { deg: 250, len: 44, kind: 'wedge', l: 'H' }, { deg: 292, len: 44, kind: 'hash', l: 'H' }]);
      s += star(C2, 'C', [{ deg: 112, len: 44, kind: 'wedge', l: 'H' }, { deg: 68, len: 44, kind: 'hash', l: 'H' }]);
      s += atom(Ho.x, Ho.y, 'H', { r: 12 });
      s += lp(O, 225); s += lp(O, 315);
      s += atom(O.x, O.y, 'O', { kind: 'hi' });
      s += angle(O, 30, 150, 30, '~108°', { gap: 12 });
      s += geoTag(56, 250, 'C: 4 groups', 'tetrahedral');
      s += geoTag(170, 214, 'C: 4 groups', 'tetrahedral');
      s += geoTag(300, 250, 'O: 4 groups', 'bent');
    }
    // Acetic acid
    s += panel(386, 12, 360, 276);
    s += text(566, 36, 'acetic acid, CH₃COOH', { cls: 'fg-lbl', size: 13 });
    {
      const C1 = P(462, 180), C2 = P(540, 135), Od = at(C2, 90, 54), Os = P(618, 180), Ho = at(Os, 30, 52);
      s += bond(C1, C2, { rFrom: 16, rTo: 16 }); s += bond(C2, Os, { rFrom: 16, rTo: 16 }); s += bond(Os, Ho, { rFrom: 16, rTo: 12 });
      s += bond(C2, Od, { order: 2, rFrom: 16, rTo: 15 });
      s += star(C1, 'C', [{ deg: 150, len: 46, l: 'H' }, { deg: 250, len: 44, kind: 'wedge', l: 'H' }, { deg: 292, len: 44, kind: 'hash', l: 'H' }]);
      s += atom(Od.x, Od.y, 'O', { kind: 'hi', r: 15 }); s += lp(Od, 30, 23); s += lp(Od, 150, 23);
      s += atom(Ho.x, Ho.y, 'H', { r: 12 });
      s += lp(Os, 225); s += lp(Os, 315);
      s += atom(Os.x, Os.y, 'O', { kind: 'hi' });
      s += atom(C2.x, C2.y, 'C', { kind: 'hi' });
      s += angle(C2, 210, 330, 30, '120°', { gap: 13 });
      s += geoTag(426, 260, 'C: 4 groups', 'tetrahedral');
      s += geoTag(540, 222, 'C: 3 groups', 'trigonal planar');
      s += geoTag(672, 260, 'O: 4 groups', 'bent');
      s += geoTag(652, 64, 'O: 3 groups', 'flat, like the C');
    }
    return s;
  },
  caption: 'Ethanol and acetic acid with every atom drawn and the group count written at each carbon and oxygen. The only flat center in either molecule is the carbonyl carbon of acetic acid, with the oxygen it is double-bonded to.',
  note: 'The two oxygens of acetic acid differ. The OH oxygen has two bonds and two lone pairs: four groups, bent, like water. The C=O oxygen has one double bond and two lone pairs: three groups, so its lone pairs lie in the plane of the carbonyl.',
});

/* ---------------------------------------------------------- open-faces ---
   A flat carbon has two open faces; a tetrahedral one has none. */
function openFaces(ox, oy, stacked) {
  let s = '';
  // Formaldehyde on a shaded plane, seen from slightly above.
  const C = P(ox + 150, oy + 118);
  const pl = [P(C.x - 118, C.y + 30), P(C.x + 72, C.y + 30), P(C.x + 118, C.y - 30), P(C.x - 72, C.y - 30)];
  s += `<path class="fg-panel-hi" d="M${pl.map((p) => `${f1(p.x)} ${f1(p.y)}`).join(' L')} Z"></path>`;
  const O = P(C.x + 66, C.y - 4), H1 = P(C.x - 44, C.y - 20), H2 = P(C.x - 56, C.y + 16);
  s += bond(C, O, { order: 2, rFrom: 16, rTo: 14 }); s += bond(C, H1, { rFrom: 16, rTo: 12 }); s += bond(C, H2, { rFrom: 16, rTo: 12 });
  s += atom(O.x, O.y, 'O', { r: 14 }); s += atom(H1.x, H1.y, 'H', { r: 12 }); s += atom(H2.x, H2.y, 'H', { r: 12 });
  s += atom(C.x, C.y, 'C', { kind: 'hi' });
  s += arrow(P(C.x, C.y - 84), P(C.x, C.y - 22));
  s += arrow(P(C.x, C.y + 84), P(C.x, C.y + 22));
  s += text(C.x + 10, C.y - 70, 'top face: open', { cls: 'fg-tag', size: 11, anchor: 'start' });
  s += text(C.x + 10, C.y + 80, 'bottom face: open', { cls: 'fg-tag', size: 11, anchor: 'start' });
  s += text(ox + 150, oy + 24, 'formaldehyde, H₂C=O: C has 3 groups', { cls: 'fg-lbl', size: 13 });
  // Tetrahedral carbon.
  const bx = stacked ? ox : ox + 316, by = stacked ? oy + 232 : oy;
  const T = P(bx + 150, by + 122);
  s += tetFamily(T, 'CH4', { noAngle: true });
  s += text(bx + 150, by + 24, 'methane, CH₄: C has 4 groups', { cls: 'fg-lbl', size: 13 });
  s += text(bx + 150, by + 196, 'no open face: nothing adds', { cls: 'fg-tag-warn', size: 11 });
  s += text(bx + 150, by + 212, 'unless a group leaves', { cls: 'fg-tag-warn', size: 11 });
  return s;
}
FIGURES.push({
  id: 'open-faces',
  section: 'molecular-geometry',
  anchor: 'every one of them traces back to a group count you can do in five seconds.</p>',
  viewBox: '0 0 660 240',
  alt: 'Left: formaldehyde lying on a shaded plane, its carbon bonded to an oxygen by a double bond and to two hydrogens, all in the plane. One arrow comes down onto the carbon from above and one comes up from below, labeled top face open and bottom face open. Right: methane drawn with two plain bonds, a solid wedge and a dashed wedge, labeled no open face: nothing adds unless a group leaves.',
  build() {
    return panel(14, 8, 300, 224) + panel(330, 8, 300, 224) + openFaces(14, 8, false);
  },
  caption: 'Left: the shaded plane holds all four atoms of formaldehyde, and the arrows show the two directions of approach. Right: methane, for comparison.',
});

/* ------------------------------------------------------ ethene-angles --- */
function ethene(c, s0 = '') {
  let s = s0;
  const C1 = P(c.x - 50, c.y), C2 = P(c.x + 50, c.y);
  s += bond(C1, C2, { order: 2, rFrom: 16, rTo: 16 });
  for (const [C, d1, d2] of [[C1, 121.3, 238.7], [C2, 58.7, -58.7]]) {
    for (const d of [d1, d2]) { const h = at(C, d, 50); s += bond(C, h, { rFrom: 16, rTo: 12 }); s += atom(h.x, h.y, 'H', { r: 12 }); }
  }
  s += atom(C1.x, C1.y, 'C', { kind: 'hi' }); s += atom(C2.x, C2.y, 'C', { kind: 'hi' });
  s += angle(C1, 121.3, 238.7, 30, '117°', { gap: 16 });
  s += angle(C2, 58.7, 180, 30, '121°', { gap: 12 });
  return s;
}
FIGURES.push({
  id: 'ethene-angles',
  section: 'molecular-geometry',
  anchor: 'is largely about what that costs.</div>',
  viewBox: '0 0 400 214',
  alt: 'Ethene, H2C=CH2, with all six atoms in one plane. At the left carbon the H–C–H angle is marked 117 degrees; at the right carbon the angle between a C–H bond and the C=C bond is marked 121 degrees.',
  build() {
    let s = panel(14, 8, 372, 198);
    s += text(200, 32, 'ethene, H₂C=CH₂ (all six atoms flat)', { cls: 'fg-lbl', size: 13 });
    s += ethene(P(200, 112));
    s += text(200, 190, 'the double bond takes more room than a C–H bond', { cls: 'fg-tag-mut', size: 11 });
    return s;
  },
  caption: 'The two measured angles from the note above, marked on the molecule.',
});

/* --------------------------------------------------------- beyond-four ---
   Five and six groups, with axial and equatorial marked. */
function beyond(ox, oy, stacked) {
  let s = '';
  const cells = stacked ? [P(ox, oy), P(ox, oy + 214), P(ox, oy + 428)] : [P(ox, oy), P(ox + 244, oy), P(ox + 488, oy)];
  const ax = [{ deg: 90, len: 54, l: 'Cl' }, { deg: 270, len: 54, l: 'Cl' }];
  // PCl5
  {
    const o = cells[0], c = P(o.x + 128, o.y + 112);
    s += star(c, 'P', [...ax, { deg: 180, len: 54, l: 'Cl' }, { deg: 335, len: 50, kind: 'wedge', l: 'Cl' }, { deg: 25, len: 50, kind: 'hash', l: 'Cl' }]);
    s += angle(c, 90, 180, 30, '90°', { gap: 12, dx: -2 });
    s += text(o.x + 118, o.y + 24, 'PCl₅: trigonal bipyramidal', { cls: 'fg-lbl', size: 13 });
    s += text(c.x + 22, c.y - 52, 'axial', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(c.x - 54, c.y + 30, 'equatorial', { cls: 'fg-tag-good', size: 11 });
    s += text(o.x + 118, o.y + 196, 'the 3 equatorial Cl: 120° apart', { cls: 'fg-tag-mut', size: 11 });
  }
  // SF4
  {
    const o = cells[1], c = P(o.x + 128, o.y + 112);
    s += star(c, 'S', [{ deg: 90, len: 54, l: 'F' }, { deg: 270, len: 54, l: 'F' }, { deg: 180, kind: 'lobe', d: 27, rx: 17, ry: 13 }, { deg: 335, len: 50, kind: 'wedge', l: 'F' }, { deg: 25, len: 50, kind: 'hash', l: 'F' }]);
    s += text(o.x + 118, o.y + 24, 'SF₄: seesaw', { cls: 'fg-lbl', size: 13 });
    s += text(c.x - 52, c.y + 34, 'equatorial', { cls: 'fg-tag', size: 11 });
    s += text(c.x - 52, c.y + 50, 'lone pair', { cls: 'fg-tag', size: 11 });
    s += text(o.x + 118, o.y + 196, '5 groups, 1 of them a lone pair', { cls: 'fg-tag-mut', size: 11 });
  }
  // SF6
  {
    const o = cells[2], c = P(o.x + 118, o.y + 112);
    s += star(c, 'S', [{ deg: 90, len: 54, l: 'F' }, { deg: 270, len: 54, l: 'F' }, { deg: 180, len: 54, l: 'F' }, { deg: 0, len: 54, l: 'F' }, { deg: 215, len: 46, kind: 'wedge', l: 'F' }, { deg: 35, len: 46, kind: 'hash', l: 'F' }]);
    s += angle(c, 270, 360, 30, '90°', { gap: 12 });
    s += text(o.x + 118, o.y + 24, 'SF₆: octahedral', { cls: 'fg-lbl', size: 13 });
    s += text(o.x + 118, o.y + 196, 'every F–S–F between neighbors: 90°', { cls: 'fg-tag-mut', size: 11 });
  }
  return s;
}
FIGURES.push({
  id: 'beyond-four',
  section: 'molecular-geometry',
  anchor: 'nothing in this section depends on it beyond the shapes themselves.</p>',
  viewBox: '0 0 760 220',
  alt: 'Three panels. PCl5, trigonal bipyramidal: two chlorines straight up and down, labeled axial, at 90 degrees to the three equatorial chlorines, which lie in a plane 120 degrees apart, one plain, one on a solid wedge and one on a dashed wedge. SF4, seesaw: the same frame with a lone pair in one equatorial position. SF6, octahedral: two fluorines up and down and four around the middle, one on a solid wedge and one on a dashed wedge, every neighboring pair at 90 degrees.',
  build() {
    let s = '';
    for (let i = 0; i < 3; i++) s += panel(14 + i * 244, 8, 236, 208);
    return s + beyond(14, 4, false);
  },
  caption: 'Axial positions point straight up and down; equatorial ones sit around the middle. In SF₄, find the lone pair in the middle row.',
});

/* ---------------------------------------------------- wedge-dash-rules --- */
function wdLegend(o) {
  let s = '';
  const rows = [['plain line', 'in the plane of the paper', 'plain'], ['solid wedge', 'coming toward you', 'wedge'], ['dashed wedge', 'going away from you', 'hash']];
  rows.forEach(([a, b, k], i) => {
    const y = o.y + 50 + i * 50, A = P(o.x + 22, y), B = P(o.x + 86, y);
    s += k === 'plain' ? bond(A, B, { rFrom: 0, rTo: 0 }) : k === 'wedge' ? wedge(A, B, { rFrom: 0, rTo: 0, width: 12 }) : hash(A, B, { rFrom: 0, rTo: 0, width: 13, rungs: 6 });
    s += text(o.x + 102, y - 2, a, { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(o.x + 102, y + 14, b, { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
  });
  return s;
}
function chbrclf(c, mode) {
  const H = { deg: 145, len: 50, l: 'H' }, F = { deg: 35, len: 50, l: 'F' };
  if (mode === 'good') return star(c, 'C', [H, F, { deg: 245, len: 48, kind: 'wedge', l: 'Br' }, { deg: 295, len: 48, kind: 'hash', l: 'Cl' }]);
  if (mode === 'swap') return star(c, 'C', [H, F, { deg: 245, len: 48, kind: 'hash', l: 'Br' }, { deg: 295, len: 48, kind: 'wedge', l: 'Cl' }]);
  return star(c, 'C', [{ deg: 180, len: 50, l: 'H' }, { deg: 0, len: 50, l: 'F' }, { deg: 90, len: 48, kind: 'wedge', l: 'Br' }, { deg: 270, len: 48, kind: 'hash', l: 'Cl' }], { kind: 'warn' });
}
const WD = [
  ['good', 'correct', 'wedge and dash side by side', 'fg-tag-good'],
  ['swap', 'wedge and dash swapped', 'legal: the mirror image', 'fg-tag'],
  ['bad', 'wedge and dash opposite', 'wrong: not a tetrahedron', 'fg-tag-warn'],
];
FIGURES.push({
  id: 'wedge-dash-rules',
  section: 'molecular-geometry',
  anchor: 'with the wedge and dash adjacent to each other rather than opposite.</p>',
  viewBox: '0 0 760 400',
  alt: 'Top: a key showing a plain line for a bond in the plane of the paper, a solid wedge for a bond toward you and a dashed wedge for a bond going away. Below, CHBrClF drawn three ways. Correct: H and F on plain lines in a V, Br on a solid wedge and Cl on a dashed wedge, side by side below the carbon. Swapped: Br on the dashed wedge and Cl on the solid wedge, labeled legal, the mirror image. Opposite: H and F on plain lines pointing left and right, Br on a wedge straight up and Cl on a dashed wedge straight down, labeled wrong, not a tetrahedron.',
  build() {
    let s = '';
    s += panel(14, 8, 732, 180);
    s += text(40, 32, 'the three kinds of bond line', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += wdLegend(P(40, 12)).replace(/x="(\d+)/g, (m) => m);
    // Second legend column is the example molecule in 3D words.
    s += text(560, 60, 'a tetrahedral center in', { cls: 'fg-tag-mut', size: 11 });
    s += text(560, 76, 'this style has 2 plain lines,', { cls: 'fg-tag-mut', size: 11 });
    s += text(560, 92, '1 solid wedge, 1 dashed wedge', { cls: 'fg-tag-mut', size: 11 });
    WD.forEach(([m, a, b, cls], i) => {
      const x = 14 + i * 248;
      s += panel(x, 200, 236, 192);
      s += text(x + 118, 222, a, { cls: 'fg-lbl', size: 13 });
      s += chbrclf(P(x + 118, 296), m);
      s += text(x + 118, 380, b, { cls, size: 11 });
    });
    return s;
  },
  caption: 'CHBrClF drawn three ways. Only the arrangement of the wedge and the dash changes from panel to panel.',
});

/* =========================================================== LESSON === */
/* Stacked copies, 340 wide, labels fg-lbl or fg-tag only. */

FIGURES.push({
  id: 'l-base-shapes',
  lessons: ['molecular-geometry'],
  viewBox: '0 0 340 538',
  alt: 'Three rows. CO2: O=C=O in a straight line, 2 groups, linear, 180 degrees. BF3: boron with three fluorines in a flat triangle, 3 groups, trigonal planar, 120 degrees. CH4: carbon with two H on plain lines 109.5 degrees apart, one H on a solid wedge and one on a dashed wedge, 4 groups, tetrahedral.',
  build() {
    let s = '';
    const rows = [
      [0, 'CO₂: 2 groups → linear', (c) => SHAPES[0].draw(c)],
      [1, 'BF₃: 3 groups → trigonal planar', (c) => SHAPES[1].draw(c)],
      [3, 'CH₄: 4 groups → tetrahedral', (c) => tetFamily(c, 'CH4')],
    ];
    rows.forEach(([, t, d], i) => {
      const y = 4 + i * 178;
      s += panel(4, y, 332, 170);
      s += text(170, y + 24, t, { cls: 'fg-lbl', size: 13 });
      s += d(P(170, y + (i === 0 ? 108 : i === 1 ? 106 : 102)));
    });
    return s;
  },
  caption: 'Two, three and four groups, as far apart as they can get.',
});

FIGURES.push({
  id: 'l-formaldehyde',
  lessons: ['molecular-geometry'],
  viewBox: '0 0 340 150',
  alt: 'Formaldehyde, H2C=O: a carbon with single bonds to two hydrogens and a double bond to an oxygen, which carries two lone pairs.',
  build() {
    let s = panel(4, 4, 332, 142);
    s += text(170, 26, 'formaldehyde, H₂C=O', { cls: 'fg-lbl', size: 13 });
    const C = P(150, 92), O = at(C, 0, 62);
    s += bond(C, O, { order: 2, rFrom: 16, rTo: 15 });
    s += atom(O.x, O.y, 'O', { r: 15 }); s += lp(O, 60, 23); s += lp(O, 300, 23);
    s += star(C, 'C', [{ deg: 125, len: 48, l: 'H' }, { deg: 235, len: 48, l: 'H' }]);
    return s;
  },
  caption: 'Count the groups on the carbon.',
});

FIGURES.push({
  id: 'l-methane-ammonia',
  lessons: ['molecular-geometry'],
  viewBox: '0 0 340 230',
  alt: 'Methane and ammonia on the same frame. Methane: four hydrogens, two on plain lines 109.5 degrees apart, one on a solid wedge and one on a dashed wedge; tetrahedral. Ammonia: the same frame with a lone pair in place of the dashed-wedge hydrogen; H–N–H 107 degrees; trigonal pyramidal.',
  build() {
    let s = '';
    [['CH4', 'CH₄', 'tetrahedral'], ['NH3', 'NH₃', 'trigonal pyramidal']].forEach(([w, f, n], i) => {
      const x = 4 + i * 170;
      s += panel(x, 4, 162, 222);
      s += text(x + 81, 26, f, { cls: 'fg-lbl', size: 13 });
      s += tetFamily(P(x + 81, 112), w, { len: 46 });
      s += text(x + 81, 196, '4 groups', { cls: 'fg-tag-mut', size: 11 });
      s += text(x + 81, 214, n, { cls: 'fg-tag', size: 11 });
    });
    return s;
  },
  caption: 'Same four corners. In ammonia a lone pair holds one of them.',
});

FIGURES.push({
  id: 'l-water',
  lessons: ['molecular-geometry'],
  viewBox: '0 0 340 162',
  alt: 'Water: oxygen with two hydrogens on plain lines 104.5 degrees apart and two lone pairs in the two upper corners.',
  build() {
    let s = panel(4, 4, 332, 154);
    s += text(170, 26, 'H₂O: 2 bonds + 2 lone pairs', { cls: 'fg-lbl', size: 13 });
    s += tetFamily(P(170, 90), 'H2O');
    return s;
  },
  caption: 'Water, with both lone pairs drawn.',
});

FIGURES.push({
  id: 'l-hydronium',
  lessons: ['molecular-geometry'],
  viewBox: '0 0 340 170',
  alt: 'Hydronium, H3O+: a positively charged oxygen with two hydrogens on plain lines, one on a solid wedge, and one lone pair.',
  build() {
    let s = panel(4, 4, 332, 162);
    s += text(170, 26, 'H₃O⁺: 3 bonds + 1 lone pair', { cls: 'fg-lbl', size: 13 });
    s += tetFamily(P(170, 100), 'H3O');
    return s;
  },
  caption: 'Hydronium, with its lone pair drawn.',
});

FIGURES.push({
  id: 'l-lone-pair-room',
  lessons: ['molecular-geometry'],
  viewBox: '0 0 340 344',
  alt: 'Top: a nitrogen with an N–H bond, whose pair sits in a narrow region between two nuclei, and a lone pair, whose region is wider and sits against the nitrogen. Bottom: methane, ammonia and water with lone pairs drawn as wide shaded lobes; the in-plane angle shrinks from 109.5 to 107 to 104.5 degrees.',
  build() {
    let s = panel(4, 4, 332, 148) + panel(4, 160, 332, 180);
    return s + roomPanels(4, 0, true);
  },
  caption: 'Compare the shaded regions, then read the angle under each molecule.',
});

FIGURES.push({
  id: 'l-wedge-dash',
  lessons: ['molecular-geometry'],
  viewBox: '0 0 340 590',
  alt: 'A key: plain line in the plane, solid wedge toward you, dashed wedge away from you. Then CHBrClF drawn correctly, with H and F on plain lines and Br and Cl on a solid and a dashed wedge side by side; and drawn wrongly, with the wedge straight up and the dash straight down, labeled not a tetrahedron.',
  build() {
    let s = panel(4, 4, 332, 176);
    s += wdLegend(P(20, 4));
    [['good', 'correct', 'wedge and dash side by side', 'fg-tag-good'], ['bad', 'wedge and dash opposite', 'wrong: not a tetrahedron', 'fg-tag-warn']].forEach(([m, a, b, cls], i) => {
      const y = 188 + i * 202;
      s += panel(4, y, 332, 194);
      s += text(170, y + 24, a, { cls: 'fg-lbl', size: 13 });
      s += chbrclf(P(170, y + 98), m);
      s += text(170, y + 182, b, { cls, size: 11 });
    });
    return s;
  },
  caption: 'The key, one correct center and one impossible one.',
});

FIGURES.push({
  id: 'l-beyond-four',
  lessons: ['molecular-geometry'],
  viewBox: '0 0 340 640',
  alt: 'PCl5, trigonal bipyramidal, with two axial chlorines up and down at 90 degrees to three equatorial chlorines 120 degrees apart. SF4, seesaw, the same frame with a lone pair in an equatorial position. SF6, octahedral, six fluorines with every neighboring pair at 90 degrees.',
  build() {
    let s = '';
    for (let i = 0; i < 3; i++) s += panel(4, 4 + i * 214, 332, 206);
    return s + beyond(4 + 52, 0, true);
  },
  caption: 'Five and six groups, with axial and equatorial marked.',
});

export default FIGURES;
