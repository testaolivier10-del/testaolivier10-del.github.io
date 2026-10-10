/* Browser half of scripts/build-body-figures.mjs: renders the BodyParts3D
   model (nremt/assets/body3d.glb) into flat figures and measures them.

   Runs in headless chromium (the driver serves the repo at http://fig.local/).
   window.renderFigures() resolves to { figures: { name: { webp, w, h, outline,
   regions, landmarks, ... } } }.

   Pipeline per figure:
     1. The skin mesh (FMA7163) is only ~2,200 vertices and has torn,
        overlapping triangles at the hands and feet. Its faces are de-duplicated,
        smoothed (Taubin, so it does not shrink; much harder at the extremities),
        and subdivided twice, so it shades as a body and not as facets.
     2. It is rendered orthographically, front or back, with soft studio light.
     3. The alpha is cleaned in 2D: an opening removes slivers, a closing fills
        tears, small islands are dropped and the few pixels the closing adds are
        inpainted from their neighbours.
     4. The clean silhouette is traced to an SVG path (the crisp outline and the
        clip for every overlay region).
     5. Landmarks are taken from the skeleton and organ meshes in 3D (rib ends,
        sternum, clavicles, scapulae, vertebrae, pelvis) and projected with the
        same camera, so overlays are placed by data, not by eye.
     6. Chest views add the ribs, costal cartilages, sternum, clavicles and
        heart (back: scapulae, spine and ribs) faintly under the skin. */
import * as THREE from 'three';
import { GLTFLoader } from '/nremt/assets/vendor/three/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '/nremt/assets/vendor/three/libs/meshopt_decoder.module.js';
import { mergeVertices } from '/nremt/assets/vendor/three/utils/BufferGeometryUtils.js';

/* ---- names (FMA ids, as in body-viewer.js PART_GROUP_MAP) ---------------- */
const RIB_R = ['FMA7857','FMA7882','FMA7909','FMA7957','FMA8066','FMA8175','FMA8229','FMA8283','FMA8364','FMA8445','FMA8531','FMA8533'];
const RIB_L = ['FMA7987','FMA8012','FMA8039','FMA8148','FMA8093','FMA8202','FMA8256','FMA8310','FMA8391','FMA8472','FMA8532','FMA8534'];
const CARTILAGE = ['BP24','BP28','FMA7886','FMA8031','FMA8248','FMA8275'];
const STERNUM = 'FMA7487', CLAV_R = 'FMA13322', CLAV_L = 'FMA13323', SCAP_R = 'FMA13395', SCAP_L = 'FMA13396';
const HEART = ['FMA7274','FMA9352nsn','FMA7266','FMA7260','FMA7261','FMA7262','FMA71669','FMA71670','FMA4706','FMA4685','FMA3802','FMA3818','FMA76751'];
const T_SPINE = ['FMA9165','FMA9187','FMA9209','FMA9248','FMA9922','FMA9945','FMA9968','FMA9991','FMA10014','FMA10037','FMA10059','FMA10081'];
const C_SPINE = ['FMA12521','FMA12522','FMA12523','FMA12524','FMA12525'];
const HIP_R = 'FMA16586', HIP_L = 'FMA16587', MANDIBLE = 'FMA52748', T12 = 'FMA10081', L3 = 'FMA13074';

/* ---- mesh helpers -------------------------------------------------------- */
function subdivide(P, I){
  const pos = P.slice(), idx = [], mid = new Map();
  const m = (a, b) => {
    const k = a < b ? a * 1e7 + b : b * 1e7 + a;
    let v = mid.get(k);
    if(v === undefined){ v = pos.length / 3; pos.push((pos[a*3] + pos[b*3]) / 2, (pos[a*3+1] + pos[b*3+1]) / 2, (pos[a*3+2] + pos[b*3+2]) / 2); mid.set(k, v); }
    return v;
  };
  for(let t = 0; t < I.length; t += 3){
    const a = I[t], b = I[t+1], c = I[t+2], ab = m(a, b), bc = m(b, c), ca = m(c, a);
    idx.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }
  return [pos, idx];
}
function taubin(P, I, iters, wfn){
  const n = P.length / 3, nb = Array.from({ length:n }, () => new Set());
  for(let t = 0; t < I.length; t += 3){
    const a = I[t], b = I[t+1], c = I[t+2];
    nb[a].add(b); nb[a].add(c); nb[b].add(a); nb[b].add(c); nb[c].add(a); nb[c].add(b);
  }
  const N = nb.map(s => [...s]);
  const W = wfn ? Array.from({ length:n }, (_, i) => wfn(P[i*3], P[i*3+1], P[i*3+2])) : null;
  let cur = Float64Array.from(P);
  for(let it = 0; it < iters * 2; it++){
    const f0 = it % 2 ? -0.53 : 0.5, nx = new Float64Array(cur.length);
    for(let i = 0; i < n; i++){
      const L = N[i], f = W ? f0 * W[i] : f0;
      if(!L.length || !f){ nx[i*3] = cur[i*3]; nx[i*3+1] = cur[i*3+1]; nx[i*3+2] = cur[i*3+2]; continue; }
      let x = 0, y = 0, z = 0;
      for(const j of L){ x += cur[j*3]; y += cur[j*3+1]; z += cur[j*3+2]; }
      x /= L.length; y /= L.length; z /= L.length;
      nx[i*3] = cur[i*3] + f * (x - cur[i*3]); nx[i*3+1] = cur[i*3+1] + f * (y - cur[i*3+1]); nx[i*3+2] = cur[i*3+2] + f * (z - cur[i*3+2]);
    }
    cur = nx;
  }
  return Array.from(cur);
}
function worldPositions(mesh){
  const p = mesh.geometry.attributes.position, v = new THREE.Vector3(), out = new Float32Array(p.count * 3);
  for(let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld); out[i*3] = v.x; out[i*3+1] = v.y; out[i*3+2] = v.z; }
  return out;
}

/* A child's proportions from the adult body: a larger head and shorter legs
   (the arms are left alone, so the hands come to mid-thigh). Used for the
   pediatric figures; landmarks go through the same function. */
function childWarp(x, y, z){
  const s = 1.3, base = 1440, blend = 30;
  if(z > base - blend){
    const t = Math.min(1, (z - (base - blend)) / blend), k = 1 + (s - 1) * t * t * (3 - 2 * t);
    const cy = -20;
    x = x * k; y = cy + (y - cy) * k; z = (base - blend) + (z - (base - blend)) * k;
  }
  const hip = 880;
  if(z < hip) z = hip - (hip - z) * 0.74;
  return [x, y, z];
}

