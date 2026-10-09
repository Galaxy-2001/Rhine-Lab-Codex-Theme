# 莱茵生命 DSH 插件 1.2.0

同步 Codex 1.1.0 的中央立体动画：折片沿同一轮廓自转，用光照和遮挡呈现明暗，随后压平为标志。正号放大并旋转 90°，减号从细线横向展开。背景不占聊天或输入框布局空间。

保留 1.1.2 的深色提示框、悬浮提示文字对比度修复，以及皮肤中心背景控制。

![DSH 1.2.0 中央动画](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/docs/media/central-animation.gif)

![DSH 1.2.0 浅色聊天素材预览](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/docs/media/dsh-chat-light.png)

![DSH 1.2.0 深色聊天素材预览](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/docs/media/dsh-chat-dark.png)

界面图为发布素材绘制的预览，非客户端截图；动画为代码重制。

首次启用自动应用主题，更新保留用户的皮肤选择与背景设置。日常继续使用原来的 DSH 图标。

## 安装或更新

1. 下载 `dsh-plugin-rhine-lab-theme-1.2.0.tgz`，不要解压。
2. 打开 DSH 桌面版“插件 → 添加插件”，输入压缩包的完整绝对路径。
3. 点击安装，完成后按客户端提示启用或重新加载。已有 1.1.1 的用户也使用这个入口更新。若客户端提示重启，完全退出后重新打开。

首次安装需要联网下载皮肤中心依赖。已在官方 Windows DSH 0.2.0-rc.2、皮肤中心 0.4.5 验证实际聊天和设置页，完全退出重开后主题仍保留。

## 下载文件

- `dsh-plugin-rhine-lab-theme-1.2.0.tgz`：桌面版和网页版的完整插件。
- `Rhine-Lab-DSH-Theme-1.2.0-Skin.zip`：供已有皮肤中心的用户手动安装素材。
- `Rhine-Lab-DSH-Theme-1.2.0-Source.zip`：源码、素材、脚本与测试。
- `SHA256SUMS.txt`：附件的 SHA-256 校验值。

十一项自动测试通过。中央动画共享 Codex 1.1.0 的折片自转、光照阴影、同轮廓压平与正负号入场；聊天标志改为中央背景，保留皮肤中心背景控制。基于官方 DSH 0.2.0-rc.2 的提示组件样式检查深浅模式，文字对比度均超过 11:1；本机官方桌面客户端实际归档提示已验证为深底浅字。Codex 深色提示配色检查未发现同类问题，本次同步 Codex 已发布的动画，不重复更新 Codex 安装包。详细范围见 [验证记录](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/blob/dsh-v1.2.0/dsh/docs/VALIDATION.md)。

网页版安装命令与恢复方法见 [安装说明](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/tree/dsh-v1.2.0/dsh)。暂未测试 macOS / Linux 桌面版和所有第三方插件组合。

本发布为 DSH 插件版。Codex 版仍可从 [v1.0.0](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/releases/tag/v1.0.0) 下载。这是《明日方舟》莱茵生命的非官方同人主题，代码使用 MIT 许可。
