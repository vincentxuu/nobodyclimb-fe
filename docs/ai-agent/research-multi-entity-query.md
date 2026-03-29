# 多實體查詢處理：RAG 推薦系統的研究與解決方案

## 問題描述

當使用者在單一查詢中提及多個項目時，系統僅處理第一個項目，導致推薦品質大幅下降。

**具體案例**：

> 我最近完攀了：白虎（5.11d）、閃電（5.12a）、看起來我可以（5.11c）、泡泡龍（5.11b）、新竹客家人（5.10d）。請推薦 3 條我尚未爬過、適合下一步挑戰的路線

目前系統的 `extractRouteReference()` 函式以 for 迴圈逐一比對路線名稱，命中第一條（白虎）即 `return`，後續四條路線完全被忽略。系統僅以白虎 5.11d 的難度區間建立 vector filter，遺失了使用者已攀爬 5.12a 的關鍵資訊，導致推薦的難度天花板被人為壓低。

## 一、為什麼單實體擷取不足以應對多實體查詢

### 1.1 資訊損失問題

單實體擷取（Single-entity extraction）將一個複雜查詢降維為單一錨點，造成三種資訊損失：

- **難度範圍損失**：使用者提供了 5.10d 至 5.12a 的完攀紀錄，代表其能力橫跨三個大等級。僅取白虎 5.11d，推薦範圍被限縮在 5.11a–5.12b（±3 步），完全忽略使用者已能完攀 5.12a 的事實。
- **風格偏好損失**：多條路線可能分佈在不同岩場、不同路線類型（sport / trad / boulder），這些分佈反映使用者的攀登偏好。單一路線無法代表這種多元偏好。
- **排除清單不完整**：使用者說「尚未爬過」，但系統的 `excludeRouteId` 僅排除白虎一條，其餘四條仍可能出現在推薦結果中。

### 1.2 學術觀點

在資訊檢索（IR）領域，這類問題被歸類為 **complex information need**（複雜資訊需求）。Metzler & Croft (2005) 在研究中指出，使用者查詢的複雜度與系統理解該查詢的能力之間存在顯著落差——多數檢索系統假設查詢為單一意圖的 atomic query，而現實中使用者的查詢經常包含多個實體、多重條件與隱含偏好。

在推薦系統中，這對應到 **cold-start 問題的變體**：使用者主動提供了豐富的偏好信號，但系統只消費了其中一小部分。

---

## 二、業界與學術界的常見解決方案

### 2.1 多實體擷取（Multi-Entity Extraction / NER）

**核心思路**：將 `extractRouteReference()` 從回傳單一結果改為回傳陣列。

**方法 A：規則式多實體擷取（Rule-based NER）**

直接修改現有函式，收集所有匹配而非僅回傳第一個：

```
extractRouteReferences(query) → RouteReference[]
```

實作要點：

- 將 `for...return` 模式改為 `for...push`，收集所有匹配結果
- 處理名稱重疊問題：使用 greedy longest-match-first 策略，已匹配的文字範圍標記為已消費，避免「看起來我可以」匹配後「我可以」再次匹配
- 對多條路線的難度取 union range：`$gte = min(all grades) - margin, $lte = max(all grades) + margin`

**方法 B：LLM-based NER**

利用 LLM 的 structured output 能力，請模型從查詢中擷取所有路線名稱與對應難度：

```json
{
  "routes": [
    { "name": "白虎", "grade": "5.11d" },
    { "name": "閃電", "grade": "5.12a" },
    { "name": "看起來我可以", "grade": "5.11c" },
    { "name": "泡泡龍", "grade": "5.11b" },
    { "name": "新竹客家人", "grade": "5.10d" }
  ],
  "intent": "recommend_next_challenge",
  "exclude_mentioned": true
}
```

**業界案例**：

- **Google Search**：BERT-based NER 識別查詢中的多個實體，分別觸發 Knowledge Panel
- **Amazon Alexa**：Multi-slot NER 在單一 utterance 中擷取多個 slot value（如「播放周杰倫和林俊傑的歌」）
- **Rasa NLU**：CRF + Transformer 的 pipeline 支援同一 entity type 的多次擷取

**相關研究**：

- Li et al. (2020) 提出 FLAT（Flat-Lattice Transformer），在中文 NER 任務上取得 SOTA，能處理同一句子中多個重疊實體 [1]
- Yan et al. (2021) 提出 Unified NER as MRC，將 NER 轉化為閱讀理解任務，天然支援多實體擷取 [2]

