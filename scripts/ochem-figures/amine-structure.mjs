/* Figures for the amine-structure notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Six of them (amine-pyramid, cyclohexylamine-aniline, aniline-resonance,
   amide-resonance, ammonium-solvation and pyridine-pyrrole-orbitals) are
   also shown in the lesson, so they are drawn 340 wide with stacked panels
   and only fg-lbl / fg-tag labels. Every figure sits between markers placed
   in the prose, so the anchors below are only a fallback. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';

/* A hexagon kit. Vertex 0 is the top and the numbering runs clockwise, so 1
   and 5 are ortho, 2 and 4 meta, 3 para. Bond i joins vertex i to i + 1. */
function hexKit(R) {
  const V = (cx, cy) => {
    const v = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
    return v;
  };
  const out = (cx, cy, i, d) => {
    const v = V(cx, cy)[i];
    return P(v.x + ((v.x - cx) / R) * d, v.y + ((v.y - cy) / R) * d);
  };
  const mid = (cx, cy, i, d = 0) => {
    const v = V(cx, cy), a = v[i], b = v[(i + 1) % 6];
    const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
    const l = Math.hypot(m.x - cx, m.y - cy);
    return P(m.x + ((m.x - cx) / l) * d, m.y + ((m.y - cy) / l) * d);
  };
  const ring = (cx, cy, doubles) => {
    const v = V(cx, cy), c = P(cx, cy);
    let g = '';
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      if (doubles.includes(i)) g += ringDouble(v[i], v[j], c, { inset: 8, gap: 4 });
      else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
    }
    return g;
  };
  const sub = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 30);
    const r = o.r ?? 16;
    return bond(V(cx, cy)[i], p, { rFrom: 0, rTo: r, order: o.order, gap: 3.4 }) +
           atom(p.x, p.y, txt, { kind: o.kind || 'plain', r });
  };
  /* A carbanion on ring vertex i: a lone pair just outside it and the minus
     sign beyond that. Returns the ink and the lone pair's position. */
  const anion = (cx, cy, i) => {
    const lp = out(cx, cy, i, 10);
    const ang = Math.atan2(lp.y - cy, lp.x - cx) * 180 / Math.PI;
    const v = V(cx, cy)[i];
    const m = out(cx, cy, i, 24);
    return {
      s: lonePair(v.x, v.y, ang, { dist: 10 }) + text(m.x, m.y + 5, '−', { cls: 'fg-warn', size: 15 }),
      lp,
    };
  };
  return { V, out, mid, ring, sub, anion };
}

/* A curly arrow from a to b that bows AWAY from point c. */
function away(a, b, c, mag = 14) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;
  const d1 = Math.hypot(mx + px * mag - c.x, my + py * mag - c.y);
  const d0 = Math.hypot(mx - c.x, my - c.y);
  return curve(a, b, { bow: d1 >= d0 ? mag : -mag, size: 7 });
}

/* A resonance arrow: one line, a head at each end. */
const resArrow = (a, b) => arrow(a, b) + arrow(b, a);
const plusSign = (x, y) => text(x, y, '+', { cls: 'fg-warn', size: 15 });
const minusSign = (x, y) => text(x, y, '−', { cls: 'fg-warn', size: 15 });
const ellipse = (cx, cy, rx, ry, cls, rot = 0) =>
  `<ellipse class="${cls}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx}" ry="${ry}"` +
  (rot ? ` transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"` : '') + '></ellipse>';
const dot = (x, y) => `<circle class="fg-lp" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.3"></circle>`;

/* A three-arm carbon drawn as C with arms to three labeled atoms, used for
   the amide, amidine and guanidine structures. Arms: top, lower left, lower
   right. Returns the positions so the caller can add arrows and charges. */
function trigonal(cx, cy, len = 46) {
  return {
    c: P(cx, cy),
    top: P(cx, cy - len),
    left: P(cx - len * 0.87, cy + len * 0.5),
    right: P(cx + len * 0.87, cy + len * 0.5),
  };
}

/* A curly arrow from a lone pair drawn up and to the right of atom n (angle
   -30) into the middle of the bond from n to c, bowing over the top. */
function pairToBond(n, c) {
  const a = -30 * Math.PI / 180;
  const start = P(n.x + Math.cos(a) * 26 - 2, n.y + Math.sin(a) * 26 - 6);
  const end = P((n.x + c.x) / 2 + 1, (n.y + c.y) / 2 - 6);
  return away(start, end, n, 14);
}

const FIGURES = [];

/* ----------------------------------------------------------------------
   1. Methylamine's pyramid, and the ion it becomes when the pair takes H+.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'amine-pyramid',
  section: 'amine-structure',
  lessons: ['amine-structure'],
  anchor: '<h3>Nitrogen&rsquo;s lone pair</h3>',
  viewBox: '0 0 340 236',
  alt: 'Left: methylamine drawn in 3-D. The nitrogen has a CH3 group straight down, one H on a wedge and one on a dash, and a lone pair pointing straight up, away from all three bonds; the bond angles are about 107 degrees. An arrow labeled plus H+ leads to the right: methylammonium ion, where the lone pair has become a fourth N–H bond, the nitrogen carries a plus charge, and the pKa is 10.6.',
  build() {
    let s = '';
    /* methylamine */
    let n = P(80, 112);
    s += bond(n, P(80, 170), { rFrom: 16, rTo: 18 });
    s += wedge(n, P(32, 142), { rFrom: 16, width: 9 });
    s += hash(n, P(128, 142), { rFrom: 16, width: 11, rungs: 4 });
    s += atom(80, 170, 'CH₃', { r: 18 });
    s += atom(32, 142, 'H'); s += atom(128, 142, 'H');
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += lonePair(n.x, n.y, -90, { dist: 24 });
    s += tag(80, 72, 'lone pair');

    /* the proton transfer */
    s += arrow(P(146, 112), P(200, 112));
    s += label(173, 100, '+ H⁺');

    /* methylammonium */
    n = P(262, 112);
    s += bond(n, P(262, 62), { rFrom: 16, cls: 'fg-bond-hi' });
    s += bond(n, P(262, 170), { rFrom: 16, rTo: 18 });
    s += wedge(n, P(214, 142), { rFrom: 16, width: 9 });
    s += hash(n, P(310, 142), { rFrom: 16, width: 11, rungs: 4 });
    s += atom(262, 62, 'H', { kind: 'hi' });
    s += atom(262, 170, 'CH₃', { r: 18 });
    s += atom(214, 142, 'H'); s += atom(310, 142, 'H');
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += plusSign(286, 98);

    s += tag(80, 210, 'methylamine');
    s += tag(80, 228, 'bond angles ≈ 107°', { cls: 'fg-tag-mut' });
    s += tag(262, 210, 'methylammonium ion');
    s += tag(262, 228, 'pKa 10.6', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Find the lone pair on the left, then find where it went on the right: it became the new N&ndash;H bond, drawn in color.',
});

