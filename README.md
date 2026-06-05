# 微信小程序扫码工具

一个微信小程序扫码工具，支持二维码、条形码、图书条码扫描，提供规则匹配、接口路由、批次历史、复制导出和多语言界面。

## 当前规格

### 1. 扫码与输入
- 首页提供普通模式和图书模式。
- 微信扫码失败提示会区分取消、相机权限、识别失败和系统错误。
- 手动输入支持去空格、转大写、最大长度限制、图书 ISBN/条码校验。
- `allowNewline` 与 `enterSubmit` 互斥：允许换行时使用 `textarea`，Enter 用于换行，必须点击确认提交。

### 2. 统一接口路由
- 普通模式、图书模式和设置页测试都走同一套 `queryCustomScan / resolveApiConfigForScan` 主流程。
- 规则匹配优先于辅助类型检测，`detectCodeType` 仅作为没有命中规则时的兜底分类。
- 规则按启用状态和优先级匹配，可绑定到不同 API 配置。
- 规则匹配器会保留正则捕获组，模板中可使用：
  - `{{scanValue}}`
  - `{{group1}}`、`{{group2}}`
  - `{{groups.0}}`
  - `{{named.name}}`
- 图书模式不再保留独立直连接口逻辑，而是统一纳入规则匹配和接口路由。

### 3. API 配置
- 支持多个 API 配置，每个配置包含 URL、方法、请求格式、返回格式、Header、Query 参数、JSON Body 模板、字段映射。
- 默认 Query 参数和 JSON Body 模板统一使用 `item_barcode`。
- `responseType` 只保留一处定义，支持 `auto`、`json`、`xml`。
- XML 解析会优先读取标签的 `desc` 属性，再读取标签文本。
- 保存配置时会校验接口 ID、接口名称、URL、请求方法、请求格式、返回格式、空值策略、字段映射、唯一默认接口、默认接口启用状态。
- 删除接口前会检查是否仍有规则绑定，防止规则指向不存在的接口。

### 4. 查询结果状态
- 接口查询成功时保存解析结果、标准字段、展示字段、命中规则、使用接口和可选原始响应。
- 查询失败时不丢弃扫码内容，会保存：
  - `queryFailed`
  - `errorMessage`
  - `fallbackToRaw`
- 历史详情页会展示查询失败信息和接口结果。

### 5. 首页与历史
- 首页明确展示最近扫描批次，不展示散列的最近单条记录。
- 历史页按批次展示，支持搜索、模式筛选、日期筛选、分页、批量复制和删除。
- 详情页展示批次内单条记录，支持复制、删除和再次扫描。

### 6. 存储限制策略
- 单条记录最大约 200 KB。
- 单个批次最大约 2 MB。
- 历史最多保留 500 个批次。
- 历史数据约 8 MB 时提示清理。
- 历史数据超过约 10 MB 时自动清理旧批次到约 9 MB。
- 本地存储写入失败时，会尝试删除最旧批次后重试。

### 7. 多语言
- 支持简体中文 `zh-CN`、繁体中文 `zh-TW`、英文 `en`。
- 默认跟随微信语言；也可在设置页手动切换。

## 项目结构

```text
miniprogram/
├── app.js
├── app.json
├── app.wxss
├── custom-tab-bar/
├── images/
│   ├── home.png
│   ├── home-active.png
│   ├── history.png
│   ├── history-active.png
│   ├── settings.png
│   └── settings-active.png
├── pages/
│   ├── index/
│   ├── history/
│   ├── history-detail/
│   └── settings/
└── utils/
    ├── api-config.js
    ├── copy-rules.js
    ├── i18n.js
    └── icons.js
```

## app.json 校验结果

- 页面路径与真实目录一致：
  - `pages/index/index`
  - `pages/history/history`
  - `pages/history-detail/history-detail`
  - `pages/settings/settings`
- tabBar 6 个图标均已存在：
  - `images/home.png`
  - `images/home-active.png`
  - `images/history.png`
  - `images/history-active.png`
  - `images/settings.png`
  - `images/settings-active.png`

## 使用说明

### 普通扫码
1. 在首页选择普通模式。
2. 点击扫码或手动输入内容。
3. 系统先按规则匹配路由接口，未命中时使用默认接口或保存原始内容。
4. 点击完成扫描后，当前批次进入历史记录。

### 图书扫码
1. 在首页选择图书模式。
2. 在设置页配置图书条码对应规则和 API。
3. 扫描或输入图书条码。
4. 图书记录会使用统一接口路由解析标准字段和展示字段。

### 设置页测试
1. 配置接口和规则。
2. 输入测试扫码值。
3. 点击测试连接，测试会走与扫码页一致的规则匹配和接口路由。

## 安全说明

- 扫描历史和接口配置保存在微信小程序本地 Storage。
- API Key 等敏感参数不会上传到项目服务器。
- 历史数据存在容量限制，重要数据建议及时复制或导出。

## 技术栈

- 微信小程序原生框架
- JavaScript
- WXML
- WXSS
- `wx.request`
- 本地 Storage

## 版本历史

### v1.2.0
- 统一普通模式、图书模式、设置页测试的接口路由主流程。
- 增强扫码失败提示、查询失败状态、规则捕获组、XML 解析和配置校验。
- 明确首页展示最近批次，统一存储限制策略。
- 补全繁体中文新增文案。

### v1.1.0
- 新增扫描批次功能。
- 历史记录按批次展示。
- 批量操作优化。

### v1.0.0
- 基础扫码功能。
- 图书查询功能。
- 历史记录管理。
- 多语言支持。

## License

MIT License
