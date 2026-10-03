/* Validator for bio/data/tools/tree-reading.json (simulator).
   Checks the data's shape, every stimulus question and the mini FRQ, then the
   trees through the model itself (ApBioMath.phylo): every tree parses and
   names each tip once; each morphology tree is exactly the tree its own
   character table gives (every shared derived character marks one clade, no
   two conflict); every build data set gives one tree with no conflicts;
   rotating any node never changes a tree's clades; DNA trees have positive
   branch lengths. Every number in the stimulus tables and the facts each
   question keys are recomputed from the trees. */
import { runtime, base, question, frq } from './_shared.mjs';

const SLUG = 'tree-reading';

export function treeOf(data, id, M) {
  const t = (data.trees || []).find(x => x.id === id);
  if (!t) throw new Error(`unknown tree "${id}"`);
  return { t, root: M.phylo.parse(t.newick) };
}
const nameOf = (t, id) => (t.taxa.find(x => x.id === id) || {}).name || id;

/* The rows a table's "check" spec gives (also used to write the tables). */
export function expectedRows(ck, data, M) {
  const { t, root } = treeOf(data, ck.tree, M);
  if (ck.x === 'chars') return t.taxa.map(x => [x.name, ...t.characters.map(c => c.has.includes(x.id) ? 'Yes' : 'No')]);
  if (ck.x === 'dist') return ck.taxa.map(a => [nameOf(t, a), ...ck.taxa.map(b => a === b ? '—' : M.fixed(M.phylo.distance(root, a, b), ck.d))]);
  throw new Error(`unknown check x "${ck.x}"`);
}
export function leafOrder(root, M) { return M.phylo.leaves(root).map(n => n.name); }

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, SLUG, map, errs, 'simulator');
  const P = M.phylo;
  if (!Array.isArray(data.trees) || data.trees.length < 3) { errs.push('"trees" needs at least three trees'); return errs; }
  const ids = new Set();
  for (const t of data.trees) {
    const w = `tree ${t.id}`;
    if (!t.id || ids.has(t.id)) errs.push(`${w}: missing or duplicate id`); ids.add(t.id);
    if (!t.title || !t.about) errs.push(`${w}: title and about are required`);
    let root;
    try { root = P.parse(t.newick); } catch (e) { errs.push(`${w}: ${e.message}`); continue; }
    const tips = P.leaves(root).map(n => n.name), names = (t.taxa || []).map(x => x.id);
    if (new Set(tips).size !== tips.length) errs.push(`${w}: a tip appears twice`);
    if (tips.slice().sort().join() !== names.slice().sort().join()) errs.push(`${w}: "taxa" must list exactly the tips (${tips.join(', ')})`);
    if ((t.taxa || []).some(x => !x.name)) errs.push(`${w}: every taxon needs a name`);
    if (!['morphology', 'dna'].includes(t.kind)) errs.push(`${w}: kind must be morphology or dna`);
    // rotation never changes the tree
    const key = P.key(root), clades = P.clades(root).join('|');
    P.internal(root).forEach(n => P.rotate(n));
    if (P.key(root) !== key || P.clades(root).join('|') !== clades) errs.push(`${w}: rotating nodes changed the tree`);
    if (t.kind === 'dna') {
      if (P.nodes(root).some(n => n !== root && !(n.len > 0))) errs.push(`${w}: every branch needs a positive length`);
      if (!t.unit) errs.push(`${w}: "unit" for the branch lengths is required`);
    }
    if (t.kind === 'morphology' || t.build) {
      if (!Array.isArray(t.characters) || !t.characters.length) { errs.push(`${w}: a character table is required`); continue; }
      for (const c of t.characters) {
        if (!c.id || !c.name || !Array.isArray(c.has)) errs.push(`${w}: each character needs id, name and has[]`);
        for (const x of c.has || []) if (!names.includes(x)) errs.push(`${w}: character ${c.id} names unknown taxon ${x}`);
        if (t.outgroup && (c.has || []).includes(t.outgroup)) errs.push(`${w}: the outgroup ${t.outgroup} must lack derived character ${c.id}`);
        if ((c.has || []).length >= 2 && !P.find(root, c.has)) errs.push(`${w}: character ${c.id} does not mark a clade of the tree`);
      }
      const built = P.fromCharacters(names, t.characters);
      if (built.conflicts.length) errs.push(`${w}: characters conflict: ${built.conflicts.map(x => x.join('/')).join(', ')}`);
      if (P.key(P.parse(built.tree)) !== key) errs.push(`${w}: the character table gives ${built.tree}, not the tree's ${t.newick}`);
      if (!t.outgroup || !names.includes(t.outgroup)) errs.push(`${w}: "outgroup" must be one of the taxa`);
    }
  }
  if (!data.trees.some(t => t.read && t.kind === 'dna')) errs.push('at least one DNA tree to read');
  if (data.trees.filter(t => t.build).length < 2) errs.push('at least two data sets to build from');
  // the stimulus tables, recomputed from the trees
  for (const [sid, s] of Object.entries(data.stimuli || {})) for (const tb of s.tables || []) {
    if (!tb.check) { errs.push(`${sid}: every table needs a "check" spec`); continue; }
    let want;
    try { want = expectedRows(tb.check, data, M); } catch (e) { errs.push(`${sid}: ${e.message}`); continue; }
    if (tb.rows.length !== want.length) { errs.push(`${sid} "${tb.caption}": ${tb.rows.length} rows, the check gives ${want.length}`); continue; }
    want.forEach((row, i) => row.forEach((v, j) => {
      if (tb.rows[i][j] !== v) errs.push(`${sid} "${tb.caption}": row ${i + 1} column ${j + 1} says ${tb.rows[i][j]}, the trees give ${v}`);
    }));
  }
  // the drawings in the stimulus: rotation gives the second order from the first
  const dr = data.stimuli && data.stimuli['tr-s1'] && data.stimuli['tr-s1'].drawings;
  if (dr) {
    const { root } = treeOf(data, dr.tree, M);
    if (leafOrder(root, M).join() !== dr.order1.join()) errs.push('tr-s1 drawings: order1 is not the tree as written');
    for (const set of dr.rotate) { const n = P.find(root, set); if (!n) errs.push(`tr-s1 drawings: no node for ${set.join(', ')}`); else P.rotate(n); }
    if (leafOrder(root, M).join() !== dr.order2.join()) errs.push(`tr-s1 drawings: rotating gives ${leafOrder(root, M).join(', ')}, not order2`);
  }
  // the facts the questions key
  const qs = data.questions || [], byId = id => qs.find(q => q.id === `${SLUG}:${id}`);
  try {
    const pl = treeOf(data, 'plants', M).root, pr = treeOf(data, 'primates', M).root;
    if (byId('plants:1') && !(P.mrca(pl, ['rose', 'grass']).depth > P.mrca(pl, ['rose', 'pine']).depth)) errs.push(`${SLUG}:plants:1: rose and grass must share a more recent ancestor than rose and pine`);
    if (byId('plants:1') && P.classify(pl, ['alga', 'moss']).kind === 'clade') errs.push(`${SLUG}:plants:1: alga and moss must not form a clade`);
    if (byId('plants:2') && P.classify(pl, ['moss', 'fern']).kind !== 'paraphyletic') errs.push(`${SLUG}:plants:2: moss and fern must be paraphyletic`);
    const d = (a, b) => P.distance(pr, a, b);
    if (byId('dna:4') && !(d('human', 'chimp') < d('human', 'gorilla') && d('human', 'gorilla') < d('human', 'orangutan') && d('human', 'orangutan') < d('human', 'macaque') && Math.abs(d('chimp', 'gorilla') - d('human', 'gorilla')) < 1e-9))
      errs.push(`${SLUG}:dna:4: Table 2 must put human and chimpanzee closest, then gorilla, then orangutan, with macaque outside`);
    const q5 = byId('dna:5');
    if (q5) {
      const rows = data.stimuli['tr-s1'].tables[1].rows, hc = Number(rows[0][2]), ho = Number(rows[0][4]);
      const want = Number(M.fixed(ho / hc * q5.calib, q5.numeric.decimals));
      if (Math.abs(q5.numeric.answer - want) > 1e-9) errs.push(`${SLUG}:dna:5: answer ${q5.numeric.answer}, Table 2 gives ${want}`);
    }
  } catch (e) { errs.push(e.message); }
  const qids = new Set();
  for (const q of qs) question(q, SLUG, map, data.stimuli, errs, qids);
  if (qs.length < 3 || qs.length > 5) errs.push(`a simulator has 3-5 stimulus questions (${qs.length})`);
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, SLUG, map, errs);
  return errs;
}
