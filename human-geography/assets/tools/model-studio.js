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
    // Gravity and rank-size are drawn from the generated model's own numbers.
    var f = ctx.figure ? MS.figure(ctx.figure, ctx.build ? model : null) : null;
    if(!f){
      return '<figure class="ms-fig ms-fig-art" data-layout="' + esc(model.layout) + '"><div class="ms-card"><div class="hug-model-art">' + Mdl.artSvg(model) + '</div></div>' + '</figure>';
    }
    var over = [];
    f.spots.forEach(function(list, i){ list.forEach(function(p){ over.push('<span class="ms-badge" data-n="' + (i + 1) + '" style="left:' + p[0] + '%;top:' + p[1] + '%">' + (i + 1) + '</span>'); }); });
    (f.labels || []).forEach(function(l){ over.push('<span class="ms-tag' + (l.cls ? ' ' + esc(l.cls) : '') + '" style="left:' + l.x + '%;top:' + l.y + '%">' + esc(l.text) + '</span>'); });
    // Its width/height ratio, so on a short stage the box shrinks with the drawing and the badges stay on it.
    var vb = /viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(f.svg), ar = vb && +vb[2] ? (+vb[1] / +vb[2]).toFixed(3) : '';
    /* A figure whose drawing is the answer (gravity's bands, rank-size's bars)
       is marked data-hide: Build it and the drills hide those parts and the
       numbered places until the student has checked. A figure with a second
       picture (rank-size's primate city) gets its switch under the drawing. */
    var alt = f.alt ? '<div class="ms-alt"><button type="button" class="bt-btn ms-altbtn" aria-pressed="false" data-on="' + esc(f.alt.on) + '" data-off="' + esc(f.alt.off) + '">' + esc(f.alt.off) + '</button><p class="ms-note ms-alt-note" data-on="' + esc(f.alt.noteAlt) + '" data-off="' + esc(f.alt.note) + '">' + esc(f.alt.note) + '</p></div>' : '';
    return '<figure class="ms-fig"' + (f.hide ? ' data-hide' : '') + '><div class="ms-card"><div class="ms-pic"' + (ar ? ' style="--ms-ar:' + ar + '"' : '') + '>' + f.svg + '<div class="ms-over" aria-hidden="true">' + over.join('') + '</div></div>' + legendHtml(f.legend) + (f.note ? '<p class="ms-note">' + esc(f.note) + '</p>' : '') + alt + '</div></figure>';
  }
  /* The primate-city switch (any figure with an alt picture, on the stage
     in Explore or in a drill). */
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('.ms-altbtn'); if(!b) return;
    var fig = b.closest('.ms-fig'), on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on)); b.textContent = b.getAttribute(on ? 'data-on' : 'data-off');
    if(fig){ fig.classList.toggle('is-alt', on); var n = fig.querySelector('.ms-alt-note'); if(n) n.textContent = n.getAttribute(on ? 'data-on' : 'data-off'); }
  });
  function mark(figEl, n, state){
    if(!figEl) return;
    figEl.querySelectorAll('.ms-badge, .hug-model-band, .hug-model-num, .ms-part, .ms-col').forEach(function(b){
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
  /* A data plot on the tool's stage is drawn at the size it is shown (its
     width in px, and the height the stage has left), so its words are never
     shrunk and then raised to the 12 px phone minimum, which made axis
     numbers and the legend collide on a short phone stage (tools review,
     2026-11-09). Redrawn when the stage changes size. */
  var fitCur = null, fitT = 0, fitOn = false;
  function fitPlot(host, spec){
    var body = host.closest && host.closest('.ls-stage-body');
    if(!body) return;
    fitCur = { host: host, spec: spec, body: body };
    if(!fitOn){
      fitOn = true;
      window.addEventListener('resize', fitQueue);
      var stg = body.closest('.ls-stage'); if(stg) stg.addEventListener('ls-stage', fitQueue);
    }
    fitQueue(); setTimeout(fitQueue, 400);
  }
  function fitQueue(){ if(!fitT) fitT = requestAnimationFrame(function(){ requestAnimationFrame(function(){ fitT = 0; for(var i = 0; i < 3 && fitDraw(); i++); }); }); }
  // One pass; true when it redrew (a second pass then takes the axis name and legend rows into account).
  function fitDraw(){
    var c = fitCur; if(!c || !c.host.isConnected) return false;
    var card = c.host.querySelector('.ms-plotfig .ms-card'), svg = card && card.querySelector('svg.hug-plot');
    if(!svg) return false;
    // Shown up to 520 px wide; drawn at most 400 units wide, so on a wide screen the words grow with the picture.
    var dw = Math.min(520, Math.round(card.clientWidth));
    if(dw < 200) return false;
    var w = Math.min(400, dw), k = dw / w;
    var vb = svg.viewBox.baseVal, specH = +(svg.getAttribute('data-h') || 0), extra = specH ? vb.height - specH : 0;
    // The height the stage has left for the picture: from the picture's top to the stage's foot, less the caption under it.
    var br = c.body.getBoundingClientRect(), sr = svg.getBoundingClientRect(), cr = card.getBoundingClientRect();
    var avail = c.body.clientHeight - (parseFloat(getComputedStyle(c.body).paddingBottom) || 0) - (sr.top - br.top + c.body.scrollTop) - (cr.bottom - sr.bottom) - 2;
    var h = Math.round(Math.max(140, Math.min(w * 0.75, avail / k - extra)));
    if(Math.abs(w - vb.width) < 2 && specH && Math.abs(h - specH) < 3) return false;
    var s = {}; Object.keys(c.spec).forEach(function(k){ s[k] = c.spec[k]; }); s.width = w; s.height = h;
    var out = document.createElement('div'); out.innerHTML = PL.svg(s);
    var nsvg = out.firstChild; nsvg.setAttribute('data-h', h);
    svg.parentNode.replaceChild(nsvg, svg);
    return true;
  }
  function applyFig(host, fig){
    if(!fig){ host.innerHTML = ''; return; }
    if(fig.kind === 'plot'){ host.innerHTML = '<figure class="ms-fig ms-plotfig"><div class="ms-card">' + PL.svg(fig.spec) + '<p class="ms-src">Invented data for practice.</p></div></figure>'; fitPlot(host, fig.spec); }
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
    var ctx = list[0], model = null, view = 'see', upto = 0, mctl = null, graded = false, focus = 0, figNote = '';
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
      back: host.querySelector('.ms-back'), next: host.querySelector('.ms-next'), go: host.querySelector('.ms-go') };
    var cue = T.cue('Press Next place to see the model built one piece at a time, or switch to Build it.');
    R.ctl.insertBefore(cue.el, R.ctl.firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function slotKey(i){ return model.slots[i].id; }
    function piece(i){ return Mdl.pieceText(model, model.key[slotKey(i)]); }
    function why(i){ return (ctx.explain || {})[slotKey(i)] || ''; }
    function caption(html){ R.cap.innerHTML = html; if(LS) LS.caption(html, 'explore'); }
    /* The drawing fills the stage: the slot is a size container, and the
       picture is as large as fits once the legend and notes under it are
       counted (--ms-below, measured; it settles in a pass or two). */
    var sizeT = 0;
    function sizeFig(){ if(!sizeT) sizeT = requestAnimationFrame(function(){ sizeT = 0; for(var i = 0; i < 3; i++){ var card = R.fig.querySelector('.ms-card'), pic = card && card.querySelector('.ms-pic, .hug-model-art'); if(!pic) return; var below = Math.ceil(card.getBoundingClientRect().height - pic.getBoundingClientRect().height) + 4, was = parseFloat(R.fig.style.getPropertyValue('--ms-below')) || 0; if(Math.abs(below - was) < 2) return; R.fig.style.setProperty('--ms-below', below + 'px'); } }); }
    if(window.ResizeObserver) new ResizeObserver(sizeFig).observe(R.fig);
    R.fig.addEventListener('click', function(e){ if(e.target.closest('.ms-altbtn')) setTimeout(sizeFig, 0); });

    function pickModel(id){
      ctx = list.filter(function(c){ return c.id === id; })[0] || list[0];
      R.pick.value = ctx.id;
      // A generated model (rank-size, gravity) is drawn from one fixed seed, the
      // one Build it uses, so the drawing's numbers match the pieces.
      model = MS.buildModel(M.rng(ctx.build ? 7 + list.indexOf(ctx) : 1), ctx);
      upto = 0; R.gate.innerHTML = '';
      R.fig.innerHTML = modelFig(ctx, model); liftNote(); R.fig.setAttribute('data-view', view); sizeFig();
      if(LS && LS.fit) setTimeout(function(){ LS.fit(); }, 0);
      buildPane(); paintSee(); whyBox(); details();
    }
    /* Second pass (2026-11-10): the long numbered key under the drawing is
       gone. One line under the drawing names the place in focus (the newest,
       or the one the student taps on the drawing); every place is listed in
       Details, and the caption gives the reason. A note about how the drawing
       is made moves into Explanation (liftNote). */
    // The opening caption keeps the claim's first sentence; the whole claim heads Explanation.
    function firstSentence(t){ var m = /^.+?[.!?](?=\s+[A-Z]|$)/.exec(t || ''); return m ? m[0] : (t || ''); }
    function liftNote(){
      var n = R.fig.querySelector('.ms-card > .ms-note');
      figNote = n ? n.textContent : '';
      if(n) n.parentNode.removeChild(n);
    }
    function paintSee(){
      var n = model.slots.length, figEl = R.fig.querySelector('.ms-fig');
      if(!focus || focus > upto) focus = upto;
      var c = focus;
      R.skey.innerHTML = view === 'see' && c ? '<li class="is-cur"><span class="ms-n">' + c + '</span><span>' + piece(c - 1) + '</span>' + (upto > 1 ? '<span class="ms-tapn">Tap a number to name it</span>' : '') + '</li>' : '';
      R.key.innerHTML = model.slots.map(function(s, i){
        if(i >= upto) return '';
        return '<li class="' + (i === upto - 1 ? 'is-cur' : '') + '"><span class="ms-n" aria-hidden="true">' + (i + 1) + '</span><span><b>' + esc(Mdl.slotName(model, i)) + ':</b> ' + piece(i) + (i === upto - 1 && why(i) ? '<span class="ms-why">' + esc(why(i)) + '</span>' : '') + '</span></li>';
      }).join('');
      R.back.disabled = upto === 0; R.next.disabled = upto >= n;
      // Stage models count stages, not places (pass 3, judge b).
      var noun = /^(dtm|epidemiological|rostow)$/.test(ctx.id) ? 'stage' : 'place';
      R.next.textContent = upto === 0 ? 'Start: the first ' + noun : upto >= n ? 'All ' + noun + 's shown' : 'Next ' + noun;
      // Malthus: the figure's legend says only "Solid line" and "Dashed line" (Build it must not name them); in
      // See it, a line is named once its place is shown.
      if(ctx.id === 'malthus' && figEl) figEl.querySelectorAll('.ms-legend li').forEach(function(li){
        var t = li.lastChild, base = t && t.nodeType === 3 ? t.nodeValue.replace(/:.*$/, '') : '', i = base === 'Solid line' ? 0 : base === 'Dashed line' ? 1 : -1;
        if(i > -1) t.nodeValue = base + (view === 'see' && upto > i ? ': ' + piece(i).replace(/<[^>]+>/g, '') : '');
      });
      mark(figEl, c, view === 'see' && upto ? { upto: upto } : null);
      if(view === 'see') caption(c ? '<b>' + esc(Mdl.slotName(model, c - 1)) + ': ' + piece(c - 1) + '.</b> ' + esc(why(c - 1)) : '<b>' + esc(ctx.name) + '.</b> ' + esc(firstSentence(ctx.claim)));
      // The drill offer appears once the whole model has been seen (or built and checked).
      R.go.hidden = view === 'see' ? upto < n : !graded;
      if(LS) LS.pills(upto ? [{ html: upto + ' of ' + n + ' ' + noun + 's', tone: 'readout' }] : [{ html: esc(ctx.unit), tone: 'ghost' }], 'left', 'explore');
    }
    function buildPane(){
      var bm = MS.buildModel(M.rng(7 + list.indexOf(ctx)), ctx);
      R.mhost.innerHTML = Mdl.html(bm, nid + '-b');
      graded = false; R.fb.innerHTML = ''; R.fig.classList.remove('is-graded');
      var ck = R.ctl.querySelector('.ms-check'); if(ck) ck.disabled = false;
      R.fig.querySelectorAll('.ms-badge').forEach(function(b){ b.classList.remove('is-ok', 'is-no'); });
      mctl = Mdl.mount(R.mhost.querySelector('.hug-model'), bm, { onChange: function(){ act(); if(!graded) R.fb.innerHTML = ''; } });
      mctl.model = bm;
    }
    function check(){
      var g = Mdl.grade(mctl.model, mctl.get());
      if(!g.valid){ R.fb.innerHTML = '<span class="bt-small">Fill every place first.</span>'; return; }
      graded = true; mctl.lock(g); R.fig.classList.add('is-graded');
      var fe = R.fig.querySelector('.ms-fig');
      if(fe) g.results.forEach(function(x, i){ fe.querySelectorAll('.ms-badge[data-n="' + (i + 1) + '"]').forEach(function(b){ b.classList.add(x.ok ? 'is-ok' : 'is-no'); }); });
      R.ctl.querySelector('.ms-check').disabled = true; R.go.hidden = false;
      R.fb.innerHTML = g.correct ? '<span class="hug-mark ok">Correct</span> Every piece is in its place.' : '<span class="hug-mark no">Not yet</span> ' + esc(g.slip) + ' (' + g.right + ' of ' + g.total + ' in place.) Press Start over to try again.';
      caption(g.correct ? '<b>Built.</b> ' + esc(ctx.claim) : '<b>' + g.right + ' of ' + g.total + ' in place.</b> ' + esc(g.slip));
      if(LS) LS.pills([{ html: g.right + ' of ' + g.total + ' in place', tone: g.correct ? 'good' : 'warn' }], 'left', 'explore');
    }
    function setView(v){
      view = v; R.fig.setAttribute('data-view', v);
      // A drawing made from numbers starts again as the rule (not the primate-city switch).
      if(ctx.build){ R.fig.innerHTML = modelFig(ctx, model); liftNote(); sizeFig(); if(LS && LS.fit) setTimeout(function(){ LS.fit(); }, 0); }
      R.views.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
      R.see.hidden = v !== 'see'; R.build.hidden = v !== 'build';
      if(v === 'build'){ mark(R.fig.querySelector('.ms-fig'), 0, null); R.skey.innerHTML = ''; R.go.hidden = !graded; caption('Tap a piece, then the place it belongs: the numbers match the drawing. Then press Check.'); if(LS) LS.pills([{ html: 'Build it', tone: 'ghost' }], 'left', 'explore'); }
      else paintSee();
    }
    function whyBox(){
      var L = ctx.limits || {};
      var body = '<p>' + esc(ctx.origin) + (ctx.aside ? ' <span class="hug-aside">' + esc(ctx.aside) + '</span>' : '') + '</p>' +
        '<h4 class="ms-h4">What it assumes</h4><ul>' + (ctx.assumes || []).map(function(a){ return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' +
        '<h4 class="ms-h4">Where it fails</h4><ul>' + (L.right || []).map(function(x){ return '<li><b>' + esc(x.t) + '.</b> ' + esc(x.why) + '</li>'; }).join('') + '</ul>' +
        '<p class="bt-small">A model is a simplified idea, not a fact. On the exam, say what it assumes and where it fits poorly.</p>' +
        (figNote ? '<h4 class="ms-h4">About the drawing</h4><p class="bt-small">' + esc(figNote) + '</p>' : '');
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
      else if(b.classList.contains('ms-next')){ act(); if(upto < model.slots.length){ upto++; focus = upto; paintSee(); } }
      else if(b.classList.contains('ms-back')){ act(); if(upto > 0){ upto--; focus = upto; paintSee(); } }
      else if(b.classList.contains('ms-all')){ act(); upto = model.slots.length; focus = upto; paintSee(); }
      else if(b.classList.contains('ms-check')) check();
      else if(b.classList.contains('ms-again')){ buildPane(); setView('build'); }
      else if(b.classList.contains('ms-drill')) drill();
    }
    host.addEventListener('click', onClick);
    // Name a part on tap: a shown number on the drawing puts that place in focus.
    function onTapNum(e){
      if(view !== 'see' || !upto) return;
      var t = e.target.closest && e.target.closest('.ms-badge, .hug-model-num, .hug-model-band'); if(!t || !R.fig.contains(t)) return;
      var k = +(t.getAttribute('data-n') || (t.classList.contains('hug-model-num') ? t.textContent : 0));
      if(k >= 1 && k <= upto){ act(); focus = k; paintSee(); }
    }
    R.fig.addEventListener('click', onTapNum);
    R.pick.addEventListener('change', function(){ act(); focus = 0; pickModel(R.pick.value); setView(view); });
    function studio(pane, s){
      LS = s;
      R.cap.classList.add('sr-only'); R.cap.removeAttribute('aria-live');
      var sp = T.studioPane(pane, s, { stage: [R.stage], dock: [R.ctl], why: [R.say], details: [R.nums] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      paintSee();
      if(s.mode() === 'explore') T.hintSlot(s, R.next, 'Start here: see the model built one part at a time');
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
