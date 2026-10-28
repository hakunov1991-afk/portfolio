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
    return '<span class="delta ' + cls + (cls === 'flat' ? '' : (up ? ' d-up' : ' d-dn')) + '">' + (up ? '+' : '') + K.fmt(p, 1) + '% к прошлому периоду</span>';
  };
  K.kpis = function (items) {
    return '<dl class="kpis n' + items.length + '">' + items.map(function (i, k) {
      return '<div class="kpi' + (k === 0 ? ' lead' : '') + '"><dt>' + K.esc(i.l) + '</dt><dd>' + i.v + '</dd>' + (i.d || '') + '</div>';
    }).join('') + '</dl>';
  };

  /* подсказка при наведении */
  var tt;
  function ttEl() { if (!tt) { tt = document.createElement('div'); tt.className = 'tt'; tt.setAttribute('role', 'tooltip'); document.body.appendChild(tt); } return tt; }
  K.tipShow = function (e, html) { var t = ttEl(), pt = e.touches ? e.touches[0] : e; t.innerHTML = html; t.style.opacity = 1; t.style.left = Math.max(8, Math.min(pt.clientX + 14, innerWidth - 250)) + 'px'; t.style.top = (pt.clientY + 14) + 'px'; };
  K.tipHide = function () { if (tt) tt.style.opacity = 0; };
  K.tip = function (el, html) {
    el.addEventListener('mouseenter', function (e) { K.tipShow(e, html); });
    el.addEventListener('mousemove', function (e) { K.tipShow(e, html); });
    el.addEventListener('mouseleave', K.tipHide);
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

  var uid = 0;
  function curve(pts) {
    if (pts.length < 3) return pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('');
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = .17;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) * t).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) * t).toFixed(1) + ',' + (p2[0] - (p3[0] - p1[0]) * t).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) * t).toFixed(1) + ',' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function grid(svg, W, H, L, R, T, B, max, o) {
    for (var g = 0; g <= 4; g++) {
      var v = max * g / 4, y = T + (H - T - B) * (1 - v / max);
      s('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: 'var(--line)', 'stroke-dasharray': g ? '2 5' : '0' }, svg);
      s('text', { x: L - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--muted)' }, svg).textContent = o.axis ? o.axis(v) : K.fmt(v);
    }
  }

  /* линия или несколько линий; dashFrom: с какой точки линия пунктирная (прогноз) */
  K.line = function (host, labels, series, o) {
    o = o || {};
    var W = 640, H = o.h || 240, L = 54, R = 16, T = 16, B = 30, id = 'g' + (++uid);
    var svg = frame(host, W, H), max = 0, n = labels.length;
    series.forEach(function (x) { x.data.forEach(function (v) { if (v > max) max = v; }); });
    max = nice(max * 1.05);
    var X = function (i) { return L + (W - L - R) * i / Math.max(1, n - 1); };
    var Y = function (v) { return T + (H - T - B) * (1 - v / max); };
    var defs = s('defs', {}, svg);
    series.forEach(function (x, k) {
      var g = s('linearGradient', { id: id + k, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      s('stop', { offset: '0%', 'stop-color': x.color, 'stop-opacity': .3 }, g);
      s('stop', { offset: '100%', 'stop-color': x.color, 'stop-opacity': 0 }, g);
    });
    grid(svg, W, H, L, R, T, B, max, o);
    var step = Math.ceil(n / 8);
    labels.forEach(function (lb, i) { if (i % step === 0) s('text', { x: X(i), y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, svg).textContent = lb; });
    series.forEach(function (x, k) {
      var cut = x.dashFrom == null ? x.data.length : x.dashFrom;
      var solid = x.data.slice(0, cut).map(function (v, i) { return [X(i), Y(v)]; });
      var dash = x.data.slice(Math.max(0, cut - 1)).map(function (v, i) { return [X(i + Math.max(0, cut - 1)), Y(v)]; });
      if (o.area || series.length === 1) s('path', { d: curve(solid) + 'L' + solid[solid.length - 1][0].toFixed(1) + ' ' + Y(0) + 'L' + solid[0][0].toFixed(1) + ' ' + Y(0) + 'Z', fill: 'url(#' + id + k + ')', class: 'ar' }, svg);
      s('path', { d: curve(solid), fill: 'none', stroke: x.color, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, class: 'ln' }, svg);
      if (cut < x.data.length) s('path', { d: curve(dash), fill: 'none', stroke: x.color, 'stroke-width': 2.6, 'stroke-dasharray': '6 6', opacity: .65 }, svg);
      var last = solid[solid.length - 1];
      s('circle', { cx: last[0], cy: last[1], r: 4.5, fill: 'var(--card)', stroke: x.color, 'stroke-width': 2.5, class: 'ar' }, svg);
    });
    var vl = s('line', { y1: T, y2: H - B, stroke: 'var(--muted)', 'stroke-dasharray': '3 4', class: 'vl' }, svg);
    var dots = series.map(function (x) { return s('circle', { r: 5, fill: 'var(--card)', stroke: x.color, 'stroke-width': 2.5, class: 'dot' }, svg); });
    var ov = s('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent' }, svg);
    function at(e) {
      var rc = svg.getBoundingClientRect(), pt = e.touches ? e.touches[0] : e, vx = (pt.clientX - rc.left) * W / rc.width;
      var i = Math.max(0, Math.min(n - 1, Math.round((vx - L) / (W - L - R) * (n - 1))));
      vl.setAttribute('x1', X(i)); vl.setAttribute('x2', X(i)); vl.style.opacity = 1;
      dots.forEach(function (d, k) { d.setAttribute('cx', X(i)); d.setAttribute('cy', Y(series[k].data[i])); d.style.opacity = 1; });
      K.tipShow(e, '<b>' + K.esc(labels[i]) + '</b><br>' + series.map(function (x) { return '<span style="color:' + x.color + '">&#9679;</span> ' + K.esc(x.name) + ': ' + (o.axis ? o.axis(x.data[i]) : K.fmt(x.data[i], o.d || 0)); }).join('<br>'));
    }
    function off() { vl.style.opacity = 0; dots.forEach(function (d) { d.style.opacity = 0; }); K.tipHide(); }
    ov.addEventListener('pointermove', at); ov.addEventListener('pointerleave', off);
    svg.setAttribute('aria-label', (o.label || 'График') + ': ' + series.map(function (x) { return x.name + ' от ' + K.fmt(Math.min.apply(null, x.data), o.d || 0) + ' до ' + K.fmt(Math.max.apply(null, x.data), o.d || 0); }).join('; '));
    if (series.length > 1 || o.legend) legend(host, series);
  };

  function rbar(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    if (r <= 0.5) return 'M' + x + ' ' + (y + h) + 'V' + y + 'H' + (x + w) + 'V' + (y + h) + 'Z';
    return 'M' + x + ' ' + (y + h) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + h) + 'Z';
  }

  /* столбики, можно стопкой */
  K.bars = function (host, labels, series, o) {
    o = o || {};
    var W = 640, H = o.h || 240, L = 54, R = 16, T = 22, B = 30, id = 'b' + (++uid);
    var svg = frame(host, W, H), max = 0, n = labels.length;
    labels.forEach(function (_, i) {
      var tot = o.stack ? series.reduce(function (a, x) { return a + x.data[i]; }, 0) : Math.max.apply(null, series.map(function (x) { return x.data[i]; }));
      if (tot > max) max = tot;
    });
    max = nice(max * 1.08);
    var Y = function (v) { return T + (H - T - B) * (1 - v / max); };
    var defs = s('defs', {}, svg), gid = {}, gk = 0;
    function grad(col) { if (gid[col]) return gid[col]; var name = id + (gk++), g = s('linearGradient', { id: name, x1: 0, y1: 0, x2: 0, y2: 1 }, defs); s('stop', { offset: '0%', 'stop-color': col, 'stop-opacity': 1 }, g); s('stop', { offset: '100%', 'stop-color': col, 'stop-opacity': .72 }, g); return gid[col] = 'url(#' + name + ')'; }
    grid(svg, W, H, L, R, T, B, max, o);
    var slot = (W - L - R) / n, bw = Math.min(46, slot * .7 / (o.stack ? 1 : series.length)), step = Math.ceil(n / 10), bars = [];
    var showVal = !o.stack && series.length === 1 && n <= 14;
    labels.forEach(function (lb, i) {
      var cx = L + slot * (i + .5), acc = 0, topK = -1;
      if (i % step === 0) s('text', { x: cx, y: H - 8, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, svg).textContent = lb;
      if (o.stack) series.forEach(function (x, k) { if (x.data[i] > 0) topK = k; });
      series.forEach(function (x, k) {
        var v = x.data[i], gap = o.stack ? 0 : 2, x0 = o.stack ? cx - bw / 2 : cx - bw * series.length / 2 + bw * k;
        var y0 = o.stack ? Y(acc + v) : Y(v), hgt = o.stack ? Y(acc) - Y(acc + v) : Y(0) - Y(v);
        var col = x.colors ? x.colors[i] : x.color;
        if (hgt > 0) {
          var b = s('path', { d: rbar(x0, y0, bw - gap, hgt, o.stack ? (k === topK ? 6 : 0) : 7), fill: grad(col), class: 'bar' }, svg);
          b.dataset.i = i; b.style.animationDelay = (i * 25) + 'ms'; bars.push(b);
        }
        if (showVal) s('text', { x: x0 + (bw - gap) / 2, y: y0 - 6, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: 'var(--ink)' }, svg).textContent = o.axis ? o.axis(v) : K.fmt(v, o.d || 0);
        acc += v;
      });
      var hit = s('rect', { x: cx - slot / 2, y: T, width: slot, height: H - T - B, fill: 'transparent' }, svg);
      hit.addEventListener('pointermove', function (e) {
        bars.forEach(function (b) { b.style.opacity = +b.dataset.i === i ? 1 : .4; });
        K.tipShow(e, '<b>' + K.esc(lb) + '</b><br>' + series.map(function (x) { return '<span style="color:' + (x.colors ? x.colors[i] : x.color) + '">&#9679;</span> ' + K.esc(x.name) + ': ' + (o.axis ? o.axis(x.data[i]) : K.fmt(x.data[i], o.d || 0)); }).join('<br>'));
      });
      hit.addEventListener('pointerleave', function () { bars.forEach(function (b) { b.style.opacity = 1; }); K.tipHide(); });
    });
    svg.setAttribute('aria-label', (o.label || 'Столбчатая диаграмма') + ': ' + labels.map(function (lb, i) { return lb + ' ' + series.map(function (x) { return K.fmt(x.data[i], o.d || 0); }).join(' / '); }).join(', '));
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
      var w = Math.max(7, st.v / top * 100), conv = i ? ' <span style="color:var(--muted);font-weight:400">' + K.fmt(st.v / stages[i - 1].v * 100, 1) + '% от предыдущего</span>' : '';
      var col = st.c || 'var(--accent)';
      return '<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;margin-bottom:6px"><span>' + K.esc(st.n) + (conv ? '<br>' + conv : '') + '</span><b style="font-family:var(--fd);font-size:16px;color:var(--ink);font-variant-numeric:tabular-nums">' + K.fmt(st.v) + '</b></div>' +
        '<div style="background:var(--track);border-radius:9px;height:20px;overflow:hidden"><div class="fill" style="width:' + w + '%;height:100%;border-radius:9px;background:linear-gradient(90deg,color-mix(in srgb,' + col + ' 72%,transparent),' + col + ');transform-origin:left;animation:growx .8s var(--ease) ' + (i * .07) + 's both"></div></div></div>';
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
  var ICONS = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.3.1 4 1.5 4.5 4.5"/>',
    gauge: '<path d="M12 14l3.5-3.5"/><path d="M4 18a9 9 0 1 1 16 0"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2A2.5 2.5 0 0 1 9.5 15M12 6v1.5M12 16.5V18"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5"/>'
  };
  function iconFor(sec, i) {
    var id = sec.id + ' ' + (sec.t || ''), map = [[/call|звон/i, 'phone'], [/meet|conv|конвер|funnel|воронк/i, 'target'], [/quality|okk|чек|качест|svet/i, 'shield'], [/mgr|ops|cur|staff|oper|менедж|оператор|куратор|кадр|famil|сем/i, 'users'], [/speed|скорост|reply/i, 'gauge'], [/dyn|trend|week|динам|тренд|нед/i, 'trend'], [/pay|plan|fine|штраф|оплат|direct|план|money|promo|промо/i, 'money'], [/mail|рассыл|tg|телегр/i, 'mail'], [/hw|lesson|урок|домаш|mock|проб|iup|план/i, 'book'], [/load|queue|стакан|загруз|cohort|когорт/i, 'layers'], [/lost|reason|причин|отказ|list|log/i, 'list'], [/sales|rating|dash|over|home|главн|продаж|рейтинг|обзор|stat|итог/i, 'dash']];
    for (var k = 0; k < map.length; k++) if (map[k][0].test(id)) return ICONS[map[k][1]];
    return ICONS[['dash', 'trend', 'layers', 'list', 'target', 'gauge'][i % 6]];
  }
  K.app = function (cfg) {
    var menu = document.querySelector('.menu'), panel = document.getElementById('panel');
    var btns = cfg.sections.map(function (sec, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + iconFor(sec, i) + '</svg><span>' + K.esc(sec.t) + '</span>';
      b.addEventListener('click', function () { show(sec.id, true); });
      menu.appendChild(b); return b;
    });
    function show(id, push) {
      var idx = 0; cfg.sections.forEach(function (x, i) { if (x.id === id) idx = i; });
      var sec = cfg.sections[idx];
      document.getElementById('title').textContent = sec.t;
      document.getElementById('subtitle').textContent = sec.s || '';
      document.title = sec.t + ' · ' + document.title.split(' · ').pop();
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
    document.body.innerHTML = '<div class="shell"><aside class="side"><div class="brand"><i></i><span>' + K.esc(o.brand) + '<small>' + K.esc(o.sub) + '</small></span></div><nav class="menu" role="tablist" aria-label="Разделы"></nav><a class="back" href="' + (o.back || '../index.html#tumanov') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>К портфолио</a></aside>' +
      '<main class="main"><div class="top"><div><h1 id="title"></h1><p class="sub" id="subtitle"></p></div><span class="badge-demo">Демо</span></div><div id="panel" class="panel"></div></main></div>';
  };
})();
