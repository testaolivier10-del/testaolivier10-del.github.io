/* assets/cross-course.js — when a "the other course goes deeper" suggestion
   may appear, and whether each one points at something real.

   Every rule here fails in the expensive direction without throwing. Shown to
   a student already taking the target course, it reads as a site that does
   not know them. Shown twice, it is nagging. Shown on top of the save prompt,
   it competes with the one ask that protects work they already did. And a
   pair whose "A&P chapter 19" is really chapter 18, or whose link 404s, is a
   suggestion that teaches the student to ignore the next one. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

function fresh(){
  const b = createBrowser();
  b.load('assets/cross-course.js');
  return b;
}

const seen = b => JSON.parse(b.localStorage.getItem('levlprep_cross') || '{"seen":{}}').seen;

test('nothing is eligible before a milestone in a source topic', () => {
  const b = fresh();
  assert.equal(b.window.LevlCross.eligible('nremt', []), null);
  b.window.LevlCross.note(['nremt:Cardiac']);
  assert.equal(b.window.LevlCross.eligible('nremt', []).id, 'nremt-cardiac');
});

test('a tag no pair listens for is not stored', () => {
  const b = fresh();
  b.window.LevlCross.note(['nremt:Legal & Ethical Issues', 'nremt:Medical']);
  assert.equal(b.localStorage.getItem('levlprep_cross'), null);
});

test('not offered once the student has started the target course', () => {
  for (const [key, value] of [
    ['hub_xp_v1', JSON.stringify({ v: 1, total: 40, subjects: { anp: 40 } })],
    ['anp_progress_v1', JSON.stringify({ v: 1, q: { x: {} } })],
    ['anp_flashcards_v1', JSON.stringify({ c: {} })],
  ]) {
    const b = fresh();
    b.window.LevlCross.note(['nremt:Cardiac']);
    b.localStorage.setItem(key, value);
    assert.equal(b.window.LevlCross.eligible('nremt', ['nremt:Cardiac']), null, key);
  }
});

test('XP in some other course, or an empty record, does not count as started', () => {
  const b = fresh();
  b.window.LevlCross.note(['nremt:Cardiac']);
  b.localStorage.setItem('hub_xp_v1', JSON.stringify({ v: 1, total: 40, subjects: { nremt: 40 } }));
  b.localStorage.setItem('anp_progress_v1', '{}');
  assert.ok(b.window.LevlCross.eligible('nremt', []));
});

test('a pair from the session just finished wins over one met earlier', () => {
  const b = fresh();
  b.window.LevlCross.note(['nremt:Cardiac', 'nremt:s4']);
  assert.equal(b.window.LevlCross.eligible('nremt', ['nremt:s4']).id, 'nremt-diabetic');
});

test('only pairs from this course are offered on its screens', () => {
  const b = fresh();
  b.window.LevlCross.note(['anp:fluid-acid-base']);
  assert.equal(b.window.LevlCross.eligible('nremt', []), null);
  assert.equal(b.window.LevlCross.eligible('anp', []).id, 'anp-acid-base');
});

test('inside A&P chapter 2, the topic-level pair wins over the chapter-level one', () => {
  const b = fresh();
  const tags = ['anp:acids-bases-ph', 'anp:chem-physics'];
  b.window.LevlCross.note(tags);
  assert.equal(b.window.LevlCross.eligible('anp', tags).id, 'anp-acid-base');
});

/* offer(): the DOM half, against a document and slot that stand in for one. */
// `up`: the class of whatever is on screen, matched the way querySelector would.
function dom(b, { up = null } = {}){
  b.window.document = { querySelector: sel => (up && sel.split(/\s*,\s*/).includes(up) ? {} : null), body: {} };
  const box = { isConnected: true, querySelector: () => ({ addEventListener(){} }) };
  return { isConnected: true, innerHTML: '', firstChild: box };
}

