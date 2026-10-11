/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Dialog Entrances（黑白线稿）— 每种方式 = 一对 WAAPI 关键帧（进场 / 退场）。果冻用弹簧采样，scaleX/scaleY 差半拍 = 抖；Dock 用 clip-path 梯形 + 缩放模拟“吸进去”
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var IN = num('--in'), OUT = num('--out'), HZ = num('--wobble'), ZETA = num('--bounce');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var dlg = $('dlg'), inner = dlg.querySelector('.in'), tail = $('tail'), scrim = $('scrim'), d1 = $('d1'), d2 = $('d2');
  var app = $('app'), picker = $('picker'), pill = $('pill'), trigger = $('trigger'), dockCat = $('dockCat'), badge = $('badge'), toast = $('toast');
  var yes = $('yes'), no = $('no'), finger = $('finger'), stage = $('stage');
  var chips = [].slice.call(picker.querySelectorAll('button'));
  var KEYS = chips.map(function (b) { return b.dataset.k; });
  var cur = 'jelly', isOpen = false, busy = false, userOpened = false, lastFocus = null;
  var demoOn = true, demoId = 0, idleT = 0;
  var SAVED = LANG === 'en' ? 'Saved ✓' : '已保存 ✓', TOSSED = LANG === 'en' ? 'Changes discarded' : '已丢弃修改';

  var A = function (el, kf, o) { var a = el.animate(kf, o); return a.finished.catch(function () {}); };
  var EASE = 'cubic-bezier(.2,.8,.2,1)', EIN = 'cubic-bezier(.55,0,.9,.45)';
  function rel(target) { // 目标元素中心相对对话框中心的位移（px）
    var a = dlg.getBoundingClientRect(), b = target.getBoundingClientRect(), s = stageScale();
    return { x: (b.left + b.width / 2 - a.left - a.width / 2) / s, y: (b.top + b.height / 2 - a.top - a.height / 2) / s };
  }
  function stageScale() { return 1; }
  function spring(from, n, dur) { // 阻尼弹簧，从 from 回到 1
    var w = 2 * Math.PI * HZ, wd = w * Math.sqrt(1 - ZETA * ZETA), out = [];
    for (var i = 0; i <= n; i++) { var t = i / n * dur / 1000; out.push(1 + (from - 1) * Math.exp(-ZETA * w * t) * (Math.cos(wd * t) + ZETA * w / wd * Math.sin(wd * t))); }
    out[n] = 1; return out;
  }
  function catPeek() {} // 黑白版去掉了猫，保留调用点方便以后加装饰
  function fadeIn(delay) { return [].map.call(inner.children, function (c, i) { return A(c, [{ opacity: 0, transform: 'translateY(.35rem)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: delay + i * 55, easing: EASE, fill: 'backwards' }); }); }

  // —— 六种方式 ——
  var P = {
    jelly: {
      enter: function () {
        var d = IN * 1.3, s = spring(.3, 40, d), lag = 3, kf = s.map(function (v, i) { var u = s[Math.max(0, i - lag)]; return { transform: 'scale(' + (1 + (v - 1) * 1.15).toFixed(4) + ',' + (1 + (u - 1) * .85).toFixed(4) + ')' }; });
        kf[0].opacity = 0; kf[3].opacity = 1; kf[kf.length - 1].transform = 'none';
        catPeek(d * .3); fadeIn(d * .18);
        return A(dlg, kf, { duration: d, easing: 'linear' });
      },
      exit: function () { return A(dlg, [{ transform: 'none' }, { transform: 'scale(1.08,.9)', offset: .3 }, { transform: 'scale(.25)', opacity: 0 }], { duration: OUT, easing: EIN }); }
    },
    unfold: {
      enter: function () {
        var d = IN * 1.15; catPeek(d * .62); fadeIn(d * .55);
        return A(dlg, [{ transform: 'scale(0,.025)', opacity: 1 }, { transform: 'scale(1,.025)', offset: .34, easing: 'cubic-bezier(.3,1.5,.5,1)' }, { transform: 'scale(1,1.05)', offset: .74 }, { transform: 'scale(1,.985)', offset: .87 }, { transform: 'none' }], { duration: d, easing: 'cubic-bezier(.2,.8,.2,1)' });
      },
      exit: function () {
        [].forEach.call(inner.children, function (c) { A(c, [{ opacity: 1 }, { opacity: 0 }], { duration: OUT * .4, fill: 'forwards' }); });
        return A(dlg, [{ transform: 'none' }, { transform: 'scale(1,.025)', offset: .55, easing: EIN }, { transform: 'scale(0,.025)', opacity: .6 }], { duration: OUT * 1.25, easing: EIN });
      }
    },
    bubble: {
      enter: function () {
        var r = rel(trigger), d = IN * .95; fadeIn(d * .5); catPeek(d * .55);
        A(tail, [{ transform: 'rotate(45deg) scale(0)' }, { transform: 'rotate(45deg) scale(1.15)', offset: .7 }, { transform: 'rotate(45deg) scale(1)' }], { duration: 300, delay: d * .55, easing: EASE, fill: 'both' });
        return A(dlg, [{ transform: 'translate(' + r.x + 'px,' + r.y + 'px) scale(.06)', borderRadius: '50%', opacity: 0 }, { opacity: 1, offset: .15 }, { transform: 'translate(' + r.x * .06 + 'px,' + r.y * .06 + 'px) scale(1.05)', borderRadius: '1.6rem', offset: .62 }, { transform: 'none', borderRadius: '1rem' }], { duration: d, easing: EASE });
      },
      exit: function () {
        var r = rel(trigger);
        A(tail, [{ transform: 'rotate(45deg) scale(1)' }, { transform: 'rotate(45deg) scale(0)' }], { duration: 120, easing: EIN, fill: 'forwards' });
        return A(dlg, [{ transform: 'none', borderRadius: '1rem' }, { transform: 'scale(1.04)', offset: .2 }, { transform: 'translate(' + r.x + 'px,' + r.y + 'px) scale(.06)', borderRadius: '50%', opacity: 0 }], { duration: OUT * 1.15, delay: 60, easing: EIN });
      }
    },
    shuffle: {
      enter: function () {
        var o = { duration: IN * .8, easing: 'cubic-bezier(.2,.9,.3,1.12)', fill: 'forwards' };
        A(d1, [{ transform: 'translate(-30px,190px) rotate(-26deg)', opacity: 1 }, { transform: 'translate(-12px,5px) rotate(-7deg)', opacity: 1 }], o);
        A(d2, [{ transform: 'translate(40px,200px) rotate(22deg)', opacity: 1 }, { transform: 'translate(10px,3px) rotate(5deg)', opacity: 1 }], Object.assign({}, o, { delay: 80 }));
        catPeek(IN * .85); fadeIn(IN * .5);
        return A(dlg, [{ transform: 'translate(70px,240px) rotate(20deg)', opacity: 1 }, { transform: 'translate(0,-8px) rotate(-2.5deg)', offset: .68 }, { transform: 'rotate(.6deg)', offset: .85 }, { transform: 'none' }], { duration: IN * 1.05, delay: 170, easing: EASE, fill: 'backwards' });
      },
      exit: function () {
        A(d1, [{ transform: 'translate(-12px,5px) rotate(-7deg)', opacity: 1 }, { transform: 'translate(-40px,200px) rotate(-20deg)', opacity: 0 }], { duration: OUT * 1.2, delay: 90, easing: EIN, fill: 'forwards' });
        A(d2, [{ transform: 'translate(10px,3px) rotate(5deg)', opacity: 1 }, { transform: 'translate(50px,210px) rotate(18deg)', opacity: 0 }], { duration: OUT * 1.2, delay: 150, easing: EIN, fill: 'forwards' });
        return A(dlg, [{ transform: 'none' }, { transform: 'translate(-10px,4px) rotate(-3deg)', offset: .2 }, { transform: 'translate(300px,-70px) rotate(30deg)', opacity: 0 }], { duration: OUT * 1.15, easing: 'cubic-bezier(.5,0,.75,0)' }).then(function () { return new Promise(function (r) { setTimeout(r, 160); }); });
      }
    },
    drop: {
      enter: function () {
        var d = IN * 1.3;
        dlg.style.transformOrigin = '50% 100%';
        setTimeout(function () { if (!reduce) A(app, [{ transform: 'none' }, { transform: 'translateY(.18rem)' }, { transform: 'translateY(-.06rem)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' }); }, d * .4);
        fadeIn(d * .3);
        return A(dlg, [{ transform: 'translateY(-330px) rotate(-5deg)', easing: 'cubic-bezier(.55,0,1,.45)' }, { transform: 'translateY(0) scale(1.08,.86)', offset: .4, easing: 'cubic-bezier(.2,.8,.4,1)' }, { transform: 'translateY(-20px) scale(.97,1.04)', offset: .6, easing: 'cubic-bezier(.6,0,.9,.5)' }, { transform: 'translateY(0) scale(1.03,.97)', offset: .78 }, { transform: 'none' }], { duration: d, easing: 'linear' });
      },
      exit: function () {
        dlg.style.transformOrigin = '50% 100%';
        return A(dlg, [{ transform: 'none' }, { transform: 'translateY(-18px) scale(.98,1.03)', offset: .28, easing: 'cubic-bezier(.55,0,1,.45)' }, { transform: 'translateY(360px) rotate(12deg)' }], { duration: OUT * 1.6, easing: 'cubic-bezier(.3,.6,.4,1)' });
      }
    },
    dock: {
      enter: function () {
        var r = rel(dockCat), d = IN * 1.05;
        A(dockCat, [{ transform: 'none' }, { transform: 'translateY(-.7rem)', offset: .3 }, { transform: 'none', offset: .55 }, { transform: 'translateY(-.35rem)', offset: .75 }, { transform: 'none' }], { duration: 520, easing: 'ease-in-out' });
        A(badge, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: 200, fill: 'forwards' });
        fadeIn(d * .6); catPeek(d * .7);
        var full = 'polygon(-12% -45%,112% -45%,112% 112%,-12% 112%)';
        return A(dlg, [
          { transform: 'translate(' + r.x + 'px,' + r.y + 'px) scale(.08,.06)', clipPath: 'polygon(25% -45%,75% -45%,56% 112%,44% 112%)', opacity: .5 },
          { transform: 'translate(' + r.x * .42 + 'px,' + r.y * .55 + 'px) scale(.55,.5)', clipPath: 'polygon(4% -45%,96% -45%,72% 112%,28% 112%)', opacity: 1, offset: .42 },
          { transform: 'translateY(-6px) scale(1.02)', clipPath: full, offset: .78 },
          { transform: 'none', clipPath: full }
        ], { duration: d, delay: 200, easing: 'cubic-bezier(.3,.7,.25,1)', fill: 'backwards' });
      },
      exit: function () {
        var r = rel(dockCat), full = 'polygon(-12% -45%,112% -45%,112% 112%,-12% 112%)';
        return A(dlg, [
          { transform: 'none', clipPath: full },
          { transform: 'translate(' + r.x * .3 + 'px,' + r.y * .25 + 'px) scale(.75,.62)', clipPath: 'polygon(-12% -45%,112% -45%,80% 112%,20% 112%)', offset: .4 },
          { transform: 'translate(' + r.x + 'px,' + r.y + 'px) scale(.08,.06)', clipPath: 'polygon(25% -45%,75% -45%,56% 112%,44% 112%)', opacity: .4 }
        ], { duration: OUT * 1.6, easing: 'cubic-bezier(.6,0,.85,.5)' }).then(function () {
          A(dockCat, [{ transform: 'scale(1.18,.82)' }, { transform: 'scale(.94,1.06)', offset: .5 }, { transform: 'none' }], { duration: 360, easing: EASE });
          A(badge, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.25)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, easing: EASE, fill: 'forwards' });
        });
      }
    }
  };
  var FADE = { enter: function () { return A(dlg, [{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); }, exit: function () { return A(dlg, [{ opacity: 1 }, { opacity: 0 }], { duration: 140 }); } };

  // —— 打开 / 关闭 ——
  function open(k, user) {
    if (isOpen || busy) return Promise.resolve();
    cur = k || cur; busy = isOpen = true; userOpened = !!user; lastFocus = user ? document.activeElement : null;
    [dlg, tail, d1, d2, inner].concat([].slice.call(inner.children)).forEach(function (e) { e.getAnimations().forEach(function (a) { a.cancel(); }); });
    dlg.style.transformOrigin = ''; tail.style.display = cur === 'bubble' ? '' : 'none';
    dlg.hidden = false; dlg.dataset.face = 'n'; app.inert = true; picker.inert = true; trigger.setAttribute('aria-expanded', 'true');
    scrim.classList.add('on'); A(scrim, [{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 160 : 260, fill: 'forwards' });
    return (reduce ? FADE : P[cur]).enter().then(function () {
      busy = false;
      if (user && document.hasFocus()) yes.focus(); // 自动演示时绝不抢焦点
      blink();
    });
  }
  function close(how) {
    if (!isOpen || busy) return Promise.resolve();
    busy = true; clearTimeout(blink.t);
    dlg.dataset.face = how === 'yes' ? 'h' : 'x';
    A(scrim, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, delay: reduce ? 0 : OUT * .4, fill: 'forwards' });
    return new Promise(function (r) { setTimeout(r, how === 'yes' && !reduce ? 140 : 0); }).then(function () { return (reduce ? FADE : P[cur]).exit(); }).then(function () {
      var back = userOpened ? lastFocus : (dlg.contains(document.activeElement) ? trigger : null); // 焦点在对话框里就送回触发按钮
      dlg.hidden = true; busy = isOpen = false; scrim.classList.remove('on'); app.inert = false; picker.inert = false; trigger.setAttribute('aria-expanded', 'false');
      [d1, d2].forEach(function (e) { e.getAnimations().forEach(function (a) { a.cancel(); }); });
      if (how === 'yes' || how === 'no') showToast(how === 'yes' ? SAVED : TOSSED);
      if (back && document.hasFocus()) back.focus();
    });
  }
  function showToast(t) {
    toast.textContent = t;
    A(toast, reduce ? [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [{ opacity: 0, transform: 'translate(-50%,.6rem) scale(.8)' }, { opacity: 1, transform: 'translate(-50%,0) scale(1)', offset: .14 }, { opacity: 1, transform: 'translate(-50%,0)', offset: .86 }, { opacity: 0, transform: 'translate(-50%,.3rem)' }], { duration: 1500, easing: EASE });
  }
  function blink() { clearTimeout(blink.t); blink.t = setTimeout(function () { if (!isOpen || busy) return; dlg.dataset.face = 'h'; setTimeout(function () { if (isOpen && !busy) dlg.dataset.face = 'n'; blink(); }, 160); }, 1400 + Math.random() * 1600); }

  // —— 样式选择：滑动的胶囊高亮 + 方向键漫游 ——
  function select(k) {
    cur = k;
    chips.forEach(function (b) { var on = b.dataset.k === k; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    var b = chips[KEYS.indexOf(k)];
    pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  chips.forEach(function (b, i) {
    b.addEventListener('click', function (e) { if (e.isTrusted) takeover(); select(b.dataset.k); open(b.dataset.k, e.isTrusted); });
    b.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
      e.preventDefault(); takeover(); var n = chips[(i + d + chips.length) % chips.length]; select(n.dataset.k); n.focus();
    });
  });
  trigger.addEventListener('click', function (e) { if (e.isTrusted) takeover(); open(cur, e.isTrusted); });
  yes.addEventListener('click', function (e) { if (e.isTrusted) takeover(); close('yes'); });
  no.addEventListener('click', function (e) { if (e.isTrusted) takeover(); close('no'); });
  scrim.addEventListener('click', function () { takeover(); close('scrim'); });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); takeover(); close('esc'); }
    if (e.key === 'Tab') { // 焦点圈在对话框里
      var f = [no, yes], i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + 2) % 2].focus();
    }
  });
  stage.addEventListener('pointermove', function (e) { if (e.isTrusted && (e.movementX || e.movementY)) takeover(); });
  function takeover() {
    if (demoOn) { demoOn = false; demoId++; finger.classList.remove('on', 'down'); [].forEach.call(document.querySelectorAll('.press'), function (b) { b.classList.remove('press'); }); }
    clearTimeout(idleT); idleT = setTimeout(function resume() { if (reduce) return; if (isOpen || busy) { if (!userOpened) close('scrim'); idleT = setTimeout(resume, 1500); return; } startDemo(); }, 9000);
  }

  // —— 自动演示：手指点一个样式 → 打开 → 停一下 → 点“保存/不保存” → 下一个 ——
  var fing = { x: 0, y: 0 };
  function moveF(el, d, dy) {
    var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2 + (dy || 0), x0 = fing.x, y0 = fing.y, t0 = performance.now(), id = demoId;
    return new Promise(function (res) { (function f(now) { if (id !== demoId) return; /* 被接管后链条停在这里 */ var t = Math.min(1, (now - t0) / d), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; fing.x = x0 + (x - x0) * e; fing.y = y0 + (y - y0) * e; finger.style.transform = 'translate(' + fing.x + 'px,' + fing.y + 'px)'; if (t < 1) requestAnimationFrame(f); else res(); })(t0); });
  }
  function startDemo() {
    demoOn = true; var id = ++demoId, k = 0;
    var dw = function (t) { return new Promise(function (r) { setTimeout(function () { if (id === demoId) r(); }, t); }); };
    var tap = function (el) { finger.classList.add('down'); el.classList.add('press'); return dw(140).then(function () { finger.classList.remove('down'); el.classList.remove('press'); }); };
    var r0 = picker.getBoundingClientRect(); fing.x = r0.left + r0.width / 2; fing.y = innerHeight + 40;
    (function loop() {
      if (id !== demoId) return;
      var key = KEYS[k % KEYS.length], chip = chips[k % KEYS.length], btn = k % 3 === 2 ? no : yes; k++;
      dw(380).then(function () { if (!reduce) finger.classList.add('on'); return moveF(chip, 520); })
        .then(function () { return tap(chip); })
        .then(function () { select(key); var o = open(key, false); moveF(chip, 1, 0); return o; })
        .then(function () { return moveF(btn, 640, 0); })
        .then(function () { return dw(900); })
        .then(function () { return tap(btn); })
        .then(function () { return close(btn === yes ? 'yes' : 'no'); })
        .then(function () { return dw(500); })
        .then(loop);
    })();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay' && !isOpen && !busy && !reduce) { select('jelly'); startDemo(); } });
  select('jelly');
  addEventListener('resize', function () { select(cur); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { select(cur); });
  if (reduce) open('jelly', false); else startDemo(); // 减弱动效：不自动轮播，静态展示打开的对话框
})();