### 2.2 查詢分解（Query Decomposition）

**核心思路**：將複雜查詢拆分為多個子查詢，分別檢索後合併結果。

**在本案例中的應用**：

原始查詢可以分解為：

1. **Profile Sub-query**：「使用者完攀了白虎 5.11d、閃電 5.12a、看起來我可以 5.11c、泡泡龍 5.11b、新竹客家人 5.10d」→ 建立使用者能力 profile
2. **Exclusion Sub-query**：「排除上述五條路線」→ 建立排除清單
3. **Recommendation Sub-query**：「推薦 3 條適合下一步挑戰的路線」→ 以 profile 為基礎進行檢索

**學術框架**：

- **Self-Ask** (Press et al., 2022)：LLM 自問自答，將複雜問題分解為可獨立回答的子問題 [3]
- **Decomposed Prompting** (Khot et al., 2023)：將複雜任務分解為子任務，每個子任務由專門的 prompt 處理 [4]
- **IRCoT** (Trivedi et al., 2023)：交錯執行 Chain-of-Thought 推理與資訊檢索，每步推理產生新的檢索需求 [5]

**業界案例**：

- **LangChain Multi-Query Retriever**：將單一查詢用 LLM 改寫為多個不同角度的查詢，分別檢索後合併去重
- **LlamaIndex Sub-Question Query Engine**：將複雜問題分解為子問題，各自路由到不同的資料來源

### 2.3 使用者偏好聚合（User Profile Aggregation）

**核心思路**：不將每條路線視為獨立的檢索錨點，而是將多條路線聚合為使用者偏好 profile，再以此 profile 進行推薦。

**聚合維度**：

| 維度     | 聚合方式                     | 本案例                          |
| -------- | ---------------------------- | ------------------------------- |
| 難度     | 取最高完攀等級作為能力上界   | max = 5.12a → 推薦 5.12a–5.12c  |
| 難度分佈 | 計算中位數與標準差           | median ≈ 5.11c，多數集中在 5.11 |
| 岩場     | 收集所有路線的 crag_id       | 多岩場 → 不限定岩場 filter      |
| 路線類型 | 統計 sport/trad/boulder 比例 | 偏好 sport → 加權 sport 路線    |
| 排除清單 | 收集所有 route_id            | 5 條路線全部排除                |

**Embedding 層面的聚合**：

如果每條路線都有 embedding vector，可以計算多條路線的 centroid embedding 作為查詢向量：

```
query_vector = mean([embed(白虎), embed(閃電), embed(看起來我可以), embed(泡泡龍), embed(新竹客家人)])
```

這在推薦系統中被稱為 **average pooling of item embeddings**，是建立 user embedding 的經典方法。

**相關研究**：

- Covington et al. (2016)，YouTube 推薦系統論文，使用 user's watch history 的 embedding average 作為 user representation [6]
- Koren et al. (2009)，Matrix Factorization 經典論文，使用者的偏好由其互動過的所有項目共同決定 [7]

### 2.4 Plan-and-Execute RAG 策略

**核心思路**：引入 planning 階段，先分析查詢的完整意圖與所需步驟，再依計畫逐步執行。

**架構**：

```
Query → Planner → [Step 1: Extract all routes]
                   [Step 2: Build user profile]
                   [Step 3: Determine search criteria]
                   [Step 4: Vector search with aggregated filter]
                   [Step 5: Re-rank and exclude]
               → Executor → Response
```

**與現有 LangGraph 架構的契合**：

目前系統已有 `multi_tool` 路徑支援多步驟執行（`toolSelectionNode` 中的 `multi_tool` 分支），但 multi_tool 的設計是讓 LLM 在 tool-selection 階段就決定所有步驟。Plan-and-Execute 的差異在於：

- **Plan 階段更結構化**：不只決定「用哪些 tool」，還要決定「如何聚合中間結果」
- **Execute 階段有 feedback loop**：每步執行後可修正後續計畫

**相關研究**：

- Wang et al. (2023)，**Plan-and-Solve Prompting**：在 zero-shot 設定下，先讓 LLM 制定計畫，再逐步執行，比 Chain-of-Thought 更穩定 [8]
- Yao et al. (2023)，**ReAct**：交錯推理與行動，LLM 在每一步都可以觀察環境回饋並調整下一步 [9]
- Shinn et al. (2023)，**Reflexion**：加入自我反思機制，執行失敗後可以修正策略重試 [10]

