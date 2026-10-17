// Every AP Statistics browser script must parse. A syntax error (an unescaped
// apostrophe in a string, say) stops a whole page from loading, and no other
// test loads every file (docs/apstat-reviews/exams.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(import.meta.dirname, '..', '..', 'statistics', 'assets');
const files = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.js')) files.push(p);
  }
})(ROOT);

test('every statistics/assets script parses', () => {
  assert.ok(files.length > 20, 'found the scripts');
  for (const f of files) {
    assert.doesNotThrow(() => new vm.Script(readFileSync(f, 'utf8'), { filename: f }), f);
  }
});
