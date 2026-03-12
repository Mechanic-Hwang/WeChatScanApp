// miniprogram/utils/icons.js
// WeUI 风格 SVG 图标 Base64 编码

const ICON_SIZE = 81;

// 首页图标 SVG
const homeSVG = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 81 81">
  <g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.25 35.4375V60.75H60.75V35.4375"/>
    <path d="M15.1875 33.4688L40.5 15.1875L65.8125 33.4688"/>
    <path d="M33.4688 60.75V45.5625H47.5312V60.75"/>
  </g>
</svg>`;

// 历史图标 SVG
const historySVG = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 81 81">
  <g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="40.5" cy="40.5" r="19.4062"/>
    <path d="M40.5 28.6875V40.5L49.2188 45.5625"/>
  </g>
</svg>`;

// 设置图标 SVG
const settingsSVG = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 81 81">
  <g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="40.5" cy="40.5" r="8.1"/>
    <path d="M40.5 20.25V24.3M40.5 56.7V60.75M20.25 40.5H24.3M56.7 40.5H60.75M25.8 25.8L28.65 28.65M52.35 52.35L55.2 55.2M25.8 55.2L28.65 52.35M52.35 28.65L55.2 25.8"/>
  </g>
</svg>`;

// 转换为 Base64
function svgToBase64(svg) {
  return 'data:image/svg+xml;base64,' + wx.arrayBufferToBase64(new TextEncoder().encode(svg));
}

// 图标配置
const icons = {
  home: {
    default: svgToBase64(homeSVG('#999999')),
    active: svgToBase64(homeSVG('#07C160'))
  },
  history: {
    default: svgToBase64(historySVG('#999999')),
    active: svgToBase64(historySVG('#07C160'))
  },
  settings: {
    default: svgToBase64(settingsSVG('#999999')),
    active: svgToBase64(settingsSVG('#07C160'))
  }
};

module.exports = icons;
