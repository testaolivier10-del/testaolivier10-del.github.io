/* Design preview only (loaded by site-chrome.js on *.vercel.app, never on
   levlprep.com). A small switch shows the pages as a new visitor or as a
   signed in student, so the owner can judge both (live session 2026-11-05).
   The student is made up: no account, nothing is sent anywhere. */
(function(){
  var KEY = 'levl_preview_student';
  var on = false;
  try{ on = localStorage.getItem(KEY) === '1'; }catch(e){}

  var css = document.createElement('style');
  css.textContent = [
    '.pv-switch{position:fixed;left:14px;bottom:14px;z-index:9999;display:flex;align-items:center;gap:4px;padding:4px;border-radius:999px;background:#0B1A33;box-shadow:0 10px 24px rgba(0,0,0,.25);font:800 12.5px var(--font-ui,system-ui)}',
    '.pv-switch span{color:#9FB3D1;padding:0 8px 0 10px}',
    '.pv-switch button{border:0;border-radius:999px;padding:7px 12px;background:none;color:#fff;font:inherit;cursor:pointer}',
    '.pv-switch button.on{background:#FFD23F;color:#0B1A33}',
    '@media (max-width:640px){.pv-switch{bottom:86px}}',
    '.pv-acct{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 5px;border-radius:999px;border:1px solid var(--line);background:var(--white);font:800 14.5px var(--font-ui);color:var(--ink);cursor:pointer;position:relative}',
    '.pv-acct .av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#0f766e;color:#fff;font:900 14px var(--font-ui)}',
    '.pv-acct .cv{color:var(--muted);font-size:12px}',
    '@media (max-width:640px){.pv-acct{padding:0 5px}.pv-acct .nm,.pv-acct .cv{display:none}}',
    '.pv-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:80;min-width:240px;padding:8px;background:var(--white);border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.18);display:none;text-align:left}',
    '.pv-menu.open{display:block}',
    '.pv-menu .who{padding:8px 12px 10px}.pv-menu .who b{display:block;font:800 14px var(--font-ui);color:var(--ink)}.pv-menu .who small{color:var(--muted);font:600 12.5px var(--font-ui)}',
    '.pv-menu a,.pv-menu button{display:flex;align-items:center;width:100%;height:42px;padding:0 12px;border:0;border-radius:10px;background:none;font:800 14.5px var(--font-ui);color:var(--ink);text-decoration:none;cursor:pointer}',
    '.pv-menu a:hover,.pv-menu button:hover{background:var(--hover-tint)}',
    '.pv-menu hr{border:0;border-top:1px solid var(--line);margin:4px 6px}',
    '.pv-cont{display:flex;flex-direction:column;gap:12px}',
    '.pv-cont .pill{align-self:flex-start}',
    '.pv-cc{display:flex;align-items:center;gap:14px;text-decoration:none;color:var(--ink)}',
    '.pv-cc img{width:96px;height:48px;border-radius:10px;object-fit:cover}',
    '.pv-cc small{display:block;font:800 12.5px var(--font-ui);color:var(--muted)}',
    '.pv-cc b{font:900 22px var(--font-ui);letter-spacing:-.02em}',
    '.pv-bar{height:8px;border-radius:99px;background:var(--line)}.pv-bar i{display:block;height:100%;border-radius:99px;background:#0f766e}',
    '.pv-mini{margin:-4px 0 0;font-size:13.5px;color:var(--muted)}',
    '.pv-row{display:flex;align-items:center;gap:14px}',
    '.pv-go{display:inline-flex;align-items:center;height:42px;padding:0 20px;border-radius:12px;background:#FFD23F;color:#0B1A33;font:800 15px var(--font-ui);text-decoration:none}',
    '.pv-link{font:800 14.5px var(--font-ui);color:var(--accent-text)}',
    '.pv-also{border-top:1px solid var(--line);padding-top:10px}',
    '.pv-also small{display:block;font:800 12px var(--font-ui);color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}',
    '.pv-also a{display:flex;align-items:center;gap:10px;font:800 14.5px var(--font-ui);color:var(--ink);text-decoration:none}',
    '.pv-also img{width:44px;height:22px;border-radius:5px;object-fit:cover}.pv-also span{margin-left:auto;color:var(--muted)}',
    '.pv-prog{display:flex;align-items:center;gap:8px;margin:0 14px 12px}',
    '.pv-prog i{flex:1;height:6px;border-radius:99px;background:var(--line);overflow:hidden}.pv-prog i b{display:block;height:100%;background:#0f766e;border-radius:99px}',
    '.pv-prog em{font:800 12.5px var(--font-ui);font-style:normal;color:var(--muted)}'
  ].join('\n');
  document.head.appendChild(css);

  function set(v){ try{ localStorage.setItem(KEY, v ? '1' : '0'); }catch(e){} location.reload(); }

  function switcher(){
    if(document.querySelector('.pv-switch')) return;
    var el = document.createElement('div');
    el.className = 'pv-switch';
    el.innerHTML = '<span>Preview</span><button type="button" data-v="0"' + (on ? '' : ' class="on"') + '>Visitor</button><button type="button" data-v="1"' + (on ? ' class="on"' : '') + '>Student</button>';
    el.addEventListener('click', function(e){
      var b = e.target.closest('button');
      if(b && (b.getAttribute('data-v') === '1') !== on) set(b.getAttribute('data-v') === '1');
    });
    document.body.appendChild(el);
  }

  var root = (document.querySelector('script[src*="site-chrome.js"]') || {}).src || '';
  var base = root.replace(/assets\/site-chrome\.js.*$/, '') || '/';

  function account(){
    var slot = document.getElementById('accountSlot');
    if(!slot || slot.querySelector('.pv-acct')) return;
    slot.innerHTML = '<span class="pv-acct" role="button" tabindex="0" aria-haspopup="menu"><span class="av">S</span><span class="nm">student</span><span class="cv">▾</span>' +
      '<span class="pv-menu" role="menu"><span class="who"><b>student@example.com</b><small>Synced to your account</small></span><a href="' + base + 'account.html">Account &amp; Premium</a><button type="button">Sync now</button><hr><a href="' + base + 'join.html">Join a class</a><hr><button type="button" data-out>Sign out</button></span></span>';
    var btn = slot.querySelector('.pv-acct'), menu = slot.querySelector('.pv-menu');
    btn.addEventListener('click', function(e){
      if(e.target.closest('[data-out]')){ set(false); return; }
      if(!menu.contains(e.target)) menu.classList.toggle('open');
      e.stopPropagation();
    });
    document.addEventListener('click', function(){ menu.classList.remove('open'); });
    var st = document.getElementById('navStreak');
    if(st){ st.hidden = false; var c = document.getElementById('navStreakCount'); if(c) c.textContent = '4'; }
  }

  function hub(){
    var pp = document.querySelector('.home-hero .pp-card');
    if(pp && !pp.classList.contains('pv-cont')){
      pp.classList.add('pv-cont');
      pp.innerHTML = '<span class="pill">Pick up where you left off</span>' +
        '<a class="pv-cc" href="bio/"><img src="assets/covers/apbio.svg" alt=""><span><small>AP® Biology · Unit 1</small><b>1.2 Elements of Life</b></span></a>' +
        '<div class="pv-bar"><i style="width:8%"></i></div><p class="pv-mini">6 of 75 topics done · 3 reviews due</p>' +
        '<div class="pv-row"><a class="pv-go" href="bio/">Continue</a><a class="pv-link" href="bio/path.html">See your path</a></div>' +
        '<div class="pv-also"><small>Also studying</small><a href="ochem/"><img src="assets/covers/ochem.svg" alt="">Organic Chemistry<span>12%</span></a></div>';
    }
    [['bio', 8], ['ochem', 12]].forEach(function(x){
      var a = document.querySelector('.ccard[data-tint="' + x[0] + '"]');
      if(a && !a.querySelector('.pv-prog')) a.insertAdjacentHTML('beforeend', '<span class="pv-prog"><i><b style="width:' + x[1] + '%"></b></i><em>' + x[1] + '%</em></span>');
    });
    var p = document.querySelector('#subjects .home-sh p');
    if(p) p.textContent = 'Your progress is saved to your account on every device.';
  }

  function apply(){
    switcher();
    if(!on) return;
    account();
    if(document.body.classList.contains('home')) hub();
  }
  function start(){
    apply();
    // The account button is drawn after sign in is checked; draw ours again when it changes.
    var h = document.getElementById('site-header');
    if(h && window.MutationObserver) new MutationObserver(function(){ if(on) account(); }).observe(h, { childList: true, subtree: true });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
