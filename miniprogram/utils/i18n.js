// miniprogram/utils/i18n.js - 多语言支持
const app = getApp();

// 语言配置
const locales = {
  'zh-CN': {
    // 通用
    appName: '扫码助手',
    confirm: '确定',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    copy: '复制',
    back: '返回',
    
    // TabBar
    tabHome: '首页',
    tabHistory: '历史',
    tabSettings: '设置',
    
    // 首页
    currentMode: '当前模式',
    normalMode: '普通扫码',
    bookMode: '图书扫码',
    clickToScan: '点击扫码',
    supportQR: '支持二维码、条形码',
    supportBook: '支持二维码、条形码、图书条码',
    manualInput: '手动输入',
    inputPlaceholder: '请输入条码内容',
    inputBookPlaceholder: '请输入图书条码',
    confirmBtn: '确认',
    finishScan: '完成本次扫描',
    recentBatches: '最近扫描批次',
    viewAll: '查看全部',
    noRecords: '暂无扫描记录',
    startScanTip: '点击上方扫码按钮开始扫描',
    
    // 历史页
    historyTitle: '历史记录',
    historySubtitle: '按扫描批次查看',
    noHistory: '暂无历史记录',
    goToScan: '去扫描',
    selectedCount: '已选择 {count} 个批次',
    batchTime: '扫描时间',
    itemCount: '共 {count} 条',
    
    // 详情页
    detailTitle: '扫描详情',
    normalScan: '普通扫描',
    bookScan: '图书扫描',
    copyAll: '复制全部',
    deleteBatch: '删除批次',
    
    // 设置页
    apiConfig: '图书API配置',
    apiDesc: '配置图书查询接口，用于图书扫码模式',
    apiUrl: 'API地址',
    apiUrlPlaceholder: '请输入API地址',
    apiKey: 'API Key',
    apiKeyPlaceholder: '请输入API Key',
    saveConfig: '保存配置',
    testConnection: '测试连接',
    languageSetting: '语言设置',
    dataManagement: '数据管理',
    clearHistory: '清空扫描历史',
    clearDesc: '删除所有扫描记录，不可恢复',
    exportData: '导出数据',
    exportDesc: '将扫描记录导出为文本',
    about: '关于',
    version: '版本 1.0.0',
    appDesc: '一个简单实用的二维码/条形码/图书扫码工具',
    
    // 提示信息
    copySuccess: '已复制到剪贴板',
    copyFail: '复制失败，请重试',
    deleteSuccess: '删除成功',
    saveSuccess: '保存成功',
    inputApiUrl: '请输入API地址',
    invalidUrl: 'API地址格式不正确',
    deleteConfirm: '确定删除选中的历史记录吗？',
    clearConfirm: '确定清空所有扫描历史吗？此操作不可恢复。',
    deleteBatchConfirm: '确定删除这个扫描批次吗？此操作不可恢复。',
    
    // 图书信息
    bookTitle: '书名',
    bookAuthor: '作者',
    bookISBN: 'ISBN',
    bookPublisher: '出版社',
    bookPlace: '出版地',
    bookYear: '出版年份',
    bookCallNumber: '索书号',
    bookBarcode: '条码号',
    bookStatus: '馆藏状态',
    
    // 扫码结果类型
    typeURL: '网址链接',
    typeISBN: 'ISBN条码',
    typeBarcode: '商品条码',
    typeText: '文本内容'
  },
  
  'zh-TW': {
    // 通用
    appName: '掃碼助手',
    confirm: '確定',
    cancel: '取消',
    save: '儲存',
    delete: '刪除',
    copy: '複製',
    back: '返回',
    
    // TabBar
    tabHome: '首頁',
    tabHistory: '歷史',
    tabSettings: '設定',
    
    // 首页
    currentMode: '當前模式',
    normalMode: '普通掃碼',
    bookMode: '圖書掃碼',
    clickToScan: '點撃掃碼',
    supportQR: '支持二維碼、條形碼',
    supportBook: '支持二維碼、條形碼、圖書條碼',
    manualInput: '手動輸入',
    inputPlaceholder: '請輸入條碼內容',
    inputBookPlaceholder: '請輸入圖書條碼',
    confirmBtn: '確認',
    finishScan: '完成本次掃碼',
    recentBatches: '最近掃碼批次',
    viewAll: '查看全部',
    noRecords: '暫無掃碼記錄',
    startScanTip: '點撃上方掃碼按鈕開始掃碼',
    
    // 历史页
    historyTitle: '歷史記錄',
    historySubtitle: '按掃碼批次查看',
    noHistory: '暫無歷史記錄',
    goToScan: '去掃碼',
    selectedCount: '已選取 {count} 個批次',
    batchTime: '掃碼時間',
    itemCount: '共 {count} 條',
    
    // 详情页
    detailTitle: '掃碼詳情',
    normalScan: '普通掃碼',
    bookScan: '圖書掃碼',
    copyAll: '複製全部',
    deleteBatch: '刪除批次',
    
    // 设置页
    apiConfig: '圖書API設定',
    apiDesc: '設定圖書查詢介面，用於圖書掃碼模式',
    apiUrl: 'API位址',
    apiUrlPlaceholder: '請輸入API位址',
    apiKey: 'API Key',
    apiKeyPlaceholder: '請輸入API Key',
    saveConfig: '儲存設定',
    testConnection: '測試連線',
    languageSetting: '語言設定',
    dataManagement: '資料管理',
    clearHistory: '清空掃碼歷史',
    clearDesc: '刪除所有掃碼記錄，不可恢復',
    exportData: '匯出資料',
    exportDesc: '將掃碼記錄匯出為文字',
    about: '關於',
    version: '版本 1.0.0',
    appDesc: '一個簡單實用的二維碼/條形碼/圖書掃碼工具',
    
    // 提示信息
    copySuccess: '已複製到剪貼簿',
    copyFail: '複製失敗，請重試',
    deleteSuccess: '刪除成功',
    saveSuccess: '儲存成功',
    inputApiUrl: '請輸入API位址',
    invalidUrl: 'API位址格式不正確',
    deleteConfirm: '確定刪除選取的歷史記錄嗎？',
    clearConfirm: '確定清空所有掃碼歷史嗎？此操作不可恢復。',
    deleteBatchConfirm: '確定刪除這個掃碼批次嗎？此操作不可恢復。',
    
    // 图书信息
    bookTitle: '書名',
    bookAuthor: '作者',
    bookISBN: 'ISBN',
    bookPublisher: '出版社',
    bookPlace: '出版地',
    bookYear: '出版年份',
    bookCallNumber: '索書號',
    bookBarcode: '條碼號',
    bookStatus: '館藏狀態',
    
    // 扫码结果类型
    typeURL: '網址連結',
    typeISBN: 'ISBN條碼',
    typeBarcode: '商品條碼',
    typeText: '文字內容'
  },
  
  'en': {
    // General
    appName: 'Scan Helper',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    copy: 'Copy',
    back: 'Back',
    
    // TabBar
    tabHome: 'Home',
    tabHistory: 'History',
    tabSettings: 'Settings',
    
    // Home
    currentMode: 'Current Mode',
    normalMode: 'Normal Scan',
    bookMode: 'Book Scan',
    clickToScan: 'Tap to Scan',
    supportQR: 'Support QR code & barcode',
    supportBook: 'Support QR, barcode & book code',
    manualInput: 'Manual Input',
    inputPlaceholder: 'Enter barcode content',
    inputBookPlaceholder: 'Enter book barcode',
    confirmBtn: 'Confirm',
    finishScan: 'Finish Scan',
    recentBatches: 'Recent Scan Batches',
    viewAll: 'View All',
    noRecords: 'No scan records',
    startScanTip: 'Tap the scan button above to start',
    
    // History
    historyTitle: 'History',
    historySubtitle: 'View by scan batches',
    noHistory: 'No history records',
    goToScan: 'Go Scan',
    selectedCount: '{count} batches selected',
    batchTime: 'Scan Time',
    itemCount: '{count} items',
    
    // Detail
    detailTitle: 'Scan Details',
    normalScan: 'Normal Scan',
    bookScan: 'Book Scan',
    copyAll: 'Copy All',
    deleteBatch: 'Delete Batch',
    
    // Settings
    apiConfig: 'Book API Config',
    apiDesc: 'Configure book query API for book scan mode',
    apiUrl: 'API URL',
    apiUrlPlaceholder: 'Enter API URL',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'Enter API Key',
    saveConfig: 'Save Config',
    testConnection: 'Test Connection',
    languageSetting: 'Language',
    dataManagement: 'Data Management',
    clearHistory: 'Clear Scan History',
    clearDesc: 'Delete all scan records, cannot be recovered',
    exportData: 'Export Data',
    exportDesc: 'Export scan records as text',
    about: 'About',
    version: 'Version 1.0.0',
    appDesc: 'A simple and practical QR/barcode/book scanning tool',
    
    // Messages
    copySuccess: 'Copied to clipboard',
    copyFail: 'Copy failed, please try again',
    deleteSuccess: 'Deleted successfully',
    saveSuccess: 'Saved successfully',
    inputApiUrl: 'Please enter API URL',
    invalidUrl: 'Invalid API URL format',
    deleteConfirm: 'Are you sure you want to delete selected records?',
    clearConfirm: 'Are you sure you want to clear all history? This cannot be undone.',
    deleteBatchConfirm: 'Are you sure you want to delete this batch? This cannot be undone.',
    
    // Book Info
    bookTitle: 'Title',
    bookAuthor: 'Author',
    bookISBN: 'ISBN',
    bookPublisher: 'Publisher',
    bookPlace: 'Place',
    bookYear: 'Year',
    bookCallNumber: 'Call Number',
    bookBarcode: 'Barcode',
    bookStatus: 'Status',
    
    // Scan Types
    typeURL: 'URL Link',
    typeISBN: 'ISBN Barcode',
    typeBarcode: 'Product Barcode',
    typeText: 'Text Content'
  }
};

// 获取当前语言
function getCurrentLocale() {
  const app = getApp();
  return app ? app.globalData.language : 'zh-CN';
}

// 翻译函数
function t(key, params = {}) {
  const locale = getCurrentLocale();
  const messages = locales[locale] || locales['zh-CN'];
  let text = messages[key] || key;
  
  // 替换参数
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
}

// 设置语言
function setLocale(lang) {
  const app = getApp();
  if (app) {
    app.saveLanguage(lang);
  }
}

// 获取支持的语言列表
function getSupportedLocales() {
  return [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'en', name: 'English' }
  ];
}

module.exports = {
  t,
  setLocale,
  getCurrentLocale,
  getSupportedLocales,
  locales
};
