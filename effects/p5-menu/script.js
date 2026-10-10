// Phantom Menu — 每次切换：碎片用 WAAPI 从旧行“甩”到新行（中间一帧拉长 = 拖影），落位时过冲；文字反色 + 放大，其它行抖一下
// 灵感：Persona 5 的 UI 语言。图形 / 角色 / 代码均为原创
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var SLAM = num('--slam'), WIPE = num('--wipe');
  var $ = function (id) { return document.getElementById(id); };
  var scene = $('scene'), menu = $('menu'), cat = $('cat'), body = $('catBody'), hat = $('hat'), paw = $('paw'), eyes = $('eyes'), panel = $('panel'), w1 = $('w1'), w2 = $('w2');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
  var ITEMS = LANG === 'en'
    ? [['CHALLENGE', 'TONIGHT’S HEIST', ['Steal the deadline', 'Leave a calling card', 'Escape before stand-up']], ['GEAR', 'LOADOUT', ['Grappling hook ×1', 'Catnip smoke ×3', 'Lock pick ×5']], ['FILES', 'CASE FILES', ['Target: legacy code', 'Weakness: unit tests', 'Status: confident']], ['SETTINGS', 'SETTINGS', ['Text speed: fast', 'Motion: full', 'Meow volume: 11']]]
    : [['挑战', '今晚的目标', ['偷走截止日期', '留下一张预告函', '赶在站会前撤离']], ['装备', '随身装备', ['钩爪 ×1', '猫薄荷烟雾弹 ×3', '万能钥匙 ×5']], ['档案', '目标档案', ['目标：祖传代码', '弱点：单元测试', '状态：很有自信']], ['设置', '设置', ['文字速度：快', '动效：全开', '喵声音量：11']]];
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
  $('back').textContent = LANG === 'en' ? 'BACK' : '返回';
  // 剪报标题：大小写混排，每个字母随机一种“剪纸”、角度、上下错位（固定种子，刷新也一样）
  var T = 'MeNu', cls = ['a', 'b', 'c', 'd'], rot = [-7, 5, -3, 8], dy = [.1, -.25, .2, -.1];
  $('title').innerHTML = T.split('').map(function (ch, i) { return '<span class="' + cls[i] + '" style="transform:rotate(' + rot[i] + 'deg) translateY(' + dy[i] + 'rem)">' + ch + '</span>'; }).join('');
  menu.innerHTML = ITEMS.map(function (it, i) { return '<li role="menuitem" tabindex="-1" data-i="' + i + '"><span class="lab">' + it[0] + '</span></li>'; }).join('');
  var rows = [].slice.call(menu.children), shard = document.createElement('div'); shard.className = 'shard'; shard.innerHTML = '<i class="r"></i><i class="w"></i>'; menu.appendChild(shard);
  shard.style.left = '0'; shard.style.top = '0';
  var sel = -1, inPanel = false, busy = false;
  var POSES = [ // 每个选项一个猫的姿势：身体角度 / 帽子角度 / 爪子角度 / 眼睛位移
    { b: -4, h: -10, p: 0, e: 0 }, { b: 6, h: 14, p: -38, e: 2 }, { b: -9, h: -4, p: 20, e: -2 }, { b: 3, h: 22, p: -70, e: 1 }
  ];
  function rowBox(i) { var r = rows[i]; return { x: r.offsetLeft - 8, y: r.offsetTop + (r.offsetHeight - shard.offsetHeight) / 2, w: rows[i].querySelector('.lab').offsetWidth + 40 }; }
  function select(i, quiet) {
    if (i === sel || inPanel) return; var from = sel; sel = i;
    rows.forEach(function (r, k) { r.classList.toggle('on', k === i); r.setAttribute('aria-selected', String(k === i)); });
    var b = rowBox(i), to = 'translate(' + b.x + 'px,' + b.y + 'px)', sw = b.w / shard.offsetWidth;
    if (reduce || quiet) { shard.style.transform = to + ' scaleX(' + sw + ')'; pose(i, true); return; }
    if (from < 0) { // 第一次：从左边砸进来，过冲再回弹
      shard.animate([{ transform: to + ' translateX(-120%) scaleX(' + sw * 1.4 + ') skewX(-20deg)' }, { transform: to + ' translateX(6%) scaleX(' + sw * 1.06 + ') skewX(4deg)', offset: .6 }, { transform: to + ' scaleX(' + sw + ')' }], { duration: SLAM, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    } else { // 换行：中间那一帧把碎片沿竖直方向拉长，像拖影；落位过冲
      var a = rowBox(from), mid = 'translate(' + ((a.x + b.x) / 2) + 'px,' + ((a.y + b.y) / 2) + 'px)';
      shard.animate([{ transform: 'translate(' + a.x + 'px,' + a.y + 'px) scaleX(' + (a.w / shard.offsetWidth) + ')' }, { transform: mid + ' scaleX(' + sw * .85 + ') scaleY(' + (1.6 + Math.abs(b.y - a.y) / 120) + ') skewX(-18deg)', offset: .35 }, { transform: to + ' scaleX(' + sw * 1.08 + ') scaleY(.86) skewX(3deg)', offset: .7 }, { transform: to + ' scaleX(' + sw + ')' }],
        { duration: SLAM * .7, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
    }
    var lab = rows[i].querySelector('.lab');
    lab.animate([{ transform: 'scale(.9) rotate(4deg)' }, { transform: 'scale(1.28) rotate(-3deg)', offset: .45 }, { transform: 'scale(1.12) rotate(0)' }], { duration: SLAM, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    rows.forEach(function (r, k) { if (k === i) return; var l = r.querySelector('.lab'), s = k % 2 ? 1 : -1;
      l.animate([{ transform: 'none' }, { transform: 'translate(' + s * 3 + 'px,-2px) rotate(' + s * 3 + 'deg)', offset: .3 }, { transform: 'translate(' + -s * 2 + 'px,1px) rotate(' + -s * 1.5 + 'deg)', offset: .6 }, { transform: 'none' }], { duration: 240, easing: 'linear', fill: 'forwards' }); });
    pose(i);
  }
  function pose(i, instant) { // 猫从右边“探”出来换个姿势：先缩下去一点再弹上来
    var p = POSES[i], o = { duration: instant ? 1 : 320, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' };
    body.animate([{ transform: 'translate(30px, 30px) rotate(' + (p.b + 10) + 'deg) scale(.9)' }, { transform: 'rotate(' + p.b + 'deg)' }], o);
    hat.animate([{ transform: 'rotate(' + (p.h - 20) + 'deg) translateY(-6px)' }, { transform: 'rotate(' + p.h + 'deg)' }], o);
    paw.animate([{ transform: 'translate(-10px, 40px) rotate(' + (p.p + 30) + 'deg)', opacity: 0 }, { transform: 'rotate(' + p.p + 'deg)', opacity: 1 }], o);
    eyes.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + p.e + 'px)' }], o);
  }
  // 确认：红楔先扫，黑楔紧跟，黑楔盖住全屏的那一刻换成子面板；返回反过来
  function sweep(cb, back) {
    if (reduce) { cb(); return Promise.resolve(); }
    var from = back ? 'translateX(110%) skewX(-24deg)' : 'translateX(-110%) skewX(-24deg)', mid = 'translateX(0) skewX(-24deg)', to = back ? 'translateX(-110%) skewX(-24deg)' : 'translateX(110%) skewX(-24deg)';
    var o = { duration: WIPE, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' };
    w1.animate([{ transform: from }, { transform: mid, offset: .5 }, { transform: to }], o);
    w2.animate([{ transform: from }, { transform: mid, offset: .5 }, { transform: to }], Object.assign({}, o, { delay: 70 }));
    return new Promise(function (r) { setTimeout(function () { cb(); }, 70 + WIPE * .5); setTimeout(r, 70 + WIPE); });
  }
  function confirm() {
    if (inPanel || busy || sel < 0) return; busy = true; var it = ITEMS[sel];
    rows[sel].querySelector('.lab').animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1.32) rotate(-4deg)' }, { transform: 'scale(1.12)' }], { duration: 160 });
    sweep(function () {
      inPanel = true; $('pk').textContent = it[0]; $('ph').textContent = it[1]; $('pl').innerHTML = it[2].map(function (x) { return '<li>' + x + '</li>'; }).join(''); panel.hidden = false;
      if (!reduce) [].forEach.call($('pl').children, function (li, k) { li.animate([{ transform: 'skewX(-12deg) translateX(3rem)', opacity: 0 }, { transform: 'skewX(-12deg)', opacity: 1 }], { duration: 260, delay: 120 + k * 60, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }); });
    }).then(function () { busy = false; });
  }
  function backOut() { if (!inPanel || busy) return; busy = true; sweep(function () { inPanel = false; panel.hidden = true; }, true).then(function () { busy = false; }); }

  rows.forEach(function (r, i) {
    r.addEventListener('pointerenter', function (e) { if (e.isTrusted) user(); select(i); });
    r.addEventListener('click', function (e) { if (e.isTrusted) user(); select(i); confirm(); });
  });
  panel.addEventListener('click', function (e) { if (e.isTrusted) user(); backOut(); });
  addEventListener('keydown', function (e) {
    user();
    if (e.key === 'ArrowDown') { e.preventDefault(); select((sel + 1) % rows.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select((sel - 1 + rows.length) % rows.length); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); confirm(); }
    else if ((e.key === 'Escape' || e.key === 'Backspace') && inPanel) { e.preventDefault(); backOut(); }
  });

  // 自动演示：↓ ↓ ↓ 确认 → 停一会 → 返回 → ↑ ……
  var userAt = -1e9, run = 0, demoT = 0;
  function user() { userAt = performance.now(); }
  var wait = function (t, id) { return new Promise(function (r) { demoT = setTimeout(function () { if (id === run) r(); }, t); }); };
  async function demo() {
    var id = ++run; if (reduce) return;
    while (id === run) {
      if (performance.now() - userAt < 6000) { await wait(1000, id); continue; }
      for (var k = 0; k < 3; k++) { await wait(760, id); if (performance.now() - userAt < 6000) break; select((sel + 1) % rows.length); }
      if (performance.now() - userAt < 6000) continue;
      await wait(700, id); confirm(); await wait(2000, id); backOut(); await wait(900, id);
    }
  }
  function reset() { run++; clearTimeout(demoT); inPanel = false; busy = false; panel.hidden = true; sel = -1; userAt = -1e9; document.getAnimations().forEach(function (a) { a.cancel(); }); select(0); if (!reduce) demo(); }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') reset(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { var s = sel; sel = -1; select(s, true); }, 150); });
  if (reduce) { select(0, true); } else setTimeout(reset, 200);
})();
