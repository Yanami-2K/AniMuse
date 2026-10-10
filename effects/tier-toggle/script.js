// Dynamic Tier Toggle — 原作：Jhey Tompkins https://codepen.io/jh3y/pen/vEEZxOM （MIT，见 LICENSE）
// 切换本身是纯 CSS（:has + radio）；这里的 JS 只做三件事：中英文、下方价格文字、卡片预览的自动演示
(function () {
  var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
  var en = LANG === 'en';
  if (en) { document.documentElement.lang = 'en'; document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = el.dataset.en; }); var pm = document.querySelector('.premium'); pm.dataset.label = pm.dataset.labelEn; }
  var ids = ['free', 'solo', 'team'], radios = ids.map(function (i) { return document.getElementById(i); }), price = document.getElementById('price');
  var P = en ? { free: '<b>$0</b> forever', solo: '<b>$12</b> / month', team: '<b>$40</b> / month · 5 seats' } : { free: '<b>¥0</b> 永久免费', solo: '<b>¥68</b> / 月', team: '<b>¥258</b> / 月 · 5 人' };
  function sync() { var c = radios.filter(function (r) { return r.checked; })[0]; price.innerHTML = P[c.id]; }
  radios.forEach(function (r) { r.addEventListener('change', function (e) { sync(); }); });
  var userAt = -1e9, k = 0, seq = [1, 2, 1, 0];
  document.addEventListener('pointerdown', function (e) { if (e.isTrusted) userAt = performance.now(); });
  document.addEventListener('keydown', function () { userAt = performance.now(); });
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setInterval(function () { if (reduce || performance.now() - userAt < 6000) return; radios[seq[k++ % seq.length]].checked = true; sync(); }, 1300);
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { userAt = -1e9; k = 0; radios[0].checked = true; sync(); } });
  sync();
})();
