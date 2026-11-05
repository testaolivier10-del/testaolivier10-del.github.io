/* The Class Premium quote and purchase order form (teach/quote.html, POST /class/quote). Signed in, so the reply
   reaches a real address; the Worker stores it and emails the owner. Nothing is charged here. */
(function(){
  'use strict';
  var API = 'https://api.levlprep.com'; // site-config:API_URL
  var $ = function(id){ return document.getElementById(id); };
  function A(){ return window.StudyHubAccount; }
  function msg(t, bad){ var m = $('qtMsg'); m.textContent = t || ''; m.className = 'lv-msg' + (bad ? ' is-bad' : ''); }
  var FIELDS = ['name', 'role', 'school', 'district', 'email', 'phone', 'students', 'classes', 'courses', 'start', 'po_number', 'billing', 'tax_exempt', 'notes'];
  function boot(){
    var form = $('qtForm'); if(!form) return;
    var po = function(){ var on = form.querySelector('input[name="kind"]:checked').value === 'po'; document.querySelectorAll('.qt-po').forEach(function(el){ el.hidden = !on; }); };
    form.querySelectorAll('input[name="kind"]').forEach(function(r){ r.addEventListener('change', po); }); po();
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!A() || !A().user || !A().user()){ msg('Sign in first, so we can reply to you.', true); if(A() && A().openAuthModal) A().openAuthModal(); return; }
      var body = { kind: form.querySelector('input[name="kind"]:checked').value };
      FIELDS.forEach(function(f){ var el = $('qt_' + f); if(el) body[f] = el.type === 'checkbox' ? (el.checked ? 'yes' : '') : el.value.trim(); });
      msg('Sending…');
      A().accessToken().then(function(t){
        return fetch(API + '/class/quote', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify(body) });
      }).then(function(r){ return r.json().then(function(b){ if(!r.ok) throw b; return b; }); })
        .then(function(){ form.reset(); po(); msg('Sent. You will get a copy by email, and a reply within two school days.'); },
          function(e){ msg((e && e.error) || 'That did not work. Email hello@levlprep.com instead.', true); });
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
