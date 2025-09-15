// [Architect] Background service worker for StopWalletCry
// 負責初始化設定和監聽安裝事件

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // 初始化預設設定
    const defaultSettings = {
      hourlyWage: 183, // 預設時薪 NT$183
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
    
    try {
      await chrome.storage.local.set(defaultSettings);
      console.log('[Architect] 初始設定已保存');
    } catch (error) {
      console.error('[Architect] 初始設定保存失敗:', error);
    }
  }
});

// 監聽來自 content script 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    // 獲取當前設定
    chrome.storage.local.get(null, (settings) => {
      sendResponse(settings);
    });
    return true; // 保持訊息通道開啟
  }
});