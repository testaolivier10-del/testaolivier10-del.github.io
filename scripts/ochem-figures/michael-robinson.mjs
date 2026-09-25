/* Figures for the michael-robinson notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   One numbering runs through every Robinson figure on this page: the six
   atoms of the NEW ring are 1 to 6, in the order they end up around it.
     1  the donor's carbonyl carbon (the one the aldol attacks later)
     2  the donor's alpha carbon (it makes the Michael bond)
     3  the acceptor's beta carbon (the CH2 end of methyl vinyl ketone)
     4  the acceptor's alpha carbon
     5  the acceptor's carbonyl carbon
     6  the acceptor's methyl carbon (the alpha-prime carbon)
   So the Michael bond is 2-3, the aldol bond is 6-1, the new C=C is 1=6,
   and the two carbonyls of the Michael product sit at 1 and 5: the 1,5 in
   "1,5-dicarbonyl" is these same numbers. They are not IUPAC locants.

   The old robinson-mechanism figure used diethyl malonate as the donor. Its
   adduct with MVK has no second ketone to take an aldol, so the ring could
   not form. The donors here are cyclohexanone, 2-methylcyclohexane-1,3-dione
   and acetone, which all can.

   Every panel is 320 wide (the retrosynthesis panels 160), so the notes
   figures lay panels side by side and the lesson copies stack the same
   panels, drawn by the same functions. Only fg-lbl and fg-tag text is used,
   so any panel can go into a lesson. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];
const PW = 320;
const SQ3 = Math.sqrt(3);

/* ------------------------------------------------------------ helpers --- */
/* An atom with a label, sized to it (fg-lbl is 13px, about 8px a letter and
   less for a subscript or charge). */
const A = (x, y, lbl, kind = 'plain', r) => {
  const small = (lbl.match(/[₀-₉⁺⁻]/g) || []).length;
  return { x, y, lbl, kind, r: r ?? Math.max(14, Math.ceil((lbl.length - small) * 4.2 + small * 2.6 + 6)) };
};
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.lbl, { kind: a.kind, r: a.r })).join('');
/* A bond between two atoms or vertices; a bare point {x, y} counts as a
   skeletal vertex with nothing to trim. */
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r || 0, rTo: b.r || 0, ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const toward = (a, b, d) => { const L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return P(a.x + (b.x - a.x) / L * d, a.y + (b.y - a.y) / L * d); };
const polar = (c, deg, r) => P(c.x + r * Math.cos(deg * Math.PI / 180), c.y - r * Math.sin(deg * Math.PI / 180));
const num = (x, y, s, cls = 'fg-tag-good') => text(x, y + 4, s, { cls, size: 11 });
/* A number set a distance d from vertex p, toward c (a ring centre). */
const numIn = (p, c, s, d = 15, cls) => { const q = toward(p, c, d); return num(q.x, q.y, s, cls); };
const dash = (a, b, cls = 'fg-dash-hi') => {
  const p = toward(a, b, a.r || 0), q = toward(b, a, b.r || 0);
  return `<line class="${cls}" x1="${p.x.toFixed(2)}" y1="${p.y.toFixed(2)}" x2="${q.x.toFixed(2)}" y2="${q.y.toFixed(2)}"></line>`;
};
/* C=O drawn from a skeletal vertex p along screen angle deg. */
const carbonyl = (p, deg, len = 40) => { const q = polar(p, deg, len); const O = A(q.x, q.y, 'O'); return bd(p, O, { order: 2 }) + draw(O); };
const frame = (ox, oy, w, h, title, kind) => panel(ox, oy, w, h, kind ? { kind } : {}) + tag(ox + w / 2, oy + 20, title);
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 7 });
const right = (y, x1, x2) => arrow(P(x1, y), P(x2, y), { size: 7 });
/* A retrosynthesis arrow, read "is made from": two lines and an open head. */
const retro = (x, y, w = 18) =>
  `<line class="fg-bond" x1="${x}" y1="${y - 3}" x2="${x + w - 5}" y2="${y - 3}"></line>` +
  `<line class="fg-bond" x1="${x}" y1="${y + 3}" x2="${x + w - 5}" y2="${y + 3}"></line>` +
  `<path class="fg-bond" d="M${x + w - 9} ${y - 8} L${x + w} ${y} L${x + w - 9} ${y + 8}"></path>`;

/* Two six-membered rings drawn as they will be once fused: ring A (the
   donor's ring) on the left, ring B (the ring being built) on the right,
   sharing the vertical edge 1-2. */
function fused(ox, oy, cy = 128, r = 48, cxA = 84) {
  const cA = P(ox + cxA, oy + cy), cB = P(ox + cxA + r * SQ3, oy + cy);
  const g = { cA, cB };
  g.a90 = polar(cA, 90, r); g.a150 = polar(cA, 150, r); g.a210 = polar(cA, 210, r); g.a270 = polar(cA, 270, r);
  g.c1 = polar(cA, 30, r); g.c2 = polar(cA, 330, r);
  g.c3 = polar(cB, 270, r); g.c4 = polar(cB, 330, r); g.c5 = polar(cB, 30, r); g.c6 = polar(cB, 90, r);
  g.ringA = () => sk(g.a90, g.a150) + sk(g.a150, g.a210) + sk(g.a210, g.a270) + sk(g.a270, g.c2) + sk(g.c2, g.c1) + sk(g.c1, g.a90);
  g.nums = (which = [1, 2, 3, 4, 5, 6], d = 15) => which.map((i) => numIn(g['c' + i], cB, String(i), d)).join('');
  return g;
}

/* ============================================ the Michael mechanism ===== */
const MH = 232;

