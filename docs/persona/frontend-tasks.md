# 人物誌前端任務清單

> 建立日期：2026-01-18
> 更新日期：2026-01-18
> 關聯文件：`persona-content-redesign.md`, `persona-creation-ux-improvement.md`, `persona-page-layout.md`

---

## 實作狀態總覽

| 類別 | 已完成 | 待完成 | 完成率 |
|-----|--------|--------|--------|
| 型別與資料結構 | 6 | 0 | 100% |
| 系統預設常量 | 3 | 0 | 100% |
| 標籤系統組件 | 8 | 0 | 100% |
| 一句話系列組件 | 4 | 0 | 100% |
| 深度故事組件 | 7 | 0 | 100% |
| 編輯器整合 | 6 | 0 | 100% |
| 展示組件 | 8 | 0 | 100% |
| 進階功能 | 0 | 5 | 0% |

**整體完成率：約 90%**

---

## ✅ 已完成項目

### 型別與資料結構 (100% 完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| FE-001 | BiographyV2 型別定義 | `src/lib/types/biography-v2.ts` | ✅ 完成 |
| FE-002 | 標籤系統型別 (TagDimension, TagOption, BiographyTagsV2) | `src/lib/types/biography-v2.ts` | ✅ 完成 |
| FE-003 | 一句話系列型別 (OneLinerQuestion, OneLinerAnswer) | `src/lib/types/biography-v2.ts` | ✅ 完成 |
| FE-004 | 深度故事型別 (StoryCategory, StoryQuestion, StoryAnswer) | `src/lib/types/biography-v2.ts` | ✅ 完成 |
| FE-005 | 資料轉換函數 (transformBackendToBiographyV2 等) | `src/lib/types/biography-v2.ts` | ✅ 完成 |
| FE-006 | ContentSource, ExtensibleItem 型別 | `src/lib/types/biography-v2.ts` | ✅ 完成 |

### 系統預設常量 (100% 完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| FE-007 | 系統預設標籤維度 (11 個維度) | `src/lib/constants/biography-tags.ts` | ✅ 完成 |
| FE-008 | 系統預設標籤選項 (70+ 選項) | `src/lib/constants/biography-tags.ts` | ✅ 完成 |
| FE-009 | 系統預設一句話問題 (10 個問題) | `src/lib/constants/biography-questions.ts` | ✅ 完成 |
| FE-010 | 系統預設故事分類 (6 個分類) | `src/lib/constants/biography-questions.ts` | ✅ 完成 |
| FE-011 | 系統預設故事問題 (31 個問題) | `src/lib/constants/biography-questions.ts` | ✅ 完成 |

### 編輯器組件 (大部分完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| FE-012 | TagChip 基礎組件 | `src/components/biography/shared/TagChip.tsx` | ✅ 完成 |
| FE-013 | TagSelector 編輯組件 | `src/components/biography/shared/TagSelector.tsx` | ✅ 完成 |
| FE-014 | TagsSection 編輯區塊 | `src/components/biography/editor/TagsSection.tsx` | ✅ 完成 |
| FE-015 | OneLinersSection 編輯區塊 | `src/components/biography/editor/OneLinersSection.tsx` | ✅ 完成 |
| FE-016 | CategoryAccordion 組件 | `src/components/biography/shared/CategoryAccordion.tsx` | ✅ 完成 |
| FE-017 | StoriesSection 編輯區塊 | `src/components/biography/editor/StoriesSection.tsx` | ✅ 完成 |
| FE-018 | StoryEditModal 組件 | `src/components/biography/editor/StoryEditModal.tsx` | ✅ 完成 |
| FE-019 | RandomRecommend 組件 | `src/components/biography/editor/RandomRecommend.tsx` | ✅ 完成 |
| FE-020 | PrivacyBanner 組件 | `src/components/biography/editor/PrivacyBanner.tsx` | ✅ 完成 |
| FE-021 | ProgressIndicator 組件 | `src/components/biography/editor/ProgressIndicator.tsx` | ✅ 完成 |
| FE-022 | BasicInfoSection 組件 | `src/components/biography/editor/BasicInfoSection.tsx` | ✅ 完成 |
| FE-023 | FixedBottomBar 組件 | `src/components/biography/editor/FixedBottomBar.tsx` | ✅ 完成 |
| FE-024 | AutoSaveIndicator 組件 | `src/components/biography/shared/AutoSaveIndicator.tsx` | ✅ 完成 |
| FE-025 | ProfileEditor 主組件 | `src/components/biography/editor/ProfileEditor.tsx` | ✅ 完成 |
| FE-026 | ClimbingFootprintsEditorSection | `src/components/biography/editor/ClimbingFootprintsEditorSection.tsx` | ✅ 完成 |

