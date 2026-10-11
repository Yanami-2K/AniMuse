/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Hop Loader — async 时间线串起每一跳：下蹲 → 起跳拉长 → 抛物线 → 落地压扁回弹；格子被踩时下沉 + 从底部灌满颜色
(function () {
  var css = getComputedStyle(document.documentElement);
  var v = function (n) { return css.getPropertyValue(n).trim(); };
  var HOP = parseFloat(v('--hop')), SQ = parseFloat(v('--squash'));
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), hero = $('hero'), body = $('body'), shadow = $('shadow'), pct = $('pct'), msg = $('msg'), bits = $('bits'), sweat = $('sweat');
  var eyes = [$('el'), $('er')], tiles = [].slice.call(document.querySelectorAll('.tile'));
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var run = 0, x = 0, shown = 0;
  var rem = function () { return parseFloat(getComputedStyle(document.documentElement).fontSize); };
  var H = function () { return parseFloat(v('--height')) * rem(); };
  var X = function (i) { return i < 0 ? 0 : tiles[i].offsetLeft; };
  var wait = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function A(el, k, o) { return el.animate(k, Object.assign({ fill: 'forwards' }, o)); }
  var at = function (x, y, r) { return 'translate(' + x + 'px,' + (y || 0) + 'px)' + (r ? ' rotate(' + r + 'deg)' : ''); };

  async function hop(to, id, o) {
    o = o || {}; var x1 = X(to), h = H() * (o.h || 1), d = HOP * (o.t || 1), sp = o.spin || 0;
    // 1. 下蹲蓄力
    A(body, [{ transform: 'none' }, { transform: 'scale(1.16,.82)' }], { duration: 110, easing: 'cubic-bezier(.3,0,.5,1)' });
    await wait(110, id);
    // 2. 起跳：身体拉长；位置走两段缓动（上升减速、下落加速），近似抛物线
    var xm = (x + x1) / 2;
    A(hero, [{ transform: at(x, 0), easing: 'cubic-bezier(.25,.55,.5,1)' }, { transform: at(xm, -h, sp / 2), easing: 'cubic-bezier(.5,0,.75,.45)' }, { transform: at(x1, 0, sp) }], { duration: d });
    A(body, [{ transform: 'scale(1.16,.82)' }, { transform: 'scale(.86,1.16)', offset: .14 }, { transform: 'scale(1,1)', offset: .5 }, { transform: 'scale(.92,1.1)', offset: .9 }, { transform: 'scale(.92,1.1)' }], { duration: d });
    A(shadow, [{ transform: at(x, 0) + ' scale(1)', opacity: 1, easing: 'cubic-bezier(.25,.55,.5,1)' }, { transform: at(xm, 0) + ' scale(.55)', opacity: .45, easing: 'cubic-bezier(.5,0,.75,.45)' }, { transform: at(x1, 0) + ' scale(1)', opacity: 1 }], { duration: d });
    await wait(d, id); x = x1;
    if (sp) hero.animate([{ transform: at(x1, 0, sp) }, { transform: at(x1, 0) }], { duration: 1, fill: 'forwards' });
    // 3. 落地：压扁 → 拉高 → 小回弹
    A(body, [{ transform: 'scale(1.26,' + SQ + ')' }, { transform: 'scale(.93,1.08)', offset: .4 }, { transform: 'scale(1.03,.98)', offset: .72 }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
    if (to >= 0 && !o.noLight) light(to);
  }
  function light(i) {
    var t = tiles[i];
    A(t, [{ transform: 'translateY(0)' }, { transform: 'translateY(.3rem)', offset: .25 }, { transform: 'translateY(-.08rem)', offset: .65 }, { transform: 'none' }], { duration: 380, easing: 'ease-out', fill: 'none' });
    t.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1.1)', offset: .7 }, { transform: 'scaleY(1)' }], { duration: 300, easing: 'ease-out', pseudoElement: '::after', fill: 'forwards' });
    burst(t.offsetLeft + t.offsetWidth / 2, t.offsetTop, getComputedStyle(t).getPropertyValue('--c'), 4, 1);
    count(Math.round((i + 1) / tiles.length * 100));
  }
  function burst(cx, cy, c, n, k, sz) {
    sz = sz || .6;
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i'), a = Math.PI * (1.1 + .8 * i / (n - 1)) + (Math.random() - .5) * .3, r = rem() * (1.6 + Math.random() * .8) * k;
      b.style.cssText = 'left:' + (cx - sz / 2 * rem()) + 'px;top:' + (cy - sz / 2 * rem()) + 'px;width:' + sz + 'rem;height:' + sz + 'rem;--c:' + c + ';border-radius:' + (i % 2 ? '50%' : '.16rem');
      bits.appendChild(b);
      var dx = Math.cos(a) * r, dy = Math.sin(a) * r;
      b.animate([{ transform: 'translate(0,0) scale(0) rotate(0)', opacity: 1 }, { transform: 'translate(' + dx * .7 + 'px,' + dy * .9 + 'px) scale(1) rotate(90deg)', opacity: 1, offset: .5 }, { transform: 'translate(' + dx + 'px,' + (dy * .6 + rem()) + 'px) scale(.3) rotate(160deg)', opacity: 0 }],
        { duration: sz > .7 ? 900 : 620, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = function () { this.effect.target.remove(); };
    }
  }
  function count(to) {
    var from = shown, t0 = performance.now(), dur = 260; stage.setAttribute('aria-valuenow', to);
    (function f(t) { var p = Math.min(1, (t - t0) / dur); shown = Math.round(from + (to - from) * p); pct.textContent = shown; if (p < 1) requestAnimationFrame(f); })(t0);
    pct.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18) rotate(-4deg)', offset: .35 }, { transform: 'scale(.97)', offset: .7 }, { transform: 'none' }], { duration: 360, easing: 'ease-out' });
  }
  function look(dir, d) { // 卡住时方块左右歪一下（黑白版没有脸，用姿态代替“张望”）
    A(body, [{ transform: getComputedStyle(body).transform }, { transform: 'rotate(' + dir * 7 + 'deg) scale(' + (dir ? '1.04,.94' : '1,1') + ')' }], { duration: d || 120, easing: 'ease-out' }); }

  async function play() {
    var id = ++run; document.getAnimations().forEach(function (a) { a.cancel(); }); bits.innerHTML = '';
    tiles.forEach(function (t) { t.classList.remove('lit'); }); stage.classList.remove('happy'); msg.textContent = 'LOADING'; msg.className = 'msg';
    x = 0; shown = 0; pct.textContent = '0'; stage.setAttribute('aria-valuenow', 0);
    if (reduce) { // 减少动态：直接停在“加载完成”的画面
      x = X(4); hero.style.transform = at(x, 0); shadow.style.transform = at(x, 0); tiles.forEach(function (t) { t.classList.add('lit'); });
      pct.textContent = '100'; msg.textContent = 'DONE!'; msg.className = 'msg done'; stage.classList.add('happy'); return;
    }
    hero.style.transform = shadow.style.transform = '';
    await wait(500, id);
    await hop(0, id); await wait(330, id);
    await hop(1, id); await wait(260, id);
    await hop(2, id); await wait(420, id);
    // 卡住了：左看看、右看看，冒一滴汗——像网络突然慢了
    look(-1); await wait(380, id); look(1, 160); await wait(420, id); look(-1, 160); await wait(200, id);
    A(sweat, [{ opacity: 0, transform: 'translateY(-.3rem) scale(.4)' }, { opacity: 1, transform: 'none', offset: .3 }, { opacity: 1, transform: 'translateY(.5rem)', offset: .8 }, { opacity: 0, transform: 'translateY(.8rem) scale(.8)' }], { duration: 900, easing: 'ease-in' });
    await wait(500, id); look(0, 140); await wait(260, id);
    await hop(3, id, { t: .9 }); await wait(240, id);
    // 最后一格：跳得更高，空中翻个跟头
    await hop(4, id, { h: 1.55, t: 1.45, spin: 360 });
    stage.classList.add('happy'); msg.textContent = 'DONE!'; msg.className = 'msg done';
    A(msg, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .6 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'ease-out', fill: 'none' });
    var cx = X(4) + tiles[4].offsetWidth / 2;
    ['#ffd45c', '#ff9cb4', '#8fd3ff', '#b9a6ff'].forEach(function (c, i) { setTimeout(function () { if (id === run) burst(cx, tiles[4].offsetTop - rem() * 2.2, c, 4, 2.6, .95); }, i * 60); });
    await wait(1500, id);
    // 复位：颜色从右往左退掉，方块一大步跳回起点
    stage.classList.remove('happy'); msg.textContent = 'LOADING'; msg.className = 'msg';
    tiles.slice().reverse().forEach(function (t, i) { t.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 240, delay: i * 60, easing: 'ease-in', pseudoElement: '::after', fill: 'forwards' }); });
    count(0);
    await hop(-1, id, { h: 1.4, t: 1.5 });
    await wait(600, id); play();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(play, 200); });
  play();
})();
