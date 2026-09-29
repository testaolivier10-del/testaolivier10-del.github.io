/* Figures for the baeyer-villiger notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every drawing is made of panels 340 wide whose labels are all fg-lbl or
   fg-tag, so one panel can sit in a notes figure (two to a row) and in a
   lesson figure (stacked in one 340-wide column, id prefix l-). Each panel
   is a function of its top-left corner.

   The mechanism follows one real ketone, butanone, with every atom
   labeled, so each curved arrow starts at a named lone pair or bond and
   ends at a named atom or bond. Rings and chains elsewhere are skeletal:
   this chapter comes long after skeletal structures are taught. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, panel, P } from '../lib/ochem-figure.mjs';
import { polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];
const PW = 340;                       // panel width
const GAP = 40;                       // gap between two panels in a notes row
const W2 = PW * 2 + GAP;              // a two-panel notes row

/* ------------------------------------------------------------ helpers --- */
const rad = (l) => (!l ? 0 : l === 'H' ? 11 : l.length <= 2 ? 14 : 4 + l.length * 3.8);
/* A labeled atom {x, y, l, k, r}; V is an unlabeled skeletal vertex. */
const A = (x, y, l, k) => ({ x, y, l, k, r: rad(l) });
const V = (x, y) => ({ x, y, l: '', r: 0 });
const draw = (...as) => as.filter((a) => a.l).map((a) => atom(a.x, a.y, a.l, { kind: a.k, r: a.r })).join('');
const bd = (a, b, o = {}) => bond(a, b, { rFrom: a.r ?? 0, rTo: b.r ?? 0, ...o });
const wd = (a, b) => wedge(a, b, { rFrom: a.r, rTo: b.r, width: 9 });
const hs = (a, b) => hash(a, b, { rFrom: a.r, rTo: b.r, width: 10, rungs: 5 });
const dash = (a, b, cls = 'fg-dash-hi') => {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  const ux = dx / l, uy = dy / l, ra = a.r || 0, rb = b.r || 0;
  return `<line class="${cls}" x1="${(a.x + ux * ra).toFixed(1)}" y1="${(a.y + uy * ra).toFixed(1)}" x2="${(b.x - ux * rb).toFixed(1)}" y2="${(b.y - uy * rb).toFixed(1)}"></line>`;
};
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const off = (p, dx, dy) => P(p.x + dx, p.y + dy);
const lp = (a, deg, extra = 7) => lonePair(a.x, a.y, deg, { dist: a.r + extra });
const lpAt = (a, deg, extra = 7) => {
  const r = (deg * Math.PI) / 180, d = a.r + extra;
  return P(a.x + Math.cos(r) * d, a.y + Math.sin(r) * d);
};
/* Text that may carry an italic tspan, such as (R). */
const it = (s) => `<tspan font-style="italic">${s}</tspan>`;
const rich = (x, y, html, cls = 'fg-tag') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" font-size="${cls === 'fg-lbl' ? 12.5 : 11}">${html}</text>`;
/* Every panel: a box, a title tag at the top and up to three tag lines at
   the bottom. A line is a string, or [html, cls] for rich text. */
function frameP(ox, oy, h, title, lines = [], kind) {
  let s = panel(ox, oy, PW, h, kind ? { kind } : {});
  if (title) s += rich(ox + PW / 2, oy + 20, title);
  lines.forEach((ln, i) => {
    const [t, cls] = Array.isArray(ln) ? ln : [ln, 'fg-tag'];
    s += rich(ox + PW / 2, oy + h - 14 - (lines.length - 1 - i) * 17, t, cls);
  });
  return s;
}
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2), { size: 7 });
const right = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { size: 7 });
const plus = (x, y) => text(x, y, '+', { cls: 'fg-lbl' });
const sk = (a, b, cls) => bd(a, b, cls ? { cls } : {});
/* A C=O drawn off a skeletal vertex, or any double bond. */
const dbl = (a, b, cls) => bd(a, b, { order: 2, ...(cls ? { cls } : {}) });

/* Stack panels for a lesson: each entry is [panelFn, height]; a short arrow
   joins consecutive panels unless `arrows` is false. Returns { svg, h }. */
function stack(parts, gap = 26, arrows = true) {
  let s = '', y = 0;
  parts.forEach(([fn, h], i) => {
    s += fn(0, y);
    if (arrows && i < parts.length - 1) s += down(PW / 2, y + h + 3, y + h + gap - 3);
    y += h + gap;
  });
  return { svg: s, h: y - gap };
}

/* A ring from polyPts, with some vertices replaced by labeled atoms.
   `atoms` maps a vertex index to [label, kind]. Returns { s, pts }. */
function ring(cx, cy, n, r, rot, atoms = {}, hiBonds = []) {
  const raw = polyPts(cx, cy, n, r, rot);
  const pts = raw.map((p, i) => (atoms[i] ? A(p.x, p.y, atoms[i][0], atoms[i][1]) : V(p.x, p.y)));
  let s = '';
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const hi = hiBonds.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
    s += sk(pts[i], pts[j], hi ? 'fg-bond-hi' : undefined);
  }
  return { s, pts };
}
/* A point `d` out from the ring centre through vertex p. */
const outward = (c, p, d) => {
  const dx = p.x - c.x, dy = p.y - c.y, l = Math.hypot(dx, dy) || 1;
  return P(p.x + (dx / l) * d, p.y + (dy / l) * d);
};
/* A benzene ring: six vertices and three inset double bonds. */
function benz(cx, cy, r, rot = 0, shift = 0) {
  const pts = polyPts(cx, cy, 6, r, rot).map((p) => V(p.x, p.y));
  const c = P(cx, cy);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = pts[i], b = pts[(i + 1) % 6];
    s += (i % 2 === shift) ? ringDouble(a, b, c, { inset: 6 }) : sk(a, b);
  }
  return { s, pts };
}

/* ======================================================================
   1. The reaction on its simplest ketone: acetone to methyl acetate.
   ====================================================================== */
