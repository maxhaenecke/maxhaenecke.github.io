// Galerie (slider-Shortcode): Lightbox mit Blättern (Pfeile, Tastatur ← →, Wischen).
// Wird von single.html nur auf Seiten mit Galerie eingebunden.
(function () {
  'use strict';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var box, img, posOut, numOut, capOut, items = [], active = 0;

  function build() {
    box = document.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Bildansicht');
    box.innerHTML =
      '<div class="lb-stage" data-lb-stage><img class="lb-img" alt="" draggable="false"></div>' +
      '<div class="lb-bar">' +
        '<p class="lb-cap"><span class="t-meta accent" data-lb-num></span><span class="t-caption" data-lb-cap></span></p>' +
        '<div class="lb-ctl">' +
          '<button class="lb-btn" type="button" data-lb-prev aria-label="Vorheriges Bild">←</button>' +
          '<span class="t-meta" data-lb-pos></span>' +
          '<button class="lb-btn" type="button" data-lb-next aria-label="Nächstes Bild">→</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);

    img    = box.querySelector('.lb-img');
    posOut = box.querySelector('[data-lb-pos]');
    numOut = box.querySelector('[data-lb-num]');
    capOut = box.querySelector('[data-lb-cap]');
    var stage = box.querySelector('[data-lb-stage]');

    box.querySelector('[data-lb-prev]').addEventListener('click', function () { show(active - 1, -1); });
    box.querySelector('[data-lb-next]').addEventListener('click', function () { show(active + 1, 1); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')       { e.preventDefault(); show(active - 1, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(active + 1, 1); }
    });
    // Klick neben das Fenster (auf die abgedunkelte Seite) schließt
    box.addEventListener('click', function (e) {
      if (e.target !== box) return;
      var r = box.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) box.close();
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
      img.style.transform = '';
      var threshold = Math.min(60, stage.offsetWidth * 0.15);
      // Beim Wechsel setzt die Animation an der losgelassenen Position an
      if (dx <= -threshold)     show(active + 1, 1, dx);
      else if (dx >= threshold) show(active - 1, -1, dx);
      else img.style.transition = ''; // zurückfedern
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var token = 0;
  var SHIFT = 48; // seitlicher Weg der Wechsel-Animation in px

  // Bild wechseln; dir = 1 (vor) / -1 (zurück) animiert seitlich, fromX = Wischposition
  function show(i, dir, fromX) {
    var n = items.length;
    active = (i + n) % n;
    var a = items[active];
    var my = ++token;
    img.getAnimations().forEach(function (an) { an.cancel(); });

    if (!dir || reduce.matches || !img.animate) {
      render(a, n);
      img.style.transition = '';
      return;
    }

    var out = img.animate([
      { transform: 'translateX(' + (fromX || 0) + 'px)', opacity: 1 },
      { transform: 'translateX(' + (-dir * SHIFT) + 'px)', opacity: 0 }
    ], { duration: 160, easing: 'ease-in', fill: 'forwards' });

    out.finished.then(function () {
      if (my !== token) return;
      render(a, n);
      return (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
        if (my !== token) return;
        out.cancel();
        img.style.transition = '';
        img.animate([
          { transform: 'translateX(' + (dir * SHIFT) + 'px)', opacity: 0 },
          { transform: 'translateX(0)', opacity: 1 }
        ], { duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)' });
      });
    }).catch(function () {}); // abgebrochen durch schnellen Weiterklick
  }

  function render(a, n) {
    var thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    posOut.textContent = pad(active + 1) + ' / ' + pad(n);
    capOut.textContent = a.dataset.caption || '';
    // „Abb. n“ wie im Artikel: Einzelabbildungen und Galeriebilder zählen gemeinsam
    var all = Array.prototype.slice.call(document.querySelectorAll('.article-body .fig, .article-body .gallery-item'));
    numOut.textContent = 'Abb. ' + pad(all.indexOf(a) + 1);
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
