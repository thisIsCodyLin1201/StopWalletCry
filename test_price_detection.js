// 簡單的價格檢測測試
const testCases = [
    // 應該被檢測到的價格
    { text: 'NT$ 1,299', expected: 1299, description: '標準NT$格式' },
    { text: '$599', expected: 599, description: '美元符號格式' },
    { text: '1288元', expected: 1288, description: '數字+元格式' },
    { text: '特價 850', expected: 850, description: '特價+數字' },
    { text: '售價：1299', expected: 1299, description: '售價標示' },
    { text: '999', expected: 999, description: '純數字（3位）' },
    { text: '50', expected: 50, description: '純數字（2位）' },
    
    // 應該被排除的非價格
    { text: '3個特價', expected: null, description: '數量詞+特價' },
    { text: '5星評價', expected: null, description: '評價相關' },
    { text: '50%折扣', expected: null, description: '百分比' },
    { text: '8折', expected: null, description: '折扣' },
    { text: '已售1000+', expected: null, description: '已售相關' },
    { text: '5', expected: null, description: '單一數字' },
];

console.log('=== 修正後的價格檢測測試 ===\n');

// 模擬 PriceParser.parse 函數的核心邏輯
function testParse(priceText) {
    if (!priceText || typeof priceText !== 'string') {
        return null;
    }

    const cleanText = priceText.replace(/<[^>]*>/g, '').trim();
    
    // 修正後的排除模式
    const exclusionPatterns = [
        /^[0-9]+個.*/,
        /^[0-9]+星.*/,
        /^[0-9]+%$/,
        /^[0-9]+折$/,
        /^[0-9]{1}$/,
        /^評價.*/,
        /^已售.*/,
    ];

    for (const pattern of exclusionPatterns) {
        if (pattern.test(cleanText)) {
            return null;
        }
    }
    
    const patterns = [
        /(?:NT\$|TWD|新台幣|台幣)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /\$\s*([0-9,]+(?:\.[0-9]{1,2})?)/,
        /(?:價格|售價|定價|特價|原價|現價|會員價|促銷價)[：:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/,
        /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:元|塊|圓)/,
        /^([0-9]{2,}(?:\.[0-9]{1,2})?)$/
    ];

    for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match) {
            const numberStr = match[1].replace(/,/g, '');
            const price = parseFloat(numberStr);
            
            if (!isNaN(price) && price >= 1 && price <= 1000000) {
                return Math.round(price);
            }
        }
    }

    return null;
}

testCases.forEach((testCase, index) => {
    const result = testParse(testCase.text);
    const passed = result === testCase.expected;
    const status = passed ? '✓ PASS' : '✗ FAIL';
    
    console.log(`${index + 1}. ${testCase.description}`);
    console.log(`   輸入: "${testCase.text}"`);
    console.log(`   預期: ${testCase.expected}`);
    console.log(`   結果: ${result}`);
    console.log(`   狀態: ${status}\n`);
});