// Phantom Results — 一条 async 时间线；任何一步都能“跳到结尾”（点击 / 空格），Replay 从头来
// 灵感：Persona 5 的结算画面。图形 / 角色 / 代码均为原创
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var EXP = num('--exp'), COIN = num('--coin'), COUNT = num('--count'), FILL = num('--fill');
  var $ = function (id) { return document.getElementById(id); };
  var scene = $('scene'), band = $('band'), slash = $('slash'), title = $('title'), exp = $('exp'), coin = $('coin'), fill = $('fill'), stamp = $('stamp'), items = $('items'), cat = $('cat'), body = $('catBody'), paw = $('paw'), hat = $('hat'), replay = $('replay'), lv = $('lv');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
  var LOOT = LANG === 'en' ? [['Thief gloves', '×1'], ['Catnip', '×3'], ['Calling card', '×2']] : [['怪盗手套', '×1'], ['猫薄荷', '×3'], ['预告函', '×2']];
  $('hint').textContent = LANG === 'en' ? 'CLICK / SPACE TO SKIP' : '点击 / 空格 跳过';
  scene.setAttribute('aria-label', LANG === 'en' ? 'Battle results' : '结算');
  var T = 'ReSuLtS', cls = ['a', 'b', 'c', 'd', 'a', 'b', 'd'], rot = [-6, 7, -3, 5, -8, 4, -5], dy = [.1, -.3, .25, -.1, .2, -.25, .05];
  title.innerHTML = T.split('').map(function (ch, i) { return '<span class="' + cls[i] + '" style="--r:' + rot[i] + 'deg;--y:' + dy[i] + 'rem;transform:rotate(' + rot[i] + 'deg) translateY(' + dy[i] + 'rem)">' + ch + '</span>'; }).join('');
  items.innerHTML = LOOT.map(function (l) { return '<li><i></i>' + l[0] + ' <b>' + l[1] + '</b></li>'; }).join('');
  var letters = [].slice.call(title.children), lis = [].slice.call(items.children);
  var run = 0, anims = [], done = false, userAt = -1e9;
  var wait = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function A(el, k, o) { var a = el.animate(k, Object.assign({ fill: 'forwards' }, o)); anims.push(a); return a; }
  function counter(el, to, dur, id) { // 计数：数字越跑越慢（ease-out），每次变化都“冲”一下（缩放随剩余量递减）
    return new Promise(function (res) {
      var t0 = performance.now(), last = -1;
      (function f(t) { if (id !== run) return res();
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = Math.round(to * e);
        if (v !== last) { el.textContent = '+' + v; last = v; el.style.transform = 'scale(' + (1 + .22 * (1 - p)) + ') rotate(' + (-3 * (1 - p)) + 'deg)'; }
        if (p < 1) requestAnimationFrame(f); else { el.style.transform = ''; A(el, [{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.2,1.6,.4,1)', fill: 'none' }); res(); } })(t0);
    });
  }
  async function play() {
    var id = ++run; done = false; anims.forEach(function (a) { a.cancel(); }); anims = [];
    reset();
    if (reduce) return finish();
    // 1. 一刀劈进来，红带展开
    A(slash, [{ transform: 'rotate(-24deg) scaleX(0)' }, { transform: 'rotate(-24deg) scaleX(1)', offset: .45 }, { transform: 'rotate(-24deg) scaleX(1) scaleY(0)' }], { duration: 420, easing: 'cubic-bezier(.7,0,.2,1)' });
    await wait(180, id);
    A(band, [{ transform: 'rotate(-12deg) scaleX(0)' }, { transform: 'rotate(-12deg) scaleX(1)' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.2,1)' });
    await wait(240, id);
    // 2. RESULTS 一个字母一个字母砸下来：从大到小 + 转一下，落地有过冲
    letters.forEach(function (l, i) {
      A(l, [{ opacity: 0, transform: 'rotate(calc(var(--r) * 3)) translateY(var(--y)) scale(2.6)' }, { opacity: 1, transform: 'rotate(var(--r)) translateY(var(--y)) scale(.88)', offset: .7 }, { opacity: 1, transform: 'rotate(var(--r)) translateY(var(--y)) scale(1)' }], { duration: 220, delay: i * 70, easing: 'cubic-bezier(.5,0,.75,0)' });
    });
    await wait(letters.length * 70 + 160, id);
    // 3. 经验、金币依次滚动
    A($('r1'), [{ opacity: 0, transform: 'translateX(-3rem)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1)' });
    await counter(exp, EXP, COUNT, id);
    A($('r2'), [{ opacity: 0, transform: 'translateX(-3rem)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1)' });
    await counter(coin, COIN, COUNT * .7, id);
    // 4. 经验条灌满 → 闪一下 → LEVEL UP! 盖章
    A($('lvRow'), [{ opacity: 0, transform: 'translateX(-2rem)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.9,.3,1)' });
    await wait(200, id);
    A(fill, [{ transform: 'scaleX(' + FILL + ')' }, { transform: 'scaleX(1)' }], { duration: 520, easing: 'cubic-bezier(.5,0,.6,1)' });
    await wait(520, id);
    fill.parentNode.classList.add('full'); lv.textContent = '24';
    A(fill.parentNode, [{ transform: 'skewX(-20deg) scale(1)' }, { transform: 'skewX(-20deg) scale(1.15,1.5)', offset: .3 }, { transform: 'skewX(-20deg) scale(1)' }], { duration: 300, easing: 'ease-out', fill: 'none' });
    A(stamp, [{ transform: 'rotate(-30deg) scale(3)', opacity: 0 }, { transform: 'rotate(-6deg) scale(.9)', opacity: 1, offset: .65 }, { transform: 'rotate(-8deg) scale(1)', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.5,0,.75,0)' });
    A(scene, [{ transform: 'none' }, { transform: 'translate(4px,-3px)', offset: .25 }, { transform: 'translate(-3px,2px)', offset: .5 }, { transform: 'translate(2px,1px)', offset: .75 }, { transform: 'none' }], { duration: 200, delay: 200, fill: 'none' });
    await wait(380, id);
    // 5. 战利品斜着滑进来；猫跳出来比胜利
    lis.forEach(function (li, i) { A(li, [{ opacity: 0, transform: 'skewX(-14deg) translateX(6rem)' }, { opacity: 1, transform: 'skewX(-14deg) translateX(-.4rem)', offset: .7 }, { opacity: 1, transform: 'skewX(-14deg)' }], { duration: 320, delay: i * 90, easing: 'cubic-bezier(.2,.9,.3,1)' }); });
    A($('catbg'), [{ opacity: 0, transform: 'skewX(-14deg) rotate(-8deg) translateX(110%)' }, { opacity: 1, transform: 'skewX(-14deg) rotate(-8deg)' }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1)' });
    A(cat, [{ opacity: 0, transform: 'translateY(60%) rotate(12deg)' }, { opacity: 1, transform: 'translateY(-6%) rotate(-5deg)', offset: .6 }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 120, easing: 'cubic-bezier(.2,.9,.3,1)' });
    A(paw, [{ transform: 'rotate(40deg) translateY(30px)' }, { transform: 'rotate(-12deg)', offset: .6 }, { transform: 'rotate(0)' }], { duration: 420, delay: 380, easing: 'cubic-bezier(.2,1.5,.4,1)' });
    A(hat, [{ transform: 'none' }, { transform: 'translateY(-14px) rotate(-14deg)', offset: .5 }, { transform: 'rotate(6deg)' }], { duration: 420, delay: 420, easing: 'cubic-bezier(.2,1.5,.4,1)' });
    await wait(700, id);
    A(replay, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    done = true;
    // 卡片预览：停一会儿自己重播
    await wait(3200, id); if (performance.now() - userAt > 6000) play();
  }
  function reset() {
    [band, slash].forEach(function (e) { e.style.transform = ''; });
    letters.concat(lis, [$('r1'), $('r2'), $('lvRow'), cat, $('catbg'), replay]).forEach(function (e) { e.style.opacity = ''; });
    exp.textContent = '+0'; coin.textContent = '+0'; lv.textContent = '23'; fill.parentNode.classList.remove('full'); stamp.style.transform = '';
  }
  function finish() { // 跳到结尾：所有东西直接停在最终状态
    run++; anims.forEach(function (a) { a.cancel(); }); anims = [];
    band.style.transform = 'rotate(-12deg) scaleX(1)'; slash.style.transform = '';
    letters.concat(lis, [$('r1'), $('r2'), $('lvRow'), cat, $('catbg'), replay]).forEach(function (e) { e.style.opacity = 1; });
    exp.textContent = '+' + EXP; coin.textContent = '+' + COIN; lv.textContent = '24'; fill.style.transform = 'scaleX(1)'; fill.parentNode.classList.add('full');
    stamp.style.transform = 'rotate(-8deg) scale(1)'; done = true;
  }
  scene.addEventListener('click', function (e) { if (e.target === replay) return; userAt = performance.now(); if (!done) finish(); });
  replay.addEventListener('click', function (e) { e.stopPropagation(); userAt = performance.now(); fill.style.transform = ''; play(); });
  addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); userAt = performance.now(); if (!done) finish(); else { fill.style.transform = ''; play(); } } });
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { fill.style.transform = ''; userAt = -1e9; play(); } });
  if (reduce) finish(); else play();
})();
