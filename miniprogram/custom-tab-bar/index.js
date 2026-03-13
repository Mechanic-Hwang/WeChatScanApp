// custom-tab-bar/index.js
const app = getApp();
const i18n = require('../utils/i18n.js');

Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        iconPath: "/images/home.png",
        selectedIconPath: "/images/home-active.png"
      },
      {
        pagePath: "/pages/history/history",
        iconPath: "/images/history.png",
        selectedIconPath: "/images/history-active.png"
      },
      {
        pagePath: "/pages/settings/settings",
        iconPath: "/images/settings.png",
        selectedIconPath: "/images/settings-active.png"
      }
    ]
  },

  attached() {
    this.updateLanguage();
  },

  methods: {
    updateLanguage() {
      const t = i18n.t;
      const list = this.data.list.map((item, index) => {
        let text = '';
        if (index === 0) text = t('tabHome');
        else if (index === 1) text = t('tabHistory');
        else if (index === 2) text = t('tabSettings');
        return { ...item, text };
      });
      this.setData({ list });
    },

    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
      this.setData({
        selected: data.index
      });
    }
  }
});
