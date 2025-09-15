#!/bin/bash
# [Architect] Transcrypt build script for StopWalletCry
# 將 Python 計算邏輯轉換為 JavaScript

echo "🐍 [Architect] 開始轉換 Python 到 JavaScript..."

# 檢查 Transcrypt 是否安裝
if ! command -v transcrypt &> /dev/null; then
    echo "❌ Transcrypt 未安裝。請執行: pip install transcrypt"
    exit 1
fi

# 轉換 calculator.py 到 JavaScript
echo "🔄 轉換 calculator.py..."

# 使用 Transcrypt 轉換
transcrypt -b -n calculator.py

# 檢查轉換是否成功
if [ -f "__target__/calculator.js" ]; then
    echo "✅ 轉換成功！"
    
    # 移動檔案到 utils 目錄
    cp "__target__/calculator.js" "../utils/calculator.js"
    
    # 添加註解說明這是自動生成的檔案
    sed -i '1i // [Architect] 此檔案由 Transcrypt 自動生成，請勿手動修改' "../utils/calculator.js"
    sed -i '2i // 修改請編輯 python/calculator.py 然後執行 build.sh' "../utils/calculator.js"
    sed -i '3i ' "../utils/calculator.js"
    
    echo "📁 檔案已複製到 utils/calculator.js"
    
    # 清理暫存檔案
    rm -rf "__target__"
    rm -f "calculator.js"
    
    echo "🧹 清理完成"
    echo "🎉 [Architect] Python 轉換完成！"
else
    echo "❌ 轉換失敗"
    exit 1
fi