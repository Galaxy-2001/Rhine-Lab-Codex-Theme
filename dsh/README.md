# 莱茵生命 · DeepSeek Harness 主题

**1.3.2** 保留官方的品牌、新会话图标和操作入口。列表下方有空位时显示 Terminal 站牌与渐隐倒影，列表放满时退为 9% 淡水印。空白会话展开折片，阅读已有消息时水印保持静止。

![1.3.2 侧栏在浅色、深色及长短列表下的效果，使用发布皮肤绘制](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/dsh-v1.3.2/dsh/docs/market/sidebar-1.3.2.png)

浅色标题栏与 Windows 原生窗口按钮统一底色，右上角显示完整的 **DeepSeek Harness**。修复侧栏开关被误扩展到整个窗口的问题：按钮留在左上角，输入框和其他控件正常接收点击。保留深色提示框、计费时段配色和原有动画。

本插件 `dsh-plugin-rhine-lab-theme` 自带素材，依赖 [dsh-skins](https://github.com/zhu1090093659/dsh-skins) 皮肤中心。首次启用自动应用，后续保留你的皮肤与背景选择。日常继续从官方客户端图标打开。

[96 秒双客户端实机视频](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/releases/tag/demo-2026-10-30)

以下背景对照使用 1.3.1 的皮肤素材和加载器绘制。

![1.3.1 浅深色水印与设置背景对照，使用发布皮肤绘制](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/dsh/docs/market/watermarks-1.3.1.png)

以下为 1.3.0 在官方 Windows **0.2.1-rc.3** 客户端实录截图，账户、金额与头像已处理。动画采用代码生成的三维折片、同轮廓压平、正号旋转放大及减号横向展开，并非官方视频片段。

![DeepSeek Harness 1.3.0 浅色实机截图](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/dsh/docs/market/dsh-chat-light-1.3.0.png)

![DeepSeek Harness 1.3.0 深色实机截图](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/dsh/docs/market/dsh-chat-dark-1.3.0.png)

![DeepSeek Harness 1.3.0 浅色设置实机截图](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/dsh/docs/market/dsh-settings-light-1.3.0.png)

![DeepSeek Harness 1.3.0 深色设置实机截图](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/dsh/docs/market/dsh-settings-dark-1.3.0.png)

## 安装

下载 [DSH 1.3.2 发布包](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/releases/tag/dsh-v1.3.2)。桌面版选用 `dsh-plugin-rhine-lab-theme-1.3.2.tgz`；Skin ZIP 用于已有皮肤中心的手动安装，Source ZIP 用于开发。

### 官方桌面客户端（推荐）

1. 下载 Release 中的 `dsh-plugin-rhine-lab-theme-1.3.2.tgz`，保持压缩包原样。
2. 打开官方 DSH 桌面版，在“插件 → 添加插件”输入这个文件的完整绝对路径，例如 `C:\Downloads\dsh-plugin-rhine-lab-theme-1.3.2.tgz`。
3. 点击安装，完成后点击“立即启用”。客户端会安装依赖，首次启用自动应用主题。日常仍从原来的 DSH 图标打开。

首次安装需要联网下载皮肤中心依赖。如果客户端提示重新加载，按其提示操作。这个包尚未发布到 npm，不能直接按包名从注册表安装。不要用普通 CLI 改写保留的 desktop profile。

### 网页版

```powershell
dsh plugin --profile web add "C:\Downloads\dsh-plugin-rhine-lab-theme-1.3.2.tgz"
dsh web
```

如果网页服务已经运行，安装插件后按 DSH 提示重新加载或重启服务。`127.0.0.1:3080` 拒绝连接表示服务没有启动，先运行 `dsh web`；安装主题本身不会让网页服务常驻。

### 只安装皮肤素材

已经安装皮肤中心、希望手动选择主题时：

1. 将 Skin ZIP 中的 `rhine-lab` 文件夹放到 `$DSH_HOME/skins/`。默认位置是用户目录下 `.dsh/skins/rhine-lab`。
2. 打开 DSH 设置中的“皮肤中心”，刷新列表，选择“莱茵生命”并应用。
3. 日常从原来的 DSH 入口启动，选择会由皮肤中心保存。

也可以完整解压 Source ZIP，双击“安装莱茵主题.cmd”。这个入口需要 Node.js，只复制皮肤；重复安装会备份上一版。它尊重 `DSH_SKINS_HOME`、`DSH_SKINS_DIR` 和 `DSH_HOME`。

单独安装皮肤中心的命令仍然可用：

```powershell
dsh plugin --profile web add @linxin666/dsh-client-ui-skin-center@0.4.5
```

源码包的“安装皮肤中心-Web.cmd”执行同一命令。完整插件包已经声明该依赖，不需要再手工安装一次。

## 兼容性

目标契约为皮肤中心 0.4.5 的 `skinManifestVersion: 2`、L1 设计 token 和 L2 语义属性。皮肤目录只含 JSON、CSS 和本地 SVG/预览素材，不运行 hooks。

本版实机使用官方 Windows DSH 0.2.2.0、皮肤中心 0.4.5。DSH 的运行时检查包含预发行版本，无需豁免。开发依赖固定为 0.1.7-rc.1，是为了避免 npm 默认 peer 解析排除 0.2 预发行版；使用主题不需要降级 DSH。具体实测范围见验证记录。

主题仅在空白会话播放 14 秒循环，从平面标志展开为折片，再压平并显示正负号。浅色水印为 16%，深色折片为 8%、平面为 12%。已有消息的对话和“减少动态效果”模式使用静态标志，设置页使用 44 px 平铺网格与右侧刻度。背景遮罩、模糊与开关由皮肤中心管理；外部壁纸启用时按加载器规则让出背景。

## 恢复

在皮肤中心应用“官方默认”或另一款皮肤即可恢复，后续启动不会重新强制选择莱茵生命。在 DSH 插件页可以停用或卸载插件。要清理素材，先切回官方默认，再在皮肤中心卸载莱茵生命。更新备份放在 `.dsh/rhine-lab-backups/`，不会混入皮肤列表。

## 开发与打包

```powershell
npm ci --ignore-scripts
npm test
npm run generate # 重新生成折片、光影及完整背景
npm run build
```

`dist` 生成可安装的插件 TGZ、Skin ZIP、Source ZIP 和 `SHA256SUMS.txt`。Source ZIP 包含插件代码、素材、安装脚本与测试；TGZ 可直接交给 DSH 插件管理器安装。实测范围见 [验证记录](docs/VALIDATION.md)。市场展示信息由市场同步；本仓库 Release 提供当前安装包。

## 许可

主题代码使用 MIT 许可。莱茵生命及相关标志属于《明日方舟》权利方，此为非官方同人主题，代码许可不包含品牌授权。见 [来源说明](THIRD_PARTY_NOTICES.md)。

## 保留的计费与深色配色修复

计费时段采用高峰琥珀色、平价蓝青色加斜纹、周末绿色；降低深色聊天区文字、卡片与背景装饰亮度。不修改计费逻辑。

## 贡献与致谢

- **[Galaxy-2001](https://github.com/Galaxy-2001)**：项目发起与维护，提出设计方向和需求，提供参考素材，参与实际使用验证与效果反馈，并负责发布决策。
- **[OpenAI Codex](https://github.com/codex)（AI 开发助手）**：在维护者的指导与反馈下，承担主要代码实现，参与主题视觉设计、三维 SVG 动画、Codex 与 DSH 适配、问题修复、测试、安装包制作、文档和演示素材制作，以及 GitHub 发布与市场收录提交。
- **[Claude](https://github.com/claude)（Anthropic）** 作为 AI 开发助手参与了项目开发。

本项目由 Galaxy-2001 独立维护，Codex 与 Claude 的署名用于记录各自在开发中的贡献。

由 Codex 协助完成的提交使用 `Co-authored-by: Codex <noreply@openai.com>` 记录提交级共同作者署名，与维护者署名并列；此前已发布的提交保留原始历史。
