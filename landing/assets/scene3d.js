/* Solar con Cristian · escena 3D (three.js r128): casa de techo plano, paneles por vatiaje, equipos por marca,
   flujos de energía con partículas, día/noche. Más miniaturas 3D de cada componente.
   Modelos dibujados a mano (formas simples): no son renders oficiales de las marcas. */
(function () {
  'use strict';
  var T = window.THREE;
  function hasGL() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  if (!T || !hasGL()) { window.SolarScene = null; return; }
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COL = { pv: 0xFFC93C, load: 0x4aa3ff, bat: 0x5BC27A, grid: 0xb8bcc4, gen: 0xc9a0ff };
  // medidas reales aprox. en metros (ancho x largo) de los paneles que se instalan
  var PANEL = { 410: [1.134, 1.722, 10], 440: [1.134, 1.762, 10], 580: [1.134, 2.278, 13] };

  function std(c, o) { var m = new T.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.05 }); if (o) for (var k in o) m[k] = o[k]; return m; }
  function box(w, h, d, m) { var x = new T.Mesh(new T.BoxGeometry(w, h, d), m); x.castShadow = true; x.receiveShadow = true; return x; }
  function cyl(r1, r2, h, m, s) { var x = new T.Mesh(new T.CylinderGeometry(r1, r2, h, s || 16), m); x.castShadow = true; return x; }

  var texCache = {};
  function panelTex(rows) {
    if (texCache[rows]) return texCache[rows];
    var c = document.createElement('canvas'), W = 132, H = Math.round(132 * rows / 6 * 0.96);
    c.width = W; c.height = H; var g = c.getContext('2d');
    g.fillStyle = '#c9ced4'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#dfe3e8'; g.fillRect(0, 0, W, 5); g.fillRect(0, H - 5, W, 5); g.fillRect(0, 0, 5, H); g.fillRect(W - 5, 0, 5, H);
    var cw = (W - 14) / 6, ch = (H - 16) / rows;
    for (var r = 0; r < rows; r++) for (var k = 0; k < 6; k++) {
      var x = 7 + k * cw, y = 7 + r * ch + (r >= rows / 2 ? 2 : 0);
      var gr = g.createLinearGradient(x, y, x + cw, y + ch); gr.addColorStop(0, '#1f4277'); gr.addColorStop(1, '#0f2547');
      g.fillStyle = gr; g.fillRect(x + 0.8, y + 0.8, cw - 1.6, ch - 1.6);
      g.fillStyle = 'rgba(205,215,228,.55)'; g.fillRect(x + cw * 0.32, y + 1, 0.9, ch - 2); g.fillRect(x + cw * 0.66, y + 1, 0.9, ch - 2);
    }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; texCache[rows] = t; return t;
  }
  function screenTex(color, txt) {
    var c = document.createElement('canvas'); c.width = 64; c.height = 40; var g = c.getContext('2d');
    g.fillStyle = '#0b1215'; g.fillRect(0, 0, 64, 40); g.fillStyle = color; g.font = '600 13px sans-serif'; g.fillText(txt, 6, 25);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }

  /* ---------- modelos ---------- */
  var M = {
    panel: function (w) {
      var d = PANEL[w] || PANEL[440], side = std(0xb9bec4, { metalness: 0.6, roughness: 0.35 }), back = std(0xeeeeec);
      var top = std(0xffffff, { map: panelTex(d[2]), roughness: 0.28, metalness: 0.25 });
      var p = new T.Mesh(new T.BoxGeometry(d[0], 0.04, d[1]), [side, side, top, back, side, side]); p.castShadow = true; p.receiveShadow = true;
      var g = new T.Group(); g.add(p); g.userData.size = d; return g;
    },
    pw3: function () {
      var g = new T.Group(), body = box(0.61, 1.1, 0.19, std(0xf4f4f1, { roughness: 0.35 }));
      body.position.y = 0.55; g.add(body);
      var cap = box(0.61, 0.03, 0.19, std(0xdedfdc)); cap.position.y = 1.115; g.add(cap);
      var strip = new T.Mesh(new T.BoxGeometry(0.012, 0.32, 0.004), new T.MeshBasicMaterial({ color: 0x5BE39A })); strip.position.set(0, 0.62, 0.097); g.add(strip);
      g.userData.strip = strip; return g;
    },
    gateway: function () {
      var g = new T.Group(), b = box(0.38, 0.6, 0.15, std(0xe9eae6, { roughness: 0.4 })); b.position.y = 0.3; g.add(b);
      var l = box(0.06, 0.012, 0.004, new T.MeshBasicMaterial({ color: 0x5BE39A })); l.position.set(0, 0.45, 0.077); g.add(l); g.userData.strip = l; return g;
    },
    iq5p: function () {
      var g = new T.Group(), b = box(0.55, 0.66, 0.2, std(0xd8dcd7, { roughness: 0.45 })); b.position.y = 0.33; g.add(b);
      var t = box(0.55, 0.06, 0.205, std(0x9aa29b)); t.position.y = 0.6; g.add(t);
      var l = box(0.1, 0.012, 0.004, new T.MeshBasicMaterial({ color: 0x5BE39A })); l.position.set(0, 0.5, 0.103); g.add(l); g.userData.strip = l; return g;
    },
    sysctl: function () { var g = new T.Group(), b = box(0.5, 0.78, 0.17, std(0xcfd3cf, { roughness: 0.45 })); b.position.y = 0.39; g.add(b); var d = box(0.36, 0.5, 0.01, std(0xbfc4bf)); d.position.set(0, 0.42, 0.09); g.add(d); return g; },
    combiner: function () { var g = new T.Group(), b = box(0.5, 0.62, 0.17, std(0xd5d8d4, { roughness: 0.45 })); b.position.y = 0.31; g.add(b); var d = box(0.36, 0.4, 0.01, std(0xc4c8c3)); d.position.set(0, 0.33, 0.09); g.add(d); return g; },
    iq8: function () {
      var g = new T.Group(), b = box(0.21, 0.035, 0.17, std(0x1c1e1d, { roughness: 0.5 })); b.position.y = 0.02; g.add(b);
      var f = box(0.17, 0.01, 0.13, std(0x2b2e2c)); f.position.y = 0.042; g.add(f);
      var c1 = cyl(0.008, 0.008, 0.25, std(0x111111), 6); c1.rotation.z = Math.PI / 2; c1.position.set(-0.2, 0.02, 0); g.add(c1); return g;
    },
    eg4inv: function () {
      var g = new T.Group(), b = box(0.53, 0.8, 0.24, std(0x1b1d1c, { roughness: 0.5 })); b.position.y = 0.4; g.add(b);
      var s = new T.Mesh(new T.PlaneGeometry(0.16, 0.1), new T.MeshBasicMaterial({ map: screenTex('#6fe3ff', 'EG4') })); s.position.set(0, 0.6, 0.121); g.add(s);
      for (var i = 0; i < 6; i++) { var f = box(0.02, 0.5, 0.03, std(0x2a2d2b)); f.position.set(-0.2 + i * 0.08, 0.33, -0.13); g.add(f); }
      g.userData.strip = s; return g;
    },
    gridboss: function () { var g = new T.Group(), b = box(0.6, 0.9, 0.2, std(0x232624, { roughness: 0.5 })); b.position.y = 0.45; g.add(b); var d = box(0.45, 0.6, 0.01, std(0x2e322f)); d.position.set(0, 0.48, 0.105); g.add(d); return g; },
    eg4bat: function () {
      var g = new T.Group(), b = box(0.62, 0.98, 0.26, std(0x222524, { roughness: 0.5 })); b.position.y = 0.49; g.add(b);
      var s = new T.Mesh(new T.PlaneGeometry(0.12, 0.07), new T.MeshBasicMaterial({ map: screenTex('#5BE39A', '100%') })); s.position.set(0.18, 0.84, 0.131); g.add(s);
      var h = box(0.4, 0.04, 0.05, std(0x3a3d3b)); h.position.set(0, 0.95, 0.12); g.add(h); g.userData.strip = s; return g;
    },
    gen: function () {
      var g = new T.Group(), b = box(1.1, 0.62, 0.66, std(0x3b3f3b, { roughness: 0.6 })); b.position.y = 0.36; g.add(b);
      var f = box(1.14, 0.08, 0.7, std(0x2a2d2a)); f.position.y = 0.04; g.add(f);
      var e = cyl(0.04, 0.04, 0.25, std(0x777777), 8); e.position.set(0.4, 0.78, -0.15); g.add(e); return g;
    },
    phone: function () {
      var g = new T.Group(), b = box(0.36, 0.74, 0.04, std(0x111214, { roughness: 0.3, metalness: 0.4 })); b.position.y = 0.37; g.add(b);
      var c = document.createElement('canvas'); c.width = 90; c.height = 180; var x = c.getContext('2d');
      x.fillStyle = '#000'; x.fillRect(0, 0, 90, 180); x.fillStyle = '#fff'; x.font = '200 34px sans-serif'; x.fillText('76%', 14, 52);
      x.strokeStyle = '#FFC93C'; x.lineWidth = 3; x.beginPath(); x.arc(45, 92, 9, 0, 7); x.stroke();
      x.strokeStyle = '#5BC27A'; x.beginPath(); x.arc(45, 148, 9, 0, 7); x.stroke(); x.strokeStyle = '#4aa3ff'; x.beginPath(); x.arc(75, 120, 9, 0, 7); x.stroke();
      x.strokeStyle = '#b8bcc4'; x.beginPath(); x.arc(15, 120, 9, 0, 7); x.stroke();
      x.strokeStyle = '#444'; x.lineWidth = 2; x.beginPath(); x.moveTo(45, 101); x.lineTo(45, 139); x.moveTo(24, 120); x.lineTo(66, 120); x.stroke();
      var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding;
      var s = new T.Mesh(new T.PlaneGeometry(0.32, 0.68), new T.MeshBasicMaterial({ map: t })); s.position.set(0, 0.37, 0.021); g.add(s); return g;
    }
  };
  M.panel410 = function () { return M.panel(410); }; M.panel440 = function () { return M.panel(440); }; M.panel580 = function () { return M.panel(580); };

  /* ---------- miniaturas 3D para la lista de componentes ---------- */
  var thumbR = null, thumbCache = {};
  function thumb(kind) {
    if (thumbCache[kind]) return thumbCache[kind];
    if (!M[kind]) return null;
    try {
      if (!thumbR) { thumbR = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.setSize(160, 160); thumbR.outputEncoding = T.sRGBEncoding; }
      var sc = new T.Scene(), o = M[kind](); sc.add(o);
      sc.add(new T.HemisphereLight(0xffffff, 0x8a8f86, 0.9)); var dl = new T.DirectionalLight(0xffffff, 0.9); dl.position.set(2, 3, 4); sc.add(dl);
      var bb = new T.Box3().setFromObject(o), ctr = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3()).length();
      var cam = new T.PerspectiveCamera(30, 1, 0.01, 100);
      var flat = /panel|iq8/.test(kind);
      cam.position.copy(ctr).add(flat ? new T.Vector3(sz * 0.9, sz * 1.25, sz * 1.35) : new T.Vector3(sz * 1.15, sz * 0.75, sz * 1.65)); cam.lookAt(ctr);
      thumbR.setClearColor(0x000000, 0); thumbR.render(sc, cam);
      thumbCache[kind] = thumbR.domElement.toDataURL('image/png');
      sc.traverse(function (x) { if (x.geometry) x.geometry.dispose(); });
      return thumbCache[kind];
    } catch (e) { return null; }
  }

  /* ---------- escena de la casa ---------- */
  var SKY = [[0, 0x070d1f, 0x16213d], [5, 0x0b1430, 0x2a2f55], [6.2, 0x3b4a7a, 0xf2a46b], [7.6, 0x6fa6d8, 0xf6d7a8], [12, 0x5aa8e6, 0xcfe9fb],
    [17, 0x6aa2d4, 0xf3d3a0], [18.5, 0x3c3f73, 0xf08a5d], [19.6, 0x121a3a, 0x3a3560], [24, 0x070d1f, 0x16213d]];
  var cA = new T.Color(), cB = new T.Color();
  function skyAt(h, i) { for (var k = 0; k < SKY.length - 1; k++) if (h >= SKY[k][0] && h <= SKY[k + 1][0]) { var t = (h - SKY[k][0]) / (SKY[k + 1][0] - SKY[k][0]); return cA.setHex(SKY[k][i]).lerp(cB.setHex(SKY[k + 1][i]), t).clone(); } return new T.Color(SKY[0][i]); }

  function SolarScene(wrap, opts) {
    opts = opts || {};
    var self = this; this.wrap = wrap; this.vis = false; this.state = null; this.flows = {}; this.t = 0; this.drag = 0; this.tall = !!opts.tall;
    var R = this.r = new T.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    var LOW = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || innerWidth < 900;
    this.low = LOW;
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1.25 : 2)); R.outputEncoding = T.sRGBEncoding; R.shadowMap.enabled = !LOW; R.shadowMap.type = T.PCFSoftShadowMap;
    R.domElement.className = 'gl'; wrap.appendChild(R.domElement);
    this.labels = document.createElement('div'); this.labels.className = 'g-labels'; wrap.appendChild(this.labels);
    var S = this.scene = new T.Scene(); S.fog = new T.Fog(0xcfe9fb, 70, 220);
    this.cam = new T.PerspectiveCamera(32, 1, 0.1, 300);
    this.hemi = new T.HemisphereLight(0xdfefff, 0x48603c, 0.8); S.add(this.hemi);
    this.amb = new T.AmbientLight(0x6070a0, 0.12); S.add(this.amb);
    var sun = this.sun = new T.DirectionalLight(0xfff2d6, 1.2); sun.castShadow = !LOW; sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 90; sun.shadow.bias = -0.0006; S.add(sun); S.add(sun.target);
    this.sunBall = new T.Mesh(new T.SphereGeometry(2.2, 20, 20), new T.MeshBasicMaterial({ color: 0xFFD45A, fog: false })); S.add(this.sunBall);
    this.moon = new T.Mesh(new T.SphereGeometry(1.4, 16, 16), new T.MeshBasicMaterial({ color: 0xe8ecf5, fog: false })); S.add(this.moon);
    var sp = new Float32Array(900); for (var i = 0; i < 300; i++) { var a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.2, r = 120; sp[i * 3] = Math.cos(a) * Math.cos(e) * r; sp[i * 3 + 1] = Math.sin(e) * r; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    this.stars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0, fog: false })); S.add(this.stars);
    var ground = new T.Mesh(new T.PlaneGeometry(420, 420), std(0x355a2c, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
    this.sys = new T.Group(); S.add(this.sys);
    // arrastrar para girar
    var down = null;
    R.domElement.addEventListener('pointerdown', function (e) { down = e.clientX; R.domElement.setPointerCapture(e.pointerId); });
    R.domElement.addEventListener('pointermove', function (e) { if (down !== null) { self.drag = Math.max(-1.1, Math.min(1.1, self.drag + (e.clientX - down) * 0.006)); down = e.clientX; } });
    R.domElement.addEventListener('pointerup', function () { down = null; });
    R.domElement.style.touchAction = 'pan-y';
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { self.vis = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(wrap); else this.vis = true;
    this.resize = function () { var w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; R.setSize(w, h, false); self.cam.aspect = w / h; self.cam.updateProjectionMatrix(); self.frame(); };
    if (window.ResizeObserver) new ResizeObserver(this.resize).observe(wrap); else window.addEventListener('resize', this.resize);
    var last = performance.now();
    var loop = function (now) {
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (self.vis && self.built) { self.t += dt; self.tick(dt); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  SolarScene.prototype.clear = function () {
    var g = this.sys; while (g.children.length) { var c = g.children.pop(); c.traverse(function (x) { if (x.geometry) x.geometry.dispose(); }); }
    this.labels.innerHTML = ''; this.flows = {}; this.labs = {};
  };
  SolarScene.prototype.label = function (key, pos, cls) {
    var d = document.createElement('div'); d.className = 'g-lab ' + (cls || ''); this.labels.appendChild(d); this.labs[key] = { el: d, p: pos }; return d;
  };
  SolarScene.prototype.build = function (cfg) {
    this.clear(); this.cfg = cfg;
    var g = this.sys, brand = cfg.mode === 'off' ? 'eg4' : cfg.brand, n = Math.min(cfg.panels || 12, 64), pw = cfg.panelW || 440, d = PANEL[pw] || PANEL[440];
    // techo según cantidad de paneles (vertical, inclinación 10°)
    var tilt = 10 * Math.PI / 180, cols = Math.max(3, Math.ceil(Math.sqrt(n * 2.4))), rows = Math.ceil(n / cols);
    var stepX = d[0] + 0.05, stepZ = d[1] * Math.cos(tilt) + 0.55;
    var W = Math.max(9, cols * stepX + 1.8), D = Math.max(7.5, rows * stepZ + 1.6), H = 3.1;
    this.W = W; this.D = D;
    var wall = std(0xbfcab2, { roughness: 0.9 }), trim = std(0xe9e6dc, { roughness: 0.9 });
    var body = box(W, H, D, wall); body.position.y = H / 2; g.add(body);
    var slab = box(W + 0.4, 0.26, D + 0.4, trim); slab.position.y = H + 0.13; g.add(slab);
    [[W + 0.4, 0.36, 0.14, 0, D / 2 + 0.13], [W + 0.4, 0.36, 0.14, 0, -D / 2 - 0.13], [0.14, 0.36, D + 0.4, W / 2 + 0.13, 0], [0.14, 0.36, D + 0.4, -W / 2 - 0.13, 0]].forEach(function (p) {
      var b = box(p[0], p[1], p[2], trim); b.position.set(p[3], H + 0.42, p[4]); g.add(b);
    });
    var door = box(1.0, 2.1, 0.06, std(0x7b5b3e)); door.position.set(W * 0.08, 1.05, D / 2 + 0.03); g.add(door);
    this.winMat = new T.MeshStandardMaterial({ color: 0x9cc3dc, emissive: 0xffc56a, emissiveIntensity: 0, roughness: 0.2, metalness: 0.1 });
    [-0.3, 0.32].forEach(function (fx) { var w = box(1.5, 1.05, 0.06, this.winMat); w.position.set(W * fx, 1.75, D / 2 + 0.03); g.add(w); }, this);
    var sw = box(0.06, 1.05, 1.4, this.winMat); sw.position.set(-W / 2 - 0.03, 1.75, -D * 0.22); g.add(sw);
    var drive = box(3.2, 0.03, 6, std(0x9b9a92, { roughness: 1 })); drive.position.set(W * 0.08, 0.015, D / 2 + 3); g.add(drive);
    // paneles
    var x0 = -((cols - 1) * stepX) / 2, z0 = -((rows - 1) * stepZ) / 2, k = 0, ptex = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols && k < n; c++, k++) {
      var p = M.panel(pw); p.rotation.x = -tilt; p.position.set(x0 + c * stepX, H + 0.55 + d[1] / 2 * Math.sin(tilt), z0 + r * stepZ); g.add(p); ptex.push(p);
      var leg = box(0.04, 0.5, 0.04, std(0x9aa0a6, { metalness: 0.5 })); leg.position.set(x0 + c * stepX, H + 0.45, z0 + r * stepZ - d[1] * 0.38); g.add(leg);
      if (brand === 'enphase') { var mi = M.iq8(); mi.position.set(x0 + c * stepX, H + 0.42, z0 + r * stepZ); g.add(mi); }
    }
    this.panels = ptex;
    // equipos en la pared izquierda (-x), mirando hacia afuera
    // equipos un poco más grandes que la realidad (como en las apps) para que se lean desde lejos
    var ES = 1.7, eq = new T.Group(); eq.position.set(-W / 2 - 0.02, 0, 0); eq.rotation.y = -Math.PI / 2; eq.scale.setScalar(ES); g.add(eq);
    var bats = [], hub, units = Math.min(cfg.units || 1, 4), zc = (D / 2 - 0.9) / ES;
    var place = function (o, x, y) { o.position.set(x, y, 0); eq.add(o); return o; };
    // eq local: x = a lo largo de la pared (x local → +z del mundo, hacia el frente), y arriba, z hacia afuera
    if (brand === 'tesla') {
      for (var i = 0; i < units; i++) bats.push(place(M.pw3(), zc - 0.35 - i * 0.72, 0.05));
      hub = place(M.gateway(), zc - 0.35 - units * 0.72 - 0.2, 0.75);
    } else if (brand === 'enphase') {
      var bu = Math.min(cfg.units || 2, 6);
      for (var j = 0; j < bu; j++) bats.push(place(M.iq5p(), zc - 0.35 - (j % 3) * 0.62, j < 3 ? 0.05 : 0.78));
      var ex = zc - 0.35 - Math.min(bu, 3) * 0.62;
      hub = place(M.combiner(), ex - 0.1, 0.85); place(M.sysctl(), ex - 0.7, 0.75);
    } else {
      for (var q = 0; q < units; q++) bats.push(place(M.eg4bat(), zc - 0.4 - q * 0.72, 0.02));
      hub = place(M.eg4inv(), zc - 0.4 - units * 0.72 - 0.2, 0.75);
      if (cfg.mode === 'net' && cfg.kWp > 19) place(M.gridboss(), zc - 0.4 - units * 0.72 - 0.85, 0.7);
    }
    this.bats = bats; this.hub = hub;
    eq.updateMatrixWorld(true);
    var wp = function (o, dy) { var v = new T.Vector3(); o.getWorldPosition(v); v.y += dy || 0; return v; };
    var hubP = wp(hub, 0.8).add(new T.Vector3(-0.35, 0, 0)), batP = wp(bats[0], 1.0).add(new T.Vector3(-0.4, 0, 0));
    // poste de LUMA o generador
    var poleP = new T.Vector3(W / 2 + 3.2, 0, D / 2 + 1.6), meter = new T.Vector3(W / 2 + 0.05, 2.2, D / 2 - 1.2);
    if (cfg.mode === 'net') {
      var pole = cyl(0.13, 0.17, 7.4, std(0x6b5a48)); pole.position.set(poleP.x, 3.7, poleP.z); g.add(pole);
      var arm = box(1.6, 0.12, 0.12, std(0x6b5a48)); arm.position.set(poleP.x, 7.0, poleP.z); g.add(arm);
      var tr = cyl(0.28, 0.28, 0.7, std(0x8d958d), 14); tr.position.set(poleP.x + 0.38, 6.2, poleP.z); g.add(tr);
      var mt = box(0.1, 0.36, 0.26, std(0x9aa09a)); mt.position.copy(meter); g.add(mt);
      var wc = new T.CatmullRomCurve3([meter.clone(), new T.Vector3((meter.x + poleP.x) / 2, 5.2, (meter.z + poleP.z) / 2), new T.Vector3(poleP.x - 0.6, 6.9, poleP.z)]);
      g.add(new T.Mesh(new T.TubeGeometry(wc, 30, 0.02, 5), std(0x222222)));
      this.flow('grid', [meter, new T.Vector3((meter.x + poleP.x) / 2, 5.2, (meter.z + poleP.z) / 2), new T.Vector3(poleP.x - 0.6, 6.9, poleP.z)]);
      this.flow('load', [hubP, new T.Vector3(-W / 2 + 0.6, hubP.y, hubP.z), new T.Vector3(0, 1.6, 0)]);
      this.label('grid', new T.Vector3(poleP.x, 7.8, poleP.z));
      this.xo = box(0.9, 0.12, 0.12, new T.MeshBasicMaterial({ color: 0xff5a4a })); this.xo.position.set(poleP.x, 5.2, poleP.z + 0.3); this.xo.rotation.z = 0.7; g.add(this.xo);
      this.xo2 = this.xo.clone(); this.xo2.rotation.z = -0.7; g.add(this.xo2);
    } else {
      this.flow('load', [hubP, new T.Vector3(-W / 2 + 0.6, hubP.y, hubP.z), new T.Vector3(0, 1.6, 0)]);
      if (cfg.gen) {
        var gn = M.gen(); gn.position.set(-W / 2 - 2.4, 0, -D * 0.25); gn.rotation.y = Math.PI / 2; g.add(gn);
        this.flow('gen', [new T.Vector3(-W / 2 - 2.0, 0.6, -D * 0.25), new T.Vector3(-W / 2 - 1.0, 0.2, hubP.z - 0.5), hubP.clone().add(new T.Vector3(0, -0.3, 0))]);
        this.label('gen', new T.Vector3(-W / 2 - 2.4, 1.4, -D * 0.25));
      }
    }
    var roofEdge = new T.Vector3(-W / 2 + 0.6, H + 0.6, hubP.z);
    this.flow('pv', [roofEdge, new T.Vector3(-W / 2 - 0.25, H + 0.2, hubP.z), new T.Vector3(-W / 2 - 0.25, hubP.y + 0.6, hubP.z), hubP]);
    this.flow('bat', [hubP, new T.Vector3(hubP.x - 0.15, (hubP.y + batP.y) / 2, (hubP.z + batP.z) / 2), batP]);
    this.label('pv', new T.Vector3(0, H + 2.3, 0)); this.label('bat', wp(bats[0], 2.3).add(new T.Vector3(-0.6, 0, 0))); this.label('home', new T.Vector3(W * 0.3, H + 1.2, D / 2));
    // palma
    var palm = new T.Group(), trunk = std(0x8a6a4a), leaf = std(0x2f6b2a, { side: T.DoubleSide });
    for (var s = 0; s < 8; s++) { var tk = cyl(0.13 - s * 0.008, 0.15 - s * 0.008, 0.62, trunk, 8); tk.position.set(Math.sin(s * 0.18) * 0.25 * s / 8, 0.31 + s * 0.6, 0); palm.add(tk); }
    for (var f = 0; f < 7; f++) { var lf = new T.Mesh(new T.ConeGeometry(0.35, 2.6, 4), leaf); lf.castShadow = true; lf.position.set(0.25, 5.0, 0); lf.rotation.set(0, f * 0.9, 1.25 + (f % 2) * 0.25); lf.translateY(1.1); palm.add(lf); }
    palm.position.set(W / 2 + 1.8, 0, -D / 2 + 0.5); g.add(palm);
    this.built = true; this.frame(); this.resize();
  };
  SolarScene.prototype.flow = function (key, pts) {
    var curve = new T.CatmullRomCurve3(pts), g = this.sys;
    var tube = new T.Mesh(new T.TubeGeometry(curve, 40, 0.035, 6), new T.MeshBasicMaterial({ color: 0x111614, transparent: true, opacity: 0.35 })); g.add(tube);
    var dots = [], m = new T.MeshBasicMaterial({ color: COL[key] });
    for (var i = 0; i < 10; i++) { var s = new T.Mesh(new T.SphereGeometry(0.075, 10, 10), m); s.visible = false; g.add(s); dots.push(s); }
    this.flows[key] = { c: curve, dots: dots, off: 0, v: 0 };
  };
  SolarScene.prototype.frame = function () {
    if (!this.W) return;
    var span = Math.max(this.W, this.D) + 6, a = this.cam.aspect || 1.6;
    this.dist = span * (a < 1.1 ? 1.55 : 1.08) + 1;
  };
  SolarScene.prototype.update = function (s) {
    this.state = s; if (!this.built) return;
    var h = s.h, day = h > 6.1 && h < 18.9, t = (h - 6) / 12.8, el = day ? Math.sin(Math.PI * t) : 0, night = 1 - Math.min(1, el * 3);
    var top = skyAt(h, 1), bot = skyAt(h, 2);
    if (s.cloudy) { top.lerp(new T.Color(0x8d97a3), 0.55 * (1 - night)); bot.lerp(new T.Color(0xb7bec6), 0.55 * (1 - night)); }
    this.scene.background = top; this.scene.fog.color = bot;
    var ang = Math.PI * Math.max(0, Math.min(1, t));
    this.sun.position.set(-Math.cos(ang) * 30, Math.max(2, Math.sin(ang) * 32), 18);
    this.sun.intensity = day ? (0.25 + 1.1 * el) * (s.cloudy ? 0.45 : 1) : 0;
    this.sunBall.position.set(-Math.cos(ang) * 95, Math.sin(ang) * 70 + 4, -60); this.sunBall.visible = day && !s.cloudy;
    var hm = ((h + 12) % 24 - 6) / 12.8, ma = Math.PI * Math.max(0, Math.min(1, hm));
    this.moon.position.set(-Math.cos(ma) * 95, Math.sin(ma) * 60 + 4, -60); this.moon.visible = !day;
    this.hemi.intensity = 0.18 + 0.75 * (1 - night); this.amb.intensity = 0.08 + 0.18 * night;
    this.stars.material.opacity = night * 0.9;
    var dark = s.unmet > 0.01;
    this.winMat.emissiveIntensity = dark ? 0 : night * 0.9; this.winMat.color.setHex(dark ? 0x2b2f36 : night > 0.5 ? 0x6b5a3a : 0x9cc3dc);
    var pvr = Math.min(1, s.pv / Math.max(0.1, s.kWp * 0.8));
    this.bats.concat([this.hub]).forEach(function (b) { var st = b.userData.strip; if (st && st.material.color) st.material.color.setHex(s.bat > 0.05 ? 0x5BE39A : s.bat < -0.05 ? 0x4aa3ff : 0x9aa09a); });
    if (this.xo) { this.xo.visible = this.xo2.visible = !!s.outage; }
    var P = { pv: s.pv, load: s.load, bat: s.bat, grid: -s.grid, gen: s.gen };
    for (var k in this.flows) { var f = this.flows[k]; f.v = P[k] || 0; if (k === 'grid' && s.outage) f.v = 0; }
    var L = this.labs, kw = function (v) { return Math.abs(v).toFixed(1) + ' kW'; };
    if (L.pv) L.pv.el.innerHTML = '<i style="background:#FFC93C"></i>Solar ' + kw(s.pv);
    if (L.bat) L.bat.el.innerHTML = '<i style="background:#5BC27A"></i>' + s.battName + ' ' + Math.round(s.soc * 100) + '%';
    if (L.home) L.home.el.innerHTML = '<i style="background:#4aa3ff"></i>Casa ' + kw(s.load);
    if (L.grid) L.grid.el.innerHTML = '<i style="background:#b8bcc4"></i>' + (s.outage ? 'LUMA · apagón' : 'LUMA ' + (s.grid < -0.05 ? '↑ ' : s.grid > 0.05 ? '↓ ' : '') + kw(s.grid));
    if (L.gen) L.gen.el.innerHTML = '<i style="background:#c9a0ff"></i>Generador ' + kw(s.gen);
    if (RM || !this.vis) this.tick(0);
  };
  var V = new T.Vector3();
  SolarScene.prototype.tick = function (dt) {
    var cam = this.cam, ref = Math.max(1, (this.state && this.state.kWp) || 5) * 0.5;
    var az = -0.78 + this.drag + (RM ? 0 : Math.sin(this.t * 0.12) * 0.1), elv = this.tall ? 0.36 : 0.27, D = this.dist || 30, tx = -(this.W || 9) * 0.12;
    cam.position.set(tx + Math.sin(az) * Math.cos(elv) * D, Math.sin(elv) * D + 1.8, Math.cos(az) * Math.cos(elv) * D); cam.lookAt(tx, 2.0, 0);
    for (var k in this.flows) {
      var f = this.flows[k], on = Math.abs(f.v) > 0.05;
      if (on) f.off = (f.off + (f.v > 0 ? 1 : -1) * (0.18 + 0.55 * Math.min(1, Math.abs(f.v) / ref)) * dt + 1) % 1;
      for (var i = 0; i < f.dots.length; i++) {
        var d = f.dots[i]; d.visible = on; if (!on) continue;
        f.c.getPointAt(((i / f.dots.length) + f.off) % 1, d.position);
      }
    }
    this.r.render(this.scene, cam);
    var w = this.r.domElement.clientWidth, h = this.r.domElement.clientHeight;
    for (var key in this.labs) {
      var l = this.labs[key]; V.copy(l.p).project(cam);
      var half = l.el.offsetWidth / 2 + 4, px = Math.max(half, Math.min(w - half, (V.x + 1) / 2 * w));
      l.el.style.transform = 'translate(-50%,-100%) translate(' + px.toFixed(1) + 'px,' + ((1 - V.y) / 2 * h).toFixed(1) + 'px)';
      l.el.style.opacity = V.z < 1 ? 1 : 0;
    }
  };
  SolarScene.thumb = thumb;
  window.SolarScene = SolarScene;
})();
