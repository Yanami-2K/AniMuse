# 复制按钮变形 · Copy Button Morph

![preview](preview.png)

点一下复制：图标换成一笔画出来的勾，文字上下替换，按钮宽度顺滑地变长、变绿，过两秒自己还原。本站的「复制 Prompt」就是它。

- 分类：按钮
- 技术：CSS / JS / WAAPI，无依赖，直接双击 `index.html` 就能看

## 怎么做的

宽度动画是关键：先量出两段文字的 scrollWidth，用 WAAPI 在 width 之间过渡；勾用 stroke-dashoffset 画出来；文字两行叠在一起 translateY(-100%) 切换。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--dur` | `420ms` | 形变时长 |
| `--ease` | `cubic-bezier(.65, 0, .35, 1)` | 形变曲线 |
| `--hold` | `1800ms` | 停留多久再还原 |
| `--ok` | `#17a34a` | 成功色 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

要复制的内容放在 data-text 上，或者改 copy() 里的 writeText。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — Click to copy: the icon swaps to a hand-drawn tick, the label rolls to the new text, the button smoothly widens and turns green, then reverts. The site’s own Copy Prompt button.

The width is the trick: measure both labels’ scrollWidth and animate width with WAAPI; the tick draws via stroke-dashoffset; the two labels are stacked and switched with translateY(-100%).

| Param | Default | Notes |
| --- | --- | --- |
| `--dur` | `420ms` | morph duration |
| `--ease` | `cubic-bezier(.65, 0, .35, 1)` | morph easing |
| `--hold` | `1800ms` | time before reverting |
| `--ok` | `#17a34a` | success color |

Put the text to copy in data-text, or change writeText in copy().