/* 1 · ethoxide takes a proton from the middle carbon of pentane-2,4-dione. */
function mDeprot(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, PW, MH, '1 · ethoxide takes an H from the middle');
  const C3 = A(ox + 176, oy + 116, 'CH', 'hi'), H = A(ox + 176, oy + 164, 'H', 'warn', 12);
  const c2 = o(136, 93), c4 = o(216, 93), c1 = o(98, 116), c5 = o(254, 116);
  const B = A(ox + 62, oy + 172, 'EtO⁻');
  s += sk(c1, c2) + bd(c2, C3) + bd(C3, c4) + sk(c4, c5);
  s += carbonyl(c2, 90) + carbonyl(c4, 90);
  s += bd(C3, H, { cls: 'fg-bond-hi' });
  s += lonePair(B.x, B.y, 0, { dist: B.r + 5 });
  s += draw(C3, H, B);
  s += curve(o(92, 170), o(160, 168), { bow: -14 });
  s += curve(o(183, 146), o(194, 126), { bow: 9 });
  s += tag(ox + PW / 2, oy + 218, 'that H sits between two C=O groups');
  return s;
}

/* 2 · the anion adds to the beta carbon of methyl vinyl ketone. */
function mAdd(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, PW, MH, '2 · the anion adds to the β carbon', 'hi');
  const D = A(ox + 82, oy + 124, 'C⁻', 'hi'), DH = A(ox + 82, oy + 76, 'H', 'plain', 12);
  const Ac1 = A(ox + 36, oy + 92, 'CH₃CO'), Ac2 = A(ox + 36, oy + 172, 'CH₃CO');
  const Cb = A(ox + 152, oy + 124, 'CH₂', 'warn'), Ca = A(ox + 198, oy + 150, 'CH');
  const Cc = A(ox + 244, oy + 124, 'C'), Ox = A(ox + 244, oy + 76, 'O'), Me = A(ox + 290, oy + 150, 'CH₃');
  s += bd(D, DH) + bd(D, Ac1) + bd(D, Ac2);
  s += bd(Cb, Ca, { order: 2 }) + bd(Ca, Cc) + bd(Cc, Ox, { order: 2 }) + bd(Cc, Me);
  s += lonePair(D.x, D.y, 0, { dist: D.r + 6 });
  s += draw(D, DH, Ac1, Ac2, Cb, Ca, Cc, Ox, Me);
  s += curve(o(106, 121), o(131, 120), { bow: -8 });
  s += curve(mid(Cb, Ca), mid(Ca, Cc), { bow: -16 });
  s += curve(mid(Cc, Ox), o(262, 66), { bow: 10 });
  s += tag(ox + 152, oy + 96, 'β');
  s += tag(ox + 198, oy + 184, 'α');
  s += tag(ox + PW / 2, oy + 218, 'the π electrons move up onto O');
  return s;
}

/* 3 · the enolate that forms takes a proton on carbon. */
function mProt(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, PW, MH, '3 · the enolate picks up a proton');
  const R = A(ox + 40, oy + 150, 'R');
  const Cb = A(ox + 92, oy + 124, 'CH₂'), Ca = A(ox + 144, oy + 150, 'CH', 'hi');
  const Cc = A(ox + 196, oy + 124, 'C'), Om = A(ox + 196, oy + 76, 'O⁻', 'warn'), Me = A(ox + 248, oy + 150, 'CH₃');
  const H = A(ox + 144, oy + 192, 'H', 'warn', 12), OEt = A(ox + 206, oy + 192, 'OEt');
  s += bd(R, Cb) + bd(Cb, Ca) + bd(Ca, Cc, { order: 2 }) + bd(Cc, Om) + bd(Cc, Me) + bd(H, OEt);
  s += draw(R, Cb, Ca, Cc, Om, Me, H, OEt);
  s += curve(mid(Ca, Cc), o(154, 178), { bow: 14 });
  s += curve(mid(H, OEt), o(197, 178), { bow: -10 });
  s += tag(ox + 64, oy + 60, 'R = (CH₃CO)₂CH', { anchor: 'start' });
  s += tag(ox + PW / 2, oy + 222, 'ethanol puts an H on the α carbon');
  return s;
}

/* 4 · the product: pentane-2,4-dione joined to MVK, a 1,5-dicarbonyl. */
function mProduct(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, PW, MH, '4 · the product: a 1,5-dicarbonyl', 'good');
  const m1 = o(48, 116), c1 = o(84, 94), c2 = o(120, 116), c3 = o(156, 94), c4 = o(192, 116), c5 = o(228, 94), c6 = o(264, 116);
  const ca = o(120, 156), ma = o(154, 178);
  s += sk(m1, c1) + sk(c1, c2) + sk(c2, c3, true) + sk(c3, c4) + sk(c4, c5) + sk(c5, c6) + sk(c2, ca) + sk(ca, ma);
  s += carbonyl(c1, 90) + carbonyl(c5, 90) + carbonyl(ca, 214, 38);
  s += num(c1.x, c1.y + 20, '1') + num(c2.x + 14, c2.y + 18, '2') + num(c3.x, c3.y - 16, '3') + num(c4.x, c4.y + 18, '4') + num(c5.x, c5.y + 20, '5');
  s += tag(ox + 244, oy + 168, 'new bond: 2–3', { cls: 'fg-tag-good' });
  s += tag(ox + PW / 2, oy + 218, 'C=O at 1 and 5, three carbons between');
  return s;
}

