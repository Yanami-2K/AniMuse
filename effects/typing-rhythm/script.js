// Typing Rhythm — 速度带随机抖动，标点后多停一下，偶尔打错再退格
(function () {
  var line = document.getElementById('line');
  var out = document.getElementById('text');
  var SPEED = +line.dataset.speed || 62;      // 每个字的基础间隔(ms)
  var JITTER = +line.dataset.jitter || 0.55;  // 随机抖动比例 0~1
  var TYPO = +line.dataset.typo || 0.05;      // 打错字的概率
  var LINES = ['帮我做一个会呼吸的按钮，', '慢一点，像真人在打字。', 'Make it feel hand-made.'];
  var NEAR = 'asdfghjklqwertyuiop';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timer, run = 0;

  function wait(ms, id) { return new Promise(function (r) { timer = setTimeout(function () { if (id === run) r(); }, ms); }); }
  function gap(ch) {
    var t = SPEED * (1 + (Math.random() * 2 - 1) * JITTER);
    if (/[，。,.!?！？]/.test(ch)) t += SPEED * 5;   // 标点后停顿
    else if (ch === ' ') t += SPEED * 0.8;
    return Math.max(18, t);
  }
  async function type(str, id) {
    line.classList.remove('idle');
    for (var i = 0; i < str.length; i++) {
      if (id !== run) return;
      if (Math.random() < TYPO && /[a-z]/i.test(str[i])) {      // 打错一个，停一下，删掉
        out.textContent += NEAR[(Math.random() * NEAR.length) | 0];
        await wait(gap('x') * 2.2, id);
        out.textContent = out.textContent.slice(0, -1);
        await wait(gap('x'), id);
      }
      out.textContent += str[i];
      await wait(gap(str[i]), id);
    }
    line.classList.add('idle');
  }
  async function erase(id) {
    line.classList.remove('idle');
    while (out.textContent.length && id === run) {
      out.textContent = out.textContent.slice(0, -1);
      await wait(22 + Math.random() * 18, id);
    }
  }
  async function play() {
    var id = ++run; clearTimeout(timer); out.textContent = '';
    if (reduce) { out.textContent = LINES[0]; line.classList.add('idle'); return; }
    await wait(500, id);
    for (var n = 0; id === run; n++) {
      var s = LINES[n % LINES.length];
      await type(s, id); await wait(1700, id);
      await erase(id); await wait(380, id);
    }
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
