/* Posed patients for the NREMT scenario simulator, rendered from the same
   BodyParts3D skin as the standing and lying figures (scripts/body-figures/pose.js
   has the method), so a change of posture keeps the same patient.

     nremt/assets/body-figs/pose-<case>-<pose>.webp   the shaded posed figure
     nremt/assets/body-figs/pose.js                   their data (size, outline,
                                                      landmarks, anchors)

   Loaded on demand (LevlBodyFigs.load('pose')) by the scenario simulator only,
   when a case's words put the patient on her side or seated.

   The clothes and hair colours are the scenario simulator's (CLOTH and HAIR in
   nremt/assets/scenario-explore.js); change them in both places.

   License: derived from BodyParts3D, (c) 2008 Life Science Integrated Database
   Center, CC BY-SA 2.1 Japan, like every body figure.

     node scripts/build-pose-figures.mjs              write
     node scripts/build-pose-figures.mjs --preview <dir>   also write PNG previews with the landmarks */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'nremt/assets/body-figs');
const args = process.argv.slice(2);
const previewDir = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;

// the cases whose words pose the patient (colours: scenario-explore.js CLOTH, HAIR, SHOES)
const C = { maternity2: ['#A07CC0', '#BD9CD8'], maternity3: ['#3E8E8A', '#5FB0AA'], slacks: ['#3E4450', '#5C6472'], pjs: ['#F2B8C8', '#FAD6E0'],
  hoodie: ['#56606B', '#76818D'], jeans: ['#3C5A80', '#5878A4'], tee3: ['#7E62B5', '#A086D2'], leggings: ['#2F3542', '#4A5264'], pjs2: ['#8DB7E0', '#B2D3F2'],
  blouse: ['#C26D82', '#DD90A4'], sweater: ['#9AA6B3', '#B8C3CE'] };
const LIST = [
  { name: 's16-side', kind: 'female', pose: 'side', preg: true, top: C.maternity2, bot: C.slacks, longSleeve: true, hair: '#8C4A2C', long: true, shoe: '#D5D9E0' },
  { name: 's17-side', kind: 'female', pose: 'side', preg: true, top: C.maternity3, bot: C.slacks, longSleeve: true, hair: '#1E1A19', long: true, shoe: '#CBD0D8' },
  { name: 's9-side', kind: 'toddler', pose: 'side', top: C.pjs, bot: C.pjs, longSleeve: true, hair: '#A7774A', long: true, shoe: '#F2B8C8' },
  { name: 's8-side', kind: 'adult', pose: 'side', top: C.hoodie, bot: C.jeans, longSleeve: true, hair: '#1F1B1A', shoe: '#2B2B2B' },
  { name: 's11-sit', kind: 'child', pose: 'tripod', top: C.tee3, bot: C.leggings, hair: '#2B1F1A', long: true, shoe: '#EEEEF0' },
  { name: 's10-sit', kind: 'toddler', pose: 'sit', top: C.pjs2, bot: C.pjs2, longSleeve: true, hair: '#5A3E2B', shoe: '#8DB7E0' },
  { name: 's2-sit', kind: 'female', pose: 'sit', top: C.blouse, bot: C.slacks, longSleeve: true, hair: '#8D8378', shoe: '#5A4636' },
  { name: 's20-sit', kind: 'female', pose: 'sit', top: C.sweater, bot: C.leggings, longSleeve: true, hair: '#5B4232', long: true, shoe: '#D9D4E0' }
].filter(x => !only || only.includes(x.name));

const { chromium } = await import('playwright');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary' };
await page.route('http://fig.local/**', r => {
  const p = decodeURIComponent(new URL(r.request().url()).pathname);
  if (p === '/index.html') return r.fulfill({ contentType: 'text/html', body:
    '<!doctype html><script type="importmap">{"imports":{"three":"/assets/body3d/vendor/three/build/three.module.min.js"}}</script>' +
    '<script type="module" src="/scripts/body-figures/pose.js"></script>' });
  const f = join(ROOT, p);
  if (!f.startsWith(ROOT) || !existsSync(f)) return r.fulfill({ status: 404, body: '' });
  return r.fulfill({ body: readFileSync(f), contentType: TYPES[extname(f)] || 'application/octet-stream' });
});
await page.goto('http://fig.local/index.html');
await page.waitForFunction(() => typeof window.renderPoses === 'function', null, { timeout: 30000 }).catch(() => {});
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const figs = await page.evaluate(l => window.renderPoses(l), LIST);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
if (args.includes('--joints')) console.log(JSON.stringify(figs._joints));

const data = { version: 1, credit: 'BodyParts3D, (c) 2008 Life Science Integrated Database Center, CC BY-SA 2.1 Japan', figs: {} };
const dataFile = join(OUT_DIR, 'pose.js');
if (only && existsSync(dataFile)) { const old = readFileSync(dataFile, 'utf8').match(/LevlBodyFigs\.add\((.*)\);/s); if (old) data.figs = JSON.parse(old[1]).figs; }
mkdirSync(OUT_DIR, { recursive: true });
const sizes = [];
for (const [name, f] of Object.entries(figs)) {
  if (name.startsWith('_')) continue;
  const img = Buffer.from(f.webp.split(',')[1], 'base64');
  writeFileSync(join(OUT_DIR, 'pose-' + name + '.webp'), img);
  sizes.push(name + ' ' + (img.length / 1024).toFixed(1) + ' KB');
  const { webp, ...rest } = f;
  data.figs[name] = { src: 'body-figs/pose-' + name + '.webp', ...rest };
}
const HEAD = '/* Generated by scripts/build-pose-figures.mjs from assets/body3d/body3d.glb. Do not edit.\n' +
  '   Figures derived from BodyParts3D, (c) 2008 Life Science Integrated Database Center, licensed CC BY-SA 2.1 Japan\n' +
  '   (https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en); the images in body-figs/ carry the same license.\n' +
  '   Coordinates are in each image\'s own pixels. */\n';
const js = HEAD + 'LevlBodyFigs.add(' + JSON.stringify(data) + ');\n';
writeFileSync(dataFile, js);
console.log('wrote', sizes.join(', '), '; data', (js.length / 1024).toFixed(1), 'KB');

if (previewDir) {
  mkdirSync(previewDir, { recursive: true });
  for (const [name, f] of Object.entries(figs)) {
    if (name.startsWith('_')) continue;
    const lms = Object.entries(f.landmarks).map(([k, v]) => `<circle cx="${v[0]}" cy="${v[1]}" r="5" fill="#06c"/><text x="${v[0] + 7}" y="${v[1] + 4}" font-size="12">${k}</text>`).join('');
    await page.setContent(`<body style="margin:0;background:#cfc6bb"><svg width="${f.w}" height="${f.h}"><image href="${f.webp}" width="${f.w}" height="${f.h}"/>${lms}</svg></body>`);
    await page.setViewportSize({ width: f.w, height: f.h });
    await page.screenshot({ path: join(previewDir, name + '.png') });
  }
}
await browser.close();