const H_OVER = 318;
function pOverview(ox, oy) {
  let s = frameP(ox, oy, H_OVER, 'acetone', [
    'methyl acetate, with the new O highlighted',
  ]);
  // acetone
  const C = A(ox + 170, oy + 96, 'C'), O = A(ox + 170, oy + 52, 'O'),
        M1 = A(ox + 118, oy + 122, 'CH₃'), M2 = A(ox + 222, oy + 122, 'CH₃');
  s += dbl(C, O) + bd(C, M1) + bd(C, M2, { cls: 'fg-bond-hi' });
  s += draw(C, O, M1, M2);
  s += down(ox + 170, oy + 146, oy + 178);
  s += tag(ox + 214, oy + 166, 'mCPBA');
  // methyl acetate
  const C2 = A(ox + 136, oy + 236, 'C'), O2 = A(ox + 136, oy + 194, 'O'),
        N1 = A(ox + 84, oy + 262, 'CH₃'), On = A(ox + 190, oy + 262, 'O', 'hi'),
        N2 = A(ox + 246, oy + 236, 'CH₃');
  s += dbl(C2, O2) + bd(C2, N1) + bd(C2, On, { cls: 'fg-bond-hi' }) + bd(On, N2, { cls: 'fg-bond-hi' });
  s += draw(C2, O2, N1, On, N2);
  return s;
}
FIGURES.push({
  id: 'acetone-to-ester',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:acetone-to-ester:start -->',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} ${H_OVER}`,
  alt: 'Acetone, CH3–CO–CH3, treated with mCPBA gives methyl acetate, CH3–CO–O–CH3. The new oxygen is highlighted: it sits between the carbonyl carbon and one CH3, in the place of the C–C bond that was there.',
  build() { return pOverview(0, 0); },
  caption: 'Compare the highlighted bond in acetone with the highlighted pair of bonds in methyl acetate. The oxygen has gone into that bond.',
});

/* ======================================================================
   2. The reagent: mCPBA, with its two working parts marked.
   ====================================================================== */
const H_MC = 224;
FIGURES.push({
  id: 'mcpba',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:mcpba:start -->',
  viewBox: `0 0 ${PW} ${H_MC}`,
  alt: 'mCPBA, meta-chloroperoxybenzoic acid: a benzene ring carrying a chlorine and, two ring positions away, a C(=O)–O–O–H group. The terminal oxygen of the O–O–H end and the O–O bond are highlighted; the ring with its chlorine is labeled Ar.',
  build() {
    let s = frameP(0, 0, H_MC, 'mCPBA', [
      'highlighted: the weak O–O bond,',
      'and the O that the ketone receives',
    ]);
    const b = benz(78, 112, 30, 0, 1);
    s += b.s;
    const c = P(78, 112);
    const Cl = A(outward(c, b.pts[2], 30).x, outward(c, b.pts[2], 30).y, 'Cl');
    s += bd(b.pts[2], Cl) + draw(Cl);
    const C = V(b.pts[0].x + 30, b.pts[0].y - 17);
    const Od = A(C.x, C.y - 38, 'O'), Ob = A(C.x + 32, C.y + 18, 'O'),
          Ot = A(C.x + 66, C.y, 'O', 'hi'), H = A(C.x + 98, C.y + 18, 'H');
    s += sk(b.pts[0], C) + dbl(C, Od) + bd(C, Ob) + bd(Ob, Ot, { cls: 'fg-bond-hi' }) + bd(Ot, H);
    s += draw(Od, Ob, Ot, H);
    s += `<path class="fg-dash" fill="none" d="M50 150 Q50 158 58 158 L98 158 Q106 158 106 150"></path>`;
    s += tag(78, 176, 'Ar');
    s += tag(Ot.x + 6, Ot.y - 26, 'O–O–H end');
    return s;
  },
  caption: 'Ar stands for the ring and its chlorine. The <i>m</i>, for <i>meta</i>, says where the chlorine sits: on the ring carbon two positions away from the carbon that carries the acid group.',
});

/* ======================================================================
   3. The mechanism on butanone.
   ====================================================================== */
const H_M = 250;

/* 1: an acid protonates the carbonyl oxygen. */
function pProton(ox, oy) {
  let s = frameP(ox, oy, H_M, '1 · an acid protonates the C=O', [
    'H–A: any acid in the flask',
  ]);
  const C = A(ox + 120, oy + 140, 'C', 'hi'), O = A(ox + 120, oy + 86, 'O'),
        Et = A(ox + 62, oy + 178, 'CH₂CH₃'), Me = A(ox + 176, oy + 172, 'CH₃');
  const H = A(ox + 212, oy + 66, 'H', 'warn'), X = A(ox + 272, oy + 66, 'A');
  s += dbl(C, O) + bd(C, Et) + bd(C, Me) + bd(H, X, { cls: 'fg-bond-hi' });
  s += lp(O, 225) + lp(O, 315);
  s += draw(C, O, Et, Me, H, X);
  s += curve(off(lpAt(O, 315), 4, -4), P(H.x - H.r - 3, H.y + 2), { bow: -14 });
  s += curve(mid(H, X), P(X.x + 2, X.y - X.r - 3), { bow: -12 });
  return s;
}

/* 2: the peroxyacid's OH oxygen adds to the carbonyl carbon. */
function pAdd(ox, oy) {
  let s = frameP(ox, oy, H_M, '2 · the peroxyacid adds', [
    'its O–H oxygen bonds to the carbonyl C',
  ]);
  const C = A(ox + 104, oy + 140, 'C', 'hi'), O = A(ox + 104, oy + 86, 'O⁺'),
        Hq = A(ox + 58, oy + 62, 'H'),
        Et = A(ox + 50, oy + 178, 'CH₂CH₃'), Me = A(ox + 148, oy + 184, 'CH₃');
  const Ot = A(ox + 196, oy + 140, 'O', 'hi'), Ht = A(ox + 196, oy + 92, 'H'),
        Ob = A(ox + 240, oy + 168, 'O'), Ca = A(ox + 282, oy + 140, 'C'),
        Oa = A(ox + 282, oy + 94, 'O'), Ar = A(ox + 318, oy + 168, 'Ar');
  s += dbl(C, O) + bd(O, Hq) + bd(C, Et) + bd(C, Me);
  s += bd(Ot, Ht) + bd(Ot, Ob) + bd(Ob, Ca) + dbl(Ca, Oa) + bd(Ca, Ar);
  s += lp(O, 330) + lp(Ot, 180) + lp(Ot, 250);
  s += draw(C, O, Hq, Et, Me, Ot, Ht, Ob, Ca, Oa, Ar);
  s += curve(off(lpAt(Ot, 180), -3, 4), P(C.x + C.r + 3, C.y + 3), { bow: -12 });
  s += curve(off(mid(C, O), -8, 6), P(O.x - O.r - 3, O.y + 6), { bow: 14 });
  return s;
}

