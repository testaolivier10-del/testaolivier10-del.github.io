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
        if(mode === 'practice' && !problem) newProblem();
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
  function tube(c, env, pic){
    var W = 360, H = 150, x0 = 46, x1 = 314, cy = 72, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var be = baseEnv || env;
    var rr = pic.r ? env[pic.r] : pic.rRes ? Math.pow(be[pic.rRes] / env[pic.rRes], 0.25) : 1;
    var rr0 = pic.r ? 1 : 1;
    rr = clamp(isFinite(rr) ? rr : 1, 0.08, 3);
    var R0 = 22, rad = clamp(R0 * rr, 2.5, 50);
    // normal outline for comparison
    if(Math.abs(rr - 1) > 0.02) svg.appendChild(S('rect', { x: x0, y: cy - R0, width: x1 - x0, height: 2 * R0, rx: 4, 'class': 'cp-ghost' }));
    svg.appendChild(S('rect', { x: x0, y: cy - rad, width: x1 - x0, height: 2 * rad, rx: Math.min(4, rad), 'class': 'cp-tube' }));
    var flow = env[pic.flow], bflow = be[pic.flow] || 1;
    // particle speed: velocity = flow / area, relative to the default
    var speed = clamp((flow / bflow) / (rr * rr / (rr0 * rr0)), 0, 40);
    var g = S('g', { 'clip-path': null }); svg.appendChild(g);
    var n = Math.round(clamp(10 * rr, 3, 18)), dots = [];
    for(var i = 0; i < n; i++){ var d = S('circle', { r: clamp(rad * 0.18, 1.6, 4), 'class': 'cp-dot' }); g.appendChild(d); dots.push({ el: d, x: x0 + (x1 - x0) * ((i * 0.618) % 1), y: cy + (((i * 0.37) % 1) - 0.5) * rad * 1.3 }); }
    function place(){ dots.forEach(function(d){ d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', d.y.toFixed(1)); }); }
    place();
    if(!reducedMotion() && speed > 0){
      var my = picAnim, last = null;
      requestAnimationFrame(function f(ts){
        if(my !== picAnim) return;
        var dt = last == null ? 0 : Math.min(50, ts - last); last = ts;
        dots.forEach(function(d){ d.x += speed * 0.06 * dt; if(d.x > x1 - 3) d.x = x0 + 3 + (d.x - x1 + 3) % 20; });
        place(); requestAnimationFrame(f);
      });
    }
    // gauges
    function gauge(x, key, label){
      var v = env[key], a = clamp(v / 200, 0, 1) * Math.PI;
      svg.appendChild(S('circle', { cx: x, cy: 22, r: 15, 'class': 'cp-gauge' }));
      svg.appendChild(S('line', { x1: x, y1: 22, x2: x - 11 * Math.cos(a), y2: 22 - 11 * Math.sin(a), 'class': 'cp-needle' }));
      svg.appendChild(S('line', { x1: x, y1: 37, x2: x, y2: cy - rad, 'class': 'cp-stem' }));
      svg.appendChild(S('text', { x: x + (x < W / 2 ? -19 : 19), y: 20, 'text-anchor': x < W / 2 ? 'end' : 'start', 'class': 'cp-t' }, label));
      svg.appendChild(S('text', { x: x + (x < W / 2 ? -19 : 19), y: 34, 'text-anchor': x < W / 2 ? 'end' : 'start', 'class': 'cp-v' }, val(c, env, key)));
    }
    if(pic.pin) gauge(x0 + 26, pic.pin, 'in');
    if(pic.pout) gauge(x1 - 26, pic.pout, 'out');
    svg.appendChild(S('path', { d: 'M' + (x1 + 6) + ',' + cy + ' l14,0 m-6,-6 l6,6 l-6,6', 'class': 'cp-arrow' }));
    svg.appendChild(S('text', { x: (x0 + x1) / 2, y: H - 14, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, 'Flow ' + val(c, env, pic.flow) + ' ' + pic.flowUnit));
    var rtxt = pic.r ? 'radius ' + Math.round(rr * 100) + '% of before' : pic.rRes ? 'resistance ' + val(c, env, pic.rRes) : '';
    if(rtxt) svg.appendChild(S('text', { x: (x0 + x1) / 2, y: cy - Math.max(rad, R0) - 8, 'text-anchor': 'middle', 'class': 'cp-t' }, rtxt));
    var cap = (pic.pin && pic.pout ? 'Pressure falls from ' + val(c, env, pic.pin) + ' to ' + val(c, env, pic.pout) + ' mm Hg along the tube. ' : '') +
      (pic.r ? 'The radius is ' + Math.round(rr * 100) + '% of before, so resistance is ' + fmt(1 / Math.pow(rr, 4), 2) + ' times and flow ' + fmt(Math.pow(rr, 4), 2) + ' times what it was. ' : '') +
      'Flow: <b>' + val(c, env, pic.flow) + ' ' + esc(pic.flowUnit) + '</b>. The dots move at flow ÷ cross-section, so a narrow tube carries its smaller flow faster through it.';
    return { svg: svg, cap: cap };
  }
  function wave(c, env, pic){
    var W = 360, H = 150, L = 44, R = 300, T = 14, B = 128, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var sbp = env[pic.sbp], dbp = env[pic.dbp], top = Math.max(160, Math.ceil((sbp + 15) / 20) * 20);
    function y(v){ return B - v / top * (B - T); }
    for(var t = 0; t <= top; t += top > 200 ? 50 : 40){ svg.appendChild(S('line', { x1: L, x2: R, y1: y(t), y2: y(t), 'class': 'cp-grid' })); svg.appendChild(S('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end', 'class': 'cp-tick' }, String(t))); }
    // schematic arterial trace: fast upstroke, dicrotic notch, slow fall
    function shape(u){ if(u < 0.13){ var a = u / 0.13; return a * a * (3 - 2 * a); } if(u < 0.34) return 1 - 0.38 * (u - 0.13) / 0.21; if(u < 0.38) return 0.62 - 0.06 * Math.sin((u - 0.34) / 0.04 * Math.PI); return 0.56 * Math.pow(1 - (u - 0.38) / 0.62, 1.4); }
    var d = '';
    for(var i = 0; i <= 200; i++){ var u = i / 100, ph = u % 1; d += (i ? ' L' : 'M') + (L + (R - L) * u / 2).toFixed(1) + ',' + y(dbp + (sbp - dbp) * Math.max(0, shape(ph))).toFixed(1); }
    svg.appendChild(S('path', { d: d, 'class': 'cp-wave' }));
    function hl(v, label, cls){ svg.appendChild(S('line', { x1: L, x2: R, y1: y(v), y2: y(v), 'class': 'cp-hl ' + cls })); svg.appendChild(S('text', { x: R + 4, y: y(v) + 4, 'class': 'cp-t ' + cls }, label + ' ' + fmt(v, 0))); }
    hl(sbp, 'SBP', 'cp-sys'); hl(dbp, 'DBP', 'cp-dia');
    if(pic.map) hl(env[pic.map], 'MAP', 'cp-map');
    if(pic.avg) svg.appendChild(S('line', { x1: L, x2: R, y1: y(env[pic.avg]), y2: y(env[pic.avg]), 'class': 'cp-hl cp-avg' }));
    if(pic.pp){ var px = L + (R - L) * 0.07; svg.appendChild(S('path', { d: 'M' + px + ',' + y(dbp) + ' L' + px + ',' + y(sbp), 'class': 'cp-span' })); svg.appendChild(S('text', { x: px + 6, y: (y(sbp) + y(dbp)) / 2 + 4, 'class': 'cp-v' }, 'PP ' + fmt(env[pic.pp], 0))); }
    svg.appendChild(S('text', { x: 10, y: (T + B) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 10 ' + (T + B) / 2 + ')', 'class': 'cp-tick' }, 'mm Hg'));
    var cap = 'Two heartbeats of arterial pressure between ' + fmt(dbp, 0) + ' and ' + fmt(sbp, 0) + ' mm Hg (the trace shape is schematic). ' +
      (pic.map ? 'MAP sits about a third of the way up, <b>' + fmt(env[pic.map], 0) + ' mm Hg</b>, below the plain average (dashed, ' + fmt(env[pic.avg], 0) + '), because the pressure spends most of each beat near diastolic.' : 'The pulse pressure, <b>' + fmt(env[pic.pp], 0) + ' mm Hg</b>, is the height of each pulse.');
    return { svg: svg, cap: cap };
  }
  function balance(c, env, pic){
    var W = 360, H = 190, cy = 96, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(S('rect', { x: 20, y: cy - 16, width: 230, height: 32, rx: 16, 'class': 'cp-cap' }));
    svg.appendChild(S('text', { x: 135, y: cy + 5, 'text-anchor': 'middle', 'class': 'cp-t' }, pic.where === 'glomerulus' ? 'glomerular capillary' : 'capillary'));
    var all = pic.out.concat(pic['in']), max = Math.max.apply(null, all.map(function(f){ return Math.abs(env[f.key]); }).concat([20]));
    var sc = 46 / max;
    function arrow(x, v, dir, label, cls, i){
      var len = Math.abs(v) * sc, up = (dir === 'out') === (v >= 0);
      var y0 = dir === 'out' ? cy - 18 : cy + 18;
      // outward forces point away from the vessel (up), inward ones toward it
      var ya, yb;
      if(dir === 'out'){ ya = y0; yb = y0 - len; if(v < 0){ ya = y0 - len; yb = y0; } }
      else { ya = y0 + len + 2; yb = y0 + 2; if(v < 0){ ya = y0 + 2; yb = y0 + len + 2; } }
      if(len > 1) svg.appendChild(S('path', { d: 'M' + x + ',' + ya + ' L' + x + ',' + yb + ' m-5,' + (yb < ya ? 7 : -7) + ' l5,' + (yb < ya ? -7 : 7) + ' l5,' + (yb < ya ? 7 : -7), 'class': 'cp-force ' + cls }));
      var ty = dir === 'out' ? Math.min(ya, yb) - 6 : Math.max(ya, yb) + 13;
      svg.appendChild(S('text', { x: x, y: ty, 'text-anchor': 'middle', 'class': 'cp-v ' + cls }, label.split(' ')[0] + ' ' + fmt(v, 0)));
    }
    pic.out.forEach(function(f, i){ arrow(60 + i * 70, env[f.key], 'out', f.label, 'cp-out', i); });
    pic['in'].forEach(function(f, i){ arrow(60 + i * 70 + (pic.out.length > 1 ? 35 : 70), env[f.key], 'in', f.label, 'cp-in', i); });
    var net = env[pic.net], nl = clamp(Math.abs(net) * sc, 0, 60), nx = 300;
    svg.appendChild(S('text', { x: nx, y: 20, 'text-anchor': 'middle', 'class': 'cp-t' }, 'net'));
    if(nl > 1){ var a = net > 0 ? cy - 4 : cy - 4 - nl, b2 = net > 0 ? cy - 4 - nl : cy - 4; svg.appendChild(S('path', { d: 'M' + nx + ',' + a + ' L' + nx + ',' + b2 + ' m-7,' + (net > 0 ? 9 : -9) + ' l7,' + (net > 0 ? -9 : 9) + ' l7,' + (net > 0 ? 9 : -9), 'class': 'cp-force cp-net' + (net > 0 ? ' cp-out' : ' cp-in') })); }
    svg.appendChild(S('text', { x: nx, y: cy + 26, 'text-anchor': 'middle', 'class': 'cp-v cp-big' }, fmt(net, 0) + ' mm Hg'));
    svg.appendChild(S('text', { x: nx, y: cy + 42, 'text-anchor': 'middle', 'class': 'cp-t' }, net > 0 ? 'filtration (out)' : net < 0 ? 'reabsorption (in)' : 'no net movement'));
    var cap = 'Arrows above the vessel are pressures moving fluid out; below, pressures moving it back in; length is size. Net: <b>' + fmt(net, 0) + ' mm Hg</b>, ' + (net > 0 ? 'so fluid filters out.' : net < 0 ? 'so fluid moves in.' : 'so there is no net movement.');
    return { svg: svg, cap: cap };
  }
  function pump(c, env, pic){
    var W = 360, H = 150, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H }), cap;
    var my = picAnim, red = reducedMotion();
    if(pic.edv){
      var edv = env[pic.edv], esv = env[pic.esv], k = 52 / Math.sqrt(Math.max(edv, 160));
      var rE = Math.sqrt(edv) * k, rS = Math.sqrt(Math.max(0, esv)) * k, cx = 100, cy = 78;
      svg.appendChild(S('ellipse', { cx: cx, cy: cy, rx: rE * 0.8, ry: rE, 'class': 'cp-full' }));
      var inner = S('ellipse', { cx: cx, cy: cy, rx: rS * 0.8, ry: rS, 'class': 'cp-blood' }); svg.appendChild(inner);
      svg.appendChild(S('ellipse', { cx: cx, cy: cy, rx: rS * 0.8, ry: rS, 'class': 'cp-esv' }));
      if(!red){ var t0 = null; requestAnimationFrame(function f(ts){ if(my !== picAnim) return; if(t0 == null) t0 = ts; var u = ((ts - t0) / 1100) % 1, e = u < 0.4 ? 1 - Math.sin(u / 0.4 * Math.PI / 2) : Math.sin((u - 0.4) / 0.6 * Math.PI / 2); var r = rS + (rE - rS) * e; inner.setAttribute('rx', (r * 0.8).toFixed(1)); inner.setAttribute('ry', r.toFixed(1)); requestAnimationFrame(f); }); }
      else { inner.setAttribute('rx', rE * 0.8); inner.setAttribute('ry', rE); }
      var bx = 210, bw = 120, by = 40;
      svg.appendChild(S('text', { x: bx, y: by - 12, 'class': 'cp-t' }, 'Each beat'));
      svg.appendChild(S('rect', { x: bx, y: by, width: bw, height: 18, rx: 4, 'class': 'cp-bar-bg' }));
      svg.appendChild(S('rect', { x: bx, y: by, width: bw * clamp(env[pic.sv] / edv, 0, 1), height: 18, rx: 4, 'class': 'cp-seg tone-o2' }));
      svg.appendChild(S('text', { x: bx, y: by + 34, 'class': 'cp-v' }, 'SV ' + val(c, env, pic.sv) + ' mL ejected'));
      svg.appendChild(S('text', { x: bx, y: by + 52, 'class': 'cp-v' }, 'ESV ' + val(c, env, pic.esv) + ' mL stays'));
      svg.appendChild(S('text', { x: bx, y: by + 78, 'class': 'cp-v cp-big' }, 'EF ' + val(c, env, pic.ef) + '%'));
      cap = 'The ventricle fills to ' + val(c, env, pic.edv) + ' mL (outer outline) and squeezes down to ' + val(c, env, pic.esv) + ' mL (inner). It ejects <b>' + val(c, env, pic.sv) + ' mL</b>, <b>' + val(c, env, pic.ef) + '%</b> of what it held.';
    } else {
      var hr = env[pic.hr], sv = env[pic.sv], co = env[pic.co];
      var heart = S('path', { d: 'M70,58 c0,-18 -24,-22 -30,-6 c-6,-16 -30,-12 -30,6 c0,20 30,34 30,42 c0,-8 30,-22 30,-42z', transform: 'translate(30,8) scale(1.15)', 'class': 'cp-heart' });
      svg.appendChild(heart);
      svg.appendChild(S('text', { x: 75, y: 140, 'text-anchor': 'middle', 'class': 'cp-v' }, fmt(hr, 0) + ' beats/min'));
      var jx = 200, jy = 18, jw = 70, jh = 110, cap10 = Math.max(10, Math.ceil(co / 5) * 5);
      svg.appendChild(S('rect', { x: jx, y: jy, width: jw, height: jh, rx: 6, 'class': 'cp-jug' }));
      var lvl = S('rect', { x: jx + 2, width: jw - 4, rx: 4, 'class': 'cp-seg tone-o2' }); svg.appendChild(lvl);
      for(var m = 5; m < cap10; m += 5){ var yy = jy + jh - jh * m / cap10; svg.appendChild(S('line', { x1: jx, x2: jx + 10, y1: yy, y2: yy, 'class': 'cp-stem' })); svg.appendChild(S('text', { x: jx - 4, y: yy + 4, 'text-anchor': 'end', 'class': 'cp-tick' }, m + ' L')); }
      svg.appendChild(S('text', { x: jx + jw + 8, y: jy + 14, 'class': 'cp-t' }, 'in 1 min'));
      svg.appendChild(S('text', { x: jx + jw + 8, y: jy + 32, 'class': 'cp-v cp-big' }, fmt(co, 2) + ' L'));
      function setLvl(f){ var h = (jh - 4) * clamp(f * co / cap10, 0, 1); lvl.setAttribute('y', (jy + jh - 2 - h).toFixed(1)); lvl.setAttribute('height', h.toFixed(1)); }
      if(!red && hr > 0){
        var period = 60000 / hr, t1 = null;
        requestAnimationFrame(function f(ts){ if(my !== picAnim) return; if(t1 == null) t1 = ts; var el = ts - t1, ph = (el % period) / period;
          heart.setAttribute('transform', 'translate(30,8) scale(' + (1.15 * (1 + (ph < 0.15 ? 0.08 * Math.sin(ph / 0.15 * Math.PI) : 0))).toFixed(3) + ')');
          // the jug shows one minute of output filling in 6 s (10x speed), a stroke volume per beat
          var beats = Math.floor(el / (period / 10)); setLvl(Math.min(1, beats / hr)); if(beats >= hr + 6) t1 = ts; requestAnimationFrame(f); });
      } else setLvl(1);
      cap = 'Each beat adds one stroke volume (' + fmt(sv, 0) + ' mL); ' + fmt(hr, 0) + ' beats in a minute fill the jug to <b>' + fmt(co, 2) + ' L</b> (the jug runs at ten times speed).';
    }
    return { svg: svg, cap: cap };
  }
  function stack(c, env, pic){
    var W = 360, rowH = 46, H = pic.bars.length * rowH + 10, L = 10, R = 350, svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H });
    function v(sg){ return sg.expr ? evaluate(sg.expr, env) : env[sg.key]; }
    var max = 0;
    pic.bars.forEach(function(b){ var t = 0; b.segs.forEach(function(sg){ t += Math.max(0, v(sg)); }); max = Math.max(max, t); });
    if(!(max > 0)) max = 1;
    var parts = [];
    pic.bars.forEach(function(b, i){
      var y = 6 + i * rowH, x = L, tot = 0;
      svg.appendChild(S('text', { x: L, y: y + 11, 'class': 'cp-t' }, b.label));
      b.segs.forEach(function(sg){
        var w = Math.max(0, v(sg)) / max * (R - L);
        tot += Math.max(0, v(sg));
        svg.appendChild(S('rect', { x: x, y: y + 16, width: Math.max(0, w - 1), height: 22, rx: 3, 'class': 'cp-seg tone-' + sg.tone }));
        var txt = sg.label + ' ' + fmt(v(sg), dpOf(c, sg.key));
        if(w > txt.length * 6.2 + 8) svg.appendChild(S('text', { x: x + 5, y: y + 31, 'class': 'cp-in-t' }, txt));
        else if(w > 34) svg.appendChild(S('text', { x: x + 4, y: y + 31, 'class': 'cp-in-t' }, fmt(v(sg), dpOf(c, sg.key))));
        parts.push(sg.label + ' ' + fmt(v(sg), dpOf(c, sg.key)));
        x += w;
      });
      if(b.segs.length > 1) svg.appendChild(S('text', { x: R, y: y + 11, 'text-anchor': 'end', 'class': 'cp-v' }, fmt(tot, dpOf(c, b.segs[0].key)) + ' ' + pic.unit));
      else svg.appendChild(S('text', { x: R, y: y + 11, 'text-anchor': 'end', 'class': 'cp-v' }, fmt(tot, dpOf(c, b.segs[0].key)) + ' ' + pic.unit));
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
            (ask.signed ? '<button type="button" class="calc-sign" aria-label="Sign: positive. Select to make it negative." data-sign="1">+</button>' : '') +
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
