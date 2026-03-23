# Muse Backend

这个后端用于给 `muse_plus` 提供正式代理能力，优先服务：

- DashScope TTS
- 音频 URL 代理拉取
- 后续 MiniMax TTS 扩展

## 本地启动

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

默认地址：

- `http://localhost:8787/health`
- `http://localhost:8787/api/dashscope/validate`
- `http://localhost:8787/api/dashscope/synthesize`
- `http://localhost:8787/api/audio/fetch?url=...`

## 环境变量

- `DASHSCOPE_API_KEY`
- `MINIMAX_API_KEY`
- `DASHSCOPE_API_BASE`
- `ALLOWED_ORIGINS`
- `PORT`

## 生产部署

可以部署到：

- Render
- Railway
- Fly.io
- Cloud Run

示例启动命令：

```bash
gunicorn -w 2 -b 0.0.0.0:$PORT app:app
```

## Render 部署

仓库根目录已经新增：

- `/Users/ceci/Documents/codex-muse/render.yaml`

你可以在 Render 里直接选择这个仓库部署。

推荐设置：

- Service Name: `muse-backend`
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn -w 2 -b 0.0.0.0:$PORT app:app`

至少需要配置的环境变量：

- `DASHSCOPE_API_KEY`
- `ALLOWED_ORIGINS=https://ceci317.github.io`

部署成功后，把前端运行时配置文件改成你的后端地址：

- `/Users/ceci/Documents/codex-muse/muse_plus/js/runtime-config.js`

例如：

```js
window.MUSE_RUNTIME_CONFIG = {
    proxyBase: "https://muse-backend.onrender.com"
};
```
