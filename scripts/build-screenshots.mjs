/* Captures the homepage previews: what the two flagship tools actually look
   like, in both themes.

   The reviewer's point was that the front page describes the tools and never
   shows them. Phase 7c measured what showing them would cost rather than
   guessing, and recorded four faults with the idea. Three of them are answered
   here; the fourth is answered by check 29.

     1. DARK MODE DOUBLES IT. The site has a real dark theme, and a light-theme
        screenshot on a dark page looks broken. So each tool is captured twice
        and served behind <picture> + prefers-color-scheme.
     2. NO COMPRESSION TOOLING. There is no PIL, no ImageMagick and no cwebp
        here, so these are PNGs. They are kept small by cropping tightly and
        capturing at 1x rather than 2x — the crop is the compression.
     3. check-weight.mjs DELIBERATELY EXCLUDES IMAGES, so this weight would
        land exactly where the checker cannot see it. The four files are listed
        in DATA_BUDGETS instead, which measures a file rather than a page.
     4. A SCREENSHOT IS A SECOND COPY OF THE UI WITH NOTHING CHECKING IT —
        build-og-images.mjs exists because a hand-made card advertised "978
        practice questions" against a bank of 2,084. A picture cannot be
        diffed against what it depicts, so instead each capture records a hash
        of the SOURCES it was taken from, and --check fails when a source has
        moved on. That does not prove the picture is right; it proves nobody
        changed the tool and left the picture behind, which is the failure that
        actually happened.

   WHY NOT PLAYWRIGHT. build-og-images.mjs drives Playwright. The Playwright in
   this environment is a version the bundled Chromium does not match, so this
   drives that Chromium through its own command line instead, which works. Both
   are local tools: the PNGs are committed and CI only verifies the hashes.

     node scripts/build-screenshots.mjs           capture
     node scripts/build-screenshots.mjs --check   fail if a source has changed
*/
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { extname } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const OUT_DIR = join(ROOT, 'assets', 'shots');
const MANIFEST = join(OUT_DIR, 'sources.json');

/* Each shot names the page it captures, the region of it worth showing, and
   every file whose content the picture depends on. The `sources` list is what
   --check hashes: if the tool changes, the picture is stale by definition. */
const SHOTS = [
  {
    id: 'arrow-pusher',
    page: '/ochem/tools/arrow-pusher.html',
    viewport: { w: 1180, h: 1240 },
    scale: 0.46,
    alt: 'The arrow-pushing tool: a molecule drawn on a canvas, with a panel showing what the electrons produce',
    sources: ['ochem/tools/arrow-pusher.html', 'ochem/assets/tools/arrow-pusher.js', 'ochem/assets/ochem.css', 'assets/theme.css'],
  },
  {
    id: 'body-map',
    page: '/nremt/body-map.html',
    viewport: { w: 1180, h: 1240 },
    scale: 0.46,
    alt: 'The 3D body map: a rotatable anatomical model with the skeleton and organs visible, and a system filter above it',
    // A real WebGL scene. Headless Chromium has no GPU, so without a software
    // renderer this captures the "Loading 3D model\u2026" spinner, which is worse
    // than shipping no picture at all.
    webgl: true,
    sources: ['nremt/body-map.html', 'assets/theme.css'],
  },
];
const THEMES = ['light', 'dark'];

const CHROME = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p));

function hashSources(shot) {
  const h = createHash('sha256');
  for (const rel of shot.sources) {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) return `missing:${rel}`;
    h.update(rel).update('\0').update(readFileSync(abs));
  }
  return h.digest('hex').slice(0, 16);
}

const wanted = Object.fromEntries(SHOTS.map((s) => [s.id, hashSources(s)]));

if (check) {
  if (!existsSync(MANIFEST)) {
    console.error('FAIL: assets/shots/sources.json is missing — the homepage previews have never been captured.');
    process.exit(1);
  }
  const have = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const stale = [];
  for (const shot of SHOTS) {
    for (const theme of THEMES) {
      const file = join(OUT_DIR, `${shot.id}-${theme}.png`);
      if (!existsSync(file)) { stale.push(`${shot.id}-${theme}.png is missing`); continue; }
      if (statSync(file).size < 2000) stale.push(`${shot.id}-${theme}.png is suspiciously small (${statSync(file).size} bytes) — a blank capture`);
    }
    if (have.shots?.[shot.id] !== wanted[shot.id]) {
      stale.push(`${shot.id}: ${shot.sources.join(', ')} changed since the picture was taken`);
    }
  }
  if (stale.length) {
    console.error('FAIL: the homepage previews are out of date:');
    for (const s of stale) console.error(`  ${s}`);
    console.error('Run: node scripts/build-screenshots.mjs');
    process.exit(1);
  }
  console.log(`OK — all ${SHOTS.length * THEMES.length} homepage previews match their sources.`);
  process.exit(0);
}

