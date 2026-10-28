(function () {
  var D = window.DATA, M = D.me;
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var I = {
    ext: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    tg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.4 4.1 2.9 11.2c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.6.4.8.8.8.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.4-1.5ZM8.5 13.6l9.4-5.9c.4-.3.8-.1.5.2l-7.8 7-.3 3.2-1.8-4.5Z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'
  };
  var TG = 'https://t.me/alanhakunov';

  /* маленькая картинка-превью для карточки дашборда: рисуется по названию, всегда одна и та же */
  function thumb(key, i) {
    var h = 0; for (var k = 0; k < key.length; k++) h = (h * 31 + key.charCodeAt(k)) >>> 0;
    function r() { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; }
    var W = 240, H = 96, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">';
    var kind = i % 3, n = 14, pts = [];
    for (var j = 0; j < n; j++) pts.push(28 + r() * 44 + (kind === 1 ? j * 1.8 : 0));
    if (kind === 0) {
      var bw = W / n;
      pts.forEach(function (v, j) { var bh = v * .8; s += '<rect x="' + (j * bw + 4) + '" y="' + (H - bh) + '" width="' + (bw - 8) + '" height="' + bh + '" rx="4" fill="var(--accent)" opacity="' + (.2 + j / n * .55).toFixed(2) + '"/>'; });
    } else {
      var d = pts.map(function (v, j) { return (j ? 'L' : 'M') + (j * W / (n - 1)).toFixed(1) + ' ' + (H - v).toFixed(1); }).join('');
      s += '<path d="' + d + 'L' + W + ' ' + H + 'L0 ' + H + 'Z" fill="var(--accent)" opacity="' + (kind === 1 ? .18 : .1) + '"/>';
      s += '<path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
      if (kind === 2) pts.forEach(function (v, j) { if (j % 3 === 0) s += '<circle cx="' + (j * W / (n - 1)).toFixed(1) + '" cy="' + (H - v).toFixed(1) + '" r="3.2" fill="var(--bg)" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/>'; });
    }
    return s + '</svg>';
  }

  function stats(items, cls) { return items; }

  function aboutPanel() {
    var h = '<header class="hero">';
    h += '<p class="avail"><i></i>Открыт к проектам и вакансиям</p>';
    var parts = M.name.split(' ');
    h += '<h1 class="name">' + esc(parts[0]) + '<br><span>' + esc(parts.slice(1).join(' ')) + '</span></h1>';
    h += '<p class="role-line">' + esc(M.role) + '</p>';
    h += '<p class="summary">' + esc(M.summary) + '</p>';
    h += '<div class="cta"><a class="btn pri" href="' + TG + '" target="_blank" rel="noopener">' + I.tg + 'Написать в Telegram</a>' +
      '<a class="btn" href="tel:+79640392854">' + I.phone + '+7 964 039-28-54</a>' +
      '<a class="btn" href="mailto:hakunov1991@gmail.com">' + I.mail + 'Почта</a></div>';
    var s = M.stats;
    h += '<dl class="stats-band"><div class="lead-stat"><dd>' + esc(s[0].n) + '</dd><dt>' + esc(s[0].l) + '</dt></div>' +
      '<div class="stat-rows">' + s.slice(1).map(function (x) { return '<div class="stat-row"><dd>' + esc(x.n) + '</dd><dt>' + esc(x.l) + '</dt></div>'; }).join('') + '</div></dl>';
    h += '</header>';

    h += '<section class="block"><h2 class="h2">Чем я полезен работодателю</h2><div class="adv rows">' + M.adv.map(function (a, i) {
      return '<div class="row"><span class="row-n">' + ('0' + (i + 1)).slice(-2) + '</span><h3>' + esc(a.t) + '</h3><p>' + esc(a.p) + '</p></div>';
    }).join('') + '</div></section>';

    h += '<section class="block"><h2 class="h2">Как я работаю</h2><div class="steps">' + M.how.map(function (a) {
      return '<div class="step"><h3>' + esc(a.t) + '</h3><p>' + esc(a.p) + '</p></div>';
    }).join('') + '</div></section>';

    h += '<section class="block"><h2 class="h2">Чем работаю</h2><div class="skills-wrap">' + M.skills.map(function (g) {
      return '<div class="skillrow"><h3>' + esc(g.t) + '</h3><div class="tags">' + g.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div></div>';
    }).join('') + '</div></section>';

    h += '<section class="block"><h2 class="h2">Образование</h2><div class="duo"><div class="card edu-list">' + M.edu.map(function (e) {
      return '<div><span class="meta">' + e.y + '</span><h3>' + esc(e.t) + '</h3><p>' + esc(e.s) + '</p></div>';
    }).join('') + '</div><div class="card"><span class="meta">Сертификаты Битрикс24</span><ul class="certs">' + M.certs.map(function (c) {
      return '<li><a href="' + c.href + '" target="_blank" rel="noopener">' + esc(c.t) + I.ext + '</a></li>';
    }).join('') + '</ul></div></div></section>';

    h += '<section class="block"><h2 class="h2">Формат и условия</h2><div class="facts">' + M.about.map(function (a, i) {
      return '<div class="card fact' + (i === 1 ? ' lead' : '') + '"><h3>' + esc(a.t) + '</h3><p>' + esc(a.p) + '</p></div>';
    }).join('') + '</div></section>';
    h += footer();
    return h;
  }

  function footer() {
    return '<footer class="foot"><span class="name-sm">' + esc(M.name) + '</span><span>Открыт к новым проектам, 2026</span><a class="link" href="' + TG + '" target="_blank" rel="noopener"><span>Написать в Telegram</span>' + I.ext + '</a></footer>';
  }

  function placePanel(p) {
    var h = '<header class="phead"><p class="status' + (p.live ? ' live' : '') + '"><i></i>' + esc(p.status) + '</p>';
    h += '<h2 class="company">' + (p.companyHref ? '<a href="' + p.companyHref + '" target="_blank" rel="noopener">' + esc(p.company) + '</a>' : esc(p.company)) + '</h2>';
    h += '<p class="prole">' + esc(p.role) + '</p>';
    if (p.prev) h += '<p class="prev">' + esc(p.prev) + '</p>';
    h += '<p class="meta-line"><span>' + esc(p.period) + '</span><span>' + esc(p.where) + '</span></p>';
    if (p.intro) h += '<p class="intro">' + esc(p.intro) + '</p>';
    h += '</header>';
    if (p.headline && p.headline.length) {
      h += '<dl class="headline">' + p.headline.map(function (x) { return '<div class="hl"><dd>' + esc(x.n) + '</dd><dt>' + esc(x.l) + '</dt></div>'; }).join('') + '</dl>';
    }
    if (p.projects) {
      h += '<section class="block"><h2 class="h2">Проекты</h2><div class="projects">' + p.projects.map(function (x) {
        return '<article class="proj"><p class="pt">' + esc(x.t) + '</p><h3>' + esc(x.n) + '</h3><p class="pd">' + esc(x.d) + '</p>' +
          (x.href ? '<a class="link" href="' + x.href + '" target="_blank" rel="noopener"><span>' + esc(x.site || x.href) + '</span>' + I.ext + '</a>' : '') + '</article>';
      }).join('') + '</div></section>';
    }
    if (p.cases && p.cases.length) {
      h += '<section class="block"><h2 class="h2">Кейсы</h2><div class="cases">' + p.cases.map(function (c, i) {
        return '<article class="case' + (i === 0 ? ' feature' : '') + '"><div class="case-top"><p class="cn">' + c.num + ' · ' + esc(c.name) + '</p><p class="metric">' + esc(c.metric) + '</p></div>' +
          '<h3>' + esc(c.title) + '</h3><p class="cb">' + c.body + '</p>' +
          '<div class="tags">' + c.stack.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' +
          (c.link ? '<a class="link" href="' + c.link.href + '" target="_blank" rel="noopener"><span>' + esc(c.link.label) + '</span>' + I.ext + '</a>' : '') + '</article>';
      }).join('') + '</div></section>';
    }
    if (p.duties && p.duties.length) {
      h += '<section class="block"><h2 class="h2">Что делал</h2><ul class="list">' + p.duties.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></section>';
    }
    if (p.results && p.results.length) {
      h += '<section class="block"><h2 class="h2">' + esc(p.resultsLabel) + '</h2><ul class="list ok">' + p.results.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></section>';
    }
    if (p.links && p.links.length) {
      h += '<section class="block"><h2 class="h2">' + esc(p.linksTitle || 'Дашборды') + '</h2><div class="links">' + p.links.map(function (l, i) {
        return '<a class="lk" href="' + l.href + '" target="_blank" rel="noopener"><div class="thumb">' + thumb(l.href, i) + '</div><div class="txt"><span>' + esc(l.label) + '</span><b>' + esc(l.title) + '</b><span class="go" style="font-family:var(--f-body);letter-spacing:0;text-transform:none;font-size:13px">Открыть' + I.ext + '</span></div></a>';
      }).join('') + '</div></section>';
    }
    return h + footer();
  }

  var items = [{ id: 'about', tab: 'Обо мне', sub: 'Стек, условия', html: aboutPanel() }].concat(D.places.map(function (p) {
    return { id: p.id, tab: p.tab, sub: p.period.replace('по настоящее время', 'сейчас').replace('Декабрь 2025 — октябрь 2026', '12.2025 — 10.2026'), live: p.live, html: placePanel(p) };
  }));

  var tabsEl = document.querySelector('.tabs'), panel = document.getElementById('panel');
  var btns = items.map(function (it, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab'); b.dataset.id = it.id; b.id = 'tab-' + it.id;
    b.setAttribute('aria-controls', 'panel');
    b.innerHTML = '<span class="tx"><span>' + esc(it.tab) + '</span><small>' + esc(it.sub) + '</small></span>' + (it.live ? '<i class="dot" title="Работаю сейчас"></i>' : '');
    b.addEventListener('click', function () { show(it.id, true); });
    tabsEl.appendChild(b);
    return b;
  });

  function show(id, push) {
    var idx = 0; items.forEach(function (it, i) { if (it.id === id) idx = i; });
    var it = items[idx];
    panel.innerHTML = it.html;
    panel.setAttribute('aria-labelledby', 'tab-' + it.id);
    panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter');
    btns.forEach(function (b, i) { b.setAttribute('aria-selected', i === idx ? 'true' : 'false'); b.tabIndex = i === idx ? 0 : -1; });
    document.title = (idx ? it.tab + ' · ' : '') + 'Хакунов Алан, CRM, автоматизация, BI';
    var sel = btns[idx]; if (sel.scrollIntoView) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
    if (push) { try { history.replaceState(null, '', '#' + it.id); } catch (e) {} window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }
  tabsEl.addEventListener('keydown', function (e) {
    var cur = btns.indexOf(document.activeElement), n = btns.length, nx = -1;
    if (cur < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nx = (cur + 1) % n;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nx = (cur - 1 + n) % n;
    if (e.key === 'Home') nx = 0; if (e.key === 'End') nx = n - 1;
    if (nx >= 0) { e.preventDefault(); btns[nx].focus(); show(items[nx].id, true); }
  });
  var h = location.hash.replace('#', '');
  show(items.some(function (i) { return i.id === h; }) ? h : 'about', false);

  /* тема: светлая или тёмная, помнится в браузере */
  var root = document.documentElement;
  function setTheme(t) { root.setAttribute('data-theme', t); document.querySelectorAll('.theme').forEach(function (b) { b.setAttribute('aria-pressed', t === 'dark'); b.setAttribute('aria-label', t === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'); }); }
  var saved = null; try { saved = localStorage.getItem('theme'); } catch (e) {}
  setTheme(saved || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  document.querySelectorAll('.theme').forEach(function (b) {
    b.addEventListener('click', function () { var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; setTheme(t); try { localStorage.setItem('theme', t); } catch (e) {} });
  });
})();
