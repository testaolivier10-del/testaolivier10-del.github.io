/* Figures for the aldol notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Most drawings are panels 340 wide whose labels are all fg-lbl or fg-tag,
   so one panel can sit in a notes figure (two panels to a row) and in a
   lesson figure (panels stacked in one 340-wide column, id prefix l-).
   Each panel is a function of its top-left corner.

   The base mechanism uses one pair throughout: acetaldehyde with itself,
   every atom labelled, so each curved arrow starts at a named lone pair or
   bond and ends at a named atom or bond. The acid mechanism uses acetone,
   so it ends at mesityl oxide, the product the lesson's challenge asks for. */
import { atom, bond, arrow, curve, lonePair, text, tag, panel, rule, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];
const PW = 340;                       // panel width
const GAP = 40;                       // gap between two panels in a notes row

/* ------------------------------------------------------------ helpers --- */
const rad = (l) => (l === 'H' ? 12 : l.length <= 2 ? 14 : 4 + l.length * 3.8);
/* A labelled atom: {x, y, l, k, r}. */
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
/* Point on an atom's circle, `gap` px outside it, in direction deg. */
const edge = (a, deg, gap = 3) => lpAt(a, deg, gap);
const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
/* Text that may carry an italic tspan. */
const rich = (x, y, html, cls = 'fg-tag') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" font-size="${cls === 'fg-lbl' ? 12.5 : 11}">${html}</text>`;
/* Every panel: a box, a title tag at the top and up to two tag lines at
   the bottom. A line is a string, or [html, cls] for rich text. */
function frameP(ox, oy, h, title, lines = [], kind) {
  let s = panel(ox, oy, PW, h, kind ? { kind } : {});
  s += rich(ox + PW / 2, oy + 20, title);
  lines.forEach((ln, i) => {
    const [t, cls] = Array.isArray(ln) ? ln : [ln, 'fg-tag'];
    s += rich(ox + PW / 2, oy + h - 14 - (lines.length - 1 - i) * 17, t, cls);
  });
  return s;
}
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 7 });
const right = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { size: 7 });
const plusT = (x, y) => text(x, y, '+', { cls: 'fg-lbl' });

/* Stack panels for a lesson: each entry is [panelFn, height]; a short
   arrow joins consecutive panels. Returns { svg, h }. */
function stack(parts, gap = 26, arrows = true) {
  let s = '', y = 0;
  parts.forEach(([fn, h], i) => {
    s += fn(0, y);
    if (arrows && i < parts.length - 1) s += down(PW / 2, y + h + 3, y + h + gap - 3);
    y += h + gap;
  });
  return { svg: s, h: y - gap };
}
const stackH = (parts, gap = 26) => parts.reduce((t, [, h]) => t + h, 0) + gap * (parts.length - 1);

/* ============================================ the base-catalyzed aldol === */
const H_M = 250;

/* 1: hydroxide takes an alpha hydrogen from acetaldehyde. */
function pDeprot(ox, oy) {
  const Ca = A(ox + 104, oy + 128, 'CH₂', 'hi'), Ha = A(ox + 104, oy + 184, 'H', 'warn'),
        C1 = A(ox + 166, oy + 96, 'CH'), O = A(ox + 228, oy + 128, 'O'),
        B = A(ox + 214, oy + 184, 'HO⁻');
  let s = frameP(ox, oy, H_M, '1 · HO⁻ takes an α hydrogen', ['the enolate forms, and HO⁻ becomes H₂O']);
  s += bd(Ca, C1) + bd(C1, O, { order: 2 }) + bd(Ca, Ha, { cls: 'fg-bond-hi' });
  s += lp(B, 180);
  s += draw(Ca, Ha, C1, O, B);
  s += tag(ox + 70, oy + 132, 'α');
  s += curve(off(lpAt(B, 180), -3, 4), edge(Ha, 0, 4), { bow: -10 });
  s += curve(mid(Ca, Ha, 0.55), mid(Ca, C1, 0.6), { bow: 16 });
  s += curve(mid(C1, O, 0.45), edge(O, 270, 4), { bow: -16 });
  s += tag(ox + 60, oy + 60, 'acetaldehyde');
  return s;
}

/* 2: the enolate's C=C attacks a second acetaldehyde. */
function pAttack(ox, oy) {
  const C1 = A(ox + 58, oy + 112, 'CH'), Oe = A(ox + 58, oy + 62, 'O⁻', 'warn'), Ca = A(ox + 112, oy + 146, 'CH₂', 'hi'),
        Ce = A(ox + 236, oy + 146, 'CH', 'hi'), Oel = A(ox + 236, oy + 96, 'O'), Me = A(ox + 292, oy + 178, 'CH₃');
  let s = frameP(ox, oy, H_M, '2 · the enolate attacks a second CH₃CHO', ['the new C–C bond forms;', 'the charge moves to the attacked O']);
  s += bd(C1, Oe) + bd(C1, Ca, { order: 2 }) + bd(Ce, Oel, { order: 2 }) + bd(Ce, Me);
  s += lp(Oe, 180) + lp(Oe, 270) + lp(Oe, 0);
  s += draw(C1, Oe, Ca, Ce, Oel, Me);
  s += curve(off(lpAt(Oe, 0), 3, 5), mid(C1, Oe, 0.5), { bow: 12 });
  s += curve(mid(C1, Ca, 0.5), edge(Ce, 180, 4), { bow: -40 });
  s += curve(mid(Ce, Oel, 0.5), edge(Oel, 10, 4), { bow: 14 });
  s += tag(ox + 236, oy + 58, 'a second acetaldehyde');
  return s;
}

