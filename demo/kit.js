/* Общие помощники для демо-дашбордов. Все данные в демо выдуманные, строятся из фиксированного зерна. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var K = window.K = {};

  K.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  K.fmt = function (n, d) { return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
  K.money = function (n) { return K.fmt(n) + ' $'; };
  K.pct = function (n, d) { return K.fmt(n, d == null ? 1 : d) + '%'; };
  K.esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

  K.deltaHtml = function (cur, prev, goodUp, unit) {
    var d = cur - prev, p = prev ? d / prev * 100 : 0;
    var up = d >= 0, good = goodUp === false ? !up : up;
    var cls = Math.abs(p) < 0.5 ? 'flat' : (good ? 'up' : 'down');
    return '<span class="delta ' + cls + '">' + (up ? '+' : '') + K.fmt(p, 1) + '% к прошлому периоду</span>';
  };
  K.kpis = function (items) {
    return '<dl class="kpis">' + items.map(function (i) {
      return '<div class="kpi"><dt>' + K.esc(i.l) + '</dt><dd>' + i.v + '</dd>' + (i.d || '') + '</div>';
    }).join('') + '</dl>';
  };

  /* подсказка при наведении */
  var tt;
  K.tip = function (el, html) {
    if (!tt) { tt = document.createElement('div'); tt.className = 'tt'; document.body.appendChild(tt); }
    function mv(e) { var t = e.touches ? e.touches[0] : e; tt.style.left = Math.min(t.clientX + 14, innerWidth - 250) + 'px'; tt.style.top = (t.clientY + 14) + 'px'; }
    el.addEventListener('mouseenter', function (e) { tt.innerHTML = html; tt.style.opacity = 1; mv(e); });
    el.addEventListener('mousemove', mv);
    el.addEventListener('mouseleave', function () { tt.style.opacity = 0; });
  };
  K.toast = function (msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(K._tt); K._tt = setTimeout(function () { t.classList.remove('on'); }, 2600);
  };

  function s(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function nice(max) {
    var p = Math.pow(10, Math.floor(Math.log10(max || 1))), f = max / p;
    var steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (f <= steps[i] + 1e-9) return steps[i] * p;
    return 10 * p;
  }
  function frame(host, w, h) {
    var svg = s('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'chart', role: 'img' });
    host.innerHTML = ''; host.appendChild(svg); return svg;
  }
  function legend(host, series) {
    var l = document.createElement('div'); l.className = 'legend';
    l.innerHTML = series.map(function (x) { return '<span><i style="background:' + x.color + '"></i>' + K.esc(x.name) + '</span>'; }).join('');
    host.parentNode.insertBefore(l, host);
  }

  /* линия / несколько линий; dashed: индекс с которого линия пунктирная (прогноз) */
  K.line = function (host, labels, series, o) {
    o = o || {};
    var W = 640, H = o.h || 240, L = 58, R = 12, T = 12, B = 28;
    var svg = frame(host, W, H), max = 0;
    series.forEach(function (x) { x.data.forEach(function (v) { if (v > max) max = v; }); });
    max = nice(max * 1.05);
    var X = function (i) { return L + (W - L - R) * i / Math.max(1, labels.length - 1); };
    var Y = function (v) { return T + (H - T - B) * (1 - v / max); };
    for (var g = 0; g <= 4; g++) {
      var v = max * g / 4, y = Y(v);
      s('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: 'var(--line)' }, svg);
      s('text', { x: L - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--muted)' }, svg).textContent = o.axis ? o.axis(v) : K.fmt(v);
    }
    var step = Math.ceil(labels.length / 8);
    labels.forEach(function (lb, i) { if (i % step === 0) s('text', { x: X(i), y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, svg).textContent = lb; });
    series.forEach(function (x) {
      var cut = x.dashFrom == null ? x.data.length : x.dashFrom;
      var solid = x.data.slice(0, cut), dash = x.data.slice(Math.max(0, cut - 1));
      function path(arr, off) { return arr.map(function (v, i) { return (i ? 'L' : 'M') + X(i + off).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(''); }
      if (o.area && series.length === 1) s('path', { d: path(solid, 0) + 'L' + X(solid.length - 1) + ' ' + Y(0) + 'L' + X(0) + ' ' + Y(0) + 'Z', fill: x.color, opacity: .1 }, svg);
      s('path', { d: path(solid, 0), fill: 'none', stroke: x.color, 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      if (cut < x.data.length) s('path', { d: path(dash, cut - 1), fill: 'none', stroke: x.color, 'stroke-width': 2.4, 'stroke-dasharray': '5 5', opacity: .7 }, svg);
    });
    labels.forEach(function (lb, i) {
      var hit = s('rect', { x: X(i) - (W - L - R) / labels.length / 2, y: T, width: (W - L - R) / labels.length, height: H - T - B, fill: 'transparent' }, svg);
      K.tip(hit, '<b>' + K.esc(lb) + '</b><br>' + series.map(function (x) { return K.esc(x.name) + ': ' + (o.axis ? o.axis(x.data[i]) : K.fmt(x.data[i], o.d || 0)); }).join('<br>'));
    });
    if (series.length > 1 || o.legend) legend(host, series);
  };

  /* столбики, можно стопкой */
  K.bars = function (host, labels, series, o) {
    o = o || {};
    var W = 640, H = o.h || 240, L = 58, R = 12, T = 12, B = 28;
    var svg = frame(host, W, H), max = 0;
    labels.forEach(function (_, i) {
      var tot = o.stack ? series.reduce(function (a, x) { return a + x.data[i]; }, 0) : Math.max.apply(null, series.map(function (x) { return x.data[i]; }));
      if (tot > max) max = tot;
    });
    max = nice(max * 1.05);
    var Y = function (v) { return T + (H - T - B) * (1 - v / max); };
    for (var g = 0; g <= 4; g++) {
      var y = Y(max * g / 4);
      s('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: 'var(--line)' }, svg);
      s('text', { x: L - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--muted)' }, svg).textContent = o.axis ? o.axis(max * g / 4) : K.fmt(max * g / 4);
    }
    var slot = (W - L - R) / labels.length, bw = Math.min(40, slot * .68 / (o.stack ? 1 : series.length));
    var step = Math.ceil(labels.length / 10);
    labels.forEach(function (lb, i) {
      var cx = L + slot * (i + .5), acc = 0;
      if (i % step === 0) s('text', { x: cx, y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, svg).textContent = lb;
      series.forEach(function (x, k) {
        var v = x.data[i], x0 = o.stack ? cx - bw / 2 : cx - bw * series.length / 2 + bw * k;
        var y0 = o.stack ? Y(acc + v) : Y(v), hgt = o.stack ? Y(acc) - Y(acc + v) : Y(0) - Y(v);
        var col = x.colors ? x.colors[i] : x.color;
        s('rect', { x: x0, y: y0, width: bw - (o.stack ? 0 : 2), height: Math.max(0, hgt), rx: 3, fill: col }, svg);
        acc += v;
      });
      var hit = s('rect', { x: cx - slot / 2, y: T, width: slot, height: H - T - B, fill: 'transparent' }, svg);
      K.tip(hit, '<b>' + K.esc(lb) + '</b><br>' + series.map(function (x) { return K.esc(x.name) + ': ' + (o.axis ? o.axis(x.data[i]) : K.fmt(x.data[i])); }).join('<br>'));
    });
    if (series.length > 1) legend(host, series);
  };

  /* тепловая карта: matrix[row][col] */
  K.heat = function (host, rows, cols, matrix, o) {
    o = o || {};
    var max = 0; matrix.forEach(function (r) { r.forEach(function (v) { if (v != null && v > max) max = v; }); });
    var color = o.color || [0, 136, 204];
    var t = '<div class="scroll"><table><thead><tr><th>' + K.esc(o.corner || '') + '</th>' + cols.map(function (c) { return '<th class="num">' + K.esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r, i) {
      t += '<tr><td><b>' + K.esc(r) + '</b></td>' + matrix[i].map(function (v) {
        if (v == null) return '<td class="num" style="color:var(--muted)">–</td>';
        var a = max ? .08 + .8 * v / max : 0;
        return '<td class="num" style="background:rgba(' + color.join(',') + ',' + a.toFixed(2) + ');color:' + (a > .55 ? '#fff' : 'var(--text)') + '">' + (o.cell ? o.cell(v) : K.fmt(v)) + '</td>';
      }).join('') + '</tr>';
    });
    host.innerHTML = t + '</tbody></table></div>';
  };

  /* воронка из горизонтальных полос */
  K.funnel = function (host, stages) {
    var top = stages[0].v;
    host.innerHTML = stages.map(function (st, i) {
      var w = Math.max(6, st.v / top * 100), conv = i ? ' <span style="color:var(--muted);font-weight:400">(' + K.fmt(st.v / stages[i - 1].v * 100, 1) + '% от предыдущего)</span>' : '';
      return '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span>' + K.esc(st.n) + conv + '</span><b>' + K.fmt(st.v) + '</b></div>' +
        '<div style="background:var(--track);border-radius:7px;height:22px;overflow:hidden"><div style="width:' + w + '%;height:100%;border-radius:7px;background:' + (st.c || 'var(--accent)') + '"></div></div></div>';
    }).join('');
  };

  /* горизонтальные полоски */
  K.hbars = function (host, rows, o) {
    o = o || {};
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; }));
    host.innerHTML = rows.map(function (r) {
      return '<div class="bar-row"><span>' + K.esc(r.n) + '</span><div class="track"><div class="fill" style="width:' + (r.v / max * 100) + '%;' + (r.c ? 'background:' + r.c : '') + '"></div></div><b>' + (o.fmt ? o.fmt(r.v) : K.fmt(r.v)) + '</b></div>';
    }).join('');
  };

  /* шапка и меню с переключением разделов */
  K.app = function (cfg) {
    var menu = document.querySelector('.menu'), panel = document.getElementById('panel');
    var btns = cfg.sections.map(function (sec) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = sec.t;
      b.addEventListener('click', function () { show(sec.id, true); });
      menu.appendChild(b); return b;
    });
    function show(id, push) {
      var idx = 0; cfg.sections.forEach(function (x, i) { if (x.id === id) idx = i; });
      var sec = cfg.sections[idx];
      document.getElementById('title').textContent = sec.t;
      document.getElementById('subtitle').textContent = sec.s || '';
      panel.innerHTML = ''; sec.render(panel);
      panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter');
      btns.forEach(function (b, i) { b.setAttribute('aria-selected', i === idx ? 'true' : 'false'); });
      if (push) { try { history.replaceState(null, '', '#' + sec.id); } catch (e) {} window.scrollTo({ top: 0 }); }
      var sel = btns[idx]; if (sel.scrollIntoView) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
    var h = location.hash.replace('#', '');
    show(cfg.sections.some(function (x) { return x.id === h; }) ? h : cfg.sections[0].id, false);
  };

  K.seg = function (host, options, current, onChange) {
    host.className = 'seg'; host.setAttribute('role', 'group');
    function draw() {
      host.innerHTML = options.map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === current) + '">' + K.esc(o[1]) + '</button>'; }).join('');
      host.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { current = b.dataset.v; draw(); onChange(current); }); });
    }
    draw();
  };

  /* окно со списком сделок: по клику на цифру */
  K.modal = function (title, sub, head, rows) {
    var m = document.createElement('div');
    m.style.cssText = 'position:fixed;inset:0;z-index:70;background:rgba(5,8,15,.6);display:grid;place-items:center;padding:14px';
    m.innerHTML = '<div role="dialog" aria-modal="true" style="background:var(--card);color:var(--text);border:1px solid var(--line);border-radius:14px;max-width:720px;width:100%;max-height:86vh;display:flex;flex-direction:column"><div style="padding:16px 18px;display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><h2 style="font-family:var(--fd);font-size:16px;color:var(--ink)">' + K.esc(title) + '</h2><p class="note" style="margin:2px 0 0">' + sub + '</p></div><button type="button" class="btn" id="mx">Закрыть</button></div><div class="scroll" style="overflow:auto;padding:0 18px 18px"><table><thead><tr>' + head.map(function (h) { return '<th>' + K.esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></div>';
    document.body.appendChild(m);
    function close() { m.remove(); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') close(); }
    m.querySelector('#mx').addEventListener('click', close);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    document.addEventListener('keydown', esc); m.querySelector('#mx').focus();
  };
  K.median = function (a) { var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
  K.avg = function (a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; };

  K.shell = function (o) {
    document.body.innerHTML = '<div class="shell"><aside class="side"><div class="brand"><i></i><span>' + K.esc(o.brand) + '<small>' + K.esc(o.sub) + '</small></span></div><nav class="menu" role="tablist" aria-label="Разделы"></nav><a class="back" href="' + (o.back || '../index.html#tumanov') + '">К портфолио</a></aside>' +
      '<main class="main"><div class="top"><div><h1 id="title"></h1><p class="sub" id="subtitle"></p></div><span class="badge-demo">Демо</span></div><div id="panel" class="panel"></div></main></div>';
  };
})();
