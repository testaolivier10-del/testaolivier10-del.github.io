// One page per topic in search: scripts/lib/topic-twin.mjs (docs/site-health.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { notesTwin, withNoindex } from '../lib/topic-twin.mjs';

test('a lesson with a notes page for the same topic names it', () => {
  assert.equal(notesTwin('bio/lessons/carbohydrates.html'), 'bio/notes/carbohydrates.html');
});

test('notes pages, tools and lessons without a notes page are left alone', () => {
  assert.equal(notesTwin('bio/notes/carbohydrates.html'), null);
  assert.equal(notesTwin('bio/tools/water-potential.html'), null);
  assert.equal(notesTwin('bio/lessons/no-such-topic.html'), null);
  assert.equal(notesTwin('index.html'), null);
});

test('withNoindex adds one robots tag and changes nothing else', () => {
  const a = withNoindex('x.html', '<html><head><title>t</title></head><body>b</body></html>');
  assert.equal(a, '<html><head><title>t</title><meta name="robots" content="noindex, follow">\n</head><body>b</body></html>');
  const b = withNoindex('x.html', '<head><meta name="robots" content="index, follow"></head>');
  assert.equal(b, '<head><meta name="robots" content="noindex, follow"></head>');
});

test('sitemap.xml lists no lesson that has a notes page', () => {
  const locs = [...readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/levlprep\.com\/([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 500);
  assert.deepEqual(locs.filter((p) => notesTwin(p)), []);
});
