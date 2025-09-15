// [Hacker] Main content script for StopWalletCry
// 負責在購物網站注入價格換算 badge

class StopWalletCry {
    constructor() {
        this.settings = null;
        this.calculator = new GrindCalculator();
        this.currentSiteStrategy = null;
        this.initialized = false;
        
        this.init();
    }

    /**
     * 初始化
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // 等待設定載入
            this.settings = await messageBus.waitForSettings();
            this.calculator.updateSettings(this.settings);
            
            // 識別當前網站並載入對應策略
            this.currentSiteStrategy = this.detectSiteStrategy();
            
            if (this.currentSiteStrategy) {
                console.log('[Hacker] 檢測到網站:', this.currentSiteStrategy.name);
                
                // 監聽設定變化
                messageBus.on('settingsUpdated', (newSettings) => {
                    this.settings = newSettings;
                    this.calculator.updateSettings(newSettings);
                    this.refreshAllBadges();
                });

                // 監聽手動刷新
                messageBus.on('refreshBadges', () => {
                    this.refreshAllBadges();
                });

                // 開始處理頁面
                this.startProcessing();
                this.initialized = true;
            } else {
                console.log('[Hacker] 當前網站不在支援列表中');
            }
        } catch (error) {
            console.error('[Hacker] 初始化失敗:', error);
        }
    }

    /**
     * 檢測當前網站並返回對應策略
     */
    detectSiteStrategy() {
        const hostname = window.location.hostname.toLowerCase();
        const strategies = {
            'shopee.tw': window.ShopeeStrategy,
            'www.eslite.com': window.EsliteStrategy,
            'www.momoshop.com.tw': window.MomoStrategy,
            'www.books.com.tw': window.BooksStrategy,
            'www.pinkoi.com': window.PinkoiStrategy
        };

        for (const [domain, StrategyClass] of Object.entries(strategies)) {
            if (hostname.includes(domain) && StrategyClass) {
                return new StrategyClass();
            }
        }

        return null;
    }

    /**
     * 開始處理頁面
     */
    startProcessing() {
        // 等待頁面穩定後開始處理
        throttleManager.whenStable(() => {
            this.processCurrentPage();
            this.setupPageMonitoring();
        }, 500);
    }

    /**
     * 處理當前頁面
     */
    async processCurrentPage() {
        if (!this.currentSiteStrategy) return;

        try {
            const priceElements = this.currentSiteStrategy.findPriceElements();
            
            if (priceElements.length > 0) {
                console.log(`[Hacker] 找到 ${priceElements.length} 個價格元素`);
                
                // 批量處理，避免阻塞 UI
                await throttleManager.batchProcess(priceElements, (element) => {
                    this.processPriceElement(element);
                }, 5);
            }
        } catch (error) {
            console.error('[Hacker] 處理頁面時發生錯誤:', error);
        }
    }

    /**
     * 處理單個價格元素
     */
    processPriceElement(element) {
        if (!element || throttleManager.isProcessed(element)) {
            return;
        }

        try {
            // 解析價格
            const price = PriceParser.parseFromElement(element);
            if (!price || price <= 0) {
                return;
            }

            // 生成 badge 文字
            const badgeText = this.calculator.generateBadgeText(price, this.settings);
            if (!badgeText) {
                return;
            }

            // 建立並插入 badge
            const badge = this.createBadge(badgeText, price);
            const insertResult = this.currentSiteStrategy.insertBadge(element, badge);

            if (insertResult) {
                throttleManager.markProcessed(element);
                console.log(`[Hacker] 成功插入 badge: ${badgeText} (NT$ ${price})`);
            }
        } catch (error) {
            console.warn('[Hacker] 處理價格元素時發生錯誤:', error);
        }
    }

