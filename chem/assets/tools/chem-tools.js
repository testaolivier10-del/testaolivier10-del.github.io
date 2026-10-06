/* AP® Chemistry tool framework: what every simulator, skills tool and drill
   page shares (docs/apchem-architecture.md, "Tools"; the standards in
   docs/anp-tools-contract.md). A tool is one script (chem/assets/tools/<slug>.js)
   plus one data file (chem/data/tools/<slug>.json); the generator serves a
   filtered copy at assets/tool-data/<slug>.json (only items whose topic is
   published) and points #app[data-src] at it.

     ApChemTools.mount(slug, fn)   load the data; fn(app, data) when the tool
                                  is live, else say which unit it arrives with
     Controls (real form elements, 44 px targets, visible values):
       slider({ id, label, min, max, step, value, unit, decimals, onInput })
         <input type=range> with its value shown and -/+ buttons
       choiceSelect({ id, label, options: [{ value, label }], value, onChange })
       announcer(el) -> say(text): a polite live region, debounced
     Pictures and tables:
       plot(spec) -> accessible SVG string (axes, grid, curves, points, bars,
         error bars; role="img" with a label); dataTable(cols, rows, caption)
     Questions and the mini FRQ:
       questions(host, items, stimuli, slug)  ApChemQuestions, recorded here
       frq(host, frq, slug)                   rubric self-score + sample answer
     Skills problems:
       skillTool(app, data, { slug, kind, decorate })  practice (seeded) and
         authored problems; auto-checked parts; worked solution after Check
     Recording: record(slug, items) -> ApChemCore.toolResult, so every item
       (id "<tool>:<content>:<item>") reaches mastery and the review queue. */