/* 3: water protonates the alkoxide. */
function pProton(ox, oy) {
  const Me = A(ox + 42, oy + 164, 'CH₃'), Cb = A(ox + 96, oy + 134, 'CH', 'hi'), Om = A(ox + 96, oy + 84, 'O⁻', 'warn'),
        Ca = A(ox + 150, oy + 164, 'CH₂'), C1 = A(ox + 204, oy + 134, 'CH'), O1 = A(ox + 258, oy + 164, 'O'),
        Hw = A(ox + 172, oy + 70, 'H', 'warn'), Ow = A(ox + 236, oy + 70, 'OH');
  let s = frameP(ox, oy, H_M, '3 · water protonates the alkoxide', [['3-hydroxybutanal + HO⁻', 'fg-tag-good'], 'the base comes back']);
  s += bd(Me, Cb) + bd(Cb, Om) + bd(Cb, Ca) + bd(Ca, C1) + bd(C1, O1, { order: 2 }) + bd(Hw, Ow, { cls: 'fg-bond-hi' });
  s += lp(Om, 180) + lp(Om, 270) + lp(Om, 0);
  s += draw(Me, Cb, Om, Ca, C1, O1, Hw, Ow);
  s += curve(off(lpAt(Om, 0), 3, -3), edge(Hw, 180, 4), { bow: -10 });
  s += curve(mid(Hw, Ow, 0.5), edge(Ow, 250, 4), { bow: -12 });
  return s;
}

/* The product, numbered from the surviving carbonyl. Used as the fourth
   notes panel and inside the lesson overview. */
function productNumbered(ox, oy) {
  const C4 = A(ox + 50, oy + 30, 'CH₃'), C3 = A(ox + 116, oy + 0, 'CH', 'hi'), OH = A(ox + 116, oy - 50, 'OH'),
        C2 = A(ox + 182, oy + 30, 'CH₂', 'hi'), C1 = A(ox + 248, oy + 0, 'CH'), O = A(ox + 248, oy - 50, 'O');
  let s = bd(C4, C3) + bd(C3, OH) + bd(C3, C2, { cls: 'fg-bond-hi' }) + bd(C2, C1) + bd(C1, O, { order: 2 });
  s += draw(C4, C3, OH, C2, C1, O);
  s += tag(C4.x, oy + 64, 'C4');
  s += tag(C3.x, oy + 36, 'C3 · β');
  s += tag(C2.x, oy + 64, 'C2 · α');
  s += tag(C1.x, oy + 36, 'C1');
  return s;
}

function pProduct(ox, oy) {
  let s = frameP(ox, oy, H_M, '4 · the aldol: 3-hydroxybutanal',
    [['new bond: C2–C3 (highlighted)', 'fg-tag-good'], ['the OH sits on C3, the β carbon', 'fg-tag-good']], 'good');
  s += productNumbered(ox + 6, oy + 118);
  return s;
}

FIGURES.push({
  id: 'aldol-mechanism',
  section: 'aldol',
  anchor: '<!-- fig:aldol-mechanism:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_M * 2 + GAP}`,
  alt: 'The aldol addition of acetaldehyde in four panels. 1: hydroxide takes a proton from the CH3 of acetaldehyde, and the C–H pair becomes the enolate C=C while the C=O pi pair moves onto oxygen. 2: the enolate O− pushes back down, and its C=C attacks the carbonyl carbon of a second acetaldehyde, whose pi pair moves onto its oxygen. 3: that alkoxide takes a proton from water. 4: the product, 3-hydroxybutanal, numbered C1 to C4, with the new C2–C3 bond highlighted and the OH on C3.',
  build() {
    let s = pDeprot(0, 0) + pAttack(PW + GAP, 0) + pProton(0, H_M + GAP) + pProduct(PW + GAP, H_M + GAP);
    s += right(PW + 6, PW + GAP - 6, H_M / 2);
    s += right(PW + 6, PW + GAP - 6, H_M + GAP + H_M / 2);
    s += arrow(P(PW + GAP / 2 + 60, H_M + 4), P(PW / 2 + 40, H_M + GAP - 4), { size: 7 });
    return s;
  },
  caption: 'Read the panels in order. Every curved arrow starts at a lone pair or a bond, and the highlighted atoms in panels 2 and 4 are the two carbons that end up bonded.',
});

FIGURES.push({
  id: 'l-aldol-mechanism',
  lessons: ['aldol'],
  viewBox: `0 0 ${PW} ${stackH([[0, H_M], [0, H_M], [0, H_M]])}`,
  alt: 'The aldol addition of acetaldehyde in three stacked panels: hydroxide takes an alpha hydrogen to make the enolate; the enolate C=C attacks the carbonyl carbon of a second acetaldehyde; water protonates the alkoxide, giving 3-hydroxybutanal and hydroxide back.',
  build() {
    return stack([[pDeprot, H_M], [pAttack, H_M], [pProton, H_M]]).svg;
  },
  caption: 'Three steps: take an α H, attack, protonate. Each arrow starts at electrons.',
});

