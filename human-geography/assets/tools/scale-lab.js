/* Scale lab page (docs/aphug-spec.md sections 3.3 and 6). OWNED BY THIS TOOL ONLY
   (builder T2). Mounts into #app with ApHugTools; the model is ApHugMath.scaleLab
   (human-geography/assets/tools/math/scale-lab.js), the content
   human-geography/data/tools/scale-lab.json (served filtered as
   assets/tool-data/scale-lab.json). The frame is ApHugTools.modes (Explore,
   then Test yourself) on the Tool Studio.

   Explore, "Scale of analysis": the stage is one invented data set on a map
   at the scale picked in the dock (global: the world with one value;
   regional: the world shaded by world region; national: Country A as one
   unit; local: Country A by province). Every word is HTML (marks over the
   picture, the legend under it), so the map reads at 360 px. Why says what
   the data show at that scale and what they hide; Details holds the numbers
   and how the gap grows as the units get smaller.
   Explore, "Map scale": six ratios from 1:5,000 to 1:100,000,000, each with
   a drawing of what a map 10 cm across shows, the ground distance per cm
   (ApHugCalc.mapToGround) and the large-scale or small-scale label.
   Test yourself: ApHugTools.drill over the model's generate(); a map drill
   draws its map on the stage.

   Base maps are fetched once from ../figures/base/. hug-map.js is on the
   tool page's script list (build-aphug.mjs toolShell). */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath;
  if(!T || !M || !M.scaleLab || M.scaleLab.stub) return;
  var S = M.scaleLab, esc = T.esc;
  var BASES = {};
  function base(){ return window.ApHugBase || '../'; }

  function loadBases(ids){
    return Promise.all(ids.filter(function(id){ return !BASES[id]; }).map(function(id){
      return fetch(base() + 'figures/base/' + id + '.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(b){ BASES[id] = b; });
    }));
  }

  T.mount('scale-lab', function(app, data){
    var ready = loadBases(['world', 'country-a'].concat(S.REGION_BASES));
    var ex = null;
    // The frame is built at once (the studio arranges it); the maps draw when the bases arrive.
    T.modes(app, { slug: 'scale-lab', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data, ready); },
      quiz: function(host){ ready.then(function(){ quiz(host, data); }); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ a map */
  function svgUri(svg){ return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
  function mapFig(spec, extra){
    var b = BASES[spec.base];
    if(!b || !window.ApHugMap) return '<p class="bt-small">Loading the map…</p>';
    var Mp = window.ApHugMap;
    var over = Mp.overlay(spec, b).filter(function(o){ return o.x != null; }).map(function(o){
      return '<span class="hug-map-' + o.kind + (o.low ? ' is-low' : '') + '" style="left:' + o.x + '%;top:' + o.y + '%">' + esc(o.text) + '</span>';
    }).join('');
    return '<figure class="hug-map hug-sl-map" data-render="' + esc(spec.render) + '"><div class="hug-map-pic"><img src="' + svgUri(Mp.svg(spec, b)) + '" alt="' + esc(spec.label) + '" width="' + b.width + '" height="' + b.height + '" decoding="async">' +
      (over ? '<div class="hug-map-over" aria-hidden="true">' + over + '</div>' : '') + (extra || '') + '</div>' + Mp.legendHtml(spec, b) +
      '<figcaption class="hug-small"><span class="hug-src">Invented data for practice.</span> <span class="hug-border-note">' + esc(Mp.note(b)) + '</span>' + (b.invented ? '' : ' <span class="hug-base-src">Base map: Natural Earth.</span>') + '</figcaption></figure>';
  }

  /* --------------------------------------------- map-scale drawings (no text) */
  var SCENE = [
    // a few streets: two roads, houses with yards, trees
    '<rect width="320" height="200" fill="#EEF3E8"/><path d="M0 118h320M168 0v200" stroke="#B9B4A8" stroke-width="22"/><path d="M0 118h320M168 0v200" stroke="#fff" stroke-width="1.5" stroke-dasharray="8 8"/>' +
      [[20, 30], [80, 30], [210, 30], [270, 30], [20, 150], [80, 150], [210, 150], [270, 150]].map(function(p, i){ return '<rect x="' + p[0] + '" y="' + p[1] + '" width="40" height="34" rx="3" fill="' + (i % 3 ? '#E7C9A9' : '#D9B08C') + '" stroke="#8C6A4E"/><path d="M' + p[0] + ' ' + p[1] + 'l20 -12 20 12z" fill="#B5481F"/>'; }).join('') +
      [[132, 40], [132, 180], [300, 96], [60, 96], [245, 182]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#6FA86F" stroke="#3E7A45"/>'; }).join(''),
    // a neighborhood: a street grid, a park, a school yard
    '<rect width="320" height="200" fill="#F3EEE2"/>' + (function(){ var o = ''; for(var x = 0; x < 6; x++) for(var y = 0; y < 4; y++){ var px = 8 + x * 52, py = 8 + y * 48; o += (x === 2 && y < 2) ? '' : '<rect x="' + px + '" y="' + py + '" width="42" height="38" rx="2" fill="' + ((x + y) % 4 ? '#E3D3BD' : '#D7C2A5') + '"/>'; } return o; })() +
      '<path d="M0 196 L320 100" stroke="#C9B79F" stroke-width="9"/><path d="M262 0 C 270 60, 300 80, 320 84 V0z" fill="#9CC6E3"/><rect x="112" y="8" width="42" height="86" rx="4" fill="#9CCB95"/><circle cx="126" cy="30" r="6" fill="#5E9A5E"/><circle cx="140" cy="62" r="7" fill="#5E9A5E"/><rect x="216" y="104" width="42" height="38" fill="#C8A27A"/>',
    // a city: a river, a dense core, main roads to the edge, green belt
    '<rect width="320" height="200" fill="#E7EFE0"/><path d="M0 150 C 80 120, 140 170, 200 120 S 290 60, 320 70" fill="none" stroke="#8FBBD9" stroke-width="14"/>' +
      '<path d="M160 100 L10 20 M160 100 L310 30 M160 100 L20 190 M160 100 L300 190 M160 100 V0" stroke="#C9B79F" stroke-width="4"/>' +
      (function(){ var o = '', k = 0; for(var x = 100; x < 225; x += 14) for(var y = 50; y < 150; y += 14){ var d = Math.hypot(x - 160, y - 100); if(d < 62 && (k++ % 5)) o += '<rect x="' + x + '" y="' + y + '" width="10" height="10" fill="' + (d < 30 ? '#A8876A' : '#CDB596') + '"/>'; } return o; })(),
    // part of a country: towns, highways, a lake, a river
    '<rect width="320" height="200" fill="#EEF0E2"/><ellipse cx="250" cy="52" rx="42" ry="22" fill="#9CC6E3"/><path d="M250 74 C 230 120, 180 130, 140 200" fill="none" stroke="#8FBBD9" stroke-width="5"/>' +
      '<path d="M30 170 L120 110 L210 120 L300 160 M120 110 L90 20 M210 120 L250 74" fill="none" stroke="#C0763C" stroke-width="3"/>' +
      [[120, 110, 11], [210, 120, 8], [30, 170, 6], [300, 160, 6], [90, 20, 5], [60, 90, 3.5], [170, 170, 3.5], [270, 120, 3.5]].map(function(p){ return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#7A2E0E"/>'; }).join('')
  ];
  function sceneHtml(k){
    if(k < SCENE.length) return '<svg class="hug-sl-scene" viewBox="0 0 320 200" role="img" aria-label="' + esc(['A drawing of a few streets: every house, yard and tree shows', 'A drawing of a neighborhood: each street and block shows, with a park', 'A drawing of a city: a river, the dense center and the main roads', 'A drawing of part of a country: towns as dots, highways, a lake and a river'][k]) + '">' + SCENE[k] + '</svg>';
    var spec = k === 4 ? { base: 'country-a', render: 'reference', label: 'Country A, an invented country about 500 km across, with its eight provinces' } : { base: 'world', render: 'reference', label: 'The world map: at this scale only continents and countries show' };
    var b = BASES[spec.base];
    if(!b || !window.ApHugMap) return '<p class="bt-small">Loading the map…</p>';
    return '<img class="hug-sl-scene" src="' + svgUri(window.ApHugMap.svg(spec, b)) + '" alt="' + esc(spec.label) + '" width="' + b.width + '" height="' + b.height + '">';
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data, ready){
    var LS = null, nid = T.nid('sl'), view = 'analysis', scale = 'local', step = 1, seed = 7, touched = false;
    var ds = S.dataset(M.rng(seed), 'walk'), lad = S.ladder();
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem hug-sl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Scale lab</h2>' +
      '<div class="hug-sl-fig"></div>' +
      '<div class="hug-sl-ctl">' +
        '<div class="ls-seg hug-sl-view" role="group" aria-label="Which scale">' +
          '<button type="button" class="hug-sl-v" data-v="analysis" aria-pressed="true">Scale of analysis</button><button type="button" class="hug-sl-v" data-v="map" aria-pressed="false">Map scale</button></div>' +
        '<div class="hug-sl-pick"></div><p class="hug-sl-unit"></p>' +
      '</div>' +
      '<div class="hug-sl-say"></div>' +
      T.moreHtml('<div class="bt-buttons"><button type="button" class="bt-btn hug-sl-new">New data set</button></div><p class="bt-small">Every number here is invented for practice. A new data set draws new numbers with the same kind of pattern.</p>', 'new numbers') +
      '<div class="hug-sl-nums"></div><p class="sr-only hug-sl-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.hug-sl-live'));
    var cue = T.cue('Pick a scale, then compare what the map says at each one.');
    $('.hug-sl-ctl').insertBefore(cue.el, $('.hug-sl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function onClick(e){
      var t = e.target.closest('button');
      if(!t || !(LS ? LS.root : host).contains(t)) return;
      if(t.classList.contains('hug-sl-v')){ act(); view = t.getAttribute('data-v'); drawAll(); say(view === 'map' ? 'Map scale. ' + ratioLine() : 'Scale of analysis: ' + S.SCALE_NAME[scale] + '.'); return; }
      if(t.classList.contains('hug-sl-s')){ act(); scale = t.getAttribute('data-s'); drawAll(); say(S.SCALE_NAME[scale] + ' scale. ' + cur().says); return; }
      if(t.classList.contains('hug-sl-l')){ act(); step = +t.getAttribute('data-k'); drawAll(); say(ratioLine()); return; }
      if(t.classList.contains('hug-sl-new')){ act(); seed = 8 + Math.floor(Math.random() * 90000); ds = S.dataset(M.rng(seed), 'walk'); drawAll(); say('New invented data set. ' + cur().says); }
    }
    host.addEventListener('click', onClick);
    function views(){ return S.views(ds); }
    function cur(){ return views().filter(function(v){ return v.scale === scale; })[0]; }
    function ratioLine(){ var l = lad[step]; return S.ratio(l.denom) + ': 1 cm on the map is ' + S.km(l.kmPerCm) + ' km on the ground. ' + (step < 3 ? 'A large-scale map.' : 'A small-scale map.'); }
    function specOf(v){ return v.spec || S.regionalSpec(BASES.world, ds); }

    /* The spread at this scale on one 0 to 100% line: a dot per unit, the span from lowest to highest
       filled in. One unit is one dot and no span: the picture of what an average hides. */
    var last = null;
    function rangeHtml(sc){
      var units = sc === 'global' ? [{ name: 'The world', value: ds.world }] : sc === 'regional' ? ds.regions : sc === 'national' ? [{ name: 'Country A', value: M.round(ds.national, 0) }] : ds.provinces;
      var vals = units.map(function(u){ return u.value; }), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), one = units.length === 1;
      var dots = units.map(function(u){ return '<span class="hug-sl-rd" style="left:' + u.value + '%"></span>'; }).join('');
      return '<div class="hug-sl-range' + (one ? ' is-one' : '') + '" role="img" aria-label="' + esc(one ? 'One value, ' + S.pct(lo) + ': no spread to see at this scale' : units.length + ' values from ' + S.pct(lo) + ' to ' + S.pct(hi) + ', a gap of ' + M.round(hi - lo, 0) + ' points') + '">' +
        '<p class="hug-sl-rt">' + (one ? '<b>1 value.</b> An average: the spread inside it is hidden.' : '<b>' + units.length + ' values.</b> Lowest ' + S.pct(lo) + ', highest ' + S.pct(hi) + ': a gap of <b>' + M.round(hi - lo, 0) + ' points</b>.') + '</p>' +
        '<div class="hug-sl-rtrack"><span class="hug-sl-rspan" style="left:' + lo + '%;width:' + (hi - lo) + '%"></span>' + dots + '</div>' +
        '<div class="hug-sl-rax" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div></div>';
    }
    function drawStage(){
      var fig = $('.hug-sl-fig');
      if(view === 'map'){
        var l = lad[step];
        fig.innerHTML = '<div class="hug-sl-ms"><div class="hug-sl-frame">' + sceneHtml(step) + '</div>' +
          '<div class="hug-sl-bar" aria-hidden="true"><span class="hug-sl-bar-l"></span><span class="hug-sl-bar-t">Imagine this map 10 cm wide: its width is ' + S.km(l.across) + ' km on the ground</span></div>' +
          '<div class="hug-sl-read"><p class="hug-sl-ratio">' + S.ratio(l.denom) + '</p><p class="hug-sl-rk"><span class="hug-sl-tag ' + (step < 3 ? 'is-large' : 'is-small') + '">' + (step < 3 ? 'Large scale' : 'Small scale') + '</span> 1 cm = ' + S.km(l.kmPerCm) + ' km</p>' +
          '<p class="hug-sl-shows">A map 10 cm across shows <b>' + esc(l.shows) + '</b>: ' + esc(l.what) + '.</p></div></div>';
      } else {
        var v = cur(), spec = specOf(v);
        var badge = v.scale === 'global' ? '<div class="hug-sl-badge"><span class="hug-sl-bk">World</span><span class="hug-sl-bv">' + S.pct(ds.world) + '</span></div>' : '';
        fig.innerHTML = '<div class="hug-sl-head"><p class="hug-sl-k">' + esc(S.SCALE_NAME[v.scale]) + ' scale</p><p class="hug-sl-t">' + esc(ds.name) + '</p></div>' + rangeHtml(v.scale) + mapFig(spec, badge);
        // Same outline, smaller units: the one shade breaks apart in place (or merges back), so the
        // change of scale is seen as a change of units, not as a different map.
        var pic = fig.querySelector('.hug-map-pic'), img = pic && pic.querySelector('img');
        if(img){
          if(last && last.base === spec.base && last.scale !== v.scale && last.src !== img.src){
            var g = document.createElement('img'); g.className = 'hug-sl-ghost'; g.alt = ''; g.setAttribute('aria-hidden', 'true'); g.src = last.src;
            pic.insertBefore(g, img.nextSibling); pic.classList.add('is-split');
            g.addEventListener('animationend', function(){ if(g.parentNode) g.parentNode.removeChild(g); pic.classList.remove('is-split'); });
          }
          last = { base: spec.base, scale: v.scale, src: img.src };
        }
      }
    }
    function drawCtl(){
      $('.hug-sl-view').querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      var pick = $('.hug-sl-pick'), unit = $('.hug-sl-unit');
      if(view === 'map'){
        pick.innerHTML = '<p class="hug-sl-lbl" id="' + nid + '-r">Map scale (the ratio)</p><div class="hug-sl-ladder" role="group" aria-labelledby="' + nid + '-r">' + lad.map(function(l, k){ return '<button type="button" class="hug-sl-l" data-k="' + k + '" aria-pressed="' + (k === step) + '">' + S.ratio(l.denom) + '</button>'; }).join('') + '</div>';
        unit.innerHTML = 'Left: <b>large scale</b>, a small area in detail. Right: <b>small scale</b>, a large area with little detail.';
      } else {
        pick.innerHTML = '<p class="hug-sl-lbl" id="' + nid + '-s">Scale of analysis</p><div class="hug-sl-scales ls-seg" role="group" aria-labelledby="' + nid + '-s">' + S.SCALES.map(function(s){ return '<button type="button" class="hug-sl-s" data-s="' + s + '" aria-pressed="' + (s === scale) + '">' + esc(s === 'local' ? 'Local' : S.SCALE_NAME[s]) + '</button>'; }).join('') + '</div>';
        unit.innerHTML = 'Each value describes <b>' + esc(S.UNIT[scale]) + '</b>.';
      }
    }
    function words(){
      var head, why;
      if(view === 'map'){
        var l = lad[step];
        head = '<b>' + S.ratio(l.denom) + ':</b> 1 cm on the map stands for ' + S.grp(l.denom) + ' cm, which is ' + S.km(l.kmPerCm) + ' km, on the ground.';
        why = '<p>Work it out: map cm × ' + S.grp(l.denom) + ' = ground cm, then ÷ 100,000 (cm in a km) = ' + S.km(l.kmPerCm) + ' km.</p>' +
          '<p><b>Large scale</b> means the ratio is a large fraction: 1/5,000 is bigger than 1/100,000,000. So a large-scale map shows a <b>small</b> area in detail. Many students say it the other way round.</p>' +
          '<p>Map scale is not the scale of analysis. A small-scale world map can still show data for each country (national) or for each world region (regional).</p>';
      } else {
        var v = cur();
        head = '<b>' + esc(S.SCALE_NAME[v.scale]) + ':</b> ' + esc(v.says);
        why = '<p><b>What this scale hides.</b> ' + esc(v.hides) + '</p>' +
          '<p><b>Name the scale from the data, not from the map.</b> The national and local views show the same outline of Country A. Each value on the local map is for one province, so those data are local (subnational), even though the map shows the whole country. Only about 38% of students got this right on a 2025 exam question.</p>';
      }
      T.explain($('.hug-sl-say'), head, why);
      if(LS){
        LS.caption(view === 'map' ? '<b>' + S.ratio(lad[step].denom) + '.</b> ' + esc(step < 3 ? 'Large scale: a small area in detail.' : 'Small scale: a large area with little detail.') : '<b>' + esc(S.SCALE_NAME[scale]) + ' scale.</b> ' + esc(cur().says.replace(/ A gap of .*$/, '')), 'explore'); // the gap is on the approved spread line (pass 3)
        if(LS.why) LS.why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      }
    }
    function nums(){
      var vs = views(), el = $('.hug-sl-nums');
      var gaps = '<h3 class="ls-title-l">How the pattern changes</h3><ul class="hug-sl-gaps">' + vs.map(function(v){
        return '<li><b>' + esc(S.SCALE_NAME[v.scale]) + '</b> ' + (v.range ? 'values ' + v.range + ' points apart' : 'one value, ' + S.pct(v.scale === 'global' ? ds.world : v.value) + ': no gap to see') + '</li>';
      }).join('') + '</ul><p class="bt-small">The smaller the unit, the more of the differences between places you can see.</p>';
      var rows = view === 'analysis' && scale === 'regional' ? ds.regions.slice().sort(function(a, b){ return b.value - a.value; }).map(function(g){ return [g.name, S.pct(g.value)]; })
        : ds.provinces.slice().sort(function(a, b){ return b.value - a.value; }).map(function(p){ return [p.name, S.pct(p.value), M.fixed(p.pop, 1)]; });
      var cols = view === 'analysis' && scale === 'regional' ? ['World region', 'Share'] : ['Province of Country A', 'Share', 'People (millions)'];
      var cap = (view === 'analysis' && scale === 'regional' ? 'The ten world regions' : 'Country A\'s eight provinces (national figure ' + S.pct(M.round(ds.national, 0)) + ', weighted by people)') + ': invented data';
      el.innerHTML = gaps + '<h3 class="ls-title-l">The numbers</h3>' + T.dataTable(cols, rows, cap);
    }
    function drawAll(){ drawStage(); drawCtl(); words(); nums(); }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.hug-sl-fig')], dock: [$('.hug-sl-ctl')], why: [$('.hug-sl-say')], details: [$('.hug-sl-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      drawAll();
      if(s.mode() === 'explore') T.hintSlot(s, s.root.querySelector('.hug-sl-scales') || s.root.querySelector('.hug-sl-pick'), 'Start here: pick a scale', { cls: 'hug-sl-tipslot', before: s.root.querySelector('.hug-sl-unit') });
    }
    drawAll();
    ready.then(function(){ drawStage(); }).catch(function(){ var f = $('.hug-sl-fig'); if(f) f.innerHTML = '<p class="hug-soon" role="alert">The map could not load. Check your connection and reload the page.</p>'; });
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'scale-lab', noun: 'drill',
      generate: function(r, ctx, type){ return S.generate(r, ctx, type, BASES); },
      types: S.TYPES.map(function(t){ return { value: t, label: S.TYPE_LABEL[t] }; }),
      typeLabel: 'Problems to practice',
      title: function(p){ return S.TYPE_LABEL[p.type]; },
      extra: function(el, p){
        if(p.map) el.innerHTML = '<div class="hug-sl-drill">' + mapFig(p.map) + '</div>';
        else if(p.table) el.innerHTML = '<div class="hug-sl-drill">' + T.dataTable(p.table.cols, p.table.rows, p.table.caption) + '</div>';
      }
    });
  }
})();
