/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// CRT Power Off — 关键帧：正常 → 纵向压成 2px 亮线（同时变亮）→ 横向收成点 → 熄灭；再加旋钮、余辉亮点和开机雪花
(function () {
  var css = getComputedStyle(document.documentElement);
  var ms = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var OFF = ms('--off'), ON = ms('--on'), GLOW = ms('--glow');
  var $ = function (id) { return document.getElementById(id); };
  var content = $('content'), led = $('led'), screen = $('screen'), dot = $('dot'), snow = $('snow'), knob = $('knob');
  var ctx = snow.getContext('2d'), img = ctx.createImageData(snow.width, snow.height);
  var run = 0, on = true, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };

  function frames() {
    var line = 2 / screen.offsetHeight, pt = 6 / screen.offsetWidth;   // 2px 高的线、6px 宽的点
    return [
      { transform: 'scale(1,1)', filter: 'brightness(1)', opacity: 1 },
      { transform: 'scale(1.03,' + line + ')', filter: 'brightness(3)', opacity: 1, offset: .45, easing: 'cubic-bezier(.7,0,.9,.6)' },
      { transform: 'scale(' + pt + ',' + line + ')', filter: 'brightness(5)', opacity: 1, offset: .8 },
      { transform: 'scale(0,0)', filter: 'brightness(5)', opacity: 0 }
    ];
  }
  function turn(deg) { knob.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(' + deg + 'deg)', offset: .55 }, { transform: 'rotate(' + deg * .85 + 'deg)' }], { duration: 320, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'forwards' }); }
  function noise(dur) { // 雪花：每帧填一次随机灰度，96×72 再放大，几乎没开销
    var t0 = performance.now();
    snow.style.opacity = 1;
    (function f(t) {
      var d = img.data; for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      ctx.putImageData(img, 0, 0);
      var k = (t - t0) / dur; if (k < 1) { snow.style.opacity = (1 - k * k).toFixed(3); requestAnimationFrame(f); } else snow.style.opacity = 0;
    })(t0);
  }

  async function powerOff(id) {
    turn(-40); await sleep(220, id);
    led.classList.add('off');
    content.animate(frames(), { duration: OFF, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
    await sleep(OFF * .8, id);
    // 余辉：电子枪关了，荧光粉还亮着，那个点慢慢暗下去
    dot.animate([{ opacity: 1, transform: 'scale(1.6)' }, { opacity: .9, transform: 'scale(1)', offset: .15 }, { opacity: 0, transform: 'scale(.4)' }], { duration: GLOW, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
    on = false;
  }
  async function powerOn(id) {
    turn(0); led.classList.remove('off');
    await sleep(180, id);
    noise(380);
    await sleep(120, id);
    content.animate(frames().reverse().map(function (f) { if (f.offset != null) f.offset = 1 - f.offset; delete f.easing; return f; }), { duration: ON, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
    // 开机那一下画面上下滚一点、带点色散
    content.animate([{ translate: '0 0', textShadow: '0 0 transparent' }, { translate: '0 -.3rem', textShadow: '.12rem 0 rgba(255,0,60,.55), -.12rem 0 rgba(0,200,255,.55)', offset: .55 }, { translate: '0 .1rem', textShadow: '.04rem 0 rgba(255,0,60,.3), -.04rem 0 rgba(0,200,255,.3)', offset: .8 }, { translate: '0 0', textShadow: '0 0 transparent' }], { duration: ON + 260, easing: 'ease-out' });
    on = true;
  }

  async function play() {
    var id = ++run; [content, dot, knob].forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); }); led.classList.remove('off'); on = true;
    if (reduce) return;
    while (id === run) {
      await sleep(1500, id); await powerOff(id);
      await sleep(GLOW * .7, id); await powerOn(id);
      await sleep(ON, id);
    }
  }
  knob.addEventListener('click', function () { // 手动：点旋钮开关机，自动循环停掉
    var id = ++run; if (reduce) { content.style.opacity = on ? 0 : 1; on = !on; led.classList.toggle('off', !on); return; }
    on ? powerOff(id) : powerOn(id);
  });
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
