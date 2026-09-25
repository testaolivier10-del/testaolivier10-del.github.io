/* Figures for the ester-syntheses notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   One concrete case runs through each synthesis: diethyl malonate with
   ethyl bromide, giving butanoic acid, and ethyl acetoacetate with ethyl
   bromide, giving pentan-2-one. The carbons that matter carry labels, so
   the reader can follow the alpha carbon (highlighted) from the starting
   ester to the product.

   Each panel is a function of its top-left corner and height, 232 wide,
   with only fg-lbl and fg-tag text, so the notes figures can lay panels in
   rows and the lesson copies (id prefix l-) can stack the same panels in
   one narrow column. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { zig, sk, polyPts } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];
const PW = 232;                       // panel width

/* ------------------------------------------------------------ helpers --- */
const rad = (l) => (l === 'H' ? 12 : l.length <= 2 ? 14 : 6 + l.length * 3);
const A = (x, y, l, k) => ({ x, y, l, k, r: rad(l) });
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.l, { kind: a.k, r: a.r })).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const off = (p, dx, dy) => P(p.x + dx, p.y + dy);
const lp = (a, deg, extra = 7) => lonePair(a.x, a.y, deg, { dist: a.r + extra });
const lpAt = (a, deg, extra = 7) => {
  const r = (deg * Math.PI) / 180, d = a.r + extra;
  return P(a.x + Math.cos(r) * d, a.y + Math.sin(r) * d);
};
const dotted = (a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  const x1 = a.x + ux * a.r, y1 = a.y + uy * a.r, x2 = b.x - ux * b.r, y2 = b.y - uy * b.r;
  return `<line class="fg-dash" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"></line>`;
};
/* A panel: a box, a title tag at the top and up to three tag lines at the
   bottom. A line can be [text, class]. */
function frameP(ox, oy, h, title, lines = [], kind, w = PW) {
  let s = panel(ox, oy, w, h, kind ? { kind } : {});
  s += tag(ox + w / 2, oy + 20, title);
  lines.forEach((ln, i) => {
    const [t, cls] = Array.isArray(ln) ? ln : [ln, 'fg-tag'];
    s += text(ox + w / 2, oy + h - 14 - (lines.length - 1 - i) * 17, t, { cls, size: 11 });
  });
  return s;
}
const gapArrow = (a, b) => arrow(a, b, { size: 7 });

/* Lay panels out: in rows (notes) or in one column (lessons). Each item is
   [fn, h]. Returns { svg, W, H }. */
function rows(items, perRow) {
  let s = '', y = 8, i = 0;
  while (i < items.length) {
    const row = items.slice(i, i + perRow);
    const h = Math.max(...row.map((it) => it[1]));
    row.forEach(([fn], j) => {
      const x = 8 + j * (PW + 24);
      s += fn(x, y, h);
      if (j < row.length - 1) s += gapArrow(P(x + PW + 4, y + h / 2), P(x + PW + 20, y + h / 2));
    });
    i += perRow;
    y += h + 16;
  }
  return { svg: s, W: 8 + perRow * PW + (perRow - 1) * 24 + 8, H: y - 8 };
}
function column(items) {
  let s = '', y = 8;
  items.forEach(([fn, h], i) => {
    s += fn(12, y, h);
    y += h;
    if (i < items.length - 1) { s += gapArrow(P(12 + PW / 2, y + 4), P(12 + PW / 2, y + 24)); y += 28; }
  });
  return { svg: s, W: PW + 24, H: y + 8 };
}

/* ------------------------------------------- malonic ester, 1 to 3 --- */

/* 1: ethoxide takes one alpha H of diethyl malonate. */
function pDeprot(ox, oy, h) {
  const o = (x, y) => P(ox + x, oy + y);
  const Ca = A(ox + 104, oy + 124, 'C', 'hi');
  const Hu = A(ox + 104, oy + 72, 'H', 'warn'), Hd = A(ox + 104, oy + 176, 'H');
  const E1 = A(ox + 40, oy + 146, 'CO₂Et'), E2 = A(ox + 168, oy + 146, 'CO₂Et');
  const B = A(ox + 190, oy + 72, 'EtO⁻');
  let s = frameP(ox, oy, h, '1 · NaOEt takes an α H', ['diethyl malonate']);
  s += bd(Ca, Hu, { cls: 'fg-bond-hi' }) + bd(Ca, Hd) + bd(Ca, E1) + bd(Ca, E2);
  s += lp(B, 180, 5);
  s += draw(Ca, Hu, Hd, E1, E2, B);
  s += curve(off(lpAt(B, 180, 5), -4, -4), off(Hu, 12, -8), { bow: 12 });
  s += curve(mid(Hu, Ca), off(Ca, 16, -10), { bow: -12 });
  s += tag(ox + 52, oy + 104, 'α carbon');
  return s;
}

