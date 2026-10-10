/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Pixel Cat Input — 精灵帧是离散的（canvas 逐像素画，不做补间），位置是连续的（弹簧驱动的亚像素 translate）
// 交互灵感：Rauno Freiberg “lil pix” https://x.com/raunofreiberg/status/2060034871263703452 —— 像素猫与代码为 AniMuse 原创
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var K = num('--stiffness'), C = num('--damping'), BORED = num('--bored');
  var $ = function (id) { return document.getElementById(id); };
  var pill = $('pill'), slot = $('slot'), line = $('line'), cv = $('cat'), ctx = cv.getContext('2d'), input = $('input'), caret = $('caret'), chipE = $('chipE'), cursor = $('cursor');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var zh = LANG !== 'en';
  input.placeholder = zh ? '问问 Agent' : 'Ask Agent';
  var INK = css.getPropertyValue('--ink').trim() || '#1c1a21';

  // —— 像素幽灵猫：14 列宽的身体 + 两种裙摆（走路时交替），眼睛单独画成“镂空”的 2×2 白点 ——
  var BODY = ['.X..........X.', '.XX........XX.', '.XXX......XXX.', '.XXXXXXXXXXXX.', 'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX'];
  var HEM = [['XXXX.XXXX.XXXX', '.XX...XX...XX.'], ['XXX.XXXX.XXXXX', 'XX...XX...XX..']];
  var W = 20, H = 16, OX = 3, BOTTOM = 15;
  cv.width = W; cv.height = H;
  // f = { hem, squish 0|1|2, dx, dy, closed, face -1|0|1, tail 0|1, bob 0|1 }
  function draw(f) {
    ctx.clearRect(0, 0, W, H);
    var rows = BODY.slice(), drop = f.squish === 1 ? 1 : f.squish === 2 ? 3 : 0, wide = f.squish === 2 ? 1 : 0;
    if (drop) rows.splice(8, drop);
    rows = rows.concat(HEM[f.hem]);
    var top = BOTTOM - rows.length + 1 - f.bob;
    ctx.fillStyle = INK;
    rows.forEach(function (r, y) {
      var body = y >= 3;
      for (var x = -wide; x < 14 + wide; x++) {
        var ch = x < 0 ? (body && y < rows.length - 2 ? 'X' : '.') : x >= 14 ? (body && y < rows.length - 2 ? 'X' : '.') : r[x];
        if (ch === 'X') ctx.fillRect(OX + x, top + y, 1, 1);
      }
    });
    // 尾巴：在身后（正面时在右边），偶尔甩一下
    var side = f.face === 1 ? -1 : 1, tx = side > 0 ? OX + 14 + wide : OX - 1 - wide, ty = top + rows.length - 4;
    var tail = f.tail ? [[0, 0], [1, 0], [2, -1]] : [[0, 0], [1, -1], [1, -2]];
    tail.forEach(function (p) { ctx.fillRect(tx + p[0] * side, ty + p[1], 1, 1); });
    // 眼睛：镂空（清掉像素），8 个方向 = dx、dy 各取 -1/0/1；侧身时整体偏 2 格
    var ey = top + 6 + (f.dy || 0) - (drop ? 0 : 0), ex = (f.face ? f.face * 2 : f.dx || 0);
    if (f.squish === 2) ey = top + 5;
    [3, 9].forEach(function (c) {
      var x = OX + c + ex;
      if (f.closed) ctx.clearRect(x, ey + 1, 2, 1); else ctx.clearRect(x, ey, 2, 2);
    });
  }

  // —— 状态 ——
  var R = function () { return parseFloat(getComputedStyle(document.documentElement).fontSize); };
  var px = 2, frame = { hem: 0, squish: 0, dx: 0, dy: 0, closed: false, face: 0, tail: 0, bob: 0 }, dirty = true;
  var wS = { x: 0, v: 0, t: 0 }, catS = { x: 0, v: 0, t: 0 }, hopS = { x: 0, v: 0, t: 0 };
  var focused = false, pressing = false, lastAct = 0, pointer = null, pointerAt = 0, shown = false;
  var pace = null, look = null, blinkAt = 0, tailAt = 0, squishT = null;
  function setF(o) { for (var k in o) if (frame[k] !== o[k]) { frame[k] = o[k]; dirty = true; } }
  function size() {
    px = Math.max(2, Math.round(R() * .13));
    cv.style.width = W * px + 'px'; cv.style.height = H * px + 'px'; cv.style.margin = (-H * px / 2) + 'px 0 0 ' + (-W * px / 2) + 'px';
    wS.t = R() * num(focused ? '--w-open' : '--w'); if (!wS.x) wS.x = wS.t;
  }
  function measure() { // 光标放在文字末尾：用 canvas 量文字宽度
    var m = measure.c || (measure.c = document.createElement('canvas').getContext('2d')), s = getComputedStyle(input);
    m.font = s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily; caret.style.left = m.measureText(input.value).width + 'px';
  }

  // 按下：逐帧压扁（0 → 1 → 2），闭眼；松开：逐帧弹回 + 小跳，然后聚焦
  function press() {
    if (pressing) return; pressing = true; lastAct = performance.now(); clearTimeout(squishT); pace = null;
    if (reduce) return;
    setF({ squish: 1, closed: true, face: 0 }); squishT = setTimeout(function () { setF({ squish: 2 }); }, 55);
  }
  function release() {
    if (!pressing) return; pressing = false; clearTimeout(squishT);
    if (!reduce) { setF({ squish: 1 }); squishT = setTimeout(function () { setF({ squish: 0, closed: false }); hopS.v = -R() * 7; }, 55); }
    setFocus(true);
  }
  function setFocus(v) {
    focused = v; lastAct = performance.now(); pill.classList.toggle('on', v); wS.t = R() * num(v ? '--w-open' : '--w'); pace = null;
    if (v) { if (document.hasFocus()) try { input.focus({ preventScroll: true }); } catch (_) {} measure(); }   // 嵌在画廊卡片里自动演示时不抢父页面的焦点
    else { try { input.blur(); } catch (_) {} catS.t = 0; setF({ face: 0, dx: 0, dy: 0, hem: 0, bob: 0 }); }
    if (reduce) { wS.x = wS.t; }
  }

  // —— 主循环 ——
  var last = performance.now();
  function spring(s, dt, k, c) { s.v += (k * (s.t - s.x) - c * s.v) * dt; s.x += s.v * dt; }
  function tick(now) {
    var dt = Math.min(.033, (now - last) / 1000); last = now;
    for (var i = 0; i < 4; i++) { spring(wS, dt / 4, K, C); spring(catS, dt / 4, 140, 20); spring(hopS, dt / 4, 400, 22); }
    pill.style.width = wS.x.toFixed(2) + 'px';
    if (shown && !pressing) behave(now);
    if (dirty) { draw(frame); dirty = false; }
    var float = reduce ? 0 : Math.sin(now / 520) * px * .6; // 幽灵在飘：连续的亚像素上下浮动
    cv.style.transform = 'translate(' + catS.x.toFixed(2) + 'px,' + (float + hopS.x).toFixed(2) + 'px)';
    requestAnimationFrame(tick);
  }
  function behave(now) {
    var r = R(), sinceAct = now - lastAct;
    if (focused) {
      if (sinceAct < BORED || reduce) { // 在打字 / 刚聚焦：停下来看着光标
        pace = null; catS.t = catS.t; setF({ face: 0, dx: 1, dy: 0, hem: 0, bob: 0, closed: false }); return;
      }
      // 无聊了：转身 → 两帧走路 + 1px 上下 → 走到边 → 停一下 → 转身朝光标走回来 → 盯着光标
      var edge = r * .95;
      if (!pace) pace = { phase: 'turn', t: now, dir: -1 };
      var p = pace, el = now - p.t;
      if (p.phase === 'turn') { setF({ face: 0, dx: p.dir }); if (el > 110) { p.phase = 'walk'; p.t = now; catS.t = p.dir < 0 ? -edge : edge * .35; } }
      else if (p.phase === 'walk') {
        var step = Math.floor(el / 150) % 2; setF({ face: p.dir, hem: step, bob: step });
        if (Math.abs(catS.t - catS.x) < r * .05) { p.phase = 'pause'; p.t = now; setF({ hem: 0, bob: 0 }); }
      } else if (p.phase === 'pause') {
        if (el > (p.dir < 0 ? 520 : 1300)) { p.dir = -p.dir; p.phase = 'turn'; p.t = now; }
        else if (p.dir > 0 && el > 120) setF({ face: 0, dx: 1 }); // 回到靠近光标的位置后正脸看过去
      }
      return;
    }
    // 没聚焦：眼睛追指针；指针不动一会儿就自己左看右看；偶尔眨眼、甩尾巴
    if (reduce) { setF({ dx: 0, dy: 0, face: 0 }); return; }
    if (pointer && now - pointerAt < 2200) {
      look = null;
      var b = cv.getBoundingClientRect(), dx = pointer.x - (b.left + b.width / 2), dy = pointer.y - (b.top + b.height / 2), d = Math.hypot(dx, dy);
      if (d < r * .9) setF({ dx: 0, dy: 0 });
      else { var a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4; setF({ dx: Math.round(Math.cos(a)), dy: Math.round(Math.sin(a)) }); }
    } else {
      if (!look) look = { t: now };
      var e = (now - look.t) % 4200;
      setF({ dy: 0, dx: e < 1600 ? 0 : e < 1950 ? -1 : e < 2300 ? 1 : 0 });
    }
    if (now > blinkAt) { setF({ closed: true }); if (now > blinkAt + 110) { setF({ closed: false }); blinkAt = now + 2400 + Math.random() * 2400; } }
    if (now > tailAt) { setF({ tail: 1 }); if (now > tailAt + 180) { setF({ tail: 0 }); tailAt = now + 3000 + Math.random() * 3000; } }
  }

  // 一开始是普通的线性图标，0.6s 后“啵”地换成像素猫，先左右看一眼
  function intro() {
    shown = false; cv.style.opacity = 0; line.style.opacity = 1; line.getAnimations().forEach(function (a) { a.cancel(); });
    if (reduce) { line.style.opacity = 0; cv.style.opacity = 1; shown = true; return; }
    setTimeout(function () {
      line.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.4)', opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' });
      setTimeout(function () {
        cv.style.opacity = 1; shown = true; look = { t: performance.now() - 1500 };
        cv.animate([{ scale: '.3' }, { scale: '1.18' }, { scale: '.94' }, { scale: '1' }], { duration: 320, easing: 'ease-out' });
      }, 110);
    }, 600);
  }

  // —— 真实交互 ——
  var userAt = -1e9;
  function user() { userAt = performance.now(); if (demoOn) stopDemo(); }
  addEventListener('pointermove', function (e) { if (e.isTrusted) { user(); pointer = { x: e.clientX, y: e.clientY }; pointerAt = performance.now(); } });
  pill.addEventListener('pointerdown', function (e) { if (!e.isTrusted) return; user(); e.preventDefault(); press(); });
  addEventListener('pointerup', function (e) { if (e.isTrusted && pressing) release(); });
  input.addEventListener('focus', function () { if (!focused) setFocus(true); });
  input.addEventListener('blur', function () { if (focused && !demoOn) setFocus(false); });
  input.addEventListener('input', function () { lastAct = performance.now(); measure(); caret.classList.add('typing'); clearTimeout(input.t); input.t = setTimeout(function () { caret.classList.remove('typing'); }, 500); });
  addEventListener('keydown', function (e) {
    if (e.isTrusted) user();
    if (e.key === 'Escape' && focused) { e.preventDefault(); hitEsc(); setFocus(false); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); setFocus(true); }
    else if (focused) lastAct = performance.now();
  });
  function hitEsc() { chipE.classList.add('hit'); setTimeout(function () { chipE.classList.remove('hit'); }, 140); }

  // —— 自动演示（卡片预览）：假指针绕一圈 → 按下压扁 → 聚焦打字 → 闲着踱步 → Esc ——
  var demoOn = false, run = 0, fake = { x: 0, y: 0 };
  var wait = function (t, id) { return new Promise(function (res) { setTimeout(function () { if (id === run) res(); }, t); }); };
  function moveTo(x, y, d, id) {
    return new Promise(function (res) {
      var x0 = fake.x, y0 = fake.y, t0 = performance.now();
      (function f(t) { if (id !== run) return; var p = Math.min(1, (t - t0) / d), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        fake.x = x0 + (x - x0) * e; fake.y = y0 + (y - y0) * e; cursor.style.translate = fake.x + 'px ' + fake.y + 'px'; pointer = { x: fake.x, y: fake.y }; pointerAt = performance.now();
        if (p < 1) requestAnimationFrame(f); else res(); })(t0);
    });
  }
  async function demo() {
    var id = ++run; demoOn = true; if (reduce) return;
    input.value = ''; measure(); if (focused) setFocus(false);
    var b = pill.getBoundingClientRect(), r = R(), cx = b.left + r * 1.4, cy = b.top + b.height / 2;
    fake.x = innerWidth * .82; fake.y = innerHeight * .92; cursor.style.translate = fake.x + 'px ' + fake.y + 'px'; cursor.classList.add('on');
    await wait(1400, id);
    await moveTo(cx - r * 3, cy - r * 4, 700, id); await wait(350, id);
    await moveTo(cx + r * 4, cy - r * 3.4, 650, id); await wait(300, id);
    await moveTo(cx + r * 3, cy + r * 3.6, 600, id); await wait(300, id);
    await moveTo(cx + r * 4.2, cy + r * .2, 500, id); await wait(160, id);
    press(); cursor.style.scale = '.85'; await wait(380, id);
    cursor.style.scale = ''; release(); await wait(250, id);
    await moveTo(innerWidth * .78, innerHeight * .86, 600, id); cursor.classList.remove('on');
    var txt = zh ? '画一只会飘的猫' : 'draw a floating cat';
    for (var i = 0; i < txt.length; i++) { input.value += txt[i]; input.dispatchEvent(new Event('input')); await wait(zh ? 150 : 70, id); }
    await wait(5200, id);
    hitEsc(); setFocus(false); await wait(500, id);
    input.value = ''; measure(); await wait(1600, id);
    demo();
  }
  function stopDemo() { run++; demoOn = false; cursor.classList.remove('on'); cursor.style.scale = ''; }
  setInterval(function () { if (!demoOn && !reduce && performance.now() - userAt > 7000 && !focused) demo(); }, 1000);

  function reset() { stopDemo(); userAt = -1e9; pressing = false; setFocus(false); input.value = ''; size(); wS.x = wS.t; catS.x = catS.t = 0; setF({ squish: 0, closed: false, face: 0, dx: 0, dy: 0, hem: 0, bob: 0 }); intro(); if (!reduce) setTimeout(function () { if (!demoOn && performance.now() - userAt > 7000) demo(); }, 1200); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') reset(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { size(); }, 150); });
  size(); draw(frame); requestAnimationFrame(tick); reset();
})();
