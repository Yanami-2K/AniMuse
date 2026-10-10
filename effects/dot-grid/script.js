// Spring Dot Grid — 每个点有原位、当前位置和速度；目标 = 原位 + 被指针推开的偏移，弹簧追过去
(function () {
  var css = getComputedStyle(document.documentElement);
  var v = function (n) { return css.getPropertyValue(n).trim(); };
  var GAP = +v('--gap'), R = +v('--radius'), PUSH = +v('--push'), K = +v('--stiffness'), D = +v('--damping');
  var DOT = v('--dot'), ACC = v('--accent');
  var c = document.getElementById('c'), ctx = c.getContext('2d');
  var dots = [], w, h, dpr, mx = -9999, my = -9999, active = false, t0 = performance.now(), raf;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mix(a, b, t) {   // 两个 #rrggbb 颜色插值
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = (pa >> 16) + ((pb >> 16) - (pa >> 16)) * t, g = (pa >> 8 & 255) + ((pb >> 8 & 255) - (pa >> 8 & 255)) * t, bl = (pa & 255) + ((pb & 255) - (pa & 255)) * t;
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (bl | 0) + ')';
  }
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    var ox = (w % GAP) / 2 + GAP / 2, oy = (h % GAP) / 2 + GAP / 2;
    for (var y = oy; y < h; y += GAP) for (var x = ox; x < w; x += GAP) dots.push({ ox: x, oy: y, x: x, y: y, vx: 0, vy: 0 });
    if (reduce) draw(0);
  }
  addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; active = true; });
  document.addEventListener('pointerleave', function () { active = false; t0 = performance.now(); });
  function draw(now) {
    if (!active && !reduce) {   // 没有指针时，一个看不见的“游标”自己慢慢逛
      var t = (now - t0) / 1000;
      mx = w * (.5 + Math.sin(t * .7) * .32); my = h * (.5 + Math.sin(t * 1.13 + 1) * .28);
    }
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i], dx = d.ox - mx, dy = d.oy - my, dist = Math.sqrt(dx * dx + dy * dy), f = 0, tx = d.ox, ty = d.oy;
      if (dist < R && !reduce) {
        f = 1 - dist / R; f = f * f * (3 - 2 * f);   // smoothstep，边缘柔和
        tx += dx / (dist || 1) * PUSH * f; ty += dy / (dist || 1) * PUSH * f;
      }
      d.vx = (d.vx + (tx - d.x) * K) * D; d.vy = (d.vy + (ty - d.y) * K) * D;
      d.x += d.vx; d.y += d.vy;
      ctx.fillStyle = f > 0.02 ? mix(DOT, ACC, Math.min(1, f * 1.4)) : DOT;
      ctx.beginPath(); ctx.arc(d.x, d.y, 1.4 + f * 2.2, 0, 6.2832); ctx.fill();
    }
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  function play() { cancelAnimationFrame(raf); resize(); if (!reduce) raf = requestAnimationFrame(draw); }
  addEventListener('resize', resize);
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
