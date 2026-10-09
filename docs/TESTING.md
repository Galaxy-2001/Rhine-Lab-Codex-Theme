# 验证方法与范围

Codex 1.1.0：新增 `node --test tests/ribbon.test.mjs`，检查压平深度、旋转几何与光照变化、遮挡阴影和闭合轮廓。安装包隔离测试与外观配置测试均通过。实际动画与布局验证见 [CENTRAL_ANIMATION.md](CENTRAL_ANIMATION.md)。

运行 `node tests/appearance.test.mjs`，检查内联和嵌套 TOML 外观配置、原字段保留、恢复、用户后续修改与重复安装。

构建后运行 `powershell -NoProfile -ExecutionPolicy Bypass -File tests/package.test.ps1`。测试在项目 `.checks/` 隔离目录中解压安装包，执行首次安装、重复安装、失败回滚、资源复制、快捷方式生成与恢复，以及可选 Skill 安装更新。检查改动过的入口被保留，以及错误资源哈希、路径越界被拒绝。测试不会启动或关闭官方客户端，不使用真实桌面、任务栏或用户配置。

依赖检查：`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/entry.ps1 -Action check`，只读检查资源、Node.js 和官方客户端。

视觉基础沿用此前在官方客户端 26.930.3930.0 的实机验证：聊天和设置页浅深模式、背景绘制不改变布局范围、动画开关、侧栏拖宽。发布说明中的示意图不作为实机验证证据。

首次安装与卸载的完整冷启动流程仍需要在其他 Windows 电脑上验证。不要为了测试关闭承载当前 Codex 对话的客户端。

本次发布验证结果见 [VALIDATION.md](VALIDATION.md)。
