// [Architect] 此檔案由 Python calculator.py 邏輯轉換而來
// 如果有 Transcrypt，請使用 python/build.bat 自動生成

class GrindCalculator {
    constructor() {
        this.hourlyWage = 183; // 預設時薪
        this.dailyItems = [
            { id: "coffee", name: "咖啡", price: 120, enabled: true, order: 0 },
            { id: "bubble_tea", name: "珍奶", price: 65, enabled: true, order: 1 },
            { id: "lunch", name: "便當", price: 100, enabled: true, order: 2 }
        ];
    }

    /**
     * 計算需要工作多少小時
     * @param {number} price - 商品價格
     * @returns {number} 工作小時數，四捨五入到小數點後1位
     */
    calculateHours(price) {
        if (!price || price <= 0 || !this.hourlyWage || this.hourlyWage <= 0) {
            return 0.0;
        }

        const hours = price / this.hourlyWage;
        const roundedHours = Math.round(hours * 10) / 10; // 四捨五入到小數點後1位

        // 如果小於0.1，顯示0.1
        return Math.max(0.1, roundedHours);
    }

    /**
     * 計算等同於多少個日常物件
     * @param {number} price - 商品價格
     * @param {Array} enabledItems - 啟用的物件清單
     * @returns {Array} 物件換算結果清單
     */
    calculateItems(price, enabledItems = null) {
        if (!price || price <= 0) {
            return [];
        }

        const itemsToUse = enabledItems !== null ? enabledItems : this.dailyItems;
        const results = [];

        for (const item of itemsToUse) {
            if (!item.enabled) {
                continue;
            }

            const itemPrice = item.price || 0;
            if (itemPrice <= 0) {
                continue;
            }

            const quantity = price / itemPrice;
            const roundedQuantity = Math.round(quantity * 10) / 10;

            // 如果小於0.1，顯示0.1
            const finalQuantity = Math.max(0.1, roundedQuantity);

            results.push({
                name: item.name || "未知物件",
                quantity: finalQuantity,
                order: item.order || 999
            });
        }

        // 根據 order 排序
        results.sort((a, b) => a.order - b.order);
        return results;
    }

    /**
     * 格式化工時顯示文字
     * @param {number} hours - 工時數
     * @returns {string} 格式化後的文字
     */
    formatHoursText(hours) {
        if (hours <= 0) {
            return "";
        }

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

    /**
     * 格式化物件顯示文字
     * @param {Array} itemsResult - 物件換算結果
     * @param {number} maxDisplay - 最多顯示幾個物件
     * @returns {string} 格式化後的文字
     */
    formatItemsText(itemsResult, maxDisplay = 2) {
        if (!itemsResult || itemsResult.length === 0) {
            return "";
        }

        // 取前 maxDisplay 個
        const displayItems = itemsResult.slice(0, maxDisplay);
        const formattedParts = [];

        for (const item of displayItems) {
            const quantity = item.quantity;
            const name = item.name;

            if (quantity === 1.0) {
                formattedParts.push(`1 ${name}`);
            } else {
                formattedParts.push(`${quantity} ${name}`);
            }
        }

        return formattedParts.join(" · ");
    }

    /**
     * 生成完整的 badge 顯示文字
     * @param {number} price - 商品價格
     * @param {Object} settings - 使用者設定
     * @returns {string} 完整的 badge 文字
     */
    generateBadgeText(price, settings = null) {
        if (!price || price <= 0) {
            return "";
        }

        // 解析設定
        if (settings) {
            this.hourlyWage = settings.hourlyWage || 183;
            const showHours = settings.showHours !== false; // 預設顯示
            const showItems = settings.showItems !== false; // 預設顯示
            const maxItems = settings.maxItemsDisplay || 2;
            const dailyItems = settings.dailyItems || this.dailyItems;

            const parts = [];

            // 添加工時部分
            if (showHours) {
                const hours = this.calculateHours(price);
                const hoursText = this.formatHoursText(hours);
                if (hoursText) {
                    parts.push(hoursText);
                }
            }

            // 添加物件部分
            if (showItems && dailyItems) {
                const itemsResult = this.calculateItems(price, dailyItems);
                const itemsText = this.formatItemsText(itemsResult, maxItems);
                if (itemsText) {
                    parts.push(itemsText);
                }
            }

            return parts.length > 0 ? parts.join(" · ") : "";
        } else {
            // 使用預設設定
            const parts = [];
            
            const hours = this.calculateHours(price);
            const hoursText = this.formatHoursText(hours);
            if (hoursText) {
                parts.push(hoursText);
            }

            const itemsResult = this.calculateItems(price);
            const itemsText = this.formatItemsText(itemsResult, 2);
            if (itemsText) {
                parts.push(itemsText);
            }

            return parts.length > 0 ? parts.join(" · ") : "";
        }
    }

    /**
     * 更新計算器設定
     * @param {Object} settings - 新的設定
     */
    updateSettings(settings) {
        if (settings.hourlyWage) {
            this.hourlyWage = parseFloat(settings.hourlyWage);
        }

        if (settings.dailyItems) {
            this.dailyItems = settings.dailyItems;
        }
    }
}

// 全域函數（相容 Transcrypt 版本）
function calculateHours(price, hourlyWage = 183) {
    const calculator = new GrindCalculator();
    calculator.hourlyWage = hourlyWage;
    return calculator.calculateHours(price);
}

function calculateItems(price, dailyItems = null) {
    const calculator = new GrindCalculator();
    return calculator.calculateItems(price, dailyItems);
}

function generateBadgeText(price, settings = null) {
    const calculator = new GrindCalculator();
    return calculator.generateBadgeText(price, settings);
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        GrindCalculator, 
        calculateHours, 
        calculateItems, 
        generateBadgeText 
    };
} else {
    window.GrindCalculator = GrindCalculator;
    window.calculateHours = calculateHours;
    window.calculateItems = calculateItems;
    window.generateBadgeText = generateBadgeText;
}