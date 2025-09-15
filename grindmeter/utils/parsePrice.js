// [Hacker] Price parsing utilities for StopWalletCry
// 負責清洗和解析各種價格格式

class PriceParser {
    /**
     * 解析價格文字，提取數字金額（簡化版本）
     * @param {string} priceText - 包含價格的文字
     * @returns {number|null} - 解析出的價格數字，失敗返回 null
     */
    static parse(priceText) {
        if (!priceText || typeof priceText !== 'string') {
            return null;
        }

        // 移除 HTML 標籤
        const cleanText = priceText.replace(/<[^>]*>/g, '').trim();
        
        // 只排除最明顯的非價格內容
        const exclusionPatterns = [
            /^[0-9]+個$/,        // 純"數字個"
            /^[0-9]+星$/,        // 純"數字星"
            /^[0-9]+%$/,         // 純百分比
            /^[0-9]+折$/,        // 純折扣
            /^[0-9]{1}$/,        // 單一數字
            /^評價/,             // 以評價開頭
            /^已售/,             // 以已售開頭
        ];

        for (const pattern of exclusionPatterns) {
            if (pattern.test(cleanText)) {
                return null;
            }
        }
        
        // 簡化的價格正則模式
        const patterns = [
            /NT\$\s*([0-9,]+)/i,     // NT$1,234
            /\$\s*([0-9,]+)/,        // $1,234
            /([0-9,]+)\s*元/,        // 1,234元
            /^([0-9,]{2,})$/         // 純數字（至少2位）
        ];

        for (const pattern of patterns) {
            const match = cleanText.match(pattern);
            if (match) {
                const numberStr = match[1].replace(/,/g, ''); // 移除千分位逗號
                const price = parseFloat(numberStr);
                
                // 合理價格範圍檢查
                if (!isNaN(price) && price >= 1 && price <= 100000) {
                    return Math.round(price);
                }
            }
        }

        return null;
    }

    /**
     * 從 DOM 元素中提取價格
     * @param {Element} element - DOM 元素
     * @returns {number|null} - 解析出的價格
     */
    static parseFromElement(element) {
        if (!element) return null;

        // 嘗試從不同屬性提取價格
        const sources = [
            element.textContent,
            element.innerText,
            element.getAttribute('data-price'),
            element.getAttribute('content'),
            element.title
        ];

        for (const source of sources) {
            if (source) {
                const price = this.parse(source);
                if (price !== null) {
                    return price;
                }
            }
        }

        return null;
    }

    /**
     * 驗證價格是否為促銷價格（相對於原價）
     * @param {number} currentPrice - 當前價格
     * @param {number} originalPrice - 原價
     * @returns {boolean} - 是否為促銷價格
     */
    static isDiscountPrice(currentPrice, originalPrice) {
        if (!currentPrice || !originalPrice) return false;
        return currentPrice < originalPrice * 0.95; // 至少 5% 折扣
    }

    /**
     * 格式化價格顯示
     * @param {number} price - 價格數字
     * @returns {string} - 格式化後的價格字串
     */
    static format(price) {
        if (!price || isNaN(price)) return 'NT$ 0';
        return `NT$ ${price.toLocaleString('zh-TW')}`;
    }

    /**
     * 檢查文字是否可能包含價格（簡化版本）
     * @param {string} text - 要檢查的文字
     * @returns {boolean} - 是否可能包含價格
     */
    static mayContainPrice(text) {
        if (!text || typeof text !== 'string') return false;
        
        const cleanText = text.trim();
        
        // 簡化排除，只排除最明顯的
        if (/^[0-9]+個$|^[0-9]+星$|^評價|^已售/.test(cleanText)) {
            return false;
        }
        
        // 檢查是否包含價格指標
        return /NT\$|\$|元|[0-9]{2,}/.test(cleanText);
    }