/* The lesson's first picture: which two carbons join, and where the OH ends up. */
const H_OV = 372;
function pOverview(ox, oy) {
  const C1 = A(ox + 56, oy + 96, 'CH'), Oe = A(ox + 56, oy + 48, 'O⁻', 'warn'), Ca = A(ox + 110, oy + 126, 'CH₂', 'hi'),
        Ce = A(ox + 226, oy + 126, 'CH', 'hi'), Oel = A(ox + 226, oy + 78, 'O'), Me = A(ox + 282, oy + 96, 'CH₃');
  let s = frameP(ox, oy, H_OV, 'enolate + a second acetaldehyde',
    [['the OH lands on C3, the β carbon', 'fg-tag-good']], 'good');
  s += bd(C1, Oe) + bd(C1, Ca, { order: 2 }) + bd(Ce, Oel, { order: 2 }) + bd(Ce, Me);
  s += bond(edge(Ca, 0, 2), edge(Ce, 180, 2), { rFrom: 0, rTo: 0, cls: 'fg-dash-hi' });
  s += draw(C1, Oe, Ca, Ce, Oel, Me);
  s += tag(ox + 168, oy + 152, 'the new C–C bond');
  s += tag(ox + 84, oy + 150, 'α');
  s += down(ox + 170, oy + 172, oy + 200);
  s += productNumbered(ox + 6, oy + 268);
  return s;
}

FIGURES.push({
  id: 'l-aldol-overview',
  lessons: ['aldol'],
  viewBox: `0 0 ${PW} ${H_OV}`,
  alt: 'The enolate of acetaldehyde and a second acetaldehyde, with a dashed line joining the enolate alpha carbon to the other carbonyl carbon, then the product 3-hydroxybutanal numbered C1 to C4 with the OH on C3.',
  build() { return pOverview(0, 0); },
  caption: 'The dashed line is the only new bond. Count from the C=O that survives: the OH sits two carbons along.',
});

/* ================================================ E1cb dehydration ===== */
const H_E = 270, H_E3 = 220;

function chainE(ox, oy, enol) {
  const Me = A(ox + 38, oy + 164, 'CH₃'), Cb = A(ox + 92, oy + 134, 'CH'), OH = A(ox + 92, oy + 84, 'OH'),
        Ca = A(ox + 146, oy + 164, 'CH', 'hi'), C1 = A(ox + 200, oy + 134, 'CH'),
        O = A(ox + 254, oy + 164, enol ? 'O⁻' : 'O', enol ? 'warn' : undefined);
  return { Me, Cb, OH, Ca, C1, O };
}

function pE1(ox, oy) {
  const { Me, Cb, OH, Ca, C1, O } = chainE(ox, oy, false);
  const Ha = A(ox + 146, oy + 216, 'H', 'warn'), B = A(ox + 250, oy + 216, 'HO⁻');
  let s = frameP(ox, oy, H_E, '1 · HO⁻ takes the α hydrogen', ['an enolate that still carries the β-OH']);
  s += bd(Me, Cb) + bd(Cb, OH) + bd(Cb, Ca) + bd(Ca, C1) + bd(C1, O, { order: 2 }) + bd(Ca, Ha, { cls: 'fg-bond-hi' });
  s += lp(B, 180);
  s += draw(Me, Cb, OH, Ca, C1, O, Ha, B);
  s += tag(ox + 66, oy + 128, 'β');
  s += tag(ox + 120, oy + 200, 'α');
  s += curve(off(lpAt(B, 180), -3, 4), edge(Ha, 0, 4), { bow: -10 });
  s += curve(mid(Ca, Ha, 0.55), mid(Ca, C1, 0.62), { bow: 16 });
  s += curve(mid(C1, O, 0.45), edge(O, 270, 4), { bow: -16 });
  s += tag(ox + 170, oy + 50, '3-hydroxybutanal');
  return s;
}

function pE2(ox, oy) {
  const { Me, Cb, OH, Ca, C1, O } = chainE(ox, oy, true);
  let s = frameP(ox, oy, H_E, '2 · the enolate pushes out HO⁻', ['the C=C moves over to Cα=Cβ;', 'the C–OH pair leaves as HO⁻']);
  s += bd(Me, Cb) + bd(Cb, OH, { cls: 'fg-bond-hi' }) + bd(Cb, Ca) + bd(Ca, C1, { order: 2 }) + bd(C1, O);
  s += lp(O, 0) + lp(O, 90) + lp(O, 270);
  s += draw(Me, Cb, OH, Ca, C1, O);
  s += tag(ox + 66, oy + 128, 'β');
  s += tag(ox + 146, oy + 200, 'α');
  s += curve(off(lpAt(O, 270), -5, 0), mid(C1, O, 0.5), { bow: -10 });
  s += curve(mid(Ca, C1, 0.5), mid(Cb, Ca, 0.5), { bow: 20 });
  s += curve(mid(Cb, OH, 0.5), edge(OH, 180, 4), { bow: -12 });
  return s;
}

function pE3(ox, oy) {
  const Me = A(ox + 50, oy + 124, 'CH₃'), C3 = A(ox + 110, oy + 94, 'CH', 'hi'), C2 = A(ox + 170, oy + 124, 'CH', 'hi'),
        C1 = A(ox + 230, oy + 94, 'CH'), O = A(ox + 290, oy + 124, 'O');
  let s = frameP(ox, oy, H_E3, '3 · the product: an enone', [[`(${it('E')})-but-2-enal + HO⁻`, 'fg-tag-good'], 'the new C=C is conjugated with the C=O'], 'good');
  s += bd(Me, C3) + bd(C3, C2, { order: 2, cls: 'fg-bond-hi' }) + bd(C2, C1) + bd(C1, O, { order: 2 });
  s += draw(Me, C3, C2, C1, O);
  s += tag(C3.x, oy + 60, 'Cβ');
  s += tag(C2.x, oy + 158, 'Cα');
  return s;
}

