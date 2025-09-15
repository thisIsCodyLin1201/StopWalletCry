// [Hacker] Throttle utilities for StopWalletCry
// 防止重複注入和提升效能

class ThrottleManager {
    constructor() {
        this.timers = new Map();
        this.processedElements = new WeakSet();
        this.observers = new Map();
    }

    /**
     * 節流函數執行
     * @param {string} key - 節流鍵值
     * @param {Function} func - 要執行的函數
     * @param {number} delay - 延遲時間（毫秒）
     */
    throttle(key, func, delay = 200) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        const timer = setTimeout(() => {
            func();
            this.timers.delete(key);
        }, delay);

        this.timers.set(key, timer);
    }

    /**
     * 防抖函數執行
     * @param {string} key - 防抖鍵值
     * @param {Function} func - 要執行的函數
     * @param {number} delay - 延遲時間（毫秒）
     */
    debounce(key, func, delay = 300) {
        this.throttle(key, func, delay);
    }

    /**
     * 標記元素已處理，避免重複注入
     * @param {Element} element - DOM 元素
     */
    markProcessed(element) {
        if (element && element.nodeType === Node.ELEMENT_NODE) {
            this.processedElements.add(element);
            element.setAttribute('data-grindmeter', '1');
        }
    }

    /**
     * 檢查元素是否已處理
     * @param {Element} element - DOM 元素
     * @returns {boolean} - 是否已處理
     */
    isProcessed(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return true;
        }
        
        // 檢查元素本身是否已處理
        if (this.processedElements.has(element) || 
            element.hasAttribute('data-grindmeter') ||
            element.hasAttribute('data-grindmeter-badge')) {
            return true;
        }

        // 檢查附近是否已有相同價格的 badge
        const parent = element.parentElement;
        if (parent) {
            const existingBadges = parent.querySelectorAll('[data-grindmeter-badge]');
            if (existingBadges.length > 0) {
                // 如果已有 badge，標記此元素為已處理
                this.markProcessed(element);
                return true;
            }
        }
        
        return false;
    }

    /**
     * 清理已處理的元素標記
     * @param {Element} container - 容器元素
     */
    cleanupProcessed(container = document.body) {
        const processedElements = container.querySelectorAll('[data-grindmeter]');
        processedElements.forEach(element => {
            // 檢查元素是否仍在 DOM 中
            if (!document.contains(element)) {
                this.processedElements.delete(element);
            }
        });
    }

    /**
     * 設置 DOM 變化監聽器
     * @param {Element} target - 監聽目標
     * @param {Function} callback - 回調函數
     * @param {Object} options - 監聽選項
     */
    observeChanges(target, callback, options = {}) {
        if (!target || this.observers.has(target)) {
            return;
        }

        const defaultOptions = {
            childList: true,
            subtree: true,
            attributes: false,
            attributeOldValue: false,
            characterData: false,
            characterDataOldValue: false
        };

        const observerOptions = { ...defaultOptions, ...options };
        
        const observer = new MutationObserver((mutations) => {
            // 節流處理變化
            this.throttle(`dom-change-${target.tagName}`, () => {
                const relevantMutations = mutations.filter(mutation => {
                    // 過濾掉我們自己的變化
                    return !Array.from(mutation.addedNodes).some(node => 
                        node.nodeType === Node.ELEMENT_NODE && 
                        (node.hasAttribute && node.hasAttribute('data-grindmeter') ||
                         node.classList && node.classList.contains('grindmeter-badge'))
                    );
                });

                if (relevantMutations.length > 0) {
                    callback(relevantMutations);
                }
            }, 150);
        });

        observer.observe(target, observerOptions);
        this.observers.set(target, observer);
    }

    /**
     * 停止監聽 DOM 變化
     * @param {Element} target - 監聽目標
     */
    stopObserving(target) {
        if (this.observers.has(target)) {
            this.observers.get(target).disconnect();
            this.observers.delete(target);
        }
    }

    /**
     * 批量處理元素，避免阻塞 UI
     * @param {Array} elements - 元素陣列
     * @param {Function} processor - 處理函數
     * @param {number} batchSize - 批次大小
     */
    async batchProcess(elements, processor, batchSize = 10) {
        for (let i = 0; i < elements.length; i += batchSize) {
            const batch = elements.slice(i, i + batchSize);
            
            // 處理當前批次
            batch.forEach(element => {
                if (!this.isProcessed(element)) {
                    try {
                        processor(element);
                        this.markProcessed(element);
                    } catch (error) {
                        console.warn('[ThrottleManager] 處理元素時發生錯誤:', error);
                    }
                }
            });

            // 讓出控制權給瀏覽器
            if (i + batchSize < elements.length) {
                await new Promise(resolve => setTimeout(resolve, 5));
            }
        }
    }

    /**
     * 清理所有計時器和監聽器
     */
    cleanup() {
        // 清理所有計時器
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();

        // 清理所有監聽器
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // 清理已處理元素集合
        this.processedElements = new WeakSet();
    }

    /**
     * 檢查頁面是否穩定（DOM 沒有頻繁變化）
     * @param {Function} callback - 穩定後的回調
     * @param {number} stableTime - 穩定時間（毫秒）
     */
    whenStable(callback, stableTime = 1000) {
        let lastChangeTime = Date.now();
        
        const observer = new MutationObserver(() => {
            lastChangeTime = Date.now();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });

        const checkStable = () => {
            const now = Date.now();
            if (now - lastChangeTime >= stableTime) {
                observer.disconnect();
                callback();
            } else {
                setTimeout(checkStable, 100);
            }
        };

        setTimeout(checkStable, 100);
    }
}

// 全域實例
const throttleManager = new ThrottleManager();

// 頁面卸載時清理
window.addEventListener('beforeunload', () => {
    throttleManager.cleanup();
});

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThrottleManager, throttleManager };
} else {
    window.ThrottleManager = ThrottleManager;
    window.throttleManager = throttleManager;
}