FIGURES.push({
  id: 'michael-mechanism',
  section: 'michael-robinson',
  anchor: '<h3>The Michael reaction</h3>',
  viewBox: '0 0 688 500',
  alt: 'Four panels. 1: ethoxide removes a proton from the middle CH2 of pentane-2,4-dione, the carbon between the two C=O groups. 2: the resulting carbanion adds to the CH2 end (the beta carbon) of methyl vinyl ketone; the C=C pi electrons shift toward the carbonyl and the C=O pi electrons move onto oxygen. 3: the enolate that forms takes a proton from ethanol on its alpha carbon. 4: the product, 3-acetylheptane-2,6-dione, with the carbons numbered 1 to 5 from one C=O carbon to the other; the new bond is between carbons 2 and 3.',
  build() {
    let s = mDeprot(12, 6) + mAdd(356, 6) + mProt(12, 262) + mProduct(356, 262);
    s += right(122, 335, 354) + right(378, 335, 354);
    return s;
  },
  caption: 'Pentane-2,4-dione and methyl vinyl ketone with ethoxide. In panel 2, the first arrow makes the new C–C bond at the β carbon, and the next two pass the electrons along to the oxygen.',
});

FIGURES.push({
  id: 'l-michael-steps',
  lessons: ['michael-robinson'],
  viewBox: '0 0 340 494',
  alt: 'Two stacked panels. Top: the anion of pentane-2,4-dione adds to the CH2 end (the beta carbon) of methyl vinyl ketone; the C=C pi electrons shift toward the carbonyl and the C=O pi electrons move onto oxygen. Bottom: the product after protonation, 3-acetylheptane-2,6-dione, with carbons 1 to 5 numbered from one C=O carbon to the other; the new bond is 2–3.',
  build() {
    return mAdd(10, 6) + down(170, 242, 258) + mProduct(10, 258);
  },
  caption: 'Top: the new bond forms at the β carbon. Bottom: count from one C=O carbon to the other.',
});

/* ===================================== the spacing of three products === */
function spacingFig() {
  let s = '';
  const dx = 26, dy = 15;
  const zz = (y, n, upOdd = true) => Array.from({ length: n }, (_, i) => P(22 + i * dx, y + ((i % 2 === 1) === upOdd ? -dy : 0)));
  const chain = (p, from, to) => { let t = ''; for (let i = from; i < to; i++) t += sk(p[i], p[i + 1]); return t; };
  const names = (y, t1, t2) => text(272, y - 18, t1, { cls: 'fg-lbl', size: 13 }) + text(272, y + 2, t2, { cls: 'fg-tag-good', size: 11 });
  const nUp = (p, s2) => num(p.x, p.y + 18, s2);
  const nDn = (p, s2) => num(p.x, p.y + 16, s2);

  /* Aldol: 3-hydroxybutanal, O=CH-CH2-CH(OH)-CH3. Vertices 0 and 2 up. */
  {
    const p = zz(84, 4, false);
    const OH = A(p[2].x, p[2].y - 40, 'OH', 'hi');
    s += chain(p, 0, 3) + carbonyl(p[0], 90) + bd(p[2], OH) + draw(OH);
    s += nUp(p[0], '1') + nDn(p[1], '2') + nUp(p[2], '3');
    s += names(84, 'aldol', 'C=O and OH at 1,3');
  }
  /* Claisen: ethyl 3-oxobutanoate, CH3-CO-CH2-CO-O-CH2CH3. */
  {
    const p = zz(196, 7);
    const Oe = A(p[4].x, p[4].y, 'O');
    s += chain(p, 0, 3) + bd(p[3], Oe) + bd(Oe, p[5]) + sk(p[5], p[6]) + carbonyl(p[1], 90) + carbonyl(p[3], 90) + draw(Oe);
    s += nUp(p[1], '1') + nDn(p[2], '2') + nUp(p[3], '3');
    s += names(196, 'Claisen', 'two C=O at 1,3');
  }
  /* Michael: heptane-2,6-dione, CH3-CO-CH2CH2CH2-CO-CH3. */
  {
    const p = zz(308, 7);
    s += chain(p, 0, 6) + carbonyl(p[1], 90) + carbonyl(p[5], 90);
    s += nUp(p[1], '1') + nDn(p[2], '2') + nUp(p[3], '3') + nDn(p[4], '4') + nUp(p[5], '5');
    s += names(308, 'Michael', 'two C=O at 1,5');
  }
  return s;
}

FIGURES.push({
  id: 'condensation-spacing',
  section: 'michael-robinson',
  lessons: ['michael-robinson'],
  anchor: '<h3>Recognize the product by counting</h3>',
  viewBox: '0 0 340 336',
  alt: 'Three products drawn in skeletal form, each with its carbons numbered from one oxygen-bearing carbon to the other. Aldol: 3-hydroxybutanal, with the C=O carbon 1 and the C–OH carbon 3. Claisen: ethyl 3-oxobutanoate, with the ketone carbon 1 and the ester carbon 3. Michael: heptane-2,6-dione, with the two C=O carbons at 1 and 5.',
  build() { return spacingFig(); },
  caption: 'Start at one carbon that carries oxygen and count to the other. An aldol and a Claisen both give 1,3, and the second oxygen tells them apart. A Michael gives 1,5.',
});

