(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ── Fade-in on scroll ────────────────────────────────────
  if (!('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = el.dataset.fadeDelay || '0';
      setTimeout(function () { el.classList.add('is-visible'); }, +delay);
      observer.unobserve(el);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  function addFade(el, delay) {
    el.classList.add('fade-in');
    if (delay) el.dataset.fadeDelay = delay;
    observer.observe(el);
  }

  document.querySelectorAll('.blog-section-head').forEach(function (el) { addFade(el, 0); });
  document.querySelectorAll('.blog-featured').forEach(function (el) { addFade(el, 0); });
  document.querySelectorAll('.blog-pill-row').forEach(function (el) { addFade(el, 0); });

  document.querySelectorAll('.blog-grid').forEach(function (grid) {
    grid.querySelectorAll('.blog-card').forEach(function (card, i) {
      addFade(card, (i % 3) * 80);
    });
  });

})();

// ── Auto-hide nav: hides on scroll down, reappears on scroll up ──
(function () {
  'use strict';

  var nav = document.querySelector('.blog-nav');
  if (!nav) return;

  function syncNavHeight() {
    document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
  }
  syncNavHeight();
  window.addEventListener('resize', syncNavHeight);

  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = Math.max(window.scrollY, 0);

    if (y <= nav.offsetHeight) {
      nav.classList.remove('is-hidden');
    } else if (y > lastY) {
      nav.classList.add('is-hidden');
    } else if (y < lastY) {
      nav.classList.remove('is-hidden');
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
})();
