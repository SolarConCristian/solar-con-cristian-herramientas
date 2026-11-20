/* Solar con Cristian · efectos: tarjetas de cristal en 3D que se inclinan con el mouse y entran girando al bajar. */
(function () {
  'use strict';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

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