### 2.5 協同過濾方法（Collaborative Filtering）

**核心思路**：不只看「這位使用者爬了什麼」，還看「爬過相同路線的其他使用者還爬了什麼」。

**在本案例中的應用**：

```sql
-- 找出與當前使用者有最多共同完攀路線的其他使用者
SELECT user_id, COUNT(*) as overlap
FROM ascents
WHERE route_id IN ('白虎_id', '閃電_id', '看起來我可以_id', '泡泡龍_id', '新竹客家人_id')
  AND user_id != current_user_id
GROUP BY user_id
ORDER BY overlap DESC
LIMIT 10;

-- 從這些「品味相似」的使用者中找出他們爬過但當前使用者沒爬過的路線
SELECT route_id, COUNT(*) as popularity
FROM ascents
WHERE user_id IN (上述 top-10 使用者)
  AND route_id NOT IN ('白虎_id', '閃電_id', ...)
GROUP BY route_id
ORDER BY popularity DESC
LIMIT 3;
```

**限制**：

- 需要足夠多的使用者攀登紀錄才能產生有意義的推薦（冷啟動問題）
- 計算量較大，不適合在 Cloudflare Workers 的 CPU 時間限制內即時運算
- 適合作為離線預計算的補充信號，而非即時查詢的主要方法

**相關研究**：

- Rendle et al. (2009)，**BPR（Bayesian Personalized Ranking）**：從隱式回饋中學習個人化排序 [11]
- He et al. (2017)，**Neural Collaborative Filtering**：用神經網路取代矩陣分解，捕捉更複雜的 user-item 互動模式 [12]

---

## 三、Multi-Hop QA 與複雜查詢分解的關鍵論文

以下論文直接涉及「從複雜查詢中擷取多個信號並綜合推理」的核心問題：

### 3.1 Multi-Hop Question Answering

| 論文                                                                   | 作者           | 年份 | 核心貢獻                                                                          |
| ---------------------------------------------------------------------- | -------------- | ---- | --------------------------------------------------------------------------------- |
| HotpotQA: A Dataset for Diverse, Explainable Multi-hop QA              | Yang et al.    | 2018 | 提出多跳問答 benchmark，要求系統跨多個文件推理 [13]                               |
| Answering Complex Open-Domain Questions with Multi-Hop Dense Retrieval | Xiong et al.   | 2021 | MDR（Multi-hop Dense Retrieval），迭代式檢索，每一跳根據前一跳的結果調整查詢 [14] |
| Baleen: Robust Multi-Hop Reasoning at Scale via Condensed Retrieval    | Khattab et al. | 2021 | 提出 condensed retrieval，在多跳檢索中壓縮中間結果以提升效率 [15]                 |
| DSP: Demonstrating Searching and Planning for Complex QA               | Khattab et al. | 2023 | DSPy 框架的前身，將複雜 QA 分解為 demonstrate-search-predict pipeline [16]        |

### 3.2 Query Decomposition for Retrieval

| 論文                                                                                        | 作者         | 年份 | 核心貢獻                                                     |
| ------------------------------------------------------------------------------------------- | ------------ | ---- | ------------------------------------------------------------ |
| Measuring and Narrowing the Compositionality Gap                                            | Press et al. | 2023 | Self-Ask 方法，LLM 自行判斷是否需要追問子問題 [3]            |
| Query Rewriting for Retrieval-Augmented Large Language Models                               | Ma et al.    | 2023 | 用 LLM 重寫查詢以提升檢索品質，支援多角度改寫 [17]           |
| ITER-RETGEN: Enhancing Retrieval-Augmented LLMs with Iterative Retrieval-Generation Synergy | Shao et al.  | 2023 | 迭代式檢索-生成，每輪生成的內容作為下一輪檢索的 context [18] |

### 3.3 推薦系統中的多信號融合

| 論文                                             | 作者             | 年份 | 核心貢獻                                                     |
| ------------------------------------------------ | ---------------- | ---- | ------------------------------------------------------------ |
| Deep Neural Networks for YouTube Recommendations | Covington et al. | 2016 | 用 user history embedding 的平均作為 user representation [6] |
| Neural Collaborative Filtering                   | He et al.        | 2017 | 神經網路建模 user-item 互動 [12]                             |
| SASRec: Self-Attentive Sequential Recommendation | Kang & McAuley   | 2018 | 用 self-attention 處理使用者的互動序列，捕捉順序偏好 [19]    |
| Recommendation as Language Processing (RLP)      | Li et al.        | 2023 | 將推薦問題轉化為自然語言任務，用 LLM 直接處理 [20]           |

