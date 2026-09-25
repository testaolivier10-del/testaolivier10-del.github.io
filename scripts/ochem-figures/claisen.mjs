/* Figures for the claisen notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every drawing uses one concrete case: ethyl acetate with itself for the
   mechanism, ethyl acetoacetate for the acidic CH2, ethyl propanoate against
   ethyl 2-methylpropanoate for the two-alpha-hydrogen rule, diethyl adipate
   for the Dieckmann and cyclohexanone with diethyl carbonate for the crossed
   case. Atoms are labelled, so every curved arrow starts at a named lone
   pair or bond and lands on a named atom or bond.

   Panels are functions of their top-left corner. The notes figures lay them
   out in rows; the lesson copies (id prefix l-) stack the same panels in one
   column no wider than 340, and every label in them is fg-lbl or fg-tag. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
/* Long condensed groups (six or more characters) are drawn as bare text:
   a disc big enough to hold them would crowd the drawing. Their radius is
   still used to stop bonds short of the text. */
const rad = (l) => (l === 'H' ? 11 : l.length <= 2 ? 14 : l.length <= 5 ? 4 + l.length * 4 : 4 + l.length * 3.9);
const A = (x, y, l = 'C', k) => ({ x, y, l, k, r: rad(l) });
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.l, { kind: a.l.length >= 6 && !a.k ? 'point' : a.k, r: a.r })).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const off = (p, dx, dy) => P(p.x + dx, p.y + dy);
const lp = (a, deg, extra = 7) => lonePair(a.x, a.y, deg, { dist: a.r + extra });
const lpAt = (a, deg, extra = 7) => {
  const r = (deg * Math.PI) / 180, d = a.r + extra;
  return P(a.x + Math.cos(r) * d, a.y + Math.sin(r) * d);
};
/* Point at distance d from p in screen direction deg (0 = right, 90 = down). */
const at = (p, deg, d) => P(p.x + Math.cos((deg * Math.PI) / 180) * d, p.y + Math.sin((deg * Math.PI) / 180) * d);
/* A resonance arrow: one line, a head at each end. */
const reso = (a, b) => { const m = mid(a, b); return arrow(m, b, { size: 7 }) + arrow(m, a, { size: 7 }); };
const gapArrow = (a, b) => arrow(a, b, { size: 7 });

/* A panel: box, title tag at the top, up to two tag lines at the bottom. */
function frameP(ox, oy, w, h, title, lines = [], kind) {
  let s = panel(ox, oy, w, h, kind ? { kind } : {});
  s += tag(ox + w / 2, oy + 20, title);
  lines.forEach((ln, i) => {
    const [t, cls] = Array.isArray(ln) ? ln : [ln, 'fg-tag'];
    s += text(ox + w / 2, oy + h - 14 - (lines.length - 1 - i) * 17, t, { cls, size: 11 });
  });
  return s;
}

/* ================================================ the overall reaction === */
/* Ethyl acetate drawn CH3–C(=O)–OEt with its carbonyl carbon at (x, y). */
function acetate(x, y, kMe, kC, kOEt) {
  const Me = A(x - 50, y + 28, 'CH₃', kMe), C = A(x, y, 'C', kC),
        O = A(x, y - 46, 'O'), E = A(x + 50, y + 28, 'OEt', kOEt);
  return bd(C, O, { order: 2 }) + bd(C, Me) + bd(C, E) + draw(Me, C, O, E);
}
/* Ethyl acetoacetate CH3–C(=O)–CH2–C(=O)–OEt, ketone carbon at (x, y). */
function acetoacetate(x, y, dx = 50) {
  const Me = A(x - dx, y + 28, 'CH₃'), Ck = A(x, y, 'C', 'hi'), Ok = A(x, y - 46, 'O'),
        Cm = A(x + dx, y + 28, 'CH₂', 'hi'), Ce = A(x + 2 * dx, y), Oe = A(x + 2 * dx, y - 46, 'O'),
        E = A(x + 3 * dx, y + 28, 'OEt');
  return {
    svg: bd(Ck, Ok, { order: 2 }) + bd(Me, Ck) + bd(Ck, Cm, { cls: 'fg-bond-hi' }) + bd(Cm, Ce) +
         bd(Ce, Oe, { order: 2 }) + bd(Ce, E) + draw(Me, Ck, Ok, Cm, Ce, Oe, E),
    Ck, Cm,
  };
}

