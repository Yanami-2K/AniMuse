// Rubber Stamp Approve — Web Animations API 串一条 async 时间线：点按钮 → 章落下 → 压扁 + 碾 → 抬起留印
(function () {
  var css = getComputedStyle(document.documentElement);
  var ms = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var TRAVEL = ms('--travel'), DROP = ms('--drop'), SQ = ms('--squash'), ROCK = ms('--rock');
  var $ = function (id) { return document.getElementById(id); };
  var scene = $('scene'), doc = $('doc'), btn = $('btn'), mark = $('mark'), tool = $('tool'), shadow = $('shadow'), specks = $('specks'), cursor = $('cursor');
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

    // 2. 章从画面外落下：ease-in 加速；影子从“又大又虚”收成“又小又实”——这是距离感的关键
    A(tool, [{ opacity: 1, transform: 'translateY(-14rem) ' + R + ' scale(1.08)' }, { opacity: 1, transform: 'translateY(0) ' + R }], { duration: DROP, easing: 'cubic-bezier(.6,0,.95,.5)' });
    A(shadow, [{ opacity: 0, transform: R + ' scale(1.5)', filter: 'blur(1.4rem)' }, { opacity: .26, transform: R + ' scale(1)', filter: 'blur(.35rem)' }], { duration: DROP, easing: 'cubic-bezier(.6,0,.95,.5)' });
    await sleep(DROP, id);

    // 3. 落地：章身压扁、纸被压一下、印记出现、溅出几粒印泥
    A(tool, [{ transform: 'translateY(0) ' + R + ' scale(1,1)' }, { transform: 'translateY(0) ' + R + ' scale(' + (2 - SQ) * .98 + ',' + SQ + ')', offset: .35 }, { transform: 'translateY(0) ' + R + ' scale(.98,1.03)', offset: .7 }, { transform: 'translateY(0) ' + R + ' scale(1,.97)' }], { duration: 220, easing: 'ease-out' });
    A(doc, [{ transform: 'none' }, { transform: 'scale(.985) translateY(.12rem)', offset: .3 }, { transform: 'scale(1.004)', offset: .7 }, { transform: 'none' }], { duration: 360, easing: 'ease-out', fill: 'none' });
    A(mark, [{ opacity: 0 }, { opacity: 1 }], { duration: 60 });
    A(specks, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 160, easing: 'ease-out' });
    await sleep(240, id);

    // 4. 压住左右碾一下（人盖章时都会这么干）
    A(tool, [{ transform: 'translateY(0) ' + R + ' scale(1,.97)' }, { transform: 'translateY(0) rotate(calc(-8deg - ' + ROCK + ')) scale(1,.96)' }, { transform: 'translateY(0) rotate(calc(-8deg + ' + ROCK + ')) scale(1,.96)' }, { transform: 'translateY(0) ' + R + ' scale(1,.97)' }], { duration: 380, easing: 'ease-in-out' });
    await sleep(440, id);

    // 5. 抬起：先慢后快离开，影子再次变大变虚；印记留下
    A(tool, [{ transform: 'translateY(0) ' + R + ' scale(1,.97)' }, { transform: 'translateY(-.5rem) ' + R + ' scale(.99,1.02)', offset: .2 }, { transform: 'translateY(-15rem) ' + R + ' scale(1.08)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.5,0,.3,1)' });
    A(shadow, [{ opacity: .26, transform: R + ' scale(1)', filter: 'blur(.35rem)' }, { opacity: 0, transform: R + ' scale(1.5)', filter: 'blur(1.4rem)' }], { duration: 480, easing: 'ease-in' });
    A(mark, [{ transform: R + ' scale(1)' }, { transform: R + ' scale(1.015)', offset: .3 }, { transform: R + ' scale(1)' }], { duration: 400, easing: 'ease-out' });
    await sleep(2400, id);
    A(mark, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' }); A(specks, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
    await sleep(600, id);
    play();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(play, 200); });
  play();
})();
