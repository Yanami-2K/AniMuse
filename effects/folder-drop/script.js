// Folder Drop Bounce — 前盖 rotateX 张开 → 文件加速落下 → 前盖合上 + 文件夹 squash & stretch → 角标弹一下
(function () {
  var css = getComputedStyle(document.documentElement);
  var FALL = parseFloat(css.getPropertyValue('--fall')), SQ = parseFloat(css.getPropertyValue('--squash'));
  var file = document.getElementById('file'), front = document.getElementById('front'), folder = document.getElementById('folder');
  var badge = document.getElementById('badge'), shadow = document.getElementById('shadow');
  var n = 3, run = 0;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  var A = function (el, k, o) { return el.animate(k, Object.assign({ fill: 'both' }, o)); };

  async function play() {
    var id = ++run; n = 3; badge.textContent = n;
    [file, front, folder, badge, shadow].forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); });
    if (reduce) { file.style.opacity = 0; return; }
    while (id === run) {
      // 文件从上方出现，轻轻悬停
      A(file, [{ transform: 'translateY(-4rem) rotate(-8deg)', opacity: 0 }, { transform: 'translateY(0) rotate(-4deg)', opacity: 1 }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
      await sleep(650, id);
      // 前盖张开
      A(front, [{ transform: 'rotateX(0)' }, { transform: 'rotateX(-38deg)' }], { duration: 260, easing: 'cubic-bezier(.3,0,.2,1)' });
      await sleep(120, id);
      // 文件下落（ease-in = 越掉越快），掉进前盖后面
      A(file, [{ transform: 'translateY(0) rotate(-4deg)' }, { transform: 'translateY(6.2rem) rotate(2deg)' }], { duration: FALL, easing: 'cubic-bezier(.55,0,1,.45)' });
      await sleep(FALL * 0.82, id);
      // 前盖“啪”合上（带一点回弹）
      A(front, [{ transform: 'rotateX(-38deg)' }, { transform: 'rotateX(6deg)', offset: .6 }, { transform: 'rotateX(0)' }], { duration: 300, easing: 'ease-out' });
      await sleep(FALL * 0.18, id);
      A(file, [{ opacity: 1 }, { opacity: 0 }], { duration: 1, fill: 'forwards' });
      // squash & stretch：先压扁变宽，再拉高，再归位
      A(folder, [{ transform: 'scale(1,1)' }, { transform: 'scale(' + (2 - SQ) + ',' + SQ + ')', offset: .25 }, { transform: 'scale(.97,1.05)', offset: .55 }, { transform: 'scale(1.01,.99)', offset: .8 }, { transform: 'scale(1,1)' }], { duration: 560, easing: 'ease-out', fill: 'none' });
      A(shadow, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(1.12)', offset: .25 }, { transform: 'scaleX(1)' }], { duration: 560, fill: 'none' });
      await sleep(140, id);
      badge.textContent = ++n;
      A(badge, [{ transform: 'scale(1)' }, { transform: 'scale(1.45) rotate(-8deg)', offset: .35 }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'none' });
      await sleep(1500, id);
      if (n >= 6) n = 2;
    }
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
