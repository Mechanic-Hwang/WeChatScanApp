// utils/icon-generator.js
// 在小程序中使用Canvas生成WeUI风格图标

const ICON_SIZE = 81;
const COLOR_GRAY = '#999999';
const COLOR_GREEN = '#07C160';

// 绘制首页图标
function drawHomeIcon(ctx, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  const centerX = ICON_SIZE / 2;
  const centerY = ICON_SIZE / 2;
  const size = 30;
  
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

// 绘制历史图标
function drawHistoryIcon(ctx, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  const centerX = ICON_SIZE / 2;
  const centerY = ICON_SIZE / 2;
  const radius = 16;
  
  // 外圈
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // 指针
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX, centerY - radius + 6);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + radius - 8, centerY);
  ctx.stroke();
}

// 绘制设置图标
function drawSettingsIcon(ctx, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  const centerX = ICON_SIZE / 2;
  const centerY = ICON_SIZE / 2;
  const outerRadius = 16;
  const innerRadius = 10;
  const teeth = 8;
  
  // 齿轮齿
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius + 3;
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
  ctx.arc(centerX, centerY, innerRadius - 3, 0, Math.PI * 2);
  ctx.stroke();
}

// 生成所有图标
function generateAllIcons() {
  const icons = [
    { name: 'home', draw: drawHomeIcon },
    { name: 'history', draw: drawHistoryIcon },
    { name: 'settings', draw: drawSettingsIcon }
  ];
  
  icons.forEach(icon => {
    // 生成灰色版本
    const canvasGray = wx.createOffscreenCanvas({ type: '2d', width: ICON_SIZE, height: ICON_SIZE });
    const ctxGray = canvasGray.getContext('2d');
    icon.draw(ctxGray, COLOR_GRAY);
    
    // 生成绿色版本
    const canvasGreen = wx.createOffscreenCanvas({ type: '2d', width: ICON_SIZE, height: ICON_SIZE });
    const ctxGreen = canvasGreen.getContext('2d');
    icon.draw(ctxGreen, COLOR_GREEN);
    
    // 导出并保存
    // 注意：实际导出需要 wx.canvasToTempFilePath
  });
}

module.exports = {
  drawHomeIcon,
  drawHistoryIcon,
  drawSettingsIcon,
  generateAllIcons
};
