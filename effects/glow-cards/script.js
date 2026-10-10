// Proximity Glow Cards — 原作：Jhey Tompkins https://codepen.io/jh3y/pen/QWYPaax （MIT，见 LICENSE）
// UPDATE() 与原作一致：算“卡片中心 → 指针”的角度写进 --start，离卡片 proximity 以内就把 --active 设成 1
(function () {
  var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
  if (LANG === 'en') { document.documentElement.lang = 'en'; document.querySelectorAll('[data-en]').forEach(function (el) { el.innerHTML = el.dataset.en; }); }
  var css = getComputedStyle(document.documentElement);
  var PROX = parseFloat(css.getPropertyValue('--proximity')) || 40, INACTIVE = .15;
  var CARDS = document.querySelectorAll('article'), cursor = document.getElementById('cursor');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function UPDATE(x, y) {
    CARDS.forEach(function (CARD) {
      var B = CARD.getBoundingClientRect();
      var near = x > B.left - PROX && x < B.right + PROX && y > B.top - PROX && y < B.bottom + PROX;
      CARD.style.setProperty('--active', near ? 1 : INACTIVE);
      var a = Math.atan2(y - (B.top + B.height / 2), x - (B.left + B.width / 2)) * 180 / Math.PI;
      CARD.style.setProperty('--start', (a < 0 ? a + 360 : a) + 90);
    });
  }
  var userAt = -1e9;
  document.body.addEventListener('pointermove', function (e) { if (!e.isTrusted) return; userAt = performance.now(); cursor.classList.remove('on'); UPDATE(e.clientX, e.clientY); });
  // 自动演示：假指针沿一条 ∞ 字形绕着两张卡走，经过时光弧跟着转
  var t0 = performance.now();
  function demo(now) {
    if (!reduce && now - userAt > 4000) {
      var t = (now - t0) / 1000 * .55, cx = innerWidth / 2, cy = innerHeight / 2;
      var x = cx + Math.sin(t) * innerWidth * .34, y = cy + Math.sin(t * 2) * innerHeight * .3;
      cursor.classList.add('on'); cursor.style.translate = x + 'px ' + y + 'px'; UPDATE(x, y);
    }
    requestAnimationFrame(demo);
  }
  if (reduce) { CARDS.forEach(function (c, i) { c.style.setProperty('--active', 1); c.style.setProperty('--start', i ? 210 : 150); }); }
  else requestAnimationFrame(demo);
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { userAt = -1e9; t0 = performance.now(); } });
})();
