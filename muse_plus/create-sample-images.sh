#!/bin/bash

# 创建示例图片的脚本（用于测试）
echo "🎨 创建示例背景图片..."

# 创建目录
mkdir -p images/backgrounds

# 使用 ImageMagick 或其他工具创建示例图片
# 如果没有 ImageMagick，我们创建一个简单的 HTML 文件来生成图片

cat > images/backgrounds/generate-samples.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>生成示例图片</title>
    <style>
        .canvas-container { margin: 10px; }
        canvas { border: 1px solid #ccc; }
    </style>
</head>
<body>
    <h2>右键点击图片 → 另存为 → 保存为对应的文件名</h2>
    
    <div class="canvas-container">
        <p>bg1.jpg - 浪漫渐变</p>
        <canvas id="canvas1" width="1920" height="1080"></canvas>
    </div>
    
    <div class="canvas-container">
        <p>bg2.jpg - 暧昧色调</p>
        <canvas id="canvas2" width="1920" height="1080"></canvas>
    </div>
    
    <div class="canvas-container">
        <p>bg3.jpg - 温柔夜色</p>
        <canvas id="canvas3" width="1920" height="1080"></canvas>
    </div>
    
    <div class="canvas-container">
        <p>bg4.jpg - 私密氛围</p>
        <canvas id="canvas4" width="1920" height="1080"></canvas>
    </div>
    
    <div class="canvas-container">
        <p>bg5.jpg - 朦胧美感</p>
        <canvas id="canvas5" width="1920" height="1080"></canvas>
    </div>

    <script>
        function createGradient(canvasId, colors) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');
            
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            colors.forEach((color, index) => {
                gradient.addColorStop(index / (colors.length - 1), color);
            });
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 添加一些装饰性元素
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const radius = Math.random() * 100 + 50;
                
                const circleGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                circleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                circleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = circleGradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 创建不同的渐变背景
        createGradient('canvas1', ['#1a1a2e', '#16213e', '#e94560']);
        createGradient('canvas2', ['#0f0f23', '#533483', '#e94560']);
        createGradient('canvas3', ['#16213e', '#0f3460', '#533483']);
        createGradient('canvas4', ['#1a1a2e', '#e94560', '#533483']);
        createGradient('canvas5', ['#0f0f23', '#16213e', '#1a1a2e']);
    </script>
</body>
</html>
EOF

echo "✅ 示例图片生成器已创建"
echo "📖 打开 images/backgrounds/generate-samples.html 来生成示例图片"
echo "   右键点击每个图片 → 另存为 → 保存为对应的文件名"
echo ""
echo "或者直接将你的图片文件重命名为："
echo "   bg1.jpg, bg2.jpg, bg3.jpg, bg4.jpg, bg5.jpg"
echo "   然后放入 images/backgrounds/ 目录"