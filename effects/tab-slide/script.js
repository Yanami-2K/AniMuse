// Stretchy Tab Indicator — 三段关键帧：起点 → 拉长盖住两端 → 终点
// 用 translateX + width（不用 scaleX，否则圆角和小圆点会被拉扁）
(function () {
  var css = getComputedStyle(document.documentElement);
  var DUR = parseFloat(css.getPropertyValue('--dur')), MID = parseFloat(css.getPropertyValue('--stretch'));
  var EASE = css.getPropertyValue('--ease').trim();
  var tabs = document.getElementById('tabs'), pill = document.getElementById('pill');
  var btns = [].slice.call(tabs.querySelectorAll('button'));
  var cur = 0, auto, anim, swap;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function box(i) { var b = btns[i]; return { x: b.offsetLeft, w: b.offsetWidth }; }
  function tf(r) { return { transform: 'translateX(' + r.x + 'px)', width: r.w + 'px' }; }
  function set(r) { var k = tf(r); pill.style.transform = k.transform; pill.style.width = k.width; }
  function select(i) {
    if (i === cur && anim) return;
    var a = box(cur), b = box(i);
    var x = Math.min(a.x, b.x), w = Math.max(a.x + a.w, b.x + b.w) - x;
    clearTimeout(swap);
    swap = setTimeout(function () { btns.forEach(function (el, k) { el.setAttribute('aria-selected', k === i); }); }, reduce ? 0 : DUR * MID);   // 文字颜色等滑块快到了再换
    if (anim) anim.cancel();
    set(b);
    if (!reduce && i !== cur) { var m = tf({ x: x, w: w * 0.92 }); m.offset = MID; anim = pill.animate([tf(a), m, tf(b)], { duration: DUR, easing: EASE }); }
    cur = i;
  }
  btns.forEach(function (b, i) { b.addEventListener('click', function () { clearInterval(auto); select(i); }); });
  function play() { clearInterval(auto); cur = 0; anim = null; set(box(0)); btns.forEach(function (el, k) { el.setAttribute('aria-selected', k === 0); }); auto = setInterval(function () { select((cur + 1 + (Math.random() < .3 ? 1 : 0)) % btns.length); }, 1400); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  addEventListener('resize', function () { set(box(cur)); });
  play();
})();
