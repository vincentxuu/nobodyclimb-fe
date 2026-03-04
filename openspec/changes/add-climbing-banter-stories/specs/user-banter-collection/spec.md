## ADDED Requirements

### Requirement: 收集幹話並附加個人故事

系統必須允許已認證使用者收集幹話到個人集合,並可選擇性地附加個人故事。個人故事必須支援富文本格式。所有故事預設為公開。

#### Scenario: 收集幹話不附加故事
- **WHEN** 已認證使用者點擊幹話的「收集」按鈕
- **WHEN** 使用者不填寫個人故事,直接提交
- **THEN** 系統建立 user_banter 記錄,personal_story 為空
- **THEN** 系統顯示成功訊息「已加入你的收集」
- **THEN** 幹話的 usage_count 增加 1

#### Scenario: 收集幹話並附加故事
- **WHEN** 已認證使用者點擊幹話的「收集」按鈕
- **WHEN** 使用者填寫個人故事並提交
- **THEN** 系統建立 user_banter 記錄,包含 personal_story
- **THEN** 系統顯示成功訊息
- **THEN** 故事會顯示在幹話詳情頁的故事列表中
- **THEN** 幹話的 usage_count 增加 1

#### Scenario: 重複收集同一幹話
- **WHEN** 使用者嘗試收集已在個人集合中的幹話
- **THEN** 系統顯示「你已經收集過這個幹話」
- **THEN** 系統提供「查看我的收集」或「編輯故事」選項

#### Scenario: 未登入狀態收集
- **WHEN** 未認證使用者嘗試收集幹話
- **THEN** 系統顯示登入提示

#### Scenario: 故事公開提示
- **WHEN** 使用者開啟收集對話框
- **THEN** 系統顯示明確提示「你的故事會公開顯示在幹話詳情頁」

### Requirement: 查看個人收集列表

系統必須在 `/profile/my-banters` 頁面顯示使用者的所有收集,支援排序和搜尋。

#### Scenario: 查看個人收集
- **WHEN** 已認證使用者前往 `/profile/my-banters` 頁面
- **THEN** 系統顯示該使用者所有收集的幹話
- **THEN** 每筆收集顯示幹話文字、個人故事、收集時間

#### Scenario: 空白收集列表
- **WHEN** 使用者尚未收集任何幹話
- **THEN** 系統顯示「你還沒有收集任何幹話」
- **THEN** 系統提供「去逛逛」按鈕連結至 `/banters`

#### Scenario: 依收集時間排序
- **WHEN** 使用者選擇「最新收集」排序
- **THEN** 系統按 created_at DESC 排序顯示收集

#### Scenario: 依幹話熱門度排序
- **WHEN** 使用者選擇「最熱門」排序
- **THEN** 系統按幹話的 usage_count + like_count 排序顯示

### Requirement: 編輯個人故事

系統必須允許使用者編輯自己收集的幹話的個人故事。編輯後必須更新 updated_at 時間戳。

#### Scenario: 編輯已存在的故事
- **WHEN** 使用者點擊自己收集的「編輯」按鈕
- **WHEN** 使用者修改個人故事並儲存
- **THEN** 系統更新 user_banter 記錄的 personal_story 和 updated_at
- **THEN** 系統顯示成功訊息「故事已更新」

#### Scenario: 新增故事到原本沒有故事的收集
- **WHEN** 使用者編輯原本沒有故事的收集
- **WHEN** 使用者填寫故事並儲存
- **THEN** 系統更新 personal_story 欄位
- **THEN** 故事開始顯示在幹話詳情頁

#### Scenario: 清空個人故事
- **WHEN** 使用者刪除所有故事內容並儲存
- **THEN** 系統將 personal_story 設為空字串
- **THEN** 故事不再顯示在幹話詳情頁

#### Scenario: 編輯他人的故事
- **WHEN** 使用者嘗試編輯其他使用者的故事
- **THEN** 系統返回 403 Forbidden 錯誤
- **THEN** 系統顯示「你無權編輯此故事」

### Requirement: 刪除收集

系統必須允許使用者從個人集合中移除幹話。刪除收集後,幹話的 usage_count 必須減少 1。

#### Scenario: 刪除收集
- **WHEN** 使用者點擊收集的「刪除」按鈕
- **WHEN** 使用者確認刪除
- **THEN** 系統刪除 user_banter 記錄
- **THEN** 收集從個人列表中消失
- **THEN** 幹話的 usage_count 減少 1
- **THEN** 如果有個人故事,故事也從幹話詳情頁移除

#### Scenario: 取消刪除
- **WHEN** 使用者點擊「刪除」按鈕
- **WHEN** 使用者在確認對話框點擊「取消」
- **THEN** 系統不執行刪除
- **THEN** 收集保持原狀

#### Scenario: 刪除他人的收集
- **WHEN** 使用者嘗試刪除其他使用者的收集
- **THEN** 系統返回 403 Forbidden 錯誤
- **THEN** 系統顯示「你無權刪除此收集」

### Requirement: 在幹話詳情頁顯示所有故事

