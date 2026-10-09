# 上传 GitHub 与发布安装包

1. 创建 GitHub 仓库，建议名称 `Rhine-Lab-Codex-Theme`。
2. 将源码 ZIP 完整解压；上传里面项目目录的内容，包括 README、runtime、scripts、docs、skill、tests 和许可文件。不要把源码 ZIP 当作仓库源码文件上传，也不要上传整个旧版工作区。
3. 在仓库 Releases 中创建版本 `v1.1.0`，标题可写“莱茵生命 Codex 动态主题 1.1.0”。
4. 在发布页附件中放入用户安装 ZIP、Skill ZIP、源码 ZIP 和 `SHA256SUMS.txt`。
5. 发布描述可使用下文。仓库首页 README 即为安装说明，不需要额外整理。

## 可用的发布描述

莱茵生命风格的 Windows Codex 动态主题，包含浅深配色、字体、聊天与设置页背景、循环缺口动画和官方白色图标。

普通用户下载 `Rhine-Lab-Codex-Theme-1.1.0-Windows.zip`，完整解压后双击“安装主题.cmd”。需要官方 Store 客户端与 Node.js 22+；首次安装前完全退出普通客户端。任务栏固定操作需要手动完成。

可选下载 `rhine-lab-theme-1.1.0-skill.zip`，安装后通过 Codex 对话控制主题。恢复与卸载入口随包提供，个人 profile 与备份保留在本机。

本主题通过官方客户端、主题启动器和本机 CDP 加载。原商店入口单独启动不会自动换肤。视觉基础版本在官方客户端 26.930.3930.0 验证；客户端后续更新可能需要适配。

## 校验与后续更新

下载者可使用 `Get-FileHash -Algorithm SHA256` 与附件 `SHA256SUMS.txt` 比较 ZIP 哈希。哈希用于确认下载文件完整性，不能替代对发布来源的判断。

更新发布版本时，同时修改 `VERSION`、构建脚本版本、运行 manifest 版本检查、engine 版本、README 和 CHANGELOG 中的发布版本，再执行构建与隔离测试。内部安装目录保留 `RhineLabTheme7` 以兼容此前本机版本，不必随发布号更名。
