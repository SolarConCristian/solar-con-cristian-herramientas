/* Solar con Cristian · conversión: barra fija de contacto y seguimiento de clics (WhatsApp / formulario) para medir el costo por lead.
   Los eventos se envían a lo que esté instalado en la página: dataLayer (Google Tag Manager), gtag (Google Ads / GA4), fbq (Meta Pixel) y ttq (TikTok). */
(function () {
  'use strict';
  var bar = document.getElementById('cta-bar');

  /* barra fija: aparece al pasar el inicio y se esconde cuando ya se ve el cierre con los botones grandes */
  if (bar) {
    var hero = document.querySelector('.hero'), fin = document.querySelector('.final'), finVisible = false;
    var upd = function () {
      var past = hero ? hero.getBoundingClientRect().bottom < innerHeight * 0.35 : scrollY > innerHeight * 0.7;
      bar.classList.toggle('show', past && !finVisible);
    };
    if ('IntersectionObserver' in window && fin) new IntersectionObserver(function (es) { finVisible = es[0].isIntersecting; upd(); }, { threshold: 0.25 }).observe(fin);
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* seguimiento */
  var sent = {};
  function track(channel, where) {
    var camp = (window.__REF || '').replace(/^ \(Anuncio: |\)$/g, '');
    try {
      (window.dataLayer = window.dataLayer || []).push({ event: 'cta_click', channel: channel, location: where, campaign: camp });
      if (typeof window.gtag === 'function') window.gtag('event', channel === 'whatsapp' ? 'whatsapp_click' : 'form_click', { event_category: 'lead', event_label: where, campaign: camp });
      if (typeof window.fbq === 'function') window.fbq('track', channel === 'whatsapp' ? 'Contact' : 'Lead', { content_name: where, channel: channel });
      if (window.ttq && typeof window.ttq.track === 'function') window.ttq.track(channel === 'whatsapp' ? 'Contact' : 'SubmitForm', { content_name: where });
    } catch (e) { /* un fallo del pixel no debe frenar el clic */ }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '', channel = a.hasAttribute('data-wa') || /wa\.me|whatsapp/i.test(href) ? 'whatsapp' : /forms\.gle|docs\.google\.com\/forms/i.test(href) ? 'form' : null;
    if (!channel) return;
    var where = a.dataset.track || (a.closest('section[id]') || {}).id || 'pagina';
    var key = channel + where + Math.floor(Date.now() / 1500);
    if (sent[key]) return; sent[key] = 1;
    track(channel, where);
  }, true);
})();
