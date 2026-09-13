/* LevlPrep motion — the small set of moments that make progress visible.

   Mounted by site-chrome.js on every page of both courses (and by the hub
   page directly), so nothing here is wired per page. Everything listens for
   events the shared progression engine already fires:

     levl:xp        { gained, total, level, leveledUp, title }
                    fired by HubProgress.award() — the "+N XP" chip flies from
                    wherever the viewer last clicked up to the level badge in
                    the header, and the badge pulses as the number lands.
     levl:levelup   { level, title }
                    fired once per level crossed — a toast at the bottom of
                    the screen and a short burst of confetti.

   Plus one thing that is not an event: progress bars fill from zero when the
   page opens, so a reading you earned is seen being earned. Every bar the
   site draws (.track > i, .xp-fill, .mini-domain-row .bar i) gets it, whether
   it was in the HTML or rendered by a script a moment later.

   Honors the OS reduce-motion setting: the chip and confetti are skipped and
   bars appear at their final width. */
(function(){
  if(window.LevlMotionFx) return;

  function reduced(){
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---- where the last click happened, so the XP chip starts there ---- */
  var lastPoint = null;
  document.addEventListener('pointerdown', function(e){
    lastPoint = { x: e.clientX, y: e.clientY };
  }, { capture: true, passive: true });
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' && e.key !== ' ') return;
    var el = document.activeElement;
    if(!el || el === document.body) return;
    var r = el.getBoundingClientRect();
    lastPoint = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, { capture: true, passive: true });

  function badge(){ return document.getElementById('levelBadge'); }

  /* ---- +N XP chip ---- */
  function floatXp(gained){
    if(!gained) return;
    var to = badge();
    var from = lastPoint || { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
    if(reduced() || !to){ pulseBadge(); return; }
    var b = to.getBoundingClientRect();
    var chip = document.createElement('span');
    chip.className = 'levl-xp-float';
    chip.textContent = '+' + gained + ' XP';
    chip.setAttribute('aria-hidden', 'true');
    chip.style.left = (from.x - 30) + 'px';
    chip.style.top = (from.y - 34) + 'px';
    chip.style.setProperty('--dx', (b.left + b.width / 2 - from.x + 30) + 'px');
    chip.style.setProperty('--dy', (b.top + b.height / 2 - from.y + 34) + 'px');
    document.body.appendChild(chip);
    setTimeout(function(){ chip.remove(); pulseBadge(); }, 1000);
  }
  function pulseBadge(){
    var el = badge();
    if(!el) return;
    el.classList.remove('levl-pulse');
    void el.offsetWidth;
    el.classList.add('levl-pulse');
  }

  /* ---- level-up toast + confetti ---- */
  var toastTimer;
  function toast(level, title){
    var el = document.getElementById('levlToast');
    if(!el){
      el = document.createElement('div');
      el.id = 'levlToast';
      el.className = 'levl-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = '<span class="ring">L' + level + '</span><span>Level ' + level + ' · ' + escapeHtml(title || '') + '<small>New rank unlocked.</small></span>';
    clearTimeout(toastTimer);
    requestAnimationFrame(function(){ el.classList.add('show'); });
    toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 4200);
  }

  function confetti(){
    if(reduced()) return;
    var c = document.getElementById('levlConfetti');
    if(!c){
      c = document.createElement('canvas');
      c.id = 'levlConfetti';
      c.setAttribute('aria-hidden', 'true');
      document.body.appendChild(c);
    }
    c.width = window.innerWidth; c.height = window.innerHeight;
    var ctx = c.getContext('2d');
    var cols = ['#35B39F', '#E0A63C', '#F08A7C', '#B9AEE8', '#1F4A42'];
    var ps = [];
    for(var i = 0; i < 140; i++){
      ps.push({
        x: c.width / 2 + (Math.random() - .5) * 220, y: c.height * .45,
        vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
        r: Math.random() * 6 + 4, col: cols[Math.random() * cols.length | 0],
        a: Math.random() * 6, s: Math.random() * .3 - .15
      });
    }
    var t0 = performance.now();
    (function frame(t){
      ctx.clearRect(0, 0, c.width, c.height);
      ps.forEach(function(p){
        p.vy += .35; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.a += p.s;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.col; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      });
      if(t - t0 < 2200) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, c.width, c.height);
    })(t0);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(ch){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch];
    });
  }

  /* ---- bars fill from zero ---- */
  var BAR = '.track > i, .track > .fill, .xp-fill, .mini-domain-row .bar i, .mstat-row .fill, .hub-fill';
  function fillBars(root){
    var bars = (root || document).querySelectorAll(BAR);
    for(var i = 0; i < bars.length; i++){
      var el = bars[i];
      if(el.__levlFilled) continue;
      el.__levlFilled = true;
      var w = el.style.width;
      if(!w || w === '0%' || w === '0px' || reduced()) continue;
      el.style.transition = 'none';
      el.style.width = '0%';
      (function(el, w){
        requestAnimationFrame(function(){ requestAnimationFrame(function(){
          el.style.transition = '';
          el.style.width = w;
        }); });
      })(el, w);
    }
  }
  function watchBars(){
    fillBars();
    if(!window.MutationObserver) return;
    var pending = false;
    var mo = new MutationObserver(function(){
      if(pending) return;
      pending = true;
      requestAnimationFrame(function(){ pending = false; fillBars(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // Stop watching once the page has settled: the bars that matter are the
    // ones drawn on arrival, and a live bar updating mid-session should
    // simply transition, which it does on its own.
    setTimeout(function(){ mo.disconnect(); }, 4000);
  }

  document.addEventListener('levl:xp', function(e){
    var d = e.detail || {};
    floatXp(d.gained);
  });
  document.addEventListener('levl:levelup', function(e){
    var d = e.detail || {};
    setTimeout(function(){ toast(d.level, d.title); confetti(); }, reduced() ? 0 : 900);
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchBars);
  else watchBars();

  window.LevlMotionFx = { floatXp: floatXp, confetti: confetti, toast: toast, fillBars: fillBars };
})();
