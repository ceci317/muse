#!/bin/bash

echo "🛑 停止 Muse Plus 服务"
echo "===================="

# 停止端口 3000 上的进程
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "🌐 停止 HTTP 服务器 (端口 3000)..."
    lsof -Pi :3000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    echo "✅ HTTP 服务器已停止"
else
    echo "🌐 HTTP 服务器未运行"
fi

# 停止端口 3001 上的进程
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "📡 停止代理服务器 (端口 3001)..."
    lsof -Pi :3001 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
    echo "✅ 代理服务器已停止"
else
    echo "📡 代理服务器未运行"
fi

# 清理 PID 文件
rm -f .proxy.pid .http.pid

echo ""
echo "✅ 所有服务已停止"