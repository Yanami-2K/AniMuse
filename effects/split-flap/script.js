/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Split-flap Board — 每一格 = 两片静态半格 + 两片会转的翻片；按字母表一格一格翻，最后一片带回弹
(function () {
  var css = getComputedStyle(document.documentElement);
  var ms = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var FLIP = ms('--flip'), SETTLE = ms('--settle'), STAGGER = ms('--stagger'), HOLD = ms('--hold');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-.';
  var N = 9;
  var MSGS = [['ANIMUSE', 'NOW 09:41'], ['MOTION', 'BOARDING'], ['CRAFTED', 'BY HAND'], ['COPY', 'PROMPT  >']];
  function pad(s) { var l = Math.floor((N - s.length) / 2); return (Array(l + 1).join(' ') + s + Array(N + 1).join(' ')).slice(0, N); }

  function makeRow(el) {
    var cells = [];
    for (var i = 0; i < N; i++) {
      var c = document.createElement('div'); c.className = 'cell';
      c.innerHTML = '<div class="h top"><span></span></div><div class="h bot"><span></span></div><i class="shade"></i><div class="h ft"><span></span></div><div class="h fb"><span></span></div>';
      el.appendChild(c);
      var q = function (s) { return c.querySelector(s); };
      cells.push({ el: c, ch: ' ', top: q('.top span'), bot: q('.bot span'), ft: q('.ft'), fb: q('.fb'), fts: q('.ft span'), fbs: q('.fb span'), shade: q('.shade') });
    }
    return cells;
  }
  var rows = [makeRow(document.getElementById('r1')), makeRow(document.getElementById('r2'))];
  var run = 0;
  function set(c, ch) { c.ch = ch; c.top.textContent = c.bot.textContent = c.fts.textContent = c.fbs.textContent = ch; }

  function flip(c, to, dur, last) {
    var from = c.ch;
    c.top.textContent = to; c.bot.textContent = from; c.fts.textContent = from; c.fbs.textContent = to;
    var half = last ? dur * .34 : dur / 2;
    // 上半片往下翻（越翻越暗），翻过 90° 后换成下半片继续落下
    c.ft.animate([{ transform: 'rotateX(0)', filter: 'brightness(1)' }, { transform: 'rotateX(-90deg)', filter: 'brightness(.5)' }], { duration: half, easing: 'cubic-bezier(.5,0,1,1)', fill: 'forwards' });
    c.shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: half, fill: 'forwards' });
    var k = last
      ? [{ transform: 'rotateX(90deg)', filter: 'brightness(1.5)' }, { transform: 'rotateX(0)', filter: 'brightness(1)', offset: .42, easing: 'cubic-bezier(.3,0,.6,1)' }, { transform: 'rotateX(-16deg)', offset: .62, easing: 'cubic-bezier(.3,0,.6,1)' }, { transform: 'rotateX(0)', offset: .8 }, { transform: 'rotateX(-4deg)', offset: .9 }, { transform: 'rotateX(0)' }]
      : [{ transform: 'rotateX(90deg)', filter: 'brightness(1.5)' }, { transform: 'rotateX(0)', filter: 'brightness(1)' }];
    var a = c.fb.animate(k, { duration: last ? dur * .66 : half, delay: half, easing: last ? 'linear' : 'cubic-bezier(0,0,.5,1)', fill: 'forwards' });
    c.shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: last ? dur * .3 : half, delay: half, fill: 'forwards' });
    c.ch = to;
    return a.finished.then(function () { c.bot.textContent = to; c.fts.textContent = to; c.ft.getAnimations().forEach(function (x) { x.cancel(); }); });
  }

  async function spin(c, target, delay, id) {
    await wait(delay, id);
    var i = CHARS.indexOf(c.ch), j = CHARS.indexOf(target), steps = (j - i + CHARS.length) % CHARS.length;
    for (var s = 1; s <= steps && id === run; s++) {
      var last = s === steps;
      // 快到终点时慢下来一点，像机器减速
      await flip(c, CHARS[(i + s) % CHARS.length], last ? SETTLE : FLIP * (steps - s < 3 ? 1.7 : 1), last);
    }
  }
  function wait(t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); }

  async function play() {
    var id = ++run, m = 0;
    rows.forEach(function (r) { r.forEach(function (c) { c.el.querySelectorAll('.h,.shade').forEach(function (e) { e.getAnimations().forEach(function (a) { a.cancel(); }); }); set(c, ' '); }); });
    if (reduce) { rows.forEach(function (r, ri) { var t = pad(MSGS[0][ri]); r.forEach(function (c, i) { set(c, t[i]); }); }); return; }
    await wait(250, id);
    while (id === run) {
      var jobs = [];
      rows.forEach(function (r, ri) { var t = pad(MSGS[m][ri]); r.forEach(function (c, i) { jobs.push(spin(c, t[i], i * STAGGER + ri * STAGGER * 2.5, id)); }); });
      await Promise.all(jobs); await wait(HOLD, id);
      m = (m + 1) % MSGS.length;
    }
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
