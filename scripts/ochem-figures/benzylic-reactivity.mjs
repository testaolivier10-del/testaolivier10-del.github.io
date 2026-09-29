/* Figures for the benzylic-reactivity notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions:
   - This is a late chapter, so rings and chains are skeletal. The carbon
     the page is about, the benzylic one, is always a labeled disc, so its
     hydrogens are counted on the drawing rather than left to the reader.
   - A curved arrow starts on a bond's electrons and ends on the bond that
     receives them.
   - Lesson copies (id prefix l-) are 340 wide or less, stack their panels,
     and use only fg-lbl and fg-tag text. The 340-wide figures without the
     prefix are shared by the notes and the lesson. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);

/* An atom disc that stays opaque in both themes. */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => (l.length >= 3 ? 18 : l === 'H' ? 12 : l.length === 2 ? 16 : 15);
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
/* Tag text; S_N1 / S_N2 get the subscript N the prose uses. */
const tg = (x, y, s, anchor = 'middle', cls = 'fg-tag') =>
  text(x, y, s, { cls, size: 11, anchor }).replace(/\bSN([12])\b/g, 'S<tspan baseline-shift="sub" font-size="8">N</tspan>$1');
const chg = (p, s = '+') => text(p.x, p.y + 5, s, { cls: 'fg-warn', size: 16 });
/* The single dot that makes a species a radical. */
const dot = (p) => `<circle class="fg-lp" cx="${r2(p.x)}" cy="${r2(p.y)}" r="3.4"></circle>`;
/* A small ring drawn round a skeletal vertex to point at it. */
const ringMark = (p, cls = 'fg-atom-hi', r = 8) =>
  `<circle class="${cls}" cx="${r2(p.x)}" cy="${r2(p.y)}" r="${r}"></circle>`;
