## 1. SVG 靜態圖標
- [x] 1.1 建立 `assets/personality/svg/` 目錄結構
- [x] 1.2 製作 Crusher (PGB) SVG：crimp 把手 + 碎裂岩石 + 大猩猩剪影，三層 group id（`layer-hold`/`layer-symbol`/`layer-animal`），viewBox `0 0 200 200`，主色 #E84545
- [x] 1.3 製作 Forger (PGS) SVG：pinch 把手 + 鐵砧火花 + 公牛剪影，主色 #F4845F
- [x] 1.4 製作 Wildfire (PFB) SVG：volume 把手 + 蔓延火焰 + 赤狐剪影，主色 #F7B731
- [x] 1.5 製作 Anchor (PFS) SVG：jug 把手 + 錨山形 + 山羊剪影，主色 #2C3E50
- [x] 1.6 製作 Sniper (TGB) SVG：side-pull 把手 + 十字準星 + 獵隼剪影，主色 #27AE60
- [x] 1.7 製作 Cipher (TGS) SVG：thin crimp 把手 + 齒輪鎖 + 章魚剪影，主色 #3742FA
- [x] 1.8 製作 Wanderer (TFB) SVG：sloper 把手 + 波浪風 + 信天翁剪影，主色 #0ABDE3
- [x] 1.9 製作 Zen (TFS) SVG：slab foothold 把手 + 圓相圓 + 貓頭鷹剪影，主色 #6C5CE7
- [x] 1.10 驗證所有 SVG：viewBox 一致、三層 group id 正確、檔案 <10KB、無外部依賴

## 2. Lottie JSON 動畫
- [x] 2.1 建立 `assets/personality/lottie/` 目錄結構
- [ ] 2.2 製作 Crusher Lottie：把手淡入(0-0.5s) -> 碎裂岩石展開(0.5-1.2s) -> 粒子碎裂(1.2-2.0s) -> 大猩猩浮現(2.0-2.5s) -> 呼吸循環(2.5-3.0s)，<30KB（⚠️ placeholder 已建立，需設計師用 After Effects 製作正式版）
- [ ] 2.3 製作 Forger Lottie：把手淡入 -> 鐵砧展開 -> 火花飛濺 -> 公牛浮現 -> 呼吸循環，<30KB（⚠️ placeholder）
- [ ] 2.4 製作 Wildfire Lottie：把手淡入 -> 火焰展開 -> 火焰脈動 -> 赤狐浮現 -> 呼吸循環，<30KB（⚠️ placeholder）
- [ ] 2.5 製作 Anchor Lottie：把手淡入 -> 錨山展開 -> 穩定下沉 -> 山羊浮現 -> 呼吸循環，<30KB（⚠️ placeholder）
- [ ] 2.6 製作 Sniper Lottie：把手淡入 -> 準星展開 -> 鎖定聚焦 -> 獵隼浮現 -> 呼吸循環，<30KB（⚠️ placeholder）
- [ ] 2.7 製作 Cipher Lottie：把手淡入 -> 齒輪展開 -> 齒輪旋轉 -> 章魚浮現 -> 呼吸循環，<30KB（⚠️ placeholder）
- [ ] 2.8 製作 Wanderer Lottie：把手淡入 -> 波浪展開 -> 波浪飄動 -> 信天翁浮現 -> 呼吸循環，<30KB（⚠️ placeholder）
- [ ] 2.9 製作 Zen Lottie：把手淡入 -> 圓相展開 -> 筆觸繪製 -> 貓頭鷹浮現 -> 呼吸循環，<30KB（⚠️ placeholder）
- [ ] 2.10 驗證所有 Lottie：檔案 <30KB、動畫長度 2.5-3.0s、60fps、循環播放正常、lottie-web 相容（⚠️ 待正式版完成後驗證）

## 3. OG 靜態圖片
- [x] 3.1 建立 `apps/web/public/quiz/og/` 目錄結構
- [x] 3.2 製作通用入口 OG 圖（quiz-default.png）：8 種圖標小尺寸排列 + 「發現你的攀岩人格」標題，1200x628 PNG
- [x] 3.3 製作 Crusher 結果 OG 圖：左側圖標圓形主色背景 + 右側類型名稱與副標，1200x628 PNG
- [x] 3.4 製作 Forger 結果 OG 圖，1200x628 PNG
- [x] 3.5 製作 Wildfire 結果 OG 圖，1200x628 PNG
- [x] 3.6 製作 Anchor 結果 OG 圖，1200x628 PNG
- [x] 3.7 製作 Sniper 結果 OG 圖，1200x628 PNG
- [x] 3.8 製作 Cipher 結果 OG 圖，1200x628 PNG
- [x] 3.9 製作 Wanderer 結果 OG 圖，1200x628 PNG
- [x] 3.10 製作 Zen 結果 OG 圖，1200x628 PNG
- [x] 3.11 驗證所有 OG 圖：尺寸 1200x628、PNG 格式、每張 <200KB、文字清晰可讀

## 4. 整合驗證
- [x] 4.1 確認檔案命名與 `PersonalityType` enum key 一致（小寫：crusher/forger/wildfire/anchor/sniper/cipher/wanderer/zen）
- [x] 4.2 確認 SVG 三層 group id 命名一致（`layer-hold`/`layer-symbol`/`layer-animal`）
- [ ] 4.3 確認 Lottie 動畫敘事段落時間點一致（⚠️ 待正式版完成後驗證）
- [x] 4.4 確認色彩值與類型映射表一致
- [x] 4.5 執行 SVG lint 檢查（無 inline style、無外部 font 引用）