/* Positions shared by the tetrahedral panels 3 to 5. The ethyl, the
   carbonyl carbon, the first O and the second O form a zigzag: the ethyl
   (upper left) and the far O (lower right) sit on opposite sides of the
   C–O bond, which is the anti arrangement the migration needs. */
function tet(ox, oy, o1Label, o1Kind) {
  return {
    C: A(ox + 118, oy + 140, 'C', 'hi'),
    Et: A(ox + 56, oy + 100, 'CH₂CH₃', 'hi'),
    OH: A(ox + 72, oy + 196, 'OH'),
    Me: A(ox + 158, oy + 196, 'CH₃'),
    O1: A(ox + 176, oy + 112, o1Label, o1Kind),
    O2: A(ox + 222, oy + 140, 'O'),
    Ca: A(ox + 268, oy + 112, 'C'),
    Oa: A(ox + 268, oy + 66, 'O'),
    Ar: A(ox + 312, oy + 140, 'Ar'),
  };
}
function tetBonds(t, o2cls) {
  let s = bd(t.C, t.Et, { cls: 'fg-bond-hi' }) + bd(t.C, t.O1);
  s += wd(t.C, t.OH) + hs(t.C, t.Me);
  s += bd(t.O1, t.O2, o2cls ? { cls: o2cls } : {}) + bd(t.O2, t.Ca) + dbl(t.Ca, t.Oa) + bd(t.Ca, t.Ar);
  return s;
}

/* 3: the added oxygen gives up its proton. */
function pDeprot(ox, oy) {
  let s = frameP(ox, oy, H_M, '3 · the added O loses its H⁺', [
    'A⁻ takes the proton',
  ]);
  const t = tet(ox, oy, 'O⁺', 'hi');
  const H = A(t.O1.x, t.O1.y - 48, 'H', 'warn'), B = A(ox + 226, oy + 50, 'A⁻');
  s += tetBonds(t) + bd(t.O1, H, { cls: 'fg-bond-hi' });
  s += lp(B, 180);
  s += draw(...Object.values(t), H, B);
  s += curve(off(lpAt(B, 180), -2, -5), P(H.x + H.r + 2, H.y - 4), { bow: 10 });
  s += curve(off(mid(t.O1, H), -2, 0), P(t.O1.x - t.O1.r - 2, t.O1.y - 6), { bow: 12 });
  return s;
}

/* 4: the Criegee intermediate itself. */
function pCriegee(ox, oy) {
  let s = frameP(ox, oy, H_M, '4 · the Criegee intermediate', [
    ['no charge; the O–O bond is the weak point', 'fg-tag-warn'],
  ], 'hi');
  const t = tet(ox, oy, 'O', 'hi');
  s += tetBonds(t, 'fg-bond-hi');
  s += draw(...Object.values(t));
  return s;
}

/* 5: the collapse. Three pairs move at once. */
function pCollapse(ox, oy) {
  let s = frameP(ox, oy, H_M, '5 · three pairs move at once', [
    'the ethyl slides onto the near O',
  ]);
  const t = tet(ox, oy, 'O', 'hi');
  s += tetBonds(t, 'fg-bond-hi');
  s += lp(t.OH, 225);
  s += draw(...Object.values(t));
  // the OH lone pair makes the new C=O
  s += curve(off(lpAt(t.OH, 225), -4, -4), off(mid(t.C, t.OH), -8, -4), { bow: -16 });
  // the C–ethyl bond swings over onto the near oxygen
  s += curve(off(mid(t.C, t.Et), 0, -8), P(t.O1.x - 6, t.O1.y - t.O1.r - 2), { bow: -26 });
  // the O–O bond breaks onto the far oxygen
  s += curve(off(mid(t.O1, t.O2), 6, -4), P(t.O2.x + 8, t.O2.y - t.O2.r - 1), { bow: -10 });
  return s;
}

/* 6: the protonated ester hands its proton to the carboxylate. */
function pEster(ox, oy) {
  let s = frameP(ox, oy, H_M, '6 · a proton transfer ends it', [
    ['gives ethyl acetate + ArCO₂H', 'fg-tag-good'],
  ], 'good');
  const C = A(ox + 110, oy + 126, 'C', 'hi'), Oq = A(ox + 110, oy + 76, 'O⁺'),
        H = A(ox + 150, oy + 50, 'H', 'warn'),
        Me = A(ox + 60, oy + 154, 'CH₃'), O1 = A(ox + 156, oy + 154, 'O', 'hi'),
        Et = A(ox + 204, oy + 184, 'CH₂CH₃', 'hi');
  s += dbl(C, Oq) + bd(Oq, H, { cls: 'fg-bond-hi' }) + bd(C, Me) + bd(C, O1) + bd(O1, Et, { cls: 'fg-bond-hi' });
  const Om = A(ox + 222, oy + 76, 'O⁻'), Cc = A(ox + 266, oy + 102, 'C'),
        Oc = A(ox + 266, oy + 150, 'O'), Ar = A(ox + 310, oy + 76, 'Ar');
  s += bd(Om, Cc) + dbl(Cc, Oc) + bd(Cc, Ar);
  s += lp(Om, 250);
  s += draw(C, Oq, H, Me, O1, Et, Om, Cc, Oc, Ar);
  s += curve(off(lpAt(Om, 250), -5, -2), P(H.x + H.r + 2, H.y - 4), { bow: 12 });
  s += curve(off(mid(Oq, H), 2, 5), P(Oq.x + Oq.r + 2, Oq.y + 6), { bow: -10 });
  return s;
}

