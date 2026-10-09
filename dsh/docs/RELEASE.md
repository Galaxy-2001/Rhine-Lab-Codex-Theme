# 莱茵生命 DSH 插件 1.1.2

修复深色主题下“已归档对话暂时无法查看”等提示出现浅底白字的问题。提示框改为深色底、浅色字，同时修复悬浮提示的同类问题。聊天背景、动画和布局保持原有设计。

首次启用自动应用主题，更新保留用户的皮肤选择与背景设置。日常继续使用原来的 DSH 图标。

## 安装或更新

1. 下载 `dsh-plugin-rhine-lab-theme-1.1.2.tgz`，不要解压。
2. 打开 DSH 桌面版“插件 → 添加插件”，输入压缩包的完整绝对路径。
3. 点击安装，完成后按客户端提示启用或重新加载。已有 1.1.1 的用户也使用这个入口更新。若客户端提示重启，完全退出后重新打开。

首次安装需要联网下载皮肤中心依赖。已在官方 Windows DSH 0.2.0-rc.2、皮肤中心 0.4.5 验证实际聊天和设置页，完全退出重开后主题仍保留。

## 下载文件

- `dsh-plugin-rhine-lab-theme-1.1.2.tgz`：桌面版和网页版的完整插件。
- `Rhine-Lab-DSH-Theme-1.1.2-Skin.zip`：供已有皮肤中心的用户手动安装素材。
- `Rhine-Lab-DSH-Theme-1.1.2-Source.zip`：源码、素材、脚本与测试。
- `SHA256SUMS.txt`：附件的 SHA-256 校验值。

九项自动测试通过。基于官方 DSH 0.2.0-rc.2 的提示组件样式检查深浅模式，文字对比度均超过 11:1；本机官方桌面客户端实际归档提示已验证为深底浅字。Codex 深色提示配色检查未发现同类问题，本次没有更新 Codex 安装包。详细范围见 [验证记录](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/blob/dsh-v1.1.2/dsh/docs/VALIDATION.md)。

网页版安装命令与恢复方法见 [安装说明](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/tree/dsh-v1.1.2/dsh)。暂未测试 macOS / Linux 桌面版和所有第三方插件组合。

本发布为 DSH 插件版。Codex 版仍可从 [v1.0.0](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/releases/tag/v1.0.0) 下载。这是《明日方舟》莱茵生命的非官方同人主题，代码使用 MIT 许可。