function skinGeometry(mesh, warp){
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(worldPositions(mesh), 3));
  geo.setIndex(Array.from(mesh.geometry.index.array));
  geo = mergeVertices(geo, 0.5);
  const I0 = geo.index.array, seen = new Set(), I = [];
  for(let t = 0; t < I0.length; t += 3){
    const a = I0[t], b = I0[t+1], c = I0[t+2];
    if(a === b || b === c || a === c) continue;
    const k = [a, b, c].sort((p, q) => p - q).join('_');
    if(seen.has(k)) continue;
    seen.add(k); I.push(a, b, c);
  }
  let P = Array.from(geo.attributes.position.array), J = I;
  // hands (below the wrists, out at the sides) and feet are torn: smooth them hard
  // the hands, feet, face and genitals are where the coarse mesh reads worst:
  // they are smoothed to a clean mannequin form, the rest only lightly
  const ext = (x, y, z) => ((z < 900 && Math.abs(x) > 195) || z < 110) ? 1
    : (Math.abs(x) < 70 && y < 0 && z > 700 && z < 860) ? 0.6 : 0;
  P = taubin(P, J, 30, ext);
  P = taubin(P, J, 3);
  if(warp) for(let i = 0; i < P.length; i += 3){ const w = warp(P[i], P[i+1], P[i+2]); P[i] = w[0]; P[i+1] = w[1]; P[i+2] = w[2]; }
  [P, J] = subdivide(P, J); P = taubin(P, J, 6);
  [P, J] = subdivide(P, J); P = taubin(P, J, 4);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(J); g.computeVertexNormals();
  return g;
}
function partGeometry(mesh, warp){
  const P = worldPositions(mesh);
  if(warp) for(let i = 0; i < P.length; i += 3){ const w = warp(P[i], P[i+1], P[i+2]); P[i] = w[0]; P[i+1] = w[1]; P[i+2] = w[2]; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setIndex(mesh.geometry.index);
  g.computeVertexNormals();
  return g;
}

/* ---- camera and rendering ------------------------------------------------ */
function makeView(frame, side, pxPerMm){
  const w = Math.round((frame.x1 - frame.x0) * pxPerMm / 2) * 2, h = Math.round((frame.z1 - frame.z0) * pxPerMm / 2) * 2;
  // front: camera at -y, viewer's right is +x (the patient's left); back: the reverse
  const P = (x, z) => [ (side === 'front' ? x - frame.x0 : frame.x1 - x) / (frame.x1 - frame.x0) * w, (frame.z1 - z) / (frame.z1 - frame.z0) * h ];
  const X = u => side === 'front' ? frame.x0 + u / w * (frame.x1 - frame.x0) : frame.x1 - u / w * (frame.x1 - frame.x0);
  const Z = v => frame.z1 - v / h * (frame.z1 - frame.z0);
  return { frame, side, w, h, P, X, Z, k: w / (frame.x1 - frame.x0) };
}
let renderer;
function renderMeshes(view, meshes, light){
  const SS = 2, W = view.w * SS, H = view.h * SS;
  if(!renderer){
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMappingExposure = light.exposure || 1.0;
  const scene = new THREE.Scene();
  meshes.forEach(m => scene.add(m));
  const f = view.frame, s = view.side === 'front' ? -1 : 1;
  const cam = view.side === 'front'
    ? new THREE.OrthographicCamera(f.x0, f.x1, f.z1, f.z0, 1, 8000)
    : new THREE.OrthographicCamera(-f.x1, -f.x0, f.z1, f.z0, 1, 8000);
  cam.up.set(0, 0, 1); cam.position.set(0, s * 3000, 0); cam.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(light.sky || 0xfff6ee, light.ground || 0x6e5246, light.hemi || 1.45));
  // key from upper viewer-left, a cool rim from behind the other side, a low warm fill
  const key = new THREE.DirectionalLight(0xffffff, light.key || 2.1); key.position.set(-700 * -s, s * 1400, 2300); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe9ff, light.rim || 1.1); rim.position.set(1100 * -s, -s * 900, 1500); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe6d6, light.fill || 0.55); fill.position.set(900 * -s, s * 1600, 300); scene.add(fill);
  renderer.render(scene, cam);
  const c = document.createElement('canvas'); c.width = view.w; c.height = view.h;
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  x.drawImage(renderer.domElement, 0, 0, view.w, view.h);
  return c;
}

/* ---- 2D mask work -------------------------------------------------------- */
function morph(src, w, h, r, dilate){
  // separable square min/max filter on a 0/1 array
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    let v = dilate ? 0 : 1;
    for(let d = -r; d <= r; d++){ const xx = x + d; const s = xx < 0 || xx >= w ? 0 : src[y*w + xx]; if(dilate ? s : !s){ v = dilate ? 1 : 0; break; } }
    tmp[y*w + x] = v;
  }
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    let v = dilate ? 0 : 1;
    for(let d = -r; d <= r; d++){ const yy = y + d; const s = yy < 0 || yy >= h ? 0 : tmp[yy*w + x]; if(dilate ? s : !s){ v = dilate ? 1 : 0; break; } }
    out[y*w + x] = v;
  }
  return out;
}
function components(m, w, h){
  const lab = new Int32Array(w * h), sizes = [0];
  let n = 0;
  for(let i = 0; i < w * h; i++){
    if(!m[i] || lab[i]) continue;
    n++; let size = 0; const st = [i]; lab[i] = n;
    while(st.length){
      const p = st.pop(); size++;
      const x = p % w, y = (p / w) | 0;
      for(const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1])
        if(q >= 0 && m[q] && !lab[q]){ lab[q] = n; st.push(q); }
    }
    sizes.push(size);
  }
  return { lab, sizes };
}
function fillHoles(m, w, h){
  // background reachable from the border stays background; everything else is body
  const bg = new Uint8Array(w * h), st = [];
  for(let x = 0; x < w; x++){ st.push(x, (h - 1) * w + x); }
  for(let y = 0; y < h; y++){ st.push(y * w, y * w + w - 1); }
  while(st.length){
    const p = st.pop();
    if(bg[p] || m[p]) continue;
    bg[p] = 1;
    const x = p % w, y = (p / w) | 0;
    if(x > 0) st.push(p - 1); if(x < w - 1) st.push(p + 1); if(y > 0) st.push(p - w); if(y < h - 1) st.push(p + w);
  }
  const out = new Uint8Array(w * h);
  for(let i = 0; i < w * h; i++) out[i] = bg[i] ? 0 : 1;
  return out;
}
function cleanSilhouette(canvas, opts){
  const w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  let m = new Uint8Array(w * h);
  for(let i = 0; i < w * h; i++) m[i] = d[i*4+3] > 110 ? 1 : 0;
  const r = opts.open || 2;
  m = morph(morph(m, w, h, r, false), w, h, r, true);        // opening: slivers go
  m = morph(morph(m, w, h, 2, true), w, h, 2, false);        // closing: tears shut
  const { lab, sizes } = components(m, w, h);
  const total = sizes.reduce((a, b) => a + b, 0);
  for(let i = 0; i < w * h; i++) if(m[i] && sizes[lab[i]] < total * 0.004) m[i] = 0;
  m = fillHoles(m, w, h);
  // inpaint: pixels the mask adds take the mean of known neighbours
  const known = new Uint8Array(w * h);
  for(let i = 0; i < w * h; i++) known[i] = m[i] && d[i*4+3] > 200 ? 1 : 0;
  for(let pass = 0; pass < 40; pass++){
    let changed = 0;
    for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
      const i = y * w + x;
      if(!m[i] || known[i]) continue;
      let R = 0, G = 0, B = 0, n = 0;
      for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
        const xx = x + dx, yy = y + dy; if(xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx; if(known[j] === 1){ R += d[j*4]; G += d[j*4+1]; B += d[j*4+2]; n++; }
      }
      if(n){ d[i*4] = R / n; d[i*4+1] = G / n; d[i*4+2] = B / n; known[i] = 2; changed++; }
    }
    for(let i = 0; i < w * h; i++) if(known[i] === 2) known[i] = 1;
    if(!changed) break;
  }
  // soft 1px edge from the clean mask
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    const i = y * w + x;
    let s = 0;
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
      const xx = x + dx, yy = y + dy; s += (xx >= 0 && yy >= 0 && xx < w && yy < h && m[yy*w + xx]) ? 1 : 0;
    }
    d[i*4+3] = m[i] ? Math.round(255 * Math.min(1, s / 7)) : Math.round(255 * Math.max(0, (s - 3) / 12));
  }
  ctx.putImageData(img, 0, 0);
  return m;
}

