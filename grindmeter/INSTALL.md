# 🚀 StopWalletCry 安裝指南

## 快速安裝（5 分鐘）

### 步驟 1：下載專案
```bash
# 如果您有 git
git clone https://github.com/your-username/stopwalletcry.git
cd stopwalletcry/grindmeter

# 或直接下載 ZIP 檔案並解壓縮
```

### 步驟 2：安裝到 Chrome
1. 開啟 Chrome 瀏覽器
2. 在網址列輸入：`chrome://extensions/`
3. 開啟右上角的「開發人員模式」開關
4. 點擊「載入未封裝項目」
5. 選擇 `grindmeter` 資料夾
6. 完成！🎉

### 步驟 3：驗證安裝
- 工具列應該出現 🛑 圖示
- 點擊圖示測試 Popup 功能
- 前往 [Shopee](https://shopee.tw) 測試 Badge 顯示

## 設定建議

### 首次使用
1. 點擊擴充功能圖示
2. 選擇「⚙️ 完整設定」
3. 設定您的時薪
4. 新增熟悉的日常物件（咖啡、便當等）
5. 調整顯示偏好

### 推薦設定
- **時薪**: 根據您的實際收入設定
- **顯示工時**: 建議開啟，直觀了解工作時間成本
- **顯示物件**: 建議開啟 2-3 個熟悉物件
- **日常物件**:
  - 咖啡 NT$120
  - 珍奶 NT$65  
  - 便當 NT$100
  - 早餐 NT$80

## 故障排除

### Badge 沒有顯示
1. 確認您在支援的網站：
   - Shopee (shopee.tw)
   - momo購物網 (momoshop.com.tw)
   - 誠品線上 (eslite.com)
   - 博客來 (books.com.tw)
   - Pinkoi (pinkoi.com)

2. 檢查擴充功能狀態：
   - 前往 `chrome://extensions/`
   - 確認 StopWalletCry 已啟用
   - 檢查是否有錯誤訊息

3. 重新載入頁面或重新啟動擴充功能

### 設定無法儲存
- 確認 Chrome 允許擴充功能存取本地儲存
- 嘗試關閉其他擴充功能避免衝突
- 重新安裝擴充功能

## 支援的網站

| 網站 | 狀態 | 功能 |
|------|------|------|
| 🛍️ Shopee | ✅ 完整支援 | 商品頁、列表、SKU切換 |
| 🛒 momo購物網 | ✅ 完整支援 | 商品頁、搜尋結果 |
| 📚 誠品線上 | ✅ 完整支援 | 書籍、生活用品 |
| 📖 博客來 | ✅ 完整支援 | 書籍、電子書 |
| 🎨 Pinkoi | ✅ 完整支援 | 設計商品（僅NT$） |

## 進階設定

### 開發者模式
如果您想修改功能或新增網站支援：

1. **修改計算邏輯**（需要 Python）：
```bash
cd python
pip install transcrypt
./build.sh  # Linux/Mac
build.bat   # Windows
```

2. **新增網站支援**：
   - 編輯 `content/sites/` 下的相應檔案
   - 在 `manifest.json` 添加網站權限
   - 重新載入擴充功能

### 備份與還原設定
- **匯出設定**: Options 頁面 → 匯出設定
- **匯入設定**: Options 頁面 → 匯入設定
- **重設預設**: Options 頁面 → 重設為預設值

## 隱私與安全

✅ **不收集個人資料**  
✅ **不追蹤瀏覽行為**  
✅ **設定僅存在本地**  
✅ **開源程式碼可檢視**  

## 意見反饋

遇到問題或有建議嗎？

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/stopwalletcry/issues)
- ⭐ 評價: [Chrome Web Store](https://chrome.google.com/webstore)

---

**享受更理性的購物體驗！** 🛑💰

記住：這不是要限制你的消費，而是幫你看見每次購買背後的真實代價 😊