// IndexNow submissions after a deploy: scripts/indexnow.mjs (docs/site-health.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { changedUrls, KEY, HOST } from '../indexnow.mjs';

const xml = `<url><loc>https://levlprep.com/a</loc>
<lastmod>2026-11-11</lastmod></url><url><loc>https://levlprep.com/b</loc><lastmod>2026-10-01</lastmod></url>`;

test('only pages whose text changed in the last two days are sent', () => {
  assert.deepEqual(changedUrls(xml, { now: new Date('2026-11-12T08:00:00Z') }), ['https://levlprep.com/a']);
  assert.deepEqual(changedUrls(xml, { now: new Date('2026-12-01T08:00:00Z') }), []);
});

test('--all sends every listed page', () => {
  assert.equal(changedUrls(xml, { all: true }).length, 2);
});

test('the key file at the site root holds the key', () => {
  assert.match(KEY, /^[0-9a-f]{32}$/);
  assert.equal(readFileSync(`${KEY}.txt`, 'utf8').trim(), KEY);
  assert.equal(HOST, 'levlprep.com');
});
