/* Flatten the Worker's four modules into one file that can be pasted into
   Cloudflare's dashboard editor.

   The source is split because the four concerns are genuinely separate — the
   assistant, VAPID signing, the push courier, the email courier — and a single
   600-line file would be worse to read and worse to change. But deploying a
   multi-module Worker needs wrangler, which needs Node and npm on the person's
   machine, and that is a real barrier for somebody who has only ever worked on
   this site through GitHub's website.

   So both are true: the source stays split, and there is one file to paste.

     node scripts/build-worker.mjs            rebuild worker/dist/worker.js
     node scripts/build-worker.mjs --check    fail if it is stale (CI)

   The --check is why this can be trusted. Every other generated thing here has
   one for the same reason: a derived file nobody verifies is a derived file
   that is silently three commits behind the source it claims to mirror, and
   this particular one would be three commits behind in PRODUCTION.
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'worker', 'src');
const OUT = join(ROOT, 'worker', 'dist', 'worker.js');
const check = process.argv.includes('--check');

/* Dependency order, not alphabetical: a function has to be defined before the
   code that calls it runs. store.js depends on nothing, push.js depends on
   nothing, the two couriers depend on both, index.js calls everything.

   Flattening is also what caught the duplication that store.js now holds: two
   identical sb() helpers and two copies of MAX_UNANSWERED collided in one
   scope, which is a fair way to be told that two identical functions are one
   function. */
const ORDER = ['store.js', 'push.js', 'email.js', 'reminders.js', 'index.js'];

/* Strip the module plumbing. Everything ends up in one scope, so an import
   from a sibling has nothing to do and an `export` keyword is just noise —
   except `export default`, which is how a Worker declares its handlers and
   has to survive. */
function flatten(source, file) {
  let out = source;
  // import { a, b } from './sibling.js';   -> gone, they are in scope already
  out = out.replace(/^import\s+\{[^}]*\}\s+from\s+'\.\/[^']+';\s*$/gm, '');
  out = out.replace(/^import\s+\w+\s+from\s+'\.\/[^']+';\s*$/gm, '');
  // export function foo -> function foo;  export const X -> const X
  out = out.replace(/^export\s+(?=(?:async\s+)?function\b|const\b|let\b|class\b)/gm, '');

  const leftover = out.match(/^\s*(import|export)\s+(?!default)/m);
  if (leftover) {
    console.error(`${file}: a module statement survived flattening — "${leftover[0].trim()}"`);
    console.error('The bundle would be broken. Fix scripts/build-worker.mjs rather than the source.');
    process.exit(1);
  }
  return out.trim();
}

const parts = ORDER.map((file) => {
  const body = flatten(readFileSync(join(SRC, file), 'utf8'), file);
  return `/* ===========================================================================\n` +
         `   ${file}\n` +
         `   =========================================================================== */\n\n${body}`;
});

const header = `/* LevlPrep Worker — GENERATED, DO NOT EDIT.
 *
 * Built from worker/src/*.js by scripts/build-worker.mjs. Edit those, then run
 *   node scripts/build-worker.mjs
 * CI fails if this file and the source disagree.
 *
 * This exists so the Worker can be deployed by pasting one file into
 * Cloudflare's dashboard editor, with nothing installed. If you have wrangler,
 * deploy worker/src/ instead and ignore this file — note that the dashboard
 * route cannot create the cron trigger from wrangler.toml, so you have to add
 * it by hand under Settings -> Triggers.
 *
 * Built: ${ORDER.join(', ')}
 */

`;

const wanted = header + parts.join('\n\n') + '\n';

/* Check the bundle actually parses before writing it or comparing it.

   Flattening five files into one scope can produce something no individual
   file could: two modules that each declare `BATCH` are both fine on their own
   and a syntax error together. Without this the first sign of that would have
   been a Worker that refused to deploy — pasted into a dashboard, by somebody
   who had no reason to suspect the file rather than themselves. */
try {
  new (async function () {}).constructor(wanted.replace(/^export default/m, 'return'));
} catch (e) {
  console.error('The flattened Worker does not parse:');
  console.error('  ' + e.message);
  console.error('Most likely two modules declare the same top-level name. Move the');
  console.error('shared one into worker/src/store.js rather than renaming a copy.');
  process.exit(1);
}

if (check) {
  let have = '';
  try { have = readFileSync(OUT, 'utf8'); } catch { /* missing counts as stale */ }
  if (have !== wanted) {
    console.error('worker/dist/worker.js does not match worker/src/.');
    console.error('Run: node scripts/build-worker.mjs');
    process.exit(1);
  }
  console.log(`worker/dist/worker.js is in step with worker/src/ (${ORDER.length} modules).`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, wanted);
  console.log(`worker/dist/worker.js  ${(Buffer.byteLength(wanted) / 1024).toFixed(0)} KB, from ${ORDER.join(' + ')}`);
}
