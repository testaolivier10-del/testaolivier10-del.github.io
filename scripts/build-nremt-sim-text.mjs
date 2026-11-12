/* What the NREMT scenario simulator says before its script runs
   (docs/site-health.md, "Fuller tool and lesson pages", 2026-11-12).

   nremt/scenario-sim.html was a heading, one line and an empty picker (about
   70 words) until its inline script drew the call cards. This writes the
   calls into #pickerGrid, inside a closed "About this tool" line: each call's
   own title, kind, one-line blurb and the scene the student arrives at. The
   choices and what they lead to are never written out. renderPicker() sets
   grid.innerHTML when it runs, so a student with JavaScript sees no change.

   Only what is between the markers is generated:
     <!-- sim-text:start --> ... <!-- sim-text:end -->

     node scripts/build-nremt-sim-text.mjs            rewrite
     node scripts/build-nremt-sim-text.mjs --check    fail if stale (CI) */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FILE = join(ROOT, 'nremt', 'scenario-sim.html');
const check = process.argv.includes('--check');
const START = '<!-- sim-text:start -->';
const END = '<!-- sim-text:end -->';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const html = readFileSync(FILE, 'utf8');
const a = html.indexOf('const SCENARIOS = [');
const b = html.indexOf('\n];', a);
if (a === -1 || b === -1) throw new Error('scenario-sim.html: no SCENARIOS array');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(html.slice(a, b + 3).replace('const SCENARIOS', 'this.SCENARIOS'), sandbox);
const list = sandbox.SCENARIOS;
if (!Array.isArray(list) || !list.length) throw new Error('scenario-sim.html: SCENARIOS is empty');

const items = list.map((s) => {
  const start = s.nodes && s.nodes[s.startNode];
  const scene = start && start.text ? ` ${esc(start.text)}` : '';
  return `<li><b>${esc(s.title)}</b> (${esc(s.domain)}). ${esc(s.blurb)}${scene}</li>`;
}).join('');
const block = `${START}<details class="tool-about"><summary>About this tool</summary>` +
  `<p>${list.length} EMT calls. Each one starts at the scene below; every choice you make changes what happens next, and the debrief shows what each choice cost.</p>` +
  `<ul>${items}</ul></details>${END}`;

let out;
if (html.includes(START)) out = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => block);
else {
  const grid = '<div class="picker-grid" id="pickerGrid"></div>';
  if (!html.includes(grid)) throw new Error('scenario-sim.html: no empty #pickerGrid');
  out = html.replace(grid, `<div class="picker-grid" id="pickerGrid">${block}</div>`);
}
if (out === html) console.log('OK: scenario-sim.html is up to date');
else if (check) { console.error('stale: nremt/scenario-sim.html. Run: node scripts/build-nremt-sim-text.mjs'); process.exit(1); }
else { writeFileSync(FILE, out); console.log('wrote nremt/scenario-sim.html'); }
