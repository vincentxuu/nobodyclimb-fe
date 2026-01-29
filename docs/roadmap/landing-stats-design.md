# Landing 頁面「故事展示區」設計

> **對應設計文件**: [docs/service-design/ux-first-mile.md](../service-design/ux-first-mile.md)
> **建立日期**: 2026-01-27

---

## 核心理念

**故事才是主角，統計只是配角。**

目標：讓用戶覺得「原來我也可以寫」

---

## 設計方案

```
┌─────────────────────────────────────────────────────────────┐
│  🗣️ 他們也曾經覺得自己「沒什麼特別」                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  「第一次戶外被雨淋，什麼都沒爬成，                          │
│    但那天是我最難忘的攀岩回憶。」                            │
│                                    — @菜鳥阿華              │
│                                                             │
│   [ 🤘 我也是 12 ]                                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📊 這裡的岩友們                                            │
│  ├─ 89 人被朋友拉進攀岩坑                                   │
│  ├─ 最常出沒：龍洞、內湖運動中心                            │
│  └─ 156 個攀岩故事正在累積中                                │
│                                                             │
│                  [ 我也想分享我的故事 ]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 元素說明

| 元素 | 說明 | 資料來源 |
|-----|------|---------|
| 區塊標題 | 「他們也曾經覺得自己沒什麼特別」 | 固定文案 |
| 故事引言 | 真實用戶的故事片段 | `biography_stories` |
| 用戶署名 | 顯示名稱 | `users.display_name` |
| 「我也是」按鈕 | 快速反應 + 計數 | `content_reactions` |
| 社群統計 | 開始方式、常出沒、故事數 | 多個來源 |
| CTA 按鈕 | 「我也想分享我的故事」 | 導向註冊/編輯頁 |

---

## 需要的資料

| 統計項目 | 資料來源 | API 狀態 |
|---------|---------|:--------:|
| 精選故事 | `biography_stories` | ⚠️ 需新增 |
| 開始攀岩的方式 | `choice_answers` | ⚠️ 需新增 |
| 常出沒岩場 | `biographies.frequent_locations` | ⚠️ 需新增 |
| 故事總數 | `biographies` count | ✅ 已有 |
| 「我也是」計數 | `content_reactions` | ✅ 已有 |

---

## API 設計

### GET /api/v1/stats/community

公開 API，取得首頁故事展示區所需資料。

**Response：**
```json
{
  "success": true,
  "data": {
    "featuredStory": {
      "id": "story-123",
      "content": "第一次戶外被雨淋，什麼都沒爬成，但那天是我最難忘的攀岩回憶。",
      "author": {
        "displayName": "菜鳥阿華",
        "slug": "rookie-hua"
      },
      "reactions": {
        "me_too": 12
      }
    },
    "stats": {
      "friendInvited": 89,
      "topLocations": ["龍洞", "內湖運動中心"],
      "totalStories": 156
    }
  }
}
```

---

## 故事篩選條件

展示的故事應符合：

1. **用戶同意公開** - `visibility = 'public'`
2. **獲得互動** - 有「我也是」反應的優先
3. **有共鳴感** - 描述常見經歷（第一次、失敗、成長）

---

## 實作清單

- [x] 後端：新增 `GET /api/v1/stats/community` API
- [x] 後端：統計 `choice_answers` 中 `friend_invited` 的數量
- [x] 後端：統計 `frequent_locations` 的熱門地點
- [x] 後端：取得精選故事（按「我也是」數量排序）
- [x] 前端：新增 `StoryShowcaseSection` 組件
- [x] 前端：整合到首頁

---

## 相關文件

- [First Mile UX 設計](../service-design/ux-first-mile.md)
- [First Mile UX 完成度報告](./ux-first-mile-completion.md)