/* ----------------------------------------------------------------------
   2. Diisopropylamine: a proton reaches the pair, a carbon does not.
   Schematic: the four methyls are shown as the space they fill.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'amine-crowding',
  section: 'amine-structure',
  anchor: 'Enolate Chemistry</a>',
  viewBox: '0 0 600 262',
  alt: 'Two copies of diisopropylamine, each with the nitrogen lone pair pointing up between two methyl groups whose bulk is shaded. Left: a small proton sits above the gap and a curved arrow runs from the lone pair to it; label, a proton fits, pKaH 11.1. Right: the carbon of bromoethane, carrying its own hydrogens and CH3, sits above the gap and its groups overlap the shaded methyls; label, a carbon is blocked, so the amine attacks carbon slowly.',
  build() {
    let s = '';
    const amine = (cx) => {
      let g = '';
      const n = P(cx, 150);
      const cl = P(cx - 46, 172), cr = P(cx + 46, 172);
      const ml1 = P(cx - 42, 112), ml2 = P(cx - 90, 196);
      const mr1 = P(cx + 42, 112), mr2 = P(cx + 90, 196);
      for (const m of [ml1, ml2, mr1, mr2]) g += ellipse(m.x, m.y, 21, 21, 'fg-orb-alt');
      g += bond(n, cl, { rFrom: 14, rTo: 0 }); g += bond(n, cr, { rFrom: 14, rTo: 0 });
      g += bond(cl, ml1, { rFrom: 0, rTo: 0 }); g += bond(cl, ml2, { rFrom: 0, rTo: 0 });
      g += bond(cr, mr1, { rFrom: 0, rTo: 0 }); g += bond(cr, mr2, { rFrom: 0, rTo: 0 });
      g += bond(n, P(cx, 204), { rFrom: 14, rTo: 13 });
      g += atom(cx, 204, 'H', { r: 13 });
      g += atom(n.x, n.y, 'N', { kind: 'hi', r: 14 });
      g += lonePair(n.x, n.y, -90, { dist: 22 });
      g += text(ml1.x - 22, ml1.y - 22, 'CH₃', { cls: 'fg-tag-mut', anchor: 'end' });
      return g;
    };
    /* left: the proton */
    s += tag(140, 24, 'A PROTON FITS');
    s += amine(140);
    s += atom(140, 70, 'H⁺', { kind: 'hi', r: 12 });
    s += curve(P(146, 124), P(146, 84), { bow: -10, size: 7 });
    s += tag(140, 236, 'pKaH 11.1: a strong base', { cls: 'fg-tag-good' });

    /* right: a carbon with its own groups */
    s += tag(420, 24, 'A CARBON IS BLOCKED');
    s += amine(420);
    const c = P(420, 78);
    s += bond(c, P(420, 44), { rFrom: 14, rTo: 15 });
    s += bond(c, P(384, 96), { rFrom: 14, rTo: 18 });
    s += bond(c, P(456, 96), { rFrom: 14, rTo: 12 });
    s += atom(420, 44, 'Br');
    s += atom(384, 96, 'CH₃', { r: 18 });
    s += atom(456, 96, 'H', { r: 12 });
    s += atom(c.x, c.y, 'C', { kind: 'warn', r: 14 });
    s += text(496, 62, 'its groups', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(496, 76, 'hit the methyls', { cls: 'fg-tag-warn', anchor: 'start' });
    s += tag(420, 236, 'slow to attack carbon', { cls: 'fg-tag-warn' });
    s += rule(280, 36, 280, 248);
    return s;
  },
  caption: 'A schematic: the shaded circles mark the space the four methyl groups fill around the lone pair. Compare what arrives at the gap above the nitrogen on each side.',
});