FIGURES.push({
  id: 'claisen-overall',
  section: 'claisen',
  anchor: '<h3>Enolate meets ester</h3>',
  viewBox: '0 0 760 214',
  alt: 'Two molecules of ethyl acetate react with sodium ethoxide, then aqueous acid, to give ethyl acetoacetate. The CH3 carbon of one ethyl acetate bonds to the carbonyl carbon of the other, and that second molecule loses its OEt group.',
  build() {
    let s = '';
    s += acetate(96, 104, 'hi');
    s += tag(96, 180, 'enolate partner');
    s += text(192, 110, '+', { cls: 'fg-lbl', size: 16 });
    s += acetate(290, 104, undefined, 'hi', 'warn');
    s += tag(290, 180, 'C=O partner; loses OEt');
    s += arrow(P(386, 104), P(452, 104));
    s += tag(419, 92, 'NaOEt');
    s += tag(419, 126, 'then H₃O⁺');
    const p = acetoacetate(540, 104, 52);
    s += p.svg;
    s += tag(510, 86, 'β', { anchor: 'middle' });
    s += tag(620, 156, 'α');
    s += tag(546, 162, 'new C–C bond', { cls: 'fg-tag-good' });
    s += tag(618, 200, 'ethyl acetoacetate, a β-ketoester');
    return s;
  },
  caption: 'Two identical esters, two different jobs. The highlighted carbons are the two ends of the new bond.',
});

FIGURES.push({
  id: 'l-claisen-overall',
  lessons: ['claisen'],
  viewBox: '0 0 320 348',
  alt: 'Two ethyl acetate molecules; with NaOEt then aqueous acid they give ethyl acetoacetate. The CH3 of one bonds to the carbonyl carbon of the other, which loses its OEt.',
  build() {
    let s = '';
    s += acetate(78, 70, 'hi');
    s += text(160, 78, '+', { cls: 'fg-lbl', size: 16 });
    s += acetate(242, 70, undefined, 'hi', 'warn');
    s += tag(78, 134, 'enolate partner');
    s += tag(242, 134, 'C=O partner');
    s += arrow(P(150, 148), P(150, 196));
    s += tag(162, 168, 'NaOEt', { anchor: 'start' });
    s += tag(162, 186, 'then H₃O⁺', { anchor: 'start' });
    const p = acetoacetate(84, 250, 50);
    s += p.svg;
    s += tag(62, 234, 'β');
    s += tag(156, 302, 'α');
    s += tag(92, 314, 'new C–C bond', { cls: 'fg-tag-good' });
    s += tag(160, 338, 'ethyl acetoacetate, a β-ketoester');
    return s;
  },
  caption: 'The highlighted carbons are the two ends of the new bond.',
});

/* ===================================================== the mechanism === */
const PW = 316, PH = 232;

/* 1: ethoxide takes an alpha H; the C–H electrons become the C=C, the C=O
   electrons move onto oxygen. */
function m1(ox, oy) {
  const B = A(ox + 42, oy + 70, 'EtO⁻', 'warn');
  const H = A(ox + 112, oy + 72, 'H', 'warn'), Ca = A(ox + 112, oy + 128, 'CH₂', 'hi'),
        C = A(ox + 170, oy + 100), O = A(ox + 170, oy + 48, 'O'), E = A(ox + 228, oy + 128, 'OEt');
  let s = frameP(ox, oy, PW, PH, '1 · EtO⁻ removes an α hydrogen', ['ethyl acetate → its enolate']);
  s += bd(H, Ca) + bd(Ca, C) + bd(C, O, { order: 2 }) + bd(C, E);
  s += lp(O, -160, 5) + lp(O, -20, 5) + lp(B, 0, 4) + lp(B, -90, 3) + lp(B, 90, 3);
  s += draw(B, H, Ca, C, O, E);
  s += curve(off(lpAt(B, 0, 4), 4, 0), off(H, -12, -4), { bow: -12 });
  s += curve(mid(H, Ca), mid(Ca, C), { bow: -14 });
  s += curve(mid(C, O), off(O, 16, 4), { bow: -10 });
  return s;
}

/* 2: the enolate: O– lone pair reforms C=O, C=C pi attacks the second
   ester's carbonyl carbon, that C=O's pi electrons go to its oxygen. */
