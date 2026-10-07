// ── Scroll-Reveal (Startseite) ───────────────────────────────
// Elemente mit [data-reveal], die beim Laden unterhalb des sichtbaren
// Bereichs liegen, blenden beim Eintreten ein – gleichzeitig eintretende
// versetzt um je 90 ms. Nur einmal; ohne JS oder bei reduzierter Bewegung
// bleibt alles sofort sichtbar.
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var els = Array.prototype.filter.call(document.querySelectorAll('[data-reveal]'), function (el) {
    return el.getBoundingClientRect().top > window.innerHeight;
  });
  if (!els.length) return;

  els.forEach(function (el) { el.classList.add('reveal-pending'); });

  var observer = new IntersectionObserver(function (entries) {
    var i = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      observer.unobserve(el);
      var delay = i++ * 90;
      el.style.transitionDelay = delay + 'ms';
      el.classList.add('is-revealing');
      el.classList.remove('reveal-pending');
      // Nach Ende der Animation (0,7 s + Versatz) Ebene und Verzögerung abräumen
      setTimeout(function () {
        el.style.transitionDelay = '';
        el.classList.remove('is-revealing');
      }, delay + 800);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

  els.forEach(function (el) { observer.observe(el); });
})();
