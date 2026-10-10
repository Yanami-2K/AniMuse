# 文件掉进文件夹 · Folder Drop Bounce

![preview](preview.png)

文件夹前盖张开，文件越掉越快地落进去，前盖啪地合上，整个文件夹被压扁再弹回，角标 +1。经典的挤压与拉伸。

- 分类：微交互
- 技术：CSS / JS / WAAPI，无依赖，直接双击 `index.html` 就能看

## 怎么做的

前盖 rotateX(-38deg) 张开；文件 ease-in 下落；文件夹以底边为原点 scale(1.14,.86) → scale(.97,1.05) → 1；文件放在 back 和 front 之间，所以会被前盖挡住。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--fall` | `520ms` | 下落时长 |
| `--squash` | `.86` | 落地时纵向压扁到多少 |
| `--folder` | `#ffc85a` | 文件夹颜色 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

做上传反馈时，在上传成功回调里调一次下落 + squash 那几步即可。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — The folder flap swings open, the file accelerates in, the flap snaps shut, the folder squashes and springs back, and the badge ticks +1. Classic squash & stretch.

Flap opens with rotateX(-38deg); the file falls ease-in; the folder scales from its bottom edge 1.14×.86 → .97×1.05 → 1; the file sits between back and front in the DOM so the flap covers it.

| Param | Default | Notes |
| --- | --- | --- |
| `--fall` | `520ms` | fall duration |
| `--squash` | `.86` | vertical squash on impact |
| `--folder` | `#ffc85a` | folder color |

For upload feedback, run the fall + squash steps from your upload-success callback.