/* ----------------------------------------------------------------------
   3. The acid-base extraction of an amine.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'amine-extraction',
  section: 'amine-structure',
  anchor: 'the mirror-image trick',
  viewBox: '0 0 760 262',
  alt: 'Three stages of a separation. First, one ether solution holds an amine, R–NH2, and a neutral compound. After shaking with aqueous HCl, the upper ether layer holds the neutral compound and the lower water layer holds the ammonium salt, R–NH3+ Cl−. After the water layer is drained, made basic with NaOH and shaken with fresh ether, the upper ether layer holds the free amine R–NH2 and the lower water layer holds only NaCl.',
  build() {
    let s = '';
    const W = 176, top = 58, H = 150, split = top + 68;
    const box = (x, title, upper, lower) => {
      let g = tag(x + W / 2, 40, title);
      if (lower) {
        g += panel(x, top, W, split - top, { r: 12 });
        g += panel(x, split, W, top + H - split, { kind: 'hi', r: 12 });
        g += text(x + 10, top + 18, 'ether layer (top)', { cls: 'fg-tag-mut', anchor: 'start' });
        g += text(x + 10, split + 18, 'water layer (bottom)', { cls: 'fg-tag-mut', anchor: 'start' });
        upper.forEach((t, i) => { g += label(x + W / 2, top + 42 + i * 18, t); });
        lower.forEach((t, i) => { g += label(x + W / 2, split + 44 + i * 18, t); });
      } else {
        g += panel(x, top, W, H, { r: 12 });
        g += text(x + 10, top + 18, 'ether solution', { cls: 'fg-tag-mut', anchor: 'start' });
        upper.forEach((t, i) => { g += label(x + W / 2, top + 66 + i * 22, t); });
      }
      return g;
    };
    s += box(20, 'THE MIXTURE', ['R–NH₂', '+ a neutral compound']);
    s += box(292, 'AFTER SHAKING WITH HCl(aq)', ['neutral compound'], ['R–NH₃⁺ Cl⁻']);
    s += box(564, 'AFTER NaOH, THEN FRESH ETHER', ['R–NH₂'], ['Na⁺ Cl⁻ only']);
    s += arrow(P(204, 133), P(284, 133));
    s += tag(244, 120, 'HCl(aq)');
    s += arrow(P(476, 133), P(556, 133));
    s += tag(516, 120, 'NaOH(aq)');
    s += tag(516, 154, 'added to the', { cls: 'fg-tag-mut' });
    s += tag(516, 168, 'water layer', { cls: 'fg-tag-mut' });
    s += tag(380, 236, 'the salt is ionic, so it moves to the water', { cls: 'fg-tag-good' });
    s += tag(652, 236, 'the free amine returns to ether', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Follow the amine from left to right: it changes layer each time it gains or loses the proton.',
});

/* ----------------------------------------------------------------------
   4. Nitrogen inversion, and why a quaternary ion cannot do it.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'nitrogen-inversion',
  section: 'amine-structure',
  anchor: 'cannot invert and is a genuine stereocenter.</div>',
  viewBox: '0 0 760 400',
  alt: 'A pyramidal amine with groups a, b and c flips through a planar transition state, in brackets, to its mirror image; the lone pair points up in the first form and is in a p orbital in the planar one. Below, in a shaded panel, a quaternary ammonium ion with four groups a, b, c and d and a plus charge has no lone pair and cannot flip.',
  build() {
    let s = '';
    const equilibrium = (x1, x2, y) => arrow(P(x1, y - 7), P(x2, y - 7), { muted: true }) + arrow(P(x2, y + 7), P(x1, y + 7), { muted: true });

    /* left pyramid */
    let n = P(118, 140);
    s += bond(n, P(118, 198));
    s += wedge(n, P(64, 108));
    s += hash(n, P(172, 108));
    s += atom(118, 198, 'a'); s += atom(64, 108, 'b'); s += atom(172, 108, 'c');
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += lonePair(n.x, n.y, 270, { dist: 26 });
    s += text(118, 244, 'one pyramidal form', { cls: 'fg-tag-good' });

    s += equilibrium(206, 296, 140);

    /* planar transition state, in brackets */
    s += rule(316, 62, 316, 218); s += rule(316, 62, 330, 62); s += rule(316, 218, 330, 218);
    s += rule(492, 62, 492, 218); s += rule(478, 62, 492, 62); s += rule(478, 218, 492, 218);
    s += text(502, 74, '‡', { cls: 'fg-warn', size: 15 });
    n = P(404, 140);
    s += bond(n, P(404, 84));
    s += bond(n, P(350, 178));
    s += bond(n, P(458, 178));
    s += atom(404, 84, 'b'); s += atom(350, 178, 'a'); s += atom(458, 178, 'c');
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += text(404, 244, 'planar transition state', { cls: 'fg-tag-warn' });
    s += text(404, 262, 'the pair is in a p orbital, perpendicular to the page', { cls: 'fg-sm' });

    s += equilibrium(512, 602, 140);

    /* right pyramid - the mirror image */
    n = P(660, 140);
    s += bond(n, P(660, 198));
    s += hash(n, P(606, 108));
    s += wedge(n, P(714, 108));
    s += atom(660, 198, 'a'); s += atom(606, 108, 'b'); s += atom(714, 108, 'c');
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += lonePair(n.x, n.y, 270, { dist: 26 });
    s += text(660, 244, 'its mirror image', { cls: 'fg-tag-good' });

    /* the quaternary case, which cannot do any of this */
    s += panel(24, 290, 712, 100, { kind: 'warn' });
    n = P(124, 344);
    s += bond(n, P(124, 306), { rTo: 12 });
    s += bond(n, P(80, 370), { rTo: 12 });
    s += wedge(n, P(168, 370), { rTo: 12 });
    s += hash(n, P(168, 322), { rTo: 12 });
    s += atom(124, 306, 'a', { r: 12 }); s += atom(80, 370, 'b', { r: 12 });
    s += atom(168, 370, 'c', { r: 12 }); s += atom(168, 322, 'd', { r: 12 });
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += plusSign(100, 330);
    s += text(214, 330, 'A quaternary ammonium ion: four bonds and no lone pair.', { cls: 'fg-tag', anchor: 'start' });
    s += text(214, 350, 'There is no pair to swing through the plane, so it cannot flip.', { cls: 'fg-tag', anchor: 'start' });
    s += text(214, 370, 'With four different groups it is a real stereocenter.', { cls: 'fg-tag', anchor: 'start' });
    return s;
  },
  caption: 'Follow group b from the left pyramid to the right one. It moves from the wedge to the dash while a and c stay put, so the right-hand form is the mirror image of the left.',
});

/* ----------------------------------------------------------------------
   5. Why a water-solvated ammonium ion prefers N–H bonds.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'ammonium-solvation',
  section: 'amine-structure',
  lessons: ['amine-structure'],
  anchor: 'a rise, then a fall.</p>',
  viewBox: '0 0 340 360',
  alt: 'Top: methylammonium ion, CH3–NH3+. Each of its three N–H hydrogens has a dashed hydrogen bond to a water molecule, so three waters are held; pKaH 10.6. Bottom: trimethylammonium ion, (CH3)3NH+. It has one N–H hydrogen and one dashed hydrogen bond to one water; pKaH 9.8.',
  build() {
    let s = '';
    const at = (c, deg, len) => P(c.x + Math.cos(deg * Math.PI / 180) * len, c.y + Math.sin(deg * Math.PI / 180) * len);
    const ion = (c, hAngles, meAngles) => {
      let g = '';
      for (const d of meAngles) {
        const m = at(c, d, 52);
        g += bond(c, m, { rFrom: 16, rTo: 18 });
        g += atom(m.x, m.y, 'CH₃', { r: 18 });
      }
      for (const d of hAngles) {
        const h = at(c, d, 40), w = at(c, d, 88);
        g += bond(c, h, { rFrom: 16, rTo: 11 });
        g += `<line class="fg-dash-hi" x1="${at(c, d, 52).x.toFixed(1)}" y1="${at(c, d, 52).y.toFixed(1)}" x2="${at(c, d, 70).x.toFixed(1)}" y2="${at(c, d, 70).y.toFixed(1)}"></line>`;
        g += atom(h.x, h.y, 'H', { r: 11 });
        g += atom(w.x, w.y, 'OH₂', { r: 18, kind: 'hi' });
      }
      g += atom(c.x, c.y, 'N', { kind: 'warn' });
      return g;
    };
    /* methylammonium: three N–H, three waters */
    s += ion(P(100, 108), [-60, 0, 60], [180]);
    s += plusSign(84, 88);
    s += text(222, 72, 'methylammonium', { cls: 'fg-tag', anchor: 'start' });
    s += text(222, 144, 'three waters held', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(222, 162, 'pKaH 10.6', { cls: 'fg-tag-good', anchor: 'start' });

    s += rule(12, 208, 328, 208);

    /* trimethylammonium: one N–H, one water */
    s += ion(P(100, 282), [0], [180, -120, 120]);
    s += plusSign(122, 262);
    s += text(222, 246, 'trimethyl-', { cls: 'fg-tag', anchor: 'start' });
    s += text(222, 262, 'ammonium', { cls: 'fg-tag', anchor: 'start' });
    s += text(222, 318, 'one water held', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(222, 336, 'pKaH 9.8', { cls: 'fg-tag-warn', anchor: 'start' });
    return s;
  },
  caption: 'Count the dashed hydrogen bonds to water around each ion. Each one needs an N&ndash;H hydrogen, and every methyl takes the place of one.',
});