### 展示組件 (100% 完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| FE-027 | BiographyTags 展示組件 | `src/components/biography/display/BiographyTags.tsx` | ✅ 完成 |
| FE-028 | BiographyOneLiners 展示組件 | `src/components/biography/display/BiographyOneLiners.tsx` | ✅ 完成 |
| FE-029 | BiographyStories 展示組件 | `src/components/biography/display/BiographyStories.tsx` | ✅ 完成 |
| FE-030 | BiographyHero 展示組件 | `src/components/biography/display/BiographyHero.tsx` | ✅ 完成 |
| FE-031 | BiographyDetailPage 組件 | `src/components/biography/display/BiographyDetailPage.tsx` | ✅ 完成 |
| FE-032 | HeroSection 組件 | `src/components/biography/profile/HeroSection.tsx` | ✅ 完成 |
| FE-033 | QuickFactsSection 組件 | `src/components/biography/profile/QuickFactsSection.tsx` | ✅ 完成 |
| FE-034 | EmptyState 組件 | `src/components/biography/display/EmptyState.tsx` | ✅ 完成 |
| FE-035 | PrivateEmptyState 組件 | `src/components/biography/display/PrivateEmptyState.tsx` | ✅ 完成 |
| FE-036 | AnonymousAvatar 組件 | `src/components/biography/display/AnonymousAvatar.tsx` | ✅ 完成 |

### 用戶自訂內容功能 (100% 完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| FE-P1-001 | AddCustomTagModal 組件 | `src/components/biography/editor/AddCustomTagModal.tsx` | ✅ 完成 |
| FE-P1-002 | AddCustomDimensionModal 組件 | `src/components/biography/editor/AddCustomDimensionModal.tsx` | ✅ 完成 |
| FE-P1-003 | AddCustomOneLinerModal 組件 | `src/components/biography/editor/AddCustomOneLinerModal.tsx` | ✅ 完成 |
| FE-P1-004 | AddCustomStoryModal 組件 | `src/components/biography/editor/AddCustomStoryModal.tsx` | ✅ 完成 |

### 手機版優化 (100% 完成)

| 編號 | 任務 | 檔案 | 狀態 |
|-----|------|------|------|
| FE-P2-001 | TagsBottomSheet 組件 | `src/components/biography/editor/TagsBottomSheet.tsx` | ✅ 完成 |
| FE-P2-002 | StoryEditFullscreen 組件 | `src/components/biography/editor/StoryEditFullscreen.tsx` | ✅ 完成 |

---

## 🔲 待完成項目

### Phase 4: 進階功能 (P2)

#### FE-P4-001: 正常化訊息 Banner
- **檔案**: `src/components/biography/editor/NormalizationBanner.tsx` (新增)
- **優先級**: P2
- **說明**: 顯示社群統計數據，降低用戶焦慮
- **驗收標準**:
  - [ ] 「你知道嗎？」標題
  - [ ] 社群統計數據
  - [ ] 可收合

#### FE-P4-002: 用戶旅程階段追蹤
- **檔案**: `src/lib/hooks/useUserJourneyStage.ts` (新增)
- **優先級**: P2
- **說明**: 追蹤用戶在人物誌填寫的階段
- **驗收標準**:
  - [ ] 階段定義 (觀眾 → 私密記錄 → 公開分享)
  - [ ] 階段變更偵測
  - [ ] 階段引導訊息

#### FE-P4-003: 階段引導訊息組件
- **檔案**: `src/components/biography/editor/JourneyGuide.tsx` (新增)
- **優先級**: P2
- **說明**: 根據用戶階段顯示不同引導訊息
- **驗收標準**:
  - [ ] 「試著寫一則，只有你看得到」
  - [ ] 「想讓其他岩友也看到嗎？」
  - [ ] 可關閉

#### FE-P4-004: 曝光邀請 Modal
- **檔案**: `src/components/biography/editor/ExposureInviteModal.tsx` (新增)
- **優先級**: P2
- **說明**: 當用戶累積足夠私密故事後，邀請公開
- **驗收標準**:
  - [ ] 「你已經記錄了 X 則故事！」
  - [ ] 三個選項 (公開/維持私密/匿名)
  - [ ] 不再顯示選項

#### FE-P4-005: 正向回饋通知
- **檔案**: `src/components/shared/PositiveFeedbackToast.tsx` (新增)
- **優先級**: P2
- **說明**: 當用戶公開故事並收到回饋時的通知
- **驗收標準**:
  - [ ] 「有 X 位岩友喜歡你的故事」
  - [ ] 顯示回饋摘要
  - [ ] 點擊查看詳情

---

## 現有組件檔案結構

