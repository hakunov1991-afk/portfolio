/* Выдуманные данные для демо-дашбордов Плэйскул */
(function () {
  var R = K.rng(2026), D = window.RD = {};
  D.campuses = ['Кампус Север', 'Кампус Юг', 'Кампус Восток', 'Кампус Запад'];
  D.funnels = ['Новый набор', 'Лист ожидания', 'Резерв', 'Средняя школа', 'Лагерь', 'Вебинар'];
  D.sources = ['Поиск', 'Соцсети', 'Рекомендации', 'Карты', 'Сайт', 'Мероприятия', 'Партнёры'];
  D.managers = ['Анна К.', 'Мария П.', 'Ирина С.', 'Оксана В.', 'Елена Т.', 'Наталья Б.'];
  D.reasons = ['Выбрали другую школу', 'Далеко ехать', 'Дорого', 'Передумали', 'Нет мест в нужном классе', 'Не дозвонились', 'Не целевой запрос'];
  D.stages = ['Новая заявка', 'Первичный контакт', 'Экскурсия назначена', 'Экскурсия прошла', 'Договор', 'Оплата'];
  D.today = new Date(2026, 9, 15);
  D.deals = [];
  for (var i = 0; i < 640; i++) {
    var days = Math.floor(R() * 90), created = new Date(D.today.getTime() - days * 864e5), camp = Math.floor(R() * 4), src = Math.floor(Math.pow(R(), 1.4) * 7);
    var stageIdx = Math.min(5, Math.floor(Math.pow(R(), .8) * 6.2)), status = stageIdx === 5 ? 'won' : (R() < .46 ? 'lost' : 'open');
    if (days < 6 && status === 'lost') status = 'open';
    D.deals.push({
      id: 31000 + i * 3 + Math.floor(R() * 3), created: created, days: days, campus: camp, src: src, mgr: Math.floor(R() * 6),
      funnel: Math.floor(Math.pow(R(), 1.6) * 6), level: R() < .62 ? 'Сад' : 'Школа', stage: stageIdx, status: status,
      reason: Math.floor(R() * 7), reply: Math.max(1, Math.round(-Math.log(1 - R()) * 22 * (1 + camp * .12))), cycle: Math.round(3 + R() * 30)
    });
  }
  D.wonDeals = D.deals.filter(function (d) { return d.status === 'won'; });
  D.link = function (d) { return '<a href="#" onclick="return false" style="color:var(--accent)">№' + d.id + '</a>'; };
  D.min = function (m) { return m < 60 ? Math.round(m) + ' мин' : m < 1440 ? K.fmt(m / 60, 1) + ' ч' : K.fmt(m / 1440, 1) + ' дн'; };
  D.within = function (n) { return D.deals.filter(function (d) { return d.days < n; }); };
})();