/* 2: the carbanion attacks ethyl bromide (SN2). */
function pAlkyl(ox, oy, h) {
  const Ca = A(ox + 72, oy + 118, 'C⁻', 'hi');
  const E1 = A(ox + 36, oy + 68, 'CO₂Et'), E2 = A(ox + 36, oy + 170, 'CO₂Et');
  const H = A(ox + 104, oy + 164, 'H');
  const C = A(ox + 152, oy + 118, 'CH₂'), M = A(ox + 152, oy + 66, 'CH₃'), Br = A(ox + 206, oy + 118, 'Br');
  let s = frameP(ox, oy, h, '2 · C⁻ attacks CH₃CH₂–Br', ['SN2: Br⁻ leaves']);
  s += bd(Ca, E1) + bd(Ca, E2) + bd(Ca, H) + bd(C, M) + bd(C, Br, { cls: 'fg-bond-hi' });
  s += lp(Ca, 0, 6);
  s += draw(Ca, E1, E2, H, C, M, Br);
  s += curve(off(lpAt(Ca, 0, 6), 4, -6), off(C, -18, -6), { bow: 12 });
  s += curve(mid(C, Br), off(Br, -4, 16), { bow: 10 });
  return s;
}

/* 3: the alkylated diester. */
function pAlkylated(ox, oy, h) {
  const Ca = A(ox + 116, oy + 126, 'C', 'hi');
  const R = A(ox + 116, oy + 70, 'CH₂CH₃'), H = A(ox + 116, oy + 178, 'H');
  const E1 = A(ox + 50, oy + 148, 'CO₂Et'), E2 = A(ox + 182, oy + 148, 'CO₂Et');
  let s = frameP(ox, oy, h, '3 · diethyl ethylmalonate', ['one α H is left, so steps 1–2', 'can add a second group']);
  s += bd(Ca, R, { cls: 'fg-bond-hi' }) + bd(Ca, H) + bd(Ca, E1) + bd(Ca, E2);
  s += draw(Ca, R, H, E1, E2);
  s += tag(ox + 170, oy + 100, 'new C–C');
  return s;
}

/* ------------------------------------------- malonic ester, 4 to 6 --- */

/* 4: both esters hydrolyzed: ethylmalonic acid. */
function pDiacid(ox, oy, h) {
  const Ca = A(ox + 116, oy + 148, 'C', 'hi');
  const C1 = A(ox + 66, oy + 118, 'C'), O1 = A(ox + 66, oy + 66, 'O'), H1 = A(ox + 22, oy + 144, 'OH');
  const C2 = A(ox + 166, oy + 118, 'C'), O2 = A(ox + 166, oy + 66, 'O'), H2 = A(ox + 210, oy + 144, 'OH');
  const R = A(ox + 84, oy + 204, 'CH₂CH₃'), H = A(ox + 150, oy + 196, 'H');
  let s = frameP(ox, oy, h, '4 · H₃O⁺: both esters → COOH', ['ethylmalonic acid, a 1,3-diacid', '(two EtOH are lost)']);
  s += bd(C1, O1, { order: 2 }) + bd(C1, H1) + bd(C2, O2, { order: 2 }) + bd(C2, H2);
  s += bd(Ca, C1) + bd(Ca, C2) + bd(Ca, R) + bd(Ca, H);
  s += draw(Ca, C1, O1, H1, C2, O2, H2, R, H);
  return s;
}

/* 5 (and the acetoacetic copy): the six-membered ring with three arrows.
   exo is what the staying carbonyl carbon carries: 'OH' for the malonic
   acid, 'CH₃' for the beta-keto acid. */
