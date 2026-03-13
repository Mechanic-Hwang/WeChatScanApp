// pages/history-detail/history-detail.js
const app = getApp();
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    batch: null,
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

  // 加载批次详情
  loadBatchDetail(batchId) {
    const batch = app.getBatchDetail(batchId);
    
    if (!batch) {
      const t = this.data.t;
      wx.showToast({ title: t.batchNotFound || '批次不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 格式化数据
    const formattedBatch = {
      ...batch,
      title: this.formatBatchTitle(batch),
      timeText: this.formatBatchTime(batch.createdAt),
      items: batch.items.map(item => ({
        ...item,
        timeText: this.formatItemTime(item.createdAt)
      }))
    };

    this.setData({ batch: formattedBatch });
  },

  // 格式化批次标题
  formatBatchTitle(batch) {
    const date = new Date(batch.createdAt);
    const timeStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return `${timeStr} 扫描记录`;
  },

  // 格式化批次时间
  formatBatchTime(isoString) {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 格式化项目时间
  formatItemTime(isoString) {
    const date = new Date(isoString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  },

  // 复制整个批次
  copyBatch() {
    const { batch } = this.data;
    const copyFormat = wx.getStorageSync('copyFormat') || 'detail';
    const t = this.data.t;

    let content = '';

    if (copyFormat === 'simple') {
      // 简单格式：只复制条码内容
      content = batch.items.map(item => item.content).join('\n');
    } else if (copyFormat === 'json') {
      // JSON格式
      content = JSON.stringify(batch.items, null, 2);
    } else {
      // 详细格式（默认）
      content = `【${batch.title}】\n`;
      content += `${t.scanTime || '扫描时间'}：${batch.timeText}\n`;
      content += `${t.totalItems || '共'} ${batch.itemCount} ${t.items || '条记录'}\n\n`;

      batch.items.forEach((item, index) => {
        content += `${index + 1}. `;
        if (item.mode === 'book' && item.bookInfo) {
          content += `${item.bookInfo.title} / ${item.bookInfo.author || t.unknown || '未知'} (${item.content})\n`;
        } else {
          content += `${item.content}\n`;
        }
      });
    }

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
      title: t.confirmDelete || '确认删除',
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
          title: `已创建新${batch.batchType === 'book' ? '图书' : '普通'}扫描批次`,
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
