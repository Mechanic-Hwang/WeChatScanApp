// app.js - 小程序入口（支持扫描批次）
App({
  globalData: {
    // 扫描批次列表
    scanBatches: [],
    // 当前活跃批次
    currentBatch: null,
    // 当前模式：'normal' 或 'book'
    currentMode: 'normal',
    // API配置
    apiConfig: {
      url: '',
      key: ''
    },
    // 语言设置
    language: 'zh-CN'
  },

  onLaunch() {
    this.loadConfig();
    console.log('扫码助手小程序启动');
  },

  // 加载配置
  loadConfig() {
    try {
      const scanBatches = wx.getStorageSync('scanBatches');
      if (scanBatches) {
        this.globalData.scanBatches = scanBatches;
      }
      
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
    } catch (e) {
      console.error('加载配置失败:', e);
    }
  },

  // 创建新批次
  createNewBatch(mode) {
    const batch = {
      batchId: Date.now().toString(),
      batchType: mode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      itemCount: 0,
      previewItems: [],
      items: [],
      selected: false
    };
    
    this.globalData.currentBatch = batch;
    return batch;
  },

  // 获取或创建当前批次
  getOrCreateBatch(mode) {
    // 如果有当前批次且是同一种模式，继续使用
    if (this.globalData.currentBatch && 
        this.globalData.currentBatch.batchType === mode) {
      return this.globalData.currentBatch;
    }
    
    // 否则创建新批次
    return this.createNewBatch(mode);
  },

  // 添加扫描记录到当前批次
  addScanRecordToBatch(record) {
    const batch = this.globalData.currentBatch;
    if (!batch) {
      console.error('没有活跃批次');
      return false;
    }

    // 检查是否已存在
    const exists = batch.items.findIndex(
      item => item.content === record.content
    );
    
    if (exists !== -1) {
      wx.showToast({ title: '记录已存在', icon: 'none' });
      return false;
    }

    // 添加记录
    record.id = Date.now().toString();
    record.createdAt = new Date().toISOString();
    batch.items.unshift(record);
    batch.itemCount = batch.items.length;
    batch.updatedAt = new Date().toISOString();
    
    // 更新预览项（前3条）
    batch.previewItems = batch.items.slice(0, 3).map(item => {
      if (item.mode === 'book' && item.bookInfo) {
        return `${item.bookInfo.title} / ${item.bookInfo.author || '未知作者'}`;
      }
      return item.content.length > 30 
        ? item.content.substring(0, 30) + '...' 
        : item.content;
    });

    // 保存批次
    this.saveBatch(batch);
    return true;
  },

  // 保存批次
  saveBatch(batch) {
    // 检查是否已存在
    const existingIndex = this.globalData.scanBatches.findIndex(
      b => b.batchId === batch.batchId
    );
    
    if (existingIndex !== -1) {
      // 更新现有批次
      this.globalData.scanBatches[existingIndex] = batch;
    } else {
      // 添加新批次到顶部
      this.globalData.scanBatches.unshift(batch);
    }
    
    // 保存到本地存储
    wx.setStorageSync('scanBatches', this.globalData.scanBatches);
  },

  // 完成当前批次
  finishCurrentBatch() {
    if (this.globalData.currentBatch) {
      this.saveBatch(this.globalData.currentBatch);
      this.globalData.currentBatch = null;
    }
  },

  // 删除批次
  deleteBatches(batchIds) {
    this.globalData.scanBatches = this.globalData.scanBatches.filter(
      batch => !batchIds.includes(batch.batchId)
    );
    wx.setStorageSync('scanBatches', this.globalData.scanBatches);
  },

  // 获取批次详情
  getBatchDetail(batchId) {
    return this.globalData.scanBatches.find(b => b.batchId === batchId);
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

  // 解析图书数据
  parseBookData(data) {
    if (typeof data === 'string' && data.includes('<?xml')) {
      return this.parseAlmaXml(data);
    }
    return data;
  },

  // 解析Alma XML
  parseAlmaXml(xmlString) {
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
