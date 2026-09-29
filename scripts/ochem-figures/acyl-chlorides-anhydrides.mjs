/* Figures for the acyl-chlorides-anhydrides notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every drawing uses one concrete case. Acetic acid is the acid in the salt
   figure and in the SOCl2 mechanism; acetyl chloride meets pyridine and
   methylamine in the relay; acetic anhydride meets methanol; butanoic acid
   carries the worked example; succinic acid carries the cyclic anhydride.
   Atoms are labelled, so every curved arrow starts at a named lone pair or
   bond and lands on a named atom or bond.

   Panels are functions of their content origin. The notes figures lay them
   out in rows; the lesson copies (id prefix l-) stack the same panels in one
   column no wider than 340, and every label in them is fg-lbl or fg-tag. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (l) => (l === 'H' ? 11 : l === '' ? 0 : l.length <= 2 ? 14 : l.length <= 5 ? 4 + l.length * 4 : 4 + l.length * 3.9);
const A = (x, y, l = 'C', k) => ({ x, y, l, k, r: rad(l) });
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.l, { kind: a.k, r: a.r })).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const off = (p, dx, dy) => P(p.x + dx, p.y + dy);
/* Lone pair on atom a, pointing in screen direction deg (0 = right, 90 = down). */
const lp = (a, deg, extra = 6) => lonePair(a.x, a.y, deg, { dist: a.r + extra });
const lpAt = (a, deg, extra = 6) => {
  const r = (deg * Math.PI) / 180, d = a.r + extra;
  return P(a.x + Math.cos(r) * d, a.y + Math.sin(r) * d);
};
const plusSign = (x, y) => text(x, y, '+', { cls: 'fg-lbl', size: 16 });

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

/* A six-membered ring with a labelled nitrogen. `rot` places vertex 0 (the N)
   by angle, counterclockwise from the right; `doubles` lists the i for which
   the bond from vertex i to vertex i+1 is double. */
