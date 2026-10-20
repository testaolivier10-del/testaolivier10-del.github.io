/* The one-time "How did you find LevlPrep?" card (assets/analytics.js
   askSource). Loaded on demand through LevlLazy('heard-from'), so the pages
   that never ask (nearly all of them) do not pay for it. One tap, or skip;
   onDone gets the answer ('tiktok', 'search', 'skip'...). */
(function(){
  var OPTIONS = [
    ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['instagram', 'Instagram'], ['reddit', 'Reddit'],
    ['search', 'Google or Bing'], ['ai', 'ChatGPT or another AI'], ['friend', 'A friend or classmate'],
    ['teacher', 'My teacher or program'], ['other', 'Somewhere else']
  ];
  var CSS =
    '.lh-card{position:fixed;left:50%;bottom:16px;transform:translate(-50%,12px);opacity:0;z-index:2147483000;width:min(440px,calc(100vw - 32px));box-sizing:border-box;padding:16px 16px 14px;border:var(--bw,2px) solid var(--line,#d8dbe2);border-radius:var(--radius,14px);background:var(--white,#fff);color:var(--ink,#111);box-shadow:0 10px 30px rgba(0,0,0,.18);font-family:var(--font-ui,inherit);transition:transform .25s ease,opacity .25s ease;}' +
    '.lh-card.show{transform:translate(-50%,0);opacity:1;}' +
    '.lh-card h2{margin:0 28px 10px 0;font:800 15px/1.35 var(--font-ui,inherit);}' +
    '.lh-opts{display:flex;flex-wrap:wrap;gap:8px;}' +
    '.lh-opts button{font:700 13.5px var(--font-ui,inherit);padding:9px 12px;min-height:40px;border:var(--bw,2px) solid var(--line,#d8dbe2);border-radius:999px;background:var(--surface2,#f4f5f8);color:var(--ink,#111);cursor:pointer;}' +
    '.lh-opts button:hover,.lh-opts button:focus-visible{border-color:var(--accent,#3b5bdb);outline:none;}' +
    '.lh-x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;background:none;color:var(--muted,#666);font:700 20px/1 var(--font-ui,inherit);cursor:pointer;border-radius:8px;}' +
    '.lh-thanks{margin:0;font-weight:700;}' +
    '@media (prefers-reduced-motion: reduce){.lh-card{transition:none;}}';

  function show(onDone){
    if(document.getElementById('levlHeard')) return;
    if(!document.getElementById('levlHeardStyle')){
      var st = document.createElement('style');
      st.id = 'levlHeardStyle';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var el = document.createElement('section');
    el.id = 'levlHeard';
    el.className = 'lh-card';
    el.setAttribute('aria-labelledby', 'levlHeardTitle');
    var html = '<h2 id="levlHeardTitle">Quick question: how did you find LevlPrep?</h2><div class="lh-opts">';
    for(var i = 0; i < OPTIONS.length; i++){
      html += '<button type="button" data-v="' + OPTIONS[i][0] + '">' + OPTIONS[i][1] + '</button>';
    }
    html += '</div><button type="button" class="lh-x" aria-label="Skip this question">×</button>';
    el.innerHTML = html;
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('show'); });

    function close(){
      el.classList.remove('show');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 300);
    }
    function done(v){
      try { onDone(v); } catch(e){ /* never break the page */ }
      if(v === 'skip') return close();
      el.innerHTML = '<p class="lh-thanks" role="status">Thanks! That helps a lot.</p>';
      setTimeout(close, 1400);
    }
    el.addEventListener('click', function(ev){
      var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
      if(!b) return;
      if(b.classList.contains('lh-x')) return done('skip');
      var v = b.getAttribute('data-v');
      if(v) done(v);
    });
    var first = el.querySelector('.lh-opts button');
    if(first && first.focus) try { first.focus({ preventScroll: true }); } catch(e){ /* older browser */ }
  }

  window.LevlHeardFrom = { show: show };
})();
