/* AP® Biology tool framework: what every simulator, skills tool and drill
   page shares (docs/apbio-architecture.md, "Tools"; the standards in
   docs/anp-tools-contract.md). A tool is one script (bio/assets/tools/<slug>.js)
   plus one data file (bio/data/tools/<slug>.json); the generator serves a
   filtered copy at assets/tool-data/<slug>.json (only items whose topic is
   published) and points #app[data-src] at it.

     ApBioTools.mount(slug, fn, opts)  load the data; fn(app, data, ctx) when
                                  the tool is live, else say which unit it
                                  arrives with. Then the intro and "How this
                                  model works" fold into one "About this tool"
                                  disclosure placed after the tool (tidyAbout).
     The stage slot (docs/tools-upgrade.md, contracts): opts.stage(host, state)
       draws the tool's live visual into host, a div.bt-stage-slot that is the
       first thing in #app, above every control. ctx = { stage: host,
       redraw(state) }: the tool calls ctx.redraw(state) from its update with
       its current state (by convention { inputs, result }); the engine also
       redraws with the last state after any input or change event in #app.
       Draws are coalesced to one per animation frame. Before the first
       redraw, state is { slug, data }.
     Keep going strip: after every recorded answer (record) and every
       simulator run, the card the student just used gets a strip linking
       the lesson and notes for the item's topic, up to three glossary terms
       of that topic (those named in the card first) and, after a miss, Review.
     Controls (real form elements, 44 px targets, visible values):
       slider({ id, label, min, max, step, value, unit, decimals, onInput })
         <input type=range> with its value shown and -/+ buttons
       choiceSelect({ id, label, options: [{ value, label }], value, onChange })
       announcer(el) -> say(text): a polite live region, debounced
     Pictures and tables:
       plot(spec) -> accessible SVG string (axes, grid, curves, points, bars,
         error bars; role="img" with a label); dataTable(cols, rows, caption)
     Questions and the mini FRQ:
       questions(host, items, stimuli, slug)  ApBioQuestions, recorded here
       frq(host, frq, slug)                   rubric self-score + sample answer
     Skills problems:
       skillTool(app, data, { slug, kind, decorate, chart, stage })  practice
         (seeded) and authored problems; auto-checked parts; worked solution
         after Check. stage(host, state) draws above the problem text, inside
         the problem card, on every new problem, every typed answer and after
         Check; state = { slug, kind, mode, code, index, cid, topic, input, sol,
         answers: { partKey: number | option index | null }, graded: null |
         { partKey: { correct, answered } }, phase: 'new' | 'input' | 'checked' }.
         chart(spec, input) (confidence intervals) is the stage when no stage
         is given: it draws sol.chart.
     Recording: record(slug, items) -> ApBioCore.toolResult, so every item
       (id "<tool>:<content>:<item>") reaches mastery and the review queue. */