系統必須在幹話詳情頁顯示所有使用者的公開故事,按讚數和建立時間排序。每個故事必須顯示作者資訊。

#### Scenario: 查看幹話的所有故事
- **WHEN** 使用者在幹話詳情頁查看故事區塊
- **THEN** 系統顯示所有有故事內容的 user_banter 記錄
- **THEN** 預設按 like_count DESC, created_at DESC 排序
- **THEN** 每個故事顯示作者頭像、使用者名稱、故事內容、讚數、留言數

#### Scenario: 故事作者標記
- **WHEN** 使用者查看自己的故事
- **THEN** 故事卡片顯示「你的故事」標記
- **THEN** 顯示「編輯」和「刪除」按鈕

#### Scenario: 其他人的故事
- **WHEN** 使用者查看其他人的故事
- **THEN** 不顯示編輯或刪除按鈕
- **THEN** 顯示作者使用者名稱,可點擊連結至個人頁面

### Requirement: 對個人故事按讚

系統必須允許已認證使用者對個人故事按讚。每個使用者只能對同一故事按讚一次。讚數必須即時更新。

#### Scenario: 對故事按讚
- **WHEN** 已認證使用者點擊故事的讚按鈕
- **THEN** 系統建立 like 記錄,entity_type='user_banter'
- **THEN** 讚按鈕變為「已讚」狀態
- **THEN** 故事的 like_count 增加 1

#### Scenario: 取消讚
- **WHEN** 使用者點擊已按讚的故事讚按鈕
- **THEN** 系統移除 like 記錄
- **THEN** 讚按鈕變為「未讚」狀態
- **THEN** 故事的 like_count 減少 1

#### Scenario: 對自己的故事按讚
- **WHEN** 使用者嘗試對自己的故事按讚
- **THEN** 系統允許按讚(無限制)

#### Scenario: 未登入狀態按讚
- **WHEN** 未認證使用者嘗試按讚故事
- **THEN** 系統顯示登入提示

### Requirement: 對個人故事留言

系統必須允許已認證使用者對個人故事留言。留言必須支援巢狀回覆。

#### Scenario: 對故事留言
- **WHEN** 已認證使用者在故事下方撰寫留言並提交
- **THEN** 系統建立 comment 記錄,entity_type='user_banter'
- **THEN** 留言出現在故事的留言列表中
- **THEN** 故事的 comment_count 增加 1

#### Scenario: 回覆故事留言
- **WHEN** 使用者點擊留言的回覆按鈕
- **WHEN** 使用者撰寫回覆並提交
- **THEN** 系統建立帶有 parent_id 的留言
- **THEN** 回覆顯示在父留言下方

#### Scenario: 未登入狀態留言
- **WHEN** 未認證使用者嘗試留言
- **THEN** 系統顯示登入提示

### Requirement: 對個人故事快速反應

系統必須允許已認證使用者對個人故事新增快速反應(我也是、+1、說得好)。每個使用者可對同一故事新增多種反應類型。

#### Scenario: 對故事新增反應
- **WHEN** 已認證使用者點擊故事的「+1」反應按鈕
- **THEN** 系統記錄反應,content_type='user_banter', reaction_type='plus_one'
- **THEN** 反應按鈕顯示啟用狀態
- **THEN** 「+1」反應數增加 1

#### Scenario: 移除故事反應
- **WHEN** 使用者點擊已啟用的反應按鈕
- **THEN** 系統移除反應
- **THEN** 反應按鈕顯示未啟用狀態
- **THEN** 反應數減少 1

#### Scenario: 未登入狀態反應
- **WHEN** 未認證使用者嘗試新增反應
- **THEN** 系統顯示登入提示

### Requirement: 統計個人收集數據

系統必須提供使用者個人收集的統計資訊,包括總收集數、有故事的收集數、總獲讚數。

#### Scenario: 查看個人統計
- **WHEN** 使用者在 `/profile/my-banters` 頁面查看統計區塊
- **THEN** 系統顯示「總收集數」(所有 user_banters 記錄數)
- **THEN** 系統顯示「已寫故事」(personal_story 不為空的記錄數)
- **THEN** 系統顯示「獲得的讚」(所有故事的 like_count 總和)

#### Scenario: 無收集時的統計
- **WHEN** 使用者尚未收集任何幹話
- **THEN** 所有統計數字顯示為 0

### Requirement: 快速從列表收集幹話

系統必須在幹話列表頁面提供快速收集按鈕,點擊後可直接收集或開啟對話框輸入故事。

#### Scenario: 列表頁快速收集
- **WHEN** 使用者在 `/banters` 列表頁點擊幹話卡片的「收集」按鈕
- **THEN** 系統開啟收集對話框
- **THEN** 對話框預填該幹話的內容
- **THEN** 使用者可選擇直接收集或附加故事後收集

#### Scenario: 已收集的幹話顯示狀態
- **WHEN** 使用者瀏覽幹話列表
- **THEN** 已收集的幹話卡片顯示「已收集」標記
- **THEN** 「收集」按鈕變為「查看」按鈕,點擊後前往個人收集頁面