/* ================================= the lesson's sorting exercise ======= */
FIGURES.push({
  id: 'l-spacing-sort',
  lessons: ['michael-robinson'],
  viewBox: '0 0 340 330',
  alt: 'Three molecules to sort, in skeletal form. A: ethyl 5-oxohexanoate, a ketone and an ester with three CH2 groups between their carbonyl carbons. B: 4-hydroxy-4-methylpentan-2-one, a ketone with an OH on the carbon two positions along. C: ethyl 2-methyl-3-oxopentanoate, a ketone and an ester with one carbon, carrying a methyl, between their carbonyl carbons.',
  build() {
    const dx = 28, dy = 16;
    let s = '';
    const zz = (x0, y0, n, upOdd = true) => Array.from({ length: n }, (_, i) => P(x0 + i * dx, y0 + ((i % 2 === 1) === upOdd ? -dy : 0)));
    const chain = (p, from, to) => { let t = ''; for (let i = from; i < to; i++) t += sk(p[i], p[i + 1]); return t; };
    /* An ester's O-CH2-CH3 tail after the carbonyl vertex k. */
    const tail = (p, k) => { const Oe = A(p[k + 1].x, p[k + 1].y, 'O'); return bd(p[k], Oe) + bd(Oe, p[k + 2]) + sk(p[k + 2], p[k + 3]) + draw(Oe); };
    const letter = (y, L) => text(16, y, L, { cls: 'fg-lbl', size: 13, anchor: 'start' });

    /* A: ethyl 5-oxohexanoate, CH3-CO-CH2-CH2-CH2-CO-O-CH2-CH3. */
    { const p = zz(58, 90, 9); s += letter(56, 'A') + chain(p, 0, 5) + carbonyl(p[1], 90) + carbonyl(p[5], 90) + tail(p, 5); }
    /* B: 4-hydroxy-4-methylpentan-2-one, CH3-CO-CH2-C(OH)(CH3)-CH3. */
    {
      const p = zz(86, 196, 5);
      const OH = A(p[3].x - 18, p[3].y - 34, 'OH');
      s += letter(162, 'B') + chain(p, 0, 4) + carbonyl(p[1], 90) + bd(p[3], OH) + draw(OH) + sk(p[3], polar(p[3], 50, 28));
    }
    /* C: ethyl 2-methyl-3-oxopentanoate, CH3-CH2-CO-CH(CH3)-CO-O-CH2-CH3. */
    {
      const p = zz(58, 296, 8, false);
      s += letter(262, 'C') + chain(p, 0, 4) + carbonyl(p[2], 90) + carbonyl(p[4], 90) + tail(p, 4) + sk(p[3], P(p[3].x, p[3].y + 28));
    }
    return s;
  },
  caption: 'Find the two carbons that carry oxygen in each molecule, then count the gap.',
});

/* ========================================== the Robinson annulation ==== */
const RH = 236;

/* 1 · Michael: the cyclohexanone anion adds to methyl vinyl ketone. Shared
   with the dione version below through `dione`. */
function rMichael(ox, oy, dione = false) {
  const o = (x, y) => P(ox + x, oy + y);
  const title = dione ? '1 · Michael: the dione’s C2 adds to MVK' : '1 · Michael: carbon 2 adds to carbon 3';
  let s = frame(ox, oy, PW, RH, title);
  const c = o(58, 122);
  const v = (deg) => polar(c, deg, 36);
  const C1 = v(30), C2 = A(v(330).x, v(330).y, dione ? 'C⁻' : 'CH⁻', 'hi');
  s += sk(v(90), v(150)) + sk(v(150), v(210)) + sk(v(210), v(270)) + bd(v(270), C2) + bd(C2, C1) + sk(C1, v(90));
  s += carbonyl(C1, 30);
  if (dione) {
    s += carbonyl(v(270), 270, 38);
    const Me = A(C2.x + 20, C2.y + 36, 'CH₃');
    s += bd(C2, Me) + draw(Me);
  }
  const C3 = A(ox + 160, oy + 150, 'CH₂', 'warn'), C4 = A(ox + 206, oy + 124, 'CH');
  const C5 = A(ox + 252, oy + 150, 'C'), O5 = A(ox + 252, oy + 102, 'O'), C6 = A(ox + 294, oy + 124, 'CH₃');
  s += bd(C3, C4, { order: 2 }) + bd(C4, C5) + bd(C5, O5, { order: 2 }) + bd(C5, C6);
  const ang = Math.atan2(C3.y - C2.y, C3.x - C2.x) * 180 / Math.PI;
  s += lonePair(C2.x, C2.y, ang, { dist: C2.r + 6 });
  s += draw(C2, C3, C4, C5, O5, C6);
  const lp = P(C2.x + Math.cos(ang * Math.PI / 180) * (C2.r + 9), C2.y + Math.sin(ang * Math.PI / 180) * (C2.r + 9));
  s += curve(lp, toward(C3, C2, C3.r + 2), { bow: -8 });
  s += curve(mid(C3, C4), mid(C4, C5), { bow: 16 });
  s += curve(mid(C5, O5), o(270, 92), { bow: 10 });
  s += numIn(C1, c, '1', 15) + numIn(C2, c, '2', 24);
  s += num(C3.x, C3.y + 28, '3') + num(C4.x, C4.y - 26, '4') + num(C5.x, C5.y + 28, '5') + num(C6.x, C6.y + 28, '6');
  s += tag(ox + PW / 2, oy + 224, dione ? '2-methylcyclohexane-1,3-dione + MVK' : 'cyclohexanone anion + methyl vinyl ketone');
  return s;
}

/* 2 · the Michael product, drawn curled the way it will close. */
function rAdduct(ox, oy) {
  let s = frame(ox, oy, PW, RH, '2 · the 1,5-dicarbonyl, curled round');
  const g = fused(ox, oy, 128);
  s += g.ringA() + sk(g.c2, g.c3, true) + sk(g.c3, g.c4) + sk(g.c4, g.c5) + sk(g.c5, g.c6);
  s += carbonyl(g.c1, 90, 40) + carbonyl(g.c5, 30);
  s += g.nums();
  s += tag(ox + 262, oy + 58, 'carbon 6:');
  s += tag(ox + 262, oy + 74, 'the α′ carbon');
  s += tag(ox + PW / 2, oy + 224, 'C=O at 1 and 5, three carbons between');
  return s;
}

