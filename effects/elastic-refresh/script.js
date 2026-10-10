// Elastic Pull-to-Refresh — 两个弹簧：膜中心深度 d、两侧深度 e；手指横向位置 px 决定鼓包在哪
(function () {
  var root = document.documentElement, css = getComputedStyle(root);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var rem = function () { return parseFloat(getComputedStyle(root).fontSize); };
  var vp = document.getElementById('vp'), list = document.getElementById('list'), mem = document.getElementById('mem');
  var knob = document.getElementById('knob'), arrow = document.getElementById('arrow'), finger = document.getElementById('finger');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WOB = num('--wobble');
  var S = { d: 0, vd: 0, td: 0, e: 0, ve: 0, te: 0, x: .5, vx: 0, tx: .5 };
  var mode = 'idle', drag = null;
  var NEWS = [['AniMuse', '新动效上线：弹性下拉刷新', '#ff5a36', 'A'], ['小林', '改好了，再看一眼？', '#ffd65a', '林'], ['周周', '今晚上线，记得点赞', '#7fe0c0', '周']], ni = 0;

  // 橡皮筋：拉得越多越难拉，永远到不了 max
  function rubber(dy) { var M = num('--max-pull') * rem(); return M * (1 - Math.exp(-Math.max(0, dy) / M)); }

  function down(x, y) { var r = vp.getBoundingClientRect(); if (mode !== 'idle' || x < r.left || x > r.right || y < r.top || y > r.bottom) return false; drag = { y0: y, r: r }; return true; }
  function move(x, y) {
    if (!drag) return;
    S.td = S.d = rubber(y - drag.y0); S.vd = 0;
    S.te = S.d * .42;
    S.tx = Math.max(.15, Math.min(.85, (x - drag.r.left) / drag.r.width));
  }
  function up() {
    if (!drag) return; drag = null;
    if (S.d > num('--threshold') * rem()) {
      mode = 'loading'; vp.classList.add('loading'); S.td = S.te = num('--bar') * rem(); S.tx = .5;
      setTimeout(done, 1500);
    } else { S.td = S.te = 0; S.tx = .5; }
  }
  function done() {
    var n = NEWS[ni++ % NEWS.length], li = document.createElement('li');
    li.className = 'new'; li.innerHTML = '<i style="--c:' + n[2] + '">' + n[3] + '</i><p><b>' + n[0] + '</b><span>' + n[1] + '</span></p>';
    list.insertBefore(li, list.firstChild);
    var old = list.querySelectorAll('li.new'); for (var i = 1; i < old.length; i++) old[i].classList.remove('new');
    while (list.children.length > 7) list.lastChild.remove();
    var h = li.offsetHeight;
    // 新消息从 0 高度“挤”出来，同时膜收回去
    li.animate([{ height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.9,.2,1.15)' });
    li.firstChild.animate([{ transform: 'scale(0) rotate(-40deg)' }, { transform: 'scale(1.15)', offset: .7 }, { transform: 'scale(1)' }], { duration: 600, delay: 120, easing: 'ease-out', fill: 'backwards' });
    mode = 'idle'; vp.classList.remove('loading'); S.td = S.te = 0; S.vd -= 40 * rem(); S.ve -= 20 * rem();
  }

  function render() {
    var W = vp.clientWidth, d = Math.max(0, S.d), e = Math.max(0, S.e), px = S.x * W, b = W * .2;
    // 膜的下边缘：两侧高度 e，中间在 px 处鼓到 d
    mem.setAttribute('d', 'M0 -2H' + W + 'V' + e.toFixed(1) +
      'C' + (W - b * .5).toFixed(1) + ' ' + e.toFixed(1) + ' ' + (px + b).toFixed(1) + ' ' + d.toFixed(1) + ' ' + px.toFixed(1) + ' ' + d.toFixed(1) +
      'C' + (px - b).toFixed(1) + ' ' + d.toFixed(1) + ' ' + (b * .5).toFixed(1) + ' ' + e.toFixed(1) + ' 0 ' + e.toFixed(1) + 'Z');
    list.style.transform = 'translate3d(0,' + (e * .98).toFixed(1) + 'px,0)';
    var R = rem(), T = num('--threshold') * R, k = Math.min(1, d / T);
    var ky = mode === 'loading' ? d / 2 : Math.max(d - 1.25 * R, d * .5);
    knob.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + ky.toFixed(1) + 'px,0) scale(' + (mode === 'loading' ? 1 : Math.min(1, Math.max(0, (d - .8 * R) / (2.4 * R)))).toFixed(3) + ')';
    arrow.style.transform = 'rotate(' + (k >= 1 ? 180 : 0) + 'deg)';
    arrow.style.transition = 'transform .25s cubic-bezier(.3,1.6,.5,1)';
  }

  var last = performance.now(), acc = 0;
  function frame(t) {
    var dt = Math.min(.05, (t - last) / 1000); last = t; acc += dt;
    if (demoOn) demo(t);
    while (acc > 1 / 240) {
      var h = 1 / 240;
      if (!drag) { S.vd += (170 * (S.td - S.d) - WOB * S.vd) * h; S.d += S.vd * h; S.ve += (260 * (S.te - S.e) - (WOB + 6) * S.ve) * h; S.e += S.ve * h; }
      else { S.ve += (400 * (S.te - S.e) - 30 * S.ve) * h; S.e += S.ve * h; }
      S.vx += (90 * (S.tx - S.x) - 8 * S.vx) * h; S.x += S.vx * h;
      acc -= h;
    }
    render(); requestAnimationFrame(frame);
  }

  addEventListener('pointerdown', function (e) { if (down(e.clientX, e.clientY)) { demoOn = false; finger.className = 'finger'; clearTimeout(resume); } });
  addEventListener('pointermove', function (e) { if (drag && !demoOn) move(e.clientX, e.clientY); });
  addEventListener('pointerup', function () { if (drag && !demoOn) { up(); clearTimeout(resume); resume = setTimeout(function () { demoOn = true; t0 = null; }, 6000); } });
  var resume;

  // ---- 自动演示：手指按住往下拽，左右晃一下，拉过阈值后松手 ----
  var demoOn = true, t0 = null, pressed = false;
  function demo(t) {
    var r = vp.getBoundingClientRect(), R = rem();
    if (t0 === null) t0 = t;
    var e = (t - t0) / 1000, sm = function (k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
    var sx = r.left + r.width * .55, sy = r.top + 2.2 * R, x = sx, y = sy;
    if (e < .5) { finger.classList.add('on'); y = sy + 2 * R * (1 - sm(e / .5)); }
    else if (e < .6) { if (!pressed) { pressed = down(sx, sy); finger.classList.add('down'); } }
    else if (e < 1.8) { var k = sm((e - .6) / 1.2); y = sy + 12 * R * k; x = sx - Math.sin(k * Math.PI * 1.5) * 3 * R; }
    else if (e < 1.9) { y = sy + 12 * R; x = sx + 3 * R; }
    else { y = sy + 12 * R; x = sx + 3 * R; if (pressed) { up(); pressed = false; finger.classList.remove('down'); } if (e > 2.1) finger.classList.remove('on'); }
    if (pressed) move(x, y);
    finger.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (e > 5.4) t0 = null;
  }

  addEventListener('message', function (ev) { if (ev.data === 'animuse:replay') { demoOn = true; t0 = null; } });
  if (reduce) { demoOn = false; WOB = 40; }
  render(); requestAnimationFrame(frame);
})();
