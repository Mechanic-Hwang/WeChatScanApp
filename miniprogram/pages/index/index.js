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
    return {
      ...this.data.inputRules,
      ...(wx.getStorageSync('inputRules') || {})
    };
  },

  // 加载最近批次
  loadRecentBatches() {
    const batches = app.globalData.scanBatches.slice(0, 3).map(batch => {
      return {
        ...batch,
        time: this.formatTime(batch.createdAt),
        title: this.formatBatchTitle(batch)
      };
    });
    
    this.setData({ recentBatches: batches });
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
        this.handleScanResult(res.result);
      },
      fail: (err) => {
        if (err.errMsg !== 'scanCode:fail cancel') {
          wx.showToast({ title: this.data.t.scanFailed, icon: 'none' });
        }
      }
    });
  },

  // 处理扫码结果
  async handleScanResult(content) {
    const { currentMode } = this.data;
    
    // 确保有活跃批次
    const batch = app.getOrCreateBatch(currentMode);
    
    const t = this.data.t;
    if (currentMode === 'book') {
      if (this.data.isLoading) return;
      this.setData({ isLoading: true });
      wx.showLoading({ title: t.querying });

      try {
        const bookInfo = await app.queryBookInfo(content);
        wx.hideLoading();
        this.setData({ isLoading: false });

        // 添加到当前批次
        const added = app.addScanRecordToBatch({
          mode: 'book',
          content: content,
          barcode: bookInfo.barcode || content,
          title: bookInfo.title || content,
          bookInfo: bookInfo
        });

        if (added) {
          wx.showToast({ title: t.addSuccess, icon: 'success' });
        }
        this.syncCurrentBatchState();
        this.loadRecentBatches();
      } catch (error) {
        wx.hideLoading();
        this.setData({ isLoading: false });
        wx.showModal({
          title: t.queryFailed,
          content: error.message || t.cannotGetBookInfo,
          showCancel: false
        });
      }
    } else {
      // 普通模式
      const record = {
        mode: 'normal',
        content: content,
        title: content.length > 20 ? content.substring(0, 20) + '...' : content,
        type: this.detectCodeType(content)
      };

      try {
        const customResult = await app.queryCustomScan(content);
        if (customResult && customResult.parsedResult) {
          record.customResult = customResult.parsedResult;
          record.standardResult = customResult.standardResult;
          record.displayFields = customResult.displayFields || customResult.parsedFields || [];
          record.rawResponse = customResult.rawResponse;
          record.rawResponseText = customResult.rawResponseText;
          record.apiConfigId = customResult.apiConfig && customResult.apiConfig.apiConfigId;
          record.matchedRuleId = customResult.matchedRule && customResult.matchedRule.ruleId;
          record.noRuleMatched = customResult.noRuleMatched;
          record.fallbackToRaw = customResult.fallbackToRaw;
        }
      } catch (error) {
        wx.showToast({
          title: error.message || t.queryFailed,
          icon: 'none',
          duration: 2000
        });
      }

      const added = app.addScanRecordToBatch(record);

      if (added) {
        wx.showToast({
          title: record.fallbackToRaw ? t.noRuleMatchedRaw : t.addSuccess,
          icon: record.fallbackToRaw ? 'none' : 'success'
        });
      }
      this.syncCurrentBatchState();
      this.loadRecentBatches();
    }
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
    let normalizedValue = inputValue;

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
    if (this.data.inputRules.enterSubmit) {
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

  // 查看批次详情
  viewBatchDetail(e) {
    const batchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/history-detail/history-detail?batchId=${batchId}`
    });
  }
});
