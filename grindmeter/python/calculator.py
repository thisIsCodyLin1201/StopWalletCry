# [Hacker] Core calculation logic for StopWalletCry
# 使用 Transcrypt 轉換為 JavaScript

class GrindCalculator:
    """
    核心換算計算器
    計算價格對應的工時和日常物件數量
    """
    
    def __init__(self):
        self.hourly_wage = 183  # 預設時薪
        self.daily_items = [
            {"id": "coffee", "name": "咖啡", "price": 120, "enabled": True},
            {"id": "bubble_tea", "name": "珍奶", "price": 65, "enabled": True},
            {"id": "lunch", "name": "便當", "price": 100, "enabled": True}
        ]
        
    def calculate_hours(self, price):
        """
        計算需要工作多少小時
        
        Args:
            price (float): 商品價格
            
        Returns:
            float: 工作小時數，四捨五入到小數點後1位
        """
        if not price or price <= 0 or not self.hourly_wage or self.hourly_wage <= 0:
            return 0.0
            
        hours = price / self.hourly_wage
        
        # 四捨五入到小數點後1位
        rounded_hours = round(hours, 1)
        
        # 如果小於0.1，顯示0.1
        return max(0.1, rounded_hours)
    
    def calculate_items(self, price, enabled_items=None):
        """
        計算等同於多少個日常物件
        
        Args:
            price (float): 商品價格
            enabled_items (list): 啟用的物件清單，如果為 None 則使用預設
            
        Returns:
            list: 物件換算結果清單 [{"name": "咖啡", "quantity": 2.3}, ...]
        """
        if not price or price <= 0:
            return []
            
        items_to_use = enabled_items if enabled_items is not None else self.daily_items
        results = []
        
        for item in items_to_use:
            if not item.get("enabled", True):
                continue
                
            item_price = item.get("price", 0)
            if item_price <= 0:
                continue
                
            quantity = price / item_price
            rounded_quantity = round(quantity, 1)
            
            # 如果小於0.1，顯示0.1
            final_quantity = max(0.1, rounded_quantity)
            
            results.append({
                "name": item.get("name", "未知物件"),
                "quantity": final_quantity,
                "order": item.get("order", 999)
            })
        
        # 根據 order 排序
        results.sort(key=lambda x: x["order"])
        return results
    
    def format_hours_text(self, hours):
        """
        格式化工時顯示文字
        
        Args:
            hours (float): 工時數
            
        Returns:
            str: 格式化後的文字
        """
        if hours <= 0:
            return ""
            
        if hours == 1.0:
            return "1 小時"
        elif hours < 1.0:
            return f"{hours} 小時"
        else:
            return f"{hours} 小時"
    
    def format_items_text(self, items_result, max_display=2):
        """
        格式化物件顯示文字
        
        Args:
            items_result (list): 物件換算結果
            max_display (int): 最多顯示幾個物件
            
        Returns:
            str: 格式化後的文字
        """
        if not items_result:
            return ""
            
        # 取前 max_display 個
        display_items = items_result[:max_display]
        
        formatted_parts = []
        for item in display_items:
            quantity = item["quantity"]
            name = item["name"]
            
            if quantity == 1.0:
                formatted_parts.append(f"1 {name}")
            else:
                formatted_parts.append(f"{quantity} {name}")
        
        return " · ".join(formatted_parts)
    
    def generate_badge_text(self, price, settings=None):
        """
        生成完整的 badge 顯示文字
        
        Args:
            price (float): 商品價格
            settings (dict): 使用者設定
            
        Returns:
            str: 完整的 badge 文字
        """
        if not price or price <= 0:
            return ""
        
        # 解析設定
        if settings:
            self.hourly_wage = settings.get("hourlyWage", 183)
            show_hours = settings.get("showHours", True)
            show_items = settings.get("showItems", True)
            max_items = settings.get("maxItemsDisplay", 2)
            daily_items = settings.get("dailyItems", self.daily_items)
        else:
            show_hours = True
            show_items = True
            max_items = 2
            daily_items = self.daily_items
        
        parts = []
        
        # 添加工時部分
        if show_hours:
            hours = self.calculate_hours(price)
            hours_text = self.format_hours_text(hours)
            if hours_text:
                parts.append(hours_text)
        
        # 添加物件部分
        if show_items and daily_items:
            items_result = self.calculate_items(price, daily_items)
            items_text = self.format_items_text(items_result, max_items)
            if items_text:
                parts.append(items_text)
        
        if not parts:
            return ""
            
        return " · ".join(parts)
    
    def update_settings(self, settings):
        """
        更新計算器設定
        
        Args:
            settings (dict): 新的設定
        """
        if settings.get("hourlyWage"):
            self.hourly_wage = float(settings["hourlyWage"])
            
        if settings.get("dailyItems"):
            self.daily_items = settings["dailyItems"]

# 為了 Transcrypt 轉換，建立全域函數
def calculate_hours(price, hourly_wage=183):
    """全域工時計算函數"""
    calculator = GrindCalculator()
    calculator.hourly_wage = hourly_wage
    return calculator.calculate_hours(price)

def calculate_items(price, daily_items=None):
    """全域物件計算函數"""
    calculator = GrindCalculator()
    return calculator.calculate_items(price, daily_items)

def generate_badge_text(price, settings=None):
    """全域 badge 文字生成函數"""
    calculator = GrindCalculator()
    return calculator.generate_badge_text(price, settings)

# Transcrypt 目標：以下程式碼會被轉換為 JavaScript
if __name__ == "__main__":
    # 測試案例
    calculator = GrindCalculator()
    
    # 測試工時計算
    test_price = 500
    hours = calculator.calculate_hours(test_price)
    print(f"NT$ {test_price} = {hours} 小時")
    
    # 測試物件計算
    items = calculator.calculate_items(test_price)
    for item in items:
        print(f"= {item['quantity']} {item['name']}")
    
    # 測試完整 badge 文字
    badge_text = calculator.generate_badge_text(test_price)
    print(f"Badge: {badge_text}")