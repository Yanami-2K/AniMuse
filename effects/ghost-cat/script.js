// Floating Ghost Cat — 眨眼间隔随机（2~5s），偶尔连眨两下；点击/轻触触发 boo
(function () {
  var eyes = document.querySelector('.eyes'), spot = document.getElementById('spot'), timer;
  function blink() {
    eyes.classList.remove('blink'); void eyes.getBBox(); eyes.classList.add('blink');
    var twice = Math.random() < .25;
    timer = setTimeout(twice ? function () { eyes.classList.remove('blink'); void eyes.getBBox(); eyes.classList.add('blink'); timer = setTimeout(blink, 2000 + Math.random() * 3000); } : blink, twice ? 260 : 2000 + Math.random() * 3000);
  }
  function boo() { spot.classList.remove('boo'); void spot.offsetWidth; spot.classList.add('boo'); }
  spot.addEventListener('click', boo);
  function play() { clearTimeout(timer); boo(); timer = setTimeout(blink, 1200); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setTimeout(blink, 1500);
})();
