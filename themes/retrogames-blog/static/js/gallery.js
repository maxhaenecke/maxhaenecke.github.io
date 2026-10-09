// Galerie (slider-Shortcode): Lightbox mit Blättern (Pfeile, Tastatur ← →, Wischen).
// Wird von single.html nur auf Seiten mit Galerie eingebunden.
(function () {
  'use strict';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var box, img, posOut, capOut, items = [], active = 0;

  function build() {
    box = document.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Bildansicht');
    box.innerHTML =
      '<button class="lb-close t-ui" type="button" data-lb-close>Schließen <span aria-hidden="true">×</span></button>' +
      '<div class="lb-stage" data-lb-stage><img class="lb-img" alt="" draggable="false"></div>' +
      '<div class="lb-bar">' +
        '<p class="lb-cap"><span class="t-meta accent" data-lb-pos></span> <span class="t-caption" data-lb-cap></span></p>' +
        '<div class="lb-ctl">' +
          '<button class="lb-btn" type="button" data-lb-prev aria-label="Vorheriges Bild">←</button>' +
          '<button class="lb-btn" type="button" data-lb-next aria-label="Nächstes Bild">→</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);

    img    = box.querySelector('.lb-img');
    posOut = box.querySelector('[data-lb-pos]');
    capOut = box.querySelector('[data-lb-cap]');
    var stage = box.querySelector('[data-lb-stage]');

    box.querySelector('[data-lb-close]').addEventListener('click', function () { box.close(); });
    box.querySelector('[data-lb-prev]').addEventListener('click', function () { show(active - 1); });
    box.querySelector('[data-lb-next]').addEventListener('click', function () { show(active + 1); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')       { e.preventDefault(); show(active - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(active + 1); }
    });
    // Klick neben das Bild schließt
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target === stage) box.close();
    });
    box.addEventListener('close', function () {
      document.body.style.overflow = '';
      var origin = items[active];
      if (origin) origin.focus({ preventScroll: true });
    });

    // Wischen
    var startX = 0, dx = 0, pid = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || items.length < 2) return;
      pid = e.pointerId; startX = e.clientX; dx = 0;
      stage.setPointerCapture(pid);
      img.style.transition = 'none';
    });
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid) return;
      dx = e.clientX - startX;
      img.style.transform = 'translateX(' + dx + 'px)';
    });
    function end(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      img.style.transition = '';
      img.style.transform = '';
      var threshold = Math.min(60, stage.offsetWidth * 0.15);
      if (dx <= -threshold)     show(active + 1);
      else if (dx >= threshold) show(active - 1);
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  function show(i) {
    var n = items.length;
    active = (i + n) % n;
    var a = items[active];
    var thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    posOut.textContent = pad(active + 1) + ' / ' + pad(n);
    capOut.textContent = a.dataset.caption || '';
    box.querySelector('.lb-ctl').hidden = n < 2;
  }

  function open(gallery, i) {
    if (!box) build();
    items = Array.prototype.slice.call(gallery.querySelectorAll('.gallery-item'));
    show(i);
    document.body.style.overflow = 'hidden';
    box.showModal();
  }

  // Auf dem Handy stehen alle Bilder schon in voller Breite da – keine Lightbox
  var phone = window.matchMedia('(max-width: 699px)');

  function boot() {
    if (typeof HTMLDialogElement !== 'function') return; // ohne <dialog>: Link öffnet das Bild
    document.querySelectorAll('[data-gallery]').forEach(function (g) {
      g.querySelectorAll('.gallery-item').forEach(function (a, i) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          if (!phone.matches) open(g, i);
        });
      });
    });
    syncPhone();
    phone.addEventListener('change', function () {
      syncPhone();
      if (phone.matches && box && box.open) box.close();
    });
  }

  // Auf dem Handy sind die Bilder keine Links: nicht fokussierbar, ohne „vergrößern“-Label
  function syncPhone() {
    document.querySelectorAll('[data-gallery] .gallery-item').forEach(function (a) {
      if (!a.dataset.label) a.dataset.label = a.getAttribute('aria-label') || '';
      if (phone.matches) {
        a.setAttribute('tabindex', '-1');
        a.setAttribute('role', 'presentation');
        a.removeAttribute('aria-label');
      } else {
        a.removeAttribute('tabindex');
        a.removeAttribute('role');
        a.setAttribute('aria-label', a.dataset.label);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