function m2(ox, oy) {
  const Ca = A(ox + 126, oy + 142, 'CH₂', 'hi'), C = A(ox + 72, oy + 108), O = A(ox + 72, oy + 56, 'O⁻', 'warn'),
        E = A(ox + 30, oy + 144, 'OEt');
  const Cb = A(ox + 222, oy + 116, 'C', 'hi'), Ob = A(ox + 198, oy + 66, 'O'),
        Mb = A(ox + 278, oy + 116, 'CH₃'), Eb = A(ox + 222, oy + 172, 'OEt');
  let s = frameP(ox, oy, PW, PH, '2 · the enolate attacks a second ester', ['a new C–C bond forms']);
  s += bd(Ca, C, { order: 2 }) + bd(C, O) + bd(C, E);
  s += bd(Cb, Ob, { order: 2 }) + bd(Cb, Mb) + bd(Cb, Eb);
  s += lp(O, 180, 5) + lp(O, -90, 5) + lp(O, 0, 5) + lp(Ob, -150, 5) + lp(Ob, -40, 5);
  s += draw(Ca, C, O, E, Cb, Ob, Mb, Eb);
  s += curve(off(lpAt(O, 0, 5), 2, 6), mid(C, O, 0.45), { bow: -12 });
  s += curve(mid(Ca, C), off(Cb, -18, -2), { bow: -30 });
  s += curve(mid(Cb, Ob), off(Ob, 16, 2), { bow: -10 });
  return s;
}

/* 3: the tetrahedral intermediate collapses and expels ethoxide. */
function m3(ox, oy) {
  const C = A(ox + 150, oy + 112, 'C', 'hi'), O = A(ox + 150, oy + 56, 'O⁻', 'warn'),
        R = A(ox + 70, oy + 112, 'CH₂CO₂Et'), Me = A(ox + 110, oy + 164, 'CH₃'),
        E = A(ox + 196, oy + 158, 'OEt', 'warn');
  let s = frameP(ox, oy, PW, PH, '3 · the intermediate collapses', ['the C–OEt bond breaks; EtO⁻ leaves']);
  s += bd(C, O) + bd(C, R) + bd(C, Me) + bd(C, E, { cls: 'fg-bond-hi' });
  s += lp(O, 180, 5) + lp(O, -90, 5) + lp(O, 0, 5);
  s += draw(C, O, R, Me, E);
  s += curve(off(lpAt(O, 0, 5), 2, 6), mid(C, O, 0.5), { bow: -12 });
  s += curve(mid(C, E), off(E, 20, -4), { bow: -14 });
  s += tag(ox + 250, oy + 92, 'tetrahedral');
  s += tag(ox + 250, oy + 108, 'intermediate');
  return s;
}

/* 4: ethoxide takes the H between the two carbonyls. */
function m4(ox, oy) {
  const Me = A(ox + 30, oy + 96, 'CH₃'), Ck = A(ox + 82, oy + 124), Ok = A(ox + 82, oy + 176),
        Cm = A(ox + 136, oy + 96, 'CH', 'hi'), H = A(ox + 136, oy + 48, 'H', 'warn'),
        Ce = A(ox + 190, oy + 124), Oe = A(ox + 190, oy + 176), E = A(ox + 246, oy + 96, 'OEt');
  const B = A(ox + 62, oy + 50, 'EtO⁻', 'warn');
  Ck.l = 'C'; Ok.l = 'O'; Ce.l = 'C'; Oe.l = 'O';
  Ck.r = Ok.r = Ce.r = Oe.r = 14;
  let s = frameP(ox, oy, PW, PH, '4 · EtO⁻ takes the H between the C=O groups', [['pKₐ 11: this step does not go back', 'fg-tag-good']]);
  s += bd(Me, Ck) + bd(Ck, Ok, { order: 2 }) + bd(Ck, Cm) + bd(Cm, H) + bd(Cm, Ce) + bd(Ce, Oe, { order: 2 }) + bd(Ce, E);
  s += lp(B, 0, 4) + lp(B, 90, 3) + lp(B, 180, 3) + lp(Ok, 140, 5) + lp(Ok, 40, 5) + lp(Oe, 140, 5) + lp(Oe, 40, 5);
  s += draw(Me, Ck, Ok, Cm, H, Ce, Oe, E, B);
  s += curve(off(lpAt(B, 0, 4), 4, 0), off(H, -13, -2), { bow: -10 });
  s += curve(mid(H, Cm), mid(Cm, Ck), { bow: 14 });
  s += curve(mid(Ck, Ok), off(Ok, -16, 4), { bow: 10 });
  return s;
}

