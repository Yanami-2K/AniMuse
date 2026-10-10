// Parallax Tilt Card — 指针位置 → 目标角度，弹簧积分让它有惯性；没有指针时自己慢慢画 8 字
(function () {
  var css = getComputedStyle(document.documentElement);
  var MAX = parseFloat(css.getPropertyValue('--max-tilt')), K = parseFloat(css.getPropertyValue('--stiffness')), D = parseFloat(css.getPropertyValue('--damping'));
  var card = document.getElementById('card');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, hover = false, t0 = performance.now(), raf;
  addEventListener('pointermove', function (e) {
    var r = card.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width / 2)));
    ty = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / (r.height / 2)));
    hover = true;
  });
  document.addEventListener('pointerleave', function () { hover = false; tx = ty = 0; t0 = performance.now(); });
  function tick(now) {
    if (!hover) {                 // 空闲：李萨如曲线，慢速画 8 字
      var t = (now - t0) / 1000;
      tx = Math.sin(t * 1.1) * .7; ty = Math.sin(t * 2.2) * .4;
    }
    vx = (vx + (tx - x) * K) * D; vy = (vy + (ty - y) * K) * D;
    x += vx; y += vy;
    card.style.setProperty('--px', x.toFixed(4)); card.style.setProperty('--py', y.toFixed(4));
    card.style.setProperty('--ry', (x * MAX).toFixed(3) + 'deg'); card.style.setProperty('--rx', (-y * MAX).toFixed(3) + 'deg');
    raf = requestAnimationFrame(tick);
  }
  function play() { cancelAnimationFrame(raf); t0 = performance.now(); if (!reduce) raf = requestAnimationFrame(tick); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
