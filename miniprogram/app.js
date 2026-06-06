// app.js - 小程序入口（支持扫描批次）
const apiConfigUtil = require('./utils/api-config.js');
const i18n = require('./utils/i18n.js');
const MAX_RECORD_STORAGE_BYTES = 200 * 1024;
const MAX_BATCH_STORAGE_BYTES = 2 * 1024 * 1024;
const BATCH_GAP_MS = 60 * 60 * 1000;
const STORAGE_LIMITS = {
  maxBatches: 500,
  maxStorageMB: 10,
  warningStorageMB: 8,
  safeStorageMB: 9,
  maxRecordBytes: MAX_RECORD_STORAGE_BYTES,
  maxBatchBytes: MAX_BATCH_STORAGE_BYTES
};
App({
  globalData: {
    // 扫描批次列表
    scanBatches: [],
    // 当前活跃批次
    currentBatch: null,
    // 当前模式：'normal' 或 'book'
    currentMode: 'normal',
    // API配置
    apiConfig: { url: '', key: '' },
    batchGapMs: BATCH_GAP_MS,
    storageLimits: STORAGE_LIMITS,
    // 语言设置
    // Language mode is "system" by default so the UI follows WeChat language.
    language: 'zh-CN',
    languageMode: 'system'
  },

  onLaunch() {
    this.loadConfig();
    console.log('Scan Archive 小程序启动');
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
    if (value.startsWith('es')) return 'es';
    if (value.startsWith('fr')) return 'fr';
    if (value.startsWith('de')) return 'de';
    if (value.startsWith('ja')) return 'ja';
    return 'en';
  },

  getWechatLanguage() {
    try {
      // getSystemInfoSync 已被基础库标记为废弃，语言优先从应用基础信息读取。
      const appBaseInfo = wx.getAppBaseInfo ? wx.getAppBaseInfo() : {};
      return appBaseInfo.language || 'zh-CN';
    } catch (e) {
      console.error('Failed to read WeChat language:', e);
      return 'zh-CN';
    }
  },

  syncSystemLanguage() {
    if (this.globalData.languageMode !== 'system') return;
    this.globalData.language = this.normalizeWechatLanguage(this.getWechatLanguage());
  },

  safeArray(value) {
    return Array.isArray(value) ? value : [];
  },

  isValidDate(value) {
    if (!value) return false;
    return !Number.isNaN(new Date(value).getTime());
  },

  normalizeRecord(record = {}) {
    const content = record.content === undefined || record.content === null ? '' : String(record.content);
    return {
      ...record,
      id: record.id || this.generateId('record'),
      mode: record.mode === 'book' ? 'book' : 'normal',
      content,
      createdAt: this.isValidDate(record.createdAt) ? record.createdAt : new Date().toISOString()
    };
  },

  normalizeBatch(batch = {}) {
    const items = this.safeArray(batch.items).map(item => this.normalizeRecord(item));
    const createdAt = this.isValidDate(batch.createdAt) ? batch.createdAt : new Date().toISOString();
    const updatedAt = this.isValidDate(batch.updatedAt) ? batch.updatedAt : createdAt;
    const normalizedBatch = {
      ...batch,
      batchId: batch.batchId || this.generateId('batch'),
      batchType: batch.batchType === 'book' ? 'book' : 'normal',
      createdAt,
      updatedAt,
      itemCount: items.length,
      previewItems: this.buildPreviewItems(items),
      items,
      selected: !!batch.selected
    };
    this.setBatchSizeCache(normalizedBatch);
    return normalizedBatch;
  },

  normalizeBatches(batches) {
    return this.safeArray(batches)
      .filter(batch => batch && typeof batch === 'object')
      .map(batch => this.normalizeBatch(batch));
  },

  restoreCurrentBatchFromHistory() {
    const currentMode = this.globalData.currentMode;
    const now = Date.now();
    const latestBatch = this.safeArray(this.globalData.scanBatches).find(batch => {
      if (!batch || batch.batchType !== currentMode) return false;
      if (!batch.items || batch.items.length === 0) return false;
      if (!this.isValidDate(batch.updatedAt)) return false;
      return now - new Date(batch.updatedAt).getTime() <= BATCH_GAP_MS;
    });

    this.globalData.currentBatch = latestBatch || null;
  },

  // 加载配置
  loadConfig() {
    try {
      const scanBatches = wx.getStorageSync('scanBatches');
      if (scanBatches) {
        this.globalData.scanBatches = this.normalizeBatches(scanBatches);
      }
      
      const apiConfig = wx.getStorageSync('apiConfig');
      if (apiConfig) {
        this.globalData.apiConfig = apiConfig;
      }
      
      const currentMode = wx.getStorageSync('currentMode');
      if (currentMode) {
        this.globalData.currentMode = currentMode;
      }
      this.restoreCurrentBatchFromHistory();
      
      const language = wx.getStorageSync('language');
      if (language) {
        this.globalData.language = language;
      } else {
        // 默认跟随微信语言，避免使用已废弃的 getSystemInfoSync。
        this.globalData.language = this.normalizeWechatLanguage(this.getWechatLanguage());
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
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  createNewBatch(mode) {
    const batch = {
      batchId: this.generateId('batch'),
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
    this.globalData.lastBatchAutoCreatedByGap = false;
    const currentBatch = this.globalData.currentBatch;
    const now = Date.now();

    // 如果有当前批次且是同一种模式，继续使用
    if (currentBatch && currentBatch.batchType === mode) {
      const updatedAt = this.isValidDate(currentBatch.updatedAt)
        ? new Date(currentBatch.updatedAt).getTime()
        : now;
      if (now - updatedAt <= BATCH_GAP_MS) {
        return currentBatch;
      }
      this.globalData.lastBatchAutoCreatedByGap = true;
    }
    
    // 否则创建新批次
    return this.createNewBatch(mode);
  },

  addScanRecord(record) {
    const mode = record && record.mode === 'book' ? 'book' : 'normal';
    const batch = this.getOrCreateBatch(mode);
    const autoCreatedByGap = !!this.globalData.lastBatchAutoCreatedByGap;
    const added = this.addScanRecordToBatch(record);
    return {
      added,
      batch,
      autoCreatedByGap,
      currentBatchHasRecords: !!(this.globalData.currentBatch && this.globalData.currentBatch.items && this.globalData.currentBatch.items.length > 0)
    };
  },

  // 添加扫描记录到当前批次
  addScanRecordToBatch(record) {
    const batch = this.globalData.currentBatch;
    if (!batch) {
      console.error('没有活跃批次');
      return false;
    }

    batch.items = this.safeArray(batch.items);
    const normalizedRecord = this.normalizeRecord(record);

    const getDedupKey = (item) => {
      if (item.mode === 'book') {
        return item.barcode || (item.bookInfo && item.bookInfo.barcode) || item.content;
      }
      return item.content;
    };
    const recordKey = getDedupKey(normalizedRecord);
    const t = i18n.locales[this.globalData.language] || i18n.locales['zh-CN'];

    // 检查当前批次是否已存在
    const existsInBatch = batch.items.findIndex(
      item => item.mode === normalizedRecord.mode && getDedupKey(item) === recordKey
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
        title: t.duplicateRecordMoved,
        icon: 'none'
      });
      return false;
    }

    // 检查其他批次是否已存在。命中后不新增，只把原记录和原批次移到顶部。
    for (let batchIndex = 0; batchIndex < this.globalData.scanBatches.length; batchIndex += 1) {
      const existingBatch = this.globalData.scanBatches[batchIndex];
      existingBatch.items = this.safeArray(existingBatch.items);
      if (existingBatch.batchId === batch.batchId) continue;

      const existsInOtherBatch = existingBatch.items.findIndex(
        item => item.mode === normalizedRecord.mode && getDedupKey(item) === recordKey
      );
      
      if (existsInOtherBatch !== -1) {
        const existingItem = existingBatch.items.splice(existsInOtherBatch, 1)[0];
        existingItem.createdAt = new Date().toISOString();
        existingBatch.items.unshift(existingItem);
        existingBatch.updatedAt = new Date().toISOString();
        existingBatch.previewItems = this.buildPreviewItems(existingBatch.items);
        existingBatch.itemCount = existingBatch.items.length;
        this.setBatchSizeCache(existingBatch);

        this.globalData.scanBatches.splice(batchIndex, 1);
        this.globalData.scanBatches.unshift(existingBatch);
        if (batch.items.length === 0) {
          this.globalData.currentBatch = existingBatch;
        }
        this.saveScanBatchesSafely();

        wx.showToast({
          title: t.duplicateMoved,
          icon: 'none',
          duration: 2000
        });
        return false;
      }
    }

    // 添加记录
    if (this.estimateObjectSizeBytes(normalizedRecord) > MAX_RECORD_STORAGE_BYTES) {
      wx.showToast({
        title: t.recordTooLarge,
        icon: 'none',
        duration: 3000
      });
      return false;
    }

    const nextBatchSize = this.estimateObjectSizeBytes({
      ...batch,
      items: [normalizedRecord, ...batch.items]
    });
    if (nextBatchSize > MAX_BATCH_STORAGE_BYTES) {
      wx.showToast({
        title: t.batchTooLarge,
        icon: 'none',
        duration: 3000
      });
      return false;
    }

    normalizedRecord.createdAt = new Date().toISOString();
    batch.items.unshift(normalizedRecord);
    batch.itemCount = batch.items.length;
    batch.updatedAt = new Date().toISOString();
    
    // 更新预览项（前3条）
    batch.previewItems = this.buildPreviewItems(batch.items);

    // 保存批次
    this.saveBatch(batch);
    return true;
  },

  buildPreviewItems(items) {
    return this.safeArray(items).slice(0, 3).map(item => {
      if (item.mode === 'book' && item.bookInfo) {
        const t = i18n.locales[this.globalData.language] || i18n.locales['zh-CN'];
        return `${item.bookInfo.title || item.content} / ${item.bookInfo.author || t.unknownAuthor}`;
      }
      const content = item.content === undefined || item.content === null ? '' : String(item.content);
      return content.length > 30
        ? content.substring(0, 30) + '...'
        : content;
    });
  },

  // 保存批次
  saveBatch(batch) {
    this.setBatchSizeCache(batch);
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
    this.saveScanBatchesSafely();
  },

  // 检查存储空间限制
  checkStorageLimit() {
    const {
      maxBatches,
      maxStorageMB,
      warningStorageMB,
      safeStorageMB
    } = STORAGE_LIMITS;
    
    // 限制批次数量
    if (this.globalData.scanBatches.length > maxBatches) {
      // 删除最旧的批次
      const toRemove = this.globalData.scanBatches.length - maxBatches;
      this.globalData.scanBatches.splice(-toRemove);
      console.log(`[Storage] 超出${maxBatches}批次限制，已清理${toRemove}个旧批次`);
    }
    
    // 估算存储大小（粗略估计）
    try {
      let sizeInMB = this.estimateBatchesSizeMB();
      
      if (sizeInMB > warningStorageMB && sizeInMB <= maxStorageMB && !this.globalData.storageWarningShown) {
        this.globalData.storageWarningShown = true;
        wx.showToast({
          title: (i18n.locales[this.globalData.language] || i18n.locales['zh-CN']).storageNearLimit,
          icon: 'none',
          duration: 3000
        });
      }
      
      if (sizeInMB > maxStorageMB) {
        let removedCount = 0;
        let totalBytes = this.estimateBatchesSizeBytes();
        const safeBytes = safeStorageMB * 1024 * 1024;
        while (this.globalData.scanBatches.length > 0 && totalBytes > safeBytes) {
          const removedBatch = this.globalData.scanBatches.pop();
          removedCount += 1;
          totalBytes -= this.estimateObjectSizeBytes(removedBatch);
        }
        sizeInMB = totalBytes / (1024 * 1024);
        console.log(`[Storage] 超出${maxStorageMB}MB限制，已清理${removedCount}个旧批次`);
        
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
    return this.estimateBatchesSizeBytes() / (1024 * 1024);
  },

  estimateBatchesSizeBytes() {
    return (this.globalData.scanBatches || []).reduce((total, batch) => (
      total + this.estimateObjectSizeBytes(batch)
    ), 0);
  },

  setBatchSizeCache(batch) {
    if (!batch || typeof batch !== 'object') return 0;
    const sizeBytes = this.calculateObjectSizeBytes(batch);
    try {
      Object.defineProperty(batch, '_sizeBytes', {
        value: sizeBytes,
        enumerable: false,
        configurable: true,
        writable: true
      });
    } catch (e) {
      batch._sizeBytes = sizeBytes;
    }
    return sizeBytes;
  },

  calculateObjectSizeBytes(value) {
    try {
      return JSON.stringify(value || {}).length * 2;
    } catch (e) {
      return 0;
    }
  },

  estimateObjectSizeBytes(value) {
    if (value && typeof value === 'object' && typeof value._sizeBytes === 'number') {
      return value._sizeBytes;
    }
    try {
      return JSON.stringify(value || {}).length * 2;
    } catch (e) {
      return 0;
    }
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
    const ids = Array.isArray(batchIds) ? batchIds : [];
    this.globalData.scanBatches = this.globalData.scanBatches.filter(
      batch => !ids.includes(batch.batchId)
    );
    if (this.globalData.currentBatch && ids.includes(this.globalData.currentBatch.batchId)) {
      this.globalData.currentBatch = null;
    }
    this.saveScanBatchesSafely();
  },

  clearScanBatches() {
    this.globalData.scanBatches = [];
    this.globalData.currentBatch = null;
    this.globalData.lastBatchAutoCreatedByGap = false;
    return this.saveScanBatchesSafely();
  },

  saveScanBatchesSafely() {
    try {
      wx.setStorageSync('scanBatches', this.globalData.scanBatches);
      return true;
    } catch (e) {
      console.error('[Storage] 保存历史失败，尝试清理旧记录后重试:', e);
      if (this.globalData.scanBatches.length > 0) {
        this.globalData.scanBatches.pop();
      }

      try {
        wx.setStorageSync('scanBatches', this.globalData.scanBatches);
        wx.showToast({
          title: (i18n.locales[this.globalData.language] || i18n.locales['zh-CN']).storageAutoCleaned,
          icon: 'none',
          duration: 3000
        });
        return true;
      } catch (retryError) {
        console.error('[Storage] 重试保存历史失败:', retryError);
        wx.showToast({
          title: (i18n.locales[this.globalData.language] || i18n.locales['zh-CN']).storageSaveFailed,
          icon: 'none',
          duration: 3000
        });
        return false;
      }
    }
  },

  deleteRecordFromBatch(batchId, recordId) {
    const batchIndex = this.globalData.scanBatches.findIndex(batch => batch.batchId === batchId);
    if (batchIndex === -1) return false;

    const batch = this.globalData.scanBatches[batchIndex];
    const items = this.safeArray(batch.items);
    const nextItems = items.filter(item => item.id !== recordId);
    if (nextItems.length === items.length) return false;

    batch.items = nextItems;
    batch.itemCount = nextItems.length;
    batch.updatedAt = new Date().toISOString();
    batch.previewItems = this.buildPreviewItems(nextItems);
    this.setBatchSizeCache(batch);

    if (nextItems.length === 0) {
      this.globalData.scanBatches.splice(batchIndex, 1);
      if (this.globalData.currentBatch && this.globalData.currentBatch.batchId === batchId) {
        this.globalData.currentBatch = null;
      }
    } else {
      this.globalData.scanBatches[batchIndex] = batch;
      if (this.globalData.currentBatch && this.globalData.currentBatch.batchId === batchId) {
        this.globalData.currentBatch = batch;
      }
    }

    this.saveScanBatchesSafely();
    return true;
  },

  // 获取批次详情
  getBatchDetail(batchId) {
    return this.globalData.scanBatches.find(b => b.batchId === batchId);
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

  resolveScanRoute(scanValue) {
    return apiConfigUtil.resolveApiConfigForScan(scanValue);
  },

  async queryCustomScan(scanValue, options = {}) {
    try {
      const result = await apiConfigUtil.executeScanRequest(scanValue, options);
      return {
        ...result,
        queryFailed: false,
        errorMessage: ''
      };
    } catch (error) {
      const resolved = apiConfigUtil.resolveApiConfigForScan(scanValue, options);
      if (options.throwOnError) {
        throw error;
      }
      return {
        matchedRule: resolved.matchedRule,
        captureGroups: resolved.captureGroups || [],
        namedGroups: resolved.namedGroups || {},
        apiConfig: resolved.apiConfig || null,
        rawResponse: null,
        parsedResult: { content: scanValue },
        standardResult: { content: scanValue },
        parsedFields: [{ label: 'content', value: scanValue }],
        displayFields: [{ label: 'content', value: scanValue }],
        noRuleMatched: !resolved.matchedRule,
        fallbackToRaw: true,
        queryFailed: true,
        errorMessage: this.getQueryErrorMessage(error),
        rawErrorMessage: error.message || ''
      };
    }
  },

  getQueryErrorMessage(error = {}) {
    const t = i18n.locales[this.globalData.language] || i18n.locales['zh-CN'];
    const message = String(error.errMsg || error.message || '').toLowerCase();
    if (message.includes('timeout') || message.includes('timed out') || message.includes('超时')) {
      return t.networkTimeout;
    }
    return t.apiException;
  },

  // 图书模式在首页基于 queryCustomScan 的标准字段组装展示数据。
});