function ring6(cx, cy, r, rot, doubles, nLabel, nKind) {
  const pts = polyPts(cx, cy, 6, r, rot), c = P(cx, cy);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += doubles.includes(i) ? ringDouble(a, b, c, { inset: 7 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  const N = A(pts[0].x, pts[0].y, nLabel, nKind);
  return { svg: s, N, pts, drawN: draw(N) };
}

/* ====================================== the acid meets an amine: a salt === */
/* Acetic acid + methylamine, with the two proton-transfer arrows. X, Y is the
   content origin; the block is about 250 wide and 190 tall. */
function saltLeft(X, Y) {
  const C = A(X + 60, Y + 90), O1 = A(X + 60, Y + 44, 'O'), Me = A(X + 20, Y + 114, 'CH₃'),
        Oh = A(X + 100, Y + 114, 'O'), H = A(X + 146, Y + 114, 'H', 'warn');
  const N = A(X + 206, Y + 114, 'N', 'hi'), Nme = A(X + 206, Y + 162, 'CH₃'),
        Hu = A(X + 206, Y + 70, 'H'), Hr = A(X + 248, Y + 114, 'H');
  let s = bd(C, O1, { order: 2 }) + bd(C, Me) + bd(C, Oh) + bd(Oh, H);
  s += bd(N, Nme) + bd(N, Hu) + bd(N, Hr);
  s += lp(Oh, -75, 4) + lp(Oh, 150, 4) + lp(N, 180, 4);
  s += draw(C, O1, Me, Oh, H, N, Nme, Hu, Hr);
  s += curve(off(lpAt(N, 180, 4), -4, 0), off(H, 10, -6), { bow: 14 });
  s += curve(mid(Oh, H), off(Oh, 11, 15), { bow: -8 });
  s += tag(X + 60, Y + 170, 'acetic acid');
  s += tag(X + 222, Y + 196, 'methylamine');
  return s;
}
function saltRight(X, Y) {
  const C = A(X + 60, Y + 90), O1 = A(X + 60, Y + 44, 'O'), Me = A(X + 20, Y + 114, 'CH₃'),
        Om = A(X + 100, Y + 114, 'O⁻', 'warn');
  const N = A(X + 206, Y + 114, 'N⁺', 'hi'), Nme = A(X + 206, Y + 162, 'CH₃'),
        Hu = A(X + 206, Y + 70, 'H'), Hr = A(X + 248, Y + 114, 'H'), Hn = A(X + 160, Y + 114, 'H', 'warn');
  let s = bd(C, O1, { order: 2 }) + bd(C, Me) + bd(C, Om);
  s += bd(N, Nme) + bd(N, Hu) + bd(N, Hr) + bd(N, Hn);
  s += draw(C, O1, Me, Om, N, Nme, Hu, Hr, Hn);
  s += tag(X + 60, Y + 170, 'acetate');
  s += tag(X + 222, Y + 196, 'methylammonium');
  return s;
}

FIGURES.push({
  id: 'acid-amine-salt',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<h3>Why the acid itself is a poor acylating agent</h3>',
  viewBox: '0 0 760 250',
  alt: 'Acetic acid and methylamine. The nitrogen lone pair takes the acid proton and the O–H bond electrons stay on oxygen, giving acetate, with a negative oxygen, and methylammonium, with a positive nitrogen that has no lone pair left.',
  build() {
    let s = saltLeft(14, 10);
    s += arrow(P(300, 124), P(370, 124));
    s += tag(335, 112, 'fast');
    s += saltRight(400, 10);
    s += tag(460, 238, 'now an anion: a poor electrophile', { cls: 'fg-tag-warn' });
    s += tag(640, 238, 'no lone pair left', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Acetic acid and methylamine. Follow the two arrows: the nitrogen lone pair takes the proton, so the amine never reaches the carbonyl carbon.',
});

FIGURES.push({
  id: 'l-acid-amine-salt',
  lessons: ['acyl-chlorides-anhydrides'],
  viewBox: '0 0 320 470',
  alt: 'Acetic acid and methylamine. The nitrogen lone pair takes the acid proton, giving acetate and methylammonium.',
  build() {
    let s = saltLeft(26, 0);
    s += arrow(P(160, 212), P(160, 254));
    s += tag(172, 238, 'fast', { anchor: 'start' });
    s += saltRight(26, 250);
    return s;
  },
  caption: 'The amine&rsquo;s lone pair takes the proton, so it never reaches the carbonyl carbon.',
});

/* ============================ the reactivity ladder, and the way up it === */
FIGURES.push({
  id: 'one-way-ladder',
  section: 'acyl-chlorides-anhydrides',
  anchor: 'The fix is to climb to the top first.',
  viewBox: '0 0 760 280',
  alt: 'Four acyl derivatives on descending steps: acid chloride (leaving group chloride), anhydride (carboxylate), ester (alkoxide) and amide (amide anion), with downward arrows between them. A carboxylic acid sits to the side, and one upward arrow labeled SOCl2 runs from it to the acid chloride.',
  build() {
    let s = '';
    const steps = [
      { y: 40,  lab: 'acid chloride', sub: 'leaving group: Cl⁻' },
      { y: 98,  lab: 'anhydride',     sub: 'leaving group: RCOO⁻' },
      { y: 156, lab: 'ester',         sub: 'leaving group: RO⁻' },
      { y: 214, lab: 'amide',         sub: 'leaving group: R₂N⁻' },
    ];
    steps.forEach((st, i) => {
      const x = 360 + i * 40;
      s += panel(x, st.y, 200, 46);
      s += text(x + 16, st.y + 20, st.lab, { cls: 'fg-lbl', anchor: 'start' });
      s += text(x + 16, st.y + 37, st.sub, { cls: 'fg-sm', anchor: 'start' });
      if (i < steps.length - 1) s += arrow(P(x + 208, st.y + 24), P(x + 252, st.y + 70));
    });
    s += tag(700, 50, 'down: easy', { cls: 'fg-tag-good' });

    s += panel(24, 176, 220, 64, { kind: 'warn' });
    s += text(40, 200, 'carboxylic acid', { cls: 'fg-lbl', anchor: 'start' });
    s += text(40, 222, 'pKₐ 4–5: it gives up its proton', { cls: 'fg-sm', anchor: 'start' });
    s += arrow(P(200, 170), P(352, 66));
    s += tag(250, 104, 'SOCl₂', { cls: 'fg-tag-good', anchor: 'end' });
    s += tag(250, 122, 'the way up', { anchor: 'end' });
    return s;
  },
  caption: 'Read each rung by its leaving group. From chloride down to the amide anion, each one is a stronger base and leaves less readily.',
});

/* ===================================== SOCl2 on acetic acid, four steps === */
const MW = 300;           // content width of one mechanism panel
const MH = 236;           // panel height

function s1(X, Y) {
  const C = A(X + 70, Y + 100), O1 = A(X + 70, Y + 54, 'O'), Me = A(X + 28, Y + 126, 'CH₃'),
        Oh = A(X + 112, Y + 126, 'O', 'hi'), H = A(X + 112, Y + 172, 'H');
  const S = A(X + 196, Y + 118, 'S', 'warn'), So = A(X + 196, Y + 72, 'O'),
        Cl1 = A(X + 242, Y + 118, 'Cl', 'warn'), Cl2 = A(X + 196, Y + 164, 'Cl');
  let s = bd(C, O1, { order: 2 }) + bd(C, Me) + bd(C, Oh) + bd(Oh, H);
  s += bd(S, So, { order: 2 }) + bd(S, Cl1) + bd(S, Cl2);
  s += lp(Oh, -25) + lp(Oh, 150) + lp(S, 45, 4) + lp(Cl1, 0, 4);
  s += draw(C, O1, Me, Oh, H, S, So, Cl1, Cl2);
  s += curve(lpAt(Oh, -25), off(S, -17, -6), { bow: -14 });
  s += curve(mid(S, Cl1), off(Cl1, 0, -19), { bow: -10 });
  return s;
}
function s2(X, Y) {
  const C = A(X + 66, Y + 100), O1 = A(X + 66, Y + 54, 'O'), Me = A(X + 24, Y + 126, 'CH₃'),
        Op = A(X + 108, Y + 126, 'O⁺', 'hi'), H = A(X + 108, Y + 172, 'H', 'warn');
  const S = A(X + 154, Y + 100, 'S'), So = A(X + 154, Y + 54, 'O'), Cl = A(X + 200, Y + 126, 'Cl');
  const Clm = A(X + 204, Y + 184, 'Cl⁻', 'warn');
  let s = bd(C, O1, { order: 2 }) + bd(C, Me) + bd(C, Op) + bd(Op, H);
  s += bd(S, So, { order: 2 }) + bd(S, Op) + bd(S, Cl);
  s += lp(S, 90, 4) + lp(Clm, 180, 4);
  s += draw(C, O1, Me, Op, H, S, So, Cl, Clm);
  s += curve(lpAt(Clm, 180, 4), off(H, 13, 4), { bow: 10 });
  s += curve(mid(Op, H), off(Op, -18, 8), { bow: -10 });
  return s;
}
function s3(X, Y) {
  const Clm = A(X + 30, Y + 62, 'Cl⁻', 'warn');
  const C = A(X + 96, Y + 104, 'C', 'hi'), O1 = A(X + 96, Y + 58, 'O'), Me = A(X + 54, Y + 130, 'CH₃'),
        Oe = A(X + 138, Y + 130, 'O');
  const S = A(X + 184, Y + 104, 'S'), So = A(X + 184, Y + 58, 'O'), Cl = A(X + 230, Y + 130, 'Cl');
  let s = bd(C, O1, { order: 2 }) + bd(C, Me) + bd(C, Oe);
  s += bd(Oe, S) + bd(S, So, { order: 2 }) + bd(S, Cl);
  s += lp(Clm, 32, 4) + lp(S, 90, 4);
  s += draw(Clm, C, O1, Me, Oe, S, So, Cl);
  s += curve(lpAt(Clm, 32, 4), off(C, -14, -8), { bow: 8 });
  s += curve(mid(C, O1), off(O1, 18, 2), { bow: -10 });
  return s;
}
function s4(X, Y) {
  const C = A(X + 96, Y + 106), Ot = A(X + 96, Y + 58, 'O⁻', 'warn'), Clc = A(X + 50, Y + 106, 'Cl', 'hi'),
        Me = A(X + 74, Y + 150, 'CH₃'), Oe = A(X + 140, Y + 132, 'O');
  const S = A(X + 186, Y + 106, 'S'), So = A(X + 186, Y + 60, 'O'), Cl = A(X + 232, Y + 132, 'Cl', 'warn');
  let s = bd(C, Ot) + bd(C, Clc) + bd(C, Me) + bd(C, Oe);
  s += bd(Oe, S) + bd(S, So, { order: 2 }) + bd(S, Cl);
  s += lp(Ot, 0, 4) + lp(S, 90, 4);
  s += draw(C, Ot, Clc, Me, Oe, S, So, Cl);
  s += curve(lpAt(Ot, 0, 4), off(mid(C, Ot), 5, 2), { bow: -12 });
  s += curve(mid(C, Oe), mid(Oe, S), { bow: -14 });
  s += curve(mid(S, Cl), off(Cl, 16, -12), { bow: -10 });
  return s;
}
const socl2Panels = [
  [s1, '1 · O bonds to S; Cl⁻ leaves', ['acetic acid + thionyl chloride']],
  [s2, '2 · Cl⁻ takes the proton', ['HCl forms; an acyl chlorosulfite is left']],
  [s3, '3 · Cl⁻ adds to the C=O', ['the π electrons move onto O']],
  [s4, '4 · C=O re-forms; the group falls apart', ['acetyl chloride + SO₂ + Cl⁻', 'fg-tag-good']],
];

FIGURES.push({
  id: 'chlorosulfite-self-destructs',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<!-- anchor:chlorosulfite -->',
  viewBox: '0 0 760 490',
  alt: 'Acetic acid and thionyl chloride in four steps. 1: the OH oxygen attacks sulfur and a chloride leaves. 2: chloride removes the proton from the now positive oxygen, giving HCl and an acyl chlorosulfite. 3: chloride adds to the carbonyl carbon and the pi electrons move onto oxygen. 4: the oxygen anion re-forms the C=O, the C–O bond to the chlorosulfite breaks and becomes an S=O bond, and the S–Cl bond breaks, giving acetyl chloride, sulfur dioxide and chloride.',
  build() {
    let s = '';
    socl2Panels.forEach(([fn, title, lines], i) => {
      const ox = 4 + (i % 2) * 380, oy = 4 + Math.floor(i / 2) * (MH + 12);
      s += frameP(ox, oy, 372, MH, title, [lines.length === 2 ? [lines[0], lines[1]] : lines[0]], i === 3 ? 'good' : undefined);
      s += fn(ox + 36, oy);
    });
    return s;
  },
  caption: 'Acetic acid and thionyl chloride. Watch the oxygen that started as the OH: it never comes back, because in step 4 it leaves as part of SO₂.',
});

FIGURES.push({
  id: 'l-chlorosulfite-self-destructs',
  lessons: ['acyl-chlorides-anhydrides'],
  viewBox: '0 0 320 980',
  alt: 'Acetic acid and thionyl chloride in four steps: O bonds to S and chloride leaves; chloride takes the proton; chloride adds to the C=O; the C=O re-forms and the leaving group falls apart into SO2 and chloride, giving acetyl chloride.',
  build() {
    let s = '';
    socl2Panels.forEach(([fn, title, lines], i) => {
      const ox = 4, oy = 4 + i * (MH + 8);
      s += frameP(ox, oy, 312, MH, title, [lines.length === 2 ? [lines[0], lines[1]] : lines[0]], i === 3 ? 'good' : undefined);
      s += fn(ox + 8, oy);
    });
    return s;
  },
  caption: 'The oxygen that started as the OH leaves in step 4, as part of SO₂.',
});

/* ================================ pyridine: attack, hand on, come back === */
function r1(X, Y) {
  const R = ring6(X + 52, Y + 108, 26, 0, [1, 3, 5], 'N', 'hi');
  const C = A(X + 176, Y + 108, 'C', 'hi'), O1 = A(X + 176, Y + 62, 'O'),
        Cl = A(X + 216, Y + 132, 'Cl', 'warn'), Me = A(X + 136, Y + 136, 'CH₃');
  let s = R.svg + bd(C, O1, { order: 2 }) + bd(C, Cl) + bd(C, Me);
  s += lp(R.N, 0, 4);
  s += R.drawN + draw(C, O1, Cl, Me);
  s += curve(lpAt(R.N, 0, 4), off(C, -16, -4), { bow: -10 });
  s += curve(mid(C, O1), off(O1, 18, 2), { bow: -10 });
  s += tag(X + 52, Y + 158, 'pyridine');
  return s;
}
function r2(X, Y) {
  const R = ring6(X + 44, Y + 108, 26, 0, [1, 3, 5], 'N⁺', 'hi');
  const C = A(X + 118, Y + 108, 'C', 'hi'), O1 = A(X + 142, Y + 68, 'O'), Me = A(X + 142, Y + 148, 'CH₃');
  const N = A(X + 212, Y + 108, 'N', 'hi'), Hu = A(X + 212, Y + 64, 'H'), Hd = A(X + 212, Y + 152, 'H'),
        Nme = A(X + 258, Y + 108, 'CH₃');
  let s = R.svg + bond(R.N, C, { rFrom: R.N.r, rTo: C.r }) + bd(C, O1, { order: 2 }) + bd(C, Me);
  s += bd(N, Hu) + bd(N, Hd) + bd(N, Nme);
  s += lp(N, 180, 4);
  s += R.drawN + draw(C, O1, Me, N, Hu, Hd, Nme);
  s += curve(lpAt(N, 180, 4), off(C, 16, 0), { bow: 6 });
  s += curve(mid(C, O1), off(O1, -18, -4), { bow: 10 });
  return s;
}
function r3(X, Y) {
  const Me = A(X + 24, Y + 128, 'CH₃'), C = A(X + 64, Y + 102), O1 = A(X + 64, Y + 56, 'O'),
        N = A(X + 106, Y + 128, 'N', 'hi'), Hn = A(X + 106, Y + 172, 'H'), Nme = A(X + 148, Y + 102, 'CH₃');
  let s = bd(C, O1, { order: 2 }) + bd(C, Me) + bd(C, N) + bd(N, Hn) + bd(N, Nme);
  s += draw(Me, C, O1, N, Hn, Nme);
  s += plusSign(X + 188, Y + 112);
  const R = ring6(X + 246, Y + 96, 24, -90, [1, 3, 5], 'N⁺', 'hi');
  const H = A(R.N.x, R.N.y + 44, 'H');
  s += R.svg + bond(R.N, H, { rFrom: R.N.r, rTo: H.r }) + R.drawN + draw(H);
  return s;
}
/* DMAP: the acetyl pyridinium ion and the contributor with C=N+Me2. The long
   groups are bare text, so their discs do not crowd the ring. */
function r4(X, Y) {
  let s = '';
  const form = (yc, b) => {
    const cx = X + 130, r = 36;
    const pts = polyPts(cx, yc, 6, r, 0), c = P(cx, yc);
    const doubles = b ? [1, 4] : [0, 2, 4];     // bond i joins vertex i and i+1
    let g = '';
    for (let i = 0; i < 6; i++) {
      const a = pts[i], q = pts[(i + 1) % 6];
      g += doubles.includes(i) ? ringDouble(a, q, c, { inset: 7 }) : bond(a, q, { rFrom: 0, rTo: 0 });
    }
    const N = A(pts[0].x, pts[0].y, b ? 'N' : 'N⁺', b ? undefined : 'hi');
    const Nm = { x: pts[3].x - 50, y: yc, r: 14 };
    const Ac = { x: pts[0].x + 58, y: yc, r: 24 };
    g += bond(N, Ac, { rFrom: N.r, rTo: Ac.r });
    g += bond(pts[3], Nm, { rFrom: 0, rTo: Nm.r, order: b ? 2 : 1 });
    g += draw(N) + atom(Nm.x, Nm.y, 'N', { kind: b ? 'hi' : undefined, r: 14 });
    g += text(Nm.x - 15, yc + 5, 'Me₂', { cls: 'fg-lbl', anchor: 'end' });
    g += text(Ac.x, yc + 5, 'COCH₃', { cls: 'fg-lbl' });
    if (b) {
      g += text(Nm.x + 11, yc - 13, '+', { cls: 'fg-lbl' });
      g += lp(N, -90, 3);
    } else {
      g += lp(Nm, -90, 3);
      g += curve(lpAt(Nm, -90, 3), off(mid(Nm, pts[3]), 6, -5), { bow: -10 });
      g += curve(mid(pts[2], pts[3]), mid(pts[1], pts[2]), { bow: 12 });
      g += curve(mid(pts[0], pts[1], 0.62), off(N, 12, -17), { bow: -10 });
    }
    return g;
  };
  s += form(Y + 78, false);
  s += arrow(P(X + 130, Y + 124), P(X + 130, Y + 140), { size: 7 }) + arrow(P(X + 130, Y + 132), P(X + 130, Y + 116), { size: 7 });
  s += form(Y + 172, true);
  return s;
}
const relayPanels = [
  [r1, '1 · pyridine adds to the C=O', ['its lone pair sits in the ring plane', 'then Cl⁻ leaves: an N-acylpyridinium ion']],
  [r2, '2 · the amine adds to the same C=O', ['then pyridine leaves']],
  [r3, '3 · amide made, pyridine back', ['N-methylacetamide + pyridinium chloride']],
];

FIGURES.push({
  id: 'pyridine-relay',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<!-- anchor:pyridine-relay -->',
  viewBox: '0 0 760 490',
  alt: 'Pyridine as an acyl relay. 1: the pyridine nitrogen lone pair, in the plane of the ring, adds to the carbonyl carbon of acetyl chloride, and chloride then leaves, giving an N-acetylpyridinium ion. 2: methylamine adds to the same carbonyl carbon and pyridine then leaves. 3: the products are N-methylacetamide and pyridinium chloride. 4: in the DMAP version, the dimethylamino lone pair pushes electrons through the ring onto the ring nitrogen, so the positive charge is shared by the dimethylamino nitrogen.',
  build() {
    let s = '';
    relayPanels.forEach(([fn, title, lines], i) => {
      const ox = 4 + (i % 2) * 380, oy = 4 + Math.floor(i / 2) * (MH + 12);
      s += frameP(ox, oy, 372, MH, title, lines, i === 2 ? 'good' : undefined);
      s += fn(ox + 36, oy);
    });
    s += frameP(384, 252, 372, MH, '4 · DMAP: NMe₂ shares the + charge', ['two contributors of one ion']);
    s += r4(384 + 36, 252);
    return s;
  },
  caption: 'Acetyl chloride, pyridine and methylamine. The acyl group passes through pyridine on its way to the amine, and pyridine comes out unchanged except for the proton it picks up.',
});

FIGURES.push({
  id: 'l-pyridine-relay',
  lessons: ['acyl-chlorides-anhydrides'],
  viewBox: '0 0 320 740',
  alt: 'Pyridine adds to acetyl chloride and chloride leaves, giving an N-acetylpyridinium ion; methylamine adds to the same carbonyl and pyridine leaves; the products are N-methylacetamide and pyridinium chloride.',
  build() {
    let s = '';
    relayPanels.forEach(([fn, title, lines], i) => {
      const ox = 4, oy = 4 + i * (MH + 8);
      s += frameP(ox, oy, 312, MH, title, lines.slice(-1), i === 2 ? 'good' : undefined);
      s += fn(ox + 8, oy);
    });
    return s;
  },
  caption: 'The acyl group passes through pyridine on its way to the amine.',
});

/* ================================================ butanoic acid, two ways === */
/* Propyl chain + carbonyl carbon, skeletal. Returns the carbonyl carbon and
   the position for the group X on it. */
function butanoyl(x0, y0, xLabel, xKind) {
  const p = zig(x0, y0, 4, 28, 16);            // p[3] is the carbonyl carbon
  const C = p[3], O = A(C.x, C.y - 40, 'O'), X = A(C.x + 30, C.y + 18, xLabel, xKind);
  let s = sk(p[0], p[1]) + sk(p[1], p[2]) + sk(p[2], C);
  s += bond(C, O, { order: 2, rFrom: 0, rTo: O.r }) + bond(C, X, { rFrom: 0, rTo: X.r });
  s += draw(O, X);
  return { svg: s, C, X };
}

FIGURES.push({
  id: 'butanoyl-routes',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<!-- anchor:butanoyl-routes -->',
  viewBox: '0 0 760 360',
  alt: 'Butanoic acid with SOCl2 gives butanoyl chloride. Butanoyl chloride with propan-2-ol and pyridine gives isopropyl butanoate. Butanoyl chloride with two equivalents of diethylamine gives N,N-diethylbutanamide and diethylammonium chloride.',
  build() {
    let s = '';
    let m = butanoyl(90, 110, 'OH');
    s += m.svg + tag(132, 160, 'butanoic acid');
    s += arrow(P(236, 100), P(316, 100));
    s += tag(276, 88, 'SOCl₂');
    m = butanoyl(340, 110, 'Cl', 'hi');
    s += m.svg + tag(382, 160, 'butanoyl chloride');

    s += arrow(P(356, 176), P(290, 214));
    s += tag(314, 186, 'propan-2-ol, pyridine', { anchor: 'end' });
    s += arrow(P(420, 176), P(486, 214));
    s += tag(462, 186, '2 Et₂NH', { anchor: 'start' });

    // (a) isopropyl butanoate
    m = butanoyl(110, 280, 'O');
    const ch = P(m.X.x + 28, m.X.y - 16);
    s += m.svg + bond(m.X, ch, { rFrom: m.X.r, rTo: 0 }) + sk(ch, P(ch.x + 28, ch.y + 16)) + sk(ch, P(ch.x, ch.y - 32));
    s += tag(186, 340, '(a) isopropyl butanoate');

    // (b) N,N-diethylbutanamide
    m = butanoyl(440, 280, 'N');
    const e1 = P(m.X.x + 28, m.X.y - 16), e2 = P(m.X.x, m.X.y + 32);
    s += m.svg + bond(m.X, e1, { rFrom: m.X.r, rTo: 0 }) + sk(e1, P(e1.x + 28, e1.y + 16));
    s += bond(m.X, e2, { rFrom: m.X.r, rTo: 0 }) + sk(e2, P(e2.x + 28, e2.y + 16));
    s += tag(628, 302, '+ Et₂NH₂⁺ Cl⁻', { anchor: 'start' });
    s += text(500, 350, '(b) N,N-diethylbutanamide', { cls: 'fg-tag', anchor: 'middle' });
    return s;
  },
  caption: 'One acid chloride, two products. The chlorine is the atom that changes; the four-carbon butanoyl group rides through untouched.',
});

/* ============================== an anhydride meets an alcohol: which C=O === */
function anhydrideBlock(X, Y) {
  const C1 = A(X + 120, Y + 100, 'C', 'hi'), O1 = A(X + 120, Y + 54, 'O'), Me1 = A(X + 80, Y + 124, 'CH₃'),
        Ob = A(X + 160, Y + 124, 'O', 'warn'), C2 = A(X + 200, Y + 100), O2 = A(X + 200, Y + 54, 'O'),
        Me2 = A(X + 240, Y + 124, 'CH₃');
  const Om = A(X + 62, Y + 62, 'O', 'hi'), Mm = A(X + 18, Y + 62, 'CH₃'), Hm = A(X + 62, Y + 18, 'H');
  let s = bd(C1, O1, { order: 2 }) + bd(C1, Me1) + bd(C1, Ob) + bd(Ob, C2) + bd(C2, O2, { order: 2 }) + bd(C2, Me2);
  s += bd(Om, Mm) + bd(Om, Hm);
  s += lp(Om, 25, 4) + lp(Om, 125, 4);
  s += draw(C1, O1, Me1, Ob, C2, O2, Me2, Om, Mm, Hm);
  s += curve(lpAt(Om, 25, 4), off(C1, -14, -9), { bow: 6 });
  s += curve(mid(C1, O1), off(O1, 18, 2), { bow: -10 });
  s += tag(X + 160, Y + 156, 'the shared O', { cls: 'fg-tag-warn' });
  s += tag(X + 30, Y + 96, 'methanol');
  s += tag(X + 160, Y + 176, 'acetic anhydride');
  return s;
}
function esterBlock(X, Y) {
  const Me = A(X + 26, Y + 124, 'CH₃'), C = A(X + 66, Y + 100, 'C', 'hi'), O = A(X + 66, Y + 54, 'O'),
        Oe = A(X + 106, Y + 124, 'O', 'hi'), Me2 = A(X + 146, Y + 100, 'CH₃');
  const Ma = A(X + 206, Y + 124, 'CH₃'), Ca = A(X + 246, Y + 100), Oa = A(X + 246, Y + 54, 'O'),
        Oh = A(X + 286, Y + 124, 'OH', 'warn');
  let s = bd(C, O, { order: 2 }) + bd(C, Me) + bd(C, Oe) + bd(Oe, Me2);
  s += bd(Ca, Oa, { order: 2 }) + bd(Ca, Ma) + bd(Ca, Oh);
  s += draw(Me, C, O, Oe, Me2, Ma, Ca, Oa, Oh);
  s += plusSign(X + 176, Y + 110);
  s += tag(X + 86, Y + 164, 'methyl acetate');
  s += tag(X + 250, Y + 164, 'acetic acid');
  return s;
}

FIGURES.push({
  id: 'anhydride-attack',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<!-- anchor:anhydride-attack -->',
  viewBox: '0 0 760 200',
  alt: 'Acetic anhydride, two acetyl groups joined through one oxygen. The oxygen of methanol adds to one carbonyl carbon and its pi electrons move onto oxygen; then acetate leaves and takes up the proton. The products are methyl acetate and acetic acid.',
  build() {
    let s = anhydrideBlock(4, 0);
    s += arrow(P(282, 100), P(366, 100));
    s += tag(324, 86, 'acetate leaves,');
    s += tag(324, 124, 'takes the H⁺');
    s += esterBlock(392, 0);
    return s;
  },
  caption: 'Methanol and acetic anhydride. Both carbonyls are the same, so the attack can land on either; only the attacked acetyl group ends up on the methanol oxygen.',
});

FIGURES.push({
  id: 'l-anhydride-attack',
  lessons: ['acyl-chlorides-anhydrides'],
  viewBox: '0 0 320 400',
  alt: 'Methanol adds to one carbonyl of acetic anhydride; acetate leaves. The products are methyl acetate and acetic acid.',
  build() {
    let s = anhydrideBlock(24, 0);
    s += arrow(P(160, 190), P(160, 230));
    s += tag(172, 214, 'acetate leaves', { anchor: 'start' });
    s += esterBlock(6, 214);
    return s;
  },
  caption: 'Only the attacked acetyl group ends up on the methanol oxygen.',
});

/* ============================================== aspirin: the phenol OH === */
FIGURES.push({
  id: 'aspirin-acetylates-the-phenol',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<!-- anchor:aspirin -->',
  viewBox: '0 0 760 290',
  alt: 'Salicylic acid reacting with acetic anhydride, with the phenol OH highlighted as the group that is acetylated, giving aspirin plus acetic acid. The carboxylic acid group is unchanged.',
  build() {
    let s = '';
    const hex = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return pts;
    };
    const drawRing = (pts, ctr) => {
      let t = '';
      for (let i = 0; i < 6; i++) {
        const a = pts[i], b = pts[(i + 1) % 6];
        t += (i % 2 === 0) ? ringDouble(a, b, ctr) : bond(a, b, { rFrom: 0, rTo: 0 });
      }
      return t;
    };

    // salicylic acid
    let ctr = P(150, 160);
    let p = hex(150, 160, 48);
    s += drawRing(p, ctr);
    s += bond(p[1], P(240, 108), { rFrom: 0 });
    s += bond(P(240, 108), P(240, 62), { order: 2 });
    s += bond(P(240, 108), P(284, 130), { rTo: 16 });
    s += atom(240, 62, 'O'); s += atom(284, 130, 'OH');
    s += atom(240, 108, 'C');
    s += bond(p[2], P(240, 212), { rFrom: 0, rTo: 16 });
    s += atom(240, 212, 'OH', { kind: 'warn' });
    s += tag(250, 252, 'the phenol OH', { cls: 'fg-tag-warn' });
    s += tag(130, 44, 'salicylic acid');

    s += arrow(P(390, 170), P(450, 170));
    s += text(420, 156, '(CH₃CO)₂O', { cls: 'fg-lbl' });

    // aspirin
    ctr = P(530, 160);
    p = hex(530, 160, 48);
    s += drawRing(p, ctr);
    s += bond(p[1], P(620, 108), { rFrom: 0 });
    s += bond(P(620, 108), P(620, 62), { order: 2 });
    s += bond(P(620, 108), P(664, 130), { rTo: 16 });
    s += atom(620, 62, 'O'); s += atom(664, 130, 'OH');
    s += atom(620, 108, 'C');
    s += bond(p[2], P(620, 212), { rFrom: 0 });
    s += bond(P(620, 212), P(664, 236));
    s += bond(P(664, 236), P(664, 282 - 8), { order: 2, rTo: 13 });
    s += bond(P(664, 236), P(708, 212));
    s += atom(620, 212, 'O', { kind: 'warn' });
    s += atom(664, 274, 'O'); s += atom(708, 212, 'CH₃');
    s += atom(664, 236, 'C', { kind: 'hi' });
    s += tag(530, 44, 'aspirin (+ acetic acid)');
    s += tag(640, 282, 'new ester', { cls: 'fg-tag-good', anchor: 'end' });
    return s;
  },
  caption: 'Salicylic acid and acetic anhydride. Compare the two OH groups before and after: only the phenol OH has changed.',
});

/* ========================== succinic acid → anhydride → amic acid → imide === */
const five = (cx, cy, r) => Array.from({ length: 5 }, (_, i) => {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  return P(cx + r * Math.cos(a), cy + r * Math.sin(a));
});
const outward = (c, v, d) => {
  const L = Math.hypot(v.x - c.x, v.y - c.y);
  return P(v.x + ((v.x - c.x) / L) * d, v.y + ((v.y - c.y) / L) * d);
};
const carbonylO = (c, v, d = 34) => {
  const o = outward(c, v, d);
  return bond(v, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
};
/* A closed ring: heteroatom at the top, carbonyls either side of it. */
function succRing(cx, cy, het, hetR, R = 40, d = 34) {
  const c = P(cx, cy), v = five(cx, cy, R);
  let g = '';
  g += bond(v[0], v[1], { rFrom: hetR, rTo: 0 });
  for (let i = 1; i < 4; i++) g += bond(v[i], v[i + 1], { rFrom: 0, rTo: 0 });
  g += bond(v[4], v[0], { rFrom: 0, rTo: hetR });
  g += carbonylO(c, v[1], d) + carbonylO(c, v[4], d);
  g += atom(v[0].x, v[0].y, het, { kind: 'hi', r: hetR });
  return g;
}
/* An open chain, C(=O)X–CH2–CH2–C(=O)Y, with X and Y turned inward. */
function succChain(cx, cy, left, right, R = 46, d = 34) {
  const c = P(cx, cy), v = five(cx, cy, R);
  let g = '';
  for (let i = 1; i < 4; i++) g += bond(v[i], v[i + 1], { rFrom: 0, rTo: 0 });
  g += carbonylO(c, v[1], d) + carbonylO(c, v[4], d);
  const a = (-62 * Math.PI) / 180;
  const xl = P(v[4].x + Math.cos(a) * 36, v[4].y + Math.sin(a) * 36);
  const xr = P(v[1].x - Math.cos(a) * 36, v[1].y + Math.sin(a) * 36);
  g += bond(v[4], xl, { rFrom: 0, rTo: left.r });
  g += bond(v[1], xr, { rFrom: 0, rTo: right.r });
  g += atom(xl.x, xl.y, left.l, { r: left.r, kind: left.kind });
  g += atom(xr.x, xr.y, right.l, { r: right.r, kind: right.kind });
  return g;
}

FIGURES.push({
  id: 'succinic-anhydride-imide',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<!-- anchor:succinic -->',
  viewBox: '0 0 760 420',
  alt: 'Succinic acid drawn with its two carboxyl groups turned toward each other; heating removes water and closes a five-membered ring, succinic anhydride, with one oxygen between two carbonyls. Ammonia opens the ring at one carbonyl to give an open chain with an amide at one end and a carboxylic acid at the other. Heating again removes water and closes the five-membered ring on nitrogen, giving succinimide, with an N-H between two carbonyls.',
  build() {
    let s = '';
    const Y1 = 128;
    s += tag(100, 36, 'SUCCINIC ACID');
    s += succChain(100, Y1, { l: 'OH', r: 15 }, { l: 'OH', r: 15 });
    s += text(100, 198, 'a four-carbon diacid', { cls: 'fg-sm' });

    s += arrow(P(200, Y1), P(256, Y1));
    s += text(228, Y1 - 12, 'heat', { cls: 'fg-tag' });
    s += text(228, Y1 + 22, '− H₂O', { cls: 'fg-sm' });

    s += tag(346, 36, 'SUCCINIC ANHYDRIDE');
    s += succRing(346, Y1 + 4, 'O', 15);
    s += text(346, 198, 'O between two C=O, in a ring', { cls: 'fg-sm' });

    s += arrow(P(438, Y1), P(502, Y1));
    s += text(470, Y1 - 12, 'NH₃', { cls: 'fg-tag' });
    s += text(470, Y1 + 22, 'opens one C=O', { cls: 'fg-sm' });

    s += tag(600, 36, 'THE AMIC ACID');
    s += succChain(600, Y1, { l: 'H₂N', r: 17, kind: 'hi' }, { l: 'OH', r: 15 });
    s += text(600, 198, 'an amide and an acid, still tethered', { cls: 'fg-sm' });

    s += arrow(P(600, 210), P(600, 258));
    s += text(614, 236, 'heat', { cls: 'fg-tag', anchor: 'start' });
    s += text(614, 252, '− H₂O', { cls: 'fg-sm', anchor: 'start' });

    s += succRing(600, 318, 'NH', 17);
    s += tag(600, 386, 'SUCCINIMIDE');
    s += text(600, 404, 'N–H between two C=O, in a ring', { cls: 'fg-sm' });

    s += panel(40, 262, 440, 76);
    s += text(60, 292, 'Anhydride and imide are the same five-membered ring.', { cls: 'fg-lbl', anchor: 'start' });
    s += text(60, 316, 'Only the atom between the two carbonyls changes: O, then N.', { cls: 'fg-sm', anchor: 'start' });
    return s;
  },
  caption: 'Succinic acid to succinimide, in four structures. Unlabeled corners are CH₂ groups or carbonyl carbons.',
  note: 'Draw the open chains curled, as here, and the ring closure stops being a surprise: the two ends of a four-carbon chain already sit within reach of each other. A primary amine R–NH₂ in place of ammonia runs the same sequence and gives the N-substituted imide, with R where the H is drawn.',
});

FIGURES.push({
  id: 'l-succinic-anhydride-imide',
  lessons: ['acyl-chlorides-anhydrides'],
  viewBox: '0 0 320 700',
  alt: 'Succinic acid loses water on heating to close succinic anhydride. Ammonia opens the ring at one carbonyl to give the amic acid. Heating again loses water and closes succinimide.',
  build() {
    let s = '';
    const X = 110;
    const step = (y1, y2, a, b) => arrow(P(X, y1), P(X, y2)) + tag(X + 90, (y1 + y2) / 2 - 2, a) + tag(X + 90, (y1 + y2) / 2 + 14, b);
    s += tag(X, 24, 'SUCCINIC ACID');
    s += succChain(X, 106, { l: 'OH', r: 15 }, { l: 'OH', r: 15 });
    s += step(158, 196, 'heat,', '− H₂O');
    s += tag(X, 214, 'SUCCINIC ANHYDRIDE');
    s += succRing(X, 280, 'O', 15);
    s += step(330, 368, 'NH₃ opens', 'one C=O');
    s += tag(X, 386, 'THE AMIC ACID');
    s += succChain(X, 468, { l: 'H₂N', r: 17, kind: 'hi' }, { l: 'OH', r: 15 });
    s += step(520, 558, 'heat,', '− H₂O');
    s += succRing(X, 618, 'NH', 17);
    s += tag(X, 686, 'SUCCINIMIDE');
    return s;
  },
  caption: 'The anhydride and the imide share one ring; only the atom between the carbonyls changes.',
});

/* =========================================== preview: the acylium ion === */
FIGURES.push({
  id: 'acylium-preview',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<!-- anchor:acylium -->',
  viewBox: '0 0 760 180',
  alt: 'Acetyl chloride and aluminum chloride. A chlorine lone pair bonds to aluminum and the C–Cl bond breaks, giving the linear acylium ion CH3–C≡O+ and AlCl4−.',
  build() {
    let s = '';
    const C = A(130, 96), O = A(130, 50, 'O'), Me = A(88, 120, 'CH₃'), Cl = A(180, 128, 'Cl', 'hi'),
          Al = A(262, 120, 'AlCl₃', 'warn');
    s += bd(C, O, { order: 2 }) + bd(C, Me) + bd(C, Cl);
    s += lp(Cl, 0, 4);
    s += draw(C, O, Me, Cl, Al);
    s += curve(lpAt(Cl, 0, 4), off(Al, -26, -4), { bow: -10 });
    s += curve(mid(C, Cl), off(Cl, -10, 18), { bow: 10 });
    s += arrow(P(318, 110), P(388, 110));
    const M2 = A(436, 110, 'CH₃'), C2 = A(486, 110), O2 = A(536, 110, 'O⁺', 'hi');
    s += bd(M2, C2) + bd(C2, O2, { order: 3 });
    s += lp(O2, 0, 4);
    s += draw(M2, C2, O2);
    s += plusSign(588, 116);
    s += text(650, 116, 'AlCl₄⁻', { cls: 'fg-lbl' });
    s += tag(486, 156, 'acylium ion: C≡O⁺, linear');
    return s;
  },
  caption: 'A preview only. Aluminum chloride pulls the chloride away, and the acylium ion that is left is the electrophile a benzene ring attacks.',
});

export default FIGURES;