function ringCore(ox, oy, exo) {
  const pts = polyPts(ox + 116, oy + 136, 6, 50, 90);
  const H = A(pts[0].x, pts[0].y, 'H', 'warn');
  const Oa = A(pts[1].x, pts[1].y, 'O');
  const C1 = A(pts[2].x, pts[2].y, 'C');
  const Ca = A(pts[3].x, pts[3].y, 'C', 'hi');
  const C2 = A(pts[4].x, pts[4].y, 'C');
  const Od = A(pts[5].x, pts[5].y, 'O');
  const X = A(ox + 28, oy + 188, exo);
  const O2 = A(ox + 204, oy + 188, 'O');
  const R = A(ox + 76, oy + 236, 'CH₂CH₃'), Hc = A(ox + 152, oy + 228, 'H');
  let s = '';
  s += bd(Oa, C1, { order: 2 }) + bd(C1, Ca) + bd(Ca, C2, { cls: 'fg-bond-hi' }) + bd(C2, Od) + bd(Od, H, { cls: 'fg-bond-hi' });
  s += dotted(H, Oa);
  s += bd(C1, X) + bd(C2, O2, { order: 2 }) + bd(Ca, R) + bd(Ca, Hc);
  s += draw(H, Oa, C1, Ca, C2, Od, X, O2, R, Hc);
  /* All three arrows run the same way round the ring:
     C=O pi to the H (new O-H); O-H bond to C-O (second C=O of CO2);
     Calpha-C bond to C1-Calpha (the enol's C=C). */
  s += curve(off(mid(Oa, C1), -12, 0), off(mid(Oa, H), -10, -10), { bow: -22 });
  s += curve(off(mid(Od, H), 10, -10), off(mid(Od, C2), 12, 0), { bow: -22 });
  s += curve(off(mid(Ca, C2), -2, -8), off(mid(C1, Ca), 2, -8), { bow: 16 });
  return s;
}
function pRingMalonic(ox, oy, h) {
  return frameP(ox, oy, h, '5 · heat: a six-atom ring', ['the COOH that leaves gives its H', 'to the other C=O']) + ringCore(ox, oy, 'OH');
}

/* 6 (and the acetoacetic copy): enol plus CO2, then the product.
   exo: 'OH' (malonic) or 'CH₃' (acetoacetic). */
function enolThenProduct(ox, oy, exo) {
  const C1 = A(ox + 140, oy + 90, 'C'), Ca = A(ox + 84, oy + 90, 'C', 'hi');
  const Oe = A(ox + 186, oy + 62, 'OH'), X = A(ox + 186, oy + 118, exo);
  const R = A(ox + 40, oy + 58, 'CH₂CH₃'), H = A(ox + 50, oy + 122, 'H');
  let s = bd(Ca, C1, { order: 2 }) + bd(C1, Oe) + bd(C1, X) + bd(Ca, R) + bd(Ca, H);
  s += draw(C1, Ca, Oe, X, R, H);
  s += tag(ox + 116, oy + 150, exo === 'OH' ? 'an enol,  + CO₂' : 'an enol,  + CO₂');
  s += gapArrow(P(ox + 116, oy + 160), P(ox + 116, oy + 186));
  const R2 = A(ox + 40, oy + 226, 'CH₂CH₃'), Ca2 = A(ox + 104, oy + 226, 'CH₂', 'hi');
  const C2 = A(ox + 154, oy + 226, 'C'), O2 = A(ox + 190, oy + 196, 'O'), X2 = A(ox + 196, oy + 254, exo);
  s += bd(R2, Ca2) + bd(Ca2, C2) + bd(C2, O2, { order: 2 }) + bd(C2, X2);
  s += draw(R2, Ca2, C2, O2, X2);
  return s;
}
function pEnolAcid(ox, oy, h) {
  return frameP(ox, oy, h, '6 · the enol → butanoic acid',
    [['CH₃CH₂ came from the halide', 'fg-tag-good'], 'CH₂–COOH came from malonate']) + enolThenProduct(ox, oy, 'OH');
}

const MAL_A = [[pDeprot, 214], [pAlkyl, 214], [pAlkylated, 230]];
const MAL_B = [[pDiacid, 276], [pRingMalonic, 300], [pEnolAcid, 316]];

FIGURES.push({
  id: 'malonic-sequence',
  section: 'ester-syntheses',
  alt: 'Malonic ester synthesis of butanoic acid in six panels. 1: ethoxide removes one hydrogen from the CH2 between the two CO2Et groups of diethyl malonate. 2: the carbanion attacks the CH2 of ethyl bromide and bromide leaves. 3: diethyl ethylmalonate, with the ethyl on the alpha carbon and one alpha H left. 4: hydrolysis gives ethylmalonic acid, two COOH groups on one carbon. 5: heat; one COOH gives its O–H hydrogen to the other carboxyl C=O through a six-membered ring, with three curved arrows. 6: the enol and CO2, then butanoic acid, whose ethyl came from the halide and whose CH2–COOH came from malonate.',
  get viewBox() { return `0 0 ${rows([...MAL_A, ...MAL_B], 3).W} ${rows([...MAL_A, ...MAL_B], 3).H}`; },
  build() { return rows([...MAL_A, ...MAL_B], 3).svg; },
  caption: 'Diethyl malonate plus ethyl bromide gives butanoic acid. Follow the highlighted α carbon: it takes the ethyl in panel 2, keeps it through the hydrolysis, and loses one of its two carboxyls in panel 5.',
});

