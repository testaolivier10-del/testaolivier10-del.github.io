/* Per-page measurements for assets/analytics.js, loaded through
   LevlLazy('analytics-page') once the page is idle (docs/analytics-plan.md):
   - read: on notes and lessons, how far down and how many active minutes;
   - rage-click: three quick clicks on one spot, with the page and the label;
   - vitals: largest paint, layout shift and slowest tap, one visit in three.
   All coarse bands, sent as one beacon when the page closes. */
(function(){
  function pageKind(path){
    if(/\/notes\/|study-notes|\/textbook/.test(path)) return 'notes';
    if(/\/lessons\/|\/learn(\.html)?$/.test(path)) return 'lesson';
    if(/\/tools?\//.test(path) || /tools\.html$/.test(path)) return 'tool';
    if(/practice|review|exams?/.test(path)) return 'practice';
    return 'page';
  }

  function bucket(v, edges, labels){
    for(var i = 0; i < edges.length; i++) if(v < edges[i]) return labels[i];
    return labels[labels.length - 1];
  }

  var watched = false;
  function watch(){
    var A = window.LevlAnalytics;
    if(watched || !A) return;
    watched = true;
    var beacon = A._beacon, event = A.event, courseOf = A._courseOf;
    var path = location.pathname;
    var kind = pageKind(path);
    var course = courseOf(path);

    // Notes and lessons: depth and active reading time.
    var reading = kind === 'notes' || kind === 'lesson';
    var maxDepth = 0, activeSecs = 0, lastInput = Date.now();
    function depthNow(){
      try {
        var h = document.documentElement.scrollHeight || document.body.scrollHeight || 1;
        return Math.min(1, ((window.scrollY || window.pageYOffset || 0) + (window.innerHeight || 0)) / h);
      } catch(e){ return 0; }
    }
    function touched(){ lastInput = Date.now(); }
    if(reading){
      maxDepth = depthNow();
      ['scroll', 'keydown', 'pointerdown', 'touchstart'].forEach(function(t){
        window.addEventListener(t, function(){ touched(); if(t === 'scroll') maxDepth = Math.max(maxDepth, depthNow()); }, { passive: true });
      });
      var iv = setInterval(function(){
        if(document.visibilityState === 'visible' && Date.now() - lastInput < 30000) activeSecs++;
      }, 1000);
      if(iv && iv.unref) iv.unref(); // tests run this in Node
    }

    // Three quick clicks on one spot, once per page.
    var clicks = [], raged = false;
    document.addEventListener('click', function(ev){
      if(raged) return;
      var now = Date.now();
      clicks.push({ t: now, x: ev.clientX, y: ev.clientY });
      clicks = clicks.filter(function(c){ return now - c.t < 1000; });
      if(clicks.length >= 3 && clicks.every(function(c){ return Math.abs(c.x - ev.clientX) < 40 && Math.abs(c.y - ev.clientY) < 40; })){
        raged = true;
        event('rage-click', { course: course, page: path.slice(0, 80), el: describe(ev.target) });
      }
    }, true);

    // LCP, CLS and slowest tap, one visit in three.
    var vitals = Math.random() < 0.34 && window.PerformanceObserver ? { lcp: 0, cls: 0, inp: 0 } : null;
    if(vitals){
      observe('largest-contentful-paint', function(e){ vitals.lcp = Math.max(vitals.lcp, e.startTime); });
      observe('layout-shift', function(e){ if(!e.hadRecentInput) vitals.cls += e.value; });
      observe('event', function(e){ vitals.inp = Math.max(vitals.inp, e.duration); }, { durationThreshold: 40 });
    }

    var sent = false;
    function closing(){
      if(sent) return;
      sent = true;
      if(reading && activeSecs >= 5){
        beacon('read', {
          course: course,
          kind: kind,
          depth: bucket(maxDepth, [0.25, 0.5, 0.75, 0.95], ['0-25', '25-50', '50-75', '75-95', '95-100']),
          mins: bucket(activeSecs / 60, [1, 3, 10], ['<1', '1-3', '3-10', '10+'])
        });
      }
      if(vitals && vitals.lcp){
        beacon('vitals', {
          course: course,
          kind: kind,
          device: (window.innerWidth || 0) < 768 ? 'phone' : 'wide',
          lcp: bucket(vitals.lcp, [1200, 2500, 4000], ['<1.2s', '1.2-2.5s', '2.5-4s', '4s+']),
          cls: bucket(vitals.cls, [0.1, 0.25], ['<0.1', '0.1-0.25', '0.25+']),
          inp: vitals.inp ? bucket(vitals.inp, [200, 500], ['<200ms', '200-500ms', '500ms+']) : 'none'
        });
      }
    }
    document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') closing(); });
    window.addEventListener('pagehide', closing);
  }

  function observe(type, fn, extra){
    try {
      var po = new PerformanceObserver(function(list){ list.getEntries().forEach(fn); });
      var opts = { type: type, buffered: true };
      if(extra) for(var k in extra) opts[k] = extra[k];
      po.observe(opts);
    } catch(e){ /* this browser does not measure it */ }
  }

  function describe(el){
    try {
      if(!el || !el.tagName) return 'unknown';
      var s = el.tagName.toLowerCase();
      if(el.id) s += '#' + el.id;
      else if(el.classList && el.classList[0]) s += '.' + el.classList[0];
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24);
      return (s + (text ? ' "' + text + '"' : '')).slice(0, 60);
    } catch(e){ return 'unknown'; }
  }


  window.LevlAnalyticsPage = { watch: watch };
})();
