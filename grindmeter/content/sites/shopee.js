// [Hacker] Shopee 網站適配策略
// 針對 Shopee 的價格選擇器和插入邏輯

class ShopeeStrategy {
    constructor() {
        this.name = 'Shopee';
        this.priceSelectors = [
            // 商品詳細頁面
            '.pqTWkA', // 主要價格
            '._3n5NQx', // 促銷價格
            '.OkfgOi', // 商品價格
            '.flex.items-center .text-xs\\/sp28', // 新版價格
            
            // 商品列表頁面
            '.ZEgDH9', // 列表價格
            '._1d0hmm', // 搜尋結果價格
            '.shopee-price', // 通用價格類別
            
            // 購物車頁面
            '.shopee-cart-item__price', // 購物車價格
            
            // 通用選擇器
            '[data-testid*="price"]',
            '[class*="price"]',
            'span:contains("$")',
            'div:contains("$")'
        ];
    }

    /**
     * 尋找價格元素
     */
    findPriceElements() {
        const elements = new Set(); // 使用 Set 避免重複
        
        // 嘗試所有選擇器
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

        // 如果沒找到，使用文字內容搜尋
        if (elements.size === 0) {
            this.findPricesByContent().forEach(element => elements.add(element));
        }

        return Array.from(elements).filter(element => 
            !throttleManager.isProcessed(element)
        );
    }

    /**
     * 驗證是否為有效的價格元素
     */
    isValidPriceElement(element) {
        if (!element || throttleManager.isProcessed(element)) {
            return false;
        }

        const text = element.textContent || '';
        
        // 必須包含價格內容
        if (!PriceParser.mayContainPrice(text)) {
            return false;
        }

        // 排除不需要的元素
        const excludeSelectors = [
            '.shopee-header', // 頁首
            '.shopee-footer', // 頁尾
            '.shopee-mini-cart', // 迷你購物車
            '.shopee-tooltip', // 提示框
            '[data-grindmeter]' // 已處理的元素
        ];

        for (const selector of excludeSelectors) {
            if (element.closest(selector)) {
                return false;
            }
        }

        // 檢查元素可見性
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }

        return true;
    }

    /**
     * 通過文字內容尋找價格
     */
    findPricesByContent() {
        const elements = [];
        const textNodes = this.getTextNodes(document.body);
        
        textNodes.forEach(node => {
            const text = node.textContent;
            if (PriceParser.mayContainPrice(text)) {
                const price = PriceParser.parse(text);
                if (price && price > 0) {
                    const element = node.parentElement;
                    if (element && this.isValidPriceElement(element)) {
                        elements.push(element);
                    }
                }
            }
        });

        return elements;
    }

    /**
     * 獲取所有文字節點
     */
    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // 排除腳本和樣式
                    const parent = node.parentElement;
                    if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {
                textNodes.push(node);
            }
        }

        return textNodes;
    }

    /**
     * 插入 badge
     */
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
            console.warn('[ShopeeStrategy] 插入失敗:', error);
        }
        return false;
    }

    /**
     * 尋找最佳插入目標
     */
    findBestInsertTarget(priceElement) {
        // 優先順序的容器類型
        const preferredContainers = [
            '.pqTWkA', // 價格容器
            '._3n5NQx', // 促銷價格容器
            '.flex', // Flex 容器
            '.shopee-item-basic-info', // 商品基本資訊
            '.shopee-search-item-result__item' // 搜尋結果項目
        ];

        // 嘗試找到偏好的容器
        for (const containerSelector of preferredContainers) {
            const container = priceElement.closest(containerSelector);
            if (container && this.isGoodContainer(container)) {
                return container;
            }
        }

        // 往上尋找合適的父元素
        let current = priceElement;
        let attempts = 0;
        
        while (current && current.parentElement && attempts < 5) {
            const parent = current.parentElement;
            
            if (this.isGoodContainer(parent)) {
                return parent;
            }
            
            current = parent;
            attempts++;
        }

        // 最後選擇：直接使用價格元素的父元素
        return priceElement.parentElement;
    }

    /**
     * 判斷是否為好的容器
     */
    isGoodContainer(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        const className = element.className || '';
        
        // 偏好的容器特徵
        const goodSignals = [
            style.display.includes('flex'),
            style.display.includes('inline'),
            className.includes('flex'),
            className.includes('price'),
            className.includes('info'),
            element.tagName === 'SPAN'
        ];

        // 避免的容器特徵
        const badSignals = [
            style.position === 'fixed',
            style.position === 'absolute',
            className.includes('modal'),
            className.includes('popup'),
            className.includes('dropdown'),
            element.tagName === 'BODY',
            element.tagName === 'HTML'
        ];

        const goodScore = goodSignals.filter(Boolean).length;
        const badScore = badSignals.filter(Boolean).length;

        return goodScore > badScore;
    }

    /**
     * 處理 SKU 變更（商品詳細頁面）
     */
    handleSkuChange() {
        // Shopee 的 SKU 變更通常會更新價格
        const skuObserver = new MutationObserver((mutations) => {
            let shouldRefresh = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const target = mutation.target;
                    if (target.nodeType === Node.ELEMENT_NODE) {
                        const className = target.className || '';
                        if (className.includes('price') || className.includes('amount')) {
                            shouldRefresh = true;
                        }
                    }
                }
            });

            if (shouldRefresh) {
                throttleManager.throttle('shopee-sku-change', () => {
                    // 通知主腳本刷新 badge
                    messageBus.emit('refreshBadges');
                }, 500);
            }
        });

        // 監控價格區域
        const priceContainers = document.querySelectorAll('[class*="price"], [class*="amount"]');
        priceContainers.forEach(container => {
            skuObserver.observe(container, {
                childList: true,
                subtree: true,
                characterData: true
            });
        });

        return skuObserver;
    }
}

// 註冊 Shopee 策略
if (window.location.hostname.includes('shopee.tw')) {
    window.ShopeeStrategy = ShopeeStrategy;
    
    // 初始化 SKU 變更監聽
    document.addEventListener('DOMContentLoaded', () => {
        const strategy = new ShopeeStrategy();
        strategy.handleSkuChange();
    });
}