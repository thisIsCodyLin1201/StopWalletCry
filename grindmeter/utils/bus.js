// [Architect] Message bus for StopWalletCry
// 負責各模組間的訊息傳遞和設定同步

class MessageBus {
    constructor() {
        this.listeners = new Map();
        this.settings = null;
        this.settingsLoaded = false;
        this.initializeMessageHandling();
    }

    /**
     * 初始化訊息處理
     */
    initializeMessageHandling() {
        // 監聽來自 background script 的訊息
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sender, sendResponse);
                return true; // 保持訊息通道開啟
            });
        }

        // 監聽 storage 變化
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local') {
                    this.handleStorageChange(changes);
                }
            });
        }
    }

    /**
     * 處理接收到的訊息
     * @param {Object} message - 訊息物件
     * @param {Object} sender - 發送者資訊
     * @param {Function} sendResponse - 回應函數
     */
    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'SETTINGS_UPDATED':
                this.loadSettings().then(() => {
                    this.emit('settingsUpdated', this.settings);
                    sendResponse({ success: true });
                });
                break;

            case 'REFRESH_BADGES':
                this.emit('refreshBadges');
                sendResponse({ success: true });
                break;

            case 'GET_CURRENT_SETTINGS':
                sendResponse({ settings: this.settings });
                break;

            default:
                this.emit(message.type, message.data);
                sendResponse({ success: true });
        }
    }

    /**
     * 處理 storage 變化
     * @param {Object} changes - 變化物件
     */
    handleStorageChange(changes) {
        let hasRelevantChanges = false;
        const updatedSettings = { ...this.settings };

        for (const [key, change] of Object.entries(changes)) {
            if (['hourlyWage', 'showHours', 'showItems', 'maxItemsDisplay', 'dailyItems'].includes(key)) {
                updatedSettings[key] = change.newValue;
                hasRelevantChanges = true;
            }
        }

        if (hasRelevantChanges) {
            this.settings = updatedSettings;
            this.emit('settingsUpdated', this.settings);
        }
    }

    /**
     * 載入設定
     * @returns {Promise<Object>} - 設定物件
     */
    async loadSettings() {
        if (!chrome.storage) {
            console.warn('[MessageBus] Chrome storage API 不可用');
            return this.getDefaultSettings();
        }

        try {
            const result = await new Promise((resolve) => {
                chrome.storage.local.get(null, resolve);
            });

            // 如果沒有設定，使用預設值
            if (Object.keys(result).length === 0) {
                const defaultSettings = this.getDefaultSettings();
                await this.saveSettings(defaultSettings);
                this.settings = defaultSettings;
            } else {
                this.settings = { ...this.getDefaultSettings(), ...result };
            }

            this.settingsLoaded = true;
            return this.settings;
        } catch (error) {
            console.error('[MessageBus] 載入設定失敗:', error);
            this.settings = this.getDefaultSettings();
            return this.settings;
        }
    }

    /**
     * 儲存設定
     * @param {Object} settings - 設定物件
     * @returns {Promise<boolean>} - 是否成功
     */
    async saveSettings(settings) {
        if (!chrome.storage) {
            console.warn('[MessageBus] Chrome storage API 不可用');
            return false;
        }

        try {
            await new Promise((resolve, reject) => {
                chrome.storage.local.set(settings, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });

            this.settings = { ...this.settings, ...settings };
            return true;
        } catch (error) {
            console.error('[MessageBus] 儲存設定失敗:', error);
            return false;
        }
    }

    /**
     * 獲取預設設定
     * @returns {Object} - 預設設定
     */
    getDefaultSettings() {
        return {
            hourlyWage: 183,
            showHours: true,
            showItems: true,
            maxItemsDisplay: 2,
            dailyItems: [
                { id: 'coffee', name: '咖啡', price: 120, enabled: true, order: 0 },
                { id: 'bubble_tea', name: '珍奶', price: 65, enabled: true, order: 1 },
                { id: 'lunch', name: '便當', price: 100, enabled: true, order: 2 },
                { id: 'breakfast', name: '早餐', price: 80, enabled: false, order: 3 }
            ]
        };
    }

    /**
     * 監聽事件
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * 移除事件監聽
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 觸發事件
     * @param {string} event - 事件名稱
     * @param {*} data - 事件資料
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[MessageBus] 事件 ${event} 的回調執行失敗:`, error);
                }
            });
        }
    }

    /**
     * 發送訊息到 background script
     * @param {Object} message - 訊息物件
     * @returns {Promise<*>} - 回應資料
     */
    async sendToBackground(message) {
        if (!chrome.runtime) {
            console.warn('[MessageBus] Chrome runtime API 不可用');
            return null;
        }

        try {
            return await new Promise((resolve) => {
                chrome.runtime.sendMessage(message, resolve);
            });
        } catch (error) {
            console.error('[MessageBus] 發送訊息失敗:', error);
            return null;
        }
    }

    /**
     * 通知設定已更新
     */
    async notifySettingsUpdated() {
        this.emit('settingsUpdated', this.settings);
        
        // 也通知其他 tabs
        if (chrome.tabs) {
            try {
                const tabs = await new Promise(resolve => {
                    chrome.tabs.query({}, resolve);
                });

                tabs.forEach(tab => {
                    if (tab.id && tab.url && (
                        tab.url.includes('shopee.tw') ||
                        tab.url.includes('eslite.com') ||
                        tab.url.includes('momoshop.com.tw') ||
                        tab.url.includes('books.com.tw') ||
                        tab.url.includes('pinkoi.com')
                    )) {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'SETTINGS_UPDATED',
                            data: this.settings
                        }).catch(() => {
                            // 忽略無法傳送的 tab
                        });
                    }
                });
            } catch (error) {
                console.warn('[MessageBus] 通知其他 tabs 失敗:', error);
            }
        }
    }

    /**
     * 等待設定載入完成
     * @returns {Promise<Object>} - 設定物件
     */
    async waitForSettings() {
        if (this.settingsLoaded) {
            return this.settings;
        }

        return this.loadSettings();
    }
}

// 全域實例
const messageBus = new MessageBus();

// 自動載入設定
if (typeof chrome !== 'undefined' && chrome.storage) {
    messageBus.loadSettings().catch(console.error);
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessageBus, messageBus };
} else {
    window.MessageBus = MessageBus;
    window.messageBus = messageBus;
}