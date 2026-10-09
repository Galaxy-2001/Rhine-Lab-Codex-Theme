---
name: rhine-lab-theme
description: 安装、应用、暂停或恢复 Windows Codex 桌面端的莱茵生命动态主题，并诊断实际聊天和设置页效果。
---

# 莱茵生命主题

使用官方 Store 客户端，通过本机 CDP 加载本 Skill 随附的 CSS/SVG；不依赖客户端副本。保留侧栏拖宽、原生聊天布局与设置交互。

## 操作

- 首次安装：运行 `scripts/theme.ps1 -Action install`。安装器核对随附文件、安装每用户主题管理器并备份桌面入口。
- 应用或重新打开：`scripts/theme.ps1 -Action start`。
- 暂停/开启主题：`-Action disable` / `-Action enable`。
- 暂停/开启折片与缺口动画：`-Action motion-off` / `-Action motion-on`。
- 查看实际验证记录：`-Action status`。进程启动成功不等于设置页背景已显示。
- 用户要求恢复时：`-Action restore`。这会结束该主题的官方 CDP 会话、正常重开客户端并恢复未被用户再次修改的桌面入口。

日常从桌面“莱茵生命 Codex”快捷方式或已固定的主题 Codex 图标打开；托盘也能直接切换。桌面、任务栏、开始菜单与管理器统一使用官方原版白色图标 `assets/codex-white.ico`。这是包装启动方案，未修改的官方商店入口单独启动不会自动加载背景。Skill 不等于官方全局换肤接口，不能宣称已满足任意官方入口启动自动换肤。安装目录位于 `%LOCALAPPDATA%/RhineLabTheme7/engine`，无需保留工作区或原来的 v5 副本。

## 诊断与修改

桌面设置页没有 `data-settings-mobile-header`；用 `.group/settings` 找实际滚动容器。`data-app-shell-page-sidebar` 标记整个布局，侧栏应匹配 `aside.app-shell-left-panel`。背景不能添加聊天顶部留白，不能修改侧栏宽度或拖动事件。

读取 `assets/runtime/manifest.json` 和实际运行记录再修改。聊天中央背景是矢量 SVG，折片环变为平面标志，缺口沿固定轮廓循环；避免用旋转整体标志替代。侧栏保留原有缺口动画。用真实客户端验证设置、聊天与浅深模式，模拟网页不算实机证据。

官方普通会话与主题会话可以同时运行。不要只按程序路径判断窗口，更不要把普通官方窗口称为旧副本。主题窗口绑定和唤起必须校验 `session.json` 中的端口所有者 PID 与启动时间；恢复时保留其他进程树。冷启动测试只能用于明确由测试创建且未承载当前对话的实例，不能运行会结束所有官方进程的测试。

启动发现官方客户端已运行但没有已验证端口时，不自动结束会话；说明需要先关闭那个窗口。调试端口只绑定本机，但同一用户的其他进程能连接；完整恢复会关闭该会话。旧的任务栏商店固定项需要在安装时迁移到主题入口，不能宣称任意未迁移入口都自动生效。

参考实现与许可见随附 `assets/runtime/vendor/provenance.json` 和 `vendor/LICENSE`。
