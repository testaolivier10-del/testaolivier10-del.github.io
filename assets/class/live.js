/* Live mode, the student's side (live.html, docs/teacher-classes.md "v2 build"): while a teacher runs a live
   question in one of the student's classes, show it, take one tap as the answer (changeable until the reveal),
   then show the right answer, why, and how the class answered. Polls class_live_state every 2 s while the tab
   is visible; no Realtime. Nothing is stored on this device. */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  function A(){ return window.StudyHubAccount; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function rich(s){ return window.LevlInline && window.LevlInline.html ? window.LevlInline.html(s || '') : esc(s); }
  var user = null, timer = null, cur = null, pick = {}, last = '', which = null;

  function draw(list){
    var box = $('lvLive');
    if(!user){ box.innerHTML = '<div class="lv-card"><p class="lv-h3">Sign in to answer</p><p class="lv-mut">Use the account you joined your class with.</p><p style="margin:14px 0 0"><button class="lv-btn is-accent" type="button" data-signin="1">Sign in</button></p></div>'; return; }
    if(!Array.isArray(list)){ box.innerHTML = '<div class="lv-card"><p class="lv-h3">Live questions are not open yet</p><p class="lv-mut">Try again later.</p></div>'; return; }
    if(!list.length){ cur = null; box.innerHTML = '<div class="lv-card lv-live-wait"><p class="lv-h3">Waiting for your teacher</p><p class="lv-mut">Keep this page open. The question shows here as soon as your teacher puts it on the screen.</p><p class="hand">checking every few seconds</p></div>'; return; }
    var s = list.filter(function(x){ return x.class_id === which; })[0] || list[0]; which = s.class_id;
    cur = s;
    var key = JSON.stringify([s.class_id, s.idx, s.reveal, s.mine, s.counts, pick[s.class_id + ':' + s.idx]]);
    if(key === last) return; last = key;
    var it = s.item || {}, mine = pick[s.class_id + ':' + s.idx] != null ? pick[s.class_id + ':' + s.idx] : s.mine, total = 0, counts = s.counts || {};
    Object.keys(counts).forEach(function(k){ total += counts[k]; });
    var tabs = list.length > 1 ? '<p class="lv-btns" style="margin:0 0 12px">' + list.map(function(x){ return '<button class="lv-btn is-sm' + (x.class_id === which ? '' : ' is-ghost') + '" type="button" data-cls="' + esc(x.class_id) + '">' + esc(x.class) + '</button>'; }).join('') + '</p>' : '';
    box.innerHTML = tabs + '<div class="lv-card" data-cover="' + esc(s.course) + '"><p class="lv-kick">' + esc(s.teacher || 'Your teacher') + ' &middot; ' + esc(s.class) + ' &middot; question ' + s.idx + '</p>' +
      '<p class="lv-live-q">' + rich(it.q) + '</p><div class="lv-live-os" role="group" aria-label="Answer choices">' + (it.options || []).map(function(o, i){
        var on = mine === i, ok = s.reveal && i === it.correct, bad = s.reveal && on && !ok, n = counts[i] || 0;
        return '<button type="button" class="lv-live-o' + (on ? ' is-on' : '') + (ok ? ' is-ok' : '') + (bad ? ' is-bad' : '') + '" data-pick="' + i + '"' + (s.reveal ? ' disabled' : '') + ' aria-pressed="' + on + '">' +
          '<span class="l">' + String.fromCharCode(65 + i) + '</span><span class="t">' + rich(o) + '</span>' + (s.reveal ? '<span class="v">' + (total ? Math.round(n / total * 100) : 0) + '%</span>' : '') + '</button>';
      }).join('') + '</div>' +
      (s.reveal ? '<p class="lv-msg">' + (mine == null ? 'You did not answer this one.' : mine === it.correct ? 'You got it.' : 'Not this time. The right answer is ' + String.fromCharCode(65 + it.correct) + '.') + '</p>' + (it.why ? '<p class="lv-mut">' + rich(it.why) + '</p>' : '')
        : '<p class="lv-msg" role="status">' + (mine == null ? 'Tap your answer.' : 'Answer sent. You can change it until your teacher reveals it.') + '</p>') + '</div>';
  }
  function poll(){
    if(!user || document.hidden) return;
    A().rpcData('class_live_state').then(draw, function(){ draw(null); });
  }
  function start(){ stop(); poll(); timer = setInterval(poll, 2000); }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }

  document.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('button') : null; if(!b) return;
    if(b.getAttribute('data-signin')){ if(A() && A().openAuthModal) A().openAuthModal(); return; }
    if(b.getAttribute('data-cls')){ which = b.getAttribute('data-cls'); last = ''; poll(); return; }
    var p = b.getAttribute('data-pick'); if(p == null || !cur || cur.reveal) return;
    var k = cur.class_id + ':' + cur.idx, before = pick[k];
    pick[k] = +p; last = ''; draw([cur]);
    A().rpcData('class_live_answer', { p_class: cur.class_id, p_idx: cur.idx, p_pick: +p }).then(function(ok){
      if(!ok){ pick[k] = before; last = ''; poll(); }
    });
  });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden && user) poll(); });

  function boot(){
    if(!A() || !A().onAuthChange){ $('lvLive').innerHTML = '<p class="lv-msg is-bad">Sign in is not available right now.</p>'; return; }
    A().onAuthChange(function(u){
      if(!u && A().pendingUserId && A().pendingUserId() && !(A().settled && A().settled())) return;
      user = u; last = '';
      if(u) start(); else { stop(); draw([]); }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
