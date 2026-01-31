#!/bin/bash

echo "🚀 启动 Muse 应用 (带 CORS 代理)"
echo "================================"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 启动代理服务器
echo "📡 启动 CORS 代理服务器..."
node proxy-server.js &
PROXY_PID=$!

# 等待代理服务器启动
sleep 2

# 启动 HTTP 服务器
echo "🌐 启动 HTTP 服务器..."
python3 -m http.server 3000 &
HTTP_PID=$!

echo ""
echo "✅ 服务启动完成！"
echo "🔗 访问地址: http://localhost:3000/v17.html"
echo "🔧 调试工具: http://localhost:3000/debug-dashscope-tts.html"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $PROXY_PID $HTTP_PID 2>/dev/null; echo '✅ 服务已停止'; exit 0" INT

# 保持脚本运行
wait