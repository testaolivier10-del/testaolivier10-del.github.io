/* Trainer: titration curve reader (Unit 8). Each curve is computed from the
   exact charge balance at every point (ApChemMath.titration, seeded); the
   analytes are data (chem/data/tools/titration-curve-reader.json). The
   student marks the equivalence and half-equivalence points with a marker
   that moves by slider, typed volume, arrow keys or a tap on the graph,
   reads pKa, picks an indicator from the table and names the species at a
   marked point. Steps are checked by ApChemTools.drill. */
(function(){
  'use strict';
  var T = window.ApChemTools;
  if(!T) return;
  var KIND = { sa: 'Strong acid with strong base', wa: 'Weak acid with strong base', wb: 'Weak base with strong acid', di: 'Diprotic acid with strong base' };
  T.mount('titration-curve-reader', function(app, data){
    var M = window.ApChemMath, F = T.F;
    // plot() geometry (chem-tools.js): 560 × 330, left 66, right 16, top 16, bottom 56.
    var W = 560, L = 66, PW = W - 66 - 16;
    var cur = null, marker = null, marks = [];
    function draw(){
      var p = cur, host = app.querySelector('.tc-plot');
      if(!host) return;
      var pts = [];
      marks.forEach(function(m){ pts.push({ x: m.v, y: M.titration.pH(p.sys, m.v), cls: 's3', square: true }); });
      if(p.point && p.showPoint) pts.push({ x: p.point.v, y: p.point.pH, cls: 's4' });
      if(marker != null) pts.push({ x: marker, y: M.titration.pH(p.sys, marker), cls: 's2' });
      host.innerHTML = T.plot({ w: W, h: 330, title: 'Titration curve: pH against volume of ' + p.titrant + ' added, from 0 to ' + p.vmax + ' mL. ' + (marker != null ? 'Marker at ' + F(marker, 1) + ' mL, pH ' + F(M.titration.pH(p.sys, marker), 2) + '.' : ''),
        x: { label: 'Volume of ' + p.titrant + ' added', unit: 'mL', min: 0, max: p.vmax, step: T.niceStep(p.vmax, 6) },
        y: { label: 'pH', min: 0, max: 14, step: 2 },
        curves: [{ cls: 's1', points: p.curve }], points: pts, vline: marker != null ? { x: marker, cls: 's2' } : null });
      var svg = host.querySelector('svg');
      svg.addEventListener('click', function(e){
        if(!api || !api.setVol) return;
        var b = svg.getBoundingClientRect(), x = (e.clientX - b.left) * W / b.width;
        api.setVol((x - L) / PW * p.vmax);
      });
      var out = app.querySelector('.tc-read');
      if(out) out.textContent = marker != null ? 'Marker: ' + F(marker, 1) + ' mL, pH ' + F(M.titration.pH(p.sys, marker), 2) : '';
    }
    var api = null;
    T.drill(app, data, {
      slug: 'titration-curve-reader',
      generate: function(r, ctx){ var p = M.titration.generate(r, ctx); p.titrant = ctx.titrant; return p; },
      types: [{ value: 'sa', label: KIND.sa }, { value: 'wa', label: KIND.wa }, { value: 'wb', label: KIND.wb }, { value: 'di', label: KIND.di }],
      typeLabel: 'Kind of titration',
      title: function(p){ return KIND[p.sys.kind]; },
      newLabel: 'New curve',
      extra: function(host, p, a){
        cur = p; marker = null; marks = []; api = a; p.showPoint = false;
        host.innerHTML = '<figure class="tc-fig"><div class="tc-plot"></div><figcaption class="bt-small tc-read" aria-hidden="true"></figcaption></figure>' +
          T.dataTable(['Indicator', 'Color change range (pH)'], M.titration.INDICATORS.map(function(d){ return [d.name, F(d.lo, 1) + ' to ' + F(d.hi, 1)]; }), 'Indicators');
        draw();
      },
      onVol: function(v){ marker = v; draw(); },
      onStep: function(s, right){
        if(s.kind === 'vol'){ marks.push({ v: s.cell.answer }); marker = null; }
        // The species question that follows marks its point on the curve.
        if(s.key === 'indicator') cur.showPoint = true;
        draw();
      }
    });
  });
})();
