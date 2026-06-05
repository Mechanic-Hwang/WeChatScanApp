// pages/history/history.js
const app = getApp();
const i18n = require('../../utils/i18n.js');
const copyRulesUtil = require('../../utils/copy-rules.js');

Page({
  data: {
    batches: [],
    allBatches: [],
    filteredBatches: [],
    selectedCount: 0,
    isAllSelected: false,
    searchKeyword: '',
    recentSearches: [],
    modeFilter: 'all',
    dateFilter: 'all',
    pageIndex: 1,
    pageSize: 50,
    pageSizes: [50, 100, 200, 500],
    totalPages: 1,
    totalCount: 0,
    t: i18n.locales[app.globalData.language || 'zh-CN']
  },

  onLoad() {
    this.loadRecentSearches();
    this.restoreListState();
    this.loadBatches();
  },

  onShow() {
    this.setData({
      t: i18n.locales[app.globalData.language || 'zh-CN']
    });
    this.loadBatches();
    this.restoreScrollPosition();
    setTimeout(() => wx.hideLoading(), 180);
  },

  onHide() {
    clearTimeout(this._searchTimer);
    this.saveListState();
  },

  onUnload() {
    clearTimeout(this._searchTimer);
    this.saveListState();
  },

  onPageScroll(e) {
    this._scrollTop = e.scrollTop;
  },

  text(key, params = {}) {
    let value = (this.data.t && this.data.t[key]) || key;
    Object.keys(params).forEach(name => {
      value = value.replace(`{${name}}`, params[name]);
    });
    return value;
  },

  loadBatches() {
    this._searchIndex = {};
    const batches = app.globalData.scanBatches.map(batch => this.buildBatchSummary(batch));

    this.setData({
      allBatches: batches,
      isAllSelected: false
    });
    this.applyFilters(true);
  },

  buildBatchSummary(batch) {
    const previewItems = batch.previewItems || [];
    if (this._searchIndex) {
      this._searchIndex[batch.batchId] = this.buildBatchSearchText(batch, previewItems);
    }
    return {
      batchId: batch.batchId,
      batchType: batch.batchType,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      itemCount: batch.itemCount || (batch.items ? batch.items.length : 0),
      previewItems,
      timeText: this.formatBatchTime(batch.createdAt),
      title: this.formatBatchTitle(batch),
      typeText: batch.batchType === 'book' ? this.text('book') : this.text('normal'),
      selected: false
    };
  },

  buildBatchSearchText(batch, previewItems = []) {
    const parts = [
      batch.batchId,
      batch.batchType,
      ...previewItems
    ];
    (batch.items || []).forEach(item => {
      parts.push(item.content);
      if (item.bookInfo) {
        parts.push(item.bookInfo.title, item.bookInfo.author, item.bookInfo.barcode, item.bookInfo.callNumber);
      }
      if (item.customResult) {
        Object.keys(item.customResult).forEach(key => parts.push(item.customResult[key]));
      }
    });
    return parts
      .filter(value => value !== undefined && value !== null && value !== '')
      .map(value => String(value).toLowerCase())
      .join('\n');
  },

  loadRecentSearches() {
    const recentSearches = wx.getStorageSync('recentHistorySearches') || [];
    this.setData({ recentSearches });
  },

  saveRecentSearch(keyword) {
    const normalized = (keyword || '').trim();
    if (!normalized) return;

    const recentSearches = [
      normalized,
      ...this.data.recentSearches.filter(item => item !== normalized)
    ].slice(0, 5);

    this.setData({ recentSearches });
    wx.setStorageSync('recentHistorySearches', recentSearches);
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
      pageIndex: 1
    });
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.applyFilters();
    }, 180);
  },

  onSearchConfirm() {
    clearTimeout(this._searchTimer);
    this.applyFilters();
    this.saveRecentSearch(this.data.searchKeyword);
  },

  useRecentSearch(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ searchKeyword: keyword, pageIndex: 1 });
    this.applyFilters();
  },

  deleteRecentSearch(e) {
    const keyword = e.currentTarget.dataset.keyword;
    const recentSearches = this.data.recentSearches.filter(item => item !== keyword);
    this.setData({ recentSearches });
    wx.setStorageSync('recentHistorySearches', recentSearches);
  },

  setModeFilter(e) {
    this.setData({
      modeFilter: e.currentTarget.dataset.mode,
      pageIndex: 1
    });
    this.applyFilters();
  },

  setDateFilter(e) {
    this.setData({
      dateFilter: e.currentTarget.dataset.date,
      pageIndex: 1
    });
    this.applyFilters();
  },

  saveListState() {
    wx.setStorageSync('historyListState', {
      searchKeyword: this.data.searchKeyword,
      modeFilter: this.data.modeFilter,
      dateFilter: this.data.dateFilter,
      pageIndex: this.data.pageIndex,
      pageSize: this.data.pageSize,
      scrollTop: this._scrollTop || 0
    });
  },

  restoreListState() {
    const state = wx.getStorageSync('historyListState');
    if (!state) return;

    this.setData({
      searchKeyword: state.searchKeyword || '',
      modeFilter: state.modeFilter || 'all',
      dateFilter: state.dateFilter || 'all',
      pageIndex: state.pageIndex || 1,
      pageSize: state.pageSize || 50
    });
    this._restoreScrollTop = state.scrollTop || 0;
  },

  restoreScrollPosition() {
    if (!this._restoreScrollTop) return;

    const scrollTop = this._restoreScrollTop;
    this._restoreScrollTop = 0;
    setTimeout(() => {
      wx.pageScrollTo({
        scrollTop,
        duration: 0
      });
    }, 50);
  },

  matchDateFilter(batch) {
    if (this.data.dateFilter === 'all') return true;

    const createdAt = new Date(batch.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (this.data.dateFilter === 'today') {
      return createdAt >= today;
    }

    const days = this.data.dateFilter === '7days' ? 7 : 30;
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    return createdAt >= start;
  },

  applyFilters(resetSelection = false) {
    const keyword = this.data.searchKeyword.trim().toLowerCase();
    const modeFilter = this.data.modeFilter;

    let filtered = this.data.allBatches.filter(batch => {
      if (modeFilter !== 'all' && batch.batchType !== modeFilter) return false;
      if (!this.matchDateFilter(batch)) return false;

      if (!keyword) return true;

      if (this._searchIndex && this._searchIndex[batch.batchId] && this._searchIndex[batch.batchId].includes(keyword)) return true;

      return false;
    });

    if (resetSelection) {
      filtered = filtered.map(batch => ({ ...batch, selected: false }));
    }

    this.setData({ filteredBatches: filtered });
    this.applyPagination();
  },

  applyPagination() {
    const totalCount = this.data.filteredBatches.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / this.data.pageSize));
    const pageIndex = Math.min(this.data.pageIndex, totalPages);
    const start = (pageIndex - 1) * this.data.pageSize;
    const batches = this.data.filteredBatches.slice(start, start + this.data.pageSize);

    this.setData({
      batches,
      pageIndex,
      totalPages,
      totalCount,
      isAllSelected: batches.length > 0 && batches.every(batch => batch.selected)
    });
    this.updateSelectedCount();
  },

  setPageSize(e) {
    this.setData({
      pageSize: Number(e.currentTarget.dataset.size),
      pageIndex: 1
    });
    this.applyPagination();
  },

  prevPage() {
    if (this.data.pageIndex <= 1) return;
    this.setData({ pageIndex: this.data.pageIndex - 1 });
    this.applyPagination();
  },

  nextPage() {
    if (this.data.pageIndex >= this.data.totalPages) return;
    this.setData({ pageIndex: this.data.pageIndex + 1 });
    this.applyPagination();
  },

  selectAll() {
    const isAllSelected = !this.data.isAllSelected;
    const visibleIds = this.data.batches.map(batch => batch.batchId);
    const filteredBatches = this.data.filteredBatches.map(batch => (
      visibleIds.includes(batch.batchId) ? { ...batch, selected: isAllSelected } : batch
    ));

    this.setData({ filteredBatches, isAllSelected });
    this.applyPagination();
  },

  clearAllHistory() {
    wx.showModal({
      title: this.text('confirmClear'),
      content: this.text('clearAllHistoryConfirm', { count: this.data.allBatches.length }),
      success: (res) => {
        if (res.confirm) {
          app.clearScanBatches();
          this.setData({
            batches: [],
            allBatches: [],
            filteredBatches: [],
            selectedCount: 0,
            totalCount: 0,
            totalPages: 1,
            pageIndex: 1
          });
          wx.showToast({ title: this.text('clearAllHistoryDone'), icon: 'success' });
        }
      }
    });
  },

  formatBatchTime(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) {
      return `${this.text('today')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    if (date >= yesterday) {
      return `${this.text('yesterday')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    return this.text('monthDayTime', {
      month: date.getMonth() + 1,
      day: date.getDate(),
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    });
  },

  formatBatchTitle(batch) {
    const date = new Date(batch.createdAt);
    if (Number.isNaN(date.getTime())) return this.text('scanRecordTitle', { time: '' });
    const timeStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return this.text('scanRecordTitle', { time: timeStr });
  },

  onBatchTap(e) {
    this.saveRecentSearch(this.data.searchKeyword);
    this.saveListState();
    wx.showLoading({ title: this.text('loading') });
    wx.navigateTo({
      url: `/pages/history-detail/history-detail?batchId=${e.currentTarget.dataset.id}`,
      fail: () => {
        wx.hideLoading();
      }
    });
  },

  onCheckboxTap(e) {
    const batchId = e.currentTarget.dataset.id;
    const filteredBatches = this.data.filteredBatches.map(batch => (
      batch.batchId === batchId ? { ...batch, selected: !batch.selected } : batch
    ));

    this.setData({ filteredBatches });
    this.applyPagination();
  },

  updateSelectedCount() {
    const selectedCount = this.data.filteredBatches.filter(batch => batch.selected).length;
    this.setData({ selectedCount });
  },

  deleteSelected() {
    const selectedIds = this.data.filteredBatches
      .filter(batch => batch.selected)
      .map(batch => batch.batchId);

    if (selectedIds.length === 0) return;

    wx.showModal({
      title: this.text('confirmDeleteSelected'),
      content: this.text('deleteSelectedConfirm', { count: selectedIds.length }),
      success: (res) => {
        if (res.confirm) {
          app.deleteBatches(selectedIds);
          this.loadBatches();
          wx.showToast({ title: this.text('deleteSuccess'), icon: 'success' });
        }
      }
    });
  },

  copySelected() {
    const selectedIds = this.data.filteredBatches
      .filter(batch => batch.selected)
      .map(batch => batch.batchId)
      .slice(0, 500);
    const selectedBatches = selectedIds
      .map(batchId => app.getBatchDetail(batchId))
      .filter(Boolean);

    if (selectedBatches.length === 0) return;

    const t = this.data.t || {};
    const content = copyRulesUtil.formatBatches(selectedBatches);
    if (copyRulesUtil.isClipboardContentTooLarge(content)) {
      wx.showToast({ title: this.text('clipboardContentTooLarge'), icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: t.copySuccess, icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: this.text('copyFail'), icon: 'none' });
      }
    });
  },

  goToScan() {
    wx.showLoading({ title: this.text('loading') });
    wx.switchTab({
      url: '/pages/index/index',
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});