/* ----------------------------------------------------------------------
   6. Cyclohexylamine against aniline.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'cyclohexylamine-aniline',
  section: 'amine-structure',
  lessons: ['amine-structure'],
  anchor: '<h3>Resonance donation',
  viewBox: '0 0 340 212',
  alt: 'Left: cyclohexylamine, an NH2 on a ring of six sp3 carbons with no double bonds; pKaH 10.7. Right: aniline, an NH2 on a benzene ring; pKaH 4.6.',
  build() {
    const K = hexKit(32);
    let s = '';
    s += K.ring(85, 118, []);
    s += K.sub(85, 118, 0, 'NH₂', { kind: 'hi', r: 17 });
    s += lonePair(85, K.out(85, 118, 0, 30).y, -90, { dist: 24 });
    s += K.ring(255, 118, [1, 3, 5]);
    s += K.sub(255, 118, 0, 'NH₂', { kind: 'warn', r: 17 });
    s += lonePair(255, K.out(255, 118, 0, 30).y, -90, { dist: 24 });
    s += tag(85, 180, 'cyclohexylamine');
    s += tag(85, 198, 'pKaH 10.7', { cls: 'fg-tag-good' });
    s += tag(255, 180, 'aniline');
    s += tag(255, 198, 'pKaH 4.6', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Same NH<sub>2</sub>, same six-carbon ring. The only difference is the three double bonds in aniline&rsquo;s ring.',
});

/* ----------------------------------------------------------------------
   7. Aniline's lone pair pushed into the ring: four contributors.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'aniline-resonance',
  section: 'amine-structure',
  lessons: ['amine-structure'],
  anchor: 'part of the pi system',
  viewBox: '0 0 340 392',
  alt: 'Four resonance contributors of aniline, read clockwise from the top left. First, the lone pair sits on the nitrogen, and curved arrows push it into the C–N bond and push a ring pi bond onto an ortho carbon. Second, the nitrogen is double-bonded to the ring and carries a plus charge, and the ortho carbon carries a lone pair and a minus charge; arrows move that pair on to the para carbon. Third, the minus charge is on the para carbon, and arrows move it to the other ortho carbon. Fourth, the minus charge is on the other ortho carbon.',
  build() {
    const R = 34, K = hexKit(R);
    let s = '';
    const A = P(85, 104), B = P(255, 104), C = P(255, 290), D = P(85, 290);
    /* NH2 on vertex 0: neutral with a lone pair, or C=N+ with no pair. */
    const topN = (c, charged) => {
      const v0 = K.V(c.x, c.y)[0], p = K.out(c.x, c.y, 0, 34);
      let g = '';
      if (charged) {
        g += bond(v0, p, { rFrom: 0, rTo: 17, order: 2, gap: 3.4 });
        g += atom(p.x, p.y, 'NH₂', { kind: 'warn', r: 17 });
        g += plusSign(p.x + 26, p.y - 8);
      } else {
        g += bond(v0, p, { rFrom: 0, rTo: 17 });
        g += atom(p.x, p.y, 'NH₂', { kind: 'hi', r: 17 });
        g += lonePair(p.x, p.y, 0, { dist: 24 });
      }
      return { g, p };
    };

    // A: pair on nitrogen
    s += K.ring(A.x, A.y, [0, 2, 4]);
    {
      const t = topN(A, false);
      s += t.g;
      s += away(P(t.p.x + 26, t.p.y + 8), P(A.x + 5, A.y - R - 9), t.p, 12);
      s += away(K.mid(A.x, A.y, 0, 4), K.out(A.x, A.y, 1, 9), A, 12);
    }
    s += tag(A.x, A.y + 72, 'pair on nitrogen');

    // B: charge on the ortho carbon (vertex 1)
    s += K.ring(B.x, B.y, [2, 4]);
    s += topN(B, true).g;
    {
      const an = K.anion(B.x, B.y, 1);
      s += an.s;
      s += away(P(an.lp.x + 2, an.lp.y + 6), K.mid(B.x, B.y, 1, 4), B, 12);
      s += away(K.mid(B.x, B.y, 2, 4), K.out(B.x, B.y, 3, 9), B, 12);
    }
    s += tag(B.x, B.y + 72, 'on an ortho carbon');

    // C: charge on the para carbon (vertex 3)
    s += K.ring(C.x, C.y, [1, 4]);
    s += topN(C, true).g;
    {
      const an = K.anion(C.x, C.y, 3);
      s += an.s;
      s += away(P(an.lp.x - 6, an.lp.y), K.mid(C.x, C.y, 3, 4), C, 12);
      s += away(K.mid(C.x, C.y, 4, 4), K.out(C.x, C.y, 5, 9), C, 12);
    }
    s += tag(C.x, C.y + 72, 'on the para carbon');

    // D: charge on the other ortho carbon (vertex 5)
    s += K.ring(D.x, D.y, [1, 3]);
    s += topN(D, true).g;
    s += K.anion(D.x, D.y, 5).s;
    s += tag(D.x, D.y + 72, 'on the other ortho');

    s += resArrow(P(140, A.y), P(200, A.y));
    s += resArrow(P(326, 150), P(326, 234));
    s += resArrow(P(200, C.y + 40), P(140, C.y + 40));
    return s;
  },
  caption: 'Follow the arrows clockwise from the top left: each pair of arrows turns one structure into the next. In the last three, nitrogen has no lone pair left.',
});

