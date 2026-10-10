// Review Pin Drop — 荧光笔 → 图钉（从上方落下，落点压扁回弹）→ 评论卡
(function () {
  var css = getComputedStyle(document.documentElement);
  var SWEEP = parseFloat(css.getPropertyValue('--sweep')), DROP = parseFloat(css.getPropertyValue('--drop'));
  var page = document.getElementById('page'), hl = document.getElementById('hl'), pin = document.getElementById('pin'), note = document.getElementById('note');
  var run = 0, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function place() {   // 图钉钉在高亮文字的最后一行末尾
    var rects = hl.getClientRects(), last = rects[rects.length - 1], p = page.getBoundingClientRect();
    pin.style.left = (last.right - p.left + 5) + 'px'; pin.style.top = (last.top - p.top + last.height * .45) + 'px';
  }
  async function play() {
    var id = ++run;
    if (document.fonts) await document.fonts.ready;
    [pin, note].forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); });
    hl.style.transition = 'none'; hl.classList.remove('on'); hl.offsetWidth; hl.style.transition = '';
    place();
    if (reduce) { hl.classList.add('on'); pin.style.opacity = 1; note.style.opacity = 1; return; }
    await sleep(500, id);
    hl.classList.add('on');
    await sleep(SWEEP + 80, id);
    pin.animate([
      { opacity: 0, transform: 'translateY(-2.4rem) rotate(-45deg) scale(1.1)' },
      { opacity: 1, transform: 'translateY(0) rotate(-45deg) scale(1.15,.82)', offset: .55, easing: 'ease-out' },
      { opacity: 1, transform: 'translateY(-.3rem) rotate(-45deg) scale(.95,1.06)', offset: .78 },
      { opacity: 1, transform: 'translateY(0) rotate(-45deg) scale(1)' }
    ], { duration: DROP, easing: 'cubic-bezier(.55,0,.85,.35)', fill: 'forwards' });
    await sleep(DROP - 60, id);
    note.animate([{ opacity: 0, transform: 'translateY(-.6rem) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
    await sleep(2600, id);
    [pin, note].forEach(function (el) { el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }); });
    hl.classList.remove('on');
    await sleep(900, id);
    play();
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  addEventListener('resize', place);
  play();
})();