FIGURES.push({
  id: 'criegee-forms',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:criegee-forms:start -->',
  viewBox: `0 0 ${W2} ${H_M * 2 + 30}`,
  alt: 'Butanone and a peroxyacid form the Criegee intermediate in three steps. Panel 1: a lone pair on the carbonyl oxygen takes a proton from an acid H–A. Panel 2: a lone pair on the O–H oxygen of the peroxyacid attacks the carbonyl carbon while the C=O pi electrons move onto the positive oxygen. Panel 3: the added oxygen, now positive, loses its proton. Panel 4: the neutral Criegee intermediate, a carbon carrying OH, CH3, CH2CH3 and O–O–C(=O)Ar.',
  build() {
    let s = pProton(0, 0) + pAdd(PW + GAP, 0);
    s += pDeprot(0, H_M + 30) + pCriegee(PW + GAP, H_M + 30);
    s += right(PW + 6, PW + GAP - 6, 130);
    s += right(PW + 6, PW + GAP - 6, H_M + 30 + 130);
    return s;
  },
  caption: 'Read the top row, then the bottom row. Follow the highlighted C: it starts as the C=O carbon of butanone and ends with four single bonds. From panel 3 on, the ethyl that will move is highlighted too.',
});

FIGURES.push({
  id: 'l-criegee-forms',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} ${H_M * 4 + 26 * 3}`,
  alt: 'Butanone and a peroxyacid form the Criegee intermediate, in four stacked panels: the carbonyl oxygen takes a proton from an acid; the O–H oxygen of the peroxyacid attacks the carbonyl carbon; the added oxygen loses its proton; the neutral Criegee intermediate carries OH, CH3, CH2CH3 and O–O–C(=O)Ar on one carbon.',
  build() {
    return stack([[pProton, H_M], [pAdd, H_M], [pDeprot, H_M], [pCriegee, H_M]]).svg;
  },
  caption: 'Follow the highlighted C from panel to panel: it starts as the C=O carbon and ends with four single bonds. From panel 3 on, the ethyl that will move is highlighted too.',
});

FIGURES.push({
  id: 'criegee-collapse',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:criegee-collapse:start -->',
  viewBox: `0 0 ${W2} ${H_M}`,
  alt: 'The Criegee intermediate collapses. Panel 5: three curved arrows at once. The OH lone pair forms a new C=O bond, the C–CH2CH3 bond moves onto the nearer oxygen of the O–O bond, and the O–O bond breaks onto the far oxygen. Panel 6: the protonated ester CH3–C(=O+H)–O–CH2CH3 gives its proton to the carboxylate ArCO2−, which leaves ethyl acetate and ArCO2H.',
  build() {
    let s = pCollapse(0, 0) + pEster(PW + GAP, 0);
    s += right(PW + 6, PW + GAP - 6, 130);
    return s;
  },
  caption: 'In panel 5, follow the highlighted ethyl: it keeps its bonding pair and ends up on the oxygen. In panel 6 the new ester is highlighted.',
});

FIGURES.push({
  id: 'l-criegee-collapse',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} ${H_M * 2 + 26}`,
  alt: 'The Criegee intermediate collapses, in two stacked panels. First, three curved arrows at once: the OH lone pair forms a new C=O bond, the C–CH2CH3 bond moves onto the nearer oxygen of the O–O bond, and the O–O bond breaks onto the far oxygen. Second, the protonated ester gives its proton to the carboxylate, which leaves ethyl acetate and ArCO2H.',
  build() { return stack([[pCollapse, H_M], [pEster, H_M]]).svg; },
  caption: 'Follow the highlighted ethyl. It keeps its bonding pair and ends up on the oxygen.',
});

/* ======================================================================
   4. Retention: a stereocenter that migrates keeps its arrangement.
   ====================================================================== */
const H_RET = 350;
function pRetention(ox, oy) {
  let s = frameP(ox, oy, H_RET, '', [
    'the highlighted carbon keeps its arrangement:',
    [`CH₃ still toward you, H still away`, 'fg-tag-good'],
  ]);
  // (R)-3-methylpentan-2-one: C1 C2(=O) C3* C4 C5
  const y0 = oy + 70;
  const c1 = V(ox + 70, y0 + 20), c2 = V(ox + 104, y0), o2 = A(ox + 104, y0 - 40, 'O'),
        c3 = A(ox + 138, y0 + 20, 'C', 'hi'), c4 = V(ox + 172, y0), c5 = V(ox + 206, y0 + 20);
  const m3 = A(ox + 116, y0 + 62, 'CH₃'), h3 = A(ox + 162, y0 + 60, 'H');
  s += sk(c1, c2) + dbl(c2, o2) + bd(c2, c3) + bd(c3, c4) + sk(c4, c5);
  s += wd(c3, m3) + hs(c3, h3);
  s += draw(o2, c3, m3, h3);
  s += rich(ox + 270, y0 + 6, `(${it('R')})-3-methyl-`) + rich(ox + 270, y0 + 22, 'pentan-2-one');
  s += down(ox + 138, y0 + 88, y0 + 124);
  s += tag(ox + 184, y0 + 110, 'mCPBA');
  // (R)-butan-2-yl acetate: CH3 C(=O) O C* (CH3)(H) CH2 CH3
  const y1 = oy + 204;
  const a1 = V(ox + 36, y1), a2 = V(ox + 70, y1 + 20), ao = A(ox + 70, y1 + 60, 'O'),
        on = A(ox + 104, y1, 'O', 'hi'), cs = A(ox + 138, y1 + 20, 'C', 'hi'),
        b4 = V(ox + 172, y1), b5 = V(ox + 206, y1 + 20);
  const ms = A(ox + 116, y1 + 62, 'CH₃'), hsA = A(ox + 162, y1 + 60, 'H');
  s += sk(a1, a2) + dbl(a2, ao) + bd(a2, on) + bd(on, cs, { cls: 'fg-bond-hi' }) + bd(cs, b4) + sk(b4, b5);
  s += wd(cs, ms) + hs(cs, hsA);
  s += draw(ao, on, cs, ms, hsA);
  s += rich(ox + 272, y1 + 6, `(${it('R')})-butan-2-yl`) + rich(ox + 272, y1 + 22, 'acetate');
  return s;
}
FIGURES.push({
  id: 'retention',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:retention:start -->',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} ${H_RET}`,
  alt: '(R)-3-methylpentan-2-one, with its stereocenter drawn with the CH3 on a wedge and the H on a hash, gives (R)-butan-2-yl acetate with mCPBA. The migrating carbon is highlighted in both; its CH3 is still on a wedge and its H on a hash, and the new O sits where the carbonyl carbon was.',
  build() { return pRetention(0, 0); },
  caption: 'The highlighted carbon is the one that migrates. Its new bond to O points where its old bond to the carbonyl carbon pointed.',
});

