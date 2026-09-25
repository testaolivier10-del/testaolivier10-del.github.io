/* Figures for the imines-enamines notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   The mechanism is drawn with one concrete pair throughout: acetone with
   methylamine (a primary amine) and acetone with dimethylamine (a secondary
   one), every atom labelled, so each curved arrow lands on a named atom or
   bond. The Stork and Michael drawings switch to cyclohexanone and its
   pyrrolidine enamine, drawn skeletally, because that is the enamine the
   prose uses there.

   Each panel is a function of its top-left corner, so the notes figures can
   lay the panels out in rows and the lesson copies (id prefix l-) can stack
   the same panels in one narrow column. Panels are 232 wide and every label
   in them is fg-lbl or fg-tag, so they are legal in a lesson as they are. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];
const PW = 232;                       // panel width

/* ------------------------------------------------------------ helpers --- */
const rad = (l) => (l === 'H' ? 12 : l.length <= 2 ? 14 : 4 + l.length * 3.8);
/* A labelled atom: {x, y, l, k, r}. */
const A = (x, y, l, k) => ({ x, y, l, k, r: rad(l) });
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.l, { kind: a.k, r: a.r })).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const lp = (a, deg, extra = 7) => lonePair(a.x, a.y, deg, { dist: a.r + extra });
const lpAt = (a, deg, extra = 7) => {
  const r = ((deg * Math.PI) / 180), d = a.r + extra;
  return P(a.x + Math.cos(r) * d, a.y + Math.sin(r) * d);
};
/* Offset a point by (dx, dy). */
const off = (p, dx, dy) => P(p.x + dx, p.y + dy);
/* Every panel: a box, a title tag at the top and up to two tag lines at
   the bottom. */
function frameP(ox, oy, h, title, lines = [], kind) {
  let s = panel(ox, oy, PW, h, kind ? { kind } : {});
  s += tag(ox + PW / 2, oy + 20, title);
  lines.forEach((ln, i) => {
    const [t, cls] = Array.isArray(ln) ? ln : [ln, 'fg-tag'];
    s += text(ox + PW / 2, oy + h - 14 - (lines.length - 1 - i) * 17, t, { cls, size: 11 });
  });
  return s;
}
/* A short arrow between two panels in a row or a column. */
const gapArrow = (a, b) => arrow(a, b, { size: 7 });

/* ----------------------------------------------- the addition (1 - 3) --- */
const H1 = 214;

/* 1: acetone and methylamine, N lone pair to C, C=O pi to O. */
function pAdd(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const C = A(ox + 70, oy + 116, 'C', 'hi'), O = A(ox + 70, oy + 60, 'O');
  const M1 = A(ox + 28, oy + 146, 'CH₃'), M2 = A(ox + 106, oy + 150, 'CH₃');
  const N = A(ox + 168, oy + 108, 'N'), Hu = A(ox + 168, oy + 62, 'H'),
        Hd = A(ox + 168, oy + 154, 'H'), Me = A(ox + 208, oy + 108, 'CH₃');
  let s = frameP(ox, oy, H1, '1 · the N lone pair adds to C', ['acetone + methylamine']);
  s += bd(C, O, { order: 2 }) + bd(C, M1) + bd(C, M2);
  s += bd(N, Hu) + bd(N, Hd) + bd(N, Me);
  s += lp(O, -150) + lp(O, -30) + lp(N, 180, 6);
  s += draw(C, O, M1, M2, N, Hu, Hd, Me);
  s += curve(o(143, 104), o(88, 110), { bow: 14 });
  s += curve(o(75, 90), o(88, 70), { bow: -12 });
  return s;
}

/* 2: the zwitterion, and the proton that moves from N+ to O-. */
function pZwit(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const C = A(ox + 96, oy + 118, 'C', 'hi'), O = A(ox + 96, oy + 62, 'O⁻', 'warn');
  const M1 = A(ox + 48, oy + 146, 'CH₃'), M2 = A(ox + 96, oy + 170, 'CH₃');
  const N = A(ox + 156, oy + 132, 'N⁺', 'hi'), H = A(ox + 158, oy + 80, 'H', 'warn'),
        Hd = A(ox + 184, oy + 172, 'H'), Me = A(ox + 204, oy + 118, 'CH₃');
  let s = frameP(ox, oy, H1, '2 · a proton moves from N⁺ to O⁻', ['the tetrahedral intermediate']);
  s += bd(C, O) + bd(C, M1) + bd(C, M2) + bd(C, N);
  s += bd(N, H) + bd(N, Hd) + bd(N, Me);
  s += lp(O, 180) + lp(O, -90) + lp(O, -20, 6);
  s += draw(C, O, M1, M2, N, H, Hd, Me);
  s += curve(o(122, 56), o(146, 76), { bow: -10 });
  s += curve(o(164, 104), o(172, 122), { bow: -9 });
  return s;
}

/* 3: the carbinolamine. */
function pCarb(ox, oy) {
  const C = A(ox + 96, oy + 118, 'C', 'hi'), O = A(ox + 96, oy + 62, 'OH');
  const M1 = A(ox + 48, oy + 146, 'CH₃'), M2 = A(ox + 96, oy + 170, 'CH₃');
  const N = A(ox + 170, oy + 132, 'NHCH₃', 'hi');
  let s = frameP(ox, oy, H1, '3 · the carbinolamine', ['OH and N on the same carbon'], 'good');
  s += bd(C, O) + bd(C, M1) + bd(C, M2) + bd(C, N);
  s += lp(O, 180, 5) + lp(O, -60, 5) + lp(N, -125, 5);
  s += draw(C, O, M1, M2, N);
  return s;
}

/* ----------------------------------------------- losing water (4 - 6) --- */
const H2 = 226;

