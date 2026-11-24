/* Browser half of scripts/build-pose-figures.mjs: the scenario simulator's posed
   patients, rendered from the same BodyParts3D skin as every other figure
   (scripts/body-figures/render.js), so the patient looks like the same patient
   before and after a change of posture.

   The skin is posed by rotating its vertices about joints measured from the
   skeleton (femur, tibia, humerus and forearm ends), with smooth weights at
   each joint, before the mesh is subdivided and smoothed, so the bends come
   out round. Then it is rendered orthographically and shaded in the figures'
   own flat style (inflated silhouette, the mesh's light, the same skin
   palette). The clothes and hair are coloured on the mesh, by region in the
   unposed body, so they bend with it.

     side   on the left side, seen from above: the camera looks at the right
            side; upper (right) knee bent forward, lower leg nearly straight,
            arms forward (the recovery position). Pregnant patients add the
            gravid belly, the reason they lie on the left side.
     sit    seated, seen from the front: hips and knees at a right angle, the
            knees toward us. "tripod": leaning forward, hands on the knees.

   window.renderPoses(list) resolves to { name: { webp, w, h, outline, landmarks,
   anchors, lines } } in each image's own pixels (model space: +x patient's
   left, -y front, +z up, mm). */
import { THREE, GLTFLoader, MeshoptDecoder, skinGeometry, worldPositions, bbox, pts, WARPS, morph, components, fillHoles, edt, poisson, blurF, smooth, trace, pathD, r1 } from './render.js';

const ss = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
// rotate about the lateral (x) axis through c: a > 0 swings a hanging limb forward (toward -y)
function rotX(p, c, a){
  const dy = p[1] - c[1], dz = p[2] - c[2], co = Math.cos(a), si = Math.sin(a);
  return [p[0], c[1] + dy * co + dz * si, c[2] - dy * si + dz * co];
}
// rotate in the frontal plane about c: a > 0 swings a hanging limb outward on its own side (sd -1 right, +1 left)
function rotY(p, c, a, sd){
  const b = a * sd, dx = p[0] - c[0], dz = p[2] - c[2], co = Math.cos(b), si = Math.sin(b);
  return [c[0] + dx * co - dz * si, p[1], c[2] + dx * si + dz * co];
}
const D = Math.PI / 180;
const POSES = {
  // the recovery position (patient on the left side): the upper (right) hip and knee bent, the lower leg a little bent, arms forward
  side: { hip: [72, 18], knee: [-88, -22], abd: [0, 0], arm: [84, 84], elbow: [86, 6], armAbd: [0, 0], lean: 6, head: 0 },
  // seated upright, hands resting on the thighs (the hands placed by reach, below)
  sit: { hip: [88, 88], knee: [-88, -88], abd: [7, 7], arm: [0, 0], elbow: [0, 0], armAbd: [0, 0], lean: 8, head: 0, hands: 0.55 },
  // seated, leaning forward, hands on the knees (the tripod position)
  tripod: { hip: [84, 84], knee: [-84, -84], abd: [14, 14], arm: [0, 0], elbow: [0, 0], armAbd: [0, 0], lean: 30, head: -14, hands: 0.98 }
};

function measureJoints(W){
  const B = k => bbox(W[k]);
  const end = (k, top) => { const P = pts(W[k]), b = B(k), z = top ? b.hi[2] : b.lo[2];
    const q = P.filter(v => Math.abs(v[2] - z) < 25); const n = q.length || 1;
    return [q.reduce((s, v) => s + v[0], 0) / n, q.reduce((s, v) => s + v[1], 0) / n, top ? z - 22 : z + 18]; };
  // FMA24474/5 femur R/L, FMA24477/8 tibia R/L, FMA23130/1 humerus R/L; forearm bones R FMA23464/7, L FMA23465/8
  const J = {
    hip: [end('FMA24474', true), end('FMA24475', true)],
    knee: [end('FMA24474', false), end('FMA24475', false)],
    ankle: [end('FMA24477', false), end('FMA24478', false)],
    sh: [end('FMA23130', true), end('FMA23131', true)],
    elb: [end('FMA23130', false), end('FMA23131', false)]
  };
  // the humerus head sits inside the deltoid; the femoral head is deep in the hip: put the pivots at the joint centres
  J.hip.forEach(p => { p[2] += 4; });
  J.sh.forEach(p => { p[2] -= 6; });
  J.hipMid = [0, (J.hip[0][1] + J.hip[1][1]) / 2, (J.hip[0][2] + J.hip[1][2]) / 2];
  return J;
}

