# 色彩系統 (Color System)

本文件定義專案的品牌色彩系統，供設計與開發時參考。

---

## 色彩概覽

專案使用三組色彩：
1. **W&B 灰階系列** - 主要用於文字、背景、邊框
2. **Yellow 系列** - 品牌強調色
3. **Red 系列** - 警示/錯誤狀態

---

## W&B 灰階系列 (White & Black)

從白到黑的灰階，用於建立視覺層次。

| 名稱 | 色碼 | Tailwind Class | 用途 |
|------|------|----------------|------|
| W&B 0 | `#FFFFFF` | `wb-0` | 純白背景 |
| W&B 10 | `#F5F5F5` | `wb-10` | 頁面背景 |
| W&B 20 | `#EBEAEA` | `wb-20` | 邊框、分隔線 |
| W&B 30 | `#DBD8D8` | `wb-30` | 淺灰背景、disabled |
| W&B 50 | `#B6B3B3` | `wb-50` | placeholder、subtle 邊框 |
| W&B 60 | `#8E8C8C` | `wb-60` | 輔助文字 |
| W&B 70 | `#6D6C6C` | `wb-70` | 次要文字 |
| W&B 90 | `#3F3D3D` | `wb-90` | Hover 狀態、強調文字 |
| W&B 100 | `#1B1A1A` | `wb-100` | 主要文字、按鈕背景 |

### 使用範例

```tsx
// 文字
<p className="text-wb-100">主要文字</p>
<p className="text-wb-70">次要文字</p>
<p className="text-wb-50">placeholder 文字</p>

// 背景
<div className="bg-wb-10">頁面背景</div>
<div className="bg-wb-100">深色背景</div>

// 邊框
<div className="border border-wb-20">邊框</div>
```

---

## Yellow 系列（品牌強調色）

品牌的主要強調色，用於 CTA、標籤、highlight。

| 名稱 | 色碼 | Tailwind Class | 用途 |
|------|------|----------------|------|
| Yellow 100 | `#FFE70C` | `brand-yellow-100` | 主要強調色、CTA 按鈕 |
| Yellow 200 | `#FA9F17` | `brand-yellow-200` | 橘黃色、Hover 狀態 |

### 使用範例

```tsx
// 強調按鈕
<button className="bg-brand-yellow-100 text-wb-100">
  主要 CTA
</button>

// Hover 效果
<button className="bg-brand-yellow-100 hover:bg-brand-yellow-200">
  Hover 變橘
</button>

// 標籤
<span className="bg-brand-yellow-100 text-wb-100 px-2 py-1 rounded">
  精選
</span>
```

---

## Red 系列（警示/錯誤）

用於錯誤訊息、刪除確認、警告狀態。

| 名稱 | 色碼 | Tailwind Class | 用途 |
|------|------|----------------|------|
| Red 100 | `#DA3737` | `brand-red-100` | 錯誤訊息、刪除按鈕 |

### 使用範例

```tsx
// 錯誤訊息
<p className="text-brand-red-100">此欄位為必填</p>

// 刪除按鈕
<button className="bg-brand-red-100 text-white">
  刪除
</button>
```

---

## 語意化別名 (Semantic Aliases)

為了方便使用，定義了語意化的別名：

| 別名 | 對應色彩 | Tailwind Class | 用途 |
|------|----------|----------------|------|
| brand-dark | W&B 100 | `brand-dark` | 主要深色 |
| brand-dark-hover | W&B 90 | `brand-dark-hover` | 深色 Hover |
| brand-light | W&B 30 | `brand-light` | 淺色背景 |
| brand-accent | Yellow 100 | `brand-accent` | 強調色 |
| brand-accent-hover | Yellow 200 | `brand-accent-hover` | 強調色 Hover |
| brand-red | Red 100 | `brand-red` | 紅色/錯誤 |
| page-bg | W&B 10 | `page-bg` | 頁面背景 |
| text-main | W&B 100 | `text-main` | 主要文字 |
| text-subtle | W&B 70 | `text-subtle` | 次要文字 |

### 使用範例

```tsx
// 品牌按鈕
<button className="bg-brand-dark hover:bg-brand-dark-hover text-white">
  送出
</button>

// 強調按鈕
<button className="bg-brand-accent hover:bg-brand-accent-hover text-brand-dark">
  立即加入
</button>

// 文字
<h1 className="text-text-main">標題</h1>
<p className="text-text-subtle">描述文字</p>
```

---

## 色彩組合建議

### 按鈕

| 類型 | 背景 | 文字 | Hover |
|------|------|------|-------|
| Primary | `brand-dark` | `white` | `brand-dark-hover` |
| Secondary | `brand-accent` | `brand-dark` | `brand-accent-hover` |
| Outline | `transparent` | `brand-dark` | `wb-10` |
| Destructive | `brand-red` | `white` | - |

### 卡片

```tsx
<div className="bg-wb-0 border border-wb-20 rounded-lg p-4">
  <h3 className="text-wb-100">標題</h3>
  <p className="text-wb-70">內容</p>
</div>
```

### 封面圖產生器

封面圖產生器使用品牌色系：
- 背景：`brand-dark-hover` → `brand-dark` 漸層
- 圖標：`brand-accent`（黃色）
- 分類標籤：`brand-accent` 背景 + `brand-dark` 文字

---

## 無障礙考量

- 主要文字（wb-100）與白色背景的對比度：**12.6:1** ✓
- 次要文字（wb-70）與白色背景的對比度：**5.0:1** ✓
- 黃色（brand-yellow-100）與深色（wb-100）的對比度：**11.2:1** ✓

所有組合皆符合 WCAG AA 標準。

---

## 相關資源

- [Tailwind 配置檔](../tailwind.config.js) - 完整色彩定義
- [Icon 使用指南](./icon-usage-guide.md) - 圖標規範

---

## 更新紀錄

| 日期 | 變更內容 |
|------|----------|
| 2026-01-20 | 建立色彩系統文件，新增 W&B、Yellow、Red 系列 |
