// pages/settings/settings.js
const app = getApp();
const i18n = require('../../utils/i18n.js');
const apiConfigUtil = require('../../utils/api-config.js');

Page({
  data: {
    apiUrl: '',
    apiKey: '',
    showKey: false,
    currentLang: 'zh-CN',
    t: i18n.locales['zh-CN'],
    inputRules: {
      trimSpace: true,
      uppercase: false,
      isbnRequired: false
    },
    copyFormat: 'detail',
    // 高级API配置
    apiConfig: apiConfigUtil.DEFAULT_API_CONFIG,
    testValue: '',
    testResult: null,
    showAdvancedConfig: false
  },

  onLoad() {
    this.loadSettings();
    this.updateLanguage();
  },

  // 更新语言
  updateLanguage() {
    const lang = app.globalData.language;
    this.setData({
      currentLang: lang,
      t: i18n.locales[lang]
    });
  },

  // 加载设置
  loadSettings() {
    const { apiConfig: appApiConfig, language } = app.globalData;
    
    this.setData({
      apiUrl: appApiConfig.url || '',
      apiKey: appApiConfig.key || '',
      currentLang: language || 'zh-CN'
    });
    
    // 加载高级API配置
    const advancedConfig = apiConfigUtil.loadApiConfig();
    this.setData({ apiConfig: advancedConfig });
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
            item_barcode: testBarcode,
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
    this.updateLanguage();
    
    const messages = {
      'zh-CN': '已切换到简体中文',
      'zh-TW': '已切換到繁體中文',
      'en': 'Switched to English'
    };
    
    wx.showToast({
      title: messages[lang],
      icon: 'none'
    });
  },

  // 输入规则配置
  toggleTrimSpace(e) {
    const inputRules = { ...this.data.inputRules, trimSpace: e.detail.value };
    this.setData({ inputRules });
    wx.setStorageSync('inputRules', inputRules);
  },

  toggleUppercase(e) {
    const inputRules = { ...this.data.inputRules, uppercase: e.detail.value };
    this.setData({ inputRules });
    wx.setStorageSync('inputRules', inputRules);
  },

  toggleIsbnRequired(e) {
    const inputRules = { ...this.data.inputRules, isbnRequired: e.detail.value };
    this.setData({ inputRules });
    wx.setStorageSync('inputRules', inputRules);
  },

  // 复制格式配置（旧版点击方式）
  setCopyFormat(e) {
    const format = e.currentTarget.dataset.format;
    this.setData({ copyFormat: format });
    wx.setStorageSync('copyFormat', format);
    wx.showToast({ title: '已设置复制格式', icon: 'success' });
  },

  // 复制格式配置（新版开关方式）
  setCopyFormatSwitch(e) {
    const format = e.currentTarget.dataset.format;
    const enabled = e.detail.value;
    
    if (enabled) {
      // 关闭其他选项
      this.setData({ copyFormat: format });
      wx.setStorageSync('copyFormat', format);
    }
  },

  // 切换高级配置显示
  toggleAdvancedConfig() {
    this.setData({ showAdvancedConfig: !this.data.showAdvancedConfig });
  },

  // API配置输入
  onApiNameInput(e) {
    const apiConfig = { ...this.data.apiConfig, name: e.detail.value };
    this.setData({ apiConfig });
  },

  onApiUrlInput(e) {
    const apiConfig = { ...this.data.apiConfig, url: e.detail.value };
    this.setData({ apiConfig });
  },

  setApiMethod(e) {
    const method = e.currentTarget.dataset.method;
    const apiConfig = { ...this.data.apiConfig, method };
    this.setData({ apiConfig });
  },

  setRequestType(e) {
    const requestType = e.currentTarget.dataset.type;
    const apiConfig = { ...this.data.apiConfig, requestType };
    this.setData({ apiConfig });
  },

  setTimeout(e) {
    const timeout = parseInt(e.currentTarget.dataset.timeout);
    const apiConfig = { ...this.data.apiConfig, timeout };
    this.setData({ apiConfig });
  },

  setResponseType(e) {
    const responseType = e.currentTarget.dataset.type;
    const apiConfig = { ...this.data.apiConfig, responseType };
    this.setData({ apiConfig });
  },

  // 字段映射
  onFieldChange(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const fieldMappings = [...this.data.apiConfig.fieldMappings];
    fieldMappings[index][field] = value;
    this.setData({ 
      apiConfig: { ...this.data.apiConfig, fieldMappings }
    });
  },

  onFieldVisibleChange(e) {
    const { index } = e.currentTarget.dataset;
    const visible = e.detail.value;
    const fieldMappings = [...this.data.apiConfig.fieldMappings];
    fieldMappings[index].visible = visible;
    this.setData({ 
      apiConfig: { ...this.data.apiConfig, fieldMappings }
    });
  },

  addFieldMapping() {
    const fieldMappings = [...this.data.apiConfig.fieldMappings];
    fieldMappings.push({ label: '', path: '', visible: true, order: fieldMappings.length + 1 });
    this.setData({ 
      apiConfig: { ...this.data.apiConfig, fieldMappings }
    });
  },

  // 测试配置
  onTestValueInput(e) {
    this.setData({ testValue: e.detail.value });
  },

  async testApiConfig() {
    const { apiConfig, testValue } = this.data;
    
    if (!testValue) {
      wx.showToast({ title: '请输入测试值', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '测试中...' });
    
    const result = await apiConfigUtil.testApiConfig(apiConfig, testValue);
    
    wx.hideLoading();
    this.setData({ testResult: result });
  },

  // 保存高级API配置
  saveAdvancedApiConfig() {
    const { apiConfig } = this.data;
    
    // 验证配置
    const validation = apiConfigUtil.validateConfig(apiConfig);
    if (!validation.valid) {
      wx.showModal({
        title: '配置错误',
        content: validation.errors.join('\n'),
        showCancel: false
      });
      return;
    }

    // 保存配置
    apiConfigUtil.saveApiConfig(apiConfig);
    
    wx.showToast({
      title: '高级配置已保存',
      icon: 'success'
    });
  },

  // 恢复默认设置
  resetAllSettings() {
    wx.showModal({
      title: '确认恢复',
      content: '确定恢复所有设置为默认值吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除所有本地存储的设置
          wx.removeStorageSync('apiConfig');
          wx.removeStorageSync('inputRules');
          wx.removeStorageSync('copyFormat');
          wx.removeStorageSync('language');
          
          // 重置全局数据
          app.globalData.apiConfig = { url: '', key: '' };
          app.globalData.language = 'zh-CN';
          
          // 重新加载页面
          this.loadSettings();
          this.setData({
            inputRules: { trimSpace: true, uppercase: false, isbnRequired: false },
            copyFormat: 'detail'
          });
          
          wx.showToast({ title: '已恢复默认设置', icon: 'success' });
        }
      }
    });
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定清空所有扫描历史吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          app.globalData.scanBatches = [];
          wx.setStorageSync('scanBatches', []);
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  // 导出数据
  exportData() {
    const batches = app.globalData.scanBatches;
    
    if (batches.length === 0) {
      wx.showToast({ title: '没有数据可导出', icon: 'none' });
      return;
    }

    let content = '';
    batches.forEach((batch, index) => {
      if (index > 0) content += '\n\n';
      content += `【批次 ${index + 1}】${new Date(batch.createdAt).toLocaleString()}\n`;
      batch.items.forEach(item => {
        const time = new Date(item.createdAt).toLocaleString();
        if (item.mode === 'book' && item.bookInfo) {
          content += `[${time}] 图书: ${item.bookInfo.title} - ${item.content}\n`;
        } else {
          content += `[${time}] ${item.content}\n`;
        }
      });
    });

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: `已复制 ${batches.length} 个批次到剪贴板`,
          showCancel: false
        });
      }
    });
  }
});