FIGURES.push({
  id: 'l-malonic-alkylation',
  lessons: ['ester-syntheses'],
  alt: 'Three stacked panels: ethoxide removes an alpha hydrogen of diethyl malonate; the carbanion attacks the CH2 of ethyl bromide as bromide leaves; diethyl ethylmalonate, with one alpha H left.',
  get viewBox() { return `0 0 ${column(MAL_A).W} ${column(MAL_A).H}`; },
  build() { return column(MAL_A).svg; },
  caption: 'Deprotonate, then alkylate. The highlighted α carbon takes the ethyl group.',
});

FIGURES.push({
  id: 'l-malonic-decarb',
  lessons: ['ester-syntheses'],
  alt: 'Three stacked panels: ethylmalonic acid; the six-membered ring in which one COOH hands its H to the other carboxyl C=O, with three curved arrows; the enol plus CO2, then butanoic acid.',
  get viewBox() { return `0 0 ${column(MAL_B).W} ${column(MAL_B).H}`; },
  build() { return column(MAL_B).svg; },
  caption: 'Hydrolysis, then loss of CO₂ through a six-atom ring, then the enol turns into the acid.',
});

/* ------------------------------------------------ the ring closure --- */

/* 1: after the first SN2, a 4-bromobutyl chain on the alpha carbon. */
function pBromobutyl(ox, oy, h) {
  const Ca = A(ox + 70, oy + 132, 'C', 'hi');
  const E1 = A(ox + 30, oy + 86, 'CO₂Et'), E2 = A(ox + 40, oy + 192, 'CO₂Et'), H = A(ox + 70, oy + 72, 'H', 'warn');
  const ch = [P(ox + 104, oy + 150), P(ox + 132, oy + 132), P(ox + 160, oy + 150), P(ox + 188, oy + 132)];
  const Br = A(ox + 212, oy + 156, 'Br');
  let s = frameP(ox, oy, h, '1 · NaOEt, one end of the chain', ['first SN2: a 4-bromobutyl group', 'is on the α carbon']);
  s += bd(Ca, E1) + bd(Ca, E2) + bd(Ca, H) + bond(Ca, ch[0], { rFrom: Ca.r, rTo: 0 });
  for (let i = 0; i < 3; i++) s += sk(ch[i], ch[i + 1]);
  s += bond(ch[3], Br, { rFrom: 0, rTo: Br.r });
  s += draw(Ca, E1, E2, H, Br);
  ['2', '3', '4', '5'].forEach((n, i) => { s += tag(ch[i].x, ch[i].y + (i % 2 ? -12 : 20), n); });
  s += tag(Ca.x + 12, Ca.y + 34, '1');
  return s;
}

/* 2: NaOEt again; the carbanion reaches the far end of its own chain. */
function pCloseRing(ox, oy, h) {
  const pts = polyPts(ox + 134, oy + 136, 5, 52, 180);
  const Ca = A(pts[0].x, pts[0].y, 'C⁻', 'hi');
  const E1 = A(ox + 40, oy + 92, 'CO₂Et'), E2 = A(ox + 40, oy + 184, 'CO₂Et');
  const C5 = pts[4];
  const dir = { x: (C5.x - Ca.x), y: (C5.y - Ca.y) };
  const L = Math.hypot(dir.x, dir.y);
  const Br = A(C5.x + (dir.x / L) * 42, C5.y + (dir.y / L) * 50, 'Br');
  let s = frameP(ox, oy, h, '2 · NaOEt again: the chain closes', ['second SN2, inside one molecule']);
  s += bd(Ca, E1) + bd(Ca, E2) + bond(Ca, pts[1], { rFrom: Ca.r, rTo: 0 });
  for (let i = 1; i < 4; i++) s += sk(pts[i], pts[i + 1]);
  s += bond(C5, Br, { rFrom: 0, rTo: Br.r, cls: 'fg-bond-hi' });
  s += lp(Ca, -54, 5);
  s += draw(Ca, E1, E2, Br);
  s += curve(off(lpAt(Ca, -54, 5), 4, 0), off(C5, -6, 8), { bow: -10 });
  s += curve(off(mid(C5, Br), 6, 4), off(Br, 18, 6), { bow: 10 });
  const c = P(ox + 134, oy + 136);
  ['2', '3', '4', '5'].forEach((n, i) => {
    const p = pts[i + 1], dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy);
    s += tag(p.x + (dx / d) * 14, p.y + (dy / d) * 14 + 4, n);
  });
  return s;
}

