/* A full 118-element periodic table, available as a popup on every Ochem
   page via a fixed floating button. Self-contained (no external data/API
   calls — the site's CSP doesn't allow connect-src beyond 'self') and
   injected purely from JS so no page has to carry the markup itself.

   Data: atomic number (z), symbol, name, group (1-18; null for
   lanthanides/actinides, which are drawn in their own two rows below the
   main table), period (1-7), category (drives the color), Pauling
   electronegativity (en; null where undefined/not well established —
   true for every noble gas but Kr/Xe/Rn, and for most synthetic
   superheavy elements), and an optional `orgo` one-liner on why the
   element actually shows up in organic chemistry. Elements with no
   `orgo` note just get a generic "not common in organic chemistry" line
   in the detail panel — most of the table (transition metals, lanthanides,
   actinides, noble gases) genuinely doesn't come up in an intro course.
*/
(function(){
  var EN = {}; // filled below per-element for readability; merged into ELEMENTS at the end
  var ELEMENTS = [
    { z:1,  s:'H',  n:'Hydrogen',      g:1,  p:1, cat:'nonmetal',       en:2.20, orgo:'The most common atom in organic molecules by count. Forms exactly one bond.' },
    { z:2,  s:'He', n:'Helium',        g:18, p:1, cat:'noble-gas',      en:null },
    { z:3,  s:'Li', n:'Lithium',       g:1,  p:2, cat:'alkali',         en:0.98, orgo:'Used in organolithium reagents (e.g. n-BuLi) — strong bases/nucleophiles.' },
    { z:4,  s:'Be', n:'Beryllium',     g:2,  p:2, cat:'alkaline-earth', en:1.57 },
    { z:5,  s:'B',  n:'Boron',         g:13, p:2, cat:'metalloid',      en:2.04, orgo:'Electron-deficient (only 3 bonds, empty p-orbital) — BF₃/BH₃ are classic Lewis acids/electrophiles.' },
    { z:6,  s:'C',  n:'Carbon',        g:14, p:2, cat:'nonmetal',       en:2.55, orgo:'The backbone of every organic molecule. Forms 4 bonds, can hybridize sp/sp²/sp³.' },
    { z:7,  s:'N',  n:'Nitrogen',      g:15, p:2, cat:'nonmetal',       en:3.04, orgo:'Found in amines/amides. Its lone pair makes amines good nucleophiles and bases.' },
    { z:8,  s:'O',  n:'Oxygen',        g:16, p:2, cat:'nonmetal',       en:3.44, orgo:'In alcohols, ethers, carbonyls, acids. Very electronegative — polarizes every bond it’s in.' },
    { z:9,  s:'F',  n:'Fluorine',      g:17, p:2, cat:'halogen',        en:3.98, orgo:'The most electronegative element. Strongly polarizes C–F bonds but is a poor leaving group (too strong a base) and rarely a nucleophile.' },
    { z:10, s:'Ne', n:'Neon',          g:18, p:2, cat:'noble-gas',      en:null },
    { z:11, s:'Na', n:'Sodium',        g:1,  p:3, cat:'alkali',         en:0.93, orgo:'Common counter-ion (NaOH, NaOEt, NaBH₄) — pairs with organic anions/nucleophiles.' },
    { z:12, s:'Mg', n:'Magnesium',     g:2,  p:3, cat:'alkaline-earth', en:1.31, orgo:'Central atom in Grignard reagents (RMgX) — strong carbon nucleophiles.' },
    { z:13, s:'Al', n:'Aluminum',      g:13, p:3, cat:'post-transition',en:1.61, orgo:'AlCl₃ is a common Lewis acid catalyst (e.g. Friedel–Crafts reactions).' },
    { z:14, s:'Si', n:'Silicon',       g:14, p:3, cat:'metalloid',      en:1.90, orgo:'Appears in protecting groups (e.g. TMS, TBS) attached to oxygen.' },
    { z:15, s:'P',  n:'Phosphorus',    g:15, p:3, cat:'nonmetal',       en:2.19, orgo:'In phosphate esters and Wittig reagents (phosphorus ylides).' },
    { z:16, s:'S',  n:'Sulfur',        g:16, p:3, cat:'nonmetal',       en:2.58, orgo:'In thiols/thioethers. Larger and more polarizable than oxygen, so its lone pairs are strong nucleophiles.' },
    { z:17, s:'Cl', n:'Chlorine',      g:17, p:3, cat:'halogen',        en:3.16, orgo:'Very common leaving group (as Cl⁻) and halide substituent in substrates.' },
    { z:18, s:'Ar', n:'Argon',         g:18, p:3, cat:'noble-gas',      en:null },
    { z:19, s:'K',  n:'Potassium',     g:1,  p:4, cat:'alkali',         en:0.82, orgo:'Common counter-ion (KOH, t-BuOK) for organic bases/nucleophiles.' },
    { z:20, s:'Ca', n:'Calcium',       g:2,  p:4, cat:'alkaline-earth', en:1.00 },
    { z:21, s:'Sc', n:'Scandium',      g:3,  p:4, cat:'transition' ,    en:1.36 },
    { z:22, s:'Ti', n:'Titanium',      g:4,  p:4, cat:'transition',     en:1.54 },
    { z:23, s:'V',  n:'Vanadium',      g:5,  p:4, cat:'transition',     en:1.63 },
    { z:24, s:'Cr', n:'Chromium',      g:6,  p:4, cat:'transition',     en:1.66, orgo:'CrO₃/PCC (chromium-based reagents) are common oxidants for alcohols.' },
    { z:25, s:'Mn', n:'Manganese',     g:7,  p:4, cat:'transition',     en:1.55, orgo:'KMnO₄ is a strong oxidant used on alkenes.' },
    { z:26, s:'Fe', n:'Iron',          g:8,  p:4, cat:'transition',     en:1.83 },
    { z:27, s:'Co', n:'Cobalt',        g:9,  p:4, cat:'transition',     en:1.88 },
    { z:28, s:'Ni', n:'Nickel',        g:10, p:4, cat:'transition',     en:1.91, orgo:'Raney nickel is a common hydrogenation catalyst.' },
    { z:29, s:'Cu', n:'Copper',        g:11, p:4, cat:'transition',     en:1.90 },
    { z:30, s:'Zn', n:'Zinc',          g:12, p:4, cat:'transition',     en:1.65, orgo:'Zn is used in reduction reactions and organozinc reagents.' },
    { z:31, s:'Ga', n:'Gallium',       g:13, p:4, cat:'post-transition',en:1.81 },
    { z:32, s:'Ge', n:'Germanium',     g:14, p:4, cat:'metalloid',      en:2.01 },
    { z:33, s:'As', n:'Arsenic',       g:15, p:4, cat:'metalloid',      en:2.18 },
    { z:34, s:'Se', n:'Selenium',      g:16, p:4, cat:'nonmetal',       en:2.55, orgo:'Selenium reagents (e.g. SeO₂) show up in some oxidations.' },
    { z:35, s:'Br', n:'Bromine',       g:17, p:4, cat:'halogen',        en:2.96, orgo:'Very common leaving group and halogenation product; better nucleophile than Cl⁻, worse than I⁻.' },
    { z:36, s:'Kr', n:'Krypton',       g:18, p:4, cat:'noble-gas',      en:3.00 },
    { z:37, s:'Rb', n:'Rubidium',      g:1,  p:5, cat:'alkali',         en:0.82 },
    { z:38, s:'Sr', n:'Strontium',     g:2,  p:5, cat:'alkaline-earth', en:0.95 },
    { z:39, s:'Y',  n:'Yttrium',       g:3,  p:5, cat:'transition',     en:1.22 },
    { z:40, s:'Zr', n:'Zirconium',     g:4,  p:5, cat:'transition',     en:1.33 },
    { z:41, s:'Nb', n:'Niobium',       g:5,  p:5, cat:'transition',     en:1.60 },
    { z:42, s:'Mo', n:'Molybdenum',    g:6,  p:5, cat:'transition',     en:2.16 },
    { z:43, s:'Tc', n:'Technetium',    g:7,  p:5, cat:'transition',     en:1.90 },
    { z:44, s:'Ru', n:'Ruthenium',     g:8,  p:5, cat:'transition',     en:2.20 },
    { z:45, s:'Rh', n:'Rhodium',       g:9,  p:5, cat:'transition',     en:2.28, orgo:'Rhodium catalysts are used in some hydrogenations (e.g. Wilkinson’s catalyst).' },
    { z:46, s:'Pd', n:'Palladium',     g:10, p:5, cat:'transition',     en:2.20, orgo:'Central metal in palladium-catalyzed cross-coupling reactions.' },
    { z:47, s:'Ag', n:'Silver',        g:11, p:5, cat:'transition',     en:1.93, orgo:'Ag⁺ salts help activate halide leaving groups in some substitutions.' },
    { z:48, s:'Cd', n:'Cadmium',       g:12, p:5, cat:'transition',     en:1.69 },
    { z:49, s:'In', n:'Indium',        g:13, p:5, cat:'post-transition',en:1.78 },
    { z:50, s:'Sn', n:'Tin',           g:14, p:5, cat:'post-transition',en:1.96, orgo:'SnCl₂/Sn metal are used as reducing agents (e.g. nitro to amine).' },
    { z:51, s:'Sb', n:'Antimony',      g:15, p:5, cat:'metalloid',      en:2.05 },
    { z:52, s:'Te', n:'Tellurium',     g:16, p:5, cat:'metalloid',      en:2.10 },
    { z:53, s:'I',  n:'Iodine',        g:17, p:5, cat:'halogen',        en:2.66, orgo:'The best halide leaving group (weakest base) and a strong, polarizable nucleophile.' },
    { z:54, s:'Xe', n:'Xenon',         g:18, p:5, cat:'noble-gas',      en:2.60 },
    { z:55, s:'Cs', n:'Cesium',        g:1,  p:6, cat:'alkali',         en:0.79 },
    { z:56, s:'Ba', n:'Barium',        g:2,  p:6, cat:'alkaline-earth', en:0.89 },
    { z:57, s:'La', n:'Lanthanum',     g:null,p:6,cat:'lanthanide',     en:1.10 },
    { z:58, s:'Ce', n:'Cerium',        g:null,p:6,cat:'lanthanide',     en:1.12, orgo:'Ce(IV) salts (e.g. CAN) are used as mild oxidants in some reactions.' },
    { z:59, s:'Pr', n:'Praseodymium',  g:null,p:6,cat:'lanthanide',     en:1.13 },
    { z:60, s:'Nd', n:'Neodymium',     g:null,p:6,cat:'lanthanide',     en:1.14 },
    { z:61, s:'Pm', n:'Promethium',    g:null,p:6,cat:'lanthanide',     en:null },
    { z:62, s:'Sm', n:'Samarium',      g:null,p:6,cat:'lanthanide',     en:1.17, orgo:'SmI₂ is a single-electron reducing agent used in some radical reactions.' },
    { z:63, s:'Eu', n:'Europium',      g:null,p:6,cat:'lanthanide',     en:1.20 },
    { z:64, s:'Gd', n:'Gadolinium',    g:null,p:6,cat:'lanthanide',     en:1.20 },
    { z:65, s:'Tb', n:'Terbium',       g:null,p:6,cat:'lanthanide',     en:1.10 },
    { z:66, s:'Dy', n:'Dysprosium',    g:null,p:6,cat:'lanthanide',     en:1.22 },
    { z:67, s:'Ho', n:'Holmium',       g:null,p:6,cat:'lanthanide',     en:1.23 },
    { z:68, s:'Er', n:'Erbium',        g:null,p:6,cat:'lanthanide',     en:1.24 },
    { z:69, s:'Tm', n:'Thulium',       g:null,p:6,cat:'lanthanide',     en:1.25 },
    { z:70, s:'Yb', n:'Ytterbium',     g:null,p:6,cat:'lanthanide',     en:1.10 },
    { z:71, s:'Lu', n:'Lutetium',      g:null,p:6,cat:'lanthanide',     en:1.27 },
    { z:72, s:'Hf', n:'Hafnium',       g:4,  p:6, cat:'transition',     en:1.30 },
    { z:73, s:'Ta', n:'Tantalum',      g:5,  p:6, cat:'transition',     en:1.50 },
    { z:74, s:'W',  n:'Tungsten',      g:6,  p:6, cat:'transition',     en:2.36 },
    { z:75, s:'Re', n:'Rhenium',       g:7,  p:6, cat:'transition',     en:1.90 },
    { z:76, s:'Os', n:'Osmium',        g:8,  p:6, cat:'transition',     en:2.20, orgo:'OsO₄ is the classic reagent for dihydroxylating alkenes.' },
    { z:77, s:'Ir', n:'Iridium',       g:9,  p:6, cat:'transition',     en:2.20 },
    { z:78, s:'Pt', n:'Platinum',      g:10, p:6, cat:'transition',     en:2.28, orgo:'PtO₂ (Adams’ catalyst) is used for catalytic hydrogenation.' },
    { z:79, s:'Au', n:'Gold',          g:11, p:6, cat:'transition',     en:2.54, orgo:'Gold catalysts activate alkynes/alkenes toward nucleophilic attack in some modern methods.' },
    { z:80, s:'Hg', n:'Mercury',       g:12, p:6, cat:'transition',     en:2.00, orgo:'Hg(II) salts historically used to activate alkenes/alkynes (e.g. oxymercuration).' },
    { z:81, s:'Tl', n:'Thallium',      g:13, p:6, cat:'post-transition',en:1.62 },
    { z:82, s:'Pb', n:'Lead',          g:14, p:6, cat:'post-transition',en:2.33, orgo:'Pb(OAc)₄ is used to oxidatively cleave 1,2-diols.' },
    { z:83, s:'Bi', n:'Bismuth',       g:15, p:6, cat:'post-transition',en:2.02 },
    { z:84, s:'Po', n:'Polonium',      g:16, p:6, cat:'metalloid',      en:2.00 },
    { z:85, s:'At', n:'Astatine',      g:17, p:6, cat:'halogen',        en:2.20 },
    { z:86, s:'Rn', n:'Radon',         g:18, p:6, cat:'noble-gas',      en:null },
    { z:87, s:'Fr', n:'Francium',      g:1,  p:7, cat:'alkali',         en:0.70 },
    { z:88, s:'Ra', n:'Radium',        g:2,  p:7, cat:'alkaline-earth', en:0.90 },
    { z:89, s:'Ac', n:'Actinium',      g:null,p:7,cat:'actinide',       en:1.10 },
    { z:90, s:'Th', n:'Thorium',       g:null,p:7,cat:'actinide',       en:1.30 },
    { z:91, s:'Pa', n:'Protactinium',  g:null,p:7,cat:'actinide',       en:1.50 },
    { z:92, s:'U',  n:'Uranium',       g:null,p:7,cat:'actinide',       en:1.38 },
    { z:93, s:'Np', n:'Neptunium',     g:null,p:7,cat:'actinide',       en:1.36 },
    { z:94, s:'Pu', n:'Plutonium',     g:null,p:7,cat:'actinide',       en:1.28 },
    { z:95, s:'Am', n:'Americium',     g:null,p:7,cat:'actinide',       en:1.30 },
    { z:96, s:'Cm', n:'Curium',        g:null,p:7,cat:'actinide',       en:1.30 },
    { z:97, s:'Bk', n:'Berkelium',     g:null,p:7,cat:'actinide',       en:1.30 },
    { z:98, s:'Cf', n:'Californium',   g:null,p:7,cat:'actinide',       en:1.30 },
    { z:99, s:'Es', n:'Einsteinium',   g:null,p:7,cat:'actinide',       en:1.30 },
    { z:100,s:'Fm', n:'Fermium',       g:null,p:7,cat:'actinide',       en:1.30 },
    { z:101,s:'Md', n:'Mendelevium',   g:null,p:7,cat:'actinide',       en:1.30 },
    { z:102,s:'No', n:'Nobelium',      g:null,p:7,cat:'actinide',       en:1.30 },
    { z:103,s:'Lr', n:'Lawrencium',    g:null,p:7,cat:'actinide',       en:null },
    { z:104,s:'Rf', n:'Rutherfordium', g:4,  p:7, cat:'transition',     en:null },
    { z:105,s:'Db', n:'Dubnium',       g:5,  p:7, cat:'transition',     en:null },
    { z:106,s:'Sg', n:'Seaborgium',    g:6,  p:7, cat:'transition',     en:null },
    { z:107,s:'Bh', n:'Bohrium',       g:7,  p:7, cat:'transition',     en:null },
    { z:108,s:'Hs', n:'Hassium',       g:8,  p:7, cat:'transition',     en:null },
    { z:109,s:'Mt', n:'Meitnerium',    g:9,  p:7, cat:'unknown',        en:null },
    { z:110,s:'Ds', n:'Darmstadtium',  g:10, p:7, cat:'unknown',        en:null },
    { z:111,s:'Rg', n:'Roentgenium',   g:11, p:7, cat:'unknown',        en:null },
    { z:112,s:'Cn', n:'Copernicium',   g:12, p:7, cat:'unknown',        en:null },
    { z:113,s:'Nh', n:'Nihonium',      g:13, p:7, cat:'unknown',        en:null },
    { z:114,s:'Fl', n:'Flerovium',     g:14, p:7, cat:'unknown',        en:null },
    { z:115,s:'Mc', n:'Moscovium',     g:15, p:7, cat:'unknown',        en:null },
    { z:116,s:'Lv', n:'Livermorium',   g:16, p:7, cat:'unknown',        en:null },
    { z:117,s:'Ts', n:'Tennessine',    g:17, p:7, cat:'unknown',        en:null },
    { z:118,s:'Og', n:'Oganesson',     g:18, p:7, cat:'unknown',        en:null }
  ];

  var CATEGORY_LABEL = {
    'alkali':'Alkali metal', 'alkaline-earth':'Alkaline earth metal', 'transition':'Transition metal',
    'post-transition':'Post-transition metal', 'metalloid':'Metalloid', 'nonmetal':'Reactive nonmetal',
    'halogen':'Halogen', 'noble-gas':'Noble gas', 'lanthanide':'Lanthanide', 'actinide':'Actinide', 'unknown':'Unknown / synthetic'
  };

  function elCell(el){
    var enText = el.en === null ? '—' : el.en.toFixed(2);
    return '<button type="button" class="pt-cell cat-' + el.cat + '" data-z="' + el.z + '" title="' + el.n + '">' +
      '<span class="pt-z">' + el.z + '</span>' +
      '<span class="pt-sym">' + el.s + '</span>' +
      '<span class="pt-en">' + enText + '</span>' +
    '</button>';
  }

  function buildGrid(){
    var cells = [];
    ELEMENTS.forEach(function(el){
      var row, col;
      if(el.g === null){
        // f-block: lanthanides on their own row under period 6, actinides under period 7.
        row = (el.cat === 'lanthanide') ? 9 : 10;
        col = el.z - (el.cat === 'lanthanide' ? 57 : 89) + 3; // starts at column 3
      } else {
        row = el.p;
        col = el.g;
      }
      cells.push('<div style="grid-row:' + row + ';grid-column:' + col + ';">' + elCell(el) + '</div>');
    });
    // Placeholder links in the main table pointing down at the f-block rows.
    cells.push('<div style="grid-row:6;grid-column:3;" class="pt-refcell">57–71</div>');
    cells.push('<div style="grid-row:7;grid-column:3;" class="pt-refcell">89–103</div>');
    return cells.join('');
  }

  function detailHtml(el){
    var enText = el.en === null ? 'Not well established' : el.en.toFixed(2) + ' (Pauling scale)';
    return '<div class="pt-detail-inner">' +
      '<div class="pt-detail-head">' +
        '<span class="pt-detail-sym cat-' + el.cat + '">' + el.s + '</span>' +
        '<div><div class="pt-detail-name">' + el.n + '</div><div class="pt-detail-sub">Atomic number ' + el.z + ' &middot; ' + CATEGORY_LABEL[el.cat] + '</div></div>' +
      '</div>' +
      '<div class="pt-detail-row"><span class="k">Electronegativity</span><span class="v">' + enText + '</span></div>' +
      '<div class="pt-detail-row"><span class="k">In organic chemistry</span><span class="v">' + (el.orgo || 'Not common in organic chemistry — mostly relevant to inorganic/materials contexts.') + '</span></div>' +
    '</div>';
  }

  function init(){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pt-fab';
    btn.title = 'Periodic table reference';
    btn.setAttribute('aria-label', 'Open periodic table reference');
    btn.textContent = '⚛';
    document.body.appendChild(btn);

    var overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    overlay.innerHTML =
      '<div class="pt-modal" role="dialog" aria-modal="true" aria-label="Periodic table">' +
        '<div class="pt-modal__head">' +
          '<div>' +
            '<div class="pt-modal__title">Periodic table</div>' +
            '<div class="pt-modal__sub">Click any element for electronegativity and its role in organic chemistry.</div>' +
          '</div>' +
          '<button type="button" class="pt-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="pt-body">' +
          '<div class="pt-scroll"><div class="pt-grid">' + buildGrid() + '</div></div>' +
          '<div class="pt-detail" id="ptDetail"><div class="pt-detail-empty">Click an element to see its details here.</div></div>' +
        '</div>' +
        '<div class="pt-legend">' +
          Object.keys(CATEGORY_LABEL).map(function(k){
            return '<span class="pt-legend__item"><span class="pt-swatch cat-' + k + '"></span>' + CATEGORY_LABEL[k] + '</span>';
          }).join('') +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var detailPane = overlay.querySelector('#ptDetail');

    function open(){ overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close(){ overlay.classList.remove('open'); document.body.style.overflow = ''; }

    btn.addEventListener('click', open);
    overlay.querySelector('.pt-close').addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if(e.target === overlay) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });

    overlay.querySelectorAll('.pt-cell').forEach(function(cellBtn){
      cellBtn.addEventListener('click', function(){
        var z = parseInt(cellBtn.getAttribute('data-z'), 10);
        var el = ELEMENTS.filter(function(e){ return e.z === z; })[0];
        overlay.querySelectorAll('.pt-cell.chosen').forEach(function(c){ c.classList.remove('chosen'); });
        cellBtn.classList.add('chosen');
        detailPane.innerHTML = detailHtml(el);
      });
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.OchemPeriodicTable = { ELEMENTS: ELEMENTS };
})();
