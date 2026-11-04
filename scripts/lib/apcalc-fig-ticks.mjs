/* Tick numbers clear of curves, for the AP® Calculus AB and BC figure
   generators (scripts/apcalc-figures/*, scripts/apcalcbc-figures/*).

     clearTicks(svg) -> svg

   A tick number (a <text> that is only a number, such as "−3", "0.5" or
   "π/2") that a thick curve, line or arrow runs through is moved to the first
   nearby spot that is clear: beside its tick, on the other side of the axis,
   or (for a number on the vertical axis) a little above or below its tick.
   Nothing else changes: the same text, the same size, the same colour. A
   number with no clear spot stays where it was. Text sizes are estimated from
   Arial's average digit width; scripts/check-legibility.mjs confirms the
   result in a browser.

   It reads the flat SVG these generators write: <path d> with absolute or
   relative M, L, H, V, Z (curve commands count by their end points),
   <line>, <polyline>, <circle>; anything inside <defs> or <clipPath> or a
   transformed <g> is left out. */

const NUM = /^[−-]?(?:\d+(?:\.\d+)?|\d*π(?:\/\d+)?)$/;
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? m[1] : null; };
const setAttr = (tag, name, v) => tag.match(new RegExp(`\\s${name}="`)) ? tag.replace(new RegExp(`(\\s${name}=")[^"]*(")`), `$1${v}$2`) : tag.replace(/^<text/, `<text ${name}="${v}"`);
const r2 = v => Math.round(v * 100) / 100;

