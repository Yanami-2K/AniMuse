# 荧光笔 + 评论图钉 · Review Pin Drop

![preview](preview.png)

荧光笔从左到右划过一句话（跨行也连续），图钉从上方掉下来钉在句尾，落地压扁回弹，评论卡跟着弹出来。

- 分类：卡片
- 技术：CSS / JS / WAAPI，无依赖，直接双击 `index.html` 就能看

## 怎么做的

mark 用 linear-gradient 背景，background-size 从 0% 过渡到 100%，配合 box-decoration-break: clone 跨行；图钉位置用 getClientRects() 取最后一行的末尾。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--sweep` | `650ms` | 划线时长 |
| `--drop` | `520ms` | 图钉下落 + 回弹时长 |
| `--marker` | `#ffe066` | 荧光笔颜色 |
| `--accent` | `#ff5a36` | 图钉颜色 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

任何一段文字里用 <mark id="hl"> 包住要标的部分就行。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — A highlighter sweeps a phrase left to right (continuous across line breaks), a pin drops onto the end of it with a squash-and-bounce, then a comment card springs in.

The mark has a linear-gradient background animated from 0% to 100% background-size, with box-decoration-break: clone for line wraps; the pin is placed at the end of the last rect from getClientRects().

| Param | Default | Notes |
| --- | --- | --- |
| `--sweep` | `650ms` | sweep duration |
| `--drop` | `520ms` | pin drop + bounce |
| `--marker` | `#ffe066` | highlighter color |
| `--accent` | `#ff5a36` | pin color |

Wrap the target phrase in <mark id="hl"> inside any paragraph.
