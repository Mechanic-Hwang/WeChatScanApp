// app.js - 小程序入口（支持扫描批次）
const apiConfigUtil = require('./utils/api-config.js');
const i18n = require('./utils/i18n.js');
App({
  globalData: {
    // 扫描批次列表
    scanBatches: [],
    // 当前活跃批次
    currentBatch: null,
    // 当前模式：'normal' 或 'book'
    currentMode: 'normal',
    // API配置
    apiConfig: {
      url: '',
      key: ''
    },
    // 语言设置
    // Language mode is "system" by default so the UI follows WeChat language.
    language: 'zh-CN',
    languageMode: 'system'
  },

  onLaunch() {
    this.loadConfig();
    console.log('扫码助手小程序启动');
  },

  // Keep system language mode fresh when the Mini Program returns to foreground.
  onShow() {
    this.syncSystemLanguage();
  },

  normalizeWechatLanguage(lang = '') {
    const value = String(lang).replace('_', '-').toLowerCase();
    if (value.startsWith('zh')) {
      return value.includes('tw') || value.includes('hk') || value.includes('hant') ? 'zh-TW' : 'zh-CN';
    }
    return 'en';
  },

  getWechatLanguage() {
    try {
      const appBaseInfo = wx.getAppBaseInfo ? wx.getAppBaseInfo() : {};
      const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
      return appBaseInfo.language || systemInfo.language || 'zh-CN';
    } catch (e) {
      console.error('Failed to read WeChat language:', e);
      return 'zh-CN';
    }
  },

  syncSystemLanguage() {
    if (this.globalData.languageMode !== 'system') return;
    this.globalData.language = this.normalizeWechatLanguage(this.getWechatLanguage());
  },

  // 加载配置
  loadConfig() {
    try {
      const scanBatches = wx.getStorageSync('scanBatches');
      if (scanBatches) {
        this.globalData.scanBatches = scanBatches;
      }
      
      const apiConfig = wx.getStorageSync('apiConfig');
      if (apiConfig) {
        this.globalData.apiConfig = apiConfig;
      }
      
      const currentMode = wx.getStorageSync('currentMode');
      if (currentMode) {
        this.globalData.currentMode = currentMode;
      }
      
      const language = wx.getStorageSync('language');
      if (language) {
        this.globalData.language = language;
      } else {
        // 默认使用系统语言或简体中文
        const systemInfo = wx.getSystemInfoSync();
        const systemLang = systemInfo.language;
        if (systemLang.startsWith('zh')) {
          this.globalData.language = systemLang.includes('TW') || systemLang.includes('HK') ? 'zh-TW' : 'zh-CN';
        } else {
          this.globalData.language = 'en';
        }
      }

      const savedLanguage = wx.getStorageSync('language');
      const languageMode = wx.getStorageSync('languageMode') || 'system';
      this.globalData.languageMode = languageMode;
      if (languageMode === 'manual' && savedLanguage) {
        this.globalData.language = savedLanguage;
      } else {
        this.globalData.languageMode = 'system';
        this.syncSystemLanguage();
      }
    } catch (e) {
      console.error('加载配置失败:', e);
    }
  },

  // 创建新批次
  createNewBatch(mode) {
    const batch = {
      batchId: Date.now().toString(),
      batchType: mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itemCount: 0,
      previewItems: [],
      items: [],
      selected: false
    };
    
    this.globalData.currentBatch = batch;
    return batch;
  },

  // 获取或创建当前批次
  getOrCreateBatch(mode) {
    // 如果有当前批次且是同一种模式，继续使用
    if (this.globalData.currentBatch && 
        this.globalData.currentBatch.batchType === mode) {
      return this.globalData.currentBatch;
    }
    
    // 否则创建新批次
    return this.createNewBatch(mode);
  },

  // 添加扫描记录到当前批次
  addScanRecordToBatch(record) {
    const batch = this.globalData.currentBatch;
    if (!batch) {
      console.error('没有活跃批次');
      return false;
    }

    const getDedupKey = (item) => {
      if (item.mode === 'book') {
        return item.barcode || (item.bookInfo && item.bookInfo.barcode) || item.content;
      }
      return item.content;
    };
    const recordKey = getDedupKey(record);

    // 检查当前批次是否已存在
    const existsInBatch = batch.items.findIndex(
      item => item.mode === record.mode && getDedupKey(item) === recordKey
    );
    
    if (existsInBatch !== -1) {
      // 已存在，移到顶部并更新时间
      const existingItem = batch.items.splice(existsInBatch, 1)[0];
      existingItem.createdAt = new Date().toISOString();
      batch.items.unshift(existingItem);
      batch.updatedAt = new Date().toISOString();
      batch.previewItems = this.buildPreviewItems(batch.items);
      this.saveBatch(batch);
      wx.showToast({
        title: (i18n.locales[this.globalData.language] || i18n.locales['zh-CN']).duplicateRecordMoved,
        icon: 'none'
      });
      return false;
    }

    // 检查其他批次是否已存在。命中后不新增，只把原记录和原批次移到顶部。
    for (let batchIndex = 0; batchIndex < this.globalData.scanBatches.length; batchIndex += 1) {
      const existingBatch = this.globalData.scanBatches[batchIndex];
      if (existingBatch.batchId === batch.batchId) continue;

      const existsInOtherBatch = existingBatch.items.findIndex(
        item => item.mode === record.mode && getDedupKey(item) === recordKey
      );
      
      if (existsInOtherBatch !== -1) {
        const existingItem = existingBatch.items.splice(existsInOtherBatch, 1)[0];
        existingItem.createdAt = new Date().toISOString();
        existingBatch.items.unshift(existingItem);
        existingBatch.updatedAt = new Date().toISOString();
        existingBatch.previewItems = this.buildPreviewItems(existingBatch.items);

        this.globalData.scanBatches.splice(batchIndex, 1);
        this.globalData.scanBatches.unshift(existingBatch);
        wx.setStorageSync('scanBatches', this.globalData.scanBatches);

        wx.showToast({
          title: (i18n.locales[this.globalData.language] || i18n.locales['zh-CN']).duplicateMoved,
          icon: 'none',
          duration: 2000
        });
        return false;
      }
    }

    // 添加记录
    record.id = Date.now().toString();
    record.createdAt = new Date().toISOString();
    batch.items.unshift(record);
    batch.itemCount = batch.items.length;
    batch.updatedAt = new Date().toISOString();
    
    // 更新预览项（前3条）
    batch.previewItems = this.buildPreviewItems(batch.items);

    // 保存批次
    this.saveBatch(batch);
    return true;
  },

  buildPreviewItems(items) {
    return items.slice(0, 3).map(item => {
      if (item.mode === 'book' && item.bookInfo) {
        const t = i18n.locales[this.globalData.language] || i18n.locales['zh-CN'];
        return `${item.bookInfo.title || item.content} / ${item.bookInfo.author || t.unknownAuthor}`;
      }
      return item.content.length > 30
        ? item.content.substring(0, 30) + '...'
        : item.content;
    });
  },

  // 保存批次
  saveBatch(batch) {
    // 检查是否已存在
    const existingIndex = this.globalData.scanBatches.findIndex(
      b => b.batchId === batch.batchId
    );
    
    if (existingIndex !== -1) {
      // 更新现有批次
      this.globalData.scanBatches[existingIndex] = batch;
    } else {
      // 添加新批次到顶部
      this.globalData.scanBatches.unshift(batch);
    }
    
    // 检查存储空间（限制10MB）
    this.checkStorageLimit();
    
    // 保存到本地存储
    wx.setStorageSync('scanBatches', this.globalData.scanBatches);
  },

  // 检查存储空间限制
  checkStorageLimit() {
    const MAX_BATCHES = 500;
    const MAX_STORAGE_MB = 10;
    const WARNING_STORAGE_MB = 8;
    const SAFE_STORAGE_MB = 9;
    
    // 限制批次数量
    if (this.globalData.scanBatches.length > MAX_BATCHES) {
      // 删除最旧的批次
      const toRemove = this.globalData.scanBatches.length - MAX_BATCHES;
      this.globalData.scanBatches.splice(-toRemove);
      console.log(`[Storage] 超出${MAX_BATCHES}批次限制，已清理${toRemove}个旧批次`);
    }
    
    // 估算存储大小（粗略估计）
    try {
      let sizeInMB = this.estimateBatchesSizeMB();
      
      if (sizeInMB > WARNING_STORAGE_MB && sizeInMB <= MAX_STORAGE_MB && !this.globalData.storageWarningShown) {
        this.globalData.storageWarningShown = true;
        wx.showToast({
          title: (i18n.locales[this.globalData.language] || i18n.locales['zh-CN']).storageNearLimit,
          icon: 'none',
          duration: 3000
        });
      }
      
      if (sizeInMB > MAX_STORAGE_MB) {
        let removedCount = 0;
        while (this.globalData.scanBatches.length > 0 && sizeInMB > SAFE_STORAGE_MB) {
          this.globalData.scanBatches.pop();
          removedCount += 1;
          sizeInMB = this.estimateBatchesSizeMB();
        }
        console.log(`[Storage] 超出${MAX_STORAGE_MB}MB限制，已清理${removedCount}个旧批次`);
        
        wx.showToast({
          title: (i18n.locales[this.globalData.language] || i18n.locales['zh-CN']).storageAutoCleaned,
          icon: 'none',
          duration: 3000
        });
      }
    } catch (e) {
      console.error('[Storage] 检查存储空间失败:', e);
    }
  },

  estimateBatchesSizeMB() {
    const dataStr = JSON.stringify(this.globalData.scanBatches || []);
    return (dataStr.length * 2) / (1024 * 1024);
  },

  // 完成当前批次
  finishCurrentBatch() {
    const batch = this.globalData.currentBatch;
    if (batch && batch.items && batch.items.length > 0) {
      this.saveBatch(batch);
      this.globalData.currentBatch = null;
      return true;
    }
    this.globalData.currentBatch = null;
    return false;
  },

  // 删除批次
  deleteBatches(batchIds) {
    this.globalData.scanBatches = this.globalData.scanBatches.filter(
      batch => !batchIds.includes(batch.batchId)
    );
    wx.setStorageSync('scanBatches', this.globalData.scanBatches);
  },

  deleteRecordFromBatch(batchId, recordId) {
    const batchIndex = this.globalData.scanBatches.findIndex(batch => batch.batchId === batchId);
    if (batchIndex === -1) return false;

    const batch = this.globalData.scanBatches[batchIndex];
    const nextItems = batch.items.filter(item => item.id !== recordId);
    if (nextItems.length === batch.items.length) return false;

    batch.items = nextItems;
    batch.itemCount = nextItems.length;
    batch.updatedAt = new Date().toISOString();
    batch.previewItems = this.buildPreviewItems(nextItems);

    if (nextItems.length === 0) {
      this.globalData.scanBatches.splice(batchIndex, 1);
    } else {
      this.globalData.scanBatches[batchIndex] = batch;
    }

    wx.setStorageSync('scanBatches', this.globalData.scanBatches);
    return true;
  },

  // 获取批次详情
  getBatchDetail(batchId) {
    return this.globalData.scanBatches.find(b => b.batchId === batchId);
  },

  // 保存API配置
  saveApiConfig(url, key) {
    this.globalData.apiConfig = { url, key };
    wx.setStorageSync('apiConfig', { url, key });
  },

  // 保存当前模式
  saveCurrentMode(mode) {
    this.globalData.currentMode = mode;
    wx.setStorageSync('currentMode', mode);
  },

  // 保存语言设置
  saveLanguage(lang) {
    if (lang === 'system') {
      this.globalData.languageMode = 'system';
      wx.setStorageSync('languageMode', 'system');
      wx.removeStorageSync('language');
      this.syncSystemLanguage();
      return;
    }

    this.globalData.languageMode = 'manual';
    this.globalData.language = lang;
    wx.setStorageSync('languageMode', 'manual');
    wx.setStorageSync('language', lang);
  },

  // 查询图书信息
  async queryBookInfo(barcode) {
    const advancedConfigs = apiConfigUtil.loadApiConfigs();
    if (advancedConfigs.some(config => config.enabled && config.url)) {
      const result = await apiConfigUtil.executeScanRequest(barcode);
      const parsed = result.parsedResult || {};
      const standard = result.standardResult || {};

      return {
        title: standard.title || parsed.title || parsed['书名'] || parsed.Title || barcode,
        author: standard.author || parsed.author || parsed['作者'] || parsed.Author || '',
        isbn: standard.isbn || parsed.isbn || parsed.ISBN || '',
        publisher: standard.publisher || parsed.publisher || parsed['出版社'] || '',
        place: standard.place || parsed.place || parsed['出版地'] || '',
        year: standard.year || parsed.year || parsed['出版年'] || '',
        callNumber: standard.callNumber || parsed.callNumber || parsed['索书号'] || '',
        status: standard.status || parsed.status || parsed['馆藏状态'] || '',
        barcode: standard.barcode || parsed.barcode || parsed['条码号'] || barcode,
        customResult: parsed,
        standardResult: standard,
        displayFields: result.displayFields || [],
        rawResponse: result.apiConfig && result.apiConfig.showRawResponse ? result.rawResponse : undefined,
        matchedRuleId: result.matchedRule && result.matchedRule.ruleId,
        apiConfigId: result.apiConfig && result.apiConfig.apiConfigId
      };
    }

    const { url, key } = this.globalData.apiConfig;
    
    if (!url) {
      throw new Error('请先配置API地址');
    }

    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: url,
          method: 'GET',
          data: { 
            barcode: barcode,
            apikey: key 
          },
          header: {
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200) {
        return this.parseBookData(response.data);
      } else {
        throw new Error('查询失败');
      }
    } catch (error) {
      console.error('图书查询错误:', error);
      throw error;
    }
  },

  // 解析图书数据
  parseBookData(data) {
    if (typeof data === 'string' && data.includes('<?xml')) {
      return this.parseAlmaXml(data);
    }
    return data;
  },

  async queryCustomScan(scanValue) {
    return apiConfigUtil.executeScanRequest(scanValue);
  },

  // 解析Alma XML
  parseAlmaXml(xmlString) {
    const getValue = (xml, tag) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
      return match ? match[1] : '';
    };

    return {
      title: getValue(xmlString, 'title'),
      author: getValue(xmlString, 'author'),
      isbn: getValue(xmlString, 'isbn'),
      publisher: getValue(xmlString, 'publisher_const'),
      place: getValue(xmlString, 'place_of_publication'),
      year: getValue(xmlString, 'date_of_publication'),
      callNumber: getValue(xmlString, 'permanent_call_number'),
      barcode: getValue(xmlString, 'barcode'),
      status: getValue(xmlString, 'base_status')
    };
  }
});
