/* Figures for the birch-reduction notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions used throughout:
   - rings are skeletal (this chapter comes long after skeletal structures);
     a carbon that carries a charge, a radical dot or a new hydrogen is drawn
     so that the dot, lone pair or CH2 label has a vertex to sit on;
   - a CH2 that took one of the new hydrogens is highlighted (kind 'hi');
   - a radical's unpaired electron is one larger dot, a lone pair two dots,
     as on the hydrogenation page's dissolving-metal figure;
   - lesson copies (id prefix l-, or shared figures listed in `lessons`) are
     340 wide or less, stacked, and use only fg-lbl and fg-tag text. */
import { atom, bond, arrow, curve, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

const f2 = (v) => (Math.round(v * 100) / 100).toString();

/* A hexagon kit. Vertex 0 is the top and the numbering runs clockwise, so
   1 and 5 are ortho, 2 and 4 meta, 3 para. Edge i joins vertex i to i+1. */
function hexKit(R) {
  const V = (cx, cy) => {
    const v = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
    return v;
  };
  /* A point `d` further out along the line from the ring centre through
     vertex i (negative d moves inside the ring). */
  const out = (cx, cy, i, d) => {
    const v = V(cx, cy)[i];
    return P(v.x + ((v.x - cx) / R) * d, v.y + ((v.y - cy) / R) * d);
  };
  const ring = (cx, cy, doubles, opts = {}) => {
    const v = V(cx, cy), mid = P(cx, cy);
    let g = '';
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      if (doubles.includes(i)) g += ringDouble(v[i], v[j], mid, { inset: opts.inset ?? 8, gap: opts.gap ?? 4 });
      else if (!(opts.skip || []).includes(i)) {
        /* Stop a single bond at the edge of a CH2 disc sitting on its vertex,
           so the bond never runs under the label (the dark theme's discs are
           not opaque). */
        const t = opts.trim || {};
        g += bond(v[i], v[j], { rFrom: t[i] || 0, rTo: t[j] || 0 });
      }
    }
    return g;
  };
  /* A substituent on vertex i: a bond out to a labelled disc. */
  const sub = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 34);
    const r = o.r ?? 18;
    return bond(V(cx, cy)[i], p, { rFrom: 0, rTo: r }) +
           atom(p.x, p.y, txt, { kind: o.kind || 'plain', r });
  };
  /* A CH2 label sitting on vertex i. */
  const ch2 = (cx, cy, i, hi, r = 17) => {
    const v = V(cx, cy)[i];
    return atom(v.x, v.y, 'CH₂', { kind: hi ? 'hi' : 'plain', r });
  };
  /* The outward direction at vertex i, in SVG degrees (0 = right, 90 = down). */
  const outDeg = (i) => -90 + i * 60;
  /* A radical's single electron just outside vertex i. */
  const dot = (cx, cy, i, d = 10) => {
    const p = out(cx, cy, i, d);
    return `<circle class="fg-lp" cx="${f2(p.x)}" cy="${f2(p.y)}" r="3.4"></circle>`;
  };
  /* A lone pair and a minus sign on vertex i. The minus sits `side` degrees
     round from the lone pair. */
  const anion = (cx, cy, i, side = 40) => {
    const v = V(cx, cy)[i];
    const a = (outDeg(i) + side) * Math.PI / 180;
    return lonePair(v.x, v.y, outDeg(i), { dist: 10 }) +
      text(v.x + Math.cos(a) * 21, v.y + Math.sin(a) * 21 + 5, '−', { cls: 'fg-warn', size: 16 });
  };
  /* A ring C=O on vertex i. */
  const ketone = (cx, cy, i, len = 30) => {
    const o = out(cx, cy, i, len);
    return bond(V(cx, cy)[i], o, { order: 2, rFrom: 0, rTo: 12, gap: 3 }) + atom(o.x, o.y, 'O', { r: 12 });
  };
  /* A small label inside the ring at vertex i (ring numbering). */
  const num = (cx, cy, i, s, o = {}) => {
    const p = out(cx, cy, i, -(o.d ?? 13));
    return text(p.x, p.y + 4, s, { cls: o.cls || 'fg-tag', size: 11 });
  };
  /* A label just outside vertex i. */
  const lab = (cx, cy, i, s, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 14);
    return text(p.x + (o.dx ?? 0), p.y + 4 + (o.dy ?? 0), s, { cls: o.cls || 'fg-tag', size: 11 });
  };
  /* A ring with CH2 discs on the listed vertices; `hi` lists the ones that
     took a new hydrogen. */
  const ringCH2 = (cx, cy, doubles, at, hi = [], r = 17, opts = {}) => {
    const trim = {};
    at.forEach((i) => { trim[i] = r; });
    return ring(cx, cy, doubles, { ...opts, trim }) + at.map((i) => ch2(cx, cy, i, hi.includes(i), r)).join('');
  };
  return { V, out, ring, ringCH2, sub, ch2, dot, anion, ketone, num, lab };
}

