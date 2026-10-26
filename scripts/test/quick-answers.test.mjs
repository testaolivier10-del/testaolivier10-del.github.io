/* Quick answer boxes (scripts/lib/quick-answers.mjs) and the homepage
   "From our videos" list (scripts/build-from-video.mjs). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, QA_START, QA_END, applyQuickAnswer, validateQuickAnswers, loadQuickAnswers } from '../lib/quick-answers.mjs';
import { applyVideo, loadVideos, START as V_START } from '../lib/videos.mjs';
import { validate as validateFromVideo, render as renderFromVideo } from '../build-from-video.mjs';

const one = (rel, q = 'What is it?', a = 'It is this.') => ({ byPage: new Map([[rel, { q, a }]]) });
const none = { byPage: new Map() };

test('the data file is sound', () => {
  assert.deepEqual(validateQuickAnswers(loadQuickAnswers().data), []);
});

test('the box goes right under the notes header, once, and comes off cleanly', () => {
  for (const rel of ['ochem/notes/sn2.html', 'nremt/notes/airway-management.html', 'bio/notes/water-hydrogen-bonding.html']) {
    const html = applyQuickAnswer(rel, readFileSync(join(ROOT, rel), 'utf8'), none);
    const out = applyQuickAnswer(rel, html, one(rel));
    assert.equal(out.split(QA_START).length, 2, `${rel}: one box`);
    assert.match(out, /<\/header>\n<!-- quick-answer:start -->/, `${rel}: directly after the header`);
    assert.equal(applyQuickAnswer(rel, out, one(rel)), out, `${rel}: placing it again changes nothing`);
    assert.equal(applyQuickAnswer(rel, out, none), html, `${rel}: removing it restores the page`);
  }
});

test('with a video on the page, the quick answer comes first and the pair is stable', () => {
  const rel = 'bio/notes/water-hydrogen-bonding.html';
  const videos = loadVideos();
  assert.ok(videos.byPage.get(rel), 'this page has a video');
  const html = readFileSync(join(ROOT, rel), 'utf8');
  const out = applyVideo(rel, html, videos);
  if (loadQuickAnswers().byPage.get(rel)) {
    assert.ok(out.indexOf(QA_END) < out.indexOf(V_START), 'quick answer above the video');
  }
  assert.equal(applyVideo(rel, out, videos), out);
});

test('text is escaped and dashes as punctuation are refused', () => {
  const rel = 'ochem/notes/sn2.html';
  const html = readFileSync(join(ROOT, rel), 'utf8');
  const out = applyQuickAnswer(rel, html, one(rel, 'Why <b>?', 'A & B.'));
  assert.match(out, /Why &lt;b&gt;\?/);
  assert.match(out, /A &amp; B\./);
  const bad = validateQuickAnswers({ pages: { [rel]: { q: 'What is it?', a: 'It is this — really.' } } });
  assert.equal(bad.length, 1);
  assert.equal(validateQuickAnswers({ pages: { 'ochem/lessons/sn2.html': { q: 'What?', a: 'This.' } } }).length, 1, 'notes pages only');
});

test('the homepage video topics are sound and match the page', () => {
  const data = JSON.parse(readFileSync(join(ROOT, 'docs/from-video.json'), 'utf8'));
  assert.deepEqual(validateFromVideo(data), []);
  assert.ok(readFileSync(join(ROOT, 'index.html'), 'utf8').includes(renderFromVideo(data)), 'run node scripts/build-from-video.mjs');
  const bad = validateFromVideo({ videos: [{ date: '2026-10-20', course: 'nremt', topic: 'A', hook: 'B', page: 'nremt/notes/nope.html' }] });
  assert.equal(bad.length, 1);
});
