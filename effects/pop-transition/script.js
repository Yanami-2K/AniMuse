/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Pop Shape Transition — 网格里每格一个形状，延迟 = (列 + 行) × stagger，所以是一道从左上往右下推的斜波
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var CELL = num('--cell'), STAG = num('--stagger'), POP = num('--pop'), HOLD = num('--hold');
  var $ = function (id) { return document.getElementById(id); };
  var page = $('page'), wipe = $('wipe'), title = $('title'), sub = $('sub'), kicker = $('kicker'), deco = $('deco'), next = $('next');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGES = [
    { n: '01', sub: LANG === 'en' ? 'Good morning, off we go' : '早上好，出发前', bg: '#ffe9a8', hi: '#ff8fab', wave: '#ff8fab', deco: [['d-circle', 8, 14, 4.2, '#ff8fab'], ['d-pill', 78, 70, 5.6, '#8fd3ff', 2.2], ['d-tri', 82, 12, 3.4, '#7ee0b5']] },
    { n: '02', sub: LANG === 'en' ? 'A bumpy ride' : '路上有点颠', bg: '#d6f1ff', hi: '#7ee0b5', wave: '#7ee0b5', deco: [['d-tri', 10, 66, 4, '#ffd45c'], ['d-circle', 80, 16, 3.2, '#ff8fab'], ['d-pill', 12, 12, 4.6, '#b9a6ff', 2]] },
    { n: '03', sub: LANG === 'en' ? 'We’re here, hop off' : '到站啦，下车', bg: '#ffe1ea', hi: '#b9a6ff', wave: '#b9a6ff', deco: [['d-pill', 74, 14, 5, '#ffd45c', 2.2], ['d-circle', 12, 70, 4.6, '#7ee0b5'], ['d-tri', 84, 68, 3.2, '#8fd3ff']] }
  ];
  var SHAPES = ['circle', 'square', 'flower'];
  var idx = 0, busy = false, timer = 0, run = 0, cells = [];
  var rem = function () { return parseFloat(getComputedStyle(document.documentElement).fontSize); };

  // 弹簧缓动采样成 linear()，形状长出来会过冲一下
  function spring(b) { var z = 1 - b * .82, w = 2 * Math.PI * 1.3, wd = w * Math.sqrt(1 - z * z), p = []; for (var i = 0; i <= 50; i++) { var t = i / 50 * 1.4; p.push(+(1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t))).toFixed(4)); } p[50] = 1; return 'linear(' + p.join(',') + ')'; }
  var SPRING = spring(.55);

  function grid() {
    wipe.innerHTML = ''; cells = [];
    var W = innerWidth, H = innerHeight, c = Math.max(W, H) / CELL, cols = Math.ceil(W / c) + 1, rows = Math.ceil(H / c) + 1;
    for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++) {
      var el = document.createElement('i'), k = (q + r * 2) % 3;
      el.className = SHAPES[k]; el.style.cssText = '--s:' + c * 1.5 + 'px;left:' + (q * c + (r % 2) * c * .25) + 'px;top:' + r * c + 'px';
      wipe.appendChild(el); cells.push({ el: el, d: q + r, rot: (k === 2 ? 90 : 45) * ((q + r) % 2 ? 1 : -1) });
    }
  }
  function render(p, animate) {
    page.style.setProperty('--bg', p.bg); page.style.setProperty('--hi', p.hi);
    kicker.textContent = 'CHAPTER'; sub.textContent = p.sub;
    title.innerHTML = p.n.split('').map(function (ch) { return '<span>' + ch + '</span>'; }).join('');
    deco.innerHTML = p.deco.map(function (d) {
      var s = d[3], h = d[5] ? s / d[5] : s, inner = d[0] === 'd-tri' ? '<svg viewBox="0 0 100 100"><path d="M50 8 L94 88 H6 Z" fill="' + d[4] + '" stroke="#3a3346" stroke-width="6" stroke-linejoin="round" style="filter:drop-shadow(3px 4px 0 #3a3346)"/></svg>' : '';
      return '<i class="' + d[0] + '" style="left:' + d[1] + '%;top:' + d[2] + '%;width:' + s + 'rem;height:' + h + 'rem;--c:' + d[4] + '">' + inner + '</i>';
    }).join('');
    if (!animate) return;
    // 标题：每个字从上面掉下来，落地压扁再弹起
    [].forEach.call(title.children, function (s, i) {
      s.animate([{ transform: 'translateY(-3.2rem) scale(.7,1.2)', opacity: 0 }, { opacity: 1, offset: .25 }, { transform: 'translateY(0) scale(1.18,.8)', offset: .5 }, { transform: 'translateY(-.7rem) scale(.95,1.06)', offset: .72 }, { transform: 'translateY(0) scale(1.04,.97)', offset: .88 }, { transform: 'none', opacity: 1 }],
        { duration: 620, delay: 40 + i * 90, easing: 'cubic-bezier(.3,0,.5,1)', fill: 'backwards' });
    });
    [kicker, sub, next].forEach(function (el, i) { el.animate([{ transform: 'translateY(.8rem)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: 200 + i * 70, easing: SPRING, fill: 'backwards' }); });
    [].forEach.call(deco.children, function (el, i) { el.animate([{ transform: 'scale(0) rotate(-120deg)' }, { transform: 'none' }], { duration: 700, delay: 120 + i * 110, easing: SPRING, fill: 'backwards' }); });
  }
  var wait = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };

  async function go() {
    if (busy) return; busy = true; clearTimeout(timer);
    var id = ++run, nx = PAGES[(idx + 1) % PAGES.length], max = 0;
    if (reduce) { idx = (idx + 1) % PAGES.length; render(nx, false); busy = false; return; }
    // 1. 铺满：每个形状 0 → 过冲 → 1，边转边长
    cells.forEach(function (c) {
      c.el.style.setProperty('--fill', nx.wave); max = Math.max(max, c.d);
      c.el.animate([{ transform: 'scale(0) rotate(' + c.rot + 'deg)' }, { transform: 'scale(1) rotate(0deg)' }], { duration: POP, delay: c.d * STAG, easing: SPRING, fill: 'both' });
    });
    await wait(max * STAG + POP * .24, id);
    // 2. 屏幕被盖住的那一刻换页
    idx = (idx + 1) % PAGES.length; render(nx, false);
    // 3. 同样的顺序缩回去：先微微鼓一下再消失
    cells.forEach(function (c) {
      c.el.animate([{ transform: 'scale(1) rotate(0deg)' }, { transform: 'scale(1.05) rotate(0deg)', offset: .12 }, { transform: 'scale(0) rotate(' + -c.rot + 'deg)' }], { duration: POP * .8, delay: c.d * STAG, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'both' });
    });
    await wait(max * STAG * .4, id);
    render(nx, true);
    await wait(max * STAG * .55 + POP, id);
    busy = false; schedule();
  }
  function schedule() { clearTimeout(timer); if (!reduce) timer = setTimeout(go, HOLD); }
  next.addEventListener('click', go);
  page.addEventListener('click', function (e) { if (e.target !== next && !next.contains(e.target)) go(); });

  function reset() { run++; busy = false; clearTimeout(timer); idx = 0; grid(); render(PAGES[0], !reduce); schedule(); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') reset(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(reset, 200); });
  reset();
})();
