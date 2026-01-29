以下是針對「已暫存(staged)變更」的 code review（繁體中文）。重點先列問題，再提供疑問與建議。

Findings

- 高：useDebouncedCallback 的 maxWait 會用「第一次呼叫時的參數」執行，導致持續編輯時最後一次內容沒被保存，寫入舊資料的風險。maxWaitTimeout 只在第一次呼叫設定，且
  callback 直接用當下的 args。建議把最新參數存到 ref，maxWait 觸發時取 ref 的最後值，或每次呼叫重設 maxWait 計時。src/lib/hooks/useDebouncedCallback.ts:50-56
- 中：ProfileEditor 的本地草稿同步在儲存失敗時可能卡住外部更新。isEditingRef 只有成功儲存才會回復 false，若儲存失敗後父層用新 props 更新（例如切換人物或重載），本地
  仍不會同步。可以在偵測 biography.id 變更時強制同步，或在保存失敗後允許同步一次。src/components/biography/editor/ProfileEditor.tsx:173-196
- 低：前端 hook 使用 NodeJS.Timeout 型別可能在僅 DOM lib 的環境出現型別不合（或需要額外型別）。建議改成 ReturnType<typeof setTimeout>。src/lib/hooks/
  useDebouncedCallback.ts:20-22

  疑問/假設

- useDebouncedCallback 中的 lastCallTimeRef 目前未使用（src/lib/hooks/useDebouncedCallback.ts:22）。是否原本打算做「距離上次呼叫時間」的邏輯？若不需要建議移除以免誤
  導。
- ProfileEditor 是否有「切換不同人物編輯」的情境？如果有，建議針對 biography.id 變更做同步策略。