/* ----------------------------------------------------------------------
   8. Acetamide's two contributors.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'amide-resonance',
  section: 'amine-structure',
  lessons: ['amine-structure'],
  anchor: 'essentially non-basic',
  viewBox: '0 0 340 212',
  alt: 'Acetamide, CH3–C(=O)–NH2, and its second resonance contributor. On the left, a curved arrow pushes the nitrogen lone pair into the C–N bond and a second arrow pushes the C=O pi bond onto oxygen. On the right, the C–N bond is double, the nitrogen carries a plus charge and no lone pair, and the oxygen carries three lone pairs and a minus charge.',
  build() {
    let s = '';
    /* left: acetamide */
    let t = trigonal(80, 104);
    s += bond(t.c, t.top, { rFrom: 0, rTo: 15, order: 2, gap: 3.4 });
    s += bond(t.c, t.left, { rFrom: 0, rTo: 18 });
    s += bond(t.c, t.right, { rFrom: 0, rTo: 17 });
    s += atom(t.top.x, t.top.y, 'O');
    s += lonePair(t.top.x, t.top.y, 215) + lonePair(t.top.x, t.top.y, 325);
    s += atom(t.left.x, t.left.y, 'CH₃', { r: 18 });
    s += atom(t.right.x, t.right.y, 'NH₂', { kind: 'hi', r: 17 });
    s += lonePair(t.right.x, t.right.y, -30, { dist: 24 });
    // the N pair into the C–N bond
    s += pairToBond(t.right, t.c);
    // the C=O pi bond onto oxygen
    s += away(P(t.c.x - 6, (t.c.y + t.top.y) / 2 + 4), P(t.top.x - 20, t.top.y + 6), P(t.c.x + 30, t.c.y - 20), 12);

    s += resArrow(P(160, 104), P(202, 104));

    /* right: the charge-separated contributor */
    t = trigonal(262, 104);
    s += bond(t.c, t.top, { rFrom: 0, rTo: 16 });
    s += bond(t.c, t.left, { rFrom: 0, rTo: 18 });
    s += bond(t.c, t.right, { rFrom: 0, rTo: 17, order: 2, gap: 3.4 });
    s += atom(t.top.x, t.top.y, 'O', { kind: 'warn' });
    s += lonePair(t.top.x, t.top.y, 180) + lonePair(t.top.x, t.top.y, 270) + lonePair(t.top.x, t.top.y, 0);
    s += minusSign(t.top.x + 22, t.top.y - 18);
    s += atom(t.left.x, t.left.y, 'CH₃', { r: 18 });
    s += atom(t.right.x, t.right.y, 'NH₂', { kind: 'warn', r: 17 });
    s += plusSign(t.right.x + 8, t.right.y + 32);

    s += tag(80, 180, 'acetamide');
    s += tag(80, 198, 'pair on nitrogen', { cls: 'fg-tag-mut' });
    s += tag(262, 180, 'C=N double bond');
    s += tag(262, 198, 'minus charge on oxygen', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Follow the two arrows on the left. The nitrogen pair becomes the second C&ndash;N bond, and the C=O pi electrons move onto oxygen.',
});

/* ----------------------------------------------------------------------
   9. Where strong acid puts the proton on an amide.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'amide-protonation',
  section: 'amine-structure',
  anchor: 'even less basic than that number suggests.</p>',
  viewBox: '0 0 340 356',
  alt: 'Top: acetamide protonated on oxygen, drawn as two resonance contributors. In the first, the oxygen carries the H and the plus charge, and arrows push the nitrogen lone pair into the C–N bond and the C=O pi bond onto oxygen. In the second, the C–O bond is single, the C–N bond is double and the plus charge is on nitrogen. Label: proton on O, charge shared, pKaH about −1. Bottom: acetamide protonated on nitrogen, CH3–C(=O)–NH3+, which can be drawn only one way. Label: proton on N, one structure, pKaH about −7.',
  build() {
    let s = '';
    /* O-protonated, contributor 1 */
    let t = trigonal(80, 96);
    s += bond(t.c, t.top, { rFrom: 0, rTo: 16, order: 2, gap: 3.4 });
    s += bond(t.c, t.left, { rFrom: 0, rTo: 18 });
    s += bond(t.c, t.right, { rFrom: 0, rTo: 17 });
    s += atom(t.top.x, t.top.y, 'OH', { kind: 'warn' });
    s += lonePair(t.top.x, t.top.y, 215);
    s += plusSign(t.top.x + 24, t.top.y - 12);
    s += atom(t.left.x, t.left.y, 'CH₃', { r: 18 });
    s += atom(t.right.x, t.right.y, 'NH₂', { kind: 'hi', r: 17 });
    s += lonePair(t.right.x, t.right.y, -30, { dist: 24 });
    s += pairToBond(t.right, t.c);
    s += away(P(t.c.x - 6, (t.c.y + t.top.y) / 2 + 4), P(t.top.x - 20, t.top.y + 8), P(t.c.x + 30, t.c.y - 20), 12);

    s += resArrow(P(160, 96), P(202, 96));

    /* O-protonated, contributor 2 */
    t = trigonal(262, 96);
    s += bond(t.c, t.top, { rFrom: 0, rTo: 16 });
    s += bond(t.c, t.left, { rFrom: 0, rTo: 18 });
    s += bond(t.c, t.right, { rFrom: 0, rTo: 17, order: 2, gap: 3.4 });
    s += atom(t.top.x, t.top.y, 'OH');
    s += lonePair(t.top.x, t.top.y, 200) + lonePair(t.top.x, t.top.y, 270);
    s += atom(t.left.x, t.left.y, 'CH₃', { r: 18 });
    s += atom(t.right.x, t.right.y, 'NH₂', { kind: 'warn', r: 17 });
    s += plusSign(t.right.x + 8, t.right.y + 32);

    s += tag(170, 172, 'proton on O: the charge is shared by O and N', { cls: 'fg-tag-good' });
    s += tag(170, 190, 'pKaH ≈ −1', { cls: 'fg-tag-good' });

    s += rule(12, 206, 328, 206);

    /* N-protonated */
    t = trigonal(150, 272);
    s += bond(t.c, t.top, { rFrom: 0, rTo: 15, order: 2, gap: 3.4 });
    s += bond(t.c, t.left, { rFrom: 0, rTo: 18 });
    s += bond(t.c, t.right, { rFrom: 0, rTo: 17, cls: 'fg-bond' });
    s += atom(t.top.x, t.top.y, 'O');
    s += lonePair(t.top.x, t.top.y, 215) + lonePair(t.top.x, t.top.y, 325);
    s += atom(t.left.x, t.left.y, 'CH₃', { r: 18 });
    s += atom(t.right.x, t.right.y, 'NH₃', { kind: 'warn', r: 17 });
    s += plusSign(t.right.x + 26, t.right.y - 10);
    s += text(250, 250, 'one structure', { cls: 'fg-tag-warn', anchor: 'start' });
    s += text(250, 266, 'only', { cls: 'fg-tag-warn', anchor: 'start' });
    s += tag(170, 330, 'proton on N: the pair is used up in the N–H bond', { cls: 'fg-tag-warn' });
    s += tag(170, 348, 'pKaH ≈ −7', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Count the contributors in each panel: two for the proton on oxygen, one for the proton on nitrogen.',
});

