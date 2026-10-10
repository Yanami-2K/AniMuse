/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Jelly Card Stack — 一个 rAF 循环里做弹簧积分；果冻感 = 沿速度方向拉伸、垂直方向压扁
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var K = num('--stiffness'), C = num('--damping'), JELLY = num('--jelly'), THROW = num('--throw');
  var deck = document.getElementById('deck'), finger = document.getElementById('finger');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rem = function () { return parseFloat(getComputedStyle(document.documentElement).fontSize); };

  // order[0] 是最上面那张。每张卡一个弹簧体：位置 x/y、角度 r、缩放 s 都朝目标弹
  var cards = Array.prototype.map.call(deck.children, function (el) {
    return { el: el, x: 0, y: 0, r: 0, s: 1, vx: 0, vy: 0, vr: 0, vs: 0, tx: 0, ty: 0, tr: 0, ts: 1, free: false };
  });
  var order = cards.slice();
  var drag = null, lift = 0, demo = true, idleT = 0;

  function layout() {
    var g = num('--gap') * rem();
    order.forEach(function (c, i) {
      c.el.style.zIndex = 10 - i;
      if (c.free || c === (drag && drag.c)) return;
      var k = Math.max(0, i - lift);          // 拖动顶卡时，下面的卡按拖动距离往上“顶”一点
      c.tx = 0; c.ty = -k * g; c.tr = [0, -4, 3.5, -2][i] * Math.min(1, k + .001) || 0; c.ts = 1 - k * .055;
    });
  }

  function spring(c, dt) {
    if (c === (drag && drag.c)) return;
    var ax = K * (c.tx - c.x) - C * c.vx, ay = K * (c.ty - c.y) - C * c.vy;
    if (c.free) { ax = -1.2 * c.vx; ay = -1.2 * c.vy + 900; } // 甩飞：只有空气阻力 + 一点重力
    c.vx += ax * dt; c.vy += ay * dt; c.x += c.vx * dt; c.y += c.vy * dt;
    c.vr += (K * (c.tr - c.r) - C * c.vr) * dt; c.r += c.vr * dt;
    c.vs += (K * 1.4 * (c.ts - c.s) - C * 1.1 * c.vs) * dt; c.s += c.vs * dt;
  }

  function render(c) {
    var sp = Math.hypot(c.vx, c.vy), a = Math.atan2(c.vy, c.vx) * 180 / Math.PI;
    var st = Math.min(sp * JELLY, .28);                      // 拉伸量封顶，太快也不至于变面条
    c.el.style.transform = 'translate3d(' + c.x.toFixed(2) + 'px,' + c.y.toFixed(2) + 'px,0) rotate(' + a.toFixed(2) + 'deg) scale(' + (1 + st).toFixed(4) + ',' + (1 - st * .7).toFixed(4) + ') rotate(' + (-a).toFixed(2) + 'deg) rotate(' + c.r.toFixed(2) + 'deg) scale(' + c.s.toFixed(4) + ')';
  }

  // ---- 拖拽 ----
  function down(px, py, real) {
    var top = order[0], b = top.el.getBoundingClientRect();
    if (px < b.left || px > b.right || py < b.top || py > b.bottom) return false;
    drag = { c: top, ox: px - top.x, oy: py - top.y, hy: (py - (b.top + b.height / 2)) / b.height, hist: [], real: real };
    top.el.classList.add('grab'); top.vx = top.vy = 0;
    return true;
  }
  function move(px, py) {
    if (!drag) return;
    var c = drag.c, now = performance.now();
    c.x = px - drag.ox; c.y = py - drag.oy;
    drag.hist.push({ x: c.x, y: c.y, t: now }); while (drag.hist.length > 6) drag.hist.shift();
    var h = drag.hist, f = h[0], l = h[h.length - 1], dt = Math.max(16, l.t - f.t) / 1000;
    c.vx = (l.x - f.x) / dt; c.vy = (l.y - f.y) / dt;
    // 抓上半部分往右拖 → 顺时针；抓下半部分 → 逆时针（像真的捏着一张纸）
    c.tr = c.r = Math.max(-28, Math.min(28, c.x / rem() * 2.2 * (drag.hy < 0 ? 1 : -1) * (.4 + Math.abs(drag.hy))));
    lift = Math.min(1, Math.hypot(c.x, c.y) / (8 * rem()));
    layout();
  }
  function up() {
    if (!drag) return;
    var c = drag.c, sp = Math.hypot(c.vx, c.vy), far = Math.hypot(c.x, c.y) > 6.5 * rem();
    c.el.classList.remove('grab'); drag = null;
    if (sp > THROW || far) {
      if (sp < THROW) { var k = THROW * 1.6 / Math.max(1, Math.hypot(c.x, c.y)); c.vx = c.x * k; c.vy = c.y * k; }
      c.free = true; c.vr = c.vx / rem() * 2;
      setTimeout(function () { tuck(c); }, 380);
    } else { c.tr = 0; }
    lift = 0; layout();
  }
  function tuck(c) { // 飞出去的卡回到最底下：先换层级，再弹回去
    c.free = false; order.splice(order.indexOf(c), 1); order.push(c);
    c.vx *= .25; c.vy *= .25; layout();
  }

  addEventListener('pointerdown', function (e) { if (down(e.clientX, e.clientY, true)) { demo = false; idleT = 0; finger.className = 'finger'; try { e.target.setPointerCapture(e.pointerId); } catch (_) {} } });
  addEventListener('pointermove', function (e) { if (drag && drag.real) move(e.clientX, e.clientY); });
  addEventListener('pointerup', function () { if (drag && drag.real) up(); });
  addEventListener('pointercancel', function () { if (drag && drag.real) up(); });

  // ---- 自动演示：一根“手指”抓住顶卡，晃一晃没甩走，再狠狠甩一下 ----
  var script = null;
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function demoPath() {
    var b = deck.getBoundingClientRect(), cx = b.left + b.width * .56, cy = b.top + b.height * .32, R = rem();
    var dir = Math.random() < .5 ? 1 : -1;
    return [ // [时间 ms, x, y, 按下?]
      [0, cx + 6 * R * dir, cy + 9 * R, 0], [520, cx, cy, 0], [640, cx, cy, 1],
      [1100, cx + 3.6 * R * dir, cy + 1.2 * R, 1], [1450, cx - 1.2 * R * dir, cy + .3 * R, 1], [1640, cx, cy, 1], [1700, cx, cy, 0],
      [2300, cx, cy, 0], [2420, cx, cy, 1], [2760, cx + 2 * R * dir, cy + .6 * R, 1], [2900, cx + 9 * R * dir, cy - 1.5 * R, 1], [2910, cx + 9 * R * dir, cy - 1.5 * R, 0],
      [3500, cx + 13 * R * dir, cy + 4 * R, 0]
    ];
  }
  function runDemo(t) {
    if (!script) { script = { t0: t, p: demoPath(), pressed: false }; finger.classList.add('on'); }
    var p = script.p, e = t - script.t0, i = 0;
    while (i < p.length - 2 && p[i + 1][0] <= e) i++;
    var a = p[i], b = p[i + 1], k = Math.min(1, Math.max(0, (e - a[0]) / (b[0] - a[0] || 1)));
    var x = a[1] + (b[1] - a[1]) * ease(k), y = a[2] + (b[2] - a[2]) * ease(k), want = !!a[3];
    finger.style.translate = x + 'px ' + y + 'px'; // 用 translate 属性：.down 的 scale 不会把位移一起缩放
    if (want && !script.pressed) { script.pressed = down(x, y, false); finger.classList.add('down'); }
    if (!want && script.pressed) { up(); script.pressed = false; finger.classList.remove('down'); }
    if (script.pressed) move(x, y);
    if (e > p[p.length - 1][0]) { finger.classList.remove('on'); }
    if (e > p[p.length - 1][0] + 900) script = null;
  }

  var last = performance.now(), acc = 0;
  function frame(t) {
    var dt = Math.min(.05, (t - last) / 1000); last = t;
    if (!demo && !drag) { idleT += dt; if (idleT > 6) demo = true; }
    if (demo) runDemo(t);
    acc += dt;
    while (acc > 1 / 240) { cards.forEach(function (c) { spring(c, 1 / 240); }); acc -= 1 / 240; }
    cards.forEach(render);
    requestAnimationFrame(frame);
  }

  function reset() {
    script = null; drag = null; lift = 0; demo = true; finger.className = 'finger';
    order = cards.slice(); cards.forEach(function (c) { c.free = false; c.x = c.y = c.vx = c.vy = c.vr = c.vs = 0; });
    layout(); order.forEach(function (c) { c.r = c.tr; c.s = c.ts; c.y = c.ty; });
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') reset(); });
  addEventListener('resize', layout);
  reset();
  if (reduce) { cards.forEach(render); return; }   // 减少动态：静态叠放，不做自动演示
  requestAnimationFrame(frame);
})();
