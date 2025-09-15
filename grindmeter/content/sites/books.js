// [Hacker] 博客來 適配策略

class BooksStrategy {
    constructor() {
        this.name = 'Books';
        this.priceSelectors = [
            // 商品詳細頁面
            '.price_a', // 售價
            '.price_b', // 原價
            '.set_price', // 套書價格
            '.sale_price', // 特價
            
            // 商品列表
            '.mod_b .price', // 書籍價格
            '.item .price', // 項目價格
            '.searchbook .price', // 搜尋結果價格
            
            // 購物車
            '.cart_price', // 購物車價格
            
            // 通用選擇器（博客來較多使用 NT$ 格式）
            '[class*="price"]',
            'span:contains("NT$")',
            'em:contains("NT$")',
            'strong:contains("NT$")'
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

        // 博客來特殊排除（會員價、比價等資訊）
        const excludeSelectors = [
            '.header', '.footer', '.nav',
            '.member_price', // 會員價提示
            '.compare_price', // 比價
            '.shipping_info', // 運費資訊
            '[data-grindmeter]'
        ];

        for (const selector of excludeSelectors) {
            if (element.closest(selector)) {
                return false;
            }
        }

        // 排除太小的價格元素（可能是運費等）
        const price = PriceParser.parseFromElement(element);
        if (price && price < 10) {
            return false;
        }

        return true;
    }

    insertBadge(priceElement, badge) {
        try {
            const container = this.findInsertContainer(priceElement);
            if (container) {
                badge.style.marginLeft = '6px';
                badge.style.fontSize = '12px'; // 博客來文字較小
                container.appendChild(badge);
                return true;
            }
        } catch (error) {
            console.warn('[BooksStrategy] 插入失敗:', error);
        }
        return false;
    }

    findInsertContainer(priceElement) {
        // 博客來特殊容器
        const booksContainers = [
            '.price_a',
            '.sale_price',
            '.set_price',
            '.mod_b',
            '.item'
        ];

        for (const containerClass of booksContainers) {
            const container = priceElement.closest(containerClass);
            if (container) {
                return container;
            }
        }

        // 特殊處理：如果是在 table 中，使用 td
        const tdParent = priceElement.closest('td');
        if (tdParent) {
            return tdParent;
        }

        return priceElement.parentElement;
    }
}

// 註冊策略
if (window.location.hostname.includes('books.com.tw')) {
    window.BooksStrategy = BooksStrategy;
}