/* An H–OEt molecule with the two curved arrows of a proton transfer: the
   lone pair at `from` attacks H, and the H–O bond's electrons go to O.
   `dir` is +1 when OEt sits to the right of H, -1 when it sits to the left. */
function protonate(from, h, dir, bowA) {
  const o = P(h.x + dir * 40, h.y);
  let s = bond(h, o, { rFrom: 10, rTo: 17 });
  s += atom(h.x, h.y, 'H', { r: 10 });
  s += atom(o.x, o.y, dir > 0 ? 'OEt' : 'EtO', { r: 17 });
  s += curve(from, P(h.x - dir * 4, h.y + (from.y > h.y ? 9 : -9)), { bow: bowA, size: 7 });
  const mid = P((h.x + o.x) / 2, h.y);
  const up = from.y > h.y ? -1 : 1;
  s += curve(P(mid.x, mid.y + up * 4), P(o.x + dir * 11, o.y + up * 15), { bow: 16 * dir * up, size: 6 });
  return s;
}

/* The steps of the mechanism, each a function (cx, cy) so the notes figure
   and its stacked lesson copy draw the same structures. C1 is vertex 0. */
function mechParts(K) {
  return {
    benzene: (cx, cy) => K.ring(cx, cy, [0, 2, 4]),
    radAnion: (cx, cy) => K.ring(cx, cy, [1, 4]) + K.anion(cx, cy, 0, -45) + K.dot(cx, cy, 3),
    radical: (cx, cy) => K.ringCH2(cx, cy, [1, 4], [0], [0]) + K.dot(cx, cy, 3),
    carbanion: (cx, cy) => K.ringCH2(cx, cy, [1, 4], [0], [0]) + K.anion(cx, cy, 3, 45),
    diene: (cx, cy) => K.ringCH2(cx, cy, [1, 4], [0, 3], [0, 3]),
  };
}

const FIGURES = [];

/* ------------------------------------------------------------------ 1 ---
   The mechanism, drawn: which carbon takes each proton. */
