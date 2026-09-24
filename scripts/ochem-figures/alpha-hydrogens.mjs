/* Figures for the alpha-hydrogens notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ 3 ---
   Where the enolate's nucleophilic character actually lives. */
FIGURES.push({
  id: 'enolate-resonance',
  section: 'alpha-hydrogens',
  anchor: '<h3>Why: delocalization into the carbonyl</h3>',
  alt: 'The two resonance forms of an enolate, with the carbon-centered form doing the chemistry',
  viewBox: '0 0 660 250',
  build() {
    let s = '';
    const draw = (ox, negOnO) => {
      const ca = P(ox, 150), cb = P(ox + 74, 150), o = P(ox + 74, 92);
      let g = '';
      g += bond(ca, cb, { order: negOnO ? 2 : 1 });
      g += bond(cb, o, { order: negOnO ? 1 : 2 });
      g += atom(o.x, o.y, negOnO ? 'O⁻' : 'O', { kind: negOnO ? 'warn' : 'plain' });
      g += atom(cb.x, cb.y, 'C');
      g += atom(ca.x, ca.y, negOnO ? 'C' : 'C⁻', { kind: negOnO ? 'plain' : 'warn' });
      g += text(ox, 196, negOnO ? 'charge on oxygen' : 'charge on carbon', { cls: 'fg-sm', size: 10.5 });
      return g;
    };
    s += tag(140, 48, 'the form that is more stable');
    s += tag(500, 48, 'the form that does the chemistry');
    s += draw(100, true);
    s += draw(460, false);

    // Double-headed resonance arrow
    s += arrow(P(300, 140), P(352, 140), { muted: true });
    s += arrow(P(352, 140), P(300, 140), { muted: true });

    s += text(140, 218, 'oxygen is more electronegative,', { cls: 'fg-sm', size: 10 });
    s += text(140, 232, 'so it holds the charge better', { cls: 'fg-sm', size: 10 });
    s += text(500, 218, 'carbon is the better nucleophile,', { cls: 'fg-sm', size: 10 });
    s += text(500, 232, 'so this is the end that attacks', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'An enolate is one species with its charge spread over two atoms, and the two resonance forms are not equally useful. The oxygen form is the better description of where the electrons <b>are</b>; the carbon form is the better description of what the enolate <b>does</b>.',
  note: 'This is the single most useful thing to hold onto in <a class="chapter-ref" href="/ochem/learn.html#m-enolate-chemistry">Enolate Chemistry</a>. Every enolate reaction — aldol, Claisen, alkylation — is the alpha carbon attacking something, even though a charge drawn on oxygen is the more stable picture. More stable and more reactive point in opposite directions here, and the reactive end is the one that shows up in the products.',
});

/* ----------------------------------------------------------------- 88 ---
   Keto and enol are two compounds with the enolate between them, and the
   section that says so had no picture — so the arrow that matters (⇌, not ↔)
   was a typographic instruction rather than a thing you could see. */
FIGURES.push({
  id: 'keto-enol-bridge',
  section: 'alpha-hydrogens',
  anchor: 'draw them with ⇌, never ↔.</p>',
  viewBox: '0 0 700 404',
  alt: 'Acetone and its enol in equilibrium, with the enolate drawn below as the intermediate of the base-catalyzed route',
  build() {
    let s = '';
    // Keto form
    s += tag(140, 34, 'KETO — what you have');
    const k1 = P(70, 132), k2 = P(130, 104), ko = P(130, 54), k3 = P(190, 132);
    s += bond(k1, k2); s += bond(k2, ko, { order: 2 }); s += bond(k2, k3);
    s += atom(k1.x, k1.y, 'CH₃'); s += atom(k2.x, k2.y, 'C'); s += atom(k3.x, k3.y, 'CH₃');
    s += atom(ko.x, ko.y, 'O');
    s += lonePair(ko.x, ko.y, 180); s += lonePair(ko.x, ko.y, 0);
    s += text(130, 176, 'acetone — 99.9999% of it', { cls: 'fg-sm', size: 10.5 });

    // Enol form
    s += tag(560, 34, 'ENOL — the other tautomer');
    const e1 = P(490, 132), e2 = P(550, 104), eo = P(550, 54), e3 = P(610, 132);
    s += bond(e1, e2, { order: 2 }); s += bond(e2, eo); s += bond(e2, e3);
    s += atom(e1.x, e1.y, 'CH₂', { kind: 'hi' }); s += atom(e2.x, e2.y, 'C'); s += atom(e3.x, e3.y, 'CH₃');
    s += atom(eo.x, eo.y, 'OH');
    s += lonePair(eo.x, eo.y, 180); s += lonePair(eo.x, eo.y, 0);
    s += text(550, 176, 'nucleophilic at the α carbon', { cls: 'fg-sm', size: 10.5 });

    // The equilibrium between them
    s += arrow(P(266, 96), P(414, 96), { muted: true });
    s += arrow(P(414, 114), P(266, 114), { muted: true });
    s += text(340, 76, 'H⁺ cat. or base cat.', { cls: 'fg-tag', size: 11 });
    s += text(340, 140, 'a proton has MOVED', { cls: 'fg-tag-warn', size: 11 });

    // The enolate underneath, the common intermediate of the base route
    s += panel(170, 200, 360, 152, {});
    s += text(350, 226, 'ENOLATE — the bridge, on the base route', { cls: 'fg-lbl', size: 12.5 });
    const a1 = P(290, 326), a2 = P(350, 300), ao = P(350, 256), a3 = P(410, 326);
    s += bond(a1, a2, { order: 2 }); s += bond(a2, ao); s += bond(a2, a3);
    s += atom(a1.x, a1.y, 'CH₂', { kind: 'hi' }); s += atom(a2.x, a2.y, 'C'); s += atom(a3.x, a3.y, 'CH₃');
    s += atom(ao.x, ao.y, 'O⁻', { kind: 'warn' });
    s += lonePair(ao.x, ao.y, 180, { dist: 20 }); s += lonePair(ao.x, ao.y, 0, { dist: 20 });
    s += lonePair(ao.x, ao.y, 270, { dist: 20 });
    s += text(350, 370, 'one anion, two resonance forms — ↔ belongs in here', { cls: 'fg-sm', size: 10.5 });

    // Routes in and out of it
    s += arrow(P(140, 200), P(190, 246));
    s += text(92, 234, 'base takes', { cls: 'fg-tag', size: 11 });
    s += text(92, 250, 'the α hydrogen', { cls: 'fg-tag', size: 11 });
    s += arrow(P(510, 246), P(560, 200));
    s += text(612, 234, 'put H⁺ back', { cls: 'fg-tag', size: 11 });
    s += text(612, 250, 'on OXYGEN', { cls: 'fg-tag', size: 11 });

    s += text(350, 396, 'Protonate that same anion on CARBON instead and you are back at the ketone.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Keto and enol are two compounds, and the enolate is what sits between them on the base-catalyzed route. Which atom of the enolate picks up the proton decides which tautomer you get: oxygen gives the enol, carbon gives the ketone back.',
  note: 'Read the arrows as the vocabulary they are. The <b>⇌</b> across the top joins two different compounds that interconvert, because a hydrogen is genuinely in a different place in each. The <b>↔</b> belongs only inside the box, between two ways of drawing one anion. Under acid the order is reversed — protonate the oxygen first, then lose the α hydrogen — and no anion appears at all.',
});

export default FIGURES;
