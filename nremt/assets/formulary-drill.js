/* Formulary drill.
   ------------------------------------------------------------------
   The questions are NOT stored here. They live in questions.json under
   topic "Pharmacology", which means they are covered by everything that
   already guards the bank: the answer-tell checks, the unique-id check, the
   count check, the duplicate-options check. A second copy on this page would
   be a second thing to keep true, and the first one to drift.

   It also means these questions appear in Practice, in search, and in the
   tutor bank without being written twice. */
(function(){
  var mount = document.getElementById('drillBox');
  if(!mount) return;

  var ROUNDS = 8;
  var pool = [], order = [], at = 0, right = 0;

  function shuffle(a){
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }
  function esc(s){
    return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
  }

  function start(){
    order = shuffle(pool.slice()).slice(0, Math.min(ROUNDS, pool.length));
    at = 0; right = 0;
    render();
  }

  function render(){
    if(at >= order.length){
      mount.innerHTML =
        '<h2>Drill</h2>' +
        '<p class="section-sub">' + right + ' of ' + order.length + ' correct.</p>' +
        '<button type="button" class="btn-press" id="drillAgain">Go again</button> ' +
        '<a class="link-quiet" href="practice.html">Practice the whole bank &rarr;</a>';
      document.getElementById('drillAgain').addEventListener('click', start);
      return;
    }
    var q = order[at];
    // The stored order is the answer key, so shuffle a copy and track where it went.
    var pairs = q.options.map(function(o,i){ return { text:o, key:i === q.correct }; });
    shuffle(pairs);
    mount.innerHTML =
      '<h2>Drill</h2>' +
      '<p class="section-sub">Question ' + (at+1) + ' of ' + order.length + ' &middot; drawn from the same bank as Practice</p>' +
      '<div class="drug" style="max-width:720px">' +
        '<p style="font-weight:800;margin:0 0 14px;font-size:15.5px">' + esc(q.q) + '</p>' +
        '<div id="drillOpts"></div>' +
        '<div id="drillFb" style="margin-top:14px"></div>' +
      '</div>';
    var box = document.getElementById('drillOpts');
    pairs.forEach(function(p){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-press alt';
      b.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:8px;font-size:14px;line-height:1.45;';
      b.textContent = p.text;
      b.addEventListener('click', function(){ answer(p.key, q); });
      box.appendChild(b);
    });
  }

  function answer(correct, q){
    if(correct) right++;
    Array.prototype.forEach.call(document.querySelectorAll('#drillOpts button'), function(b){ b.disabled = true; });
    var fb = document.getElementById('drillFb');
    fb.innerHTML =
      '<p style="font-weight:800;margin:0 0 6px;color:' + (correct ? 'var(--good)' : 'var(--coral)') + '">' +
        (correct ? 'Correct.' : 'Not quite.') + '</p>' +
      '<p style="font-size:13.5px;line-height:1.6;margin:0 0 12px;color:var(--muted)">' + esc(q.explain || '') + '</p>' +
      '<button type="button" class="btn-press" id="drillNext">Next</button>';
    document.getElementById('drillNext').addEventListener('click', function(){ at++; render(); });
  }

  mount.innerHTML = '<h2>Drill</h2><p class="section-sub">Loading the question bank&hellip;</p>';
  fetch('assets/questions.json')
    .then(function(r){ return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
    .then(function(all){
      pool = all.filter(function(x){ return x.topic === 'Pharmacology' && Array.isArray(x.options); });
      if(!pool.length){
        mount.innerHTML = '<h2>Drill</h2><p class="section-sub">No pharmacology questions found in the bank.</p>';
        return;
      }
      start();
    })
    .catch(function(){
      mount.innerHTML = '<h2>Drill</h2><p class="section-sub">The question bank could not be loaded. ' +
        'The reference above does not need it &mdash; <a href="practice.html">Practice</a> has the full bank.</p>';
    });
})();
