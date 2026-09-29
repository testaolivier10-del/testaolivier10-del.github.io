/* Figures for the gilman-reagents notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   One numbering runs through every enone figure on this page and in the
   prose: the carbonyl oxygen is atom 1, the carbonyl carbon atom 2, the
   alpha carbon atom 3 and the beta carbon atom 4. That is what the "1,2"
   and "1,4" in 1,2- and 1,4-addition count. They are not IUPAC locants.

   The curved arrows for the cuprate follow the convention of the Making
   carbon-carbon bonds page (carbon-carbon-bonds.mjs, carbonyl-three-sites):
   the C-Cu bond pair goes to the beta carbon, the C=C pair moves over, and
   the C=O pair goes onto oxygen. That is a polar bookkeeping picture; the
   notes say so in a marked aside.

   Every figure that a lesson shows is 340 wide or less and uses only fg-lbl
   and fg-tag text. */
import { atom, bond, arrow, curve, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';
import { lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const SQ3 = Math.sqrt(3);

/* ------------------------------------------------------------ helpers --- */
/* An atom with a label, sized to it. */
const A = (x, y, lbl, kind = 'plain', r) => {
  const small = (lbl.match(/[₀-₉⁺⁻]/g) || []).length;
  return { x, y, lbl, kind, r: r ?? Math.max(13, Math.ceil((lbl.length - small) * 4.2 + small * 2.6 + 6)) };
};
const draw = (...as) => as.map((a) => atom(a.x, a.y, a.lbl, { kind: a.kind, r: a.r })).join('');
/* A bond between atoms or bare skeletal vertices (a point with no r). */
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r || 0, rTo: b.r || 0, ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const polar = (c, deg, r) => P(c.x + r * Math.cos(deg * Math.PI / 180), c.y - r * Math.sin(deg * Math.PI / 180));
const lbl = (x, y, s, o = {}) => text(x, y, s, { cls: 'fg-lbl', size: 13, ...o });
const good = (x, y, s, o = {}) => tag(x, y, s, { cls: 'fg-tag-good', ...o });
const warn = (x, y, s, o = {}) => tag(x, y, s, { cls: 'fg-tag-warn', ...o });
const mut = (x, y, s, o = {}) => tag(x, y, s, { cls: 'fg-tag-mut', ...o });
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 7 });
const right = (y, x1, x2) => arrow(P(x1, y), P(x2, y), { size: 7 });
const plusSign = (x, y) => text(x, y, '+', { cls: 'fg-lbl', size: 13 });
/* The resonance double-headed arrow. */
const resArrow = (x1, x2, y) => {
  const h = 7;
  return `<line class="fg-arrow" x1="${x1 + h}" y1="${y}" x2="${x2 - h}" y2="${y}"></line>` +
    `<path class="fg-head" d="M${x1} ${y} L${x1 + h} ${y - 3.6} L${x1 + h} ${y + 3.6} Z"></path>` +
    `<path class="fg-head" d="M${x2} ${y} L${x2 - h} ${y - 3.6} L${x2 - h} ${y + 3.6} Z"></path>`;
};

/* A cyclohexane ring of unlabeled vertices. v0 is the top vertex (the
   carbonyl carbon); going round clockwise on screen, v5 (upper left) is the
   alpha carbon and v4 (lower left) the beta carbon. */
