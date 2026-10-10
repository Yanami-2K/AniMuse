/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); }
// Kitty Stamp — 弹簧跟随（rAF）+ WAAPI 做“蹲 → 蹦 → 砸 → 压扁 → 弹回”，落地瞬间生成印、烟和星星
(function () {
  var css = getComputedStyle(document.documentElement), num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var REM = parseFloat(getComputedStyle(document.documentElement).fontSize);
  var K = num('--stiff'), C = num('--damp'), HOP = num('--hop') * REM, SQ = num('--squash'), LIFT = HOP * .9;
  var $ = function (id) { return document.getElementById(id); };
  var stamp = $('stamp'), tilt = $('tilt'), hop = $('hop'), bob = $('bob'), eyes = $('eyes'), ground = $('ground'), marksEl = $('marks'), doc = $('doc'), btn = $('btn'), btnTxt = $('btnTxt');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WORDS = LANG === 'en' ? { paw: 'OK!', heart: 'YAY!', star: 'LGTM' } : { paw: '通过', heart: '好耶', star: '赞！' };
  var APPROVED = LANG === 'en' ? 'Approved!' : '已批准';
  var KINDS = ['paw', 'heart', 'star'], kindI = 0;

  // —— 位置：目标点 + 弹簧 ——
  var x = innerWidth / 2, y = innerHeight / 2, vx = 0, vy = 0, tx = x, ty = y, busy = false, queued = false, t0 = performance.now(), last = t0;
  function frame(now) {
    var dt = Math.min(.032, (now - last) / 1000); last = now;
    if (reduce) { x = tx; y = ty; vx = vy = 0; }
    else { var ax = K * (tx - x) - C * vx, ay = K * (ty - y) - C * vy; vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt; }
    var speed = Math.min(1, Math.hypot(vx, vy) / 900);
    var lean = Math.max(-16, Math.min(16, vx * .022)) * (busy ? .15 : 1);                 // 往哪边跑就往哪边歪
    var sway = reduce || busy ? 0 : Math.sin((now - t0) / 1000 * 2.3) * 2.4 * (1 - speed);  // 闲着时左右轻轻晃
    stamp.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
    tilt.style.transform = 'rotate(' + (lean + sway).toFixed(2) + 'deg)';
    requestAnimationFrame(frame);
  }

  // —— 待机：呼吸 + 眨眼 ——
  var breathe = reduce ? null : bob.animate([{ transform: 'none' }, { transform: 'translateY(-.12rem) scale(1.035,.97)' }, { transform: 'none' }], { duration: 1900, iterations: Infinity, easing: 'ease-in-out' });
  (function blink() {
    setTimeout(function () {
      if (!reduce && !stamp.classList.contains('press')) eyes.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.1)', offset: .45 }, { transform: 'scaleY(1)' }], { duration: 150, easing: 'ease-in-out' });
      blink();
    }, 1600 + Math.random() * 2600);
  })();

  // —— 盖章 ——
  var wait = function (t) { return new Promise(function (r) { setTimeout(r, t); }); };
  async function slam(kind) {
    if (busy) { queued = true; return; }
    busy = true; kind = kind || KINDS[kindI++ % KINDS.length];
    if (reduce) { impact(kind, x, y); await wait(200); busy = false; return; }
    if (breathe) breathe.pause();
    var Y = function (v, sx, sy) { return 'translateY(' + v + 'px) scale(' + sx + ',' + sy + ')'; };
    // 蹲一下蓄力 → 往上蹦（拉长）→ 顶点停一拍 → 加速砸下去（越砸越细长）
    hop.animate([
      { transform: Y(0, 1, 1), easing: 'cubic-bezier(.3,0,.4,1)' },
      { transform: Y(.15 * REM, 1.14, .84), offset: .22, easing: 'cubic-bezier(.2,.7,.3,1)' },
      { transform: Y(-HOP, .92, 1.1), offset: .6, easing: 'ease-out' },
      { transform: Y(-HOP * 1.08, .97, 1.04), offset: .72, easing: 'cubic-bezier(.6,0,1,.6)' },
      { transform: Y(LIFT, .86, 1.18) }
    ], { duration: 380, fill: 'forwards' });
    ground.animate([{ transform: 'scale(1)', opacity: .13 }, { transform: 'scale(1.08)', opacity: .15, offset: .22 }, { transform: 'scale(.62)', opacity: .07, offset: .7 }, { transform: 'scale(1.05)', opacity: .2 }], { duration: 380, fill: 'forwards' });
    await wait(380);
    impact(kind, x, y);
    // 落地：整只压扁、眼睛挤成 > <、嘴变 o；压住一拍再弹回去，回弹带过冲
    stamp.classList.add('press');
    hop.animate([
      { transform: Y(LIFT, 1.32, SQ) },
      { transform: Y(LIFT, 1.38, SQ - .05), offset: .12 },
      { transform: Y(LIFT, 1.3, SQ + .02), offset: .32, easing: 'cubic-bezier(.3,0,.2,1)' },
      { transform: Y(LIFT * .55, .9, 1.14), offset: .5, easing: 'ease-out' },
      { transform: Y(-.22 * REM, 1.06, .95), offset: .72, easing: 'ease-in-out' },
      { transform: Y(0, .98, 1.02), offset: .88 },
      { transform: Y(0, 1, 1) }
    ], { duration: 560, fill: 'forwards' });
    ground.animate([{ transform: 'scale(1.2)', opacity: .22 }, { transform: 'scale(1.2)', opacity: .22, offset: .32 }, { transform: 'scale(.9)', opacity: .1, offset: .6 }, { transform: 'scale(1)', opacity: .13 }], { duration: 560, fill: 'forwards' });
    await wait(200); stamp.classList.remove('press');
    await wait(360);
    if (breathe) breathe.play();
    busy = false;
    if (queued) { queued = false; slam(); }
  }

  function markSVG(kind) {
    var icon = kind === 'paw'
      ? '<ellipse cx="34" cy="38.5" rx="11" ry="8.6"/><circle cx="21.6" cy="27" r="4.4"/><circle cx="29" cy="19.6" r="4.6"/><circle cx="39" cy="19.6" r="4.6"/><circle cx="46.4" cy="27" r="4.4"/>'
      : kind === 'heart' ? '<path d="M34 46 C22 38 17.5 31 21 24.6 C24.5 19 31 19.8 34 25 C37 19.8 43.5 19 47 24.6 C50.5 31 46 38 34 46 Z"/>'
      : '<path d="M34 16 L38.2 26.4 L49.2 27 L40.7 34 L43.6 44.8 L34 38.7 L24.4 44.8 L27.3 34 L18.8 27 L29.8 26.4 Z" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round"/>';
    var w = WORDS[kind], fs = w.length > 3 ? 21 : 25;
    return '<svg viewBox="0 0 140 64"><rect x="4" y="4" width="132" height="56" rx="18" fill="none" stroke="var(--ink)" stroke-width="5"/>' +
      '<path d="M62 14 V50" stroke="var(--ink)" stroke-width="3" stroke-dasharray="3 5" stroke-linecap="round"/>' +
      '<g fill="var(--ink)">' + icon + '</g><text x="100" y="' + (32 + fs * .36) + '" text-anchor="middle" font-size="' + fs + '" font-weight="900" fill="var(--ink)" letter-spacing="1">' + w + '</text></svg>';
  }

  function impact(kind, px, py) {
    var bb = btn.getBoundingClientRect(), onBtn = px > bb.left - REM && px < bb.right + REM && py > bb.top - REM && py < bb.bottom + REM;   // 盖在按钮上 = 批准（按钮上不留印，免得糊住字）
    if (!onBtn) {
    var m = document.createElement('div'); m.className = 'mark'; m.innerHTML = markSVG(kind);
    var rot = (Math.random() * 18 - 11).toFixed(1);
    m.style.transform = 'translate(' + px + 'px,' + py + 'px) rotate(' + rot + 'deg)';
    marksEl.appendChild(m);
    var base = m.style.transform;
    m.animate(reduce ? [{ opacity: 0 }, { opacity: .92 }] : [{ opacity: 0, transform: base + ' scale(1.14,.9)' }, { opacity: .92, transform: base + ' scale(1)' }], { duration: reduce ? 200 : 90, fill: 'forwards', easing: 'ease-out' });
    var all = marksEl.children; if (all.length > 5) { var old = all[0]; old.animate([{ opacity: .92 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = function () { old.remove(); }; }
    }
    var r = doc.getBoundingClientRect(), onDoc = px > r.left && px < r.right && py > r.top - REM && py < r.bottom + REM;
    if (onBtn && !btn.classList.contains('done')) {
      btn.classList.add('done'); btnTxt.textContent = APPROVED;
      if (!reduce) btnTxt.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1.18)', offset: .55 }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
    }
    if (reduce) return;
    if (onBtn) btn.animate([{ transform: 'none' }, { transform: 'translateY(.12rem) scale(1.14,.78)', offset: .25 }, { transform: 'scale(.95,1.08)', offset: .6 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
    if (onDoc) doc.animate([{ transform: 'none' }, { transform: 'scale(.99,.982) translateY(.1rem)', offset: .3 }, { transform: 'scale(1.004)', offset: .7 }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
    // 两侧冒烟：小白团往外滚、变小消失
    [-1.25, -1, 1, 1.25].forEach(function (d, i) {
      var p = fx('puff'), big = Math.abs(d) === 1, sx = px + d * 2.9 * REM, sy = py - (big ? .35 : .15) * REM, s = big ? 1 : .62, dir = d > 0 ? 1 : -1;
      p.animate([{ transform: 'translate(' + sx + 'px,' + sy + 'px) scale(' + .35 * s + ')' },
                 { transform: 'translate(' + (sx + dir * 1 * REM) + 'px,' + (sy - .45 * REM) + 'px) scale(' + s + ')', offset: .4 },
                 { transform: 'translate(' + (sx + dir * 1.5 * REM) + 'px,' + (sy - .75 * REM) + 'px) scale(0)' }], { duration: big ? 480 : 420, delay: big ? 0 : 30, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' }).onfinish = function () { p.remove(); };
    });
    // 头顶蹦三颗小星星
    [-1, 0, 1].forEach(function (d, i) {
      var s = fx('star'); s.innerHTML = '<svg viewBox="-12 -12 24 24" width="100%" height="100%"><path d="M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10 Z"/></svg>';
      var sx = px + d * 3.3 * REM, sy = py - (d ? 3 : 4.9) * REM, ex = sx + d * .9 * REM, ey = sy - (d ? 1 : .8) * REM;
      s.animate([{ transform: 'translate(' + sx + 'px,' + sy + 'px) scale(0) rotate(0deg)' },
                 { transform: 'translate(' + ex + 'px,' + ey + 'px) scale(1.1) rotate(' + (d * 40 + 20) + 'deg)', offset: .45 },
                 { transform: 'translate(' + ex + 'px,' + (ey - .2 * REM) + 'px) scale(0) rotate(' + (d * 70 + 40) + 'deg)' }], { duration: 560, delay: i * 25, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' }).onfinish = function () { s.remove(); };
    });
  }
  function fx(cls) { var e = document.createElement('i'); e.className = 'fx ' + cls; document.body.appendChild(e); return e; }

  function clearMarks() { [].slice.call(marksEl.children).forEach(function (m) { m.animate([{ opacity: .92 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }).onfinish = function () { m.remove(); }; }); }
  function resetBtn() { btn.classList.remove('done'); btnTxt.textContent = LANG === 'en' ? 'Approve' : '批准'; }

  // —— 自动演示（卡片预览）：指针一动就交给用户，停 4.5 秒后再接着演 ——
  var run = 0, tween = 0;
  function moveTo(px, py, dur) {
    return new Promise(function (res) {
      var id = ++tween, sx = tx, sy = ty, s = performance.now();
      (function f(n) { if (id !== tween) return res(); var k = Math.min(1, (n - s) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; tx = sx + (px - sx) * e; ty = sy + (py - sy) * e; k < 1 ? requestAnimationFrame(f) : res(); })(s);
    });
  }
  async function demo() {
    var id = ++run, ok = function () { return id === run; };
    resetBtn(); kindI = 0;
    var r = doc.getBoundingClientRect(), b = btn.getBoundingClientRect();
    if (reduce) {
      tx = r.left + r.width * .5; ty = r.top + .3 * REM;
      x = r.left + r.width * .3; y = r.top + r.height * .58; impact('paw', x, y);
      x = r.left + r.width * .64; y = r.top + r.height * .42; impact('heart', x, y);
      x = tx; y = ty; return;
    }
    await moveTo(r.left + r.width * .3, r.top + r.height * .58, 650); if (!ok()) return;
    await wait(260); if (!ok()) return; await slam('paw'); await wait(1050); if (!ok()) return;
    await moveTo(r.left + r.width * .68, r.top + r.height * .4, 620); if (!ok()) return;
    await wait(220); if (!ok()) return; await slam('heart'); await wait(1050); if (!ok()) return;
    await moveTo(b.left + b.width / 2, b.top + b.height * .6, 600); if (!ok()) return;
    await wait(240); if (!ok()) return; await slam('star'); await wait(900); if (!ok()) return;
    await moveTo(r.left + r.width * .5, r.top + .3 * REM, 900); if (!ok()) return;
    await wait(1900); if (!ok()) return;
    clearMarks(); await wait(700); if (!ok()) return;
    demo();
  }
  function start() { var r = doc.getBoundingClientRect(); x = tx = r.left + r.width * .5; y = ty = r.top + .3 * REM; vx = vy = 0; demo(); }

  var idleT = 0, user = false;
  function takeover() {
    if (!user) { user = true; run++; tween++; clearMarks(); resetBtn(); document.body.classList.add('hand'); }
    clearTimeout(idleT); idleT = setTimeout(function () { user = false; document.body.classList.remove('hand'); clearMarks(); demo(); }, 4500);
  }
  // 页面加载时浏览器可能补发一个原地不动的 pointermove，忽略
  addEventListener('pointermove', function (e) { if (!e.isTrusted || (!e.movementX && !e.movementY)) return; takeover(); tx = e.clientX; ty = e.clientY; });
  addEventListener('pointerdown', function (e) { if (!e.isTrusted || e.button > 0) return; takeover(); tx = e.clientX; ty = e.clientY; slam(); });
  // 键盘：Tab 到按钮按回车/空格，印章自己跑过去盖
  btn.addEventListener('click', function (e) { if (e.detail !== 0) return; takeover(); var b = btn.getBoundingClientRect(); moveTo(b.left + b.width / 2, b.top + b.height * .6, 500).then(function () { slam(); }); });
  document.documentElement.addEventListener('pointerleave', function () { if (!user) return; clearTimeout(idleT); idleT = setTimeout(function () { user = false; document.body.classList.remove('hand'); clearMarks(); demo(); }, 1500); });
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { user = false; clearMarks(); demo(); } });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { [].slice.call(marksEl.children).forEach(function (m) { m.remove(); }); if (!user) { run++; start(); } }, 200); });

  requestAnimationFrame(function (n) { last = n; requestAnimationFrame(frame); });
  start();
})();