const dash = (a, b, cls = 'fg-dash') =>
  `<line class="${cls}" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;
/* Skeletal bond: trims only at labeled ends. */
const skb = (a, b, o = {}) => bond(a, b, { rFrom: o.rFrom ?? 0, rTo: o.rTo ?? 0, cls: o.cls, order: o.order || 1, gap: o.gap ?? 3.4 });

/* A hexagon. Vertex i sits at math angle rot - 60i, so with rot = 90 vertex
   0 is the top and the numbering runs clockwise: 1 and 5 ortho to 0, 2 and 4
   meta, 3 para. `doubles` lists the ring bonds i -> i+1 drawn double. */
function hex(cx, cy, R, doubles = [0, 2, 4], o = {}) {
  const rot = o.rot ?? 90;
  const v = [];
  for (let i = 0; i < 6; i++) v.push(at(P(cx, cy), rot - 60 * i, R));
  const c = P(cx, cy);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    if (doubles.includes(i)) s += ringDouble(v[i], v[j], c, { inset: o.inset ?? R * 0.28, gap: o.gap ?? 4 });
    else s += skb(v[i], v[j]);
  }
  /* out(i, d): a point d beyond vertex i, on the line from the centre. */
  const out = (i, d) => at(v[i], rot - 60 * i, d);
  return { s, v, c, out, ang: (i) => rot - 60 * i };
}

/* A curved arrow from the middle of bond a1-a2 to the middle of bond b1-b2,
   bowed away from `ctr` so it never crosses the ring. */
function bondToBond(a1, a2, b1, b2, ctr, o = {}) {
  const push = (p, d) => {
    const dx = p.x - ctr.x, dy = p.y - ctr.y, L = Math.hypot(dx, dy) || 1;
    return P(p.x + (dx / L) * d, p.y + (dy / L) * d);
  };
  const S = push(mid(a1, a2), o.ps ?? 5), E = push(mid(b1, b2), o.pe ?? 6);
  const m = mid(S, E), dx = E.x - S.x, dy = E.y - S.y, L = Math.hypot(dx, dy) || 1;
  const px = -dy / L, py = dx / L;
  const sign = (px * (m.x - ctr.x) + py * (m.y - ctr.y)) >= 0 ? 1 : -1;
  return curve(S, E, { bow: sign * (o.bow ?? 16), size: 7 });
}

/* A group bonded to `from`: o.bond is 'wedge' | 'hash' | undefined. */
function arm(from, deg, len, l, o = {}) {
  const e = at(from, deg, len);
  const r = l ? (o.r ?? rOf(l)) : 0;
  const rFrom = o.rFrom ?? 15;
  let s = o.bond === 'wedge' ? wedge(from, e, { rFrom, rTo: r, width: 9 })
        : o.bond === 'hash' ? hash(from, e, { rFrom, rTo: r, width: 10, rungs: 5 })
        : bond(from, e, { rFrom, rTo: r, order: o.order || 1, cls: o.cls });
  if (l) s += atom(e.x, e.y, l, { r, kind: o.kind });
  return s;
}
/* A tetrahedral or trigonal carbon with its arms; arms: [deg, len, label, opts]. */
function centre(c, arms, o = {}) {
  let s = '';
  for (const [deg, len, l, ao] of arms) s += arm(c, deg, len, l, ao || {});
  s += atom(c.x, c.y, 'C', { kind: o.kind });
  return s;
}
const dArrow = (a, b, size = 7) => arrow(a, b, { muted: true, size }) + arrow(b, a, { muted: true, size });

/* ======================================================================
   1. Which carbon is benzylic.
   ====================================================================== */
/* Propylbenzene with its three kinds of carbon marked. */
function propylMarked(cx, cy, R) {
  const h = hex(cx, cy, R);
  let s = h.s;
  const ipso = h.v[1];
  const b = at(ipso, 30, 34);
  const c2 = at(b, -30, 34);
  const c3 = at(c2, 30, 34);
  s += skb(b, c2) + skb(c2, c3);
  s += ringMark(ipso, 'fg-atom-warn') + ringMark(c2, 'fg-atom', 7);
  s += bond(ipso, b, { rFrom: 0, rTo: 17 });
  s += atom(b.x, b.y, 'CH₂', { kind: 'hi', r: 17 });
  return { s, ipso, b, c2, c3, h };
}
function benzylAlcohol(cx, cy, R) {
  const h = hex(cx, cy, R);
  const b = at(h.v[1], 30, 32);
  const oh = at(b, -30, 38);
  return h.s + bond(h.v[1], b, { rFrom: 0, rTo: 17 }) + atom(b.x, b.y, 'CH₂', { kind: 'hi', r: 17 }) +
    bond(b, oh, { rFrom: 17, rTo: 16 }) + atom(oh.x, oh.y, 'OH', { r: 16 });
}
function phenol(cx, cy, R) {
  const h = hex(cx, cy, R);
  const oh = h.out(1, 30);
  return h.s + ringMark(h.v[1], 'fg-atom-warn') + bond(h.v[1], oh, { rFrom: 0, rTo: 16 }) + atom(oh.x, oh.y, 'OH', { r: 16 });
}

FIGURES.push({
  id: 'benzylic-positions',
  section: 'benzylic-reactivity',
  anchor: 'the stabilization does not run down the chain.</div>',
  alt: 'Left: propylbenzene. The chain carbon bonded to the ring is labeled CH2 and marked benzylic; the ring carbon it is attached to is marked as in the ring; the next chain carbon is marked two bonds out. Right: benzyl alcohol, with the OH on the benzylic CH2, beside phenol, with the OH on a ring carbon.',
  viewBox: '0 0 760 250',
  build() {
    let s = panel(12, 12, 360, 226) + panel(388, 12, 360, 226);
    const m = propylMarked(96, 140, 30);
    s += m.s;
    s += tg(m.b.x, 58, 'benzylic carbon');
    s += dash(P(m.b.x, 66), P(m.b.x, m.b.y - 20));
    s += dash(P(m.ipso.x + 4, m.ipso.y + 8), P(150, 196));
    s += tg(150, 210, 'in the ring', 'middle');
    s += dash(P(m.c2.x + 6, m.c2.y + 6), P(236, 176));
    s += tg(236, 190, 'two bonds out:', 'start');
    s += tg(236, 204, 'ordinary', 'start');

    s += tg(568, 36, 'WHERE THE OH SITS');
    s += benzylAlcohol(452, 140, 26);
    s += phenol(658, 140, 26);
    s += tg(484, 206, 'benzylic alcohol');
    s += tg(484, 222, 'OH on the benzylic C', 'middle', 'fg-tag-mut');
    s += tg(672, 206, 'phenol');
    s += tg(672, 222, 'OH on a ring carbon', 'middle', 'fg-tag-mut');
    s += dash(P(568, 56), P(568, 224));
    return s;
  },
  caption: 'Propylbenzene, with its three kinds of carbon marked. Only the shaded CH₂ is benzylic.',
});

FIGURES.push({
  id: 'l-benzylic-positions',
  lessons: ['benzylic-reactivity'],
  alt: 'Top: propylbenzene. The chain carbon bonded to the ring is labeled CH2 and marked benzylic; the ring carbon it is attached to is marked as in the ring; the next chain carbon is marked two bonds out. Bottom: benzyl alcohol, with the OH on the benzylic CH2, beside phenol, with the OH on a ring carbon.',
  viewBox: '0 0 340 420',
  build() {
    let s = panel(8, 8, 324, 214) + panel(8, 234, 324, 176);
    const m = propylMarked(84, 136, 30);
    s += m.s;
    s += tg(m.b.x, 52, 'benzylic carbon');
    s += dash(P(m.b.x, 60), P(m.b.x, m.b.y - 20));
    s += dash(P(m.ipso.x + 4, m.ipso.y + 8), P(138, 190));
    s += tg(138, 204, 'in the ring');
    s += dash(P(m.c2.x + 6, m.c2.y + 6), P(222, 172));
    s += tg(222, 186, 'two bonds out:', 'start');
    s += tg(222, 200, 'ordinary', 'start');

    s += benzylAlcohol(62, 318, 22);
    s += phenol(246, 318, 22);
    s += tg(94, 382, 'benzylic alcohol');
    s += tg(260, 382, 'phenol');
    s += tg(94, 398, 'OH on the benzylic C', 'middle', 'fg-tag-mut');
    s += tg(260, 398, 'OH on a ring C', 'middle', 'fg-tag-mut');
    s += dash(P(178, 250), P(178, 400));
    return s;
  },
  caption: 'Propylbenzene, with its three kinds of carbon marked. Only the shaded CH₂ is benzylic.',
});

/* ======================================================================
   2. The benzyl cation: four resonance structures, with the arrows.
   ====================================================================== */
/* One benzyl-cation structure. k = 0..3: + on CH2, ortho (v1), para (v3),
   other ortho (v5). With arrows = true, the arrow that makes the next one. */
const CATION = [
  { doubles: [0, 2, 4], plusAt: null, from: [0, 1], to: 'exo' },
  { doubles: [2, 4], plusAt: 1, from: [2, 3], to: [1, 2] },
  { doubles: [1, 4], plusAt: 3, from: [4, 5], to: [3, 4] },
  { doubles: [1, 3], plusAt: 5, from: null, to: null },
];
function benzylCation(cx, cy, R, k, o = {}) {
  const f = CATION[k];
  const h = hex(cx, cy, R, f.doubles);
  let s = h.s;
  const p = h.out(0, o.exo ?? 32);
  const rr = o.r ?? 17;
  s += bond(h.v[0], p, { rFrom: 0, rTo: rr, order: f.plusAt === null ? 1 : 2, gap: 3.4 });
  s += atom(p.x, p.y, 'CH₂', { kind: f.plusAt === null ? 'hi' : 'plain', r: rr });
  if (f.plusAt === null) s += chg(P(p.x + rr + 8, p.y - 8));
  else s += chg(h.out(f.plusAt, 13));
  if (o.arrows && f.from) {
    const a1 = h.v[f.from[0]], a2 = h.v[f.from[1] % 6];
    if (f.to === 'exo') {
      /* from the ring double bond to the middle of the C-CH2 bond */
      const m = mid(a1, a2), dx = m.x - h.c.x, dy = m.y - h.c.y, L = Math.hypot(dx, dy);
      const S = P(m.x + (dx / L) * 5, m.y + (dy / L) * 5);
      const E = P(h.v[0].x + 5, (h.v[0].y + p.y + rr) / 2);
      s += curve(S, E, { bow: 14, size: 7 });
    }
    else s += bondToBond(a1, a2, h.v[f.to[0]], h.v[f.to[1]], h.c, { bow: 16 });
  }
  return { s, h, p };
}

FIGURES.push({
  id: 'benzylic-delocalization',
  section: 'benzylic-reactivity',
  anchor: 'and from those carbons into the ring.</p>',
  alt: 'Top row: the four resonance structures of the benzyl cation, joined by double-headed arrows. In the first the positive charge is on the CH2 carbon, and a curved arrow moves the electrons of the neighboring ring double bond to make a C=CH2 double bond. That leaves the charge on an ortho carbon; further curved arrows move it to the para carbon and then to the other ortho carbon. Bottom left: one ring summarizing the four carbons that carry the charge, with the two meta carbons marked never. Bottom right: the allyl cation drawn as its two resonance structures for comparison.',
  viewBox: '0 0 760 440',
  build() {
    let s = '';
    const xs = [96, 284, 472, 660], CY = 130, R = 30;
    const labs = ['on the benzylic carbon', 'on an ortho carbon', 'on the para carbon', 'on the other ortho carbon'];
    xs.forEach((x, k) => {
      s += benzylCation(x, CY, R, k, { arrows: true }).s;
      s += tg(x, 206, labs[k]);
      if (k < 3) s += dArrow(P(x + 46, CY + 4), P(xs[k + 1] - 46, CY + 4));
    });
    s += rule(24, 228, 736, 228);

    /* Summary ring: the four positions and the two that never carry it. */
    {
      const h = hex(150, 336, 34);
      s += tg(150, 256, 'WHERE THE + CAN SIT');
      s += h.s;
      const p = h.out(0, 30);
      s += bond(h.v[0], p, { rFrom: 0, rTo: 11 });
      s += ringMark(p, 'fg-atom-hi', 11);
      for (const i of [1, 3, 5]) s += ringMark(h.v[i], 'fg-atom-hi', 8);
      for (const i of [2, 4]) s += ringMark(h.v[i], 'fg-atom', 7);
      s += tg(p.x + 18, p.y + 4, 'benzylic', 'start');
      s += tg(h.v[1].x + 14, h.v[1].y - 4, 'ortho', 'start');
      s += tg(h.v[5].x - 14, h.v[5].y - 4, 'ortho', 'end');
      s += tg(h.v[3].x, h.v[3].y + 24, 'para');
      s += tg(h.v[2].x + 14, h.v[2].y + 8, 'meta: never', 'start', 'fg-tag-mut');
      s += tg(h.v[4].x - 14, h.v[4].y + 8, 'meta: never', 'end', 'fg-tag-mut');
    }

    /* The allyl cation, for comparison. */
    s += panel(372, 246, 364, 180);
    s += tg(554, 270, 'AN ALLYL CATION, FOR COMPARISON');
    {
      const A = [P(420, 350), P(456, 328), P(492, 350)];
      s += skb(A[0], A[1], { order: 2, gap: 3.4 }) + skb(A[1], A[2]);
      s += chg(P(504, 346));
      s += curve(P(438, 336), P(476, 336), { bow: -34, size: 7 });
      const B = [P(616, 350), P(652, 328), P(688, 350)];
      s += skb(B[0], B[1]) + skb(B[1], B[2], { order: 2, gap: 3.4 });
      s += chg(P(604, 346));
      s += dArrow(P(528, 340), P(580, 340));
      s += tg(554, 402, 'two carbons carry the charge');
    }
    return s;
  },
  caption: 'The benzyl cation, C₆H₅CH₂⁺. Follow the curved arrows from left to right: each one moves the plus two carbons along the ring.',
  note: 'In structures 2&ndash;4 the ring no longer has its three alternating double bonds, so those structures have lost the ring&rsquo;s aromatic stability. They cost energy and count for less in the hybrid than the first structure does.',
});

FIGURES.push({
  id: 'l-benzyl-cation-resonance',
  lessons: ['benzylic-reactivity'],
  alt: 'The four resonance structures of the benzyl cation, stacked. In the first the positive charge is on the CH2 carbon, and a curved arrow moves the electrons of the neighboring ring double bond to make a C=CH2 double bond. That leaves the charge on an ortho carbon; further curved arrows move it to the para carbon and then to the other ortho carbon.',
  viewBox: '0 0 340 540',
  build() {
    let s = '';
    const labs = [['on the', 'benzylic carbon'], ['on an ortho', 'carbon'], ['on the para', 'carbon'], ['on the other', 'ortho carbon']];
    for (let k = 0; k < 4; k++) {
      const cy = 88 + k * 128;
      s += benzylCation(110, cy, 26, k, { arrows: true, exo: 28, r: 16 }).s;
      s += lbl(214, cy - 6, labs[k][0], 'start');
      s += lbl(214, cy + 12, labs[k][1], 'start');
      if (k < 3) s += dArrow(P(52, cy + 34), P(52, cy + 92));
    }
    return s;
  },
  caption: 'The benzyl cation, C₆H₅CH₂⁺. Follow the curved arrows from top to bottom: each one moves the plus two carbons along the ring.',
});

/* ======================================================================
   3. The radical and the anion reach the same carbons.
   ====================================================================== */
FIGURES.push({
  id: 'benzylic-radical-anion',
  section: 'benzylic-reactivity',
  anchor: 'the same four carbons share it.</p>',
  alt: 'Left panel: the benzyl radical drawn two ways, with the unpaired electron on the CH2 carbon and, after the ring double bonds shift, on the para carbon with a C=CH2 double bond. Right panel: the benzyl anion drawn the same two ways, with the lone pair and negative charge on the CH2 carbon and then on the para carbon.',
  viewBox: '0 0 760 250',
  build() {
    let s = panel(12, 12, 360, 226) + panel(388, 12, 360, 226);
    s += tg(192, 36, 'BENZYL RADICAL');
    s += tg(568, 36, 'BENZYL ANION');
    const pair = (x0, kind) => {
      let g = '';
      /* on the CH2 */
      const a = hex(x0, 146, 28, [0, 2, 4]);
      const pa = a.out(0, 30);
      g += a.s + bond(a.v[0], pa, { rFrom: 0, rTo: 17 }) + atom(pa.x, pa.y, 'CH₂', { kind: 'hi', r: 17 });
      if (kind === 'radical') g += dot(P(pa.x + 25, pa.y - 6));
      else g += lonePair(pa.x, pa.y, 0, { dist: 25 }) + text(pa.x + 26, pa.y - 16, '−', { cls: 'fg-warn', size: 16 });
      /* on the para carbon */
      const bx = x0 + 180;
      const b = hex(bx, 146, 28, [1, 4]);
      const pb = b.out(0, 30);
      g += b.s + bond(b.v[0], pb, { rFrom: 0, rTo: 17, order: 2, gap: 3.4 }) + atom(pb.x, pb.y, 'CH₂', { r: 17 });
      if (kind === 'radical') g += dot(P(b.v[3].x, b.v[3].y + 13));
      else g += lonePair(b.v[3].x, b.v[3].y, 90, { dist: 13 }) + text(b.v[3].x + 16, b.v[3].y + 16, '−', { cls: 'fg-warn', size: 16 });
      g += dArrow(P(x0 + 58, 150), P(bx - 58, 150));
      g += tg(x0, 206, kind === 'radical' ? 'odd electron on CH₂' : 'lone pair on CH₂');
      g += tg(bx, 206, 'on the para carbon');
      return g;
    };
    s += pair(102, 'radical');
    s += pair(478, 'anion');
    return s;
  },
  caption: 'Two of the four structures for each species. The two ortho structures, not drawn, follow the pattern of the cation above.',
});

/* ======================================================================
   4. Why SN2 is fast too: the ring's p orbitals line up with the one at
      the carbon under attack.
   ====================================================================== */
FIGURES.push({
  id: 'benzylic-sn2-overlap',
  section: 'benzylic-reactivity',
  lessons: ['benzylic-reactivity'],
  anchor: 'and a benzylic carbon is usually unhindered.</p>',
  alt: 'The SN2 transition state for a benzylic bromide. The nucleophile on the left and the bromide on the right are each half-bonded to the central carbon, shown by dashed lines, and the carbon has a p orbital along that line. Below the carbon the benzene ring is seen edge-on, and each ring carbon has a p orbital pointing the same way, parallel to the one on the central carbon, so the two overlap side by side.',
  viewBox: '0 0 340 330',
  build() {
    let s = '';
    const C = P(150, 104);
    /* the p orbital on the carbon under attack, along the Nu...C...Br line */
    s += lobeE(C.x - 30, C.y, 24, 12);
    s += lobeE(C.x + 30, C.y, 24, 12, 'fg-orb-alt');
    const Nu = P(40, 104), Br = P(262, 104);
    s += dash(P(Nu.x + 17, Nu.y), P(C.x - 16, C.y));
    s += dash(P(C.x + 16, C.y), P(Br.x - 17, Br.y));
    s += atom(Nu.x, Nu.y, 'Nu', { r: 16 });
    s += atom(Br.x, Br.y, 'Br', { kind: 'warn', r: 16 });
    s += text(Nu.x, Nu.y - 26, 'δ−', { cls: 'fg-warn', size: 13 });
    s += text(Br.x, Br.y - 26, 'δ−', { cls: 'fg-warn', size: 13 });
    s += wedge(C, P(C.x - 22, C.y - 50), { rFrom: 15, rTo: 11, width: 8 }) + atom(C.x - 22, C.y - 50, 'H', { r: 11 });
    s += hash(C, P(C.x + 22, C.y - 50), { rFrom: 15, rTo: 11, width: 9, rungs: 4 }) + atom(C.x + 22, C.y - 50, 'H', { r: 11 });
    s += atom(C.x, C.y, 'C', { kind: 'hi' });

    /* the ring, seen edge-on: a squashed hexagon with its para axis vertical */
    const top = P(C.x, 184), w = 16, dy = 30;
    const ring = [top, P(C.x + w, top.y + dy), P(C.x + w, top.y + 2 * dy), P(C.x, top.y + 3 * dy), P(C.x - w, top.y + 2 * dy), P(C.x - w, top.y + dy)];
    s += bond(C, top, { rFrom: 16, rTo: 0 });
    /* p orbitals on the ring carbons, all parallel to the one above */
    for (const y of [top.y, top.y + dy, top.y + 2 * dy, top.y + 3 * dy]) {
      s += lobeE(C.x - 30, y, 22, 8);
      s += lobeE(C.x + 30, y, 22, 8, 'fg-orb-alt');
    }
    for (let i = 0; i < 6; i++) s += skb(ring[i], ring[(i + 1) % 6]);
    s += `<rect class="fg-dash-hi" x="${C.x - 58}" y="${C.y - 16}" width="116" height="${top.y - C.y + 30}" rx="14" fill="none"></rect>`;
    s += tg(C.x + 66, 146, 'parallel p orbitals', 'start');
    s += tg(C.x + 66, 160, 'overlap here', 'start');
    s += tg(C.x + 66, 232, 'benzene ring,', 'start');
    s += tg(C.x + 66, 246, 'seen edge-on', 'start');
    s += tg(170, 24, 'THE SN2 TRANSITION STATE');
    return s;
  },
  caption: 'Nu and Br are each half-bonded to the benzylic carbon. The dashed box marks where its p orbital overlaps the ring&rsquo;s.',
});

/* ======================================================================
   5. One substrate, two stereochemical outcomes.
   ====================================================================== */
/* (R)-(1-bromoethyl)benzene: Br > C6H5 > CH3 > H, with H on the hash,
   Br(0°) -> C6H5(240°) -> CH3(120°) runs clockwise, so R. */
const RBROMIDE = [[0, 50, 'Br', { kind: 'warn', r: 16 }], [120, 50, 'CH₃'], [240, 54, 'C₆H₅', { bond: 'wedge', r: 20 }], [300, 42, 'H', { bond: 'hash' }]];
/* The flat cation, seen with its p orbital vertical. */
const CATION_ARMS = [[0, 60, 'C₆H₅', { r: 20 }], [205, 44, 'H', { bond: 'wedge' }], [160, 50, 'CH₃', { bond: 'hash' }]];
/* Water from above: OH up, the rest bent down. OH(90) -> C6H5(330) ->
   CH3(250) is clockwise with H (wedge) toward the viewer, so S. */
const FROM_TOP = [[90, 46, 'OH'], [330, 58, 'C₆H₅', { r: 20 }], [200, 42, 'H', { bond: 'wedge' }], [250, 50, 'CH₃', { bond: 'hash' }]];
/* Its mirror image: R. */
const FROM_BOTTOM = [[270, 46, 'OH'], [30, 58, 'C₆H₅', { r: 20 }], [160, 42, 'H', { bond: 'wedge' }], [110, 50, 'CH₃', { bond: 'hash' }]];
/* Backside attack: Nu enters opposite Br and the other three fold over. */
const INVERTED = [[180, 50, 'Nu', { kind: 'hi', r: 16 }], [60, 50, 'CH₃'], [300, 54, 'C₆H₅', { bond: 'wedge', r: 20 }], [240, 42, 'H', { bond: 'hash' }]];

function flatCation(c) {
  let s = lobeE(c.x, c.y - 42, 18, 30) + lobeE(c.x, c.y + 42, 18, 30);
  s += centre(c, CATION_ARMS, { kind: 'warn' });
  s += chg(P(c.x + 28, c.y - 20));
  return s;
}

FIGURES.push({
  id: 'benzylic-stereo',
  section: 'benzylic-reactivity',
  anchor: 'which is possible only because it runs both mechanisms.</p>',
  alt: 'Left: (R)-(1-bromoethyl)benzene with the bromine on the right. Upper route, in water by SN1: the bromide leaves to give a flat cation with an empty p orbital above and below; water attacks from above to give (S)-1-phenylethanol and from below to give (R)-1-phenylethanol, mirror images in equal amounts. Lower route, with a strong nucleophile in acetone by SN2: the nucleophile attacks from the side opposite the bromine, and the product is inverted, with the nucleophile on the left and the other three groups folded over.',
  viewBox: '0 0 760 420',
  build() {
    let s = '';
    const sm = P(96, 214);
    s += centre(sm, RBROMIDE);
    s += tg(96, 300, '(R)-(1-bromoethyl)benzene');

    /* upper route: SN1 in water */
    s += arrow(P(160, 180), P(238, 136));
    s += tg(186, 138, 'H₂O', 'end');
    s += tg(186, 152, 'SN1', 'end');
    const cat = P(300, 132);
    s += flatCation(cat);
    s += tg(300, 22, 'flat cation:');
    s += tg(300, 36, 'both faces open');
    /* one arrow to the pair: water adds to either face */
    s += arrow(P(396, 132), P(446, 132), { muted: true });
    const top = P(520, 106), bot = P(662, 106);
    s += centre(top, FROM_TOP);
    s += centre(bot, FROM_BOTTOM);
    s += dash(P(592, 36), P(592, 178));
    s += tg(520, 196, 'water from above: (S)');
    s += tg(662, 196, 'from below: (R)');
    s += tg(592, 216, '50 : 50, racemic', 'middle', 'fg-tag-good');

    s += rule(200, 236, 736, 236);
    /* lower route: SN2 with a good nucleophile */
    s += arrow(P(160, 252), P(238, 320));
    s += tg(250, 268, 'Nu⁻, acetone', 'start');
    s += tg(250, 282, 'SN2', 'start');
    const inv = P(420, 330);
    s += centre(inv, INVERTED);
    s += tg(420, 404, 'inverted: Nu enters opposite Br');
    return s;
  },
  caption: 'The same bromide down two routes. Compare where the new group ends up in each product.',
});

FIGURES.push({
  id: 'l-benzylic-stereo',
  lessons: ['benzylic-reactivity'],
  alt: 'Top: (R)-(1-bromoethyl)benzene. Middle, in water by SN1: the flat cation with an empty p orbital above and below, then the two products, (S)-1-phenylethanol from attack above and (R)-1-phenylethanol from attack below, in equal amounts. Bottom, with a strong nucleophile in acetone by SN2: the inverted product, with the nucleophile opposite where the bromine was.',
  viewBox: '0 0 340 776',
  build() {
    let s = '';
    s += centre(P(150, 76), RBROMIDE);
    s += tg(170, 160, '(R)-(1-bromoethyl)benzene');
    s += rule(12, 178, 328, 178);
    s += tg(170, 200, 'IN WATER: SN1');
    s += flatCation(P(120, 300));
    s += tg(276, 290, 'flat cation:', 'middle');
    s += tg(276, 304, 'both faces', 'middle');
    s += tg(276, 318, 'open', 'middle');
    s += centre(P(76, 470), FROM_TOP);
    s += centre(P(240, 470), FROM_BOTTOM);
    s += dash(P(166, 410), P(166, 530));
    s += tg(76, 552, 'from above: (S)');
    s += tg(240, 552, 'from below: (R)');
    s += tg(170, 572, '50 : 50, racemic', 'middle', 'fg-tag-good');
    s += rule(12, 592, 328, 592);
    s += tg(170, 614, 'Nu⁻ IN ACETONE: SN2');
    s += centre(P(170, 680), INVERTED);
    s += tg(170, 766, 'inverted');
    return s;
  },
  caption: 'The same bromide down two routes. Compare where the new group ends up in each product.',
});

/* ======================================================================
   6. NBS picks the benzylic hydrogen.
   ====================================================================== */
function ethylbenzene(cx, cy, R, withBr) {
  const h = hex(cx, cy, R);
  const b = at(h.v[1], 30, 34);
  const me = at(b, -30, 40);
  let s = h.s + bond(h.v[1], b, { rFrom: 0, rTo: 16 }) + bond(b, me, { rFrom: 16, rTo: 18 });
  s += atom(b.x, b.y, 'CH', { kind: 'hi', r: 16 }) + atom(me.x, me.y, 'CH₃', { r: 18 });
  return { s, b, me };
}

FIGURES.push({
  id: 'nbs-ethylbenzene',
  section: 'benzylic-reactivity',
  lessons: ['benzylic-reactivity'],
  anchor: 'with light or a radical initiator.</p>',
  alt: 'Top: ethylbenzene, with the benzylic carbon drawn as CH plus one highlighted hydrogen, that C-H labeled 87 kcal/mol, and the CH3 carbon labeled 101 kcal/mol for its C-H bonds. An arrow labeled NBS, light points down to (1-bromoethyl)benzene, with the bromine on the benzylic carbon.',
  viewBox: '0 0 340 360',
  build() {
    let s = '';
    s += tg(170, 18, 'C–H BOND STRENGTHS, kcal/mol');
    const top = ethylbenzene(70, 120, 28, false);
    s += top.s;
    const H = at(top.b, 90, 42);
    s += bond(top.b, H, { rFrom: 16, rTo: 12, cls: 'fg-bond-hi' }) + atom(H.x, H.y, 'H', { kind: 'hi', r: 12 });
    s += tg(H.x + 18, H.y + 4, 'benzylic C–H: 87', 'start', 'fg-tag-good');
    s += tg(top.me.x + 4, top.me.y + 34, 'C–H here: 101');
    s += lbl(274, 124, 'ethylbenzene');

    s += arrow(P(40, 166), P(40, 222));
    s += tg(54, 198, 'NBS, light', 'start');

    const bot = ethylbenzene(70, 306, 28, true);
    s += bot.s;
    const Br = at(bot.b, 90, 44);
    s += bond(bot.b, Br, { rFrom: 16, rTo: 16, cls: 'fg-bond-hi' }) + atom(Br.x, Br.y, 'Br', { kind: 'warn', r: 16 });
    s += tg(Br.x + 22, Br.y + 4, 'new C–Br bond', 'start');
    s += lbl(274, 302, '(1-bromoethyl)');
    s += lbl(274, 320, 'benzene');
    return s;
  },
  caption: 'Ethylbenzene with NBS and light. Only the benzylic hydrogen is replaced.',
});

/* ======================================================================
   7. Hydrogenolysis of a benzyl ether.
   ====================================================================== */
FIGURES.push({
  id: 'benzyl-ether-hydrogenolysis',
  section: 'benzylic-reactivity',
  lessons: ['benzylic-reactivity'],
  anchor: 'giving toluene and the free alcohol.</p>',
  alt: 'A benzyl ether, R-O-CH2 attached to a benzene ring, with the bond between the oxygen and the CH2 highlighted as the bond that breaks. An arrow labeled H2, Pd/C leads to R-OH plus toluene, CH3 attached to a benzene ring.',
  viewBox: '0 0 340 340',
  build() {
    let s = '';
    s += tg(170, 24, 'A BENZYL ETHER');
    const Rr = P(34, 84), O = P(94, 84), C = P(156, 84);
    s += bond(Rr, O, { rFrom: 15, rTo: 15 }) + atom(Rr.x, Rr.y, 'R');
    s += bond(O, C, { rFrom: 15, rTo: 17, cls: 'fg-bond-hi' });
    s += atom(O.x, O.y, 'O') + lonePair(O.x, O.y, -90) + lonePair(O.x, O.y, 90);
    s += atom(C.x, C.y, 'CH₂', { kind: 'hi', r: 17 });
    const h = hex(C.x + 17 + 14 + 28, 84, 28, [0, 2, 4], { rot: 180 });
    s += h.s + bond(C, h.v[0], { rFrom: 17, rTo: 0 });
    s += dash(P(125, 92), P(125, 128), 'fg-dash-hi');
    s += tg(125, 144, 'this C–O bond breaks', 'middle', 'fg-tag-warn');

    s += arrow(P(170, 162), P(170, 214));
    s += tg(184, 192, 'H₂, Pd/C', 'start');

    const Rp = P(34, 262), Op = P(94, 262);
    s += bond(Rp, Op, { rFrom: 15, rTo: 16 }) + atom(Rp.x, Rp.y, 'R') + atom(Op.x, Op.y, 'OH', { r: 16 });
    s += lbl(64, 316, 'the alcohol');
    s += lbl(136, 267, '+');
    const Cm = P(180, 262);
    s += atom(Cm.x, Cm.y, 'CH₃', { r: 18 });
    const h2 = hex(Cm.x + 18 + 14 + 28, 262, 28, [0, 2, 4], { rot: 180 });
    s += h2.s + bond(Cm, h2.v[0], { rFrom: 18, rTo: 0 });
    s += lbl(240, 316, 'toluene');
    return s;
  },
  caption: 'R stands for the rest of the alcohol. The highlighted bond is the one that breaks.',
});

/* ======================================================================
   8. Hot permanganate cuts any side chain with a benzylic H.
   ====================================================================== */
/* A substrate row: ring plus side chain, the benzylic carbon a labeled
   disc. kind: 'me' | 'pr' | 'ipr' | 'tbu'. */
function alkylbenzene(cx, cy, R, kind) {
  const h = hex(cx, cy, R, [0, 2, 4], { rot: 0 });
  const lab = { me: 'CH₃', pr: 'CH₂', ipr: 'CH', tbu: 'C' }[kind];
  const rr = lab.length >= 3 ? 17 : 15;
  const b = h.out(0, 28 + (rr - 15));
  let s = h.s + bond(h.v[0], b, { rFrom: 0, rTo: rr });
  const cut = (a, e) => {
    const m = mid(a, e), dx = e.x - a.x, dy = e.y - a.y, L = Math.hypot(dx, dy);
    const px = -dy / L, py = dx / L;
    return dash(P(m.x + px * 11, m.y + py * 11), P(m.x - px * 11, m.y - py * 11), 'fg-dash-hi');
  };
  if (kind === 'pr') {
    const c2 = at(b, -30, 34), c3 = at(c2, 30, 30);
    s += bond(b, c2, { rFrom: rr, rTo: 0 }) + skb(c2, c3);
    s += cut(at(b, -30, rr), c2);
  }
  if (kind === 'ipr') {
    for (const d of [60, -60]) {
      const m = at(b, d, 32);
      s += bond(b, m, { rFrom: rr, rTo: 0 }) + cut(at(b, d, rr), m);
    }
  }
  if (kind === 'tbu') for (const d of [60, 0, -60]) s += bond(b, at(b, d, 30), { rFrom: rr, rTo: 0 });
  s += atom(b.x, b.y, lab, { kind: kind === 'tbu' ? 'warn' : 'hi', r: rr });
  return s;
}
/* Benzoic acid; rot 0 hangs the carboxyl off the right-hand vertex, rot 90
   off the top one. o.nitro puts NO2 on that vertex. */
function benzoicAcid(cx, cy, R, o = {}) {
  const rot = o.rot ?? 90;
  const h = hex(cx, cy, R, [0, 2, 4], { rot });
  const c = h.out(0, 28);
  const O = at(c, rot + 60, 30), OH = at(c, rot - 60, 32);
  let s = h.s + skb(h.v[0], c);
  s += bond(c, O, { rFrom: 0, rTo: 13, order: 2, gap: 3.4 }) + atom(O.x, O.y, 'O', { r: 13 });
  s += bond(c, OH, { rFrom: 0, rTo: 15 }) + atom(OH.x, OH.y, 'OH', { r: 15 });
  if (o.nitro !== undefined) {
    const n = h.out(o.nitro, 28);
    s += bond(h.v[o.nitro], n, { rFrom: 0, rTo: 17 }) + atom(n.x, n.y, 'NO₂', { r: 17 });
  }
  return s;
}
const italTert = (svg) => svg.replace(/>tert-/, '><tspan font-style="italic">tert</tspan>-');

FIGURES.push({
  id: 'side-chain-cut',
  section: 'benzylic-reactivity',
  anchor: 'is cut back to a single carbon and oxidized to <b>&ndash;COOH</b>.</p>',
  alt: 'Four alkylbenzenes, each with its benzylic carbon labeled: toluene (CH3), propylbenzene (CH2), isopropylbenzene (CH) and tert-butylbenzene (C, no hydrogen). Dashed marks cut every bond past the benzylic carbon. The first three each give benzoic acid with hot KMnO4 and then acid; tert-butylbenzene gives no reaction.',
  viewBox: '0 0 760 460',
  build() {
    let s = '';
    s += tg(140, 24, 'ALKYLBENZENE');
    s += tg(370, 24, 'HOT KMnO₄, THEN H₃O⁺');
    s += tg(600, 24, 'PRODUCT');
    s += rule(24, 36, 736, 36);
    const rows = [
      ['me', 'toluene'],
      ['pr', 'propylbenzene'],
      ['ipr', 'isopropylbenzene'],
      ['tbu', 'tert-butylbenzene'],
    ];
    rows.forEach(([kind, name], i) => {
      const y = 84 + i * 102;
      s += alkylbenzene(96, y, 24, kind);
      s += italTert(tg(120, y + 44, name));
      if (kind !== 'tbu') {
        s += arrow(P(300, y), P(440, y));
        s += benzoicAcid(530, y, 24, { rot: 0 });
        s += tg(620, y + 5, 'benzoic acid', 'start');
      } else {
        s += arrow(P(300, y), P(440, y), { muted: true });
        s += tg(370, y - 10, 'no benzylic H', 'middle', 'fg-tag-warn');
        s += lbl(620, y + 5, 'no reaction', 'start');
      }
    });
    return s;
  },
  caption: 'The benzylic carbon is the labeled disc; count its hydrogens. Dashed marks show the bonds the oxidation cuts.',
});

FIGURES.push({
  id: 'l-side-chain-cut',
  lessons: ['benzylic-reactivity'],
  alt: 'Three alkylbenzenes, each with its benzylic carbon labeled: toluene (CH3), propylbenzene (CH2) and tert-butylbenzene (C, no hydrogen). Toluene and propylbenzene each give benzoic acid with hot KMnO4 and then acid; the dashed mark on propylbenzene cuts the bond past the benzylic carbon. tert-Butylbenzene gives no reaction.',
  viewBox: '0 0 340 390',
  build() {
    let s = '';
    s += tg(170, 20, 'HOT KMnO₄, THEN H₃O⁺');
    const rows = [['me', 'toluene'], ['pr', 'propylbenzene'], ['tbu', 'tert-butylbenzene']];
    rows.forEach(([kind, name], i) => {
      const y = 82 + i * 120;
      s += alkylbenzene(40, y, 18, kind);
      s += italTert(tg(74, y + 44, name));
      if (kind !== 'tbu') {
        s += arrow(P(168, y), P(208, y));
        s += benzoicAcid(242, y, 18, { rot: 0 });
        s += tg(262, y + 62, 'benzoic acid');
      } else {
        s += arrow(P(168, y), P(208, y), { muted: true });
        s += lbl(270, y + 5, 'no reaction');
      }
    });
    return s;
  },
  caption: 'The benzylic carbon is the labeled disc; count its hydrogens.',
});

/* ======================================================================
   9. The worked example's route, and the meta route for contrast.
   ====================================================================== */
function toluene(cx, cy, R, nitro) {
  const h = hex(cx, cy, R);
  const m = h.out(0, 30);
  let s = h.s + bond(h.v[0], m, { rFrom: 0, rTo: 17 }) + atom(m.x, m.y, 'CH₃', { r: 17 });
  if (nitro !== undefined) {
    const n = h.out(nitro, 28);
    s += bond(h.v[nitro], n, { rFrom: 0, rTo: 17 }) + atom(n.x, n.y, 'NO₂', { r: 17 });
  }
  return s;
}

FIGURES.push({
  id: 'nitrobenzoic-route',
  section: 'benzylic-reactivity',
  anchor: 'each step is blocked by the one that would otherwise precede it.</p>',
  alt: 'Benzene, then CH3Cl and AlCl3 to toluene, then HNO3 and H2SO4 to 4-nitrotoluene with the nitro group para to the methyl, then hot KMnO4 followed by H3O+ to 4-nitrobenzoic acid.',
  viewBox: '0 0 760 230',
  build() {
    let s = '';
    const y = 130, xs = [70, 266, 468, 668];
    s += hex(xs[0], y, 26).s;
    s += toluene(xs[1], y, 26);
    s += toluene(xs[2], y, 26, 3);
    s += benzoicAcid(xs[3], y, 26, { nitro: 3 });
    const reag = [['CH₃Cl', 'AlCl₃'], ['HNO₃', 'H₂SO₄'], ['hot KMnO₄', 'then H₃O⁺']];
    for (let i = 0; i < 3; i++) {
      const a = xs[i] + 44, b = xs[i + 1] - 44;
      s += arrow(P(a, y), P(b, y));
      s += tg((a + b) / 2, y - 26, reag[i][0]);
      s += tg((a + b) / 2, y - 12, reag[i][1]);
    }
    const names = ['benzene', 'toluene', '4-nitrotoluene', '4-nitrobenzoic acid'];
    names.forEach((n, i) => { s += tg(xs[i], 218, n); });
    s += tg(xs[2], 34, 'para to CH₃;', 'middle', 'fg-tag-mut');
    s += tg(xs[2], 48, 'ortho isomer separated off', 'middle', 'fg-tag-mut');
    return s;
  },
  caption: 'The route in the order it is run. The methyl goes on first and becomes the carboxyl last.',
});

FIGURES.push({
  id: 'l-meta-route',
  lessons: ['benzylic-reactivity'],
  alt: 'Toluene, then hot KMnO4 followed by H3O+ to benzoic acid, then HNO3 and H2SO4 to 3-nitrobenzoic acid, with the nitro group meta to the carboxyl.',
  viewBox: '0 0 340 500',
  build() {
    let s = '';
    s += toluene(100, 80, 24);
    s += lbl(190, 84, 'toluene', 'start');
    s += arrow(P(100, 118), P(100, 164));
    s += tg(114, 138, 'hot KMnO₄,', 'start');
    s += tg(114, 152, 'then H₃O⁺', 'start');
    s += benzoicAcid(100, 262, 24);
    s += lbl(190, 266, 'benzoic acid', 'start');
    s += arrow(P(100, 300), P(100, 346));
    s += tg(114, 328, 'HNO₃, H₂SO₄', 'start');
    s += benzoicAcid(100, 444, 24, { nitro: 2 });
    s += lbl(190, 440, '3-nitrobenzoic', 'start');
    s += lbl(190, 458, 'acid', 'start');
    return s;
  },
  caption: 'Oxidize first, and the carboxyl directs the nitro group meta.',
});

export default FIGURES;
