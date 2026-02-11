#!/bin/bash

# 添加背景图片的脚本
# 使用方法：将你的图片文件拖拽到这个脚本上，或者手动复制到 images/backgrounds/ 目录

echo "🎨 Muse Plus 背景图片添加工具"
echo "================================"

# 创建目录（如果不存在）
mkdir -p images/backgrounds

echo "📁 请将你的浪漫背景图片放在以下位置："
echo "   images/backgrounds/bg1.jpg  (第一张浪漫图片)"
echo "   images/backgrounds/bg2.png  (第二张浪漫图片)"
echo "   images/backgrounds/bg3.png  (第三张浪漫图片)"
echo "   images/backgrounds/bg4.png  (第四张浪漫图片)"
echo "   images/backgrounds/bg5.png  (第五张浪漫图片)"
echo "   images/backgrounds/bg6.png  (第六张浪漫图片，可选)"
echo ""
echo "💡 提示："
echo "   - 支持 JPG、PNG 格式"
echo "   - 建议尺寸：1920x1080 或更高"
echo "   - 图片会自动适配屏幕尺寸"
echo "   - 系统会应用浪漫滤镜效果"
echo ""

# 检查现有图片
echo "🔍 检查现有图片："
found_count=0

# 检查具体的文件格式
files=("bg1.jpg" "bg2.png" "bg3.png" "bg4.png" "bg5.png" "bg6.png")
for file in "${files[@]}"; do
    if [ -f "images/backgrounds/$file" ]; then
        echo "   ✅ $file 已存在"
        found_count=$((found_count + 1))
    else
        echo "   ❌ $file 缺失"
    fi
done

echo ""
if [ $found_count -eq 0 ]; then
    echo "⚠️  没有找到任何背景图片"
    echo "   系统将使用美丽的渐变背景作为备用方案"
elif [ $found_count -lt 5 ]; then
    echo "⚠️  找到 $found_count/6 张图片"
    echo "   建议添加至少5张图片以获得最佳轮播效果"
else
    echo "🎉 找到 $found_count 张背景图片，轮播效果已就绪！"
fi

echo ""
echo "🚀 添加图片后，刷新浏览器即可看到效果！"
echo "   如果图片无法加载，会显示美丽的渐变背景作为备用方案。"
echo ""
echo "📖 更多信息请查看: images/backgrounds/README.md"