# 遮罩逐行升起 · Masked Line Reveal

![preview](preview.png)

大标题每一行从看不见的遮罩下面升上来，带一点点旋转，行间错峰，最后一条细线画出来。进入视口才触发。

- 分类：滚动
- 技术：CSS / JS，无依赖，直接双击 `index.html` 就能看

## 怎么做的

每行外层 overflow:hidden，内层 translate3d(0,105%,0) rotate(2.5deg) → none；IntersectionObserver 加 .in；transition-delay 递增。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--dur` | `1000ms` | 每行上升时长 |
| `--stagger` | `110ms` | 行间错峰 |
| `--ease` | `cubic-bezier(.2, .9, .1, 1)` | 出手快、收尾很软 |
| `--rise` | `105%` | 起始位置（相对行高） |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

每一行用 <span class="ln"><span>…</span></span> 包起来；正式用时删掉 script.js 里那行循环的 setTimeout。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — Each headline line rises out from under an invisible mask with a hint of rotation, staggered, then a hairline draws in. Fires when it enters the viewport.

Outer line is overflow:hidden; inner goes translate3d(0,105%,0) rotate(2.5deg) → none. IntersectionObserver adds .in; transition-delay steps per line.

| Param | Default | Notes |
| --- | --- | --- |
| `--dur` | `1000ms` | rise duration per line |
| `--stagger` | `110ms` | delay between lines |
| `--ease` | `cubic-bezier(.2, .9, .1, 1)` | snappy start, very soft end |
| `--rise` | `105%` | start offset (of line height) |

Wrap each line in <span class="ln"><span>…</span></span>; remove the demo loop setTimeout in script.js.
