/* Evidence Builder trainer page (docs/appsych-spec.md sections 3.2 and 6). OWNED BY THIS
   TOOL ONLY (builder T1). Mounts into #app with ApPsychTools; the model is
   ApPsychMath.evidenceBuilder (psychology/assets/tools/math/evidence-builder.js), the
   content psychology/data/tools/evidence-builder.json (served filtered as
   assets/tool-data/evidence-builder.json). The frame is ApPsychTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: the stage is the question and its three sources (a tab per
   source, each laid out as the exam lays it out, with a graph drawn from the
   model's numbers). The dock is the answer, built from pieces, one part at a
   time (A claim, B(i) evidence, B(ii) concept, C(i), C(ii)): choose a claim;
   choose a source, a result or a method detail, and whether to cite it;
   choose the concept (research words and the question's own topic are on
   the list, and refused). Every choice is scored at once on the 7-point
   rubric (ApPsychMath.evidenceBuilder.score), the score sits on the stage,
   the source used lights its sentence, and a lost point names the slip the
   2025 Chief Reader Reports describe. Details holds the answer as written,
   the rubric line by line, and a box to write it yourself with the live
   hints of ApPsychGrade.flags (cite, concept, restricted; hints, never a score).
   Test yourself: ApPsychTools.drill over the model's generate(); the three
   sources are the stage, and the source a step needs is marked. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.evidenceBuilder || M.evidenceBuilder.stub) return;
  var E = M.evidenceBuilder, esc = T.esc;
  var PART = {}; E.PARTS.forEach(function(p){ PART[p.k] = p; });
  var STEP_SRC = { evB: 'b', conB: 'b', linkB: 'b', evC: 'c', conC: 'c', linkC: 'c' };
  var ASK = {
    A: { verb: 'Propose', ask: 'a defensible claim that answers the question.', rule: 'A statement that takes a position the sources can back. Not a topic, not a question, not a summary of one source, and not so absolute that the sources cannot defend it.',
      slips: ['A topic sentence or a restated question.', 'An oversimplified or absolute claim.', 'A bare summary of a source.'] },
    Bi: { verb: 'Support', ask: 'the claim with evidence from one source, cited.', rule: 'One specific, accurate result (what the study found) that is consistent with the claim, with its source named: "(Source 2)" or "According to Source 2". Exact numbers are not required if the direction is right.',
      slips: ['No citation: uncited evidence loses the point.', 'A method or participant detail instead of a result.', 'A result that does not support the claim.'] },
    Bii: { verb: 'Explain', ask: 'how the evidence supports the claim, using a psychology concept.', rule: '1 point for linking the evidence to the claim; the second for applying a psychological perspective, theory, concept or research finding to it. Evidence, then concept, then link.',
      slips: ['No psychology concept (1 point at most).', 'A definition dropped in without applying it.', 'A research or statistics word, or the question\'s own topic, as the concept.'] },
    Ci: { verb: 'Support', ask: 'the claim with evidence from a different source, cited.', rule: 'As B(i), but from a different source than B(i).',
      slips: ['Reusing the B(i) source.', 'No citation.', 'A method detail instead of a result.'] },
    Cii: { verb: 'Explain', ask: 'how this evidence supports the claim, using a different concept.', rule: 'As B(ii), with a different psychology concept from the one in B(ii). Reusing it caps the part at 1 point.',
      slips: ['The same concept as B(ii) (the lowest-scoring part in 2025).', 'No concept, or a restricted term.', 'Naming a concept without linking it.'] }
  };

  T.mount('evidence-builder', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'evidence-builder', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function cap(t){ t = String(t); return t.charAt(0).toUpperCase() + t.slice(1); }
  function phone(){ return (window.innerWidth || 1280) <= 640; }

  /* ------------------------------------------------------------ a source */
  function graphSvg(s, nm, ph){
    var W = ph ? 340 : 400, H = ph ? 220 : 228, L = 46, R = W - 14, top = 26, bot = H - 40, out = [], label;
    if(nm.kind === 'means'){
      var max = s.max || T.niceMax(Math.max.apply(null, nm.means) * 1.15), step = T.niceStep(max, 5), y = function(v){ return bot - v / max * (bot - top); };
      for(var v = 0; v <= max + 1e-9; v += step) out.push('<line class="eb-grid" x1="' + L + '" x2="' + R + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="eb-tk" x="' + (L - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + M.fmt(v, 4) + '</text>');
      var n = s.groups.length, slot = (R - L) / n, bw = Math.min(64, slot * 0.55);
      nm.means.forEach(function(m, i){
        var x = L + slot * i + slot / 2;
        out.push('<rect class="eb-bar eb-g' + i + '" x="' + (x - bw / 2).toFixed(1) + '" y="' + y(m).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (bot - y(m)).toFixed(1) + '" rx="3"/>');
        out.push('<text class="eb-val" x="' + x.toFixed(1) + '" y="' + (y(m) - 6).toFixed(1) + '" text-anchor="middle">' + M.fixed(m, nm.dec) + '</text><text class="eb-cat" x="' + x.toFixed(1) + '" y="' + (bot + 17) + '" text-anchor="middle">' + esc(s.groups[i].label) + '</text>');
      });
      out.push('<line class="eb-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><line class="eb-axis" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + bot + '"/><text class="eb-axl" x="' + L + '" y="' + (top - 12) + '">' + esc(s.axis) + '</text>');
      label = 'Bar graph, ' + s.axis + ': ' + s.groups.map(function(g, i){ return g.label + ' ' + M.fixed(nm.means[i], nm.dec); }).join(', ') + '.';
    } else {
      var X = s.x, Y = s.y, sx = function(v){ return L + (v - X.range[0]) / (X.range[1] - X.range[0]) * (R - L); }, sy = function(v){ return bot - (v - Y.range[0]) / (Y.range[1] - Y.range[0]) * (bot - top); };
      var xs = T.niceStep(X.range[1] - X.range[0], 4), ys = T.niceStep(Y.range[1] - Y.range[0], 4);
      for(var gx = Math.ceil(X.range[0] / xs) * xs; gx <= X.range[1] + 1e-9; gx += xs) out.push('<line class="eb-grid" x1="' + sx(gx).toFixed(1) + '" x2="' + sx(gx).toFixed(1) + '" y1="' + top + '" y2="' + bot + '"/><text class="eb-tk" x="' + sx(gx).toFixed(1) + '" y="' + (bot + 15) + '" text-anchor="middle">' + M.fmt(gx, 4) + '</text>');
      for(var gy = Math.ceil(Y.range[0] / ys) * ys; gy <= Y.range[1] + 1e-9; gy += ys) out.push('<line class="eb-grid" x1="' + L + '" x2="' + R + '" y1="' + sy(gy).toFixed(1) + '" y2="' + sy(gy).toFixed(1) + '"/><text class="eb-tk" x="' + (L - 6) + '" y="' + (sy(gy) + 4).toFixed(1) + '" text-anchor="end">' + M.fmt(gy, 4) + '</text>');
      nm.points.forEach(function(q){ out.push('<circle class="eb-pt" cx="' + sx(q[0]).toFixed(1) + '" cy="' + sy(q[1]).toFixed(1) + '" r="3.6"/>'); });
      var f = function(x){ return nm.intercept + nm.slope * x; }, x0 = X.range[0], x1 = X.range[1];
      var cl = function(x){ var yv = f(x); if(yv > Y.range[1]) return (Y.range[1] - nm.intercept) / nm.slope; if(yv < Y.range[0]) return (Y.range[0] - nm.intercept) / nm.slope; return x; };
      x0 = cl(x0); x1 = cl(x1);
      out.push('<line class="eb-trend" x1="' + sx(x0).toFixed(1) + '" y1="' + sy(f(x0)).toFixed(1) + '" x2="' + sx(x1).toFixed(1) + '" y2="' + sy(f(x1)).toFixed(1) + '"/>');
      out.push('<line class="eb-axis" x1="' + L + '" x2="' + R + '" y1="' + bot + '" y2="' + bot + '"/><line class="eb-axis" x1="' + L + '" x2="' + L + '" y1="' + top + '" y2="' + bot + '"/>');
      out.push('<text class="eb-axl" x="' + L + '" y="' + (top - 12) + '">' + esc(Y.axis) + '</text><text class="eb-axl" x="' + R + '" y="' + (bot + 32) + '" text-anchor="end">' + esc(X.axis) + '</text><text class="eb-sig" x="' + (R - 4) + '" y="' + (top + 14) + '" text-anchor="end">r = ' + E.rtxt(nm.r2).replace(/<[^>]+>/g, '') + '</text>');
      label = 'Scatterplot of ' + Y.axis + ' against ' + X.axis + ', ' + s.n + ' participants, with a line of best fit; r = ' + E.rtxt(nm.r2) + ', ' + nm.describe + '.';
    }
    return '<svg class="eb-graph" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out.join('') + '</svg>';
  }
  function sourceHtml(ctx, nums, k, o){
    var s = ctx.sources[k];
    return '<article class="eb-src" data-src="' + k + '" aria-label="Source ' + (k + 1) + ': ' + esc(s.title) + '">' +
      '<header class="eb-head"><p class="eb-kicker">Source ' + (k + 1) + ' · invented study for practice</p><h3 class="eb-title">' + esc(s.title) + '</h3></header>' +
      '<section class="eb-sec"><h4>Introduction</h4><p>' + s.intro + '</p></section>' +
      '<section class="eb-sec"><h4>Participants</h4><p><span class="eb-det">' + s.participants + '</span></p></section>' +
      '<section class="eb-sec"><h4>Method</h4><p>' + s.method + '</p></section>' +
      '<section class="eb-sec"><h4>Results</h4><p><span class="eb-res">' + E.result(ctx, nums, k) + '</span></p><figure class="eb-figure">' + graphSvg(s, nums[k], o && o.phone) + '</figure></section></article>';
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var ctxs = data.contexts || [], ctx = ctxs[0], seed = 21, nums = E.sources(ctx, M.rng(seed)), src = 0, part = 'A', touched = false, LS = null, nid = T.nid('eb');
    var b = blank();
    function blank(){ return { claim: null, b: { src: null, what: 'result', cite: false }, bc: null, c: { src: null, what: 'result', cite: false }, cc: null }; }
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem eb-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Evidence builder</h2>' +
      '<div class="eb-fig"></div>' +
      '<div class="eb-ctl">' +
        '<div class="eb-parts" role="group" aria-label="EBQ part"></div>' +
        '<div class="eb-pcard"></div>' +
      '</div>' +
      '<div class="eb-say"></div>' +
      T.moreHtml('<div class="eb-pick"></div><div class="bt-buttons"><button type="button" class="bt-btn eb-new">New numbers</button><button type="button" class="bt-btn eb-clear">Start the answer over</button></div>', 'choose a question') +
      '<div class="eb-nums"></div><p class="sr-only eb-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.eb-live'));
    var cue = T.cue('Pick a claim, then back it with evidence from two sources.');
    $('.eb-ctl').insertBefore(cue.el, $('.eb-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var pick = T.choiceSelect({ label: 'Question', options: ctxs.map(function(c){ return { value: c.id, label: c.title }; }), value: ctx.id, onChange: function(v){ act(); ctx = ctxs.filter(function(c){ return c.id === v; })[0] || ctxs[0]; nums = E.sources(ctx, M.rng(seed)); b = blank(); part = 'A'; src = 0; drawAll(); say('Question: ' + ctx.question); } });
    $('.eb-pick').appendChild(pick.el);
    function sc(){ return E.score(ctx, nums, b); }
    function onClick(e){
      var t = e.target.closest('button, input');
      if(!t || !(LS ? LS.root : host).contains(t)) return;
      if(t.classList.contains('eb-pbtn')){ act(); part = t.getAttribute('data-part'); var ev = evOf(part); if(ev && ev.src != null) src = ev.src; drawAll(); say('Part ' + PART[part].label + ', ' + PART[part].name.toLowerCase() + '.'); return; }
      if(t.classList.contains('eb-tab')){ act(); src = +t.getAttribute('data-src'); drawStage(); return; }
      if(t.classList.contains('eb-claim')){ act(); b.claim = t.getAttribute('data-v'); update('claim'); return; }
      if(t.classList.contains('eb-s')){ act(); evOf(part).src = +t.getAttribute('data-v'); src = evOf(part).src; update('src'); return; }
      if(t.classList.contains('eb-w')){ act(); evOf(part).what = t.getAttribute('data-v'); update('what'); return; }
      if(t.classList.contains('eb-cite')){ act(); evOf(part).cite = t.checked; update('cite'); return; }
      if(t.classList.contains('eb-con')){ act(); b[part === 'Bii' ? 'bc' : 'cc'] = t.getAttribute('data-v'); update('con'); return; }
      if(t.classList.contains('eb-next')){ act(); var i = E.PARTS.map(function(p){ return p.k; }).indexOf(part); part = E.PARTS[(i + 1) % E.PARTS.length].k; var e2 = evOf(part); if(e2 && e2.src != null) src = e2.src; drawAll(); var f = $('.eb-pcard button, .eb-pcard input'); if(f) f.focus(); return; }
      if(t.classList.contains('eb-new')){ act(); seed = 21 + Math.floor(Math.random() * 9000); nums = E.sources(ctx, M.rng(seed)); drawAll(); say('New numbers for the three sources.'); return; }
      if(t.classList.contains('eb-clear')){ act(); b = blank(); part = 'A'; drawAll(); say('Answer cleared.'); }
    }
    host.addEventListener('click', onClick);
    function evOf(k){ return k === 'Bi' || k === 'Bii' ? b.b : k === 'Ci' || k === 'Cii' ? b.c : null; }
    function update(what){
      drawStage(); drawParts(); drawCard(); words(); nums2();
      var s = sc(), pk = part;
      say('Part ' + PART[pk].label + ': ' + s[pk] + ' of ' + PART[pk].pts + '. ' + s.notes[pk] + ' Score ' + s.total + ' of 7.');
    }
    function drawStage(){
      var fig = $('.eb-fig'), ev = evOf(part), s = sc(), used = {};
      if(b.b.src != null) used[b.b.src] = (used[b.b.src] || []).concat('B');
      if(b.c.src != null) used[b.c.src] = (used[b.c.src] || []).concat('C');
      fig.innerHTML = '<div class="eb-q"><p class="eb-qk">Question</p><p class="eb-qt">' + esc(ctx.question) + '</p>' + (b.claim ? '<p class="eb-claimline"><span class="eb-ck">Your claim</span> ' + esc(E.claimOf(ctx, b.claim).text) + '</p>' : '') + '</div>' +
        '<div class="ls-seg eb-tabs" role="group" aria-label="Sources">' + ctx.sources.map(function(x, k){ return '<button type="button" class="eb-tab" data-src="' + k + '" aria-pressed="' + (k === src) + '">Source ' + (k + 1) + (used[k] ? used[k].map(function(x){ return '<span class="eb-used" aria-label="used in ' + x + '">' + x + '</span>'; }).join('') : '') + '</button>'; }).join('') + '</div>' +
        sourceHtml(ctx, nums, src, { phone: phone() });
      if(ev && ev.src === src){ var el = fig.querySelector(ev.what === 'detail' ? '.eb-det' : '.eb-res'); if(el) el.classList.add('is-on', ev.what === 'detail' || s.bad[part === 'Bi' || part === 'Bii' ? 'Bi' : 'Ci'] ? 'is-bad' : 'is-good'); }
      if(LS) LS.pills([{ html: 'Score ' + s.total + ' / 7', tone: s.total === 7 ? 'good' : s.total ? 'accent' : 'ghost' }].concat(E.PARTS.filter(function(p){ return p.k === part; }).map(function(p){ return { html: p.label + ' ' + s[p.k] + ' / ' + p.pts, tone: s[p.k] === p.pts ? 'good' : s[p.k] ? 'warn' : 'ghost' }; })), 'left', 'explore');
    }
    function drawParts(){
      var s = sc();
      $('.eb-parts').innerHTML = E.PARTS.map(function(p){
        var got = s[p.k], st = got === p.pts ? 'is-full' : got ? 'is-part' : '';
        return '<button type="button" class="eb-pbtn ' + st + '" data-part="' + p.k + '" aria-pressed="' + (p.k === part) + '" aria-label="Part ' + p.label + ', ' + p.name.toLowerCase() + ', ' + got + ' of ' + p.pts + '"><span class="eb-pl">' + p.label + '</span><span class="eb-pp">' + got + '/' + p.pts + '</span></button>';
      }).join('');
    }
    function chip(cls, v, label, on, extra){ return '<button type="button" class="eb-chip ' + cls + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '"' + (extra || '') + '>' + label + '</button>'; }
    function drawCard(){
      var a = ASK[part], P = PART[part], s = sc(), el = $('.eb-pcard'), body = '';
      if(part === 'A') body = '<div class="eb-chips eb-col" role="group" aria-label="Claims">' + ctx.claims.map(function(c){ return chip('eb-claim', c.id, esc(c.text), b.claim === c.id); }).join('') + '</div>';
      else if(part === 'Bi' || part === 'Ci'){
        var ev = evOf(part);
        body = '<p class="eb-lbl">From</p><div class="eb-chips" role="group" aria-label="Source">' + [0, 1, 2].map(function(k){ return chip('eb-s', k, 'Source ' + (k + 1), ev.src === k); }).join('') + '</div>' +
          '<p class="eb-lbl">Use its</p><div class="eb-chips" role="group" aria-label="What to use">' + chip('eb-w', 'result', 'Result', ev.what === 'result') + chip('eb-w', 'detail', 'Method detail', ev.what === 'detail') + '</div>' +
          '<label class="bt-radio eb-citerow"><input type="checkbox" class="eb-cite"' + (ev.cite ? ' checked' : '') + '> Cite it: "According to Source ' + (ev.src != null ? ev.src + 1 : 'n') + ', ..."</label>';
      } else {
        var ev2 = evOf(part), list = ctx.concepts.map(function(c){ return { id: c.id, name: c.name }; }).concat(ctx.restricted.map(function(r){ return { id: r.id, name: r.name }; }));
        list.sort(function(x, y){ return x.name.replace(/^the /, '').localeCompare(y.name.replace(/^the /, '')); });
        var cur = b[part === 'Bii' ? 'bc' : 'cc'];
        body = (ev2.src == null ? '<p class="bt-small">First choose the evidence in ' + (part === 'Bii' ? 'B(i)' : 'C(i)') + '.</p>' : '<p class="eb-lbl">Explain Source ' + (ev2.src + 1) + '\'s result with</p>') +
          '<div class="eb-chips" role="group" aria-label="Psychology concept">' + list.map(function(c){ return chip('eb-con', c.id, esc(cap(c.name)), cur === c.id); }).join('') + chip('eb-con eb-none', E.NONE, 'Link it to the claim, no concept', cur === E.NONE) + '</div>';
      }
      var got = s[part], note = s.notes[part], tone = got === P.pts ? 'ok' : 'no';
      var touchedPart = part === 'A' ? !!b.claim : part === 'Bi' ? b.b.src != null : part === 'Ci' ? b.c.src != null : !!b[part === 'Bii' ? 'bc' : 'cc'] || evOf(part).src != null;
      el.innerHTML = '<p class="eb-ph"><span class="eb-plk">Part ' + P.label + '</span> ' + esc(P.name) + ' <span class="eb-pts">' + P.pts + (P.pts > 1 ? ' points' : ' point') + '</span></p>' +
        '<p class="eb-ask"><b>' + a.verb + '</b> ' + a.ask + '</p>' + body +
        (touchedPart ? '<p class="eb-fb is-' + tone + '"><span class="psy-mark ' + tone + '">' + got + ' of ' + P.pts + '</span> ' + esc(note) + '</p>' : '') +
        '<div class="eb-act"><button type="button" class="bt-btn eb-next">Next part</button></div>';
    }
    function words(){
      var a = ASK[part], s = sc();
      var head = '<b>Part ' + PART[part].label + ' (' + PART[part].pts + (PART[part].pts > 1 ? ' points' : ' point') + '):</b> ' + esc(a.verb.toLowerCase()) + ' ' + esc(a.ask);
      var why = '<p>' + esc(a.rule) + '</p><p class="eb-why-k">What the readers saw students miss</p><ul>' + a.slips.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<p class="eb-why-k">Reader advice</p><p>Read all three sources and note each result before you write. For each reasoning part: the evidence, then the concept, then the link to the claim.</p>';
      T.explain($('.eb-say'), head, why);
      if(LS){
        LS.caption('<b>Score ' + s.total + ' of 7.</b> ' + (s.total === 7 ? 'Every point earned. Try another claim or question.' : 'Part ' + PART[part].label + ': ' + esc(s.notes[part])), 'explore');
        if(LS.why) LS.why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      }
    }
    function nums2(){
      var s = sc(), w = E.written(ctx, nums, b);
      var rows = E.PARTS.map(function(p){ return '<tr><th scope="row">' + p.label + '</th><td>' + (w[p.k] ? esc(w[p.k]) : '<span class="bt-small">Not built yet.</span>') + '</td><td class="eb-n">' + s[p.k] + ' / ' + p.pts + '</td></tr>'; }).join('');
      $('.eb-nums').innerHTML = '<h3 class="ls-title-l">Your answer, as a reader sees it</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Your answer"><table class="ls-tbl eb-ans"><thead><tr><th scope="col">Part</th><th scope="col">What you wrote</th><th scope="col">Points</th></tr></thead><tbody>' + rows + '<tr><th scope="row">Total</th><td></td><td class="eb-n"><b>' + s.total + ' / 7</b></td></tr></tbody></table></div>' +
        '<h3 class="ls-title-l">Write it yourself</h3><p class="bt-small">Hints only, never a score: a citation, a concept, a restricted term.</p><label class="sr-only" for="' + nid + '-w">Your reasoning</label><textarea id="' + nid + '-w" class="eb-write" rows="4" placeholder="According to Source 1, ... This is ... because ..."></textarea><ul class="eb-flags" aria-live="polite"></ul>';
      var ta = $('.eb-write');
      ta.addEventListener('input', function(){ flags(ta.value); });
    }
    function flags(text){
      var G = window.ApPsychGrade, ul = $('.eb-flags');
      if(!G || !ul) return;
      if(!text.trim()){ ul.innerHTML = ''; return; }
      var W = { write: { cite: true, concept: ctx.concepts.map(function(c){ return c.name.replace(/^the /, ''); }), restricted: ctx.restricted.map(function(r){ return r.name.replace(/^the /, ''); }), mechanism: true } };
      ul.innerHTML = G.flags(W, text).map(function(f){ return '<li class="' + (f.ok ? 'is-ok' : 'is-no') + '"><span class="psy-mark ' + (f.ok ? 'ok' : 'no') + '">' + ({ cite: 'Citation', concept: 'Concept', restricted: 'Restricted', mechanism: 'Link' }[f.rule] || f.rule) + '</span> ' + (f.ok ? ({ cite: 'A source is cited.', concept: 'A psychology concept is named.', mechanism: 'The link is stated.' }[f.rule] || 'OK') : esc(f.hint)) + '</li>'; }).join('');
    }
    function drawAll(){ drawStage(); drawParts(); drawCard(); words(); nums2(); }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.eb-fig')], dock: [$('.eb-ctl')], setup: 'Question', moreLabel: 'Choose a question', why: [$('.eb-say')], details: [$('.eb-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sp.setup(ctx.title);
      drawAll();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.eb-pcard .eb-chip'), text: 'Start here: pick a claim' });
      var w = window.innerWidth, t = null;
      window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(function(){ if((window.innerWidth <= 640) !== (w <= 640)){ w = window.innerWidth; drawStage(); } }, 120); });
    }
    drawAll();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var byId = {}; (data.contexts || []).forEach(function(c){ byId[c.id] = c; });
    T.drill(host, data, { slug: 'evidence-builder', noun: 'drill',
      generate: function(r, ctx, type){ return E.generate(r, ctx, type); },
      types: E.TYPES.map(function(t){ return { value: t, label: E.TYPE_LABEL[t] }; }),
      typeLabel: 'Parts to practice',
      newLabel: 'New question',
      title: function(p){ return E.TYPE_LABEL[p.type] + ': ' + byId[p.ctx].title; },
      extra: function(el, p, api){
        var ctx = byId[p.ctx];
        el.innerHTML = '<div class="eb-drill"><div class="eb-q"><p class="eb-qk">Question</p><p class="eb-qt">' + esc(ctx.question) + '</p></div>' + ctx.sources.map(function(s, k){ return sourceHtml(ctx, p.nums, k, { phone: phone() }); }).join('') + '</div>';
        api.box = el.querySelector('.eb-drill');
        mark(api, 0);
      },
      onStep: function(s, right, api){ mark(api, api.problem.steps.indexOf(s) + 1); }
    });
  }
  /* The source a step reads gets a soft edge and comes into view. */
  function mark(api, i){
    var s = api.problem.steps[i], box = api.box;
    box.querySelectorAll('.eb-src').forEach(function(x){ x.classList.remove('is-look'); });
    if(!s || !STEP_SRC[s.key]) return;
    var k = api.problem.given[STEP_SRC[s.key]];
    var el = box.querySelector('.eb-src[data-src="' + k + '"]');
    if(!el) return;
    el.classList.add('is-look');
    setTimeout(function(){
      var sb = el.closest('.ls-stage-body');
      if(!sb) return;
      var a = el.getBoundingClientRect(), bb = sb.getBoundingClientRect();
      try{ sb.scrollTo({ top: Math.max(0, sb.scrollTop + a.top - bb.top - 8), behavior: T.reduced() ? 'auto' : 'smooth' }); }catch(e){}
    }, 30);
  }
})();