/* ======================================================================
   5. Which group migrates: acetophenone.
   ====================================================================== */
const H_K = 160, H_OUT = 184;
function pAcetophenone(ox, oy) {
  let s = frameP(ox, oy, H_K, 'acetophenone', ['a phenyl and a methyl on the C=O'], 'hi');
  const b = benz(ox + 120, oy + 100, 26, 0, 1);
  const C = V(b.pts[0].x + 30, b.pts[0].y - 17), O = A(C.x, C.y - 36, 'O'),
        M = A(C.x + 36, C.y + 18, 'CH₃');
  s += b.s + sk(b.pts[0], C) + dbl(C, O) + bd(C, M);
  s += draw(O, M);
  return s;
}
/* The two candidate esters. `phenylMoved` picks which. */
function pOutcome(ox, oy, phenylMoved) {
  const good = phenylMoved;
  let s = frameP(ox, oy, H_OUT,
    good ? 'phenyl acetate' : 'methyl benzoate',
    good ? [['forms: the phenyl moved onto O', 'fg-tag-good']]
         : [['does not form: it needs the methyl to move', 'fg-tag-warn']],
    good ? 'good' : 'warn');
  const b = benz(ox + 100, oy + 100, 26, 0, 1);
  s += b.s;
  if (good) {
    const On = A(b.pts[0].x + 30, b.pts[0].y - 17, 'O', 'hi'), C = V(On.x + 32, On.y + 18),
          Od = A(C.x, C.y + 38, 'O'), M = A(C.x + 36, C.y - 18, 'CH₃');
    s += bd(b.pts[0], On, { cls: 'fg-bond-hi' }) + bd(On, C) + dbl(C, Od) + bd(C, M);
    s += draw(On, Od, M);
  } else {
    const C = V(b.pts[0].x + 30, b.pts[0].y - 17), Od = A(C.x, C.y - 36, 'O'),
          On = A(C.x + 32, C.y + 18, 'O', 'hi'), M = A(On.x + 38, On.y - 18, 'CH₃');
    s += sk(b.pts[0], C) + dbl(C, Od) + bd(C, On) + bd(On, M, { cls: 'fg-bond-hi' });
    s += draw(Od, On, M);
  }
  return s;
}
FIGURES.push({
  id: 'which-migrates',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:which-migrates:start -->',
  viewBox: `0 0 ${W2} ${H_K + 44 + H_OUT}`,
  alt: 'Acetophenone, a benzene ring and a methyl on a C=O, can in principle give two esters. Phenyl acetate, with the new O between the ring and the C=O, forms: the phenyl moved. Methyl benzoate, with the new O between the C=O and the methyl, does not form.',
  build() {
    let s = pAcetophenone((W2 - PW) / 2, 0);
    s += arrow(P(W2 / 2 - 100, H_K + 4), P(PW / 2 + 40, H_K + 38), { size: 7 });
    s += arrow(P(W2 / 2 + 100, H_K + 4), P(PW + GAP + PW / 2 - 40, H_K + 38), { size: 7 });
    s += pOutcome(0, H_K + 44, true) + pOutcome(PW + GAP, H_K + 44, false);
    return s;
  },
  caption: 'The highlighted O is the new one.',
});
FIGURES.push({
  id: 'l-which-migrates',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} ${H_K + H_OUT * 2 + 26 + 36}`,
  alt: 'Acetophenone, a benzene ring and a methyl on a C=O, with an arrow down to phenyl acetate, which forms: the new O sits between the ring and the C=O. Below, set apart as the other ester it could have given, methyl benzoate, with the new O between the C=O and the methyl, which does not form.',
  build() {
    let s = pAcetophenone(0, 0);
    s += down(PW / 2, H_K + 3, H_K + 23);
    s += pOutcome(0, H_K + 26, true);
    s += tag(PW / 2, H_K + 26 + H_OUT + 24, 'the other ester it could have given:');
    s += pOutcome(0, H_K + 26 + H_OUT + 36, false);
    return s;
  },
  caption: 'The highlighted O is the new one.',
});

/* ======================================================================
   6. Why an aryl group migrates well: the bridged transition state.
   ====================================================================== */
const H_BR = 310;
FIGURES.push({
  id: 'aryl-bridge',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:aryl-bridge:start -->',
  viewBox: `0 0 ${PW} ${H_BR}`,
  alt: 'The transition state for a phenyl group moving from carbon to oxygen. The ring carbon that was bonded to the carbonyl carbon, the ipso carbon, sits between the carbonyl carbon and the oxygen with a dashed partial bond to each. The O–O bond is also dashed, breaking. A dashed arc runs over the five ring carbons other than ipso, and delta-plus marks sit on three of them: the two next to the ipso carbon and the one across the ring.',
  build() {
    let s = frameP(0, 0, H_BR, 'phenyl halfway from C to O', [
      'δ+ on the two carbons beside ipso',
      'and on the one across the ring',
    ]);
    const cx = 150, cy = 94, r = 34;
    const pts = polyPts(cx, cy, 6, r, 90).map((p) => V(p.x, p.y));
    for (let i = 0; i < 6; i++) s += sk(pts[i], pts[(i + 1) % 6]);
    // the delocalized cation over the five carbons other than ipso (vertex 3)
    const ir = r * 0.6, inner = polyPts(cx, cy, 6, ir, 90);
    const f = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    s += `<path class="fg-dash" fill="none" d="M${f(inner[4])} A${ir.toFixed(1)} ${ir.toFixed(1)} 0 1 0 ${f(inner[2])}"></path>`;
    for (const i of [0, 2, 4]) {
      const q = outward(P(cx, cy), pts[i], 16);
      s += text(q.x, q.y + 4, 'δ+', { cls: 'fg-lbl' });
    }
    const ipso = pts[3];
    const C = A(ipso.x - 44, ipso.y + 58, 'C', 'hi'), O1 = A(ipso.x + 44, ipso.y + 58, 'O', 'hi');
    const OH = A(C.x - 52, C.y - 20, 'OH'), Me = A(C.x - 40, C.y + 46, 'CH₃');
    const O2 = A(O1.x + 46, O1.y + 22, 'O');
    s += dash(ipso, C) + dash(ipso, O1) + bd(C, O1);
    s += bd(C, OH) + bd(C, Me);
    s += dash(O1, O2, 'fg-dash') + bond(O2, P(O2.x + 30, O2.y), { rFrom: O2.r, rTo: 0 });
    s += label(O2.x + 62, O2.y + 4, 'C(=O)Ar');
    s += draw(C, O1, OH, Me, O2);
    s += tag(ipso.x + 60, ipso.y + 14, 'ipso carbon');
    return s;
  },
  caption: 'Dashed lines: bonds half made or half broken.',
});

/* ======================================================================
   7. The group has to line up anti to the O–O bond: Newman projections.
   ====================================================================== */
const H_NEW = 290;
function pNewman(ox, oy, which) {
  const etAnti = which === 'et';
  let s = frameP(ox, oy, H_NEW,
    etAnti ? 'CH₂CH₃ anti to the O–O bond' : 'turned 120°: now CH₃ is anti',
    etAnti ? ['dot: the C in front · circle: the O behind', ['the ethyl can migrate', 'fg-tag-good']]
           : ['dot: the C in front · circle: the O behind', ['now the methyl could migrate', 'fg-tag']],
    etAnti ? 'good' : null);
  const c = P(ox + 170, oy + 134), R = 34;
  s += `<circle class="fg-bond" cx="${c.x}" cy="${c.y}" r="${R}" fill="none"></circle>`;
  // front carbon: three bonds from the centre
  const front = etAnti
    ? [['CH₂CH₃', 270, 'hi'], ['OH', 30], ['CH₃', 150]]
    : [['CH₃', 270, 'hi'], ['CH₂CH₃', 30], ['OH', 150]];
  const pos = (deg, d) => P(c.x + Math.cos((deg * Math.PI) / 180) * d, c.y - Math.sin((deg * Math.PI) / 180) * d);
  for (const [l, deg, k] of front) {
    const g = A(pos(deg, 72).x, pos(deg, 72).y, l, k);
    s += bond(c, g, { rFrom: 0, rTo: g.r, cls: k ? 'fg-bond-hi' : 'fg-bond' }) + draw(g);
  }
  s += `<circle class="fg-atom-hi" cx="${c.x}" cy="${c.y}" r="5"></circle>`;
  // back oxygen: the O–O bond straight up, lone pairs at the other two places
  const top = pos(90, R), Oe = A(pos(90, 72).x, pos(90, 72).y, 'O');
  s += bond(top, Oe, { rFrom: 0, rTo: Oe.r, cls: 'fg-bond-hi' }) + draw(Oe);
  s += tag(Oe.x + 46, Oe.y + 4, '–C(=O)Ar');
  for (const deg of [210, 330]) {
    const p = pos(deg, R + 9);
    s += lonePair(p.x, p.y, -deg, { dist: 0 });
  }
  return s;
}
FIGURES.push({
  id: 'anti-alignment',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:anti-alignment:start -->',
  viewBox: `0 0 ${W2} ${H_NEW}`,
  alt: 'Two Newman projections of the Criegee intermediate from butanone, looking down the bond from the carbon (front, a dot) to the oxygen (behind, a circle). The O–O bond points straight up from the back oxygen. Left: the CH2CH3 on the front carbon points straight down, 180 degrees from the O–O bond, so the ethyl can migrate. Right: after a turn of 120 degrees, the CH3 points straight down instead.',
  build() {
    return pNewman(0, 0, 'et') + pNewman(PW + GAP, 0, 'me');
  },
  caption: 'Look down the C&ndash;O bond: the carbon is in front, the oxygen behind. The highlighted bonds are the O&ndash;O bond and the group that points the opposite way.',
});

/* ======================================================================
   8. An aldehyde: the H migrates.
   ====================================================================== */
const H_ALD = 280;
FIGURES.push({
  id: 'aldehyde-h',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:aldehyde-h:start -->',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} ${H_ALD}`,
  alt: 'Butanal, a three-carbon chain on a CHO group, gives butanoic acid with mCPBA. The new O is highlighted: it sits between the carbonyl carbon and the H, so the H is what migrated.',
  build() {
    let s = frameP(0, 0, H_ALD, 'butanal', [
      ['butanoic acid: the H moved onto the new O', 'fg-tag-good'],
    ]);
    const y0 = 76;
    const c4 = V(84, y0 + 20), c3 = V(118, y0), c2 = V(152, y0 + 20), c1 = V(186, y0),
          o = A(186, y0 - 38, 'O'), h = A(222, y0 + 20, 'H', 'hi');
    s += sk(c4, c3) + sk(c3, c2) + sk(c2, c1) + dbl(c1, o) + bd(c1, h, { cls: 'fg-bond-hi' });
    s += draw(o, h);
    s += down(110, y0 + 34, y0 + 70);
    s += tag(154, y0 + 58, 'mCPBA');
    const y1 = 196;
    const d4 = V(70, y1 + 20), d3 = V(104, y1), d2 = V(138, y1 + 20), d1 = V(172, y1),
          od = A(172, y1 - 38, 'O'), on = A(208, y1 + 20, 'O', 'hi'), hn = A(244, y1, 'H', 'hi');
    s += sk(d4, d3) + sk(d3, d2) + sk(d2, d1) + dbl(d1, od) + bd(d1, on) + bd(on, hn, { cls: 'fg-bond-hi' });
    s += draw(od, on, hn);
    return s;
  },
  caption: 'Compare the highlighted H in each drawing. In the acid it hangs off the new O instead of the carbonyl carbon.',
});

