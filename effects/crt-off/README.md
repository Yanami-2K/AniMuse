# 老电视关机 · CRT Power Off

![preview](preview.png)

画面先被压成一条发亮的细线，再缩成一个点，然后熄灭；开机就倒着放。做转场、关弹窗都很有梗。

- 分类：转场
- 技术：CSS / JS / WAAPI，无依赖，直接双击 `index.html` 就能看

## 怎么做的

四个关键帧：scale(1,1) → scale(1.02, 2px/高) 同时 brightness(3) → scale(6px/宽, 2px/高) → scale(0)；倒放时把 offset 换成 1-offset。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--off` | `560ms` | 关机总时长 |
| `--on` | `640ms` | 开机总时长 |
| `--screen` | `#fffdf8` | 屏幕底色 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

拿 frames() 给任何一个容器用就行，比如关闭弹窗时对弹窗内容播一遍。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — The picture squashes into a bright line, shrinks to a dot, then goes dark; power-on is the same thing reversed. A fun transition or modal close.

Four keyframes: scale(1,1) → scale(1.02, 2px/h) with brightness(3) → scale(6px/w, 2px/h) → scale(0); for power-on reverse the list and map offset to 1 − offset.

| Param | Default | Notes |
| --- | --- | --- |
| `--off` | `560ms` | power-off duration |
| `--on` | `640ms` | power-on duration |
| `--screen` | `#fffdf8` | screen color |

Apply frames() to any container, e.g. play it on a modal’s content when closing.
