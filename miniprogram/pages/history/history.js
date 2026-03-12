// pages/history/history.js
const app = getApp();

Page({
  data: {
    batches: [],
    selectedCount: 0
  },

  onLoad() {
    this.loadBatches();
  },

  onShow() {
    this.loadBatches();
  },

  // 加载批次列表
  loadBatches() {
    const batches = app.globalData.scanBatches.map(batch => {
      return {
        ...batch,
        timeText: this.formatBatchTime(batch.createdAt),
        title: this.formatBatchTitle(batch)
      };
    });

    this.setData({ batches });
    this.updateSelectedCount();
  },

  // 格式化批次时间
  formatBatchTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 判断是否是今天
    if (date >= today) {
      return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    
    // 判断是否是昨天
    if (date >= yesterday) {
      return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    
    // 否则显示日期
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 格式化批次标题
  formatBatchTitle(batch) {
    const date = new Date(batch.createdAt);
    const timeStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return `${timeStr} 扫描记录`;
  },

  // 点击批次
  onBatchTap(e) {
    const batchId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/history-detail/history-detail?batchId=${batchId}`
    });
  },

  // 点击复选框
  onCheckboxTap(e) {
    e.stopPropagation();
    const batchId = e.currentTarget.dataset.id;
    const batches = this.data.batches.map(batch => {
      if (batch.batchId === batchId) {
        return { ...batch, selected: !batch.selected };
      }
      return batch;
    });

    this.setData({ batches });
    this.updateSelectedCount();
  },

  // 更新选中数量
  updateSelectedCount() {
    const selectedCount = this.data.batches.filter(b => b.selected).length;
    this.setData({ selectedCount });
  },

  // 删除选中的批次
  deleteSelected() {
    const selectedIds = this.data.batches
      .filter(b => b.selected)
      .map(b => b.batchId);

    if (selectedIds.length === 0) return;

    wx.showModal({
      title: '确认删除',
      content: `确定删除选中的 ${selectedIds.length} 个批次吗？`,
      success: (res) => {
        if (res.confirm) {
          app.deleteBatches(selectedIds);
          this.loadBatches();
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  // 复制选中的批次
  copySelected() {
    const selectedBatches = this.data.batches.filter(b => b.selected);

    if (selectedBatches.length === 0) return;

    let content = '';
    selectedBatches.forEach((batch, index) => {
      if (index > 0) content += '\n\n';
      content += `【${batch.title}】\n`;
      batch.items.forEach(item => {
        if (item.mode === 'book' && item.bookInfo) {
          content += `- ${item.bookInfo.title} / ${item.bookInfo.author || '未知'} (${item.content})\n`;
        } else {
          content += `- ${item.content}\n`;
        }
      });
    });

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  // 去扫描
  goToScan() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
