# YouTube 多頻道資料收集系統規劃

## 專案概述

本文件規劃了一個可擴展的 YouTube 多頻道資料收集系統，能夠自動化收集、處理和分析多個 YouTube 頻道的影片資訊。

## 系統架構

### 1. 頻道配置管理

#### 頻道清單配置文件
```yaml
# channels.yaml
channels:
  - name: "Mellow Climbing"
    url: "https://www.youtube.com/@mellowclimbing"
    id: "UC5jRwTUqG15l-BcqQHbVFtA"
    category: "攀岩"
    priority: "high"
    update_frequency: "daily"
    
  - name: "Magnus Midtbø"
    url: "https://www.youtube.com/@MagnusMidtbo"
    id: "UCmQMYS2mZpULWVoaRvDZeZQ"
    category: "攀岩"
    priority: "medium"
    update_frequency: "weekly"
    
  - name: "Wide Boyz"
    url: "https://www.youtube.com/@wideboyz"
    id: "UCVXkYBLa6sLFTOLV4w8SH0g"
    category: "攀岩"
    priority: "medium"
    update_frequency: "weekly"
```

#### 頻道分類系統
```yaml
categories:
  - name: "攀岩"
    channels: ["mellowclimbing", "MagnusMidtbo", "wideboyz"]
    description: "專業攀岩頻道"
  
  - name: "戶外運動"
    channels: ["outdoorchannel1", "outdoorchannel2"]
    description: "戶外運動相關頻道"
```

### 2. 資料收集架構

#### 方案一：基於 yt-dlp 的批量收集系統

```python
# multi_channel_collector.py
import yaml
import json
import subprocess
import asyncio
from datetime import datetime
import os
from pathlib import Path

class MultiChannelCollector:
    def __init__(self, config_file="channels.yaml"):
        self.config = self.load_config(config_file)
        self.data_dir = Path("data")
        self.reports_dir = Path("reports")
        self.ensure_directories()
    
    def collect_all_channels(self, parallel=True):
        """收集所有頻道資料"""
        if parallel:
            return asyncio.run(self.collect_parallel())
        else:
            return self.collect_sequential()
    
    async def collect_parallel(self):
        """平行處理多個頻道"""
        tasks = []
        for channel in self.config['channels']:
            task = asyncio.create_task(self.collect_channel(channel))
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results
    
    def collect_channel(self, channel_info):
        """收集單一頻道資料"""
        channel_name = channel_info['name'].replace(" ", "_").lower()
        output_file = self.data_dir / f"{channel_name}_videos.json"
        
        cmd = [
            'yt-dlp',
            '--flat-playlist',
            '--dump-json',
            channel_info['url'] + '/videos',
            '--output', str(output_file)
        ]
        
        # 執行命令並處理結果
        # ... 詳細實作
```

#### 方案二：YouTube Data API 批量系統

```python
# api_batch_collector.py
class YouTubeAPIBatchCollector:
    def __init__(self, api_key, channels_config):
        self.api_key = api_key
        self.youtube = build('youtube', 'v3', developerKey=api_key)
        self.channels = channels_config
        self.quota_manager = APIQuotaManager()
    
    def collect_all_channels(self):
        """批量收集所有頻道資料"""
        results = {}
        
        for channel in self.channels:
            try:
                # 檢查配額限制
                if not self.quota_manager.can_make_request():
                    self.schedule_later(channel)
                    continue
                
                # 收集頻道資料
                channel_data = self.collect_channel_data(channel)
                results[channel['name']] = channel_data
                
                # 更新配額使用量
                self.quota_manager.update_usage(channel_data['requests_used'])
                
            except Exception as e:
                self.handle_error(channel, e)
        
        return results
```

### 3. 資料處理和分析

#### 統一資料格式
```python
# data_processor.py
class DataProcessor:
    def normalize_data(self, raw_data, source_type):
        """將不同來源的資料標準化"""
        normalized = {
            'channel_info': self.extract_channel_info(raw_data),
            'videos': self.extract_video_list(raw_data),
            'metadata': {
                'collected_at': datetime.now().isoformat(),
                'source': source_type,
                'version': '1.0'
            }
        }
        return normalized
    
    def merge_channel_data(self, channels_data):
        """合併多個頻道的資料"""
        merged = {
            'total_channels': len(channels_data),
            'total_videos': sum(len(ch['videos']) for ch in channels_data.values()),
            'channels': channels_data,
            'summary': self.generate_summary(channels_data)
        }
        return merged
```