/* the pose as a warp: q is the rest (adult, unwarped) position, p the variant-warped one */
function poser(pose, J, Jw, armX){
  return function(q, p){
    const sd = q[0] < 0 ? 0 : 1, sg = sd ? 1 : -1, ax = Math.abs(q[0]);
    const isArm = ss((ax - armX) / 14) * (q[2] < J.sh[sd][2] + 60 ? 1 : 0);
    const wLeg = (1 - isArm) * ss((J.hip[sd][2] + 40 - q[2]) / 130);
    const wKnee = (1 - isArm) * ss((J.knee[sd][2] + 30 - q[2]) / 70);
    if(wLeg > 0){
      if(wKnee > 0) p = rotX(p, Jw.knee[sd], pose.knee[sd] * D * wKnee);
      if(pose.abd[sd]) p = rotY(p, Jw.hip[sd], pose.abd[sd] * D * wLeg, sg);
      p = rotX(p, Jw.hip[sd], pose.hip[sd] * D * wLeg);
    }
    if(isArm > 0){
      const wSh = isArm * ss((J.sh[sd][2] + 20 - q[2]) / 90), wEl = isArm * ss((J.elb[sd][2] + 25 - q[2]) / 60);
      if(wEl > 0 && pose.elbow[sd]) p = rotX(p, Jw.elb[sd], pose.elbow[sd] * D * wEl);
      if(pose.armAbd[sd]) p = rotY(p, Jw.sh[sd], pose.armAbd[sd] * D * wSh, sg);
      p = rotX(p, Jw.sh[sd], pose.arm[sd] * D * wSh);
    }
    const wT = ss((q[2] - (J.hipMid[2] - 40)) / 140);
    if(pose.head){ const wH = ss((q[2] - (J.neckZ - 10)) / 60); if(wH > 0) p = rotX(p, Jw.neck, -pose.head * D * wH); }
    if(pose.lean && wT > 0) p = rotX(p, Jw.hipMid, -pose.lean * D * wT);
    return p;
  };
}

/* region of each vertex, from its rest position: 0 skin, 1 hair, 2 top, 3 bottom, 4 shoe */
function regionOf(q, R, look){
  const [x, y, z] = q, ax = Math.abs(x), arm = ax > R.armX && z < R.sh + 60;
  const H = R.top - R.chin;
  if(z > R.chin + H * 0.15){
    if(!look.hair) return 0;
    // the hairline: high over the forehead, sweeping down behind the ear to the nape
    const zl = R.chin + H * (0.82 - 0.7 * ss((y - (R.headY - 60)) / 110));
    return z > zl ? 1 : 0;
  }
  if(look.hair && look.long && y > R.headY + 20 && z > R.notch - 70 && ax < 95) return 1;
  const neck = R.notch + (y > 20 ? 30 : 6);
  const top = look.top, bot = look.bot;
  const waist = /maternity/.test(top) ? R.pubis + 15 : /dress/.test(top) ? R.knee + 60 : R.asis - 35;
  if(top && z < neck){
    if(arm){ const sl = look.longSleeve ? R.wrist + 20 : (R.sh + R.elb) / 2; if(z > sl) return 2; }
    else if(z > waist) return 2;
  }
  if(bot && !arm && z <= waist + 2){
    const end = /shorts/.test(bot) ? (R.hip + R.knee) / 2 : R.ankle + 28;
    if(z > end) return 3;
  }
  if(look.shoe && !arm && z < R.ankle + 30) return 4;
  return 0;
}

