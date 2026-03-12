// app.js - 小程序入口
App({
  globalData: {
    // 扫描历史记录
    scanHistory: [],
    // 当前模式：'normal' 或 'book'
    currentMode: 'normal',
    // API配置（从本地存储读取）
    apiConfig: {
      url: '',
      key: ''
    },
    // 语言设置
    language: 'zh-CN'
  },

  onLaunch() {
    // 从本地存储加载配置
    this.loadConfig();
    console.log('扫码助手小程序启动');
  },

  // 加载配置
  loadConfig() {
    try {
      const apiConfig = wx.getStorageSync('apiConfig');
      if (apiConfig) {
        this.globalData.apiConfig = apiConfig;
      }
      
      const currentMode = wx.getStorageSync('currentMode');
      if (currentMode) {
        this.globalData.currentMode = currentMode;
      }
      
      const language = wx.getStorageSync('language');
      if (language) {
        this.globalData.language = language;
      }
      
      const scanHistory = wx.getStorageSync('scanHistory');
      if (scanHistory) {
        this.globalData.scanHistory = scanHistory;
      }
    } catch (e) {
      console.error('加载配置失败:', e);
    }
  },

  // 保存API配置
  saveApiConfig(url, key) {
    this.globalData.apiConfig = { url, key };
    wx.setStorageSync('apiConfig', { url, key });
  },

  // 保存当前模式
  saveCurrentMode(mode) {
    this.globalData.currentMode = mode;
    wx.setStorageSync('currentMode', mode);
  },

  // 保存语言设置
  saveLanguage(lang) {
    this.globalData.language = lang;
    wx.setStorageSync('language', lang);
  },

  // 添加扫描记录
  addScanRecord(record) {
    // 检查是否已存在相同内容
    const exists = this.globalData.scanHistory.findIndex(
      item => item.content === record.content && item.mode === record.mode
    );
    
    if (exists !== -1) {
      // 已存在，移动到顶部
      const existing = this.globalData.scanHistory.splice(exists, 1)[0];
      existing.time = new Date().toISOString();
      this.globalData.scanHistory.unshift(existing);
      wx.showToast({ title: '记录已存在', icon: 'none' });
    } else {
      // 新记录，添加到顶部
      record.id = Date.now().toString();
      record.time = new Date().toISOString();
      this.globalData.scanHistory.unshift(record);
    }
    
    // 保存到本地存储
    wx.setStorageSync('scanHistory', this.globalData.scanHistory);
    return exists === -1;
  },

  // 删除扫描记录
  deleteScanRecords(ids) {
    this.globalData.scanHistory = this.globalData.scanHistory.filter(
      item => !ids.includes(item.id)
    );
    wx.setStorageSync('scanHistory', this.globalData.scanHistory);
  },

  // 查询图书信息
  async queryBookInfo(barcode) {
    const { url, key } = this.globalData.apiConfig;
    
    if (!url) {
      throw new Error('请先配置API地址');
    }

    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: url,
          method: 'GET',
          data: { 
            barcode: barcode,
            apikey: key 
          },
          header: {
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200) {
        return this.parseBookData(response.data);
      } else {
        throw new Error('查询失败');
      }
    } catch (error) {
      console.error('图书查询错误:', error);
      throw error;
    }
  },

  // 解析图书数据（支持Alma XML格式）
  parseBookData(data) {
    // 如果是XML格式，需要解析
    if (typeof data === 'string' && data.includes('<?xml')) {
      return this.parseAlmaXml(data);
    }
    // 如果是JSON格式，直接返回
    return data;
  },

  // 解析Alma XML
  parseAlmaXml(xmlString) {
    // 简单的XML解析
    const getValue = (xml, tag) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
      return match ? match[1] : '';
    };

    return {
      title: getValue(xmlString, 'title'),
      author: getValue(xmlString, 'author'),
      isbn: getValue(xmlString, 'isbn'),
      publisher: getValue(xmlString, 'publisher_const'),
      place: getValue(xmlString, 'place_of_publication'),
      year: getValue(xmlString, 'date_of_publication'),
      callNumber: getValue(xmlString, 'permanent_call_number'),
      barcode: getValue(xmlString, 'barcode'),
      status: getValue(xmlString, 'base_status')
    };
  }
});
