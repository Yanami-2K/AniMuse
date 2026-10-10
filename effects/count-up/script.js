// Odometer Count-up — 每列放 0-9 两遍，让高位也能“转一圈”再停
(function () {
  var el = document.getElementById('num'), chip = document.getElementById('chip');
  var VALUES = [12480, 12518, 9036];
  var reels = [], timer, k = 0;

  function build(len) {
    el.innerHTML = ''; reels = [];
    for (var i = 0; i < len; i++) {
      if (i && (len - i) % 3 === 0) { var s = document.createElement('span'); s.className = 'sep'; s.textContent = ','; el.appendChild(s); }
      var col = document.createElement('span'); col.className = 'col';
      var reel = document.createElement('span'); reel.className = 'reel';
      reel.style.setProperty('--i', i);
      for (var n = 0; n < 20; n++) { var d = document.createElement('span'); d.textContent = n % 10; reel.appendChild(d); }
      col.appendChild(reel); el.appendChild(col); reels.push(reel);
    }
  }
  function set(value, instant) {
    var str = String(value).padStart(reels.length, '0');
    reels.forEach(function (r, i) {
      var d = +str[i] + 10;                       // 落在第二圈，保证往上滚
      if (instant) { r.style.transition = 'none'; }
      r.style.transform = 'translateY(' + (-d) + 'em)';
      if (instant) { r.offsetHeight; r.style.transition = ''; }
    });
    el.setAttribute('aria-label', value.toLocaleString());
  }
  function reset() { reels.forEach(function (r) { r.style.transition = 'none'; r.style.transform = 'translateY(0)'; r.offsetHeight; r.style.transition = ''; }); }
  function play() {
    clearTimeout(timer); build(5); reset(); chip.classList.remove('on');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { set(VALUES[0], true); chip.classList.add('on'); return; }
    k = 0;
    requestAnimationFrame(function () { requestAnimationFrame(function () { set(VALUES[0]); }); });
    timer = setTimeout(loop, 2200);
  }
  function loop() {
    chip.classList.add('on');
    timer = setTimeout(function () { chip.classList.remove('on'); timer = setTimeout(play, 600); }, 2400);
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
