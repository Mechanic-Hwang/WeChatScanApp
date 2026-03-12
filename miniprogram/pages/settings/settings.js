// pages/settings/settings.js
const app = getApp();

Page({
  data: {
    apiUrl: '',
    apiKey: '',
    showKey: false,
    currentLang: 'zh-CN'
  },

  onLoad() {
    this.loadSettings();
  },

  // 加载设置
  loadSettings() {
    const { apiConfig, language } = app.globalData;
    
    this.setData({
      apiUrl: apiConfig.url || '',
      apiKey: apiConfig.key || '',
      currentLang: language || 'zh-CN'
    });
  },

  // URL输入
  onUrlInput(e) {
    this.setData({ apiUrl: e.detail.value });
  },

  // Key输入
  onKeyInput(e) {
    this.setData({ apiKey: e.detail.value });
  },

  // 切换显示Key
  toggleShowKey() {
    this.setData({ showKey: !this.data.showKey });
  },

  // 保存API配置
  saveApiConfig() {
    const { apiUrl, apiKey } = this.data;
    
    // 验证URL格式
    if (apiUrl && !this.isValidUrl(apiUrl)) {
      wx.showToast({ title: 'API地址格式不正确', icon: 'none' });
      return;
    }

    app.saveApiConfig(apiUrl, apiKey);
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 验证URL
  isValidUrl(url) {
    return url.startsWith('http://') || url.startsWith('https://');
  },

  // 测试连接
  async testConnection() {
    const { apiUrl, apiKey } = this.data;
    
    if (!apiUrl) {
      wx.showToast({ title: '请先输入API地址', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '测试中...' });

    try {
      // 使用测试条码
      const testBarcode = '9787115428028';
      
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: apiUrl,
          method: 'GET',
          data: {
            barcode: testBarcode,
            apikey: apiKey
          },
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });

      wx.hideLoading();

      if (response.statusCode === 200) {
        wx.showModal({
          title: '连接成功',
          content: 'API连接正常，可以获取图书信息',
          showCancel: false
        });
      } else {
        throw new Error(`状态码: ${response.statusCode}`);
      }
    } catch (error) {
      wx.hideLoading();
      wx.showModal({
        title: '连接失败',
        content: `无法连接到API: ${error.errMsg || error.message}`,
        showCancel: false
      });
    }
  },

  // 切换语言
  switchLanguage(e) {
    const lang = e.currentTarget.dataset.lang;
    this.setData({ currentLang: lang });
    app.saveLanguage(lang);
    
    wx.showToast({
      title: lang === 'zh-CN' ? '已切换到中文' : 'Switched to English',
      icon: 'none'
    });
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定清空所有扫描历史吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          app.globalData.scanHistory = [];
          wx.setStorageSync('scanHistory', []);
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  // 导出数据
  exportData() {
    const history = app.globalData.scanHistory;
    
    if (history.length === 0) {
      wx.showToast({ title: '没有数据可导出', icon: 'none' });
      return;
    }

    const content = history.map(item => {
      const time = new Date(item.time).toLocaleString();
      if (item.mode === 'book' && item.bookInfo) {
        return `[${time}] 图书: ${item.bookInfo.title} - ${item.content}`;
      }
      return `[${time}] ${item.content}`;
    }).join('\n');

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: `已复制 ${history.length} 条记录到剪贴板`,
          showCancel: false
        });
      }
    });
  }
});
