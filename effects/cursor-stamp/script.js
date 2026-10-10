/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Rubber Stamp Approve — Web Animations API 串一条 async 时间线：点按钮 → 章落下 → 压扁 + 碾 → 抬起留印
(function () {
  var css = getComputedStyle(document.documentElement);
  var ms = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var TRAVEL = ms('--travel'), DROP = ms('--drop'), SQ = ms('--squash'), ROCK = ms('--rock');
  var $ = function (id) { return document.getElementById(id); };
  var scene = $('scene'), doc = $('doc'), btn = $('btn'), mark = $('mark'), tool = $('tool'), shadow = $('shadow'), specks = $('specks'), cursor = $('cursor'), pad = $('pad'), body = document.querySelector('.t-body');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var run = 0, anims = [];
  var sleep = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function A(el, k, o) { var a = el.animate(k, Object.assign({ fill: 'forwards' }, o)); anims.push(a); return a; }
  var R = 'rotate(-8deg)';

  async function play() {
    var id = ++run; anims.forEach(function (a) { a.cancel(); }); anims = [];
    btn.className = 'btn'; btn.textContent = 'Approve';
    if (reduce) { btn.className = 'btn done'; btn.textContent = 'Approved'; mark.style.opacity = 1; cursor.style.display = 'none'; return; }
    var s = scene.getBoundingClientRect(), b = btn.getBoundingClientRect();
    var tx = b.left - s.left + b.width * .6, ty = b.top - s.top + b.height * .55, sx = s.width * .9, sy = s.height * 1.4;
    var at = function (x, y, k) { return 'translate(' + x + 'px,' + y + 'px) scale(' + (k || 1) + ')'; };
    // 1. 光标沿弧线滑到按钮，按下
    A(cursor, [{ transform: at(sx, sy), opacity: 0 }, { opacity: 1, offset: .2 }, { transform: at(tx + 40, ty + 6), offset: .6 }, { transform: at(tx, ty), opacity: 1 }], { duration: TRAVEL, easing: 'cubic-bezier(.45,0,.15,1)' });
    await sleep(TRAVEL + 120, id);
    btn.classList.add('down'); A(cursor, [{ transform: at(tx, ty) }, { transform: at(tx, ty, .82) }], { duration: 100, easing: 'ease-out' });
    await sleep(150, id);
    btn.classList.remove('down'); btn.classList.add('done'); btn.textContent = 'Approved';
    A(cursor, [{ transform: at(tx, ty, .82) }, { transform: at(tx, ty) }, { transform: at(tx + 70, ty + 90), opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.4,0,.6,1)' });
    await sleep(260, id);

    // 2. 章从画面外落下：ease-in 加速，离镜头越近越大；影子从“又大又虚”收成“又小又实”——距离感全靠它
    var T = function (y, r, k) { return 'translateY(' + y + 'rem) rotate(' + r + ') scale(' + (k || 1) + ')'; };
    A(tool, [{ opacity: 0, transform: T(-13, '-11deg', 1.14) }, { opacity: 1, offset: .25 }, { opacity: 1, transform: T(0, '-8deg') }], { duration: DROP, easing: 'cubic-bezier(.55,0,.9,.45)' });
    A(shadow, [{ opacity: 0, transform: R + ' scale(1.45)', filter: 'blur(1.3rem)' }, { opacity: .2, transform: R + ' scale(1)', filter: 'blur(.4rem)' }], { duration: DROP, easing: 'cubic-bezier(.55,0,.9,.45)' });
    await sleep(DROP, id);

    // 3. 落地：木头不会变形——只有海绵垫被压薄，章身跟着沉一点；纸被压一下，印记出现，溅出几粒印泥
    var sink = 19 * (1 - SQ), sink2 = 19 * (1 - SQ - .08); // 海绵 + 橡胶 19 个单位高（SVG 用户单位），压掉多少章身就沉多少
    A(pad, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(' + SQ + ')', offset: .4 }, { transform: 'scaleY(' + (SQ + .08) + ')' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.3,1)' });
    A(body, [{ transform: 'translateY(0)' }, { transform: 'translateY(' + sink + 'px)', offset: .4 }, { transform: 'translateY(' + sink2 + 'px)' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.3,1)' });
    A(doc, [{ transform: 'none' }, { transform: 'scale(.988) translateY(.1rem)', offset: .3 }, { transform: 'scale(1.003)', offset: .7 }, { transform: 'none' }], { duration: 380, easing: 'ease-out', fill: 'none' });
    A(mark, [{ opacity: 0, filter: 'url(#grain) blur(.06rem)' }, { opacity: .88, filter: 'url(#grain)' }], { duration: 90 });
    A(specks, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' });
    await sleep(260, id);

    // 4. 压住左右碾一下（人盖章时都会这么干），印记跟着吃满墨
    A(tool, [{ transform: T(0, '-8deg') }, { transform: T(0, 'calc(-8deg - ' + ROCK + ')') }, { transform: T(0, 'calc(-8deg + ' + ROCK + ')') }, { transform: T(0, '-8deg') }], { duration: 420, easing: 'ease-in-out' });
    A(mark, [{ opacity: .88 }, { opacity: 1 }], { duration: 420 });
    await sleep(480, id);

    // 5. 抬起：橡胶被印泥“粘”住一下（海绵先回弹），然后先慢后快离开；影子再变大变虚
    A(pad, [{ transform: 'scaleY(' + (SQ + .08) + ')' }, { transform: 'scaleY(1.06)', offset: .25 }, { transform: 'scaleY(1)', offset: .5 }, { transform: 'scaleY(1)' }], { duration: 520, easing: 'ease-out' });
    A(body, [{ transform: 'translateY(' + sink2 + 'px)' }, { transform: 'translateY(-1.1px)', offset: .25 }, { transform: 'translateY(0)', offset: .5 }, { transform: 'translateY(0)' }], { duration: 520, easing: 'ease-out' });
    A(tool, [{ transform: T(0, '-8deg') }, { transform: T(-.25, '-8deg'), offset: .22 }, { opacity: 1, offset: .75 }, { transform: T(-14, '-6deg', 1.14), opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.55,0,.35,1)' });
    A(shadow, [{ opacity: .2, transform: R + ' scale(1)', filter: 'blur(.4rem)' }, { opacity: 0, transform: R + ' scale(1.45)', filter: 'blur(1.3rem)' }], { duration: 520, easing: 'ease-in' });
    A(mark, [{ transform: R + ' scale(1)' }, { transform: R + ' scale(1.012)', offset: .25 }, { transform: R + ' scale(1)' }], { duration: 420, easing: 'ease-out' });
    await sleep(2400, id);
    A(mark, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' }); A(specks, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
    await sleep(600, id);
    play();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(play, 200); });
  play();
})();
