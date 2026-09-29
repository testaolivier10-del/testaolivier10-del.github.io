/* Figures for the acidity-factors notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 113 ---
   "Phenoxide delocalizes its charge into the aromatic ring" was a sentence
   with no picture, in a section whose own pitfall box says to draw both
   conjugate bases before reasoning. */
FIGURES.push({
  id: 'phenoxide-resonance',
  section: 'acidity-factors',
  anchor: 'Six units more acidic than an alcohol, five units less acidic than a carboxylic acid.</p>',
  alt: 'The four resonance structures of phenoxide: the charge on oxygen, then on the ortho, para and other ortho carbons of the ring',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += tag(380, 34, 'WHERE PHENOXIDE’S CHARGE ACTUALLY GOES');

    /* Ring vertices, index 0 at the top (bearing the oxygen), then clockwise:
       1 and 5 are ortho, 2 and 4 are meta, 3 is para. When the charge moves
       off oxygen and onto a ring carbon, the C\u2013O bond becomes a C=O double
       bond \u2014 that is the bond the electrons came out of, and leaving it
       single is the commonest way this picture is drawn wrongly. */
    const drawRing = (cx, cy, r, chargeAt, doubles) => {
      let g = '';
      const onO = chargeAt === 'o';
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        v.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
      }
      const mid = P(cx, cy);
      for (let i = 0; i < 6; i++) {
        const a = v[i], b = v[(i + 1) % 6];
        if (doubles.includes(i)) g += ringDouble(a, b, mid, { gap: 4.4, inset: 9 });
        else g += bond(a, b, { rFrom: 0, rTo: 0 });
      }
      const o = P(cx, cy - r - 40);
      g += bond(v[0], o, { rFrom: 0, rTo: 15, order: onO ? 1 : 2 });
      g += atom(o.x, o.y, 'O', { kind: onO ? 'hi' : 'plain', size: 11 });
      for (const ang of onO ? [-40, -90, -140] : [-40, -140]) g += lonePair(o.x, o.y, ang, { dist: 23 });
      if (onO) g += text(o.x + 26, o.y - 4, '\u2212', { cls: 'fg-hi', size: 15 });
      for (let i = 0; i < 6; i++) {
        g += atom(v[i].x, v[i].y, '', { kind: 'point' });
        if (chargeAt === i) {
          const dx = v[i].x - cx, dy = v[i].y - cy;
          const len = Math.hypot(dx, dy) || 1;
          g += text(v[i].x + (dx / len) * 20, v[i].y + (dy / len) * 20 + 4, '\u2212', { cls: 'fg-hi', size: 15 });
        }
      }
      return g;
    };

    const cy = 170, r = 36;
    s += drawRing(96, cy, r, 'o', [0, 2, 4]);
    s += drawRing(288, cy, r, 1, [2, 4]);
    s += drawRing(480, cy, r, 3, [1, 4]);
    s += drawRing(672, cy, r, 5, [1, 3]);

    for (const x of [192, 384, 576]) {
      s += arrow(P(x - 20, cy), P(x + 20, cy), { muted: true });
      s += arrow(P(x + 20, cy + 12), P(x - 20, cy + 12), { muted: true });
    }

    s += text(96, 254, 'charge on oxygen', { cls: 'fg-tag-good', size: 10.5 });
    s += text(96, 272, 'the major contributor', { cls: 'fg-sm', size: 10 });
    s += text(288, 254, 'ortho carbon', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(480, 254, 'para carbon', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(672, 254, 'the other ortho', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(480, 272, 'three carbon contributors — real, but each worth less than the oxygen one', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Four contributors, and the reason phenol lands at pKa 10 rather than at an alcohol’s 16. The charge is genuinely shared with three ring carbons, which is worth six pKa units — and it is still not worth as much as acetate’s deal, where the other place to put the charge is a second oxygen.',
  note: 'Count which positions get the charge: ortho, para, ortho. The meta carbons never receive it, and that pattern is not a detail of this molecule &mdash; it is the same ortho/para bias that decides where substituents end up on a benzene ring later in the course. The arrows that delocalize a phenoxide and the arrows that direct an aromatic substitution are the same arrows.',
});

/* ---------------------------------------------------------------- 114 ---
   The 1,3-dicarbonyl worked example said "the anion now delocalizes onto two
   oxygens rather than one" and drew nothing, which is the one claim in the
   section a picture settles instantly. */
FIGURES.push({
  id: 'diketone-enolate',
  section: 'acidity-factors',
  anchor: '<p>That is roughly as acidic as phenol, and more acidic than ammonium — from a hydrogen on carbon. This is why 1,3-dicarbonyls are the workhorse nucleophiles of',
  alt: 'The three resonance structures of the pentane-2,4-dione anion, with the negative charge on the central carbon and then on each of the two oxygens',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    s += tag(380, 34, 'ONE CHARGE, THREE PLACES TO PUT IT');

    /* Left carbonyl, central carbon, right carbonyl. `on` says where the
       charge sits: 'c', 'left' or 'right'. */
    const unit = (ox, on) => {
      let g = '';
      const mL = P(ox, 168), cL = P(ox + 44, 138), oL = P(ox + 44, 84);
      const cc = P(ox + 88, 168);
      const cR = P(ox + 132, 138), oR = P(ox + 132, 84), mR = P(ox + 176, 168);
      g += bond(mL, cL, { rFrom: 0, rTo: 0 });
      g += bond(cL, oL, { rFrom: 0, rTo: 15, order: on === 'left' ? 1 : 2 });
      g += bond(cL, cc, { rFrom: 0, rTo: 0, order: on === 'left' ? 2 : 1 });
      g += bond(cc, cR, { rFrom: 0, rTo: 0, order: on === 'right' ? 2 : 1 });
      g += bond(cR, oR, { rFrom: 0, rTo: 15, order: on === 'right' ? 1 : 2 });
      g += bond(cR, mR, { rFrom: 0, rTo: 0 });
      for (const pt of [mL, cL, cc, cR, mR]) g += atom(pt.x, pt.y, '', { kind: 'point' });
      g += atom(oL.x, oL.y, 'O', { kind: on === 'left' ? 'hi' : 'plain', size: 11 });
      g += atom(oR.x, oR.y, 'O', { kind: on === 'right' ? 'hi' : 'plain', size: 11 });
      const pairs = (o, charged) => { let t = ''; for (const ang of charged ? [-40, -90, -140] : [-40, -140]) t += lonePair(o.x, o.y, ang, { dist: 23 }); return t; };
      g += pairs(oL, on === 'left');
      g += pairs(oR, on === 'right');
      if (on === 'left') g += text(oL.x - 26, oL.y - 4, '−', { cls: 'fg-hi', size: 15 });
      if (on === 'right') g += text(oR.x + 26, oR.y - 4, '−', { cls: 'fg-hi', size: 15 });
      if (on === 'c') g += text(cc.x, cc.y + 30, '−', { cls: 'fg-hi', size: 15 });
      return g;
    };

    s += unit(36, 'left');
    s += unit(292, 'c');
    s += unit(548, 'right');
    s += arrow(P(240, 150), P(276, 150), { muted: true });
    s += arrow(P(276, 162), P(240, 162), { muted: true });
    s += arrow(P(496, 150), P(532, 150), { muted: true });
    s += arrow(P(532, 162), P(496, 162), { muted: true });

    s += text(124, 218, 'charge on the left oxygen', { cls: 'fg-tag-good', size: 10.5 });
    s += text(380, 218, 'charge on carbon', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(636, 218, 'charge on the right oxygen', { cls: 'fg-tag-good', size: 10.5 });
    s += text(380, 248, 'pentane-2,4-dione, pKa 9 — as acidic as phenol, from a hydrogen on carbon', { cls: 'fg-sm', size: 10 });
    s += text(380, 270, 'a ketone with one carbonyl manages pKa 20; the second one is worth eleven more units', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The anion an ordinary base can make out of a C–H. The charge spends most of its time on the two oxygens and only a minority of it on the carbon between them — which is why a carbon acid ends up as acidic as a phenol.',
  note: 'The carbon-centered structure is the minor contributor and it is still the one that does the chemistry: it is the carbon, not the oxygen, that attacks an electrophile. A minor contributor is not a rare event &mdash; there is one real anion, and the carbon form is a permanent fraction of it.',
});

/* ---------------------------------------------------------------- 115 ---
   The induction figure showed one trichloroacetate with a text label. The
   claim the table and the prose both turn on is the DISTANCE fall-off, which
   nothing in the section drew. */
FIGURES.push({
  id: 'induction-distance',
  section: 'acidity-factors',
  anchor: 'Move the chlorine three carbons from the acid group and almost nothing is left of the effect.',
  alt: 'Three butanoic acids with the chlorine moved one, two and three carbons from the carboxyl group, with the pKa under each showing the effect fading with distance',
  viewBox: '0 0 760 292',
  build() {
    let s = '';
    s += tag(380, 34, 'INDUCTION FADES BOND BY BOND');

    /* Butanoic acid drawn skeletally, with the chlorine hung off carbon
       `pos` counted from the carboxyl carbon (1 = alpha). */
    const acid = (ox, pos) => {
      let g = '';
      const c1 = P(ox, 150), o1 = P(ox, 96), o2 = P(ox - 46, 180);
      const c2 = P(ox + 46, 180), c3 = P(ox + 92, 150), c4 = P(ox + 138, 180);
      g += bond(c1, o1, { rFrom: 0, rTo: 15, order: 2 });
      g += bond(c1, o2, { rFrom: 0, rTo: 19 });
      g += bond(c1, c2, { rFrom: 0, rTo: 0 });
      g += bond(c2, c3, { rFrom: 0, rTo: 0 });
      g += bond(c3, c4, { rFrom: 0, rTo: 0 });
      g += atom(o1.x, o1.y, 'O', { size: 11 });
      g += atom(o2.x, o2.y, 'OH', { r: 19, size: 10.5 });
      for (const pt of [c1, c2, c3, c4]) g += atom(pt.x, pt.y, '', { kind: 'point' });
      for (const ang of [-40, -140]) g += lonePair(o1.x, o1.y, ang, { dist: 23 });
      const host = [c2, c3, c4][pos - 1];
      const cl = P(host.x, host.y + 44);
      g += bond(host, cl, { rFrom: 0, rTo: 16 });
      g += atom(cl.x, cl.y, 'Cl', { kind: 'warn', size: 11 });
      return g;
    };

    s += acid(108, 1);
    s += acid(348, 2);
    s += acid(588, 3);

    const rows = [
      [108, 'on the alpha carbon', 'pKa 2.86 \u00b7 the full effect'],
      [348, 'one carbon further out', 'pKa 4.06 \u00b7 most of it gone'],
      [588, 'three carbons from the acid', 'pKa 4.52 \u00b7 all but gone'],
    ];
    for (const [x, where, pka] of rows) {
      s += text(x + 46, 254, pka, { cls: 'fg-tag-warn', size: 11 });
      s += text(x + 46, 274, where, { cls: 'fg-sm', size: 10 });
    }
    s += text(380, 66, 'butanoic acid itself is pKa 4.82 — read each number against that', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'The same chlorine on the same acid, moved one bond at a time. Almost two pKa units on the alpha carbon, about three quarters of a unit one bond further out, and essentially nothing by the third.',
  note: 'That fall-off is what tells induction apart from resonance in an exam question. Resonance runs the length of a conjugated system losing very little &mdash; a nitro group four bonds away across a benzene ring still moves a phenol’s pK<sub>a</sub> by three units. Induction is gone in two.',
});

export default FIGURES;
