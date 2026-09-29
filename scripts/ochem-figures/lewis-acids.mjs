/* Figures for the lewis-acids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- 110 ---
   The Lewis section described three organic Lewis acid-base events in prose
   and drew none of them; the one worked example was BF3 + NH3, which is the
   one case with no carbon in it. */
FIGURES.push({
  id: 'carbocation-lewis-acid',
  section: 'lewis-acids',
  anchor: 'Students routinely draw this product neutral on both atoms, and the formal-charge count is what catches it.</p>',
  alt: 'The tert-butyl cation accepting a lone pair from water, drawn with one curved arrow and with the formal charge moving from carbon to oxygen',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    s += tag(250, 36, 'A LEWIS ACID–BASE STEP WITH NO PROTON IN IT');

    // ---- the cation ----
    const c = P(140, 146), m1 = P(88, 110), m2 = P(192, 110), m3 = P(140, 206);
    s += bond(c, m1, { rFrom: 16, rTo: 0 }); s += bond(c, m2, { rFrom: 16, rTo: 0 }); s += bond(c, m3, { rFrom: 16, rTo: 0 });
    s += atom(c.x, c.y, 'C', { kind: 'warn', size: 12 });
    for (const pt of [m1, m2, m3]) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += text(172, 118, '+', { cls: 'fg-tag-warn', size: 15 });
    s += text(140, 244, 'tert-butyl cation', { cls: 'fg-sm', size: 10 });
    s += text(140, 262, 'six electrons, empty p orbital', { cls: 'fg-sm', size: 10 });

    // ---- water ----
    const o = P(330, 106), wh1 = P(378, 78), wh2 = P(378, 136);
    s += bond(o, wh1, { rTo: 12 }); s += bond(o, wh2, { rTo: 12 });
    s += atom(o.x, o.y, 'O', { kind: 'hi', size: 12 });
    s += atom(wh1.x, wh1.y, 'H', { r: 12, size: 10 });
    s += atom(wh2.x, wh2.y, 'H', { r: 12, size: 10 });
    for (const ang of [160, 210]) s += lonePair(o.x, o.y, ang, { dist: 24 });
    s += text(330, 174, 'water, the Lewis base', { cls: 'fg-sm', size: 10 });

    // ---- the arrow ----
    s += curve(P(300, 100), P(162, 136), { bow: -34 });
    s += tag(240, 62, 'one arrow · no bond breaks');

    // ---- product ----
    s += rule(456, 40, 456, 264);
    const pc = P(556, 146), pm1 = P(504, 110), pm2 = P(556, 206), pm3 = P(500, 180), po = P(626, 118), ph1 = P(676, 88), ph2 = P(676, 148);
    s += bond(pc, pm1, { rFrom: 16, rTo: 0 });
    s += bond(pc, pm2, { rFrom: 16, rTo: 0 });
    s += bond(pc, pm3, { rFrom: 16, rTo: 0 });
    s += bond(pc, po, { rFrom: 16, rTo: 15 });
    s += bond(po, ph1, { rFrom: 15, rTo: 12 });
    s += bond(po, ph2, { rFrom: 15, rTo: 12 });
    s += atom(pc.x, pc.y, 'C', { size: 12 });
    s += atom(pm1.x, pm1.y, '', { kind: 'point' });
    s += atom(pm2.x, pm2.y, '', { kind: 'point' });
    s += atom(pm3.x, pm3.y, '', { kind: 'point' });
    s += atom(po.x, po.y, 'O', { kind: 'warn', size: 12 });
    s += atom(ph1.x, ph1.y, 'H', { r: 12, size: 10 });
    s += atom(ph2.x, ph2.y, 'H', { r: 12, size: 10 });
    s += lonePair(po.x, po.y, 250, { dist: 24 });
    s += text(658, 92, '+', { cls: 'fg-tag-warn', size: 15 });
    s += text(556, 244, 'an oxonium ion', { cls: 'fg-sm', size: 10 });
    s += text(596, 262, 'carbon neutral · oxygen +1', { cls: 'fg-tag-warn', size: 11 });
    return s;
  },
  caption: 'SN1’s second step, described honestly. The carbocation is the electron-pair acceptor and water is the donor, so this is a Lewis acid–base reaction — the same event as BF₃ plus ammonia, with carbon in place of boron.',
  note: 'Follow the charge rather than assuming it cancels. It started on carbon and ended on oxygen, because oxygen supplied both electrons of the new bond and got no share of them back. The neutral alcohol appears only after a second, Brønsted step removes that proton &mdash; two definitions, one mechanism, one step each.',
});

export default FIGURES;
