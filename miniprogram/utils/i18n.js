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
    
    // 高级API配置
    advancedApiConfig: '高级接口配置',
    advancedApiDesc: '自定义扫码后的接口请求和结果解析',
    apiName: '接口名称',
    apiNamePlaceholder: '如：图书查询接口',
    requestUrl: '请求URL',
    requestUrlTip: '可使用 {{scanValue}} 作为扫码内容变量',
    requestMethod: '请求方法',
    requestFormat: '请求格式',
    queryParams: 'Query参数',
    jsonBody: 'JSON Body',
    timeout: '超时时间',
    fieldMapping: '字段映射配置',
    fieldLabel: '显示名称',
    fieldPath: '数据路径',
    fieldVisible: '显示',
    addField: '添加字段',
    testPreview: '测试与预览',
    testValue: '测试扫码值',
    testValuePlaceholder: '输入条码进行测试',
    testBtn: '测试连接',
    saveAdvancedConfig: '保存高级配置',
    
    // 输入规则配置
    inputRules: '输入规则配置',
    inputRulesDesc: '配置条码输入的校验规则',
    trimSpace: '自动去除空格',
    uppercase: '自动转大写',
    isbnRequired: '图书模式必须ISBN格式',
    
    // 复制规则配置
    copyRules: '复制规则配置',
    copyRulesDesc: '配置复制内容的格式',
    simpleFormat: '简单格式',
    simpleFormatDesc: '仅复制条码内容',
    detailFormat: '详细格式',
    detailFormatDesc: '包含书名、作者等信息',
    jsonFormat: 'JSON格式',
    jsonFormatDesc: '结构化数据，便于导入',
    
    // 恢复默认设置
    resetSettings: '恢复默认设置',
    resetSettingsDesc: '重置所有配置为默认值',
    
    // 使用说明
    helpTitle: '使用说明',
    normalModeHelp: '普通扫码模式',
    normalModeHelpText: '用于扫描普通二维码和条形码，支持网址、文本、商品条码等。',
    bookModeHelp: '图书扫码模式',
    bookModeHelpText: '扫描图书ISBN条码，自动查询图书信息。需先配置图书API。',
    batchHelp: '扫描批次',
    batchHelpText: '每次扫描会话形成一个批次，便于管理和查看历史记录。',
    
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
    confirmDelete: '确认删除',
    batchNotFound: '批次不存在',
    unknown: '未知',
    scanTime: '扫描时间',
    totalItems: '共',
    items: '条记录',
    unknownBookTitle: '未知书名',
    emptyBatch: '该批次没有记录',
    scanAgain: '再次扫描',
    
    // 首页提示
    justNow: '刚刚',
    minutesAgo: '{count}分钟前',
    hoursAgo: '{count}小时前',
    switchToBookMode: '已切换到图书模式',
    switchToNormalMode: '已切换到普通模式',
    scanFailed: '扫码失败',
    querying: '查询中...',
    addSuccess: '添加成功',
    queryFailed: '查询失败',
    cannotGetBookInfo: '无法获取图书信息',
    pleaseInputBookBarcode: '请输入图书条码',
    pleaseInputContent: '请输入内容',
    scanRecordSaved: '已保存扫描记录',
    batchTitle: '{month}月{day}日 {hour}:{minute} 扫描',
    
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
    
    // 高级API配置
    advancedApiConfig: '高級介面設定',
    advancedApiDesc: '自定義掃碼後的介面請求和結果解析',
    apiName: '介面名稱',
    apiNamePlaceholder: '如：圖書查詢介面',
    requestUrl: '請求URL',
    requestUrlTip: '可使用 {{scanValue}} 作為掃碼內容變數',
    requestMethod: '請求方法',
    requestFormat: '請求格式',
    queryParams: 'Query參數',
    jsonBody: 'JSON Body',
    timeout: '超時時間',
    fieldMapping: '欄位映射設定',
    fieldLabel: '顯示名稱',
    fieldPath: '資料路徑',
    fieldVisible: '顯示',
    addField: '添加欄位',
    testPreview: '測試與預覽',
    testValue: '測試掃碼值',
    testValuePlaceholder: '輸入條碼進行測試',
    testBtn: '測試連線',
    saveAdvancedConfig: '儲存高級設定',
    
    // 输入规则配置
    inputRules: '輸入規則設定',
    inputRulesDesc: '設定條碼輸入的校驗規則',
    trimSpace: '自動去除空格',
    uppercase: '自動轉大寫',
    isbnRequired: '圖書模式必須ISBN格式',
    
    // 复制规则配置
    copyRules: '複製規則設定',
    copyRulesDesc: '設定複製內容的格式',
    simpleFormat: '簡單格式',
    simpleFormatDesc: '僅複製條碼內容',
    detailFormat: '詳細格式',
    detailFormatDesc: '包含書名、作者等資訊',
    jsonFormat: 'JSON格式',
    jsonFormatDesc: '結構化資料，便於匯入',
    
    // 恢复默认设置
    resetSettings: '恢復預設設定',
    resetSettingsDesc: '重置所有設定為預設值',
    
    // 使用说明
    helpTitle: '使用說明',
    normalModeHelp: '普通掃碼模式',
    normalModeHelpText: '用於掃描普通二維碼和條形碼，支持網址、文字、商品條碼等。',
    bookModeHelp: '圖書掃碼模式',
    bookModeHelpText: '掃描圖書ISBN條碼，自動查詢圖書資訊。需先設定圖書API。',
    batchHelp: '掃碼批次',
    batchHelpText: '每次掃碼會話形成一個批次，便於管理和查看歷史記錄。',
    
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
    confirmDelete: '確認刪除',
    batchNotFound: '批次不存在',
    unknown: '未知',
    scanTime: '掃碼時間',
    totalItems: '共',
    items: '條記錄',
    unknownBookTitle: '未知書名',
    emptyBatch: '該批次沒有記錄',
    scanAgain: '再次掃碼',
    
    // 首页提示
    justNow: '剛剛',
    minutesAgo: '{count}分鐘前',
    hoursAgo: '{count}小時前',
    switchToBookMode: '已切換到圖書模式',
    switchToNormalMode: '已切換到普通模式',
    scanFailed: '掃碼失敗',
    querying: '查詢中...',
    addSuccess: '添加成功',
    queryFailed: '查詢失敗',
    cannotGetBookInfo: '無法獲取圖書資訊',
    pleaseInputBookBarcode: '請輸入圖書條碼',
    pleaseInputContent: '請輸入內容',
    scanRecordSaved: '已儲存掃碼記錄',
    batchTitle: '{month}月{day}日 {hour}:{minute} 掃碼',
    
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
    
    // Advanced API Config
    advancedApiConfig: 'Advanced API Config',
    advancedApiDesc: 'Customize API request and result parsing after scan',
    apiName: 'API Name',
    apiNamePlaceholder: 'e.g. Book Query API',
    requestUrl: 'Request URL',
    requestUrlTip: 'Use {{scanValue}} as scan content variable',
    requestMethod: 'Request Method',
    requestFormat: 'Request Format',
    queryParams: 'Query Params',
    jsonBody: 'JSON Body',
    timeout: 'Timeout',
    fieldMapping: 'Field Mapping Config',
    fieldLabel: 'Display Name',
    fieldPath: 'Data Path',
    fieldVisible: 'Visible',
    addField: 'Add Field',
    testPreview: 'Test & Preview',
    testValue: 'Test Scan Value',
    testValuePlaceholder: 'Enter barcode for testing',
    testBtn: 'Test Connection',
    saveAdvancedConfig: 'Save Advanced Config',
    
    // Input Rules
    inputRules: 'Input Rules',
    inputRulesDesc: 'Configure barcode input validation rules',
    trimSpace: 'Auto Trim Spaces',
    uppercase: 'Auto Uppercase',
    isbnRequired: 'ISBN Required for Book Mode',
    
    // Copy Rules
    copyRules: 'Copy Rules',
    copyRulesDesc: 'Configure copy content format',
    simpleFormat: 'Simple Format',
    simpleFormatDesc: 'Copy barcode content only',
    detailFormat: 'Detail Format',
    detailFormatDesc: 'Include title, author, etc.',
    jsonFormat: 'JSON Format',
    jsonFormatDesc: 'Structured data for import',
    
    // Reset Settings
    resetSettings: 'Reset Settings',
    resetSettingsDesc: 'Reset all settings to defaults',
    
    // Help
    helpTitle: 'Help',
    normalModeHelp: 'Normal Scan Mode',
    normalModeHelpText: 'For scanning QR codes and barcodes, supports URLs, text, product barcodes, etc.',
    bookModeHelp: 'Book Scan Mode',
    bookModeHelpText: 'Scan book ISBN barcodes to auto-query book info. Requires book API configuration.',
    batchHelp: 'Scan Batches',
    batchHelpText: 'Each scan session forms a batch for easy management and history viewing.',
    
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
    confirmDelete: 'Confirm Delete',
    batchNotFound: 'Batch not found',
    unknown: 'Unknown',
    scanTime: 'Scan Time',
    totalItems: 'Total',
    items: 'items',
    unknownBookTitle: 'Unknown Title',
    emptyBatch: 'No records in this batch',
    scanAgain: 'Scan Again',
    
    // Home messages
    justNow: 'Just now',
    minutesAgo: '{count} min ago',
    hoursAgo: '{count} hr ago',
    switchToBookMode: 'Switched to Book Mode',
    switchToNormalMode: 'Switched to Normal Mode',
    scanFailed: 'Scan failed',
    querying: 'Querying...',
    addSuccess: 'Added successfully',
    queryFailed: 'Query failed',
    cannotGetBookInfo: 'Cannot get book information',
    pleaseInputBookBarcode: 'Please enter book barcode',
    pleaseInputContent: 'Please enter content',
    scanRecordSaved: 'Scan record saved',
    batchTitle: '{month}/{day} {hour}:{minute} Scan',
    
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
