/* Ochem session runner — the shared question-asking loop.

   Practice and Review both put questions on screen, grade them, diagnose a
   miss, teach the concept behind it, and offer a follow-up check. That whole
   loop lives here once. The two pages differ in what they ask NEXT and when
   they stop, not in how a question behaves, so those are the parts they hand
   in as callbacks:

     next(state)      -> the next question, or null to end the session
     progress(state)  -> { pct, label } for the progress bar
     checkFor(d, q)   -> a remediation question after a miss, or null
     onFinish(state)  -> the page takes over and renders its own ending

   Keeping one implementation matters more than it looks. The runner is what
   writes to the mastery engine (via the diagnostic engine) on every answer;
   a second copy on the Review page would quietly drift — a missed
   markSeen(), a different share weight — and the two pages would disagree
   about what the student knows.

   Everything below the callbacks is the same for both: the per-kind
   renderers (click an atom, push an arrow, rank a list, multiple choice),
   the diagnostic feedback panel, and the mastery-delta chips.

   Usage:
     var run = OchemSessionRunner({ els: {...}, next: fn, ... });
     run.start({ title: 'Adaptive practice' });
*/
(function(){
  var CO = window.OchemConcepts;
  var M  = window.OchemMastery;
  var D  = window.OchemDiagnostics;
  var E  = window.OchemQuestionEngine;
  var Mo = window.OchemMolecules;
  var Ed = window.OchemMoleculeEditor;
  // Looked up lazily: flags.js is optional chrome, and a page that forgets to
  // include it should lose the flag button, not the whole question loop.
  function flags(){ return window.OchemFlags || null; }

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function pct(x){ return Math.round((x || 0) * 100); }
  function plural(n, word){ return n + ' ' + word + (n === 1 ? '' : 's'); }
  function shuffled(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){ var j = Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }

  function OchemSessionRunner(config){
    var els = config.els;
    var cardEl = els.card;
    var S = null;

    function tierChipHtml(tier){
      var t = M.TIERS[tier] || M.TIERS[2];
      var pips = '';
      for(var i=1;i<=4;i++) pips += '<span class="pip' + (i <= tier ? ' on' : '') + '"></span>';
      return '<span class="tier-pips" title="' + esc(t.blurb) + '">' + pips + '</span>' +
             '<span class="tier-label">' + esc(t.label) + '</span>';
    }

    /* ---- per-kind rendering --------------------------------------------
       Each renderer returns { html, attach(submit) }. `submit(response)` is
       called with the kind-specific response object the diagnostic engine
       expects. Renderers never grade anything themselves. */

    /* Options are shuffled per sitting (shuffle-options.js) rather than
       served in the order they were authored. Both banks were written
       answer-first — 53% of the legacy bank had its answer in slot A — and
       a position habit is something a student learns instead of the
       chemistry. Everything downstream stays keyed by the AUTHOR's index:
       `submit` reports it, so the diagnostic engine's per-wrong-answer
       `diag` map needs no translation, and `lock` maps back the other way
       to colour the right button. */
    function renderMcq(q){
      var opts = q.options || [];
      var shuf = window.OchemShuffle
        ? window.OchemShuffle.apply(opts, q.id)
        : { options: opts, toOriginal: opts.map(function(_, i){ return i; }) };
      return {
        html: '<div class="choice-row">' + shuf.options.map(function(o, i){
          return '<button class="choice-btn" data-i="' + shuf.toOriginal[i] + '">' + esc(o) + '</button>';
        }).join('') + '</div>',
        attach: function(submit){
          cardEl.querySelectorAll('.choice-btn').forEach(function(btn){
            btn.addEventListener('click', function(){
              submit({ choice: parseInt(btn.getAttribute('data-i'), 10) });
            });
          });
        },
        lock: function(response, correct){
          cardEl.querySelectorAll('.choice-btn').forEach(function(b, i){
            var orig = shuf.toOriginal[i];
            b.disabled = true;
            if(orig === q.answer) b.classList.add('correct');
            else if(orig === response.choice) b.classList.add('wrong');
          });
        }
      };
    }

    function renderClickAtom(q){
      return {
        html: '<div class="click-hint">Click an atom on the molecule.</div>' +
              Mo.svg(q.molecule, { clickable: 'all' }),
        attach: function(submit){
          cardEl.querySelectorAll('.atom').forEach(function(el){
            function go(){ submit({ key: el.getAttribute('data-key') }); }
            el.addEventListener('click', go);
            el.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
          });
        },
        lock: function(response, correct){
          var ok = D.acceptedKeys(q);
          cardEl.querySelector('.scene').classList.add('scene--locked');
          cardEl.querySelectorAll('.atom').forEach(function(el){
            var k = el.getAttribute('data-key');
            el.classList.add('atom--static');
            if(ok.indexOf(k) !== -1) el.classList.add('atom--correct');
            else if(k === response.key) el.classList.add('atom--wrong');
          });
        }
      };
    }

    function renderMultiClick(q){
      var picked = [];
      return {
        html: '<div class="click-hint">Click every atom that applies, then check your answer.</div>' +
              Mo.svg(q.molecule, { clickable: 'all' }) +
              '<div class="multi-note" id="multiNote">Nothing selected yet.</div>' +
              '<div class="actions" style="justify-content:flex-start;"><button class="btn-press" id="checkBtn" disabled>Check answer</button></div>',
        attach: function(submit){
          var note = cardEl.querySelector('#multiNote');
          var check = cardEl.querySelector('#checkBtn');
          cardEl.querySelectorAll('.atom').forEach(function(el){
            function toggle(){
              var k = el.getAttribute('data-key');
              var at = picked.indexOf(k);
              if(at === -1){ picked.push(k); el.classList.add('chosen'); }
              else { picked.splice(at, 1); el.classList.remove('chosen'); }
              note.textContent = picked.length ? plural(picked.length, 'position') + ' selected.' : 'Nothing selected yet.';
              check.disabled = !picked.length;
            }
            el.addEventListener('click', toggle);
            el.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); } });
          });
          check.addEventListener('click', function(){ submit({ keys: picked.slice() }); });
        },
        lock: function(response, correct){
          var ok = D.acceptedKeys(q);
          cardEl.querySelector('#checkBtn').remove();
          cardEl.querySelector('.scene').classList.add('scene--locked');
          cardEl.querySelectorAll('.atom').forEach(function(el){
            var k = el.getAttribute('data-key');
            el.classList.remove('chosen');
            el.classList.add('atom--static');
            if(ok.indexOf(k) !== -1) el.classList.add('atom--correct');
            else if((response.keys || []).indexOf(k) !== -1) el.classList.add('atom--wrong');
          });
        }
      };
    }

    function renderArrow(q){
      var from = null;
      return {
        html: '<div class="click-hint">Click where the arrow starts, then where it ends.</div>' +
              Mo.svg(q.molecule, { clickable: 'all' }) +
              '<div class="multi-note" id="arrowNote">Start at a source of electrons.</div>',
        attach: function(submit){
          var note = cardEl.querySelector('#arrowNote');
          cardEl.querySelectorAll('.atom').forEach(function(el){
            function go(){
              var k = el.getAttribute('data-key');
              if(from === null){
                from = k;
                el.classList.add('chosen');
                note.textContent = 'Tail on ' + Mo.labelFor(q.molecule, k) + '. Now click where those electrons go.';
              } else if(k !== from){
                submit({ from: from, to: k });
              }
            }
            el.addEventListener('click', go);
            el.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
          });
        },
        lock: function(response, correct){
          // Redraw the scene showing the student's arrow in red when wrong and
          // the correct one in green alongside it, so the mistake is visible
          // rather than described.
          var arrows = [];
          if(!correct) arrows.push({ from: response.from, to: response.to, color: 'var(--bad)' });
          arrows.push({ from: q.answer.from, to: q.answer.to, color: correct ? 'var(--good)' : 'var(--accent)' });
          var scene = cardEl.querySelector('.scene');
          scene.outerHTML = Mo.svg(q.molecule, { clickable: [], arrows: arrows });
          cardEl.querySelector('.scene').classList.add('scene--locked');
          var note = cardEl.querySelector('#arrowNote');
          if(note) note.remove();
        }
      };
    }

    /* The only question kind where the student PRODUCES the answer instead of
       recognizing it. Everything else on this page — click the atom, pick the
       arrow, rank these — narrows a set someone else wrote down. Here there is
       a blank molecule and they have to know what to draw, which is the thing
       an exam actually asks for.

       The editor is the same component Tools mounts ungraded; only the Submit
       button and the grading are added here. */
    function renderDraw(q, prior){
      var editor = null;
      var need = ((q.answer && q.answer.arrows) || []).length;
      return {
        html: '<div class="click-hint">' +
                (q.drawHint || ('Draw the ' + (need === 1 ? 'arrow' : need + ' arrows') +
                 ' for this step. Click an electron source, then where the electrons go.')) +
              '</div>' +
              '<div id="drawHost"></div>' +
              '<div class="actions" style="justify-content:flex-start;">' +
                '<button class="btn-press" id="drawSubmit" disabled>Submit arrows</button>' +
              '</div>',
        attach: function(submit){
          var host = cardEl.querySelector('#drawHost');
          var btn = cardEl.querySelector('#drawSubmit');
          editor = Ed.mount(host, {
            molecule: q.molecule,
            // On replay the editor is mounted with the arrows the student
            // actually drew, so lock() can mark those rather than an empty
            // canvas.
            arrows: (prior && prior.arrows) || [],
            maxArrows: Math.max(need, 1) + 1,   // room to draw one too many, which is itself a diagnosis
            onChange: function(state){
              btn.disabled = !state.arrows.length;
              btn.textContent = state.arrows.length === need
                ? 'Submit arrows'
                : 'Submit ' + state.arrows.length + ' of ' + need;
            }
          });
          btn.addEventListener('click', function(){
            if(!editor) return;
            var st = editor.state();
            if(!st.arrows.length) return;
            submit({ arrows: st.arrows });
          });
        },
        lock: function(response, correct){
          var btn = cardEl.querySelector('#drawSubmit');
          if(btn) btn.remove();
          if(!editor) return;
          /* Show the student's own arrows marked right and wrong rather than
             wiping them for a model answer — the point is to see which of the
             arrows THEY drew was the bad one. */
          var mol = Mo.get(q.molecule);
          var exp = (q.answer && q.answer.arrows) || [];
          var good = [], bad = [];
          response.arrows.forEach(function(a, i){
            var hit = exp.some(function(e){ return Ed.matches(mol, [a], [e]); });
            (hit ? good : bad).push(i);
          });
          var missing = exp.length - good.length;
          editor.markResult(good, bad, correct ? '' :
            (missing > 0 && !bad.length)
              ? 'Right as far as it goes — ' + missing + ' more ' + (missing === 1 ? 'arrow is' : 'arrows are') + ' needed.'
              : '');
        }
      };
    }

    function renderOrder(q, prior){
      // Start from a shuffled arrangement that isn't already the answer —
      // unless this is a replay, in which case start from the arrangement
      // the student submitted, which is the thing being reviewed.
      var order;
      if(prior && prior.order){
        order = prior.order.slice();
      } else {
        order = shuffled(q.items.map(function(_, i){ return i; }));
        var tries = 0;
        while(order.join() === q.answer.join() && tries++ < 8) order = shuffled(order);
      }

      function listHtml(state){
        return order.map(function(itemIdx, pos){
          var cls = '';
          if(state) cls = itemIdx === q.answer[pos] ? ' class="ok"' : ' class="no"';
          return '<li' + cls + ' data-pos="' + pos + '">' +
            '<span class="rank">' + (pos + 1) + '</span>' +
            '<span class="txt">' + esc(q.items[itemIdx]) + '</span>' +
            (state ? '' : '<span class="mv">' +
              '<button type="button" data-mv="up" data-pos="' + pos + '" aria-label="Move up"' + (pos === 0 ? ' disabled' : '') + '>&#9650;</button>' +
              '<button type="button" data-mv="down" data-pos="' + pos + '" aria-label="Move down"' + (pos === order.length - 1 ? ' disabled' : '') + '>&#9660;</button>' +
            '</span>') +
          '</li>';
        }).join('');
      }

      function rewire(submit){
        cardEl.querySelector('#orderList').innerHTML = listHtml(false);
        cardEl.querySelectorAll('[data-mv]').forEach(function(b){
          b.addEventListener('click', function(){
            var pos = parseInt(b.getAttribute('data-pos'), 10);
            var to = b.getAttribute('data-mv') === 'up' ? pos - 1 : pos + 1;
            if(to < 0 || to >= order.length) return;
            var tmp = order[pos]; order[pos] = order[to]; order[to] = tmp;
            rewire(submit);
          });
        });
      }

      return {
        html: '<ul class="order-list" id="orderList"></ul>' +
              '<div class="actions" style="justify-content:flex-start;"><button class="btn-press" id="checkBtn">Check answer</button></div>',
        attach: function(submit){
          rewire(submit);
          cardEl.querySelector('#checkBtn').addEventListener('click', function(){ submit({ order: order.slice() }); });
        },
        lock: function(){
          cardEl.querySelector('#checkBtn').remove();
          cardEl.querySelector('#orderList').innerHTML = listHtml(true);
          // Then show the correct ordering underneath, spelled out.
          cardEl.querySelector('#orderList').insertAdjacentHTML('afterend',
            '<div class="multi-note">Correct order: ' +
            esc(q.answer.map(function(i){ return q.items[i]; }).join('  ›  ')) + '</div>');
        }
      };
    }

    /* `prior` is the student's stored response, passed only when replaying an
       answered card so the renderer can rebuild the state they left behind. */
    function rendererFor(q, prior){
      switch(q.kind){
        case 'click-atom':  return renderClickAtom(q);
        case 'multi-click': return renderMultiClick(q);
        case 'arrow':       return renderArrow(q);
        case 'draw':        return renderDraw(q, prior);
        case 'order':       return renderOrder(q, prior);
        default:            return renderMcq(q);
      }
    }

    var KIND_LABEL = {
      'click-atom':'Identify on the molecule', 'multi-click':'Identify all that apply',
      'arrow':'Push the arrow', 'draw':'Draw the mechanism', 'order':'Rank these',
      'predict':'Predict the product', 'mechanism':'Choose the mechanism',
      'mcq':'', 'tf':'True or false'
    };


    function updateProgress(){
      var p = config.progress(S);
      if(els.progFill) els.progFill.style.width = Math.max(0, Math.min(100, p.pct)) + '%';
      if(els.progLabel) els.progLabel.textContent = S.isCheck ? 'Check — apply the fix' : p.label;
    }

    /* ---- card chrome: flag + back/forward -------------------------------

       Both live above the question rather than beside the Continue button,
       for the same reason: they have to be reachable before the question is
       answered as well as after it. You flag a question you are unsure of
       while you are unsure of it, and you go back the moment you realize you
       skipped something — not after committing to another answer. */

    var FLAG_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" aria-hidden="true"><path d="M4 22V4a1 1 0 0 1 1-1h13.5a1 1 0 0 1 .9 1.5l-2.4 4.8a1 1 0 0 0 0 .9l2.4 4.8a1 1 0 0 1-.9 1.5H5"/></svg>';

    function flagBtnHtml(qid){
      if(!flags()) return '';
      var on = flags().has(qid);
      return '<button type="button" class="flag-btn' + (on ? ' active' : '') + '" id="flagBtn"' +
        ' aria-pressed="' + (on ? 'true' : 'false') + '"' +
        ' title="Mark this one to come back to — flags are yours to set and clear, right or wrong">' +
        FLAG_ICON + '<span>' + (on ? 'Flagged' : 'Flag') + '</span></button>';
    }

    /* Which history entry the Back control goes to. Once the live card is
       answered it IS the last history entry, so Back has to skip over it. */
    function backTarget(){
      if(S.viewIndex !== null) return S.viewIndex - 1;
      return S.history.length - (S.liveAnswered ? 2 : 1);
    }

    function navHtml(){
      if(S.viewIndex !== null){
        var n = S.history.length;
        var last = S.viewIndex >= n - 1;
        return '<div class="q-nav q-nav--replay">' +
          '<button type="button" class="q-nav__btn" data-nav="back"' + (S.viewIndex === 0 ? ' disabled' : '') +
            '>&larr; Previous</button>' +
          '<span class="q-nav__label">Looking back &middot; ' + (S.viewIndex + 1) + ' of ' + n + '</span>' +
          '<button type="button" class="q-nav__btn" data-nav="' + (last ? 'live' : 'fwd') + '">' +
            (last ? 'Where you were &rarr;' : 'Next &rarr;') + '</button>' +
        '</div>';
      }
      if(backTarget() < 0) return '';
      return '<div class="q-nav">' +
        '<button type="button" class="q-nav__btn" data-nav="back">&larr; Previous question</button>' +
      '</div>';
    }

    function headHtml(q, isCheck, conceptId){
      var concept = CO.get(conceptId);
      var kindLabel = KIND_LABEL[q.kind] || '';
      return navHtml() +
        '<div class="step-eyebrow">' +
          (isCheck ? 'Check &middot; ' : '') +
          esc(E.topicTitle(q.topic)) + (concept ? ' &middot; ' + esc(concept.title) : '') +
        '</div>' +
        '<div class="q-meta">' + tierChipHtml(q.tier || 2) +
          (kindLabel ? '<span class="tier-label">&middot; ' + esc(kindLabel) + '</span>' : '') +
          flagBtnHtml(q.id) +
        '</div>' +
        '<h2 class="step-title">' + esc(q.prompt || q.q) + '</h2>' +
        (q.sub ? '<p class="q-sub">' + esc(q.sub) + '</p>' : '') +
        (q.reaction ? '<div class="formula">' + esc(q.reaction) + '</div>' : '');
    }

    function wireChrome(qid){
      var fb = cardEl.querySelector('#flagBtn');
      if(fb) fb.addEventListener('click', function(){
        if(!flags()) return;
        var on = flags().toggle(qid);
        fb.classList.toggle('active', on);
        fb.setAttribute('aria-pressed', on ? 'true' : 'false');
        fb.innerHTML = FLAG_ICON + '<span>' + (on ? 'Flagged' : 'Flag') + '</span>';
        if(config.onFlag) config.onFlag(qid, on);
      });
      cardEl.querySelectorAll('[data-nav]').forEach(function(b){
        b.addEventListener('click', function(){
          var dir = b.getAttribute('data-nav');
          if(dir === 'back'){
            var t = backTarget();
            if(t >= 0) showHistory(t);
          } else if(dir === 'fwd' && S.viewIndex !== null && S.viewIndex < S.history.length - 1){
            showHistory(S.viewIndex + 1);
          } else {
            returnToLive();
          }
        });
      });
    }

    /* ---- rendering ------------------------------------------------------ */

    function renderQuestion(q, opts){
      S.current = q;
      S.viewIndex = null;
      S.liveAnswered = false;
      updateProgress();
      // Re-rendering the same unanswered card after a look backwards is not a
      // second serving of it, so the rotation log is left alone.
      if(!(opts && opts.silent)) E.markSeen(q.id);

      // A check question usually lives under a different topic and has its own
      // primary concept. Labelling it with that would hide the fact that this
      // is the same idea coming back, which is the entire point of the check.
      var conceptId = (S.isCheck && S.checkConcept) ? S.checkConcept : E.primaryConcept(q);

      var r = rendererFor(q);
      cardEl.innerHTML = headHtml(q, S.isCheck, conceptId) + r.html + '<div id="afterAnswer"></div>';
      wireChrome(q.id);

      var answered = false;
      r.attach(function(response){
        if(answered) return;
        answered = true;
        handleAnswer(q, response, r, conceptId);
      });
    }

    /* Replay of an answered card — the live one (idx null, so the session's
       own Next button is shown) or an earlier one (idx set, so it gets the
       read-only back/forward chrome instead).

       Nothing here grades or records: the stored diagnosis is re-displayed
       as-is. That is the whole contract of going back. */
    function renderAnswered(entry, idx){
      S.viewIndex = idx;
      var q = entry.q;
      var r = rendererFor(q, entry.response);
      cardEl.innerHTML = headHtml(q, entry.isCheck, entry.conceptId) + r.html + '<div id="afterAnswer"></div>';
      r.attach(function(){});                     // mounts the widgets; no submit path
      r.lock(entry.response, entry.d.correct);
      document.getElementById('afterAnswer').innerHTML = feedbackHtml(q, entry.d, entry.check, idx !== null);
      wireChrome(q.id);
      if(idx === null){
        var btn = cardEl.querySelector('#nextBtn');
        if(btn) btn.addEventListener('click', advance);
      } else if(els.progLabel){
        els.progLabel.textContent = 'Looking back — nothing is being re-scored';
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    function showHistory(idx){
      if(idx < 0 || idx >= S.history.length) return;
      renderAnswered(S.history[idx], idx);
    }

    /* Back to the question the session is actually on: the live card, either
       still open or sitting on its feedback. */
    function returnToLive(){
      S.viewIndex = null;
      if(S.liveAnswered && S.history.length){
        renderAnswered(S.history[S.history.length - 1], null);
        updateProgress();
      } else {
        renderQuestion(S.current, { silent: true });
      }
    }

    function handleAnswer(q, response, renderer, conceptId){
      var d = D.applyResult(q, response);
      renderer.lock(response, d.correct);
      if(window.LevlSound) window.LevlSound.answer(d.correct);

      S.asked++;
      if(!S.isCheck) S.index++;
      if(d.correct) S.correct++;
      var cid = E.primaryConcept(q);
      S.conceptsTouched[cid] = true;
      if(d.conceptId) S.conceptsTouched[d.conceptId] = true;
      S.askedIds.push(q.id);
      S.recentTopics.unshift(q.topic); S.recentTopics = S.recentTopics.slice(0, 4);
      S.recentConcepts.unshift(cid);   S.recentConcepts = S.recentConcepts.slice(0, 4);
      S.recentKinds.unshift(q.kind);   S.recentKinds = S.recentKinds.slice(0, 4);

      if(config.onAnswer) config.onAnswer(q, d, S);

      // Queue the "now apply the correction" question. Only after a real miss,
      // and never after a check question — otherwise a bad run turns into an
      // infinite corridor of remediation.
      var check = null;
      if(!d.correct && !S.isCheck && config.checkFor){
        check = config.checkFor(d, q, S);
        S.pendingCheck = check;
        S.checkConcept = check ? d.conceptId : null;
      }

      // Everything needed to redraw this card later, exactly as it stands now.
      S.history.push({
        q: q, response: response, d: d, check: check,
        isCheck: S.isCheck,
        conceptId: conceptId !== undefined ? conceptId : cid
      });
      S.liveAnswered = true;

      document.getElementById('afterAnswer').innerHTML = feedbackHtml(q, d, check, false);
      /* The panel above is written into a card the runner replaces between
         questions, so nothing in it is announced on its own. Send the verdict
         and the reason to the site's live region — the diagnosis is the part
         worth hearing on a miss, since it names what actually went wrong. */
      if(window.LevlAnnounce){
        window.LevlAnnounce.answer(d.correct, d.correct ? d.why : (d.diagnosis || d.why));
      }
      var btn = cardEl.querySelector('#nextBtn');
      if(btn) btn.addEventListener('click', advance);
    }

    function feedbackHtml(q, d, check, replay){
      var html = '';

      if(d.correct){
        html += '<div class="diag good"><div class="k">Correct</div>' +
          '<p class="msg">' + esc(d.why) + '</p></div>';
      } else {
        html += '<div class="diag"><div class="k">' +
          (d.precise ? 'Here is what went wrong' : 'Not quite') + '</div>' +
          (d.whatYouDid ? '<div class="did">' + esc(d.whatYouDid) + '</div>' : '') +
          '<p class="msg">' + esc(d.diagnosis) + '</p>' +
          (d.why ? '<p class="msg">' + esc(d.why) + '</p>' : '') +
        '</div>';

        // The micro-lesson on the concept the mistake revealed, plus a route to
        // the full lesson if they want more than three sentences.
        if(d.concept){
          html += '<div class="teach-box">' +
            '<div class="k">The concept behind it</div>' +
            '<h3>' + esc(d.concept.title) + '</h3>' +
            '<p>' + esc(d.teach) + '</p>';
          var links = [];
          if(d.lessonTopic) links.push('<a href="' + d.lessonTopic.href + '">Full lesson: ' + esc(d.lessonTopic.title) + '</a>');
          // The written version of the same topic, in the textbook. (Both
          // hosts of this runner — practice.html and review.html — sit at the
          // ochem root, so learn.html is a sibling.)
          if(d.lessonTopic) links.push('<a href="learn.html#' + d.lessonTopic.id + '">Read the section</a>');
          if(links.length) html += '<div class="links">' + links.join('') + '</div>';
          if(d.prereqs && d.prereqs.length){
            html += '<div class="prereq-warn"><b>Worth checking first:</b> this builds on ' +
              esc(d.prereqs.map(function(p){ return CO.phrase(p.id); }).join(' and ')) +
              ', and you\'re at ' + pct(d.prereqs[0].strength) + '% there. Drilling this concept will keep stalling until that is solid.</div>';
          }
          html += '</div>';
        }
      }

      // What this answer did to the mastery profile — the engine's reasoning,
      // shown rather than hidden.
      if(d.moved && d.moved.length){
        html += '<div class="delta-row">' + d.moved.map(function(m){
          var c = CO.get(m.id);
          var up = m.before === null || m.after >= m.before;
          var arrow = m.before === null
            ? '→ ' + pct(m.after) + '% (first look)'
            : pct(m.before) + '% → ' + pct(m.after) + '%';
          return '<span class="delta-chip ' + (up ? 'up' : 'down') + '">' +
            esc(c ? c.title : m.id) + ' ' + esc(arrow) + '</span>';
        }).join('') + '</div>';
      }

      if(replay){
        // Read-only: the answer stands as given, and the only way on is back
        // to the live question.
        html += '<div class="replay-note">Already answered — this is a replay, so nothing here is being re-scored.</div>' +
          '<div class="actions"><button class="btn-press alt" data-nav="live">Back to where you were</button></div>';
        return html;
      }

      var label = check ? 'Try a similar one'
                : (config.nextLabel ? config.nextLabel(S) : 'Next question');
      html += '<div class="actions"><button class="btn-press" id="nextBtn">' + esc(label) + '</button></div>';
      return html;
    }

    function advance(){
      S.viewIndex = null;
      // A queued remediation check jumps the line — the whole point is that it
      // arrives immediately after the teaching, while the correction is fresh.
      if(S.pendingCheck){
        var cq = S.pendingCheck;
        S.pendingCheck = null;
        S.isCheck = true;
        renderQuestion(cq);
        return;
      }
      S.isCheck = false;
      S.checkConcept = null;
      var q = config.next(S);
      if(!q){ finish(); return; }
      renderQuestion(q);
    }

    function finish(){ config.onFinish(S); }

    function start(opts){
      opts = opts || {};
      S = {
        index: 0,            // main questions answered (checks don't count)
        correct: 0,
        asked: 0,            // including remediation checks
        askedIds: [],
        recentTopics: [], recentConcepts: [], recentKinds: [],
        conceptsTouched: {},
        pendingCheck: null,  // a remediation question queued after a miss
        checkConcept: null,  // the concept that check is re-testing
        current: null,
        isCheck: false,
        history: [],         // every answered card, in order, replayable
        viewIndex: null,     // which history entry is on screen, null = live
        liveAnswered: false, // has the live card been answered yet
        meta: opts.meta || {}
      };
      if(els.modeLabel) els.modeLabel.textContent = opts.title || '';
      advance();
      return S;
    }

    return { start: start, state: function(){ return S; }, finish: finish };
  }

  window.OchemSessionRunner = OchemSessionRunner;
})();