/* 3 · the aldol: an anion on carbon 6 attacks carbonyl carbon 1. */
function rAldol(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frame(ox, oy, PW, RH, '3 · aldol: carbon 6 attacks carbon 1', 'hi');
  const g = fused(ox, oy, 128);
  const C6 = A(g.c6.x, g.c6.y, 'CH₂⁻', 'hi');
  s += g.ringA() + sk(g.c2, g.c3) + sk(g.c3, g.c4) + sk(g.c4, g.c5) + bd(g.c5, C6);
  const O1 = A(g.c1.x, g.c1.y - 40, 'O');
  s += bd(g.c1, O1, { order: 2 }) + carbonyl(g.c5, 30);
  s += dash(C6, g.c1);
  s += lonePair(C6.x, C6.y, 180, { dist: C6.r + 5 });
  s += draw(C6, O1);
  s += curve(P(C6.x - C6.r - 9, C6.y + 1), toward(g.c1, C6, 4), { bow: -12 });
  s += curve(mid(g.c1, O1), P(O1.x - 17, O1.y + 4), { bow: 10 });
  s += g.nums([1, 2, 3, 4, 5]) + numIn(g.c6, g.cB, '6', 28);
  s += tag(ox + PW / 2, oy + 224, 'the dashed bond closes a ring of six');
  void o;
  return s;
}

/* 4 · the beta-hydroxy ketone, with the H and OH that leave marked. */
function rKetol(ox, oy) {
  let s = frame(ox, oy, PW, RH, '4 · the β-hydroxy ketone');
  const g = fused(ox, oy, 132);
  s += g.ringA() + sk(g.c2, g.c3) + sk(g.c3, g.c4) + sk(g.c4, g.c5) + sk(g.c5, g.c6) + sk(g.c6, g.c1, true);
  const OH = A(g.c1.x, g.c1.y - 38, 'OH', 'warn'), H = A(g.c6.x, g.c6.y - 34, 'H', 'warn', 12);
  s += bd(g.c1, OH) + bd(g.c6, H) + carbonyl(g.c5, 30) + draw(OH, H);
  s += g.nums();
  s += tag(ox + PW / 2, oy + 210, 'E1cb: base takes the H on 6,');
  s += tag(ox + PW / 2, oy + 226, 'then HO⁻ leaves carbon 1');
  return s;
}

/* 5 · the enone. */
function rEnone(ox, oy) {
  let s = frame(ox, oy, PW, RH, '5 · the product: a cyclohexenone', 'good');
  const g = fused(ox, oy, 128);
  s += g.ringA() + sk(g.c2, g.c3) + sk(g.c3, g.c4) + sk(g.c4, g.c5) + sk(g.c5, g.c6) + ringDouble(g.c6, g.c1, g.cB, { inset: 9, cls: 'fg-bond-hi' });
  s += carbonyl(g.c5, 30);
  s += g.nums([1, 2, 3, 4, 5, 6], 17);
  s += tag(ox + PW / 2, oy + 224, 'C=C between 1 and 6, conjugated with C=O 5');
  return s;
}

/* 6 · every bond made and broken, by number. */
function rLedger(ox, oy) {
  let s = frame(ox, oy, PW, RH, 'every bond, by number');
  const L = (y, t, cls = 'fg-tag') => text(ox + 22, oy + y, t, { cls, size: 11, anchor: 'start' });
  s += L(56, 'made', 'fg-tag-good');
  s += L(78, '2–3   C–C, by the Michael');
  s += L(98, '6–1   C–C, by the aldol');
  s += L(118, '1=6   the π bond, by the dehydration');
  s += L(150, 'broken', 'fg-tag-warn');
  s += L(172, 'one C–H on 2 and two C–H on 6');
  s += L(192, 'the π bonds 3=4 and 1=O');
  s += L(212, 'the C–O bond on 1, as water leaves');
  return s;
}

FIGURES.push({
  id: 'robinson-annulation',
  section: 'michael-robinson',
  anchor: '<h3>The Robinson annulation</h3>',
  viewBox: '0 0 688 760',
  alt: 'Six panels. The atoms of the new ring are numbered 1 to 6 throughout. 1: the anion of cyclohexanone, at ring carbon 2, adds to the CH2 end (carbon 3) of methyl vinyl ketone, whose carbons are numbered 3, 4, 5 (the C=O carbon) and 6 (the methyl). 2: the Michael product, 2-(3-oxobutyl)cyclohexanone, drawn curled so that its side chain lies where the new ring will be; the C=O carbons are 1 and 5, and carbon 6 is the alpha-prime carbon. 3: an anion on carbon 6 attacks carbonyl carbon 1, a dashed line marking the bond that forms, and the C=O electrons move onto oxygen. 4: the beta-hydroxy ketone, with the OH on carbon 1 and an H on carbon 6 marked. 5: the product after dehydration, with a C=C between carbons 1 and 6 conjugated with the C=O at 5. 6: a list of the bonds made and broken, by number.',
  build() {
    let s = rMichael(12, 6) + rAdduct(356, 6) + rAldol(12, 262) + rKetol(356, 262) + rEnone(12, 518) + rLedger(356, 518);
    s += right(124, 335, 354) + right(380, 335, 354);
    return s;
  },
  caption: 'Cyclohexanone and methyl vinyl ketone with ethoxide. The numbers follow the six atoms of the new ring, not the IUPAC names, so the same number means the same atom in every panel.',
});

