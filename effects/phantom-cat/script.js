/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Phantom Thief Cat — 一条 async 时间线：冒头 → 看左右 → 抬帽 → 甩卡（边飞边转）→ 钉住 → 缩回
(function () {
  var css = getComputedStyle(document.documentElement);
  var RISE = parseFloat(css.getPropertyValue('--rise')), THROW = parseFloat(css.getPropertyValue('--throw')), SPIN = parseFloat(css.getPropertyValue('--spin'));
  var cat = document.getElementById('cat'), eyes = document.getElementById('eyes'), hat = document.getElementById('hat'), paw = document.getElementById('paw'), card = document.getElementById('card');
  var run = 0, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  var A = function (el, k, o) { return el.animate(k, Object.assign({ fill: 'forwards' }, o)); };
  async function play() {
    var id = ++run;
    [cat, eyes, hat, paw, card].forEach(function (el) { el.getAnimations().forEach(function (a) { a.cancel(); }); });
    card.style.setProperty('--pin', 0);
    if (reduce) { cat.style.transform = 'none'; card.style.opacity = 1; card.style.transform = 'rotate(6deg)'; card.style.setProperty('--pin', 1); return; }
    while (id === run) {
      await sleep(400, id);
      // 冒头：快速上来，过冲一点再落稳
      A(cat, [{ transform: 'translateY(25%)' }, { transform: 'translateY(-4%)', offset: .7 }, { transform: 'translateY(0)' }], { duration: RISE, easing: 'cubic-bezier(.2,.8,.3,1)' });
      await sleep(RISE + 150, id);
      // 左看右看（只动瞳孔）
      A(eyes, [{ transform: 'none' }, { transform: 'translateX(-4px)', offset: .2 }, { transform: 'translateX(-4px)', offset: .45 }, { transform: 'translateX(4px)', offset: .65 }, { transform: 'translateX(4px)', offset: .9 }, { transform: 'none' }], { duration: 1100, easing: 'ease-in-out', fill: 'none' });
      await sleep(1150, id);
      // 抬帽致意
      A(hat, [{ transform: 'none' }, { transform: 'translate(-2px,-14px) rotate(-16deg)', offset: .4 }, { transform: 'translate(-2px,-14px) rotate(-16deg)', offset: .6 }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'none' });
      await sleep(650, id);
      // 甩卡：爪子先往后蓄力再甩出去，卡片从爪子位置旋转飞到墙上
      A(paw, [{ transform: 'none' }, { transform: 'translate(-6px,4px)', offset: .4 }, { transform: 'translate(10px,-10px)', offset: .7 }, { transform: 'none' }], { duration: 420, easing: 'ease-out', fill: 'none' });
      await sleep(260, id);
      A(card, [
        { opacity: 0, transform: 'translate(-6rem,6rem) rotate(0) scale(.3)' },
        { opacity: 1, offset: .15 },
        { opacity: 1, transform: 'translate(0,0) rotate(' + (SPIN * 360 + 6) + 'deg) scale(1)' }
      ], { duration: THROW, easing: 'cubic-bezier(.15,.7,.3,1)' });
      await sleep(THROW, id);
      card.style.setProperty('--pin', 1);   // 落定瞬间出现图钉 + 一下压缩
      A(card, [{ transform: 'rotate(6deg) scale(1)' }, { transform: 'rotate(6deg) scale(.94)', offset: .3 }, { transform: 'rotate(6deg) scale(1)' }], { duration: 300, easing: 'ease-out' });
      await sleep(500, id);
      // 缩回去一半：只露出眼睛和帽子在墙头上偷看（舞台永远不空）
      A(cat, [{ transform: 'translateY(0)' }, { transform: 'translateY(-5%)', offset: .25 }, { transform: 'translateY(25%)' }], { duration: 460, easing: 'cubic-bezier(.5,0,.4,1)' });
      await sleep(700, id);
      A(eyes, [{ transform: 'none' }, { transform: 'translateX(5px)', offset: .3 }, { transform: 'translateX(5px)', offset: .8 }, { transform: 'none' }], { duration: 1300, easing: 'ease-in-out', fill: 'none' });
      await sleep(1700, id);
      A(card, [{ opacity: 1, transform: 'rotate(6deg)' }, { opacity: 0, transform: 'translateY(1rem) rotate(14deg)' }], { duration: 420, easing: 'ease-in' });
      await sleep(420, id); card.style.setProperty('--pin', 0);
    }
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') play(); });
  play();
})();