/* 3: the cyclopentane diester, then the acid. */
function pRingProduct(ox, oy, h) {
  const c = P(ox + 116, oy + 118);
  const pts = polyPts(c.x, c.y, 5, 34, 90);
  const Ca = A(pts[0].x, pts[0].y, 'C', 'hi');
  const E1 = A(ox + 62, oy + 64, 'CO₂Et'), E2 = A(ox + 170, oy + 64, 'CO₂Et');
  let s = frameP(ox, oy, h, '3 · a five-membered ring', [['cyclopentanecarboxylic acid', 'fg-tag-good']]);
  s += bd(Ca, E1) + bd(Ca, E2);
  s += bond(Ca, pts[1], { rFrom: Ca.r, rTo: 0 }) + bond(Ca, pts[4], { rFrom: Ca.r, rTo: 0 });
  for (let i = 1; i < 4; i++) s += sk(pts[i], pts[i + 1]);
  s += draw(Ca, E1, E2);
  ['1', '2', '3', '4', '5'].forEach((n, i) => {
    const p = pts[i], dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy);
    s += tag(p.x + (dx / d) * (i ? 13 : 26), p.y + (dy / d) * (i ? 13 : 26) + 4, n);
  });
  s += gapArrow(P(ox + 116, oy + 168), P(ox + 116, oy + 194));
  s += tag(ox + 172, oy + 186, 'H₃O⁺, heat');
  const q = polyPts(ox + 90, oy + 232, 5, 24, 0);
  s += q.map((p, i) => sk(p, q[(i + 1) % 5])).join('');
  const COOH = A(ox + 162, oy + 232, 'COOH');
  s += bond(q[0], COOH, { rFrom: 0, rTo: COOH.r });
  s += draw(COOH);
  return s;
}

FIGURES.push({
  id: 'malonate-ring',
  section: 'ester-syntheses',
  alt: 'Three panels. 1: after one alkylation by 1,4-dibromobutane, the malonate alpha carbon (atom 1) carries a chain of four carbons (2 to 5) ending in Br. 2: a second ethoxide makes the alpha carbon a carbanion again; its lone pair attacks carbon 5 of its own chain and bromide leaves. 3: diethyl cyclopentane-1,1-dicarboxylate, a five-membered ring numbered 1 to 5, which H3O+ and heat turn into cyclopentanecarboxylic acid.',
  get viewBox() { return `0 0 ${rows(RING, 3).W} ${rows(RING, 3).H}`; },
  build() { return rows(RING, 3).svg; },
  caption: 'The numbers 1 to 5 follow the same atoms through all three panels. Atom 1 is the malonate α carbon.',
});
const RING = [[pBromobutyl, 280], [pCloseRing, 280], [pRingProduct, 280]];

/* --------------------------------------------- reading it backwards --- */

/* A short dashed cut mark across the bond a–b at point m. */
function cut(m, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const px = -dy / L, py = dx / L;
  return `<line class="fg-arrow" x1="${(m.x + px * 13).toFixed(2)}" y1="${(m.y + py * 13).toFixed(2)}" x2="${(m.x - px * 13).toFixed(2)}" y2="${(m.y - py * 13).toFixed(2)}" stroke-dasharray="3 3"></line>`;
}
/* A labelled carboxyl on skeletal carbon c: C=O up, OH to the right. */
function carboxyl(c) {
  const O = A(c.x, c.y - 40, 'O'), OH = A(c.x + 46, c.y, 'OH');
  return bond(c, O, { rFrom: 0, rTo: O.r, order: 2 }) + bond(c, OH, { rFrom: 0, rTo: OH.r }) + draw(O, OH);
}

/* One target, drawn skeletally, with the bond from the alpha carbon to its
   substituent cut. */
function pTarget(ox, oy, h, which) {
  const w = 324;
  const good = which === 'good';
  let s = frameP(ox, oy, h, good ? '4-methylpentanoic acid' : '3,3-dimethylbutanoic acid',
    good ? [['halide: (CH₃)₂CHCH₂Br, primary', 'fg-tag-good']] : [['halide: (CH₃)₃CBr, tertiary: no route', 'fg-tag-warn']],
    good ? undefined : 'warn', w);
  const y = oy + 84;
  if (good) {
    const v = [P(ox + 46, y), P(ox + 86, y + 20), P(ox + 126, y), P(ox + 166, y + 20), P(ox + 206, y)];
    // v0 CH3, v1 CH (branch down), v2 CH2, v3 alpha CH2, v4 the carboxyl carbon
    s += sk(v[0], v[1]) + sk(v[1], v[2]) + sk(v[2], v[3], true) + sk(v[3], v[4]);
    s += sk(v[1], P(v[1].x, v[1].y + 38));
    s += carboxyl(v[4]);
    s += cut(mid(v[2], v[3]), v[2], v[3]);
    s += tag(v[3].x, v[3].y + 22, 'α');
    s += tag(ox + 92, oy + 162, 'from the halide');
    s += tag(ox + 220, oy + 162, 'from malonate');
  } else {
    const q = P(ox + 106, y + 10), a = P(ox + 156, y - 10), c = P(ox + 206, y + 10);
    s += sk(q, P(q.x - 44, q.y - 16)) + sk(q, P(q.x - 44, q.y + 22)) + sk(q, P(q.x, q.y + 40));
    s += sk(q, a, true) + sk(a, c);
    s += carboxyl(c);
    s += cut(mid(q, a), q, a);
    s += tag(a.x, a.y + 30, 'α');
    s += tag(ox + 80, oy + 162, 'from the halide');
    s += tag(ox + 220, oy + 162, 'from malonate');
  }
  return s;
}

