/* LevlPrep motion — the small set of moments that make progress visible.

   Mounted by site-chrome.js on every page of both courses (and by the hub
   page directly), so nothing here is wired per page. Everything listens for
   events the shared progression engine already fires:

     levl:xp        { gained, total, level, leveledUp, title }
                    fired by HubProgress.award() — the "+N XP" chip flies from
                    wherever the viewer last clicked up to the level badge in
                    the header, and the badge pulses as the number lands.
     levl:levelup   { level, title }
                    fired once per level crossed — a toast just under the
                    header (never over the answer just given) and a short
                    burst of confetti. Confetti is kept for this moment only
                    (audit 2026-10): a burst per answer covered explanations.
     levl:streak    { days }
                    fired by HubProgress.recordActivity() on the day a streak
                    reaches 7, 30 or 100 — the same toast and confetti.

   Both toasts carry a Share button (assets/share.js, fetched only if it is
   pressed). The toast stays up while the pointer or keyboard focus is in it,
   so the button can actually be reached; otherwise it leaves on its usual
   schedule.

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
    if(reduced() || !to || to.hidden || !to.offsetWidth){ pulseBadge(); return; }
    var b = to.getBoundingClientRect();
    // Starts just under the badge rather than where the answer was clicked:
    // flying up from the option it crossed the explanation the student was
    // about to read (audit 2026-10, gamification row).
    var from = { x: b.left + b.width / 2 - 20, y: b.bottom + 52 };
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

  /* ---- level-up and streak toast + confetti ---- */
  var toastTimer, busyUntil = 0;
  function hideLater(el, ms){
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove('show'); }, ms);
  }
  function show(ring, line, sub, share){
    var el = document.getElementById('levlToast');
    if(!el){
      el = document.createElement('div');
      el.id = 'levlToast';
      el.className = 'levl-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
      // Held open while someone is reaching for the button in it.
      el.addEventListener('mouseenter', function(){ clearTimeout(toastTimer); });
      el.addEventListener('focusin', function(){ clearTimeout(toastTimer); });
      el.addEventListener('mouseleave', function(){ hideLater(el, 2000); });
      el.addEventListener('focusout', function(){ hideLater(el, 2000); });
    }
    el.innerHTML = '<span class="ring">' + escapeHtml(ring) + '</span><span>' + escapeHtml(line) + '<small>' + escapeHtml(sub) + '</small></span>' +
      (share && window.LevlLazy ? '<button type="button" class="levl-toast__share">Share</button>' : '');
    var b = el.querySelector('.levl-toast__share');
    if(b) b.addEventListener('click', function(){
      window.LevlLazy('share', function(S){ S.share(share); });
    });
    requestAnimationFrame(function(){ el.classList.add('show'); });
    hideLater(el, 4200);
  }
  function courseHome(){
    var p = location.pathname;
    return p.indexOf('/nremt') > -1 ? '/nremt/' : p.indexOf('/ochem') > -1 ? '/ochem/'
         : p.indexOf('/anatomy-physiology') > -1 ? '/anatomy-physiology/' : '/';
  }
  function toast(level, title, rankChanged, course){
    // "Level 4 · A&P rank: Cell Scout", and "New A&P rank: Tissue Tracker"
    // only on the level where the name actually changes.
    show('L' + level, 'Level ' + level, (rankChanged ? 'New ' : '') + (course || 'Rank') + ': ' + (title || ''), {
      what: 'level', title: 'LevlPrep',
      text: 'I reached Level ' + level + (title ? ' (' + title + ')' : '') + ' studying on LevlPrep.',
      url: courseHome()
    });
  }
  function streakToast(days){
    show(days + 'd', days + '-day streak', 'Studied ' + days + ' days in a row.', {
      what: 'streak', title: 'LevlPrep',
      text: 'I have studied on LevlPrep ' + days + ' days in a row.',
      url: courseHome()
    });
  }
  /* A streak mark and a level-up can land on the same answer (the first
     answer of the day earns a show-up bonus). One after the other, then,
     not one over the other. */
  function celebrate(fn){
    var at = Math.max(Date.now() + (reduced() ? 0 : 900), busyUntil);
    busyUntil = at + 4600;
    setTimeout(function(){ fn(); confetti(); }, at - Date.now());
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
    celebrate(function(){ toast(d.level, d.title, d.rankChanged !== false, d.course); });
  });
  document.addEventListener('levl:streak', function(e){
    var d = e.detail || {};
    if(d.days) celebrate(function(){ streakToast(d.days); });
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchBars);
  else watchBars();

  window.LevlMotionFx = { floatXp: floatXp, confetti: confetti, toast: toast, fillBars: fillBars };
})();
