/* Policy Chain Builder page (docs/apmacro-spec.md section 6). OWNED BY THIS
   TOOL ONLY (builder T2). Mounts into #app with ApMacroTools.mount; the model
   is ApMacroMath.policyChain (macroeconomics/assets/tools/math/policy-chain.js),
   the content macroeconomics/data/tools/policy-chain.json (served filtered as
   assets/tool-data/policy-chain.json). Frame: ApMacroTools.modes (Explore,
   then Test yourself) on the Tool Studio.

   Explore: pick a chain (fiscal, monetary, open economy, crowding out,
   self-adjustment), its version and its direction, then step through it
   with Next link. The stage holds the chain so far (each link a card, the
   newest one marked) beside the graph for the newest link that has one,
   drawn by ApMacroGraph.svg (this file only adds the shift arrow and the
   axis marks): the reserve market for an administered rate, the money
   market for bonds, loanable funds for crowding out, the market for
   dollars for capital flows, AD-AS for output and prices. The old curve
   stays faded and dashed with subscript 1.
   Details ("Write it out"): the "Make it specific" sentence, one blank per
   link, graded by ApMacroGrade.specific; then the chain in the student's own
   words with ApMacroGrade.flags hints (directional, mechanism) and the links
   it names (hints only, never a score).
   Test yourself: ApMacroTools.drill over the model's generate(): every link
   after the first is a graded choice (the right link, the one after it, the
   right link the wrong way, the traps readers report), and the stage builds
   the chain and its graph as each link is answered. */
