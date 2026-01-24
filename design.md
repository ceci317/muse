Muse | 她的情欲画廊 - 设计规范文档 (Design Specifications)

版本： v1.0
日期： 2023-10-27
适用范围： 前端 UI/UX 开发、视觉设计

1. 设计理念 (Design Philosophy)

Muse 的设计核心在于 "去凝视化" (De-gazing) 与 "氛围感" (Ambience)。

隐喻： 深夜的私人画廊、静谧的树洞、温暖的温室。

关键词： * Intimate (亲密)： 私密的空间感，像是在读一封信。

Subtle (含蓄)： 拒绝直白的视觉冲击，通过光影、模糊和文字留白激发想象。

Fluid (流动)： 如水般的交互体验，无缝的模态切换。

2. 视觉识别系统 (Visual Identity System)

2.1 色彩体系 (Color Palette)

基于 Tailwind CSS 配置，采用深色模式以降低视觉压力并营造沉浸感。

变量名

色值 (Hex)

用途

视觉心理

Background

#0c0a09 (Stone 950)

全局背景

深邃、包容、夜色

Panel

#1c1917 (Stone 900)

卡片/模态框背景

层次感、物质感

Primary Text

#e7e5e4 (Stone 200)

正文内容

清晰、柔和

Muted Text

#78716c (Stone 500)

辅助信息/占位符

低调、不抢眼

Muse Gold

#d6d3d1 (Warm Gray)

标题、Logo、高亮

优雅、智性、冷淡的高级感

Muse Rose

#9f1239 (Rose 800)

按钮、心跳、重点交互

欲望、生命力、情感

2.2 字体排印 (Typography)

标题字体 (Serif): Playfair Display

应用： Logo, H1-H3 标题, 引言, 剧本独白。

特征： 高对比度的衬线体，传递文学性与女性气质。

正文字体 (Sans-serif): Lato

应用： 按钮文本, 聊天内容, 功能说明。

特征： 人文主义无衬线体，现代且易读。

2.3 图标与纹理 (Iconography & Texture)

图标风格： 极简线条 (Outline)，细笔画 (stroke-width: 1.5 或 1)。

纹理处理：

Glassmorphism (毛玻璃): 用于顶部导航 (backdrop-blur-sm) 和模态框背景 (bg-black/60)。

Grain (噪点): (可选) 在图片上叠加轻微的胶片噪点，增加电影质感。

3. 核心组件规范 (Component Library)

3.1 氛围卡片 (Ambient Cards)

状态逻辑 (The Reveal):

Default: 灰度 (grayscale) + 低亮度 (brightness-75)。

Hover: 恢复色彩 (grayscale-0) + 提亮 (brightness-100) + 轻微放大。

目的： 只有当用户主动关注时，欲望才会被唤醒。

音频反馈：

播放状态下，卡片四周出现 Muse Rose 颜色的呼吸波纹动画 (pulse-ring)。

3.2 模态框 (Modals)

结构： 全屏遮罩 (bg-black/90) + 居中内容容器。

入场动画： 淡入 (opacity-0 -> opacity-100) + 轻微缩放 (scale-95 -> scale-100)。

主要类型：

The Gate (准入测试): 简洁的问答卡片，单选交互。

The Sanctuary (树洞): 信纸质感，手写体风格输入框。

The Greenhouse (AI聊天): 底部输入栏，气泡式对话流。

3.3 按钮 (Buttons)

Primary (行动按钮): bg-stone-800 text-white hover:bg-muse-rose。

Secondary (辅助按钮): 边框样式 border border-stone-600。

Ghost (幽灵按钮): 纯文字 + 下划线/图标。

4. 关键交互流程设计 (UX Flow)

4.1 准入仪式 (Onboarding)

设计目标：建立仪式感，筛选用户。

Landing: 首页背景模糊，仅显示 Slogan 和 "Enter" 按钮。

Challenge: 弹出 3 道共鸣测试题（如“被征服 vs 被看见”）。

Persona: 答题通过后，全屏淡入用户的虚拟身份卡片（代号 + 抽象符号），随后进入主画廊。

4.2 树洞信箱 (The Sanctuary)

设计目标：慢节奏、深情、去社交压力。

视觉隐喻： 漂流瓶或密封的信笺。

写信 (Write): 全屏沉浸式编辑器，隐藏周围干扰元素。

读信 (Read): 打开他人的信件时，背景压暗，信件内容居中。

回信 (Reply): 点击“写回信”，提示“回信将直接发送到对方信箱，不会公开展示”。

4.3 AI 伴侣 (The Companion)

设计目标：有记忆的对话，听觉通感。

语音可视化： 当 AI (TTS) 说话时，界面出现动态声波或呼吸光晕。

角色切换： * Deep Sister: 界面元素微调为深红/暗紫色调。

Cool Maiden: 界面元素微调为冷青/银色调。

Gentle Uncle: 界面元素微调为暖木/深棕色调。
(MVP阶段暂保持统一色调，通过文字/声音区分)

5. 响应式策略 (Responsiveness)

Mobile First: * 默认单列或双列瀑布流。

导航栏高度增加，便于手指点击。

模态框在移动端占满全屏 (inset-0)。

Desktop:

三列瀑布流。

模态框为居中弹窗 (max-w-md)。

增加 Hover 态交互（移动端无 Hover）。

6. 无障碍设计 (Accessibility)

对比度： 确保 Muse Gold 和 Stone 200 在深色背景上的对比度符合 AA 标准。

键盘导航： 所有卡片和按钮均可通过 Tab 键聚焦 (focus:ring-muse-rose)。

减弱动画： 为偏好减弱动态效果的用户提供无动效版本 (CSS prefers-reduced-motion)。