(function(){
  'use strict';
  var M = window.ApChemMath, Q = window.ApChemQuestions;
  var uid = 0, unitMap = {};
  function nid(p){ return (p || 'bt') + '-' + (++uid); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function F(x, d){ var s = M.fixed(x, d == null ? 2 : d); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function core(){ return window.ApChemCore; }
  function base(){ return window.ApChemBase || '../'; }
  function report(id){ return window.LevlReport ? '<span class="bt-report">' + window.LevlReport.button('apchem', id) + '</span>' : ''; }
  function event(name, data){ try{ core() && core().event(name, data); }catch(e){} }

  /* ------------------------------------------------------- mounting */
  function mount(slug, fn){
    var app = document.getElementById('app');
    if(!app) return;
    var src = app.getAttribute('data-src');
    app.classList.add('bt-app');
    app.innerHTML = '<p class="bt-loading">Loading the tool…</p>';
    fetch(src).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(data){
      if(!data.live){
        app.innerHTML = '<p class="chem-soon">This tool arrives with ' + esc(data.arrives || 'its unit') + '. Meanwhile, read the <a href="' + base() + 'learn.html">free notes</a>.</p>';
        return;
      }
      app.innerHTML = '';
      unitMap = data.units || {};
      if(data.status === 'placeholder') app.insertAdjacentHTML('beforeend', '<p class="bt-draft"><b>Draft content.</b> These scenarios are waiting for review by a chemistry teacher. Spot a problem? Use Report a problem.</p>');
      fn(app, data);
    }).catch(function(){
      app.innerHTML = '<p class="chem-soon" role="alert">The tool could not load. Check your connection and reload the page.</p>';
    });
  }

  /* ------------------------------------------------------- controls */
  function decimalsOf(step){ var s = String(step); return s.indexOf('.') < 0 ? 0 : s.length - s.indexOf('.') - 1; }
  function slider(o){
    var id = o.id || nid('sl'), d = o.decimals != null ? o.decimals : decimalsOf(o.step || 1);
    var el = document.createElement('div');
    el.className = 'bt-ctl bt-slider';
    var txt = function(v){ return F(v, d) + (o.unit ? ' ' + o.unit : ''); };
    el.innerHTML = '<label for="' + id + '">' + esc(o.label) + '</label>' +
      '<div class="bt-slider-row"><button type="button" class="bt-step" data-d="-1" aria-label="Decrease ' + esc(o.label.toLowerCase()) + '">−</button>' +
      '<input type="range" id="' + id + '" min="' + o.min + '" max="' + o.max + '" step="' + o.step + '" value="' + o.value + '">' +
      '<button type="button" class="bt-step" data-d="1" aria-label="Increase ' + esc(o.label.toLowerCase()) + '">+</button>' +
      '<output for="' + id + '" class="bt-out" aria-hidden="true"></output></div>' + (o.hint ? '<p class="bt-hint">' + o.hint + '</p>' : '');
    var input = el.querySelector('input'), out = el.querySelector('output');
    function show(){ var v = +input.value; out.textContent = txt(v); input.setAttribute('aria-valuetext', txt(v)); }
    function set(v, fire){
      v = Math.min(o.max, Math.max(o.min, Math.round(v / o.step) * o.step));
      input.value = String(M.round(v, d + 2)); show();
      if(fire && o.onInput) o.onInput(+input.value);
    }
    input.addEventListener('input', function(){ show(); if(o.onInput) o.onInput(+input.value); });
    el.querySelectorAll('.bt-step').forEach(function(b){
      b.addEventListener('click', function(){ set(+input.value + (+b.getAttribute('data-d')) * o.step, true); });
    });
    show();
    return { el: el, input: input, value: function(){ return +input.value; }, set: set,
      disable: function(off){ input.disabled = off; el.querySelectorAll('button').forEach(function(b){ b.disabled = off; }); el.classList.toggle('is-off', !!off); } };
  }
  function choiceSelect(o){
    var id = o.id || nid('sel');
    var el = document.createElement('div');
    el.className = 'bt-ctl bt-select';
    el.innerHTML = '<label for="' + id + '">' + esc(o.label) + '</label><select id="' + id + '">' + o.options.map(function(x){
      return '<option value="' + esc(x.value) + '"' + (String(x.value) === String(o.value) ? ' selected' : '') + '>' + esc(x.label) + '</option>';
    }).join('') + '</select>';
    var s = el.querySelector('select');
    s.addEventListener('change', function(){ if(o.onChange) o.onChange(s.value); });
    return { el: el, select: s, value: function(){ return s.value; }, set: function(v){ s.value = v; } };
  }
  function announcer(el){
    var t = null;
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('role', 'status');
    return function(text, now){
      clearTimeout(t);
      if(now){ el.textContent = text; return; }
      t = setTimeout(function(){ el.textContent = text; }, 450);
    };
  }

  /* ---------------------------------------------------------- plots */
  /* spec: { w, h, title, x: { label, unit, min, max, step, categories }, y: {...},
     curves: [{ cls, points: [[x, y]], dashed }], points: [{ x, y, cls, square, err }],
     bars: [{ name, value, err, cls }], vline: { x, cls, label } }
     Returns an SVG string: role="img" with an aria-label summarizing it. */
  function ticks(a){
    var out = [], st = a.step;
    for(var v = Math.ceil(a.min / st - 1e-9) * st; v <= a.max + 1e-9; v += st) out.push(M.round(v, 6));
    return out;
  }
  function plot(s){
    var W = s.w || 560, H = s.h || 330, L = 66, R = 16, T = 16, B = 56;
    var pw = W - L - R, ph = H - T - B;
    var cats = s.x.categories;
    var sx = cats ? function(i){ return L + pw * (i + 0.5) / cats.length; } : function(v){ return L + (v - s.x.min) / (s.x.max - s.x.min) * pw; };
    var sy = function(v){ return T + ph - (v - s.y.min) / (s.y.max - s.y.min) * ph; };
    var clampY = function(v){ return Math.max(T, Math.min(T + ph, sy(v))); };
    var p = [];
    ticks(s.y).forEach(function(v){ p.push('<line class="grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + sy(v).toFixed(1) + '" y2="' + sy(v).toFixed(1) + '"/><text class="tick" x="' + (L - 7) + '" y="' + (sy(v) + 4).toFixed(1) + '" text-anchor="end">' + F(v, decimalsOf(s.y.step)) + '</text>'); });
    if(cats) cats.forEach(function(c, i){ p.push('<text class="tick" x="' + sx(i).toFixed(1) + '" y="' + (T + ph + 18) + '" text-anchor="middle">' + esc(c) + '</text>'); });
    else ticks(s.x).forEach(function(v){ p.push('<line class="grid" y1="' + T + '" y2="' + (T + ph) + '" x1="' + sx(v).toFixed(1) + '" x2="' + sx(v).toFixed(1) + '"/><text class="tick" x="' + sx(v).toFixed(1) + '" y="' + (T + ph + 18) + '" text-anchor="middle">' + F(v, decimalsOf(s.x.step)) + '</text>'); });
    if(s.y.min < 0 && s.y.max > 0) p.push('<line class="zero" x1="' + L + '" x2="' + (L + pw) + '" y1="' + sy(0).toFixed(1) + '" y2="' + sy(0).toFixed(1) + '"/>');
    p.push('<line class="axis" x1="' + L + '" y1="' + (T + ph) + '" x2="' + (L + pw) + '" y2="' + (T + ph) + '"/><line class="axis" x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (T + ph) + '"/>');
    if(s.vline) p.push('<line class="vline ' + (s.vline.cls || '') + '" x1="' + sx(s.vline.x).toFixed(1) + '" x2="' + sx(s.vline.x).toFixed(1) + '" y1="' + T + '" y2="' + (T + ph) + '"/>');
    (s.bars || []).forEach(function(b, i){
      var bw = Math.min(70, pw / cats.length * 0.55), x = sx(i) - bw / 2, y0 = sy(Math.max(0, s.y.min)), y1 = sy(b.value);
      p.push('<rect class="bar ' + (b.cls || 's1') + '" x="' + x.toFixed(1) + '" y="' + Math.min(y0, y1).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.abs(y1 - y0).toFixed(1) + '"/>');
      if(b.err) p.push(errBar(sx(i), clampY(b.value + b.err), clampY(b.value - b.err)));
    });
    (s.curves || []).forEach(function(c){
      if(!c.points.length) return;
      p.push('<polyline class="series ' + (c.cls || 's1') + (c.dashed ? ' dashed' : '') + '" points="' + c.points.map(function(q){ return sx(q[0]).toFixed(1) + ',' + clampY(q[1]).toFixed(1); }).join(' ') + '"/>');
    });
    (s.points || []).forEach(function(q){
      var x = cats ? sx(q.x) : sx(q.x), y = sy(q.y);
      if(q.err) p.push(errBar(x, clampY(q.y + q.err), clampY(q.y - q.err)));
      p.push(q.square ? '<rect class="pt ' + (q.cls || 's2') + '" x="' + (x - 4.5).toFixed(1) + '" y="' + (y - 4.5).toFixed(1) + '" width="9" height="9"/>' : '<circle class="pt ' + (q.cls || 's2') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5"/>');
    });
    var lab = function(a){ return esc(a.label + (a.unit ? ' (' + a.unit + ')' : '')); };
    p.push('<text class="lbl" x="' + (L + pw / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + lab(s.x) + '</text>');
    p.push('<text class="lbl" transform="translate(15 ' + (T + ph / 2) + ') rotate(-90)" text-anchor="middle">' + lab(s.y) + '</text>');
    return '<svg class="chem-svg bt-plot" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(s.title || 'Graph') + '">' + p.join('') + '</svg>';
  }
  function errBar(x, y1, y2){ return '<path class="err" d="M' + x.toFixed(1) + ' ' + y1.toFixed(1) + 'V' + y2.toFixed(1) + 'M' + (x - 6).toFixed(1) + ' ' + y1.toFixed(1) + 'h12M' + (x - 6).toFixed(1) + ' ' + y2.toFixed(1) + 'h12"/>'; }
  function niceMax(v){ if(v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))); var ms = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < ms.length; i++) if(v <= ms[i] * p + 1e-9) return ms[i] * p; return 10 * p; }
  function niceStep(span, n){ var raw = span / (n || 5), p = Math.pow(10, Math.floor(Math.log10(raw))); var ms = [1, 2, 2.5, 5, 10]; for(var i = 0; i < ms.length; i++) if(raw <= ms[i] * p + 1e-9) return ms[i] * p; return 10 * p; }
  function wrapTable(inner, label){ return '<div class="table-wrap" tabindex="0" role="region" aria-label="' + esc(label || 'Data table') + '">' + inner + '</div>'; }
  function dataTable(cols, rows, caption){
    return wrapTable('<table class="chem-data">' + (caption ? '<caption>' + caption + '</caption>' : '') + '<thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function(r){ return '<tr>' + r.map(function(v, i){ return i === 0 ? '<th scope="row">' + v + '</th>' : '<td>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>', caption ? String(caption).replace(/<[^>]+>/g, '') : 'Table: ' + cols.join(', ').replace(/<[^>]+>/g, ''));
  }
  function wrapTables(html){ return String(html).replace(/<table\b[\s\S]*?<\/table>/g, function(t){ var c = /<caption>([\s\S]*?)<\/caption>/.exec(t); return wrapTable(t, c ? c[1].replace(/<[^>]+>/g, '') : 'Data table'); }); }
  function box(title, html, open){
    return '<details class="bt-how"' + (open ? ' open' : '') + '><summary>' + esc(title) + '</summary><div class="bt-how-body">' + wrapTables(html) + '</div></details>';
  }

  /* ------------------------------------------------------ recording */
  /* The generator writes data.units (topic -> unit or skills chapter) into
     every served tool file, so a record carries its unit even before the
     curriculum lists the topic. */
  function unitOf(it){ return it.unit || unitMap[it.topic] || (core() && core().unitOf ? core().unitOf(it.topic) : ''); }
  function record(slug, items, extra){
    var c = core();
    if(!c || !c.toolResult) return;
    c.toolResult(slug, items.map(function(it){
      return { id: it.id, correct: !!it.correct, topic: it.topic, unit: unitOf(it), practice: it.practice, level: it.level || 'apply', diff: it.diff || 2, group: it.group };
    }), extra);
  }

  /* -------------------------------------------- stimulus questions */
  /* Items use the question bank format (docs/apchem-architecture.md) with
     ids "<tool>:<content>:<n>". They are graded and explained by
     ApChemQuestions and recorded here, so the tool's tally counts them. */
  function stimulusOf(s){
    var tabs = (s.tables || (s.table ? [s.table] : [])).map(function(t){ return dataTable(t.cols, t.rows, t.caption); }).join('');
    return { kind: s.kind, title: s.title, html: (s.text || '') + tabs + (s.html ? wrapTables(s.html) : '') };
  }
  function questions(host, items, stimuli, slug){
    var st = {};
    Object.keys(stimuli || {}).forEach(function(k){ st[k] = stimulusOf(stimuli[k]); });
    var list = items.map(function(q){ var c = Object.assign({}, q); c.unit = unitOf(q); return c; });
    Q.hydrate(host, list, { record: false, onAnswer: function(res){
      var q = res.q;
      record(slug, [{ id: q.id, correct: res.correct, topic: q.topic, unit: q.unit, practice: q.practice, level: q.level, diff: q.diff, group: 'questions' }]);
      event('apchem-tool-question', { tool: slug, correct: !!res.correct });
    } }, st);
  }

  /* --------------------------------------------------- the mini FRQ */
  /* frq: { id, title, intro, stimulus?, parts: [{ label, prompt, points,
     practice, rubric: [{ point, accept: [] }], sample }], topic }. The same
     part format as data/frq/<id>.json. The student writes, then opens the
     rubric, ticks the points earned and sees a sample answer. Each part is
     recorded as one item, right when every point in it was ticked. */
  function frq(host, f, slug){
    var key = 'apchem_frqdraft_' + slug + '_' + f.id;
    var saved = {};
    try{ saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; }catch(e){ saved = {}; }
    var total = f.parts.reduce(function(n, p){ return n + p.points; }, 0);
    var hid = nid('frq');
    var sec = document.createElement('section');
    sec.className = 'bt-frq';
    sec.setAttribute('aria-labelledby', hid);
    sec.innerHTML = '<h2 id="' + hid + '">' + esc(f.title || 'Mini free-response question') + ' <small>' + total + ' points</small></h2>' +
      (f.intro ? '<div class="bt-frq-intro">' + wrapTables(f.intro) + '</div>' : '') +
      f.parts.map(function(p, k){
        var tid = hid + '-a' + k;
        return '<div class="bt-frq-part" data-k="' + k + '"><p class="bt-frq-prompt"><b>(' + esc(p.label) + ')</b> ' + p.prompt + ' <span class="bt-pts">' + p.points + ' point' + (p.points === 1 ? '' : 's') + '</span></p>' +
          '<label for="' + tid + '" class="bt-small">Your answer to part (' + esc(p.label) + ')</label><textarea id="' + tid + '" rows="4">' + esc(saved[k] || '') + '</textarea><div class="bt-frq-score"></div></div>';
      }).join('') +
      '<div class="bt-actions"><button type="button" class="btn-press sm bt-frq-show">Show the rubric and a sample answer</button></div><div class="bt-frq-total" role="status" aria-live="polite"></div>';
    host.appendChild(sec);
    sec.querySelectorAll('textarea').forEach(function(t, k){
      t.addEventListener('input', function(){ saved[k] = t.value; try{ localStorage.setItem(key, JSON.stringify(saved)); }catch(e){} });
    });
    var show = sec.querySelector('.bt-frq-show'), tot = sec.querySelector('.bt-frq-total');
    show.addEventListener('click', function(){
      show.disabled = true;
      f.parts.forEach(function(p, k){
        var box = sec.querySelector('.bt-frq-part[data-k="' + k + '"] .bt-frq-score');
        box.innerHTML = '<fieldset class="bt-rubric"><legend>Rubric for part (' + esc(p.label) + '): tick each point your answer earns</legend>' +
          p.rubric.map(function(r, j){ var cid = hid + '-r' + k + '-' + j; return '<div class="bt-check-row"><input type="checkbox" id="' + cid + '" data-k="' + k + '"><label for="' + cid + '">' + r.point + (r.accept && r.accept.length ? '<span class="bt-accept">Also accept: ' + r.accept.join('; ') + '</span>' : '') + '</label></div>'; }).join('') +
          '</fieldset><div class="bt-sample"><p class="bt-sample-k">Sample full-credit answer</p>' + p.sample + '</div>';
      });
      sec.querySelector('.bt-actions').innerHTML = '<button type="button" class="btn-press sm bt-frq-save">Save my score</button>' + report(slug + ':' + f.id + ':frq');
      var boxes = sec.querySelectorAll('.bt-rubric input');
      function count(){ var n = 0; boxes.forEach(function(b){ if(b.checked) n++; }); return n; }
      boxes.forEach(function(b){ b.addEventListener('change', function(){ tot.textContent = 'Your score: ' + count() + ' of ' + total + ' points.'; }); });
      tot.textContent = 'Your score: 0 of ' + total + ' points. Tick the points your answer earns.';
      var first = sec.querySelector('.bt-rubric input'); if(first) first.focus();
      sec.querySelector('.bt-frq-save').addEventListener('click', function(){
        var items = f.parts.map(function(p, k){
          var mine = sec.querySelectorAll('.bt-rubric input[data-k="' + k + '"]'), got = 0;
          mine.forEach(function(b){ if(b.checked) got++; });
          return { id: slug + ':' + f.id + ':' + p.label, correct: got === p.rubric.length, topic: p.topic || f.topic, unit: f.unit, practice: p.practice, level: 'analyze', diff: 3, group: 'frq' };
        });
        record(slug, items);
        event('apchem-tool-frq', { tool: slug, score: count(), total: total });
        this.disabled = true;
        tot.textContent = 'Saved: ' + count() + ' of ' + total + ' points. Parts you did not earn in full are in your review queue.';
      });
    });
  }

  /* -------------------------------------------------- skills problems */
  function seedFromUrl(){
    try{ var m = /[?&#]seed=(\d+)/.exec(location.search + location.hash); if(m) return +m[1]; }catch(e){}
    return 0;
  }
  function freshSeed(){ return 10000 + Math.floor(Math.random() * 89999); }
  /* A part's answer field (number) or option list (choice). */
  function partHtml(p, pid){
    if(p.type === 'choice'){
      return '<fieldset class="bt-part bt-part-choice" data-key="' + p.key + '"><legend>' + esc(p.label) + '</legend>' + p.options.map(function(o, i){
        var id = pid + '-' + i;
        return '<div class="bt-radio"><input type="radio" name="' + pid + '" id="' + id + '" value="' + i + '"><label for="' + id + '">' + esc(o) + '</label></div>';
      }).join('') + '<div class="bt-part-fb"></div></fieldset>';
    }
    var hint = 'Round to ' + p.d + ' decimal place' + (p.d === 1 ? '' : 's') + '.';
    return '<div class="bt-part bt-part-num" data-key="' + p.key + '"><label for="' + pid + '">' + esc(p.label) + (p.unit ? ' <span class="bt-unit">(' + esc(p.unit) + ')</span>' : '') + '</label>' +
      '<span class="bt-num-row"><input type="text" id="' + pid + '" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="' + pid + '-h"></span>' +
      '<span class="bt-small" id="' + pid + '-h">' + (p.d === 0 ? 'A whole number.' : hint) + '</span><div class="bt-part-fb"></div></div>';
  }
  function gradePart(p, el){
    if(p.type === 'choice'){
      var c = el.querySelector('input:checked');
      var pick = c ? +c.value : -1;
      return { answered: pick > -1, correct: pick === p.correct, shown: p.options[p.correct] };
    }
    var raw = el.querySelector('input').value, x = Q.parseNumber(raw);
    return { answered: !isNaN(x), correct: !isNaN(x) && Math.abs(x - p.answer) <= p.tol + 1e-9, shown: F(p.answer, p.d) + (p.unit ? ' ' + p.unit : '') };
  }
  function skillTool(app, data, o){
    var P = window.ApChemProblems, slug = o.slug, kind = o.kind;
    var contexts = data.contexts || [], problems = data.problems || [];
    var mode = contexts.length ? 'practice' : 'set', seed = seedFromUrl() || freshSeed(), at = 0;
    var gid = nid('sk');
    app.insertAdjacentHTML('beforeend',
      (data.intro ? '<div class="bt-intro">' + data.intro + '</div>' : '') +
      (data.howItWorks ? box(data.howItWorksTitle || 'The formulas and how this tool checks you', data.howItWorks) : '') +
      '<fieldset class="bt-modes"><legend>Problems</legend>' +
        (contexts.length ? '<div class="bt-radio"><input type="radio" name="' + gid + '-m" id="' + gid + '-mp" value="practice"' + (mode === 'practice' ? ' checked' : '') + '><label for="' + gid + '-mp">Practice: new numbers every time</label></div>' : '') +
        (problems.length ? '<div class="bt-radio"><input type="radio" name="' + gid + '-m" id="' + gid + '-ms" value="set"' + (mode === 'set' ? ' checked' : '') + '><label for="' + gid + '-ms">Worked set: ' + problems.length + ' fixed problem' + (problems.length === 1 ? '' : 's') + '</label></div>' : '') +
      '</fieldset><section class="bt-problem" aria-labelledby="' + gid + '-h"></section>');
    var area = app.querySelector('.bt-problem');
    app.querySelectorAll('.bt-modes input').forEach(function(r){ r.addEventListener('change', function(){ mode = r.value; at = 0; draw(true); }); });

    function current(){
      if(mode === 'set'){ var pr = problems[at]; return { input: pr.input, topic: pr.topic, unit: pr.unit, cid: pr.id, title: 'Problem ' + (at + 1) + ' of ' + problems.length, text: pr.text || pr.input.text }; }
      var r = M.rng(seed), ctx = r.pick(contexts), input = P.generate[kind](r, ctx);
      return { input: input, topic: ctx.topic, unit: ctx.unit, cid: ctx.id, title: 'Practice problem', code: seed, text: input.text };
    }
    function draw(focus){
      var cur = current(), sol = P.solve[kind](cur.input), done = false;
      area.innerHTML = '<div class="bt-prob-head"><h2 id="' + gid + '-h">' + esc(cur.title) + '</h2>' + (cur.code ? '<p class="bt-code">Problem code <b>' + cur.code + '</b> <a href="?seed=' + cur.code + '">Link to this problem</a></p>' : '') + '</div>' +
        '<div class="bt-context">' + (cur.text || '') + '</div>' + (sol.table ? wrapTables(sol.table) : '') +
        (sol.chart && o.chart ? '<div class="bt-chart">' + o.chart(sol.chart, cur.input) + '</div>' : '') +
        '<form class="bt-parts" novalidate>' + sol.parts.map(function(p, i){ return partHtml(p, gid + '-p' + i); }).join('') +
        '<div class="bt-actions"><button type="submit" class="btn-press sm">Check answers</button></div></form>' +
        '<div class="bt-result" role="status" aria-live="polite"></div><div class="bt-solution" hidden></div>' +
        '<div class="bt-next"></div>';
      if(o.decorate) o.decorate(area, cur.input, sol);
      var form = area.querySelector('form');
      form.addEventListener('submit', function(e){
        e.preventDefault();
        if(done) return;
        var res = sol.parts.map(function(p, i){ return gradePart(p, form.querySelector('[data-key="' + p.key + '"]')); });
        var blank = res.filter(function(x){ return !x.answered; }).length;
        if(blank === res.length){ area.querySelector('.bt-result').textContent = 'Answer at least one part first.'; return; }
        done = true;
        var right = 0;
        sol.parts.forEach(function(p, i){
          var el = form.querySelector('[data-key="' + p.key + '"]'), r = res[i];
          if(r.correct) right++;
          el.classList.add(r.correct ? 'is-right' : 'is-wrong');
          el.querySelectorAll('input').forEach(function(x){ if(x.type === 'text') x.readOnly = true; else x.disabled = true; });
          el.querySelector('.bt-part-fb').innerHTML = '<span class="chem-mark ' + (r.correct ? 'ok">Correct' : 'no">' + (r.answered ? 'Not quite' : 'Not answered')) + '</span>' + (r.correct ? '' : ' <span class="bt-key">Answer: ' + esc(r.shown) + '</span>');
        });
        form.querySelector('.bt-actions').innerHTML = report(slug + ':' + cur.cid);
        var solEl = area.querySelector('.bt-solution');
        solEl.hidden = false;
        solEl.innerHTML = '<h3>Worked solution</h3><ol class="bt-steps">' + sol.steps.map(function(s){ return '<li>' + wrapTables(s) + '</li>'; }).join('') + '</ol>';
        area.querySelector('.bt-result').textContent = right + ' of ' + sol.parts.length + ' parts right. The worked solution follows.';
        record(slug, sol.parts.map(function(p, i){
          return { id: slug + ':' + cur.cid + ':' + p.key, correct: res[i].correct, topic: (data.partTopics && data.partTopics[p.key]) || cur.topic, practice: p.practice, level: 'apply', diff: 2, group: p.key };
        }));
        event('apchem-skill-check', { tool: slug, correct: right, total: sol.parts.length });
        var nx = area.querySelector('.bt-next');
        nx.innerHTML = mode === 'practice' ? '<button type="button" class="btn-press sm bt-again">New problem</button>'
          : (at < problems.length - 1 ? '<button type="button" class="btn-press sm bt-again">Next problem</button>' : '<p>That is the whole set. Switch to Practice for new numbers.</p>');
        var again = nx.querySelector('.bt-again');
        if(again) again.addEventListener('click', function(){ if(mode === 'practice') seed = freshSeed(); else at++; draw(true); });
        solEl.querySelector('h3').setAttribute('tabindex', '-1');
        solEl.querySelector('h3').focus();
      });
      if(focus){ var h = area.querySelector('h2'); h.setAttribute('tabindex', '-1'); h.focus(); }
    }
    draw(false);
  }

  window.ApChemTools = {
    esc: esc, F: F, nid: nid, mount: mount, slider: slider, choiceSelect: choiceSelect, announcer: announcer,
    plot: plot, niceMax: niceMax, niceStep: niceStep, dataTable: dataTable, wrapTables: wrapTables, box: box,
    record: record, report: report, event: event, questions: questions, frq: frq, skillTool: skillTool,
    gradePart: gradePart, partHtml: partHtml, unitOf: unitOf
  };
})();
