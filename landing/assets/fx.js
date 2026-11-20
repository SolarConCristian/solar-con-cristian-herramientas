/* Solar con Cristian · efectos: chispas eléctricas al arrastrar el mouse (o el dedo) y tarjetas de cristal en 3D que se inclinan. */
(function () {
  'use strict';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- chispas */
  if (!RM) {
    var cv = document.createElement('canvas'); cv.id = 'sparks'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var fit = function () { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); addEventListener('resize', fit);
    var sp = [], bolts = [], down = false, lx = 0, ly = 0, run = false, acc = 0;
    var COLS = ['255,255,255', '255,214,102', '255,170,60', '190,245,90'];
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var blocked = function (el) { return el && el.closest && el.closest('input,textarea,select,canvas.gl,.ap-tabs,.hr'); };

    function bolt(x, y, ang, len) {
      var pts = [[x, y]], n = 7 + (Math.random() * 4 | 0), cx = x, cy = y;
      for (var i = 0; i < n; i++) {
        ang += rnd(-0.9, 0.9); var l = len / n * rnd(0.7, 1.3);
        cx += Math.cos(ang) * l; cy += Math.sin(ang) * l; pts.push([cx, cy]);
      }
      bolts.push({ pts: pts, life: 1, w: rnd(1.2, 2.4) });
      if (Math.random() < 0.5) { var k = 2 + (Math.random() * (n - 3) | 0); bolts.push({ pts: [pts[k]].concat(branch(pts[k], ang + rnd(-1.2, 1.2), len * 0.5)), life: 0.8, w: 1 }); }
    }
    function branch(p, ang, len) {
      var out = [], cx = p[0], cy = p[1];
      for (var i = 0; i < 4; i++) { ang += rnd(-0.8, 0.8); cx += Math.cos(ang) * len / 4; cy += Math.sin(ang) * len / 4; out.push([cx, cy]); }
      return out;
    }
    function emit(x, y, dx, dy, strong) {
      var base = Math.atan2(dy, dx), n = strong ? 6 : 3;
      for (var i = 0; i < n && sp.length < 420; i++) {
        var a = base + Math.PI + rnd(-1.7, 1.7), v = rnd(90, 340);
        sp.push({ x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: Math.cos(a) * v, vy: Math.sin(a) * v - rnd(0, 50), life: 1, d: rnd(1.4, 2.6), c: COLS[Math.random() * COLS.length | 0], r: rnd(1.4, 3.2) });
      }
      if (Math.random() < (strong ? 0.5 : 0.2)) bolt(x, y, Math.random() * Math.PI * 2, rnd(40, 120));
    }
    function loop(t) {
      ctx.clearRect(0, 0, W, H);
      var dt = Math.min(0.05, (t - (loop.t || t)) / 1000); loop.t = t;
      ctx.globalCompositeOperation = 'lighter';
      for (var i = sp.length - 1; i >= 0; i--) {
        var p = sp[i]; p.life -= dt * p.d; if (p.life <= 0) { sp.splice(i, 1); continue; }
        p.vy += 380 * dt; p.vx *= 0.985; var ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.strokeStyle = 'rgba(' + p.c + ',' + (p.life * 0.95).toFixed(2) + ')'; ctx.lineWidth = p.r; ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(255,170,60,.9)'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p.x - p.vx * 0.012, p.y - p.vy * 0.012); ctx.stroke();
      }
      for (var j = bolts.length - 1; j >= 0; j--) {
        var b = bolts[j]; b.life -= dt * 3.2; if (b.life <= 0) { bolts.splice(j, 1); continue; }
        ctx.strokeStyle = 'rgba(255,236,170,' + b.life.toFixed(2) + ')'; ctx.lineWidth = b.w; ctx.shadowColor = 'rgba(255,190,70,1)'; ctx.shadowBlur = 16; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(b.pts[0][0], b.pts[0][1]); for (var q = 1; q < b.pts.length; q++) ctx.lineTo(b.pts[q][0], b.pts[q][1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,' + (b.life * 0.9).toFixed(2) + ')'; ctx.lineWidth = b.w * 0.45; ctx.shadowBlur = 0; ctx.stroke();
      }
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
      if (sp.length || bolts.length || down) requestAnimationFrame(loop); else run = false;
    }
    var kick = function () { if (!run) { run = true; loop.t = performance.now(); requestAnimationFrame(loop); } };
    var move = function (x, y) {
      var dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy);
      if (d < 2) return;
      acc += d;
      var steps = Math.max(1, Math.floor(d / 7));
      for (var s = 1; s <= steps; s++) emit(lx + dx * s / steps, ly + dy * s / steps, dx, dy, d > 40);
      lx = x; ly = y; kick();
    };
    addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (blocked(e.target)) { down = false; return; }
      down = true; lx = e.clientX; ly = e.clientY; acc = 0;
    }, { passive: true });
    addEventListener('pointermove', function (e) {
      if (!down || (e.pointerType === 'mouse' && !(e.buttons & 1))) return;
      if (acc > 12) document.documentElement.classList.add('sparking');
      move(e.clientX, e.clientY);
    }, { passive: true });
    var up = function (e) {
      if (down && acc > 12) { for (var i = 0; i < 3; i++) bolt(e.clientX || lx, e.clientY || ly, Math.random() * 6.28, rnd(40, 110)); kick(); }
      down = false; document.documentElement.classList.remove('sparking');
    };
    addEventListener('pointerup', up, { passive: true }); addEventListener('pointercancel', function () { down = false; document.documentElement.classList.remove('sparking'); }, { passive: true });
    // dedo: al arrastrar para bajar también salen chispas (touchmove no bloquea el scroll)
    addEventListener('touchstart', function (e) { var t = e.touches[0]; if (!blocked(e.target)) { down = true; lx = t.clientX; ly = t.clientY; acc = 0; } }, { passive: true });
    addEventListener('touchmove', function (e) { if (!down) return; var t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    addEventListener('touchend', function () { down = false; }, { passive: true });
  }

  /* ---------------------------------------------------------------- tarjetas 3D */
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var cards = $$('.cd, .two > div, .panel, .res:not(#billan)');
  cards.forEach(function (el) { el.classList.add('tilt'); });
  if (!RM && fine) {
    cards.forEach(function (el) {
      var raf = 0, tx = 0, ty = 0;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        tx = (0.5 - py) * 7; ty = (px - 0.5) * 9;
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0; el.style.transform = 'perspective(1100px) rotateX(' + tx.toFixed(2) + 'deg) rotateY(' + ty.toFixed(2) + 'deg) translateZ(0)';
          el.style.setProperty('--mx', (px * 100).toFixed(0) + '%'); el.style.setProperty('--my', (py * 100).toFixed(0) + '%'); el.style.setProperty('--gl', 1);
        });
      });
      el.addEventListener('pointerleave', function () { el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; el.style.setProperty('--gl', 0); setTimeout(function () { el.style.transition = ''; }, 520); });
    });
  }
  // entrada en 3D al bajar: las tarjetas giran desde atrás
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (gsap && ST && !RM) {
    gsap.registerPlugin(ST);
    $$('.cards, .two').forEach(function (g) {
      $$('.cd, .two > div', g).forEach(function (el, i) {
        gsap.fromTo(el, { rotateX: 22, z: -90, transformPerspective: 1100, transformOrigin: '50% 100%', opacity: 0.001 }, { rotateX: 0, z: 0, opacity: 1, duration: 1.1, delay: i * 0.1, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 85%' }, clearProps: 'transform,opacity' });
      });
    });
  }
})();
