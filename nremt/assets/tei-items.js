/* The NREMT exam's technology-enhanced items, for the question runner
   (nremt/practice-engine.js) on practice, review and exams.

     'dnd'    drag and drop: sort each option into one of q.bins.
              q.correct[i] is the bin for option i.
     'table'  options table: one choice per row; the rows are q.options,
              the columns q.cols. q.correct[i] is the column for row i.
     'order'  build list: q.correct is the option order (the engine's own type;
              this file adds dragging to its move-up and move-down buttons).

   An answer to dnd or table is an array as long as q.options, each entry a
   bin or column index or null (not placed yet). Scored all or nothing, like
   the exam, but marked row by row when checked and on the results screen.

   Every interaction works three ways: drag (mouse, or touch on the grip so the
   page still scrolls), tap an item then tap a group, and the keyboard (Enter
   picks an item, then a group button or the number keys place it; table rows
   are native radio groups). The pure helpers at the top are tested in
   scripts/test/nremt-tei.test.mjs. */
(function (global) {
  'use strict';

  function isTei(q) { return !!q && (q.type === 'dnd' || q.type === 'table'); }
  function groups(q) { return q.type === 'dnd' ? q.bins : q.cols; }
  function blank(q) { return q.options.map(function () { return null; }); }
  function placed(v) { return v !== null && v !== undefined; }
  function answered(q, ans) {
    return Array.isArray(ans) && ans.length === q.options.length && ans.every(placed);
  }
  function rowsRight(q, ans) {
    return q.options.map(function (_, i) { return Array.isArray(ans) && ans[i] === q.correct[i]; });
  }
  function correct(q, ans) { return answered(q, ans) && rowsRight(q, ans).every(Boolean); }
  function rightCount(q, ans) { return rowsRight(q, ans).filter(Boolean).length; }

  /* Reorders the rows (options) the way the engine shuffles every item; the
     groups keep their order, because it carries meaning (red before yellow). */
  function reorder(q, order) {
    var c = q.correct;
    q.options = order.map(function (i) { return q.options[i]; });
    q.correct = order.map(function (i) { return c[i]; });
  }

  function byGroup(q, key) {
    return groups(q).map(function (g, b) {
      var xs = q.options.filter(function (_, i) { return key[i] === b; });
      return g + ': ' + (xs.length ? xs.join('; ') : 'none');
    }).join('. ');
  }
  function userText(q, ans) {
    if (!Array.isArray(ans) || !ans.some(placed)) return null;
    if (q.type === 'dnd') return byGroup(q, ans) + (answered(q, ans) ? '' : '. Not placed: ' + q.options.filter(function (_, i) { return !placed(ans[i]); }).join('; '));
    return q.options.map(function (o, i) { return o + ': ' + (placed(ans[i]) ? q.cols[ans[i]] : 'no choice'); }).join('. ');
  }
  function keyText(q) {
    if (q.type === 'dnd') return byGroup(q, q.correct);
    return q.options.map(function (o, i) { return o + ': ' + q.cols[q.correct[i]]; }).join('. ');
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* The row-by-row breakdown for the results list: each row, where it was put,
     and where it belongs. Also used for build-list items. */
  function reviewHtml(q, ans) {
    var rows;
    if (q.type === 'order') {
      var mine = Array.isArray(ans) ? ans : null;
      rows = q.correct.map(function (optIdx, pos) {
        var got = mine ? mine[pos] : null;
        var ok = got === optIdx;
        return { ok: ok, text: (pos + 1) + '. ' + q.options[optIdx],
          where: ok ? 'in place' : got === null || got === undefined ? 'not answered' : 'you had: ' + q.options[got] };
      });
    } else {
      var g = groups(q);
      rows = q.options.map(function (o, i) {
        var got = Array.isArray(ans) ? ans[i] : null;
        var ok = got === q.correct[i];
        return { ok: ok, text: o,
          where: ok ? g[q.correct[i]] : (placed(got) ? 'you: ' + g[got] + ' · ' : 'not placed · ') + 'answer: ' + g[q.correct[i]] };
      });
    }
    return '<ul class="tei-review">' + rows.map(function (r) {
      return '<li class="' + (r.ok ? 'is-ok' : 'is-bad') + '"><span class="tr-mark" aria-hidden="true">' + (r.ok ? '✓' : '✗') + '</span>' +
        '<span class="tr-text">' + esc(r.text) + '</span><span class="tr-where"><span class="sr-only">' + (r.ok ? 'Right. ' : 'Wrong. ') + '</span>' + esc(r.where) + '</span></li>';
    }).join('') + '</ul>';
  }

  /* ---- the live interactions (browser only) ---------------------------- */

  var refocus = null;          // a selector to focus after the engine re-renders
  var selected = null;         // dnd: { key, i } the item picked by tap or Enter
  var suppressClick = false;   // a drag ends with a click; ignore that one
  var uid = 0;

  function say(text) { if (global.LevlAnnounce) global.LevlAnnounce.say(text); }
  function reduced() { return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function finish(host) {
    if (!refocus) return;
    var el = host.querySelector(refocus);
    refocus = null;
    if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
  }
  function keyOf(q) { return q.q.slice(0, 60); }

  /* A small pointer drag used by both dnd and order. onMove(x, y) and
     onDrop(x, y) are called once the pointer has moved past a few pixels;
     a pointer that never moves is left to become a click. */
  function dragger(el, opts) {
    el.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || opts.disabled()) return;
      if (e.target.closest('button[data-dir]')) return;
      var onGrip = !!e.target.closest('.tei-grip');
      if (e.pointerType !== 'mouse' && !onGrip) return;   // touch on the text scrolls the page
      var sx = e.clientX, sy = e.clientY, live = false, ghost = null, pid = e.pointerId;
      if (onGrip) e.preventDefault();
      function move(ev) {
        if (ev.pointerId !== pid) return;
        if (!live) {
          if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
          live = true;
          ghost = opts.start(sx, sy);
        }
        ev.preventDefault();
        if (ghost) { ghost.style.left = (ev.clientX - ghost._dx) + 'px'; ghost.style.top = (ev.clientY - ghost._dy) + 'px'; }
        // Near the top or bottom edge, scroll so a phone can reach every group.
        var edge = 56, vh = global.innerHeight;
        if (ev.clientY > vh - edge) global.scrollBy(0, 12); else if (ev.clientY < edge) global.scrollBy(0, -12);
        opts.move(ev.clientX, ev.clientY);
      }
      function up(ev) {
        if (ev.pointerId !== pid) return;
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
        if (!live) return;
        suppressClick = true;
        setTimeout(function () { suppressClick = false; }, 0);
        opts.drop(ev.type === 'pointercancel' ? null : ev.clientX, ev.clientY);
      }
      // On the document, not the element: a build-list row is moved in the
      // DOM while it is dragged, which releases any pointer capture it held.
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
  }
  function makeGhost(src, x, y) {
    var r = src.getBoundingClientRect();
    var g = src.cloneNode(true);
    g.removeAttribute('id');
    g.className += ' tei-ghost';
    g.setAttribute('aria-hidden', 'true');
    g.style.width = r.width + 'px';
    g._dx = x - r.left; g._dy = y - r.top;
    g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
    document.body.appendChild(g);
    return g;
  }

  /* ---- drag and drop ---- */
  function renderDnd(host, q, ans, onChange) {
    var a = Array.isArray(ans) && ans.length === q.options.length ? ans.slice() : blank(q);
    var key = keyOf(q);
    if (!selected || selected.key !== key) selected = null;
    var left = a.filter(function (v) { return !placed(v); }).length;
    var chip = function (i) {
      var on = selected && selected.i === i;
      return '<button type="button" class="dnd-chip' + (on ? ' is-picked' : '') + '" data-chip="' + i + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
        ' aria-describedby="dndHelp">' +
        '<span class="tei-grip" aria-hidden="true"></span><span class="dnd-text">' + esc(q.options[i]) + '</span></button>';
    };
    var trayItems = q.options.map(function (_, i) { return i; }).filter(function (i) { return !placed(a[i]); });
    var html = '<p class="tei-hint" id="dndHelp">Drag each item into a group, or tap an item, then its group' +
      (q.bins.length <= 9 ? ' (keys: Enter picks, 1 to ' + q.bins.length + ' places)' : '') + '.</p>' +
      '<div class="dnd-tray" data-bin="-1"><div class="dnd-tray-h"><span>' + (left ? left + ' to sort' : 'All sorted. Tap an item to move it.') + '</span>' +
      (selected && placed(a[selected.i]) ? '<button type="button" class="dnd-unplace" data-bin-btn="-1">Take it out</button>' : '') + '</div>' +
      '<div class="dnd-list">' + trayItems.map(chip).join('') + '</div></div>' +
      '<div class="dnd-bins" style="--bins:' + q.bins.length + '">' + q.bins.map(function (b, k) {
        var inBin = q.options.map(function (_, i) { return i; }).filter(function (i) { return a[i] === k; });
        return '<div class="dnd-bin" data-bin="' + k + '"><button type="button" class="dnd-bin-h" data-bin-btn="' + k + '"' +
          ' aria-label="' + esc(b) + ', ' + inBin.length + ' item' + (inBin.length === 1 ? '' : 's') + (selected ? '. Place the picked item here' : '') + '">' +
          '<span class="dnd-bin-n" aria-hidden="true">' + (k + 1) + '</span><span class="dnd-bin-name">' + esc(b) + '</span>' +
          '<span class="dnd-bin-place" aria-hidden="true">' + (selected ? 'Place here' : '') + '</span></button>' +
          '<div class="dnd-list">' + (inBin.length ? inBin.map(chip).join('') : '<p class="dnd-empty">Drop items here</p>') + '</div></div>';
      }).join('') + '</div>';
    host.innerHTML = '<div class="tei tei-dnd' + (selected ? ' has-pick' : '') + '">' + html + '</div>';
    var root = host.firstChild;

    function put(i, bin, how) {
      var next = a.slice();
      next[i] = bin < 0 ? null : bin;
      selected = null;
      var after = next.filter(function (v) { return !placed(v); }).length;
      say(bin < 0 ? 'Back in the items to sort.' : 'Placed in ' + q.bins[bin] + '. ' + (after ? after + ' left to sort.' : 'All sorted.'));
      // Keep the keyboard moving: on to the next unsorted item, else stay on this one.
      var nextOpen = next.findIndex(function (v) { return !placed(v); });
      refocus = how === 'drag' ? null : nextOpen !== -1 ? '[data-chip="' + nextOpen + '"]' : '[data-chip="' + i + '"]';
      onChange(next);
    }
    root.addEventListener('click', function (e) {
      if (suppressClick || root.classList.contains('is-checked')) return;
      var c = e.target.closest('[data-chip]');
      if (c) {
        var i = +c.getAttribute('data-chip');
        selected = selected && selected.i === i ? null : { key: key, i: i };
        say(selected ? 'Picked: ' + q.options[i] + '. Now choose a group.' : 'Put down.');
        refocus = '[data-chip="' + i + '"]';
        onChange(a);
        return;
      }
      var b = e.target.closest('[data-bin-btn]');
      if (b) {
        if (!selected) { say('Pick an item first, then its group.'); return; }
        put(selected.i, +b.getAttribute('data-bin-btn'));
      }
    });
    root.addEventListener('keydown', function (e) {
      var c = e.target.closest('[data-chip]');
      if (!c || root.classList.contains('is-checked')) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= q.bins.length) { e.preventDefault(); put(+c.getAttribute('data-chip'), n - 1); }
      else if ((e.key === 'Escape' || e.key === '0') && placed(a[+c.getAttribute('data-chip')])) { e.preventDefault(); put(+c.getAttribute('data-chip'), -1); }
      else if (e.key === 'Escape' && selected) { selected = null; refocus = '[data-chip="' + c.getAttribute('data-chip') + '"]'; onChange(a); }
    });
    var target = null;
    function binAt(x, y) {
      var el = document.elementFromPoint(x, y);
      var z = el && el.closest && el.closest('[data-bin]');
      return z && root.contains(z) ? z : null;
    }
    root.querySelectorAll('[data-chip]').forEach(function (c) {
      dragger(c, {
        disabled: function () { return root.classList.contains('is-checked'); },
        start: function (x, y) { c.classList.add('is-dragging'); root.classList.add('is-dragging'); return makeGhost(c, x, y); },
        move: function (x, y) {
          var z = binAt(x, y);
          if (z !== target) { if (target) target.classList.remove('is-over'); target = z; if (z) z.classList.add('is-over'); }
        },
        drop: function (x, y) {
          var z = x === null ? null : binAt(x, y);
          if (target) target.classList.remove('is-over');
          target = null;
          c.classList.remove('is-dragging'); root.classList.remove('is-dragging');
          if (z) put(+c.getAttribute('data-chip'), +z.getAttribute('data-bin'), 'drag');
        },
      });
    });
    finish(host);
  }

  /* ---- options table ---- */
  function renderTable(host, q, ans, onChange) {
    var a = Array.isArray(ans) && ans.length === q.options.length ? ans.slice() : blank(q);
    var id = 'tbl' + (++uid);
    var head = '<div class="tbl-head" aria-hidden="true"><span></span>' + q.cols.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>';
    var rows = q.options.map(function (o, i) {
      return '<div class="tbl-row" role="radiogroup" aria-labelledby="' + id + 'r' + i + '" data-row="' + i + '">' +
        '<p class="tbl-text" id="' + id + 'r' + i + '">' + esc(o) + '</p><div class="tbl-choices">' +
        q.cols.map(function (c, k) {
          return '<label class="tbl-choice' + (a[i] === k ? ' is-on' : '') + '"><input type="radio" name="' + id + 'r' + i + '" value="' + k + '"' +
            (a[i] === k ? ' checked' : '') + ' data-cell="' + i + '-' + k + '"><span class="tbl-dot" aria-hidden="true"></span><span class="tbl-ctext">' + esc(c) + '</span></label>';
        }).join('') + '</div></div>';
    }).join('');
    host.innerHTML = '<div class="tei tei-table" style="--cols:' + q.cols.length + '"><p class="tei-hint">Choose one answer in each row.</p>' + head + rows + '</div>';
    host.firstChild.addEventListener('change', function (e) {
      var inp = e.target;
      if (!inp.matches('input[type="radio"]')) return;
      var row = +inp.closest('[data-row]').getAttribute('data-row');
      var next = a.slice();
      next[row] = +inp.value;
      refocus = '[data-cell="' + row + '-' + inp.value + '"]';
      onChange(next);
    });
    finish(host);
  }

  /* ---- build list: dragging on top of the move buttons ---- */
  function renderOrder(host, q, order, onChange) {
    var list = document.createElement('div');
    list.className = 'order-list tei';
    list.setAttribute('role', 'list');
    order.forEach(function (optIdx, pos) {
      var div = document.createElement('div');
      div.className = 'order-item';
      div.setAttribute('role', 'listitem');
      div.setAttribute('data-opt', optIdx);
      div.innerHTML = '<span class="tei-grip" aria-hidden="true"></span><span class="pos">' + (pos + 1) + '</span><span class="order-text">' + esc(q.options[optIdx]) + '</span>' +
        '<span class="order-btns">' +
        '<button type="button" data-dir="up" aria-label="Move up: ' + esc(q.options[optIdx]) + '"' + (pos === 0 ? ' disabled' : '') + '>&#9650;</button>' +
        '<button type="button" data-dir="down" aria-label="Move down: ' + esc(q.options[optIdx]) + '"' + (pos === order.length - 1 ? ' disabled' : '') + '>&#9660;</button></span>';
      list.appendChild(div);
    });
    host.appendChild(list);
    function moved(next, optIdx, how, dir) {
      var at = next.indexOf(optIdx);
      say('Moved to position ' + (at + 1) + ' of ' + next.length + '.');
      if (how === 'key') {
        var useDir = (dir === 'up' && at === 0) ? 'down' : (dir === 'down' && at === next.length - 1) ? 'up' : dir;
        refocus = '[data-opt="' + optIdx + '"] [data-dir="' + useDir + '"]';
      }
      onChange(next);
    }
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-dir]');
      if (!b || b.disabled) return;
      var optIdx = +b.closest('[data-opt]').getAttribute('data-opt');
      var pos = order.indexOf(optIdx), to = b.getAttribute('data-dir') === 'up' ? pos - 1 : pos + 1;
      var next = order.slice();
      next[pos] = next[to]; next[to] = optIdx;
      moved(next, optIdx, 'key', b.getAttribute('data-dir'));
    });
    list.querySelectorAll('.order-item').forEach(function (item) {
      dragger(item, {
        disabled: function () { return list.classList.contains('is-checked'); },
        start: function () { item.classList.add('is-dragging'); list.classList.add('is-dragging'); return null; },
        move: function (x, y) {
          // The lifted row trades places with a neighbour once the pointer passes its middle.
          var sibs = [].slice.call(list.children).filter(function (s) { return s !== item; });
          var before = null;
          for (var k = 0; k < sibs.length; k++) {
            var r = sibs[k].getBoundingClientRect();
            if (y < r.top + r.height / 2) { before = sibs[k]; break; }
          }
          if (before !== item.nextSibling) {
            var from = item.getBoundingClientRect().top;
            list.insertBefore(item, before);
            if (!reduced()) {
              var d = from - item.getBoundingClientRect().top;
              item.animate && item.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 120 });
            }
          }
        },
        drop: function () {
          item.classList.remove('is-dragging'); list.classList.remove('is-dragging');
          var next = [].map.call(list.children, function (el) { return +el.getAttribute('data-opt'); });
          moved(next, +item.getAttribute('data-opt'), 'drag');
        },
      });
    });
    finish(host);
  }

  /* ---- checked state: freeze and mark row by row ---- */
  function markChecked(host, q, ans) {
    var root = host.querySelector('.tei');
    if (!root) return;
    root.classList.add('is-checked');
    selected = null;
    var ok = rowsRight(q, ans);
    if (q.type === 'dnd') {
      root.querySelectorAll('button').forEach(function (b) {
        if (!b.hasAttribute('data-chip')) { b.disabled = true; return; }
        var i = +b.getAttribute('data-chip');
        b.setAttribute('aria-disabled', 'true');
        b.removeAttribute('aria-pressed');
        b.classList.remove('is-picked');
        b.classList.add(ok[i] ? 'correct' : 'incorrect');
        b.insertAdjacentHTML('beforeend', ok[i] ? '<span class="sr-only"> Right.</span>'
          : '<span class="dnd-key">Belongs in: ' + esc(q.bins[q.correct[i]]) + '</span>');
      });
      var unp = root.querySelector('.dnd-unplace'); if (unp) unp.remove();
      root.querySelectorAll('.dnd-bin-place').forEach(function (s) { s.textContent = ''; });
    } else if (q.type === 'table') {
      root.querySelectorAll('[data-row]').forEach(function (row) {
        var i = +row.getAttribute('data-row');
        row.classList.add(ok[i] ? 'correct' : 'incorrect');
        row.querySelectorAll('input').forEach(function (inp) {
          inp.disabled = true;
          var k = +inp.value;
          if (k === q.correct[i]) inp.parentNode.classList.add('is-key');
          else if (inp.checked) inp.parentNode.classList.add('is-wrong');
        });
        if (!ok[i]) row.insertAdjacentHTML('beforeend', '<p class="tbl-key">Answer: ' + esc(q.cols[q.correct[i]]) + '</p>');
        else row.insertAdjacentHTML('beforeend', '<span class="sr-only">Right.</span>');
      });
    } else if (q.type === 'order') {
      root.classList.add('is-checked');
      root.querySelectorAll('.order-item').forEach(function (el, pos) {
        var good = Array.isArray(ans) && ans[pos] === q.correct[pos];
        el.classList.add(good ? 'correct' : 'incorrect');
        if (!good) el.querySelector('.order-text').insertAdjacentHTML('beforeend', '<span class="order-key">Goes at ' + (q.correct.indexOf(+el.getAttribute('data-opt')) + 1) + '</span>');
      });
    }
  }

  function render(host, q, ans, onChange) {
    if (q.type === 'dnd') renderDnd(host, q, ans, onChange);
    else if (q.type === 'table') renderTable(host, q, ans, onChange);
    else if (q.type === 'order') renderOrder(host, q, ans, onChange);
  }

  global.NremtTei = {
    isTei: isTei, groups: groups, blank: blank, answered: answered, rowsRight: rowsRight,
    correct: correct, rightCount: rightCount, reorder: reorder, userText: userText, keyText: keyText,
    reviewHtml: reviewHtml, render: render, markChecked: markChecked,
  };
})(typeof window !== 'undefined' ? window : globalThis);
