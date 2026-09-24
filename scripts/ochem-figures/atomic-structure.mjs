/* Figures for the atomic-structure notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- F7 ---
   What a covalent bond IS, in the shell picture the section is already
   using. The prose says "sharing electrons is precisely what a covalent
   bond is" with nothing beside it, and the whole idea is that ONE pair is
   counted by BOTH atoms, which is exactly the kind of claim a drawing can
   make and a sentence cannot. */
FIGURES.push({
  id: 'shared-pair-counts-twice',
  section: 'atomic-structure',
  anchor: '<h3>Transfer or share: the two ways to satisfy an octet</h3>',
  viewBox: '0 0 760 280',
  alt: 'Two overlapping shell diagrams for a hydrogen molecule and, beside them, a sodium and a chlorine drawn separately as ions. In the shared picture one pair of electrons sits in the overlap and is counted by both atoms; in the transferred picture the electron has moved completely from sodium to chlorine and the two carry full charges.',
  build() {
    let s = '';
    // Left: sharing.
    {
      s += text(190, 40, 'SHARING — a covalent bond', { cls: 'fg-tag-good', size: 12 });
      const A = P(140, 140), B = P(240, 140);
      s += `<circle class="fg-orb-node" cx="${A.x}" cy="${A.y}" r="56"></circle>`;
      s += `<circle class="fg-orb-node" cx="${B.x}" cy="${B.y}" r="56"></circle>`;
      s += atom(A.x, A.y, 'H'); s += atom(B.x, B.y, 'H');
      // the shared pair, in the overlap
      s += `<circle class="fg-lp" cx="186" cy="140" r="4.6"></circle>`;
      s += `<circle class="fg-lp" cx="200" cy="140" r="4.6"></circle>`;
      s += text(190, 118, 'one pair', { cls: 'fg-tag-good', size: 10.5 });
      s += text(190, 216, 'the pair sits in the overlap, and BOTH', { cls: 'fg-sm', size: 10.5 });
      s += text(190, 232, 'atoms count it toward a full shell', { cls: 'fg-sm', size: 10.5 });
      s += text(190, 256, 'neither atom pays for a charge', { cls: 'fg-tag-good', size: 11 });
    }
    s += rule(380, 40, 380, 266);
    // Right: transfer.
    {
      s += text(570, 40, 'TRANSFER — an ionic bond', { cls: 'fg-tag', size: 12 });
      const A = P(500, 140), B = P(646, 140);
      s += `<circle class="fg-orb-node" cx="${A.x}" cy="${A.y}" r="42"></circle>`;
      s += `<circle class="fg-orb-node" cx="${B.x}" cy="${B.y}" r="56"></circle>`;
      s += atom(A.x, A.y, 'Na', { kind: 'warn' }); s += atom(B.x, B.y, 'Cl', { kind: 'warn' });
      s += text(500, 86, '+', { cls: 'fg-tag-warn', size: 15 });
      s += text(646, 74, '−', { cls: 'fg-tag-warn', size: 15 });
      s += arrow(P(546, 140), P(584, 140));
      s += `<circle class="fg-lp" cx="612" cy="140" r="4.6"></circle>`;
      s += text(565, 118, 'the electron', { cls: 'fg-sm', size: 10 });
      s += text(570, 216, 'the electron has moved across entirely;', { cls: 'fg-sm', size: 10.5 });
      s += text(570, 232, 'nothing is shared, and the ions attract', { cls: 'fg-sm', size: 10.5 });
      s += text(570, 256, 'both atoms now carry a full charge', { cls: 'fg-tag', size: 11 });
    }
    return s;
  },
  caption: 'The two ways to fill a shell, side by side. On the left one pair of electrons sits between the two hydrogens and each atom counts that same pair toward its own full shell — which is why sharing is cheap and why two atoms can both be satisfied by two electrons. On the right the electron has gone across completely: sodium is left a cation, chlorine an anion, and nothing is shared at all.',
  note: 'Carbon can do neither trick on its own terms. Four electrons is too many to give away and too many to take on, so every bond carbon makes is the left-hand picture — which is the reason organic chemistry is a covalent subject from end to end, and why the ions you do meet (a sodium beside a carboxylate, a lithium beside an alkoxide) sit at the edges of a molecule rather than inside it.',
});

export default FIGURES;
