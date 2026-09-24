/* Figures for the acetals notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------- 11.3 ---
   Acetal formation, every elementary step, with the electron arrows. The
   section's only figure shows the four SPECIES joined by equilibrium heads
   and contains no curved arrows at all — and this is the mechanism students
   are most often asked to produce in full. */
FIGURES.push({
  id: 'acetal-seven-steps',
  section: 'acetals',
  anchor: '<h3>Step one: hemiacetal formation</h3>',
  alt: 'Seven panels drawing the acid-catalyzed formation of an acetal from a ketone. Protonation of the carbonyl oxygen; attack by the first alcohol on the carbonyl carbon, with a second arrow taking the pi bond up onto the positively charged oxygen; loss of a proton to give the hemiacetal; protonation of the hemiacetal hydroxyl; loss of water to give the oxocarbenium ion, drawn with the double bond and the positive charge on oxygen; attack by the second alcohol on that carbon, again with a second arrow moving the pi bond onto oxygen; and loss of the final proton to give the acetal. Every step carries curved arrows, and every arrow is reversible.',
  viewBox: '0 0 760 742',
  build() {
    let s = '';
    const W = 236, H = 208;
    const frame = (x, y, n, t) => panel(x, y, W, H) + tag(x + 118, y + 26, n + ' · ' + t);

    /* The shared core: the carbon, its two R groups, an oxygen above it and
       optionally one to its right. Everything in this mechanism happens on
       those two oxygens, so keeping them in the same two places across all
       seven frames is most of what makes the sequence readable. */
    const core = (c, o) => {
      const r1 = armEnd(c, 216, 42), r2 = armEnd(c, 324, 42);
      let g = bond(c, r1, { rTo: 13 }) + atom(r1.x, r1.y, 'R', { r: 13 });
      g += bond(c, r2, { rTo: 13 }) + atom(r2.x, r2.y, 'R', { r: 13 });
      const top = armEnd(c, 90, 54);
      let right = null;
      if (o.top) {
        g += bond(c, top, { order: o.topOrder || 1, rTo: 15 });
      }
      if (o.right) {
        right = armEnd(c, 16, 62);
        g += bond(c, right, { order: o.rightOrder || 1, rTo: 15 });
      }
      if (o.top) g += atom(top.x, top.y, 'O', { kind: o.topKind || 'plain' });
      if (o.right) g += atom(right.x, right.y, 'O', { kind: o.rightKind || 'plain' });
      g += atom(c.x, c.y, 'C', { kind: 'warn' });
      return { g, top, right };
    };
    const plusAt = (x, y) => text(x, y, '+', { cls: 'fg-warn', size: 15 });
    const sub = (x, y, t, cls) => text(x, y, t, { cls: cls || 'fg-sm', size: 9.5 });

    // ---- 1 protonate the carbonyl ----
    s += frame(8, 16, '1', 'PROTONATE THE C=O');
    let c = P(96, 132);
    let k = core(c, { top: 1, topOrder: 2 });
    s += k.g;
    s += lonePair(k.top.x, k.top.y, 232, { dist: 23 }) + lonePair(k.top.x, k.top.y, 308, { dist: 23 });
    let h = P(186, 74);
    s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + plusAt(h.x + 18, h.y - 10);
    s += curve(P(k.top.x + 18, k.top.y - 12), P(h.x - 13, h.y + 2), { bow: -16 });
    s += sub(126, 202, 'acid activates the electrophile');

    // ---- 2 first alcohol attacks ----
    s += frame(260, 16, '2', 'FIRST ROH ATTACKS C');
    c = P(342, 132);
    k = core(c, { top: 1, topOrder: 2, topKind: 'hi' });
    s += k.g;
    s += text(k.top.x + 22, k.top.y - 10, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += plusAt(k.top.x - 20, k.top.y - 12);
    let nu = P(444, 168);
    s += atom(nu.x, nu.y, 'O', { kind: 'hi' });
    s += text(nu.x + 20, nu.y - 12, 'H', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(nu.x + 20, nu.y + 20, 'R', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += lonePair(nu.x, nu.y, 186, { dist: 23 });
    s += curve(P(nu.x - 22, nu.y - 6), P(c.x + 16, c.y + 8), { bow: 18 });
    s += curve(P(c.x + 5, c.y - 16), P(c.x + 12, c.y - 44), { bow: 12 });
    s += sub(378, 196, 'TWO arrows: ROH to carbon,');
    s += sub(378, 210, 'and the pi bond up onto oxygen');

    // ---- 3 deprotonate, giving the hemiacetal ----
    s += frame(512, 16, '3', 'LOSE H⁺ → HEMIACETAL');
    c = P(596, 132);
    k = core(c, { top: 1, right: 1, rightKind: 'hi' });
    s += k.g;
    s += text(k.top.x - 22, k.top.y - 8, 'H', { cls: 'fg-lbl', size: 11, anchor: 'end' });
    s += plusAt(k.right.x + 4, k.right.y - 24);
    s += text(k.right.x + 4, k.right.y + 28, 'R', { cls: 'fg-sm', size: 10 });
    h = P(k.right.x + 42, k.right.y - 6);
    s += bond(k.right, h, { rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    s += sub(600, 202, 'one OH and one OR: the hemiacetal');
    s += curve(P(h.x + 22, h.y - 34), P(h.x + 4, h.y - 14), { bow: 12 });

    // ---- 4 protonate the OH ----
    s += frame(8, 240, '4', 'PROTONATE THAT OH');
    c = P(96, 356);
    k = core(c, { top: 1, right: 1 });
    s += k.g;
    s += text(k.top.x + 22, k.top.y - 8, 'H', { cls: 'fg-lbl', size: 11, anchor: 'start' });
    s += lonePair(k.top.x, k.top.y, 200, { dist: 23 });
    s += text(k.right.x + 4, k.right.y - 24, 'R', { cls: 'fg-sm', size: 10 });
    h = P(24, 300);
    s += atom(h.x, h.y, 'H', { r: 12, kind: 'hi' }) + plusAt(h.x - 4, h.y - 22);
    s += curve(P(k.top.x - 20, k.top.y - 8), P(h.x + 12, h.y + 2), { bow: 16 });
    s += sub(126, 202 + 224, 'a hopeless leaving group becomes water');

    // ---- 5 water leaves ----
    s += frame(260, 240, '5', 'LOSE WATER → OXOCARBENIUM');
    c = P(348, 356);
    k = core(c, { top: 1, right: 1, topKind: 'warn' });
    s += k.g;
    s += text(k.top.x - 26, k.top.y - 14, 'H', { cls: 'fg-sm', size: 10 });
    s += text(k.top.x + 22, k.top.y - 14, 'H', { cls: 'fg-sm', size: 10 });
    s += plusAt(k.top.x + 2, k.top.y - 30);
    s += text(k.right.x + 4, k.right.y - 24, 'R', { cls: 'fg-sm', size: 10 });
    s += curve(P(c.x - 14, c.y - 24), P(k.top.x - 14, k.top.y + 16), { bow: 18 });
    s += sub(378, 202 + 224, 'the C–O bond leaves WITH the oxygen');

    // ---- 6 second alcohol attacks the oxocarbenium ----
    s += frame(512, 240, '6', 'SECOND ROH ATTACKS');
    c = P(596, 356);
    k = core(c, { right: 1, rightOrder: 2, rightKind: 'hi' });
    s += k.g;
    s += plusAt(k.right.x + 4, k.right.y - 24);
    s += text(k.right.x + 4, k.right.y + 28, 'R', { cls: 'fg-sm', size: 10 });
    nu = P(c.x - 4, c.y - 62);
    s += atom(nu.x, nu.y, 'O', { kind: 'hi' });
    s += text(nu.x - 22, nu.y - 12, 'H', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(nu.x + 20, nu.y - 12, 'R', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += lonePair(nu.x, nu.y, 110, { dist: 23 });
    s += curve(P(nu.x + 12, nu.y + 20), P(c.x + 8, c.y - 18), { bow: -14 });
    s += curve(P(c.x + 28.7, c.y - 12.3), P(c.x + 49, c.y - 24), { bow: -14 });
    s += sub(610, 202 + 224, 'flat carbon, open from both faces');
    s += sub(610, 216 + 224, 'and the pi bond goes up onto O');

    // ---- 7 deprotonate, giving the acetal ----
    s += frame(8, 464, '7', 'LOSE H⁺ → ACETAL');
    c = P(96, 590);
    k = core(c, { top: 1, right: 1, topKind: 'hi' });
    s += k.g;
    s += plusAt(k.top.x + 2, k.top.y - 24);
    s += text(k.top.x - 22, k.top.y - 8, 'R', { cls: 'fg-sm', size: 10, anchor: 'end' });
    s += text(k.right.x + 4, k.right.y - 24, 'R', { cls: 'fg-sm', size: 10 });
    h = P(k.top.x + 40, k.top.y - 4);
    s += bond(k.top, h, { rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    s += curve(P(h.x + 22, h.y - 32), P(h.x + 4, h.y - 14), { bow: 12 });
    s += sub(126, 202 + 448, 'two OR groups, no carbonyl left');

    // the running commentary, beside the last frame
    s += text(272, 512, 'Every one of the seven is an equilibrium.', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(272, 540, 'Read left to right with the water pulled out by a Dean–Stark', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 558, 'trap and you are protecting a carbonyl. Read right to left in', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 576, 'dilute aqueous acid and you are deprotecting it. The steps do', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 594, 'not change — only which side you flood.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 626, 'Count the protons: one in at step 1, one out at step 3, one in', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 644, 'at step 4, one out at step 7. The acid is a catalyst, and a', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(272, 662, 'mechanism that does not balance that way has a step missing.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });

    s += rule(30, 696, 730, 696);
    s += text(380, 722, 'protonate · add · deprotonate   —   then protonate · lose water · add · deprotonate', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The whole mechanism as elementary steps, which is how an exam asks for it. Two halves of three and four: an ordinary acid-catalyzed addition gives the hemiacetal, then the hemiacetal’s OH is turned into water, ionizes, and is replaced by a second alcohol. The oxocarbenium ion in the middle — drawn here as its C=O<sup>+</sup> contributor, with the positive charge on oxygen and the electrophilic carbon flat and open — is what makes the second half possible at all.',
  note: 'Two steps carry the difficulty. Step 5 is where the arrow starts on the <b>C–O bond</b> and ends on the oxygen — the leaving group departs with the electron pair, exactly as in any SN1 — and step 6 is where the flat sp² carbon of the oxocarbenium ion is attacked from either face. Note the arrow count in steps 2 and 6: the species drawn there still has a C=O double bond, so the nucleophile’s arrow must be paired with a second one pushing that pi bond up onto oxygen, or the carbon ends up with five bonds. Everything else is a proton moving on or off an oxygen.',
});

export default FIGURES;
