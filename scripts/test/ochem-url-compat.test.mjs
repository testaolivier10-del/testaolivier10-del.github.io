/* Old ochem links and saved progress keep working after a chapter reorder.

   The October 2026 reorder moved IR & MS, Aromatic Chemistry and the Grignard
   chapter forward and added two topics. Everything a learner has saved or
   bookmarked is keyed by a topic or chapter ID, never by position, except one
   thing: the exam page's midterm range, which used to be saved as chapter
   numbers. These tests hold that line:

   - every topic id and chapter id of the order before the reorder still
     exists, so lessons/<id>.html, notes/<id>.html, learn.html#<id>,
     learn.html#m-<chapter>, ?topic=, ?chapter= and every localStorage record
     keyed by those ids still resolve;
   - a midterm range saved as numbers in the old order is read back as the
     same chapters, by id, and a range saved as ids survives a reorder. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const LEGACY_TOPICS = ['atomic-structure', 'orbitals', 'hybridization', 'bonding', 'electronegativity', 'formal-charge', 'lewis-structures', 'molecular-geometry', 'bond-polarity', 'functional-groups', 'skeletal-structures', 'curved-arrows', 'resonance', 'naming-parent-chain', 'naming-substituents', 'naming-functional-groups', 'naming-rings-unsaturation', 'bronsted', 'conjugate', 'pka', 'acidity-factors', 'lewis-acids', 'newman', 'cyclohexanes', 'axial-equatorial', 'ring-flips', 'conformational-analysis', 'chirality', 'stereocenters', 'rs-configuration', 'enantiomers', 'diastereomers', 'meso', 'fischer', 'cis-trans-ez', 'prochirality', 'nucleophiles', 'electrophiles', 'electron-rich-poor', 'leaving-groups', 'energy-diagrams', 'carbocations', 'radical-halogenation', 'sn2', 'sn1', 'e2', 'e1', 'substrate-effects', 'alkene-structure', 'addition-reactions', 'markovnikov', 'alkene-oxidation', 'hydrogenation', 'alkynes', 'conjugated-systems', 'diene-addition', 'kinetic-thermodynamic', 'diels-alder', 'uv-vis', 'alcohol-reactions', 'ether-chemistry', 'epoxides', 'aldehydes-ketones', 'nucleophilic-addition', 'hydrates-cyanohydrins', 'acetals', 'imines-enamines', 'wittig-reaction', 'aldehyde-oxidation', 'oxidation-states', 'alcohol-oxidation', 'carbonyl-reduction', 'carboxylic-acids', 'esters-amides', 'acyl-substitution', 'acyl-chlorides-anhydrides', 'nitriles', 'baeyer-villiger', 'organometallic-bonding', 'grignard-reagents', 'organolithium-reagents', 'gilman-reagents', 'cross-coupling', 'alpha-hydrogens', 'aldol', 'claisen', 'alpha-halogenation', 'enolate-regiochemistry', 'ester-syntheses', 'michael-robinson', 'aromaticity', 'eas', 'directing-effects', 'amine-structure', 'amine-reactions', 'amine-synthesis', 'hofmann-elimination', 'nucleophilic-aromatic', 'benzylic-reactivity', 'phenols', 'birch-reduction', 'diazonium-chemistry', 'ir', 'h-nmr', 'c-nmr', 'mass-spec', 'retrosynthesis', 'carbon-carbon-bonds', 'functional-group-interconversion', 'protecting-groups', 'multistep-synthesis', 'carbohydrates', 'amino-acids', 'peptides-proteins', 'lipids', 'nucleic-acids', 'polymer-basics', 'addition-polymers', 'condensation-polymers', 'polymer-properties', 'polymer-design'];

function boot(){
  const b = createBrowser();
  b.load('ochem/assets/curriculum.js');
  b.load('ochem/assets/exam-core.js');
  return b.window;
}
const ids = (w) => Array.from(w.OchemCurriculum.MODULES, (m) => m.id);

test('every topic id from before the reorder still exists, with its pages', () => {
  const w = boot();
  for (const id of LEGACY_TOPICS) {
    const t = w.OchemCurriculum.findTopic(id);
    assert.ok(t, `topic ${id} disappeared, so lessons/${id}.html bookmarks and its saved progress are orphaned`);
    assert.ok(existsSync(`ochem/notes/${id}.html`), `ochem/notes/${id}.html is gone`);
    assert.ok(existsSync(`ochem/${t.href}`), `ochem/${t.href} is gone`);
  }
});

test('every chapter id from before the reorder still exists', () => {
  const w = boot();
  const now = ids(w);
  for (const id of w.OchemExamCore.LEGACY_ORDER) {
    assert.ok(now.includes(id), `chapter ${id} disappeared, so learn.html#m-${id} and ?chapter=${id} links break`);
  }
});

test('a midterm range saved as old chapter numbers is read back as the same chapters', () => {
  const w = boot();
  const X = w.OchemExamCore, now = ids(w);
  // 1-12 used to be "Foundations through Carbonyl Chemistry".
  let r = X.midtermRange({ from: 1, to: 12 }, now);
  assert.equal(r.fromId, 'foundations');
  assert.equal(r.toId, 'carbonyl-chemistry');
  // 10-20 used to be "Conjugation through Spectroscopy".
  r = X.midtermRange({ from: 10, to: 20 }, now);
  assert.equal(r.fromId, 'conjugation');
  assert.equal(r.toId, 'spectroscopy');
  // The old default, 1-9, still ends at Alkenes & Alkynes.
  r = X.midtermRange({ from: 1, to: 9 }, now);
  assert.equal(r.toId, 'alkenes-alkynes');
});

test('a range saved as ids wins over numbers and survives any reorder', () => {
  const w = boot();
  const X = w.OchemExamCore, now = ids(w);
  const r = X.midtermRange({ fromId: 'aromatic-chemistry', toId: 'carbonyl-chemistry', from: 1, to: 2 }, now);
  assert.equal(r.fromId, 'aromatic-chemistry');
  assert.equal(r.toId, 'carbonyl-chemistry');
  const reversed = now.slice().reverse();
  const r2 = X.midtermRange({ fromId: 'aromatic-chemistry', toId: 'carbonyl-chemistry' }, reversed);
  assert.deepEqual([r2.fromId, r2.toId], ['carbonyl-chemistry', 'aromatic-chemistry'], 'kept in course order');
});

test('nothing saved, or junk saved, falls back to the default range', () => {
  const w = boot();
  const X = w.OchemExamCore, now = ids(w);
  const dflt = { fromId: 'foundations', toId: 'alkenes-alkynes' };
  for (const p of [null, {}, { from: 99, to: -3 }, { fromId: 'nope', toId: 'gone' }]) {
    const r = X.midtermRange(p, now, dflt);
    assert.equal(r.fromId, 'foundations');
    assert.equal(r.toId, 'alkenes-alkynes');
  }
});