FIGURES.push({
  id: 'l-robinson-steps',
  lessons: ['michael-robinson'],
  viewBox: '0 0 340 752',
  alt: 'Three stacked panels, with the atoms of the new ring numbered 1 to 6. Top: the anion of cyclohexanone at ring carbon 2 adds to carbon 3, the CH2 end of methyl vinyl ketone. Middle: in the Michael product, an anion on carbon 6 (the methyl) attacks the ring C=O carbon 1; a dashed line marks the bond that forms, closing a ring of six. Bottom: after dehydration, the cyclohexenone, with a C=C between carbons 1 and 6 conjugated with the C=O at 5.',
  build() {
    return rMichael(10, 6) + down(170, 244, 256) + rAldol(10, 258) + down(170, 496, 508) + rEnone(10, 510);
  },
  caption: 'The numbers follow the atoms of the new ring. The bonds made are 2–3, then 6–1, then the C=C 1=6.',
});

/* ===================================== why the new ring has six atoms == */
function cSix(ox, oy) {
  let s = frame(ox, oy, PW, RH, 'outer α carbon 6 attacks C=O carbon 1', 'good');
  const c = P(ox + 150, oy + 130);
  const v = (deg) => polar(c, deg, 46);
  const p1 = v(150), p2 = v(210), p3 = v(270), p4 = v(330), p5 = v(30);
  const C6 = A(v(90).x, v(90).y, 'CH₂⁻', 'hi');
  s += sk(p1, p2) + sk(p2, p3) + sk(p3, p4) + sk(p4, p5) + bd(p5, C6);
  const O1 = A(p1.x - 40, p1.y, 'O');
  s += bd(p1, O1, { order: 2 }) + sk(p1, polar(p1, 120, 30)) + carbonyl(p5, 30);
  s += dash(C6, p1);
  s += lonePair(C6.x, C6.y, 150, { dist: C6.r + 5 });
  s += draw(C6, O1);
  const lp = polar(C6, 210, C6.r + 9);
  s += curve(P(lp.x, lp.y), toward(p1, C6, 5), { bow: -10 });
  s += curve(mid(p1, O1), P(O1.x + 4, O1.y + 17), { bow: -10 });
  [p1, p2, p3, p4, p5].forEach((p, i) => { s += numIn(p, c, String(i + 1), 15); });
  s += numIn(v(90), c, '6', 28);
  s += tag(ox + PW / 2, oy + 224, 'ring 1-2-3-4-5-6: six atoms', { cls: 'fg-tag-good' });
  return s;
}

function cFour(ox, oy) {
  let s = frame(ox, oy, PW, RH, 'inner α carbon 2 attacks C=O carbon 5', 'warn');
  const C2 = A(ox + 130, oy + 104, 'CH⁻', 'warn');
  const p3 = P(ox + 130, oy + 162), p4 = P(ox + 190, oy + 162), p5 = P(ox + 190, oy + 104);
  const p1 = P(ox + 94, oy + 76), me1 = P(ox + 58, oy + 96), me6 = P(ox + 232, oy + 124);
  s += bd(C2, p3) + sk(p3, p4) + sk(p4, p5) + bd(C2, p1) + sk(p1, me1) + sk(p5, me6);
  s += carbonyl(p1, 90, 38);
  const O5 = A(p5.x + 26, p5.y - 32, 'O');
  s += bd(p5, O5, { order: 2 }) + draw(O5);
  s += dash(C2, p5, 'fg-dash');
  s += lonePair(C2.x, C2.y, 0, { dist: C2.r + 5 });
  s += draw(C2);
  s += curve(P(C2.x + C2.r + 9, C2.y - 2), toward(p5, C2, 5), { bow: -10 });
  s += curve(mid(p5, O5), P(O5.x + 17, O5.y + 4), { bow: 8 });
  const c = P(ox + 160, oy + 133);
  s += num(p1.x + 16, p1.y + 12, '1') + numIn(C2, c, '2', 26) + numIn(p3, c, '3', 14) + numIn(p4, c, '4', 14) + numIn(p5, c, '5', 14) + num(me6.x + 4, me6.y + 18, '6');
  s += tag(ox + PW / 2, oy + 224, 'ring 2-3-4-5: four atoms, too strained', { cls: 'fg-tag-warn' });
  return s;
}

FIGURES.push({
  id: 'ring-count',
  section: 'michael-robinson',
  lessons: [],
  anchor: '<h3>Why the new ring has six atoms</h3>',
  viewBox: '0 0 688 248',
  alt: 'Heptane-2,6-dione, a 1,5-dicarbonyl, closing two ways. Left: an anion on carbon 6, the methyl beyond carbonyl 5, attacks carbonyl carbon 1; the dashed bond closes a ring of six atoms, 1 to 6. Right: an anion on carbon 2, between the carbonyls, attacks carbonyl carbon 5; the dashed bond would close a ring of four atoms, 2 to 5, which is too strained.',
  build() { return cSix(12, 6) + cFour(356, 6); },
  caption: 'The same 1,5-dicarbonyl, heptane-2,6-dione, closing two ways. Count the atoms inside each dashed loop.',
});

FIGURES.push({
  id: 'l-ring-count',
  lessons: ['michael-robinson'],
  viewBox: '0 0 340 496',
  alt: 'Two stacked panels for heptane-2,6-dione. Top: an anion on carbon 6, beyond carbonyl 5, attacks carbonyl carbon 1, closing a ring of six atoms. Bottom: an anion on carbon 2, between the carbonyls, attacks carbonyl carbon 5, which would close a ring of four atoms.',
  build() { return cSix(10, 6) + cFour(10, 254); },
  caption: 'Top: the outer α carbon closes six. Bottom: an inner α carbon would close four.',
});

/* ======================================= working backwards (retro) ===== */
const TW = 160, TH = 200;
/* 3-methylcyclohex-2-en-1-one in the build numbering: 5 is the C=O carbon,
   the C=C is 6=1, and the methyl sits on 1. `stage` 0..3 undoes one step
   more each time. */
