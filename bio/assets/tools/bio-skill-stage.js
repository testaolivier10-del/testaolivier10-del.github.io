/* AP® Biology skills tools: the shared pieces of their live visuals
   (docs/tools-upgrade.md, U-Bio-skills). Loaded on skills and drill pages
   after bio-tools.js; every number a visual shows comes from ApBioMath or
   ApBioProblems, never from here.

     S.reduced()                      prefers-reduced-motion
     S.drag(host, sel, o)             pointer dragging of any [sel] inside host,
                                      even while host's SVG is redrawn on every
                                      move: o.start(key, pt), o.move(key, pt),
                                      o.end(key); pt is in the SVG's viewBox units
     S.keys(host, sel, fn)            arrow keys on a focused [sel]: fn(key, dir, big)
                                      (Up/Right +1, Down/Left −1, PageUp/Down big)
     S.redraw(host, html)             replace host's content, keeping focus on
                                      the element with the same data-k
     S.card(app, o)                   an Explore card: { title, lead } -> section
     S.readout(rows)                  [[label, value, cls?]] -> <dl> html
     S.goals(el, list, say)           "Try this" checklist: list of { id, text };
                                      returns done(id) to tick one (once)
     S.num(x)                         a typed answer (number or null) as a number or NaN */
(function(){
  'use strict';
  var T = window.ApBioTools;
  if(!T) return;
  var S = {};
  S.reduced = function(){ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
  function svgPt(host, e){
    var svg = host.querySelector('svg');
    if(!svg || !svg.getScreenCTM) return { x: 0, y: 0 };
    var m = svg.getScreenCTM();
    if(!m) return { x: 0, y: 0 };
    var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    p = p.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }
  S.drag = function(host, sel, o){
    var key = null, pid = null;
    host.addEventListener('pointerdown', function(e){
      var t = e.target && e.target.closest ? e.target.closest(sel) : null;
      if(!t || !host.contains(t) || (e.button != null && e.button > 0)) return;
      e.preventDefault();
      key = t.getAttribute('data-k'); pid = e.pointerId;
      try{ host.setPointerCapture(pid); }catch(x){}
      host.classList.add('is-dragging');
      if(o.start) o.start(key, svgPt(host, e));
      o.move(key, svgPt(host, e));
    });
    host.addEventListener('pointermove', function(e){ if(key != null && e.pointerId === pid) o.move(key, svgPt(host, e)); });
    function end(e){
      if(key == null || (e && e.pointerId !== pid)) return;
      var k = key; key = null;
      try{ host.releasePointerCapture(pid); }catch(x){}
      host.classList.remove('is-dragging');
      if(o.end) o.end(k);
      var f = host.querySelector(sel + '[data-k="' + k + '"]');
      if(f && f.focus) try{ f.focus({ preventScroll: true }); }catch(x){ f.focus(); }
    }
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
  };
  S.keys = function(host, sel, fn){
    host.addEventListener('keydown', function(e){
      var t = e.target && e.target.closest ? e.target.closest(sel) : null;
      if(!t || !host.contains(t)) return;
      var d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 1, PageDown: -1 }[e.key];
      if(!d) return;
      e.preventDefault();
      fn(t.getAttribute('data-k'), d, e.shiftKey || e.key === 'PageUp' || e.key === 'PageDown');
    });
  };
  S.redraw = function(host, html){
    var a = document.activeElement, k = a && host.contains(a) ? a.getAttribute('data-k') : null, cls = k != null ? a.getAttribute('class') : '';
    host.innerHTML = html;
    if(k != null){
      var sel = '[data-k="' + k + '"]' + (cls ? '.' + cls.split(/\s+/)[0] : '');
      var f = host.querySelector(sel);
      if(f && f.focus) try{ f.focus({ preventScroll: true }); }catch(x){ f.focus(); }
    }
  };
  S.card = function(app, o){
    var id = T.nid('sx'), sec = document.createElement('section');
    sec.className = 'bt-card sk-explore';
    sec.setAttribute('aria-labelledby', id);
    sec.innerHTML = '<div class="sk-head"><p class="sk-kicker">Explore</p><h2 id="' + id + '">' + T.esc(o.title) + '</h2>' + (o.lead ? '<p class="sk-lead">' + o.lead + '</p>' : '') + '</div>';
    app.appendChild(sec);
    return sec;
  };
  S.readout = function(rows){
    return '<dl class="bt-readout sk-read">' + rows.map(function(r){ return '<div' + (r[2] ? ' class="' + r[2] + '"' : '') + '><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
  };
  S.goals = function(el, list, say){
    var done = {};
    el.className = 'sk-goals';
    el.innerHTML = '<p class="sk-goals-h">Try this</p><ul>' + list.map(function(g){ return '<li data-g="' + g.id + '"><span class="sk-tick" aria-hidden="true"></span><span>' + g.text + '</span><span class="sr-only sk-state">Not done yet.</span></li>'; }).join('') + '</ul>';
    return function(id){
      if(done[id]) return false;
      var li = el.querySelector('[data-g="' + id + '"]');
      if(!li) return false;
      done[id] = true;
      li.classList.add('is-done');
      li.querySelector('.sk-state').textContent = 'Done.';
      return true;
    };
  };
  S.num = function(x){ return typeof x === 'number' && isFinite(x) ? x : NaN; };
  window.ApBioSkillStage = S;
})();
