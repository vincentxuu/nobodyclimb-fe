#!/bin/bash

# 一鍵式影片資料更新腳本
# 自動收集所有 YouTube 頻道並合併到 videos.ts

set -e

echo "🚀 開始更新影片資料庫..."
echo "========================================"

# 檢查必要工具
check_requirements() {
    echo "🔍 檢查系統需求..."
    
    if ! command -v yt-dlp &> /dev/null; then
        echo "❌ yt-dlp 未安裝"
        echo "   安裝指令: brew install yt-dlp"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安裝"
        echo "   請先安裝 Node.js"
        exit 1
    fi
    
    echo "✅ 系統需求檢查完成"
}

# 頻道配置檔案
CHANNELS_CONFIG="scripts/channels.json"

# 讀取頻道配置
load_channels() {
    if [ ! -f "$CHANNELS_CONFIG" ]; then
        echo "❌ 頻道配置檔案不存在: $CHANNELS_CONFIG"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo "❌ jq 未安裝，請安裝 jq 來解析 JSON 配置"
        echo "   安裝指令: brew install jq"
        exit 1
    fi
}

# 收集單個頻道資料
collect_channel() {
    local index="$1"
    
    local url=$(jq -r ".channels[$index].url" "$CHANNELS_CONFIG")
    local name=$(jq -r ".channels[$index].name" "$CHANNELS_CONFIG")
    local display_name=$(jq -r ".channels[$index].displayName" "$CHANNELS_CONFIG")
    local channel_id=$(jq -r ".channels[$index].channelId" "$CHANNELS_CONFIG")
    local type=$(jq -r ".channels[$index].type" "$CHANNELS_CONFIG")
    local threshold=$(jq -r ".channels[$index].featuredThreshold" "$CHANNELS_CONFIG")
    
    echo ""
    echo "📺 收集頻道: $display_name"
    echo "   🔗 $url"
    
    # 呼叫通用收集腳本
    if bash scripts/collect-youtube-data.sh "$url" "$name" "$display_name" "$channel_id" "$type" "$threshold"; then
        echo "   ✅ $display_name 收集成功"
        return 0
    else
        echo "   ❌ $display_name 收集失敗"
        return 1
    fi
}

# 主要執行流程
main() {
    check_requirements
    load_channels
    
    local total=$(jq '.channels | length' "$CHANNELS_CONFIG")
    
    echo ""
    echo "📋 將收集 $total 個頻道:"
    for ((i=0; i<total; i++)); do
        local display_name=$(jq -r ".channels[$i].displayName" "$CHANNELS_CONFIG")
        echo "   - $display_name"
    done
    
    echo ""
    echo "📥 開始收集頻道資料..."
    echo "========================================"
    
    local successful=0
    
    # 收集每個頻道
    for ((i=0; i<total; i++)); do
        echo ""
        echo "[$((i+1))/$total] 處理中..."
        
        if collect_channel "$i"; then
            ((successful++))
        fi
    done
    
    echo ""
    echo "========================================"
    echo "📊 收集結果: $successful/$total 個頻道成功"
    
    # 如果至少有一個頻道成功，進行合併
    if [ $successful -gt 0 ]; then
        echo ""
        echo "🔄 合併所有頻道資料..."

        if node scripts/merge-video-sources.js; then
            echo ""
            echo "✅ 影片合併完成"

            # 生成分塊資料
            echo ""
            echo "🔄 生成分塊資料..."
            if node scripts/generate-video-chunks.js; then
                echo ""
                echo "🎉 影片資料庫更新完成！"
                echo ""
                echo "📂 檔案位置:"
                echo "   - public/data/videos.json (完整資料)"
                echo "   - public/data/videos-meta.json (元資料)"
                echo "   - public/data/featured-videos.json (精選影片)"
                echo "   - public/data/videos-chunks/ (分塊資料)"
                echo "📊 包含 $successful 個頻道的所有影片資料"
            else
                echo "❌ 分塊生成失敗"
                exit 1
            fi
        else
            echo "❌ 合併失敗"
            exit 1
        fi
    else
        echo "❌ 沒有成功收集到任何頻道資料"
        exit 1
    fi
    
    echo ""
    echo "✨ 所有作業完成！現在可以在應用程式中使用最新的影片資料。"
}

# 顯示使用說明
show_help() {
    echo "影片資料庫更新腳本"
    echo ""
    echo "用法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  -h, --help     顯示此說明"
    echo ""
    echo "功能:"
    echo "  - 自動收集多個 YouTube 頻道的影片資料"
    echo "  - 轉換為專案所需的格式"
    echo "  - 合併到統一的 videos.json 檔案"
    echo ""
    echo "頻道列表:"
    if [ -f "$CHANNELS_CONFIG" ] && command -v jq &> /dev/null; then
        local total=$(jq '.channels | length' "$CHANNELS_CONFIG" 2>/dev/null || echo "0")
        for ((i=0; i<total; i++)); do
            local display_name=$(jq -r ".channels[$i].displayName" "$CHANNELS_CONFIG" 2>/dev/null || echo "Unknown")
            local url=$(jq -r ".channels[$i].url" "$CHANNELS_CONFIG" 2>/dev/null || echo "Unknown")
            echo "  - $display_name ($url)"
        done
    else
        echo "  配置檔案未找到或 jq 未安裝"
    fi
}

# 處理命令列參數
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "❌ 未知參數: $1"
        echo "使用 $0 --help 查看說明"
        exit 1
        ;;
esac