## 需求

### 需求：Retrieval 品質評估（CRAG）
系統 SHALL 在 RRF 過濾後評估 retrieval 品質，以「存活文件數為 0」作為 retrieval 失敗信號，觸發自適應重新搜尋。

#### 場景：空 retrieval 結果觸發 CRAG 重試
- **當** RRF 分數過濾後存活文件數為 0
- **則** 系統觸發 CRAG 重試，放寬過濾條件重新搜尋

#### 場景：非空 retrieval 結果跳過 CRAG 重試
- **當** RRF 分數過濾後存活文件數 >= 1
- **則** 系統直接進入後續 reranking 步驟，不觸發重試

### 需求：自適應過濾條件放寬
系統 SHALL 在 CRAG 重試時移除 `grade_numeric` 過濾條件，保留位置相關過濾條件。

#### 場景：重試時移除難度過濾
- **當** CRAG 重試被觸發
- **則** 系統移除 `grade_numeric` 過濾條件，保留 `crag_id`、`area_id`、`region`、`type` 過濾條件

#### 場景：重試後仍無結果時繼續
- **當** CRAG 重試後存活文件數仍為 0
- **則** 系統以空 context 繼續生成回答，不再重試

### 需求：CRAG 重試次數上限
系統 SHALL 限制 CRAG 重試最多執行 1 次，防止無限迴圈。

#### 場景：CRAG 重試上限強制執行
- **當** 第一次 CRAG 重試完成
- **則** 系統不再觸發第二次重試，無論結果品質如何

### 需求：Self-reflection 回答品質評估
系統 SHALL 對 `complex` 類型查詢的生成回答進行 self-reflection 評估，回答不足時觸發一次重新生成。

#### 場景：回答通過 self-reflection
- **當** `query_type = 'complex'` 且 self-reflection 判斷為「YES」
- **則** 系統返回原始生成回答

#### 場景：回答未通過且長度充足時重新生成
- **當** `query_type = 'complex'` 且 self-reflection 判斷為「NO」且回答長度 >= 50 字元
- **則** 系統觸發一次重新生成並返回新回答

#### 場景：短回答不觸發重新生成
- **當** `query_type = 'complex'` 且 self-reflection 判斷為「NO」且回答長度 < 50 字元
- **則** 系統返回原始回答（視為合理的「無資料」回應，不重試）

#### 場景：簡單查詢跳過 self-reflection
- **當** `query_type = 'simple'`
- **則** 系統跳過 self-reflection 步驟

#### 場景：Self-reflection 輸出格式異常視為通過
- **當** self-reflection 模型回應非「YES」或「NO」
- **則** 系統視為「YES」（不觸發重新生成），確保流程正常進行

### 需求：Self-reflection 重試次數上限
系統 SHALL 限制 self-reflection 重新生成最多執行 1 次。

#### 場景：Self-reflection 重試上限強制執行
- **當** 第一次 self-reflection 重新生成完成
- **則** 系統不再進行第二次 reflection 評估
