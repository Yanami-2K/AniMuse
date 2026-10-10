// Fold & Send Letter — 真 3D 折纸（rotateX + backface-visibility）+ 一条 async WAAPI 时间线
(function () {
  var css = getComputedStyle(document.documentElement);
  var ms = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var FOLD = ms('--fold'), FLY = ms('--fly');
  var $ = function (id) { return document.getElementById(id); };
  var letter = $('letter'), pt = $('pt'), pb = $('pb'), eb = $('eb'), pk = $('pk'), fp = $('fp'), seal = $('seal'), fly = $('fly'), sent = $('sent');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 三块面板的正面都放同一张信纸，各自往上偏移，拼起来就是完整的一页
  document.querySelectorAll('.front').forEach(function (f) { f.appendChild($('sheetTpl').content.cloneNode(true)); });

  var run = 0, anims = [];
  var sleep = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function A(el, k, o) { var a = el.animate(k, Object.assign({ fill: 'forwards' }, o)); anims.push(a); return a; }
  var ENV = [eb, pk, fp];

  function fold(panel, deg, z) { // 折一下：过 90° 时最暗；到底后纸张弹性让它回弹一点
    A(panel, [{ transform: 'rotateX(0deg) translateZ(0)' }, { transform: 'rotateX(' + deg * 1.02 + 'deg) translateZ(' + z + 'px)', offset: .78 }, { transform: 'rotateX(' + deg * .97 + 'deg) translateZ(' + z + 'px)', offset: .9 }, { transform: 'rotateX(' + deg + 'deg) translateZ(' + z + 'px)' }], { duration: FOLD, easing: 'cubic-bezier(.55,0,.35,1)' });
    A(panel.querySelector('.shade'), [{ opacity: 0 }, { opacity: .22, offset: .48 }, { opacity: 0, offset: .5 }, { opacity: 0 }], { duration: FOLD, easing: 'ease-in' });
  }

  async function play() {
    var id = ++run; anims.forEach(function (a) { a.cancel(); }); anims = []; fp.classList.remove('front');
    if (reduce) { // 减少动态：直接给出“已装进信封”的最终画面
      [pt, pb].forEach(function (p, i) { p.style.transform = 'rotateX(' + (i ? 180 : -180) + 'deg) translateZ(-' + (i + 1) + 'px)'; });
      letter.style.transform = 'translateY(5.2rem) scale(.96)'; ENV.forEach(function (e) { e.style.opacity = 1; }); fp.classList.add('front'); seal.style.opacity = 1; return;
    }
    // 0. 新信纸从下面浮上来
    // 注意：opacity 动画会让 preserve-3d 被拍扁（折纸的前后关系就乱了），所以淡入放在外层 .fly 上
    A(letter, [{ transform: 'translateY(2rem)' }, { transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    A(fly, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'none' });
    ENV.forEach(function (e) { A(e, [{ opacity: 0, transform: e === fp ? 'translateY(12rem) scaleY(-1)' : 'translateY(12rem)' }], { duration: 1 }); });
    await sleep(1100, id);
    // 1. 下三分之一往上折，2. 上三分之一往下折（z 往前挪一点，避免和中间那块打架）
    fold(pb, 180, -2); await sleep(FOLD + 120, id);
    fold(pt, -180, -6); await sleep(FOLD + 160, id);
    // 3. 信封从下面弹上来，折好的信同时抬高一点
    ENV.forEach(function (e, i) {
      var f = e === fp ? ' scaleY(-1)' : '';
      A(e, [{ opacity: 1, transform: 'translateY(12rem)' + f }, { opacity: 1, transform: 'translateY(-.4rem)' + f, offset: .7 }, { opacity: 1, transform: 'translateY(0)' + f }], { duration: 560, easing: 'cubic-bezier(.2,.8,.3,1)' });
    });
    A(letter, [{ transform: 'none' }, { transform: 'translateY(-3.4rem) scale(.96)' }], { duration: 560, easing: 'cubic-bezier(.3,.7,.3,1)' });
    await sleep(640, id);
    // 4. 信滑进口袋（ease-in，有点重量感），信封被压得往下一沉
    A(letter, [{ transform: 'translateY(-3.4rem) scale(.96)' }, { transform: 'translateY(5.2rem) scale(.96)' }], { duration: 420, easing: 'cubic-bezier(.55,0,.8,.4)' });
    await sleep(400, id);
    ENV.concat([letter]).forEach(function (e) {
      var base = e === letter ? 'translateY(5.2rem) scale(.96)' : 'translateY(0)' + (e === fp ? ' scaleY(-1)' : '');
      e.animate([{ translate: '0 0' }, { translate: '0 .35rem' }, { translate: '0 0' }], { duration: 260, easing: 'ease-out' });
    });
    await sleep(260, id);
    // 5. 封盖合上：scaleY(-1) → 1，翻过中线的那一刻换到最上层
    A(fp, [{ transform: 'translateY(0) scaleY(-1)', filter: 'brightness(.9)' }, { transform: 'translateY(0) scaleY(1)', filter: 'brightness(1)' }], { duration: 380, easing: 'cubic-bezier(.5,0,.3,1)' });
    await sleep(190, id); fp.classList.add('front');
    await sleep(320, id);
    // 6. 火漆印砸下来，压扁再回弹
    A(seal, [{ opacity: 0, transform: 'translateY(-2rem) scale(2) rotate(-30deg)' }, { opacity: 1, transform: 'scale(1) rotate(0)', offset: .55, easing: 'ease-out' }, { transform: 'scale(1.25,.8)', offset: .7 }, { transform: 'scale(.94,1.06)', offset: .85 }, { opacity: 1, transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.6,0,.9,.5)' });
    await sleep(900, id);
    // 7. 先往下蓄力，再朝右上方“嗖”地飞走
    A(fly, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(.8rem) rotate(4deg) scale(.97)', offset: .25, easing: 'cubic-bezier(.5,0,.9,.6)' }, { transform: 'translate(18rem,-22rem) rotate(-28deg) scale(.35)', opacity: 1 }], { duration: FLY + 200 });
    await sleep(FLY + 100, id);
    A(sent, [{ opacity: 0, transform: 'translateY(.6rem) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    await sleep(900, id);
    A(sent, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
    await sleep(300, id);
    play();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
