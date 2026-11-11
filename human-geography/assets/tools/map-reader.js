/* Map reader page (docs/aphug-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T3). Mounts into #app with ApHugTools.mount; the model is
   ApHugMath.mapReader (human-geography/assets/tools/math/map-reader.js), the
   content human-geography/data/tools/map-reader.json.

   Maps are drawn in the page with ApHugMap (hug-map.js) on the committed base
   maps (human-geography/figures/base/*.json, fetched once each): the picture
   is an inline SVG with no words in it, and every word (letters, line
   values, the legend, the border note) is HTML at the page's own size, the
   same markup the course's map stimuli use (.hug-map). The tool page loads
   hug-map.js (build-aphug.mjs toolShell).

   Explore: one invented data set, six map types.
     Type chips: reference, choropleth, dot density, graduated symbol,
     isoline, cartogram. Read chips: Legend, Pattern, Limit (each adds a
     mark or a note and its explanation under Why). Choropleth only: class
     breaks Even, Uneven, Totals (the misleading maps). Tap a place to read
     its invented value. More options: the base (Country A, the world, four
     regions). Isoline and cartogram are drawn on Country A.
   Test yourself: ApHugTools.drill over generate(). */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath;
  if(!T || !M || !M.mapReader) return;
  var R = M.mapReader, nf = R.nf, B0 = window.ApHugBase || '../';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Data');
  function studioOf(el){ var s = window.LevlStudio && window.LevlStudio.get(); var root = document.getElementById('app'); return s && root && root.getAttribute('data-studio') && root.contains(el) ? s : null; }

  /* ---------------------------------------------- loading the maps */
  var baseP = {};
  // The tool page loads hug-map.js (build-aphug.mjs toolShell).
  function lib(){ return window.ApHugMap ? Promise.resolve() : Promise.reject(new Error('hug-map.js')); }
  function bases(ids){
    return lib().then(function(){
      return Promise.all(ids.map(function(id){
        if(!baseP[id]) baseP[id] = fetch(B0 + 'figures/base/' + id + '.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(b){ var o = {}; o[id] = b; R.setBases(o); return b; });
        return baseP[id];
      }));
    });
  }

  /* ---------------------------------------------- one map, as HTML */
  /* The course's map markup (.hug-map, hug.css): picture, HTML labels over
     it, legend under it, the source line and the border note. */
  function mapHtml(spec, o){
    o = o || {};
    var MAP = window.ApHugMap, B = R.base(spec.base), svg = MAP.svg(spec, B).replace(/<\?xml[^>]*\?>\s*/, '').replace(/ width="\d+" height="\d+"/, '');
    if(o.hit) svg = svg.replace(/<path d=/g, function(){ return '<path class="hug-mr-f" d='; });
    var over = MAP.overlay(spec, B).filter(function(x){ return x.x != null; }).map(function(x){ return '<span class="hug-map-' + x.kind + (x.low ? ' is-low' : '') + '" style="left:' + x.x + '%;top:' + x.y + '%">' + esc(x.text) + '</span>'; }).join('');
    var src = spec.invented ? 'Invented data for practice.' : spec.source ? 'Source: ' + esc(spec.source) + '.' : '';
    return '<figure class="hug-map hug-mr-map" data-render="' + esc(spec.render) + '" style="--hug-mr-ar:' + (B.width / B.height).toFixed(3) + '"><div class="hug-map-pic"' + (o.hit ? ' data-base="' + esc(spec.base) + '"' : '') + '>' + svg +
      (over ? '<div class="hug-map-over" aria-hidden="true">' + over + '</div>' : '') + '</div>' + MAP.legendHtml(spec, B) +
      '<figcaption class="hug-small">' + (src ? '<span class="hug-src">' + src + '</span> ' : '') + '<span class="hug-border-note">' + esc(MAP.note(B)) + '</span>' + (B.invented ? '' : ' <span class="hug-base-src">Base map: Natural Earth.</span>') + '</figcaption></figure>';
  }
  /* The cartogram of Country A: squares sized by the data, a letter in each. */
  function cartoHtml(c, title, explore){
    var L = R.LETTERS.concat(['G', 'H']);
    var sq = c.squares.map(function(q, i){ return '<rect class="hug-mr-sq" data-id="' + esc(q.id) + '" x="' + (q.x - q.s / 2).toFixed(1) + '" y="' + (q.y - q.s / 2).toFixed(1) + '" width="' + q.s.toFixed(1) + '" height="' + q.s.toFixed(1) + '" rx="4"/>'; }).join('');
    var over = c.squares.map(function(q, i){ return '<span class="hug-mr-sql" style="left:' + (100 * q.x / c.width).toFixed(2) + '%;top:' + (100 * q.y / c.height).toFixed(2) + '%">' + L[i] + '</span>'; }).join('');
    var key = c.squares.map(function(q, i){ return '<li><b>' + L[i] + '</b> ' + esc(q.name) + '</li>'; }).join('');
    return '<figure class="hug-map hug-mr-map hug-mr-carto" data-render="cartogram" style="--hug-mr-ar:1.5"><div class="hug-map-pic"><svg viewBox="0 0 ' + c.width + ' ' + c.height + '" role="img" aria-label="Cartogram of Country A: each province is a square sized by its number of people">' +
      '<rect width="' + c.width + '" height="' + c.height + '" fill="#FFFFFF"/>' + sq + '</svg><div class="hug-map-over" aria-hidden="true">' + over + '</div></div>' +
            // Explore (second pass, 2026-11-10): the eight-letter key opens on tap; the caption already says what area means.
      (explore ? '<div class="hug-legend"><p class="hug-lg-title">' + esc(title || 'People in each province (invented)') + '</p><details class="hug-mr-ckd"><summary>Which province is which letter</summary><ul class="hug-mr-ckey">' + key + '</ul></details><p class="hug-small">Shapes and positions are not true.</p></div>'
        : '<div class="hug-legend"><p class="hug-lg-title">' + esc(title || 'People in each province (invented)') + '</p><ul class="hug-mr-ckey">' + key + '</ul><p class="hug-small">Square area shows the number of people. Shapes and positions are not true.</p></div>') +
      '<figcaption class="hug-small"><span class="hug-src">Invented data for practice.</span> <span class="hug-border-note">' + esc(window.ApHugMap.INVENTED_NOTE) + '</span></figcaption></figure>';
  }

  T.mount('map-reader', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'map-reader',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* --------------------------------------------------------- explore */
  var TYPE_ORDER = ['reference', 'choropleth', 'dot', 'symbol', 'isoline', 'cartogram'];
  var BASE_NAMES = { 'country-a': 'Country A (invented)', world: 'The world', 'sub-saharan-africa': 'Sub-Saharan Africa', europe: 'Europe', 'latin-america': 'Latin America', 'south-asia': 'South Asia' };
  function explore(host, data){
    var st = { base: 'country-a', type: 'choropleth', read: 'legend', breaks: 'even', sel: null }, LS = null, touched = false, cur = null, nid = 'hug-mr-' + Math.floor(Math.random() * 1e6);
    var exploreBases = (data.exploreBases || ['country-a']).filter(function(b){ return BASE_NAMES[b]; });
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    function $$(q){ return (LS ? LS.root : host).querySelectorAll(q); }
    host.innerHTML = '<section class="bt-problem hug-mr-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Map reader</h2>' +
      '<div class="hug-mr-stage"><div class="hug-mr-fig"><p class="bt-loading">Loading the map…</p></div><p class="hug-mr-read" aria-live="polite"></p></div>' +
      '<div class="hug-mr-ctl">' +
        // Map type is a select (pass 3, judge b: six chips plus two segments).
        '<div class="hug-mr-typeslot"></div>' +
        '<div class="hug-mr-reads tseg" role="group" aria-label="Read the map">' + [['legend', '1 Legend'], ['pattern', '2 Pattern'], ['limit', '3 Limit']].map(function(x){ return '<button type="button" class="hug-mr-rd" data-r="' + x[0] + '" aria-pressed="false">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<div class="hug-mr-breaks tseg" role="group" aria-label="Class breaks" hidden>' + [['even', 'Even classes'], ['lumped', 'Uneven'], ['totals', 'Totals']].map(function(x){ return '<button type="button" class="hug-mr-br" data-b="' + x[0] + '" aria-pressed="false">' + x[1] + '</button>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="hug-mr-say"></div>' +
      T.moreHtml('<div class="hug-mr-basesel"></div><p class="bt-small">The isoline map and the cartogram are drawn on Country A. All values are invented.</p>', 'the place') +
      '<div class="hug-mr-nums"></div></section>';
    var cue = T.cue('Pick a map type, then read it: legend, pattern, limit.');
    $('.hug-mr-ctl').insertBefore(cue.el, $('.hug-mr-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var tsel = T.choiceSelect({ label: 'Map type', options: TYPE_ORDER.map(function(k){ return { value: k, label: R.KINDS[k].short }; }), value: st.type, onChange: function(v){ act(); st.type = v; st.sel = null; draw(); } });
    $('.hug-mr-typeslot').appendChild(tsel.el);
    var sel = T.choiceSelect({ label: 'Base map', options: exploreBases.map(function(b){ return { value: b, label: BASE_NAMES[b] }; }), value: st.base, onChange: function(v){ st.base = v; st.sel = null; act(); draw(); } });
    $('.hug-mr-basesel').appendChild(sel.el);

    function baseNow(){ return st.type === 'isoline' || st.type === 'cartogram' ? 'country-a' : st.base; }
    function draw(){
      var bid = baseNow();
      bases([bid]).then(function(){ render(bid); }).catch(function(e){ try{ console.error(e); }catch(x){} $('.hug-mr-fig').innerHTML = '<p class="hug-soon" role="alert">The map could not load. Check your connection and reload the page.</p>'; });
    }
    function topMarks(bid, x){
      // Pattern: letters on two places at the high end and one at the low end.
      var v = x.spec.values || {}, D = x.data, mk = R.markable(bid), score = function(f){ return st.type === 'choropleth' ? (v[f.id] == null ? -1 : v[f.id]) * 1e6 + (D.density[f.id] || 0) : D.people[f.id] || 0; };
      var hi = mk.slice().sort(function(a, b){ return score(b) - score(a); }), lo = hi.slice().reverse();
      var two = R.legibleMarks(bid, hi.slice(0, 6).map(function(f){ return f.id; }), 2).map(function(m){ return m.at; });
      return R.legibleMarks(bid, two.concat(lo.slice(0, 6).map(function(f){ return f.id; })), 3).map(function(m){ return m.at; });
    }
    function render(bid){
      var K = R.KINDS[st.type], x = R.exploreSpec(bid, st.type, { breaks: st.breaks }), html, marks = [];
      if(st.type !== 'cartogram' && st.read === 'pattern' && st.type !== 'isoline' && st.type !== 'reference'){
        marks = topMarks(bid, x); x = R.exploreSpec(bid, st.type, { breaks: st.breaks, marks: marks });
      }
      if(st.type === 'reference' && st.read !== 'legend'){ marks = R.legibleMarks(bid, R.markable(bid).slice().sort(function(a, b){ return R.geom(bid, b.id).area - R.geom(bid, a.id).area; }).slice(0, 6).map(function(f){ return f.id; }), 3).map(function(m){ return m.at; }); x = R.exploreSpec(bid, 'reference', { focus: marks, marks: marks }); }
      cur = { bid: bid, x: x, marks: marks };
      html = st.type === 'cartogram' ? cartoHtml(x.cartogram, null, true) : mapHtml(x.spec, { hit: true });
      $('.hug-mr-fig').innerHTML = html;
      // A new map starts at its top, whatever the stage was scrolled to.
      for(var el = $('.hug-mr-fig'); el && el !== document.body; el = el.parentElement){ if(el.scrollTop) el.scrollTop = 0; }
      setTimeout(function(){ for(var el2 = $('.hug-mr-fig'); el2 && el2 !== document.body; el2 = el2.parentElement){ if(el2.scrollTop) el2.scrollTop = 0; } }, 60);
      tsel.set(st.type);
      $$('.hug-mr-rd').forEach(function(b){ var on = b.getAttribute('data-r') === st.read; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      $$('.hug-mr-br').forEach(function(b){ var on = b.getAttribute('data-b') === st.breaks; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      $$('.hug-mr-breaks').forEach(function(b){ b.hidden = st.type !== 'choropleth'; });
      readout(); words(bid, x, marks); nums(bid, x);
    }
    function valueLine(bid, id){
      var D = cur.x.data, B = R.base(bid), f = window.ApHugMap.feature(B, id);
      if(!f) return '';
      if(f.context) return esc(f.name) + ' is outside this map’s area (gray).';
      if(f.disputed) return esc(f.name) + ': no value in this practice set.';
      var inv = !!B.invented, t = st.type;
      if(t === 'reference') return '<b>' + esc(f.name) + '</b>. A reference map gives no values: it shows where the place is.';
      if(t === 'isoline') return '<b>' + esc(f.name) + '</b>. On an isoline map, read the lines on either side of a point, not the province.';
      var dens = D.density[id], ppl = D.people[id], cl = cur.x.spec.values ? cur.x.spec.values[id] : null;
      return '<b>' + esc(f.name) + '</b>: ' + (inv ? nf(ppl) + ' people, ' + nf(dens, 1) + ' per km²' : nf(ppl) + ' thousand people, ' + nf(dens, 1) + ' per 1,000 km²') + (cl != null && cur.x.spec.classes ? ' · class ' + esc(cur.x.spec.classes[cl]) : '') + ' (invented).';
    }
    function readout(){ var el = $('.hug-mr-read'); el.innerHTML = st.sel ? valueLine(cur.bid, st.sel) : '<span class="hug-mr-tap">Tap a place to read its invented value.</span>'; }
    function words(bid, x, marks){
      var K = R.KINDS[st.type], D = x.data, P = bid === 'country-a' ? 'Country A' : bid === 'world' ? 'the world' : BASE_NAMES[bid];
      var nm = function(id){ return window.ApHugMap.feature(R.base(bid), id).name; };
      var head, body;
      if(st.read === 'legend'){
        head = 'Read the legend first: ' + (st.type === 'choropleth' ? 'each shade is a class, light (low) to dark (high).' : st.type === 'dot' ? 'one dot stands for a set number.' : st.type === 'symbol' ? 'circle area grows with the amount.' : st.type === 'isoline' ? 'each line joins places with the value on its label.' : st.type === 'cartogram' ? 'square area shows the number of people.' : 'a reference map has no data legend, only highlighted places.');
        body = '<p><b>' + esc(K.name) + '.</b> It shows best ' + esc(K.best) + '.</p><p>' + (st.type === 'choropleth' ? 'A class is a range: two places in one class can still differ. Check that the classes meet with no gap and are not lopsided (try Uneven).' : st.type === 'symbol' ? 'Compare circles by area: a circle twice as wide stands for 4 times the amount.' : st.type === 'dot' ? 'Dots show counts, so a dense cluster means many, not a high rate per person.' : st.type === 'isoline' ? 'Lines close together mean the value changes fast; far apart, slowly.' : st.type === 'cartogram' ? 'Big squares are places with many people, whatever their land area.' : 'Use it to find where places are and what they border.') + '</p>';
      } else if(st.read === 'pattern'){
        var named = marks.length ? marks.map(function(id, i){ return nm(id) + ' (' + R.LETTERS[i] + ')'; }) : [];
        head = st.type === 'isoline' ? 'Pattern: travel time rises away from the capital, and the lines bunch in the east, where it rises fastest.' :
          st.type === 'cartogram' ? 'Pattern: the biggest squares are the provinces with the most people, not the biggest provinces.' :
          st.type === 'reference' ? 'A reference map has no data pattern: name places by where they are (A, B and C are marked).' :
          'Pattern: highest toward the ' + D.dir + ' of ' + P + (named.length >= 2 ? ', for example in ' + named[0] + ' and ' + named[1] : '') + '.';
        body = '<p>A full answer says <b>where</b> (a direction and a named place) and <b>what</b> (high, low, how it changes). “The values are clustered” earns nothing on its own.</p>' + (named.length ? '<p class="bt-small">Marked: ' + named.map(esc).join(' · ') + '.</p>' : '') + '<p class="bt-small">The values are invented, so this pattern says nothing true about real places.</p>';
      } else {
        head = 'What it cannot show: ' + K.cannot + '.';
        body = '<p>Every map leaves something out. Say what this one hides, and what data would fill the gap.</p>' + (st.type === 'choropleth' && st.breaks === 'totals' ? '<p><b>This one misleads.</b> It shades totals, so large places look darkest. A choropleth should show a rate, such as people per km²: switch to Even classes to compare.</p>' : st.type === 'choropleth' && st.breaks === 'lumped' ? '<p><b>This one misleads.</b> The middle class spans most of the range, so very different places share one shade.</p>' : '') + '<p class="bt-small">Any single map also shows one moment: it cannot show change over time.</p>';
      }
      T.explain($('.hug-mr-say'), '<b>' + esc(head) + '</b>', body);
      var pic = $('.hug-mr-fig .hug-map-pic svg');
      if(pic) pic.setAttribute('aria-label', (x.spec && x.spec.label ? x.spec.label : 'Cartogram of Country A') + '. ' + head);
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>', 'explore');
        LS.pills([{ k: 'Map', html: esc(K.short), tone: 'accent' }], 'left', 'explore');
        LS.pills([{ k: 'Place', html: esc(bid === 'country-a' ? 'Country A' : BASE_NAMES[bid]), tone: 'readout' }], 'right', 'explore');
      }
    }
    function nums(bid, x){
      var rows = x.table.slice().sort(function(a, b){ return b.density - a.density; }), inv = !!R.base(bid).invented;
      $('.hug-mr-nums').innerHTML = '<h3 class="ls-title-l">The invented data</h3><p class="bt-small">The same numbers feed every map type: ' + (inv ? 'people and land in each province.' : 'people and land in each place, in invented units.') + '</p>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Invented data"><table class="ls-tbl"><caption class="sr-only">Invented people, land and density for each place</caption><thead><tr><th scope="col">Place</th><th scope="col">People</th><th scope="col">' + (inv ? 'Per km²' : 'Per 1,000 km²') + '</th></tr></thead><tbody>' +
        rows.map(function(r){ return '<tr><th scope="row">' + esc(r.name) + '</th><td class="r">' + nf(r.people) + '</td><td class="r">' + nf(r.density, 1) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    function onClick(e){
      var t = e.target.closest('.hug-mr-type'); if(t){ act(); st.type = t.getAttribute('data-t'); st.sel = null; draw(); return; }
      var r = e.target.closest('.hug-mr-rd'); if(r){ act(); st.read = r.getAttribute('data-r'); render(cur.bid); return; }
      var b = e.target.closest('.hug-mr-br'); if(b){ act(); st.breaks = b.getAttribute('data-b'); render(cur.bid); return; }
      var sq = e.target.closest('.hug-mr-sq');
      if(sq){ act(); st.sel = sq.getAttribute('data-id'); var q = cur.x.cartogram.squares.filter(function(s){ return s.id === st.sel; })[0]; $('.hug-mr-read').innerHTML = '<b>' + esc(q.name) + '</b>: ' + nf(q.value) + ' people (invented).'; return; }
      var p = e.target.closest('.hug-mr-f');
      if(p && cur){
        var paths = Array.prototype.slice.call(p.parentNode.querySelectorAll('.hug-mr-f')), i = paths.indexOf(p), f = R.base(cur.bid).features[i];
        if(f){ act(); st.sel = f.id; readout(); }
      }
    }
    host.addEventListener('click', onClick);
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.hug-mr-stage')], dock: [$('.hug-mr-ctl')], why: [$('.hug-mr-say')], details: [$('.hug-mr-nums')] });
      host.removeEventListener('click', onClick); s.root.addEventListener('click', onClick);
      draw();
    }
    draw();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    host.innerHTML = '<p class="bt-loading">Loading the maps…</p>';
    bases(R.basesFor(data.contexts)).then(function(){
      host.innerHTML = '';
      T.drill(host, data, { slug: 'map-reader', noun: 'problem',
        generate: function(r, ctx, type){ return R.generate(r, ctx, type); },
        types: R.TYPES, typeLabel: 'Kind of problem',
        title: function(p){ var t = R.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
        extra: function(el, p){ figure(el, p); },
        onStep: function(s, right, api){ doneLine(host, s, right, api); }
      });
    }).catch(function(e){ try{ console.error(e); }catch(x){} host.innerHTML = '<p class="hug-soon" role="alert">The maps could not load. Check your connection and reload the page.</p>'; });
  }
  function doneLine(host, s, right, api){
    api.firsts = (api.firsts || 0) + (right ? 1 : 0);
    var steps = api.problem.steps, n = steps.length;
    if(s !== steps[n - 1]) return;
    var r = api.firsts, st = studioOf(host);
    api.firsts = 0;
    setTimeout(function(){
      var msg = r === n ? '<b>All ' + n + ' steps right the first time.</b> The worked solution is under Why.'
        : '<b>Done: every answer is now in.</b> First tries: ' + r + ' of ' + n + ' right (the misses go to your review queue). The worked solution is under Why.';
      if(st){ st.caption(msg, 'quiz'); st.pills([{ html: r + ' of ' + n + ' first try', tone: r === n ? 'good' : 'warn' }], 'left', 'quiz'); }
    }, 0);
  }
  function figure(el, p){
    var g = p.figure, html = '';
    if(g.kind === 'cartogram') html = cartoHtml(g.data, g.title);
    else html = mapHtml(g.spec);
    if(g.table) html += T.dataTable(g.table.cols, g.table.rows, 'Invented data for practice');
    el.innerHTML = '<div class="cd-fig hug-mr-qfig">' + html + '</div>';
  }
})();
