# 莱茵生命动态主题 · Codex / DSH

这个仓库提供 Codex 和 DeepSeek Harness 两个版本。

| 使用的客户端 | 下载 | 安装说明 |
| --- | --- | --- |
| 官方 DeepSeek Harness 桌面版 / 网页版 | [DSH 插件 1.1.1](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/releases/tag/dsh-v1.1.1) | [DSH 安装说明](dsh/README.md) |
| Windows Codex / 集成 Codex 的 ChatGPT | [Codex 主题 1.0.0](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/releases/tag/v1.0.0) | 见下文 |

DSH 用户下载 `dsh-plugin-rhine-lab-theme-1.1.1.tgz`，无需解压，在客户端“插件 → 添加插件”输入文件的完整绝对路径，安装后点击“立即启用”。主题首次启用自动应用，日常继续使用原来的 DSH 图标。DSH 源码在 [`dsh/`](dsh/)。

## Codex 版

Windows Codex 桌面端的莱茵生命主题：暖灰浅色背景、橙色标志、黑白档案名牌，以及沿固定轮廓循环的标志缺口。聊天、设置与侧栏使用统一视觉，装饰作为背景绘制，保留原生聊天范围和侧栏拖动。

![浅色主题素材示意](docs/preview-light.svg)

上图为主题素材示意，使用随包 SVG 和配色绘制；不是实际客户端截图。发布包不含个人聊天截图。

## 下载与安装

在 GitHub Releases 下载 `Rhine-Lab-Codex-Theme-1.0.0-Windows.zip`，完整解压，再双击 **安装主题.cmd**。日常双击桌面 **莱茵生命 Codex**，或双击 **启动主题.cmd**。

需要：

- Windows x64，以及官方 Windows Store 版 Codex / 集成 Codex 的 ChatGPT 客户端；检测包名为 `OpenAI.Codex`。
- [Node.js 22 或更新版本](https://nodejs.org/en/download)，安装后重新打开安装脚本。
- PowerShell 5.1 与系统 .NET Framework。预编译管理器已包含在包内，无需开发工具。

首次安装前请保存工作并完全退出普通官方客户端。安装器检查资源哈希与依赖；只安装到当前用户目录，无需管理员权限。新电脑会生成“莱茵生命 Codex”桌面入口；更新早期版本时沿用仍属于主题的原入口。主题使用独立 profile，首次打开可能需要重新登录。

安装器同时配置浅色、深色配色及字体，并保留已有模式选择；未设置模式时默认浅色。可在客户端设置 → 外观中切换浅深模式。原配置备份保存在本机，恢复时仅还原仍属于主题的外观字段，保留用户后续修改。

安装过程失败会显示原因，并回滚本次组件与入口修改。首次依赖检查也可运行 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/entry.ps1 -Action check`。

## 任务栏与日常控制

主题运行后，右击任务栏中的主题应用图标，选择 **固定到任务栏**。原商店固定项仍会打开普通官方会话；可自行取消固定。Windows 的固定操作需要用户完成，安装器不会修改任务栏注册表。

桌面、主题任务栏入口和托盘都使用官方原版白色图标。右击通知区图标可应用或暂停主题、开启或暂停缺口动画、恢复官方外观。主题开关与动画开关会记住状态。

背景中的 RHINE LAB / STRU 名牌不占聊天布局高度，图案不接收鼠标事件。浅色与深色均包含聊天、设置滚动区和侧栏图案。

## 恢复与卸载

双击 **恢复与卸载.cmd**。工具先恢复外观与主题入口，再移除运行组件。它只关闭已验证的主题会话，不强制结束其他官方会话；若主题会话无法正常退出，会保留组件并提示重试。

卸载会移除由主题创建且未被改动的桌面与开始菜单入口；早期版本替换的桌面入口按备份恢复。仍指向主题管理器的任务栏快捷方式改回普通官方入口。用户后来修改过的快捷方式会被保留；若它仍指向已卸载组件，可手动取消固定或删除。

应用 profile、原配置和快捷方式备份会留在 `%LOCALAPPDATA%\RhineLabTheme7`。这是为避免删除登录状态和用户数据；确认不再需要后可以自行清理。可选 Skill 保留，如不再需要，可删除 Codex skills 目录下的 `rhine-lab-theme`。

## 可选 Skill

双击 **安装可选 Skill.cmd**，将完整 Skill 安装到 `CODEX_HOME/skills`（未设置时使用用户目录 `.codex/skills`）。同名旧 Skill 会备份到 `skill-backups`。

也可以从 Releases 下载 `rhine-lab-theme-1.0.0-skill.zip`，在 Windows 文件属性中解除下载 ZIP 的锁定后解压，将里面的 `rhine-lab-theme` 文件夹放到 Codex 的 skills 目录。新聊天中可以说：

- “安装莱茵生命主题”
- “应用莱茵生命主题”
- “暂停莱茵生命主题”
- “暂停缺口动画”
- “恢复官方外观”
- “卸载莱茵生命主题”

Skill 已携带完整运行资源，安装后无需保留下载目录。

## 工作方式与兼容范围

本项目使用 **官方客户端＋主题启动器＋本机 CDP**。Skill 负责安装与控制，动态背景由 CSS/SVG 加载；它不是官方提供的全局动态主题扩展。未修改的商店入口单独启动不会自动加载主题。

不打包客户端副本，也不修改 WindowsApps 中的官方文件。调试端口固定为 `127.0.0.1:9436`；同一用户的其他本机进程可以连接，完整恢复会关闭该主题会话。暂停主题仅隐藏背景，不关闭此会话。

视觉基础版本已在官方客户端 **26.930.3930.0** 验证聊天、实际设置页、浅深模式、背景动画与侧栏拖动。1.0.0 发布安装器另有隔离测试；尚未在第二台电脑完成冷启动安装验证。客户端更新后，内部页面结构或调试参数可能变化。

## 常见问题

**双击后没有主题？** 请确认使用桌面的“莱茵生命 Codex”，并查看 `%LOCALAPPDATA%\RhineLabTheme7\operations-error.log`。普通官方会话仍在运行时，先完全退出，再打开主题入口。

**Windows 提示未知发布者？** 管理器是本项目源码编译的未签名程序。发布页提供 ZIP SHA-256 校验值，源码可自行编译。企业策略限制脚本或调试参数时，请遵循本机策略。

**PowerShell 执行策略会改变吗？** 双击安装入口使用当前安装进程的 `Bypass`，不修改系统或用户的永久策略。复制并核对后的运行脚本解除下载标记，日常管理器使用 `RemoteSigned`。

**只想要配色？** 可在官方外观设置中导入 `runtime/assets/rhine-lab-light.json` 或 `rhine-lab-dark.json`；此方式仅包含配色与字体。

## 源码与发布

源码、预编译管理器及固定版本第三方代码都在 `runtime/`，入口脚本在 `scripts/`，Skill 模板在 `skill/`。运行 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build.ps1` 可重新编译并生成 `dist/` 下的用户 ZIP、源码 ZIP、Skill ZIP 与 `SHA256SUMS.txt`。详见 [发布说明](docs/PUBLISHING.md) 和 [测试说明](docs/TESTING.md)。

项目代码采用 MIT 许可。第三方代码与官方图标、品牌元素的来源和许可范围见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