/* ======================================================================
   9. Rings grow by one atom.
   ====================================================================== */
const H_RING = 230;
function pRing(ox, oy, n) {
  const six = n === 6;
  let s = frameP(ox, oy, H_RING, six ? 'cyclohexanone' : 'cyclopentanone', [
    six ? 'six ring atoms become seven' : 'five ring atoms become six',
    [six ? 'oxepan-2-one, a seven-membered lactone' : 'oxan-2-one, a six-membered lactone', 'fg-tag-good'],
  ]);
  const cy = oy + 118;
  // the ketone
  const k = ring(ox + 76, cy, n, six ? 32 : 30, 90);
  const kO = A(k.pts[0].x, k.pts[0].y - 36, 'O');
  s += k.s + dbl(k.pts[0], kO) + draw(kO);
  s += right(ox + 124, ox + 164, cy);
  s += tag(ox + 144, cy - 12, 'mCPBA');
  // the lactone: one more ring atom, the new O beside the carbonyl carbon
  const m = n + 1;
  const lc = P(ox + 250, cy + 4);
  const l = ring(lc.x, lc.y, m, six ? 38 : 34, 90, { [m - 1]: ['O', 'hi'] }, [[0, m - 1], [m - 1, m - 2]]);
  const lO = A(l.pts[0].x, l.pts[0].y - 36, 'O');
  s += l.s + dbl(l.pts[0], lO) + draw(lO, l.pts[m - 1]);
  return s;
}
FIGURES.push({
  id: 'ring-expansion',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:ring-expansion:start -->',
  viewBox: `0 0 ${W2} ${H_RING}`,
  alt: 'Left: cyclohexanone, a six-membered ring with a C=O, gives oxepan-2-one, a seven-membered ring containing one oxygen next to the C=O carbon. Right: cyclopentanone gives oxan-2-one, a six-membered ring with the oxygen next to the C=O carbon. The ring oxygen is highlighted in both.',
  build() { return pRing(0, 0, 6) + pRing(PW + GAP, 0, 5); },
  caption: 'Count the ring atoms on each side of the arrow. The highlighted O is the one extra atom.',
});
FIGURES.push({
  id: 'l-ring-six',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} ${H_RING}`,
  alt: 'Cyclohexanone, a six-membered ring with a C=O, gives oxepan-2-one, a seven-membered ring containing one oxygen next to the C=O carbon. The ring oxygen is highlighted.',
  build() { return pRing(0, 0, 6); },
  caption: 'Count the ring atoms on each side of the arrow. The highlighted O is the one extra atom.',
});

/* ======================================================================
   10. The worked example: 2-methylcyclohexanone.
   ====================================================================== */
const H_MCH = 260;
/* A ring-atom number placed inside the ring, part way from vertex p toward
   the centre c, so it never sits on a substituent outside. */
const inLbl = (c, p, t, f = 0.42) => text(p.x + (c.x - p.x) * f, p.y + (c.y - p.y) * f + 4, t, { cls: 'fg-lbl' });

/* The ketone. With `hints`, the two candidate bonds are marked. */
function pMCH(ox, oy, hints, h = H_MCH) {
  let s = frameP(ox, oy, h, '2-methylcyclohexanone',
    hints ? ['C2 carries two carbons: C3 and the CH₃', 'C6 carries one: C5'] : []);
  const c = P(ox + 180, oy + 132);
  const k = ring(c.x, c.y, 6, 46, 90, {}, hints ? [[0, 1]] : []);
  const [c1, c2, c3, c4, c5, c6] = k.pts;
  const O = A(c1.x, c1.y - 38, 'O');
  s += k.s + dbl(c1, O) + draw(O);
  const me = A(c2.x - 46, c2.y, 'CH₃');
  s += wedge(c2, me, { rFrom: 0, rTo: me.r, width: 9 }) + draw(me);
  s += inLbl(c, c1, 'C1') + inLbl(c, c2, 'C2') + inLbl(c, c3, 'C3') + inLbl(c, c4, 'C4') + inLbl(c, c5, 'C5') + inLbl(c, c6, 'C6');
  if (hints) {
    const m12 = mid(c1, c2), m16 = mid(c1, c6);
    s += tag(m12.x - 46, m12.y - 16, 'O goes in here', { cls: 'fg-tag-good' });
    s += text(m16.x + 7, m16.y - 3, '×', { cls: 'fg-warn', size: 15 });
    s += tag(m16.x + 46, m16.y - 16, 'not here', { cls: 'fg-tag-warn' });
  }
  return s;
}
function pLactone(ox, oy) {
  let s = frameP(ox, oy, H_MCH, '7-methyloxepan-2-one', [
    'the new O sits between C1 and C2',
    ['CH₃ still on a wedge: retention', 'fg-tag-good'],
  ], 'good');
  const c = P(ox + 182, oy + 134);
  // seven vertices: 0 = C1 (top), 1 = the new O, 2 = C2, then C3..C6
  const l = ring(c.x, c.y, 7, 50, 90, { 1: ['O', 'hi'] }, [[0, 1], [1, 2]]);
  const [c1, on, c2, c3, c4, c5, c6] = l.pts;
  const O = A(c1.x, c1.y - 38, 'O');
  s += l.s + dbl(c1, O) + draw(O, on);
  const me = A(c2.x - 46, c2.y + 4, 'CH₃');
  s += wedge(c2, me, { rFrom: 0, rTo: me.r, width: 9 }) + draw(me);
  s += inLbl(c, c1, 'C1') + inLbl(c, c2, 'C2') + inLbl(c, c3, 'C3') + inLbl(c, c4, 'C4') + inLbl(c, c5, 'C5') + inLbl(c, c6, 'C6');
  return s;
}
FIGURES.push({
  id: 'methylcyclohexanone',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:methylcyclohexanone:start -->',
  viewBox: `0 0 ${W2} ${H_MCH}`,
  alt: 'Left: 2-methylcyclohexanone, with the ring carbons C1 (the C=O carbon), C2 (carrying a CH3 on a wedge), C3, C5 and C6 labeled. The C1–C2 bond is highlighted as the bond the oxygen goes into, and the C1–C6 bond is marked "not here". Right: the product, 7-methyloxepan-2-one, a seven-membered ring in which the new O sits between C1 and C2 and the CH3 on C2 is still on a wedge.',
  build() {
    let s = pMCH(0, 0, true) + pLactone(PW + GAP, 0);
    s += right(PW + 6, PW + GAP - 6, 128);
    return s;
  },
  caption: 'The ring atoms keep their old numbers so you can follow them. The new O goes into the highlighted C1&ndash;C2 bond.',
});
FIGURES.push({
  id: 'l-mch-ketone',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} 200`,
  alt: '2-methylcyclohexanone as a single enantiomer: a six-membered ring with the C=O carbon labeled C1, the next carbon C2 carrying a CH3 on a wedge, and the carbon on the other side of C1 labeled C6. C3 and C5 are labeled too.',
  build() { return pMCH(0, 0, false, 200); },
  caption: 'A single enantiomer: the CH<sub>3</sub> on C2 points toward you.',
});

