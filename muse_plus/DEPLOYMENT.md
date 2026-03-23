# Muse Plus 部署与多 Provider 路线

这份文档回答两个问题：

1. 现在怎么把 Muse Plus 稳定上线
2. 后面怎么在不推翻现有代码的前提下继续接入 MiniMax 等 TTS Provider

## 1. 当前最适合的上线方案

### 静态前端

当前前端可以直接部署到 GitHub Pages。

仓库里已经有工作流：

- `/Users/ceci/Documents/codex-muse/muse_plus/.github/workflows/deploy-pages.yml`

它会把 `muse_plus/` 目录发布到 GitHub Pages。

### 动态 TTS 代理

如果你希望在线上继续使用 DashScope、MiniMax 这类需要：

- 隐藏 API Key
- 代理音频 URL
- 处理跨域

那就不要只依赖 GitHub Pages。

推荐拆成两层：

1. 前端：GitHub Pages / Vercel 静态部署
2. API 代理：Cloudflare Workers / 自己的轻量后端

## 2. 推荐架构

```text
Browser
  -> Static frontend (GitHub Pages / Vercel)
  -> Proxy backend
      -> DashScope TTS
      -> MiniMax TTS
      -> Future providers
```

这样做的好处：

- API Key 不暴露在浏览器
- 不同供应商的接口差异都收敛到后端
- 前端只关心“我要哪个音色”和“拿到可播放音频”
- 后面换供应商或加新音色，前端改动最小

## 3. 当前代码里的扩展点

现在 `muse_plus/js/tts/` 已经按引擎适配层组织：

- `TTSConfig.js`
- `TTSService.js`
- `DashScopeEngine.js`
- `WebSpeechEngine.js`
- `MiniMaxEngine.js`

其中：

- `DashScopeEngine.js`：当前已接通的 Provider
- `WebSpeechEngine.js`：浏览器后备方案
- `MiniMaxEngine.js`：预留骨架，后续可直接补真实接口

## 4. MiniMax 接入建议

建议按这个顺序接：

1. 确认你想用的 MiniMax 模型和音色列表
2. 在代理层新增 `/api/minimax/...`
3. 把 `MiniMaxEngine.js` 从骨架补成真实请求
4. 在设置面板里增加 TTS Provider 选择
5. 为每个 Provider 单独维护音色映射表

## 5. 音色保留策略

不要把“音色”直接和某个供应商的原始 voice id 绑死。

建议保留一层统一角色：

- `yushao`
- `shaonian`
- `dashu`

然后在各 Provider 内部做映射：

```text
yushao
  -> DashScope: Kai
  -> MiniMax: future_voice_id_1

shaonian
  -> DashScope: Nofish
  -> MiniMax: future_voice_id_2

dashu
  -> DashScope: Lenn
  -> MiniMax: future_voice_id_3
```

这样用户看到的还是统一人设，不会因为供应商变化导致设置界面混乱。

## 6. 我建议的下一步

如果你现在要继续推进，我建议按这个顺序：

1. 先把当前 `muse_plus` 提交并推到 GitHub
2. 确认 GitHub Pages 能稳定打开静态前端
3. 选一个后端承载代理
4. 我再帮你把代理正式拆成：
   - `/api/dashscope/tts`
   - `/api/minimax/tts`
   - `/api/audio/fetch`

## 7. 当前结论

现在这个项目已经适合继续往“多 TTS Provider 的 Muse Plus 正式版”走了。

你后面接 MiniMax，不需要推翻现有结构，直接顺着 `TTSService + Provider Engine` 这层扩展就行。

## 8. 当前后端目录

仓库里现在已经新增：

- `backend/app.py`
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/README.md`
- `cloudflare/wrangler.toml`
- `cloudflare/src/index.js`
- `cloudflare/README.md`

前端运行时配置文件：

- `muse_plus/js/runtime-config.js`

当你把后端部署到线上后，只需要把 `proxyBase` 改成你的后端地址，例如：

```js
window.MUSE_RUNTIME_CONFIG = {
    proxyBase: "https://your-backend.example.com"
};
```

## 9. 当前推荐

当前更推荐的正式上线方案是：

1. 前端继续放 GitHub Pages
2. 代理切到 Cloudflare Workers

这样做的好处：

- 不需要 Render 绑卡
- 很适合这种轻量 TTS 代理
- 后面继续加 MiniMax 也方便
