// generate-png.js - 不依赖外部库生成简单PNG图标
const fs = require('fs');
const path = require('path');

// 简单的PNG编码函数
function createSimplePNG(width, height, color) {
  // 解析颜色
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // 创建像素数据 (RGBA)
  const pixelData = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    pixelData[i * 4] = r;     // R
    pixelData[i * 4 + 1] = g; // G
    pixelData[i * 4 + 2] = b; // B
    pixelData[i * 4 + 3] = 255; // A (不透明)
  }
  
  // PNG文件头
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // 简化的PNG生成（实际项目中应使用完整PNG编码）
  // 这里我们创建一个占位文件，实际使用时请用真实图标替换
  return pixelData;
}

// 创建目录
const imagesDir = path.join(__dirname, 'miniprogram', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 由于无法直接生成复杂图标，我们创建说明文件
const readmeContent = `# TabBar 图标说明

需要在此目录放置以下6个图标文件：

## 图标列表

| 文件名 | 用途 | 状态 |
|--------|------|------|
| home.png | 首页未选中 | 灰色 #999999 |
| home-active.png | 首页选中 | 微信绿 #07C160 |
| history.png | 历史未选中 | 灰色 #999999 |
| history-active.png | 历史选中 | 微信绿 #07C160 |
| settings.png | 设置未选中 | 灰色 #999999 |
| settings-active.png | 设置选中 | 微信绿 #07C160 |

## 图标规范

- **尺寸**: 81x81 像素
- **格式**: PNG (透明背景)
- **风格**: WeUI 官方风格，线性图标
- **设计工具**: 建议使用 Figma、Sketch 或 Adobe Illustrator

## 图标设计参考

### 首页图标 (home)
- 房子轮廓
- 简洁线条
- 无填充

### 历史图标 (history)
- 时钟或列表
- 圆形表盘 + 指针
- 或三条横线列表

### 设置图标 (settings)
- 齿轮形状
- 6-8个齿
- 中心圆孔

## 在线图标资源

可以使用以下资源获取类似风格图标：
- [WeUI Icon](https://github.com/Tencent/weui-wxss)
- [Iconfont](https://www.iconfont.cn/) - 阿里巴巴矢量图标库
- [Feather Icons](https://feathericons.com/)

## 快速解决方案

1. 访问 https://www.iconfont.cn/
2. 搜索关键词：home、history、settings
3. 选择线性风格图标
4. 下载 PNG 格式
5. 使用图片编辑工具调整为 81x81 像素
6. 分别制作灰色和绿色版本
`;

fs.writeFileSync(path.join(imagesDir, 'README.md'), readmeContent);

console.log('✅ 图标目录已创建');
console.log('📁 路径:', imagesDir);
console.log('\n⚠️  请手动添加6个图标文件：');
console.log('  - home.png / home-active.png');
console.log('  - history.png / history-active.png');
console.log('  - settings.png / settings-active.png');
console.log('\n📖 详细说明请查看:', path.join(imagesDir, 'README.md'));

// 创建占位文件（透明1x1像素）
const transparentPixel = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG签名
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
  0x42, 0x60, 0x82
]);

const icons = [
  'home.png', 'home-active.png',
  'history.png', 'history-active.png',
  'settings.png', 'settings-active.png'
];

icons.forEach(icon => {
  const filePath = path.join(imagesDir, icon);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, transparentPixel);
    console.log(`✓ Created placeholder: ${icon}`);
  }
});

console.log('\n✅ 占位图标已创建（请替换为真实图标）');
