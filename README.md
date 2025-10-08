[README.md](https://github.com/user-attachments/files/22757100/README.md)
# 🛑 StopWalletCry

> 看見價格背後的真實代價

一個 Chrome 擴充功能，讓你在購物時看見價格背後需要多少工時，以及等同於多少杯咖啡、便當等日常物件。

## ✨ 特色功能

- 🕐 **工時換算** - 顯示需要工作多少小時才能買到
- ☕ **日常物件比較** - 用咖啡、珍奶、便當等熟悉單位來理解價格
- 🎯 **支援主要購物網站** - Shopee、momo、誠品、博客來、Pinkoi
- ⚡ **即時顯示** - 在商品價格旁自動顯示換算結果
- 🎛️ **自訂設定** - 調整時薪、管理日常物件清單

## 🚀 安裝方式

### 開發版本（本地安裝）

1. 下載或 clone 此專案
2. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇 `grindmeter` 資料夾
6. 完成安裝！

### Python 依賴（開發者）

如果你想修改計算邏輯，需要安裝 Transcrypt：

```bash
pip install transcrypt
```

然後執行轉換腳本：

```bash
cd python
./build.sh  # Linux/Mac
# 或 build.bat (Windows)
```

## 📖 使用方式

1. **首次使用**：安裝後會自動設定預設值（時薪 NT$183）
2. **瀏覽購物網站**：支援的網站會自動在價格旁顯示換算結果
3. **調整設定**：
   - 點擊擴充功能圖示 → 快速設定
   - 右鍵擴充功能圖示 → 選項 → 完整設定頁面
4. **自訂物件**：在設定頁面新增你熟悉的日常物件和價格

## 🎯 支援網站

- [x] **Shopee** - 蝦皮購物
- [x] **momo購物網** - 富邦momo
- [x] **誠品線上** - 書籍與生活用品
- [x] **博客來** - 書籍與文具
- [x] **Pinkoi** - 設計商品

## 🛠️ 技術架構

### BMAD Method（團隊角色）

- **🏗️ Architect** - 設計架構與 Transcrypt 流程
- **⚡ Hacker** - 實作核心功能與網站適配
- **🔍 Reviewer** - 跨站測試與 edge cases
- **📝 Storyteller** - 文案設計與使用體驗

### 核心技術

- **Manifest V3** - 最新的 Chrome 擴充功能標準
- **Python + Transcrypt** - 計算邏輯用 Python 寫，自動轉換為 JavaScript
- **Content Scripts** - 注入網頁進行價格解析
- **Chrome Storage** - 保存使用者設定

### 檔案結構

```
grindmeter/
├── manifest.json          # 擴充功能設定
├── background/             # 背景腳本
├── content/               # 內容腳本
│   └── sites/            # 各網站適配策略
├── options/              # 設定頁面
├── popup/                # 快速設定彈窗
├── styles/               # 樣式檔案
├── python/               # Python 計算邏輯
├── utils/                # 工具函數
└── assets/               # 圖示資源
```

## 🎨 設計理念

### 輕鬆有趣，不給壓力

- 使用溫和的顏色和友善的文案
- 不是嚴肅的理財工具，而是「醒一下」的提醒
- 讓使用者會心一笑，而非感到壓力

### 貼近生活體驗

- 不只工時計算，更提供日常物件換算
- 可自訂熟悉的物件（咖啡、手搖飲、便當等）
- 換算結果一目瞭然，直觀易懂

## 🔧 開發指南

### 新增網站支援

1. 在 `content/sites/` 建立新的 `.js` 檔案
2. 實作價格選擇器邏輯
3. 在 `manifest.json` 加入網站權限
4. 在 `content.js` 註冊新站點

### 修改計算邏輯

1. 編輯 `python/calculator.py`
2. 執行 `python/build.sh` 轉換為 JavaScript
3. 生成的 `utils/calculator.js` 會自動更新

### 測試

- 各站點至少測試 10 個商品
- 驗證 SKU 切換、懶加載等情境
- 檢查設定變更能否即時更新

## 📝 版本紀錄

### v1.0.0 (MVP)
- ✅ 基本工時與物件換算
- ✅ 支援 5 大購物網站
- ✅ 完整設定頁面
- ✅ 即時更新機制

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### Commit 訊息格式
- `[Architect]` - 架構相關修改
- `[Hacker]` - 功能實作
- `[Reviewer]` - 測試與修正
- `[Storyteller]` - 文案與 UI

## 📄 授權

MIT License

## ☕ 支持開發

如果這個工具幫助你減少了衝動消費，歡迎請開發者喝杯咖啡！
（大概要工作 0.7 小時才能賺到一杯咖啡錢 😄）

---

**StopWalletCry** - 讓每一次消費都更有意識 🛑💰
