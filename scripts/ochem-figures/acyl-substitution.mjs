/* Figures for the acyl-substitution notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ 1 ---
   Why acid derivatives only react downhill. The ladder is the organising
   fact of the whole chapter and the notes state it in words only. */
FIGURES.push({
  id: 'acyl-ladder',
  section: 'acyl-substitution',
  anchor: '<h3>Which group leaves?</h3>',
  alt: 'Acid derivative reactivity ladder from acyl chloride down to amide, against leaving-group stability',
  viewBox: '0 0 760 330',
  build() {
    const rows = [
      { y: 62,  name: 'Acyl chloride',  g: 'Cl',   lg: 'Cl⁻',   pka: 'pKa −7',  w: 300, kind: 'hi'   },
      { y: 124, name: 'Anhydride',      g: 'OCOR', lg: 'RCO₂⁻', pka: 'pKa 4.8', w: 224, kind: 'hi'   },
      { y: 186, name: 'Ester',          g: 'OR',   lg: 'RO⁻',   pka: 'pKa 16',  w: 128, kind: 'hi'   },
      { y: 248, name: 'Amide',          g: 'NR₂',  lg: 'R₂N⁻',  pka: 'pKa 38',  w: 44,  kind: 'warn' },
    ];
    let s = '';
    s += tag(176, 30, 'the group that leaves');
    s += tag(348, 30, 'how stable it is once it has left');
    s += tag(540, 30, 'reactivity');
    for (const r of rows) {
      s += label(8, r.y + 4, r.name, { anchor: 'start', size: 12 });
      s += text(176, r.y + 4, r.g, { cls: 'fg-lbl', size: 11.5 });
      s += text(276, r.y + 4, r.lg, { cls: 'fg-sm', size: 10.5 });
      s += text(356, r.y + 4, r.pka, { cls: 'fg-sm', size: 10 });
      s += bar(410, r.y - 8, r.w * 0.68, 16, { kind: r.kind === 'warn' ? 'warn' : 'hi', opacity: 0.3 + r.w / 440 });
    }
    // The one-way arrow down the ladder. Its label goes above it; hanging off
    // the side put half the words outside the viewBox.
    s += arrow(P(700, 78), P(700, 268));
    s += text(700, 64, 'only this way', { cls: 'fg-tag', size: 10.5 });
    s += rule(8, 42, 730, 42);
    return s;
  },
  caption: 'The ladder every acyl substitution runs down. A derivative reacts to give one <b>below</b> it and never one above, and the single reason is the column in the middle: the leaving group departs as an anion, and how willing it is to do that is how stable that anion is once formed.',
  note: 'Read the pKa column as the whole explanation. Cl⁻ is the conjugate base of a strong acid and perfectly happy alone; R₂N⁻ is the conjugate base of something barely acidic at all and is a ferociously strong base. That is why an acyl chloride converts to an amide on contact and an amide needs hours of hot aqueous acid to go anywhere.',
});

/* ---------------------------------------------------------------- 168 ---
   Fischer esterification, which the section describes in five sentences of
   prose and every exam asks for as arrows. Two rows of panels, because five
   structures do not fit across one reading column. */
