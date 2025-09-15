# 🧪 StopWalletCry 測試與部署指南

## 📋 測試清單

### 1. 基本功能測試

#### 價格解析測試
- [ ] **Shopee**
  - [ ] 商品詳細頁面主價格
  - [ ] 商品詳細頁面促銷價格  
  - [ ] 商品列表頁面價格
  - [ ] SKU 切換時價格更新
  - [ ] 懶加載商品價格顯示

- [ ] **momo購物網**
  - [ ] 商品詳細頁面售價
  - [ ] 特價商品顯示
  - [ ] 搜尋結果頁價格
  - [ ] 千分位格式價格 (1,999)

- [ ] **誠品線上**
  - [ ] 書籍價格顯示
  - [ ] 生活用品價格
  - [ ] 促銷商品價格
  - [ ] 套書組合價格

- [ ] **博客來**
  - [ ] 書籍單價
  - [ ] 套書優惠價
  - [ ] 電子書價格
  - [ ] 預購商品價格

- [ ] **Pinkoi**
  - [ ] 設計商品價格
  - [ ] NT$ 格式識別
  - [ ] 忽略其他幣別 (USD)
  - [ ] SPA 路由變化更新

#### Badge 顯示測試
- [ ] 工時換算正確性 (價格 ÷ 時薪)
- [ ] 物件換算正確性 (價格 ÷ 物件單價)
- [ ] 小數點四捨五入到 1 位
- [ ] 最小顯示值 0.1
- [ ] Badge 樣式正確顯示
- [ ] 不與網站原有樣式衝突

#### 設定功能測試
- [ ] 時薪設定即時生效
- [ ] 顯示/隱藏工時切換
- [ ] 顯示/隱藏物件切換
- [ ] 最大顯示物件數量設定
- [ ] 新增自訂物件
- [ ] 編輯物件名稱和價格
- [ ] 刪除物件
- [ ] 啟用/停用物件
- [ ] 設定資料持久化

### 2. 邊界情況測試

#### 價格處理
- [ ] 極小價格 (< NT$10)
- [ ] 極大價格 (> NT$100,000)
- [ ] 小數價格 (NT$99.5)
- [ ] 千分位格式 (NT$1,999)
- [ ] 無效價格格式
- [ ] 空白或 null 價格

#### DOM 操作
- [ ] 頁面重複載入不重複插入 Badge
- [ ] DOM 結構變化後正確更新
- [ ] 元素被移除後清理資源
- [ ] 滾動載入新內容時自動處理
- [ ] AJAX 更新內容後重新處理

#### 效能測試
- [ ] 大量商品頁面 (>100 個商品) 不卡頓
- [ ] 記憶體使用合理 (<50MB)
- [ ] CPU 使用率低 (<5%)
- [ ] 批次處理避免 UI 阻塞
- [ ] 節流機制有效運作

### 3. 相容性測試

#### 瀏覽器相容性
- [ ] Chrome 最新版本
- [ ] Chrome 88+ (Manifest V3 最低要求)
- [ ] 不同解析度下正常顯示
- [ ] 縮放比例 (75%, 100%, 125%) 正常

#### 網站相容性  
- [ ] 各網站 UI 改版後仍能正常運作
- [ ] 不干擾網站原有功能
- [ ] 不影響網站載入速度
- [ ] 在隱身模式下正常運作

## 🚀 部署流程

### 1. 準備部署

```bash
# 1. 檢查所有檔案
cd grindmeter
dir  # Windows
ls -la  # Linux/Mac

# 2. 如果有 Python 環境，轉換計算器
cd python
build.bat  # Windows
./build.sh  # Linux/Mac

# 3. 檢查 manifest.json 語法
# 使用線上工具: https://developer.chrome.com/docs/extensions/mv3/manifest/
```

### 2. 本地測試

1. **載入擴充功能**
   - 開啟 Chrome，前往 `chrome://extensions/`
   - 開啟「開發人員模式」
   - 點擊「載入未封裝項目」
   - 選擇 `grindmeter` 資料夾

2. **基本功能驗證**
   - 檢查擴充功能圖示出現在工具列
   - 點擊圖示確認 Popup 正常顯示
   - 右鍵點擊圖示 → 選項，確認設定頁面開啟

3. **網站測試**
   - 訪問 Shopee、momo 等網站
   - 確認價格旁出現 Badge
   - 測試設定變更即時生效

### 3. 錯誤排除

#### 常見問題

**Badge 沒有顯示**
- 檢查 Console 是否有 JavaScript 錯誤
- 確認網站域名在 `manifest.json` 權限中
- 驗證價格選擇器是否正確

**設定無法儲存**
- 檢查 `chrome.storage` 權限
- 確認沒有 Storage API 錯誤
- 檢查設定資料格式是否正確

**樣式顯示異常**
- 確認 CSS 檔案載入
- 檢查是否與網站樣式衝突
- 調整 CSS 權重 (!important)

#### Debug 方法

```javascript
// 在 Console 中測試
console.log('Settings:', await chrome.storage.local.get(null));
console.log('Current calculator:', window.GrindCalculator);
console.log('Processed elements:', document.querySelectorAll('[data-grindmeter]'));
```

### 4. 打包發布

#### 建立發布版本

1. **清理開發檔案**
```bash
# 移除測試檔案
rm -rf test/
rm -rf .git/
rm debug.log
```

2. **壓縮檔案**
```bash
# 建立 ZIP 檔案供 Chrome Web Store 使用
zip -r stopwalletcry-v1.0.0.zip grindmeter/ -x "*.git*" "test/*" "python/__pycache__/*"
```

#### Chrome Web Store 發布

1. 前往 [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. 建立新項目
3. 上傳 ZIP 檔案
4. 填寫商店資訊：
   - 名稱：StopWalletCry
   - 描述：看見價格背後的真實代價
   - 類別：購物
   - 隱私政策：說明不收集個人資料

## 📊 效能監控

### 監控指標

- **記憶體使用**: 透過 Chrome 工作管理員監控
- **載入時間**: 網站載入後 Badge 顯示時間
- **錯誤率**: Console 錯誤數量 / 總操作數
- **使用者體驗**: Badge 顯示準確率

### 效能優化

- 使用 `throttle` 限制處理頻率
- 批次處理大量元素
- 延遲載入非關鍵功能
- 清理不需要的事件監聽器

## 🔧 維護計畫

### 定期檢查項目

- [ ] 每月檢查各大網站是否有 UI 變更
- [ ] 監控 Chrome Web Store 評價和反饋
- [ ] 追蹤 Chrome 新版本相容性
- [ ] 更新價格選擇器適應網站改版

### 版本更新流程

1. 修正錯誤或新增功能
2. 更新版本號 (manifest.json)
3. 執行完整測試
4. 更新 README 和變更日誌
5. 重新打包並發布到 Chrome Web Store

---

**記住**: 這是一個讓消費者更理性的工具，用幽默和溫和的方式提醒，而不是施加壓力！ 🛑💰