# 光标点击 + 盖章 · Cursor Click & Stamp

![preview](preview.png)

假光标沿弧线滑到按钮上，按下、按钮下沉，然后一枚印章从高处加速砸下来，落地那一下整张卡片跟着震。适合做产品演示。

- 分类：微交互
- 技术：CSS / JS / WAAPI，无依赖，直接双击 `index.html` 就能看

## 怎么做的

全部用 element.animate() 串成 async 时间线。光标的中间关键帧偏上形成弧线；印章用 ease-in 曲线（越落越快）从 scale(2.6) rotate(-26deg) 到 scale(1) rotate(-12deg)，mix-blend-mode: multiply 像印泥。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--travel` | `900ms` | 光标移动时长 |
| `--press` | `120ms` | 按下时长 |
| `--slam` | `260ms` | 印章落下时长 |
| `--accent` | `#ff5a36` | 印章颜色 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

印章文字改 .stamp 里的两行；光标目标是 #btn，换成任何元素都行。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — A fake cursor arcs to the button, presses it down, then a stamp slams in from above and the whole card jolts on impact. Great for product demos.

One async timeline of element.animate() calls. A raised middle keyframe gives the cursor its arc; the stamp falls with an ease-in curve from scale(2.6) rotate(-26deg) to scale(1) rotate(-12deg), multiply-blended like ink.

| Param | Default | Notes |
| --- | --- | --- |
| `--travel` | `900ms` | cursor travel time |
| `--press` | `120ms` | press duration |
| `--slam` | `260ms` | stamp slam duration |
| `--accent` | `#ff5a36` | stamp color |

Change the two lines inside .stamp; the cursor targets #btn, point it at any element.