FIGURES.push({
  id: 'e1cb-dehydration',
  section: 'aldol',
  anchor: '<!-- fig:e1cb-dehydration:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_E + GAP + H_E3}`,
  alt: 'E1cb dehydration of 3-hydroxybutanal. Panel 1: hydroxide removes the hydrogen on the alpha carbon; the C–H pair becomes a C=C and the C=O pi pair moves onto oxygen, giving an enolate. Panel 2: the O− lone pair reforms the C=O, the C=C pair moves to make the alpha–beta double bond, and the C–OH bond breaks so hydroxide leaves from the beta carbon. Panel 3: the product, (E)-but-2-enal, with the new C=C conjugated with the C=O, plus hydroxide.',
  build() {
    let s = pE1(0, 0) + pE2(PW + GAP, 0) + pE3((PW * 2 + GAP - PW) / 2, H_E + GAP);
    s += right(PW + 6, PW + GAP - 6, H_E / 2);
    s += arrow(P(PW + GAP + PW / 2, H_E + 4), P(PW + GAP / 2 + 60, H_E + GAP - 4), { size: 7 });
    return s;
  },
  caption: 'Two separate steps. Panel 1 removes the proton from the α carbon; panel 2 loses HO⁻ from the β carbon, so the new C=C always lands between Cα and Cβ.',
});

FIGURES.push({
  id: 'l-e1cb',
  lessons: ['aldol'],
  viewBox: `0 0 ${PW} ${stackH([[0, H_E], [0, H_E], [0, H_E3]])}`,
  alt: 'E1cb dehydration in three stacked panels: hydroxide takes the alpha hydrogen of 3-hydroxybutanal to give an enolate; the enolate reforms its C=O and pushes hydroxide off the beta carbon; the product is (E)-but-2-enal, with the new C=C conjugated with the C=O.',
  build() {
    return stack([[pE1, H_E], [pE2, H_E], [pE3, H_E3]]).svg;
  },
  caption: 'The H leaves from Cα first; the OH leaves from Cβ second. The new C=C sits between them.',
});

/* ============================================= the retro-aldol reading === */
FIGURES.push({
  id: 'retro-aldol-disconnection',
  section: 'aldol',
  anchor: '<!-- fig:retro-aldol-disconnection:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${230 + GAP + 210}`,
  alt: 'Reading 4-phenylbut-3-en-2-one backwards. Panel 1: the target Ph–CH=CH–CO–CH3 with the alpha and beta carbons marked. Panel 2: water put back, giving Ph–CH(OH)–CH2–CO–CH3, with a dashed line cutting the alpha–beta bond. Panel 3: the two partners, acetone (the alpha side, which was the nucleophile) and benzaldehyde (the beta side, which was the electrophile).',
  build() {
    let s = '';
    // Panel 1: the target
    {
      const ox = 0, oy = 0;
      s += frameP(ox, oy, 230, 'target: 4-phenylbut-3-en-2-one', ['the C=C is conjugated with the C=O']);
      const Ph = A(ox + 44, oy + 136, 'Ph'), Cb = A(ox + 104, oy + 106, 'CH', 'hi'), Ca = A(ox + 164, oy + 136, 'CH', 'hi'),
            C2 = A(ox + 224, oy + 106, 'C'), O = A(ox + 224, oy + 58, 'O'), Me = A(ox + 284, oy + 136, 'CH₃');
      s += bd(Ph, Cb) + bd(Cb, Ca, { order: 2 }) + bd(Ca, C2) + bd(C2, O, { order: 2 }) + bd(C2, Me);
      s += draw(Ph, Cb, Ca, C2, O, Me);
      s += tag(Cb.x, oy + 76, 'β');
      s += tag(Ca.x, oy + 170, 'α');
    }
    s += right(PW + 6, PW + GAP - 6, 115);
    // Panel 2: water back, and the cut
    {
      const ox = PW + GAP, oy = 0;
      s += frameP(ox, oy, 230, '1 · put the water back', [['then cut the α–β bond (dashed)', 'fg-tag-warn']], 'warn');
      const Ph = A(ox + 44, oy + 136, 'Ph'), Cb = A(ox + 104, oy + 106, 'CH', 'hi'), OH = A(ox + 104, oy + 58, 'OH'),
            Ca = A(ox + 164, oy + 136, 'CH₂', 'hi'), C2 = A(ox + 224, oy + 106, 'C'), O = A(ox + 224, oy + 58, 'O'),
            Me = A(ox + 284, oy + 136, 'CH₃');
      s += bd(Ph, Cb) + bd(Cb, OH) + bd(Cb, Ca) + bd(Ca, C2) + bd(C2, O, { order: 2 }) + bd(C2, Me);
      s += draw(Ph, Cb, OH, Ca, C2, O, Me);
      const m = mid(Cb, Ca);
      s += bond(off(m, 10, -20), off(m, -10, 20), { rFrom: 0, rTo: 0, cls: 'fg-dash-hi' });
      s += tag(Cb.x - 30, oy + 90, 'β');
      s += tag(Ca.x, oy + 172, 'α');
    }
    s += arrow(P(PW + GAP + PW / 2, 234), P(PW + GAP / 2 + 60, 230 + GAP - 4), { size: 7 });
    // Panel 3: the partners, full width
    {
      const ox = 0, oy = 230 + GAP, w = PW * 2 + GAP;
      s += panel(ox, oy, w, 210, { kind: 'good' });
      s += tag(w / 2, oy + 20, '2 · each side gets a C=O back');
      // acetone drawn as a V: CH3–C(=O)–CH3
      const L = A(ox + 70, oy + 116, 'CH₃', 'hi'), Cc = A(ox + 130, oy + 86, 'C'), Oc = A(ox + 130, oy + 40 + 6, 'O'), R = A(ox + 190, oy + 116, 'CH₃');
      s += bd(L, Cc) + bd(Cc, Oc, { order: 2 }) + bd(Cc, R) + draw(L, Cc, Oc, R);
      s += tag(ox + 130, oy + 150, 'acetone: the α side');
      s += tag(ox + 130, oy + 168, 'it gave the enolate, so it was');
      s += tag(ox + 130, oy + 186, 'the nucleophile', { cls: 'fg-tag-good' });
      s += plusT(ox + 300, oy + 104);
      const Ph = A(ox + 440, oy + 116, 'Ph'), Cd = A(ox + 500, oy + 86, 'CH', 'hi'), Od = A(ox + 560, oy + 116, 'O');
      s += bd(Ph, Cd) + bd(Cd, Od, { order: 2 }) + draw(Ph, Cd, Od);
      s += tag(ox + 500, oy + 150, 'benzaldehyde: the β side');
      s += tag(ox + 500, oy + 168, 'its C=O carbon was attacked, so it was');
      s += tag(ox + 500, oy + 186, 'the electrophile', { cls: 'fg-tag-good' });
    }
    return s;
  },
  caption: 'Read the panels in order: the target, the water put back, then the two partners. The highlighted carbons are the pair the aldol joined. The CH₃ highlighted in acetone is the one that became the CH₂ of the product.',
});