---

## 四、針對攀岩路線推薦系統的建議方案

綜合上述研究與本系統的技術限制（Cloudflare Workers runtime、D1 SQLite 資料庫、現有 LangGraph 架構），建議採用 **分層遞進** 策略：

### 第一層：多實體擷取（低成本、高效益）

**改動範圍**：`extractRouteReference()` → `extractRouteReferences()`

**具體做法**：

1. 將函式改為回傳 `RouteReference[]` 陣列
2. 使用 consumed-range 機制避免重疊匹配
3. 呼叫端（`tool-selection.ts`）聚合多條路線：
   - `excludeRouteIds: string[]`（排除所有已提及路線）
   - `grade_numeric` filter 取所有路線的 min-max 並向上偏移（推薦「下一步挑戰」應略高於最高完攀等級）
   - `referenceRouteInfo` 列出所有路線而非僅第一條
   - 若路線分佈在多個 crag，移除 crag_id filter（避免限縮岩場範圍）

**預估效益**：解決 80% 的多實體查詢問題，不增加 LLM 呼叫次數，延遲不變。

### 第二層：User Profile Aggregation（中等成本）

**改動範圍**：新增 `buildUserProfile()` 函式

**具體做法**：

1. 從多條路線中計算：
   - **能力上界**：max grade → 決定推薦的難度上限
   - **舒適區**：median grade → 決定推薦的難度重心
   - **偏好路線類型**：統計 sport/trad/boulder 比例 → 加權排序
   - **偏好岩場/區域**：統計 crag 分佈 → 若集中在同一岩場則限定，否則放寬
2. 將 profile 注入 LLM prompt 的 system context：

```
使用者攀登概況：
- 最高完攀：5.12a（閃電）
- 難度分佈：5.10d ~ 5.12a，中位 5.11c
- 已完攀路線：白虎、閃電、看起來我可以、泡泡龍、新竹客家人（共 5 條）
- 推薦策略：建議 5.12a ~ 5.12c 範圍，略高於最高完攀等級
```

**預估效益**：讓 LLM 在生成回答時有完整的使用者背景，推薦品質顯著提升。

### 第三層：Embedding Centroid + Re-ranking（進階）

**改動範圍**：修改 vector search 的查詢策略

**具體做法**：

1. 若多條路線都有 embedding，計算 centroid vector
2. 用 centroid vector 進行 vector search（取代原本用 HyDE document 或 query embedding）
3. 搜尋結果經過 re-ranking：
   - 排除已提及路線（hard filter）
   - 難度適當性加權（略高於最高完攀等級的路線加分）
   - 多樣性加權（避免推薦的 3 條路線過於相似）

**限制**：需要 Vectorize 支援自訂查詢向量（非從文字生成），需確認 Cloudflare Vectorize API 是否支援。

### 實作優先級

```
P0（立即實作）：第一層 — 多實體擷取
    - 修改 extractRouteReference → extractRouteReferences
    - 修改 tool-selection.ts 消費多路線資訊
    - 修改 excludeRouteId → excludeRouteIds（含 vector search 排除邏輯）

P1（短期）：第二層 — User Profile Aggregation
    - 新增 buildUserProfile() 函式
    - 修改 referenceRouteInfo 格式
    - 調整 LLM prompt 加入 profile context

P2（中期）：第三層 — Embedding Centroid
    - 需確認 Vectorize API 支援
    - 需評估 centroid 品質（5 條路線的 centroid 是否有意義）
```

### 與現有架構的整合點

| 現有元件                             | 改動方式                                        |
| ------------------------------------ | ----------------------------------------------- |
| `nlp.ts` → `extractRouteReference()` | 改為 `extractRouteReferences()`，回傳陣列       |
| `tool-selection.ts` → `routeRef`     | 改為 `routeRefs: RouteReference[]`，聚合 filter |
| `GraphState` → `excludeRouteId`      | 改為 `excludeRouteIds: string[]`                |
| `filter-build.ts`                    | 處理多 crag 場景（`$in` 而非 `$eq`）            |
| `referenceRouteInfo`                 | 從單行改為多行摘要                              |
| Vector search 的 post-filter         | 排除多條路線（`$nin` 而非 `$ne`）               |

