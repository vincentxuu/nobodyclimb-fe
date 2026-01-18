# 攀岩部落格文章規劃

> 本資料夾包含 NobodyClimb 部落格文章的題材規劃與參考資料

## 文章總覽

| 分類 | 篇數 | 說明 |
|-----|-----|------|
| [competition](./competition/) | 4 | 賽事介紹 |
| [injury](./injury/) | 4 | 傷害防護 |
| [beginner](./beginner/) | 5 | 新手入門 |
| [gear](./gear/) | 4 | 裝備分享 |
| [skills](./skills/) | 5 | 技巧分享 |
| [training](./training/) | 4 | 訓練計畫 |
| [routes](./routes/) | 3 | 路線攻略 |
| [crags](./crags/) | 6 | 岩場開箱 |
| [gyms](./gyms/) | 2 | 岩館開箱 |
| [travel](./travel/) | 11 | 攀岩旅遊 |
| [community](./community/) | 4 | 社群資源 |

**總計：11 個分類、47 篇文章**

## 規劃文件

- [content-calendar.md](./content-calendar.md) - 時事行銷搭配規劃表
- [references.md](./references.md) - 參考資料來源彙整

## 文章分類對應專案 PostCategory

```typescript
type PostCategory =
  | 'beginner'      // 新手入門
  | 'news'          // 新聞動態
  | 'gear'          // 裝備分享
  | 'skills'        // 技巧分享
  | 'training'      // 訓練計畫
  | 'routes'        // 路線攻略
  | 'crags'         // 岩場開箱
  | 'gyms'          // 岩館開箱
  | 'travel'        // 攀岩旅遊
  | 'competition'   // 賽事介紹
  | 'events'        // 活動介紹
  | 'community'     // 社群資源
  | 'injury'        // 傷害防護
```

## 使用方式

1. 每個分類資料夾內有該分類的所有文章規劃
2. 每篇文章包含：標題、內容大綱、參考來源
3. 撰寫文章時請參考 `references.md` 的來源連結
4. 配合時事發布時請參考 `content-calendar.md`
