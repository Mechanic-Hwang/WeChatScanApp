// pages/history-detail/history-detail.js
const app = getApp();
const i18n = require('../../utils/i18n.js');
const copyRulesUtil = require('../../utils/copy-rules.js');
const MIN_DETAIL_LOADING_MS = 300;

Page({
  data: {
    isLoading: true,
    batch: null,
    pagedItems: [],
    pageIndex: 1,
    pageSize: 50,
    pageSizes: [50, 100, 200, 500],
    totalPages: 1,
    t: i18n.locales[app.globalData.language || 'zh-CN']
  },

  onLoad(options) {
    const batchId = options.batchId;
    this.setData({ isLoading: true });
    wx.showLoading({ title: this.text('loading') });
    // 先让详情页的 loading 态完成首屏渲染，再读取本地批次数据。
    setTimeout(() => {
      this.loadBatchDetail(batchId);
    }, 80);
  },

  onShow() {
    // 刷新语言
    this.setData({
      t: i18n.locales[app.globalData.language || 'zh-CN']
    });
  },

  text(key, params = {}) {
    let value = (this.data.t && this.data.t[key]) || key;
    Object.keys(params).forEach(name => {
      value = value.replace(`{${name}}`, params[name]);
    });
    return value;
  },

  // 加载批次详情
  loadBatchDetail(batchId) {
    const loadingStartedAt = Date.now();
    this.setData({ isLoading: true });
    const batch = app.getBatchDetail(batchId);
    
    if (!batch) {
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({ title: this.text('batchNotFound'), icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 格式化数据
    this._items = (batch.items || []).map(item => this.formatDetailItem(item));
    const formattedBatch = {
      batchId: batch.batchId,
      batchType: batch.batchType,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      itemCount: batch.itemCount || this._items.length,
      previewItems: batch.previewItems || [],
      title: this.formatBatchTitle(batch),
      timeText: this.formatBatchTime(batch.createdAt),
      typeText: batch.batchType === 'book' ? this.text('bookScan') : this.text('normalScan')
    };

    this.setData({ batch: formattedBatch, pageIndex: 1 });
    this.applyPagination();
    this.finishLoadingAfterMinimumDelay(loadingStartedAt);
  },

  finishLoadingAfterMinimumDelay(startedAt) {
    const elapsed = Date.now() - startedAt;
    const delay = Math.max(0, MIN_DETAIL_LOADING_MS - elapsed);
    setTimeout(() => {
      this.setData({ isLoading: false });
      wx.hideLoading();
    }, delay);
  },

  formatDetailItem(item) {
    const bookInfo = item.bookInfo || {};
    const displayFields = item.displayFields || bookInfo.displayFields || this.objectToFields(item.customResult || bookInfo.customResult);
    const apiConfigId = item.apiConfigId || bookInfo.apiConfigId;
    const matchedRuleId = item.matchedRuleId || bookInfo.matchedRuleId;
    const queryFailed = item.queryFailed || bookInfo.queryFailed;
    const rawResponseText = item.rawResponseText || this.stringifyRawResponse(item.rawResponse || bookInfo.rawResponse);
    // 没有配置 URL 时，扫描记录只会保存原始内容，不应展示 API Result 区块。
    const showApiResult = !!(apiConfigId || matchedRuleId || queryFailed || rawResponseText);
    return {
      ...item,
      apiDisplayFields: showApiResult ? displayFields : [],
      apiConfigId,
      matchedRuleId,
      queryFailed,
      errorMessage: item.errorMessage || bookInfo.errorMessage,
      fallbackToRaw: item.fallbackToRaw || bookInfo.fallbackToRaw,
      rawResponseText,
      showApiResult,
      timeText: this.formatItemTime(item.createdAt)
    };
  },

  objectToFields(data = {}) {
    return Object.keys(data || {})
      .map(key => ({ label: key, value: data[key] }))
      .filter(field => field.value !== null && field.value !== undefined && field.value !== '');
  },

  stringifyRawResponse(response) {
    if (!response) return '';
    if (typeof response === 'string') return response;
    try {
      return JSON.stringify(response, null, 2);
    } catch (e) {
      return String(response);
    }
  },

  applyPagination() {
    const batch = this.data.batch;
    if (!batch) return;

    const items = this._items || [];
    const totalPages = Math.max(1, Math.ceil(items.length / this.data.pageSize));
    const pageIndex = Math.min(this.data.pageIndex, totalPages);
    const start = (pageIndex - 1) * this.data.pageSize;

    this.setData({
      pageIndex,
      totalPages,
      pagedItems: items.slice(start, start + this.data.pageSize)
    });
  },

  setPageSize(e) {
    this.setData({
      pageSize: Number(e.currentTarget.dataset.size),
      pageIndex: 1
    });
    this.applyPagination();
  },

  prevPage() {
    if (this.data.pageIndex <= 1) return;
    this.setData({ pageIndex: this.data.pageIndex - 1 });
    this.applyPagination();
  },

  nextPage() {
    if (this.data.pageIndex >= this.data.totalPages) return;
    this.setData({ pageIndex: this.data.pageIndex + 1 });
    this.applyPagination();
  },

  // 格式化批次标题
  formatBatchTitle(batch) {
    const date = new Date(batch.createdAt);
    if (Number.isNaN(date.getTime())) return this.text('scanRecordTitle', { time: '' });
    const timeStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return this.text('scanRecordTitle', { time: timeStr });
  },

  // 格式化批次时间
  formatBatchTime(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 格式化项目时间
  formatItemTime(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  },

  formatItemForCopy(item) {
    return copyRulesUtil.formatRecord(item);
  },

  copyRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    const item = (this._items || []).find(record => record.id === recordId);
    if (!item) return;

    const content = this.formatItemForCopy(item);
    if (copyRulesUtil.isClipboardContentTooLarge(content)) {
      wx.showToast({ title: this.text('clipboardContentTooLarge'), icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: this.text('copySuccess'), icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: this.text('copyFail'), icon: 'none' });
      }
    });
  },

  deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    const t = this.data.t;

    wx.showModal({
      title: this.text('confirmDelete'),
      content: this.text('deleteRecordConfirm'),
      success: (res) => {
        if (!res.confirm) return;

        const deleted = app.deleteRecordFromBatch(this.data.batch.batchId, recordId);
        if (!deleted) {
          wx.showToast({ title: this.text('recordNotFound'), icon: 'none' });
          return;
        }

        wx.showToast({ title: this.text('deleteSuccess'), icon: 'success' });

        const latestBatch = app.getBatchDetail(this.data.batch.batchId);
        if (!latestBatch) {
          setTimeout(() => wx.navigateBack(), 800);
          return;
        }

        this.loadBatchDetail(this.data.batch.batchId);
      }
    });
  },

  // 复制整个批次
  copyBatch() {
    const { batch } = this.data;
    const t = this.data.t;
    const sourceBatch = app.getBatchDetail(batch.batchId);
    const content = copyRulesUtil.formatBatch({
      ...(sourceBatch || batch),
      title: batch.title
    });
    if (copyRulesUtil.isClipboardContentTooLarge(content)) {
      wx.showToast({ title: this.text('clipboardContentTooLarge'), icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: t.copySuccess, icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: this.text('copyFail'), icon: 'none' });
      }
    });
  },

  // 删除批次
  deleteBatch() {
    const t = this.data.t;
    wx.showModal({
      title: this.text('confirmDelete'),
      content: t.deleteBatchConfirm,
      success: (res) => {
        if (res.confirm) {
          app.deleteBatches([this.data.batch.batchId]);
          wx.showToast({ title: t.deleteSuccess, icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  },

  // 再次扫描（返回首页并创建同类型新批次）
  scanAgain() {
    const { batch } = this.data;
    
    // 创建同类型新批次
    app.createNewBatch(batch.batchType);
    
    // 返回首页
    wx.switchTab({
      url: '/pages/index/index',
      success: () => {
        wx.showToast({
          title: this.text('newBatchCreated', {
            mode: batch.batchType === 'book' ? this.text('book') : this.text('normal')
          }),
          icon: 'none'
        });
      }
    });
  },

  // 返回历史列表原位
  navigateBack() {
    wx.navigateBack({
      success: () => {
        // 页面返回后会触发onShow，自动刷新列表
      }
    });
  }
});