if (!CHROME) {
  console.error('No Chromium found, so the previews cannot be re-captured.');
  console.error('The committed PNGs are still valid; this only needs to run when a tool changes.');
  process.exit(1);
}

/* A static server, because a file:// page cannot use localStorage and the
   theme is stored there. Nothing fancy: this serves the repo for a few
   seconds and exits. */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  const abs = join(ROOT, path.endsWith('/') ? path + 'index.html' : path);
  if (!abs.startsWith(ROOT) || !existsSync(abs) || statSync(abs).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(abs)] || 'application/octet-stream' });
  res.end(readFileSync(abs));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

mkdirSync(OUT_DIR, { recursive: true });

/* A seed page rather than an offset iframe.

   The first version framed each tool by loading it in an iframe pulled up by a
   crop offset, which is how Phase 7c measured this. It works for ordinary
   pages and fails for the body map: the 3D viewer sizes its canvas from the
   layout it finds, and inside an iframe whose own window is 459px tall it drew
   a model a third the height it draws on the page, leaving a band of empty
   card in every capture. Chasing that is chasing the viewer's sizing logic,
   not taking a photograph.

   So the capture navigates to the page itself, at a viewport chosen to frame
   the tool, and shrinks the whole thing. The seed page exists only to write
   the theme into localStorage first \u2014 same origin, so it carries \u2014 and then
   get out of the way. What ships is the tool as a reader sees it, header and
   all, which is the more honest picture anyway.

   The scale is the compression: there is no cwebp here, and a 0.46 capture is
   about the size these render at on the homepage. */
function seedPage(shot, theme) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><script>
  try{localStorage.setItem('nremt_theme',${JSON.stringify(theme)});}catch(e){}
  location.replace(${JSON.stringify(shot.page)});
  <\/script></head><body></body></html>`;
}

function capture(args) {
  return new Promise((resolve) => {
    const child = spawn(CHROME, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    const kill = setTimeout(() => child.kill('SIGKILL'), 120000);
    child.on('close', (code) => { clearTimeout(kill); resolve({ code, err }); });
  });
}

let wrote = 0;
for (const shot of SHOTS) {
  for (const theme of THEMES) {
    const tmp = join(ROOT, `__shot-${shot.id}-${theme}.html`);
    writeFileSync(tmp, seedPage(shot, theme));
    const out = join(OUT_DIR, `${shot.id}-${theme}.png`);
    const res = await capture([
      '--headless', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${shot.viewport.w},${shot.viewport.h}`,
      `--force-device-scale-factor=${shot.scale}`,
      `--virtual-time-budget=${shot.webgl ? 14000 : 6000}`,
      ...(shot.webgl
        // ANGLE over SwiftShader: a software GL implementation, so the 3D
        // model actually renders. Slow, and only needed for the one shot.
        ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
        : ['--disable-gpu']),
      `--screenshot=${out}`,
      `http://127.0.0.1:${PORT}/__shot-${shot.id}-${theme}.html`,
    ]);
    rmSync(tmp, { force: true });
    if (!existsSync(out)) {
      console.error(`FAIL: ${shot.id} (${theme}) produced no file.`);
      console.error(res.err.split('\n').filter((l) => !/dbus|ssl_client_socket|handshake/.test(l)).slice(-6).join('\n'));
      process.exit(1);
    }
    const kb = statSync(out).size / 1024;
    console.log(`  assets/shots/${shot.id}-${theme}.png  ${kb.toFixed(0)} KB`);
    wrote++;
  }
}

writeFileSync(MANIFEST, JSON.stringify({
  note: 'A hash of the files each picture was taken from. build-screenshots.mjs --check fails when one moves on, which is the only way a screenshot can be known to be stale.',
  shots: wanted,
}, null, 2) + '\n');

server.close();
console.log(`Captured ${wrote} previews into assets/shots/.`);