/* 4: acid protonates the OH. */
function pProt(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const C = A(ox + 118, oy + 130, 'C'), O = A(ox + 118, oy + 76, 'OH', 'hi');
  const M1 = A(ox + 70, oy + 158, 'CH₃'), M2 = A(ox + 118, oy + 182, 'CH₃');
  const N = A(ox + 188, oy + 144, 'NHCH₃');
  const Ha = A(ox + 50, oy + 60, 'H', 'warn'), Oa = A(ox + 36, oy + 130, 'OH₂⁺');
  let s = frameP(ox, oy, H2, '4 · acid protonates the OH', ['H₃O⁺ gives up a proton']);
  s += bd(C, O) + bd(C, M1) + bd(C, M2) + bd(C, N) + bd(Ha, Oa);
  s += lp(O, -150, 5) + lp(O, -60, 5) + lp(N, -90, 5);
  s += draw(C, O, M1, M2, N, Ha, Oa);
  s += curve(o(96, 62), o(66, 56), { bow: 10 });
  s += curve(off(mid(Ha, Oa, 0.5), 4, 0), off(Oa, 16, -14), { bow: -12 });
  return s;
}

/* 5: N lone pair pushes in, water leaves. */
function pLeave(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const C = A(ox + 100, oy + 126, 'C', 'hi'), O = A(ox + 100, oy + 66, 'OH₂⁺', 'warn');
  const M1 = A(ox + 52, oy + 154, 'CH₃'), M2 = A(ox + 100, oy + 178, 'CH₃');
  const N = A(ox + 160, oy + 142, 'N'), Hn = A(ox + 200, oy + 172, 'H'), Me = A(ox + 196, oy + 106, 'CH₃');
  let s = frameP(ox, oy, H2, '5 · N pushes in, water leaves', ['the C–O bond breaks']);
  s += bd(C, O, { cls: 'fg-bond-hi' }) + bd(C, M1) + bd(C, M2) + bd(C, N) + bd(N, Hn) + bd(N, Me);
  s += lp(N, 130, 6) + lp(O, 180, 5);
  s += draw(C, O, M1, M2, N, Hn, Me);
  s += curve(off(lpAt(N, 130, 6), -4, 4), mid(C, N, 0.5), { bow: -16 });
  s += curve(o(106, 104), o(126, 84), { bow: -10 });
  return s;
}

/* 6: the iminium ion, plus water. */
function pImin(ox, oy) {
  const C = A(ox + 84, oy + 108, 'C'), N = A(ox + 148, oy + 108, 'N⁺', 'hi');
  const M1 = A(ox + 44, oy + 78, 'CH₃'), M2 = A(ox + 44, oy + 138, 'CH₃');
  const Hn = A(ox + 184, oy + 80, 'H'), Me = A(ox + 190, oy + 138, 'CH₃');
  let s = frameP(ox, oy, H2, '6 · the iminium ion, C=N⁺', ['every amine with an N–H gets here'], 'good');
  s += bd(C, N, { order: 2 }) + bd(C, M1) + bd(C, M2) + bd(N, Hn) + bd(N, Me);
  s += draw(C, N, M1, M2, Hn, Me);
  s += text(ox + PW / 2, oy + 172, '+  H₂O', { cls: 'fg-lbl' });
  return s;
}

/* ------------------------------------------ the last proton (7 - 9) --- */
const H3 = 350;

/* 7: primary amine: water takes the N-H proton, giving the imine. */
function pImine(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const C = A(ox + 70, oy + 112, 'C'), N = A(ox + 134, oy + 112, 'N⁺');
  const M1 = A(ox + 32, oy + 82, 'CH₃'), M2 = A(ox + 32, oy + 142, 'CH₃');
  const H = A(ox + 134, oy + 60, 'H', 'warn'), Me = A(ox + 180, oy + 140, 'CH₃');
  const W = A(ox + 200, oy + 60, 'H₂O');
  let s = frameP(ox, oy, H3, 'primary amine: an N–H is left', [['the imine, C=N–CH₃', 'fg-tag-good'], 'nitrogen gives up its last H']);
  s += bd(C, N, { order: 2 }) + bd(C, M1) + bd(C, M2) + bd(N, H, { cls: 'fg-bond-hi' }) + bd(N, Me);
  s += lp(W, 180, 5);
  s += draw(C, N, M1, M2, H, Me, W);
  s += curve(off(lpAt(W, 180, 5), -2, -6), off(H, 14, -4), { bow: 8 });
  s += curve(mid(H, N, 0.5), off(N, -14, -6), { bow: 12 });
  s += gapArrow(o(PW / 2, 170), o(PW / 2, 200));
  const C2 = A(ox + 70, oy + 246, 'C'), N2 = A(ox + 134, oy + 246, 'N', 'hi');
  const P1 = A(ox + 32, oy + 216, 'CH₃'), P2 = A(ox + 32, oy + 276, 'CH₃'), Me2 = A(ox + 180, oy + 274, 'CH₃');
  s += bd(C2, N2, { order: 2 }) + bd(C2, P1) + bd(C2, P2) + bd(N2, Me2);
  s += lp(N2, -60, 6);
  s += draw(C2, N2, P1, P2, Me2);
  return s;
}

/* 8: secondary amine: no N-H, so water takes a proton from the alpha
   carbon and the double bond moves to C=C. */