/* Moore-neighbour outer boundary of every component, simplified (RDP). */
function trace(m, w, h, eps){
  const { lab, sizes } = components(m, w, h), done = new Set(), paths = [];
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y*w + x];
  const DIRS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  for(let i = 0; i < w * h; i++){
    if(!m[i] || done.has(lab[i])) continue;
    done.add(lab[i]);
    if(sizes[lab[i]] < 30) continue;
    // Moore-neighbour tracing (clockwise, y down), backtrack kept as a point
    const sx = i % w, sy = (i / w) | 0, pts = [[sx, sy]];
    let c = [sx, sy], bk = [sx - 1, sy], guard = 0;
    while(guard++ < 400000){
      const k = DIRS.findIndex(d => d[0] === bk[0] - c[0] && d[1] === bk[1] - c[1]);
      let next = null;
      for(let j = 1; j <= 8; j++){
        const d = DIRS[(k + j) % 8], n = [c[0] + d[0], c[1] + d[1]];
        if(at(n[0], n[1])){ const pd = DIRS[(k + j - 1) % 8]; bk = [c[0] + pd[0], c[1] + pd[1]]; next = n; break; }
      }
      if(!next) break;
      c = next;
      if(c[0] === sx && c[1] === sy) break;
      pts.push(c);
    }
    paths.push(rdp(pts.map(p => [p[0] + 0.5, p[1] + 0.5]), eps));
  }
  return paths;
}
function rdp(pts, eps){
  if(pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while(st.length){
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], L = Math.hypot(bx - ax, by - ay) || 1;
    for(let i = a + 1; i < b; i++){
      const dd = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L;
      if(dd > md){ md = dd; mi = i; }
    }
    if(md > eps){ keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const r1 = n => Math.round(n * 10) / 10;
function pathD(polys){ return polys.map(p => 'M' + p.map(q => r1(q[0]) + ' ' + r1(q[1])).join('L') + 'Z').join(''); }

/* ---- landmark measurements ------------------------------------------------ */
function bbox(P){
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for(let i = 0; i < P.length; i += 3) for(let c = 0; c < 3; c++){ lo[c] = Math.min(lo[c], P[i+c]); hi[c] = Math.max(hi[c], P[i+c]); }
  return { lo, hi };
}
function pts(P){ const o = []; for(let i = 0; i < P.length; i += 3) o.push([P[i], P[i+1], P[i+2]]); return o; }
/* The anterior end of a rib: its points in front of the chest wall nearest the midline. */
function ribFront(P){
  const p = pts(P).filter(v => v[1] < -30).sort((a, b) => Math.abs(a[0]) - Math.abs(b[0])).slice(0, 15);
  if(!p.length) return null;
  return [p[0][0], p.reduce((s, v) => s + v[2], 0) / p.length];
}
/* z of a rib's lower/upper edge where it crosses a vertical line x (front surface). */
function ribAtX(P, x, back){
  const p = pts(P).filter(v => Math.abs(v[0] - x) < 6 && (back ? v[1] > 20 : v[1] < -20));
  if(!p.length) return null;
  const z = p.map(v => v[2]); return [Math.min(...z), Math.max(...z)];
}

/* ======================================================================= */
window.renderFigures = async function(){
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync('/nremt/assets/body3d.glb');
  gltf.scene.updateMatrixWorld(true);
  const M = {};
  gltf.scene.traverse(o => { if(o.isMesh) M[o.name] = o; });
  const W = {}; for(const k in M) W[k] = worldPositions(M[k]);
  const B = k => bbox(W[k]);

  /* ---- 3D landmarks (adult, mm, model space: +x patient's left, -y front, +z up) */
  const ribR = RIB_R.map(k => ribFront(W[k])), ribL = RIB_L.map(k => ribFront(W[k]));
  const clavL = B(CLAV_L), clavR = B(CLAV_R), st = B(STERNUM);
  const mclL = (clavL.lo[0] + clavL.hi[0]) / 2, mclR = (clavR.lo[0] + clavR.hi[0]) / 2;
  const clavMedialZ = (pts(W[CLAV_L]).sort((a, b) => a[0] - b[0])[0][2] + pts(W[CLAV_R]).sort((a, b) => b[0] - a[0])[0][2]) / 2;
  const acromL = pts(W[CLAV_L]).sort((a, b) => b[0] - a[0])[0], acromR = pts(W[CLAV_R]).sort((a, b) => a[0] - b[0])[0];
  // sternal border: the sternum's half-width at ICS 2-5 height
  const stPts = pts(W[STERNUM]);
  const stHalf = z => { const p = stPts.filter(v => Math.abs(v[2] - z) < 6); return p.length ? (Math.max(...p.map(v => v[0])) - Math.min(...p.map(v => v[0]))) / 2 : 20; };
  // intercostal space n at the sternal border: midway between ribs n and n+1 where they meet the front
  const ics = n => ((ribR[n-1][1] + ribR[n][1]) / 2 + (ribL[n-1][1] + ribL[n][1]) / 2) / 2;
  // intercostal space 5 at the left midclavicular line, from the ribs crossing that line
  const r5 = ribAtX(W[RIB_L[4]], mclL), r6 = ribAtX(W[RIB_L[5]], mclL);
  const r1z = ribAtX(W[RIB_L[0]], mclL) || [ribL[0][1], ribL[0][1]];
  const ics5mcl = (r5[0] + r6[1]) / 2;
  const scapL = pts(W[SCAP_L]), scapR = pts(W[SCAP_R]);
  const infAngle = p => p.slice().sort((a, b) => a[2] - b[2])[0];
  const medBorder = (p, sgn) => { const q = p.filter(v => v[2] > 1250 && v[2] < 1340); return q.sort((a, b) => sgn * (a[0] - b[0]))[0]; };
  const hipR = pts(W[HIP_R]), hipL = pts(W[HIP_L]);
  const asisR = hipR.filter(v => v[2] > 880).sort((a, b) => a[1] - b[1])[0];
  const crest = Math.max(B(HIP_R).hi[2], B(HIP_L).hi[2]);
  const pubis = hipR.filter(v => Math.abs(v[0]) < 25).sort((a, b) => a[1] - b[1])[0];
  const ischial = Math.min(B(HIP_R).lo[2], B(HIP_L).lo[2]);
  const t12 = B(T12), l3 = B(L3), mand = B(MANDIBLE), heart = { lo:[Infinity,Infinity,Infinity], hi:[-Infinity,-Infinity,-Infinity] };
  HEART.forEach(k => { if(!W[k]) return; const b = B(k); for(let c = 0; c < 3; c++){ heart.lo[c] = Math.min(heart.lo[c], b.lo[c]); heart.hi[c] = Math.max(heart.hi[c], b.hi[c]); } });

  // midaxillary line, lower ribs: the lateral-most point of the 7th rib, just inside the chest wall
  const latR = pts(W[RIB_R[6]]).sort((a, b) => a[0] - b[0])[0], latL = pts(W[RIB_L[6]]).sort((a, b) => b[0] - a[0])[0];
  const L3D = {
    midaxR: [latR[0] + 6, latR[2] - 6], midaxL: [latL[0] - 6, latL[2] - 6],
    chin: [0, mand.lo[2]],
    sternalNotch: [0, clavMedialZ],
    sternalAngle: [0, st.hi[2]],
    xiphoid: [0, st.lo[2]],
    acromionR: [acromR[0], acromR[2]], acromionL: [acromL[0], acromL[2]],
    clavicleMidR: [mclR, (clavR.lo[2] + clavR.hi[2]) / 2], clavicleMidL: [mclL, (clavL.lo[2] + clavL.hi[2]) / 2],
    ics2: ics(2), ics3: ics(3), ics4: ics(4), ics5: ics(5), ics5mclL: ics5mcl,
    sternalHalf: stHalf(ics(3)), mclR, mclL,
    rib1mcl: (r1z[0]),
    heartApex: [heart.hi[0] - 6, heart.lo[2] + 8],
    costalMargin: (ribR[7][1] + ribL[7][1]) / 2,
    t12l1: t12.lo[2], umbilicus: [0, (l3.lo[2] + l3.hi[2]) / 2],
    iliacCrest: crest, asisR: [asisR[0], asisR[2]], asisL: [-asisR[0], asisR[2]],
    pubis: [0, pubis[2]], ischial,
    scapInfL: infAngle(scapL), scapInfR: infAngle(scapR),
    scapMedL: medBorder(scapL, 1), scapMedR: medBorder(scapR, -1)
  };

  const skinMesh = M.FMA7163;
  const skinMat = () => new THREE.MeshPhysicalMaterial({ color:0xeec4a6, roughness:0.72, sheen:0.5, sheenColor:new THREE.Color(0xffdcc8), sheenRoughness:0.6, specularIntensity:0.25 });
  const geoCache = {};
  const skinFor = variant => geoCache[variant] || (geoCache[variant] = skinGeometry(skinMesh, variant === 'child' ? childWarp : null));

  const out = {};

  /* ---- full figures (burns, scenario) ----------------------------------- */
  for(const variant of ['adult', 'child']){
    const warp = variant === 'child' ? childWarp : (x, y, z) => [x, y, z];
    const wp = (x, z) => { const r = warp(x, -60, z); return [r[0], r[2]]; };
    const geo = skinFor(variant);
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const frame = { x0: -338, x1: 338, z0: bb.min.z - 10, z1: bb.max.z + 10 };
    const pxPerMm = 1200 / (frame.z1 - frame.z0);
    for(const side of ['front', 'back']){
      const view = makeView(frame, side, pxPerMm);
      const raw = renderMeshes(view, [new THREE.Mesh(geo, skinMat())], {});
      const zones = {
        head: view.P(0, warp(0, 0, 1452)[2])[1],
        feet: view.P(0, warp(0, 0, 120)[2])[1],
        wrist: view.P(0, warp(0, 0, 905)[2])[1],
        chin: view.P(0, warp(0, 0, L3D.chin[1])[2])[1],
        top: view.P(0, bb.max.z)[1],
        handX: [view.P(side === 'front' ? -200 : 200, 0)[0], view.P(side === 'front' ? 200 : -200, 0)[0]]
      };
      const { canvas: cv, mask } = stylize(raw, view, zones);
      const outline = trace(mask, view.w, view.h, 1.0);
      const geom = measureMask(mask, view, wp, L3D);
      const regions = buildRegions(view, geom, wp, L3D, side);
      const name = variant + '-' + side;
      const lmOut = {};
      for(const [k, v] of Object.entries(L3D)) if(Array.isArray(v) && v.length === 2 && typeof v[0] === 'number'){
        const q = wp(v[0], v[1]), p = view.P(q[0], q[1]); lmOut[k] = [r1(p[0]), r1(p[1])];
      }
      out[name] = {
        w: view.w, h: view.h, webp: cv.toDataURL('image/webp', 0.82),
        outline: pathD(outline),
        // a generous tap area: the silhouette grown by ~2.5% of the height, so thin limbs stay tappable on a phone
        hitOutline: pathD(trace(morph(mask, view.w, view.h, 26, true), view.w, view.h, 2.0)),
        regions: regions.paths, anchors: anchorsFor(regions.paths, mask, view),
        lines: Object.fromEntries(Object.entries(regions.lines).map(([k, v]) => [k, r1(v)])),
        landmarks: lmOut
      };
    }
  }

  /* ---- chest views (sound trainer) ------------------------------------------ */
  {
    const geo = skinFor('adult');
    const frame = { x0: -200, x1: 200, z0: 1040, z1: 1484 };
    const pxPerMm = 600 / 400;
    const boneMat = new THREE.MeshStandardMaterial({ color:0xf3e9d6, roughness:0.85 , side:THREE.DoubleSide });
    const cartMat = new THREE.MeshStandardMaterial({ color:0xd8e6ea, roughness:0.8 , side:THREE.DoubleSide });
    const heartMat = new THREE.MeshStandardMaterial({ color:0xc9473c, roughness:0.7 , side:THREE.DoubleSide });
    const part = (names, mat) => names.filter(k => M[k]).map(k => new THREE.Mesh(partGeometry(M[k]), mat));
    for(const side of ['front', 'back']){
      const view = makeView(frame, side, pxPerMm);
      const skin = renderMeshes(view, [new THREE.Mesh(geo, skinMat())], {});
      const mask = cleanSilhouette(skin, { open: 3 });
      { // symmetric, as in the full figures: the mesh has a flap on one shoulder
        const w = view.w, h = view.h, c = new Uint8Array(mask), x2 = skin.getContext('2d'), im = x2.getImageData(0, 0, w, h);
        for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const i = y * w + x; mask[i] = c[i] && c[y*w + w - 1 - x]; if(!mask[i]) im.data[i*4+3] = 0; }
        x2.putImageData(im, 0, 0);
      }
      const bones = side === 'front'
        ? part(RIB_R.concat(RIB_L, [STERNUM, CLAV_R, CLAV_L]), boneMat).concat(part(CARTILAGE, cartMat))
        : part(RIB_R.concat(RIB_L, T_SPINE, C_SPINE, [SCAP_R, SCAP_L, CLAV_R, CLAV_L]), boneMat);
      const boneCv = renderMeshes(view, bones, { hemi:0.9, key:2.6, rim:0.5, fill:0.3, exposure:1.0 });
      const heartCv = side === 'front' ? renderMeshes(view, part(HEART, heartMat), { hemi:1.4, key:1.4, rim:0.3, fill:0.3 }) : null;
      composeAnatomy(skin, boneCv, heartCv, side);
      const outline = trace(mask, view.w, view.h, 0.75);
      const P = (x, z) => view.P(x, z).map(r1);
      // site positions, in image pixels, from the landmarks above
      const sh = L3D.sternalHalf + 2;
      const ap = L3D.ics4 - (L3D.ics4 - L3D.ics5) * 0.5;
      // the midaxillary line in a front view is the chest's own edge: measure it at the base level
      const lm = side === 'front' ? {
        trachea: P(0, (L3D.sternalNotch[1] + L3D.chin[1]) / 2 - 8),
        aortic: P(-sh, L3D.ics2), pulmonic: P(sh, L3D.ics2), erb: P(sh, L3D.ics3),
        tricuspid: P(sh, ap), mitral: P(L3D.mclL, L3D.ics5mclL),
        'lung-ru': P(L3D.mclR, L3D.rib1mcl - 16), 'lung-lu': P(L3D.mclL, L3D.rib1mcl - 16),
        'lung-rl': P(L3D.midaxR[0], L3D.midaxR[1]), 'lung-ll': P(L3D.midaxL[0], L3D.midaxL[1]),
        sternumX: r1(view.P(0, 0)[0]), sternalHalfPx: r1(L3D.sternalHalf * view.k),
        icsY: { 2: P(0, L3D.ics2)[1], 3: P(0, L3D.ics3)[1], 4: P(0, L3D.ics4)[1], 5: P(0, L3D.ics5)[1] },
        mclX: [P(L3D.mclR, 0)[0], P(L3D.mclL, 0)[0]], mclTop: P(0, L3D.clavicleMidL[1] - 6)[1], mclBottom: P(0, L3D.costalMargin - 10)[1],
        sternalAngle: P(0, L3D.sternalAngle[1]), xiphoid: P(0, L3D.xiphoid[1]), sternalNotch: P(0, L3D.sternalNotch[1])
      } : {
        'back-lu': P(L3D.scapMedL[0] * 0.72, L3D.scapMedL[2] - 8), 'back-ru': P(L3D.scapMedR[0] * 0.72, L3D.scapMedR[2] - 8),
        'back-ll': P(L3D.scapInfL[0] - 4, L3D.scapInfL[2] - 42), 'back-rl': P(L3D.scapInfR[0] + 4, L3D.scapInfR[2] - 42),
        spineX: r1(view.P(0, 0)[0]), scapInfY: P(0, L3D.scapInfL[2])[1]
      };
      out['chest-' + side] = { w: view.w, h: view.h, webp: skin.toDataURL('image/webp', 0.84), outline: pathD(outline), landmarks: lm };
    }
  }
  out._landmarks3d = L3D;
  return out;
};

function chestEdges(mask, view, z){
  const v = Math.round(view.P(0, z)[1]), cx = Math.round(view.w / 2), row = v * view.w;
  let l = cx, r = cx;
  while(l > 0 && mask[row + l - 1]) l--;
  while(r < view.w - 1 && mask[row + r + 1]) r++;
  return [l, r];
}

/* Bones and heart faintly under the skin: kept inside the silhouette, pale
   and thin-edged like a textbook "ghosted" skeleton. */
function composeAnatomy(skin, bone, heart, side){
  const w = skin.width, h = skin.height, ctx = skin.getContext('2d');
  const layer = (src, alpha, op) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(skin, 0, 0);
    ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = op; ctx.drawImage(c, 0, 0); ctx.restore();
  };
  if(heart) layer(heart, 0.3, 'multiply');
  // edge darkening of the bones: an outline from the bone alpha
  const e = document.createElement('canvas'); e.width = w; e.height = h;
  const ex = e.getContext('2d');
  ex.filter = 'blur(1.2px)'; ex.drawImage(bone, 0, 0); ex.filter = 'none';
  ex.globalCompositeOperation = 'source-in'; ex.fillStyle = '#7d5a48'; ex.fillRect(0, 0, w, h);
  ex.globalCompositeOperation = 'destination-out'; ex.drawImage(bone, 0, 0);
  layer(e, 0.34, 'multiply');
  layer(bone, 0.5, 'soft-light');
  layer(bone, side === 'front' ? 0.2 : 0.16, 'screen');
  // a cut-away: fade the crop at the top (the jaw) and bottom into transparency
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.1, 'rgba(0,0,0,1)'); g.addColorStop(0.9, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
}

/* ---- the illustrated figure ----------------------------------------------
   The skin mesh's head, hands and feet are too coarse to shade well, so the
   figure is built in 2D: a clean silhouette (the hands and feet rounded off
   by blurring the mask there), shaded by "inflation" (a smooth round
   cross-section from the distance to the edge), with the mesh's own light
   and shadow blended in over the trunk and limbs where it is good. The head
   is a smooth mannequin head with no face, as in a Rule of Nines chart. */
function edt1d(f, n){
  const d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for(let q = 1; q < n; q++){
    let s;
    while(true){ const r = v[k]; s = ((f[q] + q * q) - (f[r] + r * r)) / (2 * q - 2 * r); if(s <= z[k]){ k--; if(k < 0){ k = 0; break; } } else break; }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for(let q = 0; q < n; q++){ while(z[k + 1] < q) k++; const r = v[k]; d[q] = (q - r) * (q - r) + f[r]; }
  return d;
}
function edt(mask, w, h){
  // distance from each inside pixel to the nearest outside pixel
  const INF = 1e12, g = new Float64Array(w * h);
  for(let i = 0; i < w * h; i++) g[i] = mask[i] ? INF : 0;
  const col = new Float64Array(h);
  for(let x = 0; x < w; x++){ for(let y = 0; y < h; y++) col[y] = g[y*w + x]; const d = edt1d(col, h); for(let y = 0; y < h; y++) g[y*w + x] = d[y]; }
  const row = new Float64Array(w);
  for(let y = 0; y < h; y++){ for(let x = 0; x < w; x++) row[x] = g[y*w + x]; const d = edt1d(row, w); for(let x = 0; x < w; x++) g[y*w + x] = Math.sqrt(d[x]); }
  return g;
}
function blurF(a, w, h, r, passes){
  let src = Float32Array.from(a), tmp = new Float32Array(w * h);
  for(let p = 0; p < (passes || 3); p++){
    for(let y = 0; y < h; y++){ let acc = 0; const o = y * w;
      for(let x = -r; x <= r; x++) acc += src[o + Math.min(w - 1, Math.max(0, x))];
      for(let x = 0; x < w; x++){ tmp[o + x] = acc / (2 * r + 1); acc += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; } }
    for(let x = 0; x < w; x++){ let acc = 0;
      for(let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for(let y = 0; y < h; y++){ src[y*w + x] = acc / (2 * r + 1); acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
  }
  return src;
}
const smooth = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
function poisson(mask, w, h){
  // multigrid-lite: Jacobi at 1/8, 1/4, 1/2 and full size, each seeded by the last
  const levels = [8, 4, 2, 1];
  let prev = null, pw = 0, ph = 0;
  for(const f of levels){
    const W = Math.ceil(w / f), H = Math.ceil(h / f), M = new Uint8Array(W * H);
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      let c = 0, t = 0;
      for(let dy = 0; dy < f; dy++) for(let dx = 0; dx < f; dx++){ const X = x * f + dx, Y = y * f + dy; if(X < w && Y < h){ t++; c += mask[Y*w + X]; } }
      M[y*W + x] = c * 2 > t ? 1 : 0;
    }
    let U = new Float32Array(W * H);
    if(prev) for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) U[y*W + x] = M[y*W + x] ? prev[Math.min(ph - 1, y >> 1) * pw + Math.min(pw - 1, x >> 1)] * 4 : 0;
    const src = f * f, iters = f === 8 ? 1500 : f === 4 ? 300 : f === 2 ? 120 : 60;
    let V = new Float32Array(W * H);
    for(let it = 0; it < iters; it++){
      for(let y = 1; y < H - 1; y++) for(let x = 1; x < W - 1; x++){
        const i = y * W + x;
        V[i] = M[i] ? (U[i-1] + U[i+1] + U[i-W] + U[i+W] + 1) / 4 : 0;
      }
      const t = U; U = V; V = t;
    }
    prev = U; pw = W; ph = H;
  }
  // prev is in full-resolution units already (the source term was 1 per pixel at f = 1)
  return prev;
}
function stylize(raw, view, Z){
  const w = raw.width, h = raw.height, d = raw.getContext('2d').getImageData(0, 0, w, h).data;
  // 1. silhouette
  let m = new Uint8Array(w * h);
  for(let i = 0; i < w * h; i++) m[i] = d[i*4+3] > 110 ? 1 : 0;
  m = morph(morph(m, w, h, 2, false), w, h, 2, true);
  m = morph(morph(m, w, h, 2, true), w, h, 2, false);
  { const { lab, sizes } = components(m, w, h); const big = sizes.indexOf(Math.max(...sizes.slice(1)));
    for(let i = 0; i < w * h; i++) if(m[i] && lab[i] !== big) m[i] = 0; }
  m = fillHoles(m, w, h);
  // the skin mesh has flaps on one side only: keep what both sides agree on
  { const c = new Uint8Array(m); for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) m[y*w + x] = c[y*w + x] && c[y*w + (w - 1 - x)]; }
  // a clean head and neck: an ellipse through the crown and the chin, as wide
  // as the skull, on a neck as wide as the model's, then the corners rounded
  {
    const top = Math.round(Z.top), chin = Math.round(Z.chin);
    let l = w, r = 0;
    for(let y = top; y < chin - (chin - top) * 0.15; y++) for(let x = 0; x < w; x++) if(m[y*w + x]){ l = Math.min(l, x); r = Math.max(r, x); }
    const cx = w / 2, rx = Math.min(r - cx, cx - l) * 0.98, cy = (top + chin + 6) / 2, ry = (chin + 6 - top) / 2;
    const ny = chin + Math.round((chin - top) * 0.2);
    let nl = cx, nr = cx; while(nl > 0 && m[ny*w + nl - 1]) nl--; while(nr < w - 1 && m[ny*w + nr + 1]) nr++;
    const nh = Math.min(rx * 0.72, (nr - nl) / 2);
    // the trapezius: below ys the allowed half-width grows 2.6 px per px, so the model's own shoulder slope stays
    const ys = chin + (chin - top) * 0.06;
    const lim = Math.round(ny + (chin - top) * 2.3);
    for(let y = 0; y <= lim; y++) for(let x = 0; x < w; x++){
      const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2, dx = Math.abs(x - cx);
      const allow = y < cy ? 0 : nh + Math.max(0, y - ys) * 2.6;
      m[y*w + x] = (e <= 1 || (y > cy && dx <= nh) || (m[y*w + x] && dx <= allow)) ? 1 : 0;
    }
    // shoulders: a stronger opening removes the mesh's flaps; a blur rounds the angles
    const o = morph(morph(m, w, h, 8, false), w, h, 8, true);
    for(let i = Math.round(chin) * w; i < lim * w; i++) m[i] = o[i] || (m[i] && Math.abs((i % w) - cx) <= nh + 2);
    const sm = blurF(m, w, h, 6, 2);
    for(let i = Math.round(cy) * w; i < lim * w; i++) m[i] = sm[i] >= 0.5 ? 1 : 0;
  }
  // the feet: thickened gradually, so they end as feet and not points
  {
    for(const [rr, dz] of [[1, 110], [2, 80], [3, 50]]){
      const fd = morph(m, w, h, rr, true), f0 = Math.round(Z.feet - dz);
      for(let i = f0 * w; i < w * h; i++) m[i] = fd[i];
    }
    const sm = blurF(m, w, h, 6, 2), f0 = Math.round(Z.feet - 140);
    for(let i = f0 * w; i < w * h; i++) m[i] = sm[i] >= 0.5 ? 1 : 0;
  }
  // round the hands and feet off: blur the mask there and threshold
  const ext = new Float32Array(w * h);
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    const hand = y > Z.wrist - 20 && (x < Z.handX[0] + 20 || x > Z.handX[1] - 20) ? smooth(Z.wrist - 20, Z.wrist + 10, y) : 0;
    ext[y*w + x] = Math.max(hand, smooth(Z.feet - 30, Z.feet + 10, y));
  }
  const soft = blurF(m, w, h, 3, 3), soft2 = blurF(m, w, h, 1, 2);
  const mf = new Float32Array(w * h);
  for(let i = 0; i < w * h; i++) mf[i] = soft2[i] * (1 - ext[i]) + soft[i] * ext[i];
  for(let i = 0; i < w * h; i++) m[i] = mf[i] >= 0.5 ? 1 : 0;
  { const { lab, sizes } = components(m, w, h); const big = sizes.indexOf(Math.max(...sizes.slice(1)));
    for(let i = 0; i < w * h; i++) if(m[i] && lab[i] !== big) m[i] = 0; }
  // 2. inflation: solve the Poisson equation (laplacian H = -1 inside, 0 outside)
  //    coarse to fine, and take sqrt so each cross-section is round with no ridge
  const dist = edt(m, w, h);
  const Hp = poisson(m, w, h);
  const Hs = new Float32Array(w * h);
  for(let i = 0; i < w * h; i++) Hs[i] = Math.sqrt(Math.max(0, Hp[i])) * 2.2;
  // 3. the mesh's own shading (luminance), softened
  const Lm = new Float32Array(w * h);
  for(let i = 0; i < w * h; i++) Lm[i] = d[i*4+3] > 0 ? (0.3 * d[i*4] + 0.59 * d[i*4+1] + 0.11 * d[i*4+2]) / 255 : 0;
  const LmS = blurF(Lm, w, h, 1, 2);
  let lmMean = 0, n = 0; for(let i = 0; i < w * h; i++) if(m[i] && !ext[i] && d[i*4+3] > 200){ lmMean += LmS[i]; n++; } lmMean /= n || 1;
  // 4. shade
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const ctx = out.getContext('2d'), img = ctx.createImageData(w, h), o = img.data;
  const Ld = [-0.45, -0.55, 0.70], ln = Math.hypot(...Ld); Ld[0] /= ln; Ld[1] /= ln; Ld[2] /= ln;
  const LIGHT = [247, 214, 192], MID = [228, 178, 148], DARK = [172, 116, 92];
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    const i = y * w + x;
    if(!m[i]){ o[i*4+3] = 0; continue; }
    const gx = (Hs[i + (x < w - 1 ? 1 : 0)] - Hs[i - (x > 0 ? 1 : 0)]) / 2, gy = (Hs[i + (y < h - 1 ? w : 0)] - Hs[i - (y > 0 ? w : 0)]) / 2;
    const nl = Math.hypot(gx, gy, 1), nx = -gx / nl, ny = -gy / nl, nz = 1 / nl;
    let inf = Math.max(0, nx * Ld[0] + ny * Ld[1] + nz * Ld[2]);
    inf = 0.30 + 0.70 * inf;
    // the mesh adds form (pecs, belly, knees) where it is reliable: not the head, hands or feet
    const wMesh = (1 - ext[i]) * (1 - smooth(Z.head + 30, Z.head - 10, y)) * (d[i*4+3] > 200 ? 1 : 0);
    const meshL = Math.min(1.25, Math.max(0.55, LmS[i] / lmMean));
    let s = inf * (1 + (meshL - 1) * 0.55 * wMesh);
    // soft edge shadow just inside the outline
    s *= 0.86 + 0.14 * smooth(0, 7, dist[i]);
    s = Math.min(1.08, Math.max(0, s));
    const c = s < 0.62 ? [0, 1, 2].map(k => DARK[k] + (MID[k] - DARK[k]) * smooth(0.18, 0.62, s))
                       : [0, 1, 2].map(k => MID[k] + (LIGHT[k] - MID[k]) * smooth(0.62, 1.02, s));
    o[i*4] = c[0]; o[i*4+1] = c[1]; o[i*4+2] = c[2];
    o[i*4+3] = Math.round(255 * Math.min(1, Math.max(0, (mf[i] - 0.5) * 2.2 + 0.5)) );
    if(dist[i] > 1.5) o[i*4+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: out, mask: m };
}

/* A label spot for each region: its point deepest inside both the region and
   the body (the largest inscribed circle's centre). */
function anchorsFor(paths, mask, view){
  const w = view.w, h = view.h, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), out = {};
  for(const [k, d] of Object.entries(paths)){
    if(/Hit$/.test(k)) continue;
    x.clearRect(0, 0, w, h); x.fillStyle = '#000'; x.fill(new Path2D(d));
    const a = x.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
    for(let i = 0; i < w * h; i++) m[i] = a[i*4+3] > 127 && mask[i] ? 1 : 0;
    const dist = edt(m, w, h);
    // deep inside, and near the region's middle height (so a leg's label sits on the thigh, not at the groin)
    let sy = 0, n = 0; for(let i = 0; i < w * h; i++) if(m[i]){ sy += (i / w) | 0; n++; }
    const cy = sy / (n || 1);
    let best = -Infinity, bi = 0;
    for(let i = 0; i < w * h; i++) if(m[i]){ const sc = dist[i] - 0.12 * Math.abs(((i / w) | 0) - cy); if(sc > best){ best = sc; bi = i; } }
    out[k] = [bi % w, (bi / w) | 0, r1(dist[bi])];
  }
  return out;
}

