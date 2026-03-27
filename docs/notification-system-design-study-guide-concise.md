# 第10章：設計一個通知系統（NobodyClimb 案例）

本文件完全依照書中章節順序編排，並在各節內加入 [NobodyClimb](https://nobodyclimb.cc/) 作為範例。

## 第1步：了解問題並確定設計範圍

| 問題 | 書中典型答案 | NobodyClimb 現況 |
|------|--------------|------------------|
| 支援哪些通知類型？ | 推播（Push）、簡訊（SMS）、電子郵件（Email） | 目前以站內通知為主（已有後端 API） |
| 是否即時系統？ | 軟實時 | 軟實時（60 秒輪詢） |
| 支援哪些設備？ | iOS、Android、Desktop | Web 瀏覽器 |
| 觸發來源？ | 客戶端／伺服器排程（Client / Server Scheduling） | 用戶互動事件為主 |
| 用戶可否退訂？ | 是 | 已有通知偏好開關 |
| 每日通知量？ | 千萬級 | 小規模（數千） |

NobodyClimb 通知類型目前為 17 種，涵蓋人生清單、文章、人物誌、人物誌內容、社交、系統廣播。

第1步範圍示意圖：

```text
                      ┌──────────────────────────────┐
                      │      通知系統設計範圍         │
                      └──────────────┬───────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│ 通知類型/管道    │        │ 即時性與觸發      │        │ 規模與裝置        │
│ Push/SMS/Email   │        │ 軟實時、Client/Server │     │ iOS/Android/Web  │
└──────────────────┘        └──────────────────┘        └──────────────────┘
                                     │
                                     ▼
                            用戶偏好與退訂策略
```

## 第2步：提出高層次的設計方案並獲得認同

### 不同的通知類型

書中主軸：iOS 推播（APNS）、Android 推播（FCM）、簡訊（SMS）、電子郵件（Email）。

NobodyClimb 對照：目前是純 Web（Web-only），已有後端通知 API，投遞主體為站內通知；中期可擴展網頁推播（Web Push），後續再補電子郵件摘要（Email Digest）。

通知類型對照表：

| 類型 | 典型用途 | 延遲期待 | 成本 | NobodyClimb 建議 |
|------|----------|----------|------|------------------|
| 行動推播（APNS/FCM） | 即時提醒、互動召回 | 低延遲 | 中 | 未來若有 App 再導入 |
| 網頁推播（Web Push） | Web 用戶即時提醒 | 低延遲 | 低~中 | 中期優先導入 |
| 簡訊（SMS） | 高重要通知、驗證/交易 | 低延遲 | 高 | 僅高優先級情境採用 |
| 電子郵件（Email） | 摘要、回顧、行銷 | 可延遲 | 低 | 後期導入 Digest |
| 站內通知（In-App） | 所有互動基礎通知 | 可延遲 | 低 | 現況主力通道 |

不同通知類型示意圖：

```text
                觸發事件（Like / Comment / Follow / System）
                                   │
                                   ▼
                      通知 API（分類與路由決策）
                                   │
             ┌─────────────────────┼─────────────────────┐
             ▼                     ▼                     ▼
     即時互動（高優先）     一般互動（中優先）      摘要回顧（低優先）
             │                     │                     │
             ▼                     ▼                     ▼
   Push / Web Push / SMS         站內通知                Email Digest
```

### 聯絡人資訊收集流程

書中主軸：先收集並維護可送達端點，再談投遞。

- 註冊或首次使用蒐集 `email / phone / device token（裝置權杖）`
- 一個使用者可有多裝置（`1 user : N devices`）
- 裝置權杖（token）需可更新（換機、重裝、清除資料）

NobodyClimb 資料模型：

- `users`：email、phone
- `devices`：user_id、device_token、platform
- 發送前查「偏好設定 + 可送達端點」

### 通知發送/接收流程

書中初版流程示意圖：

```text
┌──────────────┐    ┌────────────────────┐
│  服務 1..N   │───▶│ 通知伺服器（單體）  │
└──────────────┘    │ Notification Server│
                    │ 內含：              │
                    │ - 寫資料庫/快取     │
                    │ - 組裝通知內容       │
                    │ - 直接呼叫第三方     │
                    └──────────┬─────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │ APNS / FCM   │ │ SMS Provider │ │ Email Provider│
          └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                 │                │                 │
                 └────────────────┴─────────────────┘
                                  ▼
                           使用者終端（多裝置）
```

書中初版常見問題：

1. 單點故障（SPOF）
2. 難以獨立擴展（資料庫／快取／處理邏輯耦合）
3. 高峰期效能瓶頸（渲染內容 + 等第三方回應）

書中改進版核心流程（6 步）：

1. 服務呼叫通知 API（Notification API）
2. 通知伺服器（Notification Server）查詢資料庫／快取（user/device/preference）
3. 寫入對應佇列（Queue）
4. 工作者（Worker）消費佇列（Queue）
5. 工作者（Worker）呼叫第三方通道
6. 第三方送達終端

書中改進版示意圖：

```text
┌──────────────┐    ┌────────────────────┐    ┌──────────────┐    ┌──────────────┐
│  服務 1..N   │───▶│ 通知伺服器         │───▶│ 佇列（Queue）│───▶│ Worker 集群   │
│              │    │ Notification Server│    │              │    │              │
└──────────────┘    └────────────────────┘    └──────────────┘    └──────┬───────┘
                                                                            │
                        ┌───────────────────────────────────────────────────┼──────────────────────────────────┐
                        ▼                                                   ▼                                  ▼
                 ┌──────────────┐                                  ┌──────────────┐                    ┌──────────────┐
                 │ APNS / FCM   │                                  │ SMS Provider │                    │ Email Provider│
                 └──────┬───────┘                                  └──────┬───────┘                    └──────┬───────┘
                        │                                                   │                                  │
                        └───────────────────────────────▶ 使用者終端（多裝置） ◀───────────────────────────────┘
```

NobodyClimb 現況：

`用戶操作 → 通知 API（Backend，偏好/去重/聚合）→ D1 → 前端輪詢（60 秒）`

NobodyClimb 延伸：

`用戶操作 → 通知 API（Notification API）→ 佇列（Queue）→ 工作者（Worker）→ 網頁推播／電子郵件（Web Push / Email）→ 使用者`

NobodyClimb 現況與延伸示意圖：

```text
現況（小規模）
┌──────────┐    ┌──────────────────────────┐    ┌────────────┐
│ 用戶互動 │───▶│ 通知 API（Backend，偏好/去重/聚合）│───▶│ D1 資料庫  │
└──────────┘    └──────────────────────────┘    └─────┬──────┘
                                                       │
                                                       ▼
                                                前端輪詢（60 秒）

延伸（對齊書中改進版）
┌──────────┐    ┌──────────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────────────┐
│ 用戶互動 │───▶│ 通知 API         │───▶│ Queue      │───▶│ Worker     │───▶│ Web Push / Email   │───▶ 使用者
└──────────┘    └──────────────────┘    └────────────┘    └────────────┘    └────────────────────┘
```

## 第3步：深入設計

### 可靠性

書中主軸：持久化 + 重試，避免通知遺失。

NobodyClimb 現況：D1 持久化已具備；完整通道重試機制尚未落地。

延伸建議：

- 指數退避重試
- 最大重試次數
- 死信佇列（Dead Letter Queue, DLQ）與告警

可靠性重試示意圖：

```text
通知事件
   │
   ▼
嘗試送達（Attempt 1）──失敗──▶ 重試排程（退避）
   │成功                              │
   ▼                                  ▼
已送達（Sent/Delivered）      嘗試送達（Attempt N）
                                      │
                             成功 ────┴────▶ 已送達
                                      │
                                      └──超過上限──▶ DLQ + 告警
```

### 其他元件和考量因素

- 通知模板：由分散邏輯走向 `template + variables（模板 + 變數）` 的中央管理
- 通知設定：保留 17 開關，補「一鍵全開/全關」與預設分級
- 速率限制：從按讚聚合，升級為全域上限（global cap）+ 類型上限（type cap）+ 靜音時段
- 重試機制：第三方失敗回佇列，並做失敗分類（暫時性/永久性）
- 推播安全：JWT 之外再補 API 簽章與審計
- 監視排隊通知：增加佇列深度（queue depth）、工作者延遲（worker lag）、失敗率
- 事件追蹤：從已讀擴到已送出／已送達／已開啟／已點擊／已退訂（Sent/Delivered/Opened/Clicked/Unsubscribe）

補充說明（實務常問）：

1. 冪等鍵（Idempotency Key）
同一事件重送時只建立一次通知，避免重試造成重複投遞。

2. 去重（Deduplication）vs 聚合（Aggregation）
去重是「同事件只算一次」；聚合是「多事件合併成摘要通知」。

3. 死信佇列（Dead Letter Queue, DLQ）
DLQ 是縮寫。當任務超過最大重試次數仍失敗，就移入 DLQ 以便人工或批次修復，不阻塞主佇列。

4. 重試策略（Retry Policy）
可重試：timeout、5xx、暫時性網路錯誤；不可重試：參數錯誤、權限錯誤等 4xx。

5. 服務目標（SLA / SLO）
例如高優先級通知：95% 在 10 秒內送達；一般通知：95% 在 60 秒內送達。

6. 優先級與通道映射
高優先級走 Push/SMS；中優先級走站內 + Push；低優先級走站內或 Email Digest。

7. 成本模型（Cost Model）
至少估算三段成本：API 請求、Queue 出入隊、通道費用（Push/Email/SMS）。

8. 架構升級門檻（Evolution Trigger）
當 queue depth 長期偏高、API p95 超標、失敗率升高時，再升級 Worker 數量或拆分隊列。

事件追蹤漏斗示意圖：

```text
已送出 Sent
   │
   ▼
已送達 Delivered
   │
   ▼
已開啟 Opened
   │
   ▼
已點擊 Clicked
   │
   └────────────▶ 已退訂 Unsubscribe（負向指標，需監控）
```

示意圖（其他元件和考量因素）：

```text
                           ┌──────────────────────────────┐
                           │      通知 API（入口）         │
                           └──────────────┬───────────────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     ▼                    ▼                    ▼
         ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
         │ 通知設定         │   │ 速率限制         │   │ 推播安全         │
         │ Settings         │   │ Rate Limiting    │   │ Security         │
         └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
                  │                      │                      │
                  └──────────────┬───────┴──────────────┬───────┘
                                 ▼                      ▼
                       ┌──────────────────┐    ┌──────────────────┐
                       │ 通知模板         │    │ 可靠性/重試      │
                       │ Template         │    │ Reliability/Retry│
                       └────────┬─────────┘    └────────┬─────────┘
                                │                       │
                                └───────────┬───────────┘
                                            ▼
                                   ┌──────────────────┐
                                   │ 送達事件流       │
                                   │ Delivery Flow    │
                                   └────────┬─────────┘
                                            │
                           ┌────────────────┴────────────────┐
                           ▼                                 ▼
                 ┌──────────────────┐              ┌──────────────────┐
                 │ 監視             │              │ 事件追蹤         │
                 │ Monitoring       │              │ Event Tracking   │
                 └──────────────────┘              └──────────────────┘
```

### 更新後的設計

依書中思路，NobodyClimb 的更新版可分四段落地：

1. 先優化現況（增量拉取、索引、廣播防呆）
2. 導入佇列與工作者（Queue/Worker，解耦、重試、DLQ、告警）
3. 擴展多管道（Web Push + Email Digest）
4. 建立治理（模板審核、A/B 測試、完整漏斗）

示意圖（更新後的設計）：

```text
┌──────────────┐    ┌─────────────────────┐    ┌──────────────┐    ┌──────────────┐
│ 服務 1..N     │───▶│ 通知 API / 通知伺服器 │───▶│ 佇列 Queue    │───▶│ 工作者 Worker │
│ 觸發來源      │    │ 驗證/偏好/模板/限流   │    │ 入隊/積壓監控   │    │ 重試 + DLQ     │
│ M:請求量/錯誤 │    │ M:延遲/錯誤率         │    │ M:深度/延遲     │    │ M:失敗率/重試數 │
│ T:觸發事件    │    │ T:accepted/rejected  │    │ T:queued/dequeued│   │ T:sent/failed  │
└──────────────┘    └──────────┬──────────┘    └──────┬───────┘    └──────┬───────┘
                                │                        │                   │
                                ▼                        ▼                   ▼
                      ┌──────────────────┐      ┌──────────────────┐   ┌──────────────────────┐
                      │ 快取 Cache       │      │ 資料庫 DB        │   │ 通道 Channels         │
                      │ user/device/tpl  │      │ logs/settings    │   │ Web Push / Email /站內│
                      │ M:命中率          │      │ M:寫入延遲        │   │ M:送達率/退件率       │
                      │ T:cache events   │      │ T:state changes  │   │ T:delivered/open/click│
                      └──────────────────┘      └──────────────────┘   └──────────┬───────────┘
                                                                                     ▼
                                                                                  使用者終端

M = 監控（Monitoring），T = 事件追蹤（Event Tracking）
```

建議核心資料：

- `notifications`（待處理／已送出／失敗／已讀；pending/sent/failed/read）
- `notification_events`（sent/delivered/open/click）
- `notification_preferences`
- `device_subscriptions`

可用服務對照（Queue / Worker）：

| 平台 | Queue（佇列） | Worker（消費者） | 適合情境 |
|------|---------------|------------------|----------|
| AWS | SQS、SNS、Amazon MQ、Kinesis | Lambda、ECS/Fargate、EC2 | 企業級、多服務整合、成熟生態 |
| GCP | Pub/Sub、Cloud Tasks | Cloud Functions、Cloud Run、GKE | 事件驅動、Serverless 優先 |
| Azure | Service Bus、Storage Queue、Event Hubs | Azure Functions、Container Apps、AKS | 微軟生態、企業內網整合 |
| Cloudflare | Cloudflare Queues | Cloudflare Workers（Queue Consumer） | 邊緣部署、低維運、與 Worker API 整合 |
| 自建（Node.js） | Redis（BullMQ/Bull）、RabbitMQ、Kafka、NATS | Node.js Process（pm2/systemd/Docker/K8s） | 高彈性、需自行維運 |
| 自建（Python） | Celery + Redis/RabbitMQ、RQ、Dramatiq、Kafka | Python Worker（Celery Worker / 自訂 Consumer） | 資料處理/ML 流程整合 |

選型建議（NobodyClimb）：

1. 先選 Cloudflare Queues + Workers（與現有架構最一致）。
2. 需求變成跨雲或重運算後，再評估自建或搬到 AWS/GCP/Azure 專用佇列。
3. 無論選哪個平台，都要先定義：重試次數、退避策略、DLQ 規則、告警門檻。

## 第4步：總結

- 書中四步驟可直接套用到 NobodyClimb。
- 目前架構屬於小規模可用解，方向正確。
- 後續重點是按瓶頸演進，不一次引入全部複雜度。
- 成功指標需同時看送達率、點擊率、退訂率與故障恢復能力。

### 參考資料

- [系統設計面試指南 - 第10章](https://github.com/Admol/SystemDesign/blob/main/CHAPTER%2010%EF%BC%9ADESIGN%20A%20NOTIFICATION%20SYSTEM.md)
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