function pathPoints(d) {
  const runs = []; let run = [], x = 0, y = 0, sx = 0, sy = 0;
  const toks = d.match(/[MLHVZCSQTAmlhvzcsqta]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0, cmd = 'M';
  const num = () => +toks[i++];
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'Z') { run.push([sx, sy]); x = sx; y = sy; continue; }
    if (i >= toks.length) break;
    if (C === 'M') { if (run.length > 1) runs.push(run); const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; sx = x; sy = y; run = [[x, y]]; cmd = rel ? 'l' : 'L'; continue; }
    if (C === 'L' || C === 'T') { const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; }
    else if (C === 'H') { const a = num(); x = rel ? x + a : a; }
    else if (C === 'V') { const b = num(); y = rel ? y + b : b; }
    else if (C === 'C') { i += 4; const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; }
    else if (C === 'S' || C === 'Q') { i += 2; const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; }
    else if (C === 'A') { i += 5; const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; }
    else { i++; continue; }
    run.push([x, y]);
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

function segIn(s, b) {
  let t0 = 0, t1 = 1;
  const dx = s[2] - s[0], dy = s[3] - s[1], p = [-dx, dx, -dy, dy], q = [s[0] - b.l, b.r - s[0], s[1] - b.t, b.b - s[1]];
  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) { if (q[k] < 0) return false; continue; }
    const t = q[k] / p[k];
    if (p[k] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}

export function clearTicks(svg) {
  const segs = [], dots = [], texts = [], clips = {};
  // Clip rectangles by id, so a curve's hidden part is no obstacle.
  for (const c of svg.matchAll(/<clipPath id="([^"]+)"[^>]*>\s*<rect ([^>]*)\/?>/g)) {
    const t = '<rect ' + c[2] + '>', x = +attr(t, 'x') || 0, y = +attr(t, 'y') || 0;
    clips[c[1]] = { l: x, t: y, r: x + +attr(t, 'width'), b: y + +attr(t, 'height') };
  }
  // Walk the tags, skipping defs, clip paths and transformed groups.
  const re = /<(\/?)(defs|clipPath|g|path|line|polyline|circle|text)\b([^>]*?)(\/?)>/g;
  const stack = []; let m, skip = 0;
  while ((m = re.exec(svg))) {
    const [tag, close, name, , self] = m;
    if (name === 'defs' || name === 'clipPath' || name === 'g') {
      if (close) { const s = stack.pop(); if (s && s.hides) skip--; continue; }
      if (self) continue;
      const hides = name !== 'g' || !!attr(tag, 'transform'), up = stack[stack.length - 1] || {};
      stack.push({ hides, stroke: attr(tag, 'stroke') ?? up.stroke, sw: attr(tag, 'stroke-width') ?? up.sw }); if (hides) skip++;
      continue;
    }
    if (close || skip) continue;
    const inh = stack[stack.length - 1] || {};
    if (name === 'text') {
      const end = svg.indexOf('</text>', re.lastIndex);
      const body = svg.slice(re.lastIndex, end);
      texts.push({ start: m.index, tag, body, tagEnd: re.lastIndex });
      continue;
    }
    const stroke = attr(tag, 'stroke') ?? inh.stroke, sw = +(attr(tag, 'stroke-width') ?? inh.sw ?? 1);
    if (name === 'circle') { dots.push([+attr(tag, 'cx'), +attr(tag, 'cy'), +(attr(tag, 'r') || 0) + 1]); continue; }
    if (!stroke || stroke === 'none' || sw < 1.8) continue;
    const cp = (attr(tag, 'clip-path') || '').match(/url\(#([^)]+)\)/), clip = cp ? clips[cp[1]] || null : null;
    const add = pts => { for (let k = 1; k < pts.length; k++) segs.push([pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], clip]); };
    if (name === 'line') add([[+attr(tag, 'x1'), +attr(tag, 'y1')], [+attr(tag, 'x2'), +attr(tag, 'y2')]]);
    else if (name === 'polyline') { const n = (attr(tag, 'points') || '').trim().split(/[\s,]+/).map(Number); const pts = []; for (let k = 0; k + 1 < n.length; k += 2) pts.push([n[k], n[k + 1]]); add(pts); }
    else pathPoints(attr(tag, 'd') || '').forEach(add);
  }
  const W = +(svg.match(/viewBox="[\d.\s-]*?\s([\d.]+)\s([\d.]+)"/) || [])[1] || Infinity;
  const H = +(svg.match(/viewBox="[\d.\s-]*?\s([\d.]+)\s([\d.]+)"/) || [])[2] || Infinity;
  const boxOf = (x, y, s, anchor, size) => {
    const w = [...s].length * size * 0.56, l = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    return { l, r: l + w, t: y - size * 0.74, b: y + size * 0.18 };
  };
  const all = texts.map(t => {
    const bare = t.body.match(/^<tspan\s*>([^<]*)<\/tspan>$/);   // one plain tspan reads as plain text
    if (bare) t.body = bare[1];
    const size = +(attr(t.tag, 'font-size') || 13), plain = t.body.replace(/<[^>]*>/g, '');
    return { ...t, size, plain, x: +attr(t.tag, 'x'), y: +attr(t.tag, 'y'), anchor: attr(t.tag, 'text-anchor') || 'start' };
  }).filter(t => Number.isFinite(t.x) && Number.isFinite(t.y));
  all.forEach(t => { t.box = boxOf(t.x, t.y, t.plain, t.anchor, t.size); });
  const cost = (b, self, strokesOnly) => {
    const g = { l: b.l - 1, r: b.r + 1, t: b.t - 1, b: b.b + 1 };
    let c = 0;
    if (b.l < 0 || b.t < 0 || b.r > W || b.b > H) c += 100;
    for (const s of segs) {
      const k = s[4], h = k ? { l: Math.max(g.l, k.l), r: Math.min(g.r, k.r), t: Math.max(g.t, k.t), b: Math.min(g.b, k.b) } : g;
      if (h.l < h.r && h.t < h.b && segIn(s, h)) c += 10;
    }
    for (const d of dots) if (d[0] + d[2] > b.l && d[0] - d[2] < b.r && d[1] + d[2] > b.t && d[1] - d[2] < b.b) c += 10;
    if (!strokesOnly) for (const o of all) if (o !== self && o.box.l < b.r && o.box.r > b.l && o.box.t < b.b && o.box.b > b.t) c += 20;
    return c;
  };
  const edits = [];
  for (const t of all) {
    if (!NUM.test(t.plain.trim()) || t.body.includes('<')) continue;
    if (cost(t.box, t, true) === 0) continue;   // only a number a stroke runs through moves
    const { x, y, size } = t, cands = [];
    if (t.anchor === 'middle') {
      const up = -Math.round(size * 1.85);
      const down = Math.round(size * 0.7);
      cands.push([x - 3, y, 'end'], [x + 3, y, 'start'], [x, y + up, 'middle'], [x - 3, y + up, 'end'], [x + 3, y + up, 'start'], [x, y + down, 'middle']);
    } else if (t.anchor === 'end') {
      cands.push([x, y - Math.round(size * 0.6), 'end'], [x, y + Math.round(size * 0.6), 'end'], [x + 16, y, 'start'], [x + 16, y - Math.round(size * 0.6), 'start'], [x + 16, y + Math.round(size * 0.6), 'start']);
    } else {
      cands.push([x, y - Math.round(size * 0.6), 'start'], [x, y + Math.round(size * 0.6), 'start'], [x - 16, y, 'end']);
    }
    let best = null;
    for (const [cx, cy, an] of cands) {
      const b = boxOf(cx, cy, t.plain, an, size), c = cost(b, t);
      if (c === 0) { best = { cx, cy, an, b }; break; }
    }
    if (!best) continue;
    t.box = best.b;
    let tag = setAttr(setAttr(t.tag, 'x', r2(best.cx)), 'y', r2(best.cy));
    tag = setAttr(tag, 'text-anchor', best.an);
    edits.push([t.start, t.tag.length, tag]);
  }
  edits.sort((a, b) => b[0] - a[0]);
  for (const [at, len, tag] of edits) svg = svg.slice(0, at) + tag + svg.slice(at + len);
  return svg;
}