/* ==================================================== crossed aldols ==== */
/* Skeletal products, drawn around (0, 0) at bond length 26. Each entry
   lists vertices, bonds [i, j, order, hi] and heteroatom labels. The
   new C–C bond is the highlighted one. */
const W = 22.5, Hh = 13;
const PRODUCTS = {
  // acetone enolate + acetone: 4-hydroxy-4-methylpentan-2-one
  aa: {
    v: [[0, Hh], [W, 0], [2 * W, Hh], [3 * W, 0], [4 * W, Hh], [W, -26], [3 * W, -26], [3 * W, 26]],
    b: [[0, 1], [1, 2], [2, 3, 1, true], [3, 4], [1, 5, 2], [3, 6], [3, 7]],
    lab: { 5: 'O', 6: 'OH' },
    name: '4-hydroxy-4-methylpentan-2-one',
  },
  // acetone enolate + propanal: 4-hydroxyhexan-2-one
  ap: {
    v: [[0, Hh], [W, 0], [2 * W, Hh], [3 * W, 0], [4 * W, Hh], [5 * W, 0], [W, -26], [3 * W, -26]],
    b: [[0, 1], [1, 2], [2, 3, 1, true], [3, 4], [4, 5], [1, 6, 2], [3, 7]],
    lab: { 6: 'O', 7: 'OH' },
    name: '4-hydroxyhexan-2-one',
  },
  // propanal enolate + acetone: 3-hydroxy-2,3-dimethylbutanal
  pa: {
    v: [[0, 0], [W, Hh], [2 * W, 0], [3 * W, Hh], [-W, -Hh], [W, Hh + 26], [2 * W - 13, -22.5], [3 * W, -Hh]],
    b: [[0, 1], [1, 2, 1, true], [2, 3], [0, 4, 2], [1, 5], [2, 6], [2, 7]],
    lab: { 4: 'O', 6: 'OH' },
    name: '3-hydroxy-2,3-dimethylbutanal',
  },
  // propanal enolate + propanal: 3-hydroxy-2-methylpentanal
  pp: {
    v: [[0, 0], [W, Hh], [2 * W, 0], [3 * W, Hh], [4 * W, 0], [-W, -Hh], [W, Hh + 26], [2 * W, -26]],
    b: [[0, 1], [1, 2, 1, true], [2, 3], [3, 4], [0, 5, 2], [1, 6], [2, 7]],
    lab: { 5: 'O', 7: 'OH' },
    name: '3-hydroxy-2-methylpentanal',
  },
};
function skel(key, cx, cy) {
  const p = PRODUCTS[key];
  const xs = p.v.map((v) => v[0]);
  const dx = cx - (Math.min(...xs) + Math.max(...xs)) / 2;
  const pts = p.v.map(([x, y]) => P(x + dx, y + cy));
  const r = (i) => (p.lab[i] ? (p.lab[i].length > 1 ? 11 : 8) : 0);
  let s = '';
  for (const [i, j, o = 1, hi] of p.b) {
    s += bond(pts[i], pts[j], { rFrom: r(i), rTo: r(j), order: o, gap: 3, cls: hi ? 'fg-bond-hi' : 'fg-bond' });
  }
  for (const [i, l] of Object.entries(p.lab)) {
    s += text(pts[i].x, pts[i].y + 4.5, l, { cls: 'fg-lbl', size: 12.5 });
  }
  return s;
}

FIGURES.push({
  id: 'crossed-aldol-grid',
  section: 'aldol',
  anchor: '<!-- fig:crossed-aldol-grid:start -->',
  viewBox: '0 0 760 330',
  alt: 'A two-by-two grid of the four aldol products from acetone and propanal with base. Rows: the enolate of acetone, the enolate of propanal. Columns: attacking acetone, attacking propanal. Products: 4-hydroxy-4-methylpentan-2-one, 4-hydroxyhexan-2-one, 3-hydroxy-2,3-dimethylbutanal and 3-hydroxy-2-methylpentanal, each with its new C–C bond highlighted.',
  build() {
    const x0 = 150, cw = 300, gap = 10, y0 = 44, ch = 132;
    let s = '';
    s += tag(x0 + cw / 2, 26, 'attacks acetone');
    s += tag(x0 + cw + gap + cw / 2, 26, 'attacks propanal');
    const rows = [['aa', 'ap', 'enolate of', 'acetone'], ['pa', 'pp', 'enolate of', 'propanal']];
    rows.forEach(([k1, k2, t1, t2], r) => {
      const y = y0 + r * (ch + gap);
      s += tag(72, y + ch / 2 - 4, t1);
      s += tag(72, y + ch / 2 + 13, t2);
      [k1, k2].forEach((k, c) => {
        const x = x0 + c * (cw + gap);
        s += panel(x, y, cw, ch, k === 'ap' ? { kind: 'good' } : {});
        s += skel(k, x + cw / 2, y + 62);
        s += tag(x + cw / 2, y + ch - 14, PRODUCTS[k].name);
      });
    });
    return s;
  },
  caption: 'One flask, four products. The highlighted bond in each is the one the aldol made. The green cell, acetone&rsquo;s enolate adding to propanal, is the one strategy 2 below can make on its own.',
});

