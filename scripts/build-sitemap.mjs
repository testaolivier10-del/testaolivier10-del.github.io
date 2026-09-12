#!/usr/bin/env node
// Regenerates sitemap.xml from what is actually on disk.
//
// It used to be maintained by hand, and drifted: fifty Organic Chemistry lesson
// pages and the NREMT dashboard shipped with no path in from a search engine at
// all. scripts/check-site.mjs fails the build when a page is missing from the
// sitemap, and this is the thing that fixes it — run it after adding a page.
//
// Priorities are assigned by depth and section rather than listed per URL, so a
// new page gets a sensible one without anybody remembering to pick.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ORIGIN = 'https://testaolivier10-del.github.io';

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    if (name === '.git' || name === 'node_modules' || name === 'scripts' || name === '.github' || name === '.claude') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function priorityFor(path) {
  if (path === '/') return '1.0';
  if (/^\/(nremt|ochem)\/$/.test(path)) return '0.9';
  // Placeholder and utility pages rank below real content.
  if (/\/(practice|review|mastery)\.html$/.test(path) && path.startsWith('/ochem/')) return '0.6';
  if (path.startsWith('/ochem/tools/')) return '0.6';
  return path.split('/').length > 3 ? '0.7' : '0.8';
}

const today = new Date().toISOString().slice(0, 10);
const urls = [];
for (const file of walk(ROOT)) {
  const body = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file).split(sep).join('/');
  // Redirect stubs are not pages, and neither is Google's verification file.
  if (/http-equiv="refresh"/.test(body)) continue;
  if (/^google[0-9a-f]+\.html$/.test(rel)) continue;
  // ochem/notes/ holds the textbook's section fragments — bodyless HTML the
  // textbook fetches into learn.html. They are content, not pages: no <head>,
  // no title, and nothing to land on.
  if (rel.startsWith('ochem/notes/')) continue;
  const path = '/' + rel.replace(/index\.html$/, '');
  urls.push({ path, priority: priorityFor(path) });
}

urls.sort((a, b) => (b.priority.localeCompare(a.priority)) || a.path.localeCompare(b.path));

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u =>
    '  <url>\n' +
    `    <loc>${ORIGIN}${u.path}</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <priority>${u.priority}</priority>\n` +
    '  </url>\n').join('') +
  '</urlset>\n';

writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URLs written.`);
