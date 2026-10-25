/* Portfolio interactions. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- theme toggle ---------- */
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  /* ---------- mobile nav ---------- */
  var navBtn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (navBtn && nav) {
    navBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- email links (assembled to avoid scrapers) ---------- */
  document.querySelectorAll('.email-link').forEach(function (a) {
    var u = a.getAttribute('data-user'), d = a.getAttribute('data-domain');
    if (!u || !d) return;
    var addr = u + '@' + d;
    a.href = 'mailto:' + addr;
    if (a.textContent.indexOf('[at]') !== -1) a.textContent = addr;
  });

  /* ---------- career network map ---------- */
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function drawNetmap(fig) {
    var items = Array.prototype.map.call(fig.querySelectorAll('.netmap__list li'), function (li) {
      return {
        label: li.querySelector('.netmap__org').textContent.trim(),
        detail: (li.querySelector('.netmap__detail') || { textContent: '' }).textContent.trim(),
        track: li.getAttribute('data-track') === 'industry' ? 'industry' : 'academic'
      };
    });
    if (!items.length) return;
    var sides = {
      academic: items.filter(function (i) { return i.track === 'academic'; }),
      industry: items.filter(function (i) { return i.track === 'industry'; })
    };
    var rows = Math.max(sides.academic.length, sides.industry.length, 3);
    var W = 720, rowGap = 70, top = 34;
    var H = top * 2 + (rows - 1) * rowGap;
    var cx = W / 2, cy = H / 2;
    var chipW = 110, chipH = Math.max(140, Math.min(H - 80, rows * 28 + 40));
    var padR = 6, c = 10;

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Career network: academia on the left, industry on the right' });
    var gTraces = el('g', {}, svg), gChip = el('g', {}, svg), gNodes = el('g', {}, svg);
    var traces = [];

    ['academic', 'industry'].forEach(function (side) {
      var list = sides[side];
      var n = list.length; if (!n) return;
      var sx = side === 'academic' ? -1 : 1;
      var edgeX = cx + sx * (chipW / 2 + 8);
      var padX = side === 'academic' ? 196 : W - 196;
      var pinGap = Math.min(24, (chipH - 40) / Math.max(n - 1, 1));
      var offset = (rows - n) * rowGap / 2;
      var span = Math.abs(padX - edgeX);

      var routes = list.map(function (node, i) {
        return { node: node, py: cy + (i - (n - 1) / 2) * pinGap, ty: top + offset + i * rowGap, i: i };
      });
      var up = routes.filter(function (r) { return r.ty < r.py - 1; });
      var down = routes.filter(function (r) { return r.ty > r.py + 1; }).reverse();
      var lanes = Math.max(up.length, down.length, 1);
      var laneGap = Math.min(26, (span - 44) / lanes);
      up.forEach(function (r, k) { r.lane = k; });
      down.forEach(function (r, k) { r.lane = k; });

      routes.forEach(function (r) {
        var d;
        var dy = r.ty - r.py, sy = dy > 0 ? 1 : -1;
        var endX = padX - sx * padR;
        if (Math.abs(dy) <= 1) {
          d = 'M' + edgeX + ' ' + r.py + 'H' + endX;
        } else {
          var laneX = edgeX + sx * (22 + r.lane * laneGap);
          var cc = Math.min(c, Math.abs(dy) / 2);
          d = 'M' + edgeX + ' ' + r.py +
              'L' + (laneX - sx * cc) + ' ' + r.py +
              'L' + laneX + ' ' + (r.py + sy * cc) +
              'L' + laneX + ' ' + (r.ty - sy * cc) +
              'L' + (laneX + sx * cc) + ' ' + r.ty +
              'L' + endX + ' ' + r.ty;
        }
        var path = el('path', { d: d, class: 'trace trace--' + side }, gTraces);
        // chip pin
        el('rect', { x: side === 'academic' ? edgeX : cx + chipW / 2, y: r.py - 2, width: 8, height: 4, class: 'chip-pin' }, gChip);

        var g = el('g', { class: 'node', tabindex: '0', role: 'listitem' }, gNodes);
        var pad = el('circle', { cx: padX, cy: r.ty, r: padR, class: 'pad pad--' + side }, g);
        var lx = padX + sx * 14;
        var anchor = side === 'academic' ? 'end' : 'start';
        var t = el('text', { x: lx, y: r.ty + 5, 'text-anchor': anchor, class: 'lbl' }, g);
        t.textContent = r.node.label;
        var s = el('text', { x: lx, y: r.ty + 23, 'text-anchor': anchor, class: 'lbl-sub' }, g);
        s.textContent = r.node.detail;
        var title = el('title', {}, g); title.textContent = r.node.label + (r.node.detail ? ': ' + r.node.detail : '');
        traces.push({ path: path, node: g, pad: pad });

        function on() { fig.classList.add('has-focus'); path.classList.add('is-on'); g.classList.add('is-on'); }
        function off() { fig.classList.remove('has-focus'); path.classList.remove('is-on'); g.classList.remove('is-on'); }
        g.addEventListener('mouseenter', on); g.addEventListener('mouseleave', off);
        g.addEventListener('focus', on); g.addEventListener('blur', off);
      });
    });

    // the chip (you)
    el('rect', { x: cx - chipW / 2, y: cy - chipH / 2, width: chipW, height: chipH, rx: 9, class: 'chip' }, gChip);
    el('circle', { cx: cx - chipW / 2 + 13, cy: cy - chipH / 2 + 13, r: 3.5, class: 'chip-pin' }, gChip);
    var ini = el('text', { x: cx, y: cy + 10, 'text-anchor': 'middle', class: 'chip-text' }, gChip);
    ini.textContent = fig.getAttribute('data-initials') || '';
    gNodes.setAttribute('role', 'list');

    fig.insertBefore(svg, fig.querySelector('.netmap__list'));
    fig.classList.add('is-drawn');

    // one orchestrated moment: traces power up outward from the chip
    if (!reduceMotion && 'getTotalLength' in traces[0].path) {
      traces.forEach(function (t, i) {
        var len = t.path.getTotalLength();
        t.path.style.strokeDasharray = len;
        t.path.style.strokeDashoffset = len;
        t.node.style.opacity = '0';
        var delay = 250 + i * 110, dur = 750;
        var pulse = el('circle', { r: 4, class: 'pulse', opacity: '0' }, gTraces);
        setTimeout(function () {
          var start = null;
          function step(ts) {
            if (start === null) start = ts;
            var k = Math.min(1, (ts - start) / dur);
            var e = 1 - Math.pow(1 - k, 3);
            t.path.style.strokeDashoffset = len * (1 - e);
            var pt = t.path.getPointAtLength(len * e);
            pulse.setAttribute('cx', pt.x); pulse.setAttribute('cy', pt.y);
            pulse.setAttribute('opacity', k < 1 ? '1' : '0');
            if (k < 1) { requestAnimationFrame(step); }
            else {
              t.path.style.strokeDasharray = ''; t.path.style.strokeDashoffset = '';
              t.node.style.transition = 'opacity .35s'; t.node.style.opacity = '1';
              pulse.remove();
            }
          }
          requestAnimationFrame(step);
        }, delay);
      });
    }
  }

  document.querySelectorAll('[data-netmap]').forEach(function (fig) {
    try { drawNetmap(fig); } catch (e) { /* list fallback stays visible */ }
    function fit() { fig.classList.toggle('is-list', fig.clientWidth < 420); }
    fit();
    window.addEventListener('resize', fit);
  });

  /* ---------- publication filters ---------- */
  var filters = document.querySelector('[data-pub-filters]');
  if (filters) {
    var state = { type: 'all', final: false, q: '' };
    var pubs = document.querySelectorAll('[data-pub-list] [data-pub]');
    var empty = document.querySelector('[data-pub-empty]');
    var finalStatuses = ['published', 'presented', 'accepted'];
    function apply() {
      var shown = 0;
      pubs.forEach(function (p) {
        var ok = (state.type === 'all' || p.getAttribute('data-type') === state.type) &&
                 (!state.final || finalStatuses.indexOf(p.getAttribute('data-status')) !== -1) &&
                 (!state.q || p.getAttribute('data-text').indexOf(state.q) !== -1);
        p.hidden = !ok; if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }
    filters.querySelectorAll('[data-filter-type]').forEach(function (b) {
      b.addEventListener('click', function () {
        filters.querySelectorAll('[data-filter-type]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        state.type = b.getAttribute('data-filter-type'); apply();
      });
    });
    var fin = filters.querySelector('[data-filter-final]');
    if (fin) fin.addEventListener('change', function () { state.final = fin.checked; apply(); });
    var q = filters.querySelector('[data-filter-q]');
    if (q) q.addEventListener('input', function () { state.q = q.value.trim().toLowerCase(); apply(); });
  }

  /* ---------- experience track filter ---------- */
  var tf = document.querySelector('[data-track-filter]');
  if (tf) {
    var items = document.querySelectorAll('[data-timeline] [data-track]');
    tf.querySelectorAll('[data-track]').forEach(function (b) {
      b.addEventListener('click', function () {
        tf.querySelectorAll('[data-track]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        var want = b.getAttribute('data-track');
        items.forEach(function (it) { it.hidden = want !== 'all' && it.getAttribute('data-track') !== want; });
      });
    });
  }
})();

/* ======================================================================
   v2: Venn diagram, education reveal, mentoring motion
   ====================================================================== */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function onVisible(node, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: threshold || 0.25 });
    io.observe(node);
  }

  /* ---------- Venn ---------- */
  function wrap(text, max) {
    if (text.length <= max) return [text];
    var mid = text.length / 2, best = -1;
    for (var i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)];
  }

  function drawVenn(fig) {
    var setEls = fig.querySelectorAll('.venn__set');
    var ids = Array.prototype.map.call(setEls, function (s) { return s.getAttribute('data-set'); });
    if (ids.length !== 3) return;
    var labels = Array.prototype.map.call(setEls, function (s) { return s.querySelector('.venn__set-name').textContent.trim(); });
    var areas = Array.prototype.map.call(fig.querySelectorAll('.venn__areas li'), function (li) {
      var inn = (li.getAttribute('data-in') || '').split(/\s+/);
      return { name: li.textContent.trim(), idx: ids.map(function (id, i) { return inn.indexOf(id) !== -1 ? i : -1; }).filter(function (i) { return i >= 0; }) };
    });

    var W = 680, H = 600, R = 182;
    var C = [[250, 222], [430, 222], [340, 378]];
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
    var gC = el('g', {}, svg), gT = el('g', {}, svg);
    var circles = C.map(function (c, i) {
      return el('circle', { cx: c[0], cy: c[1], r: R, class: 'venn__c venn__c--' + i, 'data-i': i }, gC);
    });
    // set names outside the circles
    var lp = [[C[0][0] - 92, 22, 'middle'], [C[1][0] + 92, 22, 'middle'], [C[2][0], H - 6, 'middle']];
    labels.forEach(function (t, i) {
      var tx = el('text', { x: lp[i][0], y: lp[i][1], 'text-anchor': lp[i][2], class: 'venn__label venn__label--' + i, 'data-i': i }, gT);
      tx.textContent = t;
    });

    // region centroids by sampling
    function inside(x, y, i) { var dx = x - C[i][0], dy = y - C[i][1]; return dx * dx + dy * dy < R * R; }
    var acc = {};
    for (var y = 0; y < H; y += 4) for (var x = 0; x < W; x += 4) {
      var k = '';
      for (var i = 0; i < 3; i++) if (inside(x, y, i)) k += i;
      if (!k) continue;
      (acc[k] = acc[k] || { x: 0, y: 0, n: 0 });
      acc[k].x += x; acc[k].y += y; acc[k].n++;
    }
    var groups = {};
    areas.forEach(function (a) { var k = a.idx.join(''); (groups[k] = groups[k] || []).push(a); });

    var texts = [];
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], c = acc[k];
      if (!c) return;
      var cx = c.x / c.n, cy = c.y / c.n;
      if (k === '012') {
        el('circle', { cx: cx, cy: cy, r: 50, class: 'venn__core-ring' }, gT);
      }
      var lines = [];
      g.forEach(function (a, ai) {
        var parts = k === '012' ? wrap(a.name, 9) : wrap(a.name, 17);
        parts.forEach(function (p, pi) { lines.push({ text: p, area: a, gap: ai > 0 && pi === 0 }); });
      });
      var lh = k === '012' ? 21 : 18.5, gap = 7;
      var total = lines.length * lh + lines.filter(function (l) { return l.gap; }).length * gap;
      var yy = cy - total / 2 + lh * 0.75;
      lines.forEach(function (l) {
        if (l.gap) yy += gap;
        var t = el('text', { x: cx, y: yy, 'text-anchor': 'middle', class: 'venn__t' + (k === '012' ? ' venn__t--core' : '') }, gT);
        t.textContent = l.text;
        t.__area = l.area;
        texts.push(t);
        yy += lh;
      });
    });

    fig.querySelector('.venn__stage').appendChild(svg);
    fig.classList.add('is-drawn');

    // interactions
    function focusSet(i) {
      if (i === null) { fig.removeAttribute('data-focus'); }
      else fig.setAttribute('data-focus', i);
      texts.forEach(function (t) { t.classList.toggle('is-on', i !== null && t.__area.idx.indexOf(+i) !== -1); });
      setEls.forEach(function (s, si) { s.classList.toggle('is-on', i !== null && si === +i); });
    }
    function focusArea(a) {
      fig.classList.toggle('has-area', !!a);
      circles.forEach(function (c, ci) { c.classList.toggle('is-on', !!a && a.idx.indexOf(ci) !== -1); });
      texts.forEach(function (t) { t.classList.toggle('is-on', !!a && t.__area === a); });
      setEls.forEach(function (s, si) { s.classList.toggle('is-on', !!a && a.idx.indexOf(si) !== -1); });
    }
    circles.concat(Array.prototype.slice.call(gT.querySelectorAll('.venn__label'))).forEach(function (c) {
      c.addEventListener('mouseenter', function () { focusSet(c.getAttribute('data-i')); });
      c.addEventListener('mouseleave', function () { focusSet(null); });
    });
    setEls.forEach(function (s, i) {
      ['mouseenter', 'focus'].forEach(function (ev) { s.addEventListener(ev, function () { focusSet(i); }); });
      ['mouseleave', 'blur'].forEach(function (ev) { s.addEventListener(ev, function () { focusSet(null); }); });
    });
    texts.forEach(function (t) {
      t.addEventListener('mouseenter', function () { focusArea(t.__area); });
      t.addEventListener('mouseleave', function () { focusArea(null); });
    });

    // reveal: circles drift in from the centre once
    if (!reduceMotion) {
      var mid = [(C[0][0] + C[1][0] + C[2][0]) / 3, (C[0][1] + C[1][1] + C[2][1]) / 3];
      circles.forEach(function (c, i) {
        c.style.transformOrigin = mid[0] + 'px ' + mid[1] + 'px';
        c.style.transform = 'translate(' + (mid[0] - C[i][0]) * 0.5 + 'px,' + (mid[1] - C[i][1]) * 0.5 + 'px) scale(.6)';
        c.style.opacity = '0';
      });
      gT.style.opacity = '0';
      onVisible(fig, function () {
        circles.forEach(function (c, i) {
          c.style.transition = 'transform .9s cubic-bezier(.3,.7,.2,1) ' + i * 0.12 + 's, opacity .6s ' + i * 0.12 + 's, fill-opacity .25s, stroke-width .25s';
          c.style.transform = ''; c.style.opacity = '1';
        });
        gT.style.transition = 'opacity .6s .7s'; gT.style.opacity = '1';
      });
    }
  }
  document.querySelectorAll('[data-venn]').forEach(function (fig) {
    try { drawVenn(fig); } catch (e) {}
    function fit() { fig.classList.toggle('is-list', fig.clientWidth < 540); }
    fit(); window.addEventListener('resize', fit);
  });

  /* ---------- education reveal ---------- */
  document.querySelectorAll('[data-edu]').forEach(function (ol) {
    if (reduceMotion) return;
    var r = ol.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.85) return; // already on screen: no animation
    ol.classList.add('is-armed');
    onVisible(ol, function () { ol.classList.add('is-in'); }, 0.3);
  });

  /* ---------- count-up stats ---------- */
  document.querySelectorAll('[data-stats]').forEach(function (box) {
    if (reduceMotion) return;
    var nums = box.querySelectorAll('[data-count]');
    nums.forEach(function (n) { n.textContent = '0' + (n.getAttribute('data-suffix') || ''); });
    onVisible(box, function () {
      nums.forEach(function (n) {
        var to = +n.getAttribute('data-count'), suf = n.getAttribute('data-suffix') || '', start = null, dur = 1400;
        function step(ts) {
          if (start === null) start = ts;
          var k = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - k, 4);
          n.textContent = Math.round(to * e) + suf;
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    });
  });

  /* ---------- carousel ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (car) {
    var track = car.querySelector('.carousel__track');
    var slides = Array.prototype.slice.call(track.children);
    var dotsBox = car.querySelector('[data-car-dots]');
    var prev = car.querySelector('[data-car-prev]'), next = car.querySelector('[data-car-next]');
    var dots = slides.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Go to team ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dotsBox.appendChild(b); return b;
    });
    function step() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; }
    function current() { return Math.round(track.scrollLeft / step()); }
    function maxIndex() { return Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / step())); }
    function go(i) { track.scrollTo({ left: i * step(), behavior: reduceMotion ? 'auto' : 'smooth' }); }
    function update() {
      var c = current(), m = maxIndex();
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === c ? 'true' : 'false'); d.hidden = i > m; });
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === c); });
      prev.disabled = c <= 0; next.disabled = c >= m;
    }
    prev.addEventListener('click', function () { go(Math.max(0, current() - 1)); });
    next.addEventListener('click', function () { go(Math.min(maxIndex(), current() + 1)); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
    // gentle autoplay: pauses on hover, focus, touch, or when off-screen
    if (!reduceMotion && slides.length > 1) {
      var hold = false, seen = false;
      ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { car.addEventListener(ev, function () { hold = true; }, { passive: true }); });
      ['mouseleave', 'focusout'].forEach(function (ev) { car.addEventListener(ev, function () { hold = false; }); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.5 }).observe(car);
      setInterval(function () {
        if (hold || !seen || document.hidden) return;
        var c = current(); go(c >= maxIndex() ? 0 : c + 1);
      }, 4500);
    }
  });

  /* ---------- flip cards ---------- */
  document.querySelectorAll('[data-flip]').forEach(function (f) {
    function toggle() {
      var on = f.classList.toggle('is-flipped');
      f.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    f.addEventListener('click', toggle);
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  /* ---------- marquee grid toggle ---------- */
  document.querySelectorAll('[data-marquee]').forEach(function (mq) {
    var b = mq.querySelector('[data-marquee-toggle]');
    if (!b) return;
    b.addEventListener('click', function () {
      var on = mq.classList.toggle('is-grid');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Play as a ticker' : 'Show all as a grid';
    });
  });

  /* ---------- deck ---------- */
  document.querySelectorAll('[data-deck]').forEach(function (deck) {
    var cards = Array.prototype.slice.call(deck.querySelectorAll('.deck__card'));
    var order = cards.map(function (c, i) { return i; });
    var counter = deck.querySelector('[data-deck-i]'), pos = 0, busy = false;
    function layout() {
      order.forEach(function (ci, p) {
        var c = cards[ci];
        c.setAttribute('data-pos', Math.min(p, 3));
        if (p === 0) { c.removeAttribute('aria-hidden'); c.inert = false; }
        else { c.setAttribute('aria-hidden', 'true'); c.inert = true; }
      });
      counter.textContent = (pos % cards.length) + 1;
    }
    function nextCard() {
      if (busy) return; busy = true;
      var top = cards[order[0]];
      top.classList.add('is-leaving');
      setTimeout(function () {
        top.classList.remove('is-leaving');
        order.push(order.shift()); pos = (pos + 1) % cards.length; layout(); busy = false;
      }, reduceMotion ? 0 : 420);
    }
    function prevCard() {
      order.unshift(order.pop()); pos = (pos - 1 + cards.length) % cards.length; layout();
    }
    deck.querySelector('[data-deck-next]').addEventListener('click', nextCard);
    deck.querySelector('[data-deck-prev]').addEventListener('click', prevCard);
    deck.querySelector('.deck__stack').addEventListener('click', nextCard);
    layout();
  });
})();

/* ---------- badge zoom viewer ---------- */
(function () {
  'use strict';
  if (!document.querySelector('[data-zoom]') || typeof HTMLDialogElement === 'undefined') return;
  var d = document.createElement('dialog');
  d.className = 'zoom';
  d.innerHTML = '<button type="button" class="zoom__close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><figure class="zoom__frame"><img alt=""><figcaption class="zoom__cap"></figcaption></figure>';
  document.body.appendChild(d);
  var img = d.querySelector('img'), cap = d.querySelector('.zoom__cap');
  d.querySelector('.zoom__close').addEventListener('click', function () { d.close(); });
  d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-zoom]');
    if (!b) return;
    var src = b.querySelector('img');
    if (!src) return;
    img.src = src.currentSrc || src.src;
    img.alt = b.getAttribute('data-caption') || '';
    cap.textContent = b.getAttribute('data-caption') || '';
    d.showModal();
  });
})();

