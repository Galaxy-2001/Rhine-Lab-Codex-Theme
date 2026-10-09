# 新版介绍素材

对应 Codex 1.1.0 / DSH 1.2.0。界面 PNG 为发布素材绘制的预览，非客户端截图，不包含个人会话。GIF 直接渲染 `runtime/assets/watermark-light.svg`，按 8 fps 记录完整 14 秒循环；同时推进 SVG SMIL 和 CSS 动画时钟。

渲染脚本：`scripts/render-doc-previews.mjs`，需要 DSH 开发依赖中的 Playwright 与 Windows Edge。运行后生成 PNG 和 `.checks/frames` 下的临时帧。使用 FFmpeg 的 palettegen/paletteuse 可将帧合成为 GIF。临时帧不进入 Git 或发布包。