FIGURES.push({
  id: 'claisen-mechanism',
  section: 'claisen',
  anchor: '<h3>Step by step</h3>',
  viewBox: '0 0 680 492',
  alt: 'The Claisen condensation of ethyl acetate in four panels. 1: ethoxide removes a hydrogen from the CH3 carbon, giving the enolate. 2: the enolate C=C attacks the carbonyl carbon of a second ethyl acetate while that C=O opens onto oxygen. 3: the tetrahedral intermediate re-forms C=O and expels ethoxide. 4: ethoxide removes a hydrogen from the CH2 between the two carbonyls of ethyl acetoacetate.',
  build() {
    let s = m1(12, 10) + m2(352, 10) + m3(12, 256) + m4(352, 256);
    s += gapArrow(P(330, 126), P(350, 126)) + gapArrow(P(330, 372), P(350, 372));
    s += gapArrow(P(510, 244), P(170, 254));
    return s;
  },
  caption: 'Read the panels left to right, top row first. Each curved arrow starts at a lone pair or a bond and ends where those electrons go.',
});

FIGURES.push({
  id: 'l-claisen-mech-a',
  lessons: ['claisen'],
  viewBox: '0 0 340 488',
  alt: 'Ethoxide removes a hydrogen from the CH3 of ethyl acetate to give the enolate; the enolate then attacks the carbonyl carbon of a second ethyl acetate.',
  build() {
    let s = m1(12, 6) + m2(12, 250);
    s += gapArrow(P(170, 240), P(170, 250));
    return s;
  },
  caption: 'Steps 1 and 2: make the enolate, then attack.',
});

FIGURES.push({
  id: 'l-claisen-mech-b',
  lessons: ['claisen'],
  viewBox: '0 0 340 488',
  alt: 'The tetrahedral intermediate re-forms C=O and expels ethoxide, giving ethyl acetoacetate; ethoxide then removes a hydrogen from its CH2 between the two carbonyls.',
  build() {
    let s = m3(12, 6) + m4(12, 250);
    s += gapArrow(P(170, 240), P(170, 250));
    return s;
  },
  caption: 'Steps 3 and 4: collapse, then the last deprotonation.',
});

