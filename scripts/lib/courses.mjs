/* The course registry (assets/courses.js) for Node: build scripts, checks and
   tests read the list from here instead of typing the courses again.

     import { COURSES, byKey, PAID } from './lib/courses.mjs';

   assets/courses.js is a browser IIFE, so it is run in a VM context with a
   bare `window`, the same way scripts/test/harness.mjs loads browser code. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const REGISTRY_FILE = 'assets/courses.js';

export function loadRegistry(src = readFileSync(join(ROOT, REGISTRY_FILE), 'utf8')) {
  const window = {};
  vm.runInNewContext(src, { window }, { filename: REGISTRY_FILE });
  if (!window.LevlCourses) throw new Error(`${REGISTRY_FILE} did not publish window.LevlCourses`);
  // Out of the VM's realm, so deepEqual and JSON behave as for local objects.
  return JSON.parse(JSON.stringify(window.LevlCourses.list));
}

export const COURSES = loadRegistry();
export const KEYS = COURSES.map((c) => c.key);
export const PAID = COURSES.filter((c) => c.paid);
export const PAID_KEYS = PAID.map((c) => c.key);
export const LISTED = COURSES.filter((c) => c.status !== 'hidden');
export const DEFAULT_KEY = KEYS[0];
export function byKey(key) { return COURSES.find((c) => c.key === key) || null; }
