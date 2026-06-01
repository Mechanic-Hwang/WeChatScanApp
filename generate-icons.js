// generate-icons.js - 生成WeUI风格图标
const fs = require('fs');
const path = require('path');

// 创建canvas（使用node-canvas库）
// 如果没有安装，需要先安装：npm install canvas

try {
  const { createCanvas } = require('canvas');
  
  const ICON_SIZE = 81;
  const COLOR_GRAY = '#999999';
  const COLOR_BLUE = '#1D6FEA';
  
  // 确保目录存在
  const imagesDir = path.join(__dirname, 'miniprogram', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  // 首页图标 - 房子形状
  function drawHomeIcon(ctx, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const centerX = ICON_SIZE / 2;
    const centerY = ICON_SIZE / 2;
    const size = 36;
    
    // 房子主体
    ctx.beginPath();
    ctx.moveTo(centerX - size/2, centerY + size/4);
    ctx.lineTo(centerX - size/2, centerY - size/4);
    ctx.lineTo(centerX, centerY - size/2);
    ctx.lineTo(centerX + size/2, centerY - size/4);
    ctx.lineTo(centerX + size/2, centerY + size/4);
    ctx.stroke();
    
    // 门
    ctx.beginPath();
    ctx.moveTo(centerX - size/8, centerY + size/4);
    ctx.lineTo(centerX - size/8, centerY);
    ctx.lineTo(centerX + size/8, centerY);
    ctx.lineTo(centerX + size/8, centerY + size/4);
    ctx.stroke();
  }
  
  // 历史图标 - 时钟/列表
  function drawHistoryIcon(ctx, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const centerX = ICON_SIZE / 2;
    const centerY = ICON_SIZE / 2;
    const radius = 18;
    
    // 时钟外圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 时钟指针
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - radius + 8);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius - 10, centerY);
    ctx.stroke();
  }
  
  // 设置图标 - 齿轮
  function drawSettingsIcon(ctx, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const centerX = ICON_SIZE / 2;
    const centerY = ICON_SIZE / 2;
    const outerRadius = 18;
    const innerRadius = 10;
    const teeth = 8;
    
    // 绘制齿轮齿
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius + 4;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    // 中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // 生成图标
  function generateIcon(name, drawFn, color) {
    const canvas = createCanvas(ICON_SIZE, ICON_SIZE);
    const ctx = canvas.getContext('2d');
    
    // 透明背景
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
    
    // 绘制图标
    drawFn(ctx, color);
    
    // 保存
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(imagesDir, name), buffer);
    console.log(`✓ Generated: ${name}`);
  }
  
  // 生成所有图标
  console.log('Generating WeUI style icons...\n');
  
  generateIcon('home.png', drawHomeIcon, COLOR_GRAY);
  generateIcon('home-active.png', drawHomeIcon, COLOR_BLUE);
  generateIcon('history.png', drawHistoryIcon, COLOR_GRAY);
  generateIcon('history-active.png', drawHistoryIcon, COLOR_BLUE);
  generateIcon('settings.png', drawSettingsIcon, COLOR_GRAY);
  generateIcon('settings-active.png', drawSettingsIcon, COLOR_BLUE);
  
  console.log('\n✅ All icons generated successfully!');
  console.log(`📁 Location: ${imagesDir}`);
  
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('\nPlease install canvas library first:');
  console.log('  npm install canvas');
  process.exit(1);
}
