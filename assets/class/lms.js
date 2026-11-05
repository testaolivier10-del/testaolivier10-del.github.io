/* The LMS setup guide's form (teach/lms.html): a school admin or teacher registers their Canvas or Schoology
   developer key with LevlPrep (POST /lti/platforms). Presets fill the addresses each LMS documents; every field
   stays editable because a school's own Canvas domain goes in the token address. */
(function(){
  'use strict';
  var API = 'https://api.levlprep.com'; // site-config:API_URL
  var $ = function(id){ return document.getElementById(id); };
  function A(){ return window.StudyHubAccount; }
  var PRESETS = {
    canvas: { issuer: 'https://canvas.instructure.com', auth_url: 'https://sso.canvaslms.com/api/lti/authorize_redirect',
              token_url: 'https://YOUR-SCHOOL.instructure.com/login/oauth2/token', jwks_url: 'https://sso.canvaslms.com/api/lti/security/jwks' },
    schoology: { issuer: 'https://schoology.schoology.com', auth_url: 'https://lti-service.svc.schoology.com/lti-service/authorize-redirect',
                 token_url: 'https://lti-service.svc.schoology.com/lti-service/access-token', jwks_url: 'https://lti-service.svc.schoology.com/lti-service/.well-known/jwks' }
  };
  function msg(t, bad){ var m = $('lmMsg'); m.textContent = t || ''; m.className = 'lv-msg' + (bad ? ' is-bad' : ''); }
  function fill(k){ var p = PRESETS[k]; if(!p) return; Object.keys(p).forEach(function(f){ $('lm_' + f).value = p[f]; }); }
  function boot(){
    var form = $('lmForm'); if(!form) return;
    document.querySelectorAll('[data-preset]').forEach(function(b){ b.addEventListener('click', function(){ fill(b.getAttribute('data-preset')); }); });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!A() || !A().user || !A().user()){ msg('Sign in first (any LevlPrep account; the key is tied to it).', true); if(A() && A().openAuthModal) A().openAuthModal(); return; }
      if(/YOUR-SCHOOL/.test($('lm_token_url').value)){ msg('Put your school’s Canvas address in the token URL.', true); return; }
      var body = {}; ['label', 'issuer', 'client_id', 'deployment_id', 'auth_url', 'token_url', 'jwks_url'].forEach(function(f){ body[f] = $('lm_' + f).value.trim(); });
      msg('Saving…');
      A().accessToken().then(function(t){
        return fetch(API + '/lti/platforms', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify(body) });
      }).then(function(r){ return r.json().then(function(b){ if(!r.ok) throw b; return b; }); })
        .then(function(){ msg('Saved. Teachers can now add LevlPrep from the assignment picker in your LMS.'); },
          function(e){ msg((e && e.error) || 'That did not work. Try again.', true); });
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
