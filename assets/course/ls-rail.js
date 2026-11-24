/* The contents rail on an NREMT or ochem lesson page (scripts/lib/lesson-book.mjs): the phone "Contents" drawer,
   and the open chapter scrolled into view. The A&P and AP® lessons get the same from their <course>-toc.js. */
(function(){
  function start(){
    var btn = document.querySelector('.ls-book .tb-toc-btn');
    if(btn) btn.addEventListener('click', function(){
      var open = document.body.classList.toggle('tb-toc-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var c = document.querySelector('.ls-book .tb-contents'), cur = c && c.querySelector('.open');
    if(cur && c.scrollHeight > c.clientHeight) c.scrollTop = Math.max(0, cur.offsetTop - c.offsetTop - 120);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
