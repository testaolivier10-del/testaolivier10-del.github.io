/* Figures for the nucleophilic-addition notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ 2 ---
   The fork. This one idea joins Module 9 to Module 10, and neither section
   draws it. */
FIGURES.push({
  id: 'tetrahedral-fork',
  section: 'nucleophilic-addition',
  anchor: '<h3>The universal mechanism</h3>',
  alt: 'The tetrahedral intermediate branching to addition when there is no leaving group and to substitution when there is',
  viewBox: '0 0 730 380',
  build() {
    let s = '';
    // Starting carbonyl
    const c = P(120, 130), o = P(120, 74), lg = P(176, 158);
    s += bond(c, o, { order: 2 });
    s += atom(o.x, o.y, 'O');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += bond(c, lg, { rTo: 15 });
    s += atom(lg.x, lg.y, 'L');
    s += text(120, 176, 'L = anything', { cls: 'fg-sm', size: 9.5 });
    s += curve(P(56, 150), P(108, 140), { bow: -18 });
    s += text(40, 138, 'Nu⁻', { cls: 'fg-lbl', size: 12 });

    s += arrow(P(216, 130), P(276, 130));

    // The tetrahedral intermediate
    const tc = P(340, 130), to = P(340, 74), tl = P(396, 158);
    s += bond(tc, to);
    s += atom(to.x, to.y, 'O⁻', { kind: 'warn' });
    s += atom(tc.x, tc.y, 'C', { kind: 'hi' });
    s += bond(tc, tl, { rTo: 15 });
    s += atom(tl.x, tl.y, 'L');
    s += bond(tc, P(284, 158), { rTo: 14 });
    s += atom(284, 158, 'Nu');
    s += tag(340, 44, 'tetrahedral intermediate');

    s += rule(452, 40, 452, 360);

    // Branch A: no leaving group -> addition
    s += tag(586, 40, 'L cannot leave  →  ADDITION');
    const ac = P(560, 104);
    s += bond(ac, P(560, 62));
    s += atom(560, 62, 'OH');
    s += atom(ac.x, ac.y, 'C', { kind: 'hi' });
    s += bond(ac, P(508, 130), { rTo: 14 });
    s += atom(508, 130, 'Nu');
    s += text(566, 152, 'H⁺ picks up the O⁻ — the carbonyl is gone', { cls: 'fg-sm', size: 10 });
    s += text(566, 170, 'aldehydes and ketones', { cls: 'fg-tag-good', size: 10.5 });

    // Branch B: leaving group -> substitution
    s += tag(586, 214, 'L can leave  →  SUBSTITUTION');
    const bc = P(560, 276), bo = P(560, 234);
    s += bond(bc, bo, { order: 2 });
    s += atom(bo.x, bo.y, 'O');
    s += atom(bc.x, bc.y, 'C', { kind: 'hi' });
    s += bond(bc, P(508, 302), { rTo: 14 });
    s += atom(508, 302, 'Nu');
    s += curve(P(596, 292), P(640, 300), { bow: 16, muted: true });
    s += text(660, 306, 'L⁻', { cls: 'fg-sm', size: 11, anchor: 'start' });
    s += text(566, 332, 'the C=O comes back', { cls: 'fg-sm', size: 10 });
    s += text(566, 350, 'esters, amides, acid chlorides', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'One mechanism, then a fork. Every nucleophile that meets a carbonyl does the same two things — attack the carbon, push the pi electrons onto oxygen — and arrives at the same <b>tetrahedral intermediate</b>. What happens next is decided entirely by whether the carbon is carrying a group that can leave.',
  note: 'This is why aldehydes and ketones give alcohols and esters and amides give other acid derivatives, and it is one fact rather than two: with nothing to expel, the alkoxide simply grabs a proton and the carbonyl is gone for good; with a leaving group attached, the oxygen pushes back down, kicks it out, and the C=O is restored. Everything in <a class="chapter-ref" href="/ochem/learn.html#m-carboxylic-acids">Carboxylic Acids &amp; Derivatives</a> is the right-hand branch.',
});

/* ------------------------------------------------------------- 11.1 ---
   The acid-catalyzed order, drawn. The notes name three species and the
   section's two other figures are both the basic pathway, so the mechanism
   that every later chapter reuses had no picture at all. */
FIGURES.push({
  id: 'acid-catalyzed-addition',
  section: 'nucleophilic-addition',
  anchor: 'Count the protons across the whole sequence and the catalyst comes back out, which is what makes it catalytic.</p>',
  alt: 'Four panels showing acid-catalyzed addition to a ketone. First a lone pair on the carbonyl oxygen takes a proton. Second, the resulting cation — the oxocarbenium ion — is drawn as its two resonance contributors, one with the double bond and the charge on oxygen, one with the charge on carbon and only a sextet there. Third, a neutral alcohol attacks that carbon with a lone pair, giving a positively charged oxygen on the added group. Fourth, a base removes that proton, giving the neutral addition product and handing the catalyst back.',
  viewBox: '0 0 760 528',
  build() {
    let s = '';
    const cell = (x, y, t) => panel(x, y, 360, 208) + tag(x + 180, y + 28, t);

    /* One carbonyl unit: the carbon, its two R groups, and the oxygen above
       it. `order` is 2 for a C=O and 1 once the pi bond has been used up. */
    const unit = (c, order, oLabel, degs) => {
      const o = armEnd(c, 90, 56);
      const d = degs || [214, 326];
      const r1 = armEnd(c, d[0], 46), r2 = armEnd(c, d[1], 46);
      let g = bond(c, o, { order, rTo: 15 });
      g += bond(c, r1, { rTo: 13 }) + atom(r1.x, r1.y, 'R', { r: 13 });
      g += bond(c, r2, { rTo: 13 }) + atom(r2.x, r2.y, 'R', { r: 13 });
      g += atom(o.x, o.y, oLabel || 'O');
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, o, r1, r2 };
    };

    // ---- 1. protonate the oxygen ----
    s += cell(8, 16, 'STEP 1 · ACID PROTONATES THE OXYGEN');
    const c1 = P(118, 146);
    const u1 = unit(c1, 2);
    s += u1.g;
    s += lonePair(u1.o.x, u1.o.y, 232, { dist: 23 }) + lonePair(u1.o.x, u1.o.y, 308, { dist: 23 });
    const hp = P(262, 96);
    s += atom(hp.x, hp.y, 'H', { r: 13, kind: 'hi' });
    s += text(hp.x + 22, hp.y - 12, '+', { cls: 'fg-warn', size: 15 });
    s += curve(P(u1.o.x + 18, u1.o.y - 12), P(hp.x - 14, hp.y - 4), { bow: -20 });
    s += text(188, 210, 'the basic site is the oxygen, not the carbon', { cls: 'fg-sm', size: 9.5 });

    // ---- 2. the activated cation, two contributors ----
    s += cell(392, 16, 'STEP 2 · THE OXOCARBENIUM ION');
    const c2 = P(482, 146);
    const u2 = unit(c2, 2, 'O');
    s += u2.g;
    s += text(u2.o.x + 24, u2.o.y - 12, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += text(u2.o.x - 22, u2.o.y - 14, '+', { cls: 'fg-warn', size: 15 });
    s += curve(P(c2.x + 14, c2.y - 34), P(u2.o.x + 14, u2.o.y + 16), { bow: -18 });
    s += text(578, 146, '↔', { cls: 'fg-lbl', size: 20 });
    const c3 = P(660, 146);
    const u3 = unit(c3, 1, 'O');
    s += u3.g;
    s += text(u3.o.x + 24, u3.o.y - 12, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += lonePair(u3.o.x, u3.o.y, 232, { dist: 23 });
    s += text(c3.x - 26, c3.y - 14, '+', { cls: 'fg-warn', size: 15 });
    s += text(482, 210, 'charge on O, every octet full', { cls: 'fg-sm', size: 9.5 });
    s += text(660, 210, 'charge on C, a SEXTET there —', { cls: 'fg-tag-warn', size: 10 });
    s += text(660, 224, 'this is what gets attacked', { cls: 'fg-tag-warn', size: 10 });

    // ---- 3. the neutral nucleophile adds ----
    s += cell(8, 248, 'STEP 3 · A NEUTRAL ALCOHOL ADDS');
    const c4 = P(118, 380);
    const u4 = unit(c4, 1, 'O', [200, 268]);
    s += u4.g;
    s += text(u4.o.x + 24, u4.o.y - 12, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += text(c4.x - 26, c4.y - 14, '+', { cls: 'fg-warn', size: 15 });
    const nu = P(268, 404);
    s += atom(nu.x, nu.y, 'O', { kind: 'hi' });
    s += text(nu.x + 22, nu.y - 14, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(nu.x + 22, nu.y + 22, 'R', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += lonePair(nu.x, nu.y, 186, { dist: 23 });
    s += curve(P(nu.x - 24, nu.y - 6), P(c4.x + 18, c4.y + 6), { bow: 20 });
    s += text(188, 444, 'no alkoxide anywhere — in acid the', { cls: 'fg-sm', size: 9.5 });
    s += text(188, 458, 'nucleophile arrives neutral', { cls: 'fg-sm', size: 9.5 });

    // ---- 4. lose the proton ----
    s += cell(392, 248, 'STEP 4 · LOSE THE EXTRA PROTON');
    const c5 = P(502, 380);
    const u5 = unit(c5, 1, 'O', [200, 268]);
    s += u5.g;
    s += text(u5.o.x + 24, u5.o.y - 12, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    const op = armEnd(c5, 20, 62);
    s += bond(c5, op, { rTo: 15 });
    s += atom(op.x, op.y, 'O', { kind: 'hi' });
    s += text(op.x + 22, op.y - 6, '+', { cls: 'fg-warn', size: 15 });
    s += text(op.x + 4, op.y + 30, 'R', { cls: 'fg-sm', size: 10, anchor: 'middle' });
    const hx = armEnd(op, 60, 42);
    s += bond(op, hx, { rTo: 12 }) + atom(hx.x, hx.y, 'H', { r: 12, kind: 'warn' });
    const base = P(hx.x - 54, hx.y - 30);
    s += text(base.x, base.y, 'ROH', { cls: 'fg-sm', size: 10 });
    s += curve(P(base.x + 20, base.y + 8), P(hx.x - 6, hx.y - 12), { bow: -14 });
    s += text(572, 444, 'a second alcohol takes it, and the acid', { cls: 'fg-sm', size: 9.5 });
    s += text(572, 458, 'is handed back — it was a catalyst', { cls: 'fg-sm', size: 9.5 });

    s += rule(30, 474, 730, 474);
    s += text(380, 496, 'BASE activates the nucleophile, and protonates at the end.', { cls: 'fg-lbl', size: 11 });
    s += text(380, 512, 'ACID activates the electrophile, and deprotonates at the end.', { cls: 'fg-lbl', size: 11 });
    return s;
  },
  caption: 'The order reversed, with arrows. Under base a charged nucleophile hits a neutral carbonyl and the alkoxide is protonated afterwards; under acid the proton goes on <i>first</i>, and what a weak neutral nucleophile then attacks is the oxocarbenium ion, whose second contributor puts the positive charge on carbon and leaves only six electrons there.',
  note: 'Learn the shape rather than the four pictures: <b>protonate, add, deprotonate</b>. Acetal formation is this run twice, imine formation is this plus a dehydration, and ester hydrolysis is this with a leaving group on the carbon. The proton count is the tell that something has gone wrong in a mechanism — if the catalyst does not come back out, a step is missing.',
});

/* ------------------------------------------------------------- 11.2 ---
   Hydride and Grignard, drawn on the SAME aldehyde. Four paragraphs of
   reagent prose and the chapter's most important C–C bond had no drawn
   example anywhere; putting both on propanal also makes the counting
   argument visible instead of asserted. */
FIGURES.push({
  id: 'hydride-vs-grignard',
  section: 'nucleophilic-addition',
  anchor: 'Derived this way the rule survives a substrate you have never seen.</p>',
  alt: 'Two rows, both starting from propanal. In the top row a hydride from sodium borohydride attacks the carbonyl carbon while the pi bond moves onto oxygen; the alkoxide is protonated on workup to give propan-1-ol, a primary alcohol. In the bottom row a methyl group from methylmagnesium bromide attacks the same carbon, making a new carbon-carbon bond, and workup gives butan-2-ol, a secondary alcohol.',
  viewBox: '0 0 760 500',
  build() {
    let s = '';

    /* Propanal drawn skeletally, with the carbonyl carbon labeled because
       every arrow in the figure starts or ends on it. `top` is what sits on
       the oxygen: a double bond before attack, a single bond after. */
    const propanal = (X, Y, opts = {}) => {
      const c = P(X + 84, Y), o = P(X + 84, Y - 52);
      const v1 = P(X + 42, Y + 26), me = P(X, Y);
      let g = bond(me, v1, { rFrom: 17, rTo: 0 }) + bond(v1, c, { rFrom: 0, rTo: 15 });
      g += atom(v1.x, v1.y, '', { kind: 'point' });
      g += atom(me.x, me.y, 'CH₃', { r: 17, size: 10 });
      g += bond(c, o, { order: opts.single ? 1 : 2, rTo: 15 });
      const h = P(X + 126, Y + 26);
      g += bond(c, h, { rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12 });
      g += atom(o.x, o.y, 'O', { kind: opts.oKind || 'plain' });
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, c, o, h };
    };

    const row = (Y, cfg) => {
      let g = '';
      g += tag(18, Y - 86, cfg.title, { anchor: 'start' });

      // --- frame 1: the attack, with both arrows ---
      const A = propanal(28, Y);
      g += A.g;
      const nu = P(A.c.x - 4, A.c.y + 74);
      g += atom(nu.x, nu.y, cfg.nu, { kind: 'hi', r: cfg.nu.length > 1 ? 18 : 15 });
      g += text(nu.x + (cfg.nu.length > 1 ? 24 : 20), nu.y - 12, '−', { cls: 'fg-hi', size: 15 });
      g += curve(P(nu.x - 6, nu.y - (cfg.nu.length > 1 ? 20 : 17)), P(A.c.x - 8, A.c.y + 17), { bow: 14 });
      g += curve(P(A.c.x + 16, A.c.y - 20), P(A.o.x + 16, A.o.y + 16), { bow: -26 });
      g += text(112, Y + 106, cfg.reagent, { cls: 'fg-sm', size: 9.5 });

      g += arrow(P(228, Y - 6), P(276, Y - 6), { muted: true });

      // --- frame 2: the alkoxide ---
      const B = propanal(302, Y, { single: true, oKind: 'hi' });
      g += B.g;
      g += text(B.o.x + 22, B.o.y - 10, '−', { cls: 'fg-hi', size: 15 });
      const nb = P(B.c.x - 4, B.c.y + 52);
      g += bond(B.c, nb, { rTo: cfg.nu.length > 1 ? 17 : 13 });
      g += atom(nb.x, nb.y, cfg.nu, { r: cfg.nu.length > 1 ? 17 : 13, size: cfg.nu.length > 1 ? 10 : 11, kind: 'hi' });
      g += text(386, Y + 106, 'tetrahedral alkoxide', { cls: 'fg-sm', size: 9.5 });

      g += arrow(P(502, Y - 6), P(550, Y - 6), { muted: true });
      g += text(526, Y - 22, 'H₃O⁺', { cls: 'fg-sm', size: 9.5 });

      // --- frame 3: the alcohol ---
      const C = propanal(576, Y, { single: true });
      g += C.g;
      const oh = P(C.o.x + 26, C.o.y - 4);
      g += text(oh.x, oh.y, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
      const nc = P(C.c.x - 4, C.c.y + 52);
      g += bond(C.c, nc, { rTo: cfg.nu.length > 1 ? 17 : 13 });
      g += atom(nc.x, nc.y, cfg.nu, { r: cfg.nu.length > 1 ? 17 : 13, size: cfg.nu.length > 1 ? 10 : 11 });
      g += text(648, Y + 106, cfg.product, { cls: 'fg-tag-good', size: 10.5 });
      g += text(648, Y + 122, cfg.count, { cls: 'fg-sm', size: 9.5 });
      return g;
    };

    s += row(120, {
      title: 'HYDRIDE — THE NUCLEOPHILE THAT BRINGS NO CARBON',
      nu: 'H', reagent: '1. NaBH₄ (or LiAlH₄)  2. H₃O⁺',
      product: 'propan-1-ol · 1° alcohol',
      count: 'carbinol carbon: ONE carbon',
    });
    s += rule(30, 268, 730, 268);
    s += row(360, {
      title: 'GRIGNARD — THE NUCLEOPHILE THAT BRINGS ONE',
      nu: 'CH₃', reagent: '1. CH₃MgBr, dry ether  2. H₃O⁺',
      product: 'butan-2-ol · 2° alcohol',
      count: 'carbinol carbon: TWO carbons',
    });
    return s;
  },
  caption: 'One aldehyde, two nucleophiles, and the only difference in the mechanism is what the nucleophile carries in with it. Both rows are the same two arrows — nucleophile to carbon, pi bond up onto oxygen — and both stop at an alkoxide that needs the workup step to become an alcohol.',
  note: 'Read the last column rather than memorizing the rule. Propanal’s carbonyl carbon starts with one carbon substituent; hydride adds none, so the product carbon still has one and the alcohol is primary; the Grignard adds one, so the product carbon has two and the alcohol is secondary. Do that arithmetic on any carbonyl and the 1°/2°/3° rule falls out, including for substrates the rule was never stated for.',
});

export default FIGURES;
