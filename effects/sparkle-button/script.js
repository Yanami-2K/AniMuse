// Sparkle Button — 原作：Jhey Tompkins https://codepen.io/jh3y/pen/LYJMPBL （MIT，见 LICENSE）
// 原作的 JS 只负责给每颗粒子随机位置 / 时长 / 公转圆心；这里另外加了中英文和自动演示（定时切 .is-active，等同于悬停）
(function () {
  var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
  if (LANG === 'en') { document.documentElement.lang = 'en'; document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = el.dataset.en; }); }
  var RANDOM = function (min, max) { return Math.floor(Math.random() * (max - min + 1) + min); };
  document.querySelectorAll('.particle').forEach(function (P) {
    P.setAttribute('style', '--x:' + RANDOM(20, 80) + ';--y:' + RANDOM(20, 80) + ';--duration:' + RANDOM(6, 20) + ';--delay:' + RANDOM(1, 10) + ';--alpha:' + RANDOM(40, 90) / 100 +
      ';--origin-x:' + (Math.random() > .5 ? RANDOM(300, 800) * -1 : RANDOM(300, 800)) + '%;--origin-y:' + (Math.random() > .5 ? RANDOM(300, 800) * -1 : RANDOM(300, 800)) + '%;--size:' + RANDOM(40, 90) / 100);
  });
  var btn = document.getElementById('btn'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, userAt = -1e9, on = false;
  btn.addEventListener('pointerenter', function (e) { if (e.isTrusted) { userAt = performance.now(); btn.classList.remove('is-active'); } });
  document.addEventListener('pointermove', function (e) { if (e.isTrusted) userAt = performance.now(); });
  function tick() { if (performance.now() - userAt < 5000) return; on = !on; btn.classList.toggle('is-active', on); }
  if (reduce) btn.classList.add('is-active'); else { setTimeout(tick, 500); setInterval(tick, 2600); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { userAt = -1e9; on = false; btn.classList.remove('is-active'); setTimeout(tick, 200); } });
})();