#### 自動化分析報告
```python
# report_generator.py
class MultiChannelReportGenerator:
    def generate_comparative_report(self, channels_data):
        """生成頻道比較報告"""
        report_sections = [
            self.channel_overview_comparison(),
            self.performance_metrics_comparison(),
            self.content_analysis(),
            self.trend_analysis(),
            self.growth_analysis()
        ]
        
        return self.compile_report(report_sections)
    
    def generate_category_report(self, category):
        """按分類生成報告"""
        category_channels = self.get_channels_by_category(category)
        return self.generate_comparative_report(category_channels)
```

### 4. 資料儲存策略

#### 文件組織結構
```
data/
├── raw/                    # 原始資料
│   ├── mellow_climbing/
│   │   ├── 2025-08-19_videos.json
│   │   ├── 2025-08-18_videos.json
│   │   └── metadata.json
│   ├── magnus_midtbo/
│   └── wide_boyz/
├── processed/              # 處理後資料
│   ├── normalized/
│   │   ├── mellow_climbing.json
│   │   ├── magnus_midtbo.json
│   │   └── wide_boyz.json
│   └── merged/
│       ├── climbing_channels.json
│       └── all_channels.json
└── reports/                # 報告
    ├── daily/
    ├── weekly/
    └── comparative/
```

#### 資料庫選項
```yaml
# database_options.yaml
options:
  local_files:
    pros: ["簡單", "不需要額外設定", "易於備份"]
    cons: ["查詢速度慢", "不支援複雜查詢", "不適合大量資料"]
    
  sqlite:
    pros: ["輕量級", "支援 SQL", "零配置"]
    cons: ["單用戶", "並發限制"]
    schema: "schemas/sqlite_schema.sql"
    
  postgresql:
    pros: ["功能完整", "支援並發", "擴展性好"]
    cons: ["需要服務器", "設定複雜"]
    schema: "schemas/postgres_schema.sql"
```

### 5. 自動化工作流程

#### Cron 作業配置
```bash
# crontab_config.sh
#!/bin/bash

# 每日收集高優先級頻道
0 6 * * * /usr/local/bin/python3 /path/to/collect_priority_channels.py --priority=high

# 每週收集中優先級頻道
0 6 * * 0 /usr/local/bin/python3 /path/to/collect_priority_channels.py --priority=medium

# 每月收集低優先級頻道
0 6 1 * * /usr/local/bin/python3 /path/to/collect_priority_channels.py --priority=low

# 每日生成報告
0 8 * * * /usr/local/bin/python3 /path/to/generate_daily_report.py

# 每週清理舊資料
0 2 * * 0 /usr/local/bin/python3 /path/to/cleanup_old_data.py
```

#### GitHub Actions 工作流程
```yaml
# .github/workflows/youtube_data_collection.yml
name: YouTube Data Collection

on:
  schedule:
    - cron: '0 6 * * *'  # 每日 6AM
  workflow_dispatch:      # 手動觸發

jobs:
  collect-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          sudo apt-get install yt-dlp
      
      - name: Collect channel data
        run: python collect_all_channels.py
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
      
      - name: Generate reports
        run: python generate_reports.py
      
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/ reports/
          git commit -m "Auto-update: $(date)" || exit 0
          git push
```

### 6. 監控和通知系統

#### 錯誤處理和通知
```python
# monitoring.py
class MonitoringSystem:
    def __init__(self):
        self.slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
        self.email_config = self.load_email_config()
    
    def check_collection_status(self):
        """檢查資料收集狀態"""
        failed_channels = []
        outdated_channels = []
        
        for channel in self.get_all_channels():
            if not self.is_recently_updated(channel):
                outdated_channels.append(channel)
            if self.has_collection_errors(channel):
                failed_channels.append(channel)
        
        if failed_channels or outdated_channels:
            self.send_alert(failed_channels, outdated_channels)
    
    def send_alert(self, failed, outdated):
        """發送警報通知"""
        message = self.format_alert_message(failed, outdated)
        
        # Slack 通知
        self.send_slack_message(message)
        
        # Email 通知
        self.send_email_alert(message)
```

