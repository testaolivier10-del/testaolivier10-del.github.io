/* Figures for the atomic-structure notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This is the first topic of the course, before skeletal structures, so every
   atom in every drawing carries a label. Most figures are drawn 340 wide, with
   fg-lbl and fg-tag text only, so the same drawing can sit in the notes and in
   a lesson card. The one wide figure (the periodic-table strip) is notes-only. */
import { atom, bond, arrow, curve, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];
const r2 = (v) => Math.round(v * 100) / 100;

/* A shell (Bohr-style) atom: a labeled nucleus with dashed rings, one ring
   per shell, and the electrons as dots on the rings. `shells` lists the
   electron count in each shell from the inside out. The outermost shell is
   teal (valence) and the inner ones gray (core), unless `valence` says which
   shell index to colour teal (-1 for none).

   Electron placement: the first four electrons in a shell sit one each at
   top, right, bottom and left; the fifth to eighth pair up with them. That is
   how shell diagrams are usually drawn, and it makes a count of 5 or 7 read
   as "pairs plus singles" at a glance. A K shell's two sit at top and bottom. */
const SLOT = [-90, 0, 90, 180];
function shellAtom(cx, cy, sym, shells, opts = {}) {
  const r0 = opts.r0 ?? 26, step = opts.step ?? 15, dot = opts.dot ?? 3.6;
  const valence = opts.valence ?? shells.length - 1;
  let s = '';
  shells.forEach((n, i) => {
    let count = n;
    const r = r0 + i * step;
    s += `<circle class="fg-orb-node" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
    const cls = i === valence ? 'fg-lp' : 'fg-lp-mut';
    const angles = [];
    const hollow = i === shells.length - 1 ? (opts.hollow || 0) : 0;
    count += hollow;
    if (i === 0 && count <= 2 && opts.kPair !== false) {
      if (count >= 1) angles.push(-90);
      if (count >= 2) angles.push(90);
    } else {
      const pairs = Math.max(0, count - 4);
      for (let j = 0; j < 4 && j < count; j++) {
        if (j < pairs) angles.push(SLOT[j] - 12, SLOT[j] + 12);
        else angles.push(SLOT[j]);
      }
    }
    angles.forEach((a, k) => {
      const rad = (a * Math.PI) / 180;
      const hole = k >= angles.length - hollow;
      s += `<circle class="${hole ? 'fg-dash-hi' : cls}" cx="${r2(cx + Math.cos(rad) * r)}" cy="${r2(cy + Math.sin(rad) * r)}" r="${hole ? dot + 1 : dot}"></circle>`;
    });
  });
  s += atom(cx, cy, sym, { kind: opts.kind || 'hi', r: 15, size: sym.length > 1 ? 12 : 14 });
  return s;
}

/* A shared pair in a dot drawing: two dots side by side across the line
   joining a and b, at the midpoint (or at fraction f along it). */
function pairDots(a, b, opts = {}) {
  const f = opts.f ?? 0.5, spread = opts.spread ?? 4.2, rr = opts.r ?? 2.6;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const mx = a.x + dx * f + (opts.shiftX || 0), my = a.y + dy * f + (opts.shiftY || 0);
  const px = -dy / len * spread, py = dx / len * spread;
  return `<circle class="fg-lp" cx="${r2(mx + px)}" cy="${r2(my + py)}" r="${rr}"></circle>` +
         `<circle class="fg-lp" cx="${r2(mx - px)}" cy="${r2(my - py)}" r="${rr}"></circle>`;
}
/* A lone pair at distance d from an atom centre, pointing at angle deg (0 = east, clockwise positive in SVG). */
function lp(c, deg, d = 24, spread = 4.2) {
  const a = (deg * Math.PI) / 180;
  const x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d;
  const px = -Math.sin(a) * spread, py = Math.cos(a) * spread;
  return `<circle class="fg-lp" cx="${r2(x + px)}" cy="${r2(y + py)}" r="2.6"></circle>` +
         `<circle class="fg-lp" cx="${r2(x - px)}" cy="${r2(y - py)}" r="2.6"></circle>`;
}
/* A fishhook arrow (one barb, for one electron), copied from
   build-ochem-figures.mjs. */
function fishhook(a, b, opts = {}) {
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 9;
  const px = -uy, py = ux;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * (opts.side ?? 1);
  return `<path class="fg-arrow" d="M${r2(a.x)} ${r2(a.y)} Q${r2(cx)} ${r2(cy)} ${r2(bx)} ${r2(by)}"></path>` +
         `<path class="fg-head" d="M${r2(b.x)} ${r2(b.y)} L${r2(bx + px * h)} ${r2(by + py * h)} L${r2(bx)} ${r2(by)} Z"></path>`;
}
const at = (c, deg, d) => P(r2(c.x + Math.cos((deg * Math.PI) / 180) * d), r2(c.y + Math.sin((deg * Math.PI) / 180) * d));
const ring = (c, r, cls = 'fg-dash-hi') => `<circle class="${cls}" cx="${c.x}" cy="${c.y}" r="${r}"></circle>`;

/* ---------------------------------------------------------------- 1 ---
   Isotopes: the same electrons around two different nuclei. Redrawn from the
   hand-written SVG that used to sit here, at lesson width, with the nucleus
   contents written on the drawing instead of only in the caption. */
FIGURES.push({
  id: 'carbon-isotopes',
  section: 'atomic-structure',
  lessons: ['atomic-structure'],
  anchor: '<h3>Isotopes and mass number</h3>',
  viewBox: '0 0 340 236',
  alt: 'Shell diagrams of carbon-12 and carbon-13 side by side. Each has a nucleus labeled C with two gray inner electrons and four teal outer electrons. Under carbon-12 the nucleus holds 6 protons and 6 neutrons, mass number 12; under carbon-13 it holds 6 protons and 7 neutrons, mass number 13.',
  build() {
    let s = '';
    const rows = [
      { x: 85, name: 'carbon-12 (¹²C)', n: '6 p + 6 n', m: 'mass number 12', share: '98.9% of carbon' },
      { x: 255, name: 'carbon-13 (¹³C)', n: '6 p + 7 n', m: 'mass number 13', share: '1.1% of carbon' },
    ];
    for (const r of rows) {
      s += tag(r.x, 20, r.name);
      s += shellAtom(r.x, 92, 'C', [2, 4]);
      s += text(r.x, 162, r.n, { cls: 'fg-lbl', size: 13 });
      s += tag(r.x, 182, r.m);
      s += text(r.x, 200, r.share, { cls: 'fg-tag-mut', size: 11 });
    }
    s += rule(170, 30, 170, 204);
    s += text(170, 228, 'same 6 electrons in both', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Compare the nucleus labels under each atom: only the neutron count differs. The rings of electrons are identical, including the four outer ones in teal that form bonds.',
});

/* ---------------------------------------------------------------- 2 ---
   The worked example: nitrogen filled from the inside out, with each shell
   named on the drawing. */
FIGURES.push({
  id: 'nitrogen-shells',
  section: 'atomic-structure',
  anchor: '<h3>Shells and valence electrons</h3>',
  viewBox: '0 0 340 190',
  alt: 'Shell diagram of a neutral nitrogen atom. The inner K shell holds two gray core electrons. The outer L shell holds five teal valence electrons: one pair and three single electrons. Labels give 7 protons and 7 electrons.',
  build() {
    let s = '';
    const c = P(92, 92);
    s += shellAtom(c.x, c.y, 'N', [2, 5]);
    // leader lines from each ring to its label
    s += `<line class="fg-rule" x1="${c.x + 20}" y1="${c.y - 18}" x2="190" y2="58"></line>`;
    s += text(196, 54, 'K shell: 2 core', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    s += text(196, 68, 'electrons (gray)', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    s += `<line class="fg-rule" x1="${c.x + 36}" y1="${c.y + 22}" x2="190" y2="120"></line>`;
    s += text(196, 116, 'L shell: 5 valence', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(196, 130, 'electrons (teal)', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(170, 178, '7 protons, so 7 electrons: 2 + 5', { cls: 'fg-lbl', size: 13 });
    return s;
  },
  caption: 'Nitrogen, Z = 7, filled from the inside out. The L shell has room for 8 and holds 5.',
});

/* ---------------------------------------------------------------- 3 ---
   Where the "group number minus ten" shortcut comes from: rows 1 to 3 of the
   periodic table, with the gap where the transition metals sit in later rows. */
FIGURES.push({
  id: 'valence-from-group',
  section: 'atomic-structure',
  anchor: '<h3>Shells and valence electrons</h3>',
  viewBox: '0 0 680 290',
  alt: 'The first three rows of the periodic table. Row 1 holds H and He; row 2 Li, Be, B, C, N, O, F, Ne; row 3 Na, Mg, Al, Si, P, S, Cl, Ar. Group numbers 1, 2 and 13 to 18 head the columns, with a gap between groups 2 and 13 where the ten transition-metal columns, groups 3 to 12, sit from row 4 on. Under the table, the valence electron count for each column is 1, 2, 3, 4, 5, 6, 7 and 8, and the older labels are IA to VIIIA. H, C, N, O, F and Cl are highlighted.',
  build() {
    let s = '';
    const cols = [
      { g: '1', x: 125, v: '1', old: 'IA' }, { g: '2', x: 181, v: '2', old: 'IIA' },
      { g: '13', x: 357, v: '3', old: 'IIIA' }, { g: '14', x: 413, v: '4', old: 'IVA' },
      { g: '15', x: 469, v: '5', old: 'VA' }, { g: '16', x: 525, v: '6', old: 'VIA' },
      { g: '17', x: 581, v: '7', old: 'VIIA' }, { g: '18', x: 637, v: '8', old: 'VIIIA' },
    ];
    const rows = [
      ['H', null, null, null, null, null, null, 'He'],
      ['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'],
      ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
    ];
    const hi = new Set(['H', 'C', 'N', 'O', 'F', 'Cl']);
    const y0 = 44, h = 40, gap = 4, w = 52;
    s += text(8, 30, 'group', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    cols.forEach((c) => { s += tag(c.x, 30, c.g); });
    rows.forEach((row, ri) => {
      const y = y0 + ri * (h + gap);
      s += text(8, y + 25, `row ${ri + 1}`, { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
      row.forEach((sym, ci) => {
        if (!sym) return;
        const x = cols[ci].x;
        s += panel(x - w / 2, y, w, h, { kind: hi.has(sym) ? 'hi' : undefined, r: 6 });
        s += text(x, y + 25, sym === 'He' ? 'He*' : sym, { cls: 'fg-lbl', size: 13 });
      });
    });
    // the gap
    s += text(269, 84, 'groups 3–12:', { cls: 'fg-tag-mut', size: 11 });
    s += text(269, 100, 'ten columns of', { cls: 'fg-tag-mut', size: 11 });
    s += text(269, 116, 'transition metals,', { cls: 'fg-tag-mut', size: 11 });
    s += text(269, 132, 'from row 4 down', { cls: 'fg-tag-mut', size: 11 });
    const yv = y0 + 3 * (h + gap) + 26;
    s += rule(8, yv - 18, 666, yv - 18);
    s += text(8, yv, 'valence e⁻', { cls: 'fg-tag', size: 11, anchor: 'start' });
    cols.forEach((c) => { s += text(c.x, yv, c.g === '18' ? '8*' : c.v, { cls: 'fg-lbl', size: 13 }); });
    s += text(8, yv + 24, 'older label', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    cols.forEach((c) => { s += text(c.x, yv + 24, c.old, { cls: 'fg-tag-mut', size: 11 }); });
    s += text(269, yv, 'subtract 10 →', { cls: 'fg-tag', size: 11 });
    s += text(340, yv + 56, '* He is the one exception: group 18, but only 2 valence electrons (its one shell is full at 2)', { cls: 'fg-tag-mut', size: 11 });
    s += panel(170, yv + 70, 22, 16, { kind: 'hi', r: 4 });
    s += text(200, yv + 83, 'shaded: the elements organic chemistry uses most', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Read down a column: every element in it has the same number of valence electrons. Across the gap, the group number jumps by ten, so subtract ten. The older labels give the count directly.',
});

/* ---------------------------------------------------------------- 3b --
   Lesson-width version of the group shortcut: one row of the table. */
FIGURES.push({
  id: 'l-valence-row',
  lessons: ['atomic-structure'],
  viewBox: '0 0 340 198',
  alt: 'Row 2 of the periodic table: Li, Be, then a gap for groups 3 to 12, then B, C, N, O, F, Ne. Above each element is its group number, 1, 2, 13, 14, 15, 16, 17, 18. Below each is its valence electron count, 1 to 8. C, N, O and F are shaded as the elements organic chemistry uses most.',
  build() {
    let s = '';
    const cols = [
      ['1', 24, 'Li', '1'], ['2', 62, 'Be', '2'], ['13', 112, 'B', '3'], ['14', 150, 'C', '4'],
      ['15', 188, 'N', '5'], ['16', 226, 'O', '6'], ['17', 264, 'F', '7'], ['18', 302, 'Ne', '8'],
    ];
    const hi = new Set(['C', 'N', 'O', 'F']);
    s += tag(170, 16, 'row 2 of the periodic table');
    for (const [g, x, sym, v] of cols) {
      s += text(x, 42, g, { cls: 'fg-tag', size: 11 });
      s += panel(x - 17, 52, 34, 36, { kind: hi.has(sym) ? 'hi' : undefined, r: 6 });
      s += text(x, 75, sym, { cls: 'fg-lbl', size: 13 });
      s += text(x, 114, v, { cls: 'fg-lbl', size: 13 });
    }
    s += `<line class="fg-dash" x1="87" y1="54" x2="87" y2="86"></line>`;
    s += rule(8, 96, 332, 96);
    s += text(170, 142, 'top: group number; bottom: valence electrons', { cls: 'fg-tag-mut', size: 11 });
    s += text(170, 162, 'groups 13 to 18: subtract 10', { cls: 'fg-tag', size: 11 });
    s += panel(22, 176, 20, 14, { kind: 'hi', r: 4 });
    s += text(48, 187, 'shaded: used most in organic chemistry', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    return s;
  },
  caption: 'Groups 1 and 2 give the count directly. The ten columns of groups 3 to 12 are missing from this row, so from group 13 on, subtract ten.',
});

/* ---------------------------------------------------------------- 4 ---
   Counting to eight. Electron-dot drawings, so every electron being counted
   is visible, with a dashed ring around the atom whose octet is counted. */
FIGURES.push({
  id: 'octet-count',
  section: 'atomic-structure',
  lessons: ['atomic-structure'],
  anchor: '<h3>Why valence electrons matter: the octet rule</h3>',
  viewBox: '0 0 340 416',
  alt: 'Electron-dot drawings of methane, ammonia and ethene. In methane a dashed ring around carbon encloses four shared pairs, 8 electrons; a smaller ring around one hydrogen encloses its single shared pair, 2 electrons. In ammonia a ring around nitrogen encloses three shared pairs and one lone pair, 8 electrons. In ethene a ring around the left carbon encloses two carbon-hydrogen pairs and the two pairs shared between the carbons, 8 electrons.',
  build() {
    let s = '';
    const D = 58;
    // Methane
    {
      const c = P(85, 96);
      s += tag(85, 20, 'methane, CH₄');
      const hs = [-90, 0, 90, 180].map((a) => at(c, a, D));
      s += ring(c, 38);
      hs.forEach((h) => { s += pairDots(c, h); s += atom(h.x, h.y, 'H', { r: 13, size: 12 }); });
      s += atom(c.x, c.y, 'C', { kind: 'hi', r: 15, size: 14 });
      s += ring(hs[1], 30, 'fg-dash');
      s += text(85, 186, '4 shared pairs', { cls: 'fg-tag', size: 11 });
      s += text(85, 202, '= 8 around C', { cls: 'fg-lbl', size: 13 });
      s += text(hs[1].x + 4, hs[1].y - 36, 'H: 2', { cls: 'fg-tag-mut', size: 11 });
    }
    // Ammonia
    {
      const c = P(255, 96);
      s += tag(255, 20, 'ammonia, NH₃');
      const hs = [180, 0, 90].map((a) => at(c, a, D));
      s += ring(c, 38);
      hs.forEach((h) => { s += pairDots(c, h); s += atom(h.x, h.y, 'H', { r: 13, size: 12 }); });
      s += lp(c, -90, 27);
      s += `<line class="fg-rule" x1="${c.x + 9}" y1="${c.y - 30}" x2="${c.x + 24}" y2="${c.y - 44}"></line>`;
      s += text(c.x + 26, c.y - 46, 'lone pair', { cls: 'fg-tag', size: 11, anchor: 'start' });
      s += atom(c.x, c.y, 'N', { kind: 'hi', r: 15, size: 14 });
      s += text(255, 186, '3 shared + 1 lone pair', { cls: 'fg-tag', size: 11 });
      s += text(255, 202, '= 8 around N', { cls: 'fg-lbl', size: 13 });
    }
    s += rule(170, 30, 170, 208);
    s += rule(16, 226, 324, 226);
    // Ethene
    {
      const c1 = P(140, 316), c2 = P(200, 316);
      s += tag(170, 252, 'ethene, C₂H₄ (a double bond)');
      s += ring(c1, 40);
      const h1 = [at(c1, -130, D), at(c1, 130, D)];
      const h2 = [at(c2, -50, D), at(c2, 50, D)];
      h1.forEach((h) => { s += pairDots(c1, h); s += atom(h.x, h.y, 'H', { r: 13, size: 12 }); });
      h2.forEach((h) => { s += pairDots(c2, h); s += atom(h.x, h.y, 'H', { r: 13, size: 12 }); });
      // two shared pairs between the carbons: four dots in a square
      for (const dx of [-4.2, 4.2]) for (const dy of [-5, 5]) {
        s += `<circle class="fg-lp" cx="${170 + dx}" cy="${316 + dy}" r="2.6"></circle>`;
      }
      s += atom(c1.x, c1.y, 'C', { kind: 'hi', r: 15, size: 14 });
      s += atom(c2.x, c2.y, 'C', { kind: 'hi', r: 15, size: 14 });
      s += text(170, 394, '2 C–H pairs + 2 C=C pairs', { cls: 'fg-tag', size: 11 });
      s += text(170, 410, '= 8 around each C', { cls: 'fg-lbl', size: 13 });
    }
    return s;
  },
  caption: 'Each pair of dots between two atoms is a shared pair, and the atoms on both sides count it. Count the dots inside each dashed ring.',
});

/* ---------------------------------------------------------------- 5 ---
   Share or transfer. Kept its id from the earlier version; redrawn at lesson
   width with the two panels stacked. */
FIGURES.push({
  id: 'shared-pair-counts-twice',
  section: 'atomic-structure',
  lessons: ['atomic-structure'],
  anchor: '<h3>Transfer or share: the two ways to satisfy an octet</h3>',
  viewBox: '0 0 340 372',
  alt: 'Top: the outer shells of sodium, with one electron, and chlorine, with seven; an arrow carries sodium\'s electron to the empty place in chlorine\'s shell, leaving Na+ and Cl−, labeled as an ionic bond. Bottom: two hydrogen atoms whose shells overlap, with one pair of electrons in the overlap, labeled as a covalent bond that both atoms count.',
  build() {
    let s = '';
    // Transfer: outer shells only
    s += tag(170, 20, 'TRANSFER: an ionic bond', { cls: 'fg-tag-warn' });
    s += shellAtom(78, 100, 'Na', [1], { r0: 36, kind: 'warn', kPair: false });
    s += shellAtom(262, 100, 'Cl', [7], { r0: 36, kind: 'warn', hollow: 1 });
    // Na's one electron (top of its ring) to the gap in Cl's ring (upper left)
    s += fishhook(P(84, 60), P(221, 90), { bow: -40, side: -1 });
    s += text(78, 154, 'Na → Na⁺', { cls: 'fg-lbl', size: 13 });
    s += text(262, 154, 'Cl → Cl⁻', { cls: 'fg-lbl', size: 13 });
    s += text(170, 174, 'arrow: Na\'s one outer electron moves to Cl', { cls: 'fg-tag-mut', size: 11 });
    s += rule(16, 190, 324, 190);
    // Sharing
    s += tag(170, 212, 'SHARING: a covalent bond', { cls: 'fg-tag-good' });
    const A = P(130, 288), B = P(210, 288);
    s += `<circle class="fg-orb-node" cx="${A.x}" cy="${A.y}" r="48"></circle>`;
    s += `<circle class="fg-orb-node" cx="${B.x}" cy="${B.y}" r="48"></circle>`;
    s += atom(A.x, A.y, 'H', { r: 13, size: 12 }); s += atom(B.x, B.y, 'H', { r: 13, size: 12 });
    s += `<circle class="fg-lp" cx="170" cy="282" r="3.6"></circle><circle class="fg-lp" cx="170" cy="294" r="3.6"></circle>`;
    s += text(170, 360, 'one shared pair; each H counts it: 2 each', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Top: only the outer shells are drawn. Sodium\'s one outer electron fills the gap in chlorine\'s outer shell, and nothing is shared. Bottom: one pair between two hydrogens, counted by both.',
});

/* ---------------------------------------------------------------- 6 ---
   Cation and anion from the shell picture: Na (2, 8, 1) to Na+ (2, 8), and
   F (2, 7) to F- (2, 8). */
FIGURES.push({
  id: 'sodium-fluorine-ions',
  section: 'atomic-structure',
  lessons: ['atomic-structure'],
  anchor: '<h3>Ions: what "cation" and "anion" mean</h3>',
  viewBox: '0 0 340 348',
  alt: 'Top row: a sodium atom with shells of 2, 8 and 1 electrons loses its one outer electron and becomes Na+, with shells of 2 and 8. Bottom row: a fluorine atom with shells of 2 and 7 gains one electron and becomes F−, with shells of 2 and 8.',
  build() {
    let s = '';
    // Sodium
    s += shellAtom(72, 82, 'Na', [2, 8, 1], { r0: 24, step: 15 });
    s += arrow(P(140, 82), P(196, 82));
    s += text(168, 70, 'loses 1 e⁻', { cls: 'fg-tag-warn', size: 11 });
    s += shellAtom(262, 82, 'Na', [2, 8], { r0: 24, step: 15 });
    s += text(310, 36, '+', { cls: 'fg-warn', size: 18 });
    s += text(72, 160, 'Na: 2, 8, 1', { cls: 'fg-lbl', size: 13 });
    s += text(262, 160, 'Na⁺: 2, 8', { cls: 'fg-lbl', size: 13 });
    s += tag(262, 176, 'cation: 11 p⁺, 10 e⁻');
    s += rule(16, 192, 324, 192);
    // Fluorine
    s += shellAtom(72, 262, 'F', [2, 7], { r0: 24, step: 15 });
    s += arrow(P(140, 262), P(196, 262));
    s += text(168, 250, 'gains 1 e⁻', { cls: 'fg-tag-good', size: 11 });
    s += shellAtom(262, 262, 'F', [2, 8], { r0: 24, step: 15 });
    s += text(302, 226, '−', { cls: 'fg-warn', size: 18 });
    s += text(72, 324, 'F: 2, 7', { cls: 'fg-lbl', size: 13 });
    s += text(262, 324, 'F⁻: 2, 8', { cls: 'fg-lbl', size: 13 });
    s += tag(262, 340, 'anion: 9 p⁺, 10 e⁻');
    return s;
  },
  caption: 'Both ions end with a full outer shell of 8. The nucleus does not change, so the charge is protons minus electrons.',
});

/* ---------------------------------------------------------------- 7 ---
   The chemistry fix. A group leaves carbon and takes the whole bonding pair.
   Two counts, drawn side by side, because the page used to give one and the
   lesson the other: carbon's OWN electrons drop by one (4 to 3, so +1), and
   the electrons AROUND it drop by two (8 to 6, two short of an octet). */
FIGURES.push({
  id: 'carbocation-count',
  section: 'atomic-structure',
  lessons: ['atomic-structure'],
  anchor: '<h3>Carbocations and carbanions: the same words on carbon</h3>',
  viewBox: '0 0 340 380',
  alt: 'Top: a carbon bonded to three R groups and a chlorine; the chlorine has three lone pairs, and a curved arrow moves the C–Cl bonding pair onto the chlorine. Counts: 8 electrons around carbon, 4 of them carbon\'s own, charge 0. Bottom: the products, a carbon with three R groups and a positive charge, and a chloride ion with four lone pairs. Counts: 6 electrons around carbon, 3 of them its own, charge +1.',
  build() {
    let s = '';
    const B = 50;
    // Before
    s += tag(170, 18, 'before: R₃C–Cl');
    const c = P(92, 86);
    const rs = [at(c, -90, B), at(c, 180, B), at(c, 90, B)];
    rs.forEach((r) => { s += bond(c, r, { rTo: 12 }); s += atom(r.x, r.y, 'R', { r: 12, size: 12 }); });
    const cl = P(c.x + 74, c.y);
    s += bond(c, cl, { cls: 'fg-bond-hi', rTo: 16 });
    s += atom(c.x, c.y, 'C', { kind: 'hi', r: 15, size: 14 });
    s += atom(cl.x, cl.y, 'Cl', { kind: 'warn', r: 16, size: 12 });
    s += lp(cl, -90, 25); s += lp(cl, 0, 25); s += lp(cl, 90, 25);
    s += curve(P(c.x + 34, c.y - 4), P(cl.x - 13, cl.y - 15), { bow: -14, size: 7 });
    s += text(226, 60, 'around C: 8', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(226, 80, 'C owns: 4', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(226, 100, 'charge: 0', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(170, 164, 'the arrow: both bond electrons go to Cl', { cls: 'fg-tag', size: 11 });
    s += rule(16, 182, 324, 182);
    // After
    s += tag(170, 206, 'after: R₃C⁺ + Cl⁻');
    const c2 = P(74, 282);
    const rs2 = [at(c2, -90, B), at(c2, 150, B), at(c2, 30, B)];
    rs2.forEach((r) => { s += bond(c2, r, { rTo: 12 }); s += atom(r.x, r.y, 'R', { r: 12, size: 12 }); });
    s += atom(c2.x, c2.y, 'C', { kind: 'hi', r: 15, size: 14 });
    s += text(c2.x + 22, c2.y - 14, '+', { cls: 'fg-warn', size: 18 });
    const cl2 = P(164, 282);
    s += atom(cl2.x, cl2.y, 'Cl', { kind: 'warn', r: 16, size: 12 });
    s += lp(cl2, -90, 25); s += lp(cl2, 0, 25); s += lp(cl2, 90, 25); s += lp(cl2, 180, 25);
    s += text(cl2.x + 26, cl2.y - 22, '−', { cls: 'fg-warn', size: 18 });
    s += text(226, 262, 'around C: 6', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(226, 282, 'C owns: 3', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(226, 302, 'charge: +1', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(170, 344, 'around C: 2 short of an octet', { cls: 'fg-tag-warn', size: 11 });
    s += text(170, 364, 'C\'s own count: 1 short of neutral', { cls: 'fg-tag-warn', size: 11 });
    return s;
  },
  caption: 'Each line is one shared pair. Follow the two electrons of the C–Cl bond: both end up on chlorine. Then compare the two counts for carbon before and after.',
});

/* ---------------------------------------------------------------- 8 ---
   The three states of a carbon, counted both ways. Redrawn from the older
   hand-written three-panel figure; the empty-orbital lobes are left out
   because orbitals are the next page and a flat drawing cannot place them. */
FIGURES.push({
  id: 'carbon-three-states',
  section: 'atomic-structure',
  lessons: ['atomic-structure'],
  anchor: '<h3>Carbocations and carbanions: the same words on carbon</h3>',
  viewBox: '0 0 340 244',
  alt: 'Three carbons side by side. Left, a carbanion: three R groups and a lone pair, 8 electrons around carbon, carbon owns 5, charge −1. Middle, a neutral carbon: three R groups and an H, 8 electrons around carbon, owns 4, charge 0. Right, a carbocation: three R groups only, 6 electrons around carbon, owns 3, charge +1.',
  build() {
    let s = '';
    const B = 42;
    const cols = [
      { x: 57, name: 'carbanion', cls: 'fg-tag', around: '8 around C', own: 'owns 5', q: '−1', four: 'lp' },
      { x: 170, name: 'neutral', cls: 'fg-tag-mut', around: '8 around C', own: 'owns 4', q: '0', four: 'H' },
      { x: 283, name: 'carbocation', cls: 'fg-tag-warn', around: '6 around C', own: 'owns 3', q: '+1', four: null },
    ];
    for (const k of cols) {
      const c = P(k.x, 92);
      s += text(k.x, 20, k.name, { cls: k.cls, size: 11 });
      const rs = [at(c, -90, B), at(c, 180, B), at(c, 0, B)];
      rs.forEach((r) => { s += bond(c, r, { rTo: 12 }); s += atom(r.x, r.y, 'R', { r: 12, size: 12 }); });
      if (k.four === 'H') { const h = at(c, 90, B); s += bond(c, h, { rTo: 12 }); s += atom(h.x, h.y, 'H', { r: 12, size: 12 }); }
      if (k.four === 'lp') s += lp(c, 90, 26);
      s += atom(c.x, c.y, 'C', { kind: 'hi', r: 15, size: 14 });
      if (k.q !== '0') s += text(c.x + 22, c.y - 16, k.q === '−1' ? '−' : '+', { cls: 'fg-warn', size: 18 });
      s += text(k.x, 172, k.around, { cls: 'fg-tag', size: 11 });
      s += text(k.x, 190, k.own, { cls: 'fg-tag-mut', size: 11 });
      s += text(k.x, 212, `charge ${k.q}`, { cls: 'fg-lbl', size: 13 });
    }
    s += rule(113, 30, 113, 218); s += rule(226, 30, 226, 218);
    s += text(170, 238, 'R = any carbon-based group', { cls: 'fg-tag-mut', size: 11 });
    return s;
  },
  caption: 'Only the carbocation falls short of 8. Its carbon has an empty orbital, room for one pair, and that is where an incoming pair goes.',
});

export default FIGURES;