/* ----------------------------------------------------------------------
   10. Pyridine and pyrrole: where the nitrogen lone pair sits.
   Rings are drawn tilted, as if seen from slightly above; the p orbitals
   stand up and down from the ring plane.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'pyridine-pyrrole-orbitals',
  section: 'amine-structure',
  lessons: ['amine-structure'],
  anchor: '<h3>Two nitrogen heterocycles',
  viewBox: '0 0 340 474',
  alt: 'Two rings drawn tilted, with a p orbital standing up and down from every ring atom. Top, pyridine: six ring atoms, each p orbital holds one electron, six pi electrons in all. The nitrogen lone pair sits in a separate sp2 lobe that points outward in the plane of the ring, outside the pi system; pKaH 5.2. Bottom, pyrrole: five ring atoms. The four carbon p orbitals hold one electron each and the nitrogen p orbital holds two, the lone pair, making six pi electrons; the N–H bond points outward in the ring plane; pKaH about −4, measured for a proton on carbon.',
  build() {
    let s = '';
    const k = 0.5;
    const ringAtoms = (cx, cy, Rr, n, kk = k) => Array.from({ length: n }, (_, i) => {
      const th = (i * 360 / n) * Math.PI / 180;       // i = 0 is the nitrogen, on the right
      return P(cx + Rr * Math.cos(th), cy + kk * Rr * Math.sin(th));
    });
    /* Back atoms' lobes first, then the ring bonds, then the front atoms'
       lobes, so the drawing reads with depth. */
    const drawRing = (pts, nDots, cy) => {
      let back = '', front = '', bonds = '';
      pts.forEach((p, i) => {
        let g = ellipse(p.x, p.y - 17, 7, 14, 'fg-orb') + ellipse(p.x, p.y + 17, 7, 14, 'fg-orb');
        if (nDots[i] === 1) g += dot(p.x, p.y - 22);
        if (nDots[i] === 2) g += dot(p.x, p.y - 27) + dot(p.x, p.y - 19);
        if (p.y < cy - 0.5) back += g; else front += g;
      });
      pts.forEach((p, i) => { bonds += bond(p, pts[(i + 1) % pts.length], { rFrom: i === 0 ? 11 : 0, rTo: (i + 1) % pts.length === 0 ? 11 : 0 }); });
      return back + bonds + front;
    };

    /* pyridine */
    s += tag(20, 26, 'PYRIDINE', { anchor: 'start' });
    let pts = ringAtoms(128, 112, 64, 6);
    s += drawRing(pts, [1, 1, 1, 1, 1, 1], 112);
    let nAt = pts[0];
    s += ellipse(nAt.x + 30, nAt.y, 20, 8, 'fg-orb-alt');
    s += dot(nAt.x + 36, nAt.y - 3) + dot(nAt.x + 36, nAt.y + 3);
    s += atom(nAt.x, nAt.y, 'N', { kind: 'hi', r: 11 });
    s += text(nAt.x + 30, nAt.y - 16, 'sp²', { cls: 'fg-tag', anchor: 'middle' });
    s += text(pts[3].x - 12, pts[3].y - 24, 'p', { cls: 'fg-tag-mut', anchor: 'end' });
    s += tag(170, 194, 'lone pair in an sp² orbital, in the ring plane');
    s += tag(170, 211, 'not one of the six π electrons: free for H⁺');
    s += tag(170, 230, 'pKaH 5.2', { cls: 'fg-tag-good' });

    s += rule(12, 246, 328, 246);

    /* pyrrole */
    s += tag(20, 270, 'PYRROLE', { anchor: 'start' });
    pts = ringAtoms(128, 342, 58, 5, 0.66);
    s += drawRing(pts, [2, 1, 1, 1, 1], 342);
    nAt = pts[0];
    s += bond(nAt, P(nAt.x + 40, nAt.y), { rFrom: 11, rTo: 11 });
    s += atom(nAt.x + 40, nAt.y, 'H', { r: 11 });
    s += atom(nAt.x, nAt.y, 'N', { kind: 'warn', r: 11 });
    s += text(nAt.x + 14, nAt.y - 30, 'lone pair', { cls: 'fg-tag-warn', anchor: 'start' });
    s += tag(170, 420, 'lone pair in the p orbital: two of the');
    s += tag(170, 437, 'six π electrons, not free for H⁺');
    s += tag(170, 456, 'pKaH ≈ −4 (the proton goes on carbon)', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Find the nitrogen lone pair in each ring. In pyridine it sits in the flat sp² lobe pointing away from the ring; in pyrrole it sits in the upright p orbital with the ring&rsquo;s other π electrons.',
});

