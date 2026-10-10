/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Sticker Peel — 揭角 = 沿折线把贴纸切两半：正面用 clip-path 去掉折起的那块，背面是同一张图的镜像（关于折线反射）再裁成同一块
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var PEEL = num('--peel'), LIFT = num('--lift'), SLAP = num('--slap');
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), lid = $('lid'), finger = $('finger'), fxl = $('fx');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rem = function () { return parseFloat(getComputedStyle(document.documentElement).fontSize); };
  // 贴纸页上的位置（rem）+ 角度；笔记本上的落点；演示时从哪个方向揭（度，指向贴纸内部）
  var SLOTS = [[3.6, 6.4, -6], [8.6, 6.6, 5], [3.7, 11.9, 4], [8.5, 11.8, -7]];
  var DROPS = [[17.2, 5.4, -14], [24.2, 5.2, 11], [18.6, 9.9, 7], [23.4, 9.8, -8]];
  var DIRS = [-135, -120, -140, -125], ORDER = [1, 0, 3, 2];
  var S = 0, list = [], tweens = [], z = 10, run = 0, demoOn = true, idleT = 0, fing = { x: 0, y: 0 };

  // —— 小型补间引擎：每个属性一条，后来的覆盖先来的 ——
  var E = {
    io: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    in: function (t) { return t * t * t; },
    spring: function (t) { var z = .38, w = 2 * Math.PI * 1.6, wd = w * Math.sqrt(1 - z * z); t *= 1.25; return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); }
  };
  function tween(o, to, dur, ease) {
    return new Promise(function (res) {
      Object.keys(to).forEach(function (k) { tweens = tweens.filter(function (w) { if (w.o === o && w.k === k) { w.res(); return false; } return true; }); });
      var keys = Object.keys(to), t0 = performance.now(), n = keys.length, done = 0;
      keys.forEach(function (k) { tweens.push({ o: o, k: k, a: o[k], b: to[k], t0: t0, d: dur, e: E[ease || 'io'], res: function () { if (++done === n) res(); } }); });
    });
  }
  function step(now) {
    tweens = tweens.filter(function (w) {
      var p = Math.min(1, (now - w.t0) / w.d); w.o[w.k] = w.a + (w.b - w.a) * w.e(p);
      if (p >= 1) { w.o[w.k] = w.b; w.res(); return false; } return true;
    });
  }
  var wait = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };

  // —— 揭角几何 ——
  function clip(poly, f, keepPos) { // 用半平面 f(p) ≥ 0（或 < 0）裁多边形（Sutherland–Hodgman 单边）
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a) * (keepPos ? 1 : -1), fb = f(b) * (keepPos ? 1 : -1);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) { var t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }
  var poly2css = function (p) { return p.length ? 'polygon(' + p.map(function (q) { return q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px'; }).join(',') + ')' : 'polygon(0 0)'; };
  function setDir(st, deg) { // u = 揭的方向（指向贴纸内部）；C = 贴纸外侧的起点；d0 = 折线刚碰到图形边缘时的距离
    var a = deg * Math.PI / 180, u = [Math.cos(a), Math.sin(a)], C = [S / 2 - u[0] * S * .75, S / 2 - u[1] * S * .75], best = 1e9, bp = null;
    st.pts.forEach(function (p) { var q = [p[0] * S / 100, p[1] * S / 100], v = (q[0] - C[0]) * u[0] + (q[1] - C[1]) * u[1] - 7 * S / 100; if (v < best) { best = v; bp = q; } });
    st.u = u; st.C = C; st.d0 = best; st.np = bp; st.d = best;
  }
  function peelTip(st) { // 最先被掀起的那个点，反射之后的位置（手指捏着的地方）
    var u = st.u, s = (st.np[0] - st.C[0]) * u[0] + (st.np[1] - st.C[1]) * u[1], m = 2 * (st.d - s);
    return toStage(st, st.np[0] + u[0] * m, st.np[1] + u[1] * m);
  }
  function toStage(st, lx, ly) { var a = st.r * Math.PI / 180, dx = (lx - S / 2) * st.k, dy = (ly - S / 2) * st.k; return { x: st.x + dx * Math.cos(a) - dy * Math.sin(a), y: st.y + dx * Math.sin(a) + dy * Math.cos(a) }; }

  function render(st) {
    st.el.style.transform = 'translate(' + (st.x - S / 2) + 'px,' + (st.y - S / 2) + 'px) rotate(' + st.r + 'deg) scale(' + st.k + ')';
    st.el.style.setProperty('--l', st.lift.toFixed(3));
    if (st.d > st.d0 + .3) {
      var u = st.u, C = st.C, d = st.d, f = function (p) { return (p[0] - C[0]) * u[0] + (p[1] - C[1]) * u[1] - d; };
      var box = [[-8, -8], [S + 8, -8], [S + 8, S + 8], [-8, S + 8]], P = C[0] * u[0] + C[1] * u[1] + d; // P = 折线上一点·u
      st.front.style.clipPath = poly2css(clip(box, f, true));
      st.back.style.clipPath = poly2css(clip(box, f, false));
      st.back.style.transform = 'matrix(' + [1 - 2 * u[0] * u[0], -2 * u[0] * u[1], -2 * u[0] * u[1], 1 - 2 * u[1] * u[1], 2 * P * u[0], 2 * P * u[1]].map(function (n) { return n.toFixed(4); }).join(',') + ')';
      st.back.style.display = '';
    } else if (st.back.style.display !== 'none') { st.front.style.clipPath = ''; st.back.style.display = 'none'; }
  }

  function build() {
    S = num('--size') * rem() || 4.6 * rem();
    var arts = $('art').content.querySelectorAll('svg'), R = rem();
    $('stickers').innerHTML = ''; $('slots').innerHTML = ''; list = [];
    [].forEach.call(arts, function (svg, i) {
      var sl = SLOTS[i], slot = document.createElement('div'); slot.className = 'slot';
      slot.appendChild(svg.cloneNode(true)); slot.style.transform = 'translate(' + (sl[0] * R - S / 2) + 'px,' + (sl[1] * R - S / 2) + 'px) rotate(' + sl[2] + 'deg)'; $('slots').appendChild(slot);
      var el = document.createElement('div'), front = svg.cloneNode(true), back = svg.cloneNode(true);
      el.className = 'stk'; front.classList.add('front'); back.classList.add('back'); back.style.display = 'none';
      el.appendChild(front); el.appendChild(back); $('stickers').appendChild(el);
      var path = front.querySelector('.cut path'), L = path.getTotalLength(), pts = [];
      for (var j = 0; j < 120; j++) { var p = path.getPointAtLength(L * j / 120); pts.push([p.x, p.y]); }
      var st = { i: i, el: el, front: front, back: back, pts: pts, x: sl[0] * R, y: sl[1] * R, r: sl[2], k: 1, lift: 0, state: 'sheet' };
      setDir(st, DIRS[i]); list.push(st); el.addEventListener('pointerdown', function (e) { grab(st, e); });
    });
  }
  function home(st) { var R = rem(), sl = SLOTS[st.i]; return { x: sl[0] * R, y: sl[1] * R, r: sl[2] }; }
  function lidHit(x, y) { var a = lid.getBoundingClientRect(), s = stage.getBoundingClientRect(), m = rem() * .6; x += s.left; y += s.top; return x > a.left + m && x < a.right - m && y > a.top + m && y < a.bottom - m; }

  // 贴上那一下：压扁 → 弹回；周围冒三道“啪”线；盖子被拍得轻轻一沉
  async function slap(st) {
    st.state = 'lid'; st.el.classList.remove('held'); st.el.style.zIndex = ++z;
    await tween(st, { k: SLAP, lift: 0 }, 90, 'in');
    tween(st, { k: 1 }, 520, 'spring');
    lid.animate([{ transform: 'none' }, { transform: 'translateY(.1rem)', offset: .3 }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
    var R = rem();
    [-60, -20, 20].map(function (a, i) { return a + st.r - 90 + (i - 1) * 10; }).forEach(function (deg, i) {
      var l = document.createElement('i'), a = deg * Math.PI / 180, r0 = S * .62;
      l.style.cssText = 'left:' + (st.x + Math.cos(a) * r0) + 'px;top:' + (st.y + Math.sin(a) * r0) + 'px';
      fxl.appendChild(l);
      l.animate([{ transform: 'rotate(' + (deg + 90) + 'deg) translateY(0) scaleY(.2)', opacity: 1 }, { transform: 'rotate(' + (deg + 90) + 'deg) translateY(-' + .7 * R + 'px) scaleY(1)', opacity: 1, offset: .5 }, { transform: 'rotate(' + (deg + 90) + 'deg) translateY(-' + 1.1 * R + 'px) scaleY(.1)', opacity: 0 }], { duration: 380, delay: i * 25, easing: 'ease-out' }).onfinish = function () { this.effect.target.remove(); };
    });
  }
  // 揭角 → 整张揭起
  async function peelOff(st, dur) {
    st.el.style.zIndex = ++z;
    await tween(st, { d: st.d0 + PEEL * S }, dur, 'io');
    st.state = 'held'; st.el.classList.add('held');
    tween(st, { d: st.d0 }, 170, 'out');
    tween(st, { k: LIFT }, 420, 'spring'); tween(st, { lift: 1 }, 220, 'out');
    await tween(st, { y: st.y - rem() * .4, r: st.r + (st.u[0] > 0 ? -6 : 6) }, 220, 'out');
  }

  // —— 自动演示 ——
  function fingerTo(p, d) { return tween(fing, { x: p.x, y: p.y }, d || 420, 'io'); }
  async function demo() {
    var id = run, R = rem();
    finger.classList.add('on');
    for (var n = 0; n < ORDER.length; n++) {
      var st = list[ORDER[n]];
      setDir(st, DIRS[st.i]);
      await fingerTo(peelTip(st), n ? 440 : 600); if (id !== run) return;
      finger.classList.add('down'); await wait(90, id);
      st.follow = 'tip'; await peelOff(st, 480); if (id !== run) return;
      st.follow = 'center';
      var D = DROPS[st.i];
      await tween(st, { x: D[0] * R, y: D[1] * R, r: D[2] }, 560, 'io'); if (id !== run) return;
      st.follow = null; slap(st); finger.classList.remove('down');
      await wait(200, id);
    }
    await fingerTo({ x: fing.x + R * 1.6, y: fing.y + R * 3 }, 420); if (id !== run) return;
    finger.classList.remove('on');
    await wait(1600, id);
    await restore(id); if (id !== run) return;
    await wait(700, id); demo();
  }
  // 复位：盖子上的贴纸“啵”地缩没，再从贴纸页上一张张弹出来
  async function restore(id) {
    list.forEach(function (st, i) { setTimeout(function () { if (id === run) tween(st, { k: 0 }, 260, 'in'); }, i * 70); });
    await wait(260 + 3 * 70 + 80, id);
    list.forEach(function (st, i) {
      var h = home(st); st.x = h.x; st.y = h.y; st.r = h.r - 25; st.state = 'sheet'; st.lift = 0; setDir(st, DIRS[st.i]); st.el.style.zIndex = 2;
      setTimeout(function () { if (id === run) tween(st, { k: 1, r: h.r }, 560, 'spring'); }, i * 90);
    });
    await wait(4 * 90 + 300, id);
  }

  // —— 用户拖拽 ——
  var drag = null;
  function grab(st, e) {
    if (reduce || drag) return; e.preventDefault();
    run++; demoOn = false; idleT = 0; finger.className = 'finger';
    var s = stage.getBoundingClientRect(), px = e.clientX - s.left, py = e.clientY - s.top;
    drag = { st: st, px: px, py: py, ox: px - st.x, oy: py - st.y, up: false, ready: false, vx: 0 };
    try { st.el.setPointerCapture(e.pointerId); } catch (_) {}
    tweens = tweens.filter(function (w) { if (w.o === st) { w.res(); return false; } return true; });
    if (st.state === 'sheet') {
      var a = -st.r * Math.PI / 180, dx = px - st.x, dy = py - st.y, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      setDir(st, Math.hypot(lx, ly) < S * .12 ? DIRS[st.i] : Math.atan2(-ly, -lx) * 180 / Math.PI);
      peelOff(st, 200).then(function () { if (drag && drag.st === st) { drag.ready = true; drag.ox = drag.px - st.x; drag.oy = drag.py - st.y; drag.r0 = st.r; if (drag.up) drop(); } });
    } else {
      st.state = 'held'; st.el.classList.add('held'); st.el.style.zIndex = ++z; drag.r0 = st.r;
      tween(st, { k: LIFT }, 380, 'spring'); tween(st, { lift: 1 }, 200, 'out').then(function () { if (drag && drag.st === st) { drag.ready = true; if (drag.up) drop(); } });
    }
  }
  addEventListener('pointermove', function (e) { if (!drag) return; var s = stage.getBoundingClientRect(); drag.px = e.clientX - s.left; drag.py = e.clientY - s.top; idleT = 0; });
  addEventListener('pointerup', function () { if (!drag) return; drag.up = true; if (drag.ready) drop(); });
  addEventListener('pointercancel', function () { if (drag) { drag.up = true; if (drag.ready) drop(); } });
  function drop() {
    var st = drag.st; drag = null;
    if (lidHit(st.x, st.y)) { slap(st); return; }
    var h = home(st); st.state = 'sheet'; st.el.classList.remove('held');
    tween(st, { x: h.x, y: h.y, r: h.r }, 460, 'io'); tween(st, { lift: 0 }, 460, 'io');
    tween(st, { k: 1 }, 640, 'spring').then(function () { st.el.style.zIndex = 2; });
  }

  // —— 主循环 ——
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now; step(now);
    if (drag && drag.ready) { // 跟手：位置做一点平滑，角度跟横向速度轻轻歪
      var st = drag.st, tx = drag.px - drag.ox, ty = drag.py - drag.oy, nx = st.x + (tx - st.x) * Math.min(1, dt * 22);
      drag.vx += ((nx - st.x) / Math.max(dt, .001) - drag.vx) * .2; st.x = nx; st.y += (ty - st.y) * Math.min(1, dt * 22);
      st.r += (drag.r0 + Math.max(-16, Math.min(16, drag.vx * .03)) - st.r) * Math.min(1, dt * 12);
    }
    list.forEach(function (st) {
      if (st.follow === 'tip') { var p = peelTip(st); fing.x = p.x; fing.y = p.y; }
      else if (st.follow === 'center') { fing.x = st.x + S * .18; fing.y = st.y + S * .22; }
      render(st);
    });
    var s = stage.getBoundingClientRect(); finger.style.translate = (s.left + fing.x) + 'px ' + (s.top + fing.y) + 'px';
    if (!demoOn && !drag) { idleT += dt; if (idleT > 7) { demoOn = true; reset(true); } }
    requestAnimationFrame(frame);
  }

  async function reset(soft) {
    var id = ++run; tweens.forEach(function (w) { w.res(); }); tweens = []; drag = null; demoOn = true; idleT = 0; finger.className = 'finger';
    fxl.innerHTML = '';
    if (soft) { await restore(id); if (id !== run) return; } else { build(); }
    if (reduce) { // 减少动态：直接摆成“已经贴了两张”的样子
      [0, 1].forEach(function (i) { var st = list[ORDER[i]], D = DROPS[st.i], R = rem(); st.x = D[0] * R; st.y = D[1] * R; st.r = D[2]; st.state = 'lid'; });
      list.forEach(render); return;
    }
    var s = stage.getBoundingClientRect(); fing.x = s.width * .62; fing.y = s.height * 1.05;
    await wait(500, id); demo();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') reset(false); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { reset(false); }, 200); });
  reset(false); if (!reduce) requestAnimationFrame(frame);
})();
