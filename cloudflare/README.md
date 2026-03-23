# Muse Proxy on Cloudflare Workers

这个目录提供 `muse_plus` 的 Cloudflare Workers 代理版本。

支持的路由：

- `GET /health`
- `POST /api/dashscope/validate`
- `POST /api/dashscope/synthesize`
- `GET /api/audio/fetch?url=...`
- `GET /ws/dashscope/asr` WebSocket 语音识别代理
- `POST /api/minimax/validate` 占位
- `POST /api/minimax/synthesize` 占位

## 本地开发

前提：已安装 `wrangler`

```bash
cd cloudflare
wrangler dev
```

## 上线部署

```bash
cd cloudflare
wrangler secret put DASHSCOPE_API_KEY
wrangler deploy
```

如果后面要接 MiniMax：

```bash
wrangler secret put MINIMAX_API_KEY
```

## 可选变量

在 `wrangler.toml` 里可配置：

- `ALLOWED_ORIGINS`
- `ENABLE_MINIMAX`

## 前端接入

部署成功后，把 `muse_plus/js/runtime-config.js` 里的 `proxyBase` 改成 Worker 地址，例如：

```js
window.MUSE_RUNTIME_CONFIG = {
    proxyBase: "https://muse-proxy.your-subdomain.workers.dev"
};
```
