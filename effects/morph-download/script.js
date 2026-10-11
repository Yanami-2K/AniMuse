/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Morphing Download Button — 状态机 + 顶点弹簧。两个四边形 = 8 个顶点，每个顶点独立弹到新形状的对应点
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var K = num('--stiffness'), C = num('--damping'), STAG = num('--stagger'), LOAD = num('--load');
  var btn = document.getElementById('btn'), ring = document.getElementById('ring'), icon = document.getElementById('icon');
  var p1 = document.getElementById('p1'), p2 = document.getElementById('p2'), sparks = document.getElementById('sparks');
  var stateEl = document.getElementById('state'), pctEl = document.getElementById('pct');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 一根粗线段 → 四个顶点
  function bar(x1, y1, x2, y2, w) {
    var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), nx = -dy / l * w / 2, ny = dx / l * w / 2;
    return [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]];
  }
  // 折线 A→B→C 加粗成两个四边形，拐点用斜接（miter）点共享同一条边——
  // 直接拼两根 bar 的话，拐角外侧会缺一个 V 形口子（对勾底部那块缺口就是这么来的）
  function elbow(ax, ay, bx, by, cx, cy, w) {
    var s1 = bar(ax, ay, bx, by, w), s2 = bar(bx, by, cx, cy, w);
    function cross(p, q, r, s) { // 直线 pq 与 rs 的交点
      var d = (p[0] - q[0]) * (r[1] - s[1]) - (p[1] - q[1]) * (r[0] - s[0]);
      var t = ((p[0] - r[0]) * (r[1] - s[1]) - (p[1] - r[1]) * (r[0] - s[0])) / d;
      return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
    }
    var mo = cross(s1[0], s1[1], s2[0], s2[1]), mi = cross(s1[3], s1[2], s2[3], s2[2]);
    return [s1[0], mo, mi, s1[3], mo, s2[1], s2[2], mi];
  }
  var SHAPES = {
    idle:  bar(50, 20, 50, 56, 12).concat([[28, 50], [50, 76], [50, 76], [72, 50]]),
    load:  bar(39, 30, 39, 70, 11).concat(bar(61, 30, 61, 70, 11)),
    pause: [[38, 27], [55, 37], [55, 63], [38, 73], [55, 37], [74, 50], [74, 50], [55, 63]],
    done:  elbow(28, 52, 44, 68, 73, 35, 11)
  };
  var LABEL = LANG === 'en' ? { idle: 'Download', load: 'Downloading', pause: 'Paused', done: 'Done' } : { idle: '下载', load: '下载中', pause: '已暂停', done: '完成' };
  var pts = SHAPES.idle.map(function (p) { return { x: p[0], y: p[1], vx: 0, vy: 0, tx: p[0], ty: p[1], at: 0 }; });
  var rot = 0, vr = 0, sc = 1, vs = 0, state = 'idle', prog = 0, shown = 0;
  var welds = [], weldT0 = -1e9, WELD = 160; // 焊接在 160ms 内渐进完成，避免起始帧跳一下

  function go(s) {
    var now = performance.now(), from = state; state = s;
    SHAPES[s].forEach(function (p, i) { pts[i].tx = p[0]; pts[i].ty = p[1]; pts[i].at = now + i * STAG; });
    // 目标形状里重合的顶点（两块拼接处的公共边）要“焊”在一起：各自弹簧+错峰会让它们短暂分开，拼缝处露出尖角或缺口
    welds = []; SHAPES[s].forEach(function (p, i) { SHAPES[s].forEach(function (q, k) { if (k > i && Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < .01) welds.push([i, k]); }); });
    weldT0 = now;
    if (from === 'idle' && s === 'load') vr = -720;      // 进入下载：拧一下
    if (s === 'pause' || (from === 'pause' && s === 'load')) vr = 520;
    if (s === 'done') { vr = -360; vs = 3; spark(); }
    vs -= 2.2;                                            // 每次切换按钮都“咚”一下
    btn.classList.toggle('done', s === 'done'); btn.setAttribute('aria-label', LABEL[s]);
    stateEl.textContent = LABEL[s];
  }
  function spark() {
    sparks.innerHTML = '';
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2, c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', 50); c.setAttribute('cy', 50); c.setAttribute('r', i % 2 ? 3.2 : 4.8); c.style.fill = i % 2 ? 'var(--ok)' : 'var(--accent)'; sparks.appendChild(c);
      var d = i % 2 ? 70 : 80;
      c.animate([{ transform: 'translate(' + Math.cos(a) * 52 + 'px,' + Math.sin(a) * 52 + 'px) scale(1)', opacity: 1 },
        { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) scale(0)', opacity: 1 }], { duration: 620, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
    }
  }

  function poly(a) { return 'M' + a.map(function (p) { return p.x.toFixed(2) + ' ' + p.y.toFixed(2); }).join('L') + 'Z'; }
  function render() {
    var v = pts.map(function (p) { return { x: p.x, y: p.y }; });
    var f = Math.min(1, (performance.now() - weldT0) / (reduce ? 1 : WELD)); f = f * f * (3 - 2 * f);
    welds.forEach(function (w) {
      var a = v[w[0]], b = v[w[1]], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      a.x += (mx - a.x) * f; a.y += (my - a.y) * f; b.x += (mx - b.x) * f; b.y += (my - b.y) * f;
    });
    p1.setAttribute('d', poly(v.slice(0, 4))); p2.setAttribute('d', poly(v.slice(4)));
    icon.setAttribute('transform', 'rotate(' + rot.toFixed(2) + ' 50 50)');
    btn.style.transform = 'scale(' + sc.toFixed(4) + ')';
    ring.style.strokeDasharray = shown.toFixed(2) + ' 100';
    ring.style.opacity = state === 'idle' ? Math.max(0, shown / 100) : 1;
    pctEl.textContent = state === 'load' || state === 'pause' ? Math.round(shown) + '%' : '';
  }

  var last = performance.now(), loadT = 0;
  function frame(t) {
    var dt = Math.min(.05, (t - last) / 1000); last = t;
    var n = Math.max(1, Math.round(dt * 240)), h = dt / n;
    for (var s = 0; s < n; s++) {
      pts.forEach(function (p) {
        if (t < p.at) return;
        p.vx += (K * (p.tx - p.x) - C * p.vx) * h; p.vy += (K * (p.ty - p.y) - C * p.vy) * h; p.x += p.vx * h; p.y += p.vy * h;
      });
      vr += (180 * (0 - rot) - 14 * vr) * h; rot += vr * h;
      vs += (420 * (1 - sc) - 15 * vs) * h; sc += vs * h;
    }
    if (state === 'load') {
      loadT += dt * 1000;
      // 真实下载的进度不是匀速的：前快、中间卡一下、最后冲刺
      var k = Math.min(1, loadT / LOAD); prog = 100 * (k < .45 ? k / .45 * .58 : k < .7 ? .58 + (k - .45) / .25 * .1 : .68 + (k - .7) / .3 * .32);
      if (k >= 1) { go('done'); if (!manual) setTimeout(function () { if (state === 'done' && !manual) go('idle'); }, 1600); }
    }
    if (state === 'idle') prog = 0;
    shown += (prog - shown) * Math.min(1, dt * (state === 'idle' ? 6 : 12));
    render(); requestAnimationFrame(frame);
  }

  var manual = false, demoTimer;
  btn.addEventListener('click', function () {
    manual = true; clearTimeout(demoTimer);
    if (state === 'idle') { loadT = 0; go('load'); }
    else if (state === 'load') go('pause');
    else if (state === 'pause') go('load');
    else go('idle');
  });
  btn.addEventListener('pointerdown', function () { vs -= 1.5; });

  // 自动演示：下载 → 中途暂停一下 → 继续 → 完成 → 回到初始
  function demo() {
    if (manual) return;
    var seq = [[700, function () { loadT = 0; go('load'); }], [1300, function () { go('pause'); }], [1100, function () { go('load'); }]];
    var i = 0;
    (function next() { if (manual || i >= seq.length) return; demoTimer = setTimeout(function () { seq[i++][1](); next(); }, seq[i][0]); })();
    demoTimer2 = setTimeout(demo, 700 + 1100 + LOAD + 1600 + 1400); // 一轮：等待 + 暂停 + 下载 + 完成停留 + 歇一会
  }
  var demoTimer2;
  addEventListener('message', function (e) {
    if (e.data !== 'animuse:replay') return;
    manual = false; clearTimeout(demoTimer); clearTimeout(demoTimer2); loadT = 0; go('idle'); demo();
  });
  if (reduce) { // 减少动态：瞬间切形状，不做弹簧
    K = 1e5; C = 600; STAG = 0;
  }
  render(); requestAnimationFrame(frame);
  if (!reduce) demo();
})();
