/* Figures for the ester-syntheses notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 41 ---
   The whole point of these two syntheses is a pKa difference, and a number
   line makes twelve orders of magnitude look like twelve orders of
   magnitude rather than like two numbers. */
FIGURES.push({
  id: 'activating-pka',
  section: 'ester-syntheses',
  anchor: '<h3>Malonic ester synthesis &rarr; a carboxylic acid</h3>',
  viewBox: '0 0 760 300',
  alt: 'A pKa scale from 10 to 26 showing an ester at 25 and malonate and acetoacetate near 11 to 13, with the base each one needs',
  build() {
    let s = '';
    const x = (pka) => 90 + ((26 - pka) / 16) * 580;
    s += rule(80, 186, 690, 186);
    for (let p = 10; p <= 26; p += 4) {
      s += rule(x(p), 186, x(p), 193);
      s += text(x(p), 208, String(p), { cls: 'fg-sm', size: 10 });
    }
    s += text(385, 230, 'α pKₐ', { cls: 'fg-tag', size: 11 });

    const mark = (pka, name, base, kind, up) => {
      const px = x(pka);
      s += rule(px, up ? 92 : 132, px, 186);
      s += panel(px - 84, up ? 56 : 96, 168, 36, { kind });
      s += text(px, up ? 74 : 114, name, { cls: 'fg-lbl', size: 11.5 });
      s += text(px, up ? 46 : 86, base, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 10.5 });
    };
    mark(25, 'a plain ester',       'needs LDA, and it fights back', 'warn', true);
    mark(13, 'diethyl malonate',    'NaOEt is enough', null, true);
    mark(11, 'ethyl acetoacetate',  'NaOEt is enough', null, false);

    s += rule(34, 248, 726, 248);
    s += text(380, 274, 'Twelve orders of magnitude, bought with one extra carbonyl — which is then thrown away.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'What the second carbonyl is for. An ester’s α hydrogen sits at pKa 25, where an alkoxide is far too weak and you need LDA at low temperature; flanking that carbon with a second carbonyl delocalizes the carbanion onto a second oxygen and drops it to 11 to 13, where the alkoxide matching your solvent does the job.',
  note: 'The carbonyl that made this possible is gone from the product. It was installed to acidify one hydrogen and is removed by hydrolysis and decarboxylation once the alkylation is done — which is what an activating group is, and the clearest example of one in the course. Note also that the decarboxylation works only because a second carbonyl sits β to the carboxyl — a ketone in the acetoacetic route, the other carboxyl in the malonic one — which is what lets the O–H reach it through a six-membered cyclic transition state.',
});

/* ---------------------------------------------------------------- B4 ---
   The section describes a cyclic transition state three times and draws it
   nowhere, which is the one thing here a picture can settle: whether the
   hydrogen can actually reach. */
FIGURES.push({
  id: 'decarboxylation-ts',
  section: 'ester-syntheses',
  anchor: 'An &alpha;- or &gamma;-keto acid reaches neither, and neither does a plain carboxylic acid.</p>',
  viewBox: '0 0 760 482',
  alt: 'The six-membered cyclic transition state of a beta-keto acid decarboxylation drawn with three curved arrows, the enol it gives with carbon dioxide leaving, the tautomerization to the ketone, and two failing cases where the ring would be five- or seven-membered',
  build() {
    let s = '';

    /* 1 — the hexagon. */
    s += tag(132, 36, '1 · the six-membered loop');
    s += panel(14, 44, 236, 244);
    {
      const Ok = P(96, 100), Ck = P(96, 154), Ca = P(150, 186), Cx = P(200, 154), Ox = P(200, 100), H = P(148, 76);
      const ring = [Ok, Ck, Ca, Cx, Ox, H];
      for (let i = 0; i < 6; i++) {
        const a = ring[i], b = ring[(i + 1) % 6];
        s += `<line class="fg-dash" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`;
      }
      s += bond(Ok, Ck, { order: 2, rFrom: 14, rTo: 14 });
      s += bond(Ck, Ca, { rFrom: 14, rTo: 14 });
      s += bond(Ca, Cx, { rFrom: 14, rTo: 14, cls: 'fg-bond-hi' });
      s += bond(Cx, Ox, { rFrom: 14, rTo: 14 });
      s += bond(Ox, H, { rFrom: 14, rTo: 12, cls: 'fg-bond-hi' });
      s += bond(Ck, P(48, 186), { rFrom: 14, rTo: 17 });
      s += bond(Cx, P(240, 186), { order: 2, rFrom: 14, rTo: 14 });
      s += atom(48, 186, 'CH₃', { r: 17 });
      s += atom(240, 186, 'O');
      s += atom(Ok.x, Ok.y, 'O');
      s += atom(Ck.x, Ck.y, 'C');
      s += atom(Ca.x, Ca.y, 'C', { kind: 'hi' });
      s += atom(Cx.x, Cx.y, 'C');
      s += atom(Ox.x, Ox.y, 'O');
      s += atom(H.x, H.y, 'H', { kind: 'warn', r: 12 });
      /* All three run the same way round the loop, clockwise as drawn:
         (a) the ketone C=O π picks up the carboxyl's H as a new O–H;
         (b) those O–H electrons become the second π of the departing CO2;
         (c) the Cα–C(O2H) bond becomes the C=C of the enol. */
      s += curve(P(84, 130), P(134, 72), { bow: -56 });
      s += curve(P(174, 88), P(206, 120), { bow: -14 });
      s += curve(P(176, 176), P(126, 184), { bow: -56 });
      s += text(132, 240, 'three arrows chasing each other', { cls: 'fg-sm', size: 10.5 });
      s += text(132, 260, 'round one dashed hexagon', { cls: 'fg-sm', size: 10.5 });
      s += text(132, 282, 'the O–H is what reaches', { cls: 'fg-tag', size: 11 });
    }

    /* 2 — CO2 leaves, an enol is left. */
    s += tag(380, 36, '2 · CO₂ leaves; an enol is left');
    s += panel(262, 44, 236, 244);
    {
      s += atom(380, 96, 'O=C=O', { kind: 'warn', r: 30, size: 10 });
      s += text(380, 134, 'gone, as a gas', { cls: 'fg-sm', size: 10.5 });
      const Ck = P(330, 196), Ca = P(392, 224), OH = P(330, 244);
      s += bond(Ck, Ca, { order: 2, rFrom: 14, rTo: 14 });
      s += bond(Ck, OH, { rFrom: 14, rTo: 16 });
      s += bond(Ck, P(288, 168), { rFrom: 14, rTo: 17 });
      s += bond(Ca, P(446, 224), { rFrom: 14, rTo: 13 });
      s += atom(288, 168, 'CH₃', { r: 17 });
      s += atom(446, 224, 'R', { r: 13 });
      s += atom(Ck.x, Ck.y, 'C');
      s += atom(Ca.x, Ca.y, 'C', { kind: 'hi' });
      s += atom(OH.x, OH.y, 'OH', { r: 16, size: 10.5 });
      s += text(380, 282, 'CH₃–C(OH)=CR₂, an enol', { cls: 'fg-tag', size: 11 });
    }

    /* 3 — tautomerize. */
    s += tag(620, 36, '3 · tautomerize to the ketone');
    s += panel(510, 44, 236, 244);
    {
      const Ck = P(578, 168), O = P(578, 116), Ca = P(640, 196);
      s += bond(Ck, O, { order: 2, rFrom: 14, rTo: 14 });
      s += bond(Ck, Ca, { rFrom: 14, rTo: 14 });
      s += bond(Ck, P(534, 200), { rFrom: 14, rTo: 17 });
      s += bond(Ca, P(694, 196), { rFrom: 14, rTo: 13 });
      s += bond(Ca, P(640, 244), { rFrom: 14, rTo: 12 });
      s += atom(534, 200, 'CH₃', { r: 17 });
      s += atom(694, 196, 'R', { r: 13 });
      s += atom(640, 244, 'H', { r: 12 });
      s += atom(O.x, O.y, 'O');
      s += atom(Ck.x, Ck.y, 'C');
      s += atom(Ca.x, Ca.y, 'C', { kind: 'hi' });
      s += text(614, 282, 'the α carbon takes the H', { cls: 'fg-sm', size: 10.5 });
    }

    /* the two failures. */
    s += rule(24, 312, 736, 312);
    s += tag(196, 340, 'an α-keto acid');
    s += tag(568, 340, 'a γ-keto acid');
    s += panel(14, 352, 356, 80, { kind: 'warn' });
    s += panel(390, 352, 356, 80, { kind: 'warn' });
    s += text(192, 384, 'the loop would have five atoms in it', { cls: 'fg-sm', size: 10.5 });
    s += text(192, 408, 'the O–H cannot reach — no reaction', { cls: 'fg-tag-warn', size: 11 });
    s += text(568, 384, 'the loop would have seven atoms in it', { cls: 'fg-sm', size: 10.5 });
    s += text(568, 408, 'too floppy to close — no reaction', { cls: 'fg-tag-warn', size: 11 });
    s += label(380, 462, 'Only a carbonyl exactly β to the carboxyl puts the H and the O six atoms apart.');
    return s;
  },
  caption: 'Decarboxylation here is not thermal decomposition, it is a cyclic proton transfer. Three pairs of electrons move the same way round one six-membered loop: the second carbonyl&rsquo;s &pi; electrons collect the carboxyl hydrogen as a new O&ndash;H, those O&ndash;H electrons become the second &pi; bond of the departing CO<sub>2</sub>, and the C&ndash;C bond that breaks becomes the C=C of an enol.',
  note: 'The second carbonyl can be a ketone &mdash; the acetoacetic route, where the intermediate really is a &beta;-keto acid &mdash; or it can be the other carboxyl, which is the malonic route and a substituted malonic acid. The hexagon does not care which, which is why one mechanism covers both syntheses. It is also why the ester has to be hydrolyzed first: the loop is closed by the carboxyl O&ndash;H, and an ester has no O&ndash;H to close it with.',
});

export default FIGURES;
