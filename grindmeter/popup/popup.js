// [Storyteller] Popup JavaScript for StopWalletCry
// 負責快速檢視和設定切換

class PopupManager {
    constructor() {
        this.settings = {};
        this.init();
    }

    async init() {
        try {
            await this.loadSettings();
            this.renderUI();
            this.bindEvents();
            
            console.log('[Storyteller] Popup 初始化完成');
        } catch (error) {
            console.error('[Storyteller] Popup 初始化失敗:', error);
        }
    }

    /**
     * 載入設定
     */
    async loadSettings() {
        if (chrome.storage) {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(null, resolve);
            });
            
            this.settings = {
                hourlyWage: 183,
                showHours: true,
                showItems: true,
                maxItemsDisplay: 2,
                dailyItems: [],
                ...result
            };
        }
    }

    /**
     * 儲存設定
     */
    async saveSettings() {
        if (!chrome.storage) return false;

        try {
            await new Promise((resolve, reject) => {
                chrome.storage.local.set(this.settings, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });

            // 通知 content scripts 更新
            this.notifyContentScripts();
            return true;
        } catch (error) {
            console.error('[Storyteller] 儲存設定失敗:', error);
            return false;
        }
    }

    /**
     * 通知 content scripts
     */
    async notifyContentScripts() {
        if (!chrome.tabs) return;

        try {
            const tabs = await new Promise(resolve => {
                chrome.tabs.query({}, resolve);
            });

            tabs.forEach(tab => {
                if (tab.id && tab.url && this.isSupportedSite(tab.url)) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'SETTINGS_UPDATED',
                        data: this.settings
                    }).catch(() => {
                        // 忽略無法傳送的 tab
                    });
                }
            });
        } catch (error) {
            console.warn('[Storyteller] 通知 content scripts 失敗:', error);
        }
    }

    /**
     * 檢查是否為支援的網站
     */
    isSupportedSite(url) {
        const supportedDomains = [
            'shopee.tw',
            'eslite.com',
            'momoshop.com.tw',
            'books.com.tw',
            'pinkoi.com'
        ];
        
        return supportedDomains.some(domain => url.includes(domain));
    }

    /**
     * 渲染 UI
     */
    renderUI() {
        // 當前時薪
        const currentWageElement = document.getElementById('currentWage');
        if (currentWageElement) {
            currentWageElement.textContent = `NT$ ${this.settings.hourlyWage}`;
        }

        // 啟用物件數量
        const enabledItemsElement = document.getElementById('enabledItems');
        if (enabledItemsElement) {
            const enabledCount = this.settings.dailyItems.filter(item => item.enabled).length;
            enabledItemsElement.textContent = `${enabledCount} 個`;
        }

        // 切換按鈕狀態
        const hoursToggle = document.getElementById('hoursToggle');
        if (hoursToggle) {
            this.updateToggleState(hoursToggle, this.settings.showHours);
        }

        const itemsToggle = document.getElementById('itemsToggle');
        if (itemsToggle) {
            this.updateToggleState(itemsToggle, this.settings.showItems);
        }
    }

    /**
     * 更新切換按鈕狀態
     */
    updateToggleState(toggle, isActive) {
        if (isActive) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 工時顯示切換
        const hoursToggle = document.getElementById('hoursToggle');
        if (hoursToggle) {
            hoursToggle.addEventListener('click', async () => {
                this.settings.showHours = !this.settings.showHours;
                this.updateToggleState(hoursToggle, this.settings.showHours);
                await this.saveSettings();
                this.renderUI(); // 立即更新 UI
            });
        }

        // 物件顯示切換
        const itemsToggle = document.getElementById('itemsToggle');
        if (itemsToggle) {
            itemsToggle.addEventListener('click', async () => {
                this.settings.showItems = !this.settings.showItems;
                this.updateToggleState(itemsToggle, this.settings.showItems);
                await this.saveSettings();
                this.renderUI(); // 立即更新 UI
            });
        }

        // 開啟完整設定頁面
        const openOptionsBtn = document.getElementById('openOptionsBtn');
        if (openOptionsBtn) {
            openOptionsBtn.addEventListener('click', () => {
                if (chrome.runtime && chrome.runtime.openOptionsPage) {
                    chrome.runtime.openOptionsPage();
                } else {
                    // 備用方案
                    chrome.tabs.create({
                        url: chrome.runtime.getURL('options/options.html')
                    });
                }
                window.close();
            });
        }

        // 重新載入頁面
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.refreshCurrentPage();
                window.close();
            });
        }
    }

    /**
     * 重新載入當前頁面的 badges
     */
    async refreshCurrentPage() {
        if (!chrome.tabs) return;

        try {
            const [currentTab] = await new Promise(resolve => {
                chrome.tabs.query({ active: true, currentWindow: true }, resolve);
            });

            if (currentTab && currentTab.id && this.isSupportedSite(currentTab.url)) {
                chrome.tabs.sendMessage(currentTab.id, {
                    type: 'REFRESH_BADGES'
                }).catch(() => {
                    // 如果無法發送訊息，嘗試重新載入頁面
                    chrome.tabs.reload(currentTab.id);
                });
            }
        } catch (error) {
            console.warn('[Storyteller] 重新載入當前頁面失敗:', error);
        }
    }

    /**
     * 獲取當前頁面狀態
     */
    async getCurrentPageStatus() {
        if (!chrome.tabs) return null;

        try {
            const [currentTab] = await new Promise(resolve => {
                chrome.tabs.query({ active: true, currentWindow: true }, resolve);
            });

            if (currentTab && this.isSupportedSite(currentTab.url)) {
                return {
                    isSupported: true,
                    url: currentTab.url,
                    title: currentTab.title,
                    siteName: this.getSiteName(currentTab.url)
                };
            }

            return {
                isSupported: false,
                url: currentTab?.url || '',
                title: currentTab?.title || ''
            };
        } catch (error) {
            console.warn('[Storyteller] 獲取當前頁面狀態失敗:', error);
            return null;
        }
    }

    /**
     * 根據 URL 獲取網站名稱
     */
    getSiteName(url) {
        const siteMap = {
            'shopee.tw': 'Shopee 蝦皮購物',
            'eslite.com': '誠品線上',
            'momoshop.com.tw': 'momo購物網',
            'books.com.tw': '博客來',
            'pinkoi.com': 'Pinkoi'
        };

        for (const [domain, name] of Object.entries(siteMap)) {
            if (url.includes(domain)) {
                return name;
            }
        }

        return '未知網站';
    }

    /**
     * 顯示當前頁面資訊
     */
    async showCurrentPageInfo() {
        const status = await this.getCurrentPageStatus();
        
        if (status) {
            const container = document.querySelector('.container');
            if (container && !status.isSupported) {
                // 如果當前頁面不支援，顯示提示
                const notice = document.createElement('div');
                notice.style.cssText = `
                    background: rgba(255,255,255,0.15);
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    text-align: center;
                    font-size: 0.9em;
                `;
                notice.textContent = '當前頁面不在支援清單中';
                container.insertBefore(notice, container.firstChild.nextSibling);
            } else if (status.isSupported) {
                // 顯示當前網站名稱
                const header = document.querySelector('.header p');
                if (header) {
                    header.textContent = `目前在 ${status.siteName}`;
                }
            }
        }
    }
}

// 等待 DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', async () => {
    const popupManager = new PopupManager();
    await popupManager.showCurrentPageInfo();
});