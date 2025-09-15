// [Hacker] 誠品線上 適配策略

class EsliteStrategy {
    constructor() {
        this.name = 'Eslite';
        this.priceSelectors = [
            // 商品詳細頁面
            '.price', // 價格
            '.product-price', // 商品價格
            '.price-current', // 現價
            '.price-original', // 原價
            '.special-price', // 特價
            
            // 商品列表
            '.item-price', // 項目價格
            '.book-price', // 書籍價格
            '.product-item__price', // 商品項目價格
            
            // 購物車
            '.cart-price', // 購物車價格
            
            // 通用選擇器
            '[class*="price"]',
            '[class*="Price"]',
            'span:contains("NT$")',
            'div:contains("NT$")'
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

        // 誠品特殊排除
        const excludeSelectors = [
            '.header', '.footer', '.breadcrumb',
            '.store-info', // 店舖資訊
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
                badge.style.marginLeft = '8px';
                badge.style.display = 'inline-block';
                container.appendChild(badge);
                return true;
            }
        } catch (error) {
            console.warn('[EsliteStrategy] 插入失敗:', error);
        }
        return false;
    }

    findInsertContainer(priceElement) {
        // 誠品特殊容器
        const esliteContainers = [
            '.product-price',
            '.price',
            '.book-price',
            '.item-price'
        ];

        for (const containerClass of esliteContainers) {
            const container = priceElement.closest(containerClass);
            if (container) {
                return container.parentElement || container;
            }
        }

        return priceElement.parentElement;
    }
}

// 註冊策略
if (window.location.hostname.includes('eslite.com')) {
    window.EsliteStrategy = EsliteStrategy;
}