const RR = 32;
const ringPts = (c, R = RR) => [
  P(c.x, c.y - R), P(c.x + R * SQ3 / 2, c.y - R / 2), P(c.x + R * SQ3 / 2, c.y + R / 2),
  P(c.x, c.y + R), P(c.x - R * SQ3 / 2, c.y + R / 2), P(c.x - R * SQ3 / 2, c.y - R / 2),
];
/* Edge i joins v[i] and v[i+1]. Edge 4 is beta=alpha, edge 5 is alpha-C2. */
function ringInk(c, v, doubles = []) {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = v[i], b = v[(i + 1) % 6];
    s += doubles.includes(i) ? ringDouble(a, b, c, { inset: 7, gap: 4.6 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  return s;
}

/* The six-membered enone family drawn at centre c.
   o.form: 'enone'   cyclohex-2-en-1-one (C=O, C=C at beta=alpha)
           'plus'    its resonance contributor (O-, C=C at alpha=C2, + on beta)
           'enolate' the enolate after 1,4-addition (O-, C=C at alpha=C2, CH3 on beta)
           'ketone'  3-methylcyclohexan-1-one (CH3 on beta)
           'alcohol' 1-methylcyclohex-2-en-1-ol (OH and CH3 on C2, C=C beta=alpha)
   o.nums: write the 1-4 numbering and alpha/beta beside the atoms. */
function sixRing(c, o = {}) {
  const v = ringPts(c);
  const form = o.form || 'enone';
  let s = '';
  const dbl = form === 'enone' || form === 'alcohol' ? [4] : form === 'ketone' ? [] : [5];
  s += ringInk(c, v, dbl);
  let O = null;
  if (form === 'alcohol') {
    const OH = A(v[0].x - 22, v[0].y - 30, 'OH');
    const Me = A(v[0].x + 24, v[0].y - 30, 'CH₃', 'hi');
    s += bd(v[0], OH) + bd(v[0], Me, { cls: 'fg-bond-hi' }) + draw(OH, Me);
  } else {
    const charged = form === 'plus' || form === 'enolate';
    O = A(c.x, v[0].y - 34, charged ? 'O⁻' : 'O', charged ? 'warn' : 'plain', charged ? 15 : 13);
    s += bd(v[0], O, { order: charged ? 1 : 2 }) + draw(O);
  }
  if (form === 'enolate' || form === 'ketone') {
    const Me = A(v[4].x - 30, v[4].y + 18, 'CH₃', 'hi');
    s += bd(v[4], Me, { cls: 'fg-bond-hi' }) + draw(Me);
  }
  if (form === 'plus') s += plusSign(v[4].x - 12, v[4].y + 16);
  if (o.nums) {
    if (O) s += good(O.x + 22, O.y + 4, '1');
    s += good(v[0].x + 13, v[0].y - 6, '2');
    s += good(v[5].x - 11, v[5].y - 8, '3') + tag(v[5].x - 24, v[5].y - 8, 'α');
    if (form !== 'plus') s += good(v[4].x - 11, v[4].y + 16, '4') + tag(v[4].x - 24, v[4].y + 16, 'β');
    else s += good(v[4].x - 26, v[4].y + 16, '4') + tag(v[4].x - 38, v[4].y + 16, 'β');
  }
  return { s, v, O };
}

/* ======================================== the cuprate and its bond ===== */
/* Two rows: the C-Li bond of methyllithium and the dimethylcuprate ion, each
   with the Pauling electronegativities that set how polar the bond is. */
function cuprateMade() {
  let s = '';
  // Row 1: methyllithium, drawn twice worth of reagent as "2 H3C-Li"
  s += tag(170, 20, 'two CH₃Li and one CuI give one cuprate');
  const C1 = A(118, 58, 'H₃C'), L1 = A(186, 58, 'Li');
  s += text(82, 63, '2', { cls: 'fg-lbl', size: 13 });
  s += bd(C1, L1) + draw(C1, L1);
  s += warn(C1.x, 92, '2.55') + warn(L1.x, 92, '0.98');
  s += tag(C1.x, 34 + 4, 'δ−') + tag(L1.x, 34 + 4, 'δ+');
  s += tag(262, 58, 'very polar');
  s += tag(262, 74, 'gap 1.57');
  s += down(170, 104, 128);
  s += tag(182, 121, '+ CuI, −LiI', { anchor: 'start' });
  // Row 2: the cuprate ion and its lithium counterion
  const C2 = A(84, 168, 'H₃C'), Cu = A(152, 168, 'Cu⁻', 'hi', 17), C3 = A(220, 168, 'CH₃');
  s += bd(C2, Cu) + bd(Cu, C3) + draw(C2, Cu, C3);
  s += lbl(268, 173, 'Li⁺');
  s += good(C2.x, 202, '2.55') + good(Cu.x, 202, '1.90') + good(C3.x, 202, '2.55');
  s += tag(170, 230, 'gap 0.65: a much less polar C–Cu bond');
  return s;
}

FIGURES.push({
  id: 'cuprate-made',
  section: 'gilman-reagents',
  lessons: ['gilman-reagents'],
  anchor: '<!-- fig:cuprate-made:start -->',
  viewBox: '0 0 340 244',
  alt: 'Top: 2 H3C–Li, with carbon at electronegativity 2.55 marked delta minus and lithium at 0.98 marked delta plus; a gap of 1.57, very polar. An arrow labeled plus CuI, minus LiI leads down to the dimethylcuprate ion, H3C–Cu–CH3 with a minus charge on copper and Li+ beside it; carbon 2.55, copper 1.90, a gap of 0.65, a much less polar bond.',
  build: cuprateMade,
  caption: 'The numbers are Pauling electronegativities. Compare the gap across the C–Li bond with the gap across each C–Cu bond.',
});

/* ================================== an enone's two electrophilic carbons === */
/* Left: the resonance pair that puts + on the beta carbon.
   Right: the LUMO, as p orbitals whose sizes follow Hückel coefficients for
   propenal (O -0.43, C2 +0.58, C3 +0.23, C4 -0.66), so the beta lobe is the
   largest and the carbonyl-carbon lobe next. */
function resonancePanel(ox, oy) {
  let s = '';
  const c1 = P(ox + 82, oy + 104), c2 = P(ox + 250, oy + 104);
  const a = sixRing(c1, { form: 'enone', nums: true });
  s += a.s;
  const v = a.v;
  // C=C pair moves over to the alpha-C2 bond; C=O pair goes onto oxygen
  s += curve(mid(v[4], v[5]), mid(v[5], v[0]), { bow: 12, size: 7 });
  s += curve(P(v[0].x + 3, v[0].y - 16), P(a.O.x + 12, a.O.y + 9), { bow: -9, size: 7 });
  s += resArrow(ox + 150, ox + 184, oy + 104);
  s += sixRing(c2, { form: 'plus', nums: true }).s;
  s += tag(ox + 166, oy + 186, 'the right-hand form puts + on the β carbon (4)');
  s += tag(ox + 166, oy + 204, 'and the C=O pulls electrons from carbon 2 as well');
  return s;
}

function pLobe(x, y0, c) {
  const k = Math.abs(c);
  const rx = 4 + 11 * k, ry = 6 + 26 * k, gap = 2;
  const up = c > 0;
  return lobeE(x, +(y0 - gap - ry).toFixed(2), +rx.toFixed(2), +ry.toFixed(2), up ? 'fg-orb' : 'fg-orb-alt') +
         lobeE(x, +(y0 + gap + ry).toFixed(2), +rx.toFixed(2), +ry.toFixed(2), up ? 'fg-orb-alt' : 'fg-orb');
}
function lumoPanel(ox, oy) {
  let s = '';
  const xs = [ox + 70, ox + 136, ox + 202, ox + 268], y0 = oy + 100;
  const coef = [-0.43, 0.58, 0.23, -0.66];
  const names = ['O', 'C', 'C', 'C'];
  const at = xs.map((x, i) => A(x, y0, names[i], i === 3 ? 'hi' : 'plain', 11));
  for (let i = 0; i < 3; i++) s += bd(at[i], at[i + 1]);
  xs.forEach((x, i) => { s += pLobe(x, y0, coef[i]); });
  s += draw(...at);
  // node lines where the phase flips: between O and C2, and between C3 and C4
  for (const i of [0, 2]) {
    const x = (xs[i] + xs[i + 1]) / 2;
    s += `<line class="fg-orb-node" x1="${x}" y1="${y0 - 44}" x2="${x}" y2="${y0 + 44}"></line>`;
  }
  ['1', '2', '3', '4'].forEach((n, i) => { s += good(xs[i], y0 + 66, n); });
  s += tag(xs[2], y0 + 82, 'α') + tag(xs[3], y0 + 82, 'β');
  s += tag(ox + 170, oy + 20, 'the LUMO, the empty orbital a nucleophile fills');
  s += good(xs[3], oy + 186, 'largest lobe: β (4)');
  s += tag(xs[1], oy + 186, 'next: carbon 2');
  s += tag(ox + 170, oy + 204, 'dashed lines mark where the phase flips');
  return s;
}

FIGURES.push({
  id: 'enone-two-sites',
  section: 'gilman-reagents',
  anchor: '<!-- fig:enone-two-sites:start -->',
  viewBox: '0 0 760 222',
  alt: 'Left: cyclohex-2-en-1-one with its atoms numbered: the oxygen 1, the carbonyl carbon 2, the alpha carbon 3 and the beta carbon 4. Curved arrows move the C=C electrons to the bond between carbons 3 and 2 and the C=O electrons onto oxygen, giving a resonance form with O minus, a C=C between carbons 2 and 3, and a plus charge on the beta carbon. Right: the four atoms of the pi system in a row, O, C, C, C, each with a p orbital; the lobes are largest on the beta carbon, next largest on carbon 2, smaller on oxygen and smallest on carbon 3, with the phase flipping between atoms 1 and 2 and between atoms 3 and 4.',
  build() {
    let s = panel(6, 6, 344, 212) + resonancePanel(6, 6);
    s += panel(372, 6, 340 + 42, 212) + lumoPanel(393, 6);
    return s;
  },
  caption: 'Left: follow the two arrows to the + on atom 4. Right: compare the lobe sizes on atoms 2 and 4.',
});

FIGURES.push({
  id: 'l-enone-two-sites',
  lessons: ['gilman-reagents'],
  viewBox: '0 0 340 440',
  alt: 'Two stacked panels. Top: cyclohex-2-en-1-one numbered 1 (oxygen) to 4 (beta carbon), with arrows giving the resonance form that has O minus and a plus charge on the beta carbon. Bottom: the LUMO of the four-atom pi system drawn as p orbitals, largest on the beta carbon, next largest on carbon 2.',
  build() {
    let s = panel(2, 2, 336, 214) + resonancePanel(2, 2);
    s += panel(2, 224, 336, 214) + lumoPanel(0, 226);
    return s;
  },
  caption: 'Top: the + on atom 4. Bottom: the LUMO’s largest lobe is on atom 4.',
});

/* ===================================== one enone, two reagents ======= */
function enoneTop(cx, cy) { return sixRing(P(cx, cy), { form: 'enone', nums: true }).s; }
function productAlcohol(cx, cy) { return sixRing(P(cx, cy), { form: 'alcohol' }).s; }
function productKetone(cx, cy) { return sixRing(P(cx, cy), { form: 'ketone' }).s; }

FIGURES.push({
  id: 'twelve-fourteen',
  section: 'gilman-reagents',
  anchor: '<!-- fig:twelve-fourteen:start -->',
  viewBox: '0 0 760 330',
  alt: 'Cyclohex-2-en-1-one at the top, numbered 1 (oxygen) to 4 (beta carbon). Left branch: CH3MgBr, then H3O+, adds at atom 2 (1,2-addition) and gives 1-methylcyclohex-2-en-1-ol, with OH and CH3 on the same ring carbon and the C=C still in the ring. Right branch: (CH3)2CuLi, then H3O+, adds at atom 4 (1,4-addition) and gives 3-methylcyclohexan-1-one, with the C=O intact and the CH3 on the former beta carbon. The new carbon-carbon bond is colored in each product.',
  build() {
    let s = '';
    s += panel(270, 6, 220, 150, { kind: 'hi' }) + enoneTop(380, 96);
    s += tag(380, 26, 'cyclohex-2-en-1-one');
    // left branch
    s += arrow(P(262, 110), P(170, 172), { size: 8 });
    s += tag(196, 118, 'CH₃MgBr', { anchor: 'end' }) + mut(196, 134, 'then H₃O⁺', { anchor: 'end' });
    s += good(250, 162, '1,2: adds at atom 2', { anchor: 'end' });
    s += panel(20, 180, 260, 144) + productAlcohol(150, 262);
    s += tag(150, 312, '1-methylcyclohex-2-en-1-ol');
    // right branch
    s += arrow(P(498, 110), P(590, 172), { size: 8 });
    s += tag(564, 118, '(CH₃)₂CuLi', { anchor: 'start' }) + mut(564, 134, 'then H₃O⁺', { anchor: 'start' });
    s += good(510, 162, '1,4: adds at atom 4', { anchor: 'start' });
    s += panel(480, 180, 260, 144) + productKetone(610, 262);
    s += tag(610, 312, '3-methylcyclohexan-1-one');
    return s;
  },
  caption: 'The same enone and the same methyl group, with only the metal changed. The colored bond is the new C–C bond in each product.',
});

FIGURES.push({
  id: 'l-twelve-fourteen',
  lessons: ['gilman-reagents'],
  viewBox: '0 0 340 470',
  alt: 'Cyclohex-2-en-1-one at the top, numbered 1 (oxygen) to 4 (beta carbon). Below, two rows. CH3MgBr then H3O+ adds at atom 2 and gives 1-methylcyclohex-2-en-1-ol. (CH3)2CuLi then H3O+ adds at atom 4 and gives 3-methylcyclohexan-1-one. The new carbon-carbon bond is colored.',
  build() {
    let s = '';
    s += panel(70, 4, 200, 146, { kind: 'hi' }) + enoneTop(174, 94);
    s += tag(170, 22, 'cyclohex-2-en-1-one');
    // row 1: Grignard
    s += panel(4, 160, 332, 150);
    s += tag(16, 190, 'CH₃MgBr', { anchor: 'start' }) + mut(16, 206, 'then H₃O⁺', { anchor: 'start' });
    s += right(226, 16, 120);
    s += good(16, 250, '1,2: adds at atom 2', { anchor: 'start' });
    s += productAlcohol(236, 238);
    s += tag(236, 298, '1-methylcyclohex-2-en-1-ol');
    // row 2: cuprate
    s += panel(4, 316, 332, 150);
    s += tag(16, 346, '(CH₃)₂CuLi', { anchor: 'start' }) + mut(16, 362, 'then H₃O⁺', { anchor: 'start' });
    s += right(382, 16, 120);
    s += good(16, 406, '1,4: adds at atom 4', { anchor: 'start' });
    s += productKetone(236, 390);
    s += tag(236, 452, '3-methylcyclohexan-1-one');
    return s;
  },
  caption: 'Same enone, same methyl. The colored bond is the new one.',
});

/* ========================== the 1,4-addition, one frame per stage ===== */
const PW = 230, PH = 232;
/* 1 - the cuprate's C-Cu bond pair goes to the beta carbon. */
function stageAdd(ox, oy) {
  let s = panel(ox, oy, PW, PH, { kind: 'hi' }) + tag(ox + PW / 2, oy + 20, '1 · a methyl moves to β');
  const c = P(ox + 122, oy + 96);
  const r = sixRing(c, { form: 'enone' });
  s += r.s;
  const v = r.v;
  s += tag(v[5].x - 14, v[5].y - 6, 'α') + tag(v[4].x - 16, v[4].y + 4, 'β');
  const Me = A(ox + 50, oy + 176, 'H₃C'), Cu = A(ox + 114, oy + 176, 'Cu⁻', 'plain', 16), Me2 = A(ox + 178, oy + 176, 'CH₃');
  s += bd(Me, Cu) + bd(Cu, Me2) + draw(Me, Cu, Me2);
  s += tag(ox + 212, oy + 180, 'Li⁺');
  // the C-Cu bond pair to the beta carbon
  s += curve(P(mid(Me, Cu).x, Me.y - 5), P(v[4].x - 2, v[4].y + 6), { bow: -14, size: 7 });
  // the C=C pair moves to the alpha-C2 bond
  s += curve(mid(v[4], v[5]), mid(v[5], v[0]), { bow: 12, size: 7 });
  // the C=O pair onto oxygen
  s += curve(P(v[0].x + 3, v[0].y - 16), P(r.O.x + 12, r.O.y + 9), { bow: -9, size: 7 });
  s += tag(ox + PW / 2, oy + 218, 'three pairs move at once');
  return s;
}
/* 2 - the enolate, with the spent CH3Cu. */
function stageEnolate(ox, oy) {
  let s = panel(ox, oy, PW, PH, { kind: 'warn' }) + tag(ox + PW / 2, oy + 20, '2 · the flask holds an enolate');
  const c = P(ox + 130, oy + 96);
  const r = sixRing(c, { form: 'enolate' });
  s += r.s;
  s += tag(r.v[5].x - 14, r.v[5].y - 6, 'α');
  s += warn(r.O.x + 34, r.O.y + 4, 'Li⁺', { anchor: 'start' });
  s += tag(ox + PW / 2, oy + 180, '+ CH₃Cu (left over)');
  s += tag(ox + PW / 2, oy + 218, 'C=C now between α and C2');
  return s;
}
/* 3 - workup puts a proton on the alpha carbon. */
function stageKetone(ox, oy) {
  let s = panel(ox, oy, PW, PH, { kind: 'good' }) + tag(ox + PW / 2, oy + 20, '3 · workup gives the ketone');
  const c = P(ox + 130, oy + 96);
  const r = sixRing(c, { form: 'ketone' });
  s += r.s;
  const H = A(r.v[5].x - 24, r.v[5].y - 14, 'H', 'warn', 11);
  s += bd(r.v[5], H) + draw(H);
  s += tag(H.x - 4, H.y - 18, 'new H on α');
  s += tag(ox + PW / 2, oy + 180, '3-methylcyclohexan-1-one');
  s += tag(ox + PW / 2, oy + 218, 'the C=O is back');
  return s;
}

FIGURES.push({
  id: 'conjugate-addition-enolate',
  section: 'gilman-reagents',
  anchor: '<!-- fig:conjugate-addition-enolate:start -->',
  viewBox: '0 0 760 244',
  alt: 'Three frames. 1: cyclohex-2-en-1-one above the dimethylcuprate ion, H3C–Cu(minus)–CH3 with Li+. One curved arrow takes the electrons of a C–Cu bond to the beta carbon, a second moves the C=C electrons to the bond between the alpha carbon and the carbonyl carbon, and a third moves the C=O electrons onto oxygen. 2: the enolate, with O minus (Li+ beside it), a C=C between the alpha carbon and the former carbonyl carbon, and the new CH3 on the beta carbon; CH3Cu is left over. 3: after H3O+ workup, 3-methylcyclohexan-1-one, with the C=O back and a new H on the alpha carbon.',
  build() {
    let s = stageAdd(6, 6) + stageEnolate(265, 6) + stageKetone(524, 6);
    s += right(122, 240, 259);
    s += right(122, 499, 518);
    s += tag(509, 110, 'H₃O⁺');
    return s;
  },
  caption: 'Frame 1: follow each arrow from a bond to where its electrons end up. Frame 2 is what sits in the flask before workup.',
});

FIGURES.push({
  id: 'l-conjugate-addition',
  lessons: ['gilman-reagents'],
  viewBox: '0 0 340 752',
  alt: 'Three stacked frames. 1: the dimethylcuprate ion gives a methyl to the beta carbon of cyclohex-2-en-1-one; arrows move the C=C electrons to the alpha–C2 bond and the C=O electrons onto oxygen. 2: the enolate, O minus with a C=C between the alpha carbon and the former carbonyl carbon, CH3 on beta, and CH3Cu left over. 3: after H3O+, 3-methylcyclohexan-1-one, with a new H on the alpha carbon.',
  build() {
    let s = stageAdd(55, 4) + down(170, 240, 258) + stageEnolate(55, 262) + down(170, 498, 516) + stageKetone(55, 520);
    s += tag(180, 511, 'H₃O⁺', { anchor: 'start' });
    return s;
  },
  caption: 'Follow each arrow in frame 1. Frame 2 is what the flask holds before workup.',
});

/* ============================ acyl chloride: one addition, then stop === */
/* Butanoyl chloride, drawn skeletal: C4-C3-C2 chain with C1 carrying =O and Cl. */
function acylRow(ox, oy, which) {
  let s = '';
  const o = (x, y) => P(ox + x, oy + y);
  // substrate
  const p = [o(14, 70), o(40, 55), o(66, 70), o(92, 55)];
  for (let i = 0; i < 3; i++) s += bond(p[i], p[i + 1], { rFrom: 0, rTo: 0 });
  const O = A(p[3].x, p[3].y - 30, 'O', 'plain', 11), Cl = A(p[3].x + 28, p[3].y + 16, 'Cl', 'plain', 12);
  s += bd(p[3], O, { order: 2 }) + bd(p[3], Cl) + draw(O, Cl);
  // reagent + arrow
  s += right(62, 132, 196);
  s += tag(164, 48, which === 'cu' ? '(CH₃)₂CuLi' : 'CH₃MgBr');
  s += mut(164, 82, which === 'cu' ? '−78 °C' : 'excess, then H₃O⁺');
  // product
  const q = [o(206, 70), o(232, 55), o(258, 70), o(284, 55)];
  for (let i = 0; i < 3; i++) s += bond(q[i], q[i + 1], { rFrom: 0, rTo: 0 });
  if (which === 'cu') {
    const O2 = A(q[3].x, q[3].y - 30, 'O', 'plain', 11);
    const Me = P(q[3].x + 26, q[3].y + 15);
    s += bd(q[3], O2, { order: 2 }) + draw(O2) + bond(q[3], Me, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
  } else {
    const OH = A(q[3].x, q[3].y - 30, 'OH', 'plain', 13);
    const Me1 = P(q[3].x + 26, q[3].y + 15), Me2 = P(q[3].x + 30, q[3].y - 8);
    s += bd(q[3], OH) + draw(OH) + bond(q[3], Me1, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' }) + bond(q[3], Me2, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
  }
  return s;
}

FIGURES.push({
  id: 'acyl-chloride-stop',
  section: 'gilman-reagents',
  lessons: ['gilman-reagents'],
  anchor: '<!-- fig:acyl-chloride-stop:start -->',
  viewBox: '0 0 340 290',
  alt: 'Two rows, both starting from butanoyl chloride, a four-carbon chain whose end carbon carries a C=O and a Cl. Top: with (CH3)2CuLi at minus 78 degrees the Cl is replaced by one methyl, giving pentan-2-one, a ketone; one new bond is colored. Bottom: with excess CH3MgBr, then H3O+, two methyls add to that carbon and an OH replaces the oxygen, giving 2-methylpentan-2-ol; two new bonds are colored.',
  build() {
    let s = panel(2, 2, 336, 138, { kind: 'good' }) + tag(170, 22, 'cuprate: one methyl, and it stops');
    s += acylRow(12, 20, 'cu') + good(262, 124, 'pentan-2-one');
    s += panel(2, 150, 336, 138) + tag(170, 170, 'Grignard: two methyls');
    s += acylRow(12, 168, 'mg') + tag(262, 272, '2-methylpentan-2-ol');
    return s;
  },
  caption: 'Butanoyl chloride with each reagent. Count the colored bonds in each product.',
});

/* ===================================== epoxide opening by a cuprate ==== */
FIGURES.push({
  id: 'cuprate-epoxide',
  section: 'gilman-reagents',
  anchor: '<!-- fig:cuprate-epoxide:start -->',
  viewBox: '0 0 340 176',
  alt: 'Left: 2-methyloxirane, a three-membered ring of two carbons and an oxygen, with a CH3 on one ring carbon. Below it, the dimethylcuprate ion. One arrow takes the electrons of a C–Cu bond to the unsubstituted CH2 carbon of the ring; a second moves the electrons of that carbon’s C–O bond onto oxygen. Right: after H3O+, butan-2-ol, with the new C–C bond colored and the OH on the carbon that carried the methyl.',
  build() {
    let s = panel(2, 2, 336, 172);
    const Ox = A(92, 36, 'O', 'plain', 11);
    const Cs = P(62, 78), Cu2 = P(122, 78), Me = P(36, 64);   // Cs: substituted carbon; Cu2: the CH2
    s += bond(Cs, Cu2, { rFrom: 0, rTo: 0 }) + bd(Cs, Ox) + bd(Cu2, Ox) + bond(Cs, Me, { rFrom: 0, rTo: 0 }) + draw(Ox);
    s += tag(136, 94, 'CH₂', { anchor: 'start' });
    const M1 = A(40, 146, 'H₃C'), Cu = A(104, 146, 'Cu⁻', 'plain', 16), M2 = A(168, 146, 'CH₃');
    s += bd(M1, Cu) + bd(Cu, M2) + draw(M1, Cu, M2);
    s += curve(P(mid(M1, Cu).x, M1.y - 5), P(Cu2.x + 2, Cu2.y + 7), { bow: -24, size: 7 });
    s += curve(mid(Cu2, Ox), P(Ox.x + 13, Ox.y + 2), { bow: 9, size: 7 });
    s += tag(96, 118, 'less hindered carbon');
    s += right(80, 196, 232) + tag(214, 68, 'H₃O⁺');
    // butan-2-ol: C1-C2(OH)-C3-C4, drawn so the new bond C3-C4 is colored
    const b1 = P(246, 90), b2 = P(270, 76), b3 = P(294, 90), b4 = P(318, 76);
    const OH = A(270, 46, 'OH', 'plain', 13);
    s += bond(b1, b2, { rFrom: 0, rTo: 0 }) + bond(b2, b3, { rFrom: 0, rTo: 0 }) + bond(b3, b4, { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
    s += bd(b2, OH) + draw(OH);
    s += tag(282, 120, 'butan-2-ol');
    return s;
  },
  caption: '2-Methyloxirane with lithium dimethylcuprate. The colored bond is the new C–C bond.',
});

/* ============================ coupling at an sp2 carbon ================ */
function sn2Blocked(ox, oy) {
  let s = panel(ox, oy, 336, 150, { kind: 'warn' }) + tag(ox + 168, oy + 20, 'S', { anchor: 'end' });
  s = panel(ox, oy, 336, 150, { kind: 'warn' }) + tag(ox + 168, oy + 20, 'SN2 needs a path from behind the C–Br bond');
  // bromobenzene with the ring on the left and Br on the right
  const c = P(ox + 110, oy + 84), R = 30;
  const v = [0, 1, 2, 3, 4, 5].map((i) => polar(c, i * 60, R)); // v0 at the right
  for (let i = 0; i < 6; i++) {
    const a = v[i], b = v[(i + 1) % 6];
    s += i % 2 === 0 ? ringDouble(a, b, c, { inset: 7, gap: 4.6 }) : bond(a, b, { rFrom: 0, rTo: 0 });
  }
  const Br = A(v[0].x + 38, v[0].y, 'Br', 'plain', 13);
  s += bd(v[0], Br) + draw(Br);
  // the backside path: from far left, straight through the ring centre, toward v0
  s += `<line class="fg-dash-hi" x1="${ox + 22}" y1="${c.y}" x2="${v[0].x - 8}" y2="${c.y}"></line>`;
  s += `<path class="fg-head" d="M${v[0].x - 4} ${c.y} L${v[0].x - 12} ${c.y - 4} L${v[0].x - 12} ${c.y + 4} Z"></path>`;
  s += warn(ox + 110, oy + 136, 'the path runs through the ring');
  s += tag(ox + 268, oy + 110, 'no backside', { anchor: 'middle' });
  s += tag(ox + 268, oy + 126, 'to reach', { anchor: 'middle' });
  return s;
}
function vinylCouple(ox, oy) {
  let s = panel(ox, oy, 336, 170, { kind: 'good' }) + tag(ox + 168, oy + 20, 'a cuprate couples, and E stays E');
  // (E)-1-bromoprop-1-ene: CH3-CH=CH-Br, trans
  const a1 = P(ox + 20, oy + 70), a2 = P(ox + 44, oy + 84), a3 = P(ox + 68, oy + 70);
  const Br = A(ox + 92, oy + 84, 'Br', 'plain', 13);
  s += bond(a1, a2, { rFrom: 0, rTo: 0 }) + bond(a2, a3, { rFrom: 0, rTo: 0, order: 2, gap: 2.4 }) + bd(a3, Br) + draw(Br);
  s += tag(ox + 56, oy + 118, '(E)-1-bromo-');
  s += tag(ox + 56, oy + 132, 'prop-1-ene');
  s += right(oy + 78, ox + 116, ox + 176);
  s += tag(ox + 146, oy + 66, '(C₄H₉)₂CuLi');
  // (E)-hept-2-ene: CH3-CH=CH-CH2CH2CH2CH3, trans
  const b = [P(ox + 188, oy + 70), P(ox + 210, oy + 84), P(ox + 232, oy + 70), P(ox + 254, oy + 84), P(ox + 276, oy + 70), P(ox + 298, oy + 84), P(ox + 320, oy + 70)];
  s += bond(b[0], b[1], { rFrom: 0, rTo: 0 }) + bond(b[1], b[2], { rFrom: 0, rTo: 0, order: 2, gap: 2.4 });
  s += bond(b[2], b[3], { rFrom: 0, rTo: 0, cls: 'fg-bond-hi' });
  for (let i = 3; i < 6; i++) s += bond(b[i], b[i + 1], { rFrom: 0, rTo: 0 });
  s += tag(ox + 254, oy + 118, '(E)-hept-2-ene');
  s += good(ox + 168, oy + 156, 'the new bond sits where Br was');
  return s;
}

FIGURES.push({
  id: 'vinyl-coupling',
  section: 'gilman-reagents',
  lessons: ['gilman-reagents'],
  anchor: '<!-- fig:vinyl-coupling:start -->',
  viewBox: '0 0 340 332',
  alt: 'Top: bromobenzene. A dashed arrow shows where an SN2 nucleophile would have to come from, directly opposite the C–Br bond: that path runs through the middle of the ring, so there is no backside to reach. Bottom: (E)-1-bromoprop-1-ene with lithium dibutylcuprate gives (E)-hept-2-ene. The new C–C bond, colored, sits where the C–Br bond was, and the two chain ends stay on opposite sides of the C=C.',
  build() {
    return sn2Blocked(2, 2) + vinylCouple(2, 160);
  },
  caption: 'Top: the dashed line is the backside path an S<sub>N</sub>2 would need. Bottom: compare the C=C geometry before and after.',
});

export default FIGURES;
