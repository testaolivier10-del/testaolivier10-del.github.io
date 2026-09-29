/* Figures for the polymer-properties notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 51 ---
   A polymer needs two transition temperatures where a small molecule needs
   one, and which regions each describes is the thing students merge. */
FIGURES.push({
  id: 'tg-and-tm',
  section: 'polymer-properties',
  anchor: '<h3>Thermoplastic against thermoset</h3>',
  viewBox: '0 0 760 370',
  alt: 'Stiffness plotted on a log scale against temperature for two polymers: an amorphous one whose modulus falls three decades at the glass transition and then flows, and a semicrystalline one that steps down only slightly at the glass transition, holds a long plateau, and collapses at the melting temperature',
  build() {
    let s = '';
    /* SVG has no subscript, so the symbol is a tspan dropped below the
       baseline. The prose writes T<sub>g</sub>; the figure has to match it
       or the reader is looking at a different symbol. */
    const T = (x, y, sub, cls, size) =>
      `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" font-size="${size}">T<tspan dy="3.5" font-size="${size * 0.75}">${sub}</tspan></text>`;

    s += tag(380, 26, 'WHAT THE TWO TRANSITIONS DO TO STIFFNESS');
    const X0 = 96, X1 = 700, Y0 = 62, Y1 = 296;
    s += rule(X0, Y1, X1, Y1);
    s += rule(X0, Y1, X0, Y0);
    s += text(X0 + 6, Y0 - 10, 'stiffness (modulus), log scale', { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    s += text(694, Y1 - 8, 'temperature →', { cls: 'fg-tag', size: 11, anchor: 'end' });

    const TG = 286, TM = 580;
    s += `<line class="fg-dash" x1="${TG}" y1="${Y0 + 6}" x2="${TG}" y2="${Y1}"></line>`;
    s += `<line class="fg-dash" x1="${TM}" y1="${Y0 + 6}" x2="${TM}" y2="${Y1}"></line>`;
    s += T(TG, Y0, 'g', 'fg-tag-good', 13);
    s += T(TM, Y0, 'm', 'fg-tag-good', 13);

    /* Amorphous: one cliff, at Tg, and then it flows. */
    s += `<path class="fg-bond-hi" fill="none" d="M110 96 L256 100 C276 102 272 212 300 216 L392 232 C424 238 432 290 460 294"></path>`;
    s += text(118, 84, 'amorphous — polystyrene', { cls: 'fg-tag-warn', size: 10, anchor: 'start' });
    s += text(196, 236, 'three decades, all at once', { cls: 'fg-sm', size: 9.5 });

    /* Semicrystalline: a step at Tg, a long plateau, a cliff at Tm. */
    s += `<path class="fg-bond" fill="none" d="M110 130 L258 134 C278 136 276 168 300 172 L556 184 C580 188 584 290 606 294"></path>`;
    s += text(336, 164, 'semicrystalline — HDPE', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(462, 212, 'the crystallites are still holding it together', { cls: 'fg-sm', size: 9.5 });

    s += text(180, Y1 + 24, 'glassy', { cls: 'fg-tag', size: 10.5 });
    s += text(430, Y1 + 24, 'rubbery, or tough and useful', { cls: 'fg-tag', size: 10.5 });
    s += text(648, Y1 + 24, 'flows or melts', { cls: 'fg-tag', size: 10.5 });

    s += rule(24, 328, 700, 328);
    s += text(360, 354, 'How much each transition matters depends on how crystalline the sample is.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The two transitions seen as what they actually do: change the stiffness. For a fully amorphous polymer the glass transition <i>is</i> the softening point &mdash; the modulus falls by a factor of a thousand there and the material is finished. For a semicrystalline one the same transition barely registers, because only the tangled fraction has softened. The axis is schematic and the two curves are stacked to compare their <i>shapes</i>: the shared T<sub>g</sub> line is not a claim that polystyrene and HDPE soften at the same temperature, since their real glass transitions are about 220&nbsp;&deg;C apart.',
  note: 'That second curve is the answer to a question the bare temperature axis cannot settle: why HDPE is rigid at room temperature although it is far above its T<sub>g</sub>. Its crystalline regions act as physical cross-links, tying the mobile chains together, and they hold the sample in one piece all the way to T<sub>m</sub> &mdash; where they finally come apart, and the stiffness falls off a cliff instead of a step. A fully amorphous polymer has no such cliff, because it has no T<sub>m</sub> to reach.',
});

/* ----------------------------------------------------------------- 77 ---
   Cross-link density is the section's second big idea and was undrawn. The
   same four chains three times, with only the number of sulfur bridges
   changing, is the honest way to say "dial". */
FIGURES.push({
  id: 'crosslink-dial',
  section: 'polymer-properties',
  anchor: '<p class="step-body">Everything a rubber band does is set by where on that dial it sits, and the dial is turned by one number: how much sulfur went in.</p>',
  viewBox: '0 0 760 340',
  alt: 'The same four wavy polymer chains drawn three times: loose and staggered with no bridges, tied by three short sulfur bridges, and tied by a dense mesh of them',
  build() {
    let s = '';
    const wavy = (x0, y, len, amp) => {
      let d = `M${x0} ${y}`;
      for (let i = 1; i <= 8; i++) {
        const x = x0 + (len * i) / 8;
        d += ` Q${x0 + (len * (i - 0.5)) / 8} ${y + (i % 2 ? amp : -amp)} ${x} ${y}`;
      }
      return `<path class="fg-bond" fill="none" d="${d}"></path>`;
    };
    const YS = [76, 112, 148, 184];
    const panelAt = (ox, kind, title, stagger, bridges, out1, out2) => {
      let g = panel(ox, 56, 220, 152, { kind });
      g += tag(ox + 110, 44, title);
      YS.forEach((y, i) => { g += wavy(ox + 14 + (stagger ? i * 5 : 0), y, 178, 7); });
      for (const [bx, a, b] of bridges) {
        g += `<line class="fg-bond-hi" x1="${ox + bx}" y1="${YS[a] + 8}" x2="${ox + bx}" y2="${YS[b] - 8}"></line>`;
      }
      g += text(ox + 110, 232, out1, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 11.5 });
      g += text(ox + 110, 250, out2, { cls: 'fg-sm', size: 9.5 });
      return g;
    };
    s += panelAt(24, 'warn', 'no cross-links', true, [],
      'it flows', 'chains slide past each other for good');
    s += panelAt(270, null, 'a few percent', false,
      [[56, 0, 1], [132, 1, 2], [92, 2, 3]],
      'elastic', 'it deforms, then comes back');
    s += panelAt(516, null, 'heavily cross-linked', false,
      [[40, 0, 1], [86, 0, 1], [132, 0, 1], [178, 0, 1],
       [52, 1, 2], [98, 1, 2], [144, 1, 2],
       [40, 2, 3], [86, 2, 3], [132, 2, 3], [178, 2, 3]],
      'hard and brittle', 'nothing can move at all: ebonite');
    s += text(380, 284, 'Each highlighted bridge is a short run of sulfur atoms, –S–S–, tying one chain to the next.', { cls: 'fg-lbl', size: 11.5 });
    s += rule(24, 302, 700, 302);
    s += text(380, 326, 'One variable — how much sulfur — and three materials come out of it.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Cross-linking as a dial rather than a switch. The chains are the same in all three panels and so is the chemistry; only the number of bridges between them changes, and that alone takes the material from a gum that flows to a tire and then to something you could make a bowling ball from.',
  note: 'The middle panel is where the entropy argument lives. Pull on it and the coiled chains straighten, which costs a great deal of conformational freedom; let go and that freedom is what pulls them back. Without the bridges the chains would simply slide past one another and stay where you left them, which is the left-hand panel; with too many of them nothing can straighten in the first place, which is the right.',
});

export default FIGURES;
