#!/bin/bash

echo "🧪 Muse Plus 快速测试"
echo "===================="

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装"
    exit 1
fi

# 检查 requests 库
if ! python3 -c "import requests" 2>/dev/null; then
    echo "📦 安装 requests 库..."
    pip3 install requests
fi

# 检查文件完整性
echo "📁 检查文件完整性..."
files=(
    "index.html"
    "debug-dashscope-tts.html"
    "simple_proxy.py"
    "js/tts/TTSConfig.js"
    "js/tts/DashScopeEngine.js"
    "js/tts/WebSpeechEngine.js"
    "js/tts/TTSService.js"
)

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file 缺失"
        exit 1
    fi
done

echo ""
echo "🎉 所有文件检查完成！"
echo "💡 运行 ./start.sh 启动应用"