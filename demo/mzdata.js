/* Выдуманные данные демо Морозилки */
(function () {
  var R = K.rng(777), M = window.MZ = {};
  M.subjects = ['Математика', 'Русский язык', 'Физика', 'Информатика'];
  M.curators = ['Анастасия Р.', 'Дмитрий К.', 'Мария Л.', 'Егор С.', 'Полина В.', 'Артём Н.', 'Софья Т.', 'Илья Б.'];
  M.managers = ['Ксения М.', 'Роман Д.', 'Алиса Ф.', 'Тимур Г.', 'Вера Ш.'];
  M.cats = ['Telegram горячий', 'Telegram тёплый', 'Сайт горячий', 'Сайт тёплый', 'ВК', 'Доп. база'];
  M.stages = ['Новая заявка', 'Квалификация', 'Консультация', 'Выставлен счёт', 'Оплата'];
  M.reasons = ['Дорого', 'Подумают', 'Выбрали другую школу', 'Не целевой', 'Нет связи', 'Другой предмет'];
  M.deals = [];
  for (var i = 0; i < 520; i++) {
    var days = Math.floor(R() * 90), st = Math.min(4, Math.floor(Math.pow(R(), .9) * 5.1)), won = st === 4;
    M.deals.push({ id: 52000 + i * 2 + Math.floor(R() * 2), days: days, mgr: Math.floor(R() * 5), cat: Math.floor(Math.pow(R(), 1.3) * 6), stage: st, won: won, lost: !won && R() < .5, reason: Math.floor(R() * 6), reply: Math.max(1, Math.round(-Math.log(1 - R()) * 14)), cycle: Math.round(1 + R() * 20), sum: won ? Math.round((24 + R() * 40)) * 1000 : 0, subj: Math.floor(R() * 4) });
  }
  M.within = function (n) { return M.deals.filter(function (d) { return d.days < n; }); };
  M.link = function (d) { return '<a href="#" onclick="return false" style="color:var(--accent)">№' + d.id + '</a>'; };
  M.rub = function (v) { return K.fmt(v) + ' ₽'; };
  M.min = function (m) { return m < 60 ? Math.round(m) + ' мин' : K.fmt(m / 60, 1) + ' ч'; };
  M.students = [];
  for (var j = 0; j < 80; j++) M.students.push({ id: 9100 + j * 3, subj: Math.floor(R() * 4), cur: Math.floor(R() * 8), score: Math.round(38 + R() * 58), hw: Math.round(R() * 100), plan: R() < .72 ? 'есть' : 'нет', paid: R() < .8, act: Math.floor(R() * 14) });
})();