(function(){
  'use strict';
  var M = window.ApBioMath, Q = window.ApBioQuestions;
  var uid = 0, unitMap = {};
  function nid(p){ return (p || 'bt') + '-' + (++uid); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function F(x, d){ var s = M.fixed(x, d == null ? 2 : d); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function core(){ return window.ApBioCore; }
  function base(){ return window.ApBioBase || '../'; }
  function report(id){ return window.LevlReport ? '<span class="bt-report">' + window.LevlReport.button('apbio', id) + '</span>' : ''; }
  function event(name, data){
    try{ core() && core().event(name, data); }catch(e){}
    if(name === 'apbio-sim-run' && tool.data) keepGoing(usedCard(), { topic: tool.data.topic });
  }

  /* ------------------------------------------------------- mounting */
  var tool = { slug: '', data: null }, lastHit = { card: null, q: null, form: null };
  function mount(slug, fn, opts){
    opts = opts || {};
    var app = document.getElementById('app');
    if(!app) return;
    var src = app.getAttribute('data-src');
    app.classList.add('bt-app');
    app.innerHTML = '<p class="bt-loading">Loading the tool…</p>';
    fetch(src).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(data){
      if(!data.live){
        app.innerHTML = '<p class="bio-soon">This tool arrives with ' + esc(data.arrives || 'its unit') + '. Meanwhile, read the <a href="' + base() + 'learn.html">free notes</a>.</p>';
        return;
      }
      app.innerHTML = '';
      unitMap = data.units || {};
      tool = { slug: slug, data: data };
      // Which card the student last used: the Keep going strip goes there.
      // (Remembered at event time: grading may replace the clicked button.)
      ['click', 'submit', 'change'].forEach(function(t){ app.addEventListener(t, function(e){
        var x = e.target;
        if(!x || !x.closest) return;
        lastHit = { card: x.closest('.bt-frq, .bt-problem, .bt-card'), q: x.closest('.bio-q'), form: x.closest('form'), target: x };
      }, true); });
      if(data.status === 'placeholder') app.insertAdjacentHTML('beforeend', '<p class="bt-draft"><b>Draft content.</b> These scenarios are waiting for review by a biology teacher. Spot a problem? Use Report a problem.</p>');
      // Tool Studio (docs/tools-calm.md): pages.json `studio: true` puts
      // data-studio on #app; the frame is mounted before the tool builds, so
      // its code can set the caption and the stage pills (ctx.studio). Its
      // parts move out of #app, so the listeners above go on the studio too.
      var studio = app.getAttribute('data-studio') && window.LevlStudio ? studioFrame(app, slug, data) : null;
      var scopes = studio ? [app, studio.root] : [app];
      if(studio) ['click', 'submit', 'change'].forEach(function(t){ studio.root.addEventListener(t, function(e){
        var x = e.target;
        if(!x || !x.closest) return;
        lastHit = { card: x.closest('.bt-frq, .bt-problem, .bt-card'), q: x.closest('.bio-q'), form: x.closest('form'), target: x };
      }, true); });
      var st = opts.stage ? stageSlot(opts.stage, { slug: slug, data: data }) : null;
      if(st){ app.appendChild(st.host); scopes.forEach(function(sc){ ['input', 'change'].forEach(function(t){ sc.addEventListener(t, function(){ st.redraw(); }); }); }); }
      fn(app, data, { stage: st ? st.host : null, redraw: st ? st.redraw : function(){}, studio: studio });
      if(st) st.redraw();
      if(studio){
        var so = opts.studio || {};
        if(so.arrange) so.arrange(app, studio, slug, so); else if(so.sim) studioSim(app, studio, slug, so); else studioArrange(app, studio, slug, so);
        return;
      }
      figureFirst(app);
      tidyAbout(app);
      simplify(app, slug);
    }).catch(function(e){
      if(window.console) console.error(e);
      app.innerHTML = '<p class="bio-soon" role="alert">The tool could not load. Check your connection and reload the page.</p>';
    });
  }
  /* The stage slot: a host div and a redraw(state) that draws at most once
     an animation frame with the latest state. */
  function stageSlot(draw, state){
    var host = document.createElement('div'), queued = false;
    host.className = 'bt-stage-slot';
    function now(){ queued = false; try{ draw(host, state); }catch(e){ if(window.console) console.error(e); } }
    return { host: host, redraw: function(s){
      if(s !== undefined) state = s;
      if(queued) return;
      queued = true;
      if(window.requestAnimationFrame) requestAnimationFrame(now); else setTimeout(now, 16);
    } };
  }
  /* A simulator's picture and graph (its .bt-stage) move up to just under
     the card's heading, above the controls that drive them, so on a phone
     the visual is on the first screen. A short key right after the stage
     (p.bt-small) moves with it. DOM order, so reading and tab order match. */
  function figureFirst(app){
    app.querySelectorAll('.bt-card').forEach(function(card){
      var stage = null, ctl = null;
      Array.prototype.forEach.call(card.children, function(k){
        if(!stage && k.classList.contains('bt-stage') && !k.classList.contains('bt-num')) stage = k;
        if(!stage && !ctl && /\b(bt-controls|bt-modes|bt-ctl)\b/.test(k.className)) ctl = k;
      });
      if(!stage || !ctl) return;
      var key = stage.nextElementSibling;
      card.insertBefore(stage, ctl);
      if(key && key.tagName === 'P' && key.classList.contains('bt-small') && !key.classList.contains('bt-runnote')) card.insertBefore(key, ctl);
    });
  }
  /* Simple first, depth on demand (2026-10-09 simplify pass). For every
     simulator card:
     - More options: a .bt-controls[data-primary="n"] shows its first n
       controls; a "More options" button after it reveals the rest and any
       .bt-more block in the card. CSS only, so tools that rebuild their
       controls keep working.
     - Split: a card with a .bt-hero (its live figure) gets a .bt-split
       wrapper: the hero in one column, the controls beside it on a wide
       screen. The hero is sticky only inside that wrapper, so it can never
       slide over what follows (the old layout let it cover the readouts).
     - Show the numbers: readouts, equations, the summary, graphs (.bt-num),
       trial buttons, the run note and data tables move, in order, into one
       closed disclosure at the end of the card. Open state is remembered.
     - Why?: a long .os-why explanation is clamped to two lines with a
       "Why?" button to read the rest (screen readers get it all).
     Elements are moved, never copied, so tools' querySelector lookups and
     hidden toggles still find them. */
  function store(k, v){ try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){} return null; }
  function simplify(app, slug){
    app.querySelectorAll('.bt-card').forEach(function(card){
      foldControls(card);
      splitHero(card);
      numbers(card, slug);
      card.querySelectorAll('.os-why').forEach(clampWhy);
    });
  }
  function foldControls(card){
    var ctl = card.querySelector('.bt-controls[data-primary]');
    if(!ctl) return;
    ctl.id = ctl.id || nid('more');
    card.classList.add('bt-folded');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'bt-btn bt-moreopt'; b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', ctl.id);
    b.innerHTML = '<span class="bt-moreopt-t">More options</span> <span aria-hidden="true">▾</span>';
    ctl.parentNode.insertBefore(b, ctl.nextSibling);
    b.addEventListener('click', function(){
      var open = card.classList.toggle('bt-folded') === false;
      b.setAttribute('aria-expanded', String(open));
      b.querySelector('.bt-moreopt-t').textContent = open ? 'Fewer options' : 'More options';
    });
  }
  function splitHero(card){
    var hero = null;
    Array.prototype.forEach.call(card.children, function(k){ if(!hero && k.classList.contains('bt-hero')) hero = k; });
    if(!hero) return;
    var side = [], k = hero.nextElementSibling, seenCtl = false;
    while(k){
      if(seenCtl && !k.classList.contains('bt-moreopt')) break;
      if(!k.matches(NUM_SEL)) side.push(k);
      if(k.classList.contains('bt-controls')) seenCtl = true;
      k = k.nextElementSibling;
    }
    if(!seenCtl) side = [];
    var wrap = document.createElement('div'), a = document.createElement('div'), b = document.createElement('div');
    wrap.className = 'bt-split'; a.className = 'bt-split-fig'; b.className = 'bt-split-side';
    card.insertBefore(wrap, hero);
    a.appendChild(hero);
    side.forEach(function(x){ b.appendChild(x); });
    wrap.appendChild(a); wrap.appendChild(b);
  }
  var NUM_SEL = '.bt-readout, .bt-eqs, .bt-summary, .bt-buttons, .bt-runnote, .bt-data, .bt-num';
  function numbers(card, slug){
    var items = Array.prototype.filter.call(card.children, function(k){ return k.matches(NUM_SEL); });
    if(!items.some(function(k){ return k.classList.contains('bt-readout'); })) return;
    var d = document.createElement('details'), key = 'apbio_numbers_' + slug;
    d.className = 'bt-numbers';
    d.innerHTML = '<summary><span class="bt-numbers-h">Show the numbers</span> <span class="bt-numbers-sub">readouts, graphs, equations and trials</span></summary><div class="bt-numbers-body"></div>';
    var body = d.querySelector('.bt-numbers-body');
    items.forEach(function(x){ body.appendChild(x); });
    card.appendChild(d);
    // A mode that hides every item (a quiz) hides the disclosure too.
    function sync(){ d.hidden = items.every(function(x){ return x.hidden || x.classList.contains('bt-runnote'); }); }
    items.forEach(function(x){ if(window.MutationObserver) new MutationObserver(sync).observe(x, { attributes: true, attributeFilter: ['hidden'] }); });
    sync();
    if(store(key) === '1') d.open = true;
    d.addEventListener('toggle', function(){ store(key, d.open ? '1' : '0'); });
  }
  function clampWhy(el){
    if(el.getAttribute('data-clamp')) return;
    el.setAttribute('data-clamp', '1');
    el.classList.add('bt-clamp');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'bt-whymore'; b.hidden = true; b.setAttribute('aria-expanded', 'false');
    b.textContent = 'Why? Read the rest';
    el.parentNode.insertBefore(b, el.nextSibling);
    var open = false;
    function check(){
      if(open){ b.hidden = false; return; }
      b.hidden = !(el.textContent.trim() && el.scrollHeight > el.clientHeight + 4);
    }
    b.addEventListener('click', function(){
      open = !open; el.classList.toggle('is-open', open);
      b.textContent = open ? 'Show less' : 'Why? Read the rest'; b.setAttribute('aria-expanded', String(open));
      check();
    });
    if(window.MutationObserver) new MutationObserver(function(){
      open = false; el.classList.remove('is-open'); b.textContent = 'Why? Read the rest'; b.setAttribute('aria-expanded', 'false');
      requestAnimationFrame(check);
    }).observe(el, { childList: true, characterData: true, subtree: true });
    if(window.ResizeObserver) new ResizeObserver(function(){ check(); }).observe(el);
    requestAnimationFrame(check);
  }
  /* The intro and the "How this model works" box, folded into one closed
     disclosure after the tool and before its questions, so a phone opens on
     the tool itself. The text is moved, not copied. */
  function tidyAbout(app){
    var kids = Array.prototype.slice.call(app.children);
    var intro = kids.filter(function(k){ return k.classList.contains('bt-intro'); })[0];
    var how = kids.filter(function(k){ return k.tagName === 'DETAILS' && k.classList.contains('bt-how'); })[0];
    if(!intro && !how) return;
    var title = how ? how.querySelector('summary').textContent : '';
    var d = document.createElement('details');
    d.className = 'bt-how bt-about';
    d.innerHTML = '<summary>About this tool' + (title ? ', and ' + esc(title.charAt(0).toLowerCase() + title.slice(1)) : '') + '</summary><div class="bt-how-body"></div>';
    var body = d.querySelector('.bt-how-body');
    if(intro){ intro.parentNode.removeChild(intro); body.appendChild(intro); }
    if(how){
      var h = document.createElement('h3'); h.className = 'bt-about-h'; h.textContent = title; body.appendChild(h);
      var hb = how.querySelector('.bt-how-body');
      while(hb && hb.firstChild) body.appendChild(hb.firstChild);
      how.parentNode.removeChild(how);
    }
    // Before the questions and the mini FRQ; for a skills tool right after
    // the problem; else at the end.
    var kids2 = Array.prototype.slice.call(app.children);
    var before = kids2.filter(function(k){ return k.classList.contains('bt-frq') || !!k.querySelector('.bt-qs'); })[0];
    var prob = kids2.filter(function(k){ return k.classList.contains('bt-problem'); })[0];
    app.insertBefore(d, before || (prob && prob.nextSibling) || null);
  }

  /* ------------------------------------------------ Keep going strip */
  function curriculumTopic(id){
    var c = window.ApBioCurriculum;
    return c && c.topics ? c.topics.filter(function(t){ return t.id === id; })[0] : null;
  }
  var glossary = null;
  function glossaryTerms(){
    if(!glossary){
      glossary = (window.LevlGlossary && window.LevlGlossary.load ? window.LevlGlossary.load() : fetch(base() + 'assets/glossary.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }))
        .then(function(d){ return d.terms || []; }, function(){ glossary = null; return []; });
    }
    return glossary;
  }
  /* Up to three terms the topic teaches: those named in text first (in the
     order they appear), else the first ones listed. */
  function pickTerms(all, topic, text){
    var low = String(text || '').toLowerCase(), mine = all.filter(function(t){ return t.topic === topic; });
    var at = function(t){
      var best = -1;
      [t.term].concat(t.aka || []).forEach(function(k){
        if(!k || k.length < 3) return;
        var i = low.indexOf(k.toLowerCase().replace(/\s*\([^)]*\)/g, ''));
        if(i > -1 && (best < 0 || i < best)) best = i;
      });
      return best;
    };
    var hits = mine.map(function(t){ return { t: t, i: at(t) }; }).filter(function(x){ return x.i > -1; }).sort(function(a, b){ return a.i - b.i; }).map(function(x){ return x.t; });
    return (hits.length ? hits : mine).slice(0, 3);
  }
  /* One strip per card, placed after what the student just did: the
     question answered, the worked solution, or the run note; else at the end
     of the card. A card can send it elsewhere with data-keep-host="<selector>"
     (graph builder: its feedback card). */
  function keepGoing(card, o){
    if(!card || !o.topic) return;
    var app = document.getElementById('app'), to = card.getAttribute('data-keep-host');
    if(to && app && app.querySelector(to)) card = app.querySelector(to);
    var el = card.querySelector('.bt-keep');
    var q = lastHit.q, f = lastHit.form;
    var res = f && card.contains(f) && f.nextElementSibling && f.nextElementSibling.classList.contains('bt-result') ? f.nextElementSibling : null;
    var sol = card.querySelector('.bt-solution:not([hidden])');
    var anchor = (q && card.contains(q) && q) || sol || res || card.querySelector('.bt-runnote');
    var text = (q || card).textContent;
    if(!el){ el = document.createElement('div'); el.className = 'bt-keep'; }
    if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling); else card.appendChild(el);
    var t = curriculumTopic(o.topic), b = base(), kid = nid('keep');
    var name = t ? t.title : '';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-labelledby', kid);
    el.setAttribute('data-topic', o.topic);
    el.innerHTML = '<p class="bt-keep-h" id="' + kid + '">Keep going</p><ul class="bt-keep-list">' +
      (t && t.built ? '<li><a href="' + b + 'lessons/' + esc(o.topic) + '.html"><span class="bt-keep-k">Lesson</span> ' + esc(name) + '</a></li>' +
        '<li><a href="' + b + 'notes/' + esc(o.topic) + '.html"><span class="bt-keep-k">Notes</span> ' + esc(name) + '</a></li>' : '') +
      '<li class="bt-keep-gl" hidden></li>' +
      (o.missed ? '<li><a href="' + b + 'review.html"><span class="bt-keep-k">Review</span> What you missed</a></li>' : '') + '</ul>';
    glossaryTerms().then(function(all){
      var li = el.querySelector('.bt-keep-gl');
      if(!li || el.getAttribute('data-topic') !== o.topic) return;
      var terms = pickTerms(all, o.topic, text);
      if(!terms.length) return;
      li.innerHTML = '<span class="bt-keep-k">Glossary</span> ' + terms.map(function(g){ return '<a href="' + b + 'glossary.html#t-' + esc(g.id) + '">' + esc(g.term) + '</a>'; }).join(' ');
      li.hidden = false;
    });
  }
  /* The card the student just used (where the strip goes). */
  function usedCard(){
    var app = document.getElementById('app');
    var c = lastHit.card, LS = window.LevlStudio && window.LevlStudio.get();
    if(c && app && (app.contains(c) || (LS && LS.root.contains(c)))) return c;
    // Tool Studio: a simulator's parts left their card; the strip goes to
    // the Keep going host in the sheet (studioKeep).
    return LS && LS.keepHost ? LS.keepHost(lastHit.target) : null;
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
    p.push('<line class="axis" x1="' + L + '" y1="' + (T + ph) + '" x2="' + (L + pw) + '" y2="' + (T + ph) + '"/><line class="axis y" x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (T + ph) + '"/>');
    if(s.vline) p.push('<line class="vline ' + (s.vline.cls || '') + '" x1="' + sx(s.vline.x).toFixed(1) + '" x2="' + sx(s.vline.x).toFixed(1) + '" y1="' + T + '" y2="' + (T + ph) + '"/>');
    (s.bars || []).forEach(function(b, i){
      var bw = Math.min(70, pw / cats.length * 0.55), x = sx(i) - bw / 2, y0 = sy(Math.max(0, s.y.min)), y1 = sy(b.value);
      p.push('<path class="bar ' + (b.cls || 's1') + '" d="' + barPath(x, Math.min(y0, y1), bw, Math.abs(y1 - y0), y1 <= y0) + '"/>');
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
    return '<svg class="bio-svg bt-plot" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(s.title || 'Graph') + '">' + p.join('') + '</svg>';
  }
  /* A bar with rounded data-end (top for positive, bottom for negative) and a square base on the baseline. */
  function barPath(x, y, w, h, up){
    var r = Math.min(4, w / 2, Math.abs(h)); if(!(h > 0)) return 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'h' + w.toFixed(1);
    if(up === false) return 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'h' + w.toFixed(1) + 'v' + (h - r).toFixed(1) + 'q0 ' + r + ' ' + (-r) + ' ' + r + 'h' + (-(w - 2 * r)).toFixed(1) + 'q' + (-r) + ' 0 ' + (-r) + ' ' + (-r) + 'z';
    return 'M' + x.toFixed(1) + ' ' + (y + h).toFixed(1) + 'v' + (-(h - r)).toFixed(1) + 'q0 ' + (-r) + ' ' + r + ' ' + (-r) + 'h' + (w - 2 * r).toFixed(1) + 'q' + r + ' 0 ' + r + ' ' + r + 'v' + (h - r).toFixed(1) + 'z';
  }
  function errBar(x, y1, y2){ return '<path class="err" d="M' + x.toFixed(1) + ' ' + y1.toFixed(1) + 'V' + y2.toFixed(1) + 'M' + (x - 6).toFixed(1) + ' ' + y1.toFixed(1) + 'h12M' + (x - 6).toFixed(1) + ' ' + y2.toFixed(1) + 'h12"/>'; }
  function niceMax(v){ if(v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))); var ms = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for(var i = 0; i < ms.length; i++) if(v <= ms[i] * p + 1e-9) return ms[i] * p; return 10 * p; }
  function niceStep(span, n){ var raw = span / (n || 5), p = Math.pow(10, Math.floor(Math.log10(raw))); var ms = [1, 2, 2.5, 5, 10]; for(var i = 0; i < ms.length; i++) if(raw <= ms[i] * p + 1e-9) return ms[i] * p; return 10 * p; }
  function wrapTable(inner, label){ return '<div class="table-wrap" tabindex="0" role="region" aria-label="' + esc(label || 'Data table') + '">' + inner + '</div>'; }
  function dataTable(cols, rows, caption){
    return wrapTable('<table class="bio-data">' + (caption ? '<caption>' + caption + '</caption>' : '') + '<thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
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
    var miss = items.filter(function(it){ return !it.correct; })[0];
    keepGoing(usedCard(), { topic: (miss || items[0] || {}).topic || (tool.data && tool.data.topic), missed: !!miss });
    var c = core();
    if(!c || !c.toolResult) return;
    c.toolResult(slug, items.map(function(it){
      return { id: it.id, correct: !!it.correct, topic: it.topic, unit: unitOf(it), practice: it.practice, level: it.level || 'apply', diff: it.diff || 2, group: it.group };
    }), extra);
  }

  /* -------------------------------------------- stimulus questions */
  /* Items use the question bank format (docs/apbio-architecture.md) with
     ids "<tool>:<content>:<n>". They are graded and explained by
     ApBioQuestions and recorded here, so the tool's tally counts them. */
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
      event('apbio-tool-question', { tool: slug, correct: !!res.correct });
    } }, st);
  }

  /* --------------------------------------------------- the mini FRQ */
  /* frq: { id, title, intro, stimulus?, parts: [{ label, prompt, points,
     practice, rubric: [{ point, accept: [] }], sample }], topic }. The same
     part format as data/frq/<id>.json. The student writes, then opens the
     rubric, ticks the points earned and sees a sample answer. Each part is
     recorded as one item, right when every point in it was ticked. */
  function frq(host, f, slug){
    var key = 'apbio_frqdraft_' + slug + '_' + f.id;
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
        event('apbio-tool-frq', { tool: slug, score: count(), total: total });
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
    var P = window.ApBioProblems, slug = o.slug, kind = o.kind;
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
    // The stage (docs/tools-upgrade.md): o.stage, or the older o.chart hook
    // drawing sol.chart (confidence intervals).
    var stageFn = o.stage || (o.chart ? function(host, s){ host.innerHTML = s.sol.chart ? '<div class="bt-chart">' + o.chart(s.sol.chart, s.input) + '</div>' : ''; } : null);
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
        '<form class="bt-parts" novalidate>' + sol.parts.map(function(p, i){ return partHtml(p, gid + '-p' + i); }).join('') +
        '<div class="bt-actions"><button type="submit" class="btn-press sm">Check answers</button></div></form>' +
        '<div class="bt-result" role="status" aria-live="polite"></div><div class="bt-solution" hidden></div>' +
        '<div class="bt-next"></div>';
      var form = area.querySelector('form'), stage = null;
      if(stageFn){
        var state = { slug: slug, kind: kind, mode: mode, code: cur.code || null, index: mode === 'set' ? at : null, cid: cur.cid, topic: cur.topic, input: cur.input, sol: sol, answers: {}, graded: null, phase: 'new' };
        stage = stageSlot(stageFn, state);
        area.insertBefore(stage.host, area.querySelector('.bt-context'));
        var answers = function(){
          var a = {};
          sol.parts.forEach(function(p){
            var el = form.querySelector('[data-key="' + p.key + '"]');
            if(p.type === 'choice'){ var c = el.querySelector('input:checked'); a[p.key] = c ? +c.value : null; }
            else { var x = Q.parseNumber(el.querySelector('input').value); a[p.key] = isNaN(x) ? null : x; }
          });
          return a;
        };
        ['input', 'change'].forEach(function(t){ form.addEventListener(t, function(){ if(state.phase === 'checked') return; state.answers = answers(); state.phase = 'input'; stage.redraw(state); }); });
        stage.redraw(state);
      }
      if(o.decorate) o.decorate(area, cur.input, sol);
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
          el.querySelector('.bt-part-fb').innerHTML = '<span class="bio-mark ' + (r.correct ? 'ok">Correct' : 'no">' + (r.answered ? 'Not quite' : 'Not answered')) + '</span>' + (r.correct ? '' : ' <span class="bt-key">Answer: ' + esc(r.shown) + '</span>');
        });
        form.querySelector('.bt-actions').innerHTML = report(slug + ':' + cur.cid);
        var solEl = area.querySelector('.bt-solution');
        solEl.hidden = false;
        solEl.innerHTML = '<h3>Worked solution</h3><ol class="bt-steps">' + sol.steps.map(function(s){ return '<li>' + wrapTables(s) + '</li>'; }).join('') + '</ol>';
        area.querySelector('.bt-result').textContent = right + ' of ' + sol.parts.length + ' parts right. The worked solution follows.';
        if(stage){
          var g = {};
          sol.parts.forEach(function(p, i){ g[p.key] = { correct: res[i].correct, answered: res[i].answered }; });
          state.answers = answers(); state.graded = g; state.phase = 'checked'; stage.redraw(state);
        }
        record(slug, sol.parts.map(function(p, i){
          return { id: slug + ':' + cur.cid + ':' + p.key, correct: res[i].correct, topic: (data.partTopics && data.partTopics[p.key]) || cur.topic, practice: p.practice, level: 'apply', diff: 2, group: p.key };
        }));
        event('apbio-skill-check', { tool: slug, correct: right, total: sol.parts.length });
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

  /* ------------------------------------------------ Tool Studio frame */
  /* docs/tools-calm.md. studioFrame mounts the calm frame in place of the
     hero (title, back to the tools hub, the Beta note and Report a problem in
     the menu). studioArrange then moves what the tool built (never copies it):
       Explore card (S.card): its figure (.sk-fig, .bt-stage, .bt-hero) to the
         stage; .bt-controls and .bt-buttons to the dock; its heading, lead,
         live explanation (.sk-say) and "Try this" goals to Why; readouts and
         the rest to Details.
       Practice (skillTool): each new problem's stage slot, text and tables to
         the stage; the parts one at a time in the dock (LevlStudio.stepper);
         after Check, the worked solution to Why and the score as a pill; the
         problem code and the Practice / Worked set choice to Details.
       Intro, "How this works" and the draft note to About; anything else
       (the critical value table) to Details.
     A tool sets the explore caption and pills itself (ctx.studio, or
     LevlStudio.get()); o (T.mount's opts.studio) may name a hint:
     { hint: { target: selector, text } }. */
  function studioFrame(app, slug, data){
    var main = app.parentNode, h1 = main.querySelector('.bio-hero h1'), lede = main.querySelector('.bio-hero .lede');
    main.classList.add('ls-host');
    var s = window.LevlStudio.mount({
      title: h1 ? h1.textContent : slug, course: 'AP® Biology', back: base() + 'tools.html', home: base(), slug: 'apbio-' + slug,
      host: app,
      menu: {
        copyLink: function(){
          var code = s.mode() === 'practice' ? s.root.querySelector('.ls-prac-code .bt-code b') : null;
          return code ? location.origin + location.pathname + '?seed=' + code.textContent : location.origin + location.pathname;
        },
        report: { course: 'apbio', id: 'tool:' + slug },
        note: { label: 'Beta.', html: 'This course has not yet been reviewed by an AP® Biology teacher. <a href="' + base() + '../sources.html">Sources</a>' }
      }
    });
    if(lede){ var p = document.createElement('p'); p.textContent = lede.textContent; s.add('about', p); }
    return s;
  }
  function studioArrange(app, s, slug, o){
    var kid = function(sel){ return Array.prototype.filter.call(app.children, function(k){ return k.matches(sel); })[0] || null; };
    var explore = kid('.bt-card'), area = kid('.bt-problem'), modes = kid('.bt-modes');
    ['.bt-draft', '.bt-intro'].forEach(function(sel){ var x = kid(sel); if(x) s.add('about', x); });
    var how = kid('details.bt-how');
    if(how){ how.open = true; s.add('about', how); }
    if(explore && area){
      var start = seedFromUrl() || /#practice\b/.test(location.hash) ? 'practice' : 'explore';
      try{ if(start === 'explore' && localStorage.getItem('apbio_toolmode_' + slug) === 'practice') start = 'practice'; }catch(e){}
      s.modes({ items: [{ value: 'explore', label: 'Explore' }, { value: 'practice', label: 'Practice' }], value: start,
        onChange: function(v){ try{ localStorage.setItem('apbio_toolmode_' + slug, v); }catch(e){} event('apbio-tool-mode', { tool: slug, mode: v }); } });
    }
    studioKeep(s);
    if(explore){
      var only = area ? { mode: 'explore' } : null, parts = [];
      var take = function(x){ if(parts.indexOf(x) < 0) parts.push(x); return x; };
      var ex = function(sel){ return explore.querySelector(':scope > ' + sel); };
      var fig = ex('.sk-fig') || ex('.bt-stage') || ex('.bt-hero');
      if(fig) s.add('stage', take(fig), only);
      (o.stageAlso || []).forEach(function(sel){ var x = ex(sel); if(x) s.add('stage', take(x), only); });
      (o.dock || []).forEach(function(sel){ var x = ex(sel); if(x) s.add('dock', take(x), only); });
      Array.prototype.slice.call(explore.querySelectorAll(':scope > .bt-controls, :scope > .bt-buttons')).forEach(function(c){
        if(c.classList.contains('bt-buttons')) c.classList.add('ls-scroll');
        s.add('dock', take(c), only);
      });
      var why = document.createElement('div'); why.className = 'ls-sec';
      ['.sk-head', '.sk-say', '.sk-goals'].concat(o.why || []).forEach(function(sel){ var x = ex(sel); if(x) why.appendChild(take(x)); });
      s.add('why', why, only);
      var det = document.createElement('div'); det.className = 'ls-sec';
      Array.prototype.slice.call(explore.children).forEach(function(k){ det.appendChild(take(k)); });
      if(det.children.length) s.add('details', det, only);
      explore.remove();
      // The card's own lookups (sec.querySelector) still find its parts.
      studioVirtual(explore, parts);
      if(o.caption || o.pills) studioMirror(s, explore, parts, { live: o.live || '.sk-say', caption: o.caption, pills: o.pills, pillsR: o.pillsR }, only && only.mode, null);
    }
    if(area) studioPractice(s, area, modes, explore ? { mode: 'practice' } : null);
    Array.prototype.slice.call(app.children).forEach(function(k){ if(!k.classList.contains('bt-loading')) s.add('details', k); });
    app.hidden = true;
    var h = o.hint || (explore ? { target: '.sk-grip', text: 'Drag a bar up or down' } : null);
    if(h && s.mode() !== 'practice') s.hint(h);
  }
  function studioPractice(s, area, modes, only){
    var stage = document.createElement('div'), why = document.createElement('div'), det = document.createElement('div');
    stage.className = 'ls-prac-stage'; why.className = 'ls-sec ls-prac-why'; det.className = 'ls-sec ls-prac-code';
    s.add('stage', stage, only); s.add('why', why, only); s.add('details', det, only);
    if(modes){ modes.classList.add('ls-prac-set'); s.add('details', modes, only); }
    area.classList.add('ls-prac');
    s.add('dock', area, only);
    var m = only && only.mode;
    function fresh(){
      var slot = area.querySelector(':scope > .bt-stage-slot');
      if(!slot) return;
      stage.innerHTML = '';
      why.innerHTML = '<h3 class="ls-title-l">Worked solution</h3><p class="ls-sub">It appears here after you check your answers.</p>';
      stage.appendChild(slot);
      // The problem text becomes the caption; the text itself, its tables and
      // the problem code go to Details.
      var ctxEl = area.querySelector(':scope > .bt-context');
      var text = ctxEl ? ctxEl.textContent.replace(/\s+/g, ' ').trim() : '';
      det.innerHTML = '<h3 class="ls-title-l">This problem</h3>';
      Array.prototype.slice.call(area.querySelectorAll(':scope > .bt-context, :scope > .table-wrap')).forEach(function(x){ det.appendChild(x); });
      var code = area.querySelector('.bt-code');
      if(code) det.appendChild(code);
      var h2 = area.querySelector('.bt-prob-head h2');
      if(h2) h2.classList.add('sr-only');
      var form = area.querySelector('form.bt-parts');
      if(form) window.LevlStudio.stepper(form, { items: ':scope > .bt-part', submit: ':scope > .bt-actions',
        done: function(){ return !!form.querySelector('.bt-part.is-right, .bt-part.is-wrong'); } });
      s.caption(esc(text), m); s.pills([], 'left', m);
    }
    function checked(){
      var sol = area.querySelector(':scope > .bt-solution'), res = area.querySelector('.bt-result'), t = res ? res.textContent : '';
      if(!sol || sol.hidden){ if(t) s.caption(esc(t), m); return; }
      why.innerHTML = '';
      why.appendChild(sol);
      var mm = /(\d+) of (\d+)/.exec(t);
      if(mm) s.pills([{ html: mm[1] + ' of ' + mm[2] + ' right', tone: mm[1] === mm[2] ? 'good' : 'warn' }], 'left', m);
      s.caption((mm ? '<b>' + mm[1] + ' of ' + mm[2] + ' parts right.</b> ' : '') + 'The worked solution is under Why.', m);
      var nx = area.querySelector('.bt-next .btn-press');
      if(nx) nx.classList.add('ls-btn', 'ls-pri');
    }
    if(window.MutationObserver) new MutationObserver(fresh).observe(area, { childList: true });
    area.addEventListener('submit', function(){ setTimeout(checked, 0); });
    fresh();
  }

  /* ------------------------------------------ Tool Studio: simulators */
  /* studioSim(app, s, slug, o): T.mount(slug, fn, { studio: { sim: true, ... } }).
     A simulator card's parts move into the studio; the card stays (hidden)
     and its querySelector / querySelectorAll also search the moved parts
     (studioVirtual), so the tool's card.querySelector(...) keeps working.
       Modes: the tool's own .os-modes buttons ([data-m] / [data-q]) become
         the studio's switch (o.modeLabels shortens labels); picking one
         clicks the tool's button, and a switch the tool makes itself is
         followed. "Questions" (the stimulus questions and the mini FRQ) is
         added when the page has them.
       Each card (o.cards[i] for a page with several, else o): stage (the
         figure: o.stage selectors, default the .bt-hero), dock (o.dock
         selectors, default .os-chal, .os-play, then the first n controls
         of .bt-controls[data-primary=n], o.primary overrides n), Why (the
         heading, .bt-first, the live explanation o.live (default .os-why),
         o.why), Details (readouts, equations, graphs, trials, data tables,
         then "More settings": the other controls).
       Caption and pills: o.caption(g) / o.pills(g) -> html / pill list, run
         after every change; g.ro(i) is readout row i's value, g.live the
         live explanation's text, g.$ the virtual card's querySelector. The
         default caption is the live explanation's first sentence.
       Questions: the stimulus (and the FRQ's heading and intro) on the
         stage, one question or FRQ part at a time in the dock. */
  function firstSentence(t){
    t = String(t || '').replace(/\s+/g, ' ').trim();
    var m = /^(.+?[.!?])(\s|$)/.exec(t);
    return m ? m[1] : t;
  }
  function studioVirtual(el, parts){
    var P = Element.prototype.querySelector, PA = Element.prototype.querySelectorAll;
    function list(){ return (typeof parts === 'function' ? parts() : parts).filter(function(p){ return p.isConnected && !el.contains(p); }); }
    el.querySelector = function(sel){
      var r = P.call(el, sel);
      if(r) return r;
      list().some(function(p){ r = p.matches(sel) ? p : P.call(p, sel); return !!r; });
      return r;
    };
    el.querySelectorAll = function(sel){
      var out = Array.prototype.slice.call(PA.call(el, sel));
      list().forEach(function(p){ if(p.matches(sel)) out.push(p); Array.prototype.push.apply(out, Array.prototype.slice.call(PA.call(p, sel))); });
      return out.filter(function(x, i){ return out.indexOf(x) === i; });
    };
    return el;
  }
  function studioKeep(s){
    var hosts = {};
    s.keepHost = function(){
      var m = s.mode() || '*';
      if(!hosts[m]){
        hosts[m] = document.createElement('div');
        hosts[m].className = 'ls-sec ls-keephost';
        s.add('why', hosts[m], s.mode() ? { mode: m } : null);
      }
      return hosts[m];
    };
  }
  function studioSim(app, s, slug, o){
    var kids = Array.prototype.slice.call(app.children);
    var qcard = kids.filter(function(k){ return k.classList.contains('bt-card') && k.querySelector('.bt-qs'); })[0] || null;
    var frq = kids.filter(function(k){ return k.classList.contains('bt-frq'); })[0] || null;
    var cards = kids.filter(function(k){ return k.classList.contains('bt-card') && k !== qcard; });
    ['.bt-draft', '.bt-intro'].forEach(function(sel){ kids.forEach(function(k){ if(k.matches(sel)) s.add('about', k); }); });
    kids.forEach(function(k){ if(k.matches('details.bt-how')){ k.open = true; s.add('about', k); } });
    studioKeep(s);
    var cfgs = o.cards || [o];
    // The modes: one per card (o.cards[i].mode / label), else the tool's own.
    var simModes = [], P = Element.prototype.querySelector, PA = Element.prototype.querySelectorAll;
    var om = cards[0] ? P.call(cards[0], '.os-modes') : null;
    if(o.cards) cfgs.forEach(function(c, i){ simModes.push({ value: c.mode || 'card' + i, label: c.label, card: i }); });
    else if(om) Array.prototype.forEach.call(PA.call(om, '[data-m], [data-q]'), function(b){
      var v = b.getAttribute('data-m') || b.getAttribute('data-q');
      simModes.push({ value: v, label: (o.modeLabels || {})[v] || b.textContent.trim(), btn: b });
    });
    if(!simModes.length) simModes.push({ value: 'explore', label: 'Explore' });
    var hasQ = !!(qcard || frq), many = simModes.length > 1 || hasQ;
    var all = simModes.map(function(m){ return m.value; }).join(' ');
    var items = simModes.map(function(m){ return { value: m.value, label: m.label }; });
    if(hasQ) items.push({ value: 'questions', label: o.questionsLabel || 'Questions' });
    var start = simModes[0].value;
    simModes.forEach(function(m){ if(m.btn && m.btn.getAttribute('aria-pressed') === 'true') start = m.value; });
    if(hasQ && /^#(questions|frq)\b/.test(location.hash)) start = 'questions';
    if(many) s.modes({ items: items, value: start, onChange: function(v){
      var m = simModes.filter(function(x){ return x.value === v; })[0];
      if(m && m.btn && m.btn.getAttribute('aria-pressed') !== 'true') m.btn.click();
      if(o.onMode) o.onMode(v);
      event('apbio-tool-mode', { tool: slug, mode: v });
    } });
    // A switch the tool makes itself (a deep link, "Next challenge") is followed.
    if(window.MutationObserver) simModes.forEach(function(m){
      if(!m.btn) return;
      new MutationObserver(function(){
        if(m.btn.getAttribute('aria-pressed') === 'true' && s.mode() !== m.value && s.mode() !== 'questions') s.mode(m.value);
      }).observe(m.btn, { attributes: true, attributeFilter: ['aria-pressed'] });
    });
    cards.forEach(function(card, i){
      var cfg = cfgs[i] || {};
      var only = many ? { mode: o.cards ? simModes[i].value : all } : null;
      studioCard(s, card, cfg, only, i === 0 ? om : null);
    });
    if(hasQ) studioQuestions(s, qcard, frq, many ? { mode: 'questions' } : null, o);
    // Whatever is left (a second card's extras) goes to Details.
    Array.prototype.slice.call(app.children).forEach(function(k){ if(cards.indexOf(k) < 0 && !k.classList.contains('bt-loading')) s.add('details', k); });
    app.hidden = true;
    s.mode(start);
    var h = o.hint || (cfgs[0] && cfgs[0].hint);
    if(h && s.mode() !== 'questions') s.hint(h);
  }
  function studioCard(s, card, cfg, only, om){
    var parts = [], P = Element.prototype.querySelector, PA = Element.prototype.querySelectorAll;
    var find = function(sel){ return sel ? P.call(card, sel) : null; };
    var m = only && only.mode;
    // Pick everything first, then move (moving changes what :scope finds).
    var stageEls = [], dockEls = [], whyEls = [];
    var fig = null;
    (cfg.stage || ['.bt-hero', '.bt-stage-slot', '.bt-fig', '.bt-stage']).some(function(sel){ fig = find(sel); return !!fig; });
    if(fig) stageEls.push(fig);
    (cfg.stageAlso || []).forEach(function(sel){ var x = find(sel); if(x && stageEls.indexOf(x) < 0) stageEls.push(x); });
    var ctl = find('.bt-controls[data-primary]') || (cfg.primary != null ? find('.bt-controls') : null);
    var n = cfg.primary != null ? cfg.primary : ctl ? +ctl.getAttribute('data-primary') || 0 : 0;
    var prim = null;
    if(ctl && (n > 0 || cfg.primarySel)){ prim = document.createElement('div'); prim.className = 'bt-controls ls-primary'; }
    (cfg.dock || ['.os-chal', '.os-play', '@primary']).forEach(function(sel){
      if(sel === '@primary'){ if(prim) dockEls.push(prim); return; }
      var x = find(sel); if(x && dockEls.indexOf(x) < 0 && stageEls.indexOf(x) < 0) dockEls.push(x);
    });
    var h2 = find(':scope > h2'), live = find(cfg.live || '.os-why'), first = find('.bt-first');
    [h2, find('.bt-first')].concat((cfg.why || []).map(find)).concat([live]).forEach(function(x){ if(x && whyEls.indexOf(x) < 0 && dockEls.indexOf(x) < 0) whyEls.push(x); });
    if(h2){ h2.classList.add('ls-title-l'); }
    function take(x){ if(parts.indexOf(x) < 0) parts.push(x); return x; }
    studioVirtual(card, parts);
    stageEls.forEach(function(x){ s.add('stage', take(x), only); });
    // The primary controls: the first n of the tool's .bt-controls. A tool
    // that rebuilds its controls (ctl.innerHTML = '') gets them re-split.
    function split(){
      if(!prim) return;
      prim.innerHTML = '';
      (cfg.primarySel ? Array.prototype.slice.call(PA.call(ctl, cfg.primarySel)) : Array.prototype.slice.call(ctl.children, 0, n)).forEach(function(c){ prim.appendChild(take(c)); });
    }
    split();
    if(prim){
      studioVirtual(ctl, function(){ return Array.prototype.slice.call(prim.children); });
      if(window.MutationObserver){
        var mo = new MutationObserver(function(recs){
          var cleared = recs.some(function(r){ return r.removedNodes.length && !r.addedNodes.length; });
          if(cleared || ctl.children.length && !prim.children.length){ split(); mo.takeRecords(); }
        });
        mo.observe(ctl, { childList: true });
      }
    }
    dockEls.forEach(function(x){ if(x.classList.contains('bt-buttons')) x.classList.add('ls-scroll'); s.add('dock', take(x), only); if(x.classList.contains('os-chal')) chalSteps(x); });
    var why = document.createElement('div'); why.className = 'ls-sec ls-sim-why';
    whyEls.forEach(function(x){ why.appendChild(take(x)); });
    s.add('why', why, only);
    // Details: what is left of the card, then the other controls.
    var det = document.createElement('div'); det.className = 'ls-sec ls-sim-det';
    if(om){
      Array.prototype.forEach.call(PA.call(om, 'a[href]'), function(a){ a.classList.add('ls-linkrow'); det.appendChild(take(a)); });
      om.hidden = true;
    }
    Array.prototype.slice.call(card.children).forEach(function(k){ if(k !== ctl) det.appendChild(take(k)); });
    if(ctl){
      ctl.hidden = false;
      var mh = document.createElement('h3'); mh.className = 'ls-h'; mh.textContent = cfg.moreTitle || 'More settings';
      var mw = document.createElement('div'); mw.className = 'ls-sec ls-more-set';
      mw.appendChild(mh); mw.appendChild(take(ctl));
      det.appendChild(mw);
    }
    s.add('details', det, only);
    card.hidden = true;
    studioMirror(s, card, parts, cfg, m, first);
  }
  /* Caption and pills from a card's live parts, repainted after every
     change in them (a frame later): cfg.caption(g) / cfg.pills(g) /
     cfg.pillsR(g), g = { ro(i), live, $(sel) }; default caption: the live
     explanation's (cfg.live, default .os-why) first sentence, else the
     card's first-use line. m: the studio modes (space separated) they
     belong to. */
  function studioMirror(s, card, parts, cfg, m, first){
    var g = { $: function(sel){ return card.querySelector(sel); } };
    g.ro = function(i){ var r = card.querySelectorAll('.bt-readout > div')[i], d = r && r.querySelector('dd'); return d ? d.textContent.replace(/\s+/g, ' ').trim() : ''; };
    var queued = false;
    function paint(){
      queued = false;
      var live = card.querySelector(cfg.live || '.os-why');
      g.live = live ? live.textContent.replace(/\s+/g, ' ').trim() : '';
      var cap = cfg.caption ? cfg.caption(g) : g.live ? esc(firstSentence(g.live)) : first ? esc(first.textContent) : null;
      var pl = cfg.pills ? cfg.pills(g) || [] : null, pr = cfg.pillsR ? cfg.pillsR(g) || [] : null;
      // The tool hides its readouts while a prediction is open: so do the pills.
      var roEl = card.querySelector('.bt-readout');
      if(roEl && roEl.hidden && !cfg.pillsAlways){ if(pl) pl = []; if(pr) pr = []; }
      // Caption and pills are kept per studio mode: set them for each of this card's modes.
      (m ? m.split(' ') : [null]).forEach(function(mm){
        if(cap != null) s.caption(cap, mm);
        if(pl) s.pills(pl, 'left', mm);
        if(pr) s.pills(pr, 'right', mm);
      });
    }
    function queue(){ if(!queued){ queued = true; requestAnimationFrame(paint); } }
    if(window.MutationObserver){
      var watch = new MutationObserver(queue);
      parts.forEach(function(x){ watch.observe(x, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'aria-pressed'] }); });
    }
    paint();
    return queue;
  }
  /* A challenge box the tool rewrites (innerHTML) for every new challenge:
     two or more questions in it become one step at a time; its own Check
     (.bt-actions) shows on the last step. Each new challenge gets a fresh
     wrapper and stepper, so an old stepper never touches the new one. */
  function chalSteps(box){
    function wrap(){
      if(box.querySelector('.ls-chal-steps')) return;
      var fs = Array.prototype.filter.call(box.children, function(k){ return k.tagName === 'FIELDSET'; });
      if(fs.length < 2) return;
      var w = document.createElement('div'); w.className = 'ls-chal-steps';
      box.insertBefore(w, fs[0]);
      fs.forEach(function(f){ w.appendChild(f); });
      var act = w.nextElementSibling && w.nextElementSibling.classList.contains('bt-actions') ? w.nextElementSibling : null;
      if(act) w.appendChild(act);
      window.LevlStudio.stepper(w, { items: ':scope > fieldset', submit: act ? ':scope > .bt-actions' : null, label: 'Part',
        done: function(){ return !!w.querySelector('input:disabled'); } });
    }
    if(window.MutationObserver) new MutationObserver(wrap).observe(box, { childList: true });
    wrap();
  }
  function studioQuestions(s, qcard, frq, only, o){
    var stage = document.createElement('div'), dock = document.createElement('div');
    stage.className = 'ls-q-stage'; dock.className = 'ls-qs';
    s.add('stage', stage, only);
    var stims = qcard ? Array.prototype.slice.call(qcard.querySelectorAll('.bio-stim')) : [];
    stims.forEach(function(x){ stage.appendChild(x); });
    var head = null;
    if(qcard){ var h = qcard.querySelector('h2'); if(h) h.classList.add('sr-only'); dock.appendChild(qcard); }
    if(frq){
      head = document.createElement('div'); head.className = 'ls-frq-head';
      var fh = frq.querySelector(':scope > h2'), fi = frq.querySelector(':scope > .bt-frq-intro');
      if(fh){ fh.classList.add('ls-title-l'); head.appendChild(fh); }
      if(fi) head.appendChild(fi);
      stage.appendChild(head);
      dock.appendChild(frq);
    }
    s.add('dock', dock, only);
    var m = only && only.mode;
    var st = window.LevlStudio.stepper(dock, { items: '.bio-q, .bt-frq-part', submit: '.bt-frq > .bt-actions, .bt-frq > .bt-frq-total', label: 'Question',
      done: function(){ return !!(frq && frq.querySelector('.bt-rubric')); } });
    var last = null;
    function sync(){
      var cur = Array.prototype.filter.call(dock.querySelectorAll('.bio-q, .bt-frq-part'), function(x){ return !x.classList.contains('ls-step-off'); });
      var review = dock.classList.contains('is-review');
      var inFrq = review || (cur[0] && frq && frq.contains(cur[0]));
      var key = review ? 'r' : inFrq ? 'f' : 'q';
      if(key === last) return;
      last = key;
      stims.forEach(function(x){ x.hidden = !!inFrq; });
      if(head) head.hidden = !inFrq;
      s.caption(review ? 'Tick each rubric point your answer earns, then save your score.'
        : inFrq ? 'Write your answer in your own words; the rubric and a sample answer come after the last part.'
        : 'Answer from the data shown. Each answer is checked and explained right away.', m);
    }
    if(window.MutationObserver) new MutationObserver(function(){ requestAnimationFrame(sync); }).observe(dock, { subtree: true, attributes: true, attributeFilter: ['class'] });
    sync();
    return st;
  }

  window.ApBioTools = {
    studioVirtual: studioVirtual, studioKeep: studioKeep, firstSentence: firstSentence,
    esc: esc, F: F, nid: nid, mount: mount, slider: slider, choiceSelect: choiceSelect, announcer: announcer,
    plot: plot, barPath: barPath, niceMax: niceMax, niceStep: niceStep, dataTable: dataTable, wrapTables: wrapTables, box: box,
    record: record, report: report, event: event, questions: questions, frq: frq, skillTool: skillTool,
    gradePart: gradePart, partHtml: partHtml, unitOf: unitOf
  };
})();