FIGURES.push({
  id: 'l-crossed-grid',
  lessons: ['aldol'],
  viewBox: '0 0 340 290',
  alt: 'The four aldol products from acetone and propanal with base, in a two-by-two grid: the enolate of acetone attacking acetone or propanal (top row), and the enolate of propanal attacking acetone or propanal (bottom row). The new C–C bond is highlighted in each.',
  build() {
    const cw = 165, gap = 10, ch = 110;
    let s = '';
    const rows = [['aa', 'ap', 'acetone enolate attacks…'], ['pa', 'pp', 'propanal enolate attacks…']];
    let y = 0;
    rows.forEach(([k1, k2, t]) => {
      s += tag(170, y + 14, t);
      y += 24;
      [k1, k2].forEach((k, c) => {
        const x = c * (cw + gap);
        s += panel(x, y, cw, ch);
        s += tag(x + cw / 2, y + 16, c === 0 ? '…acetone' : '…propanal');
        s += skel(k, x + cw / 2, y + 66);
      });
      y += ch + 22;
    });
    return s;
  },
  caption: 'Two partners that can both enolize give four products. The highlighted bond in each is the new one.',
});

/* ============================================== the acid-catalyzed aldol = */
const H_AC = 260;

function pAcid1(ox, oy) {
  const Me = A(ox + 38, oy + 150, 'CH₃'), C = A(ox + 90, oy + 120, 'C'), O = A(ox + 90, oy + 70, 'OH'),
        Ca = A(ox + 140, oy + 150, 'CH₂', 'hi'),
        Ce = A(ox + 238, oy + 150, 'C', 'hi'), Op = A(ox + 238, oy + 98, 'OH⁺', 'warn'),
        M1 = A(ox + 296, oy + 150, 'CH₃'), M2 = A(ox + 238, oy + 204, 'CH₃');
  let s = frameP(ox, oy, H_AC, '1 · the enol attacks protonated acetone', ['the new C–C bond forms']);
  s += bd(Me, C) + bd(C, O) + bd(C, Ca, { order: 2 }) + bd(Ce, Op, { order: 2 }) + bd(Ce, M1) + bd(Ce, M2);
  s += lp(O, 0) + lp(O, 180);
  s += lp(Op, 0);
  s += draw(Me, C, O, Ca, Ce, Op, M1, M2);
  s += curve(off(lpAt(O, 0), 2, 6), mid(C, O, 0.5), { bow: 10 });
  s += curve(mid(C, Ca, 0.5), edge(Ce, 190, 4), { bow: -34 });
  s += curve(mid(Ce, Op, 0.5), edge(Op, 180, 4), { bow: -10 });
  s += tag(ox + 90, oy + 44, 'enol');
  s += tag(ox + 238, oy + 64, 'C=O made hungrier by H⁺');
  return s;
}

/* The C=OH+ that step 1 leaves, drawn with its O–H, and water taking that H. */
function pAcid2(ox, oy) {
  const Me = A(ox + 36, oy + 150, 'CH₃'), C = A(ox + 90, oy + 120, 'C'), Op = A(ox + 90, oy + 70, 'O⁺', 'warn'),
        H = A(ox + 140, oy + 50, 'H', 'warn'), W = A(ox + 204, oy + 50, 'H₂O'),
        Ca = A(ox + 144, oy + 150, 'CH₂'), Cb = A(ox + 198, oy + 120, 'C'), OH = A(ox + 250, oy + 96, 'OH'),
        M1 = A(ox + 198, oy + 172, 'CH₃'), M2 = A(ox + 256, oy + 150, 'CH₃');
  let s = frameP(ox, oy, H_AC, '2 · H₂O takes the proton from oxygen', [['4-hydroxy-4-methylpentan-2-one', 'fg-tag-good'], '+ H₃O⁺: the acid comes back']);
  s += bd(Me, C) + bd(C, Op, { order: 2 }) + bd(Op, H, { cls: 'fg-bond-hi' }) + bd(C, Ca) + bd(Ca, Cb, { cls: 'fg-bond-hi' });
  s += bd(Cb, OH) + bd(Cb, M1) + bd(Cb, M2);
  s += lp(Op, 180) + lp(W, 180);
  s += draw(Me, C, Op, H, W, Ca, Cb, OH, M1, M2);
  s += curve(off(lpAt(W, 180), -3, 4), edge(H, 20, 4), { bow: 10 });
  s += curve(mid(Op, H, 0.5), edge(Op, 270, 4), { bow: 10 });
  return s;
}

