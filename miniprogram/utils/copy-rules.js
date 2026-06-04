// miniprogram/utils/copy-rules.js - 复制规则管理与格式化

const DEFAULT_COPY_RULES = {
  range: 'full',
  separator: 'blankLine',
  includeTime: false,
  includeMode: false,
  bookFields: {
    title: true,
    author: true,
    barcode: true,
    callNumber: true,
    status: true,
    isbn: false,
    publisher: false
  }
};
const MAX_CLIPBOARD_CHARS = 500000;

const BOOK_FIELD_LABELS = {
  title: '书名',
  author: '作者',
  barcode: '条码',
  callNumber: '索书号',
  status: '状态',
  isbn: 'ISBN',
  publisher: '出版社'
};

function getSeparator(separator) {
  if (separator === 'singleNewline') return '\n';
  if (separator === 'line') return '\n---\n';
  return '\n\n';
}

function normalizeCopyRules(rules = {}) {
  return {
    ...DEFAULT_COPY_RULES,
    ...rules,
    bookFields: {
      ...DEFAULT_COPY_RULES.bookFields,
      ...(rules.bookFields || {})
    }
  };
}

function loadCopyRules() {
  try {
    const rules = wx.getStorageSync('copyRules');
    if (rules) return normalizeCopyRules(rules);

    const legacyFormat = wx.getStorageSync('copyFormat');
    if (legacyFormat === 'simple') {
      return normalizeCopyRules({ range: 'raw' });
    }
    if (legacyFormat === 'json') {
      return normalizeCopyRules({ range: 'json' });
    }
  } catch (e) {
    console.error('[CopyRules] 加载复制规则失败:', e);
  }

  return normalizeCopyRules();
}

function saveCopyRules(rules) {
  try {
    wx.setStorageSync('copyRules', normalizeCopyRules(rules));
    return true;
  } catch (e) {
    console.error('[CopyRules] 保存复制规则失败:', e);
    return false;
  }
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function getBookFieldValue(item, field) {
  const bookInfo = item.bookInfo || {};
  if (field === 'barcode') return item.barcode || bookInfo.barcode || item.content || '';
  return bookInfo[field] || item[field] || '';
}

function formatBookPrimary(item, rules) {
  return Object.keys(rules.bookFields)
    .filter(field => rules.bookFields[field])
    .map(field => {
      const value = getBookFieldValue(item, field);
      return value ? `${BOOK_FIELD_LABELS[field]}: ${value}` : '';
    })
    .filter(Boolean)
    .join('\n') || (item.content || '');
}

function formatRecord(item, rules = loadCopyRules()) {
  const normalizedRules = normalizeCopyRules(rules);
  const lines = [];

  if (normalizedRules.range === 'json') {
    return JSON.stringify(item, null, 2);
  }

  if (normalizedRules.range === 'raw') {
    lines.push(item.content || '');
  } else if (item.mode === 'book') {
    lines.push(formatBookPrimary(item, normalizedRules));
    if (normalizedRules.range === 'full' && item.customResult) {
      lines.push('接口结果:');
      Object.keys(item.customResult).forEach(key => {
        const value = item.customResult[key];
        if (value !== null && value !== undefined && value !== '') {
          lines.push(`${key}: ${value}`);
        }
      });
    }
  } else {
    lines.push(item.content || '');
    if (normalizedRules.range === 'full' && item.customResult) {
      lines.push('接口结果:');
      Object.keys(item.customResult).forEach(key => {
        const value = item.customResult[key];
        if (value !== null && value !== undefined && value !== '') {
          lines.push(`${key}: ${value}`);
        }
      });
    }
  }

  if (normalizedRules.includeMode) {
    lines.push(`模式: ${item.mode === 'book' ? '图书' : '普通'}`);
  }
  if (normalizedRules.includeTime) {
    lines.push(`时间: ${formatTime(item.createdAt)}`);
  }

  return lines.filter(Boolean).join('\n');
}

function formatRecords(items, rules = loadCopyRules()) {
  const normalizedRules = normalizeCopyRules(rules);
  if (normalizedRules.range === 'json') {
    return JSON.stringify(items, null, 2);
  }

  return items
    .map(item => formatRecord(item, normalizedRules))
    .join(getSeparator(normalizedRules.separator));
}

function formatBatch(batch, rules = loadCopyRules()) {
  const normalizedRules = normalizeCopyRules(rules);
  if (normalizedRules.range === 'json') {
    return JSON.stringify(batch.items || [], null, 2);
  }

  const header = `【${batch.title || '扫描批次'}】`;
  const body = formatRecords(batch.items || [], normalizedRules);
  return `${header}\n${body}`;
}

function formatBatches(batches, rules = loadCopyRules()) {
  const normalizedRules = normalizeCopyRules(rules);
  if (normalizedRules.range === 'json') {
    return JSON.stringify(batches.flatMap(batch => batch.items || []), null, 2);
  }

  return batches
    .map(batch => formatBatch(batch, normalizedRules))
    .join(getSeparator(normalizedRules.separator));
}

function isClipboardContentTooLarge(content) {
  return String(content || '').length > MAX_CLIPBOARD_CHARS;
}

module.exports = {
  DEFAULT_COPY_RULES,
  MAX_CLIPBOARD_CHARS,
  BOOK_FIELD_LABELS,
  normalizeCopyRules,
  loadCopyRules,
  saveCopyRules,
  formatRecord,
  formatRecords,
  formatBatch,
  formatBatches,
  isClipboardContentTooLarge
};
