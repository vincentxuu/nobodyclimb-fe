# 技術架構

## 技術選型

基於現有專案技術棧，遊戲系統採用：

| 層面 | 技術 | 說明 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 與主專案一致 |
| 語言 | TypeScript 5.9 | 型別安全 |
| 狀態管理 | Zustand | 遊戲狀態管理 |
| 動畫 | Framer Motion | 掉落動畫、轉場效果 |
| 樣式 | TailwindCSS | 與主專案風格一致 |
| 音效 | Web Audio API / Howler.js | 遊戲音效 |
| 資料庫 | Cloudflare D1 | 題庫與成績儲存 |

---

## 目錄結構

### 前端結構

```
src/
├── app/
│   └── games/
│       └── rope-system/
│           ├── page.tsx                    # 遊戲首頁（類別選擇）
│           ├── layout.tsx                  # 遊戲 Layout
│           ├── learn/
│           │   └── [categoryId]/
│           │       └── page.tsx            # 學習模式
│           ├── exam/
│           │   ├── page.tsx                # 考試列表
│           │   └── [examId]/
│           │       └── page.tsx            # 考試進行
│           ├── result/
│           │   └── [attemptId]/
│           │       └── page.tsx            # 成績結果
│           └── certificate/
│               └── [certId]/
│                   └── page.tsx            # 認證證書
│
├── components/
│   └── games/
│       └── rope-system/
│           ├── GameCanvas.tsx              # 主遊戲畫布
│           ├── ClimberCharacter.tsx        # 攀岩者角色
│           ├── FallAnimation.tsx           # 掉落動畫
│           ├── QuestionCard.tsx            # 題目卡片
│           ├── ChoiceQuestion.tsx          # 選擇題組件
│           ├── OrderingQuestion.tsx        # 排序題組件
│           ├── OptionButton.tsx            # 選項按鈕
│           ├── ProgressBar.tsx             # 進度條
│           ├── ScoreDisplay.tsx            # 分數顯示
│           ├── LifeDisplay.tsx             # 生命值顯示
│           ├── TimerDisplay.tsx            # 計時器
│           ├── CategoryCard.tsx            # 類別選擇卡片
│           ├── ResultModal.tsx             # 結果彈窗
│           ├── ExplanationPanel.tsx        # 解釋面板
│           └── SoundToggle.tsx             # 音效開關
│
├── lib/
│   └── games/
│       └── rope-system/
│           ├── types.ts                    # TypeScript 型別
│           ├── constants.ts                # 常數定義
│           ├── sounds.ts                   # 音效管理
│           ├── scoring.ts                  # 計分邏輯
│           └── api.ts                      # API 呼叫
│
└── store/
    └── ropeGameStore.ts                    # 遊戲狀態 Store
```

### 後端結構（backend/）

```
backend/src/
├── routes/
│   └── games/
│       ├── index.ts                        # 路由入口
│       ├── categories.ts                   # 類別 API
│       ├── questions.ts                    # 題目 API
│       ├── exams.ts                        # 考試 API
│       ├── attempts.ts                     # 作答紀錄 API
│       └── certifications.ts               # 認證 API
│
└── db/
    └── migrations/
        └── XXXX_create_game_tables.sql     # 遊戲相關資料表
```

---

## 組件設計

### GameCanvas（主遊戲畫布）

```tsx
interface GameCanvasProps {
  mode: 'learn' | 'exam'
  categoryId?: string
  examId?: string
}

// 負責整合所有遊戲元素
// - 左側：攀岩者角色與場景
// - 右側：題目與選項
// - 底部：進度條與分數
```

### ClimberCharacter（攀岩者角色）

```tsx
interface ClimberCharacterProps {
  position: number          // 目前位置（0-100）
  state: 'idle' | 'climbing' | 'falling' | 'celebrating'
  onFallComplete?: () => void
}

// 使用 Framer Motion 控制動畫
// - idle: 待機晃動
// - climbing: 往上移動
// - falling: 掉落動畫
// - celebrating: 完成慶祝
```

### FallAnimation（掉落動畫）

```tsx
interface FallAnimationProps {
  startPosition: number
  endPosition: number
  onComplete: () => void
}

// 階梯式掉落效果
// 1. 角色開始晃動
// 2. 快速下墜
// 3. 撞擊平台反彈
// 4. 繼續下墜直到目標位置
// 5. 播放撞擊音效
```

### QuestionCard（題目卡片）

```tsx
interface QuestionCardProps {
  question: Question
  onAnswer: (answer: string | string[]) => void
  showResult?: boolean
  isCorrect?: boolean
  disabled?: boolean
}

// 根據題目類型渲染不同組件
// - choice: ChoiceQuestion
// - ordering: OrderingQuestion
// - situation: ChoiceQuestion（情境題本質是選擇題）
```

---

## 狀態管理

### ropeGameStore

```typescript
interface RopeGameState {
  // 遊戲設定
  mode: 'learn' | 'exam'
  category: Category | null
  exam: Exam | null

  // 題目狀態
  questions: Question[]
  currentIndex: number
  answers: Record<string, string | string[]>

  // 遊戲狀態
  score: number
  lives: number
  combo: number
  timeRemaining: number | null

  // UI 狀態
  isAnswered: boolean
  showExplanation: boolean
  isFalling: boolean
  isComplete: boolean

  // 音效設定
  soundEnabled: boolean

  // Actions
  startGame: (mode: 'learn' | 'exam', categoryId?: string, examId?: string) => void
  submitAnswer: (answer: string | string[]) => void
  nextQuestion: () => void
  toggleSound: () => void
  resetGame: () => void
}
```

