---
name: rhine-lab-theme
description: 安装、应用、暂停、恢复或卸载 Windows Codex 桌面端的莱茵生命动态主题，并诊断真实聊天和设置页的背景效果。
---

# 莱茵生命主题

此 Skill 携带完整运行资源，通过官方 Store 客户端及本机 CDP 加载 CSS/SVG。主题入口使用官方白色图标。普通官方入口单独启动不会自动加载主题；Skill 是安装与控制工具，不是官方全局换肤接口。

运行 `scripts/theme.ps1 -Action install` 安装；其他操作支持 `start`、`enable`、`disable`、`motion-on`、`motion-off`、`restore`、`uninstall`、`status`。首次安装检查 Node.js 22+ 与官方客户端，备份并修改原生外观字段。日常从桌面“莱茵生命 Codex”或主题任务栏入口启动，也可通过托盘控制。详细使用与依赖说明见 [user-guide.md](references/user-guide.md)。

安装位置为 `%LOCALAPPDATA%/RhineLabTheme7/engine`，是兼容早期版本的内部目录名。不要把用户数据、日志或原配置备份带入发布包。首次启动使用独立的主题 profile；登录状态可能需要重新建立。

恢复和卸载会正常关闭已验证的主题会话、恢复仍由主题管理的入口，并保留其他普通官方会话。若无法正常关闭，保留组件并报告原因，不强制结束所有官方进程。不能为验证效果关闭承载当前对话的客户端。

诊断时读取实际 `session.json`、`verification.json` 和运行日志。核对 CDP 端口所有者的 PID、启动时间、官方程序路径；仅按图标或程序路径无法区分普通会话和主题会话。进程启动成功或模拟网页截图不代表真实页面已显示主题。

修改背景时保留原生聊天与输入框范围、侧栏拖动和设置交互。设置页用 `.group/settings` 找实际滚动容器，侧栏用 `aside.app-shell-left-panel`。缺口沿固定矢量轮廓循环，整体标志不旋转。参考实现与许可见 `assets/runtime/vendor/`。