/* ---------- photo carousel ---------- */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-pcar]').forEach(function (root) {
    var track = root.querySelector('.pcar__track');
    var real = Array.prototype.slice.call(track.children);
    var n = real.length;
    if (n < 2) return;
    // clones at both ends for a seamless loop
    var first = real[0].cloneNode(true), last = real[n - 1].cloneNode(true);
    [first, last].forEach(function (c) { c.setAttribute('aria-hidden', 'true'); c.querySelector('button').tabIndex = -1; var im = c.querySelector('img'); im.loading = 'eager'; });
    track.appendChild(first); track.insertBefore(last, real[0]);
    var pos = 1, timer = null, hold = false, seen = false, busy = false, MS = 4500;
    var dotsBox = root.querySelector('[data-pcar-dots]');
    var dots = real.map(function (s, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Show photo ' + (i + 1));
      b.addEventListener('click', function () { go(i + 1, true); });
      dotsBox.appendChild(b); return b;
    });
    function place(animate) {
      track.classList.toggle('is-animating', !!animate && !reduce);
      track.style.transform = 'translateX(' + (-pos * 100) + '%)';
    }
    function sync() {
      var k = (pos - 1 + n) % n;
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === k ? 'true' : 'false'); });
      real.forEach(function (s, i) { s.setAttribute('aria-hidden', i === k ? 'false' : 'true'); s.querySelector('button').tabIndex = i === k ? 0 : -1; });
      var next = real[(k + 1) % n].querySelector('img'); if (next.loading === 'lazy') next.loading = 'eager';
    }
    function go(p, user) {
      if (busy) return;
      pos = p; busy = !reduce; place(true); sync();
      if (reduce) settle();
      if (user) { hold = true; setTimeout(function () { hold = false; restart(); }, 8000); }
      restart();
    }
    function settle() {
      busy = false;
      if (pos === 0) { pos = n; place(false); }
      if (pos === n + 1) { pos = 1; place(false); }
    }
    track.addEventListener('transitionend', function (e) { if (e.target === track) settle(); });
    function restart() {
      clearTimeout(timer);
      if (reduce || hold || !seen) return;
      timer = setTimeout(function () { if (!document.hidden) go(pos + 1); else restart(); }, MS);
    }
    root.querySelector('[data-pcar-prev]').addEventListener('click', function () { go(pos - 1, true); });
    root.querySelector('[data-pcar-next]').addEventListener('click', function () { go(pos + 1, true); });
    root.addEventListener('mouseenter', function () { hold = true; clearTimeout(timer); });
    root.addEventListener('mouseleave', function () { hold = false; restart(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(pos + 1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(pos - 1, true); e.preventDefault(); }
    });
    // swipe / drag
    var vp = root.querySelector('.pcar__viewport'), x0 = null, dx = 0, moved = false;
    vp.addEventListener('pointerdown', function (e) { if (busy) return; x0 = e.clientX; dx = 0; moved = false; });
    vp.addEventListener('pointermove', function (e) {
      if (x0 === null) return;
      dx = e.clientX - x0;
      if (Math.abs(dx) > 6) { moved = true; track.classList.remove('is-animating'); track.style.transform = 'translateX(calc(' + (-pos * 100) + '% + ' + dx + 'px))'; }
    });
    function end() {
      if (x0 === null) return;
      x0 = null;
      if (Math.abs(dx) > 50) go(pos + (dx < 0 ? 1 : -1), true); else place(true);
    }
    vp.addEventListener('pointerup', end); vp.addEventListener('pointerleave', end); vp.addEventListener('pointercancel', end);
    vp.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; restart(); }, { threshold: 0.35 }).observe(root);
    else seen = true;
    place(false); sync();
  });
})();
