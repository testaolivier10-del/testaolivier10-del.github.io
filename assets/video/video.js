/* The video lesson block's player (markup from scripts/lib/videos.mjs).

   Until a student presses play, the block is a thumbnail served from this
   site and links to youtube.com: no request goes to any YouTube or Google
   host. Pressing play (or a chapter) swaps the thumbnail for the
   privacy-enhanced player from www.youtube-nocookie.com, already playing,
   from that chapter. A chapter pressed later seeks the same player instead
   of reloading it. Each first play is one analytics event, `video-play`
   {video, course, kind, from}, so the weekly report can count them.

   Without JavaScript, or if this file never arrives, the links still work:
   they open the video on YouTube. */
(function(){
  var EMBED = 'https://www.youtube-nocookie.com/embed/';
  var played = {};

  function track(block, from){
    var id = block.getAttribute('data-video');
    if(played[id]) return;
    played[id] = true;
    if(window.LevlAnalytics) window.LevlAnalytics.event('video-play', {
      video: id,
      course: block.getAttribute('data-video-course') || '',
      kind: block.getAttribute('data-video-kind') || '',
      from: from
    });
  }

  function mark(block, start){
    var links = block.querySelectorAll('.lpv-chapters a');
    var cur = null;
    for(var i = 0; i < links.length; i++){
      if(Number(links[i].getAttribute('data-start')) <= start) cur = links[i];
    }
    for(var j = 0; j < links.length; j++){
      if(links[j] === cur) links[j].setAttribute('aria-current', 'true');
      else links[j].removeAttribute('aria-current');
    }
  }

  function play(block, start, from){
    var frame = block.querySelector('.lpv-frame');
    var title = (block.querySelector('.lpv-title') || {}).textContent || 'Video lesson';
    var iframe = frame.querySelector('iframe');
    mark(block, start);
    if(iframe){
      // Already playing: seek rather than reload.
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [start, true] }), 'https://www.youtube-nocookie.com');
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), 'https://www.youtube-nocookie.com');
      } catch(e){ /* the player keeps its place */ }
      return;
    }
    var id = block.getAttribute('data-video');
    iframe = document.createElement('iframe');
    iframe.src = EMBED + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1&enablejsapi=1' +
      (start > 0 ? '&start=' + Math.floor(start) : '') +
      '&origin=' + encodeURIComponent(location.origin);
    iframe.title = title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.setAttribute('allowfullscreen', '');
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    block.classList.add('lpv-open');
    var link = frame.querySelector('.lpv-play');
    frame.appendChild(iframe);
    if(link) link.remove();
    // Keyboard and screen-reader users land on the player they started.
    try { iframe.focus(); } catch(e){}
    track(block, from);
  }

  function onClick(e){
    if(e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('.lpv a[data-start]');
    if(!a) return;
    var block = a.closest('.lpv');
    if(!block) return;
    e.preventDefault();
    var isChapter = !!a.closest('.lpv-chapters');
    play(block, Number(a.getAttribute('data-start')) || 0, isChapter ? 'chapter' : 'button');
    // A chapter pressed with the player scrolled away brings it back.
    if(isChapter && block.getBoundingClientRect().top < 0){
      if(window.LevlMotion) window.LevlMotion.scrollIntoView(block, { block: 'start' });
      else block.scrollIntoView({ block: 'start' });
    }
  }

  // Space on the play link plays too, as it would on a button.
  function onKey(e){
    if(e.key !== ' ' && e.key !== 'Spacebar') return;
    var a = e.target.closest && e.target.closest('.lpv-play');
    if(!a) return;
    e.preventDefault();
    a.click();
  }

  if(!window.__lpvBound){
    window.__lpvBound = true;
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
  }
})();
