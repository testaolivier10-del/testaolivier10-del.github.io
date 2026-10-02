/* The ochem side of the Premium split. assets/premium.js owns the switch, the
   prices and COURSES.ochem.freeChapters; this file only says which ochem
   things are Premium and swaps the locked ones for a gate.

   Free: every notes page and the textbook, the flashcards, the free
   chapters' lessons, mechanisms and questions, 15 questions a day from any
   other chapter and one full exam (both in question-engine.js, which adds
   them to OchemPremium), the tools in FREE_TOOLS, and all progress, XP,
   streaks and the weakest-concepts list. Everything else is Premium.
   Before launch nothing locks and Premium features only carry a badge.

   Load it deferred right after ../assets/premium.js. It tolerates premium.js
   being absent: then nothing is ever locked and no badge is drawn.

   Lessons and mechanisms gate themselves from here: the page's chapter is the
   data-chapter on its eyebrow, and what is hidden is everything in the
   lesson shell under the hero. lesson-engine.js waits on whenOpen() so a
   locked lesson writes no progress; nothing already earned is touched. */
(function(){
  var FREE_TOOLS = ['arrow-pusher', 'resonance', 'viewer-3d'];

  function P(){ return window.LevlPremium; }
  function free(ch){ return !!(P() && ch && P().isFreeChapter('ochem', ch)); }
  // A chapter of '' or undefined means "a whole-course feature".
  function locked(ch){
    var p = P();
    return !!(p && p.launched() && !p.has('ochem') && !free(ch));
  }
  function badge(ch){ return P() && !free(ch) ? P().badge('ochem') : ''; }
  // For inside a link, where a button is not allowed.
  function pill(ch){ return badge(ch) ? '<span class="premium-badge">Premium</span>' : ''; }
  function toolFree(slug){ return FREE_TOOLS.indexOf(slug) !== -1; }
  var topicChapter = null;
  function chapterOfTopic(id){
    var C = window.OchemCurriculum, m = C && C.MODULES;
    if(!topicChapter && m){
      topicChapter = {};
      for(var i = 0; i < m.length; i++){
        for(var j = 0; j < m[i].topics.length; j++) topicChapter[m[i].topics[j].id] = m[i].id;
      }
    }
    return (topicChapter && topicChapter[id]) || '';
  }
  function topicLocked(id){ return locked(chapterOfTopic(id)); }
  function onChange(fn){ if(P()) P().onChange(fn); else fn(); }

  /* Hides o.hide while o.locked() holds and shows a gate after o.after,
     linking to o.notes. Follows access changes both ways, so a pass confirmed
     after load opens the page without a reload. o.badgeIn gets a badge: the
     eyebrow, where it does not wrap the title onto another line and push the
     page down after first paint (audit 2026-10, layout shift). */
  function lock(o){
    var box = null, badged = false;
    onChange(function(){
      var on = o.locked();
      o.hide.forEach(function(el){
        if(!el) return;
        if(el._pd === undefined) el._pd = el.style.display;
        el.style.display = on ? 'none' : el._pd;
      });
      if(on && !box && o.after){
        box = document.createElement('div');
        box.className = 'ochem-lock';
        box.innerHTML = P().gate('ochem', o.feature, o.source || o.feature) +
          (o.notes ? '<p class="ochem-lock__notes"><a href="' + o.notes + '">' +
            (o.notesText || 'Read the free notes for this topic') + ' &rarr;</a></p>' : '');
        o.after.parentNode.insertBefore(box, o.after.nextSibling);
      } else if(!on && box){
        box.parentNode.removeChild(box);
        box = null;
      }
      if(o.badgeIn && !badged && o.badge){
        o.badgeIn.insertAdjacentHTML('beforeend', o.badge);
        badged = true;
      }
    });
  }

  // ---- lessons and mechanisms -------------------------------------------
  var shell = document.querySelector('.lesson-shell');
  var tag = document.querySelector('.lesson-shell[data-chapter], .eyebrow[data-chapter]');
  var pageChapter = tag ? tag.getAttribute('data-chapter') : '';
  if(shell && document.getElementById('card')){
    var hero = shell.querySelector('.hero');
    var read = document.querySelector('.lesson-links a[href*="notes/"]');
    lock({
      feature: 'lesson', source: 'lesson',
      hide: [].slice.call(shell.children).filter(function(el){ return el !== hero; }),
      after: hero,
      notes: read ? read.getAttribute('href') : '../learn.html',
      locked: function(){ return locked(pageChapter); },
      badgeIn: hero && (hero.querySelector('.eyebrow') || hero.querySelector('h1')),
      badge: badge(pageChapter)
    });
  }

  /* Runs fn once the page's chapter is open: now, or when access arrives. */
  function whenOpen(fn){
    var done = false;
    onChange(function(){
      if(done || locked(pageChapter)) return;
      done = true;
      fn();
    });
  }

  window.OchemPremium = {
    FREE_TOOLS: FREE_TOOLS,
    locked: locked,
    topicLocked: topicLocked,
    chapterOfTopic: chapterOfTopic,
    toolFree: toolFree,
    badge: badge,
    pill: pill,
    lock: lock,
    whenOpen: whenOpen
  };
})();