(function(){
  'use strict';
  var T = window.ApMacroTools, M = window.ApMacroMath, G = window.ApMacroGraph;
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Write it out');
  if(!T || !M || !M.policyChain || M.policyChain.stub || !G) return;
  var PC = M.policyChain, esc = T.esc;
  var GL = 50, GT = 14, PW = 250, PH = 226;
  function px(x){ return GL + x / 10 * PW; }
  function py(v){ return GT + (10 - v) / 10 * PH; }
  function f1(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  function cap(t){ return t.charAt(0).toUpperCase() + t.slice(1); }
  var TITLE = { reserves: 'Reserve market', money: 'Money market', adas: 'AD-AS', lf: 'Loanable funds market', forex: 'Foreign exchange market for dollars' };
  var MARK = { reserves: 'PR', money: 'i', adas: 'PL', lf: 'r', forex: 'XR' };

  T.mount('policy-chain', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'policy-chain',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------ drawing */
  function arrow(x1, y1, x2, y2){
    var a = [px(x1), py(y1)], b = [px(x2), py(y2)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if(L < 6) return '';
    var ux = dx / L, uy = dy / L, h = 7, w = 4.5, bx = b[0] - ux * h, by = b[1] - uy * h;
    return '<g class="pc-arrow"><path d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(bx) + ' ' + f1(by) + '"/><path class="pc-head" d="M' + f1(b[0]) + ' ' + f1(b[1]) + 'L' + f1(bx - uy * w) + ' ' + f1(by + ux * w) + 'L' + f1(bx + uy * w) + ' ' + f1(by - ux * w) + 'Z"/></g>';
  }
  function mark(t, x, y, cls, anchor){ return '<text class="pc-mark ' + (cls || '') + '" x="' + f1(x) + '" y="' + f1(y) + '" text-anchor="' + (anchor || 'start') + '">' + t + '</text>'; }
  function sub(main, n){ return esc(main) + (n ? '<tspan class="pc-sub" dy="3">' + n + '</tspan>' : ''); }
  function r1(v){ return String(Math.round(v * 10) / 10); }
  function labelAt(c){
    if(c.shape === 'vertical') return [px(c.at) + 4, py(10) + 10];
    if(c.shape === 'up'){ var x1 = Math.min(10, c.at + 5); return [px(x1) - 4, py(G.y(c, x1)) - 4]; }
    if(c.shape === 'down'){ var x2 = Math.min(10, c.at + 5); return [px(x2) - 2, py(G.y(c, x2)) + 2]; }
    return null;
  }
  /* A link's graph: ApMacroGraph.svg with the shift, E2, the arrow and the marks. */
  function graphSvg(g){
    var spec = { kind: g.kind }; if(g.start) spec.start = g.start; if(g.names) spec.names = g.names;
    var shifts = g.shifts || {}, moved = Object.keys(shifts).some(function(c){ return shifts[c]; });
    var e0 = G.eq(spec, {}), e1 = moved ? G.eq(spec, shifts) : null;
    var label = TITLE[g.kind] + ' graph: ' + G.describe(spec, { shifts: shifts });
    var html = G.svg(spec, { shifts: shifts, eq: e1 }, { label: label }), extra = [];
    var base = G.curves(spec, {}), now = G.curves(spec, shifts);
    now.forEach(function(c, i){
      var b = base[i]; if(Math.abs(c.at - b.at) < 0.15) return;
      if(c.shape === 'vertical') extra.push(arrow(b.at, 8.3, c.at, 8.3));
      else if(c.shape === 'rdemand') extra.push(arrow(5.4, b.at, 5.4, c.at));
      else if(c.shape === 'down') extra.push(arrow(b.at - 3, 8, c.at - 3, 8));
      else if(c.shape === 'up') extra.push(arrow(b.at + 3.6, 8.6, c.at + 3.6, 8.6));
      var at = labelAt(b), to = labelAt(c);
      if(at && to && Math.abs(at[1] - to[1]) <= 12 && Math.abs(at[0] - to[0]) <= 30){
        var from = 'class="mac-gr-clabel is-old" x="' + r1(at[0]) + '" y="' + r1(at[1]) + '"';
        html = html.replace(from, 'class="mac-gr-clabel is-old" x="' + r1(at[0]) + '" y="' + r1(at[1] + (c.shape === 'vertical' ? 16 : -13)) + '"');
      }
    });
    if(e0){
      var hi = e1 && Math.abs(e1[1] - e0[1]) > 0.2, right = e1 && Math.abs(e1[0] - e0[0]) > 0.2, nm = MARK[g.kind];
      extra.push(mark(sub(nm, e1 ? '1' : ''), px(0) + 4, py(e0[1]) + (hi && e1[1] > e0[1] ? 14 : -4), 'is-y' + (e1 ? ' is-old' : '')));
      if(e1 && hi) extra.push(mark(sub(nm, '2'), px(0) + 4, py(e1[1]) + (e1[1] > e0[1] ? -4 : 14), 'is-y'));
      if(g.kind === 'adas'){
        extra.push(mark(sub('Y', e1 ? '1' : ''), px(e0[0]) + (right && e1[0] < e0[0] ? 4 : -4), py(0) - 5, 'is-x' + (e1 ? ' is-old' : ''), right && e1[0] < e0[0] ? 'start' : 'end'));
        if(e1 && right) extra.push(mark(sub('Y', '2'), px(e1[0]) + (e1[0] < e0[0] ? -4 : 4), py(0) - 5, 'is-x', e1[0] < e0[0] ? 'end' : 'start'));
        extra.push(mark('Y<tspan class="pc-sub" dy="3">F</tspan>', px(5) + 4, py(10) + 24, 'is-note'));
      }
    }
    return html.replace('</svg>', extra.join('') + '</svg>');
  }
  /* The graph that goes with link i: the newest link up to i that has one. */
  function graphAt(ch, i){ for(var k = Math.min(i, ch.links.length - 1); k >= 0; k--) if(ch.links[k].graph) return { g: ch.links[k].graph, k: k }; return null; }
  function chainHtml(ch, n, opts){
    opts = opts || {};
    return ch.links.slice(0, n + 1).map(function(l, k){
      var cur = k === n, miss = opts.missed && opts.missed[l.id];
      return '<li class="pc-link' + (cur ? ' is-now' : '') + (l.graph ? ' has-g' : '') + (miss ? ' is-miss' : '') + '"' + (cur ? ' aria-current="step"' : '') + '><span class="pc-n" aria-hidden="true">' + (k + 1) + '</span><span class="pc-t">' + esc(cap(l.say)) + '</span>' +
        (l.graph ? '<span class="pc-gtag">' + esc(TITLE[l.graph.kind].replace(' for dollars', '')) + '</span>' : '') + '</li>';
    }).join('') + (opts.more ? '<li class="pc-link is-next" aria-hidden="true"><span class="pc-n">' + (n + 2) + '</span><span class="pc-t">?</span></li>' : '');
  }
  function stageHtml(){
    return '<div class="pc-fig"><div class="pc-chainbox"><p class="pc-title"></p><ol class="pc-chain" aria-label="The chain so far"></ol></div>' +
      '<figure class="pc-graph"><figcaption class="pc-gcap"></figcaption><div class="pc-g"></div></figure></div>';
  }
  function paint(fig, ch, n, opts){
    opts = opts || {};
    fig.querySelector('.pc-title').innerHTML = '<b>' + esc(ch.title) + '</b> <span>' + esc(PC.familyOf(ch.family).name) + '</span>';
    var list = fig.querySelector('.pc-chain');
    list.innerHTML = chainHtml(ch, n, { more: n < ch.links.length - 1 && opts.more !== false, missed: opts.missed });
    // The newest link in view (the list scrolls; the page does not).
    list.scrollTop = list.scrollHeight;
    if(window.requestAnimationFrame) requestAnimationFrame(function(){ list.scrollTop = list.scrollHeight; });
    var ga = graphAt(ch, n), box = fig.querySelector('.pc-graph');
    box.hidden = !ga;
    if(ga){
      fig.querySelector('.pc-gcap').innerHTML = '<b>' + esc(TITLE[ga.g.kind]) + '</b> <span>' + (ga.k === n ? 'this link' : 'from link ' + (ga.k + 1)) + '</span>';
      fig.querySelector('.pc-g').innerHTML = graphSvg(ga.g);
    }
    fig.classList.toggle('no-g', !ga);
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var fam = 'monetary', variant = 'ample', dir = 1, n = 0, LS = null, touched = false, nid = T.nid('pc'), tip = null, builderState = null;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    var fams = PC.FAMILIES.filter(function(f){ return (data.contexts || []).some(function(c){ return (c.families || []).indexOf(f.id) > -1; }); });
    if(!fams.length) fams = PC.FAMILIES;
    if(!fams.some(function(f){ return f.id === fam; })){ fam = fams[0].id; variant = fams[0].variants[0].id; }
    host.innerHTML = '<section class="bt-problem pc-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Policy chain builder</h2>' + stageHtml() +
      '<div class="pc-ctl">' +
        '<div class="pc-fams ls-scroll" role="group" aria-label="Chain">' + fams.map(function(f){ return '<button type="button" class="ls-btn pc-fam" data-f="' + f.id + '" aria-pressed="false">' + esc(f.short) + '</button>'; }).join('') + '</div>' +
        '<div class="ls-seg pc-vars" role="group" aria-label="Version"></div>' +
        '<div class="ls-seg pc-dirs" role="group" aria-label="Direction"></div>' +
        '<div class="pc-go"><button type="button" class="ls-btn pc-back">Back</button><button type="button" class="ls-btn ls-pri pc-next">Next link</button></div>' +
      '</div>' +
      '<div class="pc-say"></div>' +
      '<div class="pc-write"></div><p class="sr-only pc-live"></p></section>';
    var say = T.announcer($('.pc-live'));
    var cue = T.cue('Press Next link and follow the chain to the end.');
    $('.pc-ctl').insertBefore(cue.el, $('.pc-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); if(tip && tip.dismiss) tip.dismiss(); } }
    function ch(){ return PC.chain(fam, variant, dir); }
    function onClick(e){
      var b;
      if((b = e.target.closest('.pc-fam'))){ act(); fam = b.getAttribute('data-f'); variant = PC.familyOf(fam).variants[0].id; dir = 1; n = 0; sync(); return; }
      if((b = e.target.closest('.pc-vars button'))){ act(); variant = b.getAttribute('data-v'); n = 0; sync(); return; }
      if((b = e.target.closest('.pc-dirs button'))){ act(); dir = +b.getAttribute('data-d'); n = 0; sync(); return; }
      if(e.target.closest('.pc-next')){ act(); var c = ch(); if(n < c.links.length - 1){ n++; sync(); say('Link ' + (n + 1) + ' of ' + c.links.length + ': ' + c.links[n].say + '.'); } else { n = 0; sync(); say('Back to the start: ' + c.links[0].say + '.'); } return; }
      if(e.target.closest('.pc-back')){ act(); if(n > 0){ n--; sync(); say('Link ' + (n + 1) + ': ' + ch().links[n].say + '.'); } return; }
      if(e.target.closest('.pc-bcheck')){ checkBuilder(); return; }
      if(e.target.closest('.pc-bnew')){ builderState = null; writePanel(); }
    }
    host.addEventListener('click', onClick);
    function sync(){
      var F = PC.familyOf(fam), c = ch(), last = n >= c.links.length - 1;
      $('.pc-fams').querySelectorAll('.pc-fam').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === fam)); });
      var vars = $('.pc-vars');
      vars.hidden = F.variants.length < 2;
      vars.innerHTML = F.variants.map(function(v){ return '<button type="button" data-v="' + v.id + '" aria-pressed="' + (v.id === variant) + '">' + esc(v.name) + '</button>'; }).join('');
      $('.pc-dirs').innerHTML = [1, -1].map(function(d, k){ return '<button type="button" data-d="' + d + '" aria-pressed="' + (d === dir) + '">' + esc(F.dirs[k]) + '</button>'; }).join('');
      $('.pc-next').textContent = last ? 'Start again' : n === 0 ? 'Next link' : 'Next link (' + (n + 2) + ' of ' + c.links.length + ')';
      $('.pc-back').disabled = n === 0;
      paint($('.pc-fig'), c, n);
      var l = c.links[n];
      var head = '<b>' + esc(cap(l.say)) + '.</b>' + (n ? ' Link ' + (n + 1) + ' of ' + c.links.length + '.' : ' ' + esc(c.intro));
      var body = '<ol class="ls-steps pc-steps">' + c.links.slice(0, n + 1).map(function(x, k){ return '<li>' + (k ? esc(cap(c.links[k - 1].say).replace(/\.$/, '')) + ', so ' + esc(x.say.charAt(0).toLowerCase() + x.say.slice(1)) : esc(cap(x.say))) + '.</li>'; }).join('') + '</ol>' +
        (l.traps.length ? '<p class="mac-slip"><b>The slip readers see here:</b> ' + esc(l.traps[0][0]) + '. ' + esc(l.traps[0][1]) + '</p>' : '') +
        (last ? '<p>That is the whole chain. Every link counts: an "explain" point is earned only when each step is named in order.</p>' : '');
      T.explain($('.pc-say'), head, body);
      if(LS){
        LS.caption(n === 0 ? '<b>' + esc(c.title) + ':</b> ' + esc(c.intro) + ' Press Next link.' : '<b>Link ' + (n + 1) + ' of ' + c.links.length + ':</b> ' + esc(cap(l.say)) + '.', 'explore');
        LS.pills([{ html: (n + 1) + ' of ' + c.links.length + ' links', tone: last ? 'good' : 'ghost' }], 'left', 'explore');
      }
      builderState = null; writePanel();
    }

    /* Write it out: the sentence builder, then the student's own words. */
    function writePanel(){
      var c = ch(), el = $('.pc-write');
      if(!builderState) builderState = { b: PC.builder(c, M.rng(1 + Math.floor(Math.random() * 99999))), checked: false, recorded: false };
      var b = builderState.b, k = 0;
      var sentence = esc(b.template).replace(/\{(link\d+)\}/g, function(_, name){
        var s = b.slots[name], id = nid + '-' + name; k++;
        return '<label class="sr-only" for="' + id + '">' + esc(s.label) + '</label><select id="' + id + '" class="pc-blank" data-slot="' + name + '"><option value="">choose…</option>' + s.options.map(function(o, j){ return '<option value="' + j + '">' + esc(o) + '</option>'; }).join('') + '</select>';
      });
      el.innerHTML = '<h3 class="ls-title-l">Make it specific</h3><p class="bt-small">Choose each link of the ' + esc(c.title.toLowerCase()) + ' chain, then Check.</p>' +
        '<p class="pc-sentence">' + sentence + '</p><div class="bt-actions"><button type="button" class="btn-press sm pc-bcheck">Check</button><button type="button" class="bt-btn pc-bnew">Shuffle</button></div><div class="pc-bfb" role="status" aria-live="polite"></div>' +
        '<h3 class="ls-title-l">Now in your own words</h3><label class="bt-small" for="' + nid + '-txt">Write the chain as you would on the exam. The hints below update as you type; they are not a score.</label>' +
        '<textarea id="' + nid + '-txt" class="pc-text" rows="4"></textarea><ul class="pc-hints" aria-live="polite"></ul>';
      var ta = el.querySelector('.pc-text');
      ta.addEventListener('input', function(){ hints(ta.value); });
      hints('');
    }
    function checkBuilder(){
      var b = builderState.b, el = $('.pc-write'), picks = {};
      el.querySelectorAll('.pc-blank').forEach(function(s){ picks[s.getAttribute('data-slot')] = s.value === '' ? '' : +s.value; });
      var r = window.ApMacroGrade.specific(b, picks), fb = el.querySelector('.pc-bfb');
      if(!r.valid){ fb.innerHTML = '<span class="bt-small">' + esc(r.notes[0]) + '</span>'; return; }
      el.querySelectorAll('.pc-blank').forEach(function(s){ var ok = r.slots[s.getAttribute('data-slot')]; s.classList.toggle('is-right', ok); s.classList.toggle('is-wrong', !ok); });
      fb.innerHTML = (r.correct ? '<span class="mac-mark ok">Correct</span> Every link named, in order.' : '<span class="mac-mark no">Not yet</span> ' + r.right + ' of ' + r.total + ' links right.<ul class="cd-notes">' + r.notes.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
      if(!builderState.recorded){ builderState.recorded = true; var c = ch(); T.record('policy-chain', [{ id: 'policy-chain:write:' + c.family, correct: r.correct, topic: topicOf(c.family), practice: '2.A', group: 'write' }]); }
    }
    function topicOf(f){ var cx = (data.contexts || []).filter(function(c){ return (c.families || []).indexOf(f) > -1; })[0]; return cx ? cx.topic : data.topic; }
    function hints(text){
      var c = ch(), W = PC.write(c), el = $('.pc-hints');
      if(!text.trim()){ el.innerHTML = '<li class="bt-small">Start with the ' + (c.family === 'selfadjust' ? 'gap' : 'policy') + ', then name every link.</li>'; return; }
      var fl = window.ApMacroGrade.flags(W, text), cov = PC.covered(c, text), miss = c.links.filter(function(l, i){ return !cov[i]; });
      el.innerHTML = fl.map(function(f){ return '<li class="' + (f.ok ? 'is-ok' : 'is-no') + '">' + (f.ok ? (f.rule === 'directional' ? 'You say which way things move.' : f.rule === 'mechanism' ? 'You link the steps (because, so, leads to).' : 'OK.') : esc(f.hint)) + '</li>'; }).join('') +
        '<li class="' + (miss.length ? 'is-no' : 'is-ok') + '">' + (miss.length ? 'Links you have not named yet: ' + miss.map(function(l){ return esc(l.say.charAt(0).toLowerCase() + l.say.slice(1)); }).join('; ') + '.' : 'Every link is named.') + '</li>';
    }

    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.pc-fig')], dock: [$('.pc-ctl')], why: [$('.pc-say')], details: [$('.pc-write')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      sync();
      if(s.mode() === 'explore' && !touched) tip = T.hintSlot(s, s.root.querySelector('.pc-next'), 'Start here: follow the chain', { before: s.root.querySelector('.pc-go') });
      try{ new MutationObserver(function(){ paint($('.pc-fig'), ch(), n); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    sync();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var types = PC.FAMILIES.map(function(f){ return { value: f.id, label: f.name }; });
    T.drill(host, data, { slug: 'policy-chain', noun: 'drill',
      generate: function(r, ctx, type){ return PC.generate(r, ctx, type); },
      types: types, typeLabel: 'Chain',
      title: function(p){ var g = p.given; return PC.chain(g.family, g.variant, g.dir).title; },
      extra: function(el, p, api){
        var g = p.given;
        api.ch = PC.chain(g.family, g.variant, g.dir); api.n = 0; api.missed = {};
        el.innerHTML = stageHtml(); api.fig = el.querySelector('.pc-fig');
        paint(api.fig, api.ch, 0);
      },
      onStep: function(s, right, api){ if(!right) api.missed[s.key] = true; api.n++; paint(api.fig, api.ch, api.n, { missed: api.missed }); }
    });
  }
})();
