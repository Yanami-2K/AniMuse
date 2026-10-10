// Squishy Press Button — 真实点击直接走 CSS :active；松手时加 .pop 播放放射线。演示里自动按
(function () {
  var btn = document.getElementById('btn'), auto, t;
  function pop() { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
  btn.addEventListener('pointerup', function () { clearInterval(auto); pop(); });
  btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') pop(); });
  function press() {
    btn.classList.add('down');
    t = setTimeout(function () { btn.classList.remove('down'); pop(); }, 260);
  }
  function play() { clearInterval(auto); clearTimeout(t); setTimeout(press, 500); auto = setInterval(press, 2000); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) play();
})();
