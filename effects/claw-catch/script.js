/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Claw Catch — 小车是弹簧（跟着指针走，会过冲），爪子挂在绳子上是单摆（小车一加速它就往反方向甩），夹住玩偶时压扁、提起时拉长
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var K = num('--stiff'), C = 2 * Math.sqrt(K) * num('--damp'), G = num('--swing'), DROP = num('--drop');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return document.getElementById(id); };
  var svg = $('scene'), pend = $('pend'), cable = $('cable'), head = $('head'), heldG = $('held'), armL = $('armL'), armR = $('armR'), cart = $('cart');
  var pileG = $('pile'), looseG = $('loose'), trayG = $('tray'), fxG = $('fx'), flap = $('flap'), stick = $('stick'), bulbsG = $('bulbs');
  var btn = $('grab'), label = $('label'), live = $('live'), finger = $('finger'), stage = $('stage');
  var T = LANG === 'en'
    ? { idle: 'Grab one!', busy: 'Grabbing…', got: 'Got one!', slip: 'So close…', miss: 'Missed!', sGot: 'You caught a ghost cat plush!', sSlip: 'It slipped out. Try again.', sMiss: 'The claw came up empty.' }
    : { idle: '抓一只', busy: '抓取中…', got: '抓到啦！', slip: '差一点…', miss: '没抓到', sGot: '抓到了一只幽灵猫玩偶！', sSlip: '玩偶滑掉了，再试一次', sMiss: '爪子什么都没抓到' };

  var RAIL_Y = 71, HOME = 115, MINX = 104, MAXX = 298, PH = 37.4, HOLD = 50, TOP_L = 12;
  // 玩偶的位置：后排先画、前排后画（前排挡住后排）
  var SLOTS = [{ x: 174, y: 197 }, { x: 208, y: 196 }, { x: 242, y: 197 }, { x: 276, y: 196 }, { x: 157, y: 205 }, { x: 191, y: 206 }, { x: 225, y: 205 }, { x: 259, y: 206 }, { x: 293, y: 205 }];
  var COLORS = [['#ece6ff', '#d9cfff'], ['#ffd6e2', '#ffb3c7'], ['#d4f5e4', '#a5e6c4'], ['#fff1b8', '#ffdf73'], ['#dcefff', '#b3dbff']];
  var c = { x: HOME, v: 0, tx: HOME, ax: 0, th: 0, om: 0, L: TOP_L, open: 0, stick: 0 };
  var plushes = [], tweens = [], gen = 0, busy = false, demoOn = true, demoId = 0, idleT = 0, manualAt = -1e9, colorN = 0;
  var fing = { x: 0, y: 0, on: false, aim: false };

  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  // —— 小型补间引擎：同一个对象同一个属性，后来的覆盖先来的 ——
  var E = {
    io: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    in: function (t) { return t * t; },
    spring: function (t) { var z = .42, w = 2 * Math.PI * 1.5, wd = w * Math.sqrt(1 - z * z); t *= 1.3; return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); }
  };
  function tween(o, to, dur, ease) {
    if (reduce) dur = 0;
    return new Promise(function (res) {
      var keys = Object.keys(to), t0 = performance.now(), n = keys.length, done = 0;
      keys.forEach(function (k) {
        tweens = tweens.filter(function (w) { return !(w.o === o && w.k === k); });
        tweens.push({ o: o, k: k, a: o[k], b: to[k], t0: t0, d: dur, e: E[ease || 'io'], res: function () { if (++done === n) res(); } });
      });
    });
  }
  function stepTweens(now) {
    tweens = tweens.filter(function (w) {
      var p = w.d ? Math.min(1, (now - w.t0) / w.d) : 1; w.o[w.k] = w.a + (w.b - w.a) * w.e(p);
      if (p >= 1) { w.o[w.k] = w.b; w.res(); return false; } return true;
    });
  }
  function wait(t, g) { return new Promise(function (r) { setTimeout(function () { if (g === gen) r(); }, t); }); }
  function until(fn, max, g) { var t0 = performance.now(); return new Promise(function (r) { (function chk() { if (g !== gen) return; if (fn() || performance.now() - t0 > max) r(); else requestAnimationFrame(chk); })(); }); }

  // —— 幽灵猫玩偶（和画廊里的幽灵猫是同一个身形，缩小成 0.34） ——
  function makePlush(slot, dark) {
    var col = COLORS[colorN++ % COLORS.length];
    var g = el('g', { class: 'plush' + (dark ? ' dark' : ''), 'data-face': 'n' }), inner = el('g', {}, g);
    var art = el('g', { transform: 'scale(.34) translate(-100 -168)' }, inner);
    el('path', { class: 'shell', fill: dark ? '#3a3346' : col[0], d: 'M58 166 L58 96 L66 58 L84 78 Q100 72 116 78 L134 58 L142 96 L142 166 Q131 156 121 168 Q110 156 100 168 Q90 156 79 168 Q69 156 58 166Z' }, art);
    el('path', { class: 'earIn', fill: dark ? '#ff8fab' : col[1], d: 'M68 70 L80 82 L64 86Z M132 70 L120 82 L136 86Z' }, art);
    el('ellipse', { class: 'eye n', cx: 84, cy: 112, rx: 7, ry: 9 }, art); el('ellipse', { class: 'eye n', cx: 116, cy: 112, rx: 7, ry: 9 }, art);
    el('path', { class: 'line x', d: 'M77 105 L89 112 L77 119 M123 105 L111 112 L123 119' }, art);
    el('path', { class: 'line h', d: 'M76 115 Q84 104 92 115 M108 115 Q116 104 124 115' }, art);
    el('ellipse', { class: 'blush', cx: 70, cy: 129, rx: 8, ry: 5.5 }, art); el('ellipse', { class: 'blush', cx: 130, cy: 129, rx: 8, ry: 5.5 }, art);
    el('path', { class: 'line', d: 'M91 127 Q95.5 133 100 127 Q104.5 133 109 127' }, art);
    if (dark) { // 怪盗猫款：小礼帽 + 粉色帽带（稀有款）
      el('rect', { class: 'shell', x: 84, y: 30, width: 32, height: 30, rx: 4, fill: '#3a3346' }, art);
      el('rect', { x: 86, y: 48, width: 28, height: 6, fill: '#ff8fab' }, art);
      el('rect', { class: 'shell', x: 72, y: 58, width: 56, height: 8, rx: 4, fill: '#3a3346' }, art);
    }
    var p = { g: g, inner: inner, slot: slot, x: SLOTS[slot].x, y: SLOTS[slot].y, sx: 1, sy: 1, s: 1, rot: 0, o: 1, vy: 0, vr: 0, mode: 'pile', floor: null };
    plushes.push(p); placeInPile(p); render(p); return p;
  }
  function placeInPile(p) { // 后排（slot 0-2）插在前排前面
    var after = null; plushes.forEach(function (q) { if (q !== p && q.mode === 'pile' && q.slot > p.slot && q.g.parentNode === pileG && (!after || q.slot < after.slot)) after = q; });
    pileG.insertBefore(p.g, after ? after.g : null);
  }
  function render(p) {
    p.g.setAttribute('transform', 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') rotate(' + p.rot.toFixed(2) + ')');
    p.inner.setAttribute('transform', 'scale(' + (p.sx * p.s).toFixed(3) + ' ' + (p.sy * p.s).toFixed(3) + ')');
    p.g.style.opacity = p.o;
  }
  function face(p, f) { p.g.setAttribute('data-face', f); }
  function squash(p, sx, sy, d) { return tween(p, { sx: sx, sy: sy }, d || 90, 'out').then(function () { return tween(p, { sx: 1, sy: 1 }, 520, 'spring'); }); }

  // —— 灯牌的跑马灯 ——
  var bulbs = [];
  for (var i = 0; i < 13; i++) { bulbs.push(el('circle', { class: 'bulb', cx: 104 + i * 16, cy: 14, r: 3 }, bulbsG)); bulbs.push(el('circle', { class: 'bulb', cx: 104 + i * 16, cy: 54, r: 3 }, bulbsG)); }
  var chase = 0, chaseFast = false;
  (function tick() { chase++; bulbs.forEach(function (b, j) { b.classList.toggle('on', reduce || (j >> 1) % 2 === chase % 2); }); setTimeout(tick, chaseFast ? 130 : 420); })();

  // —— 按钮状态 ——
  function setBtn(k) {
    label.textContent = T[k]; btn.setAttribute('aria-busy', k === 'busy' ? 'true' : 'false'); btn.classList.toggle('ok', k === 'got');
    if (!reduce) label.animate([{ transform: 'scale(.55)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .55 }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (k === 'got') live.textContent = T.sGot; else if (k === 'slip') live.textContent = T.sSlip; else if (k === 'miss') live.textContent = T.sMiss;
  }

  // —— 物理 + 渲染，每帧一次 ——
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(.033, (now - last) / 1000); last = now;
    stepTweens(now);
    if (fing.aim) c.tx = clamp(toSvg(fing.x, fing.y).x, MINX, MAXX);
    if (reduce) { c.x = c.tx; c.v = 0; c.ax = 0; c.th = 0; }
    else {
      var a = K * (c.tx - c.x) - C * c.v; c.v += a * dt; c.x += c.v * dt; c.ax = a;
      var Le = c.L + 34, al = -(G / Le) * Math.sin(c.th) - 2.2 * c.om - (c.ax / Le) * Math.cos(c.th);
      c.om += al * dt; c.th = clamp(c.th + c.om * dt, -.55, .55);
    }
    pend.setAttribute('transform', 'translate(' + c.x.toFixed(2) + ' ' + RAIL_Y + ') rotate(' + (c.th * 57.2958).toFixed(2) + ')');
    cable.setAttribute('y2', c.L.toFixed(2)); head.setAttribute('transform', 'translate(0 ' + c.L.toFixed(2) + ')');
    armL.setAttribute('transform', 'rotate(' + c.open.toFixed(2) + ')'); armR.setAttribute('transform', 'rotate(' + (-c.open).toFixed(2) + ')');
    cart.setAttribute('x', (c.x - 10).toFixed(2));
    c.stick += (clamp(c.v * .16, -26, 26) - c.stick) * (reduce ? 1 : .18);
    stick.setAttribute('transform', 'rotate(' + c.stick.toFixed(2) + ' 188 254)');
    plushes.forEach(function (p) {
      if (p.mode === 'loose') {
        if (reduce) { if (p.floor != null) p.y = p.floor; else p.y = 999; }
        else { p.vy += 1500 * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
        if (p.floor != null && p.y >= p.floor) {
          p.y = p.floor;
          if (p.vy > 160 && !reduce) { p.vy *= -.26; p.vr *= .4; squash(p, 1.16, .8, 70); }
          else { p.vy = 0; p.mode = 'landing'; tween(p, { rot: 0 }, 260, 'out'); if (p.onLand) p.onLand(); }
        } else if (p.floor == null && p.y - PH * p.s > 212) { p.mode = 'gone'; if (p.onGone) p.onGone(); }
      }
      render(p);
    });
    requestAnimationFrame(frame);
  }

  function toSvg(x, y) { var pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  function toScreen(x, y) { var pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(svg.getScreenCTM()); }
  function headWorld() { // 爪子中心（hub）在场景里的坐标，用来把玩偶从爪子上“放”出去时位置连续
    var a = c.th; return { x: c.x - Math.sin(a) * c.L, y: RAIL_Y + Math.cos(a) * c.L, a: a };
  }

  // —— 一次抓取 ——
  function under(x) { // 爪子正下方最近的玩偶（前排优先）
    var best = null, bd = 1e9;
    plushes.forEach(function (p) { if (p.mode !== 'pile') return; var d = Math.abs(p.x - x) - (p.slot > 3 ? 3 : 0); if (d < bd) { bd = d; best = p; } });
    return best ? { p: best, d: Math.abs(best.x - x) } : null;
  }
  function drop(forced) {
    if (busy) return; busy = true; var g = gen; setBtn('busy');
    var hit = under(c.x), p = hit && hit.d < 22 ? hit.p : null;
    var out = forced || (!p ? 'miss' : hit.d < 9 ? 'got' : hit.d < 16 ? 'slip' : 'miss');
    if (out !== 'miss' && !p) out = 'miss';
    var Lt = out !== 'miss' ? p.y - PH - 12 - RAIL_Y : (p ? p.y - PH - 4 - RAIL_Y : 92);
    return until(function () { return Math.abs(c.v) < 25; }, 700, g).then(function () {
      c.tx = c.x;
      tween(c, { open: 26 }, 240, 'out');
      return wait(170, g);
    }).then(function () { return tween(c, { L: Lt }, DROP, 'io'); }).then(function () {
      if (out !== 'miss') { face(p, 'x'); squash(p, 1.1, .86, 110); }
      return tween(c, { open: out === 'miss' ? -5 : 8 }, 260, 'out');
    }).then(function () {
      if (out !== 'miss') { // 挂到爪子上（位置连续：局部 y = HOLD 刚好等于它原来的底边）
        p.mode = 'held'; p.x = 0; p.y = HOLD; p.rot = 0; heldG.appendChild(p.g); render(p);
      } else fx('?');
      return wait(out === 'miss' ? 260 : 170, g);
    }).then(function () {
      var up = tween(c, { L: TOP_L }, 720, 'io');
      if (out === 'got') { tween(p, { sy: 1.1, sx: .93 }, 200, 'out').then(function () { return tween(p, { sy: 1, sx: 1 }, 700, 'spring'); }); return up; }
      if (out === 'slip') {
        return wait(300, g).then(function () {
          tween(c, { open: 17 }, 120, 'out');
          release(p, { floor: SLOTS[p.slot].y, vy: -20, vr: (Math.random() - .5) * 60, onLand: function () { p.mode = 'pile'; p.x = SLOTS[p.slot].x; placeInPile(p); squash(p, 1.14, .82, 80); setTimeout(function () { face(p, 'n'); }, 500); } });
          setBtn('slip');
          return up;
        });
      }
      setBtn('miss'); return up;
    }).then(function () {
      if (out !== 'got') return tween(c, { open: 0 }, 300, 'out').then(function () { return wait(800, g); }).then(function () { setBtn('idle'); busy = false; });
      c.tx = HOME; c.v += 0; // 运到出口：小车的弹簧 + 单摆，会甩起来
      return until(function () { return Math.abs(c.x - HOME) < 1.5 && Math.abs(c.v) < 10; }, 1600, g).then(function () { return wait(260, g); }).then(function () {
        tween(c, { open: 28 }, 200, 'out');
        release(p, { floor: null, vy: 30, vr: (Math.random() - .5) * 120, onGone: function () { prize(p, g); } });
        return wait(360, g);
      }).then(function () { tween(c, { open: 0 }, 320, 'out'); });
    });
  }
  function release(p, o) { // 从爪子上放下：换算回场景坐标，变成自由落体
    var h = headWorld();
    p.x = h.x - Math.sin(h.a) * HOLD; p.y = h.y + Math.cos(h.a) * HOLD; p.rot = h.a * 57.3;
    p.mode = 'loose'; p.vy = o.vy; p.vr = o.vr; p.floor = o.floor; p.onLand = o.onLand; p.onGone = o.onGone; looseG.appendChild(p.g); render(p);
  }
  function prize(p, g) { // 出口小门翻开，玩偶从里面蹦到托盘上
    var slot = p.slot; p.mode = 'tray'; trayG.appendChild(p.g); p.x = 115; p.y = 262; p.rot = 0; p.s = .55; p.o = 0; p.sx = p.sy = 1; face(p, 'x'); render(p);
    var fl = reduce ? null : flap.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.1)', offset: .25 }, { transform: 'scaleY(.1)', offset: .7 }, { transform: 'scaleY(1.06)', offset: .86 }, { transform: 'scaleY(1)' }], { duration: 1500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    wait(reduce ? 0 : 200, g).then(function () {
      p.o = 1; return tween(p, { y: 244, s: .86 }, 200, 'out');
    }).then(function () { return tween(p, { y: 271, s: 1 }, 230, 'in'); }).then(function () {
      face(p, 'h'); squash(p, 1.18, .8, 80); sparks(115, 252); setBtn('got'); chaseFast = true;
      return wait(2600, g);
    }).then(function () { // 收尾：托盘上的玩偶蹦走，柜子里补一只新的
      chaseFast = false;
      return tween(p, { y: 258, o: 0, s: .8 }, 320, 'out');
    }).then(function () {
      p.g.remove(); plushes.splice(plushes.indexOf(p), 1);
      var n = makePlush(slot, false); n.mode = 'loose'; n.y = 40; n.vy = 0; n.vr = 0; n.floor = SLOTS[slot].y; looseG.appendChild(n.g);
      n.onLand = function () { n.mode = 'pile'; placeInPile(n); squash(n, 1.18, .8, 80); };
      return wait(reduce ? 0 : 700, g);
    }).then(function () { setBtn('idle'); busy = false; });
  }
  function sparks(x, y) {
    if (reduce) return;
    for (var i = 0; i < 7; i++) {
      var a = -Math.PI * (.08 + .84 * i / 6), r = 30 + (i % 2) * 10, s = el('path', { class: 'spark', d: 'M0 -8 L2.2 -2.2 L8 0 L2.2 2.2 L0 8 L-2.2 2.2 L-8 0 L-2.2 -2.2Z' }, fxG);
      var k = el('g', {}, fxG); k.appendChild(s);
      s.animate([{ transform: 'translate(' + x + 'px,' + y + 'px) scale(0) rotate(0deg)' }, { transform: 'translate(' + (x + Math.cos(a) * r) + 'px,' + (y + Math.sin(a) * r) + 'px) scale(1.1) rotate(60deg)', offset: .45 }, { transform: 'translate(' + (x + Math.cos(a) * r * 1.15) + 'px,' + (y + Math.sin(a) * r * 1.15) + 'px) scale(0) rotate(110deg)' }], { duration: 900, delay: i * 30, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }).onfinish = (function (k) { return function () { k.remove(); }; })(k);
    }
  }
  function fx(ch) {
    if (reduce) return; var h = headWorld();
    var t = el('text', { x: 0, y: 0, 'text-anchor': 'middle', class: 'title', style: 'font-size:16px' }, fxG); t.textContent = ch;
    t.animate([{ transform: 'translate(' + (h.x + 14) + 'px,' + (h.y + 20) + 'px) scale(.3)', opacity: 0 }, { transform: 'translate(' + (h.x + 16) + 'px,' + (h.y + 6) + 'px) scale(1.15)', opacity: 1, offset: .35 }, { transform: 'translate(' + (h.x + 18) + 'px,' + (h.y - 4) + 'px) scale(1)', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }).onfinish = function () { t.remove(); };
  }

  // —— 用户：指针在玻璃上左右移 = 移动爪子；点玻璃或按钮 = 抓；键盘 ←/→ + 空格 ——
  function autoGrab() {
    var pile = plushes.filter(function (p) { return p.mode === 'pile'; }); if (!pile.length) return;
    var p = pile[Math.floor(Math.random() * pile.length)], g = gen; busy = true; setBtn('busy');
    c.tx = p.x + (Math.random() - .5) * 4;
    until(function () { return Math.abs(c.x - c.tx) < 1.2 && Math.abs(c.v) < 12; }, 1800, g).then(function () { busy = false; drop(Math.random() < .2 ? 'slip' : 'got'); });
  }
  btn.addEventListener('click', function (e) {
    if (e.isTrusted) takeover();
    if (busy) return;
    if (performance.now() - manualAt < 4000) drop(null); else autoGrab();
  });
  btn.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); takeover(); if (busy) return;
    c.tx = clamp(c.tx + (e.key === 'ArrowLeft' ? -14 : 14), MINX, MAXX); manualAt = performance.now();
  });
  stage.addEventListener('pointermove', function (e) {
    if (!e.isTrusted || (!e.movementX && !e.movementY)) return;
    takeover(); if (busy) return;
    var p = toSvg(e.clientX, e.clientY);
    if (p.y > 40 && p.y < 214 && p.x > 80 && p.x < 320) { c.tx = clamp(p.x, MINX, MAXX); manualAt = performance.now(); }
  });
  svg.addEventListener('pointerdown', function (e) {
    var p = toSvg(e.clientX, e.clientY); takeover();
    if (p.x > 90 && p.x < 310 && p.y > 62 && p.y < 208 && !busy) { c.tx = clamp(p.x, MINX, MAXX); c.x = c.x; manualAt = performance.now(); setTimeout(function () { drop(null); }, 60); }
  });
  function takeover() {
    if (demoOn) { demoOn = false; demoId++; fing.on = fing.aim = false; finger.classList.remove('on', 'down'); btn.classList.remove('press'); }
    clearTimeout(idleT); idleT = setTimeout(function resume() { if (reduce) return; if (!busy) startDemo(); else idleT = setTimeout(resume, 1000); }, 7000);
  }

  // —— 没人碰时的自动演示：一根“手指”在玻璃上瞄准，再去按按钮 ——
  function moveFinger(x, y, d) { var id = demoId; return tween(fing, { x: x, y: y }, d, 'io').then(function () { return id === demoId ? null : new Promise(function () {}); }); } // 演示被接管后，链条停在这里
  function pump() { finger.style.transform = 'translate(' + fing.x + 'px,' + fing.y + 'px)'; requestAnimationFrame(pump); }
  function startDemo() {
    demoOn = true; var id = ++demoId, g = gen, k = 0;
    var seq = [[5, 'got'], [1, 'slip'], [6, 'got'], [8, 'got'], [2, 'got']];
    var dw = function (t) { return new Promise(function (r) { setTimeout(function () { if (id === demoId && g === gen) r(); }, t); }); };
    var r0 = btn.getBoundingClientRect();
    fing.x = r0.left + r0.width * .5; fing.y = innerHeight + 40;
    (function loop() {
      if (id !== demoId) return;
      var s = seq[k++ % seq.length], p = null;
      plushes.forEach(function (q) { if (q.mode === 'pile' && q.slot === s[0]) p = q; });
      if (!p) p = plushes.filter(function (q) { return q.mode === 'pile'; })[0];
      var a = toScreen(p.x + 26, 128), b = toScreen(p.x, 120), r = btn.getBoundingClientRect();
      dw(500).then(function () { if (!reduce) { fing.on = true; finger.classList.add('on'); } return moveFinger(a.x, a.y, 620); })
        .then(function () { fing.aim = true; return moveFinger(b.x, b.y, 520); })
        .then(function () { return dw(700); })
        .then(function () { fing.aim = false; return moveFinger(r.left + r.width * .52, r.top + r.height * .55, 520); })
        .then(function () { finger.classList.add('down'); btn.classList.add('press'); return dw(150); })
        .then(function () { finger.classList.remove('down'); btn.classList.remove('press'); c.tx = p.x; drop(s[1]); return dw(400); })
        .then(function () { return moveFinger(r.left + r.width * 1.3, r.top + r.height * 1.6, 600); })
        .then(function () { finger.classList.remove('on'); return new Promise(function (res) { (function w() { if (id !== demoId) return; if (!busy) res(); else setTimeout(w, 120); })(); }); })
        .then(function () { return dw(500); }).then(loop);
    })();
  }

  function resetAll() {
    gen++; tweens = []; busy = false; chaseFast = false;
    plushes.forEach(function (p) { p.g.remove(); }); plushes = []; colorN = 0;
    SLOTS.forEach(function (s, i) { makePlush(i, i === 6); });
    c.x = c.tx = HOME; c.v = c.th = c.om = c.open = 0; c.L = TOP_L;
    setBtn('idle'); live.textContent = '';
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { resetAll(); if (!reduce) startDemo(); } });
  resetAll(); requestAnimationFrame(frame); requestAnimationFrame(pump);
  if (!reduce) startDemo(); // 减弱动效时不自动演示，等用户自己按
})();
