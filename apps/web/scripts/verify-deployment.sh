#!/bin/bash

# 部署驗證腳本
set -e

echo "🔍 驗證 NobodyClimb 部署狀態..."
echo ""

# 1. DNS 檢查
echo "1️⃣ 檢查 DNS 配置:"
echo "   - storage.nobodyclimb.cc:"
nslookup storage.nobodyclimb.cc 2>&1 | grep -E "Address:|Name:" | tail -2 || echo "     ❌ DNS 解析失敗"
echo ""

# 2. API 連接測試
echo "2️⃣ 測試 API 連接:"
echo "   - Backend API:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.nobodyclimb.cc/api/v1/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "     ✅ API 連接正常 (HTTP $HTTP_CODE)"
else
    echo "     ⚠️  API 連接異常 (HTTP $HTTP_CODE)"
fi
echo ""

# 3. R2 Storage 測試
echo "3️⃣ 測試 R2 Storage:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://storage.nobodyclimb.cc/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "     ✅ R2 Storage 連接正常 (HTTP $HTTP_CODE)"
else
    echo "     ❌ R2 Storage 連接失敗 (HTTP $HTTP_CODE)"
fi
echo ""

# 4. Frontend 測試
echo "4️⃣ 測試 Frontend:"
echo "   - 主站 (nobodyclimb.cc):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://nobodyclimb.cc/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "     ✅ 主站正常 (HTTP $HTTP_CODE)"
else
    echo "     ❌ 主站異常 (HTTP $HTTP_CODE)"
fi

echo "   - www (www.nobodyclimb.cc):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://www.nobodyclimb.cc/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "     ✅ WWW 正常 (HTTP $HTTP_CODE)"
else
    echo "     ❌ WWW 異常 (HTTP $HTTP_CODE)"
fi
echo ""

# 5. 檢查環境變量
echo "5️⃣ 最新部署資訊:"
wrangler deployments list --env production 2>&1 | head -5
echo ""

echo "✅ 驗證完成！"
echo ""
echo "📝 接下來的步驟:"
echo "   1. 清除瀏覽器快取 (Cmd+Shift+R)"
echo "   2. 前往 https://www.nobodyclimb.cc/gallery"
echo "   3. 檢查 Console 是否還有錯誤"
echo "   4. 確認圖片能正常載入"