FIGURES.push({
  id: 'malonic-disconnect',
  section: 'ester-syntheses',
  lessons: ['ester-syntheses'],
  alt: 'Two targets drawn skeletally with the bond from the alpha carbon to its substituent cut. 4-Methylpentanoic acid: the cut leaves CH2–COOH from malonate and an isobutyl group from 1-bromo-2-methylpropane, a primary halide. 3,3-Dimethylbutanoic acid: the cut leaves CH2–COOH and a tert-butyl group, which would need tert-butyl bromide, a tertiary halide, so there is no route.',
  viewBox: '0 0 340 424',
  build() { return pTarget(8, 8, 200, 'good') + pTarget(8, 216, 200, 'bad'); },
  caption: 'The dashed mark cuts the bond from the α carbon to its substituent. Top: a route. Bottom: the near miss with no route.',
});

/* ------------------------------------------------ why only beta --- */

function pKeto(ox, oy, h, which) {
  const w = 324;
  const good = which === 'beta';
  const titles = { beta: 'β-keto acid: loses CO₂ on warming', alpha: 'α-keto acid: no', gamma: 'γ-keto acid: no' };
  const lines = {
    beta: [['a C=O sits beside the α carbon', 'fg-tag-good']],
    alpha: [['the α carbon is the C=O carbon,', 'fg-tag-warn'], ['with no C=O beside it', 'fg-tag-warn']],
    gamma: [['the α carbon’s neighbor is CH₂,', 'fg-tag-warn'], ['not a C=O', 'fg-tag-warn']],
  }[which];
  let s = frameP(ox, oy, h, titles[which], lines, good ? 'good' : 'warn', w);
  const y = oy + 82;
  const M = A(ox + 36, y, 'CH₃');
  const nCH2 = which === 'beta' ? 1 : which === 'gamma' ? 2 : 0;
  const Ck = A(ox + 90, y, 'C');
  const Ok = A(ox + 90, y - 42, 'O');
  s += bd(M, Ck) + bd(Ck, Ok, { order: 2 });
  let prev = Ck, x = ox + 90;
  const chain = [];
  for (let i = 0; i < nCH2; i++) { x += 58; const c = A(x, y, 'CH₂'); chain.push(c); s += bd(prev, c); prev = c; }
  x += 66;
  const COOH = A(x, y, 'COOH');
  s += bd(prev, COOH, { cls: 'fg-bond-hi' });
  s += draw(M, Ck, Ok, ...chain, COOH);
  const carbons = [Ck, ...chain];
  const names = ['α', 'β', 'γ'];
  for (let i = carbons.length - 1, j = 0; i >= 0; i--, j++) s += tag(carbons[i].x, y + 30, names[j]);
  s += tag(mid(prev, COOH).x + 4, y - 14, 'breaks');
  return s;
}

FIGURES.push({
  id: 'decarb-beta-only',
  section: 'ester-syntheses',
  lessons: ['ester-syntheses'],
  alt: 'Three keto acids with the bond to COOH marked as the one that breaks. In the beta-keto acid CH3COCH2COOH, a ketone C=O sits beside the alpha carbon, and it loses CO2. In the alpha-keto acid CH3COCOOH the alpha carbon is the ketone carbon itself, with no C=O beside it. In the gamma-keto acid CH3COCH2CH2COOH the alpha carbon is next to a CH2, not a C=O. Neither of the last two loses CO2 this way.',
  viewBox: '0 0 340 508',
  build() { return pKeto(8, 8, 150, 'beta') + pKeto(8, 174, 162, 'alpha') + pKeto(8, 344, 162, 'gamma'); },
  caption: 'The highlighted bond is the one that would break. The Greek letters count carbons outward from the COOH.',
});

/* ------------------------------------------------ acetoacetic ester --- */

