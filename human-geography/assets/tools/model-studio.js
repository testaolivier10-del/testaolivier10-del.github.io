/* Model Studio page (docs/aphug-spec.md sections 3.1 and 6). OWNED BY THIS TOOL
   ONLY (builder T1). Mounts into #app with ApHugTools.mount; the model is
   ApHugMath.modelStudio (assets/tools/math/model-studio.js), the content
   human-geography/data/tools/model-studio.json (served filtered: a model
   shows once its topic is published). The frame is ApHugTools.modes on the
   Tool Studio.

   Explore: pick a model. "See it" draws it on the stage and steps through
   its places one at a time (Next, Back, Show all), each with why it goes
   there; Why holds the core idea, what it assumes and its limits. "Build it"
   gives the pieces to place (ApHugModel: tap or drag), graded with Check,
   the first slip named. "Test yourself on this model" opens the drill on it.

   Test yourself: ApHugTools.drill with ApHugMath.modelStudio.generate: build
   it, apply it to a case (map, plot or table on the stage), find a limit.
   The stage shows each step's own figure. Free: Explore for every model and
   the demographic transition drills; without the pass the other drills are
   left out of the drill and the Premium gate shows where they were. */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath, Mdl = window.ApHugModel, PL = window.ApHugPlot;
  if(!T || !M || !M.modelStudio || M.modelStudio.stub || !Mdl) return;
  var MS = M.modelStudio, esc = T.esc, SLUG = 'model-studio';
  try{ document.body.classList.add('ms-page'); }catch(e){}

  function core(){ return window.ApHugCore; }
  /* Spec section 6: free is Explore plus the drills of a context marked
     free (the demographic transition only). Every other drill is Premium
     even when its topic's lesson is free (the epidemiological transition
     sits on topic 2.5 too), so the gate is the whole-tool one: locked()
     with no unit is true for a free user once Premium has launched. */
  function locked(ctx){ var c = core(); if(ctx && ctx.free) return false; try{ return !!(c && c.locked && c.locked()); }catch(e){ return false; } }
  function lower(s){ return s.charAt(0).toLowerCase() + s.slice(1); }

  /* Base maps, fetched once each and only when a case needs one. */
  var bases = {};
  /* The tool page loads hug-map.js (build-aphug.mjs toolShell). */
  function needMap(){ return Promise.resolve(window.ApHugMap); }
  function baseOf(id){
    if(!bases[id]) bases[id] = needMap().then(function(){ return fetch((window.ApHugBase || '../') + 'figures/base/' + id + '.json'); }).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); });
    return bases[id];
  }

  /* ------------------------------------------------------- pictures */
  function legendHtml(list){
    if(!list || !list.length) return '';
    return '<ul class="ms-legend">' + list.map(function(l){ return '<li><span class="ms-sw ms-sw-' + esc(l.sw) + '" aria-hidden="true"></span>' + esc(l.text) + '</li>'; }).join('') + '</ul>';
  }
  /* The build figure: a drawn figure with its numbered spots (and short
     labels) in HTML over it, or the model's own numbered drawing. */
  function modelFig(ctx, model){
    var f = ctx.figure ? MS.figure(ctx.figure) : null;
    if(!f){
      return '<figure class="ms-fig ms-fig-art" data-layout="' + esc(model.layout) + '"><div class="ms-card"><div class="hug-model-art">' + Mdl.artSvg(model) + '</div></div>' + '</figure>';
    }
    var over = [];
    f.spots.forEach(function(list, i){ list.forEach(function(p){ over.push('<span class="ms-badge" data-n="' + (i + 1) + '" style="left:' + p[0] + '%;top:' + p[1] + '%">' + (i + 1) + '</span>'); }); });
    (f.labels || []).forEach(function(l){ over.push('<span class="ms-tag" style="left:' + l.x + '%;top:' + l.y + '%">' + esc(l.text) + '</span>'); });
    return '<figure class="ms-fig"><div class="ms-card"><div class="ms-pic">' + f.svg + '<div class="ms-over" aria-hidden="true">' + over.join('') + '</div></div>' + legendHtml(f.legend) + '</div></figure>';
  }
  function mark(figEl, n, state){
    if(!figEl) return;
    figEl.querySelectorAll('.ms-badge, .hug-model-band, .hug-model-num').forEach(function(b){
      var k = +(b.getAttribute('data-n') || (b.classList.contains('hug-model-num') ? b.textContent : 0));
      b.classList.toggle('is-cur', k === n);
      b.classList.toggle('is-dim', state && state.upto != null && k > state.upto);
    });
  }
  function mapHtml(spec, base){
    var MAP = window.ApHugMap;
    var over = MAP.overlay(spec, base).filter(function(o){ return o.x != null; }).map(function(o){ return '<span class="hug-map-' + o.kind + (o.low ? ' is-low' : '') + '" style="left:' + o.x + '%;top:' + o.y + '%">' + esc(o.text) + '</span>'; }).join('');
    var src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(MAP.svg(spec, base));
    return '<figure class="hug-map ms-map" data-render="' + esc(spec.render) + '"><div class="hug-map-pic"><img src="' + src + '" alt="' + esc(spec.label) + '" width="' + base.width + '" height="' + base.height + '">' + (over ? '<div class="hug-map-over" aria-hidden="true">' + over + '</div>' : '') + '</div>' + MAP.legendHtml(spec, base) +
      '<figcaption class="hug-small">' + (spec.invented ? '<span class="hug-src">Invented data for practice.</span> ' : '') + '<span class="hug-border-note">' + esc(MAP.note(base)) + '</span>' + (base.invented ? '' : ' <span class="hug-base-src">Base map: Natural Earth.</span>') + '</figcaption></figure>';
  }
  function applyFig(host, fig){
    if(!fig){ host.innerHTML = ''; return; }
    if(fig.kind === 'plot') host.innerHTML = '<figure class="ms-fig ms-plotfig"><div class="ms-card">' + PL.svg(fig.spec) + '<p class="ms-src">Invented data for practice.</p></div></figure>';
    else if(fig.kind === 'table') host.innerHTML = '<figure class="ms-fig ms-tblfig">' + T.dataTable(fig.cols, fig.rows, fig.caption) + '</figure>';
    else if(fig.kind === 'map'){
      host.innerHTML = '<p class="bt-loading">Loading the map…</p>';
      baseOf(fig.map.base).then(function(b){ if(host.isConnected !== false) host.innerHTML = mapHtml(fig.map, b); }, function(){ host.innerHTML = '<p class="hug-small" role="alert">The map could not load. ' + esc(fig.map.label) + '.</p>'; });
    }
  }
  function groupedOptions(list){
    var units = [];
    list.forEach(function(c){ if(units.indexOf(c.unit) < 0) units.push(c.unit); });
    return units.map(function(u){ return '<optgroup label="' + esc(u) + '">' + list.filter(function(c){ return c.unit === u; }).map(function(c){ return '<option value="' + esc(c.id) + '">' + esc(c.name) + (locked(c) ? ' (drills: Premium)' : '') + '</option>'; }).join('') + '</optgroup>'; }).join('');
  }

  T.mount(SLUG, function(app, data){
    var ex = null, qz = null;
    var md = T.modes(app, { slug: SLUG,
      explore: function(host){ ex = explore(host, data, function(ctx){ if(qz) qz.pick(ctx); else want = ctx; md.show('quiz', true); }); },
      quiz: function(host){ qz = quiz(host, data); if(want){ qz.pick(want); want = null; } },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
    var want = null;
  });

  /* ============================================================ explore */
  function explore(host, data, practise){
    var list = data.contexts || [], nid = T.nid('msx'), LS = null, touched = false;
    var ctx = list[0], model = null, view = 'see', upto = 0, mctl = null, graded = false;
    host.innerHTML = '<section class="bt-problem ms-x" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Model Studio</h2>' +
      '<div class="ms-stage"><div class="ms-figslot"></div><ol class="ms-skey" aria-hidden="true"></ol></div>' +
      '<div class="ms-ctl">' +
        '<div class="ms-row"><label class="ms-l" for="' + nid + '-m">Model</label><select class="bt-select ms-pick" id="' + nid + '-m">' + groupedOptions(list) + '</select></div>' +
        '<div class="ls-seg ms-views" role="group" aria-label="View"><button type="button" data-v="see" aria-pressed="true">See it</button><button type="button" data-v="build" aria-pressed="false">Build it</button></div>' +
        '<div class="ms-see"><div class="ms-steprow" data-ls-primary><button type="button" class="bt-btn ms-back">Back</button><button type="button" class="btn-press sm ls-btn ls-pri ms-next">Next place</button><button type="button" class="bt-btn ms-all">Show all</button></div><ol class="ms-key"></ol></div>' +
        '<div class="ms-build" hidden><div class="ms-mhost"></div><div class="bt-actions"><button type="button" class="btn-press sm ls-btn ls-pri ms-check">Check</button><button type="button" class="bt-btn ms-again">Start over</button></div><div class="cd-fb ms-fb" role="status" aria-live="polite"></div></div>' +
        '<p class="ms-cap" aria-live="polite"></p>' +
        '<div class="ms-go"><button type="button" class="bt-btn ms-drill">Test yourself on this model</button></div><div class="ms-gate"></div>' +
      '</div>' +
      '<div class="ms-say"></div>' +
      '<div class="ms-nums"></div></section>';
    var R = { stage: host.querySelector('.ms-stage'), fig: host.querySelector('.ms-figslot'), skey: host.querySelector('.ms-skey'), ctl: host.querySelector('.ms-ctl'), pick: host.querySelector('.ms-pick'), views: host.querySelector('.ms-views'),
      see: host.querySelector('.ms-see'), key: host.querySelector('.ms-key'), build: host.querySelector('.ms-build'), mhost: host.querySelector('.ms-mhost'), fb: host.querySelector('.ms-fb'),
      cap: host.querySelector('.ms-cap'), say: host.querySelector('.ms-say'), nums: host.querySelector('.ms-nums'), gate: host.querySelector('.ms-gate'),
      back: host.querySelector('.ms-back'), next: host.querySelector('.ms-next') };
    var cue = T.cue('Press Next place to see the model built one piece at a time, or switch to Build it.');
    R.ctl.insertBefore(cue.el, R.ctl.firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function slotKey(i){ return model.slots[i].id; }
    function piece(i){ return Mdl.pieceText(model, model.key[slotKey(i)]); }
    function why(i){ return (ctx.explain || {})[slotKey(i)] || ''; }
    function caption(html){ R.cap.innerHTML = html; if(LS) LS.caption(html, 'explore'); }

    function pickModel(id){
      ctx = list.filter(function(c){ return c.id === id; })[0] || list[0];
      R.pick.value = ctx.id;
      // A generated model (rank-size, gravity) is drawn from one fixed seed.
      model = MS.buildModel(M.rng(1), ctx);
      upto = 0; R.gate.innerHTML = '';
      R.fig.innerHTML = modelFig(ctx, model);
      if(LS && LS.fit) setTimeout(function(){ LS.fit(); }, 0);
      buildPane(); paintSee(); whyBox(); details();
    }
    function paintSee(){
      var n = model.slots.length, figEl = R.fig.querySelector('.ms-fig');
      R.skey.innerHTML = view === 'see' ? model.slots.map(function(s, i){ return i < upto ? '<li class="' + (i === upto - 1 ? 'is-cur' : '') + '"><span class="ms-n">' + (i + 1) + '</span><span>' + piece(i) + '</span></li>' : ''; }).join('') : '';
      R.key.innerHTML = model.slots.map(function(s, i){
        if(i >= upto) return '';
        return '<li class="' + (i === upto - 1 ? 'is-cur' : '') + '"><span class="ms-n" aria-hidden="true">' + (i + 1) + '</span><span><b>' + esc(Mdl.slotName(model, i)) + ':</b> ' + piece(i) + (i === upto - 1 && why(i) ? '<span class="ms-why">' + esc(why(i)) + '</span>' : '') + '</span></li>';
      }).join('');
      R.back.disabled = upto === 0; R.next.disabled = upto >= n;
      R.next.textContent = upto === 0 ? 'Start: the first place' : upto >= n ? 'All places shown' : 'Next place';
      mark(figEl, upto, view === 'see' && upto ? { upto: upto } : null);
      if(view === 'see') caption(upto ? '<b>' + esc(Mdl.slotName(model, upto - 1)) + ': ' + piece(upto - 1) + '.</b> ' + esc(why(upto - 1)) : '<b>' + esc(ctx.name) + '.</b> ' + esc(ctx.claim));
      if(LS) LS.pills(upto ? [{ html: upto + ' of ' + n + ' places', tone: 'readout' }] : [{ html: esc(ctx.unit), tone: 'ghost' }], 'left', 'explore');
    }
    function buildPane(){
      var bm = MS.buildModel(M.rng(7 + list.indexOf(ctx)), ctx);
      R.mhost.innerHTML = Mdl.html(bm, nid + '-b');
      graded = false; R.fb.innerHTML = '';
      var ck = host.querySelector('.ms-check'); if(ck) ck.disabled = false;
      R.fig.querySelectorAll('.ms-badge').forEach(function(b){ b.classList.remove('is-ok', 'is-no'); });
      mctl = Mdl.mount(R.mhost.querySelector('.hug-model'), bm, { onChange: function(){ act(); if(!graded) R.fb.innerHTML = ''; } });
      mctl.model = bm;
    }
    function check(){
      var g = Mdl.grade(mctl.model, mctl.get());
      if(!g.valid){ R.fb.innerHTML = '<span class="bt-small">Fill every place first.</span>'; return; }
      graded = true; mctl.lock(g);
      var fe = R.fig.querySelector('.ms-fig');
      if(fe) g.results.forEach(function(x, i){ fe.querySelectorAll('.ms-badge[data-n="' + (i + 1) + '"]').forEach(function(b){ b.classList.add(x.ok ? 'is-ok' : 'is-no'); }); });
      host.querySelector('.ms-check').disabled = true;
      R.fb.innerHTML = g.correct ? '<span class="hug-mark ok">Correct</span> Every piece is in its place.' : '<span class="hug-mark no">Not yet</span> ' + esc(g.slip) + ' (' + g.right + ' of ' + g.total + ' in place.) Press Start over to try again.';
      caption(g.correct ? '<b>Built.</b> ' + esc(ctx.claim) : '<b>' + g.right + ' of ' + g.total + ' in place.</b> ' + esc(g.slip));
      if(LS) LS.pills([{ html: g.right + ' of ' + g.total + ' in place', tone: g.correct ? 'good' : 'warn' }], 'left', 'explore');
    }
    function setView(v){
      view = v;
      R.views.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
      R.see.hidden = v !== 'see'; R.build.hidden = v !== 'build';
      if(v === 'build'){ mark(R.fig.querySelector('.ms-fig'), 0, null); R.skey.innerHTML = ''; caption('Tap a piece, then the place it belongs: the numbers match the drawing. Then press Check.'); if(LS) LS.pills([{ html: 'Build it', tone: 'ghost' }], 'left', 'explore'); }
      else paintSee();
    }
    function whyBox(){
      var L = ctx.limits || {};
      var body = '<p>' + esc(ctx.origin) + (ctx.aside ? ' <span class="hug-aside">' + esc(ctx.aside) + '</span>' : '') + '</p>' +
        '<h4 class="ms-h4">What it assumes</h4><ul>' + (ctx.assumes || []).map(function(a){ return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' +
        '<h4 class="ms-h4">Where it fails</h4><ul>' + (L.right || []).map(function(x){ return '<li><b>' + esc(x.t) + '.</b> ' + esc(x.why) + '</li>'; }).join('') + '</ul>' +
        '<p class="bt-small">A model is a simplified idea, not a fact. On the exam, say what it assumes and where it fits poorly.</p>';
      T.explain(R.say, '<b>' + esc(ctx.name) + '.</b> ' + esc(ctx.claim), body);
      if(LS && LS.setupRow) LS.setupRow.open();
    }
    function details(){
      R.nums.innerHTML = '<h3 class="ls-title-l">' + esc(ctx.name) + '</h3><p>' + esc(ctx.claim) + '</p><h4 class="ms-h4">Every place</h4><ol class="ms-all">' +
        model.slots.map(function(s, i){ return '<li><b>' + esc(Mdl.slotName(model, i)) + ':</b> ' + piece(i) + (why(i) ? '. ' + esc(why(i)) : '') + '</li>'; }).join('') + '</ol>';
    }
    function drill(){
      if(locked(ctx)){
        var c = core(), g = c && c.gate ? c.gate('tools', SLUG, ctx.topic) : '';
        R.gate.innerHTML = '<p class="bt-small">The drills for this model are part of Premium. Explore stays free for every model, and the demographic transition drills are free.</p>' + (g || '');
        return;
      }
      practise(ctx);
    }
    function onClick(e){
      var b = e.target.closest('button'); if(!b) return;
      if(b.parentNode === R.views){ act(); setView(b.getAttribute('data-v')); }
      else if(b.classList.contains('ms-next')){ act(); if(upto < model.slots.length){ upto++; paintSee(); } }
      else if(b.classList.contains('ms-back')){ act(); if(upto > 0){ upto--; paintSee(); } }
      else if(b.classList.contains('ms-all')){ act(); upto = model.slots.length; paintSee(); }
      else if(b.classList.contains('ms-check')) check();
      else if(b.classList.contains('ms-again')){ buildPane(); setView('build'); }
      else if(b.classList.contains('ms-drill')) drill();
    }
    host.addEventListener('click', onClick);
    R.pick.addEventListener('change', function(){ act(); pickModel(R.pick.value); setView(view); });
    function studio(pane, s){
      LS = s;
      R.cap.classList.add('sr-only'); R.cap.removeAttribute('aria-live');
      var sp = T.studioPane(pane, s, { stage: [R.stage], dock: [R.ctl], why: [R.say], details: [R.nums] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      paintSee();
      if(s.mode() === 'explore') T.hintSlot(s, R.next, 'Start here: see the model built one place at a time');
    }
    pickModel(ctx.id);
    return { studio: studio };
  }

  /* ======================================================= test yourself */
  function quiz(host, data){
    var all = data.contexts || [], open = all.filter(function(c){ return !locked(c); }), shut = all.filter(locked);
    var d2 = {}; Object.keys(data).forEach(function(k){ d2[k] = data[k]; });
    d2.contexts = open.length ? open : all;
    var shown = { host: null, p: null, fig: null };
    function show(which){
      if(!shown.host || !shown.p || shown.fig === which) return;
      shown.fig = which;
      var p = shown.p, f = which === 'apply' ? p.figs.apply : null;
      if(f) applyFig(shown.host, f);
      else { var ctx = all.filter(function(c){ return c.id === p.ctx; })[0]; shown.host.innerHTML = modelFig(ctx, p.steps[0].model); }
      var st = T.studioOf(host); if(st && st.fit) setTimeout(function(){ st.fit(); }, 0);
    }
    T.drill(host, d2, { slug: SLUG, noun: 'drill', newLabel: 'New problem', typeLabel: 'Model', mixedLabel: 'Any model',
      types: d2.contexts.map(function(c){ return { value: c.types[0], label: c.name }; }),
      generate: function(r, ctx, type){ return MS.generate(r, ctx, type); },
      title: function(p){ return p.title; },
      extra: function(el, p){ el.innerHTML = '<div class="ms-qfig"></div>'; shown = { host: el.querySelector('.ms-qfig'), p: p, fig: null }; show(p.steps[0].fig); },
      onStep: function(s){ var p = shown.p, i = p.steps.indexOf(s), nx = p.steps[i + 1]; if(nx) show(nx.fig); } });
    var sel = document.querySelector('.cd-more .bt-pick select');
    if(shut.length && open.length){
      var more = document.querySelector('.cd-more .bt-more-b'), c = core(), g = c && c.gate ? c.gate('tools', SLUG, 'transition-model') : '';
      if(more){ var n = document.createElement('div'); n.className = 'ms-qgate'; n.innerHTML = '<p class="bt-small">Free: the demographic transition drills. The drills for the other ' + shut.length + ' models are part of Premium; Explore stays free for all of them.</p>' + g; more.appendChild(n); var dm = more.closest('details'); if(dm) dm.hidden = false; }
    }
    return {
      pick: function(ctx){ if(sel && ctx && [].some.call(sel.options, function(o){ return o.value === ctx.types[0]; })){ sel.value = ctx.types[0]; sel.dispatchEvent(new Event('change')); } }
    };
  }
})();
