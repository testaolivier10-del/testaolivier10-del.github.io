/* Renders the home-screen icons.

   The site is installable — a manifest, a service worker, offline support —
   and its only icon was an SVG. Chrome accepts that; iOS does not. Safari
   looks for an apple-touch-icon PNG and, finding an SVG, gives up and uses a
   screenshot of the page instead. So every student who added this to a home
   screen from an iPhone got a thumbnail of whatever page they happened to be
   on, which looks like a bookmark rather than an app, and looking like an app
   is the whole reason to install it.

   The icon itself stays a single SVG that everything else still uses. These
   are raster copies of it, generated and committed:

     node scripts/build-icons.mjs

   Like the link-preview cards, this needs Playwright's Chromium and is a local
   tool rather than a CI step — the PNGs are committed and only change when
   assets/icon.svg does.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CANDIDATES = [
  'playwright',
  '/opt/node22/lib/node_modules/playwright/index.js',
  '/usr/lib/node_modules/playwright/index.js',
];
let chromium;
for (const id of CANDIDATES) {
  try { ({ chromium } = require(id)); break; } catch { /* try the next */ }
}
if (!chromium) {
  console.error('Playwright is not installed, so the icons cannot be re-rendered.');
  console.error('The committed PNGs are still valid — this only needs to run when');
  console.error('assets/icon.svg changes.');
  process.exit(1);
}

const svg = readFileSync('assets/icon.svg', 'utf8');

/* Two shapes, not one size list.

   A plain icon keeps the rounded square it was drawn with. A maskable one is
   cropped by the platform to whatever shape that platform likes — a circle on
   most Android launchers — and anything outside the safe zone is cut off. The
   arms of this mark reach close to the edge, so a maskable copy is the mark
   scaled down onto a full-bleed background of its own colour, which is what
   the spec's safe zone actually asks for. Using the same file for both is the
   common way to end up with the corners of your logo sliced off. */
const ICONS = [
  { file: 'assets/icon-180.png', size: 180, inset: 0 },    // apple-touch-icon
  { file: 'assets/icon-192.png', size: 192, inset: 0 },
  { file: 'assets/icon-512.png', size: 512, inset: 0 },
  { file: 'assets/icon-maskable-512.png', size: 512, inset: 0.2 },
];

const BACKGROUND = '#16332E'; // the icon's own field, so the bleed is invisible

const browser = await chromium.launch();
const page = await browser.newPage();

for (const { file, size, inset } of ICONS) {
  const scale = 1 - inset * 2;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><meta charset="utf-8">` +
    `<style>
       html,body{margin:0;padding:0;background:${BACKGROUND};}
       .box{width:${size}px;height:${size}px;display:grid;place-items:center;}
       svg{width:${Math.round(size * scale)}px;height:${Math.round(size * scale)}px;display:block;}
     </style>` +
    `<div class="box">${svg}</div>`
  );
  const buf = await page.screenshot({ omitBackground: false });
  writeFileSync(file, buf);
  console.log(`${file}  ${size}x${size}${inset ? '  (maskable)' : ''}`);
}

await browser.close();
