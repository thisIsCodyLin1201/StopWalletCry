@echo off
REM [Architect] Transcrypt build script for StopWalletCry (Windows)
REM 將 Python 計算邏輯轉換為 JavaScript

echo 🐍 [Architect] 開始轉換 Python 到 JavaScript...

REM 檢查 Transcrypt 是否安裝
transcrypt --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Transcrypt 未安裝。請執行: pip install transcrypt
    pause
    exit /b 1
)

REM 轉換 calculator.py 到 JavaScript
echo 🔄 轉換 calculator.py...

REM 使用 Transcrypt 轉換
transcrypt -b -n calculator.py

REM 檢查轉換是否成功
if exist "__target__\calculator.js" (
    echo ✅ 轉換成功！
    
    REM 移動檔案到 utils 目錄
    copy "__target__\calculator.js" "..\utils\calculator.js" >nul
    
    REM 添加註解說明這是自動生成的檔案
    echo // [Architect] 此檔案由 Transcrypt 自動生成，請勿手動修改 > "..\utils\calculator_temp.js"
    echo // 修改請編輯 python/calculator.py 然後執行 build.bat >> "..\utils\calculator_temp.js"
    echo. >> "..\utils\calculator_temp.js"
    type "..\utils\calculator.js" >> "..\utils\calculator_temp.js"
    move "..\utils\calculator_temp.js" "..\utils\calculator.js" >nul
    
    echo 📁 檔案已複製到 utils/calculator.js
    
    REM 清理暫存檔案
    if exist "__target__" rmdir /s /q "__target__"
    if exist "calculator.js" del "calculator.js"
    
    echo 🧹 清理完成
    echo 🎉 [Architect] Python 轉換完成！
) else (
    echo ❌ 轉換失敗
    pause
    exit /b 1
)

echo.
echo 按任意鍵繼續...
pause >nul