# Muse Plus - 智能语音交互应用

一个基于 DashScope TTS 的高质量语音交互应用，支持多种场景的智能对话和语音合成。

## ✨ 最新更新 (v2.0)

### 🎨 全新背景图片系统
- **本地图片支持**: 支持用户自定义背景图片
- **快速轮播**: 图片切换速度从8秒优化为4秒
- **流畅过渡**: 过渡动画从4秒优化为2-3秒
- **多格式支持**: 同时支持JPG和PNG格式
- **智能备用**: 图片加载失败时自动显示美丽渐变背景

### 🛠️ 新增工具
- `add-images.sh`: 图片状态检查工具
- `test-images.html`: 图片预览测试页面
- `create-sample-images.sh`: 示例图片生成工具
- `BACKGROUND_SETUP.md`: 完整设置指南

### 🎭 视觉效果升级
- 4种切换效果：淡入淡出、滑动、缩放、视差
- 动态光效和氛围渲染
- 智能图片预加载系统
- 用户隐私保护（个人图片不会提交到仓库）

## 🚀 新手快速上手 + 开发工作流

### 第 1 步：环境准备
```bash
# 检查 Python 版本 (需要 3.6+)
python3 --version

# 安装依赖库
pip3 install requests

# 检查依赖是否安装成功
python3 -c "import requests; print('✅ requests 库已安装')"
```

### 第 2 步：启动服务（只需要一次）
```bash
# 进入项目目录
cd muse_plus

# 启动服务 (会自动检查环境和启动所有服务)
./start.sh
```

### 第 3 步：配置背景图片（可选）
```bash
# 检查图片状态
./add-images.sh

# 添加你的背景图片到 images/backgrounds/ 目录
# 文件命名：bg1.jpg, bg2.png, bg3.png, bg4.png, bg5.png, bg6.png

# 测试图片效果
# 访问 http://localhost:3000/test-images.html
```

### 第 4 步：打开浏览器
启动成功后，打开浏览器访问：
- **主应用**: http://localhost:3000/
- **图片测试**: http://localhost:3000/test-images.html
- **调试工具**: http://localhost:3000/debug-dashscope-tts.html

### 第 5 步：开发和测试
```bash
# 修改代码
# 编辑 index.html, JS, CSS 等静态文件

# 验证功能 - 无需重启服务！
# 在浏览器中刷新页面 (F5 或 Ctrl+F5)

# 继续开发...
# 重复修改 → 刷新浏览器的循环
```

### 第 6 步：停止服务
```bash
# 使用完毕后，务必运行停止命令
./stop.sh
```

## ⚠️ 重要说明

### 🔄 什么时候需要重启服务？

**需要重启的情况：**
- 修改 `simple_proxy.py`（代理服务器代码）
- 修改 `start.sh` 或 `stop.sh`（启动脚本）
- 服务器出现异常

**不需要重启的情况（直接刷新浏览器即可）：**
- ✅ 修改 `index.html`
- ✅ 修改 `debug-dashscope-tts.html`
- ✅ 修改 `js/` 目录下的 JavaScript 文件
- ✅ 修改 CSS 样式
- ✅ 添加新的静态文件

### 🛑 遇到问题时的万能解决方案
如果遇到任何启动问题（如"localhost 未发送数据"），请按顺序执行：

```bash
# 1. 强制停止所有服务
./stop.sh

# 2. 等待 2 秒
sleep 2

# 3. 重新启动
./start.sh
```

### 🔧 手动强制清理（终极方案）
如果上述方法无效，使用以下命令强制清理：

```bash
# 查看占用端口的进程
lsof -Pi :3000 -sTCP:LISTEN
lsof -Pi :3001 -sTCP:LISTEN

# 强制杀死进程（替换 PID 为实际进程号）
kill -9 [PID]

# 或者一键清理所有 Python HTTP 服务
pkill -f "python.*http.server"
pkill -f "python.*simple_proxy"
```

## 📁 文件结构

```
muse_plus/
├── index.html                    # 主应用文件
├── debug-dashscope-tts.html     # 调试工具
├── test-images.html             # 图片预览测试页面
├── test-tts.html               # TTS 功能测试页面
├── simple_proxy.py             # CORS 代理服务器
├── start.sh                    # 启动脚本 (改进版)
├── stop.sh                     # 停止脚本
├── test.sh                     # 测试脚本
├── add-images.sh               # 图片状态检查工具
├── create-sample-images.sh     # 示例图片生成工具
├── BACKGROUND_SETUP.md         # 背景图片设置指南
├── README.md                   # 说明文档
├── .nojekyll                   # GitHub Pages 配置
├── images/                     # 图片资源目录
│   └── backgrounds/            # 背景图片目录
│       ├── README.md           # 图片使用说明
│       ├── generate-samples.html # 示例图片生成器
│       ├── bg1.jpg            # 用户背景图片 (被 .gitignore)
│       ├── bg2.png            # 用户背景图片 (被 .gitignore)
│       └── ...                # 更多用户图片 (被 .gitignore)
└── js/tts/                    # TTS 组件
    ├── TTSConfig.js           # 配置管理
    ├── DashScopeEngine.js     # DashScope TTS 引擎
    ├── WebSpeechEngine.js     # WebSpeech 引擎
    └── TTSService.js          # TTS 服务管理
```

## 💡 开发小贴士

### 🎨 背景图片配置
- **添加图片**: 将图片重命名为 `bg1.jpg`, `bg2.png` 等，放入 `images/backgrounds/` 目录
- **支持格式**: JPG, PNG, JPEG, GIF, WebP
- **建议尺寸**: 1920x1080 或更高分辨率
- **隐私保护**: 用户图片不会被提交到 Git 仓库
- **测试工具**: 使用 `./add-images.sh` 检查图片状态

### 🔧 开发技巧
- **浏览器缓存问题**：如果修改没生效，试试 `Ctrl+F5` 强制刷新
- **开发者工具**：按 `F12` 打开，在 Network 标签可以看到文件是否重新加载
- **实时预览**：Python 的 `http.server` 会自动提供最新的文件内容
- **API 密钥配置**：点击右上角的 "KEY" 按钮，切换到 "ALIYUN" 标签输入 DashScope API 密钥

### 🎭 视觉效果调试
- **图片预览**: 访问 `/test-images.html` 查看所有背景图片状态
- **轮播测试**: 主页面会自动轮播，4秒切换一次
- **备用方案**: 图片加载失败时会显示渐变背景
- **性能监控**: 打开浏览器控制台查看图片加载日志

---

**Muse Plus** - 让语音交互更智能，让开发更简单。