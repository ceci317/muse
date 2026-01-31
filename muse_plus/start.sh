#!/bin/bash

# Muse Plus 启动脚本
echo "🚀 启动 Muse Plus 应用"
echo "======================"

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python 3"
    echo "   请安装 Python 3: https://www.python.org/downloads/"
    exit 1
fi

# 检查 requests 库
if ! python3 -c "import requests" 2>/dev/null; then
    echo "❌ 错误: 未找到 requests 库"
    echo "   请安装: pip3 install requests"
    exit 1
fi

# 停止可能存在的进程
echo "🧹 清理现有进程..."
pkill -f "python3.*simple_proxy.py" 2>/dev/null || true
pkill -f "python3.*http.server.*3000" 2>/dev/null || true
sleep 1

# 启动代理服务器
echo "📡 启动 CORS 代理服务器..."
python3 simple_proxy.py &
PROXY_PID=$!

# 等待代理服务器启动
sleep 2

# 检查代理服务器是否启动成功
if ! kill -0 $PROXY_PID 2>/dev/null; then
    echo "❌ 代理服务器启动失败"
    exit 1
fi

# 启动 HTTP 服务器
echo "🌐 启动 HTTP 服务器..."
python3 -m http.server 3000 &
HTTP_PID=$!

# 等待 HTTP 服务器启动
sleep 2

# 检查 HTTP 服务器是否启动成功
if ! kill -0 $HTTP_PID 2>/dev/null; then
    echo "❌ HTTP 服务器启动失败"
    kill $PROXY_PID 2>/dev/null
    exit 1
fi

echo ""
echo "✅ Muse Plus 启动完成！"
echo "🔗 主应用: http://localhost:3000/"
echo "🔧 调试工具: http://localhost:3000/debug-dashscope-tts.html"
echo ""
echo "💡 功能特性："
echo "   • 高质量 DashScope TTS 语音合成"
echo "   • 智能语音引擎切换 (DashScope/WebSpeech)"
echo "   • 完整的错误诊断工具"
echo "   • CORS 代理服务器自动处理跨域问题"
echo ""
echo "⏹️  按 Ctrl+C 停止所有服务"

# 等待中断信号
trap 'echo ""; echo "🛑 正在停止服务..."; kill $PROXY_PID $HTTP_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
wait