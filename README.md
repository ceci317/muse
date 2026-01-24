# Muse - Interactive Content Platform

一个专为女性用户设计的互动内容平台，提供沉浸式的AI驱动体验。

## ✨ 主要功能

### 🎭 互动故事
- **私人电梯** - 密闭空间的紧张氛围
- **禁忌图书馆** - 安静角落的秘密相遇  
- **Trust (信任)** - 蒙眼体验的心理探索

### 🤖 AI 功能
- **AI 剧本生成器** - 根据关键词生成个性化独白
- **AI 伴侣** - 智能对话系统，提供情感陪伴
- **Oracle 神谕** - AI 塔罗牌占卜，探索内心渴望

### 🎵 声音体验
- **多种声线选择**：
  - 低沉御少音 🍷 (磁性、知性)
  - 清冷少年音 ❄️ (禁欲、清脆)  
  - 温柔大叔音 🥃 (包容、低沉)
- **语音合成** - 将文本转换为自然语音
- **背景音乐控制** - 营造沉浸式氛围

### 🌈 个性化设置
- **性别偏好切换** - 男性张力 / 女性柔美
- **多元光谱设置** - GL、Femdom、Demisexual 等主题筛选
- **响应式设计** - 适配各种设备尺寸

### 💌 社交功能
- **树洞信箱 (Sanctuary)** - 匿名情感分享与拾取
- **私人圈子** - 邀请制社区

## 🚀 快速开始

### 本地运行
```bash
# 克隆项目
git clone https://github.com/ceci317/muse.git
cd muse

# 启动本地服务器
python3 -m http.server 8000

# 访问应用
open http://localhost:8000/v3.html
```

### 在线体验
直接访问：`https://ceci317.github.io/muse/v3.html`

## 🔧 配置说明

### API Key 设置
应用使用 Google Gemini API 提供 AI 功能：
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取 API Key
2. 在应用中点击 "API KEY" 按钮进行配置
3. API Key 仅保存在本地浏览器，不会上传到服务器

### 声音设置
- 支持 Google Cloud Text-to-Speech API
- 提供浏览器原生语音合成作为备选方案
- 可在 "VOICE" 设置中试听和选择不同声线

## 📱 技术栈

- **前端**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **AI 服务**: Google Gemini API
- **语音合成**: Google Cloud TTS / Web Speech API
- **图片资源**: Unsplash API
- **音频资源**: Google Actions Audio Library
- **Markdown 解析**: Marked.js

## 🎨 设计理念

Muse 致力于创造一个安全、优雅、充满想象力的数字空间，让用户能够：
- 探索内心的情感和欲望
- 体验高质量的AI互动内容
- 享受个性化的感官体验
- 在匿名环境中自由表达

## 📄 文件结构

```
muse/
├── v3.html          # 主应用文件
├── index.html       # 早期版本
├── musev2.html      # 第二版本
├── design.md        # 设计文档
├── requirement.md   # 需求文档
├── task.md          # 任务列表
└── README.md        # 项目说明
```

## 🔒 隐私与安全

- 所有用户数据仅存储在本地浏览器
- API Key 不会发送到第三方服务器
- 匿名社交功能保护用户隐私
- 内容过滤确保社区安全

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📜 许可证

MIT License - 详见 LICENSE 文件

---

*"戴上耳机，闭上眼睛，或者是看着光影流动。"*