/* 1: ethyl acetoacetate, then the alkylated ester. */
function pAcetoAlkyl(ox, oy, h) {
  let s = frameP(ox, oy, h, '1 · NaOEt, then CH₃CH₂Br', ['the α carbon takes the ethyl']);
  const row = (y, alk) => {
    const M = A(ox + 26, y, 'CH₃'), Ck = A(ox + 74, y, 'C'), O = A(ox + 74, y - 44, 'O');
    const Ca = A(ox + 126, y, alk ? 'CH' : 'CH₂', 'hi'), E = A(ox + 190, y, 'CO₂Et');
    let t = bd(M, Ck) + bd(Ck, O, { order: 2 }) + bd(Ck, Ca) + bd(Ca, E);
    let extra = [];
    if (alk) { const R = A(ox + 126, y + 50, 'CH₂CH₃'); t += bd(Ca, R, { cls: 'fg-bond-hi' }); extra.push(R); }
    return t + draw(M, Ck, O, Ca, E, ...extra);
  };
  s += row(oy + 90, false);
  s += tag(ox + 116, oy + 126, 'ethyl acetoacetate');
  s += gapArrow(P(ox + 116, oy + 136), P(ox + 116, oy + 160));
  s += row(oy + 214, true);
  return s;
}
function pRingAceto(ox, oy, h) {
  return frameP(ox, oy, h, '2 · H₃O⁺, heat: the β-keto acid', ['the ketone C=O takes the H', 'this time']) + ringCore(ox, oy, 'CH₃');
}
function pEnolKetone(ox, oy, h) {
  return frameP(ox, oy, h, '3 · the enol → pentan-2-one',
    [['CH₃CH₂ came from the halide', 'fg-tag-good'], 'the rest came from acetoacetate']) + enolThenProduct(ox, oy, 'CH₃');
}
const ACETO = [[pAcetoAlkyl, 322], [pRingAceto, 300], [pEnolKetone, 316]];

FIGURES.push({
  id: 'acetoacetic-sequence',
  section: 'ester-syntheses',
  alt: 'Acetoacetic ester synthesis of pentan-2-one in three panels. 1: ethyl acetoacetate, CH3–CO–CH2–CO2Et, is deprotonated and alkylated with ethyl bromide at the CH2 between the two carbonyls. 2: after hydrolysis the beta-keto acid loses CO2 through a six-membered ring; the ketone oxygen takes the carboxyl H, drawn with three curved arrows. 3: the enol, then pentan-2-one, whose ethyl came from the halide and whose other carbons came from acetoacetate.',
  get viewBox() { return `0 0 ${rows(ACETO, 3).W} ${rows(ACETO, 3).H}`; },
  build() { return rows(ACETO, 3).svg; },
  caption: 'Ethyl acetoacetate plus ethyl bromide gives pentan-2-one. The ketone is never touched: only the ester side is hydrolyzed and lost as CO₂.',
});

FIGURES.push({
  id: 'l-acetoacetic',
  lessons: ['ester-syntheses'],
  alt: 'Three stacked panels: ethyl acetoacetate is alkylated with ethyl bromide at the CH2 between the two carbonyls; the beta-keto acid loses CO2 through a six-membered ring with three curved arrows; the enol, then pentan-2-one.',
  get viewBox() { return `0 0 ${column(ACETO).W} ${column(ACETO).H}`; },
  build() { return column(ACETO).svg; },
  caption: 'Same three stages, but the ketone survives, so the product is a methyl ketone.',
});

/* ------------------------------------------- tertiary halide: E2 --- */
function pE2(ox, oy, h) {
  const w = 324;
  let s = frameP(ox, oy, h, 'the C⁻ takes an H instead (E2)', [], 'warn', w);
  const Ca = A(ox + 60, oy + 118, 'C⁻', 'hi');
  const E1 = A(ox + 36, oy + 66, 'CO₂Et'), E2 = A(ox + 36, oy + 172, 'CO₂Et'), H0 = A(ox + 94, oy + 164, 'H');
  const Hb = A(ox + 144, oy + 74, 'H', 'warn'), Cb = A(ox + 172, oy + 120, 'CH₂');
  const Cq = A(ox + 230, oy + 120, 'C'), M1 = A(ox + 230, oy + 68, 'CH₃'), M2 = A(ox + 230, oy + 172, 'CH₃');
  const Br = A(ox + 290, oy + 120, 'Br');
  s += bd(Ca, E1) + bd(Ca, E2) + bd(Ca, H0) + bd(Hb, Cb, { cls: 'fg-bond-hi' }) + bd(Cb, Cq) + bd(Cq, M1) + bd(Cq, M2) + bd(Cq, Br, { cls: 'fg-bond-hi' });
  s += lp(Ca, -30, 5);
  s += draw(Ca, E1, E2, H0, Hb, Cb, Cq, M1, M2, Br);
  s += curve(off(lpAt(Ca, -30, 5), 4, -4), off(Hb, -14, 0), { bow: 16 });
  s += curve(mid(Hb, Cb, 0.55), mid(Cb, Cq), { bow: -18 });
  s += curve(mid(Cq, Br), off(Br, 0, 18), { bow: 12 });
  return s;
}
function pE2Products(ox, oy, h) {
  const w = 324;
  let s = frameP(ox, oy, h, 'what you get back', [['no new C–C bond on the α carbon', 'fg-tag-warn']], 'warn', w);
  const C1 = A(ox + 50, oy + 76, 'CH₂'), C2 = A(ox + 106, oy + 76, 'C');
  const M1 = A(ox + 146, oy + 48, 'CH₃'), M2 = A(ox + 146, oy + 104, 'CH₃');
  s += bd(C1, C2, { order: 2 }) + bd(C2, M1) + bd(C2, M2);
  s += draw(C1, C2, M1, M2);
  s += tag(ox + 244, oy + 66, '+ diethyl malonate');
  s += tag(ox + 244, oy + 88, '+ Br⁻');
  s += tag(ox + 92, oy + 134, '2-methylpropene');
  return s;
}