### 7. 配置和部署

#### 環境配置
```bash
# setup.sh
#!/bin/bash

# 建立專案結構
mkdir -p data/{raw,processed,backup}
mkdir -p reports/{daily,weekly,monthly,comparative}
mkdir -p logs
mkdir -p config

# 安裝依賴
pip install -r requirements.txt

# 安裝 yt-dlp
if command -v brew &> /dev/null; then
    brew install yt-dlp
else
    pip install yt-dlp
fi

# 設定環境變數
cp .env.example .env
echo "請編輯 .env 檔案，設定 YouTube API 金鑰和其他配置"
```

#### Docker 容器化
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# 安裝 yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# 安裝 Python 依賴
COPY requirements.txt .
RUN pip install -r requirements.txt

# 複製應用程式
COPY . .

# 建立資料目錄
RUN mkdir -p data reports logs

CMD ["python", "main.py"]
```

### 8. 擴展功能

#### 進階分析功能
- **趨勢分析**: 追蹤頻道成長趨勢
- **內容分析**: 分析影片標題、描述的關鍵字
- **競爭分析**: 比較同類型頻道的表現
- **ROI 分析**: 分析影片投入產出比

#### API 服務
```python
# api_server.py
from flask import Flask, jsonify
from flask_restful import Api, Resource

class ChannelDataAPI(Resource):
    def get(self, channel_name):
        """獲取指定頻道資料"""
        data = self.load_channel_data(channel_name)
        return jsonify(data)

class ComparisonAPI(Resource):
    def post(self):
        """比較多個頻道"""
        channels = request.json.get('channels', [])
        comparison = self.generate_comparison(channels)
        return jsonify(comparison)
```

### 9. 安全和隱私考量

#### 資料保護
- API 金鑰加密儲存
- 限制資料存取權限
- 定期資料備份
- 符合 YouTube ToS

#### 頻率限制
- 遵守 YouTube API 配額限制
- 實施智能重試機制
- 避免過度頻繁請求

### 10. 成本估算

#### YouTube Data API 成本
```
每日配額: 10,000 units
- 頻道資訊: 1 unit
- 影片列表 (50部): 1 unit  
- 影片詳情 (50部): 1 unit

估算:
- 10個頻道，每個平均100部影片
- 每日更新: ~30 units
- 每月成本: 免費範圍內
```

#### 基礎設施成本
- VPS (2GB RAM): $10/月
- 儲存空間: ~1GB/月
- 總成本: ~$15/月

### 11. 實施時程

#### Phase 1 (第1-2週)
- [ ] 建立基礎架構
- [ ] 實作單一頻道收集器
- [ ] 設計資料格式

#### Phase 2 (第3-4週)  
- [ ] 實作多頻道批量收集
- [ ] 建立報告生成系統
- [ ] 設定自動化工作流程

#### Phase 3 (第5-6週)
- [ ] 實作監控和通知
- [ ] 新增進階分析功能
- [ ] 部署到生產環境

#### Phase 4 (第7-8週)
- [ ] 優化效能
- [ ] 新增 API 介面
- [ ] 完善文件

### 12. 維護指南

#### 日常維護任務
- 檢查收集狀態
- 監控錯誤日誌  
- 更新頻道清單
- 備份重要資料

#### 故障排除
```bash
# 常見問題診斷腳本
./scripts/diagnose.sh

# 修復工具
./scripts/repair_data.sh
./scripts/reset_failed_channels.sh
```

## 總結

這個多頻道資料收集系統提供了完整的解決方案，從資料收集、處理、分析到報告生成都有完整的規劃。系統具有良好的擴展性和維護性，可以根據需要調整規模和功能。

透過自動化和監控機制，可以確保資料收集的穩定性和及時性，為後續的分析和決策提供可靠的資料基礎。