/* Writes the course registry (assets/courses.js) into the browser scripts
   that need it.

     node scripts/build-courses.mjs           apply
     node scripts/build-courses.mjs --check   fail if any copy is stale (CI)

   Most pages load site-chrome.js, premium.js and the rest on their own,
   deferred, and none of them loads assets/courses.js. Rather than add a
   script tag (and an ordering constraint) to every page, each consumer
   carries a generated block:

     // courses:begin COURSE_LIST key,short,path
     var COURSE_LIST = [ ...one object per course, just those fields... ];
     // courses:end

   The marker line names the variable and the fields; this script rewrites
   everything between the markers. Edit assets/courses.js, never the block.
   Courses come in registry order, hidden ones included, with `status` when a
   consumer asks for it, so the consumer decides what a hidden course means
   there. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSES } from './lib/courses.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const check = process.argv.includes('--check');

/* Every file that carries a block. A file listed here with no block fails,
   so a block cannot be deleted by accident and silently go stale. */
export const TARGETS = [
  'assets/site-chrome.js',
  'assets/hub-progress.js',
  'assets/premium.js',
  'assets/site-search-all.js',
  'assets/tutor.js',
  'assets/analytics.js',
  'assets/account.js',
  'assets/progress-backup.js',
  'assets/account-page.js',
  'assets/hub-home.js',
  'index.html',
  'offline.html',
];

const BLOCK = /^([ \t]*)\/\/ courses:begin (\w+) ([\w,]+)[^\n]*\n[\s\S]*?^[ \t]*\/\/ courses:end[^\n]*$/gm;

function lit(v) {
  if (Array.isArray(v)) return '[' + v.map(lit).join(', ') + ']';
  if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  throw new Error(`build-courses: cannot write ${JSON.stringify(v)}`);
}

export function renderBlock(indent, name, fields) {
  for (const f of fields) {
    if (!COURSES.every((c) => Object.prototype.hasOwnProperty.call(c, f))) {
      throw new Error(`build-courses: "${f}" is not a field of every course in assets/courses.js`);
    }
  }
  const rows = COURSES.map((c) => `${indent}  { ${fields.map((f) => `${f}: ${lit(c[f])}`).join(', ')} },`);
  return [
    `${indent}// courses:begin ${name} ${fields.join(',')} (generated from assets/courses.js by scripts/build-courses.mjs; edit there)`,
    `${indent}var ${name} = [`,
    ...rows,
    `${indent}];`,
    `${indent}// courses:end`,
  ].join('\n');
}

export function applyBlocks(src) {
  let n = 0;
  const out = src.replace(BLOCK, (m, indent, name, fields) => { n++; return renderBlock(indent, name, fields.split(',')); });
  return { out, n };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const stale = [];
  let bad = false;
  for (const rel of TARGETS) {
    const file = join(ROOT, rel);
    const src = readFileSync(file, 'utf8');
    let res;
    try { res = applyBlocks(src); } catch (e) { console.error(`${rel}: ${e.message}`); bad = true; continue; }
    if (!res.n) { console.error(`${rel}: no "// courses:begin" block`); bad = true; continue; }
    if (res.out !== src) {
      stale.push(rel);
      if (!check) writeFileSync(file, res.out);
    }
  }
  if (bad) process.exit(1);
  if (check) {
    if (stale.length) {
      console.error(`${stale.length} file(s) out of step with assets/courses.js:`);
      for (const f of stale) console.error('  ' + f);
      console.error('Run: node scripts/build-courses.mjs');
      process.exit(1);
    }
    console.log(`The course lists in ${TARGETS.length} files match assets/courses.js.`);
  } else {
    console.log(`${stale.length} file(s) updated from assets/courses.js.`);
  }
}
