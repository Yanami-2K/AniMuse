/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Liquid Magnetic Button — 四个弹簧体（本体 / 伸出的液体 / 更远的一滴 / 文字）+ SVG goo 滤镜
(function () {
  var root = document.documentElement, css = getComputedStyle(root);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var rem = function () { return parseFloat(getComputedStyle(root).fontSize); };
  var PULL = num('--pull'), GOO = num('--goo');
  var field = document.getElementById('field'), btn = document.getElementById('btn'), txt = document.getElementById('txt');
  var arrow = document.getElementById('arrow'), glow = document.getElementById('glow'), cursor = document.getElementById('cursor');
  var blur = document.getElementById('blur');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function body(el, k, c) { return { el: el, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, s: 1, vs: 0, ts: 1, k: k, c: c }; }
  var pill = body(document.getElementById('pill'), 170, 13);
  var tip = body(document.getElementById('tip'), 120, 9);
  var tip2 = body(document.getElementById('tip2'), 60, 6.5);
  var label = body(btn, 200, 16);
  var drops = Array.prototype.map.call(document.querySelectorAll('.drop'), function (el) { var d = body(el, 0, 0); d.s = d.ts = 0; return d; });
  var ptr = null, real = false, lastReal = -1e9, rot = 0;

  function step(b, dt) {
    b.vx += (b.k * (b.tx - b.x) - b.c * b.vx) * dt; b.vy += (b.k * (b.ty - b.y) - b.c * b.vy) * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.vs += (200 * (b.ts - b.s) - 14 * b.vs) * dt; b.s += b.vs * dt;
  }
  function edge(dx, dy) { // 胶囊形近似成椭圆，求某个方向上中心到边缘的距离
    var R = rem(), a = 7 * R, b = 2.4 * R, t = Math.atan2(dy, dx);
    return a * b / Math.sqrt(Math.pow(b * Math.cos(t), 2) + Math.pow(a * Math.sin(t), 2));
  }

  function targets() {
    var R = rem(), F = num('--field') * R, REACH = num('--reach') * R;
    var r = field.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (!ptr) { pill.tx = pill.ty = tip.tx = tip.ty = tip2.tx = tip2.ty = label.tx = label.ty = 0; tip.ts = tip2.ts = .3; return 0; }
    var dx = ptr.x - cx, dy = ptr.y - cy, d = Math.hypot(dx, dy);
    if (d > F) { pill.tx = pill.ty = tip.tx = tip.ty = tip2.tx = tip2.ty = label.tx = label.ty = 0; tip.ts = tip2.ts = .3; return 0; }
    var near = 1 - d / F;                                  // 0 = 磁场边缘，1 = 正中间
    pill.tx = dx * PULL * (.4 + near * .6); pill.ty = dy * PULL * (.4 + near * .6);
    label.tx = pill.tx * 1.25; label.ty = pill.ty * 1.25;  // 文字比本体多走一点，像浮在液体上
    var px = dx - pill.x, py = dy - pill.y, pd = Math.hypot(px, py) || 1, e = edge(px, py);
    var ux = px / pd, uy = py / pd;
    var r1 = Math.min(pd * .85, e + REACH * Math.min(1, near * 2.2)), r2 = Math.min(pd * .95, e + REACH * 1.9 * Math.min(1, near * 2.2));
    tip.tx = pill.x + ux * r1; tip.ty = pill.y + uy * r1; tip2.tx = pill.x + ux * r2; tip2.ty = pill.y + uy * r2;
    tip.ts = .7 + near * .5; tip2.ts = .5 + near * .6;
    return Math.atan2(dy, dx);
  }

  function burst() {
    var R = rem();
    pill.vs = -5; pill.s = .9;
    drops.forEach(function (d, i) {
      var a = (i / drops.length) * Math.PI * 2 + Math.random() * .5, sp = (16 + Math.random() * 14) * R;
      d.x = pill.x + Math.cos(a) * 4 * R; d.y = pill.y + Math.sin(a) * 1.2 * R; d.vx = Math.cos(a) * sp; d.vy = Math.sin(a) * sp * .8;
      d.s = .8 + Math.random() * 1.1; d.ts = d.s; d.vs = 0; d.k = 0; d.c = 3.2;
      setTimeout(function () { d.k = 34 + Math.random() * 20; d.c = 7; d.tx = 0; d.ty = 0; d.ts = .2; }, 420 + Math.random() * 260);
      setTimeout(function () { d.ts = 0; }, 1500);
    });
    txt.textContent = LANG === 'en' ? 'Got it!' : '收到！'; arrow.style.opacity = 0;
    clearTimeout(burst.t); burst.t = setTimeout(function () { txt.textContent = LANG === 'en' ? 'Come closer' : '靠近一点'; arrow.style.opacity = 1; }, 1500);
  }

  function render() {
    [pill, tip, tip2].concat(drops).forEach(function (b) {
      var sp = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), st = Math.min(sp / rem() * .006, .3);
      b.el.style.transform = 'translate3d(' + b.x.toFixed(1) + 'px,' + b.y.toFixed(1) + 'px,0) rotate(' + a + 'rad) scale(' + ((1 + st) * b.s).toFixed(3) + ',' + ((1 - st * .6) * b.s).toFixed(3) + ') rotate(' + (-a) + 'rad)';
    });
    btn.style.transform = 'translate3d(' + label.x.toFixed(1) + 'px,' + label.y.toFixed(1) + 'px,0) scale(' + (.85 + pill.s * .15).toFixed(3) + ')';
    arrow.style.transform = 'rotate(' + rot.toFixed(1) + 'deg)';
    glow.style.transform = 'translate3d(' + (pill.x * 1.6).toFixed(1) + 'px,' + (pill.y * 1.6).toFixed(1) + 'px,0)';
  }

  // ---- 真实指针 ----
  addEventListener('pointermove', function (e) { if (!e.isTrusted || (!e.movementX && !e.movementY)) return; real = true; lastReal = performance.now(); ptr = { x: e.clientX, y: e.clientY }; cursor.classList.remove('on'); });
  document.addEventListener('pointerleave', function () { if (real) ptr = null; });
  btn.addEventListener('click', function () { burst(); });

  // ---- 自动演示：光标从右下飘进来，绕着按钮逛一圈，点一下，再拖着液体离开 ----
  var demoT0 = null;
  function demo(t) {
    var R = rem(), r = field.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (demoT0 === null) demoT0 = t;
    var e = (t - demoT0) / 1000, x, y;
    var ease = function (k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
    if (e < 1.1) { var k = ease(e / 1.1); x = cx + (13 - 5 * k) * R * (1 - k) + 4.5 * R * k; y = cy + 9 * R * (1 - k) + 3.6 * R * k; }
    else if (e < 3.3) { var a = (e - 1.1) / 2.2 * Math.PI * 2; x = cx + Math.cos(a * .9 + .68) * 5.8 * R; y = cy + Math.sin(a * .9 + .68) * 4.4 * R; }
    else if (e < 3.9) { var k2 = ease((e - 3.3) / .6), sx = cx + Math.cos(Math.PI * 1.8 + .68) * 5.8 * R, sy = cy + Math.sin(Math.PI * 1.8 + .68) * 4.4 * R; x = sx + (cx + 1.5 * R - sx) * k2; y = sy + (cy + .3 * R - sy) * k2; }
    else if (e < 4.6) { x = cx + 1.5 * R; y = cy + .3 * R; if (!demo.clicked && e > 4.05) { demo.clicked = true; burst(); cursor.style.scale = '.8'; setTimeout(function () { cursor.style.scale = ''; }, 140); } }
    else if (e < 6.4) { var k3 = ease((e - 4.6) / 1.8); x = cx + 1.5 * R + (-12 * R) * k3; y = cy + .3 * R + 7.5 * R * k3 * k3; }
    else { x = cx - 14 * R; y = cy + 9 * R; }
    ptr = { x: x, y: y }; cursor.classList.toggle('on', e < 6.2);
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (e > 7.4) { demoT0 = null; demo.clicked = false; }
  }

  var last = performance.now(), acc = 0;
  function frame(t) {
    var dt = Math.min(.05, (t - last) / 1000); last = t;
    if (!real || t - lastReal > 5000) { if (real && t - lastReal > 5000) { real = false; demoT0 = null; } demo(t); }
    var ang = targets();
    if (ptr) { var want = ang * 180 / Math.PI; var dlt = ((want - rot + 540) % 360) - 180; rot += dlt * Math.min(1, dt * 10); }
    acc += dt;
    while (acc > 1 / 240) { [pill, tip, tip2, label].concat(drops).forEach(function (b) { step(b, 1 / 240); }); acc -= 1 / 240; }
    render(); requestAnimationFrame(frame);
  }
  function setBlur() { blur.setAttribute('stdDeviation', (GOO * rem()).toFixed(2)); }
  addEventListener('resize', setBlur); setBlur();
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { real = false; demoT0 = null; demo.clicked = false; } });
  if (reduce) { tip.s = tip2.s = .3; render(); btn.addEventListener('click', function () { txt.textContent = LANG === 'en' ? 'Got it!' : '收到！'; }); return; }
  requestAnimationFrame(frame);
})();
