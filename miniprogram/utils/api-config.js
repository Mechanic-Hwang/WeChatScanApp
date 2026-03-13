// miniprogram/utils/api-config.js - API配置管理
const app = getApp();

// XML解析函数
function parseXML(xmlString) {
  const result = {};

  // 提取标签内容的辅助函数
  function getValue(xml, tagName) {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  }

  // 尝试提取常见的图书字段（支持多种命名方式）
  result.title = getValue(xmlString, 'title') ||
                 getValue(xmlString, '书名') ||
                 getValue(xmlString, '题名') ||
                 getValue(xmlString, 'Title');

  result.author = getValue(xmlString, 'author') ||
                  getValue(xmlString, '作者') ||
                  getValue(xmlString, '责任者') ||
                  getValue(xmlString, 'Author');

  result.isbn = getValue(xmlString, 'isbn') ||
                getValue(xmlString, 'ISBN') ||
                getValue(xmlString, 'isbn13');

  // 出版社（支持 publisher_const 和 publisher）
  result.publisher = getValue(xmlString, 'publisher_const') ||
                     getValue(xmlString, 'publisher') ||
                     getValue(xmlString, '出版社') ||
                     getValue(xmlString, '出版者') ||
                     getValue(xmlString, 'Publisher');

  // 出版地（支持 place_of_publication 和 place）
  result.place = getValue(xmlString, 'place_of_publication') ||
                 getValue(xmlString, 'place') ||
                 getValue(xmlString, '出版地') ||
                 getValue(xmlString, 'Place');

  // 出版年（支持 date_of_publication 和 year）
  result.year = getValue(xmlString, 'date_of_publication') ||
                getValue(xmlString, 'year') ||
                getValue(xmlString, '出版年') ||
                getValue(xmlString, 'date') ||
                getValue(xmlString, 'Year');

  // 索书号（支持 permanent_call_number 和 call_number）
  result.callNumber = getValue(xmlString, 'permanent_call_number') ||
                      getValue(xmlString, 'call_number') ||
                      getValue(xmlString, 'callNumber') ||
                      getValue(xmlString, '索书号') ||
                      getValue(xmlString, '分类号') ||
                      getValue(xmlString, 'CallNumber');

  result.barcode = getValue(xmlString, 'barcode') ||
                   getValue(xmlString, '条码号') ||
                   getValue(xmlString, 'Barcode');

  // 馆藏状态（支持 base_status 和 status）
  result.status = getValue(xmlString, 'base_status') ||
                  getValue(xmlString, 'status') ||
                  getValue(xmlString, '馆藏状态') ||
                  getValue(xmlString, '状态') ||
                  getValue(xmlString, 'Status');

  return result;
}

// 默认API配置
const DEFAULT_API_CONFIG = {
  enabled: false,
  name: '图书查询接口',
  url: '',
  method: 'GET',
  requestType: 'query', // query 或 json
  responseType: 'auto', // json、xml 或 auto（自动检测）
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, application/xml, text/xml'
  },
  queryParams: [
    { key: 'item_barcode', value: '{{scanValue}}' }
  ],
  jsonBodyTemplate: '{\n  "barcode": "{{scanValue}}"\n}',
  responseType: 'json',
  showRawResponse: false,
  emptyValueMode: 'placeholder', // placeholder 或 hide
  fieldMappings: [
    { label: '书名', path: 'title', visible: true, order: 1 },
    { label: '作者', path: 'author', visible: true, order: 2 },
    { label: 'ISBN', path: 'isbn', visible: true, order: 3 },
    { label: '出版社', path: 'publisher', visible: true, order: 4 },
    { label: '出版地', path: 'place', visible: false, order: 5 },
    { label: '出版年', path: 'year', visible: false, order: 6 },
    { label: '索书号', path: 'callNumber', visible: true, order: 7 },
    { label: '条码号', path: 'barcode', visible: true, order: 8 },
    { label: '馆藏状态', path: 'status', visible: true, order: 9 }
  ]
};

// 加载API配置
function loadApiConfig() {
  try {
    const config = wx.getStorageSync('apiConfig_v2');
    if (config) {
      return { ...DEFAULT_API_CONFIG, ...config };
    }
  } catch (e) {
    console.error('[ApiConfig] 加载配置失败:', e);
  }
  return { ...DEFAULT_API_CONFIG };
}

// 保存API配置
function saveApiConfig(config) {
  try {
    wx.setStorageSync('apiConfig_v2', config);
    return true;
  } catch (e) {
    console.error('[ApiConfig] 保存配置失败:', e);
    return false;
  }
}

