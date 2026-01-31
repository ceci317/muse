#!/bin/bash

echo "🚀 启动 Muse 应用 (带 CORS 代理)"
echo "================================"

# 检查代理服务器是否已经在运行
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "📡 代理服务器已在运行 (端口 3001)"
else
    echo "📡 启动 CORS 代理服务器..."
    python3 proxy_server.py &
    PROXY_PID=$!
    sleep 2
fi

# 检查 HTTP 服务器是否已经在运行
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "🌐 HTTP 服务器已在运行 (端口 3000)"
else
    echo "🌐 启动 HTTP 服务器..."
    python3 -m http.server 3000 &
    HTTP_PID=$!
fi

echo ""
echo "✅ 服务启动完成！"
echo "🔗 访问地址: http://localhost:3000/v17.html"
echo "🔧 调试工具: http://localhost:3000/debug-dashscope-tts.html"
echo ""
echo "💡 现在 DashScope TTS 应该可以正常工作了！"
echo "   代理服务器会自动处理 CORS 问题"
echo ""