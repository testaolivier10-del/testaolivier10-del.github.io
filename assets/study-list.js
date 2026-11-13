/* The study list box (docs/study-list.md): the one place a signed-out visitor can leave an email.

   Shown at the end of a course home page and of every notes page, never on arrival as a popup, never
   to a signed-in student (they already have reminders, docs/reminders.md), and gone for good once
   the visitor joins or closes it. POST /list/join on the Worker sends a confirmation email; nothing
   is stored until the visitor confirms (worker/src/list.js). */
(function(){
  'use strict';
  var ENDPOINT = 'https://api.levlprep.com'; // site-config:API_URL
  var KEY = 'levlprep_list';

  function store(v){ try { if(v === undefined) return localStorage.getItem(KEY); localStorage.setItem(KEY, v); } catch(e){ return null; } }
  function signedIn(){
    try { for(var i = 0; i < localStorage.length; i++){ if(/^sb-.*-auth-token$/.test(localStorage.key(i) || '')) return true; } } catch(e){}
    return false;
  }
  function track(name, data){ try { if(window.LevlAnalytics) window.LevlAnalytics.event(name, data); } catch(e){} }

  var AP = /^ap/;
  function offer(course, name){
    if(course === 'nremt') return ['Testing soon?', 'Get NREMT study tips by email and a heads up before the founding price ends on 31 January.'];
    if(course === 'ochem' || course === 'anp') return ['Finals coming up?', 'Get ' + name + ' study tips by email and a heads up before the founding price ends on 31 January.'];
    if(AP.test(course)) return ['AP® exams are in May', 'Get ' + name + ' study tips through exam season and a heads up before the founding price ends.'];
    return ['Study tips by email', 'A couple of emails a month, and a heads up before the founding price ends.'];
  }

  var CSS =
    '.slist{margin:28px auto;max-width:720px;background:var(--white,#fff);border-radius:var(--radius,16px);box-shadow:var(--shadow,0 1px 3px rgba(0,0,0,.08));padding:20px 22px;position:relative;font-family:var(--font-ui,inherit)}' +
    '.slist h2{font-size:18px;margin:0 0 4px;color:var(--ink,#17241F)}' +
    '.slist p{margin:0 0 12px;color:var(--ink-2,#526C66);font-size:14.5px;line-height:1.5}' +
    '.slist form{display:flex;gap:8px;flex-wrap:wrap}' +
    '.slist input[type=email]{flex:1 1 220px;min-height:44px;border:1px solid var(--line,#D6E0DC);border-radius:12px;padding:0 14px;font:inherit;font-size:15px;background:var(--white,#fff);color:var(--ink,#17241F)}' +
    '.slist button[type=submit]{min-height:44px;border:0;border-radius:12px;padding:0 20px;font:800 15px var(--font-ui,inherit);background:var(--teal,#127264);color:#fff;cursor:pointer}' +
    '.slist .slist-x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;background:none;font-size:20px;color:var(--ink-3,#8A9A95);cursor:pointer;border-radius:10px}' +
    '.slist .slist-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' +
    '.slist small{display:block;margin-top:8px;color:var(--ink-3,#8A9A95);font-size:12.5px}' +
    '.slist [role=status]{margin-top:8px;font-weight:700;font-size:14.5px;color:var(--ink,#17241F)}';

  function mount(course, name){
    if(signedIn() || store()) return;
    var main = document.querySelector('main') || document.getElementById('main');
    if(!main || document.querySelector('.slist')) return;
    var o = offer(course, name);
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var box = document.createElement('section');
    box.className = 'slist';
    box.setAttribute('aria-labelledby', 'slist-h');
    box.innerHTML =
      '<button type="button" class="slist-x" aria-label="Close">×</button>' +
      '<h2 id="slist-h"></h2><p></p>' +
      '<form novalidate><label class="slist-hp" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<input type="email" name="email" required autocomplete="email" placeholder="you@email.com" aria-label="Email address">' +
      '<button type="submit">Send me tips</button></form>' +
      '<div role="status" aria-live="polite"></div>' +
      '<small>We email a link to confirm. One click unsubscribes. <a href="/privacy.html">Privacy</a></small>';
    box.querySelector('h2').textContent = o[0];
    box.querySelector('p').textContent = o[1];
    main.appendChild(box);
    track('list-shown', { course: course });

    box.querySelector('.slist-x').addEventListener('click', function(){ store('closed'); box.remove(); track('list-closed', { course: course }); });
    var form = box.querySelector('form'), status = box.querySelector('[role=status]'), btn = form.querySelector('button');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var email = form.email.value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)){ status.textContent = 'Check the email address.'; form.email.focus(); return; }
      btn.disabled = true; status.textContent = 'Sending…';
      var src = '';
      try { src = (window.LevlAnalytics && window.LevlAnalytics.source && window.LevlAnalytics.source()) || ''; } catch(err){}
      fetch(ENDPOINT + '/list/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, course: course, src: String(src || ''), website: form.website.value })
      }).then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); }).then(function(){
        store('joined');
        form.remove();
        status.textContent = 'Check your inbox for a confirmation link.';
        track('list-joined', { course: course });
      }).catch(function(code){
        btn.disabled = false;
        status.textContent = code === 503 ? 'Email signup is not available right now.' : 'That did not go through. Try again in a minute.';
      });
    });
  }

  window.LevlStudyList = { mount: mount };
})();
