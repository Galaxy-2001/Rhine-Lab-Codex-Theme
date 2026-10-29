# Pioneer 终端面板

Codex 1.2.0 / DeepSeek Harness 1.3.0，2026-10-30。

- 奶油白与石墨黑、暖色面板与莱茵橙。侧栏采用 Terminal 大标题、淡倒影、双语 New chat 卡片和橙 / 黄 / 青三色细边。
- 顶栏保留原生菜单、窗口按钮和拖动区，加入 RHINE LAB 与客户端名称。浅深模式分别与 Windows 原生窗口按钮统一底色；DeepSeek Harness 完整拼写，小窗口隐藏装饰以保留操作空间。
- Codex 原生聊天标题下增加 32px 任务标签行，正文同步预留空间。输入框外框和主聊天宽度保持原样。
- 中央水印强度为 **16%**，透明度仅作用于素材。正文、卡片和聊天容器保持 opacity 1，没有整页滤镜。
- 保留折片自转、光照阴影、同轮廓压平、循环缺口、正号旋转放大和减号横向展开；全部由代码生成。
- 聊天和设置共用水印与刻度，装饰不接收鼠标事件。DeepSeek Harness 的品牌按钮样式仅匹配实际品牌节点，不再误选侧栏开关。

## 实际客户端

两端仍使用各自原生界面、设置导航与交互。Codex 使用已验证的主题入口；DeepSeek Harness 使用官方插件管理器和皮肤中心，没有修改宿主程序。

![Codex 浅色实机](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/docs/media/codex-chat-light-1.2.0.png)

![DeepSeek Harness 浅色实机](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/dsh/docs/market/dsh-chat-light-1.3.0.png)

## 生成与验证

根目录执行 `node scripts/generate-pioneer.mjs`、`node scripts/generate-watermark.mjs`；DSH 目录执行 `npm run generate`。安装包携带生成结果，无需用户运行生成器。

`tests/pioneer.test.mjs` 检查 Codex 原生层级、重复应用、移除与布局。`dsh/tests/native-chrome.test.mjs` 使用皮肤中心转换后的 CSS 检查浅深模式、宽窄窗口、侧栏收起 / 展开、输入框点击与 Windows 标题栏读取的 body 色值。

实际桌面验证覆盖官方 Codex 26.1023.6621.0 与 DeepSeek Harness 0.2.1-rc.3 的浅深模式、设置页、标题栏和背景动画。网页夹具与实际客户端检查分别记录在两端验证文档中；未宣称在第二台电脑验证。