function pAcid3(ox, oy) {
  const Me = A(ox + 36, oy + 150, 'CH₃'), C = A(ox + 90, oy + 120, 'C'), O = A(ox + 90, oy + 70, 'OH'),
        Ca = A(ox + 144, oy + 150, 'CH', 'hi'), Cb = A(ox + 198, oy + 120, 'C', 'hi'), Ow = A(ox + 198, oy + 66, 'OH₂⁺', 'warn'),
        M1 = A(ox + 198, oy + 176, 'CH₃'), M2 = A(ox + 256, oy + 150, 'CH₃');
  let s = frameP(ox, oy, H_AC, '3 · heat: the enol pushes water off Cβ', ['first the enol re-forms and the OH', 'is protonated, so it leaves as H₂O']);
  s += bd(Me, C) + bd(C, O) + bd(C, Ca, { order: 2 }) + bd(Ca, Cb) + bd(Cb, Ow, { cls: 'fg-bond-hi' }) + bd(Cb, M1) + bd(Cb, M2);
  s += lp(O, 180) + lp(O, 0);
  s += draw(Me, C, O, Ca, Cb, Ow, M1, M2);
  s += curve(off(lpAt(O, 0), 2, 6), mid(C, O, 0.5), { bow: 10 });
  s += curve(mid(C, Ca, 0.5), mid(Ca, Cb, 0.5), { bow: -18 });
  s += curve(mid(Cb, Ow, 0.5), edge(Ow, 35, 4), { bow: -8 });
  s += tag(ox + 146, oy + 184, 'α');
  s += tag(ox + 226, oy + 120, 'β');
  return s;
}

function pAcid4(ox, oy) {
  const Me = A(ox + 50, oy + 140, 'CH₃'), C = A(ox + 106, oy + 110, 'C'), O = A(ox + 106, oy + 60, 'O'),
        Ca = A(ox + 162, oy + 140, 'CH', 'hi'), Cb = A(ox + 218, oy + 110, 'C', 'hi'),
        M1 = A(ox + 218, oy + 60, 'CH₃'), M2 = A(ox + 276, oy + 140, 'CH₃');
  let s = frameP(ox, oy, H_AC, '4 · H₂O takes the last proton: the enone', [['4-methylpent-3-en-2-one (mesityl oxide)', 'fg-tag-good'], '+ H₃O⁺; the enone is the stable end point'], 'good');
  s += bd(Me, C) + bd(C, O, { order: 2 }) + bd(C, Ca) + bd(Ca, Cb, { order: 2, cls: 'fg-bond-hi' }) + bd(Cb, M1) + bd(Cb, M2);
  s += draw(Me, C, O, Ca, Cb, M1, M2);
  return s;
}

FIGURES.push({
  id: 'acid-catalyzed-aldol',
  section: 'aldol',
  anchor: '<!-- fig:acid-catalyzed-aldol:start -->',
  viewBox: `0 0 ${PW * 2 + GAP} ${H_AC * 2 + GAP}`,
  alt: 'The acid-catalyzed aldol of acetone in four panels. 1: the enol O lone pair pushes down, and the enol C=C attacks the carbonyl carbon of O-protonated acetone, whose pi pair moves onto its oxygen. 2: water takes the proton from the C=O+–H, giving 4-hydroxy-4-methylpentan-2-one and H3O+. 3: after the enol re-forms and the beta OH is protonated, the enol O lone pair pushes down, the C=C pair moves to the alpha–beta bond, and water leaves from the beta carbon. 4: water takes the O–H proton, giving 4-methylpent-3-en-2-one.',
  build() {
    let s = pAcid1(0, 0) + pAcid2(PW + GAP, 0) + pAcid3(0, H_AC + GAP) + pAcid4(PW + GAP, H_AC + GAP);
    s += right(PW + 6, PW + GAP - 6, H_AC / 2);
    s += right(PW + 6, PW + GAP - 6, H_AC + GAP + H_AC / 2);
    s += arrow(P(PW + GAP / 2 + 60, H_AC + 4), P(PW / 2 + 40, H_AC + GAP - 4), { size: 7 });
    return s;
  },
  caption: 'Acetone under acid, from enol to enone. No panel needs a carbocation: in panels 1 and 3 the enol&rsquo;s own C=C does the pushing.',
});

