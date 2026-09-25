/* Figures for the michael-robinson notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 40 ---
   Three condensations that students memorize separately are one skill:
   count the gap. Putting the three products on one line, aligned by their
   oxygen-bearing carbons, makes the spacing the visible thing. */
FIGURES.push({
  id: 'condensation-spacing',
  section: 'michael-robinson',
  anchor: '<h3>Why a doubly stabilized donor</h3>',
  viewBox: '0 0 760 330',
  alt: 'The products of an aldol, a Claisen and a Michael addition aligned to show their one, three and five carbon spacings',
  build() {
    let s = '';
    const chain = (y, n, marks, name, tag2, kind) => {
      const x0 = 150, dx = 52;
      for (let i = 0; i < n; i++) {
        const p = P(x0 + i * dx, y);
        const m = marks[i];
        s += atom(p.x, p.y, m || '', { kind: m ? (kind === 'warn' ? 'warn' : 'hi') : 'point', r: m ? 15 : 0 });
        if (i) s += bond(P(x0 + (i - 1) * dx, y), p, { rFrom: marks[i - 1] ? 15 : 0, rTo: m ? 15 : 0 });
      }
      s += label(30, y + 4, name, { anchor: 'start', size: 12 });
      s += text(x0 + (n - 1) * dx + 70, y + 4, tag2, { cls: 'fg-tag-good', size: 11 });
    };
    s += tag(300, 46, 'the two oxygen-bearing carbons, and the gap between them');
    chain(96,  3, ['O', null, 'OH'], 'Aldol',   'β-hydroxy', null);
    chain(160, 3, ['O', null, 'O'],  'Claisen', '1,3', null);
    chain(224, 5, ['O', null, null, null, 'O'], 'Michael', '1,5', null);

    s += rule(34, 258, 726, 258);
    s += text(380, 284, 'Count the carbons between them and the reaction names itself — forwards to predict', { cls: 'fg-lbl', size: 12 });
    s += text(380, 306, 'a product, backwards to disconnect one. A 1,5-dicarbonyl is the Michael retron.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Three condensations, three spacings. An aldol’s nucleophile hits a carbonyl carbon and the oxygen stays as an alcohol; a Claisen’s hits an ester and the alkoxide leaves; a Michael’s hits a β carbon, two positions further along, which is what pushes the two carbonyls to 1,5.',
  note: 'Spacing survives every change of conditions, which is what makes it worth learning instead of the conditions. It is also what makes a Robinson annulation predictable: a 1,5-dicarbonyl has its ends exactly far enough apart to close a six-membered ring, so the product is a cyclohexenone without anyone having chosen the ring size.',
});

/* ---------------------------------------------------------------- B3 ---
   Two reactions in a row, with the ring appearing in the middle of them.
   The spacing figure already in the section draws the product; this draws
   the electrons that put it there. */
FIGURES.push({
  id: 'robinson-mechanism',
  section: 'michael-robinson',
  anchor: 'or you have left a carbon with five bonds.</p>',
  viewBox: '0 0 760 612',
  alt: 'A Robinson annulation drawn step by step with curved arrows: ethoxide making the malonate enolate, that enolate adding to the beta carbon of methyl vinyl ketone, protonation to the 1,5-dicarbonyl, an intramolecular aldol closing a six-membered ring, and dehydration to the conjugated cyclohexenone',
  build() {
    let s = '';

    /* 1 — the enolate. */
    s += tag(132, 36, '1 · the enolate forms');
    s += panel(14, 44, 236, 216);
    {
      const L = P(76, 150), C = P(146, 150), R = P(216, 150), H = P(146, 104), B = P(84, 96);
      s += bond(L, C, { rFrom: 26, rTo: 14 });
      s += bond(C, R, { rFrom: 14, rTo: 26 });
      s += bond(C, H, { rFrom: 14, rTo: 12, cls: 'fg-bond-hi' });
      s += atom(L.x, L.y, 'EtO₂C', { r: 26, size: 9 });
      s += atom(R.x, R.y, 'CO₂Et', { r: 26, size: 9 });
      s += atom(C.x, C.y, 'C', { kind: 'hi' });
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
      s += atom(B.x, B.y, 'EtO⁻', { r: 20, size: 10 });
      s += curve(P(102, 94), P(130, 98), { bow: -10 });
      s += curve(P(160, 116), P(178, 136), { bow: 12 });
      s += text(132, 212, 'pKa ≈ 13 — NaOEt is enough', { cls: 'fg-tag', size: 11 });
      s += text(132, 234, 'the charge is shared by both', { cls: 'fg-sm', size: 10.5 });
      s += text(132, 254, 'ester oxygens, so it is soft', { cls: 'fg-sm', size: 10.5 });
    }

    /* 2 — the 1,4-addition. */
    s += tag(380, 36, '2 · the enolate takes the β carbon');
    s += panel(262, 44, 236, 216);
    {
      const Me = P(298, 178), Cc = P(348, 152), O = P(348, 104), Ca = P(400, 178), Cb = P(452, 152);
      s += bond(Me, Cc, { rFrom: 17, rTo: 14 });
      s += bond(Cc, O, { order: 2, rFrom: 14, rTo: 14 });
      s += bond(Cc, Ca, { rFrom: 14, rTo: 14 });
      s += bond(Ca, Cb, { order: 2, rFrom: 14, rTo: 14 });
      s += atom(Me.x, Me.y, 'CH₃', { r: 17 });
      s += atom(Cc.x, Cc.y, 'C');
      s += atom(O.x, O.y, 'O');
      s += atom(Ca.x, Ca.y, 'C');
      s += atom(Cb.x, Cb.y, 'C', { kind: 'warn' });
      s += text(452, 122, 'β · δ+', { cls: 'fg-tag-warn', size: 11 });
      s += atom(452, 212, 'C⁻', { kind: 'hi' });
      s += curve(P(452, 194), P(452, 172), { bow: 14 });
      s += curve(P(418, 160), P(366, 134), { bow: 16 });
      s += curve(P(358, 130), P(360, 112), { bow: -10 });
      s += text(380, 244, 'the malonate enolate, adding 1,4', { cls: 'fg-tag-good', size: 11 });
    }

    /* 3 — protonate, and read the spacing. The adduct is the malonate of
       panels 1-2 joined to MVK, (EtO2C)2CH-CH2-CH2-CO-CH3, so the count that
       matters runs ester carbonyl (1), malonate CH (2), CH2 (3), CH2 (4),
       ketone carbonyl (5): three carbons between the two carbonyl carbons,
       exactly the spacing fig:condensation-spacing draws. */
    s += tag(620, 36, '3 · protonate: the 1,5-dicarbonyl');
    s += panel(510, 44, 236, 216);
    {
      const e1 = P(580, 96), c2 = P(640, 96), e2 = P(700, 96);
      const c3 = P(640, 144), c4 = P(598, 172), c5 = P(556, 144);
      s += bond(e1, c2, { rFrom: 22, rTo: 16 });
      s += bond(c2, e2, { rFrom: 16, rTo: 22 });
      s += bond(c2, c3, { rFrom: 16, rTo: 0 });
      s += bond(c3, c4, { rFrom: 0, rTo: 0 });
      s += bond(c4, c5, { rFrom: 0, rTo: 14 });
      s += bond(c5, P(524, 120), { order: 2, rFrom: 14, rTo: 14 });
      s += bond(c5, P(556, 192), { rFrom: 14, rTo: 17 });
      s += atom(e1.x, e1.y, 'EtO₂C', { r: 22, size: 9 });
      s += atom(e2.x, e2.y, 'CO₂Et', { r: 22, size: 9 });
      s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
      s += atom(524, 120, 'O');
      s += atom(556, 192, 'CH₃', { r: 17 });
      s += atom(c5.x, c5.y, 'C', { kind: 'hi' });
      s += text(580, 68, '1', { cls: 'fg-tag-good', size: 11 });
      s += text(660, 118, '2', { cls: 'fg-sm', size: 10 });
      s += text(662, 150, '3', { cls: 'fg-sm', size: 10 });
      s += text(602, 196, '4', { cls: 'fg-sm', size: 10 });
      s += text(522, 166, '5', { cls: 'fg-tag-good', size: 11 });
      s += text(616, 226, 'the Michael fingerprint', { cls: 'fg-tag-good', size: 11 });
      s += text(616, 248, 'three carbons between them', { cls: 'fg-sm', size: 10.5 });
    }

    /* 4 — the intramolecular aldol. */
    s += tag(192, 292, '4 · the aldol closes the ring');
    s += panel(14, 300, 356, 200);
    {
      const ring = [P(86, 348), P(134, 348), P(158, 390), P(134, 432), P(86, 432), P(62, 390)];
      for (let i = 0; i < 6; i++) {
        s += `<line class="fg-dash-hi" x1="${ring[i].x}" y1="${ring[i].y}" x2="${ring[(i + 1) % 6].x}" y2="${ring[(i + 1) % 6].y}"></line>`;
      }
      ring.forEach((p, i) => { s += atom(p.x, p.y, String(i + 1), { r: 12, size: 10 }); });
      /* The attacking carbon is one OF the six, not a seventh atom outside
         them: the bond that forms is the 1-6 edge of this very ring. */
      s += text(86, 326, 'α′ C⁻', { cls: 'fg-tag-good', size: 11 });
      s += text(34, 394, 'C=O', { cls: 'fg-tag-good', size: 11 });
      s += curve(P(72, 334), P(52, 378), { bow: 16 });
      s += text(272, 356, 'vertex 1 is the α′ carbon', { cls: 'fg-sm', size: 10.5 });
      s += text(272, 378, 'vertex 6 is its C=O partner', { cls: 'fg-sm', size: 10.5 });
      s += text(272, 400, 'the forming bond is edge 1–6', { cls: 'fg-sm', size: 10.5 });
      s += text(192, 462, 'six atoms, and no choice about it', { cls: 'fg-sm', size: 10.5 });
      s += text(192, 482, 'the only other loop would be a four-ring', { cls: 'fg-sm', size: 10.5 });
    }

    /* 5 — dehydration. */
    s += tag(568, 292, '5 · dehydration conjugates it');
    s += panel(390, 300, 356, 200);
    {
      const C1 = P(478, 352), C2 = P(478, 404), C3 = P(544, 404), O = P(544, 356), OH = P(430, 330);
      s += bond(C1, C2, { rFrom: 14, rTo: 14 });
      s += bond(C2, C3, { rFrom: 14, rTo: 14 });
      s += bond(C3, O, { order: 2, rFrom: 14, rTo: 14 });
      s += bond(C1, OH, { rFrom: 14, rTo: 16, cls: 'fg-bond-hi' });
      s += atom(C1.x, C1.y, 'C');
      s += atom(C2.x, C2.y, 'C', { kind: 'hi' });
      s += atom(C3.x, C3.y, 'C');
      s += atom(O.x, O.y, 'O');
      s += atom(OH.x, OH.y, 'OH', { kind: 'warn', r: 16, size: 10.5 });
      s += atom(430, 430, 'B:', { r: 14, size: 10.5 });
      s += curve(P(444, 420), P(464, 414), { bow: -10 });
      s += curve(P(478, 388), P(464, 346), { bow: 14 });
      /* and the third arrow: the C–OH bond leaves with the oxygen. */
      s += curve(P(452, 340), P(426, 310), { bow: 14 });
      s += arrow(P(586, 378), P(626, 378));
      s += text(668, 368, 'the enone', { cls: 'fg-tag-good', size: 11 });
      s += text(668, 390, 'C=C–C=O', { cls: 'fg-lbl', size: 13 });
      s += text(568, 462, 'E1cb: the base takes the α hydrogen,', { cls: 'fg-sm', size: 10.5 });
      s += text(568, 482, 'and hydroxide leaves from the β carbon', { cls: 'fg-sm', size: 10.5 });
    }

    s += rule(24, 530, 736, 530);
    s += label(380, 554, 'One Michael, one aldol, one dehydration, and the ring appears');
    s += label(380, 574, 'without anyone having chosen its size.');
    s += text(380, 598, 'The dehydration is the step that cannot run backwards.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'A Robinson annulation with the electrons drawn. Panel 2 is the one worth copying out by hand: the arrow starts at the donor&rsquo;s &alpha; carbon and ends at the acceptor&rsquo;s &beta; carbon, and a second arrow has to carry the &pi; electrons up onto the oxygen, or the &beta; carbon is left with five bonds.',
  note: 'The only step that looks like a choice is panel 4, and even it is forced. An aldol joins an &alpha; carbon to a carbonyl carbon and never two carbonyl carbons, so from a 1,5-dicarbonyl the one &alpha; carbon that can reach a carbonyl without closing a four-membered ring is the &alpha;&prime; carbon just beyond the other one &mdash; and the loop it closes has six atoms in it. Count the dashed ring before you accept a Robinson product: if your ring is not six, you have joined the wrong two carbons.',
});

export default FIGURES;
