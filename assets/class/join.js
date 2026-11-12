/* The join page (join.html, docs/teacher-classes.md): find a class by its code, show the student exactly what the
   teacher will see, ask their name and that they are 13 or older (not stored), join. Lists their classes, with
   a way to leave each. */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var M = window.LevlClassModel;
  function A(){ return window.StudyHubAccount; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function msg(t, bad){ var m = $('jMsg'); m.textContent = t || ''; m.className = 'lv-msg' + (bad ? ' is-bad' : ''); }
  // Codes are 8 characters (class_new_code in scripts/sql/migrations/2026-11b-classes.sql).
  function clean(v){ return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }
  var user = null, pendingCode = null;

  // Google sign-in comes back to this page without its ?c=, so the code waits here for up to 15 minutes.
  var HOLD = 'levlprep_join_code_v1';
  function hold(code){ try{ sessionStorage.setItem(HOLD, JSON.stringify({ c: code, t: Date.now() })); }catch(e){} }
  function held(){
    try{
      var o = JSON.parse(sessionStorage.getItem(HOLD) || 'null');
      sessionStorage.removeItem(HOLD);
      return o && Date.now() - o.t < 15 * 60000 ? clean(o.c) : '';
    }catch(e){ return ''; }
  }

  function signInFirst(code){
    pendingCode = code;
    hold(code);
    msg('Sign in first, so your work can reach your teacher. Your school Google account is the quickest way.');
    if(A() && A().openAuthModal) A().openAuthModal('signin', { purpose: 'class' });
  }

  function find(code){
    if(code.length !== 8){ msg('A class code has 8 letters and numbers.', true); return; }
    if(!user){ signInFirst(code); return; }
    msg('Looking for the class...');
    A().rpcData('class_preview', { p_code: code }).then(function(c){
      if(!c){ msg('No class has that code. Check it with your teacher.', true); $('jPreview').hidden = true; return; }
      msg('');
      var course = (M.COURSES[c.course] || {}).name || c.course;
      var meta = user.user_metadata || {}, name = meta.full_name || meta.name || '';
      var p = $('jPreview');
      p.hidden = false;
      p.innerHTML =
        '<form class="lv-card" id="jJoin" style="margin-top:16px" data-cover="' + esc(c.course) + '">' +
          '<p class="lv-kick">' + esc(course) + '</p>' +
          '<h2 class="lv-h2">' + esc(c.teacher) + '’s <span>' + esc(c.name) + '</span></h2>' +
          '<div class="lv-grid2" style="margin-top:18px">' +
            '<div><p class="lv-h3" style="margin-bottom:10px">Your teacher will see</p><ul class="lv-chk">' +
              '<li>Your ' + esc(course) + ' scores, mastery and assignments</li><li>Which questions you miss or flag, and the answers you pick</li><li>When you last studied</li></ul></div>' +
            '<div><p class="lv-h3" style="margin-bottom:10px">Stays private</p><ul class="lv-chk is-lock">' +
              '<li>Your other courses</li><li>Your notes and study assistant chats</li><li>Your streak and study time</li></ul></div>' +
          '</div>' +
          '<label class="lv-field" style="margin-top:20px"><span>Your name, as your teacher knows you</span><input class="lv-in" id="jName" maxlength="60" required value="' + esc(name) + '"></label>' +
          '<label class="lvt-check"><input type="checkbox" id="jAge" required> I am 13 or older</label>' +
          '<p class="lv-mut" style="margin:6px 0 16px">You can leave the class anytime on this page. Your teacher then stops seeing your work.</p>' +
          '<button class="lv-btn is-accent" type="submit">Join class</button><p class="lv-msg" id="jJoinMsg" role="status" aria-live="polite"></p>' +
        '</form>';
      $('jJoin').addEventListener('submit', function(e){
        e.preventDefault();
        var jm = $('jJoinMsg');
        if(!$('jAge').checked){ jm.textContent = 'Classes are for students 13 and older.'; jm.className = 'lv-msg is-bad'; return; }
        var nm = $('jName').value.trim();
        if(!nm){ jm.textContent = 'Add your name so your teacher knows who you are.'; jm.className = 'lv-msg is-bad'; return; }
        A().rpcData('class_join', { p_code: code, p_name: nm }).then(function(r){
          if(!r){ jm.textContent = 'That did not work. Try again in a minute.'; jm.className = 'lv-msg is-bad'; return; }
          try{ localStorage.removeItem('levlprep_classes_v1'); }catch(e){}
          var dir = (M.COURSES[r.course] || {}).dir;
          p.innerHTML = '<div class="lv-card" style="margin-top:16px"><h2 class="lv-h2">You’re <span>in.</span></h2>' +
            '<p class="lv-mut">Assignments from your teacher show at the top of the course home, and your study path follows your class’s order.</p>' +
            '<p style="margin:16px 0 0"><a class="lv-btn is-accent" href="/' + esc(dir) + '/">Go to ' + esc((M.COURSES[r.course] || {}).name || 'the course') + '</a></p></div>';
          loadMine();
        });
      });
    });
  }

  function loadMine(){
    if(!user) return;
    A().rpcData('class_mine').then(function(list){
      var sec = $('jMineSec');
      if(!Array.isArray(list) || !list.length){ sec.hidden = true; return; }
      sec.hidden = false;
      $('jMine').innerHTML = list.map(function(c){
        var C = M.COURSES[c.course] || {};
        return '<div class="lv-card" data-cover="' + esc(c.course) + '"><p class="lv-kick">' + esc(C.name || c.course) + '</p>' +
          '<p class="lv-h3">' + esc(c.teacher || 'Your teacher') + ' · ' + esc(c.name) + '</p>' +
          '<p class="lv-mut">' + (c.assignments || []).length + ' assigned</p>' +
          '<div class="lv-btns" style="margin-top:14px"><a class="lv-btn is-sm" href="/' + esc(C.dir) + '/">Open the course</a>' +
          '<button class="lv-btn is-sm is-ghost" data-leave="' + esc(c.id) + '">Leave class</button></div></div>';
      }).join('');
    });
  }

  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-leave]');
    if(!b) return;
    if(!confirm('Leave this class? Your teacher will stop seeing your work in it.')) return;
    A().rpcData('class_leave', { p_class: b.getAttribute('data-leave') }).then(function(){
      try{ localStorage.removeItem('levlprep_classes_v1'); }catch(e){}
      loadMine();
    });
  });

  function boot(){
    var code = clean(new URLSearchParams(location.search).get('c')) || held();
    if(code.length !== 8) code = '';
    if(code) $('jCode').value = code;
    $('jCode').addEventListener('input', function(){ this.value = clean(this.value); });
    $('jForm').addEventListener('submit', function(e){ e.preventDefault(); find(clean($('jCode').value)); });
    if(!A() || !A().onAuthChange){ msg('Sign in is not available right now.', true); return; }
    A().onAuthChange(function(u){
      user = u;
      if(u){ loadMine(); if(pendingCode){ var c = pendingCode; pendingCode = null; find(c); } else if(code && $('jPreview').hidden) find(code); }
    });
    if(code && !(A().pendingUserId && A().pendingUserId())) signInFirst(code);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