function pEnam(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const Ca = A(ox + 56, oy + 118, 'CH₂', 'hi'), C = A(ox + 116, oy + 118, 'C'), N = A(ox + 172, oy + 118, 'N⁺');
  const H = A(ox + 30, oy + 78, 'H', 'warn'), W = A(ox + 82, oy + 52, 'H₂O');
  const M = A(ox + 116, oy + 70, 'CH₃');
  const N1 = A(ox + 206, oy + 86, 'CH₃'), N2 = A(ox + 206, oy + 150, 'CH₃');
  let s = frameP(ox, oy, H3, 'secondary amine: no N–H left', [['the enamine, C=C–N', 'fg-tag-good'], 'the α carbon gives up an H']);
  s += bd(C, N, { order: 2 }) + bd(C, Ca) + bd(C, M) + bd(Ca, H, { cls: 'fg-bond-hi' }) + bd(N, N1) + bd(N, N2);
  s += lp(W, 180, 5);
  s += draw(C, N, Ca, H, M, N1, N2, W);
  s += curve(off(lpAt(W, 180, 5), -4, 2), off(H, 8, -12), { bow: 10 });
  s += curve(mid(H, Ca, 0.5), mid(Ca, C, 0.5), { bow: -18 });
  s += curve(mid(C, N, 0.5), off(N, 2, 16), { bow: -12 });
  s += tag(Ca.x, oy + 156, 'α carbon');
  s += gapArrow(o(PW / 2, 178), o(PW / 2, 204));
  const Ca2 = A(ox + 56, oy + 246, 'CH₂', 'hi'), C2 = A(ox + 116, oy + 246, 'C'), Nn = A(ox + 172, oy + 246, 'N');
  const M2 = A(ox + 116, oy + 290, 'CH₃'), Q1 = A(ox + 206, oy + 216, 'CH₃'), Q2 = A(ox + 206, oy + 278, 'CH₃');
  s += bd(Ca2, C2, { order: 2 }) + bd(C2, Nn) + bd(C2, M2) + bd(Nn, Q1) + bd(Nn, Q2);
  s += lp(Nn, 110, 6);
  s += draw(Ca2, C2, Nn, M2, Q1, Q2);
  return s;
}

/* 9: tertiary amine: it can add, but there is nowhere to go. */
function pTert(ox, oy) {
  const C = A(ox + 90, oy + 110, 'C'), O = A(ox + 90, oy + 56, 'O⁻', 'warn');
  const M1 = A(ox + 44, oy + 138, 'CH₃'), M2 = A(ox + 90, oy + 162, 'CH₃');
  const N = A(ox + 150, oy + 124, 'N⁺', 'warn');
  const Q1 = A(ox + 150, oy + 76, 'CH₃'), Q2 = A(ox + 196, oy + 102, 'CH₃'), Q3 = A(ox + 186, oy + 166, 'CH₃');
  let s = frameP(ox, oy, H3, 'tertiary amine: no N–H at all', [
    'no N–H, no way on:',
    ['the adduct reverses', 'fg-tag-warn']], 'warn');
  s += bd(C, O) + bd(C, M1) + bd(C, M2) + bd(C, N) + bd(N, Q1) + bd(N, Q2) + bd(N, Q3);
  s += lp(O, 180) + lp(O, -90) + lp(O, 0);
  s += draw(C, O, M1, M2, N, Q1, Q2, Q3);
  s += tag(ox + PW / 2, oy + 214, 'trimethylamine adds to acetone');
  return s;
}

/* ------------------------------------------------------ pH window --- */
function phPlot(ox, oy) {
  let s = '';
  const x0 = ox + 40, x1 = ox + 320, yB = oy + 190, yT = oy + 40;
  const X = (ph) => x0 + (ph / 8) * (x1 - x0);
  s += `<line class="fg-arrow" x1="${x0}" y1="${yB}" x2="${x0}" y2="${yT + 8}"></line>`;
  s += `<path class="fg-head" d="M${x0} ${yT} L${x0 + 4} ${yT + 8} L${x0 - 4} ${yT + 8} Z"></path>`;
  s += `<line class="fg-arrow" x1="${x0}" y1="${yB}" x2="${x1 - 8}" y2="${yB}"></line>`;
  s += `<path class="fg-head" d="M${x1} ${yB} L${x1 - 8} ${yB - 4} L${x1 - 8} ${yB + 4} Z"></path>`;
  for (let ph = 0; ph <= 7; ph++) {
    s += `<line class="fg-bond-soft" x1="${X(ph)}" y1="${yB}" x2="${X(ph)}" y2="${yB + 5}"></line>`;
    s += text(X(ph), yB + 20, String(ph), { cls: 'fg-tag' });
  }
  s += text(x1 - 4, yB + 20, 'pH', { cls: 'fg-lbl', anchor: 'end' });
  s += text(x0 - 8, yT + 4, 'rate', { cls: 'fg-tag', anchor: 'end' });
  s += `<rect class="fg-fill-good" x="${X(4)}" y="${yT}" width="${X(5) - X(4)}" height="${yB - yT}" opacity="0.18"></rect>`;
  let d = '';
  for (let i = 0; i <= 70; i++) {
    const ph = 0.3 + (i / 70) * 7.4;
    const g = Math.exp(-((ph - 4.5) ** 2) / (2 * 1.25 ** 2));
    const y = yB - 8 - g * (yB - yT - 30);
    d += (i ? ' L' : 'M') + X(ph).toFixed(1) + ' ' + y.toFixed(1);
  }
  s += `<path class="fg-arrow" d="${d}" fill="none"></path>`;
  s += text(X(4.5), yT - 8, 'fastest near pH 4–5', { cls: 'fg-tag-good' });
  return s;
}
function phNotes(ox, oy) {
  let s = '';
  const blk = (x, y, lines, cls) => lines.forEach((t, i) => { s += text(x, y + i * 17, t, { cls: i ? 'fg-tag' : cls }); });
  blk(ox + 88, oy, ['too acidic', 'CH₃NH₃⁺: no lone pair,', 'so the addition stalls'], 'fg-tag-warn');
  blk(ox + 252, oy, ['too basic', 'OH rarely protonated,', 'so water leaves slowly'], 'fg-tag-warn');
  return s;
}

