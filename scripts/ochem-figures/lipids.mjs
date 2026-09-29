/* Figures for the lipids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure draws one named molecule: stearic, oleic, elaidic and
   alpha-linolenic acid for the chains, tristearin for the triglyceride and
   its saponification, sodium stearate for soap, a phosphatidylcholine for the
   membrane lipid, cholesterol, testosterone and estradiol for the steroids,
   PGE2 for the prostaglandins, a beeswax ester and limonene.

   Chains are skeletal. A chain is built from bond angles, and consecutive
   bonds always differ by 60 degrees, so every vertex (the sp2 carbons of a
   C=C included) is drawn at 120 degrees. A plain zigzag leaves the two
   neighbours of any bond on opposite sides, which is what trans means; a cis
   double bond repeats the turn, which puts both neighbours on the same side
   and tilts the rest of the chain by 60 degrees. Heteroatoms are labelled, so
   every curved arrow starts at a drawn lone pair or bond.

   Lesson copies (id prefix l-) are no wider than 340, stack their panels in
   one column and use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (l) => (l === 'H' ? 11 : l.length <= 2 ? 14 : l.length <= 5 ? 4 + l.length * 4 : 4 + l.length * 3.9);
const A = (x, y, l = 'C', k) => ({ x, y, l, k, r: rad(l) });
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.l, { kind: a.l.length >= 6 && !a.k ? 'point' : a.k, r: a.r })).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const off = (p, dx, dy) => P(p.x + dx, p.y + dy);
const lp = (a, deg, extra = 7) => lonePair(a.x, a.y, deg, { dist: a.r + extra });
const lpAt = (a, deg, extra = 7) => at(a, deg, a.r + extra);
/* Point at distance d from p in screen direction deg (0 = right, 90 = down). */
const at = (p, deg, d) => P(p.x + Math.cos((deg * Math.PI) / 180) * d, p.y + Math.sin((deg * Math.PI) / 180) * d);
const dirOf = (a, b) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const sk = (a, b, cls) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, cls });
const gapArrow = (a, b) => arrow(a, b, { size: 7 });
const it = (s) => `<tspan font-style="italic">${s}</tspan>`;

/* A panel: box, title tag at the top, up to two tag lines at the bottom. */
function frameP(ox, oy, w, h, title, lines = [], kind) {
  let s = panel(ox, oy, w, h, kind ? { kind } : {});
  if (title) s += tag(ox + w / 2, oy + 20, title);
  lines.forEach((ln, i) => {
    const [t, cls] = Array.isArray(ln) ? ln : [ln, 'fg-tag'];
    s += text(ox + w / 2, oy + h - 14 - (lines.length - 1 - i) * 17, t, { cls, size: 11 });
  });
  return s;
}

/* ---- skeletal chains ---- */
/* n bonds starting at (x, y). The chain axis runs at `axis` degrees; the
   first bond leaves at axis + 30*s. Bond j joins pts[j-1] and pts[j], so if
   pts[0] is C1 of a fatty acid, bond j is the Cj–C(j+1) bond and a Δ9 double
   bond is bond 9. */
function chainPts(x, y, n, L, axis, { cis = [], s = -1 } = {}) {
  const ang = [axis + s * 30];
  let t = -60 * s;
  for (let j = 2; j <= n; j++) {
    ang.push(ang[j - 2] + t);
    t = cis.includes(j) ? t : -t;
  }
  const pts = [P(x, y)];
  for (const a of ang) pts.push(at(pts[pts.length - 1], a, L));
  return pts;
}
/* Ink for a chain: `dbl` lists double bonds, `hi` bonds drawn in the accent
   colour. The second line of a double bond sits on the side of the bond
   before it, which for a cis bond is the inside of the U. */
function chainInk(pts, { dbl = [], hi = [], cls = 'fg-bond', inset = 5, center = false } = {}) {
  let s = '';
  for (let j = 1; j < pts.length; j++) {
    const a = pts[j - 1], b = pts[j];
    const c = hi.includes(j) ? 'fg-bond-hi' : cls;
    if (dbl.includes(j) && center) s += bond(a, b, { rFrom: 0, rTo: 0, order: 2, gap: 2.8, cls: c });
    else if (dbl.includes(j)) {
      const ref = pts[j - 2] ?? pts[j + 1];
      s += ringDouble(a, b, ref, { inset, gap: 4.4, cls: c });
    } else s += bond(a, b, { rFrom: 0, rTo: 0, cls: c });
  }
  return s;
}
/* A carboxyl group on skeletal vertex c whose chain bond leaves at chainDeg.
   The C=O and the C–O(H) sit at ±120 degrees from it. */
function carboxyl(c, chainDeg, { anion = false, flip = false, L = 28, dblTop = true } = {}) {
  const d1 = chainDeg + (flip ? -120 : 120), d2 = chainDeg + (flip ? 120 : -120);
  const Od = A(at(c, dblTop ? d2 : d1, L).x, at(c, dblTop ? d2 : d1, L).y, 'O');
  const Os = A(at(c, dblTop ? d1 : d2, L).x, at(c, dblTop ? d1 : d2, L).y, anion ? 'O⁻' : 'OH', anion ? 'warn' : undefined);
  const C = { ...c, r: 0 };
  return { svg: bd(C, Od, { order: 2 }) + bd(C, Os) + draw(Od, Os), Od, Os };
}

/* ================================================== alpha-linolenic acid === */
FIGURES.push({
  id: 'fatty-acid-numbering',
  section: 'lipids',
  anchor: 'so α-linolenic acid is an ω-3 fatty acid.</p>',
  viewBox: '0 0 700 300',
  alt: 'Skeletal structure of alpha-linolenic acid: a COOH group at the lower left, a zigzag chain running right, and three cis double bonds that curl the chain up and back to the left, so the CH3 end sits above the start of the chain. Every carbon is numbered from C1, the carboxyl carbon, to C18, the CH3 carbon. The double bonds start at C9, C12 and C15. Counted from the CH3 end instead, C18 is omega-1, C17 omega-2 and C16 omega-3, so the last double bond starts at omega-3.',
  build() {
    let s = '';
    const pts = chainPts(84, 236, 17, 36, 0, { cis: [9, 12, 15], s: -1 });
    s += chainInk(pts, { dbl: [9, 12, 15], hi: [9, 12, 15] });
    const cx = carboxyl(pts[0], dirOf(pts[0], pts[1]));
    s += cx.svg;
    const side = (i, d, sign) => {
      const p = pts[i - 1];
      const prev = pts[i - 2], next = pts[i] ?? at(p, dirOf(pts[i - 2], p), 30);
      const aw = mid(prev, next), len = Math.hypot(p.x - aw.x, p.y - aw.y) || 1;
      return P(p.x + sign * ((p.x - aw.x) / len) * d, p.y + sign * ((p.y - aw.y) / len) * d);
    };
    for (let i = 1; i <= 18; i++) {
      const q = i === 1 ? at(pts[0], 30, 16) : side(i, 17, 1);
      const key = [1, 9, 12, 15, 18].includes(i);
      s += text(q.x, q.y + 4, String(i), { cls: key ? 'fg-tag' : 'fg-sm', size: key ? 11 : 10 });
    }
    for (const [i, w] of [[18, 'ω1'], [17, 'ω2'], [16, 'ω3']]) {
      const q = side(i, 22, -1);
      s += text(q.x, q.y + 4, w, { cls: 'fg-tag-warn', size: 11 });
    }
    const end = pts[17];
    s += text(end.x - 22, end.y - 30, 'ω numbers count from here:', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += text(end.x - 22, end.y - 14, 'the CH₃ carbon is ω1', { cls: 'fg-tag-warn', size: 11, anchor: 'end' });
    s += tag(40, 284, 'Δ numbers count from here: C1 is the carboxyl carbon', { anchor: 'start' });
    s += gapArrow(P(96, 262), P(170, 262));
    s += tag(430, 150, 'double bonds start at', { anchor: 'start' });
    s += tag(430, 166, 'C9, C12 and C15, all cis', { anchor: 'start' });
    return s;
  },
  caption: 'α-Linolenic acid, 18:3 <i>cis,cis,cis</i>-Δ9,12,15. The highlighted double bonds carry the Δ numbers; the ω numbers at the CH<sub>3</sub> end make the same molecule an ω-3 acid.',
});

/* ===================================================== chain packing ===== */
/* Three C18 acids drawn as they pack. Chains hang from the carboxyl end at
   the top; the double bond, where there is one, is bond 9 (C9=C10). The two
   cis chains start side by side and bend away from each other at the kink. */
FIGURES.push({
  id: 'chain-packing',
  section: 'lipids',
  anchor: 'Kinked chains cannot line up, so they touch less and melt lower.</p>',
  viewBox: '0 0 760 402',
  alt: 'Three panels of eighteen-carbon fatty acid chains hanging from their carboxyl ends. Stearic acid: five straight chains packed side by side, melting point 69 degrees C. Oleic acid: two chains that start side by side but bend apart at their cis double bonds halfway down, so their lower halves cannot touch, melting point 13 degrees C. Elaidic acid: five chains with a trans double bond halfway down that stay straight and pack like stearic acid, melting point 44 degrees C.',
  build() {
    let s = '';
    const L = 17;
    const col = (ox, title, mp, kind, draw) => {
      s += panel(ox, 40, 236, 300, kind ? { kind } : {});
      s += tag(ox + 118, 28, title);
      s += tag(ox + 118, 58, 'carboxyl ends at the top', { cls: 'fg-tag-mut' });
      draw(ox);
      s += text(ox + 118, 362, mp, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 11 });
    };
    col(8, 'stearic acid, 18:0', 'mp 69 °C: solid', null, (ox) => {
      for (let j = 0; j < 5; j++) s += chainInk(chainPts(ox + 58 + j * 30, 74, 17, L, 90));
    });
    col(262, 'oleic acid, 18:1 cis-Δ9', 'mp 13 °C: liquid', 'warn', (ox) => {
      s += chainInk(chainPts(ox + 104, 74, 17, L, 90, { cis: [9], s: 1 }), { dbl: [9], hi: [9], center: true });
      s += chainInk(chainPts(ox + 134, 74, 17, L, 90, { cis: [9], s: -1 }), { dbl: [9], hi: [9], center: true });
    });
    col(516, 'elaidic acid, 18:1 trans-Δ9', 'mp 44 °C: solid', null, (ox) => {
      for (let j = 0; j < 5; j++) s += chainInk(chainPts(ox + 58 + j * 30, 74, 17, L, 90), { dbl: [9], hi: [9], center: true });
    });
    s += rule(20, 376, 740, 376);
    s += label(380, 396, 'Same eighteen carbons in every panel; only the shape of the chain changes.');
    return s;
  },
  caption: 'Straight chains lie against their neighbors along their whole length; bent ones cannot. Compare the trans panel with the saturated one.',
  note: 'A flat drawing shows the cis bend as 60°. In a real chain the single bonds next to the double bond twist, and the overall bend is closer to 30°.',
});

