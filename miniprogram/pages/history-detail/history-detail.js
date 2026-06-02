// pages/history-detail/history-detail.js
const app = getApp();
const i18n = require('../../utils/i18n.js');
const copyRulesUtil = require('../../utils/copy-rules.js');

Page({
  data: {
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
    this.loadBatchDetail(batchId);
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
    const batch = app.getBatchDetail(batchId);
    
    if (!batch) {
      wx.showToast({ title: this.text('batchNotFound'), icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 格式化数据
    const formattedBatch = {
      ...batch,
      title: this.formatBatchTitle(batch),
      timeText: this.formatBatchTime(batch.createdAt),
      typeIcon: batch.batchType === 'book' ? '📚' : '📷',
      typeText: batch.batchType === 'book' ? this.text('bookScan') : this.text('normalScan'),
      items: batch.items.map(item => ({
        ...item,
        timeText: this.formatItemTime(item.createdAt)
      }))
    };

    this.setData({ batch: formattedBatch, pageIndex: 1 });
    this.applyPagination();
  },

  applyPagination() {
    const batch = this.data.batch;
    if (!batch) return;

    const totalPages = Math.max(1, Math.ceil(batch.items.length / this.data.pageSize));
    const pageIndex = Math.min(this.data.pageIndex, totalPages);
    const start = (pageIndex - 1) * this.data.pageSize;

    this.setData({
      pageIndex,
      totalPages,
      pagedItems: batch.items.slice(start, start + this.data.pageSize)
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
    const timeStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return this.text('scanRecordTitle', { time: timeStr });
  },

  // 格式化批次时间
  formatBatchTime(isoString) {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 格式化项目时间
  formatItemTime(isoString) {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  },

  formatItemForCopy(item) {
    return copyRulesUtil.formatRecord(item);
  },

  copyRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    const item = this.data.batch.items.find(record => record.id === recordId);
    if (!item) return;

    wx.setClipboardData({
      data: this.formatItemForCopy(item),
      success: () => {
        wx.showToast({ title: this.text('copySuccess'), icon: 'success' });
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
    const content = copyRulesUtil.formatBatch(batch);

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: t.copySuccess, icon: 'success' });
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
