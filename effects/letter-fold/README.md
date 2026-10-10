# 折信寄出 · Fold & Send Letter

![preview](preview.png)

信纸真的在 3D 里折三折（背面写着收件人），掉进航空信封，封盖合上，火漆印砸下来，整封信先往下蓄力再“嗖”地飞走。做“发送成功”反馈很合适。

- 分类：转场
- 技术：CSS 3D / JS / WAAPI，无依赖，直接双击 `index.html` 就能看

## 怎么做的

信纸是三块面板，上下两块各有正反面（backface-visibility: hidden），分别绕自己的边 rotateX(±180°)，再 translateZ 几像素避免和中间那块抢层级。坑：给 preserve-3d 的元素做 opacity 动画会把 3D 拍扁，所以淡入放在外层。信封封盖用 scaleY(−1→1)，翻过中线时换 z-index。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--fold` | `520ms` | 每折一下的时长 |
| `--fly` | `700ms` | 飞走的时长 |
| `--red` | `#e8452c` | 航空条纹 / 火漆颜色 |
| `--blue` | `#2f5fd0` | 航空条纹蓝 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

在提交成功的回调里调一次 play() 就行；信纸正面是普通 HTML（#sheetTpl），换成你的表单摘要会很有意思。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — The letter folds in thirds in real 3D (the back shows the addressee), drops into an airmail envelope, the flap closes, a wax seal slams on, and the whole thing winds up and whooshes away. A lovely “sent” confirmation.

Three panels; top and bottom have front and back faces (backface-visibility: hidden) and rotateX(±180°) about their own edge, with a few px of translateZ so they do not fight the middle panel. Gotcha: animating opacity on a preserve-3d element flattens it, so the fade lives on a wrapper. The flap uses scaleY(−1→1) and swaps z-index as it passes the middle.

| Param | Default | Notes |
| --- | --- | --- |
| `--fold` | `520ms` | duration per fold |
| `--fly` | `700ms` | fly-away duration |
| `--red` | `#e8452c` | airmail stripe / wax color |
| `--blue` | `#2f5fd0` | airmail stripe blue |

Call play() from your submit-success callback; the letter face is plain HTML (#sheetTpl), so drop in a summary of what was sent.
