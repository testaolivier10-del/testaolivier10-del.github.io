/* Figures for the diels-alder notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- B4 ---
   Which atoms end up bonded to which. The prose gives the bond arithmetic in
   a sentence and the reader has to reconstruct a ring from it; drawn with the
   diene carbons numbered on both sides, the arithmetic and the regiochemistry
   are the same picture. */
FIGURES.push({
  id: 'da-bond-accounting',
  section: 'diels-alder',
  anchor: '<h3>The diene must be able to reach s-cis</h3>',
  alt: 'An s-cis diene and a dienophile with three curved arrows going round a circle, giving a cyclohexene whose two new sigma bonds and new double bond are marked',
  viewBox: '0 0 760 350',
  build() {
    let s = '';
    // ---- the two partners, stacked the way they have to meet ----
    s += tag(195, 46, 'diene, held s-cis');
    const c1 = P(120, 180), c2 = P(160, 126), c3 = P(230, 126), c4 = P(270, 180);
    /* The second line of each double bond is drawn short and on the inside.
       Full length, it overhung C1 and C4 and crossed the dashed bonds that
       are forming there — which are the two marks the figure exists for. */
    const mid = P(195, 200);
    s += ringDouble(c1, c2, mid);
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += ringDouble(c3, c4, mid);
    [[c1, 'C1', -18, 8], [c2, 'C2', -4, -14], [c3, 'C3', 4, -14], [c4, 'C4', 18, 8]].forEach(([p, t, dx, dy]) =>
      s += text(p.x + dx, p.y + dy, t, { cls: 'fg-sm', size: 10 }));
    const d1 = P(150, 272), d2 = P(240, 272);
    s += ringDouble(d1, d2, mid);
    s += tag(195, 300, 'dienophile');

    // The two bonds that are forming, drawn as the dashes they are in the
    // transition state rather than as bonds that already exist.
    s += bond(c1, d1, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += bond(c4, d2, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });

    // Six electrons, three arrows, head to tail all the way round.
    s += curve(P(140, 153), P(135, 220), { bow: 22 });
    s += curve(P(195, 272), P(255, 222), { bow: 24 });
    s += curve(P(250, 153), P(197, 128), { bow: 22 });

    s += arrow(P(330, 200), P(400, 200));
    s += text(365, 186, 'one step', { cls: 'fg-tag', size: 10.5 });

    // ---- the product, with the same four carbons still numbered ----
    const r = 62, cx = 570, cy = 196, v = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      v.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    // v5 v0 v1 v2 = diene C1 C2 C3 C4; v3 v4 = the dienophile carbons.
    s += bond(v[5], v[0], { rFrom: 0, rTo: 0 });
    s += ringDouble(v[0], v[1], P(cx, cy));
    s += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
    s += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
    s += bond(v[2], v[3], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    s += bond(v[4], v[5], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    for (const p of v) s += atom(p.x, p.y, '', { kind: 'point' });
    s += text(cx, 104, 'the new \u03c0 bond, C2 to C3', { cls: 'fg-tag-good', size: 10.5 });
    s += text(v[5].x - 26, v[5].y + 4, 'C1', { cls: 'fg-sm', size: 10 });
    s += text(v[0].x, v[0].y - 14, 'C2', { cls: 'fg-sm', size: 10 });
    s += text(v[1].x + 26, v[1].y + 4, 'C3', { cls: 'fg-sm', size: 10 });
    s += text(v[2].x + 26, v[2].y + 4, 'C4', { cls: 'fg-sm', size: 10 });
    s += text(cx, 290, 'the two new \u03c3 bonds', { cls: 'fg-tag-good', size: 11 });

    s += rule(34, 312, 686, 312);
    s += text(348, 334, 'Three \u03c0 bonds in; two \u03c3 bonds and one \u03c0 bond out \u2014 so it runs downhill unaided.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The whole reaction as one circle of six electrons. The diene\u2019s C1 and C4 reach the two ends of the dienophile, the arrows chase each other head to tail round the ring, and every bond that breaks and every bond that forms does so in the same instant.',
  note: 'Keep the numbering in view and the product is never a guess. C1 and C4 are where the new single bonds appear, so the new double bond has nowhere to be except between C2 and C3 \u2014 the bond that was single in the starting diene. And because the two new bonds form at once on one face of the dienophile, nothing has a chance to rotate in between, which is where the stereospecificity below comes from.',
});

/* ----------------------------------------------------------------- B4a ---
   endo/exo is the chapter's purest three-dimensional idea and it was carried
   by two sentences of prose. Seen from the side, the whole argument is one
   picture: the dienophile lies under the diene either way, and the only
   question is whether its substituent points in under the diene or out away
   from it. */
FIGURES.push({
  id: 'endo-exo-stacked',
  section: 'diels-alder',
  anchor: 'nothing here is reversing at ordinary temperatures.</p>',
  alt: 'Two side-on views of a diene stacked above a dienophile. On the left, endo: the dienophile carbonyl points inward, underneath the diene, with a dotted secondary orbital contact to the diene above it. On the right, exo: the same carbonyl points outward and downward, away from the diene, with no such contact.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    const stack = (x0, endo) => {
      let t = '';
      const dL = P(x0 + 60, 140), dR = P(x0 + 280, 140);
      const pL = P(x0 + 90, 214), pR = P(x0 + 250, 214);
      t += bond(dL, dR, { rFrom: 0, rTo: 0 });
      t += `<path class="fg-bond" fill="none" d="M${dL.x} 140 Q${x0 + 170} 104 ${dR.x} 140"></path>`;
      t += bond(pL, pR, { rFrom: 0, rTo: 0 });
      for (const q of [dL, dR, pL, pR]) t += atom(q.x, q.y, '', { kind: 'point' });
      t += bond(dL, pL, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
      t += bond(dR, pR, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
      const sub = endo ? P(x0 + 148, 188) : P(x0 + 124, 250);
      t += bond(pL, sub, { rFrom: 0, rTo: 15 });
      t += atom(sub.x, sub.y, 'C=O');
      if (endo) t += bond(sub, P(x0 + 158, 142), { cls: 'fg-dash', rFrom: 15, rTo: 0 });
      return t;
    };

    s += panel(20, 30, 330, 262);
    s += tag(185, 56, 'endo');
    s += text(185, 76, 'substituent tucked under the diene', { cls: 'fg-sm', size: 10 });
    s += text(185, 98, 'diene, seen edge-on', { cls: 'fg-sm', size: 9.5 });
    s += stack(35, true);
    s += text(185, 250, 'the dotted line is the secondary contact', { cls: 'fg-sm', size: 9.5 });
    s += text(185, 276, 'more crowded, and faster', { cls: 'fg-tag-good', size: 11 });

    s += panel(386, 30, 330, 262);
    s += tag(551, 56, 'exo');
    s += text(551, 76, 'substituent pointing away', { cls: 'fg-sm', size: 10 });
    s += text(551, 98, 'same two bonds forming', { cls: 'fg-sm', size: 9.5 });
    s += stack(401, false);
    s += text(551, 276, 'less crowded, and slower', { cls: 'fg-tag-warn', size: 11 });

    s += rule(30, 308, 706, 308);
    s += text(368, 330, 'Cyclopentadiene and maleic anhydride give the endo adduct, and give it faster.', { cls: 'fg-lbl', size: 12 });
    s += text(368, 348, 'The two new sigma bonds are identical in both stacks. Only the substituent has moved.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The two ways the same two molecules can stack, seen from the side. The dienophile lies under the diene either way and the two forming bonds — the dashed ones — are the same in both. What differs is where the dienophile’s carbonyl points: inward, underneath the diene, or outward and away from it.',
  note: 'The endo stack is plainly the more crowded of the two, and it is still the faster one, which is the point. Tucked underneath, the carbonyl’s π system sits directly below the π system the diene is using, and the two touch in the transition state without ever becoming a bond — a <b>secondary orbital interaction</b>. It lowers the barrier by more than the crowding raises it. Nothing about the product’s own stability is involved: endo is the kinetic answer, not the thermodynamic one.',
});

/* ----------------------------------------------------------------- B4b ---
   Regiochemistry was the section's most figure-hungry idea and had no
   figure: which substituent lands where on a new ring is a question about
   two structures, and the prose was asking the reader to build both in their
   head. Drawn, the rule is one dashed line between the two atoms that want
   each other, and the wrong answer is visibly the one that pairs like with
   like. */
FIGURES.push({
  id: 'da-regiochemistry',
  section: 'diels-alder',
  anchor: 'and it weakens as either partner becomes less polarized.</div>',
  alt: 'On the left, a 1-methoxy-substituted diene with a delta minus marked on its far terminus, drawn above propenal with a delta plus marked on the carbon that does not carry the aldehyde, and a dashed line pairing those two atoms. On the right, two cyclohexene rings: the ortho product with the methoxy and the aldehyde on adjacent carbons, labeled as the product, and the meta product with them 1,3 apart, labeled as never seen.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';

    // ---- the two partners, each polarized ----
    s += tag(160, 52, 'polarize each partner');
    const c1 = P(88, 146), c2 = P(128, 96), c3 = P(198, 96), c4 = P(238, 146);
    const dmid = P(163, 150);
    s += ringDouble(c1, c2, dmid);
    s += bond(c2, c3, { rFrom: 0, rTo: 0 });
    s += ringDouble(c3, c4, dmid);
    for (const q of [c1, c2, c3, c4]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += bond(c1, P(52, 178), { rFrom: 0, rTo: 17 });
    s += atom(52, 178, 'OMe', { r: 17, size: 10 });
    s += text(72, 136, 'C1', { cls: 'fg-sm', size: 9.5 });
    s += text(256, 136, 'C4', { cls: 'fg-sm', size: 9.5 });
    s += text(250, 170, 'δ−', { cls: 'fg-lbl', size: 13 });

    const d1 = P(118, 250), d2 = P(188, 250);
    s += bond(d1, d2, { order: 2, rFrom: 0, rTo: 0 });
    for (const q of [d1, d2]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += bond(d2, P(228, 282), { rFrom: 0, rTo: 17 });
    s += atom(228, 282, 'CHO', { r: 17, size: 10 });
    s += text(104, 238, 'δ+', { cls: 'fg-lbl', size: 13 });

    // The pairing itself: not a bond yet, so it is drawn as one.
    s += bond(c4, d1, { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += text(160, 330, 'δ− meets δ+, so C4 bonds to the CH₂ end', { cls: 'fg-tag-good', size: 10.5 });
    s += text(160, 348, 'and C1 is left to take the CHO carbon', { cls: 'fg-sm', size: 10 });

    s += arrow(P(316, 190), P(372, 190));
    s += text(344, 176, 'two ways to join', { cls: 'fg-tag', size: 10.5 });

    // ---- the two rings that answer the question ----
    const ring = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        v.push(P(Math.round((cx + Math.cos(a) * r) * 10) / 10, Math.round((cy + Math.sin(a) * r) * 10) / 10));
      }
      return v;
    };
    /* v5 v0 v1 v2 are the diene's C1..C4 and v3 v4 the dienophile's two
       carbons, the same mapping the bond-accounting figure uses, so the two
       drawings can be read against each other. */
    const drawRing = (cx, choCarbon) => {
      const v = ring(cx, 150, 52), ctr = P(cx, 150);
      let t = '';
      t += bond(v[5], v[0], { rFrom: 0, rTo: 0 });
      t += ringDouble(v[0], v[1], ctr);
      t += bond(v[1], v[2], { rFrom: 0, rTo: 0 });
      t += bond(v[2], v[3], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
      t += bond(v[3], v[4], { rFrom: 0, rTo: 0 });
      t += bond(v[4], v[5], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
      for (const q of v) t += atom(q.x, q.y, '', { kind: 'point' });
      const out = (p, dx, dy, lbl) => {
        const at = P(p.x + dx, p.y + dy);
        return bond(p, at, { rFrom: 0, rTo: 17 }) + atom(at.x, at.y, lbl, { r: 17, size: 10 });
      };
      t += out(v[5], -29.4, -17, 'OMe');
      t += choCarbon === 4 ? out(v[4], -29.4, 17, 'CHO') : out(v[3], 0, 34, 'CHO');
      return t;
    };
    s += drawRing(480, 4);
    s += text(480, 272, '"ortho" — 1,2', { cls: 'fg-tag-good', size: 11 });
    s += text(480, 290, 'this is the product', { cls: 'fg-sm', size: 10 });
    s += drawRing(630, 3);
    s += text(630, 272, '"meta" — 1,3', { cls: 'fg-tag-warn', size: 11 });
    s += text(630, 290, 'never seen', { cls: 'fg-sm', size: 10 });

    s += rule(30, 372, 710, 372);
    s += text(370, 394, 'Join the diene’s δ− end to the dienophile’s δ+ carbon; the ring closes itself.', { cls: 'fg-lbl', size: 12 });
    s += text(370, 412, 'Move the donor to C2 of the diene and the same rule gives the "para" product.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The rule as a picture rather than as two borrowed words. A donor on the diene’s C1 makes C4 the nucleophilic end; a withdrawing group on the dienophile makes the <i>other</i> carbon the electrophilic one. Pair those two, and the second bond has only one place left to go — which puts the two substituents next door to each other.',
  note: 'The ring on the right is what the other orientation would give, and it is worth looking at once so you can rule it out on sight: making it would mean bonding δ− to the carbon that is already electron-rich. Note also what the rule does <b>not</b> produce — the 1,3 arrangement is never the favored orientation, so "meta" is a distractor rather than the major product.',
});

/* ----------------------------------------------------------------- B4c ---
   Two claims in this section were made in words only, and they are the same
   drawing seen twice. The canonical worked example asks the reader to see
   that the anhydride ends up on the side of the two-carbon bridge in a
   bicyclic cage; the retro recipe asks where to put the scissors. Draw the
   adduct once, mark the two bonds that made it, and both are answered. */
FIGURES.push({
  id: 'norbornene-endo-retro',
  section: 'diels-alder',
  /* Hand-placed between the worked example and the retro heading, because it
     answers the last line of the one and the first line of the other; the
     anchor below is only the fallback if those markers are ever lost. */
  anchor: '<h3>Running it backwards</h3>',
  alt: 'The cyclopentadiene plus maleic anhydride adduct drawn as a six-membered ring with a one-carbon CH2 bridge crossing in front of it. The anhydride is attached by hashed bonds pointing back, away from that bridge, which is the endo arrangement. Two bonds of the ring are highlighted and marked cut, and an arrow labeled heat leads to the two fragments, cyclopentadiene and maleic anhydride.',
  viewBox: '0 0 760 450',
  build() {
    let s = '';
    /* Norbornene drawn the way a textbook draws it: the six-membered ring
       flat on the page with the one-carbon bridge crossing its middle, which
       reads as the bridge coming toward you. A substituent drawn hashed is
       therefore on the far side from that bridge — and the far side from the
       CH2 bridge is the side of the two-carbon C=C bridge. That is endo. */
    const C1 = P(110, 163), C2 = P(150, 221), C3 = P(240, 221),
          C4 = P(280, 163), C5 = P(240, 105), C6 = P(150, 105);
    const ctr = P(195, 163);

    s += tag(195, 60, 'the endo adduct');
    s += text(195, 90, 'the two-carbon C=C bridge', { cls: 'fg-tag', size: 11 });
    s += bond(C1, C2, { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    s += bond(C2, C3, { rFrom: 0, rTo: 0 });
    s += bond(C3, C4, { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
    s += bond(C4, C5, { rFrom: 0, rTo: 0 });
    s += ringDouble(C5, C6, ctr);
    s += bond(C6, C1, { rFrom: 0, rTo: 0 });
    for (const q of [C1, C2, C3, C4, C5, C6]) s += atom(q.x, q.y, '', { kind: 'point' });

    const C7 = P(195, 178);
    s += bond(C1, C7, { rFrom: 0, rTo: 17 });
    s += bond(C4, C7, { rFrom: 0, rTo: 17 });
    s += atom(C7.x, C7.y, 'CH₂', { r: 17, size: 10 });
    s += text(195, 148, 'the one-carbon bridge', { cls: 'fg-sm', size: 9.5 });

    // the anhydride, hashed so it points away from that bridge
    const AA = P(130, 290), AB = P(260, 290), AO = P(195, 326);
    s += hash(C2, AA, { rFrom: 0, rTo: 17 });
    s += hash(C3, AB, { rFrom: 0, rTo: 17 });
    s += bond(AA, AO, { rFrom: 17, rTo: 15 });
    s += bond(AB, AO, { rFrom: 17, rTo: 15 });
    s += atom(AA.x, AA.y, 'C=O', { r: 17, size: 10 });
    s += atom(AB.x, AB.y, 'C=O', { r: 17, size: 10 });
    s += atom(AO.x, AO.y, 'O');

    // where the scissors go
    s += bond(P(140.7, 184.6), P(119.3, 199.4), { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += bond(P(270.7, 199.4), P(249.3, 184.6), { cls: 'fg-dash-hi', rFrom: 0, rTo: 0 });
    s += text(95, 186, 'cut', { cls: 'fg-tag-warn', size: 11 });
    s += text(295, 186, 'cut', { cls: 'fg-tag-warn', size: 11 });
    s += text(195, 362, 'the anhydride points away from the CH₂ bridge', { cls: 'fg-sm', size: 10 });
    s += text(195, 380, 'and the two cut bonds are the two it made', { cls: 'fg-sm', size: 10 });

    s += arrow(P(390, 200), P(452, 200));
    s += text(421, 186, 'heat', { cls: 'fg-tag', size: 10.5 });
    s += text(421, 218, 'retro-DA', { cls: 'fg-sm', size: 10 });

    // ---- the two pieces that fall out ----
    const penta = (cx, cy, r, start) => {
      const v = [];
      for (let i = 0; i < 5; i++) {
        const a = (start + i * 72) * Math.PI / 180;
        v.push(P(Math.round((cx + Math.cos(a) * r) * 100) / 100, Math.round((cy + Math.sin(a) * r) * 100) / 100));
      }
      return v;
    };

    const cp = penta(580, 120, 44, -90), cpc = P(580, 120);
    s += bond(cp[0], cp[1], { rFrom: 0, rTo: 0 });
    s += ringDouble(cp[1], cp[2], cpc);
    s += bond(cp[2], cp[3], { rFrom: 0, rTo: 0 });
    s += ringDouble(cp[3], cp[4], cpc);
    s += bond(cp[4], cp[0], { rFrom: 0, rTo: 0 });
    for (const q of cp) s += atom(q.x, q.y, '', { kind: 'point' });
    s += text(580, 66, 'CH₂', { cls: 'fg-sm', size: 9.5 });
    s += text(580, 186, 'cyclopentadiene', { cls: 'fg-lbl', size: 12 });
    s += text(580, 216, '+', { cls: 'fg-lbl', size: 16 });

    const ma = penta(580, 300, 44, 90), mac = P(580, 300);
    s += bond(ma[0], ma[1], { rFrom: 15, rTo: 0 });
    s += bond(ma[1], ma[2], { rFrom: 0, rTo: 0 });
    s += ringDouble(ma[2], ma[3], mac);
    s += bond(ma[3], ma[4], { rFrom: 0, rTo: 0 });
    s += bond(ma[4], ma[0], { rFrom: 0, rTo: 15 });
    for (const q of [ma[1], ma[2], ma[3], ma[4]]) s += atom(q.x, q.y, '', { kind: 'point' });
    s += atom(ma[0].x, ma[0].y, 'O');
    const exo = (v, sx) => {
      const at = P(v.x + sx * 32.3, v.y + 10.5);
      return bond(v, at, { order: 2, rFrom: 0, rTo: 15 }) + atom(at.x, at.y, 'O');
    };
    s += exo(ma[1], -1);
    s += exo(ma[4], 1);
    s += text(580, 392, 'maleic anhydride', { cls: 'fg-lbl', size: 12 });

    s += rule(30, 408, 710, 408);
    s += text(370, 430, 'Cut the two bonds that built the ring and the pieces fall straight out.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'One drawing doing two jobs. The cage is the adduct of cyclopentadiene and maleic anhydride: six-membered ring on the page, the old CH₂ crossing in front of it as a one-carbon bridge, and the anhydride hashed — pointing back, away from that bridge and toward the side the C=C bridge is on. The two highlighted bonds are the two the cycloaddition made, and heating breaks exactly those.',
  note: 'Read the hashed bonds as the definition of <b>endo</b> rather than as decoration: endo is the orientation in which the dienophile’s substituent finishes up on the far side from the short bridge. Then read the same picture backwards. The alkene is the marker — step one carbon out from each of its ends and cut, and you are holding the diene and the dienophile you started from. Every retro-Diels–Alder disconnection is this, on a ring that usually has no bridge to help you find the right two bonds.',
});

export default FIGURES;