FIGURES.push({
  id: 'l-chain-packing',
  lessons: ['lipids'],
  viewBox: '0 0 330 476',
  alt: 'Three stacked panels of eighteen-carbon chains lying horizontally. Stearic acid chains are straight and stacked close, mp 69 degrees C. Two oleic acid chains start side by side and bend apart at their cis double bonds, one up and one down, mp 13 degrees C. Elaidic acid chains carry a trans double bond and stay straight, mp 44 degrees C.',
  build() {
    let s = '';
    const L = 14.5;
    const row = (oy, h, title, mp, kind, draw) => {
      s += panel(6, oy, 318, h, kind ? { kind } : {});
      s += tag(14, oy + 18, title, { anchor: 'start' });
      s += tag(316, oy + 18, mp, { anchor: 'end', cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good' });
      draw(oy);
    };
    row(6, 104, 'stearic acid, 18:0', 'mp 69 °C', null, (oy) => {
      for (let j = 0; j < 4; j++) s += chainInk(chainPts(40, oy + 42 + j * 16, 17, L, 0));
    });
    row(118, 226, 'oleic acid, cis', 'mp 13 °C', 'warn', (oy) => {
      s += chainInk(chainPts(24, oy + 124, 17, L, 0, { cis: [9], s: -1 }), { dbl: [9], hi: [9], center: true });
      s += chainInk(chainPts(24, oy + 140, 17, L, 0, { cis: [9], s: 1 }), { dbl: [9], hi: [9], center: true });
    });
    row(352, 104, 'elaidic acid, trans', 'mp 44 °C', null, (oy) => {
      for (let j = 0; j < 4; j++) s += chainInk(chainPts(40, oy + 42 + j * 16, 17, L, 0), { dbl: [9], hi: [9], center: true });
    });
    s += tag(165, 472, 'COOH end at the left of each chain');
    return s;
  },
  caption: 'Straight chains stack; the cis chains bend apart.',
});

/* ============================================ partial hydrogenation ===== */
/* The half-hydrogenated state. Flat Lewis drawings: CA on the left, CB on
   the right; R and R′ are the two parts of the fatty acid chain. */
function hydCis(ox, oy) {
  const CA = A(ox + 70, oy + 80, 'C'), CB = A(ox + 130, oy + 80, 'C');
  const R = A(ox + 40, oy + 36, 'R'), R2 = A(ox + 160, oy + 36, 'R′'),
        H1 = A(ox + 40, oy + 124, 'H'), H2 = A(ox + 160, oy + 124, 'H');
  let s = bd(CA, CB, { order: 2 }) + bd(CA, R) + bd(CB, R2) + bd(CA, H1) + bd(CB, H2);
  s += draw(CA, CB, R, R2, H1, H2);
  return s;
}
function hydHalf(ox, oy) {
  const CA = A(ox + 70, oy + 80, 'C'), CB = A(ox + 130, oy + 80, 'C', 'hi');
  const R = A(ox + 40, oy + 36, 'R'), R2 = A(ox + 160, oy + 36, 'R′'),
        H1 = A(ox + 40, oy + 124, 'H'), Hn = A(ox + 26, oy + 80, 'H', 'hi'),
        H2 = A(ox + 174, oy + 80, 'H'), M = A(ox + 130, oy + 134, 'Ni', 'warn');
  let s = bd(CA, CB, { cls: 'fg-bond-hi' }) + bd(CA, R) + bd(CB, R2) + bd(CA, H1) + bd(CA, Hn) + bd(CB, H2) + bd(CB, M);
  s += draw(CA, CB, R, R2, H1, Hn, H2, M);
  return s;
}
function hydTrans(ox, oy) {
  const CA = A(ox + 70, oy + 80, 'C'), CB = A(ox + 130, oy + 80, 'C');
  const R = A(ox + 40, oy + 124, 'R'), R2 = A(ox + 160, oy + 36, 'R′'),
        H1 = A(ox + 40, oy + 36, 'H'), H2 = A(ox + 160, oy + 124, 'H');
  let s = bd(CA, CB, { order: 2 }) + bd(CA, R) + bd(CB, R2) + bd(CA, H1) + bd(CB, H2);
  s += draw(CA, CB, R, R2, H1, H2);
  return s;
}
/* A reversible step: two half-length arrows, one each way. */
function eqArrows(x1, x2, y) {
  return arrow(P(x1, y - 5), P(x2, y - 5), { size: 7 }) + arrow(P(x2, y + 5), P(x1, y + 5), { size: 7 });
}
function eqArrowsV(x, y1, y2) {
  return arrow(P(x - 5, y1), P(x - 5, y2), { size: 7 }) + arrow(P(x + 5, y2), P(x + 5, y1), { size: 7 });
}

/* A rotation mark over the C–C bond of the half-hydrogenated state. */
function rotMark(ox, oy) {
  const m = P(ox + 100, oy + 80);
  return curve(P(m.x - 16, m.y - 16), P(m.x + 16, m.y - 16), { bow: -12, muted: true, size: 6 });
}

FIGURES.push({
  id: 'partial-hydrogenation',
  section: 'lipids',
  anchor: 'If the chain rotated first, the double bond comes back trans.</p>',
  viewBox: '0 0 760 350',
  alt: 'Partial hydrogenation in three panels. A cis alkene, with the chain parts R and R-prime on the same side, picks up one hydrogen from the nickel surface. In the half-hydrogenated intermediate the left carbon has two hydrogens, the right carbon is bonded to nickel, and the carbon-carbon bond is single, so it can rotate. The surface then takes a hydrogen back and a double bond re-forms, with R and R-prime now on opposite sides: a trans alkene. Below the middle panel, a second hydrogen gives the saturated chain instead.',
  build() {
    let s = '';
    s += frameP(8, 10, 204, 214, '1 · cis alkene');
    s += hydCis(8, 34);
    s += frameP(278, 10, 204, 214, '2 · one H added', [['C–C single: it can rotate', 'fg-tag-good']]);
    s += hydHalf(278, 34);
    s += rotMark(278, 34);
    s += frameP(548, 10, 204, 214, '3 · H removed: trans');
    s += hydTrans(548, 34);
    s += eqArrows(218, 272, 114);
    s += tag(245, 94, '+ H');
    s += eqArrows(488, 542, 114);
    s += tag(515, 94, '− H');
    s += arrow(P(380, 230), P(380, 268));
    s += tag(392, 254, '+ second H', { anchor: 'start' });
    s += label(380, 292, 'R–CH₂–CH₂–R′: the saturated chain');
    s += rule(20, 310, 740, 310);
    s += text(380, 334, 'Every step on the metal surface is reversible, so a double bond can come back in either geometry.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Follow R and R′. They start on the same side of the double bond and end on opposite sides, and no H₂ has been used up.',
});

FIGURES.push({
  id: 'l-partial-hydrogenation',
  lessons: ['lipids'],
  viewBox: '0 0 304 668',
  alt: 'Three stacked panels. A cis alkene with R and R-prime on the same side gains one hydrogen from the nickel surface; the half-hydrogenated intermediate has a single carbon-carbon bond, which can rotate, and one carbon bonded to nickel; the surface takes a hydrogen back and the double bond re-forms trans, with R and R-prime on opposite sides.',
  build() {
    let s = '';
    s += frameP(50, 6, 204, 170, '1 · cis alkene');
    s += hydCis(50, 22);
    s += eqArrowsV(152, 182, 220);
    s += tag(166, 206, '+ H from the surface', { anchor: 'start' });
    s += frameP(50, 226, 204, 214, '2 · one H added', [['C–C single: it can rotate', 'fg-tag-good']]);
    s += hydHalf(50, 250);
    s += rotMark(50, 250);
    s += eqArrowsV(152, 446, 484);
    s += tag(166, 470, '− H back to the surface', { anchor: 'start' });
    s += frameP(50, 490, 204, 172, '3 · trans alkene');
    s += hydTrans(50, 508);
    return s;
  },
  caption: 'R and R′ start on the same side and end on opposite sides.',
});

/* ===================================================== triglyceride ===== */
/* Glycerol drawn as a vertical CH2–CH–CH2, one oxygen per carbon. */
FIGURES.push({
  id: 'triglyceride-formation',
  section: 'lipids',
  anchor: 'Each ester forms with loss of one water, so three waters leave in all.</p>',
  viewBox: '0 0 760 484',
  alt: 'Top: glycerol, a vertical CH2, CH, CH2 chain with an OH on each carbon, plus three molecules of stearic acid, drawn as a carboxylic acid on an eighteen-carbon zigzag chain. Arrow: minus three water. Bottom: tristearin, the same glycerol with each oxygen now bonded to the carbonyl carbon of a stearic acid, giving three ester groups, highlighted, with a seventeen-carbon zigzag tail on each.',
  build() {
    let s = '';
    // reactants
    const g = [A(70, 50, 'CH₂'), A(70, 104, 'CH'), A(70, 158, 'CH₂')];
    const go = g.map((c) => A(c.x + 52, c.y, 'OH'));
    s += bd(g[0], g[1]) + bd(g[1], g[2]);
    g.forEach((c, i) => { s += bd(c, go[i]); });
    s += draw(...g, ...go);
    s += tag(88, 196, 'glycerol');
    s += text(170, 108, '+ 3', { cls: 'fg-lbl', size: 16 });
    // one stearic acid: HO–C(=O)–chain
    const c1 = P(250, 110);
    const acid = carboxyl(c1, 0, { flip: false });
    s += acid.svg;
    const ch = chainPts(c1.x, c1.y, 17, 22, 0, { s: -1 });
    s += chainInk(ch);
    s += tag(430, 164, 'stearic acid: C1 is the carboxyl carbon');
    s += arrow(P(380, 206), P(380, 250));
    s += tag(392, 232, '− 3 H₂O', { anchor: 'start' });

    // product
    const G = [A(70, 300, 'CH₂'), A(70, 368, 'CH'), A(70, 436, 'CH₂')];
    s += bd(G[0], G[1]) + bd(G[1], G[2]);
    for (const c of G) {
      const O = A(c.x + 46, c.y, 'O');
      const C = at(O, -30, 40);
      const Od = A(C.x, C.y - 30, 'O');
      s += bar(O.x - 18, Od.y - 16, C.x - O.x + 34, c.y - Od.y + 34, { kind: 'hi', opacity: 0.16 });
      s += bd(c, O) + bond(O, C, { rFrom: O.r, rTo: 0, cls: 'fg-bond-hi' }) + bd({ ...C, r: 0 }, Od, { order: 2 });
      s += draw(O, Od);
      s += chainInk(chainPts(C.x, C.y, 17, 22, 0, { s: 1 }));
    }
    s += draw(...G);
    s += tag(150, 470, 'three ester groups', { cls: 'fg-tag' });
    s += tag(500, 470, 'tristearin: each tail is C2–C18 of a stearic acid');
    return s;
  },
  caption: 'Each glycerol OH ends up as the single-bonded oxygen of an ester. The highlighted C–O bonds are the new ones.',
});

FIGURES.push({
  id: 'l-triglyceride',
  lessons: ['lipids'],
  viewBox: '0 0 320 372',
  alt: 'Glycerol, CH2, CH, CH2 each carrying an OH, plus three fatty acids R-COOH give a triglyceride and three water. In the triglyceride each glycerol oxygen is bonded to the carbonyl carbon of one fatty acid, so glycerol carries three ester groups, each ending in a long chain R.',
  build() {
    let s = '';
    const g = [A(46, 30, 'CH₂'), A(46, 76, 'CH'), A(46, 122, 'CH₂')];
    const go = g.map((c) => A(c.x + 46, c.y, 'OH'));
    s += bd(g[0], g[1]) + bd(g[1], g[2]);
    g.forEach((c, i) => { s += bd(c, go[i]); });
    s += draw(...g, ...go);
    s += tag(60, 160, 'glycerol');
    s += text(150, 82, '+ 3', { cls: 'fg-lbl', size: 16 });
    s += label(232, 82, 'R–COOH');
    s += tag(232, 106, 'fatty acid');
    s += arrow(P(160, 174), P(160, 210));
    s += tag(172, 196, '− 3 H₂O', { anchor: 'start' });
    const G = [A(46, 246, 'CH₂'), A(46, 294, 'CH'), A(46, 342, 'CH₂')];
    s += bd(G[0], G[1]) + bd(G[1], G[2]);
    for (const c of G) {
      const O = A(c.x + 46, c.y, 'O'), C = A(c.x + 96, c.y, 'C', 'hi'), Od = A(c.x + 96, c.y - 32, 'O'), R = A(c.x + 146, c.y, 'R');
      s += bd(c, O) + bd(O, C, { cls: 'fg-bond-hi' }) + bd(C, Od, { order: 2 }) + bd(C, R);
      s += draw(O, C, Od, R);
    }
    s += draw(...G);
    s += tag(250, 366, 'triglyceride: three esters');
    return s;
  },
  caption: 'Each glycerol OH becomes the single-bonded O of an ester. The highlighted C–O bonds are new.',
});

/* =================================================== saponification ===== */
/* One of the three esters of a triglyceride. R is the rest of the fatty acid
   chain (C17H35 for stearic acid); CH2 leads back into glycerol. */
const PW = 316, PH = 226;

function s1(ox, oy) {
  const B = A(ox + 40, oy + 66, 'HO⁻', 'warn');
  const C = A(ox + 130, oy + 104, 'C', 'hi'), O = A(ox + 130, oy + 52, 'O'),
        R = A(ox + 76, oy + 134, 'R'), Oe = A(ox + 190, oy + 134, 'O'), G = A(ox + 252, oy + 104, 'CH₂');
  let s = frameP(ox, oy, PW, PH, '1 · hydroxide adds to the C=O carbon', ['the C=O π electrons move onto O']);
  s += bd(C, O, { order: 2 }) + bd(C, R) + bd(C, Oe) + bd(Oe, G);
  s += lp(O, -160, 5) + lp(O, -20, 5) + lp(B, 0, 4) + lp(B, -90, 3) + lp(B, 90, 3) + lp(Oe, 70, 5) + lp(Oe, 130, 5);
  s += draw(B, C, O, R, Oe, G);
  s += tag(ox + 252, oy + 130, 'to glycerol');
  s += curve(off(lpAt(B, 0, 4), 4, 0), off(C, -16, -6), { bow: 16 });
  s += curve(mid(C, O), off(O, 17, 4), { bow: -10 });
  return s;
}
function s2(ox, oy) {
  const C = A(ox + 140, oy + 108, 'C', 'hi'), O = A(ox + 140, oy + 52, 'O⁻', 'warn'),
        OH = A(ox + 82, oy + 90, 'OH'), R = A(ox + 104, oy + 160, 'R'),
        Oe = A(ox + 196, oy + 142, 'O'), G = A(ox + 258, oy + 142, 'CH₂');
  let s = frameP(ox, oy, PW, PH, '2 · the intermediate collapses', ['the C–O bond to glycerol breaks']);
  s += bd(C, O) + bd(C, OH) + bd(C, R) + bd(C, Oe, { cls: 'fg-bond-hi' }) + bd(Oe, G);
  s += lp(O, 180, 5) + lp(O, -90, 5) + lp(O, 0, 5) + lp(Oe, -60, 5) + lp(Oe, -120, 5);
  s += draw(C, O, OH, R, Oe, G);
  s += curve(off(lpAt(O, 0, 5), 2, 6), mid(C, O, 0.5), { bow: -12 });
  s += curve(mid(C, Oe), off(Oe, 0, 20), { bow: 16 });
  s += tag(ox + 262, oy + 70, 'tetrahedral');
  s += tag(ox + 262, oy + 86, 'intermediate');
  return s;
}
function s3(ox, oy) {
  const C = A(ox + 84, oy + 104, 'C'), O = A(ox + 84, oy + 52, 'O'), R = A(ox + 34, oy + 134, 'R'),
        Oa = A(ox + 136, oy + 134, 'O'), H = A(ox + 180, oy + 108, 'H', 'warn');
  const Ox = A(ox + 232, oy + 134, 'O⁻', 'warn'), G = A(ox + 282, oy + 104, 'CH₂');
  let s = frameP(ox, oy, PW, PH, '3 · the alkoxide takes the acid’s proton', [['this step does not go back', 'fg-tag-good']]);
  s += bd(C, O, { order: 2 }) + bd(C, R) + bd(C, Oa) + bd(Oa, H) + bd(Ox, G);
  s += lp(O, -160, 5) + lp(O, -20, 5) + lp(Oa, 60, 5) + lp(Oa, 120, 5);
  s += lp(Ox, 0, 5) + lp(Ox, 90, 5) + lp(Ox, 200, 5);
  s += draw(C, O, R, Oa, H, Ox, G);
  s += curve(lpAt(Ox, 200, 5), off(H, 10, 12), { bow: -14 });
  s += curve(mid(Oa, H), off(Oa, 2, -19), { bow: 10 });
  return s;
}
function s4(ox, oy) {
  const C = A(ox + 84, oy + 100, 'C'), O = A(ox + 84, oy + 48, 'O'), R = A(ox + 34, oy + 130, 'R'),
        Oa = A(ox + 136, oy + 130, 'O⁻', 'warn');
  const Ho = A(ox + 226, oy + 100, 'HO'), G = A(ox + 282, oy + 130, 'CH₂');
  let s = frameP(ox, oy, PW, PH, '4 · a carboxylate and glycerol', ['with Na⁺: a soap; × 3 per triglyceride']);
  s += bd(C, O, { order: 2 }) + bd(C, R) + bd(C, Oa) + bd(Ho, G);
  s += lp(O, -160, 5) + lp(O, -20, 5) + lp(Oa, 90, 5) + lp(Oa, 0, 5) + lp(Oa, -60, 5);
  s += draw(C, O, R, Oa, Ho, G);
  s += tag(ox + 84, oy + 168, 'carboxylate');
  s += tag(ox + 252, oy + 168, 'glycerol');
  return s;
}

FIGURES.push({
  id: 'saponification-mechanism',
  section: 'lipids',
  anchor: 'The alkoxide then takes the proton from the new carboxylic acid.</p>',
  viewBox: '0 0 680 484',
  alt: 'Saponification of one ester group of a triglyceride in four panels. 1: a lone pair on hydroxide attacks the carbonyl carbon while the C=O pi electrons move onto oxygen. 2: in the tetrahedral intermediate, a lone pair on O-minus re-forms the C=O and the bond from carbon to the glycerol oxygen breaks, with its electrons going to that oxygen. 3: the glycerol alkoxide uses a lone pair to take the proton of the carboxylic acid, and the O-H electrons stay on the acid oxygen. 4: products, a carboxylate ion and glycerol.',
  build() {
    let s = s1(12, 10) + s2(352, 10) + s3(12, 250) + s4(352, 250);
    s += gapArrow(P(330, 124), P(350, 124)) + gapArrow(P(330, 364), P(350, 364));
    s += gapArrow(P(510, 238), P(170, 248));
    return s;
  },
  caption: 'Read the top row, then the bottom row. Each curved arrow starts at a lone pair or a bond. R is the fatty acid chain, and CH₂ leads back into glycerol.',
});

FIGURES.push({
  id: 'l-saponification-a',
  lessons: ['lipids'],
  viewBox: '0 0 340 476',
  alt: 'Hydroxide attacks the carbonyl carbon of one ester of a triglyceride, giving a tetrahedral intermediate; the intermediate then re-forms C=O and breaks the bond to the glycerol oxygen.',
  build() {
    let s = s1(12, 6) + s2(12, 244);
    s += gapArrow(P(170, 234), P(170, 244));
    return s;
  },
  caption: 'Steps 1 and 2: add, then collapse.',
});

FIGURES.push({
  id: 'l-saponification-b',
  lessons: ['lipids'],
  viewBox: '0 0 340 476',
  alt: 'The glycerol alkoxide takes the proton of the new carboxylic acid, giving a carboxylate ion and glycerol.',
  build() {
    let s = s3(12, 6) + s4(12, 244);
    s += gapArrow(P(170, 234), P(170, 244));
    return s;
  },
  caption: 'Steps 3 and 4: the proton transfer that cannot reverse.',
});

/* ========================================================= soap ========= */
/* Sodium stearate: a carboxylate on C1 of an eighteen-carbon chain. */
function stearate(x, y, L, { anion = true } = {}) {
  const pts = chainPts(x, y, 17, L, 0, { s: -1 });
  let s = chainInk(pts);
  const cx = carboxyl(pts[0], dirOf(pts[0], pts[1]), { anion, L: 26 });
  s += cx.svg;
  return { svg: s, pts, cx };
}
function micelle(cx, cy, R, n = 14) {
  let s = `<circle class="fg-fill-mut" cx="${cx}" cy="${cy}" r="${R * 0.5}" opacity="0.3"></circle>`;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360;
    const head = at(P(cx, cy), a, R);
    // tail: a zigzag running from the head in toward the centre
    const tail = chainPts(at(head, a + 180, 8).x, at(head, a + 180, 8).y, 6, 11, a + 180, { s: i % 2 ? 1 : -1 });
    s += chainInk(tail);
    s += atom(head.x, head.y, '−', { kind: 'warn', r: 8, size: 12 });
  }
  return s;
}
FIGURES.push({
  id: 'soap-micelle',
  section: 'lipids',
  anchor: 'The micelle, grease and all, stays spread through the water and rinses away.</p>',
  viewBox: '0 0 760 300',
  alt: 'Left: sodium stearate, an eighteen-carbon zigzag chain with a carboxylate, CO2 minus, at its left end, and a sodium ion beside it. The carboxylate is labeled the ionic head, which dissolves in water, and the chain the nonpolar tail, which dissolves in grease. Right: a micelle, many such molecules arranged in a circle with their charged heads on the outside facing water and their tails pointing into a central droplet of grease.',
  build() {
    let s = '';
    const m = stearate(92, 110, 20);
    s += m.svg;
    s += label(26, 70, 'Na⁺', { anchor: 'start' });
    s += bar(20, 46, 104, 118, { kind: 'warn', opacity: 0.12 });
    s += tag(72, 186, 'ionic head');
    s += tag(72, 202, 'dissolves in water', { cls: 'fg-tag-mut' });
    s += tag(260, 186, 'nonpolar tail, C2–C18');
    s += tag(260, 202, 'dissolves in grease', { cls: 'fg-tag-mut' });
    s += tag(210, 36, 'sodium stearate, a soap');
    s += micelle(610, 140, 96, 16);
    s += `<rect class="fg-panel" x="583" y="130" width="54" height="18" rx="5"></rect>`;
    s += tag(610, 143, 'grease');
    s += tag(610, 272, 'micelle: heads out, tails in');
    s += tag(470, 60, 'water', { cls: 'fg-tag-mut' });
    s += tag(740, 60, 'water', { cls: 'fg-tag-mut', anchor: 'end' });
    s += tag(470, 240, 'charged head', { cls: 'fg-tag-warn' });
    s += bond(P(500, 232), P(532, 206), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    return s;
  },
  caption: 'One molecule with a water-loving end and a water-avoiding end, and the sphere many of them form in water. Each dot on the micelle is one carboxylate head.',
});

FIGURES.push({
  id: 'l-micelle',
  lessons: ['lipids'],
  viewBox: '0 0 330 420',
  alt: 'Sodium stearate, a carboxylate head on an eighteen-carbon tail, labeled ionic head and nonpolar tail; below it, a micelle: heads around the outside facing water, tails pointing into a droplet of grease in the middle.',
  build() {
    let s = '';
    const m = stearate(56, 72, 15);
    s += m.svg;
    s += label(14, 34, 'Na⁺', { anchor: 'start' });
    s += tag(44, 128, 'ionic head');
    s += tag(200, 128, 'nonpolar tail');
    s += rule(10, 146, 320, 146);
    s += micelle(165, 276, 100, 16);
    s += `<rect class="fg-panel" x="138" y="266" width="54" height="18" rx="5"></rect>`;
    s += tag(165, 279, 'grease');
    s += tag(40, 170, 'water', { cls: 'fg-tag-mut' });
    s += tag(165, 412, 'micelle: heads out, tails in');
    return s;
  },
  caption: 'Each dot on the micelle is one carboxylate head.',
});

/* ================================================= phospholipid ========= */
/* A phosphatidylcholine: palmitic acid on glycerol C1, oleic acid on C2,
   the phosphate and choline on C3. */
function bilayer(x0, y0, n, dx, { rows = [[0, 1], [150, -1]], tail = 52 } = {}) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * dx;
    for (const [dy, dir] of rows) {
      const hy = y0 + dy;
      s += bond(P(x - 4, hy + dir * 8), P(x - 4, hy + dir * tail), { rFrom: 0, rTo: 0 });
      s += bond(P(x + 4, hy + dir * 8), P(x + 4, hy + dir * tail), { rFrom: 0, rTo: 0 });
      s += atom(x, hy, '', { kind: 'hi', r: 8 });
    }
  }
  return s;
}

FIGURES.push({
  id: 'phospholipid-bilayer',
  section: 'lipids',
  anchor: 'That bilayer is the basic structure of every cell membrane.</p>',
  viewBox: '0 0 760 440',
  alt: 'Left: a phosphatidylcholine. A glycerol backbone runs across the top: CH2, CH, CH2. From the right-hand CH2, an oxygen links to a phosphorus that carries a double-bonded O and an O-minus, and a second oxygen links the phosphorus to CH2CH2N-plus(CH3)3, the choline. From the other two glycerol carbons, ester groups hang down, each carrying a long zigzag tail: one bent at a cis double bond (oleic acid) and one straight (palmitic acid). The phosphate and choline are labeled the charged head and the chains the two nonpolar tails. Right: a bilayer, two rows of such molecules drawn as a head with two tails, tails meeting in the middle, heads facing water above and below.',
  build() {
    let s = '';
    const G1 = A(150, 120, 'CH₂'), G2 = A(240, 120, 'CH'), G3 = A(330, 120, 'CH₂');
    const Op = A(330, 72, 'O'), Pp = A(380, 72, 'P', 'warn'), Pd = A(380, 28, 'O'), Pm = A(380, 116, 'O⁻', 'warn'),
          Oc = A(430, 72, 'O');
    s += bar(306, 8, 262, 130, { kind: 'warn', opacity: 0.1 });
    s += bd(G1, G2) + bd(G2, G3) + bd(G3, Op) + bd(Op, Pp) + bd(Pp, Pd, { order: 2 }) + bd(Pp, Pm) + bd(Pp, Oc);
    s += bond(Oc, P(446, 72), { rFrom: Oc.r, rTo: 0 });
    s += text(450, 76, 'CH₂CH₂N⁺(CH₃)₃', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    // the two esters, hanging down: O, then the carbonyl carbon at 60 degrees
    // (C=O to the right), then the chain
    for (const [g, n, cis] of [[G1, 17, [9]], [G2, 15, []]]) {
      const O = A(g.x, g.y + 46, 'O');
      const C = at(O, 60, 36);
      const Od = A(C.x + 30, C.y, 'O');
      s += bd(g, O) + bond(O, C, { rFrom: O.r, rTo: 0 }) + bd({ ...C, r: 0 }, Od, { order: 2 });
      s += draw(O, Od);
      s += chainInk(chainPts(C.x, C.y, n, 16, 90, { cis, s: 1 }), { dbl: cis, hi: cis });
    }
    s += draw(G1, G2, G3, Op, Pp, Pd, Pm, Oc);
    s += tag(440, 128, 'charged head:', { cls: 'fg-tag-warn', anchor: 'start' });
    s += tag(440, 144, 'phosphate (−), choline (+)', { cls: 'fg-tag-warn', anchor: 'start' });
    s += tag(40, 250, 'oleic acid', { anchor: 'start' });
    s += tag(40, 266, '(cis kink)', { anchor: 'start' });
    s += tag(290, 330, 'palmitic acid', { anchor: 'start' });
    s += tag(190, 430, 'two nonpolar tails');
    // bilayer
    s += tag(665, 36, 'bilayer: two sheets,');
    s += tag(665, 52, 'tail to tail');
    s += panel(582, 64, 166, 340);
    s += bilayer(600, 124, 6, 26, { rows: [[0, 1], [220, -1]], tail: 104 });
    s += tag(665, 90, 'water', { cls: 'fg-tag-mut' });
    s += tag(665, 390, 'water', { cls: 'fg-tag-mut' });
    return s;
  },
  caption: 'Left, one phosphatidylcholine; right, many of them in a bilayer, each drawn as a head with two tails. The head carries a negative charge on the phosphate and a positive one on the choline nitrogen, so the molecule as a whole is neutral.',
});

FIGURES.push({
  id: 'l-bilayer',
  lessons: ['lipids'],
  viewBox: '0 0 330 380',
  alt: 'Top: one phospholipid drawn as a charged head with two tails hanging from it. Below: a bilayer, two rows of these molecules with tails meeting in the middle and heads facing water above and below.',
  build() {
    let s = '';
    s += atom(80, 40, '', { kind: 'hi', r: 11 });
    s += bond(P(74, 51), P(74, 122), { rFrom: 0, rTo: 0 });
    s += bond(P(86, 51), P(86, 122), { rFrom: 0, rTo: 0 });
    s += tag(104, 44, 'charged head', { anchor: 'start' });
    s += tag(104, 60, '(phosphate + choline)', { anchor: 'start' });
    s += tag(104, 100, 'two nonpolar tails', { anchor: 'start' });
    s += tag(104, 116, '(fatty acid chains)', { anchor: 'start' });
    s += rule(10, 140, 320, 140);
    s += bilayer(34, 190, 11, 26, { rows: [[0, 1], [150, -1]], tail: 70 });
    s += tag(165, 168, 'water', { cls: 'fg-tag-mut' });
    s += tag(165, 368, 'water', { cls: 'fg-tag-mut' });
    s += tag(165, 270, 'tails meet in the middle');
    return s;
  },
  caption: 'Two tails make each molecule a rough cylinder, and cylinders pack into a flat sheet.',
});

/* ===================================================== steroids ========= */
/* The fused 6-6-6-5 skeleton, pointy-top hexagons of circumradius r. Returns
   the seventeen skeleton vertices keyed by locant, plus the ring centres. */
function steroidCore(ax, ay, r) {
  const hex = (cx, cy) => [90, 30, -30, -90, -150, 150].map((d) => at(P(cx, cy), -d, r));
  // screen angles: -90 top, -30 upper right, 30 lower right, 90 bottom, 150 lower left, 210 upper left
  const hexS = (cx, cy) => ({ top: at(P(cx, cy), -90, r), ur: at(P(cx, cy), -30, r), lr: at(P(cx, cy), 30, r),
                             bot: at(P(cx, cy), 90, r), ll: at(P(cx, cy), 150, r), ul: at(P(cx, cy), 210, r) });
  void hex;
  const w = Math.sqrt(3) * r;
  const cA = P(ax, ay), cB = P(ax + w, ay), cC = at(cB, -60, w);
  const a = hexS(cA.x, cA.y), b = hexS(cB.x, cB.y), c = hexS(cC.x, cC.y);
  const v = { 1: a.top, 2: a.ul, 3: a.ll, 4: a.bot, 5: a.lr, 10: a.ur,
              6: b.bot, 7: b.lr, 8: b.ur, 9: b.top,
              11: c.ul, 12: c.top, 13: c.ur, 14: c.lr };
  // ring D: a regular pentagon on the C13–C14 edge, built outward (to the right)
  const e = Math.hypot(v[13].x - v[14].x, v[13].y - v[14].y);
  const m = mid(v[13], v[14]);
  const cD = P(m.x + e / (2 * Math.tan(Math.PI / 5)), m.y);
  const Rp = e / (2 * Math.sin(Math.PI / 5));
  const a13 = dirOf(cD, v[13]);
  v[17] = at(cD, a13 + 72, Rp);
  v[16] = at(cD, a13 + 144, Rp);
  v[15] = at(cD, a13 + 216, Rp);
  return { v, cA, cB, cC, cD, r };
}
const RINGS = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 10], [10, 1], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
               [9, 11], [11, 12], [12, 13], [13, 14], [14, 8], [14, 15], [15, 16], [16, 17], [17, 13]];
/* ring each bond belongs to, for placing the inner line of a double bond */
const ringOf = (k, core) => {
  const inA = [1, 2, 3, 4, 5, 10], inB = [5, 6, 7, 8, 9, 10], inC = [8, 9, 11, 12, 13, 14];
  const [p, q] = k;
  if (inA.includes(p) && inA.includes(q) && !(p === 5 && q === 10) && !(p === 10 && q === 5)) return core.cA;
  if (inB.includes(p) && inB.includes(q)) return core.cB;
  if (inC.includes(p) && inC.includes(q)) return core.cC;
  return core.cD;
};
/* Draw a steroid. dbl: list of [p, q] ring double bonds. hiBonds: bonds to
   highlight. The caller adds substituents. */
function steroidInk(core, { dbl = [], hi = [] } = {}) {
  let s = '';
  const key = (p, q) => `${Math.min(p, q)}-${Math.max(p, q)}`;
  const dk = new Set(dbl.map(([p, q]) => key(p, q)));
  const hk = new Set(hi.map(([p, q]) => key(p, q)));
  for (const [p, q] of RINGS) {
    const cls = hk.has(key(p, q)) ? 'fg-bond-hi' : 'fg-bond';
    if (dk.has(key(p, q))) s += ringDouble(core.v[p], core.v[q], ringOf([p, q], core), { inset: 6, gap: 4.6, cls });
    else s += bond(core.v[p], core.v[q], { rFrom: 0, rTo: 0, cls });
  }
  return s;
}
/* A stereo or plain bond from skeleton vertex p to a labelled group or bare
   end point. kind: 'wedge' | 'hash' | 'plain'. */
function sub(core, p, deg, len, lab, kind = 'plain', o = {}) {
  const v = core.v[p];
  const end = at(v, deg, len);
  const r = lab ? rad(lab) : 0;
  let s = '';
  if (kind === 'wedge') s += wedge(v, end, { rFrom: 0, rTo: r, width: 8 });
  else if (kind === 'hash') s += hash(v, end, { rFrom: 0, rTo: r, width: 9, rungs: 5 });
  else s += bond(v, end, { rFrom: 0, rTo: r, cls: o.cls, order: o.order });
  if (lab) s += atom(end.x, end.y, lab, { kind: o.kind, r });
  return { svg: s, end };
}
const RING_OF_NUM = { 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A', 10: 'A', 6: 'B', 7: 'B', 8: 'B', 9: 'B', 11: 'C', 12: 'C', 13: 'D', 14: 'C', 15: 'D', 16: 'D', 17: 'D' };
/* Where each locant sits, as a screen angle from its carbon. Carbons on the
   outside edge take the direction away from their ring's centre; the ring
   junctions and the carbons that carry a group get a fixed free direction. */
const LOC_ANG = { 3: 90, 5: 90, 8: 30, 9: 210, 10: -120, 13: -120, 14: 210 };
const outward = (core, i) => {
  const cent = { A: core.cA, B: core.cB, C: core.cC, D: core.cD }[RING_OF_NUM[i]];
  return dirOf(cent, core.v[i]);
};
function locants(core, cls = 'fg-sm', size = 10, only) {
  let s = '';
  for (let i = 1; i <= 17; i++) {
    if (only && !only.includes(i)) continue;
    const ang = i === 17 ? outward(core, 17) - 62 : (LOC_ANG[i] ?? outward(core, i));
    const q = at(core.v[i], ang, i === 14 ? 14 : 13);
    s += text(q.x, q.y + 4, String(i), { cls, size });
  }
  return s;
}
function ringLetters(core, cls = 'fg-tag-warn') {
  const r = core.r;
  return [['A', core.cA, 0], ['B', core.cB, 0.34 * r], ['C', core.cC, -0.32 * r], ['D', core.cD, 0]]
    .map(([l, c, dy]) => text(c.x, c.y + dy + 5, l, { cls, size: 13 })).join('');
}
/* The three ring-junction hydrogens every natural steroid here shares:
   8β (toward you), 9α and 14α (away). */
function junctionH(core) {
  const r = core.r;
  return sub(core, 8, -90, r * 0.52, 'H', 'wedge').svg +
         sub(core, 9, 90, r * 0.52, 'H', 'hash').svg +
         sub(core, 14, 84, r * 0.55, 'H', 'hash').svg;
}

/* Cholesterol on a core; returns ink. */
function cholesterol(core, { numbers = true, numCls = 'fg-sm', numSize = 10, letters = true, only } = {}) {
  let s = steroidInk(core, { dbl: [[5, 6]] });
  const r = core.r;
  s += sub(core, 3, 150, r * 0.95, 'HO', 'wedge').svg;
  const m19 = sub(core, 10, -90, r * 0.85, '', 'wedge');
  const m18 = sub(core, 13, -90, r * 0.85, '', 'wedge');
  s += m19.svg + m18.svg;
  s += junctionH(core);
  const sc = sub(core, 17, outward(core, 17), r * 0.95, '', 'wedge');
  s += sc.svg;
  s += text(sc.end.x + 4, sc.end.y - 2, 'C₈H₁₇', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
  if (numbers) {
    s += locants(core, numCls, numSize, only);
    if (!only || only.includes(19)) s += text(m19.end.x, m19.end.y - 6, '19', { cls: numCls, size: numSize });
    if (!only || only.includes(18)) s += text(m18.end.x, m18.end.y - 6, '18', { cls: numCls, size: numSize });
  }
  if (letters) s += ringLetters(core);
  return { svg: s, sc };
}

FIGURES.push({
  id: 'cholesterol-nucleus',
  section: 'lipids',
  anchor: 'Every <b>steroid</b> is built on this same four-ring skeleton.</p>',
  viewBox: '0 0 760 290',
  alt: 'Cholesterol drawn skeletally: three six-membered rings, lettered A, B and C, fused in an angular row, and a five-membered ring D fused to ring C. The skeleton carbons are numbered 1 to 17, starting at the top of ring A and ending at C17 in ring D. HO sits on C3 on a wedge, a double bond joins C5 and C6, wedged methyls numbered 19 and 18 stand on C10 and C13, and an eight-carbon side chain, C8H17, leaves C17 on a wedge. Hydrogens on C8 (wedge), C9 (hash) and C14 (hash) are shown.',
  build() {
    let s = '';
    const core = steroidCore(230, 190, 38);
    const ch = cholesterol(core);
    s = ch.svg;
    s += tag(ch.sc.end.x + 4, ch.sc.end.y + 16, 'side chain, C20–C27', { anchor: 'start' });
    s += tag(600, 250, 'cholesterol, C₂₇H₄₆O');
    s += tag(600, 268, 'rings A–D: the steroid skeleton', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The four fused rings and the numbering every steroid shares. Wedged groups point toward you.',
  note: 'The hashed hydrogens at C9 and C14 point away from you. All of these ring-junction positions are fixed in natural steroids, which is why cholesterol, with eight stereocenters, is made as one stereoisomer.',
});

FIGURES.push({
  id: 'l-cholesterol',
  lessons: ['lipids'],
  viewBox: '0 0 330 220',
  alt: 'Cholesterol: three six-membered rings A, B and C and a five-membered ring D fused together, with HO on C3, a C5=C6 double bond, methyls on C10 and C13 and a C8H17 side chain on C17.',
  build() {
    let s = '';
    const core = steroidCore(70, 140, 30);
    s += cholesterol(core, { numCls: 'fg-tag', numSize: 11, only: [3, 5, 6, 10, 13, 17] }).svg;
    return s;
  },
  caption: 'Four fused rings, lettered A to D; a few carbons are numbered.',
});

function testosterone(core) {
  let s = steroidInk(core, { dbl: [[4, 5]] });
  const r = core.r;
  s += sub(core, 3, 150, r * 0.85, 'O', 'plain', { order: 2, kind: 'warn' }).svg;
  const m19 = sub(core, 10, -90, r * 0.85, '', 'wedge');
  s += `<g class="lip-c19">${m19.svg}</g>`;
  s += bar(m19.end.x - 12, m19.end.y - 22, 24, 22 + r * 0.85 - 4, { kind: 'warn', opacity: 0.18 });
  s += sub(core, 13, -90, r * 0.85, '', 'wedge').svg;
  s += junctionH(core);
  s += sub(core, 17, outward(core, 17), r * 0.9, 'OH', 'wedge').svg;
  return { svg: s, m19 };
}
function estradiol(core) {
  let s = steroidInk(core, { dbl: [[1, 2], [3, 4], [5, 10]], hi: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 10], [10, 1]] });
  const r = core.r;
  s += sub(core, 3, 150, r * 0.85, 'HO', 'plain', { kind: 'hi' }).svg;
  s += sub(core, 13, -90, r * 0.85, '', 'wedge').svg;
  s += junctionH(core);
  s += sub(core, 17, outward(core, 17), r * 0.9, 'OH', 'wedge').svg;
  return { svg: s };
}

FIGURES.push({
  id: 'testosterone-estradiol',
  section: 'lipids',
  anchor: 'so the ketone on C3 becomes the OH of a phenol.</p>',
  viewBox: '0 0 760 250',
  alt: 'Left: testosterone, the steroid skeleton with a ketone at C3, a C4=C5 double bond, wedged methyls on C10 and C13, and a wedged OH on C17. The methyl on C10, C19, is shaded. Arrow labeled aromatase. Right: estradiol, the same skeleton with ring A drawn as a benzene ring carrying an OH on C3, no methyl on C10, a wedged methyl on C13 and a wedged OH on C17.',
  build() {
    let s = '';
    const c1 = steroidCore(80, 160, 34);
    const t = testosterone(c1);
    s += t.svg;
    s += text(t.m19.end.x, t.m19.end.y - 8, 'C19', { cls: 'fg-tag-warn', size: 11 });
    s += ringLetters(c1, 'fg-tag-mut');
    s += tag(180, 236, 'testosterone');
    s += arrow(P(348, 140), P(418, 140));
    s += tag(383, 126, 'aromatase');
    const c2 = steroidCore(510, 160, 34);
    s += estradiol(c2).svg;
    s += ringLetters(c2, 'fg-tag-mut');
    s += tag(610, 236, 'estradiol');
    s += tag(c2.cA.x, c2.cA.y - 34 - 22, 'ring A now aromatic', { cls: 'fg-tag' });
    const oK = at(c1.v[3], 150, 34 * 0.85);
    s += tag(oK.x + 4, oK.y + 30, 'ketone on C3', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Only ring A changes. Aromatase removes C19, the methyl on C10, and makes ring A aromatic, so the C3 ketone ends up as a phenol OH. Rings B, C and D and the C17 OH are untouched.',
});

FIGURES.push({
  id: 'l-aromatase',
  lessons: ['lipids'],
  viewBox: '0 0 330 420',
  alt: 'Testosterone, with a ketone on C3 and a methyl, C19, on C10, is converted by aromatase into estradiol, where ring A is a benzene ring with an OH on C3 and there is no methyl on C10. Rings B, C and D and the C17 OH are the same in both.',
  build() {
    let s = '';
    const c1 = steroidCore(70, 110, 30);
    const t = testosterone(c1);
    s += t.svg;
    s += text(t.m19.end.x, t.m19.end.y - 8, 'C19', { cls: 'fg-tag-warn', size: 11 });
    s += ringLetters(c1, 'fg-tag');
    s += tag(160, 186, 'testosterone');
    s += arrow(P(160, 196), P(160, 236));
    s += tag(172, 220, 'aromatase', { anchor: 'start' });
    const c2 = steroidCore(70, 330, 30);
    s += estradiol(c2).svg;
    s += ringLetters(c2, 'fg-tag');
    s += tag(160, 408, 'estradiol');
    return s;
  },
  caption: 'Ring A loses C19 and becomes aromatic; the C3 ketone becomes a phenol OH.',
});

/* ================================================= prostaglandin E2 ===== */
/* The ring in the usual orientation: C10 at the left, C11 lower left, C12
   lower right, C8 upper right, C9 upper left. With the ring drawn this way a
   hashed group is alpha (below the ring) and a wedged one beta, so: the
   upper chain on C8 hashed, the lower chain on C12 wedged, the C11 OH hashed.
   C15 sits at a lower vertex of the lower chain with C14 to its left, and a
   hashed OH there is the S configuration. */
FIGURES.push({
  id: 'prostaglandin-e2',
  section: 'lipids',
  anchor: 'the same kind of reaction as saponification with a different nucleophile.</div>',
  viewBox: '0 0 700 330',
  alt: 'Prostaglandin E2. A five-membered ring carries a ketone at C9 and a hashed OH at C11. From C8 a hashed bond leads to the upper chain, seven carbons with a cis double bond between C5 and C6, which rises to a COOH group at C1. From C12 a wedged bond leads to the lower chain, eight carbons with a trans double bond between C13 and C14, a hashed OH on C15, and a CH3 end at C20.',
  build() {
    let s = '';
    const cx = 130, cy = 196, rr = 36;
    const V = (d) => P(cx + rr * Math.cos((d * Math.PI) / 180), cy - rr * Math.sin((d * Math.PI) / 180));
    const C10 = V(180), C11 = V(252), C12 = V(324), C8 = V(36), C9 = V(108);
    const ring = [C10, C11, C12, C8, C9];
    for (let i = 0; i < 5; i++) s += bond(ring[i], ring[(i + 1) % 5], { rFrom: 0, rTo: 0 });
    const ctr = P(cx, cy);
    // C9 ketone, pointing out of the ring
    const o9 = at(C9, dirOf(ctr, C9), 38);
    const O9 = A(o9.x, o9.y, 'O');
    s += bd({ ...C9, r: 0 }, O9, { order: 2 }) + draw(O9);
    // C11 OH, hashed, pointing out of the ring
    const o11 = at(C11, dirOf(ctr, C11), 38);
    s += hash(C11, o11, { rFrom: 0, rTo: 14, width: 9, rungs: 4 }) + atom(o11.x, o11.y, 'HO', { r: 14 });
    // upper chain: C8 -> C7 ... C1, first bond hashed, cis C6=C5
    const up = chainPts(C8.x, C8.y, 7, 34, 0, { cis: [3], s: -1 });
    s += hash(up[0], up[1], { rFrom: 0, rTo: 0, width: 9, rungs: 4 });
    s += chainInk(up.slice(1), { dbl: [2] });
    const cO = carboxyl(up[7], dirOf(up[7], up[6]), { L: 28 });
    s += cO.svg;
    // lower chain: C12 -> C13 ... C20, first bond wedged, trans C13=C14
    const lo = chainPts(C12.x, C12.y, 9, 34, 0, { s: 1 });
    s += wedge(lo[0], lo[1], { rFrom: 0, rTo: 0, width: 8 });
    s += chainInk(lo.slice(1), { dbl: [1] });
    const o15 = at(lo[3], 90, 38);
    s += hash(lo[3], o15, { rFrom: 0, rTo: 14, width: 9, rungs: 4 }) + atom(o15.x, o15.y, 'OH', { r: 14 });
    // locants
    const nt = (q, n, key) => text(q.x, q.y + 4, String(n), { cls: key ? 'fg-tag' : 'fg-sm', size: key ? 11 : 10 });
    s += nt(at(C10, 180, 13), 10) + nt(at(C9, 20, 14), 9) + nt(at(C11, 0, 14), 11);
    s += nt(at(C8, 200, 14), 8) + nt(at(C12, 160, 14), 12);
    const chainNum = (pts, i, n, key) => {
      const p = pts[i], prev = pts[i - 1], next = pts[i + 1] ?? at(p, dirOf(prev, p), 30);
      const aw = mid(prev, next), d = Math.hypot(p.x - aw.x, p.y - aw.y) || 1;
      return nt(P(p.x + ((p.x - aw.x) / d) * 14, p.y + ((p.y - aw.y) / d) * 14), n, key);
    };
    [7, 6, 5, 4, 3, 2].forEach((n, k) => { s += chainNum(up, k + 1, n); });
    s += nt(at(up[7], dirOf(up[6], up[7]), 16), 1, true);
    [13, 14, 16, 17, 18, 19].forEach((n) => { s += chainNum(lo, n - 12, n); });
    s += nt(at(lo[3], 20, 16), 15);
    s += nt(at(lo[8], dirOf(lo[7], lo[8]), 16), 20, true);
    s += tag(cx, 290, 'five-membered ring');
    s += tag(420, 40, 'upper chain: cis C5=C6, COOH at C1', { anchor: 'start' });
    s += tag(420, 310, 'lower chain: trans C13=C14, CH₃ at C20');
    s += tag(40, 40, 'PGE₂', { anchor: 'start' });
    return s;
  },
  caption: 'Prostaglandin E<sub>2</sub>, one of the prostaglandins made from arachidonic acid. All twenty carbons of the acid are still there, and C8 and C12 are now joined in a ring.',
  note: 'Hashed bonds point away from you and the wedge toward you. The two chains leave the ring on opposite faces.',
});

/* ============================================================ wax ======= */
FIGURES.push({
  id: 'wax-ester',
  section: 'lipids',
  anchor: 'one long-chain acid joined to one long-chain alcohol by a single ester.</p>',
  viewBox: '0 0 560 170',
  alt: 'A beeswax ester: C15H31, the chain of palmitic acid, bonded to a carbonyl carbon with a double-bonded O, which is bonded through a single O to C30H61, the chain of a thirty-carbon alcohol. The C15H31 side is labeled from the C16 acid and the O-C30H61 side from the C30 alcohol.',
  build() {
    let s = '';
    const C = A(220, 84, 'C', 'hi');
    const O = A(220, 38, 'O');
    const Rp = at(C, 150, 62), R = A(Rp.x - 16, Rp.y, 'C₁₅H₃₁');
    const Osp = at(C, 30, 46), Os = A(Osp.x, Osp.y, 'O');
    const R2p = at(Os, -30, 62), R2 = A(R2p.x + 18, R2p.y, 'C₃₀H₆₁');
    s += bar(184, 20, 118, 108, { kind: 'hi', opacity: 0.16 });
    s += bd(R, C) + bd(C, O, { order: 2 }) + bd(C, Os) + bd(Os, R2);
    s += draw(R, C, O, Os, R2);
    s += tag(130, 158, 'from the C16 acid (palmitic)');
    s += tag(400, 158, 'from the C30 alcohol');
    s += tag(243, 12, 'one ester group', { cls: 'fg-tag' });
    return s;
  },
  caption: 'One ester and two long saturated chains. The acid part counts sixteen carbons, including the carbonyl carbon.',
});

/* ======================================================== limonene ====== */
FIGURES.push({
  id: 'limonene-isoprene',
  section: 'lipids',
  anchor: 'and it is the usual one. The second bond closes the ring.</p>',
  viewBox: '0 0 720 290',
  alt: 'Left: isoprene, CH2=C(CH3)-CH=CH2, drawn skeletally as a four-carbon chain with a methyl branch on C2; its branch point, the end next to the branch and the far end are labeled. Right: limonene, a six-membered ring with a C1=C2 double bond, a methyl (C7) on C1 and an isopropenyl group (C8, C9, C10) on C4. One isoprene unit, C7, C1, C2, C3 and C6, is drawn in the accent color; the other, C4, C5, C8, C9 and C10, in black. The dashed C5-C6 bond, joining the far end of one unit to the carbon next to the branch in the other, is labeled head-to-tail link; the dashed C3-C4 bond is labeled ring-closing bond.',
  build() {
    let s = '';
    // isoprene: C1=C2(C5)–C3=C4
    const i1 = P(56, 170), i2 = at(i1, -30, 36), i3 = at(i2, 30, 36), i4 = at(i3, -30, 36), i5 = at(i2, -90, 36);
    s += ringDouble(i1, i2, i3, { inset: 5, gap: 4.4 }) + bond(i2, i3, { rFrom: 0, rTo: 0 }) + ringDouble(i3, i4, i2, { inset: 5, gap: 4.4 });
    s += bond(i2, i5, { rFrom: 0, rTo: 0 });
    s += tag(i2.x + 36, i2.y - 50, 'branch point', { anchor: 'start' });
    s += bond(P(i2.x + 34, i2.y - 46), P(i2.x + 6, i2.y - 8), { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
    s += tag(i1.x, i1.y + 24, 'end next to');
    s += tag(i1.x, i1.y + 38, 'the branch');
    s += tag(i4.x + 6, i4.y - 14, 'far end');
    s += tag(112, 270, 'isoprene, C₅H₈');

    // limonene
    const cx = 470, cy = 132, r = 40;
    const hx = (d) => at(P(cx, cy), d, r);
    const L1 = hx(-90), L2 = hx(-30), L3 = hx(30), L4 = hx(90), L5 = hx(150), L6 = hx(210);
    const L7 = at(L1, -90, 40), L8 = at(L4, 90, 40), L9 = at(L8, 150, 40), L10 = at(L8, 30, 40);
    const U1 = 'fg-bond-hi';
    s += bond(L7, L1, { rFrom: 0, rTo: 0, cls: U1 });
    s += ringDouble(L1, L2, P(cx, cy), { inset: 6, gap: 4.6, cls: U1 });
    s += bond(L2, L3, { rFrom: 0, rTo: 0, cls: U1 });
    s += bond(L1, L6, { rFrom: 0, rTo: 0, cls: U1 });
    s += bond(L4, L5, { rFrom: 0, rTo: 0 });
    s += bond(L4, L8, { rFrom: 0, rTo: 0 });
    s += ringDouble(L8, L9, L10, { inset: 5, gap: 4.4 });
    s += bond(L8, L10, { rFrom: 0, rTo: 0 });
    s += `<line class="fg-dash-hi" x1="${L5.x}" y1="${L5.y}" x2="${L6.x}" y2="${L6.y}"></line>`;
    s += `<line class="fg-dash-hi" x1="${L3.x}" y1="${L3.y}" x2="${L4.x}" y2="${L4.y}"></line>`;
    const num = (p, n, deg) => { const q = at(p, deg, 14); return text(q.x, q.y + 4, String(n), { cls: 'fg-sm', size: 10 }); };
    s += num(L1, 1, -150) + num(L2, 2, -30) + num(L3, 3, 20) + num(L4, 4, 20) + num(L5, 5, 160) + num(L6, 6, 200) + num(L7, 7, 0);
    s += num(L8, 8, 180) + num(L9, 9, 180) + num(L10, 10, 0);
    s += tag(L5.x - 26, (L5.y + L6.y) / 2 - 4, 'head-to-tail link', { anchor: 'end', cls: 'fg-tag-good' });
    s += tag(L5.x - 26, (L5.y + L6.y) / 2 + 12, '(C5–C6)', { anchor: 'end', cls: 'fg-tag-good' });
    s += tag(L3.x + 24, (L3.y + L4.y) / 2 + 4, 'ring-closing bond (C3–C4)', { anchor: 'start', cls: 'fg-tag-good' });
    s += tag(610, 70, 'unit 1, in color:', { anchor: 'start' });
    s += tag(610, 86, 'C1, C2, C3, C6, C7', { anchor: 'start', cls: 'fg-tag-mut' });
    s += tag(560, 236, 'unit 2, in black:', { anchor: 'start' });
    s += tag(560, 252, 'C4, C5, C8, C9, C10', { anchor: 'start', cls: 'fg-tag-mut' });
    s += tag(470, 284, 'limonene, C₁₀H₁₆');
    return s;
  },
  caption: 'Two five-carbon units, each with the branched skeleton of isoprene. The dashed bonds join them.',
});

FIGURES.push({
  id: 'l-stearic-acid',
  lessons: ['lipids'],
  viewBox: '0 0 330 150',
  alt: 'Stearic acid: a COOH group at the left end of an eighteen-carbon zigzag chain. C1, the carboxyl carbon, and C18, the CH3 end, are labeled. The COOH is labeled the polar end and the chain the nonpolar part.',
  build() {
    let s = '';
    const pts = chainPts(56, 78, 17, 15, 0, { s: -1 });
    s += chainInk(pts);
    const cx = carboxyl(pts[0], dirOf(pts[0], pts[1]), { L: 24 });
    s += cx.svg;
    s += tag(pts[0].x + 4, pts[0].y + 22, 'C1');
    s += tag(pts[17].x, pts[17].y + 22, 'C18');
    s += tag(36, 136, 'polar COOH');
    s += tag(200, 136, 'nonpolar chain');
    return s;
  },
  caption: 'Stearic acid, eighteen carbons with no C=C.',
});

export default FIGURES;
