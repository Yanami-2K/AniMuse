// Masked Line Reveal — IntersectionObserver 进入视口加 .in；演示里每隔几秒重播一次
(function () {
  var el = document.getElementById('reveal'), timer;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { el.classList.add('in'); io.unobserve(el); } });
  }, { threshold: 0.35 });
  function play() {
    clearTimeout(timer);
    el.classList.add('reset'); el.classList.remove('in'); el.offsetHeight; el.classList.remove('reset');
    io.observe(el);
    timer = setTimeout(play, 4600);   // 演示用的循环，实际页面里删掉这行
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