```
src/components/biography/
├── display/                          # 展示組件 ✅
│   ├── AnonymousAvatar.tsx           # ✅ 完成 (新增)
│   ├── BiographyDetailPage.tsx       # ✅ 完成
│   ├── BiographyFootprints.tsx       # ✅ 完成
│   ├── BiographyGallery.tsx          # ✅ 完成
│   ├── BiographyHero.tsx             # ✅ 完成
│   ├── BiographyOneLiners.tsx        # ✅ 完成
│   ├── BiographySocials.tsx          # ✅ 完成
│   ├── BiographyStories.tsx          # ✅ 完成
│   ├── BiographyTags.tsx             # ✅ 完成
│   ├── EmptyState.tsx                # ✅ 完成
│   ├── PrivateEmptyState.tsx         # ✅ 完成 (新增)
│   └── StoryCard.tsx                 # ✅ 完成
├── editor/                           # 編輯組件 ✅
│   ├── AddCustomDimensionModal.tsx   # ✅ 完成 (新增)
│   ├── AddCustomOneLinerModal.tsx    # ✅ 完成 (新增)
│   ├── AddCustomStoryModal.tsx       # ✅ 完成 (新增)
│   ├── AddCustomTagModal.tsx         # ✅ 完成 (新增)
│   ├── BasicInfoSection.tsx          # ✅ 完成
│   ├── ClimbingFootprintsEditorSection.tsx # ✅ 完成
│   ├── FixedBottomBar.tsx            # ✅ 完成
│   ├── OneLinersSection.tsx          # ✅ 完成
│   ├── PrivacyBanner.tsx             # ✅ 完成
│   ├── ProfileEditor.tsx             # ✅ 完成
│   ├── ProfileEditorV2Wrapper.tsx    # ✅ 完成
│   ├── ProgressIndicator.tsx         # ✅ 完成
│   ├── RandomRecommend.tsx           # ✅ 完成
│   ├── SocialLinksEditorSection.tsx  # ✅ 完成
│   ├── StoriesSection.tsx            # ✅ 完成
│   ├── StoryEditFullscreen.tsx       # ✅ 完成 (新增)
│   ├── StoryEditModal.tsx            # ✅ 完成
│   ├── TagsBottomSheet.tsx           # ✅ 完成 (新增)
│   └── TagsSection.tsx               # ✅ 完成
├── shared/                           # 共用組件
│   ├── AutoSaveIndicator.tsx         # ✅ 完成
│   ├── CategoryAccordion.tsx         # ✅ 完成
│   ├── TagChip.tsx                   # ✅ 完成
│   └── TagSelector.tsx               # ✅ 完成
├── profile/                          # Profile 展示組件
│   ├── HeroSection.tsx               # ✅ 完成
│   ├── QuickFactsSection.tsx         # ✅ 完成
│   ├── ChapterMeeting.tsx            # ✅ 完成
│   ├── ChapterMeaning.tsx            # ✅ 完成
│   ├── ChapterAdvice.tsx             # ✅ 完成
│   ├── ChapterBucketList.tsx         # ✅ 完成
│   ├── ClimbingFootprintsSection.tsx # ✅ 完成
│   ├── CompleteStoriesSection.tsx    # ✅ 完成
│   ├── FeaturedStoriesSection.tsx    # ✅ 完成
│   └── StoryModal.tsx                # ✅ 完成
├── explore/                          # 探索組件
│   ├── category-explorer.tsx         # ✅ 完成
│   ├── location-explorer.tsx         # ✅ 完成
│   ├── recent-completed-stories.tsx  # ✅ 完成
│   └── trending-goals.tsx            # ✅ 完成
└── stats/                            # 統計組件
    ├── badge-card.tsx                # ✅ 完成
    ├── badge-icon.tsx                # ✅ 完成
    ├── badge-showcase.tsx            # ✅ 完成
    ├── community-stats.tsx           # ✅ 完成
    ├── progress-chart.tsx            # ✅ 完成
    └── stats-overview.tsx            # ✅ 完成
```

---

## 待完成任務總計

| 優先級 | 任務數 | 說明 |
|-------|--------|------|
| P1 | 0 | 全部完成 |
| P2 | 5 | 進階功能（正常化訊息、用戶旅程追蹤等） |

**總計：5 項待完成任務 (P2 優先級)**

---

## 變更紀錄

| 日期 | 版本 | 變更內容 |
|-----|-----|---------|
| 2026-01-18 | v1.0 | 初版建立 |
| 2026-01-18 | v2.0 | 重新盤點已實作項目，更新任務狀態 |
| 2026-01-18 | v3.0 | 完成所有 P1 任務：用戶自訂內容 Modal、手機版優化、隱私功能 |
