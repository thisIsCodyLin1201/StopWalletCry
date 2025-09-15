// [Hacker] Pinkoi 適配策略

class PinkoiStrategy {
    constructor() {
        this.name = 'Pinkoi';
        this.priceSelectors = [
            // 商品詳細頁面
            '.product-price', // 商品價格
            '.price-current', // 現價
            '.price-original', // 原價
            '.sale-price', // 特價
            
            // 商品列表
            '.product-item__price', // 商品項目價格
            '.item-price', // 項目價格
            '.search-item__price', // 搜尋項目價格
            
            // 購物車
            '.cart-item__price', // 購物車項目價格
            
            // Pinkoi 特殊類別
            '[data-testid*="price"]',
            '.ProductPrice', // React 組件
            '.Price', // 價格組件
            
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

        // Pinkoi 特別處理：尋找 React 組件中的價格
        this.findReactPrices().forEach(element => elements.add(element));

        return Array.from(elements).filter(element => 
            !throttleManager.isProcessed(element)
        );
    }

    findReactPrices() {
        const elements = [];
        
        // 尋找可能包含價格的 React 組件
        const reactElements = document.querySelectorAll('[data-reactroot] *');
        
        reactElements.forEach(element => {
            const text = element.textContent || '';
            if (PriceParser.mayContainPrice(text) && this.isPriceComponent(element)) {
                elements.push(element);
            }
        });

        return elements;
    }

    isPriceComponent(element) {
        const className = element.className || '';
        const tagName = element.tagName.toLowerCase();
        
        // React 組件的價格特徵
        const priceIndicators = [
            className.toLowerCase().includes('price'),
            className.includes('Price'),
            tagName === 'span' && element.textContent.includes('NT$'),
            element.getAttribute('data-testid')?.includes('price')
        ];

        return priceIndicators.some(indicator => indicator);
    }

    isValidPriceElement(element) {
        if (!element || throttleManager.isProcessed(element)) {
            return false;
        }

        const text = element.textContent || '';
        if (!PriceParser.mayContainPrice(text)) {
            return false;
        }

        // Pinkoi 特殊排除
        const excludeSelectors = [
            '.header', '.footer', '.navigation',
            '.shipping-info', // 運費資訊
            '.designer-info', // 設計師資訊
            '.review', // 評價
            '[data-grindmeter]'
        ];

        for (const selector of excludeSelectors) {
            if (element.closest(selector)) {
                return false;
            }
        }

        // 確保只處理 NT$ 價格（Pinkoi 有多種幣別）
        const price = PriceParser.parseFromElement(element);
        if (!price) return false;

        const hasNTDollar = text.includes('NT$') || text.includes('NT ') || 
                           (!text.includes('USD') && !text.includes('$US'));
        
        return hasNTDollar;
    }

    insertBadge(priceElement, badge) {
        try {
            const container = this.findInsertContainer(priceElement);
            if (container) {
                badge.style.marginLeft = '8px';
                badge.style.display = 'inline-block';
                
                // Pinkoi 的設計較精緻，使用較小的 badge
                badge.style.fontSize = '11px';
                badge.style.padding = '3px 10px';
                
                container.appendChild(badge);
                return true;
            }
        } catch (error) {
            console.warn('[PinkoiStrategy] 插入失敗:', error);
        }
        return false;
    }

    findInsertContainer(priceElement) {
        // Pinkoi 特殊容器（通常是 React 組件）
        const pinkoiContainers = [
            '.product-price',
            '.ProductPrice',
            '.Price',
            '.price-current',
            '.item-price'
        ];

        for (const containerClass of pinkoiContainers) {
            const container = priceElement.closest(containerClass);
            if (container) {
                return container;
            }
        }

        // 嘗試找到合適的 flex 容器
        let current = priceElement;
        let attempts = 0;
        
        while (current && current.parentElement && attempts < 5) {
            const parent = current.parentElement;
            const style = window.getComputedStyle(parent);
            
            if (style.display.includes('flex') || 
                parent.className.includes('flex') ||
                parent.className.includes('product')) {
                return parent;
            }
            
            current = parent;
            attempts++;
        }

        return priceElement.parentElement;
    }

    // 處理 Pinkoi 的 SPA 路由變化
    handleRouteChange() {
        let lastUrl = location.href;
        
        const observer = new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                
                // Pinkoi 路由變化後需要重新載入
                throttleManager.throttle('pinkoi-route-change', () => {
                    messageBus.emit('refreshBadges');
                }, 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }
}

// 註冊策略
if (window.location.hostname.includes('pinkoi.com')) {
    window.PinkoiStrategy = PinkoiStrategy;
    
    // 初始化路由變化監聽
    document.addEventListener('DOMContentLoaded', () => {
        const strategy = new PinkoiStrategy();
        strategy.handleRouteChange();
    });
}