// Lanyard Badge — Verlet：每个点只记“现在”和“上一帧”的位置，速度是两者之差；再反复把相邻点拉回固定距离
(function () {
  var root = document.documentElement, css = getComputedStyle(root);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var rem = function () { return parseFloat(getComputedStyle(root).fontSize); };
  var cv = document.getElementById('rope'), ctx = cv.getContext('2d');
  var badge = document.getElementById('badge'), face = badge.firstElementChild, sheen = document.getElementById('sheen'), finger = document.getElementById('finger');
  var nail = document.getElementById('nail');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEG = num('--segments'), AIR = num('--air');
  var pts = [], links = [], A, B, R, drag = null, dpr = 1, ry = 0, vry = 0;

  function P(x, y, w) { return { x: x, y: y, px: x, py: y, w: w }; } // w = 质量倒数，0 = 钉死
  function build() {
    R = rem(); var n = nail.getBoundingClientRect(), ax = n.left + n.width / 2, ay = n.top + n.height / 2;
    var L = num('--rope') * R / SEG;
    pts = []; links = [];
    for (var i = 0; i <= SEG; i++) pts.push(P(ax + i * .3, ay + i * L, i ? 1 : 0));
    A = pts[SEG];                                        // 绳子末端 = 工牌夹子
    B = P(A.x, A.y + 6.6 * R, .22);                      // 工牌重心：更“重”，所以质量倒数小
    pts.push(B);
    for (var j = 0; j < SEG; j++) links.push([pts[j], pts[j + 1], L, 1]);
    links.push([A, B, 6.6 * R, 1]);
    links.push([pts[SEG - 1], B, L + 6.6 * R, .02]);     // 很弱的一根“角度弹簧”：夹子处有点硬，不会对折
    cv.width = innerWidth * (dpr = Math.min(2, devicePixelRatio || 1)); cv.height = innerHeight * dpr;
  }

  function sim(dt) {
    var g = num('--gravity') * R;
    pts.forEach(function (p) {
      if (!p.w || p === drag) return;
      var vx = (p.x - p.px) * AIR, vy = (p.y - p.py) * AIR;
      p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + g * dt * dt;
    });
    if (drag) { drag.px = drag.x; drag.py = drag.y; drag.x += (drag.gx - drag.x) * .35; drag.y += (drag.gy - drag.y) * .35; }
    for (var it = 0; it < 18; it++) links.forEach(function (l) {
      var a = l[0], b = l[1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (l[3] < 1 && d < l[2]) return;                  // 弱弹簧只管拉，不管推
      var wa = a === drag ? 0 : a.w, wb = b === drag ? 0 : b.w, ws = wa + wb; if (!ws) return;
      var k = (d - l[2]) / d * l[3];
      if (l[3] === 1 && l[1] !== B && d < l[2]) return; // 绳子可以松弛：只在被拉长时才约束
      a.x += dx * k * wa / ws; a.y += dy * k * wa / ws; b.x -= dx * k * wb / ws; b.y -= dy * k * wb / ws;
    });
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    var s = getComputedStyle(root).getPropertyValue('--strap');
    var path = function () {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < SEG; i++) { var m = pts[i], n = pts[i + 1]; ctx.quadraticCurveTo(m.x, m.y, (m.x + n.x) / 2, (m.y + n.y) / 2); }
      ctx.lineTo(A.x, A.y);
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = 'rgba(20,40,30,.12)'; ctx.lineWidth = .9 * R; ctx.save(); ctx.translate(.25 * R, .35 * R); ctx.stroke(); ctx.restore();
    path(); ctx.strokeStyle = '#1c1a21'; ctx.lineWidth = .86 * R; ctx.stroke();
    path(); ctx.strokeStyle = s; ctx.lineWidth = .6 * R; ctx.stroke();
    path(); ctx.setLineDash([.32 * R, .26 * R]); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = .07 * R; ctx.stroke(); ctx.setLineDash([]);
    // 工牌：位置在 A，角度 = A→B 的方向；横向速度驱动一点 rotateY，像真的在空中转
    var ang = Math.atan2(B.y - A.y, B.x - A.x) - Math.PI / 2;
    var vx = (B.x - B.px) / R * 60;
    vry += ((Math.max(-55, Math.min(55, -vx * 1.6)) - ry) * 90 - vry * 9) / 120; ry += vry / 120 * 6;
    badge.style.transform = 'translate3d(' + A.x.toFixed(1) + 'px,' + (A.y - .2 * R).toFixed(1) + 'px,0) rotate(' + ang.toFixed(4) + 'rad)';
    face.style.transform = 'rotateY(' + ry.toFixed(2) + 'deg)';
    sheen.style.setProperty('--sx', (50 + ry * 1.4).toFixed(1) + '%');
  }

  // ---- 拖拽：抓住工牌就把重心点钉到指针上 ----
  function grab(x, y) {
    var r = face.getBoundingClientRect(); if (x < r.left - 10 || x > r.right + 10 || y < r.top - 10 || y > r.bottom + 10) return false;
    drag = B; B.gx = x; B.gy = y + (B.y - y) * .0; badge.classList.add('grab'); return true;
  }
  function moveTo(x, y) { if (drag) { drag.gx = x; drag.gy = y; } }
  function release() { if (!drag) return; var b = drag; drag = null; badge.classList.remove('grab'); b.px = b.x - (b.x - b.px) * 1.4; b.py = b.y - (b.y - b.py) * 1.4; }
  var real = false, lastReal = -1e9;
  addEventListener('pointerdown', function (e) { if (grab(e.clientX, e.clientY)) { real = true; lastReal = performance.now(); demoT0 = null; finger.className = 'finger'; } });
  addEventListener('pointermove', function (e) { if (real && drag) { moveTo(e.clientX, e.clientY); lastReal = performance.now(); } });
  addEventListener('pointerup', function () { if (real) { release(); lastReal = performance.now(); } });

  // ---- 自动演示：手指抓起工牌往一边拽高，松手 → 荡、绳子松了又绷紧 ----
  var demoT0 = null, side = 1, held = false;
  function demo(t) {
    if (demoT0 === null) { demoT0 = t; side = -side; }
    var e = (t - demoT0) / 1000, r = face.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .55;
    var sm = function (k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
    if (e < .6) { finger.classList.add('on'); var k = sm(e / .6); fx = cx + side * 5 * R * (1 - k); fy = cy + 4 * R * (1 - k); }
    else if (e < .75) { if (!held) { held = grab(fx, fy); finger.classList.add('down'); } }
    else if (e < 1.6) { var k2 = sm((e - .75) / .85); moveTo(hx + side * 8.6 * R * k2, hy - 6.2 * R * k2 + Math.sin(k2 * Math.PI) * 1.5 * R); fx = drag ? drag.x : fx; fy = drag ? drag.y : fy; }
    else if (e < 1.7) { if (held) { release(); held = false; finger.classList.remove('down'); } }
    else if (e < 2.2) { finger.classList.remove('on'); }
    if (e < .75) { hx = fx; hy = fy; }
    finger.style.transform = 'translate(' + fx + 'px,' + fy + 'px)';
    if (e > 5.6) demoT0 = null;
  }
  var fx = 0, fy = 0, hx = 0, hy = 0;

  var last = performance.now(), acc = 0;
  function frame(t) {
    var dt = Math.min(.05, (t - last) / 1000); last = t; acc += dt;
    if (!drag || !real) { if (real && t - lastReal > 6000 && !drag) real = false; if (!real) demo(t); }
    while (acc > 1 / 120) { sim(1 / 120); acc -= 1 / 120; }
    draw(); requestAnimationFrame(frame);
  }
  function settle() { for (var i = 0; i < 600; i++) sim(1 / 120); }
  addEventListener('resize', function () { build(); settle(); draw(); });
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { real = false; demoT0 = null; held = false; drag = null; } });
  build(); settle(); draw();
  if (reduce) return;
  requestAnimationFrame(frame);
})();