FIGURES.push({
  id: 'tertiary-e2',
  section: 'ester-syntheses',
  lessons: ['ester-syntheses'],
  alt: 'The malonate carbanion meets tert-butyl bromide. Its lone pair takes a hydrogen from one of the methyl groups, that C–H bond becomes a C=C, and bromide leaves: an E2. The products are 2-methylpropene, diethyl malonate back again and bromide, with no new bond to the alpha carbon.',
  viewBox: '0 0 340 424',
  build() { return pE2(8, 8, 208) + gapArrow(P(170, 220), P(170, 240)) + pE2Products(8, 248, 168); },
  caption: 'Three curved arrows, one E2. The anion ends up with a hydrogen, not a new carbon group.',
});

/* ------------------------------------------------ two carbonyls --- */
function pOneOrTwo(ox, oy, h, which) {
  const w = 324;
  const lines = {
    acetate: [['one C=O beside the CH₃', 'fg-tag']],
    malonate: [['two C=O beside the CH₂', 'fg-tag-good']],
    aceto: [['two C=O beside the CH₂', 'fg-tag-good']],
  }[which];
  const titles = { acetate: 'ethyl acetate', malonate: 'diethyl malonate', aceto: 'ethyl acetoacetate' };
  let s = frameP(ox, oy, h, titles[which], lines, undefined, w);
  const y = oy + 90;
  if (which === 'acetate') {
    const Ca = A(ox + 110, y, 'CH₃', 'hi'), C = A(ox + 166, y, 'C'), O = A(ox + 166, y - 42, 'O'), E = A(ox + 222, y, 'OEt');
    s += bd(Ca, C) + bd(C, O, { order: 2 }) + bd(C, E) + draw(Ca, C, O, E);
    s += tag(Ca.x, y - 24, 'α');
  } else {
    const L = which === 'malonate' ? A(ox + 42, y, 'EtO') : A(ox + 42, y, 'CH₃');
    const C1 = A(ox + 102, y, 'C'), O1 = A(ox + 102, y - 42, 'O');
    const Ca = A(ox + 162, y, 'CH₂', 'hi');
    const C2 = A(ox + 222, y, 'C'), O2 = A(ox + 222, y - 42, 'O'), E = A(ox + 282, y, 'OEt');
    s += bd(L, C1) + bd(C1, O1, { order: 2 }) + bd(C1, Ca) + bd(Ca, C2) + bd(C2, O2, { order: 2 }) + bd(C2, E);
    s += draw(L, C1, O1, Ca, C2, O2, E);
    s += tag(Ca.x, y - 24, 'α');
  }
  return s;
}

FIGURES.push({
  id: 'two-carbonyls',
  section: 'ester-syntheses',
  lessons: ['ester-syntheses'],
  alt: 'Three structures. Ethyl acetate, CH3–CO–OEt: the alpha CH3 has one C=O beside it. Diethyl malonate, EtO–CO–CH2–CO–OEt, and ethyl acetoacetate, CH3–CO–CH2–CO–OEt: the alpha CH2 sits between two C=O groups.',
  viewBox: '0 0 340 440',
  build() { return pOneOrTwo(8, 8, 136, 'acetate') + pOneOrTwo(8, 152, 136, 'malonate') + pOneOrTwo(8, 296, 136, 'aceto'); },
  caption: 'The highlighted carbon in each is the α carbon.',
});

/* Every figure is placed by its empty markers, written by hand in the notes
   prose or in a lesson step's string. */
export default FIGURES;
