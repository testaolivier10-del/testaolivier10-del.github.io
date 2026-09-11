/* The canvas half of the builder: somewhere to put a molecule you made up.

   mol-builder.js decides what a structure IS. This decides how you make one,
   and the whole design question is how few gestures it can take — a student
   who wanted to look at 2-bromobutane and had to place eight atoms and seven
   bonds by hand has already given up and gone back to the picture in the book.

   So there are three doors and they are all the same door:
     type it     'CH3CH2OH', '(CH3)3CBr', 'acetone', 'benzene'
     find it     the couple of hundred structures already in molecules.js
     draw it     click to place, click two atoms to bond them

   Typing is the fast path and the one most people will use. Drawing is the
   one that matters, because it is the only way to build something that is not
   already in a list — and because a structure you assembled wrong, and were
   told about, teaches more than one you selected correctly.

   The checker runs on every edit and never blocks anything. You can draw a
   carbon with five bonds; you just cannot do it without being told what you
   have made. That is the difference between a tool that grades and a tool
   that is honest, and only the second one is worth opening when you are
   already confused. */
(function(){
  var B = window.OchemBuilder;
  var C = window.OchemChem;
  if(!B || !C) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  var PALETTE = [
    { el:'C',  key:'c' }, { el:'N',  key:'n' }, { el:'O',  key:'o' },
    { el:'H',  key:'h' }, { el:'S',  key:'s' }, { el:'P',  key:'p' },
    { el:'F',  key:'f' }, { el:'Cl', key:'l' }, { el:'Br', key:'b' },
    { el:'I',  key:'i' }
  ];

  var QUICK = ['CH3CH2OH', '(CH3)3CBr', 'CH3COCH3', 'CH3COOH', 'benzene', 'cyclohexane'];

  function mount(container, cfg){
    cfg = cfg || {};
    var st = cfg.structure ? cfg.structure : B.blank();
    var el = 'C';
    var selected = null;
    var undoStack = [];
    var report = null;

    container.innerHTML =
      '<div class="mb">' +
        '<div class="mb__type">' +
          '<label class="mb__label" for="mbText">Type a formula or a name</label>' +
          '<div class="mb__typerow">' +
            '<input type="text" id="mbText" class="mb__input" autocomplete="off" spellcheck="false" ' +
              'placeholder="CH3CH2OH, (CH3)3CBr, acetone, benzene…">' +
            '<button type="button" class="btn-press mb__build" id="mbBuild">Build</button>' +
          '</div>' +
          '<div class="mb__quick" id="mbQuick">' +
            '<span class="tmuted">try:</span> ' +
            QUICK.map(function(q){
              return '<button type="button" class="tchip tchip--mini" data-q="' + esc(q) + '">' + esc(q) + '</button>';
            }).join('') +
          '</div>' +
          '<div class="mb__found" id="mbFound" hidden></div>' +
        '</div>' +

        '<div class="mb__canvaswrap">' +
          '<svg class="mb__canvas" id="mbCanvas" viewBox="0 0 320 170" role="application" ' +
            'aria-label="Molecule canvas. Click to place an atom; click two atoms to bond them."></svg>' +
          '<div class="mb__hint" id="mbHint"></div>' +
        '</div>' +

        '<div class="mb__tools">' +
          '<div class="mb__pal" id="mbPal" role="group" aria-label="Element">' +
            PALETTE.map(function(p){
              return '<button type="button" class="mb__el" data-el="' + p.el + '" ' +
                'title="' + esc(p.el) + ' (' + p.key + ')">' + esc(p.el) + '</button>';
            }).join('') +
          '</div>' +
          '<div class="mb__acts">' +
            '<button type="button" class="tchip" id="mbMinus" title="Make the selected atom more negative">−</button>' +
            '<button type="button" class="tchip" id="mbPlus" title="Make the selected atom more positive">+</button>' +
            '<button type="button" class="tchip" id="mbDel" title="Delete the selected atom (Delete)">Delete atom</button>' +
            '<button type="button" class="tchip" id="mbUndo" title="Undo (Ctrl+Z)">Undo</button>' +
            '<button type="button" class="tchip tchip--ghost" id="mbClear">Clear</button>' +
          '</div>' +
        '</div>' +

        '<div class="mb__status" id="mbStatus" aria-live="polite"></div>' +
      '</div>';

    var svg    = container.querySelector('#mbCanvas');
    var input  = container.querySelector('#mbText');
    var found  = container.querySelector('#mbFound');
    var status = container.querySelector('#mbStatus');
    var hint   = container.querySelector('#mbHint');

    /* ---- Drawing --------------------------------------------------------

       Its own renderer rather than the one in molecules.js, because a builder
       needs things a reader does not: an empty canvas that is itself a click
       target, bonds you can hit, and every atom showing the hydrogens it has
       been given so that "where did that H come from" is never a question. */
    function draw(){
      var atoms = st.atoms;
      var keys = Object.keys(atoms);
      var out = '<rect class="mb__bg" x="0" y="0" width="320" height="170"/>';

      st.bonds.forEach(function(b, i){
        if(!(b.order > 0)) return;
        var A = atoms[b.a], Z = atoms[b.b];
        if(!A || !Z) return;
        var dx = Z.x - A.x, dy = Z.y - A.y;
        var l = Math.sqrt(dx*dx + dy*dy) || 1;
        var ux = dx/l, uy = dy/l;
        // Stop the line at the atom's edge so the label is never crossed out.
        var x1 = A.x + ux * (A.r + 2), y1 = A.y + uy * (A.r + 2);
        var x2 = Z.x - ux * (Z.r + 2), y2 = Z.y - uy * (Z.r + 2);
        var nx = -uy, ny = ux;
        var offs = b.order === 2 ? [-3, 3] : (b.order === 3 ? [-5, 0, 5] : [0]);

        out += '<g class="mb__bond" data-bond="' + i + '" tabindex="0" role="button" ' +
               'aria-label="bond, order ' + b.order + '">' +
               '<line class="mb__bondhit" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
               offs.map(function(o){
                 return '<line class="mb__bondline" x1="' + (x1 + nx*o).toFixed(1) + '" y1="' + (y1 + ny*o).toFixed(1) +
                        '" x2="' + (x2 + nx*o).toFixed(1) + '" y2="' + (y2 + ny*o).toFixed(1) + '"/>';
               }).join('') +
               '</g>';
      });

      keys.forEach(function(k){
        var a = atoms[k];
        var bad = report && report.problems.some(function(p){ return p.at === k && p.level === 'error'; });
        var warn = report && report.problems.some(function(p){ return p.at === k && p.level === 'warn'; });
        var h = a.hImplicit || 0;
        // Real subscripts, because CH3 written flat is what a student is told
        // not to do and the tool should not be the thing doing it.
        var label = a.el + (h ? 'H' + (h > 1 ? C.sub(h) : '') : '');
        var q = a.charge || 0;

        out += '<g class="mb__atom' + (k === selected ? ' is-sel' : '') +
               (bad ? ' is-bad' : (warn ? ' is-warn' : '')) +
               '" data-atom="' + esc(k) + '" tabindex="0" role="button" aria-label="' + esc(label) + '">' +
          '<circle class="mb__atomdisc" cx="' + a.x + '" cy="' + a.y + '" r="' + a.r + '"/>' +
          '<text class="mb__atomtext" x="' + a.x + '" y="' + (a.y + 5) + '" text-anchor="middle">' + esc(label) + '</text>';

        if(q) out += '<text class="mb__charge" x="' + (a.x + a.r - 1) + '" y="' + (a.y - a.r + 7) + '">' +
                     (q > 0 ? '+' : '−') + (Math.abs(q) > 1 ? Math.abs(q) : '') + '</text>';

        // Lone pairs, drawn where there is room rather than in one fixed spot.
        for(var p=0; p<(a.lp || 0); p++){
          var ang = -Math.PI/2 + p * Math.PI/2;
          var cx = a.x + Math.cos(ang) * (a.r + 6), cy = a.y + Math.sin(ang) * (a.r + 6);
          var ox = -Math.sin(ang) * 3, oy = Math.cos(ang) * 3;
          out += '<circle class="mb__lp" cx="' + (cx+ox).toFixed(1) + '" cy="' + (cy+oy).toFixed(1) + '" r="1.7"/>' +
                 '<circle class="mb__lp" cx="' + (cx-ox).toFixed(1) + '" cy="' + (cy-oy).toFixed(1) + '" r="1.7"/>';
        }
        out += '</g>';
      });

      if(!keys.length){
        out += '<text class="mb__blank" x="160" y="88" text-anchor="middle">Click anywhere to place your first atom</text>';
      }

      svg.innerHTML = out;
      bindCanvas();
    }

    /* ---- Editing --------------------------------------------------------

       Every edit goes through here so that three things are impossible to
       forget: pushing undo, dropping the hydrogen counts that came from typed
       text (once you edit the drawing, the drawing is the statement), and
       re-running the checker. */
    function edit(fn){
      undoStack.push(JSON.stringify({ atoms: st.atoms, bonds: st.bonds }));
      if(undoStack.length > 60) undoStack.shift();
      fn();
      Object.keys(st.atoms).forEach(function(k){ delete st.atoms[k].hFixed; });
      settle();
    }

    function settle(){
      B.normalize(st);
      report = B.check(st);
      draw();
      renderStatus();
      if(cfg.onChange) cfg.onChange(st, report);
    }

    function nextKey(){
      var n = 1;
      while(st.atoms['a' + n]) n++;
      return 'a' + n;
    }

    function addAtom(x, y, bondTo){
      var k = nextKey();
      st.atoms[k] = {
        el: el, label: el, group:false,
        x: Math.max(24, Math.min(296, Math.round(x))),
        y: Math.max(22, Math.min(148, Math.round(y))),
        r: el === 'H' ? 12 : 18,
        lp:0, charge:0, hImplicit:0
      };
      if(bondTo) st.bonds.push({ a:bondTo, b:k, order:1 });
      return k;
    }

    function removeAtom(k){
      delete st.atoms[k];
      st.bonds = st.bonds.filter(function(b){ return b.a !== k && b.b !== k; });
      if(selected === k) selected = null;
    }

    function toggleBond(a, b){
      var existing = C.findBond(st, a, b);
      if(!existing){ st.bonds.push({ a:a, b:b, order:1 }); return; }
      existing.order = existing.order >= 3 ? 0 : existing.order + 1;
      if(existing.order === 0){
        st.bonds = st.bonds.filter(function(x){ return x !== existing; });
      }
    }

    /* ---- Canvas events --------------------------------------------------- */

    function svgPoint(e){
      var box = svg.getBoundingClientRect();
      return {
        x: (e.clientX - box.left) / box.width * 320,
        y: (e.clientY - box.top) / box.height * 170
      };
    }

    function bindCanvas(){
      svg.querySelectorAll('.mb__atom').forEach(function(g){
        var k = g.getAttribute('data-atom');
        function hit(e){
          e.stopPropagation();
          if(selected === null || selected === k){
            selected = (selected === k) ? null : k;
            draw(); renderStatus();
            return;
          }
          edit(function(){ toggleBond(selected, k); });
          selected = k;
          draw();
        }
        g.addEventListener('click', hit);
        g.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); hit(e); }
        });
      });

      svg.querySelectorAll('.mb__bond').forEach(function(g){
        var i = parseInt(g.getAttribute('data-bond'), 10);
        function hit(e){
          e.stopPropagation();
          var b = st.bonds[i];
          if(!b) return;
          edit(function(){
            b.order = b.order >= 3 ? 1 : b.order + 1;
          });
        }
        g.addEventListener('click', hit);
        g.addEventListener('keydown', function(e){
          if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); hit(e); }
        });
      });
    }

    svg.addEventListener('click', function(e){
      var p = svgPoint(e);
      var anchor = selected;
      edit(function(){
        var k = addAtom(p.x, p.y, anchor);
        selected = k;
      });
    });

    /* ---- Status ----------------------------------------------------------

       The panel is an aria-live region, which is the whole reason it is one
       block of text that gets rewritten rather than a set of fields that
       change independently: a screen reader should hear "C2H6O, neutral,
       nothing wrong" as one statement, not four unrelated updates. */
    function renderStatus(){
      if(!report){ status.innerHTML = ''; return; }

      if(report.empty){
        status.innerHTML = '<div class="tempty">Nothing built yet. Type a formula above, or click the canvas.</div>';
        hint.textContent = '';
        return;
      }

      var errs  = report.problems.filter(function(p){ return p.level === 'error'; });
      var warns = report.problems.filter(function(p){ return p.level === 'warn'; });
      var notes = report.problems.filter(function(p){ return p.level === 'note'; });

      var head = '<div class="mb__stat">' +
        '<div><div class="k">Formula</div><div class="v">' + esc(report.formula || '—') + '</div></div>' +
        '<div><div class="k">Charge</div><div class="v">' +
          (report.charge === 0 ? 'neutral' : (report.charge > 0 ? '+' + report.charge : report.charge)) + '</div></div>' +
        '<div><div class="k">Pieces</div><div class="v">' + (report.fragments || 1) + '</div></div>' +
        '<div><div class="k">Valid</div><div class="v ' + (errs.length ? 'lose' : 'win') + '">' +
          (errs.length ? 'no' : 'yes') + '</div></div>' +
      '</div>';

      var body = '';
      if(errs.length){
        body += errs.map(function(p){
          return '<div class="tnote tnote--bad"><span class="tnote__k">Can’t exist</span>' + esc(p.msg) + '</div>';
        }).join('');
      }
      body += warns.map(function(p){
        return '<div class="tnote tnote--warn"><span class="tnote__k">Check this</span>' + esc(p.msg) + '</div>';
      }).join('');
      body += notes.map(function(p){
        return '<div class="tnote tnote--info"><span class="tnote__k">Note</span>' + esc(p.msg) + '</div>';
      }).join('');

      if(!errs.length && !warns.length && !notes.length){
        body += '<div class="tnote tnote--good"><span class="tnote__k">Fine</span>' +
          'Every atom has a legal number of bonds and the charges add up. The hydrogens shown were filled in for you — ' +
          'that is what an atom of that element wants at that charge.</div>';
      }

      status.innerHTML = head + body;
      hint.textContent = selected
        ? (st.atoms[selected] ? st.atoms[selected].el + ' selected — click another atom to bond, or the canvas to grow the chain' : '')
        : 'Click an atom to select it';
    }

    /* ---- Text entry ------------------------------------------------------ */

    function build(text){
      var r = B.parse(text);
      if(r.error){
        status.innerHTML = '<div class="tnote tnote--bad"><span class="tnote__k">Cannot read that</span>' + esc(r.error) + '</div>';
        return false;
      }
      undoStack.push(JSON.stringify({ atoms: st.atoms, bonds: st.bonds }));
      st.atoms = r.st.atoms;
      st.bonds = r.st.bonds;
      st.name = r.st.name || null;
      st.ring = r.st.ring;
      selected = null;
      settle();
      return true;
    }

    container.querySelector('#mbBuild').addEventListener('click', function(){ build(input.value); });
    input.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); build(input.value); }
    });

    /* Searching the practice library as you type, because "I want the one from
       question 4" is a real request and rebuilding acetyl chloride by hand to
       satisfy it is not a use of anybody's evening. */
    input.addEventListener('input', function(){
      var q = input.value.trim();
      var hits = q.length >= 3 ? B.search(q) : [];
      if(!hits.length){ found.hidden = true; found.innerHTML = ''; return; }
      found.hidden = false;
      found.innerHTML = '<span class="tmuted">in the library:</span> ' + hits.map(function(h){
        return '<button type="button" class="tchip tchip--mini" data-lib="' + esc(h.id) + '">' + esc(h.name) + '</button>';
      }).join('');
      found.querySelectorAll('[data-lib]').forEach(function(b){
        b.addEventListener('click', function(){
          var lib = B.fromLibrary(b.getAttribute('data-lib'));
          if(!lib) return;
          undoStack.push(JSON.stringify({ atoms: st.atoms, bonds: st.bonds }));
          st.atoms = lib.atoms; st.bonds = lib.bonds; st.name = lib.name;
          st.viewBox = lib.viewBox || '0 0 320 170';
          delete st.ring;
          selected = null;
          found.hidden = true;
          input.value = lib.name || '';
          settle();
        });
      });
    });

    container.querySelector('#mbQuick').querySelectorAll('[data-q]').forEach(function(b){
      b.addEventListener('click', function(){
        input.value = b.getAttribute('data-q');
        build(input.value);
      });
    });

    /* ---- Palette and actions --------------------------------------------- */

    function setEl(next){
      el = next;
      container.querySelectorAll('.mb__el').forEach(function(b){
        b.classList.toggle('on', b.getAttribute('data-el') === el);
      });
      // With an atom selected, picking an element retypes it rather than
      // waiting for the next placement — which is what the click means.
      if(selected && st.atoms[selected]){
        edit(function(){
          st.atoms[selected].el = el;
          st.atoms[selected].label = el;
          st.atoms[selected].r = el === 'H' ? 12 : 18;
        });
      }
    }

    container.querySelectorAll('.mb__el').forEach(function(b){
      b.addEventListener('click', function(){ setEl(b.getAttribute('data-el')); });
    });
    setEl('C');

    function bumpCharge(d){
      if(!selected || !st.atoms[selected]) return;
      edit(function(){
        var a = st.atoms[selected];
        a.charge = Math.max(-2, Math.min(2, (a.charge || 0) + d));
      });
    }
    container.querySelector('#mbMinus').addEventListener('click', function(){ bumpCharge(-1); });
    container.querySelector('#mbPlus').addEventListener('click', function(){ bumpCharge(1); });
    container.querySelector('#mbDel').addEventListener('click', function(){
      if(!selected) return;
      var k = selected;
      edit(function(){ removeAtom(k); });
    });
    container.querySelector('#mbUndo').addEventListener('click', undo);
    container.querySelector('#mbClear').addEventListener('click', function(){
      edit(function(){ st.atoms = {}; st.bonds = []; selected = null; delete st.ring; });
      input.value = '';
    });

    function undo(){
      var prev = undoStack.pop();
      if(!prev) return;
      var snap = JSON.parse(prev);
      st.atoms = snap.atoms; st.bonds = snap.bonds;
      selected = null;
      settle();
    }

    /* Hotkeys, because reaching for the palette between every atom is what
       makes drawing feel slower than typing. */
    container.addEventListener('keydown', function(e){
      if(e.target === input) return;
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); undo(); return; }
      if(e.key === 'Escape'){ selected = null; draw(); renderStatus(); return; }
      if(e.key === 'Delete' || e.key === 'Backspace'){
        if(selected){ e.preventDefault(); var k = selected; edit(function(){ removeAtom(k); }); }
        return;
      }
      if(e.key === '+' || e.key === '='){ e.preventDefault(); bumpCharge(1); return; }
      if(e.key === '-' || e.key === '_'){ e.preventDefault(); bumpCharge(-1); return; }
      var hit = PALETTE.filter(function(p){ return p.key === e.key.toLowerCase(); })[0];
      if(hit){ e.preventDefault(); setEl(hit.el); }
    });

    settle();

    return {
      structure: function(){ return st; },
      report: function(){ return report; },
      load: function(next){
        undoStack.push(JSON.stringify({ atoms: st.atoms, bonds: st.bonds }));
        st.atoms = next.atoms; st.bonds = next.bonds;
        st.name = next.name || null; st.ring = next.ring;
        selected = null;
        settle();
      },
      build: build,
      clear: function(){ st.atoms = {}; st.bonds = []; selected = null; settle(); }
    };
  }

  window.OchemBuilderUI = { mount: mount, PALETTE: PALETTE };
})();
