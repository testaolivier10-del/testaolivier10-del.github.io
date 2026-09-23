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
        '<nav class="calc-pick" aria-label="Choose a calculator"></nav>' +
        '<section class="calc-card" aria-live="off"></section>' +
      '</div>';
    var pick = app.querySelector('.calc-pick');
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
    var want = (location.hash || '').replace(/^#/, '');
    var last = null; try{ last = localStorage.getItem(PREF); }catch(e){}
    var first = byId(want) ? want : byId(last) ? last : DATA.calculators[0].id;
    select(first, false);
    window.addEventListener('hashchange', function(){ var h = location.hash.replace(/^#/, ''); if(byId(h) && (!current || current.id !== h)) select(h, false); });
  }
  function byId(id){ if(!id) return null; for(var i = 0; i < DATA.calculators.length; i++) if(DATA.calculators[i].id === id) return DATA.calculators[i]; return null; }

  function select(id, focus){
    current = byId(id); mode = 'calc'; problem = null;
    values = {};
    current.inputs.forEach(function(inp){ values[inp.key] = inp['default']; });
    app.querySelectorAll('.calc-chip').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-id') === id ? 'true' : 'false'); });
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

  function renderBody(){ if(mode === 'calc') renderCalc(); else renderPractice(); }

  /* ------------------------------------------------------ calculate mode */

  function inputId(key){ return 'calc-in-' + current.id + '-' + key; }

  function renderCalc(){
    var c = current, body = app.querySelector('.calc-body');
    body.innerHTML =
      ((c.presets || []).length ? '<div class="calc-presets" role="group" aria-label="Load an example"><span class="calc-presets-h">Try:</span>' + c.presets.map(function(p, i){
        return '<button type="button" class="calc-preset" data-i="' + i + '">' + esc(p.label) + '</button>';
      }).join('') + '</div>' : '') +
      '<div class="calc-grid">' +
        '<form class="calc-inputs" novalidate onsubmit="return false">' + c.inputs.map(function(inp){
          return '<div class="calc-field">' +
            '<label for="' + inputId(inp.key) + '"><span class="calc-label">' + esc(inp.label) + '</span> <span class="calc-sym">' + inp.sym + '</span></label>' +
            '<div class="calc-input-row"><input id="' + inputId(inp.key) + '" type="number" inputmode="decimal" data-key="' + inp.key + '" value="' + esc(values[inp.key]) + '" step="' + (inp.step || 'any') + '" min="' + inp.min + '" max="' + inp.max + '"' + (inp.hint ? ' aria-describedby="' + inputId(inp.key) + '-h"' : '') + '>' +
            (inp.unit ? '<span class="calc-unit">' + esc(inp.unit) + '</span>' : '') + '</div>' +
            (inp.hint ? '<p class="calc-hint" id="' + inputId(inp.key) + '-h">' + esc(inp.hint) + '</p>' : '') +
          '</div>';
        }).join('') + '</form>' +
        '<div class="calc-out" aria-live="polite"></div>' +
      '</div>' +
      '<div class="calc-work"></div>';
    body.querySelectorAll('.calc-preset').forEach(function(b){
      b.addEventListener('click', function(){
        var p = c.presets[+b.getAttribute('data-i')];
        Object.keys(p.values).forEach(function(k){ values[k] = p.values[k]; var el = document.getElementById(inputId(k)); if(el) el.value = p.values[k]; });
        update();
      });
    });
    body.querySelectorAll('.calc-inputs input').forEach(function(el){
      el.addEventListener('input', function(){ update(); });
    });
    update();
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
      out.innerHTML = '<div class="calc-invalid" role="status"><b>Check the numbers.</b> ' + esc(problems.length ? problems[0] : r.invalid) + '</div>';
      work.innerHTML = '';
      return;
    }
    out.innerHTML = resultsHtml(c, r.env);
    work.innerHTML = solutionHtml(c, r.env, 'Every step');
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
      solutionHtml(c, p.env, 'Worked solution') +
      '<div class="calc-report">' + (window.LevlReport ? window.LevlReport.button('anp', id) : '') + '</div>';
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
