/* Docks Overseas — interaction layer.
   No dependencies. Everything degrades to a plain, readable page. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- boot ------------------------------------------------------ */
  function ready() { document.documentElement.classList.add('is-ready'); }
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', function () { setTimeout(ready, reduced ? 0 : 240); });

  /* ---------- headline: wrap words so they can rise out of a mask ------- */
  $$('[data-words]').forEach(function (el) {
    var i = 0;
    el.innerHTML = el.innerHTML.replace(/([^\s<>]+)(?![^<]*>)/g, function (word) {
      if (!word.trim()) return word;
      return '<span class="w"><i style="--i:' + (i++) + '">' + word + '</i></span>';
    });
    el.classList.add('reveal-words');
  });

  /* ---------- nav ------------------------------------------------------- */
  var nav = $('#nav');
  var toggle = $('.nav-toggle');
  var drawer = $('#drawer');

  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- scroll driver (one rAF loop for everything) --------------- */
  var bar = $('.progress');
  var parallax = $$('[data-parallax]');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (nav) nav.classList.toggle('is-stuck', y > 24);

    if (!reduced) {
      var vh = window.innerHeight;
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.dataset.parallax) || 0.1;
        // progress of the element through the viewport, centred on 0
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (p * speed * -100).toFixed(2) + 'px,0)';
      });
    }
    ticking = false;
  }

  function requestScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ---------- reveal on enter ------------------------------------------ */
  if ('IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    $$('[data-reveal]').forEach(function (el) {
      // deep links land mid-page: anything already scrolled past shows at once
      if (el.getBoundingClientRect().bottom < 0) { el.classList.add('in'); return; }
      revealer.observe(el);
    });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- counters -------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var dur = 1500, t0 = null;
    var dec = (String(target).split('.')[1] || '').length;

    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    if (reduced) { el.textContent = target.toFixed(dec) + suffix; return; }
    requestAnimationFrame(frame);
  }

  /* only leaf elements: data-count on a container would wipe its children */
  function countables() {
    return $$('[data-count]').filter(function (el) { return !el.firstElementChild; });
  }

  if ('IntersectionObserver' in window) {
    var counter = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); counter.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    countables().forEach(function (el) { counter.observe(el); });
  } else {
    countables().forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
  }

  /* ---------- card spotlight + 3D tilt ---------------------------------- */
  $$('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      if (reduced || !card.classList.contains('tilt')) return;
      card.style.setProperty('--ryy', (((x / r.width) - 0.5) * 9).toFixed(2) + 'deg');
      card.style.setProperty('--rx',  (((0.5 - (y / r.height))) * 9).toFixed(2) + 'deg');
      card.style.setProperty('--ty', '-6px');
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--ryy', '0deg');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ty', '0px');
    });
  });

  /* ---------- hero: orbs drift with the pointer ------------------------- */
  var stage = $('.stage');
  if (stage && !reduced && window.matchMedia('(pointer:fine)').matches) {
    var orbs = $$('.orb', stage);
    window.addEventListener('pointermove', function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);
      orbs.forEach(function (orb, i) {
        var depth = 10 + i * 7;
        orb.style.marginLeft = (cx * depth).toFixed(1) + 'px';
        orb.style.marginTop  = (cy * depth).toFixed(1) + 'px';
      });
    }, { passive: true });
  }

  /* ---------- process steps -------------------------------------------- */
  var steps = $$('.step');
  if (steps.length && 'IntersectionObserver' in window) {
    var figures = $$('.rail-figure > g');
    var countEl = $('.rail-count');
    var stepper = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var idx = steps.indexOf(e.target);
        steps.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
        figures.forEach(function (g, i) { g.classList.toggle('on', i === idx); });
        if (countEl) countEl.textContent = '0' + (idx + 1);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { stepper.observe(s); });
    steps[0].classList.add('on');
  }

  /* ---------- produce rotator ------------------------------------------
     A ring of produce you can drag, click, arrow or tab through. The panels
     are real DOM, so with JS off they simply stack and stay readable.        */
  var rotator = $('#rotator');
  if (rotator) {
    var stage  = $('.rot-stage', rotator);
    var ring   = $('.ring', rotator);
    var pods   = $$('.pod', rotator);
    var items  = $$('.rot-item', rotator);
    var dotBox = $('.rot-dots', rotator);
    var n = pods.length, step = 360 / n;

    var rot = 0, target = 0, active = -1;
    var dragging = false, lastX = 0, travel = 0;
    var idleSince = Date.now(), visible = false, running = false;

    pods.forEach(function () {
      var d = document.createElement('i');
      dotBox.appendChild(d);
    });
    var dots = $$('i', dotBox);

    function norm(i) { return ((i % n) + n) % n; }

    function setActive(i) {
      if (i === active) return;
      active = i;
      pods.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
      items.forEach(function (a, k) { a.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    }

    function goTo(i) {
      var cur = Math.round(-target / step);
      var delta = norm(i - norm(cur));
      if (delta > n / 2) delta -= n;
      target = -(cur + delta) * step;
      idleSince = Date.now();
    }

    function nudge(dir) { goTo(norm(active + dir)); }

    function frame() {
      if (!visible) { running = false; return; }

      if (!dragging && !reduced &&
          Date.now() - idleSince > 6500 &&
          !rotator.matches(':hover') && !rotator.contains(document.activeElement)) {
        nudge(1);
      }

      rot += (target - rot) * 0.11;
      ring.style.setProperty('--rot', rot.toFixed(2) + 'deg');

      pods.forEach(function (p, i) {
        var c = Math.cos((i * step + rot) * Math.PI / 180); // 1 = facing us
        var t = (c + 1) / 2;
        p.style.setProperty('--s', (0.6 + 0.4 * t * t).toFixed(3));
        p.style.opacity = (0.14 + 0.86 * t * t).toFixed(3);
        p.style.zIndex = Math.round(100 + c * 100);
      });

      setActive(norm(Math.round(-rot / step)));
      requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

    /* drag */
    stage.addEventListener('pointerdown', function (e) {
      dragging = true; travel = 0; lastX = e.clientX;
      idleSince = Date.now();
      stage.classList.add('is-dragging');
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX; travel += Math.abs(dx);
      target += dx * 0.45;
      rot += dx * 0.45;                 // follow the finger with no lag
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (e && e.pointerId != null && stage.hasPointerCapture(e.pointerId)) {
        stage.releasePointerCapture(e.pointerId);
      }
      target = Math.round(target / step) * step;   // snap to the nearest face
      idleSince = Date.now();
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    /* click a pod — but not when that click was the end of a drag */
    pods.forEach(function (p, i) {
      p.addEventListener('click', function (e) {
        if (travel > 6) { e.preventDefault(); return; }
        goTo(i);
      });
      p.addEventListener('focus', function () { goTo(i); });
    });

    $$('.spin', rotator).forEach(function (b) {
      b.addEventListener('click', function () { nudge(parseInt(b.dataset.dir, 10)); });
    });

    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { nudge(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { nudge(1);  e.preventDefault(); }
    });

    /* only animate while it is on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }, { threshold: 0.15 }).observe(rotator);
    } else {
      visible = true; start();
    }

    setActive(0);
  }

  /* ---------- enquiry form ---------------------------------------------
     No backend here on purpose: the form composes a well-formatted mail to
     the sales address. Swap ACTION below for a real endpoint when you have
     one (Formspree / Netlify Forms / your own handler).                     */
  var form = $('#enquiry');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = [
        'Name: '     + (d.get('name') || ''),
        'Company: '  + (d.get('company') || ''),
        'Country: '  + (d.get('country') || ''),
        'Email: '    + (d.get('email') || ''),
        'Phone: '    + (d.get('phone') || ''),
        'Produce: '  + (d.get('produce') || ''),
        'Volume: '   + (d.get('volume') || ''),
        'Incoterm: ' + (d.get('incoterm') || ''),
        '',
        d.get('message') || ''
      ].join('\n');

      var href = 'mailto:' + form.dataset.to +
        '?subject=' + encodeURIComponent('Enquiry — ' + (d.get('produce') || 'Fresh produce')) +
        '&body=' + encodeURIComponent(body);

      window.location.href = href;
      var status = $('.form-status', form);
      if (status) status.classList.add('show');
    });
  }

  /* ---------- year ------------------------------------------------------ */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
