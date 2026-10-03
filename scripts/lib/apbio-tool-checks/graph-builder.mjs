/* Validator for bio/data/tools/graph-builder.json. Every data set: its
   columns, the independent and dependent variable, the right graph type
   with a reason for every type, a justification consistent with the type,
   error bars that match the rows, and a reference scale that passes the same
   checks the page applies to the student (ApBioMath.graph.checkScale), so a
   full-credit graph exists. */
import { runtime, base, topicOk } from './_shared.mjs';

const TYPE_REASON = { line: 0, bar: 1, scatter: 2 };
export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, 'graph-builder', map, errs, 'graph');
  const types = (data.types || []).map(t => t.id);
  if (types.join() !== 'line,bar,scatter') errs.push('types must be line, bar, scatter');
  if ((data.justifications || []).length !== 4) errs.push('four shared justifications');
  const ids = new Set();
  if ((data.datasets || []).length < 4) errs.push('at least four data sets');
  for (const d of data.datasets || []) {
    const w = `data set ${d.id}`;
    if (!d.id || ids.has(d.id)) errs.push(`${w}: missing or duplicate id`); ids.add(d.id);
    if (!topicOk(d.topic, map)) errs.push(`${w}: unknown topic "${d.topic}"`);
    const ci = id => d.columns.findIndex(c => c.id === id);
    if (ci(d.iv) < 0 || ci(d.dv) < 0 || d.iv === d.dv) { errs.push(`${w}: iv and dv must be two of its columns`); continue; }
    if (!types.includes(d.type)) errs.push(`${w}: unknown type ${d.type}`);
    for (const t of d.alsoAccept || []) if (!types.includes(t) || t === d.type || (t === 'bar') !== (d.type === 'bar')) errs.push(`${w}: alsoAccept ${t} must be another number-axis type`);
    for (const t of types) if (!d.typeWhy || !d.typeWhy[t]) errs.push(`${w}: typeWhy.${t} is required`);
    if (d.justify?.correct !== TYPE_REASON[d.type]) errs.push(`${w}: the right justification for a ${d.type} graph is "${data.justifications[TYPE_REASON[d.type]]}"`);
    if ((d.justify?.why || []).length !== 4) errs.push(`${w}: one why per justification`);
    const xi = ci(d.iv), yi = ci(d.dv);
    const xNum = d.rows.every(r => typeof r[xi] === 'number'), yNum = d.rows.every(r => typeof r[yi] === 'number');
    if (!yNum) errs.push(`${w}: the dependent variable must be numbers`);
    if (d.type === 'bar' && xNum) errs.push(`${w}: a bar graph's x-axis variable should be categories`);
    if (d.type !== 'bar' && !xNum) errs.push(`${w}: a ${d.type} graph needs a number x-axis variable`);
    if (d.rows.some(r => r.length !== d.columns.length)) errs.push(`${w}: every row has one value per column`);
    if (d.type === 'scatter' && d.err) errs.push(`${w}: a scatter plot of individuals has no error bars`);
    if (d.err && (d.err.length !== d.rows.length || d.err.some(e => !(e > 0)))) errs.push(`${w}: one positive ±2 SE per row`);
    for (const c of d.columns) if (c.unit && (c.wrongUnits || []).includes(c.unit)) errs.push(`${w}: column ${c.id} lists its own unit as wrong`);
    // the reference scale passes every check the page makes
    const ys = d.rows.map(r => r[yi]), all = ys.concat(d.err ? ys.map((v, k) => v + d.err[k]).concat(ys.map((v, k) => v - d.err[k])) : []);
    const fails = M.graph.checkScale(d.scale?.y || {}, all, { name: 'y-axis', bar: d.type === 'bar' }).filter(x => !x.ok);
    if (d.type !== 'bar') fails.push(...M.graph.checkScale(d.scale?.x || {}, d.rows.map(r => r[xi]), { name: 'x-axis' }).filter(x => !x.ok));
    for (const f of fails) errs.push(`${w}: reference scale fails: ${f.msg}`);
    // every value lands on the grid's minor steps within the plotting tolerance
    const my = M.graph.minorStep(d.scale?.y?.interval || 1);
    if (ys.some(v => Math.abs(Math.round((v - d.scale.y.min) / my) * my + d.scale.y.min - v) > my / 2 + 1e-9)) errs.push(`${w}: internal error: a value cannot be placed within half a grid step`);
  }
  return errs;
}
