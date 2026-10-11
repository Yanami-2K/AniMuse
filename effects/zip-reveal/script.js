/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Zip Reveal（黑白线稿）— 缝的形状 = 两个 smoothstep 相乘（离拉链头越远越开、离起点越远越开），上唇往上、下唇往下；齿沿曲线排、跟着切线转
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var GAP = num('--gap'), SNAP = num('--snap'), K1 = num('--stiff'), K2 = num('--back');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return document.getElementById(id); };
  var svg = $('scene'), lens = $('lens'), lining = $('lining'), tapeU = $('tapeU'), tapeL = $('tapeL'), front = $('front'), clipP = $('catClipPath');
  var teethU = $('teethU'), teethL = $('teethL'), cat = $('cat'), catInner = $('catInner'), paws = $('paws'), pull = $('pull'), slider = $('slider'), tab = $('tab'), ring = $('ring');
  var bubble = $('bubble'), bubbleBox = $('bubbleBox'), bubbleTxt = $('bubbleTxt'), live = $('live'), finger = $('finger'), stage = $('stage');
  var YZ = 132, X0 = 96, X1 = 304, UP = .45, STEP = 6.6, CX = 200;
  var S = { // 拉链头：位置 x、速度 v、目标 tx、加速度 a；拉片摆角 ph/角速度 pw；猫：冒出高度 rise
    x: X0, v: 0, tx: X0, a: 0, k: K1, z: .72, ph: 0, pw: 0, rise: 0, rv: 0, rt: 0, held: false, open: false, popped: false
  };
  var demoOn = true, demoId = 0, idleT = 0, gen = 0;
  var fing = { x: 0, y: 0 }, fingDrag = false;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ss = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  var p = function () { return (S.x - X0) / (X1 - X0); };

  // —— 缝的形状 ——
  function gap(x) {
    if (x >= S.x) return 0;
    var g = GAP * ss((S.x - X0) / (X1 - X0) * 1.7);   // 拉得越开，布料能张得越大
    return g * ss((S.x - x) / 74) * ss((x - X0) / 44);
  }
  var yUp = function (x) { return YZ - gap(x) * UP; }, yLo = function (x) { return YZ + gap(x) * (1 - UP); };
  function curve(f, a, b, dy) { var s = ''; for (var x = a; x <= b + .01; x += 4) s += (s ? ' L' : 'M') + x.toFixed(1) + ' ' + (f(Math.min(x, b)) + (dy || 0)).toFixed(2); return s; }
  function curveBack(f, a, b, dy) { var s = ''; for (var x = b; x >= a - .01; x -= 4) s += ' L' + x.toFixed(1) + ' ' + (f(Math.max(x, a)) + (dy || 0)).toFixed(2); return s; }

  // —— 齿 ——
  var TU = [], TL = [];
  for (var x = X0 + 2; x <= X1 - 2; x += STEP) {
    TU.push({ x: x, e: el('rect', { class: 'tooth', x: -2.4, y: -3.2, width: 4.8, height: 6.4, rx: 1.4 }, teethU) });
    TL.push({ x: x + STEP / 2, e: el('rect', { class: 'tooth', x: -2.4, y: -3.2, width: 4.8, height: 6.4, rx: 1.4 }, teethL) });
  }
  function placeTeeth(list, f, closedDy, openDy) {
    list.forEach(function (t) {
      var x = t.x, y, ang = 0;
      if (x >= S.x - 1) y = YZ + closedDy;
      else { var g = gap(x); y = f(x) + openDy * Math.min(1, g / 6) + closedDy * (1 - Math.min(1, g / 6)); ang = Math.atan2(f(x + 1.5) - f(x - 1.5), 3) * 57.3; }
      t.e.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ')');
    });
  }

  // —— 每帧 ——
  var last = performance.now(), wasOpen = false;
  function frame(now) {
    var dt = Math.min(.033, (now - last) / 1000); last = now;
    if (fingDrag) S.tx = clamp(toSvg(fing.x, fing.y).x - grabDx, X0, X1);
    if (reduce) { S.a = 0; S.v = 0; S.x = S.tx; S.ph = 0; }
    else {
      var c = 2 * Math.sqrt(S.k) * S.z, a = S.k * (S.tx - S.x) - c * S.v;
      S.v += a * dt; S.x += S.v * dt; S.a = a;
      if (S.x < X0) { S.x = X0; S.v = -S.v * .25; }   // 撞到起点：小小地弹一下
      if (S.x > X1) { S.x = X1; S.v = -S.v * .25; }
      var l = 26, al = -(900 / l) * Math.sin(S.ph) - 5 * S.pw - (S.a / l) * Math.cos(S.ph) * .9;
      S.pw += al * dt; S.ph = clamp(S.ph + S.pw * dt, -1.2, 1.2);
    }
    var P = p();
    // 猫：拉开一半偷看，拉到底并松手才整只冒出来
    var peekMax = Math.max(0, (YZ + 4) - yUp(CX));
    S.rt = S.popped ? 74 : (P > .5 && !reduce ? Math.min(30, peekMax) : 0);
    if (reduce) { S.rise = S.rt; S.rv = 0; }
    else { var ca = 140 * (S.rt - S.rise) - 2 * Math.sqrt(140) * (S.popped ? .42 : .8) * S.rv; S.rv += ca * dt; S.rise += S.rv * dt; }
    var st = clamp(S.rv * .0016, -.14, .2);
    cat.setAttribute('transform', 'translate(' + CX + ' ' + (YZ + 82 - S.rise).toFixed(2) + ')');
    catInner.setAttribute('transform', 'scale(' + (1 - st * .6).toFixed(3) + ' ' + (1 + st).toFixed(3) + ')');
    var pawO = clamp((S.rise - 56) / 12, 0, 1);
    paws.style.opacity = pawO; paws.setAttribute('transform', 'translate(' + CX + ' ' + (yLo(CX) + 2 - pawO * 2).toFixed(2) + ')');
    // 形状
    if (S.x > X0 + .5) {
      lens.setAttribute('d', curve(yUp, X0, S.x) + curveBack(yLo, X0, S.x) + ' Z');
      lining.setAttribute('d', curve(yUp, X0, S.x, 1.2) + curveBack(function (x) { return yUp(x) + gap(x) * .34; }, X0, S.x) + ' Z');
    } else { lens.setAttribute('d', 'M0 0Z'); lining.setAttribute('d', 'M0 0Z'); }
    tapeU.setAttribute('d', curve(function (x) { return yUp(x) - 3; }, X0 - 6, X1 + 6));
    tapeL.setAttribute('d', curve(function (x) { return yLo(x) + 3; }, X0 - 6, X1 + 6));
    front.setAttribute('d', 'M80 ' + YZ + ' L' + (X0 - 6) + ' ' + YZ + ' ' + curve(yLo, X0, X1).replace('M', 'L') + ' L' + (X1 + 6) + ' ' + YZ + ' L320 ' + YZ + ' L320 228 Q320 264 284 264 L116 264 Q80 264 80 228 Z');
    clipP.setAttribute('d', 'M' + X0 + ' -60 L' + S.x.toFixed(1) + ' -60' + curveBack(yLo, X0, S.x) + ' Z');
    placeTeeth(TU, yUp, -1.8, 1.2); placeTeeth(TL, yLo, 1.8, -1.2);
    slider.setAttribute('transform', 'translate(' + S.x.toFixed(2) + ' ' + YZ + ')');
    ring.setAttribute('transform', 'translate(' + S.x.toFixed(2) + ' ' + (YZ + 12) + ')');
    tab.setAttribute('transform', 'translate(' + S.x.toFixed(2) + ' ' + (YZ + 5) + ') rotate(' + (S.ph * 57.3).toFixed(2) + ')');
    pull.querySelector('.hit').setAttribute('transform', 'translate(' + S.x.toFixed(2) + ' ' + YZ + ')');
    var pc = Math.round(P * 100); if (pull.getAttribute('aria-valuenow') != pc) pull.setAttribute('aria-valuenow', pc);
    var open = P > .995; if (open !== wasOpen) { wasOpen = open; if (open && !S.held) pop(); }
    if (P < .9 && S.popped) duck();
    if (!S.popped) setFace(P > .5 ? 'n' : 'x');
    requestAnimationFrame(frame);
  }
  function setFace(f) { var cl = 'cat-' + f; if (cat.getAttribute('class') !== cl) cat.setAttribute('class', cl); }

  // —— 冒出来 / 缩回去 ——
  function pop() {
    if (S.popped) return; S.popped = true; S.rv += reduce ? 0 : 260;
    setFace('o'); pfHappy(true); setTimeout(function () { if (S.popped) setFace('h'); }, 420);
    live.textContent = bubbleTxt.textContent;
    var bb = bubbleTxt.getBBox(), w = bb.width + 22, h = 26, bx = 300, by = 44;
    bubbleTxt.setAttribute('x', bx); bubbleTxt.setAttribute('y', by + 4.5);
    bubbleBox.setAttribute('d', 'M' + (bx - w / 2 + 10) + ' ' + (by - h / 2) + ' H' + (bx + w / 2 - 10) + ' Q' + (bx + w / 2) + ' ' + (by - h / 2) + ' ' + (bx + w / 2) + ' ' + (by - h / 2 + 10) + ' V' + (by + h / 2 - 10) + ' Q' + (bx + w / 2) + ' ' + (by + h / 2) + ' ' + (bx + w / 2 - 10) + ' ' + (by + h / 2) +
      ' H' + (bx - w / 2 + 34) + ' L' + (bx - w / 2 + 16) + ' ' + (by + h / 2 + 12) + ' L' + (bx - w / 2 + 20) + ' ' + (by + h / 2) + ' H' + (bx - w / 2 + 10) + ' Q' + (bx - w / 2) + ' ' + (by + h / 2) + ' ' + (bx - w / 2) + ' ' + (by + h / 2 - 10) + ' V' + (by - h / 2 + 10) + ' Q' + (bx - w / 2) + ' ' + (by - h / 2) + ' ' + (bx - w / 2 + 10) + ' ' + (by - h / 2) + ' Z');
    bubble.style.transformOrigin = (bx - w / 2 + 16) + 'px ' + (by + h / 2 + 12) + 'px';
    bubble.getAnimations().forEach(function (a) { a.cancel(); });
    bubble.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'scale(.2) rotate(-8deg)' }, { opacity: 1, transform: 'scale(1.08) rotate(2deg)', offset: .6 }, { opacity: 1, transform: 'scale(1)' }], { duration: reduce ? 200 : 460, delay: reduce ? 0 : 260, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
    if (!reduce) cat.animate([{ transform: cat.getAttribute('transform') + ' rotate(0deg)' }], { duration: 1 });
  }
  function duck() {
    S.popped = false; setFace('x'); pfHappy(false);
    bubble.getAnimations().forEach(function (a) { a.cancel(); });
    bubble.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.6)' }], { duration: reduce ? 1 : 180, easing: 'ease-in', fill: 'both' });
  }

  function pfHappy() {} // 黑白版的袋子没有脸
  // —— 拖动 ——
  var grabDx = 0;
  function toSvg(x, y) { var pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  function toScreen(x, y) { var pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(svg.getScreenCTM()); }
  function grab() { S.held = true; S.k = K1; S.z = .72; pull.classList.add('held'); }
  function letGo() { // 拉过 --snap 就自动拉到底，否则弹回起点
    S.held = false; pull.classList.remove('held');
    if (p() >= SNAP) { S.k = 120; S.z = .6; S.tx = X1; } else { S.k = K2; S.z = .5; S.tx = X0; }
  }
  function setTarget(P, k, z) { S.k = k || 120; S.z = z || .62; S.tx = X0 + clamp(P, 0, 1) * (X1 - X0); }
  pull.addEventListener('pointerdown', function (e) {
    if (!e.isTrusted) return; takeover(); e.preventDefault();
    pull.setPointerCapture(e.pointerId); grabDx = toSvg(e.clientX, e.clientY).x - S.x; grab();
  });
  pull.addEventListener('pointermove', function (e) { if (S.held && e.isTrusted) S.tx = clamp(toSvg(e.clientX, e.clientY).x - grabDx, X0, X1); });
  pull.addEventListener('pointerup', function () { if (S.held) letGo(); });
  pull.addEventListener('pointercancel', function () { if (S.held) letGo(); });
  svg.addEventListener('click', function (e) { // 点笔袋其他地方 = 一下拉开 / 拉上
    if (!e.isTrusted || pull.contains(e.target)) return; takeover();
    var q = toSvg(e.clientX, e.clientY); if (q.y < 54 || q.y > 266 || q.x < 78 || q.x > 322) return;
    setTarget(p() > .5 ? 0 : 1);
  });
  pull.addEventListener('keydown', function (e) {
    var k = e.key, P = p(), m = { ArrowRight: P + .1, ArrowUp: P + .1, ArrowLeft: P - .1, ArrowDown: P - .1, Home: 0, End: 1, PageUp: P + .25, PageDown: P - .25 };
    if (k === ' ' || k === 'Enter') m[k] = P > .5 ? 0 : 1;
    if (!(k in m)) return; e.preventDefault(); takeover();
    setTarget(Math.round(clamp(m[k], 0, 1) * 10) / 10, 160, .75);
  });
  stage.addEventListener('pointermove', function (e) { if (e.isTrusted && (e.movementX || e.movementY)) takeover(); });
  function takeover() {
    if (demoOn) { demoOn = false; demoId++; fingDrag = false; finger.classList.remove('on', 'down'); if (S.held && !pull.classList.contains('held')) letGo(); S.held = false; }
    clearTimeout(idleT); idleT = setTimeout(function () { if (!S.held && !reduce) startDemo(); }, 8000);
  }

  // —— 自动演示：手指捏住拉片，先拉一半松手（弹回去），再拉到底（猫冒出来），然后拉回去 ——
  function tweenF(x, y, d) { // 演示被接管后（demoId 变了）这个 Promise 永远不 resolve，后面的步骤就不会再跑
    var x0 = fing.x, y0 = fing.y, t0 = performance.now(), id = demoId;
    return new Promise(function (res) { (function f(now) { if (id !== demoId) return; var t = Math.min(1, (now - t0) / d), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; fing.x = x0 + (x - x0) * e; fing.y = y0 + (y - y0) * e; if (t < 1) requestAnimationFrame(f); else res(); })(t0); });
  }
  function pump() { finger.style.transform = 'translate(' + fing.x + 'px,' + fing.y + 'px)'; requestAnimationFrame(pump); }
  function tabTip() { return toScreen(S.x + Math.sin(-S.ph) * 22, YZ + 5 + Math.cos(S.ph) * 22); }
  function startDemo() {
    demoOn = true; var id = ++demoId;
    var dw = function (t) { return new Promise(function (r) { setTimeout(function () { if (id === demoId) r(); }, t); }); };
    var at = function (P) { var q = toScreen(X0 + P * (X1 - X0), YZ + 27); return q; };
    var press = function () { var t = tabTip(); return tweenF(t.x, t.y, 520).then(function () { finger.classList.add('down'); grabDx = toSvg(fing.x, fing.y).x - S.x; grab(); fingDrag = true; return dw(160); }); };
    var release = function () { fingDrag = false; finger.classList.remove('down'); letGo(); return dw(120); };
    (function loop() {
      if (id !== demoId) return;
      var o = toScreen(X0 + 30, YZ + 90); fing.x = o.x; fing.y = o.y + 60;
      dw(600).then(function () { if (!reduce) finger.classList.add('on'); return press(); })
        .then(function () { var q = at(.3); return tweenF(q.x, q.y, 700); })
        .then(function () { var q = at(.5); return tweenF(q.x, q.y, 600); })
        .then(function () { return dw(380); }).then(release)
        .then(function () { var q = toScreen(X0 + 40, YZ + 70); return tweenF(q.x, q.y, 500); })
        .then(function () { return dw(900); }).then(press)
        .then(function () { var q = at(.62); return tweenF(q.x, q.y, 820); })
        .then(function () { var q = at(.86); return tweenF(q.x, q.y, 560); })
        .then(release)
        .then(function () { var q = toScreen(330, 240); return tweenF(q.x, q.y, 600); })
        .then(function () { finger.classList.remove('on'); return dw(2600); })
        .then(function () { if (!reduce) finger.classList.add('on'); return press(); })
        .then(function () { var q = at(0); return tweenF(q.x, q.y, 1100); })
        .then(release)
        .then(function () { var q = toScreen(X0 + 30, YZ + 110); return tweenF(q.x, q.y, 500); })
        .then(function () { finger.classList.remove('on'); return dw(700); })
        .then(loop);
    })();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay' && !reduce) { S.x = S.tx = X0; S.v = 0; if (S.popped) duck(); startDemo(); } });
  requestAnimationFrame(frame); requestAnimationFrame(pump);
  if (!reduce) startDemo(); // 减弱动效时不自动演示
})();