/* ----------------------------------------------------------------------
   10b. Aziridine against dimethylamine.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'aziridine',
  section: 'amine-structure',
  anchor: 'Aziridine',
  viewBox: '0 0 340 190',
  alt: 'Left: aziridine, a three-membered ring of one N–H nitrogen and two CH2 carbons, with ring bond angles of about 60 degrees; pKaH 8.0. Right: dimethylamine, an N–H nitrogen with two CH3 groups and no ring; pKaH 10.7.',
  build() {
    let s = '';
    /* aziridine */
    const n = P(85, 70), c1 = P(58, 124), c2 = P(112, 124);
    s += bond(n, c1, { rFrom: 15, rTo: 0 }); s += bond(n, c2, { rFrom: 15, rTo: 0 }); s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(n, P(120, 46), { rFrom: 15, rTo: 12 });
    s += atom(120, 46, 'H', { r: 12 });
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += lonePair(n.x, n.y, 215, { dist: 22 });
    s += text(85, 114, '60°', { cls: 'fg-tag-mut' });
    /* dimethylamine */
    const m = P(255, 84);
    s += bond(m, P(212, 110), { rFrom: 15, rTo: 18 }); s += bond(m, P(298, 110), { rFrom: 15, rTo: 18 });
    s += bond(m, P(255, 44), { rFrom: 15, rTo: 12 });
    s += atom(212, 110, 'CH₃', { r: 18 }); s += atom(298, 110, 'CH₃', { r: 18 });
    s += atom(255, 44, 'H', { r: 12 });
    s += atom(m.x, m.y, 'N', { kind: 'hi' });
    s += lonePair(m.x, m.y, 90, { dist: 22 });
    s += tag(85, 160, 'aziridine');
    s += tag(85, 178, 'pKaH 8.0', { cls: 'fg-tag-warn' });
    s += tag(255, 160, 'dimethylamine');
    s += tag(255, 178, 'pKaH 10.7', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Compare the angle at each ring atom of aziridine, about 60&deg;, with the roughly 109&deg; an sp³ atom prefers.',
});

/* ----------------------------------------------------------------------
   11. Amidinium and guanidinium: the charge spread over nitrogens.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'amidine-guanidine',
  section: 'amine-structure',
  anchor: '<h3>When resonance makes a nitrogen',
  viewBox: '0 0 760 420',
  alt: 'Top row: acetamidine, CH3–C(=NH)–NH2, takes a proton on its double-bonded NH nitrogen (pKaH 12.4). The cation is drawn as two resonance contributors: in one the plus charge is on the top nitrogen, in the other on the right-hand nitrogen; curved arrows show the NH2 lone pair moving into the C–N bond. Bottom row: guanidine, (H2N)2C=NH, takes a proton the same way (pKaH 13.6), and the guanidinium ion is drawn as three contributors, with the plus charge on each of the three nitrogens in turn.',
  build() {
    let s = '';
    /* A central carbon with three arms; `arms` gives each arm's label, bond
       order, kind, lone pair angle (or null) and whether it carries +. */
    const struct = (cx, cy, arms) => {
      const t = trigonal(cx, cy, 44);
      let g = '';
      for (const [key, a] of Object.entries(arms)) {
        const p = t[key];
        const r = a.txt.length > 2 ? 18 : 16;
        g += bond(t.c, p, { rFrom: 0, rTo: r, order: a.order || 1, gap: 3.4 });
        g += atom(p.x, p.y, a.txt, { kind: a.kind || 'plain', r });
        if (a.lp !== undefined && a.lp !== null) g += lonePair(p.x, p.y, a.lp, { dist: 24 });
        if (a.plus) g += plusSign(p.x + a.plus[0], p.y + a.plus[1]);
      }
      return { g, t };
    };
    const push = (t, from, to) => {
      /* the lone pair on arm `from` into the C–from bond, and the C=to pi
         bond onto the atom at `to` */
      const f = t[from], o = t[to];
      let g = pairToBond(f, t.c);
      const m = P((t.c.x + o.x) / 2, (t.c.y + o.y) / 2);
      g += away(P(m.x - 6, m.y), P(o.x - 20, o.y + 8), P(t.c.x + 30, t.c.y - 10), 12);
      return g;
    };

    /* row 1: acetamidine */
    const y1 = 110;
    s += tag(20, 26, 'AN AMIDINE', { anchor: 'start' });
    s += struct(100, y1, {
      top: { txt: 'NH', order: 2, kind: 'hi', lp: -40 },
      left: { txt: 'CH₃' },
      right: { txt: 'NH₂', lp: 90 },
    }).g;
    s += arrow(P(172, y1), P(238, y1));
    s += label(205, y1 - 12, '+ H⁺');
    let st = struct(330, y1, {
      top: { txt: 'NH₂', order: 2, kind: 'warn', plus: [26, -8] },
      left: { txt: 'CH₃' },
      right: { txt: 'NH₂', kind: 'hi', lp: -30 },
    });
    s += st.g + push(st.t, 'right', 'top');
    s += resArrow(P(414, y1), P(460, y1));
    s += struct(530, y1, {
      top: { txt: 'NH₂', kind: 'hi', lp: -90 },
      left: { txt: 'CH₃' },
      right: { txt: 'NH₂', order: 2, kind: 'warn', plus: [8, 32] },
    }).g;
    s += tag(100, 186, 'acetamidine · pKaH 12.4', { cls: 'fg-tag-good' });
    s += tag(430, 186, 'the + is shared by two nitrogens', { cls: 'fg-tag-good' });

    s += rule(20, 204, 740, 204);

    /* row 2: guanidine */
    const y2 = 310;
    s += tag(20, 226, 'A GUANIDINE', { anchor: 'start' });
    s += struct(100, y2, {
      top: { txt: 'NH', order: 2, kind: 'hi', lp: -40 },
      left: { txt: 'NH₂', lp: 90 },
      right: { txt: 'NH₂', lp: 90 },
    }).g;
    s += arrow(P(172, y2), P(238, y2));
    s += label(205, y2 - 12, '+ H⁺');
    st = struct(330, y2, {
      top: { txt: 'NH₂', order: 2, kind: 'warn', plus: [26, -8] },
      left: { txt: 'NH₂', lp: 90 },
      right: { txt: 'NH₂', kind: 'hi', lp: -30 },
    });
    s += st.g + push(st.t, 'right', 'top');
    s += resArrow(P(414, y2), P(460, y2));
    s += struct(530, y2, {
      top: { txt: 'NH₂', kind: 'hi', lp: -90 },
      left: { txt: 'NH₂', lp: 90 },
      right: { txt: 'NH₂', order: 2, kind: 'warn', plus: [8, 32] },
    }).g;
    s += resArrow(P(600, y2), P(652, y2));
    s += struct(700, y2, {
      top: { txt: 'NH₂', kind: 'hi', lp: -90 },
      left: { txt: 'NH₂', order: 2, kind: 'warn', plus: [-8, 32] },
      right: { txt: 'NH₂', lp: 90 },
    }).g;
    s += tag(100, 392, 'guanidine · pKaH 13.6', { cls: 'fg-tag-good' });
    s += tag(530, 392, 'the + is shared by three nitrogens', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'In each row, find the plus charge in every contributor of the cation. It sits on a different nitrogen each time.',
});

