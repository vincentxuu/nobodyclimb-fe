# NobodyClimb AI Agent 整合計劃

> 基於 Cloudflare AI 技術棧，為 NobodyClimb 建構「攀岩路線 RAG 問答系統」

## 專案概述

本計劃利用 Cloudflare 的 AI 服務生態系統，為 NobodyClimb 平台新增智慧問答功能。使用者可以用自然語言詢問攀岩相關問題，系統會根據平台現有資料（岩場、路線、影片等）提供精準回答。

### 核心功能

- **語義搜尋**: 使用向量相似度搜尋，找出最相關的攀岩資料
- **智慧問答**: 結合 LLM 生成自然語言回答
- **多資料來源**: 整合岩場、路線、YouTube 影片等資料
- **可觀測性**: 透過 AI Gateway 監控使用情況

## 現有資源

| 資源類型 | 數量 | 說明 |
|---------|------|------|
| 岩場 (Crags) | 5 | 台灣主要戶外攀岩場地 |
| 路線 (Routes) | 946 | 各難度等級的攀岩路線 |
| YouTube 影片 | 9,582 | 攀岩教學與紀錄影片 |
| 攀岩館 (Gyms) | 多家 | 室內攀岩館資訊 |

## 技術架構

```
┌─────────────────────────────────────────────────────────────┐
│                      使用者介面                              │
│                   (Next.js ChatWidget)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hono Backend (Workers)                    │
│                     POST /api/v1/ai/ask                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Workers AI  │  │  Vectorize  │  │     D1      │
    │ (Embed+LLM) │  │ (向量搜尋)   │  │ (原文儲存)   │
    └─────────────┘  └─────────────┘  └─────────────┘
              │
              ▼
    ┌─────────────┐
    │ AI Gateway  │
    │   (監控)    │
    └─────────────┘
```

## 文件目錄

| 文件 | 說明 |
|------|------|
| [ai-agent-cloudflare.docx.md](./ai-agent-cloudflare.docx.md) | **主文件：實作計畫總覽** |
| [01-architecture.md](./01-architecture.md) | 系統架構設計 |
| [02-infrastructure.md](./02-infrastructure.md) | 基礎設施設定 |
| [03-backend-implementation.md](./03-backend-implementation.md) | 後端實作細節 |
| [04-frontend-integration.md](./04-frontend-integration.md) | 前端整合細節 |
| [05-admin-dashboard.md](./05-admin-dashboard.md) | Admin 管理介面設計 |

## 實作階段

### Phase 1: 基礎設施
- 設定 Workers AI、Vectorize bindings
- 建立資料庫 schema
- 建立 Vectorize 索引

### Phase 2: 索引 Pipeline
- 實作 Embedding 服務
- 建立資料索引流程
- 批次處理現有資料

### Phase 3: 查詢 Pipeline
- 實作 RAG 查詢端點
- 建立快取機制
- 新增回饋收集

### Phase 4: 前端整合
- 建立 ChatWidget 元件
- 整合 API 客戶端
- 優化使用者體驗

### Phase 5: Admin 管理介面
- Dashboard 總覽與監控
- 知識庫管理（資料來源、索引控制）
- Prompt 模板管理與版本控制
- 工具管理
- 日誌與分析報表

## 成本估算

全部在 Cloudflare 免費額度內：

| 服務 | 免費額度 | 預估使用量 |
|------|---------|-----------|
| Workers AI | 10,000 Neurons/日 | ~3,500/日 |
| Vectorize | 5 索引，各 200K 向量 | 1 索引，~11K 向量 |
| D1 | 5GB 儲存 | ~100MB |
| AI Gateway | 100K 日誌/月 | ~50K/月 |

**預估月費: $0** (初期使用量)

## 相關連結

- [Cloudflare Workers AI 文件](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Vectorize 文件](https://developers.cloudflare.com/vectorize/)
- [Cloudflare AI Gateway 文件](https://developers.cloudflare.com/ai-gateway/)
