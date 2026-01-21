#!/bin/bash

# NobodyClimb Worker 健康檢查腳本
# 用途：
# 1. 手動診斷 Worker 狀態
# 2. 設定為 cron job 保持 Worker 溫暖（建議每 5 分鐘執行一次）
# 3. CI/CD 部署後驗證
#
# 使用方式：
#   ./scripts/health-check.sh              # 檢查 production
#   ./scripts/health-check.sh preview      # 檢查 preview
#   ./scripts/health-check.sh all          # 檢查全部
#
# Cron 設定範例（每 5 分鐘保持 Worker 溫暖）：
#   */5 * * * * /path/to/scripts/health-check.sh >> /var/log/nobodyclimb-health.log 2>&1

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 端點配置
PRODUCTION_FE="https://nobodyclimb.cc/api/health"
PRODUCTION_API="https://api.nobodyclimb.cc/health"
PREVIEW_FE="https://preview.nobodyclimb.cc/api/health"
PREVIEW_API="https://api-preview.nobodyclimb.cc/health"

# 超時設定（秒）
TIMEOUT=10
# 最大重試次數
MAX_RETRIES=3

check_endpoint() {
    local name=$1
    local url=$2
    local retry_count=0
    local success=false

    echo -n "檢查 $name... "

    while (( retry_count < MAX_RETRIES )); do
        # 使用 curl 檢查端點，捕獲回應時間和狀態碼
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            --connect-timeout $TIMEOUT \
            --max-time $TIMEOUT \
            "$url" 2>/dev/null || echo -e "\n000\n0")

        # 解析回應
        body=$(echo "$response" | head -n -2)
        http_code=$(echo "$response" | tail -n 2 | head -n 1)
        time_total=$(echo "$response" | tail -n 1)

        if [ "$http_code" = "200" ]; then
            success=true
            echo -e "${GREEN}✓ OK${NC} (${time_total}s)"

            # 如果回應時間超過 2 秒，發出警告
            if (( $(echo "$time_total > 2" | bc -l 2>/dev/null || echo 0) )); then
                echo -e "  ${YELLOW}⚠ 回應時間較慢，可能是冷啟動${NC}"
            fi
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $MAX_RETRIES ]; then
                echo -e "${YELLOW}重試 $retry_count/$MAX_RETRIES...${NC}"
                sleep 2
            fi
        fi
    done

    if [ "$success" = false ]; then
        echo -e "${RED}✗ 失敗${NC} (HTTP $http_code)"
        return 1
    fi

    return 0
}

print_header() {
    echo ""
    echo "========================================"
    echo "  NobodyClimb Worker 健康檢查"
    echo "  $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================"
    echo ""
}

check_production() {
    echo "📦 Production 環境："
    check_endpoint "前端 Worker" "$PRODUCTION_FE"
    check_endpoint "API Worker" "$PRODUCTION_API"
    echo ""
}

check_preview() {
    echo "🔧 Preview 環境："
    check_endpoint "前端 Worker" "$PREVIEW_FE"
    check_endpoint "API Worker" "$PREVIEW_API"
    echo ""
}

# 主程式
print_header

case "${1:-production}" in
    production|prod)
        check_production
        ;;
    preview|prev)
        check_preview
        ;;
    all)
        check_production
        check_preview
        ;;
    *)
        echo "使用方式: $0 [production|preview|all]"
        exit 1
        ;;
esac

echo "健康檢查完成！"
echo ""
echo "💡 提示："
echo "   - 如果看到 '冷啟動' 警告，表示 Worker 剛被喚醒"
echo "   - 建議設定 cron job 每 5 分鐘執行此腳本保持 Worker 溫暖"
echo "   - 或使用 UptimeRobot 等服務監控 /api/health 端點"