function retroPanel(ox, oy, stage) {
  const titles = ['1 · the target', '2 · put water back', '3 · undo the aldol', '4 · undo the Michael'];
  const foot = ['C=C 1=6, C=O at 5', 'OH on carbon 1', 'C=O at 1 and 5', 'acetone + MVK'];
  let s = frame(ox, oy, TW, TH, titles[stage], stage === 3 ? 'good' : undefined);
  const c = P(ox + 70, oy + 116);
  const v = (deg) => polar(c, deg, 30);
  const p5 = v(90), p6 = v(30), p1 = v(330), p2 = v(270), p3 = v(210), p4 = v(150);
  /* Stage 3 pulls the two pieces a little apart. */
  const sh = (p, dx, dy) => (stage === 3 ? P(p.x + dx, p.y + dy) : p);
  const q1 = sh(p1, 8, 6), q2 = sh(p2, 8, 6), q3 = sh(p3, -6, -2), q4 = sh(p4, -6, -2), q5 = sh(p5, -6, -2), q6 = sh(p6, -6, -2);
  s += sk(q4, q5) + sk(q5, q6) + carbonyl(q5, 90, 36);
  if (stage === 3) s += ringDouble(q3, q4, P(c.x - 6, c.y - 2), { inset: 6 });
  else s += sk(q3, q4);
  if (stage < 3) s += sk(q2, q3, stage === 2);
  s += sk(q1, q2);
  if (stage === 0) s += ringDouble(q6, q1, c, { inset: 6, cls: 'fg-bond-hi' });
  if (stage === 1) {
    s += sk(q6, q1, true);
    const OH = A(q1.x + 34, q1.y - 6, 'OH', 'warn');
    s += bd(q1, OH) + draw(OH) + sk(q1, P(q1.x + 12, q1.y + 26));
  } else if (stage >= 2) {
    s += carbonyl(q1, 10, 36) + sk(q1, P(q1.x + 8, q1.y + 28));
  } else {
    s += sk(q1, polar(q1, 330, 28));
  }
  const labels = [[q1, '1'], [q2, '2'], [q3, '3'], [q4, '4'], [q5, '5'], [q6, '6']];
  const cc = stage === 3 ? null : c;
  for (const [p, t] of labels) {
    const centre = cc || (['1', '2'].includes(t) ? P(c.x + 8, c.y + 6) : P(c.x - 6, c.y - 2));
    s += numIn(p, centre, t, 13);
  }
  s += tag(ox + TW / 2, oy + 188, foot[stage]);
  return s;
}

FIGURES.push({
  id: 'robinson-retro',
  section: 'michael-robinson',
  anchor: '<h3>Working backwards from a cyclohexenone</h3>',
  viewBox: '0 0 730 212',
  alt: 'Four panels read left to right, each undoing one step. 1: 3-methylcyclohex-2-en-1-one with its ring atoms numbered 1 to 6: the C=O carbon is 5, the C=C runs between 6 and 1, and the methyl is on 1. 2: water added back across the C=C, giving an OH on carbon 1; the 6–1 bond is marked. 3: the 6–1 bond broken, opening the ring to heptane-2,6-dione, with C=O carbons at 1 and 5; the 2–3 bond is marked. 4: the 2–3 bond broken, leaving acetone (carbons 1 and 2) and methyl vinyl ketone (carbons 3 to 6).',
  build() {
    let s = '';
    [12, 194, 376, 558].forEach((x, i) => { s += retroPanel(x, 6, i); if (i < 3) s += retro(x + TW + 2, 106, 18); });
    return s;
  },
  caption: 'Each panel undoes one step of the forward reaction, last step first. The double-lined arrow means “is made from”. The marked bond in each panel is the one the next panel breaks.',
});

FIGURES.push({
  id: 'l-robinson-retro',
  lessons: ['michael-robinson'],
  viewBox: '0 0 340 420',
  alt: 'Four panels in two rows, each undoing one step. 1: 3-methylcyclohex-2-en-1-one numbered 1 to 6, with the C=O at 5 and the C=C between 6 and 1. 2: water added back, OH on carbon 1. 3: the 6–1 bond broken, giving heptane-2,6-dione with C=O carbons at 1 and 5. 4: the 2–3 bond broken, giving acetone and methyl vinyl ketone.',
  build() {
    return retroPanel(6, 6, 0) + retroPanel(174, 6, 1) + retroPanel(6, 214, 2) + retroPanel(174, 214, 3);
  },
  caption: 'Read the panels in number order. Each one undoes one step, last step first.',
});

/* ================================ the Wieland–Miescher ketone ========== */
const WH = 244;

/* 2 · the triketone, curled for the fused closure; x marks the ring carbon
   that could close the bridged ring instead. */
function wFused(ox, oy) {
  let s = frame(ox, oy, PW, WH, '2 · fused closure: 6 attacks 1', 'hi');
  const g = fused(ox, oy, 118);
  s += g.ringA() + sk(g.c2, g.c3, true) + sk(g.c3, g.c4) + sk(g.c4, g.c5) + sk(g.c5, g.c6);
  s += carbonyl(g.c1, 90, 40) + carbonyl(g.a270, 270, 38) + carbonyl(g.c5, 30);
  const Me = A(g.c2.x, g.c2.y + 40, 'CH₃');
  s += bd(g.c2, Me) + draw(Me);
  s += dash(g.c6, g.c1);
  s += curve(P(g.c6.x - 4, g.c6.y - 10), P(g.c1.x + 6, g.c1.y - 12), { bow: 8 });
  s += g.nums();
  s += text(g.a210.x - 14, g.a210.y + 16, 'x', { cls: 'fg-tag-warn', size: 11 });
  s += tag(ox + 250, oy + 214, 'shares one bond,', { cls: 'fg-tag-good' });
  s += tag(ox + 250, oy + 230, '1–2, with the old ring', { cls: 'fg-tag-good' });
  return s;
}

