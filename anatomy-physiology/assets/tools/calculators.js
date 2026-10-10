/* Worked-example calculators (docs/anp-spec.md section 8.6).

   Every calculator is data in data/tools/calculators.json: its inputs, the
   values derived from them (as small arithmetic expressions), the worked steps
   (templates that print those values with their units), reference ranges,
   what the answer means, and a practice generator. This script only reads
   that data, so a new calculator needs no code.

   Two modes per calculator:
     Calculate  the learner enters numbers; every step is shown, live.
     Practice   a problem with realistic random values; the steps stay hidden
                until the answer is checked against a tolerance, then the full
                worked solution and its meaning are shown. Scored item id:
                calculators:<id>:practice (recorded through AnpCore, so a miss
                reaches the review queue).

   Expressions are evaluated by a tiny parser below, not eval(): the page's
   Content-Security-Policy does not allow eval, and the data should never be
   able to run code anyway. */
(function(){
  var KIND = 'calculators';
  var app = document.getElementById('app');
  if(!app) return;
  var base = window.ANP_BASE || '../';
  var src = app.getAttribute('data-src') || (base + 'data/tools/calculators.json');

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ------------------------------------------------------ expressions */

  var FUNCS = {
    abs: Math.abs, sqrt: Math.sqrt, min: Math.min, max: Math.max,
    round: function(x, d){ var k = Math.pow(10, d || 0); return Math.round(x * k) / k; }
  };
  function tokenize(s){
    var re = /\s*(\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+|[A-Za-z_]\w*|<=|>=|==|!=|&&|\|\||[-+*\/^()<>!,])/g;
    var out = [], m, pos = 0;
    s = String(s);
    while(pos < s.length){
      re.lastIndex = pos;
      m = re.exec(s);
      if(!m || m.index !== pos){ if(/^\s*$/.test(s.slice(pos))) break; throw new Error('Bad expression: ' + s); }
      out.push(m[1]); pos = re.lastIndex;
    }
    return out;
  }
  function evaluate(expr, env){
    var t = tokenize(expr), i = 0;
    function peek(){ return t[i]; }
    function next(){ return t[i++]; }
    function expect(x){ if(next() !== x) throw new Error('Expected ' + x + ' in ' + expr); }
    function or(){ var v = and(); while(peek() === '||'){ next(); var r = and(); v = (v || r) ? 1 : 0; } return v; }
    function and(){ var v = cmp(); while(peek() === '&&'){ next(); var r = cmp(); v = (v && r) ? 1 : 0; } return v; }
    function cmp(){
      var v = add(), op = peek();
      if(op === '<' || op === '<=' || op === '>' || op === '>=' || op === '==' || op === '!='){
        next(); var r = add(), e = 1e-9;
        if(op === '<') return v < r - e ? 1 : 0;
        if(op === '<=') return v <= r + e ? 1 : 0;
        if(op === '>') return v > r + e ? 1 : 0;
        if(op === '>=') return v >= r - e ? 1 : 0;
        if(op === '==') return Math.abs(v - r) <= e ? 1 : 0;
        return Math.abs(v - r) > e ? 1 : 0;
      }
      return v;
    }
    function add(){ var v = mul(); while(peek() === '+' || peek() === '-'){ var op = next(), r = mul(); v = op === '+' ? v + r : v - r; } return v; }
    function mul(){ var v = unary(); while(peek() === '*' || peek() === '/'){ var op = next(), r = unary(); v = op === '*' ? v * r : v / r; } return v; }
    function unary(){ if(peek() === '-'){ next(); return -unary(); } if(peek() === '!'){ next(); return unary() ? 0 : 1; } return pow(); }
    function pow(){ var b = atom(); if(peek() === '^'){ next(); return Math.pow(b, unary()); } return b; }
    function atom(){
      var tok = next();
      if(tok === undefined) throw new Error('Unexpected end of ' + expr);
      if(tok === '('){ var v = or(); expect(')'); return v; }
      if(/^[\d.]/.test(tok)) return parseFloat(tok);
      if(/^[A-Za-z_]/.test(tok)){
        if(peek() === '('){
          next(); var args = [];
          if(peek() !== ')'){ args.push(or()); while(peek() === ','){ next(); args.push(or()); } }
          expect(')');
          if(!FUNCS[tok]) throw new Error('Unknown function ' + tok);
          return FUNCS[tok].apply(null, args);
        }
        if(!(tok in env)) throw new Error('Unknown value ' + tok + ' in ' + expr);
        return env[tok];
      }
      throw new Error('Unexpected ' + tok + ' in ' + expr);
    }
    var v = or();
    if(i < t.length) throw new Error('Trailing ' + t[i] + ' in ' + expr);
    return v;
  }
  function truthy(expr, env){ try{ return !!evaluate(expr, env); }catch(e){ return false; } }

  /* ------------------------------------------------------ numbers */

  function group(intPart){ return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmt(v, dp, flags){
    if(typeof v !== 'number' || !isFinite(v)) return '—';
    var neg = v < 0 && Math.abs(v) >= Math.pow(10, -dp) / 2;
    var s = Math.abs(v).toFixed(dp);
    var parts = s.split('.');
    s = group(parts[0]) + (parts[1] ? '.' + parts[1] : '');
    if(neg) s = '−' + s;
    else if(flags && flags.indexOf('+') > -1 && Number(Math.abs(v).toFixed(dp)) !== 0) s = '+' + s;
    if(neg && flags && flags.indexOf('p') > -1) s = '(' + s + ')';
    return s;
  }
  function dpOf(calc, key){
    var all = calc.inputs.concat(calc.derived || []);
    for(var i = 0; i < all.length; i++) if(all[i].key === key){
      if(typeof all[i].dp === 'number') return all[i].dp;
      if(all[i].step){ var s = String(all[i].step); return s.indexOf('.') > -1 ? s.split('.')[1].length : 0; }
      return 0;
    }
    return 1;
  }
  /* {key}, {key:2} (decimals), {key:+} (signed), {key:p} (parenthesize a
     negative), combinable: {key:+1}. */
  function fill(calc, tpl, env){
    return String(tpl || '').replace(/\{([A-Za-z_]\w*)(?::([+p]*)(\d*))?\}/g, function(all, key, flags, dp){
      if(!(key in env)) return all;
      return fmt(env[key], dp !== undefined && dp !== '' ? +dp : dpOf(calc, key), flags || '');
    });
  }
  function compute(calc, values){
    var env = {};
    calc.inputs.forEach(function(inp){ env[inp.key] = values[inp.key]; });
    var bad = null;
    (calc.invalid || []).some(function(r){ if(truthy(r.when, env)){ bad = r.text; return true; } return false; });
    if(bad) return { env: env, invalid: bad };
    try{ (calc.derived || []).forEach(function(d){ env[d.key] = evaluate(d.expr, env); }); }
    catch(e){ return { env: env, invalid: 'Those numbers cannot be calculated.' }; }
    var broken = (calc.derived || []).some(function(d){ return !isFinite(env[d.key]); });
    if(broken) return { env: env, invalid: 'Those numbers give a result that cannot be calculated. Check for a zero where one does not belong.' };
    return { env: env };
  }
  function meaningHtml(calc, env){
    var main = null, extra = [];
    (calc.meaning || []).forEach(function(m){
      if(!truthy(m.when, env)) return;
      if(m.also) extra.push(m); else if(!main) main = m;
    });
    return [main].concat(extra).filter(Boolean).map(function(m){ return '<p>' + fill(calc, m.text, env) + '</p>'; }).join('');
  }
  function bandOf(res, env){
    var bands = res.bands || [];
    for(var i = 0; i < bands.length; i++) if(!bands[i].when || truthy(bands[i].when, env)) return bands[i];
    return null;
  }

  /* ------------------------------------------------------ state */

  var DATA = null, current = null, mode = 'calc', values = {}, problem = null;
  var PREF = 'anp_calc_last_v1';
  function topicInfo(id){ var ts = (window.AnpCurriculum || {}).topics || []; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return null; }
  function topicNumber(id){ var ts = (window.AnpCurriculum || {}).topics || []; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return i + 1; return 0; }
  function itemId(calc){ return KIND + ':' + calc.id + ':practice'; }

  function topicLink(id){
    var t = topicInfo(id);
    if(!t) return esc(id);
    return t.built ? '<a href="' + base + 'lessons/' + esc(id) + '.html">' + esc(t.title) + '</a>' : esc(t.title);
  }

  /* ------------------------------------------------------ layout */

  function mount(){
    app.innerHTML =
      '<div class="calc">' +
        '<div class="calc-pickhost"></div>' +
        '<section class="calc-card" aria-live="off"></section>' +
      '</div>';
    var want = (location.hash || '').replace(/^#/, '');
    var last = null; try{ last = localStorage.getItem(PREF); }catch(e){}
    var first = byId(want) ? want : byId(last) ? last : DATA.calculators[0].id;
    select(first, false);
    window.addEventListener('hashchange', function(){ var h = location.hash.replace(/^#/, ''); if(byId(h) && (!current || current.id !== h)) select(h, false); });
  }
  /* The chooser: every calculator by group, in the shared compact picker
     (AnpToolKit.picker), so the open calculator is on the first screen. The
     old chip grid is the fallback if the kit is missing. */
  function renderPicker(){
    var host = app.querySelector('.calc-pickhost');
    host.innerHTML = '';
    if(window.AnpToolKit){
      window.AnpToolKit.picker(host, {
        label: 'Calculator', noun: 'calculators', current: current.id,
        groups: DATA.groups.map(function(g){ return { title: g.title, items: DATA.calculators.filter(function(c){ return c.group === g.id; }).map(function(c){
          return { id: c.id, title: c.title, meta: c.short.replace(/<[^>]+>/g, '') };
        }) }; }),
        onPick: function(id){ select(id, true); }
      });
      return;
    }
    var pick = document.createElement('nav');
    pick.className = 'calc-pick'; pick.setAttribute('aria-label', 'Choose a calculator');
    host.appendChild(pick);
    pick.innerHTML = DATA.groups.map(function(g){
      var cs = DATA.calculators.filter(function(c){ return c.group === g.id; });
      if(!cs.length) return '';
      return '<div class="calc-group"><h2 class="calc-group-h">' + esc(g.title) + '</h2><div class="calc-chips">' + cs.map(function(c){
        return '<button type="button" class="calc-chip" data-id="' + esc(c.id) + '" aria-pressed="false"><b>' + esc(c.title) + '</b><span>' + c.short + '</span></button>';
      }).join('') + '</div></div>';
    }).join('');
    pick.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('.calc-chip') : null;
      if(!b) return;
      select(b.getAttribute('data-id'), true);
    });
    app.querySelectorAll('.calc-chip').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-id') === current.id ? 'true' : 'false'); });
  }
  function byId(id){ if(!id) return null; for(var i = 0; i < DATA.calculators.length; i++) if(DATA.calculators[i].id === id) return DATA.calculators[i]; return null; }

  function select(id, focus){
    current = byId(id); mode = 'calc'; problem = null;
    values = {};
    current.inputs.forEach(function(inp){ values[inp.key] = inp['default']; });
    renderPicker();
    try{ localStorage.setItem(PREF, id); }catch(e){}
    if(location.hash.replace(/^#/, '') !== id && window.history && history.replaceState) try{ history.replaceState(null, '', '#' + id); }catch(e){}
    renderCard();
    if(focus){ var h = app.querySelector('.calc-card h2'); if(h){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: false }); } }
  }

  function renderCard(){
    var c = current, card = app.querySelector('.calc-card');
    var n = topicNumber(c.topic);
    card.innerHTML =
      '<header class="calc-head">' +
        '<p class="calc-eyebrow">Topic ' + n + ' · ' + topicLink(c.topic) + '</p>' +
        '<h2>' + esc(c.title) + '</h2>' +
        '<p class="calc-intro">' + c.intro + '</p>' +
        '<p class="calc-formula" aria-label="Formula">' + c.formula + '</p>' +
      '</header>' +
      '<div class="calc-modes" role="group" aria-label="Mode">' +
        '<button type="button" class="calc-mode" data-mode="calc" aria-pressed="' + (mode === 'calc') + '">Calculate</button>' +
        '<button type="button" class="calc-mode" data-mode="practice" aria-pressed="' + (mode === 'practice') + '">Practice</button>' +
      '</div>' +
      '<div class="calc-body"></div>';
    card.querySelectorAll('.calc-mode').forEach(function(b){
      b.addEventListener('click', function(){
        mode = b.getAttribute('data-mode');
        card.querySelectorAll('.calc-mode').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if(mode === 'practice' && (!problem || problem.done)) newProblem();   // an answered problem is never shown as fresh
        renderBody();
      });
    });
    renderBody();
  }

  function renderBody(){ picAnim++; if(mode === 'calc') renderCalc(); else renderPractice(); }

  /* ------------------------------------------------------ calculate mode */

  function inputId(key){ return 'calc-in-' + current.id + '-' + key; }

  function renderCalc(){
    var c = current, body = app.querySelector('.calc-body');
    body.innerHTML =
      ((c.presets || []).length ? '<div class="calc-presets" role="group" aria-label="Load an example"><span class="calc-presets-h">Try:</span>' + c.presets.map(function(p, i){
        return '<button type="button" class="calc-preset" data-i="' + i + '">' + esc(p.label) + '</button>';
      }).join('') + '</div>' : '') +
      (c.picture ? '<figure class="calc-pic" aria-label="Live picture"></figure>' : '') +
      '<div class="calc-grid">' +
        '<form class="calc-inputs" novalidate onsubmit="return false">' + c.inputs.map(function(inp){
          return '<div class="calc-field">' +
            '<label for="' + inputId(inp.key) + '"><span class="calc-label">' + esc(inp.label) + '</span> <span class="calc-sym">' + inp.sym + '</span></label>' +
            '<div class="calc-input-row"><input id="' + inputId(inp.key) + '" type="number" inputmode="decimal" data-key="' + inp.key + '" value="' + esc(values[inp.key]) + '" step="' + (inp.step || 'any') + '" min="' + inp.min + '" max="' + inp.max + '"' + (inp.hint ? ' aria-describedby="' + inputId(inp.key) + '-h"' : '') + '>' +
            (inp.unit ? '<span class="calc-unit">' + esc(inp.unit) + '</span>' : '') + '</div>' +
            (c.picture ? '<input type="range" class="calc-range" data-for="' + inp.key + '" min="' + inp.min + '" max="' + inp.max + '" step="' + (inp.step || 'any') + '" value="' + esc(values[inp.key]) + '" aria-label="' + esc(inp.label) + ' slider">' : '') +
            (inp.hint ? '<p class="calc-hint" id="' + inputId(inp.key) + '-h">' + esc(inp.hint) + '</p>' : '') +
          '</div>';
        }).join('') + '</form>' +
        '<div class="calc-out" aria-live="polite"></div>' +
      '</div>' +
      '<div class="calc-work"></div>';
    body.querySelectorAll('.calc-preset').forEach(function(b){
      b.addEventListener('click', function(){
        var p = c.presets[+b.getAttribute('data-i')];
        Object.keys(p.values).forEach(function(k){ values[k] = p.values[k]; var el = document.getElementById(inputId(k)); if(el) el.value = p.values[k]; var r = body.querySelector('.calc-range[data-for="' + k + '"]'); if(r) r.value = p.values[k]; });
        update();
      });
    });
    body.querySelectorAll('.calc-inputs input:not(.calc-range)').forEach(function(el){
      el.addEventListener('input', function(){ var r = body.querySelector('.calc-range[data-for="' + el.getAttribute('data-key') + '"]'); if(r && el.value !== '') r.value = el.value; update(); });
    });
    body.querySelectorAll('.calc-range').forEach(function(r){
      r.addEventListener('input', function(){ var el = document.getElementById(inputId(r.getAttribute('data-for'))); el.value = r.value; update(); });
    });
    baseEnv = null;
    if(c.picture){ var dv = {}; c.inputs.forEach(function(inp){ dv[inp.key] = inp['default']; }); var b0 = compute(c, dv); if(!b0.invalid) baseEnv = b0.env; }
    update();
    if(window.AnpToolKit) window.AnpToolKit.strip(body, { topic: c.topic, text: c.title + ' ' + c.intro });
  }

  function readInputs(){
    var c = current, problems = [];
    c.inputs.forEach(function(inp){
      var el = document.getElementById(inputId(inp.key));
      var raw = el ? String(el.value).trim() : '';
      var v = parseFloat(raw);
      var field = el ? el.closest('.calc-field') : null;
      var bad = raw === '' || !isFinite(v) ? 'Enter a number for ' + inp.label.toLowerCase() + '.' :
        v < inp.min || v > inp.max ? inp.label + ' should be between ' + fmt(inp.min, dpOf(c, inp.key)) + ' and ' + fmt(inp.max, dpOf(c, inp.key)) + (inp.unit ? ' ' + inp.unit : '') + ' for this calculator.' : null;
      if(field) field.classList.toggle('is-bad', !!bad);
      if(el) el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if(bad) problems.push(bad); else values[inp.key] = v;
    });
    return problems;
  }

  function update(){
    var c = current, out = app.querySelector('.calc-out'), work = app.querySelector('.calc-work');
    var problems = readInputs();
    var r = problems.length ? null : compute(c, values);
    if(problems.length || r.invalid){
      picAnim++; var ph = app.querySelector('.calc-pic'); if(ph) ph.classList.add('is-stale');
      out.innerHTML = '<div class="calc-invalid" role="status"><b>Check the numbers.</b> ' + esc(problems.length ? problems[0] : r.invalid) + '</div>';
      work.innerHTML = '';
      return;
    }
    out.innerHTML = resultsHtml(c, r.env);
    work.innerHTML = solutionHtml(c, r.env, 'Every step');
    var pc = app.querySelector('.calc-pic'); if(pc) pc.classList.remove('is-stale');
    drawPicture(c, r.env);
  }

  function resultsHtml(c, env){
    return '<div class="calc-results">' + c.results.map(function(res){
      var band = bandOf(res, env);
      return '<div class="calc-result">' +
        '<span class="calc-result-label">' + esc(res.label) + '</span>' +
        '<span class="calc-result-value">' + fmt(env[res.key], dpOf(c, res.key), res.signed ? '+' : '') + (res.unit ? ' <small>' + esc(res.unit) + '</small>' : '') + '</span>' +
        (band ? '<span class="calc-band tone-' + esc(band.tone || 'ok') + '">' + esc(band.label) + '</span>' : '') +
        (res.normal ? '<span class="calc-normal"><b>Reference:</b> ' + esc(res.normal) + '</span>' : '') +
      '</div>';
    }).join('') + '</div>';
  }

  function solutionHtml(c, env, heading){
    return '<h3 class="calc-h">' + esc(heading) + '</h3>' +
      '<ol class="calc-steps">' + c.steps.map(function(s){
        return '<li><span class="calc-step-title">' + esc(s.title) + '</span><span class="calc-step-text">' + fill(c, s.text, env) + '</span></li>';
      }).join('') + '</ol>' +
      '<div class="calc-meaning"><h3 class="calc-h">What it means</h3>' + meaningHtml(c, env) + '</div>' +
      (c.note ? '<aside class="calc-note"><p>' + fill(c, c.note, env) + '</p></aside>' : '') +
      (c.exam ? '<aside class="for-your-exam calc-exam"><p><b>For your exam:</b> ' + fill(c, c.exam, env) + '</p></aside>' : '');
  }

  /* ------------------------------------------------------ live picture
     One small drawing per formula family (data/calc-pictures.json, merged
     into each calculator as c.picture by build-anp.mjs). It is redrawn from
     the same computed values the steps print, on every input, so dragging a
     slider moves the picture and the numbers together. Families: tube (flow,
     pressure gradient and radius), wave (arterial pressure), balance
     (filtration pressures), pump (ventricle volumes, cardiac output), stack
     (a whole split into its parts). */
  var SVGNS = 'http://www.w3.org/2000/svg', picAnim = 0, baseEnv = null;
  function reducedMotion(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
  function S(name, attrs, text){ var e = document.createElementNS(SVGNS, name); for(var a in attrs) if(attrs[a] != null) e.setAttribute(a, attrs[a]); if(text != null) e.textContent = text; return e; }
  function val(c, env, key){ return fmt(env[key], dpOf(c, key)); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function drawPicture(c, env){
    var host = app.querySelector('.calc-pic');
    if(!host || !c.picture) return;
    picAnim++;
    var pic = c.picture, svg, cap = '';
    host.innerHTML = '';
    if(pic.kind === 'tube') { var r = tube(c, env, pic); svg = r.svg; cap = r.cap; }
    else if(pic.kind === 'wave') { var w = wave(c, env, pic); svg = w.svg; cap = w.cap; }
    else if(pic.kind === 'balance') { var b = balance(c, env, pic); svg = b.svg; cap = b.cap; }
    else if(pic.kind === 'pump') { var u = pump(c, env, pic); svg = u.svg; cap = u.cap; }
    else if(pic.kind === 'stack') { var k = stack(c, env, pic); svg = k.svg; cap = k.cap; }
    if(!svg) return;
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', cap.replace(/<[^>]+>/g, ''));
    svg.setAttribute('class', 'calc-svg');
    host.appendChild(svg);
    var p = document.createElement('p'); p.className = 'calc-pic-cap'; p.innerHTML = cap; host.appendChild(p);
  }
  /* Shared illustration pieces (visual polish 2026-10): gradients are written
     per drawing with unique ids; colors come from the --cp-* tokens in
     calculators.css so dark mode has its own palette. */
  var GID = 0;
  function defsOf(svg){ var d = svg.querySelector('defs'); if(!d){ d = S('defs', {}); svg.insertBefore(d, svg.firstChild); } return d; }
  function grad(svg, kind, stops, attrs){
    var id = 'cpg' + (++GID), g = S(kind === 'r' ? 'radialGradient' : 'linearGradient', Object.assign({ id: id }, attrs || {}));
    stops.forEach(function(s){ g.appendChild(S('stop', { offset: s[0], style: 'stop-color:' + s[1] + (s[2] != null ? ';stop-opacity:' + s[2] : '') })); });
    defsOf(svg).appendChild(g); return 'url(#' + id + ')';
  }
  function clipOf(svg, shape){ var id = 'cpc' + (++GID), cp = S('clipPath', { id: id }); cp.appendChild(shape); defsOf(svg).appendChild(cp); return 'url(#' + id + ')'; }
  // a red blood cell seen face-on: a disc with the pale biconcave centre
  function rbcFill(svg){ return grad(svg, 'r', [[0, 'var(--cp-rbc-in)'], [0.45, 'var(--cp-rbc-in)'], [0.62, 'var(--cp-rbc)'], [1, 'var(--cp-rbc-dk)']]); }
  // a pressure gauge: bezel, face, ticks 0 to 200 mm Hg over a 240 degree sweep, needle and hub
  function dial(svg, x, y, r, v, max){
    var bez = grad(svg, 'l', [[0, 'var(--cp-metal-hi)'], [1, 'var(--cp-metal)']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    svg.appendChild(S('circle', { cx: x, cy: y, r: r + 2.5, fill: bez, 'class': 'cp-bezel' }));
    svg.appendChild(S('circle', { cx: x, cy: y, r: r, 'class': 'cp-face' }));
    for(var t = 0; t <= max; t += max / 10){
      var a = (-210 + 240 * t / max) * Math.PI / 180, big = t % (max / 2) === 0, r1 = r - (big ? 5.5 : 3.5);
      svg.appendChild(S('line', { x1: x + Math.cos(a) * (r - 1.5), y1: y + Math.sin(a) * (r - 1.5), x2: x + Math.cos(a) * r1, y2: y + Math.sin(a) * r1, 'class': big ? 'cp-tk cp-tk-b' : 'cp-tk' }));
    }
    var an = (-210 + 240 * clamp(v / max, 0, 1)) * Math.PI / 180;
    svg.appendChild(S('path', { d: 'M' + (x - Math.sin(an) * 1.8).toFixed(1) + ',' + (y + Math.cos(an) * 1.8).toFixed(1) + ' L' + (x + Math.cos(an) * (r - 3)).toFixed(1) + ',' + (y + Math.sin(an) * (r - 3)).toFixed(1) + ' L' + (x + Math.sin(an) * 1.8).toFixed(1) + ',' + (y - Math.cos(an) * 1.8).toFixed(1) + 'Z', 'class': 'cp-needle' }));
    svg.appendChild(S('circle', { cx: x, cy: y, r: 2.6, 'class': 'cp-hub' }));
  }
  // a tapered, filled force arrow from (x, ya) to (x, yb)
  function forceArrow(svg, x, ya, yb, w, cls){
    var dir = yb < ya ? -1 : 1, len = Math.abs(yb - ya), hl = Math.min(10, len * 0.55), hw = w + 4;
    var sy = yb - dir * hl;
    svg.appendChild(S('path', { d: 'M' + (x - w / 2) + ',' + ya + ' L' + (x - w / 2) + ',' + sy + ' L' + (x - hw / 2 - 1) + ',' + sy + ' L' + x + ',' + yb + ' L' + (x + hw / 2 + 1) + ',' + sy + ' L' + (x + w / 2) + ',' + sy + ' L' + (x + w / 2) + ',' + ya + 'Z', 'class': 'cp-farrow ' + cls }));
  }
  function tube(c, env, pic){
    var W = 360, H = 170, x0 = 34, x1 = 316, cy = 96, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var be = baseEnv || env;
    var rr = pic.r ? env[pic.r] : pic.rRes ? Math.pow(be[pic.rRes] / env[pic.rRes], 0.25) : 1;
    var rr0 = 1;
    rr = clamp(isFinite(rr) ? rr : 1, 0.08, 3);
    var R0 = 20, rad = clamp(R0 * rr, 2.5, 34), wt = clamp(6 + rad * 0.12, 6, 10);
    var wallG = grad(svg, 'l', [[0, 'var(--cp-wall-out)'], [0.55, 'var(--cp-wall)'], [1, 'var(--cp-endo)']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    var wallG2 = grad(svg, 'l', [[0, 'var(--cp-endo)'], [0.45, 'var(--cp-wall)'], [1, 'var(--cp-wall-out)']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    // the pressure falls along the vessel: the lumen fades from inlet to outlet
    var lumG = grad(svg, 'l', [[0, 'var(--cp-plasma-hi)'], [1, 'var(--cp-plasma)']], { x1: 0, y1: 0, x2: 1, y2: 0 });
    // normal outline for comparison
    if(Math.abs(rr - 1) > 0.02){ svg.appendChild(S('rect', { x: x0, y: cy - R0 - 7, width: x1 - x0, height: 2 * (R0 + 7), rx: 3, 'class': 'cp-ghost' })); }
    svg.appendChild(S('rect', { x: x0, y: cy - rad, width: x1 - x0, height: 2 * rad, fill: lumG }));
    var g = S('g', { 'clip-path': clipOf(svg, S('rect', { x: x0, y: cy - rad, width: x1 - x0, height: 2 * rad })) }); svg.appendChild(g);
    svg.appendChild(S('rect', { x: x0, y: cy - rad - wt, width: x1 - x0, height: wt, fill: wallG, 'class': 'cp-wallb' }));
    svg.appendChild(S('rect', { x: x0, y: cy + rad, width: x1 - x0, height: wt, fill: wallG2, 'class': 'cp-wallb' }));
    svg.appendChild(S('line', { x1: x0, x2: x1, y1: cy - rad - 0.5, y2: cy - rad - 0.5, 'class': 'cp-endo' }));
    svg.appendChild(S('line', { x1: x0, x2: x1, y1: cy + rad + 0.5, y2: cy + rad + 0.5, 'class': 'cp-endo' }));
    // the cut end: the wall ring seen end-on
    svg.appendChild(S('ellipse', { cx: x0, cy: cy, rx: 5 + wt * 0.4, ry: rad + wt, fill: 'var(--cp-wall-out)', 'class': 'cp-cut' }));
    svg.appendChild(S('ellipse', { cx: x0, cy: cy, rx: 4, ry: Math.max(1.5, rad), 'class': 'cp-cut-in' }));
    // a radius picture compares with the flow before the change (baseFlow), as its width does
    var flow = env[pic.flow], bflow = (pic.r && pic.baseFlow ? env[pic.baseFlow] : be[pic.flow]) || 1;
    // particle speed: velocity = flow / area, relative to the default
    var speed = clamp((flow / bflow) / (rr * rr / (rr0 * rr0)), 0, 40);
    var rbc = rbcFill(svg), cr = clamp(rad * 0.26, 2.2, 5.2);
    var n = Math.round(clamp(12 * rr, 3, 22)), dots = [];
    for(var i = 0; i < n; i++){
      var tilt = ((i * 0.53) % 1);
      var d = S('ellipse', { rx: cr * (0.55 + 0.45 * tilt), ry: cr, fill: rbc, 'class': 'cp-rbc' }); g.appendChild(d);
      dots.push({ el: d, x: x0 + (x1 - x0) * ((i * 0.618) % 1), y: cy + (((i * 0.37) % 1) - 0.5) * Math.max(0, rad - cr) * 1.7 });
    }
    function place(){ dots.forEach(function(d){ d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', d.y.toFixed(1)); }); }
    place();
    if(!reducedMotion() && speed > 0){
      var my = picAnim, last = null;
      requestAnimationFrame(function f(ts){
        if(my !== picAnim) return;
        var dt = last == null ? 0 : Math.min(50, ts - last); last = ts;
        dots.forEach(function(d){ d.x += speed * 0.06 * dt; if(d.x > x1 + 6) d.x = x0 - 6 + (d.x - x1 - 6) % 20; });
        place(); requestAnimationFrame(f);
      });
    }
    // gauges on side taps
    function gauge(x, key, label){
      var top = cy - rad - wt, gy = 26;
      svg.appendChild(S('rect', { x: x - 3, y: gy + 16, width: 6, height: Math.max(2, top - gy - 16), rx: 1, 'class': 'cp-tap' }));
      dial(svg, x, gy, 15, env[key], 200);
      var left = x < W / 2;
      svg.appendChild(S('text', { x: x + (left ? -22 : 22), y: gy - 2, 'text-anchor': left ? 'end' : 'start', 'class': 'cp-t' }, label + ' (mm Hg)'));
      svg.appendChild(S('text', { x: x + (left ? -22 : 22), y: gy + 14, 'text-anchor': left ? 'end' : 'start', 'class': 'cp-v cp-big' }, val(c, env, key)));
    }
    if(pic.pin) gauge(x0 + 34, pic.pin, 'in');
    if(pic.pout) gauge(x1 - 34, pic.pout, 'out');
    svg.appendChild(S('path', { d: 'M' + (x1 + 8) + ',' + cy + ' l20,0 m-8,-7 l8,7 l-8,7', 'class': 'cp-arrow' }));
    svg.appendChild(S('text', { x: (x0 + x1) / 2, y: H - 8, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'Flow ' + val(c, env, pic.flow) + ' ' + pic.flowUnit));
    var rtxt = pic.r ? 'radius ' + Math.round(rr * 100) + '% of before' : pic.rRes ? 'resistance ' + val(c, env, pic.rRes) : '';
    if(rtxt) svg.appendChild(S('text', { x: (x0 + x1) / 2, y: Math.min(cy + Math.max(rad, R0) + wt + 18, H - 26), 'text-anchor': 'middle', 'class': 'cp-t' }, rtxt));
    var cap = (pic.pin && pic.pout ? 'Pressure falls from ' + val(c, env, pic.pin) + ' to ' + val(c, env, pic.pout) + ' mm Hg along the vessel. ' : '') +
      (pic.r ? 'The radius is ' + Math.round(rr * 100) + '% of before, so resistance is ' + fmt(1 / Math.pow(rr, 4), 2) + ' times and flow ' + fmt(Math.pow(rr, 4), 2) + ' times what it was. ' : '') +
      'Flow: <b>' + val(c, env, pic.flow) + ' ' + esc(pic.flowUnit) + '</b>. The red cells move at flow ÷ cross-section, the average speed' + (Math.abs(speed - 1) > 0.02 ? ': ' + fmt(speed, 2) + ' times the starting speed. ' : '. ') +
      'Narrowing a vessel speeds up a flow that is held fixed, but with the pressure difference held, flow falls with r⁴ and the average speed falls with r².';
    return { svg: svg, cap: cap };
  }
  function wave(c, env, pic){
    var W = 360, H = 160, L = 40, R = 290, T = 12, B = 134, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var sbp = env[pic.sbp], dbp = env[pic.dbp], top = Math.max(160, Math.ceil((sbp + 15) / 20) * 20);
    function y(v){ return B - v / top * (B - T); }
    svg.appendChild(S('rect', { x: L, y: T, width: R - L, height: B - T, rx: 6, 'class': 'cp-plot' }));
    for(var t = 0; t <= top; t += top > 200 ? 50 : 40){ if(t > 0 && t < top) svg.appendChild(S('line', { x1: L, x2: R, y1: y(t), y2: y(t), 'class': 'cp-grid' })); svg.appendChild(S('text', { x: L - 6, y: y(t) + 3.5, 'text-anchor': 'end', 'class': 'cp-tick' }, String(t))); }
    // the band between diastolic and systolic
    svg.appendChild(S('rect', { x: L, y: y(sbp), width: R - L, height: Math.max(0, y(dbp) - y(sbp)), 'class': 'cp-band' }));
    // schematic arterial trace: fast upstroke, dicrotic notch, slow fall
    function shape(u){ if(u < 0.13){ var a = u / 0.13; return a * a * (3 - 2 * a); } if(u < 0.34) return 1 - 0.38 * (u - 0.13) / 0.21; if(u < 0.38) return 0.62 - 0.06 * Math.sin((u - 0.34) / 0.04 * Math.PI); return 0.56 * Math.pow(1 - (u - 0.38) / 0.62, 1.4); }
    var d = '', pts = [];
    for(var i = 0; i <= 200; i++){ var u = i / 100, ph = u % 1; var px = L + (R - L) * u / 2, py = y(dbp + (sbp - dbp) * Math.max(0, shape(ph))); pts.push([px, py]); d += (i ? ' L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1); }
    var fillG = grad(svg, 'l', [[0, 'var(--anp-o2)', 0.32], [1, 'var(--anp-o2)', 0.04]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    svg.appendChild(S('path', { d: d + ' L' + R + ',' + y(dbp) + ' L' + L + ',' + y(dbp) + 'Z', fill: fillG }));
    svg.appendChild(S('path', { d: d, 'class': 'cp-wave' }));
    function tag(v, label, cls, dy){
      svg.appendChild(S('line', { x1: L, x2: R, y1: y(v), y2: y(v), 'class': 'cp-hl ' + cls }));
      var ty = y(v) + (dy || 0), txt = label + ' ' + fmt(v, 0);
      svg.appendChild(S('rect', { x: R + 6, y: ty - 9, width: txt.length * 6.6 + 10, height: 18, rx: 9, 'class': 'cp-pill ' + cls }));
      svg.appendChild(S('text', { x: R + 11, y: ty + 4, 'class': 'cp-pill-t' }, txt));
    }
    var sY = y(sbp), dY = y(dbp), mY = pic.map ? y(env[pic.map]) : null;
    var sOff = 0, dOff = 0, mOff = 0;
    if(mY != null){ if(dY - mY < 20) { mOff = -Math.max(0, 20 - (dY - mY)) / 2; dOff = Math.max(0, 20 - (dY - mY)) / 2; } if(mY + mOff - sY < 20) mOff = Math.max(mOff, sY + 20 - mY); }
    else if(dY - sY < 20){ sOff = -(20 - (dY - sY)) / 2; dOff = (20 - (dY - sY)) / 2; }
    tag(sbp, 'SBP', 'cp-sys', sOff); tag(dbp, 'DBP', 'cp-dia', dOff);
    if(pic.avg) svg.appendChild(S('line', { x1: L, x2: R, y1: y(env[pic.avg]), y2: y(env[pic.avg]), 'class': 'cp-hl cp-avg' }));
    if(pic.map) tag(env[pic.map], 'MAP', 'cp-map', mOff);
    if(pic.pp){ var px2 = L + (R - L) * 0.07; svg.appendChild(S('path', { d: 'M' + px2 + ',' + (dY - 1) + ' L' + px2 + ',' + (sY + 1) + ' M' + (px2 - 4) + ',' + (sY + 1) + ' l8,0 M' + (px2 - 4) + ',' + (dY - 1) + ' l8,0', 'class': 'cp-span' })); svg.appendChild(S('text', { x: px2 + 7, y: (sY + dY) / 2 + 4, 'class': 'cp-v cp-halo' }, 'PP ' + fmt(env[pic.pp], 0))); }
    svg.appendChild(S('text', { x: 10, y: (T + B) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 10 ' + (T + B) / 2 + ')', 'class': 'cp-tick' }, 'mm Hg'));
    svg.appendChild(S('text', { x: (L + R) / 2, y: H - 6, 'text-anchor': 'middle', 'class': 'cp-tick' }, 'two heartbeats'));
    var cap = 'Two heartbeats of arterial pressure between ' + fmt(dbp, 0) + ' and ' + fmt(sbp, 0) + ' mm Hg (the trace shape is schematic). ' +
      (pic.map ? 'MAP sits about a third of the way up, <b>' + fmt(env[pic.map], 0) + ' mm Hg</b>, below the plain average (dashed, ' + fmt(env[pic.avg], 0) + '), because the pressure spends most of each beat near diastolic.' : 'The pulse pressure, <b>' + fmt(env[pic.pp], 0) + ' mm Hg</b>, is the height of each pulse.');
    return { svg: svg, cap: cap };
  }
  function balance(c, env, pic){
    var W = 360, H = 210, cy = 108, x0 = 10, x1 = 254, lr = 14, wt = 6, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var glom = pic.where === 'glomerulus';
    // the space around the vessel: interstitial fluid with tissue cells, or Bowman's space
    svg.appendChild(S('rect', { x: x0, y: 8, width: x1 - x0, height: H - 16, rx: 12, 'class': 'cp-isf' }));
    if(!glom){
      [[30, 30], [118, 22], [214, 34], [64, 186], [176, 192], [240, 180]].forEach(function(p, i){
        svg.appendChild(S('ellipse', { cx: p[0], cy: p[1], rx: 15, ry: 9, transform: 'rotate(' + (i * 23 % 40 - 20) + ' ' + p[0] + ' ' + p[1] + ')', 'class': 'cp-cell' }));
        svg.appendChild(S('circle', { cx: p[0] + 2, cy: p[1], r: 3.2, 'class': 'cp-nuc' }));
      });
    }
    svg.appendChild(S('text', { x: x1 - 6, y: 22, 'text-anchor': 'end', 'class': 'cp-t cp-halo' }, glom ? "Bowman's space" : 'interstitial fluid'));
    // capillary wall: one layer of endothelial cells, each with a nucleus bulge
    var wallG = grad(svg, 'l', [[0, 'var(--cp-wall-out)'], [1, 'var(--cp-endo)']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    var wallG2 = grad(svg, 'l', [[0, 'var(--cp-endo)'], [1, 'var(--cp-wall-out)']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    svg.appendChild(S('rect', { x: x0, y: cy - lr, width: x1 - x0, height: 2 * lr, 'class': 'cp-lumen' }));
    var rbc = rbcFill(svg);
    for(var k = 0; k < 7; k++){ var rx = x0 + 22 + k * 34; svg.appendChild(S('ellipse', { cx: rx, cy: cy + (k % 2 ? 2 : -2), rx: 6.5 - (k % 3), ry: 10, fill: rbc, 'class': 'cp-rbc' })); }
    svg.appendChild(S('rect', { x: x0, y: cy - lr - wt, width: x1 - x0, height: wt, fill: wallG, 'class': 'cp-wallb' }));
    svg.appendChild(S('rect', { x: x0, y: cy + lr, width: x1 - x0, height: wt, fill: wallG2, 'class': 'cp-wallb' }));
    for(var j = 0; j < 4; j++){
      var cx2 = x0 + 34 + j * 54;
      svg.appendChild(S('ellipse', { cx: cx2, cy: cy - lr - wt / 2, rx: 8, ry: 3.4, 'class': 'cp-enuc' }));
      svg.appendChild(S('ellipse', { cx: cx2 + 25, cy: cy + lr + wt / 2, rx: 8, ry: 3.4, 'class': 'cp-enuc' }));
      svg.appendChild(S('line', { x1: cx2 + 22, x2: cx2 + 22, y1: cy - lr - wt, y2: cy - lr, 'class': 'cp-junc' }));
      svg.appendChild(S('line', { x1: cx2 + 47, x2: cx2 + 47, y1: cy + lr, y2: cy + lr + wt, 'class': 'cp-junc' }));
    }
    if(glom){ for(var f = 0; f < 22; f++) svg.appendChild(S('circle', { cx: x0 + 8 + f * 11, cy: cy - lr - wt + 1.5, r: 1.1, 'class': 'cp-pore' })); }
    svg.appendChild(S('text', { x: x0 + 8, y: cy + 4, 'class': 'cp-t cp-in-lbl' }, glom ? 'glomerular capillary' : 'capillary'));
    var all = pic.out.concat(pic['in']), max = Math.max.apply(null, all.map(function(f){ return Math.abs(env[f.key]); }).concat([20]));
    var sc = 52 / max;
    function arrow(x, v, dir, label, cls){
      var len = Math.abs(v) * sc;
      var y0 = dir === 'out' ? cy - lr - wt - 3 : cy + lr + wt + 3;
      var ya, yb;
      if(dir === 'out'){ ya = y0; yb = y0 - len; if(v < 0){ ya = y0 - len; yb = y0; } }
      else { ya = y0 + len; yb = y0; if(v < 0){ ya = y0; yb = y0 + len; } }
      if(len > 2) forceArrow(svg, x, ya, yb, 6, cls);
      var ty = dir === 'out' ? Math.min(ya, yb) - 6 : Math.max(ya, yb) + 14;
      svg.appendChild(S('text', { x: x, y: ty, 'text-anchor': 'middle', 'class': 'cp-v cp-halo ' + cls }, label.split(' ')[0] + ' ' + fmt(v, 0)));
    }
    pic.out.forEach(function(f, i){ arrow(60 + i * 90, env[f.key], 'out', f.label, 'cp-out'); });
    pic['in'].forEach(function(f, i){ arrow(60 + i * 90 + (pic.out.length > 1 ? 45 : 90), env[f.key], 'in', f.label, 'cp-in'); });
    var net = env[pic.net], nl = clamp(Math.abs(net) * sc, 0, 62), nx = 310;
    svg.appendChild(S('rect', { x: 268, y: 8, width: 84, height: H - 16, rx: 12, 'class': 'cp-netbox' }));
    svg.appendChild(S('text', { x: nx, y: 26, 'text-anchor': 'middle', 'class': 'cp-t' }, 'net'));
    if(nl > 2){ var a = net > 0 ? cy - 2 : cy - 2 - nl, b2 = net > 0 ? cy - 2 - nl : cy - 2; forceArrow(svg, nx, a, b2, 10, net > 0 ? 'cp-out' : 'cp-in'); }
    svg.appendChild(S('text', { x: nx, y: cy + 28, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, fmt(net, 0) + ' mm Hg'));
    svg.appendChild(S('text', { x: nx, y: cy + 44, 'text-anchor': 'middle', 'class': 'cp-t' }, net > 0 ? 'filtration' : net < 0 ? 'reabsorption' : 'no net'));
    svg.appendChild(S('text', { x: nx, y: cy + 58, 'text-anchor': 'middle', 'class': 'cp-t' }, net > 0 ? '(out)' : net < 0 ? '(in)' : 'movement'));
    var cap = 'Arrows above the vessel are pressures moving fluid out; below, pressures moving it back in; length is size. Net: <b>' + fmt(net, 0) + ' mm Hg</b>, ' + (net > 0 ? 'so fluid filters out.' : net < 0 ? 'so fluid moves in.' : 'so there is no net movement.');
    return { svg: svg, cap: cap };
  }
  // the left ventricle in long-axis section: base at the top, apex below
  function lvPath(cx, top, w, h){
    // a bullet shape: near-parallel walls under the base, curving into a rounded apex
    var l = cx - w / 2, r = cx + w / 2;
    return 'M' + l + ',' + top + ' C' + (l - w * 0.02) + ',' + (top + h * 0.42) + ' ' + (cx - w * 0.34) + ',' + (top + h * 0.92) + ' ' + cx + ',' + (top + h) +
      ' C' + (cx + w * 0.36) + ',' + (top + h * 0.92) + ' ' + (r + w * 0.04) + ',' + (top + h * 0.42) + ' ' + r + ',' + top + ' Z';
  }
  // an anterior view of the heart, about 110 by 120
  function heartArt(svg){
    var g = S('g', {});
    var musc = grad(svg, 'r', [[0, 'var(--cp-muscle-hi)'], [0.7, 'var(--cp-muscle)'], [1, 'var(--cp-muscle-dk)']], { cx: 0.42, cy: 0.38, r: 0.75 });
    var art = grad(svg, 'l', [[0, 'var(--cp-art-hi)'], [1, 'var(--cp-art)']], { x1: 0, y1: 0, x2: 1, y2: 0 });
    var vein = grad(svg, 'l', [[0, 'var(--cp-vein-hi)'], [1, 'var(--cp-vein)']], { x1: 0, y1: 0, x2: 1, y2: 0 });
    g.appendChild(S('path', { d: 'M27,40 L27,4 L41,4 L41,42 Z', fill: vein, 'class': 'cp-ves' }));             // superior vena cava
    g.appendChild(S('path', { d: 'M50,46 C48,24 52,8 70,6 C86,4 96,12 97,26 L86,28 C85,19 80,16 72,17 C62,18 61,30 62,46 Z', fill: art, 'class': 'cp-ves' })); // aorta
    g.appendChild(S('path', { d: 'M62,8 l-2,-7 l6,0 l1,7 Z M72,6 l1,-7 l6,0 l-2,7 Z M82,8 l4,-6 l5,3 l-4,5 Z', fill: art, 'class': 'cp-ves' }));
    g.appendChild(S('path', { d: 'M60,52 C62,40 70,30 82,26 L88,36 C80,40 74,48 72,56 Z', fill: vein, 'class': 'cp-ves' }));   // pulmonary trunk
    g.appendChild(S('ellipse', { cx: 24, cy: 54, rx: 15, ry: 17, fill: musc, 'class': 'cp-ves' }));                          // right atrium
    g.appendChild(S('path', { d: 'M88,42 C98,40 104,46 100,54 C96,58 90,56 88,52 Z', fill: musc, 'class': 'cp-ves' }));      // left auricle
    g.appendChild(S('path', { d: 'M22,62 C20,48 34,42 52,46 C70,42 92,44 100,58 C108,76 100,100 84,112 C72,121 60,122 52,116 C36,104 24,84 22,62 Z', fill: musc, 'class': 'cp-ves' }));
    g.appendChild(S('path', { d: 'M70,48 C72,70 66,94 56,116', 'class': 'cp-sulcus' }));
    g.appendChild(S('path', { d: 'M70,48 C72,70 66,94 56,116', 'class': 'cp-coronary' }));
    g.appendChild(S('ellipse', { cx: 44, cy: 70, rx: 9, ry: 14, transform: 'rotate(-20 44 70)', 'class': 'cp-sheen' }));
    return g;
  }
  function pump(c, env, pic){
    var W = 360, H = 170, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H }), cap;
    var my = picAnim, red = reducedMotion();
    if(pic.edv){
      var edv = env[pic.edv], esv = env[pic.esv];
      // cavity area follows volume: full scale at the larger of EDV and 160 mL
      var full = Math.max(edv, 160), kE = Math.sqrt(edv / full), kS = Math.sqrt(Math.max(0, esv) / full);
      var cx = 96, top = 36, cw = 58, ch = 104;
      var musc = grad(svg, 'r', [[0, 'var(--cp-muscle-hi)'], [0.75, 'var(--cp-muscle)'], [1, 'var(--cp-muscle-dk)']], { cx: 0.4, cy: 0.35, r: 0.8 });
      var bloodG = grad(svg, 'r', [[0, 'var(--cp-blood-hi)'], [1, 'var(--cp-blood)']], { cx: 0.45, cy: 0.3, r: 0.8 });
      // aorta leaving the base, and the left atrium above the mitral valve
      svg.appendChild(S('path', { d: 'M104,30 C104,14 112,6 126,6 L140,6 L140,20 L128,20 C120,20 118,24 118,32 Z', 'class': 'cp-aorta' }));
      svg.appendChild(S('text', { x: 144, y: 17, 'class': 'cp-t' }, 'aorta'));
      svg.appendChild(S('path', { d: 'M58,34 C46,26 48,8 66,6 C80,4 92,10 92,34 Z', 'class': 'cp-atrium' }));
      svg.appendChild(S('text', { x: 46, y: 14, 'text-anchor': 'end', 'class': 'cp-t' }, 'left atrium'));
      // myocardium thickens as the cavity empties
      var outer = S('path', { d: lvPath(cx, top - 4, cw + 30, ch + 22), fill: musc, 'class': 'cp-myo' }); svg.appendChild(outer);
      svg.appendChild(S('path', { d: 'M' + (cx - 44) + ',' + (top - 4) + ' C' + (cx - 30) + ',' + (top + 6) + ' ' + (cx + 30) + ',' + (top + 6) + ' ' + (cx + 44) + ',' + (top - 4) + ' Z', 'class': 'cp-fat' }));
      svg.appendChild(S('path', { d: 'M' + (cx - 30) + ',' + (top + 30) + ' C' + (cx - 28) + ',' + (top + 70) + ' ' + (cx - 16) + ',' + (top + 98) + ' ' + (cx - 4) + ',' + (top + 112), 'class': 'cp-fibre' }));
      svg.appendChild(S('path', { d: 'M' + (cx + 30) + ',' + (top + 30) + ' C' + (cx + 28) + ',' + (top + 70) + ' ' + (cx + 18) + ',' + (top + 98) + ' ' + (cx + 6) + ',' + (top + 112), 'class': 'cp-fibre' }));
      svg.appendChild(S('path', { d: lvPath(cx, top, cw * kE, ch * kE), 'class': 'cp-edv-line', transform: 'translate(0,0)' }));
      var cav = S('path', { d: lvPath(cx, top, cw * kE, ch * kE), fill: bloodG, 'class': 'cp-cav' }); svg.appendChild(cav);
      svg.appendChild(S('path', { d: lvPath(cx, top, cw * kS, ch * kS), 'class': 'cp-esv' }));
      // valves: mitral leaflets at left of the base, aortic at right
      var mitral = S('path', { d: 'M70,33 l8,10 M86,33 l-8,10', 'class': 'cp-valve' }); svg.appendChild(mitral);
      var aortic = S('path', { d: 'M104,33 l5,-6 M118,33 l-5,-6', 'class': 'cp-valve' }); svg.appendChild(aortic);
      svg.appendChild(S('text', { x: cx, y: H - 2, 'text-anchor': 'middle', 'class': 'cp-t' }, 'left ventricle'));
      function setK(k){ cav.setAttribute('d', lvPath(cx, top, cw * k, ch * k)); }
      if(!red){ var t0 = null; requestAnimationFrame(function f(ts){ if(my !== picAnim) return; if(t0 == null) t0 = ts; var u = ((ts - t0) / 1100) % 1, e = u < 0.4 ? 1 - Math.sin(u / 0.4 * Math.PI / 2) : Math.sin((u - 0.4) / 0.6 * Math.PI / 2); setK(kS + (kE - kS) * e);
        var sys = u < 0.4; mitral.setAttribute('d', sys ? 'M70,33 l8,4 M86,33 l-8,4' : 'M70,33 l3,11 M86,33 l-3,11'); aortic.setAttribute('d', sys ? 'M104,33 l1,-9 M118,33 l-1,-9' : 'M104,33 l7,-3 M118,33 l-7,-3'); requestAnimationFrame(f); }); }
      else setK(kS);
      var bx = 206, bw = 136, by = 38;
      svg.appendChild(S('text', { x: bx, y: by - 10, 'class': 'cp-t' }, 'Each beat, of ' + val(c, env, pic.edv) + ' mL'));
      var f1 = clamp(env[pic.sv] / edv, 0, 1);
      svg.appendChild(S('rect', { x: bx, y: by, width: bw, height: 20, rx: 10, 'class': 'cp-bar-bg' }));
      var segG = grad(svg, 'l', [[0, 'var(--cp-art-hi)'], [1, 'var(--cp-art)']], { x1: 0, y1: 0, x2: 0, y2: 1 });
      svg.appendChild(S('rect', { x: bx, y: by, width: Math.max(0, bw * f1), height: 20, rx: 10, fill: segG }));
      svg.appendChild(S('rect', { x: bx + 3, y: by + 3, width: Math.max(0, bw * f1 - 6), height: 5, rx: 2.5, 'class': 'cp-gloss' }));
      svg.appendChild(S('text', { x: bx, y: by + 40, 'class': 'cp-v' }, 'SV ' + val(c, env, pic.sv) + ' mL ejected'));
      svg.appendChild(S('text', { x: bx, y: by + 58, 'class': 'cp-v cp-mut' }, 'ESV ' + val(c, env, pic.esv) + ' mL stays'));
      svg.appendChild(S('text', { x: bx, y: by + 90, 'class': 'cp-v cp-huge' }, 'EF ' + val(c, env, pic.ef) + '%'));
      cap = 'The ventricle fills to ' + val(c, env, pic.edv) + ' mL (thin outline) and squeezes down to ' + val(c, env, pic.esv) + ' mL (dashed). It ejects <b>' + val(c, env, pic.sv) + ' mL</b>, <b>' + val(c, env, pic.ef) + '%</b> of what it held.';
    } else {
      var hr = env[pic.hr], sv = env[pic.sv], co = env[pic.co];
      var hg = S('g', { transform: 'translate(20,22)' }); svg.appendChild(hg);
      var heart = heartArt(svg); hg.appendChild(heart);
      svg.appendChild(S('text', { x: 75, y: H - 6, 'text-anchor': 'middle', 'class': 'cp-v' }, fmt(hr, 0) + ' beats/min'));
      var jx = 214, jy = 34, jw = 74, jh = 112, cap10 = Math.max(10, Math.ceil(co / 5) * 5);
      // a tube from the aorta into the jug, with blood moving along it
      var pipe = 'M114,34 C150,4 196,6 222,30';
      svg.appendChild(S('path', { d: pipe, 'class': 'cp-pipe' }));
      var stream = S('path', { d: pipe, 'class': 'cp-stream' }); svg.appendChild(stream);
      var jugD = 'M' + jx + ',' + jy + ' L' + (jx - 8) + ',' + (jy - 8) + ' L' + (jx + 4) + ',' + (jy - 6) + ' L' + (jx + jw) + ',' + (jy - 6) + ' L' + (jx + jw - 4) + ',' + (jy + jh - 8) + ' Q' + (jx + jw - 5) + ',' + (jy + jh) + ' ' + (jx + jw - 12) + ',' + (jy + jh) + ' L' + (jx + 10) + ',' + (jy + jh) + ' Q' + (jx + 3) + ',' + (jy + jh) + ' ' + (jx + 3) + ',' + (jy + jh - 8) + ' Z';
      svg.appendChild(S('path', { d: 'M' + (jx + jw - 2) + ',' + (jy + 14) + ' C' + (jx + jw + 22) + ',' + (jy + 14) + ' ' + (jx + jw + 22) + ',' + (jy + 66) + ' ' + (jx + jw - 4) + ',' + (jy + 66), 'class': 'cp-handle' }));
      svg.appendChild(S('path', { d: jugD, 'class': 'cp-glass' }));
      var liq = grad(svg, 'l', [[0, 'var(--cp-art-hi)'], [1, 'var(--cp-art)']], { x1: 0, y1: 0, x2: 0, y2: 1 });
      var lg = S('g', { 'clip-path': clipOf(svg, S('path', { d: jugD })) }); svg.appendChild(lg);
      var lvl = S('rect', { x: jx - 10, width: jw + 20, fill: liq }); lg.appendChild(lvl);
      var men = S('ellipse', { cx: jx + jw / 2, rx: jw / 2 + 4, ry: 3, 'class': 'cp-meniscus' }); lg.appendChild(men);
      for(var m = 5; m < cap10; m += 5){ var yy = jy + jh - jh * m / cap10; svg.appendChild(S('line', { x1: jx + 4, x2: jx + 16, y1: yy, y2: yy, 'class': 'cp-grad' })); svg.appendChild(S('text', { x: jx + 19, y: yy + 3.5, 'class': 'cp-tick' }, m + ' L')); }
      svg.appendChild(S('path', { d: 'M' + (jx + jw - 14) + ',' + (jy + 4) + ' L' + (jx + jw - 17) + ',' + (jy + jh - 14), 'class': 'cp-shine' }));
      svg.appendChild(S('path', { d: jugD, 'class': 'cp-glass-edge' }));
      svg.appendChild(S('text', { x: jx + jw / 2, y: H - 8, 'text-anchor': 'middle', 'class': 'cp-t' }, 'in 1 min: ' + fmt(co, 2) + ' L'));
      function setLvl(f){ var h = jh * clamp(f * co / cap10, 0, 1), top2 = jy + jh - h; lvl.setAttribute('y', top2.toFixed(1)); lvl.setAttribute('height', (h + 2).toFixed(1)); men.setAttribute('cy', top2.toFixed(1)); men.style.display = h > 1 ? '' : 'none'; }
      if(!red && hr > 0){
        var period = 60000 / hr, t1 = null;
        requestAnimationFrame(function f(ts){ if(my !== picAnim) return; if(t1 == null) t1 = ts; var el = ts - t1, ph = (el % period) / period;
          var s = 1 + (ph < 0.15 ? 0.06 * Math.sin(ph / 0.15 * Math.PI) : 0);
          heart.setAttribute('transform', 'translate(60,62) scale(' + s.toFixed(3) + ') translate(-60,-62)');
          stream.style.strokeDashoffset = String(-(el / 18) % 40);
          // the jug shows one minute of output filling in 6 s (10x speed), a stroke volume per beat
          var beats = Math.floor(el / (period / 10)); setLvl(Math.min(1, beats / hr)); if(beats >= hr + 6) t1 = ts; requestAnimationFrame(f); });
      } else setLvl(1);
      cap = 'Each beat adds one stroke volume (' + fmt(sv, 0) + ' mL); ' + fmt(hr, 0) + ' beats in a minute fill the jug to <b>' + fmt(co, 2) + ' L</b> (the jug runs at ten times speed).';
    }
    return { svg: svg, cap: cap };
  }
  function stack(c, env, pic){
    var W = 360, rowH = 50, H = pic.bars.length * rowH + 22, L = 10, R = 350, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H });
    function v(sg){ return sg.expr ? evaluate(sg.expr, env) : env[sg.key]; }
    var max = 0;
    pic.bars.forEach(function(b){ var t = 0; b.segs.forEach(function(sg){ t += Math.max(0, v(sg)); }); max = Math.max(max, t); });
    if(!(max > 0)) max = 1;
    var gloss = grad(svg, 'l', [[0, '#fff', 0.28], [0.5, '#fff', 0.05], [1, '#000', 0.08]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    // a light scale under the bars
    var step = Math.pow(10, Math.floor(Math.log10(max))); if(max / step < 3) step /= 2; if(max / step > 7) step *= 2;
    for(var t = 0; t <= max + 1e-9; t += step){ var gx = L + t / max * (R - L); svg.appendChild(S('line', { x1: gx, x2: gx, y1: 22, y2: H - 16, 'class': 'cp-grid' })); svg.appendChild(S('text', { x: gx, y: H - 4, 'text-anchor': t === 0 ? 'start' : gx > R - 20 ? 'end' : 'middle', 'class': 'cp-tick' }, fmt(t, step < 1 ? 1 : 0))); }
    pic.bars.forEach(function(b, i){
      var y = 6 + i * rowH, x = L, tot = 0, bh = 24, by = y + 18;
      svg.appendChild(S('text', { x: L, y: y + 11, 'class': 'cp-t' }, b.label));
      var segs = b.segs.filter(function(sg){ return v(sg) > 0; }), totW = 0;
      segs.forEach(function(sg){ totW += Math.max(0, v(sg)) / max * (R - L); });
      var clip = clipOf(svg, S('rect', { x: L, y: by, width: Math.max(0.5, totW), height: bh, rx: 7 }));
      var g = S('g', { 'clip-path': clip }); svg.appendChild(g);
      b.segs.forEach(function(sg){
        var w = Math.max(0, v(sg)) / max * (R - L);
        tot += Math.max(0, v(sg));
        g.appendChild(S('rect', { x: x, y: by, width: Math.max(0, w), height: bh, 'class': 'cp-seg tone-' + sg.tone }));
        if(w > 1.5 && x + w < L + totW - 0.5) g.appendChild(S('rect', { x: x + w - 1, y: by, width: 2, height: bh, 'class': 'cp-gap' }));
        var txt = sg.label + ' ' + fmt(v(sg), dpOf(c, sg.key));
        if(w > txt.length * 6.2 + 10) svg.appendChild(S('text', { x: x + 7, y: by + 16, 'class': 'cp-in-t' }, txt));
        else if(w > 34) svg.appendChild(S('text', { x: x + 5, y: by + 16, 'class': 'cp-in-t' }, fmt(v(sg), dpOf(c, sg.key))));
        x += w;
      });
      g.appendChild(S('rect', { x: L, y: by, width: Math.max(0, totW), height: bh, fill: gloss, 'pointer-events': 'none' }));
      svg.appendChild(S('text', { x: R, y: y + 11, 'text-anchor': 'end', 'class': 'cp-v' }, fmt(tot, dpOf(c, b.segs[0].key)) + ' ' + pic.unit));
    });
    var key = '<span class="cp-key">' + pic.bars.map(function(b){ return b.segs.map(function(sg){ return '<span><i class="cp-sw tone-' + sg.tone + '"></i>' + esc(sg.label) + ' <b>' + fmt(v(sg), dpOf(c, sg.key)) + '</b></span>'; }).join(''); }).join('') + '</span>';
    return { svg: svg, cap: 'Drawn to one scale, in ' + esc(pic.unit) + ': ' + key };
  }

  /* ------------------------------------------------------ practice mode */

  function pickValue(inp){
    var g = inp.gen;
    if(!g) return inp['default'];
    if(g.choices) return g.choices[Math.floor(Math.random() * g.choices.length)];
    var lo = g[0], hi = g[1], step = g[2] || 1;
    var n = Math.floor((hi - lo) / step + 1e-9);
    var v = lo + step * Math.floor(Math.random() * (n + 1));
    var d = String(step).indexOf('.') > -1 ? String(step).split('.')[1].length : 0;
    return +v.toFixed(d);
  }
  function newProblem(){
    var c = current, pr = c.practice, tries = 0, vals, r;
    do{
      vals = {};
      c.inputs.forEach(function(inp){ vals[inp.key] = pickValue(inp); });
      r = compute(c, vals);
      tries++;
    } while(tries < 300 && (r.invalid || (pr.require && !truthy(pr.require, r.env))));
    var ask = pr.asks[Math.floor(Math.random() * pr.asks.length)];
    problem = { values: vals, env: r.env, ask: ask, done: false, sign: 1 };
  }

  function parseAnswer(s){
    s = String(s || '').replace(/[−–—]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
    if(!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return parseFloat(s);
  }

  function renderPractice(){
    var c = current, body = app.querySelector('.calc-body'), p = problem, ask = p.ask;
    var st = window.AnpCore ? window.AnpCore.toolStats(KIND) : { by: {} };
    var mine = (st.by || {})[c.id];
    body.innerHTML =
      '<p class="calc-record">' + (mine && mine.n ? 'Your practice record here: ' + mine.c + ' of ' + mine.n + ' correct.' : 'Answer, then see the full worked solution.') + '</p>' +
      '<div class="calc-problem">' +
        '<p class="calc-prompt">' + fill(c, ask.prompt, p.env) + '</p>' +
        '<form class="calc-answer" novalidate>' +
          '<label for="calc-ans" class="calc-label">Your answer</label>' +
          '<div class="calc-input-row">' +
            (ask.signed ? '<button type="button" class="calc-sign" aria-label="Sign: ' + (p.sign > 0 ? 'positive. Select to make it negative.' : 'negative. Select to make it positive.') + '" data-sign="' + p.sign + '">' + (p.sign > 0 ? '+' : '−') + '</button>' : '') +
            '<input id="calc-ans" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="calc-ans-u">' +
            '<span class="calc-unit" id="calc-ans-u">' + esc(ask.unit) + '</span>' +
          '</div>' +
          '<div class="calc-actions"><button type="submit" class="btn-press sm calc-check">Check</button> <button type="button" class="btn-outline calc-skip">New problem</button></div>' +
          '<p class="calc-msg" role="status" aria-live="polite"></p>' +
        '</form>' +
      '</div>' +
      '<div class="calc-feedback" aria-live="polite"></div>';
    var form = body.querySelector('.calc-answer'), input = body.querySelector('#calc-ans');
    var sign = body.querySelector('.calc-sign');
    if(sign) sign.addEventListener('click', function(){
      p.sign = -p.sign;
      sign.textContent = p.sign > 0 ? '+' : '−';
      sign.setAttribute('data-sign', p.sign);
      sign.setAttribute('aria-label', 'Sign: ' + (p.sign > 0 ? 'positive. Select to make it negative.' : 'negative. Select to make it positive.'));
    });
    body.querySelector('.calc-skip').addEventListener('click', function(){ newProblem(); renderPractice(); focusAnswer(); });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(p.done){ newProblem(); renderPractice(); focusAnswer(); return; }
      var v = parseAnswer(input.value);
      var msg = body.querySelector('.calc-msg');
      if(!isFinite(v)){ msg.textContent = 'Enter a number, digits only (for example 12.5).'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      input.setAttribute('aria-invalid', 'false');
      msg.textContent = '';
      if(sign && p.sign < 0 && v > 0) v = -v;
      grade(v);
    });
  }
  function focusAnswer(){ var i = app.querySelector('#calc-ans'); if(i) i.focus(); }

  function grade(v){
    var c = current, p = problem, ask = p.ask;
    var ans = p.env[ask.key];
    var tol = Math.max((ask.tol && ask.tol.abs) || 0, ((ask.tol && ask.tol.rel) || 0) * Math.abs(ans));
    var ok = Math.abs(v - ans) <= tol + 1e-9;
    // A signed answer with the wrong sign is wrong however close the size.
    if(ask.signed && ans !== 0 && v !== 0 && (v > 0) !== (ans > 0)) ok = false;
    p.done = true;
    var showKey = ask.show || ask.key;
    var shown = fmt(p.env[showKey], dpOf(c, showKey), ask.signed ? '+' : '');
    var id = itemId(c);
    if(window.AnpCore) window.AnpCore.toolResult(KIND, [{ id: id, correct: ok, topic: c.topic, core: c.core, level: c.level, diff: c.diff, group: c.id }]);
    if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(ok); }catch(e){}
    var body = app.querySelector('.calc-body');
    body.querySelectorAll('.calc-answer input, .calc-sign').forEach(function(x){ x.disabled = true; });
    body.querySelector('.calc-check').textContent = 'Next problem';
    body.querySelector('.calc-skip').hidden = true;
    var yours = fmt(v, Math.max(dpOf(c, showKey), decimalsIn(v)), ask.signed ? '+' : '');
    var near = !ok && Math.abs(v - ans) <= 3 * tol + 1e-9;
    var sizeRight = ask.signed && !ok && Math.abs(Math.abs(v) - Math.abs(ans)) <= tol + 1e-9;
    body.querySelector('.calc-feedback').innerHTML =
      '<div class="calc-verdict ' + (ok ? 'ok' : 'no') + '"><p><span class="anp-verdict">' + (ok ? 'Correct.' : 'Not quite.') + '</span> ' +
        'The answer is <b>' + shown + ' ' + esc(ask.unit) + '</b>' + (ok ? '.' : '; you entered ' + yours + ' ' + esc(ask.unit) + '.') +
        (sizeRight ? ' The size is right but the sign is not: check which pressures push fluid out and which pull it in.' : near ? ' That is close: check your rounding in the steps below.' : '') +
        (ok ? '' : ' It is in your review queue.') + '</p>' +
      '</div>' +
      (c.picture ? '<figure class="calc-pic" aria-label="Live picture"></figure>' : '') +
      solutionHtml(c, p.env, 'Worked solution') +
      '<div class="calc-report">' + (window.LevlReport ? window.LevlReport.button('anp', id) : '') + '</div>';
    if(c.picture){ baseEnv = null; var dv = {}; c.inputs.forEach(function(inp){ dv[inp.key] = inp['default']; }); var b0 = compute(c, dv); if(!b0.invalid) baseEnv = b0.env; drawPicture(c, p.env); }
    if(window.AnpToolKit) window.AnpToolKit.strip(body.querySelector('.calc-feedback'), { topic: c.topic, text: c.title + ' ' + c.intro });
    var s = window.AnpCore ? window.AnpCore.toolStats(KIND) : null, mine = s && s.by ? s.by[c.id] : null;
    if(mine) body.querySelector('.calc-record').textContent = 'Your practice record here: ' + mine.c + ' of ' + mine.n + ' correct.';
    body.querySelector('.calc-check').focus();
  }
  function decimalsIn(v){ var s = String(v); return s.indexOf('.') > -1 ? Math.min(3, s.split('.')[1].length) : 0; }

  /* ------------------------------------------------------ load */

  app.classList.add('calc-loading');
  fetch(src).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    DATA = d;
    app.classList.remove('calc-loading');
    mount();
  }).catch(function(){
    app.classList.remove('calc-loading');
    app.innerHTML = '<p class="calc-invalid">The calculators could not load. Check your connection and reload the page.</p>';
  });
})();
