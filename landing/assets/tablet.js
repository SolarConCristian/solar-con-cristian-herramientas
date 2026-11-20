/* Solar con Cristian · tablet 3D que se acerca y recorre los equipos al bajar (GSAP + ScrollTrigger).
   Técnica inspirada en una pieza de referencia (tablet inclinada + zoom a pantalla + objeto 3D por sección); contenido, colores y textos propios. */
(function () {
  'use strict';
  var sec = document.getElementById('tablet');
  if (!sec) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var dev = $('.tb-dev', sec), page = $('#tb-page', sec), slides = $$('.sl', sec), pin = $('.tb-pin', sec), intro = $('.tb-intro', sec);
  var ring = $('.tb-ring .fg', sec), dots = $$('.tb-dots i', sec);
  var N = slides.length;
  var mq = window.matchMedia('(max-width: 760px)');

  if (!gsap || !ST || RM) { sec.classList.add('tablet-static'); slides.forEach(function (s) { s.classList.add('on'); }); return; }
  gsap.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });

  var P = function () { return mq.matches; };
  function fit() {
    // escala para que la tablet (ya de frente) ocupe casi todo el escenario
    var W = dev.offsetWidth, H = dev.offsetHeight, vw = pin.clientWidth, vh = window.innerHeight;
    return Math.min(1.12, (vw * 0.94) / W, (vh * 0.92) / H);
  }
  var applyClass = function () { sec.classList.toggle('tb-pt', P()); };
  applyClass();
  ST.addEventListener('refreshInit', applyClass);

  var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  // 0 → 1.2: la cámara deriva despacio (paralaje) con la tablet inclinada y aparece el titular
  tl.fromTo(intro, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0);
  tl.fromTo(dev,
    { rotateX: function () { return P() ? 48 : 58; }, rotateY: 0, rotateZ: function () { return P() ? -14 : -26; }, scale: function () { return fit() * (P() ? 0.62 : 0.68); }, y: function () { return P() ? 70 : 40; } },
    { rotateX: function () { return P() ? 40 : 50; }, rotateZ: function () { return P() ? -8 : -17; }, scale: function () { return fit() * (P() ? 0.7 : 0.74); }, y: function () { return P() ? 50 : 20; }, duration: 1.2, ease: 'none', immediateRender: true }, 0);
  // 1.2 → 2.4: la tablet se endereza y la cámara entra a la pantalla
  tl.to(intro, { opacity: 0, y: -30, duration: 0.5 }, 1.2);
  tl.to(dev, { rotateX: 0, rotateY: 0, rotateZ: 0, scale: function () { return fit(); }, y: 0, duration: 1.2 }, 1.2);
  // secciones: la página sube una pantalla a la vez (1.5 por sección: 0.9 de movimiento + pausa)
  var segStart = 2.6, t = segStart;
  for (var i = 1; i < N; i++) {
    tl.to(page, { yPercent: -(100 / N) * i, duration: 0.9, ease: 'power3.inOut' }, t);
    tl.to(dev, { rotateY: i % 2 ? 3 : -3, rotateX: 2, duration: 0.45, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t);
    t += 1.5;
  }
  tl.to({}, { duration: 0.6 }, t);
  var total = tl.duration(), counted = false;

  function countUp() {
    $$('.nums b[data-n]', sec).forEach(function (b) {
      var to = +b.dataset.n, o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.1, ease: 'power2.out', onUpdate: function () { b.textContent = Math.round(o.v); } });
    });
  }
  function sync() {
    var tt = tl.time(), idx = tt < segStart + 0.45 ? 0 : Math.min(N - 1, Math.floor((tt - segStart - 0.45) / 1.5) + 1);
    slides.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === idx); });
    ring.style.strokeDashoffset = (94.2 * (1 - Math.min(1, tt / total))).toFixed(1);
    if (idx === 4 && !counted) { counted = true; countUp(); }
    if (idx < 3) counted = false;
  }
  tl.eventCallback('onUpdate', sync);

  ST.create({
    trigger: sec, start: 'top top', end: function () { return '+=' + Math.round(total * 540); },
    pin: '.tb-stage', scrub: 0.7, anticipatePin: 1, animation: tl, invalidateOnRefresh: true, refreshPriority: 10
  });
  sync();
})();
