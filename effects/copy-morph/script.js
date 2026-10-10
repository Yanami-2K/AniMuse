// Copy Button Morph — 关键是宽度：先量好两种状态的宽度，用 WAAPI 在 width 之间过渡，文字区跟着裁切
(function () {
  var css = getComputedStyle(document.documentElement);
  var DUR = parseFloat(css.getPropertyValue('--dur')), HOLD = parseFloat(css.getPropertyValue('--hold'));
  var EASE = css.getPropertyValue('--ease').trim();
  var btn = document.getElementById('copy'), lbl = document.getElementById('lbl');
  var a = lbl.querySelector('.a'), b = lbl.querySelector('.b'), timer, auto;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setW(target, animate) {
    var from = lbl.offsetWidth, to = target.scrollWidth;
    lbl.style.width = to + 'px';
    if (animate && !reduce) lbl.animate([{ width: from + 'px' }, { width: to + 'px' }], { duration: DUR, easing: EASE });
  }
  function copy() {
    if (navigator.clipboard) navigator.clipboard.writeText(btn.dataset.text).catch(function () {});
    clearTimeout(timer);
    btn.classList.add('done'); setW(b, true);
    timer = setTimeout(function () { btn.classList.remove('done'); setW(a, true); }, HOLD);
  }
  btn.addEventListener('click', function () { clearInterval(auto); copy(); });
  function play() { clearInterval(auto); clearTimeout(timer); btn.classList.remove('done'); setW(a, false); setTimeout(copy, 700); auto = setInterval(copy, HOLD + 1600); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