// 模板变量替换
function replaceVariables(template, scanValue) {
  if (!template) return template;
  return template.replace(/\{\{scanValue\}\}/g, scanValue);
}

// 构建请求配置
function buildRequest(apiConfig, scanValue) {
  const { url, method, requestType, timeout, headers, queryParams, jsonBodyTemplate } = apiConfig;
  
  // 替换URL中的变量
  const finalUrl = replaceVariables(url, scanValue);
  
  let requestData = {
    url: finalUrl,
    method: method,
    timeout: timeout,
    header: headers
  };
  
  if (method === 'GET' || requestType === 'query') {
    // 构建Query参数
    const params = {};
    queryParams.forEach(param => {
      if (param.key) {
        params[param.key] = replaceVariables(param.value, scanValue);
      }
    });
    requestData.data = params;
  } else if (method === 'POST' && requestType === 'json') {
    // 构建JSON Body
    try {
      let bodyStr = replaceVariables(jsonBodyTemplate, scanValue);
      requestData.data = JSON.parse(bodyStr);
    } catch (e) {
      console.error('[ApiConfig] JSON模板解析失败:', e);
      throw new Error('JSON模板格式错误');
    }
  }
  
  return requestData;
}

// 执行API请求
async function executeRequest(apiConfig, scanValue) {
  const requestData = buildRequest(apiConfig, scanValue);
  
  return new Promise((resolve, reject) => {
    wx.request({
      ...requestData,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.errMsg || '请求失败'}`));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
}

// JSON路径解析
function parseJsonPath(data, path) {
  if (!path) return null;
  
  const keys = path.split('.');
  let current = data;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[key];
  }
  
  return current;
}

// 解析返回结果
function parseResponse(apiConfig, responseData) {
  const { fieldMappings, emptyValueMode, responseType } = apiConfig;
  const result = {};
  
  // 如果是XML格式，先解析XML
  let data = responseData;
  if (responseType === 'xml' || typeof responseData === 'string' && responseData.trim().startsWith('<')) {
    data = parseXML(responseData);
  }
  
  fieldMappings.forEach(mapping => {
    if (!mapping.visible) return;
    
    let value;
    if (responseType === 'xml' || typeof responseData === 'string' && responseData.trim().startsWith('<')) {
      // XML模式：直接从解析后的对象获取
      const keyMap = {
        '书名': 'title',
        '作者': 'author',
        'ISBN': 'isbn',
        '出版社': 'publisher',
        '出版地': 'place',
        '出版年': 'year',
        '索书号': 'callNumber',
        '条码号': 'barcode',
        '馆藏状态': 'status'
      };
      const xmlKey = keyMap[mapping.label] || mapping.path;
      value = data[xmlKey];
    } else {
      // JSON模式：使用路径解析
      value = parseJsonPath(data, mapping.path);
    }
    
    if (value === null || value === undefined || value === '') {
      result[mapping.label] = emptyValueMode === 'placeholder' ? '暂无数据' : null;
    } else {
      result[mapping.label] = value;
    }
  });
  
  return result;
}

// 测试配置
async function testApiConfig(apiConfig, testValue) {
  try {
    const response = await executeRequest(apiConfig, testValue);
    
    // 自动检测返回类型
    let responseType = apiConfig.responseType;
    if (typeof response === 'string' && response.trim().startsWith('<')) {
      responseType = 'xml';
    }
    
    const configWithType = { ...apiConfig, responseType };
    const parsed = parseResponse(configWithType, response);
    
    return {
      success: true,
      rawResponse: response,
      parsedResult: parsed,
      detectedType: responseType
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 验证配置
function validateConfig(config) {
  const errors = [];
  
  if (!config.url) {
    errors.push('API地址不能为空');
  } else if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    errors.push('API地址必须以 http:// 或 https:// 开头');
  }
  
  if (config.method === 'POST' && config.requestType === 'json') {
    try {
      JSON.parse(config.jsonBodyTemplate || '{}');
    } catch (e) {
      errors.push('JSON模板格式错误');
    }
  }
  
  // 验证字段映射
  config.fieldMappings.forEach((mapping, index) => {
    if (!mapping.label) {
      errors.push(`字段映射第${index + 1}项：显示名称不能为空`);
    }
    if (!mapping.path) {
      errors.push(`字段映射第${index + 1}项：数据路径不能为空`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  DEFAULT_API_CONFIG,
  loadApiConfig,
  saveApiConfig,
  buildRequest,
  executeRequest,
  parseResponse,
  testApiConfig,
  validateConfig,
  replaceVariables
};
