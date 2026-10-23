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
