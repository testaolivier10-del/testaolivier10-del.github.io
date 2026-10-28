/* The 3D body: model, picking, layers and the "find it on the model" hunt.

   Shared by the NREMT body map (nremt/body-map.html, content in
   nremt/assets/body-content.js) and the A&P 3D anatomy tool
   (anatomy-physiology/tools/anatomy-3d.html, its own content). The model
   (body3d.glb, BodyParts3D, CC BY 4.0) and three.js (vendor/three, MIT) sit
   next to this file in assets/body3d/. Any page can embed it:

     var v = LevlBodyViewer.mount(el, {
       base:     'assets/',          // where body3d.glb and vendor/three live (default: next to this file)
       autoload: 'visible',          // 'visible' (default) | 'now' | 'tap'
       systems:  ['cardio','resp'],  // body systems shown at start (default: all of the content's)
       skin:     true,               // translucent skin layer
       hint:     'Click any part to select it',   // false for none
       focus:    'heart',            // select and frame this structure once ready
       onSelect: function(key, info){},   // a structure was selected (null = cleared)
       onPick:   function(key, info){},   // the canvas was clicked on a structure
       onLoad:   function(){},
       pickSelects: true,            // false: a canvas pick only fires onPick
       content:  {...},              // groups/parts/points/systems/render (default: window.LevlBodyContent)
       only:     ['heart', ...],     // structures in play at start (others drawn as a ghost)
     });
     v.select('Heart'); v.find('liver'); v.highlight(['Heart','Aorta']); v.clear(); v.reset();
     v.setSystems(['cardio']); v.setSkin(false); v.structures(); v.info(key); v.on('select', fn);
     v.setOnly(['Heart','Aorta']) / null; v.inPlay(name); v.marks({ Heart: 'good' }); v.tag('Heart') / null
     v.hunt({ panel, live, onAnswer, onStop }).start() / .stop() / .active()

   Names are the labels in the body map's Browse-by-name list, matched
   case-insensitively; keys work too. The host page needs the three.js import
   map (body-map.html has it); if it is missing, mount() adds one.

   three.js and the model are NOT imported up front. Together they are about
   4 MB (3.3 MB of model, 670 KB of three.js), and everything else on a page —
   the list of structures, the info panel, the quiz — is plain data that works
   without either. So those work at once, and the 3D viewer is fetched when it
   scrolls into view, or, on a data-saver or 2G/3G connection, only when the
   reader taps to load it. */