/* ----------------------------------------------------------------------
   12. The four nitrogens of the ranking example.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'aniline-substituents',
  section: 'amine-structure',
  anchor: 'Rank by basicity:',
  viewBox: '0 0 760 244',
  alt: 'Four structures in order of falling basicity: cyclohexylamine, pKaH 10.7; 4-methoxyaniline, an NH2 with an OCH3 on the para carbon, pKaH 5.3; aniline, pKaH 4.6; 4-nitroaniline, an NH2 with an NO2 on the para carbon, pKaH 1.0.',
  build() {
    const K = hexKit(30);
    let s = '';
    const cy = 112;
    const mols = [
      { x: 95, name: 'cyclohexylamine', pk: 'pKaH 10.7', doubles: [], para: null, cls: 'fg-tag-good' },
      { x: 285, name: '4-methoxyaniline', pk: 'pKaH 5.3', doubles: [1, 3, 5], para: 'OCH₃', cls: 'fg-tag' },
      { x: 475, name: 'aniline', pk: 'pKaH 4.6', doubles: [1, 3, 5], para: null, cls: 'fg-tag' },
      { x: 665, name: '4-nitroaniline', pk: 'pKaH 1.0', doubles: [1, 3, 5], para: 'NO₂', cls: 'fg-tag-warn' },
    ];
    for (const m of mols) {
      s += K.ring(m.x, cy, m.doubles);
      s += K.sub(m.x, cy, 0, 'NH₂', { kind: 'hi', r: 17, d: 28 });
      if (m.para) s += K.sub(m.x, cy, 3, m.para, { r: 21, d: 30 });
      s += tag(m.x, 214, m.name);
      s += tag(m.x, 232, m.pk, { cls: m.cls });
    }
    for (const x of [190, 380, 570]) s += label(x, cy + 5, '>');
    return s;
  },
  caption: 'The three anilines differ only in the group on the carbon opposite the NH<sub>2</sub> (the para carbon).',
});

/* ----------------------------------------------------------------------
   13. Procaine: which nitrogen takes the proton.
   ---------------------------------------------------------------------- */
FIGURES.push({
  id: 'procaine',
  section: 'amine-structure',
  anchor: 'Where does the proton go?</p>',
  viewBox: '0 0 760 236',
  alt: 'Procaine drawn in skeletal form. On the left, an NH2 sits on a benzene ring; on the para carbon of the ring is an ester, C(=O)–O, followed by a two-carbon chain ending in a nitrogen that carries two ethyl groups. The aryl NH2 is labeled: pair shared with the ring and the C=O, pKaH about 2.5. The diethylamino nitrogen is labeled: pair free, pKaH about 9, this is the nitrogen that takes the proton.',
  build() {
    let s = '';
    const cy = 124, R = 32;
    const ring = polyPts(250, cy, 6, R, 0);    // vertex 0 on the right, 3 on the left
    const c = P(250, cy);
    for (let i = 0; i < 6; i++) {
      const a = ring[i], b = ring[(i + 1) % 6];
      s += (i % 2 === 1) ? ringDouble(a, b, c, { inset: 7 }) : bond(a, b, { rFrom: 0, rTo: 0 });
    }
    /* aryl NH2 on the left vertex */
    const nAr = P(ring[3].x - 38, cy);
    s += bond(ring[3], nAr, { rFrom: 0, rTo: 18 });
    s += atom(nAr.x, nAr.y, 'H₂N', { kind: 'warn', r: 18 });
    /* ester and chain, zigzag to the right */
    const dx = 36, up = cy - 20;
    const cC = P(ring[0].x + dx, up);
    const oC = P(cC.x, up - 40);
    const oE = P(cC.x + dx, cy);
    const c1 = P(oE.x + dx, up), c2 = P(c1.x + dx, cy);
    const nAm = P(c2.x + dx, up);
    const e1a = P(nAm.x + dx, cy), e1b = P(e1a.x + dx, up);
    const e2a = P(nAm.x, up - 40), e2b = P(nAm.x + dx, up - 60);
    s += bond(ring[0], cC, { rFrom: 0, rTo: 0 });
    s += bond(cC, oC, { rFrom: 0, rTo: 15, order: 2, gap: 3.4 });
    s += atom(oC.x, oC.y, 'O');
    s += bond(cC, oE, { rFrom: 0, rTo: 14 });
    s += atom(oE.x, oE.y, 'O', { r: 14 });
    s += bond(oE, c1, { rFrom: 14, rTo: 0 });
    s += bond(c1, c2, { rFrom: 0, rTo: 0 });
    s += bond(c2, nAm, { rFrom: 0, rTo: 15 });
    s += bond(nAm, e1a, { rFrom: 15, rTo: 0 }); s += bond(e1a, e1b, { rFrom: 0, rTo: 0 });
    s += bond(nAm, e2a, { rFrom: 15, rTo: 0 }); s += bond(e2a, e2b, { rFrom: 0, rTo: 0 });
    s += atom(nAm.x, nAm.y, 'N', { kind: 'hi' });
    s += lonePair(nAm.x, nAm.y, 90, { dist: 22 });

    s += tag(nAr.x + 40, 192, 'aryl NH₂: pair shared with the ring', { cls: 'fg-tag-warn' });
    s += tag(nAr.x + 40, 208, 'and the C=O · pKaH ≈ 2.5', { cls: 'fg-tag-warn' });
    s += text(nAm.x + 66, 40, 'diethylamino N: pair free', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(nAm.x + 66, 56, 'pKaH ≈ 9 · takes the proton', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(oC.x + 20, oC.y + 4, 'ester', { cls: 'fg-tag-mut', anchor: 'start' });
    return s;
  },
  caption: 'Find the two nitrogens: one on the ring at the far left, one at the end of the chain on the right.',
});

export default FIGURES;