/* ======================================== intramolecular aldol (ring) === */
FIGURES.push({
  id: 'intramolecular-aldol-ring',
  section: 'aldol',
  anchor: '<!-- fig:intramolecular-aldol-ring:start -->',
  viewBox: '0 0 760 470',
  alt: 'Hexanedial numbered C1 to C6 with the C2 enolate reaching C6, and the five-membered ring product it gives, then its dehydration to cyclopent-1-ene-1-carbaldehyde',
  build() {
    let s = '';
    s += tag(240, 64, 'hexanedial: number it first');

    const c1 = P(96, 152), o1 = P(96, 104), c2 = P(152, 180), c3 = P(208, 152),
          c4 = P(264, 180), c5 = P(320, 152), c6 = P(376, 180), o6 = P(376, 132);
    s += bond(c1, o1, { order: 2, rTo: 15 }); s += bond(c1, c2, { rFrom: 16, rTo: 17 });
    s += bond(c2, c3, { rFrom: 17, rTo: 17 }); s += bond(c3, c4, { rFrom: 17, rTo: 17 });
    s += bond(c4, c5, { rFrom: 17, rTo: 17 }); s += bond(c5, c6, { rFrom: 17, rTo: 16 });
    s += bond(c6, o6, { order: 2, rFrom: 16, rTo: 15 });
    s += atom(c1.x, c1.y, 'CH', { r: 16 }); s += atom(o1.x, o1.y, 'O');
    s += atom(c2.x, c2.y, 'CH₂', { kind: 'hi', r: 17 });
    s += atom(c3.x, c3.y, 'CH₂', { r: 17 }); s += atom(c4.x, c4.y, 'CH₂', { r: 17 });
    s += atom(c5.x, c5.y, 'CH₂', { r: 17 });
    s += atom(c6.x, c6.y, 'CH', { kind: 'hi', r: 16 }); s += atom(o6.x, o6.y, 'O');

    s += tag(64, 156, 'C1');
    s += tag(152, 214, 'C2');
    s += tag(208, 124, 'C3');
    s += tag(264, 214, 'C4');
    s += tag(320, 124, 'C5');
    s += tag(412, 184, 'C6', { anchor: 'start' });
    s += tag(118, 236, 'the enolate carbon');
    s += tag(400, 206, 'the carbonyl it can reach', { anchor: 'start' });

    s += curve(P(166, 200), P(362, 200), { bow: 40 });
    s += tag(264, 272, 'C2 attacks C6: the ring is C2, C3, C4, C5, C6, five atoms', { cls: 'fg-tag-good' });

    s += rule(24, 296, 736, 296);

    const pent = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = (-90 + i * 72) * Math.PI / 180;
        pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      return pts;
    };
    const ringOf = (pts, skip) => {
      let g = '';
      for (let i = 0; i < 5; i++) {
        if (i === skip) continue;
        g += bond(pts[i], pts[(i + 1) % 5], { rFrom: 0, rTo: 0 });
      }
      return g;
    };

    const a = pent(150, 384, 46);
    s += ringOf(a, -1);
    s += bond(a[0], P(150, 318), { rFrom: 0, rTo: 18 });
    s += atom(150, 318, 'CHO', { r: 18 });
    s += bond(a[1], P(250, 344), { rFrom: 0, rTo: 16 });
    s += atom(250, 344, 'OH', { r: 16 });
    s += tag(150, 452, '2-hydroxycyclopentane-1-carbaldehyde');

    s += arrow(P(300, 396), P(370, 396));
    s += tag(336, 380, 'heat, −H₂O');

    const b = pent(470, 384, 46), bc = P(470, 384);
    s += ringOf(b, 0);
    s += ringDouble(b[0], b[1], bc);
    s += bond(b[0], P(470, 318), { rFrom: 0, rTo: 18 });
    s += atom(470, 318, 'CHO', { r: 18 });
    s += tag(470, 452, 'cyclopent-1-ene-1-carbaldehyde');

    s += tag(652, 368, 'a ring C=C conjugated', { cls: 'fg-tag-good' });
    s += tag(652, 386, 'with a C=O is the mark', { cls: 'fg-tag-good' });
    s += tag(652, 404, 'of an intramolecular', { cls: 'fg-tag-good' });
    s += tag(652, 422, 'aldol condensation', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'Top: the chain, numbered, with the one attack that closes a five-membered ring. Bottom: the ring aldol, then the enone heat makes from it.',
});

/* ==================================== enone: two electrophilic carbons === */
FIGURES.push({
  id: 'enone-two-electrophiles',
  section: 'aldol',
  anchor: '<!-- fig:enone-two-electrophiles:start -->',
  viewBox: '0 0 760 250',
  alt: 'But-3-en-2-one and its resonance contributor with positive charge on the beta carbon and negative charge on oxygen, marking the carbonyl carbon as the 1,2 site and the beta carbon as the 1,4 site',
  build() {
    let s = '';
    s += tag(160, 30, 'the enone as usually drawn');
    s += tag(552, 30, 'the contributor that explains it');

    const b1 = P(70, 152), b2 = P(130, 122), b3 = P(190, 152), bo = P(190, 104), b4 = P(250, 182);
    s += bond(b1, b2, { order: 2 }); s += bond(b2, b3); s += bond(b3, bo, { order: 2 });
    s += bond(b3, b4, { rTo: 16 });
    s += atom(b1.x, b1.y, 'CH₂', { kind: 'hi' }); s += atom(b2.x, b2.y, 'CH'); s += atom(b3.x, b3.y, 'C', { kind: 'hi' });
    s += atom(bo.x, bo.y, 'O'); s += atom(b4.x, b4.y, 'CH₃', { r: 16 });
    s += curve(mid(b1, b2), mid(b2, b3), { bow: 30 });
    s += curve(P(200, 128), P(206, 92), { bow: 14 });

    s += arrow(P(330, 152), P(390, 152));
    s += arrow(P(390, 152), P(330, 152));

    const r1 = P(452, 152), r2 = P(512, 122), r3 = P(572, 152), ro = P(572, 104), r4 = P(632, 182);
    s += bond(r1, r2); s += bond(r2, r3, { order: 2 }); s += bond(r3, ro);
    s += bond(r3, r4, { rTo: 16 });
    s += atom(r1.x, r1.y, 'CH₂⁺', { kind: 'warn', r: 19 }); s += atom(r2.x, r2.y, 'CH');
    s += atom(r3.x, r3.y, 'C'); s += atom(ro.x, ro.y, 'O⁻', { kind: 'warn' });
    s += lonePair(ro.x, ro.y, 180, { dist: 21 }); s += lonePair(ro.x, ro.y, 0, { dist: 21 });
    s += lonePair(ro.x, ro.y, 270, { dist: 21 });
    s += atom(r4.x, r4.y, 'CH₃', { r: 16 });
    s += tag(452, 194, 'the β carbon is', { cls: 'fg-tag-warn' });
    s += tag(452, 210, 'electron-poor', { cls: 'fg-tag-warn' });

    s += bond(P(190, 170), P(190, 204), { rFrom: 0, rTo: 0, cls: 'fg-dash' });
    s += tag(190, 220, 'carbonyl carbon: the 1,2 site');
    s += tag(70, 188, 'β carbon: the 1,4 site');
    return s;
  },
  caption: 'Left: but-3-en-2-one with its two electrophilic carbons highlighted. Right: the contributor with the positive charge on the β carbon.',
});

export default FIGURES;
