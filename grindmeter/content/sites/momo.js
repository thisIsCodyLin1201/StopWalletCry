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
        
        this.priceSelectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                Array.from(found).forEach(element => {
                    if (this.isValidPriceElement(element)) {
                        elements.add(element);
                    }
                });
            } catch (e) {
                // 忽略無效選擇器
            }
        });

        return Array.from(elements).filter(element => 
            !throttleManager.isProcessed(element)
        );
    }

    isValidPriceElement(element) {
        if (!element || throttleManager.isProcessed(element)) {
            return false;
        }

        const text = element.textContent || '';
        if (!PriceParser.mayContainPrice(text)) {
            return false;
        }

        // 排除頁首頁尾等
        const excludeSelectors = [
            '.header', '.footer', '.navigation',
            '[data-grindmeter]'
        ];

        for (const selector of excludeSelectors) {
            if (element.closest(selector)) {
                return false;
            }
        }

        return true;
    }

    insertBadge(priceElement, badge) {
        try {
            const container = this.findInsertContainer(priceElement);
            if (container) {
                badge.style.marginLeft = '6px';
                container.appendChild(badge);
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