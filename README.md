# Muse Repository Overview

这个仓库目前同时包含两类内容：

- `muse_plus/`：当前最完整、最推荐继续开发和部署的版本
- 根目录的一组 `v*.html`、`musev*.html`、`index.html`：历史原型和阶段性实验文件

如果你的目标是最终收敛到 **Muse Plus**，建议把 `muse_plus/` 视为主项目，其余 HTML 文件视为设计资产或历史备份。

## 当前建议

- 开发主入口：`muse_plus/index.html`
- 本地启动方式：在 `muse_plus/` 目录运行 `./start.sh`
- GitHub Pages 部署源：`muse_plus/`
- 根目录文件：保留作参考，不再作为主版本继续叠加功能

## 仓库结构

```text
muse/
├── muse_plus/                  # 当前主版本（建议继续维护这里）
│   ├── index.html              # 主应用入口
│   ├── js/tts/                 # TTS 核心模块
│   ├── images/                 # 背景和展示图片
│   ├── simple_proxy.py         # 本地 CORS 代理
│   ├── start.sh                # 一键启动脚本
│   ├── stop.sh                 # 停止脚本
│   └── .github/workflows/      # GitHub Pages 部署配置
├── index.html                  # 早期首页原型
├── v1.html ~ v17.html          # 多轮历史页面版本
├── musev2.html / musev4.html   # 历史阶段版本
├── js/tts/                     # 根目录实验版 TTS 模块与测试
├── test-*.html / verify-*.js   # 根目录测试页与验证脚本
├── design.md                   # 设计说明
├── requirement.md              # 需求说明
└── PROJECT_STRUCTURE.md        # 更详细的仓库整理说明
```

## Muse Plus 重点文件

- `muse_plus/index.html`
  当前主页面，包含 UI、交互逻辑、TTS 初始化和运行时状态管理。
- `muse_plus/js/tts/TTSConfig.js`
  TTS 配置管理。
- `muse_plus/js/tts/DashScopeEngine.js`
  DashScope 语音合成引擎。
- `muse_plus/js/tts/WebSpeechEngine.js`
  浏览器原生语音后备引擎。
- `muse_plus/js/tts/TTSService.js`
  统一调度不同 TTS 引擎的服务层。
- `muse_plus/simple_proxy.py`
  本地开发时绕过浏览器跨域限制，代理 DashScope 请求。
- `muse_plus/start.sh`
  启动代理和静态服务器的开发脚本。
- `muse_plus/.github/workflows/deploy-pages.yml`
  指向 `./muse_plus` 的 Pages 部署配置，说明部署目标已经是 Muse Plus。

## 历史文件如何看

- 根目录 `index.html`、`v1.html`、`v3.html`、`v4.html`、`v5.html`、`v6.html`、`v14.1.html`、`v17.html`
  这些大多是不同阶段的单文件页面原型。
- 根目录 `test-*.html`、`debug-*.html`、`verify-*.js`
  主要是围绕 TTS、错误处理、图片和流式处理的测试工具。
- 根目录 `js/tts/`
  更像实验场或公共模块演化区，不是部署入口。

## 快速开始

```bash
git clone https://github.com/ceci317/muse.git
cd muse/muse_plus
./start.sh
```

启动后访问：

- `http://localhost:3000/`
- `http://localhost:3000/debug-dashscope-tts.html`

## 下一步收敛建议

- 所有新功能只加到 `muse_plus/`
- 根目录历史 HTML 停止继续分叉
- 后续如果要进一步清仓，可以把历史文件移入 `archive/`，但建议先确认哪些页面仍需参考
