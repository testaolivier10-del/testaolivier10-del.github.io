/* Figures for the acyl-chlorides-anhydrides notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 55 ---
   The ladder is usually drawn as a list. Drawing it as a one-way staircase,
   with the acid sitting off to the side and one arrow climbing back up, says
   the thing the list cannot: there is exactly one way up, and you take it
   first. */
FIGURES.push({
  id: 'one-way-ladder',
  section: 'acyl-chlorides-anhydrides',
  anchor: '<h3>What an acid chloride then does</h3>',
  viewBox: '0 0 760 320',
  alt: 'Four acyl derivatives on descending steps with downward arrows between them, and a single upward arrow labeled SOCl2 from the carboxylic acid',
  build() {
    let s = '';
    const steps = [
      { y: 58,  lab: 'acid chloride', sub: 'leaving group: Cl\u207b' },
      { y: 116, lab: 'anhydride',     sub: 'leaving group: RCOO\u207b' },
      { y: 174, lab: 'ester',         sub: 'leaving group: RO\u207b' },
      { y: 232, lab: 'amide',         sub: 'leaving group: R\u2082N\u207b' },
    ];
    steps.forEach((st, i) => {
      s += panel(300 + i * 26, st.y - 22, 250, 44, { kind: i === 0 ? null : null });
      s += text(316 + i * 26, st.y - 4, st.lab, { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
      s += text(316 + i * 26, st.y + 14, st.sub, { cls: 'fg-sm', size: 10, anchor: 'start' });
      if (i < steps.length - 1) {
        s += arrow(P(560 + i * 26, st.y + 6), P(574 + i * 26, st.y + 36));
      }
    });
    s += text(650, 40, 'down, freely', { cls: 'fg-tag-good', size: 11 });

    // The acid, off to the side, and the one arrow back up.
    s += panel(24, 152, 210, 66, { kind: 'warn' });
    s += text(40, 176, 'carboxylic acid', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(40, 196, 'pK\u2090 4\u20135: it protonates', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(40, 210, 'the nucleophile instead', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += arrow(P(240, 160), P(296, 62));
    s += text(236, 118, 'SOCl\u2082', { cls: 'fg-tag-good', size: 12, anchor: 'start' });
    s += text(236, 134, 'the usual way up', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += rule(24, 262, 700, 262);
    s += text(24, 286, 'Every step down expels a leaving group more basic than the one before it.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(24, 308, 'Nothing climbs, because that would mean expelling the WORSE of the two \u2014 hence the detour.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    return s;
  },
  caption: 'The ranking is read straight off the leaving group: chloride, then carboxylate, then alkoxide, then amide anion, each more basic and so less willing to go than the last. Going down means the tetrahedral intermediate expels the better of the two groups it holds, which is what it does anyway; going up would mean expelling the worse one, which is why the list is one-way and why almost every route out of a carboxylic acid opens with the same move.',
  note: 'The acid is drawn beside the ladder rather than on it because its problem is not really its position. On reactivity alone it would sit between the anhydride and the ester, but it carries a proton, and any nucleophile good enough to attack is basic enough to take that proton first. What you get is an ammonium carboxylate: the nucleophile protonated, the electrophile now anionic, and both halves of the reaction switched off by a proton transfer faster than anything else in the flask.',
});

/* ---------------------------------------------------------------- 170 ---
   The chlorosulfite. The section hangs the whole activation argument on it and
   no structure of one appears anywhere in the course. */
FIGURES.push({
  id: 'chlorosulfite-self-destructs',
  section: 'acyl-chlorides-anhydrides',
  anchor: 'One reagent, one idea, two functional groups.</div>',
  viewBox: '0 0 760 400',
  alt: 'Thionyl chloride converting a carboxylic acid OH into a chlorosulfite, then chloride attacking the acyl carbon and the leaving group falling apart into sulfur dioxide and chloride',
  build() {
    let s = '';
    let c = P(150, 110);
    s += bond(c, P(150, 64), { order: 2 }); s += bond(c, P(194, 138)); s += bond(c, P(106, 138));
    s += bond(P(194, 138), P(234, 156), { rTo: 10 });
    s += atom(150, 64, 'O'); s += lonePair(150, 64, 200);
    s += atom(194, 138, 'O'); s += lonePair(194, 138, 60);
    s += atom(234, 156, 'H', { r: 10 }); s += atom(106, 138, 'R');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += bond(P(300, 110), P(300, 64), { order: 2 });
    s += bond(P(300, 110), P(344, 138), { rTo: 17 });
    s += bond(P(300, 110), P(256, 64), { rTo: 17 });
    s += atom(300, 64, 'O'); s += atom(344, 138, 'Cl', { r: 17 }); s += atom(256, 64, 'Cl', { r: 17 });
    s += atom(300, 110, 'S', { kind: 'warn' });
    s += curve(P(212, 124), P(282, 118), { bow: -22 });
    s += tag(230, 192, 'the OH oxygen attacks sulfur');

    s += arrow(P(390, 110), P(438, 110));

    c = P(500, 110);
    s += bond(c, P(500, 64), { order: 2 }); s += bond(c, P(544, 138)); s += bond(c, P(456, 138));
    s += bond(P(544, 138), P(588, 110));
    s += bond(P(588, 110), P(588, 64), { order: 2 });
    s += bond(P(588, 110), P(632, 138), { rTo: 17 });
    s += atom(500, 64, 'O'); s += atom(456, 138, 'R');
    s += atom(544, 138, 'O'); s += atom(588, 64, 'O'); s += atom(632, 138, 'Cl', { r: 17 });
    s += atom(588, 110, 'S', { kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += tag(560, 192, 'a chlorosulfite: an excellent leaving group');

    s += rule(24, 220, 726, 220);

    s += atom(60, 300, 'Cl', { kind: 'warn', r: 17 }); s += text(86, 280, '−', { cls: 'fg-hi', size: 15 });
    c = P(180, 300);
    s += bond(c, P(180, 254), { order: 2 }); s += bond(c, P(224, 328)); s += bond(c, P(136, 328));
    s += bond(P(224, 328), P(268, 300));
    s += bond(P(268, 300), P(268, 254), { order: 2 });
    s += bond(P(268, 300), P(312, 328), { rTo: 17 });
    s += atom(180, 254, 'O'); s += atom(136, 328, 'R'); s += atom(224, 328, 'O');
    s += atom(268, 254, 'O'); s += atom(312, 328, 'Cl', { r: 17 });
    s += atom(268, 300, 'S', { kind: 'warn' });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(80, 292), P(162, 292), { bow: -22 });

    s += arrow(P(360, 300), P(428, 300));

    c = P(500, 300);
    s += bond(c, P(500, 254), { order: 2 }); s += bond(c, P(544, 328), { rTo: 17 }); s += bond(c, P(456, 328));
    s += atom(500, 254, 'O'); s += atom(456, 328, 'R'); s += atom(544, 328, 'Cl', { kind: 'hi', r: 17 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(646, 296, '+ SO₂ + Cl⁻', { cls: 'fg-lbl', size: 13 });

    s += tag(200, 382, 'chloride attacks; the intermediate collapses');
    s += tag(560, 382, 'acid chloride, and two gases');
    return s;
  },
  caption: 'Thionyl chloride does not replace the OH directly. It converts it into a chlorosulfite — a leaving group that destroys itself. When it departs it immediately falls apart into SO₂ gas and chloride, so there is nothing left in the flask that could put the OH back.',
  note: 'Compare this with the same reagent on an alcohol in the alcohols chapter and the two are one reaction: an OH that will not leave is converted into a group that will, and the driving force in both cases is a by-product that leaves as a gas. That is also why the workup is an evaporation rather than a separation.',
});

/* ---------------------------------------------------------------- 171 ---
   Aspirin. The section names it as the headline application and the exam
   question turns on WHICH of salicylic acid’s two oxygens is acetylated. */
FIGURES.push({
  id: 'aspirin-acetylates-the-phenol',
  section: 'acyl-chlorides-anhydrides',
  anchor: 'Two different acyl groups sharing the oxygen give a mixed anhydride, named for both.</p>',
  viewBox: '0 0 760 330',
  alt: 'Salicylic acid reacting with acetic anhydride, with the phenol OH highlighted as the group that is acetylated, giving aspirin plus acetic acid',
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
    // COOH on p1 (upper right), OH on p2 (lower right)
    s += bond(p[1], P(240, 108), { rFrom: 0 });
    s += bond(P(240, 108), P(240, 62), { order: 2 });
    s += bond(P(240, 108), P(284, 130), { rTo: 16 });
    s += atom(240, 62, 'O'); s += atom(284, 130, 'OH');
    s += atom(240, 108, 'C', { kind: 'hi' });
    s += bond(p[2], P(240, 212), { rFrom: 0, rTo: 16 });
    s += atom(240, 212, 'OH', { kind: 'warn' });
    s += text(250, 250, 'the phenol OH', { cls: 'fg-tag-warn', size: 11 });
    s += tag(130, 44, 'salicylic acid');

    s += arrow(P(330, 160), P(410, 160));
    s += text(370, 144, '(CH₃CO)₂O', { cls: 'fg-lbl', size: 13 });

    // aspirin
    ctr = P(490, 160);
    p = hex(490, 160, 48);
    s += drawRing(p, ctr);
    s += bond(p[1], P(580, 108), { rFrom: 0 });
    s += bond(P(580, 108), P(580, 62), { order: 2 });
    s += bond(P(580, 108), P(624, 130), { rTo: 16 });
    s += atom(580, 62, 'O'); s += atom(624, 130, 'OH');
    s += atom(580, 108, 'C');
    s += bond(p[2], P(580, 212), { rFrom: 0 });
    s += bond(P(580, 212), P(624, 236));
    s += bond(P(624, 236), P(624, 282), { order: 2 });
    s += bond(P(624, 236), P(668, 212));
    s += atom(580, 212, 'O', { kind: 'warn' });
    s += atom(624, 282, 'O'); s += atom(668, 212, 'CH₃');
    s += atom(624, 236, 'C', { kind: 'hi' });
    s += tag(486, 44, 'aspirin  ·  + acetic acid');

    s += rule(24, 296, 726, 296);
    s += text(24, 322, 'The carboxyl OH is untouched — it is the phenol that gets acetylated.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    return s;
  },
  caption: 'Salicylic acid has two OH groups and only one of them reacts. Acetic anhydride acetylates the <b>phenol</b>, giving an ester there and leaving the carboxylic acid alone — which is why aspirin is still an acid, and still tastes like one.',
  note: 'Why the phenol and not the carboxyl? Because acylating a carboxylic acid would give a mixed anhydride, which is on the same rung of the ladder as the anhydride you started with and so gains nothing. Acylating the phenol gives an ester, which is a rung down. The reaction picks the direction the ladder allows.',
});

/* ------------------------------------------------------------- 230.1 ---
   Succinic anhydride and succinimide. The Cyclic anhydrides paragraph walks a
   diacid through two ring closures and a ring opening in three sentences and
   draws none of the four structures. */
FIGURES.push({
  id: 'succinic-anhydride-imide',
  section: 'acyl-chlorides-anhydrides',
  anchor: 'Heating that loses water again and closes the ring to the <b>imide</b>, as in succinimide and phthalimide.</p>',
  viewBox: '0 0 760 420',
  alt: 'Succinic acid drawn with its two carboxyl groups turned toward each other; heating removes water and closes a five-membered ring, succinic anhydride, with one oxygen between two carbonyls. Ammonia opens the ring at one carbonyl to give an open chain with an amide at one end and a carboxylic acid at the other. Heating again removes water and closes the five-membered ring on nitrogen, giving succinimide, with an N-H between two carbonyls.',
  build() {
    let s = '';
    /* Five ring positions, vertex 0 at the top and the rest clockwise. The
       open-chain compounds use vertices 1 to 4 only, so the four carbons sit
       exactly where they will sit in the ring they are about to close. */
    const five = (cx, cy, r) => Array.from({ length: 5 }, (_, i) => {
      const a = ((-90 + i * 72) * Math.PI) / 180;
      return P(cx + r * Math.cos(a), cy + r * Math.sin(a));
    });
    const out = (c, v, d) => {                      // a point d beyond v, away from the ring centre c
      const L = Math.hypot(v.x - c.x, v.y - c.y);
      return P(v.x + ((v.x - c.x) / L) * d, v.y + ((v.y - c.y) / L) * d);
    };
    const carbonylO = (c, v) => {
      const o = out(c, v, 34);
      return bond(v, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
    };

    /* A closed ring: heteroatom at the top, carbonyls either side of it. */
    const ring = (cx, cy, het, hetR) => {
      const c = P(cx, cy), v = five(cx, cy, 40);
      let g = '';
      g += bond(v[0], v[1], { rFrom: hetR, rTo: 0 });
      g += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
      g += bond(v[2], v[3], { rFrom: 0, rTo: 0 });
      g += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
      g += bond(v[4], v[0], { rFrom: 0, rTo: hetR });
      g += carbonylO(c, v[1]) + carbonylO(c, v[4]);
      for (const q of v.slice(1)) g += atom(q.x, q.y, '', { kind: 'point' });
      g += atom(v[0].x, v[0].y, het, { kind: 'hi', r: hetR });
      return g;
    };

    /* An open chain, C(=O)X–CH2–CH2–C(=O)Y, with X and Y turned inward. */
    const chain = (cx, cy, left, right) => {
      const c = P(cx, cy), v = five(cx, cy, 46);
      let g = '';
      g += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
      g += bond(v[2], v[3], { rFrom: 0, rTo: 0 });
      g += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
      g += carbonylO(c, v[1]) + carbonylO(c, v[4]);
      const a = (-62 * Math.PI) / 180;
      const xl = P(v[4].x + Math.cos(a) * 36, v[4].y + Math.sin(a) * 36);
      const xr = P(v[1].x - Math.cos(a) * 36, v[1].y + Math.sin(a) * 36);
      g += bond(v[4], xl, { rFrom: 0, rTo: left.r });
      g += bond(v[1], xr, { rFrom: 0, rTo: right.r });
      for (const q of v.slice(1)) g += atom(q.x, q.y, '', { kind: 'point' });
      g += atom(xl.x, xl.y, left.l, { r: left.r, kind: left.kind });
      g += atom(xr.x, xr.y, right.l, { r: right.r, kind: right.kind });
      return g;
    };

    const Y1 = 128;
    /* 1. succinic acid */
    s += tag(100, 36, 'SUCCINIC ACID');
    s += chain(100, Y1, { l: 'OH', r: 15 }, { l: 'OH', r: 15 });
    s += text(100, 198, 'a four-carbon diacid', { cls: 'fg-sm', size: 10 });

    s += arrow(P(200, Y1), P(256, Y1));
    s += text(228, Y1 - 12, 'heat', { cls: 'fg-tag', size: 10.5 });
    s += text(228, Y1 + 22, '− H₂O', { cls: 'fg-sm', size: 10 });

    /* 2. succinic anhydride */
    s += tag(346, 36, 'SUCCINIC ANHYDRIDE');
    s += ring(346, Y1 + 4, 'O', 15);
    s += text(346, 198, 'O between two C=O, in a ring', { cls: 'fg-sm', size: 10 });

    s += arrow(P(438, Y1), P(502, Y1));
    s += text(470, Y1 - 12, 'NH₃', { cls: 'fg-tag', size: 10.5 });
    s += text(470, Y1 + 22, 'opens one C=O', { cls: 'fg-sm', size: 10 });

    /* 3. the amic acid */
    s += tag(600, 36, 'THE AMIC ACID');
    s += chain(600, Y1, { l: 'H₂N', r: 17, kind: 'hi' }, { l: 'OH', r: 15 });
    s += text(600, 198, 'an amide and an acid, still tethered', { cls: 'fg-sm', size: 10 });

    /* 4. down to succinimide */
    s += arrow(P(600, 210), P(600, 258));
    s += text(614, 236, 'heat', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    s += text(614, 252, '− H₂O', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += ring(600, 318, 'NH', 17);
    s += tag(600, 386, 'SUCCINIMIDE');
    s += text(600, 404, 'N–H between two C=O, in a ring', { cls: 'fg-sm', size: 10 });

    /* The comparison, in the space the L-shaped path leaves. */
    s += panel(40, 238, 440, 124);
    s += text(60, 266, 'Anhydride and imide are the same five-membered ring.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(60, 290, 'Only the atom between the two carbonyls changes: O in the', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(60, 308, 'anhydride, N in the imide. The ring opening in between is an', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(60, 326, 'ordinary acyl substitution whose leaving group, a carboxylate,', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(60, 344, 'stays attached to the product.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The four structures of the paragraph above, in order. The two ring closures are both condensations, each losing one water, and each closes a five-membered ring: the four carbons of the chain plus one heteroatom. Unlabeled corners are CH₂ groups or carbonyl carbons.',
  note: 'Draw the open chains curled, as here, and the ring closure stops being a surprise: the two ends of a four-carbon chain already sit within reach of each other, and joining them through one more atom gives a five-membered ring with almost no strain. A primary amine R–NH₂ in place of ammonia runs the same sequence and gives the N-substituted imide, with R where the H is drawn.',
});

export default FIGURES;