/* ---- silhouette measurements and the region geometry --------------------- */
function rowSpans(mask, view, v){
  const spans = [], w = view.w, row = Math.round(v) * w;
  let x = 0;
  while(x < w){
    while(x < w && !mask[row + x]) x++;
    if(x >= w) break;
    const a = x;
    while(x < w && mask[row + x]) x++;
    spans.push([a, x - 1]);
  }
  return spans;
}
function measureMask(mask, view, wp, L){
  const lm = {};
  const cx = view.w / 2;
  const PX = (x, z) => { const q = wp(x, z); return view.P(q[0], q[1]); };
  // neck: from the chin down, the narrowest span through the midline; the shoulders start where it widens
  const chinV = PX(0, L.chin[1])[1];
  const notchV = PX(0, L.sternalNotch[1])[1];
  let neckMin = Infinity, neckV = chinV;
  for(let v = Math.round(chinV); v < notchV; v++){
    const s = rowSpans(mask, view, v).find(s => s[0] <= cx && s[1] >= cx); if(!s) continue;
    const wd = s[1] - s[0]; if(wd < neckMin){ neckMin = wd; neckV = v; }
  }
  let junctionV = neckV;
  for(let v = neckV; v < notchV + 30; v++){
    const s = rowSpans(mask, view, v).find(s => s[0] <= cx && s[1] >= cx); if(!s) continue;
    if(s[1] - s[0] > neckMin * 1.55){ junctionV = v; break; }
  }
  lm.neckHalf = neckMin / 2; lm.neckV = neckV; lm.junctionV = junctionV; lm.chinV = chinV; lm.notchV = notchV;
  // armpits: going down from the shoulder, the first row with a gap between arm and trunk; then the gap per row
  lm.axilla = {}; lm.armGap = {};
  for(const sgn of [-1, 1]){              // -1 = viewer's left
    const acV = PX(0, L.acromionL[1])[1];
    let found = null;
    const gap = [];
    for(let v = Math.round(acV); v < view.h; v++){
      const spans = rowSpans(mask, view, v);
      const mid = spans.find(s => s[0] <= cx && s[1] >= cx);
      if(!mid) continue;
      const next = sgn < 0 ? spans.filter(s => s[1] < mid[0]).pop() : spans.find(s => s[0] > mid[1]);
      if(!found){ if(next){ found = [sgn < 0 ? (next[1] + mid[0]) / 2 : (mid[1] + next[0]) / 2, v]; gap.push(found.slice()); } continue; }
      // follow the gap between the trunk-or-leg span nearest the arm and the arm span itself
      const arm = sgn < 0 ? spans[0] : spans[spans.length - 1];
      const body = sgn < 0 ? spans[1] : spans[spans.length - 2];
      if(!arm || !body || spans.length < 2){ break; }
      const prevX = gap[gap.length - 1][0];
      const g = sgn < 0 ? (arm[1] + body[0]) / 2 : (body[1] + arm[0]) / 2;
      if(Math.abs(g - prevX) > 25) break;
      gap.push([g, v]);
    }
    lm.axilla[sgn] = found; lm.armGap[sgn] = gap;
  }
  lm.cx = cx;
  return { lm, PX };
}