/* ======================================================================
   11. An alkene in the same molecule reacts first.
   ====================================================================== */
const H_ALK = 320;
FIGURES.push({
  id: 'alkene-first',
  section: 'baeyer-villiger',
  anchor: '<!-- fig:alkene-first:start -->',
  lessons: ['baeyer-villiger'],
  viewBox: `0 0 ${PW} ${H_ALK}`,
  alt: '6-Methylhept-5-en-2-one, a methyl ketone at one end of a chain and a C=C carrying three carbon groups near the other end, reacts with one equivalent of mCPBA at the C=C. The product has an epoxide where the C=C was, and the ketone is unchanged.',
  build() {
    let s = frameP(0, 0, H_ALK, '6-methylhept-5-en-2-one', [
      ['the C=C becomes an epoxide', 'fg-tag-good'],
      'the ketone is untouched',
    ]);
    const chain = (y, epox) => {
      const p = [V(58, y + 20), V(92, y), V(126, y + 20), V(160, y), V(194, y + 20), V(228, y), V(262, y + 20)];
      const me = V(228, y - 38);
      const O = A(92, y - 38, 'O');
      let g = sk(p[0], p[1]) + dbl(p[1], O) + sk(p[1], p[2]) + sk(p[2], p[3]) + sk(p[3], p[4]);
      if (epox) {
        const Oe = A(229, y + 42, 'O', 'hi');
        g += sk(p[4], p[5], 'fg-bond-hi') + bd(p[4], Oe, { cls: 'fg-bond-hi' }) + bd(p[5], Oe, { cls: 'fg-bond-hi' });
        g += draw(Oe);
      } else {
        g += ringDouble(p[4], p[5], P(211, y + 40), { cls: 'fg-bond-hi' });
      }
      g += sk(p[5], p[6]) + sk(p[5], me) + draw(O);
      return g;
    };
    s += chain(84, false);
    s += tag(48, 50, 'ketone');
    s += tag(206, 70, 'C=C', { cls: 'fg-tag-good' });
    s += down(170, 124, 158);
    s += tag(236, 146, '1 equiv. mCPBA');
    s += chain(194, true);
    return s;
  },
  caption: 'Compare the highlighted part of each drawing. The C=O at the left end is the same before and after.',
});

