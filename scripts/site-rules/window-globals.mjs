/* One file per window global.

   Guards audit 2026-10 fix 6: assets/site-chrome.js and assets/site-search.js
   both assigned window.LevlSearch (a three-function helper and the search
   engine), so A&P course search found the name taken, never loaded the engine
   and failed every query. Every browser script here is an IIFE that publishes
   itself as window.<Name>; two different files publishing the same capitalised
   name means one silently replaces the other, depending on load order. */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';

export default function windowGlobals({ ROOT, fail, walk }) {
  const owner = new Map();
  for (const file of walk(ROOT, ['.js'])) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel.startsWith('scripts/') || rel.startsWith('worker/') || rel.includes('node_modules/')) continue;
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/^\s*window\.([A-Z][A-Za-z0-9_]*)\s*=(?!=)/gm)) {
      const name = m[1];
      const prev = owner.get(name);
      if (prev && prev !== rel) fail(`window.${name} is assigned in both ${prev} and ${rel}; give one of them its own name`);
      else owner.set(name, rel);
    }
  }
}
