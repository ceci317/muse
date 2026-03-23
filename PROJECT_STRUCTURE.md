# Muse 仓库整理说明

这份文档的目标是帮你快速区分：

- 哪些文件是当前主版本
- 哪些文件是历史版本
- 哪些文件是测试和调试工具
- 后续如果要收敛到 `muse_plus`，应该从哪里下手

## 1. 当前主版本

`muse_plus/` 是现在最像正式产品版本的目录。

原因有三点：

1. 有独立的主页面 `muse_plus/index.html`
2. 有完整的本地开发脚本 `muse_plus/start.sh`、`muse_plus/stop.sh`
3. GitHub Pages 工作流已经直接部署 `muse_plus/`

这意味着从“运行方式”和“部署方式”两边看，`muse_plus/` 都已经是事实上的主项目。

## 2. `muse_plus/` 内部怎么分

### 页面与入口

- `muse_plus/index.html`
  主应用入口。
- `muse_plus/debug-dashscope-tts.html`
  TTS 调试页面。
- `muse_plus/test-tts.html`
  TTS 测试页面。
- `muse_plus/test-images.html`
  背景图片预览和检查页面。

### 运行脚本

- `muse_plus/start.sh`
  启动本地静态服务器和代理。
- `muse_plus/stop.sh`
  停止本地服务。
- `muse_plus/test.sh`
  快速测试脚本。

### 语音模块

- `muse_plus/js/tts/TTSConfig.js`
  TTS 配置。
- `muse_plus/js/tts/DashScopeEngine.js`
  DashScope 引擎。
- `muse_plus/js/tts/WebSpeechEngine.js`
  Web Speech 后备引擎。
- `muse_plus/js/tts/TTSService.js`
  引擎切换和统一调用层。

### 图片资源

- `muse_plus/images/backgrounds/`
  背景图目录。
- `muse_plus/images/showcase/`
  展示图目录。

### 代理与部署

- `muse_plus/simple_proxy.py`
  本地代理服务器。
- `muse_plus/.github/workflows/deploy-pages.yml`
  GitHub Pages 部署配置，发布目录是 `./muse_plus`。

### 备份目录

- `muse_plus/codes_bak/`
  旧版或备份代码，不建议继续作为主入口开发。

## 3. 根目录文件怎么理解

根目录更像“版本博物馆 + 实验台”。

### 历史页面

- `index.html`
- `v1.html`
- `v3.html`
- `v4.html`
- `v5.html`
- `v6.html`
- `v14.1.html`
- `v14_bak.html`
- `v17.html`
- `musev2.html`
- `musev4.html`

这些文件大多都是单文件 HTML 版本，适合参考历史设计、文案和交互，但不适合作为现在的主开发入口。

### 根目录测试和验证文件

- `test-*.html`
- `debug-*.html`
- `verify-*.js`
- `*-verification.md`
- `api-key-management-summary.md`

这类文件主要服务于阶段性调试，不代表正式产品结构。

### 根目录脚本和代理

- `simple_proxy.py`
- `proxy_server.py`
- `proxy-server.js`
- `start.sh`
- `start-with-proxy.sh`

这些说明仓库在演进过程中尝试过多种本地运行方式，但目前 `muse_plus/start.sh` 已经是最清晰的入口。

### 根目录 `js/tts/`

这里有较完整的 TTS 模块和测试文件，但它没有像 `muse_plus/` 那样和当前正式入口绑定。可以把它看成实验场、共享模块候选区，或者 Muse Plus 的演化来源。

## 4. 如果目标是最终只保留 Muse Plus

推荐按这个顺序做：

1. 把所有新增开发都收敛到 `muse_plus/`
2. 先保留根目录历史 HTML，不要立刻删，避免丢掉可复用设计
3. 确认哪些历史页面还有参考价值
4. 再把根目录历史文件移动到一个单独的 `archive/` 目录
5. 最后让根目录 README、部署说明、启动方式都只指向 `muse_plus/`

## 5. 当前结论

如果你问我“现在这个仓库里，哪个才是最终应该继续做的版本”，答案就是：

`muse_plus/`

如果你愿意，我下一步可以继续帮你做其中一种收敛动作：

- 把根目录历史文件移动到 `archive/`
- 把仓库主页入口改成明确跳转 `muse_plus`
- 继续检查 `muse_plus` 里面哪些文件还能再精简
