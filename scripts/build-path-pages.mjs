#!/usr/bin/env node
/* <dir>/path.html for every course: since course redesign r4 (docs/course-redesign-r4.md, decision 2) the guided
   study path is the course home, so path.html is only a redirect there, kept so old links and bookmarks still work
   (docs/guided-path.md): a script that keeps any query or hash, a meta refresh, a canonical link to the home and a
   plain link for anyone with neither. The same stub shape as the site's root redirect pages (study-plan.html).

   node scripts/build-path-pages.mjs          write
   node scripts/build-path-pages.mjs --check  fail when a page is stale */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSES } from './lib/courses.mjs';
import { NOINDEX } from './lib/app-pages.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');
const ORIGIN = 'https://levlprep.com';

function build(c) {
  const name = c.name.replace(/&(?![a-z]+;|#\d+;)/g, '&amp;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline'; base-uri 'self'; object-src 'none'; form-action 'self'">
<script>location.replace("${c.path}" + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0; url=${c.path}">
<link rel="canonical" href="${ORIGIN}${c.path}">
${NOINDEX}
<title>Redirecting…</title>
</head>
<body>
<p>Your study path is now the ${name} home page. <a href="${c.path}">Open your path</a></p>
</body>
</html>
`;
}

let stale = 0;
for (const c of COURSES) {
  const out = build(c), file = join(ROOT, c.dir, 'path.html');
  if (CHECK) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== out) { console.error(`stale: ${c.dir}/path.html (run node scripts/build-path-pages.mjs)`); stale++; }
  } else { writeFileSync(file, out); console.log(`${c.dir}/path.html`); }
}
if (stale) process.exit(1);