/* ----------------------------------- enamine and enolate resonance --- */
const RW = 340, RH = 292;
function resPanel(ox, oy, kind) {
  const o = (x, y) => P(ox + x, oy + y);
  const enam = kind === 'enamine';
  let s = panel(ox, oy, RW, RH, { kind: enam ? 'hi' : undefined });
  s += tag(ox + RW / 2, oy + 20, enam ? 'an enamine: neutral' : 'an enolate: an anion (preview)');
  const y1 = oy + 96, y2 = oy + 218;
  /* form 1: CH2=C(CH3)-X */
  const Ca = A(ox + 76, y1, 'CH₂'), C = A(ox + 146, y1, 'C');
  const M = A(ox + 146, y1 - 44, 'CH₃');
  let X, extra1 = '';
  if (enam) {
    X = A(ox + 216, y1, 'N', 'hi');
    const q1 = A(ox + 256, y1 - 28, 'CH₃'), q2 = A(ox + 262, y1 + 26, 'CH₃');
    extra1 = bd(X, q1) + bd(X, q2) + draw(q1, q2) + lp(X, 110, 6);
  } else {
    X = A(ox + 216, y1, 'O⁻', 'warn');
    extra1 = lp(X, -60, 5) + lp(X, 60, 5) + lp(X, 0, 5);
  }
  s += bd(Ca, C, { order: 2 }) + bd(C, X) + bd(C, M) + extra1 + draw(Ca, C, M, X);
  const lpP = enam ? lpAt(X, 110, 6) : lpAt(X, 60, 5);
  s += curve(off(lpP, -3, 4), mid(C, X, 0.55), { bow: -12 });
  s += curve(o(111, y1 - oy - 6), off(Ca, 12, -18), { bow: 12 });
  /* resonance arrow */
  s += arrow(o(RW / 2, y1 - oy + 40), o(RW / 2, y1 - oy + 74), { size: 7 });
  s += arrow(o(RW / 2, y1 - oy + 74), o(RW / 2, y1 - oy + 40), { size: 7 });
  /* form 2: -CH2-C(CH3)=X+ */
  const Cb = A(ox + 76, y2, 'CH₂⁻', 'hi'), C2 = A(ox + 146, y2, 'C');
  const M2 = A(ox + 146, y2 - 44, 'CH₃');
  let X2, extra2 = '';
  if (enam) {
    X2 = A(ox + 216, y2, 'N⁺');
    const q1 = A(ox + 256, y2 - 28, 'CH₃'), q2 = A(ox + 262, y2 + 26, 'CH₃');
    extra2 = bd(X2, q1) + bd(X2, q2) + draw(q1, q2);
  } else {
    X2 = A(ox + 216, y2, 'O');
    extra2 = lp(X2, -40) + lp(X2, 40);
  }
  s += bd(Cb, C2) + bd(C2, X2, { order: 2 }) + bd(C2, M2) + extra2 + lp(Cb, 180, 5) + draw(Cb, C2, M2, X2);
  s += text(ox + 76, y2 + 42, 'nucleophilic carbon', { cls: 'fg-tag-good' });
  return s;
}

/* ------------------------------------------------ skeletal pieces --- */
/* A cyclohexane ring, vertex 0 at the top. Returns {s, v}. `dbl` is a pair
   of vertex indexes for a ring double bond. */