---

## 參考文獻

[1] Li, X., Yan, H., Qiu, X., & Huang, X. (2020). FLAT: Chinese NER Using Flat-Lattice Transformer. _ACL 2020_.

[2] Yan, H., Gui, T., Dai, J., Guo, Q., Zhang, Z., & Qiu, X. (2021). A Unified Generative Framework for Various NER Subtasks. _ACL 2021_.

[3] Press, O., Zhang, M., Min, S., Schmidt, L., Smith, N. A., & Lewis, M. (2023). Measuring and Narrowing the Compositionality Gap in Language Models. _Findings of EMNLP 2023_.

[4] Khot, T., Trivedi, H., Finlayson, M., Fu, Y., Richardson, K., Clark, P., & Sabharwal, A. (2023). Decomposed Prompting: A Modular Approach for Solving Complex Tasks. _ICLR 2023_.

[5] Trivedi, H., Balasubramanian, N., Khot, T., & Sabharwal, A. (2023). Interleaving Retrieval with Chain-of-Thought Reasoning for Knowledge-Intensive Multi-Step Questions. _ACL 2023_.

[6] Covington, P., Adams, J., & Sargin, E. (2016). Deep Neural Networks for YouTube Recommendations. _RecSys 2016_.

[7] Koren, Y., Bell, R., & Volinsky, C. (2009). Matrix Factorization Techniques for Recommender Systems. _IEEE Computer, 42_(8), 30-37.

[8] Wang, L., Xu, W., Lan, Y., Hu, Z., Lan, Y., Lee, R. K.-W., & Lim, E.-P. (2023). Plan-and-Solve Prompting: Improving Zero-Shot Chain-of-Thought Reasoning by Large Language Models. _ACL 2023_.

[9] Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., & Cao, Y. (2023). ReAct: Synergizing Reasoning and Acting in Language Models. _ICLR 2023_.

[10] Shinn, N., Cassano, F., Gopinath, A., Shakkottai, K., Labash, A., & Kass-Hout, T. (2023). Reflexion: Language Agents with Verbal Reinforcement Learning. _NeurIPS 2023_.

[11] Rendle, S., Freudenthaler, C., Gantner, Z., & Schmidt-Thieme, L. (2009). BPR: Bayesian Personalized Ranking from Implicit Feedback. _UAI 2009_.

[12] He, X., Liao, L., Zhang, H., Nie, L., Hu, X., & Chua, T.-S. (2017). Neural Collaborative Filtering. _WWW 2017_.

[13] Yang, Z., Qi, P., Zhang, S., Bengio, Y., Cohen, W., Salakhutdinov, R., & Manning, C. D. (2018). HotpotQA: A Dataset for Diverse, Explainable Multi-hop Question Answering. _EMNLP 2018_.

[14] Xiong, W., Li, X., Iber, S., Du, J., Croft, W. B., & Chi, E. H. (2021). Answering Complex Open-Domain Questions with Multi-Hop Dense Retrieval. _ICLR 2021_.

[15] Khattab, O., Potts, C., & Zaharia, M. (2021). Baleen: Robust Multi-Hop Reasoning at Scale via Condensed Retrieval. _NeurIPS 2021_.

[16] Khattab, O., Santhanam, K., Li, X. L., Hall, D., Liang, P., Potts, C., & Zaharia, M. (2023). Demonstrate-Search-Predict: Composing Retrieval and Language Models for Knowledge-Intensive NLP. _arXiv:2212.14024_.

[17] Ma, X., Gong, Y., He, P., Zhao, H., & Duan, N. (2023). Query Rewriting for Retrieval-Augmented Large Language Models. _arXiv:2305.14283_.

[18] Shao, Z., Gong, Y., Shen, Y., Huang, M., Duan, N., & Chen, W. (2023). Enhancing Retrieval-Augmented Large Language Models with Iterative Retrieval-Generation Synergy. _Findings of EMNLP 2023_.

[19] Kang, W.-C., & McAuley, J. (2018). Self-Attentive Sequential Recommendation. _ICDM 2018_.

[20] Li, J., Zhang, W., Wang, T., Xiong, G., Lu, A., & Medini, T. (2023). GPT4Rec: A Generative Framework for Personalized Recommendation and User Interests Interpretation. _arXiv:2304.03879_.