    /**
     * 從元素的所有子元素中尋找最佳價格
     * @param {Element} container - 容器元素
     * @returns {number|null} - 找到的最佳價格
     */
    static findBestPrice(container) {
        if (!container) return null;

        const candidates = [];
        
        // 遞迴收集所有可能的價格
        function collectPrices(element) {
            if (element.nodeType === Node.TEXT_NODE) {
                const price = PriceParser.parse(element.textContent);
                if (price !== null) {
                    candidates.push({
                        price: price,
                        element: element.parentElement,
                        confidence: PriceParser.calculateConfidence(element.parentElement)
                    });
                }
            } else if (element.nodeType === Node.ELEMENT_NODE) {
                // 檢查當前元素
                const price = PriceParser.parseFromElement(element);
                if (price !== null) {
                    candidates.push({
                        price: price,
                        element: element,
                        confidence: PriceParser.calculateConfidence(element)
                    });
                }
                
                // 遞迴檢查子元素
                for (const child of element.childNodes) {
                    collectPrices(child);
                }
            }
        }

        collectPrices(container);

        if (candidates.length === 0) return null;

        // 根據信心度排序，返回最可信的價格
        candidates.sort((a, b) => b.confidence - a.confidence);
        return candidates[0].price;
    }

    /**
     * 計算價格元素的信心度（增強版本）
     * @param {Element} element - 要評估的元素
     * @returns {number} - 信心度分數 (0-100)
     */
    static calculateConfidence(element) {
        if (!element) return 0;

        let confidence = 50; // 基礎分數

        const className = (element.className || '').toLowerCase();
        const id = (element.id || '').toLowerCase();
        const text = (element.textContent || '').toLowerCase();

        // 正面指標（提升信心度）
        const positiveKeywords = [
            'price', 'cost', 'amount', 'fee', 'total', 'money',
            '價格', '金額', '費用', '總計', '售價', '定價', '特價', '現價', '會員價'
        ];

        // 負面指標（降低信心度）
        const negativeKeywords = [
            'shipping', 'tax', 'discount', 'save', 'quantity', 'number', 'count',
            '運費', '稅', '折扣', '節省', '原價', '數量', '個數', '件數', '評價', '評分',
            '已售', '庫存', '天數', '月份', '年份', '尺寸', '容量', '重量'
        ];

        // 嚴重負面指標（調整為較溫和的懲罰）
        const severeNegativePatterns = [
            /^[0-9]+個/, /^[0-9]+星/, /^[0-9]+%$/, /^[0-9]+折$/,
            /^評價/, /^已售/, /^庫存/
        ];

        // 檢查嚴重負面模式（減少懲罰力度）
        for (const pattern of severeNegativePatterns) {
            if (pattern.test(text)) {
                confidence -= 25;  // 從 -50 調整為 -25
                break;
            }
        }

        // 檢查正面關鍵字
        positiveKeywords.forEach(keyword => {
            if (className.includes(keyword) || id.includes(keyword)) {
                confidence += 25;
            }
            if (text.includes(keyword)) {
                confidence += 15;
            }
        });

        // 檢查負面關鍵字（減少懲罰）
        negativeKeywords.forEach(keyword => {
            if (className.includes(keyword) || id.includes(keyword)) {
                confidence -= 20;  // 從 -30 調整為 -20
            }
            if (text.includes(keyword)) {
                confidence -= 10;  // 從 -20 調整為 -10
            }
        });

        // 元素標籤加分
        const tagName = element.tagName.toLowerCase();
        if (['span', 'div', 'strong', 'b'].includes(tagName)) {
            confidence += 5;
        }

        // 檢查是否有貨幣符號
        if (/NT\$|\$|元/.test(text)) {
            confidence += 20;
        }

        // 字體大小加分（假設價格通常字體較大）
        try {
            const style = window.getComputedStyle(element);
            const fontSize = parseFloat(style.fontSize);
            if (fontSize > 16) {
                confidence += 10;
            }
            if (fontSize > 20) {
                confidence += 5;
            }
        } catch (e) {
            // 如果無法取得樣式，忽略錯誤
        }

        // 檢查數字格式合理性
        const numbers = text.match(/[0-9]{2,}/g);
        if (numbers && numbers.length === 1) {
            const num = parseInt(numbers[0]);
            if (num >= 10 && num <= 100000) {
                confidence += 10;
            }
        }

        return Math.max(0, Math.min(100, confidence));
    }
}

// 導出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PriceParser;
} else {
    window.PriceParser = PriceParser;
}