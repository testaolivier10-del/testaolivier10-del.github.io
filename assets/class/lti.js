/* Arriving from Canvas or Schoology (teach/lti.html, docs/teacher-classes.md stream C). The Worker checked the
   LMS launch and put a signed, 30-minute ticket in this page's fragment:
     #dl=<ticket>   a teacher adding LevlPrep work to an LMS assignment: sign in, pick class and assignment,
                    the Worker signs the deep-linking response and the browser posts it back to the LMS
     #go=<ticket>   a student (or teacher) opening that assignment: sign in, then on to the course with the
                    assignment open; a student not in the class yet is sent to join it first
   An LMS often shows tools in a frame where sign-in cannot be remembered, so the page offers a new tab. */
(function(){
  'use strict';
  var API = 'https://api.levlprep.com'; // site-config:API_URL
  var M = window.LevlClassModel;
  var app = document.getElementById('ltApp');
  function A(){ return window.StudyHubAccount; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function card(html){ app.innerHTML = '<div class="lv-card">' + html + '</div>'; }
  var framed = false; try{ framed = window.top !== window.self; }catch(e){ framed = true; }
  var newTab = framed ? '<p class="lv-mut" style="margin-top:14px">Sign-in not sticking? <a href="' + esc(location.href) + '" target="_blank" rel="noopener">Open this in a new tab</a>.</p>' : '';

  function api(path, body){
    return A().accessToken().then(function(t){
      return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify(body) });
    }).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(b){ if(!r.ok) throw b; return b; }); });
  }
  function signIn(what){
    card('<p class="lv-kick">LevlPrep</p><h1 class="lv-h2">Sign in to <span>' + esc(what) + '</span></h1><p class="lv-mut">Use the same LevlPrep account you use for this class.</p><p style="margin-top:14px"><button type="button" class="lv-btn is-accent" id="ltIn">Sign in</button></p>' + newTab);
    document.getElementById('ltIn').onclick = function(){ A().openAuthModal(); };
  }
  function fail(e){ card('<h1 class="lv-h2">That did not <span>work</span></h1><p class="lv-mut">' + esc((e && e.error) || 'Try again from your LMS.') + '</p>' + newTab); }

  function pick(ticket){
    A().rpcData('teach_my_classes', {}).then(function(list){
      list = (list || []).filter(function(c){ return !c.archived; });
      if(!list.length){ card('<h1 class="lv-h2">Make a class <span>first</span></h1><p class="lv-mut">You need a LevlPrep class with an assignment in it. <a href="/teach/" target="_blank" rel="noopener">Open the teacher pages</a>, then start again from your LMS.</p>'); return; }
      card('<p class="lv-kick">Add to your LMS</p><h1 class="lv-h2">Which <span>assignment?</span></h1>' +
        '<label class="lv-field"><span>Class</span><select class="lv-in" id="ltClass">' + list.map(function(c){ return '<option value="' + esc(c.id) + '">' + esc(c.name + ' · ' + ((M.COURSES[c.course] || {}).name || c.course)) + '</option>'; }).join('') + '</select></label>' +
        '<label class="lv-field"><span>Assignment</span><select class="lv-in" id="ltA"><option>Loading…</option></select></label>' +
        '<p class="lv-mut">Required assignments get a gradebook column; you send grades from the assignment’s page in LevlPrep.</p>' +
        '<p style="margin-top:14px"><button type="button" class="lv-btn is-accent" id="ltGo">Add it</button></p><p class="lv-msg" id="ltMsg" role="status" aria-live="polite"></p>');
      var load = function(){
        var sel = document.getElementById('ltA');
        A().rpcData('teach_class_report', { p_class: document.getElementById('ltClass').value }).then(function(rep){
          var as = (rep && rep.assignments) || [];
          sel.innerHTML = as.length ? as.map(function(a){ return '<option value="' + esc(a.id) + '">' + esc(a.title + (a.required ? '' : ' (optional)')) + '</option>'; }).join('') : '<option value="">No assignments in this class yet</option>';
        });
      };
      document.getElementById('ltClass').onchange = load; load();
      document.getElementById('ltGo').onclick = function(){
        var a = document.getElementById('ltA').value, m = document.getElementById('ltMsg');
        if(!a){ m.textContent = 'Pick an assignment.'; return; }
        this.disabled = true; m.textContent = 'Sending it to your LMS…';
        api('/lti/deeplink', { ticket: ticket, class: document.getElementById('ltClass').value, assignment: a }).then(function(r){ location.href = r.go; }, fail);
      };
    }, fail);
  }

  function go(ticket){
    card('<p class="lv-mut">Opening your assignment…</p>');
    api('/lti/bind', { ticket: ticket }).then(function(r){
      if(r.url || r.teacher){ location.href = r.url || r.teacher; return; }
      if(r.join){
        card('<p class="lv-kick">One step first</p><h1 class="lv-h2">Join your teacher’s <span>class</span></h1><p class="lv-mut">Your LevlPrep work reaches your teacher once you are in the class. The join page shows what your teacher will see.</p>' +
          '<p style="margin-top:14px"><a class="lv-btn is-accent" href="/join.html?c=' + encodeURIComponent(r.join) + '">Join the class</a></p><p class="lv-mut">Then open the assignment from your LMS again.</p>');
      }
    }, fail);
  }

  function boot(){
    var h = location.hash, dl = (h.match(/[#&]dl=([^&]+)/) || [])[1], gt = (h.match(/[#&]go=([^&]+)/) || [])[1];
    if(!dl && !gt){ card('<h1 class="lv-h2">Open this from your <span>LMS</span></h1><p class="lv-mut">This page is where Canvas or Schoology sends you. Admins: <a href="/teach/lms.html">setup guide</a>.</p>'); return; }
    if(!A() || !A().onAuthChange){ fail({ error: 'Sign-in is not available right now.' }); return; }
    var done = false;
    A().onAuthChange(function(u){
      if(!u){ signIn(dl ? 'add LevlPrep work' : 'open your assignment'); return; }
      if(done) return; done = true;
      if(dl) pick(decodeURIComponent(dl)); else go(decodeURIComponent(gt));
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