/* 3 · the bridged alternative: x attacks 5. Drawn as the bicyclo[3.3.1]
   ketol, with bridgeheads 2 (top) and x (bottom) and the ring C=O carbon as
   the one-atom bridge between them. */
function wBridged(ox, oy) {
  let s = frame(ox, oy, PW, WH, '3 · bridged closure: x attacks 5', 'warn');
  const c = P(ox + 150, oy + 128);
  const B1 = P(c.x, c.y - 48), B2 = P(c.x, c.y + 48), Cm = c;
  const L = [polar(c, 135, 68), polar(c, 180, 68), polar(c, 225, 68)];
  const R = [polar(c, 45, 68), polar(c, 0, 68), polar(c, 315, 68)];
  s += sk(B1, L[0]) + sk(L[0], L[1]) + sk(L[1], L[2]) + sk(L[2], B2);
  s += sk(B1, R[0]) + sk(R[0], R[1]) + sk(R[1], R[2]) + sk(R[2], B2, true);
  s += sk(B1, Cm) + sk(Cm, B2);
  const Om = A(c.x + 32, c.y, 'O');
  s += bd(Cm, Om, { order: 2 }) + draw(Om);
  s += carbonyl(L[0], 135, 36);
  const Me = A(B1.x, B1.y - 34, 'CH₃');
  s += bd(B1, Me) + draw(Me);
  const OH = A(R[2].x + 22, R[2].y + 30, 'OH');
  s += bd(R[2], OH) + draw(OH) + sk(R[2], polar(R[2], 10, 30));
  s += numIn(L[0], c, '1', 15) + num(B1.x + 14, B1.y + 16, '2') + numIn(R[0], c, '3', 15) + numIn(R[1], c, '4', 15) + numIn(R[2], c, '5', 15);
  s += text(B2.x - 12, B2.y + 18, 'x', { cls: 'fg-tag-warn', size: 11 });
  s += tag(ox + PW / 2, oy + 230, 'a C=C at bridgehead x cannot form', { cls: 'fg-tag-warn' });
  return s;
}

/* 4 · the Wieland–Miescher ketone. */
function wProduct(ox, oy) {
  let s = frame(ox, oy, PW, WH, '4 · the Wieland–Miescher ketone', 'good');
  const g = fused(ox, oy, 118);
  s += g.ringA() + sk(g.c2, g.c3) + sk(g.c3, g.c4) + sk(g.c4, g.c5) + sk(g.c5, g.c6) + ringDouble(g.c6, g.c1, g.cB, { inset: 9, cls: 'fg-bond-hi' });
  s += carbonyl(g.a270, 270, 38) + carbonyl(g.c5, 30);
  const Me = A(g.c2.x, g.c2.y + 40, 'CH₃', 'hi');
  s += bd(g.c2, Me) + draw(Me);
  s += g.nums([1, 2, 3, 4, 5, 6], 17);
  s += tag(ox + 256, oy + 198, 'angular CH₃ on 2', { cls: 'fg-tag-good' });
  s += tag(ox + 256, oy + 214, 'C=C 1=6 at the', { cls: 'fg-tag-good' });
  s += tag(ox + 256, oy + 230, 'ring fusion', { cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'wieland-miescher',
  section: 'michael-robinson',
  anchor: 'Worked example &mdash; the Wieland&ndash;Miescher ketone</span>',
  viewBox: '0 0 688 506',
  alt: 'Four panels, with the atoms of the new ring numbered 1 to 6. 1: 2-methylcyclohexane-1,3-dione, as its anion at C2 (between both C=O groups and carrying the methyl), adds to carbon 3 of methyl vinyl ketone. 2: the triketone curled for the fused closure: the methyl carbon 6 of the side chain attacks ring carbonyl carbon 1, and the new ring shares only the 1–2 bond with the old ring; a ring carbon next to the other ring C=O is marked x. 3: the bridged alternative: carbon x attacks side-chain carbonyl 5, giving a bicyclo[3.3.1] ketol whose OH is on carbon 5; a C=C would have to start at bridgehead x, which cannot form. 4: the Wieland–Miescher ketone, with the angular methyl on carbon 2, a ketone left in the old ring, and a C=C between 1 and 6 at the ring fusion, conjugated with the C=O at 5.',
  build() {
    let s = rMichael(12, 6, true) + wFused(356, 6) + wBridged(12, 262) + wProduct(356, 262);
    s += right(124, 335, 354);
    return s;
  },
  caption: 'The numbers are the new ring’s, as in the figures above. Panels 2 and 3 are the two six-atom closures; only the one in panel 2 can go on to the enone in panel 4.',
});

/* ===================================== the lesson's final target ======= */
FIGURES.push({
  id: 'l-final-target',
  lessons: ['michael-robinson'],
  viewBox: '0 0 340 176',
  alt: '4,4-Dimethylcyclohex-2-en-1-one: a six-membered ring with a C=O at the top carbon, a C=C between the next two carbons clockwise, and two methyl groups on the carbon after that.',
  build() {
    const c = P(170, 96);
    const v = (deg) => polar(c, deg, 32);
    let s = '';
    s += sk(v(90), v(30)) + ringDouble(v(30), v(330), c, { inset: 6 }) + sk(v(330), v(270)) + sk(v(270), v(210)) + sk(v(210), v(150)) + sk(v(150), v(90));
    s += carbonyl(v(90), 90, 38);
    s += sk(v(270), polar(v(270), 240, 30)) + sk(v(270), polar(v(270), 300, 30));
    s += tag(52, 96, 'the target');
    return s;
  },
  caption: 'Number the ring the way the Robinson figures do, starting from the C=O.',
});

export default FIGURES;
