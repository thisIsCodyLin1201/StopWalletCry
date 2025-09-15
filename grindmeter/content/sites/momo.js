// [Hacker] momo購物網 適配策略

class MomoStrategy {
    constructor() {
        this.name = 'Momo';
        this.priceSelectors = [
            // 商品詳細頁面
            '.price_sale', // 售價
            '.price_original', // 原價
            '.price', // 通用價格
            '.productPrice__salePrice', // 新版售價
            '.productPrice__price', // 新版價格
            
            // 商品列表
            '.prdPrice', // 商品價格
            '.text_sale_price', // 特價
            '.listPrice', // 列表價格
            
            // 購物車
            '.bag_price', // 購物袋價格
            
            // 通用選擇器
            '[class*="price"]',
            '[class*="Price"]',
            'span:contains("$")',
            'div:contains("$")'
        ];
    }

    findPriceElements() {
        const elements = new Set();
        
        // 優先使用更精確的選擇器
        const prioritySelectors = [
            '.price_sale',
            '.productPrice__salePrice',
            '.prdPrice'
        ];
        
        // 先嘗試優先選擇器
        let foundPriority = false;
        prioritySelectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                Array.from(found).forEach(element => {
                    if (this.isValidPriceElement(element)) {
                        elements.add(element);
                        foundPriority = true;
                    }
                });
            } catch (e) {
                // 忽略無效選擇器
            }
        });
        
        // 如果優先選擇器沒找到，再用通用選擇器
        if (!foundPriority) {
            const fallbackSelectors = [
                '.price',
                '[class*="price"]:not(.price_original)',
                '[class*="Price"]'
            ];
            
            fallbackSelectors.forEach(selector => {
                try {
                    const found = document.querySelectorAll(selector);
                    Array.from(found).forEach(element => {
                        if (this.isValidPriceElement(element) && elements.size < 20) {
                            elements.add(element);
                        }
                    });
                } catch (e) {
                    // 忽略無效選擇器
                }
            });
        }

        return Array.from(elements).filter(element => 
            !throttleManager.isProcessed(element)
        );
    }

    isValidPriceElement(element) {
        if (!element || throttleManager.isProcessed(element)) {
            return false;
        }

        const text = element.textContent?.trim() || '';
        
        // 文字長度檢查（避免選中太長的文字）
        if (text.length > 30 || text.length < 2) {
            return false;
        }

        // 必須包含價格
        if (!PriceParser.mayContainPrice(text)) {
            return false;
        }

        // 排除頁首頁尾等無關區域
        const excludeSelectors = [
            '.header', '.footer', '.navigation', '.breadcrumb',
            '.sidebar', '.menu', '.toolbar', '.pagination',
            '[data-grindmeter]', '[data-grindmeter-badge]'
        ];

        for (const selector of excludeSelectors) {
            if (element.closest(selector)) {
                return false;
            }
        }

        // 排除隱藏元素
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || 
            style.opacity === '0' || element.offsetParent === null) {
            return false;
        }

        // 確保元素在可視區域內（或接近）
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            return false;
        }

        return true;
    }

    insertBadge(priceElement, badge) {
        try {
            // 檢查是否已有 badge
            const parent = priceElement.parentElement;
            if (parent && parent.querySelector('[data-grindmeter-badge]')) {
                return false;
            }

            // 設定 badge 樣式，避免重疊
            badge.style.cssText = `
                display: inline-block !important;
                margin-left: 6px !important;
                vertical-align: middle !important;
                position: relative !important;
                z-index: 999999 !important;
            `;

            // 嘗試插入到價格元素後面
            if (priceElement.nextSibling) {
                priceElement.parentNode.insertBefore(badge, priceElement.nextSibling);
                return true;
            } else {
                priceElement.parentNode.appendChild(badge);
                return true;
            }
        } catch (error) {
            console.warn('[MomoStrategy] 插入失敗:', error);
        }
        return false;
    }

    findInsertContainer(priceElement) {
        // momo 特殊的容器類別
        const momoContainers = [
            '.price_sale',
            '.productPrice',
            '.prdPrice',
            '.price'
        ];

        for (const containerClass of momoContainers) {
            const container = priceElement.closest(containerClass);
            if (container) {
                return container;
            }
        }

        return priceElement.parentElement;
    }
}

// 註冊策略
if (window.location.hostname.includes('momoshop.com.tw')) {
    window.MomoStrategy = MomoStrategy;
}