// pages/result/result.js
const app = getApp();

Page({
  data: {
    records: [],
    isBatchMode: false,
    selectedCount: 0,
    isAllSelected: false,
    filterMode: null
  },

  onLoad(options) {
    // 如果有mode参数，按模式筛选
    if (options.mode) {
      this.setData({ filterMode: options.mode });
    }
  },

  onShow() {
    this.loadRecords();
  },

  // 加载记录
  loadRecords() {
    let records = app.globalData.scanHistory;
    
    // 按模式筛选
    if (this.data.filterMode) {
      records = records.filter(item => item.mode === this.data.filterMode);
    }
    
    // 格式化时间
    records = records.map(item => ({
      ...item,
      time: this.formatTime(item.time),
      selected: false
    }));
    
    this.setData({ records });
    this.updateSelectStatus();
  },

  // 格式化时间
  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
    }
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 进入批量模式
  enterBatchMode() {
    this.setData({ isBatchMode: true });
  },

  // 退出批量模式
  exitBatchMode() {
    this.setData({ 
      isBatchMode: false,
      records: this.data.records.map(item => ({ ...item, selected: false }))
    });
    this.updateSelectStatus();
  },

  // 切换选择
  toggleSelect(e) {
    const index = e.currentTarget.dataset.index;
    const records = this.data.records;
    records[index].selected = !records[index].selected;
    
    this.setData({ records });
    this.updateSelectStatus();
  },

  // 全选/取消全选
  selectAll() {
    const isAllSelected = !this.data.isAllSelected;
    const records = this.data.records.map(item => ({
      ...item,
      selected: isAllSelected
    }));
    
    this.setData({ 
      records,
      isAllSelected 
    });
    this.updateSelectStatus();
  },

  // 更新选择状态
  updateSelectStatus() {
    const selectedCount = this.data.records.filter(item => item.selected).length;
    const isAllSelected = selectedCount === this.data.records.length && this.data.records.length > 0;
    
    this.setData({
      selectedCount,
      isAllSelected
    });
  },

  // 删除选中的记录
  deleteSelected() {
    const selectedIds = this.data.records
      .filter(item => item.selected)
      .map(item => item.id);
    
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请先选择记录', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定删除选中的 ${selectedIds.length} 条记录吗？`,
      success: (res) => {
        if (res.confirm) {
          app.deleteScanRecords(selectedIds);
          this.loadRecords();
          this.exitBatchMode();
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  // 复制选中的记录
  copySelected() {
    const selectedItems = this.data.records.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      wx.showToast({ title: '请先选择记录', icon: 'none' });
      return;
    }

    const content = selectedItems.map(item => {
      if (item.mode === 'book' && item.bookInfo) {
        return `${item.bookInfo.title} - ${item.bookInfo.author} - ${item.content}`;
      }
      return item.content;
    }).join('\n');

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '复制成功', icon: 'success' });
      }
    });
  },

  // 清空全部
  clearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定清空所有记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          app.globalData.scanHistory = [];
          wx.setStorageSync('scanHistory', []);
          this.loadRecords();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
