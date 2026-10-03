/* Skills tool: graph construction (science practice 4.A). Given a data table
   (bio/data/tools/graph-builder.json), the student chooses the graph type and
   says why, puts the variables on the axes, picks labels with units, sets
   each axis's scale, plots every point (and its ±2 SE error bar), then
   checks the graph. Every criterion is checked automatically with specific
   feedback (ApBioMath.graph.checkScale for the scale) and recorded as its
   own item, graph-builder:<data set>:<criterion>.

   Plotting works three ways, all equivalent: type the values (with -/+
   buttons that move one grid step), click or tap the grid to place the
   point chosen in "Point to place", or focus a plotted point (or bar) and
   move it with the arrow keys, one grid step at a time (Shift: one
   interval). Nothing needs dragging. */
(function(){
  'use strict';
  var SLUG = 'graph-builder';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, G = M.graph, gid = T.nid('gb');
    var ds, st, checked;
    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('What a full-credit graph needs', data.howItWorks) +
      '<section class="bt-card" aria-labelledby="' + gid + '-dh"><h2 id="' + gid + '-dh">The data</h2><div class="gb-pick"></div><div class="gb-data"></div></section>' +
      '<form class="bt-card gb-steps" novalidate aria-labelledby="' + gid + '-bh"><h2 id="' + gid + '-bh">Build the graph</h2><div class="gb-body"></div>' +
      '<div class="bt-actions"><button type="submit" class="btn-press sm">Check my graph</button></div></form>' +
      '<section class="bt-card gb-feedback" aria-labelledby="' + gid + '-fh" hidden><h2 id="' + gid + '-fh" tabindex="-1">How your graph did</h2><div class="gb-fb" role="status" aria-live="polite"></div></section>');
    var pick = T.choiceSelect({ label: 'Data set', options: data.datasets.map(function(d){ return { value: d.id, label: d.title }; }), value: data.datasets[0].id, onChange: function(v){ load(v); } });
    app.querySelector('.gb-pick').appendChild(pick.el);
    var form = app.querySelector('form.gb-steps'), body = form.querySelector('.gb-body'), fbCard = app.querySelector('.gb-feedback');
    form.addEventListener('submit', function(e){ e.preventDefault(); check(); });

    function col(id){ return ds.columns.filter(function(c){ return c.id === id; })[0]; }
    function colIndex(id){ for(var i = 0; i < ds.columns.length; i++) if(ds.columns[i].id === id) return i; return -1; }
    function isNum(id){ var i = colIndex(id); return i > -1 && ds.rows.every(function(r){ return typeof r[i] === 'number'; }); }
    function labelOf(c, unit){ return c.name + (unit ? ' (' + unit + ')' : ''); }
    /* Label choices: every column with its unit, without a unit, and with a
       plausible wrong unit. */
    function labelOptions(){
      var out = [];
      ds.columns.forEach(function(c){
        if(c.unit) out.push({ value: c.id + '|' + c.unit, label: labelOf(c, c.unit) });
        out.push({ value: c.id + '|', label: labelOf(c, '') });
        (c.wrongUnits || []).forEach(function(u){ out.push({ value: c.id + '|' + u, label: labelOf(c, u) }); });
      });
      return out.sort(function(a, b){ return a.label < b.label ? -1 : 1; });
    }
    function num(v){ return v === '' || v == null ? NaN : window.ApBioQuestions.parseNumber(v); }

    function load(id){
      ds = data.datasets.filter(function(d){ return d.id === id; })[0];
      checked = false;
      st = { type: '', just: -1, x: '', y: '', xl: '', yl: '', xs: { min: '', max: '', interval: '' }, ys: { min: '', max: '', interval: '' }, pts: ds.rows.map(function(){ return { x: null, y: null, e: null }; }), active: 0 };
      var cols = ds.columns.map(function(c){ return esc(labelOf(c, c.unit)); });
      if(ds.err) cols.push('±2 SE (' + esc(col(ds.dv).unit) + ')');
      app.querySelector('.gb-data').innerHTML = '<div class="bt-context">' + ds.text + '</div>' +
        T.dataTable(cols, ds.rows.map(function(r, i){ var row = r.map(function(v){ return esc(typeof v === 'number' ? String(v) : v); }); if(ds.err) row.push(String(ds.err[i])); return row; }), esc(ds.caption));
      renderForm();
      fbCard.hidden = true;
    }

    function radios(name, legend, opts, sel){
      return '<fieldset class="bt-part bt-part-choice"><legend>' + legend + '</legend>' + opts.map(function(o, i){
        var id = gid + '-' + name + '-' + i;
        return '<div class="bt-radio"><input type="radio" name="' + gid + '-' + name + '" id="' + id + '" value="' + esc(o.value) + '"' + (String(o.value) === String(sel) ? ' checked' : '') + '><label for="' + id + '">' + esc(o.label) + '</label></div>';
      }).join('') + '</fieldset>';
    }
    function sel(name, label, opts, value){
      var id = gid + '-' + name;
      return '<div class="bt-ctl bt-field"><label for="' + id + '">' + label + '</label><select id="' + id + '" data-f="' + name + '"><option value="">Choose…</option>' +
        opts.map(function(o){ return '<option value="' + esc(o.value) + '"' + (o.value === value ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select></div>';
    }
    function numIn(axis, k, label){
      var id = gid + '-' + axis + k;
      return '<div class="gb-num"><label for="' + id + '">' + label + '</label><input type="text" inputmode="decimal" id="' + id + '" data-ax="' + axis + '" data-k="' + k + '" value="' + esc(st[axis][k]) + '" autocomplete="off"></div>';
    }
    function renderForm(){
      var colOpts = ds.columns.map(function(c){ return { value: c.id, label: c.name }; });
      body.innerHTML =
        '<div class="gb-step"><h3 class="bt-sec-h">1. Graph type</h3>' + radios('type', 'Which kind of graph fits these data?', data.types.map(function(t){ return { value: t.id, label: t.name }; }), st.type) +
        radios('just', 'Why?', data.justifications.map(function(j, i){ return { value: i, label: j }; }), st.just) + '</div>' +
        '<div class="gb-step"><h3 class="bt-sec-h">2. Variables on the axes</h3><div class="gb-row">' + sel('x', 'x-axis (horizontal)', colOpts, st.x) + sel('y', 'y-axis (vertical)', colOpts, st.y) + '</div></div>' +
        '<div class="gb-step"><h3 class="bt-sec-h">3. Axis labels</h3><div class="gb-row">' + sel('xl', 'x-axis label', labelOptions(), st.xl) + sel('yl', 'y-axis label', labelOptions(), st.yl) + '</div></div>' +
        '<div class="gb-step"><h3 class="bt-sec-h">4. Scale</h3><div class="gb-row">' +
          '<fieldset class="gb-axisset gb-xs"><legend>x-axis scale</legend><div class="gb-row">' + numIn('xs', 'min', 'Minimum') + numIn('xs', 'max', 'Maximum') + numIn('xs', 'interval', 'Interval') + '</div></fieldset>' +
          '<fieldset class="gb-axisset"><legend>y-axis scale</legend><div class="gb-row">' + numIn('ys', 'min', 'Minimum') + numIn('ys', 'max', 'Maximum') + numIn('ys', 'interval', 'Interval') + '</div></fieldset></div>' +
          '<p class="bt-hint gb-barnote" hidden>A bar graph’s x-axis shows categories, so it needs no number scale.</p></div>' +
        '<div class="gb-step"><h3 class="bt-sec-h">5. Plot the data</h3><p class="bt-hint">Type each value, use the −/+ buttons (one grid step), click or tap the grid to place the point chosen below, or focus a plotted point and use the arrow keys (Shift + arrow moves one interval).</p>' +
          '<div class="gb-place"></div><div class="gb-grid"></div><p class="bt-small gb-say" role="status" aria-live="polite"></p><div class="gb-table"></div></div>';
      body.querySelectorAll('input[name="' + gid + '-type"]').forEach(function(r){ r.addEventListener('change', function(){ st.type = r.value; refresh(); }); });
      body.querySelectorAll('input[name="' + gid + '-just"]').forEach(function(r){ r.addEventListener('change', function(){ st.just = +r.value; }); });
      body.querySelectorAll('select[data-f]').forEach(function(s){ s.addEventListener('change', function(){ st[s.getAttribute('data-f')] = s.value; refresh(); }); });
      body.querySelectorAll('input[data-ax]').forEach(function(i){ i.addEventListener('input', function(){ st[i.getAttribute('data-ax')][i.getAttribute('data-k')] = i.value; drawGrid(); }); });
      refresh();
    }

    function bar(){ return st.type === 'bar'; }
    function scaleOf(a){ var s = st[a], o = { min: num(s.min), max: num(s.max), interval: num(s.interval) }; o.ok = isFinite(o.min) && isFinite(o.max) && isFinite(o.interval) && o.max > o.min && o.interval > 0 && (o.max - o.min) / o.interval <= 60; return o; }
    function minor(sc){ return sc.ok ? G.minorStep(sc.interval) : 1; }
    function xVals(){ var i = colIndex(st.x); return ds.rows.map(function(r){ return r[i]; }); }
    function yVals(){ var i = colIndex(st.y); return ds.rows.map(function(r){ return r[i]; }); }
    function pointName(k){ var xi = colIndex(st.x || ds.iv), v = ds.rows[k][xi]; var c = col(st.x || ds.iv); return 'Point ' + (k + 1) + ' (' + (typeof v === 'number' ? v + (c.unit ? ' ' + c.unit : '') : v) + ')'; }

    function refresh(){
      body.querySelector('.gb-xs').hidden = bar();
      body.querySelector('.gb-barnote').hidden = !bar();
      drawPlaceSelect(); drawTable(); drawGrid();
    }
    function drawPlaceSelect(){
      body.querySelector('.gb-place').innerHTML = '<div class="bt-ctl bt-field"><label for="' + gid + '-act">Point to place with a click or tap</label><select id="' + gid + '-act">' +
        ds.rows.map(function(r, k){ return '<option value="' + k + '"' + (k === st.active ? ' selected' : '') + '>' + esc(pointName(k)) + (st.pts[k].y == null ? ' (not placed)' : '') + '</option>'; }).join('') + '</select></div>';
      body.querySelector('#' + gid + '-act').addEventListener('change', function(){ st.active = +this.value; drawGrid(); });
    }
    function adj(k, f, label, val){
      var id = gid + '-p' + k + f;
      return '<td><span class="gb-adj"><button type="button" data-k="' + k + '" data-f="' + f + '" data-d="-1" aria-label="Decrease ' + esc(label) + '">−</button>' +
        '<input type="text" inputmode="decimal" id="' + id + '" data-k="' + k + '" data-f="' + f + '" value="' + (val == null ? '' : esc(String(M.round(val, 6)))) + '" aria-label="' + esc(label) + '">' +
        '<button type="button" data-k="' + k + '" data-f="' + f + '" data-d="1" aria-label="Increase ' + esc(label) + '">+</button></span></td>';
    }
    function drawTable(){
      var xl = st.x ? col(st.x).name : 'x', yl = st.y ? col(st.y).name : 'y';
      var head = '<th scope="col">Point</th>' + (bar() ? '' : '<th scope="col">x: ' + esc(xl) + '</th>') + '<th scope="col">' + (bar() ? 'Bar height: ' : 'y: ') + esc(yl) + '</th>' + (ds.err ? '<th scope="col">Error bar ±</th>' : '');
      body.querySelector('.gb-table').innerHTML = '<div class="table-wrap" tabindex="0" role="region" aria-label="Points to plot"><table class="gb-pts"><thead><tr>' + head + '</tr></thead><tbody>' +
        ds.rows.map(function(r, k){
          var p = st.pts[k], nm = pointName(k);
          return '<tr><th scope="row">' + esc(nm) + '</th>' + (bar() ? '' : adj(k, 'x', nm + ' x value', p.x)) + adj(k, 'y', nm + (bar() ? ' bar height' : ' y value'), p.y) + (ds.err ? adj(k, 'e', nm + ' error bar size', p.e) : '') + '</tr>';
        }).join('') + '</tbody></table></div>';
      body.querySelectorAll('.gb-pts input').forEach(function(i){
        i.addEventListener('change', function(){ var k = +i.getAttribute('data-k'), f = i.getAttribute('data-f'), v = num(i.value); st.pts[k][f] = isFinite(v) ? v : null; drawGrid(); drawPlaceSelect(); });
      });
      body.querySelectorAll('.gb-pts button').forEach(function(b){
        b.addEventListener('click', function(){
          var k = +b.getAttribute('data-k'), f = b.getAttribute('data-f'), d = +b.getAttribute('data-d');
          var sc = scaleOf(f === 'x' ? 'xs' : 'ys'), stp = minor(sc), p = st.pts[k];
          var cur = p[f] == null ? (f === 'e' ? 0 : sc.ok ? sc.min : 0) : p[f];
          p[f] = M.round(Math.max(f === 'e' ? 0 : -Infinity, cur + d * stp), 6);
          body.querySelector('#' + gid + '-p' + k + f).value = String(p[f]);
          drawGrid(); drawPlaceSelect();
          say(pointName(k) + ': ' + (f === 'x' ? 'x' : f === 'y' ? (bar() ? 'height' : 'y') : 'error bar ±') + ' ' + p[f] + '.');
        });
      });
    }
    var sayEl = null;
    function say(t){ sayEl = body.querySelector('.gb-say'); if(sayEl) sayEl.textContent = t; }

    /* The grid. Plot area L..L+pw, T..T+ph. */
    var W = 560, H = 380, L = 70, R = 16, TOP = 16, B = 62, pw = W - L - R, ph = H - TOP - B;
    function drawGrid(){
      var host = body.querySelector('.gb-grid'), ys = scaleOf('ys'), xs = scaleOf('xs');
      var why = !st.y ? 'Choose the y-axis variable.' : !isNum(st.y) ? 'The y-axis variable has categories, not numbers. Put a number variable on the y-axis.' :
        !ys.ok ? 'Enter a y-axis minimum, maximum and interval (the maximum larger than the minimum) to see the grid.' :
        !bar() && (!st.x || !isNum(st.x)) ? (st.x ? 'This x-axis variable has categories, not numbers, so it cannot go on a number scale. A bar graph shows categories.' : 'Choose the x-axis variable.') :
        !bar() && !xs.ok ? 'Enter an x-axis minimum, maximum and interval to see the grid.' : '';
      if(why){ host.innerHTML = '<p class="bio-soon">' + esc(why) + '</p>'; return; }
      var sy = function(v){ return TOP + ph - (v - ys.min) / (ys.max - ys.min) * ph; };
      var n = ds.rows.length, sx = bar() ? function(k){ return L + pw * (k + 0.5) / n; } : function(v){ return L + (v - xs.min) / (xs.max - xs.min) * pw; };
      var p = [], my = minor(ys), mx = minor(xs);
      for(var v = ys.min; v <= ys.max + 1e-9; v += my) p.push('<line class="minor" x1="' + L + '" x2="' + (L + pw) + '" y1="' + sy(v).toFixed(1) + '" y2="' + sy(v).toFixed(1) + '"/>');
      if(!bar()) for(var u = xs.min; u <= xs.max + 1e-9; u += mx) p.push('<line class="minor" y1="' + TOP + '" y2="' + (TOP + ph) + '" x1="' + sx(u).toFixed(1) + '" x2="' + sx(u).toFixed(1) + '"/>');
      for(var w = ys.min; w <= ys.max + 1e-9; w += ys.interval) p.push('<line class="grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + sy(w).toFixed(1) + '" y2="' + sy(w).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(w) + 4).toFixed(1) + '" text-anchor="end">' + M.round(w, 6) + '</text>');
      if(!bar()) for(var z = xs.min; z <= xs.max + 1e-9; z += xs.interval) p.push('<line class="grid" y1="' + TOP + '" y2="' + (TOP + ph) + '" x1="' + sx(z).toFixed(1) + '" x2="' + sx(z).toFixed(1) + '"/><text class="tick" x="' + sx(z).toFixed(1) + '" y="' + (TOP + ph + 17) + '" text-anchor="middle">' + M.round(z, 6) + '</text>');
      else { var xi = colIndex(st.x || ds.iv); ds.rows.forEach(function(r, k){ p.push('<text class="tick" x="' + sx(k).toFixed(1) + '" y="' + (TOP + ph + 17) + '" text-anchor="middle">' + esc(r[xi]) + '</text>'); }); }
      var zeroY = ys.min <= 0 && ys.max >= 0 ? sy(0) : TOP + ph;
      p.push('<line class="axis" x1="' + L + '" x2="' + (L + pw) + '" y1="' + zeroY.toFixed(1) + '" y2="' + zeroY.toFixed(1) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + TOP + '" y2="' + (TOP + ph) + '"/>');
      p.push('<rect class="hit" x="' + L + '" y="' + TOP + '" width="' + pw + '" height="' + ph + '"/>');
      var placed = [];
      st.pts.forEach(function(q, k){ if(q.y != null && (bar() || q.x != null)) placed.push(k); });
      if(st.type === 'line' && placed.length > 1){
        var ord = placed.slice().sort(function(a, b){ return st.pts[a].x - st.pts[b].x; });
        p.push('<polyline class="gline" points="' + ord.map(function(k){ return sx(st.pts[k].x).toFixed(1) + ',' + sy(st.pts[k].y).toFixed(1); }).join(' ') + '"/>');
      }
      placed.forEach(function(k){
        var q = st.pts[k], cx = bar() ? sx(k) : sx(q.x), cy = sy(q.y), on = k === st.active ? ' is-on' : '';
        if(bar()){
          var bw = Math.min(64, pw / n * 0.55), base = zeroY;
          p.push('<rect class="gbar' + on + '" data-k="' + k + '" tabindex="0" role="slider" aria-orientation="vertical" aria-valuemin="' + ys.min + '" aria-valuemax="' + ys.max + '" aria-valuenow="' + q.y + '" aria-valuetext="' + esc(pointName(k) + ' bar height ' + q.y) + '" aria-label="' + esc(pointName(k) + ' bar') + '" x="' + (cx - bw / 2).toFixed(1) + '" y="' + Math.min(cy, base).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.abs(base - cy).toFixed(1) + '"/>');
        }
        if(q.e) p.push('<path class="err" d="M' + cx.toFixed(1) + ' ' + sy(q.y + q.e).toFixed(1) + 'V' + sy(q.y - q.e).toFixed(1) + 'M' + (cx - 6).toFixed(1) + ' ' + sy(q.y + q.e).toFixed(1) + 'h12M' + (cx - 6).toFixed(1) + ' ' + sy(q.y - q.e).toFixed(1) + 'h12"/>');
        if(!bar()) p.push('<circle class="gpt' + on + '" data-k="' + k + '" tabindex="0" role="button" aria-roledescription="movable point" aria-label="' + esc(pointName(k) + ': x ' + q.x + ', y ' + q.y + '. Arrow keys move it.') + '" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="7"/>');
      });
      var xl = st.xl ? st.xl.split('|') : null, yl = st.yl ? st.yl.split('|') : null;
      if(xl) p.push('<text class="lbl" x="' + (L + pw / 2) + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(labelOf(col(xl[0]), xl[1])) + '</text>');
      if(yl) p.push('<text class="lbl" transform="translate(16 ' + (TOP + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc(labelOf(col(yl[0]), yl[1])) + '</text>');
      var label = 'Your graph: ' + (st.type ? st.type + ' graph' : 'graph') + ' with ' + placed.length + ' of ' + n + ' points plotted. The table below the grid lists every point’s values.';
      host.innerHTML = '<svg class="bio-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(label) + '">' + p.join('') + '</svg>';
      var svg = host.querySelector('svg');
      svg.addEventListener('click', function(e){
        var t = e.target;
        if(t.hasAttribute && t.hasAttribute('data-k')){ st.active = +t.getAttribute('data-k'); drawPlaceSelect(); drawGrid(); return; }
        var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
        if(x < L - 4 || x > L + pw + 4 || y < TOP - 4 || y > TOP + ph + 4) return;
        var k = st.active, q = st.pts[k];
        q.y = snap(ys.min + (TOP + ph - y) / ph * (ys.max - ys.min), ys.min, my);
        if(!bar()) q.x = snap(xs.min + (x - L) / pw * (xs.max - xs.min), xs.min, mx);
        say(pointName(k) + ' placed at ' + (bar() ? 'height ' + q.y : 'x ' + q.x + ', y ' + q.y) + '.');
        var nxt = st.pts.findIndex(function(o, j){ return j > k && o.y == null; });
        if(nxt > -1) st.active = nxt;
        drawTable(); drawPlaceSelect(); drawGrid();
      });
      svg.querySelectorAll('[data-k]').forEach(function(el){
        el.addEventListener('keydown', function(e){
          var k = +el.getAttribute('data-k'), q = st.pts[k], dx = 0, dy = 0;
          if(e.key === 'ArrowUp') dy = 1; else if(e.key === 'ArrowDown') dy = -1;
          else if(e.key === 'ArrowRight' && !bar()) dx = 1; else if(e.key === 'ArrowLeft' && !bar()) dx = -1;
          else if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); st.active = k; drawPlaceSelect(); drawGrid(); focusPt(k); return; }
          else return;
          e.preventDefault();
          if(dy) q.y = M.round(q.y + dy * (e.shiftKey ? ys.interval : my), 6);
          if(dx) q.x = M.round(q.x + dx * (e.shiftKey ? xs.interval : mx), 6);
          st.active = k;
          drawTable(); drawPlaceSelect(); drawGrid(); focusPt(k);
          say(pointName(k) + ': ' + (bar() ? 'height ' + q.y : 'x ' + q.x + ', y ' + q.y) + '.');
        });
      });
    }
    function focusPt(k){ var el = body.querySelector('.gb-grid [data-k="' + k + '"]'); if(el) el.focus(); }
    function snap(v, origin, step){ return M.round(origin + Math.round((v - origin) / step) * step, 6); }

    /* --------------------------------------------------------- check */
    function check(){
      var out = [], items = [], ys = scaleOf('ys'), xs = scaleOf('xs');
      function add(key, ok, msg){ out.push({ ok: ok, msg: msg }); items.push({ id: SLUG + ':' + ds.id + ':' + key, correct: ok, topic: ds.topic, practice: '4.A', level: 'apply', diff: 2, group: key }); }
      var typeOk = st.type === ds.type || (ds.alsoAccept || []).indexOf(st.type) > -1;
      add('type', typeOk, st.type ? (st.type === ds.type ? 'Graph type: right. ' : typeOk ? 'Graph type: accepted. ' : 'Graph type: not the best choice. ') + ds.typeWhy[st.type] : 'Graph type: choose a type. ' + ds.typeWhy[ds.type]);
      add('justify', st.just === ds.justify.correct, st.just < 0 ? 'Reason: choose why that type fits.' : (st.just === ds.justify.correct ? 'Reason: right. ' : 'Reason: not quite. ') + ds.justify.why[st.just]);
      var axOk = st.x === ds.iv && st.y === ds.dv;
      add('axes', axOk, axOk ? 'Axes: right. The ' + (ds.type === 'scatter' ? 'explanatory variable' : 'independent variable') + ', ' + col(ds.iv).name.toLowerCase() + ', is on the x-axis and ' + col(ds.dv).name.toLowerCase() + ' is on the y-axis.'
        : !st.x || !st.y ? 'Axes: choose a variable for each axis.' : st.x === st.y ? 'Axes: put two different variables on the axes.'
        : 'Axes: put ' + (ds.type === 'scatter' ? 'the variable that explains or predicts the other' : 'the independent variable, the one the investigator chose') + ' (' + col(ds.iv).name.toLowerCase() + ') on the x-axis and ' + col(ds.dv).name.toLowerCase() + ' on the y-axis.');
      function labelMsg(axis, chosen, onAxis){
        if(!chosen) return { ok: false, msg: 'Choose ' + (axis === 'x' ? 'an' : 'a') + ' ' + axis + '-axis label.' };
        var parts = chosen.split('|'), c = col(onAxis || '');
        if(!c) return { ok: false, msg: 'Choose the ' + axis + '-axis variable first.' };
        if(parts[0] !== c.id) return { ok: false, msg: 'The ' + axis + '-axis label names ' + col(parts[0]).name.toLowerCase() + ', but the axis shows ' + c.name.toLowerCase() + '.' };
        if(c.unit && !parts[1]) return { ok: false, msg: 'The ' + axis + '-axis label has no units. Write them in parentheses: ' + labelOf(c, c.unit) + '.' };
        if(parts[1] !== (c.unit || '')) return { ok: false, msg: 'The ' + axis + '-axis label has the wrong unit: the data are in ' + c.unit + ', so write ' + labelOf(c, c.unit) + '.' };
        return { ok: true, msg: 'The ' + axis + '-axis label is right: ' + labelOf(c, c.unit) + '.' };
      }
      var lx = labelMsg('x', st.xl, st.x), ly = labelMsg('y', st.yl, st.y);
      add('labels', lx.ok && ly.ok, 'Labels: ' + lx.msg + ' ' + ly.msg);
      var sc = [];
      var yv = yVals().filter(function(v){ return typeof v === 'number'; }), errs = ds.err || [];
      var yAll = yv.concat(ds.err && st.y === ds.dv ? yv.map(function(v, i){ return v + errs[i]; }).concat(yv.map(function(v, i){ return v - errs[i]; })) : []);
      if(st.y && isNum(st.y)) sc = sc.concat(G.checkScale({ min: num(st.ys.min), max: num(st.ys.max), interval: num(st.ys.interval) }, yAll, { name: 'y-axis', bar: st.type === 'bar' }));
      else sc.push({ ok: false, msg: 'Put a number variable on the y-axis before setting its scale.' });
      if(!bar()){
        if(st.x && isNum(st.x)) sc = sc.concat(G.checkScale({ min: num(st.xs.min), max: num(st.xs.max), interval: num(st.xs.interval) }, xVals(), { name: 'x-axis' }));
        else sc.push({ ok: false, msg: 'The x-axis variable needs to be a number variable for a ' + (st.type || 'line') + ' graph.' });
      }
      var bad = sc.filter(function(x){ return !x.ok; });
      add('scale', !bad.length, bad.length ? 'Scale: ' + bad.map(function(x){ return x.msg; }).join(' ') : 'Scale: every check passed (even steps, easy interval, every value fits, sensible start, the data use most of the grid).');
      // points against the student's own axes (so a swapped axis is one mistake, not two)
      var xi = colIndex(st.x), yi = colIndex(st.y), wrong = [], missing = [];
      var tx = minor(xs) / 2 + 1e-9, ty = minor(ys) / 2 + 1e-9;
      ds.rows.forEach(function(r, k){
        var q = st.pts[k];
        if(q.y == null || (!bar() && q.x == null)){ missing.push(k + 1); return; }
        var okY = yi > -1 && typeof r[yi] === 'number' && Math.abs(q.y - r[yi]) <= ty;
        var okX = bar() || (xi > -1 && typeof r[xi] === 'number' && Math.abs(q.x - r[xi]) <= tx);
        if(!(okX && okY)) wrong.push('point ' + (k + 1) + ' should be at ' + (bar() ? 'height ' + r[yi] : 'x = ' + r[xi] + ', y = ' + r[yi]) + ' (you have ' + (bar() ? q.y : q.x + ', ' + q.y) + ')');
      });
      add('points', !missing.length && !wrong.length && xi > -1 && yi > -1, missing.length ? 'Points: not placed yet: point' + (missing.length > 1 ? 's ' : ' ') + missing.join(', ') + '.' : wrong.length ? 'Points: ' + wrong.join('; ') + '. A point counts when it is within half a grid step.' : 'Points: every point is where the data put it.');
      if(ds.err){
        var ew = [];
        ds.err.forEach(function(e, k){ var q = st.pts[k]; if(q.e == null || Math.abs(q.e - e) > ty) ew.push('point ' + (k + 1) + ' needs ±' + e + (q.e == null ? ' (none drawn)' : ' (you have ±' + q.e + ')')); });
        add('error-bars', !ew.length, ew.length ? 'Error bars: ' + ew.join('; ') + '. Each bar reaches 2 SE above and below its mean, as the table gives.' : 'Error bars: all ±2 SE bars are right.');
      }
      var right = out.filter(function(o){ return o.ok; }).length;
      fbCard.hidden = false;
      fbCard.querySelector('.gb-fb').innerHTML = '<p><b>' + right + ' of ' + out.length + ' criteria met.</b>' + (checked ? ' (Only your first check is recorded.)' : '') + '</p><ul>' + out.map(function(o){ return '<li class="' + (o.ok ? 'ok' : 'no') + '"><span class="bio-mark ' + (o.ok ? 'ok">Met' : 'no">Fix') + '</span> ' + esc(o.msg) + '</li>'; }).join('') + '</ul>' + T.report(SLUG + ':' + ds.id);
      fbCard.querySelector('h2').focus();
      if(!checked){ T.record(SLUG, items); T.event('apbio-graph-check', { tool: SLUG, set: ds.id, correct: right, total: out.length }); }
      checked = true;
    }
    load(data.datasets[0].id);
  });
})();
