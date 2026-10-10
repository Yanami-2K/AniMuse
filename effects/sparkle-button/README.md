# 闪光按钮 · Sparkle Button

![preview](preview.png)

> **原作：[Jhey Tompkins](https://codepen.io/jh3y/pen/LYJMPBL)**（MIT）。这是移植版：原生、单文件夹、配色和尺寸做了适配，加了自动演示和中英文。版权声明见同目录 `LICENSE`。

悬停时按钮和整页背景一起亮起来：边上一道光绕圈扫过，三颗星依次弹一下，身后一圈小星星慢慢公转。

- 分类：按钮
- 技术：CSS / JS，无依赖，直接双击 `index.html` 就能看

## 怎么做的

一个变量 --active（0 / 1）驱动所有颜色、发光和缩放，body:has(button:hover) 让整页背景一起变。边缘光是 conic-gradient 以 steps(2) 翻面绕圈；粒子各自绕一个很远的 transform-origin 旋转，所以看起来是在漂。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--spark` | `1.8s` | 边缘光转一圈的时长 |
| `--transition` | `.25s` | 亮起 / 熄灭的过渡 |
| `--hue` | `260` | 主色相 |

CSS 变量在 `style.css` 顶部的 `:root` 里。

## 搬到自己项目里

AI 生成、升级、主行动按钮。整页变色比较“抢戏”，嵌在页面里时可以把 body:has 那条去掉。

所有动画都尊重 `prefers-reduced-motion: reduce`。

---

**EN** — On hover the button and the whole page light up together: a glint sweeps around the edge, three stars bounce in turn and a halo of tiny stars slowly orbits behind.

> **Original by [Jhey Tompkins](https://codepen.io/jh3y/pen/LYJMPBL)** (MIT). Ported to vanilla, self-contained form with palette tweaks, a self-demo and i18n. Copyright notice in `LICENSE`.

A single --active variable (0 / 1) drives every color, glow and scale; body:has(button:hover) brightens the whole page. The edge glint is a conic-gradient flipping round with steps(2); each particle rotates around a far-away transform-origin, so it seems to drift.

| Param | Default | Notes |
| --- | --- | --- |
| `--spark` | `1.8s` | glint loop duration |
| `--transition` | `.25s` | light-up transition |
| `--hue` | `260` | hue |

AI “generate”, upgrade or primary CTAs. The full-page glow is loud; drop the body:has rule when embedding.
