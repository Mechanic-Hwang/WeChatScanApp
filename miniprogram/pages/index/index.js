// pages/index/index.js - 支持扫描批次
const app = getApp();

Page({
  data: {
    currentMode: 'normal',
    inputValue: '',
    recentBatches: []
  },

  onLoad() {
    this.setData({
      currentMode: app.globalData.currentMode
    });
  },

  onShow() {
    this.loadRecentBatches();
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
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 格式化批次标题
  formatBatchTitle(batch) {
    const date = new Date(batch.createdAt);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} 扫描`;
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ 
      currentMode: mode,
      inputValue: ''  // 清空输入框
    });
    app.saveCurrentMode(mode);
    
    wx.showToast({
      title: mode === 'book' ? '已切换到图书模式' : '已切换到普通模式',
      icon: 'none'
    });
  },

  // 开始扫码
  startScan() {
    // 获取或创建批次
    const batch = app.getOrCreateBatch(this.data.currentMode);
    
    wx.scanCode({
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        this.handleScanResult(res.result);
      },
      fail: (err) => {
        if (err.errMsg !== 'scanCode:fail cancel') {
          wx.showToast({ title: '扫码失败', icon: 'none' });
        }
      }
    });
  },

  // 处理扫码结果
  async handleScanResult(content) {
    const { currentMode } = this.data;
    
    // 确保有活跃批次
    const batch = app.getOrCreateBatch(currentMode);
    
    if (currentMode === 'book') {
      wx.showLoading({ title: '查询中...' });
      
      try {
        const bookInfo = await app.queryBookInfo(content);
        wx.hideLoading();
        
        // 添加到当前批次
        app.addScanRecordToBatch({
          mode: 'book',
          content: content,
          title: bookInfo.title || content,
          bookInfo: bookInfo
        });
        
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.loadRecentBatches();
      } catch (error) {
        wx.hideLoading();
        wx.showModal({
          title: '查询失败',
          content: error.message || '无法获取图书信息',
          showCancel: false
        });
      }
    } else {
      // 普通模式
      app.addScanRecordToBatch({
        mode: 'normal',
        content: content,
        title: content.length > 20 ? content.substring(0, 20) + '...' : content,
        type: this.detectCodeType(content)
      });
      
      wx.showToast({ title: '添加成功', icon: 'success' });
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
    const { inputValue, currentMode } = this.data;
    
    if (!inputValue.trim()) {
      wx.showToast({
        title: currentMode === 'book' ? '请输入图书条码' : '请输入内容',
        icon: 'none'
      });
      return;
    }
    
    this.handleScanResult(inputValue.trim());
    this.setData({ inputValue: '' });
  },

  // 完成本次扫描
  finishScan() {
    app.finishCurrentBatch();
    wx.showToast({ title: '已保存扫描记录', icon: 'success' });
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