    /**
     * 建立 badge 元素
     */
    createBadge(text, price) {
        const badge = document.createElement('span');
        badge.className = 'grindmeter-badge animate';
        badge.textContent = `= ${text}`;
        badge.setAttribute('data-price', price);
        badge.setAttribute('data-grindmeter-badge', '1');
        
        // 添加點擊事件（可擴展功能）
        badge.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleBadgeClick(badge, price);
        });

        // 添加懸浮效果
        badge.addEventListener('mouseenter', () => {
            badge.style.opacity = '1';
        });

        badge.addEventListener('mouseleave', () => {
            badge.style.opacity = '0.9';
        });

        return badge;
    }

    /**
     * 處理 badge 點擊事件
     */
    handleBadgeClick(badge, price) {
        // 可以在這裡添加點擊功能，例如顯示詳細換算
        const detailText = this.generateDetailText(price);
        
        // 臨時顯示詳細資訊
        const originalText = badge.textContent;
        badge.textContent = detailText;
        badge.style.background = 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)';
        
        setTimeout(() => {
            badge.textContent = originalText;
            badge.style.background = '';
        }, 2000);
    }

    /**
     * 生成詳細換算文字
     */
    generateDetailText(price) {
        const hours = this.calculator.calculateHours(price);
        const items = this.calculator.calculateItems(price, this.settings?.dailyItems);
        
        const parts = [`${hours}h`];
        items.slice(0, 3).forEach(item => {
            parts.push(`${item.quantity}${item.name}`);
        });
        
        return parts.join(' · ');
    }

    /**
     * 設置頁面監控
     */
    setupPageMonitoring() {
        if (!this.currentSiteStrategy) return;

        // 監控 DOM 變化
        throttleManager.observeChanges(document.body, () => {
            throttleManager.throttle('page-update', () => {
                this.processCurrentPage();
            }, 300);
        });

        // 監控 URL 變化（SPA 應用）
        let lastUrl = location.href;
        new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                throttleManager.throttle('url-change', () => {
                    this.handleUrlChange();
                }, 500);
            }
        }).observe(document, { subtree: true, childList: true });

        // 監控滾動（懶加載）
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                throttleManager.throttle('scroll-update', () => {
                    this.processCurrentPage();
                }, 200);
            }, 100);
        }, { passive: true });
    }

    /**
     * 處理 URL 變化
     */
    handleUrlChange() {
        console.log('[Hacker] 檢測到 URL 變化，重新處理頁面');
        
        // 清理舊的標記
        throttleManager.cleanupProcessed();
        
        // 重新處理頁面
        throttleManager.whenStable(() => {
            this.processCurrentPage();
        }, 800);
    }

    /**
     * 刷新所有 badge
     */
    refreshAllBadges() {
        console.log('[Hacker] 刷新所有 badge');
        
        // 移除現有的 badge
        const existingBadges = document.querySelectorAll('.grindmeter-badge');
        existingBadges.forEach(badge => badge.remove());
        
        // 清理處理標記
        const processedElements = document.querySelectorAll('[data-grindmeter]');
        processedElements.forEach(element => {
            element.removeAttribute('data-grindmeter');
            throttleManager.processedElements?.delete?.(element);
        });
        
        // 重新處理頁面
        setTimeout(() => {
            this.processCurrentPage();
        }, 100);
    }

    /**
     * 清理資源
     */
    cleanup() {
        throttleManager.cleanup();
        messageBus.off('settingsUpdated');
        messageBus.off('refreshBadges');
    }
}

// 預設網站策略（如果沒有專門的策略）
class DefaultSiteStrategy {
    constructor() {
        this.name = 'Default';
    }

    findPriceElements() {
        // 基本價格選擇器
        const selectors = [
            '[class*="price"]',
            '[class*="cost"]',
            '[class*="amount"]',
            '[id*="price"]',
            'span:contains("NT$")',
            'span:contains("$")',
            'div:contains("NT$")',
            'div:contains("$")'
        ];

        const elements = [];
        selectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                elements.push(...Array.from(found));
            } catch (e) {
                // 忽略無效選擇器
            }
        });

        // 過濾出真正包含價格的元素
        return elements.filter(element => {
            const text = element.textContent || '';
            return PriceParser.mayContainPrice(text) && !throttleManager.isProcessed(element);
        });
    }

    insertBadge(priceElement, badge) {
        try {
            // 找到合適的插入位置
            const insertTarget = this.findInsertTarget(priceElement);
            if (insertTarget) {
                insertTarget.appendChild(badge);
                return true;
            }
        } catch (error) {
            console.warn('[DefaultStrategy] 插入 badge 失敗:', error);
        }
        return false;
    }

    findInsertTarget(priceElement) {
        // 嘗試找到合適的父元素
        let current = priceElement;
        let attempts = 0;
        
        while (current && current.parentElement && attempts < 5) {
            const parent = current.parentElement;
            
            // 檢查父元素是否適合插入
            if (this.isSuitableContainer(parent)) {
                return parent;
            }
            
            current = parent;
            attempts++;
        }
        
        return priceElement.parentElement || priceElement;
    }

    isSuitableContainer(element) {
        const style = window.getComputedStyle(element);
        const display = style.display;
        
        // 偏好 flex 或 inline 容器
        return display.includes('flex') || 
               display.includes('inline') || 
               element.tagName.toLowerCase() === 'span';
    }
}

// 等待 DOM 載入完成後初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new StopWalletCry();
    });
} else {
    new StopWalletCry();
}

// 導出類別供站點策略使用
window.StopWalletCry = StopWalletCry;
window.DefaultSiteStrategy = DefaultSiteStrategy;