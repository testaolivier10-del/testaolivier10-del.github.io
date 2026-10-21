/* LevlPrep studio painted part skinning (2026-10-21, studio system section 3).
   For AI painted characters: each body part is a painted PNG cut into a fine triangle mesh; every vertex follows
   the skeleton with the same weights as vector parts, so painted art bends smoothly at the joints (the way Live2D
   and Spine animate painted characters) instead of moving as stiff pieces.
   Drawn with WebGL (exact triangle edges, no seams, semi transparent paint blends correctly).
     const pr = new LPPaint(rigData, paintData, canvas, clip, baseDir);  await pr.ready;  pr.draw(t); */
(function (G) {
  const VS = `attribute vec2 p; attribute vec2 uv; uniform vec2 res; varying vec2 v;
    void main(){ v = uv; vec2 c = p / res * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); }`;
  const FS = `precision mediump float; uniform sampler2D tex; varying vec2 v; void main(){ gl_FragColor = texture2D(tex, v); }`;
  class Paint {
    constructor(rigData, paint, canvas, clip, baseDir) {
      this.rig = new G.LPRig(Object.assign({}, rigData, { parts: [] }), document.createElementNS("http://www.w3.org/2000/svg", "g"), clip);
      this.p = paint; this.cv = canvas;
      const gl = this.gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true, preserveDrawingBuffer: true });
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      const pg = this.pg = gl.createProgram(); gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pg); gl.useProgram(pg);
      this.aP = gl.getAttribLocation(pg, "p"); this.aUV = gl.getAttribLocation(pg, "uv");
      this.uRes = gl.getUniformLocation(pg, "res");
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      this.bufP = gl.createBuffer(); this.bufUV = gl.createBuffer(); this.bufI = gl.createBuffer();
      this.tex = []; this.uvn = [];
      this.ready = Promise.all(paint.parts.map((pt, k) => new Promise((res) => {
        const im = new Image(); im.onload = () => { try {
          const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          this.tex[k] = t;
          const uv = new Float32Array(pt.uv.length);
          for (let i = 0; i < pt.uv.length; i += 2) { uv[i] = pt.uv[i] / im.naturalWidth; uv[i + 1] = pt.uv[i + 1] / im.naturalHeight; }
          this.uvn[k] = uv; } catch (e) { console.error("paint part " + pt.id + ": " + e.message); } res();
        }; im.onerror = () => res(); im.src = pt.img.startsWith("data:") ? pt.img : (baseDir || "") + pt.img;
      })));
    }
    draw(t) {
      const gl = this.gl, W = this.rig.draw(t);
      const S = this.rig.bones.map((b) => this.rig.skinMatrix(b.id, W));
      gl.viewport(0, 0, this.cv.width, this.cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(this.uRes, this.cv.width, this.cv.height);
      this.p.parts.forEach((pt, k) => {
        if (!this.tex[k]) return;
        const n = pt.v.length / 2, D = new Float32Array(pt.v.length);
        for (let i = 0; i < n; i++) {
          const x = pt.v[2 * i], y = pt.v[2 * i + 1]; let X = 0, Y = 0;
          for (let j = 0; j < 2; j++) { const w = pt.bw[2 * i + j]; if (!w) continue; const m = S[pt.bi[2 * i + j]];
            X += w * (m[0] * x + m[2] * y + m[4]); Y += w * (m[1] * x + m[3] * y + m[5]); }
          D[2 * i] = X; D[2 * i + 1] = Y;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufP); gl.bufferData(gl.ARRAY_BUFFER, D, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.aP); gl.vertexAttribPointer(this.aP, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV); gl.bufferData(gl.ARRAY_BUFFER, this.uvn[k], gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.aUV); gl.vertexAttribPointer(this.aUV, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufI); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pt.t), gl.DYNAMIC_DRAW);
        gl.bindTexture(gl.TEXTURE_2D, this.tex[k]);
        gl.drawElements(gl.TRIANGLES, pt.t.length, gl.UNSIGNED_SHORT, 0);
      });
      return W;
    }
  }
  G.LPPaint = Paint;
})(window);