function buildRegions(view, geom, wp, L, side){
  const { lm, PX } = geom, w = view.w, h = view.h, cx = lm.cx, BIG = 60;
  const poly = pts => 'M' + pts.map(p => r1(p[0]) + ' ' + r1(p[1])).join('L') + 'Z';
  const yJ = lm.junctionV, yNotch = lm.notchV, nh = lm.neckHalf;
  // the neck's lower edge: out along the shoulders from the neck, dipping to the sternal notch (front) or C7 (back)
  const neckDip = side === 'front' ? yNotch : yJ + (yNotch - yJ) * 0.3;
  const neckMid = [[cx - nh - 10, yJ], [cx, neckDip], [cx + nh + 10, yJ]];
  // arm boundaries: from the shoulder top (most of the way out to the acromion) to the armpit, then down the gap
  const acx = [PX(L.acromionR[0], 0)[0], PX(L.acromionL[0], 0)[0]].sort((a, b) => a - b);
  const armLine = sgn => {
    const gap = lm.armGap[sgn];
    const top = [cx + (sgn < 0 ? acx[0] - cx : acx[1] - cx) * 0.8, yJ];
    const pts = [top].concat(gap.filter((_, i) => i % 3 === 0 || i === gap.length - 1));
    pts.push([gap[gap.length - 1][0], h + BIG]);
    return pts;
  };
  const LA = armLine(-1), RA = armLine(1);
  const tL = y => xOnLine(LA, y), tR = y => xOnLine(RA, y);
  const down = (f, y0, y1) => { const o = [], s = y1 > y0 ? 5 : -5; for(let y = y0; s > 0 ? y < y1 : y > y1; y += s) o.push([f(y), y]); o.push([f(y1), y1]); return o; };
  const zSplit = PX(0, L.t12l1 + (side === 'front' ? 30 : 0))[1];
  const groinY = PX(0, L.pubis[1] - 8)[1];
  const hipY = PX(0, L.asisR[1] - 20)[1];
  const foldY = PX(0, L.ischial - 20)[1];
  const P = {};
  const shoulderL = [tL(yJ), yJ], shoulderR = [tR(yJ), yJ];
  P.head = poly([[-BIG, -BIG], [w + BIG, -BIG], [w + BIG, yJ], shoulderR, ...neckMid.slice().reverse(), shoulderL, [-BIG, yJ]]);
  const jawY = lm.chinV + 3;
  P.simHead = poly([[-BIG, -BIG], [w + BIG, -BIG], [w + BIG, jawY], [-BIG, jawY]]);
  P.simNeck = poly([[-BIG, jawY], [w + BIG, jawY], [w + BIG, yJ], shoulderR, ...neckMid.slice().reverse(), shoulderL, [-BIG, yJ]]);
  P.armL = poly([[-BIG, yJ], ...LA, [-BIG, h + BIG]]);
  P.armR = poly([[w + BIG, yJ], ...RA, [w + BIG, h + BIG]]);
  const upper = [shoulderL, ...neckMid, shoulderR, ...down(tR, yJ, zSplit), ...down(tL, zSplit, yJ)];
  P.upper = poly(upper);
  if(side === 'front'){
    const ingL = [tL(hipY), hipY], ingR = [tR(hipY), hipY], pub = [cx, groinY];
    P.lower = poly([...down(tR, zSplit, hipY), ingR, pub, ingL, ...down(tL, hipY, zSplit)]);
    const g = PX(0, L.pubis[1] - 34);
    const grx = 17 * view.k, gry = 30 * view.k;
    P.genitals = ellipse(g[0], g[1], grx, gry);
    P.genitalHit = ellipse(g[0], g[1] + 4, Math.max(grx * 2.4, 32), Math.max(gry * 1.5, 40));
    P.legL = poly([ingL, pub, [cx, h + BIG], [tL(h) - BIG, h + BIG], ...down(tL, h, hipY)]);
    P.legR = poly([pub, ingR, ...down(tR, hipY, h), [tR(h) + BIG, h + BIG], [cx, h + BIG]]);
    P.simAbdomen = poly([...down(tR, zSplit, hipY), ingR, [cx + 40 * view.k, groinY + 70 * view.k], [cx - 40 * view.k, groinY + 70 * view.k], ingL, ...down(tL, hipY, zSplit)]);
    P.simLegL = poly([ingL, [cx - 40 * view.k, groinY + 70 * view.k], [cx, groinY + 70 * view.k], [cx, h + BIG], [tL(h) - BIG, h + BIG], ...down(tL, h, hipY)]);
    P.simLegR = poly([[cx, groinY + 70 * view.k], [cx + 40 * view.k, groinY + 70 * view.k], ingR, ...down(tR, hipY, h), [tR(h) + BIG, h + BIG], [cx, h + BIG]]);
  } else {
    P.lower = poly([...down(tR, zSplit, foldY), ...down(tL, foldY, zSplit)]);
    P.legL = poly([[tL(foldY), foldY], [cx, foldY], [cx, h + BIG], [tL(h) - BIG, h + BIG], ...down(tL, h, foldY)]);
    P.legR = poly([[cx, foldY], [tR(foldY), foldY], ...down(tR, foldY, h), [tR(h) + BIG, h + BIG], [cx, h + BIG]]);
    P.simBack = poly([shoulderL, ...neckMid, shoulderR, ...down(tR, yJ, foldY), ...down(tL, foldY, yJ)]);
  }
  return { paths: P, anchors: {}, hit: {}, lines: { yJ, zSplit, hipY, foldY, groinY } };
}
function xOnLine(line, y){
  if(y <= line[0][1]) return line[0][0];
  for(let i = 1; i < line.length; i++){
    const a = line[i-1], b = line[i];
    if(y <= b[1]){ const t = (y - a[1]) / ((b[1] - a[1]) || 1); return a[0] + (b[0] - a[0]) * t; }
  }
  return line[line.length - 1][0];
}
function ellipse(cx, cy, rx, ry){
  const p = []; for(let i = 0; i < 24; i++){ const a = i / 24 * Math.PI * 2; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return 'M' + p.map(q => r1(q[0]) + ' ' + r1(q[1])).join('L') + 'Z';
}
