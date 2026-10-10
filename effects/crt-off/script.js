// CRT Power Off — 关键帧：正常 → 纵向压成 2px 亮线（同时变亮）→ 横向收成点 → 熄灭
(function () {
  var css = getComputedStyle(document.documentElement);
  var OFF = parseFloat(css.getPropertyValue('--off')), ON = parseFloat(css.getPropertyValue('--on'));
  var content = document.getElementById('content'), led = document.getElementById('led'), screen = document.getElementById('screen');
  var run = 0, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function frames() {
    var line = 2 / screen.offsetHeight, dot = 6 / screen.offsetWidth;   // 2px 高的线、6px 宽的点
    return [
      { transform: 'scale(1,1)', filter: 'brightness(1)', opacity: 1, borderRadius: '1rem' },
      { transform: 'scale(1.02,' + line + ')', filter: 'brightness(3)', opacity: 1, borderRadius: '0', offset: .45, easing: 'cubic-bezier(.7,0,.9,.6)' },
      { transform: 'scale(' + dot + ',' + line + ')', filter: 'brightness(5)', opacity: 1, borderRadius: '50%', offset: .8 },
      { transform: 'scale(0,0)', filter: 'brightness(5)', opacity: 0, borderRadius: '50%' }
    ];
  }
  async function play() {
    var id = ++run; content.getAnimations().forEach(function (a) { a.cancel(); }); led.classList.remove('off');
    if (reduce) return;
    while (id === run) {
      await sleep(1600, id);
      led.classList.add('off');
      content.animate(frames(), { duration: OFF, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
      await sleep(OFF + 700, id);
      led.classList.remove('off');
      content.animate(frames().reverse().map(function (f) { if (f.offset != null) f.offset = 1 - f.offset; delete f.easing; return f; }), { duration: ON, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
      await sleep(ON, id);
    }
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