/* ======================================================================
   12. The four ketones of the lesson's sorting step.
   ====================================================================== */
const H_CASE = 150;
function caseKetone(left, rightG, lName, rName) {
  return (ox, oy) => {
    let s = panel(ox, oy, PW, H_CASE);
    const C = V(ox + 170, oy + 64), O = A(C.x, C.y - 38, 'O');
    s += dbl(C, O) + draw(O);
    const L = V(C.x - 30, C.y + 17), R = V(C.x + 30, C.y + 17);
    s += sk(C, L) + sk(C, R);
    s += left(L) + rightG(R, true);
    s += rich(ox + 108, oy + 140, lName) + rich(ox + 236, oy + 140, rName);
    return s;
  };
}
/* Group drawers: each gets the attachment vertex and whether it is on the
   right (so it grows away from the carbonyl). */
const gMethyl = () => '';
const gEthyl = (a, onRight) => sk(a, V(a.x + (onRight ? 30 : -30), a.y - 17));
const gIsopropyl = (a, onRight) => {
  const s = onRight ? 1 : -1;
  return sk(a, V(a.x + 30 * s, a.y - 17)) + sk(a, V(a.x, a.y + 34));
};
const gTertButyl = (a, onRight) => {
  const s = onRight ? 1 : -1;
  return sk(a, V(a.x + 30 * s, a.y - 17)) + sk(a, V(a.x + 30 * s, a.y + 17)) + sk(a, V(a.x, a.y + 34));
};
const gPhenyl = (a, onRight) => {
  const s = onRight ? 1 : -1;
  const b = benz(a.x + 22.5 * s, a.y + 13, 26, onRight ? 150 : 30, 0);
  return b.s;
};
const gCyclohexyl = (a, onRight) => {
  const s = onRight ? 1 : -1;
  const r = ring(a.x + 22.5 * s, a.y + 13, 6, 26, onRight ? 150 : 30);
  return r.s;
};
const CASES = [
  ['l-case-1', '3-Methylbutan-2-one', caseKetone(gMethyl, gIsopropyl, 'methyl', 'isopropyl'),
    '3-Methylbutan-2-one: a methyl on the left of the C=O and an isopropyl on the right.'],
  ['l-case-2', '3,3-Dimethylbutan-2-one', caseKetone(gTertButyl, gMethyl, `${it('tert')}-butyl`, 'methyl'),
    '3,3-Dimethylbutan-2-one: a tert-butyl on the left of the C=O and a methyl on the right.'],
  ['l-case-3', '1-Phenylpropan-1-one', caseKetone(gPhenyl, gEthyl, 'phenyl', 'ethyl'),
    '1-Phenylpropan-1-one: a phenyl ring on the left of the C=O and an ethyl on the right.'],
  ['l-case-4', '1-Cyclohexylpropan-1-one', caseKetone(gCyclohexyl, gEthyl, 'cyclohexyl', 'ethyl'),
    '1-Cyclohexylpropan-1-one: a cyclohexane ring on the left of the C=O and an ethyl on the right.'],
];
for (const [id, cap, fn, alt] of CASES) {
  FIGURES.push({
    id,
    lessons: ['baeyer-villiger'],
    viewBox: `0 0 ${PW} ${H_CASE}`,
    alt,
    build() { return fn(0, 0); },
    caption: cap,
  });
}

export default FIGURES;
