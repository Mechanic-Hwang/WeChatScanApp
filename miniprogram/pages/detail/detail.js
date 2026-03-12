// pages/detail/detail.js
const app = getApp();

Page({
  data: {
    record: null,
    bookInfo: null,
    typeText: ''
  },

  onLoad(options) {
    const id = options.id;
    this.loadRecord(id);
  },

  // 加载记录
  loadRecord(id) {
    const record = app.globalData.scanHistory.find(item => item.id === id);
    
    if (!record) {
      wx.showToast({ title: '记录不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 格式化类型文本
    const typeMap = {
      'url': '网址链接',
      'isbn': 'ISBN条码',
      'barcode': '商品条码',
      'text': '文本内容'
    };

    this.setData({
      record: {
        ...record,
        time: this.formatTime(record.time)
      },
      bookInfo: record.bookInfo || {},
      typeText: typeMap[record.type] || '文本内容'
    });
  },

  // 格式化时间
  formatTime(isoString) {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 复制内容
  copyContent() {
    const { record, bookInfo } = this.data;
    let content = '';

    if (record.mode === 'book' && bookInfo) {
      content = `书名：${bookInfo.title || '未知'}\n` +
                `作者：${bookInfo.author || '未知'}\n` +
                `ISBN：${bookInfo.isbn || '未知'}\n` +
                `出版社：${bookInfo.publisher || '未知'}\n` +
                `条码：${record.content}`;
    } else {
      content = record.content;
    }

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '复制成功', icon: 'success' });
      }
    });
  },

  // 分享
  shareContent() {
    // 微信小程序分享功能
    // 实际分享需要在页面定义 onShareAppMessage
  },

  // 删除记录
  deleteRecord() {
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          app.deleteScanRecords([this.data.record.id]);
          wx.showToast({ title: '删除成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  },

  // 分享功能
  onShareAppMessage() {
    const { record, bookInfo } = this.data;
    let title = '';
    let path = '';

    if (record.mode === 'book' && bookInfo) {
      title = `图书：${bookInfo.title || '未知书名'}`;
    } else {
      title = `扫码结果：${record.content.substring(0, 20)}...`;
    }

    return {
      title: title,
      path: `/pages/detail/detail?id=${record.id}`
    };
  }
});