FIGURES.push({
  id: 'birch-mechanism',
  section: 'birch-reduction',
  anchor: '<!-- fig:birch-mechanism:start -->',
  alt: 'Birch reduction of benzene in two rows. Row 1: benzene takes an electron from sodium and becomes a radical anion, drawn with a lone pair and negative charge on C1 and an unpaired electron on C4; curved arrows show the C1 lone pair taking the proton of ethanol, giving the cyclohexadienyl radical, with C1 now CH2 and the unpaired electron on C4. Row 2: the radical takes a second electron from sodium and becomes the cyclohexadienyl anion, with a lone pair and negative charge on C4; curved arrows show that lone pair taking a proton from ethanol, giving cyclohexa-1,4-diene with CH2 groups at C1 and C4.',
  viewBox: '0 0 760 500',
  build() {
    const R = 34, K = hexKit(R), M = mechParts(K);
    let s = '';
    const step = (x1, x2, y, top, bottom) =>
      arrow(P(x1, y), P(x2, y)) + text((x1 + x2) / 2, y - 12, top, { cls: 'fg-lbl', size: 12 }) +
      text((x1 + x2) / 2, y + 20, bottom, { cls: 'fg-sm' });
    const c1 = (cx, cy) => text(cx - 46, cy - 36, 'C1', { cls: 'fg-tag' });
    const c4 = (cx, cy) => text(cx - 46, cy + 44, 'C4', { cls: 'fg-tag' });

    // ---- row 1 ----
    const Y1 = 150;
    s += tag(30, 26, '1 · FIRST ELECTRON, FIRST PROTON', { anchor: 'start' });
    s += M.benzene(110, Y1);
    s += text(110, Y1 + 70, 'benzene', { cls: 'fg-tag' });
    s += step(166, 294, Y1, '+ e⁻', 'from Na');
    s += M.radAnion(380, Y1);
    s += protonate(P(384, Y1 - 47), P(430, 78), 1, -22, -9);
    s += c1(380, Y1) + c4(380, Y1);
    s += text(380, Y1 + 70, 'radical anion', { cls: 'fg-tag' });
    s += step(466, 594, Y1, '+ H⁺', 'from EtOH');
    s += M.radical(650, Y1);
    s += c1(650, Y1) + c4(650, Y1);
    s += text(650, Y1 + 70, 'cyclohexadienyl radical', { cls: 'fg-tag' });
    s += rule(30, 244, 730, 244);

    // ---- row 2 ----
    const Y2 = 350;
    s += tag(30, 270, '2 · SECOND ELECTRON, SECOND PROTON', { anchor: 'start' });
    s += M.radical(110, Y2);
    s += c1(110, Y2) + c4(110, Y2);
    s += text(110, Y2 + 90, 'cyclohexadienyl radical', { cls: 'fg-tag' });
    s += step(166, 294, Y2, '+ e⁻', 'from Na');
    s += M.carbanion(380, Y2);
    s += protonate(P(384, Y2 + 47), P(432, Y2 + 72), 1, 22, 9);
    s += c1(380, Y2) + c4(380, Y2);
    s += text(380, Y2 + 118, 'cyclohexadienyl anion', { cls: 'fg-tag' });
    s += step(466, 594, Y2, '+ H⁺', 'from EtOH');
    s += M.diene(650, Y2);
    s += c1(650, Y2) + c4(650, Y2);
    s += text(650, Y2 + 90, 'cyclohexa-1,4-diene', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Follow C1 and C4, the two carbons that take protons.',
});

FIGURES.push({
  id: 'l-birch-mechanism',
  lessons: ['birch-reduction'],
  alt: 'Birch reduction of benzene, stacked top to bottom: an electron from sodium gives a radical anion with a lone pair on C1 and an unpaired electron on C4; C1 takes a proton from ethanol, giving the cyclohexadienyl radical; a second electron gives the cyclohexadienyl anion with its lone pair on C4; C4 takes a proton from ethanol, giving cyclohexa-1,4-diene with CH2 groups at C1 and C4.',
  viewBox: '0 0 340 740',
  build() {
    const R = 30, K = hexKit(R), M = mechParts(K);
    const X = 160;
    let s = '';
    const step = (y1, y2, t) => arrow(P(X, y1), P(X, y2)) + text(X + 14, (y1 + y2) / 2 + 5, t, { cls: 'fg-lbl', anchor: 'start' });
    const name = (cy, a, b, cls = 'fg-tag') => text(X + 48, cy + (b ? -2 : 5), a, { cls, anchor: 'start' }) +
      (b ? text(X + 48, cy + 16, b, { cls, anchor: 'start' }) : '');
    const nums = (cy) => text(X + 28, cy - 36, 'C1', { cls: 'fg-tag', anchor: 'start' }) +
      text(X + 22, cy + 44, 'C4', { cls: 'fg-tag', anchor: 'start' });
    const Y = [44, 200, 356, 512, 674];

    s += M.benzene(X, Y[0]);
    s += name(Y[0], 'benzene');
    s += step(Y[0] + 40, Y[1] - 56, '+ e⁻ from Na');
    s += M.radAnion(X, Y[1]);
    s += protonate(P(X - 4, Y[1] - 42), P(X - 58, Y[1] - 52), -1, 18, 9);
    s += nums(Y[1]) + name(Y[1], 'radical', 'anion');
    s += step(Y[1] + 52, Y[2] - 56, '+ H⁺ from EtOH');
    s += M.radical(X, Y[2]);
    s += nums(Y[2]) + name(Y[2], 'cyclohexa-', 'dienyl radical');
    s += step(Y[2] + 52, Y[3] - 56, '+ e⁻ from Na');
    s += M.carbanion(X, Y[3]);
    s += protonate(P(X - 4, Y[3] + 42), P(X - 58, Y[3] + 52), -1, -18, -9);
    s += nums(Y[3]) + name(Y[3], 'cyclohexa-', 'dienyl anion');
    s += step(Y[3] + 72, Y[4] - 56, '+ H⁺ from EtOH');
    s += M.diene(X, Y[4]);
    s += nums(Y[4]) + name(Y[4], 'cyclohexa-', '1,4-diene', 'fg-tag-good');
    return s;
  },
  caption: 'C1 takes the first proton and C4, across the ring, takes the second.',
});

/* ------------------------------------------------------------------ 2 ---
   The cyclohexadienyl anion's charge on three carbons, and what a proton on
   the middle one gives compared with a proton on an end one. */
function middleParts(K, r = 17) {
  /* Ring numbers 1-6 clockwise from the top; a vertex carrying a CH2 gets
     its number just outside the CH2 disc instead of inside the ring. */
  const numbers = (cx, cy, ch2 = []) => [0, 1, 2, 3, 4, 5].map((i) =>
    ch2.includes(i) ? K.lab(cx, cy, i, String(i + 1), { d: r + 10 }) : K.num(cx, cy, i, String(i + 1))).join('');
  return {
    /* Resonance form with the charge at vertex c (1, 3 or 5). */
    form: (cx, cy, c, withNums = true) => {
      const doubles = c === 1 ? [2, 4] : c === 3 ? [1, 4] : [1, 3];
      return K.ringCH2(cx, cy, doubles, [0], [], r) + K.anion(cx, cy, c, c === 5 ? -45 : 45) +
        (withNums ? numbers(cx, cy, [0]) : '');
    },
    diene14: (cx, cy, withNums = true) => K.ringCH2(cx, cy, [1, 4], [0, 3], [3], r) +
      (withNums ? numbers(cx, cy, [0, 3]) : ''),
    diene13: (cx, cy, withNums = true) => K.ringCH2(cx, cy, [2, 4], [0, 1], [1], r) +
      (withNums ? numbers(cx, cy, [0, 1]) : ''),
  };
}
const resArrow = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { size: 7 }) + arrow(P(x2, y), P(x1, y), { size: 7 });

FIGURES.push({
  id: 'birch-middle',
  section: 'birch-reduction',
  anchor: '<!-- fig:birch-middle:start -->',
  alt: 'Top: three resonance forms of the cyclohexadienyl anion, each with CH2 at C1, placing the negative charge on C2, on C4 and on C6. C2 and C6 are the ends of the delocalized system, next to C1; C4 is the middle, straight across the ring from C1. Bottom left: a proton on C4 gives cyclohexa-1,4-diene, the product that forms. Bottom right: a proton on C2 would give cyclohexa-1,3-diene, which is conjugated and more stable but does not form.',
  viewBox: '0 0 760 510',
  build() {
    const K = hexKit(34), M = middleParts(K);
    const K2 = hexKit(40), M2 = middleParts(K2, 15);
    let s = '';
    s += tag(380, 26, 'THE CYCLOHEXADIENYL ANION: ONE CHARGE, THREE CARBONS');
    const Y = 136;
    s += M.form(150, Y, 1);
    s += resArrow(222, 308, Y + 12);
    s += M.form(380, Y, 3);
    s += resArrow(452, 538, Y + 12);
    s += M.form(610, Y, 5);
    s += text(150, Y + 84, 'charge on C2, an end', { cls: 'fg-tag' });
    s += text(380, Y + 84, 'charge on C4, the middle', { cls: 'fg-tag-good' });
    s += text(610, Y + 84, 'charge on C6, an end', { cls: 'fg-tag' });
    s += rule(30, 244, 730, 244);

    s += panel(30, 262, 340, 232, { kind: 'good' });
    s += text(200, 288, 'the proton goes to C4, the middle', { cls: 'fg-lbl', size: 12.5 });
    s += M2.diene14(200, 370);
    s += text(200, 464, 'cyclohexa-1,4-diene', { cls: 'fg-tag-good' });
    s += text(200, 482, 'this is the product that forms', { cls: 'fg-sm' });

    s += panel(390, 262, 340, 232, { kind: 'warn' });
    s += text(560, 288, 'a proton on C2, an end, would give', { cls: 'fg-lbl', size: 12.5 });
    s += M2.diene13(560, 370);
    s += text(560, 464, 'cyclohexa-1,3-diene', { cls: 'fg-tag' });
    s += text(560, 482, 'conjugated and more stable, but it does not form', { cls: 'fg-sm' });
    return s;
  },
  caption: 'The highlighted CH₂ is the carbon that took the second proton. Compare where it sits in the two products.',
});

FIGURES.push({
  id: 'l-birch-middle',
  lessons: ['birch-reduction'],
  alt: 'Top: the cyclohexadienyl anion drawn three ways, with the negative charge on C2, C4 and C6 in turn; C4 is the middle carbon, straight across from the CH2 at C1. Below: a proton on C4 gives cyclohexa-1,4-diene, which forms; a proton on C2 would give cyclohexa-1,3-diene, which is more stable but does not form.',
  viewBox: '0 0 340 480',
  build() {
    const K = hexKit(30), M = middleParts(K, 16);
    const K2 = hexKit(40), M2 = middleParts(K2, 15);
    let s = '';
    const Y = 64;
    s += M.form(56, Y, 1, false);
    s += resArrow(92, 134, Y + 18);
    s += M.form(170, Y, 3, false);
    s += resArrow(206, 248, Y + 18);
    s += M.form(284, Y, 5, false);
    s += text(56, Y + 72, 'C2: end', { cls: 'fg-tag' });
    s += text(170, Y + 72, 'C4: middle', { cls: 'fg-tag-good' });
    s += text(284, Y + 72, 'C6: end', { cls: 'fg-tag' });
    s += text(170, Y + 92, 'CH₂ is C1; count clockwise', { cls: 'fg-tag' });
    s += rule(10, 176, 330, 176);

    s += M2.diene14(80, 256, false);
    s += text(210, 244, 'H⁺ on C4, the middle:', { cls: 'fg-lbl' });
    s += text(210, 264, 'cyclohexa-1,4-diene', { cls: 'fg-tag-good' });
    s += text(210, 282, 'forms', { cls: 'fg-tag-good' });
    s += rule(10, 330, 330, 330);
    s += M2.diene13(80, 406, false);
    s += text(210, 390, 'H⁺ on C2, an end:', { cls: 'fg-lbl' });
    s += text(210, 410, 'cyclohexa-1,3-diene', { cls: 'fg-tag' });
    s += text(210, 428, 'more stable, but', { cls: 'fg-tag' });
    s += text(210, 446, 'does not form', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The highlighted CH₂ took the second proton.',
});

/* ------------------------------------------------------------------ 3 ---
   Donor versus acceptor, drawn as products. Shared by notes and lesson. */
const convert = (y) => arrow(P(116, y), P(200, y)) + text(158, y - 10, 'Na, NH₃', { cls: 'fg-tag' }) + text(158, y + 18, 'EtOH', { cls: 'fg-tag' });
/* An sp3 ring carbon (vertex 0) carrying a group up-left and its own new H
   up-right. */
function sp3Top(K, cx, cy, txt, r, len) {
  const c1 = K.V(cx, cy)[0];
  const co = armEnd(c1, 125, len), h = armEnd(c1, 45, 26);
  return bond(c1, co, { rFrom: 0, rTo: r }) + atom(co.x, co.y, txt, { r }) +
    bond(c1, h, { rFrom: 0, rTo: 10, cls: 'fg-bond-hi' }) + atom(h.x, h.y, 'H', { kind: 'hi', r: 10 });
}

FIGURES.push({
  id: 'birch-substituents',
  section: 'birch-reduction',
  lessons: ['birch-reduction'],
  anchor: '<!-- fig:birch-substituents:start -->',
  alt: 'Top row: anisole, methoxybenzene, is reduced by Na in NH3 with EtOH to 1-methoxycyclohexa-1,4-diene; the carbon carrying OCH3 is still on a double bond, and the two new CH2 groups face each other across the ring. Bottom row: benzoic acid is reduced to cyclohexa-2,5-diene-1-carboxylic acid; the carbon carrying COOH is now sp3 with its own hydrogen, and the other new CH2 is straight across the ring from it.',
  viewBox: '0 0 340 410',
  build() {
    const R = 30, K = hexKit(R);
    let s = '';
    const A = 66, B = 270;

    s += tag(170, 18, 'DONOR: ANISOLE');
    const Y1 = 110;
    s += K.ring(A, Y1, [0, 2, 4]) + K.sub(A, Y1, 0, 'OCH₃', { d: 32, r: 19 });
    s += convert(Y1);
    s += K.ringCH2(B, Y1, [0, 3], [2, 5], [2, 5]) + K.sub(B, Y1, 0, 'OCH₃', { d: 32, r: 19 });
    s += text(170, Y1 + 64, 'the OCH₃ carbon stays on a C=C', { cls: 'fg-tag-good' });
    s += text(170, Y1 + 82, 'the new CH₂ groups face each other', { cls: 'fg-tag' });
    s += rule(10, 210, 330, 210);

    s += tag(170, 232, 'ACCEPTOR: BENZOIC ACID');
    const Y2 = 322;
    s += K.ring(A, Y2, [0, 2, 4]) + K.sub(A, Y2, 0, 'COOH', { d: 32, r: 21 });
    s += convert(Y2);
    s += K.ringCH2(B, Y2, [1, 4], [3], [3]) + sp3Top(K, B, Y2, 'COOH', 21, 40);
    s += text(170, Y2 + 66, 'the COOH carbon becomes sp³', { cls: 'fg-tag-good' });
    s += text(170, Y2 + 84, 'the other new H is straight across', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Highlighted atoms are the new hydrogens. A donor keeps its carbon on a double bond; an acceptor makes its carbon sp³.',
});

/* The two rings the lesson's sort step adds: shown once the sort is done. */
FIGURES.push({
  id: 'l-birch-sort',
  lessons: ['birch-reduction'],
  alt: 'Top row: toluene is reduced by Na in NH3 with EtOH to 1-methylcyclohexa-1,4-diene; the carbon carrying CH3 stays on a double bond. Bottom row: methyl benzoate is reduced to methyl cyclohexa-2,5-diene-1-carboxylate; the carbon carrying the ester becomes sp3 with its own hydrogen.',
  viewBox: '0 0 340 410',
  build() {
    const R = 30, K = hexKit(R);
    let s = '';
    const A = 66, B = 270;

    s += tag(170, 18, 'TOLUENE: WEAK DONOR');
    const Y1 = 104;
    s += K.ring(A, Y1, [0, 2, 4]) + K.sub(A, Y1, 0, 'CH₃', { d: 30, r: 17 });
    s += convert(Y1);
    s += K.ringCH2(B, Y1, [0, 3], [2, 5], [2, 5]) + K.sub(B, Y1, 0, 'CH₃', { d: 30, r: 17 });
    s += text(170, Y1 + 64, 'the CH₃ carbon stays on a C=C', { cls: 'fg-tag-good' });
    s += rule(10, 190, 330, 190);

    s += tag(170, 212, 'METHYL BENZOATE: ACCEPTOR');
    const Y2 = 318;
    s += K.ring(A, Y2, [0, 2, 4]) + K.sub(A, Y2, 0, 'CO₂CH₃', { d: 34, r: 28 });
    s += convert(Y2);
    s += K.ringCH2(B, Y2, [1, 4], [3], [3]) + sp3Top(K, B, Y2, 'CO₂CH₃', 28, 46);
    s += text(170, Y2 + 66, 'the ester carbon becomes sp³', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Same pattern: the weak donor behaves like OCH₃, and the ester behaves like COOH.',
});

/* ------------------------------------------------------------------ 4 ---
   The worked example, 4-methylanisole, with its numbering and the ketone
   that dilute acid makes from it. */
FIGURES.push({
  id: 'birch-methylanisole',
  section: 'birch-reduction',
  anchor: '<!-- fig:birch-methylanisole:start -->',
  alt: '4-Methylanisole, with OCH3 on C1 and CH3 on C4, is reduced by Na in NH3 with EtOH to 1-methoxy-4-methylcyclohexa-1,4-diene, numbered 1 to 6 clockwise: double bonds C1=C2 and C4=C5, new CH2 groups at C3 and C6. Dilute aqueous acid then gives 4-methylcyclohex-3-en-1-one, numbered from the C=O: the C=O at C1 and the C=C between C3 and C4, which carries the methyl.',
  viewBox: '0 0 760 290',
  build() {
    const R = 34, K = hexKit(R);
    let s = '';
    const step = (x1, x2, y, top, bottom) =>
      arrow(P(x1, y), P(x2, y)) + text((x1 + x2) / 2, y - 12, top, { cls: 'fg-lbl', size: 12 }) +
      text((x1 + x2) / 2, y + 22, bottom, { cls: 'fg-sm' });
    const Y = 130;

    s += K.ring(110, Y, [0, 2, 4]) + K.sub(110, Y, 0, 'OCH₃', { d: 34, r: 19 }) + K.sub(110, Y, 3, 'CH₃', { d: 32, r: 17 });
    s += [0, 1, 2, 3, 4, 5].map((i) => K.num(110, Y, i, String(i + 1))).join('');
    s += text(110, 246, '4-methylanisole', { cls: 'fg-tag' });
    s += step(170, 300, Y, 'Na, NH₃', 'EtOH');

    s += K.ringCH2(380, Y, [0, 3], [2, 5], [2, 5]) + K.sub(380, Y, 0, 'OCH₃', { d: 34, r: 19 }) + K.sub(380, Y, 3, 'CH₃', { d: 32, r: 17 });
    s += [0, 1, 3, 4].map((i) => K.num(380, Y, i, String(i + 1))).join('');
    s += K.lab(380, Y, 2, '3', { d: 28 }) + K.lab(380, Y, 5, '6', { d: 28 });
    s += text(380, 246, '1-methoxy-4-methylcyclohexa-1,4-diene', { cls: 'fg-tag-good' });
    s += text(380, 264, 'sp³ at C3 and C6', { cls: 'fg-sm' });
    s += step(460, 590, Y, 'H₃O⁺', 'dilute, mild');

    s += K.ring(650, Y, [3]) + K.ketone(650, Y, 0, 30) + K.sub(650, Y, 3, 'CH₃', { d: 32, r: 17 });
    /* numbered from the C=O, counter-clockwise, so the C=C gets locant 3 */
    const order = [0, 5, 4, 3, 2, 1];
    s += order.map((v, k) => K.num(650, Y, v, String(k + 1))).join('');
    s += text(650, 246, '4-methylcyclohex-3-en-1-one', { cls: 'fg-tag-good' });
    s += text(650, 264, 'C=C not conjugated with C=O', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Follow the two substituted carbons: both are still on double bonds after the Birch step.',
});

/* ------------------------------------------------------------------ 5 ---
   Anisole to cyclohex-2-en-1-one in three steps. */
function enoneParts(K) {
  return {
    anisole: (cx, cy) => K.ring(cx, cy, [0, 2, 4]) + K.sub(cx, cy, 0, 'OCH₃', { d: 32, r: 19 }),
    enolEther: (cx, cy) => K.ringCH2(cx, cy, [0, 3], [2, 5]) + K.sub(cx, cy, 0, 'OCH₃', { d: 32, r: 19 }),
    bg: (cx, cy) => K.ring(cx, cy, [3]) + K.ketone(cx, cy, 0, 28) +
      K.lab(cx, cy, 5, 'α', { cls: 'fg-tag-good', d: 12, dx: -4 }) +
      K.lab(cx, cy, 4, 'β', { cls: 'fg-tag-good', d: 12, dx: -4 }) +
      K.lab(cx, cy, 3, 'γ', { cls: 'fg-tag-good', d: 14 }),
    ab: (cx, cy) => K.ring(cx, cy, [4]) + K.ketone(cx, cy, 0, 28) +
      K.lab(cx, cy, 5, 'α', { cls: 'fg-tag-good', d: 12, dx: -4 }) +
      K.lab(cx, cy, 4, 'β', { cls: 'fg-tag-good', d: 12, dx: -4 }),
  };
}

FIGURES.push({
  id: 'birch-enone',
  section: 'birch-reduction',
  anchor: '<!-- fig:birch-enone:start -->',
  alt: 'Anisole is reduced by Na in NH3 with EtOH to 1-methoxycyclohexa-1,4-diene, an enol ether. Mild aqueous acid hydrolyzes it to cyclohex-3-en-1-one, whose C=C lies between the beta and gamma carbons, not conjugated with the C=O. Stronger acid or base moves the C=C into conjugation, giving cyclohex-2-en-1-one, with the C=C between the alpha and beta carbons.',
  viewBox: '0 0 760 260',
  build() {
    const R = 32, K = hexKit(R), E = enoneParts(K);
    let s = '';
    const Y = 118;
    const step = (x1, x2, top, bottom) =>
      arrow(P(x1, Y), P(x2, Y)) + text((x1 + x2) / 2, Y - 12, top, { cls: 'fg-lbl', size: 12 }) +
      text((x1 + x2) / 2, Y + 22, bottom, { cls: 'fg-sm' });
    s += E.anisole(76, Y);
    s += text(76, 206, 'anisole', { cls: 'fg-tag' });
    s += step(124, 204, 'Na, NH₃', 'EtOH');
    s += E.enolEther(264, Y);
    s += text(264, 206, 'an enol ether', { cls: 'fg-tag' });
    s += step(320, 410, 'H₃O⁺, mild', '− CH₃OH');
    s += E.bg(470, Y);
    s += text(470, 206, 'cyclohex-3-en-1-one', { cls: 'fg-tag' });
    s += text(470, 224, 'β,γ: not conjugated', { cls: 'fg-sm' });
    s += step(522, 612, 'stronger', 'acid or base');
    s += E.ab(672, Y);
    s += text(672, 206, 'cyclohex-2-en-1-one', { cls: 'fg-tag-good' });
    s += text(672, 224, 'α,β: conjugated', { cls: 'fg-sm' });
    s += text(672, 240, 'a Michael acceptor', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Watch the C=C that is left after hydrolysis: it starts one carbon too far from the C=O, and the last step moves it next door.',
});

FIGURES.push({
  id: 'l-birch-enone',
  lessons: ['birch-reduction'],
  alt: 'Stacked top to bottom: anisole; Na in NH3 with EtOH gives 1-methoxycyclohexa-1,4-diene, an enol ether; mild aqueous acid gives cyclohex-3-en-1-one, beta,gamma-unsaturated; stronger acid or base gives cyclohex-2-en-1-one, alpha,beta-unsaturated and a Michael acceptor.',
  viewBox: '0 0 340 660',
  build() {
    const R = 30, K = hexKit(R), E = enoneParts(K);
    const X = 80;
    let s = '';
    const step = (y1, y2, t) => arrow(P(X, y1), P(X, y2)) + text(X + 14, (y1 + y2) / 2 + 5, t, { cls: 'fg-lbl', anchor: 'start' });
    const name = (y, a, b) => text(150, y, a, { cls: 'fg-lbl', anchor: 'start' }) + (b ? text(150, y + 18, b, { cls: 'fg-tag', anchor: 'start' }) : '');
    s += E.anisole(X, 90);
    s += name(96, 'anisole');
    s += step(128, 172, 'Na, NH₃, EtOH');
    s += E.enolEther(X, 262);
    s += name(262, 'enol ether');
    s += step(300, 344, 'H₃O⁺, mild');
    s += E.bg(X, 422);
    s += name(416, 'cyclohex-3-en-1-one', 'β,γ: not conjugated');
    s += step(486, 530, 'stronger acid or base');
    s += E.ab(X, 608);
    s += name(598, 'cyclohex-2-en-1-one', 'α,β: conjugated,');
    s += text(150, 634, 'a Michael acceptor', { cls: 'fg-tag', anchor: 'start' });
    return s;
  },
  caption: 'The last step moves the C=C next to the C=O.',
});

/* ------------------------------------------------------------------ 6 ---
   Naphthalene: one ring at a time. Two hexagons share a vertical edge; the
   right ring's vertices 5 and 4 are the left ring's 1 and 2. */
FIGURES.push({
  id: 'birch-naphthalene',
  section: 'birch-reduction',
  anchor: '<!-- fig:birch-naphthalene:start -->',
  alt: 'Naphthalene, two fused benzene rings, is reduced by Na in NH3 with EtOH to 1,4-dihydronaphthalene: one ring now has CH2 groups at C1 and C4 and a C=C between C2 and C3, and the other ring is still a benzene ring. More metal under forcing conditions reduces that ring too, giving 1,4,5,8-tetrahydronaphthalene, with CH2 groups at C1, C4, C5 and C8 and a C=C between the two shared carbons.',
  viewBox: '0 0 760 250',
  build() {
    const R = 30, K = hexKit(R);
    const w = R * Math.sqrt(3);
    const Y = 112;
    let s = '';
    /* A fused pair centred at mx. `left` and `right` list double-bond edges
       for each ring; ch2L / ch2R list vertices carrying CH2. */
    const pair = (mx, left, right, ch2L = [], ch2R = []) => {
      const L = mx - w / 2, Rt = mx + w / 2;
      return K.ringCH2(L, Y, left, ch2L, ch2L) + K.ringCH2(Rt, Y, right, ch2R, ch2R, 17, { skip: [4] });
    };
    const step = (x1, x2, top, bottom) =>
      arrow(P(x1, Y), P(x2, Y)) + text((x1 + x2) / 2, Y - 12, top, { cls: 'fg-lbl', size: 12 }) +
      text((x1 + x2) / 2, Y + 22, bottom, { cls: 'fg-sm' });

    s += pair(110, [1, 3, 5], [0, 2]);
    s += text(110, 196, 'naphthalene', { cls: 'fg-tag' });
    s += step(196, 300, 'Na, NH₃', 'EtOH');
    s += pair(380, [1, 3, 5], [1], [], [0, 3]);
    s += text(380, 196, '1,4-dihydronaphthalene', { cls: 'fg-tag-good' });
    s += text(380, 214, 'left ring: still a benzene ring', { cls: 'fg-sm' });
    s += step(466, 570, 'more metal', 'forcing');
    s += pair(650, [1, 4], [1], [0, 3], [0, 3]);
    s += text(650, 196, '1,4,5,8-tetrahydronaphthalene', { cls: 'fg-tag' });
    s += text(650, 214, 'second ring: much slower', { cls: 'fg-sm' });
    return s;
  },
  caption: 'Highlighted CH₂ groups took the new hydrogens. The first ring is reduced under ordinary Birch conditions; the second needs forcing.',
});

export default FIGURES;
