// pages/index/index.js
const app = getApp();

Page({
  data: {
    currentMode: 'normal',
    inputValue: '',
    recentRecords: []
  },

  onLoad() {
    // 加载当前模式
    this.setData({
      currentMode: app.globalData.currentMode
    });
  },

  onShow() {
    // 刷新最近记录
    this.loadRecentRecords();
  },

  // 加载最近记录
  loadRecentRecords() {
    const history = app.globalData.scanHistory;
    // 只显示最近5条
    const recent = history.slice(0, 5).map(item => {
      return {
        ...item,
        time: this.formatTime(item.time)
      };
    });
    
    this.setData({
      recentRecords: recent
    });
  },

  // 格式化时间
  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    // 小于1小时显示"X分钟前"
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
    }
    // 小于24小时显示"X小时前"
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    // 否则显示日期
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ currentMode: mode });
    app.saveCurrentMode(mode);
    
    wx.showToast({
      title: mode === 'book' ? '已切换到图书模式' : '已切换到普通模式',
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
          wx.showToast({
            title: '扫码失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 处理扫码结果
  async handleScanResult(content) {
    const { currentMode } = this.data;
    
    if (currentMode === 'book') {
      // 图书模式，查询图书信息
      wx.showLoading({ title: '查询中...' });
      
      try {
        const bookInfo = await app.queryBookInfo(content);
        wx.hideLoading();
        
        // 添加到历史记录
        app.addScanRecord({
          mode: 'book',
          content: content,
          title: bookInfo.title || content,
          bookInfo: bookInfo
        });
        
        // 跳转到结果页
        wx.navigateTo({
          url: '/pages/result/result?mode=book'
        });
      } catch (error) {
        wx.hideLoading();
        wx.showModal({
          title: '查询失败',
          content: error.message || '无法获取图书信息，请检查API配置',
          showCancel: false
        });
      }
    } else {
      // 普通模式
      app.addScanRecord({
        mode: 'normal',
        content: content,
        title: content.length > 20 ? content.substring(0, 20) + '...' : content,
        type: this.detectCodeType(content)
      });
      
      wx.navigateTo({
        url: '/pages/result/result?mode=normal'
      });
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
    this.setData({
      inputValue: e.detail.value
    });
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

  // 查看全部记录
  viewAllRecords() {
    wx.navigateTo({
      url: '/pages/result/result'
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
