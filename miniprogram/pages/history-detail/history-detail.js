// pages/history-detail/history-detail.js
const app = getApp();

Page({
  data: {
    batch: null
  },

  onLoad(options) {
    const batchId = options.batchId;
    this.loadBatchDetail(batchId);
  },

  // 加载批次详情
  loadBatchDetail(batchId) {
    const batch = app.getBatchDetail(batchId);
    
    if (!batch) {
      wx.showToast({ title: '批次不存在', icon: 'none' });
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
    
    let content = `【${batch.title}】\n`;
    content += `扫描时间：${batch.timeText}\n`;
    content += `共 ${batch.itemCount} 条记录\n\n`;
    
    batch.items.forEach((item, index) => {
      content += `${index + 1}. `;
      if (item.mode === 'book' && item.bookInfo) {
        content += `${item.bookInfo.title} / ${item.bookInfo.author || '未知'} (${item.content})\n`;
      } else {
        content += `${item.content}\n`;
      }
    });

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  // 删除批次
  deleteBatch() {
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个扫描批次吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          app.deleteBatches([this.data.batch.batchId]);
          wx.showToast({ title: '删除成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  }
});
