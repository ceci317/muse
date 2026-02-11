#!/bin/bash

echo "🚀 推送到 GitHub 并触发 Pages 更新..."
echo "================================"

# 检查是否有未提交的更改
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  检测到未提交的更改，先提交..."
    git add .
    git commit -m "📝 自动提交未保存的更改"
fi

# 显示当前状态
echo "📋 当前提交状态:"
git log --oneline -3

echo ""
echo "🌐 开始推送到 GitHub..."

# 尝试推送，最多重试3次
for i in {1..3}; do
    echo "尝试推送 ($i/3)..."
    
    if git push origin main; then
        echo "✅ 推送成功！"
        echo ""
        echo "🎉 GitHub Pages 更新已触发"
        echo "📱 访问地址:"
        echo "   - 主页: https://ceci317.github.io/muse/"
        echo "   - 应用: https://ceci317.github.io/muse/muse_plus/"
        echo "   - 图片测试: https://ceci317.github.io/muse/muse_plus/test-images.html"
        echo ""
        echo "⏰ GitHub Pages 通常需要 1-5 分钟更新"
        echo "   如果页面没有更新，请等待几分钟后刷新"
        exit 0
    else
        echo "❌ 推送失败，等待 5 秒后重试..."
        sleep 5
    fi
done

echo "❌ 推送失败，请检查网络连接或稍后重试"
echo ""
echo "💡 手动推送命令:"
echo "   git push origin main"
echo ""
echo "🔧 如果持续失败，可以尝试:"
echo "   1. 检查网络连接"
echo "   2. 使用 VPN 或更换网络"
echo "   3. 稍后重试（可能是 GitHub 服务临时问题）"