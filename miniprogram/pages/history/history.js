// pages/history/history.js
const app = getApp();

Page({
  data: {
    batches: [],
    allBatches: [],
    selectedCount: 0,
    isAllSelected: false,
    searchKeyword: ''
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
        title: this.formatBatchTitle(batch),
        selected: false
      };
    });

    this.setData({ 
      batches: batches,
      allBatches: batches,
      isAllSelected: false
    });
    this.updateSelectedCount();
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase();
    this.setData({ searchKeyword: keyword });
    this.filterBatches(keyword);
  },

  // 筛选批次
  filterBatches(keyword) {
    if (!keyword) {
      this.setData({ batches: this.data.allBatches });
      return;
    }

    const filtered = this.data.allBatches.filter(batch => {
      if (batch.title && batch.title.toLowerCase().includes(keyword)) return true;
      if (batch.previewItems && batch.previewItems.some(item => 
        item.toLowerCase().includes(keyword))) return true;
      if (batch.items && batch.items.some(item => 
        item.content.toLowerCase().includes(keyword) ||
        (item.bookInfo && item.bookInfo.title && item.bookInfo.title.toLowerCase().includes(keyword))
      )) return true;
      return false;
    });

    this.setData({ batches: filtered });
  },

  // 全选/取消全选
  selectAll() {
    const isAllSelected = !this.data.isAllSelected;
    const batches = this.data.batches.map(batch => ({
      ...batch,
      selected: isAllSelected
    }));
    
    this.setData({ batches, isAllSelected });
    this.updateSelectedCount();
  },

  // 清空全部历史
  clearAllHistory() {
    wx.showModal({
      title: '确认清空',
      content: `确定清空所有历史记录吗？此操作不可恢复，共 ${this.data.allBatches.length} 个批次。`,
      success: (res) => {
        if (res.confirm) {
          app.globalData.scanBatches = [];
          wx.setStorageSync('scanBatches', []);
          this.setData({ batches: [], allBatches: [], selectedCount: 0 });
          wx.showToast({ title: '已清空全部历史', icon: 'success' });
        }
      }
    });
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

    const copyFormat = wx.getStorageSync('copyFormat') || 'detail';
    const t = this.data.t;
    let content = '';

    if (copyFormat === 'simple') {
      // 简单格式：只复制条码内容
      selectedBatches.forEach((batch, index) => {
        if (index > 0) content += '\n\n';
        batch.items.forEach(item => {
          content += `${item.content}\n`;
        });
      });
    } else if (copyFormat === 'json') {
      // JSON格式
      const allItems = selectedBatches.flatMap(batch => batch.items);
      content = JSON.stringify(allItems, null, 2);
    } else {
      // 详细格式（默认）
      selectedBatches.forEach((batch, index) => {
        if (index > 0) content += '\n\n';
        content += `【${batch.title}】\n`;
        batch.items.forEach(item => {
          if (item.mode === 'book' && item.bookInfo) {
            content += `- ${item.bookInfo.title} / ${item.bookInfo.author || t.unknown || '未知'} (${item.content})\n`;
          } else {
            content += `- ${item.content}\n`;
          }
        });
      });
    }

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: t.copySuccess, icon: 'success' });
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
