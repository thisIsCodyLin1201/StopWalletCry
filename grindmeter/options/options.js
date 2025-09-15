// [Storyteller] Options page JavaScript for StopWalletCry
// 負責設定頁面的 CRUD 功能和使用者互動

class OptionsManager {
    constructor() {
        this.settings = {};
        this.currentItemId = 0;
        this.init();
    }

    async init() {
        try {
            // 載入設定
            await this.loadSettings();
            
            // 綁定事件
            this.bindEvents();
            
            // 渲染 UI
            this.renderSettings();
            this.renderItems();
            
            console.log('[Storyteller] Options 頁面初始化完成');
        } catch (error) {
            console.error('[Storyteller] 初始化失敗:', error);
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
                dailyItems: [
                    { id: 'coffee', name: '咖啡', price: 120, enabled: true, order: 0 },
                    { id: 'bubble_tea', name: '珍奶', price: 65, enabled: true, order: 1 },
                    { id: 'lunch', name: '便當', price: 100, enabled: true, order: 2 },
                    { id: 'breakfast', name: '早餐', price: 80, enabled: false, order: 3 }
                ],
                ...result
            };
        }
        
        // 設定當前 item ID
        if (this.settings.dailyItems && this.settings.dailyItems.length > 0) {
            this.currentItemId = Math.max(...this.settings.dailyItems.map(item => 
                parseInt(item.id.replace(/\D/g, '')) || 0
            )) + 1;
        }
    }

    /**
     * 儲存設定
     */
    async saveSettings() {
        if (!chrome.storage) {
            console.warn('[Storyteller] Chrome storage 不可用');
            return false;
        }

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

            // 通知其他頁面設定已更新
            if (chrome.tabs) {
                chrome.tabs.query({}, (tabs) => {
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
                });
            }

            this.showSaveNotice();
            return true;
        } catch (error) {
            console.error('[Storyteller] 儲存設定失敗:', error);
            return false;
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
     * 綁定事件
     */
    bindEvents() {
        // 時薪輸入
        const hourlyWageInput = document.getElementById('hourlyWage');
        if (hourlyWageInput) {
            hourlyWageInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (value > 0) {
                    this.settings.hourlyWage = value;
                    this.autoSave();
                }
            });
        }

        // 顯示設定切換
        const showHoursToggle = document.getElementById('showHoursToggle');
        if (showHoursToggle) {
            showHoursToggle.addEventListener('click', () => {
                this.settings.showHours = !this.settings.showHours;
                this.updateToggleState(showHoursToggle, this.settings.showHours);
                this.autoSave();
            });
        }

        const showItemsToggle = document.getElementById('showItemsToggle');
        if (showItemsToggle) {
            showItemsToggle.addEventListener('click', () => {
                this.settings.showItems = !this.settings.showItems;
                this.updateToggleState(showItemsToggle, this.settings.showItems);
                this.autoSave();
            });
        }

        // 最大顯示數量
        const maxItemsInput = document.getElementById('maxItems');
        if (maxItemsInput) {
            maxItemsInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 5) {
                    this.settings.maxItemsDisplay = value;
                    this.autoSave();
                }
            });
        }

        // 新增物件按鈕
        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                this.addNewItem();
            });
        }

        // 儲存按鈕
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // 監聽來自其他頁面的設定變更
        if (chrome.storage) {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local') {
                    this.handleExternalSettingsChange(changes);
                }
            });
        }
    }

    /**
     * 處理來自外部的設定變更
     */
    handleExternalSettingsChange(changes) {
        let shouldUpdate = false;
        
        for (const [key, change] of Object.entries(changes)) {
            if (['hourlyWage', 'showHours', 'showItems', 'maxItemsDisplay', 'dailyItems'].includes(key)) {
                this.settings[key] = change.newValue;
                shouldUpdate = true;
            }
        }

        if (shouldUpdate) {
            this.renderSettings();
            this.renderItems();
        }
    }

    /**
     * 自動儲存（延遲 500ms 避免頻繁儲存）
     */
    autoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveSettings();
        }, 500);
    }

    /**
     * 渲染設定 UI
     */
    renderSettings() {
        // 時薪
        const hourlyWageInput = document.getElementById('hourlyWage');
        if (hourlyWageInput) {
            hourlyWageInput.value = this.settings.hourlyWage;
        }

        // 顯示設定
        const showHoursToggle = document.getElementById('showHoursToggle');
        if (showHoursToggle) {
            this.updateToggleState(showHoursToggle, this.settings.showHours);
        }

        const showItemsToggle = document.getElementById('showItemsToggle');
        if (showItemsToggle) {
            this.updateToggleState(showItemsToggle, this.settings.showItems);
        }

        // 最大顯示數量
        const maxItemsInput = document.getElementById('maxItems');
        if (maxItemsInput) {
            maxItemsInput.value = this.settings.maxItemsDisplay;
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
     * 渲染物件列表
     */
    renderItems() {
        const itemsList = document.getElementById('itemsList');
        if (!itemsList) return;

        itemsList.innerHTML = '';

        // 按 order 排序
        const sortedItems = [...this.settings.dailyItems].sort((a, b) => 
            (a.order || 0) - (b.order || 0)
        );

        sortedItems.forEach(item => {
            const itemRow = this.createItemRow(item);
            itemsList.appendChild(itemRow);
        });
    }

    /**
     * 建立物件行 UI
     */
    createItemRow(item) {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.setAttribute('data-item-id', item.id);

        row.innerHTML = `
            <div class="toggle ${item.enabled ? 'active' : ''}" data-field="enabled"></div>
            <input type="text" value="${item.name}" data-field="name" placeholder="物件名稱">
            <span>NT$</span>
            <input type="number" value="${item.price}" data-field="price" min="1" placeholder="價格">
            <button class="btn btn-danger" data-action="delete">刪除</button>
        `;

        // 綁定事件
        this.bindItemEvents(row, item);

        return row;
    }

    /**
     * 綁定物件行事件
     */
    bindItemEvents(row, item) {
        // 啟用/停用切換
        const toggle = row.querySelector('[data-field="enabled"]');
        toggle.addEventListener('click', () => {
            item.enabled = !item.enabled;
            this.updateToggleState(toggle, item.enabled);
        });

        // 名稱輸入
        const nameInput = row.querySelector('[data-field="name"]');
        nameInput.addEventListener('input', (e) => {
            item.name = e.target.value;
        });

        // 價格輸入
        const priceInput = row.querySelector('[data-field="price"]');
        priceInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (value > 0) {
                item.price = value;
            }
        });

        // 刪除按鈕
        const deleteBtn = row.querySelector('[data-action="delete"]');
        deleteBtn.addEventListener('click', () => {
            this.deleteItem(item.id);
        });
    }

    /**
     * 新增物件
     */
    addNewItem() {
        const newItem = {
            id: `item_${this.currentItemId++}`,
            name: '新物件',
            price: 100,
            enabled: true,
            order: this.settings.dailyItems.length
        };

        this.settings.dailyItems.push(newItem);
        this.renderItems();

        // 自動聚焦到新物件的名稱輸入框
        setTimeout(() => {
            const newRow = document.querySelector(`[data-item-id="${newItem.id}"]`);
            if (newRow) {
                const nameInput = newRow.querySelector('[data-field="name"]');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }
        }, 100);
    }

    /**
     * 刪除物件
     */
    deleteItem(itemId) {
        if (confirm('確定要刪除這個物件嗎？')) {
            this.settings.dailyItems = this.settings.dailyItems.filter(
                item => item.id !== itemId
            );
            this.renderItems();
        }
    }

    /**
     * 顯示儲存通知
     */
    showSaveNotice() {
        const notice = document.getElementById('saveNotice');
        if (notice) {
            notice.classList.add('show');
            setTimeout(() => {
                notice.classList.remove('show');
            }, 2000);
        }
    }

    /**
     * 重設為預設值
     */
    resetToDefaults() {
        if (confirm('確定要重設所有設定為預設值嗎？這個動作無法復原。')) {
            this.settings = {
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
            
            this.renderSettings();
            this.renderItems();
            this.saveSettings();
        }
    }

    /**
     * 匯出設定
     */
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'stopwalletcry-settings.json';
        link.click();
    }

    /**
     * 匯入設定
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedSettings = JSON.parse(e.target.result);
                        
                        // 驗證設定格式
                        if (this.validateSettings(importedSettings)) {
                            this.settings = importedSettings;
                            this.renderSettings();
                            this.renderItems();
                            this.saveSettings();
                            alert('設定匯入成功！');
                        } else {
                            alert('設定檔案格式不正確！');
                        }
                    } catch (error) {
                        alert('讀取設定檔案失敗！');
                        console.error('匯入設定錯誤:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    /**
     * 驗證設定格式
     */
    validateSettings(settings) {
        return settings &&
               typeof settings.hourlyWage === 'number' &&
               typeof settings.showHours === 'boolean' &&
               typeof settings.showItems === 'boolean' &&
               typeof settings.maxItemsDisplay === 'number' &&
               Array.isArray(settings.dailyItems);
    }
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});