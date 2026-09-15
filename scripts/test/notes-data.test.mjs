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

/* The generated figures in the notes. Same reasoning as the ochem figure test
   in tool-content.test.mjs — a diagram drawn from coordinates fails by
   rendering perfectly and reading as nonsense — with one constraint the ochem
   figures do not need.

   .notes-figure svg carries `min-width: calc(--vb * 0.92px)`, so a figure
   drawn wider than the reading column does not shrink: it becomes a
   horizontal scroll, and the first attempt at the chain-of-survival figure was
   900 units wide and arrived as a strip you had to drag. For a figure whose
   whole job is to show a shape at a glance that is a worse trade than a
   slightly smaller drawing, so the notes cap the width. */
const NOTES_FIG_MAX_VB = 720;

function notesFigures(){
  const out = [];
  for (const ch of DATA.chapters) {
    for (const sec of ch.sections) {
      for (const t of sec.topics) {
        for (const m of String(t.html || '').matchAll(/<!-- fig:([a-z0-9-]+):start -->([\s\S]*?)<!-- fig:\1:end -->/g)) {
          out.push({ id: m[1], block: m[2], section: sec.id });
        }
      }
    }
  }
  return out;
}

test('every generated notes figure draws inside its own canvas', () => {
  const figs = notesFigures();
  assert.ok(figs.length >= 4, `expected at least 4 generated notes figures, found ${figs.length}`);
  for (const { id, block } of figs) {
    const vb = block.match(/viewBox="([^"]+)"/);
    assert.ok(vb, `${id}: no viewBox`);
    const [mx, my, w, h] = vb[1].split(/\s+/).map(Number);
    assert.ok(w > 0 && h > 0, `${id}: degenerate viewBox`);

    /* Anchor points AND the extent of anything that has one. The ochem
       version of this test reads anchors only, and a panel whose x is inside
       the canvas while x+width is 60 units past the right edge passes it — a
       gap found by shifting a figure right and watching nothing fail. A rect
       and a circle both say how big they are; there is no reason not to ask. */
    const xs = [...block.matchAll(/\s(?:cx|x1|x2|x)="(-?[\d.]+)"/g)].map(v => Number(v[1]));
    const ys = [...block.matchAll(/\s(?:cy|y1|y2|y)="(-?[\d.]+)"/g)].map(v => Number(v[1]));
    for (const r of block.matchAll(/<rect[^>]*\sx="(-?[\d.]+)"[^>]*\sy="(-?[\d.]+)"[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/g)) {
      xs.push(Number(r[1]) + Number(r[3]));
      ys.push(Number(r[2]) + Number(r[4]));
    }
    for (const c of block.matchAll(/<circle[^>]*\scx="(-?[\d.]+)"[^>]*\scy="(-?[\d.]+)"[^>]*\sr="([\d.]+)"/g)) {
      xs.push(Number(c[1]) + Number(c[3]), Number(c[1]) - Number(c[3]));
      ys.push(Number(c[2]) + Number(c[3]), Number(c[2]) - Number(c[3]));
    }
    /* Text, measured as text. A <text> element's x is an anchor, not a left
       edge: the drawing kit defaults text-anchor to `middle`, so a label
       positioned at x=20 to sit against the left margin is in fact centred on
       x=20, with half of it off the canvas. Four labels in these figures were
       exactly that, and the anchor-only bounds above declared all four fine.
       The width estimate is crude — a mean glyph is about 0.56 em in these
       faces — and deliberately generous, because the failure it is looking for
       is half a sentence missing, not two pixels. */
    /* The size that actually renders is the CSS one, not the attribute. Every
       fg- class in theme.css sets font-size, and a CSS declaration beats a
       presentation attribute — so the `size` option the drawing kit offers is
       ineffective for exactly these classes, and estimating from it
       under-measures every label. Found by a label overflowing the canvas that
       this test, reading the attribute, had just called fine. */
    const CSS_SIZE = { 'fg-lbl': 13, 'fg-sm': 10.5, 'fg-tag': 11, 'fg-tag-mut': 11, 'fg-tag-warn': 11, 'fg-tag-good': 11 };
    for (const t of block.matchAll(/<text class="([a-z-]+)"[^>]*\sx="(-?[\d.]+)"[^>]*\stext-anchor="(\w+)"[^>]*\sfont-size="([\d.]+)"[^>]*>([^<]*)</g)) {
      const [, cls, ax, anchor, fs, body] = t;
      const size = CSS_SIZE[cls] ?? Number(fs);
      const wide = body.replace(/&[a-z]+;/g, 'x').length * size * 0.62;
      const left = anchor === 'middle' ? Number(ax) - wide / 2 : anchor === 'end' ? Number(ax) - wide : Number(ax);
      xs.push(left, left + wide);
    }
    assert.ok(xs.length && ys.length, `${id}: nothing drawn`);
    // A few units of slack: a stroke has width and a glyph has descenders.
    assert.ok(Math.min(...xs) >= mx - 6, `${id}: content runs off the left edge`);
    assert.ok(Math.max(...xs) <= mx + w + 6, `${id}: content runs off the right edge`);
    assert.ok(Math.min(...ys) >= my - 6, `${id}: content runs off the top edge`);
    assert.ok(Math.max(...ys) <= my + h + 6, `${id}: content runs off the bottom edge`);

    assert.match(block, /role="img"/, `${id}: figure is not exposed as an image`);
    assert.match(block, /aria-label="[^"]{12,}"/, `${id}: figure has no usable alt text`);
    assert.match(block, /<figcaption>/, `${id}: figure has no caption`);
  }
});

test('no notes figure is wider than the column it has to fit', () => {
  for (const { id, block } of notesFigures()) {
    const w = Number(block.match(/viewBox="([^"]+)"/)[1].split(/\s+/)[2]);
    assert.ok(w <= NOTES_FIG_MAX_VB,
      `${id} is ${w} units wide; above ${NOTES_FIG_MAX_VB} it stops fitting the reading column and becomes a horizontal scroll instead of a picture`);
  }
});

test('a figure sits in the section it was written for', () => {
  const WHERE = {
    'ch21-chain': 'ch21-arrest-pathophys',
    'ch9-airway-path': 'ch9-airway',
    'ch9-fbao-cycle': 'ch9-fbao',
    'ch21-depth': 'ch21-steps',
  };
  const found = Object.fromEntries(notesFigures().map(f => [f.id, f.section]));
  for (const [id, section] of Object.entries(WHERE)) {
    assert.equal(found[id], section, `${id} should be in ${section}, and is in ${found[id] ?? 'no section at all'}`);
  }
});
