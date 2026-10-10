// Cursor Click & Stamp — 全部用 Web Animations API 串起来，好调时序
(function () {
  var css = getComputedStyle(document.documentElement);
  var ms = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var TRAVEL = ms('--travel'), PRESS = ms('--press'), SLAM = ms('--slam');
  var scene = document.getElementById('scene'), doc = document.getElementById('doc');
  var btn = document.getElementById('btn'), stamp = document.getElementById('stamp'), cursor = document.getElementById('cursor');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var run = 0, anims = [];
  var sleep = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function A(el, k, o) { var a = el.animate(k, Object.assign({ fill: 'forwards' }, o)); anims.push(a); return a.finished.catch(function () {}); }

  async function play() {
    var id = ++run; anims.forEach(function (a) { a.cancel(); }); anims = [];
    btn.className = 'btn'; btn.textContent = 'Approve';
    if (reduce) { btn.className = 'btn done'; btn.textContent = 'Approved'; stamp.style.opacity = 1; stamp.style.transform = 'rotate(-12deg)'; cursor.style.display = 'none'; return; }
    var s = scene.getBoundingClientRect(), b = btn.getBoundingClientRect();
    var tx = b.left - s.left + b.width * 0.62, ty = b.top - s.top + b.height * 0.55;
    var sx = -s.width * 0.15, sy = s.height * 1.05;
    // 1. 光标沿一条弧线滑到按钮上（中间帧偏上，形成弧度）
    A(cursor, [{ transform: 'translate(' + sx + 'px,' + sy + 'px)', opacity: 0 }, { opacity: 1, offset: .15 },
      { transform: 'translate(' + (tx * 0.55) + 'px,' + (ty * 0.62) + 'px)', offset: .55 },
      { transform: 'translate(' + tx + 'px,' + ty + 'px)' }], { duration: TRAVEL, easing: 'cubic-bezier(.45,0,.15,1)' });
    await sleep(TRAVEL + 160, id);
    // 2. 按下：光标缩一下，按钮下沉
    btn.classList.add('down');
    A(cursor, [{ transform: 'translate(' + tx + 'px,' + ty + 'px) scale(1)' }, { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.82)' }], { duration: PRESS, easing: 'ease-out' });
    await sleep(PRESS + 60, id);
    btn.classList.remove('down'); btn.classList.add('done'); btn.textContent = 'Approved';
    A(cursor, [{ transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.82)' }, { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(1)' }], { duration: 200, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    await sleep(160, id);
    // 3. 印章从高处加速砸下（ease-in），落地瞬间卡片震一下
    A(stamp, [{ opacity: 0, transform: 'scale(2.6) rotate(-26deg)' }, { opacity: 1, offset: .4 }, { opacity: 1, transform: 'scale(1) rotate(-12deg)' }],
      { duration: SLAM, easing: 'cubic-bezier(.55,0,.9,.4)' });
    await sleep(SLAM, id);
    A(doc, [{ transform: 'none' }, { transform: 'translate(.06rem,.18rem) rotate(-.4deg)' }, { transform: 'translate(-.04rem,-.06rem) rotate(.2deg)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out', fill: 'none' });
    A(stamp, [{ transform: 'scale(1) rotate(-12deg)' }, { transform: 'scale(.94) rotate(-12deg)' }, { transform: 'scale(1) rotate(-12deg)' }], { duration: 260, easing: 'ease-out' });
    // 光标退场
    await sleep(700, id);
    A(cursor, [{ transform: 'translate(' + tx + 'px,' + ty + 'px)', opacity: 1 }, { transform: 'translate(' + (tx + 40) + 'px,' + (ty + 60) + 'px)', opacity: 0 }], { duration: 600, easing: 'ease-in' });
    await sleep(2000, id);
    A(stamp, [{ opacity: 1, transform: 'scale(1) rotate(-12deg)' }, { opacity: 0, transform: 'scale(1.06) rotate(-12deg)' }], { duration: 400, easing: 'ease-in' });
    await sleep(700, id);
    play();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(play, 200); });
  play();
})();