FIGURES.push({
  id: 'fischer-five-steps',
  section: 'acyl-substitution',
  anchor: 'Same protonation-as-activation strategy you have now seen in alcohol chemistry, ether cleavage, and acetal formation.</p>',
  viewBox: '0 0 760 430',
  alt: 'Five panels of Fischer esterification: protonating the carbonyl, methanol attacking, the neutral tetrahedral intermediate, loss of water after protonating an OH, and deprotonation to methyl acetate',
  build() {
    let s = '';
    // 1 - protonate the carbonyl
    let c = P(120, 116), o = P(120, 70), og = P(164, 144), hg = P(204, 162), me = P(76, 144);
    s += bond(c, o, { order: 2 }); s += bond(c, og); s += bond(c, me); s += bond(og, hg, { rTo: 10 });
    s += atom(me.x, me.y, 'Me'); s += atom(og.x, og.y, 'O'); s += atom(hg.x, hg.y, 'H', { r: 10 });
    s += atom(o.x, o.y, 'O'); s += lonePair(o.x, o.y, 200);
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(214, 66, 'H⁺', { cls: 'fg-lbl', size: 13 });
    s += curve(P(120, 46), P(200, 62), { bow: -18 });
    s += tag(130, 200, '1 · protonate the C=O');

    // 2 - methanol attacks
    c = P(380, 116); o = P(380, 70); og = P(424, 144); hg = P(464, 162); me = P(336, 144);
    s += bond(c, o, { order: 2 }); s += bond(c, og); s += bond(c, me); s += bond(og, hg, { rTo: 10 });
    s += atom(me.x, me.y, 'Me'); s += atom(og.x, og.y, 'O'); s += atom(hg.x, hg.y, 'H', { r: 10 });
    s += atom(o.x, o.y, 'O', { kind: 'warn' }); s += text(406, 62, '+', { cls: 'fg-warn', size: 15 });
    s += bond(o, P(380, 30), { rTo: 10 }); s += atom(380, 30, 'H', { r: 10 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += atom(288, 100, 'MeOH', { kind: 'hi' });
    s += curve(P(306, 112), P(362, 112), { bow: 20 });
    s += curve(P(400, 112), P(398, 90), { bow: 14 });
    s += tag(380, 200, '2 · methanol attacks');

    // 3 - the neutral tetrahedral intermediate
    c = P(630, 116);
    s += bond(c, P(630, 70)); s += bond(c, P(676, 144)); s += bond(c, P(584, 144)); s += bond(c, P(586, 84));
    s += atom(630, 70, 'OH'); s += atom(676, 144, 'OMe'); s += atom(584, 144, 'OH'); s += atom(586, 84, 'Me');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += tag(630, 200, '3 · tetrahedral, neutral');

    s += rule(24, 224, 726, 224);

    // 4 - protonate an OH and lose water
    c = P(210, 300);
    s += bond(c, P(210, 254), { order: 2 }); s += bond(c, P(254, 328)); s += bond(c, P(166, 328));
    s += atom(210, 254, 'O'); s += atom(254, 328, 'OMe'); s += atom(166, 328, 'Me');
    s += text(236, 246, '+', { cls: 'fg-warn', size: 15 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(322, 296, '− H₂O', { cls: 'fg-lbl', size: 13 });
    s += tag(230, 376, '4 · protonate an OH, lose water');

    // 5 - deprotonate
    c = P(560, 300);
    s += bond(c, P(560, 254), { order: 2 }); s += bond(c, P(604, 328)); s += bond(c, P(516, 328));
    s += atom(560, 254, 'O'); s += lonePair(560, 254, 200); s += lonePair(560, 254, 340);
    s += atom(604, 328, 'OMe'); s += atom(516, 328, 'Me');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += tag(560, 376, '5 · deprotonate — methyl acetate');

    s += text(380, 410, 'Every step is reversible: run it right to left with water and it is hydrolysis.', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Acid catalysis doing two different jobs with one proton. Step 1 makes a carbon electrophilic enough for a neutral alcohol to attack at all; step 4 turns an OH, which would never leave, into water, which will. Nothing anionic appears anywhere in the sequence, which is the test of whether a mechanism written under acid is written correctly.',
  note: 'Two proton transfers are carried by the panel labels rather than by arrows: methanol’s oxygen loses its proton between panels 2 and 3, and one OH picks one up between panels 3 and 4. Draw them in when a question asks for every step — they are real, and in acid they are the fastest events in the flask. Count the arrows that are not reversible: none. That is why the reaction settles near 65% conversion and has to be driven — excess alcohol, or water removed as it forms. It is also why the same five panels, read from the right with water in place of methanol, are acid-catalyzed ester hydrolysis rather than a separate mechanism to learn.',
});

/* ---------------------------------------------------------------- 169 ---
   Saponification, whose pitfall box turns on the exact order of three steps
   and which the section never drew. */
FIGURES.push({
  id: 'saponification-driving-step',
  section: 'acyl-substitution',
  anchor: 'and it is why saponification does not reverse while acid hydrolysis does.</div>',
  viewBox: '0 0 760 310',
  alt: 'Three panels of saponification: hydroxide attacking ethyl acetate, the tetrahedral alkoxide expelling ethoxide, and ethoxide deprotonating the acetic acid irreversibly',
  build() {
    let s = '';
    let c = P(150, 120);
    s += bond(c, P(150, 74), { order: 2 }); s += bond(c, P(196, 148)); s += bond(c, P(104, 148));
    s += atom(150, 74, 'O'); s += lonePair(150, 74, 200);
    s += atom(196, 148, 'OEt'); s += atom(104, 148, 'Me');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += atom(48, 92, 'HO', { kind: 'warn' }); s += text(74, 70, '−', { cls: 'fg-hi', size: 15 });
    s += curve(P(66, 104), P(132, 114), { bow: 18 });
    s += curve(P(166, 100), P(160, 84), { bow: 14 });
    s += tag(140, 196, '1 · hydroxide attacks');

    s += arrow(P(250, 120), P(306, 120), { muted: true });

    c = P(400, 120);
    s += bond(c, P(400, 74)); s += bond(c, P(446, 148)); s += bond(c, P(354, 148)); s += bond(c, P(356, 88));
    s += atom(400, 74, 'O', { kind: 'warn' }); s += text(426, 66, '−', { cls: 'fg-hi', size: 15 });
    s += atom(446, 148, 'OEt'); s += atom(354, 148, 'Me'); s += atom(356, 88, 'OH');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += curve(P(418, 90), P(408, 106), { bow: -14 });
    s += curve(P(420, 142), P(452, 168), { bow: 16 });
    s += tag(400, 196, '2 · ethoxide is expelled');

    s += arrow(P(500, 120), P(556, 120), { muted: true });

    c = P(626, 120);
    s += bond(c, P(626, 74), { order: 2 }); s += bond(c, P(672, 148)); s += bond(c, P(580, 148));
    s += atom(626, 74, 'O'); s += lonePair(626, 74, 200);
    s += atom(672, 148, 'O'); s += text(700, 154, '−', { cls: 'fg-hi', size: 15 });
    s += atom(580, 148, 'Me');
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += text(626, 44, 'EtO⁻ takes the proton', { cls: 'fg-tag-good', size: 11 });
    s += tag(626, 196, '3 · irreversible');

    s += rule(24, 226, 726, 226);
    s += text(24, 254, 'Step 3 is the one that cannot run backwards: a carboxylate is a dead end.', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(24, 278, 'Acid hydrolysis has no step like it, which is why it settles at equilibrium.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Three steps, and the order is the whole answer. Addition first, then collapse, and only then — because only then does an acid exist — the proton transfer. That last step consumes the ethoxide just released and leaves a carboxylate no nucleophile wants to attack.',
  note: 'The proton transfer in panel 3 is stated rather than drawn; put an arrow on it (ethoxide’s lone pair to the acid’s O–H) if a question asks for a full mechanism, because it is the step the whole reaction turns on. This is why saponification is stoichiometric in hydroxide rather than catalytic: one equivalent of base is genuinely consumed, ending up on the product. It is also why the acid has to be recovered at the end with a separate acidification — what comes out of the flask is the salt.',
});

export default FIGURES;
