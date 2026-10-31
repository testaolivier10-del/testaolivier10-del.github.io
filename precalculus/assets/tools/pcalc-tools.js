/* AP® Precalculus tool framework: what every trainer, skills tool and drill
   page shares (docs/apprecalc-architecture.md, "Tools"; the standards in
   docs/anp-tools-contract.md). Forked from ApPhysTools (docs/apprecalc-spec.md
   decision 1), with an `expr` drill step added. A tool is its script (precalculus/assets/tools/<slug>.js),
   its model (precalculus/assets/tools/math/<slug>.js, ApPrecalcMath.<camelSlug>)
   and its data file (precalculus/data/tools/<slug>.json); the generator serves a
   filtered copy at assets/tool-data/<slug>.json (only items whose topic is
   published) and points #app[data-src] at it. Plots (axes, curves with
   discontinuities, open and closed points, shading, tangent and secant
   lines, draggable points, an animation loop) are in pcalc-plot.js
   (ApPrecalcPlot); math text is ApPrecalcTex (pcalc-math.js).

     ApPrecalcTools.mount(slug, fn)   load the data; fn(app, data) when the tool
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
       questions(host, items, stimuli, slug)  ApPrecalcQuestions, recorded here
       frq(host, frq, slug)                   rubric self-score + sample answer
     Skills problems:
       skillTool(app, data, { slug, kind, decorate })  practice (seeded) and
         authored problems; auto-checked parts; worked solution after Check
     Step drills (seeded, checked step by step with targeted feedback):
       drill(app, data, { slug, generate, types, extra, onVol })
     Explore, then test yourself (apchem decision 21):
       modes(app, { explore(pane), quiz(pane), studio? }) the two-mode switch
       studioPane(pane, studio, { stage, dock, caption, why, details })
       cue(text) "Start here"; moreHtml(inner) "More options"; explain(el, head, body) one line + "Why?"
     Recording: record(slug, items) -> ApPrecalcCore.toolResult, so every item
       (id "<tool>:<content>:<item>") reaches mastery and the review queue.
     Page frame (phone first): frame(app, data, { noun, howTitle }) -> { pick,
       area }: the problem, then the picker row behind "More options", then
       "About this <noun>" (intro and how it works), both closed.
     keepGoing(host, { topic, also }) -> the "Keep going" strip after a graded
       problem: the topic's lesson and notes, its glossary terms (from
       assets/glossary.json), and lessons for any other topic missed. */
