// pages/index/index.js - 支持扫描批次
const app = getApp();
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    currentMode: 'normal',
    inputValue: '',
    isLoading: false,
    inputRules: {
      trimSpace: true,
      uppercase: false,
      isbnRequired: false,
      allowNewline: false,
      maxLength: 500,
      enterSubmit: true
    },
    recentBatches: [],
    recentBatchDisplayCount: 5,
    recentBatchStep: 5,
    hasMoreRecentBatches: false,
    currentBatchHasRecords: false,
    t: i18n.locales[app.globalData.language || 'zh-CN']
  },

  onLoad() {
    this.setData({
      currentMode: app.globalData.currentMode,
      inputRules: this.loadInputRules(),
      currentBatchHasRecords: this.hasCurrentBatchRecords(),
      t: i18n.locales[app.globalData.language || 'zh-CN']
    });
  },

  onShow() {
    this.loadRecentBatches();
    // 刷新语言
    this.setData({
      inputRules: this.loadInputRules(),
      currentBatchHasRecords: this.hasCurrentBatchRecords(),
      t: i18n.locales[app.globalData.language || 'zh-CN']
    });
  },

  hasCurrentBatchRecords() {
    const batch = app.globalData.currentBatch;
    return !!(batch && batch.items && batch.items.length > 0);
  },

  syncCurrentBatchState() {
    this.setData({ currentBatchHasRecords: this.hasCurrentBatchRecords() });
  },

  loadInputRules() {
    const rules = {
      ...this.data.inputRules,
      ...(wx.getStorageSync('inputRules') || {})
    };
    if (rules.allowNewline) {
      rules.enterSubmit = false;
    }
    return rules;
  },

  // 加载最近批次
  loadRecentBatches() {
    const displayCount = this.data.recentBatchDisplayCount || 5;
    const batches = app.globalData.scanBatches.slice(0, displayCount).map(batch => {
      return {
        batchId: batch.batchId,
        batchType: batch.batchType,
        itemCount: batch.itemCount || (batch.items ? batch.items.length : 0),
        previewItems: batch.previewItems || [],
        createdAt: batch.createdAt,
        time: this.formatTime(batch.createdAt),
        title: this.formatBatchTitle(batch)
      };
    });
    
    this.setData({
      recentBatches: batches,
      hasMoreRecentBatches: app.globalData.scanBatches.length > displayCount
    });
  },

  // 格式化时间
  formatTime(isoString) {
    const t = this.data.t;
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? t.justNow : t.minutesAgo.replace('{count}', minutes);
    }
    if (diff < 86400000) {
      return t.hoursAgo.replace('{count}', Math.floor(diff / 3600000));
    }
    return t.monthDay
      .replace('{month}', date.getMonth() + 1)
      .replace('{day}', date.getDate());
  },

  // 格式化批次标题
  formatBatchTitle(batch) {
    const t = this.data.t;
    const date = new Date(batch.createdAt);
    return t.batchTitle
      .replace('{month}', date.getMonth() + 1)
      .replace('{day}', date.getDate())
      .replace('{hour}', String(date.getHours()).padStart(2, '0'))
      .replace('{minute}', String(date.getMinutes()).padStart(2, '0'));
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ 
      currentMode: mode,
      inputValue: ''  // 清空输入框
    });
    app.saveCurrentMode(mode);
    
    const t = this.data.t;
    wx.showToast({
      title: mode === 'book' ? t.switchToBookMode : t.switchToNormalMode,
      icon: 'none'
    });
  },

  // 开始扫码
  startScan() {
    wx.scanCode({
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        this.handleScanResult(res.result, { fromCamera: true });
      },
      fail: (err) => {
        const message = this.getScanFailMessage(err);
        if (message) {
          wx.showToast({ title: message, icon: 'none', duration: 2500 });
        }
      }
    });
  },

  getScanFailMessage(err = {}) {
    const errMsg = String(err.errMsg || '').toLowerCase();
    const t = this.data.t;
    if (errMsg.includes('cancel')) return t.scanCancelled || t.cancel;
    if (errMsg.includes('auth') || errMsg.includes('permission') || errMsg.includes('authorize')) {
      return t.noCameraPermissionManualInput || t.scanPermissionDenied || t.scanFailed;
    }
    if (errMsg.includes('recognize') || errMsg.includes('decode') || errMsg.includes('no code')) {
      return t.cannotRecognizeBarcode || t.scanRecognizeFailed || t.scanFailed;
    }
    if (errMsg.includes('system') || errMsg.includes('camera')) {
      return t.scanSystemError || t.scanFailed;
    }
    return t.scanFailed;
  },

  // 处理扫码结果
  async handleScanResult(content, options = {}) {
    content = content === undefined || content === null ? '' : String(content);
    const { currentMode } = this.data;

    const t = this.data.t;
    if (currentMode === 'book') {
      if (this.data.isLoading) return;
      this.setData({ isLoading: true });
      if (options.fromCamera) wx.showLoading({ title: t.recognizing });
      wx.showLoading({ title: t.matchingRules });
      wx.showLoading({ title: t.querying });

      let scanResult;
      try {
        scanResult = await app.queryCustomScan(content);
      } catch (error) {
        scanResult = this.buildLocalScanFallback(content, error);
      } finally {
        wx.hideLoading();
        this.setData({ isLoading: false });
      }
      const bookInfo = this.buildBookInfo(content, scanResult);

      const saveResult = app.addScanRecord({
        mode: 'book',
        content: content,
        barcode: bookInfo.barcode || content,
        title: bookInfo.title || content,
        bookInfo,
        customResult: scanResult.parsedResult,
        standardResult: scanResult.standardResult,
        displayFields: scanResult.displayFields || scanResult.parsedFields || [],
        rawResponse: scanResult.rawResponse,
        rawResponseText: scanResult.rawResponseText,
        apiConfigId: scanResult.apiConfig && scanResult.apiConfig.apiConfigId,
        matchedRuleId: scanResult.matchedRule && scanResult.matchedRule.ruleId,
        noRuleMatched: scanResult.noRuleMatched,
        fallbackToRaw: scanResult.fallbackToRaw,
        queryFailed: scanResult.queryFailed,
        errorMessage: scanResult.errorMessage
      });

      if (scanResult.queryFailed) {
        wx.showModal({
          title: t.queryFailed,
          content: scanResult.errorMessage || t.cannotGetBookInfo,
          showCancel: false
        });
      }
      this.showScanSaveToast(saveResult, scanResult);
      this.syncCurrentBatchState();
      this.loadRecentBatches();
    } else {
      // 普通模式
      if (this.data.isLoading) return;
      this.setData({ isLoading: true });
      if (options.fromCamera) wx.showLoading({ title: t.recognizing });
      wx.showLoading({ title: t.matchingRules });
      const record = {
        mode: 'normal',
        content: content,
        title: content.length > 20 ? content.substring(0, 20) + '...' : content
      };

      wx.showLoading({ title: t.querying });
      let customResult;
      try {
        customResult = await app.queryCustomScan(content);
      } catch (error) {
        customResult = this.buildLocalScanFallback(content, error);
      } finally {
        wx.hideLoading();
        this.setData({ isLoading: false });
      }
      record.type = this.getRecordType(content, customResult);
      if (customResult && customResult.parsedResult) {
        record.customResult = customResult.parsedResult;
        record.standardResult = customResult.standardResult;
        record.displayFields = customResult.displayFields || customResult.parsedFields || [];
        if (customResult.rawResponseText) {
          record.rawResponse = customResult.rawResponse;
          record.rawResponseText = customResult.rawResponseText;
        }
        record.apiConfigId = customResult.apiConfig && customResult.apiConfig.apiConfigId;
        record.matchedRuleId = customResult.matchedRule && customResult.matchedRule.ruleId;
        record.noRuleMatched = customResult.noRuleMatched;
        record.fallbackToRaw = customResult.fallbackToRaw;
        record.queryFailed = customResult.queryFailed;
        record.errorMessage = customResult.errorMessage;
      }
      const saveResult = app.addScanRecord(record);
      this.showScanSaveToast(saveResult, customResult);
      this.syncCurrentBatchState();
      this.loadRecentBatches();
    }
  },

  buildLocalScanFallback(content, error = {}) {
    const t = this.data.t;
    const message = String(error.errMsg || error.message || '').toLowerCase();
    const errorMessage = message.includes('timeout') || message.includes('超时')
      ? t.networkTimeout
      : t.apiException;
    return {
      parsedResult: { content },
      standardResult: { content },
      displayFields: [{ label: 'content', value: content }],
      parsedFields: [{ label: 'content', value: content }],
      fallbackToRaw: true,
      queryFailed: true,
      errorMessage
    };
  },

  showScanSaveToast(saveResult = {}, scanResult = {}) {
    if (!saveResult.added) return;
    const t = this.data.t;
    let title = t.scanSuccess || t.addSuccess;
    let icon = 'success';
    if (scanResult.queryFailed) {
      title = t.queryFailedRawSaved || scanResult.errorMessage || t.queryFailed;
      icon = 'none';
    } else if (scanResult.fallbackToRaw || scanResult.noRuleMatched) {
      // 未匹配到接口规则时仍然代表本次扫码和本地保存成功，只给用户简单成功反馈。
      title = t.scanSuccess || t.addSuccess;
      icon = 'success';
    } else if (saveResult.autoCreatedByGap) {
      title = t.batchGapAutoCreated;
      icon = 'none';
    }
    if (saveResult.autoCreatedByGap && title !== t.batchGapAutoCreated) {
      title = `${t.batchGapAutoCreated} / ${title}`;
    }
    wx.showToast({ title, icon, duration: 2500 });
  },

  buildBookInfo(content, scanResult = {}) {
    const parsed = scanResult.parsedResult || {};
    const standard = scanResult.standardResult || {};
    return {
      title: standard.title || parsed.title || parsed['书名'] || parsed.Title || content,
      author: standard.author || parsed.author || parsed['作者'] || parsed.Author || '',
      isbn: standard.isbn || parsed.isbn || parsed.ISBN || '',
      publisher: standard.publisher || parsed.publisher || parsed['出版社'] || '',
      place: standard.place || parsed.place || parsed['出版地'] || '',
      year: standard.year || parsed.year || parsed['出版年'] || '',
      callNumber: standard.callNumber || parsed.callNumber || parsed['索书号'] || '',
      status: standard.status || parsed.status || parsed['馆藏状态'] || '',
      barcode: standard.barcode || parsed.barcode || parsed['条码号'] || content,
      customResult: parsed,
      standardResult: standard,
      displayFields: scanResult.displayFields || [],
      rawResponse: scanResult.rawResponse,
      rawResponseText: scanResult.rawResponseText,
      matchedRuleId: scanResult.matchedRule && scanResult.matchedRule.ruleId,
      apiConfigId: scanResult.apiConfig && scanResult.apiConfig.apiConfigId,
      queryFailed: scanResult.queryFailed,
      errorMessage: scanResult.errorMessage,
      fallbackToRaw: scanResult.fallbackToRaw,
      noRuleMatched: scanResult.noRuleMatched
    };
  },

  getRecordType(content, scanResult = {}) {
    const matchedRule = scanResult.matchedRule || {};
    return matchedRule.codeType || matchedRule.type || this.detectCodeType(content);
  },

  // 检测码类型
  detectCodeType(content) {
    if (content.startsWith('http://') || content.startsWith('https://')) {
      return 'url';
    }
    if (/^\d{13}$/.test(content)) {
      return 'isbn';
    }
    if (/^\d+$/.test(content)) {
      return 'barcode';
    }
    return 'text';
  },

  // 输入变化
  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 手动输入确认
  onManualInput() {
    if (this.data.isLoading) return;

    const { inputValue, currentMode, t } = this.data;
    const inputRules = this.loadInputRules();
    let normalizedValue = inputValue === undefined || inputValue === null ? '' : String(inputValue);

    if (inputRules.trimSpace !== false) {
      normalizedValue = normalizedValue.trim();
    }
    if (inputRules.uppercase) {
      normalizedValue = normalizedValue.toUpperCase();
    }

    if (normalizedValue.length > inputRules.maxLength) {
      wx.showToast({
        title: t.inputMaxLength.replace('{count}', inputRules.maxLength),
        icon: 'none'
      });
      return;
    }

    if (currentMode === 'book' && inputRules.isbnRequired && !/^(\d{10}|\d{13}|A\d{9})$/.test(normalizedValue)) {
      wx.showToast({
        title: t.invalidIsbnOrBookBarcode,
        icon: 'none'
      });
      return;
    }

    if (!normalizedValue) {
      wx.showToast({
        title: currentMode === 'book' ? t.pleaseInputBookBarcode : t.pleaseInputContent,
        icon: 'none'
      });
      return;
    }

    this.handleScanResult(normalizedValue);
    this.setData({ inputValue: '' });
  },

  onInputConfirm() {
    if (!this.data.inputRules.allowNewline && this.data.inputRules.enterSubmit) {
      this.onManualInput();
    }
  },

  // 完成本次扫描
  finishScan() {
    const t = this.data.t;
    const saved = app.finishCurrentBatch();
    wx.showToast({
      title: saved ? t.scanRecordSaved : t.noRecords,
      icon: saved ? 'success' : 'none'
    });
    this.syncCurrentBatchState();
    this.loadRecentBatches();
  },

  // 查看全部历史
  viewAllHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    });
  },

  expandRecentBatches() {
    this.setData({
      recentBatchDisplayCount: this.data.recentBatchDisplayCount + this.data.recentBatchStep
    });
    this.loadRecentBatches();
  },

  // 查看批次详情
  viewBatchDetail(e) {
    const batchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/history-detail/history-detail?batchId=${batchId}`
    });
  }
});