let renderer;
let flat;
function render(cam, meshes, w, h, lights, data){
  if(!renderer){
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  if(data){
    // data passes (rest position, depth): no antialias, no tone mapping, one sample per pixel
    if(!flat){ flat = new THREE.WebGLRenderer({ antialias:false, alpha:true, preserveDrawingBuffer:true }); flat.toneMapping = THREE.NoToneMapping; flat.outputColorSpace = THREE.LinearSRGBColorSpace; }
    flat.setSize(w, h, false); flat.setClearColor(0x000000, 0);
    const sc = new THREE.Scene(); meshes.forEach(m => sc.add(m)); flat.render(sc, cam);
    const gl = flat.getContext(), px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const outp = new Uint8Array(w * h * 4);
    for(let y = 0; y < h; y++) outp.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    return outp;
  }
  const SS = 2;
  renderer.setSize(w * SS, h * SS, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  meshes.forEach(m => scene.add(m));
  (lights || []).forEach(l => scene.add(l));
  renderer.render(scene, cam);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  x.drawImage(renderer.domElement, 0, 0, w, h);
  return c.getContext('2d').getImageData(0, 0, w, h).data;
}

const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
/* hands placed by reach: the shoulder, elbow and arm-out angles that put each wrist on its thigh (hands: 0 at the hip,
   1 at the knee), found by search through the same pose, so the arms really reach */
function reach(pose, J, Jw, armX, wrist){
  if(pose.hands == null) return pose;
  const P = JSON.parse(JSON.stringify(pose));
  for(const sd of [0, 1]){
    const sg = sd ? 1 : -1, f = poser(P, J, Jw, armX);
    const k = f(J.knee[sd].slice(), Jw.knee[sd].slice()), h = f(J.hip[sd].slice(), Jw.hip[sd].slice());
    const t = [h[0] + (k[0] - h[0]) * pose.hands, h[1] + (k[1] - h[1]) * pose.hands - 10, h[2] + (k[2] - h[2]) * pose.hands + 75];
    const wr = [sg * 228, 30, wrist], wrw = Jw.wr[sd];
    let best = 1e18, bp = null;
    for(let a = -40; a <= 70; a += 3) for(let e = 0; e <= 110; e += 4) for(let b = -16; b <= 20; b += 3){
      P.arm[sd] = a; P.elbow[sd] = e; P.armAbd[sd] = b;
      const q = poser(P, J, Jw, armX)(wr, wrw.slice());
      const d = (q[0] - t[0]) ** 2 + (q[1] - t[1]) ** 2 + (q[2] - t[2]) ** 2 + e * 2;
      if(d < best){ best = d; bp = [a, e, b]; }
    }
    [P.arm[sd], P.elbow[sd], P.armAbd[sd]] = bp;
  }
  return P;
}

const SKIN = { LIGHT: [247, 214, 192], MID: [228, 178, 148], DARK: [172, 116, 92] };

window.renderPoses = async function(list){
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync('/assets/body3d/body3d.glb');
  gltf.scene.updateMatrixWorld(true);
  const M = {}; gltf.scene.traverse(o => { if(o.isMesh) M[o.name] = o; });
  const W = {}; for(const k in M) W[k] = worldPositions(M[k]);
  const B = k => bbox(W[k]);
  const J = measureJoints(W);
  const skinMesh = M.FMA7163;
  const restGeo = skinGeometry(skinMesh, null), restP = restGeo.attributes.position.array;
  restGeo.computeBoundingBox();
  const mand = B('FMA52748'), clav = pts(W.FMA13322).concat(pts(W.FMA13323)), st = B('FMA7487');
  const hipR = pts(W.FMA16586), l3 = B('FMA13074');
  const notch = clav.filter(v => Math.abs(v[0]) < 40).reduce((s, v) => Math.max(s, v[2]), -1e9);
  const R = {
    chin: mand.lo[2], top: restGeo.boundingBox.max.z, headY: (mand.lo[1] + mand.hi[1]) / 2 + 30, notch,
    xiph: st.lo[2], sAngle: st.hi[2], umb: (l3.lo[2] + l3.hi[2]) / 2,
    asis: hipR.filter(v => v[2] > 880).sort((a, b) => a[1] - b[1])[0][2], pubis: hipR.filter(v => Math.abs(v[0]) < 25).sort((a, b) => a[1] - b[1])[0][2],
    hip: J.hip[0][2], knee: J.knee[0][2], ankle: J.ankle[0][2], sh: J.sh[0][2], elb: J.elb[0][2], wrist: J.elb[0][2] - 250, armX: 0
  };
  // the arms hang just outside the trunk: the gap at the waist between the elbow and the hip
  { const P = pts(restP).filter(v => Math.abs(v[2] - (R.elb - 30)) < 15 && v[1] > -60 && v[1] < 60);
    const xs = P.map(v => Math.abs(v[0])).sort((a, b) => a - b); let gap = 0, at = 190;
    for(let i = 1; i < xs.length; i++) if(xs[i] - xs[i - 1] > gap && xs[i - 1] > 120 && xs[i] < 260){ gap = xs[i] - xs[i - 1]; at = (xs[i] + xs[i - 1]) / 2; }
    R.armX = at; }
  J.neckZ = (R.chin + R.notch) / 2; J.neck = [0, R.headY, J.neckZ];

  const out = { _joints: { J, R } };
  for(const it of list){
    const base = WARPS[it.kind] || null;
    const bw = base || ((x, y, z) => [x, y, z]);
    const belly = it.preg ? (q, p) => { const f = ss((-q[1] - 10) / 70), g = Math.exp(-((q[0] / 125) ** 2) - (((q[2] - (R.umb - 45)) / 160) ** 2)); return [p[0], p[1] - 200 * f * g, p[2] + 14 * f * g]; } : null;
    const wv = (x, y, z) => base ? base(x, y, z, true) : [x, y, z];
    const Jw = {};
    for(const k of ['hip', 'knee', 'ankle', 'sh', 'elb']) Jw[k] = J[k].map(p => wv(...p));
    Jw.hipMid = wv(...J.hipMid); Jw.neck = wv(...J.neck); Jw.wr = [wv(-228, 30, R.wrist), wv(228, 30, R.wrist)];
    const pose = poser(reach(POSES[it.pose], J, Jw, R.armX, R.wrist), J, Jw, R.armX);
    const full = (x, y, z) => { let p = wv(x, y, z); if(belly) p = belly([x, y, z], p); return pose([x, y, z], p); };
    const geo = skinGeometry(skinMesh, full);
    // the rest mesh has the same vertex order (subdivision is topological), so each vertex knows where it was
    geo.computeBoundingBox();
    const bb = geo.boundingBox, side = it.pose === 'side';
    // side: the camera at -x (the patient's right) looks at +x; image right is the front (-y). Seated: from the front and
    // a little to her right (a three quarter view), so the thighs coming toward us and the lean read.
    const g = side ? 90 * D : it.pose === 'tripod' ? 56 * D : 34 * D, camDir = new THREE.Vector3(Math.sin(g), Math.cos(g), 0);
    const right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 0, 1)).normalize();
    let u0 = 1e9, u1 = -1e9;
    { const P = geo.attributes.position.array; for(let i = 0; i < P.length; i += 3){ const u = P[i] * right.x + P[i+1] * right.y; if(u < u0) u0 = u; if(u > u1) u1 = u; } }
    u0 -= 10; u1 += 10; const v0 = bb.min.z - 10, v1 = bb.max.z + 10;
    const pxPerMm = 1200 / Math.max(v1 - v0, (u1 - u0) * 0.75), w = Math.round((u1 - u0) * pxPerMm / 2) * 2, h = Math.round((v1 - v0) * pxPerMm / 2) * 2;
    const cam = new THREE.OrthographicCamera(u0, u1, v1, v0, 1, 8000);
    cam.up.set(0, 0, 1);
    cam.position.copy(camDir.clone().multiplyScalar(-3000)); cam.lookAt(0, 0, 0);
    // the camera's own axes, so a model point projects to image pixels
    cam.updateMatrixWorld();
    const proj = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(cam); return [r1((v.x + 1) / 2 * w), r1((1 - v.y) / 2 * h)]; };
    // light: key from the viewer's upper left, a cool rim, a warm fill (as the other figures)
    const L = (c, i, d) => { const l = new THREE.DirectionalLight(c, i); l.position.copy(d); return l; };
    const back = camDir.clone().multiplyScalar(-1);
    const lights = [new THREE.HemisphereLight(0xfff6ee, 0x6e5246, 1.45),
      L(0xffffff, 2.1, back.clone().multiplyScalar(1400).add(right.clone().multiplyScalar(-700)).add(new THREE.Vector3(0, 0, 2300))),
      L(0xdfe9ff, 1.1, camDir.clone().multiplyScalar(900).add(right.clone().multiplyScalar(1100)).add(new THREE.Vector3(0, 0, 1500))),
      L(0xffe6d6, 0.55, back.clone().multiplyScalar(1600).add(right.clone().multiplyScalar(900)).add(new THREE.Vector3(0, 0, 300)))];
    const lit = render(cam, [new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color:0xeec4a6, roughness:0.72, sheen:0.5, sheenColor:new THREE.Color(0xffdcc8), sheenRoughness:0.6, specularIntensity:0.25 }))], w, h, lights);
    // each pixel's rest position (16 bits a coordinate, two passes) and depth: the clothes' edges are cut per pixel, not per triangle
    geo.setAttribute('rest', new THREE.Float32BufferAttribute(Array.from(restP), 3));
    const RS = 'attribute vec3 rest; varying vec3 vr; varying float vz; void main(){ vr = (rest + vec3(500.0, 500.0, 50.0)) / vec3(1000.0, 1000.0, 1800.0); vec4 mv = modelViewMatrix * vec4(position, 1.0); vz = -mv.z; gl_Position = projectionMatrix * mv; }';
    const pass = f => render(cam, [new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: RS, fragmentShader: 'varying vec3 vr; varying float vz; void main(){ ' + f + ' }' }))], w, h, null, true);
    const hi = pass('gl_FragColor = vec4(floor(clamp(vr, 0.0, 0.9999) * 255.0) / 255.0, 1.0);');
    const lo = pass('gl_FragColor = vec4(fract(clamp(vr, 0.0, 0.9999) * 255.0), 1.0);');
    const dep = pass('float d = clamp((vz - 2000.0) / 2000.0, 0.0, 0.9999); gl_FragColor = vec4(floor(d * 255.0) / 255.0, fract(d * 255.0), 0.0, 1.0);');

    // landmarks: rest points through the same warp and pose, projected
    const pt = (x, y, z) => proj(...full(x, y, z));
    const kneeR = pt(J.knee[0][0], J.knee[0][1] - 40, J.knee[0][2]), kneeL = pt(J.knee[1][0], J.knee[1][1] - 40, J.knee[1][2]);
    const headC = pt(0, R.headY - 20, (R.chin + R.top) / 2 + 10), chin = pt(0, R.headY - 60, R.chin);
    const headR = r1(Math.hypot(headC[0] - chin[0], headC[1] - chin[1]) * 0.78);
    const lm = {
      chin, sternalNotch: pt(0, -70, R.notch), sternalAngle: pt(0, -90, R.sAngle), xiphoid: pt(0, -100, R.xiph), umbilicus: pt(0, -110, R.umb),
      asisR: pt(-110, -80, R.asis), asisL: pt(110, -80, R.asis), pubis: pt(0, -90, R.pubis),
      midaxR: pt(-150, 0, R.xiph - 30), midaxL: pt(150, 0, R.xiph - 30), acromionR: pt(-185, 0, R.sh + 30), acromionL: pt(185, 0, R.sh + 30), clavicleMidR: pt(-85, -70, R.notch - 15), clavicleMidL: pt(85, -70, R.notch - 15),
      mouth: pt(0, R.headY - 105, R.chin + 45), eye: pt(side ? -40 : 0, R.headY - 85, R.chin + 120),
      hipR: pt(J.hip[0][0], 0, J.hip[0][2]), hipL: pt(J.hip[1][0], 0, J.hip[1][2]), kneeR, kneeL,
      footR: pt(J.ankle[0][0], J.ankle[0][1], J.ankle[0][2] - 60), footL: pt(J.ankle[1][0], J.ankle[1][1], J.ankle[1][2] - 60),
      handR: pt(-235, 0, R.wrist - 60), handL: pt(235, 0, R.wrist - 60)
    };
    // 1. silhouette: the largest piece, holes filled, edges smoothed
    let m = new Uint8Array(w * h);
    for(let i = 0; i < w * h; i++) m[i] = lit[i*4+3] > 110 ? 1 : 0;
    m = morph(morph(m, w, h, 1, true), w, h, 1, false);
    { const { lab, sizes } = components(m, w, h); const big = sizes.indexOf(Math.max(...sizes.slice(1))); for(let i = 0; i < w * h; i++) if(m[i] && lab[i] !== big) m[i] = 0; }
    m = fillHoles(m, w, h);
    { const sm = blurF(m, w, h, 1, 2); for(let i = 0; i < w * h; i++) m[i] = sm[i] >= 0.5 ? 1 : 0; }
    // the coarse mesh's hands and feet: rounded off (as the standing figures' are), a mitten and a foot, not spikes
    { const ends = [lm.handR, lm.handL, lm.footR, lm.footL], rr = 95 * pxPerMm, sm = blurF(m, w, h, 4, 3);
      for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
        let wgt = 0; for(const e of ends){ const d = Math.hypot(x - e[0], y - e[1]); wgt = Math.max(wgt, ss((rr - d) / (rr * 0.4))); }
        if(wgt > 0){ const i = y * w + x; m[i] = (m[i] * (1 - wgt) + sm[i] * wgt) >= 0.42 ? 1 : 0; } } }
    // 2. region and depth per pixel
    const reg = new Uint8Array(w * h), dz = new Float32Array(w * h);
    for(let i = 0; i < w * h; i++){
      if(!hi[i*4+3]){ dz[i] = 1; continue; }
      const c3 = k => (hi[i*4+k] + lo[i*4+k] / 255) / 255;
      reg[i] = regionOf([c3(0) * 1000 - 500, c3(1) * 1000 - 500, c3(2) * 1800 - 50], R, it);
      dz[i] = dep[i*4] / 255 + dep[i*4+1] / 65025;
    }
    // 3. form: the inflated silhouette and the mesh's own light
    const dist = edt(m, w, h), Hp = poisson(m, w, h), Hs = new Float32Array(w * h);
    for(let i = 0; i < w * h; i++) Hs[i] = Math.sqrt(Math.max(0, Hp[i])) * 2.2;
    const Lm = new Float32Array(w * h);
    for(let i = 0; i < w * h; i++) Lm[i] = lit[i*4+3] > 0 ? (0.3 * lit[i*4] + 0.59 * lit[i*4+1] + 0.11 * lit[i*4+2]) / 255 : 0;
    const LmS = blurF(Lm, w, h, 1, 2);
    let mean = 0, cnt = 0; for(let i = 0; i < w * h; i++) if(m[i] && lit[i*4+3] > 200){ mean += LmS[i]; cnt++; } mean /= cnt || 1;
    // where one part lies over another (the upper leg over the lower): a soft dark line, as a drawn contour
    const edge = new Float32Array(w * h);
    for(let y = 1; y < h - 1; y++) for(let x = 1; x < w - 1; x++){
      const i = y * w + x; if(!m[i]) continue;
      const g = Math.max(Math.abs(dz[i + 1] - dz[i - 1]), Math.abs(dz[i + w] - dz[i - w]));
      edge[i] = Math.min(1, Math.max(0, (g - 0.012) / 0.02)) + (reg[i] !== reg[i + 1] || reg[i] !== reg[i + w] ? 0.45 : 0);
    }
    const edgeS = blurF(edge, w, h, 1, 1);
    const cols = { 1: hex(it.hair || '#2B2B2B'), 2: it.top ? [hex(it.top[0]), hex(it.top[1])] : null, 3: it.bot ? [hex(it.bot[0]), hex(it.bot[1])] : null, 4: hex(it.shoe || '#2B2B2B') };
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), o = img.data;
    const Ld = [-0.45, -0.55, 0.70], ln = Math.hypot(...Ld); Ld[0] /= ln; Ld[1] /= ln; Ld[2] /= ln;
    for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
      const i = y * w + x;
      if(!m[i]){ o[i*4+3] = 0; continue; }
      const gx = (Hs[i + (x < w - 1 ? 1 : 0)] - Hs[i - (x > 0 ? 1 : 0)]) / 2, gy = (Hs[i + (y < h - 1 ? w : 0)] - Hs[i - (y > 0 ? w : 0)]) / 2;
      const nl = Math.hypot(gx, gy, 1);
      let inf = 0.30 + 0.70 * Math.max(0, (-gx / nl) * Ld[0] + (-gy / nl) * Ld[1] + (1 / nl) * Ld[2]);
      const meshL = Math.min(1.3, Math.max(0.5, (LmS[i] || mean) / mean));
      // more of the mesh's light than the standing figures: a bent body is not one inflated shape
      let s = inf * 0.55 + meshL * 0.62 - 0.17;
      s *= 0.86 + 0.14 * smooth(0, 7, dist[i]);
      s *= 1 - 0.32 * Math.min(1, edgeS[i]);
      s = Math.min(1.08, Math.max(0, s));
      const r = reg[i]; let c;
      if(r === 0 || (r === 2 && !cols[2]) || (r === 3 && !cols[3])) c = s < 0.62 ? [0, 1, 2].map(k => SKIN.DARK[k] + (SKIN.MID[k] - SKIN.DARK[k]) * smooth(0.18, 0.62, s)) : [0, 1, 2].map(k => SKIN.MID[k] + (SKIN.LIGHT[k] - SKIN.MID[k]) * smooth(0.62, 1.02, s));
      else if(r === 1 || r === 4){ const b0 = cols[r]; c = b0.map(v => Math.min(255, v * (0.55 + 0.7 * s))); }
      else { const [d0, l0] = cols[r]; c = [0, 1, 2].map(k => { const dk = d0[k] * 0.62; return s < 0.62 ? dk + (d0[k] - dk) * smooth(0.18, 0.62, s) : d0[k] + (l0[k] - d0[k]) * smooth(0.62, 1.02, s); }); }
      o[i*4] = c[0]; o[i*4+1] = c[1]; o[i*4+2] = c[2]; o[i*4+3] = dist[i] > 1.5 ? 255 : 200;
    }
    ctx.putImageData(img, 0, 0);
    const legW = r1(70 * pxPerMm), a = (p, rr) => [p[0], p[1], rr];
    const anchors = {
      // seated (three quarter view): the head anchor sits on the face, so the drawn face and the mask land on it
      head: a(headC, headR), simHead: side ? a(headC, headR) : a([r1(headC[0] + (lm.eye[0] - headC[0]) * 0.5), lm.eye[1] + headR * 0.08], headR), simNeck: a(pt(0, R.headY, J.neckZ), r1(48 * pxPerMm)),
      upper: a(pt(0, -80, (R.notch + R.xiph) / 2), r1(90 * pxPerMm)), lower: a(pt(0, -100, R.umb), r1(90 * pxPerMm)), simAbdomen: a(pt(0, -100, R.umb), r1(90 * pxPerMm)),
      armR: a(pt(-235, 0, R.elb), r1(40 * pxPerMm)), armL: a(pt(235, 0, R.elb), r1(40 * pxPerMm)),
      legR: a(kneeR, legW), legL: a(kneeL, legW), simLegR: a(kneeR, legW), simLegL: a(kneeL, legW), genitals: a(lm.pubis, r1(40 * pxPerMm))
    };
    // the bare skin alone, for the colour of the skin (pale, blue, mottled) without tinting the clothes
    const sk = new Uint8Array(w * h); for(let i = 0; i < w * h; i++) sk[i] = m[i] && reg[i] === 0 ? 1 : 0;
    out[it.name] = { w, h, webp: cv.toDataURL('image/webp', 0.84), outline: pathD(trace(m, w, h, 1.0)), skinOutline: pathD(trace(sk, w, h, 1.2)), landmarks: lm, anchors,
      lines: { groinY: lm.pubis[1] }, pose: it.pose, regions: {} };
  }
  return out;
};
