/* LevlPrep studio rig runtime (2026-10-21, studio system section 3).
   Vector art bent by an invisible skeleton (linear blend skinning on every path point, anchors AND bezier
   handles, so curves stay smooth when a joint bends), two bone IK so a hand or foot stays planted on a target,
   and springs on loose parts (hair, sleeves, straps) that overshoot and settle.

   Rig data comes from skin.py (rest bones, parts with points and weights). Motion is a clip:
     { bones: {id: [[t, deg, ease], ...]},          rotation offsets from rest, degrees
       root:  [[t, x, y, ease], ...],               root translation in px
       ik:    [{upper, lower, end, target: [[t, x, y, ease]], bend: 1|-1, weight: [[t, w, ease]]}],
       springs: [{bone, k, c, grav}],               k stiffness, c damping, grav pulls toward straight down (deg/s^2)
       procedural: {breathe: {bone, amp, period}, idle: [...]}}
   Everything is a pure function of time t (springs are integrated from 0 in fixed steps and cached),
   so the renderer can seek any frame in any order and get identical pictures. */
(function (G) {
  const D2R = Math.PI / 180;
  const EASE = {
    linear: (x) => x,
    in: (x) => x * x * x,
    out: (x) => 1 - Math.pow(1 - x, 3),
    inout: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    // anticipation and overshoot (animation principles: anticipate, follow through)
    back: (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    antic: (x) => { const c1 = 1.2, c3 = c1 + 1; return c3 * x * x * x - c1 * x * x; },
  };

  function track(keys, t, n) {            // keys: [[t, v1..vn, ease]]
    if (!keys || !keys.length) return null;
    if (t <= keys[0][0]) return keys[0].slice(1, 1 + n);
    for (let i = 1; i < keys.length; i++) {
      const b = keys[i];
      if (t <= b[0]) {
        const a = keys[i - 1];
        const e = EASE[b[1 + n] || "inout"] || EASE.inout;
        const u = e((t - a[0]) / Math.max(1e-6, b[0] - a[0]));
        const out = [];
        for (let k = 1; k <= n; k++) out.push(a[k] + (b[k] - a[k]) * u);
        return out;
      }
    }
    return keys[keys.length - 1].slice(1, 1 + n);
  }

  // 2D affine as [a, b, c, d, e, f] (x' = a x + c y + e, y' = b x + d y + f)
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3],
                         m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const T = (x, y) => [1, 0, 0, 1, x, y];
  const R = (a) => [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
  const inv = (m) => { const det = m[0] * m[3] - m[1] * m[2];
    return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det]; };
  const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

  class Rig {
    constructor(data, group, clip) {
      this.d = data; this.clip = clip || {}; this.g = group;
      this.bones = data.bones;                       // ordered so parents come first
      this.ix = {}; this.bones.forEach((b, i) => (this.ix[b.id] = i));
      this.rest = this.bones.map((b) => {
        const a = Math.atan2(b.tail[1] - b.head[1], b.tail[0] - b.head[0]);
        return { a, len: Math.hypot(b.tail[0] - b.head[0], b.tail[1] - b.head[1]), M: mul(T(b.head[0], b.head[1]), R(a)) };
      });
      this.restInv = this.rest.map((r) => inv(r.M));
      this.local = this.bones.map((b, i) => (b.parent ? mul(this.restInv[this.ix[b.parent]], this.rest[i].M) : this.rest[i].M));
      this.paths = data.parts.map((p) => {
        const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
        el.setAttribute("fill", p.fill || "none");
        if (p.stroke) { el.setAttribute("stroke", p.stroke); el.setAttribute("stroke-width", p.sw || 2); el.setAttribute("stroke-linejoin", "round"); }
        if (p.opacity != null) el.setAttribute("opacity", p.opacity);
        if (p.cls) el.setAttribute("class", p.cls);
        el.id = (data.prefix || "rig") + "_" + p.id;
        group.appendChild(el); return el;
      });
      this.springs = (this.clip.springs || []).map((s) => ({ ...s, i: this.ix[s.bone] }));
      this._cache = { t: -1, st: null };
    }

    // world matrices for a pose: offs = {boneIndex: radians}, root = [x, y]
    world(offs, root) {
      const W = new Array(this.bones.length);
      this.bones.forEach((b, i) => {
        const L = mul(this.local[i], R(offs[i] || 0));
        W[i] = b.parent ? mul(W[this.ix[b.parent]], L) : mul(T(root[0], root[1]), L);
      });
      return W;
    }

    basePose(t) {
      const offs = {}, c = this.clip;
      for (const id in c.bones || {}) { const v = track(c.bones[id], t, 1); if (v) offs[this.ix[id]] = v[0] * D2R; }
      const pr = c.procedural || {};
      if (pr.breathe) {                                   // breathing: chest rises and settles, never stops
        for (const br of [].concat(pr.breathe)) {
          const i = this.ix[br.bone]; const ph = (t / (br.period || 4.2)) * 2 * Math.PI;
          offs[i] = (offs[i] || 0) + (br.amp || 1.2) * D2R * (Math.sin(ph) * 0.8 + Math.sin(2 * ph) * 0.2);
        }
      }
      for (const n of pr.noise || []) {                   // small idle weight shifts, smooth and deterministic
        const i = this.ix[n.bone]; const f = n.freq || 0.3, s = n.seed || 1;
        const v = Math.sin(t * f * 6.283 + s) * 0.6 + Math.sin(t * f * 2.71 * 6.283 + s * 3.1) * 0.4;
        offs[i] = (offs[i] || 0) + (n.amp || 1) * D2R * v;
      }
      const root = track(c.root, t, 2) || [0, 0];
      return { offs, root };
    }

    // analytic two bone IK: rotate upper and lower so lower's tail (or end bone's head) hits the target
    solveIK(offs, root, t) {
      for (const k of this.clip.ik || []) {
        const w = (track(k.weight, t, 1) || [1])[0]; if (w <= 0) continue;
        const tgt = track(k.target, t, 2); if (!tgt) continue;
        const iu = this.ix[k.upper], il = this.ix[k.lower];
        const W = this.world(offs, root);
        const s = ap(W[iu], 0, 0);
        const l1 = this.rest[iu].len, l2 = this.rest[il].len;
        let dx = tgt[0] - s[0], dy = tgt[1] - s[1]; let dist = Math.hypot(dx, dy);
        dist = Math.min(dist, (l1 + l2) * 0.999); dist = Math.max(dist, Math.abs(l1 - l2) * 1.001);
        const base = Math.atan2(dy, dx);
        const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
        const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
        const cosB = (l1 * l1 + l2 * l2 - dist * dist) / (2 * l1 * l2);
        const B = Math.acos(Math.max(-1, Math.min(1, cosB)));
        const bend = k.bend || 1;
        const upperWorld = base - bend * A;               // desired world angle of the upper bone
        const lowerRel = bend * (Math.PI - B);            // desired angle of lower relative to upper
        // current world angle of upper with its offset removed
        const Wp = this.bones[iu].parent ? W[this.ix[this.bones[iu].parent]] : T(root[0], root[1]);
        const restUpper = Math.atan2((mul(Wp, this.local[iu]))[1], (mul(Wp, this.local[iu]))[0]);
        const restLowerRel = Math.atan2(this.local[il][1], this.local[il][0]);
        const wantU = upperWorld - restUpper, wantL = lowerRel - restLowerRel;
        const blend = (a, b) => a + (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * w;
        offs[iu] = blend(offs[iu] || 0, wantU);
        offs[il] = blend(offs[il] || 0, wantL);
        if (k.end != null && k.endAngle) {                // keep the hand flat on the surface
          const ie = this.ix[k.end]; const W2 = this.world(offs, root);
          const cur = Math.atan2(W2[ie][1], W2[ie][0]);
          const want = (track(k.endAngle, t, 1) || [0])[0] * D2R;
          offs[ie] = blend(offs[ie] || 0, (offs[ie] || 0) + (want - cur));
        }
      }
    }

    poseAt(t) {
      const p = this.basePose(t);
      this.solveIK(p.offs, p.root, t);
      if (this.springs.length) this.applySprings(p, t);
      return p;
    }

    // springs: world angle of a loose bone chases where its parent carries it, with stiffness and damping,
    // plus a gentle pull toward hanging down. Integrated from t=0 at 240 Hz and cached for forward seeks.
    applySprings(p, t) {
      const dt = 1 / 240;
      let c = this._cache;
      if (!c.st || t < c.t) {
        c.t = 0; c.st = this.springs.map(() => ({ a: null, w: 0 }));
      }
      const stepTo = (tt) => {
        const q = this.basePose(tt); this.solveIK(q.offs, q.root, tt);
        this.springs.forEach((s, k) => {
          const W = this.world(q.offs, q.root);
          const target = Math.atan2(W[s.i][1], W[s.i][0]);     // where the parent would carry it rigidly
          const st = c.st[k];
          if (st.a === null) { st.a = target; st.w = 0; }
          let diff = ((target - st.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          const down = Math.PI / 2;
          let g = s.grav ? ((((down - st.a) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * s.grav : 0;
          const acc = (s.k || 120) * diff - (s.c || 9) * st.w + g;
          st.w += acc * dt; st.a += st.w * dt;
          q.offs[s.i] = (q.offs[s.i] || 0) + (st.a - target);  // so later springs in a chain see this one
        });
      };
      while (c.t + dt <= t) { c.t += dt; stepTo(c.t); }
      const W = this.world(p.offs, p.root);
      this.springs.forEach((s, k) => {
        const st = c.st[k]; if (st.a === null) return;
        const W2 = this.world(p.offs, p.root);
        const target = Math.atan2(W2[s.i][1], W2[s.i][0]);
        p.offs[s.i] = (p.offs[s.i] || 0) + (st.a - target);
      });
    }

    draw(t) {
      const p = this.poseAt(t);
      const W = this.world(p.offs, p.root);
      const S = W.map((m, i) => mul(m, this.restInv[i]));    // skin matrices
      this.d.parts.forEach((part, pi) => {
        const pts = part.pts, bi = part.bi, bw = part.bw, n = pts.length / 2;
        const out = new Float64Array(pts.length);
        for (let i = 0; i < n; i++) {
          const x = pts[2 * i], y = pts[2 * i + 1];
          let X = 0, Y = 0;
          for (let k = 0; k < 2; k++) {
            const w = bw[2 * i + k]; if (!w) continue;
            const m = S[bi[2 * i + k]];
            X += w * (m[0] * x + m[2] * y + m[4]); Y += w * (m[1] * x + m[3] * y + m[5]);
          }
          out[2 * i] = X; out[2 * i + 1] = Y;
        }
        let s = "", j = 0;
        for (const sp of part.sub) {
          const f = (v) => v.toFixed(1);
          s += `M${f(out[j])} ${f(out[j + 1])}`; j += 2;
          for (let q = 0; q < sp.n; q++) {
            s += `C${f(out[j])} ${f(out[j + 1])} ${f(out[j + 2])} ${f(out[j + 3])} ${f(out[j + 4])} ${f(out[j + 5])}`; j += 6;
          }
          if (sp.closed) s += "Z";
        }
        this.paths[pi].setAttribute("d", s);
      });
      return W;
    }

    // world position of a point given in a bone's rest frame (for attaching props, lenses, liquid emitters)
    attach(boneId, x, y, t) {
      const p = this.poseAt(t); const W = this.world(p.offs, p.root);
      const i = this.ix[boneId]; const lp = ap(this.restInv[i], x, y);
      return ap(W[i], lp[0], lp[1]);
    }
  }
  G.LPRig = Rig;
  G.LPTrack = track;
})(window);