/* ============================================ the acidic CH2 and its anion */
/* One contributor of the ethyl acetoacetate anion. which: 'C', 'Ok', 'Oe'. */
function contrib(ox, oy, which) {
  const Me = A(ox + 26, oy + 100, 'CH₃'), Ck = A(ox + 72, oy + 74, 'C'),
        Ok = A(ox + 72, oy + 26, which === 'Ok' ? 'O⁻' : 'O', which === 'Ok' ? 'warn' : undefined),
        Cm = A(ox + 118, oy + 100, which === 'C' ? 'CH⁻' : 'CH', which === 'C' ? 'warn' : 'hi'),
        Ce = A(ox + 164, oy + 74, 'C'),
        Oe = A(ox + 164, oy + 26, which === 'Oe' ? 'O⁻' : 'O', which === 'Oe' ? 'warn' : undefined),
        E = A(ox + 210, oy + 100, 'OEt');
  let s = bd(Me, Ck) + bd(Ce, E);
  s += bd(Ck, Ok, { order: which === 'Ok' ? 1 : 2 });
  s += bd(Ck, Cm, { order: which === 'Ok' ? 2 : 1 });
  s += bd(Cm, Ce, { order: which === 'Oe' ? 2 : 1 });
  s += bd(Ce, Oe, { order: which === 'Oe' ? 1 : 2 });
  if (which === 'C') s += lp(Cm, 90, 5);
  for (const o of [Ok, Oe]) if (o.l === 'O⁻') s += lp(o, 180, 5) + lp(o, -90, 5) + lp(o, 0, 5);
  s += draw(Me, Ck, Ok, Cm, Ce, Oe, E);
  const t = { C: 'charge on the carbon', Ok: 'charge on the ketone O', Oe: 'charge on the ester O' }[which];
  s += tag(ox + 118, oy + 146, t, { cls: which === 'C' ? 'fg-tag' : 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'ketoester-anion',
  section: 'claisen',
  anchor: '<h3>Why the final deprotonation drives everything</h3>',
  viewBox: '0 0 760 300',
  alt: 'The anion of ethyl acetoacetate drawn as three resonance contributors: negative charge on the central carbon, on the ketone oxygen, and on the ester oxygen. Below, a pKa scale: the alpha hydrogen of ethyl acetate at 25, ethanol at 16, and the CH2 of ethyl acetoacetate at 11.',
  build() {
    let s = '';
    s += contrib(12, 10, 'C') + contrib(270, 10, 'Ok') + contrib(528, 10, 'Oe');
    s += reso(P(240, 88), P(276, 88)) + reso(P(498, 88), P(534, 88));
    s += rule(20, 178, 740, 178);
    /* pKa strip: 26 at the left to 10 at the right. */
    const x = (pka) => 60 + (26 - pka) * 40;
    s += arrow(P(x(26), 236), P(x(10), 236), { muted: true });
    s += tag(x(10) - 4, 262, 'more acidic →', { anchor: 'end', cls: 'fg-tag-mut' });
    const marks = [
      [25, 'ethyl acetate α-H', 'pKₐ 25', 'fg-tag-mut'],
      [16, 'ethanol, EtOH', 'pKₐ 16', 'fg-tag'],
      [11, 'ethyl acetoacetate CH₂', 'pKₐ 11', 'fg-tag-good'],
    ];
    for (const [p, name, v, cls] of marks) {
      s += `<line class="fg-bond" x1="${x(p)}" y1="228" x2="${x(p)}" y2="244"></line>`;
      s += tag(x(p), 204, name, { cls });
      s += tag(x(p), 220, v, { cls });
    }
    return s;
  },
  caption: 'Top: the three contributors of one anion. Bottom: the three acids that matter here, on one pKₐ scale.',
});

FIGURES.push({
  id: 'l-ketoester-anion',
  lessons: ['claisen'],
  viewBox: '0 0 250 520',
  alt: 'The ethyl acetoacetate anion as three stacked resonance contributors: charge on the central carbon, on the ketone oxygen, and on the ester oxygen.',
  build() {
    let s = contrib(6, 4, 'C') + contrib(6, 184, 'Ok') + contrib(6, 364, 'Oe');
    s += reso(P(124, 160), P(124, 190)) + reso(P(124, 340), P(124, 370));
    return s;
  },
  caption: 'The CH₂ between the two C=O groups, after the base removes one of its hydrogens.',
});

/* ===================================== two alpha hydrogens or only one === */
/* A starting ester: CH3–Cα(–R)–C(=O)–OEt. twoH: ethyl propanoate. */
function startEster(ox, oy, twoH) {
  const Me = A(ox + 30, oy + 100, 'CH₃'), Ca = A(ox + 84, oy + 72, twoH ? 'CH₂' : 'CH', 'hi'),
        C = A(ox + 140, oy + 100), O = A(ox + 140, oy + 150, 'O'), E = A(ox + 196, oy + 72, 'OEt');
  let s = bd(Me, Ca) + bd(Ca, C) + bd(C, O, { order: 2 }) + bd(C, E);
  const parts = [Me, Ca, C, O, E];
  if (!twoH) { const M2 = A(ox + 84, oy + 24, 'CH₃'); s += bd(Ca, M2); parts.push(M2); }
  return s + draw(...parts);
}
/* The Claisen product: R–C(=O)–C(sub)(sub)–C(=O)–OEt. */
function product(ox, oy, twoH) {
  const R = A(ox + 40, oy + 100, twoH ? 'CH₃CH₂' : '(CH₃)₂CH'), Ck = A(ox + 106, oy + 72),
        Ok = A(ox + 106, oy + 24, 'O'), Cm = A(ox + 162, oy + 100, 'C', twoH ? 'hi' : 'warn'),
        S1 = A(ox + 134, oy + 150, 'CH₃'), S2 = A(ox + 190, oy + 150, twoH ? 'H' : 'CH₃', twoH ? 'hi' : 'warn'),
        Ce = A(ox + 218, oy + 72), Oe = A(ox + 218, oy + 24, 'O'), E = A(ox + 274, oy + 100, 'OEt');
  Ck.l = 'C'; Ce.l = 'C';
  let s = bd(R, Ck) + bd(Ck, Ok, { order: 2 }) + bd(Ck, Cm, { cls: 'fg-bond-hi' }) + bd(Cm, Ce) +
          bd(Ce, Oe, { order: 2 }) + bd(Ce, E) + bd(Cm, S1) + bd(Cm, S2);
  return s + draw(R, Ck, Ok, Cm, S1, S2, Ce, Oe, E);
}

FIGURES.push({
  id: 'two-alpha-h',
  section: 'claisen',
  anchor: '<h3>Why the final deprotonation drives everything</h3>',
  viewBox: '0 0 760 400',
  alt: 'Top row: ethyl propanoate, whose alpha carbon is a CH2, condenses to a product whose central carbon between the two carbonyls still carries one hydrogen. Bottom row: ethyl 2-methylpropanoate, whose alpha carbon is a CH with two methyls, would give a product whose central carbon carries two methyl groups and no hydrogen.',
  build() {
    let s = '';
    const row = (oy, twoH) => {
      let r = startEster(0, oy, twoH);
      r += tag(110, oy + 182, twoH ? 'ethyl propanoate: two α H' : 'ethyl 2-methylpropanoate: one α H');
      r += arrow(P(232, oy + 88), P(296, oy + 88));
      r += tag(264, oy + 76, '2 molecules');
      r += tag(264, oy + 106, 'NaOEt');
      r += product(300, oy, twoH);
      const lines = twoH
        ? [['one H left between', 'fg-tag-good'], ['the C=O groups: EtO⁻', 'fg-tag-good'], ['removes it. Driven.', 'fg-tag-good']]
        : [['no H left here: nothing', 'fg-tag-warn'], ['pulls it forward.', 'fg-tag-warn'], ['Almost no product.', 'fg-tag-warn']];
      lines.forEach(([t, c], i) => { r += tag(604, oy + 118 + i * 17, t, { cls: c, anchor: 'start' }); });
      return r;
    };
    s += row(0, true);
    s += rule(20, 198, 740, 198);
    s += row(206, false);
    return s;
  },
  caption: 'Compare the highlighted central carbon in the two products. Everything else about the two reactions is the same.',
});

FIGURES.push({
  id: 'l-two-alpha-h',
  lessons: ['claisen'],
  viewBox: '0 0 300 440',
  alt: 'Two Claisen products. From ethyl propanoate: the carbon between the two carbonyls carries a CH3 and one H. From ethyl 2-methylpropanoate: that carbon carries two CH3 groups and no H.',
  build() {
    let s = '';
    s += tag(150, 14, 'from ethyl propanoate');
    s += product(-2, 12, true);
    s += tag(150, 196, 'one H left: EtO⁻ removes it', { cls: 'fg-tag-good' });
    s += rule(10, 212, 290, 212);
    s += tag(150, 234, 'from ethyl 2-methylpropanoate');
    s += product(-2, 232, false);
    s += tag(150, 416, 'no H left: nothing drives it', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Look at the highlighted carbon between the two C=O groups.',
});

/* ========================================================== Dieckmann === */
const DW = 320, DH = 300;
/* Five ring positions for C2..C6: C4 at the top, C2 lower left, C6 lower
   right, so the C2–C6 gap (or new bond) is the bottom edge. */
function ringPts(ox, oy) {
  const v = polyPts(ox + 150, oy + 140, 5, 60, 90);
  return { C4: v[0], C3: v[1], C2: v[2], C6: v[3], C5: v[4], c: P(ox + 150, oy + 140) };
}
function numTag(p, c, s, d = 30) {
  const dx = p.x - c.x, dy = p.y - c.y, l = Math.hypot(dx, dy);
  return tag(p.x + (dx / l) * d, p.y + (dy / l) * d + 4, s);
}

function dieckA(ox, oy) {
  const g = ringPts(ox, oy);
  const C3 = A(g.C3.x, g.C3.y, 'CH₂'), C4 = A(g.C4.x, g.C4.y, 'CH₂'), C5 = A(g.C5.x, g.C5.y, 'CH₂');
  const C2 = A(g.C2.x, g.C2.y, 'CH⁻', 'warn'), C6 = A(g.C6.x, g.C6.y, 'C', 'hi');
  const C1 = A(C2.x - 48, C2.y + 52, 'CO₂Et');
  const O6 = at(C6, 15, 54), E6 = at(C6, 105, 54);
  const O = A(O6.x, O6.y, 'O'), E = A(E6.x, E6.y, 'OEt');
  let s = frameP(ox, oy, DW, DH, '1 · the C2 enolate attacks C6', ['diethyl adipate after EtO⁻ removes an H from C2']);
  s += bd(C2, C3) + bd(C3, C4) + bd(C4, C5) + bd(C5, C6) + bd(C2, C1);
  s += bd(C6, O, { order: 2 }) + bd(C6, E);
  s += lp(C2, 0, 4) + lp(O, -40, 5) + lp(O, 75, 5);
  s += draw(C2, C3, C4, C5, C6, C1, O, E);
  s += curve(off(lpAt(C2, 0, 4), 5, 0), off(C6, -16, 0), { bow: 10 });
  s += curve(mid(C6, O), off(O, -8, -15), { bow: -10 });
  s += numTag(C3, g.c, 'C3') + numTag(C4, g.c, 'C4', 26) + numTag(C5, g.c, 'C5');
  s += tag(C2.x - 44, C2.y - 8, 'C2');
  s += tag(C6.x + 30, C6.y - 22, 'C6');
  s += tag(C1.x - 30, C1.y + 4, 'C1', { anchor: 'end' });
  return s;
}

function dieckB(ox, oy) {
  const g = ringPts(ox, oy);
  const C3 = A(g.C3.x, g.C3.y, 'CH₂'), C4 = A(g.C4.x, g.C4.y, 'CH₂'), C5 = A(g.C5.x, g.C5.y, 'CH₂');
  const C2 = A(g.C2.x, g.C2.y, 'C', 'hi'), C6 = A(g.C6.x, g.C6.y, 'C', 'hi');
  const c1 = at(C2, 170, 56), h2 = at(C2, 100, 46), o6 = at(C6, 40, 50);
  const C1 = A(c1.x, c1.y, 'CO₂Et'), H = A(h2.x, h2.y, 'H', 'hi'), O = A(o6.x, o6.y, 'O');
  let s = frameP(ox, oy, DW, DH, '2 · after ring closure and workup', ['ethyl 2-oxocyclopentane-1-carboxylate'], 'good');
  s += bd(C2, C3) + bd(C3, C4) + bd(C4, C5) + bd(C5, C6) + bd(C2, C6, { cls: 'fg-bond-hi' }) + bd(C2, C1) + bd(C2, H);
  s += bd(C6, O, { order: 2 });
  s += draw(C2, C3, C4, C5, C6, C1, O, H);
  s += numTag(C3, g.c, 'C3') + numTag(C4, g.c, 'C4', 26) + numTag(C5, g.c, 'C5');
  s += tag(C2.x + 6, C2.y - 26, 'C2');
  s += tag(C6.x - 8, C6.y - 26, 'C6');
  s += tag(C1.x, C1.y - 26, 'C1');
  s += tag(ox + 150, oy + 264, 'new C2–C6 bond: a five-membered ring', { cls: 'fg-tag-good' });
  s += tag(H.x + 16, H.y + 4, 'pKₐ 11', { anchor: 'start', cls: 'fg-tag-good' });
  return s;
}

FIGURES.push({
  id: 'dieckmann-ring',
  section: 'claisen',
  anchor: '<h3>The Dieckmann condensation: closing a ring</h3>',
  viewBox: '0 0 700 320',
  alt: 'Left: diethyl adipate, curled so its chain carbons C2 to C6 form an open ring. C2 carries a negative charge and a lone pair; a curved arrow runs from that lone pair to the ester carbonyl carbon C6, and a second arrow moves the C6=O pi electrons onto oxygen. Right: the product, ethyl 2-oxocyclopentane-1-carboxylate: a five-membered ring C2 C3 C4 C5 C6 with the new C2–C6 bond highlighted, a ketone oxygen on C6, and a CO2Et group and one hydrogen on C2.',
  build() {
    let s = dieckA(10, 10) + dieckB(370, 10);
    s += gapArrow(P(334, 160), P(366, 160));
    return s;
  },
  caption: 'The labels keep the chain numbers from diethyl adipate. The C2 enolate is drawn with its charge on carbon, the atom that forms the bond; it is the same enolate as in the Claisen mechanism. The collapse at C6, the deprotonation and the workup are the same as there and are not redrawn.',
});

FIGURES.push({
  id: 'l-dieckmann-ring',
  lessons: ['claisen'],
  viewBox: '0 0 340 630',
  alt: 'Diethyl adipate curled into an open ring; the C2 carbanion attacks the C6 ester carbon. Below, the five-membered beta-ketoester product with the new C2–C6 bond, a ketone on C6 and CO2Et plus one H on C2.',
  build() {
    let s = dieckA(10, 6) + dieckB(10, 322);
    s += gapArrow(P(170, 308), P(170, 320));
    return s;
  },
  caption: 'Labels keep the chain numbers. The enolate is drawn with its charge on carbon. C1 stays outside the ring as the ester.',
});

/* ========================================= cyclohexanone + diethyl carbonate */
FIGURES.push({
  id: 'carbonate-acylation',
  section: 'claisen',
  anchor: '<h3>Crossed Claisens: two different partners</h3>',
  viewBox: '0 0 760 220',
  alt: 'Cyclohexanone, with ring carbon 1 as the C=O and ring carbon 2 beside it highlighted, plus diethyl carbonate, react with NaOEt then aqueous acid. The product is ethyl 2-oxocyclohexane-1-carboxylate: the same ring with a CO2Et group and one hydrogen on the carbon beside the ketone.',
  build() {
    let s = '';
    const ring = (cx, cy, hiIdx) => {
      const v = polyPts(cx, cy, 6, 40, 90);
      let r = '';
      for (let i = 0; i < 6; i++) {
        const hi = hiIdx !== undefined && (i === hiIdx || (i + 1) % 6 === hiIdx) && (i === 0 || (i + 1) % 6 === 0);
        r += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0, cls: hi ? 'fg-bond-hi' : 'fg-bond' });
      }
      return { r, v };
    };
    /* cyclohexanone */
    const a = ring(90, 128);
    s += a.r;
    const Oa = A(90, 128 - 40 - 42, 'O');
    s += bond(a.v[0], Oa, { rFrom: 0, rTo: Oa.r, order: 2 }) + draw(Oa);
    s += `<circle class="fg-atom-hi" cx="${a.v[5].x}" cy="${a.v[5].y}" r="6"></circle>`;
    s += tag(a.v[0].x - 12, a.v[0].y + 2, '1', { anchor: 'end' });
    s += tag(a.v[5].x + 12, a.v[5].y + 4, '2 (α)', { anchor: 'start' });
    s += tag(90, 206, 'cyclohexanone');
    s += text(184, 132, '+', { cls: 'fg-lbl', size: 16 });
    /* diethyl carbonate */
    const C = A(270, 118, 'C', 'hi'), O = A(270, 66, 'O'), E1 = A(222, 146, 'OEt'), E2 = A(318, 146, 'OEt', 'warn');
    s += bd(C, O, { order: 2 }) + bd(C, E1) + bd(C, E2) + draw(C, O, E1, E2);
    s += tag(270, 206, 'diethyl carbonate');
    s += arrow(P(362, 118), P(438, 118));
    s += tag(400, 106, 'NaOEt');
    s += tag(400, 140, 'then H₃O⁺');
    /* product */
    const cx = 530, cy = 128;
    const b = ring(cx, cy);
    s += b.r;
    const Ob = A(cx, cy - 40 - 42, 'O');
    s += bond(b.v[0], Ob, { rFrom: 0, rTo: Ob.r, order: 2 }) + draw(Ob);
    const v2 = b.v[5];
    const Ce = A(v2.x + 62, v2.y + 8, 'CO₂Et', 'hi'), H = A(v2.x + 26, v2.y - 36, 'H');
    s += bond(v2, Ce, { rFrom: 0, rTo: Ce.r, cls: 'fg-bond-hi' }) + bond(v2, H, { rFrom: 0, rTo: H.r });
    s += draw(Ce, H);
    s += tag(b.v[0].x - 12, b.v[0].y + 2, '2', { anchor: 'end' });
    s += tag(v2.x + 8, v2.y + 22, '1', { anchor: 'start' });
    s += tag(590, 206, 'ethyl 2-oxocyclohexane-1-carboxylate');
    return s;
  },
  caption: 'Cyclohexanone is numbered from its C=O carbon; the product is numbered as its name is, from the carbon carrying the CO₂Et. The same α carbon, cyclohexanone’s C2, becomes the product’s C1.',
});

export default FIGURES;