test('shown once per pair, ever; the next eligible pair is offered after it', () => {
  const b = fresh();
  b.window.LevlCross.note(['nremt:Musculoskeletal & Burns']);
  const slot = dom(b);
  b.window.LevlCross.offer(slot, 'nremt');
  assert.match(slot.innerHTML, /skin-injury\.html/);
  assert.ok(seen(b)['nremt-burns']);
  const again = dom(b);
  b.window.LevlCross.offer(again, 'nremt');
  assert.match(again.innerHTML, /skeleton\.html/);           // the second pair for the same source
  const third = dom(b);
  b.window.LevlCross.offer(third, 'nremt');
  assert.equal(third.innerHTML, '');
});

test('never alongside a save, reminder or install prompt or a milestone celebration, and not counted as shown', () => {
  for (const up of ['.levl-prompt', '.levl-cele']) {
    const b = fresh();
    b.window.LevlCross.note(['nremt:Cardiac']);
    const slot = dom(b, { up });
    b.window.LevlCross.offer(slot, 'nremt');
    assert.equal(slot.innerHTML, '', up);
    assert.equal(seen(b)['nremt-cardiac'], undefined, up);
  }
});

/* The mapping itself. */

test('every pair links to a page that exists', () => {
  const b = fresh();
  for (const m of b.window.LevlCross.MAP) {
    assert.ok(existsSync(m.href.replace(/^\//, '')), m.id + ' -> ' + m.href);
  }
});

test('every "A&P chapter N" names the chapter the page is actually in', () => {
  const b = fresh();
  b.load('anatomy-physiology/assets/anp-curriculum.js');
  const C = b.window.AnpCurriculum;
  const chapterOfPage = href => {
    let m = href.match(/chapters\/([\w-]+)\.html$/);
    if (m) return m[1];
    m = href.match(/lessons\/([\w-]+)\.html$/);
    return m && C.topics.find(t => t.id === m[1]).chapter;
  };
  for (const m of b.window.LevlCross.MAP) {
    const n = (m.text.match(/A&P chapter (\d+)/) || [])[1];
    if (!n) continue;
    const ch = C.chapters.find(c => c.n === +n);
    assert.ok(ch, m.id + ': there is no chapter ' + n);
    // The chapter named is the target's, or for an A&P -> ochem pair, the source's.
    const source = m.from.map(t => t.split(':')[1]).map(id => C.chapters.find(c => c.id === id)?.id || C.topics.find(t => t.id === id)?.chapter);
    const where = m.to === 'anp' ? [chapterOfPage(m.href)] : source;
    assert.ok(where.includes(ch.id), m.id + ': chapter ' + n + ' is ' + ch.id + ', not ' + where.join('/'));
  }
});

test('every source tag names a real topic, chapter or scenario', async () => {
  const b = fresh();
  b.load('anatomy-physiology/assets/anp-curriculum.js');
  b.localStorage.clear();
  b.load('ochem/assets/curriculum.js');
  const { readFileSync } = await import('node:fs');
  const nremtTopics = new Set(JSON.parse(readFileSync('nremt/assets/questions-core.json', 'utf8')).map(q => q.topic));
  const scenarios = new Set([...readFileSync('nremt/scenario-sim.html', 'utf8').matchAll(/\bid: "(s\d+)"/g)].map(m => m[1]));
  const A = b.window.AnpCurriculum, O = b.window.OchemCurriculum;
  for (const m of b.window.LevlCross.MAP) {
    for (const tag of m.from) {
      const [course, id] = [tag.slice(0, tag.indexOf(':')), tag.slice(tag.indexOf(':') + 1)];
      const ok = course === 'nremt' ? nremtTopics.has(id) || scenarios.has(id)
        : course === 'anp' ? A.chapters.some(c => c.id === id) || A.topics.some(t => t.id === id)
        : O.MODULES.some(x => x.id === id) || !!O.findTopic(id);
      assert.ok(ok, m.id + ': ' + tag + ' matches nothing');
    }
  }
});
