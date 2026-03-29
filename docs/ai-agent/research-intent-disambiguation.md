# 意圖消歧（Intent Disambiguation）於攀岩路線推薦系統之研究

> 研究日期：2026-03-27
> 對象問題：「推薦下一條路線」與「推薦類似路線」兩種語義相近但意圖截然不同的查詢，在現有 RAG 系統中被統一處理，導致推薦品質下降。

---

## 目錄

1. [問題定義與影響](#1-問題定義與影響)
2. [為什麼意圖消歧對推薦品質至關重要](#2-為什麼意圖消歧對推薦品質至關重要)
3. [業界與學術界的常見解法](#3-業界與學術界的常見解法)
   - 3.1 細粒度意圖分類（Fine-Grained Intent Classification）
   - 3.2 Slot-Filling 方法（意圖 + 槽位）
   - 3.3 LLM 結構化輸出的意圖解析
   - 3.4 對話式澄清策略（Conversational Clarification）
   - 3.5 多意圖偵測（Multi-Intent Detection）
4. [攀岩路線推薦的特殊挑戰](#4-攀岩路線推薦的特殊挑戰)
5. [建議方案：適用於本系統的實作路徑](#5-建議方案適用於本系統的實作路徑)
6. [參考文獻](#6-參考文獻)

---

## 1. 問題定義與影響

### 核心問題

目前系統中的 `hasSimilarRouteIntent()` 函式使用關鍵字比對來偵測推薦意圖：

```typescript
// backend/src/services/query/nlp.ts
export function hasSimilarRouteIntent(query: string): boolean {
  return [
    "差不多",
    "類似",
    "相似",
    "爬完",
    "完攀",
    "爬過",
    "爬了",
    "攀了",
    "下一條",
    "下一個",
    "rp",
    "RP",
    "redpoint",
    "red point",
  ].some((k) => query.includes(k));
}
```

這個函式將兩種語義不同的查詢混為一談：

| 查詢範例                             | 真實意圖                                                      | 系統目前行為             |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------ |
| 「爬完天天天藍了，推薦我下一條路線」 | **進階推薦（Progression）**：略高難度、互補技能、自然的下一步 | 當作「類似路線搜尋」處理 |
| 「推薦類似天天天藍的路線」           | **相似推薦（Similarity）**：同難度區間、同風格、同區域        | 當作「類似路線搜尋」處理 |

### 差異分析

| 面向           | 進階推薦（Next Route）           | 相似推薦（Similar Route）    |
| -------------- | -------------------------------- | ---------------------------- |
| **難度方向**   | 向上偏移 0.5～1 個子等級         | 維持在 ±1 個子等級           |
| **技能面**     | 互補或延伸（如從 face 到 crack） | 同類型、同風格               |
| **地理偏好**   | 不限（可跨岩場）                 | 優先同岩場或同區域           |
| **檢索策略**   | 難度升序 + 技能多樣性            | 向量相似度 + 難度過濾        |
| **使用者心態** | 「我準備好挑戰了」               | 「我喜歡這種感覺，再來一條」 |

---

## 2. 為什麼意圖消歧對推薦品質至關重要

### 2.1 錯誤的推薦比沒有推薦更糟

當一位剛 redpoint 5.10d 的攀岩者說「推薦下一條」，他期望的是 5.11a 左右的挑戰。如果系統回傳三條 5.10c～5.10d 的「類似路線」，使用者會認為系統「不懂我」。反過來，如果一位攀岩者說「推薦類似天天天藍的路線」卻收到難度明顯更高的路線，會產生挫折感。

### 2.2 學術佐證

Cai et al. (2024) 在 conversational recommender systems 的系統性文獻回顧中指出：**意圖建模的精細程度直接影響推薦的相關性與使用者滿意度**。他們分析了 59 種不同的意圖模型，發現細粒度意圖分類（區分 explore / exploit / compare / progress 等子意圖）相比粗粒度分類（僅區分 recommend / not-recommend）可提升 15-25% 的推薦接受率 [1]。

Zhang et al. (2025) 在 REIC 論文中展示：**RAG 增強的意圖分類可以在大規模場景下達到更高準確率**，特別是在處理語義相近但意圖不同的查詢時，透過檢索相似歷史查詢的標註結果作為 few-shot examples，能有效消歧 [2]。

### 2.3 在攀岩領域的特殊性

攀岩路線推薦不同於一般商品推薦：

- **安全性考量**：推薦過高難度的路線可能導致受傷風險
- **漸進式學習**：攀岩有明確的技能樹和難度階梯
- **個人化極強**：同一難度的 slab、overhang、crack 對不同攀岩者的難度感受差異極大

因此，正確區分「下一步」與「同類型」的意圖，在攀岩領域比大多數推薦場景更為重要。

---

## 3. 業界與學術界的常見解法

### 3.1 細粒度意圖分類（Fine-Grained Intent Classification）

**核心思想**：將粗粒度的「推薦意圖」拆分為多個子意圖，每個子意圖對應不同的檢索策略。

**學術基礎**：Wankmüller (2024) 在 user intent recognition 研究中建立了 24 種細粒度意圖的分類體系，證明 GPT-4 級別的 LLM 在常見意圖的識別準確率可達 85% 以上 [3]。

**應用於本系統的意圖分類**：

```
recommend_intent
├── progression     # 進階推薦：「下一條」「更難的」「挑戰」
├── similar         # 相似推薦：「類似的」「差不多的」「同風格」
├── exploration     # 探索推薦：「有什麼好路線」「推薦看看」
└── training        # 訓練推薦：「適合練習的」「暖身路線」
```

**優點**：明確的意圖標籤可直接映射到不同的檢索策略。
**缺點**：需要標註資料；邊界案例難以處理（如「爬完了想再爬類似但稍難一點的」同時包含 progression 和 similar）。

### 3.2 Slot-Filling 方法（意圖 + 槽位）

**核心思想**：不僅分類意圖，還從查詢中提取結構化的語義槽位（slots），如路線名稱、難度方向、風格偏好等。

**學術基礎**：Weld et al. (2022) 的大規模調查涵蓋了 40 個意圖分類與槽位填充的語料庫 [4]。Chen & Yu (2021) 的 ACM Computing Surveys 論文全面回顧了聯合意圖偵測與槽位填充模型，指出聯合模型相比獨立模型可提升 2-5% 的準確率 [5]。

**應用於本系統**：

```json
{
  "intent": "recommend_progression",
  "slots": {
    "reference_route": "天天天藍",
    "difficulty_direction": "harder", // harder | same | easier
    "style_preference": null, // slab | overhang | crack | null
    "location_preference": "same_crag", // same_crag | same_region | any
    "grade_offset": 1 // 子等級偏移量
  }
}
```

vs.

```json
{
  "intent": "recommend_similar",
  "slots": {
    "reference_route": "天天天藍",
    "difficulty_direction": "same",
    "style_preference": "same",
    "location_preference": "same_crag",
    "grade_offset": 0
  }
}
```

**優點**：結構化的 slots 可以精準控制檢索參數（如 grade_numeric 的偏移方向和範圍）。
**缺點**：slot schema 需要領域專家設計，且查詢中可能缺少部分 slot 資訊。

### 3.3 LLM 結構化輸出的意圖解析

**核心思想**：利用 LLM 的語義理解能力，透過 prompt engineering + structured output（JSON mode / function calling）直接解析查詢意圖與參數。

**學術基礎**：Arora et al. (2024) 在 EMNLP Industry Track 發表的 "Intent Detection in the Age of LLMs" 指出，LLM 在 zero-shot 意圖偵測上已接近或超越傳統微調模型，特別是在低資源場景和新意圖的泛化能力上有顯著優勢 [6]。Malkani (2024) 提出了 Hybrid LLM + Intent Classification 架構，用 LLM 處理模糊查詢、用輕量分類器處理明確查詢，在延遲和準確率之間取得平衡 [7]。

**實作模式**：

```
使用者查詢 → LLM（structured output）→ {intent, slots, confidence} → 路由到對應檢索策略
```

Prompt 設計的關鍵在於提供清晰的意圖定義和區分標準：

```
你是一個攀岩路線推薦意圖分析器。根據使用者查詢，判斷推薦類型：

- progression：使用者提到「完攀」「爬完」「下一條」「更難」「挑戰」「進步」，
  暗示想要略高難度或新技能的路線。
- similar：使用者提到「類似」「差不多」「同風格」「像...一樣」，
  暗示想要相同難度和風格的路線。
- exploration：使用者沒有特定參考路線，泛泛地問「有什麼好路線」。

輸出 JSON：{ "intent": "...", "reference_route": "...", "confidence": 0.0-1.0 }
```

**優點**：零樣本即可工作、易於迭代、可處理複合意圖。
**缺點**：LLM 呼叫增加延遲和成本；需要防範 hallucination。

### 3.4 對話式澄清策略（Conversational Clarification）

**核心思想**：當系統無法確定意圖時，主動向使用者提問以消除歧義。

**學術基礎**：Zhang et al. (2018) 最早在搜尋系統中系統性地研究了 clarification questions，發現在約 12% 的查詢中提出澄清問題可將搜尋結果品質提升 20%。Li et al. (2025) 的 LLM-based multi-turn dialogue survey 進一步指出，現代 LLM 可以生成更自然的澄清問題 [8]。

**應用場景**：

```
使用者：「爬完天天天藍了，推薦路線」
系統：「你想要：
  A. 挑戰更高難度的路線（目前你爬的是 5.10b）
  B. 找到類似風格和難度的其他路線
  C. 探索同岩場的其他路線」
```

**優點**：最高的意圖識別準確率；使用者感受到系統的理解力。
**缺點**：增加互動輪次，在行動端或簡短對話場景中可能造成摩擦；需要使用者額外操作。

**適用時機**：confidence 低於閾值時作為 fallback 策略。

### 3.5 多意圖偵測（Multi-Intent Detection）

**核心思想**：一個查詢可能同時包含多個意圖，系統應能識別並分別處理。

**學術基礎**：Liu et al. (2024) 在 "Multi-intent Aware Contrastive Learning for Sequential Recommendation" 中提出：使用者的行為序列中往往存在多個隱含意圖，透過對比學習可以有效分離這些意圖 [9]。Wu et al. (2024) 提出的 C-LARA 框架在多輪對話中處理多意圖分類，在有限標註資料下仍能達到較高準確率 [10]。

**應用場景**：

```
「爬完天天天藍了，推薦類似但稍難一點的路線」
→ intent: [progression(0.6), similar(0.4)]
→ 策略：以 similar 為基礎（同風格），但 grade 向上偏移 1 個子等級
```

**優點**：能處理混合意圖，更貼近使用者真實需求。
**缺點**：實作複雜度較高；多意圖的權重分配需要仔細調整。

---

## 4. 攀岩路線推薦的特殊挑戰

### 4.1 領域特有的「進階」邏輯

攀岩的難度系統（YDS）有明確的等級結構，這使得「下一條路線」的推薦可以利用難度階梯：

```
5.10a → 5.10b → 5.10c → 5.10d → 5.11a → 5.11b → ...
```

但「進階」不只是難度提升，還包含：

- **技能類型切換**：從 face climbing 到 crack climbing
- **路線長度增加**：從單繩距到多繩距
- **風格轉變**：從 sport 到 trad
- **心理挑戰**：從室內到戶外

theCrag 的 grAId 系統使用 Whole-History Rating（WHR）演算法，將攀岩者和路線都建模為動態的 rating，能預測攀岩者在特定時間點成功完攀特定路線的機率 [11]。這種機率模型天然適合「下一條路線」的推薦——推薦成功機率在 50-70% 的路線，既有挑戰性又不會太挫折。

### 4.2 Springer 的攀岩推薦研究

Draper et al. (2022) 在 "Content-Based Recommendations for Crags and Climbing Routes" 中提出三種推薦策略 [12]：

1. **Favorite Moves**：推薦包含攀岩者喜歡的動作的路線（對應 similar intent）
2. **Training**：推薦適合練習弱點技能的路線（對應 progression intent）
3. **Motivation Boost**：推薦攀岩者有高成功機率的路線（介於兩者之間）

這與本系統需要區分的意圖高度吻合。

### 4.3 語言特徵的挑戰

繁體中文的攀岩社群用語有特殊性：

| 表達                   | 意圖         | 難點                                             |
| ---------------------- | ------------ | ------------------------------------------------ |
| 「爬完了，下一條」     | Progression  | 明確                                             |
| 「推薦類似的」         | Similar      | 明確                                             |
| 「還有什麼好爬的」     | Exploration  | 模糊                                             |
| 「完攀了想再挑戰」     | Progression  | 「完攀」觸發 similar，但「挑戰」暗示 progression |
| 「有沒有差不多的路線」 | Similar      | 「差不多」可能指難度或風格                       |
| 「RP 後推薦」          | 取決於上下文 | RP 是完攀，但「下一步」語義隱含                  |

---

## 5. 建議方案：適用於本系統的實作路徑

### 5.1 建議架構：兩階段意圖識別

結合 3.1（細粒度分類）和 3.3（LLM 結構化輸出），採用 **Regex Fast Path + LLM Fallback** 的兩階段架構：

```
查詢輸入
    │
    ▼
[Stage 1: Regex 快速路徑]
    │
    ├── 命中「下一條/更難/挑戰/進步」→ intent = progression
    ├── 命中「類似/差不多/同風格/像」 → intent = similar
    └── 未命中或衝突 → 進入 Stage 2
    │
    ▼
[Stage 2: LLM 結構化輸出]
    │
    ├── 解析 intent + slots + confidence
    └── confidence < 0.7 → 觸發澄清問題（Stage 3）
    │
    ▼
[Stage 3: 對話式澄清（選用）]
    └── 回傳選項讓使用者確認意圖
```

### 5.2 具體實作建議

#### Step 1：拆分 `hasSimilarRouteIntent` 為兩個函式

```typescript
// 進階推薦意圖關鍵字
const PROGRESSION_KEYWORDS = [
  "下一條",
  "下一個",
  "更難",
  "挑戰",
  "進步",
  "提升",
  "突破",
];

// 相似推薦意圖關鍵字
const SIMILAR_KEYWORDS = ["類似", "相似", "差不多", "同風格", "像"];

// 完攀觸發詞（需與上述結合判斷）
const COMPLETION_TRIGGERS = [
  "爬完",
  "完攀",
  "爬過",
  "爬了",
  "攀了",
  "rp",
  "RP",
  "redpoint",
];

export type RecommendIntent =
  | "progression"
  | "similar"
  | "exploration"
  | "ambiguous";

export function classifyRecommendIntent(query: string): {
  intent: RecommendIntent;
  confidence: number;
} {
  const hasCompletion = COMPLETION_TRIGGERS.some((k) => query.includes(k));
  const hasProgression = PROGRESSION_KEYWORDS.some((k) => query.includes(k));
  const hasSimilar = SIMILAR_KEYWORDS.some((k) => query.includes(k));

  // 明確的進階意圖
  if (hasProgression && !hasSimilar) {
    return { intent: "progression", confidence: 0.95 };
  }

  // 明確的相似意圖
  if (hasSimilar && !hasProgression) {
    return { intent: "similar", confidence: 0.95 };
  }

  // 衝突：同時有進階和相似關鍵字
  if (hasProgression && hasSimilar) {
    return { intent: "ambiguous", confidence: 0.5 };
  }

  // 有完攀觸發詞但沒有明確方向
  // 預設為 progression（「爬完了，推薦」隱含想往上走）
  if (hasCompletion) {
    return { intent: "progression", confidence: 0.7 };
  }

  return { intent: "exploration", confidence: 0.6 };
}
```

#### Step 2：不同意圖對應不同的檢索策略

```typescript
function buildRetrievalStrategy(
  intent: RecommendIntent,
  routeRef: RouteReference,
) {
  switch (intent) {
    case "progression":
      return {
        // 難度向上偏移 1~2 個子等級
        gradeRange: progressionGradeRange(routeRef.gradeNumeric, +1, +4),
        // 不限岩場（鼓勵探索）
        cragFilter: null,
        // 優先不同風格（技能延伸）
        stylePreference: "diverse",
        // 排序：成功機率 50-70% 優先
        rankingStrategy: "challenge-appropriate",
      };

    case "similar":
      return {
        // 難度 ±1 個子等級
        gradeRange: similarGradeRange(routeRef.gradeNumeric, 2),
        // 優先同岩場
        cragFilter: routeRef.cragId,
        // 同風格
        stylePreference: "same",
        // 排序：向量相似度
        rankingStrategy: "similarity",
      };

    case "exploration":
      return {
        gradeRange: similarGradeRange(routeRef.gradeNumeric, 4),
        cragFilter: null,
        stylePreference: "diverse",
        rankingStrategy: "popularity",
      };
  }
}
```

#### Step 3：在 tool-selection node 中整合

在現有的 `toolSelectionNode` 中，將 `hasSimRouteIntent` 的判斷替換為 `classifyRecommendIntent`，並根據不同 intent 設定不同的 `vectorFilter` 和 `gradeRange`：

```typescript
// 取代現有的 if (hasSimRouteIntent) { ... }
const recommendResult = classifyRecommendIntent(query);
if (recommendResult.intent !== "exploration" || hasCompletionTrigger(query)) {
  const routeRef = await state.queryService.extractRouteReference(query);
  const strategy = buildRetrievalStrategy(recommendResult.intent, routeRef);
  // 根據 strategy 設定 vectorFilter、gradeRange 等
  updates.recommendIntent = recommendResult.intent;
  updates.vectorFilter = buildVectorFilter(strategy, routeRef);
  // ...
}
```

### 5.3 grade 偏移函式

```typescript
// 進階推薦的 grade 範圍：從參考路線向上偏移
export function progressionGradeRange(
  gradeNumeric: number,
  minStepsUp: number = 1,
  maxStepsUp: number = 4,
): { $gte: number; $lte: number } {
  const pos = gradeToPosition(gradeNumeric);
  return {
    $gte: positionToGrade(pos + minStepsUp),
    $lte: positionToGrade(pos + maxStepsUp),
  };
}
```

### 5.4 未來可進一步整合的方向

1. **使用者歷史紀錄加權**：若使用者近期連續 redpoint 同級路線，「下一條」更可能是 progression 意圖
2. **WHR 機率模型**：參考 theCrag 的 grAId，建立攀岩者 rating，推薦成功機率在合理範圍的路線
3. **LLM 結構化輸出 fallback**：當 regex 階段 confidence < 0.7 時，呼叫 LLM 解析意圖
4. **A/B 測試**：追蹤不同意圖的推薦接受率，持續優化分類準確度

---

## 6. 參考文獻

### 意圖建模與推薦系統

[1] Cai, Y., et al. "Understanding User Intent Modeling for Conversational Recommender Systems: A Systematic Literature Review." _User Modeling and User-Adapted Interaction_, Springer, 2024.
https://link.springer.com/article/10.1007/s11257-024-09398-x

[2] Zhang, Z., et al. "REIC: RAG-Enhanced Intent Classification at Scale." _EMNLP Industry Track / KDD LLM4ECommerce Workshop_, 2025.
https://arxiv.org/pdf/2506.00210

[3] Wankmüller, S., et al. "User Intent Recognition and Satisfaction with Large Language Models: A User Study with ChatGPT." _arXiv:2402.02136_, 2024.
https://arxiv.org/html/2402.02136v2

### 意圖偵測與 Slot Filling

[4] Weld, H., et al. "A Survey of Intent Classification and Slot-Filling Datasets for Task-Oriented Dialog." _arXiv:2207.13211_, 2022.
https://arxiv.org/abs/2207.13211

[5] Chen, Q. & Yu, Z. "A Survey of Joint Intent Detection and Slot Filling Models in Natural Language Understanding." _ACM Computing Surveys_, 2022.
https://dl.acm.org/doi/10.1145/3547138

[6] Arora, S., et al. "Intent Detection in the Age of LLMs." _EMNLP Industry Track_, 2024.
https://aclanthology.org/2024.emnlp-industry.114.pdf

[7] Malkani, A. "Intent-Driven Natural Language Interface: A Hybrid LLM + Intent Classification Approach." _Medium / Data Science Collective_, 2024.
https://medium.com/data-science-collective/intent-driven-natural-language-interface-a-hybrid-llm-intent-classification-approach-e1d96ad6f35d

### 多意圖與序列推薦

[8] Li, Y., et al. "A Survey on Recent Advances in LLM-Based Multi-turn Dialogue Systems." _ACM Computing Surveys_, 2025.
https://dl.acm.org/doi/10.1145/3771090

[9] Liu, R., et al. "Multi-intent Aware Contrastive Learning for Sequential Recommendation." _arXiv:2409.08733_, 2024.
https://arxiv.org/html/2409.08733v1

[10] Wu, H., et al. "Balancing Accuracy and Efficiency in Multi-Turn Intent Classification for LLM-Powered Dialog Systems in Production." _arXiv:2411.12307_, 2024.
https://arxiv.org/html/2411.12307v1

### 攀岩路線推薦

[11] theCrag. "grAId — Whole-History Rating System for Climbing." theCrag, 2024.
https://www.thecrag.com/en/article/graid

[12] Draper, N., et al. "Content-Based Recommendations for Crags and Climbing Routes." _Springer LNCS_, 2022.
https://link.springer.com/chapter/10.1007/978-3-030-94751-4_33

### 推薦系統中的意圖多樣化

[13] Wen, Z., et al. "Beyond Item Dissimilarities: Diversifying by Intent in Recommender Systems." _KDD 2025_.
https://arxiv.org/abs/2405.12327

[14] Yu, J., et al. "MIND-RAG: Multimodal Context-Aware and Intent-Aware Retrieval-Augmented Generation." _ICCV Workshop_, 2025.
https://openaccess.thecvf.com/content/ICCV2025W/MRR%202025/papers/Yu_MIND-RAG_Multimodal_Context-Aware_and_Intent-Aware_Retrieval-Augmented_Generation_for_Educational_Publications_ICCVW_2025_paper.pdf

[15] IntentRec. "Incorporating Latent User Intent via Contrastive Alignment for Sequential Recommendation." _ScienceDirect_, 2025.
https://www.sciencedirect.com/science/article/abs/pii/S156742232500047X
