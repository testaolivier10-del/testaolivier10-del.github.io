/* The study assistant's corner button, on its own.

   assets/tutor.js is about 1,300 lines (the retrieval index, the panel, the
   AI layer). Every page used to download and parse it on load for a button
   most visitors never press (site audit 2026-10, performance). This file is
   only the button: the mascot, its first-visit tip and the tuck-on-scroll on
   phones. Reaching for it (hover or focus) starts fetching tutor.js; pressing
   it opens the panel as soon as tutor.js arrives. tutor.js adopts this button
   instead of drawing its own. Mounted by site-chrome.js (mountTutor). */
(function(){
  'use strict';
  if(window.LEVLPREP_TUTOR_INLINE || document.querySelector('.lp-launch')) return;

  var MET_KEY = 'levlprep_ai_met';
  var CSS = '.lp-launch{position:fixed;right:20px;bottom:20px;z-index:42;width:58px;height:58px;padding:0;' +
    'border:none;background:transparent;cursor:pointer;line-height:0;' +
    'filter:drop-shadow(0 4px 10px rgba(0,0,0,.26));transition:transform .16s ease, opacity .2s ease;}' +
    '.lp-launch svg{width:100%;height:100%;display:block;border-radius:18px;}' +
    '.lp-launch:hover{transform:translateY(-2px) scale(1.04);}' +
    '.lp-launch:active{transform:translateY(1px) scale(.98);}' +
    '.lp-launch:hover .lp-eye{r:5.6;}' +
    '.lp-launch[aria-busy=true]{opacity:.7;}' +
    // A mascot with no label is a mystery button on first visit, so it says
    // what it is until someone has actually opened it once.
    '.lp-tip{position:fixed;right:86px;bottom:34px;z-index:42;background:var(--navy);color:#fff;' +
    'font:800 12.5px var(--font-ui);padding:7px 12px;border-radius:10px;white-space:nowrap;' +
    'pointer-events:none;opacity:0;transform:translateX(6px);transition:opacity .18s ease, transform .18s ease;}' +
    '.lp-tip.show{opacity:1;transform:translateX(0);}' +
    '.lp-bob{transform-box:fill-box;transform-origin:center;animation:lpbob 4.2s ease-in-out infinite;}' +
    '@keyframes lpbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}' +
    '.lp-blip{animation:lppulse 2.4s ease-in-out infinite;}' +
    '@keyframes lppulse{0%,100%{opacity:1}50%{opacity:.35}}' +
    '@media(prefers-reduced-motion:reduce){.lp-bob,.lp-blip{animation:none;}.lp-launch{transition:none;}}' +
    // Phones: a smaller mascot parked just above the bottom tab bar, tucked
    // away while the reader scrolls down (html.lp-tucked).
    '@media(max-width:640px){.lp-launch{right:12px;bottom:calc(84px + env(safe-area-inset-bottom));width:42px;height:42px;}' +
    '.lp-launch svg{border-radius:13px;}.lp-tip{display:none;}' +
    'html.lp-tucked .lp-launch{opacity:0;transform:translateY(16px);pointer-events:none;}}';

  var SVG = '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
    '<rect width="120" height="120" rx="26" fill="#16332E"/><g class="lp-bob">' +
    '<path d="M60 31 L60 19" stroke="#2C9C8B" stroke-width="4" stroke-linecap="round"/>' +
    '<circle class="lp-blip" cx="60" cy="15" r="5.2" fill="#C9973A"/>' +
    '<rect x="27" y="30" width="66" height="53" rx="17" fill="#2C9C8B"/>' +
    '<rect x="35" y="42" width="50" height="27" rx="13.5" fill="#16332E"/>' +
    '<circle class="lp-eye" cx="49" cy="55.5" r="4.6" fill="#3FBBA6"/>' +
    '<circle class="lp-eye" cx="71" cy="55.5" r="4.6" fill="#3FBBA6"/>' +
    '<rect x="45" y="86" width="30" height="8" rx="4" fill="#2C9C8B" opacity=".75"/></g></svg>';

  var loading = false;
  function loadTutor(){
    if(loading || window.LevlPrepTutor) return;
    loading = true;
    var s = document.createElement('script');
    s.src = '/assets/tutor.js';
    s.onerror = function(){
      loading = false;
      btn.removeAttribute('aria-busy');
      window.__levlTutorOpenOnLoad = false;
    };
    document.head.appendChild(s);
  }

  var btn, tip;
  function init(){
    var style = document.createElement('style');
    style.id = 'lp-launch-css';
    style.textContent = CSS;
    document.head.appendChild(style);

    btn = document.createElement('button');
    btn.className = 'lp-launch';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Ask the study assistant');
    btn.innerHTML = SVG;
    document.body.appendChild(btn);
    document.body.classList.add('lp-has-fab');

    tip = document.createElement('div');
    tip.className = 'lp-tip';
    tip.textContent = 'Ask me anything';
    document.body.appendChild(tip);

    var met = false;
    try { met = localStorage.getItem(MET_KEY) === '1'; } catch(e){}
    if(!met) setTimeout(function(){ tip.classList.add('show'); }, 1200);

    // Reaching for the button is the earliest honest signal that someone is
    // about to ask, so the assistant starts downloading then.
    btn.addEventListener('mouseenter', loadTutor);
    btn.addEventListener('focus', loadTutor);
    btn.addEventListener('click', function onFirst(){
      if(window.LevlPrepTutor) return; // tutor.js has taken the button over
      window.__levlTutorOpenOnLoad = true;
      btn.setAttribute('aria-busy', 'true');
      loadTutor();
    });

    var root = document.documentElement, lastY = window.scrollY || 0, ticking = false;
    function update(){
      ticking = false;
      var y = window.scrollY || 0;
      var atEnd = y + window.innerHeight >= root.scrollHeight - 40;
      if(atEnd || y < 80 || y < lastY - 4) root.classList.remove('lp-tucked');
      else if(y > lastY + 4) root.classList.add('lp-tucked');
      if(Math.abs(y - lastY) > 4) lastY = y;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
