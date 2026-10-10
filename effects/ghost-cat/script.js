/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Ghost Cat & Firefly — 一个 rAF 时间线驱动整段表演；所有姿态都是“目标值 + 弹簧”，所以切换时自带过冲和余震
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var FLOAT = num('--float'), AMP = num('--amp'), TRACK = num('--track');
  var $ = function (id) { return document.getElementById(id); };
  var scene = $('scene'), bodyT = $('bodyT'), tail = $('tail'), eyeL = $('eyeL'), eyeR = $('eyeR'), happy = $('happy');
  var blush = $('blush'), mouth = $('mouth'), gasp = $('gasp'), puff = $('puff'), fly = $('fly'), glow = $('flyGlow'), wing = $('wing'), pool = $('pool'), cat = $('cat');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function S(v, k, c) { return { v: v, t: v, vel: 0, k: k, c: c }; }       // 一维弹簧
  function step(s, h) { s.vel += (s.k * (s.t - s.v) - s.c * s.vel) * h; s.v += s.vel * h; }
  var sp = {
    sx: S(1, 260, 12), sy: S(1, 260, 12), ty: S(0, 200, 14), rot: S(0, 90, 10),           // 身体
    lx: S(0, 260, 22), ly: S(0, 260, 22), rx: S(0, 260, 22), ry: S(0, 260, 22),           // 眼珠
    lid: S(1, 500, 26), blush: S(.55, 60, 12), op: S(1, 300, 18), gasp: S(0, 300, 20)      // 眼皮 / 脸红 / 透明度 / 张嘴
  };
  var F = { x: 30, y: 60, vx: 0, vy: 0, tx: 30, ty: 60, k: 14, c: 5 };                   // 萤火虫
  var HEAD = { x: 100, y: 52 };
  var phase = 'wander', pt = 0, T = 0, ptr = null, lastPtr = -1e9, nearT = 0, happyT = 0, puffT = -9;

  function go(p) { phase = p; pt = 0; }
  function sneeze() { if (phase === 'wander' || phase === 'land' || phase === 'follow') go('inhale'); }

  function wanderTarget(t) { // 萤火虫在猫周围画一个不规则的 8 字
    return { x: 100 + Math.sin(t * .62) * 74 + Math.sin(t * 1.7) * 8, y: 82 + Math.sin(t * 1.24) * 40 + Math.cos(t * 2.3) * 7 };
  }

  function update(h) {
    T += h; pt += h;
    var fl = reduce ? 0 : Math.sin(T / FLOAT * Math.PI * 2) * AMP;      // 漂浮
    var autop = !ptr || performance.now() - lastPtr > 4000;
    if (!autop && (phase === 'wander' || phase === 'land')) go('follow');
    if (autop && phase === 'follow') go('wander');

    // ---- 每个阶段只改“目标值” ----
    sp.sx.t = sp.sy.t = 1; sp.ty.t = 0; sp.lid.t = 1; sp.op.t = 1; sp.gasp.t = 0; F.k = 14; F.c = 5;
    var head = { x: HEAD.x, y: HEAD.y + fl + sp.ty.v };
    if (phase === 'wander') {
      var w = wanderTarget(T); F.tx = w.x; F.ty = w.y;
      if (pt > 3.6) go('approach');
    } else if (phase === 'follow') {
      F.tx = ptr.x; F.ty = ptr.y; F.k = 40; F.c = 9;
      var dh = Math.hypot(F.x - head.x, F.y - head.y);
      nearT = dh < 20 ? nearT + h : 0;
      if (nearT > .7) { nearT = 0; go('land'); }
    } else if (phase === 'approach') {
      F.tx = head.x + 4; F.ty = head.y - 6; F.k = 22; F.c = 8;
      if (pt > 1.1) go('land');
    } else if (phase === 'land') {                                   // 落在头顶：斗鸡眼往上看，眼皮慢慢眯
      F.tx = head.x + 4; F.ty = head.y - 6; F.k = 300; F.c = 30;
      if (pt > .5) sp.lid.t = .8;
      if (pt > 1.4) go('inhale');
    } else if (phase === 'inhale') {                                 // 憋：吸气拉高、眯眼、张嘴
      F.tx = head.x + 4; F.ty = head.y - 6 - pt * 6; F.k = 300; F.c = 30;
      var k = Math.min(1, pt / .75);
      sp.sx.t = 1 - .05 * k; sp.sy.t = 1 + .09 * k; sp.ty.t = -3 * k; sp.lid.t = .35; sp.gasp.t = k;
      sp.rot.t = -4 * k;
      if (pt > .85) { go('achoo'); F.vx = (Math.random() < .5 ? -1 : 1) * 260; F.vy = -330; puffT = T; sp.sx.vel += 6; sp.sy.vel -= 8; sp.rot.vel += 120; }
    } else if (phase === 'achoo') {                                  // 阿嚏：猛压扁 + 一瞬间“灵体化”变透明，萤火虫被喷飞
      F.k = 0; F.c = 2.6; sp.sx.t = 1.1; sp.sy.t = .9; sp.ty.t = 5; sp.lid.t = .08; sp.op.t = pt < .12 ? .35 : 1; sp.rot.t = 6;
      if (pt > .22) go('shy');
    } else if (phase === 'shy') {                                    // 回弹、脸红、眯眼笑
      F.k = pt < .5 ? 0 : 6; F.c = 3; var w2 = wanderTarget(T); F.tx = w2.x; F.ty = w2.y;
      sp.rot.t = 0; sp.blush.t = 1;
      if (pt > 1.8) { sp.blush.t = .55; go(autop ? 'wander' : 'follow'); }
    }
    if (phase !== 'achoo' && phase !== 'inhale') sp.rot.t = phase === 'shy' ? 0 : Math.max(-6, Math.min(6, (F.x - 100) / 14));
    happyT = phase === 'shy' && pt > .25 ? 1 : 0;

    // ---- 眼珠看萤火虫（落在头上时自然变成斗鸡眼） ----
    [[sp.lx, sp.ly, 84], [sp.rx, sp.ry, 116]].forEach(function (e) {
      var dx = F.x - e[2], dy = F.y - (112 + fl), d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 60) * 4.2;
      e[0].t = dx / d * m; e[1].t = dy / d * m;
      e[0].k = e[1].k = TRACK * 30;
    });

    // ---- 积分 ----
    for (var key in sp) step(sp[key], h);
    F.vx += (F.k * (F.tx - F.x) - F.c * F.vx) * h; F.vy += (F.k * (F.ty - F.y) - F.c * F.vy) * h;
    F.x += F.vx * h; F.y += F.vy * h;
    return fl;
  }

  function render(fl) {
    bodyT.setAttribute('transform', 'translate(0 ' + (fl + sp.ty.v).toFixed(2) + ') translate(100 168) rotate(' + sp.rot.v.toFixed(2) + ') scale(' + sp.sx.v.toFixed(4) + ' ' + sp.sy.v.toFixed(4) + ') translate(-100 -168)');
    cat.style.opacity = sp.op.v.toFixed(3);
    tail.setAttribute('transform', 'rotate(' + (Math.sin(T * 3.4) * 11).toFixed(2) + ' 140 146)');
    var lid = Math.max(.06, sp.lid.v);
    eyeL.setAttribute('transform', 'translate(' + sp.lx.v.toFixed(2) + ' ' + sp.ly.v.toFixed(2) + ') translate(84 112) scale(1 ' + lid.toFixed(3) + ') translate(-84 -112)');
    eyeR.setAttribute('transform', 'translate(' + sp.rx.v.toFixed(2) + ' ' + sp.ry.v.toFixed(2) + ') translate(116 112) scale(1 ' + lid.toFixed(3) + ') translate(-116 -112)');
    eyeL.style.opacity = eyeR.style.opacity = 1 - happyT; happy.style.opacity = happyT;
    blush.style.opacity = sp.blush.v.toFixed(3);
    var g = Math.max(0, Math.min(1, sp.gasp.v));
    mouth.style.opacity = 1 - g; gasp.style.opacity = g;
    gasp.setAttribute('transform', 'translate(100 129) scale(' + (.5 + g * .6).toFixed(3) + ') translate(-100 -129)');
    var pa = T - puffT; puff.querySelectorAll('path').forEach(function (p, i) {
      var k = Math.max(0, Math.min(1, pa / .45)); p.style.opacity = pa < .45 ? (1 - k) : 0;
      p.setAttribute('transform', 'translate(0 ' + (fl * 0 + k * 8).toFixed(1) + ')');
      p.style.strokeDasharray = '20'; p.style.strokeDashoffset = (20 - 20 * Math.min(1, k * 2.5)).toFixed(1);
    });
    pool.setAttribute('rx', (44 - fl * 1.5).toFixed(1)); pool.style.opacity = (.16 - fl * .006).toFixed(3);
    // 萤火虫：一明一暗地呼吸，翅膀快速扇
    var flick = .75 + .25 * Math.sin(T * 5.3) * Math.sin(T * 2.1);
    if (phase === 'achoo') flick = 1.4;
    fly.setAttribute('transform', 'translate(' + F.x.toFixed(2) + ' ' + F.y.toFixed(2) + ')');
    glow.setAttribute('r', (18 + flick * 8).toFixed(1)); glow.style.opacity = Math.min(1, flick).toFixed(3);
    wing.setAttribute('transform', 'scale(1 ' + (phase === 'land' || phase === 'inhale' ? .5 : (.3 + Math.abs(Math.sin(T * 40)) * .9)).toFixed(2) + ')');
  }

  // ---- 指针 = 萤火虫 ----
  function toSvg(e) { var p = scene.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(scene.getScreenCTM().inverse()); }
  addEventListener('pointermove', function (e) { var p = toSvg(e); ptr = { x: p.x, y: p.y }; lastPtr = performance.now(); });
  scene.addEventListener('click', function (e) { var p = toSvg(e); if (Math.abs(p.x - 100) < 46 && p.y > 50 && p.y < 172) sneeze(); });
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { ptr = null; go('wander'); T = 0; } });

  if (reduce) { F.x = 150; F.y = 50; sp.lx.v = sp.rx.v = 3; sp.ly.v = sp.ry.v = -3; render(0); return; }
  var last = performance.now(), acc = 0, fl = 0;
  (function frame(t) {
    acc += Math.min(.05, (t - last) / 1000); last = t;
    while (acc > 1 / 240) { fl = update(1 / 240); acc -= 1 / 240; }
    render(fl); requestAnimationFrame(frame);
  })(last);
})();
