/* The study notes, now that they are data rather than markup.

   Forty chapters used to be an inline array in nremt/study-notes.html. Moving
   them into nremt/assets/study-notes.json took 172 KB off the page's first
   paint, and introduced a class of failure the page cannot show you: the notes
   still LOOK fine while something downstream has quietly stopped seeing them.

   Two things read this file, and only one of them is visible.

     * study-notes.html renders it. If that breaks, the page says so.
     * assets/tutor.js indexes it for the study assistant. If that breaks, the
       assistant simply answers worse — no error, no blank page, just the
       largest body of teaching text on the site missing from its index.

   The second is what these tests are for. check-site.mjs guards the file's
   shape; this guards that the assistant's walker can still get prose out of
   that shape, by running the real function over the real file. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DATA = JSON.parse(readFileSync('nremt/assets/study-notes.json', 'utf8'));
const TUTOR = readFileSync('assets/tutor.js', 'utf8');

/* tutor.js is a browser IIFE with no exports, so the walker is lifted out of
   the source by name and run with a stand-in for the one browser API it uses.
   Lifting it rather than reimplementing it is the point: a reimplementation
   would pass while the real one was broken. */
function loadWalker(){
  const grab = (name) => {
    const at = TUTOR.indexOf('function ' + name);
    assert.ok(at >= 0, `assets/tutor.js no longer defines ${name}() — this test is lifting a function that has been renamed or removed, which is itself the regression.`);
    let depth = 0;
    for (let i = TUTOR.indexOf('{', at); i < TUTOR.length; i++) {
      if (TUTOR[i] === '{') depth++;
      else if (TUTOR[i] === '}' && --depth === 0) return TUTOR.slice(at, i + 1);
    }
    throw new Error(`unbalanced braces reading ${name}()`);
  };
  const keys = TUTOR.match(/var KEY_HEADING = [^;]+;\s*var KEY_BODY = [^;]+;/);
  assert.ok(keys, 'assets/tutor.js no longer declares KEY_HEADING/KEY_BODY');

  const body = ['toPlainText', 'tableText', 'norm', 'pushChunk', 'splitSentences', 'extractFromData']
    .map(grab).join('\n\n');

  // The walker calls toPlainText on every string, which uses DOMParser for the
  // HTML-bearing ones. Tags become spaces here; the assertions below are about
  // whether prose is FOUND, not about how tidily it is flattened.
  class DOMParserStub {
    parseFromString(html){
      return {
        body: { textContent: html.replace(/<[^>]*>/g, ' '), querySelectorAll: () => [] },
        createTextNode: () => ({}),
      };
    }
  }
  return new Function('DOMParser', 'MAX_CHARS', 'MIN_CHARS',
    `${keys[0]}\n${body}\nreturn extractFromData;`)(DOMParserStub, 900, 40);
}

const PAGE = { file: '/nremt/study-notes.html', title: 'Study Notes' };
function indexNotes(){
  const chunks = [];
  loadWalker()(DATA, PAGE, chunks, PAGE.title);
  return chunks;
}

test('the assistant can still index the study notes after the split', () => {
  const chunks = indexNotes();
  // 540 passages when the split landed. The floor is deliberately well below
  // that: this is guarding against the walker returning nothing or nearly
  // nothing, not against the notes being edited.
  assert.ok(chunks.length > 300,
    `only ${chunks.length} passages came out of study-notes.json — the assistant has lost most of the notes`);
  assert.ok(chunks.every(c => c.file === PAGE.file),
    'every passage should be attributed to the page a reader can open');
});

test('passages carry the heading they were written under, not the page title', () => {
  const chunks = indexNotes();
  const own = chunks.filter(c => c.heading && c.heading !== PAGE.title);
  assert.ok(own.length > 250,
    `${own.length} of ${chunks.length} passages have a real heading; the walker is not descending into topics`);
});

test('a chapter added to the data file reaches the index', () => {
  // The whole point of the split is that editing JSON is how you add a
  // chapter. If the walker only understood the shape it was written against,
  // that would stop being true without anything failing.
  const chunks = [];
  loadWalker()({
    chapters: [{
      num: 99, title: 'A New Chapter',
      sections: [{ id: 'ch99-x', title: 'A New Section', topics: [
        { heading: 'A distinctive heading', html: '<p>' + 'Prose that is comfortably past the minimum length this walker requires before it will keep a passage at all.' + '</p>' },
      ] }],
    }],
  }, PAGE, chunks, PAGE.title);
  assert.ok(chunks.length >= 1, 'a well-formed chapter produced no passages');
  assert.equal(chunks[0].heading, 'A distinctive heading');
  assert.match(chunks[0].text, /Prose that is comfortably past the minimum/);
});

test('every section the page can route to is reachable and unique', () => {
  const ids = [];
  for (const ch of DATA.chapters) for (const s of ch.sections) ids.push(s.id);
  assert.equal(new Set(ids).size, ids.length, 'two sections share an id, so one is unreachable at its own URL');
  assert.ok(ids.every(id => /^[a-z0-9][a-z0-9-]*$/i.test(id)), 'a section id is not usable as a URL fragment');
});

test('no chapter is empty, and no topic is headingless', () => {
  for (const ch of DATA.chapters) {
    assert.ok(ch.sections.length, `chapter ${ch.num} has no sections`);
    for (const s of ch.sections) {
      assert.ok(s.topics.length, `section ${s.id} has no topics`);
      for (const t of s.topics) {
        assert.ok(t.heading, `a topic in ${s.id} has no heading`);
        assert.ok(t.html || t.paragraphs, `topic "${t.heading}" in ${s.id} has no body`);
      }
    }
  }
});
