/* Figures for the epoxides notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------- 10.4 ---
   Anti opening. "Both products are anti" is the section's stereochemical
   punchline, and nothing was drawn for it. */
FIGURES.push({
  id: 'epoxide-anti-opening',
  section: 'epoxides',
  anchor: 'that is the same geometric argument as the anti addition of bromine to an alkene, and for the same reason — a three-membered ring blocks one face completely.</div>',
  alt: 'On the left, an epoxide with the oxygen bridging two carbons from above and a hydroxide ion approaching the right-hand carbon from below, opposite the ring, with curved arrows for the attack and for the carbon-oxygen bond breaking. On the right, the product trans-1,2-cyclohexanediol drawn on a hexagon with one hydroxyl on a wedge and the other on a hash.',
  viewBox: '0 0 700 348',
  build() {
    let s = '';
    // ---------- left: why the two groups end up anti ----------
    s += tag(196, 40, 'ONE FACE IS BLOCKED BY THE RING');
    const ca = P(150, 170), cb = P(242, 170), ox = P(196, 112);
    s += bond(ca, cb, { rFrom: 15, rTo: 15 });
    s += bond(ca, ox, { rFrom: 15, rTo: 15 });
    s += bond(cb, ox, { rFrom: 15, rTo: 15 });
    const ra = armEnd(ca, 150, 44), rb = armEnd(cb, 30, 44);
    s += bond(ca, ra, { rFrom: 15, rTo: 13 }) + atom(ra.x, ra.y, 'R', { r: 13, size: 11 });
    s += bond(cb, rb, { rFrom: 15, rTo: 13 }) + atom(rb.x, rb.y, 'R', { r: 13, size: 11 });
    s += atom(ca.x, ca.y, 'C');
    s += atom(cb.x, cb.y, 'C');
    s += atom(ox.x, ox.y, 'O', { kind: 'hi' });
    s += lonePair(ox.x, ox.y, 270, { dist: 24 });
    const nu = P(316, 254);
    s += atom(nu.x, nu.y, 'HO', { r: 19, size: 10, kind: 'hi' });
    s += text(nu.x + 24, nu.y - 14, '−', { cls: 'fg-hi', size: 15 });
    s += curve(P(nu.x - 12, nu.y - 16), P(cb.x + 14, cb.y + 14), { bow: 16 });
    s += curve(P(cb.x - 2, cb.y - 18), P(ox.x + 16, ox.y + 12), { bow: -16 });
    s += text(196, 296, 'the nucleophile arrives opposite the C–O bond it breaks,', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 312, 'so the new bond and the oxygen end up on opposite faces', { cls: 'fg-tag', size: 10.5 });

    s += rule(360, 62, 360, 306);

    // ---------- right: the cyclohexene oxide case ----------
    s += tag(534, 40, 'CYCLOHEXENE OXIDE + H₂O, ACID OR BASE');
    const cx = 536, cy = 168, r = 60;
    const v = [];
    for (let i = 0; i < 6; i++) {
      const a = ((60 * i - 30) * Math.PI) / 180;
      v.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    for (let i = 0; i < 6; i++) s += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
    for (const pt of v) s += atom(pt.x, pt.y, '', { kind: 'point' });
    const w = P(v[2].x - 8, v[2].y + 58), h = P(v[1].x + 44, v[1].y + 48);
    s += wedge(v[2], w, { rFrom: 0, rTo: 17, width: 9 });
    s += hash(v[1], h, { rFrom: 0, rTo: 17, width: 9 });
    s += atom(w.x, w.y, 'OH', { r: 17, size: 10 });
    s += atom(h.x, h.y, 'OH', { r: 17, size: 10 });
    s += text(534, 306, 'trans-1,2-cyclohexanediol: one wedge, one hash,', { cls: 'fg-sm', size: 9.5 });
    s += text(534, 324, 'and the cis isomer is not formed at all', { cls: 'fg-tag', size: 10.5 });
    return s;
  },
  caption: 'What "anti" looks like when you draw it. The oxygen bridges one face of the two carbons, so a nucleophile physically cannot arrive on that side: the only approach is from underneath, along the axis of the bond that is breaking. The new group and the oxygen therefore end on opposite faces, and on a ring that is the difference between a <i>trans</i> diol and a <i>cis</i> one.',
  note: 'This is the same geometry as the bromonium ion in <i>Alkenes &amp; Alkynes</i>, and it is worth seeing them as one idea rather than two rules: a three-membered ring on one face is a blocked face, and a blocked face forces anti. Note also that this argument never mentioned acid or base — which is why the stereochemistry is anti under both, even though the regiochemistry flips.',
});

/* ------------------------------------------------------------- 10.5 ---
   The acid/base switch. The figure this replaces drew H and H on the
   right-hand carbon — isobutylene oxide — directly under a worked example
   about 2-methyl-2,3-epoxybutane, so the substrate changed silently between
   two adjacent things on the page. Same figure, same claim, matching
   substrate, and the attacked carbon marked in each panel. */
FIGURES.push({
  id: 'epoxide-acid-base-switch',
  section: 'epoxides',
  anchor: '<h3>Same substrate, opposite regiochemistry</h3>',
  alt: 'Two panels showing 2-methyl-2,3-epoxybutane. Under basic conditions an anionic nucleophile attacks the less substituted carbon, the one bearing a methyl and a hydrogen, from the face opposite the oxygen. Under acidic conditions the oxygen is protonated and a neutral nucleophile attacks the more substituted carbon, the one bearing two methyls, again from the opposite face.',
  viewBox: '0 0 700 344',
  build() {
    let s = '';
    /* One drawing routine, used twice, so the two panels cannot drift apart:
       the more substituted carbon is always on the left with two methyls,
       the less substituted one on the right with a methyl and a hydrogen. */
    const epoxide = (cmx, hit) => {
      const cm = P(cmx, 170), cl = P(cmx + 76, 170), o = P(cmx + 38, 114);
      let g = bond(cm, cl, { rFrom: 15, rTo: 15 }) +
              bond(cm, o, { rFrom: 15, rTo: 15 }) +
              bond(cl, o, { rFrom: 15, rTo: 15 });
      const me = (from, to) => bond(from, to, { rFrom: 15, rTo: 17 }) + atom(to.x, to.y, 'CH₃', { r: 17, size: 10 });
      g += me(cm, P(cmx - 56, 158));
      g += me(cm, P(cmx, 226));
      g += me(cl, P(cmx + 132, 158));
      g += bond(cl, P(cmx + 76, 226), { rFrom: 15, rTo: 12 }) + atom(cmx + 76, 226, 'H', { r: 12, size: 11 });
      g += atom(cm.x, cm.y, 'C', { kind: hit === 'cm' ? 'warn' : 'plain' });
      g += atom(cl.x, cl.y, 'C', { kind: hit === 'cl' ? 'warn' : 'plain' });
      return { g, cm, cl, o };
    };

    // ---------- basic ----------
    s += text(196, 38, 'BASIC — a strong, anionic nucleophile', { cls: 'fg-tag', size: 11.5 });
    const A = epoxide(152, 'cl');
    s += A.g;
    s += atom(A.o.x, A.o.y, 'O', { kind: 'hi' });
    const nuA = P(316, 272);
    s += atom(nuA.x, nuA.y, 'Nu', { r: 16, size: 10.5, kind: 'hi' });
    s += text(nuA.x + 22, nuA.y - 12, '−', { cls: 'fg-hi', size: 15 });
    s += arrow(P(302, 250), P(246, 192));
    s += text(196, 302, 'no activation, so this is a plain SN2 —', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 318, 'attack goes to the LESS hindered carbon', { cls: 'fg-tag', size: 10.5 });

    s += rule(356, 60, 356, 306);

    // ---------- acidic ----------
    s += text(524, 38, 'ACIDIC — a weak one, often the solvent', { cls: 'fg-tag-warn', size: 11.5 });
    const B = epoxide(486, 'cm');
    s += B.g;
    s += atom(B.o.x, B.o.y, 'O', { kind: 'hi' });
    s += bond(B.o, P(B.o.x, 62), { rFrom: 15, rTo: 13 });
    s += atom(B.o.x, 62, 'H', { r: 13, size: 11, kind: 'warn' });
    s += text(B.o.x + 26, 96, '+', { cls: 'fg-tag-warn', size: 15 });
    const nuB = P(398, 272);
    s += atom(nuB.x, nuB.y, 'Nu', { r: 16, size: 10.5, kind: 'hi' });
    s += bond(nuB, P(nuB.x - 34, nuB.y), { rFrom: 16, rTo: 11 });
    s += atom(nuB.x - 34, nuB.y, 'H', { r: 11, size: 10 });
    s += arrow(P(418, 250), P(470, 194));
    s += text(524, 302, 'protonation puts positive charge on the carbon', { cls: 'fg-sm', size: 9.5 });
    s += text(524, 318, 'that holds it best — the MORE substituted one', { cls: 'fg-tag-warn', size: 10.5 });
    return s;
  },
  caption: 'The reason epoxides get a section of their own, on the substrate from the worked example above. Under <b>base</b>, nothing has activated the ring, so a strong nucleophile does what SN2 always does and attacks the carbon it can reach — the less hindered one. Under <b>acid</b>, protonating the oxygen stretches the C–O bond on whichever side can better support a partial positive charge, which is the <i>more</i> substituted carbon, and the nucleophile follows the charge. Same epoxide, opposite product.',
  note: 'One substrate, two conditions, OPPOSITE ends. Nothing else in the course lets you choose the regiochemistry this cleanly, and it is worth understanding rather than memorizing: under base you are doing sterics, and under acid you are doing carbocation stability with the ring still half attached. Note what does <i>not</i> change — the nucleophile arrives from the face the ring does not block in both panels, so both products are anti.',
});

export default FIGURES;