### 狀態流程

```
開始遊戲
    │
    ▼
載入題目 → questions[], currentIndex = 0
    │
    ▼
顯示題目 → isAnswered = false
    │
    ▼
玩家作答 → submitAnswer()
    │
    ├── 正確 → score += 100, combo++
    │         播放正確音效
    │         (學習模式) showExplanation = true
    │
    └── 錯誤 → lives--, combo = 0
              isFalling = true
              播放掉落音效
              (學習模式) showExplanation = true
    │
    ▼
下一題 → currentIndex++
    │
    ├── 還有題目 → 回到「顯示題目」
    │
    └── 沒有題目 or lives = 0 → isComplete = true
                                顯示結果
```

---

## API 設計

### 題目相關

```
GET  /api/v1/games/rope-system/categories
     回傳所有類別列表

GET  /api/v1/games/rope-system/categories/:id/questions
     回傳指定類別的所有題目
     Query: ?limit=20&random=true

GET  /api/v1/games/rope-system/questions/:id
     回傳單一題目詳情
```

### 考試相關

```
GET  /api/v1/games/rope-system/exams
     回傳可用考試列表

GET  /api/v1/games/rope-system/exams/:id
     回傳考試詳情（含題目）

POST /api/v1/games/rope-system/exams/:id/start
     開始考試，建立 attempt 紀錄

POST /api/v1/games/rope-system/attempts/:id/submit
     提交考試答案
     Body: { answers: { questionId: answer } }
```

### 成績相關

```
GET  /api/v1/games/rope-system/attempts/:id
     回傳作答紀錄與成績

GET  /api/v1/games/rope-system/user/history
     回傳使用者歷史紀錄

GET  /api/v1/games/rope-system/user/certifications
     回傳使用者認證列表
```

---

## 音效系統

### 音效列表

| 音效 ID | 觸發時機 | 檔案 |
|---------|---------|------|
| correct | 答對時 | /sounds/correct.mp3 |
| wrong | 答錯時 | /sounds/wrong.mp3 |
| fall | 掉落中 | /sounds/fall.mp3 |
| impact | 撞擊平台 | /sounds/impact.mp3 |
| levelUp | 進入下一關 | /sounds/level-up.mp3 |
| complete | 完成所有題目 | /sounds/complete.mp3 |
| gameOver | 生命歸零 | /sounds/game-over.mp3 |

### 音效管理器

```typescript
// lib/games/rope-system/sounds.ts

class SoundManager {
  private sounds: Map<string, HTMLAudioElement>
  private enabled: boolean

  constructor() {
    this.sounds = new Map()
    this.enabled = true
    this.preload()
  }

  preload() {
    const soundFiles = ['correct', 'wrong', 'fall', 'impact', ...]
    soundFiles.forEach(id => {
      const audio = new Audio(`/sounds/games/${id}.mp3`)
      audio.preload = 'auto'
      this.sounds.set(id, audio)
    })
  }

  play(id: string) {
    if (!this.enabled) return
    const sound = this.sounds.get(id)
    if (sound) {
      sound.currentTime = 0
      sound.play()
    }
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }
}

export const soundManager = new SoundManager()
```

---

## 動畫規格

### 掉落動畫

```typescript
// Framer Motion variants

const fallVariants = {
  idle: {
    y: 0,
    rotate: 0,
  },
  falling: {
    y: [0, 50, 45, 100, 95, 150, 145, 200],  // 階梯式掉落
    rotate: [0, 15, -10, 20, -15, 10, -5, 0],  // 搖晃
    transition: {
      duration: 0.8,
      ease: "easeIn",
      times: [0, 0.15, 0.2, 0.35, 0.4, 0.55, 0.6, 1],
    },
  },
}

// 撞擊效果
const impactVariants = {
  initial: { scale: 1 },
  impact: {
    scale: [1, 1.2, 0.9, 1],
    transition: { duration: 0.3 },
  },
}
```

### 正確答案動畫

```typescript
const correctVariants = {
  initial: { scale: 1, borderColor: '#e5e5e5' },
  correct: {
    scale: [1, 1.05, 1],
    borderColor: '#FFE70C',
    backgroundColor: 'rgba(255, 231, 12, 0.1)',
    transition: { duration: 0.3 },
  },
}
```

### 錯誤答案動畫

```typescript
const wrongVariants = {
  initial: { x: 0 },
  wrong: {
    x: [-5, 5, -5, 5, 0],  // 左右晃動
    borderColor: '#ef4444',
    transition: { duration: 0.3 },
  },
}
```

---

## 響應式設計

### 斷點配置

| 裝置 | 寬度 | 佈局 |
|------|------|------|
| 桌面 | ≥1024px | 左右並排（角色 + 題目）|
| 平板 | 768-1023px | 上下排列 |
| 手機 | <768px | 僅顯示題目，角色縮小至頂部 |

### 手機版調整
- 選項改為全寬按鈕
- 掉落動畫改為頂部小角色
- 進度條移至底部固定
- 增加觸控友善的點擊區域

---

## 效能優化

### 圖片優化
- 使用 Next.js Image 組件
- 裝備圖示使用 SVG
- 預載入下一題的圖片

### 程式碼分割
- 遊戲頁面動態載入
- 音效檔案延遲載入
- 大型動畫組件懶載入

### 快取策略
- 題庫資料使用 TanStack Query 快取
- 靜態資源使用 Service Worker
- 考試進度存入 localStorage 防止意外離開
