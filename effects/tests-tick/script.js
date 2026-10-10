// Tests Ticking Green — 逐条推进：run 一会儿 → ok，进度条和计数同步
(function () {
  var suite = document.getElementById('suite');
  var items = [].slice.call(document.querySelectorAll('#list li'));
  var done = document.getElementById('done'), fill = document.getElementById('fill'), pass = document.getElementById('pass');
  var STEP = +suite.dataset.step || 420;    // 每条测试大概跑多久(ms)
  var timers = [];
  document.getElementById('total').textContent = items.length;
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function play() {
    timers.forEach(clearTimeout); timers = [];
    items.forEach(function (li) { li.className = ''; });
    done.textContent = 0; fill.style.transform = 'scaleX(0)'; pass.classList.remove('on');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (li) { li.className = 'ok'; }); done.textContent = items.length; fill.style.transform = 'none'; pass.classList.add('on'); return;
    }
    var t = 500;
    items.forEach(function (li, i) {
      at(t, function () { li.className = 'run'; });
      t += STEP * (0.6 + Math.random() * 0.9);   // 每条耗时不一样才像真的
      at(t, function () { li.className = 'ok'; done.textContent = i + 1; fill.style.transform = 'scaleX(' + (i + 1) / items.length + ')'; });
    });
    at(t + 250, function () { pass.classList.add('on'); });
    at(t + 2600, play);
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
