/* The course registry (assets/courses.js) for Node: build scripts, checks and
   tests read the list from here instead of typing the courses again.

     import { COURSES, byKey, PAID } from './lib/courses.mjs';

   assets/courses.js is a browser IIFE, so it is run in a VM context with a
   bare `window`, the same way scripts/test/harness.mjs loads browser code. */
import { readFileSync, existsSync } from 'node:fs';
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

/* A course that ships chapter by chapter keeps the list in
   <dir>/data/published.json (AP® Biology, docs/apbio-spec.md decision 10).
   Until it lists a chapter there is nothing to sell, search or index, so the
   build scripts leave the course off the hub, premium.html, the 404 page,
   the sitemap and the structured data; the course works at its own path and
   its registry entry is in place. `<KEY>_PUBLISHED=unit-1,unit-2` in the
   environment overrides the file, as scripts/build-apbio.mjs does
   (APBIO_PUBLISHED). Returns null for a course without such a file. */
export function publishedChapters(c, env = process.env) {
  const override = env[`${c.key.toUpperCase()}_PUBLISHED`];
  if (override !== undefined) return override.split(',').filter(Boolean);
  const file = join(ROOT, c.dir, 'data', 'published.json');
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, 'utf8'));
  return Array.isArray(data.chapters) ? data.chapters : [];
}

/* Listed (not hidden) and, for a course published chapter by chapter, with
   at least one chapter out. */
export function isOpen(c, env = process.env) {
  if (c.status === 'hidden') return false;
  const pub = publishedChapters(c, env);
  return pub === null || pub.length > 0;
}
export const OPEN = LISTED.filter((c) => isOpen(c));
