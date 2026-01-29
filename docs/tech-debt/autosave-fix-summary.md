# 人物誌自動儲存完整修正

## 問題描述

用戶反映在編輯人物誌時，自動儲存間隔太短（1.5 秒），導致：
- 打字時頻繁出現「儲存中」轉圈圈
- 內容被回覆到上次儲存的狀態
- 編輯體驗被中斷

## 根本原因

1. **Debounce 間隔過短**：原設定為 1.5 秒
2. **狀態覆蓋問題**：儲存時父組件會更新 `biography` prop，覆蓋正在編輯的內容
3. **缺乏 maxWait**：持續編輯時可能永遠不會儲存
4. **阻塞式儲存**：儲存時顯示 loading 狀態，影響使用體驗

## 解決方案

### 1. 新增 `useDebouncedCallback` Hook

**檔案**: `src/lib/hooks/useDebouncedCallback.ts`

提供更強大的 debounce 功能：
- 支援 `delay`：停止輸入後的延遲時間
- 支援 `maxWait`：持續輸入時的最大等待時間

```typescript
const debouncedFn = useDebouncedCallback(
  callback,
  {
    delay: 5000,      // 停止輸入 5 秒後執行
    maxWait: 15000    // 持續輸入也至少每 15 秒執行一次
  }
)
```

### 2. 本地草稿管理

**檔案**: `src/components/biography/editor/ProfileEditor.tsx`

#### 主要變更：

**a) 使用本地 state 維護草稿**
```typescript
const [localBiography, setLocalBiography] = useState(biography)
```

**b) 追蹤編輯狀態**
```typescript
const isEditingRef = useRef(false)
const lastSavedBiographyRef = useRef(biography)
const isSavingRef = useRef(false)
```

**c) 智能同步外部更新**
```typescript
useEffect(() => {
  // 只在非編輯狀態且非儲存中時同步外部更新
  if (!isEditingRef.current && !isSavingRef.current) {
    setLocalBiography(biography)
    lastSavedBiographyRef.current = biography
  }
}, [biography])
```

**d) 樂觀更新**
```typescript
const handleChange = useCallback((updates: Partial<BiographyV2>) => {
  setLocalBiography((prev) => {
    const newBio = { ...prev, ...updates }
    isEditingRef.current = true

    // 立即通知父組件（不等待儲存）
    onChange(updates)

    // 觸發防抖儲存
    debouncedSave(newBio)

    return newBio
  })
}, [onChange, debouncedSave])
```

### 3. 改善的自動儲存機制

```typescript
const debouncedSave = useDebouncedCallback(
  async (bioToSave: BiographyV2) => {
    try {
      isSavingRef.current = true
      setSaving()
      await onSave(bioToSave)
      lastSavedBiographyRef.current = bioToSave
      setSaved()
      isEditingRef.current = false
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗')
    } finally {
      isSavingRef.current = false
    }
  },
  {
    delay: 5000,      // 停止輸入 5 秒後儲存
    maxWait: 15000    // 持續編輯也至少每 15 秒儲存一次
  }
)
```

## 技術優勢

### 1. 樂觀更新（Optimistic Updates）
- UI 立即反應使用者輸入
- 背景靜默儲存，不阻塞編輯
- 只在失敗時才顯示錯誤

### 2. 草稿保護
- 使用本地 state 維護編輯中的內容
- 避免外部更新覆蓋正在編輯的內容
- 使用 ref 追蹤狀態，避免不必要的重渲染

### 3. 智能 Debounce
- `delay: 5000ms`：使用者停止輸入 5 秒後儲存
- `maxWait: 15000ms`：即使持續輸入，也至少每 15 秒儲存一次
- 避免儲存過於頻繁或永遠不儲存

### 4. 狀態隔離
- 使用 `useRef` 追蹤編輯狀態，不觸發重渲染
- 清楚區分「正在編輯」、「儲存中」、「已儲存」狀態

## 使用者體驗改善

### 修正前：
- ❌ 每 1.5 秒就可能觸發儲存
- ❌ 儲存時顯示轉圈圈，中斷編輯
- ❌ 內容可能被回覆到舊版本
- ❌ 頻繁的網路請求

### 修正後：
- ✅ 停止輸入 5 秒後才儲存
- ✅ 持續輸入時至少每 15 秒儲存一次
- ✅ UI 立即反應，背景靜默儲存
- ✅ 不會覆蓋正在編輯的內容
- ✅ 減少網路請求次數

## 測試建議

1. **正常編輯流程**
   - 輸入文字後停止 5 秒，應該觸發儲存
   - 檢查自動儲存指示器狀態變化

2. **持續編輯**
   - 連續輸入超過 15 秒，應該至少儲存一次
   - 驗證內容沒有丟失

3. **快速切換欄位**
   - 快速在不同欄位間輸入
   - 確認所有變更都被保存

4. **錯誤處理**
   - 模擬網路錯誤
   - 確認錯誤訊息正確顯示
   - 確認失敗後可以重試

5. **外部更新**
   - 模擬外部資料更新（如其他裝置編輯）
   - 確認不會覆蓋正在編輯的內容

## 相關檔案

- `src/lib/hooks/useDebouncedCallback.ts` - 新增的 debounce hook
- `src/components/biography/editor/ProfileEditor.tsx` - 重構的編輯器
- `src/components/biography/editor/ProfileEditorV2Wrapper.tsx` - 父組件（未修改）

## 未來可能的改進

1. **衝突偵測**
   - 加入版本控制或時間戳
   - 偵測並提示多裝置編輯衝突

2. **離線支援**
   - 使用 IndexedDB 本地儲存
   - 網路恢復後自動同步

3. **更精細的儲存策略**
   - 區分不同欄位的儲存優先度
   - 圖片上傳與文字編輯分開處理

4. **使用 TanStack Query**
   - 利用內建的樂觀更新和錯誤處理
   - 更好的快取管理

## 注意事項

- ⚠️ 使用者在 5 秒內快速離開頁面，可能有未儲存的變更
- ⚠️ 需要確保父組件 (Wrapper) 的 `handleSave` 正確實作
- ⚠️ 儲存失敗時需要明確提示使用者

## 變更日期

2026-01-23
