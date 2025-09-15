// 簡化調試版本 - 測試基本功能
(function() {
    'use strict';
    
    console.log('[DEBUG] StopWalletCry 調試版本開始載入');
    
    // 簡單的價格檢測
    function simpleParsePrice(text) {
        if (!text) return null;
        
        const cleanText = text.replace(/[,\s]/g, '');
        
        // 最簡單的價格模式
        const patterns = [
            /NT\$\s*(\d+)/i,
            /\$\s*(\d+)/,
            /(\d+)\s*元/,
            /(\d{2,})/  // 至少兩位數字
        ];
        
        for (const pattern of patterns) {
            const match = cleanText.match(pattern);
            if (match) {
                const price = parseInt(match[1]);
                if (price > 0 && price < 100000) {
                    return price;
                }
            }
        }
        return null;
    }
    
    // 簡單的時間格式化
    function formatTime(hours) {
        const totalMinutes = Math.round(hours * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        
        if (h === 0) {
            return `${m}m`;
        } else if (m === 0) {
            return `${h}h`;
        } else {
            return `${h}h ${m}m`;
        }
    }
    
    // 創建測試 badge
    function createTestBadge(price) {
        const hourlyWage = 200; // 固定時薪 200
        const hours = price / hourlyWage;
        const timeText = formatTime(hours);
        
        const badge = document.createElement('span');
        badge.style.cssText = `
            display: inline-block !important;
            margin-left: 8px !important;
            padding: 6px 10px !important;
            background: #6c757d !important;
            color: white !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            border-radius: 4px !important;
            font-family: sans-serif !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
            z-index: 999999 !important;
        `;
        badge.textContent = `= ${timeText}`;
        badge.setAttribute('data-debug-badge', '1');
        
        return badge;
    }
    
    // 尋找並處理價格元素
    function processPage() {
        console.log('[DEBUG] 開始處理頁面');
        
        // 簡單的價格選擇器
        const selectors = [
            '[class*="price"]',
            '[class*="Price"]',
            'span:contains("NT$")',
            'span:contains("$")',
            'div:contains("元")'
        ];
        
        let found = 0;
        
        // 使用更寬泛的搜尋
        const allElements = document.querySelectorAll('*');
        Array.from(allElements).forEach(element => {
            if (element.hasAttribute('data-debug-badge')) return; // 跳過已處理的
            
            const text = element.textContent;
            if (!text || text.length > 50) return; // 跳過太長的文字
            
            const price = simpleParsePrice(text);
            if (price && price >= 10) {
                console.log('[DEBUG] 找到價格:', text, '→', price);
                
                // 檢查是否已有 badge
                const nextSibling = element.nextElementSibling;
                if (nextSibling && nextSibling.hasAttribute('data-debug-badge')) {
                    return;
                }
                
                const badge = createTestBadge(price);
                element.parentNode.insertBefore(badge, element.nextSibling);
                found++;
                
                if (found >= 20) return; // 限制數量避免過載
            }
        });
        
        console.log('[DEBUG] 處理完成，找到', found, '個價格');
    }
    
    // 延遲執行
    setTimeout(() => {
        processPage();
        
        // 監聽頁面變化
        const observer = new MutationObserver(() => {
            setTimeout(processPage, 1000);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
    }, 2000);
    
    console.log('[DEBUG] 調試版本載入完成');
})();