(function(){
  'use strict';
  var M = window.ApPrecalcMath, Q = window.ApPrecalcQuestions;
  var uid = 0, unitMap = {};
  function nid(p){ return (p || 'bt') + '-' + (++uid); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* Plain text of a node or an HTML string: each formula reads as its TeX's
     plain reading (ApPrecalcTex.text), never as its MathML plus its annotation. */
  function plainText(node){
    if(typeof node === 'string'){ var d = document.createElement('div'); d.innerHTML = node; node = d; }
    else node = node.cloneNode(true);
    if(node.querySelectorAll) Array.prototype.slice.call(node.querySelectorAll('math')).forEach(function(m){
      var a = m.querySelector('annotation'), tex = a ? a.textContent : '', t;
      if(tex && window.ApPrecalcTex) t = window.ApPrecalcTex.text(tex);
      else { if(a) a.parentNode.removeChild(a); t = m.textContent; }
      m.parentNode.replaceChild(document.createTextNode(' ' + t + ' '), m);
    });
    return node.textContent.replace(/\s+/g, ' ').replace(/ ([.,;:?!)])/g, '$1').trim();
  }
  function F(x, d){ var s = M.fixed(x, d == null ? 2 : d); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function core(){ return window.ApPrecalcCore; }
  function base(){ return window.ApPrecalcBase || '../'; }
  function report(id){ return window.LevlReport ? '<span class="bt-report">' + window.LevlReport.button('apprecalc', id) + '</span>' : ''; }
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
        app.innerHTML = '<p class="pcalc-soon">This tool arrives with ' + esc(data.arrives || 'its unit') + '. Meanwhile, read the <a href="' + base() + 'learn.html">free notes</a>.</p>';
        return;
      }
      app.innerHTML = '';
      unitMap = data.units || {};
      if(data.status === 'placeholder') app.insertAdjacentHTML('beforeend', '<p class="bt-draft"><b>Draft content.</b> These scenarios are waiting for review by a precalculus teacher. Spot a problem? Use Report a problem.</p>');
      // Tool Studio (docs/tools-calm.md): pages.json `studio: true` puts
      // data-studio on #app. modes() and drill() then place their parts in
      // the frame; a trainer's explore view places its own (o.studio).
      var studio = app.getAttribute('data-studio') && window.LevlStudio ? studioFrame(app, slug) : null;
      fn(app, data);
      if(studio) studioRest(app, studio);
    }).catch(function(e){ try{ console.error(e); }catch(x){}
      app.innerHTML = '<p class="pcalc-soon" role="alert">The tool could not load. Check your connection and reload the page.</p>';
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
    // Short outward ticks on both axes, the way a printed figure has them.
    ticks(s.y).forEach(function(v){ p.push('<line class="atick" x1="' + (L - 4) + '" x2="' + L + '" y1="' + sy(v).toFixed(1) + '" y2="' + sy(v).toFixed(1) + '"/>'); });
    if(!cats) ticks(s.x).forEach(function(v){ p.push('<line class="atick" y1="' + (T + ph) + '" y2="' + (T + ph + 4) + '" x1="' + sx(v).toFixed(1) + '" x2="' + sx(v).toFixed(1) + '"/>'); });
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
    return '<svg class="pcalc-svg bt-plot" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(s.title || 'Graph') + '">' + p.join('') + '</svg>';
  }
  function errBar(x, y1, y2){ return '<path class="err" d="M' + x.toFixed(1) + ' ' + y1.toFixed(1) + 'V' + y2.toFixed(1) + 'M' + (x - 6).toFixed(1) + ' ' + y1.toFixed(1) + 'h12M' + (x - 6).toFixed(1) + ' ' + y2.toFixed(1) + 'h12"/>'; }
  function niceMax(v){ if(v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))); var ms = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < ms.length; i++) if(v <= ms[i] * p + 1e-9) return ms[i] * p; return 10 * p; }
  function niceStep(span, n){ var raw = span / (n || 5), p = Math.pow(10, Math.floor(Math.log10(raw))); var ms = [1, 2, 2.5, 5, 10]; for(var i = 0; i < ms.length; i++) if(raw <= ms[i] * p + 1e-9) return ms[i] * p; return 10 * p; }
  function wrapTable(inner, label){ return '<div class="table-wrap" tabindex="0" role="region" aria-label="' + esc(label || 'Data table') + '">' + inner + '</div>'; }
  function dataTable(cols, rows, caption){
    return wrapTable('<table class="pcalc-data">' + (caption ? '<caption>' + caption + '</caption>' : '') + '<thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function(r){ return '<tr>' + r.map(function(v, i){ return i === 0 ? '<th scope="row">' + v + '</th>' : '<td>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>', caption ? String(caption).replace(/<[^>]+>/g, '') : 'Table: ' + cols.join(', ').replace(/<[^>]+>/g, ''));
  }
  function wrapTables(html){ return String(html).replace(/<table\b[\s\S]*?<\/table>/g, function(t){ var c = /<caption>([\s\S]*?)<\/caption>/.exec(t); return wrapTable(t, c ? c[1].replace(/<[^>]+>/g, '') : 'Data table'); }); }
  function box(title, html, open){
    return '<details class="bt-how"' + (open ? ' open' : '') + '><summary>' + esc(title) + '</summary><div class="bt-how-body">' + wrapTables(html) + '</div></details>';
  }

  /* ----------------------------------------------------- page frame */
  /* The interactive piece comes first, so on a phone the problem is on the
     first screen: a one-line picker, the problem, then the intro and the
     how-it-works text in one disclosure below (open from 900 px up). */
  function aboutHtml(data, o){
    if(!data.intro && !data.howItWorks) return '';
    return '<details class="bt-about"><summary>About this ' + esc(o.noun || 'tool') + '</summary><div class="bt-about-body">' +
      (data.intro ? '<div class="bt-intro">' + data.intro + '</div>' : '') +
      (data.howItWorks ? '<h3 class="bt-about-h">' + esc(o.howTitle || 'How it works') + '</h3><div class="bt-how-body">' + wrapTables(data.howItWorks) + '</div>' : '') + '</div></details>';
  }
  function frame(app, data, o){
    o = o || {};
    // The problem first; the kind picker (and any mode radios) behind "More
    // options" right under it, then "About this ..." (closed).
    app.insertAdjacentHTML('beforeend', '<section class="bt-problem cd-problem"' + (o.hid ? ' aria-labelledby="' + o.hid + '"' : '') + '></section>' +
      '<details class="bt-more cd-more" hidden><summary>More options <span class="bt-more-hint">' + esc(o.moreHint || 'choose the kind of problem') + '</span></summary><div class="bt-more-b"><div class="bt-pick cd-pick"></div>' + (o.before || '') + '</div></details>' + aboutHtml(data, o));
    var more = app.querySelector('.cd-more');
    if(o.before) more.hidden = false;
    // Closed at every width: the problem is what a student lands on.
    return { pick: app.querySelector('.bt-pick'), area: app.querySelector('.cd-problem') };
  }

  /* ------------------------------------------- simple first, depth on tap */
  /* cue(text) -> { el, done() }: the one first step, written next to the
     control it names ("Drag the slider to add base"). done() quiets it after
     the first action, so it stays as a label but stops shouting. */
  function cue(text){
    var el = document.createElement('p');
    el.className = 'bt-cue';
    el.innerHTML = '<span class="bt-cue-k">Start here</span> <span class="bt-cue-t">' + text + '</span>';
    return { el: el, done: function(){ el.classList.add('is-done'); } };
  }
  /* moreHtml(inner, hint): the extra settings and notes behind one "More
     options" disclosure (closed), with a short hint of what is inside. */
  function moreHtml(inner, hint){
    return '<details class="bt-more"><summary>More options' + (hint ? ' <span class="bt-more-hint">' + esc(hint) + '</span>' : '') + '</summary><div class="bt-more-b">' + inner + '</div></details>';
  }
  /* explain(el, head, body): one short line in view, the reasoning behind
     "Why?". Redraws keep the same nodes, so an open "Why?" stays open while
     the student keeps dragging. */
  function explain(el, head, body){
    if(!el) return;
    var box = el.querySelector(':scope > .bt-say');
    if(!box){
      el.innerHTML = '<div class="tx-where bt-say"><p class="bt-say-h"></p><details class="bt-why"><summary>Show the reasoning</summary><div class="bt-why-b"></div></details></div>';
      box = el.querySelector('.bt-say');
    }
    Array.prototype.slice.call(el.children).forEach(function(c){ if(c !== box) c.remove(); });
    box.querySelector('.bt-say-h').innerHTML = head;
    var d = box.querySelector('.bt-why');
    d.hidden = !body;
    box.querySelector('.bt-why-b').innerHTML = body || '';
    return box;
  }
  /* A compact "Kind" picker for the frame's pick row: a label and a select
     on one line. */
  function kindPicker(host, o){
    var sel = choiceSelect({ label: o.label || 'Problem type', options: [{ value: '', label: o.mixed || 'Any kind' }].concat(o.options), value: o.value || '', onChange: o.onChange });
    sel.el.classList.add('bt-inline');
    host.appendChild(sel.el);
    var more = host.closest('.bt-more'); if(more) more.hidden = false;
    return sel;
  }

  /* --------------------------------------------------- keep going */
  /* After a graded problem: where to learn the topic, and its words. Links
     only to built pages (ApPrecalcCurriculum topic.built); glossary terms are the
     ones the topic teaches, linked to glossary.html#t-<id>. */
  var glossP = null;
  function glossary(){
    if(!glossP) glossP = (window.LevlGlossary && window.LevlGlossary.load ? window.LevlGlossary.load()
      : fetch(base() + 'assets/glossary.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }));
    return glossP;
  }
  function topicOf(id){
    var C = window.ApPrecalcCurriculum;
    return C && C.topics ? C.topics.filter(function(t){ return t.id === id; })[0] || null : null;
  }
  function keepGoing(host, o){
    if(!host || !o || !o.topic) return null;
    var t = topicOf(o.topic);
    if(!t || !t.built) return null;
    var B = base(), kid = nid('kg');
    var also = (o.also || []).filter(function(x, i, a){ return x && x !== o.topic && a.indexOf(x) === i; }).map(topicOf).filter(function(x){ return x && x.built; });
    var el = document.createElement('aside');
    el.className = 'bt-keep';
    el.setAttribute('aria-labelledby', kid);
    el.innerHTML = '<h3 id="' + kid + '">Keep going</h3><ul class="bt-keep-links">' +
      '<li><a href="' + B + 'lessons/' + t.id + '.html"><span class="bt-keep-k">Lesson</span>' + esc(t.title) + '</a></li>' +
      '<li><a href="' + B + 'notes/' + t.id + '.html"><span class="bt-keep-k">Notes</span>' + esc(t.title) + '</a></li>' +
      also.map(function(a){ return '<li><a href="' + B + 'lessons/' + a.id + '.html"><span class="bt-keep-k">You missed a step on</span>' + esc(a.title) + '</a></li>'; }).join('') +
      '</ul><div class="bt-keep-terms" hidden></div>';
    host.appendChild(el);
    glossary().then(function(d){
      var ids = [o.topic].concat(also.map(function(a){ return a.id; }));
      var terms = (d.terms || []).filter(function(g){ return ids.indexOf(g.topic) > -1; }).slice(0, 5);
      if(!terms.length || !el.isConnected) return;
      var box = el.querySelector('.bt-keep-terms');
      box.innerHTML = '<p class="bt-keep-k">Glossary</p><ul>' + terms.map(function(g){ return '<li><a href="' + B + 'glossary.html#t-' + encodeURIComponent(g.id) + '">' + esc(g.term) + '</a></li>'; }).join('') + '</ul>';
      box.hidden = false;
    }).catch(function(){});
    return el;
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
  /* Items use the question bank format (docs/apprecalc-architecture.md) with
     ids "<tool>:<content>:<n>". They are graded and explained by
     ApPrecalcQuestions and recorded here, so the tool's tally counts them. */
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
      event('apprecalc-tool-question', { tool: slug, correct: !!res.correct });
    } }, st);
  }

  /* --------------------------------------------------- the mini FRQ */
  /* frq: { id, title, intro, stimulus?, parts: [{ label, prompt, points,
     practice, rubric: [{ point, accept: [] }], sample }], topic }. The same
     part format as data/frq/<id>.json. The student writes, then opens the
     rubric, ticks the points earned and sees a sample answer. Each part is
     recorded as one item, right when every point in it was ticked. */
  function frq(host, f, slug){
    var key = 'apprecalc_frqdraft_' + slug + '_' + f.id;
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
        event('apprecalc-tool-frq', { tool: slug, score: count(), total: total });
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
    var P = window.ApPrecalcProblems, slug = o.slug, kind = o.kind;
    var contexts = data.contexts || [], problems = data.problems || [];
    var mode = contexts.length ? 'practice' : 'set', seed = seedFromUrl() || freshSeed(), at = 0;
    var gid = nid('sk');
    var fr = frame(app, data, { noun: 'tool', hid: gid + '-h', howTitle: data.howItWorksTitle || 'The formulas and how this tool checks you',
      before: contexts.length && problems.length ? '<fieldset class="bt-modes"><legend>Problems</legend>' +
        '<div class="bt-radio"><input type="radio" name="' + gid + '-m" id="' + gid + '-mp" value="practice"' + (mode === 'practice' ? ' checked' : '') + '><label for="' + gid + '-mp">Practice: new numbers every time</label></div>' +
        '<div class="bt-radio"><input type="radio" name="' + gid + '-m" id="' + gid + '-ms" value="set"' + (mode === 'set' ? ' checked' : '') + '><label for="' + gid + '-ms">Worked set: ' + problems.length + ' fixed problem' + (problems.length === 1 ? '' : 's') + '</label></div>' +
      '</fieldset>' : '' });
    var area = fr.area;
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
          el.querySelector('.bt-part-fb').innerHTML = '<span class="pcalc-mark ' + (r.correct ? 'ok">Correct' : 'no">' + (r.answered ? 'Not quite' : 'Not answered')) + '</span>' + (r.correct ? '' : ' <span class="bt-key">Answer: ' + esc(r.shown) + '</span>');
        });
        form.querySelector('.bt-actions').innerHTML = report(slug + ':' + cur.cid);
        var solEl = area.querySelector('.bt-solution');
        solEl.hidden = false;
        solEl.innerHTML = '<h3>Worked solution</h3><ol class="bt-steps">' + sol.steps.map(function(s){ return '<li>' + wrapTables(s) + '</li>'; }).join('') + '</ol>';
        area.querySelector('.bt-result').textContent = right + ' of ' + sol.parts.length + ' parts right. The worked solution follows.';
        record(slug, sol.parts.map(function(p, i){
          return { id: slug + ':' + cur.cid + ':' + p.key, correct: res[i].correct, topic: (data.partTopics && data.partTopics[p.key]) || cur.topic, practice: p.practice, level: 'apply', diff: 2, group: p.key };
        }));
        event('apprecalc-skill-check', { tool: slug, correct: right, total: sol.parts.length });
        var nx = area.querySelector('.bt-next');
        nx.innerHTML = mode === 'practice' ? '<button type="button" class="btn-press sm bt-again">New problem</button>'
          : (at < problems.length - 1 ? '<button type="button" class="btn-press sm bt-again">Next problem</button>' : '<p>That is the whole set. Switch to Practice for new numbers.</p>');
        var again = nx.querySelector('.bt-again');
        if(again) again.addEventListener('click', function(){ if(mode === 'practice') seed = freshSeed(); else at++; draw(true); });
        keepGoing(nx, { topic: cur.topic, also: sol.parts.filter(function(p, i){ return !res[i].correct; }).map(function(p){ return data.partTopics && data.partTopics[p.key]; }) });
        solEl.querySelector('h3').setAttribute('tabindex', '-1');
        solEl.querySelector('h3').focus();
      });
      if(focus){ var h = area.querySelector('h2'); h.setAttribute('tabindex', '-1'); h.focus(); }
    }
    draw(false);
  }

  /* ------------------------------------------------- step drills */
  /* drill(app, data, o): the shared page for the seeded step drills
     (derivative rules, Riemann sums, separation of variables). Every
     problem comes from o.generate(rng, context, type), a pure ApPrecalcMath
     generator, so the validator and the page run the same numbers. A
     problem is { ctx, topic, text, steps: [...], solution: [...] }; a step
     is one of
       num    { cell, unit?, d? }          a number, graded by ApPrecalcMath.diagnose
       expr   { cell: exprCell(...), lhs? } a typed expression with a live preview,
                                           graded by evaluation (ApPrecalcMath.diagnoseExpr);
                                           lhs is TeX ("f'(x) =")
       vol    { cell, max }                a volume read off a graph (number + slider)
       row    { row, cells: [cell...] }    one row of an ICE table, a cell per species
       coef   { row, cells: [cell...] }    the change row, typed as −x, +2x, 0
       choice { options, optionsHtml?, picLabel?, correct, fixed?, why: [...] }
       custom { checkLabel? }               drawn and graded by the tool: o.custom(step, api)
                                           -> { html, init(el), check() -> { blank?, msg?, ok, notes? },
                                           reveal(), lock() } (the tangent tracer's sketch of f′)
     Each step is checked on its own; a wrong answer gets the feedback for
     the specific slip it matches and one method hint (step.method, else
     o.method(step, problem)); Show the answer appears from the second wrong
     try, so the hint always comes first. The first try is what is recorded,
     as "<slug>:<context>:<step>".
     Test yourself is visual (docs/tool-audit-2026-10.md X1): every graded
     try calls o.onTry(step, try, api) with try = { ok, shown, value (a
     number step's number), raw (an expr step's text), fn (it as a function
     of the step's first variable, or null), pick (a choice's option index) };
     on Show the answer it is called again with shown: true and the right
     value. A tool draws the student's answer on its figure (dashed, "yours")
     and, once right or shown, the right one beside it; returning true says
     something was drawn, so the feedback points at the picture.
     o.onInput(step, raw, api) runs as an expr step is typed (a live preview).
     o: { slug, generate, types?: [{ value, label }], typeLabel?, contexts?,
     extra(host, problem, api)?, onVol(v, step, api)?, onStep(step, right, api)?,
     onTry?, onInput?, method?, custom?, detailsHtml?, title(problem)?, newLabel? } */
  // Precalculus drills have no ICE "coef" rows; the step kind stays for a tool
  // that wants a row of symbolic cells, parsed by its own model if it has one.
  var parseCoef = function(raw){ return M.parseCoef ? M.parseCoef(raw) : numOf(raw); };
  var coefText = function(x){ return M.coefText ? M.coefText(x) : String(x); };
  function numOf(raw){ return Q.parseNumber(String(raw || '').replace(/%\s*$/, '')); }
  function shownNum(c, d){ return d != null ? F(c.answer, d) : M.fmt(c.answer, 3); }
  /* A typed expression as a function of its first variable (null when it
     does not read, or has more than one variable): what a tool draws. */
  function fnOf(raw, vars){
    vars = vars || ['x'];
    raw = String(raw || '').replace(/\+\s*C\s*$/, '').trim();
    if(!raw || vars.length !== 1) return null;
    try{ var r = M.read(raw, { vars: vars }); if(!r || !r.ok) return null; var f = M.fn(raw, vars); return function(x){ try{ return f(x); }catch(e){ return NaN; } }; }catch(e){ return null; }
  }
  /* "Yours | Right" side by side, after Show the answer (or a right second
     try), for a number or an expression: what was typed against the key. */
  function compareHtml(s, t){
    if(!t || t.ok) return '';
    var tex = window.ApPrecalcTex, yours = '', right = '';
    if(s.kind === 'num' || s.kind === 'vol'){
      if(!isFinite(t.value)) return '';
      yours = esc(M.fmt(t.value, 4).replace(/^-/, '−')); right = esc(shownNum(s.cell, s.d));
    } else if(s.kind === 'expr'){
      var a = M.read(t.raw, { vars: s.cell.expr.vars, allowC: s.cell.expr.mode === 'constant' }), b = M.read(s.cell.expr.answer, { vars: s.cell.expr.vars });
      if(!a || !a.ok || !b || !b.ok || !tex) return '';
      yours = tex.render(a.tex); right = tex.render(b.tex + (s.cell.expr.mode === 'constant' ? ' + C' : ''));
    } else return '';
    return '<div class="cd-cmp" role="group" aria-label="Your answer and the right answer"><span class="cd-cmp-y"><span class="cd-cmp-k">Yours</span> ' + yours + '</span><span class="cd-cmp-r"><span class="cd-cmp-k">Right</span> ' + right + '</span></div>';
  }
  /* ------------------------------------------- yours and right, drawn */
  /* tries() -> a per-problem store of marks a tool draws on its figure:
       set(key, marks), clear(), list(), svg(frame) -> '<g class="cd-marks">...</g>'
     A mark (plot coordinates, frame from ApPrecalcPlot.frame or any { sx, sy,
     x: [a, b], y: [c, d] }):
       { curve: f, domain?, who: 'yours'|'right', label? }
       { line: [[x1, y1], [x2, y2]], who, label? }         a segment
       { tangent: [x0, y0], slope, half?, who, label? }   a short tangent line
       { vline: x, who, label? }  { hline: y, who, label? }
       { point: [x, y], who, label? }
       { fill: [[x, y]...], who, tone? }                    a closed polygon (tone 'pos'|'neg': a signed area)
       { label: 'text', at: [x, y], who, anchor? } */
  function markSvg(Fr, list){
    var X0 = Math.min(Fr.sx(Fr.x[0]), Fr.sx(Fr.x[1])), X1 = Math.max(Fr.sx(Fr.x[0]), Fr.sx(Fr.x[1]));
    var Y0 = Math.min(Fr.sy(Fr.y[0]), Fr.sy(Fr.y[1])), Y1 = Math.max(Fr.sy(Fr.y[0]), Fr.sy(Fr.y[1]));
    function cx(v){ return Math.max(X0, Math.min(X1, v)); } function cy(v){ return Math.max(Y0 - 2, Math.min(Y1 + 2, v)); }
    function r1(v){ return Math.round(v * 10) / 10; }
    function txt(x, y, s, who, anchor){
      x = cx(x); y = Math.max(Y0 + 12, Math.min(Y1 - 4, y));
      var a = anchor || (x > (X0 + X1) / 2 ? 'end' : 'start');
      return '<text class="cd-' + who + ' cd-mlab" x="' + r1(x + (a === 'end' ? -6 : a === 'start' ? 6 : 0)) + '" y="' + r1(y) + '" text-anchor="' + a + '" paint-order="stroke">' + esc(s) + '</text>';
    }
    var out = [];
    (list || []).forEach(function(m){
      var w = m.who === 'right' ? 'right' : 'yours';
      if(m.curve){
        var a = m.domain ? m.domain[0] : Fr.x[0], b = m.domain ? m.domain[1] : Fr.x[1], d = '', pen = false, last = null;
        for(var i = 0; i <= 240; i++){
          var x = a + (b - a) * i / 240, y = m.curve(x);
          if(!isFinite(y) || y < Fr.y[0] - (Fr.y[1] - Fr.y[0]) * 2 || y > Fr.y[1] + (Fr.y[1] - Fr.y[0]) * 2 || (last != null && Math.abs(y - last) > (Fr.y[1] - Fr.y[0]))){ pen = false; last = isFinite(y) ? y : null; continue; }
          d += (pen ? 'L' : 'M') + r1(Fr.sx(x)) + ' ' + r1(Fr.sy(y)); pen = true; last = y;
        }
        if(d) out.push('<path class="cd-' + w + '" d="' + d + '"/>');
        if(m.label){ var lx = a + (b - a) * (w === 'right' ? 0.82 : 0.62), ly = m.curve(lx); if(isFinite(ly)) out.push(txt(Fr.sx(lx), Fr.sy(ly) - 8, m.label, w)); }
      } else if(m.line || m.tangent){
        var p0, p1;
        if(m.line){ p0 = m.line[0]; p1 = m.line[1]; }
        else { var h = m.half || (Fr.x[1] - Fr.x[0]) / 6; p0 = [m.tangent[0] - h, m.tangent[1] - h * m.slope]; p1 = [m.tangent[0] + h, m.tangent[1] + h * m.slope]; }
        out.push('<line class="cd-' + w + '" x1="' + r1(Fr.sx(p0[0])) + '" y1="' + r1(Fr.sy(p0[1])) + '" x2="' + r1(Fr.sx(p1[0])) + '" y2="' + r1(Fr.sy(p1[1])) + '"/>');
        // yours labelled at the left end, the right one at the right end, so the two never overlap
        if(m.label) out.push(w === 'right' ? txt(Fr.sx(p1[0]), Fr.sy(p1[1]) - 8, m.label, w, 'end') : txt(Fr.sx(p0[0]), Fr.sy(p0[1]) + 16, m.label, w, 'start'));
      } else if(m.vline != null){
        var vx = r1(Fr.sx(m.vline));
        out.push('<line class="cd-' + w + '" x1="' + vx + '" y1="' + r1(Y0) + '" x2="' + vx + '" y2="' + r1(Y1) + '"/>');
        if(m.label) out.push(txt(+vx, Y0 + (w === 'right' ? 14 : 30), m.label, w));
      } else if(m.hline != null){
        var hy = r1(Fr.sy(m.hline));
        out.push('<line class="cd-' + w + '" x1="' + r1(X0) + '" y1="' + hy + '" x2="' + r1(X1) + '" y2="' + hy + '"/>');
        if(m.label) out.push(txt(w === 'right' ? X1 : X0, +hy - 6, m.label, w, w === 'right' ? 'end' : 'start'));
      } else if(m.point){
        var px = r1(cx(Fr.sx(m.point[0]))), py = r1(cy(Fr.sy(m.point[1])));
        out.push('<circle class="cd-' + w + '" cx="' + px + '" cy="' + py + '" r="' + (w === 'right' ? 5.5 : 6.5) + '"/>');
        if(m.label) out.push(txt(+px, +py + (w === 'right' ? -10 : 20), m.label, w));
      } else if(m.path){
        // an open polyline in plot coordinates (a curve x = g(y), say)
        var pd = '', pon = false;
        m.path.forEach(function(q){ if(!isFinite(q[0]) || !isFinite(q[1])){ pon = false; return; } pd += (pon ? 'L' : 'M') + r1(Fr.sx(q[0])) + ' ' + r1(Fr.sy(q[1])); pon = true; });
        if(pd) out.push('<path class="cd-' + w + '" d="' + pd + '"/>');
        if(m.label && m.path.length){ var lq = m.path[Math.floor(m.path.length * (w === 'right' ? 0.8 : 0.6))]; if(lq && isFinite(lq[0]) && isFinite(lq[1])) out.push(txt(Fr.sx(lq[0]), Fr.sy(lq[1]) - 8, m.label, w)); }
      } else if(m.band){
        // an interval as a bar along the foot of the plot (a sign-chart row):
        // the right one lowest, yours just above it
        var b0 = cx(Fr.sx(Math.max(Fr.x[0], m.band[0]))), b1 = cx(Fr.sx(Math.min(Fr.x[1], m.band[1]))), by = w === 'right' ? Y1 - 9 : Y1 - 20;
        if(b1 - b0 > 1) out.push('<rect class="cd-' + w + '-fill cd-band" x="' + r1(b0) + '" y="' + r1(by) + '" width="' + r1(b1 - b0) + '" height="8" rx="4"/>');
        if(m.label) out.push(txt(b0, by - 3, m.label, w, 'start'));
      } else if(m.fill){
        out.push('<polygon class="' + (m.tone ? 'cd-' + m.tone + '-fill' : 'cd-' + w + '-fill') + '" points="' + m.fill.map(function(q){ return r1(Fr.sx(q[0])) + ',' + r1(Fr.sy(q[1])); }).join(' ') + '"/>');
      } else if(m.label){
        out.push(txt(Fr.sx(m.at[0]), Fr.sy(m.at[1]), m.label, m.tone || w, m.anchor));
      }
    });
    return out.length ? '<g class="cd-marks" aria-hidden="true">' + out.join('') + '</g>' : '';
  }
  function tries(){
    var by = {}, order = [];
    return {
      // A new step's marks: earlier steps keep only their right answers.
      set: function(k, marks){
        if(!(k in by)){ order.forEach(function(o0){ by[o0] = by[o0].filter(function(m){ return m.who === 'right'; }); }); order.push(k); }
        by[k] = marks || [];
      },
      clear: function(k){ if(k == null){ by = {}; order = []; } else { delete by[k]; order = order.filter(function(x){ return x !== k; }); } },
      list: function(){ return order.reduce(function(a, k){ return a.concat(by[k]); }, []); },
      svg: function(Fr){ return markSvg(Fr, this.list()); },
      has: function(){ return order.length > 0; }
    };
  }
  /* x-values and intervals named in a choice's text ("x = −1 and x = 3",
     "(−∞, −2) and (1, 4)", "t = 2"), so a picked option can be drawn. */
  function choiceMarks(html, v){
    var t = plainText(String(html || '')).replace(/−/g, '-').replace(/∞/g, 'Infinity').replace(/\\infty/g, 'Infinity');
    var num = '(-?(?:Infinity|\\d+(?:\\.\\d+)?(?:/\\d+)?))';
    var ivs = [], xs = [], m, re = new RegExp('[\\(\\[]\\s*' + num + '\\s*,\\s*' + num + '\\s*[\\)\\]]', 'g');
    function val(s){ if(/Infinity/.test(s)) return s.charAt(0) === '-' ? -Infinity : Infinity; var q = s.split('/'); return q.length > 1 ? +q[0] / +q[1] : +s; }
    while((m = re.exec(t))) ivs.push([val(m[1]), val(m[2])]);
    var re2 = new RegExp('\\b' + (v || '[xt]') + '\\s*(?:=|≈)\\s*' + num + '((?:\\s*(?:,|and|or)\\s*(?:' + (v || '[xt]') + '\\s*=\\s*)?-?\\d+(?:\\.\\d+)?(?:/\\d+)?)*)', 'g');
    while((m = re2.exec(t))){
      xs.push(val(m[1]));
      (m[2].match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) || []).forEach(function(s){ xs.push(val(s)); });
    }
    return { xs: xs.filter(isFinite), ivs: ivs };
  }
  /* autoMarks(step, try, o) -> marks for a step whose answer is a place on
     the figure: o names the steps by key.
       o.x     { key: true }   a number that is an x-value: a vertical line
       o.y     { key: true }   a number that is a height: a horizontal line
       o.pt    { key: x }      a number that is the height at x: a point
       o.curve { key: true }   an expression drawn as a curve on the figure
       o.pick  { key: 'x'|'band'|'pt' }  a choice whose text names x-values or
                               intervals: lines, bars, or points on o.f
       o.v     the variable's name in labels ('x', 't'); o.f the curve (for 'pt')
     Yours (dashed) when wrong; the right one (solid) once right or shown. */
  function autoMarks(s, t, o){
    var v = o.v || 'x', out = [], k = s.key;
    function add(who, val, raw, opt){
      if(s.kind === 'num'){
        if(!isFinite(val)) return;
        var lab = (who === 'yours' ? 'yours: ' : '') + numText(val);
        if(o.x && o.x[k]) out.push({ vline: val, who: who, label: (who === 'yours' ? 'yours: ' : '') + v + ' = ' + numText(val) });
        else if(o.y && o.y[k]) out.push({ hline: val, who: who, label: lab });
        else if(o.pt && o.pt[k] != null) out.push({ point: [o.pt[k], val], who: who, label: lab });
      } else if(s.kind === 'expr'){
        if(o.curve && o.curve[k]){ var f = fnOf(raw, s.cell.expr.vars); if(f) out.push({ curve: f, who: who, label: who === 'yours' ? 'yours' : 'right' }); }
      } else if(s.kind === 'choice' && o.pick && o.pick[k] && opt != null){
        var cm = choiceMarks(s.options[opt], o.pickVar || v), how = o.pick[k];
        if(how === 'band') cm.ivs.forEach(function(iv, j){ out.push({ band: iv, who: who, label: j ? '' : who === 'yours' ? 'yours' : 'right' }); });
        else cm.xs.forEach(function(x, j){
          if(how === 'pt' && o.f){ var y = o.f(x); if(isFinite(y)) out.push({ point: [x, y], who: who, label: j ? '' : who === 'yours' ? 'yours' : '' }); }
          else out.push({ vline: x, who: who, label: who === 'yours' ? (j ? '' : 'yours') : v + ' = ' + numText(x) });
        });
      }
    }
    if(!t.ok && !t.shown) add('yours', t.value, t.raw, t.pick);
    if(t.ok || t.shown) add('right', s.kind === 'num' ? s.cell.answer : NaN, s.kind === 'expr' ? s.cell.expr.answer : '', s.kind === 'choice' ? s.correct : null);
    return out;
  }
  /* markedFigure(box, specFn, cls?) -> { marks, redraw() }: an ApPrecalcPlot
     figure (specFn() -> spec, sized by the tool) with a marks layer on top. */
  function markedFigure(box, specFn, cls){
    var P = window.ApPrecalcPlot, marks = tries();
    function redraw(){
      var spec = specFn(); if(!spec) return;
      var svg; try{ svg = P.svg(spec); }catch(e){ return; }
      box.innerHTML = (cls ? '<div class="' + cls + '">' : '') + svg.replace(/<\/svg>$/, marks.svg(P.frame(spec)) + '</svg>') + (cls ? '</div>' : '');
    }
    redraw();
    return { marks: marks, redraw: redraw };
  }
  /* A tool's onTry in one line: keep the marks for this step (yours while
     wrong; on right or shown, the right one plus the last wrong try), redraw. */
  function tryOn(fig, o){
    return function(s, t){
      if(!fig()) return false;
      var F = fig(), mk = autoMarks(s, t, o), last = F.last || (F.last = {});
      if(!t.ok && !t.shown) last[s.key] = mk;
      else mk = (last[s.key] || []).concat(mk);
      if(!mk.length) return false;
      F.marks.set(s.key, mk); F.redraw();
      return true;
    };
  }
  /* gauge(marks, o) -> svg string: a number line with the student's value
     (dashed arrow from 0) and the right one (solid), for a number that has no
     place on the figure (a rate, a limit from the limit laws). marks: [{ v,
     who, label }]; o: { w, unit, x, y } (x, y: where to put it inside a
     bigger svg; omitted, it is its own svg). Sign and size read at a glance. */
  function gauge(list, o){
    o = o || {};
    var W = o.w || 360, H = 56, L = 18, R = W - 18, vals = list.map(function(m){ return m.v; }).filter(isFinite).concat([0]);
    if(vals.length < 2) return '';
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = hi - lo || 1;
    lo -= span * 0.12; hi += span * 0.12;
    var sx = function(v){ return L + (v - lo) / (hi - lo) * (R - L); }, r1 = function(v){ return Math.round(v * 10) / 10; };
    var y0 = 40; H = 64;
    var out = ['<line class="cd-gauge-axis" x1="' + L + '" y1="' + y0 + '" x2="' + R + '" y2="' + y0 + '"/>',
      '<line class="cd-gauge-axis" x1="' + r1(sx(0)) + '" y1="' + (y0 - 6) + '" x2="' + r1(sx(0)) + '" y2="' + (y0 + 6) + '"/>',
      '<text class="cd-gauge-0" x="' + r1(sx(0)) + '" y="' + (y0 + 18) + '" text-anchor="middle">0</text>'];
    // yours on the upper track, the right one just above the axis
    list.forEach(function(m){
      if(!isFinite(m.v)) return;
      var w = m.who === 'right' ? 'right' : 'yours', yy = w === 'right' ? y0 - 5 : y0 - 22, x1 = sx(m.v), x0 = sx(0);
      out.push('<line class="cd-' + w + '" x1="' + r1(x0) + '" y1="' + yy + '" x2="' + r1(x1) + '" y2="' + yy + '"/>');
      out.push('<circle class="cd-' + w + '" cx="' + r1(x1) + '" cy="' + yy + '" r="4"/>');
      // the label beyond the dot, away from the arrow (outward from 0)
      var anchor = x1 >= x0 ? 'start' : 'end';
      if(anchor === 'start' && x1 > R - 90) anchor = 'end';
      if(anchor === 'end' && x1 < L + 90) anchor = 'start';
      var lx = anchor === 'start' ? x1 + 8 : x1 - 8, ly = (anchor === 'start') === (x1 >= x0) ? yy + 4 : yy - 7;
      out.push('<text class="cd-' + w + ' cd-mlab" x="' + r1(lx) + '" y="' + r1(ly) + '" text-anchor="' + anchor + '">' + esc(m.label || ((w === 'yours' ? 'yours: ' : '') + numText(m.v) + (o.unit ? ' ' + o.unit : ''))) + '</text>');
    });
    var g = '<g class="cd-gauge pcalc-plot" aria-hidden="true"' + (o.x != null ? ' transform="translate(' + o.x + ' ' + o.y + ')"' : '') + '>' + out.join('') + '</g>';
    return o.x != null ? g : '<svg class="pcalc-plot cd-gauge-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(list.map(function(m){ return (m.who === 'right' ? 'right: ' : 'yours: ') + numText(m.v); }).join(', ')) + '">' + g + '</svg>';
  }
  /* A typed or found number as the student sees it. */
  function numText(v){ return isFinite(v) ? M.fmt(M.round(v, 3), 4).replace(/^-/, '−') : '?'; }
  /* A small "yours against the right one" graph of an expression step, for
     a tool whose figure has no place for it. Drawn after a wrong try: the
     right curve solid, yours dashed. */
  function exprPlot(s, t){
    var P = window.ApPrecalcPlot, E = s.cell && s.cell.expr;
    if(!P || !E || E.vars.length !== 1 || !t.fn) return '';
    var key = fnOf(E.answer, E.vars); if(!key) return '';
    var dom = E.domain && E.domain.length === 2 && isFinite(E.domain[0]) ? E.domain : [-3, 3];
    var a = dom[0], b = dom[1], vals = [];
    if(!(b > a)) return '';
    var same = true;
    for(var i = 0; i <= 120; i++){
      var x = a + (b - a) * i / 120, k = key(x), y = t.fn(x);
      if(isFinite(k)) vals.push(k); if(isFinite(y)) vals.push(y);
      if(isFinite(k) && isFinite(y) && Math.abs(k - y) > 1e-6 * Math.max(1, Math.abs(k))) same = false;
    }
    if(vals.length < 10) return '';
    vals.sort(function(p, q){ return p - q; });
    var lo = vals[Math.floor(vals.length * 0.03)], hi = vals[Math.ceil(vals.length * 0.97) - 1];
    if(hi - lo < 1e-6){ lo -= 1; hi += 1; }
    var pad = (hi - lo) * 0.12; lo = Math.min(lo - pad, 0); hi = Math.max(hi + pad, 0);
    var v = E.vars[0], spec = { label: 'Your expression and the right one, graphed for ' + v + ' from ' + M.fmt(a, 3) + ' to ' + M.fmt(b, 3), width: 320, height: 170, x: [a, b], y: [lo, hi], xLabel: v, yLabel: '' };
    var svg;
    try{ svg = P.svg(spec); }catch(e){ return ''; }
    var Fr = P.frame(spec);
    var marks = [{ curve: key, who: 'right', label: 'right' }, { curve: t.fn, who: 'yours', label: same && E.mode === 'constant' ? 'yours (shifted by C)' : 'yours' }];
    return '<figure class="cd-xplot">' + svg.replace(/<\/svg>$/, markSvg(Fr, marks) + '</svg>') + '<figcaption class="bt-small">' + (E.mode === 'constant' ? 'Antiderivatives that differ by a constant are parallel curves.' : 'Where the two graphs part, your expression gives a different value.') + '</figcaption></figure>';
  }
  /* The method hint a step gets when its tool names none. */
  var DEFAULT_METHOD = {
    num: 'Write the setup first: the formula with the given numbers in it. Then compute, and round only at the end.',
    vol: 'Read the scale on each axis before you read a value off the curve.',
    expr: 'Build it one piece at a time from the rule this step names, then test your expression at an easy value such as x = 1.',
    choice: 'Test each option against the picture or the definition, and rule out the ones that fail.',
    custom: 'Work through the picture one mark at a time.'
  };
  function drill(app, data, o){
    var slug = o.slug, gid = nid('dr'), contexts = data.contexts || [];
    var type = '', seed = seedFromUrl() || freshSeed();
    var fr = frame(app, data, { noun: o.noun || 'drill', hid: gid + '-h', howTitle: data.howItWorksTitle || 'How this drill works' });
    var area = fr.area;
    // Only the kinds this page has content for (contexts unlock with their units).
    var kinds = (o.types || []).filter(function(t){ type = t.value; var n = pickable().length; type = ''; return n > 0; });
    if(kinds.length > 1){
      kindPicker(fr.pick, { label: o.typeLabel || 'Problem type', options: kinds, onChange: function(v){ type = v; seed = freshSeed(); draw(true); } });
    }
    var sd = studioDrill(app, area, o);
    function pickable(){ return contexts.filter(function(c){ return !type || (c.types ? c.types.indexOf(type) > -1 : c.mode ? c.mode === type : c.kind === type); }); }
    function pickCtx(r){ var ok = pickable(); return r.pick(ok.length ? ok : contexts); }
    function draw(focus){
      var r = M.rng(seed), ctx = pickCtx(r), p = o.generate(r, ctx, type || undefined), results = [];
      area.innerHTML = '<div class="bt-prob-head"><h2 id="' + gid + '-h" tabindex="-1">' + esc(o.title ? o.title(p) : 'Practice problem') + '</h2><p class="bt-code">Problem code <b>' + seed + '</b> <a href="?seed=' + seed + '">Link to this problem</a></p></div>' +
        '<div class="bt-context">' + p.text + '</div><div class="cd-extra"></div><div class="cd-steps"></div>' +
        '<div class="bt-solution" hidden></div><div class="bt-next"></div>' + (o.detailsHtml || '');
      var api = { area: area, problem: p, fnOf: fnOf, say: function(h){ if(sd) sd.say(h); } }, exEl = area.querySelector('.cd-extra');
      // The table rows to fill live in the figure, which the Tool Studio
      // moves to the stage: reach them through it, not through the area.
      function rowsAll(sel){ return exEl.querySelectorAll(sel).length ? exEl.querySelectorAll(sel) : area.querySelectorAll(sel); }
      function row1(sel){ return exEl.querySelector(sel) || area.querySelector(sel); }
      if(o.extra) o.extra(exEl, p, api);
      var host = area.querySelector('.cd-steps');
      function step(i){
        if(i >= p.steps.length) return finish();
        var s = p.steps[i], sid = gid + '-s' + i, tries = 0, done = false;
        var el = document.createElement('form');
        el.className = 'bt-part cd-step';
        el.setAttribute('novalidate', '');
        el.setAttribute('aria-labelledby', sid + '-l');
        var head = '<p class="cd-label" id="' + sid + '-l"><span class="cd-n">Step ' + (i + 1) + ' of ' + p.steps.length + '</span> ' + s.label + '</p>' + (s.hint ? '<p class="bt-small" id="' + sid + '-h">' + s.hint + '</p>' : '');
        var body = '';
        if(s.kind === 'num' || s.kind === 'vol'){
          body = '<div class="bt-num-row cd-num"><label class="sr-only" for="' + sid + '-i">' + esc(String(s.label).replace(/<[^>]+>/g, '')) + '</label><input type="text" id="' + sid + '-i" inputmode="decimal" autocomplete="off" spellcheck="false"' + (s.hint ? ' aria-describedby="' + sid + '-h"' : '') + '>' + (s.unit ? '<span class="bt-unit">' + esc(s.unit) + '</span>' : '') + '</div>';
          if(s.kind === 'vol') body += '<div class="cd-vol"><label for="' + sid + '-r">Move the marker along the curve</label><input type="range" id="' + sid + '-r" min="0" max="' + s.max + '" step="0.1" value="' + M.round(s.max / 4, 1) + '"></div>';
        } else if(s.kind === 'expr'){
          var tx = window.ApPrecalcTex;
          body = '<div class="bt-num-row cd-expr">' + (s.lhs && tx ? '<span class="cd-expr-lhs" aria-hidden="true">' + tx.render(s.lhs) + '</span>' : '') +
            '<label class="sr-only" for="' + sid + '-i">' + esc(String(s.label).replace(/<[^>]+>/g, '')) + '</label><input type="text" id="' + sid + '-i" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="' + sid + '-p"></div>' +
            '<div class="cd-expr-preview pcalc-expr-preview" id="' + sid + '-p" aria-live="polite"></div>';
        } else if(s.kind === 'choice'){
          var order = s.fixed ? s.options.map(function(x, k){ return k; }) : Q.shuffle(s.options.map(function(x, k){ return k; }));
          body = '<fieldset class="cd-opts' + (s.optionsHtml ? ' cd-pics' : '') + '"><legend class="sr-only">' + esc(String(s.label).replace(/<[^>]+>/g, '')) + '</legend>' + order.map(function(k, n){
            var id = sid + '-o' + k;
            // A text option is one inline run (text and formulas keep their
            // spaces) with a plain-text name, so a formula-only label is named.
            return '<div class="bt-radio cd-opt" data-k="' + k + '"><input type="radio" name="' + sid + '" id="' + id + '" value="' + k + '"' + (s.optionsHtml ? '' : ' aria-label="' + esc(plainText(String(s.options[k]))) + '"') + '><label for="' + id + '">' + (s.optionsHtml ? '<span class="cd-pic-n">' + esc(s.picLabel || 'Picture') + ' ' + (n + 1) + '</span>' + s.optionsHtml[k] : '<span class="cd-opt-t">' + s.options[k] + '</span>') + '</label></div>';
          }).join('') + '</fieldset>';
        } else if(s.kind === 'custom'){
          var cu = o.custom(s, api);
          body = cu.html || '';
        } else {
          body = '<p class="bt-small cd-rowhint">Type each value in the ' + esc(s.row) + ' row of the table.</p>';
        }
        el.innerHTML = head + body + '<div class="bt-actions"><button type="submit" class="btn-press sm">' + esc(s.checkLabel || 'Check') + '</button></div><div class="cd-fb" role="status" aria-live="polite"></div>';
        host.appendChild(el);
        if(cu && cu.init) cu.init(el);
        // the figure can show which part this step works on
        if(o.onStart) try{ o.onStart(s, api); }catch(e){ try{ console.error(e); }catch(x){} }
        var rowInputs = [];
        if(s.kind === 'row' || s.kind === 'coef'){
          rowsAll('[data-row="' + s.row + '"] [data-i]').forEach(function(td){
            var k = +td.getAttribute('data-i');
            td.innerHTML = '<input type="text" class="cd-cell" autocomplete="off" spellcheck="false"' + (s.kind === 'num' ? '' : ' inputmode="' + (s.kind === 'coef' ? 'text' : 'decimal') + '"') + ' aria-label="' + esc(td.getAttribute('data-label')) + '">';
            rowInputs[k] = td.querySelector('input');
            rowInputs[k].addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); check(); } });
          });
          var activeRow = row1('[data-row="' + s.row + '"]');
          activeRow.classList.add('is-active');
          // On the Tool Studio stage the table can be taller than the stage: bring the row to fill into view.
          if(activeRow.closest('.ls-stage-body') && activeRow.scrollIntoView){ try{ activeRow.scrollIntoView({ block: 'nearest' }); }catch(e){} }
        }
        var fb = el.querySelector('.cd-fb'), input = el.querySelector('.cd-num input, .cd-expr input'), range = el.querySelector('.cd-vol input');
        if(s.kind === 'expr'){
          var pv = el.querySelector('.cd-expr-preview'), E = s.cell.expr, tmr = null;
          input.addEventListener('input', function(){
            clearTimeout(tmr);
            tmr = setTimeout(function(){
              var v = input.value.trim(), r = v ? M.read(v, { vars: E.vars, allowC: E.mode === 'constant' }) : null;
              pv.innerHTML = !r ? '' : r.ok ? '<span class="bt-small">Reads as</span> ' + window.ApPrecalcTex.render(r.tex) : '<span class="pcalc-expr-err">' + esc(r.error) + '</span>';
              if(o.onInput) o.onInput(s, r && r.ok ? v : '', api);
            }, 120);
          });
        }
        if(range){
          var sync = function(v){ if(o.onVol) o.onVol(v, s, api); };
          range.addEventListener('input', function(){ input.value = M.fixed(+range.value, 1); sync(+range.value); });
          input.addEventListener('input', function(){ var x = numOf(input.value); if(isFinite(x)){ range.value = String(x); sync(x); } });
          api.setVol = function(v){ if(done) return; v = Math.max(0, Math.min(s.max, M.round(v, 1))); range.value = String(v); input.value = M.fixed(v, 1); sync(v); };
          sync(+range.value);
        } else api.setVol = null;
        el.addEventListener('submit', function(e){ e.preventDefault(); check(); });
        // The student's last wrong try, kept to draw beside the right answer.
        var lastWrong = null;
        function tryOf(ok, shown){
          var t = { ok: ok, shown: !!shown, value: NaN, raw: '', fn: null, pick: -1 };
          if(s.kind === 'num' || s.kind === 'vol') t.value = shown ? s.cell.answer : numOf(input.value);
          else if(s.kind === 'expr'){ t.raw = shown ? s.cell.expr.answer : input.value.trim(); t.fn = fnOf(t.raw, s.cell.expr.vars); }
          else if(s.kind === 'choice'){ var c0 = el.querySelector('input:checked'); t.pick = shown ? s.correct : c0 ? +c0.value : -1; }
          return t;
        }
        // onTry returns true (drawn), or a sentence saying what the picture shows now
        var drewNote = '';
        function drawTry(t){ try{ var r = o.onTry && o.onTry(s, t, api); drewNote = typeof r === 'string' ? r : ''; return !!r; }catch(e){ try{ console.error(e); }catch(x){} return false; } }
        function lock(){
          done = true;
          if(cu && cu.lock) cu.lock();
          el.querySelectorAll('input').forEach(function(x){ if(x.type === 'radio' || x.type === 'range') x.disabled = true; else x.readOnly = true; });
          rowInputs.forEach(function(x){ if(x) x.readOnly = true; });
          if(s.row) row1('[data-row="' + s.row + '"]').classList.remove('is-active');
        }
        function next(right){
          results.push({ id: slug + ':' + p.ctx + ':' + s.key, correct: right, topic: (data.partTopics && data.partTopics[s.key]) || p.topic, practice: s.practice, level: s.level || 'apply', diff: 2, group: s.key });
          el.querySelector('.bt-actions').innerHTML = '';
          if(sd) sd.clear();
          if(o.onStep) o.onStep(s, right, api);
          step(i + 1);
          var nx = host.lastElementChild;
          if(nx && nx !== el){ var f = nx.querySelector('input:not([readonly]):not([disabled])') || row1('tr.is-active input'); if(f) f.focus(); }
        }
        function reveal(){
          if(s.kind === 'num' || s.kind === 'vol'){ input.value = shownNum(s.cell, s.d); if(range){ range.value = String(s.cell.answer); if(o.onVol) o.onVol(s.cell.answer, s, api); } }
          else if(s.kind === 'expr'){ input.value = s.cell.expr.answer + (s.cell.expr.mode === 'constant' ? ' + C' : ''); input.dispatchEvent(new Event('input', { bubbles: true })); }
          else if(s.kind === 'row') s.cells.forEach(function(c, k){ if(rowInputs[k]) rowInputs[k].value = M.fmt(c.answer, 3); });
          else if(s.kind === 'coef') s.cells.forEach(function(c, k){ if(rowInputs[k]) rowInputs[k].value = coefText(c.answer); });
          else if(s.kind === 'custom'){ if(cu.reveal) cu.reveal(); }
          else { var c = el.querySelector('input[value="' + s.correct + '"]'); if(c) c.checked = true; }
          el.classList.add('is-shown');
          var drew = s.kind === 'custom' ? false : drawTry(tryOf(true, true));
          fb.innerHTML = '<span class="pcalc-mark no">Shown</span> ' + (s.kind === 'custom' ? (cu.shownMsg || 'The answer is drawn.') : 'The answer is filled in. ') + (s.kind === 'choice' ? s.why[s.correct] : '') +
            (drew ? ' <span class="cd-onpic">' + esc(drewNote || (s.kind === 'choice' ? 'The picture shows the right answer.' : lastWrong ? 'The picture shows yours (dashed) beside the right one.' : 'The picture shows the right answer.')) + '</span>' : '') + compareHtml(s, lastWrong);
          lock(); next(false);
        }
        // One method hint per step, before Show the answer is offered.
        function methodOf(){ var m = s.method || (o.method && o.method(s, p)); return m || DEFAULT_METHOD[s.kind] || ''; }
        function check(){
          if(done) return;
          // blank: nothing entered yet, so the try does not count.
          var ok = true, notes = [], blank = false;
          if(s.kind === 'num' || s.kind === 'vol'){
            var rawN = input.value.trim(), g = M.diagnose(s.cell, numOf(rawN));
            if(!rawN) blank = true;
            else if(g.blank){ fb.innerHTML = '<span class="bt-small">Type a number, for example 0.25 or 1.8e-5.</span>'; return; }
            ok = g.ok; if(!ok && g.why) notes.push(g.why);
            input.classList.toggle('is-wrong', !blank && !ok); input.classList.toggle('is-right', ok);
          } else if(s.kind === 'expr'){
            var rawE = input.value.trim(), ge = M.diagnoseExpr(s.cell, rawE);
            if(!rawE) blank = true;
            else if(ge.error){ fb.innerHTML = '<span class="bt-small">' + esc(ge.error) + '</span>'; return; }
            else { ok = ge.ok; if(ge.why) notes.push(/<math/.test(ge.why) ? ge.why : window.ApPrecalcTex ? window.ApPrecalcTex.html(esc(ge.why)) : esc(ge.why)); }
            input.classList.toggle('is-wrong', !blank && !ok); input.classList.toggle('is-right', ok);
          } else if(s.kind === 'row' || s.kind === 'coef'){
            s.cells.forEach(function(c, k){
              var raw = rowInputs[k].value.trim(), x = s.kind === 'coef' ? parseCoef(raw) : numOf(raw);
              var g = M.diagnose(c, x), who = rowInputs[k].getAttribute('aria-label');
              if(!raw){ blank = true; ok = false; }
              else if(g.blank){ ok = false; notes.push('<b>' + esc(who) + ':</b> ' + (s.kind === 'coef' ? 'Write the change in terms of x, such as −x, +2x or 0.' : 'Type a number, for example 0.25 or 1.8e-5.')); }
              else if(!g.ok){ ok = false; notes.push('<b>' + esc(who) + ':</b> ' + (g.why || (s.kind === 'coef' ? 'Write the change as a multiple of x, from the coefficient: −x, +2x.' : 'Not this value. Recheck the arithmetic.'))); }
              rowInputs[k].classList.toggle('is-wrong', !!raw && !g.ok); rowInputs[k].classList.toggle('is-right', !!g.ok);
            });
          } else if(s.kind === 'custom'){
            var gc = cu.check();
            if(gc.blank){ fb.innerHTML = '<span class="bt-small">' + (gc.msg || 'Answer first.') + '</span>'; return; }
            ok = gc.ok; (gc.notes || []).forEach(function(n){ notes.push(n); });
          } else {
            var c = el.querySelector('input:checked');
            if(!c) blank = true;
            else { var pick = +c.value; ok = pick === s.correct; notes.push(s.why[pick]); }
          }
          if(blank){ fb.innerHTML = '<span class="bt-small">' + (s.kind === 'choice' ? 'Choose an answer first.' : s.kind === 'expr' ? 'Type an expression first, for example 3x^2 + 1.' : s.kind === 'coef' ? 'Fill every cell of the row' + (s.kind === 'coef' ? ': write 0, −x, +2x and so on.' : '.') : 'Type a number first, for example 0.25 or 1.8e-5.') + '</span>'; return; }
          tries++;
          if(s.kind === 'choice') el.querySelectorAll('.cd-opt').forEach(function(op){ var r0 = op.querySelector('input'); op.classList.toggle('is-wrong', !ok && r0.checked); op.classList.toggle('is-right', ok && r0.checked); });
          var t = s.kind === 'custom' ? null : tryOf(ok, false), drew = t ? drawTry(t) : !!gc.drew;
          // a tool's own diagnosis when no authored slip matched (o.note(step, try) -> html)
          if(!ok && t && !notes.length && o.note){ var nn = o.note(s, t, api); if(nn) notes.push(nn); }
          if(ok){
            el.classList.add('is-right');
            // Right after a wrong try: the right answer beside the earlier one.
            fb.innerHTML = '<span class="pcalc-mark ok">Correct</span> ' + (s.kind === 'choice' || s.kind === 'custom' ? notes.join(' ') : '') + (tries > 1 ? compareHtml(s, lastWrong) : '');
            lock(); next(tries === 1);
            return;
          }
          if(t) lastWrong = t;
          el.classList.add('is-wrong');
          var meth = methodOf();
          // An expression the tool's figure has no place for gets its own small graph: yours against the right one.
          var xp = s.kind === 'expr' && !drew && t ? exprPlot(s, t) : '';
          fb.innerHTML = '<span class="pcalc-mark no">Not yet</span>' + (notes.length ? '<ul class="cd-notes">' + notes.map(function(n){ return '<li>' + n + '</li>'; }).join('') + '</ul>' : s.kind === 'vol' ? ' That is not where this point is. Look at the shape of the curve again.' : '') +
            (drew ? '<p class="cd-onpic">' + esc(drewNote || (s.kind === 'choice' ? 'The picture shows your choice.' : s.kind === 'custom' ? 'The numbered marks on the picture show what to fix.' : 'The picture shows your answer, dashed.')) + '</p>' : xp) +
            (meth ? '<p class="cd-method"><span class="cd-method-k">Method</span> ' + meth + '</p>' : '') +
            // Show the answer comes after the hint: from the second wrong try (or at once with no hint).
            (tries > 1 || !meth ? '<div class="bt-actions"><button type="button" class="bt-btn cd-show">Show the answer</button></div>' : '<p class="bt-small cd-again-hint">Use the method, change your answer and Check again.</p>');
          var sh = fb.querySelector('.cd-show'); if(sh) sh.addEventListener('click', reveal);
          if(sd) sd.wrong(drew);
        }
      }
      function finish(){
        var sol = area.querySelector('.bt-solution');
        sol.hidden = false;
        sol.innerHTML = '<h3 tabindex="-1">Worked solution</h3><ol class="bt-steps">' + p.solution.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ol>';
        var right = results.filter(function(x){ return x.correct; }).length;
        record(slug, results);
        event('apprecalc-drill-check', { tool: slug, correct: right, total: results.length });
        var nx = area.querySelector('.bt-next');
        nx.innerHTML = '<p class="bt-result" role="status">' + right + ' of ' + results.length + (results.length === 1 ? ' step' : ' steps') + ' right the first time.</p><div class="bt-actions"><button type="button" class="btn-press sm cd-again">' + esc(o.newLabel || 'New problem') + '</button>' + report(slug + ':' + p.ctx) + '</div>';
        nx.querySelector('.cd-again').addEventListener('click', function(){ seed = freshSeed(); draw(true); });
        keepGoing(nx, { topic: p.topic, also: results.filter(function(x){ return !x.correct; }).map(function(x){ return x.topic; }) });
        if(sd){ sd.done(right, results.length); return; }
        sol.querySelector('h3').focus();
      }
      step(0);
      if(sd) sd.fresh(p);
      if(focus) area.querySelector('h2').focus();
    }
    draw(false);
  }

  /* ------------------------------------------- explore / test yourself */
  /* modes(app, o) -> { explore, quiz, show(name) }: a two-button switch at the
     top of the tool ("Explore" | "Test yourself") and one pane for each. The
     quiz pane is built the first time it is shown (o.quiz(host)); explore
     (o.explore(host)) is built at once. A problem link (?seed=) or #quiz
     opens on the quiz; otherwise the last mode used on this tool, explore by
     default. o: { slug, explore, quiz, labels?: [explore, quiz] } */
  function modes(app, o){
    var key = 'apprecalc_toolmode_' + o.slug, lab = o.labels || ['Explore', 'Test yourself'], gid = nid('md');
    var bar = document.createElement('div');
    bar.className = 'bt-modebar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Mode');
    bar.innerHTML = '<button type="button" class="bt-mode" data-m="explore" aria-pressed="false">' + esc(lab[0]) + '</button><button type="button" class="bt-mode" data-m="quiz" aria-pressed="false">' + esc(lab[1]) + '</button>';
    var ex = document.createElement('div'), qz = document.createElement('div');
    ex.className = 'bt-pane bt-pane-explore'; qz.className = 'bt-pane bt-pane-quiz';
    ex.id = gid + '-e'; qz.id = gid + '-q';
    app.appendChild(bar); app.appendChild(ex); app.appendChild(qz);
    var built = false, cur = '';
    function show(m, user){
      if(m === cur) return;
      cur = m;
      if(m === 'quiz' && !built){ built = true; o.quiz(qz); }
      ex.hidden = m !== 'explore'; qz.hidden = m !== 'quiz';
      if(st) st.mode(m);
      bar.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === m)); });
      if(user){ try{ localStorage.setItem(key, m); }catch(e){} event('apprecalc-tool-mode', { tool: o.slug, mode: m }); }
      if(o.onShow) o.onShow(m);
    }
    bar.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(b) show(b.getAttribute('data-m'), true); });
    var st = studioOf(app);
    o.explore(ex);
    var start = 'explore';
    try{
      if(seedFromUrl() || /#quiz\b/.test(location.hash)) start = 'quiz';
      else if(localStorage.getItem(key) === 'quiz') start = 'quiz';
    }catch(e){}
    if(st){
      var eb = bar.querySelector('[data-m="explore"]');
      if(/^Explore\b/.test(eb.textContent)) eb.textContent = 'Explore';
      st.modes({ el: bar, value: start });
      // After the switch, so the arrangement knows the mode it opens on.
      if(o.studio && o.studio.explore) o.studio.explore(ex, st);
    }
    show(start, false);
    return { explore: ex, quiz: qz, show: show, bar: bar };
  }
  /* Motion off? (site toggle or the OS setting) */
  function reduced(){
    try{ if(window.LevlMotion && window.LevlMotion.reduced) return !!window.LevlMotion.reduced(); return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; }
  }

  /* ------------------------------------------------ Tool Studio frame */
  /* docs/tools-calm.md. studioFrame mounts the calm frame in place of the
     hero (title, back to the tools hub; the Beta note and Report a problem
     in the menu). modes() hands its switch to the frame and keeps the
     frame's mode in step; a trainer's explore view arranges itself through
     modes({ studio: { explore(pane, s) } }); drill() arranges every problem:
       stage   .cd-extra (the problem's figure), unless it holds table rows
       dock    the steps, one at a time (LevlStudio.stepper), then the result,
               New problem and Keep going
       caption the problem text (.bt-context; it stays in the dock if it
               holds table rows to fill)
       Why     the worked solution, once every step is answered
       Details the problem text and code, any extra disclosures, More options
       About   "About this drill"
     A drill's tool code must reach its figure through its own references
     (not app.querySelector), since the figure moves to the stage. */
  function studioOf(app){
    var s = window.LevlStudio && window.LevlStudio.get();
    var root = document.getElementById('app');
    return s && root && root.getAttribute('data-studio') && root.contains(app) ? s : null;
  }
  function studioFrame(app, slug){
    var main = app.parentNode, h1 = main.querySelector('.pcalc-hero h1'), lede = main.querySelector('.pcalc-hero .lede');
    main.classList.add('ls-host');
    var s = window.LevlStudio.mount({
      title: h1 ? h1.textContent : slug, course: 'AP® Precalculus', back: base() + 'tools.html', home: base(), slug: 'apprecalc-' + slug,
      host: app,
      // the second tab and its dock button, named for what is in it
      // the second tab and its dock button: a tool names it with
      // data-details-title on #app (set before mount); default "Numbers & setup".
      detailsTitle: app.getAttribute('data-details-title') || 'Numbers & setup',
      menu: {
        copyLink: function(){
          var code = s.mode() === 'quiz' ? s.root.querySelector('.ls-drill-det .bt-code b') : null;
          return location.origin + location.pathname + (code ? '?seed=' + code.textContent : '');
        },
        report: { course: 'apprecalc', id: 'tool:' + slug },
        note: { label: 'Note.', html: 'This course has not yet been reviewed by an AP® Precalculus teacher. <a href="' + base() + '../sources.html">Sources</a>' }
      }
    });
    if(lede){ var p = document.createElement('p'); p.textContent = lede.textContent; s.add('about', p); }
    return s;
  }
  function studioRest(app, s){
    var draft = app.querySelector(':scope > .bt-draft');
    if(draft) s.add('about', draft);
    app.hidden = true;
  }
  function studioDrill(app, area, o){
    o = o || {};
    var s = studioOf(app);
    if(!s) return null;
    var only = app.classList.contains('bt-pane-quiz') ? { mode: 'quiz' } : null, m = only && only.mode;
    var stage = document.createElement('div'), why = document.createElement('div'), det = document.createElement('div');
    stage.className = 'ls-drill-stage'; why.className = 'ls-sec ls-drill-why'; det.className = 'ls-sec ls-drill-det';
    s.add('stage', stage, only); s.add('why', why, only); s.add('details', det, only);
    var more = app.querySelector(':scope > .cd-more'), about = app.querySelector(':scope > .bt-about');
    area.classList.add('ls-drill');
    s.add('dock', area, only);
    if(more) s.add('details', more, only);
    if(about){ about.open = true; s.add('about', about, only); }
    return {
      fresh: function(p){
        stage.innerHTML = ''; det.innerHTML = '<h3 class="ls-title-l">This problem</h3>';
        why.innerHTML = '<h3 class="ls-title-l">Worked solution</h3><p class="ls-sub">It appears here once every step is answered.</p>';
        var extra = area.querySelector(':scope > .cd-extra'), fig = extra && (extra.children.length || extra.textContent.trim());
        var ctx = area.querySelector(':scope > .bt-context'), text = ctx ? Array.prototype.map.call(ctx.childNodes, plainText).join(' ').replace(/\s+/g, ' ').trim() : '';
        // The problem is read on the stage when there is no figure, or when
        // the drill asks (o.textOnStage: a long problem over a table to
        // fill); otherwise it is the caption over the figure.
        var onStage = ctx && (!fig || o.textOnStage);
        if(onStage){ ctx.classList.add('ls-drill-text'); stage.appendChild(ctx); }
        // The figure is the stage, table rows to fill included (drill()
        // reaches them through the figure).
        // With the text on the stage, the (maybe empty) figure host goes there
        // too, so a picture a tool draws after a try appears under the problem.
        if(fig || (onStage && extra)) stage.appendChild(extra);
        if(ctx && !onStage && !ctx.querySelector('[data-row], input')) det.appendChild(ctx);
        Array.prototype.slice.call(area.querySelectorAll(':scope > details')).forEach(function(d){ det.appendChild(d); });
        var code = area.querySelector('.bt-code'); if(code) det.appendChild(code);
        var h2 = area.querySelector('.bt-prob-head h2'); if(h2) h2.classList.add('sr-only');
        var steps = area.querySelector(':scope > .cd-steps'), nSteps = (p.steps || []).length;
        // One step: no "Step 1 of 1" stepper. A one-step picture choice is
        // the picture: its options (and Check) join the problem on the stage.
        if(steps && nSteps > 1) window.LevlStudio.stepper(steps, { items: ':scope > .cd-step', total: nSteps,
          done: function(){ var nx = area.querySelector(':scope > .bt-next'); return !!(nx && nx.children.length); } });
        if(steps && nSteps === 1 && steps.querySelector('.cd-pics')){ steps.classList.add('ls-drill-pics'); stage.appendChild(steps); }
        // o.studioAsk: a long problem over a figure is captioned by its
        // equation and its question; the whole text is in Details.
        if(!onStage && o.studioAsk && ctx){
          var eq = ctx.querySelector('.bt-eq'), eqT = eq ? plainText(eq) : '';
          var rest = eqT ? text.replace(eqT, '').trim() : text, ss = rest.match(/(?:[^.?!]|\.(?=\d))+[.?!]+/g) || [rest]; // a decimal point (2.5 ft) does not end a sentence
          var ask = ss.filter(function(x){ return /\?\s*$/.test(x); }).pop() || ss[ss.length - 1];
          text = (eqT ? eqT.replace(/\s+K\s*=/, ', K =') + '. ' : '') + ask.trim();
        }
        s.caption(onStage ? esc(o.studioCaption || (nSteps > 1 ? 'Answer one step at a time.' : stage.querySelector('.cd-pics') ? 'Tap the picture that fits, then Check.' : 'Answer, then Check.')) : esc(text), m); s.pills([], 'left', m);
      },
      // A wrong try: the pill says so (the step's own feedback has the note and the method).
      wrong: function(drew){ s.pills([{ html: drew ? 'Not yet: see the picture' : 'Not yet', tone: 'warn' }], 'left', m); },
      clear: function(){ s.pills([], 'left', m); },
      say: function(h){ s.caption(h, m); },
      done: function(right, total){
        var sol = area.querySelector(':scope > .bt-solution');
        if(sol){ why.innerHTML = ''; why.appendChild(sol); }
        s.pills([{ html: right + ' of ' + total + ' right', tone: right === total ? 'good' : 'warn' }], 'left', m);
        s.caption('<b>' + (total === 1 ? (right ? 'Right the first time.' : 'Not right the first time.') : right + ' of ' + total + ' steps right the first time.') + '</b> The worked solution is open under Why.', m);
        var again = area.querySelector('.cd-again');
        // X6: the studio opens the worked solution by itself, once (the
        // sheet on a phone, the drawer on a desktop); closing it returns
        // to New problem, which has focus first.
        if(again){ again.classList.add('ls-btn', 'ls-pri'); again.focus({ preventScroll: true }); }
      }
    };
  }
  /* studioPane(pane, s, o): the usual arrangement of an explore view (the
     titration reader's, written once for the other trainers). Every part is
     MOVED, so the tool keeps its references:
       o.stage    [els]  the picture, in a .pcalc-ls-stage column
       o.dock     [els]  the 1 to 3 primary controls, in a .pcalc-ls-dock
       o.setup    'Reaction'   a "Setup" row under them that opens Details on
                  the tool's More options (its summary renamed to o.moreLabel)
       o.why      [els]  what is happening (each "Why?" disclosure opened,
                  its own summary hidden: the sheet is the Why)
       o.details  [els]  numbers and settings; then More options, then
                  whatever else is left in the pane
       o.mode     'explore' (default)
     Returns { setup(text), open() }: the Setup row's value, and reopening
     the Why disclosures after a redraw. */
  function studioPane(pane, s, o){
    var only = { mode: o.mode || 'explore' }, q = function(sel){ return pane.querySelector(sel); };
    function box(cls, els){ var d = document.createElement('div'); d.className = cls; (els || []).forEach(function(e){ if(e) d.appendChild(e); }); return d; }
    s.add('stage', box('pcalc-ls-stage', o.stage), only);
    var dock = [box('pcalc-ls-dock', o.dock)], row = null;
    var more = q('details.bt-more');
    if(o.setup && more){
      row = document.createElement('button');
      row.type = 'button'; row.className = 'ls-linkrow pcalc-ls-setup';
      row.innerHTML = '<span><span class="ls-k">' + esc(o.setup) + '</span><span class="ls-v"></span></span>' + window.LevlStudio.icon('more');
      row.setAttribute('aria-label', o.setup + ': ' + (o.moreLabel || 'more options') + ' (opens Details)');
      row.addEventListener('click', function(){ s.open('details', more.querySelector('summary')); });
      dock.push(row);
    }
    s.add('dock', dock, only);
    // The "Start here" cue reads as the first line of Why.
    var why = box('ls-sec pcalc-ls-why', [pane.querySelector('.bt-cue')].concat(o.why || []));
    s.add('why', why, only);
    var det = box('ls-sec pcalc-ls-det', o.details);
    if(more){
      more.classList.add('pcalc-ls-more'); more.open = true;
      if(o.moreLabel) more.querySelector('summary').textContent = o.moreLabel;
      det.appendChild(more);
    }
    Array.prototype.slice.call(pane.querySelectorAll(':scope > *, :scope > .bt-problem > *')).forEach(function(k){
      if(k.classList.contains('bt-problem') || !k.textContent.trim() && !k.querySelector('svg, input, select, button')) return;
      det.appendChild(k);
    });
    s.add('details', det, only);
    function openAll(){ why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; }); }
    openAll();
    return {
      setup: function(t){ if(row){ row.querySelector('.ls-v').textContent = t; row.setAttribute('aria-label', o.setup + ': ' + t + '. ' + (o.moreLabel || 'More options') + ' (opens Details)'); } },
      open: openAll, why: why, details: det
    };
  }
  /* The "head" line of an explain() box as plain caption html. */
  function sayHead(el){ var h = el && el.querySelector('.bt-say-h'); return h ? h.innerHTML : ''; }

  window.ApPrecalcTools = {
    studioOf: studioOf, studioPane: studioPane, sayHead: sayHead,
    modes: modes, reduced: reduced, cue: cue, moreHtml: moreHtml, explain: explain,
    esc: esc, F: F, nid: nid, mount: mount, frame: frame, kindPicker: kindPicker, keepGoing: keepGoing, slider: slider, choiceSelect: choiceSelect, announcer: announcer,
    plot: plot, niceMax: niceMax, niceStep: niceStep, dataTable: dataTable, wrapTables: wrapTables, box: box,
    record: record, report: report, event: event, questions: questions, frq: frq, skillTool: skillTool,
    gradePart: gradePart, partHtml: partHtml, unitOf: unitOf,
    drill: drill, parseCoef: parseCoef, coefText: coefText,
    tries: tries, markSvg: markSvg, numText: numText, fnOf: fnOf, choiceMarks: choiceMarks, plainText: plainText,
    autoMarks: autoMarks, markedFigure: markedFigure, tryOn: tryOn, gauge: gauge
  };
})();
