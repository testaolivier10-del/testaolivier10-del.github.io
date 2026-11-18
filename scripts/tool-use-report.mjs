#!/usr/bin/env node
/* How much each tool is really used (docs/analytics-plan.md, "Tool use"). Reads the tool-open, tool-touch,
   tool-mode and tool-use events from Umami Cloud and prints one line per tool, most touched first:

     tool                     frame  opens  touched  touch%  left: <10s  10-60s  1-5m  5m+  modes

   opens and touched are counts of visits (tool-open, tool-touch); the time columns are the tool-use summaries
   (one per visit, sent when the page is first hidden: fewer than opens, since a browser killed outright sends
   none). A rebuilt tool shows as two lines, frame old and frame v2: that is the before and after.

   Usage:
     UMAMI_API_KEY=... node scripts/tool-use-report.mjs [--days 30] [--from 2026-11-18 --to 2026-12-18]
                                                        [--course apenv] [--json]
   The key is the owner's (Umami Cloud, Settings, API keys); it is read from the environment and never printed.
   Without a key the same numbers are in the Umami dashboard: Events, pick tool-use, property "row".
   The API calls follow Umami's event data reference (event-data/values: startAt, endAt, eventName,
   propertyName); they could not be run against the live account from a build session (no key there). */
import { pathToFileURL } from 'node:url';

export const WEBSITE_ID = 'cc421df1-3f32-40f1-bd08-d7f6666de3ac'; // as assets/analytics.js
const API = process.env.UMAMI_API_URL || 'https://api.umami.is/v1';
export const BANDS = ['<10s', '10-60s', '1-5m', '5m+'];

/* Rows of { value, total } per event into one record per tool and frame.
   opens, touches: by "tool"; uses: by "row" ("tool frame touched time"); modes: by "row" ("tool mode"). */
export function tally({ opens = [], touches = [], uses = [], modes = [] }) {
  const tools = new Map();
  const get = (tool) => {
    if (!tools.has(tool)) tools.set(tool, { tool, opens: 0, touched: 0, frames: new Map(), modes: {} });
    return tools.get(tool);
  };
  const n = (r) => Number(r.total) || 0;
  for (const r of opens) get(String(r.value)).opens += n(r);
  for (const r of touches) get(String(r.value)).touched += n(r);
  for (const r of uses) {
    const [tool, frame, touched, time] = String(r.value).split(' ');
    if (!tool || !BANDS.includes(time)) continue;
    const t = get(tool);
    if (!t.frames.has(frame)) t.frames.set(frame, { left: 0, touched: 0, time: Object.fromEntries(BANDS.map((b) => [b, 0])) });
    const f = t.frames.get(frame);
    f.left += n(r); f.time[time] += n(r);
    if (touched === 'yes') f.touched += n(r);
  }
  for (const r of modes) {
    const [tool, mode] = String(r.value).split(' ');
    if (tool && mode) get(tool).modes[mode] = (get(tool).modes[mode] || 0) + n(r);
  }
  return [...tools.values()]
    .map((t) => ({ ...t, frames: Object.fromEntries(t.frames) }))
    .sort((a, b) => b.touched - a.touched || b.opens - a.opens || a.tool.localeCompare(b.tool));
}

const pct = (a, b) => (b ? Math.round(100 * a / b) + '%' : '-');

export function table(rows) {
  const lines = [['tool', 'frame', 'opens', 'touched', 'touch%', ...BANDS, 'modes'].join('\t')];
  for (const t of rows) {
    const frames = Object.keys(t.frames);
    const modes = Object.entries(t.modes).sort((a, b) => b[1] - a[1]).map(([m, c]) => `${m} ${c}`).join(', ');
    // Opens and touches are per tool; with both frames in the period the split is in the summaries.
    if (frames.length <= 1) {
      const f = t.frames[frames[0]] || { time: {} };
      lines.push([t.tool, frames[0] || '?', t.opens, t.touched, pct(t.touched, t.opens), ...BANDS.map((b) => f.time[b] || 0), modes].join('\t'));
    } else {
      lines.push([t.tool, 'both', t.opens, t.touched, pct(t.touched, t.opens), ...BANDS.map(() => ''), modes].join('\t'));
      for (const fr of frames) {
        const f = t.frames[fr];
        lines.push(['  of the summaries', fr, f.left, f.touched, pct(f.touched, f.left), ...BANDS.map((b) => f.time[b]), ''].join('\t'));
      }
    }
  }
  return lines.join('\n');
}

async function values(key, eventName, propertyName, startAt, endAt) {
  const url = `${API}/websites/${WEBSITE_ID}/event-data/values?startAt=${startAt}&endAt=${endAt}&eventName=${encodeURIComponent(eventName)}&propertyName=${encodeURIComponent(propertyName)}`;
  const res = await fetch(url, { headers: { 'x-umami-api-key': key, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Umami answered ${res.status} for ${eventName}.${propertyName}`);
  const body = await res.json();
  return Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
}

async function main() {
  const arg = (name) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : null; };
  const key = process.env.UMAMI_API_KEY;
  if (!key) {
    console.error('Set UMAMI_API_KEY (Umami Cloud, Settings, API keys). Without one: Umami dashboard, Events, tool-use, property "row".');
    process.exit(2);
  }
  const endAt = arg('to') ? Date.parse(arg('to') + 'T23:59:59Z') : Date.now();
  const startAt = arg('from') ? Date.parse(arg('from') + 'T00:00:00Z') : endAt - (Number(arg('days')) || 30) * 86400000;
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) { console.error('Dates are YYYY-MM-DD.'); process.exit(2); }
  const [opens, touches, uses, modes] = await Promise.all([
    values(key, 'tool-open', 'tool', startAt, endAt), values(key, 'tool-touch', 'tool', startAt, endAt),
    values(key, 'tool-use', 'row', startAt, endAt), values(key, 'tool-mode', 'row', startAt, endAt),
  ]);
  let rows = tally({ opens, touches, uses, modes });
  if (arg('course')) rows = rows.filter((t) => t.tool.startsWith(arg('course') + '/'));
  if (process.argv.includes('--json')) { console.log(JSON.stringify(rows, null, 1)); return; }
  console.log(`${new Date(startAt).toISOString().slice(0, 10)} to ${new Date(endAt).toISOString().slice(0, 10)}: ${rows.length} tools with any use\n`);
  console.log(table(rows));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main().catch((e) => { console.error(e.message); process.exit(1); });