function hexRing(cx, cy, r, dbl) {
  const v = polyPts(cx, cy, 6, r, 90);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = v[i], b = v[(i + 1) % 6];
    const isD = dbl && ((dbl[0] === i && dbl[1] === (i + 1) % 6) || (dbl[1] === i && dbl[0] === (i + 1) % 6));
    s += isD ? ringDouble(a, b, P(cx, cy), { inset: 6, gap: 4.6 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  return { s, v };
}
/* A pyrrolidine ring whose nitrogen sits at `N` (a labelled atom) and whose
   ring rises above it. */
function pyrrolidine(N, r = 22, charge) {
  const c = P(N.x, N.y - r);
  const v = polyPts(c.x, c.y, 5, r, -90);
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = v[i], b = v[(i + 1) % 5];
    s += bond(a, b, { rFrom: i === 0 ? N.r : 0, rTo: (i + 1) % 5 === 0 ? N.r : 0 });
  }
  return s;
}

/* The pyrrolidine enamine of cyclohexanone, ring centred at (cx, cy):
   C1 at the top of the ring carries N; C1=C2 with C2 the upper-right
   vertex. Returns the atoms the arrows need. */
function enamineSk(cx, cy, opts = {}) {
  const { s: rs, v } = hexRing(cx, cy, 28, opts.iminium ? null : [0, 5]);
  const N = A(v[0].x, v[0].y - 34, opts.iminium ? 'N⁺' : 'N', opts.iminium ? undefined : 'hi');
  let s = rs;
  s += opts.iminium ? bond(v[0], N, { order: 2, rFrom: 0, rTo: N.r }) : bond(v[0], N, { rFrom: 0, rTo: N.r });
  s += pyrrolidine(N);
  s += draw(N);
  if (!opts.iminium) s += lp(N, 180, 6);
  return { s, v, N };
}

/* The Stork alkylation: enamine attacks allyl bromide. */
const HS = 206;
function pStorkAlk(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const { s: es, v, N } = enamineSk(ox + 64, oy + 132);
  const Cb = A(ox + 142, oy + 96, 'CH₂', 'hi'), Br = A(ox + 196, oy + 96, 'Br', 'warn');
  const Cc = A(ox + 142, oy + 150, 'CH'), Cd = A(ox + 196, oy + 170, 'CH₂');
  let s = frameP(ox, oy, HS, 'alkylate: C2 attacks allyl bromide', []);
  s += es;
  s += bd(Cb, Br, { cls: 'fg-bond-hi' }) + bd(Cb, Cc) + bd(Cc, Cd, { order: 2 });
  s += draw(Cb, Br, Cc, Cd);
  s += text(v[5].x + 16, v[5].y + 14, 'C2', { cls: 'fg-tag' });
  const lpP = lpAt(N, 180, 6);
  s += curve(off(lpP, 0, 6), mid(v[0], N, 0.45), { bow: 10 });
  s += curve(mid(v[0], v[5], 0.55), off(Cb, -18, 2), { bow: 16 });
  s += curve(mid(Cb, Br, 0.5), off(Br, -4, -16), { bow: 12 });
  return s;
}

/* The iminium salt after one alkylation. */
function pStorkImin(ox, oy) {
  const { s: es, v } = enamineSk(ox + 76, oy + 132, { iminium: true });
  let s = frameP(ox, oy, HS, 'iminium salt: enamine C=C gone', ['nothing nucleophilic at carbon'], 'good');
  s += es;
  const a1 = P(v[5].x + 26, v[5].y - 12), a2 = P(a1.x + 26, a1.y + 14), a3 = P(a2.x + 26, a2.y - 12);
  s += bond(v[5], a1, { rFrom: 0, rTo: 0 }) + bond(a1, a2, { rFrom: 0, rTo: 0 }) + bond(a2, a3, { order: 2, rFrom: 0, rTo: 0 });
  s += text(ox + 190, oy + 150, 'Br⁻', { cls: 'fg-lbl' });
  return s;
}

/* Hydrolysis back to the ketone. */
function pStorkProd(ox, oy) {
  const { s: rs, v } = hexRing(ox + 76, oy + 132, 28);
  const O = A(v[0].x, v[0].y - 34, 'O');
  let s = frameP(ox, oy, HS, 'H₃O⁺ hydrolyzes the C=N⁺', [['2-allylcyclohexanone', 'fg-tag-good']], 'good');
  s += rs + bond(v[0], O, { order: 2, rFrom: 0, rTo: O.r }) + lp(O, -150, 5) + lp(O, -30, 5) + draw(O);
  const a1 = P(v[5].x + 26, v[5].y - 12), a2 = P(a1.x + 26, a1.y + 14), a3 = P(a2.x + 26, a2.y - 12);
  s += bond(v[5], a1, { rFrom: 0, rTo: 0 }) + bond(a1, a2, { rFrom: 0, rTo: 0 }) + bond(a2, a3, { order: 2, rFrom: 0, rTo: 0 });
  s += text(ox + 176, oy + 164, '+ pyrrolidine', { cls: 'fg-tag' });
  return s;
}


/* ------------------------------------------------ conjugate addition --- */
/* But-3-en-2-one with its four positions numbered and the two places a
   nucleophile can land. */
function pSites(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const W = 340, H = 250;
  let s = panel(ox, oy, W, H);
  s += tag(ox + W / 2, oy + 20, 'two electrophilic carbons');
  const O = A(ox + 150, oy + 70, 'O', 'hi'), C2 = A(ox + 150, oy + 124, 'C', 'hi'), Me = A(ox + 100, oy + 150, 'CH₃');
  const C3 = A(ox + 200, oy + 150, 'CH'), C4 = A(ox + 250, oy + 124, 'CH₂', 'hi');
  s += bd(C2, O, { order: 2 }) + bd(C2, Me) + bd(C2, C3) + bd(C3, C4, { order: 2 });
  s += lp(O, -150, 5) + lp(O, -30, 5);
  s += draw(O, C2, Me, C3, C4);
  s += text(O.x + 26, O.y + 5, '1', { cls: 'fg-tag-warn' });
  s += text(C2.x - 24, C2.y - 14, '2', { cls: 'fg-tag-warn' });
  s += text(C3.x, C3.y + 32, '3', { cls: 'fg-tag-warn' });
  s += text(C4.x + 10, C4.y - 26, '4', { cls: 'fg-tag-warn' });
  const Nu1 = A(ox + 40, oy + 96, 'Nu⁻'), Nu2 = A(ox + 290, oy + 176, 'Nu⁻');
  s += draw(Nu1, Nu2);
  s += curve(o(62, 100), o(132, 118), { bow: -14 });
  s += curve(o(282, 158), o(262, 142), { bow: 10 });
  s += text(ox + 84, oy + 218, '1,2: at the C=O carbon', { cls: 'fg-tag' });
  s += text(ox + 256, oy + 218, '1,4: at the far end', { cls: 'fg-tag-good' });
  s += text(ox + 256, oy + 236, '(electrons then shift to O)', { cls: 'fg-tag' });
  return s;
}

/* The enamine as a Michael donor: four arrows. */
function pMichael(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  const W = 380, H = 250;
  let s = panel(ox, oy, W, H, { kind: 'hi' });
  s += tag(ox + W / 2, oy + 20, 'an enamine adds 1,4');
  const { s: es, v, N } = enamineSk(ox + 70, oy + 170);
  s += es;
  const C4 = A(ox + 160, oy + 128, 'CH₂', 'hi'), C3 = A(ox + 214, oy + 152, 'CH'), C2 = A(ox + 268, oy + 128, 'C');
  const O = A(ox + 268, oy + 74, 'O'), Me = A(ox + 322, oy + 152, 'CH₃');
  s += bd(C4, C3, { order: 2 }) + bd(C3, C2) + bd(C2, O, { order: 2 }) + bd(C2, Me);
  s += lp(O, -150, 5) + lp(O, -30, 5);
  s += draw(C4, C3, C2, O, Me);
  const lpP = lpAt(N, 180, 6);
  s += curve(off(lpP, 0, 6), mid(v[0], N, 0.45), { bow: 10 });
  s += curve(mid(v[0], v[5], 0.55), off(C4, -20, 8), { bow: 14 });
  s += curve(mid(C4, C3, 0.5), mid(C3, C2, 0.5), { bow: -16 });
  s += curve(mid(C2, O, 0.5), off(O, 16, 4), { bow: -12 });
  s += text(ox + 220, oy + 196, 'new C–C bond: ring C2 to carbon 4', { cls: 'fg-tag' });
  s += text(ox + 220, oy + 216, 'carbon 3 picks up a proton, then H₃O⁺'
  , { cls: 'fg-tag' });
  s += text(ox + 220, oy + 236, 'hydrolyzes the iminium', { cls: 'fg-tag' });
  return s;
}

/* The product after hydrolysis: 2-(3-oxobutyl)cyclohexanone. */
function pMichaelProd(ox, oy) {
  const W = 736, H = 130;
  let s = panel(ox, oy, W, H, { kind: 'good' });
  const { s: rs, v } = hexRing(ox + 250, oy + 80, 28);
  const O = A(v[0].x, v[0].y - 32, 'O');
  s += rs + bond(v[0], O, { order: 2, rFrom: 0, rTo: O.r }) + lp(O, -150, 5) + lp(O, -30, 5) + draw(O);
  const a1 = P(v[5].x + 26, v[5].y - 14), a2 = P(a1.x + 28, a1.y + 14), a3 = P(a2.x + 28, a2.y - 14), a4 = P(a3.x + 28, a3.y + 14);
  const O2 = A(a3.x, a3.y - 34, 'O');
  s += bond(v[5], a1, { rFrom: 0, rTo: 0 }) + bond(a1, a2, { rFrom: 0, rTo: 0 }) + bond(a2, a3, { rFrom: 0, rTo: 0 }) + bond(a3, a4, { rFrom: 0, rTo: 0 });
  s += bond(a3, O2, { order: 2, rFrom: 0, rTo: O2.r }) + lp(O2, -150, 5) + lp(O2, -30, 5) + draw(O2);
  s += text(ox + 120, oy + 64, 'after hydrolysis', { cls: 'fg-tag' });
  s += text(ox + 120, oy + 84, 'with H₃O⁺', { cls: 'fg-tag' });
  s += text(ox + 560, oy + 64, '2-(3-oxobutyl)cyclohexanone', { cls: 'fg-tag-good' });
  s += text(ox + 560, oy + 84, 'two C=O groups, 1,5 apart', { cls: 'fg-tag' });
  return s;
}

/* ------------------------------------------------ imine relatives --- */
const HR = 262;
function acetoneC(ox, oy, y, rightLabel, rightKind, opts = {}) {
  /* (CH3)2C=N-X, drawn left to right at height y. */
  const C = A(ox + 70, oy + y, 'C'), N = A(ox + 130, oy + y, opts.nLabel || 'N');
  const M1 = A(ox + 32, oy + y - 28, 'CH₃'), M2 = A(ox + 32, oy + y + 28, 'CH₃');
  const X = A(ox + 186, oy + y + 22, rightLabel, rightKind);
  let s = bd(C, N, { order: opts.single ? 1 : 2 }) + bd(C, M1) + bd(C, M2) + bd(N, X);
  if (opts.cH) { const H = A(ox + 70, oy + y + 42, 'H'); s += bd(C, H) + draw(H); }
  s += draw(C, N, M1, M2, X);
  return s;
}
function pRedAm(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frameP(ox, oy, HR, 'reductive amination', [['an amine: C–N single bond', 'fg-tag-good']]);
  s += acetoneC(ox, oy, 70, 'CH₃');
  s += gapArrow(o(PW / 2, 116), o(PW / 2, 146));
  s += text(ox + PW / 2 + 10, oy + 136, 'NaBH₃CN', { cls: 'fg-tag', anchor: 'start' });
  s += acetoneC(ox, oy, 180, 'CH₃', 'hi', { single: true, nLabel: 'NH', cH: true });
  return s;
}
function pOxHyd(ox, oy) {
  let s = frameP(ox, oy, HR, 'oxime and hydrazone', []);
  s += acetoneC(ox, oy, 70, 'OH', 'hi');
  s += text(ox + PW / 2, oy + 124, 'oxime, from H₂N–OH', { cls: 'fg-tag-good' });
  s += acetoneC(ox, oy, 176, 'NH₂', 'hi');
  s += text(ox + PW / 2, oy + 236, 'hydrazone, from H₂N–NH₂', { cls: 'fg-tag-good' });
  return s;
}
function pWK(ox, oy) {
  const o = (x, y) => P(ox + x, oy + y);
  let s = frameP(ox, oy, HR, 'Wolff–Kishner: C=O to CH₂', [['ethylbenzene', 'fg-tag-good']]);
  /* acetophenone hydrazone: ring left, C=N-NH2 */
  const ring = (cx, cy) => {
    const v = polyPts(cx, cy, 6, 22, 0);
    let r = '';
    for (let i = 0; i < 6; i++) {
      const a = v[i], b = v[(i + 1) % 6];
      r += i % 2 === 0 ? ringDouble(a, b, P(cx, cy), { inset: 5, gap: 4 }) : bond(a, b, { rFrom: 0, rTo: 0 });
    }
    return { r, v };
  };
  const t = ring(ox + 44, oy + 76);
  s += t.r;
  const C = A(ox + 106, oy + 76, 'C'), N = A(ox + 106, oy + 128, 'N', 'hi'), N2 = A(ox + 156, oy + 128, 'NH₂', 'hi'), Me = A(ox + 156, oy + 56, 'CH₃');
  s += bond(t.v[0], C, { rFrom: 0, rTo: C.r }) + bd(C, N, { order: 2 }) + bd(N, N2) + bd(C, Me);
  s += draw(C, N, N2, Me);
  s += gapArrow(o(PW / 2, 156), o(PW / 2, 184));
  s += text(ox + PW / 2 + 10, oy + 168, 'KOH, heat', { cls: 'fg-tag', anchor: 'start' });
  s += text(ox + PW / 2 + 10, oy + 184, '– N₂', { cls: 'fg-tag-warn', anchor: 'start' });
  const t2 = ring(ox + 60, oy + 214);
  s += t2.r;
  const Cb = A(ox + 122, oy + 214, 'CH₂', 'hi'), Mb = A(ox + 176, oy + 214, 'CH₃');
  s += bond(t2.v[0], Cb, { rFrom: 0, rTo: Cb.r }) + bd(Cb, Mb) + draw(Cb, Mb);
  return s;
}

/* ================================================================ figures */

FIGURES.push({
  id: 'carbinolamine-steps',
  section: 'imines-enamines',
  anchor: '<h3>Step 1: the amine adds and a carbinolamine forms</h3>',
  viewBox: '0 0 760 234',
  alt: 'Acetone and methylamine. Panel 1: the nitrogen lone pair attacks the carbonyl carbon while the C=O pi electrons move onto oxygen. Panel 2: the tetrahedral intermediate carries O minus and N plus; a proton moves from nitrogen to oxygen. Panel 3: the neutral carbinolamine, with OH and NHCH3 on the same carbon.',
  build() {
    let s = pAdd(12, 10) + pZwit(264, 10) + pCarb(516, 10);
    s += gapArrow(P(246, 117), P(262, 117)) + gapArrow(P(498, 117), P(514, 117));
    return s;
  },
  caption: 'Follow the two arrows in panel 1, then the proton in panel 2. Nothing has been lost yet: the carbinolamine holds every atom of both starting materials.',
});

FIGURES.push({
  id: 'l-carbinolamine-steps',
  lessons: ['imines-enamines'],
  viewBox: '0 0 256 668',
  alt: 'Acetone and methylamine, stacked. The nitrogen lone pair attacks the carbonyl carbon and the C=O pi electrons move onto oxygen; a proton then moves from N plus to O minus; the result is the carbinolamine, with OH and NHCH3 on one carbon.',
  build() {
    let s = pAdd(12, 6) + pZwit(12, 226) + pCarb(12, 446);
    s += gapArrow(P(128, 220), P(128, 232)) + gapArrow(P(128, 440), P(128, 452));
    return s;
  },
  caption: 'Two arrows add the amine; one proton shift makes the intermediate neutral.',
});

FIGURES.push({
  id: 'iminium-steps',
  section: 'imines-enamines',
  anchor: '<h3>Step 2: acid turns the OH into water, and water leaves</h3>',
  viewBox: '0 0 760 246',
  alt: 'Panel 4: an oxygen lone pair of the carbinolamine OH takes a proton from H3O plus. Panel 5: the nitrogen lone pair pushes in to make a C=N bond as the C–O bond breaks and water leaves. Panel 6: the iminium ion, (CH3)2C=N plus (H)(CH3), and a molecule of water.',
  build() {
    let s = pProt(12, 10) + pLeave(264, 10) + pImin(516, 10);
    s += gapArrow(P(246, 123), P(262, 123)) + gapArrow(P(498, 123), P(514, 123));
    return s;
  },
  caption: 'Panel 4 makes the leaving group; panel 5 is the step acid speeds up. Watch the nitrogen lone pair in panel 5 become the second line of the C=N in panel 6.',
});

FIGURES.push({
  id: 'l-iminium-steps',
  lessons: ['imines-enamines'],
  viewBox: '0 0 256 704',
  alt: 'Stacked panels. An oxygen lone pair of the OH takes a proton from H3O plus; the nitrogen lone pair pushes in as water leaves; the product is the iminium ion (CH3)2C=N plus (H)(CH3) and water.',
  build() {
    let s = pProt(12, 6) + pLeave(12, 238) + pImin(12, 470);
    s += gapArrow(P(128, 232), P(128, 244)) + gapArrow(P(128, 464), P(128, 476));
    return s;
  },
  caption: 'Protonate the OH, then let the nitrogen push water out.',
});

FIGURES.push({
  id: 'last-proton',
  section: 'imines-enamines',
  anchor: '<h3>Step 3: the last proton decides the product</h3>',
  viewBox: '0 0 760 370',
  alt: 'Three panels. Primary amine: water removes the proton on the nitrogen of the iminium ion, and the N–H electrons become a lone pair, giving the imine (CH3)2C=N–CH3. Secondary amine: the iminium ion has no N–H, so water removes a proton from the alpha carbon; the C–H electrons form a C=C bond and the C=N pi electrons move onto nitrogen, giving the enamine CH2=C(CH3)–N(CH3)2. Tertiary amine: trimethylamine adds to acetone, but its N plus has four bonds and no lone pair, so no iminium can form and the adduct falls apart.',
  build() {
    return pImine(12, 10) + pEnam(264, 10) + pTert(516, 10);
  },
  caption: 'Left: the proton comes off nitrogen. Middle: nitrogen has none, so the proton comes off the α carbon and three arrows move the double bond. Right: with no N–H to start with, the route stops at the first adduct.',
});

FIGURES.push({
  id: 'l-last-proton',
  lessons: ['imines-enamines'],
  viewBox: '0 0 256 722',
  alt: 'Two stacked panels. Primary amine: water removes the N–H proton of the iminium ion, giving the imine (CH3)2C=N–CH3. Secondary amine: water removes a proton from the alpha carbon, the C–H electrons form a C=C bond and the C=N pi electrons move onto nitrogen, giving the enamine CH2=C(CH3)–N(CH3)2.',
  build() {
    return pImine(12, 6) + pEnam(12, 366);
  },
  caption: 'Two iminium ions, two different protons: from nitrogen (top) or from the α carbon (bottom).',
});

FIGURES.push({
  id: 'ph-window',
  section: 'imines-enamines',
  lessons: ['imines-enamines'],
  anchor: '<h3>Why the pH has to be about 4.5</h3>',
  viewBox: '0 0 340 304',
  alt: 'A sketch of rate against pH for imine formation: a hump that peaks between pH 4 and 5 and falls off on both sides. On the acidic side the amine is protonated and has no lone pair. On the basic side the OH is not protonated and water cannot leave.',
  build() {
    return phPlot(0, 14) + phNotes(0, 250);
  },
  caption: 'A sketch, not measured data: the shaded band is the window where both steps can run.',
});

FIGURES.push({
  id: 'enamine-vs-enolate',
  section: 'imines-enamines',
  anchor: '<h3>The enamine is a nucleophile at carbon</h3>',
  viewBox: '0 0 760 312',
  alt: 'Left: the enamine CH2=C(CH3)–N(CH3)2. The nitrogen lone pair pushes into the C–N bond and the C=C pi electrons move onto the end CH2, giving a second resonance structure with CH2 minus and C=N plus. Right, for comparison: the enolate CH2=C(CH3)–O minus does the same thing with an oxygen lone pair, giving CH2 minus next to a C=O.',
  build() {
    return resPanel(14, 10, 'enamine') + resPanel(406, 10, 'enolate');
  },
  caption: 'The same two arrows on both sides. On the left a nitrogen lone pair pushes; on the right an oxygen anion does. Either way the end CH₂ ends up with the lone pair.',
});

FIGURES.push({
  id: 'l-enamine-resonance',
  lessons: ['imines-enamines'],
  viewBox: '0 0 340 300',
  alt: 'The enamine CH2=C(CH3)–N(CH3)2. The nitrogen lone pair pushes into the C–N bond and the C=C pi electrons move onto the end CH2, giving a second resonance structure with CH2 minus and C=N plus.',
  build() {
    return resPanel(0, 4, 'enamine');
  },
  caption: 'Two arrows move the electron pair from nitrogen to the end carbon.',
});

FIGURES.push({
  id: 'stork-sequence',
  section: 'imines-enamines',
  anchor: 'Net result, an &alpha;-substituted ketone.</p>',
  viewBox: '0 0 760 226',
  alt: 'The Stork sequence on cyclohexanone. Left: the pyrrolidine enamine of cyclohexanone attacks allyl bromide; the nitrogen lone pair pushes toward the ring, the C=C pi electrons form a bond to the CH2 of allyl bromide, and bromide leaves. Middle: the iminium salt, with the allyl group on C2 and a bromide counter-ion. Right: aqueous acid hydrolyzes the C=N plus, giving 2-allylcyclohexanone and pyrrolidine.',
  build() {
    let s = pStorkAlk(12, 10) + pStorkImin(264, 10) + pStorkProd(516, 10);
    s += gapArrow(P(246, 113), P(262, 113)) + gapArrow(P(498, 113), P(514, 113));
    return s;
  },
  caption: 'Three arrows make the new C–C bond at C2; acid then releases the ketone.',
});

FIGURES.push({
  id: 'l-stork-sequence',
  lessons: ['imines-enamines'],
  viewBox: '0 0 256 656',
  alt: 'Stacked panels: the pyrrolidine enamine of cyclohexanone attacks allyl bromide at C2; the iminium bromide salt that results; hydrolysis with aqueous acid to 2-allylcyclohexanone and pyrrolidine.',
  build() {
    let s = pStorkAlk(12, 6) + pStorkImin(12, 224) + pStorkProd(12, 442);
    s += gapArrow(P(128, 214), P(128, 228)) + gapArrow(P(128, 432), P(128, 446));
    return s;
  },
  caption: 'Alkylate, stop, hydrolyze.',
});


FIGURES.push({
  id: 'michael-sites',
  section: 'imines-enamines',
  anchor: '<h3>Enamines in conjugate addition</h3>',
  viewBox: '0 0 760 414',
  alt: 'Left: but-3-en-2-one with its oxygen numbered 1, the carbonyl carbon 2, the CH 3 and the end CH2 4. One nucleophile arrow goes to carbon 2 (1,2-addition), another to carbon 4 (1,4-addition). Right: the pyrrolidine enamine of cyclohexanone adds 1,4. The nitrogen lone pair pushes toward the ring, the ring C=C forms a bond to carbon 4, the C3=C4 pi electrons move to C2–C3, and the C=O pi electrons move onto oxygen. Below: after hydrolysis the product is 2-(3-oxobutyl)cyclohexanone.',
  build() {
    let s = pSites(12, 10) + pMichael(368, 10);
    s += gapArrow(P(558, 264), P(558, 280));
    s += pMichaelProd(12, 280);
    return s;
  },
  caption: 'Left, the two positions; right, the enamine choosing position 4; below, the product once the iminium is hydrolyzed.',
});

FIGURES.push({
  id: 'imine-relatives',
  section: 'imines-enamines',
  anchor: '<h3>What carries forward</h3>',
  viewBox: '0 0 760 282',
  alt: 'Three panels. Reductive amination: the imine (CH3)2C=N–CH3 is reduced by NaBH3CN to the amine (CH3)2CH–NH–CH3. Oxime and hydrazone: (CH3)2C=N–OH from hydroxylamine and (CH3)2C=N–NH2 from hydrazine. Wolff–Kishner: the hydrazone of acetophenone, heated with KOH, loses N2 and gives ethylbenzene.',
  build() {
    return pRedAm(12, 10) + pOxHyd(264, 10) + pWK(516, 10);
  },
  caption: 'The three panels match the first three paragraphs; the Clemmensen reduction gives the same ethylbenzene straight from the ketone.',
});

export default FIGURES;
