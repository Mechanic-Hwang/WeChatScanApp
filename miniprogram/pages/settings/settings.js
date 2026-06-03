// pages/settings/settings.js
const app = getApp();
const i18n = require('../../utils/i18n.js');
const apiConfigUtil = require('../../utils/api-config.js');
const copyRulesUtil = require('../../utils/copy-rules.js');

Page({
  data: {
    apiUrl: '',
    apiKey: '',
    showKey: false,
    currentLang: 'zh-CN',
    languageMode: 'system',
    t: i18n.locales['zh-CN'],
    inputRules: {
      trimSpace: true,
      uppercase: false,
      isbnRequired: false,
      allowNewline: false,
      maxLength: 500,
      enterSubmit: true
    },
    copyFormat: 'detail',
    copyRules: copyRulesUtil.DEFAULT_COPY_RULES,
    bookFieldOptions: [],
    // 高级API配置
    apiConfig: apiConfigUtil.DEFAULT_API_CONFIG,
    apiConfigs: [],
    activeApiConfigId: 'api_book_query',
    headerItems: [],
    scanRules: [],
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
      languageMode: app.globalData.languageMode || 'system',
      t: i18n.locales[lang]
    });
  },

  text(key, params = {}) {
    let value = (this.data.t && this.data.t[key]) || key;
    Object.keys(params).forEach(name => {
      value = value.replace(`{${name}}`, params[name]);
    });
    return value;
  },

  // 加载设置
  loadSettings() {
    const { apiConfig: appApiConfig, language, languageMode } = app.globalData;
    const inputRules = {
      ...this.data.inputRules,
      ...(wx.getStorageSync('inputRules') || {})
    };
    const copyFormat = wx.getStorageSync('copyFormat') || this.data.copyFormat;
    const copyRules = copyRulesUtil.loadCopyRules();
    
    this.setData({
      apiUrl: appApiConfig.url || '',
      apiKey: appApiConfig.key || '',
      currentLang: language || 'zh-CN',
      languageMode: languageMode || 'system',
      inputRules,
      copyFormat,
      copyRules,
      bookFieldOptions: this.buildBookFieldOptions(copyRules)
    });
    
    // 加载高级API配置
    const apiConfigs = apiConfigUtil.loadApiConfigs();
    const activeApiConfigId = wx.getStorageSync('activeApiConfigId') || (apiConfigs[0] && apiConfigs[0].apiConfigId);
    const advancedConfig = apiConfigs.find(config => config.apiConfigId === activeApiConfigId) || apiConfigs[0] || apiConfigUtil.DEFAULT_API_CONFIG;
    this.setData({
      apiConfigs,
      activeApiConfigId: advancedConfig.apiConfigId,
      apiConfig: advancedConfig,
      headerItems: this.headersToItems(advancedConfig.headers)
    });
    this.setData({ scanRules: apiConfigUtil.loadScanRules() });
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
      wx.showToast({ title: this.text('invalidUrl'), icon: 'none' });
      return;
    }

    app.saveApiConfig(apiUrl, apiKey);
    
    wx.showToast({
      title: this.text('saveSuccess'),
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
      wx.showToast({ title: this.text('inputApiUrl'), icon: 'none' });
      return;
    }

    wx.showLoading({ title: this.text('testing') });

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
          title: this.text('connectionSuccess'),
          content: this.text('apiConnectionOk'),
          showCancel: false
        });
      } else {
        throw new Error(this.text('statusCode', { code: response.statusCode }));
      }
    } catch (error) {
      wx.hideLoading();
      wx.showModal({
        title: this.text('connectionFailed'),
        content: this.text('cannotConnectApi', { message: error.errMsg || error.message }),
        showCancel: false
      });
    }
  },

  // 切换语言
  switchLanguage(e) {
    const lang = e.currentTarget.dataset.lang;
    app.saveLanguage(lang);
    this.updateLanguage();
    
    wx.showToast({
      title: this.text('languageSwitched'),
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

  toggleAllowNewline(e) {
    const inputRules = { ...this.data.inputRules, allowNewline: e.detail.value };
    this.setData({ inputRules });
    wx.setStorageSync('inputRules', inputRules);
  },

  toggleEnterSubmit(e) {
    const inputRules = { ...this.data.inputRules, enterSubmit: e.detail.value };
    this.setData({ inputRules });
    wx.setStorageSync('inputRules', inputRules);
  },

  setMaxInputLength(e) {
    const inputRules = { ...this.data.inputRules, maxLength: Number(e.currentTarget.dataset.length) };
    this.setData({ inputRules });
    wx.setStorageSync('inputRules', inputRules);
  },

  // 复制格式配置（旧版点击方式）
  setCopyFormat(e) {
    const format = e.currentTarget.dataset.format;
    this.setData({ copyFormat: format });
    wx.setStorageSync('copyFormat', format);
    wx.showToast({ title: this.text('saveSuccess'), icon: 'success' });
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

  setCopyRange(e) {
    const copyRules = { ...this.data.copyRules, range: e.currentTarget.dataset.range };
    this.setData({ copyRules });
    copyRulesUtil.saveCopyRules(copyRules);
  },

  setCopySeparator(e) {
    const copyRules = { ...this.data.copyRules, separator: e.currentTarget.dataset.separator };
    this.setData({ copyRules });
    copyRulesUtil.saveCopyRules(copyRules);
  },

  toggleCopyIncludeTime(e) {
    const copyRules = { ...this.data.copyRules, includeTime: e.detail.value };
    this.setData({ copyRules });
    copyRulesUtil.saveCopyRules(copyRules);
  },

  toggleCopyIncludeMode(e) {
    const copyRules = { ...this.data.copyRules, includeMode: e.detail.value };
    this.setData({ copyRules });
    copyRulesUtil.saveCopyRules(copyRules);
  },

  toggleBookCopyField(e) {
    const field = e.currentTarget.dataset.field;
    const bookFields = {
      ...this.data.copyRules.bookFields,
      [field]: e.detail.value
    };
    const copyRules = { ...this.data.copyRules, bookFields };
    this.setData({
      copyRules,
      bookFieldOptions: this.buildBookFieldOptions(copyRules)
    });
    copyRulesUtil.saveCopyRules(copyRules);
  },

  buildBookFieldOptions(copyRules) {
    return Object.keys(copyRulesUtil.BOOK_FIELD_LABELS).map(key => ({
      key,
      label: copyRulesUtil.BOOK_FIELD_LABELS[key],
      checked: !!copyRules.bookFields[key]
    }));
  },

  // 切换高级配置显示
  toggleAdvancedConfig() {
    this.setData({ showAdvancedConfig: !this.data.showAdvancedConfig });
  },

  // API配置输入
  headersToItems(headers = {}) {
    return Object.keys(headers).map(key => ({ key, value: headers[key] }));
  },

  itemsToHeaders(items = []) {
    return items.reduce((headers, item) => {
      if (item.key) headers[item.key] = item.value || '';
      return headers;
    }, {});
  },

  syncActiveApiConfig(nextConfig = this.data.apiConfig) {
    const apiConfig = {
      ...nextConfig,
      headers: this.itemsToHeaders(this.data.headerItems)
    };
    const apiConfigs = this.data.apiConfigs.map(config => (
      config.apiConfigId === apiConfig.apiConfigId ? apiConfig : config
    ));
    this.setData({ apiConfig, apiConfigs });
    return { apiConfig, apiConfigs };
  },

  selectApiConfig(e) {
    const apiConfigId = e.currentTarget.dataset.id;
    const apiConfig = this.data.apiConfigs.find(config => config.apiConfigId === apiConfigId);
    if (!apiConfig) return;
    this.setData({
      activeApiConfigId: apiConfigId,
      apiConfig,
      headerItems: this.headersToItems(apiConfig.headers)
    });
    wx.setStorageSync('activeApiConfigId', apiConfigId);
  },

  addApiConfig() {
    const apiConfig = {
      ...apiConfigUtil.DEFAULT_API_CONFIG,
      apiConfigId: `api_config_${Date.now()}`,
      name: this.text('apiConfigName', { number: this.data.apiConfigs.length + 1 }),
      enabled: true,
      isDefault: this.data.apiConfigs.length === 0
    };
    const apiConfigs = [...this.data.apiConfigs, apiConfig];
    this.setData({
      apiConfigs,
      apiConfig,
      activeApiConfigId: apiConfig.apiConfigId,
      headerItems: this.headersToItems(apiConfig.headers)
    });
    wx.setStorageSync('activeApiConfigId', apiConfig.apiConfigId);
  },

  deleteApiConfig() {
    if (this.data.apiConfigs.length <= 1) {
      wx.showToast({ title: this.text('keepOneApiConfig'), icon: 'none' });
      return;
    }
    const apiConfigName = this.data.apiConfig.name || this.data.apiConfig.apiConfigId;
    wx.showModal({
      title: this.text('confirmDeleteApi'),
      content: this.text('deleteApiConfirm', { name: apiConfigName }),
      success: (res) => {
        if (!res.confirm) return;
        const apiConfigs = this.data.apiConfigs.filter(config => config.apiConfigId !== this.data.apiConfig.apiConfigId);
        const apiConfig = apiConfigs[0];
        this.setData({
          apiConfigs,
          apiConfig,
          activeApiConfigId: apiConfig.apiConfigId,
          headerItems: this.headersToItems(apiConfig.headers)
        });
        wx.setStorageSync('activeApiConfigId', apiConfig.apiConfigId);
      }
    });
  },

  onApiNameInput(e) {
    const apiConfig = { ...this.data.apiConfig, name: e.detail.value };
    this.syncActiveApiConfig(apiConfig);
  },

  onApiUrlInput(e) {
    const apiConfig = { ...this.data.apiConfig, url: e.detail.value };
    this.syncActiveApiConfig(apiConfig);
  },

  setApiMethod(e) {
    const method = e.currentTarget.dataset.method;
    const apiConfig = { ...this.data.apiConfig, method };
    this.syncActiveApiConfig(apiConfig);
  },

  setRequestType(e) {
    const requestType = e.currentTarget.dataset.type;
    const apiConfig = { ...this.data.apiConfig, requestType };
    this.syncActiveApiConfig(apiConfig);
  },

  setTimeout(e) {
    const timeout = parseInt(e.currentTarget.dataset.timeout);
    const apiConfig = { ...this.data.apiConfig, timeout };
    this.syncActiveApiConfig(apiConfig);
  },

  setResponseType(e) {
    const responseType = e.currentTarget.dataset.type;
    const apiConfig = { ...this.data.apiConfig, responseType };
    this.syncActiveApiConfig(apiConfig);
  },

  toggleApiEnabled(e) {
    this.syncActiveApiConfig({ ...this.data.apiConfig, enabled: e.detail.value });
  },

  setDefaultApi() {
    const activeId = this.data.apiConfig.apiConfigId;
    const apiConfigs = this.data.apiConfigs.map(config => ({
      ...config,
      isDefault: config.apiConfigId === activeId
    }));
    this.setData({
      apiConfigs,
      apiConfig: { ...this.data.apiConfig, isDefault: true }
    });
  },

  setEmptyValueMode(e) {
    this.syncActiveApiConfig({ ...this.data.apiConfig, emptyValueMode: e.currentTarget.dataset.mode });
  },

  toggleShowRawResponse(e) {
    this.syncActiveApiConfig({ ...this.data.apiConfig, showRawResponse: e.detail.value });
  },

  onJsonBodyInput(e) {
    this.syncActiveApiConfig({ ...this.data.apiConfig, jsonBodyTemplate: e.detail.value });
  },

  onQueryParamChange(e) {
    const { index, field } = e.currentTarget.dataset;
    const queryParams = [...this.data.apiConfig.queryParams];
    queryParams[index][field] = e.detail.value;
    this.syncActiveApiConfig({ ...this.data.apiConfig, queryParams });
  },

  addQueryParam() {
    const queryParams = [...this.data.apiConfig.queryParams, { key: '', value: '{{scanValue}}' }];
    this.syncActiveApiConfig({ ...this.data.apiConfig, queryParams });
  },

  deleteQueryParam(e) {
    const index = Number(e.currentTarget.dataset.index);
    const queryParams = this.data.apiConfig.queryParams.filter((_, itemIndex) => itemIndex !== index);
    this.syncActiveApiConfig({ ...this.data.apiConfig, queryParams });
  },

  onHeaderChange(e) {
    const { index, field } = e.currentTarget.dataset;
    const headerItems = [...this.data.headerItems];
    headerItems[index][field] = e.detail.value;
    this.setData({ headerItems });
    this.syncActiveApiConfig({ ...this.data.apiConfig, headers: this.itemsToHeaders(headerItems) });
  },

  addHeader() {
    const headerItems = [...this.data.headerItems, { key: '', value: '' }];
    this.setData({ headerItems });
    this.syncActiveApiConfig({ ...this.data.apiConfig, headers: this.itemsToHeaders(headerItems) });
  },

  deleteHeader(e) {
    const index = Number(e.currentTarget.dataset.index);
    const headerItems = this.data.headerItems.filter((_, itemIndex) => itemIndex !== index);
    this.setData({ headerItems });
    this.syncActiveApiConfig({ ...this.data.apiConfig, headers: this.itemsToHeaders(headerItems) });
  },

  // 字段映射
  addScanRule() {
    const scanRules = [
      ...this.data.scanRules,
      {
        ruleId: `rule_${Date.now()}`,
        name: this.text('ruleNameDefault', { number: this.data.scanRules.length + 1 }),
        enabled: true,
        pattern: '',
        priority: this.data.scanRules.length + 1,
        apiConfigId: this.data.apiConfig.apiConfigId
      }
    ];
    this.setData({ scanRules });
  },

  onScanRuleChange(e) {
    const { index, field } = e.currentTarget.dataset;
    const scanRules = [...this.data.scanRules];
    scanRules[index][field] = field === 'priority' ? Number(e.detail.value) : e.detail.value;
    this.setData({ scanRules });
  },

  toggleScanRule(e) {
    const index = e.currentTarget.dataset.index;
    const scanRules = [...this.data.scanRules];
    scanRules[index].enabled = e.detail.value;
    this.setData({ scanRules });
  },

  bindRuleToActiveApi(e) {
    const index = e.currentTarget.dataset.index;
    const scanRules = [...this.data.scanRules];
    scanRules[index].apiConfigId = this.data.apiConfig.apiConfigId;
    this.setData({ scanRules });
  },

  deleteScanRule(e) {
    const index = Number(e.currentTarget.dataset.index);
    const scanRules = this.data.scanRules.filter((_, itemIndex) => itemIndex !== index);
    this.setData({ scanRules });
  },

  saveScanRules() {
    const errors = [];
    this.data.scanRules.forEach((rule, index) => {
      const validation = apiConfigUtil.validateRule(rule);
      if (!validation.valid) {
        errors.push(this.text('ruleError', { number: index + 1, error: validation.error }));
      }
      if (!rule.apiConfigId) {
        errors.push(this.text('selectBoundApi', { number: index + 1 }));
      }
    });

    if (errors.length > 0) {
      wx.showModal({
        title: this.text('ruleConfigError'),
        content: errors.join('\n'),
        showCancel: false
      });
      return;
    }

    apiConfigUtil.saveScanRules(this.data.scanRules);
    wx.showToast({ title: this.text('ruleConfigSaved'), icon: 'success' });
  },

  onFieldChange(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const fieldMappings = [...this.data.apiConfig.fieldMappings];
    fieldMappings[index][field] = value;
    this.syncActiveApiConfig({ ...this.data.apiConfig, fieldMappings });
  },

  onFieldVisibleChange(e) {
    const { index } = e.currentTarget.dataset;
    const visible = e.detail.value;
    const fieldMappings = [...this.data.apiConfig.fieldMappings];
    fieldMappings[index].visible = visible;
    this.syncActiveApiConfig({ ...this.data.apiConfig, fieldMappings });
  },

  addFieldMapping() {
    const fieldMappings = [...this.data.apiConfig.fieldMappings];
    fieldMappings.push({ label: '', path: '', visible: true, order: fieldMappings.length + 1 });
    this.syncActiveApiConfig({ ...this.data.apiConfig, fieldMappings });
  },

  // 测试配置
  onTestValueInput(e) {
    this.setData({ testValue: e.detail.value });
  },

  async testApiConfig() {
    const synced = this.syncActiveApiConfig();
    const { apiConfig } = synced;
    const { testValue } = this.data;
    
    if (!testValue) {
      wx.showToast({ title: this.text('inputTestValue'), icon: 'none' });
      return;
    }

    wx.showLoading({ title: this.text('testing') });
    
    const result = await apiConfigUtil.testApiConfig(apiConfig, testValue);
    if (result.success) {
      result.apiConfigName = apiConfig.name || apiConfig.apiConfigId;
    }
    
    wx.hideLoading();
    this.setData({ testResult: result });
  },

  // 保存高级API配置
  saveAdvancedApiConfig() {
    const synced = this.syncActiveApiConfig();
    const apiConfig = {
      ...synced.apiConfig,
      enabled: synced.apiConfig.enabled !== false,
      apiConfigId: synced.apiConfig.apiConfigId || 'api_book_query'
    };
    
    // 验证配置
    const validation = apiConfigUtil.validateConfig(apiConfig);
    if (!validation.valid) {
      wx.showModal({
        title: this.text('configError'),
        content: validation.errors.join('\n'),
        showCancel: false
      });
      return;
    }

    // 保存配置
    const apiConfigs = synced.apiConfigs.map(config => (
      config.apiConfigId === apiConfig.apiConfigId ? apiConfig : config
    ));
    apiConfigUtil.saveApiConfig(apiConfig);
    apiConfigUtil.saveApiConfigs(apiConfigs);
    wx.setStorageSync('activeApiConfigId', apiConfig.apiConfigId);
    
    wx.showToast({
      title: this.text('advancedConfigSaved'),
      icon: 'success'
    });
  },

  // 恢复默认设置
  resetAllSettings() {
    wx.showModal({
      title: this.text('confirmRestore'),
      content: this.text('resetSettingsConfirm'),
      success: (res) => {
        if (res.confirm) {
          // 清除所有本地存储的设置
          wx.removeStorageSync('apiConfig');
          wx.removeStorageSync('inputRules');
          wx.removeStorageSync('copyFormat');
          wx.removeStorageSync('copyRules');
          wx.removeStorageSync('apiConfig_v2');
          wx.removeStorageSync('apiConfigs');
          wx.removeStorageSync('activeApiConfigId');
          wx.removeStorageSync('language');
          wx.removeStorageSync('languageMode');
          
          // 重置全局数据
          app.globalData.apiConfig = { url: '', key: '' };
          app.saveLanguage('system');
          
          // 重新加载页面
          this.loadSettings();
          this.setData({
            inputRules: { trimSpace: true, uppercase: false, isbnRequired: false, allowNewline: false, maxLength: 500, enterSubmit: true },
            copyFormat: 'detail',
            copyRules: copyRulesUtil.DEFAULT_COPY_RULES,
            bookFieldOptions: this.buildBookFieldOptions(copyRulesUtil.DEFAULT_COPY_RULES)
          });
          
          wx.showToast({ title: this.text('resetSettingsDone'), icon: 'success' });
        }
      }
    });
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: this.text('confirmClear'),
      content: this.text('clearConfirm'),
      success: (res) => {
        if (res.confirm) {
          app.globalData.scanBatches = [];
          wx.setStorageSync('scanBatches', []);
          wx.showToast({ title: this.text('clearDone'), icon: 'success' });
        }
      }
    });
  },

  // 导出数据
  exportData() {
    const batches = app.globalData.scanBatches;
    
    if (batches.length === 0) {
      wx.showToast({ title: this.text('noDataToExport'), icon: 'none' });
      return;
    }

    let content = '';
    batches.forEach((batch, index) => {
      if (index > 0) content += '\n\n';
      content += `${this.text('exportBatchTitle', {
        number: index + 1,
        time: new Date(batch.createdAt).toLocaleString()
      })}\n`;
      batch.items.forEach(item => {
        const time = new Date(item.createdAt).toLocaleString();
        if (item.mode === 'book' && item.bookInfo) {
          content += `[${time}] ${this.text('exportBookLabel')}: ${item.bookInfo.title} - ${item.content}\n`;
        } else {
          content += `[${time}] ${item.content}\n`;
        }
      });
    });

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showModal({
          title: this.text('exportSuccess'),
          content: this.text('copiedBatchesToClipboard', { count: batches.length }),
          showCancel: false
        });
      }
    });
  }
});