(function(){
  'use strict';
  var SCRIPT_BASE = (function(){
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^/]*$/, '') : 'assets/';
  })();

  /* Content: which structure each of the model's meshes belongs to, and what
     to say about it. A page passes opts.content, or the viewer uses
     window.LevlBodyContent (the NREMT body map's, nremt/assets/body-content.js):
       groups  { key: { name, system, kind, color?, emissiveFactor?, context?, hidden?, ...fields } }
               context: drawn but never picked or listed; hidden: not drawn
       parts   { meshName (FMA id): groupKey }
       points  [{ key, name, system, x, y, z, ... }]   optional point landmarks
       systems { key: label }   order [keys]           the system filter
       render(content) -> html                         the info panel (optional) */
  function contentOf(c){
    c = c || window.LevlBodyContent || { groups: {}, parts: {}, points: [], systems: {}, order: [] };
    if (c._ready) return c;
    const entries = [];
    for (const k in c.groups) if (!c.groups[k].context && !c.groups[k].hidden) entries.push([k, c.groups[k]]);
    for (const p of c.points || []) entries.push(['pt_' + p.key, Object.assign({ kind: 'point' }, p)]);
    const byKey = {};
    for (const k in c.groups) byKey[k] = c.groups[k];
    for (const [k, v] of entries) byKey[k] = v;
    // Browse-by-name labels, lower case -> key. The first of a repeated name
    // (left and right lung) wins, which is the one the sorted list shows first.
    const byName = {};
    entries.slice().sort((a, b) => a[1].name.localeCompare(b[1].name))
      .forEach(([k, v]) => { const n = v.name.toLowerCase(); if (!(n in byName)) byName[n] = k; });
    return Object.assign(c, { _ready: true, entries, byKey, byName, order: c.order || Object.keys(c.systems || {}) });
  }
  function resolveIn(C, nameOrKey){
    if (nameOrKey == null) return null;
    const s = String(nameOrKey).trim();
    if (C.byKey[s] && !C.byKey[s].context && !C.byKey[s].hidden) return s;
    return C.byName[s.toLowerCase().replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ')] || C.byName[s.toLowerCase()] || null;
  }

  const KIND_COLORS = {
    bone:0xD8CFB8, organ:0x8A9B7E, vessel:0xB23A3A, skin:0xE8C9A8,
  };
  // Bone reads dry/matte; organs and vessels get a moister, glossier finish
  // so the material itself signals what kind of tissue you're looking at.
  const ROUGHNESS_BY_KIND = { bone:0.75, organ:0.32, vessel:0.25, skin:0.55 };
  const METALNESS_BY_KIND = { bone:0.04, organ:0.03, vessel:0.05, skin:0 };
  const SELECT_GLOW_HEX = 0x0F5C50;
  const MARK_HEX = { good: 0x2E8B57, bad: 0xC0392B, accent: 0xE0A21A };
  // The backdrop follows the site theme; [inner, outer, fog].
  const BACKDROP = { light:['#fbfbfa', '#e4e6e2', 0xF4F5F3], dark:['#26332f', '#121a18', 0x0F1917] };

  // Organs, vessels, and skin are the things that most often sit in front of
  // whatever you actually clicked, hiding it — so once something is selected,
  // fade every OTHER organ/vessel/skin mesh down to a ghost. Bones stay fully
  // solid throughout, since they rarely fully block a selection and keeping
  // them opaque preserves a stable frame of reference to orient by.
  const FADE_KINDS = new Set(['organ', 'vessel', 'skin']);
  const FADE_OPACITY = 0.1;
  const HOME_POS = [0, -2700, 1000], HOME_TARGET = [0, 0, 900];

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  }
  /* The NREMT card (the default when the content has no render()). */
  function infoHtmlFor(C, data){
    const sysLabel = (C.systems || {})[data.system] || data.system;
    return `
      <span class="info-cat">${sysLabel}</span>
      <p class="info-label">${data.name}</p>
      <p class="info-field"><b>Location:</b> ${data.location}</p>
      <p class="info-field"><b>Function:</b> ${data.funct}</p>
      <p class="info-field"><b>Common pathologies:</b> ${data.path}</p>
      <p class="info-field"><b>Assessment findings:</b> ${data.findings}</p>
      <p class="info-field"><b>Field interventions:</b> ${data.interv}</p>
    `;
  }
  function reducedMotion(){
    if (window.LevlMotion) return window.LevlMotion.reduced();
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function isDark(){ return document.documentElement.getAttribute('data-theme') === 'dark'; }

  /* ---- three.js, once per page ------------------------------------------ */

  let libsPromise = null;
  function ensureImportMap(base){
    if (document.querySelector('script[type="importmap"]')) return;
    const s = document.createElement('script');
    s.type = 'importmap';
    s.textContent = JSON.stringify({ imports: { three: new URL(base + 'vendor/three/build/three.module.min.js', location.href).href } });
    document.head.appendChild(s);
  }
  function loadLibs(base){
    if (libsPromise) return libsPromise;
    ensureImportMap(base);
    const v = new URL(base + 'vendor/three/', location.href).href;
    libsPromise = Promise.all([
      import('three'),
      import(v + 'controls/OrbitControls.js'),
      import(v + 'loaders/GLTFLoader.js'),
      import(v + 'libs/meshopt_decoder.module.js'),
      import(v + 'environments/RoomEnvironment.js'),
    ]).then(([three, oc, gl, md, re]) => ({
      THREE: three, OrbitControls: oc.OrbitControls, GLTFLoader: gl.GLTFLoader,
      MeshoptDecoder: md.MeshoptDecoder, RoomEnvironment: re.RoomEnvironment,
    }), (err) => { libsPromise = null; throw err; });
    return libsPromise;
  }

  function slowConnection(){
    const c = navigator.connection;
    if (!c) return false;
    return !!c.saveData || /2g|3g/.test(c.effectiveType || '');
  }

  /* The viewer's own pieces, so a page that embeds it needs no stylesheet. */
  function injectCss(){
    if (document.getElementById('bv-css')) return;
    const st = document.createElement('style');
    st.id = 'bv-css';
    st.textContent = `
.bv{position:relative;overflow:hidden;}
.bv-canvas{width:100%;height:min(72vh,560px);display:block;touch-action:none;cursor:grab;}
.bv-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:var(--paper);font-family:var(--font-mono);font-size:12.5px;color:var(--muted);letter-spacing:0.04em;}
.bv-loading[hidden],.bv-spinner[hidden],.bv-load-btn[hidden]{display:none;}
.bv-load-btn{font:700 13px var(--font-ui);padding:10px 18px;border:0;border-radius:20px;background:var(--navy);color:var(--on-accent);cursor:pointer;letter-spacing:0;}
.bv-load-text{max-width:34ch;text-align:center;line-height:1.5;}
.bv-spinner{width:22px;height:22px;border-radius:50%;border:2.5px solid var(--line);border-top-color:var(--accent);animation:bv-spin .8s linear infinite;}
@keyframes bv-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion: reduce){.bv-spinner{animation-duration:2.4s;}}
.bv-tag{position:absolute;left:0;top:0;pointer-events:none;max-width:70%;padding:5px 11px;border-radius:999px;background:var(--ink,#16332E);color:var(--paper,#fff);font:800 13px/1.25 var(--font-ui,system-ui);box-shadow:0 2px 8px rgba(0,0,0,.25);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;z-index:2;}
.bv-tag[hidden]{display:none;}
.bv-hint{position:absolute;top:10px;right:10px;background:var(--overlay-bg);border:2px solid var(--line);border-radius:8px;padding:6px 9px;font-size:11px;color:var(--muted);text-align:right;line-height:1.5;pointer-events:none;}
`;
    document.head.appendChild(st);
  }

  /* ---- One viewer ------------------------------------------------------- */

  function mount(el, opts){
    if (!el) throw new Error('LevlBodyViewer.mount: no element');
    opts = opts || {};
    injectCss();
    const base = opts.base || SCRIPT_BASE;
    const C = contentOf(opts.content);
    const ALL_SYSTEMS = C.order;
    const SYSTEM_LABELS = C.systems || {};
    const ENTRIES = C.entries, CONTENT_BY_KEY = C.byKey;
    const resolve = (n) => resolveIn(C, n);
    const infoHtml = (d) => (C.render ? C.render(d) : infoHtmlFor(C, d));
    /* only(keys): the structures in play (a chapter filter, a quiz set); the
       others stay drawn but faint and cannot be picked. null = all. */
    let onlySet = opts.only ? new Set(opts.only) : null;
    /* marks: { key: 'good' | 'bad' | 'accent' } colors a structure (quiz
       results); cleared with marks({}). */
    let markMap = {};
    const listeners = { select:[], pick:[], load:[], layers:[] };
    if (opts.onSelect) listeners.select.push(opts.onSelect);
    if (opts.onPick) listeners.pick.push(opts.onPick);
    if (opts.onLoad) listeners.load.push(opts.onLoad);
    if (opts.onLayers) listeners.layers.push(opts.onLayers);
    function emit(name, a, b, c){ kick(); listeners[name].forEach(fn => { try { fn(a, b, c); } catch(e){ console.error(e); } }); }

    let L = null;   // the three.js libraries, once loaded
    let scene, camera, renderer, controls, raycaster, pointer, bgTex;
    const meshByGroup = {};   // groupKey -> [mesh,...]
    const allPickable = [];   // meshes + point markers, raycast targets
    let selectedGroupKey = null;
    let hoveredGroupKey = null;
    let highlighted = [];
    let activeSystems = new Set(opts.systems || ALL_SYSTEMS);
    let skinOn = opts.skin !== false;
    let pointerDownPos = null;
    let lastPart = null, pickedPart = null;   // the mesh (FMA id) under the last pick
    let pickSelects = opts.pickSelects !== false;
    let flyAnim = null;
    let loaded = false, started = false, destroyed = false, rafId = 0;

    el.classList.add('bv');
    const canvas = document.createElement('canvas');
    canvas.className = 'bv-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', opts.label || '3D model of the human body. Drag to rotate; choose a structure by name to select it with the keyboard.');
    const loading = document.createElement('div');
    loading.className = 'bv-loading';
    loading.innerHTML = '<div class="bv-spinner"></div><div class="bv-load-text">Loading 3D model&hellip;</div>' +
      '<button type="button" class="bv-load-btn" hidden>Load 3D model (3.3&nbsp;MB)</button>';
    const spinner = loading.querySelector('.bv-spinner');
    const loadText = loading.querySelector('.bv-load-text');
    const loadBtn = loading.querySelector('.bv-load-btn');
    el.insertBefore(loading, el.firstChild);
    el.insertBefore(canvas, el.firstChild);
    if (opts.hint !== false) {
      const hint = document.createElement('div');
      hint.className = 'bv-hint';
      hint.textContent = opts.hint || ((window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 'Tap any part to select it' : 'Click any part to select it');
      el.insertBefore(hint, loading.nextSibling);
    }
    const tagEl = document.createElement('div');
    tagEl.className = 'bv-tag';
    tagEl.setAttribute('aria-hidden', 'true');
    tagEl.hidden = true;
    el.appendChild(tagEl);
    let tagText = null;
    /* The tag sits over the middle of the selected structure, clamped inside
       the view; it is redrawn with every frame the camera moves. */
    function placeTag(){
      if (!tagText || !selectedGroupKey || !camera || !meshByGroup[selectedGroupKey]) { tagEl.hidden = true; return; }
      const b = groupBounds(selectedGroupKey);
      if (!b) { tagEl.hidden = true; return; }
      const v = b.center.clone().project(camera);
      if (v.z > 1) { tagEl.hidden = true; return; }
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const x = Math.min(Math.max((v.x + 1) / 2 * w, 60), w - 60), y = Math.min(Math.max((1 - v.y) / 2 * h, 28), h - 12);
      tagEl.textContent = tagText;
      tagEl.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px) translate(-50%, -130%)';
      tagEl.hidden = false;
    }
    const listEl = opts.list || null;
    const infoEl = opts.info || null;
    const placeholder = opts.placeholder || '<p class="info-placeholder">Click any part of the model, or a name below.</p>';

    function visible(key){
      const c = CONTENT_BY_KEY[key];
      if (!c || c.hidden) return false;
      if (c.context) return true;
      return activeSystems.has(c.system) && !(key === 'skin' && !skinOn);
    }
    // In play: visible, pickable, listed and askable.
    function inPlay(key){
      const c = CONTENT_BY_KEY[key];
      return visible(key) && !c.context && (!onlySet || onlySet.has(key) || key === 'skin');
    }

    /* ---- scene ---- */

    function backdrop(){
      const THREE = L.THREE;
      const [inner, outer, fog] = BACKDROP[isDark() ? 'dark' : 'light'];
      const size = 512;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(size/2, size*0.42, size*0.08, size/2, size/2, size*0.72);
      grad.addColorStop(0, inner);
      grad.addColorStop(1, outer);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      if (bgTex) bgTex.dispose();
      bgTex = new THREE.CanvasTexture(c);
      bgTex.colorSpace = THREE.SRGBColorSpace;
      scene.background = bgTex;
      scene.fog = new THREE.Fog(fog, 2400, 6000);
    }

    function initScene(){
      const THREE = L.THREE;
      scene = new THREE.Scene();
      backdrop();

      const w = el.clientWidth, h = canvas.clientHeight || 560;
      camera = new THREE.PerspectiveCamera(32, w / h, 1, 12000);
      camera.up.set(0, 0, 1);
      camera.position.set(...HOME_POS);

      renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new L.RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();

      controls = new L.OrbitControls(camera, renderer.domElement);
      controls.target.set(...HOME_TARGET);
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.minDistance = 120;
      controls.maxDistance = 4200;
      controls.zoomSpeed = 0.9;
      controls.panSpeed = 0.7;
      controls.screenSpacePanning = true;
      controls.update();

      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const dl1 = new THREE.DirectionalLight(0xffffff, 0.55);
      dl1.position.set(400, -1400, 1600);
      dl1.target.position.set(0, 0, 650);
      dl1.castShadow = true;
      dl1.shadow.mapSize.set(2048, 2048);
      dl1.shadow.camera.left = -900;
      dl1.shadow.camera.right = 900;
      dl1.shadow.camera.top = 900;
      dl1.shadow.camera.bottom = -900;
      dl1.shadow.camera.near = 10;
      dl1.shadow.camera.far = 4000;
      dl1.shadow.bias = -0.0015;
      dl1.shadow.normalBias = 2;
      scene.add(dl1);
      scene.add(dl1.target);
      const dl2 = new THREE.DirectionalLight(0xffffff, 0.35);
      dl2.position.set(-600, 900, 400);
      scene.add(dl2);
      const dl3 = new THREE.DirectionalLight(0xffffff, 0.25);
      dl3.position.set(300, 1200, 1200);
      scene.add(dl3);

      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2();

      window.addEventListener('resize', onResize);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }

    function onResize(){
      if (!camera) return;
      const w = el.clientWidth, h = canvas.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    function materialFor(content){
      const THREE = L.THREE;
      const isSkin = content.kind === 'skin';
      const color = content.color ?? KIND_COLORS[content.kind] ?? 0xBFBFBF;
      const see = isSkin || (content.opacity != null && content.opacity < 1);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: ROUGHNESS_BY_KIND[content.kind] ?? 0.6,
        metalness: METALNESS_BY_KIND[content.kind] ?? 0.02,
        transparent: see,
        opacity: isSkin ? 0.24 : (content.opacity ?? 1),
        depthWrite: !see,
        side: THREE.DoubleSide,
      });
      if (content.emissiveFactor) {
        mat.emissive = new THREE.Color(color);
        mat.emissiveIntensity = content.emissiveFactor;
      }
      return mat;
    }

    function loadModel(){
      const loader = new L.GLTFLoader();
      loader.setMeshoptDecoder(L.MeshoptDecoder);
      loader.load(base + 'body3d.glb?v=hires2', (gltf) => {
        if (destroyed) return;
        const modelRoot = gltf.scene;
        modelRoot.traverse(obj => {
          if (!obj.isMesh) return;
          const parentName = obj.parent && obj.parent.name;
          const partId = (parentName && C.parts[parentName]) ? parentName : obj.name;
          const groupKey = C.parts[partId];
          if (!groupKey) { obj.visible = false; return; }
          const content = C.groups[groupKey];
          if (!content || content.hidden) { obj.visible = false; return; }
          if (!content) return;
          if (!obj.geometry.attributes.normal) obj.geometry.computeVertexNormals();
          obj.material = materialFor(content);
          obj.userData.groupKey = groupKey;
          obj.userData.part = partId;
          obj.userData.kind = content.kind;
          obj.userData.baseColor = obj.material.color.getHex();
          obj.userData.baseEmissive = obj.material.emissive.getHex();
          obj.userData.baseEmissiveIntensity = obj.material.emissiveIntensity;
          obj.userData.baseOpacity = obj.material.opacity;
          obj.userData.baseTransparent = obj.material.transparent;
          obj.userData.isSkin = content.kind === 'skin';
          obj.userData.context = !!content.context;
          obj.castShadow = content.kind !== 'skin';
          obj.receiveShadow = true;
          (meshByGroup[groupKey] = meshByGroup[groupKey] || []).push(obj);
          allPickable.push(obj);
        });
        scene.add(modelRoot);
        loaded = true;
        applyLayers();
        /* The list works before the model arrives, so something may already be
           selected (or asked for by ?focus=); show it on the model now. */
        highlighted.forEach(k => highlightGroup(k, 0.35));
        if (selectedGroupKey && meshByGroup[selectedGroupKey]) {
          highlightGroup(selectedGroupKey);
          updateOcclusionFade();
          flyToGroup(selectedGroupKey);
        }
        loading.hidden = true;
        emit('load');
      }, (xhr) => {
        if (xhr.total) loadText.textContent = 'Loading 3D model… ' + Math.round((xhr.loaded / xhr.total) * 100) + '%';
      }, (err) => {
        console.error(err);
        spinner.hidden = true;
        loadText.textContent = 'Could not load the 3D model. Try reloading the page.';
      });
    }

    /* The loop stops while the model is scrolled out of view, so reading the
       cards below it does not keep the GPU (and a phone's battery) busy. */
    let onScreen = true, viewIo = null;
    /* Render on demand: a frame is drawn while the camera moves (drag, damping,
       a fly-to), for a moment after any input or event, and once a second
       otherwise. An idle body map no longer redraws 60 times a second, which
       kept a phone's GPU busy for nothing and made low-end devices janky. */
    var activeUntil = 0, lastFrame = 0;   // var: emit() may kick before this line has run
    function kick(ms){ activeUntil = Math.max(activeUntil || 0, performance.now() + (ms || 1500)); }
    const KICK_ON = ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'click', 'touchstart', 'resize'];
    const onKick = () => kick();
    KICK_ON.forEach(t => window.addEventListener(t, onKick, { passive: true, capture: true }));
    function animate(){
      if (destroyed) return;
      if (!onScreen) { rafId = 0; return; }
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      const moved = controls.update();
      if (moved || now < activeUntil || now - lastFrame > 1000) {
        renderer.render(scene, camera);
        lastFrame = now;
        if (tagText) placeTag();
      }
    }
    function watchView(){
      if (!('IntersectionObserver' in window)) return;
      viewIo = new IntersectionObserver((entries) => {
        onScreen = entries.some(e => e.isIntersecting);
        if (onScreen && !rafId && !destroyed) animate();
      });
      viewIo.observe(canvas);
    }

    function start(){
      if (started) return;
      started = true;
      loadBtn.hidden = true;
      spinner.hidden = false;
      loadText.textContent = 'Loading 3D model…';
      loadLibs(base).then((libs) => {
        if (destroyed) return;
        L = libs;
        initScene();
        loadModel();
        animate();
        watchView();
      }, (err) => {
        console.error(err);
        started = false;
        spinner.hidden = true;
        loadText.textContent = 'Could not load the 3D viewer.';
        loadBtn.textContent = 'Try again';
        loadBtn.hidden = false;
      });
    }
    loadBtn.addEventListener('click', start);

    /* ---- picking ---- */

    function onPointerDown(e){ pointerDownPos = { x: e.clientX, y: e.clientY }; }
    function onPointerUp(e){
      if (!pointerDownPos) return;
      const dx = e.clientX - pointerDownPos.x, dy = e.clientY - pointerDownPos.y;
      pointerDownPos = null;
      if (Math.sqrt(dx*dx + dy*dy) < 6) handlePick(e);
    }
    function onPointerLeave(){ setHover(null); }
    function keyAt(e){
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return firstNonSkinGroupKey(raycaster.intersectObjects(allPickable, false));
    }
    function handlePick(e){
      const groupKey = keyAt(e);
      if (!groupKey) { emit('pick', null, null, null); return; }
      const part = lastPart;
      emit('pick', groupKey, CONTENT_BY_KEY[groupKey], part);
      if (pickSelects) { pickedPart = part; selectGroup(groupKey); pickedPart = null; }
    }
    function onPointerMove(e){
      const groupKey = keyAt(e);
      setHover(groupKey);
      canvas.style.cursor = groupKey ? 'pointer' : 'grab';
    }
    function firstNonSkinGroupKey(hits){
      // Three.js's raycaster doesn't check mesh.visible on its own, so a part
      // hidden by a system filter (or the skin toggle) would otherwise still be
      // pickable through the gap it left behind — filter those out first.
      const visibleHits = hits.filter(h => h.object.visible && !h.object.userData.dim && !h.object.userData.context);
      lastPart = null;
      for (let i = 0; i < visibleHits.length; i++) {
        const h = visibleHits[i], gk = h.object.userData.groupKey;
        if (!gk || gk === 'skin') continue;
        /* A see-through shell (the heart wall) lets a pick through to a
           structure it lists as inner (the valves) when one lies behind the
           point tapped; anything else behind it is not reached. */
        const inner = (CONTENT_BY_KEY[gk] || {}).inner;
        if (inner) {
          const deeper = visibleHits.slice(i + 1).find(x => inner.indexOf(x.object.userData.groupKey) !== -1);
          if (deeper) { lastPart = deeper.object.userData.part; return deeper.object.userData.groupKey; }
        }
        lastPart = h.object.userData.part;
        return gk;
      }
      if (visibleHits.length && visibleHits[0].object.userData.groupKey === 'skin' && skinOn) { lastPart = visibleHits[0].object.userData.part; return 'skin'; }
      return null;
    }
    function setHover(groupKey){
      if (groupKey === hoveredGroupKey) return;
      if (hoveredGroupKey && hoveredGroupKey !== selectedGroupKey) {
        for (const m of meshByGroup[hoveredGroupKey] || []) restore(m);
      }
      hoveredGroupKey = groupKey;
      if (groupKey && groupKey !== selectedGroupKey) {
        for (const m of meshByGroup[groupKey] || []) m.material.emissive = new L.THREE.Color(0x2a2a2a);
      }
    }

    /* ---- looks ---- */

    function resetMeshColor(m){
      m.material.color.setHex(m.userData.baseColor);
      m.material.emissive.setHex(m.userData.baseEmissive || 0x000000);
      m.material.emissiveIntensity = m.userData.baseEmissiveIntensity ?? 1;
    }
    // Back to base, or back to a highlight() glow if it has one.
    function restore(m){
      resetMeshColor(m);
      const mk = markMap[m.userData.groupKey];
      if (mk) tint(m, MARK_HEX[mk] || MARK_HEX.accent);
      if (highlighted.indexOf(m.userData.groupKey) !== -1) glow(m, 0.35);
    }
    function tint(m, hex){
      const g = new L.THREE.Color(hex);
      m.material.color.setHex(m.userData.baseColor).lerp(g, 0.62);
      m.material.emissive = g.clone();
      m.material.emissiveIntensity = 0.35;
    }
    // Selection keeps each part's own color and glows with a soft accent-colored
    // emissive instead of flat-filling the mesh — easier to read as "this is
    // highlighted" rather than "this part turned teal". A pure emissive add
    // washes out on brightly-lit surfaces, so the base color is blended toward
    // the glow too — that stays visible under any lighting.
    function glow(m, amount){
      const g = new L.THREE.Color(SELECT_GLOW_HEX);
      m.material.color.setHex(m.userData.baseColor).lerp(g, amount);
      m.material.emissive = g.clone();
      m.material.emissiveIntensity = amount === 0.55 ? 0.75 : 0.45;
    }
    function highlightGroup(groupKey, amount){
      if (!L) return;
      for (const m of meshByGroup[groupKey] || []) glow(m, amount || 0.55);
    }
    function updateOcclusionFade(){
      for (const m of allPickable) {
        // Out of play (opts.only / setOnly): a faint ghost of every kind, so
        // the structures in play stand out and keep their place in the body.
        if (m.userData.dim) {
          m.material.transparent = true;
          m.material.opacity = m.userData.isSkin ? Math.min(m.userData.baseOpacity, 0.12) : 0.13;
          m.material.depthWrite = false;
          continue;
        }
        if (!FADE_KINDS.has(m.userData.kind)) {
          m.material.transparent = m.userData.baseTransparent;
          m.material.opacity = m.userData.baseOpacity;
          m.material.depthWrite = !m.userData.baseTransparent;
          continue;
        }
        const isSelected = selectedGroupKey && m.userData.groupKey === selectedGroupKey;
        if (isSelected) {
          m.material.transparent = m.userData.baseTransparent;
          m.material.opacity = 1;
          m.material.depthWrite = !m.userData.baseTransparent;
        } else if (selectedGroupKey) {
          m.material.transparent = true;
          m.material.opacity = FADE_OPACITY;
          m.material.depthWrite = false;
        } else {
          m.material.transparent = m.userData.baseTransparent;
          m.material.opacity = m.userData.baseOpacity;
          m.material.depthWrite = !m.userData.baseTransparent;
        }
      }
    }

    /* ---- camera ---- */

    function groupBounds(groupKey){
      const THREE = L.THREE;
      const meshes = meshByGroup[groupKey];
      if (!meshes || !meshes.length) return null;
      const box = new THREE.Box3(), tmp = new THREE.Box3();
      let has = false;
      for (const m of meshes) {
        if (m.userData.isPoint) tmp.setFromCenterAndSize(m.position, new THREE.Vector3(30,30,30));
        else tmp.setFromObject(m);
        if (!has) { box.copy(tmp); has = true; } else box.union(tmp);
      }
      if (!has) return null;
      const center = new THREE.Vector3(), size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);
      return { center, size };
    }
    function flyToGroup(groupKey){
      if (!camera) return;
      const b = groupBounds(groupKey);
      if (!b) return;
      const radius = Math.max(b.size.length() * 0.55, 60);
      const isPoint = meshByGroup[groupKey] && meshByGroup[groupKey][0] && meshByGroup[groupKey][0].userData.isPoint;
      const distance = Math.min(Math.max(radius * (isPoint ? 6.5 : 2.8), 190), 3200);
      const dir = new L.THREE.Vector3().subVectors(camera.position, controls.target);
      if (dir.lengthSq() < 1e-6) dir.set(0, -1, 0.3);
      dir.normalize();
      const newTarget = b.center.clone();
      animateCamera(newTarget.clone().addScaledVector(dir, distance), newTarget, 650);
    }
    function animateCamera(newPos, newTarget, duration){
      if (flyAnim) cancelAnimationFrame(flyAnim.raf);
      /* Flying the camera across the body is the largest piece of motion on the
         site and the one most likely to make someone queasy. Under "reduce
         motion" the view still goes exactly where it was asked to go — it just
         arrives instead of travelling. */
      if (reducedMotion()) {
        camera.position.copy(newPos);
        controls.target.copy(newTarget);
        controls.update();
        flyAnim = null;
        return;
      }
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const t0 = performance.now();
      function step(now){
        const t = Math.min((now - t0) / duration, 1);
        const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; // easeInOutQuad
        camera.position.lerpVectors(startPos, newPos, e);
        controls.target.lerpVectors(startTarget, newTarget, e);
        controls.update();
        flyAnim = t < 1 ? { raf: requestAnimationFrame(step) } : null;
      }
      flyAnim = { raf: requestAnimationFrame(step) };
    }

    /* ---- selection ---- */

    function selectGroup(groupKey, how){
      /* While the hunt is running, every selection is an answer to it. Hooked
         here rather than on the canvas so that picking a name out of the list
         counts too — the skill is naming the structure, and a student who can
         find it in a list has demonstrated something real even if it is not
         the harder version. */
      if (hunt.active && hunt.target && !hunt.answered && how !== 'reveal') answerHunt(groupKey);
      // Clicking the already-selected part again toggles it off: zoom back out
      // and clear the selection, instead of re-selecting a no-op.
      if (groupKey === selectedGroupKey) {
        if (how === 'focus' || how === 'reveal') return;
        reset();
        return;
      }
      if (selectedGroupKey && meshByGroup[selectedGroupKey]) {
        for (const m of meshByGroup[selectedGroupKey]) restore(m);
      }
      selectedGroupKey = groupKey;
      highlightGroup(groupKey);
      updateOcclusionFade();
      const content = CONTENT_BY_KEY[groupKey];
      if (content && infoEl) infoEl.innerHTML = infoHtml(content);
      flyToGroup(groupKey);
      renderList();
      emit('select', groupKey, content, pickedPart);
      placeTag();
    }
    function clear(){
      if (selectedGroupKey && meshByGroup[selectedGroupKey]) {
        for (const m of meshByGroup[selectedGroupKey]) restore(m);
      }
      const had = selectedGroupKey;
      selectedGroupKey = null;
      tagEl.hidden = true;
      updateOcclusionFade();
      if (infoEl) infoEl.innerHTML = placeholder;
      renderList();
      if (had) emit('select', null, null);
    }
    function reset(){
      clear();
      if (!camera) return;
      animateCamera(new L.THREE.Vector3(...HOME_POS), new L.THREE.Vector3(...HOME_TARGET), 650);
    }

    function applyLayers(){
      for (const groupKey in meshByGroup) {
        const content = CONTENT_BY_KEY[groupKey];
        if (!content) continue;
        const show = visible(groupKey);
        const dim = show && !content.context && !inPlay(groupKey);
        for (const m of meshByGroup[groupKey]) { m.visible = show; m.userData.dim = dim; }
      }
      if (selectedGroupKey && !inPlay(selectedGroupKey)) clear();
      if (loaded) updateOcclusionFade();
      renderList();
    }

    function renderList(){
      if (!listEl) return;
      const items = ENTRIES.filter(([k]) => inPlay(k))
        .sort((a, b) => a[1].name.localeCompare(b[1].name));
      listEl.innerHTML = items.map(([k, c]) => {
        const sel = k === selectedGroupKey;
        return `<button type="button" data-key="${k}"${sel ? ' class="selected"' : ''} aria-pressed="${sel}">${c.name}</button>`;
      }).join('');
    }
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-key]');
        if (btn) selectGroup(btn.dataset.key);
      });
    }

    /* ---- The hunt ----------------------------------------------------------

       "Where is the xiphoid process" is the question this model is for, and the
       model could only answer the reverse one: click a thing, be told its name.
       That is recognition, and recognition is what feels like knowing right up
       until someone asks you to point at it. So the hunt names a structure and
       makes you find it. The tally is for the current run; what happens to each
       answer beyond that is the host page's business (onAnswer).

       Only structures that are actually visible are asked about: asking someone
       to click a lung they have filtered out is a question about the interface
       rather than anatomy. */
    const hunt = { active:false, target:null, answered:false, asked:[], right:0, total:0, o:{} };

    function huntPool(){
      return ENTRIES.filter(([key, c]) => key !== 'skin' && inPlay(key) && !!c.name);
    }
    function huntSet(html){ if (hunt.o.panel) hunt.o.panel.innerHTML = html; }
    function huntSay(text){ if (hunt.o.live) hunt.o.live.textContent = text; }
    function nextHunt(firstKey){
      const pool = huntPool();
      if (!pool.length) {
        huntSet('<div class="hunt-q">No structures are visible — turn a system back on.</div>');
        return;
      }
      let pick = firstKey && pool.find(([k]) => k === firstKey), tries = 0;
      if (!pick) {
        do { pick = pool[Math.floor(Math.random() * pool.length)]; tries++; }
        while (tries < 60 && hunt.asked.includes(pick[0]) && hunt.asked.length < pool.length);
      }
      hunt.target = { key: pick[0], content: pick[1] };
      hunt.answered = false;
      hunt.asked.push(pick[0]);
      if (hunt.asked.length > pool.length - 1) hunt.asked = [];
      renderHunt();
    }
    function renderHunt(){
      const t = hunt.target;
      huntSet(`
        <div class="hunt-q">
          <span class="hunt-k">Find it on the model</span>
          <strong>${t.content.name}</strong>
          <span class="hunt-sys">${SYSTEM_LABELS[t.content.system] || t.content.system}</span>
        </div>
        <div class="hunt-tally">${hunt.total ? hunt.right + ' of ' + hunt.total : 'Find it on the model, or pick it by name in Details.'}</div>
        <div class="hunt-after"></div>
        <div class="hunt-actions">
          <button type="button" class="hunt-skip" data-hunt="show">Show me</button>
          <button type="button" class="hunt-stop" data-hunt="stop">Stop</button>
        </div>
      `);
      huntSay('Find the ' + t.content.name + '.');
    }
    function huntAfter(html){
      const after = hunt.o.panel && hunt.o.panel.querySelector('.hunt-after');
      if (!after) return;
      after.innerHTML = html + '<button type="button" class="hunt-next" data-hunt="next">Next</button>';
      const next = after.querySelector('[data-hunt="next"]');
      if (next && hunt.o.panel.contains(document.activeElement)) next.focus();
    }
    function answerHunt(pickedKey){
      const t = hunt.target;
      hunt.answered = true;
      hunt.total++;
      const right = pickedKey === t.key;
      if (right) hunt.right++;
      const picked = CONTENT_BY_KEY[pickedKey];
      huntAfter(right
        ? `<div class="hunt-verdict ok">That is the ${t.content.name}.</div>`
        : `<div class="hunt-verdict no">That is the ${picked ? picked.name : 'the wrong structure'}.${t.content.location ? ` The ${t.content.name} is ${t.content.location.charAt(0).toLowerCase() + t.content.location.slice(1)}` : ''}</div>`);
      if (window.LevlSound) window.LevlSound.answer(right);
      huntSay(right
        ? 'Correct, that is the ' + t.content.name + '.'
        : 'Not quite. That is the ' + (picked ? picked.name : 'a different structure') + '.');
      if (hunt.o.onAnswer) {
        try { hunt.o.onAnswer({ correct: right, key: t.key, name: t.content.name, picked: pickedKey, pickedName: picked ? picked.name : '' }); }
        catch(e){ console.error(e); }
      }
    }
    /* "Show me" selects the answer rather than describing it, because the whole
       question was where the thing is. It does not count as a miss; asking to
       be shown is a reasonable thing to do and punishing it teaches guessing. */
    function revealHunt(){
      const t = hunt.target;
      hunt.answered = true;
      huntAfter(`<div class="hunt-verdict">Highlighted: the ${t.content.name}.</div>`);
      selectGroup(t.key, 'reveal');
      huntSay('Showing the ' + t.content.name + '.');
    }
    function startHunt(o){
      hunt.o = Object.assign({}, opts.hunt || {}, o || {});
      hunt.active = true;
      hunt.right = 0; hunt.total = 0; hunt.asked = [];
      if (hunt.o.panel) hunt.o.panel.hidden = false;
      clear();
      nextHunt(resolve(hunt.o.first));
    }
    function stopHunt(){
      if (!hunt.active) return;
      hunt.active = false;
      hunt.target = null;
      if (hunt.o.panel) hunt.o.panel.hidden = true;
      huntSay(hunt.total ? 'Quiz stopped. ' + hunt.right + ' of ' + hunt.total + '.' : '');
      if (hunt.o.onStop) hunt.o.onStop({ right: hunt.right, total: hunt.total });
    }
    function huntClick(e){
      const b = e.target.closest('[data-hunt]');
      if (!b || !hunt.active) return;
      const act = b.getAttribute('data-hunt');
      if (act === 'show') revealHunt();
      else if (act === 'stop') stopHunt();
      else if (act === 'next') nextHunt();
    }
    const huntPanels = new Set();
    function wireHuntPanel(){
      const p = hunt.o.panel;
      if (p && !huntPanels.has(p)) { huntPanels.add(p); p.addEventListener('click', huntClick); }
    }

    /* ---- theme ---- */
    const themeWatch = new MutationObserver(() => { if (scene) backdrop(); });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* ---- When to load (see the note at the top) ---- */
    let io = null;
    const mode = opts.autoload || 'visible';
    if (mode === 'now') start();
    else if (mode === 'tap' || slowConnection()) {
      spinner.hidden = true;
      loadText.textContent = mode === 'tap' ? 'The 3D model loads when you ask for it.'
        : 'Your connection looks slow or data-saving, so the 3D model waits until you ask for it. Everything else on this page works without it.';
      loadBtn.hidden = false;
    } else if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { io.disconnect(); io = null; start(); }
      }, { rootMargin: '300px 0px' });
      io.observe(el);
    } else start();

    if (infoEl) infoEl.innerHTML = placeholder;
    renderList();
    const focusKey = resolve(opts.focus);
    // After mount() returns, so an onSelect handler can already use the
    // returned viewer (the body map's ?focus= threw here before 2026-10-27).
    if (focusKey) Promise.resolve().then(() => { if (!destroyed && !selectedGroupKey) selectGroup(focusKey, 'focus'); });

    const api = {
      el,
      /* Select and frame a structure by Browse-by-name label or key. Returns the key, or null if unknown. */
      select(name){ const k = resolve(name); if (k) selectGroup(k, 'focus'); return k; },
      find: resolve,
      clear,
      reset,
      selected(){ return selectedGroupKey; },
      /* A softer glow on several structures at once, without selecting; [] clears. */
      highlight(names){
        const keys = (Array.isArray(names) ? names : [names]).map(resolve).filter(Boolean);
        const old = highlighted;
        highlighted = keys;
        if (L) old.forEach(k => { if (k !== selectedGroupKey) for (const m of meshByGroup[k] || []) restore(m); });
        if (L) keys.forEach(k => { if (k !== selectedGroupKey) highlightGroup(k, 0.35); });
        return keys;
      },
      setSystems(list){ activeSystems = new Set(list || ALL_SYSTEMS); applyLayers(); emit('layers', api.layers()); },
      /* The structures in play (keys or names); null = all. Others stay as a faint ghost. */
      setOnly(list){ onlySet = list ? new Set(list.map(resolve).filter(Boolean)) : null; applyLayers(); emit('layers', api.layers()); },
      inPlay(name){ const k = resolve(name); return !!k && inPlay(k); },
      /* Color structures by result: { name: 'good' | 'bad' | 'accent' }; {} clears. */
      marks(map){
        const old = markMap; markMap = {};
        for (const n in (map || {})) { const k = resolve(n); if (k) markMap[k] = map[n]; }
        if (L) for (const k of new Set(Object.keys(old).concat(Object.keys(markMap)))) if (k !== selectedGroupKey) for (const m of meshByGroup[k] || []) restore(m);
        kick();
      },
      /* Canvas picks select (explore) or only report (a quiz). */
      setPickSelects(on){ pickSelects = !!on; },
      /* Fly to frame several structures (null: the whole body). */
      frame(names){
        if (!camera) return;
        if (!names) { animateCamera(new L.THREE.Vector3(...HOME_POS), new L.THREE.Vector3(...HOME_TARGET), 650); return; }
        const box = new L.THREE.Box3(); let has = false;
        for (const k of names.map(resolve).filter(Boolean)) {
          const b = groupBounds(k); if (!b) continue;
          const bb = new L.THREE.Box3().setFromCenterAndSize(b.center, b.size);
          if (!has) { box.copy(bb); has = true; } else box.union(bb);
        }
        if (!has) return;
        const c = new L.THREE.Vector3(), sz = new L.THREE.Vector3(); box.getCenter(c); box.getSize(sz);
        const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
        const need = Math.max(sz.z, sz.x / Math.max(aspect, 0.3)) * 0.5 / Math.tan(16 * Math.PI / 180);
        const dist = Math.min(Math.max(need * 1.15, 220), 3200);
        animateCamera(new L.THREE.Vector3(c.x, c.y - dist, c.z + dist * 0.12), c, 650);
      },
      /* A floating name tag over the selected structure: text, or null to hide. */
      tag(text){ tagText = text == null ? null : String(text); placeTag(); },
      setSkin(on){ skinOn = !!on; applyLayers(); emit('layers', api.layers()); },
      layers(){ return { systems: Array.from(activeSystems), skin: skinOn }; },
      info(name){ const k = resolve(name); return k ? Object.assign({ key: k }, CONTENT_BY_KEY[k]) : null; },
      structures(all){
        return ENTRIES.filter(([k]) => all || visible(k)).map(([k, c]) => ({ key: k, name: c.name, system: c.system, kind: c.kind }));
      },
      load: start,
      loaded(){ return loaded; },
      on(name, fn){ if (listeners[name]) listeners[name].push(fn); return api; },
      hunt: {
        start(o){ startHunt(o); wireHuntPanel(); return api.hunt; },
        stop(){ stopHunt(); return api.hunt; },
        active(){ return hunt.active; },
        score(){ return { right: hunt.right, total: hunt.total }; },
      },
      destroy(){
        destroyed = true;
        if (io) io.disconnect();
        if (viewIo) viewIo.disconnect();
        themeWatch.disconnect();
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        KICK_ON.forEach(t => window.removeEventListener(t, onKick, { capture: true }));
        if (renderer) renderer.dispose();
      },
    };
    return api;
  }

  /* Module-level lookups read the default content (the NREMT body map's). */
  const D = () => contentOf(window.LevlBodyContent);
  window.LevlBodyViewer = {
    mount,
    get SYSTEM_LABELS(){ return D().systems || {}; },
    get systems(){ return D().order.slice(); },
    find(name){ return resolveIn(D(), name); },
    info(name){ const C = D(), k = resolveIn(C, name); return k ? Object.assign({ key: k }, C.byKey[k]) : null; },
    structures(){ return D().entries.map(([k, c]) => ({ key: k, name: c.name, system: c.system, kind: c.kind })); },
  };
})();
